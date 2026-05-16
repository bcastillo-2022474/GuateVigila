import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('Missing env variable: DATABASE_URL — see .env.local.example')

const sql = neon(DATABASE_URL)

export async function query<T = Record<string, unknown>>(sqlStr: string): Promise<T[]> {
  const rows = await sql.query(sqlStr)
  return rows as T[]
}
