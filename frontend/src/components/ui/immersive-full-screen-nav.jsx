import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ImmersiveFullscreenNav({ links = [], onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const previousFocusRef = useRef(null);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const closeMenu = () => {
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      if (reducedMotion) {
        gsap.set(overlayRef.current, { clipPath: 'inset(0)', autoAlpha: 1 });
        gsap.set(panelRef.current?.children || [], { y: 0, opacity: 1 });
      } else {
        gsap.fromTo(overlayRef.current, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0)', duration: 0.75, ease: 'power4.inOut' });
        gsap.fromTo(panelRef.current?.children || [], { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, delay: 0.25, ease: 'power2.out' });
      }
      requestAnimationFrame(() => panelRef.current?.querySelector(FOCUSABLE_SELECTOR)?.focus());
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, reducedMotion]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...(rootRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  return (
    <div ref={rootRef} className="md:hidden">
      <button ref={toggleRef} type="button" onClick={() => setIsOpen((value) => !value)} aria-label={isOpen ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={isOpen} className="relative z-[80] flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
        <span className={`h-0.5 w-6 bg-current transition duration-500 ${isOpen ? 'translate-y-2 rotate-45' : ''}`} />
        <span className={`h-0.5 w-6 bg-current transition duration-300 ${isOpen ? 'scale-x-0 opacity-0' : ''}`} />
        <span className={`h-0.5 w-6 bg-current transition duration-500 ${isOpen ? '-translate-y-2 -rotate-45' : ''}`} />
      </button>
      {isOpen && <div ref={overlayRef} role="dialog" aria-modal="true" aria-label="เมนู Iko Share" className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950 text-white" style={{ clipPath: 'inset(0 0 100% 0)' }}>
        <div className="flex min-h-full flex-col justify-between px-6 pb-8 pt-28 sm:px-12">
          <div ref={panelRef} className="grid gap-3">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Iko Share · เดินทางไปด้วยกัน</p>
            {links.map((link) => <Link key={link.to} to={link.to} onClick={closeMenu} className="w-fit text-4xl font-black tracking-tight transition hover:translate-x-2 hover:text-emerald-300 sm:text-6xl">{link.label}</Link>)}
            {onLogout && <button type="button" onClick={() => { onLogout(); closeMenu(); }} className="mt-4 w-fit text-left text-lg font-bold text-red-300">ออกจากระบบ</button>}
          </div>
          <p className="border-t border-white/15 pt-5 text-sm text-slate-300">แชร์ค่าเดินทาง สร้างมิตรภาพ และค้นพบเส้นทางใหม่ทั่วไทย</p>
        </div>
      </div>}
    </div>
  );
}
