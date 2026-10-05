const db = require('../config/db');

// Helper to remove events that have no associated trips
const cleanupOrphanEvents = async () => {
  try {
    await db.query(`
      DELETE FROM events e
      WHERE NOT EXISTS (
        SELECT 1 FROM trips t
        WHERE t.event_id = e.event_id
           OR (t.custom_event_name IS NOT NULL AND LOWER(TRIM(t.custom_event_name)) = LOWER(TRIM(e.event_name)))
      )
    `);
  } catch (err) {
    console.warn('Cleanup orphan events warning:', err.message);
  }
};

// Get all events (Only events that currently have active trips)
const getEvents = async (req, res) => {
  try {
    // 1. Purge orphan events where all corresponding trips were deleted
    await cleanupOrphanEvents();

    // 2. Auto-sync any custom_event_name on existing active trips into the events table
    await db.query(`
      INSERT INTO events (event_name, location, event_date, category)
      SELECT DISTINCT TRIM(t.custom_event_name), t.destination, t.departure_time, 'Custom'
      FROM trips t
      WHERE t.custom_event_name IS NOT NULL
        AND TRIM(t.custom_event_name) != ''
        AND NOT EXISTS (
          SELECT 1 FROM events e WHERE LOWER(TRIM(e.event_name)) = LOWER(TRIM(t.custom_event_name))
        )
    `).catch(() => {});

    // 3. Backfill event_id for trips missing event_id
    await db.query(`
      UPDATE trips t
      SET event_id = e.event_id
      FROM events e
      WHERE t.event_id IS NULL
        AND t.custom_event_name IS NOT NULL
        AND LOWER(TRIM(t.custom_event_name)) = LOWER(TRIM(e.event_name))
    `).catch(() => {});

    // 4. Query only events that currently have associated trips
    const eventsRes = await db.query(`
      SELECT e.*
      FROM events e
      WHERE EXISTS (
        SELECT 1 FROM trips t
        WHERE t.event_id = e.event_id
           OR (t.custom_event_name IS NOT NULL AND LOWER(TRIM(t.custom_event_name)) = LOWER(TRIM(e.event_name)))
      )
      ORDER BY e.event_date ASC
    `);

    // No-cache header so deletions in trips reflect instantly in the event dropdown
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ success: true, events: eventsRes.rows || [] });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลอีเวนต์: ' + (error.message || String(error)) });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    const { event_name, location, event_date, category } = req.body;

    if (!event_name || !location || !event_date) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่ออีเวนต์ สถานที่ และวันที่จัดงาน' });
    }

    const newEvent = await db.query(
      `INSERT INTO events (event_name, location, event_date, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [event_name.trim(), location.trim(), event_date, category || 'General']
    );

    res.status(201).json({
      success: true,
      message: 'สร้างอีเวนต์ใหม่สำเร็จ',
      event: newEvent.rows && newEvent.rows[0] ? newEvent.rows[0] : null,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถสร้างอีเวนต์ได้: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getEvents,
  createEvent,
  cleanupOrphanEvents,
};
