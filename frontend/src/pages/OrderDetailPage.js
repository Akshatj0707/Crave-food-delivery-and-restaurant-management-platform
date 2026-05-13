import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, Clock, CheckCircle, Package, Truck, Star } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { orderAPI } from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  confirmed: 'Order Confirmed', preparing: 'Preparing',
  ready: 'Ready', out_for_delivery: 'Out for Delivery', delivered: 'Delivered'
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined') { navigate('/orders'); return; }
    orderAPI.getById(id)
      .then(res => setOrder(res.data.data))
      .catch(() => { toast.error('Order not found'); navigate('/orders'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      await orderAPI.addReview(id, { rating, comment });
      toast.success('Review submitted! Thank you 🎉');
      setReviewDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div><Navbar /><div className="page-loader"><div className="spinner" /></div></div>;
  if (!order) return null;

  // Handle both MongoDB and old format
  const orderId = order._id || order.id;
  const orderNumber = order.orderNumber || order.order_number;
  const restName = order.restaurantId?.name || order.restaurant_name || 'Restaurant';
  const restPhone = order.restaurantId?.phone || order.restaurant_phone;
  const restAddress = order.restaurantId?.addressLine1 || order.restaurant_address;
  const deliveryAddr = order.deliveryAddressId;
  const custFirst = order.customerId?.firstName || order.customer_first_name || '';
  const custLast = order.customerId?.lastName || order.customer_last_name || '';
  const totalAmount = order.totalAmount || order.total_amount || 0;
  const subtotal = order.subtotal || 0;
  const deliveryFee = order.deliveryFee || order.delivery_fee || 0;
  const taxAmount = order.taxAmount || order.tax_amount || 0;
  const orderItems = order.items || [];
  const createdAt = order.createdAt || order.created_at;

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />
      <div className="container" style={{ padding: '40px 20px', maxWidth: 720 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate('/orders')} style={{
            background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10,
            padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 14
          }}>
            <ChevronLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900 }}>Order #{orderNumber}</h1>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
              {createdAt ? new Date(createdAt).toLocaleString('en-IN') : ''}
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        {!isCancelled && order.status !== 'pending' && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Order Status</h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIdx;
                const active = i === currentStepIdx;
                return (
                  <React.Fragment key={step}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: done ? 'var(--crave-orange)' : 'var(--gray-200)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: active ? 'var(--shadow-orange)' : 'none',
                        transform: active ? 'scale(1.15)' : 'scale(1)', transition: 'var(--transition)'
                      }}>
                        <CheckCircle size={18} color={done ? 'white' : 'var(--gray-400)'} />
                      </div>
                      <p style={{ fontSize: 10, fontWeight: done ? 700 : 400, color: done ? 'var(--crave-orange)' : 'var(--gray-400)', marginTop: 8, textAlign: 'center', maxWidth: 70 }}>
                        {STATUS_LABELS[step]}
                      </p>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 3, background: i < currentStepIdx ? 'var(--crave-orange)' : 'var(--gray-200)', marginBottom: 24, transition: 'var(--transition)' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {order.status === 'pending' && (
          <div style={{ background: 'var(--warning-bg)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24, border: '1px solid var(--warning)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>⏳</span>
            <div>
              <h3 style={{ fontWeight: 800, color: 'var(--warning)' }}>Awaiting Confirmation</h3>
              <p style={{ fontSize: 14, color: 'var(--warning)', marginTop: 2 }}>The restaurant will confirm your order shortly.</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div style={{ background: 'var(--error-bg)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24, border: '1px solid var(--error)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>❌</span>
            <div>
              <h3 style={{ fontWeight: 800, color: 'var(--error)' }}>Order Cancelled</h3>
              <p style={{ fontSize: 14, color: 'var(--error)', marginTop: 2 }}>This order has been cancelled.</p>
            </div>
          </div>
        )}

        {/* Restaurant & Address */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)', marginBottom: 12 }}>Restaurant</h3>
            <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{restName}</p>
            {restPhone && <p style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {restPhone}</p>}
            {restAddress && <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{restAddress}</p>}
          </div>
          {order.serviceMode === 'delivery' && deliveryAddr && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)', marginBottom: 12 }}>Delivery Address</h3>
              <p style={{ fontSize: 14, color: 'var(--gray-700)', display: 'flex', gap: 6 }}>
                <MapPin size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--crave-orange)' }} />
                {deliveryAddr.addressLine1 || deliveryAddr.address_line1}, {deliveryAddr.city}, {deliveryAddr.state} - {deliveryAddr.pincode}
              </p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
            <Package size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--crave-orange)' }} />
            Order Items
          </h3>
          {orderItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < orderItems.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ background: 'var(--crave-orange)', color: 'white', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{item.quantity}</span>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{item.name || item.item_name}</span>
              </div>
              <span style={{ fontWeight: 700 }}>₹{parseFloat(item.itemTotal || item.item_total || (item.price * item.quantity) || 0).toFixed(2)}</span>
            </div>
          ))}

          {/* Bill */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1.5px solid var(--gray-100)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Subtotal', `₹${parseFloat(subtotal).toFixed(2)}`],
              deliveryFee > 0 ? ['Delivery Fee', `₹${parseFloat(deliveryFee).toFixed(2)}`] : ['Delivery', 'Free'],
              ['GST (5%)', `₹${parseFloat(taxAmount).toFixed(2)}`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--gray-600)' }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 17, paddingTop: 12, borderTop: '2px solid var(--gray-200)', color: 'var(--gray-900)' }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--crave-orange)' }}>₹{parseFloat(totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Review */}
        {order.status === 'delivered' && !reviewDone && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Rate your experience</h3>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 20 }}>How was your food from {restName}?</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Star size={32} fill={s <= rating ? 'var(--warning)' : 'none'} color={s <= rating ? 'var(--warning)' : 'var(--gray-300)'} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Share your experience (optional)..." className="form-input" rows={3} style={{ resize: 'none', marginBottom: 16 }} />
            <button onClick={handleReview} disabled={submittingReview} className="btn btn-primary">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        {reviewDone && (
          <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--success)', textAlign: 'center' }}>
            <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 700, color: 'var(--success)' }}>Thank you for your review! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
