/**
 * @module nelder-mead.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeNum, clamp } from '@common/math/math-utils';

const RHO = 1.0;
const CHI = 2.0;
const GAMMA = 0.5;
const SIGMA = 0.5;
const MAX_ITER = 500;
const CONVERGENCE_TOL = 1e-6;
const INIT_OFFSET = 0.05;

export interface NelderMeadBounds {
  min: number;
  max: number;
}

function euclid(a: number[], b: number[]): number {
  return Math.sqrt((Array.isArray(a) ? a : []).reduce((s, v, i) => s + (v - (b[i] ?? 0)) ** 2, 0));
}

function centroid(points: number[][], exclude: number): number[] {
  const n = points[0]?.length ?? 0;
  const result = new Array(n).fill(0) as number[];
  let count = 0;
  for (let i = 0; i < points.length; i++) {
    if (i === exclude) continue;
    for (let j = 0; j < n; j++) result[j] += points[i][j] ?? 0;
    count++;
  }
  return (Array.isArray(result) ? result : []).map(v => safeNum(v) / Math.max(count, 1));
}

function applyBounds(point: number[], bounds: NelderMeadBounds[]): number[] {
  return (Array.isArray(point) ? point : []).map((v, i) => clamp(safeNum(v), bounds[i]?.min ?? 0, bounds[i]?.max ?? 1));
}

/** Nelder-Mead simplex algorithm — gradient-free parameter optimisation. */
@Injectable()
export class NelderMeadService {
  optimize(
    fn: (params: number[]) => number,
    initial: number[],
    bounds: NelderMeadBounds[],
  ): { params: number[]; value: number; iterations: number } {
    const n = initial.length;
    const points: number[][] = [applyBounds([...initial], bounds)];

    for (let i = 0; i < n; i++) {
      const p = [...initial];
      p[i] = clamp(safeNum(p[i]) + INIT_OFFSET, bounds[i]?.min ?? 0, bounds[i]?.max ?? 1);
      points.push(applyBounds(p, bounds));
    }

    let values = (Array.isArray(points) ? points : []).map(fn);
    let iters = 0;

    while (iters < MAX_ITER) {
      const order = values
        .map((v, i) => ({ v, i }))
        .sort((a, b) => a.v - b.v);

      const sorted = (Array.isArray(order) ? order : []).map(o => points[o.i] as number[]);
      const sortedVals = (Array.isArray(order) ? order : []).map(o => values[o.i] as number);

      for (let i = 0; i <= n; i++) {
        points[i] = sorted[i] as number[];
        values[i] = sortedVals[i] as number;
      }

      const xBar = centroid(points, n);
      const xR = applyBounds(
        (Array.isArray(xBar) ? xBar : []).map((v, i) => v + RHO * (v - (points[n]?.[i] ?? 0))),
        bounds,
      );
      const fR = fn(xR);

      if ((values[0] ?? Infinity) <= fR && fR < (values[n - 1] ?? Infinity)) {
        points[n] = xR;
        values[n] = fR;
      } else if (fR < (values[0] ?? Infinity)) {
        const xE = applyBounds(
          (Array.isArray(xBar) ? xBar : []).map((v, i) => v + CHI * ((xR[i] ?? 0) - v)),
          bounds,
        );
        const fE = fn(xE);
        points[n] = fE < fR ? xE : xR;
        values[n] = fE < fR ? fE : fR;
      } else {
        const xC = applyBounds(
          (Array.isArray(xBar) ? xBar : []).map((v, i) => v + GAMMA * ((points[n]?.[i] ?? 0) - v)),
          bounds,
        );
        const fC = fn(xC);
        if (fC < (values[n] ?? Infinity)) {
          points[n] = xC;
          values[n] = fC;
        } else {
          for (let i = 1; i <= n; i++) {
            points[i] = applyBounds(
              (points[0] as number[]).map((v, j) => v + SIGMA * ((points[i]?.[j] ?? 0) - v)),
              bounds,
            );
            values[i] = fn(points[i] as number[]);
          }
        }
      }

      const c = centroid(points, -1);
      const spread = Math.sqrt(
        (Array.isArray(points) ? points : []).reduce((s, p) => s + euclid(p, c) ** 2, 0) / n,
      );
      if (spread < CONVERGENCE_TOL) break;
      iters++;
    }

    const best = (Array.isArray(values) ? values : []).reduce(
      (b, v, i) => (v < b.v ? { v, i } : b),
      { v: Infinity, i: 0 },
    );

    return {
      params: applyBounds(points[best.i] as number[], bounds),
      value: best.v,
      iterations: iters,
    };
  }
}
