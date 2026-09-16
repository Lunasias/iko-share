import React from 'react';
import { Car } from 'lucide-react';

export default function CarLoader({ text = 'กำลังโหลดข้อมูลการเดินทาง...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
      {/* Driving Car Container */}
      <div className="relative w-36 h-16 flex items-center justify-center">
        {/* Road line */}
        <div className="absolute bottom-2 w-32 h-1 bg-slate-300 rounded-full overflow-hidden">
          <div className="w-12 h-full bg-[var(--accent)] rounded-full animate-[ping_1.5s_infinite]"></div>
        </div>
        {/* Bouncing & Driving Car */}
        <div className="animate-bounce flex flex-col items-center">
          <div className="p-3 bg-[var(--accent)] text-white rounded-lg shadow-lg shadow-[var(--accent)]/30 flex items-center justify-center transform hover:scale-105 transition-all">
            <Car className="w-8 h-8 animate-pulse text-white" />
          </div>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-700 tracking-wide text-center">
        {text}
      </p>
    </div>
  );
}
