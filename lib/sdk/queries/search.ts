import { query } from '@/lib/db'
import type { RiskLevel, SearchResult } from '../types'

interface SearchRow {
  type: string
  id: string
  name: string
  secondary: string
  risk_level: RiskLevel | null
  total_amount: number
}

function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

export async function search(q: string): Promise<SearchResult[]> {
  if (q.trim().length < 2) return []

  const term = q.trim()
  const lit = escapeLiteral(term)
  // Keep ILIKE fallback for short terms where trigrams are unreliable
  const likeAny = escapeLiteral(`%${term}%`)
  const likePrefix = escapeLiteral(`${term}%`)

  const rows = await query<SearchRow>(`
    WITH entities AS (
      SELECT
        'entity'                                                        AS type,
        m.buyer_id                                                      AS id,
        m.buyer_name                                                    AS name,
        COUNT(DISTINCT a.id)::text || ' adjudicaciones'                AS secondary,
        NULL::text                                                      AS risk_level,
        GREATEST(
          similarity(m.buyer_name, ${lit}),
          word_similarity(${lit}, m.buyer_name)
        )                                                               AS relevance,
        COALESCE(SUM(a.value_amount), 0)                                AS total_amount
      FROM main m
      JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
      WHERE (
        m.buyer_name ILIKE ${likeAny}
        OR m.buyer_id ILIKE ${likeAny}
        OR similarity(m.buyer_name, ${lit}) > 0.15
        OR word_similarity(${lit}, m.buyer_name) > 0.2
      )
        AND m.buyer_id IS NOT NULL
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
      GROUP BY m.buyer_id, m.buyer_name
      ORDER BY relevance DESC, total_amount DESC
      LIMIT 4
    ),

    suppliers AS (
      SELECT
        'supplier'                                                      AS type,
        s.id                                                            AS id,
        MAX(s.name)                                                     AS name,
        COUNT(DISTINCT a.id)::text || ' contratos'                     AS secondary,
        NULL::text                                                      AS risk_level,
        GREATEST(
          similarity(MAX(s.name), ${lit}),
          word_similarity(${lit}, MAX(s.name))
        )                                                               AS relevance,
        COALESCE(SUM(a.value_amount), 0)                                AS total_amount
      FROM awards_suppliers s
      JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
      JOIN main m   ON m.ocid = a.main_ocid
      WHERE (
        s.name ILIKE ${likeAny}
        OR s.id ILIKE ${likeAny}
        OR similarity(s.name, ${lit}) > 0.15
        OR word_similarity(${lit}, s.name) > 0.2
      )
        AND EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
      GROUP BY s.id
      ORDER BY relevance DESC, total_amount DESC
      LIMIT 4
    ),

    alerts AS (
      SELECT
        'alert'                                                         AS type,
        canonical_id                                                    AS id,
        buyer_name                                                      AS name,
        supplier_name                                                   AS secondary,
        risk_level                                                      AS risk_level,
        GREATEST(
          similarity(buyer_name, ${lit}),
          word_similarity(${lit}, buyer_name),
          similarity(supplier_name, ${lit}),
          word_similarity(${lit}, supplier_name)
        )                                                               AS relevance,
        total_amount                                                    AS total_amount
      FROM alert_pairs
      WHERE (
        buyer_name ILIKE ${likeAny}
        OR supplier_name ILIKE ${likeAny}
        OR buyer_id ILIKE ${likeAny}
        OR supplier_id ILIKE ${likeAny}
        OR similarity(buyer_name, ${lit}) > 0.15
        OR word_similarity(${lit}, buyer_name) > 0.2
        OR similarity(supplier_name, ${lit}) > 0.15
        OR word_similarity(${lit}, supplier_name) > 0.2
      )
      ORDER BY relevance DESC, risk_score DESC, total_amount DESC
      LIMIT 4
    ),

    combined AS (
      SELECT * FROM entities
      UNION ALL SELECT * FROM suppliers
      UNION ALL SELECT * FROM alerts
    )

    SELECT *
    FROM combined
    ORDER BY relevance DESC, total_amount DESC
    LIMIT 10
  `)

  return rows.map((row) => {
    const type = row.type as SearchResult['type']
    const id = String(row.id)
    const href =
      type === 'entity'   ? `/entidades/${encodeURIComponent(id)}` :
      type === 'supplier' ? `/proveedores/${encodeURIComponent(id)}` :
                            `/alertas/${encodeURIComponent(id)}`
    return {
      type,
      id,
      name: String(row.name),
      secondary: String(row.secondary),
      riskLevel: row.risk_level ?? null,
      href,
    }
  })
}
