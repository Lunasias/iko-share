const db = require('../config/db');

/**
 * Valid statutory right types under Thai PDPA (Section 30-36)
 */
const PDPA_RIGHT_TITLES = {
  access_copy: 'สิทธิขอเข้าถึงและรับสำเนาข้อมูลส่วนบุคคล (Right of Access & Copy)',
  erasure: 'สิทธิขอให้ลบ ทำลาย หรือทำให้ไม่สามารถระบุตัวตน (Right to Erasure / Deletion)',
  rectification: 'สิทธิขอแก้ไขข้อมูลส่วนบุคคลให้ถูกต้อง (Right to Rectification)',
  restriction: 'สิทธิขอให้ระงับการใช้ข้อมูลชั่วคราว (Right to Restriction of Processing)',
  objection: 'สิทธิคัดค้านการประมวลผลข้อมูลส่วนบุคคล (Right to Object)',
  portability: 'สิทธิขอให้โอนย้ายข้อมูลส่วนบุคคล (Right to Data Portability)',
  withdraw_consent: 'สิทธิในการถอนความยินยอม (Right to Withdraw Consent)',
};

/**
 * 1. Export User's Personal Data in machine-readable JSON format
 * (PDPA Section 30: Right of Access, Section 31: Right to Data Portability)
 * GET /api/pdpa/my-data-export
 */
const exportMyData = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนดาวน์โหลดสำเนาข้อมูล' });
    }

    // 1. Profile
    const profileRes = await db.query(
      `SELECT user_id, name, email, phone, role, is_admin, is_verified, bio, avatar_url, created_at 
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (!profileRes.rows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    // 2. Cars
    const carsRes = await db.query(
      `SELECT license_plate, model, capacity FROM cars WHERE user_id = $1`,
      [userId]
    );

    // 3. Trips organized
    const tripsRes = await db.query(
      `SELECT trip_id, license_plate, trip_type, origin, destination, departure_time, 
              available_seats, price_seat, distance_km, duration_text, trip_status, created_at 
       FROM trips WHERE organizer_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // 4. Bookings
    const bookingsRes = await db.query(
      `SELECT b.booking_id, b.trip_id, b.booking_status, b.location, b.booking_time,
              t.origin, t.destination, t.departure_time, t.price_seat
       FROM bookings b
       JOIN trips t ON b.trip_id = t.trip_id
       WHERE b.user_id = $1
       ORDER BY b.booking_time DESC`,
      [userId]
    );

    // 5. Reviews written & received
    const reviewsWritten = await db.query(
      `SELECT review_id, trip_id, target_user_id, rating, comment, created_at 
       FROM reviews WHERE reviewer_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const reviewsReceived = await db.query(
      `SELECT review_id, trip_id, reviewer_id, rating, comment, created_at 
       FROM reviews WHERE target_user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // 6. Chat messages
    const chatRes = await db.query(
      `SELECT message_id, trip_id, message, created_at 
       FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    // 7. Verification requests
    let verificationRes = { rows: [] };
    try {
      verificationRes = await db.query(
        `SELECT request_id, document_type, full_name, status, created_at 
         FROM verification_requests WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
    } catch (e) {
      // Table may still be initializing
    }

    const payload = {
      export_metadata: {
        platform: 'Iko Share Community Carpool (ikoshare.com)',
        legal_basis: 'Thailand Personal Data Protection Act B.E. 2562 (Sections 30 & 31: Access & Portability)',
        export_timestamp: new Date().toISOString(),
        data_subject_id: userId,
        notice: 'ข้อมูลนี้เป็นข้อมูลส่วนบุคคลของคุณที่จัดเก็บในระบบ Iko Share เพื่อวัตถุประสงค์ในการให้บริการแชร์การเดินทางเท่านั้น ห้ามส่งต่อให้บุคคลที่ไม่เกี่ยวข้อง',
      },
      user_profile: profileRes.rows[0],
      registered_cars: carsRes.rows || [],
      trips_created: tripsRes.rows || [],
      ride_bookings: bookingsRes.rows || [],
      reviews: {
        written_by_user: reviewsWritten.rows || [],
        received_by_user: reviewsReceived.rows || [],
      },
      chat_messages_sent: chatRes.rows || [],
      verification_history: verificationRes.rows || [],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="iko-share-data-user-${userId}.json"`);
    return res.json(payload);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดาวน์โหลดสำเนาข้อมูลส่วนบุคคล: ' + (error.message || String(error)),
    });
  }
};

/**
 * 2. Submit a formal statutory request under PDPA
 * POST /api/pdpa/requests
 */
const submitPdpaRequest = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id || null;
    const {
      requester_name,
      requester_email,
      requester_phone,
      right_type,
      details,
      identification_proof,
    } = req.body;

    if (!requester_name || !String(requester_name).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ-นามสกุลของผู้ยื่นคำร้อง' });
    }

    if (!requester_email || !String(requester_email).includes('@')) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุอีเมลติดต่อกลับที่ถูกต้อง' });
    }

    if (!right_type || !PDPA_RIGHT_TITLES[right_type]) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกประเภทสิทธิที่ต้องการใช้ตามกฎหมาย PDPA ให้ถูกต้อง',
      });
    }

    if (!details || !String(details).trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรายละเอียดของข้อมูลที่ต้องการใช้สิทธิ' });
    }

    const insertRes = await db.query(
      `INSERT INTO pdpa_requests 
        (user_id, requester_name, requester_email, requester_phone, right_type, details, identification_proof, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'รอดำเนินการ')
       RETURNING *`,
      [
        userId,
        String(requester_name).trim(),
        String(requester_email).trim().toLowerCase(),
        requester_phone ? String(requester_phone).trim() : null,
        right_type,
        String(details).trim(),
        identification_proof || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'บันทึกคำร้องขอใช้สิทธิตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) สำเร็จแล้ว เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) จะพิจารณาและดำเนินการภายใน 30 วันตามที่กฎหมายกำหนด',
      request: insertRes.rows[0],
    });
  } catch (error) {
    console.error('Submit PDPA request error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกคำร้องขอใช้สิทธิ PDPA: ' + (error.message || String(error)),
    });
  }
};

/**
 * 3. Get User's submitted PDPA requests
 * GET /api/pdpa/my-requests
 */
const getMyPdpaRequests = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
    }

    const requestsRes = await db.query(
      `SELECT request_id, right_type, details, status, admin_reply, resolved_at, created_at
       FROM pdpa_requests
       WHERE user_id = $1 OR requester_email = $2
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId, userEmail]
    );

    const formatted = requestsRes.rows.map((r) => ({
      ...r,
      right_title: PDPA_RIGHT_TITLES[r.right_type] || r.right_type,
    }));

    res.json({
      success: true,
      requests: formatted,
    });
  } catch (error) {
    console.error('Get my PDPA requests error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติคำร้อง PDPA: ' + (error.message || String(error)),
    });
  }
};

module.exports = {
  PDPA_RIGHT_TITLES,
  exportMyData,
  submitPdpaRequest,
  getMyPdpaRequests,
};
