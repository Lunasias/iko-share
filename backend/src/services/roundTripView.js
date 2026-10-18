function combinePassengers(rows, paired) {
  if (!paired) return rows;
  const groups = new Map();
  for (const row of rows) {
    const active = ['จองแล้ว', 'รอการอนุมัติ'].includes(row.booking_status);
    const key = active ? `active:${row.user_id}` : `history:${row.booking_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map(bookings => {
    const current = { ...bookings[0] };
    const both = new Set(bookings.map(b => b.trip_id)).size === 2;
    current.round_trip_complete = both;
    if (bookings.some(b => b.booking_status === 'รอการอนุมัติ')) current.booking_status = 'รอการอนุมัติ';
    if (both) {
      const allPaid = bookings.every(b => b.payment_status === 'paid');
      const sameSlip = bookings[0].payment_slip_url && bookings.every(b => b.payment_slip_url === bookings[0].payment_slip_url);
      current.payment_status = allPaid ? 'paid' : sameSlip && bookings.every(b => b.payment_status === 'pending_verification') ? 'pending_verification' : 'unpaid';
      if (!allPaid && !sameSlip) current.payment_slip_url = null;
    }
    return current;
  });
}

module.exports = { combinePassengers };
