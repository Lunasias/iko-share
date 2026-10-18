const { test } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const { withPairedBooking } = require('../src/services/pairedBookingService');
const { combinePassengers } = require('../src/services/roundTripView');

function fixture({ seats = [2, 2], bookings = [] } = {}) {
  let state = { legs: [
    { trip_id: 22, paired_trip_id: 23, is_round_trip: true, trip_status: 'active', driver_id: 1, available_seats: seats[0] },
    { trip_id: 23, paired_trip_id: 22, is_round_trip: true, trip_status: 'active', driver_id: 1, available_seats: seats[1] },
  ], bookings: structuredClone(bookings) };
  let snapshot;
  const sqls = [];
  const query = async (sql, params) => {
    sqls.push(sql);
    if (sql === 'BEGIN') { snapshot = structuredClone(state); return {}; }
    if (sql === 'ROLLBACK') { state = snapshot; return {}; }
    if (sql === 'COMMIT') return {};
    if (sql.includes('INSERT INTO notifications')) return { rows: [] };
    if (sql.includes('ORDER BY t.trip_id FOR UPDATE')) return { rows: structuredClone(state.legs) };
    if (sql.startsWith('SELECT * FROM bookings')) return { rows: structuredClone(state.bookings.filter(b => b.user_id === params[1])) };
    if (sql.startsWith('SELECT t.*, b.user_id')) return { rows: [{ ...state.legs[0], passenger_id: 2 }] };
    if (sql.startsWith('SELECT t.* FROM trips')) return { rows: [state.legs[0]] };
    if (sql.includes('INSERT INTO bookings')) {
      const booking = { booking_id: state.bookings.length + 1, user_id: params[0], trip_id: params[1], booking_status: params[2], payment_status: 'unpaid' };
      state.bookings.push(booking);
      return { rows: [structuredClone(booking)] };
    }
    if (sql.startsWith('UPDATE trips SET available_seats')) {
      const leg = state.legs.find(t => t.trip_id === params[0]);
      leg.available_seats += sql.includes('+ 1') ? 1 : -1;
      return {};
    }
    if (sql.startsWith('UPDATE bookings SET booking_status')) {
      if (sql.includes("= 'จองแล้ว'")) state.bookings.find(b => b.booking_id === params[0]).booking_status = 'จองแล้ว';
      else state.bookings.find(b => b.booking_id === params[1]).booking_status = params[0];
      return {};
    }
    if (sql.startsWith('UPDATE bookings SET payment_slip_url')) {
      for (const b of state.bookings.filter(b => params[1].includes(b.booking_id))) Object.assign(b, { payment_slip_url: params[0], payment_status: 'pending_verification' });
      return {};
    }
    if (sql.startsWith('UPDATE bookings SET payment_status')) {
      for (const b of state.bookings.filter(b => params[1].includes(b.booking_id))) b.payment_status = params[0];
      return {};
    }
    assert.fail(`Unexpected SQL: ${sql}`);
  };
  return { query, sqls, state: () => state };
}

async function run(f, action, user = 2, body = {}) {
  const originalQuery = db.query;
  const originalPool = db.pool;
  db.query = f.query;
  db.pool = { connect: async () => ({ query: f.query, release() {} }) };
  const res = { status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  try {
    await withPairedBooking(action, () => assert.fail('Unexpected fallback'))({ user: { user_id: user }, params: { id: 22 }, body: { trip_id: 22, ...body } }, res);
    return res;
  } finally { db.query = originalQuery; db.pool = originalPool; }
}

test('one request books both legacy legs and repeated requests do not duplicate bookings', async () => {
  const f = fixture();
  assert.equal((await run(f, 'book')).code, 201);
  assert.equal(f.state().bookings.length, 2);
  assert.deepEqual(f.state().bookings.map(b => b.trip_id), [22, 23]);
  assert.equal((await run(f, 'book')).code, 201);
  assert.equal(f.state().bookings.length, 2);
});

test('a full return leg prevents both booking requests', async () => {
  const f = fixture({ seats: [2, 0] });
  assert.equal((await run(f, 'book')).code, 400);
  assert.equal(f.state().bookings.length, 0);
  assert.ok(f.sqls.includes('ROLLBACK'));
});

test('approval and cancellation change seats on both legs exactly once', async () => {
  const f = fixture();
  await run(f, 'book');
  assert.equal((await run(f, 'approve', 1)).code, 200);
  assert.deepEqual(f.state().legs.map(t => t.available_seats), [1, 1]);
  await run(f, 'approve', 1);
  assert.deepEqual(f.state().legs.map(t => t.available_seats), [1, 1]);
  assert.equal((await run(f, 'cancel')).code, 200);
  assert.deepEqual(f.state().legs.map(t => t.available_seats), [2, 2]);
  assert.ok(f.state().bookings.every(b => b.booking_status === 'ยกเลิกแล้ว'));
});

test('approval rolls back the outbound leg if the return leg is full', async () => {
  const f = fixture();
  await run(f, 'book');
  f.state().legs[1].available_seats = 0;
  assert.equal((await run(f, 'approve', 1)).code, 400);
  assert.equal(f.state().legs[0].available_seats, 2);
  assert.ok(f.state().bookings.every(b => b.booking_status === 'รอการอนุมัติ'));
});

test('one receipt and verification apply to both approved journeys', async () => {
  const f = fixture();
  await run(f, 'book');
  await run(f, 'approve', 1);
  assert.equal((await run(f, 'slip', 2, { slip_url: '/slip.png' })).code, 200);
  assert.ok(f.state().bookings.every(b => b.payment_slip_url === '/slip.png'));
  assert.equal((await run(f, 'verify', 1, { status: 'paid' })).code, 200);
  assert.ok(f.state().bookings.every(b => b.payment_status === 'paid'));
  const passengers = combinePassengers(f.state().bookings, true);
  assert.equal(passengers.length, 1);
  assert.equal(passengers[0].round_trip_complete, true);
  assert.equal(passengers[0].payment_status, 'paid');
});

test('a different user cannot approve or upload a receipt', async () => {
  const f = fixture();
  await run(f, 'book');
  assert.equal((await run(f, 'approve', 3)).code, 403);
  assert.equal((await run(f, 'slip', 3, { slip_url: '/slip.png' })).code, 403);
});
