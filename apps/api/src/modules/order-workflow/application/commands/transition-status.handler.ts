/**
 * @module transition-status.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import {
  IOrderRepo,
  ORDER_WF_REPO,
  CreateStatusHistoryRow,
  PaymentEntryReadRow,
} from '../../infrastructure/repositories/i-order.repo';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';

const ADVANCE_DUE_TYPE = 'ADVANCE';
const PAID_STATUS      = 'PAID';
const RESERVED_STATUS  = 'RESERVED';

const VIP_TIER     = 'VIP';
const REGULAR_TIER = 'REGULAR';

export class TransitionStatusCommand {
  constructor(
    public readonly orderId:    string,
    public readonly toStatus:   string,
    public readonly reason:     string | undefined,
    public readonly changedBy:  number,
    public readonly actorRole:  string = '',
    public readonly actorId:    number = 0,
  ) {}
}

@CommandHandler(TransitionStatusCommand)
export class TransitionStatusHandler implements ICommandHandler<TransitionStatusCommand> {
  private readonly logger = new Logger(TransitionStatusHandler.name);

  constructor(
    @Inject(ORDER_WF_REPO) private readonly repo: IOrderRepo,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: TransitionStatusCommand): Promise<Result<{ status: string }>> {
    const found = await this.repo.findById(command.orderId);
    if (!found.ok) return Err(found.error);
    if (!found.data) {
      return Err(AppErr('NOT_FOUND', `Buyurtma topilmadi: ${command.orderId}`));
    }

    const order = found.data;

    if (command.actorRole === 'SALES_MANAGER' && command.actorId > 0) {
      const mgr = order.getSalesManager();
      if (mgr !== null && mgr !== command.actorId) {
        return Err(AppErr('FORBIDDEN', 'Bu buyurtmaga ruxsatingiz yo\'q'));
      }
    }
    const prevStatus = order.getStatus();

    const canTransResult = order.canTransitionTo(command.toStatus);
    if (!canTransResult.ok) return Err(canTransResult.error);

    const guardResult = await this.checkBusinessGuards(
      command.orderId, command.toStatus, order.getCustomerTier(), order.getTotalAmount(),
    );
    if (!guardResult.ok) return Err(guardResult.error);

    const transResult = order.transition(command.toStatus);
    if (!transResult.ok) return Err(transResult.error);

    const historyRow: CreateStatusHistoryRow = {
      orderId:      command.orderId,
      fromStatus:   prevStatus,
      toStatus:     command.toStatus,
      changedBy:    command.changedBy,
      reason:       command.reason ?? null,
      stateVersion: order.getStateVersion(),
    };

    const persistResult = await this.repo.persistStatusTransition(
      command.orderId,
      order.getStatus(),
      order.getStateVersion(),
      historyRow,
    );
    if (!persistResult.ok) return Err(persistResult.error);

    this.logger.log({
      msg: "Status o'zgardi", id: command.orderId,
      from: prevStatus, to: command.toStatus, actor: command.changedBy,
    });
    await this.eventBus.publish(new OrderStatusChangedEvent(
      command.orderId, order.getOrderNumber(), prevStatus,
      command.toStatus, command.changedBy, new Date(),
    ));

    return Ok({ status: order.getStatus() });
  }

  private async checkBusinessGuards(
    orderId:      string,
    toStatus:     string,
    customerTier: string,
    totalAmount:  number,
  ): Promise<Result<void>> {
    if (toStatus === 'PRODUCTION_SCHEDULED') {
      return this.guardProductionScheduled(orderId);
    }
    if (toStatus === 'SHIPPING_READY' || toStatus === 'SHIPPING') {
      return this.guardShipping(orderId, customerTier, totalAmount);
    }
    if (toStatus === 'CLOSED') {
      return this.guardClosed(orderId);
    }
    return Ok();
  }

  private async guardProductionScheduled(orderId: string): Promise<Result<void>> {
    const orderRowResult = await this.repo.findOrderGuardFields(orderId);
    if (!orderRowResult.ok) return Err(orderRowResult.error);
    const orderRow = orderRowResult.data;
    if (!orderRow) {
      return Err(AppErr('NOT_FOUND', `Buyurtma topilmadi: ${orderId}`));
    }
    if (!orderRow.customerApproved) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION',
        'Ishlab chiqarishni rejalash uchun mijoz tasdiqlashi kerak'));
    }
    if (!orderRow.techCardConfirmedAt) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION',
        'Ishlab chiqarishni rejalash uchun texnik karta tasdiqlanmagan'));
    }

    const paymentsResult = await this.repo.findPaymentPlanEntries(orderId);
    if (!paymentsResult.ok) return Err(paymentsResult.error);
    const payments = paymentsResult.data;
    const hasAdvance = (Array.isArray(payments) ? payments : []).some((e: PaymentEntryReadRow) => e.dueType === ADVANCE_DUE_TYPE);
    if (!hasAdvance) {
      return Err(AppErr('PAYMENT_REQUIRED',
        'Ishlab chiqarishni rejalash uchun avans to\'lov rejasi talab qilinadi'));
    }

    const materialsResult = await this.repo.findMaterialRequirements(orderId);
    if (!materialsResult.ok) return Err(materialsResult.error);
    const materials = materialsResult.data;
    if (materials.length > 0) {
      const unready = (Array.isArray(materials) ? materials : []).filter(
        (m) => m.status !== RESERVED_STATUS || !m.labPassed || Number(m.qtyReserved) < Number(m.qtyRequired),
      );
      if (unready.length > 0) {
        return Err(AppErr('BUSINESS_RULE_VIOLATION',
          `${unready.length} ta material RESERVED emas, laboratoriyadan o'tmagan yoki zahiralari yetarli emas`));
      }
    }

    return Ok();
  }

  private async guardShipping(
    orderId:      string,
    customerTier: string,
    _totalAmount: number,
  ): Promise<Result<void>> {
    if (customerTier === VIP_TIER) {
      return Ok();
    }

    const paymentsResult = await this.repo.findPaymentPlanEntries(orderId);
    if (!paymentsResult.ok) return Err(paymentsResult.error);
    const payments = paymentsResult.data;

    if (customerTier === REGULAR_TIER) {
      const seq1 = (Array.isArray(payments) ? payments : []).find((e) => e.sequence === 1);
      const seq2 = (Array.isArray(payments) ? payments : []).find((e) => e.sequence === 2);
      if (!seq1 || seq1.status !== PAID_STATUS) {
        return Err(AppErr('PAYMENT_REQUIRED',
          'Jo\'natish uchun sequence 1 to\'lovi to\'langan bo\'lishi kerak (tier: REGULAR)'));
      }
      if (!seq2 || seq2.status !== PAID_STATUS) {
        return Err(AppErr('PAYMENT_REQUIRED',
          'Jo\'natish uchun sequence 2 to\'lovi to\'langan bo\'lishi kerak (tier: REGULAR)'));
      }
    } else {
      const seq1 = (Array.isArray(payments) ? payments : []).find((e) => e.sequence === 1);
      if (!seq1 || seq1.status !== PAID_STATUS) {
        return Err(AppErr('PAYMENT_REQUIRED',
          'Jo\'natish uchun birinchi avans to\'lov (sequence 1) to\'langan bo\'lishi kerak (tier: NEW)'));
      }
    }

    return Ok();
  }

  private async guardClosed(orderId: string): Promise<Result<void>> {
    const orderRowResult = await this.repo.findOrderGuardFields(orderId);
    if (!orderRowResult.ok) return Err(orderRowResult.error);
    const orderRow = orderRowResult.data;

    if (!orderRow) {
      return Err(AppErr('NOT_FOUND', `Buyurtma topilmadi: ${orderId}`));
    }
    if (!orderRow.actualDeliveryAt) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION',
        'Buyurtmani yopish uchun yetkazib berish tasdiqlanmagan'));
    }
    if (!orderRow.customerSignatureUrl) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION',
        'Buyurtmani yopish uchun mijoz imzosi talab qilinadi'));
    }

    const paymentsResult = await this.repo.findPaymentPlanEntries(orderId);
    if (!paymentsResult.ok) return Err(paymentsResult.error);
    const payments = paymentsResult.data;

    if ((payments ?? []).length === 0) {
      return Err(AppErr('PAYMENT_REQUIRED', 'Yopish uchun to\'lov rejasi bo\'lishi kerak'));
    }
    const unpaid = (Array.isArray(payments) ? payments : []).filter((e) => e.status !== PAID_STATUS);
    if (unpaid.length > 0) {
      return Err(AppErr('PAYMENT_REQUIRED',
        `Yopish uchun barcha ${payments.length} ta to'lov to'langan bo'lishi kerak. To'lanmagan: ${unpaid.length}`));
    }
    return Ok();
  }
}
