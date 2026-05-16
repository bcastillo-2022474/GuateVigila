#!/usr/bin/env python3
"""
Migrates OCDS Guatecompras CSVs → Neon (Postgres) via DuckDB.

Usage:
    python scripts/migrate_to_postgres.py

Requires:
    pip install duckdb psycopg2-binary python-dotenv

Env vars (from .env.local or environment):
    OCDS_DATA_DIR   — path to folder with the CSV files
    DATABASE_URL    — Neon postgres connection string
                      e.g. postgresql://user:pass@host/dbname?sslmode=require
"""

import os
import sys
import time
import duckdb
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))

DATA_DIR = os.environ.get('OCDS_DATA_DIR')
DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATA_DIR:
    print('ERROR: OCDS_DATA_DIR not set — check .env.local')
    sys.exit(1)

if not DATABASE_URL:
    print('ERROR: DATABASE_URL not set — check .env.local')
    sys.exit(1)

# Only the tables the SDK actually queries — skipping the heavy ones we don't use
# (tender_items_attributes: 1.5M rows, parties: 1.1M rows, tender_documents: 957k rows)
TABLES = [
    'main',                     # 276k rows — core table
    'awards',                   # 221k rows — adjudicaciones
    'awards_suppliers',         # 221k rows — proveedor ganador
    'contracts',                # 13k  rows — contratos formalizados
    'bids_details',             # 505k rows — ofertas
    'bids_details_tenderers',   # 506k rows — empresas por oferta
    'tender_tenderers',         # 505k rows — participantes por licitacion
    'tender_items',             # 486k rows — items licitados
    'parties',                  # 1.1M rows — entidades
    'parties_memberOf',         # 274k rows — membresias
    'sources',                  # 276k rows — metadatos publicacion
]

def log(msg: str):
    print(f'[{time.strftime("%H:%M:%S")}] {msg}', flush=True)

def main():
    log(f'Data dir: {DATA_DIR}')
    log(f'Target:   {DATABASE_URL[:40]}...')
    log('')

    log('Connecting to DuckDB...')
    con = duckdb.connect(':memory:')

    # Install and load the postgres extension
    con.execute("INSTALL postgres; LOAD postgres;")

    # Attach Neon as a target database
    con.execute(f"ATTACH '{DATABASE_URL}' AS pg (TYPE POSTGRES);")

    for table in TABLES:
        csv_path = os.path.join(DATA_DIR, f'{table}.csv')

        if not os.path.exists(csv_path):
            log(f'  SKIP {table} — file not found at {csv_path}')
            continue

        log(f'  Loading {table}.csv into DuckDB...')
        t0 = time.time()
        con.execute(f"CREATE OR REPLACE TABLE {table} AS SELECT * FROM read_csv_auto('{csv_path}')")
        row_count = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        log(f'  → {row_count:,} rows loaded in {time.time() - t0:.1f}s')

        log(f'  Pushing {table} → Postgres...')
        t1 = time.time()
        # Drop and recreate so re-runs are idempotent
        con.execute(f"DROP TABLE IF EXISTS pg.public.{table}")
        con.execute(f"CREATE TABLE pg.public.{table} AS SELECT * FROM {table}")
        log(f'  → done in {time.time() - t1:.1f}s')
        log('')

    log('Adding indexes for common query patterns...')
    indexes = [
        ("main",            "ocid"),
        ("main",            "buyer_name"),
        ("main",            "buyer_id"),
        ("awards",          "main_ocid"),
        ("awards",          "status"),
        ("awards_suppliers","awards_id"),
        ("awards_suppliers","main_ocid"),
        ("contracts",       "main_ocid"),
    ]
    for table, col in indexes:
        idx_name = f"idx_{table}_{col}"
        con.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON pg.public.{table} ({col})")
        log(f'  ✓ {idx_name}')

    log('')
    log('Migration complete.')

if __name__ == '__main__':
    main()
