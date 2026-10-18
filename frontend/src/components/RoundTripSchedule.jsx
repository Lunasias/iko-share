import React from 'react';

export default function RoundTripSchedule({ trip, isTh }) {
  if (!trip.is_round_trip || !trip.return_departure_time) return null;
  const format = (value) => new Date(value).toLocaleString(isTh ? 'th-TH' : 'en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  });
  return (
    <div className="space-y-1 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-950">
      <div><strong>{isTh ? 'ขาไป: ' : 'Outbound: '}</strong>{trip.origin} → {trip.destination} · {format(trip.departure_time)}</div>
      <div><strong>{isTh ? 'ขากลับ: ' : 'Return: '}</strong>{trip.destination} → {trip.origin} · {format(trip.return_departure_time)}</div>
      <div className="font-bold">{isTh ? 'จองครั้งเดียว รวมทั้งขาไปและขากลับ' : 'One booking covers both journeys'}</div>
    </div>
  );
}
