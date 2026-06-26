/**
 * @module ckp-fact.service
 * @description ЦКП fakt biznes-logikasi (EP-ORG-014..018). Result<T>. achievement% formula-turiga qarab
 *   (Qoida 6 — controller emas). FABRIKATSIYA TAQIQ: norma (tskp_target) NULL -> 0 (egasi norma bersa hisoblanadi).
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { CkpFactRepository, CkpFactInput } from './ckp-fact.repository';

type Row = Record<string, unknown>;

/**
 * ЦКП formula-turi (achievement% hisoblash usuli). Manba — `org_departments.ckp_formula_type`
 * (per-karta, EGASI-DATA). Ushbu ro'yxat `calcAchievement` ajratadigan kanonik turlar:
 *   - 'boolean'      — ha/yo'q -> 100/0 (HOLAT).
 *   - 'quantity_pct' — bajarilgan/norma nisbati (MIQDOR%); norma yo'q -> 0 (FABRIKATSIYA YO'Q).
 * Boshqa har qanday tur 'quantity_pct' singari nisbat sifatida hisoblanadi (default tarmoq).
 */
export const CKP_FORMULA_BOOLEAN = 'boolean';
export const CKP_FORMULA_QUANTITY_PCT = 'quantity_pct';

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
  constructor(private readonly repo: CkpFactRepository) {}

  /** Formula-turiga qarab achievement% (boolean = ha/yo'q -> 100/0; quantity_pct = bajarilgan/norma). */
  private calcAchievement(formulaType: string | null, target: number | null, actual: number | null): number {
    const a = Number(actual ?? 0);
    const t = Number(target ?? 0);
    if (formulaType === CKP_FORMULA_BOOLEAN) return a > 0 ? 100 : 0;
    if (t <= 0) return 0; // norma yo'q -> 0 (FABRIKATSIYA YO'Q; egasi norma bersa hisoblanadi)
    return Math.round((a / t) * 10000) / 100;
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
    // Formula-turi org_departments.ckp_formula_type'dan o'qiladi (per-karta, EGASI-DATA).
    // NULL/bo'sh -> ANIQ default (CKP_DEFAULT_FORMULA_TYPE) — magic-string emas, fabrikatsiya emas.
    const rawFormulaType = meta.ckp_formula_type as string | null;
    const formulaType =
      typeof rawFormulaType === 'string' && rawFormulaType.trim().length > 0
        ? rawFormulaType.trim()
        : CKP_DEFAULT_FORMULA_TYPE;
    const target = meta.tskp_target == null ? null : Number(meta.tskp_target);
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
      notes: input.notes ?? null,
      recordedBy: input.recordedBy ?? null,
    };
    const r = await this.repo.upsertFact(fact);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('INTERNAL', 'ЦКП fakt saqlanmadi'));
    // Deadline-belgisi (gate uchun) — saqlangan faktga qo'shib qaytariladi (DB-ustun emas, hisoblangan).
    return Ok({
      ...r.data,
      deadline_hours: deadline.deadlineHours,
      deadline_at: deadline.deadlineAt,
      deadline_passed: deadline.deadlinePassed,
    });
  }

  listByCard(cardId: number, from: string | null, to: string | null): Promise<Result<Row[]>> {
    return this.repo.listByCard(cardId, from, to);
  }

  aggregate(cardId: number, date: string): Promise<Result<Row | null>> {
    return this.repo.aggregateByDate(cardId, date);
  }
}
