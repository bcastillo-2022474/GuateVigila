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
  bg: string
  text: string
  border: string
  indicator: string
} {
  switch (riskLevel) {
    case 'critical':
      return {
        label: 'Crítico',
        bg: 'bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/20',
        indicator: 'bg-red-500',
      }
    case 'high':
      return {
        label: 'Alto',
        bg: 'bg-orange-500/10',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/20',
        indicator: 'bg-orange-500',
      }
    case 'medium':
      return {
        label: 'Medio',
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/20',
        indicator: 'bg-amber-500',
      }
    case 'low':
      return {
        label: 'Bajo',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/20',
        indicator: 'bg-emerald-500',
      }
    default:
      return {
        label: riskLevel,
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
        indicator: 'bg-muted-foreground',
      }
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
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${risk.indicator}`} />
        
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
            <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${risk.bg} ${risk.text} ${risk.border} border`}>
              <span className={`w-1.5 h-1.5 rounded-full ${risk.indicator}`} />
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
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded transition-colors ${
                    isActive
                      ? 'bg-foreground/10 text-foreground border border-foreground/20'
                      : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
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
