import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import OwnerProfileModal from '../components/OwnerProfileModal';
import CarLoader from '../components/CarLoader';
import { useTheme } from '../context/ThemeContext';
import {
  Search, MapPin, Calendar, Users, Car, ArrowRight, Clock, AlertCircle,
  Filter, Sparkles, HeartHandshake, SlidersHorizontal, ArrowUpDown,
  ShieldCheck, RotateCcw, X, Sun, Moon, Compass, DollarSign
} from 'lucide-react';

export default function Trips() {
  const { isTh } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Instant SWR Cache: read from sessionStorage immediately so UI displays in 0 ms!
  const [trips, setTrips] = useState(() => {
    try {
      const q = searchParams.toString();
      const cached = sessionStorage.getItem(`iko_cache_trips_${q || 'all'}`);
      if (cached) return JSON.parse(cached);
      if (!q) {
        const defaultCached = sessionStorage.getItem('iko_cached_trips');
        if (defaultCached) return JSON.parse(defaultCached);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [events, setEvents] = useState(() => {
    try {
      const cached = sessionStorage.getItem('iko_cached_events');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // If cached trips already exist, don't block the screen with full-page loader
  const [loading, setLoading] = useState(() => {
    try {
      const q = searchParams.toString();
      const cached = sessionStorage.getItem(`iko_cache_trips_${q || 'all'}`) || (!q ? sessionStorage.getItem('iko_cached_trips') : null);
      return !cached || JSON.parse(cached).length === 0;
    } catch {
      return true;
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('event_id') || '');

  // Owner profile modal state
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // Advanced filters state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'evening'
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'under100' | '100to300' | 'over300'
  const [tripTypeFilter, setTripTypeFilter] = useState('all'); // 'all' | 'carpool' | 'public_transport' | 'find_driver'
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('earliest'); // 'earliest' | 'cheapest' | 'seats'

  const activeFilterCount = (timeFilter !== 'all' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (tripTypeFilter !== 'all' ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const resetFilters = () => {
    setTimeFilter('all');
    setPriceFilter('all');
    setTripTypeFilter('all');
    setVerifiedOnly(false);
    setSortBy('earliest');
  };

  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // 1. Time of day filter
    if (timeFilter !== 'all') {
      result = result.filter((t) => {
        const d = new Date(t.departure_time);
        const hour = d.getHours();
        if (timeFilter === 'morning') return hour >= 6 && hour < 12;
        if (timeFilter === 'afternoon') return hour >= 12 && hour < 18;
        if (timeFilter === 'evening') return hour >= 18 || hour < 6;
        return true;
      });
    }

    // 2. Price filter
    if (priceFilter !== 'all') {
      result = result.filter((t) => {
        const price = parseFloat(t.price_seat) || 0;
        if (priceFilter === 'under100') return price <= 100;
        if (priceFilter === '100to300') return price > 100 && price <= 300;
        if (priceFilter === 'over300') return price > 300;
        return true;
      });
    }

    // 3. Trip Type filter
    if (tripTypeFilter !== 'all') {
      result = result.filter((t) => (t.trip_type || 'carpool') === tripTypeFilter);
    }

    // 4. Verified Driver Only
    if (verifiedOnly) {
      result = result.filter((t) => Boolean(t.driver_is_verified));
    }

    // 5. Sorting
    if (sortBy === 'earliest') {
      result.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
    } else if (sortBy === 'cheapest') {
      result.sort((a, b) => (parseFloat(a.price_seat) || 0) - (parseFloat(b.price_seat) || 0));
    } else if (sortBy === 'seats') {
      result.sort((a, b) => (b.available_seats || 0) - (a.available_seats || 0));
    }

    return result;
  }, [trips, timeFilter, priceFilter, tripTypeFilter, verifiedOnly, sortBy]);

  useEffect(() => {
    setOrigin(searchParams.get('origin') || '');
    setDestination(searchParams.get('destination') || '');
    setSelectedEventId(searchParams.get('event_id') || '');
    fetchEvents();
    fetchTrips();
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      if (res.data.success && res.data.events) {
        setEvents(res.data.events);
        try {
          sessionStorage.setItem('iko_cached_events', JSON.stringify(res.data.events));
        } catch {}
      }
    } catch (e) {}
  };

  const fetchTrips = async () => {
    const q = new URLSearchParams(searchParams).toString();
    const cacheKey = `iko_cache_trips_${q || 'all'}`;

    // If trips already displayed, refresh silently without wiping out the screen
    if (trips.length > 0) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const res = await API.get(`/trips?${q}`);
      if (res.data.success) {
        const freshTrips = res.data.trips || [];
        setTrips(freshTrips);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(freshTrips));
          if (!q) {
            sessionStorage.setItem('iko_cached_trips', JSON.stringify(freshTrips));
          }
        } catch {}
      } else {
        if (trips.length === 0) {
          setError(String(res.data.message || 'ไม่สามารถดึงข้อมูลได้'));
        }
      }
    } catch (err) {
      console.error('Fetch trips error:', err);
      if (trips.length === 0) {
        setError(String(err.userFriendlyMessage || err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'));
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
          <span>{isTh ? 'ค้นหาเที่ยวคาร์พูลร่วมเดินทาง (ค้นหาทริป)' : 'Search Carpool Rides (Find Trips)'}</span>
        </h2>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 px-4 py-3 travel-input">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
            <input
              type="text"
              placeholder={isTh ? "ต้นทาง (เช่น กรุงเทพฯ)..." : "Origin (e.g. Bangkok)..."}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 travel-input">
            <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
            <input
              type="text"
              placeholder={isTh ? "ปลายทาง (เช่น พัทยา, เขาใหญ่)..." : "Destination (e.g. Pattaya, Khao Yai)..."}
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
              <option value="">{isTh ? '-- ทุกกิจกรรม/อีเวนต์ --' : '-- All Events --'}</option>
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
            <span>{isTh ? 'ค้นหาเที่ยวรถ' : 'Search Rides'}</span>
          </button>
        </form>
      </div>

      {/* Advanced Filter & Sorting Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs backdrop-blur-sm">
          {/* Left: Result count & active chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {isTh
                ? `พบ ${filteredTrips.length} ทริป`
                : `Found ${filteredTrips.length} trips`}
              {trips.length !== filteredTrips.length && (
                <span className="text-slate-400 font-medium ml-1">
                  ({isTh ? `จากทั้งหมด ${trips.length}` : `out of ${trips.length}`})
                </span>
              )}
            </span>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                title={isTh ? 'ล้างตัวกรองทั้งหมด' : 'Reset all filters'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isTh ? 'ล้างตัวกรอง' : 'Clear filters'}</span>
              </button>
            )}
          </div>

          {/* Right: Sort and Filter Toggle Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="earliest">{isTh ? '🕒 ออกเดินทางเร็วสุด' : '🕒 Earliest Departure'}</option>
                <option value="cheapest">{isTh ? '💰 ราคาประหยัดสุด' : '💰 Lowest Price'}</option>
                <option value="seats">{isTh ? '💺 ที่นั่งว่างมากสุด' : '💺 Most Seats Left'}</option>
              </select>
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showFilterPanel || activeFilterCount > 0
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isTh ? 'ตัวกรองขั้นสูง' : 'Filters'}</span>
              {activeFilterCount > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                  showFilterPanel || activeFilterCount > 0 ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                }`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilterPanel && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Time of Day */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isTh ? 'ช่วงเวลาเดินทาง' : 'Time of Day'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All' },
                    { id: 'morning', labelTh: 'เช้า (06-12)', labelEn: 'Morning' },
                    { id: 'afternoon', labelTh: 'บ่าย (12-18)', labelEn: 'Afternoon' },
                    { id: 'evening', labelTh: 'ค่ำ/ดึก (18+)', labelEn: 'Evening' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTimeFilter(t.id)}
                      className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                        timeFilter === t.id
                          ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isTh ? t.labelTh : t.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Price Range */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isTh ? 'งบประมาณ / ราคา' : 'Price Range'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All' },
                    { id: 'under100', labelTh: '≤ 100฿', labelEn: '≤ 100฿' },
                    { id: '100to300', labelTh: '101 - 300฿', labelEn: '101 - 300฿' },
                    { id: 'over300', labelTh: '> 300฿', labelEn: '> 300฿' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriceFilter(p.id)}
                      className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition-colors ${
                        priceFilter === p.id
                          ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isTh ? p.labelTh : p.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Trip Type */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isTh ? 'ประเภทการเดินทาง' : 'Trip Type'}
                </label>
                <select
                  value={tripTypeFilter}
                  onChange={(e) => setTripTypeFilter(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                >
                  <option value="all">{isTh ? 'ทุกรูปแบบ' : 'All Types'}</option>
                  <option value="carpool">{isTh ? '🚗 รถยนต์ร่วมเดินทาง (Carpool)' : '🚗 Carpool'}</option>
                  <option value="public_transport">{isTh ? '🚆 ขนส่งสาธารณะ' : '🚆 Public Transport'}</option>
                  <option value="find_driver">{isTh ? '🙋 หาคนขับร่วมทาง' : '🙋 Find Driver'}</option>
                </select>
              </div>

              {/* 4. Safety & Verification */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isTh ? 'ความน่าเชื่อถือ' : 'Trust & Safety'}
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      {isTh ? 'เฉพาะคนขับยืนยันตัวตน' : 'Verified Drivers Only'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {isTh ? 'ผ่านการตรวจสอบเอกสารแล้ว' : 'Identity verified'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Reset in Panel */}
            {activeFilterCount > 0 && (
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isTh ? 'รีเซ็ตตัวกรองทั้งหมด' : 'Reset All Filters'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Background SWR Sync Indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-between px-4 py-2 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-emerald-800 text-xs font-bold transition-all shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isTh ? 'แสดงข้อมูลด่วนจากหน่วยความจำแคช • กำลังอัปเดตข้อมูลทริปล่าสุดในพื้นหลัง...' : 'Showing fast cached data • Updating trips in background...'}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold hidden sm:inline">{isTh ? 'ซิงค์อัตโนมัติ' : 'Auto sync'}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state with CarLoader & Skeleton Cards */}
      {loading ? (
        <div className="space-y-6">
          <CarLoader text={isTh ? "กำลังเชื่อมต่อและค้นหาเที่ยวเดินทางที่ตรงใจคุณ..." : "Connecting and finding rides for you..."} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="travel-card p-6 space-y-4 border border-slate-200 bg-white/70">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                  <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-200">
                  <div className="h-6 bg-slate-200 rounded-lg w-28"></div>
                  <div className="h-4 bg-slate-200 rounded-full w-6"></div>
                  <div className="h-6 bg-slate-200 rounded-lg w-28"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-4 bg-slate-200 rounded-md w-full"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-full"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-3/4 col-span-2"></div>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-slate-200"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-24"></div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded-md w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="travel-card text-center py-16 space-y-4 border border-slate-200">
          <Car className="w-14 h-14 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">
            {trips.length > 0 && activeFilterCount > 0
              ? (isTh ? 'ไม่พบเที่ยวเดินทางที่ตรงกับตัวกรองที่คุณเลือก' : 'No trips match the selected filters')
              : (isTh ? 'ยังไม่พบเที่ยวเดินทางที่ตรงกับการค้นหา' : 'No trips found matching your search')}
          </h3>
          <p className="text-slate-500 text-xs font-medium">
            {trips.length > 0 && activeFilterCount > 0
              ? (isTh ? 'ลองปรับเปลี่ยนเงื่อนไขตัวกรอง หรือล้างตัวกรองเพื่อดูเที่ยวเดินทางทั้งหมด' : 'Try adjusting your filters or clear filters to view all trips')
              : (isTh ? 'ลองเปลี่ยนจุดหมาย หรือเปิดเส้นทางใหม่ชวนเพื่อนร่วมทางไปด้วยกัน' : 'Try changing your destination or create a new trip to invite companions')}
          </p>
          <div className="flex items-center justify-center gap-3">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 travel-btn-secondary px-5 py-2.5 font-bold text-xs shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                {isTh ? 'ล้างตัวกรอง' : 'Clear Filters'}
              </button>
            )}
            <Link
              to="/create-trip"
              className="inline-flex items-center gap-2 travel-btn-primary px-6 py-2.5 font-bold text-xs shadow-md"
            >
              {isTh ? '+ เปิดการเดินทางใหม่' : '+ Create New Trip'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
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
                      <button
                        type="button"
                        onClick={() => {
                          if (trip.event_id) {
                            setSelectedEventId(String(trip.event_id));
                            const params = {};
                            if (origin) params.origin = origin;
                            if (destination) params.destination = destination;
                            params.event_id = String(trip.event_id);
                            setSearchParams(params);
                          }
                        }}
                        className="text-[11px] bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-bold border border-purple-200 truncate max-w-[170px] transition-colors cursor-pointer text-left"
                        title={isTh ? `กรองเฉพาะอีเวนต์: ${trip.event_name}` : `Filter by event: ${trip.event_name}`}
                      >
                        {trip.event_name}
                      </button>
                    ) : (
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold border border-slate-200">
                        {isTh ? 'เที่ยวทั่วไป' : 'General Trip'}
                      </span>
                    )}

                    {/* Clean badge without parentheses */}
                    {trip.available_seats > 0 ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-black">
                        {isTh ? `มีที่ว่าง ${trip.available_seats} ที่` : `${trip.available_seats} seats left`}
                      </span>
                    ) : (
                      <span className="text-[11px] bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full font-black">
                        {isTh ? 'เต็มแล้ว' : 'Full'}
                      </span>
                    )}
                  </div>

                  {/* Origin -> Destination */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-4">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTh ? 'ต้นทาง' : 'Origin'}</div>
                      <div className="text-lg font-black text-slate-900">{trip.origin}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="space-y-0.5 text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTh ? 'ปลายทาง' : 'Destination'}</div>
                      <div className="text-lg font-black text-slate-900">{trip.destination}</div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{departureDate.toLocaleDateString(isTh ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{departureDate.toLocaleTimeString(isTh ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })} {isTh ? 'น.' : ''}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 font-semibold col-span-2">
                      <Car className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        {trip.license_plate
                          ? `${trip.car_model || (isTh ? 'รถยนต์' : 'Car')} (${trip.license_plate})`
                          : trip.trip_type === 'find_driver'
                          ? (isTh ? 'หาคนขับร่วมทาง (แชร์ค่าน้ำมัน)' : 'Looking for driver (share gas)')
                          : trip.trip_type === 'public_transport'
                          ? (isTh ? 'ขนส่งสาธารณะ / รถไฟ' : 'Public Transport / Train')
                          : (isTh ? 'ไม่ระบุพาหนะ' : 'Vehicle not specified')}
                      </span>
                    </div>

                    {(trip.distance_km || trip.duration_text) && (
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px] col-span-2 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {isTh ? `ระยะทาง ${trip.distance_km ? `${trip.distance_km} กม.` : ''} ${trip.duration_text ? `(${trip.duration_text})` : ''}` : `Distance ${trip.distance_km ? `${trip.distance_km} km` : ''} ${trip.duration_text ? `(${trip.duration_text})` : ''}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Personality / Requirements Preview */}
                  {trip.driver_personality && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200 font-medium truncate">
                      🚗 {isTh ? `สไตล์คนขับ: ${trip.driver_personality}` : `Driver style: ${trip.driver_personality}`}
                    </div>
                  )}

                  {/* Clickable Driver Name & Price */}
                  <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => openOwnerModal(trip.driver_id)}
                      className="text-left group flex items-center gap-2"
                      title={isTh ? "คลิกดูโปรไฟล์คนขับ" : "Click to view driver profile"}
                    >
                      {trip.driver_avatar ? (
                        <img src={trip.driver_avatar} alt={trip.driver_name} className="w-9 h-9 rounded-full object-cover border-2 border-[var(--accent)]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,var(--card))] text-[var(--accent)] border-2 border-[var(--accent)] flex items-center justify-center text-xs font-black">
                          {trip.driver_name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-[9px] font-bold text-slate-400">{isTh ? 'คนขับ (ดูโปรไฟล์)' : 'Driver (profile)'}</div>
                        <div className="flex items-center gap-1">
                          <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700 underline">{trip.driver_name}</div>
                          {trip.driver_is_verified && (
                            <span className="inline-flex items-center text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded-md font-bold shadow-2xs" title={isTh ? "ผู้ใช้ผ่านการยืนยันความน่าเชื่อถือแล้ว" : "User verified"}>
                              🛡️ {isTh ? 'ยืนยันแล้ว' : 'Verified'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="text-right">
                      <div className="text-[9px] font-bold text-slate-400">{isTh ? 'ค่าโดยสาร / ที่นั่ง' : 'Fare / seat'}</div>
                      <div className="text-lg font-black text-emerald-700">
                        {parseFloat(trip.price_seat) > 0 ? `฿${trip.price_seat}` : (isTh ? 'ฟรี' : 'Free')}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/trips/${trip.trip_id}`}
                  className="mt-3 w-full block text-center py-2.5 travel-btn-secondary font-bold text-xs"
                >
                  {isTh ? 'ดูรายละเอียด & เข้าร่วมทริป' : 'View Details & Join'}
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
