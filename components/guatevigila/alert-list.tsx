'use client'

import { useState, useTransition, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import type { PaginatedAlerts } from '@/lib/sdk/types'
import { AlertCard, SIGNAL_LABELS } from '@/components/guatevigila/alert-card'

interface AlertListProps {
  result: PaginatedAlerts
  signal: string
  year: string
  entity: string
}

export function AlertList({ result, signal, year, entity }: AlertListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [inputEntity, setInputEntity] = useState(entity)

  const { alerts, total, page, pageSize, totalPages } = result

  const pushParams = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(overrides)) {
        if (v === null || v === '') params.delete(k)
        else params.set(k, v)
      }
      const qs = params.toString()
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  const debouncedSearch = useDebouncedCallback((value: string) => {
    pushParams({ entity: value || null, page: null })
  }, 300)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={inputEntity}
            onChange={(e) => {
              setInputEntity(e.target.value)
              debouncedSearch(e.target.value)
            }}
            placeholder="Buscar entidad..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={signal}
          onChange={(e) => pushParams({ signal: e.target.value || null, page: null })}
          className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-sm text-on-surface"
        >
          <option value="">Todas las señales</option>
          {Object.entries(SIGNAL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <input
          type="text"
          value={year}
          onChange={(e) => pushParams({ year: e.target.value || null, page: null })}
          placeholder="Año"
          className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-sm text-on-surface w-[120px]"
        />
      </div>

      {/* Results count */}
      {total > 0 && (
        <p className="text-xs text-on-surface-variant">
          {total} alerta{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          {total > pageSize ? ` — página ${page} de ${totalPages}` : ''}
        </p>
      )}

      {/* List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant p-10 text-center text-sm text-on-surface-variant">
            No se encontraron alertas.
          </div>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => pushParams({ page: page > 2 ? String(page - 1) : null })}
            disabled={page <= 1}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant bg-surface-container-lowest text-sm text-on-surface disabled:opacity-40 hover:bg-surface-container-low transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-sm text-on-surface-variant">
            Página {page} de {totalPages}
          </span>

          <button
            onClick={() => pushParams({ page: String(page + 1) })}
            disabled={page >= totalPages}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant bg-surface-container-lowest text-sm text-on-surface disabled:opacity-40 hover:bg-surface-container-low transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
