import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Bike, MapPin, Utensils, Plus, Minus, ChevronLeft, ShoppingCart, Leaf, Flame } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import CartSidebar from '../components/customer/CartSidebar';
import { restaurantAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const SpiceIndicator = ({ level }) => {
  if (!level) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[...Array(3)].map((_, i) => (
        <Flame key={i} size={10} color={i < level ? '#EF4444' : 'var(--gray-300)'} fill={i < level ? '#EF4444' : 'var(--gray-300)'} />
      ))}
    </span>
  );
};

const MenuItem = ({ item, restaurantId, restaurantName }) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(i => i.id === item.id);
  const qty = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem({ ...item, image_url: item.image_url }, restaurantId, restaurantName);
  };

  return (
    <div style={{
      display: 'flex', gap: 16, padding: '20px 0',
      borderBottom: '1px solid var(--gray-100)', alignItems: 'flex-start'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {/* Veg/Non-veg indicator */}
          <div style={{
            width: 16, height: 16, borderRadius: 3, border: `2px solid ${item.is_veg ? '#16A34A' : '#DC2626'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.is_veg ? '#16A34A' : '#DC2626' }} />
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>{item.name}</h4>
          {item.is_featured && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--crave-orange)', background: 'var(--crave-orange-pale)', padding: '2px 6px', borderRadius: 4 }}>BEST SELLER</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>₹{item.price}</span>
          {item.original_price && item.original_price > item.price && (
            <span style={{ fontSize: 14, color: 'var(--gray-400)', textDecoration: 'line-through' }}>₹{item.original_price}</span>
          )}
          <SpiceIndicator level={item.spice_level} />
        </div>
        {item.description && (
          <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>{item.description}</p>
        )}
      </div>

      {/* Image + Add button */}
      <div style={{ flexShrink: 0, textAlign: 'center' }}>
        {item.image_url ? (
          <div style={{ position: 'relative', width: 110, height: 90, borderRadius: 12, overflow: 'hidden', marginBottom: -16 }}>
            <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : <div style={{ width: 110, height: 90, background: 'var(--gray-100)', borderRadius: 12, marginBottom: -16 }} />}

        {qty === 0 ? (
          <button
            onClick={handleAdd}
            disabled={!item.is_available}
            style={{
              background: 'white', border: '2px solid var(--crave-orange)',
              color: 'var(--crave-orange)', borderRadius: 8, padding: '6px 20px',
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', position: 'relative', zIndex: 1,
              opacity: item.is_available ? 1 : 0.5
            }}
          >{item.is_available ? 'ADD' : 'N/A'}</button>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--crave-orange)',
            borderRadius: 8, padding: '6px 10px', position: 'relative', zIndex: 1
          }}>
            <button onClick={() => updateQuantity(item.id, qty - 1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
              <Minus size={14} />
            </button>
            <span style={{ color: 'white', fontWeight: 800, minWidth: 16, textAlign: 'center', fontSize: 15 }}>{qty}</span>
            <button onClick={handleAdd} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await restaurantAPI.getById(id);
        setRestaurant(res.data.data);
        if (res.data.data.menu?.length) setActiveCategory(res.data.data.menu[0].category_id);
      } catch {
        toast.error('Restaurant not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div><Navbar /><div className="page-loader"><div className="spinner" /></div></div>
  );
  if (!restaurant) return null;

  const { menu = [] } = restaurant;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden', background: 'var(--gray-800)' }}>
        {restaurant.cover_image_url && (
          <img src={restaurant.cover_image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <button
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            {restaurant.logo_url && (
              <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', border: '3px solid white', background: 'white', boxShadow: 'var(--shadow-md)', flexShrink: 0 }}>
                <img src={restaurant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 6 }}>{restaurant.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{restaurant.cuisine_types?.join(' · ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '16px 24px' }}>
        <div className="container" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={16} fill="var(--warning)" color="var(--warning)" />
            <span style={{ fontWeight: 700 }}>{parseFloat(restaurant.avg_rating || 0).toFixed(1)}</span>
            <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>({restaurant.total_ratings} reviews)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)', fontSize: 14 }}>
            <Clock size={15} /><span>{restaurant.avg_delivery_time} min</span>
          </div>
          <div style={{ color: 'var(--gray-600)', fontSize: 14 }}>
            {restaurant.delivery_fee > 0 ? `₹${restaurant.delivery_fee} delivery` : '🎉 Free delivery'}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
              <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)} style={{ accentColor: 'var(--success)' }} />
              <Leaf size={14} />Veg Only
            </label>
          </div>
        </div>
      </div>

      <div className="container" style={{ display: 'flex', gap: 32, padding: '32px 20px', position: 'relative' }}>
        {/* Category sidebar */}
        <div className="hide-mobile" style={{ width: 200, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)', marginBottom: 12 }}>Menu</h3>
            {menu.map(cat => (
              <button
                key={cat.category_id}
                onClick={() => {
                  setActiveCategory(cat.category_id);
                  document.getElementById(`cat-${cat.category_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                  background: activeCategory === cat.category_id ? 'var(--crave-orange-pale)' : 'transparent',
                  color: activeCategory === cat.category_id ? 'var(--crave-orange)' : 'var(--gray-700)',
                  border: 'none', fontWeight: activeCategory === cat.category_id ? 700 : 500,
                  fontSize: 14, cursor: 'pointer', transition: 'var(--transition)'
                }}
              >{cat.category_name}</button>
            ))}
          </div>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1 }}>
          {menu.map(cat => {
            const filtered = (cat.items || []).filter(item => !vegOnly || item.is_veg);
            if (!filtered.length) return null;
            return (
              <div key={cat.category_id} id={`cat-${cat.category_id}`} style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{cat.category_name}</h2>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>{filtered.length} items</p>
                {filtered.map(item => (
                  <MenuItem key={item.id} item={item} restaurantId={id} restaurantName={restaurant.name} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating cart button (mobile) */}
      {totalItems > 0 && (
        <button
          className="hide-desktop"
          onClick={() => setCartOpen(true)}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--crave-orange)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-full)',
            padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: 'var(--shadow-orange)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 50
          }}
        >
          <ShoppingCart size={18} /> {totalItems} items · View Cart
        </button>
      )}

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
