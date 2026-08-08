# EXECUTOR PROMPT #18 — BUILD T3: MKT / MARKETING (8-channel, ROI, owner 5-numbers)
> Module #14 in build sequence. T3 supporting module. Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first. All hard rules apply without exception:

**Code rules (CLAUDE.md A/B/1-23 + LOYIHA-QOIDALARI):**
- TypeScript strict · **Zod** (not class-validator) · **Drizzle ORM** (not raw sql.raw(variable)) · **Result<T>** pattern (no throw/return null)
- File ≤ 900 lines · function ≤ 150 lines · constants in `business.constants.ts` (no magic numbers)
- Controller = transport only (logic in service, service via repo not direct db.*) · every controller `@UseGuards` or `@Public`
- No hardcoded secrets/passwords · ConfigService for env vars
- **EP Linear Soft design tokens** (`var(--ep-*)`, `var(--mod-*)`); existing templates only (ListPage / FormPage / DetailPage / DashboardPage / BoardPage); tab max 2 levels (Q-42)

**Process rules (Q-24..Q-45):**
- **No fake (C3/Q-40/Q-43):** every form/endpoint = real DB INSERT/UPDATE; `{ok:true}` / echo / `[] as unknown` = FORBIDDEN; honest 501 over fake
- **Verify-don't-trust (C2/Q-29):** treat every audit claim as stale → confirm with live code + DB (`_audit/q.cjs` read-only) + HTTP probe
- **Permission gate (Q-28/I3):** before any change → file:line + exact change + reason → owner "yes". Recommendation ≠ permission.
- **DDL = owner approval (Q-35):** new migration/CREATE TABLE only with owner approval; `APPROVED:` comment in file
- **No regressions (C5/Q-39):** deleted things stay deleted; working features stay working after each change
- **No rewrite (C6):** system ~70% built — fix & connect only; full rewrite = FORBIDDEN
- `git add <exact-file>` only (git add -A = FORBIDDEN) · commit every step · report each phase in Uzbek (Q-38) · wait for "continue"
- Canonical tables: orders = `sales_orders` · stock = `warehouse_stock` · GL = `entries` · no two-world duplicates (H1-H4)

**6 cross-cutting build-rails (LOYIHA-QOIDALARI §E):**
- **E1.** AI observes → human confirms negative effects (jarima/ball/blok NEVER automatic)
- **E2.** Card-centric: every role/task ties to org-card (card→profile aggregation)
- **E3.** AI plans orders/sequences; manager only confirms
- **E4.** Operator floor hub = IoT tablet (not applicable to MKT directly, but namuna/sample flow touches MES)
- **E5.** Org-chart routing: approval/notification routes up org-tree; tasdiq → director final
- **E6.** Single truth: Bitrix24 fully replaced by ERP (EP-MKT-083 decided: Bitrix→ERP, no two-world)

═══════════════════════════════════════════════════════════════
## 1. WHY / GOAL (Q-40 — vision = measure of "correct")

**MKT role:** Marketing is a **T3 supporting module** — it is the entry point of the golden thread (lead → order → money). Operationally it belongs to **1st division (operational marketing)**; strategically to **6th department (Rivojlanish/Development)**. The module's purpose is to measure and optimize B2B lead acquisition across **8 channels**, track ROI per channel and campaign, and provide the owner with exactly **5 numbers** (EP-MKT-116).

**Vision summary (Q-40 test — "correct" means this):**
- Every lead has one canonical channel (8+other), one owner (Menedjer), one funnel stage
- Every campaign has budget (tied to Finance real entries), lead-count, and ROI (profit-based: EP-MKT-051)
- AI analyzes campaign efficiency (`marketing-ai.service.ts → analyzeCampaignEfficiency()`); human decides changes
- NPS fires automatically post-delivery; low score (0-6) creates task to responsible (E1: AI flags, human acts)
- Social inbox is unified; inbox-to-lead conversion is one button; response SLA tracked
- Bitrix24 is fully replaced (E6); no parallel data worlds
- Owner receives: yangi mijoz / yo'qolgan mijoz / kichiklashayotgan mijoz / savdo trendi / eng katta xavf (EP-MKT-116 decided)

**Code already exists (verify before touching):**
- BE: `apps/api/src/modules/marketing/` — campaigns (CQRS: create/update/launch + aggregate + drizzle-campaign.repo + campaign-status.enum), leads (leads.service/repo), marketing-ext (social-inbox/content/exhibitions/NPS/budget), `marketing.controller` / `marketing-analytics.controller` / `marketing-content.controller`; AI: `modules/ai/services/marketing-ai.service.ts` + `ai-marketing.controller`
- FE: `MarketingDashboard / Leads / Campaigns / Calendar / Content / SocialInbox / Exhibitions / Budget / PR / WebsiteCMS / Settings / Extended` (+ Dialogs/Sections/Helpers/Types)
- Schema: `lib/db/schema/marketing-schema.ts`
- Memory (session 2026-05-28): NPS / hot-leads / blog / budget / calendar = real DB already

**Source documents (read these, build to them — do NOT invent):**
- `docs/audit/decisions/14-marketing.md` — full per-question map (EP-MKT-001..118), 92 answered / 26 open with A-defaults
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → Marketing section (4 owner decisions + A-defaults — THESE OVERRIDE everything)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules block
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — org-unit model, 8-channel model, AI-planning 7-step
- `docs/audit/LOYIHA-BITGAN-XOLAT-2026-06-08.md` — EP-MKT-### op-code numbering + module DoD

**Owner overrides (OCHIQ-JAVOBLAR MKT section — these override A-defaults):**
- ⭐ **EP-MKT-031** Channels = exactly **8**: Instagram / Telegram / Facebook / veb-sayt / ko'rgazma / sovuq qo'ng'iroq / tavsiya / vositachi-diler + "boshqa"
- ⭐ **EP-MKT-048** Lead SLA = **15 min response**; 4 h → signal to manager; 24 h → reassign to another salesperson
- ⭐ **EP-MKT-051** ROI formula = **profit-based**: (kampaniyadan kelgan sotuv FOYDASI − marketing xarajat) / marketing xarajat; margin pulled from product cost automatically
- ⭐ **EP-MKT-116** Owner 5 numbers = **Yangi mijoz / Yo'qolgan mijoz / Kichiklashayotgan mijoz / Savdo trendi / Eng katta xavf** (+ diqqat-talab section)

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing MKT implementation (READ-ONLY) — MANDATORY FIRST

MKT is **substantially pre-built** (~70%). **Do not rebuild. Fix & connect.**

Map exactly what EXISTS vs what the vision NEEDS:

**Tables to inspect (via `_audit/q.cjs` read-only):**
- `marketing_leads`, `marketing_campaigns`, `marketing_campaign_channels`, `marketing_content`, `marketing_calendar`, `marketing_budget`, `marketing_exhibitions`, `marketing_social_messages`, `marketing_nps` — list columns + row counts + FK integrity
- Check for `channel` enum/table: does it have the owner-decided 8 channels?
- Check `campaign_status` enum: does it match the 6 decided states (Reja→Tasdiqlangan→Faol→To'xtatilgan→Tugadi→Bekor)?

**BE to verify (each endpoint: real DB or stub?):**
- `marketing/leads` CRUD — real insert? real list?
- `marketing/campaigns` — create/launch/update — real?
- `marketing-ext` — NPS, budget, social-inbox — real or stub?
- `ai-marketing.controller` → `analyzeCampaignEfficiency()` — wired to real leads/campaigns data?
- ROI calculation: profit-based formula or revenue-based (old default)?

**FE to verify (each page: real data or mock?):**
- `MarketingDashboard` — 11 ShVB KPIs wired to real API?
- `MarketingLeads` — create form saves? channel dropdown has 8 channels?
- `MarketingCampaigns` — status lifecycle works?
- `MarketingSocialInbox` — reads real messages or stub?
- Owner 5-numbers panel — exists? wired?

**Gap table → write to `docs/MKT-RE-AUDIT-2026-06-08.md`:**

| Feature | EP code | Exists? | Real/Stub | Gap | Effort |
|---------|---------|---------|-----------|-----|--------|
| 8-channel enum | EP-MKT-031 | ? | ? | ? | ? |
| Lead SLA cron | EP-MKT-048 | ? | ? | ? | ? |
| Profit-based ROI | EP-MKT-051 | ? | ? | ? | ? |
| Owner 5-numbers | EP-MKT-116 | ? | ? | ? | ? |
| ... | ... | ... | ... | ... | ... |

→ **STOP. Show owner the re-audit doc. Get approval before any build work.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES
Each phase: permission → BE+FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD → separate commit → report in Uzbek → wait for "continue".

─────────────────────────────────────────────────────────────
### PHASE 1 — Channel master-data + Lead CRUD (foundation)

**Scope:**
- Canonical 8-channel enum/table: Instagram / Telegram / Facebook / veb-sayt / ko'rgazma / sovuq qo'ng'iroq / tavsiya / vositachi-diler + "boshqa" (EP-MKT-031 owner override). Configurable by marketing head in Settings (EP-MKT-003 A-default).
- Lead CRUD: create (mandatory fields: telefon + manba kanali + mahsulot qiziqishi per EP-MKT-045 A-default) + list + update + soft-delete. Phone-based duplicate detection + merge offer (EP-MKT-046).
- Lead quality levels: issiq/iliq/sovuq (EP-MKT-043) — scoring based on 5 criteria (buyurtma hajmi/shoshilinchlik/byudjet aniqligi/mahsulot mosligi/qayta mijoz per EP-MKT-044 A-default).
- Lead-to-salesperson assignment: by mahsulot turi + hudud / round-robin fallback (EP-MKT-047 A-default). Unassigned leads shown red "egasiz" list (EP-MKT-090).
- Referral source tracking: "kim tavsiya qildi" field + chain + bonus flag (EP-MKT-023 / EP-MKT-117).
- Loss reason on close: dropdown (7-8 reasons per EP-MKT-050 A-default) + comment (EP-MKT-029).

**BE:** Zod-validated DTOs · Drizzle repo · Result<T> · real INSERT/UPDATE · duplicate check logic in service (not controller). Op-codes: EP-MKT-001, EP-MKT-002, EP-MKT-031, EP-MKT-045, EP-MKT-046, EP-MKT-090 log to audit-log.

**FE:** `MarketingLeads` page — ListPage template · channel dropdown (8+other) · lead quality badge (color) · "egasiz" filter · ConfirmDialog on delete (Qoida 14). Fix if form not persisting (C3/Q-43).

**Verify:** tsc 0 · create lead → DB row appears · duplicate phone → warn shown · channel enum exactly 8.

**DoD check:** All 7 DoD conditions (§D5): real CRUD + Result + Zod + DB · FE template+token+loading/error+persists · docs · tests · i18n UZ+RU · edge-cases · automation hook ready.

**DDL gate (Q-35):** If channel table or lead_quality_scores table does not exist → write migration proposal with `APPROVED:` placeholder → STOP for owner approval before applying.

─────────────────────────────────────────────────────────────
### PHASE 2 — Lead Funnel + SLA cron + Bitrix→ERP migration gate

**Scope:**
- Lead funnel (voronka) stages: configurable by owner (EP-MKT-049 A-default). B2B-adapted stages including namuna step: e.g. Yangi lid → Aloqa o'rnatildi → Namuna so'ralgan → Namuna tasdiqida (подписной лист) → Shartnoma → Yutilgan/Yo'qolgan (EP-MKT-093). Stage names set by owner in Settings.
- Lead SLA enforcement (EP-MKT-048 owner override): cron every minute → if lead has no response in 15 min → notification to responsible (NTF module event); 4 hours no response → signal to manager (E1: AI flags, human acts); 24 hours → reassign trigger (manager confirms, not automatic). Log op-code EP-MKT-048 on each event.
- Lead expiry aging visual on list: 0-14 green / 15-45 yellow / 45+ red (same logic as vacancy aging EP-ORG-072 adapted for leads).
- Bitrix24 migration gate (EP-MKT-083 — E6 single truth): add one-time CSV import endpoint for Bitrix24 leads/clients. No two-world running simultaneously — Bitrix24 read-only after import. Mark each imported record with `source=bitrix24_import`. Owner decides timing; endpoint ready but disabled until owner triggers.
- Lead → SD hand-off event: when lead reaches "Tasdiqlangan" / warm threshold → fire `LeadQualifiedEvent` → SD module creates client record (EP-MKT-005 / EP-MKT-074). Oltin-ip connection.

**BE:** BullMQ/EventEmitter2 job for SLA cron · `LeadQualifiedEvent` published on status change · Bitrix import endpoint (guarded, role=ADMIN only) · All ops log EP-MKT-048 / EP-MKT-005 codes.

**FE:** Funnel Kanban view on `MarketingLeads` or dedicated Funnel tab · aging color badges · SLA countdown badge per lead card (time since creation).

**Verify:** create lead → wait simulated 15 min (set short interval in test) → notification fires · lead moves to next stage → SD receives event (check EventEmitter listener).

**STOP before DDL** for any new tables. STOP before Bitrix import is enabled (owner must trigger).

─────────────────────────────────────────────────────────────
### PHASE 3 — Campaign CRUD + Multi-channel + Profit-based ROI

**Scope:**
- Campaign card (EP-MKT-006/036): name, goal type (5: yangi lid / brend tanitish / mavjud mijoz qaytarish / yangi mahsulot / ko'rgazmaga taklif per EP-MKT-037), channel(s) multi-select, budget, dates, responsible, target audience (sector per EP-MKT-039), geography (viloyat + eksport flag per EP-MKT-040), expected lead count. Fix or verify existing CQRS slice is complete.
- Campaign status lifecycle (EP-MKT-038): 6 states Reja→Tasdiqlangan→Faol→To'xtatilgan→Tugadi→Bekor. Fix existing `campaign-status.enum.ts` if states differ.
- Promo-code per campaign (EP-MKT-042): attach promo code → tracked in SD on use.
- Planned vs actual results (EP-MKT-041): reja and fakt side-by-side (lid count, revenue, ROI).
- **ROI calculation — profit-based (EP-MKT-051 owner override):** ROI = (kampaniyadan kelgan sotuv foydasi − marketing xarajat) / marketing xarajat. Margin pulled from `sales_orders` → product cost (canonical table H1). CPL = kanal xarajati / lid soni (EP-MKT-008/052). CAC = davr xarajat / yangi mijozlar soni (EP-MKT-053). LTV = 12-month repeat revenue per channel (EP-MKT-054). Attribution window = 90 days B2B (EP-MKT-055 A-default); last-touch primary + first-touch recorded (EP-MKT-056 A-default).
- Budget per channel × month table (EP-MKT-033): reja / sarflangan / qoldiq. Real spend pulled from Finance `entries` (canonical GL table H3 — `marketingBudgetUsed` ShVB KPI). Never duplicate; read from Finance, do not store separately.
- Campaign material checklist + budget plan attachment (EP-MKT-030): checklist of preparation items (banner/broshura/sovg'a) with budget sub-items.

**BE:** `campaignRoiService.calculate()` using profit-based formula · pulls from `sales_orders` (FK: campaign_id or lead_id chain) · pulls from `entries` for costs · real Drizzle queries · Result<T>. Op-codes: EP-MKT-007, EP-MKT-051, EP-MKT-052, EP-MKT-053.

**FE:** `MarketingCampaigns` — DetailPage template · 6-tab layout (Asosiy / Kanallar / Natija / Byudjet / Lidlar / ROI) · ≤2 tab levels (Q-42) · ROI card showing profit formula breakdown · ConfirmDialog on status change to Bekor.

**Verify:** create campaign → attach leads → mark some as converted to orders → ROI calculated → matches manual formula check.

─────────────────────────────────────────────────────────────
### PHASE 4 — Exhibitions + Social Inbox + Content Calendar

**Scope:**
- Exhibitions / Ko'rgazma (EP-MKT-057/058/059/060/061):
  - Exhibition card: xarajat, sana, joy, stend o'lchami, mas'ul, kutilgan lid.
  - Mobile-first rapid lead capture form at exhibition (ism + telefon + qiziqish → instant DB save).
  - Every lead auto-tagged with exhibition → exhibition ROI = leads → orders from that tag.
  - Post-exhibition follow-up cron: 48-hour task auto-created for each exhibition lead (E1: task created, human acts). Op-code EP-MKT-060.
  - Historical exhibition comparison table (EP-MKT-061): xarajat / lid / sotuv / ROI per year.

- Social Inbox (EP-MKT-012/062/063/064/065/066/067):
  - Unified inbox UI (EP-MKT-062 A-default: Telegram bot first — fits owner's Telegram ecosystem). UI already exists in `MarketingSocialInbox.tsx` — verify it reads real messages, not mock.
  - SLA tracking per message: ish vaqtida 15 daqiqa / tashqarisida ertasi SLA (EP-MKT-063 A-default). Badge on overdue messages.
  - "Lid yarat" button on conversation → creates lead with source = that channel (EP-MKT-013/064).
  - Quick-reply templates library: narx so'rovi / namuna / muddat / minimal partiya (EP-MKT-026/065). Real DB CRUD for templates.
  - Assign conversation to responsible (EP-MKT-066): auto-assign or round-robin · "javob berilmoqda" flag prevents double-reply.
  - Spam flag + separate folder (EP-MKT-067): excluded from statistics.

- Content Calendar (EP-MKT-017/018/068/069/070/072/073):
  - Calendar view (month/week) with post cards (EP-MKT-068). Already exists — verify real DB.
  - Post fields: sana, kanal(lar), sarlavha, matn, media, mas'ul, holat, bog'liq kampaniya (EP-MKT-069).
  - 5-stage approval workflow: g'oya→matn tayyor→dizayn tayyor→tasdiqlangan→joylandi (EP-MKT-070). Approval routes via org-chart (E5).
  - Post performance metrics: qamrov / layk / izoh / saqlash + "shu postdan kelgan lid" link (EP-MKT-072).
  - Reminder cron before scheduled post time (EP-MKT-073). Op-code: EP-MKT-073.

**BE:** Exhibition CQRS or service+repo · social-inbox real Drizzle queries · content workflow state machine (5 stages) · approval event fired to NTF module · cron for post reminders. All ops log EP-MKT-### codes.

**FE:** `MarketingExhibitions` (DetailPage) · `MarketingSocialInbox` (verify real) · `MarketingContent` + calendar (verify real) · approval status badge + action buttons per role (marketolog vs boshliq).

**Verify:** create exhibition → add leads on mobile form → 48h task appears · write inbox message → "Lid yarat" → lead in DB · create content post → approve each stage → final "joylandi" state persists.

─────────────────────────────────────────────────────────────
### PHASE 5 — AI analytics + NPS + Churn + Owner 5-numbers dashboard

**Scope:**
- AI campaign efficiency (EP-MKT-021): wire `marketing-ai.service.ts → analyzeCampaignEfficiency()` to real leads + campaign data. AI outputs: qaysi kanal eng samarali / CPL taqqos / segment tavsiyasi. E1 principle: AI recommends, human decides budget reallocation.
- AI lead scoring (EP-MKT-022/043/044): 5-criteria scoring (buyurtma hajmi/shoshilinchlik/byudjet aniqligi/mahsulot mosligi/qayta mijoz per A-default weights) → issiq/iliq/sovuq auto-label. Score computed on save, recalculated on update.
- NPS (EP-MKT-015/016/082): auto-trigger post-delivery (listen to SD `OrderDeliveredEvent` → send NPS survey via Telegram bot → store score 0-10 + comment). Score 0-6 → auto-task to responsible (E1: task created, human acts — NO automatic penalty). Real DB already (memory confirms); verify wiring to SD event. Op-code: EP-MKT-015.
- Churn detection (EP-MKT-084): per-customer rhythm baseline (from `sales_orders` history) → if current gap > baseline × 1.5 → signal to salesperson (NTF event). AI computes; human acts (E1). Op-code: EP-MKT-084.
- "Kichiklashgan buyurtmalar" signal (EP-MKT-085 — Nosirov analysis): customer's monthly order value/count/size trend → "kamayish" flag. AI computes from `sales_orders`; visual on customer card.
- Win-back dormant (EP-MKT-104): customers with gap > own rhythm for 3+ months → win-back task list. AI generated, manager acts.
- Seasonal demand calendar (EP-MKT-092): past-year order history → "this month call this client" reminder AI auto-suggestion. Visible in Marketing Calendar. E3: AI plans, manager confirms.
- **Owner 5-numbers dashboard (EP-MKT-116 owner override):**  Real-time panel showing exactly:
  1. Yangi mijozlar soni (this month vs last)
  2. Yo'qolgan mijozlar soni (churn detected)
  3. Kichiklashayotgan mijozlar soni (Nosirov signal count)
  4. Savdo trendi (% change month-over-month from `sales_orders`)
  5. Eng katta xavf (largest single at-risk revenue = biggest at-risk customer × their avg monthly revenue)
  + "Diqqat talab" section: top 3 actionable items
  Role-gated: visible only to ega/director (field-level RBAC per F1).

**BE:** `marketing-ai.service` wired to real data · NPS event listener on `OrderDeliveredEvent` · churn cron (daily) · win-back cron (weekly) · owner-dashboard endpoint (role-gated Result<OwnerDashboardDto>). All ops log EP-MKT-### codes.

**FE:** `MarketingDashboard` — verify all 11 ShVB KPIs load real data · add Owner 5-numbers section (visible only to ADMIN/DIRECTOR role) · AI insights panel (read-only recommendations). DashboardPage template. EP Linear Soft `var(--mod-marketing)` color.

**Verify:** deliver an order → NPS fires → score 0-6 → task appears for responsible · force churn condition → signal appears · owner 5-numbers shows real computed values not mocks (DB-proof: check each number matches manual SQL count).

─────────────────────────────────────────────────────────────
### PHASE 6 — B2B intelligence: portfolio + competitor + loyalty + client cards

**Scope:**
- Product portfolio (EP-MKT-087): mahsulot turi bo'yicha portfolio (shirinlik/pizza/filtr/etiketka/gofra) with sample photos + technical capabilities + branded PDF export.
- Competitor tracking (EP-MKT-078): competitor card (nom/mahsulot/taxminiy narx/kuchli-zaif). Win/loss reason per lead: competitor name + reason (narx/sifat/muddat) mandatory on lost leads (EP-MKT-100). Competition report (EP-MKT-078).
- Client brand library — MIJOZ brendi (EP-MKT-086): per-customer "brand passport" in client card: logo file + rang kodlari (Pantone/CMYK) + shrift + taqiqlar. Managed by Dizayn bo'limi rahbari.
- EuroPrint materials archive (EP-MKT-081): central library (logo, katalog, narx ro'yxati, namuna foto, prezentatsiya) with version control. Distinct from mijoz-brendi.
- Wallet share analysis (EP-MKT-098): per-customer "what we do for them vs what we could do" AI analysis + upsell suggestion (E1: AI suggests, manager presents to client).
- Design upsell offer (EP-MKT-113): list of design-refresh proposals → salesperson presents → accepted → опросный лист pre-filled (EP-MKT-088 chain).
- Loyalty rules (EP-MKT-108): tier by annual volume → auto-discount rule (set by ega+savdo boshlig'i); rule-based not manager-discretion.
- Product capacity signal (EP-MKT-110): when MES/PP reports idle capacity → event fires to Marketing → "bo'sh davr aksiyasi" suggestion (ega+savdo boshlig'i confirms). E1: system flags, human confirms.
- Technical feasibility check on lead (EP-MKT-096): lead's product spec vs dastgoh formati/material catalog → "qila olamiz/qiyin/yo'q" auto-flag. Closest alternative suggested if "yo'q".
- Client contact change tracking (EP-MKT-103): multiple contacts per client + "asosiy kontakt o'zgardi" flag → immediate follow-up task.
- папка № history (EP-MKT-097): client card shows all past PT/KT/E codes + "takror qil" button (pre-fills new order from old тех карта + new price).

**BE:** portfolio repo · competitor repo · brand-passport stored in JSONB on client record (use `sd_customers` FK — canonical, no duplicate) · capacity event listener (`ProductionIdleCapacityEvent`) · feasibility check reads from MM product specs · wallet-share AI call. All ops log EP-MKT-### codes.

**FE:** Client card gains new tabs: Brend Pasporti / Papka Tarixi / Wallet Share / Kontaktlar · Portfolio page (ListPage) · Competitor tracking (ListPage) · EuroPrint materials library (ListPage with version badges). Max 2 tab levels (Q-42).

**Verify:** add brand passport to client → save → re-open → visible · mark lead lost with competitor reason → appears in win/loss report · capacity event simulated → marketing panel shows suggestion.

─────────────────────────────────────────────────────────────
### PHASE 7 — Reports, KPI wiring, i18n, tests, cron hardening

**Scope:**
- Weekly/monthly auto-report to director and marketing head (EP-MKT-027): ShVB "haftalik marketing statistika" — cron generates PDF/Telegram summary. Op-code EP-MKT-027.
- Marketing KPI per card (EP-MKT-077 A-default): 3-4 KPIs — sifatli lid soni / konversiya % (to warm) / kanal ROI / SLA adherence %. Linked to org-card (E2: card-centric). Visible in `MarketingSettings` under KPI config.
- New product demand tracking (EP-MKT-106): count of leads by product type → trend report to 6th department (Rivojlanish). AI insight: "flekso gofra talabi o'syapti".
- Client order transparency (EP-MKT-107): Telegram bot message with order progress link (SD module integration). Marketing configures which clients receive this.
- i18n completion: all new keys added to `uz/` and `ru/` locale files; no hardcoded Uzbek/Russian strings in TSX.
- Tests: BE unit tests for ROI formula (profit-based edge cases) · lead SLA cron logic · NPS event handler · FE smoke tests for each page render.
- Cron audit: verify all marketing crons (SLA/follow-up/churn/win-back/seasonal/report) registered in NestJS scheduler; no orphan crons; each logs its EP-MKT-### op-code.
- Op-code registry: register all EP-MKT-001..118 codes used in `apps/api/src/common/op-codes.ts` and `docs/op-codes/REGISTRY.md`.

**Verify:** run full reviewer suite (`bash scripts/run-all-reviewers.sh`) → 0 new failures · tsc 0 BE+FE · all cron jobs visible in Nest scheduler list · i18n: no console translation-key warnings · owner 5-numbers panel tested with real DB rows.

═══════════════════════════════════════════════════════════════
## DoD — "TAYYOR" = all 7 conditions (per §D5, applied to MKT)
1. **BE real:** every endpoint = real Drizzle CRUD + Result<T> + Zod + DB commit — no `{ok:true}` / no echo / no `[] as unknown`
2. **FE real:** EP Linear Soft tokens + existing template (ListPage/FormPage/DetailPage/DashboardPage) + loading/error states + real persist round-trip (kirit → saqla → qayta och → ko'rinadimi)
3. **Docs:** `docs/MKT-RE-AUDIT-2026-06-08.md` + phase completion notes in `docs/`
4. **Tests:** BE unit (ROI formula, SLA cron, NPS handler) + FE smoke tests per page
5. **i18n:** all strings in `uz/` + `ru/` locale files; no hardcoded text in TSX
6. **Edge cases:** duplicate lead, lost lead with reason, zero-budget campaign, 0-6 NPS score, idle capacity event, Bitrix import with errors
7. **Automation:** SLA cron · follow-up cron · churn detection cron · NPS event listener · capacity event listener · weekly report cron — all registered, all log EP-MKT-### op-codes

Each operation in BE logs its **EP-MKT-### op-code** at `level=info` (§J1).

═══════════════════════════════════════════════════════════════
## RAILS (per-phase checklist)
- **Permission gate first:** before touching any file → file:line + exact change + reason → owner approves
- **BE+FE parallel:** never leave one layer half-done
- **Verify after each phase:** `tsc 0` + DB-proof (query actual rows) + FE persist round-trip (not just 200 status)
- **Separate commit per phase:** `git add <exact files changed>` · meaningful commit message · never `git add -A`
- **No regressions:** run `bash scripts/run-all-reviewers.sh` after each phase; any new FAIL = fix before proceeding
- **No rewrite:** if existing code is close → patch it; only replace if fundamentally wrong and owner approves
- **Honest 501:** if a feature's table does not exist yet → `throw HttpException('...', HttpStatus.NOT_IMPLEMENTED)` — never fake data
- **DDL = owner approval:** every `CREATE TABLE` / new migration → write proposal → wait for `APPROVED:` sign-off
- **Canonical tables:** read revenue from `sales_orders`; read GL spend from `entries`; never create parallel copies
- **Report in Uzbek:** after each phase, write 5-10 line Uzbek summary: nima qilindi / nima tekshirildi / qanday tasdiqlandi / keyingi qadam
- **Wait for "continue":** do not start the next phase until owner explicitly says "davom" or "continue"

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory owner approval required)
1. **After Phase 0 RE-AUDIT** — show `docs/MKT-RE-AUDIT-2026-06-08.md` to owner; get "quring" before any build
2. **Before any DDL** — new table / migration → proposal with `APPROVED:` placeholder → owner signs off (Q-35)
3. **Before enabling Bitrix24 import** (EP-MKT-083) — owner decides timing; endpoint ready but disabled
4. **Before changing canonical tables** (`sales_orders`, `warehouse_stock`, `entries`, `sd_customers`) — confirm no two-world violation (H1-H4)
5. **After each phase** — show Uzbek report → wait for "davom et" before starting next phase
6. **ROI formula go-live (Phase 3)** — confirm profit-margin source with owner before wiring to Finance `entries` (H3 canonical GL)
