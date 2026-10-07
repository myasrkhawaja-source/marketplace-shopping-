/**
 * layouts/DashboardLayout.jsx
 * ---------------------------------------------------------
 * Shell used by the seller and the admin panels: sidebar + header.
 */
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { APP_NAME } from '../config/constants';

const DashboardLayout = ({ role = 'seller' }) => {
  const { user, shop, logout } = useAuth();
  const { t } = useLanguage();

  const SELLER_LINKS = [
    { to: '/seller', label: t.dashboard.overview, icon: '📊', end: true },
    { to: '/seller/products', label: t.dashboard.myProducts, icon: '📦' },
    { to: '/seller/products/new', label: t.dashboard.addProduct, icon: '➕' },
    { to: '/seller/orders', label: t.dashboard.orders, icon: '🧾' },
    { to: '/seller/bookings', label: t.dashboard.bookings, icon: '📅' },
    { to: '/seller/reviews', label: t.dashboard.reviews, icon: '⭐' },
    { to: '/seller/shop', label: t.dashboard.shopProfile, icon: '🏪' },
  ];

  const ADMIN_LINKS = [
    { to: '/admin', label: t.dashboard.overview, icon: '📊', end: true },
    { to: '/admin/users', label: t.dashboard.usersSellers, icon: '👥' },
    { to: '/admin/shops', label: t.dashboard.shopsApproval, icon: '🏬' },
    { to: '/admin/products', label: t.dashboard.productsApproval, icon: '📦' },
    { to: '/admin/orders', label: t.dashboard.orders, icon: '🧾' },
    { to: '/admin/categories', label: t.dashboard.categories, icon: '🏷️' },
  ];

  const links = role === 'admin' ? ADMIN_LINKS : SELLER_LINKS;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-logo">💄</span>
          <span>{APP_NAME}</span>
        </Link>

        <div>
          <p className="sidebar-title">
            {role === 'admin' ? t.dashboard.adminPanel : t.dashboard.sellerPanel}
          </p>
          <nav>
            <ul className="sidebar-nav">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end}>
                    <span aria-hidden>{link.icon}</span>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {role === 'seller' && shop && (
          <div className="sidebar-card">
            <strong>{shop.name}</strong>
            <p className="small muted" style={{ margin: '0.3rem 0' }}>
              {t.dashboard.status}: {shop.status}
              {shop.rating ? ` · ⭐ ${shop.rating}` : ''}
            </p>
            <Link className="small" to={`/shops/${shop.slug}`}>{t.dashboard.viewPublicPage} →</Link>
          </div>
        )}

        <div className="row" style={{ marginTop: 'auto' }}>
          <Link to="/" className="btn btn-light btn-sm">🛍️ {t.dashboard.store}</Link>
          <button type="button" className="btn btn-outline btn-sm" onClick={logout}>
            {t.dashboard.logout}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>
              {role === 'admin' ? t.dashboard.adminDashboard : t.dashboard.sellerDashboard}
            </h1>
            <p className="muted small" style={{ margin: 0 }}>
              {t.dashboard.welcomeBack} {user?.name}
            </p>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
