import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { uploadImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TripChat from '../components/TripChat';
import ReviewModal from '../components/ReviewModal';
import OwnerProfileModal from '../components/OwnerProfileModal';
import ShareTripModal from '../components/ShareTripModal';
import TripRouteMap from '../components/TripRouteMap';
import CarLoader from '../components/CarLoader';
import {
  MapPin, Calendar, Clock, Users, Car, Phone, Mail, AlertCircle, CheckCircle,
  ArrowRight, Star, LogOut, Trash2, Check, XCircle, Camera, Image, Send,
  Sparkles, HeartHandshake, Award, ShieldCheck, UserMinus, RefreshCw, ExternalLink,
  QrCode, CreditCard, CheckCircle2, Eye, UploadCloud, Download, Share2,
  Leaf, Trees
} from 'lucide-react';
import { getPromptPayQrUrl, formatPhoneNumber } from '../utils/promptpay';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTh } = useTheme();

  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [meetupLocation, setMeetupLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isBookingProcessing, setIsBookingProcessing] = useState(false);
  const [acceptedPassengerTerms, setAcceptedPassengerTerms] = useState(false);
  const isActionInProgressRef = useRef(false);


  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState({ id: null, name: '' });
  // Reviews written by the current user inside this trip (1 review per member)
  const [myReviews, setMyReviews] = useState([]);

  // User/Owner profile modal state (Works for both driver and passengers)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Memories upload state
  const [memoryCaption, setMemoryCaption] = useState('');
  const [memoryPhoto, setMemoryPhoto] = useState('');
  const [uploadingMemory, setUploadingMemory] = useState(false);
  const memoryFileRef = useRef(null);

  // Payment states
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [viewingSlipUrl, setViewingSlipUrl] = useState('');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);
  const slipFileInputRef = useRef(null);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleUploadSlip = async (e, bookingId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlip(true);
    setActionError('');
    try {
      const uploadRes = await uploadImage(file);
      const imageUrl = uploadRes.imageUrl || uploadRes.url || uploadRes.path;
      if (!imageUrl) throw new Error('ไม่สามารถอัปโหลดรูปภาพสลิปได้');
      const res = await API.put(`/bookings/${bookingId}/payment-slip`, { slip_url: imageUrl });
      if (res.data.success) {
        setSuccessMsg(isTh ? 'แนบสลิปเรียบร้อยแล้ว กำลังรอคนขับตรวจสอบ' : 'Payment slip uploaded, waiting for driver confirmation');
        await fetchTripDetail();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการแนบสลิป');
    } finally {
      setUploadingSlip(false);
      if (slipFileInputRef.current) slipFileInputRef.current.value = '';
    }
  };

  const handleVerifyPayment = async (bookingId, targetStatus) => {
    setVerifyingPaymentId(bookingId);
    setActionError('');
    try {
      const res = await API.put(`/bookings/${bookingId}/verify-payment`, { status: targetStatus });
      if (res.data.success) {
        setSuccessMsg(res.data.message || (isTh ? 'อัปเดตสถานะการชำระเงินแล้ว' : 'Payment status updated'));
        await fetchTripDetail();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการยืนยัน');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  useEffect(() => {
    fetchTripDetail();
    fetchMemories();
  }, [id]);

  useEffect(() => {
    fetchMyReviews();
  }, [id, user]);

  // Reviews the current user already submitted in this trip (title/button switch to "edit").
  const fetchMyReviews = async () => {
    if (!user) {
      setMyReviews([]);
      return;
    }
    try {
      const res = await API.get(`/reviews/trip/${id}/mine`);
      if (res.data.success) {
        setMyReviews(res.data.reviews || []);
      }
    } catch (e) {
      setMyReviews([]);
    }
  };

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

    if (!acceptedPassengerTerms) {
      setActionError('กรุณาทำเครื่องหมายยอมรับข้อตกลงและข้อจำกัดความรับผิดชอบก่อนส่งคำขอร่วมเดินทาง');
      return;
    }

    // Synchronous Ref Guard to immediately intercept double clicks (#BUG-102)
    if (isActionInProgressRef.current || submitting || isBookingProcessing) {
      return;
    }

    isActionInProgressRef.current = true;
    setIsBookingProcessing(true);
    setSubmitting(true);
    setActionError('');
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
        setActionError(String(res.data.message || 'ไม่สามารถร่วมเดินทางได้'));
      }
    } catch (err) {
      console.error('Join trip error:', err);
      setActionError(String(err.userFriendlyMessage || err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่งคำขอ'));
    } finally {
      setSubmitting(false);
      setIsBookingProcessing(false);
      isActionInProgressRef.current = false;
    }
  };

  // Driver Party Approval Actions (PDF Page 4 note: อยากได้แบบมีให้กดอนุญาติหรือปติเสท เข้าตี้)
  const handleApproveBooking = async (bookingId) => {
    setActionError('');
    setSuccessMsg('');
    try {
      const res = await API.put(`/bookings/${bookingId}/approve`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'อนุมัติเข้าตี้เรียบร้อยแล้ว'));
        fetchTripDetail();
      }
    } catch (err) {
      setActionError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอนุมัติ'));
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('คุณต้องการปฏิเสธคำขอร่วมเดินทางของผู้โดยสารท่านนี้ใช่หรือไม่?')) return;
    setActionError('');
    setSuccessMsg('');
    try {
      const res = await API.put(`/bookings/${bookingId}/reject`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'ปฏิเสธคำขอแล้ว'));
        fetchTripDetail();
      }
    } catch (err) {
      setActionError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการปฏิเสธ'));
    }
  };

  // Room head (trip owner) / admin: remove a member from the party.
  const handleKickPassenger = async (userId, passengerName) => {
    if (!window.confirm(`คุณต้องการนำ ${passengerName} ออกจากตี้นี้ใช่หรือไม่? ที่นั่งจะถูกคืนเข้าระบบ`)) return;
    setActionError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await API.delete(`/trips/${id}/passengers/${userId}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'นำสมาชิกออกจากตี้เรียบร้อยแล้ว'));
        fetchTripDetail();
      } else {
        setActionError(String(res.data.message || 'ไม่สามารถนำสมาชิกออกจากตี้ได้'));
      }
    } catch (err) {
      setActionError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการนำสมาชิกออกจากตี้'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTrip = async () => {
    if (!window.confirm('คุณต้องการยกเลิกคำขอ / ออกจากเที่ยวเดินทางนี้ใช่หรือไม่?')) return;
    setSubmitting(true);
    setActionError('');
    setSuccessMsg('');
    try {
      const res = await API.delete(`/bookings/${id}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'ยกเลิกการจองเรียบร้อยแล้ว'));
        fetchTripDetail();
      } else {
        setActionError(String(res.data.message || 'ไม่สามารถยกเลิกได้'));
      }
    } catch (err) {
      setActionError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการยกเลิกการจอง'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!window.confirm('ยืนยันว่าการเดินทางนี้เสร็จสิ้นแล้วใช่หรือไม่? ระบบจะเปิดให้แชร์ภาพความทรงจำและรีวิว')) return;
    setActionError('');
    setSuccessMsg('');
    try {
      const res = await API.put(`/trips/${id}/complete`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'จบทริปเรียบร้อยแล้ว'));
        fetchTripDetail();
      }
    } catch (err) {
      setActionError(String(err.response?.data?.message || err.message || 'ไม่สามารถบันทึกสถานะได้'));
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('คุณต้องการลบเที่ยวเดินทางนี้ใช่หรือไม่? ข้อมูลการจองและแชทจะถูกลบทั้งหมด')) return;
    setSubmitting(true);
    setActionError('');
    setSuccessMsg('');
    try {
      const res = await API.delete(`/trips/${id}`);
      if (res.data.success) {
        alert(String(res.data.message || 'ลบเที่ยวเดินทางเรียบร้อยแล้ว'));
        navigate('/trips');
      } else {
        setActionError(String(res.data.message || 'ไม่สามารถลบเที่ยวเดินทางได้'));
      }
    } catch (err) {
      setActionError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการลบเที่ยวเดินทาง'));
    } finally {
      setSubmitting(false);
    }
  };

  // Direct image memory file upload to Image Storage Service
  const handleMemoryFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('ขนาดไฟล์ภาพต้องไม่เกิน 8 MB');
      return;
    }

    setUploadingMemory(true);
    try {
      const uploadRes = await uploadImage(file);
      if (uploadRes.success && uploadRes.url) {
        setMemoryPhoto(uploadRes.url);
      } else {
        alert(String(uploadRes.message || 'ไม่สามารถอัปโหลดรูปภาพได้'));
      }
    } catch (err) {
      console.error('Upload memory image error:', err);
      alert(String(err.userFriendlyMessage || err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'));
    } finally {
      setUploadingMemory(false);
    }
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
      alert(String(err.userFriendlyMessage || err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกภาพความทรงจำ'));
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
    return <CarLoader text={isTh ? "กำลังโหลดรายละเอียดเที่ยวเดินทาง..." : "Loading journey details..."} />;
  }

  if (error || !trip) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="travel-card p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-600">{error || (isTh ? 'ไม่พบข้อมูลการเดินทาง' : 'Trip information not found')}</h3>
          <button
            onClick={() => navigate('/trips')}
            className="travel-btn-primary px-5 py-2.5 text-xs font-bold"
          >
            {isTh ? 'กลับสู่หน้ารายการเที่ยวรถ' : 'Back to Trips List'}
          </button>
        </div>
      </div>
    );
  }

  const departureDate = new Date(trip.departure_time);
  const currentUserId = user ? (user.user_id || user.id) : null;
  const isDriver = currentUserId && currentUserId === trip.driver_id;
  const isAdmin = user && (user.is_admin || user.email === 'admin@ikoshare.com');
  const myBooking = passengers.find((p) => p.user_id === currentUserId && ['จองแล้ว', 'รอการอนุมัติ'].includes(p.booking_status));
  const isApprovedMember = Boolean(passengers.find((p) => p.user_id === currentUserId && p.booking_status === 'จองแล้ว'));
  const canAccessChat = isDriver || isApprovedMember || isAdmin;

  // Room head = car owner (driver) or the organizer of a car-less trip (find driver / public transport).
  const isTripOwner = Boolean(currentUserId && (currentUserId === trip.driver_id || currentUserId === trip.organizer_id));
  const canModerateParty = isTripOwner || Boolean(isAdmin);
  // Everyone inside the party may review each other (and admins may review anyone).
  const canReviewMembers = isTripOwner || isApprovedMember || Boolean(isAdmin);
  const reviewedTargetIds = new Set(myReviews.map((review) => Number(review.target_user_id)));
  const myReviewFor = (targetId) => myReviews.find((review) => Number(review.target_user_id) === Number(targetId));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Route Title Card */}
      <div className="travel-card p-6 sm:p-8 space-y-6 shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full uppercase tracking-wider">
                {trip.event_name ? (isTh ? `ทริปอีเวนต์: ${trip.event_name}` : `Event Trip: ${trip.event_name}`) : (isTh ? 'ทริปเดินทางท่องเที่ยว' : 'Travel Journey')}
              </span>
              {trip.trip_status === 'completed' && (
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full">
                  {isTh ? '✓ จบทริปแล้ว' : '✓ Completed'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              <span>{trip.origin}</span>
              <ArrowRight className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>{trip.destination}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              {/* User request: "ไม่ต้องวงเล็บตรงที่ บนขวา trip" */}
              <div className="text-[11px] font-bold text-slate-500">{isTh ? 'ค่าโดยสาร / ที่นั่ง' : 'Fare / seat'}</div>
              <div className="text-3xl font-black text-emerald-700">
                {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : (isTh ? 'ฟรี' : 'Free')}
              </div>
            </div>

            {/* Share Trip Button */}
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title={isTh ? "แชร์ทริปนี้" : "Share this trip"}
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? 'แชร์' : 'Share'}</span>
            </button>

            {(isDriver || isAdmin) && (
              <div className="flex items-center gap-2">
                {trip.trip_status !== 'completed' && (
                  <button
                    onClick={handleCompleteTrip}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-xs font-bold flex items-center gap-1"
                    title={isTh ? "บันทึกว่าจบทริปแล้ว" : "Mark trip as completed"}
                  >
                    <Award className="w-4 h-4" />
                    <span>{isTh ? 'จบทริป' : 'Complete'}</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteTrip}
                  disabled={submitting}
                  className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer"
                  title={isTh ? "ลบเที่ยวเดินทางนี้" : "Delete this trip"}
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
              <span>{isTh ? 'วันที่เดินทาง' : 'Travel Date'}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {departureDate.toLocaleDateString(isTh ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{isTh ? 'เวลาออกเดินทาง' : 'Departure Time'}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {departureDate.toLocaleTimeString(isTh ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })} {isTh ? 'น.' : ''}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
              <Users className="w-4 h-4 text-teal-600" />
              <span>{isTh ? 'สถานะที่นั่ง' : 'Seat Status'}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {trip.available_seats > 0 ? (
                <span className="text-emerald-700">{isTh ? `มีที่ว่าง ${trip.available_seats} ที่` : `${trip.available_seats} seats left`}</span>
              ) : (
                <span className="text-red-600">{isTh ? 'ที่นั่งเต็มแล้ว' : 'Seats full'}</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
              <Car className="w-4 h-4 text-indigo-600" />
              <span>{isTh ? 'ข้อมูลรถยนต์' : 'Vehicle Info'}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {trip.license_plate
                ? (trip.car_model || (isTh ? 'รถส่วนตัว' : 'Private Car'))
                : trip.trip_type === 'find_driver'
                ? (isTh ? 'หาคนขับร่วมทาง' : 'Find Driver')
                : trip.trip_type === 'public_transport'
                ? (isTh ? 'ขนส่งสาธารณะ' : 'Public Transport')
                : (isTh ? 'ไม่ระบุพาหนะ' : 'Unspecified')}
            </div>
            <div className="text-xs text-slate-500 font-mono font-bold">
              {trip.license_plate
                ? `${isTh ? 'ทะเบียน' : 'Plate'} ${trip.license_plate}`
                : trip.trip_type === 'find_driver'
                ? (isTh ? 'ไม่มีรถยนต์ประจำทริป' : 'No vehicle assigned')
                : (isTh ? 'ไม่ระบุทะเบียน' : 'No plate specified')}
            </div>
          </div>

          {(trip.distance_km || trip.duration_text || (trip.origin && trip.destination)) && (
            <div className="col-span-1 sm:col-span-2 md:col-span-4">
              <TripRouteMap trip={trip} isTh={isTh} />
            </div>
          )}
        </div>

        {/* Eco-Friendly Carbon Saved & Green Impact Card */}
        {(() => {
          const distanceNum = parseFloat(trip.distance_km) || (trip.origin && trip.destination ? 35 : 0);
          const activeRiderCount = Math.max(1, passengers.filter((p) => p.booking_status === 'จองแล้ว').length);
          const co2SavedKg = ((distanceNum * activeRiderCount * 0.12)).toFixed(1);
          const treeDaysEquiv = Math.max(1, Math.round(co2SavedKg / 0.06));
          const carsOffRoad = activeRiderCount;

          return (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/40 border border-emerald-200/90 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <span>{isTh ? 'สถิติการเดินทางสีเขียว (Eco-Impact)' : 'Green Travel Impact'}</span>
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                        🌱 Carpool for Earth
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      {isTh
                        ? 'การเดินทางร่วมกันในทริปนี้ช่วยลดการปล่อยก๊าซเรือนกระจกและบรรเทาปัญหาโลกร้อน'
                        : 'Carpooling on this journey helps reduce carbon emissions and global warming'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  {isTh ? `ผู้ร่วมทาง ${activeRiderCount} คน` : `${activeRiderCount} carpoolers`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CO2 Saved */}
                <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-emerald-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTh ? 'ลดการปล่อย CO₂' : 'CO₂ Avoided'}</span>
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-lg font-black text-emerald-700">
                    ~{co2SavedKg} <span className="text-xs font-bold text-slate-600">kg CO₂e</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{isTh ? 'เทียบกับการขับรถแยกคัน' : 'vs driving separately'}</p>
                </div>

                {/* Trees Equivalent */}
                <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-emerald-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTh ? 'เทียบเท่าการดูดซับ' : 'Tree Absorption'}</span>
                    <Trees className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="text-lg font-black text-teal-700">
                    ~{treeDaysEquiv} <span className="text-xs font-bold text-slate-600">{isTh ? 'วันต้นไม้' : 'tree-days'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{isTh ? 'เทียบเท่าการดูดซับของต้นไม้' : 'natural carbon absorption'}</p>
                </div>

                {/* Cars off road */}
                <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-emerald-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTh ? 'ลดรถบนท้องถนน' : 'Cars Reduced'}</span>
                    <Car className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-lg font-black text-indigo-700">
                    -{carsOffRoad} <span className="text-xs font-bold text-slate-600">{isTh ? 'คัน' : 'cars'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{isTh ? 'ช่วยลดปัญหาการจราจร' : 'reduces traffic congestion'}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Driver Personality & Passenger Criteria Badges */}
        {(trip.driver_personality || trip.passenger_requirements) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            {trip.driver_personality && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{isTh ? 'นิสัยและสไตล์คนขับ:' : 'Driver Style & Personality:'}</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">{trip.driver_personality}</p>
              </div>
            )}

            {trip.passenger_requirements && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>{isTh ? 'คุณสมบัติผู้ร่วมทริปที่ต้องการ:' : 'Preferred Passenger Criteria:'}</span>
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
            title={isTh ? "คลิกเพื่อดูโปรไฟล์คนขับรถ" : "Click to view driver profile"}
          >
            {trip.driver_avatar ? (
              <img src={trip.driver_avatar} alt={trip.driver_name} loading="lazy" decoding="async" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-500 flex items-center justify-center font-black text-lg shadow-sm">
                {trip.driver_name?.charAt(0)}
              </div>
            )}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{isTh ? 'คนขับรถ (คลิกดูโปรไฟล์)' : 'Driver (profile)'}</span>
                {trip.driver_is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>🛡️ {isTh ? 'ยืนยันตัวตนแล้ว' : 'Verified'}</span>
                  </span>
                )}
              </div>
              <div className="text-base font-black text-slate-900 group-hover:text-emerald-700 underline">
                {trip.driver_name}
              </div>
              {trip.driver_phone && <div className="text-xs text-slate-500 font-medium">{isTh ? 'โทร:' : 'Phone:'} {trip.driver_phone}</div>}
            </div>
          </button>

          {canReviewMembers && !isTripOwner && (
            <button
              onClick={() => openReviewModal(trip.driver_id, trip.driver_name)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl border border-amber-200 text-xs shadow-xs"
            >
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{reviewedTargetIds.has(Number(trip.driver_id)) ? (isTh ? 'แก้ไขรีวิวหัวห้อง' : 'Edit Host Review') : (isTh ? 'ให้คะแนนหัวห้อง / คนขับ' : 'Review Host / Driver')}</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError('')}
              className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 transition"
              title={isTh ? "ปิดการแจ้งเตือน" : "Dismiss"}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition"
              title={isTh ? "ปิดการแจ้งเตือน" : "Dismiss"}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PromptPay Dynamic Payment Box for Confirmed Passenger */}
        {isApprovedMember && !isTripOwner && myBooking && parseFloat(trip.price_seat) > 0 && (
          <div className="travel-card p-6 sm:p-8 space-y-6 shadow-md border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 rounded-3xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
                    <QrCode className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{isTh ? 'ชำระค่าเดินทางผ่าน PromptPay' : 'PromptPay QR Payment'}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                        {isTh ? 'ระบบอัตโนมัติ' : 'Dynamic QR'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {isTh ? 'สแกน QR Code ด้วยแอปธนาคารเพื่อโอนเงินค่าเดินทางตามจริง และแนบสลิปด้านล่าง' : 'Scan the QR code with any mobile banking app and upload your slip below'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-500">{isTh ? 'ยอดที่ต้องชำระ' : 'Amount Due'}</div>
                <div className="text-2xl font-black text-emerald-700">฿{trip.price_seat}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="relative p-2 bg-white rounded-xl border-2 border-emerald-600/30 shadow-sm">
                  {trip.driver_phone ? (
                    <img
                      src={getPromptPayQrUrl(trip.driver_phone, trip.price_seat, 220)}
                      alt="PromptPay QR Code"
                      loading="lazy"
                      decoding="async"
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400 font-bold text-center p-4">
                      {isTh ? 'คนขับยังไม่ได้ระบุเบอร์โทรศัพท์' : 'Driver has not provided phone'}
                    </div>
                  )}
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-blue-900 text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs">
                    PromptPay
                  </div>
                </div>

                <div className="text-center space-y-0.5">
                  <div className="text-xs font-bold text-slate-700">
                    {isTh ? 'พร้อมเพย์:' : 'PromptPay ID:'} <span className="font-mono text-emerald-700 font-extrabold">{formatPhoneNumber(trip.driver_phone)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isTh ? `ชื่อบัญชีคนขับ: ${trip.driver_name}` : `Account: ${trip.driver_name}`}
                  </div>
                </div>
              </div>

              {/* Slip Upload & Status */}
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                    <span>{isTh ? 'สถานะการชำระเงินของคุณ' : 'Your Payment Status'}</span>
                    {myBooking.payment_status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isTh ? 'คนขับยืนยันรับเงินแล้ว' : 'Payment Confirmed'}</span>
                      </span>
                    ) : myBooking.payment_status === 'pending_verification' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>{isTh ? 'แนบสลิปแล้ว รอตรวจสอบ' : 'Slip Uploaded, Pending'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
                        <span>{isTh ? 'ยังไม่ได้แนบสลิป' : 'Unpaid / No Slip'}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isTh
                      ? 'เมื่อโอนเงินสำเร็จแล้ว กรุณากดปุ่มด้านล่างเพื่อแนบภาพสลิปหลักฐานการโอนเงิน เพื่อให้คนขับตรวจสอบและยืนยันการชำระ'
                      : 'Once transferred, upload your payment slip receipt below for driver verification.'}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={slipFileInputRef}
                      onChange={(e) => handleUploadSlip(e, myBooking.booking_id)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingSlip}
                      onClick={() => slipFileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploadingSlip ? (isTh ? 'กำลังอัปโหลดสลิป...' : 'Uploading...') : (myBooking.payment_slip_url ? (isTh ? 'เปลี่ยนรูปสลิปใหม่' : 'Replace Slip') : (isTh ? 'แนบรูปภาพสลิปโอนเงิน' : 'Upload Payment Slip'))}</span>
                    </button>

                    {myBooking.payment_slip_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingSlipUrl(myBooking.payment_slip_url);
                          setSlipModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <span>{isTh ? 'ดูสลิปที่แนบไว้' : 'View Uploaded Slip'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Passenger List & Party Approval Management */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{isTh ? `รายชื่อเพื่อนร่วมเดินทาง (${passengers.length} คน)` : `Trip Companions (${passengers.length})`}</span>
          </h4>

          {passengers.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs font-medium">
              {isTh ? 'ยังไม่มีผู้โดยสารส่งคำขอร่วมเดินทางในเที่ยวนี้' : 'No passengers have requested to join this trip yet'}
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
                        title={isTh ? "คลิกเพื่อดูโปรไฟล์ผู้โดยสาร" : "Click to view passenger profile"}
                      >
                        {p.passenger_avatar ? (
                          <img src={p.passenger_avatar} alt={p.passenger_name} loading="lazy" decoding="async" className="w-9 h-9 rounded-full object-cover border border-slate-300" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {p.passenger_name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-emerald-700 underline">
                            {p.passenger_name}
                          </div>
                          <div className="text-[10px] text-slate-500">{isTh ? 'โทร:' : 'Phone:'} {p.passenger_phone || '-'}</div>
                        </div>
                      </button>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isConfirmed ? 'bg-emerald-100 text-emerald-800' :
                        isPending ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isConfirmed ? (isTh ? 'จองแล้ว' : 'Confirmed') : isPending ? (isTh ? 'รอการอนุมัติ' : 'Pending') : (isTh ? p.booking_status : 'Cancelled')}
                      </span>
                    </div>

                    {p.location && (
                      <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                        {isTh ? 'จุดนัดพบ:' : 'Meeting point:'} {p.location}
                      </div>
                    )}

                    {/* Room head / Admin Party Approve / Reject Buttons */}
                    {canModerateParty && isPending && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                        <button
                          onClick={() => handleApproveBooking(p.booking_id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isTh ? 'อนุมัติเข้าตี้' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleRejectBooking(p.booking_id)}
                          className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-red-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isTh ? 'ปฏิเสธ' : 'Reject'}</span>
                        </button>
                      </div>
                    )}

                    {/* Room head / Admin: kick a member out of the party */}
                    {canModerateParty && (isPending || isConfirmed) && Number(p.user_id) !== Number(currentUserId) && (
                      <div className="pt-1 border-t border-slate-200 flex justify-end">
                        <button
                          onClick={() => handleKickPassenger(p.user_id, p.passenger_name)}
                          disabled={submitting}
                          className="text-[11px] text-red-600 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                          title={isTh ? "นำสมาชิกท่านนี้ออกจากตี้ (เฉพาะหัวห้อง / แอดมิน)" : "Remove member from party (Owner / Admin only)"}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>{isTh ? 'นำออกจากตี้' : 'Remove'}</span>
                        </button>
                      </div>
                    )}

                    {/* Payment status badge & driver actions */}
                    {isConfirmed && parseFloat(trip.price_seat) > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-bold">{isTh ? 'การชำระเงิน:' : 'Payment:'}</span>
                          {p.payment_status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isTh ? 'ชำระแล้ว' : 'Paid'}</span>
                            </span>
                          ) : p.payment_status === 'pending_verification' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{isTh ? 'รอตรวจสลิป' : 'Slip pending'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-600">
                              <span>{isTh ? 'ยังไม่ชำระ' : 'Unpaid'}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {p.payment_slip_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingSlipUrl(p.payment_slip_url);
                                setSlipModalOpen(true);
                              }}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 text-[10px] flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>{isTh ? 'ดูสลิป' : 'View slip'}</span>
                            </button>
                          )}

                          {canModerateParty && (
                            p.payment_status !== 'paid' ? (
                              <button
                                type="button"
                                disabled={verifyingPaymentId === p.booking_id}
                                onClick={() => handleVerifyPayment(p.booking_id, 'paid')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>{isTh ? 'ยืนยันรับเงิน' : 'Confirm'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={verifyingPaymentId === p.booking_id}
                                onClick={() => handleVerifyPayment(p.booking_id, 'unpaid')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px] disabled:opacity-50 cursor-pointer"
                              >
                                <span>{isTh ? 'ยกเลิกยืนยัน' : 'Unconfirm'}</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Members review each other — one review per member per trip */}
                    {canReviewMembers && isConfirmed && Number(p.user_id) !== Number(currentUserId) && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => openReviewModal(p.user_id, p.passenger_name)}
                          className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{reviewedTargetIds.has(Number(p.user_id)) ? (isTh ? 'แก้ไขรีวิวเพื่อนร่วมทาง' : 'Edit Review') : (isTh ? 'รีวิวเพื่อนร่วมทาง' : 'Review Companion')}</span>
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
            {isTh ? '🚗 คุณคือคนขับผู้เปิดให้บริการการเดินทางนี้' : '🚗 You are the driver who created this journey'}
          </div>
        ) : myBooking ? (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-center">
            <div className={`text-xs font-bold ${myBooking.booking_status === 'จองแล้ว' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {myBooking.booking_status === 'จองแล้ว'
                ? (isTh ? '✓ คำขอของคุณได้รับการอนุมัติแล้ว คุณอยู่ในตี้ร่วมเดินทางนี้' : '✓ Your request is confirmed. You are in this travel party!')
                : (isTh ? '⏳ คำขอร่วมเดินทางของคุณกำลังรอคนขับอนุมัติ...' : '⏳ Your request is pending approval from the driver...')}
            </div>
            <button
              onClick={handleLeaveTrip}
              disabled={submitting}
              className="px-5 py-2.5 travel-btn-danger text-xs flex items-center justify-center gap-1.5 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>{isTh ? 'ยกเลิกคำขอ / ออกจากทริป' : 'Cancel Request / Leave Trip'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900">{isTh ? 'ขอเข้าร่วมเดินทางในตี้ (Request to Join Party)' : 'Request to Join Party'}</h3>

            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">{isTh ? 'ระบุจุดขึ้นรถ / จุดนัดพบที่สะดวก' : 'Specify Pickup Point / Preferred Meeting Spot'}</label>
              <input
                type="text"
                placeholder={isTh ? "เช่น ป้ายรถเมล์หน้าสวนสาธารณะ, หน้าบีทีเอสอโศก" : "e.g. Bus stop in front of the park, BTS Asok"}
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs"
              />
            </div>

            {/* Passenger Liability Disclaimer & Agreement */}
            <div className="p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={acceptedPassengerTerms}
                  onChange={(e) => setAcceptedPassengerTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
                />
                <span className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  {isTh ? (
                    <>ข้าพเจ้ารับทราบว่าการร่วมเดินทางเป็นการแบ่งปันค่าใช้จ่ายด้วยความสมัครใจ แพลตฟอร์ม Iko Share และผู้ดูแลระบบเป็นเพียงสื่อกลางเชื่อมต่อ <strong>ไม่สามารถเอาผิดหรือเรียกร้องค่าเสียหายใดๆ ต่อเจ้าของเว็บไซต์และผู้ดูแลระบบทุกกรณี</strong></>
                  ) : (
                    <>I acknowledge that carpooling is a voluntary cost-sharing arrangement. Iko Share and its administrators are solely a communication platform and <strong>I waive all rights to claim damages or hold website owners/admins legally liable in any case</strong>.</>
                  )}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || trip.available_seats <= 0 || !acceptedPassengerTerms}
              className="w-full py-3.5 travel-btn-primary font-bold text-xs disabled:opacity-50 shadow-md"
            >
              {submitting ? (isTh ? 'กำลังส่งคำขอเข้าตี้...' : 'Sending request...') : trip.available_seats <= 0 ? (isTh ? 'ที่นั่งเต็มแล้ว' : 'Seats full') : (isTh ? '🚀 ขอเข้าร่วมตี้เดินทาง' : '🚀 Request to Join Party')}
            </button>

          </form>
        )}
      </div>

      {/* Post-trip Memories & Photo Album */}
      <div className="travel-card p-6 sm:p-8 space-y-6 shadow-md border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span>{isTh ? 'ภาพความทรงจำ & ประสบการณ์หลังจบทริป (Trip Memories)' : 'Trip Memories & Post-Trip Highlights (Trip Memories)'}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {isTh ? 'บันทึกภาพถ่าย บรรยากาศ และเรื่องราวประทับใจร่วมกับเพื่อนร่วมทาง' : 'Save photos, vibes, and memorable stories with your travel companions'}
            </p>
          </div>
        </div>

        {/* Upload new memory form (available to trip members) */}
        {canAccessChat && (
          <form onSubmit={handleUploadMemory} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-800">{isTh ? 'แชร์ภาพและเรื่องราวประสบการณ์ทริปนี้' : 'Share photos and trip experiences'}</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => memoryFileRef.current?.click()}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs flex items-center justify-center gap-2 shrink-0"
              >
                <Image className="w-4 h-4 text-emerald-600" />
                <span>{memoryPhoto ? (isTh ? '✓ เลือกภาพแล้ว' : '✓ Photo selected') : (isTh ? 'เลือกรูปภาพทริป' : 'Select trip photo')}</span>
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
                placeholder={isTh ? "เขียนแคปชั่น เล่าประสบการณ์ ความประทับใจ หรือความสนุกในทริป..." : "Write a caption, share trip impressions or memories..."}
                value={memoryCaption}
                onChange={(e) => setMemoryCaption(e.target.value)}
                className="flex-1 px-4 py-2.5 travel-input text-xs"
              />

              <button
                type="submit"
                disabled={uploadingMemory || !memoryPhoto}
                className="px-5 py-2.5 travel-btn-primary font-bold text-xs disabled:opacity-50 shrink-0"
              >
                {uploadingMemory ? (isTh ? 'กำลังโพสต์...' : 'Posting...') : (isTh ? 'โพสต์ความทรงจำ' : 'Post Memory')}
              </button>
            </div>
            {memoryPhoto && (
              <div className="pt-2">
                <img src={memoryPhoto} alt="Preview" loading="lazy" decoding="async" className="w-32 h-24 object-cover rounded-xl border-2 border-emerald-500 shadow-sm" />
              </div>
            )}
          </form>
        )}

        {/* Memories Gallery */}
        {memories.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
            {isTh ? 'ยังไม่มีภาพความทรงจำที่โพสต์ในทริปนี้ สมาชิกในทริปสามารถร่วมกันแชร์ภาพได้เลย!' : 'No memories posted for this trip yet. Trip members can share photos and memories here!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {memories.map((m) => (
              <div key={m.memory_id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs space-y-2">
                <img src={m.photo_url} alt={m.caption || 'Trip Photo'} loading="lazy" decoding="async" className="w-full h-44 object-cover" />
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
        onClose={() => { setReviewModalOpen(false); fetchMyReviews(); }}
        tripId={parseInt(id)}
        targetUserId={reviewTarget.id}
        targetName={reviewTarget.name}
        existingReview={reviewTarget.id ? myReviewFor(reviewTarget.id) : null}
      />

      {/* Member/Driver Profile Modal */}
      <OwnerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedUserId}
      />

      {/* Double Submit & Network Latency Protection Overlay (#BUG-102) */}
      {isBookingProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-auto text-center shadow-2xl space-y-4 border border-slate-100">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-slate-900">{isTh ? 'กำลังประมวลผลคำขอร่วมเดินทาง...' : 'Processing join request...'}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {isTh ? 'ระบบกำลังเชื่อมต่อและยืนยันข้อมูล กรุณารอสักครู่เพื่อป้องกันการส่งคำขอซ้ำซ้อน' : 'Connecting and verifying information. Please wait to prevent duplicate submissions.'}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 py-1 px-3 rounded-full font-bold">
                {isTh ? '✓ ป้องกันการกดย้ำ (#BUG-102 Active)' : '✓ Duplicate click protection active'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Slip Modal Preview */}
      {slipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{isTh ? 'สลิปหลักฐานการโอนเงิน' : 'Payment Slip Receipt'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setSlipModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-slate-100 flex items-center justify-center p-2 border border-slate-200">
              <img
                src={viewingSlipUrl}
                alt="Payment Slip"
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={viewingSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isTh ? 'เปิดดูรูปเต็ม' : 'Open Full Image'}</span>
              </a>
              <button
                type="button"
                onClick={() => setSlipModalOpen(false)}
                className="travel-btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
              >
                {isTh ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Trip Modal */}
      <ShareTripModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        trip={trip}
      />
    </div>
  );
}
