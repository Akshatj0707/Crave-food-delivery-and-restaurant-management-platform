const pool = require('../config/database');

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [users, restaurants, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, role, COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today FROM users GROUP BY role'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_verified) as verified, COUNT(*) FILTER (WHERE is_open) as open FROM restaurants'),
      pool.query(`
        SELECT COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('pending','confirmed','preparing','ready','out_for_delivery')) as active,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
        FROM orders
      `),
      pool.query(`
        SELECT 
          SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN payment_status = 'paid' AND DATE(created_at) = CURRENT_DATE THEN total_amount ELSE 0 END) as today_revenue,
          SUM(CASE WHEN payment_status = 'paid' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN total_amount ELSE 0 END) as month_revenue
        FROM orders
      `)
    ]);

    const usersByRole = {};
    users.rows.forEach(r => { usersByRole[r.role] = { total: parseInt(r.total), today: parseInt(r.today) }; });

    res.json({
      success: true,
      data: {
        users: usersByRole,
        restaurants: restaurants.rows[0],
        orders: orders.rows[0],
        revenue: revenue.rows[0]
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    const params = [];
    if (role) { where.push(`role = $${params.length + 1}`); params.push(role); }
    if (search) {
      where.push(`(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM users ${whereStr}`, params);
    params.push(parseInt(limit), offset);

    const result = await pool.query(`
      SELECT id, email, role, first_name, last_name, phone, is_verified, is_active, created_at
      FROM users ${whereStr}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, isVerified } = req.body;

    // Prevent modifying super admins unless you are super admin
    const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (targetUser.rows[0]?.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify super admin' });
    }

    const result = await pool.query(`
      UPDATE users SET
        role = COALESCE($1, role),
        is_active = COALESCE($2, is_active),
        is_verified = COALESCE($3, is_verified),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, email, role, first_name, last_name, is_active, is_verified
    `, [role, isActive, isVerified, id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/restaurants
const getRestaurants = async (req, res) => {
  try {
    const { isVerified, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    const params = [];
    if (isVerified !== undefined) { where.push(`is_verified = $${params.length + 1}`); params.push(isVerified === 'true'); }
    if (search) { where.push(`name ILIKE $${params.length + 1}`); params.push(`%${search}%`); }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM restaurants ${whereStr}`, params);
    params.push(parseInt(limit), offset);

    const result = await pool.query(`
      SELECT r.*, u.first_name as owner_first_name, u.last_name as owner_last_name, u.email as owner_email
      FROM restaurants r
      LEFT JOIN users u ON u.id = r.owner_id
      ${whereStr}
      ORDER BY r.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/admin/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, isFeatured, isOpen } = req.body;

    const result = await pool.query(`
      UPDATE restaurants SET
        is_verified = COALESCE($1, is_verified),
        is_featured = COALESCE($2, is_featured),
        is_open = COALESCE($3, is_open),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [isVerified, isFeatured, isOpen, id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/orders
const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';
    if (status) { where = 'WHERE o.status = $1'; params.push(status); }

    const countResult = await pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params);
    params.push(parseInt(limit), offset);

    const result = await pool.query(`
      SELECT o.*, r.name as restaurant_name,
        u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      JOIN users u ON u.id = o.customer_id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/revenue-chart
const getRevenueChart = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats, getUsers, updateUser, getRestaurants,
  updateRestaurant, getOrders, getRevenueChart
};
