/**
 * @module report-defect.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, Ok, safeCall, isErr } from '@common/result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ReportDefectCommand } from './report-defect.command';
import { Defect, DefectSeverity, DefectStatus } from '../../domain/aggregates/defect.aggregate';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';
import { FmeaService } from '../../domain/services/fmea.service';
import { FMEA_DEFECT_SOD_PROFILE } from '../../constants/qc.constants';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

type Row = Record<string, unknown>;

@Injectable()
@CommandHandler(ReportDefectCommand)
export class ReportDefectHandler implements ICommandHandler<ReportDefectCommand> {
  private readonly logger = new Logger(ReportDefectHandler.name);

  constructor(
    @Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
    private readonly eventBus: EventBus,
    private readonly fmeaService: FmeaService,
      ) {}

  async execute(command: ReportDefectCommand): Promise<Result<Defect>> {
      const extras = command.brakExtras;
      const defect = new Defect(
        this.generateId(),
        command.inspectionId,
        command.productionOrderId,
        command.workCenterId,
        command.defectCode,
        command.description,
        command.severity,
        DefectStatus.OPEN,
        command.quantity,
        command.unit,
        command.reportedBy,
        null,
        null,
        null,
        _time.now(),
        _time.now(),
        extras?.papkaOrderId ?? null,
        extras?.stage ?? null,
        extras?.costImpact ?? null,
        extras?.isReworkable ?? null,
        extras?.reworked ?? null,
        extras?.brakDate ?? null,
      );

      const saveResult = await this.qcRepository.saveDefect(defect);

      if (!saveResult.ok) {
        this.logger.error('Failed to save defect');
        return saveResult;
      }

      // VISION-3340 #43: FmeaService.calculateRpn ilgari hisoblanib TASHLAB
      // yuborilardi — FmeaService provider sifatida ro'yxatdan o'tgan, lekin hech
      // qanday oqimda chaqirilmagan. Endi nuqsonning FMEA RPN'i (S×O×D) hisoblanadi
      // va RPN>200 (requiresStopProduction) bo'lsa bog'langan ishlab chiqarish
      // buyurtmasi HAQIQATDA to'xtatiladi (qc_hold). Best-effort: to'xtatish xatosi
      // allaqachon saqlangan nuqsonni QAYTA-ORQAGA aylantirmaydi.
      const stopped = await this.stopProductionIfCriticalRpn(defect, command.severity);

      if (command.severity === 'critical') {
        this.eventBus.publish({
          eventType: ERP_EVENTS.QC_FAILED,
          defectId: defect.id,
          severity: command.severity,
          productionOrderId: defect.productionOrderId,
          requiresStopProduction: stopped,
          timestamp: _time.now(),
        });
        this.logger.log(
          stopped
            ? 'Critical defect reported — production placed on qc_hold (FMEA RPN > 200)'
            : 'Critical defect reported',
        );
      }

      return Ok(defect);
  }

  /**
   * VISION-3340 #43 — nuqsonning FMEA RPN'ini hisoblab (FmeaService.calculateRpn;
   * matematikasi O'ZGARTIRILMAYDI), kritik (RPN>200) bo'lsa bog'langan
   * production_orders'ni qc_hold holatiga o'tkazadi.
   *
   * Best-effort / non-fatal: hech qachon throw qilmaydi. `true` — buyurtma haqiqatan
   * qc_hold'ga o'tkazilgan bo'lsa; aks holda (kritik emas, bog'lanmagan, idempotent
   * no-op yoki DB xatosi) `false`. Nuqson yozuvi hech qanday holatda bekor qilinmaydi.
   */
  private async stopProductionIfCriticalRpn(
    defect: Defect,
    severity: DefectSeverity,
  ): Promise<boolean> {
    const sod = FMEA_DEFECT_SOD_PROFILE[severity];
    const rpnR = await this.fmeaService.calculateRpn(sod.severity, sod.occurrence, sod.detection);
    if (isErr(rpnR) || !rpnR.data.requiresStopProduction) {
      return false;
    }

    const orderId = Number(defect.productionOrderId);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      // Bog'langan (raqamli) ishlab chiqarish buyurtmasi yo'q — to'xtatadigan narsa yo'q.
      this.logger.debug(
        { defectId: defect.id, productionOrderId: defect.productionOrderId },
        'QC stop-production: kritik RPN, lekin raqamli buyurtma bog\'lanmagan — skip',
      );
      return false;
    }

    const updR = await this.putOrderOnQcHold(orderId, defect.defectCode, rpnR.data.rpn);
    if (isErr(updR)) {
      // Best-effort: nuqson saqlangan, faqat to'xtatish qo'llanilmadi (rollback yo'q).
      this.logger.error(
        { orderId, defectId: defect.id, error: updR.error.message },
        'QC stop-production: production_orders qc_hold UPDATE xatosi (nuqson saqlandi, hold o\'tkazilmadi)',
      );
      return false;
    }

    if (updR.data) {
      this.logger.warn(
        { orderId, defectId: defect.id, rpn: rpnR.data.rpn },
        'QC stop-production ⛔ — kritik RPN (>200): ishlab chiqarish buyurtmasi qc_hold holatiga o\'tkazildi',
      );
      return true;
    }

    // 0 qator: buyurtma topilmadi yoki allaqachon qc_hold/terminal (idempotent no-op).
    this.logger.debug(
      { orderId, defectId: defect.id },
      'QC stop-production: mos ochiq buyurtma topilmadi yoki allaqachon qc_hold/terminal — skip (idempotent)',
    );
    return false;
  }

  /**
   * production_orders'ni qc_hold holatiga o'tkazadi (idempotent, additiv notes).
   * qc-rework.listener.ts `returnToRework` naqshining aynan nusxasi — faqat maqsad
   * status ('qc_hold') va guard (terminal/allaqachon-hold holatlarini o'tkazmaslik)
   * farq qiladi. Bir kritik nuqson uchun aynan bitta qc_hold o'tishi (WHERE status
   * NOT IN (...)); 0 qator = xavfsiz no-op. Soft-delete'langan buyurtma o'tkazilmaydi.
   */
  private async putOrderOnQcHold(
    orderId: number,
    defectCode: string,
    rpn: number,
  ): Promise<Result<boolean>> {
    return safeCall(async () => {
      const note = `[QC stop-production] kritik nuqson ${defectCode} (RPN ${rpn} > 200) — ishlab chiqarish to'xtatildi`;

      const upd = await db.execute<Row>(sql`
        UPDATE production_orders
        SET status = 'qc_hold',
            notes = CASE
                      WHEN notes IS NULL OR notes = '' THEN ${note}
                      ELSE notes || E'\n' || ${note}
                    END,
            updated_at = NOW()
        WHERE id = ${orderId}
          AND deleted_at IS NULL
          AND status NOT IN ('qc_hold', 'completed', 'cancelled')
        RETURNING id
      `);
      const list = Array.isArray((upd as { rows?: Row[] }).rows)
        ? ((upd as { rows: Row[] }).rows)
        : (Array.isArray(upd) ? (upd as Row[]) : []);
      return list.length > 0;
    }, 'DB_ERROR');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
