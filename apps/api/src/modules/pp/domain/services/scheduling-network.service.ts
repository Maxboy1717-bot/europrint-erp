/**
 * @module scheduling-network.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  Activity, CpmActivity, CpmResult,
  PertActivity, PertResult,
  makeSchedErr,
} from './scheduling.types';

@Injectable()
export class SchedulingNetworkService {
  /**
   * TZ-14: CPM — Critical Path Method
   * ES_j = max_{i∈pred(j)} EF_i, EF_j = ES_j + d_j
   * LF_i = min_{j∈succ(i)} LS_j, LS_i = LF_i - d_i
   * TF_i = LS_i - ES_i  (0 = kritik)
   */
  @Calculation('pp.scheduling.cpm')
  calculateCpm(activities: Activity[]): Result<CpmResult, AppError> {
    const safeActivities = Array.isArray(activities) ? activities : [];
    if (!safeActivities.length) {
      return Err(makeSchedErr('Faoliyatlar ro\'yxati bo\'sh'));
    }

    const actMap = new Map((Array.isArray(safeActivities) ? safeActivities : []).map((a) => [a.id, a]));

    for (const a of safeActivities) {
      for (const p of a.predecessors) {
        if (!actMap.has(p)) {
          return Err(makeSchedErr(`Faoliyat '${a.id}' noma'lum oldinchi '${p}' ga bog'liq`));
        }
      }
    }

    const inDegree = new Map<string, number>();
    const successors = new Map<string, string[]>();
    for (const a of safeActivities) {
      if (!inDegree.has(a.id)) inDegree.set(a.id, 0);
      for (const p of a.predecessors) {
        if (!successors.has(p)) successors.set(p, []);
        successors.get(p)?.push(a.id);
        inDegree.set(a.id, (inDegree.get(a.id) ?? 0) + 1);
      }
    }

    const queue = (Array.isArray(safeActivities) ? safeActivities : []).filter((a) => (inDegree.get(a.id) ?? 0) === 0).map((a) => a.id);
    const topoOrder: string[] = [];
    const tempDegree = new Map(inDegree);

    while (queue.length) {
      const id = queue.shift();
      if (!id) continue;
      topoOrder.push(id);
      for (const s of successors.get(id) ?? []) {
        const deg = (tempDegree.get(s) ?? 1) - 1;
        tempDegree.set(s, deg);
        if (deg === 0) queue.push(s);
      }
    }

    if (topoOrder.length < safeActivities.length) {
      return Err(makeSchedErr('Faoliyatlarda sikl aniqlandi'));
    }

    const es = new Map<string, number>();
    const ef = new Map<string, number>();

    for (const id of topoOrder) {
      const act = actMap.get(id);
      if (!act) continue;
      const safePreds = Array.isArray(act.predecessors) ? act.predecessors : [];
      const esVal = safePreds.length
        ? Math.max(...(Array.isArray(safePreds) ? safePreds : []).map((p) => ef.get(p) ?? 0))
        : 0;
      es.set(id, esVal);
      ef.set(id, esVal + safeNum(act.duration));
    }

    const projectDuration = Math.max(...(Array.isArray(safeActivities) ? safeActivities : []).map((a) => ef.get(a.id) ?? 0));

    const lf = new Map<string, number>();
    const ls = new Map<string, number>();

    for (const id of [...topoOrder].reverse()) {
      const act = actMap.get(id);
      if (!act) continue;
      const succs = successors.get(id) ?? [];
      const lfVal = succs.length
        ? Math.min(...(Array.isArray(succs) ? succs : []).map((s) => ls.get(s) ?? projectDuration))
        : projectDuration;
      lf.set(id, lfVal);
      ls.set(id, lfVal - safeNum(act.duration));
    }

    const cpmActivities: CpmActivity[] = (Array.isArray(safeActivities) ? safeActivities : []).map((a) => {
      const totalFloat = safeNum(ls.get(a.id)) - safeNum(es.get(a.id));
      return {
        id: a.id,
        duration: safeNum(a.duration),
        es: safeNum(es.get(a.id)),
        ef: safeNum(ef.get(a.id)),
        ls: safeNum(ls.get(a.id)),
        lf: safeNum(lf.get(a.id)),
        totalFloat,
        isCritical: Math.abs(totalFloat) < 1e-9,
      };
    });

    // CPM: criticalPath = barcha kritik aktivliklar (totalFloat ≈ 0), ES bo'yicha tartiblangan.
    const criticalPath = cpmActivities
      .filter((a) => a.isCritical)
      .sort((a, b) => a.es - b.es)
      .map((a) => a.id);

    return Ok({ activities: cpmActivities, criticalPath, projectDuration });
  }

  /**
   * TZ-14: PERT — uch nuqtali taxmin
   * d̄ = (o + 4m + p) / 6
   * σ² = ((p - o) / 6)²
   */
  @Calculation('pp.scheduling.pert')
  async calculatePert(activities: PertActivity[]): Promise<Result<PertResult, AppError>> {
    const safeActs = Array.isArray(activities) ? activities : [];
    if (!safeActs.length) {
      return Err(makeSchedErr('PERT faoliyatlar ro\'yxati bo\'sh'));
    }

    const converted: Activity[] = (Array.isArray(safeActs) ? safeActs : []).map((a) => ({
      id: a.id,
      duration: safeDiv(safeNum(a.optimistic) + 4 * safeNum(a.mostLikely) + safeNum(a.pessimistic), 6),
      predecessors: a.predecessors,
    }));

    const cpmResult = await this.calculateCpm(converted);
    if (!cpmResult.ok) return Err(cpmResult.error);

    const pertActivities = (Array.isArray(cpmResult?.data?.activities) ? cpmResult?.data?.activities : []).map((ca) => {
      const pa = (Array.isArray(safeActs) ? safeActs : []).find((a) => a.id === ca.id);
      const range = pa ? safeNum(pa.pessimistic) - safeNum(pa.optimistic) : 0;
      const variance = (safeDiv(range, 6)) ** 2;
      return { ...ca, expectedDuration: ca.duration, variance };
    });

    const criticalActivities = (Array.isArray(pertActivities) ? pertActivities : []).filter((a) => a.isCritical);
    const projectVariance = (Array.isArray(criticalActivities) ? criticalActivities : []).reduce((s, a) => s + a.variance, 0);

    return Ok({
      activities: pertActivities,
      criticalPath: cpmResult.data.criticalPath,
      projectDuration: cpmResult.data.projectDuration,
      projectVariance,
    });
  }
}
