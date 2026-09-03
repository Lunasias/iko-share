const db = require('../config/db');

// Check if user is driver or confirmed passenger in the trip
const checkTripAccess = async (tripId, userId) => {
  const tripRes = await db.query('SELECT driver_id FROM trips WHERE id = $1', [tripId]);
  if (!tripRes.rows || tripRes.rows.length === 0) return false;
  if (tripRes.rows[0].driver_id === userId) return true;

  const bookingRes = await db.query(
    "SELECT id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND status = 'confirmed'",
    [tripId, userId]
  );
  return bookingRes.rows && bookingRes.rows.length > 0;
};

// Get trip chat messages
const getTripMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hasAccess = await checkTripAccess(id, userId);
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณต้องเป็นผู้ร่วมเดินทางในเที่ยวนี้จึงจะเข้าชมแชทได้' });
    }

    const messagesRes = await db.query(
      `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
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
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อความแชท: ' + (error.message || String(error)) });
  }
};

// Send message to trip group chat
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุข้อความ' });
    }

    const hasAccess = await checkTripAccess(id, userId);
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณต้องเป็นผู้ร่วมเดินทางในเที่ยวนี้จึงจะส่งข้อความได้' });
    }

    const newMsg = await db.query(
      `INSERT INTO chat_messages (trip_id, user_id, message, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id, userId, message.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'ส่งข้อความสำเร็จ',
      chatMessage: newMsg.rows && newMsg.rows[0] ? newMsg.rows[0] : null,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งข้อความ: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getTripMessages,
  sendMessage,
};
