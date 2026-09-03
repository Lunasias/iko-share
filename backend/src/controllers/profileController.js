const db = require('../config/db');

// Get profile & stats
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRes = await db.query(
      'SELECT id, name, email, phone, avatar_url, car_info, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
    }

    const tripsCreated = await db.query('SELECT COUNT(*) FROM trips WHERE driver_id = $1', [userId]);
    const tripsJoined = await db.query("SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status = 'confirmed'", [userId]);

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

// Update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, avatar_url, car_info } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ-นามสกุล' });
    }

    const updatedRes = await db.query(
      `UPDATE users
       SET name = $1, phone = $2, avatar_url = $3, car_info = $4
       WHERE id = $5
       RETURNING id, name, email, phone, avatar_url, car_info, role, created_at`,
      [name, phone || null, avatar_url || null, car_info || null, userId]
    );

    const user = updatedRes.rows && updatedRes.rows[0] ? updatedRes.rows[0] : { id: userId, name, phone, avatar_url, car_info };

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

module.exports = {
  getProfile,
  updateProfile,
};
