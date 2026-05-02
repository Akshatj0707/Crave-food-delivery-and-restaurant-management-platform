import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartSidebar({ isOpen, onClose }) {
  const { items, restaurantName, serviceMode, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const TAX_RATE = 0.05;
  const DELIVERY_FEE = serviceMode === 'delivery' ? 40 : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + DELIVERY_FEE;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      onClose();
      return;
    }
    navigate('/checkout');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)', zIndex: 200
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 380,
        maxWidth: '100vw', background: 'white',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--gray-100)'
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Your Cart</h3>
            {restaurantName && <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>from {restaurantName}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Service Mode */}
        {items.length > 0 && (
          <div style={{ padding: '16px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Type</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['delivery', 'takeaway', 'dine_in'].map(mode => (
                <button
                  key={mode}
                  onClick={() => {}}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: serviceMode === mode ? 'var(--crave-orange)' : 'white',
                    color: serviceMode === mode ? 'white' : 'var(--gray-600)',
                    border: serviceMode === mode ? 'none' : '1px solid var(--gray-200)',
                    textTransform: 'capitalize'
                  }}
                >
                  {mode.replace('_', '-')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <ShoppingCart size={48} color="var(--gray-300)" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Your cart is empty</p>
              <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>Add items from a restaurant to get started</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} style={{
                      width: 60, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0
                    }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{item.name}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--crave-orange)', marginTop: 2 }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: 26, height: 26, borderRadius: 6, background: 'var(--gray-100)',
                          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      ><Minus size={12} /></button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          width: 26, height: 26, borderRadius: 6, background: 'var(--crave-orange)',
                          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: 'white'
                        }}
                      ><Plus size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                style={{
                  background: 'none', border: '1px dashed var(--gray-300)', borderRadius: 8,
                  padding: '8px', fontSize: 13, color: 'var(--gray-500)', cursor: 'pointer', width: '100%'
                }}
              >Clear Cart</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                ['Subtotal', `₹${subtotal.toFixed(2)}`],
                ...(DELIVERY_FEE > 0 ? [['Delivery Fee', `₹${DELIVERY_FEE.toFixed(2)}`]] : [['Delivery Fee', '🎉 Free']]),
                ['Taxes (5%)', `₹${tax.toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--gray-600)' }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, paddingTop: 8, borderTop: '1px solid var(--gray-200)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--crave-orange)' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn btn-primary w-full" onClick={handleCheckout} style={{ width: '100%' }}>
              Proceed to Checkout → ₹{total.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
