const db = require('../config/db');

const getAdminStats = async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const carsCount = await db.query('SELECT COUNT(*) FROM cars');
    const eventsCount = await db.query('SELECT COUNT(*) FROM events');
    const tripsCount = await db.query('SELECT COUNT(*) FROM trips');
    const bookingsCount = await db.query("SELECT COUNT(*) FROM bookings WHERE booking_status = 'จองแล้ว'");

    let pendingReports = 0;
    try {
      const reportCount = await db.query("SELECT COUNT(*) FROM chat_reports WHERE status = 'รอดำเนินการ'");
      pendingReports = parseInt(reportCount.rows[0]?.count || 0);
    } catch (e) {
      pendingReports = 0;
    }

    let pendingSupportRequests = 0;
    try {
      const supportCount = await db.query("SELECT COUNT(*) FROM support_requests WHERE status = 'รอดำเนินการ'");
      pendingSupportRequests = parseInt(supportCount.rows[0]?.count || 0);
    } catch (e) {
      pendingSupportRequests = 0;
    }

    const recentUsers = await db.query('SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    const recentTrips = await db.query(
      `SELECT t.*, c.model as car_model, u.name as driver_name
       FROM trips t
       LEFT JOIN cars c ON t.license_plate = c.license_plate
       LEFT JOIN users u ON u.user_id = COALESCE(c.user_id, t.organizer_id)
       ORDER BY t.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0]?.count || 0),
        totalCars: parseInt(carsCount.rows[0]?.count || 0),
        totalEvents: parseInt(eventsCount.rows[0]?.count || 0),
        totalTrips: parseInt(tripsCount.rows[0]?.count || 0),
        totalBookings: parseInt(bookingsCount.rows[0]?.count || 0),
        totalReports: pendingReports,
        totalSupportRequests: pendingSupportRequests,
      },
      recentUsers: recentUsers.rows || [],
      recentTrips: recentTrips.rows || [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ดูแลระบบ: ' + (error.message || String(error)) });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT user_id, name, email, phone, role, is_admin, created_at FROM users ORDER BY user_id DESC');
    res.json({ success: true, users: result.rows || [] });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + (error.message || String(error)) });
  }
};

const updateUserAdminAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin: isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') return res.status(400).json({ success: false, message: 'is_admin must be a boolean.' });
    if (Number(id) === (req.user.user_id || req.user.id)) return res.status(400).json({ success: false, message: 'You cannot change your own administrator access.' });
    const result = await db.query('UPDATE users SET is_admin = $1 WHERE user_id = $2 RETURNING user_id, name, email, phone, role, is_admin, created_at', [isAdmin, id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update admin access error:', error);
    res.status(500).json({ success: false, message: 'Unable to update administrator access.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE user_id = $1', [id]);
    res.json({ success: true, message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน: ' + (error.message || String(error)) });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM trips WHERE trip_id = $1', [id]);
    res.json({ success: true, message: 'ลบเที่ยวเดินทางสำเร็จ' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเที่ยวเดินทาง: ' + (error.message || String(error)) });
  }
};

// ---------------------------------------------------------------------------
// Chat / message reports sent by members (flag button inside the trip chat)
// ---------------------------------------------------------------------------
const getReports = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.report_id, r.message_id, r.reason, r.status, r.created_at, r.resolved_at,
              cm.message as message_text, cm.trip_id,
              reporter.name as reporter_name, reporter.email as reporter_email,
              sender.name as sender_name, sender.email as sender_email, sender.user_id as sender_id,
              t.origin, t.destination
       FROM chat_reports r
       LEFT JOIN chat_messages cm ON r.message_id = cm.message_id
       LEFT JOIN users reporter ON r.reporter_id = reporter.user_id
       LEFT JOIN users sender ON cm.user_id = sender.user_id
       LEFT JOIN trips t ON cm.trip_id = t.trip_id
       ORDER BY CASE WHEN r.status = 'รอดำเนินการ' THEN 0 ELSE 1 END, r.created_at DESC`
    );

    res.json({ success: true, reports: result.rows || [] });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายงาน: ' + (error.message || String(error)) });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['รอดำเนินการ', 'ตรวจสอบแล้ว', 'ปิดรายงาน'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะรายงานไม่ถูกต้อง' });
    }

    const resolvedAt = status === 'รอดำเนินการ' ? null : new Date().toISOString();
    const result = await db.query(
      'UPDATE chat_reports SET status = $1, resolved_at = $2, resolved_by = $3 WHERE report_id = $4 RETURNING *',
      [status, resolvedAt, req.user.user_id || req.user.id, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายงานนี้' });
    }

    res.json({ success: true, message: 'อัปเดตสถานะรายงานเรียบร้อยแล้ว', report: result.rows[0] });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตรายงาน: ' + (error.message || String(error)) });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM chat_reports WHERE report_id = $1', [id]);
    res.json({ success: true, message: 'ลบรายงานเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบรายงาน: ' + (error.message || String(error)) });
  }
};

// Admin moderation: remove the offending message (its reports cascade automatically)
const deleteReportedMessage = async (req, res) => {
  try {
    const { id } = req.params; // message_id
    const result = await db.query('DELETE FROM chat_messages WHERE message_id = $1 RETURNING message_id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อความนี้ (อาจถูกลบไปแล้ว)' });
    }
    res.json({ success: true, message: 'ลบข้อความที่ไม่เหมาะสมออกจากห้องแชทเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete reported message error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อความ: ' + (error.message || String(error)) });
  }
};

// ---------------------------------------------------------------------------
// Support requests (forgot password → chat with the admin, account deletion)
// ---------------------------------------------------------------------------
const getSupportRequests = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.user_id as matched_user_id, u.name as matched_user_name
       FROM support_requests s
       LEFT JOIN users u ON LOWER(u.email) = LOWER(s.email)
       ORDER BY CASE WHEN s.status = 'รอดำเนินการ' THEN 0 ELSE 1 END, s.created_at DESC`
    );

    res.json({ success: true, requests: result.rows || [] });
  } catch (error) {
    console.error('Get support requests error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงคำขอความช่วยเหลือ: ' + (error.message || String(error)) });
  }
};

const updateSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply: adminReply } = req.body;
    const allowed = ['รอดำเนินการ', 'กำลังดำเนินการ', 'ดำเนินการแล้ว'];

    if (status && !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะคำขอไม่ถูกต้อง' });
    }

    const result = await db.query(
      `UPDATE support_requests
       SET status = COALESCE($1, status),
           admin_reply = COALESCE($2, admin_reply),
           resolved_at = CASE WHEN COALESCE($1, status) = 'รอดำเนินการ' THEN NULL ELSE NOW() END
       WHERE request_id = $3
       RETURNING *`,
      [status || null, adminReply || null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบคำขอความช่วยเหลือนี้' });
    }

    res.json({ success: true, message: 'อัปเดตคำขอความช่วยเหลือเรียบร้อยแล้ว', request: result.rows[0] });
  } catch (error) {
    console.error('Update support request error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตคำขอ: ' + (error.message || String(error)) });
  }
};

const deleteSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM support_requests WHERE request_id = $1', [id]);
    res.json({ success: true, message: 'ลบคำขอความช่วยเหลือเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete support request error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบคำขอ: ' + (error.message || String(error)) });
  }
};

// Used by the "ลืมรหัสผ่าน → ขอลบบัญชีและสร้างใหม่" flow so the admin can
// remove the old account (the user then registers again with the same email).
const deleteUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const findUser = await db.query('SELECT user_id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (!findUser.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานที่ใช้อีเมลนี้ในระบบ' });
    }

    if (findUser.rows[0].email === 'admin@ikoshare.com') {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้' });
    }

    await db.query('DELETE FROM users WHERE user_id = $1', [findUser.rows[0].user_id]);
    await db.query(
      "UPDATE support_requests SET status = 'ดำเนินการแล้ว', resolved_at = NOW(), admin_reply = COALESCE(admin_reply, 'ลบบัญชีเดิมเรียบร้อย ผู้ใช้สามารถสมัครใหม่ได้') WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    res.json({
      success: true,
      message: `ลบบัญชี ${findUser.rows[0].email} เรียบร้อยแล้ว ผู้ใช้สามารถสมัครสมาชิกใหม่ด้วยอีเมลเดิมได้`,
    });
  } catch (error) {
    console.error('Delete user by email error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบบัญชี: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUserAdminAccess,
  deleteUser,
  deleteUserByEmail,
  deleteTrip,
  getReports,
  updateReportStatus,
  deleteReport,
  deleteReportedMessage,
  getSupportRequests,
  updateSupportRequest,
  deleteSupportRequest,
};
