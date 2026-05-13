import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { MapPin, CreditCard, Smartphone, Building2, Bike, Utensils, UtensilsCrossed, Plus } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI, addressAPI } from '../utils/api';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'netbanking', label: 'Net Banking', icon: Building2 },
];

const SERVICE_MODES = [
  { id: 'delivery', label: 'Delivery', icon: Bike, desc: 'Delivered to your door' },
  { id: 'takeaway', label: 'Takeaway', icon: Utensils, desc: 'Pick up from restaurant' },
  { id: 'dine_in', label: 'Dine-in', icon: UtensilsCrossed, desc: 'Eat at the restaurant' },
];

function CheckoutForm({ order, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [payMethod, setPayMethod] = useState('card');
  const [cardError, setCardError] = useState('');

  const handlePay = async () => {
    if (!order?.id && !order?._id) {
      toast.error('Invalid order');
      return;
    }
    setProcessing(true);
    try {
      const orderId = order._id || order.id;
      const intentRes = await paymentAPI.createIntent({
        orderId,
        amount: order.total_amount || order.totalAmount
      });
      const { clientSecret } = intentRes.data.data;

      if (payMethod === 'card') {
        if (!stripe || !elements) {
          toast.error('Stripe not loaded');
          return;
        }
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: { name: order.customer_name || 'Customer' }
          }
        });
        if (result.error) {
          setCardError(result.error.message);
          toast.error(result.error.message);
          return;
        }
        if (result.paymentIntent?.status === 'succeeded') {
          await paymentAPI.confirm({ paymentIntentId: result.paymentIntent.id, orderId });
          onSuccess(orderId);
        }
      } else {
        // Demo UPI/NetBanking
        toast.loading('Processing payment...', { duration: 2000 });
        await new Promise(r => setTimeout(r, 2000));
        try {
          await paymentAPI.confirm({ paymentIntentId: 'demo_' + Date.now(), orderId });
        } catch {}
        onSuccess(orderId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = order?.total_amount || order?.totalAmount || 0;

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
        <CreditCard size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--crave-orange)' }} />
        Payment Method
      </h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setPayMethod(id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
            background: payMethod === id ? 'var(--crave-orange-pale)' : 'var(--gray-50)',
            border: payMethod === id ? '2px solid var(--crave-orange)' : '1.5px solid var(--gray-200)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: payMethod === id ? 'var(--crave-orange)' : 'var(--gray-600)',
            fontWeight: payMethod === id ? 700 : 500, transition: 'var(--transition)'
          }}>
            <Icon size={18} /><span style={{ fontSize: 11 }}>{label}</span>
          </button>
        ))}
      </div>

      {payMethod === 'card' && (
        <div>
          <div style={{ border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, background: 'var(--gray-50)' }}>
            <CardElement options={{
              style: {
                base: { fontSize: '15px', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#171717', '::placeholder': { color: '#a3a3a3' } },
                invalid: { color: '#DC2626' }
              }
            }} onChange={e => setCardError(e.error?.message || '')} />
          </div>
          {cardError && <p style={{ fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>{cardError}</p>}
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16 }}>
            🔒 Test card: <strong>4242 4242 4242 4242</strong> · Any future date · Any 3-digit CVC
          </p>
        </div>
      )}

      {payMethod === 'upi' && (
        <div style={{ marginBottom: 16 }}>
          <input className="form-input" placeholder="Enter UPI ID (e.g. name@upi)" style={{ marginBottom: 6 }} />
          <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Demo mode: payment will be simulated</p>
        </div>
      )}

      {payMethod === 'netbanking' && (
        <div style={{ marginBottom: 16 }}>
          <select className="form-input" style={{ marginBottom: 6 }}>
            <option>Select Bank</option>
            <option>State Bank of India</option>
            <option>HDFC Bank</option>
            <option>ICICI Bank</option>
            <option>Axis Bank</option>
          </select>
          <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Demo mode: payment will be simulated</p>
        </div>
      )}

      <button onClick={handlePay} disabled={processing}
        className="btn btn-primary" style={{ width: '100%', fontSize: 16, padding: '16px' }}>
        {processing ? 'Processing...' : `Pay ₹${parseFloat(totalAmount).toFixed(2)}`}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, restaurantId, serviceMode, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedMode, setSelectedMode] = useState(serviceMode || 'delivery');
  const [instructions, setInstructions] = useState('');
  const [order, setOrder] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', addressLine1: '', city: '', state: '', pincode: '' });

  const TAX_RATE = 0.05;
  const DELIVERY_FEE = selectedMode === 'delivery' ? 40 : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + DELIVERY_FEE;

  useEffect(() => {
    if (!items.length) { navigate('/'); return; }
    addressAPI.getAll().then(res => {
      const addrs = res.data.data || [];
      setAddresses(addrs);
      const def = addrs.find(a => a.isDefault || a.is_default) || addrs[0];
      if (def) setSelectedAddress(def._id || def.id);
    }).catch(() => {});
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await addressAPI.add({ ...newAddress, isDefault: addresses.length === 0 });
      const addr = res.data.data;
      setAddresses(prev => [...prev, addr]);
      setSelectedAddress(addr._id || addr.id);
      setShowAddAddress(false);
      setNewAddress({ label: 'Home', addressLine1: '', city: '', state: '', pincode: '' });
      toast.success('Address added!');
    } catch { toast.error('Failed to add address'); }
  };

  const handleCreateOrder = async () => {
    if (selectedMode === 'delivery' && !selectedAddress) {
      toast.error('Please select or add a delivery address');
      return;
    }
    setCreatingOrder(true);
    try {
      const orderData = {
        restaurantId,
        serviceMode: selectedMode,
        items: items.map(i => ({
          menuItemId: i.id || i._id,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        deliveryAddressId: selectedMode === 'delivery' ? selectedAddress : null,
        specialInstructions: instructions,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        taxAmount: tax,
        discountAmount: 0,
        totalAmount: total
      };
      const res = await orderAPI.create(orderData);
      const createdOrder = res.data.data;
      setOrder({
        ...createdOrder,
        customer_name: `${user.firstName || user.first_name} ${user.lastName || user.last_name}`,
        total_amount: total,
        totalAmount: total,
      });
      toast.success('Order created! Complete payment below.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = (orderId) => {
    clearCart();
    toast.success('🎉 Order placed successfully!');
    navigate(`/orders/${orderId}`);
  };

  if (!items.length) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />
      <div className="container" style={{ padding: '40px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 32 }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Service Mode */}
            {!order && (
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Order Type</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {SERVICE_MODES.map(({ id, label, icon: Icon, desc }) => (
                    <button key={id} onClick={() => setSelectedMode(id)} style={{
                      padding: '16px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      background: selectedMode === id ? 'var(--crave-orange-pale)' : 'var(--gray-50)',
                      border: selectedMode === id ? '2px solid var(--crave-orange)' : '1.5px solid var(--gray-200)',
                    }}>
                      <Icon size={22} color={selectedMode === id ? 'var(--crave-orange)' : 'var(--gray-500)'} style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: selectedMode === id ? 'var(--crave-orange)' : 'var(--gray-800)' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 3 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            {!order && selectedMode === 'delivery' && (
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                  <MapPin size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--crave-orange)' }} />
                  Delivery Address
                </h3>

                {addresses.length === 0 && !showAddAddress ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>No saved addresses. Add one to continue.</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddAddress(true)}>
                      <Plus size={15} /> Add Address
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                      {addresses.map(addr => {
                        const addrId = addr._id || addr.id;
                        return (
                          <label key={addrId} style={{
                            display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                            border: selectedAddress === addrId ? '2px solid var(--crave-orange)' : '1.5px solid var(--gray-200)',
                            background: selectedAddress === addrId ? 'var(--crave-orange-pale)' : 'white'
                          }}>
                            <input type="radio" name="address" value={addrId}
                              checked={selectedAddress === addrId}
                              onChange={() => setSelectedAddress(addrId)}
                              style={{ accentColor: 'var(--crave-orange)', marginTop: 2 }} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{addr.label || 'Home'}</div>
                              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                                {addr.addressLine1 || addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddAddress(!showAddAddress)}>
                      <Plus size={14} /> Add New Address
                    </button>
                  </>
                )}

                {showAddAddress && (
                  <form onSubmit={handleAddAddress} style={{ marginTop: 16, padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
                    <h4 style={{ fontWeight: 700, marginBottom: 12 }}>New Address</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label className="form-label">Label</label>
                        <select value={newAddress.label} onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))} className="form-input">
                          <option>Home</option><option>Work</option><option>Other</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label className="form-label">Street Address *</label>
                        <input type="text" value={newAddress.addressLine1} onChange={e => setNewAddress(p => ({ ...p, addressLine1: e.target.value }))} className="form-input" required placeholder="Building, Street..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <input type="text" value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State *</label>
                        <input type="text" value={newAddress.state} onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Pincode *</label>
                        <input type="text" value={newAddress.pincode} onChange={e => setNewAddress(p => ({ ...p, pincode: e.target.value }))} className="form-input" required maxLength={6} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddAddress(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm">Save Address</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Special Instructions */}
            {!order && (
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Special Instructions</h3>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                  placeholder="Any special requests? (allergies, customizations...)"
                  className="form-input" rows={3} style={{ resize: 'none' }} />
              </div>
            )}

            {/* Payment */}
            {order ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm order={order} onSuccess={handlePaymentSuccess} />
              </Elements>
            ) : (
              <button className="btn btn-primary" onClick={handleCreateOrder} disabled={creatingOrder}
                style={{ padding: '18px', fontSize: 16 }}>
                {creatingOrder ? 'Creating Order...' : 'Proceed to Payment →'}
              </button>
            )}
          </div>

          {/* Order Summary */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', position: 'sticky', top: 80 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {items.map(item => (
                <div key={item.id || item._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    <span style={{ background: 'var(--crave-orange)', color: 'white', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{item.quantity}</span>
                    <span style={{ fontSize: 14, color: 'var(--gray-700)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, flexShrink: 0 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 16, marginBottom: 16 }}>
              {[
                ['Subtotal', `₹${subtotal.toFixed(2)}`],
                ['Delivery', DELIVERY_FEE > 0 ? `₹${DELIVERY_FEE.toFixed(2)}` : 'Free'],
                ['GST (5%)', `₹${tax.toFixed(2)}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--gray-600)' }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18, padding: '14px 0', borderTop: '2px solid var(--gray-200)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--crave-orange)' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
