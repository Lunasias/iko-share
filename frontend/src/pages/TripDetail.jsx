import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import TripChat from '../components/TripChat';
import ReviewModal from '../components/ReviewModal';
import OwnerProfileModal from '../components/OwnerProfileModal';
import CarLoader from '../components/CarLoader';
import {
  MapPin, Calendar, Clock, Users, Car, Phone, Mail, AlertCircle, CheckCircle,
  ArrowRight, Star, LogOut, Trash2, Check, XCircle, Camera, Image, Send,
  Sparkles, HeartHandshake, Award, ShieldCheck
} from 'lucide-react';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [meetupLocation, setMeetupLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState({ id: null, name: '' });

  // User/Owner profile modal state (Works for both driver and passengers)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Memories upload state
  const [memoryCaption, setMemoryCaption] = useState('');
  const [memoryPhoto, setMemoryPhoto] = useState('');
  const [uploadingMemory, setUploadingMemory] = useState(false);
  const memoryFileRef = useRef(null);

  useEffect(() => {
    fetchTripDetail();
    fetchMemories();
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

  const fetchMemories = async () => {
    try {
      const res = await API.get(`/memories/trip/${id}`);
      if (res.data.success) {
        setMemories(res.data.memories || []);
      }
    } catch (e) {}
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await API.post('/bookings', {
        trip_id: parseInt(id),
        location: meetupLocation,
      });

      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'ส่งคำขอร่วมเดินทางเรียบร้อยแล้ว รอคนขับอนุมัติ'));
        fetchTripDetail();
      } else {
        setError(String(res.data.message || 'ไม่สามารถร่วมเดินทางได้'));
      }
    } catch (err) {
      console.error('Join trip error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่งคำขอ'));
    } finally {
      setSubmitting(false);
    }
  };

  // Driver Party Approval Actions (PDF Page 4 note: อยากได้แบบมีให้กดอนุญาติหรือปติเสท เข้าตี้)
  const handleApproveBooking = async (bookingId) => {
    try {
      const res = await API.put(`/bookings/${bookingId}/approve`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'อนุมัติเข้าตี้เรียบร้อยแล้ว'));
        fetchTripDetail();
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอนุมัติ'));
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('คุณต้องการปฏิเสธคำขอร่วมเดินทางของผู้โดยสารท่านนี้ใช่หรือไม่?')) return;
    try {
      const res = await API.put(`/bookings/${bookingId}/reject`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'ปฏิเสธคำขอแล้ว'));
        fetchTripDetail();
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการปฏิเสธ'));
    }
  };

  const handleLeaveTrip = async () => {
    if (!window.confirm('คุณต้องการยกเลิกคำขอ / ออกจากเที่ยวเดินทางนี้ใช่หรือไม่?')) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await API.delete(`/bookings/${id}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'ยกเลิกการจองเรียบร้อยแล้ว'));
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

  const handleCompleteTrip = async () => {
    if (!window.confirm('ยืนยันว่าการเดินทางนี้เสร็จสิ้นแล้วใช่หรือไม่? ระบบจะเปิดให้แชร์ภาพความทรงจำและรีวิว')) return;
    try {
      const res = await API.put(`/trips/${id}/complete`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'จบทริปเรียบร้อยแล้ว'));
        fetchTripDetail();
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'ไม่สามารถบันทึกสถานะได้'));
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

  // Direct image memory file upload
  const handleMemoryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMemoryPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMemory = async (e) => {
    e.preventDefault();
    if (!memoryPhoto) {
      alert('กรุณาเลือกรูปภาพความทรงจำก่อนโพสต์');
      return;
    }
    setUploadingMemory(true);
    try {
      const res = await API.post(`/memories/trip/${id}`, {
        photo_url: memoryPhoto,
        caption: memoryCaption,
      });
      if (res.data.success) {
        setMemoryPhoto('');
        setMemoryCaption('');
        fetchMemories();
      } else {
        alert(String(res.data.message));
      }
    } catch (err) {
      alert(String(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'));
    } finally {
      setUploadingMemory(false);
    }
  };

  const openReviewModal = (targetId, targetName) => {
    setReviewTarget({ id: targetId, name: targetName });
    setReviewModalOpen(true);
  };

  const openUserProfile = (userId) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  if (loading) {
    return <CarLoader text="กำลังโหลดรายละเอียดเที่ยวเดินทาง..." />;
  }

  if (error || !trip) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="travel-card p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600">{error || 'ไม่พบข้อมูลการเดินทาง'}</h3>
          <button
            onClick={() => navigate('/trips')}
            className="travel-btn-primary px-5 py-2.5 text-xs font-bold"
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
  const myBooking = passengers.find((p) => p.user_id === currentUserId && ['จองแล้ว', 'รอการอนุมัติ'].includes(p.booking_status));
  const isApprovedMember = Boolean(passengers.find((p) => p.user_id === currentUserId && p.booking_status === 'จองแล้ว'));
  const canAccessChat = isDriver || isApprovedMember || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Route Title Card */}
      <div className="travel-card p-6 sm:p-8 space-y-6 shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full uppercase tracking-wider">
                {trip.event_name ? `ทริปอีเวนต์: ${trip.event_name}` : 'ทริปเดินทางท่องเที่ยว'}
              </span>
              {trip.trip_status === 'completed' && (
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full">
                  ✓ จบทริปแล้ว
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              <span>{trip.origin}</span>
              <ArrowRight className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>{trip.destination}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              {/* User request: "ไม่ต้องวงเล็บตรงที่ บนขวา trip" */}
              <div className="text-[11px] font-bold text-slate-500">ค่าโดยสาร / ที่นั่ง</div>
              <div className="text-3xl font-black text-emerald-700">
                {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : 'ฟรี'}
              </div>
            </div>

            {(isDriver || isAdmin) && (
              <div className="flex items-center gap-2">
                {trip.trip_status !== 'completed' && (
                  <button
                    onClick={handleCompleteTrip}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-xs font-bold flex items-center gap-1"
                    title="บันทึกว่าจบทริปแล้ว"
                  >
                    <Award className="w-4 h-4" />
                    <span>จบทริป</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteTrip}
                  disabled={submitting}
                  className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  title="ลบเที่ยวเดินทางนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid (No unnecessary parentheses) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>วันที่เดินทาง</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {departureDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>เวลาออกเดินทาง</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {departureDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
              <Users className="w-4 h-4 text-teal-600" />
              <span>สถานะที่นั่ง</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {trip.available_seats > 0 ? (
                <span className="text-emerald-700">มีที่ว่าง {trip.available_seats} ที่</span>
              ) : (
                <span className="text-red-600">ที่นั่งเต็มแล้ว</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
              <Car className="w-4 h-4 text-indigo-600" />
              <span>ข้อมูลรถยนต์</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">{trip.car_model || 'รถส่วนตัว'}</div>
            <div className="text-xs text-slate-500 font-mono font-bold">ทะเบียน {trip.license_plate}</div>
          </div>
        </div>

        {/* Driver Personality & Passenger Criteria Badges */}
        {(trip.driver_personality || trip.passenger_requirements) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            {trip.driver_personality && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>นิสัยและสไตล์คนขับ:</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">{trip.driver_personality}</p>
              </div>
            )}

            {trip.passenger_requirements && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>คุณสมบัติผู้ร่วมทริปที่ต้องการ:</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">{trip.passenger_requirements}</p>
              </div>
            )}
          </div>
        )}

        {/* Clickable Driver Info (Opens Profile Modal) */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => openUserProfile(trip.driver_id)}
            className="flex items-center gap-3 text-left group"
            title="คลิกเพื่อดูโปรไฟล์คนขับรถ"
          >
            {trip.driver_avatar ? (
              <img src={trip.driver_avatar} alt={trip.driver_name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-500 flex items-center justify-center font-black text-lg shadow-sm">
                {trip.driver_name?.charAt(0)}
              </div>
            )}
            <div className="space-y-0.5">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">คนขับรถ (คลิกดูโปรไฟล์)</div>
              <div className="text-base font-black text-slate-900 group-hover:text-emerald-700 underline">
                {trip.driver_name}
              </div>
              {trip.driver_phone && <div className="text-xs text-slate-500 font-medium">โทร: {trip.driver_phone}</div>}
            </div>
          </button>

          {user && !isDriver && isApprovedMember && (
            <button
              onClick={() => openReviewModal(trip.driver_id, trip.driver_name)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl border border-amber-200 text-xs shadow-xs"
            >
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>ให้คะแนนคนขับ</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Passenger List & Party Approval Management */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>รายชื่อเพื่อนร่วมเดินทาง ({passengers.length} คน)</span>
          </h4>

          {passengers.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs font-medium">
              ยังไม่มีผู้โดยสารส่งคำขอร่วมเดินทางในเที่ยวนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passengers.map((p) => {
                const isPending = p.booking_status === 'รอการอนุมัติ';
                const isConfirmed = p.booking_status === 'จองแล้ว';

                return (
                  <div key={p.booking_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between text-xs space-y-3">
                    {/* Clickable Passenger Name/Avatar (User Request & PDF Page 4 & 6) */}
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openUserProfile(p.user_id)}
                        className="flex items-center gap-2.5 text-left group"
                        title="คลิกเพื่อดูโปรไฟล์ผู้โดยสาร"
                      >
                        {p.passenger_avatar ? (
                          <img src={p.passenger_avatar} alt={p.passenger_name} className="w-9 h-9 rounded-full object-cover border border-slate-300" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {p.passenger_name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-emerald-700 underline">
                            {p.passenger_name}
                          </div>
                          <div className="text-[10px] text-slate-500">โทร: {p.passenger_phone || '-'}</div>
                        </div>
                      </button>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isConfirmed ? 'bg-emerald-100 text-emerald-800' :
                        isPending ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.booking_status}
                      </span>
                    </div>

                    {p.location && (
                      <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                        จุดนัดพบ: {p.location}
                      </div>
                    )}

                    {/* Driver Party Approve / Reject Buttons (PDF Page 4 note) */}
                    {isDriver && isPending && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                        <button
                          onClick={() => handleApproveBooking(p.booking_id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>อนุมัติเข้าตี้</span>
                        </button>
                        <button
                          onClick={() => handleRejectBooking(p.booking_id)}
                          className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-red-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ปฏิเสธ</span>
                        </button>
                      </div>
                    )}

                    {/* Review passenger */}
                    {isDriver && isConfirmed && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => openReviewModal(p.user_id, p.passenger_name)}
                          className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>ให้คะแนนผู้โดยสาร</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Join Trip or Leave Trip Controls */}
        {isDriver ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-center text-xs font-bold">
            🚗 คุณคือคนขับผู้เปิดให้บริการการเดินทางนี้
          </div>
        ) : myBooking ? (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-center">
            <div className={`text-xs font-bold ${myBooking.booking_status === 'จองแล้ว' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {myBooking.booking_status === 'จองแล้ว'
                ? '✓ คำขอของคุณได้รับการอนุมัติแล้ว คุณอยู่ในตี้ร่วมเดินทางนี้'
                : '⏳ คำขอร่วมเดินทางของคุณกำลังรอคนขับอนุมัติ...'}
            </div>
            <button
              onClick={handleLeaveTrip}
              disabled={submitting}
              className="px-5 py-2.5 travel-btn-danger text-xs flex items-center justify-center gap-1.5 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>ยกเลิกคำขอ / ออกจากทริป</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900">ขอเข้าร่วมเดินทางในตี้ (Request to Join Party)</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">ระบุจุดขึ้นรถ / จุดนัดพบที่สะดวก</label>
              <input
                type="text"
                placeholder="เช่น ป้ายรถเมล์หน้าสวนสาธารณะ, หน้าบีทีเอสอโศก"
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || trip.available_seats <= 0}
              className="w-full py-3.5 travel-btn-primary font-bold text-xs disabled:opacity-50 shadow-md"
            >
              {submitting ? 'กำลังส่งคำขอเข้าตี้...' : trip.available_seats <= 0 ? 'ที่นั่งเต็มแล้ว' : '🚀 ขอเข้าร่วมตี้เดินทาง'}
            </button>
          </form>
        )}
      </div>

      {/* Post-trip Memories & Photo Album (User request: อยากให้มีที่เก็บภาพของtrip หลังจบไปแล้วและเขียนประสบการ trip ได้) */}
      <div className="travel-card p-6 sm:p-8 space-y-6 shadow-md border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span>ภาพความทรงจำ & ประสบการณ์หลังจบทริป (Trip Memories)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">บันทึกภาพถ่าย บรรยากาศ และเรื่องราวประทับใจร่วมกับเพื่อนร่วมทาง</p>
          </div>
        </div>

        {/* Upload new memory form (available to trip members) */}
        {canAccessChat && (
          <form onSubmit={handleUploadMemory} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-800">แชร์ภาพและเรื่องราวประสบการณ์ทริปนี้</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => memoryFileRef.current?.click()}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs flex items-center justify-center gap-2 shrink-0"
              >
                <Image className="w-4 h-4 text-emerald-600" />
                <span>{memoryPhoto ? '✓ เลือกภาพแล้ว' : 'เลือกรูปภาพทริป'}</span>
              </button>
              <input
                type="file"
                ref={memoryFileRef}
                onChange={handleMemoryFileChange}
                accept="image/*"
                className="hidden"
              />

              <input
                type="text"
                placeholder="เขียนแคปชั่น เล่าประสบการณ์ ความประทับใจ หรือความสนุกในทริป..."
                value={memoryCaption}
                onChange={(e) => setMemoryCaption(e.target.value)}
                className="flex-1 px-4 py-2.5 travel-input text-xs"
              />

              <button
                type="submit"
                disabled={uploadingMemory || !memoryPhoto}
                className="px-5 py-2.5 travel-btn-primary font-bold text-xs disabled:opacity-50 shrink-0"
              >
                {uploadingMemory ? 'กำลังโพสต์...' : 'โพสต์ความทรงจำ'}
              </button>
            </div>
            {memoryPhoto && (
              <div className="pt-2">
                <img src={memoryPhoto} alt="Preview" className="w-32 h-24 object-cover rounded-xl border-2 border-emerald-500 shadow-sm" />
              </div>
            )}
          </form>
        )}

        {/* Memories Gallery */}
        {memories.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
            ยังไม่มีภาพความทรงจำที่โพสต์ในทริปนี้ สมาชิกในทริปสามารถร่วมกันแชร์ภาพได้เลย!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {memories.map((m) => (
              <div key={m.memory_id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs space-y-2">
                <img src={m.photo_url} alt={m.caption || 'Trip Photo'} className="w-full h-44 object-cover" />
                <div className="p-3 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                      {m.author_name?.charAt(0)}
                    </span>
                    <span>{m.author_name}</span>
                  </div>
                  {m.caption && <p className="text-xs text-slate-800 font-medium leading-relaxed">"{m.caption}"</p>}
                </div>
              </div>
            ))}
          </div>
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

      {/* Member/Driver Profile Modal */}
      <OwnerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedUserId}
      />
    </div>
  );
}
