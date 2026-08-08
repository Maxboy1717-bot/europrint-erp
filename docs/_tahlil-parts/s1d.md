# SECTION 1 — MODUL STATUS (s1d)

Tahlilchi: s1d · Modullar: IoT/Kamera · Direktor · Admin/SaaS · Vazifalar/Kanban
Sana: 2026-06-06 · QAT'IY READ-ONLY · VERIFY-DON'T-TRUST (jonli kod + DB tasdiqlangan)

Tasnif: REAL = service/repo + real DB o'qish/yozish · 501-stub = notImplemented/HttpStatus.NOT_IMPLEMENTED ·
yashil-yolg'on = 200 qaytaradi lekin DB ga tegmaydi (hardcoded list / echo / `{url:null}` / `return {}`) ·
dublikat = route/controller 2+ joyda yoki ro'yxatga olinmagan (dead).

---

### IoT / Kamera (modul: iot)

13 ta controller fayl, HAMMASI `iot.module.ts:99-105` da ro'yxatga olingan (`...newControllers` orqali). `camera/` papkasi faqat `camera.service.ts` (controller yo'q).

- Jami route: **~135** · REAL: **~125** · 501-stub: **1** · yashil-yolg'on: **3** · dublikat: **bir nechta route-yo'l (controller'lararo)**

| Controller / route | Holat | Dalil (fayl:satr) |
|---|---|---|
| iot-sensors (8: devices CRUD, readings, anomalies, oee) | REAL | iot-sensors.controller.ts — CommandBus/QueryBus + db.execute SELECT/INSERT (l.59-179) |
| iot-main (23: dashboard, machine-status, environment, oee, sensors, telemetry, downtime-reason-codes, devices PATCH) | REAL | iot-main.controller.ts — svc + real db.execute (oee/live l.303 `oee_records` AVG; patchDevice l.284 real UPDATE) |
| iot-main `getOeeLive` `by_machine:[]` | qisman | iot-main.controller.ts:324 — oee real, `by_machine` doim bo'sh array |
| iot-alerts (5: alerts, acknowledge, safety-violations, create) | REAL | iot-alerts.controller.ts — createAlert real INSERT iot_alerts (l.71) |
| iot-sensors-main (11) | asosan REAL | iot-sensors-main.controller.ts — predictive-maintenance real SELECT (l.125); PATCH alerts/:id/resolve real UPDATE (l.141) |
| iot-sensors-main `POST alerts/:id/resolve` | **501-stub** | iot-sensors-main.controller.ts:170 — `throw HttpException(...NOT_IMPLEMENTED)` (halol stub; PATCH-twin esa real) |
| iot-tablet (19: sessions, sos, handover, inline-qc, defect, evaluation, material-return, kit-scan) | REAL | iot-tablet.controller.ts — hamma POST real INSERT (production_sessions/shift_handovers/downtime_events/inline_qc_checks l.126-402) |
| iot-camera (8: cameras CRUD, zones) | REAL | iot-camera.controller.ts — IotCameraService delegate (l.48-138) |
| iot-camera-events (8: events, safety-violations, quality-defects CRUD) | REAL | iot-camera-events.controller.ts — IotCameraEventsService (l.44-147) |
| camera-ai (11: summary, trends, quality, productivity, prompt/trigger PUT) | REAL | camera-ai.controller.ts — CameraAiService (l.37-141) |
| camera-recognition (6: stats, logs, flag/unflag) | REAL | camera-recognition.controller.ts — CameraExtendedService (l.31-92) |
| camera-dashboard (9: stats, alerts, events, top-employees, quality/safety/production/attendance stats, weekly-trend) | REAL | camera-dashboard.controller.ts — CameraDashboardService (l.35-108) |
| camera-heatmap (5) + camera-reports POST generate-pdf/excel (real) | REAL | camera-heatmap-reports.controller.ts — CameraDashboardService (l.32-97) |
| camera-reports `GET generate-pdf` / `GET generate-excel` | **yashil-yolg'on** | camera-heatmap-reports.controller.ts:103,109 — `return { url: null, period }` (faylsiz, DB tegmaydi) |
| camera-alerts.controller.ts (10 controller bitta faylda: alerts/settings/cameras-list+patch/ratings/ai-camera/machine-status×2/safety/productivity/quality ~17 route) | asosan REAL | camera-alerts.controller.ts — CameraExtendedService/IotMainService delegate (l.45-296) |
| ai-camera `POST analyze-by-missions` | **yashil-yolg'on** | camera-alerts.controller.ts:211 — AI tahlil yo'q; faqat `getDashboard()` + echo missions + timestamp qaytaradi |

DUBLIKAT (controller'lararo route ust-ma-ust — bir xil ma'lumot bir nechta URL-prefiksda):
- `safety-violations` — iot-alerts.controller.ts:57 (`/iot/...`), iot-camera-events.controller.ts:87 (`/camera/...`), camera-alerts.controller.ts:258 (`/safety-violations`) — 3 xil yo'lda bir manba.
- `recognition-stats` — camera-recognition.controller.ts:33 (`/camera/...`) va iot-main.controller.ts:137 (`/iot/...`).
- `quality-defects-camera` — iot-camera-events.controller.ts:114 (`/camera/...`) va camera-alerts.controller.ts:284 (`/quality-defects-camera`).

**DB (kalit jadvallar — HAMMASI 0 qator = ishlatilmagan, qurilish bosqichi):**
iot_devices=0 · sensor_readings=0 · iot_alerts=0 · oee_records=0 · cameras=0 · camera_events=0 · production_sessions=0 · shift_handovers=0.

Modul holati: Kod jihatdan deyarli to'liq REAL (service+repo+real INSERT/UPDATE/SELECT), faqat 2 yashil-yolg'on (ai-camera analyze, camera-reports GET download) + 1 halol 501 + bo'sh `by_machine`. Ammo BARCHA jadvallar 0 qator — hech qaysi sensor/kamera real oqim bilan ulanmagan (memory: IoT anomaly handler no-op, mes_telemetry yozuvchisiz). Funksional, ammo bo'sh.

---

### Direktor (modul: director)

13 ta controller, HAMMASI `director.module.ts:95-109` da ro'yxatda (analytics 2 ta PA3-17 da merge qilingan).

- Jami route: **~80** · REAL: **~78** · 501-stub: **0** · yashil-yolg'on: **1** · dublikat: **1 (KPI alias, ataylab)**

| Controller / route | Holat | Dalil (fayl:satr) |
|---|---|---|
| director-root (8: kpi, kpis, summary, production, hr, finance, alerts, ai-summary) | REAL | director-root.controller.ts — QueryBus/DirectorDataService (l.31-87) |
| dashboard (5: dashboard, kpis, production/finance/hr-summary) | REAL | dashboard.controller.ts — DirectorDataService/DashboardQueryService (l.48-81) |
| director-extended (5: wms-rental, company-state, history, ideal-vs-actual, orders/:id/vip) | REAL | director-extended.controller.ts — DirectorStateService; markVip real (l.28-62) |
| okr (12: objectives+key-results CRUD, dashboard) | REAL | okr.controller.ts — OkrService; DB okr_objectives/okr_key_results mavjud (l.40-163) |
| kaizen (6: suggestions CRUD, stats) | REAL | kaizen.controller.ts — KaizenService; DB kaizen_suggestions mavjud (l.38-114) |
| strategic (12: categories/tasks/milestones CRUD, seed, dashboard) | REAL | strategic.controller.ts — StrategicService; DB strategic_categories=5, strategic_tasks mavjud (l.79-224) |
| coordination (14: councils, baskets, dokla/rasp CRUD, stats) | asosan REAL | coordination.controller.ts — CoordinationService; DB dokla/rasporyazhenie mavjud |
| coordination `GET /coordination/councils` | **yashil-yolg'on** | coordination.controller.ts:39 — qattiq kodlangan 5 ta kengash ro'yxati (DB yo'q) |
| zvs (4: create, list, approve, reject) | REAL | zvs.controller.ts — ZvsService, DB `zvs` (l.32-79) |
| zno (5: create, list, approve, reject, update) | REAL | zno.controller.ts — ZnoService, DB `zno` (l.34-101) |
| approvals (7: get, pending, stats, history, create, approve, reject) | REAL | approvals.controller.ts — CommandBus/QueryBus + db.execute stats (l.64-181) |
| approvals `getStats.avgApprovalTimeHours:0` | qisman | approvals.controller.ts:119 — hardcoded 0 (pending/approved/rejected real DB) |
| analytics (11: stats, course-progress, leaderboards, by-dept/position) | REAL | analytics.controller.ts — AnalyticsService (l.25-78) |
| analytics-extended (18: engagement, assessment, mentorship, surveys, skills-matrix) | REAL | analytics-extended.controller.ts — AnalyticsExtendedService (l.25-113) |
| director-root `kpi` ╳ `kpis` | dublikat | director-root.controller.ts:31,39 — bir xil GetDashboardKpisQuery (legacy alias, ataylab) |

**DB:** okr_objectives=0 · kaizen_suggestions=0 · approval_requests=0 · strategic_categories=5 (seed) · strategic_tasks=0 · dokla/rasporyazhenie/zno/zvs jadvallari mavjud.

Modul holati: Direktor eng toza modul — deyarli butunlay REAL (CQRS + service + repo + mavjud DB jadvallar). Faqat bitta hardcoded `councils` list + bitta hardcoded `avgApprovalTimeHours:0`. KPI alias dublikat ataylab. Ko'p jadval bo'sh (seed yo'q), lekin yozish/o'qish yo'llari haqiqiy.

---

### Admin / SaaS (modul: admin + compatibility/saas)

5 ta admin controller (`admin.module.ts:50`) + 2 ta SaaS-compat controller (`compatibility/saas.controller.ts`). `position-permissions/` controllersiz (faqat service/repo, ichki).

- Jami route: **~35** · REAL: **~31** · 501-stub: **0** · yashil-yolg'on: **3** · dublikat: **0**

| Controller / route | Holat | Dalil (fayl:satr) |
|---|---|---|
| admin-users (5: create, list, update-role, delete) | REAL | admin-users.controller.ts — CreateUser/UpdateUserRole/ListUsers service + userRepo.softDelete (l.47-121); DB users=31 |
| admin-settings (2: get, patch) | REAL | admin-settings.controller.ts — UpdateSettingsService + settingsRepo (l.54-92); DB system_settings=0 → default fallback (l.59) |
| admin-extra (8: roles, logs, audit, audit-filtered, audit-tables, system, alert/:id, login) | asosan REAL | admin-extra.controller.ts — AdminExtraService (l.33-83); DB audit_log=39 |
| admin-extra `GET /admin/roles` | **yashil-yolg'on (statik)** | admin-extra.controller.ts:29 — `svc.getRoles()` statik ro'yxat (DB emas) |
| admin-extra `POST /admin/login` | **yashil-yolg'on (stub redirect)** | admin-extra.controller.ts:87 — `return { message:'Use /api/auth/login', data:null }` (hech narsa qilmaydi) |
| admin-queue (5: status, failed, failed/:queue, retry, delete) | asosan REAL | admin-queue.controller.ts — AdminQueueService (BullMQ) (l.27-56) |
| admin-queue `DELETE /admin/queues/failed/:id` | **yashil-yolg'on** | admin-queue.controller.ts:64 — `return { id, deleted:true }` (real o'chirish yo'q) |
| admin-cron-status (1: get) | REAL | admin-cron-status.controller.ts:34 — CronStatusService runtime job stats |
| saas (18: tenants CRUD, platform-stats, error-logs, modules, expiry-alerts, onboard, modules PATCH) | REAL (deprecated shim) | saas.controller.ts — SaasService delegate (l.72-157); DB saas_tenants=0 |
| orders-registry-compat (2: list, create) | REAL | saas.controller.ts:164 — OrdersRegistryService |

**DB:** users=31 (jonli) · system_settings=0 (default fallback ishlaydi) · audit_log=39 (jonli) · system_alerts=0 · saas_tenants=0.

Modul holati: Admin yadrosi (users CRUD + settings + audit + cron-status) REAL va jonli ma'lumotli (users=31, audit_log=39). 3 ta kichik yashil-yolg'on: `/admin/roles` statik list, `/admin/login` stub-redirect (ataylab compat), queue `DELETE failed/:id` haqiqiy o'chirmaydi. SaaS = ishlaydigan, ammo deprecated shim, jadval bo'sh.

---

### Vazifalar / Kanban (modul: kanban)

7 ta controller fayl mavjud, lekin `kanban.module.ts:55-62` da FAQAT 6 tasi ro'yxatda.

- Jami route: **~75 faol (+5 dead)** · REAL: **~71** · 501-stub: **0** · yashil-yolg'on: **2** · dublikat/dead: **1 dead controller (5 route) + cards route-qoplama**

| Controller / route | Holat | Dalil (fayl:satr) |
|---|---|---|
| **kanban.controller.ts** (KanbanController — 5: GET/POST/PATCH/DELETE /kanban, GET /:id) | **DEAD (ro'yxatga olinmagan)** | kanban.module.ts:33 import qilingan, AMMO controllers[] (l.55-62) da YO'Q → runtime'da map BO'LMAYDI. CQRS `GetTasksQuery` ishlatadi; targeti `tasks` jadvali DB da MAVJUD EMAS |
| kanban-boards (boards/columns/cards CRUD, employees, notifications, templates, robots ~30 route) | REAL | kanban-boards.controller.ts — KanbanBoardsService/KanbanExtService (l.51-287) |
| kanban-boards `PUT notifications/read-all` `return {ok:true}` | qisman | kanban-boards.controller.ts:182 — markAllRead real chaqiriladi, keyin `{ok:true}` (yon-effekt bor) |
| kanban-core (flows/robots/board CRUD ~9 route) | REAL | kanban-core.controller.ts — KanbanExtService (l.46-128) |
| kanban-cards (cards extended, chat, tags, observers, co-executors ~20 route) | asosan REAL | kanban-cards.controller.ts — KanbanExtService + db.execute real INSERT/UPDATE (l.85-300) |
| kanban-cards `GET /kanban/cards` (boardId yo'q holatda) | **yashil-yolg'on** | kanban-cards.controller.ts:115 — boardId bo'lmasa `return {items:[],total:0}` (DB tegmaydi) |
| kanban-cards `GET /kanban/cards` ╳ `GET boards/:boardId/cards` | dublikat | kanban-cards.controller.ts:100 va kanban-boards `boards/:boardId/cards` — bir xil kanban_cards SELECT 2 joyda |
| kanban-checklist (checklists/items, comments, watchers, sprint, overdue, members ~22 route) | REAL | kanban-checklist.controller.ts — KanbanExtService (l.37-158) |
| kanban-card-files (results, files upload/delete, time-tracking ~12 route) | REAL | kanban-card-files.controller.ts — real fs.writeFileSync + svc (l.53-236) |
| kanban-reports (employee-perf, productivity, overdue, analytics, export PDF/Excel, projects, task-stats, team-metrics, overdue-inbox ~10 route) | REAL | kanban-reports.controller.ts — KanbanExtService + ExcelJS/pdfmake real export (l.54-245); projects real SELECT task_projects |

DUBLIKAT/DEAD asosiy:
- **KanbanController (kanban.controller.ts) — butun controller dead**: import qilingan (kanban.module.ts:33) lekin `controllers[]` ga qo'shilmagan → 5 route runtime'da YO'Q. Targeti `tasks` jadvali DB da mavjud emas. Eski/abandoned CQRS task-CRUD; faol Kanban `kanban_cards`/`kanban_boards` ustida ishlaydi.

**DB:** kanban_boards=2 (jonli) · kanban_cards=2 (jonli) · `tasks` jadvali = MAVJUD EMAS (KanbanController target).

Modul holati: Faol 6 controller REAL va jonli (boards=2, cards=2, real INSERT/fayl-upload/Excel-PDF export). Asosiy muammo — eski `KanbanController` ro'yxatga olinmagan dead kod (import bor, route map yo'q) va u izlagan `tasks` jadvali yo'q. 2 ta kichik yashil-yolg'on (bo'sh `GET /cards`, `{ok:true}` read-all).

---

## YIG'INDI (4 modul)

| Modul | Jami route (taxm.) | REAL | 501-stub | yashil-yolg'on | dublikat/dead |
|---|---|---|---|---|---|
| IoT/Kamera | ~135 | ~125 | 1 | 3 | route-qoplama (controller'lararo, 3 xil prefiks) |
| Direktor | ~80 | ~78 | 0 | 1 | 1 (KPI alias, ataylab) |
| Admin/SaaS | ~35 | ~31 | 0 | 3 | 0 |
| Vazifalar/Kanban | ~75 faol (+5 dead) | ~71 | 0 | 2 | 1 dead controller (5 route) + cards qoplama |
| **JAMI** | **~325 faol (+5 dead)** | **~305** | **1** | **9** | **1 dead controller + route-qoplamalar** |

Umumiy xulosa: To'rt modul ham KOD sifati jihatdan kuchli — aksariyat route service/repo orqali real DB ga ulangan (REAL ~94%). Eng toza = Direktor. Strukturaviy muammolar: (1) Kanban'da eski `KanbanController` dead (ro'yxatsiz + `tasks` jadvali yo'q); (2) IoT/Kamera controllerlari orasida bir xil ma'lumot 3 xil URL-prefiksda takrorlanadi (safety-violations, recognition-stats, quality-defects); (3) IoT jadvallar HAMMASI 0 qator — kod tayyor, lekin real sensor/kamera oqimi ulanmagan (qurilish bosqichi).
