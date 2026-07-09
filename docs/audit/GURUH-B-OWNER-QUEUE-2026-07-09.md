# Guruh-B Owner Queue — Vision-Build Loop first-pass (2026-07-09)

The Vision-Build Loop processed **all 14 in-scope modules once** and shipped **44 commits** of
code-only, unblocked, tested, DB-proven fixes (Guruh-A). Everything below is **Guruh-B**: it
needs an owner **decision**, **data/seed**, a **new table/column** (Q-35), a **cross-module
policy**, or an external **credential/infra** — none can be fabricated. Grouped by decision type;
per-module index at the end. Answer any subset and it converts to buildable Guruh-A.

Branch: `chore/schema-convergence`. Loop commits: `b0f3c144`..`0346b2e6`.

---

## 1. Policy / decision (pick an option — no new schema needed)

1. **CRM row-level scoping (#35).** Which roles see ALL leads/deals vs only their own
   (`assigned_to`=self)? Specifically: is `sales_manager` see-all or see-own? is `crm_manager`
   different? are `director`/`super_admin` the only see-all roles? *(Not defined anywhere in code.)*
2. **SD delivery → WMS stock-out firing point (#51).** Stock leaves at `in_transit`, at
   `delivered`, or at delivery-create? (Currently fires on either in_transit/delivered, deduped.)
3. **MES shift-handover close-gate.** Option A: wire the real shift id into `from/to_shift_id` on
   both create paths. Option B: department+date semantics + fix the canonical accepted-status set.
4. **MES frozen-zone gate.** ✅ **OWNER-CONFIRMED-NO-ACTION (2026-07-09):** the existing PP
   `PATCH /pp/orders/:id/flags` (director+audit) is sufficient — do NOT build a MES-side
   operator-block. The retro-qty-edit-block alternative (invert meaning + FK + reason column)
   is rejected. No code change.
5. **Kanban status→column auto-move.** Provide the SD-status → Kanban-column map (e.g.
   confirmed→"Jarayonda", cancelled→"Bekor"). Today only an auditable note is written.
6. **Notifications role-broadcast.** 6483 `LOW_STOCK` rows are written with `user_id=0` but the
   feed filters `user_id=self`, so nobody sees them. Route by role via `notification_routing_rules`,
   or surface `user_id=0` to all matching roles?
7. **Notification preferences model.** The settings page sends a per-type × per-channel matrix but
   the table stores only 9 flat category booleans (silent fake-save both ways). Add per-type
   storage (§3), or redesign the page to the flat model?
8. **Director by-department join world.** Should director by-department reporting join
   `departments` (HR/general) or `org_departments` (org-structure)? `production_orders
   .org_department_id` is now read but the two department worlds must be reconciled.
9. **PP daily-replan ordering.** Persist a `production_orders.queue_sequence` column (§3) or keep
   ordering computed read-only?
10. **Inventory variance auto-approve ±N% limit** (POS/WMS) — owner numbers. *(Batch-5 Item 10
    owner-decision: NO percentage auto-approval ever; every variance auto-detected/flagged but
    human-confirmed before close — pending build.)*
    **GSD 3-indicator KPI weights** — ✅ **OWNER-CORRECTED-PREMISE (2026-07-10):** this org uses
    **CKP** (Cennaya Konechnaya Produkciya / per-position Valuable Final Product, per the
    Hubbard/Vysotsky methodology — see live `company_tskp`, `org_departments.tskp_measurement_unit`,
    `ai_ckp_scores`), **not** a generic weighted-KPI model; no KPI-weight config is needed. If
    GSD/ombor-kassir participants need a performance measure it routes through the same CKP mechanism
    as every other position, not a separate KPI system. *(Whether GSD/kassir positions have
    per-position `tskp_target` populated is a separate data-check — flagged, not built.)*
11. **CC protocol quorum %** (2/3?) and **PP split vs work-splitting** semantic collision (#8/#15).

### ✅ 2026-07-09 build-pass — owner answers applied (8-item batch)
Owner answered 8 items; built the buildable ones (commits on `chore/schema-convergence`):
- **§1.3 MES shift-handover (Option A):** accepted-status set unified to `'completed'` ✅ `8368657b`.
  **BUT shift-id wiring BLOCKED** → still open, see new blocker A below.
- **§1.4 MES frozen-zone:** OWNER-CONFIRMED-NO-ACTION ✅ (marked above).
- **§1.5 Kanban status→column:** mechanism built, ships INERT ✅ `a2499ab0`. Activate by inserting
  rows: `INSERT INTO kanban_status_column_map (sd_status, kanban_column_id) VALUES ('<sd_status>', <col_id>);`
  (owner supplies the map later — no code change needed; board 2 columns = 16 Kiruvchi/17 Jarayonda/18 Bajarildi).
- **§1.6 LOW_STOCK role-broadcast:** fixed ✅ `1762c6c8` — now fans out per-user to `warehouse_keeper`
  (rule + fallback retargeted from `pos_manager`). ⚠️ existing `user_id=0` broadcast rows left as historical
  (not backfilled — non-destructive); **0 active `warehouse_keeper` users exist yet** → seed warehouse users.
- **§1.7 Notification preferences:** granular `notification_type_preferences` table built + real save/load ✅
  `d39c33e5` (A4 uuid/int entanglement confirmed SEPARABLE — create-notif DTO untouched).
- **§1.11 PP split naming:** LUGAT ruling ✅ `8b35f2e3` — no code conflates the two; operation-split =
  WILL-NOT-BUILD (EP-PP-063); partial-delivery build = #19.

### 🔶 NEW blockers surfaced this pass (owner decision needed)
- **A. MES shift-handover real shift id (Option A) — BLOCKED on data.** `shifts` master table is EMPTY
  (0 rows, no morning/afternoon/night seed) and neither create path receives a shift id (FE conflates
  "shift" with `mes_sessions.operator_id`). Need: (a) seed `shifts` per department; (b) decide the shift-id
  SOURCE — FE-supplied `from/to_shift_id`, or BE-resolved from `shifts` by department+time. Wiring is small
  once both exist. `from/to_shift_id` are unconstrained ints (no FK) so a value is only meaningful after seed.
- **B. CRM row-level scoping — ownership column ambiguous + writes fragmented.** Owner said filter
  `assigned_to = self`, but live `crm_leads.assigned_to` is 100% EMPTY and `crm_deals` has NO `assigned_to`
  column; the only populated owner col on both is `assigned_by_id`. WORSE: the 3 lead WRITE paths all write
  `assigned_to`, while seeds/deals write `assigned_by_id` — so filtering on `assigned_by_id` would hide a
  manager's own just-created leads. Decide the canonical ownership column and converge the writes to it
  (recommend `assigned_by_id` everywhere, or read `COALESCE(assigned_by_id, assigned_to, created_by_id)`),
  THEN the filter is safe. Also 3/11 leads have NULL owner (invisible to managers post-scoping) + FE list
  totals assume "see all". First-ever row-level RBAC pattern here → build the scope helper reusably.
- **C. SD stock-out → POS goods-issue (3a) — coupled to 3b; removing #51 risks silent under-issue.**
  The POS `EXTERNAL_OUT` completion path ALREADY decrements the same `warehouse_stock` inline, so running it
  AND the delivery-status `#51` listener double-counts. BUT there is NO link today between an SD delivery and
  a POS movement (`pos_movements` has no `sales_order_id`/`delivery_id`; live `EXTERNAL_OUT` count = 0). So
  simply retiring #51 would leave customer-shipment FG-out **never decrementing** unless the warehouse keeper
  records a POS movement per delivery — which is exactly the 3b workflow (below). **3a should land WITH 3b**,
  not before. Owner confirm: is POS-Monitor `EXTERNAL_OUT` the canonical customer-shipment goods-issue?
- **3b (SCOPE — not built).** Zayavka/delivery-request → CC approval → warehouse POS fulfilment. Fits as
  CONFIG/DATA, not new schema: one `cc_document_templates` row (code `DELIVERY_REQUEST`, `ai_questions`
  defining request fields: when/where/vehicle/price/extras/SO-ref) + `cc_workflow_steps` rows for its
  approval route; the request payload lives in `cc_documents.ai_answers` (jsonb). Gap: no template-create
  endpoint (CC controller has only draft/send/approve) and no approved-request→POS-issue link. Rough size:
  ~0 new tables (reuse cc_documents), 1 template + steps seed, ~2–3 files to wire request→approval→POS
  reference on `pos_movements`. Owner to greenlight as a dedicated future pass.

## 2. Master-data / seed (provide the values — schema already built)

- **PP reason-code vocabulary** (`pp_reason_codes` — CRUD live, 0 rows): delayPareto/5-group codes
  (code, uz/ru name, category, color).
- **CRM loss-reason taxonomy** + **voronka stage names** (`crm_stages`=0): the factory stage set
  (Namuna→STP→Narx→Shartnoma→Buyurtma) and loss-reason list.
- **LMS course↔card bindings** (`courses.card_id` 0/5, `enrollments.card_id` 0/15 — code ready):
  which darsliklar bind to which org-cards; + pass-score per course_type.
- **IoT downtime-reason additions** ("иш йук"/"колиб тайёр эмас"/"переделка") and **camera/sensor
  CAPEX** (which machines get which sensors).
- **Director**: stat-regulation / ideal-rasm / OKR-cascade seed values; resolve the OKR key-results
  orphan (all 201 point to one objective); **#9 root-cause** — pick the canonical model (5-why
  `why1-5/entity_*` vs flat `code/name/category`) + seed (`qc_root_causes`=0) + add a director rollup.
- **CC council master-data** (`council_members`=0, `councils.chairperson_id` NULL).

## 3. New table / column — needs Q-35 sign-off

- **CRM**: `crm_deals.lost_reason_id` column + seed; `crm_lead_stage_history`/`crm_deal_stage_history`
  tables; `card_id` FK on CRM entities; the `crm_deals.sales_order_id` DB FK constraint.
- **Marketing**: campaign `goal_type`/promo-code/`approved`-status columns; lead
  `product_type`/`region`/`referrer` columns; `brand_passport`/brief/UTM tables.
- **Kanban**: WIP-override-log table; `task_escalations` table; reopen reason/history; `confidential`
  column; CAPA `card_files.linked_qc_id` FK.
- **CC**: `deleted_at` + coordination audit table (retention; today dokla/rasporyazhenie hard-delete);
  `document_hashes` (PDF SHA-256); a `confidential`/`visibility` column for RBAC doc-view; PIN
  `unique(document,card,step)` index; meetings/agenda/attendance/votes tables.
- **IoT/MES**: machine `norma_per_hour/12h` table; IoT PM-schedule table; Andon big-screen table;
  tablet-idempotency partial-unique index (columns already exist).
- **PP**: `queue_sequence` column (see #9 above); `production_order_operations` data for progress-%.
- **LMS**: kaizen PDCA columns; nazorat-varaqa/rubric/12-topic/exercises/glossary tables;
  `micro_module_views.last_position`.
- **Notifications**: `notification_type_preferences` (or a `preferences` jsonb); SLA/`ntf_outbox`/
  `ntf_bot_health`/`ntf_doc_views` tables.
- **Marketing/Director**: GL "reklama xarajati" sub-code; delay_count/plan_deviation counters;
  daily_plan/operation_norm/control_sheet tables.

## 4. Cross-module event maps (need the consumer/contract defined)

- Coordination → module golden-thread events (protocol-decision → auto-rasporyazhenie?).
- MES→POS auto FG-kirim (`mes.session.completed` emitted; no POS FG-receipt listener) — which FG
  warehouse + how to resolve material/qty + a `FG_FROM_MES` movement-type seed.
- POS low-stock → auto purchase-requisition (today only notifies); QC→CRM reclamation; PP→SD ATP
  feedback; seasonal-demand → PP orientir; NPS ↔ `qc_reclamations` "wrong-time" defer gate.
- CC → kassir: confirm CC only emits outbox events and Finance owns the reversal/GL (two-worlds gate).

## 5. Gated (external / blocked)

- **AI keys** (owner data): CRM/Marketing/LMS/Director AI chatbots, churn/NBA extensions, AI PDF
  reports, camera-AI vision model.
- **Provider creds**: real SMTP / Telegram / SMS delivery (adapters exist, need creds).
- **Standing blockers** (out of loop scope): Org-01 structural (G5/G9/G10), HR-02 razryad/salary,
  Finance-03 SoD (needs real FINANCE_OFFICER users), org-card canonicalization, head_user_id
  completeness, bilingual/Cyrillic (F1/F3).

## 6. Low-value residuals (real but de-prioritized — no FE caller / cosmetic)

> **Pass-2 (2026-07-09) update.** Re-triaged all 7 residuals; built the confirmed Guruh-A
> parts (each with a DB-proof + a behavioral/render test), reclassified the rest as Guruh-B.
> ✅ = shipped this pass, → B = stays owner-gated.

- Marketing A2 campaign-stats — ✅ **shipped** `16147dc3`: both stats endpoints now take the raw
  varchar slug id (was `Number(id)`→NaN→500) and aggregate `marketing_ads` only for numeric-shaped
  ids (honest-zero for slugs). → B: the int `ads.campaign_id` ↔ varchar `campaigns.id` join is a
  data-model decision.
- Marketing A4 score-weight constants — ✅ **shipped** `91aca52a`: weights moved to
  `LEAD_SCORE` in business.constants.ts (values unchanged; rollback-tx proof 12 leads).
- Notifications A2 (read `body`) + A3 (markAllRead `is_read`) — ✅ **shipped** `9400075d`.
  → **A4 reclassified Guruh-B**: the create DTO `z.string().uuid()` vs integer `user_id`/`reference_id`
  ripples into the aggregate's string-vs-int `userId` model + notification-system unification — a
  cross-cutting design decision, not a mechanical fix. Still **no FE caller** for the canonical reader.
- Kanban getTaskStats 2× `due_date::timestamp` — ✅ **shipped** `79b70747`: both casts regex-gated
  (`~ '^\d{4}-\d{2}-\d{2}'`), time-of-day preserved; DB-proof over garbage/'' rows.
- Director bot `/kpi` — ✅ **shipped** `e9ef01d9`: re-pointed from the phantom `kpi_metrics` table to
  the canonical `kpi_definitions JOIN kpi_values` (same source as the dashboard); DB-proof 6 real KPI
  rows. `/ai` + `/summary` already hit real tables. Director company-state cron 06:00→07:00 — ✅
  **shipped** `5173d1d8`. → B: extra bot commands (`/holat`,`/kundalik`,`/ideal_rasm`) need the owner
  to define the intended command surface (+ Telegram token to live-test).
- POS `movement_type_id` never written — ✅ **shipped** `2099949e` (code column was the only one set).
  → No action: `pos-stub.controller` is a **misnomer** — all its endpoints do real work
  (StockLedgerService + a real `pos_stock_ledger` insert); only the "Stub" name/tag is stale. Per Q-46
  (working code isn't touched) a rename is cosmetic/risky and deferred.

### 6b. Pass-2 re-scan finds (same bug class: coercion / phantom-table / green-lie)

- CRM invoice stage/delete uuid id — ✅ **shipped** `0c7960ca`: `crm-bitrix-compat` did
  `parseInt(id,10)||0` on a **uuid** `invoices.id` → `eq(id,'0')` threw *invalid syntax for uuid*, so
  `PATCH /invoices/:id/stage` + `DELETE /invoices/:id` never touched the row. Threaded the raw string id
  through controller→service→repo→interface; sibling proposals use integer `crm_proposals.id` (unchanged).
- MM `getMaterial` reads `materials`(uuid) via `eq(id, String(number))` with an `id: number` signature —
  → **B (needs investigation)**: no clear mm-controller caller, and it sits on the `materials`(uuid) vs
  canonical `material_cards`(integer) ambiguity — which table MM should read is a semantic/owner call, not
  a mechanical fix. Not forced.
- Scanned but clean: `crm_proposals`/`crm_robots`/`design_tooling`/`product_categories`/`public_products`/
  `purchase_orders`/`routings` all have **integer** ids (parseInt/String are correct). `finance/budgets`
  has the same `String(id)` shape but **Finance-03 is a standing-blocked module** — not inspected/touched.

---

## Per-module index (Guruh-A shipped this loop / what remains)

| Module | Guruh-A shipped (this loop) | Remaining = Guruh-B |
|---|---|---|
| MES 08 | tablet-downtime catalog+reason_code_id; checklist CRUD; breakdown→maintenance | handover gate, technician roster, ~~frozen-zone~~ (OWNER-CONFIRMED-NO-ACTION 2026-07-09), PM table |
| QC 09 | FMEA stop-production; production→QC→delivery traceability | mm_goods_receipts FK; AQL/quarantine master-data |
| WMS 10 | failed-QC→scrap; movement photo; Pres-kirim | (delivery firing point → SD) |
| SD 06 | delivery→WMS stock-out; advance 30→70; quotation→order outbox; order-detail page; items endpoint; clone dialog | firing point; PDF+deadline; expose flags in GET :id |
| PP 07 | status-lifecycle endpoint+audit; override justification; reason-codes CRUD; plan CSV export | vocabulary seed; replan column; reservation; progress; split-gate |
| CC 04+20 | self-route SoD; unresolved-route journal+notify; delegation cap; basket pagination; Prikaz/Protocol UI | RBAC filter; retention; events; hashes; quorum; councils |
| CRM 13 | loss-rollup 500 fix; mark-deal-lost (uuid); lead engagement; **P2: invoice stage/delete uuid id** | #35 scoping; taxonomy; stages; aging; history tables |
| Marketing 14 | lead varchar-id fake-save; phone VO normalize; **P2: campaign-stats varchar id + ads guard (A2); LEAD_SCORE constants (A4)** | ads↔campaign int-vs-varchar join; goal-type/promo cols; product/region cols; brand/UTM tables |
| Kanban 15 | parent/due fake-save; due_date report hardening; order-status card-sync; **P2: getTaskStats both `due_date::timestamp` regex-gated** | auto-move map; WIP/escalation tables; confidential |
| IoT 16 | session order/target; defect real count; downtime picker repoint | sensors/camera CAPEX; norma table; produced-count capture |
| LMS 12 | certificate detail/download real data | card bindings; PDCA/rubric tables; full legal PDF |
| Notifications 18 | NotificationCenter category field; **P2: reader reads `body` (A2); markAllRead sets `is_read` (A3)** | A4 uuid-vs-int DTO/aggregate; per-type prefs storage; broadcast policy; SLA/outbox tables |
| Director 05 | plan-fact/order-progress org_department_id; (+coordination-docs UI); **P2: bot `/kpi` canonical KPI source; company-state cron →07:00** | extra bot commands (surface+token); #9 root-cause; two-world join; plan/norm tables |
| POS 19 | KIRIM header supplier/document; KIRIM line batch/lot; **P2: persist `movement_type_id`** | MES→POS FG-kirim; low-stock→PR; techcard gate FE |
