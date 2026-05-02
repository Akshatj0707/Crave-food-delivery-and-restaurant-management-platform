import React, { useState, useEffect, useCallback } from 'react';
import { Search, Shield, CheckCircle, XCircle } from 'lucide-react';
import { AdminNav } from './AdminDashboard';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ROLE_COLORS = { customer: 'var(--gray-500)', partner: 'var(--info)', admin: '#7C3AED', super_admin: 'var(--crave-orange)' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const toggleActive = async (id, current) => {
    try {
      await adminAPI.updateUser(id, { isActive: !current });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u));
      toast.success(current ? 'User deactivated' : 'User activated');
    } catch { toast.error('Failed to update user'); }
  };

  const changeRole = async (id, role) => {
    try {
      await adminAPI.updateUser(id, { role });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)' }}>
      <AdminNav />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>User Management</h1>
            <p style={{ color: 'var(--gray-500)' }}>{pagination.total || 0} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} size={16} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers()}
              placeholder="Search by name or email..." className="form-input"
              style={{ paddingLeft: 42 }}
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-input" style={{ width: 160 }}>
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="partner">Partner</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button onClick={fetchUsers} className="btn btn-primary btn-sm">Search</button>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--gray-50)' }}>
                <tr>
                  {['User', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${ROLE_COLORS[user.role]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: ROLE_COLORS[user.role] }}>
                          {user.first_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{user.first_name} {user.last_name}</p>
                          <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={user.role}
                        onChange={e => changeRole(user.id, e.target.value)}
                        style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${ROLE_COLORS[user.role]}`, color: ROLE_COLORS[user.role], background: `${ROLE_COLORS[user.role]}10`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                      >
                        <option value="customer">Customer</option>
                        <option value="partner">Partner</option>
                        <option value="admin">Admin</option>
                        {user.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--gray-600)' }}>{user.phone || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: user.is_active ? 'var(--success-bg)' : 'var(--error-bg)', color: user.is_active ? 'var(--success)' : 'var(--error)' }}>
                          {user.is_active ? '● Active' : '● Inactive'}
                        </span>
                        {user.is_verified && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'var(--info-bg)', color: 'var(--info)' }}>✓ Verified</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--gray-500)' }}>
                      {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => toggleActive(user.id, user.is_active)}
                          style={{ background: user.is_active ? 'var(--error-bg)' : 'var(--success-bg)', color: user.is_active ? 'var(--error)' : 'var(--success)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
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
