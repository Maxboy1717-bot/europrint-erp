/**
 * @module hr-offboarding.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

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
}
