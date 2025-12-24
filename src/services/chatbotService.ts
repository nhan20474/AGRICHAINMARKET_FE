import { io, Socket } from 'socket.io-client';
import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig';

class ChatbotService {
  private socket: Socket | null = null;

  // Kết nối Socket.IO
  connect(userId: number) {
    try {
      if (this.socket?.connected) {
        console.log('🔌 Socket already connected');
        return;
      }
      
      console.log('🔌 Connecting to socket for user:', userId);
      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket?.id);
        this.socket?.emit('register', userId);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });
    } catch (error) {
      console.error('Socket connect error:', error);
      throw error;
    }
  }

  // Ngắt kết nối
  disconnect() {
    try {
      if (this.socket) {
        console.log('🔌 Disconnecting socket');
        this.socket.disconnect();
        this.socket = null;
      }
    } catch (error) {
      console.error('Socket disconnect error:', error);
    }
  }

  // Lắng nghe response realtime từ bot
  onMessage(callback: (data: any) => void) {
    if (this.socket) {
      console.log('👂 Listening for chatbot_response');
      this.socket.on('chatbot_response', (data) => {
        console.log('📥 Received chatbot_response:', data);
        callback(data);
      });
    }
  }

  // Gửi tin nhắn
  async sendMessage(userId: number, message: string) {
    console.log('📤 Sending message to API:', { userId, message });
    
    try {
      // ✅ SỬA: Backend có thể yêu cầu user_id thay vì userId
      const payload = {
        user_id: userId,  // Thay đổi từ userId → user_id
        message: message
      };
      
      console.log('📦 Request payload:', payload);
      
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('📊 API Response status:', response.status);
      
      const data = await response.json();
      console.log('📄 API Response data:', data);
      
      if (!response.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.error || data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Send message error:', error);
      throw error;
    }
  }

  // Lấy lịch sử chat
  async getHistory(userId: number) {
    console.log('📚 Fetching chat history for user:', userId);
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/chatbot/history/${userId}`);
      
      if (!response.ok) {
        console.error('❌ Failed to get history, status:', response.status);
        throw new Error('Failed to get history');
      }
      
      const data = await response.json();
      console.log('✅ History fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Get history error:', error);
      throw error;
    }
  }

  // Xóa lịch sử chat
  async clearHistory(userId: number) {
    console.log('🗑️ Clearing chat history for user:', userId);
    
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/chatbot/history/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear history');
      }
      
      const data = await response.json();
      console.log('✅ History cleared:', data);
      return data;
    } catch (error) {
      console.error('❌ Clear history error:', error);
      throw error;
    }
  }
}

export const chatbotService = new ChatbotService();
