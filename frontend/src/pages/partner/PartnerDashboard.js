import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Clock, DollarSign, ChefHat, Package, BarChart2, Settings } from 'lucide-react';
import { orderAPI, restaurantAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--gray-900)', marginBottom: 4 }}>{value}</p>
        {sub && <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{sub}</p>}
      </div>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
      </div>
    </div>
  </div>
);

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderAPI.getPartnerStats(),
      restaurantAPI.getMine(),
      orderAPI.getPartnerOrders({ limit: 5 })
    ]).then(([statsRes, restRes, ordersRes]) => {
      setStats(statsRes.data.data);
      setRestaurant(restRes.data.data);
      setRecentOrders(ordersRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS = {
    pending: 'var(--warning)', confirmed: 'var(--info)', preparing: '#7C3AED',
    ready: 'var(--success)', delivered: 'var(--success)', cancelled: 'var(--error)'
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <PartnerNav />
      <div className="page-loader"><div className="spinner" /></div>
    </div>
  );

  if (!restaurant) return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <PartnerNav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 64 }}>🏪</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900 }}>Set up your restaurant</h2>
        <p style={{ color: 'var(--gray-500)' }}>Get started by creating your restaurant profile</p>
        <Link to="/partner/setup"><button className="btn btn-primary btn-lg">Create Restaurant →</button></Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <PartnerNav restaurant={restaurant} />
      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
              Partner Hub
            </h1>
            <p style={{ color: 'var(--gray-500)' }}>Welcome back, {user.first_name} 👋</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              borderRadius: 'var(--radius-full)', background: restaurant.is_open ? 'var(--success-bg)' : 'var(--error-bg)',
              border: `1px solid ${restaurant.is_open ? 'var(--success)' : 'var(--error)'}`,
              fontSize: 13, fontWeight: 700,
              color: restaurant.is_open ? 'var(--success)' : 'var(--error)'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: restaurant.is_open ? 'var(--success)' : 'var(--error)', animation: restaurant.is_open ? 'pulse 2s infinite' : 'none' }} />
              {restaurant.is_open ? 'Open' : 'Closed'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginBottom: 36 }}>
          <StatCard label="Today's Orders" value={stats?.today_orders || 0} sub={`${stats?.today_paid_orders || 0} paid`} icon={ShoppingBag} color="var(--crave-orange)" />
          <StatCard label="Today's Revenue" value={`₹${parseFloat(stats?.today_revenue || 0).toFixed(0)}`} sub="from paid orders" icon={DollarSign} color="var(--success)" />
          <StatCard label="Active Orders" value={stats?.pending_orders || 0} sub="need attention" icon={Clock} color="var(--warning)" />
          <StatCard label="Total Revenue" value={`₹${parseFloat(stats?.total_revenue || 0).toFixed(0)}`} sub={`${stats?.total_orders || 0} total orders`} icon={TrendingUp} color="var(--info)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Recent orders */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>Recent Orders</h3>
              <Link to="/partner/orders"><button className="btn btn-ghost btn-sm">View All →</button></Link>
            </div>
            {recentOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Package size={40} color="var(--gray-300)" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--gray-500)' }}>No orders yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {recentOrders.map((order, i) => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < recentOrders.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{order.first_name} {order.last_name}</span>
                        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>#{order.order_number?.slice(-6)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                        {order.items?.slice(0,2).map(i => i.name).join(', ')}
                        {order.items?.length > 2 && ` +${order.items.length - 2}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>₹{parseFloat(order.total_amount).toFixed(0)}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${STATUS_COLORS[order.status]}18`, color: STATUS_COLORS[order.status] }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Quick Actions</h3>
              {[
                { to: '/partner/orders', icon: Package, label: 'Manage Orders', desc: 'View & update orders', color: 'var(--crave-orange)' },
                { to: '/partner/menu', icon: ChefHat, label: 'Manage Menu', desc: 'Add or edit items', color: 'var(--info)' },
                { to: '/partner/setup', icon: Settings, label: 'Restaurant Settings', desc: 'Hours, info, modes', color: 'var(--success)' },
              ].map(({ to, icon: Icon, label, desc, color }) => (
                <Link key={to} to={to}>
                  <div style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: 10, cursor: 'pointer', marginBottom: 8, transition: 'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={color} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{label}</p>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Restaurant info */}
            <div style={{ background: 'var(--crave-orange)', borderRadius: 'var(--radius-lg)', padding: 24, color: 'white' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{restaurant.name}</h4>
              <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>{restaurant.cuisine_types?.join(' · ')}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {restaurant.supports_delivery && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20 }}>🚴 Delivery</span>}
                {restaurant.supports_takeaway && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20 }}>🥡 Takeaway</span>}
                {restaurant.supports_dine_in && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20 }}>🍽️ Dine-in</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Partner Navbar
function PartnerNav({ restaurant }) {
  const { user, logout } = useAuth();
  return (
    <nav style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
