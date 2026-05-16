import Link from 'next/link'
import { client } from '@/lib/sdk'
import { Header, StatsBar, AIAssistantButton, RiskBadge } from '@/components/guatevigila'
import { Building2, FileText, AlertTriangle, ChevronRight, Search, Filter } from 'lucide-react'

function formatCurrency(amount: number, currency: string): string {
  if (amount >= 1000000000) {
    return `${currency} ${(amount / 1000000000).toFixed(1)}B`
  }
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`
  }
  return `${currency} ${amount.toLocaleString()}`
}

function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ministerio: 'Ministerio',
    municipalidad: 'Municipalidad',
    instituto: 'Instituto',
    secretaria: 'Secretaría',
  }
  return labels[type] || type
}

export default async function EntidadesPage() {
  const [entities, stats] = await Promise.all([
    client.getEntities(),
    client.getGlobalStats(),
  ])

  // Calculate totals for the header
  const totalEntities = entities.length
  const totalContracts = entities.reduce((sum, e) => sum + e.totalContracts, 0)
  const totalAlerts = entities.reduce((sum, e) => sum + e.activeAlerts, 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StatsBar stats={stats} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Explorador de Entidades
          </h1>
          <p className="text-muted-foreground">
            Directorio de entidades gubernamentales bajo monitoreo de GuateVigila
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entidades Monitoreadas</p>
                <p className="text-xl font-semibold text-foreground">{totalEntities}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contratos Analizados</p>
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
                <p className="text-sm text-muted-foreground">Alertas Activas</p>
                <p className="text-xl font-semibold text-foreground">{totalAlerts}</p>
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
              placeholder="Buscar entidad por nombre..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Entity List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Entidad</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2 text-right">Contratos</div>
            <div className="col-span-2 text-right">Monto Total</div>
            <div className="col-span-1 text-center">Alertas</div>
            <div className="col-span-1"></div>
          </div>
          
          <div className="divide-y divide-border">
            {entities.map((entity) => (
              <Link
                key={entity.id}
                href={`/entidades/${entity.id}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 hover:bg-muted/30 transition-colors items-center"
              >
                <div className="col-span-1 md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{entity.name}</p>
                      <p className="text-xs text-muted-foreground">{entity.shortName}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground md:text-foreground">
                  <span className="md:hidden text-muted-foreground">Tipo: </span>
                  {getEntityTypeLabel(entity.type)}
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right">
                  <span className="md:hidden text-muted-foreground">Contratos: </span>
                  <span className="text-foreground">{entity.totalContracts.toLocaleString()}</span>
                </div>
                <div className="col-span-1 md:col-span-2 text-sm md:text-right">
                  <span className="md:hidden text-muted-foreground">Monto: </span>
                  <span className="font-medium text-foreground">{formatCurrency(entity.totalAmount, entity.currency)}</span>
                </div>
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <div className="flex items-center gap-2 md:justify-center">
                    <RiskBadge level={entity.riskLevel} />
                    <span className="text-sm text-muted-foreground">{entity.activeAlerts}</span>
                  </div>
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
            Mostrando {entities.length} de {entities.length} entidades
          </p>
        </div>
      </main>

      <AIAssistantButton />
    </div>
  )
}
