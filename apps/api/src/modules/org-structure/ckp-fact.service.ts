/**
 * @module ckp-fact.service
 * @description ЦКП fakt biznes-logikasi (EP-ORG-014..018). Result<T>. achievement% formula-turiga qarab
 *   (Qoida 6 — controller emas). FABRIKATSIYA TAQIQ: norma (tskp_target) NULL -> 0 (egasi norma bersa hisoblanadi).
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { CkpFactRepository, CkpFactInput } from './ckp-fact.repository';

type Row = Record<string, unknown>;

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

@Injectable()
export class CkpFactService {
  constructor(private readonly repo: CkpFactRepository) {}

  /** Formula-turiga qarab achievement% (boolean = ha/yo'q -> 100/0; quantity_pct = bajarilgan/norma). */
  private calcAchievement(formulaType: string | null, target: number | null, actual: number | null): number {
    const a = Number(actual ?? 0);
    const t = Number(target ?? 0);
    if (formulaType === 'boolean') return a > 0 ? 100 : 0;
    if (t <= 0) return 0; // norma yo'q -> 0 (FABRIKATSIYA YO'Q; egasi norma bersa hisoblanadi)
    return Math.round((a / t) * 10000) / 100;
  }

  async recordFact(input: RecordFactInput): Promise<Result<Row>> {
    const metaR = await this.repo.cardCkpMeta(input.cardId);
    if (!metaR.ok) return Err(metaR.error);
    if (!metaR.data) return Err(AppErr('NOT_FOUND', `Karta #${input.cardId} topilmadi`));
    const meta = metaR.data;
    const formulaType = (meta.ckp_formula_type as string | null) ?? 'quantity_pct';
    const target = meta.tskp_target == null ? null : Number(meta.tskp_target);
    const achievement = this.calcAchievement(formulaType, target, input.actualValue ?? null);

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
    return Ok(r.data);
  }

  listByCard(cardId: number, from: string | null, to: string | null): Promise<Result<Row[]>> {
    return this.repo.listByCard(cardId, from, to);
  }

  aggregate(cardId: number, date: string): Promise<Result<Row | null>> {
    return this.repo.aggregateByDate(cardId, date);
  }
}
