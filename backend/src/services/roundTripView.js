function combinePassengers(rows, paired, totalFare = 0) {
  if (!paired) return rows;
  const groups = new Map();
  for (const row of rows) {
    const active = ['จองแล้ว', 'รอการอนุมัติ'].includes(row.booking_status);
    const key = active ? `active:${row.user_id}` : `history:${row.booking_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map(bookings => {
    const current = { ...(bookings.find(b => b.payment_status !== 'paid') || bookings[0]) };
    const both = new Set(bookings.map(b => b.trip_id)).size === 2;
    current.round_trip_complete = both;
    current.payment_due = Math.max(0, Math.round((Number(totalFare) - bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + Number(b.leg_price_seat || 0), 0)) * 100) / 100);
    if (bookings.some(b => b.booking_status === 'รอการอนุมัติ')) current.booking_status = 'รอการอนุมัติ';
    if (both) {
      const allPaid = bookings.every(b => b.payment_status === 'paid');
      const unpaid = bookings.filter(b => b.payment_status !== 'paid');
      const sameSlip = unpaid[0]?.payment_slip_url && unpaid.every(b => b.payment_slip_url === unpaid[0].payment_slip_url);
      current.payment_status = allPaid ? 'paid' : sameSlip && unpaid.every(b => b.payment_status === 'pending_verification') ? 'pending_verification' : 'unpaid';
      if (!allPaid && !sameSlip) current.payment_slip_url = null;
    }
    return current;
  });
}

module.exports = { combinePassengers };
