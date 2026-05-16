import type { GlobalStats } from '../types'
import { mockGlobalStats } from '../mock-data'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getGlobalStats(): Promise<GlobalStats> {
  await delay(100)
  return mockGlobalStats
}
