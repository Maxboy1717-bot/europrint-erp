/**
 * @module qc-passed-certificate.listener
 * @description Golden-thread gap fix (SB0126, MOP-UP 2026-07-04): QC pass had NO certificate
 *   entity created automatically. `QcCertificatePdfService.generate()` already existed
 *   (T21-A2, Gap #19) but was ONLY reachable via the manual `POST /qc/certificates/generate-pdf`
 *   endpoint (operator has to remember to click "Generate" on a separate page). An order could
 *   pass inspection, be received into finished-goods stock (Trigger 11 → WMS), and ship —
 *   with zero certificate row ever created, because nothing on the QC→WMS event chain called
 *   the certificate generator.
 *
 *   This listener closes that gap the same way `QcPassedListener` (WMS side) closes the
 *   stock-receipt gap: it subscribes to the SAME `QcPassedEvent` CQRS event already published
 *   by `SubmitInspectionHandler` (Trigger 11) and calls the EXISTING certificate service —
 *   no new table, no new sequence, no fabricated data. Product name is resolved from the real
 *   sales_order_items → material_cards join (same join shape as QcPassedListener uses for FG
 *   receipt); when no line exists (Q-40: no fabrication) productName stays null and the PDF
 *   still generates with a blank product field (matches manual-generation behaviour already
 *   accepted for that case in QcCertificatePdfService).
 *
 *   Idempotency: guarded by NOT EXISTS on `certificates.order_id` + status='active' so a
 *   duplicate QcPassedEvent fire (at-least-once delivery, retry) does not mint a second
 *   certificate number for the same order. Listener failures are caught + logged, never
 *   thrown back to the event bus (mirrors QcPassedListener's resilience pattern — a
 *   certificate hiccup must not abort sibling listeners on the same event).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { QcPassedEvent } from '../../domain/events';
import { QcCertificatePdfService } from '../../application/qc-certificate-pdf.service';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

interface ExistingCertRow {
  id: number;
}

interface FgProductRow {
  product_name: string | null;
}

@Injectable()
@EventsHandler(QcPassedEvent)
export class QcPassedCertificateListener implements IEventHandler<QcPassedEvent> {
  private readonly logger = new Logger(QcPassedCertificateListener.name);

  constructor(private readonly certPdfSvc: QcCertificatePdfService) {}

  async handle(event: QcPassedEvent): Promise<void> {
    try {
      await this._autoIssueCertificate(event);
    } catch (error: unknown) {
      // Same resilience contract as QcPassedListener: a certificate failure must not
      // throw back to the event bus and abort the sibling WMS FG-receipt listener.
      this.logger.error(
        {
          inspectionId: event.inspectionId,
          orderId: event.orderId,
          error: (error as Error)?.message ?? String(error),
        },
        'QcPassedCertificateListener: certificate auto-issue failed (golden-thread step QC→Certificate)',
      );
    }
  }

  private async _autoIssueCertificate(event: QcPassedEvent): Promise<void> {
    const orderId = Number(event.orderId) || 0;
    if (!orderId) {
      this.logger.warn(
        { inspectionId: event.inspectionId },
        'QcPassedCertificateListener: event has no orderId, skipping certificate',
      );
      return;
    }

    // Idempotency guard: one active certificate per order (same order can only pass once
    // in the normal flow; a retry/duplicate event must be a no-op, not a second cert number).
    const existing = await runQuery<ExistingCertRow>(sql`
      SELECT id FROM certificates
      WHERE order_id = ${orderId} AND status = 'active'
      LIMIT 1
    `);
    if (existing.rows.length > 0) {
      this.logger.log(
        { orderId, existingCertificateId: existing.rows[0]?.id },
        'QcPassedCertificateListener: certificate already exists for this order (idempotent skip)',
      );
      return;
    }

    // Product name from the real order line (same join as QcPassedListener's FG receipt).
    // Q-40: no fabrication — if there is no line item, productName stays null.
    const productRows = await runQuery<FgProductRow>(sql`
      SELECT mc.xom_ashyo AS product_name
      FROM sales_order_items soi
      LEFT JOIN material_cards mc ON mc.id = COALESCE(soi.product_id, soi.material_id)
      WHERE soi.sales_order_id = ${orderId}
      LIMIT 1
    `);
    const productName = productRows.rows[0]?.product_name ?? null;

    const result = await this.certPdfSvc.generate({
      orderId,
      productName,
      issuedBy: 'QC-auto (Trigger 11)',
      notes: `Auto-issued on QC pass (inspection #${event.inspectionId})`,
    });

    if (!result.ok) {
      this.logger.error(
        { orderId, inspectionId: event.inspectionId, error: String(result.error) },
        'QcPassedCertificateListener: certificate generation failed',
      );
      return;
    }

    this.logger.log(
      { orderId, inspectionId: event.inspectionId, certNumber: result.data.certNumber, certificateId: result.data.certificateId },
      'Trigger 11: QC passed - certificate auto-issued (golden thread QC->Certificate closed)',
    );
  }
}
