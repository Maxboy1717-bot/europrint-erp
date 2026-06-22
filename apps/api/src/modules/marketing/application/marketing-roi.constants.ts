/**
 * @module marketing-roi.constants
 * @description Configurable thresholds and defaults for the Marketing ROI
 * calculation engine.  ALL magic numbers live here — formula logic in
 * MarketingRoiService must reference these constants and never embed raw
 * literals.
 *
 * EP-MKT-031 (owner override): exactly 8 canonical channels + "boshqa".
 * EP-MKT-051 (owner override): profit-based ROI formula.
 * EP-MKT-052: CPL = channel spend / lead count.
 * EP-MKT-053: CAC = period spend / new-customer count.
 *
 * To override defaults in production: pass an explicit MarketingRoiConfig
 * object to MarketingRoiService.  Never patch this file at runtime — create
 * a new constants file or supply the config via dependency injection.
 */

// ─── Channel master-data ───────────────────────────────────────────────────

/**
 * EP-MKT-031 canonical 8-channel list (owner override).
 * The string values are used as canonical channel identifiers throughout the
 * service; changing them is a breaking change — treat as an enum.
 */
export const MKT_CHANNELS = [
  'instagram',
  'telegram',
  'facebook',
  'veb-sayt',
  'korgabma',      // ko'rgazma / exhibition
  'sovuq-qongiroq', // sovuq qo'ng'iroq / cold call
  'tavsiya',        // referral
  'vositachi-diler', // intermediary / dealer
] as const;

export type MktChannel = typeof MKT_CHANNELS[number];

/** Fallback channel code for leads whose source is not one of the 8. */
export const MKT_CHANNEL_OTHER = 'boshqa' as const;

/**
 * Alias map: raw channel identifiers seen in the live data
 * (marketing_ads.platform / marketing_leads.source) → canonical EP-MKT-031 code.
 *
 * Lookup keys are lower-cased. Only DETERMINISTIC, semantically-unambiguous
 * aliases live here (e.g. the English 'website' is the same channel as the
 * canonical 'veb-sayt'). Raw values that are NOT a canonical channel and have
 * no documented equivalent (google / tiktok / youtube / email ...) are NOT
 * forced into a canonical bucket — normalizeChannel() returns them unchanged so
 * channelEffectiveness() reports them honestly (isCanonical=false) rather than
 * fabricating a mapping the owner has not decided (EP-MKT-031 list is owner-set).
 */
export const MKT_CHANNEL_ALIASES: Readonly<Record<string, MktChannel>> = {
  website: 'veb-sayt',
  'veb-sayt': 'veb-sayt',
  vebsayt: 'veb-sayt',
  web: 'veb-sayt',
  exhibition: 'korgabma',
  korgazma: 'korgabma',
  'ko\'rgazma': 'korgabma',
  referral: 'tavsiya',
  tavsiya: 'tavsiya',
  'cold-call': 'sovuq-qongiroq',
  coldcall: 'sovuq-qongiroq',
  dealer: 'vositachi-diler',
  'vositachi-diler': 'vositachi-diler',
  instagram: 'instagram',
  telegram: 'telegram',
  facebook: 'facebook',
} as const;

/**
 * Normalize a raw channel identifier (from ads.platform / leads.source) into its
 * canonical EP-MKT-031 code when a documented alias exists; otherwise returns the
 * lower-cased raw value unchanged (kept honest, never invented).
 * Null/empty input → MKT_CHANNEL_OTHER ('boshqa').
 */
export function normalizeChannel(raw: string | null | undefined): string {
  const key = String(raw ?? '').trim().toLowerCase();
  if (key.length === 0) return MKT_CHANNEL_OTHER;
  return MKT_CHANNEL_ALIASES[key] ?? key;
}

// ─── ROI thresholds ────────────────────────────────────────────────────────

/**
 * Minimum acceptable ROI% below which a channel is considered loss-making.
 * Used only for classification / reporting — the formula itself is
 * threshold-agnostic.  Default: 0 % (break-even).
 */
export const MKT_ROI_BREAKEVEN_PCT = 0;

/**
 * ROI% that marks a channel as "high-performing" (for ranking labels).
 * Default: 100 % (campaign revenue doubled the spend).
 */
export const MKT_ROI_HIGH_PERFORMING_PCT = 100;

// ─── Numeric guards ────────────────────────────────────────────────────────

/**
 * Smallest allowed spend value (exclusive lower bound).
 * spend must be strictly greater than this to avoid division-by-zero.
 * Value: 0 (i.e., spend must be > 0).
 */
export const MKT_MIN_SPEND_EXCLUSIVE = 0;

/**
 * Smallest allowed conversions count (exclusive lower bound) for CAC.
 * conversions must be strictly greater than this.
 */
export const MKT_MIN_CONVERSIONS_EXCLUSIVE = 0;

// ─── Attribution ──────────────────────────────────────────────────────────

/**
 * EP-MKT-055 (A-default): attribution window in calendar days for B2B.
 * Revenue is attributed to a campaign/channel only if the order closed
 * within this window after the first touchpoint.
 */
export const MKT_ATTRIBUTION_WINDOW_DAYS = 90;

// ─── Default config object ─────────────────────────────────────────────────

/**
 * Convenience aggregate of all defaults so callers can spread-override
 * individual fields without knowing every constant:
 *
 * @example
 * const cfg: MarketingRoiConfig = {
 *   ...MKT_ROI_DEFAULT_CONFIG,
 *   roiHighPerformingPct: 150,
 * };
 */
export interface MarketingRoiConfig {
  /** ROI% at or below which a channel is considered loss-making. */
  roiBreakevenPct: number;
  /** ROI% at or above which a channel is labelled "high-performing". */
  roiHighPerformingPct: number;
  /** Attribution window in days (EP-MKT-055). */
  attributionWindowDays: number;
}

export const MKT_ROI_DEFAULT_CONFIG: MarketingRoiConfig = {
  roiBreakevenPct: MKT_ROI_BREAKEVEN_PCT,
  roiHighPerformingPct: MKT_ROI_HIGH_PERFORMING_PCT,
  attributionWindowDays: MKT_ATTRIBUTION_WINDOW_DAYS,
};
