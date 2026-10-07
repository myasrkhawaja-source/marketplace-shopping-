/**
 * src/api/order.api.js
 * ---------------------------------------------------------
 * Checkout, customer orders, bookings and reviews.
 */
import { api } from './client';

export const orderApi = {
  checkout: (payload) => api.post('/orders/checkout', payload),

  myOrders: (params) => api.get('/orders/my', params),
  myOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),

  // Customer dashboard (orders, spending, upcoming bookings)
  customerStats: () => api.get('/dashboard/customer'),

  // Reviews
  createReview: (payload) => api.post('/reviews', payload),
  myReviews: () => api.get('/reviews/my'),
  updateReview: (id, payload) => api.put(`/reviews/${id}`, payload),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};
