/**
 * @module marketing-roi.service.spec
 * @description Unit tests for MarketingRoiService.
 *
 * All tests are pure (no DB, no HTTP, no DI container).
 * Instantiate MarketingRoiService directly to keep tests fast and isolated.
 *
 * Coverage targets:
 *   roi()
 *     ✓ profit scenario (revenue > spend)
 *     ✓ loss scenario (revenue < spend)
 *     ✓ break-even (revenue === spend → ROI% = 0)
 *     ✓ spend = 0 → Err (VALIDATION)
 *     ✓ spend < 0 → Err (VALIDATION)
 *     ✓ spend = NaN → Err (VALIDATION)
 *     ✓ spend = Infinity → Err (VALIDATION)
 *     ✓ revenue = NaN → Err (VALIDATION)
 *     ✓ revenue = -Infinity → Err (VALIDATION)
 *     ✓ formula correctness: (rev-spend)/spend*100 and ratio=rev/spend
 *
 *   channelEffectiveness()
 *     ✓ single channel: ROI + CAC computed correctly
 *     ✓ 8-channel set: best/worst ranking
 *     ✓ channel with spend=0 → roiPct/ratio=null (not an error)
 *     ✓ channel with conversions=0 → cac=null (not an error)
 *     ✓ empty array → Err (VALIDATION)
 *     ✓ non-finite spend in array → Err (VALIDATION)
 *     ✓ non-finite revenue in array → Err (VALIDATION)
 *     ✓ non-finite conversions in array → Err (VALIDATION)
 *     ✓ isCanonical flag correct for canonical vs non-canonical channel
 *     ✓ aggregateRoiPct computed across all channels
 *     ✓ ranking: highest ROI first, nulls last
 *
 *   classifyRoi()
 *     ✓ above threshold → 'high'
 *     ✓ at break-even → 'break-even'
 *     ✓ below break-even → 'loss'
 *     ✓ null → 'unknown'
 *
 *   configurable thresholds
 *     ✓ custom config overrides defaults without affecting formula
 */

import { MarketingRoiService } from '../../src/modules/marketing/application/marketing-roi.service';
import type { ChannelInput } from '../../src/modules/marketing/application/marketing-roi.service';
import { MKT_CHANNELS, MKT_ROI_DEFAULT_CONFIG } from '../../src/modules/marketing/application/marketing-roi.constants';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Build a minimal valid ChannelInput. */
function ch(
  channel: string,
  spend: number,
  revenue: number,
  conversions: number,
): ChannelInput {
  return { channel: channel as ChannelInput['channel'], spend, revenue, conversions };
}

// ─── roi() ─────────────────────────────────────────────────────────────────

describe('MarketingRoiService.roi()', () => {
  let svc: MarketingRoiService;

  beforeEach(() => {
    svc = new MarketingRoiService();
  });

  // ── Happy-path math ───────────────────────────────────────────────────

  it('profit scenario: revenue > spend → positive ROI%', () => {
    const result = svc.roi(1000, 3000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // (3000 - 1000) / 1000 * 100 = 200%
    expect(result.data.roiPct).toBe(200);
    // 3000 / 1000 = 3
    expect(result.data.ratio).toBe(3);
    expect(result.data.profitAbsolute).toBe(2000);
    expect(result.data.spend).toBe(1000);
    expect(result.data.revenue).toBe(3000);
  });

  it('loss scenario: revenue < spend → negative ROI%', () => {
    const result = svc.roi(2000, 500);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // (500 - 2000) / 2000 * 100 = -75%
    expect(result.data.roiPct).toBe(-75);
    // 500 / 2000 = 0.25
    expect(result.data.ratio).toBe(0.25);
    expect(result.data.profitAbsolute).toBe(-1500);
  });

  it('break-even: revenue === spend → ROI% = 0, ratio = 1', () => {
    const result = svc.roi(500, 500);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.roiPct).toBe(0);
    expect(result.data.ratio).toBe(1);
    expect(result.data.profitAbsolute).toBe(0);
  });

  it('revenue = 0 (total campaign failure) → ROI% = -100%', () => {
    const result = svc.roi(1000, 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.roiPct).toBe(-100);
    expect(result.data.ratio).toBe(0);
  });

  it('fractional spend and revenue → rounds to 2dp (roiPct) and 4dp (ratio)', () => {
    // (1 - 3) / 3 * 100 = -66.666...% → -66.67
    const result = svc.roi(3, 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.roiPct).toBe(-66.67);
    // 1/3 = 0.3333... → 0.3333
    expect(result.data.ratio).toBe(0.3333);
  });

  // ── Spend guard ───────────────────────────────────────────────────────

  it('spend = 0 → Err VALIDATION (division guard)', () => {
    const result = svc.roi(0, 1000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toMatch(/spend must be greater than/i);
  });

  it('spend < 0 → Err VALIDATION', () => {
    const result = svc.roi(-100, 1000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  it('spend = NaN → Err VALIDATION', () => {
    const result = svc.roi(NaN, 1000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toMatch(/finite/i);
  });

  it('spend = Infinity → Err VALIDATION', () => {
    const result = svc.roi(Infinity, 1000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  it('spend = -Infinity → Err VALIDATION', () => {
    const result = svc.roi(-Infinity, 1000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  // ── Revenue guard ─────────────────────────────────────────────────────

  it('revenue = NaN → Err VALIDATION', () => {
    const result = svc.roi(1000, NaN);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toMatch(/finite/i);
  });

  it('revenue = -Infinity → Err VALIDATION', () => {
    const result = svc.roi(1000, -Infinity);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  it('revenue = Infinity → Err VALIDATION', () => {
    const result = svc.roi(1000, Infinity);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  // ── Large numbers ─────────────────────────────────────────────────────

  it('large realistic values (1 billion spend, 3 billion revenue) → ok', () => {
    const result = svc.roi(1_000_000_000, 3_000_000_000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.roiPct).toBe(200);
  });
});

// ─── channelEffectiveness() ────────────────────────────────────────────────

describe('MarketingRoiService.channelEffectiveness()', () => {
  let svc: MarketingRoiService;

  beforeEach(() => {
    svc = new MarketingRoiService();
  });

  // ── Single channel ────────────────────────────────────────────────────

  it('single channel: computes ROI%, ratio, and CAC correctly', () => {
    const result = svc.channelEffectiveness([ch('instagram', 500, 1500, 10)]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { channels, best, worst } = result.data;
    expect(channels).toHaveLength(1);

    const ig = channels[0];
    // ROI = (1500 - 500) / 500 * 100 = 200%
    expect(ig.roiPct).toBe(200);
    // ratio = 1500 / 500 = 3
    expect(ig.ratio).toBe(3);
    // CAC = 500 / 10 = 50
    expect(ig.cac).toBe(50);
    expect(ig.isCanonical).toBe(true);

    // With one channel best === worst (same object)
    expect(best).toEqual(ig);
    expect(worst).toEqual(ig);
  });

  // ── 8-channel ranking ─────────────────────────────────────────────────

  it('8 canonical channels ranked best→worst by roiPct', () => {
    const inputs: ChannelInput[] = [
      ch('instagram',       1000,  4000, 20),   // ROI = 300%
      ch('telegram',        2000,  3000, 15),   // ROI = 50%
      ch('facebook',         500,   400, 5),    // ROI = -20%
      ch('veb-sayt',         800,  2000, 10),   // ROI = 150%
      ch('korgabma',        3000,  6000, 30),   // ROI = 100%
      ch('sovuq-qongiroq',  1500,  1500, 8),    // ROI = 0% (break-even)
      ch('tavsiya',          200,  1000, 12),   // ROI = 400%
      ch('vositachi-diler', 2500,  3000, 18),   // ROI = 20%
    ];

    const result = svc.channelEffectiveness(inputs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { channels, best, worst } = result.data;
    expect(channels).toHaveLength(8);

    // Best = tavsiya (ROI 400%)
    expect(best?.channel).toBe('tavsiya');
    expect(best?.roiPct).toBe(400);

    // Worst = facebook (ROI -20%)
    expect(worst?.channel).toBe('facebook');
    expect(worst?.roiPct).toBe(-20);

    // All channels are canonical
    channels.forEach((c) => expect(c.isCanonical).toBe(true));

    // Ranking is descending by roiPct
    const pcts = channels
      .map((c) => c.roiPct)
      .filter((p): p is number => p !== null);
    for (let i = 0; i < pcts.length - 1; i++) {
      expect(pcts[i]).toBeGreaterThanOrEqual(pcts[i + 1]);
    }
  });

  // ── CAC correctness ───────────────────────────────────────────────────

  it('CAC = spend / conversions (EP-MKT-053)', () => {
    const result = svc.channelEffectiveness([ch('telegram', 3000, 9000, 25)]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // CAC = 3000 / 25 = 120
    expect(result.data.channels[0].cac).toBe(120);
  });

  // ── Division guards per channel ───────────────────────────────────────

  it('channel with spend=0 → roiPct=null, ratio=null (not an error)', () => {
    const result = svc.channelEffectiveness([ch('facebook', 0, 1000, 5)]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fb = result.data.channels[0];
    expect(fb.roiPct).toBeNull();
    expect(fb.ratio).toBeNull();
    // CAC can still be computed if conversions > 0? No: spend=0 → CAC=0, valid.
    // spend/conversions = 0/5 = 0
    expect(fb.cac).toBe(0);
  });

  it('channel with conversions=0 → cac=null (not an error)', () => {
    const result = svc.channelEffectiveness([ch('instagram', 500, 1000, 0)]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ig = result.data.channels[0];
    expect(ig.cac).toBeNull();
    // ROI is still computable since spend > 0
    expect(ig.roiPct).toBe(100);
  });

  it('all channels spend=0 → aggregateRoiPct=null', () => {
    const result = svc.channelEffectiveness([
      ch('instagram', 0, 500, 0),
      ch('telegram',  0, 300, 0),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.aggregateRoiPct).toBeNull();
    expect(result.data.best).toBeNull();
    expect(result.data.worst).toBeNull();
  });

  // ── Aggregate metrics ─────────────────────────────────────────────────

  it('aggregateRoiPct computed across all channels', () => {
    const inputs: ChannelInput[] = [
      ch('instagram', 1000, 2000, 10),  // profit 1000
      ch('telegram',  1000,  500, 5),   // loss   -500
    ];
    // total spend = 2000, total revenue = 2500
    // aggregate ROI = (2500 - 2000) / 2000 * 100 = 25%
    const result = svc.channelEffectiveness(inputs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.totalSpend).toBe(2000);
    expect(result.data.totalRevenue).toBe(2500);
    expect(result.data.totalConversions).toBe(15);
    expect(result.data.aggregateRoiPct).toBe(25);
  });

  // ── Validation errors ─────────────────────────────────────────────────

  it('empty array → Err VALIDATION', () => {
    const result = svc.channelEffectiveness([]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  it('non-array input (null) → Err VALIDATION', () => {
    const result = svc.channelEffectiveness(null as unknown as ChannelInput[]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  it('channel with NaN spend → Err VALIDATION at that index', () => {
    const result = svc.channelEffectiveness([
      ch('instagram', 500, 1000, 5),
      ch('telegram',  NaN, 1000, 5),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toMatch(/channels\[1\]\.spend/);
  });

  it('channel with Infinity revenue → Err VALIDATION', () => {
    const result = svc.channelEffectiveness([ch('instagram', 500, Infinity, 5)]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toMatch(/revenue/i);
  });

  it('channel with NaN conversions → Err VALIDATION', () => {
    const result = svc.channelEffectiveness([ch('facebook', 500, 1000, NaN)]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
    expect(result.error.message).toMatch(/conversions/i);
  });

  // ── isCanonical flag ──────────────────────────────────────────────────

  it('non-canonical channel → isCanonical=false', () => {
    const result = svc.channelEffectiveness([ch('tiktok', 100, 200, 3)]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.channels[0].isCanonical).toBe(false);
  });

  it('boshqa (other) channel → isCanonical=false (not in the 8)', () => {
    const result = svc.channelEffectiveness([ch('boshqa', 100, 200, 3)]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.channels[0].isCanonical).toBe(false);
  });

  it('all 8 canonical channel identifiers are recognised', () => {
    const inputs = MKT_CHANNELS.map((name) =>
      ch(name, 1000, 2000, 10),
    );
    const result = svc.channelEffectiveness(inputs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.data.channels.forEach((c) =>
      expect(c.isCanonical).toBe(true),
    );
  });

  // ── Nulls-last ranking ────────────────────────────────────────────────

  it('channels with null roiPct rank after channels with values', () => {
    const inputs: ChannelInput[] = [
      ch('instagram', 0,    500, 5),  // spend=0 → roiPct=null
      ch('telegram',  1000, 200, 5),  // ROI = -80%
      ch('facebook',  500,  2000, 5), // ROI = 300%
    ];
    const result = svc.channelEffectiveness(inputs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const channels = result.data.channels;
    // First two must be non-null ROI (300%, -80%), last must be null
    expect(channels[0].roiPct).toBe(300);
    expect(channels[1].roiPct).toBe(-80);
    expect(channels[2].roiPct).toBeNull();
  });
});

// ─── classifyRoi() ─────────────────────────────────────────────────────────

describe('MarketingRoiService.classifyRoi()', () => {
  it('null → unknown', () => {
    const svc = new MarketingRoiService();
    expect(svc.classifyRoi(null)).toBe('unknown');
  });

  it('exactly at high threshold → high', () => {
    const svc = new MarketingRoiService();
    // default high = 100%
    expect(svc.classifyRoi(MKT_ROI_DEFAULT_CONFIG.roiHighPerformingPct)).toBe('high');
  });

  it('above high threshold → high', () => {
    const svc = new MarketingRoiService();
    expect(svc.classifyRoi(300)).toBe('high');
  });

  it('at break-even (0%) → break-even', () => {
    const svc = new MarketingRoiService();
    expect(svc.classifyRoi(0)).toBe('break-even');
  });

  it('between break-even and high → break-even', () => {
    const svc = new MarketingRoiService();
    expect(svc.classifyRoi(50)).toBe('break-even');
  });

  it('below break-even → loss', () => {
    const svc = new MarketingRoiService();
    expect(svc.classifyRoi(-1)).toBe('loss');
    expect(svc.classifyRoi(-100)).toBe('loss');
  });
});

// ─── Configurable thresholds ───────────────────────────────────────────────

describe('MarketingRoiService — custom config', () => {
  it('custom roiHighPerformingPct overrides default for classifyRoi', () => {
    const svc = new MarketingRoiService({ roiHighPerformingPct: 50 });
    // 60% is above custom threshold of 50 → high
    expect(svc.classifyRoi(60)).toBe('high');
    // 60% would be break-even under default (100), not high
    const defaultSvc = new MarketingRoiService();
    expect(defaultSvc.classifyRoi(60)).toBe('break-even');
  });

  it('custom config does NOT affect the roi() formula calculation', () => {
    const svc = new MarketingRoiService({ roiHighPerformingPct: 999 });
    const result = svc.roi(100, 300);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // (300 - 100) / 100 * 100 = 200% — unaffected by threshold config
    expect(result.data.roiPct).toBe(200);
  });

  it('partial config: only override one field, others use defaults', () => {
    const svc = new MarketingRoiService({ attributionWindowDays: 60 });
    // Break-even and high thresholds are from defaults
    expect(svc.classifyRoi(100)).toBe('high');
    expect(svc.classifyRoi(-1)).toBe('loss');
  });
});
