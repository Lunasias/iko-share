import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import CarLoader from '../components/CarLoader';
import { PlusCircle, MapPin, Calendar, Clock, Users, DollarSign, Car, AlertCircle, ShieldAlert, Sparkles, HeartHandshake, Tag } from 'lucide-react';

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [events, setEvents] = useState([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [tripType, setTripType] = useState('carpool');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customEventName, setCustomEventName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState(0);

  // New fields requested by user: Driver personality & passenger requirements
  const [driverPersonality, setDriverPersonality] = useState('สายชิล ชอบฟังเพลง ขับนิ่มปลอดภัย');
  const [passengerRequirements, setPassengerRequirements] = useState('ตรงต่อเวลา สัมภาระปานกลาง พูดคุยเป็นกันเอง');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    setLoading(true);
    setError('');
    try {
      const carsRes = await API.get('/cars/my');
      if (carsRes.data.success) {
        const userCars = carsRes.data.cars || [];
        setCars(userCars);
        if (userCars.length > 0) {
          setLicensePlate(userCars[0].license_plate);
          setSeats(userCars[0].capacity);
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

  const handleCarChange = (plate) => {
    setLicensePlate(plate);
    const selected = cars.find((c) => c.license_plate === plate);
    if (selected) {
      setSeats(selected.capacity);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const departureTime = `${date}T${time}:00`;
      const res = await API.post('/trips', {
        trip_type: tripType,
        license_plate: tripType === 'carpool' ? licensePlate : null,
        event_id: selectedEventId ? parseInt(selectedEventId) : null,
        custom_event_name: customEventName ? customEventName.trim() : null,
        origin,
        destination,
        departure_time: departureTime,
        available_seats: parseInt(seats),
        price_seat: parseFloat(price),
        driver_personality: driverPersonality,
        passenger_requirements: passengerRequirements,
      });

      if (res.data.success) {
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
    return <CarLoader text="กำลังตรวจสอบสิทธิ์ข้อมูลคนขับและรถยนต์..." />;
  }

  const usesCar = tripType === 'carpool';

  if (usesCar && cars.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="travel-card p-8 text-center space-y-4 border-amber-200 bg-amber-50/50">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-xl font-black text-slate-900">ยังไม่สามารถสร้างเที่ยวรถได้</h3>
          <p className="text-slate-600 text-xs font-medium">
            กรุณาลงทะเบียนข้อมูลรถของคุณก่อนสร้างทริป (Driver Verification System)
          </p>
          <Link
            to="/cars"
            className="inline-block travel-btn-primary px-6 py-3 text-xs font-bold"
          >
            + ลงทะเบียนรถยนต์ตอนนี้
          </Link>
        </div>
      </div>
    );
  }

  const selectedCar = cars.find((c) => c.license_plate === licensePlate);

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <div className="travel-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            เปิดการเดินทางใหม่ (สร้างทริปท่องเที่ยว)
          </h2>
          <p className="text-xs text-slate-500 font-medium">เลือกรถที่ลงทะเบียนไว้ กำหนดคุณสมบัติผู้ร่วมทริป และเปิดรับเพื่อนร่วมทาง</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">รูปแบบทริป</label>
            <select value={tripType} onChange={(e) => setTripType(e.target.value)} className="w-full px-4 py-3 travel-input text-sm font-semibold">
              <option value="carpool">ฉันมีรถและเปิดรับเพื่อนร่วมทาง</option>
              <option value="find_driver">ฉันไม่มีรถ — สร้างทริปเพื่อหาคนขับมาจอย</option>
              <option value="public_transport">เดินทางด้วยรถไฟ/ขนส่งสาธารณะ</option>
            </select>
            <p className="text-[11px] text-slate-500">ทริปหาคนขับจะเปิดให้คนมีรถเข้ามาพูดคุยและตกลงค่าใช้จ่ายกันเองก่อนเดินทาง</p>
          </div>

          {/* Select Registered Car */}
          <div className={`space-y-1.5 ${usesCar ? '' : 'hidden'}`}>
            <label className="text-xs font-bold text-slate-800">เลือกรถยนต์ที่ใช้เดินทาง (ทะเบียนรถ)</label>
            <div className="flex items-center gap-2 px-4 py-3 travel-input">
              <Car className="w-5 h-5 text-emerald-600 shrink-0" />
              <select
                required={usesCar}
                value={licensePlate}
                onChange={(e) => handleCarChange(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-semibold"
              >
                {cars.map((c) => (
                  <option key={c.license_plate} value={c.license_plate}>
                    {c.license_plate} - {c.model} (ความจุ {c.capacity} ที่นั่ง)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Selection & Custom Event Name (PDF Page 3 note: ยังไม่มีใส่ชื่อ EVEN) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>กิจกรรมหรืออีเวนต์ที่เกี่ยวข้อง (Event)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 font-bold">เลือกอีเวนต์ที่มีในระบบ</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    if (e.target.value) setCustomEventName('');
                  }}
                  className="w-full px-4 py-2.5 travel-input text-xs"
                >
                  <option value="">-- ไม่ระบุ (เที่ยวทั่วไป) --</option>
                  {events.map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>
                      {ev.event_name} ({ev.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 font-bold">หรือ พิมพ์ระบุชื่ออีเวนต์เอง</span>
                <input
                  type="text"
                  placeholder="เช่น Wonderfruit, คอนเสิร์ตเขาใหญ่, บิ๊กเมาน์เท่น"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">จุดเริ่มต้น (ต้นทาง)</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="เช่น อนุสาวรีย์ชัยฯ, เซ็นทรัลพระราม 9"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">จุดหมายปลายทาง</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="เช่น พัทยา, เขาใหญ่, เชียงใหม่"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">วันที่เดินทาง</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">เวลาออกเดินทาง</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                จำนวนที่นั่งเปิดรับ (สูงสุด {selectedCar?.capacity || 4} ที่นั่ง)
              </label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <Users className="w-5 h-5 text-teal-600 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max={usesCar ? (selectedCar?.capacity || 15) : 50}
                  required
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">ค่าโดยสารหารเฉลี่ย / ที่นั่ง (บาท)</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>นิสัยและสไตล์ของคนขับ</span>
              </label>
              <input
                type="text"
                placeholder="เช่น สายชิล, เปิดเพลงเพราะ, ขับนิ่ม, ไม่สูบบุหรี่"
                value={driverPersonality}
                onChange={(e) => setDriverPersonality(e.target.value)}
                className="w-full px-4 py-2.5 travel-input text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span>คุณสมบัติผู้ร่วมทริปที่ต้องการ</span>
              </label>
              <input
                type="text"
                placeholder="เช่น ตรงต่อเวลา, สัมภาระน้อย, เป็นกันเอง"
                value={passengerRequirements}
                onChange={(e) => setPassengerRequirements(e.target.value)}
                className="w-full px-4 py-2.5 travel-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 travel-btn-primary font-bold text-sm disabled:opacity-50 mt-2 shadow-lg"
          >
            {submitting ? 'กำลังเปิดการเดินทาง...' : '🚀 ยืนยันเปิดทริปท่องเที่ยว'}
          </button>
        </form>
      </div>
    </div>
  );
}
