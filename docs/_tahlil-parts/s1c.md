# SECTION 1c — MODUL STATUS: HR · LMS · Xavfsizlik (Security/IoT-KPP) · Xo'jalik (MRO)

> Tahlilchi (qat'iy read-only). Sana: 2026-06-06. Manba: jonli kod (`apps/api/src/modules/`) + DB SELECT (`_audit/q.cjs`).
> Tasnif: REAL · 501-stub · yashil-yolg'on · dublikat. Har da'vo fayl:satr yoki DB dalil bilan.
> ⚠️ Umumiy fakt: jonli `europrint` DB qurilish bosqichida — tekshirilgan barcha jadvallar 0 qator (faqat material_movements=2). "REAL" = kod yo'li haqiqatda DB ga query/insert/update qiladi (jadval bo'sh bo'lsa ham); "0 qator" = jadval hali ishlatilmagan, data yo'q.
> Asosiy topilma: bu 4 modul backendi deyarli to'liq REAL (645 routedan 633 = 98%). Faqat 12 ta halol 501-stub. Yashil-yolg'on (echo/fake-create) TOPILMADI.

---

## Umumiy raqamlar (4 modul, verify qilingan)

| Modul | Jami route | REAL | 501-stub | yashil-yolg'on | dublikat |
|-------|-----------:|-----:|---------:|---------------:|---------:|
| HR (hr + hr-assets) | 379 | 373 | 6 | 0 | 0 |
| LMS | 86 | 86 | 0 | 0 | 0 |
| Xavfsizlik (security) | 28 | 23 | 5 | 0 | 0 |
| Xavfsizlik (iot/iot-kpp) | 138 | 137 | 1 | 0 | 0 |
| Xo'jalik (MRO) | 14 | 14 | 0 | 0 | 0 |
| **JAMI** | **645** | **633** | **12** | **0** | **0** |

> "501-stub" = ataylab `notImplemented()` yoki `throw HttpException(..., NOT_IMPLEMENTED)`. Bu yashil-yolg'on EMAS — halol 501 qaytaradi.

---

### HR (modul: hr — 41 controller, 379 route)
- Jami route: 379 · REAL: 373 · 501-stub: 6 · yashil-yolg'on: 0 · dublikat: 0
- Deyarli har controller service/repo/CQRS-bus ga delegate qiladi yoki inline `db.execute` (real Drizzle/SQL). Eski katalog "HR stub" da'volari TASDIQLANMADI.

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| GET /hr/birthdays/settings | 501-stub | hr-dashboard.controller.ts:271 (`throw HttpException NOT_IMPLEMENTED`) |
| POST /hr/birthdays/settings | 501-stub | hr-dashboard.controller.ts:278 |
| GET /hr/birthdays/settings/:id | 501-stub | hr-dashboard.controller.ts:283 |
| GET /hr/contracts | 501-stub | hr-dashboard-extra.controller.ts:89 (`return notImplemented`) |
| GET /hr-capital/courses | 501-stub | hr-dashboard-extra.controller.ts:111 |
| GET /hr-capital/stats | 501-stub | hr-dashboard-extra.controller.ts:118 |
| hr-dashboard (qolgan 47 route) | REAL | 16 inline `db.execute` + `this.svc.*` (HrDashboardService); masalan :243 hrc-tests/stats, :260 360/reviewable real SELECT |
| recruitment(16), onboarding(15), hr-vacancies(14)+pipeline(14), hr-gsd(13), hr-employees(12), ai-interview-v2(12) | REAL | service/repo delegate; telegram-bots `this.svc.sendMessage` (telegram-bots.controller.ts:56), enps `this.repo` (enps.controller.ts:48), pip `this.repo` (pip.controller.ts:51), attendance-face `this.faceRec`/`this.territory` (:81,:110) |
| hr-assets (10), hr-employee-goals (5), hr-leave-accrual (1) | REAL | hr-assets 10/10 `this.svc.*`; hr-employee-goals.controller.ts:84 inline SQL `result.rows`; hr-leave-accrual.controller.ts:34 `this.job.runForMonth` |

- DB: kalit jadvallar bor lekin bo'sh — `hr_interview_sessions`(0), `hr_tool_test_results`(0), `employee_360_assessments`(0). Kod o'qiydi, data yo'q.
- Holat: HR backend deyarli to'liq simlangan (373/379 real). Faqat 6 marginal 501 (tug'ilgan kun sozlamalari + 2 hr-capital ekran).
- Dead import: `hr-compat-a` / `hr-employees-ext` `notImplemented` ni IMPORT qiladi lekin HECH QAYERDA CHAQIRMAYDI — real `db.execute`+svc bilan ishlaydi. Stub deb hisoblash XATO.

---

### LMS (11 controller, 86 route)
- Jami route: 86 · REAL: 86 · 501-stub: 0 · yashil-yolg'on: 0 · dublikat: 0
- Har controller `this.svc.*` (LMS service) yoki inline `db.execute`. `notImplemented()` HECH QAYERDA CHAQIRILMAYDI (lms-lessons/lms-misc import qiladi — dead).

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| lms-tests(11), lms-misc(12), lms-lessons(10) | REAL | lms-misc.controller.ts:54 `this.svc.listMicroModules`, :91 inline `db.execute` INSERT, :154 `saveVideoProgress` |
| lms-core(9), lms-enrollments(7), knowledge-base(7), courses(8) | REAL | lms-core.controller.ts:160 `db.execute` real SELECT; har biri svc delegate |
| lms-certificates(5)+standalone(6), lms-courses(6), lms-attempts(5) | REAL | hammasi svc + inline db |

- DB: jadvallar BOR — `lms_courses`, `lms_enrollments`, `lms_lessons`, `lms_modules`, `lms_exams`, `lms_exam_attempts/questions/answers`, `lms_certificates`, `lms_knowledge`, `lms_achievements`, `lms_assignments`, `lms_events`. Hammasi 0 qator.
- Holat: LMS backend to'liq REAL (86/86). Bironta stub yo'q. DB strukturasi tayyor, lekin hech qanday kurs/enrollment yo'q.

---

### Xavfsizlik — Security modul (2 controller, 28 route)
- Jami route: 28 · REAL: 23 · 501-stub: 5 · yashil-yolg'on: 0 · dublikat: 0
- security.controller(19) + raci.controller(9). Incident CQRS real `security_incidents` ga; visitor/ppe inline INSERT.

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| GET /security/daily-summary | 501-stub | security.controller.ts:223 `notImplemented` |
| GET /security/fire-sensors | 501-stub | security.controller.ts:229 |
| GET /security/ppe-checks | 501-stub | security.controller.ts:235 (lekin POST /ppe-checks REAL!) |
| GET /security/ppe-stats | 501-stub | security.controller.ts:241 |
| GET /security/ppe-violations | 501-stub | security.controller.ts:247 |
| POST /security/visitors, /incidents, /ppe-checks | REAL | INSERT security_visitors (:268), security_incidents (:288), security_ppe_checks (:307) RETURNING |
| POST /report, PATCH :id, PATCH :id/resolve | REAL | CQRS — ReportIncidentCommand (:126), UpdateIncidentCommand (:143) → drizzle-incident.repo.ts:13 `security_incidents` |
| GET visitors/incidents/access-zones/attendance-records | REAL | db SELECT (:186) + accessSvc/attendanceSvc/queryBus (:200,:208,:216) |
| raci: tasks/assignments/stages/crises/assessments (9) | REAL | RaciService → RaciRepo (raci.service.ts:12 `@Inject(RACI_REPO)`); DELETE :104 `this.svc.deleteAssignment` |

- DB: `security_incidents`(0), `security_visitors`(0), `security_ppe_checks`(0) — bor, bo'sh. `incidents` jadvali YO'Q (kod to'g'ri `security_incidents` ishlatadi).
- Holat: Security backend asosan REAL. Diqqat: PPE assimetrik — yozish (POST) real, lekin o'qish (GET ppe-checks/stats/violations) + fire-sensors + daily-summary 501 (#FX-6) → FE bu sahifalarni ko'rsata olmaydi.

---

### Xavfsizlik — IoT / IoT-KPP modul (12 controller, 138 route)
- Jami route: 138 · REAL: 137 · 501-stub: 1 · yashil-yolg'on: 0 · dublikat: 0
- Controllerlar IotMain/IotSensorsExtended/CameraExtended servicega delegate; servislar Drizzle repolarga (drizzle-iot-main.repo.ts=47 db-call, drizzle-camera-dashboard.repo.ts=44, drizzle-camera-ai.repo.ts=23, drizzle-camera.repo.ts=22, drizzle-iot-sensors.repo.ts=21, drizzle-iot-tablet.repo.ts=20). Yoki controller inline `db.execute`.

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| POST /iot/sensors/alerts/:alertId/resolve | 501-stub | iot-sensors-main.controller.ts:170 `throw HttpException NOT_IMPLEMENTED` (halol — avval fake `{resolved:true}` edi) |
| PATCH /iot/sensors/alerts/:alertId/resolve | REAL | iot-sensors-main.controller.ts:141 UPDATE iot_alerts (POST-egizagi 501, PATCH real) |
| iot-main (29) | REAL | `this.svc.*` (IotMainService) + inline db: oee/live :306 oee_records, downtime-reason-codes :272, patchDevice :288 UPDATE iot_devices |
| iot-tablet (20) | REAL | production_sessions/shift_handovers/downtime_events/inline_qc_checks/material_movements/shift_evaluations/material_kit_items real INSERT/UPDATE (:132,:187,:248,:317,:367,:396); login/sos `this.tabletSvc` |
| camera-alerts(17), camera-ai(10), camera-dashboard(9), iot-camera-events(8), iot-camera(7), camera-recognition(6), camera-heatmap-reports(8) | REAL | CameraExtendedService (camera-extended.service.ts:15 `DrizzleCameraRepo`) + DrizzleCameraDashboardRepo/Ai |
| iot-sensors(8), iot-sensors-main(11), iot-alerts(5) | REAL | iot-sensors.controller.ts:78 SELECT iot_devices, :123 readings INSERT; iot-alerts inline db |

- DB: `iot_devices`(0), `sensor_readings`(0), `oee_records`(0), `downtime_reason_codes`(0), `production_sessions`(0), `shift_handovers`(0), `downtime_events`(0), `inline_qc_checks`(0), `material_movements`(**2** — sinov), `material_kit_items`(0), `machine_crews`(0). Hammasi mavjud.
- Holat: IoT (kamera+sensor+tablet) backend deyarli butunlay REAL (137/138). Faqat bitta POST alert-resolve halol 501; PATCH-egizagi real. Eng katta, eng to'liq simlangan yuza; DB bo'sh (sensor_readings yozuvchisi yo'q — memory bilan mos).

---

### Xo'jalik / MRO (1 controller, 14 route)
- Jami route: 14 · REAL: 14 · 501-stub: 0 · yashil-yolg'on: 0 · dublikat: 0
- mro.controller → MaintenanceService → drizzle-maintenance-svc.repo.ts (real Drizzle) + CQRS (StopMachine/AssignMaintenance/CompleteMaintenance).

| Route/funksiya | Holat | Dalil (fayl:satr) |
|---|---|---|
| GET /mro, GET /mro/:id | REAL | GetMaintenanceOrdersQuery (mro.controller.ts:91), maintenanceRepo.findById (:103) |
| POST /stop-machine, PATCH :id/assign, PATCH :id/complete | REAL | CQRS command bus (:117,:134,:151) |
| GET spare-parts/canteen-stats/cleaning/facilities/pm/utility | REAL | maintenanceSvc → repo (drizzle-maintenance-svc.repo.ts:120,136,152,170,191,214 real SELECT) |
| GET /mro/equipment | REAL | findEquipment → mro_equipment (repo:49) |
| POST /mro/equipment | REAL | createEquipment → INSERT mro_equipment (repo:78) |
| PATCH /mro/equipment/:id/status | REAL | updateEquipmentStatus → UPDATE mro_equipment (repo:97) |

- DB: `equipment_maintenance`(0), `mro_equipment`(0), `mro_facilities`(0), `mro_cleaning_schedules`(0), `mro_pm_schedules`(0), `mro_utility_readings`(0), `mro_canteen_logs`(0), `mro_items`(0), `maintenance_orders`(bor). Hammasi mavjud, bo'sh.
- Holat: MRO backend kichik lekin to'liq REAL (14/14). Ta'mirlash buyurtmasi, jihoz, ehtiyot qism, oshxona, tozalash, kommunal — hammasi real DB. Bironta stub yo'q.

---

## Yakuniy xulosa (verify-don't-trust)
1. Bu 4 modul backendi eski kataloglar bashorat qilganidan ANCHA real: 645 routedan 633 (98%) real DB o'qiydi/yozadi.
2. YASHIL-YOLG'ON (echo/fake-create/soxta-200) bu 4 modulda **TOPILMADI** — `return {ok:true}` larning hammasi real `result.data`/side-effect dan keyin keladi.
3. Faqat 12 halol 501-stub: HR×6 (birthday-settings×3, hr-capital contracts/courses/stats), Security×5 (daily-summary, fire-sensors, ppe GET×3), IoT×1 (POST alert-resolve; PATCH-egizagi real).
4. DUBLIKAT topilmadi. `notImplemented` import'lari bir nechta faylda dead (chaqirilmaydi) — bu dublikat emas, lekin tozalanishi kerak.
5. ⚠️ Eng katta cheklov KOD emas, DATA: barcha kalit jadvallar 0 qator (faqat material_movements=2). Backend tayyor, jonli DB bo'sh (qurilish bosqichi).
