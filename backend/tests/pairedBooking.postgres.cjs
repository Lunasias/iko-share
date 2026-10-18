// Optional integration check: node --env-file=backend/.env backend/tests/pairedBooking.postgres.cjs
// Every table is session-local. The restricted search path prevents writes to application tables.
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const { createBooking, approveBooking, cancelBooking, submitPaymentSlip, verifyPayment } = require('../src/controllers/bookingController');
const { getTripById } = require('../src/controllers/tripController');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for this optional integration check');
  const pool = db.pool;
  const client = await pool.connect();
  const originalQuery = db.query;
  try {
    await client.query('SET search_path TO pg_temp');
    await client.query(`
      CREATE TEMP TABLE trips (trip_id INT PRIMARY KEY, paired_trip_id INT, is_round_trip BOOLEAN,
        trip_status TEXT, organizer_id INT, license_plate TEXT, available_seats INT, price_seat NUMERIC,
        origin TEXT, destination TEXT, departure_time TIMESTAMPTZ, return_departure_time TIMESTAMPTZ,
        event_id INT, custom_event_name TEXT);
      CREATE TEMP TABLE cars (license_plate TEXT, user_id INT, model TEXT, capacity INT);
      CREATE TEMP TABLE users (user_id INT, name TEXT, phone TEXT, email TEXT, is_verified BOOLEAN,
        avatar_url TEXT, role TEXT, bio TEXT);
      CREATE TEMP TABLE events (event_id INT, event_name TEXT, location TEXT);
      CREATE TEMP TABLE bookings (booking_id SERIAL PRIMARY KEY, user_id INT, trip_id INT,
        booking_status TEXT, location TEXT, booking_time TIMESTAMPTZ, payment_status TEXT DEFAULT 'unpaid',
        payment_slip_url TEXT, payment_time TIMESTAMPTZ);
      CREATE TEMP TABLE notifications (user_id INT, title TEXT, message TEXT, type TEXT, link_url TEXT,
        is_read BOOLEAN, created_at TIMESTAMPTZ);
      INSERT INTO users(user_id, name) VALUES (1, 'Driver'), (2, 'Passenger');
      INSERT INTO trips VALUES
        (22,23,true,'active',1,NULL,2,380,'A','B',NOW()+INTERVAL '1 day',NOW()+INTERVAL '2 days',NULL,NULL),
        (23,22,true,'active',1,NULL,2,380,'B','A',NOW()+INTERVAL '2 days',NOW()+INTERVAL '1 day',NULL,NULL);
    `);
    db.query = (sql, params) => client.query(sql, params);
    db.pool = { connect: async () => ({ query: db.query, release() {} }) };
    const call = async (handler, userId, body = {}, id = 22) => {
      const res = { code: 200, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
      await handler({ user: { user_id: userId }, params: { id }, body }, res);
      assert.ok(res.code < 400, JSON.stringify(res.body));
      return res.body;
    };
    await call(createBooking, 2, { trip_id: 22 });
    await call(createBooking, 2, { trip_id: 23 });
    assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM bookings')).rows[0].count, 2);
    let detail = await call(getTripById, 2);
    assert.equal(Number(detail.trip.price_seat), 760);
    assert.equal(detail.passengers.length, 1);
    const bookingId = detail.passengers[0].booking_id;
    await call(approveBooking, 1, {}, bookingId);
    assert.ok((await client.query('SELECT available_seats FROM trips')).rows.every(t => t.available_seats === 1));
    await call(submitPaymentSlip, 2, { slip_url: '/test-receipt.png' }, bookingId);
    await call(verifyPayment, 1, { status: 'paid' }, bookingId);
    detail = await call(getTripById, 2);
    assert.equal(detail.passengers[0].payment_status, 'paid');
    assert.equal(detail.passengers[0].round_trip_complete, true);
    await call(cancelBooking, 2);
    assert.ok((await client.query('SELECT available_seats FROM trips')).rows.every(t => t.available_seats === 2));
    await call(createBooking, 2, { trip_id: 22 });
    await client.query('UPDATE trips SET available_seats = 0 WHERE trip_id = 23');
    detail = await call(getTripById, 2);
    const pending = detail.passengers.find(b => b.booking_status === 'รอการอนุมัติ');
    const res = { status(code) { this.code = code; return this; }, json(value) { this.body = value; } };
    await approveBooking({ user: { user_id: 1 }, params: { id: pending.booking_id }, body: {} }, res);
    assert.equal(res.code, 400);
    assert.equal((await client.query('SELECT available_seats FROM trips WHERE trip_id = 22')).rows[0].available_seats, 2);
    assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM bookings WHERE booking_status = 'รอการอนุมัติ'")).rows[0].count, 2);
    console.log('PostgreSQL integration passed: single booking action, both legs, total fare, one receipt, cancellation and atomic rollback.');
  } finally {
    db.query = originalQuery;
    db.pool = pool;
    client.release(true);
    await pool.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
