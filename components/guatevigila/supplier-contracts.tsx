'use client'

import { useState, useTransition, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { PaginatedSupplierContracts } from '@/lib/sdk/types'
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

interface SupplierContractsProps {
  result: PaginatedSupplierContracts
  initialQ: string
}

export function SupplierContracts({ result, initialQ }: SupplierContractsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [inputQ, setInputQ] = useState(initialQ)

  const { contracts, total, page, pageSize, totalPages } = result

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

  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    )
    return [...set].sort((a, b) => a - b)
  })()

  return (
    <section className="mt-20">
      <h2 className="text-xl font-semibold mb-6">Contratos por entidad</h2>
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={inputQ}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar entidad..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-foreground">Entidad</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-foreground">Contratos</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-foreground">Monto Total</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-foreground">Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-foreground">
                    No se encontraron entidades con ese nombre.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-base">
                      <Link href={`/entidades/${c.entityId}`} className="hover:text-primary hover:underline">
                        {c.entityName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-base">{c.contractCount}</td>
                    <td className="px-6 py-4 text-base">GTQ {c.totalAmount.toLocaleString('es-GT')}</td>
                    <td className="px-6 py-4"><RiskBadge level={c.riskLevel} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center gap-3 px-4 py-4 border-t border-border">
          <p className="text-xs text-foreground">
            {total === 0
              ? 'Sin resultados'
              : `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} entidades`}
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
    </section>
  )
}
