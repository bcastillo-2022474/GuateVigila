import Link from 'next/link'
import type { Alert, RiskLevel } from '@/lib/sdk/types'

interface AlertCardProps {
  alert: Alert
}

export const SIGNAL_LABELS: Record<string, string> = {
  single_bidder: 'Proveedor único',
  short_deadline: 'Plazo corto',
  direct_purchase: 'Compra directa',
  award_gap: 'Sin contrato',
  failed_tenders: 'Desiertos',
}

const SIGNAL_ICONS: Record<string, string> = {
  single_bidder: 'person_off',
  short_deadline: 'timer_off',
  direct_purchase: 'point_of_sale',
  award_gap: 'assignment_late',
  failed_tenders: 'event_busy',
}

function getRiskConfig(riskLevel: RiskLevel): {
  label: string
  badgeClass: string
  indicatorClass: string
} {
  switch (riskLevel) {
    case 'critical':
      return { label: 'Crítico', badgeClass: 'bg-red-500/10 text-red-600 border-red-500/30 border', indicatorClass: 'bg-red-500' }
    case 'high':
      return { label: 'Alto', badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-500/30 border', indicatorClass: 'bg-orange-500' }
    case 'medium':
      return { label: 'Medio', badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30 border', indicatorClass: 'bg-amber-500' }
    case 'low':
      return { label: 'Bajo', badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border', indicatorClass: 'bg-emerald-500' }
    default:
      return { label: riskLevel, badgeClass: 'bg-muted text-muted-foreground border border-border', indicatorClass: 'bg-muted-foreground' }
  }
}

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${currency} ${(amount / 1_000).toFixed(0)}K`
  return `${currency} ${amount.toLocaleString('es-GT')}`
}

export function AlertCard({ alert }: AlertCardProps) {
  const risk = getRiskConfig(alert.riskLevel)
  
  return (
    <Link href={`/alertas/${alert.id}`} className="block group">
      <article className="relative bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all duration-200">
        {/* Risk indicator bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${risk.indicatorClass}`} />
        
        <div className="p-5 pl-6">
          {/* Header: Entity name + Risk badge */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {alert.entityName}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  {alert.year}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">description</span>
                  {alert.contractCount} contratos
                </span>
              </div>
            </div>
            
            {/* Risk badge */}
            <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${risk.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${risk.indicatorClass}`} />
              {risk.label}
            </div>
          </div>
          
          {/* Signals */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {alert.activeSignals.map((s) => {
              const isActive = s === alert.signalKey
              return (
                <span
                  key={s}
                  title={SIGNAL_LABELS[s]}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded transition-colors ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground/70 border border-border'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">{SIGNAL_ICONS[s]}</span>
                  {SIGNAL_LABELS[s]}
                </span>
              )
            })}
          </div>
          
          {/* Footer: Amount */}
          <div className="flex items-end justify-between pt-3 border-t border-border/50">
            <div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-0.5">
                Monto Total
              </p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {formatCurrency(alert.totalAmount, alert.currency)}
              </p>
            </div>
            
            <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              Ver detalles
              <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export function getRiskLabel(riskLevel: RiskLevel): string {
  return getRiskConfig(riskLevel).label
}
