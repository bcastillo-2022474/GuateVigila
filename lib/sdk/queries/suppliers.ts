import type { Supplier, SupplierListItem } from '../types'
import { mockSuppliers, mockSupplierList } from '../mock-data'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getSuppliers(): Promise<SupplierListItem[]> {
  await delay(100)
  return mockSupplierList
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  await delay(100)
  return mockSuppliers[id] ?? null
}
