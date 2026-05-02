import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeDiv, safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

const LEARNING_RATE = 0.01;
const LAMBDA = 0.001;
const MAX_ITER = 1000;
const ROC_POINTS = 100;

export interface TrainSample {
  features: number[];
  label: number;
}

export interface RetrainResult {
  coefficients: number[];
  featureNames: string[];
  auc: number;
  sampleSize: number;
  version: number;
}

const FEATURE_NAMES = ['intercept', 'r_norm', 'f_norm', 'm_norm', 'complaints', 'days_contact', 'tickets'];

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
}

function computeAuc(labels: number[], probs: number[]): number {
  let auc = 0;
  let prevFpr = 0;
  let prevTpr = 0;

  for (let t = 0; t <= ROC_POINTS; t++) {
    const threshold = t / ROC_POINTS;
    let tp = 0; let fp = 0; let tn = 0; let fn_ = 0;
    for (let i = 0; i < labels.length; i++) {
      const pred = (probs[i] ?? 0) >= threshold ? 1 : 0;
      if (pred === 1 && labels[i] === 1) tp++;
      else if (pred === 1 && labels[i] === 0) fp++;
      else if (pred === 0 && labels[i] === 0) tn++;
      else fn_++;
    }
    const tpr = safeDiv(tp, tp + fn_);
    const fpr = safeDiv(fp, fp + tn);
    auc += 0.5 * Math.abs(fpr - prevFpr) * (tpr + prevTpr);
    prevFpr = fpr;
    prevTpr = tpr;
  }
  return auc;
}

function trainLogReg(samples: TrainSample[]): { coefficients: number[]; auc: number } {
  const n = samples.length;
  const dim = (samples[0]?.features.length ?? 0);
  let beta = new Array(dim).fill(0) as number[];

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const grad = new Array(dim).fill(0) as number[];
    for (const s of samples) {
      const z = dotProduct(beta, s.features);
      const err = sigmoid(z) - s.label;
      for (let j = 0; j < dim; j++) grad[j] += err * (s.features[j] ?? 0);
    }
    for (let j = 0; j < dim; j++) {
      grad[j] = safeNum(safeDiv(grad[j], n)) + LAMBDA * (beta[j] ?? 0);
      beta[j] = (beta[j] ?? 0) - LEARNING_RATE * grad[j];
    }
  }

  const probs = samples.map(s => sigmoid(dotProduct(beta, s.features)));
  const labels = samples.map(s => s.label);
  const auc = computeAuc(labels, probs);
  return { coefficients: beta, auc };
}

@Injectable()
export class ChurnRetrainService {
  @Calculation('crm.churn.retrain')
  async retrain(samples: TrainSample[]): Promise<Result<RetrainResult, AppError>> {
    if (!Array.isArray(samples) || samples.length < 10) {
      return Err({ code: 'BAD_REQUEST', message: 'Qayta o\'qitish uchun kamida 10 ta namuna kerak' });
    }

    const expectedDim = FEATURE_NAMES.length;
    const badSamples = samples.filter(s => s.features.length !== expectedDim);
    if (badSamples.length > 0) {
      return Err({
        code: 'BAD_REQUEST',
        message: `Barcha namunalarda aniq ${expectedDim} ta xususiyat bo'lishi kerak (FEATURE_NAMES bilan mos kelishi uchun). ${badSamples.length} ta namuna mos kelmadi.`,
      });
    }

    const { coefficients, auc } = trainLogReg(samples);

    const AUC_THRESHOLD = 0.70;
    if (auc < AUC_THRESHOLD) {
      return Err({
        code: 'BAD_REQUEST',
        message: `Model AUC ${auc.toFixed(4)} < ${AUC_THRESHOLD} — deploy bloklanadi. Ko'proq yoki sifatli namunalar bilan qayta urinib ko'ring.`,
      });
    }

    const maxVersion = await runQuery<{ v: number }>(sql`
      SELECT COALESCE(MAX(version), 0) AS v FROM churn_model_params
    `);
    const nextVersion = safeNum((maxVersion[0] ?? { v: 0 }).v) + 1;
    const coefJson    = JSON.stringify({ values: coefficients });
    const featuresSql = sql.join(FEATURE_NAMES.map(f => sql`${f}`), sql`, `);

    await db.transaction(async (tx) => {
      await tx.execute(sql`
        UPDATE churn_model_params SET is_active = false WHERE is_active = true
      `);
      await tx.execute(sql`
        INSERT INTO churn_model_params (version, coefficients, feature_names, auc, trained_at, is_active, sample_size)
        VALUES (
          ${nextVersion},
          ${coefJson}::jsonb,
          ARRAY[${featuresSql}]::text[],
          ${auc},
          NOW(),
          true,
          ${samples.length}
        )
        ON CONFLICT (version) DO UPDATE SET
          coefficients = EXCLUDED.coefficients,
          auc          = EXCLUDED.auc,
          trained_at   = EXCLUDED.trained_at,
          is_active    = true,
          sample_size  = EXCLUDED.sample_size
      `);
    });

    return Ok({ coefficients, featureNames: FEATURE_NAMES, auc, sampleSize: samples.length, version: nextVersion });
  }
}
