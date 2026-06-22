/**
 * @module funnel-stage.vo
 * @description FunnelStage value object — represents one stage of the
 * recruitment funnel (e.g. NEW, PHONE_SCREENING, OFFER_SENT, HIRED). The
 * canonical stage list is duplicated here (and re-asserted in
 * `dto/create-funnel.dto.ts`) so the domain layer does not depend on the
 * recruitment DTO module — that would invert the dependency direction.
 *
 * Construction goes through `FunnelStage.create(value: string)` which
 * returns `Result<FunnelStage>`. The private constructor accepts already
 * validated input. Equality is value-based via `equals`.
 *
 * The valid-transitions graph itself lives on the `Funnel` aggregate
 * (`Funnel.VALID_TRANSITIONS`), not on the VO — a VO knows what it IS, the
 * aggregate knows where it can GO.
 */

import { Result, Ok, Err, AppErr } from '@common/types/result.type';

/**
 * ⭐ OWNER VISION — the 7-stage Human-Capital recruitment funnel.
 * Source: docs/audit/decisions/02-hr.md → EP-HR-016 ("Recruitment bosqichlari")
 *   "Tayyor kanban 7 bosqich (портрет→упаковка→поток→tez ishlov→baholash→
 *    lavozimga kiritish→kuchaytirish) + AI bosqichlari" (BARCHA_JAVOBLAR Q134).
 * Also docs/audit/MUSLIMBEK-PROMT-11-HR-2026-06-08.md Phase 5 (EP-HR-016).
 *
 * These are the canonical pipeline stages going forward. Each owner stage maps
 * to a stable code:
 *   PORTRET            — портрет (candidate portrait / sourcing)
 *   UPAKOVKA           — упаковка (offer/package framing)
 *   POTOK              — поток (inbound flow / screening intake)
 *   TEZ_ISHLOV         — tez ishlov (fast-process / AI fast screening)
 *   BAHOLASH           — baholash (assessment: AI video + live interview + test)
 *   LAVOZIMGA_KIRITISH — lavozimga kiritish (card assignment / offer→hire)
 *   KUCHAYTIRISH       — kuchaytirish (amplification / onboarding ramp-up)
 */
export const HC_FUNNEL_STAGES = [
  'PORTRET',
  'UPAKOVKA',
  'POTOK',
  'TEZ_ISHLOV',
  'BAHOLASH',
  'LAVOZIMGA_KIRITISH',
  'KUCHAYTIRISH',
] as const;

/**
 * LEGACY 12-stage conventional ATS pipeline. These are the codes the Funnel
 * aggregate's state machine is keyed on (VALID_TRANSITIONS, makeOffer, hire),
 * and `FunnelStageValue` is derived from EXACTLY this list — keeping that type
 * unchanged so the aggregate/helpers compile untouched (Q-39 no-regression).
 * KEPT AS VALID ALIASES so the live `hr_candidate_funnels` rows (PHONE_SCREENING
 * / INTERVIEWED / TEST_SENT / ...) hydrate without `FunnelStage` erroring — a
 * hard cut to the 7 stages would orphan them. Migrating these codes to the HC
 * set is a separate, owner-gated step. HIRED / REJECTED are terminal in both.
 */
export const LEGACY_FUNNEL_STAGES = [
  'NEW',
  'QUESTIONNAIRE_SENT',
  'PHONE_SCREENING',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'TEST_SENT',
  'TEST_ANALYSIS',
  'REFERENCES_CHECK',
  'PROBATION',
  'OFFER_SENT',
  'HIRED',
  'REJECTED',
] as const;

/**
 * Extra codes observed in LIVE `hr_candidate_funnels` data but absent from the
 * original enum (REFERENCES, SINOV_COMPLETE). Accepted at runtime so existing
 * rows validate, but deliberately NOT part of `FunnelStageValue` (they are not
 * keys in the state-machine graph). Kept separate to avoid widening the graph.
 */
export const EXTRA_LIVE_FUNNEL_STAGES = [
  'REFERENCES',
  'SINOV_COMPLETE',
] as const;

/**
 * All accepted stage codes = owner's 7 HC stages ∪ legacy 12 ∪ extra live
 * codes. `FunnelStage.create()` validates against this union so HC, legacy and
 * existing data are all accepted. Order: HC stages first (canonical), then
 * legacy aliases, then extra live codes.
 */
export const FUNNEL_STAGES = [
  ...HC_FUNNEL_STAGES,
  ...LEGACY_FUNNEL_STAGES,
  ...EXTRA_LIVE_FUNNEL_STAGES,
] as const;

/**
 * `FunnelStageValue` stays the LEGACY-12 union — UNCHANGED from before this
 * change. The Funnel aggregate's `VALID_TRANSITIONS` graph is keyed on exactly
 * these codes (`Record<FunnelStageValue, ...>` requires every key present), and
 * transition methods reference them. The widened set of *accepted* codes is
 * `AcceptedFunnelStageValue`, used only for runtime validation in
 * `FunnelStage.create()`.
 */
export type FunnelStageValue = typeof LEGACY_FUNNEL_STAGES[number];
export type HcFunnelStageValue = typeof HC_FUNNEL_STAGES[number];
export type AcceptedFunnelStageValue = typeof FUNNEL_STAGES[number];

/**
 * Best-effort projection of a legacy ATS code onto an owner HC stage, for
 * read-side grouping (e.g. a 7-column HC kanban over legacy rows). Pure,
 * non-destructive — does NOT mutate or migrate data. Terminal codes
 * (HIRED / REJECTED) and unknown codes return null (caller decides).
 */
export function mapLegacyToHcStage(stage: string): HcFunnelStageValue | null {
  switch (stage) {
    case 'PORTRET':
    case 'UPAKOVKA':
    case 'POTOK':
    case 'TEZ_ISHLOV':
    case 'BAHOLASH':
    case 'LAVOZIMGA_KIRITISH':
    case 'KUCHAYTIRISH':
      return stage; // already an HC stage
    case 'NEW':
      return 'PORTRET';
    case 'QUESTIONNAIRE_SENT':
      return 'POTOK';
    case 'PHONE_SCREENING':
      return 'TEZ_ISHLOV';
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEWED':
    case 'TEST_SENT':
    case 'TEST_ANALYSIS':
    case 'SINOV_COMPLETE':
    case 'REFERENCES':
    case 'REFERENCES_CHECK':
      return 'BAHOLASH';
    case 'PROBATION':
    case 'OFFER_SENT':
      return 'LAVOZIMGA_KIRITISH';
    default:
      return null; // HIRED / REJECTED / unknown
  }
}

export class FunnelStage {
  private constructor(private readonly value: AcceptedFunnelStageValue) {}

  /**
   * Build a FunnelStage from a raw string. Returns Err if the input is not
   * one of the accepted stage names (owner's 7 HC stages or a legacy/live
   * alias). Case-sensitive.
   */
  static create(value: string): Result<FunnelStage> {
    if (typeof value !== 'string' || value.length === 0) {
      return Err(AppErr('VALIDATION', 'FunnelStage qiymati bo\'sh bo\'lishi mumkin emas'));
    }
    if (!(FUNNEL_STAGES as readonly string[]).includes(value)) {
      return Err(AppErr(
        'VALIDATION',
        `Noma'lum funnel bosqichi: ${value}. Ruxsat etilgan: [${FUNNEL_STAGES.join(', ')}]`,
      ));
    }
    return Ok(new FunnelStage(value as AcceptedFunnelStageValue));
  }

  /**
   * Returns the stage code. Typed as `FunnelStageValue` (legacy-12) to keep the
   * Funnel aggregate's state-machine call sites unchanged — those only ever
   * construct/transition legacy codes. Read `getAcceptedValue()` when you need
   * the full accepted set (HC stages / extra live codes), e.g. for the HC
   * kanban projection.
   */
  getValue(): FunnelStageValue {
    return this.value as FunnelStageValue;
  }

  /** Returns the stored code as the full accepted union (HC ∪ legacy ∪ live). */
  getAcceptedValue(): AcceptedFunnelStageValue {
    return this.value;
  }

  equals(other: FunnelStage): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
