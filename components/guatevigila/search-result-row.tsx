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

const RISK_COLOR: Record<string, string> = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500',
}

const RISK_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
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
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
        isActive
          ? 'bg-muted hover:bg-muted/80'
          : 'hover:bg-secondary'
      } ${className}`}
    >
      <span className="material-symbols-outlined text-lg shrink-0 text-muted-foreground" aria-hidden="true">
        {TYPE_ICON[result.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate text-foreground">{result.name}</p>
        <p className="text-xs truncate text-muted-foreground">{result.secondary}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {result.riskLevel && (
          <span className={`text-xs font-bold uppercase ${RISK_COLOR[result.riskLevel]}`}>
            {RISK_LABEL[result.riskLevel]}
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">
          {TYPE_LABEL[result.type]}
        </span>
      </div>
    </div>
  )
}
