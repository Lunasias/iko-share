import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Bell, CheckCheck, Trash2, ExternalLink, ShieldCheck,
  CreditCard, Car, Sparkles, MessageSquare, AlertCircle, X
} from 'lucide-react';

export default function NotificationDropdown({ isMobile = false }) {
  const { isTh } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Non-blocking error for background notification polling
      console.warn('Notification fetch notice:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 45 seconds while user is active
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleMarkAsRead = async (id, linkUrl) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}

    if (linkUrl) {
      setIsOpen(false);
      navigate(linkUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
      setUnreadCount((prev) => {
        const item = notifications.find((n) => n.notification_id === id);
        return item && !item.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch {}
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffSec < 60) return isTh ? 'เมื่อสักครู่' : 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} ${isTh ? 'นาทีที่แล้ว' : 'mins ago'}`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ${isTh ? 'ชั่วโมงที่แล้ว' : 'hours ago'}`;
    return date.toLocaleDateString(isTh ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' });
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'verification':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'booking':
      case 'trip':
        return <Car className="w-4 h-4 text-indigo-600" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-teal-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title={isTh ? 'การแจ้งเตือน' : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black shadow-xs ring-2 ring-white animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            isMobile ? 'right-0' : 'right-0'
          } mt-2 w-80 sm:w-96 max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">
                {isTh ? 'การแจ้งเตือน' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} {isTh ? 'ใหม่' : 'new'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                title={isTh ? 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมด' : 'Mark all as read'}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isTh ? 'อ่านทั้งหมด' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  {isTh ? 'ยังไม่มีการแจ้งเตือนใหม่' : 'No new notifications'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isTh ? 'ระบบจะแจ้งเตือนเมื่อมีเพื่อนร่วมทางหรือสถานะอัปเดต' : 'Updates about rides and bookings will appear here'}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notification_id}
                  onClick={() => handleMarkAsRead(n.notification_id, n.link_url)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    !n.is_read ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* Type Icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                    !n.is_read ? 'bg-white border border-emerald-200' : 'bg-slate-100'
                  }`}>
                    {getIconForType(n.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className={`text-xs truncate ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.link_url && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold pt-1">
                        <span>{isTh ? 'ดูรายละเอียด' : 'View'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Unread dot / Delete action */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, n.notification_id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-lg transition-opacity"
                      title={isTh ? 'ลบ' : 'Delete'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
