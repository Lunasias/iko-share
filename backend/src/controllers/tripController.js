const db = require('../config/db');

// Get / Search trips
const getTrips = async (req, res) => {
  try {
    const { origin, destination, event_id } = req.query;
    let queryText = `
      SELECT t.*, c.model as car_model, c.capacity as car_capacity, c.user_id as driver_id,
             u.name as driver_name, u.phone as driver_phone, u.avatar_url as driver_avatar, u.role as driver_role, u.bio as driver_bio,
             COALESCE(e.event_name, t.custom_event_name) as event_name, e.category as event_category
      FROM trips t
      JOIN cars c ON t.license_plate = c.license_plate
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN events e ON t.event_id = e.event_id
      WHERE 1=1
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
    if (event_id) {
      params.push(event_id);
      queryText += ` AND t.event_id = $${params.length}`;
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
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเที่ยวเดินทาง: ' + (error.message || String(error)) });
  }
};

// Get single trip details with passengers
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const tripRes = await db.query(
      `SELECT t.*, c.model as car_model, c.capacity as car_capacity, c.user_id as driver_id,
              u.name as driver_name, u.phone as driver_phone, u.email as driver_email, u.avatar_url as driver_avatar, u.role as driver_role, u.bio as driver_bio,
              COALESCE(e.event_name, t.custom_event_name) as event_name, e.location as event_location
       FROM trips t
       LEFT JOIN cars c ON t.license_plate = c.license_plate
       JOIN users u ON u.user_id = COALESCE(c.user_id, t.organizer_id)
       LEFT JOIN events e ON t.event_id = e.event_id
       WHERE t.trip_id = $1`,
      [id]
    );

    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการเดินทางนี้' });
    }

    const bookingsRes = await db.query(
      `SELECT b.*, u.name as passenger_name, u.phone as passenger_phone, u.avatar_url as passenger_avatar, u.bio as passenger_bio, u.role as passenger_role
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.trip_id = $1
       ORDER BY b.booking_time DESC`,
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
    const userId = req.user.user_id || req.user.id;
    const {
      license_plate,
      trip_type = 'carpool',
      event_id,
      custom_event_name,
      origin,
      destination,
      departure_time,
      available_seats,
      price_seat,
      driver_personality,
      passenger_requirements,
    } = req.body;

    const allowedTripTypes = ['carpool', 'public_transport', 'find_driver'];
    if (!allowedTripTypes.includes(trip_type)) {
      return res.status(400).json({ success: false, message: 'รูปแบบทริปไม่ถูกต้อง' });
    }
    if (!origin || !destination || !available_seats || price_seat === undefined) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลการเดินทางให้ครบถ้วน' });
    }

    let capacity = null;
    if (trip_type === 'carpool') {
      const carRes = await db.query('SELECT capacity FROM cars WHERE license_plate = $1 AND user_id = $2', [license_plate, userId]);
      if (!carRes.rows || carRes.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'ไม่พบข้อมูลรถของคุณ หรือเลือกรถไม่ถูกต้อง' });
      }
      capacity = carRes.rows[0].capacity;
    }
    const seatsToOffer = parseInt(available_seats);
    if (!Number.isInteger(seatsToOffer) || seatsToOffer < 1) {
      return res.status(400).json({ success: false, message: 'จำนวนที่นั่งต้องเป็นเลขตั้งแต่ 1 ขึ้นไป' });
    }
    if (capacity && seatsToOffer > capacity) {
      return res.status(400).json({ success: false, message: `จำนวนที่นั่งเปิดรับ (${seatsToOffer}) ต้องไม่เกินความจุที่นั่งของรถ (${capacity} ที่นั่ง)` });
    }

    const newTrip = await db.query(
      `INSERT INTO trips (
        license_plate, trip_type, organizer_id, event_id, custom_event_name, origin, destination,
        departure_time, available_seats, price_seat, driver_personality,
        passenger_requirements, trip_status, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', NOW())
       RETURNING *`,
      [
        license_plate || null,
        trip_type,
        userId,
        event_id ? parseInt(event_id) : null,
        custom_event_name ? custom_event_name.trim() : null,
        origin.trim(),
        destination.trim(),
        departure_time || new Date(),
        seatsToOffer,
        parseFloat(price_seat),
        driver_personality ? driver_personality.trim() : null,
        passenger_requirements ? passenger_requirements.trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'เปิดรายการเดินทางสำเร็จเรียบร้อยแล้ว',
      trip: newTrip.rows && newTrip.rows[0] ? newTrip.rows[0] : null,
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถสร้างการเดินทางได้: ' + (error.message || String(error)) });
  }
};

// Complete trip (Driver or Admin)
const completeTrip = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params;

    const tripRes = await db.query(
      'SELECT t.*, c.user_id as driver_id FROM trips t JOIN cars c ON t.license_plate = c.license_plate WHERE t.trip_id = $1',
      [id]
    );

    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการเดินทางนี้' });
    }

    const trip = tripRes.rows[0];
    const isOwner = trip.driver_id === userId;
    const isAdmin = req.user.is_admin || req.user.email === 'admin@ikoshare.com';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'เฉพาะคนขับหรือแอดมินเท่านั้นที่สามารถปิดทริปได้' });
    }

    await db.query("UPDATE trips SET trip_status = 'completed' WHERE trip_id = $1", [id]);

    res.json({
      success: true,
      message: 'บันทึกสถานะสิ้นสุดการเดินทางเรียบร้อยแล้ว! สามารถแชร์ภาพความทรงจำและรีวิวได้',
    });
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสิ้นสุดทริป: ' + (error.message || String(error)) });
  }
};

// Delete trip (Owner or Admin)
const deleteTrip = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params;

    const tripRes = await db.query(
      'SELECT t.*, c.user_id as driver_id FROM trips t JOIN cars c ON t.license_plate = c.license_plate WHERE t.trip_id = $1',
      [id]
    );

    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการเดินทางที่ต้องการลบ' });
    }

    const trip = tripRes.rows[0];
    const isOwner = trip.driver_id === userId;
    const isAdmin = req.user.is_admin || req.user.email === 'admin@ikoshare.com';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการลบเที่ยวเดินทางนี้' });
    }

    await db.query('DELETE FROM trips WHERE trip_id = $1', [id]);

    res.json({
      success: true,
      message: 'ลบรายการเดินทางเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเที่ยวเดินทาง: ' + (error.message || String(error)) });
  }
};

// Get user's trips
const getUserTrips = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;

    const createdTrips = await db.query(
      `SELECT t.*, c.model as car_model, c.capacity as car_capacity,
              COALESCE(e.event_name, t.custom_event_name) as event_name
       FROM trips t
       JOIN cars c ON t.license_plate = c.license_plate
       LEFT JOIN events e ON t.event_id = e.event_id
       WHERE c.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    const joinedTrips = await db.query(
      `SELECT t.*, b.booking_id, b.booking_status, b.location as meetup_location, b.booking_time,
              c.user_id as driver_id, u.name as driver_name, u.phone as driver_phone, u.avatar_url as driver_avatar,
              COALESCE(e.event_name, t.custom_event_name) as event_name
       FROM bookings b
       JOIN trips t ON b.trip_id = t.trip_id
       LEFT JOIN cars c ON t.license_plate = c.license_plate
       JOIN users u ON u.user_id = COALESCE(c.user_id, t.organizer_id)
       LEFT JOIN events e ON t.event_id = e.event_id
       WHERE b.user_id = $1
       ORDER BY b.booking_time DESC`,
      [userId]
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

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  completeTrip,
  deleteTrip,
  getUserTrips,
};
