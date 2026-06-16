/**
 * POS — Event Handlers (movement-related)
 * EventEmitter2 orqali modular event-driven arxitektura
 *
 *   Request / Inventory / Stock / GL / HR handlerlari `pos-secondary-events.handler.ts` ichida (Rule 16).
 *   Event payload types — `pos.events.types.ts` ichida.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { execPosMovementMarkAiProcessing } from '@common/database/queries-remaining';

import { PosTelegramService }      from '../services/pos-telegram.service';
import { LabelService }            from '../services/label.service';
import { PosNotificationsService } from '../services/pos-notifications.service';
import { PosEventRepository }      from '../../infrastructure/repositories/pos-event.repository';
import { AutoBarcodeService }      from '../services/auto-barcode.service';
import { AutoGlPostingService }    from '../services/auto-gl-posting.service';
import { GlPostingLogService }     from '../services/gl-posting-log.service';
import { QuarantineWorkflowService } from '../services/quarantine-workflow.service';
import { ThreeWayMatchService }    from '../services/three-way-match.service';
import { broadcastPosEvent }       from '../../presentation/pos.gateway';
import type {
  MovementCreatedEvent,
  MovementStatusChangedEvent,
  QcDecisionEvent,
} from '../../domain/events/pos.events.types';

// Re-export types so existing imports keep working
export type {
  MovementCreatedEvent,
  MovementStatusChangedEvent,
  QcDecisionEvent,
  RequestEvent,
  HrEmployeeExitEvent,
} from '../../domain/events/pos.events.types';

@Injectable()
export class PosEventHandler {
  private readonly logger = new Logger(PosEventHandler.name);

  constructor(
    private readonly telegramService: PosTelegramService,
    private readonly labelService:    LabelService,
    private readonly notifications:   PosNotificationsService,
    private readonly eventRepo:       PosEventRepository,
    private readonly autoBarcode:     AutoBarcodeService,
    private readonly autoGl:          AutoGlPostingService,
    private readonly glLedger:        GlPostingLogService,
    private readonly quarantine:      QuarantineWorkflowService,
    private readonly threeWay:        ThreeWayMatchService,
  ) {}

  private n(userId: number, type: string, title: string, body: string, entityId?: number): void {
    void this.notifications.sendNotification(userId, type, title, body, 'pos_movements', entityId);
  }

  @OnEvent('pos.movement.data.created')
  async onMovementCreated(payload: MovementCreatedEvent) {
    this.logger.debug(`Event: pos.movement.created — ${payload.movementNumber}`);
    broadcastPosEvent('movement.created', { id: payload.movementId, movementNumber: payload.movementNumber, movementType: payload.typeCode, status: 'draft', createdAt: new Date().toISOString() });
    this.n(payload.createdById, 'MOVEMENT_CREATED', 'Harakat yaratildi', `${payload.movementNumber} yaratildi`, payload.movementId);

    if (payload.typeCode === 'EXTERNAL_IN') {
      // Auto-karantin: EXTERNAL_IN avtomatik QC-HOLD omborga
      try {
        const qR = await this.quarantine.moveToQuarantine(payload.movementId);
        if (qR.ok) {
          this.logger.log(`[AutoQuarantine] ${payload.movementNumber} → karantin statusiga ko'chirildi`);
        }
      } catch (e) {
        this.logger.warn(`[AutoQuarantine] xato (${payload.movementNumber}): ${String(e)}`);
      }

      // Auto-barkod: har qator material uchun CODE128 barkod yaratiladi
      try {
        const bcR = await this.autoBarcode.generateForMovement(payload.movementId);
        if (bcR.ok) {
          this.logger.log(`[AutoBarcode] ${payload.movementNumber}: ${bcR.data.created} ta barkod yaratildi`);
        }
      } catch (e) {
        this.logger.warn(`[AutoBarcode] xato (${payload.movementNumber}): ${String(e)}`);
      }

      // QC bildirishnomalar
      try { await this.telegramService.notifyQcRequired(payload.movementId, payload.movementNumber); } catch { /* noop */ }
      try {
        const qcUsers = await this.eventRepo.findByRoles(['qc_inspector']);
        for (const u of qcUsers) {
          this.n(u.id, 'QC_PENDING', 'QC tekshiruvi kerak', `Harakat ${payload.movementNumber} QC kutmoqda`, payload.movementId);
        }
      } catch { /* noop */ }
    }
  }

  @OnEvent('pos.movement.data.pending')
  async onMovementPending(payload: MovementStatusChangedEvent) {
    this.logger.debug(`Event: pos.movement.pending — ${payload.movementNumber}`);
    const managers = await this.eventRepo.findByRoles(['warehouse_manager', 'pos_manager']);
    // Pattern 2: per-manager Telegram notifies are independent — fan out in parallel
    await Promise.all(managers.map(async (mgr) => {
      if (mgr.telegramId) {
        await this.telegramService.notifyMovementApprovalRequired(payload.movementId, payload.movementNumber, mgr.id);
      }
      this.n(mgr.id, 'MOVEMENT_PENDING', 'Tasdiqlash kerak', `${payload.movementNumber} tasdiqlashni kutmoqda`, payload.movementId);
    }));
    this.n(payload.updatedById, 'MOVEMENT_PENDING', 'Harakat yuborildi', `${payload.movementNumber} tasdiqlashga yuborildi`, payload.movementId);
  }

  @OnEvent('pos.movement.data.approved')
  async onMovementApproved(payload: MovementStatusChangedEvent) {
    this.logger.log(`Event: pos.movement.approved — ${payload.movementNumber}`);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: payload.newStatus });
    this.n(payload.updatedById, 'MOVEMENT_APPROVED', 'Harakat tasdiqlandi', `${payload.movementNumber} tasdiqlandi`, payload.movementId);
    const mv = await this.eventRepo.findMovementCreator(payload.movementId);
    if (mv?.createdBy) {
      this.n(mv.createdBy, 'MOVEMENT_APPROVED', 'Harakatingiz tasdiqlandi', `${payload.movementNumber} tasdiqlandi`, payload.movementId);
    }
    if (mv?.movementType === 'EXTERNAL_IN') {
      await execPosMovementMarkAiProcessing(payload.movementId);
      broadcastPosEvent('stock.alert', { type: 'movement_posted', movementId: payload.movementId, ts: new Date().toISOString() });
      // MES integration — notify manufacturing that raw materials are approved/received
      broadcastPosEvent('mes.material_received', {
        movementId: payload.movementId,
        movementNumber: payload.movementNumber,
        ts: new Date().toISOString(),
      });
      this.logger.log(`[MES] Material qabul qilindi signali yuborildi: ${payload.movementNumber}`);
    }

    // AVTOMATIK GL POSTING — har tasdiqlangan harakat uchun
    try {
      const glR = await this.autoGl.postForMovement(payload.movementId);
      if (glR.ok && glR.data.posted > 0) {
        this.logger.log(`[AutoGL] ${payload.movementNumber}: ${glR.data.posted} ta GL yozuvi avtomatik yaratildi`);
        broadcastPosEvent('gl.posted', {
          movementId: payload.movementId,
          movementNumber: payload.movementNumber,
          entriesCount: glR.data.posted,
        });
      }
    } catch (e) {
      this.logger.warn(`[AutoGL] xato (${payload.movementNumber}): ${String(e)}`);
    }

    // AVTOMATIK 3-WAY MATCH — EXTERNAL_IN tasdiqlanganda
    if (mv?.movementType === 'EXTERNAL_IN') {
      try {
        const tmR = await this.threeWay.autoMatchAll();
        if (tmR.ok && tmR.data.processed > 0) {
          this.logger.log(`[3WayMatch] ${tmR.data.processed} ta movement avtomatik solishtirildi`);
        }
      } catch (e) {
        this.logger.warn(`[3WayMatch] xato: ${String(e)}`);
      }
    }
    // MES: production material allocated (INTERNAL_ISSUE to department)
    if (mv?.movementType === 'INTERNAL_ISSUE') {
      broadcastPosEvent('mes.material_issued', {
        movementId: payload.movementId,
        movementNumber: payload.movementNumber,
        ts: new Date().toISOString(),
      });
      this.logger.log(`[MES] Material berildi signali yuborildi: ${payload.movementNumber}`);
    }
  }

  @OnEvent('pos.movement.data.completed')
  async onMovementCompleted(payload: MovementStatusChangedEvent) {
    this.logger.log(`Event: pos.movement.completed — ${payload.movementNumber}`);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: 'completed' });
    const mv = await this.eventRepo.findMovementCreator(payload.movementId);
    if (mv?.createdBy) { this.n(mv.createdBy, 'MOVEMENT_COMPLETED', 'Harakat yakunlandi', `${payload.movementNumber} bajarildi`, payload.movementId); }
    const finUsers = await this.eventRepo.findByRoles(['finance_head']);
    for (const u of finUsers) { this.n(u.id, 'MOVEMENT_COMPLETED', 'Harakat yakunlandi', `${payload.movementNumber} stock ledgerga yozildi`, payload.movementId); }

    // #03 HOP-5: auto-post the completed movement to the canonical `entries` ledger (idempotent,
    // mapping-driven). Best-effort: a missing gl_account_mapping just logs, never fails the movement (Q-40).
    try {
      await this.glLedger.postMovementToCanonicalLedger(payload.movementId, payload.updatedById ?? 0);
      broadcastPosEvent('gl.posted', { movementId: payload.movementId, movementNumber: payload.movementNumber, ledger: 'entries' });
    } catch (e) {
      this.logger.warn(`[GL→entries] completed-post xato (${payload.movementNumber}): ${String(e)}`);
    }
  }

  @OnEvent('pos.movement.data.cancelled')
  async onMovementCancelled(payload: MovementStatusChangedEvent) {
    this.logger.log(`Event: pos.movement.cancelled — ${payload.movementNumber}`);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: 'cancelled' });
    const mv = await this.eventRepo.findMovementCreator(payload.movementId);
    if (mv?.createdBy) { this.n(mv.createdBy, 'MOVEMENT_CANCELLED', 'Harakat bekor qilindi', `${payload.movementNumber} bekor qilindi`, payload.movementId); }
  }

  @OnEvent('pos.movement.data.ai_processing')
  async onMovementAiProcessing(payload: MovementStatusChangedEvent) {
    this.logger.log(`Event: pos.movement.ai_processing — ${payload.movementNumber}`);
    try { await this.labelService.autoLabelForMovement(payload.movementId); } catch (err) { this.logger.error(`Label chop xatosi: ${(err as Error).message}`); }
    this.n(payload.updatedById, 'AI_PROCESSING_STARTED', 'AI GL boshlandi', `${payload.movementNumber} AI GL processing boshlandi`, payload.movementId);
  }

  @OnEvent('pos.movement.data.qc_approved')
  onMovementQcApproved(payload: MovementStatusChangedEvent) {
    this.n(payload.updatedById, 'QC_APPROVED', 'QC tasdiqlandi', `${payload.movementNumber} QC tasdiqlandi`, payload.movementId);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: 'qc_approved' });
  }

  @OnEvent('pos.movement.data.qc_rework')
  onMovementQcRework(payload: MovementStatusChangedEvent) {
    this.n(payload.updatedById, 'QC_REWORK', 'QC qayta ishlash', `${payload.movementNumber} qayta ishlashga yuborildi`, payload.movementId);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: 'qc_rework' });
  }

  @OnEvent('pos.movement.data.qc_rejected')
  onMovementQcRejected(payload: MovementStatusChangedEvent) {
    this.n(payload.updatedById, 'QC_REJECTED', 'QC rad etildi', `${payload.movementNumber} QC rad etildi`, payload.movementId);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: 'qc_rejected' });
  }

  @OnEvent('pos.qc.decision')
  async onQcDecision(payload: QcDecisionEvent) {
    this.logger.debug(`Event: pos.qc.decision — movement=${payload.movementId}`);
    const mv = await this.eventRepo.findMovementCreator(payload.movementId);
    if (mv?.telegramId) {
      const emoji = payload.decision === 'APPROVED' ? '✅' : payload.decision === 'REWORK' ? '🔄' : '❌';
      const dec = ({ APPROVED: 'tasdiqlandi', REWORK: 'qayta ishlashga', REJECTED: 'rad etildi' } as Record<string, string>)[payload.decision] ?? payload.decision;
      await this.telegramService.sendNotification(BigInt(String(mv.telegramId)), `${emoji} <b>QC Natija</b>\n\nHarakat: <code>${mv.movementNumber}</code>\nNatija: ${dec}`);
    }
    if (mv?.createdBy) {
      const type = `QC_${payload.decision}`;
      this.n(mv.createdBy, type, `QC: ${payload.decision}`, `Harakat #${payload.movementId} QC natijasi: ${payload.decision}`, payload.movementId);
    }
  }
}
