require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Address = require('../models/Address');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Address.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    const hash = await bcrypt.hash('password123', 12);

    // Create users
    const [superAdmin, admin, partner1, partner2, customer] = await User.create([
      { email: 'superadmin@crave.com', passwordHash: hash, role: 'super_admin', firstName: 'Super', lastName: 'Admin', phone: '9999999999', isVerified: true },
      { email: 'admin@crave.com', passwordHash: hash, role: 'admin', firstName: 'Crave', lastName: 'Admin', phone: '9888888888', isVerified: true },
      { email: 'partner1@crave.com', passwordHash: hash, role: 'partner', firstName: 'Raj', lastName: 'Sharma', phone: '9777777771', isVerified: true },
      { email: 'partner2@crave.com', passwordHash: hash, role: 'partner', firstName: 'Priya', lastName: 'Patel', phone: '9777777772', isVerified: true },
      { email: 'customer@crave.com', passwordHash: hash, role: 'customer', firstName: 'Arjun', lastName: 'Verma', phone: '9666666661', isVerified: true },
    ]);
    console.log('👥 Users created');

    // Customer address
    await Address.create({
      userId: customer._id, label: 'Home',
      addressLine1: '101 Palm Street, Bandra West',
      city: 'Mumbai', state: 'Maharashtra', pincode: '400050', isDefault: true,
    });

    // Business hours helper
    const defaultHours = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i, openTime: '10:00', closeTime: '23:00', isClosed: i === 1,
    }));

    // Restaurant 1 — Spice Garden
    const spiceGarden = await Restaurant.create({
      ownerId: partner1._id,
      name: 'Spice Garden',
      description: 'Authentic North Indian cuisine with aromatic spices and rich gravies',
      cuisineTypes: ['North Indian', 'Mughlai', 'Biryani'],
      logoUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=400&fit=crop',
      addressLine1: 'Shop 12, MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001',
      phone: '022-12345678', avgRating: 4.5, totalRatings: 1250, avgDeliveryTime: 35,
      deliveryFee: 40, minOrderAmount: 200, supportsDelivery: true,
      supportsTakeaway: true, supportsDineIn: true, totalTables: 12,
      isOpen: true, isVerified: true, isFeatured: true,
      businessHours: defaultHours,
      tables: Array.from({ length: 12 }, (_, i) => ({
        tableNumber: `T${i + 1}`, capacity: i < 4 ? 2 : i < 8 ? 4 : 6, isAvailable: true,
      })),
      menu: [
        {
          name: 'Starters', sortOrder: 0,
          items: [
            { name: 'Paneer Tikka', description: 'Cottage cheese marinated in spices, grilled in tandoor', price: 280, isVeg: true, isFeatured: true, spiceLevel: 2, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
            { name: 'Veg Seekh Kebab', description: 'Mixed vegetable kebabs on skewers', price: 220, isVeg: true, spiceLevel: 1, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
            { name: 'Chicken Tikka', description: 'Boneless chicken marinated in yogurt and spices', price: 320, isVeg: false, isFeatured: true, spiceLevel: 2, imageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400&h=300&fit=crop' },
          ],
        },
        {
          name: 'Main Course', sortOrder: 1,
          items: [
            { name: 'Butter Chicken', description: 'Tender chicken in rich tomato-butter gravy', price: 380, isVeg: false, isFeatured: true, spiceLevel: 1, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
            { name: 'Dal Makhani', description: 'Black lentils slow-cooked with butter and cream', price: 280, isVeg: true, spiceLevel: 0, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
            { name: 'Palak Paneer', description: 'Cottage cheese in smooth spinach gravy', price: 300, isVeg: true, spiceLevel: 1, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
          ],
        },
        {
          name: 'Biryani', sortOrder: 2,
          items: [
            { name: 'Veg Dum Biryani', description: 'Aromatic basmati rice with vegetables', price: 320, isVeg: true, isFeatured: true, spiceLevel: 2, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop' },
            { name: 'Chicken Dum Biryani', description: 'Slow-cooked chicken with fragrant basmati rice', price: 420, isVeg: false, isFeatured: true, spiceLevel: 2, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop' },
          ],
        },
        {
          name: 'Breads', sortOrder: 3,
          items: [
            { name: 'Butter Naan', description: 'Soft leavened bread baked in tandoor with butter', price: 50, isVeg: true, spiceLevel: 0, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
            { name: 'Garlic Naan', description: 'Naan topped with garlic and herbs', price: 60, isVeg: true, spiceLevel: 0, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
          ],
        },
      ],
    });

    // Restaurant 2 — Pizza Paradise
    await Restaurant.create({
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
      businessHours: defaultHours,
      tables: Array.from({ length: 8 }, (_, i) => ({ tableNumber: `T${i+1}`, capacity: i < 4 ? 2 : 4, isAvailable: true })),
      menu: [
        {
          name: 'Pizzas', sortOrder: 0,
          items: [
            { name: 'Margherita', description: 'Classic tomato, fresh mozzarella, basil', price: 350, isVeg: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop' },
            { name: 'Pepperoni', description: 'Loaded with premium pepperoni and mozzarella', price: 450, isVeg: false, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop' },
            { name: 'Farmhouse', description: 'Capsicum, onion, mushroom, corn', price: 400, isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
          ],
        },
        {
          name: 'Pasta', sortOrder: 1,
          items: [
            { name: 'Pasta Arrabbiata', description: 'Penne in spicy tomato sauce', price: 280, isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop' },
            { name: 'Pasta Alfredo', description: 'Fettuccine in creamy white sauce', price: 300, isVeg: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
          ],
        },
        {
          name: 'Sides', sortOrder: 2,
          items: [
            { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 120, isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop' },
            { name: 'Caesar Salad', description: 'Crisp romaine, croutons, parmesan', price: 200, isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop' },
          ],
        },
      ],
    });

    // Restaurant 3 — Burger Barn
    await Restaurant.create({
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
      businessHours: defaultHours,
      menu: [
        {
          name: 'Burgers', sortOrder: 0,
          items: [
            { name: 'Classic Cheeseburger', description: 'Beef patty, cheddar, lettuce, tomato', price: 280, isVeg: false, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
            { name: 'Crispy Veg Burger', description: 'Crispy veggie patty with jalapeños', price: 220, isVeg: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop' },
            { name: 'Double Stack Burger', description: 'Double beef patty, bacon, special sauce', price: 380, isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop' },
          ],
        },
        {
          name: 'Sides & Drinks', sortOrder: 1,
          items: [
            { name: 'French Fries', description: 'Crispy golden fries with seasoning', price: 120, isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
            { name: 'Onion Rings', description: 'Golden crispy onion rings', price: 140, isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop' },
            { name: 'Milkshake', description: 'Thick creamy vanilla/chocolate/strawberry', price: 160, isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
          ],
        },
      ],
    });

    console.log('🏪 Restaurants created');
    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo accounts:');
    console.log('  superadmin@crave.com / password123');
    console.log('  admin@crave.com      / password123');
    console.log('  partner1@crave.com   / password123');
    console.log('  partner2@crave.com   / password123');
    console.log('  customer@crave.com   / password123');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seed();
