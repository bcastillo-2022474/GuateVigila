import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'
import type { EntityType } from '@/lib/sdk/types'
import { Header } from '@/components/guatevigila/header'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { EntityList } from '@/components/guatevigila/entity-list'

export const metadata: Metadata = {
  title: META.pages.entidades.title,
  description: META.pages.entidades.description,
  alternates: { canonical: META.pages.entidades.canonical },
  openGraph: {
    title: `${META.pages.entidades.title} | ${SITE.name}`,
    description: META.pages.entidades.description,
    url: META.pages.entidades.canonical,
  },
}

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>
}

const VALID_TYPES = new Set<EntityType>(['ministerio', 'municipalidad', 'instituto', 'secretaria'])

function parseTypes(raw: string | undefined): EntityType[] {
  if (!raw) return []
  return raw.split(',').map((t) => t.trim() as EntityType).filter((t) => VALID_TYPES.has(t))
}

async function StatsBarLoader() {
  const stats = await client.getGlobalStats()
  return <StatsBar stats={stats} />
}

async function EntidadesContent({ types, q, page }: { types: EntityType[]; q: string; page: number }) {
  const result = await client.getEntities({ q: q || undefined, type: types.length > 0 ? types : undefined, page })
  return <EntityList result={result} q={q} activeTypes={types} />
}

function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-full bg-surface-container-low rounded-sm" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-surface-container-low rounded-sm" />
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

export default async function EntidadesPage({ searchParams }: PageProps) {
  const { q = '', type, page } = await searchParams
  const types = parseTypes(type)
  const initialPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<StatsBarSkeleton />}>
        <StatsBarLoader />
      </Suspense>

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-primary tracking-tight mb-2">Entidades</h1>
          <p className="text-on-surface-variant">
            Directorio de entidades gubernamentales bajo monitoreo de GuateVigila
          </p>
        </div>

        <Suspense fallback={<ContentSkeleton />}>
          <EntidadesContent types={types} q={q} page={initialPage} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}
