/**
 * @module lead-scorer-v2.service
 * @description Probabilistic lead-quality scorer — a sibling to the heuristic
 *   `lead-scorer.service.ts` that uses a *trained* logistic-regression model
 *   plus an exponential time-decay factor. Use whichever fits your data
 *   regime (see WHY BOTH below).
 *
 *   Formula:
 *     P(convert | x)     = σ(β·x)           where σ(z) = 1 / (1 + e^(−z))
 *     decay(daysInactive) = e^(−λ × days)   λ = ln(2) / HALF_LIFE_DAYS
 *     score              = P × decay × 100  (0..100, percentage-style)
 *
 *   Features fed to the model:
 *     log1p(budget)         — UZS, log-scaled so huge budgets don't dominate
 *     sourceEncoded         — integer encoding of lead source channel
 *     min(interactionCount, 20) — capped to avoid over-weighting a single chatty lead
 *     min(daysActive, 365)  — capped: anything older than a year is "ancient"
 *
 *   Training: stochastic gradient descent on `LeadTrainingData[]`, requires
 *   ≥ 50 labelled examples (convert / no-convert). Until then, model weights
 *   are all zeros and the score collapses to the decay factor × 50 — a
 *   conservative "we don't know yet, decay the cold leads" behaviour.
 * @layer Domain Service (CRM — pure compute, no DB)
 *
 * WHY BOTH `lead-scorer` (V1 heuristic) AND `lead-scorer-v2` (logistic)
 *   V1 is rules-based: explainable, no training data needed, useful from
 *   day 1. V2 needs labelled outcomes (which leads actually converted) to
 *   train. We run both:
 *     - V1 score → shown to SDRs immediately (triage)
 *     - V2 score → shown in analytics + dashboards (model retrained nightly)
 *   When V2 has >500 samples and stable AUC > 0.7, the dashboard will
 *   switch to V2 as the primary score. Until then, V1 is authoritative.
 *
 * WHY 30-DAY HALF-LIFE
 *   Our average B2B sales cycle is ~30-45 days (see lead-scorer V1 docs).
 *   With λ = ln(2)/30, a lead inactive for 30 days has its score halved.
 *   Sales managers wanted a clear "second month = half priority" rule
 *   rather than a more aggressive 14-day decay (would kill warm leads
 *   too fast) or slower 90-day (would keep dead leads alive).
 *
 * WHY log1p ON BUDGET
 *   Budgets span 4 orders of magnitude (100k UZS .. 1B UZS). Linear scale
 *   would have the model effectively ignore non-100M+ budgets. log1p
 *   compresses the range while keeping 0 = 0 (no-budget leads are
 *   correctly treated as low signal, not negative).
 *
 * WHY HARD CAPS ON interactionCount AND daysActive
 *   A lead with 100 emails over 2 years isn't 100× more likely to convert
 *   than one with 10 emails. Capping limits the leverage any single
 *   feature can have on the linear logistic combination; without caps,
 *   one outlier training sample can flip the model.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeSum, clamp } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export type LeadSegment = 'HOT' | 'WARM' | 'LUKEWARM' | 'COLD';

export interface LeadFeatures {
  budget: number;
  sourceEncoded: number;
  interactionCount: number;
  daysActive: number;
}

export interface LeadScoreResult {
  score: number;
  confidence: number;
  decayFactor: number;
  daysInactive: number;
  probability: number;
  segment: LeadSegment;
}

export interface LeadTrainingData {
  features: LeadFeatures;
  converted: boolean;
}

export interface ModelWeights {
  weights: number[];
  bias: number;
  samplesCount: number;
  trainedAt: Date;
}

const FEATURE_DIM = 4;
const HALF_LIFE_DAYS = 30;
const LAMBDA = Math.log(2) / HALF_LIFE_DAYS;

@Injectable()
export class LeadScorerV2Service {
  private model: ModelWeights = {
    weights: new Array(FEATURE_DIM).fill(0),
    bias: 0,
    samplesCount: 0,
    trainedAt: new Date(0),
  };

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  private dotProduct(weights: number[], x: number[]): number {
    return safeSum((Array.isArray(weights) ? weights : []).map((w, i) => w * safeNum(x[i])));
  }

  private buildFeatureVector(f: LeadFeatures): number[] {
    return [
      Math.log1p(safeNum(f.budget)),
      safeNum(f.sourceEncoded),
      Math.min(safeNum(f.interactionCount), 20),
      Math.min(safeNum(f.daysActive), 365),
    ];
  }

  private segmentize(score: number): LeadSegment {
    if (score >= 80) return 'HOT';
    if (score >= 60) return 'WARM';
    if (score >= 40) return 'LUKEWARM';
    return 'COLD';
  }

  @Calculation('crm.leadScore.trainModel')
  async trainModel(trainingData: LeadTrainingData[]): Promise<Result<ModelWeights, AppError>> {
    if (trainingData.length < 50) {
      return Err({ code: 'BAD_REQUEST', message: `Model o'qitish uchun kamida 50 ta lead kerak, ${trainingData.length} ta berildi` });
    }
    const features = (Array.isArray(trainingData) ? trainingData : []).map(d => this.buildFeatureVector(d.features));
    const labels = (Array.isArray(trainingData) ? trainingData : []).map(d => (d.converted ? 1 : 0));
    const { weights, bias } = this.runSgd(features, labels);
    this.model = { weights, bias, samplesCount: trainingData.length, trainedAt: new Date() };
    return Ok({ ...this.model });
  }

  private runSgd(features: number[][], labels: number[]): { weights: number[]; bias: number } {
    const weights = new Array(FEATURE_DIM).fill(0);
    let bias = 0;
    const LR = 0.01;
    const EPOCHS = 200;
    for (let epoch = 0; epoch < EPOCHS; epoch++) {
      for (let i = 0; i < features.length; i++) {
        const pred = this.sigmoid(this.dotProduct(weights, features[i]) + bias);
        const error = pred - labels[i];
        for (let j = 0; j < weights.length; j++) {
          weights[j] -= LR * error * safeNum(features[i][j]);
        }
        bias -= LR * error;
      }
    }
    return { weights, bias };
  }

  @Calculation('crm.leadScore.compute')
  async computeScore(
    features: LeadFeatures,
    daysInactive: number,
  ): Promise<Result<LeadScoreResult, AppError>> {
    const di = Math.max(0, safeNum(daysInactive));
    const x = this.buildFeatureVector(features);
    const rawLogit = this.dotProduct(this.model.weights, x) + this.model.bias;
    const rawProb = this.sigmoid(rawLogit);

    const decayFactor = Math.exp(-LAMBDA * di);
    const probability = clamp(rawProb * decayFactor, 0, 1);
    const score = Math.round(probability * 100);

    return Ok({
      score,
      confidence: rawProb,
      decayFactor,
      daysInactive: di,
      probability,
      segment: this.segmentize(score),
    });
  }

  getModel(): ModelWeights {
    return { ...this.model };
  }
}
