/**
 * @module create-payment-plan.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { IOrderRepo, ORDER_WF_REPO, PaymentPlanEntryRow } from '../../infrastructure/repositories/i-order.repo';

const MAX_ENTRIES = 10;
const PCT_TOTAL   = 100;
const OVERDUE_DAYS_VIP_THRESHOLD = 30;
const OVERDUE_DAYS_REGULAR_THRESHOLD = 90;

export interface PaymentEntryInput {
  sequence:     number;
  dueType:      'ADVANCE' | 'MILESTONE' | 'NET_30' | 'ON_DELIVERY';
  percent:      number;
  dueCondition?: Record<string, unknown>;
}

export class CreatePaymentPlanCommand {
  constructor(
    public readonly orderId:   string,
    public readonly entries:   PaymentEntryInput[],
    public readonly createdBy: number,
  ) {}
}

@CommandHandler(CreatePaymentPlanCommand)
export class CreatePaymentPlanHandler implements ICommandHandler<CreatePaymentPlanCommand> {
  private readonly logger = new Logger(CreatePaymentPlanHandler.name);

  constructor(
    @Inject(ORDER_WF_REPO) private readonly repo: IOrderRepo,
  ) {}

  async execute(command: CreatePaymentPlanCommand): Promise<Result<{ count: number }>> {
    if ((command.entries ?? []).length === 0) {
      return Err(AppErr('VALIDATION', 'To\'lov rejasida kamida 1 ta entry bo\'lishi kerak'));
    }
    if (command.entries.length > MAX_ENTRIES) {
      return Err(AppErr('VALIDATION', `Maksimum ${MAX_ENTRIES} ta entry ruxsat etiladi`));
    }

    const totalPct = (Array.isArray(command.entries) ? command.entries : []).reduce((s, e) => s + e.percent, 0);
    if (Math.abs(totalPct - PCT_TOTAL) > 0.01) {
      return Err(AppErr('VALIDATION', `Foizlar yig'indisi 100 bo'lishi kerak, hozir: ${totalPct}`));
    }

    const found = await this.repo.findById(command.orderId);
    if (!found.ok) return Err(found.error);
    if (!found.data) return Err(AppErr('NOT_FOUND', `Buyurtma topilmadi: ${command.orderId}`));

    const order = found.data;

    const rows: PaymentPlanEntryRow[] = (Array.isArray(command.entries) ? command.entries : []).map((e) => ({
      orderId:      command.orderId,
      sequence:     e.sequence,
      dueType:      e.dueType,
      dueCondition: e.dueCondition ?? {},
      percent:      String(e.percent),
      amount:       String((order.getTotalAmount() * e.percent) / PCT_TOTAL),
      status:       'PENDING' as const,
    }));

    const replaceResult = await this.repo.replacePaymentPlanEntries(command.orderId, rows);
    if (!replaceResult.ok) return Err(replaceResult.error);

    this.logger.log({ msg: 'To\'lov rejasi yaratildi', orderId: command.orderId, count: rows.length });
    return Ok({ count: rows.length });
  }
}
