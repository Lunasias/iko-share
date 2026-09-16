import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import OwnerProfileModal from '../components/OwnerProfileModal';
import CarLoader from '../components/CarLoader';
import { Search, MapPin, Calendar, Users, Car, ArrowRight, Clock, AlertCircle, Filter, Sparkles, HeartHandshake } from 'lucide-react';

export default function Trips() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('event_id') || '');

  // Owner profile modal state
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchTrips();
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
    } catch (e) {}
  };

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams(searchParams).toString();
      const res = await API.get(`/trips?${q}`);
      if (res.data.success) {
        setTrips(res.data.trips || []);
      } else {
        setError(String(res.data.message || 'ไม่สามารถดึงข้อมูลได้'));
      }
    } catch (err) {
      console.error('Fetch trips error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (origin) params.origin = origin;
    if (destination) params.destination = destination;
    if (selectedEventId) params.event_id = selectedEventId;
    setSearchParams(params);
  };

  const openOwnerModal = (driverId) => {
    setSelectedDriverId(driverId);
    setOwnerModalOpen(true);
  };

  return (
    <div className="trips-page max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header Form */}
      <div className="travel-card p-6 sm:p-8 space-y-4 shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
          <Search className="w-5 h-5 text-emerald-600" />
          <span>ค้นหาเที่ยวคาร์พูลร่วมเดินทาง (ค้นหาทริป)</span>
        </h2>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 px-4 py-3 travel-input">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
            <input
              type="text"
              placeholder="ต้นทาง (เช่น กรุงเทพฯ)..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 travel-input">
            <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
            <input
              type="text"
              placeholder="ปลายทาง (เช่น พัทยา, เขาใหญ่)..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 travel-input">
            <Filter className="w-5 h-5 text-indigo-600 shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full font-medium"
            >
              <option value="">-- ทุกกิจกรรม/อีเวนต์ --</option>
              {events.map((ev) => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.event_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 travel-btn-primary font-bold text-sm py-3 px-6 shadow-sm"
          >
            <span>ค้นหาเที่ยวรถ</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state with CarLoader */}
      {loading ? (
        <CarLoader text="กำลังค้นหาเที่ยวเดินทางที่ตรงใจคุณ..." />
      ) : trips.length === 0 ? (
        <div className="travel-card text-center py-16 space-y-4 border border-slate-200">
          <Car className="w-14 h-14 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">ยังไม่พบเที่ยวเดินทางที่ตรงกับการค้นหา</h3>
          <p className="text-slate-500 text-xs font-medium">ลองเปลี่ยนจุดหมาย หรือเปิดเส้นทางใหม่ชวนเพื่อนร่วมทางไปด้วยกัน</p>
          <Link
            to="/create-trip"
            className="inline-flex items-center gap-2 travel-btn-primary px-6 py-2.5 font-bold text-xs shadow-md"
          >
            + เปิดการเดินทางใหม่
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const departureDate = new Date(trip.departure_time);
            return (
              <div
                key={trip.trip_id}
                className="travel-card p-6 flex flex-col justify-between travel-card-hover space-y-4 border border-slate-200 shadow-xs"
              >
                <div className="space-y-4">
                  {/* Status Badge & Event Tag - User request: "ไม่ต้องวงเล็บตรงที่ บนขวา trip" */}
                  <div className="flex items-center justify-between gap-2">
                    {trip.event_name ? (
                      <span className="text-[11px] bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold border border-purple-200 truncate max-w-[170px]">
                        {trip.event_name}
                      </span>
                    ) : (
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold border border-slate-200">
                        เที่ยวทั่วไป
                      </span>
                    )}

                    {/* Clean badge without parentheses */}
                    {trip.available_seats > 0 ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-black">
                        มีที่ว่าง {trip.available_seats} ที่
                      </span>
                    ) : (
                      <span className="text-[11px] bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full font-black">
                        เต็มแล้ว
                      </span>
                    )}
                  </div>

                  {/* Origin -> Destination */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-4">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ต้นทาง</div>
                      <div className="text-lg font-black text-slate-900">{trip.origin}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="space-y-0.5 text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ปลายทาง</div>
                      <div className="text-lg font-black text-slate-900">{trip.destination}</div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{departureDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{departureDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-semibold col-span-2">
                      <Car className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{trip.car_model} ({trip.license_plate})</span>
                    </div>
                  </div>

                  {/* Personality / Requirements Preview */}
                  {trip.driver_personality && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200 font-medium truncate">
                      🚗 สไตล์คนขับ: {trip.driver_personality}
                    </div>
                  )}

                  {/* Clickable Driver Name & Price */}
                  <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => openOwnerModal(trip.driver_id)}
                      className="text-left group flex items-center gap-2"
                      title="คลิกดูโปรไฟล์คนขับ"
                    >
                      {trip.driver_avatar ? (
                        <img src={trip.driver_avatar} alt={trip.driver_name} className="w-9 h-9 rounded-full object-cover border-2 border-[var(--accent)]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,var(--card))] text-[var(--accent)] border-2 border-[var(--accent)] flex items-center justify-center text-xs font-black">
                          {trip.driver_name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-[9px] font-bold text-slate-400">คนขับ (ดูโปรไฟล์)</div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700 underline">{trip.driver_name}</div>
                      </div>
                    </button>

                    <div className="text-right">
                      <div className="text-[9px] font-bold text-slate-400">ค่าโดยสาร / ที่นั่ง</div>
                      <div className="text-lg font-black text-emerald-700">
                        {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : 'ฟรี'}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/trips/${trip.trip_id}`}
                  className="mt-3 w-full block text-center py-2.5 travel-btn-secondary font-bold text-xs"
                >
                  ดูรายละเอียด & เข้าร่วมทริป
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Driver/Member Profile Modal */}
      <OwnerProfileModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        userId={selectedDriverId}
      />
    </div>
  );
}
