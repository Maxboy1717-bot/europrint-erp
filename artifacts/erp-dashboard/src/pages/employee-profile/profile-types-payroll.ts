/**
 * @module profile-types-payroll
 * @description Payroll, compensation, leave, and contract interfaces.
 * Split from profile-types.ts (Rule 16).
 */

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
