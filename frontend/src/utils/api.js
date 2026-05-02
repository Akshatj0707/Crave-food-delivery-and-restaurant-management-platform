import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crave_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('crave_token');
      localStorage.removeItem('crave_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Restaurants ────────────────────────────────────────────
export const restaurantAPI = {
  getAll: (params) => api.get('/restaurants', { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  getMine: () => api.get('/restaurants/partner/mine'),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  getMenu: (id) => api.get(`/restaurants/${id}/menu`),
  addMenuItem: (id, data) => api.post(`/restaurants/${id}/menu/items`, data),
  updateMenuItem: (itemId, data) => api.put(`/restaurants/menu/items/${itemId}`, data),
  getTables: (id) => api.get(`/restaurants/${id}/tables`),
};

// ─── Orders ─────────────────────────────────────────────────
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getPartnerOrders: (params) => api.get('/orders/partner/restaurant', { params }),
  getPartnerStats: () => api.get('/orders/partner/stats'),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  addReview: (id, data) => api.post(`/orders/${id}/review`, data),
};

// ─── Payments ───────────────────────────────────────────────
export const paymentAPI = {
  getConfig: () => api.get('/payments/config'),
  createIntent: (data) => api.post('/payments/create-intent', data),
  confirm: (data) => api.post('/payments/confirm', data),
  refund: (data) => api.post('/payments/refund', data),
};

// ─── Addresses ──────────────────────────────────────────────
export const addressAPI = {
  getAll: () => api.get('/addresses'),
  add: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

// ─── Admin ──────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getRestaurants: (params) => api.get('/admin/restaurants', { params }),
  updateRestaurant: (id, data) => api.patch(`/admin/restaurants/${id}`, data),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getRevenueChart: () => api.get('/admin/revenue-chart'),
};

export default api;
