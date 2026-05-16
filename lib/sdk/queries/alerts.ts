import type { Alert, AlertDetail } from '../types'
import { mockAlerts, mockAlertDetails } from '../mock-data'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getAlerts(): Promise<Alert[]> {
  await delay(100)
  return mockAlerts
}

export async function getAlertById(id: string): Promise<AlertDetail | null> {
  await delay(100)
  return mockAlertDetails[id] ?? null
}
