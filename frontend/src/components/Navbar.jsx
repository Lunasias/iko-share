import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Car, LogOut, PlusCircle, User, Shield, Compass, Calendar, Menu, X, Languages } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isAdmin = !!user && (user.is_admin || user.email === 'admin@ikoshare.com');

  const getRoleBadge = (role) => {
    const roleKey = role === 'Driver' ? 'driverLabel' : role === 'Both' ? 'bothLabel' : 'passengerLabel';
    return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">{t(roleKey)}</span>;
  };

  return (
    <nav className={`sticky top-0 z-50 border-b px-4 lg:px-8 py-3 transition-all duration-[600ms] ${scrolled ? 'bg-[var(--card)]/90 backdrop-blur-md border-[var(--accent)]/30 shadow-md' : 'bg-[var(--card)] border-slate-200 shadow-xs'}`}>

      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="brand-link flex items-center gap-2.5 group">
          <div className="p-2.5 rounded-2xl bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/25 group-hover:scale-105 transition-all">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Iko <span className="text-[var(--accent)]">Share</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-5">
          <Link
            to="/trips"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>{t('findTrips')}</span>
          </Link>

          {user ? (
            <>
              <Link
                to="/create-trip"
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] bg-[var(--muted)] hover:bg-[var(--card)] border border-[var(--border)] px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('createTrip')}</span>
              </Link>

              {(user.role === 'Driver' || user.role === 'Both') && (
                <Link
                  to="/cars"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Car className="w-4 h-4 text-teal-600" />
                  <span>{t('myCars')}</span>
                </Link>
              )}

              <Link
                to="/my-trips"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{t('myTrips')}</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>{t('profile')}</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100"
                >
                  <Shield className="w-4 h-4" />
                  <span>{t('admin')}</span>
                </Link>
              )}

              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div>{getRoleBadge(user.role)}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title={t('logout')}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-4 py-2 rounded-xl hover:bg-slate-50"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center text-xs font-bold travel-btn-primary px-5 py-2 leading-none"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        {/* Theme and language controls */}
        <div className="hidden md:flex items-center gap-1 mr-2 border-l border-[var(--border)] pl-3">
          <button type="button" onClick={toggleLanguage} className="theme-control" aria-label={t('changeLanguage')} title={t('changeLanguage')}>
            <Languages className="w-4 h-4" />
            <span>{language === 'th' ? 'EN' : 'TH'}</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden mt-3 pt-4 pb-6 border-t border-[var(--border)] space-y-2 px-2 animate-[editorial-reveal_200ms_ease-out]">
          <div className="flex gap-2 pb-2">
            <button type="button" onClick={toggleLanguage} className="theme-control flex-1 justify-center"><Languages className="w-4 h-4" /> {t('language')}</button>
          </div>
          <Link
            to="/trips"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-sm font-bold text-slate-800 p-3 rounded-xl hover:bg-slate-100"
          >
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>{t('findTrips')}</span>
          </Link>

          {user ? (
            <>
              <Link
                to="/create-trip"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200"
              >
                <PlusCircle className="w-5 h-5" />
                <span>{t('createTrip')}</span>
              </Link>

              {(user.role === 'Driver' || user.role === 'Both') && (
                <Link
                  to="/cars"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-bold text-slate-800 p-3 rounded-xl hover:bg-slate-100"
                >
                  <Car className="w-5 h-5 text-teal-600" />
                  <span>{t('myCars')}</span>
                </Link>
              )}

              <Link
                to="/my-trips"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm font-bold text-slate-800 p-3 rounded-xl hover:bg-slate-100"
              >
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>{t('myTrips')}</span>
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm font-bold text-slate-800 p-3 rounded-xl hover:bg-slate-100"
              >
                <User className="w-5 h-5 text-emerald-600" />
                <span>{t('userProfile')} ({user.name})</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-bold text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200"
                >
                  <Shield className="w-5 h-5" />
                  <span>{t('admin')}</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-bold p-3 bg-slate-100 text-slate-800 rounded-xl"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-bold travel-btn-primary p-3"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
