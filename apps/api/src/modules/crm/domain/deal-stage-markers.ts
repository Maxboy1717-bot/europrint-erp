/**
 * @module deal-stage-markers
 * @description Single source of truth for reading terminal meaning out of a deal's
 * free-form `stage_id`.
 *
 * Live `crm_deals` carries business status in `stage_id` as a free-form string, not a
 * constrained enum. Two write paths need to agree on what counts as won/lost:
 *   - MarkDealWonHandler  (POST /crm/deals/:id/won)
 *   - UpdateDealStageHandler (PATCH /crm/deals/:id/stage) — the path the Kanban board uses
 * Keeping the marker lists in one place stops the two from drifting apart.
 *
 * Known limit: when `stage_id` holds a `crm_stages` uuid instead of a semantic marker,
 * neither list matches. Resolving that needs `crm_stages.semantics`, and that table is
 * unseeded (owner data) — so no lookup is attempted here rather than guessing.
 */

export const LOST_MARKERS = ['lost', 'fail', 'c0:lose', 'lose'] as const;
export const WON_MARKERS = ['won', 'success', 'win', 'c0:win'] as const;

export function normalizeStage(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function isWonStage(raw: unknown): boolean {
  return (WON_MARKERS as readonly string[]).includes(normalizeStage(raw));
}

export function isLostStage(raw: unknown): boolean {
  return (LOST_MARKERS as readonly string[]).includes(normalizeStage(raw));
}
