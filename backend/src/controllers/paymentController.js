const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/database');

// POST /api/payments/create-intent
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, amount, currency = 'inr' } = req.body;

    // Verify order belongs to user
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
      [orderId, req.user.id]
    );
    if (!orderResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderResult.rows[0];
    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    // amount in paise (smallest INR unit)
    const amountInPaise = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency,
      metadata: {
        orderId,
        orderNumber: order.order_number,
        customerId: req.user.id
      },
      description: `Crave Order #${order.order_number}`
    });

    // Store payment intent ID
    await pool.query(
      'UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, orderId]
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (err) {
    console.error('Create payment intent error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/confirm
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await pool.query(`
        UPDATE orders SET
          payment_status = 'paid',
          status = 'confirmed',
          stripe_charge_id = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [paymentIntent.latest_charge, orderId]);

      const orderResult = await pool.query(`
        SELECT o.*, r.name as restaurant_name 
        FROM orders o JOIN restaurants r ON r.id = o.restaurant_id 
        WHERE o.id = $1
      `, [orderId]);

      res.json({ success: true, data: orderResult.rows[0] });
    } else {
      res.status(400).json({ success: false, message: `Payment status: ${paymentIntent.status}` });
    }
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/webhook (Stripe webhook)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      await pool.query(`
        UPDATE orders SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
        WHERE stripe_payment_intent_id = $1
      `, [pi.id]);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await pool.query(`
        UPDATE orders SET payment_status = 'failed', updated_at = NOW()
        WHERE stripe_payment_intent_id = $1
      `, [pi.id]);
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object;
      await pool.query(`
        UPDATE orders SET payment_status = 'refunded', status = 'refunded', updated_at = NOW()
        WHERE stripe_charge_id = $1
      `, [charge.id]);
      break;
    }
  }

  res.json({ received: true });
};

// POST /api/payments/refund
const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!orderResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderResult.rows[0];

    if (!order.stripe_charge_id) {
      return res.status(400).json({ success: false, message: 'No charge found for this order' });
    }

    const refund = await stripe.refunds.create({ charge: order.stripe_charge_id });

    await pool.query(`
      UPDATE orders SET payment_status = 'refunded', status = 'refunded', updated_at = NOW()
      WHERE id = $1
    `, [orderId]);

    res.json({ success: true, data: refund });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments/config - Return publishable key
const getConfig = async (req, res) => {
  res.json({
    success: true,
    data: { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY }
  });
};

module.exports = { createPaymentIntent, confirmPayment, handleWebhook, refundPayment, getConfig };
