/**
 * @module reception.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';
import { HrV2Events } from '../events/hr-v2-events';
import { randomBytes } from 'crypto';
import { safeCall, Result, AppError } from '@common/result';
import { ReceptionRepository } from './reception.repository';

export interface BadgeValidationResult {
  valid: boolean;
  visitor_name?: string;
  host_name?: string;
  error?: string;
}

@Injectable()
export class ReceptionService {
  private readonly logger = new Logger(ReceptionService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: ReceptionRepository,
    private readonly i18n: I18nService,
  ) {}

  async checkInVisitor(dto: {
    visitorName: string;
    visitorPhone?: string;
    visitorCompany?: string;
    purpose: string;
    hostEmployeeId: number;
    registeredBy?: number;
    idDocument?: string;
    idDocumentType?: string;
  }) {
    return safeCall(async () => {
      const badgeNumber = `VB-${randomBytes(3).toString('hex').toUpperCase()}`;
      const row = await this.repo.checkInVisitor({ ...dto, badgeNumber });

      const rowData = (row?.ok ? row.data as Record<string, unknown> : {});
      this.eventEmitter.emit(HrV2Events.VISITOR_CHECKED_IN, {
        visitorId: rowData?.['id'],
        visitorName: dto.visitorName,
        hostEmployeeId: dto.hostEmployeeId,
        badgeCode: badgeNumber,
      });

      this.eventEmitter.emit(HrV2Events.TELEGRAM_SEND, {
        employeeId: dto.hostEmployeeId,
        message: `👤 Mehmon keldi: ${dto.visitorName} (${dto.visitorCompany || ''}).\nBetj raqami: ${badgeNumber}\nMaqsad: ${dto.purpose}`,
      });

      return { ...row, badge_number: badgeNumber };
    });
  }

  async checkOutVisitor(visitorId: number, notes?: string): Promise<Result<object | null, AppError>> {
    return safeCall(async () => {
      const row = await this.repo.checkOutVisitor(visitorId, notes);
      if (row && row.ok && row.data) {
        this.eventEmitter.emit(HrV2Events.VISITOR_CHECKED_OUT, {
          visitorId,
          visitorName: row.data['visitor_name'],
        });
      }
      return row;
    });
  }

  /**
   * Bug fixed: this used to return the raw repo Result straight through — on a match
   * that's the bare visitor_log row (no `valid` field at all), and on no-match it's
   * `{ ok: true, data: null }`. The FE (`ReceptionPage.tsx`) reads `validateResult.valid`
   * to decide green/red; since that key never existed on either shape, `valid` was always
   * `undefined` (falsy) — every scan rendered the red "badge noto'g'ri" box regardless of
   * whether the badge actually matched an active visit. Now the service always returns the
   * `{ valid, visitor_name?, host_name?, error? }` contract the FE expects.
   */
  async validateBadge(badgeNumber: string): Promise<Result<BadgeValidationResult, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.validateBadge(badgeNumber);
      if (!r.ok || !r.data) {
        return { valid: false, error: await this.i18n.t('errors.badgeInvalidOrExpired') };
      }
      const row = r.data;
      return {
        valid: true,
        visitor_name: row['visitor_name'] != null ? String(row['visitor_name']) : undefined,
        host_name: row['host_name'] != null ? String(row['host_name']) : undefined,
      };
    });
  }

  async getActiveVisitors() {
    return this.repo.getActiveVisitors();
  }

  async getVisitorLog(filters?: { date?: string; employeeId?: number; limit?: number }) {
    return this.repo.getVisitorLog(filters?.limit || 50);
  }

  async getStats() {
    return this.repo.getStats();
  }

  @Cron('0 23 * * *')
  async autoCheckoutOverdueVisitors() {
    try {
      const rows = await this.repo.autoCheckoutOverdue();
      if (rows.ok && rows.data.length > 0) {
        this.logger.warn(`Auto-checked out ${rows.data.length} overdue visitors`);
        for (const v of (rows.ok ? rows.data : [])) {
          this.eventEmitter.emit(HrV2Events.VISITOR_CHECKED_OUT, {
            visitorLogId: v['id'],
            hostEmployeeId: v['host_employee_id'],
            autoCheckout: true,
          });
        }
      }
    } catch (err) {
      this.logger.error('autoCheckoutOverdueVisitors error', errMsg(err));
    }
  }
}
