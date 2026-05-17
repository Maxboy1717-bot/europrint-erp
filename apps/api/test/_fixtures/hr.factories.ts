/**
 * @module test/_fixtures/hr.factories
 * @description HR-specific deterministic test factories. Companion to
 *   `./factories.ts`; that file holds the cross-domain primitives
 *   (user, lead, sales order, etc.). This one keeps anything HR-only
 *   so the base file does not balloon past the 300-line limit.
 *
 *   Same conventions as `factories.ts`:
 *     - Plain objects matching the persistence shape (not aggregates).
 *     - Deterministic — `resetSeed()` from `./factories.ts` reseeds both.
 *     - Overrides via `Partial<T>`.
 *
 *   `hrEmployeeFactory` deliberately includes the 11 personal fields that
 *   Task 1.4 will add to the schema (shift, salaryType, workshopZone, age,
 *   childrenCount, maritalStatus, housingType, householdMembers,
 *   attestationDate, latitude, longitude). Until the migration lands they
 *   are no-ops on the DB side; the factory still emits them so the
 *   round-trip tests in Task 1.4 can assert persistence.
 */

// Local rng — mirrors `./factories.ts` so this file is self-contained
// in case it is imported in isolation. If both files are loaded the
// seeds are independent; that is fine for current tests because no test
// reads from both factories at the same time.
let _seed = 0xB0F00BA5;
function rng(): number {
  let t = (_seed += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function int(min: number, max: number): number { return Math.floor(rng() * (max - min + 1)) + min; }
function pick<T>(arr: readonly T[]): T { return arr[int(0, arr.length - 1)]; }
function hex(n: number): string { return Array.from({ length: n }, () => int(0, 15).toString(16)).join(''); }
function uuid(): string {
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${pick(['8','9','a','b'])}${hex(3)}-${hex(12)}`;
}

const HR_FIRST = ['Sherzod', 'Diyora', 'Bahodir', 'Mahliyo', 'Kamol', 'Oybek', 'Zarina', 'Jamshid', 'Iroda', 'Ulug\'bek'];
const HR_LAST  = ['Tursunov', 'Mamatova', 'Eshmurodov', 'Qodirova', 'Sodiqov', 'Norbutaev', 'Pulatova', 'Xolmurodov'];
const DEPTS    = ['Production', 'Sales', 'HR', 'Finance', 'IT', 'Warehouse', 'Marketing', 'QC'];
const POSITIONS = ['Specialist', 'Manager', 'Lead', 'Assistant', 'Operator', 'Coordinator', 'Director', 'Analyst'];
const VAC_STAGES = ['NEW', 'SCREENING', 'TEST_SENT', 'INTERVIEW', 'OFFER_SENT', 'HIRED', 'REJECTED'] as const;
const STATUSES = ['active', 'inactive', 'on_leave', 'probation', 'terminated'] as const;
const SHIFTS = ['A', 'B', 'C', 'D'] as const;
const SALARY_TYPES = ['fiks', 'soatbay', 'smenbay', 'baytulmal'] as const;
const WORKSHOP_ZONES = ['1 sex', '2 sex', '3 sex', 'office', 'warehouse'] as const;
const MARITAL = ['single', 'married', 'divorced', 'widowed'] as const;
const HOUSING = ['own', 'rent', 'family', 'dormitory'] as const;
const LEAVE_TYPES = ['ANNUAL', 'SICK', 'MATERNITY', 'UNPAID', 'STUDY'] as const;
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const DISCIPLINE_TYPES = ['verbal_warning', 'written_warning', 'suspension', 'demotion', 'termination'] as const;
const PAYROLL_STATUS = ['draft', 'calculating', 'approved', 'paid', 'closed'] as const;

function firstName(): string { return pick(HR_FIRST); }
function lastName():  string { return pick(HR_LAST); }
function email():     string { return `${firstName().toLowerCase()}.${lastName().toLowerCase()}@europrint.uz`; }
function phone():     string { return `+998${int(90, 99)}${String(int(1000000, 9999999)).padStart(7, '0')}`; }

// ─── Employee (full HR shape) ───────────────────────────────────────────

export interface HrEmployeeFactoryProps {
  id: number;
  tenantId: number;
  userId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  hireDate: string;
  birthDate: string;
  positionId: number;
  departmentId: number;
  managerId: number | null;
  baseSalary: number;
  status: typeof STATUSES[number];
  passportNumber: string | null;
  bankAccountNumber: string | null;
  nationalId: string | null;
  // Task 1.4 — 11 personal fields, schema-pending
  shift: typeof SHIFTS[number] | null;
  salaryType: typeof SALARY_TYPES[number] | null;
  workshopZone: typeof WORKSHOP_ZONES[number] | null;
  age: number | null;
  childrenCount: number | null;
  maritalStatus: typeof MARITAL[number] | null;
  housingType: typeof HOUSING[number] | null;
  householdMembers: number | null;
  attestationDate: string | null;
  latitude: number | null;
  longitude: number | null;
}
export function hrEmployeeFactory(overrides: Partial<HrEmployeeFactoryProps> = {}): HrEmployeeFactoryProps {
  return {
    id: int(1, 99999),
    tenantId: 1,
    userId: int(1, 99999),
    employeeCode: `EMP-${String(int(10000, 99999))}`,
    firstName: firstName(),
    lastName: lastName(),
    middleName: firstName(),
    email: email(),
    phone: phone(),
    hireDate: '2024-09-01',
    birthDate: '1990-06-15',
    positionId: int(1, 110),
    departmentId: int(1, 18),
    managerId: int(1, 999),
    baseSalary: int(3_000_000, 15_000_000),
    status: 'active',
    passportNumber: `AA${int(1000000, 9999999)}`,
    bankAccountNumber: `2020${int(100000000000, 999999999999)}`,
    nationalId: `${int(10000000000000, 99999999999999)}`,
    shift: pick(SHIFTS),
    salaryType: pick(SALARY_TYPES),
    workshopZone: pick(WORKSHOP_ZONES),
    age: int(20, 60),
    childrenCount: int(0, 5),
    maritalStatus: pick(MARITAL),
    housingType: pick(HOUSING),
    householdMembers: int(1, 8),
    attestationDate: '2025-12-01',
    latitude: 41.3 + rng() * 0.3,
    longitude: 69.2 + rng() * 0.3,
    ...overrides,
  };
}

// ─── Candidate (recruitment funnel) ─────────────────────────────────────

export interface CandidateFactoryProps {
  id: number;
  tenantId: number;
  fullName: string;
  email: string;
  phone: string;
  vacancyId: number;
  stage: typeof VAC_STAGES[number];
  aiScore: number | null;
  source: string;
  expectedSalary: number | null;
}
export function candidateFactory(overrides: Partial<CandidateFactoryProps> = {}): CandidateFactoryProps {
  return {
    id: int(1, 99999),
    tenantId: 1,
    fullName: `${firstName()} ${lastName()}`,
    email: email(),
    phone: phone(),
    vacancyId: int(1, 999),
    stage: pick(VAC_STAGES),
    aiScore: int(0, 100),
    source: pick(['hh.uz', 'referral', 'linkedin', 'telegram', 'walk-in']),
    expectedSalary: int(2_500_000, 20_000_000),
    ...overrides,
  };
}

// ─── Vacancy ────────────────────────────────────────────────────────────

export interface VacancyFactoryProps {
  id: number;
  tenantId: number;
  title: string;
  departmentId: number;
  positionId: number;
  status: 'open' | 'paused' | 'filled' | 'cancelled';
  openedAt: string;
  headcount: number;
  salaryRangeMin: number;
  salaryRangeMax: number;
}
export function vacancyFactory(overrides: Partial<VacancyFactoryProps> = {}): VacancyFactoryProps {
  const min = int(3_000_000, 8_000_000);
  return {
    id: int(1, 9999),
    tenantId: 1,
    title: `${pick(POSITIONS)} (${pick(DEPTS)})`,
    departmentId: int(1, 18),
    positionId: int(1, 110),
    status: 'open',
    openedAt: '2026-05-01',
    headcount: int(1, 5),
    salaryRangeMin: min,
    salaryRangeMax: min + int(1_000_000, 5_000_000),
    ...overrides,
  };
}

// ─── Position / Department ──────────────────────────────────────────────

export interface PositionFactoryProps {
  id: number;
  title: string;
  departmentId: number;
  gradeLevel: number;
  minSalary: number;
  maxSalary: number;
}
export function positionFactory(overrides: Partial<PositionFactoryProps> = {}): PositionFactoryProps {
  const min = int(3_000_000, 10_000_000);
  return {
    id: int(1, 999),
    title: pick(POSITIONS),
    departmentId: int(1, 18),
    gradeLevel: int(1, 10),
    minSalary: min,
    maxSalary: min + int(500_000, 5_000_000),
    ...overrides,
  };
}

export interface DepartmentFactoryProps {
  id: number;
  name: string;
  code: string;
  parentId: number | null;
  headEmployeeId: number | null;
  costCenterCode: string;
}
export function departmentFactory(overrides: Partial<DepartmentFactoryProps> = {}): DepartmentFactoryProps {
  return {
    id: int(1, 99),
    name: pick(DEPTS),
    code: `DEPT-${String(int(1, 99)).padStart(3, '0')}`,
    parentId: null,
    headEmployeeId: int(1, 999),
    costCenterCode: `CC-${String(int(1000, 9999))}`,
    ...overrides,
  };
}

// ─── Payroll period / salary history ────────────────────────────────────

export interface PayrollPeriodFactoryProps {
  id: number;
  tenantId: number;
  periodStart: string;
  periodEnd: string;
  status: typeof PAYROLL_STATUS[number];
  totalGross: number;
  totalNet: number;
  totalTaxes: number;
  closedAt: string | null;
}
export function payrollPeriodFactory(overrides: Partial<PayrollPeriodFactoryProps> = {}): PayrollPeriodFactoryProps {
  const gross = int(50_000_000, 500_000_000);
  return {
    id: int(1, 9999),
    tenantId: 1,
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    status: 'draft',
    totalGross: gross,
    totalNet: Math.round(gross * 0.88),
    totalTaxes: Math.round(gross * 0.12),
    closedAt: null,
    ...overrides,
  };
}

export interface SalaryHistoryFactoryProps {
  id: number;
  employeeId: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  baseSalary: number;
  changeReason: 'hire' | 'promotion' | 'merit' | 'demotion' | 'market_adjustment';
  approvedBy: number;
}
export function salaryHistoryFactory(overrides: Partial<SalaryHistoryFactoryProps> = {}): SalaryHistoryFactoryProps {
  return {
    id: int(1, 99999),
    employeeId: int(1, 999),
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    baseSalary: int(3_000_000, 15_000_000),
    changeReason: 'hire',
    approvedBy: int(1, 100),
    ...overrides,
  };
}

// ─── Skills / discipline ────────────────────────────────────────────────

export interface SkillFactoryProps {
  id: number;
  employeeId: number;
  skillName: string;
  level: typeof SKILL_LEVELS[number];
  certifiedAt: string | null;
  expiresAt: string | null;
}
export function skillFactory(overrides: Partial<SkillFactoryProps> = {}): SkillFactoryProps {
  return {
    id: int(1, 99999),
    employeeId: int(1, 999),
    skillName: pick(['CAD', 'AutoCAD', 'ERP-1C', 'SAP', 'Excel-Advanced', 'OffsetPrint', 'DigitalPrint', 'BindingMachine']),
    level: pick(SKILL_LEVELS),
    certifiedAt: '2025-09-01',
    expiresAt: null,
    ...overrides,
  };
}

export interface DisciplineFactoryProps {
  id: number;
  tenantId: number;
  employeeId: number;
  type: typeof DISCIPLINE_TYPES[number];
  reason: string;
  occurredAt: string;
  issuedBy: number;
  resolved: boolean;
}
export function disciplineFactory(overrides: Partial<DisciplineFactoryProps> = {}): DisciplineFactoryProps {
  return {
    id: int(1, 99999),
    tenantId: 1,
    employeeId: int(1, 999),
    type: pick(DISCIPLINE_TYPES),
    reason: 'Ish vaqtida kechikish (3 marta oyiga)',
    occurredAt: '2026-04-15',
    issuedBy: int(1, 100),
    resolved: false,
    ...overrides,
  };
}

// ─── Re-exports of HR-relevant existing factories ───────────────────────
// Keep the import surface narrow: a spec that needs HR fixtures can
// pull everything from this file rather than mixing imports.
export { leaveRequestFactory, attendanceFactory, adaptationFactory, orgNodeFactory } from './factories';

// ─── Batch helper ───────────────────────────────────────────────────────
export function manyHr<T>(factory: () => T, count: number): T[] {
  return Array.from({ length: count }, () => factory());
}
