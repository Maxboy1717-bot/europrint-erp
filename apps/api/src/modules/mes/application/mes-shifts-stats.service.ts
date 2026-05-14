/**
 * @module mes-shifts-stats.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MesShiftsStatsRepository } from '../infrastructure/repositories/mes-shifts-stats.repo';

@Injectable()
export class MesShiftsStatsService {
  constructor(private readonly repo: MesShiftsStatsRepository) {}

  async getCurrentShift(): Promise<Result<object | null, AppError>> {
    return safeCall(async () => this.repo.getCurrentShift());
  }

  async shiftHandover(outgoing_supervisor: number, incoming_supervisor: number, notes: string | null, issues: string | null) {
    return safeCall(async () => this.repo.shiftHandover(outgoing_supervisor, incoming_supervisor, notes, issues));
  }

  async closeShiftEvaluation(shift_id: number, supervisor_id: number | null, production_score: number, quality_score: number, safety_score: number, notes: string | null) {
    return safeCall(async () => this.repo.closeShiftEvaluation(shift_id, supervisor_id, production_score, quality_score, safety_score, notes));
  }

  async getShiftEvaluations(from: string | undefined, to: string | undefined, lim: number) {
    return safeCall(async () => this.repo.getShiftEvaluations(from, to, lim));
  }

  async getOee() {
    return safeCall(async () => this.repo.getOee());
  }

  async getStats(date?: string) {
    return safeCall(async () => {
      const d = date ?? _time.now().toISOString().split('T')[0];
      return this.repo.getStats(d);
    });
  }

  async getGamificationLeaderboard(period: string) {
    return safeCall(async () => {
      const validPeriods: Record<string, string> = { daily: '1 day', weekly: '7 days', monthly: '30 days' };
      const interval = validPeriods[period] ?? '7 days';
      return this.repo.getGamificationLeaderboard(interval);
    });
  }

  async getPapkaOrders(status: string | undefined, lim: number, off: number) {
    return safeCall(async () => this.repo.getPapkaOrders(status, lim, off));
  }

  async pauseSession(sid: number, reason: string | undefined) {
    return safeCall(async () => this.repo.pauseSession(sid, reason));
  }

  async resumeSession(sid: number) {
    return safeCall(async () => this.repo.resumeSession(sid));
  }

  async updateSessionQuantity(sid: number, produced_qty?: number, rejected_qty?: number) {
    return safeCall(async () => this.repo.updateSessionQuantity(sid, produced_qty, rejected_qty));
  }

  async recordMaterialConsumption(session_id: number, material_id: number, quantity: number, batch_number: string | null) {
    return safeCall(async () => this.repo.recordMaterialConsumption(session_id, material_id, quantity, batch_number));
  }
}
