import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import TripChat from '../components/TripChat';
import ReviewModal from '../components/ReviewModal';
import OwnerProfileModal from '../components/OwnerProfileModal';
import { MapPin, Calendar, Clock, Users, Car, Phone, Mail, AlertCircle, CheckCircle, ArrowRight, Star, LogOut, Trash2 } from 'lucide-react';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const [meetupLocation, setMeetupLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState({ id: null, name: '' });

  // Owner profile modal state
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  useEffect(() => {
    fetchTripDetail();
  }, [id]);

  const fetchTripDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/trips/${id}`);
      if (res.data.success) {
        setTrip(res.data.trip);
        setPassengers(res.data.passengers || []);
      } else {
        setError(String(res.data.message || 'ไม่พบข้อมูลเที่ยวเดินทาง'));
      }
    } catch (err) {
      console.error('Fetch detail error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError('');
    setJoinSuccess('');

    try {
      const res = await API.post('/bookings', {
        trip_id: parseInt(id),
        location: meetupLocation,
      });

      if (res.data.success) {
        setJoinSuccess(String(res.data.message || 'จองร่วมเดินทางเรียบร้อยแล้ว'));
        fetchTripDetail();
      } else {
        setError(String(res.data.message || 'ไม่สามารถร่วมเดินทางได้'));
      }
    } catch (err) {
      console.error('Join trip error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการจองที่นั่ง'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTrip = async () => {
    if (!window.confirm('คุณต้องการยกเลิกการจองและออกจากเที่ยวเดินทางนี้ใช่หรือไม่?')) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await API.delete(`/bookings/${id}`);
      if (res.data.success) {
        setJoinSuccess(String(res.data.message || 'ยกเลิกการจองเรียบร้อยแล้ว'));
        fetchTripDetail();
      } else {
        setError(String(res.data.message || 'ไม่สามารถยกเลิกได้'));
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการยกเลิกการจอง'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('คุณต้องการลบเที่ยวเดินทางนี้ใช่หรือไม่? ข้อมูลการจองและแชทจะถูกลบทั้งหมด')) return;
    setSubmitting(true);
    try {
      const res = await API.delete(`/trips/${id}`);
      if (res.data.success) {
        alert(String(res.data.message || 'ลบเที่ยวเดินทางเรียบร้อยแล้ว'));
        navigate('/trips');
      } else {
        setError(String(res.data.message || 'ไม่สามารถลบเที่ยวเดินทางได้'));
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการลบเที่ยวเดินทาง'));
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (targetId, targetName) => {
    setReviewTarget({ id: targetId, name: targetName });
    setReviewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">กำลังโหลดรายละเอียดเที่ยวเดินทาง...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="glass-card p-6 rounded-2xl border border-red-500/30 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-red-200">{error || 'ไม่พบข้อมูลการเดินทาง'}</h3>
          <button
            onClick={() => navigate('/trips')}
            className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-400"
          >
            กลับสู่หน้ารายการเที่ยวรถ
          </button>
        </div>
      </div>
    );
  }

  const departureDate = new Date(trip.departure_time);
  const currentUserId = user ? (user.user_id || user.id) : null;
  const isDriver = currentUserId && currentUserId === trip.driver_id;
  const isAdmin = user && (user.role === 'Admin' || user.email === 'admin@ikoshare.com');
  const activeBooking = passengers.find((p) => p.user_id === currentUserId && p.booking_status === 'จองแล้ว');
  const isAlreadyJoined = Boolean(activeBooking);
  const canAccessChat = isDriver || isAlreadyJoined || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Route Title Card */}
      <div className="glass-card p-8 rounded-3xl border border-sky-500/20 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div className="space-y-1">
            <div className="text-xs text-sky-400 font-semibold tracking-wider uppercase">
              {trip.event_name ? `เที่ยวรถงาน: ${trip.event_name}` : 'เส้นทางการเดินทาง'}
            </div>
            <div className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-white">
              <span>{trip.origin}</span>
              <ArrowRight className="w-6 h-6 text-sky-400 shrink-0" />
              <span>{trip.destination}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">ค่าโดยสาร / ที่นั่ง</div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : 'ฟรี'}
              </div>
            </div>

            {(isDriver || isAdmin) && (
              <button
                onClick={handleDeleteTrip}
                disabled={submitting}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                title="ลบเที่ยวเดินทางนี้"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-panel space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>วันที่เดินทาง</span>
            </div>
            <div className="text-sm font-bold text-white">
              {departureDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>เวลาออกเดินทาง</span>
            </div>
            <div className="text-sm font-bold text-white">
              {departureDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>สถานะที่นั่ง</span>
            </div>
            <div className="text-sm font-bold text-white">
              {trip.available_seats > 0 ? (
                <span className="text-emerald-400">มีที่ว่าง ({trip.available_seats} ที่)</span>
              ) : (
                <span className="text-red-400">เต็มแล้ว</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Car className="w-4 h-4 text-purple-400" />
              <span>ข้อมูลรถยนต์</span>
            </div>
            <div className="text-sm font-bold text-white">{trip.car_model || 'รถส่วนตัว'}</div>
            <div className="text-[10px] text-slate-400 font-mono">{trip.license_plate}</div>
          </div>
        </div>

        {/* Clickable Driver Info & Rating Trigger */}
        <div className="p-5 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setOwnerModalOpen(true)}
            className="flex items-center gap-3 text-left group"
          >
            {trip.driver_avatar ? (
              <img src={trip.driver_avatar} alt={trip.driver_name} className="w-12 h-12 rounded-full object-cover border-2 border-sky-400" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {trip.driver_name?.charAt(0)}
              </div>
            )}
            <div className="space-y-0.5">
              <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">คนขับรถ (คลิกเพื่อดูโปรไฟล์)</div>
              <div className="text-base font-bold text-white group-hover:text-sky-300 underline underline-offset-2 transition-colors">
                {trip.driver_name}
              </div>
              {trip.driver_phone && <div className="text-xs text-slate-300">โทร: {trip.driver_phone}</div>}
            </div>
          </button>

          {user && !isDriver && isAlreadyJoined && (
            <button
              onClick={() => openReviewModal(trip.driver_id, trip.driver_name)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
            >
              <Star className="w-4 h-4 fill-amber-400" />
              <span>ให้คะแนนคนขับ</span>
            </button>
          )}
        </div>

        {/* Status Alerts */}
        {joinSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{joinSuccess}</span>
          </div>
        )}

        {/* Passenger Status Check List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-sky-300 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>รายชื่อผู้โดยสารร่วมเดินทาง ({passengers.filter((p) => p.booking_status === 'จองแล้ว').length} คน)</span>
          </h4>

          {passengers.length === 0 ? (
            <div className="p-4 rounded-xl glass-panel text-center text-slate-400 text-xs">
              ยังไม่มีผู้โดยสารร่วมเดินทางในเที่ยวนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passengers.map((p) => (
                <div key={p.booking_id} className="p-3 rounded-xl glass-panel flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{p.passenger_name}</div>
                    <div className="text-slate-400 text-[10px]">โทร: {p.passenger_phone || '-'}</div>
                    {p.location && <div className="text-sky-300 text-[10px]">จุดนัดพบ: {p.location}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.booking_status === 'จองแล้ว' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {p.booking_status}
                    </span>
                    {isDriver && p.booking_status === 'จองแล้ว' && (
                      <button
                        onClick={() => openReviewModal(p.user_id, p.passenger_name)}
                        className="text-[10px] text-amber-300 hover:underline flex items-center gap-0.5"
                      >
                        <Star className="w-3 h-3 fill-amber-300" />
                        <span>ให้คะแนน</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions: Join or Leave Trip */}
        {isDriver ? (
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-center text-sm font-medium">
            นี่คือเที่ยวเดินทางที่คุณเปิดให้บริการ
          </div>
        ) : isAlreadyJoined ? (
          <div className="p-4 rounded-2xl glass-panel space-y-3 text-center">
            <div className="text-emerald-300 text-sm font-medium">คุณได้จองร่วมเดินทางในเส้นทางนี้แล้ว</div>
            <button
              onClick={handleLeaveTrip}
              disabled={submitting}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากทริป / ยกเลิกการจอง</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white">จองร่วมเดินทาง</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ระบุจุดขึ้นรถ / จุดนัดพบที่สะดวก</label>
              <input
                type="text"
                placeholder="เช่น ป้ายรถเมล์หน้าสวนสาธารณะ หรือ สถานี BTS"
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || trip.available_seats <= 0}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? 'กำลังส่งคำขอจอง...' : trip.available_seats <= 0 ? 'ที่นั่งเต็มแล้ว' : 'ยืนยันจองที่นั่ง'}
            </button>
          </form>
        )}
      </div>

      {/* Real-time Group Chat */}
      {canAccessChat && <TripChat tripId={id} />}

      {/* Rating & Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        tripId={parseInt(id)}
        targetUserId={reviewTarget.id}
        targetName={reviewTarget.name}
      />

      {/* Owner Profile Modal */}
      <OwnerProfileModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        userId={trip.driver_id}
      />
    </div>
  );
}
