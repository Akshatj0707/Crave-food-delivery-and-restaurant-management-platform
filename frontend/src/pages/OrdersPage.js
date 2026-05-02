import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck, ChefHat } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { orderAPI } from '../utils/api';

const STATUS_CONFIG = {
  pending:          { label: 'Pending',          color: 'var(--warning)',  bg: 'var(--warning-bg)',  icon: Clock },
  confirmed:        { label: 'Confirmed',         color: 'var(--info)',     bg: 'var(--info-bg)',     icon: CheckCircle },
  preparing:        { label: 'Preparing',         color: '#7C3AED',         bg: '#F5F3FF',            icon: ChefHat },
  ready:            { label: 'Ready',             color: 'var(--success)',  bg: 'var(--success-bg)', icon: CheckCircle },
  out_for_delivery: { label: 'Out for Delivery',  color: 'var(--info)',     bg: 'var(--info-bg)',     icon: Truck },
  delivered:        { label: 'Delivered',         color: 'var(--success)',  bg: 'var(--success-bg)', icon: CheckCircle },
  cancelled:        { label: 'Cancelled',         color: 'var(--error)',    bg: 'var(--error-bg)',    icon: XCircle },
  refunded:         { label: 'Refunded',          color: 'var(--gray-500)', bg: 'var(--gray-100)',    icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 'var(--radius-full)',
      fontSize: 12, fontWeight: 700,
      color: cfg.color, background: cfg.bg
    }}>
      <Icon size={12} />{cfg.label}
    </span>
  );
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = activeTab !== 'all' ? { status: activeTab } : {};
        const res = await orderAPI.getMyOrders(params);
        setOrders(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [activeTab]);

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Active' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />
      <div className="container" style={{ padding: '40px 20px', maxWidth: 760 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 6 }}>My Orders</h1>
          <p style={{ color: 'var(--gray-500)' }}>Track and manage your food orders</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'white', padding: 4, borderRadius: 12, border: '1px solid var(--gray-200)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              flex: 1, padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'var(--transition)',
              background: activeTab === t.key ? 'var(--crave-orange)' : 'transparent',
              color: activeTab === t.key ? 'white' : 'var(--gray-600)',
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Package size={56} color="var(--gray-300)" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>No orders yet</h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Your order history will appear here</p>
            <Link to="/"><button className="btn btn-primary">Browse Restaurants</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <Link key={order.id} to={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 20, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {order.restaurant_logo && (
                        <img src={order.restaurant_logo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--gray-200)' }} />
                      )}
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>{order.restaurant_name}</h3>
                        <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                          #{order.order_number} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={order.status} />
                      <ChevronRight size={16} color="var(--gray-400)" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--gray-100)' }}>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {order.items?.slice(0, 2).map(i => i.name).join(', ')}
                      {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                    </p>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
