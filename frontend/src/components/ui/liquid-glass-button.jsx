import React from 'react';

export function LiquidButton({ children, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/40 bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/35 via-transparent to-transparent" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function Button({ children, className = '', ...props }) {
  return <button className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold ${className}`} {...props}>{children}</button>;
}

export default LiquidButton;
