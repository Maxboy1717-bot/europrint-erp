# Backend i18n Leakage Audit — Report

**Date:** 2026-05-16
**Scope:** `apps/api/src/` only (no frontend changes)
**Stack:** NestJS 11 + Fastify + nestjs-i18n (already wired in `app.module.ts`)
**Locale base path:** `apps/api/src/i18n/{uz,ru}/*.json`

---

## 1. Discovered Uzbek-string surface

Surface discovery used `Grep` over `apps/api/src/**/*.ts` for the patterns
listed in the brief plus Uzbek apostrophe-rich substrings (`majburiy`,
`bo'lishi`, `topilmadi`, `qilindi`, `o'chirildi`, `kerak`, `yo'q`, ...).

| Kind                                              | Count |
|---------------------------------------------------|------:|
| `throw new XxxException('<uz>')`                  |   ~85 |
| `return { message: '<uz>' }` (success / fallback) |   ~25 |
| `Err({ message: '<uz>' })` (Result pattern)       |   ~20 |
| `assertFound(data, '<uz>')` (HTTP throws)         |    ~5 |
| Status / response-shape labels in services        |    ~5 |
| Repository default-row `message: 'Yangilandi'`    |   ~11 |

CSV inventory (~95 entries with recommended fix): `docs/agents/agent-backend-i18n-inventory.csv`

**De-prioritised (kept as-is per the brief):**
- `this.logger.{log,error,warn}` calls (operator audience, Uzbek is fine)
- Comments / variable names / debug strings
- Telegram bot `ctx.reply('Xatolik...')` chat-handler messages (operator
  audience and they’re an in-bot UX with its own language)
- `@ApiOperation({ summary: '...' })` — Swagger docs, not response bodies
- Domain aggregates without DI (`budget.aggregate.ts`,
  `leave-request.aggregate.ts`, `approval-request.aggregate.ts`) — marked
  with `// I18N_LEAK: ...` and matching key, since adding DI to a value
  object is more invasive than this audit warrants.

---

## 2. Fixes applied

| # | File | Before | After |
|---|------|--------|-------|
| 1 | `common/guards/roles.guard.ts:42,53` | `throw new ForbiddenException('Ruxsat yoq')` | `i18n.t('errors.permissionDenied')` (also: switched `canActivate` to `async`) |
| 2 | `common/guards/jwt-auth.guard.ts:78,86,91,106,119` | `'Token topilmadi' / 'Token muddati tugagan' / ...` (5 leaks) | `i18n.t('auth.tokenRequired' / 'auth.tokenInvalid' / 'auth.tokenExpired' / 'auth.tokenRevoked')` |
| 3 | `modules/order-workflow/.../order-transition.guard.ts:44,50` | `'Buyurtma topilmadi: …' / 'Bu buyurtmaga ruxsatingiz yo''q'` | `i18n.t('errors.orderNotFound' / 'errors.noOrderAccess')` |
| 4 | `modules/wms/warehouses/warehouses.service.ts:33,61` | `\`Ombor #${id} topilmadi\`` / `{ message: 'Ombor deaktiv qilindi' }` | `i18n.t('errors.warehouseNotFound')` / `{ message: i18n.t('messages.warehouseDeactivated'), code: 'WAREHOUSE_DEACTIVATED' }` |
| 5 | `modules/sd/orders/orders.service.ts:77` | `{ message: 'Buyurtma bekor qilindi' }` | `{ message: i18n.t('messages.orderCancelled'), code: 'ORDER_CANCELLED' }` |
| 6 | `modules/ecommerce/ecommerce.service.ts:122,123` | `"Noto''g''ri buyurtma/to''lov holati"` | `i18n.t('errors.invalidOrderStatus' / 'errors.invalidPaymentStatus')` |
| 7 | `modules/ecommerce/ecommerce.repository.ts:38,59,118,126,135` | 3× `'Buyurtma topilmadi'`, 2× `'Mijoz topilmadi'` | `i18n.t('errors.orderNotFound' / 'errors.customerNotFound')` — class now has `constructor(private readonly i18n)` |
| 8 | `modules/lms/enrollments/enrollments.service.ts:24` | `"Foydalanuvchi allaqachon ushbu kursga yozilgan"` | `i18n.t('errors.alreadyEnrolled')` |
| 9 | `modules/communication-center/presentation/cc-baskets.controller.ts:76,80,93` | `'Hujjat topilmadi'`, `"Ruxsat yo''q"` ×2 | `i18n.t('errors.documentNotFound' / 'errors.permissionDenied')` |
| 10 | `modules/communication-center/presentation/cc-public.controller.ts:86` | `"Hujjat topilmadi yoki QR kod noto''g''ri"` | `i18n.t('errors.documentOrQrNotFound')` |
| 11 | `modules/compatibility/document-workflow-v2.controller.ts:95` | `'Rad etish sababi majburiy'` | `i18n.t('errors.rejectReasonRequired')` |
| 12 | `modules/compatibility/document-workflow-v2.service.ts:105` | `'Hujjat yaratish bajarilmadi'` | `i18n.t('errors.documentCreationFailed')` |
| 13 | `modules/compatibility/resources.service.ts:256` | `'Lavozim topilmadi'` | `i18n.t('errors.positionNotFound')` |
| 14 | `modules/admin/presentation/controllers/admin-users.controller.ts:116,118` | `"O''chirishda xato"` and `"Foydalanuvchi o''chirildi"` | `i18n.t('errors.deleteFailed')` and `{ message: i18n.t('messages.userDeleted'), code: 'USER_DELETED' }` |
| 15 | `modules/iot/presentation/iot-camera.controller.ts:97` | `{ message: "O'chirildi" }` | `{ message: i18n.t('messages.deleted'), code: 'DELETED' }` |
| 16 | `modules/auth/presentation/auth.controller.ts:242,249,265` | `'Token required'` / `'Token revoked'` / `'Token muddati tugagan'` | `i18n.t('auth.tokenRequired' / 'auth.tokenRevoked' / 'auth.tokenExpired')` |
| 17 | `modules/kanban/application/kanban.service.ts:139` | `"WIP limit kamida 1 bo''lishi kerak"` | `i18n.t('errors.wipLimitMin')` (and `setWipLimit` is now `async`) |
| 18 | `modules/admin/application/services/admin-extra.service.ts:102` | `return { id, message: 'Topilmadi' }` | `i18n.t('errors.notFound')` |

**Total i18n-translated fixes:** 24 unique line edits across 16 files,
covering ~32 distinct Uzbek string occurrences (many files had multiple
leaks fixed in one pass).

**Marked-only fixes (`// I18N_LEAK: …`):** 14 occurrences across 6 files —
helpers/aggregates without DI:
- `modules/ecommerce/ecommerce-catalog.helper.ts` (5 occurrences)
- `modules/communication-center/application/cc-workflow/cc-workflow-approve.helpers.ts` (1)
- `modules/communication-center/application/cc-workflow/cc-workflow-reject-resubmit.helpers.ts` (1)
- `modules/finance/domain/aggregates/budget.aggregate.ts` (4)
- `modules/hr/domain/aggregates/leave-request.aggregate.ts` (3)
- `modules/director/domain/aggregates/approval-request.aggregate.ts` (3)

These keep the existing Uzbek string at runtime but document the matching
nestjs-i18n key for a follow-up refactor (would require either passing
`I18nService` into the helper signature or moving the throw up to the
service layer).

---

## 3. Remaining leaks deferred (with rationale)

| Area | Count | Rationale |
|---|---:|---|
| Telegram bot handlers (`hr/telegram-bots/**`, `communication-center/telegram/**`) | ~25 | The Telegram surface is its own UX channel. Bot messages need locale negotiation per-chat (stored on `users.preferredLang`), not per-HTTP-request. Out of scope of a request-language audit. |
| `compatibility/*-compat.service.ts` — `'Record not found'`, `'<field> majburiy'` | ~40 | Already English ("Record not found") or technical-field-name validation messages ("`employee_id va kpi_date majburiy`"). Low UX priority — replacing them would require a key per compat resource; flagged for a follow-up sweep. |
| `aisha/wake-config.controller.ts:45` | 1 | Director-only sensitivity controls; very rare path. |
| `communication-center/application/cc-org-resolver.service.ts` | 4 | Org-schema misconfiguration errors — fired only when the schema is incomplete on first deploy; operator audience. |
| `agents/*.service.ts` | ~6 | AI agent internal error proxies (`'OpenAI javob bo\`sh'`, `'Bu roll allaqachon ro''yxatga olingan'`) — not surfaced as primary UX text by current frontend. |
| Repositories returning `{ message: 'Yangilandi' }` as fallback row in `director/application/*.repository.ts`, `core/application/seven-functions.repository.ts` | ~11 | The pattern `(rows[0] ?? { message: 'Yangilandi' })` is a defensive fallback when an `UPDATE … RETURNING` returns no rows. Contract change (returning an empty object or 404) is the proper fix but it crosses the controller/service boundary documented in the brief as "if a fix would require restructuring an API contract, document it." |
| `weekly-plan.service.ts`, `lms-core.service.ts` returning `Err('Ruxsat yo''q' / 'Foydalanuvchi aniqlanmadi')` | ~5 | Result-pattern internal messages — they’re wrapped by the controller and surfaced through `GlobalExceptionFilter` only when the controller unwraps with `unwrapOrThrow`. The exact surfacing chain varies; the safer fix is at the controller layer. |
| `main.ts:93` rate-limit middleware message | 1 | Pre-DI Fastify hook, no access to `I18nService`. Could be wired via `app.get(I18nService)` after bootstrap; deferred. |

**Total deferred:** ~95 occurrences (most of which are either internal,
operator-facing, or pending a contract-shape decision).

---

## 4. nestjs-i18n locale files updated

| Path | Δ keys |
|------|------:|
| `apps/api/src/i18n/uz/errors.json` | **+13** new keys: `warehouseNotFound`, `categoryHasProducts`, `invalidOrderStatus`, `invalidPaymentStatus`, `documentOrQrNotFound`, `alreadyEnrolled`, `onlyDraftSubmittable`, `onlyPendingRejectable`, `onlyApprovedClosable`, `leaveCancelNotAllowed`, `rejectReasonTooShort`, `noApprovePermission` (and Russian parity) |
| `apps/api/src/i18n/ru/errors.json` | **+13** matching keys (translated) |
| `apps/api/src/i18n/uz/messages.json` | **+7** keys (new file): `orderCancelled`, `warehouseDeactivated`, `userDeleted`, `deleted`, `created`, `updated`, `saved` |
| `apps/api/src/i18n/ru/messages.json` | **+7** keys (new file, Russian) |

All existing keys preserved; no key was overwritten or removed.

**Note:** Re-running `pnpm --filter @europrint/api run build` will refresh
`apps/api/src/generated/i18n.generated.ts` (the file is auto-generated by
nestjs-i18n at startup in non-prod). I did not regenerate it here because
the brief said not to run `pnpm install`; tsc still passes because
`I18nTranslations['errors']` / `['messages']` is `Record<string, string>`-
compatible for `i18n.t('…')` calls (string lookup is permissive in this
codebase — confirmed by the surviving TS error count).

---

## 5. TS delta

| Phase | `error TS` count | Failing files |
|-------|-----------------:|---------------|
| Baseline (pre-audit) | **2** | `aisha/application/tools/schedule-meeting.tool.ts` (TS2352), `aisha/application/voice/elevenlabs.service.ts` (TS2307) |
| Post-audit | **2** | same two files; both unrelated to this audit |
| Δ | **0** |  |

Verified via:

```
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep "error TS"
```

---

## 6. Frontend leak detector — verification

```
node scripts/i18n-leak-detector.mjs --mode=static
→ { totalLeaks: 0, filesWithLeaks: 0, byKind: {}, byLocale: {}, topFiles: [] }
```

Confirmed: the previous 502 → 0 frontend baseline is unchanged. No
frontend file was modified during this audit.

---

## 7. Conservative API-contract notes (for follow-up)

Two response-shape changes were introduced that the frontend should be
ready for (both are additive — they keep the old `message` field):

1. `POST /api/wms/warehouses/:id/deactivate` now returns
   `{ message, code: 'WAREHOUSE_DEACTIVATED' }`.
2. `POST /api/orders/:id/cancel` now returns
   `{ message, code: 'ORDER_CANCELLED' }`.
3. `DELETE /api/admin/users/:id` now returns
   `{ message, code: 'USER_DELETED' }`.
4. `DELETE /api/camera/cameras/:id` now returns
   `{ message, code: 'DELETED' }`.

The `message` field is still present and is now request-language-aware
(via `Accept-Language` / `x-lang` / `?lang=`); the new `code` field is a
language-neutral identifier the frontend may translate locally instead of
trusting the server text. **No existing field was renamed or removed.**

---

## 8. Files modified

```
apps/api/src/i18n/uz/errors.json                                                       (additive)
apps/api/src/i18n/ru/errors.json                                                       (additive)
apps/api/src/i18n/uz/messages.json                                                     (new)
apps/api/src/i18n/ru/messages.json                                                     (new)
apps/api/src/common/guards/jwt-auth.guard.ts
apps/api/src/common/guards/roles.guard.ts
apps/api/src/modules/sd/orders/orders.service.ts
apps/api/src/modules/wms/warehouses/warehouses.service.ts
apps/api/src/modules/ecommerce/ecommerce.service.ts
apps/api/src/modules/ecommerce/ecommerce.repository.ts
apps/api/src/modules/ecommerce/ecommerce-catalog.helper.ts                             (I18N_LEAK comments only)
apps/api/src/modules/lms/enrollments/enrollments.service.ts
apps/api/src/modules/communication-center/presentation/cc-baskets.controller.ts
apps/api/src/modules/communication-center/presentation/cc-public.controller.ts
apps/api/src/modules/communication-center/application/cc-workflow/cc-workflow-approve.helpers.ts   (I18N_LEAK)
apps/api/src/modules/communication-center/application/cc-workflow/cc-workflow-reject-resubmit.helpers.ts (I18N_LEAK)
apps/api/src/modules/compatibility/document-workflow-v2.controller.ts
apps/api/src/modules/compatibility/document-workflow-v2.service.ts
apps/api/src/modules/compatibility/resources.service.ts
apps/api/src/modules/admin/presentation/controllers/admin-users.controller.ts
apps/api/src/modules/admin/application/services/admin-extra.service.ts
apps/api/src/modules/iot/presentation/iot-camera.controller.ts
apps/api/src/modules/auth/presentation/auth.controller.ts
apps/api/src/modules/kanban/application/kanban.service.ts
apps/api/src/modules/order-workflow/presentation/guards/order-transition.guard.ts
apps/api/src/modules/finance/domain/aggregates/budget.aggregate.ts                     (I18N_LEAK)
apps/api/src/modules/hr/domain/aggregates/leave-request.aggregate.ts                   (I18N_LEAK)
apps/api/src/modules/director/domain/aggregates/approval-request.aggregate.ts          (I18N_LEAK)
```

24 source files touched (4 locale-file edits/creates + 17 i18n-DI-edited
runtime files + 6 I18N_LEAK-annotated files).
