/**
 * @module pos-secondary-events.handler
 * @description Request / inventory / stock / GL / HR event handlers extracted
 *   from pos.events.ts to keep that file <300 lines (Rule 16).
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PosTelegramService }      from '../services/pos-telegram.service';
import { PosNotificationsService } from '../services/pos-notifications.service';
import { PosEventRepository }      from '../repositories/pos-event.repository';
import { broadcastPosEvent }       from '../pos.gateway';
import type { RequestEvent, HrEmployeeExitEvent } from './pos.events.types';

@Injectable()
export class PosSecondaryEventsHandler {
  private readonly logger = new Logger(PosSecondaryEventsHandler.name);

  constructor(
    private readonly telegramService: PosTelegramService,
    private readonly notifications:   PosNotificationsService,
    private readonly eventRepo:       PosEventRepository,
  ) {}

  private n(userId: number, type: string, title: string, body: string, entityId?: number): void {
    void this.notifications.sendNotification(userId, type, title, body, 'pos_movements', entityId);
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
    // Pattern 2: independent Telegram notifications fan out in parallel; in-app notify is fire-and-forget
    await Promise.all(staff.map(async (s) => {
      if (s.telegramId) {
        await this.telegramService.sendNotification(BigInt(String(s.telegramId)), `📦 <b>Material berish kerak</b>\n\nSo'rov: <code>${payload.requestNumber}</code>`);
      }
      this.n(s.id, 'REQUEST_APPROVED', 'So\'rov tasdiqlandi', `${payload.requestNumber} — material bering`);
    }));
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
    // Pattern 2: per-inspector Telegram sends are independent — parallelise to avoid N+1 latency
    await Promise.all(inspectors.map(async (insp) => {
      if (insp.telegramId) {
        await this.telegramService.sendNotification(BigInt(String(insp.telegramId)), `⚠️ <b>Zarar akti — QC kerak</b>\n\nHarakat ID: ${payload.damageMovementId}\nMaterial ID: ${payload.materialCardId}\nMiqdor: ${payload.damagedQty}`);
      }
      this.n(insp.id, 'DAMAGE_QC_REQUIRED', 'Zarar akti — QC kerak', `Harakat ${payload.damageMovementId}, material ${payload.materialCardId} tekshiring`);
    }));
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
      // Pattern 2: per-manager Telegram sends are independent — fan out in parallel
      await Promise.all(managers.map(async (mgr) => {
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
      }));
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
