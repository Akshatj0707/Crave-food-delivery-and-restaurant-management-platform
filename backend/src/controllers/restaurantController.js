const pool = require('../config/database');

// GET /api/restaurants - List all restaurants with filters
const getRestaurants = async (req, res) => {
  try {
    const { cuisine, mode, search, city, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = ['r.is_verified = true'];
    let params = [];
    let paramCount = 1;

    if (search) {
      whereClause.push(`(r.name ILIKE $${paramCount} OR $${paramCount} = ANY(r.cuisine_types))`);
      params.push(`%${search}%`);
      paramCount++;
    }
    if (cuisine) {
      whereClause.push(`$${paramCount} = ANY(r.cuisine_types)`);
      params.push(cuisine);
      paramCount++;
    }
    if (mode === 'delivery') {
      whereClause.push('r.supports_delivery = true');
    } else if (mode === 'takeaway') {
      whereClause.push('r.supports_takeaway = true');
    } else if (mode === 'dine_in') {
      whereClause.push('r.supports_dine_in = true');
    }
    if (city) {
      whereClause.push(`r.city ILIKE $${paramCount}`);
      params.push(`%${city}%`);
      paramCount++;
    }

    const where = whereClause.length ? 'WHERE ' + whereClause.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM restaurants r ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.is_available = true) as item_count
      FROM restaurants r
      ${where}
      ORDER BY r.is_featured DESC, r.avg_rating DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Get restaurants error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/:id
const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restResult = await pool.query(`
      SELECT r.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', bh.id,
          'day_of_week', bh.day_of_week,
          'open_time', bh.open_time,
          'close_time', bh.close_time,
          'is_closed', bh.is_closed
        )) FILTER (WHERE bh.id IS NOT NULL) as business_hours
      FROM restaurants r
      LEFT JOIN business_hours bh ON bh.restaurant_id = r.id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);

    if (!restResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Get menu with categories
    const menuResult = await pool.query(`
      SELECT 
        mc.id as category_id,
        mc.name as category_name,
        mc.sort_order,
        json_agg(
          jsonb_build_object(
            'id', mi.id,
            'name', mi.name,
            'description', mi.description,
            'price', mi.price,
            'original_price', mi.original_price,
            'image_url', mi.image_url,
            'is_veg', mi.is_veg,
            'is_available', mi.is_available,
            'is_featured', mi.is_featured,
            'spice_level', mi.spice_level,
            'tags', mi.tags
          ) ORDER BY mi.sort_order
        ) FILTER (WHERE mi.id IS NOT NULL) as items
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mi.category_id = mc.id AND mi.is_available = true
      WHERE mc.restaurant_id = $1 AND mc.is_active = true
      GROUP BY mc.id, mc.name, mc.sort_order
      ORDER BY mc.sort_order
    `, [id]);

    res.json({
      success: true,
      data: { ...restResult.rows[0], menu: menuResult.rows }
    });
  } catch (err) {
    console.error('Get restaurant error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/partner/mine - Get partner's own restaurant
const getMyRestaurant = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM restaurants WHERE owner_id = $1',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/restaurants - Create restaurant (partner)
const createRestaurant = async (req, res) => {
  try {
    const {
      name, description, cuisineTypes, addressLine1, city, state, pincode,
      phone, email, deliveryFee, minOrderAmount, supportsDelivery,
      supportsTakeaway, supportsDineIn, totalTables
    } = req.body;

    const existing = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (existing.rows.length) {
      return res.status(400).json({ success: false, message: 'You already have a restaurant' });
    }

    const result = await pool.query(`
      INSERT INTO restaurants (
        owner_id, name, description, cuisine_types, address_line1, city, state, pincode,
        phone, email, delivery_fee, min_order_amount, supports_delivery, supports_takeaway,
        supports_dine_in, total_tables
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [
      req.user.id, name, description, cuisineTypes, addressLine1, city, state, pincode,
      phone, email, deliveryFee || 0, minOrderAmount || 0, supportsDelivery !== false,
      supportsTakeaway !== false, supportsDineIn || false, totalTables || 0
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Create restaurant error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, cuisineTypes, addressLine1, city, state, pincode,
      phone, deliveryFee, minOrderAmount, supportsDelivery, supportsTakeaway,
      supportsDineIn, totalTables, isOpen
    } = req.body;

    const check = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [id]);
    if (!check.rows.length) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    if (check.rows[0].owner_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await pool.query(`
      UPDATE restaurants SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        cuisine_types = COALESCE($3, cuisine_types),
        address_line1 = COALESCE($4, address_line1),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        pincode = COALESCE($7, pincode),
        phone = COALESCE($8, phone),
        delivery_fee = COALESCE($9, delivery_fee),
        min_order_amount = COALESCE($10, min_order_amount),
        supports_delivery = COALESCE($11, supports_delivery),
        supports_takeaway = COALESCE($12, supports_takeaway),
        supports_dine_in = COALESCE($13, supports_dine_in),
        total_tables = COALESCE($14, total_tables),
        is_open = COALESCE($15, is_open),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `, [name, description, cuisineTypes, addressLine1, city, state, pincode, phone,
        deliveryFee, minOrderAmount, supportsDelivery, supportsTakeaway,
        supportsDineIn, totalTables, isOpen, id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/:id/menu
const getMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        mc.id as category_id, mc.name as category_name, mc.sort_order,
        json_agg(
          jsonb_build_object(
            'id', mi.id, 'name', mi.name, 'description', mi.description,
            'price', mi.price, 'original_price', mi.original_price,
            'image_url', mi.image_url, 'is_veg', mi.is_veg,
            'is_available', mi.is_available, 'is_featured', mi.is_featured,
            'spice_level', mi.spice_level
          ) ORDER BY mi.sort_order
        ) FILTER (WHERE mi.id IS NOT NULL) as items
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mi.category_id = mc.id
      WHERE mc.restaurant_id = $1 AND mc.is_active = true
      GROUP BY mc.id ORDER BY mc.sort_order
    `, [id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/restaurants/:id/menu/items
const addMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, originalPrice, imageUrl, isVeg, spiceLevel, tags } = req.body;

    const check = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [id]);
    if (!check.rows.length || check.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await pool.query(`
      INSERT INTO menu_items (restaurant_id, category_id, name, description, price, original_price, image_url, is_veg, spice_level, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [id, categoryId, name, description, price, originalPrice, imageUrl, isVeg !== false, spiceLevel || 0, tags || []]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/restaurants/menu/items/:itemId
const updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, isAvailable, imageUrl, spiceLevel } = req.body;

    const result = await pool.query(`
      UPDATE menu_items SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        is_available = COALESCE($4, is_available),
        image_url = COALESCE($5, image_url),
        spice_level = COALESCE($6, spice_level),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, description, price, isAvailable, imageUrl, spiceLevel, itemId]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/:id/tables
const getTables = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM restaurant_tables WHERE restaurant_id = $1 ORDER BY table_number',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getRestaurants, getRestaurant, getMyRestaurant, createRestaurant,
  updateRestaurant, getMenu, addMenuItem, updateMenuItem, getTables
};
