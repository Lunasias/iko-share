const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, รหัสผ่าน)' });
    }

    const checkUser = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (checkUser.rows && checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
    }

    const validRole = ['Driver', 'Passenger', 'Both'].includes(role) ? role : 'Passenger';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      `INSERT INTO users (name, email, password, phone, role, avatar_url, bio, created_at)
       VALUES ($1, $2, $3, $4, $5, NULL, $6, NOW())
       RETURNING user_id, name, email, phone, role, is_admin, is_verified, avatar_url, bio, created_at`,
      [name, email, hashedPassword, phone || null, validRole, bio || 'ยังไม่มีคำอธิบายตัวตน']
    );

    const user = newUser.rows && newUser.rows[0] ? newUser.rows[0] : { user_id: 1, name, email, phone, role: validRole, is_admin: false, is_verified: false, bio: bio || 'ยังไม่มีคำอธิบายตัวตน' };
    const token = jwt.sign({ id: user.user_id, user_id: user.user_id, email: user.email, role: user.role, is_admin: user.is_admin, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      token,
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของระบบ: ' + (error.message || String(error)) });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign({ id: user.user_id, user_id: user.user_id, email: user.email, role: user.role, is_admin: user.is_admin, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        user_id: user.user_id,
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_admin: user.is_admin,
        is_verified: user.is_verified || false,
        avatar_url: user.avatar_url,
        bio: user.bio || 'ยังไม่มีคำอธิบายตัวตน',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของระบบ: ' + (error.message || String(error)) });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const userRes = await db.query('SELECT user_id, name, email, phone, role, is_admin, is_verified, avatar_url, bio, created_at FROM users WHERE user_id = $1', [userId]);

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.json({ success: true, user: req.user });
    }

    res.json({ success: true, user: userRes.rows[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของระบบ: ' + (error.message || String(error)) });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, phone, new_password } = req.body;

    if (!email || !phone || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (อีเมล, เบอร์โทรศัพท์ที่ลงทะเบียน, รหัสผ่านใหม่)',
      });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
      });
    }

    const userRes = await db.query(
      'SELECT user_id, name, email, phone FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
      [email]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบบัญชีผู้ใช้งานที่ใช้อีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลอีกครั้ง',
      });
    }

    const user = userRes.rows[0];

    // Normalize phone numbers for comparison (match digits only)
    const inputPhoneDigits = String(phone).replace(/\D/g, '');
    const userPhoneDigits = String(user.phone || '').replace(/\D/g, '');

    if (!userPhoneDigits || inputPhoneDigits !== userPhoneDigits) {
      return res.status(400).json({
        success: false,
        message: 'เบอร์โทรศัพท์ไม่ตรงกับข้อมูลที่ลงทะเบียนไว้ในระบบ หากจำเบอร์โทรไม่ได้ กรุณาใช้ช่องทางติดต่อแอดมิน',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await db.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedPassword, user.user_id]
    );

    res.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว! สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที',
    });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน: ' + (error.message || String(error)),
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  resetPassword,
};
