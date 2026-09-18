const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const ALLOWED_REQUEST_TYPES = ['forgot_password', 'delete_account', 'other'];

// The visitor is usually logged out on the login screen, so the token is optional.
const readOptionalUserId = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return decoded.user_id || decoded.id || null;
  } catch (err) {
    return null;
  }
};

// POST /api/support/requests — public: "ลืมรหัสผ่าน" opens a chat to the admin
const createSupportRequest = async (req, res) => {
  try {
    const { name, email, message, request_type: requestType } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุอีเมลที่ใช้สมัครสมาชิก' });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาพิมพ์ข้อความถึงแอดมิน' });
    }

    const normalizedEmail = String(email).trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    const normalizedType = ALLOWED_REQUEST_TYPES.includes(requestType) ? requestType : 'forgot_password';
    const userId = readOptionalUserId(req);

    const existingUser = await db.query('SELECT user_id, name FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);

    const newRequest = await db.query(
      `INSERT INTO support_requests (user_id, name, email, request_type, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'รอดำเนินการ', NOW())
       RETURNING *`,
      [
        userId || (existingUser.rows[0] ? existingUser.rows[0].user_id : null),
        name ? String(name).trim() : (existingUser.rows[0] ? existingUser.rows[0].name : null),
        normalizedEmail,
        normalizedType,
        String(message).trim(),
      ]
    );

    res.status(201).json({
      success: true,
      message: 'ส่งข้อความถึงแอดมินเรียบร้อยแล้ว แอดมินจะตรวจสอบและติดต่อกลับโดยเร็วที่สุด',
      request: newRequest.rows && newRequest.rows[0] ? newRequest.rows[0] : null,
      accountFound: Boolean(existingUser.rows.length),
    });
  } catch (error) {
    console.error('Create support request error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งข้อความถึงแอดมิน: ' + (error.message || String(error)) });
  }
};

// GET /api/support/requests/:id?email=... — public status check (email acts as a light token)
const getSupportRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุอีเมลเพื่อตรวจสอบสถานะ' });
    }

    const result = await db.query(
      `SELECT request_id, email, request_type, message, status, admin_reply, created_at, resolved_at
       FROM support_requests
       WHERE request_id = $1 AND LOWER(email) = LOWER($2)`,
      [id, String(email).trim()]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบคำขอที่ตรงกับข้อมูลนี้' });
    }

    res.json({ success: true, request: result.rows[0] });
  } catch (error) {
    console.error('Get support request status error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะคำขอ: ' + (error.message || String(error)) });
  }
};

module.exports = {
  createSupportRequest,
  getSupportRequestStatus,
};
