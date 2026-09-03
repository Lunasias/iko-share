import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import TripChat from '../components/TripChat';
import { MapPin, Calendar, Clock, Users, Car, Phone, Mail, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const res = await API.post(`/trips/${id}/join`, {
        seats_booked: parseInt(seatsBooked),
        notes,
      });

      if (res.data.success) {
        setJoinSuccess(String(res.data.message || 'จองที่นั่งเรียบร้อยแล้ว'));
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
  const isDriver = user && user.id === trip.driver_id;
  const isAlreadyJoined = user && passengers.some((p) => p.user_id === user.id);
  const canAccessChat = isDriver || isAlreadyJoined || (user && user.role === 'admin');

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Route Title Card */}
      <div className="glass-card p-8 rounded-3xl border border-sky-500/20 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div className="space-y-1">
            <div className="text-xs text-sky-400 font-semibold tracking-wider uppercase">เส้นทางการเดินทาง</div>
            <div className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-white">
              <span>{trip.origin}</span>
              <ArrowRight className="w-6 h-6 text-sky-400 shrink-0" />
              <span>{trip.destination}</span>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <div className="text-xs text-slate-400">ค่าโดยสาร / ที่นั่ง</div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {parseFloat(trip.price) > 0 ? `฿${trip.price}` : 'ฟรี'}
            </div>
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
              <span>ที่นั่งว่าง</span>
            </div>
            <div className="text-sm font-bold text-white">
              {trip.available_seats !== undefined ? trip.available_seats : trip.seats} / {trip.seats} ที่นั่ง
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Car className="w-4 h-4 text-purple-400" />
              <span>รุ่นรถยนต์</span>
            </div>
            <div className="text-sm font-bold text-white">{trip.car_model || 'ไม่ระบุ'}</div>
          </div>
        </div>

        {/* Driver Info */}
        <div className="p-5 rounded-2xl glass-panel space-y-3">
          <h4 className="text-sm font-bold text-sky-300">ข้อมูลคนขับรถ</h4>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-200">
            <div>
              <span className="text-slate-400">ชื่อ:</span> <span className="font-semibold text-white">{trip.driver_name}</span>
            </div>
            {trip.driver_phone && (
              <div className="flex items-center gap-1.5 text-sky-400">
                <Phone className="w-4 h-4" />
                <span>{trip.driver_phone}</span>
              </div>
            )}
            {trip.driver_email && (
              <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{trip.driver_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {trip.notes && (
          <div className="p-4 rounded-2xl glass-panel text-slate-300 text-sm space-y-1">
            <div className="text-xs font-semibold text-slate-400">หมายเหตุเพิ่มเติมจากคนขับ</div>
            <p>{trip.notes}</p>
          </div>
        )}

        {/* Status Alerts */}
        {joinSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{joinSuccess}</span>
          </div>
        )}

        {/* Booking Form or Driver View */}
        {isDriver ? (
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-center text-sm font-medium">
            นี่คือเส้นทางที่คุณเป็นคนสร้าง (มีผู้โดยสารร่วมเดินทางแล้ว {passengers.length} คน)
          </div>
        ) : isAlreadyJoined ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-center text-sm font-medium">
            คุณได้จองร่วมเดินทางในเส้นทางนี้เรียบร้อยแล้ว
          </div>
        ) : (
          <form onSubmit={handleJoin} className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white">จองที่นั่งร่วมเดินทาง</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">จำนวนที่นั่งที่ต้องการจอง</label>
                <input
                  type="number"
                  min="1"
                  max={trip.available_seats || 1}
                  value={seatsBooked}
                  onChange={(e) => setSeatsBooked(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ข้อความถึงคนขับ (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น จุดรับ-ส่ง หรือสัมภาระ"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || trip.available_seats <= 0}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? 'กำลังส่งคำขอ...' : trip.available_seats <= 0 ? 'ที่นั่งเต็มแล้ว' : 'ยืนยันจองที่นั่ง'}
            </button>
          </form>
        )}
      </div>

      {/* Trip Group Chat Section (for driver & confirmed passengers) */}
      {canAccessChat && <TripChat tripId={id} />}
    </div>
  );
}
