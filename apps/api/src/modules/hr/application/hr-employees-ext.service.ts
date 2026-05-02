import { Injectable, Logger } from '@nestjs/common';
import { safeInt } from '../common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { HrEmployeesExtRepository } from './hr-employees-ext.repository';

@Injectable()
export class HrEmployeesExtService {
  private readonly logger = new Logger(HrEmployeesExtService.name);

  constructor(private readonly repo: HrEmployeesExtRepository) {}

  async updateProfileImage(id: string, imageUrl: string): Promise<Result<object, AppError>> {
    return safeCall(() => this.repo.updateProfileImage(safeInt(id, 0), imageUrl));
  }

  async assignOrgFunctions(id: string, departmentId?: string, positionId?: string) {
    return safeCall(() => this.repo.assignOrgFunctions(safeInt(id, 0), departmentId, positionId));
  }

  async importEmployee(emp: Record<string, unknown>) {
    return this.repo.importEmployee(emp);
  }

  async getEmployeeAssets(id: string) {
    return this.repo.getEmployeeAssets(safeInt(id, 0));
  }

  async assignAsset(id: string, assetType: unknown, assetName: unknown, assetCode: unknown, assignedDate: unknown, notes: unknown) {
    return safeCall(() => this.repo.assignAsset(safeInt(id, 0), assetType, assetName, assetCode, assignedDate, notes));
  }

  async getEmployeeSwapRequests(employeeId: string, status?: string) {
    return safeCall(() => this.repo.getEmployeeSwapRequests(safeInt(employeeId, 0), status));
  }

  async getEmployeeComplaints(employeeId: string) {
    return this.repo.getEmployeeComplaints(employeeId);
  }

  async createComplaint(employeeId: string, party2: unknown, description: unknown, severity: unknown) {
    return this.repo.createComplaint(employeeId, party2, description, severity);
  }

  async getAssessmentSkips(employeeId: string) {
    return this.repo.getAssessmentSkips(safeInt(employeeId, 0));
  }

  async getEmployeesList(limit = 100, offset = 0) {
    const r = await this.repo.getEmployeesList(limit, offset);
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }
}
