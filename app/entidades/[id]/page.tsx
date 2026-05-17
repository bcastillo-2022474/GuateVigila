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

  const title = entity.name
  const description = `Perfil de contrataciones públicas de ${entity.name}. ${entity.totalContracts.toLocaleString()} adjudicaciones por GTQ ${(entity.totalAmount / 1_000_000).toFixed(0)}M.${entity.activeAlerts > 0 ? ` ${entity.activeAlerts} alerta${entity.activeAlerts !== 1 ? 's' : ''} activa${entity.activeAlerts !== 1 ? 's' : ''}.` : ''}`
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
    url: `${SITE.url}/entidades/${encodeURIComponent(id)}`,
    description: `Entidad gubernamental guatemalteca con ${entity.totalContracts.toLocaleString()} adjudicaciones analizadas.`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mb-12">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            {entity.name}
          </span>
          <h1 className="text-5xl font-bold text-primary tracking-tight">
            {entity.shortName}
          </h1>
        </div>
      </section>

      <EntityDetailTabs entity={entity} suppliersResult={suppliersResult} initialQ={q} />
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-14 w-48 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 bg-muted rounded" />
      ))}
    </div>
  )
}

export default async function EntityProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { q = '', page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/entidades" />

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-20">
        <Suspense fallback={<ContentSkeleton />}>
          <EntityContent id={id} q={q} pageNum={pageNum} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}
