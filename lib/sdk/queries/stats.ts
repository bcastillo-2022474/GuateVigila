import { query } from '@/lib/db'
import type { GlobalStats } from '../types'
import { getActiveAlertCount } from './alerts'

export async function getGlobalStats(): Promise<GlobalStats> {
  const [[row], activeAlerts] = await Promise.all([
    query<{
      processes: number
      total_amount: number
      period_start: number
      period_end: number
    }>(`
      SELECT
        COUNT(DISTINCT m.ocid) AS processes,
        COALESCE(SUM(a.value_amount), 0) AS total_amount,
        MIN(EXTRACT(year FROM m."tender_tenderPeriod_startDate")) AS period_start,
        MAX(EXTRACT(year FROM m."tender_tenderPeriod_startDate")) AS period_end
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    `),
    getActiveAlertCount(),
  ])

  return {
    processesAnalyzed: Number(row.processes),
    totalAmount: Number(row.total_amount),
    currency: 'GTQ',
    periodStart: Number(row.period_start),
    periodEnd: Number(row.period_end),
    activeAlerts,
  }
}
