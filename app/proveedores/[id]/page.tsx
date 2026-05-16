import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { client } from '@/lib/sdk/client'
import type { RiskLevel } from '@/lib/sdk/types'
import { Header } from '@/components/guatevigila/header'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { MetricCard } from '@/components/guatevigila/metric-card'
import { SupplierContracts } from '@/components/guatevigila/supplier-contracts'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supplier = await client.getSupplierById(id)
  if (!supplier) return {}
  return {
    title: supplier.name,
    description: `Perfil de proveedor: ${supplier.name}. Identificador ${supplier.nit}. ${supplier.totalContracts} contratos gubernamentales por GTQ ${(supplier.totalAwarded / 1_000_000).toFixed(0)}M.`,
  }
}

function formatAmount(amount: number, currency: string) {
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  return `${currency} ${amount.toLocaleString('es-GT')}`
}

function alertBorderColor(severity: RiskLevel) {
  if (severity === 'critical' || severity === 'high') return 'border-l-destructive'
  if (severity === 'medium') return 'border-l-tertiary-fixed-dim'
  return 'border-l-secondary'
}

function alertBadgeClasses(severity: RiskLevel) {
  if (severity === 'critical' || severity === 'high') {
    return 'bg-error-container text-on-error-container'
  }
  if (severity === 'medium') return 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
  return 'bg-secondary-container text-secondary'
}

function alertLabel(severity: RiskLevel) {
  if (severity === 'critical') return 'Crítico'
  if (severity === 'high') return 'Alto'
  if (severity === 'medium') return 'Medio'
  return 'Bajo'
}

async function SupplierContent({ id, q, pageNum }: { id: string; q: string; pageNum: number }) {
  const [supplier, contractsResult] = await Promise.all([
    client.getSupplierById(id),
    client.getSupplierContracts(id, { q, page: pageNum }),
  ])

  if (!supplier) notFound()

  const maxAmount = Math.max(0, ...supplier.yearlyData.map((d) => d.amount))

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
        <div>
          <nav className="mb-2">
            <Link
              href="/proveedores"
              className="text-on-surface-variant text-xs font-semibold flex items-center gap-1 hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver a listado
            </Link>
          </nav>
          <h1 className="text-3xl font-bold mb-1">{supplier.name}</h1>
          <p className="text-base text-on-surface-variant">
            Identificador: {supplier.nit} • Proveedor de {supplier.industry}
          </p>
        </div>
        <div className="flex gap-4">
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-sm text-xs font-semibold hover:opacity-90 transition-opacity">
            Descargar Informe PDF
          </button>
          {supplier.registroMercantilUrl && (
            <a
              href={supplier.registroMercantilUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-outline-variant text-primary px-6 py-2 rounded-sm text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2"
            >
              Buscar en Registro Mercantil
              <span className="material-symbols-outlined text-lg">open_in_new</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
        <MetricCard
          label="Total Contratos"
          value={supplier.totalContracts}
          subtitle={`Periodo ${supplier.period}`}
        />
        <MetricCard
          label="Monto Adjudicado"
          value={formatAmount(supplier.totalAwarded, supplier.currency)}
          subtitle="Cifras en Quetzales"
          variant="success"
        />
        <MetricCard
          label="Entidades Clientes"
          value={supplier.clientEntities}
          subtitle="Diversificación de cartera"
        />
        <MetricCard
          label="Oferente Único"
          value={`${supplier.singleBidderPercentage}%`}
          subtitle="Riesgo de competencia bajo"
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 items-start">
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest border border-outline-variant p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Historial por año</h2>
              <div className="flex gap-4">
                <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                  <span className="w-3 h-3 bg-secondary rounded-sm" /> Monto
                </span>
                <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                  <span className="w-3 h-3 bg-secondary-container rounded-sm" /> Contratos
                </span>
              </div>
            </div>
            {supplier.yearlyData.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Sin histórico anual disponible para este proveedor.
              </p>
            ) : (
              <div className="space-y-6">
                {supplier.yearlyData.map((data) => {
                  const widthPercent = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0
                  return (
                    <div key={data.year} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                        <span>{data.year}</span>
                        <span>
                          {supplier.currency} {(data.amount / 1_000_000).toFixed(1)}M (
                          {data.contractCount} contratos)
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-low h-8 rounded-sm overflow-hidden flex">
                        <div className="bg-secondary h-full" style={{ width: `${widthPercent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-outline-variant flex justify-end">
              <button className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline">
                Ver desglose detallado
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-on-tertiary-fixed-variant">
              warning
            </span>
            Alertas Activas
          </h2>
          {supplier.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-surface-container-lowest border border-outline-variant p-6 border-l-4 ${alertBorderColor(
                alert.severity
              )}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded uppercase ${alertBadgeClasses(
                    alert.severity
                  )}`}
                >
                  {alertLabel(alert.severity)}
                </span>
                <span className="text-[11px] text-on-surface-variant">{alert.date}</span>
              </div>
              <p className="text-base font-semibold mb-1">{alert.title}</p>
              <p className="text-sm text-on-surface-variant">{alert.description}</p>
            </div>
          ))}
        </div>
      </div>

      <SupplierContracts result={contractsResult} initialQ={q} />

      <div className="mt-20">
        <h2 className="text-xl font-semibold mb-6">Socios y Representantes</h2>
        <div className="bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                  Nombre
                </th>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                  Rol
                </th>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                  Participación
                </th>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                  Otras Empresas
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {supplier.associates.map((associate) => (
                <tr
                  key={associate.id}
                  className="border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <td className="p-4 font-medium">{associate.name}</td>
                  <td className="p-4 text-on-surface-variant">{associate.role}</td>
                  <td className="p-4">{associate.participation}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-surface-container-high rounded-full text-sm">
                      {associate.otherCompanies} empresa
                      {associate.otherCompanies !== 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-24 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded" />
    </div>
  )
}

export default async function SupplierProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { q = '', page: pageParam } = await searchParams
  const pageNum = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/proveedores" />

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12">
        <Suspense fallback={<ContentSkeleton />}>
          <SupplierContent id={id} q={q} pageNum={pageNum} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}
