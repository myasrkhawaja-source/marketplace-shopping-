/**
 * pages/NotFoundPage.jsx
 * ---------------------------------------------------------
 * 404 page.
 */
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="container page">
    <div className="empty-state">
      <div className="icon" aria-hidden>💔</div>
      <h1>404 — Page not found</h1>
      <p className="muted">The page you are looking for does not exist or was moved.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <Link className="btn" to="/">Back to home</Link>
        <Link className="btn btn-outline" to="/products">Browse products</Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
