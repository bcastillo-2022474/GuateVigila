import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sdk/client'
import type { RiskLevel } from '@/lib/sdk/types'
import { SITE, SOCIAL } from '@/lib/constants/site'
import { Header } from '@/components/guatevigila/header'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { MetricCard } from '@/components/guatevigila/metric-card'
import { SupplierContracts } from '@/components/guatevigila/supplier-contracts'
import { SupplierAssociates } from '@/components/guatevigila/supplier-associates'
import { ExternalLink, AlertTriangle, Calendar, TrendingUp, ShieldCheck, Building2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; page?: string; apage?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supplier = await client.getSupplierById(id)
  if (!supplier) return {}

  const title = `${supplier.name} | Perfil de Contratista`
  const description = `Análisis de adjudicaciones de ${supplier.name}. NIT ${supplier.nit}. Registra ${supplier.totalContracts} contratos gubernamentales por Q ${(supplier.totalAwarded / 1_000_000).toFixed(1)}M. explotados en ${supplier.clientEntities} entidades.`
  const url = `${SITE.url}/proveedores/${encodeURIComponent(id)}`

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

type MetricVariant = 'default' | 'warning' | 'danger'

function singleBidderConfig(pct: number): { subtitle: string; variant: MetricVariant } {
  const tiers: { threshold: number; subtitle: string; variant: MetricVariant }[] = [
    { threshold: 80, subtitle: 'Riesgo crítico de competencia', variant: 'danger' },
    { threshold: 60, subtitle: 'Riesgo alto de competencia',    variant: 'danger' },
    { threshold: 40, subtitle: 'Riesgo medio de competencia',   variant: 'warning' },
    { threshold: 0,  subtitle: 'Riesgo bajo o controlado',      variant: 'default' },
  ]
  return tiers.find((t) => pct >= t.threshold)!
}

function formatAmount(amount: number, currency: string) {
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  return `${currency} ${amount.toLocaleString('es-GT')}`
}

function alertBorderColor(severity: RiskLevel) {
  if (severity === 'critical' || severity === 'high') return 'border-l-destructive'
  if (severity === 'medium') return 'border-l-amber-500'
  return 'border-l-blue-500'
}

function alertBadgeClasses(severity: RiskLevel) {
  if (severity === 'critical' || severity === 'high') return 'bg-destructive/10 text-destructive border-destructive/20'
  if (severity === 'medium') return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
}

function alertLabel(severity: RiskLevel) {
  if (severity === 'critical') return 'Crítico'
  if (severity === 'high') return 'Alto'
  if (severity === 'medium') return 'Medio'
  return 'Bajo'
}

async function SupplierContent({ id, q, pageNum, aPageNum }: { id: string; q: string; pageNum: number; aPageNum: number }) {
  const [supplier, contractsResult, associatesResult] = await Promise.all([
    client.getSupplierById(id),
    client.getSupplierContracts(id, { q, page: pageNum }),
    client.getSupplierAssociates(id, aPageNum),
  ])

  if (!supplier) notFound()

  const maxAmount = Math.max(...supplier.yearlyData.map((d) => d.amount))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: supplier.name,
    taxID: supplier.nit,
    url: `${SITE.url}/proveedores/${encodeURIComponent(id)}`,
    description: `Proveedor del Estado guatemalteco con ${supplier.totalContracts} contratos analizados mediante matrices de riesgo relacional.`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* HEADER DE PERFIL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-border/60 pb-8">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-3">
            <Building2 className="h-3 w-3" /> Contratista Auditado
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{supplier.name}</h1>
          <p className="text-sm font-mono text-muted-foreground bg-muted inline-block px-2 py-0.5 rounded border border-border/40">
            NIT Identificador: {supplier.nit}
          </p>
        </div>
        {supplier.registroMercantilUrl && (
          <a
            href={supplier.registroMercantilUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors shadow-sm"
          >
            Consultar Registro Mercantil
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </div>

      {/* BLOQUE DE CONTADORES METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <MetricCard label="Total Contratos" value={supplier.totalContracts} subtitle={`Periodo ${supplier.period}`} />
        <MetricCard label="Monto Adjudicado" value={formatAmount(supplier.totalAwarded, supplier.currency)} subtitle="Cifras consolidadas en Q" variant="success" />
        <MetricCard label="Entidades Clientes" value={supplier.clientEntities} subtitle="Diversificación de cartera" />
        <MetricCard
          label="Oferente Único"
          value={`${supplier.singleBidderPercentage}%`}
          {...singleBidderConfig(supplier.singleBidderPercentage)}
        />
      </div>

      {/* HISTORIAL Y ALERTAS CRÍTICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        
        {/* GRÁFICA DE EVOLUCIÓN ANUAL */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold text-foreground">Comportamiento Financiero Anual</h2>
            </div>
            <div className="flex gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-primary rounded-full" /> Desviación
              </span>
            </div>
          </div>
          
          <div className="space-y-6">
            {supplier.yearlyData.map((data) => (
              <div key={data.year} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded border">{data.year}</span>
                  <span className="text-muted-foreground">
                    {supplier.currency} {(data.amount / 1_000_000).toFixed(1)}M 
                    <span className="text-[11px] font-normal ml-1">({data.contractCount} contratos)</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/30 h-4 rounded-full overflow-hidden p-0.5 border border-border/10">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500 shadow-inner" 
                    style={{ width: `${maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTENEDOR LATERAL DE ALERTAS VINCULADAS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-bold text-foreground">Índice de Alertas Vinculadas</h2>
          </div>

          {supplier.alerts && supplier.alerts.length > 0 ? (
            supplier.alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`bg-card border border-border p-5 border-l-4 rounded-r-xl shadow-sm flex flex-col justify-between ${alertBorderColor(alert.severity)}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border tracking-wider uppercase ${alertBadgeClasses(alert.severity)}`}>
                    {alertLabel(alert.severity)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{alert.date}</span>
                </div>
                <p className="text-base font-bold text-foreground mb-1 leading-snug">{alert.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
              </div>
            ))
          ) : (
            /* CONTROL DE ESTADO VACÍO (EMPTY STATE) */
            <div className="bg-card border border-border border-dashed p-8 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Historial Libre de Anomalías</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                Este contratista no ha superado los umbrales de riesgo estadístico ponderados en el conjunto de datos activo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* COMPONENTES SECUNDARIOS TABULARES */}
      <SupplierContracts result={contractsResult} initialQ={q} />
      <SupplierAssociates result={associatesResult} />
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-32 bg-secondary/40 rounded-full" />
        <div className="h-10 w-2/3 bg-secondary/20 rounded-xl" />
        <div className="h-6 w-40 bg-secondary/10 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-secondary/20 rounded-xl border border-border/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 h-64 bg-secondary/10 rounded-2xl border border-border/40" />
        <div className="lg:col-span-5 h-64 bg-secondary/10 rounded-2xl border border-border/40" />
      </div>
    </div>
  )
}

export default async function SupplierProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { q = '', page: pageParam, apage: aPageParam } = await searchParams
  const pageNum = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const aPageNum = Math.max(1, parseInt(aPageParam ?? '1', 10) || 1)

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/proveedores" />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <Suspense fallback={<ContentSkeleton />}>
          <SupplierContent id={id} q={q} pageNum={pageNum} aPageNum={aPageNum} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}