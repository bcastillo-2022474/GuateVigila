import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sdk/client'
import { SITE, SOCIAL } from '@/lib/constants/site'
import { Header } from '@/components/guatevigila/header'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { EntityDetailTabs } from '@/components/guatevigila/entity-detail-tabs'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const entity = await client.getEntityById(id)
  if (!entity) return {}

  const title = `${entity.shortName || entity.name} | Perfil Institucional`
  const description = `Auditoría algorítmica de ${entity.name}. Registra ${entity.totalContracts.toLocaleString()} adjudicaciones por Q${(entity.totalAmount / 1_000_000).toFixed(1)}M. ${entity.activeAlerts > 0 ? `Índice de riesgo: ${entity.activeAlerts} alertas críticas detectadas.` : 'Sin anomalías estadísticas activas.'}`
  const url = `${SITE.url}/entidades/${encodeURIComponent(id)}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: SITE.name,
      locale: 'es_GT',
    },
    twitter: {
      card: 'summary_large_image',
      site: SOCIAL.twitterHandle,
      title,
      description,
    },
  }
}

async function EntityContent({ id, q, pageNum }: { id: string; q: string; pageNum: number }) {
  const [entity, suppliersResult] = await Promise.all([
    client.getEntityById(id),
    client.getEntitySuppliers(id, { q, page: pageNum }),
  ])

  if (!entity) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    name: entity.name,
    alternateName: entity.shortName,
    url: `${SITE.url}/entidades/${encodeURIComponent(id)}`,
    description: `Entidad gubernamental guatemalteca bajo monitoreo. Historial de ${entity.totalContracts.toLocaleString()} adjudicaciones analizadas.`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mb-12">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-widest uppercase">
              Ficha Institucional
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight text-balance leading-tight mt-2">
            {entity.shortName || entity.name}
          </h1>
          {entity.shortName && (
            <h2 className="text-lg md:text-xl text-muted-foreground font-medium mt-2 max-w-4xl leading-relaxed">
              {entity.name}
            </h2>
          )}
        </div>
      </section>

      <EntityDetailTabs entity={entity} suppliersResult={suppliersResult} initialQ={q} />
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-4 max-w-2xl">
        <div className="h-6 w-32 bg-accent/20 rounded-full" />
        <div className="h-14 w-full bg-secondary/50 rounded-lg" />
        <div className="h-6 w-3/4 bg-secondary/30 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-secondary/20 rounded-xl border border-border/50" />
        ))}
      </div>
      <div className="h-[400px] bg-secondary/10 rounded-xl border border-border/50" />
    </div>
  )
}

export default async function EntityProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { q = '', page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)

  return (
    // Agregamos el mismo fondo que el Home para mantener consistencia visual
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/entidades" />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-20">
        <Suspense fallback={<ContentSkeleton />}>
          <EntityContent id={id} q={q} pageNum={pageNum} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}