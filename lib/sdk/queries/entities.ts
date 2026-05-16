import type { Entity, EntityListItem } from '../types'
import { mockEntities, mockEntityList } from '../mock-data'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getEntities(): Promise<EntityListItem[]> {
  await delay(100)
  return mockEntityList
}

export async function getEntityById(id: string): Promise<Entity | null> {
  await delay(100)
  return mockEntities[id] ?? null
}
