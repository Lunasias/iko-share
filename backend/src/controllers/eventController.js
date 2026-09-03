const db = require('../config/db');

// Get all events
const getEvents = async (req, res) => {
  try {
    const eventsRes = await db.query('SELECT * FROM events ORDER BY event_date ASC');
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
};
