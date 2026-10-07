/**
 * src/api/auth.api.js
 * ---------------------------------------------------------
 * Authentication + account endpoints.
 */
import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (payload) => api.put('/auth/password', payload),

  updateProfile: (payload) => api.put('/users/me', payload),

  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Addresses
  listAddresses: () => api.get('/users/me/addresses'),
  addAddress: (payload) => api.post('/users/me/addresses', payload),
  updateAddress: (id, payload) => api.put(`/users/me/addresses/${id}`, payload),
  deleteAddress: (id) => api.delete(`/users/me/addresses/${id}`),

  // Wish list
  listFavorites: () => api.get('/users/me/favorites'),
  toggleFavorite: (productId) => api.post(`/users/me/favorites/${productId}`),
};
