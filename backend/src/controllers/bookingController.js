const db = require('../config/db');

// Join Trip / Request Booking (Status: 'รอการอนุมัติ'). Administrators join instantly.
// Protected against double submits and race conditions (#BUG-102) with transactions and row locks.
const createBooking = async (req, res) => {
  let client = null;
  try {
    const userId = req.user.user_id || req.user.id;
    const { trip_id, location } = req.body;

    if (!trip_id) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเที่ยวเดินทาง' });
    }

    const isAdmin = Boolean(req.user.is_admin) || req.user.email === 'admin@ikoshare.com';

    // Acquire pool client for transactional safety if available
    client = db.pool && typeof db.pool.connect === 'function' ? await db.pool.connect() : null;
    const query = client ? (sql, params) => client.query(sql, params) : db.query;

    if (client) {
      await client.query('BEGIN');
    }

    // Lock trip row with FOR UPDATE OF t to prevent concurrent race conditions
    const tripRes = await query(
      `SELECT t.*, COALESCE(c.user_id, t.organizer_id) as driver_id
       FROM trips t
       LEFT JOIN cars c ON t.license_plate = c.license_plate
       WHERE t.trip_id = $1 ${client ? 'FOR UPDATE OF t' : ''}`,
      [trip_id]
    );

    if (!tripRes.rows || tripRes.rows.length === 0) {
      if (client) await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลเที่ยวเดินทางนี้' });
    }

    const trip = tripRes.rows[0];

    // Verify user is not the trip owner of this trip
    if (trip.driver_id === userId) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'คุณไม่สามารถขอร่วมเดินทางในเที่ยวรถของตนเองได้' });
    }

    // A member removed by the room head cannot simply re-join.
    const kickedRes = await query(
      "SELECT booking_id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status = 'ถูกนำออกจากตี้'",
      [trip_id, userId]
    );
    if (kickedRes.rows && kickedRes.rows.length > 0 && !isAdmin) {
      if (client) await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'คุณถูกหัวห้องนำออกจากตี้นี้แล้ว จึงไม่สามารถส่งคำขอเข้าร่วมได้อีก' });
    }

    // Check existing active or pending booking (Idempotency check)
    const checkBooking = await query(
      "SELECT booking_id, booking_status FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status IN ('จองแล้ว', 'รอการอนุมัติ')",
      [trip_id, userId]
    );

    if (checkBooking.rows && checkBooking.rows.length > 0) {
      const existing = checkBooking.rows[0];
      if (client) await client.query('COMMIT');
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: existing.booking_status === 'จองแล้ว'
          ? 'คุณได้จองร่วมเดินทางในเที่ยวนี้เรียบร้อยแล้ว'
          : 'คำขอร่วมเดินทางของคุณถูกส่งเรียบร้อยแล้ว กำลังรอคนขับอนุมัติ',
        booking: existing,
      });
    }

    // Verify seats available (administrators may always step in)
    if (trip.available_seats <= 0 && !isAdmin) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'เที่ยวเดินทางนี้ที่นั่งเต็มแล้ว' });
    }

    // Administrators bypass the approval step and enter the party immediately.
    const initialStatus = isAdmin ? 'จองแล้ว' : 'รอการอนุมัติ';

    const newBooking = await query(
      `INSERT INTO bookings (user_id, trip_id, booking_status, location, booking_time)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [userId, trip_id, initialStatus, location || null]
    );

    if (isAdmin) {
      await query(
        'UPDATE trips SET available_seats = GREATEST(available_seats - 1, 0) WHERE trip_id = $1',
        [trip_id]
      );
    }

    if (client) {
      await client.query('COMMIT');
    }

    res.status(201).json({
      success: true,
      message: isAdmin
        ? 'แอดมินเข้าร่วมตี้นี้ทันทีโดยไม่ต้องรอการอนุมัติ'
        : 'ส่งคำขอร่วมเดินทางเรียบร้อยแล้ว! กรุณารอคนขับอนุมัติ',
      booking: newBooking.rows && newBooking.rows[0] ? newBooking.rows[0] : null,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {}
    }
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งคำขอ: ' + (error.message || String(error)) });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Approve Booking (Driver Action) with atomic row locking
const approveBooking = async (req, res) => {
  let client = null;
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id

    client = db.pool && typeof db.pool.connect === 'function' ? await db.pool.connect() : null;
    const query = client ? (sql, params) => client.query(sql, params) : db.query;

    if (client) await client.query('BEGIN');

    const bookingRes = await query(
      `SELECT b.*, t.trip_id, t.available_seats, COALESCE(c.user_id, t.organizer_id) as driver_id
       FROM bookings b
       JOIN trips t ON b.trip_id = t.trip_id
       LEFT JOIN cars c ON t.license_plate = c.license_plate
       WHERE b.booking_id = $1 ${client ? 'FOR UPDATE OF b, t' : ''}`,
      [id]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      if (client) await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำขอจองนี้' });
    }

    const booking = bookingRes.rows[0];

    // If already approved, return early idempotently
    if (booking.booking_status === 'จองแล้ว') {
      if (client) await client.query('COMMIT');
      return res.json({ success: true, message: 'คำขอนี้ได้รับการอนุมัติเรียบร้อยแล้ว' });
    }

    // Only trip driver or admin can approve
    if (booking.driver_id !== userId && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      if (client) await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการอนุมัติคำขอนี้' });
    }

    if (booking.available_seats <= 0) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ที่นั่งเต็มแล้ว ไม่สามารถอนุมัติเพิ่มได้' });
    }

    // Update status to 'จองแล้ว'
    await query("UPDATE bookings SET booking_status = 'จองแล้ว' WHERE booking_id = $1", [id]);

    // Decrement available seats in trips
    await query('UPDATE trips SET available_seats = available_seats - 1 WHERE trip_id = $1 AND available_seats > 0', [booking.trip_id]);

    if (client) await client.query('COMMIT');

    res.json({
      success: true,
      message: 'อนุมัติผู้ร่วมเดินทางเรียบร้อยแล้ว!',
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {}
    }
    console.error('Approve booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติ: ' + (error.message || String(error)) });
  } finally {
    if (client) client.release();
  }
};

// Reject Booking (Driver Action)
const rejectBooking = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id

    const bookingRes = await db.query(
      `SELECT b.*, COALESCE(c.user_id, t.organizer_id) as driver_id
       FROM bookings b
       JOIN trips t ON b.trip_id = t.trip_id
       LEFT JOIN cars c ON t.license_plate = c.license_plate
       WHERE b.booking_id = $1`,
      [id]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำขอจองนี้' });
    }

    const booking = bookingRes.rows[0];

    // Only trip driver can reject
    if (booking.driver_id !== userId && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการปฏิเสธคำขอนี้' });
    }

    // Update status to 'ปฏิเสธ'
    await db.query("UPDATE bookings SET booking_status = 'ปฏิเสธ' WHERE booking_id = $1", [id]);

    res.json({
      success: true,
      message: 'ปฏิเสธคำขอร่วมเดินทางแล้ว',
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการปฏิเสธ: ' + (error.message || String(error)) });
  }
};

// Leave Trip / Cancel Booking
const cancelBooking = async (req, res) => {
  let client = null;
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // trip_id

    client = db.pool && typeof db.pool.connect === 'function' ? await db.pool.connect() : null;
    const query = client ? (sql, params) => client.query(sql, params) : db.query;

    if (client) await client.query('BEGIN');

    // Find the booking
    const bookingRes = await query(
      `SELECT * FROM bookings
       WHERE trip_id = $1 AND user_id = $2 AND booking_status IN ('จองแล้ว', 'รอการอนุมัติ')
       LIMIT 1 ${client ? 'FOR UPDATE' : ''}`,
      [id, userId]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      if (client) await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'คุณยังไม่ได้เข้าร่วมหรือส่งคำขอในเที่ยวนี้' });
    }

    const booking = bookingRes.rows[0];

    // Update status to 'ยกเลิกแล้ว'
    await query("UPDATE bookings SET booking_status = 'ยกเลิกแล้ว' WHERE booking_id = $1", [booking.booking_id]);

    // If previously confirmed, increment back available seats
    if (booking.booking_status === 'จองแล้ว') {
      await query('UPDATE trips SET available_seats = available_seats + 1 WHERE trip_id = $1', [id]);
    }

    if (client) await client.query('COMMIT');

    res.json({
      success: true,
      message: 'ยกเลิกคำขอร่วมเดินทางเรียบร้อยแล้ว',
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {}
    }
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก: ' + (error.message || String(error)) });
  } finally {
    if (client) client.release();
  }
};

// Submit Payment Slip (Passenger Action)
const submitPaymentSlip = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id
    const { slip_url } = req.body;

    if (!slip_url) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบรูปภาพสลิปการโอนเงิน' });
    }

    const bookingRes = await db.query(
      'SELECT * FROM bookings WHERE booking_id = $1',
      [id]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำขอจองนี้' });
    }

    const booking = bookingRes.rows[0];

    // Only the booked passenger can submit their slip
    if (booking.user_id !== userId && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ในการอัปโหลดสลิปสำหรับคำขอนี้' });
    }

    if (booking.booking_status !== 'จองแล้ว') {
      return res.status(400).json({ success: false, message: 'สามารถแนบสลิปได้เฉพาะคำขอที่ได้รับการอนุมัติแล้วเท่านั้น' });
    }

    const updated = await db.query(
      `UPDATE bookings
       SET payment_slip_url = $1, payment_status = 'pending_verification', payment_time = NOW()
       WHERE booking_id = $2
       RETURNING *`,
      [slip_url, id]
    );

    res.json({
      success: true,
      message: 'แนบสลิปการโอนเงินเรียบร้อยแล้ว กรุณารอคนขับตรวจสอบและยืนยัน',
      booking: updated.rows[0],
    });
  } catch (error) {
    console.error('Submit payment slip error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแนบสลิป: ' + (error.message || String(error)) });
  }
};

// Verify Payment (Driver or Admin Action)
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id
    const { status } = req.body; // 'paid' or 'unpaid'

    const targetStatus = status === 'paid' ? 'paid' : 'unpaid';

    const bookingRes = await db.query(
      `SELECT b.*, COALESCE(c.user_id, t.organizer_id) as driver_id
       FROM bookings b
       JOIN trips t ON b.trip_id = t.trip_id
       LEFT JOIN cars c ON t.license_plate = c.license_plate
       WHERE b.booking_id = $1`,
      [id]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำขอจองนี้' });
    }

    const booking = bookingRes.rows[0];

    // Only trip driver or admin can verify payment
    if (booking.driver_id !== userId && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการยืนยันยอดเงินนี้' });
    }

    const updated = await db.query(
      `UPDATE bookings
       SET payment_status = $1
       WHERE booking_id = $2
       RETURNING *`,
      [targetStatus, id]
    );

    res.json({
      success: true,
      message: targetStatus === 'paid' ? 'ยืนยันการรับเงินเรียบร้อยแล้ว!' : 'เปลี่ยนสถานะเป็นยังไม่ชำระเงินเรียบร้อยแล้ว',
      booking: updated.rows[0],
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยืนยันการรับเงิน: ' + (error.message || String(error)) });
  }
};

module.exports = {
  createBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  submitPaymentSlip,
  verifyPayment,
};
