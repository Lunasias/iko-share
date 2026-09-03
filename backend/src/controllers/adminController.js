const db = require('../config/db');

const getAdminStats = async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const tripsCount = await db.query('SELECT COUNT(*) FROM trips');
    const bookingsCount = await db.query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'");

    const recentUsers = await db.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    const recentTrips = await db.query(
      `SELECT t.*, u.name as driver_name FROM trips t JOIN users u ON t.driver_id = u.id ORDER BY t.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0]?.count || 0),
        totalTrips: parseInt(tripsCount.rows[0]?.count || 0),
        totalBookings: parseInt(bookingsCount.rows[0]?.count || 0),
      },
      recentUsers: recentUsers.rows || [],
      recentTrips: recentTrips.rows || [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแอดมิน: ' + (error.message || String(error)) });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY id DESC');
    res.json({ success: true, users: result.rows || [] });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + (error.message || String(error)) });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน: ' + (error.message || String(error)) });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
};
