/**
 * App.jsx
 * ---------------------------------------------------------
 * All the routes of the application grouped by area:
 *   public/customer  ->  MainLayout
 *   seller           ->  DashboardLayout (role: seller)
 *   admin            ->  DashboardLayout (role: admin)
 */
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

/* ----------------------------- Public / customer ----------------------------- */
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ShopsPage from './pages/ShopsPage';
import ShopDetailsPage from './pages/ShopDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

/* --------------------------------- Seller ----------------------------------- */
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import ProductFormPage from './pages/seller/ProductFormPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerBookingsPage from './pages/seller/SellerBookingsPage';
import SellerReviewsPage from './pages/seller/SellerReviewsPage';
import SellerShopPage from './pages/seller/SellerShopPage';

/* ---------------------------------- Admin ----------------------------------- */
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminShopsPage from './pages/admin/AdminShopsPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';

const App = () => (
  <Routes>
    {/* ------------------------- Public + customer ------------------------- */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:slug" element={<ProductDetailsPage />} />
      <Route path="/shops" element={<ShopsPage />} />
      <Route path="/shops/:slug" element={<ShopDetailsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <MyOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Route>

    {/* ----------------------------- Seller area ---------------------------- */}
    <Route
      path="/seller"
      element={
        <ProtectedRoute roles={['seller']}>
          <DashboardLayout role="seller" />
        </ProtectedRoute>
      }
    >
      <Route index element={<SellerDashboardPage />} />
      <Route path="products" element={<SellerProductsPage />} />
      <Route path="products/new" element={<ProductFormPage />} />
      <Route path="products/:id/edit" element={<ProductFormPage />} />
      <Route path="orders" element={<SellerOrdersPage />} />
      <Route path="bookings" element={<SellerBookingsPage />} />
      <Route path="reviews" element={<SellerReviewsPage />} />
      <Route path="shop" element={<SellerShopPage />} />
    </Route>

    {/* ------------------------------ Admin area ---------------------------- */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }
    >
      <Route index element={<AdminDashboardPage />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="shops" element={<AdminShopsPage />} />
      <Route path="products" element={<AdminProductsPage />} />
      <Route path="orders" element={<AdminOrdersPage />} />
      <Route path="categories" element={<AdminCategoriesPage />} />
    </Route>

    {/* Safety net */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
