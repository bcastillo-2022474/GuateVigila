import type { MetadataRoute } from 'next'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'

export const revalidate = 86400

const staticRoutes: MetadataRoute.Sitemap = [
  { url: SITE.url,                                    changeFrequency: 'daily',   priority: 1,   lastModified: new Date() },
  { url: `${SITE.url}${META.pages.entidades.canonical}`,  changeFrequency: 'daily',   priority: 0.9, lastModified: new Date() },
  { url: `${SITE.url}${META.pages.proveedores.canonical}`, changeFrequency: 'daily',   priority: 0.9, lastModified: new Date() },
  { url: `${SITE.url}${META.pages.faq.canonical}`,    changeFrequency: 'monthly', priority: 0.5, lastModified: new Date() },
]

async function fetchAllPages<T>(
  fetcher: (page: number) => Promise<{ items: T[]; totalPages: number }>
): Promise<T[]> {
  const first = await fetcher(1)
  if (first.totalPages <= 1) return first.items
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => fetcher(i + 2))
  )
  return [first.items, ...rest.map((r) => r.items)].flat()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [alerts, allEntities, allSuppliers] = await Promise.all([
      client.getAlerts(),
      fetchAllPages(async (page) => {
        const r = await client.getEntitiesPage({ page })
        return { items: r.entities, totalPages: r.totalPages }
      }),
      fetchAllPages(async (page) => {
        const r = await client.getSuppliersPage({ page, pageSize: 200 })
        return { items: r.suppliers, totalPages: r.totalPages }
      }),
    ])

    return [
      ...staticRoutes,
      ...alerts.map((a) => ({
        url: `${SITE.url}/alertas/${encodeURIComponent(a.id)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        lastModified: new Date(),
      })),
      ...allEntities.map((e) => ({
        url: `${SITE.url}/entidades/${encodeURIComponent(e.id)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        lastModified: new Date(),
      })),
      ...allSuppliers.map((s) => ({
        url: `${SITE.url}/proveedores/${encodeURIComponent(s.id)}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        lastModified: new Date(),
      })),
    ]
  } catch {
    return staticRoutes
  }
}
