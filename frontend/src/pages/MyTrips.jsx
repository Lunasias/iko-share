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

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('คุณต้องการลบเที่ยวเดินทางนี้ใช่หรือไม่?')) return;
    try {
      const res = await API.delete(`/trips/${tripId}`);
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

  const handleLeaveBooking = async (tripId) => {
    if (!window.confirm('คุณต้องการยกเลิกการจองและออกจากเที่ยวเดินทางนี้หรือไม่?')) return;
    try {
      const res = await API.delete(`/bookings/${tripId}`);
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
        <div className="inline-block w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6B7280] text-xs font-semibold">กำลังโหลดการเดินทางของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#3D4852] font-['Plus_Jakarta_Sans',sans-serif]">การเดินทางของฉัน</h2>
          <p className="text-xs text-[#6B7280]">รายการเส้นทางที่คุณเป็นคนขับ และรายการที่คุณเข้าร่วมเดินทาง</p>
        </div>
        <Link
          to="/create-trip"
          className="neu-button-primary px-5 py-2.5 text-xs font-bold"
        >
          + เปิดการเดินทางใหม่
        </Link>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-[#38B2AC]/10 border border-[#38B2AC]/20 text-[#2C7A7B] text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Created Trips Section */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-[#3D4852] uppercase tracking-wider border-b border-slate-300 pb-3">
          เที่ยวเดินทางที่ฉันเปิดให้บริการคนขับ ({createdTrips.length})
        </h3>

        {createdTrips.length === 0 ? (
          <div className="neu-card p-6 text-center text-[#6B7280] text-xs font-medium">
            คุณยังไม่ได้เปิดให้บริการเส้นทางใดๆ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {createdTrips.map((trip) => (
              <div key={trip.trip_id} className="neu-card p-6 space-y-4">
                <div className="flex items-center justify-between font-extrabold text-[#3D4852] text-base border-b border-slate-300 pb-3">
                  <div className="flex items-center gap-2">
                    <span>{trip.origin}</span>
                    <ArrowRight className="w-4 h-4 text-[#6C63FF]" />
                    <span>{trip.destination}</span>
                  </div>
                  <span className="text-[10px] bg-[#38B2AC]/20 text-[#2C7A7B] px-3 py-1 rounded-full font-bold neu-pill">
                    เปิดบริการ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#3D4852]">
                  <div>วันเดินทาง: {new Date(trip.departure_time).toLocaleDateString('th-TH')}</div>
                  <div>เวลา: {new Date(trip.departure_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
                  <div>ว่าง: {trip.available_seats} ที่นั่ง</div>
                  <div>ราคา: ฿{trip.price_seat}</div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-300">
                  <Link to={`/trips/${trip.trip_id}`} className="text-xs font-bold text-[#6C63FF] hover:underline">
                    รายละเอียดเพิ่มเติม
                  </Link>
                  <button
                    onClick={() => handleCancelTrip(trip.trip_id)}
                    className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบเส้นทาง</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Joined Trips Section */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-[#3D4852] uppercase tracking-wider border-b border-slate-300 pb-3">
          เที่ยวเดินทางที่ฉันเข้าร่วมผู้โดยสาร ({joinedTrips.length})
        </h3>

        {joinedTrips.length === 0 ? (
          <div className="neu-card p-6 text-center text-[#6B7280] text-xs font-medium">
            คุณยังไม่ได้จองเข้าร่วมเที่ยวเดินทางใดๆ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {joinedTrips.map((booking) => (
              <div key={booking.booking_id} className="neu-card p-6 space-y-4">
                <div className="flex items-center justify-between font-extrabold text-[#3D4852] text-base border-b border-slate-300 pb-3">
                  <div className="flex items-center gap-2">
                    <span>{booking.origin}</span>
                    <ArrowRight className="w-4 h-4 text-[#6C63FF]" />
                    <span>{booking.destination}</span>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold neu-pill ${booking.booking_status === 'จองแล้ว' ? 'bg-[#38B2AC]/20 text-[#2C7A7B]' : 'bg-red-500/20 text-red-600'}`}>
                    {booking.booking_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#3D4852]">
                  <div>คนขับ: {booking.driver_name}</div>
                  <div>เบอร์โทร: {booking.driver_phone || '-'}</div>
                  <div>วันเดินทาง: {new Date(booking.departure_time).toLocaleDateString('th-TH')}</div>
                  <div>ราคา: ฿{booking.price_seat}</div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-300">
                  <Link to={`/trips/${booking.trip_id}`} className="text-xs font-bold text-[#6C63FF] hover:underline">
                    รายละเอียดเพิ่มเติม
                  </Link>
                  {booking.booking_status === 'จองแล้ว' && (
                    <button
                      onClick={() => handleLeaveBooking(booking.trip_id)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
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
