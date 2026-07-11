/**
 * @module signal-pending-material.handler
 * @description CQRS command handler (06-sd #100 — Ojd.Syryo / Ожд.Сырьё). Flags a sales
 *   order as "awaiting raw material" and signals Ta'minot (supply/MM): the status is
 *   flipped to 'pending_material' and the signal columns are stamped on the canonical
 *   sales_orders table, the 'sd.order.pending_material' event is durably persisted to the
 *   outbox (golden-thread), and the already-wired OrderMaterialWaitingEvent is published
 *   so MM's OrderMaterialWaitingListener raises the procurement review item — reusing the
 *   existing SD→MM signal instead of duplicating it.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';
import { OrderMaterialWaitingEvent } from '../../domain/events/order-material-waiting.event';
import { OutboxRepository } from '../../../shared/outbox/outbox.repository';
import { db } from '@shared/db';

/** Order states from which the "Ожд.Сырьё" signal is meaningless (nothing left to supply). */
const SIGNAL_BLOCKED_STATUSES = ['cancelled', 'closed', 'delivered', 'shipped', 'pending_material'];

export class SignalPendingMaterialCommand {
  constructor(
    public readonly orderId: number,
    public readonly reason: string | null = null,
  ) {}
}

@CommandHandler(SignalPendingMaterialCommand)
export class SignalPendingMaterialHandler implements ICommandHandler<SignalPendingMaterialCommand> {
  private readonly logger = new Logger(SignalPendingMaterialHandler.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(
    command: SignalPendingMaterialCommand,
  ): Promise<Result<{ orderId: number; status: string; signaledAt: string }>> {
    const found = await this.orderRepo.findById(command.orderId);
    if (!found.ok) return Err(AppErr('DB_ERROR', "Buyurtmani o'qishda xatolik"));
    if (!found.data) return Err(AppErr('NOT_FOUND', 'Buyurtma topilmadi'));

    const previousStatus = found.data.getStatus();
    if (SIGNAL_BLOCKED_STATUSES.includes(previousStatus)) {
      return Err(
        AppErr('CONFLICT', `'${previousStatus}' holatidagi buyurtmaga material signali berib bo'lmaydi`),
      );
    }

    let signaledAt = '';
    try {
      // Status flip + signal columns + durable outbox event commit atomically (mirrors
      // update-order-status.handler A43): a crash after the DB write can never lose the
      // SD→Ta'minot material signal.
      await db.transaction(async (tx) => {
        const upd = await this.orderRepo.markPendingMaterial(command.orderId, command.reason, tx);
        if (!upd.ok) throw new Error(upd.error?.message ?? 'markPendingMaterial failed');
        signaledAt = upd.data.signaledAt;

        const outbox = await this.outboxRepo.insertBatch(
          [
            {
              aggregate_type: 'SalesOrder',
              aggregate_id: String(command.orderId),
              event_name: 'sd.order.pending_material',
              payload: { orderId: command.orderId, previousStatus, reason: command.reason },
            },
          ],
          tx,
        );
        if (!outbox.ok) throw new Error(outbox.error.message);
      });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Transaction failed';
      this.logger.error({ msg: 'Pending-material signal rolled back', orderId: command.orderId, error: message });
      return Err(AppErr('INTERNAL', "Material signalini saqlab bo'lmadi"));
    }

    // Reuse the already-wired SD→MM signal so procurement sees the waiting order
    // (MM's OrderMaterialWaitingListener creates the hitl_approvals review item).
    this.eventBus.publish(new OrderMaterialWaitingEvent(command.orderId, 1));
    this.logger.log({ msg: 'Ожд.Сырьё material signal published', orderId: command.orderId, previousStatus });

    return Ok({ orderId: command.orderId, status: 'pending_material', signaledAt });
  }
}
