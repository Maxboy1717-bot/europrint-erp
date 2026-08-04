/**
 * auto-gl-posting.service.ts
 *
 * Har harakat yakunlanganda avtomatik GL Posting yaratish.
 * Hisob juftliklari UzBekiston standart reja asosida.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { AutoGlPostingRepository } from '../../infrastructure/repositories/auto-gl-posting.repository';
// SB0817 fix: POS movements must ALSO reach the canonical `entries` ledger (not only the
// pos_gl_postings subledger) — GlPostingService.postJournal() is the ONE engine every other
// module (SD payments, WMS goods-issue/receipt, payroll) uses to write `entries` (see
// gl-posting.service.ts:85-92). Reused here rather than duplicating account-resolution/
// balance-check/period-lock/idempotency logic a second time.
import { GlPostingService, type JournalLine } from '@modules/finance/domain/services/gl-posting.service';

export interface GlEntry {
  movementId:    number;
  debitAccount:  string;
  creditAccount: string;
  amount:        number;
  description:   string;
}

// #10 GL-unify (P2): corrected to LIVE Uzbek BHMS codes (table `accounts`), so it was using codes
// that don't exist (6010/4010/9110/1020/1030) and 9430 = Amortizatsiya (depreciation) for damage.
// SB0817: these SAME codes now ALSO drive the canonical `entries` post (via GlPostingService.postJournal
// below) — previously this auto-posting fed ONLY the `pos_gl_postings` SUBLEDGER, leaving the real
// ledger blind to every POS warehouse movement. FLAGGED for owner: the chart has no distinct
// quarantine-inventory or tools/MRO account → both map to 1010 (Xom ashyo); and INTERNAL_TRANSFER
// between same-class warehouses has no GL value change (1010↔1010 nets to zero — a harmless wash;
// ideally it would post no entry at all — see the debit===credit skip in calculateEntries/postForMovement).
const GL_ACCOUNTS = {
  WAREHOUSE_RM:        '1010', // Xom ashyo va materiallar
  WAREHOUSE_WIP:       '2010', // Asosiy ishlab chiqarish (WIP)
  WAREHOUSE_FG:        '2810', // Tayyor mahsulot
  WAREHOUSE_QC:        '1010', // quarantine RM → Xom ashyo (no distinct quarantine account — FLAGGED)
  WAREHOUSE_TOOLS:     '1010', // no distinct tools/MRO inventory account — FLAGGED
  ACCOUNTS_PAYABLE:    '6000', // Yetkazib beruvchilarga to'lovlar (Kreditorlar)
  ACCOUNTS_RECEIVABLE: '4000', // Mijozlardan olinadigan summalar (Debitorlar)
  REVENUE:             '9010', // Tayyor mahsulot sotuvidan tushum
  COGS:                '9100', // Sotilgan mahsulot tannarxi
  DEPT_EXPENSE:        '2010', // Asosiy ishlab chiqarish (material issued to production / WIP)
  QC_EXPENSE:          '9500', // Boshqa operatsion xarajatlar (no distinct QC-expense account)
  // Owner interview 2026-07-13 (chat): scrap/loss value now defaults to a dedicated general
  // "Ishlab chiqarish zarari" account for ALL loss-type events, instead of sharing 9500 "Boshqa
  // operatsion xarajatlar" with unrelated other-expense postings. Was '9500' — see
  // gl-loss-marketing-referral-intransit-accounts-2026-07-13.sql (also updates the matching
  // gl_account_mappings DAMAGE/INVENTORY_ADJ_MINUS rows used by gl-posting-log.repository.ts).
  DAMAGE_EXPENSE:      '9520', // Ishlab chiqarish zarari (shortage/damage write-off — NOT depreciation)
} as const;

@Injectable()
export class AutoGlPostingService {
  private readonly logger = new Logger(AutoGlPostingService.name);

  constructor(
    private readonly repo: AutoGlPostingRepository,
    private readonly glPosting: GlPostingService,
  ) {}

  private calculateEntries(movementType: string, amount: number, movementId: number): GlEntry[] {
    const entries: GlEntry[] = [];
    switch (movementType) {
      case 'EXTERNAL_IN':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.WAREHOUSE_QC, creditAccount: GL_ACCOUNTS.ACCOUNTS_PAYABLE, amount, description: 'Tashqi kirim — Karantin omboriga' });
        break;
      case 'EXTERNAL_OUT':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.ACCOUNTS_RECEIVABLE, creditAccount: GL_ACCOUNTS.REVENUE, amount, description: 'Tashqi chiqim — Mijozga sotish' });
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.COGS, creditAccount: GL_ACCOUNTS.WAREHOUSE_FG, amount, description: 'Sotilgan tovar tannarxi' });
        break;
      case 'INTERNAL_ISSUE':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.DEPT_EXPENSE, creditAccount: GL_ACCOUNTS.WAREHOUSE_RM, amount, description: 'Bo\'limga berish — Material xarajati' });
        break;
      case 'INTERNAL_RETURN':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.WAREHOUSE_RM, creditAccount: GL_ACCOUNTS.DEPT_EXPENSE, amount, description: 'Materialni omborga qaytarish' });
        break;
      case 'DAMAGE':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.DAMAGE_EXPENSE, creditAccount: GL_ACCOUNTS.WAREHOUSE_RM, amount, description: 'Zarar akti — Yo\'qolish/buzilish' });
        break;
      case 'INTERNAL_TRANSFER':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.WAREHOUSE_RM, creditAccount: GL_ACCOUNTS.WAREHOUSE_RM, amount, description: 'Omborlararo ko\'chirish (audit)' });
        break;
      case 'INVENTORY_ADJUST':
        entries.push({ movementId, debitAccount: amount >= 0 ? GL_ACCOUNTS.WAREHOUSE_RM : GL_ACCOUNTS.DAMAGE_EXPENSE, creditAccount: amount >= 0 ? GL_ACCOUNTS.DAMAGE_EXPENSE : GL_ACCOUNTS.WAREHOUSE_RM, amount: Math.abs(amount), description: `Inventarizatsiya tuzatish (${amount >= 0 ? '+' : '-'})` });
        break;
      default:
        this.logger.warn(`[AutoGL] Noma'lum harakat turi: ${movementType}`);
    }
    return entries;
  }

  async postForMovement(movementId: number): Promise<Result<{ posted: number; entries: GlEntry[] }, AppError>> {
    try {
      this.logger.log(`[AutoGL] Movement ${movementId} uchun GL posting hisoblanmoqda...`);

      const movR = await this.repo.findMovement(movementId);
      if (!movR.ok) return Err(movR.error);
      const mov = movR.data;
      if (!mov) return Err({ message: 'Harakat topilmadi', code: 'NOT_FOUND' });

      let totalAmount = Number(mov.total_amount);
      if (totalAmount === 0) {
        const sumR = await this.repo.sumLines(movementId);
        if (!sumR.ok) return Err(sumR.error);
        totalAmount = sumR.data;
      }
      if (totalAmount === 0) {
        this.logger.log(`[AutoGL] Movement ${movementId} miqdori 0 — GL posting o'tkazilmadi`);
        return Ok({ posted: 0, entries: [] });
      }

      const entries = this.calculateEntries(mov.movement_type, totalAmount, movementId);
      if (entries.length === 0) return Ok({ posted: 0, entries: [] });

      const existingR = await this.repo.countExistingPostings(movementId);
      if (!existingR.ok) return Err(existingR.error);
      const existing = existingR.data;
      if (existing > 0) {
        this.logger.log(`[AutoGL] Movement ${movementId} uchun ${existing} ta GL yozuvi allaqachon bor`);
        return Ok({ posted: 0, entries: [] });
      }

      // A86 — ATOMIK yozish: harakatning BARCHA GL oyoqlari bitta tranzaksiyada (hammasi yoki hech biri).
      // Eski har-oyoq alohida `insertPosting` loop balanssiz yarim-yozuv qoldirar edi (masalan EXTERNAL_OUT
      // ning 2 oyog'idan biri yozilib, ikkinchisi xato bersa). Endi balansli juftlik atomik kafolatlanadi.
      const exchangeRate = Number(mov.exchange_rate) || 1;
      const postingR = await this.repo.insertPostingsAtomic(
        entries.map((e) => ({
          movementId:   e.movementId,
          debitAccount: e.debitAccount,
          creditAccount: e.creditAccount,
          amount:       e.amount,
          currency:     mov.currency,
          exchangeRate,
          amountBase:   e.amount * exchangeRate,
          description:  e.description,
        })),
      );
      if (!postingR.ok) return Err(postingR.error);
      const posted = postingR.data;

      this.logger.log(`[AutoGL] ✅ ${mov.movement_number}: ${posted} ta GL yozuvi atomik yaratildi (jami: ${totalAmount} ${mov.currency})`);

      // SB0817: mirror the SAME balanced legs into the canonical `entries` ledger via the ONE
      // posting engine (GlPostingService.postJournal — resolves codes→accounts.id, validates
      // ΣDr==ΣCr, enforces the EP-FIN-064 period lock, and is idempotent on `reference`). This
      // runs only for legs actually written to the subledger (`posted > 0`), and only for legs
      // that are GL-meaningful (skips the same wash filter as insertPostingsAtomic: amount<=0 or
      // debit===credit, e.g. INTERNAL_TRANSFER 1010↔1010) so `entries` never gets a zero/no-op row.
      // Best-effort: a canonical-ledger failure is logged but does NOT fail the movement approval
      // (the subledger write above already succeeded and is the source of truth for POS UI/journal).
      if (posted > 0) {
        const canonicalLines: JournalLine[] = entries
          .filter((e) => Number.isFinite(e.amount) && e.amount > 0 && e.debitAccount !== e.creditAccount)
          .flatMap((e) => [
            { accountCode: e.debitAccount,  accountName: e.description, debit: e.amount, credit: 0 } satisfies JournalLine,
            { accountCode: e.creditAccount, accountName: e.description, debit: 0, credit: e.amount } satisfies JournalLine,
          ]);
        if (canonicalLines.length > 0) {
          const reference = `POS-${mov.movement_number}`;
          const glR = await this.glPosting.postJournal(canonicalLines, reference);
          if (!glR.ok) {
            this.logger.warn(`[AutoGL] Kanonik entries yozuvi muvaffaqiyatsiz (${mov.movement_number}): ${glR.error.message}`);
          } else {
            this.logger.log(`[AutoGL] ✅ ${mov.movement_number}: kanonik entries ledgeriga yozildi (entry id=${glR.data})`);
          }
        }
      }

      return Ok({ posted, entries });
    } catch (e) {
      this.logger.error(`[AutoGL] Xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listForMovement(movementId: number): Promise<Result<unknown[], AppError>> {
    return this.repo.listForMovement(movementId);
  }

  /**
   * Discovery sweep 2026-08-03 fix ("GL kanonik 'entries' mirror atomik emas — best-effort,
   * avto-reconciliation yo'q"). Called from PosGlReconciliationCron (daily). For each movement
   * whose atomic pos_gl_postings subledger has no matching canonical `entries` row, re-derive
   * the JournalLines from the ALREADY-COMMITTED subledger rows (source of truth — not
   * recomputed from calculateEntries(), which could have drifted since the original post) and
   * retry postJournal(). Safe to retry: createJournalEntry's own findEntryIdByReference guard
   * makes a re-post a no-op if some earlier attempt actually did land after all (race between
   * the reconciliation query and a slow original write).
   */
  async reconcileMissingCanonicalEntries(limit = 200): Promise<Result<{ checked: number; posted: number; stillFailing: string[] }, AppError>> {
    const candidatesR = await this.repo.findMovementsMissingCanonicalEntry(limit);
    if (!candidatesR.ok) return Err(candidatesR.error);
    const candidates = candidatesR.data;
    if (candidates.length === 0) return Ok({ checked: 0, posted: 0, stillFailing: [] });

    let posted = 0;
    const stillFailing: string[] = [];

    for (const { movementId, movementNumber } of candidates) {
      const legsR = await this.repo.listForMovement(movementId);
      if (!legsR.ok) { stillFailing.push(movementNumber); continue; }
      const legs = legsR.data as Array<{ debit_account: string; credit_account: string; amount: number | string; description: string }>;
      const canonicalLines: JournalLine[] = legs
        .filter((l) => Number.isFinite(Number(l.amount)) && Number(l.amount) > 0 && l.debit_account !== l.credit_account)
        .flatMap((l) => [
          { accountCode: l.debit_account,  accountName: l.description, debit: Number(l.amount), credit: 0 } satisfies JournalLine,
          { accountCode: l.credit_account, accountName: l.description, debit: 0, credit: Number(l.amount) } satisfies JournalLine,
        ]);
      if (canonicalLines.length === 0) continue; // subledger legs were all wash entries — nothing to mirror

      const glR = await this.glPosting.postJournal(canonicalLines, `POS-${movementNumber}`);
      if (glR.ok) {
        posted++;
        this.logger.log(`[AutoGL] Reconciliation: ${movementNumber} kanonik entries'ga backfill qilindi (entry id=${glR.data})`);
      } else {
        stillFailing.push(movementNumber);
        this.logger.warn(`[AutoGL] Reconciliation: ${movementNumber} hamon muvaffaqiyatsiz — ${glR.error.message}`);
      }
    }

    return Ok({ checked: candidates.length, posted, stillFailing });
  }

  /**
   * FAZA Auto-GL (I) — Finance tasdig'i: movement bo'yicha barcha pos_gl_postings
   * yozuvlarini is_approved=true qiladi (dead-end edi — approve endpoint yo'q edi).
   */
  async approveForMovement(movementId: number, approvedBy: number): Promise<Result<{ approved: number }, AppError>> {
    const r = await this.repo.approveByMovement(movementId, approvedBy);
    if (!r.ok) return Err(r.error);
    if (r.data > 0) this.logger.log(`[AutoGL] Movement ${movementId}: ${r.data} ta pos_gl_postings tasdiqlandi (approvedBy=${approvedBy})`);
    return Ok({ approved: r.data });
  }

  async getJournal(filters?: {
    dateFrom?: string; dateTo?: string;
    debitAccount?: string; creditAccount?: string;
    limit?: number;
  }): Promise<Result<unknown[], AppError>> {
    return this.repo.getJournal(filters);
  }
}
