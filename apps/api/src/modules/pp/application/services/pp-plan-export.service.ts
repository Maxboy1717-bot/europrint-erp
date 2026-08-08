/**
 * @module pp-plan-export.service
 * @description EP-PP-129 (Modul-07 #41): serialize the ranked production plan
 *   (GetProductionQueueQuery output) into an audit-friendly CSV snapshot that
 *   opens directly in Excel. PURE transform — no I/O, no DB (Rule 15). The
 *   controller runs the query + streams; this service only turns the REAL queue
 *   rows into CSV text.
 *
 *   No fabrication (Q-40): every column maps to a field the production-queue
 *   query already returns from production_orders. An empty queue yields a
 *   header-only CSV (honest — no invented rows). CSV, not .xlsx: the repo has no
 *   spreadsheet library and the proven export pattern (modules/export) streams
 *   CSV — adding an xlsx dependency is a Guruh-B (owner) decision.
 */

import { Injectable } from '@nestjs/common';

/**
 * Exported columns, in fixed order. Each maps to a REAL field the
 * production-queue query surfaces (rank/id/orderNumber/productName/status/
 * priority/isUrgent/isFrozen/deadline). No column is fabricated (Q-40).
 */
export const PP_PLAN_EXPORT_HEADERS = [
  'rank',
  'order_id',
  'order_number',
  'product_name',
  'status',
  'priority',
  'is_urgent',
  'is_frozen',
  'deadline',
] as const;

@Injectable()
export class PpPlanExportService {
  /**
   * RFC-4180 field escape: when the value contains a comma, double-quote, CR or
   * LF, wrap it in double quotes and double every inner quote. Null/undefined
   * become an empty field.
   */
  private escapeCsvField(value: unknown): string {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  /** Deadline (Date | ISO string | null) → `YYYY-MM-DD`, or '' when absent/invalid. */
  private formatDeadline(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    const d = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  /** Project one queue row onto the fixed column order, then escape each cell. */
  private toCells(row: Record<string, unknown>): string[] {
    return [
      row.rank,
      row.id,
      row.orderNumber,
      row.productName,
      row.status,
      row.priority,
      row.isUrgent,
      row.isFrozen,
      this.formatDeadline(row.deadline),
    ].map((cell) => this.escapeCsvField(cell));
  }

  /**
   * Serialize the ranked production plan to CSV: a header row plus one line per
   * plan item. Non-array / empty input → header-only CSV (honest, no
   * fabrication). Trailing newline terminates the final record.
   */
  serializePlanCsv(rows: unknown): string {
    const list = Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
    const header = PP_PLAN_EXPORT_HEADERS.join(',');
    const body = list.map((r) => this.toCells(r).join(',')).join('\n');
    return body ? `${header}\n${body}\n` : `${header}\n`;
  }
}
