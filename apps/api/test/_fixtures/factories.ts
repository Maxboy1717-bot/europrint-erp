/**
 * @module test/_fixtures/factories
 * @description Deterministic test data factories. No @faker-js/faker dependency —
 *   embedded mulberry32 PRNG keeps tests fully reproducible. Pass `seed` in any
 *   overrides to get different output; default seed = 42.
 *
 * Usage:
 *   const u = userFactory({ role: 'admin' });
 *   const lead = leadFactory({ status: 'qualified' });
 *
 * Every factory:
 *   - Returns a plain object matching the domain shape (NOT the aggregate class).
 *   - Accepts a partial override that replaces matching keys.
 *   - Is fully synchronous and deterministic.
 *
 * Aggregate construction examples (use the factory output as constructor input):
 *   const lead = Lead.create({ ...leadFactory(), companyId: 1 });
 */

let _seed = 0x9e3779b9;
function rng(): number {
  let t = (_seed += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function resetSeed(s = 42): void { _seed = s; }
function int(min: number, max: number): number { return Math.floor(rng() * (max - min + 1)) + min; }
function pick<T>(arr: readonly T[]): T { return arr[int(0, arr.length - 1)]; }
function hex(n: number): string { return Array.from({ length: n }, () => int(0, 15).toString(16)).join(''); }
function uuid(): string {
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${pick(['8','9','a','b'])}${hex(3)}-${hex(12)}`;
}

export { resetSeed };

// =============================================================================
// Primitives
// =============================================================================

const FIRST_NAMES = ['Ali', 'Vali', 'Sanjar', 'Madina', 'Diyor', 'Aziza', 'Bobur', 'Nodira', 'Rustam', 'Gulnora'];
const LAST_NAMES  = ['Karimov', 'Yusupov', 'Rashidova', 'Toshev', 'Saidova', 'Akhmedov', 'Nazarova', 'Mirzaev'];
const COMPANIES   = ['EuroPrint', 'Tashkent Pack', 'Karton-Plus', 'O\'zbek Qog\'oz', 'Standart Box'];
const DEPTS       = ['Production', 'Sales', 'HR', 'Finance', 'IT', 'Warehouse', 'Marketing', 'QC'];
const ROLES       = ['admin', 'manager', 'director', 'employee', 'operator', 'hr_manager'] as const;
const SOURCES     = ['website', 'referral', 'direct', 'social', 'cold_call', 'event'] as const;
const LEAD_STATUS = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'] as const;
const DEAL_STATUS = ['qualification', 'proposal', 'negotiation', 'won', 'lost'] as const;
const SO_STATUS   = ['draft', 'pending_advance', 'approved', 'ready_for_planning', 'in_production', 'shipped', 'closed'] as const;
const PO_STATUS   = ['draft', 'approved', 'received', 'invoiced', 'closed', 'cancelled'] as const;

function firstName(): string { return pick(FIRST_NAMES); }
function lastName():  string { return pick(LAST_NAMES); }
function fullName():  string { return `${firstName()} ${lastName()}`; }
function email():     string { return `${firstName().toLowerCase()}.${lastName().toLowerCase()}@${pick(COMPANIES).toLowerCase().replace(/\s+/g,'')}.uz`; }
function phone():     string { return `+998${int(90, 99)}${String(int(1000000, 9999999)).padStart(7, '0')}`; }

// =============================================================================
// Factories
// =============================================================================

export interface UserFactoryProps {
  id: number;
  username: string;
  email: string;
  password: string;
  role: typeof ROLES[number];
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  createdAt: Date;
}
export function userFactory(overrides: Partial<UserFactoryProps> = {}): UserFactoryProps {
  return {
    id: int(1, 99999),
    username: `user${int(1000, 9999)}`,
    email: email(),
    password: 'TestPass1!',
    role: pick(ROLES),
    isActive: true,
    isLocked: false,
    failedLoginAttempts: 0,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export interface EmployeeFactoryProps {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: number;
  positionId: number;
  hireDate: string;
  status: 'active' | 'terminated' | 'on_leave';
}
export function employeeFactory(overrides: Partial<EmployeeFactoryProps> = {}): EmployeeFactoryProps {
  return {
    id: int(1, 99999),
    userId: int(1, 99999),
    firstName: firstName(),
    lastName: lastName(),
    email: email(),
    phone: phone(),
    departmentId: int(1, 18),
    positionId: int(1, 110),
    hireDate: '2025-01-01',
    status: 'active',
    ...overrides,
  };
}

export interface LeadFactoryProps {
  companyId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: typeof LEAD_STATUS[number];
  source: string;
  aiScore: number;
  createdBy: number;
}
export function leadFactory(overrides: Partial<LeadFactoryProps> = {}): LeadFactoryProps {
  return {
    companyId: int(1, 1000),
    firstName: firstName(),
    lastName: lastName(),
    email: email(),
    phone: phone(),
    status: pick(LEAD_STATUS),
    source: pick(SOURCES),
    aiScore: int(0, 100),
    createdBy: int(1, 100),
    ...overrides,
  };
}

export interface DealFactoryProps {
  id: number;
  leadId: number;
  companyId: number;
  amount: number;
  currency: 'UZS' | 'USD';
  status: typeof DEAL_STATUS[number];
  expectedCloseDate: Date;
  createdBy: number;
}
export function dealFactory(overrides: Partial<DealFactoryProps> = {}): DealFactoryProps {
  return {
    id: int(1, 99999),
    leadId: int(1, 99999),
    companyId: int(1, 1000),
    amount: int(500_000, 100_000_000),
    currency: 'UZS',
    status: pick(DEAL_STATUS),
    expectedCloseDate: new Date('2026-12-31'),
    createdBy: int(1, 100),
    ...overrides,
  };
}

export interface SalesOrderFactoryProps {
  id: number;
  orderNumber: string;
  companyId: number;
  totalAmount: number;
  currency: 'UZS' | 'USD';
  status: typeof SO_STATUS[number];
  advanceRequired: number;
  advancePaid: number;
  advanceStatus: 'pending' | 'partial' | 'approved' | 'bypassed';
  designFlag: boolean;
  sampleFlag: boolean;
  techBomApproved: boolean;
  techRoutingApproved: boolean;
  techCardApproved: boolean;
  createdBy: number;
}
export function salesOrderFactory(overrides: Partial<SalesOrderFactoryProps> = {}): SalesOrderFactoryProps {
  const total = int(1_000_000, 50_000_000);
  return {
    id: int(1, 99999),
    orderNumber: `SO-2026-${String(int(1, 999999)).padStart(6, '0')}`,
    companyId: int(1, 1000),
    totalAmount: total,
    currency: 'UZS',
    status: 'pending_advance',
    advanceRequired: 70,
    advancePaid: 0,
    advanceStatus: 'pending',
    designFlag: false,
    sampleFlag: false,
    techBomApproved: false,
    techRoutingApproved: false,
    techCardApproved: false,
    createdBy: int(1, 100),
    ...overrides,
  };
}

export interface PurchaseOrderFactoryProps {
  id: number;
  poNumber: string;
  supplierId: number;
  status: typeof PO_STATUS[number];
  createdBy: number;
  approvedBy: number | null;
}
export function purchaseOrderFactory(overrides: Partial<PurchaseOrderFactoryProps> = {}): PurchaseOrderFactoryProps {
  return {
    id: int(1, 99999),
    poNumber: `PO-2026-${String(int(1, 9999)).padStart(4, '0')}`,
    supplierId: int(1, 500),
    status: 'draft',
    createdBy: int(1, 100),
    approvedBy: null,
    ...overrides,
  };
}

export interface PurchaseOrderItemFactoryProps {
  materialId: number;
  quantity: number;
  unitPrice: number;
}
export function purchaseOrderItemFactory(overrides: Partial<PurchaseOrderItemFactoryProps> = {}): PurchaseOrderItemFactoryProps {
  return {
    materialId: int(1, 1000),
    quantity: int(1, 1000),
    unitPrice: int(1000, 100000),
    ...overrides,
  };
}

export interface MaterialFactoryProps {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  minStock: number;
  maxStock: number;
  unitCost: number;
  currentStock: number;
  isActive: boolean;
}
export function materialFactory(overrides: Partial<MaterialFactoryProps> = {}): MaterialFactoryProps {
  return {
    id: uuid(),
    materialCode: `MAT-${String(int(1, 9999)).padStart(4, '0')}`,
    name: `Karton ${int(150, 350)}g/m²`,
    category: pick(['raw_material', 'consumable', 'asset']),
    unitOfMeasure: pick(['kg', 'piece', 'm²', 'roll']),
    minStock: int(10, 100),
    maxStock: int(500, 5000),
    unitCost: int(1000, 100000),
    currentStock: int(0, 1000),
    isActive: true,
    ...overrides,
  };
}

export interface StockFactoryProps {
  id: number;
  warehouseId: number;
  materialId: number;
  quantity: number;
  expiryDate: Date | null;
  batchNumber: string;
}
export function stockFactory(overrides: Partial<StockFactoryProps> = {}): StockFactoryProps {
  return {
    id: int(1, 99999),
    warehouseId: int(1, 9),
    materialId: int(1, 1000),
    quantity: int(0, 10000),
    expiryDate: null,
    batchNumber: `BATCH-${String(int(1, 999999)).padStart(6, '0')}`,
    ...overrides,
  };
}

export interface ProductionOrderFactoryProps {
  id: number;
  soId: number;
  bomId: number;
  routingId: number;
  plannedStart: Date;
  plannedEnd: Date;
}
export function productionOrderFactory(overrides: Partial<ProductionOrderFactoryProps> = {}): ProductionOrderFactoryProps {
  return {
    id: int(1, 99999),
    soId: int(1, 99999),
    bomId: int(1, 1000),
    routingId: int(1, 1000),
    plannedStart: new Date('2026-06-01'),
    plannedEnd: new Date('2026-06-15'),
    ...overrides,
  };
}

export interface DeliveryFactoryProps {
  orderId: number;
  driverId: number;
  vehicleId: string;
  customerName: string;
  deliveryAddress: string;
}
export function deliveryFactory(overrides: Partial<DeliveryFactoryProps> = {}): DeliveryFactoryProps {
  return {
    orderId: int(1, 99999),
    driverId: int(1, 100),
    vehicleId: `TRUCK-${String(int(1, 99)).padStart(2, '0')}`,
    customerName: pick(COMPANIES),
    deliveryAddress: `Toshkent, ${pick(DEPTS)} ko'chasi ${int(1, 200)}`,
    ...overrides,
  };
}

export interface CampaignFactoryProps {
  name: string;
  type: 'EMAIL' | 'SMS' | 'TELEGRAM' | 'EVENT';
  description: string;
  targetAudience: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  createdBy: number;
}
export function campaignFactory(overrides: Partial<CampaignFactoryProps> = {}): CampaignFactoryProps {
  return {
    name: `Bahor ${int(2024, 2027)} Kampaniya`,
    type: pick(['EMAIL', 'SMS', 'TELEGRAM', 'EVENT'] as const),
    description: 'Mavsumiy chegirma',
    targetAudience: 'Mijozlar 18-45 yosh',
    budget: int(1_000_000, 50_000_000),
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-30'),
    createdBy: int(1, 100),
    ...overrides,
  };
}

export interface InspectionFactoryProps {
  orderId: number;
  batchId: string;
  inspectorId: number;
  sampleSize: number;
}
export function inspectionFactory(overrides: Partial<InspectionFactoryProps> = {}): InspectionFactoryProps {
  return {
    orderId: int(1, 99999),
    batchId: `BATCH-${String(int(1, 9999)).padStart(4, '0')}`,
    inspectorId: int(1, 100),
    sampleSize: int(10, 100),
    ...overrides,
  };
}

export interface LeaveRequestFactoryProps {
  id: string;
  employeeId: string;
  userId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'UNPAID' | 'STUDY';
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string;
}
export function leaveRequestFactory(overrides: Partial<LeaveRequestFactoryProps> = {}): LeaveRequestFactoryProps {
  return {
    id: uuid(),
    employeeId: String(int(1, 999)),
    userId: String(int(1, 999)),
    leaveType: pick(['ANNUAL', 'SICK', 'MATERNITY', 'UNPAID', 'STUDY'] as const),
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-10'),
    daysRequested: 8,
    status: 'PENDING',
    reason: "Oilaviy holat",
    ...overrides,
  };
}

export interface AttendanceFactoryProps {
  id: number;
  employeeId: number;
  departmentId: number;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'late' | 'half_day';
  shiftId?: number;
  overtimeHours: number;
}
export function attendanceFactory(overrides: Partial<AttendanceFactoryProps> = {}): AttendanceFactoryProps {
  return {
    id: int(1, 99999),
    employeeId: int(1, 999),
    departmentId: int(1, 18),
    checkInTime: new Date('2026-06-15T09:00:00'),
    checkOutTime: new Date('2026-06-15T18:00:00'),
    status: 'present',
    overtimeHours: 0,
    ...overrides,
  };
}

export interface BomFactoryProps {
  id: number;
  productId: number;
  version: number;
}
export function bomFactory(overrides: Partial<BomFactoryProps> = {}): BomFactoryProps {
  return {
    id: int(1, 99999),
    productId: int(1, 1000),
    version: 1,
    ...overrides,
  };
}

export interface RoutingFactoryProps {
  id: number;
  productId: number;
  version: number;
}
export function routingFactory(overrides: Partial<RoutingFactoryProps> = {}): RoutingFactoryProps {
  return {
    id: int(1, 99999),
    productId: int(1, 1000),
    version: 1,
    ...overrides,
  };
}

export interface NotificationFactoryProps {
  userId: number;
  type: string;
  title: string;
  message: string;
}
export function notificationFactory(overrides: Partial<NotificationFactoryProps> = {}): NotificationFactoryProps {
  return {
    userId: int(1, 999),
    type: pick(['info', 'warning', 'error', 'success']),
    title: 'Bildirishnoma',
    message: 'Test bildirishnoma matni',
    ...overrides,
  };
}

export interface AdaptationFactoryProps {
  id: number;
  employeeId: number;
  mentorId: number;
  programId: number;
  startDate: Date;
  durationDays: number;
}
export function adaptationFactory(overrides: Partial<AdaptationFactoryProps> = {}): AdaptationFactoryProps {
  return {
    id: int(1, 99999),
    employeeId: int(1, 999),
    mentorId: int(1, 100),
    programId: int(1, 50),
    startDate: new Date('2026-06-01'),
    durationDays: 90,
    ...overrides,
  };
}

export interface ApplicationFactoryProps {
  id: string;
  applicantUserId: number;
  templateId: string;
  fields: Record<string, unknown>;
}
export function applicationFactory(overrides: Partial<ApplicationFactoryProps> = {}): ApplicationFactoryProps {
  return {
    id: uuid(),
    applicantUserId: int(1, 999),
    templateId: uuid(),
    fields: { reason: 'Test arzasi', amount: int(100000, 1000000) },
    ...overrides,
  };
}

export interface OrgNodeFactoryProps {
  id: number;
  name: string;
  code: string;
  parentId: number | null;
  headUserId: number | null;
  type: 'department' | 'position' | 'role';
}
export function orgNodeFactory(overrides: Partial<OrgNodeFactoryProps> = {}): OrgNodeFactoryProps {
  return {
    id: int(1, 9999),
    name: pick(DEPTS),
    code: `DEPT-${String(int(1, 999)).padStart(3, '0')}`,
    parentId: null,
    headUserId: int(1, 100),
    type: 'department',
    ...overrides,
  };
}

// =============================================================================
// Batch helpers
// =============================================================================

/** Create N items with optional per-item override */
export function many<T>(factory: () => T, count: number): T[] {
  return Array.from({ length: count }, () => factory());
}
