/**
 * @module kaizen.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { KaizenRepository } from './kaizen.repository';

@Injectable()
export class KaizenService {
  constructor(private readonly repo: KaizenRepository) {}

  async createSuggestion(title: string, description: string, category: string, expectedBenefit: string | null, submittedBy: number): Promise<Result<object, AppError>> {
    return this.repo.createSuggestion(title, description, category, expectedBenefit, submittedBy);
  }

  async listSuggestions(status: string | null, category: string | null, lim: number, off: number) {
    return this.repo.listSuggestions(status, category, lim, off);
  }

  async getSuggestion(id: number) {
    return this.repo.getSuggestion(id);
  }

  async updateSuggestion(id: number, status: string | null, reviewComment: string | null, implementationNotes: string | null, reviewedBy: number) {
    return this.repo.updateSuggestion(id, status, reviewComment, implementationNotes, reviewedBy);
  }

  async getStats() {
    return this.repo.getStats();
  }
}
