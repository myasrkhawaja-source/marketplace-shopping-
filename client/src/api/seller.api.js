/**
 * src/api/seller.api.js
 * ---------------------------------------------------------
 * Seller area: dashboard, my products, my shop, my orders, bookings.
 */
import { api } from './client';

export const sellerApi = {
  // Dashboard
  dashboard: () => api.get('/dashboard/seller'),

  // Shop profile
  myShop: () => api.get('/shops/me'),
  updateShop: (payload) => api.put('/shops/me', payload),
  createShop: (payload) => api.post('/shops', payload),
  uploadShopMedia: ({ logo, cover }) => {
    const form = new FormData();
    if (logo) form.append('logo', logo);
    if (cover) form.append('cover', cover);
    return api.post('/shops/me/media', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Products / services
  myProducts: (params) => api.get('/products/mine', params),
  myProduct: (id) => api.get(`/products/mine/${id}`),
  createProduct: (payload) => api.post('/products', payload),
  updateProduct: (id, payload) => api.put(`/products/${id}`, payload),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadImages: (files) => {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('images', file));
    return api.post('/products/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Orders
  orders: (params) => api.get('/orders/seller/my', params),
  setOrderStatus: (orderId, status, note = '') =>
    api.put(`/orders/${orderId}/status`, { status, note }),

  // Bookings agenda (salon)
  bookings: (params) => api.get('/orders/seller/booking', params),

  // Reviews received
  reviews: (params) => api.get('/reviews/seller/my', params),
};
