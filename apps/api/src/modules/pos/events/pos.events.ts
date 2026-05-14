/**
 * POS — Event Handlers (22-type notification matrix)
 * EventEmitter2 orqali modular event-driven arxitektura
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { execPosMovementMarkAiProcessing } from '@common/database/queries-remaining';

import { PosTelegramService }      from '../services/pos-telegram.service';
import { LabelService }            from '../services/label.service';
import { PosNotificationsService } from '../services/pos-notifications.service';
import { PosEventRepository }      from '../repositories/pos-event.repository';
import { AutoBarcodeService }      from '../services/auto-barcode.service';
import { AutoGlPostingService }    from '../services/auto-gl-posting.service';
import { QuarantineWorkflowService } from '../services/quarantine-workflow.service';
import { ThreeWayMatchService }    from '../services/three-way-match.service';
import { broadcastPosEvent }       from '../pos.gateway';

export interface MovementCreatedEvent     { movementId: number; movementNumber: string; typeCode: string; createdById: number }
export interface MovementStatusChangedEvent { movementId: number; movementNumber: string; oldStatus: string; newStatus: string; updatedById: number }
export interface QcDecisionEvent         { movementId: number; decision: string; qcInspectorId: number }
export interface RequestEvent            { requestId: number; requestNumber: string; departmentCode?: string; createdById?: number; approvedById?: number; rejectedById?: number; rejectionReason?: string }
export interface HrEmployeeExitEvent     { userId: number; employeeCode?: string; departmentCode?: string; exitDate?: string }

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
    for (const mgr of managers) {
      if (mgr.telegramId) { await this.telegramService.notifyMovementApprovalRequired(payload.movementId, payload.movementNumber, mgr.id); }
      this.n(mgr.id, 'MOVEMENT_PENDING', 'Tasdiqlash kerak', `${payload.movementNumber} tasdiqlashni kutmoqda`, payload.movementId);
    }
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

  @OnEvent('pos.request.pending')
  async onRequestPending(payload: RequestEvent) {
    this.logger.debug(`Event: pos.request.pending — ${payload.requestNumber}`);
    if (payload.departmentCode) { await this.telegramService.notifyRequestPending(payload.requestId, payload.requestNumber, payload.departmentCode); }
    if (payload.createdById) { this.n(payload.createdById, 'REQUEST_PENDING', 'So\'rov yuborildi', `${payload.requestNumber} tasdiqlashga yuborildi`); }
  }

  @OnEvent('pos.request.approved')
  async onRequestApproved(payload: RequestEvent) {
    this.logger.debug(`Event: pos.request.approved — ${payload.requestNumber}`);
    const staff = await this.eventRepo.findByRoles(['warehouse_staff', 'warehouse_manager']);
    for (const s of staff) {
      if (s.telegramId) { await this.telegramService.sendNotification(BigInt(String(s.telegramId)), `📦 <b>Material berish kerak</b>\n\nSo'rov: <code>${payload.requestNumber}</code>`); }
      this.n(s.id, 'REQUEST_APPROVED', 'So\'rov tasdiqlandi', `${payload.requestNumber} — material bering`);
    }
    if (payload.createdById) { this.n(payload.createdById, 'REQUEST_APPROVED', 'So\'rovingiz tasdiqlandi', `${payload.requestNumber} tasdiqlandi`); }
  }

  @OnEvent('pos.request.rejected')
  async onRequestRejected(payload: RequestEvent) {
    if (!payload.createdById) return;
    const telegramId = await this.eventRepo.findUserTelegramId(payload.createdById);
    if (telegramId) { await this.telegramService.sendNotification(BigInt(String(telegramId)), `❌ <b>So'rovingiz rad etildi</b>\n\nSo'rov: <code>${payload.requestNumber}</code>\nSabab: ${payload.rejectionReason ?? "Ko'rsatilmagan"}`); }
    this.n(payload.createdById, 'REQUEST_REJECTED', 'So\'rov rad etildi', `${payload.requestNumber}: ${payload.rejectionReason ?? '—'}`);
  }

  @OnEvent('pos.request.issued')
  onRequestIssued(payload: RequestEvent) {
    if (payload.createdById) { this.n(payload.createdById, 'REQUEST_ISSUED', 'Material berildi', `${payload.requestNumber} — material berildi`); }
  }

  @OnEvent('pos.damage.qc_required')
  async onDamageQcRequired(payload: { damageMovementId: number; materialCardId: number; damagedQty: number }) {
    const inspectors = await this.eventRepo.findByRoles(['qc_inspector']);
    for (const insp of inspectors) {
      if (insp.telegramId) { await this.telegramService.sendNotification(BigInt(String(insp.telegramId)), `⚠️ <b>Zarar akti — QC kerak</b>\n\nHarakat ID: ${payload.damageMovementId}\nMaterial ID: ${payload.materialCardId}\nMiqdor: ${payload.damagedQty}`); }
      this.n(insp.id, 'DAMAGE_QC_REQUIRED', 'Zarar akti — QC kerak', `Harakat ${payload.damageMovementId}, material ${payload.materialCardId} tekshiring`);
    }
  }

  @OnEvent('pos.inventory_count.started')
  async onInventoryCountStarted(payload: { countId: number; countNumber: string }) {
    const staff = await this.eventRepo.findByRoles(['warehouse_staff', 'warehouse_manager']);
    for (const s of staff) { this.n(s.id, 'INVENTORY_STARTED', 'Inventarizatsiya boshlandi', `${payload.countNumber} sanoq boshlandi`); }
  }

  @OnEvent('pos.inventory_count.completed')
  async onInventoryCountCompleted(payload: { countId: number; countNumber: string; approvedById: number }) {
    this.logger.log(`Event: pos.inventory_count.completed — ${payload.countNumber}`);
    const fh = await this.eventRepo.findOneByRole('finance_head');
    if (fh?.telegramId) { await this.telegramService.sendNotification(BigInt(String(fh.telegramId)), `📊 <b>Inventarizatsiya yakunlandi</b>\n\n<code>${payload.countNumber}</code>\nGL tuzatmalar qo'llandi.`); }
    if (fh?.id) { this.n(fh.id, 'INVENTORY_COMPLETED', 'Inventarizatsiya yakunlandi', `${payload.countNumber} GL tuzatmalar qo'llandi`); }
    if (payload.approvedById) { this.n(payload.approvedById, 'INVENTORY_COMPLETED', 'Inventarizatsiya tasdiqlandi', `${payload.countNumber} yakunlandi`); }
  }

  @OnEvent('pos.stock.low_alert')
  onStockLow(payload: { materialCardId: number; warehouseId: string; balance: number; managerId?: number }) {
    if (payload.managerId) { this.n(payload.managerId, 'STOCK_LOW_ALERT', 'Past stok ogohlantirishi', `Material #${payload.materialCardId} (${payload.warehouseId}): qoldiq ${payload.balance}`); }
    broadcastPosEvent('stock.alert', { type: 'low_stock', materialCardId: payload.materialCardId, warehouseId: payload.warehouseId, balance: payload.balance });
  }

  @OnEvent('pos.stock.expiry_alert')
  onStockExpiry(payload: { materialCardId: number; warehouseId: string; daysLeft: number; managerId?: number }) {
    if (payload.managerId) { this.n(payload.managerId, 'STOCK_EXPIRY_NEAR', 'Muddat yaqinlashmoqda', `Material #${payload.materialCardId} muddat: ${payload.daysLeft} kun qoldi`); }
    broadcastPosEvent('stock.alert', { type: 'expiry_near', materialCardId: payload.materialCardId, daysLeft: payload.daysLeft });
  }

  @OnEvent('pos.gl.approved')
  onGlApproved(payload: { movementId: number; movementNumber: string; userId: number }) {
    this.n(payload.userId, 'GL_APPROVED', 'GL posting tasdiqlandi', `${payload.movementNumber} GL yozuvlari tasdiqlandi`, payload.movementId);
    broadcastPosEvent('gl.update', { movementId: payload.movementId, status: 'approved' });
  }

  @OnEvent('pos.gl.rejected')
  onGlRejected(payload: { movementId: number; movementNumber: string; userId: number }) {
    this.n(payload.userId, 'GL_REJECTED', 'GL posting rad etildi', `${payload.movementNumber} GL yozuvlari rad etildi`, payload.movementId);
    broadcastPosEvent('gl.update', { movementId: payload.movementId, status: 'rejected' });
  }

  /**
   * HR moduli xodim ishdan chiqish eventini yuboradi.
   * Bu yerda inventar tekshiruvi va mas'ul shaxslarga xabarnoma yuboriladi.
   */
  @OnEvent('hr.employee.exit')
  async onHrEmployeeExit(payload: HrEmployeeExitEvent) {
    this.logger.log(`[HR] Xodim chiqish: userId=${payload.userId}`);
    try {
      // Notify warehouse managers to reconcile the employee's inventory
      const managers = await this.eventRepo.findByRoles(['warehouse_manager', 'pos_manager']);
      for (const mgr of managers) {
        this.n(
          mgr.id,
          'HR_EXIT_INVENTORY_CHECK',
          'Xodim inventar tekshiruvi',
          `Xodim #${payload.userId} ishdan chiqmoqda — inventarni tekshiring`,
        );
        if (mgr.telegramId) {
          await this.telegramService.sendNotification(
            BigInt(String(mgr.telegramId)),
            `🚪 <b>Xodim chiqish — inventar tekshiruvi kerak</b>\n\nXodim ID: ${payload.userId}\nBo'lim: ${payload.departmentCode ?? '—'}\nChiqish sanasi: ${payload.exitDate ?? 'noma\'lum'}`,
          );
        }
      }
      // Notify the employee themselves (in-app)
      this.n(
        payload.userId,
        'HR_EXIT_REMINDER',
        'Inventarni qaytaring',
        'Ishdan chiqishdan oldin barcha inventarni omborga qaytarish kerak',
      );
      broadcastPosEvent('hr.employee_exit', { userId: payload.userId, exitDate: payload.exitDate });
    } catch (err: unknown) {
      this.logger.error(`[HR] Exit event handler xatosi: ${(err as Error).message}`);
    }
  }
}
