import { query } from '@/lib/db'
import {
  buildRegistroMercantilUrl,
  getSupplierDisplayIdentifier,
} from '../supplier-identity'
import { supplierUrl } from '@/lib/guatecompras/urls'
import type {
  Alert,
  AlertListFilters,
  AlertDetail,
  PaginatedAlerts,
  RiskLevel,
  Signal,
  SignalType,
  SupplierAlert,
} from '../types'

const CURRENCY = 'GTQ'
const ALERTS_PAGE_SIZE = 20

const SIGNAL_META: Record<SignalType, { label: string; icon: string }> = {
  single_bidder:   { label: 'Proveedor único recurrente', icon: 'person_off' },
  short_deadline:  { label: 'Plazo imposible',            icon: 'timer_off' },
  direct_purchase: { label: 'Abuso compra directa',       icon: 'point_of_sale' },
  award_gap:       { label: 'Sin contrato formal',         icon: 'assignment_late' },
  failed_tenders:  { label: 'Alta tasa de desiertos',     icon: 'event_busy' },
}

const SIGNAL_PRIORITY: SignalType[] = [
  'single_bidder',
  'short_deadline',
  'direct_purchase',
  'award_gap',
  'failed_tenders',
]

// ── DB row shape ──────────────────────────────────────────────────────────────

interface AlertPairRow {
  canonical_id: string
  buyer_id: string
  buyer_name: string
  supplier_id: string
  supplier_name: string
  contract_count: number
  total_amount: number
  latest_year: number
  risk_score: number
  risk_level: RiskLevel
  primary_signal: SignalType
  has_single_bidder: boolean
  has_short_deadline: boolean
  has_direct_purchase: boolean
  has_award_gap: boolean
  has_failed_tenders: boolean
  single_bidder_count: number | null
  single_bidder_ratio: number | null
  sb_total_contracts: number | null
  sb_total_amount: number | null
  short_deadline_count: number | null
  sd_total_amount: number | null
  direct_count: number | null
  direct_ratio: number | null
  dp_total_awards: number | null
  dp_total_amount: number | null
  ag_total_awards: number | null
  ag_total_contracts: number | null
  gap_ratio: number | null
  ag_total_amount: number | null
  total_tenders: number | null
  failed_count: number | null
  failed_ratio: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function compactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Q${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `Q${(amount / 1_000_000).toFixed(1)}M`
  return `Q${Math.round(amount).toLocaleString('es-GT')}`
}

function ratioToPercent(ratio: number): string {
  return new Intl.NumberFormat('es-GT', { style: 'percent', maximumFractionDigits: 0 }).format(ratio)
}

function rowToAlert(row: AlertPairRow): Alert {
  return {
    id: row.canonical_id,
    entityId: String(row.buyer_id ?? '').trim(),
    entityName: String(row.buyer_name ?? '').trim(),
    riskLevel: row.risk_level,
    signalKey: row.primary_signal,
    signalType: SIGNAL_META[row.primary_signal]?.label ?? row.primary_signal,
    signalIcon: SIGNAL_META[row.primary_signal]?.icon ?? 'warning',
    year: String(row.latest_year),
    contractCount: Number(row.contract_count),
    totalAmount: Number(row.total_amount),
    currency: CURRENCY,
  }
}

function buildSignals(row: AlertPairRow): Signal[] {
  const signals: Signal[] = []

  if (row.has_single_bidder && row.single_bidder_count != null) {
    signals.push({
      id: `${row.buyer_id}::${row.supplier_id}::single_bidder`,
      type: 'single_bidder',
      title: `${ratioToPercent(Number(row.single_bidder_ratio))} de adjudicaciones con oferente único`,
      description: SIGNAL_META.single_bidder.label,
      icon: SIGNAL_META.single_bidder.icon,
      metrics: [
        { label: 'del total', value: ratioToPercent(Number(row.single_bidder_ratio)) },
        { label: 'contratos sin competencia', value: String(row.single_bidder_count) },
        { label: 'monto adjudicado', value: compactCurrency(Number(row.sb_total_amount)) },
      ],
    })
  }

  if (row.has_short_deadline && row.short_deadline_count != null) {
    signals.push({
      id: `${row.buyer_id}::${row.supplier_id}::short_deadline`,
      type: 'short_deadline',
      title: `${row.short_deadline_count} adjudicaciones con plazo menor a 72h`,
      description: SIGNAL_META.short_deadline.label,
      icon: SIGNAL_META.short_deadline.icon,
      metrics: [
        { label: 'procesos bajo 72h', value: String(row.short_deadline_count) },
        { label: 'monto adjudicado', value: compactCurrency(Number(row.sd_total_amount)) },
        { label: 'contratos del par', value: String(row.contract_count) },
      ],
    })
  }

  if (row.has_direct_purchase && row.direct_count != null) {
    signals.push({
      id: `${row.buyer_id}::${row.supplier_id}::direct_purchase`,
      type: 'direct_purchase',
      title: `${ratioToPercent(Number(row.direct_ratio))} de adjudicaciones vía Art. 43 o 54`,
      description: SIGNAL_META.direct_purchase.label,
      icon: SIGNAL_META.direct_purchase.icon,
      metrics: [
        { label: 'del total de adjudicaciones', value: ratioToPercent(Number(row.direct_ratio)) },
        { label: 'adjudicaciones por Art. 43/54', value: String(row.direct_count) },
        { label: 'monto adjudicado en la entidad', value: compactCurrency(Number(row.dp_total_amount)) },
      ],
    })
  }

  if (row.has_award_gap && row.gap_ratio != null) {
    signals.push({
      id: `${row.buyer_id}::${row.supplier_id}::award_gap`,
      type: 'award_gap',
      title: `${ratioToPercent(Number(row.gap_ratio))} de adjudicaciones sin contrato formal`,
      description: SIGNAL_META.award_gap.label,
      icon: SIGNAL_META.award_gap.icon,
      metrics: [
        { label: 'sin contrato formal', value: ratioToPercent(Number(row.gap_ratio)) },
        { label: 'adjudicaciones sin contrato', value: String(Math.max(Number(row.ag_total_awards) - Number(row.ag_total_contracts), 0)) },
        { label: 'monto adjudicado en la entidad', value: compactCurrency(Number(row.ag_total_amount)) },
      ],
    })
  }

  if (row.has_failed_tenders && row.failed_count != null) {
    signals.push({
      id: `${row.buyer_id}::${row.supplier_id}::failed_tenders`,
      type: 'failed_tenders',
      title: `${ratioToPercent(Number(row.failed_ratio))} de concursos desiertos o prescindidos`,
      description: SIGNAL_META.failed_tenders.label,
      icon: SIGNAL_META.failed_tenders.icon,
      metrics: [
        { label: 'de concursos evaluados', value: ratioToPercent(Number(row.failed_ratio)) },
        { label: 'concursos fallidos', value: String(row.failed_count) },
        { label: 'exposición del par', value: compactCurrency(Number(row.total_amount)) },
      ],
    })
  }

  // Return in priority order
  return SIGNAL_PRIORITY.map((s) => signals.find((sig) => sig.type === s)).filter((s): s is Signal => s != null)
}

function buildDescription(row: AlertPairRow): string {
  const activeSignals = SIGNAL_PRIORITY.filter((s) => row[`has_${s}` as keyof AlertPairRow])
  const labels = activeSignals.map((s) => SIGNAL_META[s].label)
  const joined = labels.length === 1
    ? labels[0]
    : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
  return `${row.supplier_name} acumula ${Number(row.contract_count).toLocaleString('es-GT')} adjudicaciones con ${row.buyer_name} y activa ${activeSignals.length} señal${activeSignals.length === 1 ? '' : 'es'} de riesgo: ${joined}.`
}

function parseAlertId(id: string): { buyerId: string; supplierId: string; signalType: SignalType } | null {
  const normalizedId = (() => { try { return decodeURIComponent(id) } catch { return id } })()
  const parts = normalizedId.split('::')
  if (parts.length !== 3) return null
  const [buyerId, supplierId, rawSignalType] = parts
  const validSignals = new Set<string>(SIGNAL_PRIORITY)
  if (!buyerId || !supplierId || !validSignals.has(rawSignalType)) return null
  return { buyerId, supplierId, signalType: rawSignalType as SignalType }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<Alert[]> {
  const rows = await query<AlertPairRow>(`
    SELECT * FROM alert_pairs
    ORDER BY risk_score DESC, total_amount DESC
  `)
  return rows.map(rowToAlert)
}

export async function getAlertsPage(filters: AlertListFilters = {}): Promise<PaginatedAlerts> {
  const pageSize = Math.max(1, filters.pageSize ?? ALERTS_PAGE_SIZE)
  const page = Math.max(1, filters.page ?? 1)
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  if (filters.signal && SIGNAL_PRIORITY.includes(filters.signal as SignalType))
    conditions.push(`has_${filters.signal} = true`)
  if (filters.year)    conditions.push(`latest_year = ${parseInt(filters.year, 10)}`)
  if (filters.entity)  conditions.push(`buyer_name ILIKE ${escapeLiteral(`%${filters.entity}%`)}`)

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [countRows, rows] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*) AS total FROM alert_pairs ${where}`),
    query<AlertPairRow>(`
      SELECT * FROM alert_pairs
      ${where}
      ORDER BY risk_score DESC, total_amount DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
  ])

  const total = Number(countRows[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    alerts: rows.map(rowToAlert),
    total,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
  }
}

export async function getAlertById(id: string): Promise<AlertDetail | null> {
  const parsed = parseAlertId(id)
  if (!parsed) return null

  const rows = await query<AlertPairRow>(`
    SELECT * FROM alert_pairs
    WHERE buyer_id = ${escapeLiteral(parsed.buyerId)}
      AND supplier_id = ${escapeLiteral(parsed.supplierId)}
    LIMIT 1
  `)

  const row = rows[0]
  if (!row) return null

  // The requested signal must be active on this pair
  const signalFlag = `has_${parsed.signalType}` as keyof AlertPairRow
  if (!row[signalFlag]) return null

  const supplierNit = getSupplierDisplayIdentifier(row.supplier_id)
  const isNitSupplier = row.supplier_id.trim().startsWith('GT-NIT-')

  return {
    id: row.canonical_id,
    entityId: String(row.buyer_id).trim(),
    entityName: String(row.buyer_name).trim(),
    description: buildDescription(row),
    riskScore: Number(row.risk_score),
    riskLevel: row.risk_level,
    signals: buildSignals(row),
    involvedSupplier: {
      id: row.supplier_id,
      name: row.supplier_name,
      nit: supplierNit,
      totalAwarded: Number(row.total_amount),
      year: Number(row.latest_year),
    },
    draftInvestigation: '',
    guatecomprasUrl: isNitSupplier ? supplierUrl(supplierNit) : undefined,
    registroMercantilUrl: buildRegistroMercantilUrl(row.supplier_id),
  }
}

export async function getActiveAlertCount(): Promise<number> {
  const rows = await query<{ total: number }>(`SELECT COUNT(*) AS total FROM alert_pairs`)
  return Number(rows[0]?.total ?? 0)
}

export async function getEntityActiveAlertCounts(): Promise<Map<string, number>> {
  const rows = await query<{ buyer_id: string; alert_count: number }>(`
    SELECT buyer_id, COUNT(*) AS alert_count
    FROM alert_pairs
    GROUP BY buyer_id
  `)
  return new Map(rows.map((r) => [String(r.buyer_id).trim(), Number(r.alert_count)]))
}

export async function getSupplierAlertsBySupplierId(supplierId: string): Promise<SupplierAlert[]> {
  const rows = await query<AlertPairRow>(`
    SELECT * FROM alert_pairs
    WHERE supplier_id = ${escapeLiteral(supplierId)}
    ORDER BY risk_score DESC
  `)
  return rows.map((row) => ({
    id: row.canonical_id,
    severity: row.risk_level,
    title: SIGNAL_META[row.primary_signal]?.label ?? row.primary_signal,
    description: `${row.buyer_name}: ${SIGNAL_PRIORITY.filter((s) => row[`has_${s}` as keyof AlertPairRow]).length} señal${SIGNAL_PRIORITY.filter((s) => row[`has_${s}` as keyof AlertPairRow]).length === 1 ? '' : 'es'} activas en ${Number(row.contract_count).toLocaleString('es-GT')} adjudicaciones.`,
    date: String(row.latest_year),
  }))
}
