# Module 16 — IoT / Telemetriya — Independent Verification

**Auditor:** adversarial re-check against live code + `europrint` DB (2026-06-27)
**Questions:** 86 | **Doc self-claim:** vizyon 38%
**Recomputed realPct (verifiable only, bor=1/qisman=0.5/yoq=0 over 77):** ~29%

## Aggregate (my re-assessment)
- bor (real, mechanism works): 5 — 16.31, 16.53, 16.60, 16.70, 16.78
- qisman: 34
- yoq: 38
- egasi-data (sensor/camera CAPEX pending; schema/endpoint exists): 9 — 16.37, 16.50, 16.51, 16.57, 16.66, 16.74, 16.75, 16.76, 16.86
- Claim accuracy: confirmed 84 / refuted 2

This module's Isbot is unusually honest/self-critical — most ❌ yo'q rows correctly say "topilmadi / OCHIQ / sensorsiz". DB row counts cited in the doc (equipment 7, machine_crews 2, machine_status_logs 9, mes_telemetry 384, downtime_events 2, machine_tasks 0, sensor_devices 0, iot_alerts 0, ow_molds 0, oee_records 0, ideal_rasm_targets 0, camera_alerts 0) ALL match live DB exactly.

## REFUTED / overstated claims
- **16.84** — Doc says IoT→Telegram integration "topilmadi" (yoq). REFUTED: `record-sensor-reading.handler.ts:14,24,54-55` imports `ITelegramSender` and calls `telegramService.sendAlert(...)` on threshold breach. Mechanism is wired (depends on sensor data=0) → real status qisman, not yoq.
- **16.12** — Doc lists "production_facts.shift ustuni BOR". REFUTED (partial): no `shift%` column exists on `production_facts` (only papka/operator1-4). The other 3 citations (production_sessions.shift_id, shift_assignments.shift, downtime_logs.shift) ARE present. Status (qisman) still correct.

Minor note: 16.50 cites a "safety-violations controller" — no IoT controller by that name; the closest is `iot-camera-events.controller.ts` + `machine_status_logs.ai_detected/ai_confidence/image_url` (which DO exist). Verdict (egasi-data, no real vision) is accurate, so counted confirmed.
Note: several doc rows flagged ❌ yo'q (16.37/16.50/16.51/16.66/16.75/16.76/16.86) are really egasi-data (honest 501 / 0-row infra awaiting owner CAPEX) — doc is more pessimistic than reality there, not overstated.

---

## 16.1 — Q (EP-IOT) [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mashina reestri "Станоклар норма" nomlari bilan seed?
- Doc Isbot: equipment 7 rows, generic DEMO names, no SM-52/KBA-105/Тигель.
- Tekshiruv: `SELECT name FROM equipment` → "Ofset mashina #1 (DEMO)", "Offset Bosma Mashinasi 1/2", "Flexoprint Mashinasi 1", "Qirqish Dastgohi 1", "Laminatsiya Mashinasi", "Raqamli Bosma Mashinasi". Generic, no book names. Confirmed.

## 16.2 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: norma/soat + norma/12h per machine?
- Doc Isbot: no norma_per_hour col; only work_centers.norma_kg/m2_per_shift.
- Tekshiruv: production_sessions cols have no norma*; work_centers has only `norma_m2_per_shift`, `norma_kg_per_shift` (shift-level, not machine). Confirmed.

## 16.3 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: РД4→Ген.Директор norma imzo-zanjir?
- Doc Isbot: no machine-norma table → no approval chain.
- Tekshiruv: No norma table found (16.2), thus no approval workflow. Consistent. Confirmed.

## 16.4 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: o'lchov birligi mashinaga qarab (м2/лист/штук/удар)?
- Doc Isbot: no unit/uom col, only target/actual_quantity.
- Tekshiruv: production_sessions columns list has no unit/uom; only `target_quantity`/`actual_quantity`. Confirmed.

## 16.5 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tigel удар/лист counter alohida?
- Doc Isbot: no udar/stroke column anywhere.
- Tekshiruv: No udar/stroke column in production_sessions/equipment. Confirmed (sensor pending).

## 16.6 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: udardan TO eslatma (har 1 mln)?
- Doc Isbot: ow_molds exists (0 rows) no udar-counter; no reminder logic.
- Tekshiruv: ow_molds=0 rows; no udar/resurs reminder. Confirmed.

## 16.7 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: rang/seksiya (4+0/4+4) kuzatuv?
- Doc Isbot: no color_count/section col.
- Tekshiruv: production_sessions/equipment have no color/section cols. Confirmed.

## 16.8 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: "иш йук" idle alohida holat?
- Doc Isbot: mes_downtime_reasons 7 codes, no idle code.
- Tekshiruv: `SELECT code FROM mes_downtime_reasons` → DT-ELECT/MAINT/MAT/MECH/QUAL/SETUP/SHIFT (7). No idle/иш йук code. Structure extendable. Confirmed.

## 16.9 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "Колиб тайёр эмас" sabab + mas'ul?
- Doc Isbot: no such code among 7; DT-SETUP generic.
- Tekshiruv: 7 codes (above) have no qolib-ready code. Confirmed.

## 16.10 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: переделка brak sabab kodi?
- Doc Isbot: /defect REAL (controller:477), переделка not seeded.
- Tekshiruv: iot-tablet.controller.ts:477 `@Post('production-sessions/:id/defect')`. Confirmed; seed of переделка not present. Confirmed.

## 16.11 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: setup vaqti ishlash vaqtidan ajralsinmi?
- Doc Isbot: production_sessions.setup_seconds+current_stage+stage_started_at BOR; iot-tablet.service'da setup_seconds ref yo'q.
- Tekshiruv: production_sessions has `setup_seconds`, `current_stage`, `stage_started_at`. `grep setup_seconds modules/iot/application/iot-tablet.service.ts` → empty (not wired). Both halves confirmed.

## 16.12 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Smena (А/Б/С) holat va norma?
- Doc Isbot: production_sessions.shift_id, shift_assignments.shift, downtime_logs.shift, production_facts.shift BOR.
- Tekshiruv: shift cols present: production_sessions.shift_id ✓, shift_assignments.shift ✓, downtime_logs.shift ✓. **production_facts has NO shift column** (only papka/operator1-4) — that citation is WRONG. Status qisman still correct.

## 16.13 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "keyingi ish" navbat Andon ekranida?
- Doc Isbot: machine_tasks 0 rows, no next-job.
- Tekshiruv: machine_tasks count=0. Confirmed.

## 16.14 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: operator + yordamchi biriktirish?
- Doc Isbot: machine_crews 2 rows, crew POST+GET (controller:284,296), production_facts.operator1-4.
- Tekshiruv: machine_crews=2; controller:284 `@Get('production-sessions/:id/crew')`, :296 `@Post(.../crew)`; production_facts has operator1-4. All confirmed.

## 16.15 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Гофра м2 ↔ Ombor balans?
- Doc Isbot: no gofra m2-counter/material-balance compare.
- Tekshiruv: No such mechanism (gofra sensor not installed). Confirmed.

## 16.16 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: UV/lak sarfi varaqqa bog'lab?
- Doc Isbot: no lak-consumption table/endpoint.
- Tekshiruv: Not found. Confirmed.

## 16.17 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Laminatsiya plyonka sarf/isrof?
- Doc Isbot: no film-consumption tracking.
- Tekshiruv: Not found. Confirmed.

## 16.18 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: qo'l mehnati mashinalari tabletdan?
- Doc Isbot: tablet REAL; manual stations not in registry.
- Tekshiruv: iot-tablet flow real (login/session/qty); equipment registry generic DEMO (no Степлер/Склейка). Confirmed.

## 16.19 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Резка zanjir boshi kirim nuqtasi?
- Doc Isbot: no chain quantity-passing logic.
- Tekshiruv: Not found. Confirmed.

## 16.20 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: "отработано часов" vs 12h smena?
- Doc Isbot: running_time_seconds+stopped_time_seconds+setup/main/teardown_seconds BOR; full 12h-breakdown report not confirmed.
- Tekshiruv: production_sessions has running_time_seconds, stopped_time_seconds, setup_seconds, main_seconds, teardown_seconds. Time-split struct present; report unverified (data 0). Confirmed.

## 16.21 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: smena 8/10/12 soat sozlanadimi?
- Doc Isbot: no shift-length config column.
- Tekshiruv: No machine/shop-level shift-length config found. Confirmed.

## 16.22 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "ко-во работ" smenada ish soni?
- Doc Isbot: no job-count aggregation endpoint.
- Tekshiruv: Not found. Confirmed.

## 16.23 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Брак% chegara avto alert (ekran+Telegram)?
- Doc Isbot: /defect real; brak%-threshold monitoring + alert absent; iot_alerts 0.
- Tekshiruv: iot_alerts=0; no brak%-threshold alert logic. Confirmed.

## 16.24 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: brak chegarasi mashina turiga qarab?
- Doc Isbot: no per-machine-type brak threshold config.
- Tekshiruv: Not found. Confirmed.

## 16.25 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: авто vs ручная кашировка taqqos?
- Doc Isbot: no kashirovka 3-type registry; no comparison report.
- Tekshiruv: equipment generic; not found. Confirmed.

## 16.26 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: "иш %" yuklanish + bottleneck?
- Doc Isbot: OEE/uptime REAL (oee-calculator), but no separate load% + bottleneck flag.
- Tekshiruv: oee-calculator.service.ts real; no load%/bottleneck IoT flag. Confirmed.

## 16.27 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: norma tasdiq zanjiri (audit jurnal)?
- Doc Isbot: no machine-norma table → no approval chain.
- Tekshiruv: Consistent with 16.2/16.3. Confirmed.

## 16.28 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ФСМ tezligi/зажор?
- Doc Isbot: ФСМ not in registry; no jam counter.
- Tekshiruv: equipment has no ФСМ; not found. Confirmed.

## 16.29 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Тигель qolip udar resurs + eslatma?
- Doc Isbot: ow_molds BOR but no udar-counter/resurs col.
- Tekshiruv: ow_molds=0 rows; no udar resource col. Confirmed.

## 16.30 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: defekt sababi tablet tayyor ro'yxat?
- Doc Isbot: /defect REAL (controller:477), book reasons not seeded.
- Tekshiruv: controller:477 confirmed. Confirmed.

## 16.31 — [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: smena topshirish mashina holati?
- Doc Isbot: /tablet/handover (controller:197, imzo); mes_shift_handovers+shift_handovers; FE IoTCompletionReport.
- Tekshiruv: controller:197 `@Post('tablet/handover')`; both `mes_shift_handovers` & `shift_handovers` tables exist; FE IoTCompletionReport.tsx present. Mechanism real (data 0). Confirmed bor.

## 16.32 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: "иш йук" muqobil ishga (паддон/арчиш)?
- Doc Isbot: no alternative-work code/IoT record.
- Tekshiruv: Not found. Confirmed.

## 16.33 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Гофра namlik/клей sensor?
- Doc Isbot: no humidity/glue sensor param.
- Tekshiruv: Not found (special sensor pending). Confirmed.

## 16.34 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ofset краска qutisi darajasi?
- Doc Isbot: no ink-level sensor/alert.
- Tekshiruv: Not found. Confirmed.

## 16.35 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: автовысечка картон vs гофра ajratish?
- Doc Isbot: not in registry; no mode split.
- Tekshiruv: Not found. Confirmed.

## 16.36 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: ON/OFF avto yozuv?
- Doc Isbot: machine_status_logs (status_started_at/ended_at/duration_minutes, 9 rows); no auto power sensor.
- Tekshiruv: machine_status_logs has status_started_at, status_ended_at, duration_minutes; count=9. No auto ON/OFF current sensor. Confirmed.

## 16.37 — [DOC: ❌] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: energiya idle (idle tok)?
- Doc Isbot: /energy-consumption honest 501 (iot-main:153 EP-IOT-018-PENDING). Idle tok yo'q.
- Tekshiruv: iot-main.controller.ts:144-157 — `@Get('energy-consumption')` throws HttpStatus.NOT_IMPLEMENTED 'Energiya sensori o'rnatilmagan' code EP-IOT-018-PENDING. Honest stub; sensor=owner CAPEX → egasi-data. Confirmed (doc flag pessimistic).

## 16.38 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: kompressor/havo bosimi?
- Doc Isbot: no compressor/air-pressure sensor monitoring.
- Tekshiruv: Not found. Confirmed.

## 16.39 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Andon target↔haqiqiy (qizil/yashil)?
- Doc Isbot: target_quantity+actual_quantity BOR; machine-status-current; FE OEELiveMonitorPage; full Andon norma-base yo'q.
- Tekshiruv: production_sessions target/actual_quantity confirmed; iot-main.controller machine-status endpoint; FE OEELiveMonitorPage.tsx exists. Norma-base missing. Confirmed.

## 16.40 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Окошка alohida operatsiya?
- Doc Isbot: not in registry.
- Tekshiruv: Not found. Confirmed.

## 16.41 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Тиснение/Конгрев folga+udar?
- Doc Isbot: no folga/udar tracking.
- Tekshiruv: Not found. Confirmed.

## 16.42 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: НЗП mashina-mashina kuzatuv?
- Doc Isbot: no operation-chain NZP tracking in IoT.
- Tekshiruv: Not found (planning_operations in MES separate). Confirmed.

## 16.43 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: "Папка №" IoT yozuviga bog'lansinmi?
- Doc Isbot: mes_papka_orders.papka_no, papka_orders.papka_no, production_facts.papka_no BOR; session via production_order_id.
- Tekshiruv: production_facts has papka_no + papka_order_id; mes_papka_orders & papka_orders tables exist; production_sessions.production_order_id present. Confirmed (data 0).

## 16.44 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: sensor uzilsa "noma'lum" vaqt OEE'dan chiqsinmi?
- Doc Isbot: production_sessions.last_signal_at BOR; OEE-denominator exclusion rule not code-confirmed.
- Tekshiruv: production_sessions has last_signal_at; exclusion rule unverified. Confirmed.

## 16.45 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: TO tarixi IoT'ga (MTBF)?
- Doc Isbot: equipment_maintenance/asset_maintenance_records/mes_maintenance_tasks/maintenance_orders BOR; equipment last/next_maintenance_date, operating_hours.
- Tekshiruv: All 4 maintenance tables exist; equipment has last_maintenance_date, next_maintenance_date, maintenance_interval, operating_hours, last_maintenance_at. Data not migrated (DEMO). Confirmed.

## 16.46 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: TO qism Ombor bilan?
- Doc Isbot: repair-part→warehouse link absent in IoT; mro_inventory separate.
- Tekshiruv: mro_inventory exists separately; no IoT link. Confirmed.

## 16.47 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: "norma bajarilmadi" avto-breakdown tahlili?
- Doc Isbot: downtime_events + setup/run/stopped_seconds (raw) BOR; auto-breakdown report unverified.
- Tekshiruv: downtime_events table (2 rows) + session time cols present; auto-analysis report unverified; norma-base missing. Confirmed.

## 16.48 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: brak→макулатура qayta ishlatish?
- Doc Isbot: waste_records exists separately; IoT-brak→makulatura tracking absent.
- Tekshiruv: waste_records exists; no IoT link. Confirmed.

## 16.49 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: sensor kalibrovka muddati eslatma?
- Doc Isbot: ai_calibration_runs (AI-model, not sensor); no sensor calibration reminder.
- Tekshiruv: ai_calibration_runs exists (AI); no sensor calibration. Confirmed.

## 16.50 — [DOC: ❌] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Kamera-AI PPE (qo'lqop/ko'zoynak) tekshirsinmi?
- Doc Isbot: safety-violations controller + structure (machine_status_logs.ai_detected/ai_confidence/image_url), no real vision; camera tables 0.
- Tekshiruv: machine_status_logs has ai_detected, ai_confidence, image_url, camera_id ✓; camera_alerts=0; no real PPE inference model (iot-camera-events.controller present, not a literal "safety-violations" controller — minor wording). Camera infra=owner CAPEX → egasi-data. Substance confirmed.

## 16.51 — [DOC: ❌] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Kamera-AI xavfli zona odam?
- Doc Isbot: no danger-zone vision logic; camera_alerts 0.
- Tekshiruv: camera_alerts=0; no vision inference. Camera CAPEX → egasi-data. Confirmed.

## 16.52 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: tungi smena (С) avto nazorat?
- Doc Isbot: no night-shift threshold/Telegram escalation config.
- Tekshiruv: Not found. Confirmed.

## 16.53 — [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: majburiy "tayyorlik checklist"?
- Doc Isbot: iot-tablet.controller.ts:331-348 startProductionSession — checklist majburiy, BLOCKED (UnprocessableEntityException).
- Tekshiruv: iot-tablet.controller.ts:318-352 — startProductionSession queries checklist_items JOIN setup_checklists; if items.length===0 → throw UnprocessableEntityException('BLOCKED...sozlanmagan'); if incomplete>0 → throw BLOCKED. Fail-safe block real. Confirmed bor (line drift 331-348→327-352).

## 16.54 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: samaradorlik GSD/ЦКП ShVB'ga avto?
- Doc Isbot: OEE REAL + stop OEE-report; auto GSD→ShVB chain unverified; oee_records/oee_snapshots 0.
- Tekshiruv: oee-calculator real; oee_records=0, oee_snapshots=0; auto-chain unverified. Confirmed.

## 16.55 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: ko'rsatkich operator oylik/KPI?
- Doc Isbot: operator_id/operator_card_id + machine_crews (KPI-base); OEE→salary fair-coeff to HR unverified.
- Tekshiruv: production_sessions has operator_id, operator_card_id; machine_crews=2. HR link unverified. Confirmed.

## 16.56 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ofset plastina/CTP tayyorlik navbatda?
- Doc Isbot: no plate-ready indicator (no queue display, ties Q13).
- Tekshiruv: Not found. Confirmed.

## 16.57 — [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: sensor qaysi mashinalarga (bosqichli)?
- Doc Isbot: sensor_devices BOR (0 rows), iot_sensors bor; IoT physically not installed = owner CAPEX.
- Tekshiruv: sensor_devices=0; iot_sensors table exists. Schema ready, owner decision. Confirmed egasi-data.

## 16.58 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: mashina holat ranglari (5 holat)?
- Doc Isbot: machine_status_logs.status + previous_status BOR; current/logs endpoint REAL; 5-status enum not strictly seeded.
- Tekshiruv: machine_status_logs has status, previous_status; machine-status/machine-status-logs endpoints in iot-main.controller. 5-enum constraint unverified. Confirmed.

## 16.59 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: uptime avto (GSD'ga)?
- Doc Isbot: OEE-availability REAL (runTime/plannedTime); duration_minutes bor; auto-uptime→GSD unverified.
- Tekshiruv: oee-calculator availability=clamp(safeDiv(RT,PT)); machine_status_logs.duration_minutes present. GSD link unverified. Confirmed.

## 16.60 — [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: downtime sababini yozish (tayyor ro'yxat)?
- Doc Isbot: /downtime-events POST (controller:577); downtime_events (2 rows); mes_downtime_reasons (7 codes, is_planned).
- Tekshiruv: controller:577 `@Post('downtime-events')`; downtime_events=2; mes_downtime_reasons 7 codes with is_planned (DT-MAINT/SETUP/SHIFT=t, others=f → planned/unplanned split real). Confirmed bor.

## 16.61 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 8-10 standart sabab master-data?
- Doc Isbot: 7 standard codes BOR, book reasons (иш йук/колиб/переделка) absent.
- Tekshiruv: 7 codes confirmed; book-real reasons not seeded. Confirmed.

## 16.62 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: anomaliya ogohlantirish?
- Doc Isbot: anomaly-detected.handler.ts + get-anomalies.handler.ts BOR; iot_alerts 0.
- Tekshiruv: `infrastructure/event-handlers/anomaly-detected.handler.ts` + `application/queries/get-anomalies.handler.ts` exist; iot_alerts=0. Confirmed.

## 16.63 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: anomaliya chegaralarini kim belgilaydi?
- Doc Isbot: iot_devices.thresholds (JSONB) BOR + update-device-thresholds.handler.ts REAL.
- Tekshiruv: iot_devices.thresholds column exists; `application/commands/update-device-thresholds.handler.ts` exists. Approval-chain unverified. Confirmed.

## 16.64 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: anomaliya→workflow (texnik vazifa+xabar)?
- Doc Isbot: handler bor but end-to-end anomaly→maintenance-task chain 0-data.
- Tekshiruv: No end-to-end auto maintenance-task chain confirmed. Confirmed.

## 16.65 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: telemetriya retention/downsampling?
- Doc Isbot: mes_telemetry 384 rows but no downsampling/retention cron.
- Tekshiruv: mes_telemetry=384; retention.cron.ts exists but archives posMovements/employeeDocuments/managementDocuments only — NOT mes_telemetry. No telemetry downsampling. Confirmed.

## 16.66 — [DOC: ❌] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: kamera-AI xona inspeksiya (ideal-rasm)?
- Doc Isbot: ideal_rasm_targets BOR (0 rows), /room-inspections endpoint bor; no real vision compare.
- Tekshiruv: ideal_rasm_targets=0; iot-main.controller.ts:66 `@Get('room-inspections')` repo-backed; no vision inference/2h cron. Camera CAPEX → egasi-data. Confirmed.

## 16.67 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: kamera-AI 5-7 mezon master-ro'yxat?
- Doc Isbot: inspection criteria master-list absent.
- Tekshiruv: Not found. Confirmed.

## 16.68 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: inspeksiya buzilish tuzatish jurnali (yopiq sikl)?
- Doc Isbot: room-inspections endpoint bor but closed-loop correction unverified (0 data).
- Tekshiruv: No closed-loop correction flow. Confirmed.

## 16.69 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: MES bilan ulanish (oltin-ip)?
- Doc Isbot: production_sessions.production_order_id + machine_id MES-base BOR; mes module bor; IoT↔MES session split not fully synced.
- Tekshiruv: production_sessions has production_order_id, machine_id; mes module present (mes-production-sessions). Split/sync gap. Confirmed.

## 16.70 — [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: OEE 3-omil?
- Doc Isbot: oee-calculator.service.ts REAL 3-omil (satr 118-121), clamp+Zod; tablet stop OEE-report.
- Tekshiruv: oee-calculator.service.ts:118-121 — availability=clamp(safeDiv(RT,PT)), performance=clamp(safeDiv(AQ*IT,RT)), quality=clamp(safeDiv(AQ-DQ,AQ)), oee=A*P*Q*100. Real. Confirmed bor.

## 16.71 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: RUL predictive maintenance?
- Doc Isbot: predictive-maintenance.service.ts REAL heuristic (304 qator: RUL, healthScore, trend); /predictive-maintenance endpoint; sensor data 0.
- Tekshiruv: predictive-maintenance.service.ts = 304 lines, has RUL/healthScore/trendSlope heuristic; endpoint iot-sensors-main.controller.ts:122 `@Get('predictive-maintenance')`. Sensor telemetry 0. Confirmed.

## 16.72 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: TO jadvali (reja-profilaktika)?
- Doc Isbot: equipment.next_maintenance_date/maintenance_interval/operating_hours BOR; maintenance_orders/equipment_maintenance; auto-schedule cron unverified.
- Tekshiruv: equipment has next_maintenance_date, maintenance_interval, operating_hours; maintenance tables exist. Auto-gen cron unverified. Confirmed.

## 16.73 — [DOC: ❌] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: TO ishlari ro'yxati (master-data)?
- Doc Isbot: maintenance-works master-data catalog absent; mes_maintenance_tasks not a standard-works catalog.
- Tekshiruv: No per-machine-type standard-works catalog. Confirmed.

## 16.74 — [DOC: 🔑] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: energiya (tok) iste'moli mashina darajasi?
- Doc Isbot: /energy-consumption honest 501 (iot-main:153 EP-IOT-018-PENDING).
- Tekshiruv: iot-main.controller.ts:145-157 throws NOT_IMPLEMENTED. Sensor pending → egasi-data. Confirmed.

## 16.75 — [DOC: ❌] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: energiya hisobot+ogohlantirish?
- Doc Isbot: energy sensor absent (501) → no report.
- Tekshiruv: Depends on 16.74 sensor (501). egasi-data. Confirmed.

## 16.76 — [DOC: ❌] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: birlik mahsulotga energiya?
- Doc Isbot: energy data absent (501).
- Tekshiruv: Sensor pending. egasi-data. Confirmed.

## 16.77 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: sex katta ekrani (Andon tablo)?
- Doc Isbot: machine-status-current + iot.gateway (WS) BOR; FE OEELiveMonitorPage; full Andon grid FE unverified.
- Tekshiruv: iot-main.controller machine-status endpoint; iot.gateway.ts `@WebSocketGateway` + sensor:subscribe/equipment:subscribe; FE OEELiveMonitorPage.tsx exists. Full grid unverified. Confirmed.

## 16.78 — [DOC: ✅] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: operator tableti?
- Doc Isbot: FE IoTTablet + pages/iot/*; BE iot-tablet.controller 20+ endpoint (login/sessions/start/stop/defect/downtime/inline-qc/handover/crew/material-scan/sos).
- Tekshiruv: iot-tablet.controller.ts has 20+ endpoints (login:166, sessions:131/142, start:318, stop:360, defect:477, downtime:577, inline-qc:558, handover:197, crew:284/296, material scan:228, sos:177); FE pages/iot/* (IoTLoginPanel, IoTChecklistModal, IoTProductionDashboard, IoTCompletionReport, useIoTTablet*). Confirmed bor — strongest part.

## 16.79 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: sensor uzilgan "Aloqa yo'q" holat?
- Doc Isbot: production_sessions.last_signal_at BOR; 'Aloqa yo'q' flag flow unverified.
- Tekshiruv: last_signal_at present; dedicated 'no-comm' flag/notify flow unverified. Confirmed.

## 16.80 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: holat/xabar kimga (karta-model marshrut)?
- Doc Isbot: sos-alert endpoint + sos-alert-raised.event BOR; org-card routing unverified.
- Tekshiruv: iot-tablet.controller.ts:177 `@Post('tablet/sos-alert')`; `domain/events/sos-alert-raised.event.ts` exists. Full org-card routing unverified. Confirmed.

## 16.81 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: samaradorlik kartaga (GSD lavozimga)?
- Doc Isbot: operator_card_id + machine_crews BOR; auto-GSD→card chain unverified (data 0).
- Tekshiruv: operator_card_id present; machine_crews=2; auto-chain unverified. Confirmed.

## 16.82 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: defekt mashinaga bog'lash (MES)?
- Doc Isbot: /defect + /inline-qc REAL (machine+session-time); shift+Pareto aggregation unverified.
- Tekshiruv: controller:477 /defect, :558 /inline-qc. Pareto/shift analysis unverified. Confirmed.

## 16.83 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: IoT smena hisoboti (avto, invoys PDF)?
- Doc Isbot: tablet stop → completion-report REAL (FE IoTCompletionReport + steps/sections); Telegram + invoice-PDF unverified.
- Tekshiruv: FE IoTCompletionReport.tsx + Sections + Steps + Types present. Invoice-PDF/Telegram part unverified. Confirmed.

## 16.84 — [DOC: ❌] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Telegram orqali IoT xabarlari?
- Doc Isbot: "IoT-hodisa→Telegram-bot integratsiyasi IoT modulida topilmadi"; iot_alerts 0.
- Tekshiruv: REFUTED — `modules/iot/application/commands/record-sensor-reading.handler.ts:14` imports `ITelegramSender, TELEGRAM_SENDER`; :24 injects telegramService; :54-55 `await this.telegramService.sendAlert(...)` on threshold breach. IoT→Telegram IS wired (depends on sensor data=0). Real status qisman, not yoq. `sos-alert-raised.event.ts:5` also documents Telegram escalation.

## 16.85 — [DOC: 🟡] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: mashinalar reestri (yagona master-data)?
- Doc Isbot: equipment = yagona reestr (7 rows, inventory_number/work_center_id/category/status); content generic DEMO.
- Tekshiruv: equipment has inventory_number, work_center_id, category, status; 7 rows generic DEMO names. Confirmed.

## 16.86 — [DOC: ❌] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: energiya → Finance (tannarx)?
- Doc Isbot: energy data absent (501) → no Finance link.
- Tekshiruv: Depends on energy sensor (501). egasi-data. Confirmed.
