// Route and Distance Estimation Service
// Supports Google Maps Distance Matrix API with fallback to Thailand Smart Highway Router

const https = require('https');

// Coordinates table for major Thailand locations, provinces and hubs
const THAI_COORDINATES = {
  'กรุงเทพ': { lat: 13.7563, lng: 100.5018 },
  'กทม': { lat: 13.7563, lng: 100.5018 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'หมอชิต': { lat: 13.8037, lng: 100.5534 },
  'อนุสาวรีย์': { lat: 13.7649, lng: 100.5383 },
  'รังสิต': { lat: 13.9877, lng: 100.6174 },
  'พัทยา': { lat: 12.9276, lng: 100.8771 },
  'pattaya': { lat: 12.9276, lng: 100.8771 },
  'ชลบุรี': { lat: 13.3611, lng: 100.9847 },
  'ระยอง': { lat: 12.6815, lng: 101.2816 },
  'เขาใหญ่': { lat: 14.4392, lng: 101.3723 },
  'khao yai': { lat: 14.4392, lng: 101.3723 },
  'ปากช่อง': { lat: 14.7075, lng: 101.4175 },
  'นครราชสีมา': { lat: 14.9799, lng: 102.0978 },
  'โคราช': { lat: 14.9799, lng: 102.0978 },
  'ขอนแก่น': { lat: 16.4322, lng: 102.8236 },
  'อุดรธานี': { lat: 17.4138, lng: 102.7872 },
  'อุบลราชธานี': { lat: 15.2448, lng: 104.8473 },
  'เชียงใหม่': { lat: 18.7883, lng: 98.9853 },
  'chiang mai': { lat: 18.7883, lng: 98.9853 },
  'เชียงราย': { lat: 19.9072, lng: 99.8325 },
  'ลำปาง': { lat: 18.2888, lng: 99.4928 },
  'พิษณุโลก': { lat: 16.8211, lng: 100.2659 },
  'นครสวรรค์': { lat: 15.6987, lng: 100.1199 },
  'อยุธยา': { lat: 14.3532, lng: 100.5684 },
  'สระบุรี': { lat: 14.5289, lng: 100.9108 },
  'หัวหิน': { lat: 12.5684, lng: 99.9577 },
  'hua hin': { lat: 12.5684, lng: 99.9577 },
  'ชะอำ': { lat: 12.7997, lng: 99.9678 },
  'เพชรบุรี': { lat: 13.1114, lng: 99.9392 },
  'ประจวบคีรีขันธ์': { lat: 11.8124, lng: 99.7974 },
  'กาญจนบุรี': { lat: 14.0228, lng: 99.5328 },
  'นครปฐม': { lat: 13.8196, lng: 100.0601 },
  'นนทบุรี': { lat: 13.8591, lng: 100.5217 },
  'ปทุมธานี': { lat: 14.0208, lng: 100.5250 },
  'สมุทรปราการ': { lat: 13.5991, lng: 100.5998 },
  'ภูเก็ต': { lat: 7.8804, lng: 98.3923 },
  'phuket': { lat: 7.8804, lng: 98.3923 },
  'กระบี่': { lat: 8.0863, lng: 98.9063 },
  'สุราษฎร์ธานี': { lat: 9.1382, lng: 99.3215 },
  'สมุย': { lat: 9.5357, lng: 100.0605 },
  'หาดใหญ่': { lat: 7.0087, lng: 100.4747 },
  'สงขลา': { lat: 7.1988, lng: 100.5954 },
};

// Calculate Great Circle Distance in kilometers (Haversine formula)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest coordinates matching a search query string
function findCoordinates(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim().toLowerCase();
  for (const [key, coords] of Object.entries(THAI_COORDINATES)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return coords;
    }
  }
  return null;
}

// Format duration into readable Thai text
function formatDurationThai(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours > 0 && mins > 0) {
    return `${hours} ชม. ${mins} นาที`;
  } else if (hours > 0) {
    return `${hours} ชม.`;
  }
  return `${mins || 15} นาที`;
}

// Query Google Maps Distance Matrix API
function fetchGoogleMapsDistance(origin, destination, apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&language=th`;

    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (
              json.status === 'OK' &&
              json.rows?.[0]?.elements?.[0]?.status === 'OK'
            ) {
              const element = json.rows[0].elements[0];
              const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10;
              const durationMinutes = Math.round(element.duration.value / 60);
              const durationText = element.duration.text || formatDurationThai(durationMinutes);
              resolve({
                distance_km: distanceKm,
                duration_text: durationText,
                duration_minutes: durationMinutes,
                source: 'google_maps',
              });
            } else {
              reject(new Error(json.error_message || json.status || 'Google Maps failed'));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

/**
 * Estimate road distance, duration, and calculate vehicle depreciation breakdown
 */
function calculateOperatingCost(distanceKm, seats = 4) {
  const FUEL_RATE_PER_KM = 2.20;
  const DEPRECIATION_RATE_PER_KM = 1.30;
  const dist = parseFloat(distanceKm) || 0;
  const seatCount = Math.max(1, parseInt(seats) || 4);

  const estimatedFuelCost = Math.round(dist * FUEL_RATE_PER_KM);
  const estimatedDepreciationCost = Math.round(dist * DEPRECIATION_RATE_PER_KM);
  const totalOperatingCost = estimatedFuelCost + estimatedDepreciationCost;
  const recommendedPricePerSeat = Math.max(25, Math.round((totalOperatingCost / seatCount) / 10) * 10);
  const minReasonablePrice = Math.max(20, Math.round(recommendedPricePerSeat * 0.4));

  return {
    fuel_rate_per_km: FUEL_RATE_PER_KM,
    depreciation_rate_per_km: DEPRECIATION_RATE_PER_KM,
    estimated_fuel_cost: estimatedFuelCost,
    estimated_depreciation_cost: estimatedDepreciationCost,
    total_operating_cost: totalOperatingCost,
    recommended_price_per_seat: recommendedPricePerSeat,
    min_reasonable_price: minReasonablePrice,
    // CamelCase aliases
    fuelCost: estimatedFuelCost,
    depreciationCost: estimatedDepreciationCost,
    totalCost: totalOperatingCost,
    recommendedSeatPrice: recommendedPricePerSeat,
    reasonableMinPrice: minReasonablePrice,
  };
}

async function estimateRoute(origin, destination, seats = 4) {
  if (!origin || !destination) {
    throw new Error('กรุณาระบุต้นทางและปลายทาง');
  }

  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  let routeResult = null;

  // 1. Try Google Maps API if configured
  if (googleApiKey) {
    try {
      routeResult = await fetchGoogleMapsDistance(origin, destination, googleApiKey);
    } catch (err) {
      console.warn('Google Maps API error, falling back to smart router:', err.message);
    }
  }

  // 2. Smart Highway Router Fallback
  if (!routeResult) {
    const originCoords = findCoordinates(origin);
    const destCoords = findCoordinates(destination);

    let distanceKm = 85; // Default sensible fallback for unknown locations within region
    let durationMinutes = 75;

    if (originCoords && destCoords) {
      const crowDistance = haversineDistance(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      );
      // Multiply by Thai highway network winding factor (~1.28x)
      distanceKm = Math.max(15, Math.round(crowDistance * 1.28 * 10) / 10);
      // Average highway speed ~70 km/h + 15 mins local traffic
      durationMinutes = Math.max(20, Math.round((distanceKm / 72) * 60 + 15));
    } else {
      // Basic heuristic for typical inter-province trips
      distanceKm = 120;
      durationMinutes = 95;
    }

    routeResult = {
      distance_km: distanceKm,
      duration_text: formatDurationThai(durationMinutes),
      duration_minutes: durationMinutes,
      source: 'smart_route_engine',
    };
  }

  const distanceKm = routeResult.distance_km;
  const cost = calculateOperatingCost(distanceKm, seats);

  return {
    success: true,
    origin,
    destination,
    distance_km: distanceKm,
    distanceKm: distanceKm,
    duration_text: routeResult.duration_text,
    durationText: routeResult.duration_text,
    duration_minutes: routeResult.duration_minutes,
    cost_breakdown: cost,
    costBreakdown: cost,
    source: routeResult.source,
  };
}

module.exports = {
  estimateRoute,
  calculateOperatingCost,
  formatDurationThai,
};
