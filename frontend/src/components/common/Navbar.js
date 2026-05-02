import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ChevronDown, LayoutDashboard, Package, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const CraveLogo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
    <div style={{
      width: 36, height: 36, background: 'var(--crave-orange)',
      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-orange)'
    }}>
      <span style={{ color: 'white', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)' }}>C</span>
    </div>
    <span style={{
      fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900,
      color: 'var(--gray-900)', letterSpacing: '-0.02em'
    }}>
      Crave
    </span>
  </Link>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (['admin', 'super_admin'].includes(user.role)) return { href: '/admin', label: 'Admin Panel' };
    if (user.role === 'partner') return { href: '/partner', label: 'Partner Hub' };
    return null;
  };

  const dashLink = getDashboardLink();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--gray-200)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 20 }}>
        <CraveLogo />

        <div style={{ flex: 1 }} />

        {/* Desktop Nav */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.role === 'customer' && (
            <>
              <Link to="/orders" style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-600)' }}>
                My Orders
              </Link>
              <Link to="/profile" style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-600)' }}>
                Profile
              </Link>
              <Link to="/checkout" style={{ position: 'relative' }}>
                <button className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                  <ShoppingCart size={16} />
                  Cart
                  {totalItems > 0 && (
                    <span style={{
                      background: 'white', color: 'var(--crave-orange)',
                      borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700,
                      padding: '1px 6px', minWidth: 18, textAlign: 'center'
                    }}>{totalItems}</span>
                  )}
                </button>
              </Link>
            </>
          )}

          {dashLink && (
            <Link to={dashLink.href}>
              <button className="btn btn-secondary btn-sm">
                <LayoutDashboard size={15} />
                {dashLink.label}
              </button>
            </Link>
          )}

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 'var(--radius-full)',
                  background: 'var(--gray-100)', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, color: 'var(--gray-700)'
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--crave-orange)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700
                }}>
                  {user.first_name?.[0]?.toUpperCase()}
                </div>
                {user.first_name}
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'white', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-200)',
                  minWidth: 180, overflow: 'hidden', zIndex: 100
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{user.first_name} {user.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '12px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: 'var(--error)', fontWeight: 500
                    }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login">
                <button className="btn btn-ghost btn-sm">Sign In</button>
              </Link>
              <Link to="/signup">
                <button className="btn btn-primary btn-sm">Get Started</button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.role === 'customer' && (
            <Link to="/checkout" style={{ position: 'relative' }}>
              <ShoppingCart size={22} color="var(--gray-700)" />
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute', top: -8, right: -8,
                  background: 'var(--crave-orange)', color: 'white',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{totalItems}</span>
              )}
            </Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', padding: 4 }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'white', borderTop: '1px solid var(--gray-100)',
          padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          {user ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                Signed in as {user.first_name} · {user.role}
              </div>
              {dashLink && <Link to={dashLink.href} onClick={() => setMenuOpen(false)} style={{ padding: '10px 0', fontWeight: 600, color: 'var(--crave-orange)' }}>{dashLink.label}</Link>}
              {user.role === 'customer' && (
                <>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} style={{ padding: '10px 0', fontWeight: 500 }}>My Orders</Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ padding: '10px 0', fontWeight: 500 }}>Profile</Link>
                </>
              )}
              <button onClick={handleLogout} style={{ padding: '10px 0', textAlign: 'left', background: 'none', border: 'none', color: 'var(--error)', fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{ padding: '10px 0', fontWeight: 500 }}>Sign In</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ padding: '10px 0', fontWeight: 600, color: 'var(--crave-orange)' }}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
