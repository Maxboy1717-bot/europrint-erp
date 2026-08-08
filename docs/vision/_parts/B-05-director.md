## [B/TASDIQ] Director / Hisobot (05) — 2026-06-27 tasdiq

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Qachon | Qayerda | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Izoh |
|---|---|---|---|---|---|---|---|---|
| 05.1 | Kompaniya holati 5 vaznli ko'rsatkichdan (pul/ishlab-chiq/buyurtma/xodim/sifat) | 2026-06-27 | TASDIQ-2146 §05 #1 | Direktor umumiy holat | director-holat.service | 5-metrik vaznli formula | Ha | computeHolat() pure 5-metrik; state_thresholds=25 qator (cash.25/prod.25/orders.20/hr.15/qual.15) |
| 05.2 | Holat chegaralari sozlanadigan master-data | 2026-06-27 | TASDIQ-2146 §05 #2 | Egasi ostona belgilaydi | state_thresholds | Chegara + endpoint | Qisman | 25 qator seed + Patch /kpi-definitions,/kpi-weights (dashboard.controller:155,194); egasi-tuzatishi kutadi |
| 05.3 | Holat kunlik cron 07:00 | 2026-06-27 | TASDIQ-2146 §05 #3 | Har kun avto | company-state-snapshot.cron | 07:00 cron | Qisman | cron @Cron('0 6 * * *') — vaqt 06:00 (07:00 emas); company_state_log=0 |
| 05.4 | Holat tarixi + 30 kun mini-grafik | 2026-06-27 | TASDIQ-2146 §05 #4 | Trend ko'rsatish | company_state_log | Tarix saqlash+grafik | Qisman | jadval+history endpoint bor; company_state_log=0 (bo'sh) |
| 05.5 | Holat yomonlashsa alert (Telegram+tizim) | 2026-06-27 | TASDIQ-2146 §05 #5 | Darhol ogohlantirish | director-root owner-summary | Real-time delta-alert | Qisman | config-gated Telegram push bor; real-time holat-o'zgarish sendAlert yo'q (digest orqali) |
| 05.6 | Alertni boshliq + sababchi karta oladi | 2026-06-27 | TASDIQ-2146 §05 #6 | Mas'ul yo'naltirish | stat_regulations.owner_card_id | Alert-routing kartaga | Qisman | owner_card_id + bo'lim-kesim bor; sababchi kartaga avto-yuborish kodi yo'q |
| 05.7 | Dnevnik 5-maydonli (holat/KPI/muammo/yechim/ertangi reja) | 2026-06-27 | TASDIQ-2146 §05 #7 | Kundalik hisobot | diary_entries | 5 maydon | Ha | daily_state/main_kpi/main_issue/solution/tomorrow_plan/carry_over; FE DirectorDiaryPage; 2 draft jonli |
| 05.8 | Bo'lim rahbarlari ham kundalik yozadi (karta-markaz) | 2026-06-27 | TASDIQ-2146 §05 #8 | Har rahbar kundaligi | diary.service | Karta-centric muallif | Ha | openDiaryForUser resolveAuthorCard→author_card_id (org_functions.id); jonli author_card_id=1 |
| 05.9 | Kundalik holat+KPI avtomatik to'ladi | 2026-06-27 | TASDIQ-2146 §05 #9 | Boshliq faqat muammo/yechim | diary.service | Autofill formuladan | Qisman | getOrCreateToday autofill bor; jonli daily_state=null (holat-log bo'sh) |
| 05.10 | Yechilmagan muammo keyingi kunga o'tadi (carry-over) | 2026-06-27 | TASDIQ-2146 §05 #10 | Muammo yo'qolmasin | diary_entries.carry_over_issues | Carry-over | Ha | carryOverIssues() + getOpenIssues() SQL real |
| 05.11 | Ideal kartina saqlansin (foyda/daromad/filial/xodim) | 2026-06-27 | TASDIQ-2146 §05 #11 | Maqsad ko'rsatish | ideal_rasm_targets | Ideal + seed | Qisman | jadval+service ensureSeeded(); ideal_rasm_targets=0 (seed yuklanmagan) |
| 05.12 | Ideal vs haqiqat farqi + bajarilish % | 2026-06-27 | TASDIQ-2146 §05 #12 | Gap ko'rsatish | ideal-rasm.service | achievementPct | Ha | achievementPct=actual/target*100; weekly_revenue+activeEmployees live; FE IdealVsActualPanel |
| 05.13 | Ideal raqamlari avtomatik (foyda moliyadan, xodim HR dan) | 2026-06-27 | TASDIQ-2146 §05 #13 | Avto-actual | ideal-rasm.service | Live actuals | Qisman | getWeeklyRevenue+ActiveEmployees live; weekly_profit=0/branches=1/market_share=0 hardcoded |
| 05.14 | Ideal kartina yil bo'yicha versiyalansin | 2026-06-27 | TASDIQ-2146 §05 #14 | Tarix qolsin | ideal_rasm_targets | Yillik versiya | Qisman | updateTarget horizonYears bor; yil versioning ustuni tasdiqlanmadi; data=0 |
| 05.15 | Strategik OKR (Objective→Key Results) | 2026-06-27 | TASDIQ-2146 §05 #15 | Strategiya struktura | okr_objectives/okr_key_results | OKR struktura | Qisman | jadval+service+11 route+FE; ikkala jadval=0 (bo'sh) |
| 05.16 | OKR kompaniya→bo'lim→karta kaskad (oltin ip) | 2026-06-27 | TASDIQ-2146 §05 #16 | Golden-thread OKR | okr_objectives | Kaskad sxema | Qisman | getCascade+parent_goal_id/department_id/owner_card_id; data=0, jonli sinov yo'q |
| 05.17 | Taktik reja: strategiyadan oylik rejaga | 2026-06-27 | TASDIQ-2146 §05 #17 | Reja dekompozitsiya | monthly_plans | Oylik taktik | Qisman | jadval+service+controller+FE; monthly_plans=0 |
| 05.18 | Oylikdan haftalikga dekompozitsiya (4 hafta + %) | 2026-06-27 | TASDIQ-2146 §05 #18 | Haftalik bo'lish | monthly_plans.weekly_tasks | Haftalik % | Qisman | weekly_tasks+completion_pct ustun mos; data=0 |
| 05.19 | Taktik vazifa kartaga (lavozimga) biriktirilsin | 2026-06-27 | TASDIQ-2146 §05 #19 | taskOwner=karta | strategic_tasks | Karta-biriktirish | Qisman | strategic_tasks(assignee_id)+owner_card_id; data=0, karta-bog'lash jonli yo'q |
| 05.20 | Stat-reglament (ta'rif/formula/birlik/chastota/egasi) | 2026-06-27 | TASDIQ-2146 §05 #20 | KPI reglament | stat_regulations | To'liq sxema | Qisman | definition/formula/unit/frequency/owner_card_id/version AYNAN; data=0 |
| 05.21 | Har ko'rsatkichga alohida chastota | 2026-06-27 | TASDIQ-2146 §05 #21 | Moslashuvchan chastota | stat_regulations.frequency | Chastota ustun | Qisman | frequency ustun bor; data=0 |
| 05.22 | Stat-reglament versiyalansin | 2026-06-27 | TASDIQ-2146 §05 #22 | Eski hisobot to'g'ri | stat_regulations.version | Versiya+valid_from | Qisman | version+valid_from+getHistory; data=0 |
| 05.23 | Ko'rsatkich egasi kartaga biriktirilsin | 2026-06-27 | TASDIQ-2146 §05 #23 | Odam ketsa egasi qoladi | stat_regulations.owner_card_id | Karta-egasi | Qisman | owner_card_id ustun+log; data=0, real bog'lash yo'q |
| 05.24 | Holat formulasi karta-modeldan yig'ilsin (qaysi lavozim sabab) | 2026-06-27 | TASDIQ-2146 §05 #24 | Golden-thread holat | company-state.repository | Karta→holat zanjir | Yo'q | getRawMetrics jadval-agregat (sales_invoices/employees/sessions); org_functions dan yig'ilmaydi |
| 05.25 | Director dashboard bir ekranda (holat+farq+muammo+alert) | 2026-06-27 | TASDIQ-2146 §05 #25 | Qo'mondonlik markazi | dashboard.controller | Yaxlit dashboard | Ha | getDashboard base+planFact+orderProgress+statTrends+openIssues; FE DirectorDashboard; Roles(DIRECTOR) |
| 05.26 | Strategik AI tahlilchi har kuni tahlil+tavsiya | 2026-06-27 | TASDIQ-2146 §05 #26 | AI qo'llab | director-ai.service | AI daily insight | Qisman | explainKpi/assessRisks/executiveSummary bor; dashboard aiInsights:[] (P35/P36 deferred) |
| 05.27 | Telegram bot /holat /kundalik /ideal_rasm | 2026-06-27 | TASDIQ-2146 §05 #27 | Bot buyruqlar | director.bot | 3 buyruq | Qisman | /kpi /ai /summary bor; /holat /kundalik /ideal_rasm YO'Q |
| 05.28 | Kunlik ertalabki avto-digest | 2026-06-27 | TASDIQ-2146 §05 #28 | Boshliq digesti | director-root owner-summary | Avto-cron digest | Qisman | owner-summary(5 raqam)+push bor; avto-cron ertalabki trigger yo'q (GET compute-only) |
| 05.29 | 5-darajali holat ro'yxati (O'SISH..INQIROZ)+rang | 2026-06-27 | TASDIQ-2146 §05 #29 | Holat klassifikatsiya | company_state_levels | 5 daraja+rang | Ha | 5 qator jonli OSISH(5)..INQIROZ(1)+color_hex; HOLAT_LEVELS konstanta |
| 05.30 | Strategiya yutuqlari 'bajarildi'+tarix | 2026-06-27 | TASDIQ-2146 §05 #30 | Motivatsiya | strategic_milestones | Bajarildi+arxiv | Qisman | 4 qator+createMilestone/status; completedAt to'liq arxiv jonli isbotlanmadi |
| 05.31 | Har kartada position_purpose matn maydoni | 2026-06-27 | TASDIQ-2146 §05 #31 | Lavozim maqsadi | org_functions.function_description | position_purpose | Qisman | function_description bor(≈maqsad) lekin alohida position_purpose yo'q; 0/97 to'la |
| 05.32 | ЦКП har kartaning asosiy chiqishi | 2026-06-27 | TASDIQ-2146 §05 #32 | Karta ЦКП | org_functions.tskp | ckp+formulaga bog' | Qisman | tskp/tskp_target/tskp_unit AYNAN; 19/97 to'la; holat formulasiga bog'lanish yo'q |
| 05.33 | '1-4 продукт' bo'sh maydonlari kartaga to'ldirilsin | 2026-06-27 | TASDIQ-2146 §05 #33 | Har karta 4 produkt | org_functions | product 1-4 ustun | Yo'q | org_functions da product/produkt 1-4 ustunlari YO'Q |
| 05.34 | Оргсхема joylashuv 5-Deprt/13-bo'lim/Sektsiya 3 maydon | 2026-06-27 | TASDIQ-2146 §05 #34 | Vysotskiy-7 kod | org_functions | department_no+unit_no+section_name | Yo'q | bu ustunlar YO'Q; faqat department_id(FK)+sub_department_name |
| 05.35 | 5-Departament ichida 5 bo'lim drill-down | 2026-06-27 | TASDIQ-2146 §05 #35 | Departament drill | dashboard plan-fact | 5-bo'lim drill endpoint | Yo'q | umumiy departments JOIN; 5-departament maxsus drill topilmadi; 5/13 kod yo'q |
| 05.36 | 'reja bajarilish %' bosh KPI (agregat+breakdown) | 2026-06-27 | TASDIQ-2146 §05 #36 | Bosh KPI | dashboard getPlanFact | Fabrika+bo'lim % | Qisman | bo'lim-kesim SQL real; production_orders/sessions=0 (jonli reja% nol) |
| 05.37 | 'Kechikishlar soni' + 'plan-og'ish soni' alohida | 2026-06-27 | TASDIQ-2146 §05 #37 | 2 counter+sabab | — | delay_count+plan_deviation_count | Yo'q | counter jadval/kod topilmadi; sabab-kategoriya bilan og'ish-counter yo'q |
| 05.38 | 'Bekor turish' (downtime) soat+sabab | 2026-06-27 | TASDIQ-2146 §05 #38 | Downtime kuzatuv | downtime_logs | Director downtime widget | Qisman | downtime_logs/events/reasons jadval bor; data=0, director-ulanish yo'q |
| 05.39 | A-System bilan ERP bog'lanishi (to'liq almashtirish?) | 2026-06-27 | TASDIQ-2146 §05 #39 | Ko'chish strategiya | — (egasi qarori) | Import/migratsiya qaror | egasi-data | Ko'chish-strategiya qarori (kod emas); mexanizm yo'q — egasi qarori kutiladi |
| 05.40 | '1 sutkalik ishlab-chiqarish rejasi' 24-soatlik ob'ekt | 2026-06-27 | TASDIQ-2146 §05 #40 | Sutkalik reja | — | daily_plan ob'ekt | Yo'q | daily_plan/sutka jadval YO'Q; plan-fact kunlik kesim bor lekin rasmiy ob'ekt yo'q |
| 05.41 | 'Ko'p uchraydigan xatolar' AI risk-reyestriga | 2026-06-27 | TASDIQ-2146 §05 #41 | AI risk | org_functions | Tipik-xatolar+AI | Yo'q | risk-registry ustun YO'Q; AI real-time xato-tekshirish yo'q |
| 05.42 | 'Muvaffaqiyatli harakatlar' ideal-model+AI baho | 2026-06-27 | TASDIQ-2146 §05 #42 | AI ideal-model | org_functions | Ideal-model ustun | Yo'q | ideal-model ustun YO'Q; AI baholash kodi yo'q |
| 05.43 | 'Javobgarliklari' (moddiy/ma'naviy) saqlansin | 2026-06-27 | TASDIQ-2146 §05 #43 | Javobgarlik | org_functions | responsibility ustun | Yo'q | responsibility/javobgarlik ustun YO'Q |
| 05.44 | 'Tijorat sirlari' kirishi audit-log+director | 2026-06-27 | TASDIQ-2146 §05 #44 | Maxfiylik audit | AuditInterceptor | Maxfiy-maydon audit | Qisman | AuditInterceptor+Q144 SuperAdmin RBAC bor; maxfiy-maydon (narx/mijoz) alohida audit yo'q |
| 05.45 | 'Energiya (suv/gaz/svet)' director ko'rsatkichi | 2026-06-27 | TASDIQ-2146 §05 #45 | Energiya trend | — | energy/utility jadval | Yo'q | energy/meter jadval (director uchun) YO'Q; mro_utility_readings=MRO moduli |
| 05.46 | 'Turniket' kirish-chiqish davomat statistikasi | 2026-06-27 | TASDIQ-2146 §05 #46 | Kech-kelish stat | attendance_logs | Turniket-integratsiya | Qisman | davomat jadval+getAttendanceToday bor; turniket-integratsiya+kech-kelish paneli yo'q |
| 05.47 | 'Nazorat varaqasi' har karta o'quv-ob'ekt | 2026-06-27 | TASDIQ-2146 §05 #47 | O'quv-nazorat | — | control_sheet jadval | Yo'q | control_sheet/nazorat_varaq jadval YO'Q; ai_exam_enabled bor lekin mavzu-ob'ekt yo'q |
| 05.48 | Nazorat varaqasi 'tasdiqlayman' (tema-tema) qadamlar | 2026-06-27 | TASDIQ-2146 §05 #48 | Mavzu-tasdiq | — | Confirm jadval | Yo'q | mavzu-tasdiq jadval/kod topilmadi (05.47 davomi) |
| 05.49 | Nazorat varaqasi senariy savollar (A/B/D) AI imtihon | 2026-06-27 | TASDIQ-2146 §05 #49 | AI imtihon | org_functions.ai_exam_enabled | Senariy→AI-imtihon | Qisman | ai_exam_enabled+ai-exam route(stub); senariy→AI ulanishi real emas |
| 05.50 | Yo'riqnoma 'TASDIQLAYMAN direktor' imzo+versiya | 2026-06-27 | TASDIQ-2146 §05 #50 | Yo'riqnoma versiya | org_functions.last_reviewed_at | Imzo+versiya+tanishdim | Qisman | last_reviewed_at bor; tasdiqlovchi+versiya+imzo hujjat-oqimi yo'q |
| 05.51 | 'Malaka talablari' kartaga+AI nomzod baho | 2026-06-27 | TASDIQ-2146 §05 #51 | Malaka+AI | org_functions | requirement ustun | Yo'q | requirement/malaka/tajriba/ta'lim ustun YO'Q (min/max_salary bor) |
| 05.52 | 'Lavozim vositalari' (A-System/hisobot/tex-karta) kartaga | 2026-06-27 | TASDIQ-2146 §05 #52 | Kerakli vositalar | org_functions | tools ustun | Yo'q | tools/vosita ustun YO'Q (vizyonda ham yo'q edi) |
| 05.53 | Har bo'lim Reja/Fakt/Qoldiq real-time | 2026-06-27 | TASDIQ-2146 §05 #53 | 25-04.xlsx kesim | dashboard getPlanFact | Real-time R/F/Q | Qisman | bo'lim-kesim SQL bor; operatsiya-kesim yo'q; data=0 |
| 05.54 | 'Zarur zakaz' navbati director o'zgartira oladi | 2026-06-27 | TASDIQ-2146 §05 #54 | Ustuvor buyurtma | director-state.service | markOrderVip+PP-event | Qisman | markOrderVip+VIP endpoint bor; PP-rejaga real-vaqt event tasdiqlanmadi |
| 05.55 | 'Brak soni' director sifat-yo'qotish (operatsiya/bo'lim/material) | 2026-06-27 | TASDIQ-2146 §05 #55 | Brak trend | company-state.repository | Brak kesim panel | Qisman | quality metrik defect_qty dan; operatsiya/material-kesim panel yo'q; data=0 |
| 05.56 | 'Dlitelnost/Nachat/Zavershit' operatsiya davomiylik (reja vs fakt) | 2026-06-27 | TASDIQ-2146 §05 #56 | Davomiylik og'ish | — | Reja-vs-fakt panel | Yo'q | operatsiya davomiylik paneli/kod topilmadi; sessions vaqt-og'ishi ulanmagan |
| 05.57 | 'Den/Noch' (kunduz/tun smena) statistika | 2026-06-27 | TASDIQ-2146 §05 #57 | Smena kesim | — | Smena statistika | Yo'q | den/noch kesim director statistika kodi topilmadi |
| 05.58 | Ishchi normasi % (Norma/Oylik%/Kuniga%) mehnat-samaradorlik | 2026-06-27 | TASDIQ-2146 §05 #58 | Norma% panel | — | Ishchi-norma % | Yo'q | norma% panel kodi topilmadi (razryad/koeff bor lekin norma% formula yo'q) |
| 05.59 | Operatsiya turlari norma (avtokley/GTO/kley/rezka 13 tur) | 2026-06-27 | TASDIQ-2146 §05 #59 | Operatsiya norma | — | operation_norm jadval | Yo'q | operation_norm jadval YO'Q; 13 tur normasi qurilmagan |
| 05.60 | 'Oddiy lak'/'Vib lak' alohida norma | 2026-06-27 | TASDIQ-2146 §05 #60 | Lak norma | — | Lak norma | Yo'q | lak operatsiya-turi normasi jadval/kod yo'q (05.59 bo'lagi) |
| 05.61 | Bandlik.xlsx pragon (min/soat/kun yuklama) CRP | 2026-06-27 | TASDIQ-2146 §05 #61 | Yuklama/CRP | — | Pragon hisob | Yo'q | pragon/yuklama CRP director kodi/jadvali topilmadi |
| 05.62 | 'Buyurtma tayyorligi %' + qaysi bo'limda | 2026-06-27 | TASDIQ-2146 §05 #62 | Progress panel | dashboard getOrderProgress | readiness_pct+dept | Qisman | readiness_pct+current_department SQL; data=0 (sales/production_orders bo'sh) |
| 05.63 | 'Ketgan/qolgan kun' buyurtma sikl-vaqt (reja vs fakt) | 2026-06-27 | TASDIQ-2146 §05 #63 | Sikl-vaqt trend | — | Sikl-vaqt panel | Yo'q | sikl-vaqt reja-vs-fakt director paneli/kod topilmadi |
| 05.64 | 'Priladka/setup vaqti' sozlash-yo'qotish | 2026-06-27 | TASDIQ-2146 §05 #64 | Setup vaqt | — | Setup panel | Yo'q | setup/priladka vaqti director kodi/ustuni topilmadi |
| 05.65 | Kichik buyurtmalar tahlili (kichiklashish%/dona-kg foyda) | 2026-06-27 | TASDIQ-2146 §05 #65 | Strategik panel | — | small_order tahlil | Yo'q | small_order tahlil jadval/kod topilmadi (grep bo'sh) |
| 05.66 | 'Razmer eski→yangi' format-opt AI tavsiya | 2026-06-27 | TASDIQ-2146 §05 #66 | AI format-opt | strategic-agent | Format-opt metodi | Yo'q | format-opt/razmer kod topilmadi; strategic-agent metodi yo'q |
| 05.67 | Buyurtma kodi formati (2024-0499, KT/PT/E) qidiruv | 2026-06-27 | TASDIQ-2146 §05 #67 | Rasmiy format | sales_orders.order_number | Klishe-kod+qidiruv | Qisman | order_number qidiruvda; KT/PT/E klishe-format+maxsus qidiruv tasdiqlanmadi |
| 05.68 | Departament (vertikal) ╳ operatsiya (gorizontal) 2 o'q drill | 2026-06-27 | TASDIQ-2146 §05 #68 | 2-o'q drill | dashboard | Operatsiya o'qi | Yo'q | departament-kesim bor; operatsiya-turi o'qi yo'q (05.59 qurilmagani uchun) |
| 05.69 | Statistik ko'rsatkich vaqt-trend grafigi+yo'nalish | 2026-06-27 | TASDIQ-2146 §05 #69 | Vysotskiy trend | dashboard getStatTrends | Trend+yo'nalish | Ha | kpi_definitions×kpi_values json_agg trend_points SQL; kpi_values=60 qator jonli |
| 05.70 | Trend 'yiqilish/o'sish holati' avto-aniqlansin | 2026-06-27 | TASDIQ-2146 §05 #70 | Trend condition | kpi_values.status | Rate-of-change→holat | Qisman | status ustun+trend-daraja bor; qiyalikdan avto-holat+chora-taklif kodi yo'q |
| 05.71 | Har ko'rsatkichga mas'ul karta+pasayganda alert | 2026-06-27 | TASDIQ-2146 §05 #71 | Mas'ul+alert | stat_regulations.owner_card_id | Pasayganda alert | Qisman | owner_card_id sxema bor; pasayganda kartaga-alert routing yo'q; data=0 |
| 05.72 | 'Hisobotlarni o'z vaqtida' reglament (topshirildi/kechikdi) | 2026-06-27 | TASDIQ-2146 §05 #72 | Hisobot-tracker | coordination.controller | Deadline-eslatma | Qisman | dokla+rasporyazhenie bor; hisobot topshirildi/kechikdi tracker+deadline aniq emas |
| 05.73 | Director real-time + kunlik snapshot ikkalasi | 2026-06-27 | TASDIQ-2146 §05 #73 | Live+snapshot | dashboard.controller | mode parametri | Ha | getDashboard(?mode=snapshot|realtime); snapshot.cron kunlik yozadi |
| 05.74 | Og'ishda 'tomir-kesish' (root-cause) drill | 2026-06-27 | TASDIQ-2146 §05 #74 | Root-cause | dashboard order-progress | Sabab→buyurtma drill | Qisman | current_department drill bor; og'ish→sabab→buyurtma to'liq zanjir yo'q (05.37 counter yo'q) |
| 05.75 | Smena rejasi 2 buyurtma aralashish konflikt alerti | 2026-06-27 | TASDIQ-2146 §05 #75 | Aralashish riski | — | Konflikt alert | Yo'q | material-aralashish-riski alert kodi/event topilmadi |
| 05.76 | Xato 'tushunmaslik/e'tiborsizlik/qoidabuzarlik' AI tasnif+o'quv | 2026-06-27 | TASDIQ-2146 §05 #76 | AI xato-tasnif | — | AI tasniflash | Yo'q | AI xato-tasniflash kodi topilmadi |
| 05.77 | 'Chiqindilar' (kg) ekologik+qayta-ishlash% | 2026-06-27 | TASDIQ-2146 §05 #77 | Ekologik ko'rsatkich | waste_records | Chiqindi widget | Qisman | waste_records+waste_targets jadval bor; data=0, director-ulanish yo'q |
| 05.78 | Director 'ma'lumot so'rash huquqi' bo'limlararo workflow | 2026-06-27 | TASDIQ-2146 §05 #78 | Gorizontal so'rov | coordination.controller | So'rov→javob izi | Qisman | dokla+rasporyazhenie mexanizmi bor; aniq info-request→javob izi workflow to'liq emas |
| 05.79 | Karta-AI hisobotlari director agregat (qaysi lavozim erishmayapti) | 2026-06-27 | TASDIQ-2146 §05 #79 | Karta-AI agregat | director-ai.service | Karta-AI→agregat | Yo'q | karta-AI hisobot+agregat kodi yo'q; director-ai umumiy KPI; aiInsights:[] |
| 05.80 | Ko'rsatkich 'ideal qiymati' (ostona) egasi belgilaydi | 2026-06-27 | TASDIQ-2146 §05 #80 | Har karta ostona | state_thresholds/kpi_definitions | Ostona+endpoint | egasi-data | sxema+Patch endpoint TAYYOR; qiymatlar seed-default, egasi-tuzatishi kutiladi |
| 05.81 | 'Poddon' qayta-ishlatiladigan resurs aylanishi (yetishmovchilik→downtime) | 2026-06-27 | TASDIQ-2146 §05 #81 | Paddon aylanishi | ow_pallet_recoveries | Aylanish+downtime | Qisman | jadval MAVJUD; data=0, director-ulanish+downtime bog' yo'q |
| 05.82 | Director 'haftalik ishlab-chiqargan vs qolgan' | 2026-06-27 | TASDIQ-2146 §05 #82 | Haftalik trend | — | Haftalik fakt panel | Yo'q | haftalik ishlab-chiqargan-vs-qolgan paneli/kod yo'q (weekly_tasks fakt emas) |
| 05.83 | Yo'nalish (ofs kar/ofs gof/flx gof) statistika | 2026-06-27 | TASDIQ-2146 §05 #83 | Yo'nalish kesim | — | Yo'nalish statistika | Yo'q | yo'nalish-kesim director statistika kodi/ustuni topilmadi |
| 05.84 | 'Algoritm turi' (2-8 bo'lim) murakkablik+vaqt prognozi | 2026-06-27 | TASDIQ-2146 §05 #84 | Murakkablik prognoz | — | Algoritm-turi ustun | Yo'q | algoritm-turi buyurtma murakkablik ustuni/kod topilmadi |
| 05.85 | Director paneliga 'tozalik/intizom' (5S) ko'rsatkichi | 2026-06-27 | TASDIQ-2146 §05 #85 | 5S panel | kaizen_suggestions | 5S/tozalik panel | Qisman | kaizen+HR intizom infra bor; director maxsus 5S/tozalik panel yo'q |

### Step 3 — Ochiq savollar (❌/🔑 dan)
| Savol/Muammo | Qachon | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Holat formulasi karta-modeldan yig'ilmaydi (jadval-agregat) | 2026-06-27 | TASDIQ-2146 §05 #24 | karta-AI→holat zanjiri qurilmagan; getRawMetrics jadval darajasida | Director/Org |
| '1-4 produkt' kartaga to'ldirilmaydi | 2026-06-27 | TASDIQ-2146 §05 #33 | org_functions da product 1-4 ustunlari yo'q | Director/Org |
| Оргсхема 3-maydonli kod (5-Deprt/13-bo'lim/Sektsiya) yo'q | 2026-06-27 | TASDIQ-2146 §05 #34 | department_no/unit_no/section_name ustunlari yo'q | Director/Org |
| 5-Departament 5-bo'lim drill-down yo'q | 2026-06-27 | TASDIQ-2146 §05 #35 | maxsus drill endpoint yo'q; 5/13 raqamli struktura yo'q | Director |
| Kechikish+plan-og'ish counter (2 alohida) yo'q | 2026-06-27 | TASDIQ-2146 §05 #37 | delay_count/plan_deviation_count jadval/kod yo'q | Director |
| A-System ERP bog'lanishi (to'liq almashtirish?) | 2026-06-27 | TASDIQ-2146 §05 #39 | ko'chish-strategiya = egasi qarori, kod emas | Director/egasi |
| '1 sutkalik ishlab-chiqarish rejasi' ob'ekti yo'q | 2026-06-27 | TASDIQ-2146 §05 #40 | daily_plan/sutka jadval qurilmagan | Director/PP |
| 'Ko'p uchraydigan xatolar' AI risk-reyestri yo'q | 2026-06-27 | TASDIQ-2146 §05 #41 | risk-registry ustun+AI real-time yo'q | Director/AI |
| 'Muvaffaqiyatli harakatlar' ideal-model+AI baho yo'q | 2026-06-27 | TASDIQ-2146 §05 #42 | ideal-model ustun+AI kodi yo'q | Director/AI |
| 'Javobgarliklari' (moddiy/ma'naviy) saqlanmaydi | 2026-06-27 | TASDIQ-2146 §05 #43 | responsibility ustun yo'q | Director/Org |
| 'Energiya (suv/gaz/svet)' director ko'rsatkichi yo'q | 2026-06-27 | TASDIQ-2146 §05 #45 | energy/meter jadval (director) yo'q; faqat MRO | Director |
| 'Nazorat varaqasi' o'quv-ob'ekt yo'q | 2026-06-27 | TASDIQ-2146 §05 #47 | control_sheet jadval yo'q | Director/LMS |
| Nazorat varaqasi 'tasdiqlayman' tema-qadamlar yo'q | 2026-06-27 | TASDIQ-2146 §05 #48 | mavzu-tasdiq jadval/kod yo'q | Director/LMS |
| 'Malaka talablari' kartaga+AI nomzod yo'q | 2026-06-27 | TASDIQ-2146 §05 #51 | requirement/malaka ustun yo'q | Director/Org/HR |
| 'Lavozim vositalari' kartaga biriktirilmaydi | 2026-06-27 | TASDIQ-2146 §05 #52 | tools/vosita ustun yo'q | Director/Org |
| Operatsiya davomiylik (reja vs fakt) paneli yo'q | 2026-06-27 | TASDIQ-2146 §05 #56 | davomiylik panel/kod yo'q | Director/MES |
| 'Den/Noch' smena statistika yo'q | 2026-06-27 | TASDIQ-2146 §05 #57 | smena-kesim statistika kodi yo'q | Director/MES |
| Ishchi normasi % (Norma/Oylik%/Kuniga%) panel yo'q | 2026-06-27 | TASDIQ-2146 §05 #58 | norma% formula/panel qurilmagan | Director/HR |
| Operatsiya turlari norma (13 tur) yo'q | 2026-06-27 | TASDIQ-2146 §05 #59 | operation_norm jadval yo'q | Director/PP |
| 'Oddiy lak'/'Vib lak' alohida norma yo'q | 2026-06-27 | TASDIQ-2146 §05 #60 | lak operatsiya-turi normasi yo'q | Director/PP |
| Bandlik.xlsx pragon (CRP yuklama) yo'q | 2026-06-27 | TASDIQ-2146 §05 #61 | pragon CRP director kodi/jadvali yo'q | Director/CRP |
| Buyurtma sikl-vaqt (reja vs fakt) trend yo'q | 2026-06-27 | TASDIQ-2146 §05 #63 | sikl-vaqt panel/kod yo'q | Director |
| 'Priladka/setup vaqti' panel yo'q | 2026-06-27 | TASDIQ-2146 §05 #64 | setup vaqti director kodi/ustuni yo'q | Director/MES |
| Kichik buyurtmalar tahlili (foyda) yo'q | 2026-06-27 | TASDIQ-2146 §05 #65 | small_order tahlil jadval/kod yo'q | Director |
| 'Razmer eski→yangi' format-opt AI tavsiya yo'q | 2026-06-27 | TASDIQ-2146 §05 #66 | strategic-agent format-opt metodi yo'q | Director/AI |
| Departament ╳ operatsiya 2-o'q drill yo'q | 2026-06-27 | TASDIQ-2146 §05 #68 | operatsiya o'qi yo'q (05.59 qurilmagan) | Director |
| Smena rejasi buyurtma-aralashish konflikt alerti yo'q | 2026-06-27 | TASDIQ-2146 §05 #75 | aralashish-riski alert/event yo'q | Director/MES |
| Xato AI tasnif (tushunmaslik/e'tiborsizlik/qoidabuzarlik) yo'q | 2026-06-27 | TASDIQ-2146 §05 #76 | AI xato-tasniflash kodi yo'q | Director/AI |
| Karta-AI hisobotlari director agregat yo'q | 2026-06-27 | TASDIQ-2146 §05 #79 | karta-AI agregat kodi yo'q; aiInsights:[] | Director/AI |
| Ko'rsatkich 'ideal qiymati' (ostona) egasi kiritishi kutiladi | 2026-06-27 | TASDIQ-2146 §05 #80 | sxema+endpoint tayyor, qiymatlar seed-default = egasi-data | Director/egasi |
| Director 'haftalik ishlab-chiqargan vs qolgan' panel yo'q | 2026-06-27 | TASDIQ-2146 §05 #82 | haftalik fakt panel/kod yo'q | Director |
| Yo'nalish (ofs kar/gof/flx) statistika yo'q | 2026-06-27 | TASDIQ-2146 §05 #83 | yo'nalish-kesim statistika kodi/ustuni yo'q | Director |
| 'Algoritm turi' (2-8 bo'lim) murakkablik+vaqt prognozi yo'q | 2026-06-27 | TASDIQ-2146 §05 #84 | algoritm-turi murakkablik ustuni/kod yo'q | Director/PP |
