import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, LogOut, PlusCircle, User, Shield, Compass, Calendar, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Driver':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">คนขับ (Driver)</span>;
      case 'Both':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">คนขับ & ผู้โดยสาร</span>;
      default:
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">ผู้โดยสาร (Passenger)</span>;
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-sky-500/20 px-4 lg:px-8 py-3 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-sky-400 via-sky-200 to-white bg-clip-text text-transparent">
            Iko Share
          </span>
        </Link>

        <div className="flex items-center gap-3 lg:gap-5">
          <Link
            to="/trips"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">ค้นหาเที่ยวรถ</span>
          </Link>

          {user ? (
            <>
              {(user.role === 'Driver' || user.role === 'Both') && (
                <>
                  <Link
                    to="/create-trip"
                    className="hidden md:flex items-center gap-1.5 text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>เปิดทริปใหม่</span>
                  </Link>

                  <Link
                    to="/cars"
                    className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-sky-400 px-2 py-1 transition-colors"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>รถของฉัน</span>
                  </Link>
                </>
              )}

              <Link
                to="/my-trips"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">การเดินทาง</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">โปรไฟล์</span>
              </Link>

              {(user.role === 'Admin' || user.email === 'admin@ikoshare.com') && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md hover:bg-amber-500/30 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>แอดมิน</span>
                </Link>
              )}

              <div className="flex items-center gap-3 pl-2 border-l border-slate-700">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-semibold text-sky-200">{user.name}</div>
                  <div>{getRoleBadge(user.role)}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-sky-400 px-3 py-1.5 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:shadow-sky-500/40 px-4 py-1.5 rounded-lg hover:opacity-95 transition-all"
              >
                ลงทะเบียน
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
