/**
 * @module production-priority.service
 * @description Pure (no-I/O) production-queue ordering for the PP module.
 *   Implements the owner priority vision (EP-PP-010 / EP-PP-058 / EP-PP-059 /
 *   EP-PP-097) and the no-preempt frozen-zone rule (EP-PP-025 / EP-PP-061).
 * @layer Domain Service (PP — pure ranking logic, deterministic, unit-testable)
 *
 * PRIORITY MODEL (EP-PP-059 — 4 levels) + ZARUR special zone (EP-PP-097)
 *   The xlsx has an explicit "Очеред" (queue) column plus a separate
 *   "ЗАРУР ЗАКАЗЛАР" (urgent) block. So priority is two-dimensional:
 *     - a 4-level band:  Shoshilinch / Yuqori / Oddiy / Past
 *     - an orthogonal ZARUR flag that jumps the WHOLE queue, above every band.
 *   ZARUR is NOT a 5th band — it is a flag a planner sets that floats the order
 *   to the very front of the unfrozen queue regardless of its band.
 *
 * ORDERING (EP-PP-010 / EP-PP-058)
 *   Primary criterion = deadline (earliest first). Tie-break = priority band
 *   (more urgent first). The ZARUR flag overrides both: every ZARUR order ranks
 *   ahead of every non-ZARUR order. Within the ZARUR group the same
 *   deadline→band ordering applies.
 *
 * FROZEN ZONE / NO-PREEMPT (EP-PP-025 ~3 days · EP-PP-061 STRICT)
 *   Orders whose work is already locked into the near-term window (frozen, or
 *   running) MUST NOT be displaced by a newly-arrived higher-priority order —
 *   "Ҳар бир заказ 100% якунлангандан сўнггина кейинги заказга ўтилади". So the
 *   queue is built in two segments that are concatenated, never interleaved:
 *     1. the FROZEN segment, kept in its existing committed order (sequence asc)
 *     2. the FLEXIBLE segment, freely re-ranked by ZARUR → deadline → band
 *   A new urgent order can therefore only land at the front of segment 2; it can
 *   never push a frozen/running job. Only a formal unlock (owner/director) moves
 *   an order out of the frozen segment — modelled here by the `frozen` flag,
 *   which the caller clears under that authority before re-ranking.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';

/** Priority bands (EP-PP-059). Lower rank value = more urgent. */
export enum PoPriority {
  SHOSHILINCH = 'shoshilinch', // urgent
  YUQORI = 'yuqori',           // high
  ODDIY = 'oddiy',             // normal (default)
  PAST = 'past',               // low
}

/** Numeric rank for each band — smaller sorts first. Single source of order. */
export const PO_PRIORITY_RANK: Readonly<Record<PoPriority, number>> = {
  [PoPriority.SHOSHILINCH]: 1,
  [PoPriority.YUQORI]: 2,
  [PoPriority.ODDIY]: 3,
  [PoPriority.PAST]: 4,
};

/** Default band when none supplied (Oddiy / normal). */
export const PO_DEFAULT_PRIORITY = PoPriority.ODDIY;

/** Frozen-zone window in days (EP-PP-025 owner override: ~3 days). */
export const FROZEN_ZONE_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Minimal shape the ranker needs. Kept structural (not the full aggregate) so the
 * ordering logic stays pure and trivially testable with plain objects.
 */
export interface SchedulableOrder {
  id: number;
  /** Deadline / planned end. Earlier = ranked sooner. */
  deadline: Date;
  /** Priority band; defaults to Oddiy when omitted. */
  priority?: PoPriority;
  /** EP-PP-097 ZARUR flag — floats above every non-urgent order. */
  isUrgent?: boolean;
  /**
   * EP-PP-025/061 — work is committed to the near-term window and may NOT be
   * preempted. Frozen orders keep their existing sequence and always precede
   * the flexible segment.
   */
  isFrozen?: boolean;
  /**
   * Existing committed sequence position (e.g. xlsx "Очеред"). Used to preserve
   * order WITHIN the frozen segment. Defaults to insertion order when omitted.
   */
  sequence?: number;
}

function rankOf(o: SchedulableOrder): number {
  return PO_PRIORITY_RANK[o.priority ?? PO_DEFAULT_PRIORITY];
}

/**
 * Compare two FLEXIBLE orders: ZARUR first, then earliest deadline, then band,
 * then id for a fully deterministic tie-break.
 */
function compareFlexible(a: SchedulableOrder, b: SchedulableOrder): number {
  const aUrgent = a.isUrgent ? 0 : 1;
  const bUrgent = b.isUrgent ? 0 : 1;
  if (aUrgent !== bUrgent) return aUrgent - bUrgent;

  const dl = a.deadline.getTime() - b.deadline.getTime();
  if (dl !== 0) return dl;

  const pr = rankOf(a) - rankOf(b);
  if (pr !== 0) return pr;

  return a.id - b.id;
}

@Injectable()
export class ProductionPriorityService {
  /**
   * Build the production queue (EP-PP-010 / EP-PP-058 / EP-PP-061).
   *
   * Returns frozen orders first (in their committed sequence, never re-ranked),
   * then the flexible orders ranked ZARUR → deadline → band. A new high-priority
   * or ZARUR order can only enter the flexible segment — it can NEVER preempt a
   * frozen/running job (no-preempt rule).
   */
  buildQueue(orders: SchedulableOrder[]): Result<SchedulableOrder[]> {
    const list = Array.isArray(orders) ? orders : [];

    const frozen = list
      .filter((o) => o.isFrozen)
      .map((o, i) => ({ o, seq: o.sequence ?? i, i }))
      .sort((a, b) => (a.seq - b.seq) || (a.i - b.i))
      .map((x) => x.o);

    const flexible = list.filter((o) => !o.isFrozen).slice().sort(compareFlexible);

    return Ok([...frozen, ...flexible]);
  }

  /**
   * EP-PP-061 no-preempt guard. Returns the insertion index a new order would
   * take in an already-built queue WITHOUT displacing any frozen/running job.
   * The earliest legal slot is right after the last frozen order.
   *
   * `queue` MUST already be ordered (frozen segment first); this returns the
   * index at which `incoming` should be spliced into the flexible segment.
   */
  findInsertionSlot(queue: SchedulableOrder[], incoming: SchedulableOrder): Result<number> {
    if (incoming.isFrozen) {
      // A brand-new order cannot itself be frozen — freezing is an explicit,
      // authority-gated act on an already-scheduled order (EP-PP-025).
      return Err('CANNOT_INSERT_FROZEN_ORDER');
    }
    const list = Array.isArray(queue) ? queue : [];
    const firstFlexible = list.findIndex((o) => !o.isFrozen);
    const floor = firstFlexible === -1 ? list.length : firstFlexible;

    let idx = floor;
    for (let i = floor; i < list.length; i += 1) {
      const item = list[i];
      if (!item || item.isFrozen) continue; // never step over a frozen job
      if (compareFlexible(incoming, item) < 0) {
        idx = i;
        return Ok(idx);
      }
      idx = i + 1;
    }
    return Ok(idx);
  }

  /**
   * EP-PP-025 — is the given start date inside the frozen window (now + N days)?
   * Pure helper used to decide whether an order should be marked frozen.
   */
  isWithinFrozenWindow(plannedStart: Date, now: Date = new Date(), windowDays: number = FROZEN_ZONE_DAYS): boolean {
    const horizon = now.getTime() + windowDays * MS_PER_DAY;
    return plannedStart.getTime() <= horizon;
  }
}
