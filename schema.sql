-- Schema definition for Iko Share (Neon PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  car_info VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  driver_id INT REFERENCES users(id) ON DELETE CASCADE,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  seats INT NOT NULL DEFAULT 4,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  car_model VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  seats_booked INT DEFAULT 1,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Admin User (Password: admin123456)
INSERT INTO users (name, email, password, phone, role)
VALUES ('ผู้ดูแลระบบ Iko Share', 'admin@ikoshare.com', '$2a$10$wO7vE1kY6u/7uVlQpUeD7.E2z6k/u9L5b.xO7nO9qO1n1uO8P8m4C', '0812345678', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed Sample User (Password: user123456)
INSERT INTO users (name, email, password, phone, role)
VALUES ('สมชาย ใจดี', 'somchai@example.com', '$2a$10$wO7vE1kY6u/7uVlQpUeD7.E2z6k/u9L5b.xO7nO9qO1n1uO8P8m4C', '0898765432', 'user')
ON CONFLICT (email) DO NOTHING;
