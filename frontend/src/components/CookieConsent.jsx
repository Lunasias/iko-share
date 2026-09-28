import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, FileText, Check, Settings, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CookieConsent({ onOpenTerms }) {
  const { language } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem('iko_cookie_consent');
    if (!savedConsent) {
      // Delay slightly for smooth entrance after page loads
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }

    // Listen for custom trigger to reopen settings from footer
    const handleReopen = () => setIsVisible(true);
    window.addEventListener('open-cookie-settings', handleReopen);
    return () => window.removeEventListener('open-cookie-settings', handleReopen);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('iko_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('iko_cookie_consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const isTh = language === 'th';

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 md:max-w-2xl md:mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-200/90 text-slate-800 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight">
                {isTh ? 'การใช้งานคุกกี้และความเป็นส่วนตัว (Cookie & PDPA)' : 'Cookie Notice & Privacy'}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">Iko Share Platform</p>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            title="ปิดชั่วคราว"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {isTh ? (
            <>
              เว็บไซต์นี้ใช้คุกกี้ที่จำเป็นสำหรับการเข้าสู่ระบบ (Authentication) และความปลอดภัยในการใช้งานร่วมเดินทาง รวมถึงคุกกี้จดจำการตั้งค่าภาษา เพื่อมอบประสบการณ์ที่ดีที่สุดในการใช้งานตามมาตรฐาน พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA){' '}
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
              >
                <span>อ่านนโยบายความเป็นส่วนตัวและคุกกี้</span>
              </button>
            </>
          ) : (
            <>
              We use strictly necessary cookies for authentication and platform security, plus preference cookies for language selection in compliance with PDPA guidelines.{' '}
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
              >
                <span>Read Cookie & Privacy Policy</span>
              </button>
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleAcceptEssential}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors text-center"
          >
            {isTh ? 'ยอมรับเฉพาะที่จำเป็น' : 'Essential Only'}
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto px-5 py-2.5 travel-btn-primary font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 text-center"
          >
            <Check className="w-4 h-4" />
            <span>{isTh ? 'ยอมรับทั้งหมด' : 'Accept All'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
