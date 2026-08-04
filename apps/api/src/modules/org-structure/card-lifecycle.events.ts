/**
 * @module org-structure/card-lifecycle.events
 * @description FAZA-09 5-holat lifecycle (EP-ORG-086/EP-ORG-137) — domain events published
 *   when a CARD's current_state transitions (freeze/thaw/vacant/restore) and when a card's
 *   annual review goes overdue (EP-ORG-137 staleness).
 *
 *   Gap fixed (discovery sweep 2026-08-03, "CardStatusChangedEvent/CardExpiredEvent yo'q"):
 *   `CardService.freezeCard/thawCard/setVacantCard/restoreCard` committed the DB transition
 *   but published NOTHING — no downstream consumer (notifications, audit, future listeners)
 *   could react to a card going frozen. `CardStatusChangedEvent` closes that gap.
 *   `CardExpiredEvent` mirrors it for the 1-year staleness clock (org_departments.
 *   last_reviewed_at) — previously only exposed as a read-only `is_stale` SELECT expression
 *   with nothing that ever scanned for it or emitted a signal (see ../../cron/card-staleness.cron.ts).
 *
 * Channel: EventEmitter2 (canonical — see docs/EVENT_KATALOGI.md). Consumers subscribe with
 *   `@OnEvent(CARD_STATUS_CHANGED_EVENT)` / `@OnEvent(CARD_EXPIRED_EVENT)` — mirrors the
 *   `org.card.employee.assigned` / `org.department.created` wiring already in this codebase
 *   (see lms/infrastructure/event-handlers/card-employee-assigned.handler.ts and
 *   cascade/department-created.event.ts).
 *
 * ⭐ ENFORCEMENT NOTE (Q-40, fabrication ban): Payroll's actual frozen-card pay-block
 *   (`PayrollService.computeGatedMonthlySalary`) does NOT rely on this event being delivered
 *   — it re-reads the card's LIVE current_state at generation time, the same "live DB gate"
 *   pattern already used by the LMS (EP-ORG-027) and onboarding-document gates. A missed or
 *   never-consumed event can therefore never silently let a frozen card get paid. This event
 *   exists for OTHER consumers (notifications, audit trail, future listeners) that want to
 *   react to the transition itself — none are wired yet (Q-40: no fabricated listener added).
 */

export const CARD_STATUS_CHANGED_EVENT = 'org.card.status.changed' as const;

/** Every FAZA-09 current_state transition this event can represent. */
export type CardStatusTransition = 'frozen' | 'thawed' | 'vacant' | 'restored';

/** Payload for {@link CARD_STATUS_CHANGED_EVENT} — published after every FAZA-09 state transition. */
export class CardStatusChangedEvent {
  constructor(
    /** org_departments.id (the karta). */
    public readonly cardId: number,
    /** current_state AFTER the transition ('active' | 'frozen' | 'vacant'). */
    public readonly newStatus: string,
    /** Which transition fired (readable label for logs/notifications). */
    public readonly transition: CardStatusTransition,
    /** Freeze/other reason, when the caller supplied one (freezeCard(reason)); null otherwise. */
    public readonly reason: string | null,
    /** ISO8601 timestamp of the transition. */
    public readonly changedAt: string = new Date().toISOString(),
  ) {}
}

export const CARD_EXPIRED_EVENT = 'org.card.expired' as const;

/** Payload for {@link CARD_EXPIRED_EVENT} — published by the daily staleness cron (EP-ORG-137). */
export class CardExpiredEvent {
  constructor(
    /** org_departments.id (the karta whose annual review is overdue). */
    public readonly cardId: number,
    /** org_departments.name (display label, for notification text). */
    public readonly cardName: string,
    /** last_reviewed_at ISO timestamp, or null when the card was never reviewed. */
    public readonly lastReviewedAt: string | null,
    /** ISO8601 timestamp the staleness check ran. */
    public readonly checkedAt: string = new Date().toISOString(),
  ) {}
}
