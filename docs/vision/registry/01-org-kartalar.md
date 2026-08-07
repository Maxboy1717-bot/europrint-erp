# Org-Kartalar — Yagona Vizyon Registri (EP-ORG) — 2026-08-07

> 🚧 **TUGALLANMAGAN — 42/143 band yozilgan (EP-ORG-001..042).** Yozuv 2026-08-07 da
> sessiya-limiti sabab uzildi. Qolgan EP-ORG-043..143 keyingi sessiyada shu faylga
> qo'shiladi (formati va manbalari o'zgarmaydi). Quyidagi "Xulosa" jadvali faqat
> yozilgan 42 bandni aks ettiradi, butun modulni EMAS.

> **Manbalar:** `decisions/01-org-kartalar.md` (143 qaror) · `FULL-ITEM-LEVEL [Module-01]` (143 item) · `FULL-VISION-EXTRACTION` QISM A/C/D + I4-ORGSXEMA intervyu · `vision-1000-answers/01-org-kartalar.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida kod tegan bandlar qayta tekshirildi (Δ qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| Jami band (I+II QISM) | 158 |
| **Qaror holati:** ✅ javoblangan | 94 |
| **Qaror holati:** 🔵 ochiq | 64 |
| **Qurilish:** Ha | 29 |
| **Qurilish:** Qisman | 83 |
| **Qurilish:** Yo'q | 30 |
| **Qurilish:** STALE-DOC | 8 |
| **Qurilish:** — (mos item topilmadi) | 8 |
| 2026-07-11 dan beri o'zgargan (Δ) | 27 |
| ⚠️ Manbalar orasida ziddiyat | 15 |

> **Eslatma (tipografiya):** vazifa sharti `decisions/01-org-kartalar.md` da 9 ta kirill `JAVОБЛАНГАН` bo'lishi mumkinligini ogohlantirgan edi — jonli faylda tekshirildi (`grep -c "JAVОБЛАНГАН"` → **0**), hammasi lotin `JAVOBLANGAN`. Sanoq: 89 ✅ + 54 🔵 = 143.
> **Eslatma (mapping):** `FULL-ITEM-LEVEL` Item 1..50 = `vision-1000-answers` #1..#50 (EP-kodsiz, mavzu bo'yicha ulanadi → `(taxminiy)`); Item 51..72 = EP-ORG-043..064; Item #73..#143 = EP-ORG-073..143 (1:1).

---

## I QISM — EP-kodli qarorlar (EP-ORG-001..143)

### EP-ORG-001 · Karta = master-data
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — har lavozim-o'rindiq `cards` jadvalida, butun ERP shundan oziqlanadi; barcha modul `card_id` orqali ulanadi.
- **Manba:** KARTALAR-A (Q1) · vision-1000 #1 (yaratish tranzaksiyasi) · I4-ORGSXEMA EP-ORG-001
- **Dalil (kod):** `card.service.ts:42-51` — `create()` faqat `repo.create(dto)` = bitta `INSERT INTO org_departments` (`card.repository.ts:157-160`). I4: aktiv karta-jadval = `org_departments` (143-144 qator), lekin `org_functions` parallel "kanonik" de-routed holda yashaydi (karta-model 42%).
- **Nima yetishmaydi:** RBAC/LMS/Kanban ga cho'zilgan atomik tranzaksiya yo'q; `org-cascade.listener.ts` mavjud, lekin u ombor+RBAC-rol kaskadi (EP-ORG-041), karta-yaratish zanjiri emas.
- **Bog'liqlik:** EP-ORG-040 (ikki-olam), VR-ORG-I15
- **action:** CREATE
- **⤳ Ta'sir:** HAMMA 20 modul (universal `card_id` FK)
- **Xoch-havolalar:** `[Module-01] Item 1` *(taxminiy)* · `EXTRACTION QISM A #1` · `I4-ORGSXEMA EP-ORG-001`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-002 · 1 o'rindiq = 1 xodim
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** 1 karta = 1 seat = 1 xodim; dublikat lavozim → 01/02 raqami.
- **Manba:** KARTALAR-A (Q2) · vision-1000 #50 (race himoya) · I4-ORGSXEMA EP-ORG-002/037
- **Dalil (kod):** `pg_indexes` → yagona partial-unique = `uq_employee_cards_active_link ON employee_cards (employee_id, card_id) WHERE is_active` (2 ustun, vizyon 3 ustun so'raydi). `canAssignEmployee` application-layer seat-guard real. **Δ:** `card.repository.ts:469-475` `assignEmployeeGuarded()` — `pg_advisory_xact_lock(82002, cardId)` bilan atomik TOCTOU-guard qo'shildi (`1724a0ac`).
- **Nima yetishmaydi:** `is_primary` ustuni partial-unique indeksga qo'shilmagan (DB-daraja kafolat hamon 2-ustunli).
- **Bog'liqlik:** EP-ORG-094 (stavka soni) bilan ZID
- **action:** CREATE
- **⤳ Ta'sir:** HR (binding), Payroll (har karta alohida oylik), Reports
- **Xoch-havolalar:** `[Module-01] Item 50` · `EXTRACTION QISM A #50` · `I4-ORGSXEMA EP-ORG-002/037` · `vision-1000 #50`
- **⚠️ ZIDDIYAT:** EP-ORG-002 "atomik 1-seat" vs EP-ORG-094 "kartada 3 stavka × 1 xodim" — I4 (2026-06-25) buni ochiq ziddiyat deb belgilagan; egasi chegarani aniqlashi kerak.
- **Δ 2026-07-11→08-07:** `1724a0ac` — `assignEmployeeGuarded` (advisory-lock 82002) TOCTOU poygasini yopdi; DB partial-unique 3-ustunga kengaytirilmadi.

### EP-ORG-003 · Kartasiz — oylik va ERP yo'q
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** `card_id` NULL → login YO'Q + oylik YO'Q (qattiq tartib).
- **Manba:** KARTALAR-A (Q3) · I4-ORGSXEMA EP-ORG-003
- **Dalil (kod):** I4 (2026-06-25): "Yo'q — login `is_active`'ga bog'langan, payroll kartani tekshirmaydi; `users.card_id` ustuni yo'q" — **Boshliq #1** deb belgilangan. QISM A Step-3: `CARD_LOGIN_GATE_ENABLED` opt-in, `CARD_PERMISSION_SOURCE_READY=false` (flag OFF).
- **Nima yetishmaydi:** login card-gate + payroll card-gate jonli emas (flag OFF).
- **Bog'liqlik:** VR-ORG-I14 (gate flag OFF)
- **action:** APPROVE
- **⤳ Ta'sir:** Auth (login-gate), Payroll (oylik-gate), HR
- **Xoch-havolalar:** `I4-ORGSXEMA EP-ORG-003` · `EXTRACTION QISM A Step-3 (card-gate default-OFF)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-004 · Bitta xodim — bir nechta karta
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Xodim↔karta many; oylik = kartalar yig'indisi; daraxtda har joyda ko'rinadi.
- **Manba:** KARTALAR-A (Q4) · vision-1000 #30 · I4-ORGSXEMA EP-ORG-004
- **Dalil (kod):** `SELECT count(*) FROM employee_cards` → **31 jonli qator** (M:N real va to'ldirilgan). `card-employee-assigned.handler` har biriktirishda LMS enrolment triggerlaydi.
- **Nima yetishmaydi:** "ikkinchi kartaga to'liq/parallel onboarding" alohida oqim sifatida yo'q; grep `ikkinchi.*karta|parallel.*onboard` → 0.
- **Bog'liqlik:** EP-ORG-066 (stavka cap) to'lov ulushi tomonini qoplaydi
- **action:** CREATE
- **⤳ Ta'sir:** Payroll (yig'indi algoritm), HR, Reports
- **Xoch-havolalar:** `[Module-01] Item 30` · `EXTRACTION QISM A #30` · `I4-ORGSXEMA EP-ORG-004` · `vision-1000 #30`
- **⚠️ ZIDDIYAT:** I4 (2026-06-25) "backend M:N BOR lekin aktiv `assignUser` 1:1 — de-routed" vs FULL-ITEM-LEVEL (2026-07-11) "`employee_cards` 31 jonli qator". Yangi + kod-dalilli manba ustun: M:N jonli.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-005 · Karta hech qachon o'chmaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Karta soft-delete (arxiv/vakant), to'liq tarix saqlanadi.
- **Manba:** KARTALAR-A (Q5) · TASDIQ-2146 §01 #01.85 · I4-ORGSXEMA EP-ORG-005/085
- **Dalil (kod):** `card.repository.ts:257-264` `softDelete()` — `UPDATE org_departments SET is_active=false, current_state='archived'`, hech qachon hard `DELETE` emas; `card.controller.ts:326-329` `DELETE :id` → `service.softDelete()`.
- **Bog'liqlik:** EP-ORG-085/086 (arxiv/tiklash)
- **action:** UPDATE
- **⤳ Ta'sir:** HAMMA (FK saqlanadi), Reports (tarix), HR
- **Xoch-havolalar:** `[Module-01] Item #85` *(taxminiy)* · `EXTRACTION QISM C #43/#85` · `I4-ORGSXEMA EP-ORG-005/085`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-006 · Xodim ketganda profil muzlaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Xodim ketsa profil freeze, karta vakant; qaytsa restore, tarix to'liq.
- **Manba:** KARTALAR-A (Q6) + BARCHA_JAVOBLAR Q38 (exit + arxiv) · vision-1000 #2 · I4-ORGSXEMA EP-ORG-006/084
- **Dalil (kod):** `card.controller.ts:69-72,259-266` (`CardFreezeSchema`, `PATCH :id/freeze`) + `card.repository.ts:536-551` `freeze()` → `frozen_at`/`freeze_reason`/`freeze_until` (uchala ustun jonli DB'da tasdiqlangan). **Δ:** `card-lifecycle.events.ts` (yangi) `CardStatusChangedEvent`; `payroll.service.ts:507-539` — muzlatilgan karta uchun fail-closed oylik-gate (LIVE `current_state` o'qiydi) (`1724a0ac`).
- **Nima yetishmaydi:** xodim-ketishi hodisasidan avtomatik freeze→vakant lifecycle hamon yo'q (holat faqat qo'lda `PATCH` bilan o'zgaradi).
- **Bog'liqlik:** EP-ORG-084 (muzlatish), EP-ORG-086 (tiklash)
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Auth (kirish bloki), Payroll (to'xtaydi)
- **Xoch-havolalar:** `[Module-01] Item 2` · `EXTRACTION QISM A #2` · `QISM C #01.42` · `I4-ORGSXEMA EP-ORG-006/084` · `vision-1000 #2`
- **⚠️ ZIDDIYAT:** QISM A #2 "freeze/muzlatish sabab+muddat qurilmagan (Yo'q)" vs QISM C #01.42 "Ha REAL" + jonli DB 3 ustun. Yangi + kod-dalilli manba ustun → freeze QURILGAN; QISM A qatori STALE-DOC.
- **Δ 2026-07-11→08-07:** `1724a0ac` — `CardStatusChangedEvent` emitlanadi (freeze/thaw/vacant/restore) + payroll frozen-card fail-closed gate qo'shildi (vision-1000 #2 ning ikkinchi yarmi yopildi).

### EP-ORG-007 · Karta papkasi — 6 bo'lim
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har kartada 6 majburiy bo'lim (vazifa/javobgarlik/GSD/reglament/jarayon/ta'lim) + to'liqlik%.
- **Manba:** KARTALAR-A (Q7) + BARCHA_JAVOBLAR Q32 (virtual papka) · vision-1000 #6/#47 · I4-ORGSXEMA EP-ORG-007
- **Dalil (kod):** `card-folder.service.ts:24-46` — `completeness: Math.round((filled / SECTIONS.length) * 100)`; 6 bo'lim (`card-folder.controller.ts:4,41`). `SELECT count(*) FROM card_folders` → **0 qator**.
- **Nima yetishmaydi:** vizyon 12 bo'limga kengaytirilgan (EP-ORG-095), kod 6 da qolgan; jonli data 0; to'liqlik% dan LMS-gate'ga ulanish yo'q; bo'sh bo'lim uchun Kanban topshirig'i yo'q (`CardCompletenessRecalcEvent` grep → 0).
- **Bog'liqlik:** EP-ORG-095, EP-ORG-104, EP-ORG-135
- **action:** CREATE
- **⤳ Ta'sir:** LMS (ta'lim), Director (reglament/jarayon), HR
- **Xoch-havolalar:** `[Module-01] Item 6` · `[Module-01] Item 47` · `EXTRACTION QISM A #6/#47` · `I4-ORGSXEMA EP-ORG-007`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-008 · Razryad har kartada
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har kartada `razryad` maydoni majburiy.
- **Manba:** KARTALAR-A (Q8) · TASDIQ-2146 §01 #01.131 · I4-ORGSXEMA EP-ORG-008
- **Dalil (kod):** `org_departments.razryad_level_id` ustuni mavjud; `card.repository.ts:376-393` `computeCardFit()` faqat `f.razryad_level_id IS NOT NULL` mavjudlik-bayrog'ini tekshiradi. I4: biriktiruv **0/144**.
- **Nima yetishmaydi:** "majburiy" (NOT NULL / validatsiya) emas; jonli data 0 — egasi-DATA darvozasi.
- **Bog'liqlik:** VR-ORG-I07 (razryad DATA), EP-ORG-131
- **action:** CREATE
- **⤳ Ta'sir:** Payroll (razryad→oylik), HR, LMS (imtihon)
- **Xoch-havolalar:** `[Module-01] Item #131` *(taxminiy)* · `EXTRACTION QISM C #01.131` · `I4-ORGSXEMA EP-ORG-008`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-009 · Razryad pog'onalari (master-ro'yxat)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Razryad = QO'LDA SOZLANADIGAN master-data (`razryad_levels` jadval); egasi darajalar + har birining datasini sozlaydi (Q9 tuzatish).
- **Manba:** KARTALAR-A (Q9, tuzatilgan) · TASDIQ-2146 §01 #01.1 · I4-ORGSXEMA EP-ORG-009
- **Dalil (kod):** `razryad_levels` → **6 qator, 21 ustun**; `razryad.controller`/`razryad.repository` + FE `RazryadFormDialog` (I4: "Qurilgan").
- **Bog'liqlik:** VR-ORG-I09 (exam-config qiymatlari NULL)
- **action:** CREATE
- **⤳ Ta'sir:** HR/Settings (master-data setup), Payroll (oylik band), Admin
- **Xoch-havolalar:** `[Module-01] Item 51` *(taxminiy)* · `EXTRACTION QISM C #01.1` · `I4-ORGSXEMA EP-ORG-009`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-010 · Razryad ko'tarilishi qanday tasdiqlanadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Imtihon o'tadi → HR + yuqori rahbar tasdiq → razryad o'zgaradi.
- **Manba:** KARTALAR-A (Q10) · vision-1000 #33 · TASDIQ-2146 §01 #01.134 · I4-ORGSXEMA EP-ORG-010
- **Dalil (kod):** `razryad-history.service.ts:36-85` `createRequest()` — `hr-approve`/`manager-approve` 2-imzo oqimi real; `razryad-history.service.ts:57` `exam_pass_threshold` fail-closed enforce; `exam-passed-razryad.listener.ts:80` `nextRazryadIdForCard()`.
- **Nima yetishmaydi:** `card_folders.completeness` ≥70% eligibility-gate ulanmagan (grep `completeness|eligib|canTakeExam` → faqat papka-hisob); `razryad_levels.exam_pass_threshold` 6/6 NULL.
- **Bog'liqlik:** EP-ORG-055, EP-ORG-007, VR-ORG-I09
- **action:** APPROVE
- **⤳ Ta'sir:** LMS (imtihon), HR, Coordination (tasdiq), Payroll
- **Xoch-havolalar:** `[Module-01] Item 33` *(taxminiy)* · `[Module-01] Item #134` · `EXTRACTION QISM A #33` · `EXTRACTION QISM D #33` · `I4-ORGSXEMA EP-ORG-010`
- **⚠️ ZIDDIYAT:** I4 (2026-06-25) "`razryad_history` jadval yo'q, grep=0" vs FULL-ITEM-LEVEL (2026-07-11) "jadval mavjud, 15 ustun, service real". Yangi + kod/DB-dalilli manba ustun.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-011 · Imtihon oralig'i (min 3 oy)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** 2 imtihon orasi ≥3 oy, xodim o'zi murojaat qiladi.
- **Manba:** KARTALAR-A (Q11) · vision-1000 #3 · I4-ORGSXEMA EP-ORG-011
- **Dalil (kod):** `razryad-history.service.ts:88-92` — `min_months` asosidagi `checkInterval` guard, `min_months` NULL bo'lsa fail-closed rad etadi ("egasi sozlamagan, fabrikatsiya yo'q"). `razryad_history` → 15 ustun, **0 qator**.
- **Nima yetishmaydi:** `razryad_levels.min_months` seed qilinmagan (jonli 0) → guard hech qachon o'tolmaydi; "xodim o'zi murojaat qiladi" ariza-oqimi alohida tasdiqlanmagan.
- **Bog'liqlik:** EP-ORG-055/056 (razryad_levels seed), VR-ORG-I09
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, HR
- **Xoch-havolalar:** `[Module-01] Item 3` · `EXTRACTION QISM A #3` · `I4-ORGSXEMA EP-ORG-011` · `vision-1000 #3`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-012 · Razryad pasayishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Razryad tushishi ham bo'ladi (HR + rahbar tasdig'i bilan).
- **Manba:** KARTALAR-A (Q12) · vision-1000 #9 (e'tiroz oynasi) · I4-ORGSXEMA EP-ORG-012
- **Dalil (kod):** `grep "appeal|e'tiroz|5.*ish.*kun" razryad-history.service.ts` → **0 mos**. `requestType='decrease'` `createRequest()` da qo'llab-quvvatlanadi (`razryad-history.controller.ts:102-120`), lekin e'tiroz-oynasi / jarayonda razryad-muzlatish yo'q.
- **Nima yetishmaydi:** 5 ish kunlik e'tiroz oynasi, e'tiroz davomida razryad freeze, HR-bosh + direktor ikki tomonlama ko'rib chiqish — hech biri yo'q.
- **Bog'liqlik:** EP-ORG-134 (pasayish triggerlari)
- **action:** UPDATE
- **⤳ Ta'sir:** Payroll, HR, QC (sifat tushsa sabab)
- **Xoch-havolalar:** `[Module-01] Item 9` · `[Module-01] Item #134` · `EXTRACTION QISM A #9` · `I4-ORGSXEMA EP-ORG-012`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-013 · Razryad o'zgarsa HR hujjati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** Razryad o'zgarsa HR hujjati + ichki sertifikat majburiy.
- **Manba:** KARTALAR-A (Q13) · I4-ORGSXEMA EP-ORG-013
- **Dalil (kod):** I4 (2026-06-25): "Yo'q — grep=0; `certificates` = LMS kurs, 0 qator".
- **Nima yetishmaydi:** razryad o'zgarishida avtomatik HR-hujjat + ichki sertifikat generatsiyasi.
- **Bog'liqlik:** EP-ORG-047 (sertifikat ro'yxati), EP-ORG-138 (PDF)
- **action:** CREATE
- **⤳ Ta'sir:** CC/Hujjat, LMS (sertifikat), HR
- **Xoch-havolalar:** `I4-ORGSXEMA EP-ORG-013`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-014 · Karta uchun GSD/ЦКП ta'rifi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Har kartada GSD: maqsad + birlik + chastota majburiy.
- **Manba:** KARTALAR-A (Q14) + BARCHA_JAVOBLAR Org-Q3 (har lavozim QYM) · TASDIQ-2146 §01 #01.7/#01.121 · I4-ORGSXEMA EP-ORG-014
- **Dalil (kod):** birlik — `card.controller.ts:38` `tskpMeasurementUnit: z.enum(['SON','FOIZ','VAQT'])` + `org_departments.tskp_measurement_unit`; maqsad — `org_departments.tskp_target`; chastota — `org_departments.ckp_frequency` + `ckp_report_deadline_hours`, `ckp-fact.service.ts:126-143` `calcDeadline()`.
- **Bog'liqlik:** VR-ORG-I08 (ЦКП DATA: `tskp_target`/`measurement_unit` 0/144 — mexanizm bor, qiymat yo'q)
- **action:** CREATE
- **⤳ Ta'sir:** Director (otdeleniye GSD), AI (baho), Notifications (bot so'rov), Reports
- **Xoch-havolalar:** `[Module-01] Item 57` *(taxminiy)* · `[Module-01] Item #121` *(taxminiy)* · `EXTRACTION QISM C #01.7/#01.121` · `I4-ORGSXEMA EP-ORG-014`
- **⚠️ ZIDDIYAT:** I4 (2026-06-25) "chastota YO'Q" vs FULL-ITEM-LEVEL (2026-07-11) "`ckp_frequency` + `calcDeadline()` = Ha". Yangi + kod-dalilli manba ustun.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-015 · ЦКП kim belgilaydi va qanday yoziladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** HR yozadi, format = matn tavsif + formula.
- **Manba:** KARTALAR-A (Q15) · TASDIQ-2146 §01 #01.130 · I4-ORGSXEMA EP-ORG-015
- **Dalil (kod):** `ckp-fact.service.ts:101-119` `calcAchievement()` — 4 formula turi (`boolean`/`foiz`/`vaqt`/`quantity_pct`), har karta uchun `org_departments.tskp_formula_type`, slot-darajali override `ckp_card_products.formula_type` (`cardProductTarget()`, 76-84).
- **Bog'liqlik:** EP-ORG-111, EP-ORG-130
- **action:** CREATE
- **⤳ Ta'sir:** HR, AI (ЦКП'dan savol tuzadi), Settings
- **Xoch-havolalar:** `[Module-01] Item #130` *(taxminiy)* · `[Module-01] Item #111` · `EXTRACTION QISM C #01.130` · `I4-ORGSXEMA EP-ORG-015`
- **⚠️ ZIDDIYAT:** I4 (2026-06-25) "'formula' maydoni YO'Q" vs FULL-ITEM-LEVEL (2026-07-11) "`tskp_formula_type` + 4-tarmoqli `calcAchievement()` = Ha". Yangi + kod-dalilli manba ustun.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-016 · Mashinasiz xodimning ЦКП hisoboti
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** AI chatbot har kuni ЦКП'dan savol so'raydi → kunlik hisobot.
- **Manba:** KARTALAR-A (Q16) + BARCHA_JAVOBLAR Q116/Q117 (bot kunlik hisobot) · vision-1000 #36 · I4-ORGSXEMA EP-ORG-016
- **Dalil (kod):** `ckp.controller.ts:27` `source: z.enum(['MANUAL','AI_CHAT','MES_AUTO','IOT'])` — `AI_CHAT` manbasi sxemada bor. `daily-report-deadline.cron.ts:1-50` — real `@Cron('0 23 * * *')`, `hr_daily_reports` yo'qligini aniqlaydi + Telegram xabar.
- **Nima yetishmaydi:** AI-chatbot ning kunlik ЦКП-savol generatori yo'q (I4: `ai_ckp_chat_logs` 0 qator, unwired — "Boshliq #5").
- **Bog'liqlik:** EP-ORG-018/121 (deadline), VR-ORG-I12 (AI kalitlar)
- **action:** AI
- **⤳ Ta'sir:** AI, Notifications (telegram), Payroll (hisobot→oylik), HR
- **Xoch-havolalar:** `[Module-01] Item 36` · `[Module-01] Item 58` *(taxminiy)* · `EXTRACTION QISM A #36` · `I4-ORGSXEMA EP-ORG-016`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-017 · Mashinachi xodimning ЦКП manbai
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Operator ЦКП avtomatik IoT/MES'dan; rasmiy PDF invoys.
- **Manba:** KARTALAR-A (Q17) + BARCHA_JAVOBLAR Q119 (uskuna→invoys PDF) · vision-1000 #49 · I4-ORGSXEMA EP-ORG-017
- **Dalil (kod):** `ckp-mes-feed.listener.ts:1-60` — real `@OnEvent(ERP_EVENTS.MES_COMPLETED)`; 3-bosqichli javobgar-karta aniqlash (session→card, operator→card, work-center→card), `goodQty = actual − defect`, idempotent `CkpFactService.recordFact`. "FABRIKATSIYA YO'Q" — karta topilmasa skip+log.
- **Nima yetishmaydi:** MES hali `MES_COMPLETED` chiqarmayapti (ЦКП-fakt jadvallari 0 qator) — DATA-gate; crash holatida qisman-sessiya fallback yo'q; "manba yo'q → AI bot so'rov" yo'q; rasmiy PDF invoys yo'q.
- **Bog'liqlik:** MES moduli event-emitteri; EP-ORG-050
- **action:** EVENT
- **⤳ Ta'sir:** IoT, MES, AI, Payroll
- **Xoch-havolalar:** `[Module-01] Item 49` · `EXTRACTION QISM A #49` · `QISM C #01.50` · `I4-ORGSXEMA EP-ORG-017`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-018 · Kunlik hisobot bermaslik jazosi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** 16 soat ichida ЦКП yo'q → o'sha kun oylik yozilmaydi; tiklash HR→direktor. (BARCHA: 3 soat → ishlamagan, HR o'zgartiradi.)
- **Manba:** KARTALAR-A (Q18) + BARCHA_JAVOBLAR Q118 · vision-1000 #36 · I4-ORGSXEMA EP-ORG-018/052
- **Dalil (kod):** `daily-report-deadline.cron.ts` — `@Cron('0 23 * * *')`, hisobotsiz faol xodimni belgilaydi + Telegram. `org_departments.ckp_report_deadline_hours` per-karta sozlanadi. `closePeriod()` (`payroll.service.ts:144-198`) hech qanday ЦКП-deadline gate'ini chaqirmaydi.
- **Nima yetishmaydi:** 30-daqiqalik poll / smena-boshidan 3-soat qoidasi yo'q (cron kuniga 1 marta 23:00); `work_schedules` kalendar integratsiyasi yo'q; oylik-blok payroll close oqimiga ULANMAGAN.
- **Bog'liqlik:** EP-ORG-052, EP-ORG-121, VR-ORG-I04 (16 vs 3 soat)
- **action:** CRON
- **⤳ Ta'sir:** Payroll (kun-gate), HR, Coordination, Notifications
- **Xoch-havolalar:** `[Module-01] Item 36` · `[Module-01] Item #121` · `EXTRACTION QISM A #36` · `I4-ORGSXEMA EP-ORG-018/052`
- **⚠️ ZIDDIYAT:** deadline **16 soat** (KARTALAR-A Q18) vs **3 soat** (BARCHA_JAVOBLAR / vision-1000 #36). Kod per-karta `ckp_report_deadline_hours` (sozlanadigan) ishlatadi; yakuniy raqam egasi qarori. → VR-ORG-I04
- **Δ 2026-07-11→08-07:** —

### EP-ORG-019 · 7-Otdeleniye raqami
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** Har kartada `otdeleniye_no` (1-7) majburiy.
- **Manba:** KARTALAR-A (Q19) + BARCHA_JAVOBLAR Org-Q2 (7 otdeleniye) · TASDIQ-2146 §01 #01.99/#01.100 · I4-ORGSXEMA EP-ORG-019
- **Dalil (kod):** `SELECT otdeleniye_no, count(*) FROM org_departments GROUP BY otdeleniye_no` → yagona guruh `{null: 143}` — ustun mavjud, lekin **100% NULL**. `hierarchy_level` esa 143/143 to'lgan.
- **Nima yetishmaydi:** 1-7 qiymatlari kiritilmagan; NOT NULL / majburiylik yo'q.
- **Bog'liqlik:** EP-ORG-099, EP-ORG-100 (bir xil ustun)
- **action:** CREATE
- **⤳ Ta'sir:** Director (otdeleniye GSD), HR, Reports, Coordination
- **Xoch-havolalar:** `[Module-01] Item #99` · `[Module-01] Item #100` · `EXTRACTION QISM C #01.99/#01.100` · `I4-ORGSXEMA EP-ORG-019`
- **⚠️ ZIDDIYAT:** TASDIQ-2146 (2026-06-27) "Ha — `otdeleniye_no` 1-7 BOR, 145 qator" vs jonli DB (2026-07-11) "143 qator, `otdeleniye_no` 143/143 NULL". Kod/DB-dalil ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** `d39ec98a` — Vysotskiy-7 tier'lari `org-mutations.repo.ts`/`org-queries.repo.ts` da head-bearing + stats mantiqiga ulandi; `e2244914` — FE 6-tier taksonomiya (L0 Egasi .. L5 Sektsiya-Sektor). `otdeleniye_no` DATA hamon egasidan kutiladi.

### EP-ORG-020 · Otdeleniye GSD-metrikasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Har otdeleniyaga bitta bosh metrika (gsd_metric).
- **Manba:** KARTALAR-A (Q20) · TASDIQ-2146 §01 #01.114 · I4-ORGSXEMA EP-ORG-020
- **Dalil (kod):** `cascade/ckp-cascade.listener.ts` — docblock: ajdod kartaning kunlik ROLLUP agregati butun subtree yaproq-faktlaridan qayta hisoblanadi; ya'ni rahbar/otdeleniye kartasining metrikasi quyi kartalardan avtomatik to'planadi.
- **Bog'liqlik:** EP-ORG-112, EP-ORG-114 (bir xil mexanizm)
- **action:** CREATE
- **⤳ Ta'sir:** Director, AI, Reports
- **Xoch-havolalar:** `[Module-01] Item #114` *(taxminiy)* · `EXTRACTION QISM C #01.114` · `I4-ORGSXEMA EP-ORG-020`
- **⚠️ ZIDDIYAT:** I4 (2026-06-25) "`gsd_metric` ustun grep=0; `company_tskp` 0 qator unwired" vs FULL-ITEM-LEVEL (2026-07-11) "rollup listener real". Yangi manba ustun; lekin nomlangan `gsd_metric` ustuni sifatida emas — rollup-agregat sifatida qurilgan.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-021 · Daraxt — har node bir karta
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Yagona daraxt, har node = karta, 7 qatlam, ota-karta = rahbar.
- **Manba:** KARTALAR-A (Q21) + BARCHA_JAVOBLAR Org-Q2/Q9 · vision-1000 #35 · I4-ORGSXEMA EP-ORG-021/099
- **Dalil (kod):** `WITH RECURSIVE` jonli ishlatiladi — `card.repository.ts:91,112` (descendant/cycle-guard), `ckp-fact.repository.ts:237,256,280,316` (subtree/ancestor). N+1 yo'q.
- **Nima yetishmaydi:** `<300ms` perf o'lchovi va materialized view na tasdiqlangan, na rad etilgan; I4: "yagona-daraxt invarianti buzilgan — 14 ildiz".
- **Bog'liqlik:** EP-ORG-108, EP-ORG-099
- **action:** CREATE
- **⤳ Ta'sir:** HAMMA (rahbar zanjiri), Coordination (eskalatsiya), Org
- **Xoch-havolalar:** `[Module-01] Item 35` · `EXTRACTION QISM A #35` · `I4-ORGSXEMA EP-ORG-021/099`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-022 · Vakant rahbar holati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Rahbar vakant → quyi rahbarsiz ishlaydi, sakrash yo'q.
- **Manba:** KARTALAR-A (Q22) · vision-1000 #38 · I4-ORGSXEMA EP-ORG-022
- **Dalil (kod):** I4: `getApprovalChain` **no-skip** — jonli tasdiqlangan ("Qurilgan"). FULL-ITEM-LEVEL: alohida `coordination` moduli topilmadi; `card.repository.ts:91-118` `listManagerCandidates` faqat rahbar-tanlash uchun (self+descendant istisno), tasdiq-zanjiri eskalatsiyasi emas.
- **Nima yetishmaydi:** "max 3 daraja sakrash" state-machine yo'q (lekin bu EP-ORG-022 ga ZID talab — quyiga qarang).
- **Bog'liqlik:** VR-ORG-I13
- **action:** APPROVE
- **⤳ Ta'sir:** Coordination (eskalatsiya yo'q), Finance (approval-matrix), CC
- **Xoch-havolalar:** `[Module-01] Item 38` · `EXTRACTION QISM A #38` · `EXTRACTION QISM A Step-3 (ziddiyat)` · `I4-ORGSXEMA EP-ORG-022`
- **⚠️ ZIDDIYAT:** EP-ORG-022 "vakant rahbar → sakrash YO'Q" vs vision-1000 #38 "vakant rahbar → keyingi yuqoriga, maks 3 sakrash → direktor". Kod `no-skip` ni tanlagan. Egasi org-tuzilma vs tasdiq-marshrut chegarasini aniqlashi kerak. → VR-ORG-I13
- **Δ 2026-07-11→08-07:** —

### EP-ORG-023 · Karta = ruxsat (RBAC)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** Ko'rish/qilish/tasdiq = kartadan; karta o'zgarsa ruxsat o'zgaradi.
- **Manba:** KARTALAR-A (Q23) + BARCHA_JAVOBLAR Q132/Q157/Org-Q6 (rol orgsxemadan) · vision-1000 #8/#17 · I4-ORGSXEMA EP-ORG-023
- **Dalil (kod):** `auth.module.ts:46` → `expiresIn: (JWT_ACCESS_TOKEN_TTL ?? JWT_EXPIRES_IN ?? '15m')`; `apps/api/.env:11-13` → `JWT_ACCESS_TOKEN_TTL=15m`. Faqat ishlatilmaydigan `.env.production.example:28` da `24h` qolgan.
- **Nima yetishmaydi:** I4: RBAC hamon eski `positions` ga keyed (1380 qator), `org_departments` ga emas — karta→ruxsat manbasi to'liq ko'chirilmagan.
- **Bog'liqlik:** VR-ORG-I14 (`CARD_PERMISSION_SOURCE_READY=false`), VR-ORG-I15
- **action:** APPROVE
- **⤳ Ta'sir:** Auth/Security + HAMMA modul + CC (tasdiq) + POS
- **Xoch-havolalar:** `[Module-01] Item 17` · `[Module-01] Item 8` · `EXTRACTION QISM A #8/#17` · `I4-ORGSXEMA EP-ORG-023`
- **⚠️ ZIDDIYAT:** QISM A #8/#17 "JWT access 24h ≠ 15daq" vs jonli `.env` + kod default "15m". Kod-dalil ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-024 · Karta uchun oylik turi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har kartada oylik_turi (soat/kun/ishbay) + bonus maydoni; oylik kartadan.
- **Manba:** KARTALAR-A (Q24) + BARCHA_JAVOBLAR Q58/Q181 (oylik→Payroll) · vision-1000 #46 · I4-ORGSXEMA EP-ORG-024
- **Dalil (kod):** I4: `salary_type` + `bonus_config` sxema + FE Edit + persist = "Qurilgan". `payroll.service.ts:238-345` `computeCardPay`/`prorateCardPay` — `baseSalary × razryadCoeff × ckpAchievementPct × stakeShare`, keyin `workedDays/periodWorkingDays` bo'yicha pro-rata.
- **Nima yetishmaydi:** `closePeriod()` (144-198) `prorateCardPay`/`computeCardPay` ni HECH QACHON chaqirmaydi — formula preview-utility bo'lib qolgan, real posting yo'liga ulanmagan.
- **Bog'liqlik:** EP-ORG-142, VR-ORG-I07 (oylik DATA NULL)
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll OYLIK SIYOSATI + HR + Director (xarajat)
- **Xoch-havolalar:** `[Module-01] Item 46` *(taxminiy)* · `EXTRACTION QISM A #46` · `I4-ORGSXEMA EP-ORG-024`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-025 · Bonus tizimi (KPI'siz)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** Bonus = HR/Moliya/rahbar sozlaydigan tizim, KPI'ga bog'lanmaydi.
- **Manba:** KARTALAR-A (Q25) · I4-ORGSXEMA EP-ORG-025
- **Dalil (kod):** I4 (2026-06-25): "Qurilgan — `bonus_config` erkin matn; KPI-formula yo'q = vizyonga mos".
- **Bog'liqlik:** EP-ORG-024
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll, HR, Settings
- **Xoch-havolalar:** `I4-ORGSXEMA EP-ORG-025`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-026 · Oylik tasdiqlash zanjiri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Avto-hisob → HR + Moliya tasdiq → rahbar.
- **Manba:** KARTALAR-A (Q26) · TASDIQ-2146 §01 #01.103 · I4-ORGSXEMA EP-ORG-026
- **Dalil (kod):** `org-queries.repo.ts:204-222` `getApprovalChain()` — real `WITH RECURSIVE` `parent_id`/`head_user_id` bo'ylab 10 darajagacha yuriladi. I4: `salary_payout_approvals` ai→hr→finance→director BOR (1 qator).
- **Nima yetishmaydi:** oylik-tasdiq zanjiri jonli data bilan ishlamaydi (1 qator); avto-hisob `closePeriod()` ga ulanmagan.
- **Bog'liqlik:** EP-ORG-024, EP-ORG-103
- **action:** APPROVE
- **⤳ Ta'sir:** Finance, HR, Coordination (oqim), CC
- **Xoch-havolalar:** `[Module-01] Item #103` *(taxminiy)* · `EXTRACTION QISM C #01.103` · `I4-ORGSXEMA EP-ORG-026`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-027 · Darslik tugamasa oylik yo'q
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Karta darsligi tugamaguncha o'sha karta oyligi to'xtaydi.
- **Manba:** KARTALAR-A (Q27) + BARCHA_JAVOBLAR Q71/Q197 (LMS majburiy) · vision-1000 #43 · I4-ORGSXEMA EP-ORG-027
- **Dalil (kod):** `lms-card-gate.service.ts:1-60` — barcha majburiy kurslar tugaganini tekshiruvchi binar fail-closed gate. `payroll.service.ts:58-62`: `gross = baseSalary × razryadCoeff × ckpFactor × stakeShare` — formulada LMS-gate hadi yo'q; `closePeriod()` gate chaqirmaydi. **Δ:** `eccf3089` — `OnboardingDocumentGateService` (LMS gate bilan OR-kompozitsiya) `computeGatedMonthlySalary`/`previewCardSalary`/`generatePeriodRows` da fail-closed ishlaydi.
- **Nima yetishmaydi:** gate `closePeriod()` posting yo'liga hamon to'liq ulanmagan; oyning 1-kuni timing qoidasi (28-31 da tugatsa o'sha oy oyligi) kodda yo'q.
- **Bog'liqlik:** EP-ORG-115, [Module-01] Item 46 (bir xil `closePeriod` uzilishi)
- **action:** CRON
- **⤳ Ta'sir:** LMS, Payroll (gate), HR
- **Xoch-havolalar:** `[Module-01] Item 43` · `[Module-01] Item #115` · `EXTRACTION QISM A #43` · `I4-ORGSXEMA EP-ORG-027`
- **Δ 2026-07-11→08-07:** `eccf3089` — `OnboardingDocumentGateService` (LMS-gate ko'zgusi) qo'shildi va `computeGatedMonthlySalary`/`previewCardSalary`/`generatePeriodRows` ga OR-kompozitsiya bilan ulandi.

### EP-ORG-028 · Darslik kartaga biriktiriladi (xodimga emas)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Darslik kartaga biriktiriladi; xodim almashsa ham qoladi.
- **Manba:** KARTALAR-A (Q28) + BARCHA_JAVOBLAR Q32 (lavozim papka) · TASDIQ-2146 §01 #01.88 · I4-ORGSXEMA EP-ORG-028
- **Dalil (kod):** `card_required_knowledge.course_id` ustuni jonli; `card.service.ts:147-160` `CARD_EMPLOYEE_ASSIGNED_EVENT` emitlanadi → LMS `card-employee-assigned.handler` xodimni KARTAning kurslariga avto-yozadi (xodimning shaxsiy kurs ro'yxatiga emas).
- **Bog'liqlik:** EP-ORG-088, EP-ORG-122
- **action:** CREATE
- **⤳ Ta'sir:** LMS, HR (yangi xodim avto-oladi)
- **Xoch-havolalar:** `[Module-01] Item #88` · `EXTRACTION QISM C #01.46/#01.88` · `I4-ORGSXEMA EP-ORG-028`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-029 · Darslik kim tayyorlaydi va tasdiqlaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** O'quv bo'limi yozadi → AI tekshiradi → HR + rahbar tasdiqlaydi.
- **Manba:** KARTALAR-A (Q29) · TASDIQ-2146 §01 #01.12 · I4-ORGSXEMA EP-ORG-029
- **Dalil (kod):** `hr_question_bank` da 12 ustun ichida `created_by` yoki `approval_status` YO'Q; CRUD kontroller har qanday HR-rolli foydalanuvchiga to'g'ridan yaratish/tahrirlashga ruxsat beradi.
- **Nima yetishmaydi:** muallif-atributsiyasi va tasdiq-holati ustunlari yo'q → "yozadi→AI→HR tasdiq" workflow qurib bo'lmaydi.
- **Bog'liqlik:** EP-ORG-054, EP-ORG-053
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, AI, Coordination
- **Xoch-havolalar:** `[Module-01] Item 62` *(taxminiy)* · `EXTRACTION QISM C #01.12/#01.54` · `I4-ORGSXEMA EP-ORG-029`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-030 · Markaziy AI — karta↔xodim moslik bahosi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Bitta markaziy AI har karta↔xodim mosligini baholaydi (ЦКП/test/davomat/sifat/rahbar).
- **Manba:** KARTALAR-A (Q30) · vision-1000 #16/#42 · I4-ORGSXEMA EP-ORG-030
- **Dalil (kod):** `ai-fit.service.ts:1-60` — real `AiFitService`, `ai_fit_scores` ga yozadi, AI-chaqiruv muvaffaqiyatsiz bo'lsa "graceful" fallback.
- **Nima yetishmaydi:** MES/QC/LMS dan event-trigger (`@OnEvent`) yo'q; tungi batch yo'q; `ai_score_updated_at` alohida maydon sifatida topilmadi; manba avto-yig'ish yo'q.
- **Bog'liqlik:** EP-ORG-081, EP-ORG-098, VR-ORG-I12
- **action:** AI
- **⤳ Ta'sir:** AI + manba: MES/QC/HR/LMS/davomat/ЦКП
- **Xoch-havolalar:** `[Module-01] Item 16` · `[Module-01] Item #81` · `EXTRACTION QISM A #16` · `I4-ORGSXEMA EP-ORG-030`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-031 · AI hisobotini kim oladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** Moslik PDF → xodim + rahbar + HR (har biriga mos darajada).
- **Manba:** KARTALAR-A (Q31) + BARCHA_JAVOBLAR Q120 (rahbarlik zanjiri ko'radi) · I4-ORGSXEMA EP-ORG-031
- **Dalil (kod):** I4 (2026-06-25): "Yo'q — ai modulida PDF grep=0; faqat JSON".
- **Nima yetishmaydi:** moslik-hisoboti PDF eksporti va 3 oluvchiga tarqatish.
- **Bog'liqlik:** EP-ORG-030, EP-ORG-042 (ko'rinish darajasi)
- **action:** EXPORT
- **⤳ Ta'sir:** AI, CC (tarqatish), Notifications, RBAC
- **Xoch-havolalar:** `I4-ORGSXEMA EP-ORG-031`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-032 · Ko'nikma-matritsa va vorislik
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Skill-matrix + AI vorislar ro'yxati (sabab bilan).
- **Manba:** KARTALAR-A (Q32) + BARCHA_JAVOBLAR Q65/Q135 (succession + SkillsMatrix) · vision-1000 #29 · I4-ORGSXEMA EP-ORG-032
- **Dalil (kod):** `skills-matrix.service.ts:46-53` — real `getGapAnalysis(employeeId, positionId)`, `gapSkills.length > 0` bo'lganda `HrV2Events.SKILL_GAP_DETECTED` emitlanadi. I4: skill-matrix + succession CRUD real (18 qator), nomzod QO'LDA.
- **Nima yetishmaydi:** AI-vorislar taklifi (sabab bilan) yo'q — nomzodlar qo'lda kiritiladi.
- **Bog'liqlik:** EP-ORG-132, EP-ORG-081
- **action:** AI
- **⤳ Ta'sir:** AI, HR (recruitment/vorislik), LMS
- **Xoch-havolalar:** `[Module-01] Item 29` *(taxminiy)* · `EXTRACTION QISM A #29` · `I4-ORGSXEMA EP-ORG-032`
- **Δ 2026-07-11→08-07:** `7df7d889` — "Baholash klasteri": Skills Matrix noto'g'ri jadvalga murojaat qilishi tuzatildi, Mentorlik/Succession crash'lari yopildi, 360-rating ustun drifti tuzatildi.

### EP-ORG-033 · Ko'nikmani qanday qo'shiladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Xodim da'vo qiladi → test → raport → ko'nikma-matritsaga qo'shiladi.
- **Manba:** KARTALAR-A (Q33) · vision-1000 #29 · I4-ORGSXEMA EP-ORG-033
- **Dalil (kod):** `skills-matrix.service.ts:46-53` gap-analiz + `SKILL_GAP_DETECTED`. I4: `upsertSkillScore` + `SKILL_UPDATED` event BOR; data 0-2 qator.
- **Nima yetishmaydi:** "da'vo → test → raport" zanjiri yo'q; gap 0% ga tushganda rahbarga "razryad tayyormi?" teskari-signali yo'q (event faqat gap MAVJUD bo'lganda chiqadi).
- **Bog'liqlik:** EP-ORG-032, EP-ORG-131/132
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, HR, AI
- **Xoch-havolalar:** `[Module-01] Item 29` *(taxminiy)* · `EXTRACTION QISM A #29` · `I4-ORGSXEMA EP-ORG-033`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-034 · 3 kun yo'qlik — profil bloki
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** 3 kun sababsiz/ЦКП yo'q → avto-blok, hamma huquqdan mahrum; ochish HR dalolatnoma→direktor→super admin.
- **Manba:** KARTALAR-A (Q34) + BARCHA_JAVOBLAR Q108/Q111 · vision-1000 #13 · I4-ORGSXEMA EP-ORG-034
- **Dalil (kod):** `absence-block.cron.ts:1-80` — real 3-bosqichli cron (`_warnDay1`/`_escalateDay2`/`_blockDay3`), HR-menejer va direktorlarga Telegram xabar.
- **Nima yetishmaydi:** teskari yo'nalish — HR dalolatnoma→direktor→super-admin **unblock** zanjiri topilmadi (grep `unblock|dalolatnoma` → 0); ЦКП-yo'qligi shartining bloklashga ulanishi yo'q.
- **Bog'liqlik:** EP-ORG-018 (ЦКП deadline)
- **action:** CRON
- **⤳ Ta'sir:** Auth (blok), HR, Coordination (direktor), Notifications, Payroll
- **Xoch-havolalar:** `[Module-01] Item 13` · `EXTRACTION QISM A #13` · `I4-ORGSXEMA EP-ORG-034`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-035 · Ish-vaqti / smena — qayerda saqlanadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Smena/ish-vaqti alohida jadval, kartaga ulanadi.
- **Manba:** KARTALAR-A (Q35) + BARCHA_JAVOBLAR Q133 (ShiftSchedule) · TASDIQ-2146 §01 #01.119/#01.120 · I4-ORGSXEMA EP-ORG-035
- **Dalil (kod):** `org_departments.work_schedule` ustuni mavjud, lekin `WHERE work_schedule IS NOT NULL` → **0 qator**. `org_departments.shift_id` ustuni YO'Q (0). **Δ:** `hr-shifts-compat.controller.ts:124-205` — `shift_types` uchun to'liq CRUD (`GET/POST/PATCH/DELETE /api/hr/shifts/types`) + FE `ShiftTypesConfig.tsx` (`c82e6366`).
- **Nima yetishmaydi:** kartadan smena-jadvalga FK (`shift_id`) hamon yo'q; `work_schedule` erkin matn va 0/143 to'lgan.
- **Bog'liqlik:** EP-ORG-119, EP-ORG-120
- **action:** CREATE
- **⤳ Ta'sir:** MES (smena), HR (davomat), Payroll (soatbay), IoT (vaqt)
- **Xoch-havolalar:** `[Module-01] Item #119` *(taxminiy)* · `[Module-01] Item #120` · `[Module-01] Item 39` · `I4-ORGSXEMA EP-ORG-035`
- **Δ 2026-07-11→08-07:** `c82e6366` — smena-turi (`shift_types`) CRUD backend + FE qurildi; karta↔smena FK hamon yo'q.

### EP-ORG-036 · Karta ko'rinishi standarti (rang + kattalik)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** Rang = otdeleniye/holat bo'yicha, kattalik standart; vakant = kulrang.
- **Manba:** KARTALAR-A (Q36) · I4-ORGSXEMA EP-ORG-036
- **Dalil (kod):** I4 (2026-06-25): "Qisman — rang DARAJA bo'yicha, otdeleniye emas; vakant QIZIL punktir, talab kulrang".
- **Nima yetishmaydi:** vakant kartaning rangi vizyonga mos emas (kulrang emas).
- **Bog'liqlik:** Design-system (Qoida 21)
- **action:** READ
- **⤳ Ta'sir:** Org-UI, Design-system (token)
- **Xoch-havolalar:** `I4-ORGSXEMA EP-ORG-036`
- **⚠️ ZIDDIYAT:** vizyon "vakant = kulrang" vs kod "vakant = qizil punktir" (I4 ⚠️ bayrog'i). Δ dan keyin rang tizimi butunlay tier-asosli bo'ldi — egasi 2026-07-13 da "rang tanlash umuman kerak emas" dedi, ya'ni asl talab qisman bekor qilingan.
- **Δ 2026-07-11→08-07:** `e2244914` — rang endi `nodeType` (6-tier `ORG_TIERS`, `resolveTierColor`) bo'yicha, `hierarchyLevel` bo'yicha emas; `6c6840b8` — EditDialog dan qo'lda rang tanlagich olib tashlandi (egasi qarori 2026-07-13).

### EP-ORG-037 · Karta raqamlash (dublikatda 01/02)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** Dublikat kartalar 01/02/03 raqami bilan ajratiladi.
- **Manba:** KARTALAR-A (Q37) · vision-1000 #26 · I4-ORGSXEMA EP-ORG-002/037
- **Dalil (kod):** `card.repository.ts:126-151` `nextCodeForName()` — real implementatsiya (SB0107): mavjud maksimal suffiksni skanerlab `Slug-01`, `Slug-02` generatsiya qiladi; `card.service.ts:42-51` `create()` da `dto.code` berilmasa chaqiriladi.
- **Nima yetishmaydi:** `code` UNIQUE ustun EMAS (funksiyaning o'z izohi: "funksional konflikt yo'q") — dublikatlar toleratsiya qilinadi, vizyonning immutabilligi/yagonaligi kafolatlanmagan; jonli `code` 0/143 to'lgan.
- **Bog'liqlik:** EP-ORG-044 (import UPSERT `code` ga tayanadi — Item 44)
- **action:** CREATE
- **⤳ Ta'sir:** Org, HR, Payroll
- **Xoch-havolalar:** `[Module-01] Item 26` · `[Module-01] Item #102` · `EXTRACTION QISM A #26` · `I4-ORGSXEMA EP-ORG-002/037`
- **⚠️ ZIDDIYAT:** QISM A #26 "`generateCardCode`/01-02 avto-raqamlash grep 0" vs kod `nextCodeForName()` real va jonli ulangan. Kod-dalil ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** `8b325517` — FE "#N" badge endi tur-bo'yicha (per-tier) ketma-ketlik ko'rsatadi, global DB `id` emas (egasi so'rovi). Bu ko'rinish qatlami; BE `code` generatsiyasi o'zgarmadi.

### EP-ORG-038 · Vakansiya → recruitment → kartaga biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Vakant → HR talabnoma → recruitment → karta-binding (avtomatik).
- **Manba:** KARTALAR-A (Q38) + BARCHA_JAVOBLAR Q6/Q168 · vision-1000 #23 · I4-ORGSXEMA EP-ORG-038
- **Dalil (kod):** grep `VacancyOpenedEvent|recruitment.*card|card.*recruitment` → **0 mos**. I4: HR-talabnoma real (`node_hr_requests`), lekin recruitment→karta AVTO-bind yo'q.
- **Nima yetishmaydi:** `VacancyOpenedEvent` emitlanmaydi; recruitment moduli `@OnEvent` listener yo'q; 80%/50% moslik bandlari yo'q.
- **Bog'liqlik:** `computeCardFit` (mavjud) skorlash bazasi sifatida
- **action:** EVENT
- **⤳ Ta'sir:** HR (recruitment), CC (talabnoma), AI (vorislar), Org
- **Xoch-havolalar:** `[Module-01] Item 23` · `EXTRACTION QISM A #23` · `I4-ORGSXEMA EP-ORG-038`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-039 · Migratsiya — mavjudni yaxshilash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** 142 node + 30 xodim saqlanadi, ustiga karta-qatlam qo'shiladi (7-qatlam saqlanadi).
- **Manba:** KARTALAR-A (Q39) · vision-1000 #20 · I4-ORGSXEMA EP-ORG-039
- **Dalil (kod):** `SELECT count(*) FROM org_departments WHERE head_user_id IS NULL` → **125 NULL / 143 jami** (18 to'lgan). `backfillEmployeeUserId` helper `org-structure.service.ts:9` da import qilingan. `org_departments` da `manager_id` ustuni yo'q — ierarxiya `parent_id`, rahbar `head_user_id`.
- **Nima yetishmaydi:** DATA-gate ochiq: 125/143 bo'lim boshlig'i NULL — egasi/HR kiritishi kerak.
- **Bog'liqlik:** VR-ORG-I06
- **action:** UPDATE
- **⤳ Ta'sir:** HAMMA (mavjud data saqlanadi), Org
- **Xoch-havolalar:** `[Module-01] Item 20` · `EXTRACTION QISM A #20` · `I4-ORGSXEMA EP-ORG-039`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-040 · Bitta DDL / ikki-olam yo'q
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** Yagona org-struktura; 2-dept-olam birlashtiriladi; hamma modul + AI-kamera shunga ulanadi.
- **Manba:** KARTALAR-A (Q40) + BARCHA_JAVOBLAR Org-Q8 · I4-ORGSXEMA EP-ORG-040/040b
- **Dalil (kod):** `SELECT count(*) FROM org_departments` → **143 qator** (TASDIQ-2146 "145" degan edi). `hierarchy_level` 143/143 to'lgan. QISM A Step-3 (SB0058 STILL-OPEN): `org_departments` + `org_functions` + `departments` — 3 parallel base jadval hamon jonli; RBAC/payroll eski `org_functions` ga, FE yangi `org_departments` ga keyed.
- **Nima yetishmaydi:** yagona-DDL yopilmagan (I4: "Boshliq #3").
- **Bog'liqlik:** VR-ORG-I15, VR-ORG-I01, EP-ORG-023
- **action:** UPDATE
- **⤳ Ta'sir:** HAMMA, IoT (kamera), data-integrity
- **Xoch-havolalar:** `[Module-01] Item #99` *(taxminiy)* · `[Module-01] Item #100` · `EXTRACTION QISM A Step-3 (SB0058)` · `I4-ORGSXEMA EP-ORG-040/040b`
- **⚠️ ZIDDIYAT:** TASDIQ-2146 (2026-06-27) "145 qator daraxt Ha" vs jonli DB (2026-07-11) "143 qator, `otdeleniye_no` NULL". Kod/DB-dalil ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** `397e3eac` — `onboarding_tasks` FK eskirgan `org_functions` dan `org_departments` ga qayta yo'naltirildi (ikki-olam torayishi, lekin yopilmagan).

### EP-ORG-041 · Org-o'zgarish kaskadlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Yangi bo'lim/transfer → avto-kaskad: POS-ombor, RBAC, adaptatsiya, shartnoma.
- **Manba:** KARTALAR-A (Q41) + BARCHA_JAVOBLAR Q188 · vision-1000 #1 · I4-ORGSXEMA EP-ORG-041/041b/041c
- **Dalil (kod):** `cascade/org-cascade.listener.ts` — real `@OnEvent(ORG_CASCADE_EVENT)`, event-driven/async, xatolarni yutadi (58-61), ombor yaratish + RBAC-rol berish. `create()` da emit qilinadi.
- **Nima yetishmaydi:** kaskad faqat `create` da (transfer/`move()` emit qilmaydi — VR-ORG-I02); adaptatsiya va CC-shartnoma kaskadi yo'q (VR-ORG-I03); atomik rollback yo'q.
- **Bog'liqlik:** VR-ORG-I02, VR-ORG-I03
- **action:** EVENT
- **⤳ Ta'sir:** POS + Auth/RBAC + HR + CC (kuchli kaskad)
- **Xoch-havolalar:** `[Module-01] Item 1` · `EXTRACTION QISM A #1` · `I4-ORGSXEMA EP-ORG-041/041b/041c`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-042 · Karta ma'lumotlarining ko'rinish darajasi (maxfiylik)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Maxfiy maydonlar (oylik/AI-baho/razryad-tarix) faqat ruxsatli kartalarga ko'rinadi.
- **Manba:** KARTALAR-A (Q42) + BARCHA_JAVOBLAR Q43 · vision-1000 #45 · I4-ORGSXEMA EP-ORG-042
- **Dalil (kod):** `card.repository.ts` da rol-shartli ustun tanlash YO'Q; `card.controller.ts:74` yagona tekis `@Roles(...)` (hammasi-yoki-hech-nima). **Δ:** `org-structure.service.ts:25-30,113-122` — `KARTA_COMPENSATION_FIELDS = ['salaryType','minSalary','maxSalary','bonusConfig']`, `COMPENSATION_VISIBLE_ROLES = {admin, super_admin, director, hr, hr_manager}`; ro'yxatdan tashqaridagi chaqiruvchi uchun maydonlar javobdan **o'chiriladi** (`d9210dfc`).
- **Nima yetishmaydi:** `CardRepository.findById`/`list` (karta-moduli) hamon per-field projection qilmaydi; AI-baho va razryad-tarix maydonlari qamrab olinmagan; integration-test (super_admin ko'radi / operator yo'q) tasdiqlanmagan.
- **Bog'liqlik:** EP-ORG-069 (tarix ko'rish huquqi)
- **action:** APPROVE
- **⤳ Ta'sir:** RBAC, Finance, HR, Security
- **Xoch-havolalar:** `[Module-01] Item 45` · `EXTRACTION QISM A #45` · `EXTRACTION QISM D #45` · `I4-ORGSXEMA EP-ORG-042`
- **Δ 2026-07-11→08-07:** `d9210dfc` — org-structure `findOne` javobida kompensatsiya maydonlari uchun field-level RBAC (BE projection) qo'shildi.

