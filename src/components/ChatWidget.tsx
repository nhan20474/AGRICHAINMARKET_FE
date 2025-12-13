import React, { useEffect, useState, useRef } from 'react';
import { chatbotService } from '../services/chatbotService';
import '../styles/ChatWidget.css';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

function getUserId() {
  try {
    const s = localStorage.getItem('user');
    if (!s) return null;
    return Number(JSON.parse(s).id);
  } catch {
    return null;
  }
}

const ChatWidget: React.FC = () => {
  const userId = getUserId();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ HÀM LƯU VÀO LOCALSTORAGE
  const saveToLocalStorage = (msgs: Message[]) => {
    if (!userId) return;
    try {
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(msgs));
    } catch (err) {
      console.error('Failed to save chat history to localStorage:', err);
    }
  };

  // ✅ SỬA LẠI HÀM LOAD HISTORY - XỬ LÝ ĐÚNG FORMAT [{message, response, created_at}]
  const loadHistory = async () => {
    if (!userId) return;
    try {
      console.log('📚 Loading chat history...');
      
      // Load từ localStorage trước
      const localHistory = localStorage.getItem(`chat_history_${userId}`);
      if (localHistory) {
        const localMsgs = JSON.parse(localHistory);
        console.log('📦 Loaded from localStorage:', localMsgs);
        setMessages(localMsgs.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      }

      // Load từ API để sync
      const history = await chatbotService.getHistory(userId);
      console.log('📚 History from API:', history);
      
      // ✅ XỬ LÝ FORMAT: [{message: "user msg", response: "bot msg", created_at}]
      if (history && Array.isArray(history) && history.length > 0) {
        const msgs: Message[] = [];
        let idCounter = Date.now();
        
        history.forEach((item: any) => {
          const timestamp = new Date(item.created_at || Date.now());
          
          // ✅ THÊM TIN NHẮN USER
          if (item.message) {
            msgs.push({
              id: idCounter++,
              text: item.message,
              sender: 'user',
              timestamp: timestamp
            });
          }
          
          // ✅ THÊM TIN NHẮN BOT (ngay sau user message)
          if (item.response) {
            msgs.push({
              id: idCounter++,
              text: item.response,
              sender: 'bot',
              timestamp: timestamp
            });
          }
        });
        
        if (msgs.length > 0) {
          setMessages(msgs);
          saveToLocalStorage(msgs);
        }
      }
    } catch (err) {
      console.error('❌ Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    console.log('🤖 Chatbot initializing for user:', userId);
    
    chatbotService.connect(userId);
    loadHistory();

    chatbotService.onMessage((data) => {
      console.log('📥 Received bot response:', data);
      
      const botMessage = data.response || data.message || 'Xin lỗi, tôi không hiểu.';
      
      // ✅ THÊM TIN NHẮN BOT VÀO STATE VÀ LƯU
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          {
            id: Date.now(),
            text: botMessage,
            sender: 'bot' as const,
            timestamp: new Date(),
          },
        ];
        saveToLocalStorage(newMessages);
        return newMessages;
      });
      
      setIsLoading(false);
    });

    return () => {
      chatbotService.disconnect();
    };
  }, [userId]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !userId || isLoading) return;

    console.log('📤 Sending message:', inputMessage);

    const userMsg: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    // ✅ THÊM TIN NHẮN USER VÀO STATE VÀ LƯU
    setMessages((prev) => {
      const newMessages = [...prev, userMsg];
      saveToLocalStorage(newMessages);
      return newMessages;
    });
    
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      await chatbotService.sendMessage(userId, messageToSend);
      console.log('✅ Message sent successfully');
      // Chờ socket trả về response
    } catch (err: any) {
      console.error('❌ Failed to send message:', err);
      
      let errorMessage = 'Xin lỗi, có lỗi xảy ra.';
      
      if (err.message) {
        if (err.message.includes('Gemini') || err.message.includes('AI')) {
          errorMessage = '🤖 AI đang bảo trì. Vui lòng thử lại sau.';
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          errorMessage = '📡 Lỗi kết nối. Vui lòng kiểm tra internet.';
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          {
            id: Date.now(),
            text: errorMessage,
            sender: 'bot' as const,
            timestamp: new Date(),
          },
        ];
        saveToLocalStorage(newMessages);
        return newMessages;
      });
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!userId || !confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?'))
      return;
    try {
      await chatbotService.clearHistory(userId);
      setMessages([]);
      localStorage.removeItem(`chat_history_${userId}`);
      console.log('🗑️ Chat history cleared');
    } catch (err) {
      console.error('❌ Failed to clear history:', err);
      alert('Không thể xóa lịch sử chat');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!userId) return null;

  return (
    <>
      {!isOpen && (
        <button className="chat-bubble-btn" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-header-icon">🤖</span>
              <div>
                <div className="chat-header-title">Trợ lý AI</div>
                <div className="chat-header-subtitle">Powered by Gemini</div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                className="chat-header-btn"
                onClick={handleClearHistory}
                title="Xóa lịch sử"
              >
                🗑️
              </button>
              <button
                className="chat-header-btn close-btn"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div className="chat-empty-icon">👋</div>
                <div>Xin chào! Tôi là trợ lý AI.</div>
                <div style={{ fontSize: 12, marginTop: 8, color: '#666' }}>
                  Hỏi tôi về sản phẩm, đơn hàng, hoặc bất cứ điều gì!
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                <div className={`message-bubble ${msg.sender}`}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message-wrapper bot">
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={isLoading || !inputMessage.trim()}
            >
              📤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
