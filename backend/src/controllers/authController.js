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
       RETURNING user_id, name, email, phone, role, avatar_url, bio, created_at`,
      [name, email, hashedPassword, phone || null, validRole, bio || 'ยังไม่มีคำอธิบายตัวตน']
    );

    const user = newUser.rows && newUser.rows[0] ? newUser.rows[0] : { user_id: 1, name, email, phone, role: validRole, bio: bio || 'ยังไม่มีคำอธิบายตัวตน' };
    const token = jwt.sign({ id: user.user_id, user_id: user.user_id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

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

    const token = jwt.sign({ id: user.user_id, user_id: user.user_id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

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
    const userRes = await db.query('SELECT user_id, name, email, phone, role, avatar_url, bio, created_at FROM users WHERE user_id = $1', [userId]);

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.json({ success: true, user: req.user });
    }

    res.json({ success: true, user: userRes.rows[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของระบบ: ' + (error.message || String(error)) });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
