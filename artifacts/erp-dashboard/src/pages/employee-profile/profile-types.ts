export interface Employee {
  id: string | number;
  fullName: string;
  employeeId: string;
  email?: string;
  phone?: string;
  status: string;
  hireDate?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  profileImageUrl?: string | null;
  departmentName?: string;
  positionName?: string;
  positionOfficialTitle?: string;
  positionCkp?: string;
  salary?: number;
  telegramId?: string;
  telegramChatId?: string;
  positionId?: string;
  departmentId?: string;
  managerId?: string;
  managerName?: string;
  managerEmployeeId?: string;
  managerProfileImageUrl?: string;
  createdAt?: string | Date | null;
  age?: number;
  district?: string;
  maritalStatus?: string;
  childrenCount?: number;
  householdSize?: string;
  housingType?: string;
  householdMembers?: string;
  childrenEducation?: string;
  latitude?: number | null;
  longitude?: number | null;
  shift?: string;
  salaryType?: string;
  workshopZone?: string;
  manager?: { fullName: string };
  ckpCode?: string;
  hierarchyLevel?: string;
  attestationDate?: string;
  role?: string;
  hasPassword?: boolean;
  is_machine_operator?: boolean;
  machine_id?: string;
  machine_name?: string;
  subordinates?: Array<{
    id: string;
    fullName: string;
    employeeId: string;
    positionName?: string;
    departmentName?: string;
    status: string;
    profileImageUrl?: string | null;
  }>;
}

export interface PassportData {
  id: number;
  userId: number;
  passportNumber: string;
  passportSeries: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  birthPlace: string;
  citizenship: string;
}

export interface BankAccount {
  id: number;
  userId: number;
  bankName: string;
  accountNumber: string;
  cardNumber: string;
  cardHolderName: string;
  mfo: string;
  inn: string;
  isPrimary: boolean;
}

export interface EmergencyContact {
  id: number;
  userId: number;
  contactName: string;
  relationship: string;
  phoneNumber: string;
  alternativePhone: string;
  address: string;
  isPrimary: boolean;
}

export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  isLate: boolean;
  minutesLate: number;
  notes: string;
}

export interface DisciplineRecord {
  id: number;
  userId: number;
  type: string;
  reason: string;
  amount: number;
  givenByName: string;
  createdAt: string;
}

export interface CustomerComplaint {
  id: string | number;
  orderId?: string;
  customerName?: string;
  complaintType: string;
  description: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
}

export interface AssessmentSkipRecord {
  id: string | number;
  periodYear: number;
  periodMonth: number;
  expectedDate: string;
  reason?: string;
  skippedBy: "employee" | "manager" | "system";
  status: "excused" | "unexcused";
  createdAt?: string;
}

export interface Certificate {
  id: number;
  userId: number;
  name: string;
  certificateNumber: string;
  issuer: string;
  issueDate: string;
  issuedAt: string;
  expiryDate: string;
  score: number;
  course?: { title: string };
}

export interface AbcAnalysis {
  grade: string;
  performanceRate: number;
  punctualityRate: number;
  score?: number;
  attendanceRate?: number;
  courseCompletionRate?: number;
}

export interface CourseProgressRecord {
  id: number;
  userId: number;
  courseId: number;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  course?: { title: string };
}

export interface SafetyViolation {
  id: number;
  userId: number;
  violationType: string;
  cameraName: string;
  resolved: boolean;
  createdAt: string;
}

export interface PerformanceMetric {
  id: number;
  metricName: string;
  value: number;
  period: string;
  metricDate?: string;
  productivityScore?: number;
  qualityScore?: number;
  speedScore?: number;
}

export interface TransferRecord {
  id: number;
  userId: number;
  transferDate: string;
  fromPositionName: string;
  toPositionName: string;
  reason: string;
}

export interface OrgStructureAssignment {
  departmentName: string;
  positionName: string;
  functionName: string;
}

export interface EmploymentContract {
  id: number;
  userId: number;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string;
  salary: number;
  workSchedule: string;
}

export interface SalaryHistoryRecord {
  id: number;
  userId: number;
  effectiveDate: string;
  previousSalary: number;
  newSalary: number;
  changePercent: number;
  changeType: string;
  notes: string;
}

export interface BonusRecord {
  id: number;
  userId: number;
  paymentDate: string;
  amount: number;
  bonusType: string;
  description: string;
}

export interface FineRecord {
  id: number;
  userId: number;
  fineDate: string;
  amount: number;
  fineType: string;
  description: string;
  deductedFromSalary: boolean;
}

export interface OvertimeRecord {
  id: number;
  userId: number;
  workDate: string;
  hours: number;
  hourlyRate: number;
  multiplier: number;
  totalAmount: number;
  reason: string;
  isPaid: boolean;
}

export interface CashAdvanceRecord {
  id: number;
  userId: number;
  requestDate: string;
  amount: number;
  reason: string;
  status: string;
}

export interface LeaveRequest {
  id: number;
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
}

export interface SickLeaveRecord {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  diagnosis: string;
  hospitalName: string;
  doctorName: string;
  documentNumber: string;
  isPaid: boolean;
  paymentPercent: number;
}

export interface BusinessTrip {
  id: number;
  userId: number;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyAllowance: number;
  transportCost: number;
  accommodationCost: number;
  totalCost: number;
  status: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  sick: number;
  leave: number;
  punctualPercentage: number;
  totalMinutesLate: number;
}

export interface ShiftSwapRecord {
  id: string;
  requestedBy: string;
  swapWith: string | null;
  originalShiftDate: string;
  originalShiftType: string;
  requestedShiftDate: string | null;
  requestedShiftType: string | null;
  reason: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  requester?: { id: string; fullName: string };
}

export interface SkillGap {
  skillName: string;
  skillCategory: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  isMandatory: boolean;
  certificationRequired: boolean;
  status: 'met' | 'gap' | 'missing';
}

export interface SkillGapData {
  employee: { id: string; fullName: string; role: string };
  gaps: SkillGap[];
  summary: {
    totalRequired: number;
    met: number;
    gaps: number;
    missing: number;
    gapPercent: number;
  };
}

export interface MentorshipRecord {
  id: string;
  role: 'mentor' | 'mentee';
  mentorId: string;
  menteeId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  goals: string | null;
  partnerName: string | null;
}

export interface MentorshipData {
  asMentor: MentorshipRecord[];
  asMentee: MentorshipRecord[];
}

export interface DisciplineStats {
  warnings: number;
  penalties: number;
  rewards: number;
  totalPenaltyAmount: number;
  totalRewardAmount: number;
}

export interface ZoneTrackingLog {
  id: string;
  userId: string;
  zoneName: string;
  cameraId: string | null;
  cameraName: string | null;
  trackingDate: string;
  entryTime: string | null;
  exitTime: string | null;
  durationMinutes: number;
  visitCount: number;
}

export type TranslationFn = (key: string) => string;

export interface WmsMaterialItem {
  materialId: string | null;
  materialName: string;
  unit: string;
  issued: number;
  returned: number;
  wasted: number;
  returnRate: number;
}

export interface WmsSummary {
  summary: {
    totalMovements: number;
    totalIssued: number;
    totalReturned: number;
    totalWasted: number;
    overallReturnRate: number;
  };
  materials: WmsMaterialItem[];
  periodDays: number;
}

export interface MesStoppageReason {
  reasonCode: string;
  reasonDescription: string | null;
  count: number;
  totalMinutes: number;
}

export interface MesRecentStoppage {
  id: string;
  startedAt: string | null;
  reasonCode: string;
  reasonDescription: string | null;
  durationSeconds: number | null;
}

export interface MesMonthlyData {
  month: string;
  sessions: number;
  actual: number;
  target: number;
  defects: number;
}

export interface MesSummary {
  summary: {
    totalSessions: number;
    completedSessions: number;
    totalActual: number;
    totalTarget: number;
    totalDefects: number;
    defectPercent: number;
    avgOee: number;
    goalAchievement: number;
    totalRunningMinutes: number;
    totalStoppedMinutes: number;
    workTimeRatio: number;
    totalStoppages: number;
  };
  mostFrequentReason: { reasonCode: string; reasonDescription: string | null; count: number } | null;
  stoppageHistory: MesStoppageReason[];
  recentStoppages: MesRecentStoppage[];
  monthlyData: MesMonthlyData[];
  periodMonths: number;
}
