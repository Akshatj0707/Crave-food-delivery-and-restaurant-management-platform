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
  // Fix: use _id or id, never undefined
  const restId = restaurant._id || restaurant.id;

  const {
    name, description, cuisine_types, cuisineTypes, logo_url, logoUrl,
    cover_image_url, coverImageUrl, avg_rating, avgRating, total_ratings,
    totalRatings, avg_delivery_time, avgDeliveryTime, delivery_fee, deliveryFee,
    supports_delivery, supportsDelivery, supports_takeaway, supportsTakeaway,
    supports_dine_in, supportsDineIn, is_featured, isFeatured, min_order_amount,
    minOrderAmount,
  } = restaurant;

  // Handle both snake_case (old) and camelCase (MongoDB)
  const cuisines = cuisine_types || cuisineTypes || [];
  const logo = logo_url || logoUrl;
  const cover = cover_image_url || coverImageUrl;
  const rating = avg_rating || avgRating || 0;
  const ratings = total_ratings || totalRatings || 0;
  const deliveryTime = avg_delivery_time || avgDeliveryTime || 30;
  const fee = delivery_fee || deliveryFee || 0;
  const featured = is_featured || isFeatured || false;
  const minOrder = min_order_amount || minOrderAmount || 0;
  const hasDelivery = supports_delivery || supportsDelivery || false;
  const hasTakeaway = supports_takeaway || supportsTakeaway || false;
  const hasDineIn = supports_dine_in || supportsDineIn || false;

  // Force all restaurants as open
  const isOpen = true;

  if (!restId) return null; // Don't render if no ID

  return (
    <Link to={`/restaurant/${restId}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card" style={{
        cursor: 'pointer', transition: 'var(--transition-slow)',
        border: featured ? '2px solid var(--crave-orange-light)' : '1px solid var(--gray-200)'
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
        <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'linear-gradient(135deg, var(--crave-orange-pale), var(--crave-orange-mid))' }}>
          {cover ? (
            <img
              src={cover}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🍽️</div>
          )}

          {featured && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <span style={{
                background: 'var(--crave-orange)', color: 'white',
                padding: '3px 8px', borderRadius: 'var(--radius-full)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.05em'
              }}>★ FEATURED</span>
            </div>
          )}

          {/* Open badge */}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <span style={{
              background: 'var(--success)', color: 'white',
              padding: '3px 10px', borderRadius: 'var(--radius-full)',
              fontSize: 10, fontWeight: 800
            }}>● Open</span>
          </div>

          {logo && (
            <div style={{
              position: 'absolute', bottom: -20, left: 16,
              width: 52, height: 52, borderRadius: 12,
              overflow: 'hidden', border: '2px solid white',
              boxShadow: 'var(--shadow-md)', background: 'white'
            }}>
              <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-900)', fontFamily: 'var(--font-display)' }}>{name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
              <Star size={14} fill="var(--warning)" color="var(--warning)" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>{parseFloat(rating).toFixed(1)}</span>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>({ratings})</span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10, lineHeight: 1.4 }}>
            {cuisines.join(' · ')}
          </p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {hasDelivery && <ServiceBadge mode="delivery" />}
            {hasTakeaway && <ServiceBadge mode="takeaway" />}
            {hasDineIn && <ServiceBadge mode="dine_in" />}
          </div>

          <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gray-500)', fontSize: 13 }}>
              <Clock size={13} />
              <span>{deliveryTime} min</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {fee > 0 ? `₹${fee} delivery` : '🎉 Free delivery'}
            </div>
            {minOrder > 0 && (
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginLeft: 'auto' }}>
                Min ₹{minOrder}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
