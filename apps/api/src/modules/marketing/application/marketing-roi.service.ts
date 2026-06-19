/**
 * @module marketing-roi.service
 * @description Pure, unit-testable Marketing ROI calculation engine.
 *
 * Implements:
 *   - roi()                → EP-MKT-051 profit-based ROI formula
 *   - channelEffectiveness() → per-channel ROI + CAC + ranked best/worst
 *                             for the owner-decided 8 channels (EP-MKT-031)
 *
 * Design contract:
 *   - PURE inputs → deterministic outputs (no DB, no HTTP, no EventEmitter).
 *   - Every failure path returns Result.Err — never throws.
 *   - All thresholds are configurable via MarketingRoiConfig (injected or
 *     default); no magic numbers in formula logic.
 *   - All division operations are guarded; NaN / Infinity never escapes.
 *
 * EP codes: EP-MKT-051, EP-MKT-052, EP-MKT-053, EP-MKT-031.
 */

import { Injectable, Optional } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  MKT_CHANNELS,
  MKT_CHANNEL_OTHER,
  MKT_MIN_SPEND_EXCLUSIVE,
  MKT_MIN_CONVERSIONS_EXCLUSIVE,
  MKT_ROI_DEFAULT_CONFIG,
  MarketingRoiConfig,
  MktChannel,
} from './marketing-roi.constants';

// ─── Public DTOs ──────────────────────────────────────────────────────────

/** Success payload of roi(). */
export interface RoiResult {
  /** EP-MKT-051: (revenue − spend) / spend × 100. Negative means loss. */
  roiPct: number;
  /** Revenue-to-spend ratio: revenue / spend. 1.0 = break-even. */
  ratio: number;
  /** Marketing spend used in the calculation. */
  spend: number;
  /** Revenue (profit from campaign sales) used in the calculation. */
  revenue: number;
  /** Absolute profit/loss: revenue − spend. */
  profitAbsolute: number;
}

/** Per-channel input record for channelEffectiveness(). */
export interface ChannelInput {
  /**
   * One of the 8 canonical channels or 'boshqa'.
   * EP-MKT-031 owner override.
   */
  channel: MktChannel | typeof MKT_CHANNEL_OTHER | string;
  /**
   * Total spend allocated to this channel in the period.
   * Must be > 0 for ROI and CAC to be computed.
   */
  spend: number;
  /**
   * Revenue / profit from sales attributed to this channel.
   * EP-MKT-051: this is the profit figure (sotuv foydasi), not gross revenue.
   */
  revenue: number;
  /**
   * Number of leads converted to paying customers via this channel.
   * EP-MKT-053: used for CAC = spend / conversions.
   * Must be > 0 for CAC to be computed.
   */
  conversions: number;
}

/** Per-channel result record. */
export interface ChannelEffectivenessResult {
  channel: string;
  spend: number;
  revenue: number;
  conversions: number;
  /**
   * EP-MKT-051 ROI% for this channel.
   * null when spend <= 0 (division guard).
   */
  roiPct: number | null;
  /**
   * Revenue-to-spend ratio for this channel.
   * null when spend <= 0.
   */
  ratio: number | null;
  /**
   * EP-MKT-053 CAC (cost per acquired customer): spend / conversions.
   * null when conversions <= 0 (division guard).
   */
  cac: number | null;
  /** Whether this channel is one of the owner-decided 8. */
  isCanonical: boolean;
}

/** Success payload of channelEffectiveness(). */
export interface ChannelEffectivenessSummary {
  channels: ChannelEffectivenessResult[];
  /** Channel with the highest ROI%, or null if none are computable. */
  best: ChannelEffectivenessResult | null;
  /** Channel with the lowest ROI% (including negative), or null. */
  worst: ChannelEffectivenessResult | null;
  /** Total spend across all channels. */
  totalSpend: number;
  /** Total revenue across all channels. */
  totalRevenue: number;
  /** Total conversions across all channels. */
  totalConversions: number;
  /** Aggregate ROI% across all channels (null if totalSpend <= 0). */
  aggregateRoiPct: number | null;
}

// ─── Service ──────────────────────────────────────────────────────────────

@Injectable()
export class MarketingRoiService {
  private readonly cfg: MarketingRoiConfig;

  /**
   * @param config - Optional override for thresholds/defaults.
   *   Pass a partial object; missing fields fall back to MKT_ROI_DEFAULT_CONFIG.
   *   In NestJS context this is normally not injected (service uses defaults);
   *   tests can pass a custom config directly to the constructor.
   */
  constructor(@Optional() config?: Partial<MarketingRoiConfig>) {
    this.cfg = { ...MKT_ROI_DEFAULT_CONFIG, ...config };
  }

  // ─── roi() ──────────────────────────────────────────────────────────────

  /**
   * Compute profit-based ROI for a single campaign or channel.
   *
   * Formula (EP-MKT-051):
   *   ROI% = (revenue − spend) / spend × 100
   *   ratio = revenue / spend
   *
   * Guards:
   *   - spend <= 0           → Err (VALIDATION): division-by-zero / nonsensical
   *   - revenue is NaN/Inf   → Err (VALIDATION)
   *   - spend is NaN/Inf     → Err (VALIDATION)
   *   - result is NaN/Inf    → Err (INTERNAL): should not happen after guards
   *
   * @param spend   - Marketing expenditure (must be > 0).
   * @param revenue - Profit from sales attributed to this campaign/channel.
   *                  May be negative (total loss scenario).
   * @returns Result<RoiResult>
   */
  roi(spend: number, revenue: number): Result<RoiResult> {
    // Guard: inputs must be finite numbers
    if (!Number.isFinite(spend)) {
      return Err(AppErr('VALIDATION', 'spend must be a finite number', { spend }));
    }
    if (!Number.isFinite(revenue)) {
      return Err(AppErr('VALIDATION', 'revenue must be a finite number', { revenue }));
    }

    // Guard: spend must be > 0 (EP-MKT-051 requires a divisor)
    if (spend <= MKT_MIN_SPEND_EXCLUSIVE) {
      return Err(
        AppErr(
          'VALIDATION',
          `spend must be greater than ${MKT_MIN_SPEND_EXCLUSIVE}; received ${spend}`,
          { spend },
        ),
      );
    }

    const profitAbsolute = revenue - spend;
    const roiPct = (profitAbsolute / spend) * 100;
    const ratio = revenue / spend;

    // Paranoia guard: result must not be NaN or Infinite after valid inputs
    if (!Number.isFinite(roiPct) || !Number.isFinite(ratio)) {
      return Err(
        AppErr('INTERNAL', 'ROI computation produced a non-finite result', {
          spend,
          revenue,
          roiPct,
          ratio,
        }),
      );
    }

    return Ok<RoiResult>({
      roiPct: MarketingRoiService.round2(roiPct),
      ratio: MarketingRoiService.round4(ratio),
      spend,
      revenue,
      profitAbsolute: MarketingRoiService.round2(profitAbsolute),
    });
  }

  // ─── channelEffectiveness() ─────────────────────────────────────────────

  /**
   * Compute per-channel ROI, CAC, and ranking for up to N channels.
   *
   * Per-channel formulas:
   *   ROI%  (EP-MKT-051): (revenue − spend) / spend × 100
   *   ratio (EP-MKT-051): revenue / spend
   *   CAC   (EP-MKT-053): spend / conversions
   *
   * Ranking: by roiPct descending (channels with null roiPct rank last).
   *
   * Guards:
   *   - Empty channels array → Err (VALIDATION)
   *   - Individual channel spend <= 0 → roiPct/ratio = null (not an error)
   *   - Individual channel conversions <= 0 → cac = null (not an error)
   *   - channel.spend or .revenue non-finite → Err (VALIDATION)
   *
   * @param channels - Array of ChannelInput records (one per channel).
   * @returns Result<ChannelEffectivenessSummary>
   */
  channelEffectiveness(
    channels: ChannelInput[],
  ): Result<ChannelEffectivenessSummary> {
    if (!Array.isArray(channels) || channels.length === 0) {
      return Err(
        AppErr('VALIDATION', 'channels array must be non-empty', {
          received: channels,
        }),
      );
    }

    // Validate each entry and compute per-channel metrics
    const results: ChannelEffectivenessResult[] = [];

    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];

      if (!Number.isFinite(ch.spend)) {
        return Err(
          AppErr('VALIDATION', `channels[${i}].spend is not a finite number`, {
            channel: ch.channel,
            spend: ch.spend,
          }),
        );
      }
      if (!Number.isFinite(ch.revenue)) {
        return Err(
          AppErr('VALIDATION', `channels[${i}].revenue is not a finite number`, {
            channel: ch.channel,
            revenue: ch.revenue,
          }),
        );
      }
      if (!Number.isFinite(ch.conversions)) {
        return Err(
          AppErr(
            'VALIDATION',
            `channels[${i}].conversions is not a finite number`,
            { channel: ch.channel, conversions: ch.conversions },
          ),
        );
      }

      const roiPct =
        ch.spend > MKT_MIN_SPEND_EXCLUSIVE
          ? MarketingRoiService.round2(((ch.revenue - ch.spend) / ch.spend) * 100)
          : null;

      const ratio =
        ch.spend > MKT_MIN_SPEND_EXCLUSIVE
          ? MarketingRoiService.round4(ch.revenue / ch.spend)
          : null;

      const cac =
        ch.conversions > MKT_MIN_CONVERSIONS_EXCLUSIVE
          ? MarketingRoiService.round2(ch.spend / ch.conversions)
          : null;

      results.push({
        channel: String(ch.channel),
        spend: ch.spend,
        revenue: ch.revenue,
        conversions: ch.conversions,
        roiPct,
        ratio,
        cac,
        isCanonical: (MKT_CHANNELS as readonly string[]).includes(
          String(ch.channel),
        ),
      });
    }

    // Rank by roiPct descending (nulls last)
    const ranked = [...results].sort((a, b) => {
      if (a.roiPct === null && b.roiPct === null) return 0;
      if (a.roiPct === null) return 1;
      if (b.roiPct === null) return -1;
      return b.roiPct - a.roiPct;
    });

    const computable = ranked.filter((r) => r.roiPct !== null);
    const best = computable.length > 0 ? computable[0] : null;
    const worst =
      computable.length > 0 ? computable[computable.length - 1] : null;

    const totalSpend = results.reduce((s, r) => s + r.spend, 0);
    const totalRevenue = results.reduce((s, r) => s + r.revenue, 0);
    const totalConversions = results.reduce((s, r) => s + r.conversions, 0);

    const aggregateRoiPct =
      totalSpend > MKT_MIN_SPEND_EXCLUSIVE
        ? MarketingRoiService.round2(
            ((totalRevenue - totalSpend) / totalSpend) * 100,
          )
        : null;

    return Ok<ChannelEffectivenessSummary>({
      channels: ranked,
      best,
      worst,
      totalSpend: MarketingRoiService.round2(totalSpend),
      totalRevenue: MarketingRoiService.round2(totalRevenue),
      totalConversions,
      aggregateRoiPct,
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  /**
   * Classify a channel result according to the configured thresholds.
   * Returns a human-readable label; used for reporting / FE badges.
   */
  classifyRoi(roiPct: number | null): 'high' | 'break-even' | 'loss' | 'unknown' {
    if (roiPct === null) return 'unknown';
    if (roiPct >= this.cfg.roiHighPerformingPct) return 'high';
    if (roiPct >= this.cfg.roiBreakevenPct) return 'break-even';
    return 'loss';
  }

  // ─── Private static math helpers ────────────────────────────────────────

  /** Round to 2 decimal places (monetary / percentage). */
  private static round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /** Round to 4 decimal places (ratios). */
  private static round4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }
}
