import type { RiskLevel } from '@/lib/sdk/types'

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md'
}

export function RiskBadge({ level, size = 'sm' }: RiskBadgeProps) {
  const baseClasses =
    size === 'sm'
      ? 'px-1 py-[2px] text-[11px]'
      : 'px-2 py-0.5 text-xs'

  const classesByLevel: Record<RiskLevel, string> = {
    critical: `${baseClasses} border-destructive text-destructive bg-error-container/10 font-bold`,
    high: `${baseClasses} border-on-tertiary-fixed-variant text-on-tertiary-fixed-variant bg-tertiary-fixed/10 font-bold`,
    medium: `${baseClasses} border-outline text-on-surface-variant font-bold`,
    low: `${baseClasses} border-secondary text-secondary bg-secondary-container/10 font-bold`,
  }

  const labelsByLevel: Record<RiskLevel, string> = {
    critical: 'CRÍTICO',
    high: 'ALTO',
    medium: 'MEDIO',
    low: 'BAJO',
  }

  return (
    <span className={`border rounded-sm uppercase tracking-tight ${classesByLevel[level]}`}>
      {labelsByLevel[level]}
    </span>
  )
}
