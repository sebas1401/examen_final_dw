export function StatCard({ label, value, caption }) {
  return (
    <div className="stat-card">
      <small>{label}</small>
      <strong>{value}</strong>
      {caption && <span className="stat-caption">{caption}</span>}
    </div>
  );
}


