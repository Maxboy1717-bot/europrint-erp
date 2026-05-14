/**
 * @module erp-events.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class ErpEventsListener {
  private readonly logger = new Logger(ErpEventsListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
  ) {}

  /** Query all active users with the given role and send each one a notification. */
  private async notifyByRole(
    role: string,
    title: string,
    body: string,
    type: string,
    referenceId: string | null,
    referenceType: string | null,
  ): Promise<void> {
    try {
      const result = await runQuery<{ id: number }>(
        sql`SELECT id FROM users WHERE role = ${role} AND is_active = true LIMIT 50`,
      );
      if (result.rows.length === 50) {
        this.logger.warn(`notifyByRole(${role}): result capped at 50 users — some may not be notified`);
      }
      for (const u of result.rows) {
        const notification = Notification.createForUser(String(u.id), title, body, type);
        notification.referenceId = referenceId;
        notification.referenceType = referenceType;
        await this.notificationRepo.save(notification);
      }
    } catch (err: unknown) {
      this.logger.warn(`notifyByRole(${role}) failed: ${String(err)}`);
    }
  }

  @OnEvent(ERP_EVENTS.DEAL_WON)
  async handleDealWon(payload: { dealId?: string; amount?: number; userId?: number }) {
    this.logger.log('Deal won event received - creating notification for director');
    await this.notifyByRole(
      'director',
      'New Deal Won',
      `Deal #${payload.dealId} worth ${payload.amount} UZS has been won`,
      'deal',
      payload.dealId ?? null,
      'deal',
    );
  }

  @OnEvent(ERP_EVENTS.ORDER_CREATED)
  async handleOrderCreated(payload: { orderId?: string; customerId?: string; userId?: number }) {
    this.logger.log('Order created event received - creating notification for warehouse manager');
    await this.notifyByRole(
      'warehouse_manager',
      'New Order Created',
      `Sales Order #${payload.orderId} has been created for customer ${payload.customerId}`,
      'order',
      payload.orderId ?? null,
      'sales_order',
    );
  }

  @OnEvent(ERP_EVENTS.QC_FAILED)
  async handleQcFailed(payload: { inspectionId?: string; productId?: string; reason?: string; userId?: number }) {
    this.logger.log('QC failed event received - creating notification for production manager');
    await this.notifyByRole(
      'production_manager',
      'Quality Control Failed',
      `Inspection #${payload.inspectionId} for product ${payload.productId} failed. Reason: ${payload.reason}`,
      'qc_failed',
      payload.inspectionId ?? null,
      'inspection',
    );
  }

  @OnEvent(ERP_EVENTS.LMS_CERT_EXPIRED)
  async handleLmsCertExpired(payload: {
    certificateId?: string;
    operatorId?: string;
    courseName?: string;
    userId?: number;
  }) {
    this.logger.log('LMS cert expired event received - creating notification for operator and HR manager');

    // Notify the specific operator directly if their numeric ID is known
    if (payload.operatorId && /^\d+$/.test(payload.operatorId)) {
      const notification = Notification.createForUser(
        payload.operatorId,
        'Certificate Expired',
        `Your certificate for ${payload.courseName} has expired. Please renew it immediately.`,
        'lms_expired',
      );
      notification.referenceId = payload.certificateId ?? null;
      notification.referenceType = 'certificate';
      await this.notificationRepo.save(notification);
    }

    // Notify all active HR managers by role
    await this.notifyByRole(
      'hr_manager',
      'Operator Certificate Expired',
      `Operator ${payload.operatorId}'s certificate for ${payload.courseName} has expired`,
      'lms_expired',
      payload.certificateId ?? null,
      'certificate',
    );
  }

  @OnEvent(ERP_EVENTS.MRO_MACHINE_STOPPED)
  async handleMachineStoppedNotification(payload: {
    equipmentId?: string;
    equipmentName?: string;
    issueDescription?: string;
    priority?: string;
    userId?: number;
  }) {
    this.logger.log('Machine stopped event received - creating notification for director');
    await this.notifyByRole(
      'director',
      'Equipment Stopped',
      `Machine ${payload.equipmentName} (${payload.equipmentId}) has stopped. Issue: ${payload.issueDescription}. Priority: ${payload.priority}`,
      'mro_stopped',
      payload.equipmentId ?? null,
      'maintenance_order',
    );
  }
}
