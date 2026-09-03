import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, RefreshCw, AlertCircle } from 'lucide-react';

export default function TripChat({ tripId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2500); // Poll every 2.5 seconds
    return () => clearInterval(interval);
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/chat/trips/${tripId}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
        setError('');
      } else {
        setError(String(res.data.message || 'ไม่สามารถโหลดแชทได้'));
      }
    } catch (err) {
      // Silence intermittent polling network errors
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError('');
    try {
      const res = await API.post(`/chat/trips/${tripId}`, { message: newMessage });
      if (res.data.success) {
        setNewMessage('');
        fetchMessages();
      } else {
        setError(String(res.data.message || 'ไม่สามารถส่งข้อความได้'));
      }
    } catch (err) {
      console.error('Send chat error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่งข้อความ'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="neu-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <h3 className="text-sm font-extrabold text-[#3D4852] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#6C63FF]" />
          <span>แชทกลุ่มสำหรับการเดินทางนี้ (Real-time Chat)</span>
        </h3>
        <button
          onClick={fetchMessages}
          className="text-xs font-bold text-[#6B7280] hover:text-[#6C63FF] flex items-center gap-1"
          title="รีเฟรชข้อความ"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>อัปเดต</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Box */}
      <div className="h-64 overflow-y-auto space-y-3 p-4 neu-inset text-xs">
        {loading ? (
          <div className="text-center py-10 text-[#6B7280] font-semibold">กำลังโหลดข้อความ...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-[#6B7280] font-semibold">ยังไม่มีข้อความในแชทกลุ่มนี้ เริ่มพูดคุยกันได้เลย</div>
        ) : (
          messages.map((msg) => {
            const isMe = user && (user.user_id === msg.user_id || user.id === msg.user_id);
            return (
              <div key={msg.message_id || msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] font-bold text-[#6B7280] mb-0.5 px-1">
                  {msg.sender_name} {msg.sender_role === 'Admin' ? '(แอดมิน)' : ''}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs space-y-1 ${
                    isMe
                      ? 'neu-button-primary text-white rounded-br-none'
                      : 'neu-card-sm text-[#3D4852] rounded-bl-none'
                  }`}
                >
                  <p className="break-words font-medium">{msg.message}</p>
                  <div className="text-[9px] opacity-75 text-right">
                    {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Input */}
      <form onSubmit={handleSend} className="flex gap-3">
        <input
          type="text"
          placeholder="พิมพ์ข้อความถึงเพื่อนร่วมทาง..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-3 neu-input text-xs"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-5 py-3 neu-button-primary font-bold text-xs disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
          <span>ส่ง</span>
        </button>
      </form>
    </div>
  );
}
