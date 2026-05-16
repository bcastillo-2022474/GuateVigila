// ===========================================
// GuateVigila SDK Types
// ===========================================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'
export type SignalType =
  | 'single_bidder'
  | 'short_deadline'
  | 'direct_purchase'
  | 'award_gap'
  | 'failed_tenders'

export interface Alert {
  // Stable alert id: {buyer_id}::{supplier_id}::{primary_signal}
  id: string
  entityId: string
  entityName: string
  riskLevel: RiskLevel
  signalKey: SignalType
  signalType: string
  signalIcon: string
  year: string
  contractCount: number
  totalAmount: number
  currency: string
}

export interface AlertDetail {
  // Detail always resolves to the canonical alert for the pair, even if the route
  // was opened through a non-primary active signal.
  id: string
  entityId: string
  entityName: string
  description: string
  riskScore: number
  riskLevel: RiskLevel
  signals: Signal[]
  involvedSupplier: {
    id: string
    name: string
    nit: string
    totalAwarded: number
    year: number
  }
  draftInvestigation: string
  // External links are only exposed when they can be derived reliably.
  guatecomprasUrl?: string
  registroMercantilUrl?: string
  networkMapUrl?: string
}

export interface Signal {
  id: string
  type: SignalType
  title: string
  description: string
  icon: string
  metrics: {
    label: string
    value: string
  }[]
}

export interface Entity {
  id: string
  name: string
  shortName: string
  totalContracts: number
  totalAmount: number
  currency: string
  directPurchasePercentage: number
  activeAlerts: number
  yearlyData: {
    year: number
    amount: number
    label: string
  }[]
}

export interface EntitySuppliersFilters {
  q?: string
  page?: number
}

export interface PaginatedSuppliers {
  suppliers: SupplierContract[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SupplierContract {
  id: string
  supplierId: string
  supplierName: string
  contractCount: number
  totalAmount: number
  currency: string
  riskLevel: RiskLevel
}

export interface Supplier {
  id: string
  name: string
  // Kept for compatibility; in practice this is the supplier identifier shown in the UI.
  nit: string
  industry: string
  totalContracts: number
  totalAwarded: number
  currency: string
  clientEntities: number
  singleBidderPercentage: number
  period: string
  yearlyData: {
    year: number
    amount: number
    contractCount: number
  }[]
  alerts: SupplierAlert[]
  associates: Associate[]
  registroMercantilUrl?: string
}

export interface SupplierContractsFilters {
  q?: string
  page?: number
}

export interface EntityContract {
  id: string
  entityId: string
  entityName: string
  contractCount: number
  totalAmount: number
  currency: string
  riskLevel: RiskLevel
}

export interface PaginatedSupplierContracts {
  contracts: EntityContract[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SupplierAlert {
  id: string
  severity: RiskLevel
  title: string
  description: string
  date: string
}

export interface Associate {
  id: string
  name: string
  role: string
  participation: string
  otherCompanies: number
}

export interface GlobalStats {
  processesAnalyzed: number
  totalAmount: number
  currency: string
  periodStart: number
  periodEnd: number
  activeAlerts: number
}

export type EntityType = 'ministerio' | 'municipalidad' | 'instituto' | 'secretaria'

export interface EntityFilters {
  type?: EntityType[]
}

export interface AlertListFilters {
  page?: number
  pageSize?: number
}

export interface PaginatedAlerts {
  alerts: Alert[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface EntityListFilters extends EntityFilters {
  q?: string
  page?: number
  pageSize?: number
}

// Entity List Item (for explorer view)
export interface EntityListItem {
  id: string
  name: string
  shortName: string
  type: EntityType
  totalContracts: number
  totalAmount: number
  currency: string
  activeAlerts: number
  riskLevel: RiskLevel
}

export interface PaginatedEntities {
  entities: EntityListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalContracts: number
    totalAlerts: number
  }
}

export interface SupplierListFilters {
  q?: string
  page?: number
  pageSize?: number
}

// Supplier List Item (for explorer view)
export interface SupplierListItem {
  id: string
  name: string
  nit: string
  industry: string
  totalContracts: number
  totalAwarded: number
  currency: string
  clientEntities: number
  riskLevel: RiskLevel
  singleBidderPercentage: number
}

export interface PaginatedSupplierList {
  suppliers: SupplierListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalContracts: number
    highRiskSuppliers: number
  }
}

// SDK Client Interface
export interface GuateVigilaSDK {
  // Alerts
  getAlerts(): Promise<Alert[]>
  getAlertsPage(filters?: AlertListFilters): Promise<PaginatedAlerts>
  getAlertById(id: string): Promise<AlertDetail | null>
  
  // Entities
  getEntities(filters?: EntityFilters): Promise<EntityListItem[]>
  getEntitiesPage(filters?: EntityListFilters): Promise<PaginatedEntities>
  getEntityById(id: string): Promise<Entity | null>
  getEntitySuppliers(id: string, filters?: EntitySuppliersFilters): Promise<PaginatedSuppliers>
  
  // Suppliers
  getSuppliers(): Promise<SupplierListItem[]>
  getSuppliersPage(filters?: SupplierListFilters): Promise<PaginatedSupplierList>
  getSupplierById(id: string): Promise<Supplier | null>
  getSupplierContracts(id: string, filters?: SupplierContractsFilters): Promise<PaginatedSupplierContracts>
  
  // Stats
  getGlobalStats(): Promise<GlobalStats>
}
