import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import CarLoader from '../components/CarLoader';
import { Calendar, Clock, MapPin, Users, Trash2, ArrowRight, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

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
    if (!window.confirm('คุณต้องการยกเลิกคำขอ / ออกจากเที่ยวเดินทางนี้หรือไม่?')) return;
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
    return <CarLoader text="กำลังโหลดการเดินทางของคุณ..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            การเดินทางของฉัน (My Trips)
          </h2>
          <p className="text-xs text-slate-500 font-medium">รายการเส้นทางที่คุณเป็นคนขับ และรายการที่คุณขอเข้าร่วมเดินทาง</p>
        </div>
        <Link
          to="/create-trip"
          className="travel-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>เปิดทริปใหม่</span>
        </Link>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Created Trips Section */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
          เที่ยวเดินทางที่คุณเป็นคนขับ ({createdTrips.length} ทริป)
        </h3>

        {createdTrips.length === 0 ? (
          <div className="travel-card p-6 text-center text-slate-500 text-xs font-medium border border-slate-200">
            คุณยังไม่ได้เปิดให้บริการเส้นทางใดๆ คลิก "เปิดทริปใหม่" เพื่อชวนเพื่อนร่วมทาง
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {createdTrips.map((trip) => (
              <div key={trip.trip_id} className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between font-extrabold text-slate-900 text-base border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span>{trip.origin}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                    <span>{trip.destination}</span>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                    เปิดบริการ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                  <div>วันเดินทาง: {new Date(trip.departure_time).toLocaleDateString('th-TH')}</div>
                  <div>เวลา: {new Date(trip.departure_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
                  <div>ว่าง: {trip.available_seats} ที่นั่ง</div>
                  <div>ราคา: ฿{trip.price_seat}</div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <Link to={`/trips/${trip.trip_id}`} className="text-xs font-bold text-emerald-700 hover:underline">
                    ดูรายละเอียด & จัดการตี้
                  </Link>
                  <button
                    onClick={() => handleCancelTrip(trip.trip_id)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
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
        <h3 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
          เที่ยวเดินทางที่คุณร่วมเป็นผู้โดยสาร ({joinedTrips.length} ทริป)
        </h3>

        {joinedTrips.length === 0 ? (
          <div className="travel-card p-6 text-center text-slate-500 text-xs font-medium border border-slate-200">
            คุณยังไม่ได้ขอเข้าร่วมเที่ยวเดินทางใดๆ ค้นหาทริปท่องเที่ยวเพื่อร่วมเดินทางกับเพื่อนๆ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {joinedTrips.map((booking) => (
              <div key={booking.booking_id} className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between font-extrabold text-slate-900 text-base border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span>{booking.origin}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                    <span>{booking.destination}</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                    booking.booking_status === 'จองแล้ว' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    booking.booking_status === 'รอการอนุมัติ' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {booking.booking_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                  <div>คนขับ: {booking.driver_name}</div>
                  <div>เบอร์โทร: {booking.driver_phone || '-'}</div>
                  <div>วันเดินทาง: {new Date(booking.departure_time).toLocaleDateString('th-TH')}</div>
                  <div>ราคา: ฿{booking.price_seat}</div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <Link to={`/trips/${booking.trip_id}`} className="text-xs font-bold text-emerald-700 hover:underline">
                    ดูรายละเอียด & ห้องแชท
                  </Link>
                  {['จองแล้ว', 'รอการอนุมัติ'].includes(booking.booking_status) && (
                    <button
                      onClick={() => handleLeaveBooking(booking.trip_id)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิกคำขอ</span>
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
