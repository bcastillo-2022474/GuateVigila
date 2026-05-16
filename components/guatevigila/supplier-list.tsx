'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Search, ChevronLeft, ChevronRight, Building, ChevronRight as ArrowRight } from 'lucide-react'
import type { PaginatedSupplierList } from '@/lib/sdk/types'
import { RiskBadge } from '@/components/guatevigila/risk-badge'

interface SupplierListProps {
  result: PaginatedSupplierList
  q: string
}

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  return `${currency} ${amount.toLocaleString('es-GT')}`
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
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

      {/* Count */}
      <p className="text-xs text-on-surface-variant">
        {total.toLocaleString('es-GT')} proveedor{total !== 1 ? 'es' : ''}
        {total > pageSize ? ` — página ${page} de ${totalPages}` : ''}
      </p>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
          <div className="col-span-4">Proveedor</div>
          <div className="col-span-2 text-right">Adjudicado</div>
          <div className="col-span-1 text-center">Contratos</div>
          <div className="col-span-2 text-center">Entidades</div>
          <div className="col-span-2 text-center">Oferta Única</div>
          <div className="col-span-1 text-center">Riesgo</div>
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
                <div className="col-span-1 md:col-span-1 text-sm md:text-center text-on-surface">
                  {supplier.totalContracts.toLocaleString('es-GT')}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-center text-on-surface">
                  {supplier.clientEntities}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-center">
                  <span className={`font-medium ${supplier.singleBidderPercentage > 50 ? 'text-destructive' : 'text-on-surface'}`}>
                    {supplier.singleBidderPercentage}%
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <RiskBadge level={supplier.riskLevel} />
                </div>
              </Link>
            ))
          )}
        </div>
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
