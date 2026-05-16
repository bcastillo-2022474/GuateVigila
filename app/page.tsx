import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'
import { Header } from '@/components/guatevigila/header'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AlertCard } from '@/components/guatevigila/alert-card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: META.pages.alertas.title,
  description: META.pages.alertas.description,
  alternates: { canonical: META.pages.alertas.canonical },
  openGraph: {
    title: `${META.pages.alertas.title} | ${SITE.name}`,
    description: META.pages.alertas.description,
    url: META.pages.alertas.canonical,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

async function StatsBarLoader() {
  const stats = await client.getGlobalStats()
  return (
    <StatsBar stats={stats} />
  )
}

async function AlertList({ initialPage }: { initialPage: number }) {
  const alertsPage = await client.getAlertsPage({ page: initialPage })
  return (
    <AlertListContent
      alerts={alertsPage.alerts}
      total={alertsPage.total}
      page={alertsPage.page}
      pageSize={alertsPage.pageSize}
      totalPages={alertsPage.totalPages}
    />
  )
}

function buildAlertPageUrl(page: number): string {
  return page === 1 ? '/' : `/?page=${page}`
}

function getPageNumbers(page: number, totalPages: number): number[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  return [...new Set([1, totalPages, page - 1, page, page + 1])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)
}

function AlertListContent({
  alerts,
  total,
  page,
  pageSize,
  totalPages,
}: {
  alerts: Awaited<ReturnType<typeof client.getAlertsPage>>['alerts']
  total: number
  page: number
  pageSize: number
  totalPages: number
}) {
  const pageNumbers = getPageNumbers(page, totalPages)
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = total === 0 ? 0 : startItem + alerts.length - 1

  return (
    <>
      <div className="flex flex-col gap-4">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-sm text-on-surface-variant">
          Mostrando {startItem}–{endItem} de {total} alertas
        </p>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={buildAlertPageUrl(Math.max(1, page - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-40' : undefined}
                />
              </PaginationItem>

              {pageNumbers.map((pageNumber, index) => {
                const previousPage = pageNumbers[index - 1]
                const showEllipsis =
                  previousPage !== undefined && pageNumber - previousPage > 1

                return (
                  <span key={pageNumber} className="flex items-center gap-1">
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={buildAlertPageUrl(pageNumber)}
                        isActive={pageNumber === page}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  </span>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  href={buildAlertPageUrl(Math.min(totalPages, page + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-40' : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}

function StatsBarSkeleton() {
  return (
    <div className="w-full bg-surface-container-low py-2 border-b border-outline-variant">
      <div className="max-w-[1200px] mx-auto px-4 md:px-16">
        <div className="h-[14px] w-96 bg-outline-variant/40 animate-pulse rounded-sm" />
      </div>
    </div>
  )
}

function AlertListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-28 bg-surface-container-low animate-pulse rounded-sm" />
      ))}
    </div>
  )
}

export default async function AlertQueuePage({ searchParams }: PageProps) {
  const { page } = await searchParams
  const initialPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <Suspense fallback={<StatsBarSkeleton />}>
        <StatsBarLoader />
      </Suspense>

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12">
        <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-1">
          <span className="text-on-surface-variant text-xs font-semibold tracking-widest uppercase mr-2">
            Filtrar por:
          </span>
          <FilterButton label="Señal" />
          <FilterButton label="Entidad" />
          <FilterButton label="Monto" />
          <FilterButton label="Año" />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-on-surface-variant text-[11px] font-medium">
              ORDENAR POR RIESGO
            </span>
            <span className="material-symbols-outlined text-on-surface cursor-pointer">
              sort
            </span>
          </div>
        </div>

        <Suspense fallback={<AlertListSkeleton />}>
          <AlertList initialPage={initialPage} />
        </Suspense>

        <div className="h-20" />
      </main>

      <footer className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 border-t border-outline-variant mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 opacity-60">
          <span className="text-[11px] tracking-widest uppercase">
            GuateVigila © 2024
          </span>
          <div className="flex gap-6">
            <a href="#" className="text-[11px] tracking-widest uppercase hover:text-primary">Metodología</a>
            <a href="#" className="text-[11px] tracking-widest uppercase hover:text-primary">Datos Abiertos</a>
            <a href="#" className="text-[11px] tracking-widest uppercase hover:text-primary">Contacto</a>
          </div>
        </div>
      </footer>

      <AIAssistantButton />
    </div>
  )
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 px-4 py-1.5 border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold tracking-wide hover:bg-surface-container-low transition-colors whitespace-nowrap">
      {label}
      <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
    </button>
  )
}
