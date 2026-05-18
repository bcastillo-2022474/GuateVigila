import { SITE } from '@/lib/constants/site'
import type { AlertDetail, RiskLevel, Signal } from '@/lib/sdk/types'

export type AlertShareImageVariant = 'summary' | 'evidence'

export function buildAlertPagePath(alertId: string): string {
  return `/alertas/${encodeURIComponent(alertId)}`
}

export function buildAlertPageUrl(alertId: string, origin = SITE.url): string {
  return new URL(buildAlertPagePath(alertId), origin).toString()
}

export function buildAlertShareImagePath(alertId: string, variant: AlertShareImageVariant): string {
  return `/api/alerts/${encodeURIComponent(alertId)}/share-image?variant=${variant}`
}

export function formatAlertShareCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Q${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `Q${(amount / 1_000_000).toFixed(1)}M`
  return `Q${Math.round(amount).toLocaleString('es-GT')}`
}

export function getAlertRiskLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return 'Riesgo crítico'
    case 'high':
      return 'Riesgo alto'
    case 'medium':
      return 'Riesgo medio'
    case 'low':
      return 'Riesgo bajo'
  }
}

function getPrimarySignalMetric(signal: Signal): string {
  const metric = signal.metrics[0]
  if (!metric) return signal.title
  return `${metric.value} ${metric.label}`
}

export function buildAlertShareHighlights(alert: AlertDetail, limit = 3): string[] {
  return alert.signals
    .slice(0, limit)
    .map((signal) => `${signal.description}: ${getPrimarySignalMetric(signal)}`)
}
