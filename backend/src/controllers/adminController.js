const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);

    const [
      totalCustomers, totalPartners, totalAdmins,
      todayCustomers, restaurantStats, orderStats, revenueData,
      todayRevenue, monthRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'partner' }),
      User.countDocuments({ role: { $in: ['admin','super_admin'] } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: today } }),
      Restaurant.aggregate([{ $group: { _id: null,
        total: { $sum: 1 },
        verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
        open: { $sum: { $cond: ['$isOpen', 1, 0] } },
      }}]),
      Order.aggregate([{ $group: { _id: null,
        total: { $sum: 1 },
        delivered: { $sum: { $cond: [{ $eq: ['$status','delivered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status','cancelled'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $in: ['$status',['pending','confirmed','preparing','ready','out_for_delivery']] }, 1, 0] } },
      }}]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
    ]);

    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });

    res.json({
      success: true,
      data: {
        users: {
          customer: { total: totalCustomers, today: todayCustomers },
          partner: { total: totalPartners, today: 0 },
          admin: { total: totalAdmins, today: 0 },
        },
        restaurants: restaurantStats[0] || { total: 0, verified: 0, open: 0 },
        orders: { ...( orderStats[0] || { total: 0, delivered: 0, cancelled: 0, active: 0 }), today: todayOrders },
        revenue: {
          total_revenue: revenueData[0]?.total || 0,
          today_revenue: todayRevenue[0]?.total || 0,
          month_revenue: monthRevenue[0]?.total || 0,
        }
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page)-1)*parseInt(limit))
      .limit(parseInt(limit));
    res.json({ success: true, data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total/limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target.role === 'super_admin' && req.user.role !== 'super_admin')
      return res.status(403).json({ success: false, message: 'Cannot modify super admin' });
    const { role, isActive, isVerified } = req.body;
    if (role !== undefined) target.role = role;
    if (isActive !== undefined) target.isActive = isActive;
    if (isVerified !== undefined) target.isVerified = isVerified;
    await target.save();
    res.json({ success: true, data: target });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getRestaurants = async (req, res) => {
  try {
    const { isVerified, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (search) query.name = new RegExp(search, 'i');
    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query, { menu: 0 })
      .sort({ createdAt: -1 })
      .skip((parseInt(page)-1)*parseInt(limit))
      .limit(parseInt(limit))
      .populate('ownerId', 'firstName lastName email');
    res.json({ success: true, data: restaurants,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total/limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const { isVerified, isFeatured, isOpen } = req.body;
    const update = {};
    if (isVerified !== undefined) update.isVerified = isVerified;
    if (isFeatured !== undefined) update.isFeatured = isFeatured;
    if (isOpen !== undefined) update.isOpen = isOpen;
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page)-1)*parseInt(limit))
      .limit(parseInt(limit))
      .populate('restaurantId', 'name')
      .populate('customerId', 'firstName lastName');
    res.json({ success: true, data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total/limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getRevenueChart = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus','paid'] }, '$totalAmount', 0] } },
        orders: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDashboardStats, getUsers, updateUser, getRestaurants, updateRestaurant, getOrders, getRevenueChart };
