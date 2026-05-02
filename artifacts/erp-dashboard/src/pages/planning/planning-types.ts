export const statusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export interface PlanningOperation {
  id: string;
  papkaOrderId: string;
  operationCode: string;
  operationName: string;
  sequence: number;
  equipmentId: string | null;
  plannedDate: string;
  plannedStartTime: string;
  plannedEndTime: string;
  plannedQuantity: number;
  plannedUnit?: string;
  status: string;
}

export interface PapkaOrder {
  id: string;
  papkaNo: string;
}

export interface PapkaOrdersResponse {
  items: PapkaOrder[];
}

export interface Equipment {
  id: string;
  name: string;
  category?: string;
}

export interface WorkCenter {
  id: string;
  name: string;
}

export interface ProductionPlanRow {
  id: string;
  planNumber: string;
  planDate: string;
  planType: string;
  workCenterId: string | null;
  workCenterName?: string;
  shift: string | null;
  status: string;
  notes: string | null;
}

export interface ProductionFactRow {
  id: string;
  factDate: string;
  shift: string | null;
  workCenterId: string;
  workCenterName?: string;
  productId: string;
  productName?: string;
  factQuantity: number;
  goodQuantity: number;
  scrapQuantity: number;
  notes: string | null;
}

export interface ScheduleEntry {
  id: string;
  equipmentId: string;
  scheduleDate: string;
  shift: string;
  plannedMinutes: number;
  totalCapacityMinutes: number;
  status: string;
}

export interface MRPRun {
  id: string;
  runName: string;
  status: string;
  planningHorizon: number;
  startTime: string | null;
  endTime: string | null;
  totalProducts: number;
  totalRequirements: number;
  totalShortages: number;
}

export interface MRPResult {
  id: string;
  mrpRunId: string;
  materialId: string;
  grossRequirement: number;
  onHandInventory: number;
  scheduledReceipts: number;
  netRequirement: number;
  shortageQuantity: number;
}

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string;
  mrpRunId: string;
  materialId: string;
  requiredQuantity: number;
  requiredDate: string | null;
  status: string;
  priority: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  sku: string;
}

export interface PlanningTranslations {
  title: string;
  subtitle: string;
  operationsTab: string;
  scheduleTab: string;
  plansTab: string;
  factsTab: string;
  planVsFactTab: string;
  mrpTab: string;
  addOperation: string;
  filters: string;
  papkaNo: string;
  status: string;
  dateRange: string;
  all: string;
  planned: string;
  inProgress: string;
  completed: string;
  cancelled: string;
  operationNo: string;
  workCenter: string;
  plannedQty: string;
  plannedStart: string;
  plannedEnd: string;
  actions: string;
  edit: string;
  save: string;
  cancel: string;
  createTitle: string;
  editTitle: string;
  createPlan: string;
  addFact: string;
  newMRPRun: string;
  exportExcel: string;
  loading: string;
  noData: string;
  totalRuns: string;
  purchaseReqs: string;
  materialReqs: string;
  calculate: string;
  results: string;
}