const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CRV${timestamp}${random}`;
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const {
      restaurantId, serviceMode, items, deliveryAddressId, tableId,
      specialInstructions, subtotal, deliveryFee, taxAmount, discountAmount, totalAmount
    } = req.body;

    const orderItems = items.map(i => ({
      menuItemId: i.menuItemId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      customizations: i.customizations || [],
      itemTotal: i.price * i.quantity,
    }));

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId: req.user._id,
      restaurantId, serviceMode, items: orderItems,
      deliveryAddressId: deliveryAddressId || null,
      tableId: tableId || null,
      subtotal, deliveryFee: deliveryFee || 0,
      taxAmount: taxAmount || 0, discountAmount: discountAmount || 0,
      totalAmount, specialInstructions, status: 'pending', paymentStatus: 'pending',
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders — customer's orders
const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customerId: req.user._id };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('restaurantId', 'name logoUrl');

    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name logoUrl phone addressLine1')
      .populate('customerId', 'firstName lastName phone email')
      .populate('deliveryAddressId');

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'customer' &&
        order.customerId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/partner/restaurant
const getPartnerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id }, '_id');
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'No restaurant found' });

    const query = { restaurantId: restaurant._id };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('customerId', 'firstName lastName phone');

    res.json({
      success: true, data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Get partner orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, estimatedTime } = req.body;
    const validStatuses = ['confirmed','preparing','ready','out_for_delivery','delivered','cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const update = { status };
    if (estimatedTime) update.estimatedTime = estimatedTime;
    if (status === 'delivered') update.actualDeliveryTime = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/partner/stats
const getPartnerStats = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id }, '_id');
    if (!restaurant)
      return res.json({ success: true, data: { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, todayOrders: 0 } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, pendingOrders, todayOrders, revenueData, todayRevenue] = await Promise.all([
      Order.countDocuments({ restaurantId: restaurant._id }),
      Order.countDocuments({ restaurantId: restaurant._id, status: { $in: ['pending','confirmed','preparing','ready'] } }),
      Order.countDocuments({ restaurantId: restaurant._id, createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, paymentStatus: 'paid', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        today_orders: todayOrders,
        total_revenue: revenueData[0]?.total || 0,
        today_revenue: todayRevenue[0]?.total || 0,
        today_paid_orders: todayOrders,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/orders/:id/review
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id, status: 'delivered' });
    if (!order)
      return res.status(400).json({ success: false, message: 'Cannot review this order' });

    const existing = await Review.findOne({ orderId: order._id });
    if (existing)
      return res.status(400).json({ success: false, message: 'Already reviewed this order' });

    await Review.create({
      orderId: order._id, customerId: req.user._id,
      restaurantId: order.restaurantId, rating, comment,
    });

    // Update restaurant avg rating
    const stats = await Review.aggregate([
      { $match: { restaurantId: order.restaurantId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (stats.length) {
      await Restaurant.findByIdAndUpdate(order.restaurantId, {
        avgRating: parseFloat(stats[0].avg.toFixed(2)),
        totalRatings: stats[0].count,
      });
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createOrder, getMyOrders, getOrder, getPartnerOrders,
  updateOrderStatus, getPartnerStats, addReview
};
