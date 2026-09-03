const db = require('../config/db');

// Create review for driver or passenger
const createReview = async (req, res) => {
  try {
    const reviewerId = req.user.user_id || req.user.id;
    const { trip_id, target_user_id, rating, comment } = req.body;

    if (!trip_id || !target_user_id || !rating) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเที่ยวเดินทาง ผู้ถูกรีวิว และคะแนน (1-5 ดาว)' });
    }

    if (parseInt(rating) < 1 || parseInt(rating) > 5) {
      return res.status(400).json({ success: false, message: 'คะแนนเรตติ้งต้องอยู่ระหว่าง 1 ถึง 5 ดาว' });
    }

    // Insert review
    const reviewRes = await db.query(
      `INSERT INTO reviews (trip_id, reviewer_id, target_user_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [trip_id, target_user_id, parseInt(rating), comment || null]
    );

    res.status(201).json({
      success: true,
      message: 'ส่งรีวิวและให้คะแนนสำเร็จเรียบร้อยแล้ว',
      review: reviewRes.rows && reviewRes.rows[0] ? reviewRes.rows[0] : null,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งรีวิว: ' + (error.message || String(error)) });
  }
};

// Get reviews for specific user & average rating
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviewsRes = await db.query(
      `SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.target_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const avgRes = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_user_id = $1',
      [userId]
    );

    const avgRating = parseFloat(avgRes.rows[0]?.avg_rating || 0).toFixed(1);
    const reviewCount = parseInt(avgRes.rows[0]?.review_count || 0);

    res.json({
      success: true,
      reviews: reviewsRes.rows || [],
      avgRating,
      reviewCount,
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว: ' + (error.message || String(error)) });
  }
};

module.exports = {
  createReview,
  getUserReviews,
};
