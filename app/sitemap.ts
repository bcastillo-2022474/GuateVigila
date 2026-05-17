import type { MetadataRoute } from 'next'
import { SITE, META } from '@/lib/constants/site'
import { rawQuery } from '@/lib/db'

export const revalidate = 86400

const staticRoutes: MetadataRoute.Sitemap = [
  { url: SITE.url,                                     changeFrequency: 'daily',   priority: 1   },
  { url: `${SITE.url}${META.pages.entidades.canonical}`,   changeFrequency: 'daily',   priority: 0.9 },
  { url: `${SITE.url}${META.pages.proveedores.canonical}`, changeFrequency: 'daily',   priority: 0.9 },
  { url: `${SITE.url}${META.pages.faq.canonical}`,     changeFrequency: 'monthly', priority: 0.5 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [alerts, entities, suppliers] = await Promise.all([
      rawQuery<{ canonical_id: string }>(`
        SELECT canonical_id FROM alert_pairs
        ORDER BY risk_score DESC
      `),
      rawQuery<{ buyer_id: string }>(`
        SELECT DISTINCT buyer_id FROM alert_pairs
        ORDER BY buyer_id
      `),
      rawQuery<{ supplier_id: string }>(`
        SELECT supplier_id FROM alert_pairs
        GROUP BY supplier_id
        ORDER BY SUM(total_amount) DESC
        LIMIT 5000
      `),
    ])

    return [
      ...staticRoutes,
      ...alerts.map((a) => ({
        url: `${SITE.url}/alertas/${encodeURIComponent(a.canonical_id)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...entities.map((e) => ({
        url: `${SITE.url}/entidades/${encodeURIComponent(e.buyer_id)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...suppliers.map((s) => ({
        url: `${SITE.url}/proveedores/${encodeURIComponent(s.supplier_id)}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
