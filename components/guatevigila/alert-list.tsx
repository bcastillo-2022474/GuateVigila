'use client'
import {
  useMemo,
  useState,
  useTransition,
  useCallback,
} from 'react'
import Fuse from 'fuse.js'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useRouter,
  usePathname,
  useSearchParams,
} from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import type { Alert } from '@/lib/sdk/types'
import { AlertCard } from '@/components/guatevigila/alert-card'

const SIGNAL_LABELS: Record<string, string> = {
  single_bidder: 'Proveedor único recurrente',
  short_deadline: 'Plazo imposible',
  direct_purchase: 'Abuso compra directa',
  award_gap: 'Sin contrato formal',
  failed_tenders: 'Alta tasa de desiertos',
}

const ITEMS_PER_PAGE = 20

interface AlertListProps {
  alerts: Alert[]
}

export function AlertList({
  alerts,
}: AlertListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [, startTransition] = useTransition()

  const signal = searchParams.get('signal') ?? ''
  const entity = searchParams.get('entity') ?? ''
  const year = searchParams.get('year') ?? ''
  const page = Number(searchParams.get('page') ?? '1')

  const [inputEntity, setInputEntity] =
    useState(entity)

  const pushParams = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(
        searchParams.toString()
      )

      for (const [k, v] of Object.entries(
        overrides
      )) {
        if (v === null || v === '') {
          params.delete(k)
        } else {
          params.set(k, v)
        }
      }

      const qs = params.toString()

      startTransition(() => {
        router.replace(
          qs ? `${pathname}?${qs}` : pathname,
          { scroll: false }
        )
      })
    },
    [router, pathname, searchParams]
  )

  const debouncedSearch =
    useDebouncedCallback((value: string) => {
      pushParams({
        entity: value || null,
        page: null,
      })
    }, 300)

  const fuse = useMemo(() => {
    return new Fuse(alerts, {
      keys: ['entityName'],
      threshold: 0.35,
    })
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    let results = alerts

    if (signal) {
      results = results.filter(
        (alert) =>
          alert.signalType === signal
      )
    }

    if (year) {
      results = results.filter(
        (alert) => alert.year === year
      )
    }

    if (entity) {
      results = fuse
        .search(entity)
        .map((r) => r.item)
    }

    return results
  }, [
    alerts,
    signal,
    year,
    entity,
    fuse,
  ])

  const totalPages = Math.ceil(
    filteredAlerts.length / ITEMS_PER_PAGE
  )

  const paginatedAlerts =
    filteredAlerts.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    )

  function goToPage(p: number) {
    pushParams({
      page: p === 1 ? null : String(p),
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input
            type="text"
            value={inputEntity}
            onChange={(e) => {
              setInputEntity(e.target.value)
              debouncedSearch(e.target.value)
            }}
            placeholder="Buscar entidad..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Signal */}
        <select
          value={signal}
          onChange={(e) => {
            pushParams({
              signal:
                e.target.value || null,
              page: null,
            })
          }}
          className="px-4 py-2 bg-card border border-border rounded-lg text-sm"
        >
          <option value="">
            Todas las señales
          </option>

          {Object.entries(
            SIGNAL_LABELS
          ).map(([value, label]) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          ))}
        </select>

        {/* Year */}
        <input
          type="text"
          value={year}
          onChange={(e) => {
            pushParams({
              year:
                e.target.value || null,
              page: null,
            })
          }}
          placeholder="Año"
          className="px-4 py-2 bg-card border border-border rounded-lg text-sm w-[120px]"
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {paginatedAlerts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
            No se encontraron alertas.
          </div>
        ) : (
          paginatedAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              goToPage(page - 1)
            }
            disabled={page <= 1}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </div>

          <button
            onClick={() =>
              goToPage(page + 1)
            }
            disabled={page >= totalPages}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
