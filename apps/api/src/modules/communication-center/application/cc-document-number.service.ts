/**
 * Hujjat raqami generatori. Format misollari:
 *   AVANS-{YYYY}-{SEQ}    →  AVANS-2026-0042
 *   DOK-{YY}-{MM}-{SEQ4}  →  DOK-26-05-0042
 *
 * Tokenlar:
 *   {YYYY}  to'liq yil
 *   {YY}    qisqa yil
 *   {MM}    oy (01..12)
 *   {DD}    kun (01..31)
 *   {SEQ}   shu yildagi shablon ichidagi tartib raqam (1, 2, 3...)
 *   {SEQ4}  4-belgili padding bilan (0001, 0002...)
 *   {SEQ6}  6-belgili padding bilan
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';

@Injectable()
export class CcDocumentNumberService {
  /** Berilgan shablon uchun keyingi yagona hujjat raqamini yaratadi (atomic) */
  async generate(templateId: string, format: string): Promise<string> {
    const parts = this.buildDateParts();
    const seq = await this.nextSequence(templateId, parts.year);
    return this.applyFormat(format, parts, seq);
  }

  private buildDateParts(): { yyyy: string; yy: string; mm: string; dd: string; year: number } {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    return {
      yyyy,
      yy: yyyy.slice(-2),
      mm: String(now.getMonth() + 1).padStart(2, '0'),
      dd: String(now.getDate()).padStart(2, '0'),
      year: Number(yyyy),
    };
  }

  private async nextSequence(templateId: string, year: number): Promise<number> {
    // pg_advisory_xact_lock — transaction-level lock, template+year unique key.
    // Two concurrent requests for the same template+year wait in line — no duplicate seq.
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(abs(hashtext(${templateId} || ':' || ${year}::text)))`,
      );
      const r = await tx.execute(sql`
        SELECT (COUNT(*) + 1)::int AS seq
        FROM cc_documents
        WHERE template_id = ${templateId}
          AND EXTRACT(YEAR FROM created_at) = ${year}
      `);
      return Number((r.rows[0] as { seq: number })?.seq ?? 1);
    });
  }

  private applyFormat(
    format: string,
    p: { yyyy: string; yy: string; mm: string; dd: string },
    seq: number,
  ): string {
    return format
      .replace(/\{YYYY\}/g, p.yyyy)
      .replace(/\{YY\}/g,   p.yy)
      .replace(/\{MM\}/g,   p.mm)
      .replace(/\{DD\}/g,   p.dd)
      .replace(/\{SEQ6\}/g, String(seq).padStart(6, '0'))
      .replace(/\{SEQ4\}/g, String(seq).padStart(4, '0'))
      .replace(/\{SEQ\}/g,  String(seq).padStart(4, '0'));   // default SEQ = SEQ4
  }
}
