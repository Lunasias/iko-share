const db = require('../config/db');

const isAdminRequest = (req) => Boolean(req.user.is_admin) || req.user.email === 'admin@ikoshare.com';

// Everyone who is allowed inside the party: the room head (car owner / organizer) + approved passengers.
const getTripMemberIds = async (tripId) => {
  const tripRes = await db.query(
    `SELECT t.trip_id, COALESCE(c.user_id, t.organizer_id) as owner_id
     FROM trips t
     LEFT JOIN cars c ON t.license_plate = c.license_plate
     WHERE t.trip_id = $1`,
    [tripId]
  );

  if (!tripRes.rows || tripRes.rows.length === 0) return null;

  const passengersRes = await db.query(
    "SELECT user_id FROM bookings WHERE trip_id = $1 AND booking_status = 'จองแล้ว'",
    [tripId]
  );

  const memberIds = new Set(passengersRes.rows.map((row) => Number(row.user_id)));
  if (tripRes.rows[0].owner_id !== null && tripRes.rows[0].owner_id !== undefined) {
    memberIds.add(Number(tripRes.rows[0].owner_id));
  }

  return { ownerId: tripRes.rows[0].owner_id, memberIds };
};

// Create OR edit a review for another member of the same trip.
// One review per (trip, reviewer, target) — sending it again just updates it.
const createReview = async (req, res) => {
  try {
    const reviewerId = Number(req.user.user_id || req.user.id);
    const { trip_id, target_user_id, rating, comment } = req.body;

    if (!trip_id || !target_user_id || !rating) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเที่ยวเดินทาง ผู้ถูกรีวิว และคะแนน (1-5 ดาว)' });
    }

    if (parseInt(rating) < 1 || parseInt(rating) > 5) {
      return res.status(400).json({ success: false, message: 'คะแนนเรตติ้งต้องอยู่ระหว่าง 1 ถึง 5 ดาว' });
    }

    const targetUserId = Number(target_user_id);
    if (targetUserId === reviewerId) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถรีวิวตัวเองได้' });
    }

    const membership = await getTripMemberIds(trip_id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'ไม่พบเที่ยวเดินทางนี้' });
    }

    if (!isAdminRequest(req)) {
      if (!membership.memberIds.has(reviewerId)) {
        return res.status(403).json({ success: false, message: 'เฉพาะสมาชิกที่อยู่ในตี้นี้เท่านั้นที่สามารถรีวิวกันเองได้' });
      }
      if (!membership.memberIds.has(targetUserId)) {
        return res.status(403).json({ success: false, message: 'ผู้ถูกรีวิวไม่ได้อยู่ในตี้เดินทางนี้' });
      }
    }

    const cleanComment = comment && String(comment).trim() ? String(comment).trim() : null;
    const parsedRating = parseInt(rating);

    const existingRes = await db.query(
      'SELECT review_id FROM reviews WHERE trip_id = $1 AND reviewer_id = $2 AND target_user_id = $3 ORDER BY review_id DESC LIMIT 1',
      [trip_id, reviewerId, targetUserId]
    );

    if (existingRes.rows && existingRes.rows.length > 0) {
      const updated = await db.query(
        `UPDATE reviews
         SET rating = $1, comment = $2, created_at = NOW()
         WHERE review_id = $3
         RETURNING *`,
        [parsedRating, cleanComment, existingRes.rows[0].review_id]
      );

      return res.json({
        success: true,
        edited: true,
        message: 'คุณเคยรีวิวสมาชิกท่านนี้ในทริปนี้แล้ว ระบบจึงบันทึกเป็นการแก้ไขรีวิวเดิม',
        review: updated.rows && updated.rows[0] ? updated.rows[0] : null,
      });
    }

    try {
      const inserted = await db.query(
        `INSERT INTO reviews (trip_id, reviewer_id, target_user_id, rating, comment, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [trip_id, reviewerId, targetUserId, parsedRating, cleanComment]
      );

      return res.status(201).json({
        success: true,
        edited: false,
        message: 'ส่งรีวิวและให้คะแนนสำเร็จเรียบร้อยแล้ว (รีวิวได้ 1 ครั้งต่อ 1 ทริป หากส่งซ้ำจะเป็นการแก้ไข)',
        review: inserted.rows && inserted.rows[0] ? inserted.rows[0] : null,
      });
    } catch (insertError) {
      // Concurrent duplicate → convert to an edit instead of failing.
      if (insertError.code === '23505') {
        const updated = await db.query(
          `UPDATE reviews
           SET rating = $1, comment = $2, created_at = NOW()
           WHERE trip_id = $3 AND reviewer_id = $4 AND target_user_id = $5
           RETURNING *`,
          [parsedRating, cleanComment, trip_id, reviewerId, targetUserId]
        );
        return res.json({
          success: true,
          edited: true,
          message: 'บันทึกเป็นการแก้ไขรีวิวเดิมเรียบร้อยแล้ว',
          review: updated.rows && updated.rows[0] ? updated.rows[0] : null,
        });
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งรีวิว: ' + (error.message || String(error)) });
  }
};

// Reviews written by the current user inside one trip (used to switch the UI into "edit" mode)
const getMyTripReviews = async (req, res) => {
  try {
    const reviewerId = Number(req.user.user_id || req.user.id);
    const { tripId } = req.params;

    const reviewsRes = await db.query(
      'SELECT * FROM reviews WHERE trip_id = $1 AND reviewer_id = $2 ORDER BY created_at DESC',
      [tripId, reviewerId]
    );

    const reviews = reviewsRes.rows || [];

    res.json({
      success: true,
      reviews,
      reviewedTargetIds: reviews.map((review) => Number(review.target_user_id)),
    });
  } catch (error) {
    console.error('Get my trip reviews error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิวของคุณ: ' + (error.message || String(error)) });
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
  getMyTripReviews,
  getUserReviews,
};
