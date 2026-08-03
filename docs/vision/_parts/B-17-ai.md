## [B/TASDIQ] AI / Aisha (17) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | Bitta markaziy AI (tarqoq yo'q) | 2026-06-27 | TASDIQ-2146 §17 #1 | Yagona AI markazi | AI arxitektura | Markaziy AI + router | Ha | central-ai.service.ts + ai-router.service.ts (3 provayder yagona nuqta) |
| 2 | AI xodimni JWT→karta orqali taniydi | 2026-06-27 | TASDIQ-2146 §17 #2 | Karta-markazli identifikatsiya | AI identifikatsiya | JWT'dan card_id avto | Ha | central-ai.service.ts:18-23; resolvePrimaryCard(userId) |
| 3 | Moslik bahosiga ko'p-manba (ЦКП+test+davomat+sifat+rahbar) | 2026-06-27 | TASDIQ-2146 §17 #3 | To'liq baho | AI-fit | MES/QC/HR/LMS avto-yig'ish | Qisman | ai-fit.service.ts evaluate(); manba FE'dan, BE avto-yig'masi yo'q |
| 4 | Natija = % + rang + izoh | 2026-06-27 | TASDIQ-2146 §17 #4 | Tushunarli natija | AI-fit UI | Foiz+rang+sabab | Qisman | ai_fit_scores fit_score+fit_report; rang/token UI tasdiqlanmadi |
| 5 | Hisobot xodim+rahbar+HR uchchasiga | 2026-06-27 | TASDIQ-2146 §17 #5 | Shaffoflik | AI marshrutlash | 3-tomon routing | Yo'q | grep routeToManager=0; ai_report_subscriptions=0, writer yo'q |
| 6 | Hisobot formati rasmiy PDF | 2026-06-27 | TASDIQ-2146 §17 #6 | Rasmiy hujjat | AI hisobot | PDF generatsiya | Yo'q | grep pdf/pdfkit/puppeteer ai/=0; ai_report_runs=0 |
| 7 | Haftalik avto digest + so'rab olish | 2026-06-27 | TASDIQ-2146 §17 #7 | Muntazam holat | AI cron | Haftalik digest cron | Qisman | forecast-weekly.job.ts faqat forecast; moslik digest cron yo'q |
| 8 | ЦКП chatbot mashinasiz xodimdan kunlik so'raydi | 2026-06-27 | TASDIQ-2146 §17 #8 | Kunlik fakt | AI daily-report | Kunlik ЦКП savol push | Ha | ai-daily-report.service.ts to'liq real; cron 08:00 Du-Sha |
| 9 | ЦКП savolni AI tuzadi, HR tasdiqlaydi | 2026-06-27 | TASDIQ-2146 §17 #9 | Sifat nazorati | AI savol oqimi | HR-tasdiq queue | Qisman | generateQuestion() real; HR-approve oqimi yo'q |
| 10 | Kunlik hisobot bermaslik = oylik gate | 2026-06-27 | TASDIQ-2146 §17 #10 | Intizom | Payroll gate | ckp-gate | Ha | hr/payroll/ckp-gate.ts applyCkpGate; payroll.service.ts chaqiradi |
| 11 | Mashinachi ЦКП IoT/MES'dan avtomatik | 2026-06-27 | TASDIQ-2146 §17 #11 | Avto-fakt | MES→ЦКП | MES avto-feed | Qisman | operator-hourly-invoice.cron MES feed; jonli ulanish bo'sh DB |
| 12 | Director-AI holat sababini tushuntiradi | 2026-06-27 | TASDIQ-2146 §17 #12 | Sabab-tahlil | Director-AI | explainKpi kengaytirish | Ha | director-ai.service.ts:39 explainKpi+assessRisks+summary |
| 13 | Director-AI forecast beradi | 2026-06-27 | TASDIQ-2146 §17 #13 | Prognoz | Forecast paket | Statistik dvigatel | Ha | ai/forecast/ holt-winters/croston/ensemble/nelder-mead |
| 14 | Holat tarixi (30-kun trend) saqlanadi | 2026-06-27 | TASDIQ-2146 §17 #14 | Trend | Company-state-log | Kunlik holat writer | Qisman | company_state% AI-modulda topilmadi; log writer tasdiqlanmadi |
| 15 | Finance-AI ЗВС budjet tahlili | 2026-06-27 | TASDIQ-2146 §17 #15 | Budjet nazorat | Finance-AI | explainBudgetVariance | Ha | finance-ai-analysis.service.ts:30 + classifyInvoice+assessFraudRisk |
| 16 | Finance-AI cashflow prognozi | 2026-06-27 | TASDIQ-2146 §17 #16 | Likvidlik | Finance-AI | forecastCashflow | Ha | finance-ai.service.ts:97 + detectAnomalies() |
| 17 | Finance-AI aging ustuvorlik | 2026-06-27 | TASDIQ-2146 §17 #17 | Qarz boshqaruv | Finance-AI | aging-priority metod | Qisman | anomaly+cashflow bor; aging-priority qatlami tasdiqlanmadi |
| 18 | HR-AI GSD trend tahlili | 2026-06-27 | TASDIQ-2146 §17 #18 | Samaradorlik trend | HR-AI | GSD-trend digest | Qisman | hr-ai.service.ts classifyProductivity bor; trend digest yo'q |
| 19 | HR-AI bonus tavsiyasi (HR+Moliya tasdiq) | 2026-06-27 | TASDIQ-2146 §17 #19 | Adolatli bonus | AI-fit | bonusRecommendation + tasdiq | Qisman | ai_fit_scores.bonus_recommendation; HR-tasdiq oqimi yo'q |
| 20 | Bonus mezoni sozlanadigan (KPI yo'q) | 2026-06-27 | TASDIQ-2146 §17 #20 | Moslashuvchan mezon | Bonus-config | Sozlanuvchi mezon-tizim | Yo'q | bonus_config/payroll_config yo'q; system_settings umumiy |
| 21 | Bottleneck aniqlash | 2026-06-27 | TASDIQ-2146 §17 #21 | Tor joy | AI/PP | Real bottleneck agregat | Qisman | ai.controller.ts:173 STUB {bottlenecks:[]}; real PP-da |
| 22 | Bottleneck butun zanjir qamrovi | 2026-06-27 | TASDIQ-2146 §17 #22 | To'liq zanjir | AI/PP | Zanjir-qamrov agregat | Qisman | PP CRP capacity; AI-markaziy agregat STUB (ai.controller.ts:173) |
| 23 | Markaziy forecast (sotuv+cashflow+material+GSD) | 2026-06-27 | TASDIQ-2146 §17 #23 | Yagona markaz | Forecast | Birlashgan forecast-API | Qisman | ai/forecast/ + finance cashflow; yagona-markaz tasdiqlanmadi |
| 24 | AI-chat hamma, RBAC karta doirasida | 2026-06-27 | TASDIQ-2146 §17 #24 | Ruxsat cheklovi | Aisha chat | Karta-scope filtr | Qisman | chat.controller.ts JwtAuthGuard; karta-ruxsat filtri yo'q |
| 25 | AI-chat ЦКП/darslik + ERP ma'lumot | 2026-06-27 | TASDIQ-2146 §17 #25 | Bilim+ma'lumot | Aisha tools | ERP-tool javob | Ha | aisha tool.registry.ts ~30 tool (inventar/buyurtma/sifat/moliya) |
| 26 | AI-chat 3 til (profil-tilidan) | 2026-06-27 | TASDIQ-2146 §17 #26 | Ko'p-til | i18n/AI | Til-direktiva promptga | Qisman | i18n 3-til; profil-til→prompt direktivasi tasdiqlanmadi |
| 27 | Qoida-buzilish AI aniqlaydi (kamera+tahlil) | 2026-06-27 | TASDIQ-2146 §17 #27 | Intizom nazorat | ai_violations | Buzilish-yig'gich | Qisman | ai_violations yagona writer=hr-v2-seed (seed); ai_violations=0 |
| 28 | AI-kamera hisobot bilan kross-tekshiruv | 2026-06-27 | TASDIQ-2146 §17 #28 | Yolg'on aniqlash | Camera cross-check | cameraCrossCheck writer | Yo'q | ai_camera_cross_check 0 qator; grep cameraCrossCheck=0 |
| 29 | Skill-matritsa→vorislar ro'yxati | 2026-06-27 | TASDIQ-2146 §17 #29 | Ichki o'sish | AI-fit succession | Skill→vorislar oqim | Qisman | ai-fit successionCandidate + succession-compat.service.ts; yagona oqim to'liq emas |
| 30 | 3 kun yo'qlik→profil bloklash | 2026-06-27 | TASDIQ-2146 §17 #30 | Xavfsizlik | absence-block | 3-kunlik blok cron | Ha | cron/absence-block.cron.ts to'liq (day1-3 eskalatsiya, 4 event) |
| 31 | AI'lar o'zaro (quyi→yuqori agregat) | 2026-06-27 | TASDIQ-2146 §17 #31 | Yaxlit xulosa | AI↔AI | Bottom-up agregat | Yo'q | grep bottomUp/aggregateByManager/rollup=0 |
| 32 | AI provayder/xarajat nazorati (Gemini, limit) | 2026-06-27 | TASDIQ-2146 §17 #32 | Xarajat nazorat | ai-router | Limit+governance UI | Qisman | TASK_PROVIDER_MAP gemini; budjet-gate bor; is_active=false, kalit yo'q |
| 33 | AI faqat tavsiya (odam tasdig'i) | 2026-06-27 | TASDIQ-2146 §17 #33 | HITL nazorat | AI dizayn | tavsiya-only + approval | Ha | anti-fabrikatsiya dizayni; aisha pending-approval |
| 34 | Yagona master-data (karta, bitta DDL) | 2026-06-27 | TASDIQ-2146 §17 #34 | Single master | org_functions | Yagona karta-jadval | Ha | central-ai card_id=org_functions.id (97 qator, kanonik) |
| 35 | Lavozim stat-ko'rsatkichni AI avto-o'lchaydi | 2026-06-27 | TASDIQ-2146 §17 #35 | Avto-o'lchov | org_functions | statistics_type + AI writer | Yo'q | statistics_type 0/97; formula maydon yo'q; writer yo'q |
| 36 | Tipik-xatolar bankidan AI belgilaydi | 2026-06-27 | TASDIQ-2146 §17 #36 | Xato aniqlash | card_folders | Xato-bank match | Yo'q | 'tipik xatolar banki' maydoni yo'q; match kodi yo'q |
| 37 | Muvaffaqiyatli harakatlar bankidan ijobiy baho | 2026-06-27 | TASDIQ-2146 §17 #37 | Muvozanatli baho | card_folders | Ijobiy bank + baho | Yo'q | 'muvaffaqiyatli harakatlar' maydoni yo'q; faqat ai-fit strengths |
| 38 | Bankalarni AI real hodisadan avto-to'ldiradi | 2026-06-27 | TASDIQ-2146 §17 #38 | Avto-to'ldirish | Blanka | AI autoFill | Yo'q | Blanka jadval/maydon + autoFill kodi yo'q |
| 39 | ЦКП 'baholanadigan'ligini AI tekshiradi | 2026-06-27 | TASDIQ-2146 §17 #39 | O'lchovlilik | org_functions | validateMeasurable | Qisman | tskp_target/unit struktura bor; validateMeasurable kodi yo'q |
| 40 | Downtime AI sabab bilan tahlil | 2026-06-27 | TASDIQ-2146 §17 #40 | Sabab-kategoriya | MES/AI | Sabab+mas'ul-karta | Qisman | MES downtime bor; AI sabab-kategoriya ajratish yo'q |
| 41 | Rejadan og'ishni AI darajalaydi | 2026-06-27 | TASDIQ-2146 §17 #41 | Og'ish darajasi | PP/AI | Deviation grade | Yo'q | AI grade kodi topilmadi |
| 42 | A-System/Bitrix24 tarixini AI o'qiydi | 2026-06-27 | TASDIQ-2146 §17 #42 | Tarixiy import | Import | Bir marta import→AI | Yo'q | import kodi/jadvali yo'q; egasi-qaror ham aniqlanmagan |
| 43 | Nazorat varaqasi o'qishini AI savol berib tekshiradi | 2026-06-27 | TASDIQ-2146 §17 #43 | Tushunish nazorat | ai-exam | Band-darajali tekshiruv | Qisman | ai-exam.service.ts real; control-sheet bog'lanish yo'q |
| 44 | Kunlik/haftalik/oylik hisobot uchchasi | 2026-06-27 | TASDIQ-2146 §17 #44 | Ko'p davriylik | AI cron | 3 davriylik cron | Qisman | kunlik ЦКП real; haftalik=forecast; oylik yo'q (1/3) |
| 45 | Hisobotni AI bevosita rahbarga (manager_id) marshrutlaydi | 2026-06-27 | TASDIQ-2146 §17 #45 | Avto-yo'naltirish | AI routing | routeToManager | Yo'q | manager_id struktura bor; grep routeToManager ai/=0 |
| 46 | Javobgarlik bandlariga AI bog'lab baho | 2026-06-27 | TASDIQ-2146 §17 #46 | Bog'langan baho | card_folders | Baho→javobgarlik bog'lash | Qisman | card_folders.javobgarlik 0 qator; bog'lash kodi yo'q |
| 47 | Energiya tejash (suv/gaz/svet) AI nazorat | 2026-06-27 | TASDIQ-2146 §17 #47 | Isrof nazorat | IoT/AI | Sarf-monitor | Yo'q | счётчик jadval+monitor yo'q; egasi 'o'lchov yo'q→keyin' |
| 48 | Bo'lim xodimlarini AI davriy baho-draft | 2026-06-27 | TASDIQ-2146 §17 #48 | Doimiy baho | AI-fit | Davriy avto-draft cron | Qisman | evaluate() draft bor; doimiy avto-cron yo'q (faqat so'rovga) |
| 49 | Takror-xatoni AI guruhlab ildiz ko'rsatadi | 2026-06-27 | TASDIQ-2146 §17 #49 | Tizimli tahlil | Director-AI | Xato-guruhlash + ildiz | Qisman | director-ai:68,97 rootCauses[]; guruhlash kodi yo'q; ai_violations bo'sh |
| 50 | Ehtiyojni 1-sutka rejadan oldindan ogohlantirish | 2026-06-27 | TASDIQ-2146 §17 #50 | Oldindan signal | ai-planning | Reja→logistika signal | Qisman | ai-planning + forecast-demand bor; 1-sutka signal oqimi yo'q; decisions=0 |
| 51 | AI kirill+rus+lotinni birdek o'qiydi | 2026-06-27 | TASDIQ-2146 §17 #51 | Ko'p-til hujjat | AI-router | Ko'p-tilli qo'llab | Ha | Gemini/Claude ko'p-tilli; pii-redactor + til-direktiva |
| 52 | AI xulosasini odam sabab bilan bekor qiladi (override+feedback) | 2026-06-27 | TASDIQ-2146 §17 #52 | Feedback loop | ai_decision_log | Override→kalibrlash | Qisman | human_override ustuni bor; ai_overrides ORFAN; feedback ulanmagan |
| 53 | AI baho uchun audit izi/drill-down | 2026-06-27 | TASDIQ-2146 §17 #53 | Isbot havolasi | ai_decision_log | Audit iz + drill-down UI | Qisman | inputHash+SHA-256 audit iz bor; FE drill-down tasdiqlanmadi, bo'sh |
| 54 | AI ma'lumot yetmasa ochiq aytadi (fabrikatsiya yo'q) | 2026-06-27 | TASDIQ-2146 §17 #54 | Rostgo'ylik | AI dizayn | needsManualValue + HITL | Ha | ai-daily-report:14-18 aiAvailable=false; ensemble:214 confidence<70→HITL |
| 55 | Ogohlantirish ostonasini rahbar/HR sozlaydi | 2026-06-27 | TASDIQ-2146 §17 #55 | Shovqin nazorat | state_thresholds | Sozlanuvchi chegara | Ha | state_thresholds=25 qator jonli; company-state.service.ts o'qiydi |
| 56 | Bir hodisa ikki kartaga: AI kimga yozadi | 2026-06-27 | TASDIQ-2146 §17 #56 | Ikki-jazo yo'q | ai_decision_log | Ko'p-karta attributsiya | Yo'q | entityId bitta UUID; ko'p-karta taqsimlash kodi yo'q |
| 57 | AI prognoz noto'g'ri chiqsa o'zini tuzatadi | 2026-06-27 | TASDIQ-2146 §17 #57 | Aniqlik kuzatuv | forecast | Kalibrlash sikli | Qisman | forecast:66 MAPE/RMSE in-sample; ai_calibration_runs ORFAN |
| 58 | Yangi xodim bahosi moslashish davri bilan | 2026-06-27 | TASDIQ-2146 §17 #58 | Adolatli baho | AI-fit | Probation istisno | Yo'q | probation/adaptatsiya istisnosi kodi yo'q |
| 59 | AI bahosi quriluvchi ohangda | 2026-06-27 | TASDIQ-2146 §17 #59 | O'sish ohangi | Director-AI | Ohang format-qoidasi | Qisman | quickWins[] + ai-fit izoh; tizimli ohang formati yo'q |
| 60 | Rad etilgan tavsiya ham jurnalga | 2026-06-27 | TASDIQ-2146 §17 #60 | Shaffoflik | ai_decision_log | qabul/rad+sabab jurnal | Qisman | autoExecuted+human_override bor; ai_governance_log ORFAN |
| 61 | Har ko'rsatkichga mos davr-oynasi | 2026-06-27 | TASDIQ-2146 §17 #61 | To'g'ri oyna | forecast cron | Sozlanuvchi oyna | Qisman | haftalik/kunlik cron bor; metrikaga sozlanuvchi oyna param yo'q |
| 62 | AI faqat bir xil karta ichida reyting | 2026-06-27 | TASDIQ-2146 §17 #62 | Adolatli solishtiruv | AI-fit | Same-karta percentile | Yo'q | individual baho bor; peer-reyting kodi yo'q; ai_fit_scores=1 |
| 63 | AI ma'lumotni qancha saqlaydi (retention) | 2026-06-27 | TASDIQ-2146 §17 #63 | Retention siyosati | ai_* jadvallar | Retention+anonimlash cron | egasi-data | ShVB Q73/Q156 vizyon; muddat lavozim-turiga=egasi tasdig'i |
| 64 | Maxfiy hisobot (PIP/eNPS) faqat ruxsat doirasida | 2026-06-27 | TASDIQ-2146 §17 #64 | Maxfiylik | pii-redactor | RBAC-scope filtr | Qisman | pii-redactor maxfiy maydonni bloklaydi; AI-kontekst RBAC-scope tekshirilmadi |
| 65 | AI ishlamay qolsa ERP davom etadi | 2026-06-27 | TASDIQ-2146 §17 #65 | Chidamlilik | ai-router | Graceful degrade | Ha | ai-router:65-74 kalit yo'q→Err; ERP bloklanmaydi |
| 66 | Tasdiqlangan ta'til/kasallikni AI istisno qiladi | 2026-06-27 | TASDIQ-2146 §17 #66 | Adolatli baho | AI-fit/Leave | approved-absence exclude | Yo'q | LeaveModule bor; AI-fit'ga istisno ulanishi yo'q |
| 67 | Eng yaxshilardan ideal profil (etalon) | 2026-06-27 | TASDIQ-2146 §17 #67 | Real etalon | AI-fit | Etalon hisoblash | Yo'q | ideal-profil/etalon kodi yo'q; ShVB Q11 vizyonda |
| 68 | Ko'rsatkich tushsa mos darslik tavsiya | 2026-06-27 | TASDIQ-2146 §17 #68 | Amaliy o'sish | ai-exam/LMS | Tushish→darslik bog'lash | Qisman | ai-exam:33 per-karta imtihon; avto-tayinlash bog'lanish yo'q |
| 69 | Hisobotda aralash geometriya (matn+jadval+grafik) | 2026-06-27 | TASDIQ-2146 §17 #69 | Standart format | AI hisobot | Aralash standart shablon | Qisman | dizayn-shablon + forecast grafik bor; yagona shablon tasdiqlanmadi |
| 70 | 1-sutka rejani har kun real bajarilish bilan solishtirish | 2026-06-27 | TASDIQ-2146 §17 #70 | Ketma-ket ta'sir | ai-planning | Reja↔fakt kunlik | Qisman | ai_planning_plans/decisions bor; solishtirish kodi yo'q; jadval=0 |
| 71 | Yangi karta yaratilganda AI ko'rsatkich/ЦКП/darslik taklif | 2026-06-27 | TASDIQ-2146 §17 #71 | Izchillik | Karta-shablon | suggestTemplate | Yo'q | suggestTemplate kodi yo'q; KARTALAR Q7 vizyonda |
| 72 | Rahbar va AI baholarini solishtirib kelishmovchilik signali | 2026-06-27 | TASDIQ-2146 §17 #72 | Xolislik nazorat | AI-fit | Ikki-baho farq-signal | Yo'q | rahbar↔AI solishtirish kodi yo'q |
| 73 | AI pessimistik/optimistik diapazon | 2026-06-27 | TASDIQ-2146 §17 #73 | Real ishonch | ensemble-forecast | CI diapazon | Ha | ensemble:194-225 ci80/ci95 + confidence (bootstrap) |
| 74 | Tijorat sirini tashqi provayderga chiqarmaslik | 2026-06-27 | TASDIQ-2146 §17 #74 | Huquqiy maxfiylik | pii-redactor | Ikki-tomonlama mask | Ha | pii-redactor:18-26 phone/INN/salary/IBAN [REDACTED]→tiklanadi |
| 75 | Ko'p xodim bir kartaga: AI qanday baholaydi | 2026-06-27 | TASDIQ-2146 §17 #75 | Karta-markazli | AI-fit | Individual+karta-agregat | Qisman | employeeId+cardId individual bor; karta jamlangan ko'rinish yo'q |
| 76 | AI tushuntirishi auditoriyaga qarab chuqurlik | 2026-06-27 | TASDIQ-2146 §17 #76 | Auditoriyaga mos | Director-AI | Audience-aware depth | Yo'q | audience-aware depth kodi yo'q; bir xil format |
| 77 | O'zgarish ta'sirini AI oldin/keyin kuzatadi | 2026-06-27 | TASDIQ-2146 §17 #77 | Chora tahlil | AI | Before/after impact | Yo'q | before/after impact kodi yo'q |
| 78 | Bo'limlararo estafeta (handoff) uzilishini topadi | 2026-06-27 | TASDIQ-2146 §17 #78 | Uzatish tahlil | process_chains | Handoff kutish-vaqt | Yo'q | process_chains=0; handoff o'lchash kodi yo'q |
| 79 | Xodim joriy ko'rsatkichni real vaqtda ko'radi | 2026-06-27 | TASDIQ-2146 §17 #79 | O'z-nazorat | operator stats | Real-vaqt panel | Qisman | operator_daily_stats bor; real-vaqt FE panel tasdiqlanmadi; bo'sh |
| 80 | AI direktorga kunlik eng muhim 3-5 | 2026-06-27 | TASDIQ-2146 §17 #80 | Diqqat markazi | Aisha briefing | Prioritizatsiya | Qisman | get-today-briefing.tool.ts:34 'eng muhim 3' real; drill-down oqimi tasdiqlanmadi |
| 81 | AI real-time vs batch aralash yangilash | 2026-06-27 | TASDIQ-2146 §17 #81 | Muvozanat | AI cron | Sozlanuvchi reglament | Qisman | ai-automation EVERY_HOUR/15/30min bor; reglament sozlash yo'q |
| 82 | Charchash/tushishni AI erta sezadi | 2026-06-27 | TASDIQ-2146 §17 #82 | Erta aralashuv | ai_burnout | Burnout detektor | Yo'q | ai_burnout_assessments ORFAN (grep 0); detektor yo'q |
| 83 | Nazorat varaqasi o'qilmagan bandlarni kuzatib eslatadi | 2026-06-27 | TASDIQ-2146 §17 #83 | Tayyorlik nazorat | ai-exam | Band-kuzatuv+eslatma | Qisman | ai-exam + LMS bor; band-darajali kuzatuv kodi yo'q; attempts=0 |
| 84 | Sabab-oqibat zanjirini chizib ildizni belgilash | 2026-06-27 | TASDIQ-2146 §17 #84 | Ildiz tuzatish | Director-AI | Strukturali zanjir | Qisman | rootCauses[] bor; strukturali zanjir/process_chains=0 |
| 85 | Baholash mezonini o'zgartirishni kim tasdiqlaydi (governance) | 2026-06-27 | TASDIQ-2146 §17 #85 | Governance | ai_governance_log | Mezon-o'zgarish oqim | Yo'q | ai_governance_log ORFAN (grep 0); governance oqimi yo'q |
| 86 | O'lik (ma'lumotsiz) kartani AI aniqlaydi | 2026-06-27 | TASDIQ-2146 §17 #86 | Ko'r nuqta | Karta detektor | 7-kun ma'lumotsiz flag | Yo'q | o'lik-karta detektori yo'q; 31-band 7-kun filtr vizyonda |
| 87 | Mavsumiy/davriy naqshni AI hisobga oladi | 2026-06-27 | TASDIQ-2146 §17 #87 | Soxta signal yo'q | holt-winters | Baholashda kalendar-naqsh | Qisman | holt-winters seasonal forecast'da; baholashda ajratish yo'q |
| 88 | Hisobotni rasmiy formatda (sana+mas'ul+imzo) eksport | 2026-06-27 | TASDIQ-2146 §17 #88 | Rasmiy dalil | PDF infra | AI→imzo-PDF ulanish | Qisman | hr-pdf-generator/export/cc-pdf bor; AI-modul ulanishi tasdiqlanmadi |
| 89 | Ko'p hodisani jiddiylik bo'yicha tartiblash | 2026-06-27 | TASDIQ-2146 §17 #89 | Ustuvorlik | ai_alerts | Impact+severity sort | Qisman | briefing 'eng muhim 3' + severity ustuni; 10+ sort kodi yo'q; ai_alerts=0 |
| 90 | Xodim e'tirozini (shikoyat) AI qarorga qaytaradi | 2026-06-27 | TASDIQ-2146 §17 #90 | Ikki-tomon baho | ai_disputes | E'tiroz oqimi | Yo'q | ai_disputes ORFAN (grep 0); e'tiroz oqimi yo'q |
| 91 | AI har xulosada ishonch darajasini ko'rsatadi | 2026-06-27 | TASDIQ-2146 §17 #91 | Ishonch shaffofligi | ai_decision_log | confidence ustuni | Ha | ensemble:225 confidence + decision_log.confidence + hitlReason |
| 92 | AI zavod atamalarini izchil ishlatadi | 2026-06-27 | TASDIQ-2146 §17 #92 | Lug'atga sodiqlik | AI-router | Terminology-enforce | Qisman | i18n + LUGAT.md + o'zbek-direktiva; enforce kodi yo'q |
| 93 | Bir karta uchun eng yaxshi murabbiy (mentor) topadi | 2026-06-27 | TASDIQ-2146 §17 #93 | O'rganish | mentorships | AI mentor-tavsiya | Qisman | mentorships CRUD bor; AI ko'rsatkich-asosli tavsiya yo'q; jadval=0 |
| 94 | Soxta hisobotni statistik anomaliya orqali sezadi | 2026-06-27 | TASDIQ-2146 §17 #94 | Yolg'on aniqlash | AI/fraud | Hisobot-naqsh anomaliya | Yo'q | ai_fraud_alerts fraud uchun; hisobot-naqsh anomaliyasi yo'q |
| 95 | AI o'z xatosini tan oladi (kalibrlash hisoboti) | 2026-06-27 | TASDIQ-2146 §17 #95 | O'z-aniqlik | ai_calibration_runs | Kalibrlash hisoboti | Yo'q | ai_calibration_runs ORFAN (grep 0, schema TS yo'q) |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Hisobot xodim+rahbar+HR uchchasiga marshrutlansin | 2026-06-27 | TASDIQ-2146 §17 #5 | 3-tomon routing kodi yo'q; ai_report_subscriptions=0, writer yo'q | AI |
| Hisobot rasmiy PDF bo'lsin | 2026-06-27 | TASDIQ-2146 §17 #6 | PDF generatsiya AI-modulda yo'q; ai_report_runs=0 | AI |
| Bonus mezoni sozlanadigan (KPI yo'q) | 2026-06-27 | TASDIQ-2146 §17 #20 | Sozlanuvchi bonus-mezon jadvali yo'q | AI/HR |
| AI-kamera hisobot bilan kross-tekshiruv | 2026-06-27 | TASDIQ-2146 §17 #28 | ai_camera_cross_check writer yo'q (0 qator) | AI/IoT |
| AI'lar o'zaro quyi→yuqori agregat | 2026-06-27 | TASDIQ-2146 §17 #31 | bottom-up agregat kodi yo'q | AI |
| Lavozim stat-ko'rsatkichni AI avto-o'lchasin | 2026-06-27 | TASDIQ-2146 §17 #35 | statistics_type 0/97; formula+writer yo'q | AI/Org |
| Tipik-xatolar bankidan AI belgilasin | 2026-06-27 | TASDIQ-2146 §17 #36 | xato-bank maydoni+match kodi yo'q | AI/Org |
| Muvaffaqiyatli harakatlar bankidan ijobiy baho | 2026-06-27 | TASDIQ-2146 §17 #37 | ijobiy-bank maydoni+baho kodi yo'q | AI/Org |
| Bankalarni AI real hodisadan avto-to'ldirsin | 2026-06-27 | TASDIQ-2146 §17 #38 | blanka jadval+autoFill kodi yo'q | AI/Org |
| Rejadan og'ishni AI darajalasin | 2026-06-27 | TASDIQ-2146 §17 #41 | deviation grade kodi yo'q | AI/PP |
| A-System/Bitrix24 tarixini AI import qilsin | 2026-06-27 | TASDIQ-2146 §17 #42 | import kodi yo'q + egasi-qaror aniqlanmagan | AI/Import |
| Hisobotni AI bevosita manager_id ga marshrutlasin | 2026-06-27 | TASDIQ-2146 §17 #45 | routeToManager kodi yo'q | AI |
| Energiya (suv/gaz/svet) AI nazorat qilsin | 2026-06-27 | TASDIQ-2146 §17 #47 | счётчик jadval+monitor yo'q; egasi 'o'lchov yo'q→keyin' | AI/IoT |
| Bir hodisa ikki kartaga: AI asosiy sababkorni belgilasin | 2026-06-27 | TASDIQ-2146 §17 #56 | ko'p-karta attributsiya kodi yo'q | AI |
| Yangi xodim bahosi moslashish davri bilan yumshatilsin | 2026-06-27 | TASDIQ-2146 §17 #58 | probation istisnosi AI-fit'ga ulanmagan | AI/HR |
| Eng yaxshilardan ideal profil (etalon) chiqarilsin | 2026-06-27 | TASDIQ-2146 §17 #67 | etalon hisoblash kodi yo'q | AI |
| Yangi karta yaratilganda AI ko'rsatkich/ЦКП/darslik taklif etsin | 2026-06-27 | TASDIQ-2146 §17 #71 | suggestTemplate kodi yo'q | AI/Org |
| Rahbar va AI baholarini solishtirib signal | 2026-06-27 | TASDIQ-2146 §17 #72 | ikki-baho farq-signal kodi yo'q | AI |
| AI tushuntirishi auditoriyaga qarab chuqurlik | 2026-06-27 | TASDIQ-2146 §17 #76 | audience-aware depth kodi yo'q | AI |
| O'zgarish ta'sirini AI oldin/keyin kuzatsin | 2026-06-27 | TASDIQ-2146 §17 #77 | before/after impact kodi yo'q | AI |
| Bo'limlararo estafeta uzilishini AI topsin | 2026-06-27 | TASDIQ-2146 §17 #78 | process_chains=0; handoff o'lchash yo'q | AI |
| Charchash/tushishni AI erta sezsin | 2026-06-27 | TASDIQ-2146 §17 #82 | ai_burnout_assessments ORFAN (grep 0) | AI/HR |
| Baholash mezoni o'zgarishi governance bilan | 2026-06-27 | TASDIQ-2146 §17 #85 | ai_governance_log ORFAN (grep 0) | AI |
| O'lik (ma'lumotsiz) kartani AI aniqlasin | 2026-06-27 | TASDIQ-2146 §17 #86 | 7-kun ma'lumotsiz detektori yo'q | AI |
| Xodim e'tirozini AI qarorga qaytarsin | 2026-06-27 | TASDIQ-2146 §17 #90 | ai_disputes ORFAN (grep 0) | AI |
| Soxta hisobotni statistik anomaliya orqali sezish | 2026-06-27 | TASDIQ-2146 §17 #94 | hisobot-naqsh anomaliya kodi yo'q | AI |
| AI o'z xatosini tan olsin (kalibrlash hisoboti) | 2026-06-27 | TASDIQ-2146 §17 #95 | ai_calibration_runs ORFAN (grep 0, schema TS yo'q) | AI |
| AI ma'lumot retention muddati (rahbar 10y/ishchi 3y) | 2026-06-27 | TASDIQ-2146 §17 #63 | 🔑 muddat lavozim-turiga = egasi tasdig'i kutadi (retention/anonimlash cron yo'q) | AI |
