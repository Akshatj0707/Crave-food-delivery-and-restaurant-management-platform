const Restaurant = require('../models/Restaurant');

// GET /api/restaurants
const getRestaurants = async (req, res) => {
  try {
    const { cuisine, mode, search, city, page = 1, limit = 12 } = req.query;

    // Don't filter by isVerified so all restaurants show
    const query = {};

    if (search) query.$text = { $search: search };
    if (cuisine) query.cuisineTypes = { $in: [new RegExp(cuisine, 'i')] };
    if (mode === 'delivery') query.supportsDelivery = true;
    else if (mode === 'takeaway') query.supportsTakeaway = true;
    else if (mode === 'dine_in') query.supportsDineIn = true;
    if (city) query.city = new RegExp(city, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Restaurant.countDocuments(query);

    const restaurants = await Restaurant.find(query, { menu: 0, businessHours: 0, tables: 0 })
      .sort({ isFeatured: -1, avgRating: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get restaurants error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/:id
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).lean();
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/partner/mine
const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id }).lean();
    res.json({ success: true, data: restaurant || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/restaurants
const createRestaurant = async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ ownerId: req.user._id });
    if (existing)
      return res.status(400).json({ success: false, message: 'You already have a restaurant' });

    const {
      name, description, cuisineTypes, addressLine1, city, state, pincode,
      phone, email, deliveryFee, minOrderAmount, supportsDelivery,
      supportsTakeaway, supportsDineIn, totalTables
    } = req.body;

    const businessHours = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i, openTime: '10:00', closeTime: '23:00', isClosed: i === 1
    }));

    const restaurant = await Restaurant.create({
      ownerId: req.user._id, name, description,
      cuisineTypes: cuisineTypes || [],
      addressLine1, city, state, pincode,
      phone, email,
      deliveryFee: deliveryFee || 0,
      minOrderAmount: minOrderAmount || 0,
      supportsDelivery: supportsDelivery !== false,
      supportsTakeaway: supportsTakeaway !== false,
      supportsDineIn: supportsDineIn || false,
      totalTables: totalTables || 0,
      isVerified: true,
      businessHours,
    });

    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    console.error('Create restaurant error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Restaurant not found' });

    if (restaurant.ownerId.toString() !== req.user._id.toString() &&
      !['admin', 'super_admin'].includes(req.user.role))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const allowed = ['name', 'description', 'cuisineTypes', 'addressLine1', 'city',
      'state', 'pincode', 'phone', 'email', 'deliveryFee', 'minOrderAmount',
      'supportsDelivery', 'supportsTakeaway', 'supportsDineIn', 'totalTables', 'isOpen'];
    allowed.forEach(k => { if (req.body[k] !== undefined) restaurant[k] = req.body[k]; });

    await restaurant.save();
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/:id/menu
const getMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id, { menu: 1, name: 1 }).lean();
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant.menu });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/restaurants/:id/menu/categories
const addMenuCategory = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant || restaurant.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    restaurant.menu.push({
      name: req.body.name,
      description: req.body.description,
      sortOrder: restaurant.menu.length,
    });
    await restaurant.save();
    res.status(201).json({ success: true, data: restaurant.menu });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/restaurants/:id/menu/items
const addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant || restaurant.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { categoryId, name, description, price, originalPrice,
      imageUrl, isVeg, spiceLevel, tags } = req.body;

    const category = restaurant.menu.id(categoryId);
    if (!category)
      return res.status(404).json({ success: false, message: 'Category not found' });

    category.items.push({
      name, description,
      price: parseFloat(price),
      originalPrice,
      imageUrl,
      isVeg: isVeg !== false,
      spiceLevel: parseInt(spiceLevel) || 0,
      tags: tags || [],
      sortOrder: category.items.length,
    });
    await restaurant.save();
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/restaurants/menu/items/:itemId
const updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const restaurant = await Restaurant.findOne({ 'menu.items._id': itemId });
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Item not found' });

    let foundItem = null;
    restaurant.menu.forEach(cat => {
      const item = cat.items.id(itemId);
      if (item) foundItem = item;
    });

    if (!foundItem)
      return res.status(404).json({ success: false, message: 'Item not found' });

    const allowed = ['name', 'description', 'price', 'isAvailable', 'imageUrl', 'spiceLevel', 'isFeatured'];
    allowed.forEach(k => { if (req.body[k] !== undefined) foundItem[k] = req.body[k]; });

    await restaurant.save();
    res.json({ success: true, data: foundItem });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/restaurants/:id/tables
const getTables = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id, { tables: 1 }).lean();
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant.tables });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getRestaurants, getRestaurant, getMyRestaurant, createRestaurant,
  updateRestaurant, getMenu, addMenuCategory, addMenuItem, updateMenuItem, getTables
};
