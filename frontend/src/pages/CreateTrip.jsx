import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, MapPin, Calendar, Clock, Users, DollarSign, Car, AlertCircle, ShieldAlert } from 'lucide-react';

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [events, setEvents] = useState([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [eventId, setEventId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState(0);

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
        license_plate: licensePlate,
        event_id: eventId ? parseInt(eventId) : null,
        origin,
        destination,
        departure_time: departureTime,
        available_seats: parseInt(seats),
        price_seat: parseFloat(price),
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
    return (
      <div className="text-center py-20 space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">กำลังตรวจสอบสิทธิ์ข้อมูลคนขับและรถยนต์...</p>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="glass-card p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-xl font-bold text-amber-200">ยังไม่สามารถสร้างเที่ยวรถได้</h3>
          <p className="text-slate-300 text-sm">
            กรุณาลงทะเบียนข้อมูลรถของคุณก่อนสร้างทริป (Driver Verification System)
          </p>
          <Link
            to="/cars"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/25 transition-all"
          >
            + ลงทะเบียนรถยนต์ตอนนี้
          </Link>
        </div>
      </div>
    );
  }

  const selectedCar = cars.find((c) => c.license_plate === licensePlate);

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <div className="glass-card p-8 rounded-3xl border border-sky-500/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-sky-500/20 text-sky-400 mb-2">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">เปิดการเดินทางใหม่ (คาร์พูล)</h2>
          <p className="text-sm text-slate-400">เลือกรถที่ลงทะเบียนไว้เพื่อเปิดรับเพื่อนร่วมเดินทาง</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Registered Car */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">เลือกรถยนต์ที่ใช้เดินทาง (ทะเบียนรถ)</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Car className="w-5 h-5 text-sky-400 shrink-0" />
              <select
                required
                value={licensePlate}
                onChange={(e) => handleCarChange(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              >
                {cars.map((c) => (
                  <option key={c.license_plate} value={c.license_plate} className="bg-slate-900 text-white">
                    {c.license_plate} - {c.model} (ความจุ {c.capacity} ที่นั่ง)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Event (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">เชื่อมโยงกับกิจกรรม/อีเวนต์ (ถ้ามี)</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full text-slate-300"
              >
                <option value="" className="bg-slate-900 text-slate-400">-- ไม่ระบุอีเวนต์ (เส้นทางทั่วไป) --</option>
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id} className="bg-slate-900 text-white">
                    {ev.event_name} ({ev.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ต้นทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="เช่น อนุสาวรีย์ชัยฯ"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ปลายทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="เช่น สวนลุมพินี"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">วันที่เดินทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">เวลาออกเดินทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full text-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                จำนวนที่นั่งเปิดรับ (สูงสุด {selectedCar?.capacity || 4} ที่นั่ง)
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max={selectedCar?.capacity || 15}
                  required
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ค่าโดยสาร / ที่นั่ง (บาท)</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
          >
            {submitting ? 'กำลังเปิดการเดินทาง...' : 'บันทึกเปิดการเดินทาง'}
          </button>
        </form>
      </div>
    </div>
  );
}
