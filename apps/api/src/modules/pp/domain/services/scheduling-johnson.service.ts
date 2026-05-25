/**
 * @module scheduling-johnson.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { Job, JohnsonResult, makeSchedErr } from './scheduling.types';

@Injectable()
export class SchedulingJohnsonService {
  /**
   * TZ-13: Johnson Qoidasi — 2-mashina scheduling
   * Murakkablik: O(n log n)
   *
   * min(t1j, t2j) → mashina-1 da → boshga qo'y (front)
   * min(t1j, t2j) → mashina-2 da → oxiriga qo'y (back)
   */
  @Calculation('pp.scheduling.johnson')
  johnsonRule(jobs: readonly Job[]): Result<JohnsonResult, AppError> {
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    if (!safeJobs.length) {
      return Ok({ order: [], makespan: 0, machine1Timeline: [], machine2Timeline: [] });
    }
    for (const j of safeJobs) {
      if (safeNum(j.t1) < 0 || safeNum(j.t2) < 0) {
        return Err(makeSchedErr(`Ish '${j.id}': t1 va t2 manfiy bo'lmasin`));
      }
    }

    const sorted = [...safeJobs].sort((a, b) => {
      const minA = Math.min(safeNum(a.t1), safeNum(a.t2));
      const minB = Math.min(safeNum(b.t1), safeNum(b.t2));
      return minA - minB;
    });

    const front: string[] = [];
    const back: string[] = [];

    for (const job of sorted) {
      if (safeNum(job.t1) <= safeNum(job.t2)) {
        front.push(job.id);
      } else {
        back.unshift(job.id);
      }
    }

    const order = [...front, ...back];

    const m1Timeline: { jobId: string; start: number; end: number }[] = [];
    const m2Timeline: { jobId: string; start: number; end: number }[] = [];

    let m1End = 0;
    let m2End = 0;

    for (const id of order) {
      const job = (Array.isArray(safeJobs) ? safeJobs : []).find((j) => j.id === id);
      if (!job) continue;
      const m1Start = m1End;
      m1End = m1Start + safeNum(job.t1);
      const m2Start = Math.max(m2End, m1End);
      m2End = m2Start + safeNum(job.t2);
      m1Timeline.push({ jobId: id, start: m1Start, end: m1End });
      m2Timeline.push({ jobId: id, start: m2Start, end: m2End });
    }

    return Ok({ order, makespan: m2End, machine1Timeline: m1Timeline, machine2Timeline: m2Timeline });
  }
}
