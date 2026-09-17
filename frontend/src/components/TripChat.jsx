import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, RefreshCw, AlertCircle, Flag, CheckCircle, ShieldAlert } from 'lucide-react';

export default function TripChat({ tripId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const chatContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const userScrolledUpRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 5000); // Reduce database traffic while keeping chat responsive
    return () => clearInterval(interval);
  }, [tripId]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user is more than 60px from bottom, they are reading earlier messages
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    userScrolledUpRef.current = !isNearBottom;
  };

  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;
    if (force || !userScrolledUpRef.current) {
      // Internal scroll ONLY - NEVER use scrollIntoView which scrolls the whole browser window!
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const fetchMessages = async (isFirst = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await API.get(`/chat/trips/${tripId}`);
      if (res.data.success) {
        const newMsgs = res.data.messages || [];
        setMessages(newMsgs);
        setError('');

        if (isFirst || isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          setTimeout(() => scrollToBottom(true), 100);
        } else {
          scrollToBottom(false);
        }
      } else {
        setError(String(res.data.message || 'ไม่สามารถโหลดแชทได้'));
      }
    } catch (err) {
      // Silence background polling errors
    } finally {
      fetchingRef.current = false;
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
        userScrolledUpRef.current = false;
        await fetchMessages(false);
        setTimeout(() => scrollToBottom(true), 50);
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

  // Report message feature (PDF Page 5: คำหยาบไม่มีให้กดรายงาน)
  const handleReportMessage = async (messageId) => {
    if (!window.confirm('คุณต้องการรายงานข้อความนี้ (คำหยาบคาย / ข้อความไม่เหมาะสม) ไปยังผู้ดูแลระบบใช่หรือไม่?')) return;
    try {
      const res = await API.post(`/chat/messages/${messageId}/report`, {
        reason: 'รายงานคำหยาบคาย หรือข้อความไม่เหมาะสมในการเดินทาง',
      });
      if (res.data.success) {
        setReportSuccess(String(res.data.message || 'รายงานเรียบร้อยแล้ว'));
        setTimeout(() => setReportSuccess(''), 4000);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งรายงาน');
    }
  };

  return (
    <div className="travel-card p-6 space-y-4 shadow-md border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <span>แชทกลุ่มสำหรับการเดินทางนี้ (Real-time Group Chat)</span>
        </h3>
        <button
          onClick={() => fetchMessages(false)}
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          title="อัปเดตข้อความ"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>อัปเดต</span>
        </button>
      </div>

      {reportSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Box (Controlled internal scroll, no window jumping) */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="h-72 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs scroll-smooth"
      >
        {loading ? (
          <div className="text-center py-10 text-slate-500 font-bold">กำลังเชื่อมต่อห้องแชท...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-medium">
            ยังไม่มีข้อความในแชทกลุ่มนี้ ทักทายเพื่อนร่วมทางและนัดแนะจุดขึ้นรถได้เลย!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user && (user.user_id === msg.user_id || user.id === msg.user_id);
            const msgTime = new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.message_id || msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-0.5 px-1">
                  <span>{msg.sender_name}</span>
                  {msg.sender_role === 'Admin' && <span className="text-amber-600">(แอดมิน)</span>}
                  <span className="text-[10px] text-slate-400 font-normal">{msgTime} น.</span>

                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleReportMessage(msg.message_id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-1 flex items-center gap-0.5 text-[10px]"
                      title="รายงานคำหยาบหรือข้อความไม่เหมาะสม"
                    >
                      <Flag className="w-3 h-3 text-red-400" />
                      <span>รายงาน</span>
                    </button>
                  )}
                </div>

                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs space-y-1 ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs font-medium'
                  }`}
                >
                  <p className="break-words leading-relaxed">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="พิมพ์ข้อความคุยกับเพื่อนร่วมทริป..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-3 travel-input text-xs"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-5 py-3 travel-btn-primary font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span>{sending ? 'ส่ง...' : 'ส่ง'}</span>
        </button>
      </form>
    </div>
  );
}
