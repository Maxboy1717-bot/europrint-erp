# 08 — MES / Ishlab chiqarish — Mustaqil Tekshiruv (2026-06-27)

Module: 08 MES / Ishlab chiqarish (82 savol)
Doc self-claim: vizyon 38%
Doc flag tally: bor 6, qisman 33, yoq 43, egasi-data 0

Verifier reassessment: bor 6, qisman 32, yoq 44, egasi-data 0
realPct (recomputed over 82 verifiable) = round(100*(6 + 0.5*32)/82) = **27%**

Umumiy xulosa: hujjat g'oyat aniq va konservativ. 82 ta Isbot da'vosidan deyarli barchasi
jonli kod + DB bilan tasdiqlandi. Faqat 1 ta da'vo haddan oshirilgan.

## REFUTED CLAIMS
- **08.70** — Isbot "production-agent.service.ts:125 detectBottleneck() production_operations'dan pending-queue topadi" deydi. Kod satr 125-127 da haqiqatan `FROM production_operations` so'rovi bor, LEKIN `production_operations` jadvali DB'da UMUMAN MAVJUD EMAS (`to_regclass` → null, count → "отношение не существует"). Demak detectBottleneck() runtime'da ishlamaydi — qisman emas, mavjud emas. (qisman → yoq)

---

## 08.1 — EP-MES-001 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: 3 bosqich SETUP/MAIN/TEARDOWN
- Doc Isbot: production-session.aggregate.ts:85-91 GsdStage + STAGE_ORDER; production_sessions setup/main/teardown_seconds, current_stage, stage_started_at
- Tekshiruv: aggregate:84-91 `enum GsdStage { SETUP/MAIN/TEARDOWN/DONE }` + STAGE_ORDER massivi TASDIQLANDI. production_sessions ustunlari: setup_seconds, main_seconds, teardown_seconds, current_stage, stage_started_at — barchasi MAVJUD. CONFIRMED.

## 08.2 — EP-MES-002 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Bosqich qo'lda operator tugmasi
- Doc Isbot: IoTProductionDashboard.tsx operator qo'lda
- Tekshiruv: artifacts/.../pages/iot/IoTProductionDashboard.tsx mavjud; IoT-tablet qo'lda oqim (08.80 bilan tasdiqlangan). Sensor-avto yo'q (vizyonga mos). CONFIRMED.

## 08.3 — EP-MES-003 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 3 smena 12h A/B/C
- Doc Isbot: shift_types MORNING/EVENING/NIGHT 9.0h, A/B/C emas; mes.dto.ts:19 enum morning/afternoon/night
- Tekshiruv: shift_types DB: 3 qator MORNING/EVENING/NIGHT, duration_hours=9.0 (12 emas), A/B/C YO'Q. mes.dto.ts:19 `z.enum(['morning','afternoon','night'])` TASDIQLANDI. CONFIRMED.

## 08.4 — EP-MES-004 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Brigada tushunchasi
- Doc Isbot: machine_crews (master/polmaster/shogird/rokler) role-fixed; 2 qator
- Tekshiruv: machine_crews mavjud, ustunlar: master_id, polmaster_id, shogird_id, rokler_id (fixed) + role, work_center_id. 2 qator. Brigadir/smena-biriktirish alohida ustun yo'q. CONFIRMED.

## 08.5 — EP-MES-005 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Brigada tarkibini kim belgilaydi
- Doc Isbot: brigadir-tasdiq/doimiy-biriktirish yo'q; A/B/C brigada jadvali topilmadi
- Tekshiruv: machine_crews'da brigadir-tasdiq mexanizmi yo'q; A/B/C smena yo'q (08.61). CONFIRMED.

## 08.6 — EP-MES-006 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Material sarf avto-norma + operator tasdiq
- Doc Isbot: mes_material_consumption (session_id/material_id/quantity/batch_number) 1 qator; avto-norma+GL tasdiqlanmadi
- Tekshiruv: mes_material_consumption mavjud, ustunlar tasdiqlandi, 1 qator. material_norms = BOM (0 qator), avto-norma-yechim yo'q. CONFIRMED.

## 08.7 — EP-MES-007 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Norma manbai texkarta/BOM
- Doc Isbot: technology_cards + pp_routing; material_norms.technology_card_id FK
- Tekshiruv: technology_cards (1 qator), pp_routing (0 qator) mavjud; material_norms.technology_card_id ustuni TASDIQLANDI. Per-station ishlab-chiqarish normasi o'qish yo'q. CONFIRMED.

## 08.8 — EP-MES-008 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Norma chetlashuvi farq%
- Doc Isbot: Per-station ishlab-chiqarish norma jadvali yo'q
- Tekshiruv: material_norms BOM normasi (norm_quantity_per_1000), ishlab-chiqarish unum normasi jadvali yo'q. CONFIRMED.

## 08.9 — EP-MES-009 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: SOS bosqichli eskalatsiya
- Doc Isbot: IoT-tablet SOS (sos_alerts, /api/iot/tablet/sos-alert) + mes_sos_events; bosqichli eskalatsiya tasdiqlanmadi
- Tekshiruv: iot-tablet.controller.ts:177 @Post('tablet/sos-alert'); iot-tablet.service.ts:225 sos_alerts INSERT + SosAlertRaisedEvent. mes_sos_events jadvali mavjud (0 qator). 15/30 daq avto-ko'tarish yo'q. CONFIRMED.

## 08.10 — EP-MES-010 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: SOS sabab toifalari
- Doc Isbot: mes_downtime_reasons 7 generik kod, reja-xato/kadr yo'q
- Tekshiruv: mes_downtime_reasons 7 qator (DT-MECH/ELECT/MAT/SETUP/MAINT/QUAL/SHIFT). Kitobning 6 toifasi to'liq yo'q. CONFIRMED.

## 08.11 — EP-MES-011 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Downtime kod boyitish
- Doc Isbot: 7 generik kod; downtime_reason_codes BO'SH
- Tekshiruv: mes_downtime_reasons 7 kod; downtime_reason_codes 0 qator. Maxsus kodlar (ish-yo'q/переделка) yo'q. CONFIRMED.

## 08.12 — EP-MES-012 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Rejali vs rejasiz ajratish
- Doc Isbot: mes_downtime_reasons.is_planned + category; downtime_events.is_planned
- Tekshiruv: mes_downtime_reasons ustunlar is_planned (t/f) + category TASDIQLANDI (DT-SETUP/MAINT/SHIFT=true, qolgan false). downtime_events.is_planned ham mavjud. CONFIRMED.

## 08.13 — EP-MES-013 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Downtime kim/qachon kiritadi
- Doc Isbot: /api/iot/downtime-events; downtime_events.reported_by/started_at/reason_code
- Tekshiruv: iot-tablet.controller.ts:577 @Post('downtime-events'). downtime_events ustunlari reported_by, started_at, reason_code TASDIQLANDI. CONFIRMED.

## 08.14 — EP-MES-014 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: OEE darajalar
- Doc Isbot: get-oee.handler.ts mashina darajasida real OEE; smena/brigada/sex rollup yo'q
- Tekshiruv: get-oee.handler.ts:135-152 real OEE (availability=runTime/plannedTime × performance × quality), per-machine. production_sessions'dan. Smena/brigada/sex rollup yo'q. CONFIRMED.

## 08.15 — EP-MES-015 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: OEE target/threshold
- Doc Isbot: target/threshold jadval yo'q; MESExtended.tsx:146 worldClass=85 hardcoded
- Tekshiruv: MESExtended.tsx:146 `machines.filter(m => Number(m.oee||0) >= 85)` — 85 hardcoded, sozlanmaydi. Per-mashina target jadvali topilmadi. CONFIRMED.

## 08.16 — EP-MES-016 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Jonli monitoring ekrani
- Doc Isbot: MESExtended.tsx OEE jadval + mes.gateway.ts WS; rangli sex-tablo emas
- Tekshiruv: mes.gateway.ts WebSocket /mes namespace, pushOeeUpdate, oee:subscribe. MESExtended OEE-ro'yxat. Rangli "kim-qaysi-mashinada" tablo emas. CONFIRMED.

## 08.17 — EP-MES-017 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Jonli yangilanish 1-5 daq
- Doc Isbot: mes.gateway WS push; 1-5 daq interval tasdiqlanmadi
- Tekshiruv: mes.gateway.ts emit('oee:update') mes-oee-cron'dan; aniq 1-5 daq interval + SOS-darhol ajratish kodda ko'rinmaydi. CONFIRMED.

## 08.18 — EP-MES-018 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: To'xtagan mashina avto-ogohlantirish 15/30daq
- Doc Isbot: vaqt-asosli avto-eskalatsiya yo'q; production-agent cron 30daq faqat kechikkan buyurtma
- Tekshiruv: production-agent.service.ts:149 @Cron(EVERY_30_MINUTES) → monitorOrders (delayed buyurtma), mashina-to'xtash signal emas. CONFIRMED.

## 08.19 — EP-MES-019 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Operator kartasiga ulash
- Doc Isbot: production_sessions.operator_card_id; MES_TO_HR_360 event; operator_daily_stats=0
- Tekshiruv: production_sessions.operator_card_id ustuni mavjud; aggregate:221 type:'MES_TO_HR_360' + mes-to-hr-360.event.ts; drizzle-mes.repo operator_card_id writer (COALESCE card_id). operator_daily_stats 0 qator → zanjir to'liq emas. CONFIRMED.

## 08.20 — EP-MES-020 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Operator GSD vaznli ball
- Doc Isbot: actual_quantity/defect_quantity; vaznli GSD formula tasdiqlanmadi; operator_performance_summary
- Tekshiruv: production_sessions.actual_quantity + defect_quantity mavjud. operator_performance_summary jadvali mavjud (0 qator). Vaznli ball formula MES'da topilmadi. CONFIRMED.

## 08.21 — EP-MES-021 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Razryad va natija
- Doc Isbot: razryad_levels (org) bor; MES→razryad-o'sish tasdiqlanmadi; egasi-data
- Tekshiruv: razryad_levels 6 qator. MES natija→razryad-o'sish bog'lanishi MES kodida yo'q. CONFIRMED.

## 08.22 — EP-MES-022 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Brak sabab toifalash
- Doc Isbot: IoT-tablet brak qayd + inline_qc_checks; toifa master-data tasdiqlanmadi
- Tekshiruv: iot-tablet.controller.ts:565 INSERT INTO inline_qc_checks (sample_size/defect_count/pass_rate). inline_qc_checks jadval mavjud (0 qator). Brak-sabab toifa master-data + mas'ul-bosqich yo'q. CONFIRMED.

## 08.23 — EP-MES-023 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Smena handover
- Doc Isbot: shift_handovers (machine_status/pending_tasks/quality_issues) + raqamli imzo; 2-taraf tasdiq tasdiqlanmadi; 0 qator
- Tekshiruv: shift_handovers ustunlar: machine_status, pending_tasks, quality_issues, handed_over_by, received_by, signature_data, status — TASDIQLANDI (qabul-tasdiq ustunlari aslida mavjud). 0 qator. CONFIRMED (hujjat biroz kam baholagan: received_by/status bor).

## 08.24 — EP-MES-024 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Work order PP'dan avto
- Doc Isbot: production_sessions.production_order_id/order_id FK; IoT buyurtma tanlash; mes_papka_orders 0 qator
- Tekshiruv: production_sessions.production_order_id + order_id ustunlari mavjud. mes_papka_orders 0 qator → PP→MES avto-tushish to'liq emas. CONFIRMED.

## 08.25 — EP-MES-025 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Reja vs fakt farq%
- Doc Isbot: target_quantity vs actual_quantity; farq%+majburiy sabab tasdiqlanmadi
- Tekshiruv: production_sessions.target_quantity + actual_quantity mavjud. Farq%+majburiy-sabab mexanizmi topilmadi. CONFIRMED.

## 08.26 — EP-MES-026 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Smena baholash vaznli ball
- Doc Isbot: mes_shift_evaluations + shift_evaluations (0 qator); formula tasdiqlanmadi
- Tekshiruv: mes_shift_evaluations va shift_evaluations jadvallari mavjud, ikkalasi 0 qator. Vaznli formula tasdiqlanmadi. CONFIRMED.

## 08.27 — EP-MES-027 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Bonus/reyting ulanish
- Doc Isbot: ball→bonus→payroll zanjiri yo'q; smena-baholash 0 qator
- Tekshiruv: shift_evaluations 0 qator; ball→toifa→bonus payroll avto-zanjiri MES kodida yo'q. CONFIRMED.

## 08.28 — EP-MES-028 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: AI ishlab chiqarish nazoratchisi
- Doc Isbot: mes-monitor.service.ts:212-213 z-score + HITL escalation (mes.machine.anomaly_alert) REAL; LLM narrativ emas
- Tekshiruv: mes-monitor.service.ts:211-215 handleAlert() → events.emit('mes.machine.anomaly_alert', {machineId, zScore, value, absZ}); computeZScore() :169. REAL anomaliya z-score + HITL escalation. LLM kunlik narrativ yo'q. CONFIRMED.

## 08.29 — EP-MES-029 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Lot traceability
- Doc Isbot: mes_material_consumption.batch_number (1 qator); FIFO/FEFO tasdiqlanmadi
- Tekshiruv: mes_material_consumption.batch_number ustuni mavjud, 1 qator. FIFO/FEFO + rulon/папка to'liq yo'q. CONFIRMED.

## 08.30 — EP-MES-030 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Texkarta checklist
- Doc Isbot: setup_checklists/checklist_items + passChecklist() gate; adherence tasdiqlanmadi
- Tekshiruv: aggregate:390 passChecklist() + start-session.handler:66-71 getChecklistStatus→passChecklist gate REAL. setup_checklists/checklist_items jadvallari mavjud (0 qator). Per-bosqich adherence belgilash yo'q. CONFIRMED.

## 08.31 — EP-MES-031 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'А смена План' forma
- Doc Isbot: MESExtended.tsx = OEE dashboard, smena reja-forma yo'q
- Tekshiruv: MESExtended.tsx OEE jadval (machines OEE/worldClass). 'А смена План' ustun-ma-ustun forma topilmadi. CONFIRMED.

## 08.32 — EP-MES-032 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Reja/fakt 4 maydon
- Doc Isbot: started_at/ended_at + start_time/end_time (fakt); reja-boshlash/tugatish to'liq emas
- Tekshiruv: production_sessions ustunlar: started_at, ended_at, start_time, end_time (faqat fakt). Reja-boshlash + reja-tugatish alohida 4-maydon yo'q. CONFIRMED.

## 08.33 — EP-MES-033 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Operator+yordamchi juftlik
- Doc Isbot: machine_crews master/polmaster/shogird/rokler (fixed 4 rol); 1op+N yordamchi mos emas; hissa% yo'q
- Tekshiruv: machine_crews ustunlar fixed 4 rol (master/polmaster/shogird/rokler). Yordamchi-hissa% ustuni yo'q. CONFIRMED.

## 08.34 — EP-MES-034 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Norma soatlik+12h ikki baza
- Doc Isbot: ishlab-chiqarish norma jadvali yo'q
- Tekshiruv: material_norms (BOM) bor lekin soatlik/12h baza ustunlari yo'q; per-station norma jadvali yo'q. CONFIRMED.

## 08.35 — EP-MES-035 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Norma birligi stansiyaga
- Doc Isbot: stansiya×birlik jadvali yo'q; equipment'da birlik yo'q
- Tekshiruv: equipment jadvalida birlik ustuni yo'q; norma jadvali yo'q. CONFIRMED.

## 08.36 — EP-MES-036 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'иш йук' alohida
- Doc Isbot: mes_downtime_reasons 7 kodda ish-yo'q/reja-xato yo'q
- Tekshiruv: 7 kod (DT-MECH..SHIFT) — ish-yo'q/reja-xato toifa yo'q; downtime_reason_codes 0 qator. CONFIRMED.

## 08.37 — EP-MES-037 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ish-yo'q paytida qaytarilgan ish
- Doc Isbot: qayta-biriktirilgan ish qayd yo'q; ish-yo'q turi yo'q
- Tekshiruv: ish-yo'q turi yo'q (08.36), qaytarilgan-ish qayd mexanizmi topilmadi. CONFIRMED.

## 08.38 — EP-MES-038 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ofset/Flekso alohida normalash
- Doc Isbot: bo'lim ajratish + НО-mas'ul jadvali yo'q
- Tekshiruv: norma jadvali umuman yo'q; Ofset/Flekso НО-mas'ul biriktirish topilmadi. CONFIRMED.

## 08.39 — EP-MES-039 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ~30 mashina master-data
- Doc Isbot: equipment 7 generik; work_centers 12 generik
- Tekshiruv: equipment 7 qator (Ofset #1 DEMO, Offset 1/2, Flexoprint 1, Qirqish 1, Laminatsiya, Raqamli) — kitobning ~30 mashinasi YO'Q. work_centers 12 qator. CONFIRMED.

## 08.40 — EP-MES-040 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tigel 1-10 alohida birlik
- Doc Isbot: equipment'da Тигель 1-10 yo'q
- Tekshiruv: 7 equipment qatorida Тигель yo'q. CONFIRMED.

## 08.41 — EP-MES-041 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 'keyingi ish' (очередь)
- Doc Isbot: machine_tasks (priority/due_date/equipment_id) 0 qator; navbat ko'rsatish tasdiqlanmadi
- Tekshiruv: machine_tasks ustunlar priority, due_date, equipment_id TASDIQLANDI, 0 qator. Joriy+navbat 2-3 FE'da tasdiqlanmadi. CONFIRMED.

## 08.42 — EP-MES-042 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Bir mashina ikki bo'lim
- Doc Isbot: mashina×bo'lim birikma jadvali yo'q
- Tekshiruv: mashina×bo'lim birlik jadvali topilmadi; equipment generik. CONFIRMED.

## 08.43 — EP-MES-043 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Kim qaysi mashinada jonli
- Doc Isbot: operator→mashina bandlik yo'q; machine_status_logs 9 qator mashina holati
- Tekshiruv: machine_status_logs 9 qator (mashina holati). Jonli operator→mashina bandlik jadvali topilmadi. CONFIRMED.

## 08.44 — EP-MES-044 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Bir operator ko'p mashina foiz/vaqt
- Doc Isbot: machine_crews session_id-ga bog'langan (1=1); ulush modeli yo'q
- Tekshiruv: machine_crews.session_id mavjud (1 sessiya=1 mashina). Operator→ko'p-mashina foiz/vaqt ulush yo'q. CONFIRMED.

## 08.45 — EP-MES-045 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Qadoqlash alohida bosqich/norma
- Doc Isbot: qadoqlash bosqich/norma jadvali yo'q
- Tekshiruv: per-bosqich norma yo'q (08.34); qadoqlash alohida bosqich topilmadi. CONFIRMED.

## 08.46 — EP-MES-046 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: переделка alohida yo'qotish
- Doc Isbot: 7 generik kodda переделка yo'q
- Tekshiruv: mes_downtime_reasons 7 kodda 'переделка'/qayta-ishlash turi yo'q. CONFIRMED.

## 08.47 — EP-MES-047 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Qolib tayyor emas sabab kodi
- Doc Isbot: 'Qolib kechikishi' kodi yo'q; KB signal yo'q
- Tekshiruv: 7 kodda qolib/forma sabab yo'q; KB-bo'lim ulanishi topilmadi. CONFIRMED.

## 08.48 — EP-MES-048 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Murakkab sozlash alohida vaqt
- Doc Isbot: aggregate SETUP bosqichi (setup_seconds) MAIN'dan ajratadi
- Tekshiruv: aggregate:85 GsdStage.SETUP + production_sessions.setup_seconds ustuni MAVJUD → sozlash vaqti MAIN'dan alohida. OEE Availability'ga asos. CONFIRMED.

## 08.49 — EP-MES-049 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Norma sof ish vaqtiga (tanaffus chegirish)
- Doc Isbot: tanaffus/tushlik/namoz avto-chegirish yo'q; norma jadvali yo'q
- Tekshiruv: sof-ish-vaqt chegirish mexanizmi topilmadi; norma jadvali yo'q. CONFIRMED.

## 08.50 — EP-MES-050 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 3-smenali tushlik navbat
- Doc Isbot: 1/2/3-to'lqin tushlik navbat yo'q
- Tekshiruv: tushlik navbat boshqaruvi MES'da topilmadi. CONFIRMED.

## 08.51 — EP-MES-051 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Namoz tanaffus ajratish
- Doc Isbot: namoz-vaqt chegirish/navbat yo'q
- Tekshiruv: namoz chegirish mexanizmi topilmadi (08.49 bilan). CONFIRMED.

## 08.52 — EP-MES-052 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mustaqil ruxsat = operatorlik
- Doc Isbot: start-session.handler.ts:40-60 LMS sertifikat HARD-BLOCK (checkOperatorCertification, FORBIDDEN); course-asosli, mashina-turi matritsa emas
- Tekshiruv: start-session.handler.ts:40-60 — getCertificationRequired() bo'lsa checkOperatorCertification(operatorId, courseId), valid emas→Err(FORBIDDEN). REAL hard-block. Course-asosli (courseId), mashina-turi matritsa emas (08.54). CONFIRMED.

## 08.53 — EP-MES-053 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ustoz-shogird
- Doc Isbot: machine_crews.shogird_id; 'ustoz nazoratida' bayroq + brak-ajratish tasdiqlanmadi
- Tekshiruv: machine_crews.shogird_id ustuni mavjud. 'Ustoz nazoratida' bayroq + brak-ajratish mexanizmi topilmadi. CONFIRMED.

## 08.54 — EP-MES-054 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Operator×mashina malaka matritsasi
- Doc Isbot: operator_certifications kurs-asosli; mashina-turi×operator matritsa yo'q; 0 qator
- Tekshiruv: operator_certifications jadvali 0 qator; mashina-turi×operator matritsa topilmadi (cert kurs-asosli). CONFIRMED.

## 08.55 — EP-MES-055 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: RD-4/Direktor tasdiq norma
- Doc Isbot: norma jadvali yo'q → tasdiq zanjiri yo'q; material_norms approval ustuni yo'q
- Tekshiruv: material_norms ustunlarida approval/RD-4/direktor tasdiq ustuni yo'q. CONFIRMED.

## 08.56 — EP-MES-056 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Norma versiya+sana
- Doc Isbot: norma versiyalash jadvali yo'q; material_norms effective-date/version yo'q
- Tekshiruv: material_norms ustunlarida effective_date/version yo'q (faqat created_at/updated_at). CONFIRMED.

## 08.57 — EP-MES-057 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mahsulot kodlash format
- Doc Isbot: sales_orders/pp папка kodlari SD/PP'da; MES sessiyada to'liq struktura tasdiqlanmadi
- Tekshiruv: production_sessions'da KT-kod/папка/marka alohida maydon yo'q (session_number bor). SD/PP'da papka kodlari mavjud (boshqa modul). CONFIRMED.

## 08.58 — EP-MES-058 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'Укишга'/'Академияга' ajratish
- Doc Isbot: production_sessions'da o'quv-tur ustuni yo'q
- Tekshiruv: production_sessions ustunlarida o'quv/Akademiya ish-turi bayrog'i yo'q. CONFIRMED.

## 08.59 — EP-MES-059 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Gofra м2+qatlam
- Doc Isbot: гофра м2+qatlam ustunlari yo'q; Гф линия master-data'da yo'q
- Tekshiruv: norma birligi yo'q (08.35); equipment'da Гф линия yo'q; м2+qatlam hisoblash ustunlari topilmadi. CONFIRMED.

## 08.60 — EP-MES-060 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: umumiy/Brak/Соф махсулот
- Doc Isbot: actual_quantity + defect_quantity; 'sof' alohida ustun yo'q lekin hisoblanadi; constraint tasdiqlanmadi
- Tekshiruv: production_sessions.actual_quantity + defect_quantity mavjud; 'sof' alohida ustun yo'q. Avto-tekshirish constraint topilmadi. CONFIRMED.

## 08.61 — EP-MES-061 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Smena A/B/C harf
- Doc Isbot: shift_types MORNING/EVENING/NIGHT; mes.dto.ts:19 morning/afternoon/night; A/B/C yo'q
- Tekshiruv: shift_types.code = MORNING/EVENING/NIGHT; mes.dto.ts:19 enum morning/afternoon/night. A/B/C harf-nom YO'Q. CONFIRMED.

## 08.62 — EP-MES-062 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Brigada doimiy A/B/C smena
- Doc Isbot: A/B/C-smena doimiy brigada jadvali yo'q
- Tekshiruv: A/B/C umuman yo'q (08.61); doimiy biriktirish jadvali topilmadi. CONFIRMED.

## 08.63 — EP-MES-063 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Smena reja-forma avto-tuzish
- Doc Isbot: PP→MES avto-tuzish yo'q; mes_papka_orders 0 qator
- Tekshiruv: mes_papka_orders 0 qator; reja-forma avto-tuzish/sahifa topilmadi. CONFIRMED.

## 08.64 — EP-MES-064 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Planlovchi+texnolog imzo
- Doc Isbot: smena rejasiga imzo/mas'ul maydoni yo'q
- Tekshiruv: smena reja-forma yo'q (08.63) → imzo maydoni ham yo'q. CONFIRMED.

## 08.65 — EP-MES-065 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Заявка бумаги MES sarfiga
- Doc Isbot: Заявка бумаги jadvali yo'q; zayavka↔sarf farq yo'q
- Tekshiruv: Заявка бумаги jadvali topilmadi; zayavka↔MES-sarf farq hisoblash yo'q. CONFIRMED.

## 08.66 — EP-MES-066 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Qog'oz format/gramm sessiyaga
- Doc Isbot: format/gramm/kg ustunlari yo'q (faqat quantity)
- Tekshiruv: production_sessions/mes_material_consumption'da format(А×В)/gramm/kg ustunlari yo'q (mes_material_consumption: quantity, unit_of_measure). CONFIRMED.

## 08.67 — EP-MES-067 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'Прошло (дней)'
- Doc Isbot: kutgan-kun/muddat-oshgan ranglash yo'q; machine_tasks 0 qator
- Tekshiruv: machine_tasks'da kutish-kun ustuni yo'q (due_date bor lekin 'prošlo' hisoblash yo'q); 0 qator. CONFIRMED.

## 08.68 — EP-MES-068 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Shoshilinch navbat oldinga
- Doc Isbot: machine_tasks.priority; shoshilinch-bayroq+signal to'liq tasdiqlanmadi; 0 qator
- Tekshiruv: machine_tasks.priority ustuni mavjud; 0 qator. Shoshilinch+signal to'liq oqim yo'q. CONFIRMED.

## 08.69 — EP-MES-069 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mashinalararo marshrut
- Doc Isbot: PP pp_routing/routing_operations/production_order_operations; MES marshrut jonli yo'q; mes_papka_orders 0 qator
- Tekshiruv: pp_routing jadvali mavjud (0 qator). mes_papka_orders 0 qator, stage ustuni yo'q → MES jonli marshrut kuzatuv tasdiqlanmadi. CONFIRMED.

## 08.70 — EP-MES-070 [DOC: qisman] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Bosqichlararo WIP/bottleneck
- Doc Isbot: production-agent.service.ts:125 detectBottleneck() production_operations'dan pending-queue topadi
- Tekshiruv: production-agent.service.ts:125-127 detectBottleneck() haqiqatan `FROM production_operations` so'rovi yozadi, LEKIN `production_operations` jadvali DB'da MAVJUD EMAS (count → "отношение не существует", to_regclass null). Demak so'rov runtime'da xato beradi — bottleneck aniqlash ISHLAMAYDI. Da'vo haddan oshirilgan (qisman → yoq). REFUTED.

## 08.71 — EP-MES-071 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tanaffus marker jadvalda
- Doc Isbot: tanaffus marker avto-ko'rsatish yo'q
- Tekshiruv: ish-jadval tanaffus markerlari topilmadi (08.49 bilan). CONFIRMED.

## 08.72 — EP-MES-072 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Soatlik norma pog'onalari
- Doc Isbot: pog'onali norma (mashina×ish-turi) jadvali yo'q
- Tekshiruv: ishlab-chiqarish norma jadvali umuman yo'q; pog'onali norma topilmadi. CONFIRMED.

## 08.73 — EP-MES-073 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Brak% stansiya bo'yicha
- Doc Isbot: per-stansiya brak% chegara yo'q
- Tekshiruv: per-stansiya brak% threshold master-data topilmadi; norma jadvali yo'q. CONFIRMED.

## 08.74 — EP-MES-074 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 'ко-во работ' + changeover
- Doc Isbot: turli-ish soni + changeover ko'rsatkichi yo'q
- Tekshiruv: smenada turli-ish soni + changeover-vaqt ko'rsatkichi topilmadi. CONFIRMED.

## 08.75 — EP-MES-075 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: переделка sabab izoh
- Doc Isbot: переделка kodi + izoh yo'q
- Tekshiruv: переделка sabab-kodi + majburiy izoh topilmadi (08.46 bilan). CONFIRMED.

## 08.76 — EP-MES-076 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Qolib kechikishi KB signal
- Doc Isbot: qolib-kechikishi kodi + KB signal yo'q
- Tekshiruv: qolib-kechikishi sabab kodi + takror-tahlil + KB signal topilmadi (08.47 bilan). CONFIRMED.

## 08.77 — EP-MES-077 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Norma bajarilmasa majburiy sabab
- Doc Isbot: norma<chegara → majburiy sabab yo'q (norma jadvali yo'q)
- Tekshiruv: norma jadvali yo'q → chegara yo'q; majburiy-sabab so'rash mexanizmi topilmadi. CONFIRMED.

## 08.78 — EP-MES-078 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mashina remonti ishonchlilik
- Doc Isbot: mes_downtime_reasons DT-MAINT (rejali); mes_maintenance_requests/tasks; avariya/rejali ajratish + MTBF tasdiqlanmadi
- Tekshiruv: mes_downtime_reasons DT-MAINT (is_planned=true, category=maintenance) mavjud. mes_maintenance_requests jadvali mavjud (0 qator). MTBF/ishonchlilik hisobi topilmadi. CONFIRMED.

## 08.79 — EP-MES-079 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: AI kunlik smena xulosasi
- Doc Isbot: production-agent.service.ts:134 generateShiftReport() faqat qty/defects/defectPct; LLM narrativ EMAS
- Tekshiruv: production-agent.service.ts:134-144 generateShiftReport() → return {shiftId, totalQty, defects, defectPct}. Faqat aggregate, LLM narrativ top-loss/reyting/tavsiya YO'Q. CONFIRMED.

## 08.80 — EP-MES-080 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: IoT'siz qo'lda ishga tushirish
- Doc Isbot: IoT-tablet to'liq qo'lda oqim REAL (login→sessiya→checklist→crew→brak→downtime→handover) DB-backed
- Tekshiruv: iot-tablet.controller.ts endpoints tasdiqlandi: tablet/sos-alert (:177), downtime-events (:577), inline_qc_checks INSERT (:565), tablet/login, equipment, orders, worker-schedule. start-session checklist+crew gate. Hammasi DB-backed real. CONFIRMED.

## 08.81 — EP-MES-081 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: НО 12-1/12-2 mas'ul hisobotga
- Doc Isbot: НО-mas'ul biriktirish jadvali yo'q; bo'lim ajratish yo'q
- Tekshiruv: НО-mas'ul biriktirish jadvali topilmadi; Ofset/Flekso bo'lim ajratish yo'q (08.38). CONFIRMED.

## 08.82 — EP-MES-082 [DOC: yoq] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tasdiqlangan birlik master-data
- Doc Isbot: stansiya×birlik tasdiqlangan master-data yo'q; unit_of_measures bor lekin stansiyaga bog'lanmagan
- Tekshiruv: unit_of_measures jadvali mavjud (seed) lekin stansiyaga bog'lanmagan; stansiya×birlik master-data topilmadi (08.35 + 08.55 bilan). CONFIRMED.
