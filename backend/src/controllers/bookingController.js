const db = require('../config/db');

// Join Trip / Request Booking (Status: 'รอการอนุมัติ')
const createBooking = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { trip_id, location } = req.body;

    if (!trip_id) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเที่ยวเดินทาง' });
    }

    const tripRes = await db.query(
      `SELECT t.*, c.user_id as driver_id FROM trips t JOIN cars c ON t.license_plate = c.license_plate WHERE t.trip_id = $1`,
      [trip_id]
    );

    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลเที่ยวเดินทางนี้' });
    }

    const trip = tripRes.rows[0];

    // Verify user is not the driver of this trip
    if (trip.driver_id === userId) {
      return res.status(400).json({ success: false, message: 'คุณไม่สามารถขอร่วมเดินทางในเที่ยวรถของตนเองได้' });
    }

    // Verify seats available
    if (trip.available_seats <= 0) {
      return res.status(400).json({ success: false, message: 'เที่ยวเดินทางนี้ที่นั่งเต็มแล้ว' });
    }

    // Check existing active or pending booking
    const checkBooking = await db.query(
      "SELECT booking_id, booking_status FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status IN ('จองแล้ว', 'รอการอนุมัติ')",
      [trip_id, userId]
    );

    if (checkBooking.rows && checkBooking.rows.length > 0) {
      const status = checkBooking.rows[0].booking_status;
      return res.status(400).json({
        success: false,
        message: status === 'จองแล้ว' ? 'คุณได้จองร่วมเดินทางในเที่ยวนี้เรียบร้อยแล้ว' : 'คำขอร่วมเดินทางของคุณกำลังรอคนขับอนุมัติ'
      });
    }

    // Create booking record with status 'รอการอนุมัติ'
    const newBooking = await db.query(
      `INSERT INTO bookings (user_id, trip_id, booking_status, location, booking_time)
       VALUES ($1, $2, 'รอการอนุมัติ', $3, NOW())
       RETURNING *`,
      [userId, trip_id, location || null]
    );

    res.status(201).json({
      success: true,
      message: 'ส่งคำขอร่วมเดินทางเรียบร้อยแล้ว! กรุณารอคนขับอนุมัติ',
      booking: newBooking.rows && newBooking.rows[0] ? newBooking.rows[0] : null,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งคำขอ: ' + (error.message || String(error)) });
  }
};

// Approve Booking (Driver Action)
const approveBooking = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id

    const bookingRes = await db.query(
      `SELECT b.*, t.trip_id, t.available_seats, c.user_id as driver_id
       FROM bookings b
       JOIN trips t ON b.trip_id = t.trip_id
       JOIN cars c ON t.license_plate = c.license_plate
       WHERE b.booking_id = $1`,
      [id]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำขอจองนี้' });
    }

    const booking = bookingRes.rows[0];

    // Only trip driver can approve
    if (booking.driver_id !== userId && req.user.role !== 'Admin' && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการอนุมัติคำขอนี้' });
    }

    if (booking.available_seats <= 0) {
      return res.status(400).json({ success: false, message: 'ที่นั่งเต็มแล้ว ไม่สามารถอนุมัติเพิ่มได้' });
    }

    // Update status to 'จองแล้ว'
    await db.query("UPDATE bookings SET booking_status = 'จองแล้ว' WHERE booking_id = $1", [id]);

    // Decrement available seats in trips
    await db.query('UPDATE trips SET available_seats = available_seats - 1 WHERE trip_id = $1 AND available_seats > 0', [booking.trip_id]);

    res.json({
      success: true,
      message: 'อนุมัติผู้ร่วมเดินทางเรียบร้อยแล้ว!',
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติ: ' + (error.message || String(error)) });
  }
};

// Reject Booking (Driver Action)
const rejectBooking = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id

    const bookingRes = await db.query(
      `SELECT b.*, c.user_id as driver_id
       FROM bookings b
       JOIN trips t ON b.trip_id = t.trip_id
       JOIN cars c ON t.license_plate = c.license_plate
       WHERE b.booking_id = $1`,
      [id]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำขอจองนี้' });
    }

    const booking = bookingRes.rows[0];

    // Only trip driver can reject
    if (booking.driver_id !== userId && req.user.role !== 'Admin' && req.user.email !== 'admin@ikoshare.com') {
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
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id or trip_id

    const bookingRes = await db.query(
      "SELECT * FROM bookings WHERE (booking_id = $1 OR trip_id = $1) AND user_id = $2 AND booking_status IN ('จองแล้ว', 'รอการอนุมัติ')",
      [id, userId]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการจองที่ต้องการยกเลิก' });
    }

    const booking = bookingRes.rows[0];
    const wasConfirmed = booking.booking_status === 'จองแล้ว';

    // Update booking_status to 'ยกเลิกแล้ว'
    await db.query("UPDATE bookings SET booking_status = 'ยกเลิกแล้ว' WHERE booking_id = $1", [booking.booking_id]);

    // If booking was confirmed, increment available_seats back to trips
    if (wasConfirmed) {
      await db.query('UPDATE trips SET available_seats = available_seats + 1 WHERE trip_id = $1', [booking.trip_id]);
    }

    res.json({
      success: true,
      message: 'ยกเลิกคำขอ / ออกจากทริปเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกการจอง: ' + (error.message || String(error)) });
  }
};

module.exports = {
  createBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
};
