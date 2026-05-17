import type { GuateVigilaSDK } from './types'
import * as alerts from './queries/alerts'
import * as entities from './queries/entities'
import * as suppliers from './queries/suppliers'
import * as stats from './queries/stats'
import * as search from './queries/search'

export const client: GuateVigilaSDK = {
  getAlerts: alerts.getAlerts,
  getAlertsPage: alerts.getAlertsPage,
  getAlertById: alerts.getAlertById,
  getEntities: entities.getEntities,
  getEntitiesPage: entities.getEntitiesPage,
  getEntityById: entities.getEntityById,
  getEntitySuppliers: entities.getEntitySuppliers,
  getSuppliers: suppliers.getSuppliers,
  getSuppliersPage: suppliers.getSuppliers,
  getSupplierById: suppliers.getSupplierById,
  getSupplierContracts: suppliers.getSupplierContracts,
  getSupplierAssociates: suppliers.getSupplierAssociates,
  search: search.search,
  getGlobalStats: stats.getGlobalStats,
}
