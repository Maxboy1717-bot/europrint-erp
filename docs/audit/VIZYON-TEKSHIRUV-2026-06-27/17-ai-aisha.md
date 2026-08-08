# Modul 17 — AI / Aisha — Mustaqil Tekshiruv (Adversarial)

- **Sana:** 2026-06-28
- **Manba doc:** docs/audit/VIZYON-TASDIQ-2146-TOLIQ-2026-06-27.md (satr 6592..6975)
- **Savollar:** 95 (✅19 / 🟡46 / ❌29 / 🔑1)
- **Doc self-claim:** vizyon 52%
- **Tekshiruvchi realPct (verifiable=94):** ~44%
- **Natija:** Doc ISBOTLARI deyarli to'liq aniq va konservativ. 93 da'vo tasdiqlandi, 2 da'vo qisman noto'g'ri/oshirib aytilgan.

## REFUTED / OVERSTATED CLAIMS
- **17.2** — Doc ✅ bor dedi ("JWT→card_id avtomatik ishlaydi"). Reality: central-ai.service.ts:54 da `cardId` metadata sifatida UZATILADI, lekin kod izohida "kelajakda karta bo'yicha xarajat hisobi" deyilgan — ya'ni karta-identifikatsiya HOZIR faol ishlatilmaydi, passthrough placeholder. resolvePrimaryCard mavjud lekin to'liq enforced emas → realda **qisman**.
- **17.14** — Doc Isbot "company_state% jadval qidiruvi natija bermadi" deb yozgan, ammo `company_state_log` jadvali DB'da MAVJUD (0 qator) va `modules/remaining/company-state.service.ts` mavjud. Isbotning negativ-qidiruv da'vosi FAKTAN NOTO'G'RI (status 🟡 to'g'ri qoladi, lekin sabab xato).

## Tekshirilgan asosiy faktlar (psql + kod)
- DB jadvallar: barcha 27 ai_* / org / qo'shimcha jadval MAVJUD (ai_burnout_assessments, ai_governance_log, ai_disputes, ai_calibration_runs, ai_overrides — hammasi orfan/0 qator, kod yo'q tasdiqlandi).
- Qator sonlari: org_functions=97, card_folders=0, ai_fit_scores=1, ai_provider_configs=3 (hammasi is_active=false), state_thresholds=25, ai_violations=0, ai_camera_cross_check=0, ai_exam_attempts=0, process_chains=0, mentorships=0, company_state_log=0.
- org_functions.statistics_type = 0/97 to'ldirilgan (tasdiqlandi).
- grep: routeToManager=0, bottomUp/aggregateByManager=0, burnout=0, governance_log=0, disputes=0, calibration=0, overrides=0 (orfan tasdiqlandi).

---

## 17.1 — EP-AI-001 [DOC ✅] → [bor] (CONFIRMED)
- central-ai.service.ts:30,59 AiRouterService orqali yagona o'tish; ai-router 3 provayder (TASK_PROVIDER_MAP). Yagona markaz tasdiqlandi.

## 17.2 — EP-AI-002 [DOC ✅] → [qisman] (REFUTED — overstated)
- central-ai.service.ts:54 cardId metadata, izoh "kelajakda" cost hisobi. resolvePrimaryCard mavjud, lekin karta-identifikatsiya faol enforced emas. Mexanizm bor, to'liq emas.

## 17.3 — EP-AI-003 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-fit.service.ts:98-118 buildRequest employeeProfile+cardRequirements JSON'dan prompt; manbalar FE'dan keladi, BE avto-yig'gich yo'q. Doc to'g'ri.

## 17.4 — EP-AI-004 [DOC 🟡] → [qisman] (CONFIRMED)
- ai_fit_scores: fit_score + fit_report(jsonb strengths/gaps/summary). Foiz+report bor; rang FE-token tasdiqlanmadi.

## 17.5 — EP-AI-005 [DOC ❌] → [yoq] (CONFIRMED)
- grep routeToManager=0; ai_report_subscriptions jadval bor (0 qator), writer yo'q. Marshrutlash qurilmagan.

## 17.6 — EP-AI-006 [DOC ❌] → [yoq] (CONFIRMED)
- grep pdf|pdfkit|puppeteer modules/ai = 0 natija. PDF yo'q. ai_report_runs=0.

## 17.7 — EP-AI-007 [DOC 🟡] → [qisman] (CONFIRMED)
- forecast-weekly.job.ts faqat forecast (dushanba 00:00). Moslik/holat haftalik digest cron yo'q. Kunlik ЦКП cron bor.

## 17.8 — EP-AI-008 [DOC ✅] → [bor] (CONFIRMED)
- ai-daily-report.service.ts real (submit/submitAndRecord); ai-daily-report.cron.ts @Cron('0 8 * * 1-6'). Soxta son yo'q.

## 17.9 — EP-AI-009 [DOC 🟡] → [qisman] (CONFIRMED)
- generateQuestion/buildQuestionRequest AI bilan real; HR-tasdiq queue oqimi kodi yo'q. Doc to'g'ri.

## 17.10 — EP-AI-010 [DOC ✅] → [bor] (CONFIRMED)
- ckp-gate.ts applyCkpGate (toza funksiya) + CkpGateService; payroll.service.ts:12,106,363 evaluatePeriod orqali HAQIQATDA chaqiriladi. ckp_report_deadline_hours izchil.

## 17.11 — EP-AI-011 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-daily-report.cron izohida MES avto-feed = operator-hourly-invoice.cron alohida. Jonli ulanish bo'sh DB. Doc to'g'ri.

## 17.12 — EP-AI-012 [DOC ✅] → [bor] (CONFIRMED)
- director-ai.service.ts:39 explainKpi + :102 assessRisks + :162 generateExecutiveSummary, rootCauses/quickWins real, AI router.

## 17.13 — EP-AI-013 [DOC ✅] → [bor] (CONFIRMED)
- forecast/ paket: holt-winters, croston, ensemble-forecast, nelder-mead, forecast-weekly.job — barchasi mavjud (fayl tekshiruvi).

## 17.14 — EP-AI-014 [DOC 🟡] → [qisman] (REFUTED — Isbot fakt xato)
- company_state_log jadvali MAVJUD (0 qator); company-state.service.ts mavjud (modules/remaining). Doc "qidiruvi natija bermadi" deb xato yozgan. AI-modulda holat-log writer yo'q (status qoladi).

## 17.15 — EP-AI-015 [DOC ✅] → [bor] (CONFIRMED)
- finance-ai-analysis.service.ts:30 explainBudgetVariance + :98 classifyInvoice + :153 assessFraudRisk real.

## 17.16 — EP-AI-016 [DOC ✅] → [bor] (CONFIRMED)
- finance-ai.service.ts:97 forecastCashflow + :27 detectAnomalies real.

## 17.17 — EP-AI-017 [DOC 🟡] → [qisman] (CONFIRMED)
- finance-ai bor (anomaly+cashflow); alohida aging-priority metod topilmadi. Doc to'g'ri.

## 17.18 — EP-AI-018 [DOC 🟡] → [qisman] (CONFIRMED)
- hr-ai.service.ts:126 classifyProductivity bor; hr_weekly_statistics jadvali mavjud; GSD-trend digest alohida metod yo'q.

## 17.19 — EP-AI-019 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-fit parsed.bonusRecommendation + ai_fit_scores.bonus_recommendation; alohida bonus-service yo'q, HR-tasdiq oqimi yo'q.

## 17.20 — EP-AI-020 [DOC ❌] → [yoq] (CONFIRMED)
- Sozlanadigan bonus-mezon jadvali topilmadi. Tasdiqlandi.

## 17.21 — EP-AI-021 [DOC 🟡] → [qisman] (CONFIRMED)
- ai.controller.ts:169-173 /ai/bottleneck/analysis STUB `{ bottlenecks:[], analyzedAt }` (Qoida 10 buzilishi). REAL bottleneck PP-modulda. Doc aniq.

## 17.22 — EP-AI-022 [DOC 🟡] → [qisman] (CONFIRMED)
- PP CRP/scheduling capacity bor; AI-markaziy butun-zanjir agregat STUB. Doc to'g'ri.

## 17.23 — EP-AI-023 [DOC 🟡] → [qisman] (CONFIRMED)
- forecast statistik dvigatel + finance cashflow bor; yagona birlashtirilgan forecast-API yo'q (tarqoq).

## 17.24 — EP-AI-024 [DOC 🟡] → [qisman] (CONFIRMED)
- chat.controller.ts:66-67 @Controller('aisha') @UseGuards(JwtAuthGuard); karta-doirasi RBAC filtri ko'rinmadi. Doc to'g'ri.

## 17.25 — EP-AI-025 [DOC ✅] → [bor] (CONFIRMED)
- tool registry: 25 *.tool.ts fayl (doc "~30" — taxminiy). ERP-ma'lumot javobi real.

## 17.26 — EP-AI-026 [DOC 🟡] → [qisman] (CONFIRMED)
- i18n 3-til config; ai-router til-direktiva. Profil-tildan chat-promptga uzatish tasdiqlanmadi.

## 17.27 — EP-AI-027 [DOC 🟡] → [qisman] (CONFIRMED)
- ai_violations=0 (orfan/seed). IoT kamera detect bor. AI-markaziy yig'gich yo'q. Doc to'g'ri.

## 17.28 — EP-AI-028 [DOC ❌] → [yoq] (CONFIRMED)
- ai_camera_cross_check jadvali bor (0 qator), writer kodi yo'q (grep cameraCrossCheck=0).

## 17.29 — EP-AI-029 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-fit successionCandidate (>=85) + succession-compat.service.ts mavjud. Skill-matrix→vorislar yagona oqim to'liq emas.

## 17.30 — EP-AI-030 [DOC ✅] → [bor] (CONFIRMED)
- cron/absence-block.cron.ts:27 @Cron('0 10 * * *'); day1/day2/day3 mantiq, blockEmployee/disableUserAccount real, HR/direktor eskalatsiya.

## 17.31 — EP-AI-031 [DOC ❌] → [yoq] (CONFIRMED)
- grep bottomUp|aggregateByManager=0. AI↔AI agregat qurilmagan.

## 17.32 — EP-AI-032 [DOC 🟡] → [qisman] (CONFIRMED)
- ai.types.ts:85 TASK_PROVIDER_MAP default gemini; ai-router DAILY_BUDGET_USD + checkBudget + ai_usage_logs. ai_provider_configs 3 qator hammasi is_active=false, kalit yo'q. Limit-governance UI to'liq emas.

## 17.33 — EP-AI-033 [DOC ✅] → [bor] (CONFIRMED)
- ai-fit/daily-report tavsiya-only, anti-fabrikatsiya; aisha pending-approval VO mavjud (pending-approval.vo.ts). Avto-bajarmaydi.

## 17.34 — EP-AI-034 [DOC ✅] → [bor] (CONFIRMED)
- central-ai card_id=org_functions.id; org_functions=97 qator yagona kanonik. Single master.

## 17.35 — EP-AI-035 [DOC ❌] → [yoq] (CONFIRMED)
- org_functions.statistics_type 0/97; maxsus stat-ko'rsatkich+formula maydoni yo'q; AI avto-yozish kodi yo'q.

## 17.36 — EP-AI-036 [DOC ❌] → [yoq] (CONFIRMED)
- card_folders=0 qator, 'tipik xatolar banki' maydoni yo'q. Match kodi yo'q.

## 17.37 — EP-AI-037 [DOC ❌] → [yoq] (CONFIRMED)
- 'Muvaffaqiyatli harakatlar banki' maydoni yo'q. AI muvozanatli baho kodi yo'q.

## 17.38 — EP-AI-038 [DOC ❌] → [yoq] (CONFIRMED)
- Blanka jadval/maydon va AI-autoFill kodi yo'q.

## 17.39 — EP-AI-039 [DOC 🟡] → [qisman] (CONFIRMED)
- org_functions.tskp/tskp_target/tskp_measurement_unit maydonlari bor (psql); validateMeasurable kodi yo'q. Struktura bor, AI-tekshiruv yo'q.

## 17.40 — EP-AI-040 [DOC 🟡] → [qisman] (CONFIRMED)
- MES downtime manbasi bor; AI sabab-kategoriya+mas'ul-karta kodi AI-modulda yo'q.

## 17.41 — EP-AI-041 [DOC ❌] → [yoq] (CONFIRMED)
- AI rejadan-og'ish darajalovchi kod yo'q.

## 17.42 — EP-AI-042 [DOC ❌] → [yoq] (CONFIRMED)
- Bitrix24/A-System import kodi/jadvali yo'q.

## 17.43 — EP-AI-043 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-exam.service.ts:34 assignExamToCard, :44 submitAttempt, :40 getAttemptsByCard real + ai_exam_attempts jadval (0 qator). Nazorat-varaqa band-darajali bog'lanish yo'q.

## 17.44 — EP-AI-044 [DOC 🟡] → [qisman] (CONFIRMED)
- Kunlik ЦКП cron real; haftalik=faqat forecast; oylik AI-tahlil cron yo'q. 1/3 real.

## 17.45 — EP-AI-045 [DOC ❌] → [yoq] (CONFIRMED)
- org_functions.manager_id bor (psql); grep routeToManager=0. Avto-marshrutlash yo'q.

## 17.46 — EP-AI-046 [DOC 🟡] → [qisman] (CONFIRMED)
- card_folders=0 qator (javobgarlik maydoni struktura). AI-baho bog'lash kodi yo'q.

## 17.47 — EP-AI-047 [DOC ❌] → [yoq] (CONFIRMED)
- Energiya/счётчик jadval va AI-monitor yo'q.

## 17.48 — EP-AI-048 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-fit evaluate() per-xodim draft mexanizmi bor (POST /ai/fit/evaluate); davriy avto-draft cron yo'q.

## 17.49 — EP-AI-049 [DOC 🟡] → [qisman] (CONFIRMED)
- director-ai.service.ts:68 rootCauses[] LLM-tahlilda; strukturali xato-guruhlash yo'q; ai_violations=0.

## 17.50 — EP-AI-050 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-planning.service.ts + forecast-demand.tool.ts mavjud; 1-sutka reja→uchastka oqimi yo'q; ai_planning_decisions=0.

## 17.51 — EP-AI-051 [DOC ✅] → [bor] (CONFIRMED)
- Gemini/Claude ko'p-tilli; pii-redactor + ai-router til-direktiva; i18n 3-til. LLM-darajada qo'llab-quvvatlanadi.

## 17.52 — EP-AI-052 [DOC 🟡] → [qisman] (CONFIRMED)
- ai_decision_log.human_override ustuni (psql tasdiq) + getRecentDecisions(onlyIncorrect) (ai-decision-log.service.ts:191-194). ai_overrides jadvali orfan (grep 0).

## 17.53 — EP-AI-053 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-decision-log.service.ts:76 SHA-256 inputHash + input_data + input_hash ustunlar; FE drill-down tasdiqlanmadi, jadval bo'sh.

## 17.54 — EP-AI-054 [DOC ✅] → [bor] (CONFIRMED)
- ai-daily-report.service.ts:72,77 aiAvailable/needsManualValue, soxta son yo'q; ensemble HITL_CONFIDENCE_THRESHOLD=0.70; ai-router kalit yo'q→Err.

## 17.55 — EP-AI-055 [DOC ✅] → [bor] (CONFIRMED)
- state_thresholds=25 qator (psql); company-state.service.ts:164,190 o'qiydi. Sozlanuvchi chegara real.

## 17.56 — EP-AI-056 [DOC ❌] → [yoq] (CONFIRMED)
- ai_decision_log entityId bitta UUID; ko'p-karta attributsiya kodi yo'q.

## 17.57 — EP-AI-057 [DOC 🟡] → [qisman] (CONFIRMED)
- forecast.service.ts:66 calculateMetrics MAPE/RMSE/MAE (in-sample); prognoz↔haqiqat kalibrlash sikli yo'q; ai_calibration_runs orfan (grep 0).

## 17.58 — EP-AI-058 [DOC ❌] → [yoq] (CONFIRMED)
- ai-fit cardId+employeeId baholaydi; probation istisnosi kodi yo'q.

## 17.59 — EP-AI-059 [DOC 🟡] → [qisman] (CONFIRMED)
- director-ai quickWins[] bor; quriluvchi-ohang tizimli format-qoidasi alohida yo'q.

## 17.60 — EP-AI-060 [DOC 🟡] → [qisman] (CONFIRMED)
- ai_decision_log.auto_executed + human_override (psql); alohida ai_governance_log orfan (grep 0).

## 17.61 — EP-AI-061 [DOC 🟡] → [qisman] (CONFIRMED)
- forecast-weekly (dushanba) + daily-report (08:00); har-metrikaga sozlanuvchi oyna param yo'q.

## 17.62 — EP-AI-062 [DOC ❌] → [yoq] (CONFIRMED)
- ai-fit individual baho; same-karta peer-reyting/percentile kodi yo'q; ai_fit_scores=1.

## 17.63 — EP-AI-063 [DOC 🔑] → [egasi-data] (CONFIRMED)
- ai_* createdAt bor; avtomatik retention/anonimlash cron yo'q; muddat egasi tasdig'i kutadi.

## 17.64 — EP-AI-064 [DOC 🟡] → [qisman] (CONFIRMED)
- pii-redactor.ts:20-26 phone/inn/mfo/passport/salary/email mask; AI-kontekst RBAC-scope filtri ai-fit/director'da tekshirilmadi.

## 17.65 — EP-AI-065 [DOC ✅] → [bor] (CONFIRMED)
- ai-router.service.ts:65-72 budjet/kalit yo'q→Err graceful; ai-daily-report aiAvailable=false→qo'lda. ERP bloklanmaydi.

## 17.66 — EP-AI-066 [DOC ❌] → [yoq] (CONFIRMED)
- ta'til/leave istisnosi kodi ai-fit/eval'da yo'q.

## 17.67 — EP-AI-067 [DOC ❌] → [yoq] (CONFIRMED)
- Ideal-profil/etalon hisoblash kodi yo'q.

## 17.68 — EP-AI-068 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-exam.service.ts:33 per-karta imtihon (org_function_id+razryad, hr_question_bank); LMS bor; ko'rsatkich-tushdi→darslik avto-bog'lash yo'q.

## 17.69 — EP-AI-069 [DOC 🟡] → [qisman] (CONFIRMED)
- Dizayn shablon + FE forecast grafik bor; AI-hisobot yagona aralash-format shabloni yo'q.

## 17.70 — EP-AI-070 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-planning.service.ts + ai_planning_plans/decisions jadvallar (0 qator); reja↔fakt kunlik solishtirish to'liq emas.

## 17.71 — EP-AI-071 [DOC ❌] → [yoq] (CONFIRMED)
- suggestTemplate karta-shablon avto-taklif kodi yo'q.

## 17.72 — EP-AI-072 [DOC ❌] → [yoq] (CONFIRMED)
- Rahbar-baho↔AI-baho solishtirish kodi yo'q.

## 17.73 — EP-AI-073 [DOC ✅] → [bor] (CONFIRMED)
- ensemble-forecast.service.ts:22-25 ci80Lower/Upper + ci95Lower/Upper (bootstrap quantile:37) + confidence. Diapazon real.

## 17.74 — EP-AI-074 [DOC ✅] → [bor] (CONFIRMED)
- pii-redactor.ts:20-26,36 phone/inn/mfo/passport/salary/email→[REDACTED:type:N], ikki-tomonlama maskalash.

## 17.75 — EP-AI-075 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-fit employeeId+cardId individual; karta-jamlangan (smena-agregat) ko'rinish kodi yo'q.

## 17.76 — EP-AI-076 [DOC ❌] → [yoq] (CONFIRMED)
- Auditoriya-aware chuqurlik kodi yo'q; director-ai bir xil format.

## 17.77 — EP-AI-077 [DOC ❌] → [yoq] (CONFIRMED)
- before/after impact kodi yo'q.

## 17.78 — EP-AI-078 [DOC ❌] → [yoq] (CONFIRMED)
- process_chains=0; handoff/estafeta kutish-vaqt kodi yo'q.

## 17.79 — EP-AI-079 [DOC 🟡] → [qisman] (CONFIRMED)
- operator_daily_stats jadvali bor (0 qator); real-vaqt o'z-ko'rsatkich FE paneli AI-modulda tasdiqlanmadi.

## 17.80 — EP-AI-080 [DOC 🟡] → [qisman] (CONFIRMED)
- get-today-briefing.tool.ts:34,60 'eng muhim 3' (slice(0,3)) REAL; direktor-dashboard priortizatsiya+drill-down to'liq emas.

## 17.81 — EP-AI-081 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-automation.service.ts:30 */15, :56 */30, :96 dushanba; forecast haftalik; daily 08:00. Aralash, sozlanuvchi reglament yo'q. (Doc "EVERY_HOUR" — aslida */15+*/30; mayda nomuvofiqlik, status to'g'ri.)

## 17.82 — EP-AI-082 [DOC ❌] → [yoq] (CONFIRMED)
- ai_burnout_assessments jadvali bor, grep burnout=0 (orfan). Detektor yo'q.

## 17.83 — EP-AI-083 [DOC 🟡] → [qisman] (CONFIRMED)
- ai-exam per-karta imtihon + LMS bor; band-darajasi 'o'qilmagan kuzatish' kodi yo'q; ai_exam_attempts=0.

## 17.84 — EP-AI-084 [DOC 🟡] → [qisman] (CONFIRMED)
- director-ai rootCauses[] LLM; strukturali sabab-oqibat zanjiri/process_chains=0 yo'q.

## 17.85 — EP-AI-085 [DOC ❌] → [yoq] (CONFIRMED)
- ai_governance_log jadvali bor, grep 0 (orfan). Governance oqimi yo'q.

## 17.86 — EP-AI-086 [DOC ❌] → [yoq] (CONFIRMED)
- O'lik-karta detektori kodi yo'q.

## 17.87 — EP-AI-087 [DOC 🟡] → [qisman] (CONFIRMED)
- holt-winters seasonal forecast'da modellaydi; baholashda davriylik-anomaliya ajratish kodi yo'q.

## 17.88 — EP-AI-088 [DOC 🟡] → [qisman] (CONFIRMED)
- PDF infra bor (common/pdf); AI-modul hisoboti rasmiy-imzo-PDF ulanishi tasdiqlanmadi.

## 17.89 — EP-AI-089 [DOC 🟡] → [qisman] (CONFIRMED)
- get-today-briefing 'eng muhim 3' + ai_alerts.severity (0 qator); 10+ signal tartiblash to'liq kodi yo'q.

## 17.90 — EP-AI-090 [DOC ❌] → [yoq] (CONFIRMED)
- ai_disputes jadvali bor, grep 0 (orfan). E'tiroz oqimi yo'q.

## 17.91 — EP-AI-091 [DOC ✅] → [bor] (CONFIRMED)
- ensemble confidence + ai_decision_log.confidence ustuni (psql tasdiq) + hitlReason '<70%'. Real.

## 17.92 — EP-AI-092 [DOC 🟡] → [qisman] (CONFIRMED)
- i18n + LUGAT.md + ai-router o'zbek-direktiva; majburiy terminology-enforce kodi yo'q.

## 17.93 — EP-AI-093 [DOC 🟡] → [qisman] (CONFIRMED)
- mentorships/mentorship_sessions jadvallar (0 qator) + mentorships-compat CRUD; AI murabbiy-tavsiya kodi yo'q.

## 17.94 — EP-AI-094 [DOC ❌] → [yoq] (CONFIRMED)
- Statistik bir-tekis-hisobot anomaliya kodi yo'q; ai_fraud_alerts boshqa maqsad.

## 17.95 — EP-AI-095 [DOC ❌] → [yoq] (CONFIRMED)
- ai_calibration_runs jadvali bor, grep calibration=0 (orfan). Kalibrlash hisoboti yo'q.
