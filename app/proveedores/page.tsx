import Link from 'next/link'
import { client } from '@/lib/sdk'
import { Header, StatsBar, AIAssistantButton, RiskBadge } from '@/components/guatevigila'
import { Building, FileText, AlertTriangle, ChevronRight, Search, Filter } from 'lucide-react'

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1000000000) {
    return `${currency} ${(amount / 1000000000).toFixed(1)}B`
  }
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`
  }
  return `${currency} ${amount.toLocaleString()}`
}

export default async function ProveedoresPage() {
  const [suppliers, stats] = await Promise.all([
    client.getSuppliers(),
    client.getGlobalStats(),
  ])

  // Calculate totals for the header
  const totalSuppliers = suppliers.length
  const totalContracts = suppliers.reduce((sum, s) => sum + s.totalContracts, 0)
  const highRiskSuppliers = suppliers.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StatsBar
        processesAnalyzed={stats.processesAnalyzed}
        totalAmount={stats.totalAmount}
        currency={stats.currency}
        periodStart={stats.periodStart}
        periodEnd={stats.periodEnd}
        activeAlerts={stats.activeAlerts}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Explorador de Proveedores
          </h1>
          <p className="text-muted-foreground">
            Directorio de proveedores con contratos gubernamentales bajo monitoreo
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proveedores Registrados</p>
                <p className="text-xl font-semibold text-foreground">{totalSuppliers}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contratos Totales</p>
                <p className="text-xl font-semibold text-foreground">{totalContracts.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alto Riesgo</p>
                <p className="text-xl font-semibold text-foreground">{highRiskSuppliers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar proveedor por nombre o identificador..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Supplier List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Proveedor</div>
            <div className="col-span-2">Industria</div>
            <div className="col-span-2 text-right">Adjudicado</div>
            <div className="col-span-1 text-center">Contratos</div>
            <div className="col-span-2 text-center">Oferta Única</div>
            <div className="col-span-1 text-center">Riesgo</div>
            <div className="col-span-1"></div>
          </div>
          
          <div className="divide-y divide-border">
            {suppliers.map((supplier) => (
              <Link
                key={supplier.id}
                href={`/proveedores/${supplier.id}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 hover:bg-muted/30 transition-colors items-center"
              >
                <div className="col-span-1 md:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground">Identificador: {supplier.nit}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground md:text-foreground">
                  <span className="md:hidden text-muted-foreground">Industria: </span>
                  {supplier.industry}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right">
                  <span className="md:hidden text-muted-foreground">Adjudicado: </span>
                  <span className="font-medium text-foreground">{formatCurrency(supplier.totalAwarded, supplier.currency)}</span>
                </div>
                <div className="col-span-1 md:col-span-1 text-sm md:text-center">
                  <span className="md:hidden text-muted-foreground">Contratos: </span>
                  <span className="text-foreground">{supplier.totalContracts}</span>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-center">
                  <span className="md:hidden text-muted-foreground">Oferta Única: </span>
                  <span className={`font-medium ${supplier.singleBidderPercentage > 50 ? 'text-destructive' : supplier.singleBidderPercentage > 25 ? 'text-on-tertiary-fixed-variant' : 'text-foreground'}`}>
                    {supplier.singleBidderPercentage}%
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <RiskBadge level={supplier.riskLevel} />
                </div>
                <div className="hidden md:flex md:col-span-1 justify-end">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pagination placeholder */}
        <div className="flex justify-center mt-6">
          <p className="text-sm text-muted-foreground">
            Mostrando {suppliers.length} de {suppliers.length} proveedores
          </p>
        </div>
      </main>

      <AIAssistantButton />
    </div>
  )
}
