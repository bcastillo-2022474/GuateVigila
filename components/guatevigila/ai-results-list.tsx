'use client'

import { useRouter } from 'next/navigation'
import { useAIResults } from './ai-context'
import { SIGNAL_LABELS } from '@/components/guatevigila/alert-card'

interface AIMatch {
  type: 'entity' | 'supplier' | 'alert'
  id: string
  title: string
  subtitle: string
  matchReason: string
  relevanceScore: number
  riskLevel?: 'critical' | 'high' | 'medium' | 'low'
  amount?: number
  signalType?: string
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'entity': return 'account_balance'
    case 'supplier': return 'group'
    case 'alert': return 'warning'
    default: return 'search'
  }
}

function getRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return 'Crítico'
    case 'high': return 'Riesgo Alto'
    case 'medium': return 'Riesgo Medio'
    case 'low': return 'Riesgo Bajo'
    default: return riskLevel
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Q${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `Q${(amount / 1_000_000).toFixed(1)}M`
  return `Q${amount.toLocaleString('es-GT')}`
}

function getDetailUrl(match: AIMatch): string {
  switch (match.type) {
    case 'entity':
      return `/entidades/${encodeURIComponent(match.id)}`
    case 'supplier':
      return `/proveedores/${encodeURIComponent(match.id)}`
    case 'alert':
      return `/alertas/${encodeURIComponent(match.id)}`
    default:
      return '#'
  }
}

function AIResultCard({ match, rank }: { match: AIMatch; rank: number }) {
  const router = useRouter()
  const isTop3 = rank <= 3

  function handleClick() {
    const url = getDetailUrl(match)
    if (url !== '#') {
      router.push(url)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 border transition-all cursor-pointer text-left ${
        isTop3
          ? 'bg-primary/5 border-primary/40 hover:bg-primary/10'
          : 'bg-card border-border hover:bg-muted hover:border-primary/30'
      }`}
      style={{
        animation: 'fadeSlideIn 0.4s ease-out forwards',
        animationDelay: `${rank * 60}ms`,
        opacity: 0,
      }}
    >
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
            match.type === 'entity' ? 'bg-secondary text-secondary-foreground border-border' :
            match.type === 'supplier' ? 'bg-secondary text-secondary-foreground border-border' :
            'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {match.type === 'entity' ? 'Entidad' : match.type === 'supplier' ? 'Proveedor' : 'Alerta'}
          </span>
          {match.riskLevel && (
            <span className={`shrink-0 px-2 py-0.5 border text-[10px] font-semibold tracking-tight uppercase rounded-sm ${
              match.riskLevel === 'critical' || match.riskLevel === 'high'
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : match.riskLevel === 'medium'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            }`}>
              {getRiskLabel(match.riskLevel)}
            </span>
          )}
          {isTop3 && (
            <span className="shrink-0 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-sm">
              TOP {rank}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{match.title}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">{getTypeIcon(match.type)}</span>
            {match.type === 'alert' ? (SIGNAL_LABELS[match.signalType ?? ''] ?? match.signalType) : match.subtitle}
          </span>
        </div>
        <p className="text-sm text-primary font-medium">{match.matchReason}</p>
      </div>
      <div className="text-left md:text-right shrink-0 flex flex-row md:flex-col items-center md:items-end gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Relevancia</p>
          <p className={`text-xl font-bold ${
            match.relevanceScore >= 80 ? 'text-primary' :
            match.relevanceScore >= 60 ? 'text-foreground' :
            'text-muted-foreground'
          }`}>
            {match.relevanceScore}%
          </p>
        </div>
        {match.amount && (
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Monto</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(match.amount)}</p>
          </div>
        )}
        <span className="material-symbols-outlined text-muted-foreground">open_in_new</span>
      </div>
    </button>
  )
}

export function AIResultsList() {
  const { results, isSearching, dismiss } = useAIResults()

  if (!results && !isSearching) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Investigación con IA</h2>
            {results && <p className="text-xs text-muted-foreground">{results.queryInterpretation}</p>}
          </div>
        </div>
        <button
          onClick={dismiss}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border rounded-full"
        >
          <span className="material-symbols-outlined text-base">close</span>
          Cerrar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl animate-pulse">search</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-foreground">Investigando patrones...</p>
              <p className="text-sm text-muted-foreground">Analizando datos de Guatecompras</p>
            </div>
          </div>
        ) : results ? (
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Brief ejecutivo</p>
              <p className="text-foreground text-base leading-relaxed">{results.brief}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                {results.matches.length} coincidencias (ordenadas por relevancia)
              </p>
              <div className="space-y-3">
                {results.matches.map((match, idx) => (
                  <AIResultCard key={`${match.type}-${match.id}-${idx}`} match={match} rank={idx + 1} />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
