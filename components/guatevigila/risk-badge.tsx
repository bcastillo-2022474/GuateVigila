import type { RiskLevel } from '@/lib/sdk/types'

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md'
}

const RISK_COLOR: Record<RiskLevel, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#10b981',
}

const RISK_LABEL: Record<RiskLevel, string> = {
  critical: 'CRÍTICO',
  high:     'ALTO',
  medium:   'MEDIO',
  low:      'BAJO',
}

export function RiskBadge({ level, size = 'sm' }: RiskBadgeProps) {
  const color = RISK_COLOR[level]
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'

  return (
    <span
      className={`inline-flex items-center rounded-sm font-bold uppercase tracking-tight border ${sizeClass}`}
      style={{
        color,
        borderColor: `${color}50`,
        backgroundColor: `${color}15`,
      }}
    >
      {RISK_LABEL[level]}
    </span>
  )
}
