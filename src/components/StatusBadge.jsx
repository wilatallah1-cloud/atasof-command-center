const classMap = {
  'ACTIVE': 'badge-active',
  'PAUSED': 'badge-paused',
  'TESTING': 'badge-testing',
  'PENDING': 'badge-pending',
  'APPROVED': 'badge-approved',
  'ON': 'badge-on',
  'OFF': 'badge-off',
  'NEEDS ATTENTION': 'badge-attention',
  'WAITING ON CLIENT': 'badge-waiting',
}

export default function StatusBadge({ status }) {
  const cls = classMap[status] || 'badge-waiting'
  return <span className={`badge ${cls}`}>{status}</span>
}
