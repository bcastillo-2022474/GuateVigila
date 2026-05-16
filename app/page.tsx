import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'
import { Header } from '@/components/guatevigila/header'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AlertCard } from '@/components/guatevigila/alert-card'

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

async function StatsBarLoader() {
  const stats = await client.getGlobalStats()
  return (
    <StatsBar
      processesAnalyzed={stats.processesAnalyzed}
      totalAmount={stats.totalAmount}
      currency={stats.currency}
      periodStart={stats.periodStart}
      periodEnd={stats.periodEnd}
      activeAlerts={stats.activeAlerts}
    />
  )
}

async function AlertList() {
  const alerts = await client.getAlerts()
  return (
    <div className="flex flex-col gap-4">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
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

export default function AlertQueuePage() {
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
          <AlertList />
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
