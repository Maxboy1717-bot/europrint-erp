/**
 * lead-scorer-v2.service.ts — TZ-D12: Bayesian Lead Scorer + Temporal Decay
 *
 * Formula:
 *   P(convert | x) = σ(β^T x)     (logistic regression)
 *   σ(z) = 1 / (1 + e^{-z})
 *
 *   Temporal decay (vaqt o'tishi bilan lead "sovishi"):
 *   w(t) = e^{-λt}
 *   λ = ln(2) / T_{1/2}   (T_{1/2} = 30 kun)
 *
 *   Yakuniy score:
 *   score = σ(β·x) × e^{-λ × daysInactive} × 100
 *
 *   Training: SGD logistic regression (min 50 sample)
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

    this.model = {
      weights,
      bias,
      samplesCount: trainingData.length,
      trainedAt: new Date(),
    };

    return Ok({ ...this.model });
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
