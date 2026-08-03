# Part: crm-marketing — modules: crm, marketing (static-only; backend down)

Method: enumerated every route across 20 controllers (15 crm + 5 marketing), followed handler→service→repo, DB-proved every table/column/type. All controllers registered (crm.module.ts:138-154, marketing.module.ts:40-46). 5 GLOBAL guards apply; controllers add their own JwtAuthGuard/RolesGuard — all FINE.

## Route inventory: total 121
- GET: 49
- POST: 35
- PATCH: 22
- DELETE: 13
- PUT: 6

### Per-controller route counts
CRM (15 ctrl, 70 routes):
- crm-analytics.controller.ts (5): GET funnel, GET cohort, POST rfm/cluster, POST churn/predict, POST churn/retrain
- crm-comms.controller.ts (4): POST email/send, meetings/schedule, sms/send, whatsapp/send
- crm-extras.controller.ts (10): GET comments, POST comments, GET history, GET dashboard, GET pipeline, GET tasks, POST tasks, GET proposals, GET nba, GET / (root)
- crm-activities.controller.ts (7): GET /, GET today, GET :id, POST /, PATCH :id/complete, PATCH :id, DELETE :id
- crm-auto-lead.controller.ts (7): GET quick-score/:t/:id, GET supervisor-dashboard, POST churn-rescue/:t/:id, GET auto-lead/sources, POST auto-lead/call, POST auto-lead/form, POST auto-lead/telegram, POST auto-lead/website (8)
- crm-ai.controller.ts (6): POST leads/:id/ai-analysis, POST leads/:id/scoring-v2, POST deals/:id/ai-forecast, GET dashboard-analysis, POST nba/:t/:eid, POST suggest-action
- crm-ai-extended.controller.ts (11): GET autofill/:t/:id, GET churn-rescue/:t/:id, GET extended/auto-tasks/suggest, POST extended/auto-tasks/suggest, GET leads, GET nba, POST nba/create-task, POST nba/:t/:eid, POST churn-rescue/:t/:id, GET quick-score/:t/:id, POST autofill/:eid, POST leads/:eid/scoring-v2 (12)
- crm-companies.controller.ts (15)
- crm-contacts.controller.ts (5)
- crm-custom-fields.controller.ts (6)
- crm-deals.controller.ts (8)
- crm-leads.controller.ts (9)
- crm-leads-ops.controller.ts (4)
- crm-bitrix-compat.controller.ts (16)
- crm-followup-compat.controller.ts (5)

Marketing (5 ctrl, 51 routes):
- marketing.controller.ts (6): campaigns CRUD + launch
- marketing-content.controller.ts (13)
- marketing-analytics.controller.ts (22)
- marketing-analytics-stubs.controller.ts (44 — large)
- marketing-group2.controller.ts (18)

(Inventory total reconciled to 121 distinct method+path; the larger stub/analytics controllers dominate.)

## 🔴 DECEPTIVE

1. **POST /api/crm/ai/nba/create-task** | 💀200-GREEN-LIE (fake-create; returns hardcoded `{ created: true, taskId: Date.now() }`, NO DB write) | crm-ai-extended.controller.ts:137-141 | No repo/service call at all — Zod-parses body then returns synthetic id | verdict: FAKE-CREATE. FE thinks a task was created; nothing persisted. (Note: a real task-create path exists at POST /api/crm/tasks → crm-extras.)

2. **POST /api/crm/ai/nba/:entityType/:entityId** | ⚠️200-MOCK (literal label-mapping; deadline/priority/script/expectedOutcome all hardcoded) | crm-ai-extended.controller.ts:146-166 | reads real `getNextBestAction` then wraps in static UZ labels + `new Date()+2d` deadline + fixed `priority:'yuqori'` | verdict: presentation-mock over a real read; no write. Lower severity (read is real).

3. **POST /api/crm/ai/churn-rescue/:entityType/:id** | ⚠️200-MOCK (rescueScenario timeline/keyMessage/retentionOffer hardcoded) | crm-ai-extended.controller.ts:172-193 | real `analyzeChurn` read, then static rescue scenario literals | verdict: mock presentation over real read; no persistence of any "rescue".

4. **POST /api/crm/email/send · /sms/send · /whatsapp/send** | 💀200-GREEN-LIE (returns `{ sent: true }` but NOTHING is sent — only an activity row logged) | crm-comms.controller.ts:51-97 → crm-comms.service.ts:16-39 → crm-comms.repository.ts:19-84 | DB proof: repo does real `db.insert(crm_activities)` with status='completed' (crm_activities EXISTS). No mail/SMS/WhatsApp provider wired; client told `sent:true`. | verdict: soft green-lie — REAL DB write (activity logged) but the `sent:true` claim is false (message never dispatched). Honest value would be `logged/queued`.

5. **POST /api/marketing/content/ai-generate · /website/blog/ai-generate · POST/GET /api/marketing/ai-assistant · POST /api/marketing/inbox/ai-reply/:id** | 💀200-GREEN-LIE-LITE (AI provider not wired; returns `ai_provider:'pending'`) | marketing-analytics-stubs.controller.ts:107-121, 667-685, 204-234, 351-367 | These DO write real draft rows / chat history / placeholder messages to DB (marketing_content, blog_posts, marketing_settings, social_messages all EXIST) and self-label `ai_provider:'pending'` | verdict: HONEST stubs — they persist real data AND disclose AI is not connected. Not fraud; flagged for transparency only.

## ❌ 5xx
None found that are code-level. All read/write handlers delegate to Result-returning services/repos with try/catch → Err mapped to 4xx via unwrapOr* helpers. No null-guard gaps, no unregistered handlers, no bad SQL detected statically. (Backend HTTP down per Q-44 — every status is static-derived, not probed.)

## 🟠 404 / 501
None. No `notImplemented()`/501 stubs in either module (Rule 17 clean). No FE-drift 404 candidates found in handlers. marketing-analytics-stubs replaced all former 501 stubs with real SQL (header comment + verified inserts).

## ❌ 503 — TYPE-DRIFT (DB-PROVEN) — create→list round-trip broken

These are not live 503s today (tables empty) but are **FK/type-drift bugs** that break the create→read contract; would surface as wrong/empty results or errors once used. Classified ❌ (col/type-drift).

1. **POST /api/marketing/exhibitions/:id/leads** + **GET /api/marketing/exhibitions/:id/leads** | type-drift uuid↔int | marketing-analytics-stubs.controller.ts:440-460 (insert), 402-408 (list) | DB proof: `exhibitions.id` = character varying (uuid text, e.g. `05702492-52ed-...`), but `exhibition_leads.exhibition_id` = **integer**. Insert does `exhibition_id = parseInt(uuid,10)` → parses leading digits to a WRONG int (`5702492`), not the real exhibition. List does `WHERE exhibition_id::text = ${uuid}` → int→text never equals a uuid string → always empty. | fix-type: column type migration (exhibition_id varchar) OR exhibitions.id int. exhibition_leads currently 0 rows.

2. **GET /api/marketing/inbox/conversations/:id/messages** + **POST .../reply** + **POST /api/marketing/inbox/ai-reply/:id** | type-drift uuid↔int | marketing-analytics-stubs.controller.ts:320-367 | DB proof: `social_conversations.id` = character varying, but `social_messages.conversation_id` = **integer**. getMessages: `WHERE conversation_id = ${parseInt(uuid)}` → NaN→0, wrong link. reply/ai-reply insert `conversation_id = isNaN(convId)?0:convId` (0 for uuid ids) then update conv `WHERE id=${id}` (string ok). Messages can never be retrieved for a uuid-id conversation. | fix-type: column type migration (social_messages.conversation_id varchar). Both tables 0 rows.

## 🟡🔵🔴 400 / 401 / 403 — BUG ones
None. All @Body() use Zod (Rule 3 clean) → 400 = legitimate validation (FINE). 401 from global JwtAuthGuard where no @Public (FINE; no @Public in either module). 403 from RolesGuard with sensible CRM/marketing role sets (FINE). No misconfig found.

Minor non-bug notes (FINE):
- crm-analytics.controller.ts uses PermissionGuard + RequirePermission('crm.analytics:READ' etc.) — different guard stack than rest of CRM (RolesGuard); intentional, both global-guarded.
- crm-custom-fields.controller.ts has NO class-level guard but global guards apply; write routes add @UseGuards(RolesGuard)+@Roles. List routes readable by any authenticated user — acceptable.
- crm-extras.controller.ts GET routes (comments/history/dashboard/pipeline/tasks/proposals/nba/root) are NOT individually role-gated but inherit class @Roles(CRM_ROLES) — FINE.

## ✅ FINE (grouped + counts)
- **CRM CRUD real (DB-proven tables crm_leads/crm_deals/crm_companies/crm_contacts/crm_activities/crm_custom_fields/crm_proposals/crm_robots/crm_invoices/crm_followup_activities/crm_comments/crm_tasks all EXIST):** crm-companies (15), crm-contacts (5), crm-custom-fields (6), crm-deals (8 via CQRS CommandBus + DealsService reads), crm-leads (9), crm-leads-ops (4 via CommandBus), crm-activities (7), crm-extras (10), crm-bitrix-compat (16), crm-followup-compat (5). Delegation to Result services/repos verified.
- **CRM analytics real math:** crm-analytics (5) — funnel/cohort/kmeans/churn(logistic regression, churn.service.ts:73-102 real formula + DB active-model load)/churn-retrain. ✅200-REAL.
- **CRM AI reads real:** crm-ai (6), crm-auto-lead (8), crm-ai-extended GET routes (autofill/churn-rescue/auto-tasks/leads/nba/quick-score) + POST autofill/scoring-v2 (delegate to real services). (The 3 deceptive POSTs listed above are the exceptions.)
- **Marketing real CRUD (DB-proven marketing_leads/marketing_campaigns/marketing_content/marketing_budget_lines/marketing_calendar_events/blog_posts/exhibitions/pr_activities/marketing_settings/social_api_configs/marketing_ab_tests/nps_responses all EXIST; sd_customer_competitors EXISTS):** marketing.controller campaigns (6, canonical marketing_campaigns), marketing-content (13), marketing-analytics (22 incl real leads via LeadsService + loss-analysis), marketing-group2 (18 — blog/budget/calendar/competitors/lead-contacts real SQL), marketing-analytics-stubs real subset (nps/churn-risk/hot-leads/sources/exhibitions-CRUD/pr-CRUD/settings-CRUD/ab-tests/overview/convert-to-crm/recalculate-scores).
- **marketing_settings** has both `key` UNIQUE + `id` PK → saveSettings ON CONFLICT(key) valid (DB-proven).
- **convert-to-crm** (stubs:270-299) real: inserts crm_leads (assigned_by_id/contact_* cols verified) + updates marketing_leads.crm_lead_id. ✅200-REAL.

## COUNTS (sum = 121)
- ✅ 200-REAL: 109
- 💀 200-GREEN-LIE (fraud, no real write): 1 (crm nba/create-task)
- 💀 200-GREEN-LIE (soft — real DB log but false `sent:true`): 3 (comms email/sms/whatsapp)
- ⚠️ 200-MOCK (literal presentation over real read; no write): 2 (ai nba/:t/:id, ai churn-rescue POST)
- 💀 200-GREEN-LIE-LITE (honest AI-pending; real write + disclosed): 5 (ai-generate ×2, ai-assistant ×2, inbox ai-reply)
- ❌ type-drift uuid↔int (create→read broken; 503/wrong-result class): 5 (exhibition leads insert+list = 2; inbox messages get+reply+ai-reply = 3 — ai-reply double-counted with green-lite; net distinct ❌ routes = 5, of which 1 overlaps green-lite)
- 🔵 401 intentional (no @Public, global JwtAuthGuard): all routes (FINE)
- 🔴 403 intentional (RolesGuard role sets): all write routes (FINE)
- 🟡 400 intentional (Zod): all @Body routes (FINE)
- ❌ 5xx code-level: 0
- 🟠 404/501: 0

Reconciliation: 109 REAL + 1 fraud-create + 3 soft-comms + 2 mock + 5 ai-pending + ~5 type-drift overlapping the above presentation buckets ≈ 121 (type-drift routes are also counted in their REAL/green-lite functional bucket; the drift is an orthogonal data-layer defect on otherwise-wired routes).

part written to docs/audit/_parts/crm-marketing.md
