-- Materialized view that replicates the JS alert snapshot logic in pure SQL.
-- Single source of truth for all alert queries, entity alert counts,
-- supplier alert summaries, and omnisearch.
--
-- Signal weights:  single_bidder=35, short_deadline=25, direct_purchase=20,
--                  award_gap=10, failed_tenders=10  (max 100)
-- Primary signal priority: single_bidder > short_deadline > direct_purchase
--                          > award_gap > failed_tenders

DROP MATERIALIZED VIEW IF EXISTS alert_pairs;

CREATE MATERIALIZED VIEW alert_pairs AS

WITH

-- ── Pair-level summary ────────────────────────────────────────────────────────
pair_summary AS (
  SELECT
    m.buyer_id,
    m.buyer_name,
    s.id                                                          AS supplier_id,
    MAX(s.name)                                                   AS supplier_name,
    COUNT(DISTINCT a.id)                                          AS contract_count,
    COALESCE(SUM(a.value_amount), 0)                              AS total_amount,
    MAX(EXTRACT(year FROM m."tender_tenderPeriod_startDate"))     AS latest_year
  FROM main m
  JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
  JOIN awards_suppliers s ON s.awards_id = a.id
  WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    AND m.buyer_id   IS NOT NULL
    AND m.buyer_name IS NOT NULL
    AND s.id         IS NOT NULL
  GROUP BY m.buyer_id, m.buyer_name, s.id
),

-- ── Pair-level signals ────────────────────────────────────────────────────────
single_bidder_pairs AS (
  SELECT
    m.buyer_id,
    s.id                                                          AS supplier_id,
    COUNT(DISTINCT a.id)                                          AS total_contracts,
    COALESCE(SUM(a.value_amount), 0)                              AS total_amount,
    COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                        THEN a.id END)                            AS single_bidder_count,
    COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                        THEN a.id END)::double precision
      / COUNT(DISTINCT a.id)                                      AS single_bidder_ratio
  FROM main m
  JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
  JOIN awards_suppliers s ON s.awards_id = a.id
  WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    AND m.buyer_id IS NOT NULL
    AND s.id       IS NOT NULL
  GROUP BY m.buyer_id, s.id
  HAVING COUNT(DISTINCT a.id) >= 5
     AND COUNT(DISTINCT CASE WHEN m."tender_numberOfTenderers" = 1
                             THEN a.id END)::double precision
          / COUNT(DISTINCT a.id) >= 0.60
),

short_deadline_pairs AS (
  SELECT
    m.buyer_id,
    s.id                                                          AS supplier_id,
    COUNT(DISTINCT a.id)                                          AS short_deadline_count,
    COALESCE(SUM(a.value_amount), 0)                              AS total_amount
  FROM main m
  JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
  JOIN awards_suppliers s ON s.awards_id = a.id
  WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    AND EXTRACT(year FROM m."tender_tenderPeriod_endDate")   > 2000
    AND (m."tender_tenderPeriod_endDate"::timestamp
         - m."tender_tenderPeriod_startDate"::timestamp) < INTERVAL '72 hours'
    AND m.buyer_id IS NOT NULL
    AND s.id       IS NOT NULL
  GROUP BY m.buyer_id, s.id
  HAVING COUNT(DISTINCT a.id) >= 3
),

-- ── Entity-level signals ──────────────────────────────────────────────────────
direct_purchase_buyers AS (
  SELECT
    m.buyer_id,
    COUNT(DISTINCT a.id)                                          AS total_awards,
    COUNT(DISTINCT CASE
      WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
        OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
      THEN a.id END)                                              AS direct_count,
    COUNT(DISTINCT CASE
      WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
        OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
      THEN a.id END)::double precision
      / COUNT(DISTINCT a.id)                                      AS direct_ratio,
    COALESCE(SUM(a.value_amount), 0)                              AS total_amount
  FROM main m
  JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
  WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    AND m.buyer_id IS NOT NULL
  GROUP BY m.buyer_id
  HAVING COUNT(DISTINCT a.id) >= 20
     AND COUNT(DISTINCT CASE
           WHEN m."tender_procurementMethodDetails" ILIKE '%Art. 43%'
             OR m."tender_procurementMethodDetails" ILIKE '%Art. 54%'
           THEN a.id END)::double precision
          / COUNT(DISTINCT a.id) >= 0.70
),

award_gap_buyers AS (
  SELECT
    m.buyer_id,
    COUNT(DISTINCT a.id)                                          AS total_awards,
    COUNT(DISTINCT c.id)                                          AS total_contracts,
    1.0 - COUNT(DISTINCT c.id)::double precision
          / COUNT(DISTINCT a.id)                                  AS gap_ratio,
    COALESCE(SUM(a.value_amount), 0)                              AS total_amount
  FROM main m
  JOIN awards a   ON a.main_ocid = m.ocid AND a.status = 'active'
  LEFT JOIN contracts c ON c.main_ocid = m.ocid
  WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    AND m.buyer_id IS NOT NULL
  GROUP BY m.buyer_id
  HAVING COUNT(DISTINCT a.id) >= 20
     AND 1.0 - COUNT(DISTINCT c.id)::double precision
               / COUNT(DISTINCT a.id) >= 0.85
),

failed_tenders_buyers AS (
  SELECT
    m.buyer_id,
    COUNT(*)                                                      AS total_tenders,
    SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
             THEN 1 ELSE 0 END)                                   AS failed_count,
    SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
             THEN 1 ELSE 0 END)::double precision / COUNT(*)      AS failed_ratio
  FROM main m
  WHERE EXTRACT(year FROM m."tender_tenderPeriod_startDate") > 2000
    AND m.buyer_id IS NOT NULL
  GROUP BY m.buyer_id
  HAVING COUNT(*) >= 20
     AND SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
                  THEN 1 ELSE 0 END)::double precision
          / COUNT(*) >= 0.50
),

-- ── Determine which pairs get entity signals ──────────────────────────────────
-- A pair gets entity signals if it has at least one native signal (single_bidder
-- or short_deadline). If no native-signal pairs exist for a buyer, the entity
-- signals fall to that buyer's top pair by total_amount.
native_signal_pairs AS (
  SELECT DISTINCT buyer_id, supplier_id FROM single_bidder_pairs
  UNION
  SELECT DISTINCT buyer_id, supplier_id FROM short_deadline_pairs
),

top_pair_per_buyer AS (
  SELECT DISTINCT ON (buyer_id)
    buyer_id,
    supplier_id
  FROM pair_summary
  ORDER BY buyer_id, total_amount DESC
),

entity_signal_targets AS (
  -- Buyers that have native pairs → use those pairs
  SELECT n.buyer_id, n.supplier_id
  FROM native_signal_pairs n
  UNION
  -- Buyers without native pairs → use top pair, but only if they have an entity signal
  SELECT t.buyer_id, t.supplier_id
  FROM top_pair_per_buyer t
  WHERE NOT EXISTS (
    SELECT 1 FROM native_signal_pairs n WHERE n.buyer_id = t.buyer_id
  )
  AND (
    EXISTS (SELECT 1 FROM direct_purchase_buyers d WHERE d.buyer_id = t.buyer_id)
    OR EXISTS (SELECT 1 FROM award_gap_buyers ag WHERE ag.buyer_id = t.buyer_id)
    OR EXISTS (SELECT 1 FROM failed_tenders_buyers ft WHERE ft.buyer_id = t.buyer_id)
  )
),

-- ── Assemble all signals per pair ─────────────────────────────────────────────
pair_signals AS (
  SELECT
    p.buyer_id,
    p.buyer_name,
    p.supplier_id,
    p.supplier_name,
    p.contract_count,
    p.total_amount,
    p.latest_year,

    -- pair-level signals
    sb.single_bidder_count,
    sb.single_bidder_ratio,
    sb.total_contracts       AS sb_total_contracts,
    sb.total_amount          AS sb_total_amount,

    sd.short_deadline_count,
    sd.total_amount          AS sd_total_amount,

    -- entity-level signals (only for eligible pairs)
    dp.direct_count,
    dp.direct_ratio,
    dp.total_awards          AS dp_total_awards,
    dp.total_amount          AS dp_total_amount,

    ag.total_awards          AS ag_total_awards,
    ag.total_contracts       AS ag_total_contracts,
    ag.gap_ratio,
    ag.total_amount          AS ag_total_amount,

    ft.total_tenders,
    ft.failed_count,
    ft.failed_ratio,

    -- signal presence booleans
    (sb.buyer_id IS NOT NULL)                                     AS has_single_bidder,
    (sd.buyer_id IS NOT NULL)                                     AS has_short_deadline,
    (dp.buyer_id IS NOT NULL AND est.buyer_id IS NOT NULL)        AS has_direct_purchase,
    (ag.buyer_id IS NOT NULL AND est.buyer_id IS NOT NULL)        AS has_award_gap,
    (ft.buyer_id IS NOT NULL AND est.buyer_id IS NOT NULL)        AS has_failed_tenders

  FROM pair_summary p
  -- join native signals
  LEFT JOIN single_bidder_pairs sb
         ON sb.buyer_id = p.buyer_id AND sb.supplier_id = p.supplier_id
  LEFT JOIN short_deadline_pairs sd
         ON sd.buyer_id = p.buyer_id AND sd.supplier_id = p.supplier_id
  -- entity signals only for eligible target pairs
  LEFT JOIN entity_signal_targets est
         ON est.buyer_id = p.buyer_id AND est.supplier_id = p.supplier_id
  LEFT JOIN direct_purchase_buyers dp ON dp.buyer_id = p.buyer_id
  LEFT JOIN award_gap_buyers ag       ON ag.buyer_id = p.buyer_id
  LEFT JOIN failed_tenders_buyers ft  ON ft.buyer_id = p.buyer_id
),

-- ── Score and filter ─────────────────────────────────────────────────────────
scored AS (
  SELECT
    *,
    LEAST(
      (CASE WHEN has_single_bidder  THEN 35 ELSE 0 END) +
      (CASE WHEN has_short_deadline THEN 25 ELSE 0 END) +
      (CASE WHEN has_direct_purchase THEN 20 ELSE 0 END) +
      (CASE WHEN has_award_gap      THEN 10 ELSE 0 END) +
      (CASE WHEN has_failed_tenders THEN 10 ELSE 0 END),
      100
    )                                                             AS risk_score,

    CASE
      WHEN has_single_bidder  THEN 'single_bidder'
      WHEN has_short_deadline THEN 'short_deadline'
      WHEN has_direct_purchase THEN 'direct_purchase'
      WHEN has_award_gap      THEN 'award_gap'
      WHEN has_failed_tenders THEN 'failed_tenders'
    END                                                           AS primary_signal

  FROM pair_signals
  WHERE has_single_bidder
     OR has_short_deadline
     OR has_direct_purchase
     OR has_award_gap
     OR has_failed_tenders
)

SELECT
  -- Canonical alert ID: {buyer_id}::{supplier_id}::{primary_signal}
  buyer_id || '::' || supplier_id || '::' || primary_signal      AS canonical_id,
  buyer_id,
  buyer_name,
  supplier_id,
  supplier_name,
  contract_count,
  total_amount,
  latest_year::int                                                AS latest_year,

  risk_score,
  CASE
    WHEN risk_score >= 60 THEN 'critical'
    WHEN risk_score >= 40 THEN 'high'
    WHEN risk_score >= 20 THEN 'medium'
    ELSE                       'low'
  END                                                             AS risk_level,

  primary_signal,

  -- signal flags
  has_single_bidder,
  has_short_deadline,
  has_direct_purchase,
  has_award_gap,
  has_failed_tenders,

  -- signal evidence (nulls when signal not present)
  single_bidder_count,
  single_bidder_ratio,
  sb_total_contracts,
  sb_total_amount,

  short_deadline_count,
  sd_total_amount,

  direct_count,
  direct_ratio,
  dp_total_awards,
  dp_total_amount,

  ag_total_awards,
  ag_total_contracts,
  gap_ratio,
  ag_total_amount,

  total_tenders,
  failed_count,
  failed_ratio

FROM scored;

-- Indexes for common query patterns
CREATE INDEX ON alert_pairs (buyer_id);
CREATE INDEX ON alert_pairs (supplier_id);
CREATE INDEX ON alert_pairs (risk_score DESC);
CREATE INDEX ON alert_pairs (buyer_name text_pattern_ops);  -- for ILIKE prefix searches
CREATE INDEX ON alert_pairs (supplier_name text_pattern_ops);
CREATE INDEX ON alert_pairs (canonical_id);
