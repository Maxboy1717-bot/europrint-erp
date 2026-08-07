# Org-Kartalar — Yagona Vizyon Registri (EP-ORG) — 2026-08-07

> **Manbalar:** `decisions/01-org-kartalar.md` (143 qaror) · `FULL-ITEM-LEVEL [Module-01]` (143 item) · `FULL-VISION-EXTRACTION` QISM A/C/D + I4-ORGSXEMA intervyu · `vision-1000-answers/01-org-kartalar.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida kod tegan bandlar qayta tekshirildi (Δ qatorida belgilangan).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-ORG-001..143)** | **143** |
| **Qaror holati:** ✅ javoblangan | 89 |
| **Qaror holati:** 🔵 ochiq | 54 |
| **Qurilish:** Ha | 30 |
| **Qurilish:** Qisman | 73 |
| **Qurilish:** Yo'q | 22 |
| **Qurilish:** STALE-DOC | 8 |
| **Qurilish:** — (mos item topilmadi) | 10 |
| 2026-07-11 dan beri o'zgargan (Δ) | 35 |
| ⚠️ Manbalar orasida ziddiyat | 30 |

> **Eslatma (qamrov):** bu fayl **I QISM** — 143 EP-kodli qarorni to'liq qamraydi
> (`grep -c "^### EP-ORG-"` → **143**). Rejalashtirilgan **II QISM** (VR-ORG-I01..I15 —
> vizyon-realizatsiya bo'shliqlari) hali shu faylga yozilmagan; matn ichida `VR-ORG-Ixx`
> havolalari bog'liqlik sifatida ishlatiladi. Yuqoridagi jadval faqat I QISM sanog'i.
> **Eslatma (qurilish ≠ qaror):** ikki o'q mustaqil — masalan EP-ORG-064/065 (merge/split)
> qaror bo'yicha hamon 🔵 OCHIQ, lekin qurilish bo'yicha **Ha** (2026-08-04 da "Tavsiya A"
> bo'yicha qurilgan, egasining yakuniy imzosi kutilmoqda).

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

### EP-ORG-043 · Razryad jadvalida qaysi ustunlar bo'lsin
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Nom + tartib raqami + minimal talab + oylik bandi + imtihon turi + sertifikat-shart + tavsif (to'liq, bir marta sozlanadi).
- **Manba:** yangi (KARTALAR-A Q9 ↳ "razryad maydonlari keyingi turda") · TASDIQ-2146 §01 #01.1
- **Dalil (kod):** `_audit/q.cjs "SELECT count(*) rows, (SELECT count(*) FROM information_schema.columns WHERE table_name='razryad_levels') cols FROM razryad_levels"` → **6 qator, 21 ustun** — vizyon so'ragan barcha maydon-oilalari (nom/level/min-talab/oylik/imtihon/sertifikat/tavsif) sxemada bor.
- **Bog'liqlik:** EP-ORG-009 (razryad master-ro'yxat), VR-ORG-I09
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll (oylik bandi), HR (imtihon), Ishlab chiqarish (talab)
- **Xoch-havolalar:** `[Module-01] Item 51` · `EXTRACTION QISM C #01.1`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-044 · Razryad nomlash tizimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Raqam + nom birga ("4-razryad — Katta mashinist").
- **Manba:** yangi · TASDIQ-2146 §01 #01.2
- **Dalil (kod):** `SELECT string_agg(DISTINCT name,' | ') FROM razryad_levels` → `1-razryad | 2-razryad | 3-razryad | 4-razryad | 5-razryad | 6-razryad`. `level` + `name` ustunlari mavjud.
- **Nima yetishmaydi:** jonli `name` sof raqamli ("N-razryad") — tavsifiy unvon ("Katta mashinist") biriktirilmagan; bu egasi-DATA.
- **Bog'liqlik:** EP-ORG-043, EP-ORG-118 (unvon alohida maydon)
- **action:** CREATE
- **⤳ Ta'sir:** Payroll, HR
- **Xoch-havolalar:** `[Module-01] Item 52` · `EXTRACTION QISM C #01.2`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-045 · Razryad oylik bandi turi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Dan-gacha" oraliq (min–max); oraliqdagi nuqtani bo'lim boshlig'i taklif → HR tasdiq.
- **Manba:** yangi · TASDIQ-2146 §01 #01.3
- **Dalil (kod):** `SELECT count(*) FROM razryad_levels WHERE salary_min IS NOT NULL` → **0/6**. Ustunlar (`salary_min`/`salary_max`) mavjud (Item 51 ning 21-ustun sanog'i ichida), o'qish-yo'li ham bor — faqat qiymat yo'q.
- **Nima yetishmaydi:** egasi-DATA (6 qator uchun min–max summalar); "taklif → HR tasdiq" oraliq-nuqta oqimi kodda umuman yo'q.
- **Bog'liqlik:** VR-ORG-I07 (oylik DATA NULL), EP-ORG-024
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll (oylik formulasi)
- **Xoch-havolalar:** `[Module-01] Item 53` · `EXTRACTION QISM C #01.3` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-046 · Razryad imtihon turi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Nazariy test + amaliy sinov birga (ikkalasi o'tishi shart).
- **Manba:** yangi · TASDIQ-2146 §01 #01.4
- **Dalil (kod):** `SELECT count(*) FROM razryad_levels WHERE exam_type IS NOT NULL` → **0/6**. `exam_type` ustuni bor, qiymat kiritilmagan.
- **Nima yetishmaydi:** qiymat (egasi-DATA) + "ikkalasi o'tishi shart" (nazariy AND amaliy) qoidasini enforce qiluvchi mantiq.
- **Bog'liqlik:** EP-ORG-055, EP-ORG-128 (mashq/test to'plami), VR-ORG-I09
- **action:** APPROVE
- **⤳ Ta'sir:** HR (imtihon), AI (savol-banki)
- **Xoch-havolalar:** `[Module-01] Item 54` · `EXTRACTION QISM C #01.4` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-047 · Sertifikat/litsenziya talabi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Kartada "talab qilinadigan sertifikatlar" ro'yxati + amal muddati; 30 kun oldin ogohlantirish.
- **Manba:** yangi · TASDIQ-2146 §01 #01.5
- **Dalil (kod):** `card.repository.ts:518-523` `listCertificates()` — `expiring_soon` = `expiry_date <= now() + 30` hisoblanadi (funksiya 2026-06-27 dagi `:423-436` dan siljigan, mantiq o'zgarmagan).
- **Bog'liqlik:** EP-ORG-013 (razryad o'zgarsa sertifikat), EP-ORG-092 (attestatsiya)
- **action:** CREATE
- **⤳ Ta'sir:** HR (eslatma), Xavfsizlik moduli
- **Xoch-havolalar:** `[Module-01] Item 55` · `EXTRACTION QISM C #01.5`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-048 · Razryad master-ma'lumotini kim o'zgartiradi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Faqat HR boshlig'i + egasi (owner) tasdig'i bilan (vizyon: razryad master-data egasi sozlaydi).
- **Manba:** KARTALAR-A (Q9 — egasi sozlaydi) + vizyon · TASDIQ-2146 §01 #01.6
- **Dalil (kod):** `razryad.controller.ts:62` — `@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')`.
- **Nima yetishmaydi:** vizyon "faqat HR boshlig'i + egasi" deydi, kod `admin`/`manager`/`director` ga ham ruxsat beradi; egasi-tasdiq darvozasi (owner sign-off) umuman yo'q.
- **Bog'liqlik:** EP-ORG-009, EP-ORG-043
- **action:** APPROVE
- **⤳ Ta'sir:** Audit-tarix, Finance
- **Xoch-havolalar:** `[Module-01] Item 56` · `EXTRACTION QISM C #01.6`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-049 · ЦКП o'lchov turi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Uch tur: SON (dona/tonna), FOIZ (%), VAQT (kun/soat); kartaga moslab tanlanadi.
- **Manba:** yangi · TASDIQ-2146 §01 #01.7/#01.49
- **Dalil (kod):** `card.controller.ts:38` — `tskpMeasurementUnit: z.enum(['SON','FOIZ','VAQT']).optional()`; `org_departments.tskp_measurement_unit` ustuni jonli tasdiqlangan.
- **Bog'liqlik:** EP-ORG-014, EP-ORG-111, EP-ORG-130 (bir xil ЦКП-mexanika oilasi)
- **action:** CREATE
- **⤳ Ta'sir:** AI (kartaga baho), Ishlab chiqarish (KPI)
- **Xoch-havolalar:** `[Module-01] Item 57` · `EXTRACTION QISM C #01.7/#01.49`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-050 · ЦКП hisoblash manbasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Iloji bo'lsa tizimdan avtomatik (IoT/MES), bo'lmasa qo'lda (manba belgilanadi). (Vizyon: mashinachi avto, mashinasiz AI-bot.)
- **Manba:** KARTALAR-A (Q16/Q17) + vizyon · TASDIQ-2146 §01 #01.8/#01.50
- **Dalil (kod):** `ckp.controller.ts:27` — `source: z.enum(['MANUAL','AI_CHAT','MES_AUTO','IOT']).optional()`; `ckp-mes-feed.listener.ts` real `@OnEvent(ERP_EVENTS.MES_COMPLETED)` avto-manba sifatida ulangan.
- **Bog'liqlik:** EP-ORG-017 (MES event-emitteri hali chiqarmaydi), EP-ORG-016 (AI_CHAT manbasi bo'sh)
- **action:** EVENT
- **⤳ Ta'sir:** MES/Ishlab chiqarish, Ombor
- **Xoch-havolalar:** `[Module-01] Item 58` · `[Module-01] Item 49` · `EXTRACTION QISM C #01.8/#01.50`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-051 · ЦКП maqsadi (norma) qayerda turadi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Kartada standart norma + xodimga shaxsiy tuzatish (kerak bo'lsa).
- **Manba:** yangi · TASDIQ-2146 §01 #01.9/#01.51
- **Dalil (kod):** `org_departments.tskp_target` ustuni jonli; `ckp_personal_targets` jadvali ham mavjud (FK `ckp_personal_targets_card_id_fkey` bilan tasdiqlangan).
- **Nima yetishmaydi:** per-xodim override'ni o'qiydigan/yozadigan servis-kod topilmadi (Item 18 bilan bir xil kamchilik); "audit sabab majburiy" va "joriy oygacha amal qiladi" cheklovlari yo'q; `tskp_target` jonli 0 to'lgan.
- **Bog'liqlik:** [Module-01] Item 18 (bir xil uzilish), EP-ORG-014
- **action:** CREATE
- **⤳ Ta'sir:** Payroll, AI
- **Xoch-havolalar:** `[Module-01] Item 59` · `[Module-01] Item 18` · `EXTRACTION QISM C #01.9/#01.51`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-052 · ЦКП oylikka ta'siri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — ЦКП % bajarilishi oylik/bonusga bog'lanadi; hisobot bermaslik → o'sha kun oylik yo'q.
- **Manba:** KARTALAR-A (Q18 — hisobot→oylik) + BARCHA_JAVOBLAR Q118/Q119 · TASDIQ-2146 §01 #01.10/#01.52
- **Dalil (kod):** `org_departments.ckp_report_deadline_hours` real ustun; `ckp-fact.service.ts` real fakt-yozish servisi. `payroll.service.ts:144-198` `closePeriod()` posting oldidan HECH QANDAY ЦКП-deadline gate'ini chaqirmaydi.
- **Nima yetishmaydi:** ЦКП%→oylik formulasi va kun-gate real posting yo'liga (`closePeriod`) ulanmagan — Item 46 bilan bir xil uzilish; `ckp_fact_values` jonli 0.
- **Bog'liqlik:** EP-ORG-018, EP-ORG-121, [Module-01] Item 46
- **action:** CRON
- **⤳ Ta'sir:** Finance/Payroll (formula)
- **Xoch-havolalar:** `[Module-01] Item 60` · `[Module-01] Item 46` · `EXTRACTION QISM C #01.10/#01.52`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-053 · Savol-bank tuzilishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — Karta turi + razryad bo'yicha savol-bank (matn, variantlar, to'g'ri javob, qiyinlik).
- **Manba:** yangi (BARCHA Q62 — har lavozim AI savol banki, ustun sxemasi ochiq) · TASDIQ-2146 §01 #01.11/#01.53
- **Dalil (kod):** `question-bank.controller.ts` (to'liq o'qildi) — `hr_question_bank` da `org_function_id`, `razryad_level_id`, `category`, `question_uz`/`question_ru`, `expected_keywords`, `difficulty` (1-5) ustunlari bor, ya'ni vizyon so'ragan "karta turi + razryad + matn + variant + javob + qiyinlik" tuzilmasi org-structure modulida jonli. Jonli qator: 0.
- **Nima yetishmaydi:** jadval bo'sh (0 qator); `org_function_id` FK eskirgan `org_functions` ga keyed (ikki-olam qoldig'i — EP-ORG-040).
- **Bog'liqlik:** EP-ORG-040 (FK ikki-olam), EP-ORG-054, EP-ORG-128
- **action:** CREATE
- **⤳ Ta'sir:** AI (savol generatsiya/tekshirish), HR
- **Xoch-havolalar:** `[Module-01] Item 61` · `[Module-01] Item 15` · `EXTRACTION QISM C #01.11/#01.53`
- **⚠️ ZIDDIYAT:** QISM C #01.11 (2026-06-27) "Yo'q — org-structure'da savol-bank yo'q" vs #01.53 "Qisman — `hr_question_bank` sxema BOR" vs FULL-ITEM-LEVEL (2026-07-11) "jadval real, org-structure modulida, to'liq ustun to'plami". Kod-dalilli eng yangi manba ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-054 · Imtihon savol manbasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Bo'lim boshlig'i/usta yozadi + AI yordam beradi + HR tasdiqlaydi.
- **Manba:** BARCHA_JAVOBLAR Q62 (1+2 to'liq) + KARTALAR-A Q29 · TASDIQ-2146 §01 #01.12/#01.54
- **Dalil (kod):** `SELECT column_name FROM information_schema.columns WHERE table_name='hr_question_bank'` → qaytgan 12 ustun ichida `created_by` ham, `approval_status` ham YO'Q. CRUD kontroller har qanday HR-rolli foydalanuvchiga to'g'ridan yaratish/tahrirlashga ruxsat beradi.
- **Nima yetishmaydi:** muallif-atributsiyasi va tasdiq-holati ustunlari yo'q → "usta yozadi → AI yordam → HR tasdiq" workflow'ini qurib bo'lmaydi.
- **Bog'liqlik:** EP-ORG-029 (bir xil kamchilik), EP-ORG-053
- **action:** APPROVE
- **⤳ Ta'sir:** AI, HR
- **Xoch-havolalar:** `[Module-01] Item 62` · `EXTRACTION QISM C #01.12/#01.54`
- **⚠️ ZIDDIYAT:** QISM C #01.54 (2026-06-27) "Qisman — `created_by` + AI-gen bor, faqat approval-status yo'q" vs FULL-ITEM-LEVEL (2026-07-11) `information_schema` sanog'i "`created_by` ham YO'Q". Jonli sxema-dalil ustun.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-055 · O'tish chegarasi (ball)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Har razryad uchun alohida chegara (1-3 → 60%, 4-6 → 75%); amaliy ustun 70/30.
- **Manba:** yangi · TASDIQ-2146 §01 #01.13/#01.55
- **Dalil (kod):** `SELECT count(*) FROM razryad_levels WHERE exam_pass_threshold IS NOT NULL` → **0/6**. Ustun mavjud va `razryad-history.service.ts:57` da fail-closed enforce qilinadi ("egasi sozlamagan → rad, fabrikatsiya yo'q") — faqat seed yo'q.
- **Nima yetishmaydi:** egasi-DATA (har razryad uchun chegara qiymati); "amaliy 70 / nazariy 30" og'irlik bo'linishi kodda yo'q.
- **Bog'liqlik:** EP-ORG-010, EP-ORG-011, VR-ORG-I09
- **action:** APPROVE
- **⤳ Ta'sir:** Razryad, LMS
- **Xoch-havolalar:** `[Module-01] Item 63` · `[Module-01] Item 33` · `EXTRACTION QISM C #01.13/#01.55` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-056 · Qayta topshirish qoidasi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 14 kundan keyin, yiliga maksimal 3 marta.
- **Manba:** yangi (KARTALAR-A Q11 min 3 oy ko'tarilish — qayta-topshirish alohida) · TASDIQ-2146 §01 #01.14/#01.56
- **Dalil (kod):** `SELECT count(*) FROM razryad_levels WHERE max_retakes IS NOT NULL` → **0/6**; `max_retakes` ustuni mavjud.
- **Nima yetishmaydi:** "14 kun" kutish-oynasi uchun alohida ustun `razryad_levels` da umuman YO'Q (Item 51 ustun ro'yxatida topilmadi); `max_retakes` qiymati ham kiritilmagan (egasi-DATA).
- **Bog'liqlik:** EP-ORG-011 (min 3 oy — boshqa mexanizm), EP-ORG-055
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, HR
- **Xoch-havolalar:** `[Module-01] Item 64` · `EXTRACTION QISM C #01.14/#01.56` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-057 · Karta shabloni mavjudligi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Lavozim turi tanlansa standart maydonlar avtomatik to'ladi, keyin tahrirlanadi.
- **Manba:** BARCHA_JAVOBLAR Q54 (global + bo'limga xos shablon) + Q143 · TASDIQ-2146 §01 #01.15/#01.57
- **Dalil (kod):** `card-template.controller.ts:99-103` — `POST :id/apply-template` → `service.applyTemplate(id, override)`; `card-template.service.ts:21-25` `CARD_FIELD_KEYS` whitelist-merge. `SELECT count(*) FROM card_templates` → jadval bor, **0 qator**.
- **Nima yetishmaydi:** mexanizm real, lekin jonli shablon 0 — EP-ORG-059 (seed) egasi-DATA darvozasi.
- **Bog'liqlik:** EP-ORG-059 (seed), EP-ORG-140, EP-ORG-143
- **action:** CREATE
- **⤳ Ta'sir:** HR (karta yaratish), AI
- **Xoch-havolalar:** `[Module-01] Item 65` · `EXTRACTION QISM C #01.15/#01.57`
- **⚠️ ZIDDIYAT:** QISM C ning o'z ichida: #01.15 "Ha — apply-template merge REAL" vs #01.57 (takror) "Qisman — `card_templates`=0, jonli ishlamaydi" (Step-2b ziddiyat ro'yxatida rasman qayd etilgan). Yechim: mexanizm = Ha, data = 0 → shu yerda "Ha + data-gate" deb ajratildi.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-058 · Shablon o'zgarsa eski kartalar
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Eski kartalar o'zgarmaydi; faqat "shablonga moslashtirish" tugmasi bilan ixtiyoriy (xavfsiz).
- **Manba:** yangi · TASDIQ-2146 §01 #01.16/#01.58
- **Dalil (kod):** `grep -n "re-sync|resync|reSync" card-template*.ts` → **0 mos**. `apply-template` bir martalik, opt-in merge (avto-tarqaluvchi yangilanish emas) — bu "eski kartalar o'zgarmaydi" yarmiga to'liq mos.
- **Nima yetishmaydi:** aniq "shablonga moslashtirish" (re-sync) tugmasi/endpointi va diff-preview yo'q.
- **Bog'liqlik:** EP-ORG-057 (bir xil funksiya), [Module-01] Item 22
- **action:** UPDATE
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-01] Item 66` · `[Module-01] Item 22` · `EXTRACTION QISM C #01.16/#01.58`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-059 · Shablonlar ro'yxati boshlang'ich to'plami
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Zavodga xos to'plam tayyor (10-15 asosiy lavozim: mashinist/operator/naladchik/OTKchi/logist/...).
- **Manba:** yangi · TASDIQ-2146 §01 #01.17/#01.59
- **Dalil (kod):** `SELECT count(*) FROM card_templates` → **0 qator**. Jadval + `applyTemplate()` kod-yo'li allaqachon ishlaydi (EP-ORG-057).
- **Nima yetishmaydi:** faqat seed — egasi (yoki HR) 10-15 zavod-lavozim shablonini kiritishi kerak (egasi-DATA, kod ishi emas).
- **Bog'liqlik:** EP-ORG-057, EP-ORG-140, EP-ORG-143
- **action:** CREATE
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-01] Item 67` · `EXTRACTION QISM C #01.17/#01.59` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-060 · I.o. tayinlash mexanizmi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Kartaga muddatli i.o. (boshlanish–tugash sanasi bilan), muddat tugagach avtomatik qaytadi.
- **Manba:** yangi (BARCHA Q82 ta'til vazifa-topshirish bilan bog'liq) · TASDIQ-2146 §01 #01.18/#01.60
- **Dalil (kod):** `apps/api/src/cron/acting-revert.cron.ts:22-25` — real `@Cron('0 1 * * *')` → `cards.revertExpiredActing()`; `card.repository.ts:660` `revertExpiredActing()` implementatsiyasi. `card.service.ts:122-163` `assignEmployeeToCard` `isActing`/`actingSupplement`/`endedAt` qabul qiladi va i.o. uchun bitta-seat guard'ini ataylab o'tkazib yuboradi (131-qator: "D2 … does NOT consume the single substantive seat").
- **Bog'liqlik:** EP-ORG-061, EP-ORG-062, EP-ORG-124, EP-ORG-136
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (vertikal), Finance (i.o. ustamasi)
- **Xoch-havolalar:** `[Module-01] Item 68` · `EXTRACTION QISM C #01.18/#01.60`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-061 · I.o. davridagi oylik
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — O'z oyligi + i.o. ustamasi (% yoki summa).
- **Manba:** yangi · TASDIQ-2146 §01 #01.19/#01.61
- **Dalil (kod):** `card.repository.ts:357-363,488-506` — `listEmployees`/`listEmployeeCards`/`employeeSalaryTotal` i.o. biriktiruvining hissasini `acting_supplement` sifatida hisoblaydi (kartaning `max_salary` si emas) — formula real. `grep acting_supplement` `hr/payroll/*.ts` + `finance/**/*.ts` → yagona mos `finance/cashier-hub/drizzle-cashier-payroll.repo.ts` da, asosiy `payroll.service.ts` `closePeriod()` oqimida YO'Q.
- **Nima yetishmaydi:** i.o. ustamasi asosiy oylik-yopish yo'liga ulanmagan — formula faqat read-only `/by-employee/:id` endpointida yashaydi; ustama % qiymati egasi-DATA.
- **Bog'liqlik:** [Module-01] Item 46 (`closePeriod` uzilishi), EP-ORG-060
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll (ikki karta to'qnashuvi)
- **Xoch-havolalar:** `[Module-01] Item 69` · `[Module-01] Item 46` · `EXTRACTION QISM C #01.19/#01.61`
- **⚠️ ZIDDIYAT:** QISM C #01.61 (takror) "Ha — real hisob (`repository:267-268` acting→supplement)" vs #01.19 "Qisman — Payroll-ulanish tasdiqlanmadi" vs FULL-ITEM-LEVEL "formula real, `closePeriod` ulanmagan". Yechim: o'qish-formulasi = Ha, posting-ulanish = Yo'q → Qisman.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-062 · I.o. huquqlari ko'lami
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Kunlik operatsiyalar = ha, pul/kadr qarorlari = yo'q (yuqoriga eskalatsiya).
- **Manba:** yangi · TASDIQ-2146 §01 #01.20/#01.62
- **Dalil (kod):** `card.repository.ts:381` — `CASE WHEN COALESCE(ec.is_acting,false) THEN 50 WHEN ec.is_primary THEN 100 ELSE 70 END AS assignment_score` — `is_acting` kuzatiladi va fit-ballida pasaytiriladi. `grep -rn "is_acting" apps/api/src/common/guards/*.ts apps/api/src/common/decorators/*.ts` → **0 mos**.
- **Nima yetishmaydi:** hech bir RBAC guard/dekorator i.o. va asosiy egallovchini ajratmaydi — i.o. uchun pul/kadr amallarini bloklash va yuqoriga eskalatsiya qilish mexanizmi yo'q.
- **Bog'liqlik:** EP-ORG-023 (RBAC manbasi), EP-ORG-060
- **action:** APPROVE
- **⤳ Ta'sir:** RBAC, Coordination
- **Xoch-havolalar:** `[Module-01] Item 70` · `EXTRACTION QISM C #01.20/#01.62` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-063 · Kartani boshqa bo'limga ko'chirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Karta ko'chadi, butun tarix saqlanadi, yangi manager_id avtomatik bog'lanadi; adaptatsiya+ruxsat qayta.
- **Manba:** BARCHA_JAVOBLAR Q188 (transfer → lavozim+bo'lim+rahbar avto-yangilanadi) + KARTALAR-A Q41 · TASDIQ-2146 §01 #01.21/#01.63
- **Dalil (kod):** `card.repository.ts:91-118` `setCardManager()` — `WITH RECURSIVE descendants` bilan o'zi/avlodiga bog'lash rad etiladi, so'ng `UPDATE org_departments SET parent_id = ${managerId}` (102-qator); soft-delete (`is_active=false`/`current_state='archived'`) tarixni saqlaydi, hard-DELETE yo'q.
- **Nima yetishmaydi:** ko'chirishda adaptatsiya + RBAC qayta-berish kaskadi emit qilinmaydi (EP-ORG-041 bilan bir xil bo'shliq — `move()` `ORG_CASCADE_EVENT` chiqarmaydi, VR-ORG-I02).
- **Bog'liqlik:** EP-ORG-041, VR-ORG-I02, EP-ORG-108
- **action:** UPDATE
- **⤳ Ta'sir:** Coordination (vertikal), Audit-tarix, RBAC
- **Xoch-havolalar:** `[Module-01] Item 71` · `[Module-01] Item 8` · `EXTRACTION QISM C #01.21/#01.63`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-064 · Ikki kartani birlashtirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — Asosiy karta tanlanadi, ikkinchisining tarixi unga ko'chadi, ikkinchisi arxivlanadi.
- **Manba:** yangi · TASDIQ-2146 §01 #01.22/#01.64
- **Dalil (kod):** 2026-07-11 holati: `grep -rln "mergeCard|splitCard" apps/api/src/**/*.ts` → **0 mos** (butun backendda yo'q). **Δ:** `card.controller.ts:353-356` `POST :id/merge` → `card.service.ts:382-395` `mergeCards()` → `card.repository.ts` `mergeCards` (`pg_advisory_xact_lock` 82003, atomik): asosiy karta qoladi, ikkilamchining egallanishi + razryad-tarixi unga ko'chadi, ikkilamchi `merged_into_id → primary` bilan arxivlanadi; `primary === secondary` VALIDATION bilan rad etiladi (`1724a0ac`).
- **Nima yetishmaydi:** qaror hamon 🔵 OCHIQ — endpoint "Tavsiya A" bo'yicha qurilgan, egasining yakuniy imzosi kutilmoqda; ziddiyatli maydonlar (masalan ikki xil `razryad_level_id`) uchun birlashtirish semantikasi belgilanmagan.
- **Bog'liqlik:** EP-ORG-065 (bir xil operatsiya oilasi), EP-ORG-085 (arxiv yo'li qayta ishlatiladi)
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Payroll (oylik tarix)
- **Xoch-havolalar:** `[Module-01] Item 72` · `EXTRACTION QISM C #01.22/#01.64` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** `1724a0ac` — `mergeCards` repo+service+`POST :id/merge` qurildi (advisory-lock 82003). Qurilish holati Yo'q → Ha; qaror holati o'zgarmadi (🔵).

### EP-ORG-065 · Bitta kartani ikkiga bo'lish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — Yangi ikki karta ochiladi, eski arxivga o'tadi, havola bilan bog'lanadi.
- **Manba:** yangi · TASDIQ-2146 §01 #01.23/#01.65
- **Dalil (kod):** 2026-07-11 holati: Item 72 dagi bir xil grep (`mergeCard|splitCard`) → 0 mos, ya'ni split ham qurilmagan edi. **Δ:** `card.controller.ts:366` `POST :id/split` → `card.service.ts:404-411` `splitCard()` → repo `splitCard` (advisory-lock 82004): ikki yangi karta yaratiladi, ikkisi ham `split_from_id` orqali manbaga bog'lanadi, manba karta arxivlanadi; kod berilmasa `nextCodeForName()` (SB0107) avto-kod qo'yadi (`1724a0ac`).
- **Nima yetishmaydi:** manbadagi faol xodim-biriktiruvlari AVTOMATIK ko'chirilmaydi — qaysi yangi karta egallovchini meros olishi "Tavsiya A" da aytilmagan (ochiq semantik qaror); HR qo'lda qayta biriktiradi.
- **Bog'liqlik:** EP-ORG-064, EP-ORG-085
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Payroll
- **Xoch-havolalar:** `[Module-01] Item 72` *(taxminiy — bir xil grep splitCard'ni ham qamragan)* · `EXTRACTION QISM C #01.23/#01.65` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** `1724a0ac` — `splitCard` repo+service+`POST :id/split` qurildi (advisory-lock 82004, `split_from_id` havolasi). Qurilish holati Yo'q → Ha.

### EP-ORG-066 · Bir odam ko'p kartada — oylik to'qnashuvi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — Har karta uchun stavka ulushi (0.5+0.5=1.0), oyliklar yig'iladi, jami 1.0 dan oshmasin; oshsa → owner ruxsati bilan.
- **Manba:** yangi (KARTALAR-A Q4 oylik=yig'indi — nazorat qoidasi ochiq; EP-ORG-142 bilan bog'liq) · TASDIQ-2146 §01 #01.24/#01.66
- **Dalil (kod):** `card.repository.ts:281-346` — real `employeeActiveStakeSum()` (`employee_org_departments.stake_fraction` ni o'qiydi) + `checkStakeCap()` (izohda "EP-ORG-066/142") — aynan ≤1.0 chegara + `allowOverload` owner-override qoidasi, EPSILON-tolerantli taqqoslash va o'zbekcha rad-xabari bilan.
- **Nima yetishmaydi:** guard faqat application-layer (funksiyaning o'z izohi: "Pure-read… safe to call before the assign") — DB-daraja `CHECK` cheklovi tasdiqlanmadi; `allowOverload` ning "muddatli" (vaqtinchalik) qismi topilmadi.
- **Bog'liqlik:** EP-ORG-004, EP-ORG-142 (yig'ish formulasi), EP-ORG-094
- **action:** APPROVE
- **⤳ Ta'sir:** Finance/Payroll (jami nazorati)
- **Xoch-havolalar:** `[Module-01] Item 12` *(taxminiy)* · `EXTRACTION QISM C #01.24/#01.66`
- **⚠️ ZIDDIYAT:** QISM C #01.24/#01.66 (2026-06-27) "Qisman — rate/fraction ustuni yo'q, jami≤1.0 blok yo'q" vs FULL-ITEM-LEVEL (2026-07-11) "`stake_fraction` + `checkStakeCap` real (boshqa jadvalda: `employee_org_departments`, `employee_cards` emas)". Kod-dalil ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-067 · Audit-tarixda nima saqlanadi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — Har o'zgarish: maydon, eski qiymat, yangi qiymat, kim, qachon, sabab (to'liq audit).
- **Manba:** BARCHA_JAVOBLAR Q107 (to'liq versiya tarixi: kim/qachon/nima) · TASDIQ-2146 §01 #01.25/#01.67
- **Dalil (kod):** QISM C (2026-06-27): "Qisman — `listHistory` `audit_logs` ustidan; jonli `record_id='unknown'`, field-level before/after yo'q"; takror qator #01.67: "`razryad_history` + `audit_logs` bor; field-level yo'q, 0 qator".
- **Nima yetishmaydi:** maydon-darajali eski/yangi qiymat juftligi saqlanmaydi; `record_id` to'ldirilmagan → o'zgarishni kartaga ishonchli bog'lab bo'lmaydi.
- **Bog'liqlik:** EP-ORG-068 (sabab), EP-ORG-070 (immutability), EP-ORG-125 (versiyalash)
- **action:** EVENT
- **⤳ Ta'sir:** Xavfsizlik, Finance (oylik o'zgarish dalili)
- **Xoch-havolalar:** `EXTRACTION QISM C #01.25/#01.67`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-068 · O'zgarishga sabab majburiy-mi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — Pul/razryad o'zgarishida sabab majburiy, oddiy maydonlarda ixtiyoriy.
- **Manba:** BARCHA_JAVOBLAR Q77/Q187 (hujjat taqdiri + sabab majburiy) · TASDIQ-2146 §01 #01.26/#01.68
- **Dalil (kod):** QISM C (2026-06-27): "Qisman — `razryad_history.reason` / `razryad_requests.reason` BOR, lekin `CardUpdateSchema` da sabab majburiy emas; oylik-o'zgarish uchun reason-gate yo'q".
- **Nima yetishmaydi:** oylik/kompensatsiya maydonlari o'zgarganda sabab talab qiluvchi darvoza yo'q — faqat razryad tarafida bor.
- **Bog'liqlik:** EP-ORG-067, EP-ORG-024 (oylik maydonlari)
- **action:** APPROVE
- **⤳ Ta'sir:** Xavfsizlik, HR
- **Xoch-havolalar:** `EXTRACTION QISM C #01.26/#01.68`
- **Δ 2026-07-11→08-07:** `4deb21d2` — `org-structure.controller.ts` da reason-gate faqat `PATCH` uchun cheklandi (karta YARATISHda 422 xatosi tuzatildi). Bu sabab-darvozasining qamrovini toraytirdi, kengaytirmadi.

### EP-ORG-069 · Tarixni ko'rish huquqi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — Owner + HR + o'sha vertikaldagi yuqori boshliq (cheklangan). Audit-log esa faqat Super Admin.
- **Manba:** BARCHA_JAVOBLAR Q144 (audit-log faqat Super Admin) + Q120 · TASDIQ-2146 §01 #01.27/#01.69
- **Dalil (kod):** QISM C (2026-06-27): "Qisman — `card.controller.ts:198` `@Roles` keng; vertikal (row-level) filtr yo'q → har manager hammani ko'radi"; takror #01.69: "`rbac_tier` bor; vertikal row-level yo'q".
- **Nima yetishmaydi:** "o'sha vertikaldagi yuqori boshliq" row-level cheklovi yo'q; audit-log Super-Admin-only ajratilishi tasdiqlanmagan.
- **Bog'liqlik:** EP-ORG-042 (maxfiylik), EP-ORG-103 (`rbac_tier` 143/143 NULL)
- **action:** READ
- **⤳ Ta'sir:** Xavfsizlik (ruxsatlar), HR
- **Xoch-havolalar:** `EXTRACTION QISM C #01.27/#01.69`
- **Δ 2026-07-11→08-07:** `d9210dfc` — kompensatsiya maydonlari uchun field-level RBAC qo'shildi (EP-ORG-042); tarix/audit ko'rish uchun vertikal row-level filtr HAMON yo'q.

### EP-ORG-070 · Audit yozuvini o'chirib bo'lmasligi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — Faqat qo'shiladi, hech kim o'chira/tahrirlay olmaydi (immutable).
- **Manba:** BARCHA_JAVOBLAR Q83 (tasdiqlangan hujjat immutable) + Q173 (abadiy) · TASDIQ-2146 §01 #01.28/#01.70
- **Dalil (kod):** QISM C (2026-06-27): "Qisman — application-layer append-only naqsh bor; DB-daraja trigger / `REVOKE UPDATE,DELETE` tasdiqlanmadi".
- **Nima yetishmaydi:** immutability faqat kod-intizomi bilan ta'minlangan — DB-daraja kafolat yo'q.
- **Bog'liqlik:** EP-ORG-067, EP-ORG-085 (soft-delete)
- **action:** APPROVE
- **⤳ Ta'sir:** Xavfsizlik
- **Xoch-havolalar:** `EXTRACTION QISM C #01.28/#01.70`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-071 · Bo'sh karta holati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** — (FULL-ITEM-LEVEL da mos item topilmadi)
- **Talab:** A — Bo'sh karta "Vakansiya" holatida + ochilgan sana + necha kun bo'sh.
- **Manba:** KARTALAR-A (Q5/Q38 vakant) + BARCHA_JAVOBLAR Q94 (bo'sh lavozim org-chartda) · TASDIQ-2146 §01 #01.29/#01.71
- **Dalil (kod):** QISM C (2026-06-27): "Ha — `card.controller.ts:278` `PATCH :id/vacant`, `card.repository.ts` `aging_days`, `current_state` 5-holat". FULL-ITEM-LEVEL Item #83/#80 shu mexanizmni bilvosita tasdiqlaydi (`setVacant()` + `aging_days`/`aging_bucket` CASE).
- **Nima yetishmaydi:** jonli `current_state` 143 qatordan faqat 1 tasida to'lgan (Item 32) — ya'ni vakansiya holati amalda deyarli ishlatilmayapti.
- **Bog'liqlik:** EP-ORG-072 (aging), EP-ORG-083 (holatlar), EP-ORG-038 (recruitment)
- **action:** CREATE
- **⤳ Ta'sir:** HR (rekruting), Dashboard
- **Xoch-havolalar:** `EXTRACTION QISM C #01.29/#01.71` · `[Module-01] Item 32` *(taxminiy — holat-mashinasi data-holati)*
- **Δ 2026-07-11→08-07:** —

### EP-ORG-072 · Vakansiya aging bosqichlari
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 0-14 kun yashil, 15-45 sariq, 45+ qizil + ogohlantirish; chegaralar yagona.
- **Manba:** yangi · TASDIQ-2146 §01 #01.30/#01.72
- **Dalil (kod):** `card.repository.ts:404-416` `listVacancies()` — `aging_days` / `aging_bucket` CASE ifodasi real (rang bosqichlari qotirilgan). `apps/api/src/cron/vacancy-deadline.cron.ts` — real `@Cron('0 9 * * *')`, `closing_date` dan 3 kun oldin Telegram eslatmasi.
- **Nima yetishmaydi:** `aging_bucket` faqat o'qish-vaqtidagi CASE — rang o'zgarganda hodisa (`VacancyAgingChangedEvent`) chiqmaydi; "5+ qizil → soatlik digest" yo'q (grep → 0); chegaralar kodda qotirilgan, `business_settings` orqali sozlanmaydi.
- **Bog'liqlik:** EP-ORG-071, EP-ORG-074 (SLA)
- **action:** CRON
- **⤳ Ta'sir:** HR, Dashboard
- **Xoch-havolalar:** `[Module-01] Item 11` *(taxminiy)* · `EXTRACTION QISM C #01.30/#01.72`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-073 · Vakansiya muhimligi (prioritet)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 3 daraja (kritik/o'rta/past).
- **Manba:** yangi · TASDIQ-2146 §01 #01.31/#01.73
- **Dalil (kod):** `card.repository.ts:408` `listVacancies()` `vacancies.priority` ni SELECT qiladi (mexanizm bor); jonli `SELECT count(*) FROM vacancies` → **0 qator**.
- **Nima yetishmaydi:** 3-enum qiymatlarining (kritik/o'rta/past) haqiqatda yozilishini tasdiqlaydigan data yo'q — vakansiya yaratish oqimi jonli emas.
- **Bog'liqlik:** EP-ORG-074 (SLA shu ustunga tayanadi), EP-ORG-038
- **action:** CREATE
- **⤳ Ta'sir:** HR (recruitment tartibi)
- **Xoch-havolalar:** `[Module-01] Item #73` · `EXTRACTION QISM C #01.31/#01.73`
- **⚠️ ZIDDIYAT:** QISM C ning o'z ichida: #01.31 "Ha — `vacancies.priority` jonli mavjud" vs #01.73 (takror) "Qisman — enum+data tasdiqlanmadi" (Step-2b da rasman qayd etilgan). Yechim: ustun = bor, data = 0 → Qisman.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-074 · Vakansiya yopilish muddati maqsadi (SLA)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Muhimlikka qarab maqsadli muddat (kritik 14, o'rta 30, past 60 kun). (BARCHA Q4: oddiy 15 / murakkab 25 / top 40 — o'zgaruvchan.)
- **Manba:** yangi (BARCHA_JAVOBLAR Q4 — muddatlar o'zgarishi mumkin) · TASDIQ-2146 §01 #01.32/#01.74
- **Dalil (kod):** `apps/api/src/cron/vacancy-deadline.cron.ts` (to'liq o'qildi) — real `@Cron('0 9 * * *')`, `vacancies.closing_date` dan 3 kun oldin rahbarga Telegram eslatma. Bu QO'LDA qo'yilgan sanaga tayanadi.
- **Nima yetishmaydi:** `priority` → SLA-kun (kritik 14 / o'rta 30 / past 60) avto-xaritalash mantiqi faylda umuman yo'q; `sla_days` ustuni yo'q.
- **Bog'liqlik:** EP-ORG-073 (priority data), EP-ORG-072
- **action:** CRON
- **⤳ Ta'sir:** HR (Time-to-Fill KPI)
- **Xoch-havolalar:** `[Module-01] Item #74` · `EXTRACTION QISM C #01.32/#01.74`
- **⚠️ ZIDDIYAT:** SLA raqamlari ikki xil: KARTALAR-v2 "14/30/60 kun" vs BARCHA_JAVOBLAR Q4 "15/25/40 kun". Kodda ikkalasi ham yo'q — egasi yakuniy qiymatni `business_settings` orqali belgilashi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-075 · Kartalarni ommaviy import
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Excel shabloni bilan import + xato satrlar ajratib ko'rsatiladi.
- **Manba:** yangi · TASDIQ-2146 §01 #01.33/#01.75
- **Dalil (kod):** `card.controller.ts` to'liq o'qildi (331 qator) — `@Post/@Patch/@Delete` handlerlari ichida import route YO'Q (faqat `create`/`update`/`assign`/`freeze`/…). `org-structure.controller.ts:265` `POST nodes/import` mavjud, lekin u boshqa entity — org-NODE importi, karta-maxsus emas.
- **Nima yetishmaydi:** karta-maxsus `POST /org-structure/cards/import` endpointi; Excel ustun → `CardInput` kalit xaritasi belgilanmagan (egasi-qaror).
- **Bog'liqlik:** EP-ORG-076, EP-ORG-078 (`excel_import_batches` shu endpointsiz yozilmaydi)
- **action:** CREATE
- **⤳ Ta'sir:** HR (dastlabki to'ldirish)
- **Xoch-havolalar:** `[Module-01] Item #75` · `EXTRACTION QISM C #01.33/#01.75` · `QISM C Step-3 (ochiq savol)`
- **⚠️ ZIDDIYAT:** QISM C ning o'z ichida: #01.33 "Qisman — org-NODE import bor" vs #01.75 (takror) "Yo'q — karta import umuman yo'q" (Step-2b). Yechim: org-NODE import ≠ karta import → karta uchun Yo'q.
- **Δ 2026-07-11→08-07:** `97df0a4f` — FE dan "Import qilish" tugmasi + `ImportNodesDialog` butunlay olib tashlandi (org-NODE importi endi UI'da ko'rinmaydi; BE `POST nodes/import` saqlanib qolgan). Karta-import hamon yo'q.

### EP-ORG-076 · Import xatolarini boshqarish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — To'g'ri satrlar yuklanadi, xato satrlar ro'yxat bilan qaytariladi (tuzatib qayta yuklash).
- **Manba:** yangi · TASDIQ-2146 §01 #01.34/#01.76
- **Dalil (kod):** karta-import endpointi yo'qligi sababli (Item #75) per-satr xato boshqaruvini ilib qo'yadigan joy ham yo'q — `card.controller.ts` ning bir xil to'liq o'qilishi bilan tasdiqlangan.
- **Nima yetishmaydi:** hamma narsa EP-ORG-075 ga bog'liq; org-NODE import tarafida partial-commit naqshi allaqachon ishlaydi va qayta ishlatilishi mumkin.
- **Bog'liqlik:** EP-ORG-075 (avval qurilishi shart)
- **action:** CREATE
- **⤳ Ta'sir:** HR
- **Xoch-havolalar:** `[Module-01] Item #76` · `EXTRACTION QISM C #01.34/#01.76` · `QISM C Step-3 (ochiq savol)`
- **⚠️ ZIDDIYAT:** QISM C #01.34 "Ha — `controller.ts:207-215` partial-commit + xato-ro'yxat REAL" vs #01.76 (takror) "Yo'q — karta import umuman yo'q" (Step-2b). Yechim: partial-commit mavjud, lekin org-NODE importida — karta uchun Yo'q.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-077 · Karta eksport (zaxira/hisobot)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Tanlangan ustunlar bilan Excel + PDF.
- **Manba:** BARCHA_JAVOBLAR Org-Q10 (PDF + Excel eksport) · TASDIQ-2146 §01 #01.35/#01.77
- **Dalil (kod):** `org-export.service.ts` (to'liq o'qildi, 271 qator) — `exportExcel()` real ExcelJS workbook (stilli sarlavha, daraja bo'yicha rang, xulosa varag'i); `exportPdf()` real ko'p-sahifali `pdf-lib` hujjati (`drawRow`, sahifa-uzilish mantiqi).
- **Nima yetishmaydi:** "tanlangan ustunlar" (ustun tanlash) qismi qisman — QISM C #01.35 izohi: "Ustun-tanlash qisman".
- **Bog'liqlik:** EP-ORG-138 (rasmiy PDF — boshqa shablon)
- **action:** EXPORT
- **⤳ Ta'sir:** HR, Director
- **Xoch-havolalar:** `[Module-01] Item #77` · `EXTRACTION QISM C #01.35/#01.77`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-078 · Import audit izi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Import partiyasi alohida yoziladi (kim, qachon, fayl, satrlar soni).
- **Manba:** BARCHA_JAVOBLAR Q107/Q144 (to'liq audit-log) · TASDIQ-2146 §01 #01.36/#01.78
- **Dalil (kod):** `SELECT count(*) FROM excel_import_batches` → so'rov muvaffaqiyatli, **0 qator** (sxema jonli mavjud); `card.controller.ts` / `card.service.ts` / `card.repository.ts` da bu jadvalga hech qanday murojaat topilmadi.
- **Nima yetishmaydi:** partiya-audit jadvali erishib bo'lmaydigan holatda — unga yozadigan karta-import endpointi (EP-ORG-075) yo'q.
- **Bog'liqlik:** EP-ORG-075
- **action:** EVENT
- **⤳ Ta'sir:** Audit-tarix
- **Xoch-havolalar:** `[Module-01] Item #78` · `EXTRACTION QISM C #01.36/#01.78`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-079 · Filtr maydonlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Otdeleniye/bo'lim + razryad + holat + lavozim turi + oylik oralig'i (to'liq).
- **Manba:** BARCHA_JAVOBLAR Q141 (to'liq qidiruv+filtr, profil maydonlari ham) · TASDIQ-2146 §01 #01.37/#01.79
- **Dalil (kod):** `card.controller.ts:88-98` `list()` imzosi faqat `@Query('departmentId')` va `@Query('status')` qabul qiladi.
- **Nima yetishmaydi:** 5 filtr o'lchamidan 3 tasi (razryad, lavozim turi, oylik oralig'i) endpointda umuman yo'q — ustunlar bor, query-param yo'q.
- **Bog'liqlik:** EP-ORG-080, EP-ORG-082
- **action:** READ
- **⤳ Ta'sir:** Org, HR
- **Xoch-havolalar:** `[Module-01] Item #79` · `EXTRACTION QISM C #01.37/#01.79`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-080 · "Bo'sh kartalar" tezkor filtri
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Tayyor filtr + aging bo'yicha saralash.
- **Manba:** yangi · TASDIQ-2146 §01 #01.38/#01.80
- **Dalil (kod):** `card.controller.ts` `list()` `status=vacant` ni umumiy filtr-qiymat sifatida qabul qiladi (maxsus tezkor-route yo'q); `card.repository.ts:404-416` `listVacancies()` `aging_days`/`aging_bucket` ni CASE bilan hisoblaydi — aging mantiqi real, lekin bitta kartaning vakansiyalariga tegishli, global vakant-kartalar ro'yxati emas. **Δ:** `VacantPositionsDialog.tsx` (yangi) — "Vakant lavozimlar" tugmasi endi toast emas, real jadval ochadi (id, nom, "Ko'rish" → o'sha karta sahifasiga navigatsiya), `OrgStructureHierarchy.tsx` `notifyMutation.onSuccess` shuni ochadi (`6c6840b8`).
- **Nima yetishmaydi:** ro'yxat aging bo'yicha SARALANMAYDI (dialog `vacantNodes` javobini o'z tartibida ko'rsatadi); global aging-bucket bo'yicha filtr/sort hamon yo'q.
- **Bog'liqlik:** EP-ORG-071, EP-ORG-072, EP-ORG-079
- **action:** READ
- **⤳ Ta'sir:** HR, Dashboard
- **Xoch-havolalar:** `[Module-01] Item #80` · `EXTRACTION QISM C #01.38/#01.80`
- **Δ 2026-07-11→08-07:** `6c6840b8` — "Vakant lavozimlar" endi haqiqiy ro'yxat-ko'rinishi (`VacantPositionsDialog`); `97df0a4f` — xato holatida umumiy "Xatolik" o'rniga real backend xabari ko'rsatiladi.

### EP-ORG-081 · Xodim ↔ karta mosligi bo'yicha qidiruv
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — AI moslik balli bilan ranjlangan ro'yxat (razryad/malaka/ЦКП tarixiga qarab).
- **Manba:** KARTALAR-A (Q30/Q32) + BARCHA_JAVOBLAR Q135 (vacancy match) · TASDIQ-2146 §01 #01.39/#01.81
- **Dalil (kod):** `card.service.ts:90-105` `computeCardFit()` — `fit = Math.round(0.5*assignment_score + 0.5*definition_score)`, ya'ni QOTIRILGAN determenistik formula, AI-model chaqiruvi yo'q. `ai-fit.service.ts` `AiFitService` alohida, bu yo'lda ishlatilmaydi.
- **Nima yetishmaydi:** vizyon "AI moslik balli bilan ranjlangan ro'yxat" so'raydi — hozirgisi AI emas, arifmetik; razryad-gap va ЦКП-tarix hisobga olinmaydi.
- **Bog'liqlik:** EP-ORG-030, EP-ORG-131, EP-ORG-132, VR-ORG-I12 (AI kalitlar)
- **action:** AI
- **⤳ Ta'sir:** AI integratsiya, HR
- **Xoch-havolalar:** `[Module-01] Item #81` · `[Module-01] Item 16` · `EXTRACTION QISM C #01.39/#01.81`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-082 · Saqlangan filtr/ko'rinishlar
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Shaxsiy saqlangan ko'rinishlar ("Mening bo'limim bo'sh kartalari").
- **Manba:** yangi · TASDIQ-2146 §01 #01.40/#01.82
- **Dalil (kod):** `Grep "saved_filter|savedFilter|saved_view"` `apps/api/src` bo'ylab → fayl topilmadi; `SELECT count(*) FROM saved_filters` → jadval mavjud, **0 qator**, lekin hech qanday kod unga murojaat qilmaydi (orphan jadval).
- **Nima yetishmaydi:** `GET/POST /org-structure/cards/saved-filters` endpointi — sof qurilish ishi, egasi-qaror talab qilmaydi (jadval allaqachon tayyor).
- **Bog'liqlik:** EP-ORG-079, EP-ORG-080
- **action:** CREATE
- **⤳ Ta'sir:** Org-UI
- **Xoch-havolalar:** `[Module-01] Item #82` · `EXTRACTION QISM C #01.40/#01.82` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-083 · Karta holat qiymatlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — 5 holat: Faol(band), Vakansiya, I.o., Muzlatilgan, Arxiv (EP-ORG-141 onboarding bosqichlari bilan kengaytiriladi).
- **Manba:** KARTALAR-A (Q5/Q6/Q22/Q38 — holatlar vizyondan) · TASDIQ-2146 §01 #01.41/#01.83
- **Dalil (kod):** `card.controller.ts:35` `CardCreateSchema` — `status: z.enum(['active','frozen','vacant','archived','io'])`; `card.repository.ts` da alohida `freeze()`, `thaw()`, `setVacant()`, `restore()`, `softDelete()` o'tishlari 5 holatni to'liq qoplaydi; `card.service.ts:171-227` har o'tish uchun 404/409 guard beradi.
- **Nima yetishmaydi:** jonli `current_state` 143 qatordan faqat 1 tasida to'lgan (Item 32) — mexanizm real, data deyarli bo'sh.
- **Bog'liqlik:** EP-ORG-141 (onboarding bosqichlari qo'shilishi kerak), EP-ORG-084/085/086
- **action:** CREATE
- **⤳ Ta'sir:** Reports, Filtr
- **Xoch-havolalar:** `[Module-01] Item #83` · `[Module-01] Item 32` · `EXTRACTION QISM C #01.41/#01.83`
- **Δ 2026-07-11→08-07:** `1724a0ac` — har holat-o'tishida `CardStatusChangedEvent` emitlanadi (`card-lifecycle.events.ts`), oldin holat jimgina o'zgarardi.

### EP-ORG-084 · Kartani muzlatish (vaqtincha to'xtatish)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — "Muzlatilgan" holati + sabab + muddat.
- **Manba:** KARTALAR-A (Q6 — profil muzlaydi) · TASDIQ-2146 §01 #01.42/#01.84
- **Dalil (kod):** `card.controller.ts:69-72` `CardFreezeSchema` (sabab min 3 belgi, ixtiyoriy `until`) → `PATCH :id/freeze` (262-qator); `card.repository.ts:541-554` `freeze()` `frozen_at` / `freeze_reason` / `freeze_until` ni yozadi — uchala ustun ham `information_schema.columns` bilan jonli tasdiqlangan.
- **Bog'liqlik:** EP-ORG-006 (xodim ketganda freeze), EP-ORG-092 (attestatsiyadan o'tmasa freeze)
- **action:** UPDATE
- **⤳ Ta'sir:** Payroll (to'xtaydi), HR
- **Xoch-havolalar:** `[Module-01] Item #84` · `EXTRACTION QISM C #01.42/#01.84`
- **Δ 2026-07-11→08-07:** `1724a0ac` — muzlatilgan karta uchun `payroll.service.ts:507-539` fail-closed oylik-gate qo'shildi (avval muzlatilgan kartaga ham oylik hisoblanardi).

### EP-ORG-085 · Karta o'chirish vs arxivlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Hech qachon to'liq o'chirilmaydi, faqat arxivlanadi (tarix saqlanadi).
- **Manba:** KARTALAR-A (Q5) + BARCHA_JAVOBLAR Q83/Q173 (immutable/abadiy) · TASDIQ-2146 §01 #01.43/#01.85
- **Dalil (kod):** `card.repository.ts:257-264` `softDelete()` — `UPDATE org_departments SET is_active=false, current_state='archived'`, hech qachon hard `DELETE` emas; `card.controller.ts:326-329` `DELETE :id` → `service.softDelete()`.
- **Nima yetishmaydi:** `org_departments` ga qaragan 40+ FK ning ON-DELETE strategiyasi aralash (`SET NULL`/`CASCADE`/`NO ACTION`); vizyon Payroll uchun `RESTRICT` so'raydi, `employee_cards` esa `NO ACTION` (Item 48). Soft-delete tufayli bu xatti-harakat amalda hech qachon ishga tushmasligi mumkin.
- **Bog'liqlik:** EP-ORG-005, EP-ORG-086, [Module-01] Item 48
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Payroll
- **Xoch-havolalar:** `[Module-01] Item #85` · `[Module-01] Item 48` · `EXTRACTION QISM C #01.43/#01.85`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-086 · Arxiv kartani tiklash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Arxivdan tiklash mumkin, eski tarix bilan.
- **Manba:** KARTALAR-A (Q6 — qaytsa restore) · TASDIQ-2146 §01 #01.44/#01.86
- **Dalil (kod):** `card.repository.ts:629-642` `restore()` — `is_active=true, current_state='active'`, freeze-metama'lumotini tozalaydi, faqat `is_active=false OR current_state='archived'` qatorlar uchun ishlaydi (guard); `card.controller.ts:290-293` `PATCH :id/restore`.
- **Bog'liqlik:** EP-ORG-005, EP-ORG-085
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Payroll
- **Xoch-havolalar:** `[Module-01] Item #86` · `EXTRACTION QISM C #01.44/#01.86`
- **Δ 2026-07-11→08-07:** `1724a0ac` — tiklashda ham `CardStatusChangedEvent` emitlanadi.

### EP-ORG-087 · Kartadagi "talablar" ro'yxati
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Strukturali ro'yxat (har talab: tur, daraja, majburiy/ixtiyoriy) — AI o'qiy oladi.
- **Manba:** yangi (EP-ORG-106 kitob-grounded malaka talablari bilan bog'liq) · TASDIQ-2146 §01 #01.45/#01.87
- **Dalil (kod):** `card_required_knowledge` ustunlari: `card_id, category, course_id, created_at, created_by, deleted_at, description, id, importance, is_active, knowledge_name, knowledge_name_ru, sort_order, updated_at`. `SELECT count(*) FROM card_required_knowledge` → **0 qator**.
- **Nima yetishmaydi:** `category` + `importance` juftligi "tur/daraja" ni taqriban qoplaydi, lekin alohida "majburiy/ixtiyoriy" boolean YO'Q; jonli data 0.
- **Bog'liqlik:** EP-ORG-106 (bir xil jadval), EP-ORG-122, EP-ORG-131
- **action:** CREATE
- **⤳ Ta'sir:** AI (moslik bahosi)
- **Xoch-havolalar:** `[Module-01] Item #87` · `EXTRACTION QISM C #01.45/#01.87`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-088 · Darslik kartaga bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Darslik kartaga bog'lanadi; xodim kelsa darslikni ko'radi.
- **Manba:** KARTALAR-A (Q28) + BARCHA_JAVOBLAR Q32/Q71 · TASDIQ-2146 §01 #01.46/#01.88
- **Dalil (kod):** `card_required_knowledge.course_id` ustuni jonli tasdiqlangan; `card.service.ts:147-160` biriktirishdan keyin `CARD_EMPLOYEE_ASSIGNED_EVENT` emitlaydi, uni LMS `card-employee-assigned.handler` iste'mol qilib xodimni KARTAning kurslariga avto-yozadi (xodimning shaxsiy kurs ro'yxatiga emas).
- **Nima yetishmaydi:** `card_required_knowledge` jonli 0 qator — bog'lanadigan kurs yo'q (egasi/HR DATA).
- **Bog'liqlik:** EP-ORG-028 (bir xil qaror), EP-ORG-122, EP-ORG-027 (LMS gate)
- **action:** CREATE
- **⤳ Ta'sir:** HR/LMS, AI
- **Xoch-havolalar:** `[Module-01] Item #88` · `EXTRACTION QISM C #01.46/#01.88`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-089 · Kartaga biriktiriladigan hujjatlar
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Yo'riqnoma + xavfsizlik + ЦКП ta'rifi + ixtiyoriy fayllar (to'liq virtual papka).
- **Manba:** BARCHA_JAVOBLAR Q32 (virtual papka: hujjat/video/test) + Q104 · TASDIQ-2146 §01 #01.47/#01.89
- **Dalil (kod):** `card-folder.repository.ts` (to'liq o'qildi) — 6 erkin-matn bo'limi (`vazifa, javobgarlik, gsd, reglament, jarayon, talim`); `card_folders` jadvalida fayl/ilova ustuni yo'q, `Grep "file.?attach|attachment|fayl"` `card-folder.controller.ts` bo'yicha → 0 mos. **Δ:** `FolderTab.tsx` (org-node "Papka" bo'limi) endi haqiqiy fayl yuklaydi — `PUT /api/storage/upload?key=org-folder/{nodeId}/…` va natijaviy URL `POST /api/org-structure/nodes/:id/folder` ga yoziladi (`c82e6366`).
- **Nima yetishmaydi:** fayl-ilova `position_folder` (org-node papkasi) tarafida qurildi — `card_folders` ning 6 matn-bo'limi hamon fayl qabul qilmaydi; ikki papka-modeli birlashtirilmagan.
- **Bog'liqlik:** EP-ORG-095 (12 bo'lim), EP-ORG-104 (konteyner), EP-ORG-007
- **action:** CREATE
- **⤳ Ta'sir:** LMS, HR
- **Xoch-havolalar:** `[Module-01] Item #89` · `EXTRACTION QISM C #01.47/#01.89`
- **⚠️ ZIDDIYAT:** ikki parallel "papka" modeli jonli: `card_folders` (6 matn-bo'lim, 0 qator) va `position_folder` / `nodes/:id/folder` (element-ro'yxat, fayl yuklashli). Qaysi biri kanonik ekani hech qayerda hal qilinmagan.
- **Δ 2026-07-11→08-07:** `c82e6366` — karta papkasiga haqiqiy fayl yuklash (`/api/storage/upload` orqali) qo'shildi; oldin faqat URL matn kiritish mumkin edi.

### EP-ORG-090 · Kerakli jihozlar/uskuna modeli
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — "Kerakli jihozlar" ro'yxati + aktivlar moduliga bog'lanadi (hozir bu model YO'Q edi).
- **Manba:** BARCHA_JAVOBLAR Q56/Q183 (ish joyi ta'minlash + inventar xodimga) · TASDIQ-2146 §01 #01.48/#01.90
- **Dalil (kod):** 2026-07-11 holati: `SELECT to_regclass('card_equipment')` → `null` (jadval yo'q). **Δ:** `card.controller.ts:159-190` — `GET/POST/DELETE :id/equipment`; `card.repository.ts:958-995` — `org_departments.required_equipment` (jsonb massiv) ustida 3 ta atomik operatsiya (qo'shish idempotent: jsonb `?` operatori dublikatni o'tkazib yuboradi); migratsiya `org-card-required-equipment-2026-07-13.sql`; FE `CardDetailDialog.tsx` da "Jihozlar" tabi (`fc23166b`, izohda `APPROVED: owner schema-approval 2026-07-13`).
- **Nima yetishmaydi:** jihozlar oddiy nom-satrlari sifatida saqlanadi — aktivlar/ombor moduliga FK bilan bog'lanish YO'Q (vizyonning ikkinchi yarmi); qaysi modul kanonik aktiv-jadval egasi ekani hamon hal qilinmagan.
- **Bog'liqlik:** EP-ORG-107 (aynan bir xil talab), Ombor/Aktivlar moduli
- **action:** CREATE
- **⤳ Ta'sir:** Aktivlar/Ombor moduli, HR onboarding
- **Xoch-havolalar:** `[Module-01] Item #90` · `[Module-01] Item #107` · `EXTRACTION QISM C #01.48/#01.90/#01.107` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** `fc23166b` — `org_departments.required_equipment` (jsonb) + list/add/remove endpointlari + FE "Jihozlar" tabi qurildi. Qurilish holati Yo'q → Ha (aktiv-modulga bog'lanish bundan mustasno).

### EP-ORG-091 · Razryad o'sish yo'li (karyera)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Har razryad uchun "keyingi razryad + shart (imtihon/tajriba/ЦКП)" — aniq karyera yo'li.
- **Manba:** BARCHA_JAVOBLAR Q92/Q93 (career path: xodim ko'radi + bo'lim narvoni) · TASDIQ-2146 §01 #01.91
- **Dalil (kod):** `razryad.repository.ts` `RazryadInput`/`RazryadSettingsInput` — `min_months`, `exam_pass_threshold`, `exam_type` ustunlari bor; jonli `SELECT id, level, name, exam_pass_threshold, max_retakes, min_months FROM razryad_levels ORDER BY level` → 6 qator, `min_months=0` (hammasi), `exam_pass_threshold`/`max_retakes` NULL.
- **Nima yetishmaydi:** `next_level_id` ustuni umuman YO'Q — "keyingi razryad" `exam-passed-razryad.listener.ts:80` `nextRazryadIdForCard()` da runtime'da `level+1` qidiruvi bilan chiqariladi, saqlangan FK/shart tuzilmasi emas; shart-qiymatlari (chegara/muddat) seed qilinmagan.
- **Bog'liqlik:** EP-ORG-010, EP-ORG-055, EP-ORG-056, VR-ORG-I09
- **action:** CREATE
- **⤳ Ta'sir:** HR (rivojlanish), Payroll (o'sish→oylik)
- **Xoch-havolalar:** `[Module-01] Item #91` · `EXTRACTION QISM C #01.91`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-092 · Razryad muddatli qayta tasdiqlash (attestatsiya)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Xavfli/texnik kartalarda davriy attestatsiya (har 2 yil); o'tmasa → muzlatib qayta imtihon.
- **Manba:** yangi · TASDIQ-2146 §01 #01.92
- **Dalil (kod):** `org_departments.next_attestation_date` ustuni jonli tasdiqlangan; `SELECT count(*) FROM org_departments WHERE next_attestation_date IS NOT NULL` → **0**; bu ustunga murojaat qiladigan cron/listener org-structure modulida topilmadi (faqat qo'lda `freeze()`/`thaw()` bor, attestatsiya-triggerli avto-freeze yo'q).
- **Nima yetishmaydi:** "xavfli/texnik" karta tegi (HR master-data) yo'q; 2-yillik cron yo'q; o'tmaganda avto-muzlatish yo'q; sana 0/143 to'lgan.
- **Bog'liqlik:** EP-ORG-084 (freeze mexanizmi qayta ishlatiladi), EP-ORG-047 (sertifikat muddati), EP-ORG-137
- **action:** CRON
- **⤳ Ta'sir:** Razryad, LMS, Xavfsizlik
- **Xoch-havolalar:** `[Module-01] Item #92` · `EXTRACTION QISM C #01.92`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-093 · Karta egasi tayinlanish tasdig'i (past moslik)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Past moslikda ogohlantiradi + sabab so'raydi, lekin bloklamaydi (owner qaror qiladi).
- **Manba:** yangi (KARTALAR-A Q30 moslik bahosi — blok/ogoh chegarasi ochiq) · TASDIQ-2146 §01 #01.93
- **Dalil (kod):** `card.controller.ts:110-113` `GET :id/can-assign` va `:156-161` `GET :id/fit` — read-only moslik/bandlik signallari mavjud; `card.service.ts:122-163` `assignEmployeeToCard()` esa faqat EP-ORG-002 seat-guard'ini enforce qiladi (band bo'lsa `CONFLICT`) — fit-ballini HECH QACHON o'qimaydi, past moslikda ogohlantirmaydi va sabab so'ramaydi.
- **Nima yetishmaydi:** "past moslik" chegarasi (foiz) belgilanmagan (egasi-DATA); warn + sabab-so'rash oqimi biriktirish yo'liga ulanmagan.
- **Bog'liqlik:** EP-ORG-081 (fit manbasi), EP-ORG-131, EP-ORG-002
- **action:** APPROVE
- **⤳ Ta'sir:** AI (moslik), HR, Payroll
- **Xoch-havolalar:** `[Module-01] Item #93` · `EXTRACTION QISM C #01.93`
- **Δ 2026-07-11→08-07:** `1724a0ac` — biriktirish `assignEmployeeGuarded` (advisory-lock 82002) ga o'tdi; guard hamon faqat bandlikni tekshiradi, moslikni emas.

### EP-ORG-094 · Bir kartada bir vaqtda nechta odam (smena)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Kartada "stavka soni" (masalan 3 stavka), har stavkaga 1 xodim; tungi smena ustamasi %.
- **Manba:** yangi (BARCHA Q171 bo'lim>lavozim>smena — model ochiq) · TASDIQ-2146 §01 #01.94
- **Dalil (kod):** `employee_cards` M:N bog'lanishi va `org_departments.work_schedule` ustuni mavjud; `SELECT count(*) FROM org_departments WHERE work_schedule IS NOT NULL` → **0**; `Grep "tungi|night_shift|nightShift"` `apps/api/src` bo'yicha → faqat aloqasiz HR `overtime-calculator.service.ts` / POS-anomaliya moslari, kartaga bog'liq hech narsa yo'q.
- **Nima yetishmaydi:** "stavka soni" (seats/headcount) ustuni YO'Q; tungi smena ustamasi % yo'q.
- **Bog'liqlik:** EP-ORG-002 (1 seat) bilan ZID, EP-ORG-066, EP-ORG-119
- **action:** CREATE
- **⤳ Ta'sir:** HR (smena jadvali), Payroll (stavka × xodim)
- **Xoch-havolalar:** `[Module-01] Item #94` · `EXTRACTION QISM C #01.94`
- **⚠️ ZIDDIYAT:** EP-ORG-094 "kartada 3 stavka × 1 xodim" vs EP-ORG-002 "1 karta = 1 seat = 1 xodim" (atomik guard qurilgan). I4 (2026-06-25) buni ochiq ziddiyat deb belgilagan; egasi chegarani aniqlashi kerak.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-095 · Karta = 12 bo'limli zavod yo'riqnoma shabloni
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — 12 majburiy bo'lim, to'la to'ldirilmasa "tugallanmagan" (zavod hujjatiga 100% mos). 6-bo'lim vizyoni (EP-ORG-007) zavod 12 bo'limiga kengaytiriladi.
- **Manba:** KARTALAR-A (Q7) + BARCHA_JAVOBLAR Q32/Q54 (yagona standart papka shabloni) · TASDIQ-2146 §01 #01.95
- **Dalil (kod):** `card-folder.repository.ts` — sxemada aynan **6 bo'lim** (`vazifa, javobgarlik, gsd, reglament, jarayon, talim`), 12 emas; `SELECT count(*) FROM card_folders` → **0 qator**.
- **Nima yetishmaydi:** 12 bo'limga kengaytirish; to'liqlik% ni 1/12 asosida qayta hisoblash (hozir 1/6); "tugallanmagan" belgisi va uning oqibatlari.
- **Bog'liqlik:** EP-ORG-007 (6 bo'lim), EP-ORG-104, EP-ORG-135, EP-ORG-138 (12-bo'limli PDF shunga bog'liq)
- **action:** CREATE
- **⤳ Ta'sir:** HR (yo'riqnoma), LMS, AI-moslik
- **Xoch-havolalar:** `[Module-01] Item #95` · `[Module-01] Item 6` · `EXTRACTION QISM C #01.95`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-096 · Har kartaga "1-4 продукт" slotlari
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Karta ichida "ЦКП + 1..N продукт" ro'yxati, har продукт alohida kuzatiladi.
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.96
- **Dalil (kod):** `ckp-fact.repository.ts:76-84` `cardProductTarget()` + `ckp-fact.service.ts:249-262` `listCardProducts`/`upsertCardProduct`/`deactivateCardProduct` — `ckp_card_products` ustida to'liq CRUD ulangan va `recordFact()` ning norma-yechish zanjirida ishlatiladi; `SELECT count(*) FROM ckp_card_products` → **0 qator**.
- **Nima yetishmaydi:** jonli slot-data yo'q; "1-4" kutilgan slot soni master-data sifatida belgilanmagan (egasi-DATA).
- **Bog'liqlik:** EP-ORG-111, EP-ORG-130, EP-ORG-135 (bo'sh slot signali)
- **action:** CREATE
- **⤳ Ta'sir:** Kunlik hisobot, AI-baho, MES
- **Xoch-havolalar:** `[Module-01] Item #96` · `EXTRACTION QISM C #01.96`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-097 · "Кўп учрайдиган хатолар" — karta xato-katalog
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Karta xato-katalogi + hodisa shu kataloqdan tanlanadi (statistika to'planadi).
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.97
- **Dalil (kod):** `error-catalog.controller.ts` (to'liq o'qildi) — `error_catalog` ustida to'liq CRUD (`list`/`findOne`/`create`/`update`/`softDelete`); `ckp-fact.service.ts` `RecordFactInput.errorCode` ЦКП-faktni `error_catalog.code` ga yumshoq bog'laydi; `SELECT count(*) FROM error_catalog` → **0 qator**.
- **Nima yetishmaydi:** kontrollerda `/stats` yoki agregatsiya route'i yo'q — "statistika to'planadi" qismi qurilmagan; jonli katalog bo'sh.
- **Bog'liqlik:** EP-ORG-134 (avto-pasayish trigger shu agregatsiyaga tayanadi), EP-ORG-098 (ijobiy ko'zgusi)
- **action:** CREATE
- **⤳ Ta'sir:** AI (takror xato signali), QC, Razryad pasayish
- **Xoch-havolalar:** `[Module-01] Item #97` · `[Module-01] Item 24` · `EXTRACTION QISM C #01.97`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-098 · "Муваффақиятли ҳаракатлар" — AI-baho ijobiy mezoni
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Муваффақиятли ҳаракатлар" AI-baho ijobiy mezoni (xato + yaxshi).
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.98
- **Dalil (kod):** `Grep "success_action"` `apps/api/src` bo'yicha → fayl topilmadi; `org_departments` ning to'liq 52-ustunli ro'yxatida bunday ustun yo'q; `ai-fit.service.ts:206-226` prompt erkin JSON (`strengths`/`gaps`/`summary`) — ajratilgan ijobiy-mezon maydoni yo'q.
- **Nima yetishmaydi:** `success_actions` jsonb ustuni/jadvali va uni `AiFitService` prompt/hisobot shakliga ulash; har karta-turi uchun "muvaffaqiyatli harakat" taksonomiyasi egasi tomonidan belgilanmagan.
- **Bog'liqlik:** EP-ORG-097 (salbiy ko'zgusi), EP-ORG-030, EP-ORG-132
- **action:** AI
- **⤳ Ta'sir:** AI (moslik bahosi)
- **Xoch-havolalar:** `[Module-01] Item #98` · `EXTRACTION QISM C #01.98` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-099 · Оргсхема manzili — "Департамент№-Бўлим№-Секция" 3 daraja
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — Har kartada Департамент№ + Бўлим№ + Секция nomi majburiy (zavod kodi). Daraxt Egasi→BD→7 otdeleniye→Otdellar→Sektsiyalar→Sektorlar.
- **Manba:** BARCHA_JAVOBLAR Org-Q2 (ierarxiya) + Q171 (bo'lim>lavozim) + KARTALAR-A Q19/Q21 · TASDIQ-2146 §01 #01.99
- **Dalil (kod):** `SELECT count(*) FROM org_departments` → **143 qator** (145 emas); `SELECT otdeleniye_no, count(*) FROM org_departments GROUP BY otdeleniye_no` → yagona guruh `{null: 143}` — ustun bor, 100% NULL; `hierarchy_level` esa 143/143 to'lgan.
- **Nima yetishmaydi:** 3-darajali manzilning Департамент№ komponenti jonli data'da yo'q; majburiylik (NOT NULL / validatsiya) ham yo'q.
- **Bog'liqlik:** EP-ORG-019 (bir xil ustun), EP-ORG-100, EP-ORG-101, EP-ORG-021
- **action:** CREATE
- **⤳ Ta'sir:** 7-otdeleniye daraxti, Reports (departament kesimi), RBAC
- **Xoch-havolalar:** `[Module-01] Item #99` · `EXTRACTION QISM C #01.99`
- **⚠️ ZIDDIYAT:** TASDIQ-2146 (2026-06-27) "Ha — `parent_id`+`hierarchy_level`+`otdeleniye_no`, 145 qator daraxt" vs jonli DB (2026-07-11) "143 qator, `otdeleniye_no` 143/143 NULL". Kod/DB-dalil ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** `d39ec98a` — Vysotskiy-7 tier'lari `org-mutations.repo.ts`/`org-queries.repo.ts` da head-bearing + stats mantiqiga ulandi; `e2244914` — 6-tier ikki tilli (UZ/RU) taksonomiya; `82456757` — karta yaratish formasida `otdeleniyeNo` maydoni tuzatildi; `6c6840b8` — "Otdeleniye (1-7)" tanlagichi endi faqat `nodeType==='otdeleniye'` uchun ko'rinadi. DATA (1-7 qiymatlari) hamon egasidan kutiladi.

### EP-ORG-100 · 7 Departament nomlari master-ro'yxat (qotirilsin)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — 7 departament qotirilgan master-ro'yxat (1-Ходимлар .. 7-Администрация), hamma karta shulardan biriga tegishli (ikki-olam tugaydi).
- **Manba:** BARCHA_JAVOBLAR Org-Q2 (7 otdeleniye jadvali) + KARTALAR-A Q40 (bitta DDL) · TASDIQ-2146 §01 #01.100
- **Dalil (kod):** Item #99 bilan bir xil jonli so'rov — `otdeleniye_no` 143/143 NULL, ya'ni 1-7 qiymatlari HOZIR umuman yo'q; bu 2026-06-27 dagi "otdeleniye_no 1-7 BOR" da'vosining birinchi yarmini rad etadi.
- **Nima yetishmaydi:** 7 nomli master-ro'yxat seed'i (egasi-DATA) va har kartani shulardan biriga majburiy bog'lash.
- **Bog'liqlik:** EP-ORG-099 (bir xil ustun), EP-ORG-101, EP-ORG-040 (ikki-olam)
- **action:** CREATE
- **⤳ Ta'sir:** HAMMA modul (yagona poydevor)
- **Xoch-havolalar:** `[Module-01] Item #100` · `EXTRACTION QISM C #01.100`
- **⚠️ ZIDDIYAT:** TASDIQ-2146 (2026-06-27) "Qisman — `otdeleniye_no` 1-7 BOR, faqat 7-nom seed bo'sh" vs jonli DB (2026-07-11) "ustun 143/143 NULL". Kod/DB-dalil ustun → STALE-DOC.
- **Δ 2026-07-11→08-07:** `e2244914` / `d39ec98a` — 6-tier taksonomiya va tier-bog'liq stats qurildi; `82456757` — FE formasida otdeleniye tanlash tuzatildi. Seed DATA hamon yo'q.

### EP-ORG-101 · 4 va 5-Departament ikkalasi "Ишлаб чиқариш" — chegara
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — 4 = bevosita ishlab chiqarish (dastgoh/operator), 5 = qo'llab-quvvatlash (sifat/режа/дизайн/конструктор).
- **Manba:** yangi (BARCHA Org-Q jadvalida 3=Ishlab chiqarish / 4=Texnik — owner chegarani aniqlasin) · TASDIQ-2146 §01 #01.101
- **Dalil (kod):** `org_departments.node_type` ustuni bor; namuna qator `id=28, name='Ishlab chiqarish', hierarchy_level=2, parent_id=null` — yagona umumiy "Ishlab chiqarish" node, 4-vs-5 bo'linishi kodlanmagan; org-structure modulida chegara-ta'rifi mantiqi yo'q.
- **Nima yetishmaydi:** egasi-QAROR — 4 va 5-departament orasidagi aniq chegara belgilanmagan; qaror kelgach `node_type`/`parent_id` seed bilan kodlanadi (yangi mexanizm shart emas).
- **Bog'liqlik:** EP-ORG-100 (7-departament seed avval hal bo'lishi kerak), EP-ORG-099
- **action:** APPROVE
- **⤳ Ta'sir:** 7-otdeleniye daraxti, kartalar taqsimoti
- **Xoch-havolalar:** `[Module-01] Item #101` · `EXTRACTION QISM C #01.101` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-102 · "НО-1..НО-14" raqamli birlik kodlari
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Har bo'lim/karta "НО-kodi" maydoniga ega, eski hujjatlar shu kod orqali bog'lanadi (meros saqlanadi).
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.102
- **Dalil (kod):** `org_departments.code` ustuni mavjud; `card.repository.ts:132-153` `nextCodeForName()` nom-asosli slug generatsiya qiladi ("Operator-01"), "НО-N" formatida emas; jonli `SELECT code FROM org_departments WHERE code IS NOT NULL LIMIT 10` → **0 qator** (butunlay to'ldirilmagan).
- **Nima yetishmaydi:** "НО-" formatli meros-kod maydoni/validatsiyasi yo'q; `code` jonli 0 to'lgan.
- **Bog'liqlik:** EP-ORG-037 (kod generatsiyasi), EP-ORG-117 (eski оргполитика ulanishi)
- **action:** CREATE
- **⤳ Ta'sir:** Hujjat workflow (eski оргполитика ulanishi), Reports
- **Xoch-havolalar:** `[Module-01] Item #102` · `[Module-01] Item 26` · `EXTRACTION QISM C #01.102`
- **Δ 2026-07-11→08-07:** `8b325517` — FE "#N" badge endi tur-bo'yicha (per-tier) ketma-ketlik ko'rsatadi, global DB `id` emas. Bu ko'rinish qatlami; BE `code` generatsiyasi va НО-format o'zgarmadi.

### EP-ORG-103 · "РД-4 / РД-5" — qaror beruvchi rol kodlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "Qaror beruvchi rol" (РД-4/РД-5) karta atributi, tasdiq oqimlari shunga bog'lanadi (org-sxemadan avtomatik marshrut).
- **Manba:** BARCHA_JAVOBLAR Q80/Q81 (org-sxemadan avto-routing) + Q132 (rol orgsxemada) · TASDIQ-2146 §01 #01.103
- **Dalil (kod):** `org-queries.repo.ts:204-222` `getApprovalChain()` — real `WITH RECURSIVE` `parent_id`/`head_user_id` bo'ylab 10 darajagacha yuradi va har daraja uchun rahbar kimligini qaytaradi (tasdiq-marshrut mexanizmi). `org_departments.rbac_tier` ustuni bor, lekin `SELECT rbac_tier, count(*) FROM org_departments GROUP BY rbac_tier` → **143/143 NULL**; alohida "РД" rol-tegi topilmadi.
- **Nima yetishmaydi:** "РД-4/РД-5" nomlangan atribut yo'q (marshrut rahbar-zanjiridan chiqariladi, karta rolidan emas); `rbac_tier` to'ldirilmagan.
- **Bog'liqlik:** EP-ORG-026 (oylik tasdiq zanjiri), EP-ORG-022 (vakant rahbar), EP-ORG-126 (imzo), EP-ORG-134
- **action:** APPROVE
- **⤳ Ta'sir:** HR (ishga qabul), Adaptatsiya (mustaqil ish ruxsati), Oylik
- **Xoch-havolalar:** `[Module-01] Item #103` · `EXTRACTION QISM C #01.103`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-104 · Karta = "Лавозим папкаси" konteyneri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Karta = "Лавозим папкаси" konteyneri (yo'riqnoma + оргполитика + darslik + контрольный лист).
- **Manba:** BARCHA_JAVOBLAR Q32 (har lavozim virtual papka: hujjat/video/test) + KARTALAR-A Q7 · TASDIQ-2146 §01 #01.104
- **Dalil (kod):** Item #95/#89 bilan bir xil — `card-folder.repository.ts` 6 bo'limni tasdiqlaydi (da'vo qilingan 12 emas), `card_folders` 0 qator. **Δ:** `FolderTab.tsx` (`nodes/:id/folder`) endi haqiqiy fayl yuklashni qo'llab-quvvatlaydi (`c82e6366`).
- **Nima yetishmaydi:** konteynerning 4 komponentidan faqat yo'riqnoma-matn qismi bor: оргполитика binding (EP-ORG-117) yo'q, контрольный лист (EP-ORG-105) yo'q; darslik `card_required_knowledge` da alohida yashaydi.
- **Bog'liqlik:** EP-ORG-095 (12 bo'lim), EP-ORG-105, EP-ORG-117, EP-ORG-089
- **action:** CREATE
- **⤳ Ta'sir:** LMS, HR, Hujjat
- **Xoch-havolalar:** `[Module-01] Item #104` · `[Module-01] Item #95` · `EXTRACTION QISM C #01.104`
- **Δ 2026-07-11→08-07:** `c82e6366` — papkaga real fayl-ilova qo'shildi (konteyner g'oyasiga bir qadam yaqinlashdi); bo'lim soni 6 dan o'zgarmadi.

### EP-ORG-105 · "Контрольный лист" — har bo'lim o'qildi-tasdiqi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Har karta bo'limi uchun "tasdiqladim" + sana + raqamli imzo; hammasi tasdiqlanmaguncha "tayyor emas".
- **Manba:** BARCHA_JAVOBLAR Q174 (o'qdi tasdiqlash + mentor tekshirish + mini-test) + Q84 · TASDIQ-2146 §01 #01.105
- **Dalil (kod):** `SELECT to_regclass('card_signatures')` → `null`; `Grep "file.?attach|attachment|fayl"` `card-folder.controller.ts` bo'yicha → 0 mos; hech qanday "acknowledg"-naqshli jadval topilmadi.
- **Nima yetishmaydi:** `card_acknowledgments` (`card_id`, `employee_id`, `section`, `acknowledged_at`) jadvali + endpoint; imzo formati (oddiy vaqt-belgisi + checkbox yoki kriptografik e-imzo) egasi tomonidan belgilanmagan — EP-ORG-126 bilan bir xil ochiq savol.
- **Bog'liqlik:** EP-ORG-126 (imzo formati), EP-ORG-104, EP-ORG-125 (versiya o'zgarsa qayta tasdiq)
- **action:** APPROVE
- **⤳ Ta'sir:** Yuridik himoya, Adaptatsiya (mustaqil ish ruxsati)
- **Xoch-havolalar:** `[Module-01] Item #105` · `[Module-01] Item #126` · `EXTRACTION QISM C #01.105` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-106 · Малака талаблари — strukturali maydonlar
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Strukturali (ta'lim/tajriba-yil/dastur/ko'nikma-ro'yxat); recruitment + AI shunga solishtiradi.
- **Manba:** yangi (BARCHA Q135 SkillsMatrix→position requirements — ustun sxemasi ochiq) · TASDIQ-2146 §01 #01.106
- **Dalil (kod):** Item #87 bilan bir xil `card_required_knowledge` sxemasi — ustunlar `knowledge_name`/`category`/`importance`/`course_id`/`description`; alohida ta'lim/tajriba/dastur/ko'nikma ustunlari YO'Q; **0 qator**.
- **Nima yetishmaydi:** 4 strukturali malaka o'lchami alohida maydon sifatida yo'q — hammasi erkin `knowledge_name` ga siqilgan; AI/recruitment solishtira olmaydi.
- **Bog'liqlik:** EP-ORG-087 (bir xil jadval), EP-ORG-131, EP-ORG-132, EP-ORG-038
- **action:** CREATE
- **⤳ Ta'sir:** Recruitment (vakansiya filtri), AI-moslik, Razryad
- **Xoch-havolalar:** `[Module-01] Item #106` · `[Module-01] Item #87` · `EXTRACTION QISM C #01.106`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-107 · "Иш жойи ва воситалари" — karta resurs/jihoz ro'yxati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — Karta "kerakli vositalar" ro'yxatiga ega, inventar/ombor bilan bog'lanadi (EP-ORG-090 bilan bir).
- **Manba:** BARCHA_JAVOBLAR Q56/Q183 (ish joyi ta'minlash + inventar) · TASDIQ-2146 §01 #01.107
- **Dalil (kod):** 2026-07-11 holati: Item #90 bilan bir xil salbiy natija — `card_equipment` jadvali yo'q, `org_departments` ning 52 ustuni ichida jihoz ustuni yo'q. **Δ:** `card.controller.ts:159-190` `GET/POST/DELETE :id/equipment` + `card.repository.ts:958-995` `org_departments.required_equipment` jsonb + FE "Jihozlar" tabi (`fc23166b`).
- **Nima yetishmaydi:** inventar/ombor moduliga FK-bog'lanish yo'q — jihoz faqat nom-satri sifatida saqlanadi.
- **Bog'liqlik:** EP-ORG-090 (dublikat talab), Ombor/Aktivlar moduli
- **action:** CREATE
- **⤳ Ta'sir:** Ombor/inventar, HR onboarding, Aktiv hisobi
- **Xoch-havolalar:** `[Module-01] Item #107` · `[Module-01] Item #90` · `EXTRACTION QISM C #01.107/#01.90`
- **⚠️ ZIDDIYAT:** EP-ORG-090 va EP-ORG-107 aynan bir xil talab (FULL-ITEM-LEVEL ning o'zi "duplicates Item #90" deb yozgan) — registrda ikkita alohida band bo'lib qolgan; egasi ularni birlashtirishi mumkin.
- **Δ 2026-07-11→08-07:** `fc23166b` — `required_equipment` jsonb + 3 endpoint + FE tab qurildi. Qurilish holati Yo'q → Ha.

### EP-ORG-108 · "Бўйсуниш" — karta→karta vertikal bog'lanish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Bo'ysunish karta→karta (vertikal zanjir kartalardan); manager_id muammosini hal qiladi.
- **Manba:** KARTALAR-A (Q21 ota-karta=rahbar) + vizyon (Vysotskiy manager_id = keyingi yuqori daraja) · TASDIQ-2146 §01 #01.108
- **Dalil (kod):** `card.repository.ts:87-107` `setCardManager()` — `parent_id` ni rekursiv sikl-guard bilan yangilaydi (o'ziga va avlodiga bog'lashni rad etadi); `card.controller.ts:175-179` `PATCH :id/manager`; `card.repository.ts:8` sarlavha izohi `parent_id AS manager_id` alias'ini tasdiqlaydi.
- **Nima yetishmaydi:** `head_user_id` 125/143 NULL (EP-ORG-039) — daraxt tuzilmasi bor, lekin rahbar-shaxs deyarli to'ldirilmagan.
- **Bog'liqlik:** EP-ORG-021, EP-ORG-039, EP-ORG-063, EP-ORG-103
- **action:** CREATE
- **⤳ Ta'sir:** Coordination chain (eskalatsiya), 7-otdeleniye daraxti, MANAGER_OF_SENDER
- **Xoch-havolalar:** `[Module-01] Item #108` · `EXTRACTION QISM C #01.108`
- **Δ 2026-07-11→08-07:** `f6b8a3b5` — org-sxemada drag-and-drop bilan karta ota-onasini o'zgartirish olib tashlandi (endi faqat `PATCH :id/manager` orqali, tasodifiy qayta-bog'lash xavfi yopildi).

### EP-ORG-109 · Karta javobgarligi — standart bandlar avtomatik
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Standart javobgarlik bandlari (energiya/sir/moddiy-ma'naviy) avtomatik + kartaga xos bandlar qo'lda.
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.109
- **Dalil (kod):** `card-folder.repository.ts` `FolderInput.javobgarlik` — faqat qo'lda `upsert()` orqali to'ldiriladigan erkin matn maydoni; `card-folder.service.ts` da standart bandlarni avto-qo'shish (auto-seed/injection) topilmadi.
- **Nima yetishmaydi:** standart bandlar ro'yxati (master-data) va uni yangi kartaga avto-in'eksiya qilish mantiqi.
- **Bog'liqlik:** EP-ORG-095 (papka bo'limlari), EP-ORG-057 (shablon mexanizmi qayta ishlatilishi mumkin)
- **action:** CREATE
- **⤳ Ta'sir:** HR (yuridik to'liqlik)
- **Xoch-havolalar:** `[Module-01] Item #109` · `EXTRACTION QISM C #01.109`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-110 · Karta "ҳуқуқлари" — ERP harakatiga bog'lanishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Kartadagi huquqlar ERP harakatlariga bog'lanadi (so'rov yuborish, talab qilish).
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.110
- **Dalil (kod):** `org_departments` sxemasida ham, `card.controller.ts` da ham "huquq→harakat" ustuni/jadvali topilmadi.
- **Nima yetishmaydi:** huquq→ERP-harakat xaritasi (jsonb ustun yoki bog'langan jadval) + FE'da undan so'rov tugmasini render qilish; to'liq huquq taksonomiyasi egasi tomonidan berilmagan.
- **Bog'liqlik:** EP-ORG-023 (RBAC), CC (so'rov moduli)
- **action:** CREATE
- **⤳ Ta'sir:** CC (so'rov), RBAC
- **Xoch-havolalar:** `[Module-01] Item #110` · `EXTRACTION QISM C #01.110` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-111 · ЦКП turi — "mahsulot / holat / foiz"
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — ЦКП'ga tur tegi (mahsulot/holat/foiz) + o'lchov usuli biriktiriladi; o'lchov usulini karta yaratuvchi RD-4/RD-5 kiritadi.
- **Manba:** yangi (kitob-grounded; EP-ORG-049/EP-ORG-128 bilan bog'liq) · TASDIQ-2146 §01 #01.111
- **Dalil (kod):** `ckp-fact.service.ts:101-119` `calcAchievement()` — 4 formula turini (`boolean`/`foiz`/`vaqt`/`quantity_pct`) har karta uchun `org_departments.tskp_formula_type` dan o'qiydi, slot-darajali override `ckp_card_products.formula_type` (`cardProductTarget()`, 76-84).
- **Nima yetishmaydi:** "o'lchov usulini RD-4/RD-5 kiritadi" degan rol-bog'lanishi yo'q (EP-ORG-103 — РД tegi umuman yo'q).
- **Bog'liqlik:** EP-ORG-049, EP-ORG-130 (bir xil mexanizm), EP-ORG-103
- **action:** CREATE
- **⤳ Ta'sir:** AI (o'lchov), Reports
- **Xoch-havolalar:** `[Module-01] Item #111` · `[Module-01] Item #130` · `EXTRACTION QISM C #01.111`
- **Δ 2026-07-11→08-07:** `c48ce8c5` — FE karta formasida ЦКП uchta maydoni (maqsad + QYaM tavsifi + o'lchov birligi) bitta "ЦКП (QYaM)" blokiga birlashtirildi (egasi so'rovi).

### EP-ORG-112 · ЦКП → yuqori daraja ЦКП kaskadi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — ЦКП ierarxik bog'lanadi (quyi→yuqori), yuqori karta ЦКП'si quyilardan to'planadi.
- **Manba:** yangi (kitob-grounded; EP-ORG-020 otdeleniye GSD bilan bog'liq) · TASDIQ-2146 §01 #01.112
- **Dalil (kod):** `cascade/ckp-cascade.listener.ts` (to'liq o'qildi) — `CkpCascadeListener.handle()` `ancestorChain()` bo'ylab yuradi va har ajdod uchun `rollupParentDay()` ni pastdan yuqoriga chaqiradi; `ckp-fact.service.ts:213` rollup-manbali faktlarni qayta emit qilmaydi (`if (fact.source !== CKP_ROLLUP_SOURCE)`) — ikki marta sanash yo'q.
- **Nima yetishmaydi:** jonli ЦКП-fakt 0 qator (EP-ORG-096) — kaskad ishlaydi, lekin oziqlanmaydi.
- **Bog'liqlik:** EP-ORG-020, EP-ORG-114 (aynan bir mexanizm), EP-ORG-113
- **action:** EVENT
- **⤳ Ta'sir:** 7-otdeleniye daraxti, Reports (ЦКП kaskad), AI
- **Xoch-havolalar:** `[Module-01] Item #112` · `EXTRACTION QISM C #01.112`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-113 · "Статистик кўрсаткичлар" → avtomatik KPI maydonlari
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Har karta o'z statistik ko'rsatkichlariga ega, qiymatlar modullardan avtomatik to'ladi.
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.113
- **Dalil (kod):** `org_departments.statistics_type` ustuni jonli; `SELECT statistics_type, count(*) FROM org_departments GROUP BY statistics_type` → yagona guruh `{null, 143}` (0 to'lgan); ЦКП-MES feed'idan (`ckp-mes-feed.listener.ts`) boshqa hech bir modulning `statistics_type` ga avto-oqimi topilmadi.
- **Nima yetishmaydi:** boshqa modullardan (QC brak%, PP reja%) avto-feed yo'q; ustun 143/143 NULL.
- **Bog'liqlik:** EP-ORG-112, EP-ORG-114, EP-ORG-017 (MES feed), EP-ORG-133
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish (режа %), Sifat (брак %), Reports
- **Xoch-havolalar:** `[Module-01] Item #113` · `EXTRACTION QISM C #01.113`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-114 · Rahbar kartasi KPI'si quyi kartalardan to'planadi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Rahbar kartasi KPI'si quyi kartalar natijasidan avtomatik to'planadi.
- **Manba:** yangi (kitob-grounded; EP-ORG-112 kaskad bilan) · TASDIQ-2146 §01 #01.114
- **Dalil (kod):** Item #112 bilan aynan bir mexanizm — `cascade/ckp-cascade.listener.ts` docblock'i ajdod kartaning kunlik ROLLUP agregatini butun subtree yaproq-faktlaridan qayta hisoblashini aniq aytadi.
- **Nima yetishmaydi:** jonli fakt 0 — rahbar KPI'si amalda hisoblanmaydi; rahbar bonusiga ulanish (Payroll) tasdiqlanmagan.
- **Bog'liqlik:** EP-ORG-112, EP-ORG-020, EP-ORG-024 (rahbar bonusi)
- **action:** EVENT
- **⤳ Ta'sir:** ЦКП kaskad, 7-otdeleniye daraxti, Oylik (rahbar bonusi)
- **Xoch-havolalar:** `[Module-01] Item #114` · `[Module-01] Item #112` · `EXTRACTION QISM C #01.114`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-115 · Yangi xodim: 2-oy o'qish + imtihon → karta faollashuvi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Karta holati: biriktirildi → o'qish (2 oy) → imtihon → rahbar xulosasi → mustaqil-faol; har bosqich oylikka ta'sir qiladi; o'qish davri kamaytirilgan stavka.
- **Manba:** BARCHA_JAVOBLAR Q91 (sinov muddati: eslatma+baholash+avto-o'tish) + Q14/Q16 (adaptatsiya) · TASDIQ-2146 §01 #01.115
- **Dalil (kod):** `lms-card-gate.service.ts:1-60` — binar "barcha majburiy kurslar tugadimi" gate (`allComplete: true/false`), 8-bosqichli progressiv faollashuv emas; `card.controller.ts:35` `status` enum faqat 5 lifecycle holatini beradi (`active/frozen/vacant/archived/io`), onboarding-bosqich qiymatlari yo'q. **Δ:** `eccf3089` — `OnboardingDocumentGateService` LMS-gate bilan OR-kompozitsiyada `computeGatedMonthlySalary`/`previewCardSalary`/`generatePeriodRows` ga ulandi (karta-biriktirish → onboarding → hujjat-gated oylik zanjiri).
- **Nima yetishmaydi:** bosqich-enum'i (o'qish/imtihon/xulosa) yo'q; bosqich-koeffitsientlari (0.7/0.85/0.90/1.0 — Item 21) qiymat sifatida hech qayerda yo'q; "2 oy" muddati sozlanadigan emas.
- **Bog'liqlik:** EP-ORG-141 (holat ro'yxati), EP-ORG-027 (LMS gate), EP-ORG-116 (mentor), [Module-01] Item 21
- **action:** APPROVE
- **⤳ Ta'sir:** HR onboarding, LMS (imtihon), Adaptatsiya, Oylik (bosqichli)
- **Xoch-havolalar:** `[Module-01] Item #115` · `[Module-01] Item 21` · `EXTRACTION QISM C #01.115`
- **Δ 2026-07-11→08-07:** `eccf3089` — karta-biriktirish → onboarding → hujjat-gated oylik zanjiri ulandi; bosqichli status/koeffitsient hamon yo'q.

### EP-ORG-116 · Мураббий/устоз (mentor) kartaga bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Onboarding davrida kartaga "мураббий" (mentor-karta) biriktiriladi; har xodimga 2 mentor (adaptatsiya + kasbiy usta).
- **Manba:** BARCHA_JAVOBLAR Q145 (2 mentor) + Q30/Q72 · TASDIQ-2146 §01 #01.116
- **Dalil (kod):** `SELECT count(*) FROM lms_card_mentors` → **0**; `SELECT count(*) FROM hr_mentorship_pairings` → **0** (ikkala jadval mavjud — so'rovlar xato bermadi — lekin data yo'q); org-structure modulida "2-tur" mentor ajratmasi topilmadi.
- **Nima yetishmaydi:** ikki mentor turi (adaptatsiya vs kasbiy usta) ajratilmagan; mentor-sessiyasiga mentee uchun cheklangan o'qish ruxsati va muddat tugaganda avto-revoke yo'q (Item 34); jonli data 0.
- **Bog'liqlik:** EP-ORG-115, EP-ORG-032 (vorislik), [Module-01] Item 34
- **action:** CREATE
- **⤳ Ta'sir:** HR (mentorlik), LMS
- **Xoch-havolalar:** `[Module-01] Item #116` · `[Module-01] Item 34` · `EXTRACTION QISM C #01.116`
- **Δ 2026-07-11→08-07:** `7df7d889` — "Baholash klasteri" ichida Mentorlik/Succession sahifalarining crash'lari yopildi (jadvallar endi UI'dan ishlatiladigan holatga keldi); model (2 mentor turi) o'zgarmadi.

### EP-ORG-117 · Karta "СЕРИЯ" (оргполитика toifasi) bog'lanishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Оргполитикalar seriya bo'yicha kartalarga biriktiriladi (kun-tartibi/telefon/ta'til).
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.117
- **Dalil (kod):** `Grep "seriya|orgpolitika|org_polic"` `apps/api/src` bo'yicha → fayl topilmadi.
- **Nima yetishmaydi:** `card_policy_bindings` (seriya + `card_id`) jadvali va o'qish endpointi; "seriya" taksonomiyasining o'zi egasi tomonidan ta'riflanmagan.
- **Bog'liqlik:** EP-ORG-104 (konteyner), EP-ORG-102 (НО-kod meros ulanishi), EP-ORG-123 (telefon siyosati)
- **action:** CREATE
- **⤳ Ta'sir:** Hujjat, HR
- **Xoch-havolalar:** `[Module-01] Item #117` · `EXTRACTION QISM C #01.117` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-118 · "Унвон" — lavozimdan alohida maydon
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Karta "lavozim nomi" + "унвон" (razryad/rutba) alohida maydonlar (rasmiy hujjatga mos).
- **Manba:** yangi (kitob-grounded; razryad bilan bog'liq lekin alohida) · TASDIQ-2146 §01 #01.118
- **Dalil (kod):** `org_departments` ning to'liq 52-ustunli `information_schema.columns` ro'yxatida `name` / `razryad_level_id` dan farqli "title"/"unvon" ustuni YO'Q.
- **Nima yetishmaydi:** `unvon` matn ustuni + `CardCreateSchema`/`CardUpdateSchema` ga qo'shish — sof sxema/DTO ishi, hal qilinmagan biznes-qoida yo'q (egasi-gate emas).
- **Bog'liqlik:** EP-ORG-044 (razryad nomlash), EP-ORG-138 (rasmiy PDF), [Module-01] Item 37
- **action:** CREATE
- **⤳ Ta'sir:** Rasmiy hujjat (PDF), Payroll
- **Xoch-havolalar:** `[Module-01] Item #118` · `[Module-01] Item 37` · `EXTRACTION QISM C #01.118` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-119 · Karta smena-turi (3 smenali)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Karta "smena" tegiga ega; ishlab chiqarish kartalari smena bo'yicha ko'paytiriladi.
- **Manba:** BARCHA_JAVOBLAR Q133/Q171 (ShiftSchedule + bo'lim>smena) + KARTALAR-A Q35 · TASDIQ-2146 §01 #01.119
- **Dalil (kod):** `org_departments.work_schedule` ustuni bor, lekin `WHERE work_schedule IS NOT NULL` → **0 qator**; smena-tegini avto-ko'paytirish (3-smena → 3 karta nusxasi) mantiqi org-structure modulida topilmadi. **Δ:** `hr-shifts-compat.controller.ts:124-205` — `shift_types` uchun to'liq CRUD + FE `ShiftTypesConfig.tsx` (`c82e6366`); keyin `5cf2ad02` karta formasidan smena-preset tanlagichi OLIB TASHLANDI, `c48ce8c5` maydon raqamli "Ish soati" ga aylantirildi.
- **Nima yetishmaydi:** kartadan smena-jadvalga FK (`shift_id`) YO'Q; smena bo'yicha karta ko'paytirish yo'q; egasi qarori bilan karta formasi endi smenani emas, kunlik soatni so'raydi.
- **Bog'liqlik:** EP-ORG-035 (bir xil ustun), EP-ORG-094 (tungi ustama), EP-ORG-120
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (смена режа), Oylik (smena ustamasi), Davomat
- **Xoch-havolalar:** `[Module-01] Item #119` · `[Module-01] Item 39` · `EXTRACTION QISM C #01.119`
- **⚠️ ZIDDIYAT:** vizyon "karta smena-tegiga ega" vs egasi qarori 2026-07-14 (`5cf2ad02`, `c48ce8c5`): "smena tanlash o'rniga ish soati yozish kerak", "ish soati raqam bo'lsin" — `work_schedule` endi kunlik soat soni (masalan 8), smena-teg emas. Asl talab qisman bekor qilingan; egasi smena modelini yakuniy tasdiqlashi kerak.
- **Δ 2026-07-11→08-07:** `c82e6366` — `shift_types` CRUD (BE+FE) qurildi; `5cf2ad02` — karta formasidan smena-preset tanlagichi olib tashlandi; `c48ce8c5` — maydon "Ish soati" raqamli inputga aylandi. Karta↔smena FK hamon yo'q.

### EP-ORG-120 · Karta → "кун тартиби" (ish-vaqt rejimi) bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Karta "ish-vaqt rejimi" qoidasiga bog'lanadi, davomat shunga solishtiriladi; har xodim unikal ish vaqti bo'lishi mumkin.
- **Manba:** BARCHA_JAVOBLAR Q108 (unikal ish vaqti, AI kamera davomat) + KARTALAR-A Q35 · TASDIQ-2146 §01 #01.120
- **Dalil (kod):** bir xil `work_schedule` ustuni (0/143 to'lgan); org-structure modulida `work_schedule` ga murojaat qiladigan davomat-solishtirish join'i topilmadi.
- **Nima yetishmaydi:** HR davomat moduli `work_schedule` ga ulanmagan (bunday ulanish topilmadi); "har xodim unikal ish vaqti" per-xodim override yo'q — maydon karta darajasida.
- **Bog'liqlik:** EP-ORG-035, EP-ORG-119, EP-ORG-034 (davomat/blok), IoT (AI kamera)
- **action:** CREATE
- **⤳ Ta'sir:** Davomat (AI kamera), Intizom, IoT
- **Xoch-havolalar:** `[Module-01] Item #120` · `EXTRACTION QISM C #01.120`
- **Δ 2026-07-11→08-07:** `c48ce8c5` — `work_schedule` endi raqamli "Ish soati" (kuniga soat) sifatida to'ldiriladi; bu "кун тартиби" (vaqt oralig'i) semantikasidan uzoqlashtiradi — davomat-solishtirish uchun oraliq ma'lumot endi formadan kelmaydi.

### EP-ORG-121 · Karta → kunlik/smenalik hisobot majburiyati tegi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — Karta "hisobot majburiyati" tegiga ega (davriylik + qabul qiluvchi); bermaslik avtomatik aniqlanadi (3 soat → ishlamagan).
- **Manba:** BARCHA_JAVOBLAR Q116/Q118 (har lavozim ЦКП hisobot bot orqali) + KARTALAR-A Q18 · TASDIQ-2146 §01 #01.121
- **Dalil (kod):** `org_departments.ckp_frequency` / `ckp_report_deadline_hours` ustunlari jonli (`WHERE ckp_frequency IS NOT NULL` → 1); `ckp-fact.service.ts:126-143` `calcDeadline()` har karta uchun `deadlineAt`/`deadlinePassed` ni hisoblaydi va `recordFact()` javobida qaytaradi (217-223).
- **Nima yetishmaydi:** "qabul qiluvchi" (kimga yuboriladi) maydoni tasdiqlanmagan; aniqlash cron'i kuniga 1 marta 23:00 da ishlaydi (Item 36 — 30-daqiqalik poll / smena-boshidan 3 soat qoidasi yo'q); jonli `ckp_frequency` 1/143.
- **Bog'liqlik:** EP-ORG-018 (16 vs 3 soat ziddiyati), EP-ORG-052, VR-ORG-I04
- **action:** CRON
- **⤳ Ta'sir:** Coordination (hisobot oqimi), Oylik (jazo), AI
- **Xoch-havolalar:** `[Module-01] Item #121` · `[Module-01] Item 36` · `EXTRACTION QISM C #01.121`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-122 · Karta → domen-bilim (qog'oz/gofra turlari) bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Karta "talab qilinadigan domen-bilim" ro'yxatiga ega, LMS darsligi shunga bog'lanadi.
- **Manba:** BARCHA_JAVOBLAR Q71/Q75 (LMS integratsiya, kurs materiali ERP qurish uchun) + KARTALAR-A Q28 · TASDIQ-2146 §01 #01.122
- **Dalil (kod):** `card_required_knowledge.course_id` + `category` ustunlari to'liq CRUD bilan mavjud; `SELECT count(*) FROM card_required_knowledge` → **0 qator**.
- **Nima yetishmaydi:** domen-bilim seed'i yo'q (gofra/offset atamalari kiritilmagan) — egasi/o'quv-bo'limi DATA darvozasi.
- **Bog'liqlik:** EP-ORG-028, EP-ORG-088, EP-ORG-087, EP-ORG-129 (lug'at)
- **action:** CREATE
- **⤳ Ta'sir:** LMS, Sifat (material bilimi→brak kamayadi), AI-imtihon
- **Xoch-havolalar:** `[Module-01] Item #122` · `EXTRACTION QISM C #01.122`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-123 · Korporativ telefon/abonent doirasi kartaga biriktirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Karta korporativ raqam + ruxsat etilgan abonent toifalarini saqlaydi.
- **Manba:** BARCHA_JAVOBLAR Q74 (korporativ email/telefon ERP ro'yxatga olinadi) · TASDIQ-2146 §01 #01.123
- **Dalil (kod):** `org_departments` ning `information_schema.columns` ro'yxatida `telegram_group_id` bor, lekin telefon/abonent ustuni YO'Q.
- **Nima yetishmaydi:** `corporate_phone` / `abonent_scope` ustunlari + DTO'ga chiqarish — mexanizm uchun egasi-qaror shart emas; raqamlarning o'zi keyin kiritiladigan master-data.
- **Bog'liqlik:** EP-ORG-117 (telefon оргполитика seriyasi), Xavfsizlik moduli
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (aloqa nazorati), CC
- **Xoch-havolalar:** `[Module-01] Item #123` · `EXTRACTION QISM C #01.123` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-124 · Ta'til tasdig'i — i.o. + vazifa-topshirish majburiy
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Ta'til tasdig'i i.o. tayinlash + vazifa-topshirish ro'yxati to'ldirilgandan keyin.
- **Manba:** BARCHA_JAVOBLAR Q186/Q96 (ta'til ariza→rahbar tasdiq→Payroll) + Q79 (uzilishsiz) · TASDIQ-2146 §01 #01.124
- **Dalil (kod):** `Grep "handover|topshirish"` `apps/api/src/modules/hr` ostida — umumiy ta'til/offboarding fayllari topildi (`offboarding-workflow.service.ts`, `document-workflow.processor.ts`, telegram-bot yordamchilari), lekin hech biri `org_departments` / karta i.o. holatini ta'til-tasdiq sharti sifatida o'qimaydi. `card.repository.ts` ning `is_acting`/`ended_at` mexanizmi (EP-ORG-060) mustaqil ishlaydi va HR ta'til-tasdiq oqimiga ULANMAGAN.
- **Nima yetishmaydi:** ta'til tasdig'i uchun "i.o. tayinlanganmi + topshirish ro'yxati to'lganmi" darvozasi; ikki mexanizm o'rtasidagi bog'lanish.
- **Bog'liqlik:** EP-ORG-060 (i.o. mexanizmi mavjud), HR ta'til moduli, EP-ORG-136
- **action:** APPROVE
- **⤳ Ta'sir:** HR (ta'til), I.o. tizimi (EP-ORG-060), Coordination
- **Xoch-havolalar:** `[Module-01] Item #124` · `EXTRACTION QISM C #01.124`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-125 · Karta versiyalash (yo'riqnoma sanasi o'zgarganda)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Karta versiyalanadi (eski saqlanadi), versiya o'zgarsa qayta tasdiq so'raladi.
- **Manba:** BARCHA_JAVOBLAR Q107 (to'liq versiya tarixi) + Q83 (immutable) · TASDIQ-2146 §01 #01.125
- **Dalil (kod):** `SELECT to_regclass('org_chart_snapshots')` → `'org_chart_snapshots'` (jadval bor); `card.repository.ts` `softDelete()` / `listHistory()` (`audit_logs` ustidan) umumiy tarix izini beradi.
- **Nima yetishmaydi:** karta-maxsus v1/v2 snapshot yo'q — `org_chart_snapshots` butun org-daraxt snapshoti, per-karta versiyalash emas; razryad/oylik o'zgarganda snapshot + qayta-tasdiq trigger'i yo'q.
- **Bog'liqlik:** EP-ORG-067 (audit), EP-ORG-105 (qayta tasdiq), EP-ORG-126 (imzo)
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Контрольный лист (qayta tasdiq)
- **Xoch-havolalar:** `[Module-01] Item #125` · `EXTRACTION QISM C #01.125`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-126 · Karta tasdiqlovchi 2 imzo (tasdiqlovchi + tanishuvchi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Karta 2 raqamli imzo bilan kuchga kiradi (tasdiqlovchi RD + tanishgan xodim, sana).
- **Manba:** BARCHA_JAVOBLAR Q77/Q78 (rahbar imzo belgilash + xodim qabul + telegram tasdiq) · TASDIQ-2146 §01 #01.126
- **Dalil (kod):** `SELECT to_regclass('card_signatures')` → `null` (jadval yo'q).
- **Nima yetishmaydi:** `card_signatures` (`card_id`, `signer_role`, `signed_at`, `signature_hash`) jadvali + 2-imzoli faollashuv darvozasi; raqamli imzoning yaroqli formati (provayder/usul) egasi tomonidan belgilanmagan.
- **Bog'liqlik:** EP-ORG-105 (bir xil yetishmayotgan jadval), EP-ORG-103 (РД roli), EP-ORG-138 (PDF imzo joylari)
- **action:** APPROVE
- **⤳ Ta'sir:** Yuridik, Hujjat workflow
- **Xoch-havolalar:** `[Module-01] Item #126` · `[Module-01] Item #105` · `EXTRACTION QISM C #01.126` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-127 · Karta → "Иш йўриқномаси" (amaliy qadamlar) qatlami
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Karta 2 qatlam: vazifa ta'rifi + amaliy qadamlar (Иш йўриқномаси).
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.127
- **Dalil (kod):** `card-folder.repository.ts` `FolderInput.jarayon` — yagona erkin-matn maydoni; raqamlangan qadam-baqadam tuzilma uchun alohida ustun/jadval topilmadi.
- **Nima yetishmaydi:** ikkinchi qatlam (strukturali amaliy qadamlar) yo'q — hozir hammasi bitta matn maydonida.
- **Bog'liqlik:** EP-ORG-095 (12 bo'lim), EP-ORG-128, EP-ORG-133
- **action:** CREATE
- **⤳ Ta'sir:** LMS, Onboarding, AI
- **Xoch-havolalar:** `[Module-01] Item #127` · `EXTRACTION QISM C #01.127`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-128 · Karta → "Сборник упражнений" (mashq/test) bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Karta mashq/test to'plamiga ega, imtihon shundan tuziladi, AI baholaydi.
- **Manba:** BARCHA_JAVOBLAR Q8/Q62 (online test + AI adaptiv test + har lavozim savol banki) · TASDIQ-2146 §01 #01.128
- **Dalil (kod):** `org_departments.ai_exam_enabled` boolean tasdiqlangan; `exam-passed-razryad.listener.ts` (to'liq o'qildi) + `question-bank.service.ts`/`.repository.ts` (to'liq o'qildi, `hr_question_bank` ustida to'liq CRUD) imtihon infratuzilmasini tashkil qiladi.
- **Nima yetishmaydi:** xom savol-bankidan farqli alohida "to'plam" (mashq-to'plami) jadvali YO'Q; savol-bank tuzilishi ochiq savol (EP-ORG-053); jonli savol 0.
- **Bog'liqlik:** EP-ORG-053, EP-ORG-054, EP-ORG-046, EP-ORG-010
- **action:** CREATE
- **⤳ Ta'sir:** LMS, AI-imtihon, Razryad
- **Xoch-havolalar:** `[Module-01] Item #128` · `[Module-01] Item #53` · `EXTRACTION QISM C #01.128`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-129 · "Глоссарий" — kartaga bog'langan atamalar lug'ati
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Karta atamalar lug'atiga ega (yoki umumiy lug'atdan kerakli atamalar), darslikda tooltip.
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.129
- **Dalil (kod):** `Grep "glossary|Глоссарий"` `apps/api/src` bo'yicha → fayl topilmadi.
- **Nima yetishmaydi:** `glossary` jadvali (`term`, `definition`, `card_id`/`category`) + FE tooltip uchun lookup endpointi. Mexanizm uchun egasi-qaror shart emas; lug'at mazmuni egasi-DATA.
- **Bog'liqlik:** EP-ORG-122 (domen-bilim), LMS, `docs/LUGAT.md` (mavjud domen lug'ati manba bo'lishi mumkin)
- **action:** CREATE
- **⤳ Ta'sir:** LMS (o'qish), AI-imtihon
- **Xoch-havolalar:** `[Module-01] Item #129` · `EXTRACTION QISM C #01.129` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-130 · ЦКП formula turi (qanday o'lchanadi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — 4 ЦКП formula turi (miqdor%/sifat/muddat%/holat), har kartaga mosi biriktiriladi.
- **Manba:** yangi (kitob-grounded; EP-ORG-049/EP-ORG-111 bilan bog'liq) · TASDIQ-2146 §01 #01.130
- **Dalil (kod):** Item #111 bilan aynan bir mexanizm — `ckp-fact.service.ts:101-119` 4-tarmoqli `calcAchievement()` + `recordFact()` (145-224) ichida 3 bosqichli override zanjiri (shaxsiy → продукт → karta-global).
- **Nima yetishmaydi:** jonli ЦКП-fakt 0 qator — formula ishlaydi, lekin real data bilan tasdiqlanmagan.
- **Bog'liqlik:** EP-ORG-049, EP-ORG-111, EP-ORG-015, EP-ORG-096
- **action:** CREATE
- **⤳ Ta'sir:** AI (baho), Reports
- **Xoch-havolalar:** `[Module-01] Item #130` · `[Module-01] Item #111` · `EXTRACTION QISM C #01.130`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-131 · Razryad → karta minimal talabi vs xodim razryadi (gap)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Karta MINIMAL razryad talab qiladi, xodim o'z razryadiga ega, AI mosligini tekshiradi.
- **Manba:** KARTALAR-A (Q8 razryad + Q30 moslik) + BARCHA_JAVOBLAR Q135 (position requirements match) · TASDIQ-2146 §01 #01.131
- **Dalil (kod):** `org_departments.razryad_level_id` mavjud; `card.repository.ts:376-393` `computeCardFit()` SQL'i faqat `f.razryad_level_id IS NOT NULL` mavjudlik-bayrog'ini tekshiradi (`definition_score` ga hissa) — egallovchining HAQIQIY razryadini kartaning talabiga SOLISHTIRMAYDI (xodim razryadiga gap-check join yo'q).
- **Nima yetishmaydi:** gap-tekshiruv join'i; `razryad_level_id` jonli 0/144 biriktirilgan (egasi-DATA); AI-kalit (VR-ORG-I12).
- **Bog'liqlik:** EP-ORG-008, EP-ORG-081, EP-ORG-093, EP-ORG-132, VR-ORG-I07/I12
- **action:** AI
- **⤳ Ta'sir:** AI-moslik (gap-analiz), Oylik (razryad→min-oylik), Recruitment
- **Xoch-havolalar:** `[Module-01] Item #131` · `EXTRACTION QISM C #01.131`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-132 · AI gap-analiz: karta talabi vs xodim haqiqati farqi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — AI gap-analiz (talab vs haqiqat farqlari ro'yxati) → undan o'qish/rivojlanish rejasi.
- **Manba:** KARTALAR-A (Q30 markaziy AI moslik) + BARCHA_JAVOBLAR Q135 · TASDIQ-2146 §01 #01.132
- **Dalil (kod):** `ai-fit.service.ts:229-254` `parseAiResponse()` — AI JSON javobidan erkin `report.gaps` matn-massivini ajratadi va `fitReport` jsonb'ida saqlaydi (real gap-chiqishi bor).
- **Nima yetishmaydi:** `gaps` ni strukturali LMS o'qish-rejasiga (reja) aylantiradigan keyingi qadam YO'Q — zanjir shu yerda uziladi; AI-kalit ham gate (VR-ORG-I12).
- **Bog'liqlik:** EP-ORG-030, EP-ORG-032, EP-ORG-033, EP-ORG-131, VR-ORG-I12
- **action:** AI
- **⤳ Ta'sir:** LMS (gap→darslik), Razryad (gap yopilsa→ko'tarilish), Recruitment
- **Xoch-havolalar:** `[Module-01] Item #132` · `EXTRACTION QISM C #01.132`
- **Δ 2026-07-11→08-07:** `7df7d889` — Skills Matrix noto'g'ri jadvalga murojaat qilishi tuzatildi (gap-analizning determenistik yarmi endi to'g'ri jadvaldan o'qiydi); AI→reja zanjiri hamon uzuq.

### EP-ORG-133 · Karta "majburiy tizim-qaydlari" (A-System o'rnini bosish)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Karta "majburiy tizim-qaydlari" ro'yxatiga ega (ish boshlandi/bosqich/tugadi), bajarilmasa signal.
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.133
- **Dalil (kod):** `org_departments` `information_schema.columns` da bunday maydon yo'q; org-structure modulida "majburiy-qayd" ekvivalenti topilmadi. QISM A Item #41 egasi buni ataylab keyinga surganini aytadi ("`card_activity_logs` jadval — defer IoT").
- **Nima yetishmaydi:** majburiy-nazorat-nuqta log jadvali + IoT/MES event listener; qayd maydonlarining o'zi (boshlandi/bosqich/tugadi) egasi tomonidan ta'riflanmagan — IoT fazasiga defer qilingan.
- **Bog'liqlik:** [Module-01] Item #41 (IoT defer), EP-ORG-113, EP-ORG-017 (MES feed)
- **action:** EVENT
- **⤳ Ta'sir:** MES (ish qaydi), Ma'lumot sifati, AI
- **Xoch-havolalar:** `[Module-01] Item #133` · `[Module-01] Item 41` · `EXTRACTION QISM C #01.133` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-134 · Razryad pasayish triggerlari
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Pasayish faqat aniq triggerdan (statistik ko'rsatkich + takroriy xato + qayta imtihon), AI taklif → RD-4 tasdiqlaydi.
- **Manba:** yangi (KARTALAR-A Q12 pasayish — triggerlar ochiq; EP-ORG-097 xato-katalog bilan) · TASDIQ-2146 §01 #01.134
- **Dalil (kod):** `razryad-history.service.ts:36-85` `createRequest()` (to'liq o'qildi) `requestType='decrease'` ni majburiy `reason` va ko'tarilish bilan bir xil 2-imzoli oqim (`hr-approve`/`manager-approve`) orqali qo'llab-quvvatlaydi — lekin pasayishga faqat inson qo'lidagi `POST` orqali erishiladi (`razryad-history.controller.ts:102-120`); `error_catalog` takror-sanog'ini (30 kunda 3+) o'qib avto-pasayish so'rovi ochadigan trigger topilmadi.
- **Nima yetishmaydi:** avto-trigger (statistika + takror xato) va "AI taklif → RD-4 tasdiq" marshruti; xato-katalog agregatsiyasi ham qurilmagan (EP-ORG-097).
- **Bog'liqlik:** EP-ORG-012 (e'tiroz oynasi ham yo'q), EP-ORG-097, EP-ORG-103 (РД-4), EP-ORG-113
- **action:** APPROVE
- **⤳ Ta'sir:** Razryad, Oylik (pasayish), AI, HR hujjati
- **Xoch-havolalar:** `[Module-01] Item #134` · `[Module-01] Item 24` · `EXTRACTION QISM C #01.134`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-135 · Bo'sh продукт slotlari → "tugallanmagan karta" topshirig'i
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Bo'sh продукт slotlari "tugallanmagan" + javobgar rahbarga to'ldirish topshirig'i.
- **Manba:** yangi (kitob-grounded; EP-ORG-096 bilan bog'liq) · TASDIQ-2146 §01 #01.135
- **Dalil (kod):** `ckp-fact.repository.ts` / `ckp-fact.service.ts` (to'liq o'qildi) `ckp_card_products` slotlari uchun CRUD beradi, lekin bo'sh/chala slotlarni skanerlab Kanban topshirig'i yaratadigan cron/listener topilmadi; `SELECT count(*) FROM ckp_card_products` → 0 qator.
- **Nima yetishmaydi:** 0 ta faol slotli kartalarni topib rahbariga Kanban topshirig'i emit qiladigan cron; kutilgan slot soni (1-4) egasi master-data'si sifatida belgilanmagan.
- **Bog'liqlik:** EP-ORG-096 (avval to'lishi kerak), EP-ORG-007/095 (to'liqlik%), Kanban moduli
- **action:** CRON
- **⤳ Ta'sir:** Org, Kanban (topshiriq)
- **Xoch-havolalar:** `[Module-01] Item #135` · `[Module-01] Item 47` · `EXTRACTION QISM C #01.135` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-136 · Vakant karta ЦКП'sini kim vaqtincha bajaradi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Vakant karta ЦКП'si vaqtincha yuqori kartaga (rahbar) yoki belgilangan qo'shni kartaga o'tadi.
- **Manba:** yangi (kitob-grounded; i.o. EP-ORG-060 bilan bog'liq) · TASDIQ-2146 §01 #01.136
- **Dalil (kod):** `card.repository.ts:608-621` `setVacant()` faqat `current_state='vacant'` qiladi va freeze-metama'lumotini tozalaydi — ЦКП qayta-biriktirish yoki qo'shni-karta qidiruvi yo'q; `ckp-fact.service.ts` / `ckp-cascade.listener.ts` da ham bunday mantiq topilmadi.
- **Nima yetishmaydi:** `setVacant()` da qo'shni kartani topish + vaqtinchalik ЦКП-delegatsiya yozuvi; "qo'shni karta" tanlash qoidasi (adjacency) belgilanmagan; "qo'shimcha yuk" tegi ham yo'q (Item 19).
- **Bog'liqlik:** EP-ORG-060 (i.o.), EP-ORG-071 (vakant), EP-ORG-112 (kaskad), [Module-01] Item 19
- **action:** EVENT
- **⤳ Ta'sir:** Coordination, I.o. tizimi, Ishlab chiqarish uzilishi
- **Xoch-havolalar:** `[Module-01] Item #136` · `[Module-01] Item 19` · `EXTRACTION QISM C #01.136` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-137 · Karta eskirgan belgisi (davriy ko'rib chiqish)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — Karta "oxirgi ko'rib chiqilgan sana"ni saqlaydi, muddat oshsa (1 yil) "ko'rib chiqing" eslatmasi.
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.137
- **Dalil (kod):** `card.repository.ts:56` `staleExpr` — `(f.last_reviewed_at IS NULL OR f.last_reviewed_at < now() - interval '1 year')`, `list()` va `findById()` ikkalasida hisoblanadi; `markReviewed()` (647-654) `last_reviewed_at` ni tiklaydi; `card.controller.ts:252-255` `PATCH :id/review`. **Δ:** `apps/api/src/cron/card-staleness.cron.ts` (yangi) — kunlik skaner, har eskirgan karta uchun `CardExpiredEvent` chiqaradi, `CardRepository.listStaleCards()` ga delegatsiya qiladi, `CronStatusService` ga ulangan (`1724a0ac`).
- **Nima yetishmaydi:** `CardExpiredEvent` iste'molchilari (HR digest / Telegram bildirishnoma) hali ulanmagan — cron izohining o'zi "future wiring" deb yozadi; "1 yil" muddati kodda qotirilgan, `business_settings` orqali sozlanmaydi.
- **Bog'liqlik:** EP-ORG-092 (attestatsiya), EP-ORG-125 (versiyalash), Notifications moduli
- **action:** CRON
- **⤳ Ta'sir:** HR, Org (kartalar tirik qoladi)
- **Xoch-havolalar:** `[Module-01] Item #137` · `[Module-01] Item 10` · `EXTRACTION QISM C #01.137`
- **Δ 2026-07-11→08-07:** `1724a0ac` — `CardStalenessCron` + `CardExpiredEvent` qo'shildi (avval `last_reviewed_at` faqat o'qish-bezagi edi, hech kim skanerlamasdi).

### EP-ORG-138 · Kartadan rasmiy "Должностная инструкция" PDF eksport
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Kartadan rasmiy yo'riqnoma PDF (zavod shabloni 12 bo'lim + imzo joylari) avtomatik chiqadi.
- **Manba:** BARCHA_JAVOBLAR Q77/Q104 (hamma hujjat ERP, pechat imkoni) + Org-Q10 · TASDIQ-2146 §01 #01.138
- **Dalil (kod):** `org-export.service.ts:139-269` `exportPdf()` (to'liq o'qildi) — umumiy ko'p-qatorli org-daraxt jadval PDF'i (ustunlar: id/nom/tur/rahbar/xodim-soni/tskp), ya'ni katalog-ro'yxati; per-karta 12-bo'limli lavozim-yo'riqnoma hujjati emas, imzo-bloki render qilinmaydi.
- **Nima yetishmaydi:** 12-bo'limli shablon (EP-ORG-095 avval qurilishi kerak) va 2-imzo bloki (EP-ORG-126); asinxron PDF (BullMQ) va QR-imzo (Item 14) ham yo'q.
- **Bog'liqlik:** EP-ORG-095, EP-ORG-104, EP-ORG-126, EP-ORG-077 (mavjud eksport), [Module-01] Item 14
- **action:** EXPORT
- **⤳ Ta'sir:** Hujjat (raqamli↔qog'oz mosligi), HR
- **Xoch-havolalar:** `[Module-01] Item #138` · `[Module-01] Item 14` · `EXTRACTION QISM C #01.138`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-139 · Karta штат-reja birligiga bog'lanishi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — Karta штат-reja birligiga bog'lanadi (tasdiqlangan o'rin vs to'lgan), byudjet/vakansiya ko'rinadi.
- **Manba:** yangi (kitob-grounded) · TASDIQ-2146 §01 #01.139
- **Dalil (kod):** `SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%staff%' OR table_name ILIKE '%shtat%'` → **0 qator**; jonli DB'da shtat-reja jadvali umuman yo'q.
- **Nima yetishmaydi:** `staffing_plan` (`department_id`, `approved_headcount`, `filled_headcount`, `budget`) jadvali; shtat-reja modelining o'zi (1:1 karta↔byudjetli o'rin vs bo'lim darajasidagi agregat byudjet) hal qilinmagan egasi-qarori.
- **Bog'liqlik:** [Module-01] Item 40 (bir xil egasi-qarori), EP-ORG-094 (stavka soni), EP-ORG-071 (vakansiya)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (oylik byudjet), HR (штат-reja), Vakansiya
- **Xoch-havolalar:** `[Module-01] Item #139` · `[Module-01] Item 40` · `EXTRACTION QISM C #01.139` · `QISM C Step-3 (ochiq savol)`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-140 · Mutaxassis karta shabloni (бош технолог/конструктор/дизайн)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "Mutaxassis karta" shabloni alohida (tех karta/loyiha bilan bog'langan ЦКП).
- **Manba:** yangi (BARCHA Q54 bo'limga xos shablon — mutaxassis ajratish ochiq) · TASDIQ-2146 §01 #01.140
- **Dalil (kod):** `card-template.repository.ts` `position_type` — erkin matn ustuni (u "mutaxassis" qiymatini saqlashi mumkin); `card-template.service.ts:68-89` `applyTemplate()` to'liq ulangan (whitelist-merge `field_defaults` → `CardInput`); `SELECT count(*) FROM card_templates` → **0 qator**.
- **Nima yetishmaydi:** mutaxassis-maxsus shablon seed'i yo'q; tех-karta/loyiha bilan bog'langan ЦКП turi alohida modellanmagan.
- **Bog'liqlik:** EP-ORG-057, EP-ORG-059, EP-ORG-143
- **action:** CREATE
- **⤳ Ta'sir:** Org, LMS
- **Xoch-havolalar:** `[Module-01] Item #140` · `EXTRACTION QISM C #01.140`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-141 · Karta holatlari — to'liq ro'yxat (kitob hayot-sikli)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Onboarding bosqichlari (qoralama→tasdiqlangan→o'qish→imtihon→faol→vakant→muzlatilgan→arxiv) status ro'yxatiga qo'shiladi.
- **Manba:** BARCHA_JAVOBLAR Q91 (sinov muddati bosqichlari) + KARTALAR-A Q5/Q6 + EP-ORG-115 · TASDIQ-2146 §01 #01.141
- **Dalil (kod):** `card.controller.ts:35` `status` enum aynan `['active','frozen','vacant','archived','io']` — 5 lifecycle holati; enum'da ham, modulda ham qo'shimcha onboarding-bosqich qiymatlari (masalan `draft`/qoralama) yo'q.
- **Nima yetishmaydi:** 8-bosqichli onboarding hayot-sikli enum'ga qo'shilmagan; bosqichli oylik shu enumsiz qurilmaydi (EP-ORG-115).
- **Bog'liqlik:** EP-ORG-083 (5 holat), EP-ORG-115, EP-ORG-126 (tasdiqlangan holati imzoga bog'liq)
- **action:** CREATE
- **⤳ Ta'sir:** HR onboarding, Oylik (bosqichli)
- **Xoch-havolalar:** `[Module-01] Item #141` · `[Module-01] Item #83` · `EXTRACTION QISM C #01.141`
- **Δ 2026-07-11→08-07:** —

### EP-ORG-142 · Ko'p-karta oylik yig'ish qoidasi (suiiste'molni oldini olish)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Asosiy karta to'liq + qo'shimcha kartalar belgilangan foiz (30-50%) — adolatli, nazoratli. (KARTALAR-A Q4 "oylik=yig'indi" vizyoni bilan owner yakuniy formulani tasdiqlasin.)
- **Manba:** yangi (KARTALAR-A Q4 — yig'ish formulasi/nazorati ochiq; EP-ORG-066 bilan) · TASDIQ-2146 §01 #01.142
- **Dalil (kod):** `card.repository.ts:480-512` `listEmployeeCards()`/`employeeSalaryTotal()` — "FORMULA A": barcha faol, i.o.-bo'lmagan kartalarning `max_salary` yig'indisi + `acting_supplement` yig'indisi; cap yo'q, ikkilamchi-karta uchun 30-50% pog'onali chegirma YO'Q.
- **Nima yetishmaydi:** egasi yakuniy formulani tasdiqlamagan (🔵) — kod "yig'indi" variantini tanlagan, vizyon-tavsiya esa "asosiy 100% + qo'shimcha 30-50%" deydi.
- **Bog'liqlik:** EP-ORG-004, EP-ORG-066 (stavka cap), [Module-01] Item 46
- **action:** APPROVE
- **⤳ Ta'sir:** Payroll (yig'ish formulasi), AI (ish yuki tahlili)
- **Xoch-havolalar:** `[Module-01] Item #142` · `[Module-01] Item 12` · `EXTRACTION QISM C #01.142` · `QISM C Step-3 (ochiq savol)`
- **⚠️ ZIDDIYAT:** kod "FORMULA A = tekis yig'indi (capsiz)" vs EP-ORG-142 tavsiyasi "asosiy to'liq + qo'shimcha 30-50%" vs EP-ORG-066 "stavka ulushi jami ≤1.0". Uch xil model bir vaqtda hujjatlangan; `checkStakeCap()` faqat ≤1.0 variantini enforce qiladi. Egasi bittasini tanlashi shart.
- **Δ 2026-07-11→08-07:** —

### EP-ORG-143 · Karta shabloni — lavozim-turi bo'yicha tayyor zagotovka
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Lavozim-turi shablonlari (operator/rahbar/mutaxassis), umumiy bo'limlar oldindan to'lgan, faqat xos qism qo'shiladi.
- **Manba:** BARCHA_JAVOBLAR Q54 (global + bo'limga xos shablon) + Q143 (avto-shablon) · TASDIQ-2146 §01 #01.143
- **Dalil (kod):** `card-template.service.ts:21-25` `CARD_FIELD_KEYS` whitelist + `applyTemplate()` `field_defaults` jsonb ustida to'liq ulangan; `SELECT count(*) FROM card_templates` → **0 qator** — operator/rahbar/mutaxassis seed shablonlari hali yo'q.
- **Nima yetishmaydi:** faqat seed (egasi/HR DATA) — mexanizm tayyor.
- **Bog'liqlik:** EP-ORG-057, EP-ORG-059, EP-ORG-140
- **action:** CREATE
- **⤳ Ta'sir:** HR (karta yaratish), AI
- **Xoch-havolalar:** `[Module-01] Item #143` · `[Module-01] Item #65` · `EXTRACTION QISM C #01.143`
- **Δ 2026-07-11→08-07:** —

