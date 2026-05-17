import Link from 'next/link'
import type { Alert, RiskLevel } from '@/lib/sdk/types'

interface AlertCardProps {
  alert: Alert
}

export const SIGNAL_LABELS: Record<string, string> = {
  single_bidder: 'Proveedor único recurrente',
  short_deadline: 'Plazo imposible',
  direct_purchase: 'Abuso compra directa',
  award_gap: 'Sin contrato formal',
  failed_tenders: 'Alta tasa de desiertos',
}

const SIGNAL_ICONS: Record<string, string> = {
  single_bidder: 'person_off',
  short_deadline: 'timer_off',
  direct_purchase: 'point_of_sale',
  award_gap: 'assignment_late',
  failed_tenders: 'event_busy',
}

function getRiskBadgeClasses(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical':
    case 'high':
      return 'bg-on-tertiary-container/10 text-on-tertiary-fixed-variant border-on-tertiary-container/20'
    case 'medium':
      return 'bg-secondary-container/20 text-secondary border-secondary-container/40'
    case 'low':
      return 'bg-secondary-container/30 text-secondary border-secondary/30'
    default:
      return 'bg-surface-container-high text-on-surface-variant border-outline-variant'
  }
}

export function getRiskLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical': return 'Crítico'
    case 'high': return 'Riesgo Alto'
    case 'medium': return 'Riesgo Medio'
    case 'low': return 'Riesgo Bajo'
    default: return riskLevel
  }
}

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  return `${currency} ${amount.toLocaleString('es-GT')}`
}

export function AlertCard({ alert }: AlertCardProps) {
  return (
    <Link href={`/alertas/${alert.id}`}>
      <div className="bg-surface-container-lowest border border-outline-variant p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-surface-container-low transition-colors cursor-pointer">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-on-surface truncate">{alert.entityName}</h3>
            <span className={`shrink-0 px-2 py-0.5 border text-xs font-semibold tracking-tight uppercase rounded-sm ${getRiskBadgeClasses(alert.riskLevel)}`}>
              {getRiskLabel(alert.riskLevel)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {alert.activeSignals.map((s) => (
              <span
                key={s}
                title={SIGNAL_LABELS[s]}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold tracking-tight uppercase rounded-sm border transition-colors ${
                  s === alert.signalKey
                    ? 'bg-surface-container-high border-outline text-on-surface'
                    : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:border-outline'
                }`}
              >
                <span className="material-symbols-outlined text-sm leading-none">{SIGNAL_ICONS[s]}</span>
                {SIGNAL_LABELS[s]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-8 text-on-surface-variant text-sm mt-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              {alert.year}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">description</span>
              {alert.contractCount} contratos
            </span>
          </div>
        </div>
        <div className="text-left md:text-right shrink-0">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Monto Total</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(alert.totalAmount, alert.currency)}</p>
        </div>
      </div>
    </Link>
  )
}
