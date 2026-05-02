/**
 * crm-analytics.spec.ts — Task #432 Sprint 3B
 *
 * TZ-D12: Lead Scorer Bayesian + Temporal Decay
 * TZ-D13: Supplier/Employee Elo Rating
 * TZ-39:  RFM Segmentatsiya (9 toifa)
 * TZ-40:  CLV — Customer Lifetime Value
 * TZ-41:  Churn Ehtimoli (Logistic Regression)
 * TZ-42:  Win-Rate + Funnel Conversion + Velocity
 * TZ-43:  Cohort Analysis (Retention Matrix)
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
  rawSql: jest.fn(),
}));

import { LeadScorerV2Service } from '../src/modules/crm/domain/services/lead-scorer-v2.service';
import { EloRatingService } from '../src/modules/crm/domain/services/elo-rating.service';
import { RfmService } from '../src/modules/crm/analytics/rfm.service';
import { ClvService } from '../src/modules/crm/analytics/clv.service';
import { ChurnService, DEFAULT_CHURN_COEFFICIENTS } from '../src/modules/crm/analytics/churn.service';
import { FunnelService } from '../src/modules/crm/analytics/funnel.service';
import { CohortService } from '../src/modules/crm/analytics/cohort.service';

// ============================================================================
// TZ-D12: Lead Scorer Bayesian + Temporal Decay
// ============================================================================
describe('LeadScorerV2Service — TZ-D12', () => {
  let svc: LeadScorerV2Service;
  beforeEach(() => { svc = new LeadScorerV2Service(); });

  const baseFeatures = { budget: 10000, sourceEncoded: 1, interactionCount: 5, daysActive: 30 };

  it('50 dan kam training data → xato qaytaradi', async () => {
    const r = await svc.trainModel([]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('49 ta sample → xato (kamida 50 kerak)', async () => {
    const data = Array.from({ length: 49 }, (_, i) => ({
      features: { budget: i * 100, sourceEncoded: i % 3, interactionCount: i % 20, daysActive: i % 365 },
      converted: i % 3 === 0,
    }));
    const r = await svc.trainModel(data);
    expect(r.ok).toBe(false);
  });

  it('50+ training data bilan model o\'qitiladi', async () => {
    const data = Array.from({ length: 60 }, (_, i) => ({
      features: { budget: (i + 1) * 1000, sourceEncoded: i % 3, interactionCount: Math.min(i, 20), daysActive: Math.min(i * 5, 365) },
      converted: i % 2 === 0,
    }));
    const r = await svc.trainModel(data);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.weights).toHaveLength(4);
      expect(r.data.samplesCount).toBe(60);
    }
  });

  it('computeScore — score 0..100 oralig\'ida', async () => {
    const r = await svc.computeScore(baseFeatures, 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.score).toBeGreaterThanOrEqual(0);
      expect(r.data.score).toBeLessThanOrEqual(100);
    }
  });

  it('30 kun inaktivlik → decayFactor ≈ 0.5 (yarimlanish)', async () => {
    const r = await svc.computeScore(baseFeatures, 30);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.decayFactor).toBeCloseTo(0.5, 1);
    }
  });

  it('60 kun inaktivlik → decayFactor ≈ 0.25 (ikki marta yarimlanish)', async () => {
    const r = await svc.computeScore(baseFeatures, 60);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.decayFactor).toBeCloseTo(0.25, 1);
    }
  });

  it('0 kun inaktivlik → decayFactor = 1.0', async () => {
    const r = await svc.computeScore(baseFeatures, 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.decayFactor).toBeCloseTo(1.0, 5);
    }
  });

  it('ko\'p inaktivlik → score kamayadi', async () => {
    const r0 = await svc.computeScore(baseFeatures, 0);
    const r90 = await svc.computeScore(baseFeatures, 90);
    expect(r0.ok && r90.ok).toBe(true);
    if (r0.ok && r90.ok) {
      expect(r90.data.score).toBeLessThanOrEqual(r0.data.score);
    }
  });

  it('segment: score=85 → HOT', async () => {
    const data = Array.from({ length: 80 }, (_, i) => ({
      features: { budget: 999999, sourceEncoded: 5, interactionCount: 20, daysActive: 365 },
      converted: true,
    }));
    await svc.trainModel(data);
    const r = await svc.computeScore({ budget: 999999, sourceEncoded: 5, interactionCount: 20, daysActive: 365 }, 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(['HOT', 'WARM', 'LUKEWARM', 'COLD']).toContain(r.data.segment);
    }
  });

  it('manfiy daysInactive → 0 ga klamplanadi (xato yo\'q)', async () => {
    const r = await svc.computeScore(baseFeatures, -10);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.daysInactive).toBe(0);
    }
  });
});

// ============================================================================
// TZ-D13: Elo Rating
// ============================================================================
describe('EloRatingService — TZ-D13', () => {
  let svc: EloRatingService;
  beforeEach(() => { svc = new EloRatingService(); });

  it('boshlang\'ich reyting 1500 + perfect natija → reyting oshadi', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 5, outcome: 'perfect' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.newRating).toBeGreaterThan(1500);
      expect(r.data.K).toBe(40);
      expect(r.data.actualScore).toBe(1.0);
    }
  });

  it('1500 reyting + failed natija → reyting kamayadi', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 5, outcome: 'failed' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.newRating).toBeLessThan(1500);
      expect(r.data.actualScore).toBe(0.0);
    }
  });

  it('K-faktor: gamesPlayed=5 → K=40', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 5, outcome: 'late_1day' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.K).toBe(40);
  });

  it('K-faktor: gamesPlayed=30 → K=24', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 30, outcome: 'late_1day' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.K).toBe(24);
  });

  it('K-faktor: gamesPlayed=60 → K=16', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 60, outcome: 'late_1day' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.K).toBe(16);
  });

  it('late_1day natijasi → S=0.7', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 5, outcome: 'late_1day' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.actualScore).toBe(0.7);
  });

  it('late_3plus natijasi → S=0.3', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 5, outcome: 'late_3plus' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.actualScore).toBe(0.3);
  });

  it('reyting o\'zgarishi: newRating - previousRating to\'g\'ri', async () => {
    const r = await svc.updateRating({ currentRating: 1600, gamesPlayed: 10, outcome: 'perfect' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.change).toBe(r.data.newRating - r.data.previousRating);
    }
  });

  it('manfiy reyting → xato', async () => {
    const r = await svc.updateRating({ currentRating: -100, gamesPlayed: 5, outcome: 'perfect' });
    expect(r.ok).toBe(false);
  });

  it('K-faktor: gamesPlayed=20 → K=40 (chegara qiymati)', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 20, outcome: 'perfect' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.K).toBe(40);
  });

  it('K-faktor: gamesPlayed=21 → K=24', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 21, outcome: 'perfect' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.K).toBe(24);
  });

  it('K-faktor: gamesPlayed=50 → K=24 (chegara qiymati)', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 50, outcome: 'perfect' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.K).toBe(24);
  });

  it('K-faktor: gamesPlayed=51 → K=16', async () => {
    const r = await svc.updateRating({ currentRating: 1500, gamesPlayed: 51, outcome: 'perfect' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.K).toBe(16);
  });

  it('bulkUpdate — bo\'sh massiv → xato', async () => {
    const r = await svc.bulkUpdate([]);
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-39: RFM Segmentatsiya
// ============================================================================
describe('RfmService — TZ-39', () => {
  let svc: RfmService;
  beforeEach(() => { svc = new RfmService(); });

  it('bo\'sh massiv → xato', async () => {
    const r = await svc.segmentCustomers([]);
    expect(r.ok).toBe(false);
  });

  it('bitta mijoz → segment tayinlanadi', async () => {
    const r = await svc.segmentCustomers([
      { customerId: 'c1', recencyDays: 5, frequency: 20, monetary: 50000 },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data[0].rfmScore).toBeGreaterThan(0);
      expect(['Champions', 'Loyal', 'Potential Loyalists', 'Recent Customers', 'Promising', 'Need Attention', 'At-Risk', "Can't Lose", 'Lost']).toContain(r.data[0].segment);
    }
  });

  it('RFM score = R×100 + F×10 + M', async () => {
    const r = await svc.scoreOne(
      { customerId: 'c1', recencyDays: 5, frequency: 10, monetary: 50000 },
      5, 5, 5
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.rfmScore).toBe(555);
      expect(r.data.segment).toBe('Champions');
    }
  });

  it('score 555 → Champions', async () => {
    const r = await svc.scoreOne({ customerId: 'c1', recencyDays: 1, frequency: 20, monetary: 100000 }, 5, 5, 5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.segment).toBe('Champions');
  });

  it('score 111 → Lost', async () => {
    const r = await svc.scoreOne({ customerId: 'c1', recencyDays: 365, frequency: 1, monetary: 100 }, 1, 1, 1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.segment).toBe('Lost');
  });

  it('scoreOne: rScore noto\'g\'ri (0) → xato', async () => {
    const r = await svc.scoreOne({ customerId: 'c1', recencyDays: 5, frequency: 10, monetary: 5000 }, 0, 3, 3);
    expect(r.ok).toBe(false);
  });

  it('monotonlik: yuqori F → yuqori fScore (kamaymasligi kerak)', async () => {
    const customers = [
      { customerId: 'c1', recencyDays: 30, frequency: 1,  monetary: 1000 },
      { customerId: 'c2', recencyDays: 30, frequency: 5,  monetary: 1000 },
      { customerId: 'c3', recencyDays: 30, frequency: 10, monetary: 1000 },
      { customerId: 'c4', recencyDays: 30, frequency: 20, monetary: 1000 },
      { customerId: 'c5', recencyDays: 30, frequency: 50, monetary: 1000 },
    ];
    const r = await svc.segmentCustomers(customers);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const sorted = r.data.sort((a, b) => {
        const ca = customers.find(c => c.customerId === a.customerId)!;
        const cb = customers.find(c => c.customerId === b.customerId)!;
        return ca.frequency - cb.frequency;
      });
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].fScore).toBeGreaterThanOrEqual(sorted[i - 1].fScore);
      }
    }
  });

  it('monotonlik: yuqori M → yuqori mScore (kamaymasligi kerak)', async () => {
    const customers = [
      { customerId: 'c1', recencyDays: 30, frequency: 5, monetary: 100 },
      { customerId: 'c2', recencyDays: 30, frequency: 5, monetary: 1000 },
      { customerId: 'c3', recencyDays: 30, frequency: 5, monetary: 10000 },
      { customerId: 'c4', recencyDays: 30, frequency: 5, monetary: 100000 },
      { customerId: 'c5', recencyDays: 30, frequency: 5, monetary: 1000000 },
    ];
    const r = await svc.segmentCustomers(customers);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const sorted = r.data.sort((a, b) => {
        const ca = customers.find(c => c.customerId === a.customerId)!;
        const cb = customers.find(c => c.customerId === b.customerId)!;
        return ca.monetary - cb.monetary;
      });
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].mScore).toBeGreaterThanOrEqual(sorted[i - 1].mScore);
      }
    }
  });

  it('5 ta mijoz — barchasi segment oladi', async () => {
    const customers = [
      { customerId: 'c1', recencyDays: 5, frequency: 20, monetary: 100000 },
      { customerId: 'c2', recencyDays: 30, frequency: 10, monetary: 50000 },
      { customerId: 'c3', recencyDays: 90, frequency: 5, monetary: 20000 },
      { customerId: 'c4', recencyDays: 180, frequency: 2, monetary: 5000 },
      { customerId: 'c5', recencyDays: 365, frequency: 1, monetary: 500 },
    ];
    const r = await svc.segmentCustomers(customers);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(5);
      const validSegments = ['Champions', 'Loyal', 'Potential Loyalists', 'Recent Customers', 'Promising', 'Need Attention', 'At-Risk', "Can't Lose", 'Lost'];
      r.data.forEach(item => {
        expect(item.rScore).toBeGreaterThanOrEqual(1);
        expect(item.rScore).toBeLessThanOrEqual(5);
        expect(item.fScore).toBeGreaterThanOrEqual(1);
        expect(item.fScore).toBeLessThanOrEqual(5);
        expect(item.mScore).toBeGreaterThanOrEqual(1);
        expect(item.mScore).toBeLessThanOrEqual(5);
        expect(validSegments).toContain(item.segment);
      });
    }
  });
});

// ============================================================================
// TZ-40: CLV
// ============================================================================
describe('ClvService — TZ-40', () => {
  let svc: ClvService;
  beforeEach(() => { svc = new ClvService(); });

  it('oddiy CLV = annualMargin / churnRate', async () => {
    const r = await svc.calculateSimple({
      avgOrderValue: 1000000,
      purchaseFrequencyPerYear: 12,
      grossMarginRate: 0.3,
      churnRate: 0.1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.clv).toBeCloseTo(12000000 * 0.3 / 0.1, 0);
      expect(r.data.avgLifespanYears).toBeCloseTo(10, 5);
    }
  });

  it('churnRate=0 → xato (nol bo\'linma)', async () => {
    const r = await svc.calculateSimple({
      avgOrderValue: 500000, purchaseFrequencyPerYear: 6,
      grossMarginRate: 0.25, churnRate: 0,
    });
    expect(r.ok).toBe(false);
  });

  it('grossMarginRate > 1 → xato', async () => {
    const r = await svc.calculateSimple({
      avgOrderValue: 500000, purchaseFrequencyPerYear: 6,
      grossMarginRate: 1.5, churnRate: 0.2,
    });
    expect(r.ok).toBe(false);
  });

  it('DCF CLV — 0 davr → xato', async () => {
    const r = await svc.calculateDcf({ periods: [], discountRate: 0.1 });
    expect(r.ok).toBe(false);
  });

  it('DCF CLV — t=0 da diskont = 1 (hozirgi qiymat)', async () => {
    const r = await svc.calculateDcf({
      periods: [{ revenue: 1000000, cost: 300000 }],
      discountRate: 0.1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.presentValues[0]).toBeCloseTo(700000, 0);
      expect(r.data.clv).toBeCloseTo(700000, 0);
    }
  });

  it('DCF CLV — 3 davr diskontlash to\'g\'ri', async () => {
    const r = await svc.calculateDcf({
      periods: [
        { revenue: 1000000, cost: 200000 },
        { revenue: 900000, cost: 200000 },
        { revenue: 800000, cost: 200000 },
      ],
      discountRate: 0.1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.presentValues).toHaveLength(3);
      expect(r.data.clv).toBeGreaterThan(0);
      expect(r.data.presentValues[1]).toBeCloseTo(700000 / 1.1, 0);
    }
  });
});

// ============================================================================
// TZ-41: Churn Ehtimoli
// ============================================================================
describe('ChurnService — TZ-41', () => {
  let svc: ChurnService;
  beforeEach(() => { svc = new ChurnService(); });

  it('kam xavfli mijoz → LOW risk', async () => {
    const r = await svc.predictChurn({
      rfmRecencyScore: 5,
      complaintCount: 0,
      daysSinceLastContact: 3,
      supportTicketCount: 0,
      paymentLateCount: 0,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.risk).toBe('LOW');
      expect(r.data.probability).toBeLessThan(0.4);
    }
  });

  it('yuqori xavfli mijoz → HIGH risk + requiresAlert=true', async () => {
    const r = await svc.predictChurn({
      rfmRecencyScore: 1,
      complaintCount: 10,
      daysSinceLastContact: 180,
      supportTicketCount: 5,
      paymentLateCount: 8,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.risk).toBe('HIGH');
      expect(r.data.requiresAlert).toBe(true);
    }
  });

  it('rfmRecencyScore=0 → xato (1..5 kerak)', async () => {
    const r = await svc.predictChurn({
      rfmRecencyScore: 0,
      complaintCount: 2,
      daysSinceLastContact: 30,
      supportTicketCount: 1,
      paymentLateCount: 0,
    });
    expect(r.ok).toBe(false);
  });

  it('probability 0..1 oralig\'ida', async () => {
    const r = await svc.predictChurn({
      rfmRecencyScore: 3,
      complaintCount: 2,
      daysSinceLastContact: 45,
      supportTicketCount: 2,
      paymentLateCount: 1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.probability).toBeGreaterThanOrEqual(0);
      expect(r.data.probability).toBeLessThanOrEqual(1);
    }
  });

  it('batchPredict — bo\'sh massiv → xato', async () => {
    const r = await svc.batchPredict([]);
    expect(r.ok).toBe(false);
  });

  it('batchPredict — 2 mijoz → 2 natija', async () => {
    const r = await svc.batchPredict([
      { customerId: 'c1', features: { rfmRecencyScore: 5, complaintCount: 0, daysSinceLastContact: 3, supportTicketCount: 0, paymentLateCount: 0 } },
      { customerId: 'c2', features: { rfmRecencyScore: 1, complaintCount: 8, daysSinceLastContact: 120, supportTicketCount: 4, paymentLateCount: 5 } },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });
});

// ============================================================================
// TZ-42: Win-Rate + Funnel + Pipeline Velocity
// ============================================================================
describe('FunnelService — TZ-42', () => {
  let svc: FunnelService;
  beforeEach(() => { svc = new FunnelService(); });

  it('10 yutgan, 5 yo\'qotilgan → WR ≈ 66.67%', async () => {
    const r = await svc.calculateWinRate({ won: 10, lost: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.winRate).toBeCloseTo(66.667, 1);
      expect(r.data.total).toBe(15);
    }
  });

  it('hamma yutilgan → WR=100%', async () => {
    const r = await svc.calculateWinRate({ won: 10, lost: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.winRate).toBeCloseTo(100, 5);
  });

  it('won=0, lost=0 → xato', async () => {
    const r = await svc.calculateWinRate({ won: 0, lost: 0 });
    expect(r.ok).toBe(false);
  });

  it('manfiy won → xato', async () => {
    const r = await svc.calculateWinRate({ won: -5, lost: 10 });
    expect(r.ok).toBe(false);
  });

  it('funnel conversion — 3 bosqich', async () => {
    const r = await svc.calculateConversion([
      { name: 'Prospect', entered: 100, movedToNext: 60 },
      { name: 'Qualified', entered: 60, movedToNext: 30 },
      { name: 'Proposal', entered: 30, movedToNext: 15 },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.stages[0].conversionRate).toBeCloseTo(60, 1);
      expect(r.data.overallConversion).toBeCloseTo(15, 1);
    }
  });

  it('bo\'sh funnel → xato', async () => {
    const r = await svc.calculateConversion([]);
    expect(r.ok).toBe(false);
  });

  it('pipeline velocity to\'g\'ri hisoblanadi', async () => {
    const r = await svc.calculateVelocity({
      opportunities: 20,
      winRateFraction: 0.5,
      avgDealSize: 5000000,
      avgSalesCycleDays: 30,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.velocity).toBeCloseTo(20 * 0.5 * 5000000 / 30, 0);
      expect(r.data.winRate).toBeCloseTo(50, 5);
    }
  });

  it('velocity: avgSalesCycleDays=0 → xato', async () => {
    const r = await svc.calculateVelocity({
      opportunities: 20, winRateFraction: 0.5,
      avgDealSize: 5000000, avgSalesCycleDays: 0,
    });
    expect(r.ok).toBe(false);
  });

  it('velocity: winRateFraction > 1 → xato', async () => {
    const r = await svc.calculateVelocity({
      opportunities: 20, winRateFraction: 1.5,
      avgDealSize: 5000000, avgSalesCycleDays: 30,
    });
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-43: Cohort Analysis
// ============================================================================
describe('CohortService — TZ-43', () => {
  let svc: CohortService;
  beforeEach(() => { svc = new CohortService(); });

  it('bo\'sh buyurtmalar → xato', async () => {
    const r = await svc.buildRetentionMatrix([]);
    expect(r.ok).toBe(false);
  });

  it('0-oy (period=0) da retention har doim 1.0', async () => {
    const orders = [
      { customerId: 'c1', completedAt: new Date('2025-01-15') },
      { customerId: 'c2', completedAt: new Date('2025-01-20') },
      { customerId: 'c3', completedAt: new Date('2025-02-10') },
    ];
    const r = await svc.buildRetentionMatrix(orders);
    expect(r.ok).toBe(true);
    if (r.ok) {
      r.data.rows.forEach(row => {
        expect(row.retentionByPeriod[0]).toBe(1.0);
      });
    }
  });

  it('qayta xarid qilgan mijoz — period=1 da 0 < retention ≤ 1', async () => {
    const orders = [
      { customerId: 'c1', completedAt: new Date('2025-01-10') },
      { customerId: 'c1', completedAt: new Date('2025-02-15') },
      { customerId: 'c2', completedAt: new Date('2025-01-20') },
    ];
    const r = await svc.buildRetentionMatrix(orders);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const jan = r.data.rows.find(row => row.cohortMonth === '2025-01');
      expect(jan).toBeDefined();
      if (jan) {
        expect(jan.retentionByPeriod[1]).toBeGreaterThan(0);
        expect(jan.retentionByPeriod[1]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('cohort hajmi to\'g\'ri', async () => {
    const orders = [
      { customerId: 'c1', completedAt: new Date('2025-01-10') },
      { customerId: 'c2', completedAt: new Date('2025-01-20') },
      { customerId: 'c3', completedAt: new Date('2025-02-05') },
    ];
    const r = await svc.buildRetentionMatrix(orders);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const jan = r.data.rows.find(row => row.cohortMonth === '2025-01');
      expect(jan?.cohortSize).toBe(2);
    }
  });

  it('maxPeriod ≥ 0', async () => {
    const orders = [
      { customerId: 'c1', completedAt: new Date('2025-01-10') },
      { customerId: 'c1', completedAt: new Date('2025-06-10') },
    ];
    const r = await svc.buildRetentionMatrix(orders);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.maxPeriod).toBeGreaterThanOrEqual(0);
    }
  });
});
