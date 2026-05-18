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
import { AlertEvidenceGraph } from '@/components/guatevigila/alert-evidence-graph'
import { DownloadReportButton } from '@/components/guatevigila/download-report-button'
import { AlertShareButton } from '@/components/guatevigila/alert-share-button'
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  FileX, 
  XCircle, 
  HelpCircle, 
  ExternalLink, 
  ArrowRight, 
  Building2, 
  Network
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const alert = await client.getAlertById(id)
  if (!alert) return {}

  const title = `Alerta Analítica: ${alert.entityName}`
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
        bgClass: 'bg-destructive/10 border-destructive/20',
        ringColor: '#ef4444',
      }
    case 'high':
      return {
        label: 'Riesgo Alto',
        textClass: 'text-destructive',
        bgClass: 'bg-destructive/10 border-destructive/20',
        ringColor: '#f97316',
      }
    case 'medium':
      return {
        label: 'Riesgo Medio',
        textClass: 'text-amber-600',
        bgClass: 'bg-amber-500/10 border-amber-500/20',
        ringColor: '#f59e0b',
      }
    default:
      return {
        label: 'Riesgo Bajo',
        textClass: 'text-blue-600',
        bgClass: 'bg-blue-500/10 border-blue-500/20',
        ringColor: '#3b82f6',
      }
  }
}

// Helper para transformar strings de íconos heredados de la BD a componentes nativos Lucide
function SignalIcon({ name, className }: { name: string; className?: string }) {
  const iconMap: Record<string, any> = {
    person: AlertTriangle,
    timer_off: Clock,
    receipt_long: FileText,
    contract_delete: FileX,
    block: XCircle,
  }
  const Component = iconMap[name] || HelpCircle
  return <Component className={className} />
}

async function AlertContent({ id }: { id: string }) {
  const alert = await client.getAlertById(id)
  if (!alert) notFound()

  const riskVisuals = getRiskVisuals(alert.riskLevel)
  const url = `${SITE.url}/alertas/${encodeURIComponent(id)}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    name: `Alerta de riesgo institucional: ${alert.entityName}`,
    description: alert.description,
    url,
    about: {
      '@type': 'GovernmentOrganization',
      name: alert.entityName,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* SECCIÓN RESUMEN ENTRADA */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 border-b border-border/60 pb-8">
        <div className="max-w-2xl">
          <span className={`text-xs font-bold tracking-widest uppercase mb-2 block ${riskVisuals.textClass}`}>
            Índice de Prioridad // {riskVisuals.label}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">{alert.entityName}</h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{alert.description}</p>
        </div>
        
        {/* WIDGET DEL SCORE CIRCULAR */}
        <div className="flex items-center gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm min-w-[340px] justify-between">
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center p-1"
              style={{
                background: `conic-gradient(${riskVisuals.ringColor} 0% ${alert.riskScore}%, var(--muted) ${alert.riskScore}% 100%)`,
              }}
            >
              <div className="bg-card w-full h-full rounded-full flex items-center justify-center">
                <span className="text-xl font-mono font-bold text-foreground">
                  {alert.riskScore}
                  <span className="text-xs text-muted-foreground font-normal">/100</span>
                </span>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold block text-muted-foreground uppercase tracking-wider">
                Score Ponderado
              </span>
              <span className={`text-lg font-bold ${riskVisuals.textClass}`}>
                {riskVisuals.label}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <DownloadReportButton alert={alert} />
            <AlertShareButton alert={alert} />
          </div>
        </div>
      </section>

      {/* MAPA DE EVIDENCIA RELACIONAL */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Network className="h-4 w-4 text-accent" /> Mapa de Evidencia Relacional
        </h2>
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <AlertEvidenceGraph alert={alert} />
        </div>
      </section>

      {/* SEÑALES DETECTADAS E INFORME IA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-12">
          
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Señales de Alerta Activas</h2>
            <div className="grid grid-cols-1 gap-4">
              {alert.signals.map((signal) => (
                <div
                  key={signal.id}
                  className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-accent/20 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                      {signal.description}
                    </span>
                    <p className="text-lg font-bold tracking-tight text-foreground">{signal.title}</p>
                    <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {signal.metrics.map((metric, idx) => (
                        <span key={idx} className="text-xs font-mono font-medium text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                          {metric.value} {metric.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg shrink-0 ${riskVisuals.bgClass} ${riskVisuals.textClass}`}>
                    <SignalIcon name={signal.icon} className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Análisis de Dictamen Automatizado</h2>
            <div className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm">
              <DraftSection alert={alert} />
            </div>
          </section>
        </div>

        {/* ASIDE DE CONTRATISTA INVOLUCRADO */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h2 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">
              Contratista Bajo Escrutinio
            </h2>
            <div className="mb-6">
              <p className="text-lg font-bold text-foreground leading-tight mb-1">{alert.involvedSupplier.name}</p>
              <p className="text-xs font-mono text-muted-foreground">
                NIT: {alert.involvedSupplier.nit}
              </p>
            </div>
            
            <div className="mb-6 bg-secondary/20 p-4 rounded-lg border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                Monto Adjudicado Compilado ({alert.involvedSupplier.year})
              </span>
              <span className="text-xl font-mono font-bold text-foreground">
                {formatCurrency(alert.involvedSupplier.totalAwarded)}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              {alert.guatecomprasUrl && (
                <a
                  href={alert.guatecomprasUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-background border border-border text-foreground text-xs font-semibold py-2.5 px-4 rounded-lg flex justify-between items-center hover:bg-secondary/50 transition-colors"
                >
                  Ver expediente original en Guatecompras
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
              {alert.registroMercantilUrl && (
                <a
                  href={alert.registroMercantilUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-background border border-border text-foreground text-xs font-semibold py-2.5 px-4 rounded-lg flex justify-between items-center hover:bg-secondary/50 transition-colors"
                >
                  Expediente de Registro Mercantil
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
              <Link
                href={`/proveedores/${alert.involvedSupplier.id}`}
                className="w-full bg-primary text-primary-foreground text-xs font-semibold py-2.5 px-4 rounded-lg flex justify-between items-center hover:opacity-90 transition-opacity"
              >
                Auditar perfil del proveedor
                <ArrowRight className="h-4 w-4" />
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
          <div className="h-4 w-32 bg-secondary/40 rounded-full" />
          <div className="h-10 w-2/3 bg-secondary/20 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-secondary/10 rounded" />
        </div>
        <div className="w-64 h-24 bg-secondary/20 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-secondary/10 rounded-xl" />
          ))}
        </div>
        <div className="lg:col-span-4 h-64 bg-secondary/10 rounded-xl" />
      </div>
    </div>
  )
}

export default async function AlertDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/5 via-background to-secondary/5">
      <Header showBackButton backHref="/" />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <Suspense fallback={<ContentSkeleton />}>
          <AlertContent id={id} />
        </Suspense>
      </main>
      <AIAssistantButton />
    </div>
  )
}
