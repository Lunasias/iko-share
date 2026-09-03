const db = require('../config/db');

// Get all / search trips
const getTrips = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    let queryText = `
      SELECT t.*, u.name as driver_name, u.phone as driver_phone,
      (t.seats - COALESCE((SELECT SUM(seats_booked) FROM bookings WHERE trip_id = t.id AND status = 'confirmed'), 0)) as available_seats
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      WHERE t.status = 'active'
    `;
    const params = [];

    if (origin) {
      params.push(`%${origin}%`);
      queryText += ` AND t.origin ILIKE $${params.length}`;
    }
    if (destination) {
      params.push(`%${destination}%`);
      queryText += ` AND t.destination ILIKE $${params.length}`;
    }
    if (date) {
      params.push(date);
      queryText += ` AND DATE(t.departure_time) = $${params.length}`;
    }

    queryText += ` ORDER BY t.departure_time ASC`;

    const result = await db.query(queryText, params);
    res.json({
      success: true,
      count: result.rows ? result.rows.length : 0,
      trips: result.rows || [],
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเดินทาง: ' + (error.message || String(error)) });
  }
};

// Get single trip detail
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const tripRes = await db.query(
      `SELECT t.*, u.name as driver_name, u.phone as driver_phone, u.email as driver_email,
       (t.seats - COALESCE((SELECT SUM(seats_booked) FROM bookings WHERE trip_id = t.id AND status = 'confirmed'), 0)) as available_seats
       FROM trips t
       JOIN users u ON t.driver_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการเดินทางนี้' });
    }

    const bookingsRes = await db.query(
      `SELECT b.*, u.name as passenger_name, u.phone as passenger_phone
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.trip_id = $1 AND b.status = 'confirmed'`,
      [id]
    );

    res.json({
      success: true,
      trip: tripRes.rows[0],
      passengers: bookingsRes.rows || [],
    });
  } catch (error) {
    console.error('Get trip by id error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + (error.message || String(error)) });
  }
};

// Create new trip
const createTrip = async (req, res) => {
  try {
    const { origin, destination, departure_time, seats, price, car_model, notes } = req.body;
    const driver_id = req.user.id;

    if (!origin || !destination || !departure_time || !seats || price === undefined) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลการเดินทางให้ครบถ้วน' });
    }

    const result = await db.query(
      `INSERT INTO trips (driver_id, origin, destination, departure_time, seats, price, car_model, notes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
       RETURNING *`,
      [driver_id, origin, destination, departure_time, parseInt(seats), parseFloat(price), car_model || null, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'สร้างรายการเดินทางเรียบร้อยแล้ว',
      trip: result.rows && result.rows[0] ? result.rows[0] : null,
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถสร้างการเดินทางได้: ' + (error.message || String(error)) });
  }
};

// Join trip
const joinTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { seats_booked = 1, notes } = req.body;

    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบเส้นทางการเดินทางนี้' });
    }

    const trip = tripRes.rows[0];
    if (trip.driver_id === user_id) {
      return res.status(400).json({ success: false, message: 'คุณไม่สามารถร่วมเดินทางในเส้นทางของตัวเองได้' });
    }

    const bookingsSum = await db.query(
      "SELECT SUM(seats_booked) as booked FROM bookings WHERE trip_id = $1 AND status = 'confirmed'",
      [id]
    );
    const booked = parseInt(bookingsSum.rows[0]?.booked || 0);
    const available = trip.seats - booked;

    if (available < parseInt(seats_booked)) {
      return res.status(400).json({ success: false, message: 'ที่นั่งคงเหลือไม่เพียงพอ' });
    }

    const existingBooking = await db.query(
      "SELECT id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND status = 'confirmed'",
      [id, user_id]
    );
    if (existingBooking.rows && existingBooking.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'คุณได้จองร่วมเดินทางในเที่ยวนี้แล้ว' });
    }

    const bookingResult = await db.query(
      `INSERT INTO bookings (trip_id, user_id, seats_booked, notes, status, created_at)
       VALUES ($1, $2, $3, $4, 'confirmed', NOW())
       RETURNING *`,
      [id, user_id, parseInt(seats_booked), notes || null]
    );

    res.json({
      success: true,
      message: 'เข้าร่วมการเดินทางสำเร็จแล้ว!',
      booking: bookingResult.rows && bookingResult.rows[0] ? bookingResult.rows[0] : null,
    });
  } catch (error) {
    console.error('Join trip error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการร่วมเดินทาง: ' + (error.message || String(error)) });
  }
};

// Get user trips (created & joined)
const getUserTrips = async (req, res) => {
  try {
    const user_id = req.user.id;

    const createdTrips = await db.query(
      `SELECT t.*,
       (t.seats - COALESCE((SELECT SUM(seats_booked) FROM bookings WHERE trip_id = t.id AND status = 'confirmed'), 0)) as available_seats
       FROM trips t
       WHERE t.driver_id = $1
       ORDER BY t.departure_time DESC`,
      [user_id]
    );

    const joinedTrips = await db.query(
      `SELECT t.*, b.id as booking_id, b.seats_booked, b.status as booking_status, u.name as driver_name, u.phone as driver_phone
       FROM bookings b
       JOIN trips t ON b.trip_id = t.id
       JOIN users u ON t.driver_id = u.id
       WHERE b.user_id = $1
       ORDER BY t.departure_time DESC`,
      [user_id]
    );

    res.json({
      success: true,
      created: createdTrips.rows || [],
      joined: joinedTrips.rows || [],
    });
  } catch (error) {
    console.error('Get user trips error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + (error.message || String(error)) });
  }
};

// Cancel trip or booking
const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripRes.rows && tripRes.rows.length > 0 && tripRes.rows[0].driver_id === user_id) {
      await db.query("UPDATE trips SET status = 'cancelled' WHERE id = $1", [id]);
      return res.json({ success: true, message: 'ยกเลิกรายการเดินทางเรียบร้อยแล้ว' });
    }

    const bookingRes = await db.query('SELECT * FROM bookings WHERE trip_id = $1 AND user_id = $2', [id, user_id]);
    if (bookingRes.rows && bookingRes.rows.length > 0) {
      await db.query("UPDATE bookings SET status = 'cancelled' WHERE trip_id = $1 AND user_id = $2", [id, user_id]);
      return res.json({ success: true, message: 'ยกเลิกการจองที่นั่งเรียบร้อยแล้ว' });
    }

    res.status(404).json({ success: false, message: 'ไม่พบรายการที่ต้องการยกเลิก' });
  } catch (error) {
    console.error('Cancel trip error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  joinTrip,
  getUserTrips,
  cancelTrip,
};
