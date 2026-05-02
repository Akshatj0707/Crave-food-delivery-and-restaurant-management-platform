import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Store, ShoppingBag, TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ label, value, sub, icon: Icon, color, to }) => (
  <Link to={to || '#'} style={{ textDecoration: 'none' }}>
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', cursor: to ? 'pointer' : 'default', transition: 'var(--transition-slow)' }}
      onMouseEnter={e => { if(to) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 30, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--gray-900)', marginBottom: 4 }}>{value}</p>
          {sub && <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{sub}</p>}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  </Link>
);

function AdminNav() {
  const { logout } = useAuth();
  const navLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/restaurants', label: 'Restaurants' },
    { to: '/admin/orders', label: 'Orders' },
  ];
  return (
    <nav style={{ background: 'var(--gray-900)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: 'var(--crave-orange)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16 }}>C</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'white' }}>Crave</span>
        </Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to}>
              <button style={{ padding: '8px 14px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = 'white'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
              >{label}</button>
            </Link>
          ))}
        </div>
      </div>
      <button className="btn btn-sm" onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: 'none' }}>Sign Out</button>
    </nav>
  );
}

export { AdminNav };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getOrders({ limit: 8 })
    ]).then(([statsRes, ordersRes]) => {
      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS = {
    pending: 'var(--warning)', confirmed: 'var(--info)', preparing: '#7C3AED',
    ready: 'var(--success)', out_for_delivery: 'var(--info)',
    delivered: 'var(--success)', cancelled: 'var(--error)'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)' }}>
      <AdminNav />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--gray-500)' }}>Platform overview and analytics</p>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
              <StatCard
                label="Total Customers"
                value={stats?.users?.customer?.total || 0}
                sub={`+${stats?.users?.customer?.today || 0} today`}
                icon={Users} color="var(--crave-orange)" to="/admin/users"
              />
              <StatCard
                label="Restaurant Partners"
                value={stats?.users?.partner?.total || 0}
                sub={`${stats?.restaurants?.verified || 0} verified`}
                icon={Store} color="var(--info)" to="/admin/restaurants"
              />
              <StatCard
                label="Total Orders"
                value={stats?.orders?.total || 0}
                sub={`${stats?.orders?.today || 0} today · ${stats?.orders?.active || 0} active`}
                icon={ShoppingBag} color="#7C3AED" to="/admin/orders"
              />
              <StatCard
                label="Total Revenue"
                value={`₹${parseFloat(stats?.revenue?.total_revenue || 0).toFixed(0)}`}
                sub={`₹${parseFloat(stats?.revenue?.today_revenue || 0).toFixed(0)} today`}
                icon={DollarSign} color="var(--success)"
              />
              <StatCard
                label="Active Orders"
                value={stats?.orders?.active || 0}
                sub="in progress now"
                icon={Activity} color="var(--warning)"
              />
              <StatCard
                label="Monthly Revenue"
                value={`₹${parseFloat(stats?.revenue?.month_revenue || 0).toFixed(0)}`}
                sub="this month"
                icon={TrendingUp} color="var(--crave-orange)"
              />
            </div>

            {/* Quick stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Delivered', value: stats?.orders?.delivered || 0, color: 'var(--success)', pct: stats?.orders?.total ? ((stats?.orders?.delivered / stats?.orders?.total) * 100).toFixed(1) : 0 },
                { label: 'Cancelled', value: stats?.orders?.cancelled || 0, color: 'var(--error)', pct: stats?.orders?.total ? ((stats?.orders?.cancelled / stats?.orders?.total) * 100).toFixed(1) : 0 },
                { label: 'Open Restaurants', value: stats?.restaurants?.open || 0, color: 'var(--info)', pct: stats?.restaurants?.total ? ((stats?.restaurants?.open / stats?.restaurants?.total) * 100).toFixed(1) : 0 },
              ].map(({ label, value, color, pct }) => (
                <div key={label} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--gray-900)', marginBottom: 10 }}>{value}</div>
                  <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>Recent Orders</h3>
                <Link to="/admin/orders"><button className="btn btn-ghost btn-sm">View All →</button></Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gray-100)' }}>
                      {['Order #', 'Customer', 'Restaurant', 'Mode', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '12px', fontSize: 13, fontWeight: 700 }}>#{order.order_number?.slice(-8)}</td>
                        <td style={{ padding: '12px', fontSize: 13 }}>{order.customer_first_name} {order.customer_last_name}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: 'var(--gray-600)' }}>{order.restaurant_name}</td>
                        <td style={{ padding: '12px', fontSize: 12 }}><span style={{ textTransform: 'capitalize' }}>{order.service_mode?.replace('_', ' ')}</span></td>
                        <td style={{ padding: '12px', fontSize: 13, fontWeight: 700 }}>₹{parseFloat(order.total_amount).toFixed(0)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: `${STATUS_COLORS[order.status] || 'var(--gray-500)'}18`, color: STATUS_COLORS[order.status] || 'var(--gray-500)', textTransform: 'capitalize' }}>
                            {order.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: 12, color: 'var(--gray-500)' }}>
                          {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
