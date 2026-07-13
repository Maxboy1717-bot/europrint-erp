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
import { CommandBus } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { CreateNotificationCommand } from '../../application/commands/create-notification.command';

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
  // Additive fields (Q-46) — populated by AbsenceBlockCron from data it already queries
  // (AbsentEmployeeRow), threaded through so day1/day2/blocked notifications can show a
  // real name/department/day-count instead of just the bare employee id. Optional because
  // other emitters of these event names may not supply them.
  first_name?: string;
  last_name?: string;
  department_id?: number | null;
  department_name?: string | null;
  consecutive_day_count?: number;
}

@Injectable()
export class OrphanEventsListener {
  private readonly logger = new Logger(OrphanEventsListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
    private readonly commandBus: CommandBus,
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
  // 2026-07-11 notifications audit (docs/audit/NOTIFICATIONS-COMPLETE-FRESH-ANALYSIS-2026-07-11.md):
  // these three handlers used to only this.logger.log() the event — no notification was ever
  // persisted. Now they dispatch CreateNotificationCommand via CommandBus (same cross-module
  // pattern as cashier-cash-limit-alert.cron.ts / mm-reconciliation-digest.cron.ts), targeting
  // the employee's direct manager (employees.manager_id -> manager's user_id) with a fallback to
  // active 'hr_manager' users when no manager is resolvable (Q-40 — no fabricated recipient; if
  // neither resolves, the notification is skipped with a warn log, nothing is invented).

  /** Fallback recipient role when the absent/blocked employee has no resolvable manager
   *  (employees.manager_id NULL or the manager has no linked user account). Same literal
   *  already used for HR fan-out in LmsCertExpiredNotificationListener in this directory. */
  private static readonly ABSENCE_HR_FALLBACK_ROLE = 'hr_manager';

  @OnEvent('employee.absence.day1')
  async handleAbsenceDay1(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(`employee.absence.day1 employeeId=${payload.employee_id}`);
    // Day 1 warning has been sent via Telegram by AbsenceBlockCron.
    await this._notifyAbsenceEvent(payload, {
      type: 'employee_absence_day1',
      title: "⚠️ Xodim yo'qligi — 1-kun ogohlantirish",
      body: this._absenceNotificationBody(payload, "1-kun ketma-ket ishga kelmadi (xodimga ogohlantirish yuborildi)."),
    });
  }

  @OnEvent('employee.absence.day2')
  async handleAbsenceDay2(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(`employee.absence.day2 employeeId=${payload.employee_id}`);
    // Day 2 escalation has been sent via Telegram by AbsenceBlockCron.
    await this._notifyAbsenceEvent(payload, {
      type: 'employee_absence_day2',
      title: "🚨 Xodim yo'qligi — 2-kun (oxirgi ogohlantirish)",
      body: this._absenceNotificationBody(payload, "2-kun ketma-ket ishga kelmadi — ertaga ERP kirishi avtomatik bloklanadi."),
    });
  }

  @OnEvent('employee.blocked')
  async handleEmployeeBlocked(payload: EmployeeEventPayload): Promise<void> {
    this.logger.log(
      `employee.blocked employeeId=${payload.employee_id} reason="${payload.reason ?? ''}" source=${payload.source ?? 'unknown'}`,
    );
    // Chip revoke and IoT block are emitted separately.
    await this._notifyAbsenceEvent(payload, {
      type: 'employee_blocked',
      title: '⛔ Xodim bloklandi',
      body: this._absenceNotificationBody(payload, payload.reason ?? 'Avtomatik bloklash.'),
    });
  }

  /**
   * Resolves real recipients for an absence/block event and dispatches CreateNotificationCommand
   * to each (mirrors cashier-cash-limit-alert.cron.ts / mm-reconciliation-digest.cron.ts). Never
   * invents a recipient (Q-40) — if none can be resolved from real data, logs and returns.
   */
  private async _notifyAbsenceEvent(
    payload: EmployeeEventPayload,
    notif: { type: string; title: string; body: string },
  ): Promise<void> {
    try {
      const recipientUserIds = await this._resolveAbsenceRecipients(payload.employee_id);
      if (recipientUserIds.length === 0) {
        this.logger.warn(
          `${notif.type}: employeeId=${payload.employee_id} uchun manager/HR nishon topilmadi — bildirishnoma yuborilmadi (Q-40)`,
        );
        return;
      }
      await Promise.allSettled(
        recipientUserIds.map((userId) =>
          this.commandBus.execute(
            new CreateNotificationCommand(
              String(userId), notif.title, notif.body, notif.type,
              String(payload.employee_id), 'employee',
            ),
          ),
        ),
      );
    } catch (err) {
      this.logger.warn(`_notifyAbsenceEvent(${notif.type}) employeeId=${payload.employee_id} failed: ${String(err)}`);
    }
  }

  /** employees.manager_id -> manager's user_id (real schema column); falls back to active
   *  'hr_manager' users when no manager is resolvable. Returns [] (never fabricated) if neither
   *  resolves — callers must skip notifying in that case. */
  private async _resolveAbsenceRecipients(employeeId: string | number): Promise<number[]> {
    try {
      const managerRows = await runQuery<{ user_id: number | null }>(sql`
        SELECT m.user_id
        FROM employees e
        JOIN employees m ON m.id = e.manager_id
        WHERE e.id = ${employeeId} AND m.user_id IS NOT NULL AND m.deleted_at IS NULL
        LIMIT 1
      `);
      const managerUserId = managerRows.rows[0]?.user_id;
      if (managerUserId) return [managerUserId];

      const hrRows = await runQuery<{ id: number }>(sql`
        SELECT id FROM users
        WHERE role = ${OrphanEventsListener.ABSENCE_HR_FALLBACK_ROLE} AND is_active = true
        LIMIT 50
      `);
      return hrRows.rows.map((r) => r.id);
    } catch (err) {
      this.logger.warn(`_resolveAbsenceRecipients employeeId=${employeeId} failed: ${String(err)}`);
      return [];
    }
  }

  private _absenceNotificationBody(payload: EmployeeEventPayload, suffix: string): string {
    const name = [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim();
    const who = name || `Xodim #${payload.employee_id}`;
    const dept = payload.department_name ? ` (${payload.department_name})` : '';
    const days = payload.consecutive_day_count ? ` — ${payload.consecutive_day_count} kun` : '';
    return `${who}${dept}${days}: ${suffix}`;
  }
}
