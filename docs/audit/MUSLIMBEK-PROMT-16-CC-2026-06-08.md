# EXECUTOR PROMPT #16 — BUILD T2: CC / Communication Center (3-savat, 14 hujjat turi)
> CC = 3-savat MANBA (ziddiyat #3 hal). Hujjat-oqim org-sxema bo'yicha; oxiri DIREKTORGA.
> Written by advisor (Claude) · Executor = Muslimbek · 2026-06-08 · English; owner reports in Uzbek.

═══════════════════════════════════════════════════════════════
## 0. ROLE & RULES
You are the 🟢 **EXECUTOR**. Read `CLAUDE.md` + `docs/agent-constitution.md` first.

**All hard rules apply (from LOYIHA-QOIDALARI-2026-06-08.md):**
- **Code style (B):** TypeScript strict · Zod (not class-validator) · Drizzle ORM · Result<T> (no throw/null) · file ≤900/func ≤150 · constants in `business.constants.ts` · controller = transport only · service via repo only · no hardcoded secrets · `@UseGuards`/`@Public` on every controller
- **Correctness (C):** verify-don't-trust (Q-29) · no fake (Q-40/43) · real DB INSERT/UPDATE every form · round-trip proof (kirit→saqla→qayta-och) · no regression (Q-39) · no rewrite (C6 — ~70% exists, fix & connect)
- **Governance (I):** permission gate before every change (Q-28) · `git add <exact-file>` only · commit after each phase · report after each phase in Uzbek (Q-38) · wait for "continue" before next phase
- **DDL = owner approval (Q-35):** new migration/CREATE TABLE requires `APPROVED:` comment in file + owner "ha" before running
- **Canonical tables (H):** `sales_orders` · `warehouse_stock` · `entries`/`gl_entries` — no two-world duplication
- **Design (G):** EP Linear Soft tokens (`var(--ep-*)`, `var(--mod-*)`) · existing templates (ListPage/FormPage/DetailPage/DashboardPage) — no new design · tab max 2 levels (Q-42)
- **Op-code logging (J):** every operation logs `EP-CC-###` code to audit-log (`level=info code=EP-CC-014 ...`)

═══════════════════════════════════════════════════════════════
## 1. WHY / GOAL
**CC (Communication Center)** is the **document workflow engine** for the entire EuroPrint ERP. Tier T2 (BOSHQARUV/NAZORAT — ShVB kommunikatsiya/hujjat qatlami).

Role in the system:
- **3-savat manba (ziddiyat #3 resolved):** Kanban's 3-basket (Kiruvchi/Kutilmoqda/Chiquvchi) is fed from CC — every document pending approval lands in the recipient's Kiruvchi; after action it moves out. CC is the source; Kanban is the display.
- **Document-lifecycle engine:** draft → submit → routed → approved/rejected → archive. All 14 document types (ZVS, ZNO, доклад, распоряжение, приказ, протокол, umumiy ariza, reja o'zgartirish, smena yakuni, orgpolitika, sifat ogohlantirish, taъминот заявкаси, режа қоғози, НАЗОРАТ ВАРАҚАСИ) flow through CC.
- **Org-routing engine:** every document travels the org-chart (vertical → horizontal, never skips); final approver = **Director** (EP-CC-028 owner override).
- **Replaces A-System/Bitrix** (E6 — single truth): all formal records in ERP only.

**Vision = measure of correct (Q-40):** code that works (200) but does not match the decided vision = wrong. Source docs — read all before building:
- `docs/audit/decisions/20-cc.md` — full 84-question decision map (60 answered / 24 open with A-default)
- `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` → CC section (4 owner overrides, 12 A-default confirmations)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` — project rules (this file)
- `docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` — format reference

═══════════════════════════════════════════════════════════════
## PHASE 0 — RE-AUDIT existing CC implementation (READ-ONLY) — DO THIS FIRST

The decision map states CC is **already LIVE** with: `cc_documents`, 3-basket tables, document templates, AI-interview (`cc-ai-interview`), auto-numbering (`cc-document-number`), workflow (draft/submit/approve/reject/resubmit), PIN-signing (`cc-pin`), org-route resolver (`cc-org-resolver`), SLA cron (`cc-sla.cron`), basket rules (`basketRule24h`, `basketOverdue`). **Do NOT rebuild what already works.**

Map the following in **read-only** mode:

**Backend:**
- Tables: `cc_documents`, basket/approval tables, template tables, `cc_document_approvals`, `cc_audit_log` — list columns + live row counts (use `_audit/q.cjs` read-only).
- Services/repos: which methods are real (DB-backed) vs stub (return `{ok:true}` / `[]`)?
- Endpoints: list all `/api/cc/*` routes — test each for real vs stub response.
- SLA cron — is it wired to real data? Does `cc-sla.cron` run?
- Org-resolver — does `cc-org-resolver` use live `manager_id` chain? Does it handle `manager_id = NULL` (fallback to DEPT_HEAD → Director)?

**Frontend:**
- Which CC pages render? Which forms persist to DB (round-trip proof)?
- Is the 3-basket (Kiruvchi/Kutilmoqda/Chiquvchi) wired to CC events?
- AI-interview form — does it produce a real draft `cc_documents` row?

**Gap table → write `docs/CC-RE-AUDIT-2026-06-08.md`:**

| Feature (vision) | EP-CC-### | Exists? | Real or stub? | Gap | Effort |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

→ **STOP. Show owner the re-audit report. Get explicit "ha, davom et" before Phase 1.**

═══════════════════════════════════════════════════════════════
## BUILD PHASES

Each phase follows the same rail:
**permission → BE+FE parallel → verify (tsc 0 + DB-proof + FE persist round-trip) → DoD check → separate commit → Uzbek report → wait for "continue"**

---

### PHASE 1 — Document template master-data + org-routing engine hardening

**Scope (decided features):**

**Template master-data (EP-CC-002, EP-CC-019, EP-CC-034, EP-CC-035):**
- Only `super_admin` creates/edits templates; others use them (EP-CC-002). Protect with `@Roles('super_admin')`.
- Each template has: `doc_type` (ZVS/ZNO/доклад/распоряжение/приказ/протокол/umumiy ariza/reja-ozgartirish/smena-yakuni/orgpolitika/sifat-ogohlantirish/taminot-zaявkasi/reja-qogozi/nazorat-varakasi), `communication_type` tag (yozma-majburiy/ogzaki-cheklangan/vertikal/gorizontal/analitik — EP-CC-034), SLA hours per doc-type (avans=4h, ta'til=24h, muammo=15min/1h — EP-CC-011/051), approval stages array, `is_mandatory` flag (6 mandatory-written types — EP-CC-035), cascade-task config (EP-CC-014), urgency levels (EP-CC-084).
- Seed the 14 document type templates on first migration.

**Org-routing engine (EP-CC-005, EP-CC-006, EP-CC-021, EP-CC-028, EP-CC-036):**
- ⭐ **Owner override (EP-CC-028):** approval route goes up the org-chart → **ALL routes end at Director** (NOT sum-based tiers — the owner explicitly overrode the A-default matrix). Implement: template stages = [immediate_manager → dept_head → director]; no sum threshold routing.
- NULL-safety (EP-CC-006): `manager_id = NULL` → fallback to `DEPT_HEAD` of same department → Director. Never drops a document.
- Route is bound to **position card** (EP-CC-021/040), not to the individual employee. If the employee changes, the route follows the card.
- "Skip boss" rule (EP-CC-036): route always starts from immediate manager; only `doc_type = favqulodda` may skip (requester marks + audited).

**DDL note:** If `cc_document_templates` table or template-stage tables are missing → write migration with `APPROVED: owner confirmed Phase 1 DDL on [date]` comment → present to owner → run only after "ha".

**Verify:** `tsc 0` + DB row count for templates + FE template-list page shows 14 types + org-resolver test (mock employee with `manager_id = NULL` → confirm fallback path).

**DoD:** (1) BE real CRUD + Result + Zod + DB · (2) FE real (ListPage template, loading/error, persists) · (3) docs updated · (4) unit test for org-resolver NULL path · (5) i18n UZ/RU keys · (6) edge-cases (no manager, skip-boss audit) · (7) EP-CC-005/006/028 op-codes logged.

**Commit** with message: `feat(cc): phase-1 template master-data + org-routing engine (EP-CC-005/006/028)`

---

### PHASE 2 — Document lifecycle + PIN-signing + 3-basket wiring

**Scope (decided features):**

**Lifecycle flow (EP-CC-001, EP-CC-020, EP-CC-031, EP-CC-009, EP-CC-016, EP-CC-043, EP-CC-074):**
- Single entry point: "Yangi hujjat" → template selector → AI-interview (if `cc-ai-interview` exists, wire it; otherwise fallback to manual form — EP-CC-004) → auto-save draft (EP-CC-031).
- Status machine: `qoralama → yuborilgan → jarayonda → tasdiqlangan/rad_etilgan → arxiv`.
- Auto-numbering per template (EP-CC-015): format e.g. `ZVS-2026-0042`, sequential, no gaps.
- Approved document = **immutable** (EP-CC-016/043/074): no edit after approval; only a counter-document can reverse it. Enforce at DB level (trigger or service guard) and FE (disable edit buttons for `status = tasdiqlangan`).
- Rejection (EP-CC-009): `rad_etilgan` → requester sees rejection reason (mandatory) → can resubmit. Rejection comment is required — block submit without it.
- Version history (EP-CC-030/039): every action logged (who/when/IP/what); `cc_audit_log` append-only.
- Two-sided accountability (EP-CC-039): `sent_at`, `read_at`, `responded_at` timestamps on each approval record.

**PIN-signing (EP-CC-007):**
- Verify `cc-pin` exists and is wired to the approval flow. Each sign action requires PIN entry → logged to `cc_audit_log` with `EP-CC-007` op-code.

**3-basket wiring (EP-CC-012, EP-CC-013):**
- When a document reaches an approver's stage → insert/update a Kanban basket row `basket_type = kiruvchi` for that approver (EP-CC-012).
- After approval/rejection → move basket item out (`chiquvchi` or `completed`).
- SLA 24h → `qizil` highlight + reminder; 48h → escalate to manager (EP-CC-013). This is the `basketRule24h`/`basketOverdue` logic — if already live, verify and fix only gaps.
- ⭐ **Cross-cutting principle (E5):** basket assignment follows the org-chart — the same `manager_id` chain used in routing.

**Urgency (EP-CC-084):** "Shoshilinch" flag on document requires a mandatory reason + routes to higher approver. Baseless urgency = drops to normal queue (service enforces).

**Verify:** create a document → submit → confirm basket row appears for approver → approve with PIN → confirm `status = tasdiqlangan` + `immutable` guard fires on re-edit attempt.

**DoD:** all 7 conditions. Op-codes: EP-CC-001/007/012/013/015/016/031.

**Commit:** `feat(cc): phase-2 document lifecycle + PIN-signing + 3-basket wiring (EP-CC-001/012/013/015/016)`

---

### PHASE 3 — SLA cron + escalation + Telegram notifications

**Scope (decided features):**

**SLA engine (EP-CC-010, EP-CC-011, EP-CC-013, EP-CC-051, EP-CC-059):**
- SLA hours stored per template (configured in Phase 1). Types:
  - Standard: avans 4h, ta'til 24h (EP-CC-011).
  - Problem/quality alert: 15 min → smena-texnolog → bosh-texnolog; 1h → RD-5 → bo'lim/uchrashuv (EP-CC-051).
  - Raw-material order: 2h before shift (EP-CC-059).
- SLA cron (`cc-sla.cron`) — if already exists, verify it reads real `cc_documents` rows and fires correctly. If stub — implement:
  - Every minute: scan `status = jarayonda` + `current_stage_deadline < NOW()`.
  - 1st breach: reminder to current approver (in-app + Telegram — EP-CC-024).
  - 2nd breach: escalation to approver's manager (EP-CC-010/122).
  - HR notification on final escalation (EP-CC-010).
- Shift-end summary document: deadline = end-of-shift; if not submitted → red flag + escalation (EP-CC-049). Cron checks at shift boundaries.

**Telegram (EP-CC-023, EP-CC-024):**
- Approval request → Telegram message to approver with [Tasdiqla] / [Rad et] buttons + PIN confirmation (EP-CC-023). Use existing Telegraf.js bot.
- In-app notification also sent (EP-CC-024).
- ⭐ **Cross-cutting principle (E1):** Telegram sends the alert; the approver confirms (human decision, not auto-approve). The cron only sends reminders — it never approves automatically.

**Monthly analytics cron (EP-CC-066):**
- At month-end: aggregate plan-change documents → reasons summary → auto-report document created for director.

**Verify:** write a test document → let SLA timer expire → confirm Telegram fires → confirm escalation chain in `cc_audit_log`.

**DoD:** all 7. Op-codes: EP-CC-010/011/023/024/049/051/066.

**Commit:** `feat(cc): phase-3 SLA cron + escalation + Telegram (EP-CC-010/011/023/024/066)`

---

### PHASE 4 — Document types: special templates + mandatory fields

**Scope (decided features):**

**Reja o'zgartirish (EP-CC-046, EP-CC-047, EP-CC-068, EP-CC-080):**
- Template fields (all mandatory): tashabbuskor + sabab_guruhi (5-group dropdown: material yo'q / dastgoh buzilishi / mijoz talabi / rejalashtirish xatosi / rahbar qarori — EP-CC-047) + izoh + kutilgan_natija.
- Completed-plan rule (EP-CC-048): if linked `production_order` is not 100% done, require an approved reja-ozgartirish document to proceed. Integration point with PP/MES (ask owner before wiring DB FK — Q-35).
- Operator comment (EP-CC-068): closing a plan without comment = "bajarilmagan" auto-status.

**Orgpolitika (EP-CC-052, EP-CC-053, EP-CC-054, EP-CC-055, EP-CC-063, EP-CC-064, EP-CC-081):**
- Template = 4 sections: Hozirgi holat / Maqsad / Harakatlar detalizatsiyasi / Mukammal manzara (EP-CC-081).
- Routing: dept head → CEO → НО-3/xodimlar → **founder (Ayubxon Pozilov) PIN as final stage** (EP-CC-063). Note: only `orgpolitika` + large-sum types reach the founder; regular requests do not.
- After approval: auto-task to adaptation manager (1-day deadline — EP-CC-053) → EP-CC-054 acknowledgment record required from each target-position employee (PIN-sign "tanishdim").
- НАЗОРАТ ВАРАҚАСИ (EP-CC-055): digital per-card checklist with PIN-sign per section. Create if not exists (DDL approval required).
- СЕРИЯ tag on each document/orgpolitika (EP-CC-061) for archive categorization.

**Sifat ogohlantirishi (EP-CC-072, EP-CC-073):**
- Short SLA (EP-CC-051 rules). Auto-notify: ОТК → СОЗ + texnolog + участка manager simultaneously.
- Сifat ишчи журнали (EP-CC-073): append-only register (never delete rows); each shift min 1 entry.

**Taъминот заявкаси / Смена хом-ашё заявкаси (EP-CC-058, EP-CC-059):**
- Taъминот заявкаси fields: material + miqdor + buyurtma_raqam → approved → routes to procurement queue.
- Smena хом-ашё заявкаси: 2h-before-shift SLA enforced.

**Режа қоғози (EP-CC-060):**
- Fields: rulon_id (FK to `warehouse_stock`) + reja_miqdor + fakt_vazn + qaytarilgan_miqdor → on approval, auto-GL posting to Finance (ask owner: which GL entry type before implementing — Q-35/DDL).

**Document-to-position routing (EP-CC-062, EP-CC-077):**
- Each document can have multiple target positions (not just the approval chain) — all receive it and must acknowledge.
- РД-code / lavozim-code field on document (EP-CC-077) — pulled from org-card.

**Verify:** create one of each new template type → submit → confirm mandatory fields block submission → confirm routing reaches director → confirm СЕРИЯ tag in archive.

**DoD:** all 7. Op-codes: EP-CC-046/047/052/053/054/055/058/059/060/061/062/063/072/073.

**Commit:** `feat(cc): phase-4 special templates (orgpolitika/sifat/reja/taminot) (EP-CC-046..073)`

---

### PHASE 5 — Archive + PDF + full-text search + attachment

**Scope (decided features):**

**Archive & immutability (EP-CC-016, EP-CC-043, EP-CC-074):**
- Archive retention: director-level documents 10 years; employee documents 3 years (EP-CC-016). Store `archive_until` date on each document.
- Immutable guarantee: `status = tasdiqlangan` rows → DB-level: no UPDATE/DELETE (trigger or row-level security). Counter-document (new row with `reverses_id` FK) is the only way to undo — never delete.

**Full-text search (EP-CC-017):**
- Search endpoint: filter by doc_type + date_range + sender + status + full-text (PostgreSQL `to_tsvector` on document body). FE: multi-field filter panel (ListPage template).

**PDF generation (EP-CC-018):**
- Every approved document → server-side PDF: logo + doc number + approval chain + dates + signatures. Use existing PDF library (check what's in use; do NOT add a new one without owner approval).
- `GET /api/cc/documents/:id/pdf` → binary PDF response.

**File attachments (EP-CC-025):**
- Multiple files (PDF/image) per document. Store on ERP server (existing storage module). Max file size and types — use existing config. FE: drag-drop uploader + list.

**Scanned paper import (EP-CC-076):**
- `POST /api/cc/documents/scan-import`: upload scanned image + meta (doc_number/СЕРИЯ/date/position) → creates an `arxivlangan` document row with `source = scan`.

**ZVS/ZNO → Finance pipeline (EP-CC-027):**
- When a ZVS/ZNO document reaches `status = tasdiqlangan` → emit `ZvsApprovedEvent` → Finance module listener adds to payment queue. Verify the event listener exists and is wired; if stub → implement real handler. (No new tables needed — Finance already has payment queue.)

**Verify:** approve a test document → download PDF → confirm logo+chain+dates present → search by text in body → confirm result → upload attachment → re-open document → confirm attachment visible.

**DoD:** all 7. Op-codes: EP-CC-017/018/025/027/076.

**Commit:** `feat(cc): phase-5 archive + PDF + search + attachments (EP-CC-017/018/025/027/076)`

---

### PHASE 6 — AI-interview + card-AI analysis + version lock

**Scope (decided features):**

**AI interview (EP-CC-003, EP-CC-004, EP-CC-032, EP-CC-075):**
- Verify `cc-ai-interview` is real (not stub): AI asks questions → builds formal document text. If stub → implement with Gemini API (existing AI stack).
- Fallback (EP-CC-004): if AI is unavailable → manual form mode. Document submission never blocked by AI failure.
- Language (EP-CC-032/075): default = Cyrillic (uz-cyr); user can switch to Latin/Russian. AI drafts in requester's chosen language.
- Auto-save draft every 30s during interview (EP-CC-031) — prevent loss of long sessions.

**Card-AI analysis at approval (EP-CC-022 — owner confirmed "Ha, faza 2"):**
- ⭐ **Owner override (EP-CC-022):** before approval, AI provides a short analysis (mos/risk/tavsiya). Decision stays with the human (E1 principle). Implement as non-blocking: approver sees AI summary panel; can proceed regardless.
- Use Gemini API. Analysis: check document consistency, flag risks, suggest improvements (3 bullets max).
- AI analysis result stored in `cc_document_approvals.ai_analysis` JSONB field.

**Causality tracing (EP-CC-042 — owner confirmed "Ha"):**
- ⭐ **Owner override (EP-CC-042):** approval/decision form has a mandatory "asos: qaysi hujjat/raqam" field. Stores `basis_document_id` FK on `cc_document_approvals`.
- FE: autocomplete search for existing document numbers.

**Version lock (EP-CC-043):**
- When a new version of a template is published → existing draft documents using old template get `template_version = eskirgan` flag → UI shows "Bu shablon yangilangan — qaytadan boshlang" warning. New actions on stale drafts are blocked.

**Document chain (EP-CC-082):**
- Parent-child linking: `cc_documents.parent_id` FK (self-referential). FE: document detail shows "chain" section — parent document + child documents (breadcrumb). This closes the "golden thread" for CC: опросный лист → тех карта → лаборатория → ишлаб чиқариш.

**Verify:** start AI interview → interrupt (close browser) → re-open → confirm draft auto-saved → complete → submit → confirm AI analysis panel shows in approver view → confirm `basis_document_id` mandatory on approval → confirm document chain renders.

**DoD:** all 7. Op-codes: EP-CC-003/004/022/042/043/082.

**Commit:** `feat(cc): phase-6 AI-interview + card-AI analysis + causality + chain (EP-CC-003/022/042/082)`

═══════════════════════════════════════════════════════════════
## DoD — 7 CONDITIONS (per phase, every phase must pass all)

1. **BE real:** CRUD + Result<T> + Zod validation + real DB INSERT/UPDATE/SELECT — no `{ok:true}` stubs, no `[] as unknown[]`, no echo responses. If table not ready → honest HTTP 501.
2. **FE real:** existing template (ListPage/FormPage/DetailPage) + EP Linear Soft tokens + loading skeleton + error toast + form persists (kirit→saqla→qayta-och = ko'rinadi).
3. **Docs:** `docs/CC-RE-AUDIT-2026-06-08.md` updated; inline code comments on non-obvious logic.
4. **Tests:** BE unit test for each new service method; FE smoke test for each new form.
5. **i18n:** all new UI strings in `/i18n/uz` + `/i18n/ru` (no hardcoded text in TSX).
6. **Edge cases:** NULL manager_id handled · rejected document cannot be re-submitted without editing · approved document cannot be edited · SLA 0h edge · empty attachment list · AI timeout fallback.
7. **Automation:** each operation logs its `EP-CC-###` op-code to audit-log (`level=info code=EP-CC-014 actor_id=... doc_id=...`); SLA cron runs; Telegram events fire.

═══════════════════════════════════════════════════════════════
## 6 CROSS-CUTTING PRINCIPLES — CC application

Apply these in every phase:

- **E1 (AI observes → human confirms):** AI-interview drafts text, AI analysis flags risks, SLA cron sends reminders — but **no automatic approval, no automatic rejection, no automatic penalty**. Every negative effect (rejection, escalation, blocking) requires human action. (EP-CC-022: AI tahlil, qaror odamda.)
- **E2 (Card-centric):** Document routing is bound to the **position card** (EP-CC-021/040), not the individual employee. `responsible_card_id` FK on documents. If the employee holding a card changes, pending documents auto-reassign to the new card-holder. НАЗОРАТ ВАРАҚАСИ is per-card (EP-CC-055).
- **E3 (AI plans):** AI-interview plans the document structure (EP-CC-003); AI analysis suggests approval decision (EP-CC-022). Humans confirm. Monthly analytics report auto-generated (EP-CC-066).
- **E4 (Operator IoT-tablet):** Smena хом-ашё заявкаси (EP-CC-059) and смена yakuni xulosasi (EP-CC-049) are the two CC document types submitted from the operator's IoT tablet. Ensure mobile-responsive form layout for these two types.
- **E5 (Org-chart routing):** ⭐ **Owner override (EP-CC-028):** ALL document routes travel upward through the org-chart and end at the **Director** — no sum-based bypass. `manager_id` chain drives routing; NULL-safety = DEPT_HEAD → Director. Org changes → routes auto-update (no manual reconfiguration needed).
- **E6 (Single truth):** CC replaces A-System/Bitrix (EP-CC-065). No parallel document system. Canonical tables: use existing `cc_documents` + related tables; check for two-world duplicates before any new table (H4).

**⭐ CC-specific owner overrides (from OCHIQ-JAVOBLAR-2026-06-08.md — CC section):**
1. **EP-CC-028** Approval route = org-sxema bo'yicha yuqoriga, **hammasi oxiri DIREKTORGA** (NOT sum-tier matrix — this was explicitly overridden).
2. **EP-CC-014** Cascade = Ha (hujjat tasdiqlangach shablonga ko'ra avto-vazifa → Kanbanga; распоряжение-loop closes).
3. **EP-CC-022** Document AI = Ha (tasdiqdan oldin AI qisqa tahlil: mos/risk/tavsiya; qaror odamda, **faza 2** — implement in Phase 6).
4. **EP-CC-042** Causality = Ha ("asos: qaysi hujjat/raqam" mandatory field on approval).

═══════════════════════════════════════════════════════════════
## RAILS (per-phase enforcement)

| Rail | Rule |
|---|---|
| Permission gate | Before any file edit: `fayl:satr` + exact change + reason → owner "ha". No change without it. |
| BE+FE parallel | Backend and frontend built together in each phase — neither left half-done. |
| Verify | After each phase: `tsc 0` + DB-proof (row count / real data) + FE persist round-trip. |
| Separate commit | One commit per phase. Message format: `feat(cc): phase-N description (EP-CC-###)`. |
| No regression | After each commit: run `bash scripts/run-all-reviewers.sh` — 0 new FAILs. Previously passing tests still pass. |
| No rewrite | Map existing `cc_*` code first (Phase 0). Fix and connect; do not rebuild from scratch. |
| Honest 501 | If a required table is not yet approved by owner → return `501 Not Implemented` (not fake `{ok:true}`). |
| DDL = owner approval | Any `CREATE TABLE` / new migration → write migration file with `APPROVED:` comment placeholder → present to owner → run only after "ha". |
| Uzbek report | After each phase, write a short Uzbek summary: nima qilindi / nima tekshirildi / qanday muammolar. |

═══════════════════════════════════════════════════════════════
## STOP POINTS (mandatory — do not proceed past these without owner confirmation)

1. **After Phase 0 RE-AUDIT** — show gap table → owner approves build plan → then Phase 1.
2. **Before any DDL** (new table / migration) — present migration file with `APPROVED:` comment → owner says "ha" → then run.
3. **Before touching canonical tables** (`sales_orders`, `warehouse_stock`, `entries`) — even for FK additions — stop and ask.
4. **EP-CC-060 Режа қоғози → GL posting** (Phase 4): confirm with owner which GL entry type / account codes before wiring Finance integration.
5. **EP-CC-028 routing** — if re-audit shows an existing sum-tier routing implementation — do NOT silently replace it; stop and confirm owner wants the override applied.
6. **After each phase** — show Uzbek report → wait for "continue" before starting next phase.
