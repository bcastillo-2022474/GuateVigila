// Selects the DB adapter based on available env vars:
// - DATABASE_URL set → Neon (serverless Postgres, for production)
// - OCDS_DATA_DIR set → DuckDB (local CSVs, for development)
// Both adapters expose the same query<T>(sql) interface.

import { unstable_cache } from 'next/cache'

export type QueryFn = <T = Record<string, unknown>>(sql: string) => Promise<T[]>

let _query: QueryFn | null = null

async function getAdapter(): Promise<QueryFn> {
  if (_query) return _query

  if (process.env.DATABASE_URL) {
    const mod = await import('./adapters/neon')
    _query = mod.query
  } else if (process.env.OCDS_DATA_DIR) {
    const mod = await import('./adapters/duckdb')
    _query = mod.query
  } else {
    throw new Error(
      'No DB adapter configured — set DATABASE_URL (Neon) or OCDS_DATA_DIR (local CSVs) in .env.local'
    )
  }

  return _query
}

// Direct query — no cache. Use only where caching is inappropriate (e.g. sitemap generation).
export async function rawQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const fn = await getAdapter()
  return fn<T>(sql)
}

// Cache all DB queries for 1 hour. The SQL string is the cache key, so
// different queries (different filters/pages) get independent cache entries.
// Tag 'db' allows on-demand invalidation via revalidateTag('db').
export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  return unstable_cache(
    () => rawQuery<T>(sql),
    [sql],
    { tags: ['db'], revalidate: 3600 },
  )()
}
