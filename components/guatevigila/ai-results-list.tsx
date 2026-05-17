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
          ? 'bg-primary-container/20 border-primary/40 hover:bg-primary-container/30'
          : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low hover:border-primary/30'
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
            match.type === 'entity' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
            match.type === 'supplier' ? 'bg-secondary/10 text-secondary border-secondary/20' :
            'bg-error/10 text-error border-error/20'
          }`}>
            {match.type === 'entity' ? 'Entidad' : match.type === 'supplier' ? 'Proveedor' : 'Alerta'}
          </span>
          {match.riskLevel && (
            <span className={`shrink-0 px-2 py-0.5 border text-[10px] font-semibold tracking-tight uppercase rounded-sm ${
              match.riskLevel === 'critical' || match.riskLevel === 'high'
                ? 'bg-on-tertiary-container/10 text-on-tertiary-fixed-variant border-on-tertiary-container/20'
                : match.riskLevel === 'medium'
                ? 'bg-secondary-container/20 text-secondary border-secondary-container/40'
                : 'bg-secondary-container/30 text-secondary border-secondary/30'
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
        <h3 className="text-lg font-semibold text-on-surface">{match.title}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant text-sm">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">{getTypeIcon(match.type)}</span>
            {match.type === 'alert' ? (SIGNAL_LABELS[match.signalType ?? ''] ?? match.signalType) : match.subtitle}
          </span>
        </div>
        <p className="text-sm text-primary font-medium">{match.matchReason}</p>
      </div>
      <div className="text-left md:text-right shrink-0 flex flex-row md:flex-col items-center md:items-end gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">Relevancia</p>
          <p className={`text-xl font-bold ${
            match.relevanceScore >= 80 ? 'text-primary' :
            match.relevanceScore >= 60 ? 'text-secondary' :
            'text-on-surface-variant'
          }`}>
            {match.relevanceScore}%
          </p>
        </div>
        {match.amount && (
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">Monto</p>
            <p className="text-lg font-bold text-on-surface">{formatCurrency(match.amount)}</p>
          </div>
        )}
        <span className="material-symbols-outlined text-on-surface-variant">open_in_new</span>
      </div>
    </button>
  )
}

export function AIResultsList() {
  const { results, dismiss } = useAIResults()

  if (!results) return null

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Resultados de Investigación</h2>
            <p className="text-sm text-on-surface-variant">{results.queryInterpretation}</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors border border-outline-variant rounded-full"
        >
          <span className="material-symbols-outlined text-base">close</span>
          Cerrar
        </button>
      </div>

      <div className="bg-primary-container/20 border border-primary/30 rounded-xl p-5">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Brief ejecutivo</p>
        <p className="text-on-surface text-base leading-relaxed">{results.brief}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
          {results.matches.length} coincidencias (ordenadas por relevancia)
        </p>
        <div className="space-y-3">
          {results.matches.map((match, idx) => (
            <AIResultCard key={`${match.type}-${match.id}-${idx}`} match={match} rank={idx + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}
