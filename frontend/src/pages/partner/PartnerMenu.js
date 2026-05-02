import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { restaurantAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function AddItemModal({ restaurantId, categories, onClose, onAdded }) {
  const [form, setForm] = useState({ categoryId: categories[0]?.category_id || '', name: '', description: '', price: '', imageUrl: '', isVeg: true, spiceLevel: 0 });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await restaurantAPI.addMenuItem(restaurantId, { ...form, price: parseFloat(form.price) });
      toast.success('Menu item added!');
      onAdded();
      onClose();
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>Add Menu Item</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={form.categoryId} onChange={set('categoryId')} className="form-input" required>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input type="text" value={form.name} onChange={set('name')} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={set('description')} className="form-input" rows={2} style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input type="number" value={form.price} onChange={set('price')} className="form-input" min="1" step="0.01" required />
              </div>
              <div className="form-group">
                <label className="form-label">Spice Level (0-3)</label>
                <select value={form.spiceLevel} onChange={set('spiceLevel')} className="form-input">
                  {[0,1,2,3].map(l => <option key={l} value={l}>{l === 0 ? '0 - None' : `${l} - ${'🌶'.repeat(l)}`}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input type="url" value={form.imageUrl} onChange={set('imageUrl')} className="form-input" placeholder="https://..." />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                <input type="checkbox" checked={form.isVeg} onChange={e => setForm(p => ({ ...p, isVeg: e.target.checked }))} style={{ accentColor: 'var(--success)' }} />
                <div style={{ width: 16, height: 16, border: `2px solid ${form.isVeg ? 'var(--success)' : 'var(--error)'}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.isVeg ? 'var(--success)' : 'var(--error)' }} />
                </div>
                {form.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PartnerMenu() {
  const [menu, setMenu] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const { logout } = useAuth();

  const fetchMenu = async () => {
    try {
      const restRes = await restaurantAPI.getMine();
      const rest = restRes.data.data;
      setRestaurant(rest);
      if (rest) {
        const menuRes = await restaurantAPI.getMenu(rest.id);
        setMenu(menuRes.data.data);
        if (menuRes.data.data.length) setActiveCategory(menuRes.data.data[0].category_id);
      }
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const toggleAvailability = async (itemId, currentVal) => {
    try {
      await restaurantAPI.updateMenuItem(itemId, { isAvailable: !currentVal });
      setMenu(prev => prev.map(cat => ({
        ...cat,
        items: cat.items?.map(item => item.id === itemId ? { ...item, is_available: !currentVal } : item)
      })));
      toast.success(currentVal ? 'Item marked unavailable' : 'Item marked available');
    } catch {
      toast.error('Failed to update item');
    }
  };

  const activeMenu = menu.find(c => c.category_id === activeCategory);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/partner" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--gray-900)' }}>← Partner Hub</Link>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ to: '/partner/orders', l: 'Orders' }, { to: '/partner/menu', l: 'Menu' }].map(({ to, l }) => (
            <Link key={to} to={to}><button className="btn btn-ghost btn-sm">{l}</button></Link>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: 'var(--error)' }}>Sign Out</button>
        </div>
      </nav>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Menu Management</h1>
            <p style={{ color: 'var(--gray-500)' }}>{restaurant?.name}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Item
          </button>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : !restaurant ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p>No restaurant found. <Link to="/partner/setup" style={{ color: 'var(--crave-orange)', fontWeight: 700 }}>Set up your restaurant →</Link></p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 28 }}>
            {/* Category list */}
            <div style={{ width: 200, flexShrink: 0 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)', marginBottom: 12 }}>Categories</h3>
              {menu.map(cat => (
                <button key={cat.category_id} onClick={() => setActiveCategory(cat.category_id)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                  background: activeCategory === cat.category_id ? 'var(--crave-orange-pale)' : 'transparent',
                  color: activeCategory === cat.category_id ? 'var(--crave-orange)' : 'var(--gray-700)',
                  border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}>
                  <span>{cat.category_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--gray-200)', padding: '2px 7px', borderRadius: 12 }}>
                    {cat.items?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Items */}
            <div style={{ flex: 1 }}>
              {activeMenu && (
                <>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
                    {activeMenu.category_name}
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-500)', marginLeft: 12, fontFamily: 'var(--font-body)' }}>
                      {activeMenu.items?.length || 0} items
                    </span>
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {(activeMenu.items || []).map(item => (
                      <div key={item.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', opacity: item.is_available ? 1 : 0.6 }}>
                        {item.image_url && (
                          <div style={{ height: 140, overflow: 'hidden' }}>
                            <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ width: 14, height: 14, border: `2px solid ${item.is_veg ? 'var(--success)' : 'var(--error)'}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.is_veg ? 'var(--success)' : 'var(--error)' }} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</span>
                              </div>
                              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--crave-orange)' }}>₹{item.price}</span>
                            </div>
                            <button
                              onClick={() => toggleAvailability(item.id, item.is_available)}
                              style={{ background: item.is_available ? 'var(--success-bg)' : 'var(--gray-100)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: item.is_available ? 'var(--success)' : 'var(--gray-500)' }}
                            >
                              {item.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </button>
                          </div>
                          {item.description && <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && restaurant && (
        <AddItemModal
          restaurantId={restaurant.id}
          categories={menu}
          onClose={() => setShowAddModal(false)}
          onAdded={fetchMenu}
        />
      )}
    </div>
  );
}
