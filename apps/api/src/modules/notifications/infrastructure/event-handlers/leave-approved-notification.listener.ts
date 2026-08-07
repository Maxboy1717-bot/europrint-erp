/**
 * @module leave-approved-notification.listener
 * @description @OnEvent('LeaveApproved') handler. When HR approves a leave request,
 *   ApproveLeaveHandler drains the aggregate's domain events and publishes each via
 *   EventEmitter2.emit(ev.eventName, ev) — eventName='LeaveApproved', payload = the
 *   LeaveApprovedEvent instance (see approve-leave.handler.ts:79-81 and
 *   leave-request.aggregate.ts:145). This listener persists an in-app notification for
 *   the requesting user (event.props.userId).
 *
 *   Mirrors orphan-events.listener.ts (EventEmitter2 @OnEvent string bus) — NOT the CQRS
 *   @EventsHandler bus, because the HR handler publishes via EventEmitter2, not eventBus.
 *
 *   Vision: 18-notifications #33 (HR LeaveApprovedEvent -> avto bildirishnoma).
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationCommand } from '../../application/commands/create-notification.command';

/** Shape of the LeaveApprovedEvent instance emitted by HR ApproveLeaveHandler. */
interface LeaveApprovedEventLike {
  props?: {
    leaveId?: string | number;
    employeeId?: string | number;
    userId?: string | number;
    approverId?: string | number;
    approvedAt?: Date | string;
  };
}

@Injectable()
export class LeaveApprovedNotificationListener {
  private readonly logger = new Logger(LeaveApprovedNotificationListener.name);

  // Audit 2026-08-07: was `notificationRepo.save()` — the approval only showed up if the
  // employee opened the app. Routed through CreateNotificationHandler, which applies the
  // employee's channel preferences and actually delivers (Telegram/email/SMS) + records status.
  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent('LeaveApproved')
  async handleLeaveApproved(event: LeaveApprovedEventLike): Promise<void> {
    const userId = event?.props?.userId;
    if (userId === undefined || userId === null || String(userId).trim() === '') {
      this.logger.warn('LeaveApproved event missing props.userId — notification skipped');
      return;
    }
    try {
      // referenceType -> notifications.entity_type (text). referenceId left undefined:
      // notifications.entity_id is INTEGER and the leave id is not a guaranteed-safe
      // integer on this bus, so we record only the reference type.
      const result = await this.commandBus.execute(
        new CreateNotificationCommand(
          String(userId),
          "Ta'til so'rovi tasdiqlandi",
          "Ta'til so'rovingiz tasdiqlandi.",
          'leave_approved',
          undefined,
          'leave_request',
        ),
      );
      if (result && result.ok === false) {
        this.logger.warn(`LeaveApproved -> notification failed: ${String(result.error?.message)}`);
        return;
      }
      this.logger.log(`LeaveApproved -> notification dispatched for userId=${String(userId)}`);
    } catch (err) {
      this.logger.warn(`LeaveApprovedNotificationListener failed: ${String(err)}`);
    }
  }
}
