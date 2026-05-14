/**
 * @module pos-inventory-passport.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PosInventoryPassportRepository, CreatePassportDto, PassportRow } from './pos-inventory-passport.repository';
import { PosAuditService } from './services/pos-audit.service';
import { PosTelegramService } from './services/pos-telegram.service';

@Injectable()
export class PosInventoryPassportService {
  private readonly logger = new Logger(PosInventoryPassportService.name);

  constructor(
    private readonly repo:     PosInventoryPassportRepository,
    private readonly audit:    PosAuditService,
    private readonly telegram: PosTelegramService,
  ) {}

  async createPassport(dto: CreatePassportDto, userId: number): Promise<Result<PassportRow, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.create(dto);
      if (!r.ok) throw new Error(r.error.message);
      await this.audit.log({
        userId, action: 'pos.passport.created', entityType: 'pos_inventory_passport',
        entityId: r.data.id, newValue: dto as unknown as Record<string, unknown>,
      });
      return r.data;
    });
  }

  async getPassport(movementId: number): Promise<Result<PassportRow | null, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findByMovement(movementId);
      if (!r.ok) throw new Error(r.error.message);
      return r.data;
    });
  }

  async listPassports(opts: { fromDate?: string; toDate?: string; qcResult?: string; limit?: number; offset?: number }): Promise<Result<{ rows: PassportRow[]; total: number }, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findAll(opts);
      if (!r.ok) throw new Error(r.error.message);
      return r.data;
    });
  }

  async recordQcDecision(movementId: number, qcResult: 'QABUL' | 'REWORK' | 'CHIQARISH', qcNote: string | undefined, userId: number): Promise<Result<PassportRow, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.updateQcResult(movementId, qcResult, qcNote);
      if (!r.ok) throw new Error(r.error.message);
      if (qcResult === 'REWORK' || qcResult === 'CHIQARISH') {
        await this.telegram.sendAlert({ title: `QC: ${qcResult}`, body: `Harakat #${movementId} — ${qcResult}. ${qcNote ?? ''}`, severity: 'warning' }).catch(() => null);
      }
      await this.audit.log({
        userId, action: 'pos.passport.qc_decision', entityType: 'pos_inventory_passport',
        entityId: r.data.id, newValue: { qcResult, qcNote },
      });
      return r.data;
    });
  }

  async getQuarantineList(): Promise<Result<PassportRow[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getQuarantineList();
      if (!r.ok) throw new Error(r.error.message);
      return r.data;
    });
  }

  async checkExpiredQuarantine(): Promise<void> {
    const r = await this.repo.getExpiredQuarantine(48);
    if (!r.ok) return;
    for (const p of r.data) {
      this.logger.warn(`Karantin muddati o'tdi: passport #${p.id}, harakat #${p.movementId}`);
      await this.telegram.sendAlert({
        title: 'Karantin muddati tugadi',
        body: `Harakat #${p.movementId} uchun inventar pasporti 48 soatdan ko'p karantinda`,
        severity: 'critical',
      }).catch(() => null);
    }
  }
}
