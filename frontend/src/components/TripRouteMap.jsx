import React, { useState } from 'react';
import {
  Navigation, ExternalLink, Maximize2, Minimize2,
  Milestone, MapPin
} from 'lucide-react';

export default function TripRouteMap({ trip, isTh = true }) {
  // Default to reliable Google Maps directly; OpenStreetMap tab removed per user request (#MAP-201)
  const [mapProvider, setMapProvider] = useState('google'); // 'google' | 'timeline'
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!trip || (!trip.origin && !trip.destination)) return null;

  const origin = trip.origin || 'ต้นทาง';
  const destination = trip.destination || 'ปลายทาง';
  const distanceKm = trip.distance_km ? `${trip.distance_km} ${isTh ? 'กม.' : 'km'}` : (isTh ? 'ตามเส้นทางหลัก' : 'Via main highway');
  const durationText = trip.duration_text || (isTh ? 'ตามสภาพจราจร' : 'Traffic dependent');

  // Google Maps interactive route embed & external GPS navigation URL
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(origin + ' to ' + destination)}&output=embed`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;

  return (
    <div className={`space-y-3 ${isFullscreen ? 'fixed inset-0 z-50 p-4 sm:p-8 bg-slate-900/80 backdrop-blur-md flex flex-col justify-center' : ''}`}>
      <div className={`bg-white rounded-2xl border border-emerald-200/90 shadow-xs overflow-hidden ${isFullscreen ? 'max-w-5xl w-full mx-auto max-h-[90vh] flex flex-col' : ''}`}>
        {/* Map Header Toolbar */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>{origin}</span>
                <span className="text-emerald-600 font-bold">➔</span>
                <span>{destination}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {distanceKm} {durationText && `• ${durationText}`}
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs (OpenStreetMap removed, Google Maps & Timeline only) */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setMapProvider('google')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1.5 ${
                mapProvider === 'google'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚗</span>
              <span>{isTh ? 'แผนที่เส้นทาง (Google Maps)' : 'Route Map (Google Maps)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMapProvider('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1.5 ${
                mapProvider === 'timeline'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📍</span>
              <span>{isTh ? 'จุดจอด/ไทม์ไลน์' : 'Timeline & Stops'}</span>
            </button>
          </div>

          {/* Actions & Fullscreen Toggle */}
          <div className="flex items-center gap-1.5 ml-auto">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
              title={isTh ? "เปิดแอปนำทาง GPS ด้วย Google Maps" : "Open GPS Navigation in Google Maps"}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isTh ? 'เปิด GPS นำทาง' : 'Open GPS Nav'}</span>
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? (isTh ? "ย่อหน้าจอ" : "Exit Fullscreen") : (isTh ? "ขยายแผนที่เต็มจอ" : "Fullscreen")}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Map Body Content */}
        <div className={`relative bg-slate-100 ${isFullscreen ? 'flex-1 min-h-[480px]' : 'h-72 sm:h-80'}`}>
          {mapProvider === 'google' && (
            <iframe
              title={`เส้นทาง Google Maps จาก ${origin} ไปยัง ${destination}`}
              src={googleMapsEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
          )}

          {mapProvider === 'timeline' && (
            <div className="w-full h-full bg-white p-5 overflow-y-auto space-y-4">
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Milestone className="w-4 h-4 text-emerald-600" />
                <span>{isTh ? 'แผนผังจุดแวะและเส้นทางการเดินทาง' : 'Trip Waypoint Plan & Route Stops'}</span>
              </div>

              <div className="space-y-4 pl-2 relative border-l-2 border-dashed border-emerald-300 ml-4">
                {/* 1. Origin Stop */}
                <div className="relative pl-6">
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black ring-4 ring-white shadow-xs">
                    1
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">{isTh ? 'จุดขึ้นรถ / ต้นทาง' : 'Origin / Departure'}</div>
                    <div className="text-sm font-black text-slate-900">{origin}</div>
                    <div className="text-xs text-slate-500 font-medium">
                      {isTh ? 'เวลานัดพบ: ก่อนออกเดินทาง 10 นาที' : 'Meetup 10 mins prior'}
                    </div>
                  </div>
                </div>

                {/* 2. Route Waypoints / Highway */}
                <div className="relative pl-6">
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-black ring-4 ring-white shadow-xs">
                    •
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-teal-700 uppercase">{isTh ? 'ระหว่างทาง / จุดพักรถ' : 'Midway / Rest Stop'}</div>
                    <div className="text-xs font-bold text-slate-700">
                      {isTh ? 'เส้นทางทางหลวงสายหลัก หรือจุดพักปั๊มน้ำมันตามตกลง' : 'Main highway / expressway rest area'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {distanceKm} • {durationText}
                    </div>
                  </div>
                </div>

                {/* 3. Destination Stop */}
                <div className="relative pl-6">
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black ring-4 ring-white shadow-xs">
                    🏁
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-rose-700 uppercase">{isTh ? 'จุดส่งลง / ปลายทาง' : 'Destination / Drop-off'}</div>
                    <div className="text-sm font-black text-slate-900">{destination}</div>
                    <div className="text-xs text-slate-500 font-medium">
                      {isTh ? 'ส่งถึงจุดหมายปลายทางตามที่ระบุ' : 'Drop-off at destination'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
