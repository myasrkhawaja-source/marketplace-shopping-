/**
 * components/StatCard.jsx
 * ---------------------------------------------------------
 * KPI tile used in the seller and admin dashboards.
 */
const StatCard = ({ label, value, icon = '📊', variant = '' }) => (
  <div className={`stat-card ${variant}`}>
    <div className="stat-icon" aria-hidden>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

export default StatCard;
