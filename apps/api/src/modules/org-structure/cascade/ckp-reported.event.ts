/**
 * @module org-structure/cascade/ckp-reported.event
 * @description T18-C2 (ЦКП KASKAD-AGREGAT) — domain event published AFTER a daily
 *   ЦКП fact is committed to `ckp_fact_values` (via {@link CkpFactService.recordFact}).
 *   Carries the card + day so the cascade listener can roll the achievement up the
 *   VERTICAL org chain (child card → parent card → … → root) for that day.
 *
 * Channel: EventEmitter2 (canonical — same mechanism as ORG_CASCADE_EVENT and the
 *   MES→ЦКП feed). Event name constant lives in ./ckp-cascade.constants.ts
 *   (CKP_REPORTED_EVENT). NEVER carries a fabricated value — only the real card/day
 *   that was just written; the roll-up RE-READS the live facts (no value duplication).
 */

export class CkpReportedEvent {
  constructor(
    /** org_departments.id of the card whose daily ЦКП fact was just recorded. */
    public readonly cardId: number,
    /** ЦКП fact day (ISO 'YYYY-MM-DD') — the roll-up aggregates this exact day. */
    public readonly factDate: string,
    /** achievement% just written for this card/day (for log/audit only — not summed). */
    public readonly achievementPct: number | null,
    /** source of the fact ('MANUAL' | 'MES' | 'AI_CHAT' | 'IOT' | 'MES_AUTO'). */
    public readonly source: string,
    /** ISO8601 timestamp of when the fact was committed. */
    public readonly reportedAt: string = new Date().toISOString(),
  ) {}
}
