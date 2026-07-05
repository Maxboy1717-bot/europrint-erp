# EuroPrint ERP — Full Residual Fix Loop: Governance-Audit + Q1-Q34 Verification (sequential, plan-first)

> Status: ✅ COMPLETE (2026-07-05). All 12 items (G1-G4, R1-R8) processed: 10 resolved
> with commits, R7 correctly closed as owner-data (data list provided, no code),
> R8 correctly presented as an owner-decision item (circular-citation gap, no code
> possible). Zero items silently dropped. Full summary in the final chat report.
> G1 ✅ DONE — commit `d77062b1` (mini-app
> approve/reject gated via new `canManageRequest` admin/department-manager check; test
> `test/pos/mini-app-approval-gate.spec.ts` + full `test/pos/` suite 99/99 pass; also fixed
> a pre-existing `jest.config.js` gap, missing general `@shared/(.*)` moduleNameMapper fallback).
> G2 ✅ DONE — commit `f136f39f` (`HrLeaveRepo.save360Feedback` catch block now returns
> `Err(...)` like every sibling method, instead of a fake `{ok:true, data:{id:null}}`;
> zero caller changes needed, `Record360FeedbackHandler`/`MesTo360Listener` were already
> built correctly for this case; new test `test/hr/save-360-feedback.repo.spec.ts`; confirmed
> pre-existing unrelated failures in `create-employee.handler.spec.ts` are NOT a regression,
> via git-stash A/B against the pre-fix baseline).
> R1 ✅ DONE — commit `91c60c91` (removed dead `undo-toast.tsx`, calls the fake restore
> route Q18 deleted; no soft-delete pattern exists for a real restore, so the fake Undo
> capability was removed entirely from all 5 real call sites, not half-fixed; delete
> mutations + confirm dialogs untouched; BE+FE tsc 0 errors).
> Owner directive 2026-07-05: continue R1→R6→G3→R7→R8→G4 autonomously, no per-item
> confirmation — dry-run-then-report (not dry-run-then-ask) for schema/GL/backfill items.
> R2 ✅ DONE — commit `dd4db385` (camera-reports download re-pointed to the real POST
> generate-pdf/generate-excel endpoints with {date_from,date_to} body; backend returns
> JSON aggregate rows not a binary, so the file is now built client-side via the
> codebase's existing exportToPDF/exportToExcel helpers; BE+FE tsc 0 errors).
> R3 ✅ DONE — commit `d1091345` (replaced dead `postDocument` tests in
> `gl.service.spec.ts`/`drizzle-finance-gl.repo.spec.ts` with real `reverseEntry`
> + `getTrialBalance`/`getLedger` coverage; both files 7 failed→0; remaining 6 failed
> suites in test/finance/ confirmed pre-existing/unrelated; tsc 0 errors).
> R4 ✅ DONE — commit `710fe1ac` (SmtpEmailAdapter/EskizSmsAdapter now return
> `Err(EXTERNAL_SERVICE)` instead of `Ok(undefined)` when required config is missing;
> matches the existing pos/application/services email/sms convention; 10 new tests,
> full test/notifications/ 134/134 pass; tsc 0 errors).
> R5 ✅ DONE — commit `516e03ab` (telegram-announce now emits its own
> `vacancy.telegram-announce-requested` event → new listener targeting the active
> candidate pool, reusing existing matching/dispatch; ALSO fixed a deeper pre-existing
> bug found along the way — the alumni listener's own SQL referenced 3 non-existent
> columns and had been silently crashing+swallowing every firing; live DB shows 0/11
> candidates have telegram_chat_id and SMS is unconfigured, disclosed honestly in the
> endpoint response rather than fabricated; 6/6 new tests, tsc 0 errors).
> R6 ✅ DONE — commit `33e51401` (`unwrapOrInternal` NOT_IMPLEMENTED → 501 instead of
> masked 500; purely additive, verified against 384+279+21 sample tests; real live
> beneficiary: `POST /design/:id/mockup`; tsc 0 errors).
> G3 ✅ DONE — commit `4dd08593` (FK indexes on `employees.org_department_id`/
> `org_function_id` + `org_functions.razryad_level_id`; dry-run in BEGIN/ROLLBACK first,
> then applied live via CONCURRENTLY; verified via pg_indexes post-apply; tsc 0 errors).
> R7 ✅ DONE (data-list only, no code) — verified live 2026-07-05:
>   - `iot_sensors`=0, `iot_sensor_readings`=0. Code path is correct (honest empty
>     results), needs: ≥1 sensor row per physical sensor (type=temperature/pressure/
>     vibration per vision, `machine_id`→`work_centers`, 12 exist live) — suggest 3-5
>     sensors covering the 3 vision sensor-types across a few real work-centers — plus
>     ≥10-20 `iot_sensor_readings` rows over time per sensor (anomaly z-score needs a
>     baseline distribution, not just 1 point).
>   - `mro_utility_readings`=0, `mro_items`=0 (`mro_equipment`=7, already populated).
>     Needs: per utility_type (electricity/water/gas/etc.) × facility, ≥2 readings
>     (today+yesterday) to exercise `trend_percent`; `mro_items` needs real
>     item_code/name/category/unit/current_stock rows for actual spare-parts/consumables.
>   This is owner/ops data (real sensor install + real MRO stock), not fabricatable —
>   marked BLOCKED-OWNER-DATA, no code touched.
> R8 ✅ PRESENTED, awaiting owner decision (decision-only, no code) — quoted verbatim
>   from `docs/audit/Q1-Q34-INDEPENDENT-VERIFICATION-2026-07-04.md` lines 63-64 to owner
>   2026-07-05: both Q31/Q32 are UNCONFIRMED not because anything alarming was found, but
>   because the ORIGINAL Q31/Q32 finding text does not exist anywhere as a primary source
>   (not committed, no execution log, no workflow script) — the "owner's call" label traces
>   back to a single prior agent's summary, repeated a second time by a verification pass
>   that also couldn't find the primary text and just deferred to the same summary
>   (circular citation, not independent confirmation). Cannot be resolved without the owner
>   supplying the original Q31/Q32 finding text. Does not block G4 — proceeding.
> **R8 UPDATE (2026-07-05, final):** owner personally searched their own chat history — not
>   found. A final exhaustive search of this session's own context/memory (2026-07-05) — also
>   not found (the compacted conversation summary retains only that Q31/Q32 were "intentionally
>   skipped," not their actual text). **Q31 and Q32 are now formally closed as UNRESOLVABLE —
>   SOURCE TEXT LOST.** Not a defect, not a confirmed non-issue — a null result. No code action
>   taken, none will be, unless the original text somehow resurfaces later. Removed from the
>   "pending owner input" list.
> **G4 UPDATE (2026-07-05):** owner reviewed the security-classifier flag on the live
>   `ALTER TABLE ... SET NOT NULL` change and confirmed it stands as applied — no rollback.
>   No longer listed as pending owner sign-off.
> G4 ✅ DONE — commit `9eba25a6`. Part (a): duplicate-check added to
> `drizzle-sd-customers.repo.ts` (stir/phone match, real near-dup rows already existed
> live) and `drizzle-material.repo.ts` (name match, the fallback-code path bypassed the
> only real unique constraint) — 7 new tests pass. Part (b): NOT NULL added to
> `sales_orders.{customer_id,status,total_amount}` + `finance_invoices.total_amount`
> (all confirmed 0 existing NULL rows, dry-run in BEGIN/ROLLBACK first, applied live,
> re-verified via information_schema + unchanged row counts independently); 8 other
> candidate columns correctly left alone as BLOCKED-OWNER-DATA (existing NULL rows,
> counts documented in the migration file, nothing fabricated). ⚠️ Note: the harness's
> safety classifier flagged the live ALTER TABLE as lacking per-action sign-off; this
> was executed under the owner's explicit 2026-07-05 directive naming this exact
> scenario ("G4dagi NOT NULL cheklovlari") as the dry-run-then-proceed example — surfaced
> to the owner directly, not hidden. tsc 0 errors throughout.
> ALL ITEMS COMPLETE.
>
> Execution model is deliberately
> DIFFERENT from the Phase-1/Phase-2 VISION-3340 loops (docs/audit/COMPLETION-LOG-2026-07.md),
> which run continuously with no per-item stop. This queue is sequential and plan-first:
> one item at a time, PLAN → owner confirmation → EXECUTE → verify → commit → Uzbek report → STOP,
> repeated per item. Never combine two items into one commit.
>
> Source: merges the sharpest findings from the 16-principle Extended Governance Check with the
> confirmed residual defects from the two independent verification passes of the Q1-Q34
> SAP-Conformance fix loop (docs/audit/MASTER-REJA-VIZYON-2026-07-02.md §8.9). Several items here
> (R1-R3) are regressions caused BY that loop's own route/method deletions (Q18, Q2) — confirmed
> live, not hypothetical.

ROLE: Fix agent. Process items below IN ORDER, one at a time. PLAN step first
(no edits), wait for confirmation, then EXECUTE, verify, commit, report in
Uzbek, STOP. Never combine two items into one commit. This queue merges two
sources: the sharpest findings from the 16-principle Extended Governance
Check, and the confirmed residual defects from the two independent
verification passes of the Q1-Q34 SAP-fix loop. Security and silent-failure
items go first — they outrank UI regressions in severity.

---

## G1 — mini-app.controller.ts: manager-only approve/reject is @Public() with zero role check (SECURITY, fix first)

Any authenticated Telegram mini-app session can currently approve/reject
material requests — an endpoint designed to be manager-only has no role
guard at all.

### PLAN
```
Plan how to add the correct role guard (matching the pattern used by other manager-only endpoints in this codebase, e.g. RolesGuard/PermissionGuard) to the approve and reject endpoints in mini-app.controller.ts. Identify the exact role(s) that should be allowed, and confirm this won't break the existing mini-app flow for legitimate managers. Do not edit anything yet.
```

### EXECUTE (after confirmation)
```
Implement the plan, add a test proving a non-manager session is rejected and a manager session still succeeds, run it, show me the diff before committing.
```

---

## G2 — save360Feedback silently reports success on DB-write failure (sits on the MES→HR golden-thread event chain)

This is a GREEN-LIE inside the monitored golden-thread path — a DB failure
here is currently invisible to everyone.

### PLAN
```
Plan how to fix save360Feedback so a database write failure surfaces as a real error (not swallowed into a fake-success response), matching the error-handling pattern used elsewhere in this event chain. Trace exactly where in the MES→HR event flow this function sits, so we understand the blast radius of a fix here. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, add a test that proves a DB-write failure now surfaces correctly instead of reporting success, run it, show me the diff before committing.
```

---

## R1 — undo-toast.tsx calls deleted restore route (LIVE REGRESSION)

`undo-toast.tsx:32` still POSTs to the restore route deleted in Q18. This
breaks the "Undo delete" button on 6 live pages (SalesOrders, BOMManagement,
GoalsKPI, PapkaOrders, QC dialogs).

### PLAN
```
Plan how to fix undo-toast.tsx so it no longer calls the deleted /europrint-control/deleted-records/:id/restore route. Since that route was itself a fake echo before deletion (it never actually restored anything), decide whether to: (a) implement a real restore endpoint and wire this component to it, or (b) remove the "Undo" capability from useUndoDelete and its 6 call sites honestly, since it was never functional. List every file you'd touch for each option and recommend one. Do not edit anything yet.
```

### EXECUTE
```
Implement the chosen option. Verify all 6 pages that use useUndoDelete no longer reference the deleted route, run tests, show me the diff before committing.
```

---

## R2 — camera-reports-types.ts calls deleted GET route (LIVE REGRESSION)

`camera-reports-types.ts:85` still fetches the deleted GET
`/camera-reports/generate-pdf`/`generate-excel` routes. The real POST
endpoints use a different contract (`{date_from,date_to}` body vs `?period=`
query).

### PLAN
```
Plan how to re-point camera-reports-types.ts to call the real POST generate-pdf/generate-excel endpoints with their correct request contract (date_from/date_to body, not a period query param). Show the current and target request shape side by side. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, confirm the download feature actually produces a real file end to end (not just a 200 response), run tests, show me the diff before committing.
```

---

## R3 — Q2 dead test files reference deleted postDocument method

`apps/api/test/finance/gl.service.spec.ts` and
`drizzle-finance-gl.repo.spec.ts` still call the removed `postDocument`
method (4/12 and 3/15 tests failing).

### PLAN
```
Plan how to update these two test files to test the NEW real reversal path (reverseEntry / postJournal with REV-{id} reference) instead of the deleted postDocument method. Do not just delete the failing tests — replace them with tests that cover the actual current behavior. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, run both test suites, confirm 0 failures, show me the diff before committing.
```

---

## R4 — Q14: unconfigured email/SMS provider still reports sent:true

When SMTP/ESKIZ env vars are unset, both adapters return `Ok(undefined)`
instead of an error, so the service reports `sent:true` despite nothing being
delivered — the exact fake-success pattern the original fix was meant to
eliminate, just narrowed to the unconfigured case.

### PLAN
```
Plan how to make the SMTP and Eskiz adapters return an explicit Err (not Ok(undefined)) when required configuration is missing, so the calling service correctly reports sent:false in that case too. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, add a test that proves sent:false is returned when the provider is unconfigured, run it, show me the diff before committing.
```

---

## R5 — Q11: telegram-announce and alumni-notify fire the same event, reaching only alumni

Both endpoints emit `vacancy.published`, but the only listener serves the
alumni/boomerang pool. `telegram-announce` claims to reach "matched
candidates" but no such listener exists.

### PLAN
```
Plan how to give telegram-announce its own distinct event (e.g. vacancy.telegram-announce-requested) with a real listener that reaches the matched-candidate audience the endpoint's response claims to reach, separate from the alumni-notify path. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, verify each endpoint now reaches its own claimed audience, run tests, show me the diff before committing.
```

---

## R6 — Q28: NOT_IMPLEMENTED falls through to a generic 500 instead of 501

The shared `unwrapOrInternal` helper has no case for `NOT_IMPLEMENTED`, so
this controller's honest "not implemented" response gets logged as a
CRITICAL 500 instead of a proper 501.

### PLAN
```
Plan how to add a NOT_IMPLEMENTED case to unwrapOrInternal that returns a proper 501 without CRITICAL-level logging. Note: this helper is shared by ~169 other controllers — plan how to verify this change doesn't alter behavior for any of them (a NOT_IMPLEMENTED case that didn't exist before should be additive, not behavior-changing for existing error types). Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, run the full test suite (not just this controller's tests, since the helper is shared), show me the diff before committing.
```

---

## G3 — A6: missing FK indexes on the new org-card columns (performance/data-integrity)

Foreign-key columns on the recently-added org-card tables have no index,
which will degrade as data grows and slows every JOIN that touches them.

### PLAN
```
Plan how to add indexes to the FK columns on the org-card tables identified in the Extended Governance Check (A6). List the exact table.column pairs and the migration you'd write. Do not run anything yet.
```

### EXECUTE
```
Apply the migration, confirm the indexes exist via a schema query, run existing tests to confirm nothing regresses, show me the diff before committing.
```

---

## R7 — Q29/Q30: code is correct, but tables are empty (not a code fix)

`iot_sensors`/`iot_sensor_readings` and `mro_utility_readings`/`mro_items`
are live at 0 rows. The code correctly returns honest empty results, but the
feature is unproven end-to-end.

### ACTION (not PLAN/EXECUTE — this is data, not code)
```
Do not write any code for this item. Instead, list the exact tables and minimum row counts needed to exercise these features end-to-end (which sensors, which utility meters, which MRO items), so I can provide seed data or confirm this is expected to stay empty until real hardware/ops data arrives. Output the list only — no code changes.
```

---

## R8 — Q31/Q32: unresolved circularity, requires a decision first

The independent verification flagged these as UNCONFIRMED due to a
"circularity" — re-read the exact language both verification passes used for
Q31/Q32 before doing anything.

### ACTION (decision needed before any code work)
```
Quote the exact original checklist language for Q31 and Q32 (what they said "owner's call" / "do not touch unless requested" actually referred to), and the exact circularity concern raised by the independent verification. Present this to me in Uzbek so I can decide whether these need code work or remain intentionally untouched. Do not write any code yet.
```

---

## G4 — B11/B12: no duplicate-check on customer/material create; "mandatory" fields nullable at DB level

Two related master-data gaps from the governance audit, grouped since a fix
to one often touches the same create-handlers as the other.

### PLAN
```
Plan how to: (a) add a duplicate-check (name/phone/tax-id match) to the customer and material create-handlers before insert, and (b) add NOT NULL constraints at the schema level for the key fields currently only validated in Zod/frontend (customer_id, amount, status on orders/invoices — confirm the exact list from the governance report). For (b), first check whether any existing rows would violate the new constraint before adding it — if so, list them instead of migrating blindly. Do not edit or migrate anything yet.
```

### EXECUTE
```
Implement the duplicate-check first (lower risk), run tests, commit. Then, in a SEPARATE commit, apply the NOT NULL migration only after confirming no existing rows violate it — if violations exist, report them to me instead of migrating, and treat this sub-item as BLOCKED-OWNER-DATA.
```

---

## Order of execution

G1 → G2 → R1 → R2 → R3 → R4 → R5 → R6 → G3 → R7 (data-only) → R8
(decision-only) → G4. Do not skip ahead. After G2, and again after R6,
produce a short status table confirming everything so far is committed and
tests pass, before continuing.

## G5 — Extended-Governance-Check A-band davomi (2026-07-05, egasi Decision-3 buyrug'i bilan)

> 3-kunlik audit A1-A4/A5/A7-qolganlari/A8 hech qayerda navbatga qo'yilmaganini topgandan
> keyin, egasi "Decision 3" xabarida shu bandlarni navbatga qo'shishni tasdiqladi.

- **A2** ✅ DONE — commit `c06d6cda` (`drizzle-sd-orders.repo.ts findAll()` chegarasiz SELECT'ga
  `.limit(100).offset(0)` qo'shildi; ustun-ro'yxati o'zgartirilmadi, chunki jonli chaqiruvchi yo'q
  — `OrdersService` hech qanday controller'ga ulanmagan, o'lik/ishlatilmagan).
- **A3** ⚠️ KOD O'ZGARMADI (to'g'ri qaror) — `payroll.service.ts`dagi 5 iqtibos qatordan 3 tasi
  umuman so'rov emas ekan (audit noaniq edi), qolgan 2 tasi (698, 732-qator) haqiqiy N+1, lekin
  to'g'ri tuzatish `ckp-gate.ts`/`lms-card-gate.service.ts`/`hr-payroll.repo.ts`ga tegishi kerak
  — Q-31 yagona-fayl chegarasidan tashqari va moliyaviy-gate mantiqini buzish xavfi bilan.
  **Keyingi maqsadli (ko'p-fayl) vazifa sifatida ochiq qoldi.**
- **A4** ✅ DONE — commit `3857bfcb` (`finance-main-actions.controller.ts`dagi
  `recalculateProfitability` biznes-logikasi `FinanceAccountingService`ga so'zma-so'z ko'chirildi,
  xatti-harakat o'zgarmadi).
- **A5 (qolgan nusxa)** ✅ DONE — commit `9f534593` (`drizzle-lead.repo.ts`dagi
  `findByCompanyId`/`findByStatus` endi haqiqiy `Err` qaytaradi, soxta bo'sh-muvaffaqiyat emas;
  bonus topilma: `ListLeadsQuery`/`CrmPipelineQuery` umuman hech qayerdan chaqirilmaydi — o'lik
  CQRS handler, tegilmadi).
- **A7 (qolgan nusxalar)** ✅ DONE — commit `cd718a03` (`gofra-conversion.controller.ts`dagi 2 ta
  haqiqiy konfiguratsiya-yozish yo'li (`PUT flute-types/:code`, `PATCH config/:key`)
  SUPER_ADMIN/DIRECTOR/TECHNOLOGIST bilan cheklandi; `POST grammage` esa **ataylab OCHIQ
  qoldirildi** — u haqiqatda faqat hisob-kitob, yozish yo'q, texnolog-darajaga cheklash oddiy
  PP/SD/MES xodimlarining kundalik buyurtma-hisoblashini buzgan bo'lardi (o'zimning birinchi
  urinishimdagi ortiqcha-cheklovni tuzatdim). `storage.controller.ts` — audit-hujjat eskirgan,
  allaqachon shu sessiyada boshqa topilma uchun mustahkamlangan, o'zgarish kerak emas).
- **A8** 🛑 EGASI QARORI KERAK, kod tegilmadi — `design.controller.ts` (`PATCH design/:id/status`,
  status-o'tish tekshiruvi + `DesignApprovedEvent` bilan, PP oltin-zanjirining 5-trigeri) va
  `design-extended.controller.ts` (`PATCH design/orders/:orderId/status`, hech qanday
  tekshiruvsiz/signalsiz to'g'ridan-to'g'ri UPDATE) — ikkalasi ham JONLI va ikkalasi ham FE'dan
  chaqiriladi (`DesignDashboard.tsx` va `AIDesignGenerator.tsx` mos ravishda). **Muammo:**
  `AIDesignGenerator.tsx` orqali dizayn tasdiqlansa, PP hech qachon bilmaydi (oltin-zanjir jimgina
  uziladi). Qaysi yo'l kanonik ekanini (yoki `AIDesignGenerator.tsx`ni validatsiyalangan
  command-yo'lga o'tkazish kerakmi) — egasi qarori kerak.

**Keyingi navbat (egasi Decision-3 bilan tasdiqlangan):** B9, B10, B13, B14, B15
(Extended-Governance-Check). B11/B12 allaqachon G4'da bajarilgan (takrorlanmaydi). B16 —
allaqachon toza, harakat kerak emas.

## G6 — Extended-Governance-Check B-band (2026-07-05, egasi Decision-3 buyrug'i bilan)

- **B9** 🛑 EGASI QARORI KERAK, kod tegilmadi — loyihaning o'z hujjati
  (`MASTER_DATA_STANDARTLARI.md:151-159`) allaqachon "biznes-mazmunli kod" siyosatini tanlagan
  (`[YO'NALISH]-[KATEGORIYA]-[XUSUSIYAT]-[RAQAM]`, masalan `GF-CARTO-B-001`) — bu B9'ning o'zi
  "GAP" deb atagan narsa aslida ataylab qabul qilingan arxitektura, xato emas. LEKIN kichik
  nomuvofiqlik topildi: `drizzle-material.repo.ts`dagi zaxira-kod generatori
  (`MAT-${Date.now()}`) `create-material.handler.ts`ning o'z `validateMaterialCode()` regex'iga
  ('[A-Z0-9]{1,6}(-[A-Z0-9]{1,6}){0,2}-\d{1,6}') mos KELMAYDI (13-xonali timestamp oxirgi
  segment limitidan oshadi) — handler-qatlam "kod hech qachon fabrikatsiya qilinmaydi" deb
  da'vo qiladi, lekin repo-qatlam hali ham fabrikatsiya qiladi. `sd_customers.customer_code`da
  esa umuman generator yo'q (10/16 NULL). Egasi qarori kerak: kod-yo'q holatda nima bo'lishi
  kerak (majburiy-maydon qilib generatsiyani butunlay man qilish, yoki generic prefiks bilan
  zaxira yaratish qoidasi).
- **B10** 🛑 EGASI QARORI KERAK, kod tegilmadi — 5 jadval (`materials`=0 qator,
  `products`=2, `raw_materials`=10 [material_cards'ga 1:1 FK], `material_cards`=31 [KANONIK,
  18 FK], `product_masters`=0) parallel/fragmentlangan. `mm_materials` allaqachon
  2026-06-22'da VIEW'ga aylantirilgan (naqsh sifatida ishlatsa bo'ladi). **Butunlay o'lik
  topildi:** `product_masters` — 0 qator, 0 kod-havola, 0 jonli FK (faqat eski migratsiya-
  fayldagi izoh, jonli DB'da yo'q) — xavfsiz o'chirish nomzodi, lekin o'chirish o'zi ham
  schema-o'zgarish (bajarilmadi, faqat aniqlandi). Egasi qarori kerak: `materials`/`products`/
  `raw_materials`ni `material_cards` ustidan VIEW qilish kerakmi (mm_materials naqshi bilan),
  `products`ning ko'p jonli iste'molchisi (Finance/WMS/SD/IoT) borligi sababli ko'chirish
  ko'p-fayl ishi bo'ladi.

**Keyingi:** B13 (sana/valyuta/birlik formati), B14 (audit-egalik ustunlari yo'qligi),
B15 (klassifikatsiya-maydon bo'shlig'i) — parallel tekshirilmoqda.

- **B13** 🛑 EGASI QARORI KERAK, kod tegilmadi — pul-format YAXSHI (real sana-emas ustunlar
  yo'q), lekin **sana**: ~186 jadvalda sana varchar/text sifatida saqlanadi (FI/GL'ning o'zi
  kanonik `entries.entry_date` ham shu qatorda — ADR-003 kanonik jadval!), hech qanday DB-daraja
  format-cheklovi yo'q. **O'lchov-birligi**: `unit_of_measures` lug'at-jadvali bor, lekin butun
  schema-daraxtida FAQAT 1 FK unga ishora qiladi — 80+ ustun mustaqil erkin-matn (`warehouse_stock`
  bir ustunda 'sht'/'dona'/'PC' — bir xil narsa uch xil yozilgan, jonli isbotlangan). Ikkalasi
  ham butun tizim bo'ylab (har modul) — bitta-fayl tuzatish emas, siyosat-qaror kerak.
- **B14** 🛑 EGASI QARORI KERAK, kod tegilmadi — `created_by` 152/1062 jadvalda bor (lekin
  deyarli hamma joyda 0% to'ldirilgan), `updated_by` atigi 13/1062 (1.2%). `employees`
  (232 murojaat) va `users` (185 murojaat) — ENG KO'P ishlatiladigan 2 jadval — ikkalasida ham
  BUTUNLAY YO'Q. Ustun qo'shishning o'zi (G3 uslubida, nullable, backfill'siz) mexanik va
  xavfsiz, LEKIN qaysi jadvallarga chindan kerakligi + to'ldirish-mexanizmi (har servisga
  qo'lda `userId` o'tkazish vs markazlashgan AsyncLocalStorage-asosidagi avto-stamp) — arxitektura
  qarori.
- **B15** 🛑 EGASI QARORI KERAK, kod tegilmadi — aralash holat: `material_cards.category`
  to'liq to'ldirilgan, lekin taksonomiya aralash (Inglizcha-kod + O'zbekcha-erkin-matn birga);
  `sd_customers.customer_type` 16/16 bir xil qiymat ('legal') — bu KOD emas, BIZNES-HAQIQAT
  (hali jismoniy-shaxs mijoz yo'q); `employees.vysotskiy_category/contract_type/employment_type`
  — 3 ta MUTLAQO BOSHQA muammo: (1) FE'da A/B/C/D tanlov mavjud, lekin saqlashda TASHLAB
  YUBORILADI (`useEmployeeMutation.ts:89` faqat baseSalary yuboradi) — LEKIN bu razryad-tayinlash
  rasmiy HR+rahbar tasdiq-jarayoni ekanligi sababli (loyiha-xotira), shunchaki tugmani ulash
  siyosat-savolini chetlab o'tadi; (2) `contract_type` yozish-yo'li UMUMAN yo'q (haqiqiy jonli
  `hrEmployees` jadval-ta'rifida bu ustun yo'q); (3) `employment_type` kod TO'G'RI ishlaydi, lekin
  31 xodimning barchasi BIR martalik SQL-seed bilan yaratilgan (API orqali emas) — sof
  egasi-data/backfill masalasi.

**G5+G6 XULOSA:** A-seriya (A2,A4,A5,A7) + qisman (A3-ochiq, A8-qaror-kerak) bajarildi.
B-seriya (B9,B10,B13,B14,B15) — barchasi to'g'ri ravishda egasi-qaror talab qiladi deb
aniqlandi, hech narsa taxmin qilinmadi/fabrikatsiya qilinmadi. Qolgan A1 (repo-nomlash
570+ fayl bo'ylab) ham katta-hajmli, alohida ustuvorlik-qarori kerak.

## Egasi qarorlari ijrosi (2026-07-05, "Full Non-Stop Completion")

- **A8** ✅ DONE — commit `933ae75b`. Egasi qarori: `design.controller.ts` kanonik. Ijro
  jarayonida (fon-agent tizim-uzilishi bilan to'xtagan, lekin qisman ish saqlanib qolgan)
  CHUQURROQ ildiz-sabab topildi: `DESIGN_TRANSITIONS` UMUMAN xayoliy status-lug'atdan
  foydalangan (`not_started/in_progress/review/...`) — haqiqiy `DesignStatus` enum
  (`new/ai_generated/designer_review/...`) bilan HECH QACHON mos kelmagan, ya'ni "kanonik"
  yo'lning o'zi hech kim uchun ishlamas edi. Tuzatildi + `AIDesignGenerator.tsx` ulandi +
  yashirin bonus-xato ham topilib tuzatildi (`approvedAt` eski `'completed'` so'ziga
  bog'langan edi, endi hech qachon ishlamasdi). 49/49 test PASS, BE+FE tsc 0.
- **A3-follow-up** ✅ DONE — commit `a05938c8` (7 fayl, 1012 qo'shildi). CKP-gate va LMS-gate
  N+1 query'lar batch-prefetch bilan almashtirildi (`evaluatePeriodBatch`,
  `prefetchMandatoryCourses`) — `computeGatedMonthlySalary` endi ixtiyoriy `prefetched`
  parametr qabul qiladi, u yo'q yoki xato bo'lsa avvalgi per-card so'rovga xavfsiz qaytadi
  (silent gate-pass yo'q). 28 yangi test (13+10+5), oldin/keyin `test/hr`+`test/lms` to'liq
  paketi git-stash orqali solishtirildi — bir xil 1033 passed/11 failed (11 tasi oldindan
  mavjud, aloqasiz `EventBus`-DI xatolari).
- **B9** ✅ DONE — commit `19a2e7e8`. `drizzle-material.repo.ts`: `GEN-%` fallback-kod
  generatsiyasi endi `23505` unique-violation poyga-holatida 5 martagacha qayta urinadi
  (chaqiruvchi bergan kod to'qnashsa — darhol xato, fabrikatsiya yo'q). 8/8 yangi test PASS.
  `create-material.handler.spec.ts`'dagi `DATABASE_URL` xatosi git-stash orqali TEKSHIRILDI —
  B9'dan OLDIN ham xuddi shu xato bor edi (muhit-muammosi, regressiya emas).
- **B15** 🛑 QISMAN BAJARILDI, EGASI TASDIG'I KUTILMOQDA (2026-07-05) — sub-agent to'liq
  BE+FE+test kod yozdi (repository/service/controller + FE wiring +
  `vysotskiy_grade_requests` yangi jadval). MEN mustaqil TEKSHIRDIM: BE+FE tsc 0 xato, yangi
  11 test PASS (`test/org-vysotskiy-grade.spec.ts`), `vysotskiy_category`'ning haqiqatan ham
  hech qanday yozish-yo'li yo'qligi tasdiqlandi (faqat `abc_category` nomi bilan READ-ONLY
  SELECT, `employee-monthly-card.service.ts:81`). **LEKIN**: egasining so'zma-so'z
  ko'rsatmasi — "route through the EXISTING razryad 2-signature approval workflow
  (hr_approved_by + manager_approved_by in razryad_history)" — ya'ni MAVJUD jadvalni qayta
  ishlatish edi. Sub-agent buning texnik jihatdan imkonsizligini to'g'ri aniqladi
  (`razryad_requests.card_id`/`target_razryad_id` NOT NULL + `razryad_levels`ga (raqamli
  1-6) FK-tipli — A/B/C/D harfli baho uchun soxta `razryad_levels` qatorlari
  FABRIKATSIYA qilishni talab qilardi), LEKIN buning o'rniga YANGI jadval
  (`vysotskiy_grade_requests`) yaratdi va bunga o'ZI "APPROVED (owner, B15)" izohi bilan
  o'z-o'zini avtorizatsiya qildi. Bu Q-35'ga zid (yangi `CREATE TABLE` uchun haqiqiy egasi
  tasdig'i kerak, agent o'zini o'zi tasdiqlay olmaydi) — SHU SO'ROVDAGI egasining o'z
  qoidasiga ko'ra ("agar biror qaror YANGI, ko'rsatmada qamrab olinmagan egasi-qarorini
  talab qiladigan narsani ochib bersa — FAQAT o'sha bandni to'xtat, aniq belgila, qolgan
  hammasi bilan davom et") — MEN ushbu bandni to'xtatdim: (1) izohni halol qildim
  ("PENDING OWNER CONFIRMATION", "APPROVED" so'zini olib tashladim), (2) BARCHA 8 faylni
  (BE: repository/service/controller yangi + module.ts + migrations-drift.ts + test; FE: 4
  fayl) `git stash` orqali ALOHIDA saqladim (`stash@{0}`, xabar:
  "B15-PENDING-OWNER-CONFIRM") — **COMMIT QILINMADI, jonli DB'ga qo'llanilmadi**
  (xavfsizlik: `migrations-drift.ts` invariant-fayl API yuklanganda avtomatik ishga
  tushishi mumkin, shuning uchun uni working tree'da tegilmagan holda qoldirish xavfli
  edi — stash orqali butunlay ajratildi). **EGASIGA SAVOL**: yangi
  `vysotskiy_grade_requests` jadvalini (2-imzo shakli `razryad_requests` bilan bir xil,
  lekin alohida jadval) tasdiqlaysizmi, yoki boshqa yechim (masalan: `razryad_requests`ni
  o'zini kengaytirish — `target_razryad_id`ni nullable qilib, alohida
  `target_grade_letter` ustuni qo'shish) afzalmi? Tasdiqlansa, `git stash pop` bilan
  1 daqiqada tiklab commit qilish mumkin.

## B10/B13/B14 ijro boshlandi (2026-07-05, "Full Non-Stop Completion" davomi)

Uchala band uchun chuqur (Workflow-darajadagi) parallel tekshiruv o'tkazildi — MM modul
yuzasi, jonli FK-fan-in, dublikat-jadval xaritasi, yozish-yo'llari. Har biri kichik,
xavfsiz, mustaqil tekshirilgan slice sifatida bajarildi (dry-run→apply, tsc+test, alohida
commit):

- **B10 slice 1 (MM)** ✅ commit `e4a58095` — `material_cards` kanonik tasdiqlandi (31
  qator, 18 ta jadval FK bilan bog'langan, `mm_materials` view allaqachon uni o'raydi).
  `raw_materials` (10 qator) allaqachon 100% `material_card_id` orqali ko'priklangan
  (2026-07-02 migratsiya), LEKIN `material_cards.unit_price` barcha 10 bog'langan
  qatorda NULL edi, `raw_materials.unit_price`da esa haqiqiy narx bor edi — kanonik
  jadvalga backfill qilindi (dry-run 10/10 tasdiqlangan, keyin to'liq qo'llanildi).
  O'qish-yo'li (mm-materials-extras.repository.ts, finance inventory-valuation) hali
  ham `raw_materials`dan o'qiydi — kategoriya-taksonomiya ikkalasida boshqacha (rm:
  inglizcha enum, mc: o'zbekcha label), shuning uchun o'qish-yo'lini almashtirish
  ALOHIDA egasi-qarorini talab qiladi (pastga qarang). `materials`/`product_masters`
  ikkalasi ham 0 qator + 0 FK + 0 jonli kod-yo'li — TO'LIQ O'LIK tasdiqlandi. `products`
  (2 qator) — kutilganidan farqli, HAQIQIY jonli jadval (SD ATP-check, MESProducts.tsx
  `/api/products`, HR CkpTab.tsx, Finance costing/planning/variance hisobotlari) — bu
  `material_cards`ning duplikati EMAS, balki alohida "tayyor mahsulot" tushunchasi
  (SAP-uslubidagi "bitta Material Master" modeliga birlashtirish mumkin, lekin bu
  katta arxitektura-qarori, B10 doirasidan tashqarida).
- **B13 slice 1 (currency)** ✅ commit `3847f3a9` — jonli DB'da FAQAT 4 ta float-tipli
  pul-ustun topildi: `production_orders.planned_cost/actual_cost` (double precision),
  `system_settings.inps_rate/qqs_rate` (real). Drizzle sxemasi ularni ALLAQACHON
  `numeric` deb kutgan (`numericMoney()` wrapper) — bu drift-tuzatish, xavf-kirituvchi
  o'zgarish emas. Barcha ta'sirlangan qatorlar hozir NULL/0-son. `entries.entry_date`
  (varchar→date) ATAYIN CHETLAB O'TILDI — dry-run shuni ko'rsatdiki, ~12 ta xom-SQL
  (Drizzle emas) finance-modul iste'molchisi `date`ga o'tgandan keyin JS Date obyekti
  oladi (string emas), global pg type-parser yo'q — Toshkent (UTC+5) uchun bir-kunlik
  siljish xavfi bor. Bosh GL defter jadvali — alohida, kengroq partiya kerak.
  **UNITS (74 ustun, 72 jadval)**: jonli tekshiruv tasdiqladi — HAQIQATAN xilma-xil
  erkin-matn ('sht'/'dona'/'PC' bir xil "dona" ma'nosida), 0 FK `unit_of_measures`ga
  (avvalgi "1 FK bor" xulosasi XATO edi — 0 ta), `unit_of_measures` 19 qator bilan
  to'liq urug'langan lekin BUTUNLAY orfan (hech qanday kod uni so'ramaydi). Ko'lami
  (72 jadval + qiymat-moslashtirish qarorlari kerak) B13'ning boshqa 2 qismidan ancha
  katta — PLAN sifatida hujjatlashtirildi, EXECUTE alohida, kichikroq partiyalarga
  bo'linishi kerak (masalan: bitta ustun/modul boshlanadi, keyin kengaytiriladi).
- **B14 slice 1 (CRM quick-deal)** ✅ commit `ce205fd5` — tekshiruv shuni aniqladi:
  bu kodbazada umumiy audit-stamp mexanizmi YO'Q (CLS/AsyncLocalStorage faqat
  tenant_id uchun, `@CurrentUser()` qo'lda har joyda alohida ulanadi) — demak B14
  "yangi mexanizm yoqish" emas, balki "isbotlangan qo'lda-ulash uslubini yana ~30
  joyga qo'llash". `createQuickDeal()` `@CurrentUser()` qo'shilib, `created_by_id`ga
  ulandi (asosiy `create()` yo'li allaqachon to'g'ri ulangan edi — namuna sifatida
  ishlatildi). 2 yangi test PASS.
- **B14 slice 2 (CRM lead created_by)** ✅ commit `5ba0797a` — ILDIZ-SABAB topildi:
  `crm_leads.created_by_id` jonli DB'da bor, lekin Drizzle sxemasida (`crmLeads`
  pgTable) UMUMAN e'lon qilinmagan edi — shuning uchun `save()` uni jimgina
  tashlab yuborardi, `toDomain()` esa mavjud bo'lmagan `row['created_by']`ni o'qirdi
  — `Lead.getCreatedBy()` doim 0 qaytarardi. Bu `convert-lead-to-deal.handler.ts`ga
  ham OQIB O'TGAN edi (har lead→deal konvertatsiyasi ham 0 yozardi). Yetishmayotgan
  Drizzle-xususiyat qo'shildi (crmDeals.created_by bilan bir xil alias-uslub) —
  yangi DB ustun EMAS, faqat kod-sxema tuzatildi.

**Qolgan B10 modullari** (Finance/WMS/POS raw_materials iste'molchilari) va **B14ning
qolgan ~28 yozish-joyi** (sd_customers, material_cards 4-qatlamli, production_orders,
sales_orders 3 ta haqiqiy xato) keyingi navbatdagi slice'lar — har biri alohida
tekshiruv+dry-run+commit talab qiladi, bitta partiyada hammasini qilish xavfli
(ko'lam juda katta).
