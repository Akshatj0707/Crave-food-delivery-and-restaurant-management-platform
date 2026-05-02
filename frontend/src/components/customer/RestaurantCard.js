import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Bike, MapPin, Utensils } from 'lucide-react';

const ServiceBadge = ({ mode }) => {
  const config = {
    delivery: { icon: <Bike size={10} />, label: 'Delivery', color: 'var(--crave-orange)' },
    takeaway: { icon: <Utensils size={10} />, label: 'Takeaway', color: 'var(--info)' },
    dine_in: { icon: <MapPin size={10} />, label: 'Dine-in', color: 'var(--success)' },
  }[mode] || {};
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 'var(--radius-full)',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: `${config.color}18`, color: config.color
    }}>
      {config.icon}{config.label}
    </span>
  );
};

export default function RestaurantCard({ restaurant }) {
  const {
    id, name, description, cuisine_types, logo_url, cover_image_url,
    avg_rating, total_ratings, avg_delivery_time, delivery_fee,
    supports_delivery, supports_takeaway, supports_dine_in,
    is_open, is_featured, min_order_amount
  } = restaurant;

  return (
    <Link to={`/restaurant/${id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card" style={{
        cursor: 'pointer', transition: 'var(--transition-slow)',
        opacity: is_open ? 1 : 0.7,
        border: is_featured ? '2px solid var(--crave-orange-light)' : '1px solid var(--gray-200)'
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {/* Cover Image */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'var(--gray-100)' }}>
          {cover_image_url ? (
            <img
              src={cover_image_url}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--crave-orange-pale), var(--crave-orange-mid))' }} />
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
            {is_featured && (
              <span style={{
                background: 'var(--crave-orange)', color: 'white',
                padding: '3px 8px', borderRadius: 'var(--radius-full)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.05em'
              }}>★ FEATURED</span>
            )}
          </div>
          {!is_open && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{
                color: 'white', fontWeight: 800, fontSize: 16,
                background: 'rgba(0,0,0,0.6)', padding: '8px 20px',
                borderRadius: 'var(--radius-full)'
              }}>Currently Closed</span>
            </div>
          )}

          {/* Logo */}
          {logo_url && (
            <div style={{
              position: 'absolute', bottom: -20, left: 16,
              width: 52, height: 52, borderRadius: 12,
              overflow: 'hidden', border: '2px solid white',
              boxShadow: 'var(--shadow-md)', background: 'white'
            }}>
              <img src={logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-900)', fontFamily: 'var(--font-display)' }}>{name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
              <Star size={14} fill="var(--warning)" color="var(--warning)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{parseFloat(avg_rating || 0).toFixed(1)}</span>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>({total_ratings || 0})</span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10, lineHeight: 1.4 }}>
            {cuisine_types?.join(' · ')}
          </p>

          {/* Service modes */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {supports_delivery && <ServiceBadge mode="delivery" />}
            {supports_takeaway && <ServiceBadge mode="takeaway" />}
            {supports_dine_in && <ServiceBadge mode="dine_in" />}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gray-500)', fontSize: 13 }}>
              <Clock size={13} />
              <span>{avg_delivery_time} min</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {delivery_fee > 0 ? `₹${delivery_fee} delivery` : '🎉 Free delivery'}
            </div>
            {min_order_amount > 0 && (
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginLeft: 'auto' }}>
                Min ₹{min_order_amount}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
