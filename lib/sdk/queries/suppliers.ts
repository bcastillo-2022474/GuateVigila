import type { PaginatedSupplierContracts, RiskLevel, Supplier, SupplierContractsFilters, SupplierListItem } from '../types'
import { mockSuppliers, mockSupplierList } from '../mock-data'
import { query } from '@/lib/db'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getSuppliers(): Promise<SupplierListItem[]> {
  await delay(100)
  return mockSupplierList
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  await delay(100)
  return mockSuppliers[id] ?? null
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
      JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE s.id = '${safeId}'
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
        m.buyer_id                                                     AS entity_id,
        m.buyer_name                                                   AS entity_name,
        COUNT(DISTINCT a.id)                                           AS contract_count,
        SUM(a.value_amount)                                            AS total_amount,
        COUNT(DISTINCT CASE WHEN m.tender_numberOfTenderers = 1
                            THEN a.id END)                             AS single_bidder_count
      FROM main m
      JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE s.id = '${safeId}'
        ${searchClause}
      GROUP BY m.buyer_id, m.buyer_name
      ORDER BY total_amount DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  const contracts = contractRows.map((r) => {
    const count = Number(r.contract_count)
    const amt = Number(r.total_amount)
    const singlePct = count > 0 ? Number(r.single_bidder_count) / count : 0
    return {
      id: `${id}-${r.entity_id}`,
      entityId: String(r.entity_id),
      entityName: r.entity_name,
      contractCount: count,
      totalAmount: amt,
      currency: 'GTQ',
      riskLevel: riskLevel(singlePct, amt),
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
