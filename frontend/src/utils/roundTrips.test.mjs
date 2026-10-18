import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupRoundTrips } from './roundTrips.js';

test('legacy round-trip pairs display once with their combined fare regardless of order', () => {
  const outbound = { trip_id: 22, paired_trip_id: 23, is_round_trip: true, price_seat: '380.00', departure_time: '2026-10-20T20:30:00+07:00' };
  const inbound = { trip_id: 23, paired_trip_id: 22, is_round_trip: true, price_seat: '380.00', departure_time: '2026-10-21T20:00:00+07:00' };
  const single = { trip_id: 21, price_seat: '50.00' };
  for (const trips of [[outbound, single, inbound], [inbound, single, outbound]]) {
    const result = groupRoundTrips(trips);
    assert.equal(result.length, 2);
    const round = result.find(t => t.trip_id === 22);
    assert.equal(round.price_seat, '760.00');
    assert.equal(round.return_departure_time, inbound.departure_time);
    assert.equal(outbound.price_seat, '380.00');
  }
  assert.deepEqual(groupRoundTrips([inbound]), [inbound]);
});
