import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'
import type { EntityType } from '@/lib/sdk/types'
import { Header } from '@/components/guatevigila/header'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { EntityList } from '@/components/guatevigila/entity-list'
import { Building2, FileText, AlertTriangle } from 'lucide-react'

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

const VALID_TYPES = new Set<EntityType>([
  'ministerio',
  'municipalidad',
  'instituto',
  'secretaria',
])

function parseTypes(raw: string | undefined): EntityType[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((t) => t.trim() as EntityType)
    .filter((t) => VALID_TYPES.has(t))
}

async function StatsBarLoader() {
  const stats = await client.getGlobalStats()
  return <StatsBar stats={stats} />
}

async function EntidadesContent({
  types,
  q,
  initialPage,
}: {
  types: EntityType[]
  q: string
  initialPage: number
}) {
  const entities = await client.getEntities(types.length > 0 ? { type: types } : undefined)
  const totalContracts = entities.reduce((sum, e) => sum + e.totalContracts, 0)
  const totalAlerts = entities.reduce((sum, e) => sum + e.activeAlerts, 0)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entidades Monitoreadas</p>
              <p className="text-xl font-semibold text-foreground">{entities.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adjudicaciones Analizadas</p>
              <p className="text-xl font-semibold text-foreground">
                {totalContracts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas Activas</p>
              <p className="text-xl font-semibold text-foreground">{totalAlerts}</p>
            </div>
          </div>
        </div>
      </div>

      <EntityList entities={entities} initialQ={q} initialTypes={types} initialPage={initialPage} />
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Explorador de Entidades
          </h1>
          <p className="text-muted-foreground">
            Directorio de entidades gubernamentales bajo monitoreo de GuateVigila
          </p>
        </div>

        <Suspense fallback={<ContentSkeleton />}>
          <EntidadesContent types={types} q={q} initialPage={initialPage} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}
