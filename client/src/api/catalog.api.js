/**
 * src/api/catalog.api.js
 * ---------------------------------------------------------
 * Public catalogue: home data, products, categories, shops.
 */
import { api } from './client';

export const catalogApi = {
  // Home page blocks
  getHomeData: () => api.get('/products/home'),

  // Products / services
  getProducts: (params) => api.get('/products', params),
  getProduct: (idOrSlug) => api.get(`/products/${idOrSlug}`),

  // Categories
  getCategories: (params) => api.get('/categories', params),

  // Shops (beauty stores & salons)
  getShops: (params) => api.get('/shops', params),
  getShop: (slug) => api.get(`/shops/${slug}`),

  // Reviews of a product / a shop (public read)
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, params),
  getShopReviews: (shopId, params) => api.get(`/reviews/shop/${shopId}`, params),
};
