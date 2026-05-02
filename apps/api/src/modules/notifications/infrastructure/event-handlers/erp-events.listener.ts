import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { Notification } from '../../domain/aggregates/notification.aggregate';

@Injectable()
export class ErpEventsListener {
  private readonly logger = new Logger(ErpEventsListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
      ) {}

  @OnEvent(ERP_EVENTS.DEAL_WON)
  async handleDealWon(payload: { dealId?: string; amount?: number; userId?: number }) {
    this.logger.log('Deal won event received - creating notification for director');

    // Create notification for director
    const notification = Notification.createForUser(
      'director_role',
      'New Deal Won',
      `Deal #${payload.dealId} worth ${payload.amount} UZS has been won`,
      'deal',
    );
    notification.referenceId = payload.dealId ?? null;
    notification.referenceType = 'deal';

    await this.notificationRepo.save(notification);
  }

  @OnEvent(ERP_EVENTS.ORDER_CREATED)
  async handleOrderCreated(payload: { orderId?: string; customerId?: string; userId?: number }) {
    this.logger.log('Order created event received - creating notification for warehouse manager');

    // Create notification for warehouse manager
    const notification = Notification.createForUser(
      'warehouse_manager_role',
      'New Order Created',
      `Sales Order #${payload.orderId} has been created for customer ${payload.customerId}`,
      'order',
    );
    notification.referenceId = payload.orderId ?? null;
    notification.referenceType = 'sales_order';

    await this.notificationRepo.save(notification);
  }

  @OnEvent(ERP_EVENTS.QC_FAILED)
  async handleQcFailed(payload: { inspectionId?: string; productId?: string; reason?: string; userId?: number }) {
    this.logger.log('QC failed event received - creating notification for production manager');

    // Create notification for production manager
    const notification = Notification.createForUser(
      'production_manager_role',
      'Quality Control Failed',
      `Inspection #${payload.inspectionId} for product ${payload.productId} failed. Reason: ${payload.reason}`,
      'qc_failed',
    );
    notification.referenceId = payload.inspectionId ?? null;
    notification.referenceType = 'inspection';

    await this.notificationRepo.save(notification);
  }

  @OnEvent(ERP_EVENTS.LMS_CERT_EXPIRED)
  async handleLmsCertExpired(payload: {
    certificateId?: string;
    operatorId?: string;
    courseName?: string;
    userId?: number;
  }) {
    this.logger.log('LMS cert expired event received - creating notification for operator and HR manager');

    // Notify operator
    const operatorNotification = Notification.createForUser(
      payload.operatorId || 'operator_role',
      'Certificate Expired',
      `Your certificate for ${payload.courseName} has expired. Please renew it immediately.`,
      'lms_expired',
    );
    operatorNotification.referenceId = payload.certificateId ?? null;
    operatorNotification.referenceType = 'certificate';

    await this.notificationRepo.save(operatorNotification);

    // Notify HR manager
    const hrNotification = Notification.createForUser(
      'hr_manager_role',
      'Operator Certificate Expired',
      `Operator ${payload.operatorId}'s certificate for ${payload.courseName} has expired`,
      'lms_expired',
    );
    hrNotification.referenceId = payload.certificateId ?? null;
    hrNotification.referenceType = 'certificate';

    await this.notificationRepo.save(hrNotification);
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

    // Create notification for director
    const notification = Notification.createForUser(
      'director_role',
      'Equipment Stopped',
      `Machine ${payload.equipmentName} (${payload.equipmentId}) has stopped. Issue: ${payload.issueDescription}. Priority: ${payload.priority}`,
      'mro_stopped',
    );
    notification.referenceId = payload.equipmentId ?? null;
    notification.referenceType = 'maintenance_order';

    await this.notificationRepo.save(notification);
  }
}
