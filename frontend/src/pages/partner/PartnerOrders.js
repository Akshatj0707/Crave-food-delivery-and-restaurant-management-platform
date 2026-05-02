import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChefHat, Package, Truck, Clock, RefreshCw } from 'lucide-react';
import { orderAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_FLOW = {
  pending:  { next: 'confirmed',        label: 'Confirm Order', color: 'var(--info)',    icon: CheckCircle },
  confirmed:{ next: 'preparing',        label: 'Start Preparing', color: '#7C3AED',      icon: ChefHat },
  preparing:{ next: 'ready',            label: 'Mark Ready',    color: 'var(--success)', icon: Package },
  ready:    { next: 'out_for_delivery', label: 'Out for Delivery', color: 'var(--info)', icon: Truck },
  out_for_delivery: { next: 'delivered', label: 'Mark Delivered', color: 'var(--success)', icon: CheckCircle },
};

const STATUS_COLORS = {
  pending: 'var(--warning)', confirmed: 'var(--info)', preparing: '#7C3AED',
  ready: 'var(--success)', out_for_delivery: 'var(--info)',
  delivered: 'var(--success)', cancelled: 'var(--error)'
};

const MODE_ICONS = { delivery: '🚴', takeaway: '🥡', dine_in: '🍽️' };

function OrderCard({ order, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const flow = STATUS_FLOW[order.status];

  const handleUpdate = async () => {
    if (!flow) return;
    setUpdating(true);
    try {
      await orderAPI.updateStatus(order.id, { status: flow.next });
      onStatusUpdate(order.id, flow.next);
      toast.success(`Order marked as ${flow.next.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdating(true);
    try {
      await orderAPI.updateStatus(order.id, { status: 'cancelled' });
      onStatusUpdate(order.id, 'cancelled');
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel');
    } finally {
      setUpdating(false);
    }
  };

  const statusColor = STATUS_COLORS[order.status] || 'var(--gray-500)';

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: `1px solid var(--gray-200)`, borderLeft: `4px solid ${statusColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 16 }}>#{order.order_number?.slice(-8)}</span>
            <span style={{ fontSize: 18 }}>{MODE_ICONS[order.service_mode]}</span>
            <span style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'capitalize' }}>{order.service_mode?.replace('_', ' ')}</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
            {order.first_name} {order.last_name}
          </p>
          {order.customer_phone && (
            <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>📞 {order.customer_phone}</p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, background: `${statusColor}18`, color: statusColor, textTransform: 'capitalize', marginBottom: 6 }}>
            {order.status?.replace(/_/g, ' ')}
          </span>
          <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>
            {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Items */}
      <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
        {order.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: i < order.items.length - 1 ? 6 : 0, marginBottom: i < order.items.length - 1 ? 6 : 0, borderBottom: i < order.items.length - 1 ? '1px dashed var(--gray-200)' : 'none' }}>
            <span style={{ color: 'var(--gray-700)' }}>×{item.quantity} {item.name}</span>
            <span style={{ fontWeight: 700 }}>₹{parseFloat(item.total || item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--gray-200)' }}>
          <span>Total</span>
          <span style={{ color: 'var(--crave-orange)' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {order.special_instructions && (
        <div style={{ background: 'var(--warning-bg)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: 'var(--warning)', fontWeight: 500 }}>
          📝 {order.special_instructions}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {flow && (
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="btn btn-primary btn-sm"
            style={{ background: flow.color, flex: 1 }}
          >
            <flow.icon size={14} />
            {updating ? 'Updating...' : flow.label}
          </button>
        )}
        {['pending', 'confirmed'].includes(order.status) && (
          <button
            onClick={handleCancel}
            disabled={updating}
            className="btn btn-sm"
            style={{ background: 'var(--error-bg)', color: 'var(--error)', border: 'none' }}
          >Cancel</button>
        )}
      </div>
    </div>
  );
}

export default function PartnerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('active');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter === 'active') params.status = 'pending';
      else if (activeFilter !== 'all') params.status = activeFilter;
      const res = await orderAPI.getPartnerOrders({ ...params, limit: 50 });
      let data = res.data.data;
      // For "active" show pending/confirmed/preparing/ready
      if (activeFilter === 'active') {
        const active = await Promise.all(
          ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].map(s =>
            orderAPI.getPartnerOrders({ status: s, limit: 50 })
          )
        );
        data = active.flatMap(r => r.data.data).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      .filter(o => {
        if (activeFilter === 'active') return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status);
        if (activeFilter !== 'all') return o.status === activeFilter;
        return true;
      })
    );
  };

  const FILTERS = [
    { key: 'active', label: '🔥 Active', count: orders.filter(o => ['pending','confirmed','preparing','ready','out_for_delivery'].includes(o.status)).length },
    { key: 'all', label: 'All Orders' },
    { key: 'delivered', label: '✓ Delivered' },
    { key: 'cancelled', label: '✗ Cancelled' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <PartnerOrdersNav />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Order Management</h1>
            <p style={{ color: 'var(--gray-500)' }}>{orders.length} orders</p>
          </div>
          <button onClick={fetchOrders} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeFilter === f.key ? 'var(--crave-orange)' : 'white',
              color: activeFilter === f.key ? 'white' : 'var(--gray-600)',
              border: activeFilter === f.key ? 'none' : '1.5px solid var(--gray-200)'
            }}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Package size={56} color="var(--gray-300)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>No orders</h3>
            <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnerOrdersNav() {
  const { logout } = useAuth();
  return (
    <nav style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link to="/partner" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: 'var(--crave-orange)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16 }}>C</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18 }}>Crave</span>
        </Link>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Partner Hub</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[{ to: '/partner', l: 'Dashboard' }, { to: '/partner/orders', l: 'Orders' }, { to: '/partner/menu', l: 'Menu' }].map(({ to, l }) => (
          <Link key={to} to={to}><button className="btn btn-ghost btn-sm">{l}</button></Link>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: 'var(--error)' }}>Sign Out</button>
      </div>
    </nav>
  );
}
