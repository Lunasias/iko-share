const { test } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const { createTrip } = require('../src/controllers/tripController');
const { calculateOperatingCost } = require('../src/services/routeService');

test('round-trip creation stores both dates and full fare in one trip, even for an older client', async () => {
  const original = db.query;
  const inserts = [];
  db.query = async (sql, params) => {
    assert.match(sql, /INSERT INTO trips/);
    inserts.push(params);
    return { rows: [{ trip_id: 99, price_seat: params[9], is_round_trip: params[14], return_departure_time: params[15] }] };
  };
  try {
    let response;
    const res = { status(code) { this.code = code; return this; }, json(value) { response = value; } };
    const departure = new Date(Date.now() + 86400000).toISOString();
    const returning = new Date(Date.now() + 172800000).toISOString();
    await createTrip({ user: { user_id: 1 }, body: {
      trip_type: 'public_transport', origin: 'A', destination: 'B', available_seats: 3,
      price_seat: 761, departure_time: departure, return_departure_time: returning,
      is_round_trip: true, create_paired_return: true,
    } }, res);
    assert.equal(res.code, 201);
    assert.equal(inserts.length, 1);
    assert.equal(response.trip.price_seat, 761);
    assert.equal(response.trip.is_round_trip, true);
    assert.equal(response.trip.return_departure_time, returning);
    assert.equal(response.pairedTrip, undefined);
  } finally { db.query = original; }
});

test('invalid or missing return dates cannot create any trip', async () => {
  const original = db.query;
  db.query = async () => { assert.fail('Invalid return schedules must not write to the database'); };
  try {
    const departure = new Date(Date.now() + 86400000).toISOString();
    for (const returning of [null, 'invalid', departure, new Date().toISOString()]) {
      const res = { status(code) { this.code = code; return this; }, json() {} };
      await createTrip({ user: { user_id: 1 }, body: {
        trip_type: 'public_transport', origin: 'A', destination: 'B', available_seats: 3,
        price_seat: 100, departure_time: departure, return_departure_time: returning, is_round_trip: true,
      } }, res);
      assert.equal(res.code, 400);
    }
  } finally { db.query = original; }
});

test('one-way trips still store one fare and no return date', async () => {
  const original = db.query;
  let inserts = 0;
  db.query = async (sql, params) => {
    inserts++;
    assert.equal(params[9], 123);
    assert.equal(params[14], false);
    assert.equal(params[15], null);
    return { rows: [{ trip_id: 100 }] };
  };
  try {
    const res = { status(code) { this.code = code; return this; }, json() {} };
    await createTrip({ user: { user_id: 1 }, body: {
      trip_type: 'public_transport', origin: 'A', destination: 'B', available_seats: 3,
      price_seat: 123, departure_time: new Date(Date.now() + 86400000).toISOString(),
    } }, res);
    assert.equal(res.code, 201);
    assert.equal(inserts, 1);
  } finally { db.query = original; }
});

test('one-way input is doubled exactly once for a round trip', async () => {
  const original = db.query;
  let inserts = 0;
  db.query = async (sql, params) => {
    inserts++;
    assert.equal(params[9], 760);
    return { rows: [{ trip_id: 101, price_seat: params[9] }] };
  };
  try {
    let result;
    const res = { status(code) { this.code = code; return this; }, json(value) { result = value; } };
    await createTrip({ user: { user_id: 1 }, body: {
      trip_type: 'public_transport', origin: 'A', destination: 'B', available_seats: 3,
      one_way_price_seat: 380, price_seat: 760, is_round_trip: true,
      departure_time: new Date(Date.now() + 86400000).toISOString(),
      return_departure_time: new Date(Date.now() + 172800000).toISOString(),
    } }, res);
    assert.equal(res.code, 201);
    assert.equal(result.trip.price_seat, 760);
    assert.equal(inserts, 1);
  } finally { db.query = original; }
});

test('recommended round-trip fares and minimums are twice their one-way values', () => {
  for (const distance of [0, 8, 28.2, 40, 436.8]) {
    for (const seats of [1, 3, 4]) {
      const single = calculateOperatingCost(distance, seats, false);
      const round = calculateOperatingCost(distance, seats, true);
      assert.equal(round.recommendedSeatPrice, single.recommendedSeatPrice * 2);
      assert.equal(round.reasonableMinPrice, single.reasonableMinPrice * 2);
    }
  }
});
