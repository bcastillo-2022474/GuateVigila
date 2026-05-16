'use client'

import { useState, useTransition, useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import Link from 'next/link'
import { Building, ChevronRight, Search, X } from 'lucide-react'
import type { PaginatedSupplierList } from '@/lib/sdk/types'
import { RiskBadge } from '@/components/guatevigila/risk-badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  return `${currency} ${amount.toLocaleString('es-GT')}`
}

interface SupplierListProps {
  result: PaginatedSupplierList
  q: string
}

export function SupplierList({ result, q }: SupplierListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [inputQ, setInputQ] = useState(q)

  const { suppliers, total, page, pageSize, totalPages } = result

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

  const clearAll = () => {
    setInputQ('')
    pushParams({ q: null, page: null })
  }

  const goToPage = (p: number) => {
    pushParams({ page: p === 1 ? null : String(p) })
  }

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
              placeholder="Buscar proveedor por nombre..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {inputQ.trim() && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
          <div className="col-span-4">Proveedor</div>
          <div className="col-span-2 text-right">Adjudicado</div>
          <div className="col-span-1 text-right">Contratos</div>
          <div className="col-span-1 text-right">Entidades</div>
          <div className="col-span-2 text-right">Oferta Única</div>
          <div className="col-span-1 text-center">Riesgo</div>
          <div className="col-span-1" />
        </div>

        <div className="divide-y divide-outline-variant">
          {suppliers.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
              No se encontraron proveedores.
            </div>
          ) : (
            suppliers.map((supplier) => (
              <Link
                key={supplier.name}
                href={`/proveedores/${encodeURIComponent(supplier.id)}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center"
              >
                <div className="col-span-1 md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-container-low flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface truncate text-sm">{supplier.name}</p>
                      <p className="text-xs text-on-surface-variant">NIT: {supplier.nit}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right font-medium text-on-surface">
                  {formatCurrency(supplier.totalAwarded, supplier.currency)}
                </div>
                <div className="col-span-1 md:col-span-1 text-sm md:text-right text-on-surface">
                  {supplier.totalContracts.toLocaleString('es-GT')}
                </div>
                <div className="col-span-1 md:col-span-1 text-sm md:text-right text-on-surface">
                  {supplier.clientEntities.toLocaleString('es-GT')}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right">
                  <span className={`font-medium ${supplier.singleBidderPercentage > 50 ? 'text-error' : 'text-on-surface'}`}>
                    {supplier.singleBidderPercentage}%
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <RiskBadge level={supplier.riskLevel} />
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
            ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total.toLocaleString('es-GT')} proveedores`
            : `${total.toLocaleString('es-GT')} proveedor${total !== 1 ? 'es' : ''}`}
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
