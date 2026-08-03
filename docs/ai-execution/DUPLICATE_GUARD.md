# DUBLIKAT GUARD

> Yangi table/endpoint/service/page yaratishdan oldin mavjudni qidirish jurnali.
> Format: prompt_id | qidirilgan | topildi (fayl/jadval) | qaror (extend/duplicate/new)

| prompt_id | Qidirildi | Topildi | Qaror |
|---|---|---|---|
| PROMPT-0001..0004 | ЦКП payroll kunlik-gate (ckp_fact_values + deadline) | CkpGateService (hr/payroll/ckp-gate.ts) + payroll.service.ts:106,452 (evaluatePeriod WIRED) | duplicate — mavjud kanonik gate; yangi CkpPayrollGateService o'chirildi |
| PROMPT-0005..0008 | AI daily ЦКП question → ckp_fact_values | ai-daily-report.cron/service/controller (ai.module:144,147), source='AI_CHAT' | duplicate — qurilgan+ulangan |
| PROMPT-0009..0012 | IoT/MES auto-feed → ckp_fact_values | ckp-mes-feed.listener.ts @OnEvent MES_COMPLETED + operator-hourly-invoice.cron | duplicate — qurilgan+ulangan |
| PROMPT-0013..0016 | tskp_target set/config | card.controller:37 + org-mutations.repo:82 + org-structure.controller:65 (config BOR) | blocked owner-data B2 — mexanizm bor, data yo'q (0/139); fabrikatsiya taqiq |
| PROMPT-0045..0060,0085..0088,0113..0120 | ЦКП area qolgan P0 (AI-savol/MES-feed/kaskad/gate/jadval/ikki-table) | ai-daily-report, ckp-mes-feed.listener, ckp-cascade.listener, CkpGateService, ckp_fact_values(mavjud), employee-kpi-acl(compat) | duplicate — butun ЦКП-area qurilgan/hal |
| PROMPT-0173..0388 (P0, ЦКП qoldiq + AREA2 HR/karta) | card_id/login-gate/card-payroll/ckp-columns/employee_cards-assign | users.card_id, login.service+card-gate-precheck, payroll.service:400, org_departments ckp cols, CardAssignDialog.tsx | duplicate (qurilgan, ko'pi env-OFF=owner-enable); 0317-0320 blocked B3 card-salary |
| PROMPT-0977..0980 | pp_reason_codes | YANGI QURILDI (jadval+seed+repo+controller) | done — live HTTP PASS |
| PROMPT-0929..1164 (PP+golden-thread P0) | status-log/plan-fact/card_id/outbox/MES-QC | qisman: AI-planning/SD-PP-listener BOR (dup); pp_order_status_log/plan_fact/card_id/outbox-wiring YO'Q (pending genuine) | aralash |
| PROMPT-0977..0980 (TO'G'IRLASH) | PP sabab-kodlari | mes_downtime_reasons(7row,wired)+downtime_reason_codes KANONIK | pp_reason_codes QURILDI→REVERT (dublikat); semantik-dedup faqat exact-nom emas, MES/downtime jadvallarni ham tekshirish kerak |
| PROMPT-0969..0976 (TO'G'IRLASH) | status-log + plan/fact | production_order_status_log + production_facts MAVJUD | duplicate (nom boshqacha edi) |
| P1 (1532 prompt, 383 noyob×4) | barcha area | P0 bilan AYNAN bir naqsh — kodbaza ~to'liq | duplicate/owner-data/FE-polish; individual katalog past-qiymatli (P0 isboti yetarli) |
