import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Share2, Copy, Check, X, QrCode, ExternalLink, Sparkles, MessageCircle
} from 'lucide-react';

export default function ShareTripModal({ isOpen, onClose, trip }) {
  const { isTh } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen || !trip) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${originUrl}/trips/${trip.trip_id}`;
  const departureDate = new Date(trip.departure_time);
  const dateFormatted = departureDate.toLocaleDateString(isTh ? 'th-TH' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timeFormatted = departureDate.toLocaleTimeString(isTh ? 'th-TH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const shareTitle = `🚗 ชวนร่วมทาง: ${trip.origin} ➔ ${trip.destination} (${dateFormatted})`;
  const shareText = `🚗 ร่วมทางไปด้วยกัน! เส้นทาง ${trip.origin} ➔ ${trip.destination}
📅 วันที่ ${dateFormatted} เวลา ${timeFormatted} น.
💺 เหลือที่ว่าง: ${trip.available_seats || 1} ที่นั่ง
💰 ค่าโดยสาร: ${parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : 'ฟรี'}
ดูรายละเอียดและเข้าร่วมทริปได้ที่ IkoShare:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n${shareUrl}`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}&format=svg`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 relative animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isTh ? 'แชร์ทริปนี้' : 'Share This Trip'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isTh ? 'ชวนเพื่อนหรือแชร์ลงโซเชียลเพื่อหาผู้ร่วมทาง' : 'Invite friends or share on social media'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trip Summary Card Preview */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-900">
            <span className="truncate max-w-[140px]">{trip.origin}</span>
            <span className="text-emerald-600 font-bold px-1">➔</span>
            <span className="truncate max-w-[140px] text-right">{trip.destination}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
            <span>📅 {dateFormatted} • {timeFormatted} น.</span>
            <span className="font-bold text-emerald-800">
              {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : (isTh ? 'ฟรี' : 'Free')}
            </span>
          </div>
        </div>

        {/* Quick Social Buttons */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {isTh ? 'แชร์ไปยังโซเชียลมีเดีย' : 'Share to Social Media'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* LINE */}
            <a
              href={lineShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-[#06C755]/10 hover:bg-[#06C755]/20 border border-[#06C755]/30 text-[#06C755] font-bold text-xs transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#06C755] text-white flex items-center justify-center font-black text-xs shadow-xs">
                L
              </div>
              <span className="text-[11px] font-black">LINE</span>
            </a>

            {/* Facebook */}
            <a
              href={fbShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] font-bold text-xs transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-black text-xs shadow-xs">
                f
              </div>
              <span className="text-[11px] font-black">Facebook</span>
            </a>

            {/* X / Twitter */}
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-slate-900/10 hover:bg-slate-900/20 border border-slate-300 text-slate-900 font-bold text-xs transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[11px] shadow-xs">
                𝕏
              </div>
              <span className="text-[11px] font-black">X</span>
            </a>
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {isTh ? 'คัดลอกลิงก์ทริป' : 'Copy Trip Link'}
          </label>
          <div className="flex items-center gap-2 p-1.5 pl-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-emerald-500 transition-colors">
            <span className="text-xs text-slate-600 font-mono truncate select-all flex-1">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isTh ? 'คัดลอกแล้ว' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isTh ? 'คัดลอก' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile QR & Native Share */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>{showQr ? (isTh ? 'ซ่อน QR Code' : 'Hide QR') : (isTh ? 'สแกนเปิดบนมือถือ (QR)' : 'Mobile QR Code')}</span>
          </button>

          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isTh ? 'แชร์ผ่านแอปอื่น' : 'Share via App'}</span>
            </button>
          )}
        </div>

        {/* QR Code view toggle */}
        {showQr && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 animate-in fade-in duration-150">
            <p className="text-xs font-bold text-slate-700">
              {isTh ? 'สแกน QR Code นี้ด้วยกล้องมือถือเพื่อเปิดทริป' : 'Scan this QR code with mobile camera to view trip'}
            </p>
            <div className="inline-block p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
              <img
                src={qrCodeUrl}
                alt="Trip Share QR Code"
                className="w-36 h-36 mx-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
