import React from 'react';
import { useLocation } from 'react-router-dom';

const backgrounds = {
  home: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=82',
  trips: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=82',
  detail: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2400&q=82',
  auth: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=2400&q=82',
  profile: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=82',
  dashboard: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=82',
};

function getVariant(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/login' || pathname === '/register') return 'auth';
  if (pathname.startsWith('/trips/')) return 'detail';
  if (pathname === '/trips') return 'trips';
  if (pathname === '/profile') return 'profile';
  return 'dashboard';
}

export default function PageBackground() {
  const { pathname } = useLocation();
  const variant = getVariant(pathname);

  return (
    <div className={`page-background page-background--${variant}`} aria-hidden="true">
      <div className="page-background__image" style={{ backgroundImage: `url(${backgrounds[variant]})` }} />
      <div className="page-background__wash" />
      <div className="page-background__glow" />
    </div>
  );
}
