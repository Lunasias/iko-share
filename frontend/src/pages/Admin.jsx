import React, { useState, useEffect } from 'react';
import API from '../services/api';
import CarLoader from '../components/CarLoader';
import { Shield, Users, Car, Calendar, MapPin, Trash2, AlertCircle } from 'lucide-react';

export default function Admin() {
  const [stats, setStats] = useState({ totalUsers: 0, totalCars: 0, totalEvents: 0, totalTrips: 0, totalBookings: 0 });
  const [users, setUsers] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await API.get('/admin/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats || { totalUsers: 0, totalCars: 0, totalEvents: 0, totalTrips: 0, totalBookings: 0 });
        setRecentTrips(statsRes.data.recentTrips || []);
      }

      const usersRes = await API.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      }
    } catch (err) {
      console.error('Fetch admin data error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ดูแลระบบ'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('คุณต้องการลบผู้ใช้งานรายนี้ออกจากระบบใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setUsers((prev) => prev.filter((u) => (u.user_id || u.id) !== id));
        fetchAdminData();
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบผู้ใช้งานได้'));
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('คุณต้องการลบเที่ยวเดินทางนี้ออกจากระบบใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/admin/trips/${tripId}`);
      if (res.data.success) {
        setRecentTrips((prev) => prev.filter((t) => t.trip_id !== tripId));
        fetchAdminData();
      }
    } catch (err) {
      alert(String(err.response?.data?.message || err.message || 'ไม่สามารถลบเที่ยวเดินทางได้'));
    }
  };

  if (loading) {
    return <CarLoader text="กำลังโหลดระบบผู้ดูแลระบบ (Admin Dashboard)..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            ระบบจัดการผู้ดูแลระบบ (Admin Dashboard)
          </h2>
          <p className="text-xs text-slate-500 font-medium">ภาพรวมสถิติแพลตฟอร์มและการจัดการข้อมูลสมาชิก / เที่ยวรถ</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ER Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="travel-card p-5 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">สมาชิก (Users)</div>
          <div className="text-2xl font-black text-emerald-700">{stats.totalUsers} คน</div>
        </div>

        <div className="travel-card p-5 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">รถยนต์ (Cars)</div>
          <div className="text-2xl font-black text-teal-700">{stats.totalCars} คัน</div>
        </div>

        <div className="travel-card p-5 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">อีเวนต์ (Events)</div>
          <div className="text-2xl font-black text-purple-700">{stats.totalEvents} งาน</div>
        </div>

        <div className="travel-card p-5 space-y-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">เที่ยวรถ (Trips)</div>
          <div className="text-2xl font-black text-amber-700">{stats.totalTrips} เที่ยว</div>
        </div>

        <div className="travel-card p-5 space-y-1 col-span-2 sm:col-span-1 border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">การจองสำเร็จ (Bookings)</div>
          <div className="text-2xl font-black text-rose-700">{stats.totalBookings} รายการ</div>
        </div>
      </div>

      {/* Table: Recent Trips */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-600" />
          <span>เที่ยวเดินทางล่าสุด</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                <th className="py-3 px-4">Trip ID</th>
                <th className="py-3 px-4">เส้นทาง</th>
                <th className="py-3 px-4">คนขับ</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {recentTrips.map((t) => (
                <tr key={t.trip_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">#{t.trip_id}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">{t.origin} ➔ {t.destination}</td>
                  <td className="py-3 px-4">{t.driver_name}</td>
                  <td className="py-3 px-4 font-mono">{t.license_plate}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteTrip(t.trip_id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="ลบเที่ยวเดินทาง"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management Table */}
      <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <span>รายการสมาชิกในระบบ (Users)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">ชื่อ</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">เบอร์โทร</th>
                <th className="py-3 px-4">บทบาท</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {users.map((u) => {
                const uid = u.user_id || u.id;
                return (
                  <tr key={uid} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{uid}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin' ? 'role-driver' :
                        u.role === 'Driver' ? 'role-driver' :
                        u.role === 'Both' ? 'role-both' : 'role-passenger'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.email !== 'admin@ikoshare.com' && (
                        <button
                          onClick={() => handleDeleteUser(uid)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="ลบสมาชิก"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
