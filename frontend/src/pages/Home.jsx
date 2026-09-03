import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar as CalendarIcon, ShieldCheck, Users, HeartHandshake, ArrowRight } from 'lucide-react';

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();

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
      <section className="relative overflow-hidden pt-12 pb-20 text-center px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-sky-300 text-xs font-semibold border border-sky-400/20 shadow-inner">
            <HeartHandshake className="w-4 h-4 text-sky-400" />
            <span>แพลตฟอร์มคาร์พูลร่วมเดินทางอันดับ 1 ในไทย</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-400 bg-clip-text text-transparent leading-tight">
            เดินทางประหยัด เป็นมิตร ปลอดภัย <br className="hidden sm:block" />
            ไปทางเดียวกัน ติดรถไปกับ <span className="text-sky-400">Iko Share</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            ลดค่าใช้จ่ายในการเดินทาง เชื่อมต่อเพื่อนร่วมทางสายเดียวกัน ประหยัดทั้งพลังงานและค่าน้ำมัน
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto glass-card p-4 rounded-2xl border border-sky-500/20 shadow-2xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
          >
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl glass-input">
              <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
              <input
                type="text"
                placeholder="ต้นทาง (เช่น กรุงเทพฯ)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder:text-slate-500"
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl glass-input">
              <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                type="text"
                placeholder="ปลายทาง (เช่น เชียงใหม่)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder:text-slate-500"
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl glass-input">
              <CalendarIcon className="w-5 h-5 text-sky-400 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full text-slate-300"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-sky-500/25 transition-all"
            >
              <Search className="w-5 h-5" />
              <span>ค้นหา</span>
            </button>
          </form>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3 hover:border-sky-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-sky-200">แชร์ค่าน้ำมันคุ้มค่า</h3>
          <p className="text-slate-400 text-sm">
            หารเฉลี่ยค่าเดินทางอย่างยุติธรรม ช่วยให้ผู้ขับขี่และผู้โดยสารประหยัดงบในทุกเที่ยวเดินทาง
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3 hover:border-sky-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-sky-200">ตรวจสอบตัวตนปลอดภัย</h3>
          <p className="text-slate-400 text-sm">
            ระบบยืนยันผู้ใช้งานเพื่อความปลอดภัย อุ่นใจทั้งผู้ขับขี่และเพื่อนร่วมเดินทางตลอดเส้นทาง
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3 hover:border-sky-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-sky-200">สร้างมิตรภาพระหว่างทาง</h3>
          <p className="text-slate-400 text-sm">
            เปลี่ยนการเดินทางคนเดียวให้มีความหมาย พบเจอมิตรภาพใหม่ๆ บนเส้นทางเดียวกัน
          </p>
        </div>
      </section>
    </div>
  );
}
