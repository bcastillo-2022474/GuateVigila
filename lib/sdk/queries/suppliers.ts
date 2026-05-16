import { query } from '@/lib/db'
import type {
  PaginatedSupplierList,
  PaginatedSupplierContracts,
  RiskLevel,
  Supplier,
  SupplierContractsFilters,
  SupplierListFilters,
  SupplierListItem,
} from '../types'
import {
  buildRegistroMercantilUrl,
  getSupplierDisplayIdentifier,
} from '../supplier-identity'
import { getSupplierAlertsBySupplierId } from './alerts'

const VALID_TENDER_YEAR_FILTER =
  'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000'
const SUPPLIER_LIST_PAGE_SIZE = 25
const SUPPLIER_CONTRACTS_PAGE_SIZE = 15

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

interface SupplierListRow {
  supplier_id: string
  supplier_name: string
  total_awards: number
  total_amount: number
  client_entities: number
  single_bidder_count: number
}

interface SupplierAssociateRow {
  associate_id: string | null
  associate_name: string | null
  shared_tenders: number
  shared_buyers: number
}

interface SupplierIndustryRow {
  classification_id: string | number | null
}

const UNSPSC_SEGMENT_LABELS: Record<string, string> = {
  '10': 'Agropecuario y alimentos primarios',
  '11': 'Materias primas y fibras',
  '12': 'Químicos y compuestos industriales',
  '14': 'Papel e impresos',
  '15': 'Combustibles y lubricantes',
  '25': 'Vehículos y transporte',
  '26': 'Energía y sistemas eléctricos',
  '27': 'Herramientas y maquinaria general',
  '30': 'Construcción e infraestructura',
  '31': 'Suministros industriales',
  '39': 'Material eléctrico e iluminación',
  '40': 'Climatización y ventilación',
  '41': 'Laboratorio y medición',
  '42': 'Equipo médico y sanitario',
  '43': 'Tecnología y telecomunicaciones',
  '44': 'Oficina e impresión',
  '46': 'Seguridad y defensa',
  '47': 'Recreación y deporte',
  '50': 'Alimentos y bebidas',
  '51': 'Medicamentos y farmacéuticos',
  '52': 'Mobiliario y menaje',
  '53': 'Textiles, ropa y calzado',
  '56': 'Mobiliario institucional',
  '60': 'Material educativo y recreativo',
  '72': 'Construcción y mantenimiento',
  '80': 'Servicios profesionales y administrativos',
  '81': 'Ingeniería, investigación y consultoría',
  '82': 'Servicios editoriales y diseño',
  '85': 'Servicios de salud',
  '93': 'Servicios comunitarios e institucionales',
}

function mapSupplierRow(row: SupplierListRow): SupplierListItem {
  const totalContracts = Number(row.total_awards ?? 0)
  const totalAmount = Number(row.total_amount ?? 0)
  const singleBidderCount = Number(row.single_bidder_count ?? 0)
  const singleBidderPercentage =
    totalContracts > 0 ? Math.round((singleBidderCount / totalContracts) * 100) : 0
  const supplierId = String(row.supplier_id ?? '').trim()

  return {
    id: supplierId,
    name: String(row.supplier_name ?? supplierId),
    nit: getSupplierDisplayIdentifier(supplierId),
    industry: 'Pendiente de clasificación',
    totalContracts,
    totalAwarded: totalAmount,
    currency: 'GTQ',
    clientEntities: Number(row.client_entities ?? 0),
    riskLevel: riskLevel(singleBidderPercentage / 100, totalAmount),
    singleBidderPercentage,
  }
}

function buildSupplierSearchClause(rawQuery?: string): string {
  const query = rawQuery?.trim()
  if (!query) return ''

  const escaped = query.replace(/'/g, "''")
  return `
    AND (
      s.id ILIKE '%${escaped}%'
      OR s.name ILIKE '%${escaped}%'
    )
  `
}

function inferIndustry(classificationId: string | number | null | undefined): string {
  const normalized = String(classificationId ?? '').trim()
  if (!normalized) return 'Pendiente de clasificación'

  return UNSPSC_SEGMENT_LABELS[normalized.slice(0, 2)] ?? 'Pendiente de clasificación'
}

export async function getSuppliers(): Promise<SupplierListItem[]> {
  const rows = await query<SupplierListRow>(`
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
    WHERE s.id IS NOT NULL
      AND s.name IS NOT NULL
      AND ${VALID_TENDER_YEAR_FILTER}
    GROUP BY s.id
    ORDER BY total_amount DESC, total_awards DESC, supplier_name ASC
  `)

  return rows.map(mapSupplierRow)
}

export async function getSuppliersPage(
  filters: SupplierListFilters = {}
): Promise<PaginatedSupplierList> {
  const pageSize = Math.max(1, filters.pageSize ?? SUPPLIER_LIST_PAGE_SIZE)
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * pageSize
  const searchClause = buildSupplierSearchClause(filters.q)
  const baseCte = `
    WITH supplier_stats AS (
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
      WHERE s.id IS NOT NULL
        AND s.name IS NOT NULL
        AND ${VALID_TENDER_YEAR_FILTER}
        ${searchClause}
      GROUP BY s.id
    )
  `

  const [summaryRows, rows] = await Promise.all([
    query<{
      total: number
      total_contracts: number
      high_risk_suppliers: number
    }>(`
      ${baseCte}
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(total_awards), 0) AS total_contracts,
        COUNT(*) FILTER (
          WHERE
            (
              CASE
                WHEN total_awards > 0
                  THEN single_bidder_count::double precision / total_awards
                ELSE 0
              END
            ) > 0.7
            OR total_amount > 1000000000
        ) AS high_risk_suppliers
      FROM supplier_stats
    `),
    query<SupplierListRow>(`
      ${baseCte}
      SELECT
        supplier_id,
        supplier_name,
        total_awards,
        total_amount,
        client_entities,
        single_bidder_count
      FROM supplier_stats
      ORDER BY total_amount DESC, total_awards DESC, supplier_name ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
  ])

  const total = Number(summaryRows[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  if (safePage !== page) {
    return getSuppliersPage({
      ...filters,
      page: safePage,
      pageSize,
    })
  }

  return {
    suppliers: rows.map(mapSupplierRow),
    total,
    page: safePage,
    pageSize,
    totalPages,
    summary: {
      totalContracts: Number(summaryRows[0]?.total_contracts ?? 0),
      highRiskSuppliers: Number(summaryRows[0]?.high_risk_suppliers ?? 0),
    },
  }
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const escapedId = id.replace(/'/g, "''")
  const [summaryRows, yearlyRows, associateRows, industryRows, alerts] = await Promise.all([
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
    query<SupplierAssociateRow>(`
      SELECT
        s2.id AS associate_id,
        MAX(s2.name) AS associate_name,
        COUNT(DISTINCT m.ocid) AS shared_tenders,
        COUNT(DISTINCT m.buyer_id) AS shared_buyers
      FROM awards_suppliers s1
      JOIN awards a1 ON a1.id = s1.awards_id AND a1.status = 'active'
      JOIN main m ON m.ocid = a1.main_ocid
      JOIN awards a2 ON a2.main_ocid = m.ocid AND a2.status = 'active'
      JOIN awards_suppliers s2 ON s2.awards_id = a2.id AND s2.id != '${escapedId}'
      WHERE s1.id = '${escapedId}'
        AND ${VALID_TENDER_YEAR_FILTER}
      GROUP BY s2.id
      ORDER BY shared_tenders DESC, associate_name ASC
      LIMIT 10
    `),
    query<SupplierIndustryRow>(`
      SELECT
        ti.classification_id AS classification_id
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m ON m.ocid = a.main_ocid
      JOIN tender_items ti ON ti.main_ocid = m.ocid
      WHERE s.id = '${escapedId}'
        AND ${VALID_TENDER_YEAR_FILTER}
        AND ti.classification_scheme = 'UNSPSC'
        AND ti.classification_id IS NOT NULL
      GROUP BY ti.classification_id
      ORDER BY COUNT(DISTINCT m.ocid) DESC, ti.classification_id
      LIMIT 1
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
    industry: inferIndustry(industryRows[0]?.classification_id),
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
    associates: associateRows
      .map((row) => {
        const associateId = String(row.associate_id ?? '').trim()
        const associateName = String(row.associate_name ?? '').trim()
        const sharedTenders = Number(row.shared_tenders ?? 0)
        const sharedBuyers = Number(row.shared_buyers ?? 0)

        if (!associateId || !associateName || sharedTenders <= 0) return null

        return {
          id: associateId,
          name: associateName,
          role: 'Co-ganador frecuente',
          participation: `${sharedTenders} proceso${sharedTenders === 1 ? '' : 's'} compartido${sharedTenders === 1 ? '' : 's'}`,
          otherCompanies: sharedBuyers,
        }
      })
      .filter((associate): associate is Supplier['associates'][number] => associate !== null),
    registroMercantilUrl: buildRegistroMercantilUrl(supplierId),
  }
}

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
  const offset = (page - 1) * SUPPLIER_CONTRACTS_PAGE_SIZE
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
      LIMIT ${SUPPLIER_CONTRACTS_PAGE_SIZE} OFFSET ${offset}
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
    pageSize: SUPPLIER_CONTRACTS_PAGE_SIZE,
    totalPages: Math.ceil(total / SUPPLIER_CONTRACTS_PAGE_SIZE),
  }
}
