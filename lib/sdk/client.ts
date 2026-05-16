import type { GuateVigilaSDK } from './types'
import * as alerts from './queries/alerts'
import * as entities from './queries/entities'
import * as suppliers from './queries/suppliers'
import * as stats from './queries/stats'

export const client: GuateVigilaSDK = {
  getAlerts: alerts.getAlerts,
  getAlertsPage: alerts.getAlertsPage,
  getAlertById: alerts.getAlertById,
  getEntities: entities.getEntities,
  getEntitiesPage: entities.getEntitiesPage,
  getEntityById: entities.getEntityById,
  getEntitySuppliers: entities.getEntitySuppliers,
  getSuppliers: suppliers.getSuppliers,
  getSuppliersPage: suppliers.getSuppliersPage,
  getSupplierById: suppliers.getSupplierById,
  getSupplierContracts: suppliers.getSupplierContracts,
  getGlobalStats: stats.getGlobalStats,
}
