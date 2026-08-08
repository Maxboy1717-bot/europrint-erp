/**
 * @module card-gate-precheck.service
 * @description EP-ORG-003 / A29 — read-only blast-radius calc for the card
 *   login-gate. Computes, against LIVE data, how many currently-active users
 *   would be blocked the moment `CARD_LOGIN_GATE_ENABLED` flips to `true`.
 *
 *   The rule mirrors `login.service.ts:129` EXACTLY (do NOT diverge):
 *     - exempt roles {super_admin, admin, director} always pass (never counted
 *       as blocked) — see {@link CARD_EXEMPT_ROLES} / login.service.isCardExemptRole;
 *     - a non-exempt active user is BLOCKED iff it has 0 live employee_cards
 *       (i.e. resolveCardGate.activeCardCount === 0), where a live employee_card =
 *       is_active = true AND (ended_at IS NULL OR ended_at > NOW()). The gate does
 *       NOT consider users.card_id for the block decision (card_id only feeds the
 *       JWT primary-card claim), so this pre-check must not either.
 *       [VISION-3340 fix 2026-07-08: dropped a stale `card_id IS NULL` condition
 *       that made this pre-check more lenient than the real gate — it could report
 *       a cardless-but-card_id-set user as "not blocked" while login blocked them.]
 *
 *   This service NEVER mutates anything. It only reads. It exists so the owner
 *   can make the gate-ON decision (Q8 vision-lock) with a real 401-surge number
 *   instead of guessing.
 */

/**
 * NOTE: Raw SQL retained intentionally (Rule 4) — the count uses a multi-CTE
 *   pipeline with a correlated COUNT subquery and FILTER aggregates that the
 *   Drizzle query builder cannot express. Same justification as the sibling
 *   `drizzle-auth.repo.resolveCardGate`. All values are literal/parameterised —
 *   no string interpolation, no injection surface.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

/**
 * Roles that bypass the card-gate (system-level accounts that may have no card).
 * MUST stay in sync with `login.service.isCardExemptRole`.
 */
export const CARD_EXEMPT_ROLES: ReadonlyArray<string> = ['super_admin', 'admin', 'director'];

/**
 * Outcome of the pre-check. All counts are computed live, in a single query.
 * @property activeUsersTotal - all users with is_active = true
 * @property exemptTotal - active users whose role bypasses the gate (always pass)
 * @property cardlessBlocked - active, non-exempt users that WOULD be 401'd if the gate turns ON
 * @property cardedNonExempt - active, non-exempt users that have a card (would still pass)
 * @property cardlessByRole - breakdown of `cardlessBlocked` per role (who exactly loses access)
 * @property safeToEnable - true when cardlessBlocked === 0 (turning the gate ON locks nobody out)
 */
export interface CardGatePrecheckSummary {
  activeUsersTotal: number;
  exemptTotal: number;
  cardlessBlocked: number;
  cardedNonExempt: number;
  cardlessByRole: ReadonlyArray<{ role: string; count: number }>;
  safeToEnable: boolean;
}

interface SummaryRow {
  active_users_total: number;
  exempt_total: number;
  cardless_blocked: number;
  carded_non_exempt: number;
}

interface ByRoleRow {
  role: string;
  n: number;
}

@Injectable()
export class CardGatePrecheckService {
  private readonly logger = new Logger(CardGatePrecheckService.name);

  /**
   * Computes the gate-activation blast radius from live data.
   * @returns Result.ok(summary) — never throws; DB errors become Err.
   */
  async summarize(): Promise<Result<CardGatePrecheckSummary>> {
    try {
      const summaryRes = await runQuery<SummaryRow>(sql`
        WITH active_users AS (
          SELECT id, role, employee_id
          FROM users
          WHERE is_active = true
        ),
        card_status AS (
          SELECT
            au.role,
            (SELECT COUNT(*) FROM employee_cards ec
               WHERE ec.employee_id = au.employee_id
                 AND ec.is_active = true
                 AND (ec.ended_at IS NULL OR ec.ended_at > NOW()))::int AS active_card_count
          FROM active_users au
        )
        SELECT
          COUNT(*)::int AS active_users_total,
          COUNT(*) FILTER (
            WHERE lower(role) IN ('super_admin', 'admin', 'director')
          )::int AS exempt_total,
          COUNT(*) FILTER (
            WHERE lower(role) NOT IN ('super_admin', 'admin', 'director')
              AND active_card_count = 0
          )::int AS cardless_blocked,
          COUNT(*) FILTER (
            WHERE lower(role) NOT IN ('super_admin', 'admin', 'director')
              AND active_card_count > 0
          )::int AS carded_non_exempt
        FROM card_status
      `);

      const row = summaryRes.rows[0];
      if (!row) return Err(AppErr('INTERNAL', 'Card-gate pre-check: empty result'));

      const byRoleRes = await runQuery<ByRoleRow>(sql`
        WITH active_users AS (
          SELECT id, role, employee_id
          FROM users
          WHERE is_active = true
        ),
        card_status AS (
          SELECT
            au.role,
            (SELECT COUNT(*) FROM employee_cards ec
               WHERE ec.employee_id = au.employee_id
                 AND ec.is_active = true
                 AND (ec.ended_at IS NULL OR ec.ended_at > NOW()))::int AS active_card_count
          FROM active_users au
        )
        SELECT role, COUNT(*)::int AS n
        FROM card_status
        WHERE lower(role) NOT IN ('super_admin', 'admin', 'director')
          AND active_card_count = 0
        GROUP BY role
        ORDER BY n DESC
      `);

      const byRoleRows = Array.isArray(byRoleRes.rows) ? byRoleRes.rows : [];
      const cardlessByRole = byRoleRows.map((r) => ({
        role: String(r.role ?? 'unknown'),
        count: Number(r.n ?? 0),
      }));

      const cardlessBlocked = Number(row.cardless_blocked ?? 0);
      const summary: CardGatePrecheckSummary = {
        activeUsersTotal: Number(row.active_users_total ?? 0),
        exemptTotal: Number(row.exempt_total ?? 0),
        cardlessBlocked,
        cardedNonExempt: Number(row.carded_non_exempt ?? 0),
        cardlessByRole,
        safeToEnable: cardlessBlocked === 0,
      };
      return Ok(summary);
    } catch (error: unknown) {
      this.logger.error(`Card-gate pre-check failed: ${String(error)}`);
      return Err(AppErr('INTERNAL', `Card-gate pre-check failed: ${String(error)}`));
    }
  }
}
