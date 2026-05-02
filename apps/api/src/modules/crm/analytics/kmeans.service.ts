import { Injectable, Logger } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeDiv, safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

export const KMEANS_K = 6;
const KMEANS_MAX_ITER = 100;
const KMEANS_TOL = 1e-4;
const KMEANS_N_INIT = 5;

export interface RfmPoint {
  customerId: string;
  rNorm: number;
  fNorm: number;
  mNorm: number;
}

export type SegmentLabel =
  | 'Champions'
  | 'Loyal'
  | 'At-Risk'
  | 'New Customer'
  | 'Hibernating'
  | 'Lost';

export interface ClusterResult {
  customerId: string;
  clusterId: number;
  rNorm: number;
  fNorm: number;
  mNorm: number;
  segmentLabel: SegmentLabel;
}

function dist(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - (b[i] ?? 0)) ** 2, 0));
}

function assignLabels(centroids: number[][]): SegmentLabel[] {
  return centroids.map(c => {
    const r = c[0] ?? 0;
    const f = c[1] ?? 0;
    const m = c[2] ?? 0;
    if (r > 0.7 && f > 0.7 && m > 0.7) return 'Champions';
    if (f > 0.6 && m > 0.5) return 'Loyal';
    if (r < 0.3 && (f > 0.5 || m > 0.5)) return 'At-Risk';
    if (r > 0.7 && f < 0.4) return 'New Customer';
    if (r < 0.3 && f < 0.4 && m < 0.4) return 'Lost';
    return 'Hibernating';
  });
}

function kmeansOnce(points: number[][], k: number): { labels: number[]; centroids: number[][]; inertia: number } {
  const n = points.length;
  const dim = points[0]?.length ?? 3;
  const centroids: number[][] = [];

  const first = Math.floor(Math.random() * n);
  centroids.push([...(points[first] as number[])]);

  for (let c = 1; c < k; c++) {
    const dists = points.map(p => {
      const minD = Math.min(...centroids.map(cent => dist(p, cent)));
      return minD * minD;
    });
    const totalD = dists.reduce((s, d) => s + d, 0);
    let r = Math.random() * totalD;
    let chosen = 0;
    for (let i = 0; i < n; i++) {
      r -= dists[i] ?? 0;
      if (r <= 0) { chosen = i; break; }
    }
    centroids.push([...(points[chosen] as number[])]);
  }

  let labels = new Array(n).fill(0) as number[];
  for (let iter = 0; iter < KMEANS_MAX_ITER; iter++) {
    const newLabels = points.map(p =>
      centroids.reduce(
        (best, c, ci) => dist(p, c) < best.d ? { d: dist(p, c), i: ci } : best,
        { d: Infinity, i: 0 },
      ).i,
    );

    const newCentroids = Array.from({ length: k }, (_, ci) => {
      const members = points.filter((_, pi) => newLabels[pi] === ci);
      if (!members.length) return centroids[ci] as number[];
      const avg = new Array(dim).fill(0) as number[];
      for (const p of members) for (let d = 0; d < dim; d++) avg[d] += (p[d] ?? 0) / members.length;
      return avg;
    });

    const shift = centroids.reduce((s, c, ci) => s + dist(c, newCentroids[ci] as number[]) ** 2, 0);
    labels = newLabels;
    for (let ci = 0; ci < k; ci++) centroids[ci] = newCentroids[ci] as number[];
    if (shift < KMEANS_TOL ** 2) break;
  }

  const inertia = points.reduce((s, p, i) => s + dist(p, centroids[labels[i] ?? 0] as number[]) ** 2, 0);
  return { labels, centroids, inertia };
}

@Injectable()
export class KMeansService {
  private readonly logger = new Logger(KMeansService.name);

  @Calculation('crm.kmeans.cluster')
  async cluster(points: RfmPoint[]): Promise<Result<ClusterResult[], AppError>> {
    if (!Array.isArray(points) || points.length < KMEANS_K) {
      return Err({ code: 'BAD_REQUEST', message: `K-Means uchun kamida ${KMEANS_K} ta mijoz kerak` });
    }

    const vecs = (points ?? []).map(p => [safeNum(p.rNorm), safeNum(p.fNorm), safeNum(p.mNorm)]);
    let best = { labels: [] as number[], centroids: [] as number[][], inertia: Infinity };

    for (let init = 0; init < KMEANS_N_INIT; init++) {
      const result = kmeansOnce(vecs, KMEANS_K);
      if (result.inertia < best.inertia) best = result;
    }

    const segLabels = assignLabels(best.centroids);
    const calculatedAt = new Date().toISOString();

    const results: ClusterResult[] = (points ?? []).map((p, i) => ({
      customerId: p.customerId,
      clusterId: best.labels[i] ?? 0,
      rNorm: p.rNorm,
      fNorm: p.fNorm,
      mNorm: p.mNorm,
      segmentLabel: segLabels[best.labels[i] ?? 0] as SegmentLabel,
    }));

    // Persist cluster assignments to rfm_clusters table (fail-fast: propagate DB errors)
    for (const r of results) {
      try {
        await rawSql(sql`
          INSERT INTO rfm_clusters
            (customer_id, cluster_id, r_norm, f_norm, m_norm, segment_label, calculated_at)
          VALUES
            (${r.customerId}, ${r.clusterId}, ${r.rNorm}, ${r.fNorm}, ${r.mNorm}, ${r.segmentLabel}, ${calculatedAt})
          ON CONFLICT (customer_id, calculated_at)
          DO UPDATE SET
            cluster_id    = EXCLUDED.cluster_id,
            r_norm        = EXCLUDED.r_norm,
            f_norm        = EXCLUDED.f_norm,
            m_norm        = EXCLUDED.m_norm,
            segment_label = EXCLUDED.segment_label
        `);
      } catch (e) {
        return Err({
          code: 'DB_ERROR',
          message: `rfm_clusters ga yozishda xato (customerId=${r.customerId}): ${String(e)}`,
        });
      }
    }

    return Ok(results);
  }
}
