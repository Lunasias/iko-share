const db = require('../config/db');

// Get cars for current user
const getMyCars = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const carsRes = await db.query(
      `SELECT license_plate, user_id, model, capacity, car_image_url, 
              verification_status, admin_reply, verified_by, verified_at, created_at
       FROM cars 
       WHERE user_id = $1 
       ORDER BY created_at DESC, license_plate ASC`,
      [userId]
    );
    res.json({ success: true, cars: carsRes.rows || [] });
  } catch (error) {
    console.error('Get my cars error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรถ: ' + (error.message || String(error)) });
  }
};

// Add new car with license plate photo for admin verification
const addCar = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { license_plate, model, capacity, car_image_url, consent_pdpa } = req.body;

    if (!license_plate || !model || !capacity) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลรถให้ครบถ้วน (ทะเบียนรถ, รุ่นรถ, ความจุที่นั่ง)' });
    }

    if (!car_image_url || !String(car_image_url).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาถ่ายภาพหรืออัปโหลดรูปถ่ายป้ายทะเบียนรถ เพื่อส่งให้แอดมินตรวจสอบ' });
    }

    if (consent_pdpa === false) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาให้ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) ในการจัดเก็บและตรวจสอบภาพถ่ายยานพาหนะ',
      });
    }

    const checkCar = await db.query('SELECT license_plate FROM cars WHERE LOWER(license_plate) = LOWER($1)', [license_plate.trim()]);
    if (checkCar.rows && checkCar.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ทะเบียนรถนี้ถูกลงทะเบียนไว้แล้วในระบบ' });
    }

    const newCar = await db.query(
      `INSERT INTO cars (license_plate, user_id, model, capacity, car_image_url, verification_status, consent_pdpa, consent_at, created_at)
       VALUES ($1, $2, $3, $4, $5, 'รอดำเนินการ', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [license_plate.trim(), userId, model.trim(), parseInt(capacity), car_image_url.trim()]
    );

    // Automatically ensure user role is updated to 'Driver' or 'Both'
    const userRes = await db.query('SELECT role FROM users WHERE user_id = $1', [userId]);
    if (userRes.rows && userRes.rows[0]?.role === 'Passenger') {
      await db.query("UPDATE users SET role = 'Both' WHERE user_id = $1", [userId]);
    }

    // Insert in-app notification to the user
    try {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES ($1, $2, $3, 'car_registration', '/cars')`,
        [
          userId,
          'ส่งข้อมูลลงทะเบียนรถยนต์เรียบร้อย 🚗',
          `ระบบได้รับข้อมูลและภาพถ่ายป้ายทะเบียน ${license_plate.trim()} (${model.trim()}) แล้ว อยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ`
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to insert notification for car registration:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนรถยนต์สำเร็จ ข้อมูลและภาพป้ายทะเบียนถูกส่งให้แอดมินตรวจสอบความถูกต้องแล้ว',
      car: newCar.rows && newCar.rows[0] ? newCar.rows[0] : null,
    });
  } catch (error) {
    console.error('Add car error:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถลงทะเบียนรถได้: ' + (error.message || String(error)) });
  }
};

// Delete car
const deleteCar = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { license_plate } = req.params;

    const checkOwner = await db.query('SELECT * FROM cars WHERE license_plate = $1 AND user_id = $2', [license_plate, userId]);
    if (!checkOwner.rows || checkOwner.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'ไม่พบข้อมูลรถ หรือคุณไม่มีสิทธิ์ในการลบรถคันนี้' });
    }

    // Check if car has active trips
    const activeTrips = await db.query(
      "SELECT trip_id FROM trips WHERE license_plate = $1 AND trip_status = 'active'",
      [license_plate]
    );
    if (activeTrips.rows && activeTrips.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบรถคันนี้ได้เนื่องจากยังมีทริปเดินทางที่กำลังเปิดให้บริการอยู่' });
    }

    await db.query('DELETE FROM cars WHERE license_plate = $1', [license_plate]);

    res.json({ success: true, message: 'ลบข้อมูลรถยนต์เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบรถ: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getMyCars,
  addCar,
  deleteCar,
};
