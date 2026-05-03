const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, amount, currency = 'inr' } = req.body;
    const order = await Order.findOne({ _id: orderId, customerId: req.user._id });
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Order already paid' });

    const amountInPaise = Math.round(parseFloat(amount) * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise, currency,
      metadata: { orderId: orderId.toString(), orderNumber: order.orderNumber, customerId: req.user._id.toString() },
      description: `Crave Order #${order.orderNumber}`,
    });

    await Order.findByIdAndUpdate(orderId, { stripePaymentIntentId: paymentIntent.id });
    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id } });
  } catch (err) {
    console.error('Create payment intent error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: 'paid', status: 'confirmed', stripeChargeId: paymentIntent.latest_charge },
        { new: true }
      ).populate('restaurantId', 'name');
      res.json({ success: true, data: order });
    } else {
      res.status(400).json({ success: false, message: `Payment status: ${paymentIntent.status}` });
    }
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      await Order.findOneAndUpdate({ stripePaymentIntentId: pi.id }, { paymentStatus: 'paid', status: 'confirmed' });
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      await Order.findOneAndUpdate({ stripePaymentIntentId: pi.id }, { paymentStatus: 'failed' });
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      await Order.findOneAndUpdate({ stripeChargeId: charge.id }, { paymentStatus: 'refunded', status: 'refunded' });
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.json({ received: true });
  }
};

const refundPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.body.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.stripeChargeId) return res.status(400).json({ success: false, message: 'No charge found' });
    const refund = await stripe.refunds.create({ charge: order.stripeChargeId });
    await Order.findByIdAndUpdate(req.body.orderId, { paymentStatus: 'refunded', status: 'refunded' });
    res.json({ success: true, data: refund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getConfig = (req, res) => {
  res.json({ success: true, data: { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY } });
};

module.exports = { createPaymentIntent, confirmPayment, handleWebhook, refundPayment, getConfig };
