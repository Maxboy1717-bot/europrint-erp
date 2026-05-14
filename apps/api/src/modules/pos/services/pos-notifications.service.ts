/**
 * @module pos-notifications.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { PosNotificationsRepository } from '../repositories/pos-notifications.repository';
import { broadcastPosEvent } from '../pos.gateway';
import { posNotifications } from '@workspace/db';

type PosNotif = typeof posNotifications.$inferSelect;

@Injectable()
export class PosNotificationsService {
  private readonly logger = new Logger(PosNotificationsService.name);

  constructor(private readonly repo: PosNotificationsRepository) {}

  async getForUser(userId: number): Promise<Result<PosNotif[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getForUser(userId, 50);
      if (!r.ok) throw new Error(r.error.message);
      return r.data ?? [];
    });
  }

  async markRead(id: number, userId: number): Promise<Result<PosNotif, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.markRead(id, userId);
      if (!r.ok) throw new Error(r.error.message);
      return r.data;
    });
  }

  async markAllRead(userId: number): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.markAllRead(userId);
      if (!r.ok) throw new Error(r.error.message);
    });
  }

  async sendNotification(
    userId: number,
    type: string,
    title: string,
    body: string,
    entityType?: string,
    entityId?: number,
    metadata?: object,
  ): Promise<Result<PosNotif, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.insert({
        userId,
        notificationType: type,
        title,
        body,
        entityType,
        entityId,
        metadata: metadata ?? {},
      });
      if (!r.ok) throw new Error(r.error.message);
      this.logger.log(`[NOTIF] Sent ${type} to user ${userId}`);
      return r.data;
    });
  }

  async triggerMovementCreated(movementId: number, userId: number, movementNumber: string): Promise<void> {
    await this.sendNotification(
      userId,
      'MOVEMENT_CREATED',
      'Yangi harakat yaratildi',
      `Harakat ${movementNumber} yaratildi`,
      'pos_movements',
      movementId,
    );
  }

  async triggerMovementConfirmed(movementId: number, userId: number, status: string): Promise<void> {
    await this.sendNotification(
      userId,
      'MOVEMENT_STATUS_CHANGED',
      'Harakat holati o\'zgardi',
      `Harakat #${movementId} holati: ${status}`,
      'pos_movements',
      movementId,
    );
  }

  async triggerStockAlert(userId: number, materialCardId: number, alertType: string): Promise<void> {
    await this.sendNotification(
      userId,
      'STOCK_ALERT',
      'Stok ogohlantirishi',
      `Material ${materialCardId}: ${alertType}`,
      'material_cards',
      materialCardId,
    );
  }

  async triggerGlApproved(userId: number, movementId: number, movementNumber: string): Promise<void> {
    await this.sendNotification(
      userId, 'GL_APPROVED', 'GL posting tasdiqlandi',
      `Harakat ${movementNumber} GL posting yozuvlari tasdiqlandi`,
      'pos_movements', movementId,
    );
  }

  async triggerGlRejected(userId: number, movementId: number, movementNumber: string): Promise<void> {
    await this.sendNotification(
      userId, 'GL_REJECTED', 'GL posting rad etildi',
      `Harakat ${movementNumber} GL posting yozuvlari rad etildi`,
      'pos_movements', movementId,
    );
  }

  async triggerInventoryCompleted(userId: number, planId: number, planNumber: string): Promise<void> {
    await this.sendNotification(
      userId, 'INVENTORY_COMPLETED', 'Inventarizatsiya yakunlandi',
      `Inventarizatsiya rejasi ${planNumber} yakunlandi`,
      'pos_inventory_plans', planId,
    );
  }

  async triggerBarcodeAssigned(userId: number, materialCardId: number, code: string): Promise<void> {
    await this.sendNotification(
      userId, 'BARCODE_ASSIGNED', 'Barcode tayinlandi',
      `Material ${materialCardId} ga barcode tayinlandi: ${code}`,
      'material_cards', materialCardId,
    );
  }

  async broadcastNotification(
    type: string,
    title: string,
    body: string,
    entityType?: string,
    entityId?: number,
  ): Promise<void> {
    this.logger.log(`[NOTIF BROADCAST] ${type}: ${title} — ${body}`);
    broadcastPosEvent('notification.new', { type, title, body, entityType, entityId, ts: new Date().toISOString() });
  }
}
