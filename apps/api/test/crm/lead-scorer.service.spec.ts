/**
 * lead-scorer.service.spec.ts
 *
 * Unit tests for LeadScorerService (pure domain compute, no I/O). All math
 * paths (contact, budget tiers, source, interactions, firmographics,
 * freshness) and tier classification run for real.
 *
 * Note: scoreFreshness defaults daysSinceCreated to 0, which scores +5 for the
 * "≤ 7 days" branch — so even empty input includes the freshness contribution.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  LeadScorerService,
  LeadScoreInput,
} from '../../src/modules/crm/domain/services/lead-scorer.service';

describe('LeadScorerService', () => {
  let svc: LeadScorerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadScorerService],
    }).compile();
    svc = module.get(LeadScorerService);
  });

  it('returns cold tier when input is empty', () => {
    const r = svc.calculateScore({});
    expect(r.ok).toBe(true);
    if (r.ok) {
      // Empty input still gets +5 from default freshness (daysSinceCreated ?? 0 → ≤7)
      expect(r.data.score).toBe(5);
      expect(r.data.tier).toBe('cold');
    }
  });

  it('returns hot tier when input is fully populated and high budget', () => {
    const input: LeadScoreInput = {
      email: 'a@x.com',
      phone: '+998',
      company: 'Acme',
      budget: 200_000_000,
      source: 'referral',
      interactionCount: 6,
      hasWebsite: true,
      employeeCount: 100,
      daysSinceCreated: 3,
    };
    const r = svc.calculateScore(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.score).toBe(100);
      expect(r.data.tier).toBe('hot');
    }
  });

  it('returns warm tier for mid-range score', () => {
    const r = svc.calculateScore({
      email: 'a@x.com',
      phone: '+998',
      company: 'Acme',
      budget: 12_000_000,
      interactionCount: 2,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.tier).toBe('warm');
      expect(r.data.score).toBeGreaterThanOrEqual(40);
      expect(r.data.score).toBeLessThan(70);
    }
  });

  it('applies budget tier 25 when budget exactly at 100M', () => {
    // Only budget + freshness(+5 default) = 30
    const r = svc.calculateScore({ budget: 100_000_000 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.score).toBe(30);
  });

  it('applies budget tier 15 when budget between 10M and 100M', () => {
    const r = svc.calculateScore({ budget: 50_000_000 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.score).toBe(20); // 15 + 5 freshness
  });

  it('applies budget tier 5 when budget below 10M', () => {
    const r = svc.calculateScore({ budget: 5_000_000 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.score).toBe(10); // 5 + 5 freshness
  });

  it('penalises stale leads (60+ days) but clamps score to 0', () => {
    const r = svc.calculateScore({ daysSinceCreated: 90 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.score).toBe(0); // -10 clamped to 0
  });

  it('rewards interactionCount tier 15 when at threshold of 5', () => {
    const r = svc.calculateScore({ interactionCount: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.score).toBe(20); // 15 + 5 freshness
  });

  it('rewards source referral with 20 points', () => {
    const r = svc.calculateScore({ source: 'referral' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.score).toBe(25); // 20 + 5 freshness
  });

  it('ignores unknown source', () => {
    const r = svc.calculateScore({ source: 'unknown' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.score).toBe(5); // only freshness default
  });
});
