'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Building, ChevronRight, Search, X } from 'lucide-react'
import type { SupplierListItem } from '@/lib/sdk/types'
import { RiskBadge } from './risk-badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

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
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === '') params.delete(key)
    else params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

interface SupplierListProps {
  suppliers: SupplierListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialQ: string
}

export function SupplierList({
  suppliers,
  total,
  page,
  pageSize,
  totalPages,
  initialQ,
}: SupplierListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(initialQ)

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
    debouncedPushQ(value)
  }

  const clearQ = () => {
    setQ('')
    pushParams({ q: null, page: null })
  }

  const goToPage = (nextPage: number) => {
    pushParams({ page: nextPage === 1 ? null : String(nextPage) })
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter(
        (value) => value >= 1 && value <= totalPages
      )
    )
    return [...set].sort((a, b) => a - b)
  }, [page, totalPages])

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = total === 0 ? 0 : startItem + suppliers.length - 1

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => handleQ(e.target.value)}
            placeholder="Buscar proveedor por nombre o identificador..."
            className="w-full pl-10 pr-10 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {q && (
            <button
              type="button"
              onClick={clearQ}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-3">Proveedor</div>
          <div className="col-span-2">Industria</div>
          <div className="col-span-2 text-right">Adjudicado</div>
          <div className="col-span-1 text-center">Contratos</div>
          <div className="col-span-2 text-center">Oferta Única</div>
          <div className="col-span-1 text-center">Riesgo</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-border">
          {suppliers.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              No se encontraron proveedores con ese criterio.
            </div>
          ) : (
            suppliers.map((supplier) => (
              <Link
                key={supplier.id}
                href={`/proveedores/${supplier.id}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 hover:bg-muted/30 transition-colors items-center"
              >
                <div className="col-span-1 md:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Identificador: {supplier.nit}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground md:text-foreground">
                  <span className="md:hidden text-muted-foreground">Industria: </span>
                  {supplier.industry}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right">
                  <span className="md:hidden text-muted-foreground">Adjudicado: </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(supplier.totalAwarded, supplier.currency)}
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 text-sm md:text-center">
                  <span className="md:hidden text-muted-foreground">Contratos: </span>
                  <span className="text-foreground">{supplier.totalContracts}</span>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-center">
                  <span className="md:hidden text-muted-foreground">Oferta Única: </span>
                  <span
                    className={`font-medium ${
                      supplier.singleBidderPercentage > 50
                        ? 'text-destructive'
                        : supplier.singleBidderPercentage > 25
                          ? 'text-on-tertiary-fixed-variant'
                          : 'text-foreground'
                    }`}
                  >
                    {supplier.singleBidderPercentage}%
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <RiskBadge level={supplier.riskLevel} />
                </div>
                <div className="hidden md:flex md:col-span-1 justify-end">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-sm text-muted-foreground">
          Mostrando {startItem}–{endItem} de {total} proveedores
        </p>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) goToPage(page - 1)
                  }}
                  className={page === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>

              {pageNumbers.map((pageNumber, index) => {
                const prev = pageNumbers[index - 1]
                const showEllipsisBefore =
                  prev !== undefined && pageNumber - prev > 1
                return (
                  <span key={pageNumber} className="flex items-center gap-1">
                    {showEllipsisBefore && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === page}
                        onClick={(e) => {
                          e.preventDefault()
                          goToPage(pageNumber)
                        }}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  </span>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) goToPage(page + 1)
                  }}
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
