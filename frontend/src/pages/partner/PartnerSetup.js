import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CUISINE_OPTIONS = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Pizza', 'Burgers', 'Biryani', 'Mughlai', 'Fast Food', 'American', 'Mexican', 'Thai', 'Japanese', 'Continental'];

export default function PartnerSetup() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', cuisineTypes: [],
    addressLine1: '', city: '', state: '', pincode: '',
    phone: '', email: '', deliveryFee: 40, minOrderAmount: 100,
    supportsDelivery: true, supportsTakeaway: true, supportsDineIn: false,
    totalTables: 0, isOpen: true
  });

  useEffect(() => {
    restaurantAPI.getMine().then(res => {
      const rest = res.data.data;
      setRestaurant(rest);
      if (rest) {
        setForm({
          name: rest.name || '',
          description: rest.description || '',
          cuisineTypes: rest.cuisine_types || [],
          addressLine1: rest.address_line1 || '',
          city: rest.city || '',
          state: rest.state || '',
          pincode: rest.pincode || '',
          phone: rest.phone || '',
          email: rest.email || '',
          deliveryFee: rest.delivery_fee || 40,
          minOrderAmount: rest.min_order_amount || 100,
          supportsDelivery: rest.supports_delivery ?? true,
          supportsTakeaway: rest.supports_takeaway ?? true,
          supportsDineIn: rest.supports_dine_in ?? false,
          totalTables: rest.total_tables || 0,
          isOpen: rest.is_open ?? true
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setCheck = k => e => setForm(p => ({ ...p, [k]: e.target.checked }));

  const toggleCuisine = (c) => setForm(p => ({
    ...p,
    cuisineTypes: p.cuisineTypes.includes(c) ? p.cuisineTypes.filter(x => x !== c) : [...p.cuisineTypes, c]
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (restaurant) {
        await restaurantAPI.update(restaurant.id, form);
        toast.success('Restaurant updated!');
      } else {
        await restaurantAPI.create(form);
        toast.success('Restaurant created! 🎉');
        navigate('/partner');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/partner" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--gray-900)' }}>← Partner Hub</Link>
        <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: 'var(--error)' }}>Sign Out</button>
      </nav>

      <div className="container" style={{ padding: '40px 20px', maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          {restaurant ? 'Restaurant Settings' : 'Set Up Your Restaurant'}
        </h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 36 }}>
          {restaurant ? 'Update your restaurant information' : 'Fill in the details to get listed on Crave'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Basic Information</h3>
            <div className="form-group">
              <label className="form-label">Restaurant Name *</label>
              <input type="text" value={form.name} onChange={set('name')} className="form-input" required placeholder="e.g. Spice Garden" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={set('description')} className="form-input" rows={3} style={{ resize: 'none' }} placeholder="Tell customers what makes your restaurant special..." />
            </div>
            <div className="form-group">
              <label className="form-label">Cuisine Types</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CUISINE_OPTIONS.map(c => (
                  <button key={c} type="button" onClick={() => toggleCuisine(c)} style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: form.cuisineTypes.includes(c) ? 'var(--crave-orange)' : 'var(--gray-100)',
                    color: form.cuisineTypes.includes(c) ? 'white' : 'var(--gray-700)',
                    border: 'none'
                  }}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Location & Contact</h3>
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input type="text" value={form.addressLine1} onChange={set('addressLine1')} className="form-input" required placeholder="Street address, building..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input type="text" value={form.city} onChange={set('city')} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input type="text" value={form.state} onChange={set('state')} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input type="text" value={form.pincode} onChange={set('pincode')} className="form-input" required maxLength={6} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={form.email} onChange={set('email')} className="form-input" />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Service Modes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {[
                { key: 'supportsDelivery', label: '🚴 Delivery', desc: 'Orders delivered to customers' },
                { key: 'supportsTakeaway', label: '🥡 Takeaway', desc: 'Customers pick up their order' },
                { key: 'supportsDineIn', label: '🍽️ Dine-in', desc: 'Customers eat at the restaurant' },
              ].map(({ key, label, desc }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${form[key] ? 'var(--crave-orange)' : 'var(--gray-200)'}`, cursor: 'pointer', background: form[key] ? 'var(--crave-orange-pale)' : 'white' }}>
                  <input type="checkbox" checked={form[key]} onChange={setCheck(key)} style={{ width: 18, height: 18, accentColor: 'var(--crave-orange)' }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{label}</p>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Delivery Fee (₹)</label>
                <input type="number" value={form.deliveryFee} onChange={set('deliveryFee')} className="form-input" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Order (₹)</label>
                <input type="number" value={form.minOrderAmount} onChange={set('minOrderAmount')} className="form-input" min="0" />
              </div>
              {form.supportsDineIn && (
                <div className="form-group">
                  <label className="form-label">Total Tables</label>
                  <input type="number" value={form.totalTables} onChange={set('totalTables')} className="form-input" min="0" />
                </div>
              )}
            </div>
            {restaurant && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.isOpen} onChange={setCheck('isOpen')} style={{ width: 18, height: 18, accentColor: 'var(--success)' }} />
                <span style={{ fontWeight: 600, color: form.isOpen ? 'var(--success)' : 'var(--gray-500)' }}>
                  Restaurant is {form.isOpen ? 'Open' : 'Closed'}
                </span>
              </label>
            )}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {saving ? 'Saving...' : restaurant ? '💾 Save Changes' : '🚀 Launch Restaurant'}
          </button>
        </form>
      </div>
    </div>
  );
}
