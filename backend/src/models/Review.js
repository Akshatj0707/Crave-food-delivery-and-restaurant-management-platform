const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  reply: { type: String },
  repliedAt: { type: Date },
}, { timestamps: true });

reviewSchema.index({ restaurantId: 1 });
reviewSchema.index({ orderId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
