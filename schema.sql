-- ER Diagram Aligned Schema for Iko Share (Neon PostgreSQL) with Bio Column

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
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  available_seats INT NOT NULL DEFAULT 4,
  price_seat NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
  booking_status VARCHAR(20) NOT NULL DEFAULT 'จองแล้ว' CHECK (booking_status IN ('จองแล้ว', 'ยกเลิกแล้ว')),
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

CREATE TABLE IF NOT EXISTS reviews (
  review_id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(trip_id) ON DELETE CASCADE,
  reviewer_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  target_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Admin User (Password: admin123456)
INSERT INTO users (name, email, phone, role, password, bio)
VALUES ('ผู้ดูแลระบบ Iko Share', 'admin@ikoshare.com', '0812345678', 'Both', '$2a$10$wO7vE1kY6u/7uVlQpUeD7.E2z6k/u9L5b.xO7nO9qO1n1uO8P8m4C', 'ผู้ดูแลระบบส่วนกลาง ยินดีให้บริการผู้ใช้งานทุกคนครับ')
ON CONFLICT (email) DO NOTHING;

-- Seed Sample Event
INSERT INTO events (event_name, location, event_date, category)
VALUES ('มหกรรมคอนเสิร์ตดนตรีในสวน', 'สวนลุมพินี กรุงเทพฯ', NOW() + INTERVAL '7 days', 'Concert')
ON CONFLICT DO NOTHING;
