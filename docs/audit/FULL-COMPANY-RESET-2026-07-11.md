# To'liq kompaniya-ma'lumot reset — 2026-07-11

## Sabab
Egasi: bazadagi jonli ma'lumot (org-struktura, xodimlar, mijozlar, mashinalar...) **boshqa/generik
namuna kompaniya** edi, EuroPrint'ning haqiqiy tuzilmasi emas. Qaror: **"0 dan qurish"** — barcha
namuna kompaniya-ma'lumoti o'chirilsin, mexanizm (CRUD, lug'at, sozlamalar) saqlansin, egasi haqiqiy
kompaniyani CRUD orqali bittalab kiritadi.

## Xavfsizlik choralari (bajarilgandan oldin)
1. **To'liq pg_dump backup** olindi (`europrint-backup-2026-07-11.sql`, 15 MB, `%TEMP%`).
2. Har bir DELETE/UPDATE/ALTER **SAVEPOINT** ichida — bitta statement xato bersa ham butun
   tranzaksiya buzilmaydi (birinchi urinishda aynan shu sabab bilan xato chiqdi, tuzatildi).
3. Avval **DRY-RUN** (ROLLBACK bilan) — reja va sonlarni tasdiqlagandan keyingina `--apply`.
4. FK orphan-tozalash pass: KEEP jadvalidagi qator o'chirilgan jadvalga ishora qilsa → NULL qilinadi
   (nullable bo'lsa) yoki HARD BLOCK (NOT NULL bo'lsa — bu holda avtomatik ROLLBACK, tasnif xato
   deb belgilanadi). Amalda faqat 1 ta orphan chiqdi (`adaptation_programs.org_department_id`).

## Tasniflash metodologiyasi
255 ta to'la (populated) jadval, 1098 jadval jami. Har biri **KEEP** (industriya-standart
ma'lumotnoma/konfiguratsiya/egasi-lug'ati — istalgan EuroPrint-tur kompaniya uchun qayta
ishlatiladi) yoki **WIPE** (aynan shu kompaniyaning odam/mashina/mijoz/tranzaksiya/log ma'lumoti)
deb belgilandi. Ko'p-agentli workflow'ning asosiy pipeline'i texnik xato berdi (args threading
bug — 0 jadval klassifikatsiya qildi), LEKIN uning completeness-critic bosqichi mustaqil ravishda
bazani skanerladi va 32 ta KEEP jadvalni DB-namuna bilan asoslab topdi. Shundan keyin qolgan
jadvallarni qo'lda, xuddi shu rubrika bilan (10+ shubhali holat DB'dan namuna olib) tasnifladim.

## Natija
- **users**: 32 → **1** (faqat `admin`, id=1, super_admin — login saqlanadi)
- **200 jadval WIPE** qilindi, **45,450 qator o'chirildi**
- **55 jadval KEEP** qilindi (mexanizm+lug'at+config):
  taxonomy_entries(96), business_settings(56), accounts(42), gl_account_mappings, state_thresholds,
  defect_catalog, fine_rules, unit_of_measures, units, mes_downtime_reasons, badge_catalog,
  cc_rejection_reasons, pos_movement_types, violation_catalog, warehouse_types,
  count_deviation_reasons, material_categories, crm_lead_stages, kpi_definitions, razryad_levels,
  company_state_levels, leave_types, pp_flute_types, strategic_categories, currencies,
  exchange_rates, finance_categories, kpi_score_weights, qc_grade_price_coefficients,
  payroll_tax_rules, notification_routing_rules, shift_types, income_split_config,
  approval_matrix_config, gofra_config, pos_variance_config, agent_modules_registry, modules,
  cfo_config, cc_document_templates, document_workflow_routes, crm_inactivity_rules, mro_settings,
  questionnaire_templates, wms_settings, ai_provider_configs, chat_emoji_packs,
  notification_schedules, sd_price_formulas, mes_oee_targets, sd_machine_format_prices,
  company_functions, qc_parameters, cc_workflow_steps, adaptation_programs.
- Sequence reset: barcha wiped jadval `id` ketma-ketligi 1 dan qayta boshlanadi (bitta istisno,
  zararsiz: `micro_module_views` da `id` ustuni yo'q — sequence reset o'tkazib yuborildi).
- Backend health ✅ (`/api/auth/health` OK), login sahifa ✅ render bo'ladi.

## Egasi keyingi qadami
Admin (`admin@europrint.uz`, id=1) bilan kirib, haqiqiy kompaniyani **CRUD ekranlardan bittalab**
kiritish (org-struktura → xodimlar → mijoz/material/mahsulot → ...). Parol bazadan/CI'dan olinmadi
(xavfsizlik qoidasi — Claude parolni o'qimaydi/kiritmaydi); egasi o'zi biladi yoki reset qiladi.

## Rollback (agar kerak bo'lsa)
```
psql -h 127.0.0.1 -U postgres -d europrint -f "<TEMP>/europrint-backup-2026-07-11.sql"
```
