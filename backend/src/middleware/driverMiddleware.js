const db = require('../config/db');

const requireDriverWithCar = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.user_id;

    // Check user role
    const userRes = await db.query('SELECT user_id, role FROM users WHERE user_id = $1', [userId]);
    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
    }

    const user = userRes.rows[0];
    if (user.role !== 'Driver' && user.role !== 'Both') {
      return res.status(403).json({ success: false, message: 'คุณต้องมีบทบาท Driver หรือ Both จึงจะเปิดเที่ยวรถได้' });
    }

    // Check if user has registered car
    const carRes = await db.query('SELECT license_plate FROM cars WHERE user_id = $1', [userId]);
    if (!carRes.rows || carRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาลงทะเบียนข้อมูลรถของคุณก่อนสร้างทริป' });
    }

    req.userCars = carRes.rows;
    next();
  } catch (error) {
    console.error('Driver verification error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์คนขับ: ' + (error.message || String(error)) });
  }
};

module.exports = {
  requireDriverWithCar,
};
