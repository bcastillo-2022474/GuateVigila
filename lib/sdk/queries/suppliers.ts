import type { PaginatedSupplierContracts, PaginatedSupplierList, RiskLevel, Supplier, SupplierContractsFilters, SupplierFilters, SupplierListItem } from '../types'
import { query } from '@/lib/db/index'

const PAGE_SIZE_LIST = 50

export async function getSuppliers(filters: SupplierFilters = {}): Promise<PaginatedSupplierList> {
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * PAGE_SIZE_LIST
  const searchClause = filters.q?.trim()
    ? `AND s.name ILIKE '%${filters.q.trim().replace(/'/g, "''")}%'`
    : ''

  const [totalRows, rows] = await Promise.all([
    query<{ total: number }>(`
      SELECT COUNT(DISTINCT s.name) AS total
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m   ON m.ocid = a.main_ocid
      WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
        ${searchClause}
    `),

    query<{
      supplier_id: string
      supplier_name: string
      total_contracts: number
      total_amount: number
      client_entities: number
      single_bidder_count: number
    }>(`
      SELECT
        s.name                                                        AS supplier_name,
        MAX(s.id)                                                     AS supplier_id,
        COUNT(DISTINCT a.id)                                          AS total_contracts,
        SUM(a.value_amount)                                           AS total_amount,
        COUNT(DISTINCT m.buyer_id)                                    AS client_entities,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END)                            AS single_bidder_count
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m   ON m.ocid = a.main_ocid
      WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
        ${searchClause}
      GROUP BY s.name
      ORDER BY total_amount DESC
      LIMIT ${PAGE_SIZE_LIST} OFFSET ${offset}
    `),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  const suppliers: SupplierListItem[] = rows.map((r) => {
    const totalContracts = Number(r.total_contracts)
    const totalAwarded = Number(r.total_amount)
    const singleBidderPct = totalContracts > 0 ? Number(r.single_bidder_count) / totalContracts : 0
    return {
      id: String(r.supplier_name),
      name: String(r.supplier_name),
      nit: String(r.supplier_id).replace('GT-NIT-', ''),
      industry: 'General',
      totalContracts,
      totalAwarded,
      currency: 'GTQ',
      clientEntities: Number(r.client_entities),
      riskLevel: riskLevel(singleBidderPct, totalAwarded),
      singleBidderPercentage: Math.round(singleBidderPct * 100),
    }
  })

  return { suppliers, total, page, pageSize: PAGE_SIZE_LIST, totalPages: Math.ceil(total / PAGE_SIZE_LIST) }
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const safeId = id.replace(/'/g, "''")

  const [summaryRows, yearlyRows, cowinnerRows] = await Promise.all([
    query<{
      supplier_id: string
      supplier_name: string
      total_awards: number
      total_amount: number
      client_entities: number
      single_bidder_count: number
    }>(`
      SELECT
        s.name                                                        AS supplier_name,
        MAX(s.id)                                                     AS supplier_id,
        COUNT(DISTINCT a.id)                                          AS total_awards,
        SUM(a.value_amount)                                           AS total_amount,
        COUNT(DISTINCT m.buyer_id)                                    AS client_entities,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END)                            AS single_bidder_count
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m   ON m.ocid = a.main_ocid
      WHERE s.name = '${safeId}'
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
      GROUP BY s.name
    `),

    query<{
      year: number
      contract_count: number
      amount: number
    }>(`
      SELECT
        EXTRACT(year FROM m."tender_tenderPeriod_startDate")   AS year,
        COUNT(DISTINCT a.id)                    AS contract_count,
        SUM(a.value_amount)                     AS amount
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m   ON m.ocid = a.main_ocid
      WHERE s.name = '${safeId}'
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
      GROUP BY 1
      ORDER BY 1
    `),

    query<{
      competitor_name: string
      shared_tenders: number
    }>(`
      SELECT
        s2.name                   AS competitor_name,
        COUNT(DISTINCT m.ocid)    AS shared_tenders
      FROM awards_suppliers s1
      JOIN awards a1 ON a1.id = s1.awards_id AND a1.status = 'active'
      JOIN main m    ON m.ocid = a1.main_ocid
      JOIN awards a2 ON a2.main_ocid = m.ocid AND a2.status = 'active'
      JOIN awards_suppliers s2 ON s2.awards_id = a2.id AND s2.name != '${safeId}'
      WHERE s1.name = '${safeId}'
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
      GROUP BY s2.name
      ORDER BY shared_tenders DESC
      LIMIT 10
    `),
  ])

  const summary = summaryRows[0]
  if (!summary) return null

  const totalAwards = Number(summary.total_awards)
  const singleBidderCount = Number(summary.single_bidder_count)
  const years = yearlyRows.map((r) => ({
    year: Number(r.year),
    amount: Number(r.amount),
    contractCount: Number(r.contract_count),
  }))
  const periodStart = years[0]?.year ?? 2020
  const periodEnd = years[years.length - 1]?.year ?? 2024

  return {
    id: safeId,
    name: String(summary.supplier_name),
    nit: String(summary.supplier_id).replace('GT-NIT-', ''),
    industry: 'General',
    totalContracts: totalAwards,
    totalAwarded: Number(summary.total_amount),
    currency: 'GTQ',
    clientEntities: Number(summary.client_entities),
    singleBidderPercentage: totalAwards > 0
      ? Math.round((singleBidderCount / totalAwards) * 100)
      : 0,
    period: `${periodStart}–${periodEnd}`,
    yearlyData: years,
    alerts: [],
    associates: cowinnerRows.map((r) => ({
      id: String(r.competitor_name),
      name: String(r.competitor_name),
      role: 'Competidor frecuente',
      participation: `${r.shared_tenders} licitaciones en común`,
      otherCompanies: 0,
    })),
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
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
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
