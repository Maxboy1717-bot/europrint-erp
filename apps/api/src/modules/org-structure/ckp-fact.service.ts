/**
 * @module ckp-fact.service
 * @description ЦКП fakt biznes-logikasi (EP-ORG-014..018). Result<T>. achievement% formula-turiga qarab
 *   (Qoida 6 — controller emas). FABRIKATSIYA TAQIQ: norma (tskp_target) NULL -> 0 (egasi norma bersa hisoblanadi).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ok, Err, Result, AppErr } from '@common/result';
import { CkpFactRepository, CkpFactInput } from './ckp-fact.repository';
import { CkpReportedEvent } from './cascade/ckp-reported.event';
import { CKP_REPORTED_EVENT, CKP_ROLLUP_SOURCE } from './cascade/ckp-cascade.constants';

type Row = Record<string, unknown>;

/**
 * ЦКП formula-turi (achievement% hisoblash usuli). Manba — `org_departments.tskp_formula_type`
 * (per-karta, EGASI-DATA; eski `ckp_formula_type` fallback). 4 kanonik tur (calcAchievement):
 *   - 'quantity_pct' — bajarilgan/norma nisbati (MIQDOR%); norma yo'q -> 0 (FABRIKATSIYA YO'Q).
 *   - 'foiz'         — actual qiymatning O'ZI foiz (masalan sifat%/OEE%); norma kerak emas, 0..100 ga clamp.
 *   - 'vaqt'         — vaqt-norma (TESKARI): norma/actual (reja-vaqt ≤ haqiqiy-vaqt = 100%); actual yo'q -> 0.
 *   - 'boolean'      — ha/yo'q -> 100/0 (HOLAT).
 * Noma'lum tur -> 'quantity_pct' singari nisbat sifatida hisoblanadi (default tarmoq).
 */
export const CKP_FORMULA_BOOLEAN = 'boolean';
export const CKP_FORMULA_QUANTITY_PCT = 'quantity_pct';
export const CKP_FORMULA_FOIZ = 'foiz';
export const CKP_FORMULA_VAQT = 'vaqt';

/**
 * org_departments.ckp_formula_type NULL bo'lganda (egasi per-karta turni belgilamagan)
 * qo'llaniladigan ANIQ default formula-turi. Bu SOXTA qiymat EMAS — fakt baholash usuli;
 * norma (tskp_target) baribir NULL bo'lsa achievement 0 qaytaradi (FABRIKATSIYA YO'Q, Q-40).
 * Faqat shu konstanta orqali — service ichida magic-string takror yo'q (Qoida 12).
 */
export const CKP_DEFAULT_FORMULA_TYPE = CKP_FORMULA_QUANTITY_PCT;

export interface RecordFactInput {
  cardId: number;
  employeeId?: number | null;
  productId?: number | null;
  factDate: string;
  actualValue?: number | null;
  source?: string;
  /** Nuqson/xato sababi (error_catalog.code). Ixtiyoriy — past achievement sababini ЦКП-faktga bog'laydi. */
  errorCode?: string | null;
  notes?: string | null;
  recordedBy?: number | null;
}

/**
 * Deadline-belgisi (gate uchun). Kunlik ЦКП hisoboti `factDate` kuni tugagach
 * `deadlineHours` soat ichida topshirilishi shart (ya'ni ertangi kun 00:00 + N soat).
 * `deadlineHours` NULL -> deadline qoidasi yo'q (FABRIKATSIYA YO'Q): passed=false, at=null.
 */
export interface DeadlineFlag {
  /** Karta ckp_report_deadline_hours qiymati (NULL bo'lsa null — qoida yo'q). */
  deadlineHours: number | null;
  /** Hisoblangan deadline momenti (ISO). NULL-soat bo'lsa null. */
  deadlineAt: string | null;
  /** Topshirish (now) deadlinedan o'tdimi. Soat NULL -> false (gate yopilmaydi). */
  deadlinePassed: boolean;
}

@Injectable()
export class CkpFactService {
  private readonly logger = new Logger(CkpFactService.name);

  constructor(
    private readonly repo: CkpFactRepository,
    // Optional (Q-39 back-compat): single-arg unit tests keep constructing
    // CkpFactService(repo); at runtime Nest injects the global EventEmitter2
    // (app.module EventEmitterModule.forRoot()).
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  /**
   * Formula-turini normallashtirish: trim + bo'sh-string -> fallback (default null).
   * Magic-string takror yo'q (Qoida 12) — barcha darajalar (global/product/personal) shu orqali.
   */
  private pickFormula(raw: string | null | undefined, fallback: string | null = CKP_DEFAULT_FORMULA_TYPE): string | null {
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
    return fallback;
  }

  /** factDate ('YYYY-MM-DD') -> shaxsiy-norma davri 'YYYY-MM' (#14 period lookup). */
  private periodOf(factDate: string): string | null {
    if (typeof factDate !== 'string' || factDate.length < 7) return null;
    const m = /^(\d{4})-(\d{2})/.exec(factDate);
    return m ? `${m[1]}-${m[2]}` : null;
  }

  /**
   * Formula-turiga qarab achievement% (4-variant). FABRIKATSIYA YO'Q: norma/actual NULL ->
   * 0 (soxta % berilmaydi; egasi norma bersa hisoblanadi). Yaxlitlik 2 kasr.
   *   - boolean      : actual>0 -> 100, aks holda 0.
   *   - foiz         : actual O'ZI foiz (norma kerakmas), 0..100 clamp.
   *   - vaqt         : norma/actual (reja-vaqt ≤ haqiqiy = 100%); norma yoki actual yo'q -> 0.
   *   - quantity_pct : actual/norma (default tarmoq, noma'lum tur ham shu yerga tushadi).
   */
  private calcAchievement(formulaType: string | null, target: number | null, actual: number | null): number {
    const a = Number(actual ?? 0);
    const t = Number(target ?? 0);
    const round2 = (n: number): number => Math.round(n * 100) / 100;
    if (formulaType === CKP_FORMULA_BOOLEAN) return a > 0 ? 100 : 0;
    if (formulaType === CKP_FORMULA_FOIZ) {
      // actual o'zi foiz qiymati — norma talab qilinmaydi; 0..100 oralig'iga qisiladi.
      if (!Number.isFinite(a) || a <= 0) return 0;
      return round2(Math.min(a, 100));
    }
    if (formulaType === CKP_FORMULA_VAQT) {
      // vaqt-norma teskari: norma (reja-vaqt) / actual (haqiqiy-vaqt). actual<=0 -> 0 (fabrikatsiya yo'q).
      if (t <= 0 || a <= 0) return 0;
      return round2((t / a) * 100);
    }
    // quantity_pct (default): bajarilgan/norma. norma yo'q -> 0 (FABRIKATSIYA YO'Q).
    if (t <= 0) return 0;
    return round2((a / t) * 100);
  }

  /**
   * Deadline-belgisi (gate uchun, Egasi-qaror 6: deadline o'tib hisobot yo'q -> o'sha kun oyligi 0).
   * deadline = (factDate ertangi kun 00:00 UTC) + deadlineHours soat; submittedAt (NOW) shundan o'tdimi.
   * deadlineHours NULL/<=0 -> qoida yo'q (FABRIKATSIYA YO'Q): {hours:null, at:null, passed:false}.
   */
  private calcDeadline(deadlineHours: number | null, factDate: string, submittedAt: Date): DeadlineFlag {
    const h = deadlineHours == null ? null : Number(deadlineHours);
    if (h == null || !Number.isFinite(h) || h <= 0) {
      return { deadlineHours: null, deadlineAt: null, deadlinePassed: false };
    }
    const dayStart = new Date(`${factDate}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.getTime())) {
      return { deadlineHours: h, deadlineAt: null, deadlinePassed: false };
    }
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_PER_HOUR = 60 * 60 * 1000;
    const deadline = new Date(dayStart.getTime() + MS_PER_DAY + h * MS_PER_HOUR);
    return {
      deadlineHours: h,
      deadlineAt: deadline.toISOString(),
      deadlinePassed: submittedAt.getTime() > deadline.getTime(),
    };
  }

  async recordFact(input: RecordFactInput): Promise<Result<Row>> {
    const metaR = await this.repo.cardCkpMeta(input.cardId);
    if (!metaR.ok) return Err(metaR.error);
    if (!metaR.data) return Err(AppErr('NOT_FOUND', `Karta #${input.cardId} topilmadi`));
    const meta = metaR.data;
    // ─── NORMA + FORMULA HAL QILISH (ustun -> past): shaxsiy-norma (#14) ->
    //     karta-mahsulot (#10) -> karta-global. FABRIKATSIYA YO'Q: hech qaysi
    //     darajada norma yo'q bo'lsa target NULL qoladi (soxta norma yozilmaydi).
    const productId = input.productId ?? null;
    const period = this.periodOf(input.factDate); // 'YYYY-MM' (shaxsiy-norma davri)

    // Karta-global norma + formula (eng past daraja, default).
    let target = meta.tskp_target == null ? null : Number(meta.tskp_target);
    // GAP #12: formula-turi tskp_formula_type (yangi) -> ckp_formula_type (eski fallback) -> default.
    let resolvedFormula = this.pickFormula(
      (meta.tskp_formula_type as string | null) ?? (meta.ckp_formula_type as string | null),
    );

    // GAP #10: karta-mahsulot slot (productId bo'lsa) — global ustidan ustun.
    if (productId != null) {
      const cpR = await this.repo.cardProductTarget(input.cardId, productId);
      if (cpR.ok && cpR.data) {
        if (cpR.data['target_value'] != null) target = Number(cpR.data['target_value']);
        const cpFormula = this.pickFormula(cpR.data['formula_type'] as string | null, null);
        if (cpFormula != null) resolvedFormula = cpFormula;
      }
    }

    // GAP #14: shaxsiy norma override (employeeId bo'lsa) — eng ustun.
    if (input.employeeId != null) {
      const ptR = await this.repo.personalTarget(input.cardId, input.employeeId, productId, period);
      if (ptR.ok && ptR.data) {
        if (ptR.data['target_value'] != null) target = Number(ptR.data['target_value']);
        const ptFormula = this.pickFormula(ptR.data['formula_type'] as string | null, null);
        if (ptFormula != null) resolvedFormula = ptFormula;
      }
    }

    // NULL/bo'sh formula -> ANIQ default (magic-string emas, fabrikatsiya emas).
    const formulaType = resolvedFormula ?? CKP_DEFAULT_FORMULA_TYPE;
    const achievement = this.calcAchievement(formulaType, target, input.actualValue ?? null);
    const deadlineHours = meta.ckp_report_deadline_hours == null ? null : Number(meta.ckp_report_deadline_hours);
    const deadline = this.calcDeadline(deadlineHours, input.factDate, new Date());

    const fact: CkpFactInput = {
      cardId: input.cardId,
      employeeId: input.employeeId ?? null,
      productId: input.productId ?? null,
      factDate: input.factDate,
      targetValue: target,
      actualValue: input.actualValue ?? null,
      achievementPct: achievement,
      source: input.source ?? 'MANUAL',
      formulaType,
      // Gap #15: nuqson/xato sababi error_catalog.code'ga bog'lanadi (NULL = sabab yo'q).
      errorCode: input.errorCode ?? null,
      notes: input.notes ?? null,
      recordedBy: input.recordedBy ?? null,
    };
    const r = await this.repo.upsertFact(fact);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('INTERNAL', 'ЦКП fakt saqlanmadi'));

    // ⭐ T18-C2 VERTIKAL KASKAD: leaf-fakt commit bo'lgach CkpReportedEvent emit
    // qilinadi → CkpCascadeListener ota-zanjirni (parent→otdeleniye→CEO) qayta
    // agregatlaydi. ROLLUP-manbali yozuv uchun emit QILINMAYDI (rekursiya/double
    // cascade yo'q — ota agregatlari leaf-faktdan qayta hisoblanadi). Emit
    // best-effort: emit xatosi faktni bloklamaydi (fakt allaqachon saqlangan).
    if (fact.source !== CKP_ROLLUP_SOURCE) {
      this.emitReported(fact.cardId, input.factDate, achievement, fact.source);
    }

    // Deadline-belgisi (gate uchun) — saqlangan faktga qo'shib qaytariladi (DB-ustun emas, hisoblangan).
    return Ok({
      ...r.data,
      deadline_hours: deadline.deadlineHours,
      deadline_at: deadline.deadlineAt,
      deadline_passed: deadline.deadlinePassed,
    });
  }

  /**
   * CkpReportedEvent emit (best-effort). EventEmitter2 yo'q bo'lsa (unit-test
   * single-arg konstruktor) — sokin skip. Emit xatosi hech qachon faktni
   * bloklamaydi (fakt allaqachon saqlangan; kaskad ikkilamchi).
   */
  private emitReported(cardId: number, factDate: string, achievementPct: number | null, source: string): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(CKP_REPORTED_EVENT, new CkpReportedEvent(cardId, factDate, achievementPct, source));
    } catch (e: unknown) {
      this.logger.warn(`CkpReportedEvent emit xatolik (karta #${cardId}, ${factDate}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  listByCard(cardId: number, from: string | null, to: string | null): Promise<Result<Row[]>> {
    return this.repo.listByCard(cardId, from, to);
  }

  aggregate(cardId: number, date: string): Promise<Result<Row | null>> {
    return this.repo.aggregateByDate(cardId, date);
  }
}
