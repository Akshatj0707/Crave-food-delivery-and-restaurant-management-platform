import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bike, Utensils, MapPin, ChevronRight, Star, Flame } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import RestaurantCard from '../components/customer/RestaurantCard';
import { restaurantAPI } from '../utils/api';

const CUISINES = ['All', 'North Indian', 'Pizza', 'Burgers', 'Italian', 'Biryani', 'Mughlai', 'Chinese', 'South Indian'];
const MODES = [
  { key: 'delivery', label: 'Delivery', icon: <Bike size={18} />, color: '#FF5A1F' },
  { key: 'takeaway', label: 'Takeaway', icon: <Utensils size={18} />, color: '#2563EB' },
  { key: 'dine_in', label: 'Dine-in', icon: <MapPin size={18} />, color: '#16A34A' },
];

const HeroSection = ({ search, setSearch, activeMode, setActiveMode, onSearch }) => (
  <section style={{
    background: 'linear-gradient(135deg, var(--gray-900) 0%, #2D1206 50%, var(--gray-900) 100%)',
    padding: '80px 0 100px', position: 'relative', overflow: 'hidden'
  }}>
    {/* Decorative blobs */}
    <div style={{
      position: 'absolute', top: -60, right: -60, width: 400, height: 400,
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,90,31,0.2) 0%, transparent 70%)',
      pointerEvents: 'none'
    }} />
    <div style={{
      position: 'absolute', bottom: -40, left: -40, width: 300, height: 300,
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,90,31,0.1) 0%, transparent 70%)',
      pointerEvents: 'none'
    }} />

    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,90,31,0.15)', border: '1px solid rgba(255,90,31,0.3)', borderRadius: 'var(--radius-full)', padding: '6px 16px', marginBottom: 24 }}>
          <Flame size={14} color="var(--crave-orange)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--crave-orange-light)' }}>500+ Restaurants. One Platform.</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 68px)',
          fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 16
        }}>
          Food that <span style={{ color: 'var(--crave-orange)', fontStyle: 'italic' }}>craves</span><br />to be eaten
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', marginBottom: 40, lineHeight: 1.6 }}>
          Delivery, Takeaway, or Dine-in — your choice, your cravings.
        </p>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => setActiveMode(mode.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                background: activeMode === mode.key ? mode.color : 'rgba(255,255,255,0.1)',
                color: activeMode === mode.key ? 'white' : 'rgba(255,255,255,0.7)',
                border: activeMode === mode.key ? 'none' : '1px solid rgba(255,255,255,0.2)',
                transition: 'var(--transition)'
              }}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} size={20} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder="Search restaurants, cuisines..."
            style={{
              width: '100%', padding: '18px 160px 18px 56px',
              borderRadius: 'var(--radius-full)', border: 'none',
              fontSize: 16, fontFamily: 'var(--font-body)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', outline: 'none'
            }}
          />
          <button
            onClick={onSearch}
            className="btn btn-primary"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
          >Search</button>
        </div>
      </div>
    </div>
  </section>
);

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMode, setActiveMode] = useState('delivery');
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [pagination, setPagination] = useState({});

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = { mode: activeMode };
      if (search) params.search = search;
      if (activeCuisine !== 'All') params.cuisine = activeCuisine;
      const res = await restaurantAPI.getAll(params);
      setRestaurants(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, [activeMode, activeCuisine, search]);

  useEffect(() => { fetchRestaurants(); }, [activeMode, activeCuisine]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />

      <HeroSection
        search={search}
        setSearch={setSearch}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        onSearch={fetchRestaurants}
      />

      {/* Main Content */}
      <div className="container" style={{ padding: '48px 20px' }}>
        {/* Cuisine Filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 36, scrollbarWidth: 'none' }}>
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => setActiveCuisine(c)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-full)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: activeCuisine === c ? 'var(--crave-orange)' : 'white',
                color: activeCuisine === c ? 'white' : 'var(--gray-700)',
                border: activeCuisine === c ? 'none' : '1.5px solid var(--gray-200)',
                transition: 'var(--transition)'
              }}
            >{c}</button>
          ))}
        </div>

        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              {activeCuisine === 'All' ? 'All Restaurants' : activeCuisine}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
              {pagination.total || 0} restaurants for {activeMode.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Restaurant Grid */}
        {loading ? (
          <div className="page-loader">
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--gray-500)' }}>Loading restaurants...</p>
            </div>
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, fontFamily: 'var(--font-display)' }}>No restaurants found</h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Try changing your filters or search query</p>
            <button className="btn btn-primary" onClick={() => { setSearch(''); setActiveCuisine('All'); }}>Clear Filters</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24
          }}>
            {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        background: 'var(--gray-900)', color: 'white',
        padding: '48px 0 32px', marginTop: 80
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap', marginBottom: 48 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: 'var(--crave-orange)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18 }}>C</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900 }}>Crave</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                Your end-to-end food ordering and restaurant management platform. Delivery, Takeaway, or Dine-in.
              </p>
            </div>
            {[
              { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Blog'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Partner with Us'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{col.title}</h4>
                {col.links.map(link => (
                  <p key={link} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 10, cursor: 'pointer' }} onMouseEnter={e => e.target.style.color = 'var(--crave-orange)'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}>{link}</p>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>© 2024 Crave. All rights reserved.</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Made with ❤️ for food lovers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
