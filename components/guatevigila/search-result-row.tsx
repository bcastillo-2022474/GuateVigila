import type { SearchResult } from '@/lib/sdk/types'

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  entity: 'Entidad',
  supplier: 'Proveedor',
  alert: 'Alerta',
}

const TYPE_ICON: Record<SearchResult['type'], string> = {
  entity: 'account_balance',
  supplier: 'storefront',
  alert: 'warning',
}

const RISK_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}

const RISK_COLOR: Record<string, string> = {
  critical: 'text-destructive',
  high: 'text-destructive',
  medium: 'text-on-tertiary-fixed-variant',
  low: 'text-secondary',
}

interface SearchResultRowProps {
  id: string
  result: SearchResult
  isActive: boolean
  onSelect: () => void
  onMouseEnter: () => void
  onMouseLeave?: () => void
  className?: string
}

export function SearchResultRow({
  id,
  result,
  isActive,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: SearchResultRowProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={isActive}
      onMouseDown={(e) => { e.preventDefault(); onSelect() }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-outline-variant ${
        isActive ? 'not-hover:bg-surface-container-highest' : ''
      } ${className}`}
    >
      <span className="material-symbols-outlined text-lg shrink-0 text-outline" aria-hidden="true">
        {TYPE_ICON[result.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate text-on-surface">{result.name}</p>
        <p className="text-xs truncate text-on-surface-variant">{result.secondary}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {result.riskLevel && (
          <span className={`text-xs font-bold uppercase ${RISK_COLOR[result.riskLevel]}`}>
            {RISK_LABEL[result.riskLevel]}
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded-sm">
          {TYPE_LABEL[result.type]}
        </span>
      </div>
    </div>
  )
}
