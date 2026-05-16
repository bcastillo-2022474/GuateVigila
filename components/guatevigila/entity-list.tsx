'use client'

import { useState, useTransition, useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import Link from 'next/link'
import { Building2, ChevronRight, Search, Filter, X } from 'lucide-react'
import type { EntityType, PaginatedEntityList } from '@/lib/sdk/types'
import { RiskBadge } from './risk-badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'ministerio', label: 'Ministerio' },
  { value: 'municipalidad', label: 'Municipalidad' },
  { value: 'instituto', label: 'Instituto' },
  { value: 'secretaria', label: 'Secretaría' },
]

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  return `${currency} ${amount.toLocaleString('es-GT')}`
}

interface EntityListProps {
  result: PaginatedEntityList
  q: string
  activeTypes: EntityType[]
}

export function EntityList({ result, q, activeTypes: initialTypes }: EntityListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [inputQ, setInputQ] = useState(q)
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(new Set(initialTypes))
  const [showTypeFilter, setShowTypeFilter] = useState(initialTypes.length > 0)

  const { entities, total, page, pageSize, totalPages } = result

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
    pushParams({ q: value || null, page: null })
  }, 300)

  const toggleType = (type: EntityType) => {
    const next = new Set(activeTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setActiveTypes(next)
    pushParams({ type: next.size > 0 ? [...next].join(',') : null, page: null })
  }

  const clearAll = () => {
    setInputQ('')
    setActiveTypes(new Set())
    pushParams({ q: null, type: null, page: null })
  }

  const goToPage = (p: number) => {
    pushParams({ page: p === 1 ? null : String(p) })
  }

  const hasFilters = inputQ.trim() || activeTypes.size > 0

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages))
    return [...set].sort((a, b) => a - b)
  }, [totalPages, page])

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={inputQ}
              onChange={(e) => {
                setInputQ(e.target.value)
                debouncedSearch(e.target.value)
              }}
              placeholder="Buscar por nombre o sigla (ej: IGSS, salud, munici...)"
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowTypeFilter((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 border text-sm transition-colors ${
              activeTypes.size > 0
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <Filter className="w-4 h-4" />
            Tipo
            {activeTypes.size > 0 && (
              <span className="ml-1 bg-primary-foreground text-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {activeTypes.size}
              </span>
            )}
          </button>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          )}
        </div>

        {showTypeFilter && (
          <div className="flex flex-wrap gap-2">
            {ENTITY_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleType(value)}
                className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  activeTypes.has(value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
          <div className="col-span-4">Entidad</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2 text-right">Contratos</div>
          <div className="col-span-2 text-right">Monto Total</div>
          <div className="col-span-1 text-center">Riesgo</div>
          <div className="col-span-1" />
        </div>

        <div className="divide-y divide-outline-variant">
          {entities.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
              No se encontraron entidades con estos filtros.
            </div>
          ) : (
            entities.map((entity) => (
              <Link
                key={entity.id}
                href={`/entidades/${encodeURIComponent(entity.id)}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center"
              >
                <div className="col-span-1 md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-container-low flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface truncate text-sm">{entity.name}</p>
                      <p className="text-xs text-on-surface-variant">{entity.shortName}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm text-on-surface-variant capitalize">
                  {entity.type}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right text-on-surface">
                  {entity.totalContracts.toLocaleString('es-GT')}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right font-medium text-on-surface">
                  {formatCurrency(entity.totalAmount, entity.currency)}
                </div>
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <RiskBadge level={entity.riskLevel} />
                </div>
                <div className="hidden md:flex md:col-span-1 justify-end">
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-xs text-on-surface-variant">
          {total > pageSize
            ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total.toLocaleString('es-GT')} entidades`
            : `${total.toLocaleString('es-GT')} entidad${total !== 1 ? 'es' : ''}`}
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
                const showEllipsis = prev !== undefined && p - prev > 1
                return (
                  <span key={p} className="flex items-center gap-1">
                    {showEllipsis && (
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
