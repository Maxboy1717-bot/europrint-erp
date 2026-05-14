/**
 * @module types
 * @description React UI component.
 */

import { LucideIcon } from "lucide-react";

export interface HREmployee {
  id: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  department?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  positionId?: string;
  positionName?: string;
  role?: string;
  status?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  createdAt?: string;
}

export interface HRLeaveRequest {
  id: number | string;
  employeeName?: string;
  userId?: number | string;
  employeeId?: number | string;
  type?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  reason?: string;
}

export interface Department {
  id: string;
  name: string;
  nameRu?: string;
}

export interface CareerPlan {
  id: string;
  employee_name?: string;
  target_position_title?: string;
  current_position_title?: string;
  status?: string;
  target_date?: string;
}

export interface ConflictReport {
  id: string;
  party1: string;
  party2: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface SafetyIncident {
  id: number;
  userId: string;
  userName?: string;
  incidentType: string;
  severity: string;
  description: string;
  incidentDate: string;
  reportedBy?: string;
  status: string;
  location?: string;
  createdAt?: string;
}

export interface PpeRecord {
  id: number;
  userId: string;
  userName?: string;
  ppeType: string;
  status: string;
  issuedDate?: string;
  expiryDate?: string;
  notes?: string;
}

export interface SafetyTraining {
  id: number;
  userId: string;
  userName?: string;
  trainingName: string;
  trainingType?: string;
  scheduledDate?: string;
  completedDate?: string;
  expiryDate?: string;
  status: string;
  trainer?: string;
  notes?: string;
}

export interface HazardZone {
  id: number;
  zoneName: string;
  location?: string;
  hazardType?: string;
  description?: string;
  controlMeasures?: string;
  riskLevel: string;
  isActive: boolean;
}

export interface SafetySummary {
  incidentsThisMonth: number;
  ppeCompliancePercent: number;
  expiringTrainings: number;
  openIncidents: number;
}

export interface DeptSafetySummary {
  departmentId: string | null;
  departmentName: string;
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  thisMonthIncidents: number;
  ppeCompliancePercent: number | null;
  expiringTrainings: number;
}

export interface AlumniRecord {
  id: string;
  fullName: string;
  lastPosition?: string;
  departmentName?: string;
  exitDate?: string;
  exitType?: string;
  currentEmployer?: string;
  contactEmail?: string;
  isReturned?: boolean;
  collaborationProject?: string;
}

export interface AlumniResponse {
  alumni: AlumniRecord[];
  stats: { total: number; returned: number; collaborations: number };
}

export interface HealthCheckup {
  id: string;
  departmentId?: string;
  departmentName: string;
  totalEmployees?: number;
  examinedCount?: number;
  lastCheckupDate?: string;
  nextCheckupDate?: string;
  status?: string;
}

export interface HealthResponse {
  checkups: HealthCheckup[];
  stats: { totalExamined: number; totalEmployees: number; scheduled: number; highSick: number };
}

export interface ChecklistItem {
  id: string;
  userId: string;
  type: string;
  completedItems?: number;
  totalItems?: number;
  fullName?: string;
}

export interface TabMeta {
  title: string;
  icon: LucideIcon;
}
