import { query } from '@/lib/db'
import type {
  Entity,
  EntityFilters,
  EntityListFilters,
  EntityListItem,
  EntitySuppliersFilters,
  PaginatedEntities,
  PaginatedSuppliers,
  RiskLevel,
} from '../types'
import { getSupplierDisplayIdentifier } from '../supplier-identity'
import { getEntityActiveAlertCounts } from './alerts'

const VALID_TENDER_YEAR_FILTER =
  'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000'
const ENTITY_LIST_PAGE_SIZE = 20
const ENTITY_SUPPLIERS_PAGE_SIZE = 15

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
  for (const [key, value] of Object.entries(acronyms)) {
    if (upper.includes(key)) return value
  }
  return name.split(' ')[0].slice(0, 12).toUpperCase()
}

function riskLevel(singleBidderPct: number, totalAmount: number): RiskLevel {
  if (singleBidderPct > 0.8 && totalAmount > 500_000_000) return 'critical'
  if (singleBidderPct > 0.7 || totalAmount > 1_000_000_000) return 'high'
  if (singleBidderPct > 0.5) return 'medium'
  return 'low'
}

function matchesEntitySearch(entity: EntityListItem, rawQuery: string): boolean {
  const query = rawQuery.trim().toUpperCase()
  if (!query) return true

  return (
    entity.name.toUpperCase().includes(query) ||
    entity.shortName.toUpperCase().includes(query) ||
    entity.id.toUpperCase().includes(query)
  )
}

export async function getEntities(filters?: EntityFilters): Promise<EntityListItem[]> {
  const [rows, activeAlertCounts] = await Promise.all([
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
        COUNT(DISTINCT a.id) AS total_awards,
        COALESCE(SUM(a.value_amount), 0) AS total_amount,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END) AS single_bidder_count
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE m.buyer_id IS NOT NULL
        AND m.buyer_name IS NOT NULL
        AND ${VALID_TENDER_YEAR_FILTER}
      GROUP BY m.buyer_id, m.buyer_name
      ORDER BY total_amount DESC
    `),
    getEntityActiveAlertCounts(),
  ])

  const mapped = rows
    .map((row) => {
      const buyerId = String(row.buyer_id ?? '').trim()
      const amount = Number(row.total_amount ?? 0)
      const awards = Number(row.total_awards ?? 0)
      const singlePct = awards > 0 ? Number(row.single_bidder_count ?? 0) / awards : 0

      return {
        id: buyerId,
        name: row.buyer_name,
        shortName: shortName(row.buyer_name),
        type: inferType(row.buyer_name),
        totalContracts: awards,
        totalAmount: amount,
        currency: 'GTQ',
        activeAlerts: activeAlertCounts.get(buyerId) ?? 0,
        riskLevel: riskLevel(singlePct, amount),
      }
    })
    .filter((entity) => entity.id)

  if (filters?.type && filters.type.length > 0) {
    const allowed = new Set(filters.type)
    return mapped.filter((entity) => allowed.has(entity.type))
  }

  return mapped
}

export async function getEntitiesPage(
  filters: EntityListFilters = {}
): Promise<PaginatedEntities> {
  const pageSize = Math.max(1, filters.pageSize ?? ENTITY_LIST_PAGE_SIZE)
  const baseEntities = await getEntities(
    filters.type && filters.type.length > 0 ? { type: filters.type } : undefined
  )
  const entities = filters.q?.trim()
    ? baseEntities.filter((entity) => matchesEntitySearch(entity, filters.q ?? ''))
    : baseEntities
  const total = entities.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages)
  const start = (page - 1) * pageSize

  return {
    entities: entities.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    summary: {
      totalContracts: entities.reduce((sum, entity) => sum + entity.totalContracts, 0),
      totalAlerts: entities.reduce((sum, entity) => sum + entity.activeAlerts, 0),
    },
  }
}

export async function getEntityById(id: string): Promise<Entity | null> {
  const escapedId = id.replace(/'/g, "''")
  const nameRows = await query<{ buyer_id: string; buyer_name: string }>(`
    SELECT DISTINCT buyer_id, buyer_name
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
        COUNT(DISTINCT a.id) AS total_awards,
        COALESCE(SUM(a.value_amount), 0) AS total_amount,
        COUNT(DISTINCT CASE
          WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
            OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
          THEN a.id END) AS direct_purchase_count
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE ${entityFilter}
        AND ${VALID_TENDER_YEAR_FILTER}
    `),

    query<{ year: number; amount: number }>(`
      SELECT
        EXTRACT(year FROM m."tender_tenderPeriod_startDate") AS year,
        COALESCE(SUM(a.value_amount), 0) AS amount
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE ${entityFilter}
        AND ${VALID_TENDER_YEAR_FILTER}
      GROUP BY 1
      ORDER BY 1
    `),
    getEntityActiveAlertCounts(),
  ])

  if (summaryRows.length === 0) return null

  const summary = summaryRows[0]
  const totalAwards = Number(summary.total_awards ?? 0)
  const totalAmount = Number(summary.total_amount ?? 0)
  const directPct =
    totalAwards > 0
      ? Math.round((Number(summary.direct_purchase_count ?? 0) / totalAwards) * 100)
      : 0

  const yearlyData = yearlyRows.map((row) => {
    const amount = Number(row.amount ?? 0)
    return {
      year: Number(row.year),
      amount,
      label:
        amount >= 1_000_000_000
          ? `${(amount / 1_000_000_000).toFixed(1)}B`
          : `${(amount / 1_000_000).toFixed(0)}M`,
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

export async function getEntitySuppliers(
  id: string,
  filters: EntitySuppliersFilters = {}
): Promise<PaginatedSuppliers> {
  const safeId = id.replace(/'/g, "''")
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * ENTITY_SUPPLIERS_PAGE_SIZE
  const searchClause = filters.q?.trim()
    ? `AND s.name ILIKE '%${filters.q.trim().replace(/'/g, "''")}%'`
    : ''

  const nameRows = await query<{ buyer_id: string; buyer_name: string }>(`
    SELECT DISTINCT buyer_id, buyer_name
    FROM main
    WHERE buyer_id = '${safeId}' OR buyer_name = '${safeId}'
    ORDER BY CASE WHEN buyer_id = '${safeId}' THEN 0 ELSE 1 END, buyer_name
    LIMIT 1
  `)
  if (nameRows.length === 0) {
    return {
      suppliers: [],
      total: 0,
      page,
      pageSize: ENTITY_SUPPLIERS_PAGE_SIZE,
      totalPages: 0,
    }
  }

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
      SELECT COUNT(DISTINCT COALESCE(s.id, s.name)) AS total
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE ${entityFilter}
        AND ${VALID_TENDER_YEAR_FILTER}
        ${searchClause}
    `),

    query<{
      supplier_id: string | null
      supplier_name: string
      contract_count: number
      total_amount: number
      single_bidder_count: number
    }>(`
      SELECT
        s.id AS supplier_id,
        s.name AS supplier_name,
        COUNT(DISTINCT a.id) AS contract_count,
        COALESCE(SUM(a.value_amount), 0) AS total_amount,
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END) AS single_bidder_count
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE ${entityFilter}
        AND ${VALID_TENDER_YEAR_FILTER}
        ${searchClause}
      GROUP BY s.id, s.name
      ORDER BY total_amount DESC
      LIMIT ${ENTITY_SUPPLIERS_PAGE_SIZE} OFFSET ${offset}
    `),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  const suppliers = supplierRows.map((row) => {
    const count = Number(row.contract_count ?? 0)
    const amount = Number(row.total_amount ?? 0)
    const singlePct = count > 0 ? Number(row.single_bidder_count ?? 0) / count : 0
    const supplierId = String(row.supplier_id ?? row.supplier_name).trim()

    return {
      id: `${buyerId}-${supplierId}`,
      supplierId,
      supplierName: row.supplier_name,
      supplierNit: supplierId ? getSupplierDisplayIdentifier(supplierId) : null,
      contractCount: count,
      totalAmount: amount,
      currency: 'GTQ',
      riskLevel: riskLevel(singlePct, amount),
    }
  })

  return {
    suppliers,
    total,
    page,
    pageSize: ENTITY_SUPPLIERS_PAGE_SIZE,
    totalPages: Math.ceil(total / ENTITY_SUPPLIERS_PAGE_SIZE),
  }
}
