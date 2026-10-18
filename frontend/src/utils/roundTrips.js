// Legacy bookings/payments stay on their original legs; only their cards are grouped.
export function groupRoundTrips(trips) {
  const byId = new Map(trips.map(trip => [trip.trip_id, trip]));
  return trips.filter(trip => {
    const paired = byId.get(trip.paired_trip_id);
    return !paired || paired.paired_trip_id !== trip.trip_id ||
      !trip.is_round_trip || !paired.is_round_trip ||
      new Date(trip.departure_time) <= new Date(paired.departure_time);
  }).map(trip => {
    const paired = byId.get(trip.paired_trip_id);
    if (!paired || paired.paired_trip_id !== trip.trip_id || !trip.is_round_trip || !paired.is_round_trip) return trip;
    return { ...trip, price_seat: (Number(trip.price_seat) + Number(paired.price_seat)).toFixed(2),
      return_departure_time: paired.departure_time };
  });
}
