/**
 * @module delivery-completed.listener
 * @description Golden thread T-14: reacts to DeliveryCompletedEvent (published by
 *   logistics/complete-delivery.handler) and posts the full sales-invoice GL split
 *   (EP-FIN-005) into the canonical `entries` ledger via GlPostingService. Replaces
 *   the prior log-only stub which wrote NOTHING to the ledger (Q-46: broken/stub code
 *   fully replaced, not left half-working).
 *
 *   EP_COST_RATIO is configurable master-data (owner decision MASSIV-50 #3 = 0.65),
 *   read at runtime from the canonical `settings` table (key/value) — NOT hardcoded.
 *   If the setting is absent/invalid the COGS legs are skipped (revenue legs still post),
 *   and a warning is logged so the owner can populate it; the GL never invents a ratio.
 *
 *   ⚠️ Canonical ledger is `entries` only. gl_journal_entries / gl_lines are NEVER touched
 *   (SAP#76 forbidden).
 */

import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { FinanceRepository } from '../repositories/drizzle-finance.repo';
import { DeliveryCompletedEvent } from '@modules/logistics/domain/events';
import { GlPostingService } from '../../domain/services/gl-posting.service';

// O'zbekiston QQS 12% — Soliq Kodeksi bo'yicha qonuniy belgilangan (qonun o'zgarmaguncha
// o'zgarmaydi), shuning uchun kod-konstanta sifatida qolishi maqbul (P08 §2.4).
const EP_VAT_RATE = 0.12;

// Master-data setting kaliti — canonical `settings` jadvali (key/value), getSettingValue
// o'qiydigan o'sha jadval. Egasi qiymatni ekrandan/seeddan o'zgartiradi.
const EP_COST_RATIO_KEY = 'EP_COST_RATIO';

@Injectable()
@EventsHandler(DeliveryCompletedEvent)
export class DeliveryCompletedListener implements IEventHandler<DeliveryCompletedEvent> {
  private readonly logger = new Logger(DeliveryCompletedListener.name);

  constructor(
    @Inject(FINANCE_REPO) private readonly financeRepo: FinanceRepository,
    private readonly glPostingService: GlPostingService,
  ) {}

  /**
   * Read EP_COST_RATIO from the canonical `settings` table. Returns a valid ratio in (0,1)
   * or null when the setting is missing/out-of-range. Never throws (Result-style guard).
   */
  private async readCostRatio(): Promise<number | null> {
    try {
      // settings.value is TEXT; EP_COST_RATIO is a float ratio (e.g. '0.65'), so it cannot
      // go through financeRepo.getSettingValue (parseInt → would truncate 0.65 to 0). Read raw.
      const rows = await runQuery<{ value: string | null }>(sql`
        SELECT value FROM settings WHERE key = ${EP_COST_RATIO_KEY} LIMIT 1
      `);
      const list = Array.isArray(rows) ? rows : [];
      const raw = list[0]?.value ?? null;
      if (raw == null) return null;
      const ratio = Number(raw);
      if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 1) return null;
      return ratio;
    } catch (error: unknown) {
      this.logger.error(
        `Failed reading ${EP_COST_RATIO_KEY} from settings: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async handle(event: DeliveryCompletedEvent): Promise<void> {
    try {
      this.logger.log(
        `Trigger 14: Delivery completed — EP-FIN-005 GL posting (delivery=${event.deliveryId}, order=${event.orderId})`,
      );

      // Step 1: locate the invoice for this delivered sales order (by sales_order_id,
      // then fall back to direct id lookup — invoice tables vary in which column carries the order).
      let invoice: Record<string, unknown> | null = null;
      const bySalesOrder = await this.financeRepo.findInvoiceBySalesOrderId(String(event.orderId));
      if (bySalesOrder.ok && bySalesOrder.data) {
        invoice = bySalesOrder.data;
      } else {
        const direct = await this.financeRepo.findInvoiceById(String(event.orderId));
        if (direct.ok && direct.data) invoice = direct.data;
      }

      if (!invoice) {
        this.logger.warn(
          `DeliveryCompletedListener: invoice not found for order ${event.orderId} — GL posting skipped`,
        );
        return;
      }

      const totalAmount = Number(invoice['totalAmount'] ?? invoice['total_amount'] ?? 0);
      if (!(totalAmount > 0)) {
        this.logger.warn(
          `DeliveryCompletedListener: totalAmount <= 0 for order ${event.orderId} — GL posting skipped`,
        );
        return;
      }

      // Step 2: tax = 12% VAT (statutory constant). COGS = totalAmount * EP_COST_RATIO (configurable).
      const tax = Math.round(totalAmount * EP_VAT_RATE * 100) / 100;

      const epCostRatio = await this.readCostRatio();
      let costOfGoods = 0;
      if (epCostRatio == null) {
        // Owner has not configured EP_COST_RATIO (settings.EP_COST_RATIO). Post the revenue legs
        // (AR/Revenue/Tax) anyway so receivables/revenue are never lost, but skip the COGS pair and
        // flag it — the ratio is never invented (Q-40).
        this.logger.warn(
          `DeliveryCompletedListener: ${EP_COST_RATIO_KEY} not configured in settings (expected 0<r<1) ` +
            `— posting revenue legs WITHOUT COGS for order ${event.orderId}. EGASI QIYMATI KERAK.`,
        );
      } else {
        costOfGoods = Math.round(totalAmount * epCostRatio * 100) / 100;
      }

      // Step 3: post the EP-FIN-005 journal to the canonical `entries` ledger (idempotent DC-<orderId>).
      const glResult = await this.glPostingService.postDeliveryCompleted(
        event.orderId,
        totalAmount,
        tax,
        costOfGoods,
      );

      if (!glResult.ok) {
        this.logger.error(
          `EP-FIN-005 GL posting failed for order ${event.orderId}: ${String(glResult.error)}`,
        );
        return;
      }

      this.logger.log(
        `EP-FIN-005 GL posted to entries — order=${event.orderId}, entryId=${glResult.data}, ` +
          `total=${totalAmount}, tax=${tax}, cogs=${costOfGoods}, epCostRatio=${epCostRatio ?? 'unset'}`,
      );
    } catch (error: unknown) {
      this.logger.error(`Error processing DeliveryCompletedEvent: ${(error as Error).message}`);
    }
  }
}
