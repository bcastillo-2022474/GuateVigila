import { notFound } from 'next/navigation'
import { client } from '@/lib/sdk'
import { Header, AIAssistantButton } from '@/components/guatevigila'
import { EntityDetailTabs } from '@/components/guatevigila/entity-detail-tabs'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EntityProfilePage({ params }: PageProps) {
  const { id } = await params
  const entity = await client.getEntityById(id)

  if (!entity) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/" />

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-20">
        {/* Entity Header */}
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

        <EntityDetailTabs entity={entity} />
      </main>

      <AIAssistantButton />
    </div>
  )
}
