/**
 * @module applications.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ApplicationsRepository } from './applications.repository';

@Injectable()
export class ApplicationsService {
  constructor(private readonly repo: ApplicationsRepository) {}

  async list(status: string | null, positionId: number | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.list(status, positionId, lim, off);
  }

  async getById(id: number) {
    return this.repo.getById(id);
  }

  async create(body: Record<string, unknown>) {
    return this.repo.create(body);
  }

  async update(id: number, body: Record<string, unknown>) {
    return this.repo.update(id, body);
  }

  async delete(id: number) {
    return safeCall(async () => {
      const r = await this.repo.delete(id);
      if (!r.ok) throw new Error(String(r.error));
      return { deleted: true };
    });
  }

  async listResponses(applicationId: number | null, lim: number, off: number) {
    return this.repo.listResponses(applicationId, lim, off);
  }

  async getResponseById(id: number) {
    return this.repo.getResponseById(id);
  }

  async createResponse(body: Record<string, unknown>) {
    return this.repo.createResponse(body);
  }
}
