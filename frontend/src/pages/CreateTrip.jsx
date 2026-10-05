import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CarLoader from '../components/CarLoader';
import {
  PlusCircle, MapPin, Calendar, Clock, Users, Car, AlertCircle,
  ShieldAlert, Sparkles, HeartHandshake, Tag, Navigation, Gauge, Calculator, Lock, ExternalLink, Map
} from 'lucide-react';

function ThaiBahtIcon({ className = "w-5 h-5", strokeWidth = 2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="12" y1="2.5" x2="12" y2="21.5" />
      <path d="M6.5 4.5v15" />
      <path d="M6.5 5.5h5.5a3.25 3.25 0 0 1 0 6.5H6.5" />
      <path d="M6.5 12h6a3.5 3.5 0 0 1 0 7H6.5" />
    </svg>
  );
}

export default function CreateTrip() {
  const { user } = useAuth();
  const { isTh } = useTheme();
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [events, setEvents] = useState([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [tripType, setTripType] = useState(user?.role === 'Passenger' ? 'find_driver' : 'carpool');
  const canCreateCarpool = user?.role === 'Driver' || user?.role === 'Both';
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customEventName, setCustomEventName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState(0);

  // Google Maps Distance & Travel Duration & Depreciation state
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationText, setDurationText] = useState('');
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // New fields requested by user: Driver personality & passenger requirements
  const [driverPersonality, setDriverPersonality] = useState(isTh ? 'สายชิล ชอบฟังเพลง ขับนิ่มปลอดภัย' : 'Chill driver, loves music, safe drive');
  const [passengerRequirements, setPassengerRequirements] = useState(isTh ? 'ตรงต่อเวลา สัมภาระปานกลาง พูดคุยเป็นกันเอง' : 'Punctual, reasonable luggage, friendly');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedDriverTerms, setAcceptedDriverTerms] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    if (user?.role === 'Passenger') {
      setTripType('find_driver');
    }
  }, [user]);

  const fetchPrerequisites = async () => {
    setLoading(true);
    setError('');
    try {
      const carsRes = await API.get('/cars/my');
      if (carsRes.data.success) {
        const userCars = carsRes.data.cars || [];
        setCars(userCars);
        if (userCars.length > 0) {
          const firstApproved = userCars.find((c) => (c.verification_status || 'อนุมัติแล้ว') === 'อนุมัติแล้ว') || userCars[0];
          setLicensePlate(firstApproved.license_plate);
          setSeats(firstApproved.capacity);
        }
      }

      const eventsRes = await API.get('/events');
      if (eventsRes.data.success) {
        setEvents(eventsRes.data.events || []);
      }
    } catch (err) {
      console.error('Fetch prerequisites error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรถ'));
    } finally {
      setLoading(false);
    }
  };

const computeCostBreakdown = (distKm, seatCount) => {
  const FUEL_RATE = 2.20;
  const DEPR_RATE = 1.30;
  const dist = parseFloat(distKm) || 0;
  const count = Math.max(1, parseInt(seatCount) || 1);
  const fuelCost = Math.round(dist * FUEL_RATE);
  const depreciationCost = Math.round(dist * DEPR_RATE);
  const totalCost = fuelCost + depreciationCost;
  const recommendedSeatPrice = Math.max(25, Math.round((totalCost / count) / 10) * 10);
  const reasonableMinPrice = Math.max(20, Math.round(recommendedSeatPrice * 0.4));
  return {
    fuel_rate_per_km: FUEL_RATE,
    depreciation_rate_per_km: DEPR_RATE,
    estimated_fuel_cost: fuelCost,
    estimated_depreciation_cost: depreciationCost,
    total_operating_cost: totalCost,
    recommended_price_per_seat: recommendedSeatPrice,
    min_reasonable_price: reasonableMinPrice,
    fuelCost,
    depreciationCost,
    totalCost,
    recommendedSeatPrice,
    reasonableMinPrice,
  };
};

  const handleCarChange = (plate) => {
    setLicensePlate(plate);
    const selected = cars.find((c) => c.license_plate === plate);
    if (selected) {
      setSeats(selected.capacity);
      if (distanceKm) {
        const recalculated = computeCostBreakdown(distanceKm, selected.capacity);
        setCostBreakdown(recalculated);
        setPrice(recalculated.recommendedSeatPrice);
      }
    }
  };

  const handleSeatsChange = (newSeatsVal) => {
    setSeats(newSeatsVal);
    const count = parseInt(newSeatsVal) || 1;
    if (distanceKm) {
      const recalculated = computeCostBreakdown(distanceKm, count);
      setCostBreakdown(recalculated);
      setPrice(recalculated.recommendedSeatPrice);
    }
  };

  // Today's date in the local (Thai) timezone — used as the min value of the date picker.
  const todayStr = (() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  })();

  // Current local time — used to stop picking a past hour when travelling today.
  const nowTimeStr = (() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  })();

  const handleCalculateRoute = async () => {
    if (!origin.trim() || !destination.trim()) {
      setError('กรุณากรอกทั้งจุดเริ่มต้นและจุดหมายปลายทางเพื่อคำนวณระยะทาง');
      return;
    }
    setCalculatingRoute(true);
    setError('');
    try {
      const res = await API.post('/trips/estimate-route', {
        origin: origin.trim(),
        destination: destination.trim(),
        available_seats: seats || 4,
      });
      if (res.data.success) {
        setDistanceKm(res.data.distanceKm);
        setDurationText(res.data.durationText);
        setCostBreakdown(res.data.costBreakdown);
        setPrice(res.data.costBreakdown.recommendedSeatPrice);
      }
    } catch (err) {
      console.warn('Calculate route estimate error:', err);
      setError(String(err.response?.data?.message || err.message || 'ไม่สามารถคำนวณเส้นทางได้'));
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!date || !time) {
      setError('กรุณาระบุวันและเวลาออกเดินทางให้ครบถ้วน');
      return;
    }

    // Enforce reasonable minimum fare lock if price > 0 and distance >= 40km
    const numPrice = parseFloat(price);
    if (numPrice > 0 && distanceKm && distanceKm >= 40 && costBreakdown?.reasonableMinPrice) {
      if (numPrice < costBreakdown.reasonableMinPrice) {
        setError(`สำหรับระยะทางประมาณ ${Math.round(distanceKm)} กม. ค่าโดยสารขั้นต่ำควรไม่น้อยกว่า ฿${costBreakdown.reasonableMinPrice} ต่อที่นั่ง เพื่อความสมเหตุสมผลตามต้นทุนจริง (หรือระบุ ฿0 หากต้องการให้เดินทางฟรี)`);
        return;
      }
    }

    // Build the instant from the user's local date/time, then send ISO (UTC) so the
    // stored TIMESTAMPTZ is exact and no +7 hours shift happens on display.
    const localDeparture = new Date(`${date}T${time}:00`);
    if (Number.isNaN(localDeparture.getTime())) {
      setError('รูปแบบวันและเวลาออกเดินทางไม่ถูกต้อง');
      return;
    }

    if (localDeparture.getTime() < Date.now()) {
      setError('ไม่สามารถตั้งเวลาออกเดินทางย้อนหลังได้ กรุณาเลือกวันและเวลาในอนาคต');
      return;
    }

    setSubmitting(true);

    try {
      const departureTime = localDeparture.toISOString();
      const res = await API.post('/trips', {
        trip_type: tripType,
        license_plate: tripType === 'carpool' ? licensePlate : null,
        event_id: selectedEventId ? parseInt(selectedEventId) : null,
        custom_event_name: customEventName ? customEventName.trim() : null,
        origin: origin.trim(),
        destination: destination.trim(),
        departure_time: departureTime,
        available_seats: parseInt(seats),
        price_seat: numPrice,
        driver_personality: driverPersonality,
        passenger_requirements: passengerRequirements,
        distance_km: distanceKm,
        duration_text: durationText,
      });

      if (res.data.success) {
        try {
          sessionStorage.removeItem('iko_cached_events');
          sessionStorage.removeItem('iko_cached_trips');
          sessionStorage.removeItem('iko_cache_trips_all');
        } catch {}
        navigate('/my-trips');
      } else {
        setError(String(res.data.message || 'ไม่สามารถเปิดการเดินทางได้'));
      }
    } catch (err) {
      console.error('Create trip error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการสร้างเที่ยวเดินทาง'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <CarLoader text={isTh ? "กำลังตรวจสอบสิทธิ์ข้อมูลคนขับและรถยนต์..." : "Verifying driver and car permissions..."} />;
  }

  const usesCar = tripType === 'carpool';

  if (usesCar && cars.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="travel-card p-8 text-center space-y-4 border-amber-200 bg-amber-50/50">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-xl font-black text-slate-900">{isTh ? 'ยังไม่สามารถสร้างเที่ยวรถได้' : 'Cannot create a carpool trip yet'}</h3>
          <p className="text-slate-600 text-xs font-medium">
            {isTh ? 'กรุณาลงทะเบียนข้อมูลรถของคุณก่อนสร้างทริป (Driver Verification System)' : 'Please register your vehicle before creating a trip (Driver Verification System)'}
          </p>
          <Link
            to="/cars"
            className="inline-block travel-btn-primary px-6 py-3 text-xs font-bold"
          >
            {isTh ? '+ ลงทะเบียนรถยนต์ตอนนี้' : '+ Register Vehicle Now'}
          </Link>
        </div>
      </div>
    );
  }

  const selectedCar = cars.find((c) => c.license_plate === licensePlate);
  const isCarApproved = !usesCar || (selectedCar && (selectedCar.verification_status || 'อนุมัติแล้ว') === 'อนุมัติแล้ว');

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <div className="travel-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            {isTh ? 'เปิดการเดินทางใหม่ (สร้างทริปท่องเที่ยว)' : 'Create New Journey (Create Trip)'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isTh ? 'เลือกรถที่ลงทะเบียนไว้ กำหนดคุณสมบัติผู้ร่วมทริป และเปิดรับเพื่อนร่วมทาง' : 'Select registered vehicle, set passenger preferences, and invite companions'}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTh ? 'รูปแบบทริป (ล็อกประเภทมาตรฐานของระบบ)' : 'Trip Mode (Standard System Mode)'}</span>
              </label>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                {isTh ? '3 รูปแบบมาตรฐาน' : '3 Standard Modes'}
              </span>
            </div>
            <select value={tripType} onChange={(e) => setTripType(e.target.value)} className="w-full px-4 py-3 travel-input text-sm font-semibold">
              {canCreateCarpool && (
                <option value="carpool">{isTh ? 'ฉันมีรถและเปิดรับเพื่อนร่วมทาง (Carpool)' : 'I have a car and offer seats (Carpool)'}</option>
              )}
              <option value="find_driver">{isTh ? 'ฉันไม่มีรถ — สร้างทริปเพื่อหาคนขับมาจอย (Find Driver)' : 'I have no car — Looking for driver (Find Driver)'}</option>
              <option value="public_transport">{isTh ? 'เดินทางด้วยรถไฟ/ขนส่งสาธารณะ (Public Transport)' : 'Travel by Train / Public Transport'}</option>
            </select>
            <p className="text-[11px] text-slate-500">
              {isTh ? 'ระบบล็อกประเภทการเดินทาง 3 รูปแบบมาตรฐานเพื่อความปลอดภัยและโครงสร้างข้อมูลที่ถูกต้อง' : 'Standard 3-mode structure for road safety and data integrity'}
            </p>
          </div>

          {/* Select Registered Car */}
          <div className={`space-y-2 ${usesCar ? '' : 'hidden'}`}>
            <div className="flex items-center justify-between min-h-[20px]">
              <label className="text-xs font-bold text-slate-800">{isTh ? 'เลือกรถยนต์ที่ใช้เดินทาง (ทะเบียนรถ)' : 'Select Vehicle (License Plate)'}</label>
              <Link to="/cars" className="text-[11px] text-emerald-600 font-bold hover:underline">
                {isTh ? '+ ลงทะเบียนรถ / ถ่ายรูปป้ายทะเบียน' : '+ Register Car / Plate Photo'}
              </Link>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
              <Car className="w-5 h-5 text-amber-500 shrink-0" />
              <select
                required={usesCar}
                value={licensePlate}
                onChange={(e) => handleCarChange(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-semibold"
              >
                {cars.map((c) => {
                  const status = c.verification_status || 'อนุมัติแล้ว';
                  const statusLabel = status === 'อนุมัติแล้ว' ? '✓ [อนุมัติแล้ว]' : status === 'รอดำเนินการ' ? '⏳ [รอแอดมินตรวจ]' : '❌ [ไม่ผ่านการอนุมัติ]';
                  return (
                    <option key={c.license_plate} value={c.license_plate}>
                      {c.license_plate} - {c.model} ({c.capacity} ที่นั่ง) {statusLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Warning if selected car is pending or rejected */}
            {selectedCar && selectedCar.verification_status === 'รอดำเนินการ' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">{isTh ? 'รถคันนี้อยู่ระหว่างรอแอดมินตรวจสอบป้ายทะเบียน' : 'Car is pending admin review'}</div>
                  <div className="text-[11px] text-amber-800 leading-relaxed">
                    {isTh ? 'เพื่อความปลอดภัยของผู้ร่วมเดินทาง รถยนต์ต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อน จึงจะสามารถเปิดทริปได้' : 'For passenger safety, vehicle must be approved by admin before offering rides.'}
                  </div>
                </div>
              </div>
            )}

            {selectedCar && selectedCar.verification_status === 'ปฏิเสธ' && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">{isTh ? 'รถคันนี้ไม่ผ่านการอนุมัติจากผู้ดูแลระบบ' : 'Car rejected by admin'}</div>
                  <div className="text-[11px] text-rose-800 leading-relaxed">
                    {isTh ? `สาเหตุ: ${selectedCar.admin_reply || 'รูปถ่ายป้ายทะเบียนไม่ชัดเจน'} (กรุณาไปที่หน้ารถยนต์เพื่อลงทะเบียนใหม่)` : `Reason: ${selectedCar.admin_reply || 'Invalid photo'}`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event Selection & Custom Event Name */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>{isTh ? 'กิจกรรมหรืออีเวนต์ที่เกี่ยวข้อง (Event)' : 'Associated Event'}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 font-bold">{isTh ? 'เลือกอีเวนต์ที่มีในระบบ' : 'Select existing event'}</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    if (e.target.value) setCustomEventName('');
                  }}
                  className="w-full px-4 py-2.5 travel-input text-xs"
                >
                  <option value="">{isTh ? '-- ไม่ระบุ (เที่ยวทั่วไป) --' : '-- Unspecified (General Trip) --'}</option>
                  {events.map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>
                      {ev.event_name} ({ev.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 font-bold">{isTh ? 'หรือ พิมพ์ระบุชื่ออีเวนต์เอง' : 'Or type custom event name'}</span>
                <input
                  type="text"
                  placeholder={isTh ? "เช่น Wonderfruit, คอนเสิร์ตเขาใหญ่, บิ๊กเมาน์เท่น" : "e.g. Wonderfruit, Khao Yai Concert"}
                  value={customEventName}
                  onChange={(e) => {
                    setCustomEventName(e.target.value);
                    if (e.target.value) setSelectedEventId('');
                  }}
                  className="w-full px-4 py-2.5 travel-input text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between min-h-[20px]">
                  <label className="text-xs font-bold text-slate-800">{isTh ? 'จุดเริ่มต้น (ต้นทาง)' : 'Origin (Start Location)'}</label>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder={isTh ? "เช่น อนุสาวรีย์ชัยฯ, เซ็นทรัลพระราม 9" : "e.g. Victory Monument, Central Rama 9"}
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    onBlur={() => {
                      if (origin.trim() && destination.trim() && !costBreakdown) {
                        handleCalculateRoute();
                      }
                    }}
                    className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between min-h-[20px]">
                  <label className="text-xs font-bold text-slate-800">{isTh ? 'จุดหมายปลายทาง' : 'Destination'}</label>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder={isTh ? "เช่น พัทยา, เขาใหญ่, เชียงใหม่" : "e.g. Pattaya, Khao Yai, Chiang Mai"}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onBlur={() => {
                      if (origin.trim() && destination.trim() && !costBreakdown) {
                        handleCalculateRoute();
                      }
                    }}
                    className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCalculateRoute}
                disabled={calculatingRoute || !origin.trim() || !destination.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>{calculatingRoute ? (isTh ? 'กำลังดึงระยะทาง...' : 'Calculating...') : (isTh ? '🗺️ ดึงระยะทาง Google Maps & คำนวณค่าเสื่อมรถ' : '🗺️ Estimate Google Maps Distance & Depreciation')}</span>
              </button>
            </div>
          </div>

          {/* Depreciation & Route Breakdown Card */}
          {costBreakdown && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-emerald-600" />
                  <span>{isTh ? 'ข้อมูลเส้นทาง & การคำนวณค่าเสื่อมรถสำหรับเจ้าของรถ' : 'Route & Depreciation Calculation for Vehicle Owners'}</span>
                </span>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-emerald-200 text-xs shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">{isTh ? 'ระยะทาง:' : 'Distance:'}</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={distanceKm}
                    onChange={(e) => {
                      const newDist = parseFloat(e.target.value) || 0;
                      setDistanceKm(newDist);
                      const recalculated = computeCostBreakdown(newDist, seats);
                      setCostBreakdown(recalculated);
                      setPrice(recalculated.recommendedSeatPrice);
                    }}
                    className="w-16 text-center font-black text-emerald-800 bg-emerald-50/60 rounded border border-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 py-0.5 text-xs"
                    title={isTh ? 'คลิกเพื่อแก้ไขระยะทางได้' : 'Click to adjust distance'}
                  />
                  <span className="font-bold text-emerald-800">{isTh ? 'กม.' : 'km'}</span>
                  {durationText && (
                    <span className="text-slate-400 font-normal ml-0.5">({durationText})</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">{isTh ? 'ค่าน้ำมันโดยประมาณ (~2.20 บ./กม.)' : 'Est. Fuel (~฿2.20/km)'}</div>
                  <div className="font-extrabold text-slate-800 text-sm mt-0.5">฿{costBreakdown.fuelCost?.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">{isTh ? 'ค่าเสื่อม/ซ่อมบำรุง (~1.30 บ./กม.)' : 'Depreciation (~฿1.30/km)'}</div>
                  <div className="font-extrabold text-emerald-700 text-sm mt-0.5">+฿{costBreakdown.depreciationCost?.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">{isTh ? 'ต้นทุนรถรวม' : 'Total Vehicle Cost'}</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">฿{costBreakdown.totalCost?.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs flex flex-col justify-center">
                  <div className="text-[10px] text-emerald-100 font-medium">{isTh ? `ราคาหารเฉลี่ย (${seats} ที่นั่ง)` : `Shared Fare (${seats} seats)`}</div>
                  <div className="font-black text-base mt-0.5">฿{costBreakdown.recommendedSeatPrice}</div>
                </div>
              </div>

              {/* Live Interactive Google Maps Embed Preview */}
              <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-xs mt-2 bg-slate-100">
                <iframe
                  title="Google Maps Route Preview"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(origin + ' to ' + destination)}&output=embed`}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                <div className="space-y-0.5">
                  <p className="text-[11px] text-slate-600">
                    {isTh
                      ? `💡 ต้นทุนรวม ฿${costBreakdown.totalCost?.toLocaleString()} ÷ ${seats} ที่นั่ง = แนะนำ ฿${costBreakdown.recommendedSeatPrice} ต่อคน (รวมค่าน้ำมันและค่าเสื่อมสึกหรอตามระยะทางจริง)`
                      : `💡 Total cost ฿${costBreakdown.totalCost?.toLocaleString()} ÷ ${seats} seats = Recommended ฿${costBreakdown.recommendedSeatPrice} / seat (includes actual fuel and vehicle wear & tear)`}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isTh ? 'เปิดดูเส้นทางบน Google Maps เต็มจอ' : 'Open Route on Google Maps in full view'}</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setPrice(costBreakdown.recommendedSeatPrice)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0 self-start sm:self-auto"
                >
                  {isTh ? `ใช้ราคาแนะนำนี้ (฿${costBreakdown.recommendedSeatPrice})` : `Use recommended fare (฿${costBreakdown.recommendedSeatPrice})`}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-slate-800">{isTh ? 'วันที่เดินทาง' : 'Departure Date'}</label>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-slate-800">{isTh ? 'เวลาออกเดินทาง' : 'Departure Time'}</label>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="time"
                  required
                  min={date === todayStr ? nowTimeStr : undefined}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-slate-800">{isTh ? 'จำนวนที่นั่งเปิดรับ' : 'Seats Offered'}</label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isTh ? `สูงสุด ${selectedCar?.capacity || 4} ที่นั่ง` : `Max ${selectedCar?.capacity || 4} seats`}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                <Users className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max={usesCar ? (selectedCar?.capacity || 15) : 50}
                  required
                  value={seats}
                  onChange={(e) => handleSeatsChange(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-slate-800">{isTh ? 'ค่าโดยสารหารเฉลี่ย / ที่นั่ง (บาท)' : 'Shared Fare / Seat (THB)'}</label>
                {costBreakdown?.reasonableMinPrice ? (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isTh ? `ขั้นต่ำ ฿${costBreakdown.reasonableMinPrice} (หรือ ฿0)` : `Min ฿${costBreakdown.reasonableMinPrice} (or ฿0)`}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">{isTh ? '฿0 หากฟรี' : '฿0 if free'}</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                <ThaiBahtIcon className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-bold"
                />
              </div>
            </div>
          </div>

          {/* Personality of Driver & Passenger Criteria (User Request) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-slate-800">{isTh ? 'นิสัยและสไตล์ของคนขับ' : 'Driver Style & Personality'}</label>
                <span className="text-[11px] text-slate-400 font-medium">{isTh ? 'ไม่บังคับ' : 'Optional'}</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="text"
                  placeholder={isTh ? "เช่น สายชิล, เปิดเพลงเพราะ, ขับนิ่ม, ไม่สูบบุหรี่" : "e.g. Chill, loves music, safe drive, non-smoking"}
                  value={driverPersonality}
                  onChange={(e) => setDriverPersonality(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between min-h-[20px]">
                <label className="text-xs font-bold text-slate-800">{isTh ? 'คุณสมบัติผู้ร่วมทริปที่ต้องการ' : 'Preferred Passenger Criteria'}</label>
                <span className="text-[11px] text-slate-400 font-medium">{isTh ? 'ไม่บังคับ' : 'Optional'}</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 travel-input h-12">
                <HeartHandshake className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="text"
                  placeholder={isTh ? "เช่น ตรงต่อเวลา, สัมภาระน้อย, เป็นกันเอง" : "e.g. Punctual, light luggage, friendly"}
                  value={passengerRequirements}
                  onChange={(e) => setPassengerRequirements(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Driver Liability Disclaimer & Confirmation */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={acceptedDriverTerms}
                onChange={(e) => setAcceptedDriverTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
              />
              <span className="text-[11px] text-slate-700 font-medium leading-relaxed">
                {isTh ? (
                  <>ข้าพเจ้ายืนยันว่ายานพาหนะมีสภาพปลอดภัยและมีใบอนุญาตขับขี่/พ.ร.บ. ถูกต้องตามกฎหมาย และรับทราบว่า Iko Share เป็นเพียงสื่อกลางเชื่อมต่อผู้ร่วมเดินทางเพื่อแบ่งปันค่าน้ำมันเท่านั้น <strong>ไม่สามารถเรียกร้องค่าเสียหายหรือดำเนินคดีเอาผิดต่อเจ้าของเว็บไซต์และผู้ดูแลระบบทุกกรณี</strong></>
                ) : (
                  <>I confirm that the vehicle is roadworthy and complies with driving license/insurance laws. I acknowledge that Iko Share is merely a communication platform to share travel costs and <strong>waive all rights to hold website owners or administrators legally liable under all circumstances</strong>.</>
                )}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !acceptedDriverTerms || !isCarApproved}
            className="w-full py-4 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2 shadow-lg cursor-pointer"
          >
            {submitting ? (
              isTh ? 'กำลังเปิดการเดินทาง...' : 'Creating journey...'
            ) : !isCarApproved ? (
              isTh ? '⚠️ รถคันนี้ยังไม่ผ่านการอนุมัติจากแอดมิน' : '⚠️ Car not approved by admin yet'
            ) : (
              isTh ? '🚀 ยืนยันเปิดทริปท่องเที่ยว' : '🚀 Confirm & Create Journey'
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
