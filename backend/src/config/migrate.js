const db = require('./db');

// Safe, idempotent schema synchronisation for Supabase PostgreSQL.
// Every statement uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so it can run
// on every server start (including Vercel cold starts) without destroying data.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
     user_id SERIAL PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     email VARCHAR(100) UNIQUE NOT NULL,
     phone VARCHAR(15),
     role VARCHAR(20) NOT NULL DEFAULT 'Passenger' CHECK (role IN ('Driver', 'Passenger', 'Both')),
     is_admin BOOLEAN NOT NULL DEFAULT FALSE,
     password VARCHAR(255) NOT NULL,
     avatar_url TEXT,
     bio TEXT DEFAULT 'ยังไม่มีคำอธิบายตัวตน',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS cars (
     license_plate VARCHAR(50) PRIMARY KEY,
     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     model VARCHAR(100) NOT NULL,
     capacity INT NOT NULL DEFAULT 4
   )`,

  `CREATE TABLE IF NOT EXISTS events (
     event_id SERIAL PRIMARY KEY,
     event_name VARCHAR(150) NOT NULL,
     location VARCHAR(255) NOT NULL,
     event_date TIMESTAMP WITH TIME ZONE NOT NULL,
     category VARCHAR(50)
   )`,

  `CREATE TABLE IF NOT EXISTS trips (
     trip_id SERIAL PRIMARY KEY,
     license_plate VARCHAR(50) REFERENCES cars(license_plate) ON DELETE CASCADE,
     event_id INT REFERENCES events(event_id) ON DELETE SET NULL,
     origin VARCHAR(255) NOT NULL,
     destination VARCHAR(255) NOT NULL,
     departure_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
     available_seats INT NOT NULL DEFAULT 4,
     price_seat NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
     driver_personality VARCHAR(255),
     passenger_requirements VARCHAR(255),
     trip_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (trip_status IN ('active', 'completed', 'cancelled')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  // The column that caused: column t.custom_event_name does not exist
  `ALTER TABLE trips ADD COLUMN IF NOT EXISTS custom_event_name VARCHAR(255)`,
  `ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_type VARCHAR(30) NOT NULL DEFAULT 'carpool'`,
  `ALTER TABLE trips ADD COLUMN IF NOT EXISTS organizer_id INT REFERENCES users(user_id) ON DELETE CASCADE`,
  `ALTER TABLE trips ALTER COLUMN license_plate DROP NOT NULL`,
  `UPDATE trips SET organizer_id = c.user_id FROM cars c WHERE trips.license_plate = c.license_plate AND trips.organizer_id IS NULL`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_trip_type_check') THEN ALTER TABLE trips ADD CONSTRAINT trips_trip_type_check CHECK (trip_type IN ('carpool', 'public_transport', 'find_driver')); END IF; END $$`,

  `CREATE TABLE IF NOT EXISTS bookings (
     booking_id SERIAL PRIMARY KEY,
     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
     booking_status VARCHAR(20) NOT NULL DEFAULT 'รอการอนุมัติ' CHECK (booking_status IN ('รอการอนุมัติ', 'จองแล้ว', 'ปฏิเสธ', 'ยกเลิกแล้ว')),
     location VARCHAR(255),
     booking_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
     message_id SERIAL PRIMARY KEY,
     trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     message TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS chat_reports (
     report_id SERIAL PRIMARY KEY,
     message_id INT REFERENCES chat_messages(message_id) ON DELETE CASCADE,
     reporter_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     reason TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS reviews (
     review_id SERIAL PRIMARY KEY,
     trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
     reviewer_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     target_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
     comment TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS trip_memories (
     memory_id SERIAL PRIMARY KEY,
     trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     photo_url TEXT NOT NULL,
     caption TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  // "ลืมรหัสผ่าน / ขอลบบัญชี" — a support conversation that reaches the admin dashboard.
  `CREATE TABLE IF NOT EXISTS support_requests (
     request_id SERIAL PRIMARY KEY,
     user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
     name VARCHAR(100),
     email VARCHAR(100),
     request_type VARCHAR(50) NOT NULL DEFAULT 'forgot_password',
     message TEXT NOT NULL,
     status VARCHAR(20) NOT NULL DEFAULT 'รอดำเนินการ',
     admin_reply TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     resolved_at TIMESTAMP WITH TIME ZONE
   )`,

  `CREATE TABLE IF NOT EXISTS uploaded_images (
     image_id VARCHAR(64) PRIMARY KEY,
     filename VARCHAR(255),
     mime_type VARCHAR(100) NOT NULL,
     data BYTEA NOT NULL,
     size_bytes INT NOT NULL,
     created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS verification_requests (
     request_id SERIAL PRIMARY KEY,
     user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
     id_card_number VARCHAR(50),
     full_name VARCHAR(150),
     document_type VARCHAR(50) NOT NULL DEFAULT 'id_card',
     document_url TEXT NOT NULL,
     additional_notes TEXT,
     status VARCHAR(20) NOT NULL DEFAULT 'รอดำเนินการ',
     admin_reply TEXT,
     reviewed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
     reviewed_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS pdpa_requests (
     request_id SERIAL PRIMARY KEY,
     user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
     requester_name VARCHAR(150) NOT NULL,
     requester_email VARCHAR(150) NOT NULL,
     requester_phone VARCHAR(50),
     right_type VARCHAR(50) NOT NULL,
     details TEXT NOT NULL,
     identification_proof TEXT,
     status VARCHAR(20) NOT NULL DEFAULT 'รอดำเนินการ',
     admin_reply TEXT,
     resolved_by INT REFERENCES users(user_id) ON DELETE SET NULL,
     resolved_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,
];

// Safety net: any extra column referenced by the app but missing in an old database.
const COLUMN_PATCHES = [
  ['users', 'avatar_url', 'TEXT'],
  ['users', 'bio', "TEXT DEFAULT 'ยังไม่มีคำอธิบายตัวตน'"],
  ['users', 'is_admin', 'BOOLEAN NOT NULL DEFAULT FALSE'],
  ['users', 'is_verified', 'BOOLEAN NOT NULL DEFAULT FALSE'],
  ['cars', 'capacity', 'INT NOT NULL DEFAULT 4'],
  ['events', 'category', 'VARCHAR(50)'],
  ['trips', 'custom_event_name', 'VARCHAR(255)'],
  ['trips', 'driver_personality', 'VARCHAR(255)'],
  ['trips', 'passenger_requirements', 'VARCHAR(255)'],
  ['trips', 'trip_status', "VARCHAR(20) NOT NULL DEFAULT 'active'"],
  ['trips', 'distance_km', 'NUMERIC(8, 2)'],
  ['trips', 'duration_text', 'VARCHAR(100)'],
  ['trip_memories', 'caption', 'TEXT'],
  ['chat_reports', 'status', "VARCHAR(20) NOT NULL DEFAULT 'รอดำเนินการ'"],
  ['chat_reports', 'resolved_at', 'TIMESTAMP WITH TIME ZONE'],
  ['chat_reports', 'resolved_by', 'INT'],
  ['bookings', 'payment_status', "VARCHAR(30) NOT NULL DEFAULT 'unpaid'"],
  ['bookings', 'payment_slip_url', 'TEXT'],
  ['bookings', 'payment_time', 'TIMESTAMP WITH TIME ZONE'],
  ['cars', 'car_image_url', 'TEXT'],
  ['cars', 'verification_status', "VARCHAR(20) NOT NULL DEFAULT 'รอดำเนินการ'"],
  ['cars', 'admin_reply', 'TEXT'],
  ['cars', 'verified_by', 'INT'],
  ['cars', 'verified_at', 'TIMESTAMP WITH TIME ZONE'],
  ['cars', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'],
  ['cars', 'consent_pdpa', 'BOOLEAN DEFAULT TRUE'],
  ['cars', 'consent_at', 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'],
];

// Administration is a permission separate from the user's travel role.
const CONSTRAINT_FIXES = [
  `UPDATE cars SET verification_status = 'อนุมัติแล้ว' WHERE verification_status IS NULL OR verification_status = ''`,
  `CREATE INDEX IF NOT EXISTS idx_cars_verification_status ON cars (verification_status)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE`,
  `UPDATE users SET is_admin = TRUE, role = 'Both' WHERE role = 'Admin' OR email = 'admin@ikoshare.com'`,
  `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`,
  `ALTER TABLE users ADD CONSTRAINT users_role_check
     CHECK (role IN ('Driver', 'Passenger', 'Both'))`,

  // Room head (trip owner) can remove a member from the party → dedicated booking status.
  `ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check`,
  `ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check
     CHECK (booking_status IN ('รอการอนุมัติ', 'จองแล้ว', 'ปฏิเสธ', 'ยกเลิกแล้ว', 'ถูกนำออกจากตี้'))`,

  // One review per member per trip: repeated submissions become an edit of the same review.
  `DELETE FROM reviews a USING reviews b
     WHERE a.review_id < b.review_id
       AND a.trip_id = b.trip_id
       AND a.reviewer_id = b.reviewer_id
       AND a.target_user_id = b.target_user_id`,
  `CREATE UNIQUE INDEX IF NOT EXISTS reviews_trip_reviewer_target_key
     ON reviews (trip_id, reviewer_id, target_user_id)`,

  // The same user should only be able to report the same message once.
  `DELETE FROM chat_reports a USING chat_reports b
     WHERE a.report_id < b.report_id
       AND a.message_id = b.message_id
       AND a.reporter_id = b.reporter_id`,
  `CREATE UNIQUE INDEX IF NOT EXISTS chat_reports_message_reporter_key
     ON chat_reports (message_id, reporter_id)`,

  // Performance query indexes for trips, bookings, and chat messages
  `CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON trips (departure_time ASC)`,
  `CREATE INDEX IF NOT EXISTS idx_trips_event_id ON trips (event_id)`,
  `CREATE INDEX IF NOT EXISTS idx_trips_organizer_id ON trips (organizer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_trips_trip_status ON trips (trip_status)`,
  `CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings (trip_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_user_trip ON bookings (trip_id, user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_trip_id ON chat_messages (trip_id, created_at ASC)`,
  `CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests (status)`,
  `CREATE INDEX IF NOT EXISTS idx_pdpa_requests_user ON pdpa_requests (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_pdpa_requests_status ON pdpa_requests (status)`,

  `CREATE TABLE IF NOT EXISTS notifications (
     notification_id SERIAL PRIMARY KEY,
     user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
     title VARCHAR(255) NOT NULL,
     message TEXT NOT NULL,
     type VARCHAR(50) NOT NULL DEFAULT 'general',
     link_url VARCHAR(255),
     is_read BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC)`,
];

const SEEDS = [
  {
    text: `INSERT INTO users (name, email, phone, role, is_admin, password, bio)
           VALUES ('ผู้ดูแลระบบ Iko Share', 'admin@ikoshare.com', '0812345678', 'Both', TRUE,
                   '$2a$10$jXfex0Jbq9RNZ13L9WtVP.CPLPy2caVaEtPLBRKLD4xOqMgq39Nce',
                   'ผู้ดูแลระบบส่วนกลาง ยินดีให้บริการผู้ใช้งานทุกคนครับ')
           ON CONFLICT (email) DO UPDATE SET role = 'Both', is_admin = TRUE`,
    params: [],
  },

  {
    text: `INSERT INTO events (event_name, location, event_date, category)
           SELECT DISTINCT TRIM(t.custom_event_name), t.destination, t.departure_time, 'Custom'
           FROM trips t
           WHERE t.custom_event_name IS NOT NULL
             AND TRIM(t.custom_event_name) != ''
             AND NOT EXISTS (
               SELECT 1 FROM events e WHERE LOWER(TRIM(e.event_name)) = LOWER(TRIM(t.custom_event_name))
             )`,
    params: [],
  },
  {
    text: `UPDATE trips t
           SET event_id = e.event_id
           FROM events e
           WHERE t.event_id IS NULL
             AND t.custom_event_name IS NOT NULL
             AND LOWER(TRIM(t.custom_event_name)) = LOWER(TRIM(e.event_name))`,
    params: [],
  },
];

let migrationPromise = null;

const runMigrationsInternal = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('[migrate] DATABASE_URL is not set — skipping schema synchronisation.');
    return { success: false, skipped: true };
  }

  for (const statement of STATEMENTS) {
    await db.query(statement);
  }

  for (const [table, column, definition] of COLUMN_PATCHES) {
    await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  }

  for (const statement of CONSTRAINT_FIXES) {
    await db.query(statement);
  }

  for (const seed of SEEDS) {
    await db.query(seed.text, seed.params);
  }

  console.log('[migrate] Schema synchronised successfully (custom_event_name + Admin role ensured).');
  return { success: true };
};

// Runs at most once per process; concurrent callers share the same promise.
const runMigrations = () => {
  if (!migrationPromise) {
    migrationPromise = runMigrationsInternal().catch((error) => {
      migrationPromise = null; // allow a retry on the next request / cold start
      console.error('[migrate] Schema synchronisation failed:', error.message || error);
      throw error;
    });
  }
  return migrationPromise;
};

// Non-throwing variant used by the server bootstrap.
const ensureSchema = async () => {
  try {
    return await runMigrations();
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
};

module.exports = { runMigrations, ensureSchema, STATEMENTS, COLUMN_PATCHES, CONSTRAINT_FIXES };
