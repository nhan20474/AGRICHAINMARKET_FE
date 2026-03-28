import { io, Socket } from 'socket.io-client';
import { API_CONFIG, SOCKET_IO_OPTIONS, fetchWithTimeout } from '../config/apiConfig';

const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.debug('[chatbot]', ...args);
};

class ChatbotService {
  private socket: Socket | null = null;

  connect(userId: number) {
    try {
      if (this.socket?.connected) {
        return;
      }

      devLog('connecting socket, userId=', userId);
      this.socket = io(API_CONFIG.SOCKET_URL, {
        ...SOCKET_IO_OPTIONS,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        devLog('socket connected');
        this.socket?.emit('register', userId);
      });

      this.socket.on('disconnect', () => {
        devLog('socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connect_error:', error.message);
      });
    } catch (error) {
      console.error('Socket connect failed');
      throw error;
    }
  }

  disconnect() {
    try {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    } catch (error) {
      console.error('Socket disconnect error');
    }
  }

  onMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('chatbot_response', (data) => {
        callback(data);
      });
    }
  }

  async sendMessage(userId: number, message: string) {
    try {
      const payload = {
        user_id: userId,
        message: message,
      };

      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (import.meta.env.DEV && error instanceof Error) {
        console.error('Send chatbot message:', error.message);
      }
      throw error;
    }
  }

  async getHistory(userId: number) {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/chatbot/history/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to get history');
      }

      return await response.json();
    } catch (error) {
      if (import.meta.env.DEV && error instanceof Error) {
        console.error('Get chat history:', error.message);
      }
      throw error;
    }
  }

  async clearHistory(userId: number) {
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/chatbot/history/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      return await response.json();
    } catch (error) {
      if (import.meta.env.DEV && error instanceof Error) {
        console.error('Clear chat history:', error.message);
      }
      throw error;
    }
  }
}

export const chatbotService = new ChatbotService();
