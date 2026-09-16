import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const links = [
  { label: 'ค้นหาทริป', to: '/trips' },
  { label: 'สร้างทริปใหม่', to: '/create-trip' },
  { label: 'การเดินทางของฉัน', to: '/my-trips' },
  { label: 'โปรไฟล์', to: '/profile' },
];

export default function ImmersiveFullscreenNav() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      gsap.fromTo(overlayRef.current, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.65, ease: 'power3.inOut' });
      gsap.fromTo(panelRef.current?.children || [], { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, delay: 0.25, ease: 'power2.out' });
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label="เปิดเมนูแบบเต็มหน้าจอ" aria-expanded={open} className="fixed bottom-5 right-5 z-[55] rounded-full border border-white/50 bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-xl transition hover:scale-105 hover:bg-emerald-700">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" /> สำรวจ Iko Share
      </button>
      {open && (
        <div ref={overlayRef} className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label="เมนูหลัก">
          <div className="flex min-h-full flex-col justify-between px-6 py-7 sm:px-12 sm:py-10">
            <div className="flex items-center justify-between">
              <Link to="/" onClick={() => setOpen(false)} className="text-lg font-black tracking-tight">Iko <span className="text-emerald-400">Share</span></Link>
              <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="ปิดเมนู" className="rounded-full border border-white/30 px-4 py-2 text-sm hover:bg-white/10">ปิด ✕</button>
            </div>
            <div ref={panelRef} className="grid gap-3 py-16">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">เดินทางไปด้วยกัน</p>
              {links.map((link) => <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="w-fit text-4xl font-black tracking-tight transition hover:translate-x-2 hover:text-emerald-300 sm:text-6xl">{link.label}</Link>)}
            </div>
            <div className="grid gap-6 border-t border-white/15 pt-6 text-sm text-slate-300 sm:grid-cols-2"><p>แชร์ค่าเดินทาง สร้างมิตรภาพ และค้นพบเส้นทางใหม่ทั่วไทย</p><p className="sm:text-right">Bangkok · Thailand<br />เดินทางอย่างมีความหมาย</p></div>
          </div>
        </div>
      )}
    </>
  );
}
