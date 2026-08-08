/**
 * @module create-notification.command
 * @description Source module. See exports for details.
 */

export class CreateNotificationCommand {
  constructor(readonly userId: string,
    readonly title: string,
    readonly body: string,
    readonly type: string,
    readonly referenceId?: string,
    readonly referenceType?: string,
    // 18-notif #88 — originating actor id (e.g. admin who triggered POST /notifications).
    // Undefined for system/cron-generated notifications (no human actor) — sender_id stays NULL.
    readonly senderId?: string,
    // Owner decision 2026-07-13 (chat) — originating ERP module vocabulary (matches
    // business_settings.module: 'sd'/'mes'/'qc'/'pos'/etc). referenceType values used across this
    // codebase ('pos_movement'/'lms_exam'/'write_off_act'/...) don't map 1:1 to a module code, so
    // this is accepted as an explicit optional field instead of guessed (Q-40). Undefined for
    // callers that don't supply it — module_code stays NULL (additive, no regression on existing
    // callers).
    readonly moduleCode?: string,
    // Owner decision 2026-07-13 (chat) — notification-category taxonomy soft-reference
    // (taxonomy_entries.code, category='notification_category': buyruq/ogohlantirish/talab/
    // tasdiqlash_sorovi/hisobot/elon — already seeded, 6 rows). Mirrors moduleCode exactly: an
    // explicit optional field, undefined for callers that don't supply it — category_code stays
    // NULL (additive, no regression on existing callers). Not backfilled on existing call sites
    // in this change (Q-46 scope note — separate follow-up item).
    readonly categoryCode?: string) {}
}
