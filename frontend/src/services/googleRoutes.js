let mapsPromise;

export function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;
  const key = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error('ยังไม่ได้ตั้งค่า Google Maps สำหรับคำนวณและแสดงเส้นทาง กรุณาติดต่อผู้ดูแลระบบ'));
  }
  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const cleanup = () => {
      clearTimeout(timer);
      delete window.ikoGoogleMapsReady;
    };
    const fail = () => {
      cleanup();
      script.remove();
      mapsPromise = undefined;
      reject(new Error('โหลด Google Maps ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'));
    };
    const timer = setTimeout(fail, 20000);
    window.ikoGoogleMapsReady = () => {
      cleanup();
      resolve(window.google.maps);
    };
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({
      key, v: 'weekly', loading: 'async', language: 'th', region: 'TH', callback: 'ikoGoogleMapsReady',
    })}`;
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return mapsPromise;
}

export function routeSummary(route) {
  if (!route) return { distanceKm: null, durationText: '' };
  const distanceKm = Math.round(route.distanceMeters / 100) / 10;
  const minutes = Math.max(1, Math.round(route.durationMillis / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return {
    distanceKm,
    durationText: hours ? `${hours} ชม.${remaining ? ` ${remaining} นาที` : ''}` : `${remaining} นาที`,
  };
}

export async function computeGoogleRoutes(origin, destination) {
  const maps = await loadGoogleMaps();
  const [, , { Route }] = await Promise.all([
    maps.importLibrary('maps'), maps.importLibrary('marker'), maps.importLibrary('routes'),
  ]);
  const result = await Route.computeRoutes({
    origin: `${origin}, ประเทศไทย`,
    destination: `${destination}, ประเทศไทย`,
    travelMode: 'DRIVING',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: true,
    fields: ['path', 'distanceMeters', 'durationMillis', 'description', 'warnings'],
  });
  const routes = (result.routes || []).filter((route) =>
    route.path?.length > 1 && Number.isFinite(route.distanceMeters) && route.distanceMeters > 0 &&
    Number.isFinite(route.durationMillis) && route.durationMillis >= 0);
  if (!routes.length) throw new Error('ไม่พบเส้นทางขับรถ กรุณาระบุต้นทางและปลายทางให้ชัดเจนขึ้น');
  return routes;
}
