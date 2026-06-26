/**
 * @module finance-accounting.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { safeInt } from '../../hr/common/db-rows';
import { safeCall, Result, Ok, Err, AppErr, AppError } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { DrizzleFinanceAccountingRepo } from '../infrastructure/repositories/drizzle-finance-accounting.repo';
import { GlPostingService, JournalLine } from '../domain/services/gl-posting.service';

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
  async createGlDocument(body: Record<string, unknown>) {
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

    // Balanced → post to the canonical entries ledger via the ONE engine.
    const reference = String(body.documentNumber ?? body.document_number ?? `GLDOC-${Date.now()}`);
    const posted = await this.glPosting.postJournal(lines, reference);
    if (!posted.ok) {
      // Account-not-in-chart / DB failures surface honestly (no header, no gl_lines).
      throw new BadRequestException(
        typeof posted.error === 'string' ? posted.error : posted.error.message,
      );
    }

    return {
      entryId: posted.data,
      reference,
      documentDate: body.documentDate ?? body.document_date ?? null,
      description: body.description ?? null,
      totalDebit,
      totalCredit,
      lines,
      ledger: 'entries',
    };
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
