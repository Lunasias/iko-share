const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;

if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set and contain at least 32 characters in production');
}

// Development fallback keeps local startup convenient; never use it in production.
const signingSecret = JWT_SECRET || 'local-development-only-secret-change-me';

const JWT_ALGORITHM = 'HS256';
const JWT_OPTIONS = { algorithms: [JWT_ALGORITHM] };

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }

  try {
    const decoded = jwt.verify(token, signingSecret, JWT_OPTIONS);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'เซสชั่นหมดอายุหรือโทเคนไม่ถูกต้อง' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || (!req.user.is_admin && req.user.email !== 'admin@ikoshare.com')) {
    return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ในการเข้าถึงส่วนผู้ดูแลระบบ' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET: signingSecret,
};
