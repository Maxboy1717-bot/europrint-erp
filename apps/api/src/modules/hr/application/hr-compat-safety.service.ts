/**
 * @module hr-compat-safety.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { safeInt } from '../common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { HR_COMPAT_SAFETY_REPO, type IHrCompatSafetyRepo } from '../domain/repositories/i-hr-compat-safety.repo';

@Injectable()
export class HrCompatSafetyService {
  private readonly logger = new Logger(HrCompatSafetyService.name);

  constructor(@Inject(HR_COMPAT_SAFETY_REPO) private readonly repo: IHrCompatSafetyRepo) {}

  async getBrandSettings(): Promise<Result<object | null, AppError>> {
    return this.repo.getBrandSettings();
  }

  async updateBrandSettings(body: Record<string, unknown>) {
    return this.repo.updateBrandSettings(JSON.stringify(body));
  }

  async getDocuments(docType?: string, status?: string) {
    return this.repo.getDocuments(docType, status);
  }

  async getDocumentWorkflowRoutes() {
    return this.repo.getDocumentWorkflowRoutes();
  }

  async archiveDocument(id: number) {
    return this.repo.archiveDocument(id);
  }

  async createSafetyIncident(incidentType: unknown, severity: unknown, description: unknown, locationDesc: unknown, departmentId: unknown, incidentDate: unknown) {
    return this.repo.createSafetyIncident(incidentType, severity, description, locationDesc, departmentId, incidentDate);
  }

  async getSafetyTrainings(employeeId?: string) {
    return safeCall(() => this.repo.getSafetyTrainings(employeeId ? safeInt(employeeId, 0) : undefined));
  }

  async createSafetyTraining(trainingId: unknown, employeeId: unknown, completedDate: unknown, expiryDate: unknown, score: unknown, isPassed: unknown) {
    return this.repo.createSafetyTraining(trainingId, employeeId, completedDate, expiryDate, score, isPassed);
  }

  async getHazardZones(departmentId?: string) {
    return safeCall(() => this.repo.getHazardZones(departmentId ? safeInt(departmentId, 0) : undefined));
  }

  async createHazardZone(zoneName: unknown, zoneCode: unknown, departmentId: unknown, hazardLevel: unknown, requiredPpe: unknown, maxOccupancy: unknown) {
    return this.repo.createHazardZone(zoneName, zoneCode, departmentId, hazardLevel, requiredPpe, maxOccupancy);
  }

  async getPpeCompliance(employeeId?: string) {
    return safeCall(() => this.repo.getPpeCompliance(employeeId ? safeInt(employeeId, 0) : undefined));
  }

  async createPpeCompliance(employeeId: unknown, ppeType: unknown, issueDate: unknown, expiryDate: unknown, isCompliant: unknown) {
    return this.repo.createPpeCompliance(employeeId, ppeType, issueDate, expiryDate, isCompliant);
  }

  async getLeaveRequests(employeeId?: string, status?: string) {
    return safeCall(() => this.repo.getLeaveRequests(employeeId ? safeInt(employeeId, 0) : undefined, status));
  }

  async createLeaveRequest(employeeId: unknown, startDate: unknown, endDate: unknown, reason: unknown) {
    return this.repo.createLeaveRequest(employeeId, startDate, endDate, reason);
  }

  async getGamLeaderboardMonthly() {
    return this.repo.getGamLeaderboardMonthly();
  }

  async getAdaptationMilestones(employeeId?: string) {
    return safeCall(() => this.repo.getAdaptationMilestones(employeeId ? safeInt(employeeId, 0) : undefined));
  }
}
