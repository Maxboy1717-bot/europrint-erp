import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { RaciRepository } from './raci.repository';

@Injectable()
export class RaciService {
  constructor(private readonly repo: RaciRepository) {}

  async listTasks(status: string | null): Promise<Result<object, AppError>> {
    return this.repo.listTasks(status);
  }

  async createTask(title: string, description: string | null, responsibleId: number | null, accountableId: number | null, createdBy: number, deadline: string | null) {
    return this.repo.createTask(title, description, responsibleId, accountableId, createdBy, deadline);
  }

  async getTaskAssignments(taskId: number) {
    return this.repo.getTaskAssignments(taskId);
  }

  async createAssignment(taskId: number, employeeId: number, role: string) {
    return this.repo.createAssignment(taskId, employeeId, role);
  }

  async deleteAssignment(id: number) {
    return this.repo.deleteAssignment(id);
  }

  async getStages() {
    return this.repo.getStages();
  }

  async listCrises(status: string | null) {
    return this.repo.listCrises(status);
  }

  async listAssessments() {
    return this.repo.listAssessments();
  }

  async createAssessment(title: string, riskLevel: string, description: string | null, likelihood: number, impact: number, assessorId: number) {
    return this.repo.createAssessment(title, riskLevel, description, likelihood, impact, assessorId);
  }
}
