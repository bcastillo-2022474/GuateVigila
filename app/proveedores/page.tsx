import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'
import { Header } from '@/components/guatevigila/header'
import { StatsBar } from '@/components/guatevigila/stats-bar'
import { AIAssistantButton } from '@/components/guatevigila/ai-assistant-button'
import { SupplierList } from '@/components/guatevigila/supplier-list'

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

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

async function StatsBarLoader() {
  const stats = await client.getGlobalStats()
  return <StatsBar stats={stats} />
}

async function ProveedoresContent({ q, page }: { q: string; page: number }) {
  const result = await client.getSuppliers({ q: q || undefined, page })
  return <SupplierList result={result} q={q} />
}

function StatsBarSkeleton() {
  return (
    <div className="w-full bg-surface-container-low py-2 border-b border-outline-variant">
      <div className="max-w-[1200px] mx-auto px-4 md:px-16">
        <div className="h-[14px] w-96 bg-outline-variant/40 animate-pulse rounded-sm" />
      </div>
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-full bg-surface-container-low rounded-sm" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-surface-container-low rounded-sm" />
      ))}
    </div>
  )
}

export default async function ProveedoresPage({ searchParams }: PageProps) {
  const { q = '', page: pageParam = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageParam, 10) || 1)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<StatsBarSkeleton />}>
        <StatsBarLoader />
      </Suspense>

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-primary tracking-tight mb-2">Proveedores</h1>
          <p className="text-on-surface-variant">
            Directorio de proveedores con contratos gubernamentales bajo monitoreo
          </p>
        </div>

        <Suspense fallback={<ContentSkeleton />}>
          <ProveedoresContent q={q} page={page} />
        </Suspense>
      </main>

      <AIAssistantButton />
    </div>
  )
}
