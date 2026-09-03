import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar as CalendarIcon, ShieldCheck, Users, HeartHandshake } from 'lucide-react';

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
      <section className="relative pt-12 pb-16 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 neu-pill text-[#6C63FF] text-xs font-bold">
            <HeartHandshake className="w-4 h-4" />
            <span>แพลตฟอร์มคาร์พูลร่วมเดินทางอันดับ 1 ในไทย</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#3D4852] leading-tight font-['Plus_Jakarta_Sans',sans-serif]">
            เดินทางประหยัด เป็นมิตร ปลอดภัย <br className="hidden sm:block" />
            ไปทางเดียวกัน ติดรถไปกับ <span className="text-[#6C63FF]">Iko Share</span>
          </h1>

          <p className="text-[#6B7280] text-sm sm:text-base max-w-2xl mx-auto font-medium">
            ลดค่าใช้จ่ายในการเดินทาง เชื่อมต่อเพื่อนร่วมทางสายเดียวกัน ประหยัดทั้งพลังงานและค่าน้ำมัน
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto neu-card p-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
          >
            <div className="flex-1 flex items-center gap-2 px-4 py-3 neu-input">
              <MapPin className="w-5 h-5 text-[#6C63FF] shrink-0" />
              <input
                type="text"
                placeholder="ต้นทาง (เช่น กรุงเทพฯ)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-4 py-3 neu-input">
              <MapPin className="w-5 h-5 text-[#38B2AC] shrink-0" />
              <input
                type="text"
                placeholder="ปลายทาง (เช่น เชียงใหม่)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-4 py-3 neu-input">
              <CalendarIcon className="w-5 h-5 text-[#6C63FF] shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 neu-button-primary px-7 py-3 font-bold text-sm"
            >
              <Search className="w-5 h-5" />
              <span>ค้นหา</span>
            </button>
          </form>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neu-card p-8 space-y-4 neu-card-hover">
          <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-[#6C63FF]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#3D4852]">แชร์ค่าน้ำมันคุ้มค่า</h3>
          <p className="text-[#6B7280] text-xs leading-relaxed">
            หารเฉลี่ยค่าเดินทางอย่างยุติธรรม ช่วยให้ผู้ขับขี่และผู้โดยสารประหยัดงบในทุกเที่ยวเดินทาง
          </p>
        </div>

        <div className="neu-card p-8 space-y-4 neu-card-hover">
          <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-[#38B2AC]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#3D4852]">ตรวจสอบตัวตนปลอดภัย</h3>
          <p className="text-[#6B7280] text-xs leading-relaxed">
            ระบบยืนยันผู้ใช้งานเพื่อความปลอดภัย อุ่นใจทั้งผู้ขับขี่และเพื่อนร่วมเดินทางตลอดเส้นทาง
          </p>
        </div>

        <div className="neu-card p-8 space-y-4 neu-card-hover">
          <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-purple-600">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#3D4852]">สร้างมิตรภาพระหว่างทาง</h3>
          <p className="text-[#6B7280] text-xs leading-relaxed">
            เปลี่ยนการเดินทางคนเดียวให้มีความหมาย พบเจอมิตรภาพใหม่ๆ บนเส้นทางเดียวกัน
          </p>
        </div>
      </section>
    </div>
  );
}
