const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

const authController = require('../controllers/authController');
const restaurantController = require('../controllers/restaurantController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const adminController = require('../controllers/adminController');
const addressController = require('../controllers/addressController');

// ─── Auth Routes ───────────────────────────────────────────
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.put('/auth/change-password', authenticate, authController.changePassword);

// ─── Restaurant Routes ─────────────────────────────────────
router.get('/restaurants', restaurantController.getRestaurants);
router.get('/restaurants/partner/mine', authenticate, authorize('partner'), restaurantController.getMyRestaurant);
router.post('/restaurants', authenticate, authorize('partner'), restaurantController.createRestaurant);
router.get('/restaurants/:id', restaurantController.getRestaurant);
router.put('/restaurants/:id', authenticate, authorize('partner', 'admin', 'super_admin'), restaurantController.updateRestaurant);
router.get('/restaurants/:id/menu', restaurantController.getMenu);
router.post('/restaurants/:id/menu/items', authenticate, authorize('partner'), restaurantController.addMenuItem);
router.put('/restaurants/menu/items/:itemId', authenticate, authorize('partner'), restaurantController.updateMenuItem);
router.get('/restaurants/:id/tables', restaurantController.getTables);

// ─── Order Routes ──────────────────────────────────────────
router.post('/orders', authenticate, authorize('customer'), orderController.createOrder);
router.get('/orders', authenticate, orderController.getMyOrders);
router.get('/orders/partner/restaurant', authenticate, authorize('partner'), orderController.getPartnerOrders);
router.get('/orders/partner/stats', authenticate, authorize('partner'), orderController.getPartnerStats);
router.get('/orders/:id', authenticate, orderController.getOrder);
router.patch('/orders/:id/status', authenticate, authorize('partner', 'admin', 'super_admin'), orderController.updateOrderStatus);
router.post('/orders/:id/review', authenticate, authorize('customer'), orderController.addReview);

// ─── Payment Routes ────────────────────────────────────────
router.get('/payments/config', paymentController.getConfig);
router.post('/payments/create-intent', authenticate, paymentController.createPaymentIntent);
router.post('/payments/confirm', authenticate, paymentController.confirmPayment);
router.post('/payments/refund', authenticate, authorize('admin', 'super_admin'), paymentController.refundPayment);

// ─── Address Routes ────────────────────────────────────────
router.get('/addresses', authenticate, addressController.getAddresses);
router.post('/addresses', authenticate, addressController.addAddress);
router.put('/addresses/:id', authenticate, addressController.updateAddress);
router.delete('/addresses/:id', authenticate, addressController.deleteAddress);

// ─── Admin Routes ──────────────────────────────────────────
router.get('/admin/stats', authenticate, authorize('admin', 'super_admin'), adminController.getDashboardStats);
router.get('/admin/users', authenticate, authorize('admin', 'super_admin'), adminController.getUsers);
router.patch('/admin/users/:id', authenticate, authorize('admin', 'super_admin'), adminController.updateUser);
router.get('/admin/restaurants', authenticate, authorize('admin', 'super_admin'), adminController.getRestaurants);
router.patch('/admin/restaurants/:id', authenticate, authorize('admin', 'super_admin'), adminController.updateRestaurant);
router.get('/admin/orders', authenticate, authorize('admin', 'super_admin'), adminController.getOrders);
router.get('/admin/revenue-chart', authenticate, authorize('admin', 'super_admin'), adminController.getRevenueChart);

module.exports = router;
