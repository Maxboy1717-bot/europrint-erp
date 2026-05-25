/**
 * @module @workspace/types/hr
 * @description Canonical HR types — single source of truth.
 *   Previously scattered across 20+ files (AbcAnalysis, AttendanceRecord, etc.)
 */

// ── ABC Analysis ──────────────────────────────────────────────────────────────
export interface AbcAnalysis {
  id?: string | number;
  grade: string;
  score: number;
  testPassRate?: number;
  courseCompletionRate?: number;
  performanceRate?: number;
  attendanceRate?: number;
  disciplineScore?: number;
  taskCompletionRate?: number;
  punctualityRate?: number;
  initiativeCount?: number;
  benefits?: unknown[];
  notes?: string;
  lastCalculated?: string;
  [key: string]: unknown;
}

// ── Attendance Record ─────────────────────────────────────────────────────────
/** Canonical camelCase attendance record. @see employee.ts for the snake_case variant. */
export interface HrAttendanceRecord {
  id: string | number;
  userId?: string | number;
  employeeId?: string | number;
  date: string;
  status: string;                      // 'present' | 'absent' | 'late' | 'half_day'
  checkIn?: string | null;
  checkOut?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  lateMinutes?: number;
  overtimeMinutes?: number;
  isLate?: boolean;
  notes?: string | null;
  employeeName?: string;
  [key: string]: unknown;
}

// ── Leave Request ─────────────────────────────────────────────────────────────
export interface LeaveRequest {
  id: string | number;
  employeeId?: string | number;
  userId?: string | number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  status: string;                      // 'pending' | 'approved' | 'rejected'
  reason?: string | null;
  approvedBy?: string | number | null;
  approvedAt?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

// ── Discipline Record ─────────────────────────────────────────────────────────
export interface DisciplineRecord {
  id: string | number;
  userId?: string | number;
  employeeId?: string | number;
  date?: string;
  type: string;
  description?: string | null;
  issuedByName?: string | null;
  fineAmount?: number | null;
  createdAt?: string;
}

// ── Employee Goal ─────────────────────────────────────────────────────────────
export interface EmployeeGoal {
  id: number;
  employeeId: number;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  targetValue?: number | null;
  currentValue?: number | null;
  progressPct?: number | null;
  status?: string;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// ── Payroll Summary ───────────────────────────────────────────────────────────
export interface PayrollSummary {
  employeeId: number | string;
  employeeName?: string;
  baseSalary?: number;
  bonus?: number;
  deductions?: number;
  netSalary?: number;
  period?: string;
  status?: string;
  [key: string]: unknown;
}
