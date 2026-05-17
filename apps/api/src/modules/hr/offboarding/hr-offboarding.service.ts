import { Injectable } from '@nestjs/common';
import { HrOffboardingRepository } from './hr-offboarding.repository';
import { Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class HrOffboardingService {
  constructor(private readonly repo: HrOffboardingRepository) {}

  updateChecklistItem(caseId: number, itemId: number, done: boolean): Promise<Result<Row>> {
    return this.repo.updateChecklistItem(caseId, itemId, done);
  }

  recordExitInterview(caseId: number, notes: string): Promise<Result<Row>> {
    return this.repo.recordExitInterview(caseId, notes);
  }

  finalizeCase(caseId: number): Promise<Result<Row>> {
    return this.repo.finalizeCase(caseId);
  }

  getCaseById(caseId: number): Promise<Result<Row | null>> {
    return this.repo.findCaseById(caseId);
  }

  listCases(filters: { status?: string; search?: string; limit?: number }): Promise<Result<Row[]>> {
    return this.repo.findCases(filters);
  }

  getStats(): Promise<Result<Row>> {
    return this.repo.getCaseStats();
  }

  createCase(dto: {
    employeeId: number;
    initiatedBy?: number;
    dismissalType?: string;
    lastWorkingDay?: string;
    totalItems?: number;
  }): Promise<Result<Row>> {
    return this.repo.createCase(dto);
  }
}
