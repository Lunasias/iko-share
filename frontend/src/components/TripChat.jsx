import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, RefreshCw, AlertCircle, Flag, CheckCircle, ShieldAlert, Wifi } from 'lucide-react';

export default function TripChat({ tripId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting' | 'fallback'

  const chatContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const userScrolledUpRef = useRef(false);
  const fetchingRef = useRef(false);
  const isSendingRef = useRef(false);

  useEffect(() => {
    fetchMessages(true);

    const token = localStorage.getItem('iko_token');
    let eventSource = null;
    let fallbackInterval = null;

    // Real-time Messaging via Server-Sent Events (SSE)
    const connectSSE = () => {
      try {
        const streamUrl = `/api/chat/trips/${tripId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setRealtimeStatus('connected');
        };

        eventSource.addEventListener('connected', () => {
          setRealtimeStatus('connected');
        });

        eventSource.addEventListener('new_message', (e) => {
          try {
            const incoming = JSON.parse(e.data);
            if (incoming && incoming.message_id) {
              setMessages((prev) => {
                if (prev.some((m) => m.message_id === incoming.message_id)) {
                  return prev;
                }
                return [...prev, incoming];
              });
              setTimeout(() => scrollToBottom(false), 50);
            }
          } catch (parseErr) {
            console.error('Parse incoming SSE message error:', parseErr);
          }
        });

        eventSource.onerror = () => {
          // Automatic reconnect is built into browser EventSource
          setRealtimeStatus('reconnecting');
        };
      } catch (err) {
        console.warn('SSE not supported or connection error, using adaptive fallback polling:', err);
        setRealtimeStatus('fallback');
      }
    };

    connectSSE();

    // Adaptive background interval as secondary safeguard (15s instead of 5s)
    fallbackInterval = setInterval(() => {
      fetchMessages(false);
    }, 15000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
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
    if (isSendingRef.current || sending) return;

    isSendingRef.current = true;
    setSending(true);
    setError('');
    const textToSend = newMessage.trim();

    try {
      const res = await API.post(`/chat/trips/${tripId}`, { message: textToSend });
      if (res.data.success) {
        setNewMessage('');
        userScrolledUpRef.current = false;

        // If returned message object, immediately add to state if not already received via SSE
        if (res.data.chatMessage) {
          const sentMsg = res.data.chatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.message_id === sentMsg.message_id)) return prev;
            return [...prev, sentMsg];
          });
          setTimeout(() => scrollToBottom(true), 50);
        }
      } else {
        setError(String(res.data.message || 'ไม่สามารถส่งข้อความได้'));
      }
    } catch (err) {
      console.error('Send chat error:', err);
      setError(String(err.userFriendlyMessage || err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่งข้อความ'));
    } finally {
      setSending(false);
      isSendingRef.current = false;
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
        setReportSuccess(String(res.data.message || 'ส่งรายงานไปยังผู้ดูแลระบบเรียบร้อยแล้ว'));
        setTimeout(() => setReportSuccess(''), 4000);
      } else {
        alert(String(res.data.message));
      }
    } catch (err) {
      alert(String(err.userFriendlyMessage || err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งรายงาน'));
    }
  };

  return (
    <div className="travel-card p-6 space-y-4 shadow-md border border-slate-200">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <span>แชทกลุ่มสำหรับการเดินทางนี้</span>
        </h3>
        <div className="flex items-center gap-2">
          {/* Real-time SSE Connection Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              realtimeStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : realtimeStatus === 'reconnecting'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : realtimeStatus === 'reconnecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            {realtimeStatus === 'connected'
              ? 'Real-time'
              : realtimeStatus === 'reconnecting'
              ? 'กำลังเชื่อมต่อใหม่...'
              : 'โหมดซิงค์'}
          </span>

          <button
            onClick={() => fetchMessages(false)}
            className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="อัปเดตข้อความ"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>อัปเดต</span>
          </button>
        </div>
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
        className="h-80 overflow-y-auto space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 scroll-smooth"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span>กำลังโหลดข้อความแชท...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-300 mb-1" />
            <span className="font-bold text-slate-600">ยังไม่มีข้อความสนทนาในทริปนี้</span>
            <span>ส่งข้อความเพื่อทักทายหรือนัดแนะจุดนัดพบกับเพื่อนร่วมทางได้เลย!</span>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = Number(m.user_id) === Number(user?.user_id || user?.id);

            return (
              <div
                key={m.message_id}
                className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Sender Avatar */}
                {m.sender_avatar ? (
                  <img
                    src={m.sender_avatar}
                    alt={m.sender_name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 shadow-xs mt-1"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-1 border border-emerald-200 shadow-xs">
                    {m.sender_name?.charAt(0) || 'U'}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] text-slate-500 font-bold ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span>{isMe ? 'คุณ' : m.sender_name}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="relative group/msg flex items-center gap-1">
                    <div
                      className={`p-3 rounded-2xl text-xs font-medium leading-relaxed break-words shadow-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {m.message}
                    </div>

                    {/* Report Profanity / Abusive message button (PDF Page 5 Note) */}
                    {!isMe && (
                      <button
                        onClick={() => handleReportMessage(m.message_id)}
                        className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50"
                        title="รายงานข้อความไม่เหมาะสม / คำหยาบ"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="พิมพ์ข้อความทักทายหรือนัดหมายกับเพื่อนในตี้..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="flex-1 px-4 py-3 travel-input text-xs font-medium focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-5 travel-btn-primary flex items-center justify-center gap-1.5 font-bold text-xs disabled:opacity-50 shadow-sm"
        >
          {sending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ส่ง</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
