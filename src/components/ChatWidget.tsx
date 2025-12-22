import React, { useEffect, useState, useRef } from 'react';
import { chatbotService } from '../services/chatbotService';
import '../styles/ChatWidget.css';

/* ===================== TYPES ===================== */
type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

/* ===================== GET USER / GUEST ID ===================== */
function getUserId(): number | 'guest' {
  try {
    const s = localStorage.getItem('user');
    if (s) {
      const parsed = JSON.parse(s);
      const id = Number(parsed.id);
      if (Number.isFinite(id)) return id;
    }
  } catch {}

  // 👉 GUEST
  return 'guest';
}

/* ===================== COMPONENT ===================== */
const ChatWidget: React.FC = () => {
  const userId = getUserId();
  const isGuest = userId === 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ===================== AUTO SCROLL ===================== */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ===================== LOCAL STORAGE (USER ONLY) ===================== */
  const saveToLocalStorage = (msgs: Message[]) => {
    if (isGuest) return;
    localStorage.setItem(`chat_history_${userId}`, JSON.stringify(msgs));
  };

  /* ===================== LOAD HISTORY (USER ONLY) ===================== */
  const loadHistory = async () => {
    if (isGuest) return;

    try {
      const localHistory = localStorage.getItem(`chat_history_${userId}`);
      if (localHistory) {
        setMessages(
          JSON.parse(localHistory).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      }

      const history = await chatbotService.getHistory(userId);
      if (Array.isArray(history)) {
        const msgs: Message[] = [];
        let id = Date.now();

        history.forEach((h: any) => {
          const time = new Date(h.created_at || Date.now());
          if (h.message)
            msgs.push({ id: id++, text: h.message, sender: 'user', timestamp: time });
          if (h.response)
            msgs.push({ id: id++, text: h.response, sender: 'bot', timestamp: time });
        });

        if (msgs.length) {
          setMessages(msgs);
          saveToLocalStorage(msgs);
        }
      }
    } catch (e) {
      console.error('Load history error', e);
    }
  };

  /* ===================== SOCKET (USER ONLY) ===================== */
  useEffect(() => {
    if (isGuest) return;

    chatbotService.connect(userId);
    loadHistory();

    chatbotService.onMessage((data: any) => {
      const botText = data.response || data.message || 'Xin lỗi, tôi chưa hiểu.';

      setMessages(prev => {
        const next: Message[] = [
          ...prev,
          {
            id: Date.now(),
            text: botText,
            sender: 'bot',
            timestamp: new Date(),
          },
        ];
        saveToLocalStorage(next);
        return next;
      });

      setIsLoading(false);
    });

    return () => chatbotService.disconnect();
  }, [userId]);

  /* ===================== SEND ===================== */
  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // 👉 GUEST BEHAVIOR
    if (isGuest) {
      setIsLoading(true);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            text: '🔒 Vui lòng đăng nhập để trò chuyện với AI.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 600);
      return;
    }

    // 👉 USER BEHAVIOR
    setIsLoading(true);
    await chatbotService.sendMessage(userId, userMsg.text);
  };

  /* ===================== CLEAR (USER ONLY) ===================== */
  const handleClearHistory = async () => {
    if (isGuest) return alert('Vui lòng đăng nhập');
    await chatbotService.clearHistory(userId);
    setMessages([]);
    localStorage.removeItem(`chat_history_${userId}`);
  };

  /* ===================== UI ===================== */
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
            <strong>🤖 Trợ lý AI</strong>
            <small>{isGuest ? 'Đăng nhập để dùng AI' : 'Powered by Gemini'}</small>
            <div>
              {!isGuest && <button onClick={handleClearHistory}>🗑️</button>}
              <button onClick={() => setIsOpen(false)}>×</button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`msg ${m.sender}`}>
                {m.text}
              </div>
            ))}

            {isLoading && <div className="msg bot">Đang trả lời...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
            />
            <button onClick={handleSend}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
