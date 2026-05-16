import Link from 'next/link'
import type { Alert, RiskLevel } from '@/lib/sdk'

interface AlertCardProps {
  alert: Alert
}

const SIGNAL_LABELS: Record<string, string> = {
  single_bidder: 'Proveedor único recurrente',
  short_deadline: 'Plazo imposible',
  direct_purchase: 'Abuso compra directa',
  award_gap: 'Sin contrato formal',
  failed_tenders: 'Alta tasa de desiertos',
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

function getRiskLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return 'Crítico'
    case 'high':
      return 'Riesgo Alto'
    case 'medium':
      return 'Riesgo Medio'
    case 'low':
      return 'Riesgo Bajo'
    default:
      return riskLevel
  }
}

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000_000) {
    return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  }
  return `${currency} ${amount.toLocaleString('es-GT')}`
}

export function AlertCard({ alert }: AlertCardProps) {
  return (
    <Link href={`/alertas/${alert.id}`}>
      <div className="bg-surface-container-lowest border border-outline-variant p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-surface-container-low transition-colors cursor-pointer">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-xl font-semibold text-on-surface">
              {alert.entityName}
            </h3>
            <span
              className={`px-2 py-0.5 border text-xs font-semibold tracking-tight uppercase rounded-sm ${getRiskBadgeClasses(
                alert.riskLevel
              )}`}
            >
              {getRiskLabel(alert.riskLevel)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-8 text-on-surface-variant text-sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">
                {alert.signalIcon}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">
                {SIGNAL_LABELS[alert.signalType] ?? alert.signalType}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">
                calendar_today
              </span>
              {alert.year}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">
                description
              </span>
              {alert.contractCount} contratos
            </span>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            Monto Total
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(alert.totalAmount, alert.currency)}
          </p>
        </div>
      </div>
    </Link>
  )
}
