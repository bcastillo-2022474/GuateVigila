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
  const entitiesPage = await client.getEntitiesPage({
    q,
    type: types.length > 0 ? types : undefined,
    page: initialPage,
  })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entidades Monitoreadas</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">{entitiesPage.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adjudicaciones Analizadas</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {entitiesPage.summary.totalContracts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Alertas Críticas Activas</p>
              <p className="text-2xl font-bold font-mono text-destructive mt-0.5">
                {entitiesPage.summary.totalAlerts}
              </p>
            </div>
          </div>
        </div>
      </div>

      <EntityList
        key={`${q}:${types.join(',')}:${entitiesPage.page}`}
        entities={entitiesPage.entities}
        total={entitiesPage.total}
        page={entitiesPage.page}
        pageSize={entitiesPage.pageSize}
        totalPages={entitiesPage.totalPages}
        initialQ={q}
        initialTypes={types}
      />
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
      ))}
    </div>
  )
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

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Panel de Control Institucional
          </h1>
          <p className="text-muted-foreground">
            Directorio consolidado de entidades estatales auditadas bajo variables relacionales de riesgo
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