const statusMap = {
  ACTIVE: 'badge-success',
  INACTIVE: 'badge-muted',
  PENDING: 'badge-warning',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
  UNPAID: 'badge-danger',
  PARTIAL: 'badge-warning',
  PAID: 'badge-success',
};

export default function StatusBadge({ status }) {
  const cls = statusMap[status] || 'badge-muted';
  return <span className={`badge ${cls}`}>{status}</span>;
}
