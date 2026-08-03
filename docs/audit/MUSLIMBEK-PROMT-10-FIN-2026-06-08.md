# EXECUTOR PROMPT #10 — BUILD T1: FIN — Finance / GL + KASSIR sub-module
> Foundation is clean (prompt #01 done). This is the T1 financial backbone: GL, ZVS/ZNO, KASSIR, budgets, aging, reporting, and all cross-module money flows.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` BEFORE touching any file. All hard rules apply without exception:

**Code quality (CLAUDE.md):**
- TypeScript strict · validatsiya = **Zod** (class-validator EMAS)
- DB = **Drizzle ORM**; `sql.raw(variable)` TAQIQ; raw SQL faqat LATERAL/complex (izoh bilan)
- Xato = **Result<T>** pattern (`throw`/`return null` EMAS)
- Fayl ≤ 900 qator · funksiya ≤ 150 qator · magic-number TAQIQ (`business.constants.ts`)
- Controller = transport only; service → repo → DB (to'g'ridan tegmaydi)
- `@UseGuards`/`@Public` har controller; `ConfigService` (process.env to'g'ridan emas)

**Correctness (Q-40 / C1):**
- **Vizyon = to'g'rilik o'lchovi** — kod 200 qaytarsa ham vizyonga zid bo'lsa XATO
- Fake YO'Q: `{ok:true}`/echo/`[] as unknown` TAQIQ; tayyor bo'lmagan endpoint → halol **501**
- Forma saqlash = kirit → saqla → qayta och → ko'rinadimi (round-trip)
- **No rewrite** — tizim ~70% qurilgan; faqat **tuzat va ula**

**Process (LOYIHA-QOIDALARI):**
- **Re-audit-first (D3):** har modulni qurishdan oldin mavjud holat READ-ONLY xaritalanadi
- **DDL = owner approval (Q-35):** yangi jadval/migration → `APPROVED:` izoh bo'lmasa TAQIQ
- **Permission gate (Q-28/I3):** o'zgarishdan OLDIN fayl:satr + aynan o'zgarish + sabab → egasi "ha"
- **Verify-don't-trust (Q-29/C2):** har audit da'vosini eskirgan deb hisobla → DB+kod+probe bilan tasdiqla
- **No regression (Q-39/C5):** o'chirilgan qayta yaratilmaydi; avval ishlagan hamon ishlaydi
- **Separate commit per phase** · `git add <aniq-fayl>` (add -A TAQIQ)
- Report after each phase in **Uzbek (lotin)** (Q-38/I4), then wait for owner "continue"

**Canonical tables (H-section):**
- GL = **`entries`** (kanonik); `gl_journal_entries`+`gl_lines` = SAP #76 — TEGMA
- Stock = **`warehouse_stock`** (kanonik); `current_stock` = VIEW
- Orders = **`sales_orders`** (kanonik); `sd_sales_orders` = VIEW
- **2-dunyo TAQIQ** (H4): shu tushuncha uchun boshqa jadval bormi? → mavjudni ishlat

**Design (Q-41 / G-section):**
EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`). Existing templates only: ListPage / FormPage / DetailPage / DashboardPage. FIN module color = green/teal family. No new design systems.

**6 cross-cutting build-rails (E-section):**
- **E1** AI kuzatadi → jarima/blok/pasayish FAQAT inson TASDIG'i (penya hisoblanadi, qo'llanishi tasdiq bilan — EP-FIN-062)
- **E2** Karta-markaz: byudjet limiti + tasdiqlash huquqi + mas'uliyat = KARTADAN (EP-FIN-032/009)
- **E3** AI rejalashtiradi: to'lov navbati/cash-flow prognozi AI taklif (EP-FIN-059/080) → menejer tasdiq
- **E4** Operator IoT-tablet: brak/kamomad → floor (HR-057/COR-087) → moliyaga EVENT avtomatik
- **E5** Org-sxema marshruti: ZVS/ZNO hujjat vertikal + gorizontal org-sxema bo'yicha; oxiri DIREKTORGA (EP-FIN-007/CC-028)
- **E6** Bitta haqiqat: kanonik GL = `entries`; 1C/A-System to'liq almashtiriladi

═══════════════════════════════════════════════════════════════
## 1. WHY / GOAL
FIN (Finance/GL + KASSIR) is a **T1 core module** — the financial backbone of the entire ERP golden thread. Every other module's money flows ultimately write to this module: POS/WMS movements → GL, Payroll → GL, SD invoices → GL, PP/MES material sarf → GL, QC kamomad → GL. Without a working GL and ZVS/ZNO pipeline, the golden thread (lead→buyurtma→material→ishlab chiqarish→yetkazish→**FOYDA**) cannot close.

**Vision measure of "correct" (Q-40):** the FIN module is correct when:
1. Every money movement in the system creates a real double-entry GL record in `entries`
2. ZVS/ZNO requests flow through org-chart approval (summa-tier: ≤500k bo'lim / ≤5M Рек.Совет / >5M director)
3. KASSIR sub-module fully controls all cash: podotchet, har-som-hisobli, profil-qarz, chek-AI, kunlik-PDF
4. 4-hisob (MAIN/TAX/HEAD/WORKING) balances are real and dashboard-visible
5. Aging (debitor + kreditor separate) is live-calculated against `entries`
6. FP-cycle cron (Se/Ch/Pa/Du) fires correctly and sends Telegram+ERP notifications

**Source documents — read these, build to them, do NOT invent:**
- `docs/audit/decisions/03-finance.md` — EP-FIN-001..086 full decision map (56 answered, 30 resolved via OCHIQ-JAVOBLAR)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → **Finance/GL section** (30 owner overrides — these OVERRIDE A-defaults)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — all project rules
- `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md` → sections 8 (KASSIR/naqd-nazorat) + 15 (Finance-Kassir row) + C (vizyon-hujjat kassir)
- `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` → FP-cycle, ZVS/ZNO, 4-hisob context
- Memory: `project_4p0_hidden_fixes_2026_06_04.md` (GL insertJournal + db.transaction existing), `session_2026-05-28_session16_complete.md` (GL accounts/docs P3 dashboards), `session_2026-05-29_payroll_be_verification.md` (payroll GL lines — INPS8/JSHD12 real)

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing FIN implementation (READ-ONLY) — MANDATORY FIRST STEP

FIN is **partially built** (GL insertJournal real, payroll GL lines real, ZVS/ZNO backend tables exist, FP-cycle cron runs, 4-hisob partial, depreciation.service exists, finance-ai stubs). Do NOT rebuild. Map exactly what exists vs what the vision needs.

**Read-only audit tasks:**
1. **Tables (run `_audit/q.cjs` read-only):** list all finance-related tables with row counts: `entries`/`gl_entries`/`gl_journal_entries`/`gl_lines`, `zvs_requests`/`zno_requests`, `budgets`/`budget_lines`, `cash_accounts`, `invoices` (AP/AR), `payment_calendar`, `advance_reports`, `cost_centers`, `approval_matrix` — do they exist? column list? row count?
2. **BE endpoints:** scan `apps/api/src/modules/finance*` — which controllers/services are real vs stub (`return notImplemented`/`return {}`/`return []`). List real endpoints (real DB) vs stub/fake.
3. **FE pages:** scan `artifacts/erp-dashboard/src/pages/finance*` — what renders, what saves, what is stub. Check sidebar: how many Finance routes active?
4. **GL posting:** verify `insertJournal` (from commit 6cae643e) — does it actually write to `entries`? Does `db.transaction` wrap it? Probe: `GET /api/finance/gl/entries` count.
5. **Payroll GL:** verify payroll GL lines (INPS8/JSHD12 from session_2026-05-29) — do they write to `entries` or to `pos_gl_postings` (POS-FIX5 from vizyon-hujjat)?
6. **FP-cycle cron:** verify cron actually fires (Se/Ch/Pa/Du); does it send Telegram+ERP or is it a no-op?
7. **ZVS/ZNO:** verify tables exist + approval-matrix logic (500k/5M thresholds) — real or stub?

**Output:** write `docs/FIN-RE-AUDIT-2026-06-08.md`:
```
| Feature (EP-FIN-###) | Vision | EXISTS? | Real/Stub | Gap | Effort |
```
Cover all 86 EP-FIN decisions grouped by: GL core / ZVS-ZNO-Approval / KASSIR / Budgets-Aging / Reports / Cross-module events.

→ **STOP. Show owner the re-audit. Get explicit "continue" approval before any build.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

> Each phase: permission gate → BE+FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD → separate commit → Uzbek report → wait for "continue".

---

### PHASE 1 — GL Core: canonical double-entry ledger + 4-hisob
**Goal:** every money movement writes a real balanced double-entry record to `entries`; 4-hisob (MAIN/TAX/HEAD/WORKING) accounts are real and queryable.

**Decided features:**
- EP-FIN-022 — yagona kanonik GL (`entries`); ALL modules write here (kassa/ZNO/payroll/SD/MM)
- EP-FIN-023 — doim ikki tomonlama (debet=kredit invariant); balanslashmasa yozuv qabul qilinmaydi
- EP-FIN-004 — 4-hisob alohida (MAIN/TAX/HEAD/WORKING), har biri balans+harakat
- EP-FIN-024 — milliy BHMS COA (42 accounts seed already exists — verify, don't re-seed)
- EP-FIN-064 — davr yopish: qulflangan davr → yozuv taqiqi; faqat egasi/moliya rahbari ochadi (immutable, HR Q83)
- EP-FIN-047 — data egaligi: tannarx/qarz = Buxgalteriya; sotuv narxi = SD; boshqalar faqat o'qiydi
- EP-FIN-086 — narx master-data faqat Buxgalteriya/moliya kartasi egaligida (RBAC kartadan, SodGuard)

**Owner overrides (OCHIQ-JAVOBLAR):**
- EP-FIN-036: narx = **FIFO/FEFO** (ziddiyat hal; weighted-avg emas)
- EP-FIN-055: QQS = **faqat ichki** (rasmiy fiskal YO'Q — ichki tahlil uchun reyestr)

**Tasks:**
- BE: verify/fix `insertJournal` in `apps/api/src/modules/finance/` — must wrap in `db.transaction`, enforce debet=kredit (throw if unbalanced), write to `entries` (NOT `gl_journal_entries`)
- BE: `GET /api/finance/gl/entries` — real paginated query with filters (date-range, account, module-source)
- BE: `GET /api/finance/gl/accounts` — list COA (BHMS 42 accounts); verify seed exists, don't re-seed if rows > 0
- BE: Period lock endpoint — `POST /api/finance/gl/periods/:id/lock` (RBAC: owner/finance-manager only)
- FE: GL ledger page (ListPage template) — entries with debet/kredit columns, balance; period lock toggle
- FE: 4-hisob dashboard widget — current balance per account-type (real query)

**DDL:** if `entries` table missing columns → STOP, write migration proposal → owner approval before executing.

**Verify:** `tsc 0` + probe `POST /api/finance/gl/test-posting` (if exists) or create a test double-entry → GET `/api/finance/gl/entries` count increases by 2 rows + debet=kredit.

**DoD:** real balanced INSERT to `entries`, period-lock blocks new entries, 4-hisob real balances on FE, separate commit, Uzbek report.

---

### PHASE 2 — ZVS / ZNO + Approval Matrix (3-tier: bo'lim/Рек.Совет/director)
**Goal:** ZVS (haftalik byudjet so'rovi) and ZNO (majburiyat/to'lov so'rovi) full lifecycle with org-chart-routed approval.

**Decided features:**
- EP-FIN-001 — ZVS to'liq ekran (kiritish + ro'yxat + holat); ShVB blankiga mos
- EP-FIN-002 — ZNO to'liq ekran (yetkazib beruvchi, summa, hujjat, ZVS ga bog'lab)
- EP-FIN-003 — avtomatik koordinatsiya savatiga + 24/48 soat muddat; hujjat org-sxema bo'yicha yuradi
- EP-FIN-007 — 3-bosqich approval: bo'lim ≤500k / Рек.Совет ≤5M / direktor >5M (avtomatik tanlanadi)
- EP-FIN-009 — tasdiqlovchi = KARTA (lavozim), odam almashsa karta qoladi (E2 karta-markaz)
- EP-FIN-010 — muddat o'tsa → eskalatsiya + 2x eslatma → HR/rahbar xabardor (CRON)
- EP-FIN-025 — tasdiqlangan ZNO → avtomatik GL yozuvi → kassa/bank (EVENT)
- EP-FIN-026 — hujjat biriktirish majburiy (ma'lum summadan yuqori); hujjatsiz tasdiq BLOK
- EP-FIN-029 — 6-holatli oqim: Yangi→Bo'lim→Kengash→Direktor→To'langan→Rad (qaytarish bilan)
- EP-FIN-048 — og'zaki ma'lumot qaror asosi emas: har to'lov so'roviga hujjat majburiy

**Owner overrides:**
- EP-FIN-008: tasdiqlash chegarasi = **ekrandan sozlanadi** (dasturchisiz; inflyatsiyaga moslashuvchan)
- EP-FIN-012: FP-tsikl kunlar = **ekrandan o'zgartiriladi** (bayram/bankga moslashuvchan)
- EP-CC-028: tasdiq marshruti = org-sxema bo'yicha yuqoriga, hammasi oxiri **DIREKTORGA** [override — summa-tier only determines required level, not final destination]

**Tasks:**
- BE: ZVS CRUD (`zvs_requests` table; verify exists or DDL-approval); Zod validation; Result<T>
- BE: ZNO CRUD (`zno_requests`); link to ZVS; attach documents (file upload); status FSM (6 states)
- BE: Approval matrix service — `getRequiredLevel(amount)` reads from configurable settings (not hardcoded); org-chart resolver finds card-holder at required level (E2 + E5)
- BE: Approval action endpoints (approve/reject/escalate); on ZNO approve → emit `ZnoApprovedEvent` → GL posting (Phase 1 `insertJournal`)
- BE: CRON — every 6h check overdue approvals → send Telegram+ERP notification → escalate if 2x missed
- FE: ZVS list+form (ListPage/FormPage templates); ZNO list+form with doc upload; approval action buttons (approve/reject with reason)
- FE: Settings page: approval thresholds (editable by owner/director only; RBAC), FP-cycle days

**Verify:** create ZVS → approve → ZNO linked to it → director approves → check `entries` has 2 new rows (debet=kredit); probe approval endpoint with non-director role → 403.

**DoD:** full 6-state lifecycle works, GL auto-posts on ZNO approval, escalation cron fires, thresholds configurable, RBAC gated, separate commit, Uzbek report.

---

### PHASE 3 — KASSIR sub-module (naqd-nazorat markazi)
**Goal:** full cash management — podotchet, har-som-hisobli, profil-qarz, chek-AI verify, kunlik PDF, reyting-navbat, smena opening/closing.

**Decided features (OMBOR-KASSIR-INTERVYU §8 + vizyon-hujjat §C):**
- EP-FIN-020 — kassa to'liq ERP ichida (har kirim/chiqim + kunlik qoldiq); 1C yo'q
- EP-FIN-021 — POS/ombor harakati kassa+GL ga avtomatik yoziladi (EVENT from POS)
- EP-FIN-049 — avans hisoboti (podotchet): berildi → chek bilan hisob → qoldiq qaytariladi; hisob bermagan avans muddat o'tsa → oylikdan avtomatik chegiriladi (HR Q182)
- EP-FIN-057 — to'lov usuli majburiy maydon; har usul o'z hisobiga bog'lanadi (kassa/bank)
- EP-FIN-058 — bir nechta bank hisobi (so'm/valyuta) alohida; umumiy qoldiq dashboard
- EP-FIN-072 — kassa limiti + oshsa inkassatsiya eslatmasi (CRON)
- KAS-1 (vizyon §C) — smena ochish/yopish + kunlik X/Z hisobot
- KAS-2 (vizyon §C) — oylik/avans tarqatish kassir orqali; har operatsiya PIN tasdiq

**Owner overrides (OMBOR-KASSIR-INTERVYU):**
- **Har som hisobli:** istalgan xodim biror narsaga pul olsa → xodim profiliga qarz yoziladi → omborga kirim bo'lmaguncha profilda turadي (9-savol)
- **Chek AI:** xodim chekni ERP orqali yuklaydi → AI o'qiydi + solishtiradi → ODAM (kassir/moliya) yakuniy tasdiqlaydi (11-savol; E1 global printsip)
- **Oylik/avans navbati:** xodim reytingiga qarab (formula keyinga qoldirildi — formulani stub sifatida placeholder, to'g'ri bog'lanish HR reyting tayyor bo'lgach)
- **Kunlik PDF:** kun oxirida avto-generatsiya → Telegram + ERP → xodim ko'radi (qabul qilganini belgilaydi) (kassir intervyu §A7)

**Tasks:**
- BE: Cash accounts CRUD (`cash_accounts` — verify table); smena open/close endpoints; X/Z report generation (real aggregation from `entries`)
- BE: Podotchet lifecycle: advance-given → `advance_reports` table (verify/create with DDL-approval) → chek upload → AI read (Gemini API stub OK for Phase 3; mark as Phase 5 AI integration) → human approval → GL posting; overdue → HR deduction event
- BE: Employee debt tracking: `employee_debts` or `employee_profile.debt_balance` (check existing table); profile endpoint shows jami-olgan/nimaga/qancha-tasdiqda/qancha-qarz
- BE: Daily PDF generation cron (end-of-day) → queue (BullMQ); Telegram send
- BE: Cash limit CRON — check balance vs limit → escalation notification
- FE: Kassir dashboard (DashboardPage template) — cash balance, pending advances, employee debts, smena status
- FE: Podotchet form+list; chek upload with AI status badge; approve/reject action
- FE: Employee debt page — "Mening profilim" qarz ko'rinishi (read from real endpoint)

**Verify:** issue advance → employee in debt → upload receipt → kassir approves → debt cleared; check `entries` has settlement record; kunlik PDF query returns real data.

**DoD:** full advance cycle, employee debt tracking real, cash limit alert fires, PDF auto-generates, RBAC (kassir role scoped), separate commit, Uzbek report.

---

### PHASE 4 — Budgets + Aging (debitor/kreditor) + AP/AR invoices
**Goal:** departmental budgets linked to cards; two separate aging views (debitor/kreditor); invoice registration triggers AP with aging.

**Decided features:**
- EP-FIN-017 — bo'lim (va karta) bo'yicha byudjet (each card knows its limit; E2 karta-markaz)
- EP-FIN-018 — ZVS so'rovini byudjetga avtomatik taqqoslash + qolgan summa + oshsa ogohlantirish
- EP-FIN-019 — haftalik asosiy + oylik/yillik jamlanma byudjet ko'rinishi
- EP-FIN-014 — aging to'liq (4 guruh: 0-30/31-60/61-90/90+; eng eski yuqorida; rang-kodli)
- EP-FIN-015 — debitor/kreditor 2 ALOHIDA ekran (aralashmaydi)
- EP-FIN-016 — 90+ kun = direktorga ham escalate; kunlik CRON
- EP-FIN-037 — Schyot-faktura kiritilganda avtomatik kreditor qarz (AP) yoziladi, aging boshlanadi
- EP-FIN-054 — har yetkazuvchi to'lov muddati profili → aging shunga nisbatan (not just date)
- EP-FIN-078 — xarajat-markaz (bo'lim/uchastkaga) per-GL-entry; bo'lim-bo'yicha hisobot
- EP-FIN-032 — har kartaga byudjet limiti + tasdiqlash huquqi biriktiriladi (karta-markaz)

**Owner overrides:**
- EP-FIN-015: aging = **2 alohida ekran** (A confirmed)
- EP-FIN-060: kredit limit = A — mijoz limiti; oshsa SD buyurtma blok/tasdiqqa; limitni **egasi/moliya** oshiradi
- EP-FIN-061: qisman to'lov = **eng eski faktura avval (FIFO)**; qo'lda taqsimlash ham mumkin

**Tasks:**
- BE: Budget CRUD per department/card (`budgets`, `budget_lines` tables; verify/DDL-approval); `checkBudget(cardId, amount)` service used by ZVS Phase 2
- BE: Aging query service — real SQL aggregation from `entries`/`invoices`; separate debitor (SD) / kreditor (MM) aging; 4-bracket + total
- BE: Aging CRON — daily check 90+ bucket → escalate to director card
- BE: AP invoice registration (`invoices` table — verify existing; if `ar_invoices`/`ap_invoices` separate — use canonical or DDL-approval); on save → emit to GL insertJournal (AP debit/credit)
- BE: Debtor credit-limit enforcement — `checkCreditLimit(customerId, amount)` → used by SD module (cross-module event); limit editable by owner/finance-manager
- FE: Budget management page (ListPage + FormPage) — department/card budgets, weekly/monthly/yearly views
- FE: Debitor aging page (separate from kreditor) — 4-bucket table, color-coded, sortable by age
- FE: Kreditor aging page — same structure, separate endpoint
- FE: AP Invoice list+form

**Verify:** register Schyot-faktura → `entries` row created → kreditor aging shows new row in correct bucket; budget edit on card → ZVS over-budget shows warning on FE.

**DoD:** budgets real per card, aging live from `entries`, AP invoice triggers GL, credit limit enforced cross-module, CRON escalation fires, separate commit, Uzbek report.

---

### PHASE 5 — FP-cycle, Reports, Cross-module GL events, Notifications
**Goal:** weekly financial planning cycle live; full report suite; all cross-module GL postings connected; Telegram ShVB commands.

**Decided features:**
- EP-FIN-011 — 4-kunlik FP-tsikl (Se/Ch/Pa/Du) cron — verify existing cron real or no-op; fix if needed
- EP-FIN-013 — eslatmalar: Telegram + ERP bildirishnoma ikkalasi
- EP-FIN-027 — moliya ko'rsatkichlari holat formulasiga kiradi (kam kassa/katta qarz = XAVF) → Director dashboard
- EP-FIN-028 — Telegram ShVB: `/zvs_status`, `/company_state`, `/weekly_digest`
- EP-FIN-031 — to'liq hisobotlar: kunlik kassa / haftalik FP / oylik P&L / aging → PDF eksport
- EP-FIN-056 — payroll yopilganda avtomatik GL (xarajat + kreditor soliq, xodim); verify existing or fix POS-FIX5
- EP-FIN-063 — inventarizatsiya farqi → avtomatik GL tuzatmasi; moliya tekshiradi/tasdiqlaydi (POS Q52-53)
- EP-FIN-065 — moliyaviy og'ish hisobotlari Совершенствование oylik tahliliga avtomatik
- EP-FIN-066 — og'ish chegaradan oshsa → mas'ul kartaga tushuntirish talabi (Coordination EVENT)
- EP-FIN-082 — moliyaviy dashboard egasi uchun: qoldiq + 7-kun prognoz + qarzlar + foyda
- EP-FIN-085 — brak% > norma → tannarx og'ishi + ogohlantirish (QC dan event)

**Owner overrides:**
- EP-FIN-005: tushum 4-hisobga taqsim = **avtomatik foiz** (intizom kafolati; foiz egasi tomonidan sozlanadi)
- EP-FIN-006: taqsim foizini kim = **faqat egasi/direktor** o'zgartiradi (RBAC; audit-log yoziladi)
- EP-FIN-034: kamomad = **kg × narx = zarar avtomatik, smenaga bog'lanadi** (then global printsip E1: qo'llash tasdiq bilan)
- EP-FIN-038: vazn-farqi da'vo = hisoblanadi lekin qo'llanishi **hujjat+rasmlar bilan, qabul qilgan xodimga bog'liq** (E1; ko'r-ko'rona avto-chegirma emas)
- EP-FIN-062: penya = avto HISOBLANADI (kechikkan kun × stavka), lekin **qo'llash egasi/rahbar TASDIG'i** bilan (E1)

**Tasks:**
- BE: FP-cycle cron — verify Se/Ch/Pa/Du fires correctly; send Telegram (Telegraf.js) + ERP notification; configurable days endpoint
- BE: Revenue distribution service — on `CashReceivedEvent` → split by 4-hisob percentages (owner-configurable from settings); only owner can update percentages; audit-log
- BE: Cross-module GL event listeners: `PayrollClosedEvent` → GL (verify real from session_2026-05-29), `InventoryCountDiffEvent` → GL adjustment (moliya tasdiq pending), `BrakKgRecordedEvent` → kamomad GL (smena-bound), `SaleInvoicedEvent` → revenue GL
- BE: POS-FIX5: verify `pos_gl_postings` disconnect — if payroll/POS writes to `pos_gl_postings` not `entries` → fix to write to canonical `entries`
- BE: PDF report generation — kunlik kassa hisobot, haftalik FP, oylik P&L, aging; server-side PDF (pdfmake or existing lib)
- BE: Telegram bot commands: `/zvs_status` (pending ZVS count + total sum), `/company_state` (Director holat formula), `/weekly_digest` (FP cycle summary)
- BE: Penya calculation service — `calculatePenya(invoiceId)` computes amount; separate `applyPenya(id)` endpoint requires owner/manager approval (E1)
- FE: Owner financial dashboard (DashboardPage) — 4-hisob balances, 7-day cash-flow forecast, aging summary, foyda donut
- FE: Reports page — PDF download buttons per report type; real data from BE
- FE: Revenue distribution settings (owner-only RBAC toggle)

**Verify:** trigger test `PayrollClosedEvent` → check `entries` has payroll GL rows; FP cron fires → Telegram bot receives message; generate kunlik PDF → file returned with real numbers.

**DoD:** FP-cycle real, all cross-module GL events connected, PDF reports real, Telegram commands working, revenue distribution configurable, penya requires human approval, separate commit, Uzbek report.

═══════════════════════════════════════════════════════════════
## DoD — 7 CONDITIONS (all must pass, per phase)
1. **BE real:** CRUD + Result<T> + Zod + real DB INSERT/UPDATE (no fakes, no echo)
2. **FE real:** EP Linear Soft template + token, loading/error states, persists on round-trip
3. **Hujjat:** update `docs/FIN-RE-AUDIT-2026-06-08.md` gap table — mark resolved items
4. **Tests:** BE unit tests for GL invariant (debet=kredit), approval matrix thresholds; FE smoke
5. **i18n:** all new UI strings in UZ+RU translation files (`uz/finance.json`, `ru/finance.json`)
6. **Edge-cases:** period-locked GL rejects, unbalanced entry rejects, budget overage warns, zero/negative amounts rejected (Zod), document-required gates block
7. **Automation:** each money-movement emits correct `EP-FIN-###` op-code to audit-log (`level=info code=EP-FIN-025 action=GL_POST amount=...`)

Each operation MUST log its **EP-FIN-### op-code** in audit-log (LOYIHA-QOIDALARI §J1).

═══════════════════════════════════════════════════════════════
## RAILS (per-phase reminders)
- **Permission gate:** before ANY file change → state file:line + exact change + reason → get owner "ha"
- **Verify-don't-trust:** run `_audit/q.cjs` SELECT counts before claiming table exists
- **Separate commit per phase** — never bundle phases; message format: `feat(fin): phase N — <what>`
- **No regression:** after each phase run `tsc`, run `bash scripts/run-all-reviewers.sh`, probe existing finance endpoints still return non-500
- **No rewrite:** if `insertJournal` exists and works → extend it; do not recreate
- **Honest 501:** if a feature can't be finished in this phase → return `HttpStatus.NOT_IMPLEMENTED` with op-code comment; NEVER fake data
- **DDL = owner approval:** every new `CREATE TABLE` or `ALTER TABLE` → write migration proposal → wait for `APPROVED:` before executing
- **Report to owner in Uzbek** after each phase; include: nima qilindi / DB isboti / tsc holati / qaysi EP-FIN kodlar yopildi / keyingi bosqich
- **Windows nest watch Q-44:** if server drops to 000 after big rebuild → restart `pnpm --filter @europrint/api run dev:unsafe`; use static fallback (tsc + DB-proof) if server is down

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — do not skip)
1. **After Phase 0 RE-AUDIT** — show owner `docs/FIN-RE-AUDIT-2026-06-08.md`; get explicit approval before building
2. **Before any DDL** — every new migration needs `APPROVED:` comment (Q-35); write proposal, wait
3. **Before changing `entries` table structure** — canonical GL table; any schema change = owner approval
4. **Before fixing POS-FIX5** (payroll GL redirect) — this touches HR+POS+Finance; confirm exact files + impact with owner
5. **Before revenue distribution percentages** (EP-FIN-005/006) — owner sets actual percentages; placeholder in code until owner provides values
6. **After each phase** — show Uzbek hisobot, get "davom" before starting next phase
