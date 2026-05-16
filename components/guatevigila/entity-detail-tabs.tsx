'use client'

import { useState, useTransition, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { Entity, PaginatedSuppliers } from '@/lib/sdk/types'
import { MetricCard } from '@/components/guatevigila/metric-card'
import { RiskBadge } from '@/components/guatevigila/risk-badge'
import { EntityGraph } from './entity-graph'
import { entitySearchUrl } from '@/lib/guatecompras/urls'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

interface EntityDetailTabsProps {
  entity: Entity
  suppliersResult: PaginatedSuppliers
  initialQ: string
}

export function EntityDetailTabs({ entity, suppliersResult, initialQ }: EntityDetailTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'tabla' | 'grafo'>('tabla')
  const [inputQ, setInputQ] = useState(initialQ)

  const { suppliers, total, page, totalPages } = suppliersResult

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

  const handleSearch = (value: string) => {
    setInputQ(value)
    debouncedSearch(value)
  }

  const goToPage = (p: number) => {
    pushParams({ page: p === 1 ? null : String(p) })
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
    return amount.toLocaleString('es-GT')
  }

  const maxAmount = Math.max(...entity.yearlyData.map((d) => d.amount))

  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    )
    return [...set].sort((a, b) => a - b)
  })()

  return (
    <>
      {/* Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard label="Total Contratos" value={entity.totalContracts.toLocaleString('es-GT')} />
        <MetricCard label="Total GTQ" value={formatAmount(entity.totalAmount)} />
        <MetricCard label="% Compra Directa" value={`${entity.directPurchasePercentage}%`} />
        <MetricCard label="Alertas Activas" value={entity.activeAlerts} variant="danger" icon="warning" />
      </section>

      {/* Spending Chart */}
      <section className="mb-12">
        <div className="bg-surface-container-lowest border border-outline-variant p-6">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-semibold text-primary">Histórico de Adjudicaciones</h2>
            <span className="text-xs font-semibold text-on-surface-variant">Millones de Quetzales</span>
          </div>
          <div className="flex items-end gap-4 h-48 w-full border-b border-outline-variant pb-1">
            {entity.yearlyData.map((data, idx) => {
              const heightPercent = (data.amount / maxAmount) * 100
              const isLatest = idx === entity.yearlyData.length - 1
              return (
                <div
                  key={data.year}
                  className={`flex-1 bg-secondary transition-opacity group relative ${
                    isLatest ? 'opacity-100' : 'opacity-20 hover:opacity-100'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                >
                  <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-medium ${
                    isLatest ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {data.label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            {entity.yearlyData.map((data, idx) => {
              const isLatest = idx === entity.yearlyData.length - 1
              return (
                <span key={data.year} className={`text-[11px] ${isLatest ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                  {data.year}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="mb-12">
        <div className="flex items-center gap-0 border-b border-outline-variant mb-0">
          <button
            onClick={() => setActiveTab('tabla')}
            className={`px-6 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === 'tabla' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1.5" style={{ fontSize: 16 }}>table_rows</span>
            Contratos por proveedor
          </button>
          <button
            onClick={() => setActiveTab('grafo')}
            className={`px-6 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'grafo' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined align-middle" style={{ fontSize: 16 }}>hub</span>
            Vista de grafo
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-container ml-1">BETA</span>
          </button>
        </div>

        {activeTab === 'tabla' ? (
          <div className="bg-surface-container-lowest border border-outline-variant border-t-0 overflow-hidden">
            {/* Search */}
            <div className="px-4 py-3 border-b border-outline-variant">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={inputQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar proveedor..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Proveedor</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Contratos</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Monto Total</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                        No se encontraron proveedores con ese nombre.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-4 text-base">
                          <Link href={`/proveedores/${encodeURIComponent(supplier.supplierId)}`} className="hover:text-primary hover:underline">
                            {supplier.supplierName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-base">{supplier.contractCount}</td>
                        <td className="px-6 py-4 text-base">
                          GTQ {supplier.totalAmount.toLocaleString('es-GT')}
                        </td>
                        <td className="px-6 py-4">
                          <RiskBadge level={supplier.riskLevel} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer: count + pagination */}
            <div className="flex flex-col items-center gap-3 px-4 py-4 border-t border-outline-variant">
              <p className="text-xs text-on-surface-variant">
                {total === 0
                  ? 'Sin resultados'
                  : `Mostrando ${(page - 1) * suppliersResult.pageSize + 1}–${Math.min(page * suppliersResult.pageSize, total)} de ${total} proveedores`}
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
                          {showEllipsis && <PaginationItem><PaginationEllipsis /></PaginationItem>}
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
          </div>
        ) : (
          <EntityGraph entity={entity} suppliers={suppliers} />
        )}
      </section>

      <footer className="flex justify-center">
        <a
          href={entitySearchUrl(entity.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors border border-outline-variant px-6 py-4"
        >
          Ver todos en Guatecompras
          <span className="material-symbols-outlined text-base">north_east</span>
        </a>
      </footer>
    </>
  )
}
