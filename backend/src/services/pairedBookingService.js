const db = require('../config/db');
const { createNotification } = require('../controllers/notificationController');

// Old round trips have two rows. Treat both legs as one atomic booking action.
function withPairedBooking(action, fallback) {
  return async (req, res) => {
    let client;
    try {
      const byTrip = ['book', 'cancel', 'kick'].includes(action);
      const selected = await db.query(byTrip
        ? 'SELECT t.* FROM trips t WHERE t.trip_id = $1'
        : 'SELECT t.*, b.user_id AS passenger_id FROM bookings b JOIN trips t ON t.trip_id = b.trip_id WHERE b.booking_id = $1',
      [action === 'book' ? req.body.trip_id : req.params.id]);
      const selectedTrip = selected.rows[0];
      if (!selectedTrip?.is_round_trip || !selectedTrip.paired_trip_id) return fallback(req, res);
      client = await db.pool.connect();
      await client.query('BEGIN');
      const result = await client.query(`SELECT t.*, COALESCE(t.organizer_id, c.user_id) AS driver_id
        FROM trips t LEFT JOIN cars c ON c.license_plate = t.license_plate
        WHERE t.trip_id = ANY($1::int[]) ORDER BY t.trip_id FOR UPDATE OF t`, [[selectedTrip.trip_id, selectedTrip.paired_trip_id]]);
      const legs = result.rows;
      const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
      if (legs.length !== 2 || !legs.every(t => t.is_round_trip && legs.some(other => other.trip_id === t.paired_trip_id && other.paired_trip_id === t.trip_id))) {
        fail(409, 'ข้อมูลทริปไป-กลับไม่ครบ กรุณาโหลดใหม่');
      }
      const ids = legs.map(t => t.trip_id);
      const userId = req.user.user_id || req.user.id;
      const admin = Boolean(req.user.is_admin) || req.user.email === 'admin@ikoshare.com';
      const passengerId = action === 'kick' ? Number(req.params.userId) : byTrip ? userId : selectedTrip.passenger_id;
      const ownerAction = ['approve', 'reject', 'verify', 'kick'].includes(action);
      if (ownerAction && !admin && !legs.every(t => t.driver_id === userId)) fail(403, 'คุณไม่มีสิทธิ์จัดการคำขอนี้');
      if (action === 'slip' && passengerId !== userId) fail(403, 'คุณไม่มีสิทธิ์แนบสลิปนี้');
      if (action === 'book' && legs.some(t => t.driver_id === userId)) fail(400, 'คุณไม่สามารถจองทริปของตนเองได้');
      if (action === 'kick' && legs.some(t => t.driver_id === passengerId)) fail(400, 'ไม่สามารถนำหัวห้องออกจากตี้ได้');
      if (['book', 'approve'].includes(action) && legs.some(t => t.trip_status !== 'active')) fail(400, 'ทริปไปหรือกลับไม่เปิดรับจอง');
      const bookingsRes = await client.query(`SELECT * FROM bookings WHERE trip_id = ANY($1::int[]) AND user_id = $2
        ORDER BY booking_id DESC FOR UPDATE`, [ids, passengerId]);
      const active = bookingsRes.rows.filter(b => ['จองแล้ว', 'รอการอนุมัติ'].includes(b.booking_status));
      if (action === 'book') {
        if (!admin && bookingsRes.rows.some(b => b.booking_status === 'ถูกนำออกจากตี้')) fail(403, 'คุณถูกนำออกจากทริปนี้แล้ว');
        const missing = legs.filter(t => !active.some(b => b.trip_id === t.trip_id));
        if (!admin && missing.some(t => t.available_seats <= 0)) fail(400, 'ที่นั่งขาไปหรือขากลับเต็มแล้ว');
        for (const leg of missing) {
          const inserted = await client.query(`INSERT INTO bookings (user_id, trip_id, booking_status, location, booking_time)
            VALUES ($1, $2, $3, $4, NOW()) RETURNING *`, [userId, leg.trip_id, admin ? 'จองแล้ว' : 'รอการอนุมัติ', req.body.location || null]);
          active.push(inserted.rows[0]);
          if (admin) await client.query('UPDATE trips SET available_seats = GREATEST(available_seats - 1, 0) WHERE trip_id = $1', [leg.trip_id]);
        }
      } else if (action === 'approve') {
        if (!active.length) fail(400, 'คำขอนี้ถูกยกเลิกหรือปฏิเสธแล้ว');
        // Existing passengers who joined only one legacy leg now get both legs.
        for (const leg of legs) {
          let booking = active.find(b => b.trip_id === leg.trip_id);
          if (booking?.booking_status === 'จองแล้ว') continue;
          if (leg.available_seats <= 0) fail(400, 'ที่นั่งขาไปหรือขากลับเต็มแล้ว');
          if (!booking) {
            const inserted = await client.query(`INSERT INTO bookings (user_id, trip_id, booking_status, location, booking_time)
              VALUES ($1, $2, 'รอการอนุมัติ', $3, NOW()) RETURNING *`, [passengerId, leg.trip_id, active[0].location]);
            booking = inserted.rows[0];
            active.push(booking);
          }
          await client.query("UPDATE bookings SET booking_status = 'จองแล้ว' WHERE booking_id = $1", [booking.booking_id]);
          await client.query('UPDATE trips SET available_seats = available_seats - 1 WHERE trip_id = $1', [leg.trip_id]);
        }
      } else if (['reject', 'cancel', 'kick'].includes(action)) {
        if (!active.length) fail(404, 'ไม่พบคำขอร่วมเดินทาง');
        for (const booking of active) {
          await client.query('UPDATE bookings SET booking_status = $1 WHERE booking_id = $2', [action === 'kick' ? 'ถูกนำออกจากตี้' : action === 'cancel' ? 'ยกเลิกแล้ว' : 'ปฏิเสธ', booking.booking_id]);
          if (booking.booking_status === 'จองแล้ว') await client.query('UPDATE trips SET available_seats = available_seats + 1 WHERE trip_id = $1', [booking.trip_id]);
        }
      } else {
        // Preserve old single-leg receipts until the passenger has joined both legs.
        if (!legs.every(t => active.some(b => b.trip_id === t.trip_id && b.booking_status === 'จองแล้ว'))) {
          await client.query('ROLLBACK');
          client.release();
          client = null;
          return fallback(req, res);
        }
        const bookingIds = active.map(b => b.booking_id);
        if (action === 'slip') {
          if (!req.body.slip_url) fail(400, 'กรุณาแนบสลิปการชำระเงิน');
          await client.query(`UPDATE bookings SET payment_slip_url = $1, payment_status = 'pending_verification', payment_time = NOW()
            WHERE booking_id = ANY($2::int[])`, [req.body.slip_url, bookingIds]);
        } else {
          await client.query('UPDATE bookings SET payment_status = $1 WHERE booking_id = ANY($2::int[])', [req.body.status === 'paid' ? 'paid' : 'unpaid', bookingIds]);
        }
      }
      await client.query('COMMIT');
      if (action === 'slip') {
        await createNotification(legs[0].driver_id, '💳 สลิปค่าเดินทางไป-กลับ', 'ผู้โดยสารแนบสลิปสำหรับทั้งขาไปและขากลับแล้ว กรุณาตรวจสอบ', 'payment', `/trips/${ids[0]}`);
      } else if (action === 'verify') {
        await createNotification(passengerId, 'สถานะชำระเงินไป-กลับ', req.body.status === 'paid' ? 'คนขับยืนยันการชำระเงินครบทั้งขาไปและขากลับแล้ว' : 'กรุณาตรวจสอบการชำระเงินไป-กลับกับคนขับ', 'payment', `/trips/${ids[0]}`);
      }
      return res.status(action === 'book' ? 201 : 200).json({ success: true, round_trip: true,
        message: action === 'book' ? 'จองทั้งขาไปและขากลับในครั้งเดียวแล้ว กรุณารอคนขับอนุมัติ' : 'บันทึกทั้งขาไปและขากลับเรียบร้อยแล้ว',
        booking: active[0] || null });
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'ไม่สามารถบันทึกทริปไป-กลับได้ กรุณาลองใหม่' });
    } finally {
      if (client) client.release();
    }
  };
}

module.exports = { withPairedBooking };
