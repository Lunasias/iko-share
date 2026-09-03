const db = require('../config/db');

// Join Trip / Create Booking
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
      return res.status(400).json({ success: false, message: 'คุณไม่สามารถจองร่วมเดินทางในเที่ยวรถของตนเองได้' });
    }

    // Verify seats available
    if (trip.available_seats <= 0) {
      return res.status(400).json({ success: false, message: 'เที่ยวเดินทางนี้ที่นั่งเต็มแล้ว' });
    }

    // Check existing active booking
    const checkBooking = await db.query(
      "SELECT booking_id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status = 'จองแล้ว'",
      [trip_id, userId]
    );

    if (checkBooking.rows && checkBooking.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'คุณได้จองร่วมเดินทางในเที่ยวนี้ไว้เรียบร้อยแล้ว' });
    }

    // Create booking record
    const newBooking = await db.query(
      `INSERT INTO bookings (user_id, trip_id, booking_status, location, booking_time)
       VALUES ($1, $2, 'จองแล้ว', $3, NOW())
       RETURNING *`,
      [userId, trip_id, location || null]
    );

    // Decrement available seats in trips
    await db.query('UPDATE trips SET available_seats = available_seats - 1 WHERE trip_id = $1 AND available_seats > 0', [trip_id]);

    res.status(201).json({
      success: true,
      message: 'จองร่วมเดินทางสำเร็จเรียบร้อยแล้ว!',
      booking: newBooking.rows && newBooking.rows[0] ? newBooking.rows[0] : null,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการจอง: ' + (error.message || String(error)) });
  }
};

// Leave Trip / Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params; // booking_id or trip_id

    const bookingRes = await db.query(
      "SELECT * FROM bookings WHERE (booking_id = $1 OR trip_id = $1) AND user_id = $2 AND booking_status = 'จองแล้ว'",
      [id, userId]
    );

    if (!bookingRes.rows || bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการจองที่ต้องการยกเลิก' });
    }

    const booking = bookingRes.rows[0];

    // Update booking_status to 'ยกเลิกแล้ว'
    await db.query("UPDATE bookings SET booking_status = 'ยกเลิกแล้ว' WHERE booking_id = $1", [booking.booking_id]);

    // Increment available_seats back to trips
    await db.query('UPDATE trips SET available_seats = available_seats + 1 WHERE trip_id = $1', [booking.trip_id]);

    res.json({
      success: true,
      message: 'ยกเลิกการจองร่วมเดินทางเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกการจอง: ' + (error.message || String(error)) });
  }
};

module.exports = {
  createBooking,
  cancelBooking,
};
