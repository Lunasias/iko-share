import React from 'react';
import { useLocation } from 'react-router-dom';

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=82`;

// Bright, tree-covered mountain and nature scenes; each route family has its own image.
const backgrounds = {
  home: image('photo-1464822759023-fed622ff2c3b'),
  trips: image('photo-1470770841072-f978cf4d019e'),
  detail: image('photo-1470770841072-f978cf4d019e'),
  auth: image('photo-1464278533981-50106e6176b1'),
  profile: image('photo-1501785888041-af3ef285b470'),
  create: image('photo-1441974231531-c6227db76b6e'),
  mine: image('photo-1469474968028-56623f02e42e'),
  cars: image('photo-1500530855697-b586d89ba3ee'),
  admin: image('photo-1501785888041-af3ef285b470'),
};

function getVariant(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/login' || pathname === '/register') return 'auth';
  if (pathname.startsWith('/trips/')) return 'detail';
  if (pathname === '/trips') return 'trips';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/create-trip') return 'create';
  if (pathname === '/my-trips') return 'mine';
  if (pathname === '/cars') return 'cars';
  if (pathname === '/admin') return 'admin';
  return 'profile';
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
