/**
 * @module mes-production-sessions.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MesProductionSessionsRepository } from '../infrastructure/repositories/mes-production-sessions.repo';

@Injectable()
export class MesProductionSessionsService {
  constructor(private readonly repo: MesProductionSessionsRepository) {}

  async listSessions(page: number, limit: number, status?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => this.repo.listSessions(page, limit, status));
  }

  async createSession(body: Record<string, unknown>) {
    return safeCall(async () => this.repo.createSession(body));
  }

  async getSession(id: number) {
    return safeCall(async () => this.repo.getSession(id));
  }

  async recordDowntimeForSession(sessionId: number, body: Record<string, unknown>) {
    return safeCall(async () => this.repo.recordDowntimeForSession(sessionId, body));
  }

  async listDowntimeEvents(sessionId: number) {
    return safeCall(async () => this.repo.listDowntimeEvents(sessionId));
  }
}
