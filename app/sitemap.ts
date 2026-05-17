import type { MetadataRoute } from 'next'
import { SITE, META } from '@/lib/constants/site'
import { client } from '@/lib/sdk/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE.url}${META.pages.entidades.canonical}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE.url}${META.pages.proveedores.canonical}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE.url}${META.pages.faq.canonical}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    const [alerts, entities] = await Promise.all([
      client.getAlerts(),
      client.getEntities({ page: 1 }),
    ])

    const alertRoutes: MetadataRoute.Sitemap = alerts.map((alert) => ({
      url: `${SITE.url}/alertas/${encodeURIComponent(alert.id)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const entityRoutes: MetadataRoute.Sitemap = entities.entities.map((entity) => ({
      url: `${SITE.url}/entidades/${encodeURIComponent(entity.id)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticRoutes, ...alertRoutes, ...entityRoutes]
  } catch {
    return staticRoutes
  }
}
