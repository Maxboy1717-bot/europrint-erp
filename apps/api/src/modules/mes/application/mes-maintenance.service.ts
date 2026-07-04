/**
 * @module mes-maintenance.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MesMaintenanceRepository } from '../infrastructure/repositories/mes-maintenance.repo';
import { MesSosEscalationService } from './mes-sos-escalation.service';

@Injectable()
export class MesMaintenanceService {
  constructor(
    private readonly repo: MesMaintenanceRepository,
    private readonly escalation: MesSosEscalationService,
  ) {}

  async listMaintenanceRequests(status: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return safeCall(async () => this.repo.listMaintenanceRequests(status, lim, off));
  }

  async createMaintenanceRequest(title: string, description: string | null, work_center_id: number | null, priority: string, userId: number | null) {
    return safeCall(async () => this.repo.createMaintenanceRequest(title, description, work_center_id, priority, userId));
  }

  async updateMaintenanceRequest(mid: number, status: string | null, assigned_to: number | null, notes: string | null, resolved_at: string | null) {
    return safeCall(async () => this.repo.updateMaintenanceRequest(mid, status, assigned_to, notes, resolved_at));
  }

  async listTasks(sid: number | null, status: string | undefined, lim: number) {
    return safeCall(async () => this.repo.listTasks(sid, status, lim));
  }

  async updateTaskProgress(tid: number, rawProgress: number, notes: string | undefined) {
    const progress = Math.min(100, Math.max(0, rawProgress));
    return safeCall(async () => {
      const status = progress >= 100 ? 'completed' : 'in_progress';
      return this.repo.updateTaskProgress(tid, progress, status, notes);
    });
  }

  /**
   * SOS yaratadi VA darhol org-zanjir eskalatsiyani biriktiradi (#11):
   * work_center → KARTA (org_departments) javobgar + deadline + bildirishnoma.
   * Eskalatsiya biriktirish muvaffaqiyatsiz bo'lsa ham SOS qatori saqlanadi (best-effort).
   */
  async createSos(session_id: number | null, reason: string, work_center_id: number | null, userId: number | null) {
    return safeCall(async () => {
      const rows = await this.repo.createSos(session_id, reason, work_center_id, userId);
      const created = Array.isArray(rows) ? rows[0] : null;
      const sosId = created && created.id != null ? Number(created.id) : null;
      if (sosId) {
        await this.escalation.assignOnRaise(sosId, work_center_id, reason);
      }
      return rows;
    });
  }

  async getSosHistory(lim: number) {
    return safeCall(async () => this.repo.getSosHistory(lim));
  }

  /** SOS hal qilindi → eskalatsiya to'xtaydi (#11). */
  async resolveSos(sosId: number, resolvedBy: number | null) {
    return this.escalation.resolve(sosId, resolvedBy);
  }

  async getDowntimeReasons() {
    return safeCall(async () => this.repo.getDowntimeReasons());
  }

  async createDowntimeEvent(session_id: number, reason_id: number | null, notes: string | null) {
    return safeCall(async () => this.repo.createDowntimeEvent(session_id, reason_id, notes));
  }

  async getDowntimeEvents(sid: number | null, lim: number) {
    return safeCall(async () => this.repo.getDowntimeEvents(sid, lim));
  }
}
