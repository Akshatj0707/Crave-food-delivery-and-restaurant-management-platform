import React, { useState, useEffect, useCallback } from 'react';
import { Search, Star, CheckCircle, XCircle } from 'lucide-react';
import { AdminNav } from './AdminDashboard';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (search) params.search = search;
      if (verifiedFilter !== '') params.isVerified = verifiedFilter;
      const res = await adminAPI.getRestaurants(params);
      setRestaurants(res.data.data);
    } catch { toast.error('Failed to load restaurants'); }
    finally { setLoading(false); }
  }, [search, verifiedFilter]);

  useEffect(() => { fetch(); }, [verifiedFilter]);

  const toggleVerified = async (id, current) => {
    try {
      await adminAPI.updateRestaurant(id, { isVerified: !current });
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_verified: !current } : r));
      toast.success(current ? 'Restaurant unverified' : 'Restaurant verified ✓');
    } catch { toast.error('Failed to update'); }
  };

  const toggleFeatured = async (id, current) => {
    try {
      await adminAPI.updateRestaurant(id, { isFeatured: !current });
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_featured: !current } : r));
      toast.success(current ? 'Removed from featured' : 'Added to featured ★');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)' }}>
      <AdminNav />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Restaurant Management</h1>
          <p style={{ color: 'var(--gray-500)' }}>{restaurants.length} restaurants</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetch()} placeholder="Search restaurants..." className="form-input" style={{ paddingLeft: 42 }} />
          </div>
          <select value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)} className="form-input" style={{ width: 160 }}>
            <option value="">All Restaurants</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified</option>
          </select>
          <button onClick={fetch} className="btn btn-primary btn-sm">Search</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1' }}><div className="page-loader"><div className="spinner" /></div></div>
          ) : restaurants.map(rest => (
            <div key={rest.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
              {rest.cover_image_url && (
                <div style={{ height: 120, overflow: 'hidden' }}>
                  <img src={rest.cover_image_url} alt={rest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>{rest.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{rest.city}, {rest.state}</p>
                    <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Owner: {rest.owner_first_name} {rest.owner_last_name}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Star size={13} fill="var(--warning)" color="var(--warning)" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{parseFloat(rest.avg_rating || 0).toFixed(1)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: rest.is_verified ? 'var(--success-bg)' : 'var(--warning-bg)', color: rest.is_verified ? 'var(--success)' : 'var(--warning)' }}>
                    {rest.is_verified ? '✓ Verified' : '⏳ Pending'}
                  </span>
                  {rest.is_featured && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'var(--crave-orange-pale)', color: 'var(--crave-orange)' }}>★ Featured</span>}
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: rest.is_open ? 'var(--success-bg)' : 'var(--error-bg)', color: rest.is_open ? 'var(--success)' : 'var(--error)' }}>
                    {rest.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleVerified(rest.id, rest.is_verified)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: rest.is_verified ? 'var(--error-bg)' : 'var(--success-bg)', color: rest.is_verified ? 'var(--error)' : 'var(--success)', border: 'none' }}>
                    {rest.is_verified ? 'Unverify' : '✓ Verify'}
                  </button>
                  <button onClick={() => toggleFeatured(rest.id, rest.is_featured)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: rest.is_featured ? 'var(--gray-100)' : 'var(--crave-orange-pale)', color: rest.is_featured ? 'var(--gray-600)' : 'var(--crave-orange)', border: 'none' }}>
                    {rest.is_featured ? 'Unfeature' : '★ Feature'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({});

  const STATUS_COLORS = {
    pending: 'var(--warning)', confirmed: 'var(--info)', preparing: '#7C3AED',
    ready: 'var(--success)', out_for_delivery: 'var(--info)',
    delivered: 'var(--success)', cancelled: 'var(--error)'
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 30 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.getOrders(params);
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [statusFilter]);

  const STATUSES = ['', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)' }}>
      <AdminNav />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Order Management</h1>
          <p style={{ color: 'var(--gray-500)' }}>{pagination.total || 0} total orders</p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '7px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: statusFilter === s ? (STATUS_COLORS[s] || 'var(--crave-orange)') : 'white',
              color: statusFilter === s ? 'white' : 'var(--gray-600)',
              border: statusFilter === s ? 'none' : '1.5px solid var(--gray-200)',
              textTransform: 'capitalize'
            }}>{s === '' ? 'All Orders' : s.replace(/_/g, ' ')}</button>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--gray-50)' }}>
                <tr>
                  {['Order #', 'Customer', 'Restaurant', 'Mode', 'Items', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '14px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>#{order.order_number?.slice(-8)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{order.customer_first_name} {order.customer_last_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--gray-600)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.restaurant_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, textTransform: 'capitalize' }}>{order.service_mode?.replace('_', ' ')}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--gray-500)' }}>{order.items?.length || '-'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800 }}>₹{parseFloat(order.total_amount).toFixed(0)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: order.payment_status === 'paid' ? 'var(--success-bg)' : order.payment_status === 'failed' ? 'var(--error-bg)' : 'var(--warning-bg)', color: order.payment_status === 'paid' ? 'var(--success)' : order.payment_status === 'failed' ? 'var(--error)' : 'var(--warning)' }}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: `${STATUS_COLORS[order.status] || 'var(--gray-500)'}18`, color: STATUS_COLORS[order.status] || 'var(--gray-500)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRestaurants;
