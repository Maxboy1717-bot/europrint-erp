/**
 * @module finance-accounting.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { safeInt } from '../../hr/common/db-rows';
import { safeCall, Result, Ok, Err, AppErr, AppError } from '@common/result';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { DrizzleFinanceAccountingRepo } from '../infrastructure/repositories/drizzle-finance-accounting.repo';
import { GlPostingService, JournalLine } from '../domain/services/gl-posting.service';
import { TashkentTimeService } from '@common/time';

/**
 * EP-FIN-004 "4-hisob" account group.
 * BHMS (Uzbekistan national chart of accounts) code ranges:
 *   WORKING = 1000–5999  (aylanma kapital: kassa, bank, debitorlar, inventar, tovarlar)
 *   TAX     = 6000–6999  (majburiy to'lovlar: kreditorlar, QQS, INPS, bank kreditlari)
 *   HEAD    = 8000–8999  (kapital va zaxiralar: ustav kapitali, taqsimlanmagan foyda)
 *   MAIN    = 9000–9999  (foyda va zarar: tushum, tannarx, xarajatlar)
 * Codes outside these explicit ranges (e.g. 0xxx fixed assets, 7xxx long-term) fall
 * into WORKING by default — they are still working-capital-adjacent balance accounts.
 */
export interface AccountGroupEntry {
  group: 'WORKING' | 'TAX' | 'HEAD' | 'MAIN';
  label: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  accountCount: number;
  accounts: Array<{ code: string; name: string; type: string; debit: number; credit: number; balance: number }>;
}

const ACCOUNT_GROUP_LABELS: Record<AccountGroupEntry['group'], string> = {
  WORKING: 'Aylanma kapital',
  TAX:     "Majburiy to'lovlar",
  HEAD:    'Kapital va zaxiralar',
  MAIN:    'Foyda va zarar',
};
// Fixed display order: working capital → obligations → equity → P&L.
const ACCOUNT_GROUP_ORDER: AccountGroupEntry['group'][] = ['WORKING', 'TAX', 'HEAD', 'MAIN'];

@Injectable()
export class FinanceAccountingService {
  private readonly logger = new Logger(FinanceAccountingService.name);
  private readonly _time = new TashkentTimeService();

  constructor(
    private readonly accountingRepo: DrizzleFinanceAccountingRepo,
    private readonly glPosting: GlPostingService,
  ) {}

  async getDashboard() {
    return this.accountingRepo.getDashboard();
  }

  async getAccounts(type?: string, limit = 50, offset = 0) {
    const result = await this.accountingRepo.findAccounts(type, limit, offset);
    if (!result.ok) {
      this.logger.error('getAccounts error', result.error);
      return { items: [] as Record<string, unknown>[], total: 0 };
    }
    return { items: result.data, total: result.data.length };
  }

  /**
   * EP-FIN-004 — "4-hisob" account grouping with live GL balances.
   * Groups the chart of accounts into 4 BHMS buckets (WORKING/TAX/HEAD/MAIN) and, for each,
   * sums the real debit/credit movements from the canonical `entries` ledger.
   *
   * Join key: `entries.debit_account_id` / `credit_account_id` are integer FKs to `accounts.id`
   * (NOT the code string). This matches the Drizzle schema + getTrialBalance/getLedger; the
   * drift columns `entries.debit_account`/`credit_account` (code strings) are NULL for some rows
   * and must not be used as the join.
   *
   * Returns exactly 4 groups (empty groups included with zero totals) so the FE widget is stable.
   */
  async getAccountGroups(): Promise<Result<AccountGroupEntry[]>> {
    try {
      // Raw SQL (Q-4 exception): CASE-WHEN range bucketing + conditional aggregation across a
      // joined ledger is not expressible as a single typesafe Drizzle builder query.
      const rows = await runQuery<{
        grp: string;
        account_code: string;
        account_name: string;
        account_type: string;
        acc_debit: string;
        acc_credit: string;
      }>(sql`
        SELECT
          a.account_code,
          a.account_name,
          a.account_type,
          COALESCE(SUM(CASE WHEN e.debit_account_id  = a.id THEN e.amount ELSE 0 END), 0) AS acc_debit,
          COALESCE(SUM(CASE WHEN e.credit_account_id = a.id THEN e.amount ELSE 0 END), 0) AS acc_credit,
          CASE
            WHEN a.account_code >= '9000' AND a.account_code <= '9999' THEN 'MAIN'
            WHEN a.account_code >= '8000' AND a.account_code <= '8999' THEN 'HEAD'
            WHEN a.account_code >= '6000' AND a.account_code <= '6999' THEN 'TAX'
            ELSE 'WORKING'
          END AS grp
        FROM accounts a
        LEFT JOIN entries e
          ON e.debit_account_id = a.id OR e.credit_account_id = a.id
        WHERE a.deleted_at IS NULL
        GROUP BY a.id, a.account_code, a.account_name, a.account_type
        ORDER BY a.account_code
      `);

      const list = Array.isArray(rows) ? rows : [];

      // Pre-seed all 4 groups so the response shape is fixed even when a range has no accounts.
      const groupMap = new Map<AccountGroupEntry['group'], AccountGroupEntry>();
      for (const g of ACCOUNT_GROUP_ORDER) {
        groupMap.set(g, {
          group: g,
          label: ACCOUNT_GROUP_LABELS[g],
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          accountCount: 0,
          accounts: [],
        });
      }

      for (const r of list) {
        const key = (r.grp as AccountGroupEntry['group']) ?? 'WORKING';
        const bucket = groupMap.get(key);
        if (!bucket) continue;
        const debit = Number(r.acc_debit) || 0;
        const credit = Number(r.acc_credit) || 0;
        bucket.totalDebit += debit;
        bucket.totalCredit += credit;
        bucket.balance += debit - credit;
        bucket.accountCount += 1;
        bucket.accounts.push({
          code: r.account_code,
          name: r.account_name,
          type: r.account_type,
          debit,
          credit,
          balance: debit - credit,
        });
      }

      return Ok(ACCOUNT_GROUP_ORDER.map((g) => groupMap.get(g) as AccountGroupEntry));
    } catch (e) {
      this.logger.error('getAccountGroups error', e as Error);
      return Err(AppErr('INTERNAL', '4-hisob guruhlarini olishda xatolik'));
    }
  }

  async getGlDocuments(status?: string, documentType?: string, startDate?: string, endDate?: string, limitParam?: string, offsetParam?: string) {
    const limitVal  = safeInt(limitParam, 50);
    const offsetVal = safeInt(offsetParam, 0);
    return this.accountingRepo.getGlDocumentsFiltered({ status, documentType, startDate, endDate }, limitVal, offsetVal);
  }

  /**
   * Create a GL document = post a BALANCED double-entry journal to the canonical `entries` ledger
   * (SAP#76: `entries` is the ONE money ledger; gl_lines/gl_documents are NOT the ledger of record).
   * Mirrors FiService.createGlDoc — POST /api/accounting/gl-documents is now HONEST.
   *
   * Honest contract (Q-40, Q-43):
   *  - Each request line carries an account code (`accountCode`, or a code string in `account_id`)
   *    plus `debit`/`credit`.
   *  - If ΣDebit == ΣCredit (within 0.01) AND there is ≥1 debit leg and ≥1 credit leg, we post real
   *    balanced rows via the ONE engine (GlPostingService → resolves codes → accounts.id → INSERT
   *    into `entries`). No header is written to gl_documents; no gl_lines are written.
   *  - Otherwise we return a CLEAR 400. We do NOT silently persist a header, do NOT write gl_lines,
   *    and do NOT invent a contra account.
   */
  /**
   * F9 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): manual journal entries now go through a real
   * draft -> review -> post gate instead of posting straight to `entries`. This endpoint has no
   * FE caller (grep-verified, per the Q1 comment below) so changing its contract is zero-risk to
   * existing consumers. Event-driven postings (sales invoice, payroll, POS, delivery) are NOT
   * gated here — those derive from an already-approved business event and post immediately, same
   * as before; this gate is specifically for ad-hoc, human-entered journal entries, matching how
   * real accounting systems treat manual JEs differently from system-generated ones.
   *
   * Reuses `gl_documents` (0 live rows since the SAP-conformance fix removed its old write path,
   * per the Q1 comment above — its status/posted_by/posted_at/metadata columns already fit a
   * draft-document workflow, so no new table is needed — Q-35) as the draft store: this method
   * validates + persists a `pending_review` row; `approveGlDocument`/`rejectGlDocument` below
   * complete the gate.
   */
  async createGlDocument(body: Record<string, unknown>, createdBy?: number) {
    const rawLines = Array.isArray(body.lines) ? (body.lines as Array<Record<string, unknown>>) : [];
    if (rawLines.length === 0) {
      throw new BadRequestException(
        "GL hujjati uchun kamida ikkita yozuv (debet va kredit) kerak. Bo'sh hujjat saqlanmaydi.",
      );
    }

    // Map each document line to a JournalLine. The account is identified by code (`accountCode`);
    // `account_id` is accepted only when it is itself a code string (no silent wrong-account post).
    const lines: JournalLine[] = rawLines.map((l) => {
      const accountCode = String(l.accountCode ?? l.account_id ?? l.accountId ?? '').trim();
      const debit = Number(l.debit ?? l.debitAmount ?? l.debit_amount ?? 0) || 0;
      const credit = Number(l.credit ?? l.creditAmount ?? l.credit_amount ?? 0) || 0;
      const accountName = String(l.accountName ?? l.account_name ?? accountCode);
      return { accountCode, accountName, debit, credit };
    });

    const totalDebit = lines.reduce((s, l) => s + (l.debit > 0 ? l.debit : 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit > 0 ? l.credit : 0), 0);
    const hasDebitLeg = lines.some((l) => l.debit > 0);
    const hasCreditLeg = lines.some((l) => l.credit > 0);

    // Double-entry balance is REQUIRED. An unbalanced / single-leg document is rejected here
    // (an honest error beats a fake-green header).
    if (!hasDebitLeg || !hasCreditLeg || Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Ikki tomonlama balans talab qilinadi: debet (${totalDebit}) = kredit (${totalCredit}) ` +
          `bo'lishi shart va kamida bitta debet hamda bitta kredit yozuvi (kontra hisob) kerak. ` +
          `Kontra hisob avtomatik tanlanmaydi — uni hujjat yozuvlariga qo'shing.`,
      );
    }

    const reference = String(body.documentNumber ?? body.document_number ?? `GLDOC-${Date.now()}`);
    const inserted = await runQuery<{ id: number; created_at: string }>(sql`
      INSERT INTO gl_documents
        (document_number, document_date, posting_date, document_type, description, total_debit,
         total_credit, status, created_by, metadata, created_at)
      VALUES
        (${reference}, ${String(body.documentDate ?? body.document_date ?? this._time.now().toISOString().slice(0, 10))},
         ${String(body.postingDate ?? body.posting_date ?? this._time.now().toISOString().slice(0, 10))},
         'manual_journal',
         ${body.description != null ? String(body.description) : null}, ${totalDebit}, ${totalCredit},
         'pending_review', ${createdBy ?? null}, ${JSON.stringify({ lines })}::jsonb, NOW())
      RETURNING id, created_at
    `);
    const draft = inserted.rows[0];
    if (!draft) throw new InternalServerErrorException('GL hujjat qoralamasi saqlanmadi');

    return {
      draftId: draft.id,
      status: 'pending_review',
      reference,
      documentDate: body.documentDate ?? body.document_date ?? null,
      description: body.description ?? null,
      totalDebit,
      totalCredit,
      lines,
      ledger: null, // not yet posted — see POST .../gl-entries/:id/approve
    };
  }

  /**
   * F9: approve a pending_review draft — re-validates the balance (defense in depth; it was
   * already validated at draft time) and posts through the ONE engine. Idempotent: calling this
   * twice on an already-posted draft returns Err (status guard), never double-posts.
   */
  async approveGlDocument(id: number, approvedBy: number) {
    const rows = await runQuery<{ id: number; document_number: string; status: string; metadata: unknown }>(sql`
      SELECT id, document_number, status, metadata FROM gl_documents WHERE id = ${id} LIMIT 1
    `);
    const draft = rows.rows[0];
    if (!draft) throw new NotFoundException(`GL hujjat qoralamasi #${id} topilmadi`);
    if (draft.status !== 'pending_review') {
      throw new BadRequestException(`GL hujjat #${id} allaqachon "${draft.status}" holatida — qayta tasdiqlab bo'lmaydi`);
    }
    const meta = (typeof draft.metadata === 'string' ? JSON.parse(draft.metadata) : draft.metadata) as { lines?: JournalLine[] };
    const lines = Array.isArray(meta?.lines) ? meta.lines : [];
    if (lines.length === 0) throw new InternalServerErrorException(`GL hujjat #${id} yozuvlari yo'qolgan`);

    const posted = await this.glPosting.postJournal(lines, draft.document_number);
    if (!posted.ok) {
      throw new BadRequestException(typeof posted.error === 'string' ? posted.error : posted.error.message);
    }

    await runQuery(sql`
      UPDATE gl_documents
      SET status = 'posted', posted_by = ${approvedBy}, posted_at = NOW(),
          reference_type = 'entries', reference_id = ${String(posted.data)}
      WHERE id = ${id}
    `);

    return { draftId: id, entryId: posted.data, status: 'posted' as const };
  }

  /** F9: reject a pending_review draft — no GL post, just a status flip with the reviewer recorded. */
  async rejectGlDocument(id: number, rejectedBy: number) {
    const result = await runQuery<{ id: number }>(sql`
      UPDATE gl_documents
      SET status = 'rejected', posted_by = ${rejectedBy}, posted_at = NOW()
      WHERE id = ${id} AND status = 'pending_review'
      RETURNING id
    `);
    if (!result.rows[0]) {
      throw new BadRequestException(`GL hujjat #${id} topilmadi yoki allaqachon ko'rib chiqilgan (faqat pending_review rad etiladi)`);
    }
    return { draftId: id, status: 'rejected' as const };
  }

  /**
   * F11 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): recurring journal entries — minimal viable.
   * Reuses `gl_documents` (document_type='recurring_template', status='active') as the template
   * store — no new table (Q-35). The template itself is NEVER posted; `RecurringJournalEntriesCron`
   * reads active templates and, when due, creates a NEW draft instance (document_type=
   * 'manual_journal', status='pending_review', same as a hand-entered createGlDocument() draft) —
   * a recurring entry still goes through the F9 draft->review->post gate before it ever reaches
   * `entries`, rather than auto-posting unattended.
   */
  async createRecurringTemplate(body: Record<string, unknown>, createdBy?: number) {
    const rawLines = Array.isArray(body.lines) ? (body.lines as Array<Record<string, unknown>>) : [];
    if (rawLines.length === 0) {
      throw new BadRequestException("Takrorlanuvchi shablon uchun kamida ikkita yozuv (debet va kredit) kerak.");
    }
    const lines: JournalLine[] = rawLines.map((l) => ({
      accountCode: String(l.accountCode ?? l.account_id ?? l.accountId ?? '').trim(),
      accountName: String(l.accountName ?? l.account_name ?? l.accountCode ?? ''),
      debit: Number(l.debit ?? l.debitAmount ?? l.debit_amount ?? 0) || 0,
      credit: Number(l.credit ?? l.creditAmount ?? l.credit_amount ?? 0) || 0,
    }));
    const totalDebit = lines.reduce((s, l) => s + (l.debit > 0 ? l.debit : 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit > 0 ? l.credit : 0), 0);
    if (!lines.some((l) => l.debit > 0) || !lines.some((l) => l.credit > 0) || Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Ikki tomonlama balans talab qilinadi: debet (${totalDebit}) = kredit (${totalCredit}) bo'lishi shart.`,
      );
    }
    const frequency = String(body.frequency ?? '');
    if (!['monthly', 'quarterly', 'yearly'].includes(frequency)) {
      throw new BadRequestException("frequency 'monthly' | 'quarterly' | 'yearly' bo'lishi kerak");
    }
    const description = body.description != null ? String(body.description) : null;
    const templateNumber = `RECUR-${Date.now()}`;
    const today = this._time.now().toISOString().slice(0, 10);
    const inserted = await runQuery<{ id: number }>(sql`
      INSERT INTO gl_documents
        (document_number, document_date, posting_date, document_type, description, total_debit,
         total_credit, status, created_by, metadata, created_at)
      VALUES
        (${templateNumber}, ${today}, ${today}, 'recurring_template', ${description}, ${totalDebit},
         ${totalCredit}, 'active', ${createdBy ?? null},
         ${JSON.stringify({ lines, frequency, lastGeneratedPeriod: null })}::jsonb, NOW())
      RETURNING id
    `);
    const row = inserted.rows[0];
    if (!row) throw new InternalServerErrorException('Takrorlanuvchi shablon saqlanmadi');
    return { templateId: row.id, templateNumber, frequency, status: 'active' as const, totalDebit, totalCredit };
  }

  /**
   * Q2 (SAP-conformance fix, 2026-07-04): reverses a canonical `entries` row by posting a NEW
   * balanced journal entry with debit/credit swapped, via the same ONE engine as createGlDocument
   * (GlPostingService.postJournal). Previously this "reversal" only inserted a `[REVERSAL]`-tagged
   * `gl_documents` header — no mirrored entry ever reached the ledger, so the trial balance never
   * actually reflected the reversal.
   *
   * Joins on `debit_account_id`/`credit_account_id` (integer FKs), NOT the `debit_account`/
   * `credit_account` drift text columns (NULL for some rows — see getAccountGroups comment above).
   * Idempotent via GlPostingService's own reference-based dedup (`REV-{id}` is looked up before
   * inserting), so calling reverse twice on the same id returns the same reversal entry, not a
   * second one.
   */
  async reverseEntry(id: number) {
    const rows = await runQuery<{
      id: number; amount: string; debit_code: string; credit_code: string;
    }>(sql`
      SELECT e.id, e.amount, da.account_code AS debit_code, ca.account_code AS credit_code
      FROM entries e
      JOIN accounts da ON da.id = e.debit_account_id
      JOIN accounts ca ON ca.id = e.credit_account_id
      WHERE e.id = ${id}
      LIMIT 1
    `);
    const original = Array.isArray(rows) ? rows[0] : undefined;
    if (!original) {
      throw new NotFoundException(`Entries qatori topilmadi: id=${id}`);
    }

    const reference = `REV-${id}`;
    const amount = Number(original.amount);
    const reversalLines: JournalLine[] = [
      { accountCode: original.credit_code, accountName: original.credit_code, debit: amount, credit: 0 },
      { accountCode: original.debit_code, accountName: original.debit_code, debit: 0, credit: amount },
    ];
    const posted = await this.glPosting.postJournal(reversalLines, reference);
    if (!posted.ok) {
      throw new InternalServerErrorException(
        typeof posted.error === 'string' ? posted.error : posted.error.message,
      );
    }
    return { entryId: posted.data, reference, reversedEntryId: id, ledger: 'entries' };
  }

  /**
   * A4 (governance fix, 2026-07-05): extracted from
   * FinanceMainActionsController.recalculateProfitability, which ran this raw UPDATE directly
   * in the controller. Moved here verbatim (same SQL, same conditions, same computed values) —
   * pure layer move, not a behavior change. Optionally scoped to a single orderId (matched
   * against either sales_order_id or production_order_id); otherwise recalculates all rows.
   */
  async recalculateProfitability(orderId?: string): Promise<Result<{ updated: number; orderId: string | null; recalcAt: string }>> {
    try {
      type Row = Record<string, unknown>;
      const r = await db.execute(
        orderId
          ? sql`
              UPDATE order_costings
              SET gross_profit  = (selling_price::numeric - total_cost::numeric),
                  profit_margin = ROUND(
                    (selling_price::numeric - total_cost::numeric)
                    / NULLIF(selling_price::numeric, 0) * 100, 4
                  ),
                  calculated_at = NOW()
              WHERE sales_order_id::text = ${orderId}
                 OR production_order_id::text = ${orderId}
              RETURNING id, gross_profit, profit_margin, calculated_at
            `
          : sql`
              UPDATE order_costings
              SET gross_profit  = (selling_price::numeric - total_cost::numeric),
                  profit_margin = ROUND(
                    (selling_price::numeric - total_cost::numeric)
                    / NULLIF(selling_price::numeric, 0) * 100, 4
                  ),
                  calculated_at = NOW()
              RETURNING id, gross_profit, profit_margin, calculated_at
            `,
      );
      const rows = (((r as { rows?: Row[] }).rows) ?? []);
      this.logger.log(`Profitability recalc done: ${rows.length} rows updated orderId=${orderId ?? 'all'}`);
      return Ok({ updated: rows.length, orderId: orderId ?? null, recalcAt: this._time.now().toISOString() });
    } catch (e) {
      this.logger.error(`recalculateProfitability: ${(e as Error).message}`);
      return Err(AppErr('INTERNAL', (e as Error).message));
    }
  }

  async getPeriods() {
    return this.accountingRepo.getPeriods();
  }

  async getPeriod(id: number) {
    return this.accountingRepo.getPeriodById(id);
  }

  async closePeriod(id: number, closedBy: number | null) {
    return this.accountingRepo.closePeriod(id, closedBy);
  }

  async getMaterials(warehouseId?: string, startDate?: string, endDate?: string, moveType?: string, limitParam?: string, offsetParam?: string) {
    const limitVal  = safeInt(limitParam, 100);
    const offsetVal = safeInt(offsetParam, 0);
    return this.accountingRepo.getMaterialsFiltered({ warehouseId, startDate, endDate, moveType }, limitVal, offsetVal);
  }

  async getMaterialsByOrder(orderId: string) {
    const { moves, summary } = await this.accountingRepo.getMaterialsByOrder(orderId);
    const s = summary as Record<string, unknown>;
    return {
      moves,
      summary: { totalQuantity: Number(s.total_quantity) || 0, totalCost: Number(s.total_cost) || 0, moveCount: Number(s.move_count) || 0 },
    };
  }

  async getInventoryValuation() {
    const { materials, summary } = await this.accountingRepo.getInventoryValuation();
    const s = summary as Record<string, unknown>;
    return {
      materials,
      summary: { totalItems: Number(s.total_items) || 0, totalStock: Number(s.total_stock) || 0, totalValue: Number(s.total_value) || 0 },
    };
  }

  async getExpenseReports(status?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const statusParam = status ?? null;
    const r: Result<Record<string, unknown>[]> = await safeCall(() => this.accountingRepo.getExpenseReports(statusParam, limit, offset));
    if (!r.ok) { this.logger.warn(`getExpenseReports: ${r.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    return { data: r.data, pagination: { total: r.data.length, page, limit } };
  }

  async getExpenseReportById(id: string) {
    const r = await safeCall(() => this.accountingRepo.getExpenseReportById(id));
    if (!r.ok) { this.logger.warn(`getExpenseReportById(${id}): ${r.error}`); throw new NotFoundException(String(r.error)); }
    return r.data;
  }
}
