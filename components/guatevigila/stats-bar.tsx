interface StatsBarProps {
  processesAnalyzed: number
  totalAmount: number
  currency: string
  periodStart: number
  periodEnd: number
  activeAlerts: number
}

export function StatsBar({
  processesAnalyzed = 0,
  totalAmount = 0,
  currency = '',
  periodStart,
  periodEnd,
  activeAlerts = 0,
}: StatsBarProps) {
  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)}B`
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`
    }
    return num.toLocaleString('es-GT')
  }

  return (
    <section className="w-full bg-surface-container-low py-2 border-b border-outline-variant">
      <div className="max-w-[1200px] mx-auto px-4 md:px-16">
        <p className="text-on-surface-variant text-xs font-semibold tracking-wide">
          {processesAnalyzed.toLocaleString('es-GT')} PROCESOS ANALIZADOS{' '}
          <span className="mx-1">·</span> {currency} {formatNumber(totalAmount)}{' '}
          <span className="mx-1">·</span> {periodStart}–{periodEnd}{' '}
          <span className="mx-1">·</span>{' '}
          <span className="text-on-tertiary-fixed-variant font-bold">
            {activeAlerts.toLocaleString('es-GT')} ALERTAS ACTIVAS
          </span>
        </p>
      </div>
    </section>
  )
}
