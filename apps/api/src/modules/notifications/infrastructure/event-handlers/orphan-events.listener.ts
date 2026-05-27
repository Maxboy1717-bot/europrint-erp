/**
 * @module orphan-events.listener
 * @description @OnEvent handlers for previously-orphan string events emitted
 *   by kanban.service, absence-block.cron, and other modules. Each handler
 *   either persists a notification, logs the event, or stubs a TODO for
 *   hardware integration.
 *
 *   Covered events:
 *   - notifications.create      (kanban.service)
 *   - kanban.task.created       (kanban.service)
 *   - kanban.task.moved         (kanban.service)
 *   - kanban.task.assigned      (kanban.service)
 *   - kanban.task.deleted       (kanban.service)
 *   - access.chip.revoke        (absence-block.cron)
 *   - iot.attendance.block      (absence-block.cron)
 *   - email.account.disable     (absence-block.cron)
 *   - employee.absence.day1     (absence-block.cron)
 *   - employee.absence.day2     (absence-block.cron)
 *   - employee.blocked          (absence-block.cron)
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { Notification } from '../../domain/aggregates/notification.aggregate';

interface NotificationsCreatePayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: string;
}

interface KanbanTaskPayload {
  taskId: string | number;
  title?: string;
  createdBy?: string | number;
  movedBy?: string | number;
  newStatus?: string;
  assigneeId?: string | number;
  assignedBy?: string | number;
  taskTitle?: string;
  deletedBy?: string | number;
}

interface EmployeeEventPayload {
  employee_id: string | number;
  reason?: string;
  source?: string;
}

@Injectable()
export class OrphanEventsListener {
  private readonly logger = new Logger(OrphanEventsListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
  ) {}

  // ─── notifications.create ──────────────────────────────────────────────────

  @OnEvent('notifications.create')
  async handleNotificationsCreate(payload: NotificationsCreatePayload): Promise<void> {
    try {
      const notification = Notification.createForUser(
        payload.userId,
        payload.title,
        payload.body,
        payload.type ?? 'info',
      );
      if (payload.referenceId)   notification.referenceId   = payload.referenceId;
      if (payload.referenceType) notification.referenceType = payload.referenceType;
      await this.notificationRepo.save(notification);
      this.logger.log(`notifications.create → saved for userId=${payload.userId}`);
    } catch (err) {
      this.logger.warn(`OrphanEventsListener notifications.create failed: ${String(err)}`);
    }
  }

  // ─── kanban.task.* ─────────────────────────────────────────────────────────

  @OnEvent('kanban.task.created')
  async handleKanbanTaskCreated(payload: KanbanTaskPayload): Promise<void> {
    this.logger.log(
      `kanban.task.created taskId=${payload.taskId} title="${payload.title ?? ''}" by=${payload.createdBy ?? 'unknown'}`,
    );
    // TODO: push notification to assigned user or board watchers when assignee is set at creation
  }

  @OnEvent('kanban.task.moved')
  async handleKanbanTaskMoved(payload: KanbanTaskPayload): Promise<void> {
    this.logger.log(
      `kanban.task.moved taskId=${payload.taskId} → status="${payload.newStatus ?? ''}" by=${payload.movedBy ?? 'unknown'}`,
    );
    // TODO: notify board watchers on status change when notification prefs are set
  }

  @OnEvent('kanban.task.assigned')
  async handleKanbanTaskAssigned(payload: KanbanTaskPayload): Promise<void> {
    this.logger.log(
      `kanban.task.assigned taskId=${payload.taskId} assigneeId=${payload.assigneeId ?? 'none'} by=${payload.assignedBy ?? 'unknown'}`,
    );
    // notifications.create is separately emitted for assignee — this handler logs the audit trail
  }

  @OnEvent('kanban.task.deleted')
  async handleKanbanTaskDeleted(payload: KanbanTaskPayload): Promise<void> {
    this.logger.log(
      `kanban.task.deleted taskId=${payload.taskId} by=${payload.deletedBy ?? 'unknown'}`,
    );
    // TODO: notify assignee of deletion if they were assigned
  }

  // ─── access.chip.revoke ────────────────────────────────────────────────────

  @OnEvent('access.chip.revoke')
  async handleChipRevoke(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(`access.chip.revoke employeeId=${payload.employee_id} reason="${payload.reason ?? 'absence block'}"`);
    // TODO: call hardware access control integration to deactivate RFID chip
    //   e.g. this.accessControlAdapter.revokeChip(payload.employee_id)
  }

  // ─── iot.attendance.block ──────────────────────────────────────────────────

  @OnEvent('iot.attendance.block')
  async handleIotAttendanceBlock(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(`iot.attendance.block employeeId=${payload.employee_id}`);
    // TODO: push block command to IoT tablet/terminal for this employee
    //   e.g. this.iotTabletService.blockEmployee(payload.employee_id)
  }

  // ─── email.account.disable ─────────────────────────────────────────────────

  @OnEvent('email.account.disable')
  async handleEmailAccountDisable(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(`email.account.disable employeeId=${payload.employee_id}`);
    // TODO: call email provider integration to suspend the employee's email account
    //   e.g. this.emailProviderAdapter.disableAccount(payload.employee_id)
  }

  // ─── employee.absence.* ────────────────────────────────────────────────────

  @OnEvent('employee.absence.day1')
  async handleAbsenceDay1(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(`employee.absence.day1 employeeId=${payload.employee_id}`);
    // Day 1 warning has been sent via Telegram by AbsenceBlockCron.
    // Future: persist audit log entry or update attendance record.
  }

  @OnEvent('employee.absence.day2')
  async handleAbsenceDay2(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(`employee.absence.day2 employeeId=${payload.employee_id}`);
    // Day 2 escalation has been sent via Telegram by AbsenceBlockCron.
    // Future: create a disciplinary action draft or escalation task.
  }

  @OnEvent('employee.blocked')
  async handleEmployeeBlocked(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(
      `employee.blocked employeeId=${payload.employee_id} reason="${payload.reason ?? ''}" source=${payload.source ?? 'unknown'}`,
    );
    // Employee is now blocked. Chip revoke and IoT block are emitted separately.
    // Future: sync with HR system, create a block audit record.
  }
}
