import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './styles/global.css';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PartnerDashboard = lazy(() => import('./pages/partner/PartnerDashboard'));
const PartnerOrders = lazy(() => import('./pages/partner/PartnerOrders'));
const PartnerMenu = lazy(() => import('./pages/partner/PartnerMenu'));
const PartnerSetup = lazy(() => import('./pages/partner/PartnerSetup'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminRestaurants = lazy(() => import('./pages/admin/AdminRestaurants'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));

const PageLoader = () => (
  <div className="page-loader">
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    if (user.role === 'partner') return <Navigate to="/partner" replace />;
    if (['admin', 'super_admin'].includes(user.role)) return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

        {/* Customer */}
        <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['customer']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute roles={['customer']}><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={['customer']}><ProfilePage /></ProtectedRoute>} />

        {/* Partner */}
        <Route path="/partner" element={<ProtectedRoute roles={['partner']}><PartnerDashboard /></ProtectedRoute>} />
        <Route path="/partner/orders" element={<ProtectedRoute roles={['partner']}><PartnerOrders /></ProtectedRoute>} />
        <Route path="/partner/menu" element={<ProtectedRoute roles={['partner']}><PartnerMenu /></ProtectedRoute>} />
        <Route path="/partner/setup" element={<ProtectedRoute roles={['partner']}><PartnerSetup /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminRestaurants /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminOrders /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              },
              success: { iconTheme: { primary: '#FF5A1F', secondary: 'white' } }
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
