const db = require('../config/db');

/**
 * Submit verification request with proof documents
 * POST /api/verification/request
 */
const submitVerificationRequest = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
    }

    const {
      document_type = 'id_card',
      full_name,
      id_card_number,
      document_url,
      additional_notes,
    } = req.body;

    if (!document_url || !String(document_url).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปภาพหลักฐานยืนยันตัวตน' });
    }

    // Check if user is already verified
    const userRes = await db.query('SELECT is_verified, name FROM users WHERE user_id = $1', [userId]);
    if (!userRes.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้ในระบบ' });
    }

    if (userRes.rows[0].is_verified) {
      return res.status(400).json({ success: false, message: 'บัญชีของคุณได้รับการยืนยันตัวตนเรียบร้อยแล้ว' });
    }

    // Check if there is already a pending verification request
    const pendingRes = await db.query(
      "SELECT request_id, created_at FROM verification_requests WHERE user_id = $1 AND status = 'รอดำเนินการ'",
      [userId]
    );

    if (pendingRes.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'คุณมีคำขอยืนยันตัวตนที่อยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบแล้ว กรุณารอผลการตรวจสอบ',
        existing_request_id: pendingRes.rows[0].request_id,
      });
    }

    const insertResult = await db.query(
      `INSERT INTO verification_requests 
        (user_id, document_type, full_name, id_card_number, document_url, additional_notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'รอดำเนินการ')
       RETURNING *`,
      [
        userId,
        document_type,
        full_name || userRes.rows[0].name,
        id_card_number ? String(id_card_number).trim() : null,
        document_url,
        additional_notes ? String(additional_notes).trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'ส่งหลักฐานยืนยันตัวตนสำเร็จแล้ว เจ้าหน้าที่จะตรวจสอบและอนุมัติตราสัญลักษณ์ความน่าเชื่อถือโดยเร็ว',
      request: insertResult.rows[0],
    });
  } catch (error) {
    console.error('Submit verification request error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งคำขอยืนยันตัวตน: ' + (error.message || String(error)),
    });
  }
};

/**
 * Get current user's verification status and history
 * GET /api/verification/my-status
 */
const getMyVerificationStatus = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
    }

    const userRes = await db.query('SELECT is_verified FROM users WHERE user_id = $1', [userId]);
    const isVerified = Boolean(userRes.rows[0]?.is_verified);

    const requestsRes = await db.query(
      `SELECT request_id, document_type, full_name, id_card_number, document_url,
              additional_notes, status, admin_reply, reviewed_at, created_at
       FROM verification_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      is_verified: isVerified,
      latest_request: requestsRes.rows[0] || null,
      history: requestsRes.rows || [],
    });
  } catch (error) {
    console.error('Get my verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถานะการยืนยันตัวตน: ' + (error.message || String(error)),
    });
  }
};

module.exports = {
  submitVerificationRequest,
  getMyVerificationStatus,
};
