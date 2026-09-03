import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import OwnerProfileModal from '../components/OwnerProfileModal';
import { Search, MapPin, Calendar, Users, Car, ArrowRight, Clock, AlertCircle, Filter } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header Form */}
      <div className="neu-card p-6 space-y-4">
        <h2 className="text-xl font-black text-[#3D4852] flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
          <Search className="w-5 h-5 text-[#6C63FF]" />
          <span>ค้นหาเที่ยวคาร์พูลร่วมเดินทาง</span>
        </h2>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 px-4 py-3 neu-input">
            <MapPin className="w-5 h-5 text-[#6C63FF] shrink-0" />
            <input
              type="text"
              placeholder="ต้นทาง..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 neu-input">
            <MapPin className="w-5 h-5 text-[#38B2AC] shrink-0" />
            <input
              type="text"
              placeholder="ปลายทาง..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 neu-input">
            <Filter className="w-5 h-5 text-purple-600 shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent border-none text-[#3D4852] text-sm focus:outline-none w-full"
            >
              <option value="" className="bg-[#E0E5EC] text-slate-500">-- ทุกกิจกรรม/อีเวนต์ --</option>
              {events.map((ev) => (
                <option key={ev.event_id} value={ev.event_id} className="bg-[#E0E5EC] text-[#3D4852]">
                  {ev.event_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 neu-button-primary font-bold text-sm py-3 px-6"
          >
            <span>ค้นหาเที่ยวรถ</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#6B7280] text-xs font-semibold">กำลังค้นหาเที่ยวเดินทาง...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="neu-card text-center py-16 space-y-4">
          <Car className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-[#3D4852]">ยังไม่พบเที่ยวเดินทางที่ตรงกับการค้นหา</h3>
          <p className="text-[#6B7280] text-xs">ลองเปลี่ยนเงื่อนไขการค้นหา หรือเปิดเส้นทางเดินทางใหม่เป็นคนแรก</p>
          <Link
            to="/create-trip"
            className="inline-flex items-center gap-2 neu-button-primary px-5 py-2.5 font-bold text-xs"
          >
            เปิดการเดินทางใหม่
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const departureDate = new Date(trip.departure_time);
            return (
              <div
                key={trip.trip_id}
                className="neu-card p-6 flex flex-col justify-between neu-card-hover space-y-4"
              >
                <div className="space-y-4">
                  {/* Status Badge & Event Tag */}
                  <div className="flex items-center justify-between gap-2">
                    {trip.event_name ? (
                      <span className="text-[10px] bg-purple-500/20 text-purple-700 px-3 py-1 rounded-full font-bold neu-pill truncate">
                        {trip.event_name}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-300 text-slate-600 px-3 py-1 rounded-full font-bold neu-pill">ทั่วไป</span>
                    )}

                    {trip.available_seats > 0 ? (
                      <span className="text-[10px] bg-[#38B2AC]/20 text-[#2C7A7B] px-3 py-1 rounded-full font-extrabold neu-pill">
                        มีที่ว่าง ({trip.available_seats} ที่)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-500/20 text-red-600 px-3 py-1 rounded-full font-extrabold neu-pill">
                        เต็มแล้ว
                      </span>
                    )}
                  </div>

                  {/* Origin -> Destination */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#6B7280]">ต้นทาง</div>
                      <div className="text-base font-extrabold text-[#3D4852]">{trip.origin}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#6C63FF] shrink-0" />
                    <div className="space-y-1 text-right">
                      <div className="text-[10px] font-bold text-[#6B7280]">ปลายทาง</div>
                      <div className="text-base font-extrabold text-[#3D4852]">{trip.destination}</div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#3D4852] font-semibold">
                      <Calendar className="w-4 h-4 text-[#6C63FF] shrink-0" />
                      <span>{departureDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[#3D4852] font-semibold">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{departureDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                    </div>

                    <div className="flex items-center gap-2 text-[#3D4852] font-semibold col-span-2">
                      <Car className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{trip.car_model} ({trip.license_plate})</span>
                    </div>
                  </div>

                  {/* Clickable Driver Name & Price */}
                  <div className="pt-3 flex items-center justify-between border-t border-slate-300">
                    <button
                      type="button"
                      onClick={() => openOwnerModal(trip.driver_id)}
                      className="text-left group flex items-center gap-2"
                    >
                      {trip.driver_avatar ? (
                        <img src={trip.driver_avatar} alt={trip.driver_name} className="w-8 h-8 rounded-full object-cover neu-pill" />
                      ) : (
                        <div className="w-8 h-8 rounded-full neu-inset text-[#6C63FF] flex items-center justify-center text-xs font-bold">
                          {trip.driver_name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-[9px] font-bold text-[#6B7280]">คนขับ (ดูโปรไฟล์)</div>
                        <div className="text-xs font-bold text-[#3D4852] group-hover:text-[#6C63FF] underline">{trip.driver_name}</div>
                      </div>
                    </button>

                    <div className="text-right">
                      <div className="text-[9px] font-bold text-[#6B7280]">ค่าโดยสาร / ที่นั่ง</div>
                      <div className="text-lg font-black text-[#38B2AC]">
                        {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : 'ฟรี'}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/trips/${trip.trip_id}`}
                  className="mt-4 w-full block text-center py-3 neu-button font-bold text-xs text-[#6C63FF]"
                >
                  ดูรายละเอียด & ร่วมเดินทาง
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Owner Profile Modal */}
      <OwnerProfileModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        userId={selectedDriverId}
      />
    </div>
  );
}
