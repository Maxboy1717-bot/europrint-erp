# Part: comm-int-admin — modules: communication-center, chat, integration, admin (static-only; backend down)

Method: every route enumerated from 22 controllers; handler→service→repo followed; DB-proved with `_audit/q.cjs` (read-only). Global guards (5, incl JwtAuthGuard) confirmed in memory — controllers with only `@UseGuards(RolesGuard)` are still auth-protected globally.

## Route inventory: total 175
- GET 99 · POST 53 · PATCH 11 · DELETE 8 · PUT 4
- Per module: communication-center 30 · chat 56 · integration 69 · admin 20
- Per controller: cc-ai 4, cc-baskets 7, cc-documents 14, cc-notification-prefs 3, cc-public 1, cc-webhook 1 | chat 16, chat-ext 19, chat-reactions 6, chat-advanced 5, chat-advanced-uploads 5, chat-uploads 5 | integration-employee 17, integration-extended 22, integration-extended-hr 10(+pm-upcoming class 2)=12, integration-mro 11(+requests class 1)=12, sap 6 | admin-extra 8, admin-users 4, admin-queue 5, admin-settings 2, admin-cron-status 1

---

## 🔴 DECEPTIVE

1. `GET /api/admin/queues/status` | ⚠️200-MOCK | admin-queue.controller.ts:30 → admin-queue.service.ts:14,21-23 | `mockQueueStats()` returns hardcoded `{waiting:0,active:0,completed:100,failed:0}` for fixed queue names `['email','sms','report','sync']`. Real BullMQ infra EXISTS (`apps/api/src/modules/queue/` — processors email/forecast/label/mrp/pdf/telegram) but service never reads it; queue names don't even match real processors. | verdict: MOCK — pretends to monitor queues, returns invented stats.
2. `GET /api/admin/queues/failed` | ⚠️200-MOCK | admin-queue.service.ts:25-27 | `getAllFailed()` returns `{queues:[...failedJobs:[]], total:0}` literal — never queries BullMQ. | MOCK.
3. `GET /api/admin/queues/failed/:queue` | ⚠️200-MOCK | admin-queue.service.ts:29-31 | returns `{queue, failedJobs:[], total:0}` literal. | MOCK.
4. `POST /api/admin/queues/retry/:queue/:jobId` | 💀200-GREEN-LIE | admin-queue.service.ts:33-35 | `retryJob()` returns `{status:'retried', retriedAt}` without touching any queue — no job retried. | GREEN-LIE.
5. `DELETE /api/admin/queues/failed/:id` | 💀200-GREEN-LIE | admin-queue.controller.ts:63-65 | handler returns `{id, deleted:true}` inline; NO service call, no delete. | GREEN-LIE.
6. `PATCH /api/integration/mro/:id/approve` | 💀200-GREEN-LIE | integration-mro.controller.ts:131-135 | `approveMro` only `ApproveMroSchema.parse(body)` then returns `{id, approved:true}` — NO service call, no DB write. Sibling `PUT /api/integration/requests/:id/approve` (integration-mro.controller.ts:149) DOES call svc.approveRequest→real UPDATE mro_requests. So MRO requests have one real and one fake approve path. | GREEN-LIE.

(chat.controller.ts:307/315/369 from CLAUDE.md Qoida 10 are STALE — file is 245 lines now; those `return {ok:true}` green-lies were already refactored out. No `{ok:true}` in chat.controller.ts today.)

---

## ❌ 5xx
None confirmed. All handlers either delegate to Result-pattern services/repos with `.ok ? data : fallback` (no throw on empty), or use `unwrapOrThrow`/`assertOk` (which map service errors to 4xx/500 only on genuine failure, not statically provable). All referenced tables exist (DB-proved below) so no 503/500 from missing schema.

DB proof (all present): `cc_documents, cc_document_templates, cc_rejection_reasons, cc_approvals, cc_notification_prefs, expense_reports, invoices, employee_skill_scores, mro_requests, mro_items, mro_equipment, sales_orders(12 rows), sd_customers, chat_rooms, system_alerts, audit_log` — all `to_regclass` non-null.

---

## 🟠 404 / 501

- 501: NONE. `integration-employee.controller.ts:7` imports `notImplemented` but it is UNUSED — every `*List` handler returns real `db.execute`/svc data (the `@ApiResponse 501` swagger annotations are decorative leftovers; handlers never throw 501). Dead import only.
- 404-B (missing-vision, but documented placeholder, not a route gap):
  - `POST /api/cc/webhooks/:source` cc-webhook.controller.ts:94-96 — webhook-log persistence is a `SELECT 1` placeholder (comment: "webhook log jadvali keyingi versiyada"). NOT a green-lie for the main flow: HMAC verified, idempotency enforced, and `cc.spawn` event IS consumed (cc-event.listener.ts:62+ creates draft + kanban card). Only the audit-log line is a no-op. | verdict: FINE-with-noted-gap.
- 404-A/D: none (no FE-drift or prefix-drift routes found).

---

## 🟡🔵🔴 400 / 401 / 403

- 401 (FINE, intentional): all 22 controllers behind global JwtAuthGuard. cc-public.controller (`@Public()`, GET /api/cc/verify/:id) intentionally open (QR verify by external auditors — 10 req/min throttle, returns only doc validity + truncated sig hash). cc-webhook is unauthenticated by design but HMAC-gated. Count: 173 routes require JWT (FINE); 2 public-by-design (cc/verify, cc/webhooks).
- 403 (RBAC FINE): @Roles on every controller; SAP restricted to super_admin/director/sales_manager; admin-* to super_admin/director (settings PATCH + user role/delete super_admin-only). cc-baskets `move→archived` and `getOne` privilege checks (ForbiddenException) correct. No misconfig found.
- 400 (Zod FINE): all @Body handlers use ZodValidationPipe or `.parse()`. No drift bugs.
- Minor (not deceptive, 200-instead-of-404): `GET /api/admin/system/alerts/:id` admin-extra.service.ts:103-109 `getAlertById` returns `{id, message:'not found'}` with HTTP 200 when alert missing instead of 404 (Qoida 11). Low severity.

---

## ✅ FINE (grouped, counts)

- communication-center REAL (29 of 30): cc-baskets (7) → CcBasketsService/CcStatsService real DB; cc-documents (14: templates, rejection-reasons, pin set/status, draft/send/approve/reject/resubmit/cancel/complaint/print, pdf) → CcWorkflowService/CcPinService/CcPdfService real DB (cc-documents-write.repo, cc-notification-prefs upsert ON CONFLICT proven); cc-ai (4) → CcAiInterviewService (Claude interview, real session state); cc-notification-prefs (3) → real upsert; cc-public verify (1) → real join cc_documents/cc_approvals/users. cc-workflow `{ok:true}` returns are AFTER real DB writes (cc-workflow.service.ts:223,240 etc.).  (1 noted gap = webhook audit placeholder, counted under 404-B.)
- chat REAL (56): all rooms/messages/members/read/mute/unread/pinned (chat.controller 16, incl raw UPDATE chat_rooms in updateRoom), reactions/polls/edit/delete (chat-reactions 6, chat-advanced 5), threads/forward/upload (chat-advanced-uploads 5), notifications/search/tasks/context-room/admin-rooms/audit (chat-ext 19), push/upload/video-token (chat-uploads 5) → ChatService + sub-services real DB; pin/unpin/star delegate to msgSvc (real). `{ok:true}` in chat-uploads:96,107,159 are post-write acks (pushService.register / sendMessage), not lies.
- integration REAL (66 of 69): integration-employee (17) real db.execute on employee_skill_scores/expense_reports/invoices + svc; integration-extended (22) MRO/expense/GL/three-way-match via IntegrationExtendedMroRepository real DB; integration-extended-hr (12) hr-lms/employee-rating/vendor-performance/pm-upcoming real repos; integration-mro (11 real of 12 — minus the fake PATCH approve #6) items/requests/equipment/stats/budgets/cleaning/utility/facilities + real PUT requests approve; sap (6) listSalesOrders/get/create/update/patch/delete → sap.repository.ts real DB on sales_orders LEFT JOIN sd_customers.
- admin REAL (15 of 20): admin-users (4) create/list/role/delete → CQRS services + drizzle-user.repo real DB (softDelete); admin-settings (2) get/patch → ISettingsRepo real; admin-extra (8) roles(static const, acceptable)/logs/audit/audit-filtered/audit-tables/system/alert/login(compat stub→points to /api/auth/login); admin-cron-status (1) → CronStatusService real in-memory job registry.  (5 admin-queue routes = deceptive #1-5.)

---

## COUNTS (sum = 175)
- ✅ 200-REAL: 165
- ⚠️ 200-MOCK (deceptive #1,2,3): 3
- 💀 200-GREEN-LIE (deceptive #4,5,6): 3
- 🔵 401 by-design open endpoints counted within REAL (cc/verify, cc/webhooks): webhook(1) noted as FINE-with-gap (404-B), already in REAL tally
- 🟠 501: 0 (dead `notImplemented` import only)
- ❌ 5xx/503: 0
- Sub-notes (not separate routes): admin/system/alerts/:id 200-instead-of-404 (counted REAL); cc/webhooks audit placeholder (counted REAL).

Breakdown check: 165 REAL + 3 MOCK + 3 GREEN-LIE = 171 ... remaining 4 reconciliation: the 3 MOCK + 3 GREEN-LIE are 6 deceptive; 175 − 6 deceptive = 169 REAL. Corrected: ✅200-REAL = 169, ⚠️200-MOCK = 3, 💀200-GREEN-LIE = 3. Sum = 175. ✓
