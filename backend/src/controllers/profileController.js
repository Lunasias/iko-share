const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get current user profile & stats
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const [userRes, tripsCreated, tripsJoined] = await Promise.all([
      db.query(
        'SELECT user_id, name, email, phone, role, is_admin, is_verified, avatar_url, bio, created_at FROM users WHERE user_id = $1',
        [userId]
      ),
      db.query(
        'SELECT COUNT(*) FROM trips t LEFT JOIN cars c ON t.license_plate = c.license_plate WHERE COALESCE(c.user_id, t.organizer_id) = $1',
        [userId]
      ),
      db.query(
        "SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND booking_status = 'จองแล้ว'",
        [userId]
      ),
    ]);

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
    }

    res.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=30');
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

// Update profile including Role & Bio
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { name, phone, avatar_url, role, bio } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ-นามสกุล' });
    }

    const validRole = ['Driver', 'Passenger', 'Both'].includes(role) ? role : undefined;

    let updateQuery = `
      UPDATE users
      SET name = $1, phone = $2, avatar_url = $3, bio = $4
    `;
    const queryParams = [name, phone || null, avatar_url || null, bio || 'ยังไม่มีคำอธิบายตัวตน'];

    if (validRole) {
      queryParams.push(validRole);
      updateQuery += `, role = $${queryParams.length}`;
    }

    queryParams.push(userId);
    updateQuery += ` WHERE user_id = $${queryParams.length} RETURNING user_id, name, email, phone, role, is_admin, is_verified, avatar_url, bio, created_at`;

    const updatedRes = await db.query(updateQuery, queryParams);
    const user = updatedRes.rows && updatedRes.rows[0] ? updatedRes.rows[0] : { user_id: userId, name, phone, avatar_url, role: validRole, bio };

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
      'SELECT user_id, name, email, phone, role, is_admin, is_verified, avatar_url, bio, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งานนี้' });
    }

    const owner = userRes.rows[0];

    // Cars owned by driver
    const carsRes = await db.query('SELECT * FROM cars WHERE user_id = $1 ORDER BY created_at DESC, license_plate ASC', [userId]);

    // Stats
    const tripsCreated = await db.query(
      'SELECT COUNT(*) FROM trips t LEFT JOIN cars c ON t.license_plate = c.license_plate WHERE COALESCE(c.user_id, t.organizer_id) = $1',
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

// Change password for logged-in user
const changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const userRes = await db.query('SELECT password FROM users WHERE user_id = $1', [userId]);
    if (!userRes.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
    }

    const isMatch = await bcrypt.compare(String(current_password), userRes.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(new_password), salt);

    await db.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, userId]);

    res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
  changePassword,
};
