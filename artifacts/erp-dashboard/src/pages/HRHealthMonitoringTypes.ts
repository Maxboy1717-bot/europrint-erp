/**
 * @module HRHealthMonitoringTypes
 * @description Types for HRHealthMonitoring page.
 */

export interface HealthCheckup {
  id: string;
  departmentName?: string;
  department_name?: string;
  checkupDate?: string;
  last_checkup_date?: string;
  nextCheckupDate?: string;
  next_checkup_date?: string;
  totalEmployees?: number;
  total_employees?: number;
  examinedCount?: number;
  examined_count?: number;
  status?: string;
  checkupType?: string;
  notes?: string;
}
