const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

try {
  require('dotenv').config();
} catch (e) {
  // Safe dotenv initialization
}

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const carRoutes = require('./routes/carRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const profileRoutes = require('./routes/profileRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const { ensureSchema, runMigrations } = require('./config/migrate');

const app = express();

// Security and middleware (keep 10mb for existing Base64 photo uploads)
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint (also self-heals a missing schema, e.g. on Vercel cold start)
app.get('/api/health', async (req, res) => {
  const migration = await ensureSchema();
  res.json({
    status: 'ok',
    service: 'Iko Share API',
    database: migration.success ? 'ready' : 'not-ready',
    migrationError: migration.success ? undefined : migration.error,
    timestamp: new Date(),
  });
});

// Explicit endpoint to create / repair tables in Neon PostgreSQL.
// Protect it with a separate deployment secret; it must never be public.
app.post('/api/migrate', async (req, res) => {
  const migrationSecret = process.env.MIGRATION_SECRET;
  if (!migrationSecret || req.get('x-migration-secret') !== migrationSecret) {
    return res.status(404).json({ success: false, message: 'ไม่พบ API Route ที่ระบุ' });
  }
  try {
    const result = await runMigrations();
    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: 'ยังไม่ได้ตั้งค่า DATABASE_URL จึงไม่สามารถซิงค์ฐานข้อมูลได้',
        ...result,
      });
    }
    res.json({ success: true, message: 'ซิงค์โครงสร้างฐานข้อมูลเรียบร้อยแล้ว', ...result });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถซิงค์โครงสร้างฐานข้อมูลได้' });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'ไม่พบ API Route ที่ระบุ' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
      : (err.message ? String(err.message) : 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'),
  });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  // Ensure the Neon schema exists before accepting traffic, then start listening.
  ensureSchema().finally(() => {
    app.listen(PORT, () => {
      console.log(`Iko Share Backend Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
