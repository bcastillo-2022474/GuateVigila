'use client'

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { useAIResults } from '@/components/guatevigila/ai-context'
import { AIResultsList } from '@/components/guatevigila/ai-results-list'
import { AlertCard, SIGNAL_LABELS } from '@/components/guatevigila/alert-card'
import type { PaginatedAlerts } from '@/lib/sdk/types'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

interface AlertListClientProps {
  initialResult: PaginatedAlerts
  signal: string
  year: string
  entity: string
}

function buildUrl(
  pathname: string,
  current: URLSearchParams,
  overrides: Record<string, string | null>
): string {
  const params = new URLSearchParams(current.toString())
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === '') params.delete(k)
    else params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

function SearchingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl animate-pulse">search</span>
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-on-surface">Investigando patrones...</h2>
        <p className="text-on-surface-variant">Analizando datos de Guatecompras</p>
      </div>
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-bounce">location_searching</span>
        <span className="text-sm animate-pulse">Desenmascarando contratos...</span>
        <span className="material-symbols-outlined animate-bounce" style={{ animationDelay: '200ms' }}>visibility</span>
      </div>
    </div>
  )
}

export function AlertListClient({ initialResult, signal, year, entity }: AlertListClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const { results, isSearching } = useAIResults()
  const [inputEntity, setInputEntity] = useState(entity)
  const [alertsData, setAlertsData] = useState(initialResult)

  const { alerts, total, page, pageSize, totalPages } = alertsData

  const pushParams = useCallback(
    (overrides: Record<string, string | null>) => {
      startTransition(() => {
        router.replace(buildUrl(pathname, searchParams, overrides), { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  const debouncedSearch = useDebouncedCallback((value: string) => {
    pushParams({ entity: value || null, page: null })
  }, 300)

  const handleEntity = (value: string) => {
    setInputEntity(value)
    debouncedSearch(value)
  }

  const clearAll = () => {
    setInputEntity('')
    pushParams({ entity: null, signal: null, year: null, page: null })
  }

  const goToPage = (p: number) => {
    pushParams({ page: p === 1 ? null : String(p) })
  }

  const hasFilters = inputEntity.trim() || signal || year

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    )
    return [...set].sort((a, b) => a - b)
  }, [page, totalPages])

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = total === 0 ? 0 : startItem + alerts.length - 1

  useEffect(() => {
    setAlertsData(initialResult)
  }, [initialResult])

  useEffect(() => {
    setInputEntity(entity)
  }, [entity])

  if (isSearching) {
    return <SearchingAnimation />
  }

  if (results) {
    return <AIResultsList />
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={inputEntity}
            onChange={(e) => handleEntity(e.target.value)}
            placeholder="Buscar por entidad..."
            className="w-full pl-10 pr-10 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {inputEntity && (
            <button
              type="button"
              onClick={() => { setInputEntity(''); pushParams({ entity: null, page: null }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select
          value={signal || '__all__'}
          onValueChange={(v) => pushParams({ signal: v === '__all__' ? null : v, page: null })}
        >
          <SelectTrigger className="w-[200px] bg-card">
            <SelectValue placeholder="Todas las señales" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="__all__">Todas las señales</SelectItem>
            {Object.entries(SIGNAL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={year || '__all__'}
          onValueChange={(v) => pushParams({ year: v === '__all__' ? null : v, page: null })}
        >
          <SelectTrigger className="w-[110px] bg-card">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="__all__">Todos</SelectItem>
            {['2025', '2024', '2023', '2022', '2021'].map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={clearAll}
          className={`flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors ${hasFilters ? 'visible' : 'invisible'}`}
        >
          <X className="w-4 h-4" />
          Limpiar
        </button>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
            No se encontraron alertas con estos filtros.
          </div>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>

      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-sm text-muted-foreground">
          Mostrando {startItem}–{endItem} de {total} alerta{total !== 1 ? 's' : ''}
        </p>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (page > 1) goToPage(page - 1) }}
                  className={page === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>

              {pageNumbers.map((p, i) => {
                const prev = pageNumbers[i - 1]
                const showEllipsisBefore = prev !== undefined && p - prev > 1
                return (
                  <span key={p} className="flex items-center gap-1">
                    {showEllipsisBefore && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => { e.preventDefault(); goToPage(p) }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </span>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (page < totalPages) goToPage(page + 1) }}
                  className={page === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}
