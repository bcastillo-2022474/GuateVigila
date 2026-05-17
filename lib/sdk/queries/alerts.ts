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
const MAX_RISK_SCORE = 100
const ALERTS_PAGE_SIZE = 20

const SIGNAL_PRIORITY: SignalType[] = [
  'single_bidder',
  'short_deadline',
  'direct_purchase',
  'award_gap',
  'failed_tenders',
] as const

const SIGNAL_META: Record<
  SignalType,
  { label: string; icon: string; weight: number }
> = {
  single_bidder: {
    label: 'Proveedor único recurrente',
    icon: 'person_off',
    weight: 35,
  },
  short_deadline: {
    label: 'Plazo imposible',
    icon: 'timer_off',
    weight: 25,
  },
  direct_purchase: {
    label: 'Abuso compra directa',
    icon: 'point_of_sale',
    weight: 20,
  },
  award_gap: {
    label: 'Sin contrato formal',
    icon: 'assignment_late',
    weight: 10,
  },
  failed_tenders: {
    label: 'Alta tasa de desiertos',
    icon: 'event_busy',
    weight: 10,
  },
}

const SIGNAL_SET = new Set<SignalType>(SIGNAL_PRIORITY)

type PairSignalType = 'single_bidder' | 'short_deadline'
type EntitySignalType = 'direct_purchase' | 'award_gap' | 'failed_tenders'

interface AlertQueryFilters {
  buyerId?: string
  entity?: string  // buyer_name ILIKE search
  year?: string    // filter on latestYear (MAX of tender start year)
}

interface PairSummaryRow {
  buyer_id: string
  buyer_name: string
  supplier_id: string
  supplier_name: string
  contract_count: number
  total_amount: number
  latest_year: number
}

interface SingleBidderRow {
  buyer_id: string
  buyer_name: string
  supplier_id: string
  supplier_name: string
  total_contracts: number
  total_amount: number
  single_bidder_count: number
  single_bidder_ratio: number
}

interface ShortDeadlineRow {
  buyer_id: string
  buyer_name: string
  supplier_id: string
  supplier_name: string
  short_deadline_count: number
  total_amount: number
}

interface DirectPurchaseRow {
  buyer_id: string
  buyer_name: string
  total_awards: number
  direct_count: number
  direct_ratio: number
  total_amount: number
}

interface AwardGapRow {
  buyer_id: string
  buyer_name: string
  total_awards: number
  total_contracts: number
  gap_ratio: number
  total_amount: number
}

interface FailedTendersRow {
  buyer_id: string
  buyer_name: string
  total_tenders: number
  failed_count: number
  failed_ratio: number
}

interface PairSummary {
  buyerId: string
  buyerName: string
  supplierId: string
  supplierName: string
  contractCount: number
  totalAmount: number
  latestYear: number
}

interface SingleBidderEvidence {
  type: 'single_bidder'
  totalContracts: number
  totalAmount: number
  singleBidderCount: number
  singleBidderRatio: number
}

interface ShortDeadlineEvidence {
  type: 'short_deadline'
  shortDeadlineCount: number
  totalAmount: number
}

interface DirectPurchaseEvidence {
  type: 'direct_purchase'
  totalAwards: number
  directCount: number
  directRatio: number
  totalAmount: number
}

interface AwardGapEvidence {
  type: 'award_gap'
  totalAwards: number
  totalContracts: number
  gapRatio: number
  totalAmount: number
}

interface FailedTendersEvidence {
  type: 'failed_tenders'
  totalTenders: number
  failedCount: number
  failedRatio: number
}

type SignalEvidence =
  | SingleBidderEvidence
  | ShortDeadlineEvidence
  | DirectPurchaseEvidence
  | AwardGapEvidence
  | FailedTendersEvidence

interface PairAggregate {
  summary: PairSummary
  signals: Map<SignalType, SignalEvidence>
}

interface MaterializedAlert {
  alert: Alert
  canonicalId: string
  pairKey: string
  supplierId: string
  supplierName: string
  supplierNit: string
  riskScore: number
  riskLevel: RiskLevel
  signalKeys: SignalType[]
  signalDetails: Signal[]
  description: string
  involvedSupplierYear: number
}

interface AlertSnapshot {
  alerts: Alert[]
  alertsByCanonicalId: Map<string, MaterializedAlert>
  alertsByPairKey: Map<string, MaterializedAlert>
  entityAlertCounts: Map<string, number>
  supplierAlertSummaries: Map<string, SupplierAlert[]>
}

let alertSnapshotPromise: Promise<AlertSnapshot> | null = null
const buyerAlertSnapshotPromises = new Map<string, Promise<AlertSnapshot>>()

function escapeSqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function buildWhere(baseClauses: string[], filters: AlertQueryFilters): string {
  const clauses = [...baseClauses]
  if (filters.buyerId) {
    clauses.push(`m.buyer_id = ${escapeSqlLiteral(filters.buyerId)}`)
  }
  if (filters.entity) {
    clauses.push(`m.buyer_name ILIKE ${escapeSqlLiteral(`%${filters.entity}%`)}`)
  }
  return `WHERE ${clauses.join('\n  AND ')}`
}

function buildPairKey(buyerId: string, supplierId: string): string {
  return `${buyerId}::${supplierId}`
}

function buildAlertId(
  buyerId: string,
  supplierId: string,
  signalType: SignalType
): string {
  return `${buyerId}::${supplierId}::${signalType}`
}

function isSignalType(value: string): value is SignalType {
  return SIGNAL_SET.has(value as SignalType)
}

function getRiskLevel(riskScore: number): RiskLevel {
  if (riskScore >= 60) return 'critical'
  if (riskScore >= 40) return 'high'
  if (riskScore >= 20) return 'medium'
  return 'low'
}

function compactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Q${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `Q${(amount / 1_000_000).toFixed(1)}M`
  return `Q${Math.round(amount).toLocaleString('es-GT')}`
}

function ratioToPercent(ratio: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'percent',
    maximumFractionDigits,
  }).format(ratio)
}

function normalizePairSummaryRows(rows: PairSummaryRow[]): PairSummary[] {
  return rows
    .map((row) => ({
      buyerId: String(row.buyer_id ?? '').trim(),
      buyerName: String(row.buyer_name ?? '').trim(),
      supplierId: String(row.supplier_id ?? '').trim(),
      supplierName: String(row.supplier_name ?? '').trim(),
      contractCount: Number(row.contract_count ?? 0),
      totalAmount: Number(row.total_amount ?? 0),
      latestYear: Number(row.latest_year ?? 0),
    }))
    .filter(
      (row) =>
        row.buyerId &&
        row.buyerName &&
        row.supplierId &&
        row.supplierName &&
        row.contractCount > 0
    )
}

function parseAlertId(
  id: string
): { buyerId: string; supplierId: string; signalType: SignalType } | null {
  const normalizedId = (() => {
    try {
      return decodeURIComponent(id)
    } catch {
      return id
    }
  })()
  const parts = normalizedId.split('::')
  if (parts.length !== 3) return null

  const [buyerId, supplierId, rawSignalType] = parts
  if (!buyerId || !supplierId || !isSignalType(rawSignalType)) return null

  return { buyerId, supplierId, signalType: rawSignalType }
}

function selectPrimarySignal(signalKeys: SignalType[]): SignalType {
  return (
    SIGNAL_PRIORITY.find((signalType) => signalKeys.includes(signalType)) ??
    'failed_tenders'
  )
}

function getSignalTitle(
  evidence: SignalEvidence
): string {
  switch (evidence.type) {
    case 'single_bidder':
      return `${ratioToPercent(evidence.singleBidderRatio)} de adjudicaciones con oferente único`
    case 'short_deadline':
      return `${evidence.shortDeadlineCount} adjudicaciones con plazo menor a 72h`
    case 'direct_purchase':
      return `${ratioToPercent(evidence.directRatio)} de adjudicaciones vía Art. 43 o 54`
    case 'award_gap':
      return `${ratioToPercent(evidence.gapRatio)} de adjudicaciones sin contrato formal`
    case 'failed_tenders':
      return `${ratioToPercent(evidence.failedRatio)} de concursos desiertos o prescindidos`
  }
}

function getSignalMetrics(
  evidence: SignalEvidence,
  summary: PairSummary
): Signal['metrics'] {
  switch (evidence.type) {
    case 'single_bidder':
      return [
        {
          label: 'del total',
          value: ratioToPercent(evidence.singleBidderRatio),
        },
        {
          label: 'contratos sin competencia',
          value: String(evidence.singleBidderCount),
        },
        {
          label: 'monto adjudicado',
          value: compactCurrency(evidence.totalAmount),
        },
      ]
    case 'short_deadline':
      return [
        {
          label: 'procesos bajo 72h',
          value: String(evidence.shortDeadlineCount),
        },
        {
          label: 'monto adjudicado',
          value: compactCurrency(evidence.totalAmount),
        },
        {
          label: 'contratos del par',
          value: String(summary.contractCount),
        },
      ]
    case 'direct_purchase':
      return [
        {
          label: 'del total de adjudicaciones',
          value: ratioToPercent(evidence.directRatio),
        },
        {
          label: 'adjudicaciones por Art. 43/54',
          value: String(evidence.directCount),
        },
        {
          label: 'monto adjudicado en la entidad',
          value: compactCurrency(evidence.totalAmount),
        },
      ]
    case 'award_gap':
      return [
        {
          label: 'sin contrato formal',
          value: ratioToPercent(evidence.gapRatio),
        },
        {
          label: 'adjudicaciones sin contrato',
          value: String(Math.max(evidence.totalAwards - evidence.totalContracts, 0)),
        },
        {
          label: 'monto adjudicado en la entidad',
          value: compactCurrency(evidence.totalAmount),
        },
      ]
    case 'failed_tenders':
      return [
        {
          label: 'de concursos evaluados',
          value: ratioToPercent(evidence.failedRatio),
        },
        {
          label: 'concursos fallidos',
          value: String(evidence.failedCount),
        },
        {
          label: 'exposición del par',
          value: compactCurrency(summary.totalAmount),
        },
      ]
  }
}

function buildSignal(
  signalType: SignalType,
  evidence: SignalEvidence,
  summary: PairSummary
): Signal {
  return {
    id: buildAlertId(summary.buyerId, summary.supplierId, signalType),
    type: signalType,
    title: getSignalTitle(evidence),
    description: SIGNAL_META[signalType].label,
    icon: SIGNAL_META[signalType].icon,
    metrics: getSignalMetrics(evidence, summary),
  }
}

function buildAlertDescription(
  supplierName: string,
  entityName: string,
  summary: PairSummary,
  signalKeys: SignalType[]
): string {
  const labels = signalKeys.map((signalType) => SIGNAL_META[signalType].label)
  const signalCount = signalKeys.length
  const joinedLabels =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`

  return `${supplierName} acumula ${summary.contractCount.toLocaleString('es-GT')} adjudicaciones con ${entityName} y activa ${signalCount} señal${signalCount === 1 ? '' : 'es'} de riesgo: ${joinedLabels}.`
}

function compareAlerts(a: MaterializedAlert, b: MaterializedAlert): number {
  return (
    b.riskScore - a.riskScore ||
    b.alert.totalAmount - a.alert.totalAmount ||
    b.alert.contractCount - a.alert.contractCount ||
    a.alert.id.localeCompare(b.alert.id)
  )
}

async function runPairSummaryQuery(
  filters: AlertQueryFilters
): Promise<PairSummary[]> {
  const yearHaving = filters.year
    ? `HAVING MAX(EXTRACT(year FROM m."tender_tenderPeriod_startDate")) = ${parseInt(filters.year, 10)}`
    : ''
  const rows = await query<PairSummaryRow>(`
    SELECT
      m.buyer_id                                                   AS buyer_id,
      m.buyer_name                                                 AS buyer_name,
      s.id                                                         AS supplier_id,
      s.name                                                       AS supplier_name,
      COUNT(DISTINCT a.id)                                         AS contract_count,
      SUM(a.value_amount)                                          AS total_amount,
      MAX(EXTRACT(year FROM m."tender_tenderPeriod_startDate"))    AS latest_year
    FROM main m
    JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
    JOIN awards_suppliers s ON s.awards_id = a.id
    ${buildWhere(
      [
        'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000',
        'm.buyer_id IS NOT NULL',
        'm.buyer_name IS NOT NULL',
        's.id IS NOT NULL',
        's.name IS NOT NULL',
      ],
      filters
    )}
    GROUP BY m.buyer_id, m.buyer_name, s.id, s.name
    ${yearHaving}
  `)

  return normalizePairSummaryRows(rows)
}

async function runSingleBidderQuery(
  filters: AlertQueryFilters
): Promise<
  Array<
    SingleBidderEvidence & {
      buyerId: string
      supplierId: string
    }
  >
> {
  const rows = await query<SingleBidderRow>(`
    SELECT
      m.buyer_id                                                   AS buyer_id,
      m.buyer_name                                                 AS buyer_name,
      s.id                                                         AS supplier_id,
      s.name                                                       AS supplier_name,
      COUNT(DISTINCT a.id)                                         AS total_contracts,
      SUM(a.value_amount)                                          AS total_amount,
      COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                          THEN a.id END)                           AS single_bidder_count,
      (
        COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                            THEN a.id END)::double precision / COUNT(DISTINCT a.id)
      )                                                            AS single_bidder_ratio
    FROM main m
    JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
    JOIN awards_suppliers s ON s.awards_id = a.id
    ${buildWhere(
      [
        'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000',
        'm.buyer_id IS NOT NULL',
        'm.buyer_name IS NOT NULL',
        's.id IS NOT NULL',
        's.name IS NOT NULL',
      ],
      filters
    )}
    GROUP BY m.buyer_id, m.buyer_name, s.id, s.name
    HAVING COUNT(DISTINCT a.id) >= 5
       AND (
         COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                             THEN a.id END)::double precision / COUNT(DISTINCT a.id)
       ) >= 0.60
  `)

  return rows
    .map((row) => ({
      type: 'single_bidder' as const,
      buyerId: String(row.buyer_id ?? '').trim(),
      supplierId: String(row.supplier_id ?? '').trim(),
      totalContracts: Number(row.total_contracts ?? 0),
      totalAmount: Number(row.total_amount ?? 0),
      singleBidderCount: Number(row.single_bidder_count ?? 0),
      singleBidderRatio: Number(row.single_bidder_ratio ?? 0),
    }))
    .filter((row) => row.buyerId && row.supplierId && row.totalContracts > 0)
}

async function runShortDeadlineQuery(
  filters: AlertQueryFilters
): Promise<
  Array<
    ShortDeadlineEvidence & {
      buyerId: string
      supplierId: string
    }
  >
> {
  const rows = await query<ShortDeadlineRow>(`
    SELECT
      m.buyer_id                                                   AS buyer_id,
      m.buyer_name                                                 AS buyer_name,
      s.id                                                         AS supplier_id,
      s.name                                                       AS supplier_name,
      COUNT(DISTINCT a.id)                                         AS short_deadline_count,
      SUM(a.value_amount)                                          AS total_amount
    FROM main m
    JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
    JOIN awards_suppliers s ON s.awards_id = a.id
    ${buildWhere(
      [
        'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000',
        'EXTRACT(year FROM m."tender_tenderPeriod_endDate") > 2000',
        `(m."tender_tenderPeriod_endDate"::timestamp - m."tender_tenderPeriod_startDate"::timestamp) < INTERVAL '72 hours'`,
        'm.buyer_id IS NOT NULL',
        'm.buyer_name IS NOT NULL',
        's.id IS NOT NULL',
        's.name IS NOT NULL',
      ],
      filters
    )}
    GROUP BY m.buyer_id, m.buyer_name, s.id, s.name
    HAVING COUNT(DISTINCT a.id) >= 3
  `)

  return rows
    .map((row) => ({
      type: 'short_deadline' as const,
      buyerId: String(row.buyer_id ?? '').trim(),
      supplierId: String(row.supplier_id ?? '').trim(),
      shortDeadlineCount: Number(row.short_deadline_count ?? 0),
      totalAmount: Number(row.total_amount ?? 0),
    }))
    .filter((row) => row.buyerId && row.supplierId && row.shortDeadlineCount > 0)
}

async function runDirectPurchaseQuery(
  filters: AlertQueryFilters
): Promise<
  Array<
    DirectPurchaseEvidence & {
      buyerId: string
    }
  >
> {
  const rows = await query<DirectPurchaseRow>(`
    SELECT
      m.buyer_id                                                   AS buyer_id,
      m.buyer_name                                                 AS buyer_name,
      COUNT(DISTINCT a.id)                                         AS total_awards,
      COUNT(DISTINCT CASE
        WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
          OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
        THEN a.id END)                                             AS direct_count,
      (
        COUNT(DISTINCT CASE
          WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
            OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
          THEN a.id END)::double precision / COUNT(DISTINCT a.id)
      )                                                            AS direct_ratio,
      SUM(a.value_amount)                                          AS total_amount
    FROM main m
    JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
    ${buildWhere(
      [
        'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000',
        'm.buyer_id IS NOT NULL',
        'm.buyer_name IS NOT NULL',
      ],
      filters
    )}
    GROUP BY m.buyer_id, m.buyer_name
    HAVING COUNT(DISTINCT a.id) >= 20
       AND (
         COUNT(DISTINCT CASE
           WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
             OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
           THEN a.id END)::double precision / COUNT(DISTINCT a.id)
       ) >= 0.70
  `)

  return rows
    .map((row) => ({
      type: 'direct_purchase' as const,
      buyerId: String(row.buyer_id ?? '').trim(),
      totalAwards: Number(row.total_awards ?? 0),
      directCount: Number(row.direct_count ?? 0),
      directRatio: Number(row.direct_ratio ?? 0),
      totalAmount: Number(row.total_amount ?? 0),
    }))
    .filter((row) => row.buyerId && row.totalAwards > 0)
}

async function runAwardGapQuery(
  filters: AlertQueryFilters
): Promise<
  Array<
    AwardGapEvidence & {
      buyerId: string
    }
  >
> {
  const rows = await query<AwardGapRow>(`
    SELECT
      m.buyer_id                                                   AS buyer_id,
      m.buyer_name                                                 AS buyer_name,
      COUNT(DISTINCT a.id)                                         AS total_awards,
      COUNT(DISTINCT c.id)                                         AS total_contracts,
      (
        1.0 - COUNT(DISTINCT c.id)::double precision / COUNT(DISTINCT a.id)
      )                                                            AS gap_ratio,
      SUM(a.value_amount)                                          AS total_amount
    FROM main m
    JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
    LEFT JOIN contracts c ON c.main_ocid = m.ocid
    ${buildWhere(
      [
        'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000',
        'm.buyer_id IS NOT NULL',
        'm.buyer_name IS NOT NULL',
      ],
      filters
    )}
    GROUP BY m.buyer_id, m.buyer_name
    HAVING COUNT(DISTINCT a.id) >= 20
       AND (
         1.0 - COUNT(DISTINCT c.id)::double precision / COUNT(DISTINCT a.id)
       ) >= 0.85
  `)

  return rows
    .map((row) => ({
      type: 'award_gap' as const,
      buyerId: String(row.buyer_id ?? '').trim(),
      totalAwards: Number(row.total_awards ?? 0),
      totalContracts: Number(row.total_contracts ?? 0),
      gapRatio: Number(row.gap_ratio ?? 0),
      totalAmount: Number(row.total_amount ?? 0),
    }))
    .filter((row) => row.buyerId && row.totalAwards > 0)
}

async function runFailedTendersQuery(
  filters: AlertQueryFilters
): Promise<
  Array<
    FailedTendersEvidence & {
      buyerId: string
    }
  >
> {
  const rows = await query<FailedTendersRow>(`
    SELECT
      m.buyer_id                                                   AS buyer_id,
      m.buyer_name                                                 AS buyer_name,
      COUNT(*)                                                     AS total_tenders,
      SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
               THEN 1 ELSE 0 END)                                  AS failed_count,
      (
        SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
                 THEN 1 ELSE 0 END)::double precision / COUNT(*)
      )                                                            AS failed_ratio
    FROM main m
    ${buildWhere(
      [
        'EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000',
        'm.buyer_id IS NOT NULL',
        'm.buyer_name IS NOT NULL',
      ],
      filters
    )}
    GROUP BY m.buyer_id, m.buyer_name
    HAVING COUNT(*) >= 20
       AND (
         SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
                  THEN 1 ELSE 0 END)::double precision / COUNT(*)
       ) >= 0.50
  `)

  return rows
    .map((row) => ({
      type: 'failed_tenders' as const,
      buyerId: String(row.buyer_id ?? '').trim(),
      totalTenders: Number(row.total_tenders ?? 0),
      failedCount: Number(row.failed_count ?? 0),
      failedRatio: Number(row.failed_ratio ?? 0),
    }))
    .filter((row) => row.buyerId && row.totalTenders > 0)
}

async function buildAlertSnapshot(
  filters: AlertQueryFilters = {}
): Promise<AlertSnapshot> {
  const [
    pairSummaries,
    singleBidderRows,
    shortDeadlineRows,
    directPurchaseRows,
    awardGapRows,
    failedTenderRows,
  ] = await Promise.all([
    runPairSummaryQuery(filters),
    runSingleBidderQuery(filters),
    runShortDeadlineQuery(filters),
    runDirectPurchaseQuery(filters),
    runAwardGapQuery(filters),
    runFailedTendersQuery(filters),
  ])

  const pairsByKey = new Map<string, PairSummary>()
  const topPairByBuyer = new Map<string, string>()
  const nativeSuspiciousPairsByBuyer = new Map<string, Set<string>>()
  const aggregates = new Map<string, PairAggregate>()

  const sortedSummaries = [...pairSummaries].sort(
    (a, b) =>
      b.totalAmount - a.totalAmount ||
      b.contractCount - a.contractCount ||
      buildPairKey(a.buyerId, a.supplierId).localeCompare(
        buildPairKey(b.buyerId, b.supplierId)
      )
  )

  for (const summary of sortedSummaries) {
    const pairKey = buildPairKey(summary.buyerId, summary.supplierId)
    pairsByKey.set(pairKey, summary)

    if (!topPairByBuyer.has(summary.buyerId)) {
      topPairByBuyer.set(summary.buyerId, pairKey)
    }
  }

  function ensureAggregate(pairKey: string): PairAggregate | null {
    const summary = pairsByKey.get(pairKey)
    if (!summary) return null

    let aggregate = aggregates.get(pairKey)
    if (!aggregate) {
      aggregate = { summary, signals: new Map() }
      aggregates.set(pairKey, aggregate)
    }

    return aggregate
  }

  function addNativeSignal(
    buyerId: string,
    supplierId: string,
    signalType: PairSignalType,
    evidence: SignalEvidence
  ) {
    const pairKey = buildPairKey(buyerId, supplierId)
    const aggregate = ensureAggregate(pairKey)
    if (!aggregate) return

    aggregate.signals.set(signalType, evidence)

    let pairKeys = nativeSuspiciousPairsByBuyer.get(buyerId)
    if (!pairKeys) {
      pairKeys = new Set<string>()
      nativeSuspiciousPairsByBuyer.set(buyerId, pairKeys)
    }
    pairKeys.add(pairKey)
  }

  function getEntitySignalTargets(buyerId: string): string[] {
    const nativePairs = nativeSuspiciousPairsByBuyer.get(buyerId)
    if (nativePairs && nativePairs.size > 0) {
      return [...nativePairs]
    }

    const seededPair = topPairByBuyer.get(buyerId)
    return seededPair ? [seededPair] : []
  }

  function addEntitySignal(
    buyerId: string,
    signalType: EntitySignalType,
    evidence: SignalEvidence
  ) {
    for (const pairKey of getEntitySignalTargets(buyerId)) {
      const aggregate = ensureAggregate(pairKey)
      if (!aggregate) continue
      aggregate.signals.set(signalType, evidence)
    }
  }

  for (const row of singleBidderRows) {
    addNativeSignal(row.buyerId, row.supplierId, 'single_bidder', row)
  }

  for (const row of shortDeadlineRows) {
    addNativeSignal(row.buyerId, row.supplierId, 'short_deadline', row)
  }

  for (const row of directPurchaseRows) {
    addEntitySignal(row.buyerId, 'direct_purchase', row)
  }

  for (const row of awardGapRows) {
    addEntitySignal(row.buyerId, 'award_gap', row)
  }

  for (const row of failedTenderRows) {
    addEntitySignal(row.buyerId, 'failed_tenders', row)
  }

  const materializedAlerts = [...aggregates.entries()]
    .map(([pairKey, aggregate]): MaterializedAlert | null => {
      const signalKeys = [...aggregate.signals.keys()].sort(
        (a, b) => SIGNAL_PRIORITY.indexOf(a) - SIGNAL_PRIORITY.indexOf(b)
      )
      if (signalKeys.length === 0) return null

      const primarySignal = selectPrimarySignal(signalKeys)
      const riskScore = Math.min(
        signalKeys.reduce((total, signalType) => total + SIGNAL_META[signalType].weight, 0),
        MAX_RISK_SCORE
      )
      const riskLevel = getRiskLevel(riskScore)
      const signalDetails = signalKeys.map((signalType) =>
        buildSignal(signalType, aggregate.signals.get(signalType)!, aggregate.summary)
      )
      const canonicalId = buildAlertId(
        aggregate.summary.buyerId,
        aggregate.summary.supplierId,
        primarySignal
      )
      const description = buildAlertDescription(
        aggregate.summary.supplierName,
        aggregate.summary.buyerName,
        aggregate.summary,
        signalKeys
      )

      return {
        alert: {
          id: canonicalId,
          entityId: aggregate.summary.buyerId,
          entityName: aggregate.summary.buyerName,
          riskLevel,
          signalKey: primarySignal,
          signalType: SIGNAL_META[primarySignal].label,
          signalIcon: SIGNAL_META[primarySignal].icon,
          year: String(aggregate.summary.latestYear),
          contractCount: aggregate.summary.contractCount,
          totalAmount: aggregate.summary.totalAmount,
          currency: CURRENCY,
        },
        canonicalId,
        pairKey,
        supplierId: aggregate.summary.supplierId,
        supplierName: aggregate.summary.supplierName,
        supplierNit: getSupplierDisplayIdentifier(aggregate.summary.supplierId),
        riskScore,
        riskLevel,
        signalKeys,
        signalDetails,
        description,
        involvedSupplierYear: aggregate.summary.latestYear,
      }
    })
    .filter((alert): alert is MaterializedAlert => alert !== null)
    .sort(compareAlerts)

  const alertsByCanonicalId = new Map<string, MaterializedAlert>()
  const alertsByPairKey = new Map<string, MaterializedAlert>()
  const entityAlertCounts = new Map<string, number>()
  const supplierAlertSummaries = new Map<string, SupplierAlert[]>()

  for (const item of materializedAlerts) {
    alertsByCanonicalId.set(item.canonicalId, item)
    alertsByPairKey.set(item.pairKey, item)
    entityAlertCounts.set(
      item.alert.entityId,
      (entityAlertCounts.get(item.alert.entityId) ?? 0) + 1
    )

    const supplierAlerts = supplierAlertSummaries.get(item.supplierId) ?? []
    supplierAlerts.push({
      id: item.alert.id,
      severity: item.riskLevel,
      title: item.alert.signalType,
      description: `${item.alert.entityName}: ${item.signalKeys.length} señal${item.signalKeys.length === 1 ? '' : 'es'} activas en ${item.alert.contractCount.toLocaleString('es-GT')} adjudicaciones.`,
      date: item.alert.year,
    })
    supplierAlertSummaries.set(item.supplierId, supplierAlerts)
  }

  return {
    alerts: materializedAlerts.map((item) => item.alert),
    alertsByCanonicalId,
    alertsByPairKey,
    entityAlertCounts,
    supplierAlertSummaries,
  }
}

async function getCachedAlertSnapshot(): Promise<AlertSnapshot> {
  if (!alertSnapshotPromise) {
    alertSnapshotPromise = buildAlertSnapshot().catch((error) => {
      alertSnapshotPromise = null
      throw error
    })
  }
  return alertSnapshotPromise
}

async function getCachedBuyerAlertSnapshot(buyerId: string): Promise<AlertSnapshot> {
  const cachedSnapshot = buyerAlertSnapshotPromises.get(buyerId)
  if (cachedSnapshot) return cachedSnapshot

  const snapshotPromise = buildAlertSnapshot({ buyerId }).catch((error) => {
    buyerAlertSnapshotPromises.delete(buyerId)
    throw error
  })

  buyerAlertSnapshotPromises.set(buyerId, snapshotPromise)
  return snapshotPromise
}

export async function getAlerts(): Promise<Alert[]> {
  const snapshot = await getCachedAlertSnapshot()
  return snapshot.alerts
}

export async function getAlertsPage(
  filters: AlertListFilters = {}
): Promise<PaginatedAlerts> {
  const queryFilters: AlertQueryFilters = {
    entity: filters.entity || undefined,
    year: filters.year || undefined,
  }
  const snapshot = await buildAlertSnapshot(queryFilters)

  // Signal type is derived post-materialization so it can't be pushed to SQL
  const filteredAlerts = filters.signal
    ? snapshot.alerts.filter((alert) => alert.signalKey === filters.signal)
    : snapshot.alerts

  const pageSize = Math.max(1, filters.pageSize ?? ALERTS_PAGE_SIZE)
  const total = filteredAlerts.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages)
  const start = (page - 1) * pageSize

  return {
    alerts: filteredAlerts.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getAlertById(id: string): Promise<AlertDetail | null> {
  const parsed = parseAlertId(id)
  if (!parsed) return null

  const snapshot = await getCachedBuyerAlertSnapshot(parsed.buyerId)
  const pairKey = buildPairKey(parsed.buyerId, parsed.supplierId)
  const materializedAlert = snapshot.alertsByPairKey.get(pairKey)

  if (!materializedAlert || !materializedAlert.signalKeys.includes(parsed.signalType)) {
    return null
  }

  return {
    id: materializedAlert.canonicalId,
    entityId: materializedAlert.alert.entityId,
    entityName: materializedAlert.alert.entityName,
    description: materializedAlert.description,
    riskScore: materializedAlert.riskScore,
    riskLevel: materializedAlert.riskLevel,
    signals: materializedAlert.signalDetails,
    involvedSupplier: {
      id: materializedAlert.supplierId,
      name: materializedAlert.supplierName,
      nit: materializedAlert.supplierNit,
      totalAwarded: materializedAlert.alert.totalAmount,
      year: materializedAlert.involvedSupplierYear,
    },
    draftInvestigation: '',
    guatecomprasUrl: supplierUrl(materializedAlert.supplierNit),
    registroMercantilUrl: buildRegistroMercantilUrl(materializedAlert.supplierId),
  }
}

export async function getActiveAlertCount(): Promise<number> {
  const snapshot = await getCachedAlertSnapshot()
  return snapshot.alerts.length
}

export async function getEntityActiveAlertCounts(): Promise<Map<string, number>> {
  const snapshot = await getCachedAlertSnapshot()
  return snapshot.entityAlertCounts
}

export async function getSupplierAlertsBySupplierId(
  supplierId: string
): Promise<SupplierAlert[]> {
  const snapshot = await getCachedAlertSnapshot()
  return snapshot.supplierAlertSummaries.get(supplierId) ?? []
}
