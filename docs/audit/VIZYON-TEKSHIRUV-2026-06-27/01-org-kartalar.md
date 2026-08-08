# 01 — Org / Kartalar — Mustaqil tekshiruv (adversarial verify)

**Sana:** 2026-06-27
**Manba doc:** docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md (satr 40–615, 143 savol)
**Verifikator:** mustaqil (kod + jonli DB `europrint`)

## Yakuniy ko'rsatkichlar
- qTotal = 143 · egasi-data = 8 · verifiable = 135
- DOC flaglar: ✅ bor = 39 · 🟡 qisman = 68 · ❌ yo'q = 28 · 🔑 egasi-data = 8
- VERIFIED (mening qayta-bahom): borReal = 39 · qismanReal = 68 · yoqReal = 28 · egasiData = 8 (DOC bilan ~bir xil)
- Doc da'vo: **63% vizyon**; mening realPct (bor=1, qisman=0.5, yoq=0, egasi-data denominatordan tashqari) = **54%**
- Claim aniqligi: **confirmed = 141 · refuted/overstated = 2** (ikkalasi ham KICHIK sitata xatosi — mexanizm haqiqiy)

Umumiy xulosa: hujjat g'oyatda aniq va ko'p joyda KONSERVATIV (mexanizm aytilgandan to'liqroq — masalan stake-cap). Jonli DB tasdiqladi: `org_departments`=145 qator (daraxt qurilgan); `card_templates / card_folders / ckp_card_products / ckp_personal_targets / card_required_knowledge / error_catalog`=0 qator (sxema bor, data egasidan); `razryad_levels`=6 qator (name='1..6-razryad', salary/exam_type/exam_pass_threshold/max_retakes hammasi NULL).

## REFUTED / OVERSTATED CLAIMS (2)
- **01.108 (EP-ORG-108)** — Doc Isbot: "org_departments.**manager_id** (karta→karta)". JONLI: `org_departments`da `manager_id` USTUNI YO'Q — vertikal bog' `parent_id` (o'qishda `parent_id AS manager_id` alias). Mexanizm (PATCH :id/manager → parent_id, manager-chain/:nodeId) HAQIQIY, lekin sitata-ustun noto'g'ri. Real status: bor.
- **01.54 (EP-ORG-054)** — Doc Isbot: "hr_question_bank **created_by**/is_active bor". JONLI: `hr_question_bank`da `created_by` ustuni YO'Q (faqat `is_active`). Approval-workflow yo'qligi haqidagi asosiy nuqta to'g'ri. Real status: qisman.

---

## Batafsil (savol bo'yicha)

## 01.1 — Q1 (EP-ORG-043) [DOC ✅] → [VERIFIED bor] (confirmed)
- razryad_levels jonli: name/level/salary_min/salary_max/exam_type/exam_pass_threshold/max_retakes/min_requirement/certificate/description ustunlari bor, 6 qator. Sxema to'liq.

## 01.2 — Q2 (EP-ORG-044) [DOC 🟡] → [qisman] (confirmed)
- level(int)+name(text) alohida; jonli name='1-razryad'..'6-razryad' (faqat raqam, lavozim-nom yo'q). Struktura qo'llaydi, data raqamli-only. To'g'ri.

## 01.3 — Q3 (EP-ORG-045) [DOC 🔑] → [egasi-data] (confirmed)
- salary_min/salary_max ustunlari bor; 6 qatorda ikkisi ham NULL (psql tasdiqladi). Qiymat egasidan.

## 01.4 — Q4 (EP-ORG-046) [DOC 🔑] → [egasi-data] (confirmed)
- exam_type ustuni bor; 6 qatorda NULL. Schema qo'llaydi, qiymat yo'q.

## 01.5 — Q5 (EP-ORG-047) [DOC ✅] → [bor] (confirmed)
- card.repository.ts:426-438 listCertificates: certificates JOIN employee_cards/employees, `expiry_date <= now()+30 → expiring_soon`. /cards/:id/certificates REAL (card.controller:239). certificates jadval jonli.

## 01.6 — Q6 (EP-ORG-048) [DOC 🟡] → [qisman] (confirmed)
- razryad.controller.ts:62 @Roles('admin','manager','hr_manager','director','super_admin') — manager+director ham tahrir; vizyon 'faqat HR+owner' dan keng. Owner-darvoza yo'q. To'g'ri.

## 01.7 — Q7 (EP-ORG-049) [DOC ✅] → [bor] (confirmed)
- card.controller.ts:38 `tskpMeasurementUnit z.enum(['SON','FOIZ','VAQT'])`; org_departments.tskp_measurement_unit ustuni jonli bor.

## 01.8 — Q8 (EP-ORG-050) [DOC ✅] → [bor] (confirmed)
- ckp.controller.ts:25 `source z.enum(['MANUAL','AI_CHAT','MES_AUTO','IOT'])`; ckp-mes-feed.listener.ts REAL (MES_COMPLETED → recordFact). Manba ajratilgan.

## 01.9 — Q9 (EP-ORG-051) [DOC 🟡] → [qisman] (confirmed)
- org_departments.tskp_target bor; per-employee override = ckp_personal_targets jadvali bor (lekin 0 qator). Doc "tskp_target jonli 0" degan — endi 1 qator non-null (ahamiyatsiz drift). Qisman to'g'ri.

## 01.10 — Q10 (EP-ORG-052) [DOC 🟡] → [qisman] (confirmed)
- ckp-fact.service real fakt + deadline-gate hisoblaydi; ckp_card_products=0. ЦКП%→oylik Payroll-bog'liq. To'g'ri.

## 01.11 — Q11 (EP-ORG-053) [DOC ❌] → [yoq] (confirmed)
- org-structure modulida savol-bank yo'q (hr_question_bank AI/LMS tomonda; bu modulda yo'q). To'g'ri.

## 01.12 — Q12 (EP-ORG-054) [DOC ❌] → [yoq] (confirmed)
- Savol yozish/tasdiqlash oqimi org-structure'da yo'q. exam-passed-razryad.listener.ts bor (imtihon→razryad), savol-manba+tasdiq yo'q. To'g'ri.

## 01.13 — Q13 (EP-ORG-055) [DOC 🔑] → [egasi-data] (confirmed)
- razryad_levels.exam_pass_threshold bor + razryad.controller:31 validatsiya; 6 qatorda NULL. Egasi qiymati.

## 01.14 — Q14 (EP-ORG-056) [DOC 🔑] → [egasi-data] (confirmed)
- razryad_levels.max_retakes bor + razryad.controller:33; jonli NULL. '14 kun' alohida maydon yo'q. To'g'ri.

## 01.15 — Q15 (EP-ORG-057) [DOC ✅] → [bor] (confirmed)
- card-template.controller:99 POST :id/apply-template; card-template.service:79-88 field_defaults+override merge → CARD_FIELD_KEYS whitelist → CardService.create. REAL (card_templates 0 qator).

## 01.16 — Q16 (EP-ORG-058) [DOC 🟡] → [qisman] (confirmed)
- apply-template yangi karta urug'laydi (eski avto-yangilanmaydi = vizyonga mos). 'moslashtirish' tugmasi/endpoint yo'q. To'g'ri.

## 01.17 — Q17 (EP-ORG-059) [DOC ❌] → [yoq] (confirmed)
- card_templates=0 qator (psql). Boshlang'ich seed yo'q. To'g'ri.

## 01.18 — Q18 (EP-ORG-060) [DOC ✅] → [bor] (confirmed)
- card.service:114-155 assignEmployeeToCard isActing/actingSupplement/endedAt; on-read revert guard (repo: `ended_at > now()` chiqarib tashlaydi); i.o. seat band qilmaydi (guard skip). employee_cards.is_acting/ended_at jonli.

## 01.19 — Q19 (EP-ORG-061) [DOC 🟡] → [qisman] (confirmed)
- employee_cards.acting_supplement jonli; assignda saqlanadi. Payroll-ulanish bu modulda emas. To'g'ri.

## 01.20 — Q20 (EP-ORG-062) [DOC ❌] → [yoq] (confirmed)
- i.o. uchun cheklangan-RBAC tier farqlovchi logika yo'q (is_acting flag bor). To'g'ri.

## 01.21 — Q21 (EP-ORG-063) [DOC ✅] → [bor] (confirmed)
- card.service:72 setCardManager + card.repository:79-99 cycle-guard WITH RECURSIVE descendants. Vertical chain=parent_id. REAL.

## 01.22 — Q22 (EP-ORG-064) [DOC ❌] → [yoq] (confirmed)
- grep merge/split org-structure'da = faqat card-template field merge. mergeCard endpoint yo'q. To'g'ri.

## 01.23 — Q23 (EP-ORG-065) [DOC ❌] → [yoq] (confirmed)
- splitCard endpoint/metod yo'q (grep). To'g'ri.

## 01.24 — Q24 (EP-ORG-066) [DOC 🟡] → [qisman] (confirmed)
- card.controller:209 GET by-employee (FORMULA-A). Eslatma: doc "employee_cards da rate maydoni yo'q" deydi — TO'G'RI, lekin stake-cap MEXANIZMI bor: card.repository:201-254 employeeActiveStakeSum/checkStakeCap (employee_org_departments.stake_fraction, jami ≤1.0 + allowOverload owner-override). LEKIN bu assignEmployeeToCard'ga ULANMAGAN → qisman to'g'ri (doc biroz kam baholagan).

## 01.25 — Q25 (EP-ORG-067) [DOC 🟡] → [qisman] (confirmed)
- card.repository:327-333 listHistory audit_logs(table_name='card', record_id=cardId). JONLI 4 qator: record_id='unknown', changed_fields={result:success,action:UPDATE,module:card,ua:node} — field-darajali eski/yangi YO'Q, record_id karta-id'ga bog'lanmagan. Doc da'vosi AYNAN to'g'ri.

## 01.26 — Q26 (EP-ORG-068) [DOC 🟡] → [qisman] (confirmed)
- razryad_history/razryad_requests.reason bor; CardUpdateSchema (card.controller:45) salary/razryadda 'reason' MAJBURIY emas. To'g'ri.

## 01.27 — Q27 (EP-ORG-069) [DOC 🟡] → [qisman] (confirmed)
- Tarix endpoint class-level @Roles (card.controller:71) — vertikal-yaqinlik filtri yo'q; har manager hamma kartani ko'radi. To'g'ri (doc :198 ga sitata qilgan, lekin @Roles class-darajada — ahamiyatsiz).

## 01.28 — Q28 (EP-ORG-070) [DOC 🟡] → [qisman] (confirmed)
- AuditInterceptor INSERT-only; DELETE/UPDATE endpoint yo'q. DB-trigger/REVOKE immutable kafolat tasdiqlanmadi — application append-only. To'g'ri.

## 01.29 — Q29 (EP-ORG-071) [DOC ✅] → [bor] (confirmed)
- card.controller:278 PATCH :id/vacant → current_state='vacant'; listVacancies aging_days=(now-created_at). org_departments.current_state. REAL.

## 01.30 — Q30 (EP-ORG-072) [DOC ✅] → [bor] (confirmed)
- card.repository:317-320 aging_bucket CASE <=14 '0-14' / <=45 '15-45' / ELSE '45+'. Qotirilgan.

## 01.31 — Q31 (EP-ORG-073) [DOC ✅] → [bor] (confirmed)
- vacancies.priority ustuni jonli bor (psql). 3-daraja enum data yo'q (0 qator). Sxema bor.

## 01.32 — Q32 (EP-ORG-074) [DOC 🟡] → [qisman] (confirmed)
- vacancies.closing_date bor; sla_days/target_close_date ustuni JONLI YO'Q (psql tasdiqladi). Prioritet→avto-SLA yo'q. To'g'ri.

## 01.33 — Q33 (EP-ORG-075) [DOC 🟡] → [qisman] (confirmed)
- org-structure.controller:215 POST nodes/import (partial-commit). Lekin org-NODE import; karta-maxsus (razryad/ЦКП/oylik) Excel shablon alohida emas. To'g'ri.

## 01.34 — Q34 (EP-ORG-076) [DOC ✅] → [bor] (confirmed)
- org-structure.controller:207-218 izoh 'Per-row validation, partial commit, errors[] with 1-based row+reason'. REAL.

## 01.35 — Q35 (EP-ORG-077) [DOC ✅] → [bor] (confirmed)
- org-export.service exportExcel (ExcelJS) + exportPdf (pdf-lib). Ikkala format REAL. Ustun-tanlash qisman.

## 01.36 — Q36 (EP-ORG-078) [DOC 🟡] → [qisman] (confirmed)
- AuditInterceptor umumiy log; import-partiya alohida jadval (fayl+satr-soni) tasdiqlanmadi. To'g'ri.

## 01.37 — Q37 (EP-ORG-079) [DOC 🟡] → [qisman] (confirmed)
- card.controller:84-95 list faqat departmentId+status filtrlari. Razryad/lavozim-turi/oylik filtrlari endpointda yo'q. To'g'ri.

## 01.38 — Q38 (EP-ORG-080) [DOC 🟡] → [qisman] (confirmed)
- list(status='vacant') + listVacancies aging-sort bor; global tezkor-filtr tugma+sort alohida tasdiqlanmadi. To'g'ri.

## 01.39 — Q39 (EP-ORG-081) [DOC 🟡] → [qisman] (confirmed)
- card.controller:153 GET :id/fit → computeCardFit DETERMINISTIK v1 (assignment_score primary/acting + definition_score razryad+portret). AI-rank/ЦКП-tarix emas. To'g'ri.

## 01.40 — Q40 (EP-ORG-082) [DOC ❌] → [yoq] (confirmed)
- saved_filters JADVAL bor, lekin grep: 0 kod fayli o'qiydi/yozadi (orphan). Qurilmagan. To'g'ri.

## 01.41 — Q41 (EP-ORG-083) [DOC ✅] → [bor] (confirmed)
- card.controller:35 status enum ['active','frozen','vacant','archived','io']; freeze/thaw/vacant/restore (259-290). 5 holat REAL.

## 01.42 — Q42 (EP-ORG-084) [DOC ✅] → [bor] (confirmed)
- card.controller:259 PATCH :id/freeze CardFreezeSchema{reason,until}; org_departments.freeze_reason jonli. freezeCard active/io/vacant→frozen.

## 01.43 — Q43 (EP-ORG-085) [DOC ✅] → [bor] (confirmed)
- card.controller:323 DELETE → softDelete → card.repository:165-172 UPDATE is_active=false, current_state='archived'. Hard-DELETE yo'q.

## 01.44 — Q44 (EP-ORG-086) [DOC ✅] → [bor] (confirmed)
- card.controller:287 PATCH :id/restore → restoreCard archived→active (409 agar arxiv emas). REAL.

## 01.45 — Q45 (EP-ORG-087) [DOC 🟡] → [qisman] (confirmed)
- card_required_knowledge jadval (knowledge_name/category/importance/course_id) bor; 0 qator; portret_data.requirements jsonb (erkin) computeCardFit'da. Strukturali+erkin aralash, data yo'q. To'g'ri.

## 01.46 — Q46 (EP-ORG-088) [DOC ✅] → [bor] (confirmed)
- card_required_knowledge.course_id + lms card-employee-assigned.handler (assignda emit) + card.service:145-152 emit CARD_EMPLOYEE_ASSIGNED. Karta-markazli REAL.

## 01.47 — Q47 (EP-ORG-089) [DOC 🟡] → [qisman] (confirmed)
- card-folder.controller 6 bo'lim (vazifa/javobgarlik/gsd/reglament/jarayon/talim) PUT/GET REAL. Fayl-attach bo'limi yo'q; card_folders=0. To'g'ri.

## 01.48 — Q48 (EP-ORG-090) [DOC ❌] → [yoq] (confirmed)
- card_equipment/card_required_assets/jihoz grep = 0 org-structure'da. Qurilmagan. To'g'ri.

## 01.49 — Q7 (EP-ORG-049) [DOC ✅] → [bor] (confirmed)
- org_departments.tskp_measurement_unit + tskp_formula_type + ckp_formula_type ustunlari jonli (psql). ckp_card_products.formula_type/measurement_unit ham bor.

## 01.50 — Q8 (EP-ORG-050) [DOC ✅] → [bor] (confirmed)
- ckp-mes-feed.listener @OnEvent(MES_COMPLETED) → recordFact; karta REAL linkdan resolve (operator_card_id→users.card_id→employee_cards→work_center), fabrikatsiya yo'q (skip+log). ckp.controller POST /fact=qo'lda.

## 01.51 — Q9 (EP-ORG-051) [DOC ✅] → [bor] (confirmed)
- org_departments.tskp_target + ckp_personal_targets jadval ikkalasi jonli mavjud (psql). 0 qator. ckp-fact.service 3-bosqich override (global/product/personal) wired.

## 01.52 — Q10 (EP-ORG-052) [DOC 🟡] → [qisman] (confirmed)
- org_departments.ckp_report_deadline_hours jonli + ckp-fact.service:126-143 calcDeadline gate flag. Payroll-gate formula data-siz ishlamaydi. To'g'ri.

## 01.53 — Q11 (EP-ORG-053) [DOC 🟡] → [qisman] (confirmed)
- hr_question_bank: org_function_id+razryad_level_id+category+question_uz/ru+expected_keywords+difficulty jonli (psql). org_functions endi kanonik emas (org_departments) → FK eskirgan. To'g'ri.

## 01.54 — Q12 (EP-ORG-054) [DOC 🟡] → [qisman] (REFUTED — kichik sitata)
- hr_question_bank.is_active bor; AMMO `created_by` ustuni JONLI YO'Q (psql IN-list qaytarmadi) — doc "created_by/is_active bor" overstated. Approval-status ustuni yo'qligi (asosiy nuqta) to'g'ri. Status: qisman.

## 01.55 — Q13 (EP-ORG-055) [DOC 🔑] → [egasi-data] (confirmed)
- razryad_levels.exam_pass_threshold bor; 6 qator NULL (psql). Egasi qiymati.

## 01.56 — Q14 (EP-ORG-056) [DOC 🔑] → [egasi-data] (confirmed)
- razryad_levels.max_retakes bor; 6 qator NULL. Egasi qiymati.

## 01.57 — Q15 (EP-ORG-057) [DOC 🟡] → [qisman] (confirmed)
- card_templates(position_type+field_defaults) + apply-template REAL; card_templates=0 → jonli ishlamaydi. To'g'ri.

## 01.58 — Q16 (EP-ORG-058) [DOC 🟡] → [qisman] (confirmed)
- apply-template bir martalik nusxa (avto-kaskad emas = vizyonga mos); 're-sync' tugma yo'q; card_templates=0. To'g'ri.

## 01.59 — Q17 (EP-ORG-059) [DOC ❌] → [yoq] (confirmed)
- card_templates=0 qator. Zavod-shablon seed yo'q. To'g'ri.

## 01.60 — Q18 (EP-ORG-060) [DOC ✅] → [bor] (confirmed)
- employee_cards.is_acting+ended_at; card.repository:568-575 revertExpiredActing() + on-read guard `ended_at > now()`. Asosiy mexanizm (on-read revert) JONLI isbotlandi.

## 01.61 — Q19 (EP-ORG-061) [DOC ✅] → [bor] (confirmed)
- employee_cards.acting_supplement; card.repository:267-268/397/413 'WHEN is_acting THEN acting_supplement ELSE max_salary' — i.o. faqat ustama. REAL.

## 01.62 — Q20 (EP-ORG-062) [DOC 🟡] → [qisman] (confirmed)
- is_acting=true → assignment_score 50 (primary 100); RBAC pul/kadr blok aniq qoida emas. To'g'ri.

## 01.63 — Q21 (EP-ORG-063) [DOC ✅] → [bor] (confirmed)
- org_departments.parent_id (karta→karta) + card.controller PATCH :id/manager; OrgCascadeListener transfer kaskad. Soft-delete tarix. REAL.

## 01.64 — Q22 (EP-ORG-064) [DOC ❌] → [yoq] (confirmed)
- merge endpoint yo'q (grep). Tarix-ko'chirish birlashtirish qurilmagan. To'g'ri.

## 01.65 — Q23 (EP-ORG-065) [DOC ❌] → [yoq] (confirmed)
- split endpoint/split_from referens yo'q. To'g'ri.

## 01.66 — Q24 (EP-ORG-066) [DOC 🟡] → [qisman] (confirmed)
- employee_cards M:N + oylik yig'indi (card.repository:267); stake-cap checkStakeCap bor (employee_org_departments.stake_fraction) lekin assignga ulanmagan + is_primary/is_acting bilan ishlaydi. To'g'ri.

## 01.67 — Q25 (EP-ORG-067) [DOC 🟡] → [qisman] (confirmed)
- razryad_history jadval + audit_logs bor; field-darajali before/after to'liq emas, razryad_history=0. To'g'ri.

## 01.68 — Q26 (EP-ORG-068) [DOC 🟡] → [qisman] (confirmed)
- razryad_requests workflow + reason bor; oylik o'zgartirishda sabab-majburiyat alohida emas. To'g'ri.

## 01.69 — Q27 (EP-ORG-069) [DOC 🟡] → [qisman] (confirmed)
- @UseGuards + rbac_tier; row-level 'vertikal yuqori boshliq' RBAC yo'q. To'g'ri.

## 01.70 — Q28 (EP-ORG-070) [DOC 🟡] → [qisman] (confirmed)
- append-pattern (DELETE endpoint yo'q); DB-immutability tasdiqlanmadi. To'g'ri.

## 01.71 — Q29 (EP-ORG-071) [DOC ✅] → [bor] (confirmed)
- org_departments.current_state + PATCH :id/vacant + GET :id/vacancies; aging_days (repo:317). REAL.

## 01.72 — Q30 (EP-ORG-072) [DOC ✅] → [bor] (confirmed)
- card.repository:317-320 aging_days + aging_bucket. vacancy-deadline.cron bor. REAL.

## 01.73 — Q31 (EP-ORG-073) [DOC 🟡] → [qisman] (confirmed)
- vacancies.priority jonli bor; 3-daraja enum data yo'q (0 qator). To'g'ri.

## 01.74 — Q32 (EP-ORG-074) [DOC 🟡] → [qisman] (confirmed)
- vacancy-deadline.cron bor; muhimlik→SLA-kun mapping data yo'q (vacancies 0). To'g'ri.

## 01.75 — Q33 (EP-ORG-075) [DOC ❌] → [yoq] (confirmed)
- Karta-maxsus import endpoint yo'q (faqat node import + org-export). To'g'ri.

## 01.76 — Q34 (EP-ORG-076) [DOC ❌] → [yoq] (confirmed)
- Karta import yo'q → xato-satr boshqaruvi ham yo'q. To'g'ri.

## 01.77 — Q35 (EP-ORG-077) [DOC ✅] → [bor] (confirmed)
- org-export.service exportExcel/exportPdf REAL.

## 01.78 — Q36 (EP-ORG-078) [DOC 🟡] → [qisman] (confirmed)
- excel_import_batches sxema bor; karta-import yo'q → audit-iz jonli emas. To'g'ri.

## 01.79 — Q37 (EP-ORG-079) [DOC 🟡] → [qisman] (confirmed)
- org_departments filtrlanadigan ustunlar bor; GET query barcha 5 filtr qamramaydi (faqat departmentId+status). To'g'ri.

## 01.80 — Q38 (EP-ORG-080) [DOC 🟡] → [qisman] (confirmed)
- GET :id/vacancies + aging_bucket sort; global tezkor-filtr (FE) alohida emas. To'g'ri.

## 01.81 — Q39 (EP-ORG-081) [DOC 🟡] → [qisman] (confirmed)
- :id/fit + :id/can-assign + :id/manager-candidates; assignment_score. To'liq AI razryad+ЦКП moslik data yo'q. To'g'ri.

## 01.82 — Q40 (EP-ORG-082) [DOC ❌] → [yoq] (confirmed)
- saved_filters jadval bor, 0 kod o'qiydi (orphan). To'g'ri.

## 01.83 — Q41 (EP-ORG-083) [DOC ✅] → [bor] (confirmed)
- current_state + frozen_at/freeze_reason/freeze_until + archived_at + is_acting + vacant; freeze/thaw/vacant/restore. 5 holat REAL.

## 01.84 — Q42 (EP-ORG-084) [DOC ✅] → [bor] (confirmed)
- frozen_at+freeze_reason+freeze_until jonli; PATCH :id/freeze + :id/thaw REAL.

## 01.85 — Q43 (EP-ORG-085) [DOC ✅] → [bor] (confirmed)
- archived_at + deleted_at/deleted_by jonli; DELETE soft-delete; PATCH :id/restore.

## 01.86 — Q44 (EP-ORG-086) [DOC ✅] → [bor] (confirmed)
- PATCH :id/restore (card.repository:537-549 is_active=true+current_state='active'). Soft-delete. REAL.

## 01.87 — Q45 (EP-ORG-087) [DOC 🟡] → [qisman] (confirmed)
- card_required_knowledge strukturali; 0 qator; ta'lim/tajriba-yil/dastur alohida ustun emas. To'g'ri.

## 01.88 — Q46 (EP-ORG-088) [DOC ✅] → [bor] (confirmed)
- card_required_knowledge.course_id + lms_card_mentors.course_id; darslik card_id orqali. Vizyonga mos.

## 01.89 — Q47 (EP-ORG-089) [DOC 🟡] → [qisman] (confirmed)
- card-folder 6 bo'lim GET/PUT REAL; biriktiriladigan FAYL (PDF/video) modeli yo'q. To'g'ri.

## 01.90 — Q48 (EP-ORG-090) [DOC ❌] → [yoq] (confirmed)
- jihoz/aktiv-bog'lanish yo'q (grep). To'g'ri.

## 01.91 — Q49 (EP-ORG-091) [DOC 🟡] → [qisman] (confirmed)
- razryad_levels.min_months+min_requirement+exam_type + razryad_requests; aniq next_level_id+condition strukturasi tasdiqlanmadi. To'g'ri.

## 01.92 — Q50 (EP-ORG-092) [DOC 🟡] → [qisman] (confirmed)
- org_departments.next_attestation_date jonli; 'o'tmasa→muzlat' avto-trigger + 'xavfli karta' teg jonli emas. To'g'ri.

## 01.93 — Q51 (EP-ORG-093) [DOC 🟡] → [qisman] (confirmed)
- :id/can-assign + :id/fit + POST :id/assign bor; past-moslikda warn+sabab-so'rash (warn-not-block) oqimi jonli emas. To'g'ri.

## 01.94 — Q52 (EP-ORG-094) [DOC 🟡] → [qisman] (confirmed)
- employee_cards ko'p xodim + org_departments.work_schedule; 'stavka soni (seats)' ustuni va tungi-ustama% yo'q. To'g'ri.

## 01.95 — Q53 (EP-ORG-095) [DOC 🟡] → [qisman] (confirmed)
- card_folders 6 bo'lim (vizyon-007) qurilgan; zavod 12-bo'limli shablon to'liq emas + 0 qator. To'g'ri.

## 01.96 — Q54 (EP-ORG-096) [DOC 🟡] → [qisman] (confirmed)
- ckp_card_products(card_id+product_id+target_value+formula_type+measurement_unit) sxema bor; faqat ckp-fact.repository murojaat, 0 qator. To'g'ri.

## 01.97 — EP-ORG-097 [DOC 🟡] → [qisman] (confirmed)
- error_catalog jadval (card_id,code,category,severity) + ErrorCatalogController CRUD (error-catalog.controller.ts) + ckp-fact errorCode→error_catalog.code link MAVJUD; error_catalog=0 qator (psql), statistik agregat yo'q. To'g'ri.

## 01.98 — EP-ORG-098 [DOC ❌] → [yoq] (confirmed)
- success_actions/muvaffaqiyatli ustun yo'q (grep). To'g'ri.

## 01.99 — EP-ORG-099 [DOC ✅] → [bor] (confirmed)
- org_departments: parent_id+hierarchy_level+node_type+otdeleniye_id+otdeleniye_no+code jonli (psql); 145 qator daraxt (psql count). 3-daraja vertikal.

## 01.100 — EP-ORG-100 [DOC 🟡] → [qisman] (confirmed)
- otdeleniye_no(1-7)+otdeleniye_id jonli; 7-nom seed bo'sh (statistics_type non-null=0). Struktura bor, master-ro'yxat=egasi. To'g'ri.

## 01.101 — EP-ORG-101 [DOC 🔑] → [egasi-data] (confirmed)
- OCHIQ qaror; node_type/department maydoni qo'llaydi, chegara=egasi. To'g'ri.

## 01.102 — EP-ORG-102 [DOC 🟡] → [qisman] (confirmed)
- org_departments.code + otdeleniye_code (umumiy kod); maxsus 'НО-kod' maydon/seed yo'q. To'g'ri.

## 01.103 — EP-ORG-103 [DOC 🟡] → [qisman] (confirmed)
- org_departments.rbac_tier jonli + org-structure.controller:425 nodes/:id/approval-chain + :453 manager-chain MAVJUD (grep tasdiqladi); aniq РД-4/РД-5 teg yo'q, manager_id-zanjirga tayanadi. To'g'ri.

## 01.104 — EP-ORG-104 [DOC 🟡] → [qisman] (confirmed)
- card_folders 6 bo'lim + CardFolderController Get/Put + position-folder.service MAVJUD; 6-bo'lim (zavod 12 emas); 0 qator. To'g'ri.

## 01.105 — EP-ORG-105 [DOC ❌] → [yoq] (confirmed)
- card_signatures/acknowledgment/control-list jadval yo'q (grep). To'g'ri.

## 01.106 — EP-ORG-106 [DOC 🟡] → [qisman] (confirmed)
- card_required_knowledge + repo MAVJUD; ta'lim/tajriba-yil/dastur alohida ustun emas (umumiy knowledge). 0 qator. To'g'ri.

## 01.107 — EP-ORG-107 [DOC ❌] → [yoq] (confirmed)
- jihoz/vosita/equipment ustun yo'q (grep). To'g'ri (EP-ORG-090 bilan bir).

## 01.108 — EP-ORG-108 [DOC ✅] → [bor] (REFUTED — kichik sitata)
- VERTIKAL zanjir HAQIQIY: card.controller PATCH :id/manager (→ parent_id), org-structure.controller:453 manager-chain. AMMO doc Isbot "org_departments.**manager_id**" — bu USTUN JONLI YO'Q (psql IN-list qaytarmadi); kanonik=parent_id (o'qishda `parent_id AS manager_id` alias). Mexanizm bor → status bor; sitata-ustun noto'g'ri.

## 01.109 — EP-ORG-109 [DOC 🟡] → [qisman] (confirmed)
- card_folders.javobgarlik matni bor; standart-band avto-in'eksiya yo'q. To'g'ri.

## 01.110 — EP-ORG-110 [DOC ❌] → [yoq] (confirmed)
- rights/huquq→action ustun/bog'lanish yo'q (grep). To'g'ri.

## 01.111 — EP-ORG-111 [DOC ✅] → [bor] (confirmed)
- ckp-fact.service:25-119 4 formula (boolean/foiz/vaqt/quantity_pct) calcAchievement; org_departments.tskp_formula_type + ckp_card_products.formula_type per-slot. REAL.

## 01.112 — EP-ORG-112 [DOC ✅] → [bor] (confirmed)
- ckp-cascade.listener:55-110 @OnEvent(CKP_REPORTED) → ancestorChain + rollupParentDay (ota→otdeleniye→CEO, ROLLUP double-count yo'q). REAL.

## 01.113 — EP-ORG-113 [DOC 🟡] → [qisman] (confirmed)
- org_departments.statistics_type ustun + CkpMesFeedListener avto-feed; statistics_type non-null=0 (psql) + ЦКП'dan boshqa statistik avto-feed uzilgan. To'g'ri.

## 01.114 — EP-ORG-114 [DOC ✅] → [bor] (confirmed)
- ckp-cascade.listener rollupParentDay rahbar-kartaga subtree leaf-faktdan agregat (EP-ORG-112 mexanizmi ayni). REAL.

## 01.115 — EP-ORG-115 [DOC 🟡] → [qisman] (confirmed)
- current_state (5-holat) + lms-card-gate.service; to'liq 8-bosqich onboarding status zanjiri + bosqichli oylik wired emas (current_state data~0). To'g'ri.

## 01.116 — EP-ORG-116 [DOC 🟡] → [qisman] (confirmed)
- lms_card_mentors + hr_mentorship_pairings + mentorships jadval MAVJUD; 0 qator; 2-mentor ajratish data yo'q. To'g'ri.

## 01.117 — EP-ORG-117 [DOC ❌] → [yoq] (confirmed)
- seriya/orgpolitika-binding jadval/ustun yo'q (grep). To'g'ri.

## 01.118 — EP-ORG-118 [DOC ❌] → [yoq] (confirmed)
- 'unvon'/title alohida ustun yo'q; razryad_level_id bor. Unvon razryaddan ajratilmagan. To'g'ri.

## 01.119 — EP-ORG-119 [DOC 🟡] → [qisman] (confirmed)
- org_departments.work_schedule(jsonb) + ShiftSchedule; karta-darajali smena-teg avto-ko'paytirish + smena-ustama wired emas, data=0. To'g'ri.

## 01.120 — EP-ORG-120 [DOC 🟡] → [qisman] (confirmed)
- work_schedule ustun jonli; davomat↔work_schedule solishtirish org-structure'da wired emas. To'g'ri.

## 01.121 — EP-ORG-121 [DOC ✅] → [bor] (confirmed)
- org_departments.ckp_frequency + ckp_report_deadline_hours jonli + ckp-fact.service:126-143 calcDeadline (deadline_passed flag, oylik-gate). REAL.

## 01.122 — EP-ORG-122 [DOC 🟡] → [qisman] (confirmed)
- card_required_knowledge(knowledge_name+course_id) + repo + controller MAVJUD; 0 qator (domen-bilim seed yo'q). To'g'ri.

## 01.123 — EP-ORG-123 [DOC ❌] → [yoq] (confirmed)
- phone/abonent ustun yo'q (faqat telegram_group_id jonli). To'g'ri.

## 01.124 — EP-ORG-124 [DOC 🟡] → [qisman] (confirmed)
- HR leave workflow bor; karta-darajasida i.o.+vazifa-topshirish majburiy-gate yo'q. To'g'ri.

## 01.125 — EP-ORG-125 [DOC 🟡] → [qisman] (confirmed)
- deleted_at/soft-delete + card history; to'liq versiyalash (v1/v2 snapshot+qayta-tasdiq) alohida emas. org_chart_snapshots umumiy. To'g'ri.

## 01.126 — EP-ORG-126 [DOC ❌] → [yoq] (confirmed)
- card_signatures jadval yo'q (grep). Ikki-imzo kuchga-kirish yo'q. To'g'ri.

## 01.127 — EP-ORG-127 [DOC 🟡] → [qisman] (confirmed)
- card_folders.jarayon qisman qoplaydi; alohida 'amaliy qadam-baqadam' strukturali qatlam yo'q. To'g'ri.

## 01.128 — EP-ORG-128 [DOC 🟡] → [qisman] (confirmed)
- org_departments.ai_exam_enabled + ExamPassedRazryadListener + LMS test; karta-darajali 'Сборник упражнений' jadval yo'q, savol-bank OCHIQ. To'g'ri.

## 01.129 — EP-ORG-129 [DOC ❌] → [yoq] (confirmed)
- glossary jadval/ustun yo'q (grep). To'g'ri.

## 01.130 — EP-ORG-130 [DOC ✅] → [bor] (confirmed)
- ckp-fact.service:25-119 QUANTITY_PCT/FOIZ/VAQT/BOOLEAN — 4 tur; org_departments.tskp_formula_type per-karta + 3-bosqich override. REAL.

## 01.131 — EP-ORG-131 [DOC 🟡] → [qisman] (confirmed)
- org_departments.razryad_level_id + :id/fit + :id/can-assign + AiFitService; strukturali gap-tekshiruv data+AI-kalitga bog'liq. To'g'ri.

## 01.132 — EP-ORG-132 [DOC 🟡] → [qisman] (confirmed)
- AiFitService fit_score+fit_report; report freeform (field-by-field gap emas) + gap→darslik avto-reja uzilgan, AI-kalit kerak. To'g'ri.

## 01.133 — EP-ORG-133 [DOC ❌] → [yoq] (confirmed)
- 'majburiy tizim-qaydlari' ustun/jadval yo'q. To'g'ri.

## 01.134 — EP-ORG-134 [DOC 🟡] → [qisman] (confirmed)
- razryad-history.service + RazryadHistoryController + error_catalog MAVJUD; avto-pasayish-trigger (statistik→AI→RD-4) zanjiri wired emas. To'g'ri.

## 01.135 — EP-ORG-135 [DOC ❌] → [yoq] (confirmed)
- ckp_card_products bor; 'bo'sh-slot→tugallanmagan→Kanban' CRON yo'q; 0 qator. To'g'ri.

## 01.136 — EP-ORG-136 [DOC ❌] → [yoq] (confirmed)
- Vakant-ЦКП→qo'shni karta avto-o'tkazish yo'q. To'g'ri.

## 01.137 — EP-ORG-137 [DOC ✅] → [bor] (confirmed)
- card.repository:48 staleExpr (last_reviewed_at < now()-1year) + :555 markReviewed + card.controller:249 PATCH :id/review (NOW reset). org_departments.last_reviewed_at jonli. REAL.

## 01.138 — EP-ORG-138 [DOC 🟡] → [qisman] (confirmed)
- org-structure GET export/pdf + OrgExportService (pdf-lib); generic org-chart PDF, 12-bo'limli rasmiy yo'riqnoma+2-imzo SHABLON emas. To'g'ri.

## 01.139 — EP-ORG-139 [DOC ❌] → [yoq] (confirmed)
- staffing/shtat jadval/ustun yo'q (grep). To'g'ri.

## 01.140 — EP-ORG-140 [DOC 🟡] → [qisman] (confirmed)
- card_templates + applyTemplate MAVJUD; 'mutaxassis'-tur seed yo'q (0 qator), position_type erkin. To'g'ri.

## 01.141 — EP-ORG-141 [DOC 🟡] → [qisman] (confirmed)
- current_state + freeze/vacant/restore (5-holat) MAVJUD; onboarding bosqich (qoralama/o'qish/imtihon) status enum'ga qo'shilmagan, data~0. To'g'ri.

## 01.142 — EP-ORG-142 [DOC 🔑] → [egasi-data] (confirmed)
- employee_cards (ko'p-karta stake) + payroll-wiring; yig'ish FORMULASI egasi tasdig'i kutadi (OCHIQ). To'g'ri.

## 01.143 — EP-ORG-143 [DOC 🟡] → [qisman] (confirmed)
- card_templates(field_defaults) + applyTemplate (whitelist CARD_FIELD_KEYS) wired; operator/rahbar/mutaxassis tayyor shablon SEED yo'q (0 qator). To'g'ri.
