/**
 * @module ai-fit-visibility.helper
 * @description AI-fit (P36) per-karta RBAC — role-scoped emas, karta-scoped
 *   cheklov (SB0505 P2 topilma to'ldiruvchisi).
 *
 * Kontekst: AiFitController allaqachon `@Roles(SUPER_ADMIN, DIRECTOR, HR_MANAGER)`
 * bilan himoyalangan (role-scoped) — lekin shu 3 rol ICHIDA istalgan boshqaruvchi
 * (masalan bitta bo'lim HR_MANAGER'i) TIZIMDAGI BARCHA kartaning AI-fit
 * bahosini/hisobotini ko'ra olardi — o'zi mas'ul bo'lmagan kartalar ham.
 *
 * Bu fayl xuddi shu bo'shliqni Kanban modulida allaqachon tasdiqlangan naqsh
 * bilan yopadi (manba: kanban/infrastructure/kanban-visibility.helper.ts,
 * EP-KAN-084) — qayta qurmaydi, mavjud org_departments.head_user_id +
 * org_functions.department_id infratuzilmasidan foydalanadi (Q-46).
 *
 * Qamrov qoidasi (bittasi yetarli — TRUE):
 *   1. SUPER_ADMIN / DIRECTOR — butun tizim (org-ierarxiyadan tashqarida,
 *      chunki ular allaqachon eng yuqori tasdiq zanjiri).
 *   2. HR_MANAGER — karta (org_functions) tegishli bo'lim (yoki uning ota
 *      bo'limlari zanjiridagi biror bo'lim) `head_user_id = viewer` bo'lsa,
 *      ya'ni viewer o'sha bo'lim yoki uning YUQORI zanjiridagi boshqaruvchi
 *      (bosqichli — yuqori daraja pastdagini ko'radi, Vysotskiy 7 vertikal).
 *
 * `head_user_id` to'ldirilish darajasi past (18/145, 2026-07-04 tekshiruv) —
 * bu FABRIKATSIYA emas, mavjud haqiqiy ustundan foydalanish; to'ldirilmagan
 * bo'limlar uchun predicate shunchaki FALSE qaytaradi (ko'rinmaydi), yangi
 * cheklov EMAS — bu holatlar avval ham to'liq tasodifiy ko'rinar edi.
 */

import { sql, SQL } from 'drizzle-orm';

/** Butun tizimni ko'radigan rollar — karta-ierarxiya filtridan chetlanadi. */
const AI_FIT_FULL_VISIBILITY_ROLES = new Set(['super_admin', 'director']);

export function hasFullAiFitVisibility(role: string | undefined | null): boolean {
  return !!role && AI_FIT_FULL_VISIBILITY_ROLES.has(String(role).toLowerCase());
}

/**
 * `org_functions` jadvali `f` alias bilan so'rovga qo'shilgan bo'lishi shart
 * (masalan `ai_fit_scores.card_id = f.id` JOIN orqali). Qaytargan SQL
 * predicate quyidagi holatda TRUE bo'ladi: karta bog'langan bo'lim (yoki uning
 * pastki bo'lim zanjiri — bosqichli, WITH RECURSIVE) `head_user_id = viewer`.
 *
 * `hasFullAiFitVisibility(role)` true bo'lsa, bu predicate chaqirilmaydi —
 * super_admin/director org-filtrisiz butun tizimni ko'radi.
 */
export function aiFitCardVisibilityPredicate(viewerUserId: number): SQL {
  return sql`EXISTS (
    WITH RECURSIVE headed_depts AS (
      SELECT od.id FROM org_departments od
      WHERE od.head_user_id = ${viewerUserId} AND od.is_active = true
      UNION ALL
      SELECT child.id FROM org_departments child
      JOIN headed_depts hd ON child.parent_id = hd.id
      WHERE child.is_active = true
    )
    SELECT 1 FROM org_functions of2
    WHERE of2.id = f.id
      AND of2.department_id IN (SELECT id FROM headed_depts)
  )`;
}

/**
 * Bitta cardId uchun viewer ruxsatini tekshiradi (evaluate() — bitta karta
 * uchun yozish amali). `org_functions.department_id` orqali `org_departments`
 * ichida viewer boshqargan (yoki uning pastki) bo'lim zanjirida bormi.
 */
export function aiFitSingleCardAccessQuery(cardId: number, viewerUserId: number): SQL {
  return sql`
    SELECT EXISTS (
      WITH RECURSIVE headed_depts AS (
        SELECT od.id FROM org_departments od
        WHERE od.head_user_id = ${viewerUserId} AND od.is_active = true
        UNION ALL
        SELECT child.id FROM org_departments child
        JOIN headed_depts hd ON child.parent_id = hd.id
        WHERE child.is_active = true
      )
      SELECT 1 FROM org_functions f
      WHERE f.id = ${cardId}
        AND f.department_id IN (SELECT id FROM headed_depts)
    ) AS has_access
  `;
}
