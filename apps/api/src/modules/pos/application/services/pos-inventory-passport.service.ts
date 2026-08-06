/**
 * @module pos-inventory-passport.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { getBusinessSettingNumber } from '../../../../shared/config/business-settings.reader';
import { PosInventoryPassportRepository, CreatePassportDto, PassportRow } from '../../infrastructure/repositories/pos-inventory-passport.repository';
import { PosAuditService } from './pos-audit.service';
import { PosTelegramService } from './pos-telegram.service';

@Injectable()
export class PosInventoryPassportService {
  private readonly logger = new Logger(PosInventoryPassportService.name);

  constructor(
    private readonly repo:     PosInventoryPassportRepository,
    private readonly audit:    PosAuditService,
    private readonly telegram: PosTelegramService,
  ) {}

  async createPassport(dto: CreatePassportDto, userId: number): Promise<Result<PassportRow, AppError>> {
    const r = await this.repo.create(dto);
    if (!r.ok) return Err(r.error);
    await this.audit.log({
      userId, action: 'pos.passport.created', entityType: 'pos_inventory_passport',
      entityId: r.data.id, newValue: dto as unknown as Record<string, unknown>,
    });
    return Ok(r.data);
  }

  async getPassport(movementId: number): Promise<Result<PassportRow | null, AppError>> {
    const r = await this.repo.findByMovement(movementId);
    if (!r.ok) return Err(r.error);
    return Ok(r.data);
  }

  async listPassports(opts: { fromDate?: string; toDate?: string; qcResult?: string; limit?: number; offset?: number }): Promise<Result<{ rows: PassportRow[]; total: number }, AppError>> {
    const r = await this.repo.findAll(opts);
    if (!r.ok) return Err(r.error);
    return Ok(r.data);
  }

  async recordQcDecision(movementId: number, qcResult: 'QABUL' | 'REWORK' | 'CHIQARISH', qcNote: string | undefined, userId: number): Promise<Result<PassportRow, AppError>> {
    const r = await this.repo.updateQcResult(movementId, qcResult, qcNote);
    if (!r.ok) return Err(r.error);
    if (qcResult === 'REWORK' || qcResult === 'CHIQARISH') {
      await this.telegram.sendAlert({ title: `QC: ${qcResult}`, body: `Harakat #${movementId} — ${qcResult}. ${qcNote ?? ''}`, severity: 'warning' }).catch(() => null);
    }
    await this.audit.log({
      userId, action: 'pos.passport.qc_decision', entityType: 'pos_inventory_passport',
      entityId: r.data.id, newValue: { qcResult, qcNote },
    });
    return Ok(r.data);
  }

  async getQuarantineList(): Promise<Result<PassportRow[], AppError>> {
    const r = await this.repo.getQuarantineList();
    if (!r.ok) return Err(r.error);
    return Ok(r.data);
  }

  async checkExpiredQuarantine(): Promise<void> {
    // audit 2026-08-06 T23A: was a hardcoded 48 while the sibling escalation path
    // (quarantine-workflow.service.ts) reads pos.quarantine_escalation_hours from
    // business_settings — the two paths diverged whenever the owner changed the CRUD
    // value. Both now read the same key.
    const hours = await getBusinessSettingNumber('pos.quarantine_escalation_hours', 48);
    const r = await this.repo.getExpiredQuarantine(hours);
    if (!r.ok) return;
    for (const p of r.data) {
      this.logger.warn(`Karantin muddati o'tdi: passport #${p.id}, harakat #${p.movementId}`);
      await this.telegram.sendAlert({
        title: 'Karantin muddati tugadi',
        body: `Harakat #${p.movementId} uchun inventar pasporti ${hours} soatdan ko'p karantinda`,
        severity: 'critical',
      }).catch(() => null);
    }
  }
}
