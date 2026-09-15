const db = require('./db');

// Safe, idempotent schema synchronisation for Neon PostgreSQL.
// Every statement uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so it can run
// on every server start (including Vercel cold starts) without destroying data.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
     user_id SERIAL PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     email VARCHAR(100) UNIQUE NOT NULL,
     phone VARCHAR(15),
     role VARCHAR(20) NOT NULL DEFAULT 'Passenger' CHECK (role IN ('Driver', 'Passenger', 'Both', 'Admin')),
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
];

// Safety net: any extra column referenced by the app but missing in an old database.
const COLUMN_PATCHES = [
  ['users', 'avatar_url', 'TEXT'],
  ['users', 'bio', "TEXT DEFAULT 'ยังไม่มีคำอธิบายตัวตน'"],
  ['cars', 'capacity', 'INT NOT NULL DEFAULT 4'],
  ['events', 'category', 'VARCHAR(50)'],
  ['trips', 'custom_event_name', 'VARCHAR(255)'],
  ['trips', 'driver_personality', 'VARCHAR(255)'],
  ['trips', 'passenger_requirements', 'VARCHAR(255)'],
  ['trips', 'trip_status', "VARCHAR(20) NOT NULL DEFAULT 'active'"],
  ['trip_memories', 'caption', 'TEXT'],
];

// Older databases were created with CHECK (role IN ('Driver','Passenger','Both')),
// which silently blocks the 'Admin' role the application checks for. Drop it and
// recreate it including 'Admin'.
const CONSTRAINT_FIXES = [
  `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`,
  `ALTER TABLE users ADD CONSTRAINT users_role_check
     CHECK (role IN ('Driver', 'Passenger', 'Both', 'Admin'))`,
];

const SEEDS = [
  {
    // The admin account is seeded with the real 'Admin' role so every
    // `role === 'Admin'` check in the app works without the email fallback.
    text: `INSERT INTO users (name, email, phone, role, password, bio)
           VALUES ('ผู้ดูแลระบบ Iko Share', 'admin@ikoshare.com', '0812345678', 'Admin',
                   '$2a$10$jXfex0Jbq9RNZ13L9WtVP.CPLPy2caVaEtPLBRKLD4xOqMgq39Nce',
                   'ผู้ดูแลระบบส่วนกลาง ยินดีให้บริการผู้ใช้งานทุกคนครับ')
           ON CONFLICT (email) DO UPDATE SET role = 'Admin'`,
    params: [],
  },
  {
    text: `INSERT INTO events (event_name, location, event_date, category)
           SELECT 'มหกรรมคอนเสิร์ตดนตรีในสวน', 'สวนลุมพินี กรุงเทพฯ', NOW() + INTERVAL '7 days', 'Concert'
           WHERE NOT EXISTS (
             SELECT 1 FROM events WHERE event_name = 'มหกรรมคอนเสิร์ตดนตรีในสวน'
           )`,
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
