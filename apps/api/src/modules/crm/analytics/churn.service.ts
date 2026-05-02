/**
 * churn.service.ts — TZ-41: Churn Ehtimoli (Logistic Regression)
 *
 * Formula:
 *   P(churn) = σ(β₀ + β₁x₁ + β₂x₂ + β₃x₃ + β₄x₄ + β₅x₅)
 *   σ(z) = 1 / (1 + e^{-z})
 *
 * Feature-lar:
 *   x₁ = RFM recency score (1–5)
 *   x₂ = complaint count (oxirgi 6 oy)
 *   x₃ = days since last contact
 *   x₄ = support tickets count
 *   x₅ = payment late count
 *
 * Risk darajalari:
 *   P > 0.7: HIGH   — Telegram alert, sales call
 *   P > 0.4: MEDIUM — email campaign
 *   P ≤ 0.4: LOW
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeSum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

export type ChurnRisk = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ChurnFeatures {
  rfmRecencyScore: number;
  complaintCount: number;
  daysSinceLastContact: number;
  supportTicketCount: number;
  paymentLateCount: number;
}

export interface ChurnCoefficients {
  intercept: number;
  rfmRecency: number;
  complaints: number;
  daysSinceContact: number;
  supportTickets: number;
  paymentLate: number;
}

export const DEFAULT_CHURN_COEFFICIENTS: ChurnCoefficients = {
  intercept: -1.5,
  rfmRecency: -0.4,
  complaints: 0.6,
  daysSinceContact: 0.02,
  supportTickets: 0.3,
  paymentLate: 0.5,
};

export interface ChurnResult {
  probability: number;
  risk: ChurnRisk;
  logit: number;
  requiresAlert: boolean;
  features: ChurnFeatures;
}

@Injectable()
export class ChurnService {
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  @Calculation('crm.churn.predict')
  async predictChurn(
    features: ChurnFeatures,
    coefficients: ChurnCoefficients = DEFAULT_CHURN_COEFFICIENTS,
  ): Promise<Result<ChurnResult, AppError>> {
    const rfm = safeNum(features.rfmRecencyScore);
    if (rfm < 1 || rfm > 5) {
      return Err({ code: 'BAD_REQUEST', message: 'rfmRecencyScore 1..5 oralig\'ida bo\'lishi kerak' });
    }

    const logit = safeSum([
      coefficients.intercept,
      coefficients.rfmRecency * safeNum(features.rfmRecencyScore),
      coefficients.complaints * safeNum(features.complaintCount),
      coefficients.daysSinceContact * safeNum(features.daysSinceLastContact),
      coefficients.supportTickets * safeNum(features.supportTicketCount),
      coefficients.paymentLate * safeNum(features.paymentLateCount),
    ]);

    const probability = this.sigmoid(logit);
    const risk: ChurnRisk = probability > 0.7 ? 'HIGH' : probability > 0.4 ? 'MEDIUM' : 'LOW';

    return Ok({
      probability,
      risk,
      logit,
      requiresAlert: risk === 'HIGH',
      features,
    });
  }

  @Calculation('crm.churn.batchPredict')
  async batchPredict(
    batch: Array<{ customerId: string; features: ChurnFeatures }>,
    coefficients: ChurnCoefficients = DEFAULT_CHURN_COEFFICIENTS,
  ): Promise<Result<Array<{ customerId: string } & ChurnResult>, AppError>> {
    if (!batch.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Batch bo\'sh' });
    }

    const results: Array<{ customerId: string } & ChurnResult> = [];
    for (const item of batch) {
      const r = await this.predictChurn(item.features, coefficients);
      if (!r.ok) return Err(r.error);
      results.push({ customerId: item.customerId, ...r.data });
    }

    return Ok(results);
  }

  /**
   * Load the currently active model's raw coefficient vector from churn_model_params.
   * FEATURE_NAMES order: ['intercept','r_norm','f_norm','m_norm','complaints','days_contact','tickets']
   * Returns null when no active model exists (caller falls back to DEFAULT_CHURN_COEFFICIENTS).
   */
  async loadActiveModel(): Promise<number[] | null> {
    const rows = await runQuery<{ coefficients: { values: number[] } }>(sql`
      SELECT coefficients
      FROM churn_model_params
      WHERE is_active = true
      ORDER BY trained_at DESC
      LIMIT 1
    `);
    if (!rows.length) return null;
    const values = rows[0]?.coefficients?.values;
    if (!Array.isArray(values) || values.length < 7) return null;
    return values;
  }

  /**
   * Predict churn using the active DB model when available; falls back to defaults.
   * Builds the 7-element feature vector matching FEATURE_NAMES order:
   *   [intercept=1, r_norm, f_norm=0.5, m_norm=0.5, complaints, days_contact, tickets]
   */
  @Calculation('crm.churn.predictWithActiveModel')
  async predictWithActiveModel(features: ChurnFeatures): Promise<Result<ChurnResult & { modelSource: 'db' | 'default' }, AppError>> {
    const rfm = safeNum(features.rfmRecencyScore);
    if (rfm < 1 || rfm > 5) {
      return Err({ code: 'BAD_REQUEST', message: 'rfmRecencyScore 1..5 oralig\'ida bo\'lishi kerak' });
    }

    const activeCoef = await this.loadActiveModel();

    let logit: number;
    let modelSource: 'db' | 'default';

    if (activeCoef) {
      // Build feature vector matching FEATURE_NAMES:
      // ['intercept', 'r_norm', 'f_norm', 'm_norm', 'complaints', 'days_contact', 'tickets']
      const rNorm = (rfm - 1) / 4;                          // normalize 1-5 → 0-1
      const featureVec = [
        1,                                                    // intercept
        rNorm,                                               // r_norm
        0.5,                                                 // f_norm — not in ChurnFeatures, use neutral
        0.5,                                                 // m_norm — not in ChurnFeatures, use neutral
        safeNum(features.complaintCount),                    // complaints
        safeNum(features.daysSinceLastContact),              // days_contact
        safeNum(features.supportTicketCount),                // tickets
      ];
      logit = (activeCoef ?? []).reduce((s, b, i) => s + b * (featureVec[i] ?? 0), 0);
      modelSource = 'db';
    } else {
      const c = DEFAULT_CHURN_COEFFICIENTS;
      logit = safeSum([
        c.intercept,
        c.rfmRecency    * rfm,
        c.complaints    * safeNum(features.complaintCount),
        c.daysSinceContact * safeNum(features.daysSinceLastContact),
        c.supportTickets * safeNum(features.supportTicketCount),
        c.paymentLate   * safeNum(features.paymentLateCount),
      ]);
      modelSource = 'default';
    }

    const probability = this.sigmoid(logit);
    const risk: ChurnRisk = probability > 0.7 ? 'HIGH' : probability > 0.4 ? 'MEDIUM' : 'LOW';

    return Ok({ probability, risk, logit, requiresAlert: risk === 'HIGH', features, modelSource });
  }
}
