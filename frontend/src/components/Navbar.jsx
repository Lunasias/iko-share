import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, LogOut, PlusCircle, User, Shield, Compass, Calendar } from 'lucide-react';
import ImmersiveFullscreenNav from './ui/immersive-full-screen-nav';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = !!user && (user.role === 'Admin' || user.email === 'admin@ikoshare.com');

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">ผู้ดูแลระบบ (Admin)</span>;
      case 'Driver':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">คนขับ (Driver)</span>;
      case 'Both':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold">คนขับ & ผู้โดยสาร</span>;
      default:
        return <span className="bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold">ผู้โดยสาร</span>;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-all">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Iko <span className="text-emerald-600">Share</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-3 lg:gap-5">
          <Link
            to="/trips"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>ค้นหาเที่ยวรถ</span>
          </Link>

          {user ? (
            <>
              {(user.role === 'Driver' || user.role === 'Both') && (
                <>
                  <Link
                    to="/create-trip"
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>เปิดทริปใหม่</span>
                  </Link>

                  <Link
                    to="/cars"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <Car className="w-4 h-4 text-teal-600" />
                    <span>รถของฉัน</span>
                  </Link>
                </>
              )}

              <Link
                to="/my-trips"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>การเดินทาง</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>โปรไฟล์</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100"
                >
                  <Shield className="w-4 h-4" />
                  <span>แอดมิน</span>
                </Link>
              )}

              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div>{getRoleBadge(user.role)}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
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
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold travel-btn-primary px-5 py-2"
              >
                ลงทะเบียน
              </Link>
            </div>
          )}
        </div>

        <ImmersiveFullscreenNav
          links={[
            { label: 'ค้นหาเที่ยวรถ', to: '/trips' },
            ...(user && (user.role === 'Driver' || user.role === 'Both') ? [
              { label: 'เปิดทริปใหม่', to: '/create-trip' },
              { label: 'รถของฉัน', to: '/cars' },
            ] : []),
            ...(user ? [
              { label: 'การเดินทางของฉัน', to: '/my-trips' },
              { label: `โปรไฟล์${user.name ? ` (${user.name})` : ''}`, to: '/profile' },
              ...(isAdmin ? [{ label: 'ระบบแอดมิน', to: '/admin' }] : []),
            ] : [
              { label: 'เข้าสู่ระบบ', to: '/login' },
              { label: 'ลงทะเบียน', to: '/register' },
            ]),
          ]}
          onLogout={user ? handleLogout : undefined}
        />
      </div>


    </nav>
  );
}
