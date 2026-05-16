import type { Entity, EntityFilters, EntityListItem, RiskLevel } from '../types'
import { query } from '@/lib/db'

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

export async function getEntities(filters?: EntityFilters): Promise<EntityListItem[]> {
  const rows = await query<{
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
      SUM(a.value_amount)                                         AS total_amount,
      COUNT(DISTINCT CASE WHEN m.tender_numberOfTenderers = 1
                          THEN a.id END)                          AS single_bidder_count
    FROM main m
    JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
    WHERE m.buyer_name IS NOT NULL
    GROUP BY m.buyer_id, m.buyer_name
    ORDER BY total_amount DESC
    LIMIT 200
  `)

  const mapped = rows.map((r) => {
    const amount = Number(r.total_amount)
    const awards = Number(r.total_awards)
    const singlePct = awards > 0 ? Number(r.single_bidder_count) / awards : 0

    return {
      id: String(r.buyer_id ?? r.buyer_name),
      name: r.buyer_name,
      shortName: shortName(r.buyer_name),
      type: inferType(r.buyer_name),
      totalContracts: awards,
      totalAmount: amount,
      currency: 'GTQ',
      activeAlerts: 0,
      riskLevel: riskLevel(singlePct, amount),
    }
  })

  if (filters?.type && filters.type.length > 0) {
    const allowed = new Set(filters.type)
    return mapped.filter((e) => allowed.has(e.type))
  }

  return mapped
}

export async function getEntityById(id: string): Promise<Entity | null> {
  // Resolve buyer_name from buyer_id (id may be the raw buyer_id value)
  const nameRows = await query<{ buyer_name: string }>(`
    SELECT DISTINCT buyer_name
    FROM main
    WHERE buyer_id = '${id.replace(/'/g, "''")}'
       OR buyer_name = '${id.replace(/'/g, "''")}'
    LIMIT 1
  `)
  if (nameRows.length === 0) return null
  const buyerName = nameRows[0].buyer_name
  const safeName = buyerName.replace(/'/g, "''")

  const [summaryRows, yearlyRows, supplierRows] = await Promise.all([
    // Summary stats
    query<{
      total_awards: number
      total_amount: number
      direct_purchase_count: number
      active_alerts: number
    }>(`
      SELECT
        COUNT(DISTINCT a.id)                                           AS total_awards,
        SUM(a.value_amount)                                            AS total_amount,
        COUNT(DISTINCT CASE
          WHEN m.tender_procurementMethodDetails ILIKE '%Art. 43%'
            OR m.tender_procurementMethodDetails ILIKE '%Art. 54%'
          THEN a.id END)                                               AS direct_purchase_count,
        0                                                              AS active_alerts
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE m.buyer_name = '${safeName}'
    `),

    // Yearly breakdown
    query<{ year: number; amount: number }>(`
      SELECT
        year(m.tender_tenderPeriod_startDate)   AS year,
        SUM(a.value_amount)                     AS amount
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE m.buyer_name = '${safeName}'
        AND year(m.tender_tenderPeriod_startDate) > 2000
      GROUP BY 1
      ORDER BY 1
    `),

    // Top 20 suppliers
    query<{
      supplier_id: string
      supplier_name: string
      contract_count: number
      total_amount: number
      single_bidder_count: number
    }>(`
      SELECT
        s.id                                                           AS supplier_id,
        s.name                                                         AS supplier_name,
        COUNT(DISTINCT a.id)                                           AS contract_count,
        SUM(a.value_amount)                                            AS total_amount,
        COUNT(DISTINCT CASE WHEN m.tender_numberOfTenderers = 1
                            THEN a.id END)                             AS single_bidder_count
      FROM main m
      JOIN awards a    ON a.main_ocid = m.ocid AND a.status = 'active'
      JOIN awards_suppliers s ON s.awards_id = a.id
      WHERE m.buyer_name = '${safeName}'
      GROUP BY s.id, s.name
      ORDER BY total_amount DESC
      LIMIT 20
    `),
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

  const topSuppliers = supplierRows.map((r) => {
    const count = Number(r.contract_count)
    const amt = Number(r.total_amount)
    const singlePct = count > 0 ? Number(r.single_bidder_count) / count : 0
    return {
      id: `${id}-${r.supplier_id}`,
      supplierId: String(r.supplier_id),
      supplierName: r.supplier_name,
      contractCount: count,
      totalAmount: amt,
      currency: 'GTQ',
      riskLevel: riskLevel(singlePct, amt),
    }
  })

  return {
    id,
    name: buyerName,
    shortName: shortName(buyerName),
    totalContracts: totalAwards,
    totalAmount,
    currency: 'GTQ',
    directPurchasePercentage: directPct,
    activeAlerts: 0,
    yearlyData,
    topSuppliers,
  }
}
