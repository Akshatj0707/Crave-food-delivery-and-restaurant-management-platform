import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ firstName: user?.first_name || '', lastName: user?.last_name || '', phone: user?.phone || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setPwd = k => e => setPwdForm(p => ({ ...p, [k]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({ firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPwd(true);
    try {
      await authAPI.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed!');
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const ROLE_LABELS = { customer: 'Customer', partner: 'Restaurant Partner', admin: 'Admin', super_admin: 'Super Admin' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />
      <div className="container" style={{ padding: '40px 20px', maxWidth: 680 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 32 }}>My Profile</h1>

        {/* Avatar + role */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--crave-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-display)' }}>
              {user?.first_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900 }}>{user?.first_name} {user?.last_name}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <span className="badge badge-orange">{ROLE_LABELS[user?.role]}</span>
              {user?.is_verified && <span className="badge badge-green">✓ Verified</span>}
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 24 }}>
            <User size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--crave-orange)' }} />
            Personal Information
          </h3>
          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" value={form.firstName} onChange={set('firstName')} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} className="form-input" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} size={16} />
                <input type="email" value={user?.email} className="form-input" style={{ paddingLeft: 44, background: 'var(--gray-50)', color: 'var(--gray-500)' }} disabled />
              </div>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Email cannot be changed</p>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} size={16} />
                <input type="tel" value={form.phone} onChange={set('phone')} className="form-input" style={{ paddingLeft: 44 }} placeholder="9876543210" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password form */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 24 }}>
            <Lock size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--crave-orange)' }} />
            Change Password
          </h3>
          <form onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" value={pwdForm.currentPassword} onChange={setPwd('currentPassword')} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" value={pwdForm.newPassword} onChange={setPwd('newPassword')} className="form-input" placeholder="Min. 6 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" value={pwdForm.confirm} onChange={setPwd('confirm')} className="form-input" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPwd}>
              <Lock size={15} /> {savingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
