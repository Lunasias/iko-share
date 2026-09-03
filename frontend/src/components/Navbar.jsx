import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, LogOut, PlusCircle, User, Shield, Compass, Calendar, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Driver':
        return <span className="bg-[#38B2AC]/20 text-[#2C7A7B] px-2.5 py-0.5 rounded-full text-[10px] font-bold neu-pill">คนขับ (Driver)</span>;
      case 'Both':
        return <span className="bg-[#6C63FF]/20 text-[#5A52E0] px-2.5 py-0.5 rounded-full text-[10px] font-bold neu-pill">คนขับ & ผู้โดยสาร</span>;
      default:
        return <span className="bg-sky-500/20 text-sky-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold neu-pill">ผู้โดยสาร (Passenger)</span>;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#E0E5EC] px-4 lg:px-8 py-3 shadow-[0_6px_12px_rgba(163,177,198,0.4)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2.5 rounded-2xl bg-[#E0E5EC] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] group-hover:shadow-[ inset_3px_3px_6px_rgba(163,177,198,0.6)] transition-all">
            <Car className="w-6 h-6 text-[#6C63FF]" />
          </div>
          <span className="text-xl font-black tracking-wide text-[#3D4852] font-['Plus_Jakarta_Sans',sans-serif]">
            Iko <span className="text-[#6C63FF]">Share</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <Link
            to="/trips"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#3D4852] hover:text-[#6C63FF] transition-colors px-3 py-2 rounded-xl"
          >
            <Compass className="w-4 h-4 text-[#6C63FF]" />
            <span>ค้นหาเที่ยวรถ</span>
          </Link>

          {user ? (
            <>
              {(user.role === 'Driver' || user.role === 'Both') && (
                <>
                  <Link
                    to="/create-trip"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#6C63FF] neu-button px-3.5 py-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>เปิดทริปใหม่</span>
                  </Link>

                  <Link
                    to="/cars"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#3D4852] hover:text-[#6C63FF] px-3 py-2"
                  >
                    <Car className="w-4 h-4 text-[#38B2AC]" />
                    <span>รถของฉัน</span>
                  </Link>
                </>
              )}

              <Link
                to="/my-trips"
                className="flex items-center gap-1.5 text-sm font-semibold text-[#3D4852] hover:text-[#6C63FF] px-3 py-2"
              >
                <Calendar className="w-4 h-4 text-[#6C63FF]" />
                <span>การเดินทาง</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm font-semibold text-[#3D4852] hover:text-[#6C63FF] px-3 py-2"
              >
                <User className="w-4 h-4 text-[#6C63FF]" />
                <span>โปรไฟล์</span>
              </Link>

              {(user.role === 'Admin' || user.email === 'admin@ikoshare.com') && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 text-xs font-bold text-amber-600 neu-button px-3 py-1.5"
                >
                  <Shield className="w-4 h-4" />
                  <span>แอดมิน</span>
                </Link>
              )}

              <div className="flex items-center gap-3 pl-3 border-l border-slate-300">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#3D4852]">{user.name}</div>
                  <div>{getRoleBadge(user.role)}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-2.5 rounded-xl neu-button text-red-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-[#3D4852] neu-button px-4 py-2"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="text-sm font-bold neu-button-primary px-5 py-2"
              >
                ลงทะเบียน
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl neu-button text-[#3D4852] focus:ring-2 focus:ring-[#6C63FF]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-4 pb-6 border-t border-slate-300 space-y-3 px-2">
          <Link
            to="/trips"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-[#3D4852] neu-button px-4 py-3"
          >
            <Compass className="w-5 h-5 text-[#6C63FF]" />
            <span>ค้นหาเที่ยวรถ</span>
          </Link>

          {user ? (
            <>
              {(user.role === 'Driver' || user.role === 'Both') && (
                <>
                  <Link
                    to="/create-trip"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-bold text-[#6C63FF] neu-button px-4 py-3"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>เปิดทริปใหม่</span>
                  </Link>

                  <Link
                    to="/cars"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-[#3D4852] neu-button px-4 py-3"
                  >
                    <Car className="w-5 h-5 text-[#38B2AC]" />
                    <span>รถของฉัน</span>
                  </Link>
                </>
              )}

              <Link
                to="/my-trips"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-[#3D4852] neu-button px-4 py-3"
              >
                <Calendar className="w-5 h-5 text-[#6C63FF]" />
                <span>การเดินทางของฉัน</span>
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-[#3D4852] neu-button px-4 py-3"
              >
                <User className="w-5 h-5 text-[#6C63FF]" />
                <span>โปรไฟล์ ({user.name})</span>
              </Link>

              {(user.role === 'Admin' || user.email === 'admin@ikoshare.com') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-amber-600 neu-button px-4 py-3"
                >
                  <Shield className="w-5 h-5" />
                  <span>ระบบแอดมิน</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-500 neu-button py-3"
              >
                <LogOut className="w-5 h-5" />
                <span>ออกจากระบบ</span>
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-semibold neu-button py-3"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-bold neu-button-primary py-3"
              >
                ลงทะเบียน
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
