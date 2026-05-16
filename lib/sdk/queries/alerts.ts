import type { Alert, AlertDetail, AlertFilters, PaginatedAlerts } from '../types'
import { mockAlerts, mockAlertDetails } from '../mock-data'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const PAGE_SIZE = 20

export async function getAlerts(filters: AlertFilters = {}): Promise<PaginatedAlerts> {
  await delay(100)

  let results: Alert[] = mockAlerts

  if (filters.signal) results = results.filter((a) => a.signalType === filters.signal)
  if (filters.year) results = results.filter((a) => a.year === filters.year)
  if (filters.entity) {
    const q = filters.entity.toLowerCase()
    results = results.filter((a) => a.entityName.toLowerCase().includes(q))
  }

  const total = results.length
  const page = Math.max(1, filters.page ?? 1)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const alerts = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return { alerts, total, page, pageSize: PAGE_SIZE, totalPages }
}

export async function getAlertById(id: string): Promise<AlertDetail | null> {
  await delay(100)
  return mockAlertDetails[id] ?? null
}
