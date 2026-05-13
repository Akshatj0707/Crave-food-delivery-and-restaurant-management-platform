import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, ChevronLeft, ShoppingCart, Leaf, Flame, Plus, Minus } from 'lucide-react';
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
  const cartItem = items.find(i => i.id === (item._id || item.id));
  const qty = cartItem?.quantity || 0;

  const handleAdd = () => {
    const itemId = item._id || item.id;
    addItem({ ...item, id: itemId, image_url: item.imageUrl || item.image_url }, restaurantId, restaurantName);
  };

  return (
    <div style={{
      display: 'flex', gap: 16, padding: '20px 0',
      borderBottom: '1px solid var(--gray-100)', alignItems: 'flex-start'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 16, height: 16, borderRadius: 3,
            border: `2px solid ${item.isVeg ? '#16A34A' : '#DC2626'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.isVeg ? '#16A34A' : '#DC2626' }} />
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>{item.name}</h4>
          {item.isFeatured && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--crave-orange)', background: 'var(--crave-orange-pale)', padding: '2px 6px', borderRadius: 4 }}>BEST SELLER</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>₹{item.price}</span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span style={{ fontSize: 14, color: 'var(--gray-400)', textDecoration: 'line-through' }}>₹{item.originalPrice}</span>
          )}
          <SpiceIndicator level={item.spiceLevel} />
        </div>
        {item.description && (
          <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>{item.description}</p>
        )}
      </div>

      <div style={{ flexShrink: 0, textAlign: 'center' }}>
        {(item.imageUrl || item.image_url) ? (
          <div style={{ position: 'relative', width: 110, height: 90, borderRadius: 12, overflow: 'hidden', marginBottom: -16 }}>
            <img src={item.imageUrl || item.image_url} alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          </div>
        ) : (
          <div style={{ width: 110, height: 90, background: 'var(--gray-100)', borderRadius: 12, marginBottom: -16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🍽️</div>
        )}

        {qty === 0 ? (
          <button onClick={handleAdd} style={{
            background: 'white', border: '2px solid var(--crave-orange)',
            color: 'var(--crave-orange)', borderRadius: 8, padding: '6px 20px',
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)', position: 'relative', zIndex: 1,
          }}>ADD</button>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--crave-orange)',
            borderRadius: 8, padding: '6px 10px', position: 'relative', zIndex: 1
          }}>
            <button onClick={() => updateQuantity(item._id || item.id, qty - 1)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
              <Minus size={14} />
            </button>
            <span style={{ color: 'white', fontWeight: 800, minWidth: 16, textAlign: 'center', fontSize: 15 }}>{qty}</span>
            <button onClick={handleAdd}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
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
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    if (!id || id === 'undefined') {
      toast.error('Invalid restaurant');
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await restaurantAPI.getById(id);
        const rest = res.data.data;
        setRestaurant(rest);

        // Get menu - embedded in restaurant or separate call
        let menuData = rest.menu || [];
        if (!menuData.length) {
          try {
            const menuRes = await restaurantAPI.getMenu(id);
            menuData = menuRes.data.data || [];
          } catch (e) {}
        }
        setMenu(menuData);
        if (menuData.length) setActiveCategory(menuData[0]._id || menuData[0].category_id || 0);
      } catch (err) {
        toast.error('Restaurant not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div><Navbar /><div className="page-loader"><div className="spinner" /></div></div>
  );
  if (!restaurant) return null;

  const restId = restaurant._id || restaurant.id || id;
  const restName = restaurant.name;
  const rating = restaurant.avgRating || restaurant.avg_rating || 0;
  const totalRatings = restaurant.totalRatings || restaurant.total_ratings || 0;
  const deliveryTime = restaurant.avgDeliveryTime || restaurant.avg_delivery_time || 30;
  const deliveryFee = restaurant.deliveryFee || restaurant.delivery_fee || 0;
  const cover = restaurant.coverImageUrl || restaurant.cover_image_url;
  const logo = restaurant.logoUrl || restaurant.logo_url;
  const cuisines = restaurant.cuisineTypes || restaurant.cuisine_types || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden', background: 'var(--gray-800)' }}>
        {cover ? (
          <img src={cover} alt={restName} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a0a00, #3d1a00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🍽️</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 20, left: 20,
          background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 10,
          padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
        }}>
          <ChevronLeft size={18} /> Back
        </button>

        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            {logo && (
              <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', border: '3px solid white', background: 'white', boxShadow: 'var(--shadow-md)', flexShrink: 0 }}>
                <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 6 }}>{restName}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{cuisines.join(' · ')}</p>
              <span style={{ display: 'inline-block', marginTop: 6, background: 'var(--success)', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>● Open Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '16px 24px' }}>
        <div className="container" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={16} fill="var(--warning)" color="var(--warning)" />
            <span style={{ fontWeight: 700 }}>{parseFloat(rating).toFixed(1)}</span>
            <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>({totalRatings} reviews)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)', fontSize: 14 }}>
            <Clock size={15} /><span>{deliveryTime} min</span>
          </div>
          <div style={{ color: 'var(--gray-600)', fontSize: 14 }}>
            {deliveryFee > 0 ? `₹${deliveryFee} delivery` : '🎉 Free delivery'}
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
            {menu.filter(cat => cat.isActive !== false).map((cat, idx) => {
              const catId = cat._id || cat.category_id || idx;
              return (
                <button key={catId} onClick={() => {
                  setActiveCategory(catId);
                  document.getElementById(`cat-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                  background: activeCategory === catId ? 'var(--crave-orange-pale)' : 'transparent',
                  color: activeCategory === catId ? 'var(--crave-orange)' : 'var(--gray-700)',
                  border: 'none', fontWeight: activeCategory === catId ? 700 : 500,
                  fontSize: 14, cursor: 'pointer', transition: 'var(--transition)'
                }}>
                  {cat.name || cat.category_name}
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--gray-400)' }}>
                    ({(cat.items || []).length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1 }}>
          {menu.filter(cat => cat.isActive !== false).map((cat, idx) => {
            const catId = cat._id || cat.category_id || idx;
            const catName = cat.name || cat.category_name;
            const items = (cat.items || []).filter(item =>
              item.isAvailable !== false && (!vegOnly || item.isVeg)
            );
            if (!items.length) return null;
            return (
              <div key={catId} id={`cat-${catId}`} style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{catName}</h2>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>{items.length} items</p>
                {items.map((item, iIdx) => (
                  <MenuItem
                    key={item._id || item.id || iIdx}
                    item={item}
                    restaurantId={restId}
                    restaurantName={restName}
                  />
                ))}
              </div>
            );
          })}
          {menu.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🍽️</div>
              <p style={{ color: 'var(--gray-500)', fontSize: 16 }}>Menu is being updated. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      {totalItems > 0 && (
        <button className="hide-desktop" onClick={() => setCartOpen(true)} style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--crave-orange)', color: 'white', border: 'none',
          borderRadius: 'var(--radius-full)', padding: '14px 28px', fontSize: 15,
          fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-orange)',
          display: 'flex', alignItems: 'center', gap: 10, zIndex: 50
        }}>
          <ShoppingCart size={18} /> {totalItems} items · View Cart
        </button>
      )}

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
