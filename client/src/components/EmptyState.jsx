/**
 * components/EmptyState.jsx
 * ---------------------------------------------------------
 * Friendly placeholder shown when a list is empty.
 */
import { Link } from 'react-router-dom';

const EmptyState = ({ icon = '🔍', title = 'Nothing here yet', message, actionLabel, actionTo }) => (
  <div className="empty-state">
    <div className="icon" aria-hidden>{icon}</div>
    <h3>{title}</h3>
    {message && <p className="muted small">{message}</p>}
    {actionLabel && actionTo && (
      <Link className="btn btn-sm" to={actionTo}>{actionLabel}</Link>
    )}
  </div>
);

export default EmptyState;
