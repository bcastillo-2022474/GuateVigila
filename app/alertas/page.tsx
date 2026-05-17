import type { Metadata } from 'next'
import { Suspense } from 'react'

import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'

import { Header } from '@/components/guatevigila/header'
import { Footer } from '@/components/guatevigila/footer'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AlertListClient } from '@/components/guatevigila/alert-list-client'

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
  const result = await client.getAlertsPage({
    signal: signal || undefined,
    year: year || undefined,
    entity: entity || undefined,
    page,
  })
  return <AlertListClient initialResult={result} signal={signal} year={year} entity={entity} />
}

function StatsBarSkeleton() {
  return (
    <div className="w-full bg-secondary/50 border-b border-border py-2.5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="h-4 w-96 bg-muted animate-pulse rounded-sm" />
      </div>
    </div>
  )
}

function AlertListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-32 bg-card border border-border animate-pulse rounded-xl"
        />
      ))}
    </div>
  )
}

export default async function AlertQueuePage({ searchParams }: PageProps) {
  const { signal = '', year = '', entity = '', page: pageParam = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageParam, 10) || 1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/5 via-background to-secondary/5">
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

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Encabezado homologado */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Panel de Control de Alertas
          </h1>
          <p className="text-muted-foreground">
            Monitoreo algorítmico automatizado de irregularidades y desviaciones estadísticas en tiempo real
          </p>
        </div>

        <Suspense fallback={<AlertListSkeleton />}>
          <AlertListLoader signal={signal} year={year} entity={entity} page={page} />
        </Suspense>
      </main>

      <Footer />

      <AIAssistantButton />
    </div>
  )
}