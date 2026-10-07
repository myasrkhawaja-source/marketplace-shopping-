/**
 * components/Loader.jsx
 * ---------------------------------------------------------
 * Simple loading spinner with an optional label.
 */
const Loader = ({ label = 'Loading…', inline = false }) => (
  <div className={inline ? 'row' : 'loader'}>
    <div className="spinner" />
    <span className="muted small">{label}</span>
  </div>
);

export default Loader;
