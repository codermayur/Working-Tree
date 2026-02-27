export function cn(...v) {
  return v.filter(Boolean).join(' ');
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getTypeLabel(type) {
  if (type === 'equipment') return 'Equipment Rental';
  if (type === 'cattle') return 'Cattle Rental';
  return 'Job Work';
}

