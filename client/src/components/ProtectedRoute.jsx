/**
 * components/ProtectedRoute.jsx
 * ---------------------------------------------------------
 * Blocks a route when the visitor is not logged in (or has the wrong role).
 *   <ProtectedRoute roles={['seller']}> ... </ProtectedRoute>
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from './Loader';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Still checking the token -> show the spinner (avoids a false redirect)
  if (loading) return <Loader label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length && !roles.includes(user.role)) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="icon">🚫</div>
          <h2>Access denied</h2>
          <p className="muted">
            This page is reserved to: <strong>{roles.join(', ')}</strong>. You are signed in as{' '}
            <strong>{user.role}</strong>.
          </p>
          <a className="btn" href="/">Back to the store</a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
