const db = require('../config/db');

// Helper to create notifications from other controllers
const createNotification = async (userId, title, message, type = 'general', linkUrl = null) => {
  try {
    const res = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link_url, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
       RETURNING *`,
      [userId, title, message, type, linkUrl]
    );
    return res.rows[0];
  } catch (err) {
    console.warn('Failed to insert notification:', err.message);
    return null;
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  const userId = req.user.user_id || req.user.id;

  try {
    let result = await db.query(
      `SELECT notification_id, user_id, title, message, type, link_url, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );

    // If brand new user with 0 notifications, seed welcoming starter notifications
    if (result.rows.length === 0) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url, is_read, created_at)
         VALUES
         ($1, 'ยินดีต้อนรับสู่ Iko Share! 🚗', 'เริ่มต้นค้นหาเพื่อนร่วมทางหรือเปิดเส้นทางใหม่ได้เลยวันนี้ เพื่อการเดินทางที่คุ้มค่าและรักษ์โลก', 'welcome', '/trips', FALSE, NOW() - INTERVAL '1 hour'),
         ($1, '🛡️ รับสัญลักษณ์ความน่าเชื่อถือ', 'ยื่นส่งเอกสารยืนยันตัวตนในหน้าโปรไฟล์เพื่อรับตราสัญลักษณ์ Trust Badge เพิ่มความมั่นใจให้เพื่อนร่วมทาง', 'verification', '/profile', FALSE, NOW())`,
        [userId]
      );

      result = await db.query(
        `SELECT notification_id, user_id, title, message, type, link_url, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 30`,
        [userId]
      );
    }

    const unreadCount = result.rows.filter((n) => !n.is_read).length;

    return res.json({
      success: true,
      notifications: result.rows,
      unreadCount,
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { id } = req.params;

  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2`,
      [id, userId]
    );
    return res.json({ success: true, message: 'ทำเครื่องหมายว่าอ่านแล้ว' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต' });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  const userId = req.user.user_id || req.user.id;

  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [userId]
    );
    return res.json({ success: true, message: 'ทำเครื่องหมายอ่านแล้วทั้งหมด' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต' });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { id } = req.params;

  try {
    await db.query(
      `DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2`,
      [id, userId]
    );
    return res.json({ success: true, message: 'ลบการแจ้งเตือนเรียบร้อย' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบ' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
