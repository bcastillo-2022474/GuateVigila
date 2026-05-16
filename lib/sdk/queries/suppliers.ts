import { query } from '@/lib/db'
import type {
  PaginatedSupplierContracts,
  RiskLevel,
  Supplier,
  SupplierContractsFilters,
  SupplierListItem,
} from '../types'
import { mockSuppliers, mockSupplierList } from '../mock-data'
import {
  buildRegistroMercantilUrl,
  getSupplierDisplayIdentifier,
} from '../supplier-identity'
import { getSupplierAlertsBySupplierId } from './alerts'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const VALID_TENDER_YEAR_FILTER =
  'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000'

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
        s.id AS supplier_id,
        MAX(s.name) AS supplier_name,
        COUNT(DISTINCT a.id) AS total_awards,
        COALESCE(SUM(a.value_amount), 0) AS total_amount,
        COUNT(DISTINCT m.buyer_id) AS client_entities,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END) AS single_bidder_count
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m ON m.ocid = a.main_ocid
      WHERE s.id = '${escapedId}'
        AND ${VALID_TENDER_YEAR_FILTER}
      GROUP BY s.id
    `),
    query<SupplierYearlyRow>(`
      SELECT
        EXTRACT(year FROM m."tender_tenderPeriod_startDate") AS year,
        COUNT(DISTINCT a.id) AS contract_count,
        COALESCE(SUM(a.value_amount), 0) AS amount
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
  const supplierId = String(summary.supplier_id)

  return {
    id: supplierId,
    name: String(summary.supplier_name ?? supplierId),
    nit: getSupplierDisplayIdentifier(supplierId),
    industry: 'Pendiente de clasificación',
    totalContracts,
    totalAwarded: Number(summary.total_amount ?? 0),
    currency: 'GTQ',
    clientEntities: Number(summary.client_entities ?? 0),
    singleBidderPercentage:
      totalContracts > 0 ? Math.round((singleBidderCount / totalContracts) * 100) : 0,
    period: '2020-2024',
    yearlyData: yearlyRows.map((row) => ({
      year: Number(row.year),
      amount: Number(row.amount ?? 0),
      contractCount: Number(row.contract_count ?? 0),
    })),
    alerts,
    associates: [],
    registroMercantilUrl: buildRegistroMercantilUrl(supplierId),
  }
}

const PAGE_SIZE = 15

function riskLevel(singleBidderPct: number, totalAmount: number): RiskLevel {
  if (singleBidderPct > 0.8 && totalAmount > 500_000_000) return 'critical'
  if (singleBidderPct > 0.7 || totalAmount > 1_000_000_000) return 'high'
  if (singleBidderPct > 0.5) return 'medium'
  return 'low'
}

export async function getSupplierContracts(
  id: string,
  filters: SupplierContractsFilters = {}
): Promise<PaginatedSupplierContracts> {
  const safeId = id.replace(/'/g, "''")
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * PAGE_SIZE
  const searchClause = filters.q?.trim()
    ? `AND m.buyer_name ILIKE '%${filters.q.trim().replace(/'/g, "''")}%'`
    : ''

  const [totalRows, contractRows] = await Promise.all([
    query<{ total: number }>(`
      SELECT COUNT(DISTINCT m.buyer_id) AS total
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE s.id = '${safeId}'
        AND ${VALID_TENDER_YEAR_FILTER}
        ${searchClause}
    `),

    query<{
      entity_id: string
      entity_name: string
      contract_count: number
      total_amount: number
      single_bidder_count: number
    }>(`
      SELECT
        m.buyer_id AS entity_id,
        m.buyer_name AS entity_name,
        COUNT(DISTINCT a.id) AS contract_count,
        COALESCE(SUM(a.value_amount), 0) AS total_amount,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END) AS single_bidder_count
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE s.id = '${safeId}'
        AND ${VALID_TENDER_YEAR_FILTER}
        ${searchClause}
      GROUP BY m.buyer_id, m.buyer_name
      ORDER BY total_amount DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  const contracts = contractRows.map((row) => {
    const count = Number(row.contract_count ?? 0)
    const amount = Number(row.total_amount ?? 0)
    const singlePct = count > 0 ? Number(row.single_bidder_count ?? 0) / count : 0
    return {
      id: `${id}-${row.entity_id}`,
      entityId: String(row.entity_id),
      entityName: row.entity_name,
      contractCount: count,
      totalAmount: amount,
      currency: 'GTQ',
      riskLevel: riskLevel(singlePct, amount),
    }
  })

  return {
    contracts,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  }
}
