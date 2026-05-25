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

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeSum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CRM_ANALYTICS_REPO, ICrmAnalyticsRepo } from './repositories/i-crm-analytics.repo';

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
  constructor(
    @Inject(CRM_ANALYTICS_REPO) private readonly repo: ICrmAnalyticsRepo,
  ) {}

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
    const row = await this.repo.findActiveChurnModel();
    if (!row) return null;
    const values = row.coefficients?.values;
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
    const { logit, modelSource } = activeCoef
      ? { logit: this.logitFromDbModel(activeCoef, features, rfm), modelSource: 'db' as const }
      : { logit: this.logitFromDefaults(features, rfm), modelSource: 'default' as const };

    const probability = this.sigmoid(logit);
    const risk: ChurnRisk = probability > 0.7 ? 'HIGH' : probability > 0.4 ? 'MEDIUM' : 'LOW';
    return Ok({ probability, risk, logit, requiresAlert: risk === 'HIGH', features, modelSource });
  }

  private logitFromDbModel(activeCoef: number[], features: ChurnFeatures, rfm: number): number {
    // Build feature vector matching FEATURE_NAMES:
    // ['intercept', 'r_norm', 'f_norm', 'm_norm', 'complaints', 'days_contact', 'tickets']
    const rNorm = (rfm - 1) / 4; // normalize 1-5 → 0-1
    const featureVec = [
      1,                                          // intercept
      rNorm,                                      // r_norm
      0.5,                                        // f_norm — not in ChurnFeatures, neutral
      0.5,                                        // m_norm — not in ChurnFeatures, neutral
      safeNum(features.complaintCount),
      safeNum(features.daysSinceLastContact),
      safeNum(features.supportTicketCount),
    ];
    const coefs = Array.isArray(activeCoef) ? activeCoef : [];
    return coefs.reduce((s, b, i) => s + b * (featureVec[i] ?? 0), 0);
  }

  private logitFromDefaults(features: ChurnFeatures, rfm: number): number {
    const c = DEFAULT_CHURN_COEFFICIENTS;
    return safeSum([
      c.intercept,
      c.rfmRecency       * rfm,
      c.complaints       * safeNum(features.complaintCount),
      c.daysSinceContact * safeNum(features.daysSinceLastContact),
      c.supportTickets   * safeNum(features.supportTicketCount),
      c.paymentLate      * safeNum(features.paymentLateCount),
    ]);
  }
}
