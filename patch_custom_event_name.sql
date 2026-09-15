-- ============================================================
-- Iko Share — Neon PostgreSQL patch
-- Fixes: column t.custom_event_name does not exist
-- Safe to run repeatedly (idempotent). Run in Neon SQL Editor.
-- ============================================================

-- 1) The missing column on trips (the actual cause of the bug)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS custom_event_name VARCHAR(255);

-- 2) Bring any older trips table up to date with the app code
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_personality VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS passenger_requirements VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'ยังไม่มีคำอธิบายตัวตน';
ALTER TABLE cars  ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 4;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- 3) Create any table that is still missing
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  role VARCHAR(20) NOT NULL DEFAULT 'Passenger' CHECK (role IN ('Driver', 'Passenger', 'Both')),
  password VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT 'ยังไม่มีคำอธิบายตัวตน',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
  license_plate VARCHAR(50) PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  model VARCHAR(100) NOT NULL,
  capacity INT NOT NULL DEFAULT 4
);

CREATE TABLE IF NOT EXISTS events (
  event_id SERIAL PRIMARY KEY,
  event_name VARCHAR(150) NOT NULL,
  location VARCHAR(255) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS trips (
  trip_id SERIAL PRIMARY KEY,
  license_plate VARCHAR(50) REFERENCES cars(license_plate) ON DELETE CASCADE,
  event_id INT REFERENCES events(event_id) ON DELETE SET NULL,
  custom_event_name VARCHAR(255),
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  available_seats INT NOT NULL DEFAULT 4,
  price_seat NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  driver_personality VARCHAR(255),
  passenger_requirements VARCHAR(255),
  trip_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (trip_status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
  booking_status VARCHAR(20) NOT NULL DEFAULT 'รอการอนุมัติ' CHECK (booking_status IN ('รอการอนุมัติ', 'จองแล้ว', 'ปฏิเสธ', 'ยกเลิกแล้ว')),
  location VARCHAR(255),
  booking_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_reports (
  report_id SERIAL PRIMARY KEY,
  message_id INT REFERENCES chat_messages(message_id) ON DELETE CASCADE,
  reporter_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
  reviewer_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  target_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_memories (
  memory_id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4) Seed data
INSERT INTO users (name, email, phone, role, password, bio)
VALUES ('ผู้ดูแลระบบ Iko Share', 'admin@ikoshare.com', '0812345678', 'Both',
        '$2a$10$wO7vE1kY6u/7uVlQpUeD7.E2z6k/u9L5b.xO7nO9qO1n1uO8P8m4C',
        'ผู้ดูแลระบบส่วนกลาง ยินดีให้บริการผู้ใช้งานทุกคนครับ')
ON CONFLICT (email) DO NOTHING;

INSERT INTO events (event_name, location, event_date, category)
SELECT 'มหกรรมคอนเสิร์ตดนตรีในสวน', 'สวนลุมพินี กรุงเทพฯ', NOW() + INTERVAL '7 days', 'Concert'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE event_name = 'มหกรรมคอนเสิร์ตดนตรีในสวน');

-- 5) Verify — must return one row
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trips' AND column_name = 'custom_event_name';
