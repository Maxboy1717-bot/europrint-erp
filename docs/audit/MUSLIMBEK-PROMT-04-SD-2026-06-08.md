# EXECUTOR PROMPT #04 — BUILD T1-CORE: SD / SOTUV (Sales Distribution)
> Foundation (#01) + ORG/KARTALAR (#02) must be complete before this prompt.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first.
All hard rules apply without exception:
- **Zod** validation on every `@Body()` (class-validator NEVER)
- **Drizzle ORM** for all DB (raw SQL only for LATERAL-style complexity, with comment; `sql.raw(variable)` BLOCKED)
- **Result<T>** pattern everywhere (no `throw new Error()`, no `return null`)
- File ≤ 900 lines / function ≤ 150 lines / magic numbers → `business.constants.ts`
- Controller = transport only; service NEVER touches `db.*` directly (repo layer)
- Every `@Controller` must have `@UseGuards(JwtAuthGuard)` or `@Public()`
- **No fake** (Q-40/Q-43): every endpoint REAL DB INSERT/UPDATE; honest `501` over `{ok:true}`
- **Verify-don't-trust** (Q-29): every existing claim confirmed via code + DB before acting
- **Permission gate** (Q-28): show `file:line` + exact change + reason → wait for "yes" before touching
- **DDL = owner approval** (Q-35): `APPROVED:` comment in migration file required
- **No regressions** (Q-39): what works now MUST still work after your change
- **No rewrite** (C6): system is ~70% built — fix and connect, do NOT rebuild from scratch
- `git add <exact-file>` only (`git add -A` BLOCKED) · commit each step · no `git stash`
- Report to owner in Uzbek (lotin) after each phase, then wait for "davom" (Q-38)

**Design (mandatory, Q-41 / Qoida 21):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) + existing templates (`ListPage` / `FormPage` / `DetailPage` / `DashboardPage`) — NO new design. SD module color = orange family (`--ep-primary: #FF902F`). Tab nesting MAX 2 levels (Q-42).

**Canonical tables (CRITICAL — H1/H2/H3):**
- Orders → `sales_orders` (`sd_sales_orders` = VIEW over it; old `orders` table DROPPED)
- Stock → `warehouse_stock` (`current_stock` = VIEW); `stocks` = batch/expiry only
- GL entries → `entries` / `gl_entries` (DO NOT touch `gl_journal_entries` / `gl_lines`)

═══════════════════════════════════════════════════════════════
## 1. WHY THIS MODULE / GOAL (Q-40 — the measure of "correct")
SD is the **T1 golden-thread core** — every sale starts here, flows to PP/MES/QC/WMS, and closes in Finance. The 24 000 customers + 20 years of repeat orders make this the highest-value module. Vision = oltin-ip (golden thread): one `sales_order.id` tags every downstream record from ТЗ → material → production → delivery → payment → GL.

The SD slice is ALREADY wired (`SdModule`, 435 `/api/sd/*` routes) but the DB is empty and most endpoints return `{}` stubs. Goal: **fix and connect**, not rebuild.

**Owner-confirmed overrides from `OCHIQ-JAVOBLAR-2026-06-08.md` SD section (these OVERRIDE A-defaults):**
- **EP-SD-033** Priklad % = per product type (each type its own %, master-data — NOT a fixed 3% or 5%)
- **EP-SD-042 / EP-SD-125** Klishe/shtamp = client pays once → stored at FACTORY (~3 years, then alert) → NOT charged on repeat orders
- **EP-SD-069** Cancellation penalty = staged: maket 30% / printed 70% / ready 100% (percentages are configurable master-data)
- **EP-SD-068** Quantity deviation = ±10% (invoice based on actual produced qty)
- **EP-SD-055** Pass threshold = CONFIGURABLE per razryad (not fixed 60/75%)
- **EP-SD-056** Retake rule = CONFIGURABLE (not fixed 14 days / 3 per year)
- **EP-SD-101** "Ожд.Сырьё" status → auto-signal to Ta'minot (procurement) + visible to sales
- **EP-SD-103** Machine format price impact = CRP-linked (confirmed A-default with CRP dependency)

**Source documents (read these, build to them — do NOT invent):**
- `docs/audit/decisions/06-sd.md` — full 138-question decision map (114 answered, 24 open with A-defaults)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → SD section (4 new owner decisions + 20 principle-defaults)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project-wide rules block
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — rating 7-factor, AI planning 7-step, gofra 3-formula
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` — EXTERNAL_OUT = finished-goods warehouse; Moliya+AI approval; FIFO pricing

═══════════════════════════════════════════════════════════════
## 6 CROSS-CUTTING PRINCIPLES (apply throughout all SD phases)

**E1 — AI observes → human confirms negatives:** AI flags low-margin orders, debtor risk, overdue quotes, cancellation penalties — but NO automatic block/penalty without human confirmation (manager or director). Flag + recommend, never auto-execute negative action.

**E2 — Card-centric:** Every sales manager has a KARTA. Permissions (discount limits, margin visibility, customer scope) come from the card's razryad/role. `card_id NULL` = no login. Discount tiers (0–5% / 5–10% / 10%+) are CARD-bound. KPI targets are per-card. Leaderboard aggregates from cards.

**E3 — AI plans orders:** AI auto-suggests: (a) best promise date from CRP/MPS capacity, (b) machine format (72СМ / 52СМ / КВА 105), (c) gofra grade from грузоподъёмность, (d) reorder from past orders. Manager confirms, never auto-executes production routing.

**E4 — Operator IoT-tablet:** SD does NOT touch the floor directly; however SD events trigger floor signals: "Ожд.Сырьё" → procurement alert; "tasdiqlandi" → ТЗ to KB/DB queue; delivery confirmation → postoplata timer start. These are events/webhooks, not direct SD actions.

**E5 — Org-chart routing:** Discount approval, КП signing, order confirmation gates all flow through org-chart: menejer → sotuv rahbari → Коммерческий директор → egasi (if limit exceeded). Use existing org-hierarchy from ORG module (do NOT hardcode manager_id).

**E6 — One canonical truth:** `sales_orders` is the ONE order table. DO NOT create a parallel orders table. DO NOT use `sd_sales_orders` as a write target (it is a VIEW). All writes go to `sales_orders` + `sales_order_items`. Two-worlds = BLOCKED (H1).

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing SD implementation (READ-ONLY) — ALWAYS FIRST

The SD slice has 435 routes already registered but most are stubs. Before writing a single line of code, map the real state.

**Tasks (all READ-ONLY — no edits, no commits):**
1. List all SD tables in live DB: `sd_customers`, `sales_orders`, `sales_order_items`, `sd_quotations`, `sd_quotation_items`, `sd_payments`, `sd_deliveries`, `sd_contracts`, `sd_price_lists`, `sd_price_tiers`, `sd_discounts`, `sd_leads` — column list + row counts (use `_audit/q.cjs`).
2. Identify which endpoints in `sd-*.controller.ts` files return real data vs `{}` / `[]` stubs (Q-29 verify-don't-trust). Mark each: REAL / STUB / PARTIAL.
3. Identify FE pages under `src/pages/` that correspond to SD (customers, orders, quotations, invoices, payments) — what renders, what saves (round-trip test: does create → save → reload → visible?).
4. Check `sales_orders` schema vs actual DB columns (Drizzle schema drift is common — verify live).
5. Note which events are wired: does `OrderConfirmedEvent` reach PP? Does `PaymentReceivedEvent` reach GL entries?
6. Identify two-world risks: is `orders` truly dropped? Is `sd_sales_orders` purely a VIEW with no write trigger?

**Output:** Write gap table to `docs/SD-RE-AUDIT-2026-06-08.md`:
| Feature (EP-SD-###) | Exists? | Real or Stub | Gap | Effort |

→ **STOP. Show owner the re-audit doc. Get approval before any build phase.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES
(Each phase: permission gate → BE + FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD → separate commit → report in Uzbek → wait for "davom")

─────────────────────────────────────────────────────────────
### PHASE 1 — Customer master-data + CRUD (EP-SD-074/075/007/008/018/019)
**Scope:** Real customer (mijoz) card with full rekvizit fields + ABC scoring + duplicate prevention.

**BE:**
- Fix `sd-customers.controller.ts` stubs (4 known `return {}` per CLAUDE.md §Qoida 10) — replace with real Drizzle queries via `DrizzleSdCustomersRepository`.
- Customer card mandatory fields (EP-SD-074): INN/STIR, h/r (bank account), bank, address, responsible person, phone, category (ABC), credit limit, payment terms.
- ABC auto-score (EP-SD-007/008/048): 3 criteria — annual purchase volume + avg payment delay + repeat order count. Weights already in `drizzle-sd-customers.repo.ts` (ABC_SCORE_WEIGHT_* constants — extract to `business.constants.ts`).
- Duplicate check (EP-SD-075): on create/update, check INN + phone uniqueness; warn (do NOT hard-block if manager confirms).
- Customer–manager assignment (EP-SD-018): `assigned_manager_id` FK to employees/users; RBAC scope — manager sees only own customers, sotuv rahbari sees all in department, direktor sees all.
- Customer re-assignment event (EP-SD-114): when manager deactivated → customers re-assigned to rahbar/new manager (event, not blocking).
- Activity segmentation (EP-SD-136): Yirik / Doimiy / Bir martalik / Nofaol (auto from last order date + ABC).

**FE:**
- `CustomerListPage` (ListPage template): search by name/INN/phone + filter by ABC/segment/manager + "Bo'sh kartalar" quick filter (EP-ORG-080 equivalent for customers).
- `CustomerDetailPage` (DetailPage template): tabs — Asosiy (rekvizits) · Buyurtmalar · To'lovlar · Debitor · Aloqa tarixi. Each tab real data.
- `CustomerCreateDialog` / edit: Zod-validated form, real POST → DB round-trip.
- RBAC: hide credit limit / INN from menejer if card says so.

**Verify:** `tsc 0` + DB-proof (insert customer → reload → see it) + ABC recalculates on new order.

**DoD:** All 7 DoD conditions (real CRUD + Result + Zod + DB · FE template+token+persist · doc · test · UZ+RU i18n · edge-cases · cron/event for ABC refresh). Each op logs `EP-SD-074` / `EP-SD-007` etc.

**Stop before DDL** if any schema change needed (Q-35).

─────────────────────────────────────────────────────────────
### PHASE 2 — Quotation (KP / Kotirovka) lifecycle (EP-SD-003/004/050/051/052/053/109/110/111)
**Scope:** Formal quotation document (КП) — create, version, PDF, approve, convert to order.

**BE:**
- `sd_quotations` + `sd_quotation_items` tables — verify real vs stub; if stub, request DDL approval.
- Quotation fields: raqam (SO-KP-2026-NNNNN auto-seq), client, items (multi-line EP-SD-066), narx formula (xomashyo+bo'yoq+ish+qo'shimcha+foyda%), to'lov sharti (template: 50%+5kun / 100% / custom EP-SD-128), currency+rate (EP-SD-071), QQS flag (EP-SD-072/131).
- Status chain (EP-SD-052): qoralama → yuborilgan → ko'rilmoqda → qabul → rad → muddati o'tgan (14-day default, configurable).
- Approval gate (EP-SD-004/111): menejer creates draft → komdir/rahbar approves before sending. Discount tiers (EP-SD-006/046): 0–5% menejer, 5–10% sotuv rahbari, 10%+ komdir. Each tier bound to card razryad.
- Floor price guard (EP-SD-047): system blocks if narx < tannarx + min_margin (director-only override). AI flags but does NOT auto-block (E1).
- Price expiry (EP-SD-051): 14-day default; expired KP re-price with current FIFO cost (auto on re-activate).
- KP → PDF (EP-SD-109): auto-generate КП PDF (logo + table + to'lov shartlari + "100% avans → 5% chegirma" EP-SD-130 + Коммерческий директор signature line EP-SD-110).
- Convert KP → Order (EP-SD-053): "Buyurtmaga aylantirish" button — all lines/prices/discounts carry over, KP status = "qabul", order created with same golden-thread ID.

**FE:**
- `QuotationListPage` (ListPage): filter by status/date/manager/client.
- `QuotationDetailPage` (DetailPage): 3 tabs — Qatorlar (items) · To'lov (payment terms) · Tarix (versions/approvals). Print/PDF button.
- `QuotationCreateDialog` (FormPage): multi-line item entry with real-time margin calc (role-gated display EP-SD-127). Discount field shows tier limit from card.

**Verify:** create KP → approve → generate PDF (file exists) → convert → `sales_orders` row created → reload order list → visible.

**Stop before any new DDL.**

─────────────────────────────────────────────────────────────
### PHASE 3 — Order (Buyurtma) core + golden-thread trigger (EP-SD-002/031/054/055/056/020/107/137)
**Scope:** The central sales order — fields, status machine, design approval gate, and the golden-thread event chain.

**BE:**
- `sales_orders` + `sales_order_items` — verify all decided columns exist (EP-SD-031): mahsulot turi, o'lcham (U×K×B mm), tiraj, birlik (лист/шт/м2 EP-SD-104), muddat (mijoz so'ragan + zavod va'dasi EP-SD-035/121), narx, bo'yoq formula (rang+qoplama%+yuza EP-SD-039), qo'shimcha operatsiyalar (ламинация/тиснение/конгрев/кашировка/высечка/склейка EP-SD-041/083..091), manbai-kanal (EP-SD-076), yo'nalish (Офсет/Флексо EP-SD-102), format/mashina (72СМ/52СМ/КВА 105 EP-SD-103 — AI tavsiya), klishe info (EP-SD-042/125: egalik + saqlash muddat), "Папка №" (EP-SD-098), "Заказ 1С" (EP-SD-099), "давальческое" material flag (EP-SD-105), fayl/trафaret link (EP-SD-106).
- Status machine (EP-SD-054/100): В процессе / Ожд.Сырьё / Ожд.Производство / Готов / Завершен / Отменен. Each transition logged (who + when + EP-SD-### op-code).
- Confirmation gate (EP-SD-055): checklist before confirming to production — (a) avans received ≥ required %, (b) maket approved (EP-SD-056/133), (c) debitor limit OK (EP-SD-060/062). All three green → confirm. Partial → blocked with reason.
- Maket approval (EP-SD-056/133): "maket tasdiqlandi" field (sana + kim + elektron imzo). Bosma BLOCKED without this field.
- **Golden-thread events (E4/E5/E6):**
  - `OrderConfirmedEvent` → PP: create production order (same `sales_order_id`) — EP-SD-020/137
  - `OrderConfirmedEvent` → KB/DB queue: ТЗ auto-sent (EP-SD-107)
  - `OrderStatusChanged("Ожд.Сырьё")` → MM/procurement: auto-signal + sales visibility (EP-SD-101 owner override)
  - All events via EventEmitter2 / outbox pattern (existing in codebase — verify wired)
- Repeat order flow (EP-SD-025/063/135): "Qayta buyurtma" — old o'lcham/dizayn/shtamp copied, tiraj/narx re-calculated (FIFO current cost, show delta EP-SD-064).
- Change journal (EP-SD-079/132): every field change → audit log (kim/qachon/eski→yangi).
- Cancellation penalty (EP-SD-069 owner override): staged — maket 30% / printed 70% / ready 100% (configurable percentages). AI calculates, human confirms (E1).
- Quantity deviation (EP-SD-068 owner override): ±10% allowed; invoice based on actual qty.

**FE:**
- `OrderListPage` (ListPage + Производство table columns: Клиент/Буюртма/Папка №/Заказ 1С/Сумма/Осталось/Статус/Дата готовности).
- `OrderDetailPage` (DetailPage — 4 tabs max 2-level Q-42):
  - **Buyurtma** (fields + status badge + Сумма/Осталось real-time EP-SD-120)
  - **Mahsulot** (items multi-line with operatsiyalar breakdown + margin for authorized roles EP-SD-126/127)
  - **Maket** (approval gate + file upload EP-SD-056/106)
  - **Tarix** (change journal EP-SD-079/132 + golden-thread hop log)
- Status transition buttons per allowed role (card-based RBAC EP-SD-019).
- "Qayta buyurtma" button on completed orders.

**Verify:** create order → set Ожд.Сырьё → check MM signal event fired → confirm order (all gates pass) → check PP table has production_order row → reload order detail → maket gate blocks without approval.

**Stop before any DDL change to `sales_orders`.**

─────────────────────────────────────────────────────────────
### PHASE 4 — Pricing engine + product catalog master-data (EP-SD-005/037/038/043/044/047/078/094/095/096)
**Scope:** Real pricing calculation (FIFO-based cost + operations + margin) + product catalog + discount tiers.

**BE:**
- Price formula (EP-SD-037): xomashyo (FIFO from `warehouse_stock` EP-SD-038) + bo'yoq (rang×qoplama%×yuza×tarif EP-SD-039) + operatsiyalar (route tariffs EP-SD-040/041) + qo'shimcha (fixed extras) + foyda%. Each component visible in breakdown.
- Priklad % (EP-SD-033 owner override): per product type, master-data table. System auto-applies correct % when product type selected.
- MOQ (EP-SD-036): per product type master-data; below MOQ → "kichik partiya ustamasi" auto-added line.
- Tiered pricing (EP-SD-043): tiraj-narx jadval per product (bulk discount ladder). Existing `BULK_DISCOUNT_*` constants in `sd-quotations.service.ts` — extract to `business.constants.ts` and make them DB-driven (master-data).
- Discount types (EP-SD-044): tiraj / doimiy mijoz / 100%-avans (5% auto EP-SD-130) / aksiya. Stacking cap (EP-SD-045): configurable max total discount ≈15% (master-data, not hardcoded). Discount tiers per card (EP-SD-006/046): 0–5% / 5–10% / 10%+.
- Floor price (EP-SD-047): tannarx + min_margin → block if narx below. AI flags low-margin → manager/director confirms override (E1). GL zarar override requires director card (EP-FIN-068 alignment).
- Standard price list (EP-SD-078): preyskurant for standard SKUs (Латок-449/250 EP-SD-094), periodic update. Non-standard → full formula.
- Product catalog (EP-SD-032/117): ~15 categories from КП Пепси (упаковки / гофролотки / гофрокоробки / дисплеи / буклеты / стаканы / гофроящики / календари / крафт пакеты / рулонные самоклейки / бандероль / бумажные стаканы / пицца упаковки / подарочные / other). Admin-extensible.
- Material dictionary (EP-SD-096): Марка (Т21/Т22/Т23) + Профиль (B/C/E) → hard lookup, admin-managed.
- Film thickness (EP-SD-097): 30мкр / 100мкр dropdown → narx+sarf auto.
- Auto техописание (EP-SD-095): from form fields generate "Гофра 3 слой, Марка Т22, Профиль С" text string.
- Gruzopodyomnost AI suggest (EP-SD-108): kg input → AI suggests gofra layers/grade (AI recommends, human confirms E1).

**FE:**
- `PriceCalculator` component (embedded in QuotationCreate/OrderCreate): real-time margin display (role-gated). Each formula component as expandable row.
- `ProductCatalogAdmin` page (admin only): manage ~15 categories + SKUs + priklad% + MOQ + tiered pricing.
- `PriceListPage`: current preyskurant (standard SKUs) with last-updated date + periodic refresh button.

**Verify:** create quotation with Латок-449 → system fills dimensions → FIFO cost pulls from `warehouse_stock` → priklad% applied from master-data → tiered price auto-selects for qty → margin shown to authorized user → price < floor → red warning (no auto-block).

─────────────────────────────────────────────────────────────
### PHASE 5 — Payment, debitor, delivery tracking (EP-SD-021/022/023/030/112/120/128/129/138)
**Scope:** Payments linked to orders, aging, delivery record, GL integration.

**BE:**
- Payment create/list: each `sd_payment` record links to `sales_order_id` + invoice. Partial payments supported (EP-SD-023/067). Outstanding balance = Сумма − Σ payments (EP-SD-120). Order auto-closes when balance = 0 (EP-SD-022).
- Payment templates (EP-SD-059/128): "50% avans + 5 kun qoldiq", "100% avans", "N kun otsrochka" — configurable master-data.
- Avans → production trigger: confirmed avans receipt is part of order confirmation gate (Phase 3 EP-SD-055).
- 100% avans → 5% discount auto-line (EP-SD-130): if payment_term = "100% avans" → discount_line added automatically.
- Delivery record (EP-SD-021/138): `sd_deliveries` — отгрузка sana + haydovchi + mashina + yetkazildi vaqti. Confirms: (a) actual delivery → postoplata counter starts (EP-SD-129: +N days → due date), (b) EXTERNAL_OUT gate = ombor menejer + Moliya approval (owner OMBOR-KASSIR Q22 override — both must confirm).
- GL integration (EP-SD-030): on payment confirm → `entries` INSERT (Debit kassa/bank / Credit debitor). Use existing `insertJournal` + `db.transaction` pattern (commit 6cae643e). NEVER write to `gl_journal_entries`/`gl_lines` (H3).
- Debitor aging (EP-SD-013): 0–30 / 31–60 / 60+ days. 60+ auto-alert to Даромадлар bo'limi card (EP-SD-112).
- Credit limit (EP-SD-060): per customer configurable; exceeded → new order blocked/flagged for director approval (EP-SD-061). Overdue debt flag (EP-SD-062): auto-flag on new order if 60+ aging exists.
- Penya calculation (EP-FIN-062 alignment): auto-CALCULATED (days × rate) but applies ONLY with egasi/rahbar confirmation (E1 global principle).
- Daromadlar bo'limi role (EP-SD-112): debitor collection responsibility → separate card/role from sales menejer (conflict-of-interest separation). RBAC: Daromadlar sees all debitor; sales menejer sees own customer balance only.

**FE:**
- `DebtorDashboard` page (DashboardPage template): aging buckets (0–30/31–60/60+) with drill-down per customer. Export to Excel.
- `PaymentCreateDialog`: link to order + invoice, partial amount supported, avans flag.
- `DeliveryCreateDialog`: отгрузка form — haydovchi dropdown (from HR employees with driver role) + mashina + timestamp. Dual-approval indicator (ombor menejer + Moliya).
- Order detail "To'lovlar" tab (Phase 3 FE): shows Сумма/To'langan/Qoldiq live + payment history.

**Verify:** record 50% avans → order confirms → отгрузка recorded → system sets due_date = отгрузка_date + 5 days → simulate due_date pass → 0–30 aging bucket shows customer → GL `entries` row created with correct Debit/Credit → reload.

─────────────────────────────────────────────────────────────
### PHASE 6 — Sales KPI, leaderboard, reporting (EP-SD-009/010/011/012/013/014/016/028/027)
**Scope:** ShVB DIRECTION 26 metrics — haftalik sotuv hajmi / closedDeals / averageDealSize / debtorControl / salesTarget / salesVsTarget — wired to card-model GSD + leaderboard.

**BE:**
- KPI calculations per card (EP-SD-009..014): weekly sales volume, closed deals count, avg deal size, debtor control (open balance), sales target (per-card configurable EP-SD-014), sales vs target %. Each metric = GSD on the sales manager's KARTA (ORG module). Auto-refresh every Monday (cron).
- Leaderboard (EP-SD-016): weekly ranking by salesVsTarget% (EP-SD-017 owner A-default = reja vs fakt %). Shows delta from last week. Top-N configurable. Visible to menejer (own position) / sotuv rahbari (full department).
- Lost order tracking (EP-SD-024 A-default): `sd_lost_orders` table — cancelled/lost orders with reason category (narx / muddat / raqobatchi / sifat / boshqa). Weekly analysis report.
- Bonus engine (EP-SD-027/077): configurable formula — maqsad bajarilishi% + undirılgan qarz (debitor-free earned) = bonus PROPOSAL → HR/moliya/rahbar confirms before Payroll (E1 global principle + HR-014 alignment). Discount given reduces bonus (EP-SD-047 alignment).
- Monday digest (EP-SD-028): cron → aggregate weekly stats per department + per manager + leaderboard → send via Telegram (NotificationsModule / BullMQ job). Event: `WeeklyDigestEvent`.
- Price change audit (EP-SD-029): every narx/chegirma change → `sd_price_history` row (actor + timestamp + old→new).

**FE:**
- `SalesDashboard` (DashboardPage template): 6 KPI tiles (haftalik hajm / closedDeals / avgDeal / debitorControl / salesTarget / salesVsTarget%) + trend sparkline + leaderboard widget. Auto-refresh.
- `LeaderboardWidget`: weekly ranking table with position change arrows.
- `LostOrdersPage` (ListPage): filter by reason/period/manager. Weekly analysis summary.
- KPI target setter (FormPage, rahbar only): set haftalik + oylik targets per card.

**Verify:** close 3 test orders in current week → Monday cron fires (or manual trigger for test) → leaderboard refreshes with correct sums → KPI tiles show updated values → GL entries exist for each payment → digest event queued in BullMQ.

─────────────────────────────────────────────────────────────
### PHASE 7 — Contract management + reklamatsiya + order-history archive (EP-SD-057/058/059/065/079/081/134)
**Scope:** Formal contracts, claims (reklamatsiya) linked to QC, and full order history per customer.

**BE:**
- Contracts (EP-SD-057 A-default = bosh shartnoma yillik + per-order spetsifikatsiya): `sd_contracts` table — bosh shartnoma (annual framework) + `sd_order_specs` per order. Main contract fields (EP-SD-058): to'lov shakli / muddat / valyuta / yetkazish sharti / jarima bandi. Templates from КП shartlari. Contract number auto-seq (EP-SD-073 alignment).
- Contract → order link: order references contract for payment terms (auto-fill EP-SD-059).
- Product/design archive per customer (EP-SD-065): customer card shows history table (sana / tiraj / narx / dizayn-link). "Qayta buyurtma" one-click from archive row.
- Reklamatsiya (EP-SD-081/134): "Reklamatsiya ochish" button on any order → creates QC claim record (linked: order_id + sex/uchastka + sabab kodi: rang/склейка/o'lcham/boshqa). Ties to `qc_claims` table (QC module). Owner confirmed: DAMAGE → QC auto (POS Q26 override). Menejer triggers, QC owns resolution.
- Order re-numbering (EP-SD-073): auto sequential SO-2026-00123 for orders, KP-2026-00045 for quotations, INV-2026-00067 for invoices — each type separate counter.

**FE:**
- `ContractDetailPage` (DetailPage): view bosh shartnoma + linked spetsifikatsiyalar list.
- `CustomerDetailPage` — "Mahsulotlar arxivi" tab: history table with "Qayta buyurtma" action per row.
- `ReclamationCreateDialog`: triggered from order detail → prefills order_id + client → reason selector → submits to QC module endpoint.

**Verify:** create order → complete → open customer detail → order appears in archive → click "Qayta buyurtma" → new order form pre-filled with old specs (new tiraj/sana blank) → submit → new order in DB with new ID, old specs carried over. Reklamatsiya → QC module receives claim.

═══════════════════════════════════════════════════════════════
## DoD — 7 conditions (ALL must pass per phase before commit)
1. **BE real:** CRUD + Result<T> + Zod + real DB INSERT/UPDATE/SELECT — no `{ok:true}`, no `[] as unknown`, no stub (Qoida 10 / Q-40)
2. **FE real:** EP Linear Soft template + `var(--ep-*)` tokens + loading/error states (F1/F2) + form saves and reloads visibly (Q-43)
3. **Documentation:** gap table updated + endpoint list in `docs/SD-RE-AUDIT-2026-06-08.md`
4. **Tests:** BE unit test (Result pattern) + FE smoke test (render + submit)
5. **i18n:** UZ (lotin) + RU keys for all new UI strings; no hardcoded Uzbek/Russian text in TSX
6. **Edge cases:** INN duplicate / credit limit breach / floor-price breach / expired KP / Ожд.Сырьё without stock / cancellation after bosma / partial delivery
7. **Automation:** cron/event wired — weekly KPI refresh, Monday digest, Ожд.Сырьё → MM signal, payment → GL entry, delivery → postoplata timer

**Each operation MUST log its EP-SD-### op-code** (J1/J2): `logger.log({ level:'info', code:'EP-SD-022', ... })`.

═══════════════════════════════════════════════════════════════
## RAILS (enforced every phase)
- **Permission gate (Q-28):** before ANY file edit, show `file:line` + exact change + reason; wait for "ha"
- **Verify-don't-trust (Q-29):** confirm every existing claim with live DB + code (not memory)
- **Separate commits:** one commit per completed phase, `git add <exact-file>` only
- **No regression (Q-39):** run `tsc` + existing reviewers after each change; all must pass
- **No rewrite (C6):** existing `SdModule`, `DrizzleSdCustomersRepository`, `sd-quotations.service.ts` etc. — extend, not replace
- **Honest 501 (Qoida 10):** if a decided feature needs a table that does not yet exist → throw `HttpStatus.NOT_IMPLEMENTED` with a clear message; do NOT fake a response
- **DDL = owner approval (Q-35):** every new migration must have `-- APPROVED: [date]` comment; stop and ask before writing any `CREATE TABLE` or `ALTER TABLE`
- **Report in Uzbek (Q-38):** after each phase, write a short Uzbek summary — what was done, what is left, any blockers — then wait for "davom"
- **Windows nest watch (Q-44):** if `:3030` goes 000 after a big rebuild, it is an environment bug (not code); restart `pnpm --filter @europrint/api run dev:unsafe`; verify with static fallback (tsc + DB-proof)
- **No log commits (Q-45):** `backend.log*` files NEVER staged or committed

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — do NOT proceed without owner confirmation)
1. **After Phase 0 RE-AUDIT** — show `docs/SD-RE-AUDIT-2026-06-08.md` gap table; get approval before any build
2. **Before any DDL** (Q-35) — show exact migration SQL + APPROVED comment template; wait for "ha"
3. **Before changing `sales_orders` schema** — confirm no two-world risk; check `sd_sales_orders` VIEW definition not broken
4. **Before wiring OrderConfirmedEvent → PP** (Phase 3) — confirm PP module is ready to receive (re-audit PP state first)
5. **Before writing GL entries** (Phase 5) — confirm `entries` table columns match expected (use `_audit/q.cjs`; never assume)
6. **After each phase** — show Uzbek summary report; wait for "davom" before next phase
