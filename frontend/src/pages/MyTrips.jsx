import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Calendar, Clock, MapPin, Users, Trash2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MyTrips() {
  const [createdTrips, setCreatedTrips] = useState([]);
  const [joinedTrips, setJoinedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchMyTrips();
  }, []);

  const fetchMyTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/trips/my');
      if (res.data.success) {
        setCreatedTrips(res.data.created || []);
        setJoinedTrips(res.data.joined || []);
      } else {
        setError(String(res.data.message || 'ไม่สามารถดึงข้อมูลรายการได้'));
      }
    } catch (err) {
      console.error('Fetch my trips error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดรายการ'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id, isDriver) => {
    if (!window.confirm(isDriver ? 'คุณต้องการยกเลิกการเดินทางเที่ยวนี้หรือไม่?' : 'คุณต้องการยกเลิกการจองที่นั่งหรือไม่?')) {
      return;
    }

    try {
      const res = await API.delete(`/trips/${id}`);
      if (res.data.success) {
        setActionMsg(String(res.data.message));
        fetchMyTrips();
      } else {
        setError(String(res.data.message));
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการยกเลิก'));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">กำลังโหลดการเดินทางของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">การเดินทางของฉัน</h2>
          <p className="text-sm text-slate-400">รายการเส้นทางที่คุณเป็นคนขับ และรายการที่คุณเข้าร่วมเดินทาง</p>
        </div>
        <Link
          to="/create-trip"
          className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-sky-500/20 transition-all"
        >
          + เปิดการเดินทางใหม่
        </Link>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Created Trips Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-sky-300 border-b border-slate-700/60 pb-2">
          เที่ยวเดินทางที่ฉันเปิดให้บริการคนขับ ({createdTrips.length})
        </h3>

        {createdTrips.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl text-center text-slate-400 text-sm">
            คุณยังไม่ได้เปิดให้บริการเส้นทางใดๆ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {createdTrips.map((trip) => (
              <div key={trip.id} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between font-bold text-white text-base">
                  <div className="flex items-center gap-2">
                    <span>{trip.origin}</span>
                    <ArrowRight className="w-4 h-4 text-sky-400" />
                    <span>{trip.destination}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-md ${trip.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {trip.status === 'active' ? 'กำลังเปิดรับ' : 'ยกเลิกแล้ว'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>วันเดินทาง: {new Date(trip.departure_time).toLocaleDateString('th-TH')}</div>
                  <div>เวลา: {new Date(trip.departure_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
                  <div>ว่าง: {trip.available_seats} ที่นั่ง</div>
                  <div>ราคา: ฿{trip.price}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <Link to={`/trips/${trip.id}`} className="text-xs text-sky-400 hover:underline">
                    รายละเอียดเพิ่มเติม
                  </Link>
                  {trip.status === 'active' && (
                    <button
                      onClick={() => handleCancel(trip.id, true)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิกเส้นทาง</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Joined Trips Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-indigo-300 border-b border-slate-700/60 pb-2">
          เที่ยวเดินทางที่ฉันเข้าร่วมผู้โดยสาร ({joinedTrips.length})
        </h3>

        {joinedTrips.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl text-center text-slate-400 text-sm">
            คุณยังไม่ได้จองเข้าร่วมเที่ยวเดินทางใดๆ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinedTrips.map((booking) => (
              <div key={booking.booking_id} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between font-bold text-white text-base">
                  <div className="flex items-center gap-2">
                    <span>{booking.origin}</span>
                    <ArrowRight className="w-4 h-4 text-sky-400" />
                    <span>{booking.destination}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-md ${booking.booking_status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {booking.booking_status === 'confirmed' ? 'ยืนยันจองแล้ว' : 'ยกเลิกแล้ว'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>คนขับ: {booking.driver_name} ({booking.driver_phone || 'ไม่มีเบอร์'})</div>
                  <div>วันเดินทาง: {new Date(booking.departure_time).toLocaleDateString('th-TH')}</div>
                  <div>จองไว้: {booking.seats_booked} ที่นั่ง</div>
                  <div>ราคา: ฿{booking.price}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <Link to={`/trips/${booking.id}`} className="text-xs text-sky-400 hover:underline">
                    รายละเอียดเพิ่มเติม
                  </Link>
                  {booking.booking_status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(booking.id, false)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิกการจอง</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
