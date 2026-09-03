import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header Form */}
      <div className="glass-card p-6 rounded-3xl border border-sky-500/20 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-sky-200 flex items-center gap-2">
          <Search className="w-5 h-5 text-sky-400" />
          <span>ค้นหาเที่ยวคาร์พูลร่วมเดินทาง</span>
        </h2>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
            <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
            <input
              type="text"
              placeholder="ต้นทาง..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
            <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
            <input
              type="text"
              placeholder="ปลายทาง..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
            <Filter className="w-5 h-5 text-purple-400 shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent border-none text-white text-sm focus:outline-none w-full text-slate-300"
            >
              <option value="" className="bg-slate-900 text-slate-400">-- ทุกกิจกรรม/อีเวนต์ --</option>
              {events.map((ev) => (
                <option key={ev.event_id} value={ev.event_id} className="bg-slate-900 text-white">
                  {ev.event_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-sky-500/25 transition-all"
          >
            <span>ค้นหาเที่ยวรถ</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">กำลังค้นหาเที่ยวเดินทาง...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="glass-card text-center py-16 rounded-3xl border border-white/10 space-y-4">
          <Car className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">ยังไม่พบเที่ยวเดินทางที่ตรงกับการค้นหา</h3>
          <p className="text-slate-400 text-sm">ลองเปลี่ยนเงื่อนไขการค้นหา หรือเปิดเส้นทางเดินทางใหม่เป็นคนแรก</p>
          <Link
            to="/create-trip"
            className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all text-sm"
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
                className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between hover:border-sky-500/40 transition-all group"
              >
                <div className="space-y-4">
                  {/* Status Badge & Event Tag */}
                  <div className="flex items-center justify-between gap-2">
                    {trip.event_name ? (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold truncate">
                        {trip.event_name}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">ทั่วไป</span>
                    )}

                    {trip.available_seats > 0 ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        มีที่ว่าง ({trip.available_seats} ที่)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        เต็มแล้ว
                      </span>
                    )}
                  </div>

                  {/* Origin -> Destination */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">ต้นทาง</div>
                      <div className="text-base font-bold text-sky-200">{trip.origin}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-sky-400 shrink-0" />
                    <div className="space-y-1 text-right">
                      <div className="text-xs text-slate-400">ปลายทาง</div>
                      <div className="text-base font-bold text-indigo-200">{trip.destination}</div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{departureDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{departureDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300 col-span-2">
                      <Car className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{trip.car_model} ({trip.license_plate})</span>
                    </div>
                  </div>

                  {/* Driver Name & Price */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">คนขับ</div>
                      <div className="text-sm font-semibold text-slate-200">{trip.driver_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">ค่าโดยสาร / ที่นั่ง</div>
                      <div className="text-lg font-extrabold text-emerald-400">
                        {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : 'ฟรี'}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/trips/${trip.trip_id}`}
                  className="mt-5 w-full block text-center py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold rounded-xl border border-sky-500/30 transition-all text-sm"
                >
                  ดูรายละเอียด & ร่วมเดินทาง
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
