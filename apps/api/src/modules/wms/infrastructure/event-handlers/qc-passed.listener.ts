/**
 * @module qc-passed.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { QcPassedEvent } from '../../../qc/domain/events';
import { ReceiveFgCommand } from '../../application/commands/receive-fg.handler';
import { Result } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

/** Passed quantity + warehouse + sort grade resolved from the QC inspection row itself. */
interface InspectionLookupRow {
  pass_count: number;
  warehouse_id: number;
  /** T21-A2: sifat-saralash navi (first|second|third|scrap) yoki NULL. */
  sort_grade: string | null;
}

/** One finished-goods line item of the sales order. T21-A2: net_price = base unit price. */
interface FgLineRow {
  /** finished-goods product (sales_order_items.product_id). Contamination guard (decision 5): NO
   *  material_cards fallback — a line with NULL product_id is skipped, never keyed by material_id. */
  product_id: number | null;
  /** kept ONLY to log a skipped line (has a material_cards id but no product_id). */
  material_id: number | null;
  net_price: string | number | null;
}

/** T21-A2: nav → narx koeffitsienti (qc_grade_price_coefficients). */
interface GradeCoefficientRow {
  coefficient: string | number;
}

@Injectable()
@EventsHandler(QcPassedEvent)
export class QcPassedListener implements IEventHandler<QcPassedEvent> {
  private readonly logger = new Logger(QcPassedListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: QcPassedEvent) {
    this.logger.log(
      { inspectionId: event.inspectionId, orderId: event.orderId },
      'Trigger 11: QC passed - Creating FG receipt',
    );

    // #22 listener resilience: the whole FG-receipt flow is best-effort. The QC
    // inspection already committed upstream; a failure to spin up the FG receipt
    // must NOT throw back to the event bus (which would abort sibling listeners and
    // surface an unhandled rejection). All failures are caught + structured-logged
    // here; the inner command result is already checked per-line below.
    try {
      await this._receiveFgFromInspection(event);
    } catch (error: unknown) {
      this.logger.error(
        {
          inspectionId: event.inspectionId,
          orderId: event.orderId,
          error: (error as Error)?.message ?? String(error),
        },
        'QcPassedListener: FG receipt flow failed (golden-thread step QC→WMS)',
      );
    }
  }

  private async _receiveFgFromInspection(event: QcPassedEvent): Promise<void> {
    // The passed quantity lives on the QC inspection row (qc_inspections.pass_count —
    // the canonical inspection table this listener's event id refers to; fall back to
    // items_passed which save() also writes). sales_orders has NO product_id/quantity
    // columns, so the FG material(s) must come from the line-item table instead.
    const inspectionRows = await runQuery<InspectionLookupRow>(sql`
      SELECT
        COALESCE(qi.pass_count, qi.items_passed, 0) AS pass_count,
        COALESCE(w.id, 1)                           AS warehouse_id,
        qi.sort_grade                               AS sort_grade
      FROM qc_inspections qi
      LEFT JOIN warehouses w ON w.type = 'finished_goods' OR w.name ILIKE '%finished%'
      WHERE qi.id = ${Number(event.inspectionId)}
      LIMIT 1
    `);

    const inspection = inspectionRows.rows[0];
    if (!inspection) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcPassedListener: inspection row not found, skipping FG receipt',
      );
      return;
    }
    const passQty = Number(inspection.pass_count) || 0;
    const warehouseId = Number(inspection.warehouse_id) || 1;

    // T21-A2: nav (sort_grade) bo'lsa, narx koeffitsientini config'dan o'qish. SOXTA fallback
    // YO'Q (Q-40): nav uchun koeffitsient master-data'da yo'q bo'lsa koeffitsient qo'llanmaydi
    // (graded value NULL) — qabul bekor qilinmaydi, faqat baholanmagan kirim bo'ladi.
    const gradeCoefficient = await this._resolveGradeCoefficient(inspection.sort_grade);

    // Nothing actually passed inspection → nothing to receive into stock. A 0-qty
    // receipt would only create/touch an empty warehouse_stock row (no-op kirim) and
    // spawn a meaningless WmsFgReceivedEvent + rental timer. Real orders with a zero
    // or missing pass_count must skip the FG receipt entirely.
    if (passQty <= 0) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcPassedListener: pass_count <= 0, skipping FG receipt (nothing to stock)',
      );
      return;
    }

    // Contamination guard (decision 5): finished-goods stock is products.id-keyed, so the FG receipt
    // uses soi.product_id ONLY — NO COALESCE fallback to soi.material_id (which lives in the
    // material_cards id space). A line with a NULL product_id is skipped + flagged in the loop below,
    // never fabricated from a material_cards id.
    const lineRows = await runQuery<FgLineRow>(sql`
      SELECT
        soi.product_id  AS product_id,
        soi.material_id AS material_id,
        soi.net_price   AS net_price
      FROM sales_order_items soi
      WHERE soi.sales_order_id = ${event.orderId}
    `);

    const lines = Array.isArray(lineRows.rows) ? lineRows.rows : [];
    if (lines.length === 0) {
      this.logger.warn(
        { orderId: event.orderId },
        'QcPassedListener: no sales_order_items lines for order, skipping FG receipt',
      );
      return;
    }

    // Dispatch via ReceiveFgHandler so orderId flows into WmsFgReceivedEvent
    // and the rental timer (Trigger 12) can fire. A direct wmsRepo.receiveFg()
    // call cannot carry orderId — command dispatch is the canonical path that
    // both performs the warehouse_stock UPSERT and publishes the order-attributed
    // WmsFgReceivedEvent. One receipt per finished-goods line item.
    for (const line of lines) {
      // Contamination guard (decision 5): use product_id ONLY. A line without a product_id (e.g. only
      // a material_cards id) is SKIPPED + flagged — never fabricate a product id from a material_cards id.
      const productId = line.product_id != null ? Number(line.product_id) : 0;
      if (!productId) {
        this.logger.warn(
          { orderId: event.orderId, materialCardsId: line.material_id },
          'QcPassedListener: FG receipt SKIPPED — sales_order_item has no product_id (contamination guard, decision 5)',
        );
        continue;
      }

      // T21-A2: graded FG unit cost = base (net_price) × sort coefficient. When either the
      // base price is missing OR no coefficient is configured for the nav, gradedUnitCost
      // stays null — the receipt still lands (no blocking), just unpriced.
      const basePrice = line.net_price != null ? Number(line.net_price) : null;
      const gradedUnitCost =
        basePrice != null && Number.isFinite(basePrice) && gradeCoefficient != null
          ? Math.round(basePrice * gradeCoefficient * 100) / 100
          : null;

      const result = await this.commandBus.execute<ReceiveFgCommand, Result<void>>(
        new ReceiveFgCommand(
          productId, // FG stock is products.id-keyed (warehouse_stock_fg)
          warehouseId,
          passQty, // received quantity = QC passed count
          `QC-${event.inspectionId}`, // batchNumber — traceable to the inspection
          null, // expiryDate — FG has no expiry by default
          event.orderId, // orderId — attributes the FG + enables Trigger 12 rental timer
          undefined, // areaM2 — resolved in the handler (FG area source is a flagged follow-up, see STEP 2 report)
          gradedUnitCost, // T21-A2: nav-koeffitsienti bilan saralangan birlik narxi
          true, // T23-A1: cross-listener dedup — skip if MES already received FG for this order+material
        ),
      );

      if (!result.ok) {
        this.logger.error(
          { orderId: event.orderId, productId, error: String(result.error) },
          'Failed to receive FG after QC passed',
        );
      } else {
        this.logger.log(
          { orderId: event.orderId, productId, qty: passQty, grade: inspection.sort_grade, gradedUnitCost },
          'Trigger 11 -> 12: FG receipt UPSERTed to warehouse_stock_fg (grade-priced), rental timer will start',
        );
      }
    }
  }

  /**
   * T21-A2 — nav (sort_grade) uchun narx koeffitsientini qc_grade_price_coefficients dan o'qiydi.
   * Q-40: SOXTA fallback YO'Q — nav NULL yoki koeffitsient master-data'da topilmasa null qaytaradi
   * (kirim baholanmagan holda o'tadi, blok bo'lmaydi). is_active=TRUE koeffitsient tanlanadi.
   */
  private async _resolveGradeCoefficient(sortGrade: string | null): Promise<number | null> {
    if (!sortGrade) return null;
    const rows = await runQuery<GradeCoefficientRow>(sql`
      SELECT coefficient
      FROM qc_grade_price_coefficients
      WHERE grade = ${sortGrade} AND is_active = TRUE
      LIMIT 1
    `);
    const raw = rows.rows[0]?.coefficient;
    if (raw == null) return null;
    const coef = Number(raw);
    return Number.isFinite(coef) && coef >= 0 ? coef : null;
  }
}
