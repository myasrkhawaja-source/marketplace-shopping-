/**
 * src/api/admin.api.js
 * ---------------------------------------------------------
 * The admin panel endpoints (users, shops, products, orders, categories).
 */
import { api } from './client';

export const adminApi = {
  // Statistics
  dashboard: () => api.get('/dashboard/admin'),

  // Users
  users: (params) => api.get('/users', params),
  user: (id) => api.get(`/users/${id}`),
  updateUser: (id, payload) => api.put(`/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Shops (approval workflow)
  shops: (params) => api.get('/shops/admin/all', params),
  moderateShop: (id, status, reason = '') => api.put(`/shops/${id}/status`, { status, reason }),
  shopStats: (id) => api.get(`/shops/${id}/stats`),
  deleteShop: (id) => api.delete(`/shops/${id}`),

  // Products (moderation)
  products: (params) => api.get('/products/admin/all', params),
  moderateProduct: (id, status, reason = '') =>
    api.put(`/products/${id}/moderate`, { status, reason }),
  toggleFeatured: (id, isFeatured) => api.put(`/products/${id}/feature`, { isFeatured }),

  // Orders
  orders: (params) => api.get('/orders/admin/all', params),
  setPaymentStatus: (id, paymentStatus) => api.put(`/orders/${id}/payment`, { paymentStatus }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),

  // Reviews moderation
  reviews: (params) => api.get('/reviews/admin/all', params),

  // Categories
  categories: (params) => api.get('/categories', { all: true, ...params }),
  createCategory: (payload) => api.post('/categories', payload),
  updateCategory: (id, payload) => api.put(`/categories/${id}`, payload),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};
