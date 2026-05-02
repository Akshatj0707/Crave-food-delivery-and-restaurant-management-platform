const pool = require('../config/database');

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CRV${timestamp}${random}`;
};

// POST /api/orders
const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      restaurantId, serviceMode, items, deliveryAddressId, tableId,
      specialInstructions, subtotal, deliveryFee, taxAmount, discountAmount, totalAmount
    } = req.body;

    const orderNumber = generateOrderNumber();

    const orderResult = await client.query(`
      INSERT INTO orders (
        order_number, customer_id, restaurant_id, service_mode,
        delivery_address_id, table_id, subtotal, delivery_fee, tax_amount,
        discount_amount, total_amount, special_instructions, status, payment_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending','pending')
      RETURNING *
    `, [
      orderNumber, req.user.id, restaurantId, serviceMode,
      deliveryAddressId || null, tableId || null,
      subtotal, deliveryFee || 0, taxAmount || 0,
      discountAmount || 0, totalAmount, specialInstructions || null
    ]);

    const order = orderResult.rows[0];

    // Insert order items
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity, customizations, item_total)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [
        order.id, item.menuItemId, item.name, item.price,
        item.quantity, JSON.stringify(item.customizations || []),
        item.price * item.quantity
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// GET /api/orders - Customer's orders
const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE o.customer_id = $1';
    const params = [req.user.id];
    if (status) {
      where += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT o.*, r.name as restaurant_name, r.logo_url as restaurant_logo,
        json_agg(jsonb_build_object(
          'id', oi.id, 'name', oi.item_name, 'price', oi.item_price,
          'quantity', oi.quantity, 'total', oi.item_total
        )) as items
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id, r.name, r.logo_url
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT o.*, r.name as restaurant_name, r.logo_url as restaurant_logo,
        r.phone as restaurant_phone, r.address_line1 as restaurant_address,
        a.address_line1, a.city, a.state, a.pincode,
        u.first_name as customer_first_name, u.last_name as customer_last_name,
        u.phone as customer_phone,
        json_agg(jsonb_build_object(
          'id', oi.id, 'menu_item_id', oi.menu_item_id,
          'name', oi.item_name, 'price', oi.item_price,
          'quantity', oi.quantity, 'customizations', oi.customizations,
          'total', oi.item_total
        )) as items
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN addresses a ON a.id = o.delivery_address_id
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = $1
      GROUP BY o.id, r.name, r.logo_url, r.phone, r.address_line1,
               a.address_line1, a.city, a.state, a.pincode,
               u.first_name, u.last_name, u.phone
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = result.rows[0];
    // Check access: customer can see own orders, partners/admins see all
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/partner/restaurant - Partner's restaurant orders
const getPartnerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const restResult = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restResult.rows.length) {
      return res.status(404).json({ success: false, message: 'No restaurant found' });
    }
    const restaurantId = restResult.rows[0].id;

    let where = 'WHERE o.restaurant_id = $1';
    const params = [restaurantId];
    if (status) {
      where += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params);
    params.push(parseInt(limit), offset);

    const result = await pool.query(`
      SELECT o.*, u.first_name, u.last_name, u.phone as customer_phone,
        json_agg(jsonb_build_object(
          'id', oi.id, 'name', oi.item_name, 'price', oi.item_price,
          'quantity', oi.quantity, 'total', oi.item_total
        )) as items
      FROM orders o
      JOIN users u ON u.id = o.customer_id
      JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id, u.first_name, u.last_name, u.phone
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
    console.error('Get partner orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedTime } = req.body;

    const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await pool.query(`
      UPDATE orders SET status = $1, estimated_time = COALESCE($2, estimated_time),
        actual_delivery_time = CASE WHEN $1 = 'delivered' THEN NOW() ELSE actual_delivery_time END,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, estimatedTime || null, id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/partner/stats
const getPartnerStats = async (req, res) => {
  try {
    const restResult = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restResult.rows.length) {
      return res.json({ success: true, data: { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, todayOrders: 0 } });
    }
    const restaurantId = restResult.rows[0].id;

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN status IN ('pending','confirmed','preparing','ready') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_orders,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE AND payment_status = 'paid' THEN 1 END) as today_paid_orders,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE AND payment_status = 'paid' THEN total_amount ELSE 0 END) as today_revenue
      FROM orders WHERE restaurant_id = $1
    `, [restaurantId]);

    res.json({ success: true, data: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/orders/:id/review
const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2 AND status = $3',
      [id, req.user.id, 'delivered']
    );
    if (!orderResult.rows.length) {
      return res.status(400).json({ success: false, message: 'Cannot review this order' });
    }

    const order = orderResult.rows[0];
    const existing = await pool.query('SELECT id FROM reviews WHERE order_id = $1', [id]);
    if (existing.rows.length) {
      return res.status(400).json({ success: false, message: 'Already reviewed this order' });
    }

    await pool.query(`
      INSERT INTO reviews (order_id, customer_id, restaurant_id, rating, comment)
      VALUES ($1,$2,$3,$4,$5)
    `, [id, req.user.id, order.restaurant_id, rating, comment]);

    // Update restaurant avg rating
    await pool.query(`
      UPDATE restaurants SET
        avg_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE restaurant_id = $1),
        total_ratings = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1)
      WHERE id = $1
    `, [order.restaurant_id]);

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createOrder, getMyOrders, getOrder, getPartnerOrders,
  updateOrderStatus, getPartnerStats, addReview
};
