import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'
import { Header } from '@/components/guatevigila/header'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { SupplierList } from '@/components/guatevigila/supplier-list'
import { Building, FileText, AlertTriangle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata: Metadata = {
  title: META.pages.proveedores.title,
  description: META.pages.proveedores.description,
  alternates: { canonical: META.pages.proveedores.canonical },
  openGraph: {
    title: `${META.pages.proveedores.title} | ${SITE.name}`,
    description: META.pages.proveedores.description,
    url: META.pages.proveedores.canonical,
  },
}

async function StatsBarLoader() {
  const stats = await client.getGlobalStats()
  return <StatsBar stats={stats} />
}

async function ProveedoresContent({ q, initialPage }: { q: string; initialPage: number }) {
  const suppliersPage = await client.getSuppliersPage({ q, page: initialPage })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proveedores Registrados</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">{suppliersPage.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contratos Totales</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {suppliersPage.summary.totalContracts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Contratistas de Alto Riesgo</p>
              <p className="text-2xl font-bold font-mono text-destructive mt-0.5">
                {suppliersPage.summary.highRiskSuppliers}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SupplierList
        key={`${q}:${suppliersPage.page}`}
        suppliers={suppliersPage.suppliers}
        total={suppliersPage.total}
        page={suppliersPage.page}
        pageSize={suppliersPage.pageSize}
        totalPages={suppliersPage.totalPages}
        initialQ={q}
      />
    </>
  )
}

function StatsBarSkeleton() {
  return (
    <div className="w-full bg-secondary/50 border-b border-border py-2.5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="h-4 w-96 bg-muted animate-pulse rounded-sm" />
      </div>
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
      ))}
    </div>
  )
}

export default async function ProveedoresPage({ searchParams }: PageProps) {
  const { q = '', page } = await searchParams
  const initialPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/5 via-background to-secondary/5">
      <Header />
      <Suspense fallback={<StatsBarSkeleton />}>
        <StatsBarLoader />
      </Suspense>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Índice de Contratistas del Estado
          </h1>
          <p className="text-muted-foreground">
            Monitoreo analítico de proveedores y comportamiento transaccional en el ecosistema de compras públicas
          </p>
        </div>

        <Suspense fallback={<ContentSkeleton />}>
          <ProveedoresContent q={q} initialPage={initialPage} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}