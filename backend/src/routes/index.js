const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const dbCheck = require('../middleware/dbCheck');

const authController = require('../controllers/authController');
const restaurantController = require('../controllers/restaurantController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const adminController = require('../controllers/adminController');
const addressController = require('../controllers/addressController');

// Apply DB check to ALL routes
router.use(dbCheck);

// ─── Auth ──────────────────────────────────────────────────
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.put('/auth/change-password', authenticate, authController.changePassword);

// ─── Restaurants ───────────────────────────────────────────
router.get('/restaurants', restaurantController.getRestaurants);
router.get('/restaurants/partner/mine', authenticate, authorize('partner'), restaurantController.getMyRestaurant);
router.post('/restaurants', authenticate, authorize('partner'), restaurantController.createRestaurant);
router.get('/restaurants/:id', restaurantController.getRestaurant);
router.put('/restaurants/:id', authenticate, authorize('partner','admin','super_admin'), restaurantController.updateRestaurant);
router.get('/restaurants/:id/menu', restaurantController.getMenu);
router.post('/restaurants/:id/menu/categories', authenticate, authorize('partner'), restaurantController.addMenuCategory);
router.post('/restaurants/:id/menu/items', authenticate, authorize('partner'), restaurantController.addMenuItem);
router.put('/restaurants/menu/items/:itemId', authenticate, authorize('partner'), restaurantController.updateMenuItem);
router.get('/restaurants/:id/tables', restaurantController.getTables);

// ─── Orders ────────────────────────────────────────────────
router.post('/orders', authenticate, authorize('customer'), orderController.createOrder);
router.get('/orders', authenticate, orderController.getMyOrders);
router.get('/orders/partner/restaurant', authenticate, authorize('partner'), orderController.getPartnerOrders);
router.get('/orders/partner/stats', authenticate, authorize('partner'), orderController.getPartnerStats);
router.get('/orders/:id', authenticate, orderController.getOrder);
router.patch('/orders/:id/status', authenticate, authorize('partner','admin','super_admin'), orderController.updateOrderStatus);
router.post('/orders/:id/review', authenticate, authorize('customer'), orderController.addReview);

// ─── Payments ──────────────────────────────────────────────
router.get('/payments/config', paymentController.getConfig);
router.post('/payments/create-intent', authenticate, paymentController.createPaymentIntent);
router.post('/payments/confirm', authenticate, paymentController.confirmPayment);
router.post('/payments/refund', authenticate, authorize('admin','super_admin'), paymentController.refundPayment);

// ─── Addresses ─────────────────────────────────────────────
router.get('/addresses', authenticate, addressController.getAddresses);
router.post('/addresses', authenticate, addressController.addAddress);
router.put('/addresses/:id', authenticate, addressController.updateAddress);
router.delete('/addresses/:id', authenticate, addressController.deleteAddress);

// ─── Admin ─────────────────────────────────────────────────
router.get('/admin/stats', authenticate, authorize('admin','super_admin'), adminController.getDashboardStats);
router.get('/admin/users', authenticate, authorize('admin','super_admin'), adminController.getUsers);
router.patch('/admin/users/:id', authenticate, authorize('admin','super_admin'), adminController.updateUser);
router.get('/admin/restaurants', authenticate, authorize('admin','super_admin'), adminController.getRestaurants);
router.patch('/admin/restaurants/:id', authenticate, authorize('admin','super_admin'), adminController.updateRestaurant);
router.get('/admin/orders', authenticate, authorize('admin','super_admin'), adminController.getOrders);
router.get('/admin/revenue-chart', authenticate, authorize('admin','super_admin'), adminController.getRevenueChart);

module.exports = router;


// ─── Debug + Seed Route (remove after setup) ──────────────
router.get('/debug', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Restaurant = require('../models/Restaurant');
    const User = require('../models/User');
    
    const dbName = mongoose.connection.db.databaseName;
    const collections = await mongoose.connection.db.listCollections().toArray();
    const restaurantCount = await Restaurant.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({
      success: true,
      database: dbName,
      collections: collections.map(c => c.name),
      counts: { restaurants: restaurantCount, users: userCount },
      mongoUri: process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':***@'),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/seed-now', async (req, res) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const User = require('../models/User');
    const Address = require('../models/Address');
    const bcrypt = require('bcryptjs');

    await Promise.all([
      Restaurant.deleteMany({}),
      User.deleteMany({}),
      Address.deleteMany({}),
    ]);

    const hash = await bcrypt.hash('password123', 12);

    const users = await User.create([
      { email: 'superadmin@crave.com', passwordHash: hash, role: 'super_admin', firstName: 'Super', lastName: 'Admin', phone: '9999999999', isVerified: true, isActive: true },
      { email: 'admin@crave.com', passwordHash: hash, role: 'admin', firstName: 'Crave', lastName: 'Admin', phone: '9888888888', isVerified: true, isActive: true },
      { email: 'partner1@crave.com', passwordHash: hash, role: 'partner', firstName: 'Raj', lastName: 'Sharma', phone: '9777777771', isVerified: true, isActive: true },
      { email: 'partner2@crave.com', passwordHash: hash, role: 'partner', firstName: 'Priya', lastName: 'Patel', phone: '9777777772', isVerified: true, isActive: true },
      { email: 'customer@crave.com', passwordHash: hash, role: 'customer', firstName: 'Arjun', lastName: 'Verma', phone: '9666666661', isVerified: true, isActive: true },
    ]);

    const partner1 = users.find(u => u.email === 'partner1@crave.com');
    const partner2 = users.find(u => u.email === 'partner2@crave.com');
    const customer = users.find(u => u.email === 'customer@crave.com');

    await Address.create({
      userId: customer._id, label: 'Home',
      addressLine1: '101 Palm Street, Bandra West',
      city: 'Mumbai', state: 'Maharashtra', pincode: '400050', isDefault: true,
    });

    await Restaurant.create([
      {
        ownerId: partner1._id,
        name: 'Spice Garden',
        description: 'Authentic North Indian cuisine with aromatic spices',
        cuisineTypes: ['North Indian', 'Mughlai', 'Biryani'],
        logoUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop',
        coverImageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=400&fit=crop',
        addressLine1: 'Shop 12, MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001',
        phone: '022-12345678', avgRating: 4.5, totalRatings: 1250, avgDeliveryTime: 35,
        deliveryFee: 40, minOrderAmount: 200, supportsDelivery: true, supportsTakeaway: true,
        supportsDineIn: true, totalTables: 12, isOpen: true, isVerified: true, isFeatured: true,
        menu: [
          { name: 'Starters', sortOrder: 0, isActive: true, items: [
            { name: 'Paneer Tikka', description: 'Cottage cheese marinated in spices', price: 280, isVeg: true, isFeatured: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
            { name: 'Chicken Tikka', description: 'Boneless chicken marinated in yogurt', price: 320, isVeg: false, isFeatured: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400&h=300&fit=crop' },
          ]},
          { name: 'Main Course', sortOrder: 1, isActive: true, items: [
            { name: 'Butter Chicken', description: 'Tender chicken in rich tomato-butter gravy', price: 380, isVeg: false, isFeatured: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
            { name: 'Dal Makhani', description: 'Black lentils slow-cooked with butter', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
            { name: 'Palak Paneer', description: 'Cottage cheese in smooth spinach gravy', price: 300, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
          ]},
          { name: 'Biryani', sortOrder: 2, isActive: true, items: [
            { name: 'Chicken Dum Biryani', description: 'Slow-cooked chicken with fragrant basmati rice', price: 420, isVeg: false, isFeatured: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
            { name: 'Veg Dum Biryani', description: 'Aromatic basmati rice with vegetables', price: 320, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
          ]},
          { name: 'Breads', sortOrder: 3, isActive: true, items: [
            { name: 'Butter Naan', description: 'Soft leavened bread baked in tandoor', price: 50, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
            { name: 'Garlic Naan', description: 'Naan topped with garlic and herbs', price: 60, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
          ]},
        ],
      },
      {
        ownerId: partner2._id,
        name: 'Pizza Paradise',
        description: 'Wood-fired pizzas and authentic Italian classics',
        cuisineTypes: ['Italian', 'Pizza', 'Pasta'],
        logoUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop',
        coverImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop',
        addressLine1: '45 Linking Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050',
        phone: '022-87654321', avgRating: 4.3, totalRatings: 890, avgDeliveryTime: 25,
        deliveryFee: 30, supportsDelivery: true, supportsTakeaway: true, supportsDineIn: true,
        totalTables: 8, isOpen: true, isVerified: true, isFeatured: true,
        menu: [
          { name: 'Pizzas', sortOrder: 0, isActive: true, items: [
            { name: 'Margherita', description: 'Classic tomato, fresh mozzarella, basil', price: 350, isVeg: true, isFeatured: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
            { name: 'Pepperoni', description: 'Loaded with premium pepperoni and mozzarella', price: 450, isVeg: false, isFeatured: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop' },
            { name: 'Farmhouse', description: 'Capsicum, onion, mushroom, corn', price: 400, isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
          ]},
          { name: 'Pasta', sortOrder: 1, isActive: true, items: [
            { name: 'Pasta Alfredo', description: 'Fettuccine in creamy white sauce', price: 300, isVeg: true, isFeatured: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
            { name: 'Pasta Arrabbiata', description: 'Penne in spicy tomato sauce', price: 280, isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
          ]},
          { name: 'Sides', sortOrder: 2, isActive: true, items: [
            { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 120, isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
          ]},
        ],
      },
      {
        ownerId: partner1._id,
        name: 'Burger Barn',
        description: 'Gourmet burgers stacked high with premium ingredients',
        cuisineTypes: ['American', 'Burgers', 'Fast Food'],
        logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
        coverImageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=400&fit=crop',
        addressLine1: '22 Hill Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050',
        phone: '022-11223344', avgRating: 4.1, totalRatings: 560, avgDeliveryTime: 20,
        deliveryFee: 25, supportsDelivery: true, supportsTakeaway: true, supportsDineIn: false,
        isOpen: true, isVerified: true,
        menu: [
          { name: 'Burgers', sortOrder: 0, isActive: true, items: [
            { name: 'Classic Cheeseburger', description: 'Beef patty, cheddar, lettuce, tomato', price: 280, isVeg: false, isFeatured: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
            { name: 'Crispy Veg Burger', description: 'Crispy veggie patty with jalapeños', price: 220, isVeg: true, isFeatured: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
            { name: 'Double Stack Burger', description: 'Double beef patty, bacon, special sauce', price: 380, isVeg: false, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
          ]},
          { name: 'Sides', sortOrder: 1, isActive: true, items: [
            { name: 'French Fries', description: 'Crispy golden fries', price: 120, isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
            { name: 'Milkshake', description: 'Thick creamy vanilla/chocolate/strawberry', price: 160, isVeg: true, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
          ]},
        ],
      },
    ]);

    res.json({
      success: true,
      message: '✅ Database seeded successfully!',
      data: {
        users: await User.countDocuments(),
        restaurants: await Restaurant.countDocuments(),
        addresses: await Address.countDocuments(),
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
