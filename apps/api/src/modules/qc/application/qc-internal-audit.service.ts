/**
 * @module qc-internal-audit.service
 * @description 09-qc #22 — Davriy ichki sifat auditi orchestration. Cron choraklik chaqiradi:
 *   joriy chorak period-yorlig'i ('YYYY-Qn') + rejalashtirilgan sana (chorak boshi) hisoblanib,
 *   repo.scheduleAudit orqali idempotent audit qatori yaratiladi. Qoida 1 (Result<T>),
 *   Qoida 15 (repo-owns-DB). FABRIKATSIYA YO'Q: faqat 'scheduled' qator; topilma/auditor keyin.
 * @layer Application (QC)
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { QcInternalAuditRepository } from '../infrastructure/repositories/qc-internal-audit.repo';

type Row = Record<string, unknown>;

@Injectable()
export class QcInternalAuditService {
  constructor(private readonly repo: QcInternalAuditRepository) {}

  /**
   * Berilgan sananing chorak yorlig'i ('YYYY-Qn') + chorak boshi sanasi ('YYYY-MM-01').
   * Lokal (Toshkent server) sana komponentlari — cron chorak boshining 1-kuni 02:00 da ishlaydi.
   */
  private quarterStart(d: Date): { period: string; scheduledFor: string } {
    const year = d.getFullYear();
    const quarter = Math.floor(d.getMonth() / 3) + 1; // 1..4
    const startMonth = (quarter - 1) * 3;             // 0,3,6,9
    const scheduledFor = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`;
    return { period: `${year}-Q${quarter}`, scheduledFor };
  }

  /**
   * Joriy chorak uchun davriy ichki auditni idempotent rejalashtiradi (cron kirish nuqtasi).
   * @returns yaratilgan qator, yoki null (chorak allaqachon rejalashtirilgan — dublikat yo'q).
   */
  async scheduleCurrentQuarter(now: Date = new Date()): Promise<Result<Row | null>> {
    const { period, scheduledFor } = this.quarterStart(now);
    return this.repo.scheduleAudit({ period, scheduledFor });
  }

  /** Rejalashtirilgan/jarayondagi auditlar ro'yxati. */
  async listUpcoming(): Promise<Result<Row[]>> {
    return this.repo.listUpcoming();
  }

  /** Audit topilmalarini yozadi + holatni yangilaydi (in_progress/completed/cancelled). */
  async recordFindings(id: number, findings: unknown, status: string): Promise<Result<Row>> {
    return this.repo.recordFindings(id, findings, status);
  }
}
