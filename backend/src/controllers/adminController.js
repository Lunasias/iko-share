const db = require('../config/db');

const getAdminStats = async (req, res) => {
  try {
    const [
      usersCount,
      carsCount,
      eventsCount,
      tripsCount,
      bookingsCount,
      reportCount,
      supportCount,
      vCount,
      pendingCarsCount,
      recentUsers,
      recentTrips,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM cars'),
      db.query('SELECT COUNT(*) FROM events'),
      db.query('SELECT COUNT(*) FROM trips'),
      db.query("SELECT COUNT(*) FROM bookings WHERE booking_status = 'จองแล้ว'"),
      db.query("SELECT COUNT(*) FROM chat_reports WHERE status = 'รอดำเนินการ'").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM support_requests WHERE status = 'รอดำเนินการ'").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM verification_requests WHERE status = 'รอดำเนินการ'").catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) FROM cars WHERE verification_status = 'รอดำเนินการ'").catch(() => ({ rows: [{ count: 0 }] })),
      db.query('SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'),
      db.query(
        `SELECT t.*, c.model as car_model, u.name as driver_name
         FROM trips t
         LEFT JOIN cars c ON t.license_plate = c.license_plate
         LEFT JOIN users u ON u.user_id = COALESCE(c.user_id, t.organizer_id)
         ORDER BY t.created_at DESC LIMIT 5`
      ),
    ]);

    res.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0]?.count || 0),
        totalCars: parseInt(carsCount.rows[0]?.count || 0),
        pendingCars: parseInt(pendingCarsCount.rows[0]?.count || 0),
        totalEvents: parseInt(eventsCount.rows[0]?.count || 0),
        totalTrips: parseInt(tripsCount.rows[0]?.count || 0),
        totalBookings: parseInt(bookingsCount.rows[0]?.count || 0),
        totalReports: parseInt(reportCount.rows[0]?.count || 0),
        totalSupportRequests: parseInt(supportCount.rows[0]?.count || 0),
        totalVerificationRequests: parseInt(vCount.rows[0]?.count || 0),
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
    const result = await db.query('SELECT user_id, name, email, phone, role, is_admin, is_verified, created_at FROM users ORDER BY user_id DESC');
    res.json({ success: true, users: result.rows || [] });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + (error.message || String(error)) });
  }
};

const updateUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified: isVerified } = req.body;
    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'is_verified must be a boolean.' });
    }
    const result = await db.query(
      'UPDATE users SET is_verified = $1 WHERE user_id = $2 RETURNING user_id, name, email, phone, role, is_admin, is_verified, created_at',
      [isVerified, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้นี้ในระบบ' });
    }
    res.json({
      success: true,
      message: isVerified ? 'ยืนยันตัวตนสำเร็จ (เปิดสัญลักษณ์ความน่าเชื่อถือแล้ว)' : 'ยกเลิกการยืนยันตัวตนสำเร็จ',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update user verification error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะความน่าเชื่อถือ: ' + (error.message || String(error)) });
  }
};

const updateUserAdminAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin: isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') return res.status(400).json({ success: false, message: 'is_admin must be a boolean.' });
    if (Number(id) === (req.user.user_id || req.user.id)) return res.status(400).json({ success: false, message: 'You cannot change your own administrator access.' });
    const result = await db.query('UPDATE users SET is_admin = $1 WHERE user_id = $2 RETURNING user_id, name, email, phone, role, is_admin, is_verified, created_at', [isAdmin, id]);
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

const getAdminVerificationRequests = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT vr.*, u.name as user_name, u.email as user_email, u.phone as user_phone, 
             u.role as user_role, u.is_verified as current_is_verified, u.avatar_url as user_avatar
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.user_id
      ORDER BY 
        CASE WHEN vr.status = 'รอดำเนินการ' THEN 0 ELSE 1 END,
        vr.created_at DESC
    `);
    res.json({ success: true, requests: result.rows || [] });
  } catch (error) {
    console.error('Get admin verification requests error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงคำขอยืนยันตัวตน: ' + (error.message || String(error)) });
  }
};

const reviewVerificationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply } = req.body;
    const reviewerId = req.user?.user_id || req.user?.id;

    if (!['อนุมัติแล้ว', 'ปฏิเสธ'].includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะต้องเป็น อนุมัติแล้ว หรือ ปฏิเสธ' });
    }

    const checkReq = await db.query('SELECT * FROM verification_requests WHERE request_id = $1', [id]);
    if (!checkReq.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำขอนี้' });
    }
    const targetUserId = checkReq.rows[0].user_id;

    const updateReq = await db.query(
      `UPDATE verification_requests 
       SET status = $1, admin_reply = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE request_id = $4 RETURNING *`,
      [status, admin_reply || (status === 'อนุมัติแล้ว' ? 'เอกสารถูกต้อง ยืนยันตัวตนสำเร็จ' : 'เอกสารไม่ตรงตามเกณฑ์'), reviewerId, id]
    );

    // If approved, update user is_verified to true
    if (status === 'อนุมัติแล้ว') {
      await db.query('UPDATE users SET is_verified = TRUE WHERE user_id = $1', [targetUserId]);
    } else {
      // If rejected and no other approved verification exists, revert is_verified
      const otherApproved = await db.query(
        "SELECT 1 FROM verification_requests WHERE user_id = $1 AND status = 'อนุมัติแล้ว' AND request_id != $2",
        [targetUserId, id]
      );
      if (!otherApproved.rows.length) {
        await db.query('UPDATE users SET is_verified = FALSE WHERE user_id = $1', [targetUserId]);
      }
    }

    res.json({
      success: true,
      message: status === 'อนุมัติแล้ว' ? 'อนุมัติคำขอและเปิด Trust Badge ให้ผู้ใช้เรียบร้อยแล้ว' : 'ปฏิเสธคำขอและส่งเหตุผลเรียบร้อยแล้ว',
      request: updateReq.rows[0],
    });
  } catch (error) {
    console.error('Review verification request error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบคำขอ: ' + (error.message || String(error)) });
  }
};

const getAdminPdpaRequests = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pr.*, u.name as current_user_name, u.role as current_user_role
      FROM pdpa_requests pr
      LEFT JOIN users u ON pr.user_id = u.user_id
      ORDER BY 
        CASE WHEN pr.status = 'รอดำเนินการ' THEN 0 WHEN pr.status = 'กำลังดำเนินการ' THEN 1 ELSE 2 END,
        pr.created_at DESC
    `);
    res.json({ success: true, requests: result.rows || [] });
  } catch (error) {
    console.error('Get admin PDPA requests error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงคำร้อง PDPA: ' + (error.message || String(error)) });
  }
};

const updateAdminPdpaRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply } = req.body;
    const resolverId = req.user?.user_id || req.user?.id;

    if (!['รอดำเนินการ', 'กำลังดำเนินการ', 'ดำเนินการแล้วเสร็จ', 'ปฏิเสธคำขอ'].includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
    }

    const updateRes = await db.query(
      `UPDATE pdpa_requests
       SET status = $1, admin_reply = COALESCE($2, admin_reply), resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
       WHERE request_id = $4 RETURNING *`,
      [status, admin_reply, resolverId, id]
    );

    if (!updateRes.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการคำร้อง PDPA นี้' });
    }

    res.json({
      success: true,
      message: 'อัปเดตสถานะคำร้องขอใช้สิทธิ PDPA เรียบร้อยแล้ว',
      request: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Update admin PDPA request error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตคำร้อง PDPA: ' + (error.message || String(error)) });
  }
};

const deleteAdminPdpaRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM pdpa_requests WHERE request_id = $1', [id]);
    res.json({ success: true, message: 'ลบรายการคำร้อง PDPA เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete admin PDPA request error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบคำร้อง: ' + (error.message || String(error)) });
  }
};

// ---------------------------------------------------------------------------
// Car Registrations & License Plate Verifications
// ---------------------------------------------------------------------------
const getAdminCars = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, 
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone, u.avatar_url as owner_avatar,
             v.name as reviewer_name
      FROM cars c
      LEFT JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users v ON c.verified_by = v.user_id
      ORDER BY 
        CASE WHEN c.verification_status = 'รอดำเนินการ' THEN 0 ELSE 1 END,
        c.created_at DESC
    `);
    res.json({ success: true, cars: result.rows || [] });
  } catch (error) {
    console.error('Get admin cars error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรถยนต์: ' + (error.message || String(error)) });
  }
};

const reviewCarRegistration = async (req, res) => {
  try {
    const { plate } = req.params;
    const { status, admin_reply } = req.body;
    const reviewerId = req.user?.user_id || req.user?.id;

    if (!['อนุมัติแล้ว', 'ปฏิเสธ'].includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะต้องเป็น อนุมัติแล้ว หรือ ปฏิเสธ' });
    }

    const checkCar = await db.query('SELECT * FROM cars WHERE license_plate = $1', [plate]);
    if (!checkCar.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลรถยนต์ทะเบียนนี้ในระบบ' });
    }

    const car = checkCar.rows[0];
    const targetUserId = car.user_id;

    const defaultReply = status === 'อนุมัติแล้ว' 
      ? 'ภาพถ่ายป้ายทะเบียนชัดเจนและถูกต้อง ได้รับการอนุมัติแล้ว' 
      : 'ภาพถ่ายป้ายทะเบียนไม่ชัดเจนหรือไม่ถูกต้องตามเกณฑ์ความปลอดภัย';

    const updateCar = await db.query(
      `UPDATE cars 
       SET verification_status = $1, admin_reply = $2, verified_by = $3, verified_at = CURRENT_TIMESTAMP
       WHERE license_plate = $4 RETURNING *`,
      [status, admin_reply ? admin_reply.trim() : defaultReply, reviewerId, plate]
    );

    // If approved, ensure user has driver/both role
    if (status === 'อนุมัติแล้ว') {
      const userRes = await db.query('SELECT role FROM users WHERE user_id = $1', [targetUserId]);
      if (userRes.rows.length && userRes.rows[0].role === 'Passenger') {
        await db.query("UPDATE users SET role = 'Both' WHERE user_id = $1", [targetUserId]);
      }
    }

    // Insert notification to car owner
    try {
      const notifTitle = status === 'อนุมัติแล้ว' ? 'การลงทะเบียนรถยนต์ได้รับการอนุมัติ 🚗✅' : 'การลงทะเบียนรถยนต์ไม่ผ่านการอนุมัติ ⚠️';
      const notifMsg = status === 'อนุมัติแล้ว'
        ? `รถยนต์ทะเบียน ${plate} (${car.model}) ได้รับการอนุมัติจากผู้ดูแลระบบเรียบร้อยแล้ว คุณสามารถสร้างทริป carpool ได้ทันที`
        : `รถยนต์ทะเบียน ${plate} (${car.model}) ไม่ผ่านการอนุมัติ: ${admin_reply ? admin_reply.trim() : defaultReply}`;

      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES ($1, $2, $3, 'car_verification', '/cars')`,
        [targetUserId, notifTitle, notifMsg]
      );
    } catch (notifErr) {
      console.warn('Failed to insert car verification notification:', notifErr.message);
    }

    res.json({
      success: true,
      message: status === 'อนุมัติแล้ว' ? 'อนุมัติการลงทะเบียนรถยนต์เรียบร้อยแล้ว' : 'ปฏิเสธการลงทะเบียนรถยนต์เรียบร้อยแล้ว',
      car: updateCar.rows[0],
    });
  } catch (error) {
    console.error('Review car registration error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบรถ: ' + (error.message || String(error)) });
  }
};

const deleteAdminCar = async (req, res) => {
  try {
    const { plate } = req.params;
    await db.query('DELETE FROM cars WHERE license_plate = $1', [plate]);
    res.json({ success: true, message: 'ลบข้อมูลรถยนต์ออกจากระบบเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete admin car error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบรถยนต์: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUserVerification,
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
  getAdminVerificationRequests,
  reviewVerificationRequest,
  getAdminPdpaRequests,
  updateAdminPdpaRequest,
  deleteAdminPdpaRequest,
  getAdminCars,
  reviewCarRegistration,
  deleteAdminCar,
};
