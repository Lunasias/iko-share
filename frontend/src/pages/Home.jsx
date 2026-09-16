import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Search, MapPin, Calendar as CalendarIcon, ShieldCheck, Users, HeartHandshake, Sparkles, Compass } from 'lucide-react';

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();
  const { t } = useTheme();

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    navigate(`/trips?${params.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 text-center px-4 reveal-on-scroll">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--muted)] border border-[var(--border)] text-[var(--accent)] motion-shimmer rounded-full text-xs font-black shadow-2xs">
            <Compass className="w-4 h-4 text-[var(--accent)] motion-orbit" />
            <span>{t('badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight font-['Plus_Jakarta_Sans',sans-serif]">
            {t('headline')} <br className="hidden sm:block" />
            {t('headlineEnd')} <span className="text-[var(--accent)] underline decoration-[var(--accent-secondary)]">Iko Share</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium">
            {t('description')}
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto travel-card p-4 sm:p-5 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 shadow-lg border border-slate-200 transition-shadow duration-300 focus-within:shadow-xl"
          >
            <div className="flex-1 flex items-center gap-2 px-4 py-3 travel-input">
              <MapPin className="w-5 h-5 text-[var(--accent)] shrink-0" />
              <input
                type="text"
                placeholder={t('origin')}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-4 py-3 travel-input">
              <MapPin className="w-5 h-5 text-[var(--accent-secondary)] shrink-0" />
              <input
                type="text"
                placeholder={t('destination')}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-4 py-3 travel-input">
              <CalendarIcon className="w-5 h-5 text-[var(--accent)] shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 travel-btn-primary px-8 py-3 font-bold text-sm shadow-md"
            >
              <Search className="w-5 h-5" />
              <span>{t('search')}</span>
            </button>
          </form>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="travel-card p-8 space-y-4 travel-card-hover border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-[var(--muted)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">แชร์ค่าน้ำมัน เที่ยวได้บ่อยขึ้น</h3>
          <p className="text-slate-600 text-xs leading-relaxed font-medium">
            หารเฉลี่ยค่าน้ำมันและค่าเดินทางอย่างยุติธรรม ช่วยให้ผู้ขับขี่และผู้ร่วมทริปประหยัดเงินในกระเป๋า
          </p>
        </div>

        <div className="travel-card p-8 space-y-4 travel-card-hover border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-[var(--muted)] text-[var(--accent-secondary)] border border-[var(--border)] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">ระบบคัดกรอง & อนุมัติเข้าตี้</h3>
          <p className="text-slate-600 text-xs leading-relaxed font-medium">
            คนขับสามารถตรวจสอบประวัติ รีวิว และกดอนุมัติเพื่อนร่วมทางที่ตรงกับสไตล์การเดินทางของคุณ
          </p>
        </div>

        <div className="travel-card p-8 space-y-4 travel-card-hover border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-[var(--muted)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">สร้างความทรงจำ & มิตรภาพ</h3>
          <p className="text-slate-600 text-xs leading-relaxed font-medium">
            แชร์ภาพถ่ายเรื่องราวความประทับใจหลังจบทริป และสร้างเครือข่ายเพื่อนร่วมทางสายลุยไปด้วยกัน
          </p>
        </div>
      </section>
    </div>
  );
}
