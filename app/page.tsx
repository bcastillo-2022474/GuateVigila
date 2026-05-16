import type { Metadata } from 'next'
import { Suspense } from 'react'

import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'

import { Header } from '@/components/guatevigila/header'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AlertList } from '@/components/guatevigila/alert-list'

interface PageProps {
  searchParams: Promise<{ signal?: string; year?: string; entity?: string; page?: string }>
}

export const metadata: Metadata = {
  title: META.pages.alertas.title,
  description: META.pages.alertas.description,
  alternates: {
    canonical: META.pages.alertas.canonical,
  },
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

  return <StatsBar stats={stats} />
}

async function AlertListLoader({
  signal, year, entity, page,
}: { signal: string; year: string; entity: string; page: number }) {
  const result = await client.getAlerts({
    signal: signal || undefined,
    year: year || undefined,
    entity: entity || undefined,
    page,
  })
  return <AlertList result={result} signal={signal} year={year} entity={entity} />
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
        <div
          key={i}
          className="h-28 bg-surface-container-low animate-pulse rounded-sm"
        />
      ))}
    </div>
  )
}

export default async function AlertQueuePage({ searchParams }: PageProps) {
  const { signal = '', year = '', entity = '', page: pageParam = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageParam, 10) || 1)
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <Header />

      <Suspense fallback={<StatsBarSkeleton />}>
        <StatsBarLoader />
      </Suspense>

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12">
        <Suspense fallback={<AlertListSkeleton />}>
          <AlertListLoader signal={signal} year={year} entity={entity} page={page} />
        </Suspense>

        <div className="h-20" />
      </main>

      <footer className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 border-t border-outline-variant mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 opacity-60">
          <span className="text-[11px] tracking-widest uppercase">
            GuateVigila © 2024
          </span>

          <div className="flex gap-6">
            <a
              href="#"
              className="text-[11px] tracking-widest uppercase hover:text-primary"
            >
              Metodología
            </a>

            <a
              href="#"
              className="text-[11px] tracking-widest uppercase hover:text-primary"
            >
              Datos Abiertos
            </a>

            <a
              href="#"
              className="text-[11px] tracking-widest uppercase hover:text-primary"
            >
              Contacto
            </a>
          </div>
        </div>
      </footer>

      <AIAssistantButton />
    </div>
  )
}

