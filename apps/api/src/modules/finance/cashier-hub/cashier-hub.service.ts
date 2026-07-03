/**
 * @module cashier-hub.service
 * @description CASHIER-HUB KAS-1 business logic. The single factory cashier hub:
 *   openShift (one open shift per cashier), closeShift (X/Z reconciliation), recordMovement
 *   (real GL journal via GlPostingService → canonical `entries`; PIN-gated cash-out/salary;
 *   idempotent by reference). Result<T> everywhere; Zod-validated input. Owner #8 PIN=4 digit,
 *   #11 GL via canonical `entries`.
 * @layer Application (Finance)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError, AppErr, Ok, Err } from '@common/result';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { GlPostingService, JournalLine } from '../domain/services/gl-posting.service';
import { GL } from '../domain/constants/gl-accounts.constants';
import {
  CASHIER_HUB_REPO,
  type ICashierHubRepository,
  type CashierMovementType,
  type ShiftSummary,
  type ShiftListPage,
  type CashierLedger,
  type CashierLedgerLine,
} from './i-cashier-hub.repo';
import type { CashierShift } from '@workspace/db';

/** Movement types that move cash OUT of the drawer and therefore require PIN confirmation (owner #8). */
const PIN_REQUIRED_TYPES: ReadonlySet<CashierMovementType> = new Set([
  'cash_out',
  'salary_payout',
  'advance',
  'expense',
]);

const OpenShiftSchema = z.object({
  cashierUserId: z.number().int().positive(),
  openingAmount: z.number().nonnegative(),
  // Optional per-shift daily cash ceiling (UZS). Omitted/null → no per-shift limit.
  dailyCashLimit: z.number().nonnegative().optional().nullable(),
});

/** cash_in is the only inflow; everything else reduces the drawer. */
const INFLOW_TYPE: CashierMovementType = 'cash_in';

const CloseShiftSchema = z.object({
  closedAmount: z.number().nonnegative(),
  notes: z.string().max(2000).optional(),
});

/** GET shifts query — optional status / cashierId filters + pagination (coerced from query strings). */
const ListShiftsQuerySchema = z.object({
  status: z.enum(['open', 'closed']).optional(),
  cashierId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const RecordMovementSchema = z.object({
  type: z.enum(['cash_in', 'cash_out', 'salary_payout', 'advance', 'expense']),
  amount: z.number().positive(),
  reference: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  // owner #8 — exactly 4 digits; optional here, the service enforces it for PIN-required types.
  pin: z.string().regex(/^\d{4}$/, 'PIN 4 raqamdan iborat bo\'lishi kerak').optional(),
  // vizyon 2.14 — kassir so'm+dollar: ISO 3-harf valyuta kodi. Standart UZS.
  currency: z.string().trim().toUpperCase().length(3, 'Valyuta 3 harfdan iborat bo\'lishi kerak').optional(),
  // Owner-provided kurs (ixtiyoriy) — berilmasa xizmat exchange_rates jadvalidan eng so'nggisini oladi.
  exchangeRate: z.number().positive().optional(),
});

@Injectable()
export class CashierHubService {
  private readonly logger = new Logger(CashierHubService.name);

  constructor(
    @Inject(CASHIER_HUB_REPO) private readonly repo: ICashierHubRepository,
    private readonly gl: GlPostingService,
  ) {}

  /** Open a shift. One OPEN shift per cashier (guarded here + DB partial unique index). */
  async openShift(raw: unknown): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const dto = OpenShiftSchema.parse(raw);
      const existing = await this.repo.findOpenShiftByCashier(dto.cashierUserId);
      if (!existing.ok) throw new Error(existing.error.message);
      if (existing.data) {
        throw new Error(`Kassir #${dto.cashierUserId} da allaqachon ochiq smena bor: #${existing.data.id}`);
      }
      const opened = await this.repo.openShift({
        cashierUserId: dto.cashierUserId,
        openingAmount: dto.openingAmount,
        dailyCashLimit: dto.dailyCashLimit ?? null,
      });
      if (!opened.ok) throw new Error(opened.error.message);
      return opened.data;
    });
  }

  /**
   * Close a shift → compute expected = opening + Σ(cash_in) − Σ(cash_out), persist the X/Z summary.
   * variance = closedAmount − expectedAmount.
   */
  async closeShift(shiftId: number, raw: unknown): Promise<Result<ShiftSummary, AppError>> {
    const validated = safeParse(CloseShiftSchema, raw);
    if (!validated.ok) return Err(validated.error);
    const dto = validated.data;

    const shiftRes = await this.repo.findShiftById(shiftId);
    if (!shiftRes.ok) return shiftRes as Result<never, AppError>;
    if (!shiftRes.data) return Err(AppErr('NOT_FOUND', `Smena #${shiftId} topilmadi`));
    if (shiftRes.data.status !== 'open') {
      return Err(AppErr('INVALID_STATUS', `Smena #${shiftId} allaqachon yopilgan`));
    }

    const totalsRes = await this.repo.getShiftMovementTotals(shiftId);
    if (!totalsRes.ok) return totalsRes as Result<never, AppError>;
    const totals = totalsRes.data;

    const opening = Number(shiftRes.data.openedAmount);
    const expectedAmount = opening + totals.cashIn - totals.cashOut;
    const variance = dto.closedAmount - expectedAmount;

    const closed = await this.repo.closeShift(shiftId, {
      closedAmount: dto.closedAmount,
      expectedAmount,
      variance,
      notes: dto.notes ?? null,
    });
    if (!closed.ok) return closed as Result<never, AppError>;

    // Z-report: the final reconciled summary of the now-closed shift, including the
    // counted drawer (closedAmount), the variance (over/short), and a per-type breakdown.
    return Ok({
      shift: closed.data,
      cashIn: totals.cashIn,
      cashOut: totals.cashOut,
      movementCount: totals.movementCount,
      expectedAmount,
      closedAmount: dto.closedAmount,
      variance,
      byType: totals.byType,
    });
  }

  /** Paginated shift list (newest first) for the manager view; optional status / cashier filters. */
  async listShifts(rawQuery: unknown): Promise<Result<ShiftListPage, AppError>> {
    const validated = safeParse(ListShiftsQuerySchema, rawQuery);
    if (!validated.ok) return Err(validated.error);
    const q = validated.data;
    return this.repo.listShifts({
      status: q.status,
      cashierUserId: q.cashierId,
      limit: q.limit ?? 50,
      offset: q.offset ?? 0,
    });
  }

  /** The calling cashier's currently-open shift, or null when none is open (graceful — no 404). */
  async getCurrentShift(cashierUserId?: number): Promise<Result<CashierShift | null, AppError>> {
    if (!cashierUserId || cashierUserId <= 0) {
      return Err(AppErr('VALIDATION', 'Joriy foydalanuvchi aniqlanmadi'));
    }
    return this.repo.findOpenShiftByCashier(cashierUserId);
  }

  /** X-report: live state of an OPEN (or any) shift — opening + running totals + expected. */
  async getShiftSummary(shiftId: number): Promise<Result<ShiftSummary, AppError>> {
    const shiftRes = await this.repo.findShiftById(shiftId);
    if (!shiftRes.ok) return shiftRes as Result<never, AppError>;
    if (!shiftRes.data) return Err(AppErr('NOT_FOUND', `Smena #${shiftId} topilmadi`));

    const totalsRes = await this.repo.getShiftMovementTotals(shiftId);
    if (!totalsRes.ok) return totalsRes as Result<never, AppError>;
    const totals = totalsRes.data;
    const expectedAmount = Number(shiftRes.data.openedAmount) + totals.cashIn - totals.cashOut;

    // For an OPEN shift (X-report) nothing has been counted/closed yet → closedAmount/variance null.
    // For an already-closed shift, echo the persisted reconciliation (counted drawer + variance).
    const closedAmountRaw = shiftRes.data.closedAmount;
    const closedAmount = closedAmountRaw === null || closedAmountRaw === undefined ? null : Number(closedAmountRaw);
    const variance = closedAmount === null ? null : closedAmount - expectedAmount;

    return Ok({
      shift: shiftRes.data,
      cashIn: totals.cashIn,
      cashOut: totals.cashOut,
      movementCount: totals.movementCount,
      expectedAmount,
      closedAmount,
      variance,
      byType: totals.byType,
    });
  }

  /**
   * X/Z naqd-ledger for a shift: the opening drawer + every movement in chronological order,
   * each carrying its signed effect and the RUNNING drawer balance after it, plus the current
   * saldo and an optional daily-limit warning (per-shift ceiling → global cfo_config default).
   * Real data only — no echo: lines come from cashier_movements (DB), saldo is summed here.
   */
  async getShiftLedger(shiftId: number): Promise<Result<CashierLedger, AppError>> {
    const shiftRes = await this.repo.findShiftById(shiftId);
    if (!shiftRes.ok) return shiftRes as Result<never, AppError>;
    if (!shiftRes.data) return Err(AppErr('NOT_FOUND', `Smena #${shiftId} topilmadi`));

    const movesRes = await this.repo.listMovements(shiftId);
    if (!movesRes.ok) return movesRes as Result<never, AppError>;

    const opening = Number(shiftRes.data.openedAmount);
    let running = opening;
    let cashIn = 0;
    let cashOut = 0;
    const lines: CashierLedgerLine[] = (Array.isArray(movesRes.data) ? movesRes.data : []).map((m) => {
      const amount = Number(m.amount);
      const isInflow = m.type === INFLOW_TYPE;
      const signed = isInflow ? amount : -amount;
      if (isInflow) cashIn += amount;
      else cashOut += amount;
      running += signed;
      return {
        id: m.id,
        type: m.type as CashierMovementType,
        amount,
        signedAmount: signed,
        runningBalance: running,
        reference: m.reference,
        description: m.description ?? null,
        pinVerified: Boolean(m.pinVerified),
        createdAt: m.createdAt ?? null,
        currency: m.currency ?? 'UZS',
        exchangeRate: m.exchangeRate === null || m.exchangeRate === undefined ? null : Number(m.exchangeRate),
      };
    });

    const balance = opening + cashIn - cashOut;

    // Effective ceiling: per-shift override wins; otherwise the global cfo_config default.
    const perShiftRaw = shiftRes.data.dailyCashLimit;
    const perShift = perShiftRaw === null || perShiftRaw === undefined ? null : Number(perShiftRaw);
    let dailyCashLimit: number | null = perShift !== null && perShift > 0 ? perShift : null;
    if (dailyCashLimit === null) {
      const globalRes = await this.repo.findGlobalDailyCashLimit();
      if (globalRes.ok) dailyCashLimit = globalRes.data;
    }
    const limitExceeded = dailyCashLimit !== null && balance > dailyCashLimit;

    return Ok({
      shiftId,
      status: shiftRes.data.status,
      openingAmount: opening,
      cashIn,
      cashOut,
      balance,
      dailyCashLimit,
      limitExceeded,
      lines,
    });
  }

  /**
   * Assemble the kunlik PDF (daily Z-report) payload for a shift: the X/Z summary
   * (getShiftSummary) plus the cashier's display name (joined, kunlik PDF header).
   */
  async getDailyReportPayload(shiftId: number): Promise<Result<{
    shiftId: number;
    cashierName: string;
    status: string;
    openedAt: Date | string | null;
    closedAt: Date | string | null;
    openingAmount: number;
    cashIn: number;
    cashOut: number;
    closedAmount: number | null;
    expectedAmount: number;
    variance: number | null;
    movementCount: number;
    byType: ShiftSummary['byType'];
  }, AppError>> {
    const summaryRes = await this.getShiftSummary(shiftId);
    if (!summaryRes.ok) return summaryRes as Result<never, AppError>;
    const s = summaryRes.data;

    const namedRes = await this.repo.getShiftForPdf(shiftId);
    if (!namedRes.ok) return namedRes as Result<never, AppError>;
    const cashierName = namedRes.data?.cashierName ?? `Kassir #${s.shift.cashierUserId}`;

    return Ok({
      shiftId,
      cashierName,
      status: s.shift.status,
      openedAt: s.shift.openedAt,
      closedAt: s.shift.closedAt,
      openingAmount: Number(s.shift.openedAmount),
      cashIn: s.cashIn,
      cashOut: s.cashOut,
      closedAmount: s.closedAmount,
      expectedAmount: s.expectedAmount,
      variance: s.variance,
      movementCount: s.movementCount,
      byType: s.byType,
    });
  }

  /**
   * Record a cash movement against an open shift:
   *  1) validate + PIN-gate (cash_out/salary/advance/expense need a verified 4-digit PIN — owner #8),
   *  2) post a REAL balanced GL journal via GlPostingService (→ canonical `entries`),
   *  3) INSERT cashier_movements with the returned gl_entry_id.
   * Idempotent by `reference` — a re-fired movement returns the existing row (no double GL post).
   */
  async recordMovement(
    shiftId: number,
    raw: unknown,
    operatorUserId?: number,
  ): Promise<Result<unknown, AppError>> {
    const validated = safeParse(RecordMovementSchema, raw);
    if (!validated.ok) return Err(validated.error);
    const dto = validated.data;

    // Idempotency: same business reference → return the already-recorded movement (no second GL post).
    const existing = await this.repo.findMovementByReference(dto.reference);
    if (!existing.ok) return existing as Result<never, AppError>;
    if (existing.data) {
      this.logger.debug(`Movement already recorded for ref ${dto.reference} (idempotent) — id=${existing.data.id}`);
      return Ok(existing.data);
    }

    // Shift must exist and be open.
    const shiftRes = await this.repo.findShiftById(shiftId);
    if (!shiftRes.ok) return shiftRes as Result<never, AppError>;
    if (!shiftRes.data) return Err(AppErr('NOT_FOUND', `Smena #${shiftId} topilmadi`));
    if (shiftRes.data.status !== 'open') {
      return Err(AppErr('INVALID_STATUS', `Smena #${shiftId} yopilgan — harakat qo'shib bo'lmaydi`));
    }

    // PIN gate (owner #8). cash_out / salary / advance / expense REQUIRE a verified 4-digit PIN.
    let pinVerified = false;
    if (PIN_REQUIRED_TYPES.has(dto.type)) {
      if (!dto.pin) {
        return Err(AppErr('FORBIDDEN', `KAS-1: "${dto.type}" harakati uchun kassir PIN majburiy (4 raqam)`));
      }
      const cashierId = operatorUserId ?? shiftRes.data.cashierUserId;
      const pinCheck = await this.verifyPin(cashierId, dto.pin);
      if (!pinCheck.ok) return pinCheck as Result<never, AppError>;
      if (!pinCheck.data) {
        // No PIN store configured OR wrong PIN → gate the movement + flag. Do NOT forge/mint a PIN.
        return Err(
          AppErr(
            'FORBIDDEN',
            `KAS-1: PIN tasdiqlanmadi — "${dto.type}" harakati rad etildi (PIN noto'g'ri yoki PIN-do'koni sozlanmagan)`,
          ),
        );
      }
      pinVerified = true;
    }

    // vizyon 2.14 — kassir so'm+dollar: resolve the movement currency + the rate used to convert
    // it to UZS for the GL post. UZS movements need no rate. Non-UZS movements REQUIRE a resolvable
    // rate (owner-provided in the request, else the latest `exchange_rates` row) — no rate → GATE
    // (never fabricate a conversion, Q-40/EGASI-DATA).
    const currency = (dto.currency ?? 'UZS').toUpperCase();
    let exchangeRate: number | null = null;
    if (currency !== 'UZS') {
      if (dto.exchangeRate && dto.exchangeRate > 0) {
        exchangeRate = dto.exchangeRate;
      } else {
        const rateRes = await this.repo.findLatestExchangeRate(currency);
        if (!rateRes.ok) return rateRes as Result<never, AppError>;
        exchangeRate = rateRes.data;
      }
      if (!exchangeRate || exchangeRate <= 0) {
        return Err(
          AppErr(
            'VALIDATION',
            `KAS-1: "${currency}" uchun kurs topilmadi — exchange_rates jadvaliga kurs kiriting yoki so'rovda exchangeRate yuboring`,
          ),
        );
      }
    }
    // UZS-equivalent amount posted to the GL (native amount when currency=UZS).
    const uzsAmount = currency === 'UZS' ? dto.amount : Math.round(dto.amount * exchangeRate! * 100) / 100;

    // Post the real GL journal first; only on success do we persist the movement with gl_entry_id.
    const glRes = await this.postGl(dto.type, uzsAmount, dto.reference);
    if (!glRes.ok) return glRes as Result<never, AppError>;
    const glEntryId = glRes.data;

    const inserted = await this.repo.insertMovement({
      shiftId,
      type: dto.type,
      amount: dto.amount,
      reference: dto.reference,
      description: dto.description ?? null,
      glEntryId,
      createdBy: operatorUserId ?? shiftRes.data.cashierUserId,
      pinVerified,
      currency,
      exchangeRate,
    });
    if (!inserted.ok) return inserted as Result<never, AppError>;
    return Ok(inserted.data);
  }

  /**
   * Map a movement to a balanced double-entry GL journal and post it through the ONE engine.
   *  cash_in:                       Dr Cash(5010)            / Cr Revenue(9010)
   *  expense / cash_out:            Dr Expense(9100)         / Cr Cash(5010)
   *  salary_payout:                 Dr Salary Payable(6710)  / Cr Cash(5010)
   *  advance:                       Dr Receivable(4000)      / Cr Cash(5010)
   * Returns the canonical `entries.id` (or an honest Err if a GL code is absent from the chart).
   */
  private async postGl(type: CashierMovementType, amount: number, reference: string): Promise<Result<number>> {
    const lines = ((): JournalLine[] => {
      switch (type) {
        case 'cash_in':
          return [
            { accountCode: GL.CASH, accountName: 'Kassa (Cash)', debit: amount, credit: 0 },
            { accountCode: GL.REVENUE, accountName: 'Tushum (Revenue)', debit: 0, credit: amount },
          ];
        case 'salary_payout':
          return [
            { accountCode: GL.SALARY_PAYABLE, accountName: 'Ish haqi (Salary Payable)', debit: amount, credit: 0 },
            { accountCode: GL.CASH, accountName: 'Kassa (Cash)', debit: 0, credit: amount },
          ];
        case 'advance':
          return [
            { accountCode: GL.ACCOUNTS_RECEIVABLE, accountName: 'Avans / Debitor (Receivable)', debit: amount, credit: 0 },
            { accountCode: GL.CASH, accountName: 'Kassa (Cash)', debit: 0, credit: amount },
          ];
        case 'cash_out':
        case 'expense':
        default:
          return [
            { accountCode: GL.MATERIAL_EXPENSE, accountName: 'Xarajat (Expense)', debit: amount, credit: 0 },
            { accountCode: GL.CASH, accountName: 'Kassa (Cash)', debit: 0, credit: amount },
          ];
      }
    })();
    // reference KAS-<ref> → entry_number prefix; GlPostingService is idempotent on this reference too.
    return this.gl.postJournal(lines, `KAS-${reference}`);
  }

  /**
   * Verify a 4-digit cashier PIN against users.pin_hash (bcrypt). owner #8.
   * Returns Ok(true) only when a stored hash exists and matches. When NO PIN store is configured
   * (column/value absent) returns Ok(false) so the caller GATES the movement — never forges a pass.
   */
  private async verifyPin(cashierUserId: number, pin: string): Promise<Result<boolean>> {
    const hashRes = await this.repo.findCashierPinHash(cashierUserId);
    if (!hashRes.ok) return hashRes as Result<never>;
    const pinHash = hashRes.data;
    if (!pinHash) {
      this.logger.warn(
        `[KAS-1] cashierUserId=${cashierUserId} uchun pin_hash yo'q — PIN-talab harakat GATED (rad etiladi, forge yo'q)`,
      );
      return Ok(false);
    }
    return safeCall(() => bcrypt.compare(pin, pinHash), 'INTERNAL') as Promise<Result<boolean>>;
  }
}

/** Local Zod helper → Result (keeps controllers thin; avoids try/catch on parse). */
function safeParse<T>(schema: z.ZodType<T>, raw: unknown): Result<T, AppError> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return Err(AppErr('VALIDATION', parsed.error.issues.map((i) => i.message).join('; ')));
  }
  return Ok(parsed.data);
}
