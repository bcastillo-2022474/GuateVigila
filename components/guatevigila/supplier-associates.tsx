'use client'

import { useTransition, useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { PaginatedAssociates } from '@/lib/sdk/types'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

interface SupplierAssociatesProps {
  result: PaginatedAssociates
}

export function SupplierAssociates({ result }: SupplierAssociatesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const { associates, total, page, pageSize, totalPages } = result

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

  const goToPage = (p: number) => {
    pushParams({ apage: p === 1 ? null : String(p) })
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const set = new Set([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages))
    return [...set].sort((a, b) => a - b)
  }, [totalPages, page])

  return (
    <div className="mt-20">
      <h2 className="text-xl font-semibold mb-6">Competidores Frecuentes</h2>
      <div className="bg-surface-container-lowest border border-outline-variant overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface uppercase tracking-widest">
          <div className="col-span-9">Proveedor</div>
          <div className="col-span-3 text-right">Licitaciones en común</div>
        </div>

        <div className="divide-y divide-outline-variant">
          {associates.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-on-surface">
              Este proveedor no comparte licitaciones con otros competidores en el período analizado.
            </div>
          ) : associates.map((a) => (
            <div key={a.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center">
              <div className="col-span-1 md:col-span-9 text-sm font-medium text-on-surface">{a.name}</div>
              <div className="col-span-1 md:col-span-3 text-sm md:text-right text-on-surface">{a.sharedTenders}</div>
            </div>
          ))
          }
        </div>

        {total > 0 && <div className="flex flex-col items-center gap-3 px-4 py-4 border-t border-outline-variant">
          <p className="text-xs text-on-surface">
            {total > pageSize
              ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total.toLocaleString('es-GT')} competidores`
              : `${total.toLocaleString('es-GT')} competidor${total !== 1 ? 'es' : ''}`}
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
        </div>}
      </div>
    </div>
  )
}
