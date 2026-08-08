/**
 * @module pos-external-out-sd.listener
 * @description Discovery sweep 2026-08-03 fix ("POS chiqim (EXTERNAL_OUT) harakati
 *   SD/logistika modulga event yubormaydi"). Mirrors qc-failed-sd.listener.ts's role as
 *   an SD-side subscriber to a cross-module event, and the role-notify pattern already
 *   used by qc-certificate-expiry.cron.ts (CreateNotificationCommand, one notification per
 *   recipient, best-effort via Promise.allSettled).
 *
 *   When a customer is attached to the movement (dto.customerId), the assigned account
 *   manager (sd_customers.manager_id) is notified directly. Otherwise — or when the
 *   customer has no manager assigned — every active 'sales_manager' is notified instead
 *   (fail-open to visibility, not fail-closed to silence; matches the "notify roles, not
 *   nobody" convention already established for this class of event).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CommandBus } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { PosExternalOutCreatedEvent } from '@modules/pos/domain/events/pos-external-out-created.event';
import { CreateNotificationCommand } from '@modules/notifications/application/commands/create-notification.command';

interface CustomerRow {
  name: string | null;
  manager_id: number | null;
}

interface EmployeeIdRow {
  id: number;
}

@Injectable()
@EventsHandler(PosExternalOutCreatedEvent)
export class PosExternalOutSdListener implements IEventHandler<PosExternalOutCreatedEvent> {
  private readonly logger = new Logger(PosExternalOutSdListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: PosExternalOutCreatedEvent): Promise<void> {
    const { movementId, movementNumber, customerId } = event.props;
    try {
      if (!customerId) {
        this.logger.log({ msg: 'PosExternalOutCreatedEvent: no customerId — nothing SD-relevant to notify (idempotent no-op)', movementId });
        return;
      }

      const customerR = await runQuery<CustomerRow>(sql`
        SELECT name, manager_id FROM sd_customers WHERE id = ${customerId}
      `);
      const customer = customerR.rows[0] ?? null;
      const title = `📦 Tashqi chiqim — ${movementNumber}`;
      const body = customer?.name
        ? `${customer.name} uchun tashqi chiqim (${movementNumber}) POS'da yaratildi.`
        : `Mijoz #${customerId} uchun tashqi chiqim (${movementNumber}) POS'da yaratildi.`;

      const recipientIds: number[] = [];
      if (customer?.manager_id) {
        recipientIds.push(customer.manager_id);
      } else {
        // No specific account manager on this customer — fall back to notifying every
        // active sales_manager, same fail-open pattern as QcCertificateExpiryCron's
        // NOTIFY_ROLES (don't let a missing assignment mean nobody finds out).
        const rolesR = await runQuery<EmployeeIdRow>(sql`
          SELECT id FROM employees WHERE role = 'sales_manager' AND status = 'active' LIMIT 100
        `);
        recipientIds.push(...rolesR.rows.map((r) => r.id).filter((id) => Number.isInteger(id) && id > 0));
      }

      if (recipientIds.length === 0) {
        this.logger.warn({ msg: 'PosExternalOutCreatedEvent: no recipient resolved (no manager, no active sales_manager) — nobody notified', movementId, customerId });
        return;
      }

      await Promise.allSettled(
        recipientIds.map((userId) =>
          this.commandBus.execute(
            new CreateNotificationCommand(String(userId), title, body, 'pos_external_out', String(movementId), 'pos_movement'),
          ),
        ),
      );
      this.logger.log({ msg: 'PosExternalOutCreatedEvent: SD notified', movementId, customerId, recipientCount: recipientIds.length });
    } catch (error: unknown) {
      this.logger.error({ msg: 'Failed to notify SD about EXTERNAL_OUT movement', movementId, customerId, error: (error as Error).message });
    }
  }
}
