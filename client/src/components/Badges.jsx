import clsx from 'clsx';

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30'
};

const categoryColors = {
  'Spoofing': 'bg-purple-500/20 text-purple-400',
  'Tampering': 'bg-blue-500/20 text-blue-400',
  'Repudiation': 'bg-cyan-500/20 text-cyan-400',
  'Information Disclosure': 'bg-yellow-500/20 text-yellow-400',
  'Denial of Service': 'bg-orange-500/20 text-orange-400',
  'Elevation of Privilege': 'bg-red-500/20 text-red-400'
};

function getSeverityLevel(score) {
  if (score >= 15) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export function SeverityBadge({ score }) {
  const level = getSeverityLevel(score);
  return (
    <span className={clsx('px-2 py-0.5 rounded-md text-xs font-semibold border', severityColors[level])}>
      {level.toUpperCase()} ({score})
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded-md text-xs font-medium', categoryColors[category] || 'bg-gray-500/20 text-gray-400')}>
      {category}
    </span>
  );
}

export function getSeverityColor(score) {
  if (score >= 15) return 'text-red-400';
  if (score >= 10) return 'text-orange-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-green-400';
}

export { getSeverityLevel, severityColors, categoryColors };
