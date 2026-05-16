import type { RiskLevel } from '@/lib/sdk'

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md'
}

export function RiskBadge({ level, size = 'sm' }: RiskBadgeProps) {
  const getClasses = () => {
    const baseClasses =
      size === 'sm'
        ? 'px-1 py-[2px] text-[11px]'
        : 'px-2 py-0.5 text-xs'

    switch (level) {
      case 'critical':
        return `${baseClasses} border-destructive text-destructive bg-error-container/10 font-bold`
      case 'high':
        return `${baseClasses} border-on-tertiary-fixed-variant text-on-tertiary-fixed-variant bg-tertiary-fixed/10 font-bold`
      case 'medium':
        return `${baseClasses} border-outline text-on-surface-variant font-bold`
      case 'low':
        return `${baseClasses} border-secondary text-secondary bg-secondary-container/10 font-bold`
      default:
        return `${baseClasses} border-outline-variant text-on-surface-variant`
    }
  }

  const getLabel = () => {
    switch (level) {
      case 'critical':
        return 'CRÍTICO'
      case 'high':
        return 'ALTO'
      case 'medium':
        return 'MEDIO'
      case 'low':
        return 'BAJO'
      default:
        return level.toUpperCase()
    }
  }

  return (
    <span className={`border rounded-sm uppercase tracking-tight ${getClasses()}`}>
      {getLabel()}
    </span>
  )
}
