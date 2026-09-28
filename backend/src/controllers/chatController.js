const db = require('../config/db');

// In-memory registry for Server-Sent Events (SSE) connections per trip
// Map<tripId, Set<Response>>
const tripSSEClients = new Map();

const registerSSEClient = (tripId, res) => {
  const tid = String(tripId);
  if (!tripSSEClients.has(tid)) {
    tripSSEClients.set(tid, new Set());
  }
  tripSSEClients.get(tid).add(res);
};

const removeSSEClient = (tripId, res) => {
  const tid = String(tripId);
  if (tripSSEClients.has(tid)) {
    tripSSEClients.get(tid).delete(res);
    if (tripSSEClients.get(tid).size === 0) {
      tripSSEClients.delete(tid);
    }
  }
};

const broadcastMessage = (tripId, messageData) => {
  const tid = String(tripId);
  const clients = tripSSEClients.get(tid);
  if (!clients || clients.size === 0) return;

  const payload = `event: new_message\ndata: ${JSON.stringify(messageData)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (err) {
      removeSSEClient(tid, client);
    }
  }
};

// Access Check: Room head (car owner / organizer) OR Passengers with status 'จองแล้ว'
const checkTripAccess = async (tripId, userId) => {
  const tripRes = await db.query(
    `SELECT COALESCE(c.user_id, t.organizer_id) as driver_id
     FROM trips t
     LEFT JOIN cars c ON t.license_plate = c.license_plate
     WHERE t.trip_id = $1`,
    [tripId]
  );
  if (!tripRes.rows || tripRes.rows.length === 0) return false;
  if (tripRes.rows[0].driver_id === userId) return true;

  const bookingRes = await db.query(
    "SELECT booking_id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status = 'จองแล้ว'",
    [tripId, userId]
  );
  return bookingRes.rows && bookingRes.rows.length > 0;
};

// Get trip chat messages
const getTripMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id || req.user.id;

    const hasAccess = await checkTripAccess(id, userId);
    if (!hasAccess && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'เฉพาะคนขับและผู้โดยสารที่มีสถานะจองแล้วเท่านั้นที่สามารถแชทได้' });
    }

    const messagesRes = await db.query(
      `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.user_id
       WHERE cm.trip_id = $1
       ORDER BY cm.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      messages: messagesRes.rows || [],
    });
  } catch (error) {
    console.error('Get trip messages error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อความ: ' + (error.message || String(error)) });
  }
};

// Real-time SSE Stream endpoint for trip chat messages
const streamTripMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id || req.user.id;

    const hasAccess = await checkTripAccess(id, userId);
    if (!hasAccess && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'เฉพาะคนขับและผู้โดยสารที่มีสถานะจองแล้วเท่านั้นที่สามารถเชื่อมต่อแชทได้' });
    }

    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    // Register client for this trip
    registerSSEClient(id, res);

    // Initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ tripId: id, status: 'connected', timestamp: new Date() })}\n\n`);

    // Keepalive heartbeat every 20 seconds to prevent proxy / lambda timeout
    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (err) {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      removeSSEClient(id, res);
    });
  } catch (error) {
    console.error('SSE Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อสตรีมข้อความ' });
    }
  }
};

// Send message to trip group chat and broadcast in real-time
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id || req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุข้อความ' });
    }

    const hasAccess = await checkTripAccess(id, userId);
    if (!hasAccess && !req.user.is_admin && req.user.email !== 'admin@ikoshare.com') {
      return res.status(403).json({ success: false, message: 'เฉพาะคนขับและผู้โดยสารที่มีสถานะจองแล้วเท่านั้นที่สามารถส่งข้อความได้' });
    }

    const newMsg = await db.query(
      `INSERT INTO chat_messages (trip_id, user_id, message, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id, userId, message.trim()]
    );

    const msgId = newMsg.rows[0].message_id;

    // Fetch full sender details to match frontend requirements
    const fullMsgRes = await db.query(
      `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.user_id
       WHERE cm.message_id = $1`,
      [msgId]
    );

    const fullMessage = fullMsgRes.rows && fullMsgRes.rows[0] ? fullMsgRes.rows[0] : newMsg.rows[0];

    // Real-time Broadcast to all connected clients in this trip!
    broadcastMessage(id, fullMessage);

    res.status(201).json({
      success: true,
      message: 'ส่งข้อความสำเร็จ',
      chatMessage: fullMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งข้อความ: ' + (error.message || String(error)) });
  }
};

// Report inappropriate message / profanity (surfaces in the admin dashboard)
const reportMessage = async (req, res) => {
  try {
    const { id } = req.params; // message_id
    const reporterId = req.user.user_id || req.user.id;
    const { reason } = req.body;

    const messageRes = await db.query(
      `SELECT cm.message_id, cm.user_id, cm.trip_id, cm.message
       FROM chat_messages cm
       WHERE cm.message_id = $1`,
      [id]
    );

    if (!messageRes.rows || messageRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อความที่ต้องการรายงาน (อาจถูกลบไปแล้ว)' });
    }

    const chatMessage = messageRes.rows[0];

    if (Number(chatMessage.user_id) === Number(reporterId)) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถรายงานข้อความของตัวเองได้' });
    }

    const duplicateRes = await db.query(
      'SELECT report_id FROM chat_reports WHERE message_id = $1 AND reporter_id = $2',
      [id, reporterId]
    );

    if (duplicateRes.rows && duplicateRes.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'คุณได้รายงานข้อความนี้ไปยังแอดมินแล้ว ระบบได้รับเรื่องเรียบร้อย' });
    }

    const newReport = await db.query(
      `INSERT INTO chat_reports (message_id, reporter_id, reason, status, created_at)
       VALUES ($1, $2, $3, 'รอดำเนินการ', NOW())
       RETURNING *`,
      [id, reporterId, reason || 'ข้อความไม่เหมาะสม / คำหยาบคาย']
    );

    res.status(201).json({
      success: true,
      message: 'ส่งรายงานข้อความไม่เหมาะสมไปยังแอดมินเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลความปลอดภัยของชุมชน',
      report: newReport.rows && newReport.rows[0] ? newReport.rows[0] : null,
    });
  } catch (error) {
    console.error('Report message error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งรายงาน: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getTripMessages,
  streamTripMessages,
  sendMessage,
  reportMessage,
};
