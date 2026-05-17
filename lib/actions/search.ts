'use server'

import { client } from '@/lib/sdk/client'
import type { SearchResult } from '@/lib/sdk/types'

export async function searchAction(q: string): Promise<SearchResult[]> {
  return client.search(q)
}
