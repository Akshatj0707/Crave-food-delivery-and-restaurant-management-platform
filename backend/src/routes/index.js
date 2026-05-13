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


// ─── Add Veg Dishes Route ─────────────────────────────────
router.get('/add-veg-dishes', async (req, res) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const bcrypt = require('bcryptjs');

    const spiceGardenDishes = [
      { name: 'Hara Bhara Kebab', description: 'Spinach and peas patty with mint chutney', price: 200, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Aloo Tikki', description: 'Spiced potato patties served with chutneys', price: 150, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Paneer Malai Tikka', description: 'Creamy marinated cottage cheese grilled', price: 300, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Dahi Puri', description: 'Crispy puris filled with yogurt and chutneys', price: 140, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Samosa Chaat', description: 'Crispy samosas topped with yogurt and chutneys', price: 160, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Papdi Chaat', description: 'Crispy wafers with yogurt and pomegranate', price: 150, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Mushroom Tikka', description: 'Marinated mushrooms grilled in tandoor', price: 260, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Paneer Pakora', description: 'Cottage cheese fritters in crispy batter', price: 240, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Onion Bhaji', description: 'Crispy onion fritters with Indian spices', price: 130, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Tandoori Broccoli', description: 'Marinated broccoli grilled in tandoor', price: 260, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Pav Bhaji', description: 'Spiced mixed vegetable mash with buttered buns', price: 180, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Crispy Corn', description: 'Seasoned crispy corn kernels with spices', price: 180, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Raj Kachori', description: 'Giant puri filled with sprouts and chutneys', price: 170, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Tandoori Aloo', description: 'Baby potatoes marinated and grilled', price: 200, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Veg Spring Roll', description: 'Crispy rolls stuffed with spiced vegetables', price: 190, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich buttery tomato gravy', price: 320, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Kadai Paneer', description: 'Cottage cheese with bell peppers and spices', price: 300, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Shahi Paneer', description: 'Cottage cheese in rich creamy royal gravy', price: 340, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Matar Paneer', description: 'Cottage cheese and peas in tomato gravy', price: 280, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Aloo Gobi', description: 'Potato and cauliflower dry sabzi', price: 220, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Chana Masala', description: 'Spiced chickpeas in tangy tomato gravy', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { name: 'Rajma', description: 'Kidney beans in thick spiced gravy', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { name: 'Dal Tadka', description: 'Yellow lentils tempered with cumin and garlic', price: 220, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { name: 'Aloo Palak', description: 'Potatoes cooked with fresh spinach', price: 220, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Baingan Bharta', description: 'Smoky roasted eggplant mash with spices', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Kadai Mushroom', description: 'Mushrooms cooked in kadai masala', price: 280, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Malai Kofta', description: 'Cottage cheese dumplings in creamy gravy', price: 320, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Navratan Korma', description: 'Nine vegetables in rich aromatic cream sauce', price: 300, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Methi Malai Paneer', description: 'Cottage cheese with fenugreek in cream', price: 320, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Mix Vegetable', description: 'Assorted seasonal vegetables in spiced gravy', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Pindi Chole', description: 'Punjabi style spiced chickpeas dry', price: 260, isVeg: true, spiceLevel: 3, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { name: 'Sarson Ka Saag', description: 'Mustard greens cooked with spices and butter', price: 280, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Bhindi Masala', description: 'Okra cooked with onion tomato masala', price: 220, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Paneer Pasanda', description: 'Stuffed cottage cheese in almond cream gravy', price: 360, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Paneer Biryani', description: 'Fragrant basmati rice with cottage cheese', price: 360, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
      { name: 'Mushroom Biryani', description: 'Aromatic rice cooked with mushrooms', price: 340, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
      { name: 'Jeera Rice', description: 'Basmati rice tempered with cumin seeds', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
      { name: 'Kashmiri Pulao', description: 'Sweet rice with dry fruits and saffron', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
      { name: 'Subz Biryani', description: 'Assorted vegetables layered with basmati', price: 300, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
      { name: 'Saffron Rice', description: 'Basmati rice flavored with saffron', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
      { name: 'Tawa Pulao', description: 'Mumbai style spicy rice on iron griddle', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
      { name: 'Lemon Rice', description: 'Rice tempered with lemon and mustard seeds', price: 160, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
      { name: 'Stuffed Paratha', description: 'Whole wheat bread stuffed with spiced potato', price: 80, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Paneer Paratha', description: 'Whole wheat bread stuffed with cottage cheese', price: 90, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Missi Roti', description: 'Gram flour flatbread with spices', price: 50, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Kulcha', description: 'Soft leavened bread with onion and spices', price: 70, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Tandoori Roti', description: 'Whole wheat bread baked in tandoor', price: 40, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Roomali Roti', description: 'Thin handkerchief bread cooked on dome', price: 50, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Laccha Paratha', description: 'Layered whole wheat flatbread', price: 60, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Cheese Naan', description: 'Naan bread filled with melted cheese', price: 90, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Bhatura', description: 'Fluffy deep fried leavened bread', price: 60, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Gulab Jamun', description: 'Soft milk dumplings in rose sugar syrup', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Rasgulla', description: 'Spongy cottage cheese balls in sugar syrup', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Kheer', description: 'Creamy rice pudding with cardamom and nuts', price: 140, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Gajar Ka Halwa', description: 'Carrot pudding with ghee and dry fruits', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Rasmalai', description: 'Cottage cheese patties in sweetened milk', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Kulfi', description: 'Traditional Indian ice cream with pistachios', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Shahi Tukda', description: 'Fried bread with rabri and dry fruits', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Phirni', description: 'Ground rice pudding served in clay pots', price: 140, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Mango Lassi', description: 'Thick yogurt drink blended with fresh mango', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Sweet Lassi', description: 'Chilled yogurt drink with sugar and rose', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Salted Lassi', description: 'Savory yogurt drink with cumin and mint', price: 100, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Masala Chaas', description: 'Spiced buttermilk with ginger and curry leaves', price: 80, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Fresh Lime Soda', description: 'Refreshing lime juice with soda and mint', price: 80, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Thandai', description: 'Chilled milk drink with nuts and spices', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Masala Chai', description: 'Spiced Indian tea with ginger and cardamom', price: 60, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Aam Panna', description: 'Raw mango drink with cumin and black salt', price: 90, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Rose Sharbat', description: 'Chilled rose flavored drink with basil seeds', price: 90, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Filter Coffee', description: 'South Indian style strong filtered coffee', price: 80, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Aloo Matar', description: 'Potato and peas in tomato based gravy', price: 200, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Dal Fry', description: 'Fried lentils with onion tomato tempering', price: 200, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { name: 'Paneer Do Pyaza', description: 'Cottage cheese with double onion gravy', price: 310, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Achari Paneer', description: 'Cottage cheese with pickle spices', price: 300, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Paneer Tikka Masala', description: 'Grilled cottage cheese in spiced tomato gravy', price: 340, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Tawa Sabzi', description: 'Seasonal vegetables cooked on iron griddle', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Aloo Jeera', description: 'Cumin tempered potatoes with coriander', price: 180, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Matar Pulao', description: 'Basmati rice cooked with green peas', price: 220, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
      { name: 'Moong Dal Halwa', description: 'Yellow lentil pudding with saffron', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Malpua', description: 'Fried pancakes dipped in sugar syrup', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop' },
      { name: 'Onion Kulcha', description: 'Leavened bread stuffed with spiced onions', price: 70, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Methi Paratha', description: 'Fenugreek leaves flatbread', price: 70, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Puri', description: 'Deep fried whole wheat bread', price: 40, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Naan Platter', description: 'Assorted naan - butter, garlic, cheese', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Dahi Wala Paneer', description: 'Cottage cheese in yogurt based gravy', price: 300, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Lauki Kofta', description: 'Bottle gourd dumplings in tomato gravy', price: 260, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
      { name: 'Paneer Lababdar', description: 'Cottage cheese in smoky onion tomato gravy', price: 320, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { name: 'Curd Rice', description: 'Cooling rice mixed with seasoned yogurt', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
      { name: 'Coconut Rice', description: 'Rice cooked with fresh coconut and spices', price: 180, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
      { name: 'Veg Tehri', description: 'Vegetables cooked with spiced rice', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
      { name: 'Corn Pulao', description: 'Sweet corn kernels cooked with basmati', price: 220, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
      { name: 'Peas Pulao', description: 'Light aromatic rice with green peas', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
      { name: 'Peshwari Naan', description: 'Naan filled with coconut and almond', price: 80, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Stuffed Kulcha', description: 'Kulcha stuffed with spiced potato filling', price: 80, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { name: 'Dahi Ke Sholey', description: 'Crispy bread stuffed with spiced yogurt', price: 180, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { name: 'Stuffed Mushrooms', description: 'Mushrooms stuffed with paneer and herbs', price: 280, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
    ];

    const pizzaParadiseDishes = [
      { name: 'Mushroom Truffle Pizza', description: 'Wild mushrooms with truffle oil and parmesan', price: 520, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Quattro Formaggi', description: 'Four cheese pizza', price: 520, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Spinach Ricotta Pizza', description: 'Fresh spinach with creamy ricotta cheese', price: 460, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Pesto Pizza', description: 'Basil pesto with sun-dried tomatoes and cheese', price: 480, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Roasted Veggie Pizza', description: 'Seasonal roasted vegetables with herb oil', price: 440, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Paneer Tikka Pizza', description: 'Indian spiced paneer with peppers', price: 480, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Double Cheese Pizza', description: 'Extra mozzarella and cheddar loaded', price: 460, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Corn and Capsicum Pizza', description: 'Sweet corn and colorful bell peppers', price: 400, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Olives and Jalapeno Pizza', description: 'Black olives with spicy jalapenos', price: 420, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Veggie Supreme Pizza', description: 'Loaded with all fresh vegetables', price: 460, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Pizza Bianca', description: 'White pizza with garlic cream sauce', price: 420, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Eggplant Pizza', description: 'Roasted eggplant with fresh basil and feta', price: 440, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Sun Dried Tomato Pizza', description: 'Intense sun dried tomatoes with olives', price: 460, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Mozzarella Tomato Basil', description: 'Fresh mozzarella with vine tomatoes', price: 440, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Buffalo Paneer Pizza', description: 'Spicy buffalo paneer with blue cheese', price: 500, isVeg: true, spiceLevel: 3, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Spaghetti Pomodoro', description: 'Classic spaghetti in fresh tomato basil sauce', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Penne al Pesto', description: 'Penne pasta with fresh basil pesto', price: 300, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Rigatoni with Mushrooms', description: 'Rigatoni with wild mushrooms in cream sauce', price: 340, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Pasta Primavera', description: 'Fresh spring vegetables with olive oil', price: 300, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Cheese Tortellini', description: 'Stuffed pasta in butter and sage sauce', price: 360, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Spinach Lasagna', description: 'Layered pasta with spinach and bechamel', price: 380, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Gnocchi al Pomodoro', description: 'Potato dumplings in fresh tomato sauce', price: 340, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Linguine Aglio Olio', description: 'Linguine with garlic, olive oil and chili', price: 280, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Cacio e Pepe', description: 'Roman pasta with pecorino and black pepper', price: 300, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Truffle Pasta', description: 'Tagliatelle with black truffle and butter', price: 480, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Baked Ziti', description: 'Baked pasta with tomato sauce and mozzarella', price: 360, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Farfalle with Broccoli', description: 'Bow tie pasta with roasted broccoli', price: 300, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Pumpkin Ravioli', description: 'Pumpkin stuffed pasta in brown butter', price: 380, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Pasta al Limone', description: 'Light lemon cream pasta with herbs', price: 300, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Sun Dried Tomato Pasta', description: 'Intense sun dried tomato sauce with basil', price: 320, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Bruschetta al Pomodoro', description: 'Toasted bread with fresh tomato and basil', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Caprese Salad', description: 'Fresh mozzarella with tomatoes and basil', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Burrata', description: 'Creamy burrata with cherry tomatoes', price: 320, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Arancini', description: 'Crispy fried risotto balls with mozzarella', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Focaccia', description: 'Herb topped Italian flatbread with olive oil', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Mushroom Crostini', description: 'Wild mushrooms on toasted bread', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Minestrone Soup', description: 'Classic Italian vegetable soup with pasta', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Zuppa di Pomodoro', description: 'Roasted tomato soup with basil cream', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Panzanella', description: 'Tuscan bread salad with tomatoes and basil', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Mozzarella Sticks', description: 'Golden fried mozzarella with marinara', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Veggie Calzone', description: 'Folded pizza with cheese and vegetables', price: 360, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Mushroom Risotto', description: 'Creamy arborio rice with wild mushrooms', price: 380, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Saffron Risotto', description: 'Classic Milanese risotto with saffron', price: 360, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Truffle Risotto', description: 'Arborio rice with black truffle and parmesan', price: 480, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Spinach Risotto', description: 'Green risotto with fresh spinach and lemon', price: 340, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Pumpkin Risotto', description: 'Autumn risotto with roasted butternut pumpkin', price: 360, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Cheese Risotto', description: 'Five cheese risotto with herbs', price: 400, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Lemon Herb Risotto', description: 'Light risotto with lemon zest and herbs', price: 320, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Tiramisu', description: 'Classic Italian coffee dessert with mascarpone', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Panna Cotta', description: 'Silky vanilla cream with berry coulis', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Gelato', description: 'Italian ice cream - vanilla, chocolate or pistachio', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Cannoli', description: 'Crispy pastry tubes with sweet ricotta filling', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Espresso', description: 'Strong Italian single shot coffee', price: 80, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Limonata', description: 'Fresh squeezed Italian lemonade', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Hot Chocolate', description: 'Rich Italian thick hot chocolate', price: 140, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Smoothie', description: 'Fresh fruit smoothie', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Insalata Mista', description: 'Mixed Italian salad with house dressing', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Spinach Salad', description: 'Baby spinach with walnuts and balsamic', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Grilled Vegetables', description: 'Seasonal grilled vegetables with herb oil', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Tomato Basil Soup', description: 'Creamy roasted tomato soup with basil', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Cheese Fondue', description: 'Melted Swiss cheese with bread for dipping', price: 380, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Pasta alla Puttanesca', description: 'Olives, capers and tomato spicy sauce', price: 300, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Pasta alla Vodka', description: 'Penne in pink vodka cream tomato sauce', price: 340, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Potato Rosemary Pizza', description: 'Thinly sliced potato with rosemary', price: 420, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Caramelized Onion Pizza', description: 'Sweet caramelized onions with goat cheese', price: 460, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Avocado Pizza', description: 'Fresh avocado with cherry tomatoes and arugula', price: 500, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Zucchini Pizza', description: 'Grilled zucchini with lemon and herbs', price: 440, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Fig and Brie Pizza', description: 'Fresh figs with creamy brie and honey', price: 540, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
      { name: 'Asparagus Risotto', description: 'Spring risotto with fresh asparagus tips', price: 380, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Tomato Basil Risotto', description: 'Risotto with fresh tomatoes and basil pesto', price: 340, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Ribollita', description: 'Hearty Tuscan bread and vegetable soup', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Affogato', description: 'Vanilla gelato drowned in hot espresso', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Granita', description: 'Sicilian semi-frozen fruit ice dessert', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Semifreddo', description: 'Half-frozen Italian parfait with nuts', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Latte', description: 'Espresso with lots of steamed milk', price: 130, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Macchiato', description: 'Espresso with a dash of steamed milk', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Aranciata', description: 'Fresh Italian orange soda', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Italian Soda', description: 'Sparkling water with fruit syrup', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Pasta Caprese', description: 'Cold pasta salad with tomatoes and mozzarella', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Pasta e Fagioli', description: 'Pasta and bean soup Italian style', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Orecchiette with Greens', description: 'Ear shaped pasta with broccoli rabe', price: 320, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
      { name: 'Pasta Gratin', description: 'Baked pasta with gruyere cheese crust', price: 360, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { name: 'Zabaglione', description: 'Italian egg custard with marsala wine', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Torta di Mele', description: 'Italian apple cake with cinnamon cream', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Acqua Pazza', description: 'Sparkling mineral water with cucumber mint', price: 90, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Arugula Parmesan Pizza', description: 'Fresh arugula with shaved parmesan', price: 480, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Roasted Pepper Bruschetta', description: 'Roasted peppers and goat cheese on bread', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
      { name: 'Roasted Garlic Risotto', description: 'Slow roasted garlic with parmesan cream', price: 340, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
    ];

    const burgerBarnDishes = [
      { name: 'Mushroom Swiss Burger', description: 'Portobello mushroom with Swiss cheese', price: 260, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Avocado Veg Burger', description: 'Fresh avocado with crispy veggie patty', price: 300, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'BBQ Veggie Burger', description: 'Smoky BBQ sauce with caramelized onions', price: 260, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Spicy Chipotle Burger', description: 'Chipotle spiced patty with pepper jack', price: 280, isVeg: true, spiceLevel: 3, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Garden Fresh Burger', description: 'Loaded with fresh vegetables and hummus', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Black Bean Burger', description: 'Hearty black bean patty with salsa', price: 260, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Falafel Burger', description: 'Crispy falafel with tahini and pickles', price: 260, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Pesto Veggie Burger', description: 'Basil pesto with mozzarella and tomato', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Caprese Burger', description: 'Fresh mozzarella with tomato and basil', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Paneer Burger', description: 'Grilled paneer with mint chutney', price: 260, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Cauliflower Burger', description: 'Roasted cauliflower steak with buffalo sauce', price: 280, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Mac and Cheese Burger', description: 'Veggie patty topped with mac and cheese', price: 320, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Truffle Mushroom Burger', description: 'Mushroom patty with truffle aioli', price: 340, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Southwest Veggie Burger', description: 'Tex-Mex style with guacamole and salsa', price: 280, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Teriyaki Veggie Burger', description: 'Sweet teriyaki glazed veggie patty', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Loaded Veggie Burger', description: 'Everything on it - double the toppings', price: 340, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Sriracha Veggie Burger', description: 'Spicy sriracha with crispy fried onions', price: 280, isVeg: true, spiceLevel: 3, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Slider Pack Veggie', description: 'Three mini veggie sliders', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Quinoa Veggie Burger', description: 'Protein packed quinoa patty with tahini', price: 300, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Eggplant Burger', description: 'Grilled eggplant with feta and roasted peppers', price: 260, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Grilled Cheese Sandwich', description: 'Classic melted cheddar on toasted bread', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Club Sandwich', description: 'Triple decker with veggies and cheese', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Veggie Wrap', description: 'Grilled vegetables in whole wheat wrap', price: 220, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Falafel Wrap', description: 'Crispy falafel with hummus in pita', price: 240, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Paneer Tikka Wrap', description: 'Spiced paneer with mint chutney in wrap', price: 240, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Cheese Quesadilla', description: 'Crispy flour tortilla with melted cheese', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Veggie Quesadilla', description: 'Tortilla with peppers beans and cheese', price: 240, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Caprese Sandwich', description: 'Mozzarella tomato basil on ciabatta', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Avocado Toast', description: 'Smashed avocado on sourdough', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Mushroom Melt', description: 'Sauteed mushrooms with Swiss on rye', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with aioli', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Curly Fries', description: 'Seasoned curly fries with ranch', price: 150, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Waffle Fries', description: 'Crispy waffle cut fries with cheese sauce', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Cheese Fries', description: 'Golden fries smothered in melted cheese', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Chili Cheese Fries', description: 'Fries with veggie chili and cheese', price: 200, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Mac and Cheese', description: 'Creamy classic American mac and cheese', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Nachos', description: 'Tortilla chips with cheese, salsa and sour cream', price: 200, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Jalapeno Poppers', description: 'Cream cheese stuffed jalapenos fried', price: 180, isVeg: true, spiceLevel: 3, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Buffalo Cauliflower', description: 'Crispy buffalo cauliflower with blue cheese', price: 180, isVeg: true, spiceLevel: 2, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Zucchini Fries', description: 'Breaded zucchini sticks with marinara', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Pretzel Bites', description: 'Soft pretzel bites with cheese dipping sauce', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Garden Salad', description: 'Fresh garden salad with house dressing', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Caesar Salad', description: 'Romaine with Caesar dressing and croutons', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
      { name: 'Poutine', description: 'Fries with cheese curds and veggie gravy', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Corn on the Cob', description: 'Grilled corn with butter and seasoning', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Veggie Nuggets', description: 'Crispy veggie nuggets with honey mustard', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Onion Blossom', description: 'Giant blooming onion with dipping sauce', price: 200, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop' },
      { name: 'Corn Fritters', description: 'Sweet corn fritters with sour cream', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Chocolate Milkshake', description: 'Thick creamy chocolate milkshake', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
      { name: 'Vanilla Milkshake', description: 'Classic thick vanilla bean milkshake', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
      { name: 'Oreo Milkshake', description: 'Cookies and cream milkshake', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
      { name: 'Peanut Butter Milkshake', description: 'Peanut butter and banana milkshake', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
      { name: 'Chocolate Brownie', description: 'Warm fudgy brownie with vanilla ice cream', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Apple Pie', description: 'Classic American apple pie with cream', price: 180, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Cheesecake', description: 'New York style cheesecake with berry topping', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Banana Split', description: 'Classic banana split with three ice cream scoops', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Waffles', description: 'Belgian waffles with maple syrup and berries', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Lemonade', description: 'Fresh squeezed lemonade with mint', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Iced Tea', description: 'Refreshing sweet iced tea with lemon', price: 80, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Root Beer Float', description: 'Root beer with vanilla ice cream', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Orange Juice', description: 'Freshly squeezed orange juice', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Mango Smoothie', description: 'Thick mango smoothie with yogurt', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Berry Smoothie', description: 'Mixed berry smoothie with honey', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Cold Brew', description: 'Smooth cold brewed coffee with milk', price: 140, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Hot Chocolate', description: 'Rich creamy American hot chocolate', price: 120, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Fruit Punch', description: 'Fresh mixed fruit punch with ice', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Arnold Palmer', description: 'Half iced tea half lemonade', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Watermelon Juice', description: 'Fresh watermelon juice with lime', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Green Smoothie', description: 'Spinach banana apple smoothie', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop' },
      { name: 'Fried Pickles', description: 'Crispy fried dill pickles with ranch', price: 150, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Baked Beans', description: 'Slow baked beans in smoky tomato sauce', price: 140, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Potato Salad', description: 'Creamy American style potato salad', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Lemon Sorbet', description: 'Refreshing fresh lemon sorbet', price: 140, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Chocolate Sundae', description: 'Vanilla ice cream with hot fudge', price: 200, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Ice Cream Sandwich', description: 'Vanilla ice cream between chocolate cookies', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Gyro Wrap', description: 'Veggie gyro with tzatziki in pita', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Breakfast Burrito', description: 'Scrambled eggs with beans and cheese', price: 240, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Greek Veggie Burger', description: 'Feta, olives and tzatziki on veggie patty', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Veggie Sub', description: '6 inch sub loaded with fresh vegetables', price: 200, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Pita Pocket', description: 'Stuffed pita with hummus and falafel', price: 220, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'BLT Veggie', description: 'Veggie bacon lettuce tomato on sourdough', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Breakfast Veggie Burger', description: 'Egg and cheese on veggie patty', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Lentil Burger', description: 'Spiced lentil patty with yogurt sauce', price: 240, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Ranch Veggie Burger', description: 'Classic ranch with cheddar', price: 280, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Corn Veggie Burger', description: 'Sweet corn patty with coleslaw', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
      { name: 'Panini Caprese', description: 'Pressed Italian sandwich with mozzarella', price: 240, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Caesar Wrap', description: 'Caesar salad wrapped in flour tortilla', price: 220, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
      { name: 'Funnel Cake', description: 'Fried funnel cake with powdered sugar', price: 160, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Coleslaw', description: 'Creamy homemade coleslaw with apple', price: 100, isVeg: true, spiceLevel: 0, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { name: 'Potato Wedges', description: 'Thick cut seasoned potato wedges', price: 150, isVeg: true, spiceLevel: 1, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
    ];

    const dishMap = {
      'Spice Garden': spiceGardenDishes,
      'Pizza Paradise': pizzaParadiseDishes,
      'Burger Barn': burgerBarnDishes,
    };

    const restaurants = await Restaurant.find({});
    const results = {};

    for (const restaurant of restaurants) {
      const dishes = dishMap[restaurant.name];
      if (!dishes) continue;

      // Remove old veg collection
      restaurant.menu = restaurant.menu.filter(c => c.name !== 'Vegetarian Collection');

      // Add new category
      restaurant.menu.push({
        name: 'Vegetarian Collection',
        sortOrder: 99,
        isActive: true,
        items: dishes,
      });

      await restaurant.save();
      results[restaurant.name] = dishes.length;
    }

    res.json({
      success: true,
      message: '✅ Vegetarian dishes added to all restaurants!',
      results,
    });
  } catch (err) {
    console.error('Add veg dishes error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ─── Fix all restaurants - mark open + fix ratings ────────
router.get('/fix-restaurants', async (req, res) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const result = await Restaurant.updateMany({}, {
      $set: {
        isOpen: true,
        isVerified: true,
      }
    });

    // Fix restaurants with 0 ratings - restore seeded values
    await Restaurant.updateOne({ name: 'Spice Garden' }, {
      $set: { avgRating: 4.5, totalRatings: 1250, avgDeliveryTime: 35, deliveryFee: 40 }
    });
    await Restaurant.updateOne({ name: 'Pizza Paradise' }, {
      $set: { avgRating: 4.3, totalRatings: 890, avgDeliveryTime: 25, deliveryFee: 30 }
    });
    await Restaurant.updateOne({ name: 'Burger Barn' }, {
      $set: { avgRating: 4.1, totalRatings: 560, avgDeliveryTime: 20, deliveryFee: 25 }
    });

    const restaurants = await Restaurant.find({}, { name: 1, isOpen: 1, avgRating: 1, isVerified: 1 });
    res.json({
      success: true,
      message: '✅ All restaurants fixed!',
      updated: result.modifiedCount,
      restaurants: restaurants.map(r => ({
        name: r.name,
        isOpen: r.isOpen,
        avgRating: r.avgRating,
        isVerified: r.isVerified,
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
