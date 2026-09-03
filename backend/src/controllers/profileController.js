const db = require('../config/db');

// Get current user profile & stats
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const userRes = await db.query(
      'SELECT user_id, name, email, phone, role, avatar_url, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
    }

    const tripsCreated = await db.query(
      'SELECT COUNT(*) FROM trips t JOIN cars c ON t.license_plate = c.license_plate WHERE c.user_id = $1',
      [userId]
    );
    const tripsJoined = await db.query(
      "SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND booking_status = 'จองแล้ว'",
      [userId]
    );

    res.json({
      success: true,
      user: userRes.rows[0],
      stats: {
        tripsCreated: parseInt(tripsCreated.rows[0]?.count || 0),
        tripsJoined: parseInt(tripsJoined.rows[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์: ' + (error.message || String(error)) });
  }
};

// Update profile including Role Switcher
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { name, phone, avatar_url, role } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ-นามสกุล' });
    }

    const validRole = ['Driver', 'Passenger', 'Both'].includes(role) ? role : undefined;

    let updateQuery = `
      UPDATE users
      SET name = $1, phone = $2, avatar_url = $3
    `;
    const queryParams = [name, phone || null, avatar_url || null];

    if (validRole) {
      queryParams.push(validRole);
      updateQuery += `, role = $${queryParams.length}`;
    }

    queryParams.push(userId);
    updateQuery += ` WHERE user_id = $${queryParams.length} RETURNING user_id, name, email, phone, role, avatar_url, created_at`;

    const updatedRes = await db.query(updateQuery, queryParams);
    const user = updatedRes.rows && updatedRes.rows[0] ? updatedRes.rows[0] : { user_id: userId, name, phone, avatar_url, role: validRole };

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์: ' + (error.message || String(error)) });
  }
};

// Get Public Owner Profile Modal Data
const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const userRes = await db.query(
      'SELECT user_id, name, email, phone, role, avatar_url, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งานนี้' });
    }

    const owner = userRes.rows[0];

    // Cars owned by driver
    const carsRes = await db.query('SELECT * FROM cars WHERE user_id = $1', [userId]);

    // Stats
    const tripsCreated = await db.query(
      'SELECT COUNT(*) FROM trips t JOIN cars c ON t.license_plate = c.license_plate WHERE c.user_id = $1',
      [userId]
    );

    // Reviews & Average Rating
    const reviewsRes = await db.query(
      `SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.target_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const avgRes = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      owner,
      cars: carsRes.rows || [],
      tripsCreatedCount: parseInt(tripsCreated.rows[0]?.count || 0),
      reviews: reviewsRes.rows || [],
      avgRating: parseFloat(avgRes.rows[0]?.avg_rating || 0).toFixed(1),
      reviewCount: parseInt(avgRes.rows[0]?.review_count || 0),
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์สาธารณะ: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
};
