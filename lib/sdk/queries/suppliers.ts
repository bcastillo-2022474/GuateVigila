import { query } from '@/lib/db'
import type { Supplier, SupplierListItem } from '../types'
import { mockSuppliers, mockSupplierList } from '../mock-data'
import {
  buildRegistroMercantilUrl,
  getSupplierDisplayIdentifier,
} from '../supplier-identity'
import { getSupplierAlertsBySupplierId } from './alerts'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const VALID_TENDER_YEAR_FILTER = 'year(m.tender_tenderPeriod_startDate) > 2000'

interface SupplierSummaryRow {
  supplier_id: string
  supplier_name: string
  total_awards: number
  total_amount: number
  client_entities: number
  single_bidder_count: number
}

interface SupplierYearlyRow {
  year: number
  contract_count: number
  amount: number
}

export async function getSuppliers(): Promise<SupplierListItem[]> {
  await delay(100)
  return mockSupplierList
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const mockSupplier = mockSuppliers[id]
  if (mockSupplier) {
    await delay(100)
    return mockSupplier
  }

  const escapedId = id.replace(/'/g, "''")
  const [summaryRows, yearlyRows, alerts] = await Promise.all([
    query<SupplierSummaryRow>(`
      SELECT
        s.id                                                        AS supplier_id,
        MAX(s.name)                                                 AS supplier_name,
        COUNT(DISTINCT a.id)                                        AS total_awards,
        SUM(a.value_amount)                                         AS total_amount,
        COUNT(DISTINCT m.buyer_id)                                  AS client_entities,
        COUNT(DISTINCT CASE WHEN m.tender_numberOfTenderers = 1
                            THEN a.id END)                          AS single_bidder_count
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m ON m.ocid = a.main_ocid
      WHERE s.id = '${escapedId}'
        AND ${VALID_TENDER_YEAR_FILTER}
      GROUP BY s.id
    `),
    query<SupplierYearlyRow>(`
      SELECT
        year(m.tender_tenderPeriod_startDate)                       AS year,
        COUNT(DISTINCT a.id)                                        AS contract_count,
        SUM(a.value_amount)                                         AS amount
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m ON m.ocid = a.main_ocid
      WHERE s.id = '${escapedId}'
        AND ${VALID_TENDER_YEAR_FILTER}
      GROUP BY 1
      ORDER BY 1
    `),
    getSupplierAlertsBySupplierId(id),
  ])

  const summary = summaryRows[0]
  if (!summary) return null

  const totalContracts = Number(summary.total_awards ?? 0)
  const singleBidderCount = Number(summary.single_bidder_count ?? 0)

  return {
    id: String(summary.supplier_id),
    name: String(summary.supplier_name ?? summary.supplier_id),
    nit: getSupplierDisplayIdentifier(String(summary.supplier_id)),
    industry: 'Pendiente de clasificación',
    totalContracts,
    totalAwarded: Number(summary.total_amount ?? 0),
    currency: 'GTQ',
    clientEntities: Number(summary.client_entities ?? 0),
    singleBidderPercentage: totalContracts > 0
      ? Math.round((singleBidderCount / totalContracts) * 100)
      : 0,
    period: '2020-2024',
    yearlyData: yearlyRows.map((row) => ({
      year: Number(row.year),
      amount: Number(row.amount ?? 0),
      contractCount: Number(row.contract_count ?? 0),
    })),
    alerts,
    associates: [],
    registroMercantilUrl: buildRegistroMercantilUrl(String(summary.supplier_id)),
  }
}
