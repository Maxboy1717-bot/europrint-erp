export interface AssetInventoryItem {
  id: number;
  assetCode: string;
  assetName: string;
  assetNameRu: string | null;
  assetType: string;
  location: string | null;
  departmentId: number | null;
  responsibleId: string | null;
  purchaseDate: string | null;
  purchaseValue: number;
  currentValue: number;
  depreciationMethod: string;
  usefulLife: number | null;
  salvageValue: number;
  accumulatedDepreciation: number;
  condition: string;
  status: string;
  lastInventoryDate: string | null;
  serialNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AssetSummary {
  totalAssets: number;
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalAccumulatedDepreciation: number;
  byType: Record<string, { count: number; value: number }>;
  byCondition: Record<string, number>;
}

export interface MaintenanceRecord {
  id: number;
  assetId: number;
  maintenanceType: string;
  scheduledDate: string | null;
  completedDate: string | null;
  technicianName: string | null;
  cost: number;
  description: string | null;
  status: string;
  notes: string | null;
  nextMaintenanceDate: string | null;
  createdAt: string;
}

export interface DisposalRecord {
  id: number;
  assetId: number;
  disposalMethod: string;
  disposalDate: string;
  disposalValue: number;
  bookValueAtDisposal: number;
  gainLoss: number;
  reason: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TransferRecord {
  id: number;
  assetId: number;
  fromDepartmentId: number | null;
  toDepartmentId: number | null;
  fromLocation: string | null;
  toLocation: string | null;
  transferDate: string;
  transferredBy: string | null;
  receivedBy: string | null;
  reason: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface InsuranceRecord {
  id: number;
  assetId: number;
  policyNumber: string;
  insurerName: string;
  coverageType: string;
  startDate: string;
  endDate: string;
  premiumAmount: number;
  coverageAmount: number;
  status: string;
  contactInfo: string | null;
  notes: string | null;
  createdAt: string;
}
