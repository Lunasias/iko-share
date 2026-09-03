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
    <div className="glass-card p-6 rounded-3xl border border-sky-500/20 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <h3 className="text-base font-bold text-sky-200 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-400" />
          <span>แชทกลุ่มสำหรับการเดินทางนี้ (Real-time Chat)</span>
        </h3>
        <button
          onClick={fetchMessages}
          className="text-xs text-slate-400 hover:text-sky-300 flex items-center gap-1"
          title="รีเฟรชข้อความ"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>อัปเดต</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Box */}
      <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-2xl glass-panel text-sm">
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">กำลังโหลดข้อความ...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">ยังไม่มีข้อความในแชทกลุ่มนี้ เริ่มพูดคุยกันได้เลย</div>
        ) : (
          messages.map((msg) => {
            const isMe = user && (user.user_id === msg.user_id || user.id === msg.user_id);
            return (
              <div key={msg.message_id || msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                  {msg.sender_name} {msg.sender_role === 'Admin' ? '(แอดมิน)' : ''}
                </div>
                <div
                  className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs space-y-1 ${
                    isMe
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
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
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="พิมพ์ข้อความถึงเพื่อนร่วมทาง..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
          <span>ส่ง</span>
        </button>
      </form>
    </div>
  );
}
