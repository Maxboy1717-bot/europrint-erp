/**
 * @module kanban-visibility.helper
 * @description Kanban karta ko'rinishi — org-sxema bo'yicha rol-asosli maxfiylik (M0).
 *
 * APPROVED: egasi vizyon-qurish 2026-07-01, FAZA Kanban 3-savat real CC (M0)
 *
 * Vizyon manbasi: docs/audit/decisions/15-kanban.md EP-KAN-084 (v2-Q54) —
 * "Vazifa ko'rinishi (kim qaysi vazifani ko'radi): xodim o'zini + bo'lim
 * ishlarini, boshliq butun bo'limni, yuqori daraja yuqoridan ko'radi (bosqichli)."
 *
 * Avvalgi audit topilgan bo'shliq: kanban-cards.controller.ts getAllCards() /
 * getBoardCards() cheklovsiz `SELECT * FROM kanban_cards` edi — ruxsat berilgan
 * rol ro'yxatidagi HAR QANDAY foydalanuvchi tizimdagi BARCHA kartani ko'rar edi.
 * Bu fayl shu bo'shliqni org-ierarxiya bo'yicha haqiqiy SQL predicate bilan yopadi
 * (Q-46 — mavjud org_departments/employee_org_departments infratuzilmasidan
 * foydalanadi, qayta qurmaydi; pattern manbasi: cc-org-resolver.service.ts va
 * org-queries.repo.ts dagi WITH RECURSIVE ancestor/descendant yurish namunasi).
 */

import { sql, SQL } from 'drizzle-orm';

/** Butun tizimni ko'radigan rollar — org-ierarxiya filtridan chetlanadi. */
const FULL_VISIBILITY_ROLES = new Set(['super_admin', 'director']);

export function hasFullKanbanVisibility(role: string | undefined | null): boolean {
  return !!role && FULL_VISIBILITY_ROLES.has(String(role).toLowerCase());
}

/**
 * `kanban_cards` jadvali `kc` alias bilan so'rovga qo'shilgan bo'lishi shart.
 * Qaytargan SQL predicate quyidagi holatlarda TRUE bo'ladi (birortasi yetarli):
 *
 *   1. Viewer kartaning egasi (owner_user_id) / topshiruvchisi (assigner_user_id) /
 *      qabul qiluvchisi (accepted_by_id) — "o'zini" (shaxsiy vazifa).
 *   2. Viewer kartaga kuzatuvchi (kanban_observers) yoki hamijrochi
 *      (kanban_co_executors) sifatida qo'shilgan.
 *   3. Karta egasi (owner_user_id) viewer BOSHQARADIGAN (head_user_id) bo'lim
 *      daraxti ichida (o'zi yoki pastki bo'limlar) — "boshliq butun bo'limni
 *      ko'radi" (bosqichli, WITH RECURSIVE pastga yurish).
 *   4. Viewer va karta egasi bir xil asosiy (is_primary) bo'limda — "bo'lim
 *      ishlarini" hamkasb sifatida ko'rish.
 *
 * `hasFullKanbanVisibility(role)` true bo'lsa, bu predicate chaqirilmaydi —
 * super_admin/director org-filtrisiz butun tizimni ko'radi.
 */
export function kanbanCardVisibilityPredicate(viewerUserId: number): SQL {
  return sql`(
    kc.owner_user_id = ${viewerUserId}
    OR kc.assigner_user_id = ${viewerUserId}
    OR kc.accepted_by_id = ${viewerUserId}
    OR EXISTS (
      SELECT 1 FROM kanban_observers ko
      WHERE ko.card_id = kc.id::text AND ko.user_id = ${viewerUserId}
    )
    OR EXISTS (
      SELECT 1 FROM kanban_co_executors kce
      WHERE kce.card_id = kc.id::text AND kce.user_id = ${viewerUserId}
    )
    OR EXISTS (
      WITH RECURSIVE headed_depts AS (
        SELECT od.id FROM org_departments od
        WHERE od.head_user_id = ${viewerUserId} AND od.is_active = true
        UNION ALL
        SELECT child.id FROM org_departments child
        JOIN headed_depts hd ON child.parent_id = hd.id
        WHERE child.is_active = true
      )
      SELECT 1 FROM employee_org_departments eod
      WHERE eod.user_id = kc.owner_user_id
        AND eod.is_primary = true
        AND eod.org_department_id IN (SELECT id FROM headed_depts)
    )
    OR EXISTS (
      SELECT 1 FROM employee_org_departments viewer_eod
      JOIN employee_org_departments owner_eod
        ON owner_eod.org_department_id = viewer_eod.org_department_id
       AND owner_eod.is_primary = true
      WHERE viewer_eod.user_id = ${viewerUserId}
        AND viewer_eod.is_primary = true
        AND owner_eod.user_id = kc.owner_user_id
    )
  )`;
}

/**
 * Confidential-card gate (owner decision 2026-07-13): `kanban_cards.is_confidential`
 * exists precisely because confidential tasks/discipline records must stay OFF the
 * general Kanban board (discipline_records is already a separate table for that
 * concern — this closes the remaining "no per-card confidential flag" gap).
 *
 * A card with `is_confidential = true` is hidden from the board UNLESS the viewer is:
 *   1. The card's owner (`owner_user_id`) or assigner (`assigner_user_id`) — "o'zining
 *      maxfiy vazifasi" always stays visible to the two people who created/hold it.
 *   2. A privileged role (`hasFullKanbanVisibility` — super_admin/director), same
 *      privileged-role set already used by {@link kanbanCardVisibilityPredicate}'s
 *      org-hierarchy bypass.
 *
 * This is INDEPENDENT of {@link kanbanCardVisibilityPredicate} — department-head or
 * same-department "hamkasb" visibility does NOT by itself unlock a confidential card.
 * Callers AND the two predicates together.
 *
 * `kanban_cards` jadvali `kc` alias bilan so'rovga qo'shilgan bo'lishi shart (mirrors
 * kanbanCardVisibilityPredicate's alias contract).
 */
export function kanbanConfidentialClause(viewerUserId: number, role: string | undefined | null): SQL {
  if (hasFullKanbanVisibility(role)) return sql`TRUE`;
  return sql`(
    kc.is_confidential = false
    OR kc.owner_user_id = ${viewerUserId}
    OR kc.assigner_user_id = ${viewerUserId}
  )`;
}
