import type { Entity, EntityFilters, EntityListItem, EntitySuppliersFilters, PaginatedEntityList, PaginatedSuppliers, RiskLevel } from '../types'
import { query } from '@/lib/db/index'
import { getSupplierDisplayIdentifier } from '../supplier-identity'
import { getEntityActiveAlertCounts } from './alerts'

function inferType(name: string): EntityListItem['type'] {
  const n = name.toUpperCase()
  if (n.includes('MUNICIPALIDAD') || n.includes('MANCOMUNIDAD')) return 'municipalidad'
  if (n.includes('MINISTERIO')) return 'ministerio'
  if (n.includes('SECRETAR')) return 'secretaria'
  return 'instituto'
}

function shortName(name: string): string {
  const acronyms: Record<string, string> = {
    'INSTITUTO GUATEMALTECO DE SEGURIDAD SOCIAL': 'IGSS',
    'MINISTERIO DE SALUD PUBLICA Y ASISTENCIA SOCIAL': 'MSPAS',
    'MINISTERIO DE COMUNICACIONES INFRAESTRUCTURA Y VIVIENDA': 'MICIVI',
    'MINISTERIO DE EDUCACION': 'MINEDUC',
    'MINISTERIO DE FINANZAS PUBLICAS': 'MINFIN',
    'MINISTERIO DE GOBERNACION': 'MINGOB',
    'MINISTERIO DE LA DEFENSA NACIONAL': 'MINDEF',
    'MINISTERIO DE DESARROLLO SOCIAL': 'MIDES',
    'MINISTERIO DE AGRICULTURA GANADERIA Y ALIMENTACION': 'MAGA',
    'MINISTERIO DE AMBIENTE Y RECURSOS NATURALES': 'MARN',
    'MUNICIPALIDAD DE GUATEMALA': 'MUNIGUATE',
    'ORGANISMO LEGISLATIVO': 'CONGRESO',
    'INSTITUTO NACIONAL DE ELECTRIFICACION': 'INDE',
    'POLICIA NACIONAL CIVIL': 'PNC',
  }
  const upper = name.toUpperCase().replace(/[,.]/g, '')
  for (const [key, val] of Object.entries(acronyms)) {
    if (upper.includes(key)) return val
  }
  return name.split(' ')[0].slice(0, 12).toUpperCase()
}

function riskLevel(singleBidderPct: number, totalAmount: number): RiskLevel {
  if (singleBidderPct > 0.8 && totalAmount > 500_000_000) return 'critical'
  if (singleBidderPct > 0.7 || totalAmount > 1_000_000_000) return 'high'
  if (singleBidderPct > 0.5) return 'medium'
  return 'low'
}

const PAGE_SIZE_LIST = 20

export async function getEntities(filters: EntityFilters = {}): Promise<PaginatedEntityList> {
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * PAGE_SIZE_LIST

  const searchClause = filters.q?.trim()
    ? `AND m.buyer_name ILIKE '%${filters.q.trim().replace(/'/g, "''")}%'`
    : ''

  const typeNames: Record<string, string[]> = {
    municipalidad: ['MUNICIPALIDAD', 'MANCOMUNIDAD'],
    ministerio: ['MINISTERIO'],
    secretaria: ['SECRETAR'],
  }
  let typeClause = ''
  if (filters.type && filters.type.length > 0) {
    const conditions = filters.type.flatMap((t) => {
      if (t === 'instituto') return []
      return (typeNames[t] ?? []).map((kw) => `m.buyer_name ILIKE '%${kw}%'`)
    })
    const hasInstituto = filters.type.includes('instituto')
    if (hasInstituto && conditions.length > 0) {
      const notOthers = Object.values(typeNames).flat().map((kw) => `m.buyer_name NOT ILIKE '%${kw}%'`).join(' AND ')
      typeClause = `AND (${conditions.join(' OR ')} OR (${notOthers}))`
    } else if (hasInstituto) {
      const notOthers = Object.values(typeNames).flat().map((kw) => `m.buyer_name NOT ILIKE '%${kw}%'`).join(' AND ')
      typeClause = `AND (${notOthers})`
    } else if (conditions.length > 0) {
      typeClause = `AND (${conditions.join(' OR ')})`
    }
  }

  const baseWhere = `WHERE m.buyer_id IS NOT NULL AND m.buyer_name IS NOT NULL ${searchClause} ${typeClause}`

  const [totalRows, rows, activeAlertCounts] = await Promise.all([
    query<{ total: number; total_contracts: number; total_alerts: number }>(`
      SELECT
        COUNT(DISTINCT m.buyer_id) AS total,
        COALESCE(SUM(award_counts.cnt), 0) AS total_contracts,
        0 AS total_alerts
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN LATERAL (SELECT COUNT(DISTINCT a2.id) AS cnt FROM awards a2 WHERE a2.main_ocid = m.ocid AND a2.status = 'active') award_counts ON true
      ${baseWhere}
    `),

    query<{
      buyer_id: string
      buyer_name: string
      total_awards: number
      total_amount: number
      single_bidder_count: number
    }>(`
      SELECT
        m.buyer_id,
        m.buyer_name,
        COUNT(DISTINCT a.id)                                        AS total_awards,
        COALESCE(SUM(a.value_amount), 0)                            AS total_amount,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END)                          AS single_bidder_count
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      ${baseWhere}
      GROUP BY m.buyer_id, m.buyer_name
      ORDER BY total_amount DESC
      LIMIT ${PAGE_SIZE_LIST} OFFSET ${offset}
    `),

    getEntityActiveAlertCounts(),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  const entities: EntityListItem[] = rows.map((r) => {
    const buyerId = String(r.buyer_id ?? '').trim()
    const amount = Number(r.total_amount)
    const awards = Number(r.total_awards)
    const singlePct = awards > 0 ? Number(r.single_bidder_count) / awards : 0
    return {
      id: buyerId || r.buyer_name,
      name: r.buyer_name,
      shortName: shortName(r.buyer_name),
      type: inferType(r.buyer_name),
      totalContracts: awards,
      totalAmount: amount,
      currency: 'GTQ',
      activeAlerts: activeAlertCounts.get(buyerId) ?? 0,
      riskLevel: riskLevel(singlePct, amount),
    }
  })

  const totalAlerts = entities.reduce((sum, e) => sum + e.activeAlerts, 0)
  const totalContracts = Number(totalRows[0]?.total_contracts ?? 0)

  return {
    entities,
    total,
    page,
    pageSize: PAGE_SIZE_LIST,
    totalPages: Math.ceil(total / PAGE_SIZE_LIST),
    summary: { totalContracts, totalAlerts },
  }
}

// Alias so callers using getEntitiesPage also work
export const getEntitiesPage = getEntities

export async function getEntityById(id: string): Promise<Entity | null> {
  const escapedId = id.replace(/'/g, "''")
  const nameRows = await query<{ buyer_id: string; buyer_name: string }>(`
    SELECT buyer_id, buyer_name
    FROM main
    WHERE buyer_id = '${escapedId}'
       OR buyer_name = '${escapedId}'
    ORDER BY CASE WHEN buyer_id = '${escapedId}' THEN 0 ELSE 1 END, buyer_name
    LIMIT 1
  `)
  if (nameRows.length === 0) return null

  const rawBuyerId = String(nameRows[0].buyer_id ?? '').trim()
  const buyerId = rawBuyerId || id
  const buyerName = nameRows[0].buyer_name
  const safeName = buyerName.replace(/'/g, "''")
  const safeBuyerId = buyerId.replace(/'/g, "''")
  const entityFilter = rawBuyerId
    ? `m.buyer_id = '${safeBuyerId}'`
    : `m.buyer_name = '${safeName}'`

  const [summaryRows, yearlyRows, activeAlertCounts] = await Promise.all([
    query<{
      total_awards: number
      total_amount: number
      direct_purchase_count: number
    }>(`
      SELECT
        COUNT(DISTINCT a.id)                                           AS total_awards,
        COALESCE(SUM(a.value_amount), 0)                               AS total_amount,
        COUNT(DISTINCT CASE
          WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
            OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
          THEN a.id END)                                               AS direct_purchase_count
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE ${entityFilter}
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    `),

    query<{ year: number; amount: number }>(`
      SELECT
        EXTRACT(year FROM m."tender_tenderPeriod_startDate")   AS year,
        COALESCE(SUM(a.value_amount), 0)                       AS amount
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE ${entityFilter}
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
      GROUP BY 1
      ORDER BY 1
    `),

    getEntityActiveAlertCounts(),
  ])

  if (summaryRows.length === 0) return null
  const summary = summaryRows[0]
  const totalAwards = Number(summary.total_awards)
  const totalAmount = Number(summary.total_amount)
  const directPct = totalAwards > 0
    ? Math.round((Number(summary.direct_purchase_count) / totalAwards) * 100)
    : 0

  const yearlyData = yearlyRows.map((r) => {
    const amt = Number(r.amount)
    return {
      year: Number(r.year),
      amount: amt,
      label: amt >= 1_000_000_000
        ? `${(amt / 1_000_000_000).toFixed(1)}B`
        : `${(amt / 1_000_000).toFixed(0)}M`,
    }
  })

  return {
    id: buyerId,
    name: buyerName,
    shortName: shortName(buyerName),
    totalContracts: totalAwards,
    totalAmount,
    currency: 'GTQ',
    directPurchasePercentage: directPct,
    activeAlerts: activeAlertCounts.get(buyerId) ?? 0,
    yearlyData,
  }
}

const PAGE_SIZE = 15

export async function getEntitySuppliers(
  id: string,
  filters: EntitySuppliersFilters = {}
): Promise<PaginatedSuppliers> {
  const safeId = id.replace(/'/g, "''")
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * PAGE_SIZE
  const searchClause = filters.q?.trim()
    ? `AND s.name ILIKE '%${filters.q.trim().replace(/'/g, "''")}%'`
    : ''

  const nameRows = await query<{ buyer_id: string; buyer_name: string }>(`
    SELECT buyer_id, buyer_name
    FROM main
    WHERE buyer_id = '${safeId}' OR buyer_name = '${safeId}'
    ORDER BY CASE WHEN buyer_id = '${safeId}' THEN 0 ELSE 1 END, buyer_name
    LIMIT 1
  `)
  if (nameRows.length === 0) return { suppliers: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 }

  const rawBuyerId = String(nameRows[0].buyer_id ?? '').trim()
  const buyerId = rawBuyerId || id
  const buyerName = nameRows[0].buyer_name
  const safeName = buyerName.replace(/'/g, "''")
  const safeBuyerId = buyerId.replace(/'/g, "''")
  const entityFilter = rawBuyerId
    ? `m.buyer_id = '${safeBuyerId}'`
    : `m.buyer_name = '${safeName}'`

  const [totalRows, supplierRows] = await Promise.all([
    query<{ total: number }>(`
      SELECT COUNT(DISTINCT s.id) AS total
      FROM main m
      JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE ${entityFilter}
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
        ${searchClause}
    `),

    query<{
      ocds_id: string
      supplier_name: string
      contract_count: number
      total_amount: number
      single_bidder_count: number
    }>(`
      SELECT
        s.id                                                           AS ocds_id,
        MAX(s.name)                                                    AS supplier_name,
        COUNT(DISTINCT a.id)                                           AS contract_count,
        COALESCE(SUM(a.value_amount), 0)                               AS total_amount,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END)                             AS single_bidder_count
      FROM main m
      JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE ${entityFilter}
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
        ${searchClause}
      GROUP BY s.id
      ORDER BY total_amount DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  const suppliers = supplierRows.map((r) => {
    const count = Number(r.contract_count)
    const amt = Number(r.total_amount)
    const singlePct = count > 0 ? Number(r.single_bidder_count) / count : 0
    const ocdsId = String(r.ocds_id)
    return {
      id: `${buyerId}-${ocdsId}`,
      supplierId: ocdsId,
      supplierName: r.supplier_name,
      supplierNit: getSupplierDisplayIdentifier(ocdsId),
      contractCount: count,
      totalAmount: amt,
      currency: 'GTQ',
      riskLevel: riskLevel(singlePct, amt),
    }
  })

  return {
    suppliers,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  }
}
