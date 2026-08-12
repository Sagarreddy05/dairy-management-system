export default function DashboardCard({ title, value, subtitle, accent }) {
  return (
    <div className={`dash-card ${accent || ''}`}>
      <p className="dash-card-title">{title}</p>
      <h3 className="dash-card-value">{value}</h3>
      {subtitle && <p className="dash-card-sub">{subtitle}</p>}
    </div>
  );
}
