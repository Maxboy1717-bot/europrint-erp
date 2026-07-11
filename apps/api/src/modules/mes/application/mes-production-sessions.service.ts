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

  /** #116 (EP-MES-066): sessiyaga qog'oz formati (A×B) + gramm + kg yozadi (aniq material sarfi). */
  async setPaperFormat(sessionId: number, body: Record<string, unknown>) {
    return safeCall(async () => this.repo.setPaperFormat(sessionId, body));
  }

  /** GSD 3-bosqich (#9): joriy bosqichni yopib keyingisiga o'tadi (setup→main→teardown→done). */
  async advanceSessionStage(sessionId: number) {
    return safeCall(async () => this.repo.advanceSessionStage(sessionId));
  }

  async recordDowntimeForSession(sessionId: number, body: Record<string, unknown>) {
    return safeCall(async () => this.repo.recordDowntimeForSession(sessionId, body));
  }

  async listDowntimeEvents(sessionId: number) {
    return safeCall(async () => this.repo.listDowntimeEvents(sessionId));
  }

  /** Bosqich-asosli OEE Availability (#9): main / (setup+main+teardown). */
  async getStageBasedAvailability(sessionId?: number) {
    return safeCall(async () => this.repo.getStageBasedAvailability(sessionId));
  }

  /**
   * 08-mes#33 — Sessiyani Akademiya/o'quv (LMS-sync) deb belgilaydi; is_training=true ->
   * OEE shift-agregatidan chiqariladi. lms_enrollment_id (nullable) LMS ro'yxatga olish bog'lami.
   */
  async setSessionTraining(sessionId: number, body: { is_training: boolean; lms_enrollment_id?: number | null }) {
    return safeCall(async () =>
      this.repo.markSessionTraining(sessionId, body.is_training, body.lms_enrollment_id ?? null));
  }
}
