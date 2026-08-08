/**
 * @module i-hr-compat-safety.repo
 * @description Domain repository interface for HR safety / brand / documents
 *   / adaptation legacy compat layer.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/hr-compat-safety.repository.ts`.
 * @layer Domain (HR)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IHrCompatSafetyRepo {
  getBrandSettings(): Promise<Result<Row | null>>;
  updateBrandSettings(jsonData: string): Promise<void>;
  getDocuments(docType?: string, status?: string): Promise<Result<Row[]>>;
  getDocumentWorkflowRoutes(): Promise<Result<Row[]>>;
  archiveDocument(id: number): Promise<void>;
  // P1.23.1: list + delete safety incidents (was missing — FE calls GET/DELETE)
  getSafetyIncidents(statusFilter?: string): Promise<Result<Row[]>>;
  deleteSafetyIncident(id: number): Promise<void>;
  createSafetyIncident(
    incidentType: unknown,
    severity: unknown,
    description: unknown,
    locationDesc: unknown,
    departmentId: unknown,
    incidentDate: unknown,
  ): Promise<Result<Row>>;
  getSafetyTrainings(employeeId?: number): Promise<Result<Row[]>>;
  createSafetyTraining(
    trainingId: unknown,
    employeeId: unknown,
    completedDate: unknown,
    expiryDate: unknown,
    score: unknown,
    isPassed: unknown,
    trainingName?: unknown,
  ): Promise<Result<Row>>;
  getHazardZones(departmentId?: number): Promise<Result<Row[]>>;
  createHazardZone(
    zoneName: unknown,
    zoneCode: unknown,
    departmentId: unknown,
    hazardLevel: unknown,
    requiredPpe: unknown,
    maxOccupancy: unknown,
    location?: unknown,
    hazardType?: unknown,
    description?: unknown,
  ): Promise<Result<Row>>;
  getPpeCompliance(employeeId?: number): Promise<Result<Row[]>>;
  createPpeCompliance(
    employeeId: unknown,
    ppeType: unknown,
    issueDate: unknown,
    expiryDate: unknown,
    isCompliant: unknown,
  ): Promise<Result<Row>>;
  getLeaveRequests(employeeId?: number, status?: string): Promise<Result<Row[]>>;
  createLeaveRequest(
    employeeId: unknown,
    startDate: unknown,
    endDate: unknown,
    reason: unknown,
    leaveType?: unknown,
    userId?: unknown,
  ): Promise<Result<Row>>;
  getGamLeaderboardMonthly(): Promise<Result<Row[]>>;
  getAdaptationMilestones(employeeId?: number): Promise<Result<Row[]>>;

  // 3.14: adaptatsiya (moslashuv) checklist — CRUD + status-flow
  getAdaptationPrograms(): Promise<Result<Row[]>>;
  createAdaptationProgram(data: Record<string, unknown>): Promise<Result<Row>>;
  getAdaptationRecords(employeeId?: number, status?: string): Promise<Result<Row[]>>;
  getAdaptationRecordByEmployee(employeeId: number): Promise<Result<Row | null>>;
  createAdaptationRecord(
    employeeId: number,
    programId: number | null,
    mentorId: number | null,
    startDate: string | null,
    createdBy: number | null,
  ): Promise<Result<Row>>;
  createAdaptationMilestones(recordId: number, startDate: string): Promise<Result<Row[]>>;
  getAdaptationRecordMilestones(recordId: number): Promise<Result<Row[]>>;
  updateAdaptationMilestoneStatus(
    milestoneId: number,
    status: string,
    notes: string | null,
    verifiedBy: number | null,
  ): Promise<Result<Row>>;
  recomputeAdaptationProgress(recordId: number): Promise<Result<Row | null>>;
}

export const HR_COMPAT_SAFETY_REPO = Symbol('HR_COMPAT_SAFETY_REPO');
