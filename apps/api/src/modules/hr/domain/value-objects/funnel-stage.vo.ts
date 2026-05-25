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

export const FUNNEL_STAGES = [
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

export type FunnelStageValue = typeof FUNNEL_STAGES[number];

export class FunnelStage {
  private constructor(private readonly value: FunnelStageValue) {}

  /**
   * Build a FunnelStage from a raw string. Returns Err if the input is not
   * one of the canonical stage names (case-sensitive).
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
    return Ok(new FunnelStage(value as FunnelStageValue));
  }

  getValue(): FunnelStageValue {
    return this.value;
  }

  equals(other: FunnelStage): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
