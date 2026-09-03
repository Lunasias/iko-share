const db = require('../config/db');

// Get cars for current user
const getMyCars = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const carsRes = await db.query('SELECT * FROM cars WHERE user_id = $1 ORDER BY license_plate ASC', [userId]);
    res.json({ success: true, cars: carsRes.rows || [] });
  } catch (error) {
    console.error('Get my cars error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรถ: ' + (error.message || String(error)) });
  }
};

// Add new car
const addCar = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { license_plate, model, capacity } = req.body;

    if (!license_plate || !model || !capacity) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลรถให้ครบถ้วน (ทะเบียนรถ, รุ่นรถ, ความจุที่นั่ง)' });
    }

    const checkCar = await db.query('SELECT license_plate FROM cars WHERE license_plate = $1', [license_plate.trim()]);
    if (checkCar.rows && checkCar.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ทะเบียนรถนี้ถูกลงทะเบียนไว้แล้ว' });
    }

    const newCar = await db.query(
      `INSERT INTO cars (license_plate, user_id, model, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [license_plate.trim(), userId, model.trim(), parseInt(capacity)]
    );

    // Automatically ensure user role is updated to 'Driver' or 'Both'
    const userRes = await db.query('SELECT role FROM users WHERE user_id = $1', [userId]);
    if (userRes.rows && userRes.rows[0]?.role === 'Passenger') {
      await db.query("UPDATE users SET role = 'Both' WHERE user_id = $1", [userId]);
    }

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนรถยนต์สำเร็จ',
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
