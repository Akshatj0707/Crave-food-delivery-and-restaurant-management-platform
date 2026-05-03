const mongoose = require('mongoose');

// Customization option sub-schema
const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  extraPrice: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
});

// Customization sub-schema
const customizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['single', 'multiple'], default: 'single' },
  isRequired: { type: Boolean, default: false },
  options: [customizationOptionSchema],
});

// Menu item sub-schema
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number },
  imageUrl: { type: String },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  spiceLevel: { type: Number, default: 0, min: 0, max: 3 },
  preparationTime: { type: Number, default: 20 },
  tags: [String],
  sortOrder: { type: Number, default: 0 },
  customizations: [customizationSchema],
}, { timestamps: true });

// Menu category sub-schema
const menuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  items: [menuItemSchema],
});

// Business hours sub-schema
const businessHoursSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 },
  openTime: { type: String, default: '10:00' },
  closeTime: { type: String, default: '23:00' },
  isClosed: { type: Boolean, default: false },
});

// Table sub-schema (for dine-in)
const tableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true },
  capacity: { type: Number, default: 2 },
  isAvailable: { type: Boolean, default: true },
  qrCode: { type: String },
});

// Main restaurant schema
const restaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  cuisineTypes: [String],
  logoUrl: { type: String },
  coverImageUrl: { type: String },
  addressLine1: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  phone: { type: String },
  email: { type: String },
  avgRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  avgDeliveryTime: { type: Number, default: 30 },
  deliveryFee: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 },
  supportsDelivery: { type: Boolean, default: true },
  supportsTakeaway: { type: Boolean, default: true },
  supportsDineIn: { type: Boolean, default: false },
  totalTables: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  menu: [menuCategorySchema],
  businessHours: [businessHoursSchema],
  tables: [tableSchema],
}, { timestamps: true });

// Text search index
restaurantSchema.index({ name: 'text', cuisineTypes: 'text', city: 'text' });
restaurantSchema.index({ isVerified: 1, isFeatured: -1, avgRating: -1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
