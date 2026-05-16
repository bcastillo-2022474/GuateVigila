// ===========================================
// GuateVigila SDK Types
// ===========================================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export interface Alert {
  id: string
  entityId: string
  entityName: string
  riskLevel: RiskLevel
  signalType: string
  signalIcon: string
  year: string
  contractCount: number
  totalAmount: number
  currency: string
}

export interface AlertDetail {
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
  networkMapUrl?: string
}

export interface Signal {
  id: string
  type: string
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
  topSuppliers: SupplierContract[]
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

// Entity List Item (for explorer view)
export interface EntityListItem {
  id: string
  name: string
  shortName: string
  type: 'ministerio' | 'municipalidad' | 'instituto' | 'secretaria'
  totalContracts: number
  totalAmount: number
  currency: string
  activeAlerts: number
  riskLevel: RiskLevel
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

// SDK Client Interface
export interface GuateVigilaSDK {
  // Alerts
  getAlerts(): Promise<Alert[]>
  getAlertById(id: string): Promise<AlertDetail | null>
  
  // Entities
  getEntities(): Promise<EntityListItem[]>
  getEntityById(id: string): Promise<Entity | null>
  
  // Suppliers
  getSuppliers(): Promise<SupplierListItem[]>
  getSupplierById(id: string): Promise<Supplier | null>
  
  // Stats
  getGlobalStats(): Promise<GlobalStats>
}
