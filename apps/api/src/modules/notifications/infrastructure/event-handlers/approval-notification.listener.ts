/**
 * @module approval-notification.listener
 * @description Notification fan-out for the approval chain (`approval_requests`).
 *
 * WHY THIS EXISTS
 *   Audit 2026-08-07 compared every `eventBus.publish(new XEvent(...))` against every
 *   `@EventsHandler(XEvent)` and found eight events published into the void. Six of them were the
 *   approval chain:
 *     - HitlApprovalRequestedEvent / HitlApprovedEvent / HitlRejectedEvent  (CQRS handlers)
 *     - ApprovalRequestedEvent / ApprovalApprovedEvent / ApprovalRejectedEvent (ApprovalsService)
 *   Both families write the SAME table (`approval_requests`) — the first through
 *   drizzle-approval-write.repo.ts, the second through approvals.repository.ts.
 *
 *   The consequence was not cosmetic: an approval request nobody is told about is a workflow that
 *   silently stalls. The requester waited, the approver never learned there was anything to
 *   approve, and the only way to discover it was to open the Director panel and look. Same on the
 *   way back — the requester was never told the outcome.
 *
 * WHY ROUTING RULES INSTEAD OF A HARDCODED ROLE
 *   `notification_routing_rules` is the owner-editable event→recipient table (EP-NTF-007/079),
 *   already used by the QC and MRO listeners in this directory. Recipients for
 *   `director.approval_requested` are resolved through it, so the owner changes who approves what
 *   via CRUD instead of a code edit. `resolveUserIds` falls back to the role passed here when the
 *   table has no active rule for the event (Q-39 — an unconfigured event keeps working).
 *
 * WHY THE OUTCOME NOTIFICATION LOOKS THE REQUESTER UP
 *   Neither event carries `requestedBy` — only the approval id. So the requester is read from
 *   `approval_requests.requested_by`. If that is NULL, or the row is gone, NOBODY is notified and
 *   a warning is logged: no invented recipient (Q-40).
 *
 * WHY CommandBus AND NOT notificationRepo.save()
 *   `CreateNotificationHandler` is the only path that applies the user's channel preferences,
 *   actually sends on Telegram/email/SMS, and writes `notifications.status`. Saving the row
 *   directly (what six other listeners here used to do until 2026-08-07) produces an in-app-only
 *   notice — which for an approval request is the same as no notification at all.
 *
 * @layer Event handler (Notifications)
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { CreateNotificationCommand } from '../../application/commands/create-notification.command';
import { NotificationRoutingRepository } from '../notification-routing.repository';
import { HitlApprovalRequestedEvent } from '@modules/director/domain/events/hitl-approval-requested.event';
import { HitlApprovedEvent } from '@modules/director/domain/events/hitl-approved.event';
import { HitlRejectedEvent } from '@modules/director/domain/events/hitl-rejected.event';
import { ApprovalRequestedEvent } from '@modules/director/domain/events/approval-requested.event';
import { ApprovalApprovedEvent } from '@modules/director/domain/events/approval-approved.event';
import { ApprovalRejectedEvent } from '@modules/director/domain/events/approval-rejected.event';

/** notification_routing_rules.event_type — owner-configurable recipient list. */
const APPROVAL_REQUESTED_EVENT_TYPE = 'director.approval_requested';
/** Used only when the routing table has no active rule for the event above (Q-39). */
const APPROVAL_REQUESTED_FALLBACK_ROLE = 'director';

/** notifications.type — reuses the existing generic buckets; no new vocabulary invented. */
const APPROVAL_NOTIFICATION_TYPE = 'info';
const APPROVAL_REFERENCE_TYPE = 'approval_request';

/**
 * Shared fan-out used by all six handlers below. Kept as a plain service (not a base class) so
 * each @EventsHandler stays a thin, independently-testable mapping from event → message.
 */
@Injectable()
export class ApprovalNotificationDispatcher {
  private readonly logger = new Logger(ApprovalNotificationDispatcher.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  /** Notifies whoever the routing table says should act on a new approval request. */
  async notifyApprovers(approvalId: string, title: string, body: string): Promise<void> {
    try {
      const resolved = await this.routing.resolveUserIds(
        APPROVAL_REQUESTED_EVENT_TYPE,
        APPROVAL_REQUESTED_FALLBACK_ROLE,
      );
      const userIds = resolved.ok ? resolved.data : [];
      if (userIds.length === 0) {
        this.logger.warn(
          `Tasdiq so'rovi #${approvalId}: nishon topilmadi (marshrutlash qoidasi ham, '${APPROVAL_REQUESTED_FALLBACK_ROLE}' roli ham bo'sh) — hech kimga yuborilmadi`,
        );
        return;
      }
      await this.dispatch(userIds, approvalId, title, body);
    } catch (err: unknown) {
      this.logger.warn(`notifyApprovers(#${approvalId}) failed: ${String(err)}`);
    }
  }

  /**
   * Notifies the person who raised the request about its outcome. Reads `requested_by` from the
   * row because neither the approved nor the rejected event carries it.
   */
  async notifyRequester(approvalId: string, title: string, body: string): Promise<void> {
    try {
      const numericId = Number.parseInt(String(approvalId), 10);
      if (!Number.isInteger(numericId)) {
        this.logger.warn(`Tasdiq #${approvalId}: id butun son emas — so'rovchi aniqlanmadi`);
        return;
      }
      const r = await runQuery<{ requested_by: number | null }>(sql`
        SELECT requested_by FROM approval_requests WHERE id = ${numericId} LIMIT 1
      `);
      const requestedBy = r.rows[0]?.requested_by;
      if (requestedBy === undefined || requestedBy === null) {
        // Q-40: no fabricated recipient. Better a logged gap than a notification sent to a guess.
        this.logger.warn(`Tasdiq #${approvalId}: approval_requests.requested_by bo'sh — xabar yuborilmadi`);
        return;
      }
      await this.dispatch([requestedBy], approvalId, title, body);
    } catch (err: unknown) {
      this.logger.warn(`notifyRequester(#${approvalId}) failed: ${String(err)}`);
    }
  }

  private async dispatch(userIds: number[], approvalId: string, title: string, body: string): Promise<void> {
    await Promise.allSettled(
      userIds.map((id) =>
        this.commandBus.execute(
          new CreateNotificationCommand(
            String(id),
            title,
            body,
            APPROVAL_NOTIFICATION_TYPE,
            String(approvalId),
            APPROVAL_REFERENCE_TYPE,
          ),
        ),
      ),
    );
  }
}

/** Formats the amount for a message body; falls back to the raw value if it is not numeric. */
function formatAmount(amount: number | undefined, currency: string | undefined): string {
  if (amount === undefined || !Number.isFinite(amount)) return '';
  return ` — ${amount.toLocaleString('ru-RU')} ${currency ?? 'UZS'}`;
}

@Injectable()
@EventsHandler(HitlApprovalRequestedEvent)
export class HitlApprovalRequestedNotificationListener
  implements IEventHandler<HitlApprovalRequestedEvent>
{
  constructor(private readonly dispatcher: ApprovalNotificationDispatcher) {}

  async handle(event: HitlApprovalRequestedEvent): Promise<void> {
    await this.dispatcher.notifyApprovers(
      String(event.id),
      'Tasdiqlash so\'rovi',
      `${event.documentType} #${event.documentId} tasdiqlashingizni kutmoqda${formatAmount(event.amount, event.currency)}.`,
    );
  }
}

@Injectable()
@EventsHandler(HitlApprovedEvent)
export class HitlApprovedNotificationListener implements IEventHandler<HitlApprovedEvent> {
  constructor(private readonly dispatcher: ApprovalNotificationDispatcher) {}

  async handle(event: HitlApprovedEvent): Promise<void> {
    const note = event.notes ? ` Izoh: ${event.notes}` : '';
    await this.dispatcher.notifyRequester(
      String(event.id),
      'So\'rovingiz tasdiqlandi',
      `${event.documentType} #${event.documentId} tasdiqlandi.${note}`,
    );
  }
}

@Injectable()
@EventsHandler(HitlRejectedEvent)
export class HitlRejectedNotificationListener implements IEventHandler<HitlRejectedEvent> {
  constructor(private readonly dispatcher: ApprovalNotificationDispatcher) {}

  async handle(event: HitlRejectedEvent): Promise<void> {
    const reason = event.reason ? ` Sabab: ${event.reason}` : '';
    await this.dispatcher.notifyRequester(
      String(event.id),
      'So\'rovingiz rad etildi',
      `${event.documentType} #${event.documentId} rad etildi.${reason}`,
    );
  }
}

/**
 * The ApprovalsService family carries `{ approvalRequestId, payload }` rather than typed fields,
 * so document type/number are read out of the payload when present and simply omitted when not —
 * never guessed (Q-40).
 */
function describeFromPayload(payload: Record<string, unknown>): string {
  const type = typeof payload['documentType'] === 'string' ? payload['documentType'] : 'Hujjat';
  const num = payload['documentNumber'] ?? payload['documentId'];
  return num === undefined || num === null ? String(type) : `${String(type)} #${String(num)}`;
}

@Injectable()
@EventsHandler(ApprovalRequestedEvent)
export class ApprovalRequestedNotificationListener implements IEventHandler<ApprovalRequestedEvent> {
  constructor(private readonly dispatcher: ApprovalNotificationDispatcher) {}

  async handle(event: ApprovalRequestedEvent): Promise<void> {
    await this.dispatcher.notifyApprovers(
      String(event.approvalRequestId),
      'Tasdiqlash so\'rovi',
      `${describeFromPayload(event.payload)} tasdiqlashingizni kutmoqda.`,
    );
  }
}

@Injectable()
@EventsHandler(ApprovalApprovedEvent)
export class ApprovalApprovedNotificationListener implements IEventHandler<ApprovalApprovedEvent> {
  constructor(private readonly dispatcher: ApprovalNotificationDispatcher) {}

  async handle(event: ApprovalApprovedEvent): Promise<void> {
    await this.dispatcher.notifyRequester(
      String(event.approvalRequestId),
      'So\'rovingiz tasdiqlandi',
      `${describeFromPayload(event.payload)} tasdiqlandi.`,
    );
  }
}

@Injectable()
@EventsHandler(ApprovalRejectedEvent)
export class ApprovalRejectedNotificationListener implements IEventHandler<ApprovalRejectedEvent> {
  constructor(private readonly dispatcher: ApprovalNotificationDispatcher) {}

  async handle(event: ApprovalRejectedEvent): Promise<void> {
    const reason = typeof event.payload['rejectionReason'] === 'string'
      ? ` Sabab: ${event.payload['rejectionReason']}`
      : '';
    await this.dispatcher.notifyRequester(
      String(event.approvalRequestId),
      'So\'rovingiz rad etildi',
      `${describeFromPayload(event.payload)} rad etildi.${reason}`,
    );
  }
}
