/**
 * src/api/cart.api.js
 * ---------------------------------------------------------
 * Server side cart endpoints.
 */
import { api } from './client';

export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (payload) => api.post('/cart/items', payload),
  updateItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};
