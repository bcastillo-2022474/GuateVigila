interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  icon?: string
}

export function MetricCard({
  label,
  value,
  subtitle,
  variant = 'default',
  icon,
}: MetricCardProps) {
  const valueColorClass =
    variant === 'success' ? 'text-foreground' :
    variant === 'warning' ? 'text-tertiary' :
    variant === 'danger' ? 'text-destructive' :
    'text-primary'

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-6 flex flex-col justify-between h-32">
      <span className="text-xs font-semibold tracking-widest uppercase text-on-surface">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-bold ${valueColorClass}`}>{value}</span>
        {icon && (
          <span
            className={`material-symbols-outlined filled ${
              variant === 'danger' ? 'text-destructive' : ''
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-sm text-on-surface">{subtitle}</span>
      )}
    </div>
  )
}
