import React, { useState, useMemo } from 'react';
import {
  MapPin, Navigation, ExternalLink, Maximize2, Minimize2,
  Compass, Layers, Clock, ShieldCheck, Milestone
} from 'lucide-react';

export default function TripRouteMap({ trip, isTh = true }) {
  const [mapProvider, setMapProvider] = useState('osm'); // 'osm' | 'google' | 'timeline'
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!trip || (!trip.origin && !trip.destination)) return null;

  const origin = trip.origin || 'ต้นทาง';
  const destination = trip.destination || 'ปลายทาง';
  const distanceKm = trip.distance_km ? `${trip.distance_km} ${isTh ? 'กม.' : 'km'}` : (isTh ? 'ตามเส้นทางหลัก' : 'Via main highway');
  const durationText = trip.duration_text || (isTh ? 'ตามสภาพจราจร' : 'Traffic dependent');

  // Interactive Leaflet & OpenStreetMap srcDoc HTML
  const leafletSrcDoc = useMemo(() => {
    const safeOrigin = JSON.stringify(origin);
    const safeDest = JSON.stringify(destination);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .custom-badge { background: #065f46; color: white; padding: 4px 8px; border-radius: 999px; font-weight: bold; font-size: 11px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
    .custom-badge-dest { background: #991b1b; }
    .leaflet-popup-content-wrapper { border-radius: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const originName = ${safeOrigin};
    const destName = ${safeDest};

    const map = L.map('map', { zoomControl: true }).setView([13.7563, 100.5018], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    async function geocode(query) {
      try {
        const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query + ', Thailand') + '&limit=1';
        const res = await fetch(url, { headers: { 'Accept-Language': 'th, en' } });
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.warn('Geocode error:', err);
      }
      return null;
    }

    async function initRoute() {
      let p1 = await geocode(originName);
      let p2 = await geocode(destName);

      // Fallbacks if geocode is rate-limited or fails
      if (!p1 && !p2) {
        p1 = [13.7563, 100.5018]; // Bangkok
        p2 = [18.7883, 98.9853];  // Chiang Mai
      } else if (!p1 && p2) {
        p1 = [p2[0] - 0.5, p2[1] - 0.5];
      } else if (p1 && !p2) {
        p2 = [p1[0] + 0.5, p1[1] + 0.5];
      }

      // Origin Marker (Green)
      const greenIcon = L.divIcon({
        className: 'custom-pin-origin',
        html: '<div class="custom-badge">🟢 ' + originName + '</div>',
        iconSize: [120, 24],
        iconAnchor: [60, 24]
      });
      const m1 = L.marker(p1, { icon: greenIcon }).addTo(map)
        .bindPopup('<b>จุดเริ่มต้น:</b> ' + originName);

      // Destination Marker (Red)
      const redIcon = L.divIcon({
        className: 'custom-pin-dest',
        html: '<div class="custom-badge custom-badge-dest">🏁 ' + destName + '</div>',
        iconSize: [120, 24],
        iconAnchor: [60, 24]
      });
      const m2 = L.marker(p2, { icon: redIcon }).addTo(map)
        .bindPopup('<b>จุดหมายปลายทาง:</b> ' + destName);

      // Connecting Route Line
      const routeLine = L.polyline([p1, p2], {
        color: '#059669',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);

      // Fit both pins smoothly
      const bounds = L.latLngBounds([p1, p2]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    initRoute();
  </script>
</body>
</html>`;
  }, [origin, destination]);

  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(origin + ' to ' + destination)}&output=embed`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
  const osmWebUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(origin + ' ' + destination)}`;

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

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setMapProvider('osm')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                mapProvider === 'osm'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ OpenStreetMap
            </button>
            <button
              type="button"
              onClick={() => setMapProvider('google')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                mapProvider === 'google'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🚗 Google Maps
            </button>
            <button
              type="button"
              onClick={() => setMapProvider('timeline')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                mapProvider === 'timeline'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📍 {isTh ? 'จุดจอด/ไทม์ไลน์' : 'Timeline'}
            </button>
          </div>

          {/* Actions & Fullscreen Toggle */}
          <div className="flex items-center gap-1.5 ml-auto">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-colors"
              title={isTh ? "เปิดแอปนำทาง GPS" : "Open GPS Navigation"}
            >
              <ExternalLink className="w-3 h-3" />
              <span>{isTh ? 'เปิด GPS' : 'GPS Nav'}</span>
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
        <div className={`relative bg-slate-100 ${isFullscreen ? 'flex-1 min-h-[480px]' : 'h-64 sm:h-72'}`}>
          {mapProvider === 'osm' && (
            <iframe
              title="OpenStreetMap Interactive Route"
              srcDoc={leafletSrcDoc}
              className="w-full h-full border-0"
              loading="lazy"
            />
          )}

          {mapProvider === 'google' && (
            <iframe
              title="Google Maps Route Frame"
              src={googleMapsEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
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
