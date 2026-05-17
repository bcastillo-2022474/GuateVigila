import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { client } from '@/lib/sdk/client'
import type { RiskLevel } from '@/lib/sdk/types'
import { SITE, SOCIAL } from '@/lib/constants/site'
import { Header } from '@/components/guatevigila/header'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { DraftSection } from '@/components/guatevigila/draft-section'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const alert = await client.getAlertById(id)
  if (!alert) return {}

  const title = `Alerta: ${alert.entityName}`
  const description = alert.description
  const url = `${SITE.url}/alertas/${id}`

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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(amount)
}

function getRiskVisuals(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case 'critical':
      return {
        label: 'Riesgo Crítico',
        textClass: 'text-destructive',
        ringColor: 'var(--destructive)',
      }
    case 'high':
      return {
        label: 'Riesgo Alto',
        textClass: 'text-destructive',
        ringColor: 'var(--destructive)',
      }
    case 'medium':
      return {
        label: 'Riesgo Medio',
        textClass: 'text-on-tertiary-fixed-variant',
        ringColor: 'var(--on-tertiary-fixed-variant)',
      }
    default:
      return {
        label: 'Riesgo Bajo',
        textClass: 'text-secondary',
        ringColor: 'var(--secondary)',
      }
  }
}

async function AlertContent({ id }: { id: string }) {
  const alert = await client.getAlertById(id)
  if (!alert) notFound()

  const riskVisuals = getRiskVisuals(alert.riskLevel)

  return (
    <>
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-20">
        <div className="max-w-2xl">
          <span
            className={`text-xs font-semibold tracking-widest uppercase mb-1 block ${riskVisuals.textClass}`}
          >
            Alerta de {riskVisuals.label}
          </span>
          <h1 className="text-3xl font-bold text-on-surface mb-2">{alert.entityName}</h1>
          <p className="text-on-surface-variant text-base max-w-xl">{alert.description}</p>
        </div>
        <div className="flex items-center gap-6 bg-surface p-6 border border-outline-variant">
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center p-1"
            style={{
              background: `conic-gradient(${riskVisuals.ringColor} 0% ${alert.riskScore}%, var(--surface-container-highest) ${alert.riskScore}% 100%)`,
            }}
          >
            <div className="bg-surface w-full h-full rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-on-surface">
                {alert.riskScore}
                <span className="text-xs text-on-surface-variant">/100</span>
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold block text-on-surface-variant">
              Score de Riesgo
            </span>
            <span className={`text-xl font-semibold ${riskVisuals.textClass}`}>
              {riskVisuals.label}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-8 flex flex-col gap-12">
          <section>
            <h2 className="text-xl font-semibold mb-6 border-b border-outline-variant pb-1">
              Señales detectadas
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {alert.signals.map((signal) => (
                <div
                  key={signal.id}
                  className="bg-surface-container-lowest border border-outline-variant p-6 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-xs font-semibold text-on-surface-variant mb-1 uppercase">
                      {signal.description}
                    </h3>
                    <p className="text-xl font-semibold">{signal.title}</p>
                    <div className="mt-2 flex gap-4">
                      {signal.metrics.map((metric, idx) => (
                        <span key={idx} className="text-sm text-on-surface-variant">
                          {metric.value} {metric.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`material-symbols-outlined filled text-3xl ${riskVisuals.textClass}`}
                  >
                    {signal.icon}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-semibold border-b border-outline-variant pb-1">
                Borrador de Investigación
              </h2>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant p-8">
              <DraftSection alert={alert} />
            </div>
          </section>
        </div>

        <aside className="md:col-span-4 flex flex-col gap-12">
          <section className="bg-surface border border-outline-variant p-6">
            <h2 className="text-xs font-semibold text-on-surface-variant mb-6 uppercase">
              Proveedor involucrado
            </h2>
            <div className="mb-6">
              <p className="text-xl font-semibold mb-1">{alert.involvedSupplier.name}</p>
              <p className="text-sm text-on-surface-variant">
                Identificador: {alert.involvedSupplier.nit}
              </p>
            </div>
            <div className="mb-8">
              <span className="text-[11px] text-on-surface-variant block uppercase mb-1">
                Monto Total Adjudicado ({alert.involvedSupplier.year})
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(alert.involvedSupplier.totalAwarded)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {alert.guatecomprasUrl && (
                <a
                  href={alert.guatecomprasUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold py-2 px-4 flex justify-between items-center hover:bg-surface-container-low transition-colors"
                >
                  Ver contratos en Guatecompras
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                </a>
              )}
              {alert.registroMercantilUrl && (
                <a
                  href={alert.registroMercantilUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold py-2 px-4 flex justify-between items-center hover:bg-surface-container-low transition-colors"
                >
                  Buscar en Registro Mercantil
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                </a>
              )}
              <Link
                href={`/proveedores/${alert.involvedSupplier.id}`}
                className="w-full border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold py-2 px-4 flex justify-between items-center hover:bg-surface-container-low transition-colors"
              >
                Ver perfil del proveedor
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </section>

        </aside>
      </div>
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-9 w-64 bg-muted rounded" />
          <div className="h-4 w-full max-w-xl bg-muted rounded" />
        </div>
        <div className="w-48 h-32 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded" />
          ))}
        </div>
        <div className="md:col-span-4 h-64 bg-muted rounded" />
      </div>
    </div>
  )
}

export default async function AlertDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/" />
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12">
        <Suspense fallback={<ContentSkeleton />}>
          <AlertContent id={id} />
        </Suspense>
      </main>
      <AIAssistantButton />
    </div>
  )
}
