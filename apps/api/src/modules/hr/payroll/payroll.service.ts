import { Injectable, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IHrPayrollRepository, HR_PAYROLL_REPO } from './i-hr-payroll.repo';
import {
  PayrollClosureService,
  type PayrollRow as DomainPayrollRow,
  type PayrollPeriod as DomainPayrollPeriod,
} from './payroll-closure.service';
import { safeCall, Result, AppError, Ok, Err, AppErr } from '@common/result';
import { PayrollRecord } from '../domain/aggregates/payroll-record.aggregate';
import { GlPostingService, type JournalLine } from '../../finance/domain/services/gl-posting.service';
import { CkpGateService, type CkpGateDecision } from './ckp-gate';
import { LmsCardGateService } from '../../lms/application/services/lms-card-gate.service';
import { HR_REPO, type IHrRepo } from '../domain/repositories/i-hr.repo';
import type { DomainEvent } from '@shared/domain/domain-event';

type Row = Record<string, unknown>;

/**
 * Karta-markazli oylik FORMULA konstantalari (egasi 8-qaror #5):
 *   oylik = baza × razryad-koeff × ЦКП-bajarish% × stake-ulush
 *
 * NOTE (izolyatsiya, A7): bu konstantalar uzoq muddatda
 * `@common/constants/business.constants.ts` ga ko'chiriladi (PAYROLL_RAZRYAD_*
 * / PAYROLL_STAKE_* nomlari bilan). Hozir A7 faqat O'Z faylini o'zgartiradi
 * (fayl-izolyatsiya), shuning uchun lokal e'lon qilinadi; bosh agent keyin
 * markazlashtiradi. Qoida 12 (magic-number taqiq) shu yo'l bilan bajariladi.
 */

/** Razryad biriktirilmagan / coeff yo'q karta uchun neytral koeffitsient (1.0 = baza). */
const PAYROLL_RAZRYAD_COEFF_DEFAULT = 1.0;

/**
 * Stake-ulush (ko'p-karta oylik taqsimoti) neytral qiymati. Hozir `employee_cards`
 * da REAL stake ustuni YO'Q (faqat is_primary/is_active) — bu egasi-DATA, hali
 * materializatsiya qilinmagan (Q-40 fabrikatsiya-taqiq). Stake berilmaganida 1.0
 * = to'liq ulush (yagona faol karta) deb olinadi; SOXTA bo'linish yozilmaydi.
 */
const PAYROLL_STAKE_SHARE_DEFAULT = 1.0;

/** ЦКП-bajarish foizini (0..N %) ko'paytuvchi ulushga aylantiruvchi bo'luvchi. */
const PAYROLL_CKP_PCT_DIVISOR = 100;

/**
 * Ish-kunlari proratsiyasi neytral koeffitsienti (to'liq davr ishlangan = 1.0).
 *
 * ⭐ FABRIKATSIYA YO'Q (Q-40): davr ish-kuni soni noma'lum/≤0 bo'lsa proratsiya
 * QO'LLANMAYDI (1.0 = to'liq davr) — SOXTA "yarim oy" yozilmaydi. Ishlangan kun
 * (`workedDays`) noma'lum (null) bo'lsa ham 1.0 (to'liq davr deb olinadi; 0 deb
 * olish = ishchini "umuman kelmagan" deb FABRIKATSIYA qilish bo'lardi). Faqat
 * `workedDays` JONLI berilganida (≥0) ulush hisoblanadi va [0..1] ga qisiladi.
 */
const PAYROLL_PRORATION_FACTOR_DEFAULT = 1.0;

/**
 * Bitta faol karta uchun oylik FORMULA komponentlari (egasi 8-qaror #5):
 *   gross = baseSalary × razryadCoeff × (ckpAchievementPct / 100) × stakeShare
 *
 * ⭐ FABRIKATSIYA YO'Q (Q-40): real qiymat yo'q joyda SOXTA son yozilmaydi —
 *   - razryadCoeff NULL/≤0  → 1.0 (neytral; getRazryadCoefficient bilan bir xil graceful xulq)
 *   - stakeShare  NULL/≤0   → 1.0 (stake egasi-data, hali ustun yo'q)
 *   - ckpAchievementPct NULL → `ckpMissing: true` qaytadi, gross HISOBLANMAYDI
 *     (ЦКП-gate QATTIQ 0 — egasi 8-qaror #6 — alohida A11 oqimida qo'llanadi;
 *      bu yerda faqat "ma'lumot yo'q" signal beriladi, 100% ga TO'LDIRILMAYDI).
 */
export interface CardPayComponents {
  baseSalary: number;
  razryadCoeff: number;
  ckpFactor: number | null;   // (ckpAchievementPct / 100); ЦКП fakti yo'q bo'lsa null
  stakeShare: number;
  gross: number | null;       // ckpFactor null bo'lsa null (gate A11 hal qiladi)
  ckpMissing: boolean;
}

/**
 * Ish-kunlari proratsiyasi natijasi (egasi 8-qaror: oylik = baza × razryad-koeff ×
 * ЦКП% × stake-ulush — bu yerga ish-kunlari proratsiyasi qo'shiladi).
 *
 * Audit ustunlari `salary_history` jadvalida JONLI mavjud (prior-ish, additiv DDL):
 *   - proration_days       ← `prorationDays`     (ishlangan kun)
 *   - stake_total          ← `stakeShare`        (karta ulushi)
 *   - razryad_coefficient  ← `razryadCoeff`      (razryad koeffitsienti)
 *
 * `CardPayComponents` ni kengaytiradi (qo'shimcha — mavjud maydonlar buzilmaydi):
 *   prorated = gross × prorationFactor;  prorationFactor = workedDays / periodWorkingDays.
 */
export interface ProratedCardPay extends CardPayComponents {
  /** Davrdagi ish-kunlari (bo'luvchi); noma'lum/≤0 → proratsiya yo'q (factor 1.0). */
  periodWorkingDays: number | null;
  /** Ishlangan kun (`salary_history.proration_days` ga yoziladi); null → to'liq davr deb olinadi. */
  prorationDays: number | null;
  /** Ish-kunlari ulushi [0..1]; gross shu bilan ko'paytiriladi. */
  prorationFactor: number;
  /** Proratsiya qo'llangan yakuniy summa; gross null (ЦКП fakti yo'q) bo'lsa null. */
  proratedGross: number | null;
}

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @Inject(HR_PAYROLL_REPO) private readonly hrPayrollRepo: IHrPayrollRepository,
    private readonly closure: PayrollClosureService,
    private readonly gl: GlPostingService,
    private readonly ckpGate: CkpGateService,
    private readonly lmsGate: LmsCardGateService,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const { page = 1, limit = 10, userId, changeType, fromDate, toDate } = query;
      const offset = (Number(page) - 1) * Number(limit);
      const result = await this.hrPayrollRepo.findAll({
        limit: Number(limit),
        offset,
        userId:     userId     !== undefined ? Number(userId) : undefined,
        changeType: changeType !== undefined ? String(changeType) : undefined,
        fromDate:   fromDate   !== undefined ? String(fromDate)   : undefined,
        toDate:     toDate     !== undefined ? String(toDate)     : undefined,
      });
      if (!result.ok) throw new InternalServerErrorException(result.error);
      const { data, count: total } = result.data;
      return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
    });
  }

  async create(dto: Record<string, unknown>) {
    return safeCall(async () => {
      const result = await this.hrPayrollRepo.create(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  /**
   * Close a payroll period: aggregate rows, mark period closed, mark rows posted,
   * build & post the balanced GL journal entries, emit PAYROLL_CLOSED event.
   */
  async closePeriod(
    periodId: number,
  ): Promise<Result<{ period: Row; totals: { totalBase: number; totalBonus: number; totalDeductions: number; totalNet: number; rowCount: number }; gl: { inserted: number } }>> {
    const periodR = await this.hrPayrollRepo.findPeriodById(periodId);
    if (!periodR.ok) return periodR as unknown as Result<never>;
    if (!periodR.data) return Err(AppErr('NOT_FOUND', `Payroll davri #${periodId} topilmadi`));

    const period = this.normalizePeriod(periodR.data);
    const datesR = this.closure.validatePeriodDates(period);
    if (!datesR.ok) return datesR as unknown as Result<never>;

    const rowsR = await this.hrPayrollRepo.listRowsByPeriod(periodId);
    if (!rowsR.ok) return rowsR as unknown as Result<never>;
    const rows = (Array.isArray(rowsR.data) ? rowsR.data : []).map((r) => this.normalizeRow(r));

    const canClose = this.closure.canClose(period, rows);
    if (!canClose.ok) return canClose as unknown as Result<never>;
    const totals = canClose.data.totals;

    const journalR = this.closure.buildJournal(totals, period.periodName ?? `#${periodId}`);
    if (!journalR.ok) return journalR as unknown as Result<never>;

    // H3: post the GL journal FIRST (through the ONE engine — resolves codes → accounts.id, balanced
    // pair-rows into entries._id). Only mark the period closed AFTER the GL succeeds, so a GL failure
    // leaves the period OPEN (retryable). H1 idempotency on `PR-${periodId}` makes a retry safe (no
    // double-post). Replaces the old insertGlJournalLines text-path (same account both sides, NULL _id).
    const glLines: JournalLine[] = (Array.isArray(journalR.data) ? journalR.data : []).map((l) => ({
      accountCode: l.account, accountName: l.memo, debit: l.debit, credit: l.credit,
    }));
    const glR = await this.gl.postJournal(glLines, `PR-${periodId}`);
    if (!glR.ok) return glR as unknown as Result<never>;

    const closedR = await this.hrPayrollRepo.markPeriodClosed(periodId, totals);
    if (!closedR.ok) return closedR as unknown as Result<never>;

    const postedR = await this.hrPayrollRepo.markRowsPosted(periodId);
    if (!postedR.ok) {
      this.logger.warn(`markRowsPosted xatolik: ${postedR.error.message}`);
    }

    // Per-employee domain events: hydrate a PayrollRecord aggregate for each
    // row, transition it to `posted`, drain events and forward through the
    // event bus. Additive — the legacy period-level emit below stays.
    const recordEvents = this.emitPayrollRecordCompletions(periodId, rows);

    // fire-and-forget: no listener by design (owner decision 2026-06-06)
    this.eventEmitter.emit('payroll.period.closed', {
      periodId,
      totals,
      glLines: journalR.data,
      recordEventCount: recordEvents,
    });

    return Ok({
      period: closedR.data as Row,
      totals,
      gl: { inserted: glLines.length },
    });
  }

  // ─── helpers ────────────────────────────────────────────────────────────
  private normalizePeriod(raw: Row): DomainPayrollPeriod {
    return {
      id:               Number(raw['id'] ?? 0),
      status:           String(raw['status'] ?? 'open'),
      periodStartDate:  this.toIsoDateString(raw['periodStartDate'] ?? raw['period_start_date']),
      periodEndDate:    this.toIsoDateString(raw['periodEndDate']   ?? raw['period_end_date']),
      periodName:       (raw['periodName'] ?? raw['period_name']) as string | undefined,
    };
  }

  private normalizeRow(raw: Row): DomainPayrollRow {
    return {
      id:          Number(raw['id'] ?? 0),
      employeeId:  (raw['employeeId'] ?? raw['employee_id']) as string | number,
      baseSalary:  Number(raw['baseSalary']  ?? raw['base_salary']  ?? 0),
      bonus:       Number(raw['bonus']       ?? 0),
      deductions:  Number(raw['deductions']  ?? 0),
      netPay:      Number(raw['netPay']      ?? raw['net_pay']      ?? 0),
      status:      String(raw['status']      ?? 'draft'),
    };
  }

  private toIsoDateString(v: unknown): string | undefined {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString().split('T')[0];
    return String(v);
  }

  /**
   * Karta-markazli oylik FORMULA (egasi 8-qaror #5):
   *   gross = baseSalary × razryadCoeff × (ckpAchievementPct / 100) × stakeShare
   *
   * Sof (DB'siz) funksiya — komponentlar chaqiruvchi tomonidan kanonik manbalardan
   * o'qiladi (razryadCoeff = razryad_levels.coefficient; ckpAchievementPct =
   * ckp_fact_values.achievement_pct; stakeShare = ko'p-karta ulushi). Bu yerda
   * faqat FORMULA va NULL/fabrikatsiya-darvozalar bor.
   *
   * @param baseSalary         baza oylik (so'm) — manfiy bo'lsa 0 ga qisiladi
   * @param razryadCoeff       razryad koeffitsienti; null/≤0 → 1.0 (neytral)
   * @param ckpAchievementPct  ЦКП-bajarish foizi (0..N %); **null = fakt yo'q** → gross null
   * @param stakeShare         karta ulushi (0..1); null/≤0 → 1.0 (yagona faol karta)
   */
  computeCardPay(
    baseSalary: number,
    razryadCoeff: number | null,
    ckpAchievementPct: number | null,
    stakeShare: number | null,
  ): CardPayComponents {
    const base = Number.isFinite(baseSalary) && baseSalary > 0 ? baseSalary : 0;

    const coeff =
      typeof razryadCoeff === 'number' && Number.isFinite(razryadCoeff) && razryadCoeff > 0
        ? razryadCoeff
        : PAYROLL_RAZRYAD_COEFF_DEFAULT;

    const stake =
      typeof stakeShare === 'number' && Number.isFinite(stakeShare) && stakeShare > 0
        ? stakeShare
        : PAYROLL_STAKE_SHARE_DEFAULT;

    // ЦКП fakti yo'q (null) → fabrikatsiya YO'Q: gross hisoblanmaydi, gate (A11) hal qiladi.
    const ckpMissing =
      ckpAchievementPct === null ||
      ckpAchievementPct === undefined ||
      !Number.isFinite(ckpAchievementPct);

    const ckpFactor = ckpMissing
      ? null
      : Math.max(0, ckpAchievementPct as number) / PAYROLL_CKP_PCT_DIVISOR;

    const gross = ckpFactor === null ? null : base * coeff * ckpFactor * stake;

    return { baseSalary: base, razryadCoeff: coeff, ckpFactor, stakeShare: stake, gross, ckpMissing };
  }

  /**
   * Ish-kunlari proratsiyasi koeffitsienti (sof, DB'siz) — [0..1] ga qisilgan.
   *
   * ⭐ FABRIKATSIYA YO'Q (Q-40):
   *   - `periodWorkingDays` null/≤0/noto'g'ri  → 1.0 (proratsiya yo'q; bo'luvchi noma'lum)
   *   - `workedDays`        null               → 1.0 (to'liq davr; "kelmagan" deb yozish FABRIKATSIYA bo'lardi)
   *   - `workedDays`        ≥0                 → workedDays / periodWorkingDays, [0..1] ga qisiladi
   *
   * @param workedDays         ishlangan kun (JONLI; null = to'liq davr)
   * @param periodWorkingDays  davr ish-kuni soni (bo'luvchi; null/≤0 = proratsiya yo'q)
   */
  computeProrationFactor(workedDays: number | null, periodWorkingDays: number | null): number {
    if (
      typeof periodWorkingDays !== 'number' ||
      !Number.isFinite(periodWorkingDays) ||
      periodWorkingDays <= 0
    ) {
      return PAYROLL_PRORATION_FACTOR_DEFAULT;
    }
    if (workedDays === null || workedDays === undefined || !Number.isFinite(workedDays)) {
      return PAYROLL_PRORATION_FACTOR_DEFAULT;
    }
    const worked = Math.max(0, workedDays);
    const factor = worked / periodWorkingDays;
    // [0..1] — ortiqcha kun (overtime) proratsiyada to'liq davrdan oshmaydi (overtime alohida modul).
    return Math.min(1, Math.max(0, factor));
  }

  /**
   * To'liq karta oyligi — stake-ulush + ish-kunlari proratsiyasi (egasi 8-qaror #5 kengaytmasi).
   *
   *   prorated = (baseSalary × razryadCoeff × ЦКП% × stakeShare) × (workedDays / periodWorkingDays)
   *
   * `computeCardPay` ustiga ADDITIV qatlam — stake-ulush u yerda allaqachon hisoblanadi (gross),
   * bu yerda faqat ish-kunlari proratsiyasi qo'shiladi va `salary_history` audit ustunlari
   * (proration_days / stake_total / razryad_coefficient) uchun maydonlar qaytariladi.
   *
   * ЦКП fakti yo'q (gross null) → proratedGross ham null (ЦКП-gate A11 hal qiladi; FABRIKATSIYA yo'q).
   *
   * @param baseSalary         baza oylik (so'm)
   * @param razryadCoeff       razryad koeffitsienti; null/≤0 → 1.0
   * @param ckpAchievementPct  ЦКП-bajarish foizi; null = fakt yo'q → proratedGross null
   * @param stakeShare         karta ulushi (0..1); null/≤0 → 1.0
   * @param workedDays         davrda ishlangan kun (`salary_history.proration_days`); null → to'liq davr
   * @param periodWorkingDays  davr ish-kuni soni (bo'luvchi); null/≤0 → proratsiya yo'q
   */
  prorateCardPay(
    baseSalary: number,
    razryadCoeff: number | null,
    ckpAchievementPct: number | null,
    stakeShare: number | null,
    workedDays: number | null,
    periodWorkingDays: number | null,
  ): ProratedCardPay {
    const components = this.computeCardPay(baseSalary, razryadCoeff, ckpAchievementPct, stakeShare);
    const prorationFactor = this.computeProrationFactor(workedDays, periodWorkingDays);
    const proratedGross = components.gross === null ? null : components.gross * prorationFactor;
    return {
      ...components,
      periodWorkingDays:
        typeof periodWorkingDays === 'number' && Number.isFinite(periodWorkingDays)
          ? periodWorkingDays
          : null,
      prorationDays:
        workedDays === null || workedDays === undefined || !Number.isFinite(workedDays)
          ? null
          : Math.max(0, workedDays),
      prorationFactor,
      proratedGross,
    };
  }

  /**
   * ⭐ A69 — OYLIK ↔ ЦКП-GATE TO'LIQ ULASH (egasi 8-qaror #6: ЦКП-gate QATTIQ 0).
   *
   * Bu metod A7 oylik-FORMULA (`prorateCardPay`) bilan A11 ЦКП-DARVOZA
   * (`CkpGateService.evaluatePeriod`) ni HAQIQATDA bog'laydi — ya'ni oylik
   * hisoblanганда darvoza CHAQIRILADI. Avval bu ikkisi alohida edi (gate hech
   * qayerdan chaqirilmasdi); endi oylik kun-bazasi darvozadan o'tadi:
   *
   *   1. To'liq davr oyligi (proratedGross) `prorateCardPay` bilan hisoblanadi
   *      (baza × razryad × ЦКП% × stake × ish-kun-proratsiyasi).
   *   2. Davrning HAR kuni uchun `CkpGateService.evaluatePeriod` jonli
   *      `ckp_fact_values` ni o'qib darvoza qarorini beradi (fakt yo'q yoki
   *      deadline o'tgan kun → factor 0; aks holda 1).
   *   3. Kun-bazasi = proratedGross / davr-kun-soni; har kun darvoza-factori
   *      bilan ko'paytiriladi va yig'iladi → DARVOZALANGAN oylik.
   *
   * Natija: ЦКП fakti BOR kunlar to'lanadi, fakt YO'Q / deadline o'tgan kunlar 0.
   * ckp fakti umuman yo'q karta (TEST hozir) → hamma kun 0 → oylik 0 (egasi #6).
   *
   * ⭐ T7-10 — LMS-DARVOZA (EP-ORG-027 / EP-LMS-070): ЦКП-darvozadan OLDIN
   *   `LmsCardGateService.isCardTrainingComplete` chaqiriladi. Vizyon (egasi):
   *   "Karta darsligi tugamaguncha o'sha karta oyligi to'xtaydi." Kartaga
   *   biriktirilgan MAJBURIY darslik to'liq tugamagan bo'lsa → o'sha kartaning
   *   butun oyligi 0 (kun-darvozaga o'tmasdan, butun davr bloklanadi). LMS-darvoza
   *   FAIL-CLOSED: o'qish xatosi ham bloklaydi (o'qib bo'lmagan = ochilmaydi).
   *   Majburiy darslik biriktirilmagan karta (courses.card_id=NULL, hozir 0/5) →
   *   `allComplete=true` → bloklamaydi (HALOL ochiq, FABRIKATSIYA emas — Q-40).
   *   employeeId berilmasa (≤0) → LMS-darvoza O'TKAZIB yuboriladi (eski A69 xulqi
   *   saqlanadi; karta-darslik xodimga bog'liq, xodimsiz baholab bo'lmaydi).
   *
   * FABRIKATSIYA YO'Q (Q-40): darvoza faqat jonli `ckp_fact_values` /
   * `courses`/`enrollments`/`course_progress` o'qiydi; fakt/progress yo'q →
   * HALOL 0 (soxta to'lov yozilmaydi). proratedGross null (ЦКП% berilmagan) →
   * gated null (gate baribir 0 bergan bo'lardi).
   *
   * @param cardId             birlamchi karta id (`org_departments.id`)
   * @param from               davr boshi (ISO 'YYYY-MM-DD')
   * @param to                 davr oxiri (ISO 'YYYY-MM-DD', inklyuziv)
   * @param baseSalary         baza oylik (so'm)
   * @param razryadCoeff       razryad koeffitsienti; null/≤0 → 1.0
   * @param ckpAchievementPct  ЦКП-bajarish foizi (davr o'rtacha/yakuni); null → gated 0
   * @param stakeShare         karta ulushi (0..1); null/≤0 → 1.0
   * @param workedDays         davrda ishlangan kun (proratsiya); null → to'liq davr
   * @param periodWorkingDays  davr ish-kuni soni (proratsiya bo'luvchisi); null/≤0 → yo'q
   * @param employeeId         kartani egallagan xodim (`employees.id`); ≤0/undefined → LMS-darvoza skip
   */
  async computeGatedMonthlySalary(
    cardId: number,
    from: string,
    to: string,
    baseSalary: number,
    razryadCoeff: number | null,
    ckpAchievementPct: number | null,
    stakeShare: number | null,
    workedDays: number | null,
    periodWorkingDays: number | null,
    employeeId?: number,
  ): Promise<
    Result<{
      proratedGross: number | null;
      gatedGross: number | null;
      gatedDays: number;
      blockedDays: number;
      totalDays: number;
      lmsBlocked: boolean;
      lmsReasons: string[];
      days: Array<{ factDate: string; decision: CkpGateDecision; dayBase: number; dayPaid: number }>;
    }>
  > {
    const prorated = this.prorateCardPay(
      baseSalary,
      razryadCoeff,
      ckpAchievementPct,
      stakeShare,
      workedDays,
      periodWorkingDays,
    );

    // ⭐ T7-10 LMS-DARVOZA — ЦКП-darvozadan OLDIN: kartaga biriktirilgan majburiy
    // darslik tugamagan bo'lsa, o'sha karta oyligi to'liq bloklanadi (egasi vizyoni).
    // FAIL-CLOSED: isCardTrainingComplete xato bersa ham bloklanadi (ochilmaydi).
    // employeeId berilmagan/≤0 → skip (xodimsiz karta-darslikni baholab bo'lmaydi).
    let lmsBlocked = false;
    let lmsReasons: string[] = [];
    if (typeof employeeId === 'number' && Number.isInteger(employeeId) && employeeId > 0) {
      const lmsR = await this.lmsGate.isCardTrainingComplete(cardId, employeeId);
      if (!lmsR.ok) {
        // O'qish xatosi = fail-closed: darslik holatini bilolmasak, oylik ochilmaydi.
        lmsBlocked = true;
        lmsReasons = [`LMS-darvoza o'qib bo'lmadi (fail-closed): ${lmsR.error.message}`];
      } else if (!lmsR.data.allComplete) {
        lmsBlocked = true;
        lmsReasons = lmsR.data.reasons.length > 0
          ? lmsR.data.reasons
          : [`Karta #${cardId}: majburiy darslik tugamagan (oylik to'xtatildi)`];
      }
    }

    // A11 DARVOZA CHAQIRUVI — jonli ckp_fact_values; har kun qarori.
    const gateR = await this.ckpGate.evaluatePeriod(cardId, from, to);
    if (!gateR.ok) return Err(gateR.error);
    const decisions = gateR.data;
    const totalDays = decisions.length;

    // LMS-darvoza yopiq → butun karta oyligi 0 (darslik tugamasa oylik yo'q — egasi).
    // proratedGross null (ЦКП% yo'q) → darvoza baribir 0 berardi; gated ham null.
    if (lmsBlocked || prorated.proratedGross === null || totalDays === 0) {
      return Ok({
        proratedGross: prorated.proratedGross,
        gatedGross: prorated.proratedGross === null ? null : 0,
        gatedDays: 0,
        blockedDays: totalDays,
        totalDays,
        lmsBlocked,
        lmsReasons,
        days: decisions.map((d) => ({ factDate: d.factDate, decision: d.decision, dayBase: 0, dayPaid: 0 })),
      });
    }

    // Kun-bazasi = oylik / davr-kun-soni; har kun darvoza-factori (0/1) bilan o'tadi.
    const dayBase = prorated.proratedGross / totalDays;
    let gatedGross = 0;
    let gatedDays = 0;
    let blockedDays = 0;
    const days = decisions.map(({ factDate, decision }) => {
      const dayPaid = dayBase * decision.factor;
      gatedGross += dayPaid;
      if (decision.factor === 1) gatedDays++;
      else blockedDays++;
      return { factDate, decision, dayBase, dayPaid };
    });

    return Ok({
      proratedGross: prorated.proratedGross,
      gatedGross,
      gatedDays,
      blockedDays,
      totalDays,
      lmsBlocked,
      lmsReasons,
      days,
    });
  }

  /**
   * ⭐ T7-09 — KARTA-OYLIK FORMULASI JONLI ULANISHI (egasi 8-qaror #5).
   *
   * VERIFY topgan bo'shliq: A7 formula metodlari (`computeCardPay` →
   * `prorateCardPay` → `computeGatedMonthlySalary`) TO'LIQ qurilgan-u, lekin
   * hech qaysi endpoint/servisdan CHAQIRILMASdi (orphan). Jonli `calculatePayroll`
   * yo'li faqat razryad-koeffni qo'llaydi (ЦКП-gate + stake yo'q), `closePeriod`
   * esa xom `base_salary` ni yig'adi. Bu metod orphan formulani JONLI manbalarga
   * ulaydi — endi karta-oylik HAQIQATDA hisoblanadi (egasi formulasi to'liq).
   *
   * Razryad-koeff JONLI kanonik kartadan keladi (A8/MASSIV-100): employee →
   * employee_org_departments(aktiv,birlamchi) → org_departments.razryad_level_id →
   * razryad_levels.coefficient (`hrRepo.getRazryadCoefficient`). Chaqiruvchi
   * `razryadCoeff` bersa, u ustun (override); aks holda jonli koeff o'qiladi.
   *
   * Qolgan komponentlar `computeGatedMonthlySalary` ga o'tadi: ЦКП-gate jonli
   * `ckp_fact_values` (A11), LMS-gate jonli darslik (T7-10), stake (egasi-data →
   * default 1.0), ish-kun proratsiyasi. FABRIKATSIYA YO'Q (Q-40): qiymat yo'q
   * joyda neytral/gate-0 — soxta son yozilmaydi.
   *
   * @param cardId             birlamchi karta id (`org_departments.id`)
   * @param employeeId         kartani egallagan xodim (`employees.id`) — razryad+LMS jonli o'qish uchun
   * @param from               davr boshi (ISO 'YYYY-MM-DD')
   * @param to                 davr oxiri (ISO 'YYYY-MM-DD', inklyuziv)
   * @param baseSalary         baza oylik (so'm)
   * @param ckpAchievementPct  ЦКП-bajarish foizi; null = fakt yo'q → gated 0
   * @param stakeShare         karta ulushi (0..1); null/≤0 → 1.0 (egasi-data)
   * @param workedDays         davrda ishlangan kun (proratsiya); null → to'liq davr
   * @param periodWorkingDays  davr ish-kuni soni (proratsiya bo'luvchisi); null/≤0 → yo'q
   * @param razryadCoeffOverride chaqiruvchi bergan koeff (test/maxsus holat); berilmasa jonli o'qiladi
   */
  async previewCardSalary(
    cardId: number,
    employeeId: number,
    from: string,
    to: string,
    baseSalary: number,
    ckpAchievementPct: number | null,
    stakeShare: number | null,
    workedDays: number | null,
    periodWorkingDays: number | null,
    razryadCoeffOverride?: number | null,
  ): Promise<
    Result<{
      cardId: number;
      employeeId: number;
      from: string;
      to: string;
      baseSalary: number;
      razryadCoeff: number;
      razryadSource: 'override' | 'live-card';
      proratedGross: number | null;
      gatedGross: number | null;
      gatedDays: number;
      blockedDays: number;
      totalDays: number;
      lmsBlocked: boolean;
      lmsReasons: string[];
      days: Array<{ factDate: string; decision: CkpGateDecision; dayBase: number; dayPaid: number }>;
    }>
  > {
    // Razryad-koeff: chaqiruvchi override bersa o'sha; aks holda JONLI kanonik karta-zanjiridan.
    let razryadCoeff: number;
    let razryadSource: 'override' | 'live-card';
    if (
      typeof razryadCoeffOverride === 'number' &&
      Number.isFinite(razryadCoeffOverride) &&
      razryadCoeffOverride > 0
    ) {
      razryadCoeff = razryadCoeffOverride;
      razryadSource = 'override';
    } else {
      // getRazryadCoefficient graceful: data yo'q → 1.0 (fabrikatsiya yo'q).
      razryadCoeff = await this.hrRepo.getRazryadCoefficient(employeeId);
      razryadSource = 'live-card';
    }

    const gatedR = await this.computeGatedMonthlySalary(
      cardId,
      from,
      to,
      baseSalary,
      razryadCoeff,
      ckpAchievementPct,
      stakeShare,
      workedDays,
      periodWorkingDays,
      employeeId,
    );
    if (!gatedR.ok) return Err(gatedR.error);

    return Ok({
      cardId,
      employeeId,
      from,
      to,
      baseSalary,
      razryadCoeff,
      razryadSource,
      ...gatedR.data,
    });
  }

  /**
   * Hydrate one PayrollRecord aggregate per closure row, call completeRun(),
   * and forward the resulting domain events through EventEmitter2. Returns
   * the count of events emitted. Failures are logged and skipped — payroll
   * closure must not be blocked by a downstream listener.
   */
  private emitPayrollRecordCompletions(periodId: number, rows: DomainPayrollRow[]): number {
    let emitted = 0;
    const now = new Date();
    for (const row of rows) {
      const employeeId = Number(row.employeeId);
      if (!Number.isFinite(employeeId)) {
        this.logger.warn(`Payroll row id=${row.id} da noto'g'ri employeeId — domain event skip`);
        continue;
      }
      // Row pre-`markRowsPosted` state — `canClose` already filtered out
      // 'draft' rows, so anything not in our state enum is normalized to
      // 'approved' (pending posting). The aggregate's completeRun then
      // performs the draft|approved → posted transition + emits the event.
      const status: 'draft' | 'approved' | 'posted' =
        row.status === 'posted' ? 'posted'
        : row.status === 'draft' ? 'draft'
        : 'approved';
      const recordR = PayrollRecord.fromProps({
        id:           row.id,
        employeeId,
        periodId,
        gross:        row.baseSalary + row.bonus,
        other:        row.deductions,
        status,
        createdAt:    now,
        updatedAt:    now,
      });
      if (!recordR.ok) {
        this.logger.warn(`PayrollRecord hydrate xato (row ${row.id}): ${recordR.error.message}`);
        continue;
      }
      const completeR = recordR.data.completeRun();
      if (!completeR.ok) {
        this.logger.warn(`completeRun xato (row ${row.id}): ${completeR.error.message}`);
        continue;
      }
      for (const ev of recordR.data.getDomainEvents()) {
        this.eventEmitter.emit(this.eventNameFor(ev), ev);
        emitted++;
      }
      recordR.data.clearDomainEvents();
    }
    return emitted;
  }

  /** Map a domain event to its EventEmitter2 channel name (lowercased). */
  private eventNameFor(ev: DomainEvent): string {
    return `payroll.record.${ev.eventName.toLowerCase()}`;
  }
}
