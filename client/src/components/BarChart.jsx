/**
 * components/BarChart.jsx
 * ---------------------------------------------------------
 * Dependency free bar chart used for "sales by month".
 * data = [{ label: '2026-01', value: 1250 }]
 */
import { formatPrice } from '../config/constants';

const BarChart = ({ data = [], valueFormatter = formatPrice, height = 150 }) => {
  if (!data.length) {
    return <p className="muted small">No data to display yet.</p>;
  }

  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="chart" style={{ height: height + 40 }}>
      {data.map((item) => {
        const barHeight = Math.round(((Number(item.value) || 0) / max) * height);
        return (
          <div className="chart-col" key={item.label}>
            <span className="chart-value">{item.value ? valueFormatter(item.value) : ''}</span>
            <div className="chart-bar" style={{ height: Math.max(barHeight, 4) }} />
            <span className="chart-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
