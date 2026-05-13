import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, EyeOff, ChefHat } from 'lucide-react';
import { restaurantAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function AddItemModal({ restaurant, onClose, onAdded }) {
  const categories = restaurant?.menu || [];
  const restId = restaurant?._id || restaurant?.id;

  const [form, setForm] = useState({
    categoryId: categories[0]?._id || categories[0]?.id || '',
    name: '', description: '', price: '', imageUrl: '', isVeg: true, spiceLevel: 0
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error('Price is required'); return; }

    setSaving(true);
    try {
      await restaurantAPI.addMenuItem(restId, {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl,
        isVeg: form.isVeg,
        spiceLevel: parseInt(form.spiceLevel) || 0,
      });
      toast.success(`${form.name} added! ✅`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>Add Menu Item</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--gray-500)' }}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Category dropdown */}
            <div className="form-group">
              <label className="form-label">Category</label>
              {categories.length > 0 ? (
                <select
                  value={form.categoryId}
                  onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                  className="form-input"
                >
                  {categories.map((cat, idx) => {
                    const catId = cat._id || cat.id || idx;
                    return (
                      <option key={catId} value={catId}>
                        {cat.name || cat.category_name}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div style={{ padding: '12px 16px', background: 'var(--warning-bg)', borderRadius: 10, fontSize: 14, color: 'var(--warning)', border: '1px solid var(--warning)' }}>
                  ⚠️ No categories found. The item will be added to a default category.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input type="text" value={form.name} onChange={set('name')} className="form-input" required placeholder="e.g. Paneer Tikka" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={set('description')} className="form-input" rows={2} style={{ resize: 'none' }} placeholder="Brief description of the dish" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input type="number" value={form.price} onChange={set('price')} className="form-input" min="1" step="0.01" required placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Spice Level</label>
                <select value={form.spiceLevel} onChange={set('spiceLevel')} className="form-input">
                  <option value={0}>🟢 0 - None</option>
                  <option value={1}>🟡 1 - Mild</option>
                  <option value={2}>🟠 2 - Medium</option>
                  <option value={3}>🔴 3 - Hot</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL (optional)</label>
              <input type="url" value={form.imageUrl} onChange={set('imageUrl')} className="form-input" placeholder="https://images.unsplash.com/..." />
            </div>

            {/* Veg toggle */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {[{ val: true, label: '🟢 Vegetarian', color: 'var(--success)' }, { val: false, label: '🔴 Non-Vegetarian', color: 'var(--error)' }].map(({ val, label, color }) => (
                <button key={String(val)} type="button" onClick={() => setForm(p => ({ ...p, isVeg: val }))}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    background: form.isVeg === val ? `${color}18` : 'var(--gray-50)',
                    color: form.isVeg === val ? color : 'var(--gray-500)',
                    border: `1.5px solid ${form.isVeg === val ? color : 'var(--gray-200)'}`,
                  }}>{label}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? 'Adding...' : '+ Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddCategoryModal({ restaurant, onClose, onAdded }) {
  const restId = restaurant?._id || restaurant?.id;
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Category name required'); return; }
    setSaving(true);
    try {
      await restaurantAPI.addMenuCategory(restId, { name });
      toast.success(`Category "${name}" added!`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error('Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>Add Category</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required placeholder="e.g. Starters, Main Course, Desserts" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PartnerMenu() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const { logout } = useAuth();

  const fetchRestaurant = async () => {
    try {
      const res = await restaurantAPI.getMine();
      const rest = res.data.data;
      setRestaurant(rest);
      if (rest?.menu?.length) {
        setActiveCategory(rest.menu[0]._id || rest.menu[0].id || 0);
      }
    } catch {
      toast.error('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRestaurant(); }, []);

  const toggleAvailability = async (itemId, currentVal) => {
    try {
      await restaurantAPI.updateMenuItem(itemId, { isAvailable: !currentVal });
      setRestaurant(prev => ({
        ...prev,
        menu: prev.menu.map(cat => ({
          ...cat,
          items: cat.items.map(item =>
            (item._id || item.id) === itemId ? { ...item, isAvailable: !currentVal } : item
          )
        }))
      }));
      toast.success(currentVal ? 'Item marked unavailable' : 'Item available ✅');
    } catch {
      toast.error('Failed to update');
    }
  };

  const menu = restaurant?.menu || [];
  const activeMenu = menu.find(c => {
    const catId = c._id || c.id;
    return catId === activeCategory || catId?.toString() === activeCategory?.toString();
  }) || menu[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/partner" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--gray-900)' }}>← Partner Hub</Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/partner/orders"><button className="btn btn-ghost btn-sm">Orders</button></Link>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: 'var(--error)' }}>Sign Out</button>
        </div>
      </nav>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Menu Management</h1>
            <p style={{ color: 'var(--gray-500)' }}>{restaurant?.name || 'Your Restaurant'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCategory(true)}>
              + Category
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddItem(true)}>
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : !restaurant ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <ChefHat size={60} color="var(--gray-300)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No restaurant found</p>
            <Link to="/partner/setup"><button className="btn btn-primary">Set up your restaurant →</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 28 }}>
            {/* Category sidebar */}
            <div style={{ width: 220, flexShrink: 0 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)', marginBottom: 12 }}>
                Categories ({menu.length})
              </h3>
              {menu.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 12 }}>No categories yet</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCategory(true)}>+ Add Category</button>
                </div>
              ) : (
                menu.map((cat, idx) => {
                  const catId = cat._id || cat.id || idx;
                  const isActive = catId === activeCategory || catId?.toString() === activeCategory?.toString();
                  return (
                    <button key={catId} onClick={() => setActiveCategory(catId)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                      background: isActive ? 'var(--crave-orange-pale)' : 'transparent',
                      color: isActive ? 'var(--crave-orange)' : 'var(--gray-700)',
                      border: 'none', fontWeight: isActive ? 700 : 500, fontSize: 14, cursor: 'pointer'
                    }}>
                      <span>{cat.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--gray-200)', padding: '2px 7px', borderRadius: 12 }}>
                        {cat.items?.length || 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Items grid */}
            <div style={{ flex: 1 }}>
              {activeMenu ? (
                <>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
                    {activeMenu.name}
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-500)', marginLeft: 12, fontFamily: 'var(--font-body)' }}>
                      {activeMenu.items?.length || 0} items
                    </span>
                  </h2>
                  {(activeMenu.items || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed var(--gray-200)', borderRadius: 16 }}>
                      <p style={{ color: 'var(--gray-400)', marginBottom: 16 }}>No items in this category</p>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowAddItem(true)}>+ Add First Item</button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                      {(activeMenu.items || []).map((item, iIdx) => {
                        const itemId = item._id || item.id || iIdx;
                        const imgUrl = item.imageUrl || item.image_url;
                        return (
                          <div key={itemId} style={{
                            background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)',
                            opacity: item.isAvailable !== false ? 1 : 0.6
                          }}>
                            {imgUrl ? (
                              <div style={{ height: 140, overflow: 'hidden', background: 'var(--gray-100)' }}>
                                <img src={imgUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { e.target.parentNode.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:40px">🍽️</div>'; }} />
                              </div>
                            ) : (
                              <div style={{ height: 140, background: 'linear-gradient(135deg, var(--crave-orange-pale), var(--crave-orange-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🍽️</div>
                            )}
                            <div style={{ padding: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ width: 12, height: 12, border: `2px solid ${item.isVeg ? 'var(--success)' : 'var(--error)'}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.isVeg ? 'var(--success)' : 'var(--error)' }} />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
                                  </div>
                                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--crave-orange)' }}>₹{item.price}</span>
                                </div>
                                <button onClick={() => toggleAvailability(itemId, item.isAvailable !== false)} style={{
                                  background: item.isAvailable !== false ? 'var(--success-bg)' : 'var(--gray-100)',
                                  border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                                  color: item.isAvailable !== false ? 'var(--success)' : 'var(--gray-500)'
                                }}>
                                  {item.isAvailable !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                                  {item.isAvailable !== false ? 'Live' : 'Hidden'}
                                </button>
                              </div>
                              {item.description && (
                                <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4, marginTop: 4 }}>
                                  {item.description.length > 60 ? item.description.substring(0, 60) + '...' : item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ color: 'var(--gray-400)' }}>Select a category to view items</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddItem && restaurant && (
        <AddItemModal restaurant={restaurant} onClose={() => setShowAddItem(false)} onAdded={fetchRestaurant} />
      )}
      {showAddCategory && restaurant && (
        <AddCategoryModal restaurant={restaurant} onClose={() => setShowAddCategory(false)} onAdded={fetchRestaurant} />
      )}
    </div>
  );
}
