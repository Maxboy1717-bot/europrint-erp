import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MesMaintenanceRepository } from '../infrastructure/repositories/mes-maintenance.repo';

@Injectable()
export class MesMaintenanceService {
  constructor(private readonly repo: MesMaintenanceRepository) {}

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

  async createSos(session_id: number | null, reason: string, work_center_id: number | null, userId: number | null) {
    return safeCall(async () => this.repo.createSos(session_id, reason, work_center_id, userId));
  }

  async getSosHistory(lim: number) {
    return safeCall(async () => this.repo.getSosHistory(lim));
  }

  async getDowntimeReasons() {
    return safeCall(async () => this.repo.getDowntimeReasons());
  }

  async createDowntimeEvent(session_id: number, reason_id: number | null, notes: string | null) {
    return safeCall(async () => this.repo.createDowntimeEvent(session_id, reason_id, notes));
  }

  async getDowntimeEvents(sid: number) {
    return safeCall(async () => this.repo.getDowntimeEvents(sid));
  }
}
