import * as duckdb from '@duckdb/node-api'
import path from 'path'

const DATA_DIR = process.env.OCDS_DATA_DIR
if (!DATA_DIR) throw new Error('Missing env variable: OCDS_DATA_DIR — see .env.local.example')

const TABLES = [
  'main',
  'awards',
  'awards_suppliers',
  'contracts',
  'bids_details',
  'bids_details_tenderers',
  'tender_tenderers',
  'tender_items',
  'tender_items_attributes',
  'parties',
  'parties_memberOf',
  'sources',
] as const

let ready: Promise<duckdb.DuckDBConnection> | null = null

async function init(): Promise<duckdb.DuckDBConnection> {
  const dataDir = DATA_DIR
  if (!dataDir) {
    throw new Error('Missing env variable: OCDS_DATA_DIR — see .env.local.example')
  }

  const instance = await duckdb.DuckDBInstance.create(':memory:')
  const connection = await instance.connect()

  for (const table of TABLES) {
    const file = path.join(dataDir, `${table}.csv`)
    await connection.run(
      `CREATE TABLE ${table} AS SELECT * FROM read_csv_auto('${file}')`
    )
  }

  return connection
}

function getDb(): Promise<duckdb.DuckDBConnection> {
  if (!ready) ready = init()
  return ready
}

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const db = await getDb()
  const result = await db.run(sql)
  const rows = await result.getRowObjectsJS()
  return rows as T[]
}
