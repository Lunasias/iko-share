import React, { useEffect, useRef } from 'react';
import { routeSummary } from '../services/googleRoutes';

// The exact Route instance supplying the fare also supplies the map geometry.
export default function RouteMap({ route, origin, destination }) {
  const element = useRef(null);
  const mapInstance = useRef(null);
  const { distanceKm, durationText } = routeSummary(route);
  useEffect(() => {
    const maps = window.google.maps;
    const map = mapInstance.current || new maps.Map(element.current, {
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
      center: route.path[0], zoom: 8, mapTypeControl: false, streetViewControl: false,
    });
    mapInstance.current = map;
    const lines = route.createPolylines();
    lines.forEach((line) => line.setMap(map));
    const bounds = new maps.LatLngBounds();
    route.path.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 45);
    const markers = [
      [route.path[0], `ต้นทาง: ${origin}`],
      [route.path[route.path.length - 1], `ปลายทาง: ${destination}`],
    ].map(([position, title]) => new maps.marker.AdvancedMarkerElement({ map, position, title }));
    return () => {
      lines.forEach((line) => line.setMap(null));
      markers.forEach((marker) => { marker.map = null; });
    };
  }, [route, origin, destination]);
  useEffect(() => () => {
    if (mapInstance.current) window.google.maps.event.clearInstanceListeners(mapInstance.current);
    mapInstance.current = null;
  }, []);

  return (
    <div className="relative">
      <div ref={element} style={{ height: 300 }} aria-label={`เส้นทาง ${origin} ไป ${destination}`} />
      <div className="absolute top-3 left-3 bg-white rounded-lg shadow px-3 py-2 text-xs font-bold pointer-events-none">
        {distanceKm} กม. · {durationText}
      </div>
      {route.warnings?.length > 0 && (
        <div className="p-2 bg-white text-xs text-slate-700">{route.warnings.join(' · ')}</div>
      )}
    </div>
  );
}
