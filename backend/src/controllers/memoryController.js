const db = require('../config/db');

// Get trip memories & photos
const getTripMemories = async (req, res) => {
  try {
    const { tripId } = req.params;
    const memoriesRes = await db.query(
      `SELECT m.*, u.name as author_name, u.avatar_url as author_avatar
       FROM trip_memories m
       JOIN users u ON m.user_id = u.user_id
       WHERE m.trip_id = $1
       ORDER BY m.created_at DESC`,
      [tripId]
    );

    res.json({
      success: true,
      memories: memoriesRes.rows || [],
    });
  } catch (error) {
    console.error('Get trip memories error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงภาพความทรงจำของทริป: ' + (error.message || String(error)) });
  }
};

// Add trip memory photo / story
const addTripMemory = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { tripId } = req.params;
    const { photo_url, caption } = req.body;

    if (!photo_url) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกรูปภาพเพื่อแชร์ความทรงจำ' });
    }

    // Verify user was in the trip (driver or confirmed passenger)
    const tripRes = await db.query(
      'SELECT c.user_id as driver_id FROM trips t JOIN cars c ON t.license_plate = c.license_plate WHERE t.trip_id = $1',
      [tripId]
    );
    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลทริป' });
    }

    const isDriver = tripRes.rows[0].driver_id === userId;
    const bookingRes = await db.query(
      "SELECT booking_id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status = 'จองแล้ว'",
      [tripId, userId]
    );
    const isPassenger = bookingRes.rows && bookingRes.rows.length > 0;

    if (!isDriver && !isPassenger && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'เฉพาะผู้ที่ร่วมทริปนี้เท่านั้นที่สามารถโพสต์ภาพความทรงจำได้' });
    }

    const newMemory = await db.query(
      `INSERT INTO trip_memories (trip_id, user_id, photo_url, caption, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [tripId, userId, photo_url, caption || null]
    );

    res.status(201).json({
      success: true,
      message: 'บันทึกภาพความทรงจำและประสบการณ์ของทริปเรียบร้อยแล้ว!',
      memory: newMemory.rows && newMemory.rows[0] ? newMemory.rows[0] : null,
    });
  } catch (error) {
    console.error('Add trip memory error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกภาพความทรงจำ: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getTripMemories,
  addTripMemory,
};
