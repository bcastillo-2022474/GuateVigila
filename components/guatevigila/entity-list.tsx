'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Fuse from 'fuse.js'
import { Building2, ChevronRight, Search, Filter, X } from 'lucide-react'
import type { EntityListItem, EntityType } from '@/lib/sdk/types'
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

const PAGE_SIZE = 20

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'ministerio', label: 'Ministerio' },
  { value: 'municipalidad', label: 'Municipalidad' },
  { value: 'instituto', label: 'Instituto' },
  { value: 'secretaria', label: 'Secretaría' },
]

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  return `${currency} ${amount.toLocaleString()}`
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

interface EntityListProps {
  entities: EntityListItem[]
  initialQ: string
  initialTypes: EntityType[]
  initialPage: number
}

export function EntityList({ entities, initialQ, initialTypes, initialPage }: EntityListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(initialQ)
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(new Set(initialTypes))
  const [showTypeFilter, setShowTypeFilter] = useState(initialTypes.length > 0)
  const [page, setPage] = useState(initialPage)

  const fuse = useMemo(
    () =>
      new Fuse(entities, {
        keys: ['name', 'shortName'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [entities]
  )

  const pushParams = useCallback(
    (overrides: Record<string, string | null>) => {
      startTransition(() => {
        router.replace(buildUrl(pathname, searchParams, overrides), { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  const debouncedPushQ = useDebouncedCallback((value: string) => {
    pushParams({ q: value || null, page: null })
  }, 300)

  const handleQ = (value: string) => {
    setQ(value)
    setPage(1)
    debouncedPushQ(value)
  }

  const toggleType = (type: EntityType) => {
    const next = new Set(activeTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setActiveTypes(next)
    setPage(1)
    pushParams({ type: next.size > 0 ? [...next].join(',') : null, page: null })
  }

  const clearAll = () => {
    setQ('')
    setActiveTypes(new Set())
    setPage(1)
    pushParams({ q: null, type: null, page: null })
  }

  const goToPage = (p: number) => {
    setPage(p)
    pushParams({ page: p === 1 ? null : String(p) })
  }

  const filtered = useMemo(() => {
    let result = entities
    if (activeTypes.size > 0) result = result.filter((e) => activeTypes.has(e.type))
    if (q.trim()) {
      result = fuse
        .search(q)
        .map((r) => r.item)
        .filter((e) => activeTypes.size === 0 || activeTypes.has(e.type))
    }
    return result
  }, [entities, fuse, q, activeTypes])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const hasFilters = q.trim() || activeTypes.size > 0

  // Build page numbers with ellipsis: always show first, last, current ±1
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set([1, totalPages, safePage, safePage - 1, safePage + 1].filter((p) => p >= 1 && p <= totalPages))
    return [...set].sort((a, b) => a - b)
  }, [totalPages, safePage])

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => handleQ(e.target.value)}
              placeholder="Buscar por nombre o sigla (ej: IGSS, salud, munici...)"
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowTypeFilter((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              activeTypes.size > 0
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
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
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  activeTypes.has(value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entity List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Entidad</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2 text-right">Adjudicaciones</div>
          <div className="col-span-2 text-right">Monto Total</div>
          <div className="col-span-1 text-center">Riesgo</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-border">
          {pageItems.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              No se encontraron entidades con estos filtros.
            </div>
          ) : (
            pageItems.map((entity) => (
              <Link
                key={entity.id}
                href={`/entidades/${encodeURIComponent(entity.id)}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 hover:bg-muted/30 transition-colors items-center"
              >
                <div className="col-span-1 md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{entity.name}</p>
                      <p className="text-xs text-muted-foreground">{entity.shortName}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground md:text-foreground capitalize">
                  {entity.type}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right">
                  <span className="text-foreground">{entity.totalContracts.toLocaleString()}</span>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right">
                  <span className="font-medium text-foreground">
                    {formatCurrency(entity.totalAmount, entity.currency)}
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <RiskBadge level={entity.riskLevel} />
                </div>
                <div className="hidden md:flex md:col-span-1 justify-end">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Footer: count + pagination */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-sm text-muted-foreground">
          Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length} entidades
        </p>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (safePage > 1) goToPage(safePage - 1) }}
                  className={safePage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
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
                        isActive={p === safePage}
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
                  onClick={(e) => { e.preventDefault(); if (safePage < totalPages) goToPage(safePage + 1) }}
                  className={safePage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}
