/**
 * @module types/hr
 * @description Canonical shared interfaces for HR domain types not covered by
 * types/shared.ts (Employee, Department, Position).
 *
 * IMPORTANT: Do NOT redefine AttendanceRecord in individual page/component files.
 * Import from here instead:
 *   import type { AttendanceRecord } from '@/types/hr';
 *
 * NOTE: SecurityDashboardTypes uses a completely different shape with
 * type/timestamp/method/location/isAnomaly — that is a SecurityAccessLog,
 * not an HR attendance record. It is kept local to SecurityDashboardTypes.ts.
 */

// ---------------------------------------------------------------------------
// AttendanceRecord
// ---------------------------------------------------------------------------

/**
 * Canonical AttendanceRecord interface.
 *
 * Merges 5 duplicate definitions found across:
 * components/hr/stats/types.ts, EmployeeTrackingReportTypes.ts,
 * employee-profile/profile-types.ts, employee-profile/profile-types-employee.ts,
 * SecurityExtendedTypes.ts
 *
 * Required: id, date, status
 * All other fields are optional — presence depends on the data source
 * (biometric check-in vs camera-tracking vs HR stats).
 *
 * id is string | number because:
 *   - hr/stats/types and EmployeeTrackingReport use string
 *   - profile-types and profile-types-employee use number
 *   - SecurityExtendedTypes uses number | string
 *
 * NOTE: SecurityDashboardTypes.ts defines an AttendanceRecord with
 * type/timestamp/method/location fields — that represents a security-door
 * access log, not an HR attendance row. Those files keep their own local type.
 */
export interface AttendanceRecord {
  id: string | number;
  date: string;
  status: string;

  // Employee reference
  userId?: string | number;
  employeeId?: string;
  employeeName?: string;

  // Biometric check-in/check-out (profile tabs, HR stats)
  checkIn?: string;
  checkOut?: string;

  // Late arrival
  isLate?: boolean;
  minutesLate?: number;

  // Camera-tracking fields (EmployeeTrackingReport)
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  totalMinutes?: number;
  workZoneMinutes?: number;
  restZoneMinutes?: number;
  detectionCount?: number;

  // General notes
  notes?: string;
}
