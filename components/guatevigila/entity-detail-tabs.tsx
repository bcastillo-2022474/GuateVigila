'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Entity } from '@/lib/sdk/types'
import { MetricCard, RiskBadge } from '@/components/guatevigila'
import { EntityGraph } from './entity-graph'

interface EntityDetailTabsProps {
  entity: Entity
}

export function EntityDetailTabs({ entity }: EntityDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'tabla' | 'grafo'>('tabla')

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
    return amount.toLocaleString('es-GT')
  }

  const formatCurrency = (amount: number, currency: string) =>
    `${currency} ${amount.toLocaleString('es-GT')}`

  const maxAmount = Math.max(...entity.yearlyData.map((d) => d.amount))

  return (
    <>
      {/* Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard label="Total Contratos" value={entity.totalContracts.toLocaleString('es-GT')} />
        <MetricCard label="Total GTQ" value={formatAmount(entity.totalAmount)} />
        <MetricCard label="% Compra Directa" value={`${entity.directPurchasePercentage}%`} />
        <MetricCard label="Alertas Activas" value={entity.activeAlerts} variant="danger" icon="warning" />
      </section>

      {/* Spending Chart */}
      <section className="mb-12">
        <div className="bg-surface-container-lowest border border-outline-variant p-6">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-semibold text-primary">Histórico de Adjudicaciones</h2>
            <span className="text-xs font-semibold text-on-surface-variant">Millones de Quetzales</span>
          </div>
          <div className="flex items-end gap-4 h-48 w-full border-b border-outline-variant pb-1">
            {entity.yearlyData.map((data, idx) => {
              const heightPercent = (data.amount / maxAmount) * 100
              const isLatest = idx === entity.yearlyData.length - 1
              return (
                <div
                  key={data.year}
                  className={`flex-1 bg-secondary transition-opacity group relative ${
                    isLatest ? 'opacity-100' : 'opacity-20 hover:opacity-100'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                >
                  <span
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-medium ${
                      isLatest ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {data.label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            {entity.yearlyData.map((data, idx) => {
              const isLatest = idx === entity.yearlyData.length - 1
              return (
                <span
                  key={data.year}
                  className={`text-[11px] ${isLatest ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
                >
                  {data.year}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tabs: Tabla / Grafo */}
      <section className="mb-12">
        {/* Tab header */}
        <div className="flex items-center gap-0 border-b border-outline-variant mb-0">
          <button
            onClick={() => setActiveTab('tabla')}
            className={`px-6 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === 'tabla'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1.5" style={{ fontSize: 16 }}>
              table_rows
            </span>
            Contratos por proveedor (2020-2024)
          </button>
          <button
            onClick={() => setActiveTab('grafo')}
            className={`px-6 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'grafo'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined align-middle" style={{ fontSize: 16 }}>
              hub
            </span>
            Vista de grafo
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-container ml-1">
              BETA
            </span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'tabla' ? (
          <div className="bg-surface-container-lowest border border-outline-variant border-t-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                      Proveedor
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                      Contratos
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                      Monto Total
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                      Riesgo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {entity.topSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-base">
                        <Link
                          href={`/proveedores/${supplier.supplierId}`}
                          className="hover:text-primary hover:underline"
                        >
                          {supplier.supplierName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-base">{supplier.contractCount}</td>
                      <td className="px-6 py-4 text-base">
                        {formatCurrency(supplier.totalAmount, supplier.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge level={supplier.riskLevel} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EntityGraph entity={entity} />
        )}
      </section>

      {/* Footer Link */}
      <footer className="flex justify-center">
        <a
          href="https://www.guatecompras.gt"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors border border-outline-variant px-6 py-4"
        >
          Ver todos en Guatecompras
          <span className="material-symbols-outlined text-base">north_east</span>
        </a>
      </footer>
    </>
  )
}
