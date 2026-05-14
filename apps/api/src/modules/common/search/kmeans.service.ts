/**
 * kmeans.service.ts — TZ-52: K-Means Klasterlash (mijoz segmentatsiya)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';

export type Point = number[];

export interface ClusterResult {
  k: number;
  assignments: number[];
  centroids: Point[];
  wcss: number;
  silhouetteScore: number;
}

@Injectable()
export class KMeansService {
  private euclideanSq(a: Point, b: Point): number {
    return (Array.isArray(a) ? a : []).reduce((sum, v, i) => sum + (v - (b[i] ?? 0)) ** 2, 0);
  }

  private euclidean(a: Point, b: Point): number {
    return Math.sqrt(this.euclideanSq(a, b));
  }

  private mean(points: Point[]): Point {
    const safePoints = Array.isArray(points) ? points : [];
    const dim = safePoints[0]?.length ?? 0;
    const sum = new Array<number>(dim).fill(0);
    for (const p of safePoints) {
      for (let d = 0; d < dim; d++) sum[d] += p[d];
    }
    return (Array.isArray(sum) ? sum : []).map(s => s / (safePoints.length || 1));
  }

  private assign(points: readonly Point[], centroids: Point[]): number[] {
    const safePoints = Array.isArray(points) ? points : [];
    return (Array.isArray(safePoints) ? safePoints : []).map(p =>
      (Array.isArray(centroids) ? centroids : []).reduce(
        (bestK, c, k) =>
          this.euclideanSq(p, c) < this.euclideanSq(p, centroids[bestK]) ? k : bestK,
        0,
      ),
    );
  }

  private initCentroids(points: readonly Point[], k: number, rng: () => number): Point[] {
    const safePoints = Array.isArray(points) ? points : [];
    const centroids: Point[] = [];
    const firstIdx = Math.floor(rng() * safePoints.length);
    centroids.push([...safePoints[firstIdx]]);

    for (let c = 1; c < k; c++) {
      const dists = (Array.isArray(safePoints) ? safePoints : []).map(p =>
        Math.min(...(Array.isArray(centroids) ? centroids : []).map(center => this.euclideanSq(p, center))),
      );
      const total = (Array.isArray(dists) ? dists : []).reduce((s, d) => s + d, 0);
      let rand = rng() * total;
      let chosen = 0;
      for (let i = 0; i < dists.length; i++) {
        rand -= dists[i];
        if (rand <= 0) { chosen = i; break; }
      }
      centroids.push([...points[chosen]]);
    }
    return centroids;
  }

  silhouette(points: readonly Point[], assignments: number[], k: number): number {
    if (k === 1) return 0;

    const safePoints: Point[] = Array.isArray(points) ? [...points] : [];
    const n = safePoints.length;
    let totalSil = 0;

    for (let i = 0; i < n; i++) {
      const myCluster = assignments[i];
      const sameCluster = (Array.isArray(safePoints) ? safePoints : []).filter((_, idx) => assignments[idx] === myCluster && idx !== i);

      const a = sameCluster.length
        ? (Array.isArray(sameCluster) ? sameCluster : []).reduce((s: number, p: Point) => s + this.euclidean(safePoints[i], p), 0) / sameCluster.length
        : 0;

      let b = Infinity;
      for (let c = 0; c < k; c++) {
        if (c === myCluster) continue;
        const clusterPts = (Array.isArray(safePoints) ? safePoints : []).filter((_, idx) => assignments[idx] === c);
        if (!clusterPts.length) continue;
        const avgDist = (Array.isArray(clusterPts) ? clusterPts : []).reduce((s: number, p: Point) => s + this.euclidean(safePoints[i], p), 0) / clusterPts.length;
        if (avgDist < b) b = avgDist;
      }

      if (!isFinite(b)) {
        totalSil += -1;
        continue;
      }

      const maxAB = Math.max(a, b);
      const sil = maxAB > 0 ? (b - a) / maxAB : 0;
      totalSil += Math.max(-1, Math.min(1, sil));
    }

    return totalSil / n;
  }

  fit(
    points: readonly Point[],
    k: number,
    maxIter = 100,
    seed = 42,
  ): Result<ClusterResult, AppError> {
    if (!Array.isArray(points) || !points.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Nuqtalar ro\'yxati bo\'sh' });
    }
    if (k < 1) {
      return Err({ code: 'BAD_REQUEST', message: 'k ≥ 1 bo\'lishi kerak' });
    }
    if (k > points.length) {
      return Err({ code: 'BAD_REQUEST', message: 'k nuqtalar sonidan oshmasligi kerak' });
    }

    const dim = points[0].length;
    if (!(Array.isArray(points) ? points : []).every(p => p.length === dim)) {
      return Err({ code: 'VALIDATION', message: 'Barcha nuqtalar bir xil o\'lchamda bo\'lishi kerak' });
    }

    let rngState = seed;
    const rng = (): number => {
      rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
      return ((rngState >>> 0) / 0x100000000);
    };

    let centroids = this.initCentroids(points, k, rng);
    let assignments = this.assign(points, centroids);

    for (let iter = 0; iter < maxIter; iter++) {
      const newCentroids: Point[] = [];
      for (let c = 0; c < k; c++) {
        const cluster = (Array.isArray(points) ? points : []).filter((_, idx) => assignments[idx] === c);
        newCentroids.push(cluster.length ? this.mean(cluster) : centroids[c]);
      }

      const newAssignments = this.assign(points, newCentroids);
      const changed = (Array.isArray(newAssignments) ? newAssignments : []).some((a, i) => a !== assignments[i]);
      centroids = newCentroids;
      assignments = newAssignments;
      if (!changed) break;
    }

    const wcss = (Array.isArray(points) ? points : []).reduce(
      (s, p, i) => s + this.euclideanSq(p, centroids[assignments[i]]),
      0,
    );

    const silhouetteScore = this.silhouette(points, assignments, k);

    return Ok({ k, assignments, centroids, wcss, silhouetteScore });
  }

  findOptimalK(
    points: readonly Point[],
    kMin = 2,
    kMax = 8,
    maxIter = 100,
    seed = 42,
  ): Result<ClusterResult, AppError> {
    if (!Array.isArray(points) || !points.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Nuqtalar ro\'yxati bo\'sh' });
    }
    if (kMin < 1 || kMax < kMin) {
      return Err({ code: 'VALIDATION', message: 'kMin ≥ 1 va kMax ≥ kMin bo\'lishi kerak' });
    }

    const maxK = Math.min(kMax, points.length);
    let bestResult: ClusterResult | null = null;

    for (let k = kMin; k <= maxK; k++) {
      const r = this.fit(points, k, maxIter, seed);
      if (!r.ok) continue;
      if (!bestResult || r.data.silhouetteScore > bestResult.silhouetteScore) {
        bestResult = r.data;
      }
    }

    if (!bestResult) {
      return Err({ code: 'INTERNAL', message: 'Optimal k topib bo\'lmadi' });
    }

    return Ok(bestResult);
  }
}
