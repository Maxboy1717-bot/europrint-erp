/**
 * @module kanban-priority
 * @description Owner-vision canonical Kanban priority tiers (EP-KAN-057, v2-Q27 /
 *   FULL-ITEM-LEVEL-MASTER-PLAN Item C27: "3 daraja ustuvorlik: Shoshilinch/Oddiy/Past").
 *
 *   The owner's vision: task priority has EXACTLY 3 tiers — Shoshilinch (urgent),
 *   Oddiy (normal/default), Past (low). Source: docs/audit/decisions/15-kanban.md
 *   EP-KAN-057 — "A — 3 daraja: Shoshilinch / Oddiy / Past (sodda va yetarli)".
 *
 *   ⚠️ LIVE-MODEL REALITY (verified against the `europrint` DB): the canonical
 *   `kanban_cards.priority` column (lib/db/src/schema/kanban/kanban-core.ts) is a
 *   4-valued varchar CHECK ('low','normal','high','urgent') with existing stored
 *   rows and API callers (kanban.dto.ts / presentation/dto/kanban.dto.ts z.enum)
 *   that must keep working (Q-39 non-regression). This module does NOT rename or
 *   migrate that column — it is an ADDITIVE alias layer: {@link priorityToVisionTier}
 *   maps every stored/accepted raw value onto the owner's 3-tier vision naming for
 *   display/reporting purposes, while the DB/API keep accepting the original 4
 *   values unchanged.
 *
 *   Mapping rule (documented, not fabricated): 'urgent' -> Shoshilinch and
 *   'low' -> Past are direct 1:1 matches to the vision text. The vision names no
 *   4th tier, so the extra granularity kept for non-regression ('normal' and
 *   'high') both fold into 'Oddiy' — 'Shoshilinch' stays reserved exclusively for
 *   'urgent', matching the already-built C29 daily-limit rule (see
 *   KANBAN_MAX_URGENT_PER_DAY usage + the literal "Shoshilinch" wording in
 *   kanban-boards.service.ts and drizzle-kanban-cards.repo.ts, both gated on
 *   `priority === 'urgent'` only).
 */

/** The 3 canonical vision-tier priority names (EP-KAN-057). */
export enum KanbanPriorityTier {
  SHOSHILINCH = 'shoshilinch', // Shoshilinch — urgent
  ODDIY       = 'oddiy',       // Oddiy — normal/default
  PAST        = 'past',        // Past — low
}

/** Human-readable Uzbek label for each vision tier (capitalized, as in the vision text). */
export const KANBAN_PRIORITY_TIER_LABELS: Record<KanbanPriorityTier, string> = {
  [KanbanPriorityTier.SHOSHILINCH]: 'Shoshilinch',
  [KanbanPriorityTier.ODDIY]:       'Oddiy',
  [KanbanPriorityTier.PAST]:        'Past',
};

/**
 * Additive alias map: every raw `kanban_cards.priority` value the DB CHECK
 * constraint and the DTO z.enum schemas currently accept, mapped onto its
 * vision-tier bucket. Legacy/unknown values are NOT listed here — callers
 * must go through {@link priorityToVisionTier}, which falls back to Oddiy
 * for anything unmapped so stored rows are never orphaned by this alias layer.
 */
export const PRIORITY_TO_VISION_TIER: Record<string, KanbanPriorityTier> = {
  urgent: KanbanPriorityTier.SHOSHILINCH,
  high:   KanbanPriorityTier.ODDIY,
  normal: KanbanPriorityTier.ODDIY,
  low:    KanbanPriorityTier.PAST,
};

/**
 * Map a raw stored/accepted `priority` value (low/normal/high/urgent, or any
 * legacy/unmapped string) onto the owner-vision 3-tier name. Never throws —
 * an unrecognized value is treated as Oddiy (the vision's default tier), so
 * this is safe to call on any existing row without a prior data migration.
 *
 * @param priority raw `kanban_cards.priority` value (may be null/undefined)
 * @returns the matched {@link KanbanPriorityTier}
 */
export function priorityToVisionTier(priority: string | null | undefined): KanbanPriorityTier {
  if (!priority) return KanbanPriorityTier.ODDIY;
  const key = String(priority).trim().toLowerCase();
  return PRIORITY_TO_VISION_TIER[key] ?? KanbanPriorityTier.ODDIY;
}

/**
 * Convenience: raw priority -> Uzbek vision-tier label ("Shoshilinch"/"Oddiy"/"Past").
 * Use this wherever a card's priority is surfaced to a user (UI badge, report,
 * notification) so the label matches EP-KAN-057 without touching the stored value
 * or any existing DTO/DB enum.
 *
 * @param priority raw `kanban_cards.priority` value (may be null/undefined)
 * @returns the vision-tier Uzbek label
 */
export function priorityToVisionLabel(priority: string | null | undefined): string {
  return KANBAN_PRIORITY_TIER_LABELS[priorityToVisionTier(priority)];
}
