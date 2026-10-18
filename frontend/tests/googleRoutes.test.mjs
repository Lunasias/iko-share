import test from 'node:test';
import assert from 'node:assert/strict';
import { computeGoogleRoutes, loadGoogleMaps, routeSummary } from '../src/services/googleRoutes.js';

test('summary uses route distance and normalizes duration across an hour', () => {
  assert.deepEqual(routeSummary({ distanceMeters: 367000, durationMillis: 313 * 60000 }), {
    distanceKm: 367, durationText: '5 ชม. 13 นาที',
  });
  assert.deepEqual(routeSummary({ distanceMeters: 12345, durationMillis: 3599000 }), {
    distanceKm: 12.3, durationText: '1 ชม.',
  });
  assert.deepEqual(routeSummary(null), { distanceKm: null, durationText: '' });
});

test('routes retain the exact instances used for drawing and request alternatives', async () => {
  const originalWindow = globalThis.window;
  const primary = { path: [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }], distanceMeters: 367000, durationMillis: 18780000 };
  const alternative = { ...primary, distanceMeters: 371200 };
  let request;
  globalThis.window = { google: { maps: { importLibrary: async (name) => name === 'routes' ? {
    Route: { computeRoutes: async (value) => { request = value; return { routes: [primary, alternative] }; } },
  } : {} } } };
  try {
    const routes = await computeGoogleRoutes('สจล.ชุมพร', 'บางขัน');
    assert.equal(routes[0], primary);
    assert.equal(routes[1], alternative);
    assert.equal(routeSummary(routes[1]).distanceKm, 371.2);
    assert.equal(request.origin, 'สจล.ชุมพร, ประเทศไทย');
    assert.equal(request.destination, 'บางขัน, ประเทศไทย');
    assert.equal(request.computeAlternativeRoutes, true);
    assert.equal(request.travelMode, 'DRIVING');
    assert.ok(request.fields.includes('path') && request.fields.includes('distanceMeters') && request.fields.includes('durationMillis'));
  } finally { globalThis.window = originalWindow; }
});

test('missing geometry and provider failures never produce fallback estimates', async () => {
  const originalWindow = globalThis.window;
  let response = { routes: [{ distanceMeters: 367000, durationMillis: 18780000 }] };
  globalThis.window = { google: { maps: { importLibrary: async (name) => name === 'routes' ? {
    Route: { computeRoutes: async () => { if (response instanceof Error) throw response; return response; } },
  } : {} } } };
  try {
    await assert.rejects(computeGoogleRoutes('A', 'B'), /ไม่พบเส้นทาง/);
    response = new Error('network failure');
    await assert.rejects(computeGoogleRoutes('A', 'B'), /network failure/);
  } finally { globalThis.window = originalWindow; }
});

test('missing API key reports configuration error', async () => {
  const originalWindow = globalThis.window;
  globalThis.window = {};
  try { await assert.rejects(loadGoogleMaps(), /ยังไม่ได้ตั้งค่า Google Maps/); }
  finally { globalThis.window = originalWindow; }
});
