# 05 — Director / Hisobot — Mustaqil Tekshiruv (adversarial)

- Modul: 05 — Director / Hisobot (85 savol)
- Doc self-claim: **58% vizyon qoplama**
- Tekshiruvchi realPct (verifiable, egasi-data chiqarib): **37%**  (bor 9 / qisman 43 / yoq 31 / egasi-data 2)
- Claim accuracy: **confirmed 80 / refuted 5**

## REFUTED / OVERSTATED CLAIMS
Doc strukturaviy da'volari (jadval/ustun/endpoint/servis) deyarli barchasi **TO'G'RI** — bu modulda Isbot juda aniq. Yagona xato turi: bir nechta "data=0 / bo'sh" sub-da'vosi JONLI realdan eskirgan:
- **05.36 / 05.53 / 05.62** — doc "production_orders/sales_orders bo'sh, data=0" deydi; JONLI: `production_orders=7`, `sales_orders=13`, `production_sessions=8`. Bo'sh EMAS (doc kam-baholagan).
- **05.55** — doc production_sessions defect data=0 nazarda tutadi; JONLI `production_sessions=8`.
- **05.49** — doc "/ai-exam stub, real emas" deydi; BE `ai-exam.service.ts` REAL (assignExamToCard/submitAttempt/deleteAttempt repo). Faqat FE route stub.

Eslatma: 05.1 da doc state_thresholds vaznlari (cash0.25/prod0.25/orders0.20/hr0.15/quality0.15) — JONLI `state_thresholds` AYNAN shu; ammo kod `DEFAULT_HOLAT_WEIGHTS`=cash0.30/quality0.10 (ichki nomuvofiqlik, lekin doc ko'rsatgan manba to'g'ri → confirmed).

---

## 05.1 — EP-DIR-001 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Holat formulasi 5 vaznli ko'rsatkichdan?
- Doc Isbot: computeHolat() 5-metrik vaznli; state_thresholds=25; vaznlar cash0.25/prod0.25/orders0.20/hr0.15/quality0.15
- Tekshiruv: `director-holat.service.ts:107` computeHolat + DEFAULT_HOLAT_WEIGHTS (constants:51); state_thresholds=25 qator; `SELECT DISTINCT metric_key,weight` = cash0.25/prod0.25/orders0.20/hr0.15/quality0.15 AYNAN. (kod default boshqacha cash0.30/qual0.10, ammo doc state_thresholds ni to'g'ri keltirgan)

## 05.2 — EP-DIR-002 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Holat chegaralari sozlanadigan master-data?
- Doc Isbot: state_thresholds 25 + Patch /kpi-definitions/:id (155), /kpi-weights/:code (194)
- Tekshiruv: state_thresholds 25 qator (min_value/max_value/weight); dashboard.controller.ts:155 Patch kpi-definitions/:id, :194 Patch kpi-weights/:code. Mexanizm bor, seed-default.

## 05.3 — EP-DIR-003 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Holat kunlik cron 07:00?
- Doc Isbot: cron 06:00 Asia/Tashkent, log=0
- Tekshiruv: company-state-snapshot.cron.ts:40 `@Cron('0 6 * * *',Asia/Tashkent)` → 06:00 (vizyon 07:00 farq); company_state_log=0 qator. INSERT company_state_log (line 77).

## 05.4 — EP-DIR-004 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Holat tarixi grafikda?
- Doc Isbot: company_state_log (state_code/kpis/score_total/detected_at) + history endpoint
- Tekshiruv: cron INSERT (state_code,kpis,score_total,detected_at); director-extended.controller.ts:42 GET company-state/history; company_state_log=0 (bo'sh).

## 05.5 — EP-DIR-005 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Holat yomonlashganda alert?
- Doc Isbot: owner-summary/send config-gated Telegram; real-time delta-alert yo'q
- Tekshiruv: director-root.controller.ts:101 POST owner-summary/send; avtonom holat-delta trigger topilmadi. Qisman.

## 05.6 — EP-DIR-006 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Alertni kim oladi (sababchi karta)?
- Doc Isbot: stat_regulations.owner_card_id + plan-fact; alert-routing yo'q
- Tekshiruv: stat_regulations.owner_card_id FK org_functions mavjud; kartaga-yuborish routing kodi yo'q. Qisman.

## 05.7 — EP-DIR-007 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Kundalik 5-maydonli?
- Doc Isbot: diary_entries daily_state/main_kpi_value/main_issue/solution/tomorrow_plan/carry_over_issues
- Tekshiruv: `\d diary_entries` — 5 maydon + carry_over_issues AYNAN mavjud; 2 qator jonli.

## 05.8 — EP-DIR-008 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Bo'lim rahbarlari ham yozadi (karta-markaz)?
- Doc Isbot: openDiaryForUser→resolveAuthorCard→author_card_id (org_functions.id); jonli=1
- Tekshiruv: diary.service.ts:29 openDiaryForUser, :31 resolveAuthorCard; FK author_card_id→org_functions; jonli 2 qator author_card_id=1.

## 05.9 — EP-DIR-009 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kundalik holat+KPI avtomatik to'ladimi?
- Doc Isbot: getOrCreateToday autofill; jonli daily_state=null
- Tekshiruv: openDiary→getOrCreateToday (line 51); JONLI 2 qator daily_state=NULL, main_kpi_value=NULL (holat-log bo'sh → autofill manbai yo'q).

## 05.10 — EP-DIR-010 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Hal qilinmagan muammo carry-over?
- Doc Isbot: carryOverIssues() + carry_over_issues ustun + getOpenIssues SQL
- Tekshiruv: diary.service.ts:55 carryOverIssues; carry_over_issues jsonb NOT NULL; dashboard-query.repository.ts:152 getOpenIssues real SQL (status='draft' AND main_issue NOT NULL).

## 05.11 — EP-DIR-011 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ideal kartina saqlansin?
- Doc Isbot: ideal_rasm_targets + ensureSeeded()+getAll(); =0
- Tekshiruv: ideal-rasm.service.ts:20 ensureSeeded, :21 getAll; ideal_rasm_targets=0 qator.

## 05.12 — EP-DIR-012 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Ideal vs haqiqat farq + %?
- Doc Isbot: getAll achievementPct=actual/target*100; weekly_revenue+employeesCount live
- Tekshiruv: ideal-rasm.service.ts:38 achievementPct hisob; :22 getWeeklyRevenue, :23 getActiveEmployeesCount live.

## 05.13 — EP-DIR-013 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ideal haqiqiy raqamlar avtomatik?
- Doc Isbot: weekly_profit=0, branches_count=1, market_share=0 hardcoded
- Tekshiruv: ideal-rasm.service.ts:26 weekly_profit:0, :28 branches_count:1, :30 market_share:0 — AYNAN hardcoded; revenue/employees live.

## 05.14 — EP-DIR-014 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ideal kartina yil bo'yicha versiyalansin?
- Doc Isbot: horizonYears param bor; year versioning tasdiqlanmadi
- Tekshiruv: ideal-rasm.service.ts:52 updateTarget(...horizonYears); `\d ideal_rasm_targets` = horizon_years bor, year/version/valid ustuni YO'Q.

## 05.15 — EP-DIR-015 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: OKR strukturasi?
- Doc Isbot: okr_objectives+okr_key_results; createObjective/createKeyResult/getDashboard; =0
- Tekshiruv: okr.service.ts:22/38/50 metodlar; okr.controller.ts mavjud; ikkala jadval=0 qator.

## 05.16 — EP-DIR-016 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: OKR kaskad (oltin ip)?
- Doc Isbot: getCascade(year)+parent_goal_id/department_id/owner_card_id
- Tekshiruv: okr.service.ts:61 getCascade; `\d okr_objectives` = department_id/parent_goal_id/owner_card_id + FK org_functions; data=0.

## 05.17 — EP-DIR-017 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Taktik reja oylik?
- Doc Isbot: monthly_plans (strategic_goal_id/objectives JSONB); =0
- Tekshiruv: `\d monthly_plans` = strategic_goal_id + objectives jsonb; monthly-plan.service.ts mavjud; monthly_plans=0.

## 05.18 — EP-DIR-018 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Oylikdan haftalik dekompozitsiya?
- Doc Isbot: weekly_tasks JSONB + completion_pct
- Tekshiruv: `\d monthly_plans` = weekly_tasks jsonb + completion_pct numeric; data=0.

## 05.19 — EP-DIR-019 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Taktik vazifa kartaga?
- Doc Isbot: strategic_tasks (assignee_id) + okr owner_card_id; =0
- Tekshiruv: `\d strategic_tasks` = assigned_user_id/assigned_department_id (assignee_id nomi aniq emas, lekin user-bog'lash bor); okr_objectives.owner_card_id; karta-biriktirish jonli yo'q, =0.

## 05.20 — EP-DIR-020 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Stat-reglament (ta'rif/formula/birlik/chastota/egasi)?
- Doc Isbot: stat_regulations definition/formula/unit/frequency/source_module/owner_card_id/target_value/version; =0
- Tekshiruv: `\d stat_regulations` — barcha ustunlar AYNAN mavjud (+valid_from); data=0 qator.

## 05.21 — EP-DIR-021 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Har ko'rsatkichga alohida chastota?
- Doc Isbot: stat_regulations.frequency
- Tekshiruv: frequency varchar + CHECK (daily/weekly/monthly); data=0.

## 05.22 — EP-DIR-022 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Stat-reglament versiyalansin?
- Doc Isbot: version+valid_from; update() getHistory
- Tekshiruv: version int + valid_from date mavjud; stat-regulation.service.ts mavjud; data=0.

## 05.23 — EP-DIR-023 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ko'rsatkich egasi kartaga?
- Doc Isbot: stat_regulations.owner_card_id
- Tekshiruv: owner_card_id int + FK→org_functions; data=0.

## 05.24 — EP-DIR-024 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Holat karta-modeldan yig'ilsin?
- Doc Isbot: getRawMetrics jadval-darajasi (sales_invoices/production_sessions), org_functions dan emas
- Tekshiruv: company-state.repository.ts:103 getRawMetrics — sales_invoices/production_sessions SUM; org_functions agregati yo'q. Karta→holat zanjiri qurilmagan.

## 05.25 — EP-DIR-025 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Director dashboard bir ekranda?
- Doc Isbot: getDashboard base+planFact+orderProgress+statTrends+openIssues; Roles
- Tekshiruv: dashboard.controller.ts:54 getDashboard kompozit (58-62); :52 Roles(SUPER_ADMIN,DIRECTOR); FE komponentlar mavjud.

## 05.26 — EP-DIR-026 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Strategik AI kunlik tahlil?
- Doc Isbot: director-ai explainKpi/assessRisks/generateExecutiveSummary + strategic-agent scenarioAnalysis; aiInsights:[]
- Tekshiruv: director-ai.service.ts:39/102/162 metodlar; agents/strategic-agent.service.ts:24 scenarioAnalysis; dashboard.controller.ts:74 aiInsights:[] (deferred).

## 05.27 — EP-DIR-027 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: /holat /kundalik /ideal_rasm bot?
- Doc Isbot: bot faqat /kpi /ai /summary; /holat /kundalik /ideal_rasm YO'Q
- Tekshiruv: director.bot.ts:25-27 /kpi /ai /summary; /holat /kundalik /ideal_rasm topilmadi.

## 05.28 — EP-DIR-028 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kunlik ertalabki digest?
- Doc Isbot: owner-summary GET + send config-gated; avto-cron aniq emas
- Tekshiruv: director-root.controller.ts:93 GET owner-summary, :101 POST send; ertalabki cron trigger topilmadi.

## 05.29 — EP-DIR-029 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: 5-darajali holat + rang?
- Doc Isbot: company_state_levels=5 OSISH..INQIROZ + color_hex
- Tekshiruv: company_state_levels=5 qator: OSISH(rank5)#10B981/NORMAL/EHTIYOT/XAVF/INQIROZ(rank1)#EF4444 + color_hex.

## 05.30 — EP-DIR-030 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Strategiya yutuqlari tarix?
- Doc Isbot: strategic_milestones=4 + createMilestone/updateMilestone(status); completedAt arxiv tasdiqlanmadi
- Tekshiruv: strategic.service.ts:50/54 createMilestone/updateMilestone; strategic_milestones=4 qator.

## 05.31 — EP-DIR-031 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Лавозим мақсади position_purpose?
- Doc Isbot: function_description bor (≈maqsad), alohida position_purpose YO'Q, 0/97 to'la
- Tekshiruv: org_functions.function_description bor; position_purpose grep=bo'sh; desc_filled=0/97 (psql).

## 05.32 — EP-DIR-032 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: ЦКП karta chiqishi?
- Doc Isbot: tskp/tskp_ru/tskp_target/tskp_measurement_unit; 19/97 to'la; holat formulaga bog'lanish yo'q
- Tekshiruv: org_functions 4 ЦКП ustun mavjud; tskp_filled=19/97 (psql); EP-DIR-001 holat formulaga bog'lanish topilmadi.

## 05.33 — EP-DIR-033 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 1-4 продукт kartaga?
- Doc Isbot: org_functions da product/produkt 1-4 ustun YO'Q
- Tekshiruv: `\d org_functions` product/produkt ustun yo'q (faqat tskp/tskp_target).

## 05.34 — EP-DIR-034 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 5-Деп/13-бўлим/Секция 3 maydon?
- Doc Isbot: department_no/unit_no/section_name YO'Q; faqat department_id + sub_department_name
- Tekshiruv: `\d org_functions` = sub_department_name bor; department_no/unit_no/section_name yo'q.

## 05.35 — EP-DIR-035 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 5-Деп 5 bo'lim drill-down?
- Doc Isbot: maxsus 5-departament drill-down topilmadi
- Tekshiruv: dashboard plan-fact umumiy departments JOIN; 5/13 raqamli struktura yo'q (05.34 ga bog'liq).

## 05.36 — EP-DIR-036 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: режа бажарилиш % bosh KPI?
- Doc Isbot: getPlanFact departments LEFT JOIN production_orders real SQL; **production_orders/sessions data=0**
- Tekshiruv: dashboard-query.repository.ts:93-94 getPlanFact real SQL TO'G'RI; LEKIN doc "data=0" XATO — JONLI production_orders=7, production_sessions=8. Bo'sh emas.

## 05.37 — EP-DIR-037 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: delay_count + plan_deviation_count?
- Doc Isbot: counter jadval/kod topilmadi
- Tekshiruv: information_schema.columns delay_count/plan_deviation_count = 0 satr (mavjud emas).

## 05.38 — EP-DIR-038 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Downtime director soat+sabab?
- Doc Isbot: downtime_logs/downtime_events/mes_downtime_reasons jadvallar bor; downtime_logs=0; widget yo'q
- Tekshiruv: downtime_logs=0 qator (jadval bor); downtime_events/mes_downtime_reasons to_regclass mavjud; director widget topilmadi.

## 05.39 — EP-DIR-039 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: A-System bilan bog'lanish?
- Doc Isbot: ko'chish-strategiya qarori, import mexanizmi yo'q — egasi qarori
- Tekshiruv: Kod-bo'lmagan strategik qaror. Egasi-data.

## 05.40 — EP-DIR-040 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Sutkalik reja ob'ekti?
- Doc Isbot: daily_plan/sutka jadval YO'Q
- Tekshiruv: to_regclass('daily_plan')=NULL; rasmiy sutkalik reja ob'ekti yo'q.

## 05.41 — EP-DIR-041 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tipik xatolar AI risk-reyestri?
- Doc Isbot: org_functions tipik-xatolar/risk-registry ustun YO'Q
- Tekshiruv: `\d org_functions` risk/xato ustun yo'q.

## 05.42 — EP-DIR-042 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Muvaffaqiyatli harakatlar ideal-model AI?
- Doc Isbot: ideal-model ustun YO'Q
- Tekshiruv: org_functions da tegishli ustun yo'q; AI baholash kodi topilmadi.

## 05.43 — EP-DIR-043 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Жавобгарликлари?
- Doc Isbot: responsibility/javobgarlik ustun YO'Q
- Tekshiruv: `\d org_functions` responsibility ustun yo'q.

## 05.44 — EP-DIR-044 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Tijorat sirlari audit-log?
- Doc Isbot: AuditInterceptor dashboard.controller; maxfiy-maydon audit yo'q
- Tekshiruv: dashboard.controller.ts:41 @UseInterceptors(AuditInterceptor); maxfiy-maydon (narx/mijoz) AYRIM kuzatuvchi yo'q.

## 05.45 — EP-DIR-045 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Energiya resurslari director?
- Doc Isbot: energy jadval YO'Q; mro_utility_readings MRO moduli
- Tekshiruv: to_regclass('energy_readings')=NULL; mro_utility_readings mavjud (MRO, director paneli emas).

## 05.46 — EP-DIR-046 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Turniket davomat?
- Doc Isbot: attendance jadvallar + getAttendanceToday; turniket-integratsiya/kech-kelish yo'q
- Tekshiruv: attendance_logs to_regclass mavjud; dashboard-query.service.ts:81 getAttendanceToday; turniket avtomatik + kech-kelish paneli topilmadi.

## 05.47 — EP-DIR-047 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Назорат варақаси o'quv ob'ekti?
- Doc Isbot: control_sheet/nazorat_varaq jadval YO'Q; ai_exam_enabled bor
- Tekshiruv: to_regclass('control_sheet')=NULL, ('nazorat_varaq')=NULL; org_functions.ai_exam_enabled bor.

## 05.48 — EP-DIR-048 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: тасдиқлайман tema qadamlari?
- Doc Isbot: mavzu-tasdiq jadval/kod topilmadi
- Tekshiruv: 05.47 davomi — ob'ekt yo'q.

## 05.49 — EP-DIR-049 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Senariy savollar AI imtihon?
- Doc Isbot: ai_exam_enabled + ai-exam route; **senariy→AI ulanishi real emas (stub /ai-exam)**
- Tekshiruv: org_functions.ai_exam_enabled bor; LEKIN ai-exam.service.ts REAL — assignExam/assignExamToCard(orgFunctionId,razryadLevelId)/submitAttempt/deleteAttempt repo metodlar. BE stub EMAS (faqat FE route stub). Doc Isbot kam-baholagan.

## 05.50 — EP-DIR-050 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: ТАСДИҚЛАЙМАН imzo + versiya?
- Doc Isbot: last_reviewed_at bor (qisman); imzo hujjat-oqimi yo'q
- Tekshiruv: org_functions.last_reviewed_at timestamptz bor; tasdiqlovchi+versiya+tanishdim-imzo oqimi topilmadi.

## 05.51 — EP-DIR-051 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Малака талаблари AI?
- Doc Isbot: requirement/malaka/tajriba ustun YO'Q; min/max_salary bor
- Tekshiruv: `\d org_functions` min_salary/max_salary bor; malaka-talab ustun yo'q.

## 05.52 — EP-DIR-052 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Лавозим воситалари?
- Doc Isbot: tools/vosita ustun YO'Q
- Tekshiruv: `\d org_functions` tools/vosita ustun yo'q.

## 05.53 — EP-DIR-053 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Reja/Fakt/Qoldiq real-time?
- Doc Isbot: getPlanFact total/completed/remaining real SQL; **data=0 (production_orders bo'sh)**
- Tekshiruv: getPlanFact SQL TO'G'RI (repo:93); LEKIN doc "production_orders bo'sh" XATO — JONLI =7 qator. Operatsiya-kesimi yo'q (qisman saqlanadi).

## 05.54 — EP-DIR-054 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Зарур заказлар navbat?
- Doc Isbot: markOrderVip+executeMarkVip + POST orders/:id/vip; PP-event tasdiqlanmadi
- Tekshiruv: director-state.service.ts:60 markOrderVip→executeMarkVip; director-extended.controller.ts:56 POST orders/:id/vip; PP real-vaqt event topilmadi.

## 05.55 — EP-DIR-055 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Брак сони director?
- Doc Isbot: quality metrik production_sessions.defect_qty; **data=0**; operatsiya/material panel yo'q
- Tekshiruv: company-state.repository quality metrik bor; operatsiya/material brak panel yo'q; LEKIN doc "data=0" XATO — production_sessions=8 qator jonli.

## 05.56 — EP-DIR-056 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Длительность reja vs fakt?
- Doc Isbot: operatsiya reja-vs-fakt panel topilmadi
- Tekshiruv: davomiylik reja/fakt director kodi topilmadi.

## 05.57 — EP-DIR-057 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ден/Ноч smena statistika?
- Doc Isbot: den/noch kesim kodi topilmadi
- Tekshiruv: smena-kesim director statistika yo'q.

## 05.58 — EP-DIR-058 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ishchi normasi % panel?
- Doc Isbot: norma% paneli topilmadi
- Tekshiruv: Iyun-ishchilar.xlsx norma% formulasi qurilmagan.

## 05.59 — EP-DIR-059 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Operatsiya norma (13 tur)?
- Doc Isbot: operation_norm jadval YO'Q
- Tekshiruv: to_regclass('operation_norm')=NULL.

## 05.60 — EP-DIR-060 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Oddiy lak/vib lak norma?
- Doc Isbot: lak operatsiya normasi yo'q
- Tekshiruv: 05.59 bo'lagi — yo'q.

## 05.61 — EP-DIR-061 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Pragon/yuklama CRP?
- Doc Isbot: pragon/CRP hisobi topilmadi
- Tekshiruv: CRP yuklama director kodi/jadvali yo'q.

## 05.62 — EP-DIR-062 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Buyurtma tayyorligi % panel?
- Doc Isbot: getOrderProgress readiness_pct + current_department real SQL; **data=0 (sales_orders/production_orders bo'sh)**
- Tekshiruv: dashboard-query.repository.ts:101-116 getOrderProgress SQL TO'G'RI; LEKIN "bo'sh" XATO — sales_orders=13, production_orders=7 jonli.

## 05.63 — EP-DIR-063 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Buyurtma sikl-vaqt reja vs fakt?
- Doc Isbot: sikl-vaqt panel topilmadi
- Tekshiruv: buyurtma sikl-vaqt director paneli yo'q.

## 05.64 — EP-DIR-064 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Приладка/setup vaqti?
- Doc Isbot: setup/priladka kodi topilmadi
- Tekshiruv: priladka director ustuni/kodi yo'q.

## 05.65 — EP-DIR-065 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Kichik buyurtmalar tahlili?
- Doc Isbot: small_order jadval/kod topilmadi
- Tekshiruv: to_regclass('small_orders')=NULL.

## 05.66 — EP-DIR-066 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Format optimizatsiya AI?
- Doc Isbot: format-opt/razmer kod topilmadi
- Tekshiruv: strategic-agent.service.ts faqat scenarioAnalysis/forecast; format-optimizatsiya metodi yo'q.

## 05.67 — EP-DIR-067 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Buyurtma kodi formati qidiruv?
- Doc Isbot: sales_orders.order_number; KT/PT/E format tasdiqlanmadi
- Tekshiruv: getOrderProgress order_number ishlatadi; KT/PT/E klishe-format va maxsus qidiruv topilmadi.

## 05.68 — EP-DIR-068 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 2 o'q drill (departament╳operatsiya)?
- Doc Isbot: departament-kesim bor, operatsiya-turi o'qi yo'q
- Tekshiruv: plan-fact dept-kesim bor; operatsiya-norma (05.59) yo'qligi sababli 2-o'q imkonsiz.

## 05.69 — EP-DIR-069 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Statistik vaqt-trend grafik?
- Doc Isbot: getStatTrends kpi_definitions×kpi_values json_agg trend_points; kpi_values=60
- Tekshiruv: dashboard-query.repository.ts:124-140 getStatTrends real SQL (json_agg trend_points); kpi_values=60 qator jonli.

## 05.70 — EP-DIR-070 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Trend holat avtomatik?
- Doc Isbot: kpi_values.status bor; rate-of-change auto + chora-taklif yo'q
- Tekshiruv: kpi_values.status ustun bor; trend-qiyalik→Danger avto kodi topilmadi.

## 05.71 — EP-DIR-071 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mas'ul lavozim + pasayganda alert?
- Doc Isbot: stat_regulations.owner_card_id; alert routing yo'q, =0
- Tekshiruv: owner_card_id schema bor; pasayish→karta alert kodi yo'q; data=0.

## 05.72 — EP-DIR-072 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Hisobot reglament (topshirildi/kechikdi)?
- Doc Isbot: coordination dokla Post/Get/Patch + rasporyazhenie; deadline-tracker aniq emas
- Tekshiruv: coordination.controller.ts:89/103 dokla Post/Get; topshirildi/kechikdi reglament-tracker topilmadi.

## 05.73 — EP-DIR-073 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Real-time + kunlik snapshot?
- Doc Isbot: getDashboard(?mode=snapshot|realtime); cron kunlik snapshot
- Tekshiruv: dashboard.controller.ts:54-68 mode parametri (snapshot/realtime); company-state-snapshot.cron kunlik INSERT.

## 05.74 — EP-DIR-074 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Root-cause drill?
- Doc Isbot: order-progress current_department drill; to'liq root-cause yo'q
- Tekshiruv: getOrderProgress current_department bor; og'ish→sabab-kategoriya→buyurtma zanjiri (05.37 counter yo'q) qurilmagan.

## 05.75 — EP-DIR-075 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Smena rejasi konflikt alert?
- Doc Isbot: material-aralashish alert kodi topilmadi
- Tekshiruv: konflikt alert/event yo'q.

## 05.76 — EP-DIR-076 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Xato tasniflash AI?
- Doc Isbot: AI xato-tasniflash kodi topilmadi
- Tekshiruv: tushunmaslik/e'tiborsizlik/qoidabuzarlik tasnif kodi yo'q.

## 05.77 — EP-DIR-077 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Chiqindilar director ekologik?
- Doc Isbot: waste_records+waste_targets jadval bor; =0; widget yo'q
- Tekshiruv: waste_records=0 qator; waste_targets to_regclass mavjud; director widget topilmadi.

## 05.78 — EP-DIR-078 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ma'lumot so'rash workflow?
- Doc Isbot: coordination dokla+rasporyazhenie; so'rov-javob izi to'liq emas
- Tekshiruv: coordination.controller dokla/councils bor; aniq info-request→javob izi to'liq emas.

## 05.79 — EP-DIR-079 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Karta-AI hisobotlar agregat?
- Doc Isbot: karta-AI agregat kodi yo'q; director-ai umumiy; aiInsights:[]
- Tekshiruv: director-ai.service umumiy KPI-tahlil; org_functions.id darajasida karta-AI agregat yo'q; aiInsights:[].

## 05.80 — EP-DIR-080 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Ideal qiymat (ostona) egasi belgilasin?
- Doc Isbot: state_thresholds + kpi_definitions schema+endpoint TAYYOR; qiymatlar seed-default
- Tekshiruv: state_thresholds (min/max/weight) + Patch kpi-definitions/:id endpoint mavjud; qiymatlar egasi-tuzatishi kutadi. Egasi-data.

## 05.81 — EP-DIR-081 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Поддон aylanishi director?
- Doc Isbot: ow_pallet_recoveries jadval bor; =0; ulanish yo'q
- Tekshiruv: ow_pallet_recoveries=0 qator (jadval bor); director dashboard + downtime bog'lanish topilmadi.

## 05.82 — EP-DIR-082 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Haftalik ishlab chiqargan vs qolgan?
- Doc Isbot: haftalik fakt panel topilmadi
- Tekshiruv: monthly_plans.weekly_tasks bor lekin ishlab-chiqarish haftalik fakt emas; panel yo'q.

## 05.83 — EP-DIR-083 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yo'nalish (ofs kar/gof/flx) statistika?
- Doc Isbot: yo'nalish kesim kodi topilmadi
- Tekshiruv: ofset/flekso yo'nalish director statistika yo'q.

## 05.84 — EP-DIR-084 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Algoritm turi (2-8 bo'lim)?
- Doc Isbot: algoritm-turi murakkablik ustuni topilmadi
- Tekshiruv: buyurtma algoritm-turi/murakkablik ustun/kod yo'q.

## 05.85 — EP-DIR-085 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Tozalik/intizom 5S director?
- Doc Isbot: kaizen_suggestions + kaizen.controller; 5S/tozalik paneli yo'q
- Tekshiruv: kaizen_suggestions=1 qator; kaizen.controller mavjud; director maxsus 5S/tozalik paneli yo'q.

---
*Tekshiruv: 2026-06-27 — adversarial, jonli DB (europrint) + kod (apps/api/src). Strukturaviy Isbot juda aniq; yagona xato turi = bir nechta eskirgan "data=0" sub-da'vo (production_orders=7, sales_orders=13, production_sessions=8 jonli).*
