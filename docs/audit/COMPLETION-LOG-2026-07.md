# Completion Log — VISION-3340-RECONCILIATION full-closure run (2026-07-04)

> Source: `docs/audit/VISION-3340-RECONCILIATION-2026-07-04.md` (835 findings, 20 areas).
> 599 actionable (STILL-OPEN + PARTIALLY-RESOLVED). Parsed mechanically (script, not LLM-read)
> into: **72 findings / 55 files** with a clean current-file reference (Phase 1, "quick-connect"),
> and **527 findings** with no extractable current file (Phase 2 — mostly new-feature/UI
> construction or owner-data blocks, requires area-by-area handling, not file-grouping).

Format: `[file path] — N findings closed (source_band_ids) — commit hash — status`

---

## Phase 1 — file-grouped quick-connect (72 findings / 55 files)

### Batch 1 (16 P0 groups attempted, 4 succeeded — 12 hit a transient Anthropic-side rate limit, requeued in Batch 2)

- `artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog.tsx` — 2 findings (SB0133 resolved, SB0109 blocked-owner-data) — e190c39b — RESOLVED+BLOCKED-OWNER-DATA (adversarial-verified PASS)
- `apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts` — 1 finding (SB0322) — no commit (correct no-op) — BLOCKED-OWNER-DATA (adversarial-verified PASS)
- `apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts` — 1 finding (SB0585) — a96438ad — RESOLVED (adversarial-verified PASS)
- `apps/api/src/modules/pos/application/services/auto-gl-posting.service.ts` — 2 findings (SB0817, SB0820) — f846a393 — RESOLVED (adversarial-verified PASS)

### Batch 2 (12 remaining P0 groups retried — all 12 succeeded; 36 P1/P2 hit the same rate limit again, requeued in Batch 3)

- `apps/api/src/common/guards/permission.guard.ts` — 5 findings (SB0076, SB0099, SB0190, SB0192, SB0722) — no commit — BLOCKED-OWNER-DATA (card_id fill 1/32; wiring cardId into position_permissions would collide with an overlapping ID space — verified live) (adversarial-verified PASS)
- `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx` — SB0089 RESOLVED (already fixed pre-existing, commit f5c0950e, confirmed still live) — no new commit — (adversarial-verified PASS). SB0092 (razryad not shown on profile) is **STILL OPEN**, not fabricated into a bucket: root cause is `card.repository.ts::listEmployeeCards()` has no join to `razryad_levels` at all, so the fix needs 3 files together (card.repository.ts + card.service.ts + EmployeeProfile.tsx), which is outside this single-file group's scope (Q-31) — queued as a follow-up task, not dropped.
- `apps/api/src/modules/pp/application/pp-ai-planning.service.ts` — 2 findings (SB0235, SB0516) — no commit — BLOCKED-OWNER-DATA (AI provider key + owner-approved scheduling criteria) (adversarial-verified PASS)
- `apps/api/src/modules/pp/infrastructure/repositories/pp-planning.repository.ts` — 2 findings (SB0254, SB0272) — no commit — RESOLVED (verified already non-issues in current code) (adversarial-verified PASS)
- `apps/api/src/modules/auth/application/services/login.service.ts` — 4 findings (SB0078, SB0097, SB0189, SB0055) — f9b05df5 — RESOLVED (documented `CARD_LOGIN_GATE_ENABLED` default-OFF in `.env.example` with rationale; card_id fill rechecked live = 1/32, far below the 50% safety threshold, so the gate was correctly **NOT** flipped default-on) (adversarial-verified PASS — verifier also caught that this commit accidentally bundles an unrelated 12-line `ai-planning.service.ts` change from a concurrent git race; see AIProductionPlanning.tsx row below, which is the real owner of that hunk)
- `apps/api/src/modules/hr/.../payroll.service.ts` — 2 findings (SB0056, SB0098) — 3f1357c — RESOLVED (base_salary now uses gated card-sum, not raw salary) (adversarial-verified PASS)
- `apps/api/src/database/seeds/admin.seed.ts` — 1 finding (SB0210) — no new commit (already fixed in prior commits a5ae3110/bacfb448, working tree clean) — RESOLVED (adversarial-verified PASS)
- `apps/api/src/modules/general/services/legacy.service.ts` — 1 finding (SB0211) — no commit — RESOLVED-VERIFIED-NONISSUE (the two remaining `sql.raw()` sites at schema.ts:119/invariants.ts:86 are both regex-guarded literal-only DDL escape hatches per the project's own Qoida B exception, not live injection vectors; CLAUDE.md's "TUZATILSIN" note predates these guards and is stale) (adversarial-verified PASS)
- `artifacts/erp-dashboard/src/pages/AIProductionPlanning.tsx` — 1 finding (SB0273) — **f9b05df5** (agent misattributed this to `bbdd1d0b` due to concurrent-branch confusion; corrected here after cross-checking git history — the real diff, an approval-chain status-transition gate on `AiPlanningService.executePlan`, is confirmed present in f9b05df5) — RESOLVED
- `apps/api/src/modules/hr/.../hr-gsd.repository.ts` — 1 finding (SB0300) — ac96e64d — RESOLVED (card-GSD weekly read/write wired to ckp_fact_values) (adversarial-verified PASS)
- `apps/api/src/modules/crm/.../deal-won.listener.ts` — 1 finding (SB0667) — bbdd1d0b — RESOLVED (FK sales_orders.deal_id → deals.id added, dry-run verified 0 orphans) (adversarial-verified PASS)
- `apps/api/src/modules/director/infrastructure/repositories/council-members.repository.ts` — 1 finding (SB0403) — no commit — BLOCKED-OWNER-DATA (self-verified, P1/P2 tier)

### Batch 3 (36 P1/P2 groups, chunked 12+12+12 sequentially to dodge the rate limiter — 36/36 succeeded, 0 failures)

- `artifacts/erp-dashboard/src/routes/AppRouter.tsx` — 2 findings (SB0040, SB0046) — b6b7c270 — RESOLVED (added missing "AIsha" sidebar entry; route itself was already correct)
- `apps/api/src/modules/finance/infrastructure/event-handlers/wms-fg-received.listener.ts` + `wms-goods-issued.listener.ts` — 2 findings (SB0290, SB0296) — no commit — BLOCKED-OWNER-DATA (WMS→FIN wiring verified fully correct; `entries`=7 rows / `wms_goods_issues`=1 row live — low count is transaction-volume, not a code defect)
- `artifacts/erp-dashboard/src/pages/ERPProduction.tsx` — 2 findings (SB0266, SB0696) — no commit — RESOLVED-VERIFIED-NONISSUE (1-level tab nesting, fully Q-42 compliant; audit's own notes already flagged this as UX-density only)
- `apps/api/src/modules/director/application/owner-summary.service.ts` — 2 findings (SB0379 resolved, SB0385 blocked) — 05ea7948 — RESOLVED+BLOCKED-OWNER-DATA (added missing daily 08:00 cron for the Telegram digest; the 5-owner-numbers gap is real SQL against `sd_customers` but churn_risk_pct/total_revenue/last_order_date are 100% NULL live — no upstream writer exists anywhere in the codebase)
- `artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx` — 1 finding (SB0031) — no commit — RESOLVED (verified already-correct, no defect)
- `apps/api/src/modules/core/departments/departments.repository.ts` (+ `.service.ts`) — 1 finding (SB0058) — no commit — **BLOCKED-DRY-RUN-FAILED, needs your yes/no**: agent verified these 2 files are genuinely dead (zero imports/consumers anywhere; `core-departments-compat.controller.ts` confirms `DepartmentsController` was already deleted 2026-05-21, canonical path is `org_departments`) and wanted to delete them per Q-46, but the harness's own safety classifier blocked the file deletion and the agent correctly did not bypass it. I independently re-verified the dead-code claim via grep (confirmed accurate). **Action needed from you:** say the word and I'll delete `apps/api/src/modules/core/departments/departments.repository.ts` + `departments.service.ts` in a follow-up commit.
- `apps/api/src/modules/org-structure/card-template.controller.ts` (+ service/repository) — 1 finding (SB0069) — no commit — RESOLVED (verified already correct)
- `apps/api/src/common/middleware/tenant.middleware.ts` — 1 finding (SB0204) — no commit — BLOCKED-OWNER-DATA (activating tenant enforcement is an architecture decision)
- `lib/db/src/schema/pp/pp-enhanced.ts` (migration `06-pp-tech-card-master.sql`) — 1 finding (SB0248) — 5374c6c0 — RESOLVED (added missing Drizzle pgTable schema for tech_card_bom/routes/versions)
- `apps/api/src/modules/qc/application/qc-certificate-pdf.service.ts` — 1 finding (SB0460) — no commit — RESOLVED (verified already fully implemented)
- `apps/api/src/modules/logistics/.../order-created-delivery.listener.ts` — 1 finding (SB0484) — 684a409e — RESOLVED (fixed stale NO-OP docstring; listener was already live)
- `apps/api/src/modules/sd/.../sd-dashboard.controller.ts` — 1 finding (SB0592) — 64094767 — RESOLVED (added manager KPI leaderboard endpoint)
- `artifacts/erp-dashboard/src/pages/SDSalesOrders.tsx` — 1 finding (SB0613) — abb619b6 — RESOLVED (replaced broken `prompt()` cancel-reason with a proper Dialog)
- `apps/api/src/common/database/queries-mm-goods.ts` + `drizzle-mm-goods.repo.ts` — 1 finding (SB0547) — **fad2c7f8** (committed by me — the sub-agent's own commit failed on a `git index.lock` race from a concurrent session; I independently verified the diff, ran tsc clean, and committed the exact 2 files) — RESOLVED (3-way match now computes real matched/variance instead of returning only raw joined rows)
- `apps/api/src/modules/qc/infrastructure/event-handlers/qc-passed.listener.ts` — findings SB0548/SB0556 — no commit — investigated, file itself correct; real gap lives in a different out-of-scope file (left untouched per Q-31, not silently dropped — needs a follow-up file-group)
- `artifacts/erp-dashboard/src/pages/LmsCourses` / `apps/api/.../lms-courses.controller.ts` — 1 finding (SB0113) — 94d69510 — RESOLVED (added course approval workflow UI)
- `apps/api/src/modules/aisha/application/tools/analyze-camera-feed.tool.ts` — 1 finding (SB0502) — no commit — BLOCKED-OWNER-DATA (missing camera hardware registration data)
- `artifacts/erp-dashboard/src/components/.../RazryadTab.tsx` — 1 finding (SB0791) — no commit — RESOLVED (verified already correct)
- `apps/api/src/modules/hr/employees/employee-monthly-card.service.ts` — 2 findings (SB0431, SB0416) — 68931eac — RESOLVED (wired bonus_uzs to the real bonus_payments approval chain)
- `artifacts/erp-dashboard/src/pages/TechCards.tsx` — 1 finding (SB0702) — 5f692460 — RESOLVED (fixed double-padding in loading state)
- `apps/api/src/modules/ckp/.../ckp-cascade.listener.ts` — 2 findings (SB0007, SB0011) — no commit — RESOLVED (verified already fully implemented and wired)
- `apps/api/src/modules/mes/.../pp-released-mes.listener.ts` — 2 findings (SB0283, SB0297) — 17c4d1503a25f836758ab55d374bf1012332f69b — RESOLVED (verified session_number unique constraint backs the PP→MES idempotent guard)
- `apps/api/src/modules/ckp/.../ckp-gate.ts` — 1 finding (SB0010) — no commit — RESOLVED (already resolved by pre-existing LmsCardGateService wiring)
- `apps/api/src/modules/auth/auth.module.ts` — 1 finding (SB0202) — 2df29b07 — RESOLVED (aligned JwtModule fallback TTL to canonical 15m)
- `apps/api/src/modules/hr/.../attendance-bot.service.ts` — 1 finding (SB0203) — no commit — BLOCKED-OWNER-DATA (requires an owner policy decision on what stays accessible during an absence-block)
- `apps/api/src/modules/mes/.../mes-completed.listener.ts` — 1 finding (SB0282) — no commit — RESOLVED (verified already-correct intentional design)
- `apps/api/src/modules/pp/application/services/pp-intelligence.service.ts` (`run-mrp.handler.ts`) — 1 finding (SB0278) — 0d10f4cf — RESOLVED (wired inventory_policy.lot_sizing_method + review_period_days into MRP)
- `apps/api/src/modules/iot/iot.module.ts` — 1 finding (SB0315) — 1e8f610e — RESOLVED (registered IotGateway as provider so `/iot` WS namespace is live)
- `apps/api/src/modules/director/presentation/director-root.controller.ts` — 1 finding (SB0374) — no commit — RESOLVED (verified already correct)
- `apps/api/src/modules/ai/.../ai-daily-report.cron.ts` — 1 finding (SB0378) — 540fe1c2fbfd1784cff94012e70bc1b2f92083bc — RESOLVED (moved daily CKP-question cron 08:00→07:00 Tashkent time)
- `apps/api/src/modules/ai/presentation/ai-fit.controller.ts` — 1 finding (SB0505) — d02354d5 — RESOLVED (per-card RBAC: manager can no longer see outside their scoped card)
- `apps/api/src/modules/ai/.../budget-tracker.service.ts` — 1 finding (SB0529) — 73fc742e57789a7ed1fcc39c73e5647fd27ecd47 — RESOLVED (per-card AI cost rollup in usage stats)
- `apps/api/src/modules/org-structure/.../exam-passed-razryad.listener.ts` — 1 finding (SB0771) — 6f76596b7f04bfa513e4b139544227012dc7359a — RESOLVED (show ai_suggested badge in razryad requests/history UI)
- `artifacts/erp-dashboard/.../OTPVerify.smoke.test.tsx` — no commit — RESOLVED (verified already correct, no defect)
- `apps/api/src/shared/db/schema.ts` — 1 finding (SB0725) — no commit — RESOLVED (confirmed already-mitigated via PA-S4b/PA-S4c runtime guards)
- `apps/api/src/common/constants/security.constants.ts` — 1 finding (SB0731) — no commit — RESOLVED (verified all 8 bcrypt call sites already correct)

**All 4 commit hashes flagged for extra scrutiny in this batch, plus 13 more spot-checked, were independently confirmed via `git log`/`git merge-base --is-ancestor` against live HEAD — no further hash mixups found (unlike the AIProductionPlanning.tsx case in Batch 2).**


## Phase 2 — area-grouped (527 topilma, 20 soha, fayl-havolasiz)

> **Metod:** 20 soha-agent parallel (4x5 ketma-ket bo'lak), har biri o'z sohasidagi barcha
> topilmalarni kod+jonli DB bilan qayta tekshirdi (Q-29) — audit-hisobotning ko'p qismi
> ESKIRGAN/noto'g'ri chiqdi (allaqachon qurilgan kod "yo'q" deb belgilangan edi).
>
> **Raqamlar (dastlabki, xom):** RESOLVED=133 · BLOCKED-OWNER-DATA=141 · BLOCKED-DRY-RUN=3 ·
> STILL-OPEN=215 · commit=54. Yig'indi 492/527 — qolgan **30 topilma birinchi o'tishda hech
> qanday bucket'ga tushmay JIM tashlab ketilgan edi** (asosan soha-09 Hisobot: 12 ta), buni
> mexanik hisoblash (har soha-natijani asl 527-ro'yxat bilan solishtirish) orqali aniqlandi —
> mop-up workflow ishga tushirildi, natija quyida alohida qo'shiladi.
>
> ⚠️ **Kichik sifat-shovqin (rad etilmadi, lekin qayd etiladi):** ba'zi soha-agentlar bir ID'ni
> ikkita bucket'ga qo'ygan (masalan soha-03 LMS'da SB0144 ham RESOLVED ham BLOCKED-OWNER-DATA'da)
> yoki stillOpenIds massiviga ID o'rniga to'liq izoh-matn yozgan (soha-02/04/01). Bular
> individual xulosa-matnida hal qilingan (asosiy tahlil to'g'ri), faqat massiv-formatlash
> qattiq emas — yuqoridagi xom-raqamlar shuning uchun ozgina overlap-shovqin bilan.

**Xavfsizlik-darvoza to'g'ri ishladi (ikki mustaqil soha, bir xil xulosa):** soha-05 (Auth) va
soha-17 (Xavfsizlik) ikkalasi HAM mustaqil ravishda `CARD_LOGIN_GATE_ENABLED`ni DEFAULT-ON
qilmadi — DB-tekshiruv: 32 aktiv userdan atigi 1 tasi to'liq karta-biriktirilgan; yoqilsa
27/32 (84%) user darhol 401 bo'lardi. Bu bugungi sessiyaning eng boshidan beri qo'llanilgan
xavfsizlik-qoidaning ikkinchi mustaqil tasdig'i.

**Egasi tasdig'i kerak (BLOCKED-DRY-RUN-FAILED, 3 ta):**
- **SB0149** (soha 04, org-daraxt 17-ildiz muammosi) — 2 ta orfan test-qator (`org_departments`
  id=165/166, "P04 Unit Test", 2026-06-20dan qolgan, 36+ jadvalda FK/reference=0) topildi.
  Tranzaksion DRY-RUN (BEGIN...DELETE...ROLLBACK) MUVAFFAQIYATLI — root-count 17→15 bo'lar edi,
  xatosiz. Lekin haqiqiy DELETE+COMMIT xavfsizlik-klassifikator tomonidan BLOKLANDI
  (`org_departments`ga har qanday o'zgarish uchun aniq egasi ruxsati talab qilinadi). **DB
  hozircha o'zgarmagan.** Qolgan 15 ildizning qaysilari birlashtirilishi kerak — bu ALOHIDA
  katta struktura-qaror (A9, allaqachon `docs/audit/MASSIV-100/PHASE-08-daraxt-yagona-manager.md`da
  savol-hujjat tayyor).
- **SB0707/SB0727** (soha 17, card-login-gate) — yuqorida tasdiqlangan, xavfsiz emas, flag
  O'ZGARTIRILMADI (BLOCKED-OWNER-DATA bilan bir qatorda).

### Soha-bo'yicha batafsil (RESOLVED / BLOCKED-OWNER-DATA / BLOCKED-DRY-RUN / STILL-OPEN)

### Soha 04 — Org-struktura / KARTA-markazlilik (30 topilma)
- RESOLVED: 0 (-)
- BLOCKED-OWNER-DATA: 17 (SB0152, SB0153, SB0157, SB0158, SB0159, SB0160, SB0161, SB0167, SB0170, SB0172, SB0174, SB0178, SB0179, SB0180, SB0183, SB0186, SB0187)
- BLOCKED-DRY-RUN-FAILED: 1 (SB0149)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 12 (SB0150, SB0151, SB0154, SB0155, SB0156, SB0165, SB0166, SB0169, SB0171, SB0175, SB0182, SB0188)
- Commits: none
- Xulosa: Soha 04 (Org-struktura/KARTA) — 30 topilmaning barchasi CHUQUR tekshirildi (kod+DB, Q-29). HECH BIR kod o'zgarishi kiritilmadi (0 commit) — sabab: har topilma yo (a) allaqachon TO'LIQ qurilgan kod, faqat egasi-data yo'q, yoki (b) xavfsizlik-darvozasi bloklagan yagona DB-yozuv o'zgarishi, yoki (c) haqiqatan katta yangi funksiya (bir sessiyada xavfsiz emas).\n\nMUHIM QAYTA-BAHOLAR (audit eskirgan/noto'g'ri edi):\n- SB0151/SB0182 (5-holat state-machine \"yo'q\"): NOTO'G'RI. `card.service.ts` da to'...

### Soha 13 — WMS / Ombor + POS Monitor (33 topilma)
- RESOLVED: 19 (SB0544, SB0541, SB0531, SB0546, SB0574, SB0558, SB0543, SB0536, SB0540, SB0573, SB0545, SB0542, SB0534, SB0538, SB0555, SB0549, SB0578, SB0533, SB0556)
- BLOCKED-OWNER-DATA: 9 (SB0535, SB0577, SB0562, SB0550, SB0553, SB0569, SB0568, SB0571, SB0576)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 3 (SB0570, SB0575, SB0552)
- Commits: da50c641, f39ffa83, 38734ada, ca718c13, 10d4d38e
- Xulosa: Soha 13 (WMS/Ombor + POS Monitor), 33 topilma tekshirildi. Umumiy xulosa: audit-hisobot sezilarli darajada ESKIRGAN edi — ko'p "STILL-OPEN"/"not checked" deb belgilangan topilmalar aslida allaqachon to'liq qurilgan va ulangan kod bilan yechilgan edi (masalan pos-balance-guard.service.ts minus-saldo blok, 12-turli movement-taxonomy to'liq wired, FIFO/FEFO+karantin darvozasi, texkarta-material norma gate, barkod-chop-etish, 2-imzo akt, ijara-billing modeli). HAQIQATAN QURILDI/TUZATILDI (5 commit, ...

### Soha 06 — PP / ishlab-chiqarish reja (27 topilma)
- RESOLVED: 14 (SB0233, SB0234, SB0258, SB0241, SB0271, SB0261, SB0262, SB0237, SB0243, SB0247, SB0274, SB0276, SB0242, SB0256)
- BLOCKED-OWNER-DATA: 3 (SB0245, SB0277, SB0251)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 9 (SB0244, SB0246, SB0250, SB0275, SB0249, SB0236, SB0265, SB0270, SB0259)
- Commits: 548e80fb, 39b30edc, 66627970, 585272af
- Xulosa: 06-PP audit (27 findings) re-verified live against code+DB, not trusted blindly. BUILT/FIXED this session (4 commits, tsc 0, live-verified): - SB0233/SB0234/SB0258 (production_orders lacks card/org-dept link): added production_orders.org_department_id INTEGER + FK->org_departments(id) ON DELETE SET NULL + index, mirroring the exact pattern work_centers already uses. Nullable — no auto-card-assignment rule exists (egasi-DATA), so no value fabricated. Dry-run (rollback-tx) proved: valid FK insert ...

### Soha 08 — IoT / telemetriya (50 topilma)
- RESOLVED: 4 (SB0304, SB0324, SB0349, SB0357)
- BLOCKED-OWNER-DATA: 25 (SB0299, SB0301, SB0303, SB0308, SB0309, SB0312, SB0314, SB0316, SB0317, SB0318, SB0320, SB0327, SB0328, SB0331, SB0332, SB0341, SB0342, SB0343, SB0345, SB0346, SB0353, SB0359, SB0361, SB0362, SB0364)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 20 (SB0306, SB0307, SB0310, SB0311, SB0319, SB0321, SB0326, SB0329, SB0330, SB0333, SB0334, SB0335, SB0336, SB0337, SB0340, SB0344, SB0358, SB0365, SB0366, SB0367)
- Commits: c752b1a3, 87cb7d16
- Xulosa: IoT/telemetriya (08) — 50 topilma tekshirildi, hammasi Glob/Grep/DB bilan chuqur re-verify qilindi (Q-29). BAJARILDI (2 commit, tsc 0 xato): - SB0304/SB0324/SB0349 (shift-handover 2-imzo): FE (useIoTTablet.ts submitHandover) signatureData har doim yuborgan, lekin HandoverSchema uni Zod-siz tashlab yuborardi va INSERT signature_data ustunini o'z ichiga olmasdi — imzo har doim yo'qolardi. Endi: HandoverSchema signatureData majburiy qiladi (FE talabiga mos), INSERT uni saqlaydi, status endi hisobla...

### Soha 02 — HR / Xodim / karta-xodim bog'lanish (27 topilma)
- RESOLVED: 18 (SB0071, SB0072, SB0101, SB0107, SB0060, SB0066, SB0105, SB0063, SB0056, SB0086, SB0075, SB0085, SB0074, SB0090, SB0091, SB0093, SB0095, SB0089)
- BLOCKED-OWNER-DATA: 6 (SB0068, SB0080, SB0102, SB0062, SB0088, SB0055)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 3 (SB0067 / SB0058: 3 parallel BASE tables (org_functions 97 rows, org_departments 145 rows [now canonical per card.repository.ts], positions 96 rows) all live BASE TABLEs, not one canonical + views. 5+ files still read org_functions/positions directly (position-permissions.repository.ts, chat-room-users.repository.ts, positions.repository.ts, org-queries/mutations.repo.ts). Consolidating requires an owner decision on which table wins plus a data-reconciliation migration across ~340 rows and every FK pointing at the losers -- too large/risky for one session., SB0077: field-level RBAC for confidential fields (salary, passport/national_id, bank account) genuinely does not exist anywhere in the codebase (grepped hr/employees + hr module broadly, zero hits). Needs an owner/design decision on which fields are confidential per which roles, then a cross-cutting serializer/interceptor mechanism -- multi-file new capability, not a targeted fix., SB0069 / SB0108: card/org-node Excel IMPORT backend endpoint already exists and works (POST /api/org-structure/nodes/import, T10-04, row-validated partial-commit) but the FE (OrgStructureHierarchy.tsx) only wires the EXPORT button -- there is zero client-side xlsx-parsing infrastructure anywhere in artifacts/erp-dashboard (no SheetJS/xlsx usage at all). Building the Import dialog (file picker, client-side parse or upload-and-let-BE-parse, column-mapping preview, per-row error display matching the BE's {imported,failed,errors[]} shape) is a genuine multi-file new-feature lift needing a UX design decision (mapping UI, new FE dependency), not a same-session safe addition.)
- Commits: 7a99f21a, 95da6a33, e5523363, b6825b0d
- Xulosa: Phase-2 verify pass on soha 02 (HR/Xodim/karta-xodim bog'lanish), 27 findings. Most findings were STALE audit evidence -- deep code+DB verification found the karta-markazli build is far more complete than the audit implied: the 5-state card lifecycle (active/vacant/frozen/archived/acting), payroll's multi-card gated-salary generation with dynamic razryad coefficients, the stake-share formula, vacancy aging/priority/SLA buckets, and the full multi-card FE summary (table + FORMULA-A sum + acting b...

### Soha 17 — Xavfsizlik / multi-tenancy (15 topilma)
- RESOLVED: 0 (-)
- BLOCKED-OWNER-DATA: 7 (SB0707, SB0727, SB0709, SB0729, SB0708, SB0715, SB0718)
- BLOCKED-DRY-RUN-FAILED: 2 (SB0707, SB0727)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 8 (SB0711, SB0712, SB0720, SB0728, SB0713, SB0714, SB0716, SB0721)
- Commits: none
- Xulosa: Xavfsizlik-darvoza qo'llanildi: bu guruhdagi 15 topilmaning HAMMASI kod o'zgarishisiz qoldi — na resolvedIds, na commit. Sabab: har biri yo (a) egasi-data yo'qligi bilan bloklangan allaqachon to'g'ri qurilgan mexanizm, yo (b) bir sessiyada xavfsiz bo'lmagan katta arxitektura ishi.\n\nCARD-GATE (SB0707/SB0727, P0): `card-gate-precheck.service.ts` + `login.service.ts` (auth/application/services/) to'liq qurilgan, har loginda hisoblanadi, DB-proof bilan tekshirdim — DRY-RUN natija: 32 aktiv userdan...

### Soha 15 — CRM (43 topilma)
- RESOLVED: 6 (SB0640, SB0652, SB0673, SB0641, SB0651, SB0671)
- BLOCKED-OWNER-DATA: 9 (SB0629, SB0633, SB0637, SB0679, SB0655, SB0663, SB0675, SB0662, SB0668)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 25 (SB0630, SB0631, SB0634, SB0636, SB0648, SB0670, SB0649, SB0650, SB0658, SB0664, SB0665, SB0666, SB0674, SB0644, SB0642, SB0656, SB0639, SB0677, SB0657, SB0660, SB0672, SB0647, SB0661, SB0676, SB0643)
- Commits: e931b786, 55bf9f57, e9495020, e672370a, a1aa834c, 8663c0cc
- Xulosa: CRM group (43 findings) triaged with live DB verification (Q-29) before any change. RESOLVED (6 commits, tsc 0 errors each, DB dry-run verified): - SB0640/SB0652/SB0673 (lead scoring inactive): CrmLeadScoringService/LeadScorerService/LeadScorerV2Service existed as providers but were never called anywhere. DrizzleCrmLeadsRepository.mapLeadRow() always returned ai_score:null. Wired the EP-CRM-012 deterministic formula into findAll/findById/create/update AND into CrmAiExtendedService.getAiQuickScor...

### Soha 05 — Auth / RBAC / login (karta-gate) (26 topilma)
- RESOLVED: 0 (-)
- BLOCKED-OWNER-DATA: 4 (SB0191, SB0215, SB0216, SB0217)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 14 (SB0195, SB0197, SB0198, SB0199, SB0206, SB0213, SB0218, SB0219, SB0221, SB0222, SB0227, SB0228, SB0229, SB0231)
- Commits: none
- Xulosa: Deep-verified all 26 findings in Area 05 (Auth/RBAC/card-gate). Backend :3030 healthy (200), `cd apps/api && npx tsc --noEmit` = 0 errors (no code changed — verify-only outcome). Key discovery: several findings were STALE — the codebase has moved on since the audit snapshot:\n\n1) PARTIALLY-RESOLVED trio SB0201/SB0214/SB0223/SB0232 (payroll card-gate) is in fact FULLY WIRED already: `PayrollService.generatePeriodRows()` (apps/api/src/modules/hr/payroll/payroll.service.ts:639) + `listActiveCardPa...

### Soha 19 — Razryad / malaka / o'sish (24 topilma)
- RESOLVED: 9 (SB0777, SB0763, SB0767, SB0770, SB0781, SB0785, SB0786, SB0792, SB0793)
- BLOCKED-OWNER-DATA: 10 (SB0764, SB0776, SB0779, SB0782, SB0783, SB0784, SB0787, SB0769, SB0778, SB0788)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 6 (SB0770, SB0774, SB0789, SB0790, SB0780, SB0795)
- Commits: 2c886fb2, e9ffb5ed, 5ce784bc
- Xulosa: SOHA 19 (Razryad/malaka/o'sish) — 24 topilma tekshirildi, DB (europrint@5432) va kod bilan. REAL KOD-TUZATISH (3 commit, tsc 0 ikkala tomonda, dry-run BEGIN/ROLLBACK bilan tasdiqlangan): 1. SB0777 (event-listener yo'q manual PATCH uchun) — IKKITA yozish yo'li bor edi: card.repository.ts (org-structure/cards/:id) VA org-structure/org-mutations.repo.ts (org-structure/nodes/:id — bu FE haqiqatda ishlatadigan yo'l, RazryadTab.tsx shu orqali PATCH qiladi). Ikkalasida ham razryad_level_id to'g'ridan C...

### Soha 11 — QC / sifat (36 topilma)
- RESOLVED: 18 (SB0463, SB0475, SB0476, SB0443, SB0445, SB0467, SB0471, SB0492, SB0449, SB0450, SB0452, SB0453, SB0470, SB0494, SB0460, SB0495, SB0473, SB0493)
- BLOCKED-OWNER-DATA: 0 (-)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 19 (SB0444, SB0446, SB0447, SB0456, SB0457, SB0458, SB0459, SB0461, SB0462, SB0464, SB0465, SB0466, SB0468, SB0472, SB0477, SB0478, SB0479, SB0491, SB0496)
- Commits: 54868fc3, 07044c69
- Xulosa: DEEP VERIFY FINDING: most of the 36 QC audit findings were STALE — the audit's `to_regclass()` checks used wrong table names (e.g. checked 'instrument_calibrations' when the real table is 'qc_instrument_calibrations'; checked 'aql_standards'/'sort_grade_pricing' when real tables are 'qc_aql_config'/'qc_grade_price_coefficients'/'qc_sort_price_config'). Live DB has 34 qc_* tables total. ACTUALLY FIXED (2 commits, tsc clean on qc/* in isolation, dry-run proven): - SB0463: InstrumentCalibrationCont...

### Soha 20 — Moliya / GL / kassa (22 topilma)
- RESOLVED: 5 (SB0808, SB0815, SB0829, SB0811, SB0823)
- BLOCKED-OWNER-DATA: 7 (SB0796, SB0797, SB0806, SB0798, SB0800, SB0803, SB0822)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 4 (SB0802, SB0821, SB0833, SB0835)
- Commits: b613ee6a, 797d3a20, 46f83398
- Xulosa: Investigated all 22 Finance/GL/Cashier findings via Grep+DB (Q-29). The audit report is substantially STALE: most items marked STILL-OPEN were already fully built and wired. RESOLVED THIS SESSION (3 commits, tsc 0 errors, 1 migration applied live): - SB0808: VAT 12% was hardcoded in delivery-completed.listener.ts. Now reads settings.EP_VAT_RATE (mirrors the existing EP_COST_RATIO pattern) with a statutory-default fallback. No fabrication. - SB0815/SB0829: EP-FIN-072 "kassa limiti + inkassatsiya ...

### Soha 14 — SD / sotuv-buyurtma (41 topilma)
- RESOLVED: 5 (SB0611, SB0608, SB0609, SB0596, SB0612)
- BLOCKED-OWNER-DATA: 6 (SB0580, SB0588, SB0589, SB0623, SB0597, SB0600)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 30 (SB0579, SB0581, SB0582, SB0586, SB0587, SB0590, SB0593, SB0594, SB0595, SB0598, SB0599, SB0601, SB0602, SB0603, SB0604, SB0605, SB0606, SB0607, SB0610, SB0614, SB0615, SB0616, SB0620, SB0621, SB0622, SB0624, SB0625, SB0626, SB0627, SB0628)
- Commits: 48033e10, a4fdad3c, 8586cffd, f28b003b
- Xulosa: SD/sotuv-buyurtma (area 14) — 41 findings triaged with deep code+DB verification (Q-29). Backend :3030 was down for most of the session (Q-44 environment; live HTTP proof not possible) — used Q-32 static fallback (tsc + schema introspection + live-data dry-reads via _audit/q.cjs) throughout. BUILT (4 commits, all tsc-clean, schema-verified against live DB): - SB0611: customer 360 view only had orders/contacts tabs; added a "Mahsulotlar arxivi" (products archive) tab backed by a new sales_order_i...

### Soha 09 — Hisobot / dashboard / analitika (31 topilma)
- RESOLVED: 4 (SB0396, SB0374, SB0383, SB0369)
- BLOCKED-OWNER-DATA: 8 (SB0372, SB0387, SB0381, SB0398, SB0406, SB0373, SB0407, SB0397)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 7 (SB0370, SB0376, SB0384, SB0388, SB0393, SB0409, SB0410)
- Commits: ed441354, 82067fa8, 330bd2db, 82376d44
- Xulosa: Area 09 (Hisobot/dashboard/analitika), 31 findings investigated with deep code+DB verification (backend :3030 was down all session — Q-44 environment, static fallback used: tsc + rollback-free DB reads only, no live HTTP proof needed since no writes to sensitive data). KEY DISCOVERY: many findings were STALE — the audit's "not independently confirmed" caveats hid that most of Director module's core infrastructure is already real and wired: DirectorHolatService (5-metric weighted formula) is live...

### Soha 10 — MES / sex / ish-sessiya (25 topilma)
- RESOLVED: 4 (SB0420, SB0430, SB0417, SB0441)
- BLOCKED-OWNER-DATA: 4 (SB0425, SB0439, SB0433, SB0434)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 13 (SB0421, SB0442, SB0422, SB0437, SB0427, SB0428, SB0440, SB0426, SB0432, SB0413, SB0419, SB0436, SB0424)
- Commits: 5ba89d6c, 664d7e7c, a7bdcb92
- Xulosa: MES/sex module: 25 findings triaged via live code+DB verification (Q-29). 3 real fixes committed (0 tsc errors in my files each time): (1) SB0420 [P0->FIXED]: apps/api/src/modules/mes/infrastructure/repositories/mes-production-sessions.repo.ts — the TB-safety checklist gate was already fully implemented and enforced (production-session.aggregate.ts passChecklist(), fail-safe BLOCKED when requiredTotal=0) on BOTH real start paths (mes/sessions/:id/start AND iot/production-sessions/:id/start), but...

### Soha 16 — Frontend / dizayn-tizim / UX (21 topilma)
- RESOLVED: 7 (SB0691, SB0692, SB0682, SB0688, SB0700, SB0689, SB0690)
- BLOCKED-OWNER-DATA: 0 (-)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 13 (SB0680, SB0699, SB0685, SB0687, SB0704, SB0681, SB0686, SB0694, SB0697, SB0701, SB0703, SB0684, SB0683)
- Commits: 03402c90, 66c10da8
- Xulosa: Soha 16 (Frontend/dizayn-tizim/UX), 21 topilma tekshirildi. Backend :3030 000 edi (Q-44 muhit muammosi) — DB'ga to'g'ridan _audit/q.cjs orqali kirildi, static-fallback (Q-32) bilan ishlandi. HAQIQATAN TUZATILDI (2 commit, BE+FE tsc 0 xato): - SB0691 (P0): --mod-org va --ep-org-l0..l6 CSS tokenlari yo'q edi (grep 0 natija tasdiqladi) — artifacts/erp-dashboard/src/erp-modern-ui/ep-motion-helpers.css ga --mod-sd/pp/hr/warehouse/fi naqshiga ergashib qo'shildi; components/hr/org/types.ts va component...

### Soha 12 — AI (per-karta + planning) (19 topilma)
- RESOLVED: 2 (SB0501, SB0504)
- BLOCKED-OWNER-DATA: 3 (SB0497, SB0509, SB0517)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 14 (SB0498, SB0499, SB0506, SB0507, SB0510, SB0512, SB0518, SB0520, SB0521, SB0525, SB0526, SB0527, SB0508, SB0513)
- Commits: 9c6dd1e7, 05289638
- Xulosa: Soha 12 (AI per-karta + planning), 19 topilma tekshirildi. Ko'pi audit-hisobotdan KEYIN allaqachon tuzatilgan yoki noto'g'ri tavsiflangan (Q-29 tasdiqlandi). RESOLVED (2, shu sessiyada haqiqatan qurildi): - SB0501 (kunlik ЦКП/MES/QC/davomat→AI-fit prompt yo'q): drizzle-ai-fit.repo.ts listActiveCardAssignments() ga LEFT JOIN LATERAL employee_daily_kpi (real, 70 qator) qo'shildi — endi employeeProfile.recentDailyKpi orqali eng so'nggi attendance/quality/productivity/discipline/task-completion skor...

### Soha 01 — CKP / maqsad / KPI (23 topilma)
- RESOLVED: 5 (SB0016, SB0006, SB0024, SB0036, SB0008)
- BLOCKED-OWNER-DATA: 15 (SB0004, SB0023, SB0051, SB0052, SB0009, SB0005, SB0017, SB0025, SB0035, SB0018, SB0027, SB0030, SB0032, SB0033, SB0045)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 2 (SB0019 (=SB0050 duplicate dimension) — ai_ckp_scores table exists (ai-p36-fit-ckp-slice-2026-06-21.sql) with attendance_score/quality_score/plan_score/time_score/ai_explanation/salary_gate_pass columns but genuinely has ZERO writer anywhere in apps/api/src. This is a distinct AI-composite scoring feature (not the same as ckp_fact_values/ckp-gate.ts, which are already built and correct per SB0032). Building it needs: (1) an owner-approved weighting formula across 4 sub-scores, (2) an AI-provider integration decision (which provider generates ai_explanation, prompt design), (3) clarified semantics of salary_gate_pass vs the existing hard ckp-gate.ts (are these the same gate or two independent gates?), (4) a cron/service (~3-4 new files: service + repository + cron + DTO) to compute and persist it. Too large/decision-dependent for a safe single-session build; needs owner sign-off on the formula and AI-provider choice before implementation., SB0021 — No HR unlock/recovery workflow exists for a blocked ЦКП payroll-gate day (verified: zero 'override'/'force-open'/'unlock' references in apps/api/src/modules/hr/payroll or org-structure). Building this requires new design decisions: who can approve an exception (HR manager? director?), what audit trail is required, does it need a reason/justification field, does it need a new DB table (e.g. ckp_gate_exceptions) or a column on ckp_fact_values, and a new HR-facing approval UI page. Estimated ~4-6 files (migration + repository + service + controller endpoint + FE approval page/dialog) plus a policy decision from the owner on the approval chain — out of scope for a safe single-session addition.)
- Commits: 558ea2a7, d8c15ada
- Xulosa: Deep-verified all 23 CKP/ЦКП findings against live code + DB (europrint). Key correction to the audit: several "missing" claims were stale/wrong-name lookups. `error_catalog` (not `ckp_error_catalog`/`card_error_catalog`) already exists as a full per-card CRUD stack (error-catalog.controller/service/repository + DefectDropdown FE component + a standalone ErrorCatalogConfig admin page) — SB0006/SB0024/SB0036 were "table missing" but the table existed under a different name; the real gap was that ...

### Soha 18 — Master-data (mijoz/material/birlik) (19 topilma)
- RESOLVED: 3 (SB0741, SB0756, SB0757)
- BLOCKED-OWNER-DATA: 7 (SB0733, SB0736, SB0740, SB0747, SB0749, SB0751, SB0761)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 9 (SB0735, SB0738, SB0753, SB0754, SB0742, SB0739, SB0755, SB0758, SB0762)
- Commits: 3dc6eabc, a434a7d0
- Xulosa: Area 18 (Master-data: mijoz/material/birlik), 19 findings, verified live against DB+code (Q-29). RESOLVED (built for real this session): - SB0741 (tech_card_versions rollback missing): tech_card_versions was write-only audit log. Added TechnologyRepository.restoreVersion() (reads a prior snapshot, writes it back onto technology_cards, bumps version, re-snapshots — forward-only history preserved), POST /technology/cards/:id/versions/:versionId/restore, and a Restore button + ConfirmDialog in Tech...

### Soha 07 — Golden-thread / event / oqim (3 topilma)
- RESOLVED: 1 (SB0279)
- BLOCKED-OWNER-DATA: 0 (-)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 1 (SB0294)
- Commits: 85555a77
- Xulosa: SB0279 (SD→PP async race / outbox guarantee) — RESOLVED. Live-verified update-order-status.handler.ts and create-order.handler.ts both already write durably to the domain_events outbox (A43/PA0-6 comments confirm this was fixed in a prior session). But the actual gap found on deep inspection: SalesOrderReadyPlanningListener (apps/api/src/modules/pp/infrastructure/event-handlers/sales-order-ready-planning.listener.ts) only subscribed via @EventsHandler(OrderStatusChangedEvent) — the in-process CQ...

### Soha 03 — LMS / Darslik (kartaga) (12 topilma)
- RESOLVED: 9 (SB0112, SB0148, SB0120, SB0144, SB0145, SB0116, SB0146, SB0122, SB0139)
- BLOCKED-OWNER-DATA: 1 (SB0144)
- BLOCKED-DRY-RUN-FAILED: 0 (-)
- STILL-OPEN (bitta sessiyada xavfsiz qurib bo'lmaydigan, keyingi ish uchun): 3 (SB0131, SB0122, SB0139)
- Commits: 2366c955, 2275e70d, 22d62100, 4ee1391f, 143b0d3e
- Xulosa: 12 findings triaged; 5 commits, BE+FE tsc 0 both times. SB0112/SB0148 (course_type, dup) — RESOLVED. Live audit showed LmsCompletionService.defaultThreshold() already branches on a courseType enum but no DB column existed. Added courses.course_type (nullable VARCHAR + CHECK constraint) via additive migration apps/api/src/shared/db/migrations/lms-course-type-column-2026-07-04.sql, dry-run verified (BEGIN/ALTER/ROLLBACK, then confirmed absence) before live-applying, confirmed column+constraint+ref...

