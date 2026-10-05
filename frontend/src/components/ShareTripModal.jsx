import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Share2, Copy, Check, X, QrCode, ExternalLink, Sparkles, MessageCircle, FileText
} from 'lucide-react';

export default function ShareTripModal({ isOpen, onClose, trip }) {
  const { isTh } = useTheme();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Close on Escape key & prevent body scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trip || typeof document === 'undefined') return null;

  const tripId = trip.trip_id || trip.id || '';
  const originUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://iko-share-orcin.vercel.app';
  const shareUrl = `${originUrl}/trips/${tripId}`;

  // Safe Date parsing
  let dateFormatted = '-';
  let timeFormatted = '-';
  try {
    if (trip.departure_time) {
      const d = new Date(trip.departure_time);
      if (!isNaN(d.getTime())) {
        dateFormatted = d.toLocaleDateString(isTh ? 'th-TH' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        timeFormatted = d.toLocaleTimeString(isTh ? 'th-TH' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  } catch (err) {
    console.warn('Date parsing error in ShareTripModal:', err);
  }

  const originName = trip.origin || (isTh ? 'จุดเริ่มต้น' : 'Origin');
  const destName = trip.destination || (isTh ? 'ปลายทาง' : 'Destination');
  const seatsLeft = trip.available_seats ?? 1;
  const priceDisplay = parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : (isTh ? 'ฟรี' : 'Free');

  const shareTitle = `🚗 ชวนร่วมทาง: ${originName} ➔ ${destName} (${dateFormatted})`;
  const shareText = `🚗 ร่วมทางไปด้วยกัน! เส้นทาง ${originName} ➔ ${destName}
📅 วันที่: ${dateFormatted} เวลา ${timeFormatted} น.
💺 เหลือที่ว่าง: ${seatsLeft} ที่นั่ง
💰 ค่าโดยสาร: ${priceDisplay}
ดูรายละเอียดและขอร่วมทริปได้ที่ IkoShare:`;

  // Robust cross-browser clipboard copy with fallback
  const copyToClipboard = async (text, type = 'link') => {
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback copy error:', err);
      }
    }

    if (success) {
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2500);
      }
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n${shareUrl}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to copy:', err);
          copyToClipboard(shareUrl, 'link');
        }
      }
    } else {
      copyToClipboard(shareUrl, 'link');
    }
  };

  // Standard LINE share URL that works seamlessly on both mobile apps and web
  const lineShareUrl = `https://line.me/R/share?text=${encodeURIComponent(`${shareTitle}\n\n${shareText}\n${shareUrl}`)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}&format=svg`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overlay-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 relative modal-enter max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isTh ? 'แชร์ทริปนี้' : 'Share This Trip'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isTh ? 'ชวนเพื่อนหรือแชร์ลงโซเชียลเพื่อหาผู้ร่วมทาง' : 'Invite companions or share on social media'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trip Summary Card Preview */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-900">
            <span className="truncate max-w-[140px]">{originName}</span>
            <span className="text-emerald-600 font-bold px-1">➔</span>
            <span className="truncate max-w-[140px] text-right">{destName}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-emerald-200/70">
            <span>📅 {dateFormatted} • {timeFormatted} น.</span>
            <span className="font-bold text-emerald-800">
              {priceDisplay}
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
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#06C755]/10 hover:bg-[#06C755]/20 border border-[#06C755]/30 text-[#06C755] font-bold text-xs transition-all shadow-xs hover:scale-102"
              title={isTh ? 'แชร์เข้า LINE ทันที' : 'Share to LINE'}
            >
              <div className="w-8 h-8 rounded-full bg-[#06C755] text-white flex items-center justify-center font-black text-sm shadow-xs">
                L
              </div>
              <span className="text-[11px] font-black text-slate-800">LINE</span>
            </a>

            {/* Facebook */}
            <a
              href={fbShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] font-bold text-xs transition-all shadow-xs hover:scale-102"
              title={isTh ? 'แชร์ลง Facebook' : 'Share to Facebook'}
            >
              <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-black text-sm shadow-xs">
                f
              </div>
              <span className="text-[11px] font-black text-slate-800">Facebook</span>
            </a>

            {/* X / Twitter */}
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-900/10 hover:bg-slate-900/20 border border-slate-300 text-slate-900 font-bold text-xs transition-all shadow-xs hover:scale-102"
              title={isTh ? 'แชร์ลง X (Twitter)' : 'Share to X'}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
                𝕏
              </div>
              <span className="text-[11px] font-black text-slate-800">X</span>
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
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {copiedLink ? (
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

        {/* Copy Full Message Button */}
        <div>
          <button
            type="button"
            onClick={() => copyToClipboard(`${shareTitle}\n\n${shareText}\n${shareUrl}`, 'text')}
            className={`w-full py-2.5 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              copiedText
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4" />
                <span>{isTh ? 'คัดลอกข้อความชวนร่วมทางเรียบร้อยแล้ว!' : 'Invitation message copied!'}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{isTh ? 'คัดลอกข้อความเต็มพร้อมลิงก์ (พร้อมส่งในแชท)' : 'Copy Full Invite Message & Link'}</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile QR & Native Web Share */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>{showQr ? (isTh ? 'ซ่อน QR Code' : 'Hide QR') : (isTh ? 'สแกน QR บนมือถือ' : 'Mobile QR Code')}</span>
          </button>

          {typeof navigator !== 'undefined' && navigator.share ? (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isTh ? 'แชร์ผ่านแอปอื่น' : 'Share via App'}</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">
              Iko Share Platform
            </span>
          )}
        </div>

        {/* QR Code view toggle */}
        {showQr && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2.5 modal-enter">
            <p className="text-xs font-bold text-slate-700">
              {isTh ? 'สแกน QR Code นี้ด้วยกล้องมือถือเพื่อเปิดทริป' : 'Scan this QR code with mobile camera to view trip'}
            </p>
            <div className="inline-block p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
              <img
                src={qrCodeUrl}
                alt="Trip Share QR Code"
                className="w-40 h-40 mx-auto object-contain"
                loading="lazy"
              />
            </div>
            <div>
              <a
                href={qrCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{isTh ? 'เปิดดูรูป QR Code ขนาดเต็ม' : 'Open Full QR Image'}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
