/**
 * test/marketing/lead-score-constants.spec.ts
 *
 * Marketing A4 (vision 14-marketing): the lead-score recompute weights were magic
 * numbers inline in recalculateLeadScores' UPDATE (base 30 + channel 10 + status
 * 15/8/3, cap 100). They now live in business.constants.ts as LEAD_SCORE (Qoida 12).
 * This pins the values so an accidental edit is caught — they drive the lead-warmth
 * funnel and must not change without an owner decision.
 */

import { LEAD_SCORE } from '../../src/common/constants/business.constants';

describe('LEAD_SCORE weights (Marketing A4 — values pinned)', () => {
  it('matches the recalculateLeadScores formula exactly', () => {
    expect(LEAD_SCORE.base).toBe(30);
    expect(LEAD_SCORE.max).toBe(100);
    expect(LEAD_SCORE.channelBonus).toBe(10);
    expect(LEAD_SCORE.statusHot).toBe(15);
    expect(LEAD_SCORE.statusWarm).toBe(8);
    expect(LEAD_SCORE.statusNew).toBe(3);
  });

  it('computes a hot + organic lead to 55 (base + channel + hot)', () => {
    const score = Math.min(
      LEAD_SCORE.max,
      LEAD_SCORE.base + LEAD_SCORE.channelBonus + LEAD_SCORE.statusHot,
    );
    expect(score).toBe(55);
  });
});
