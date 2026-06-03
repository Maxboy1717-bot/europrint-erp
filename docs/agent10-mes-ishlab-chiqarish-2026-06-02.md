# MES / ISHLAB CHIQARISH — ASL HOLAT HISOBOTI (2026-06-02)

> **FAQAT TAHLIL** — hech narsa o'zgartirilmadi. Kod (Read/Grep) + jonli DB (`europrint`@127.0.0.1:5432, `node _audit/q.cjs`) + brauzer (:20806, Super Admin tab). Verify-don't-trust: har da'vo fayl:satr yoki DB so'rov yoki brauzer status bilan tasdiqlangan.
> Egasi vizyoni: Flekso+Ofset sex · buyurtma sexma-sex marshrut · IoT tablet skaner · yarim tayyor transfer · brak/qoldiq/kamomad hisobi · AI rejalashtirish.

---

## QISQA HUKM (necha %)

MES/Ishlab chiqarish — **boy va ko'p qatlamli SKELET (struktura ~70%), lekin operatsion yadro deyarli BO'SH (jonli ishlatish ~15%)**. Kod hajmi katta: MES moduli 45 fayl + PP (Production Planning) moduli 80+ fayl + AI planner + AI-planning controller. Endpointlarning **ko'pchiligi REAL** (Drizzle/SQL, stub emas) va read-yo'llari brauzerda **200** qaytaradi. LEKIN:
- **0 sex (work_centers), 0 marshrut (routings/routing_operations), 0 sessiya, 0 buyurtma, 0 OEE** — barcha 25+ MES/PP/production jadval **0 qator** (1 istisno: `gamification_points`=48).
- **Sexma-sex marshrut (handover) + IoT skaner→sarf = 501 STUB** (IoT tablet controller'da — alohida hisobotda).
- **brak/qoldiq/kamomad: schema TAYYOR** (`production_sessions.defect_qty/defect_quantity`, `production_orders.defective_qty/scrap_quantity`), `updateSessionQuantity` defekt yozadi va `getStats` defect_rate hisoblaydi — lekin **yozuvchi oqim ishlamaydi** (0 data; ba'zi yo'llar drift bug bilan 500).
- **3-4 ta parallel "production session" tizimi** bir-birini ko'rmaydi (`mes_sessions` vs `production_sessions` vs IoT tablet) + bir nechta **FE↔BE↔DB drift bug** (mavjud bo'lmagan jadval/ustunga yozadi → 500).

**Asosiy xulosa:** "Skelet bor, yadro bo'shmi" savoliga javob — **HA, skelet bor (ham FE, ham BE boy), yadro bo'sh**. Sexma-sex marshrut va IoT skaner — yo'q (stub). Brak hisobi — schema bor, oqim ulanmagan. Hech qaysi buyurtma sexma-sex kuzatilmaydi.

---

## 1. BACKEND MODUL STRUKTURASI

Ishlab chiqarish 3 ta NestJS modulga bo'lingan (+AI agentlar):

| Modul | Joy | Fayl soni | Mazmun |
|---|---|---|---|
| **MES** | `apps/api/src/modules/mes/` | 45 | Sessiya, downtime, OEE, shift-stats, maintenance, work-orders |
| **PP** (Production Planning) | `apps/api/src/modules/pp/` | 80+ | Work centers, routing, BOM, production orders, MRP, MPS, CRP, scheduling (Johnson/CPM/network) |
| **PP/production** | `apps/api/src/modules/pp/production/` | — | Shift reports, production reports, order 360 |
| **AI planner** | `apps/api/src/modules/ai-agents/planning/` | 1 | Johnson + CPM + EOQ algoritm |
| **AI planning** | `apps/api/src/modules/ai/presentation/` | — | `/ai-planning/*` reja CRUD (dashboard/plans/generate/approve) |

---

## 2. MES ENDPOINTLAR — REAL/STUB (kod + brauzer dalili)

### 2.1. `mes/sessions` (`mes-sessions.controller.ts`) — REAL (DDD), lekin parallel
| Endpoint | Holat | Yozadi/o'qiydi |
|---|---|---|
| `GET mes/sessions` | ISHLAYDI | `MesProductionSessionsService.listSessions` → `mes_sessions` JOIN work_centers/users |
| `POST mes/sessions` | ISHLAYDI | `mes_sessions` INSERT |
| `GET mes/sessions/:id` | ISHLAYDI | `mes_sessions` |
| `POST mes/sessions/:id/start` | ISHLAYDI (CQRS) | `StartSessionHandler` → DDD aggregate → **`production_sessions`** (boshqa jadval!) |
| `POST mes/sessions/:id/complete` | ISHLAYDI (CQRS, TX) | `CompleteSessionHandler` → `production_sessions` + `MesCompletedEvent`+`MesToHr360Event` publish |
| `POST mes/sessions/:id/downtime` | ISHLAYDI (CQRS) | `RecordDowntimeCommand` |

⚠️ **NOMUVOFIQLIK:** `list/create/get` → **`mes_sessions`** jadvaliga; `start/complete` → DDD repo orqali **`production_sessions`** jadvaliga. Ya'ni yaratilgan sessiyani (`mes_sessions`) start qilib bo'lmaydi (`production_sessions` da topilmaydi). 2 ta turli jadval = uzilgan oqim. (`mes-production-sessions.repo.ts:37` vs `drizzle-mes.repo.ts:37`)

### 2.2. `mes/operations` (`mes-operations.controller.ts`) — REAL
| Endpoint | Holat | Izoh |
|---|---|---|
| `GET mes/operations` (sessions) | ISHLAYDI | `GetSessionsQuery` |
| `GET/POST mes/operations/downtime` | ISHLAYDI | `downtime_events` (Drizzle) |
| `PATCH mes/operations/downtime/:id/end` | ISHLAYDI | CQRS `EndDowntimeCommand` |
| `GET mes/operations/downtime/summary` | ISHLAYDI | CQRS |
| `GET mes/operations/reason-codes` | ISHLAYDI | `DOWNTIME_REASON_CODES` (kod konstanta) |
| `GET mes/operations/oee` | ISHLAYDI | `GetOeeHandler` (hisob) |
| `POST mes/operations/:sessionId/downtime` | ISHLAYDI | CQRS |

### 2.3. `mes/production-sessions` (`mes-production-sessions.controller.ts`) — QISMAN-BUZUQ (drift)
| Endpoint | Holat | Izoh |
|---|---|---|
| `GET/POST/GET :id` | ISHLAYDI | `mes_sessions` |
| `POST :id/downtime` | ❌ BUZUQ | `mes_downtime_events` jadvaliga INSERT — **bu jadval DB'da YO'Q** → 500 |
| `GET :id/downtime-events` | ❌ BUZUQ | xuddi shu `mes_downtime_events` → 500 |

### 2.4. `mes` (`mes-shifts-stats.controller.ts`) — ⭐ ASOSIY WORKHORSE, REAL (brauzer 200)
Bu controller FE MES sahifalarining ko'p so'rovlarini quvvatlaydi. **17 metod, hammasi haqiqiy Drizzle/SQL** (`mes-shifts-stats.repo.ts`):

| Endpoint | Brauzer | Yozadi/o'qiydi |
|---|---|---|
| `GET mes/shifts/current` | ✅ 200 | `mes_sessions` status='active' |
| `GET mes/oee` | ✅ 200 | `equipment` LEFT JOIN `production_sessions` (AVG oee) |
| `GET mes/stats` | ✅ 200 | `mes_production_sessions` (VIEW) — produced/defect_rate hisoblaydi ⭐ |
| `GET mes/gamification/leaderboard` | ✅ 200 | `employees` JOIN `gamification_points` (48 qator bor) |
| `GET mes/papka-orders`, `GET mes/orders`, `GET mes/orders/:id` | (kod real) | `mes_papka_orders` (VIEW→`papka_orders`) |
| `GET mes/shifts`, `GET mes/shifts/evaluations` | (kod real) | `mes_shift_handovers`/`evaluations` (VIEW) |
| `GET mes/maintenance` | (kod real) | maintenance |
| `PATCH mes/sessions/:id/pause` | ISHLAYDI | `mes_production_sessions` SET status='paused' |
| `PATCH mes/sessions/:id/resume` | ISHLAYDI | status='active' |
| `PATCH mes/sessions/:id/quantity` | ISHLAYDI ⭐ | `produced_qty` + **`defect_qty`** yozadi (BRAK!) |
| `POST mes/shifts/handover` | ❌ BUZUQ | `mes_shift_handovers` VIEW'ga INSERT `incoming_supervisor`,`notes` — **VIEW'da bu ustunlar YO'Q** → 500 |
| `POST mes/shifts/close-evaluation` | ❌ BUZUQ | `mes_shift_evaluations` VIEW'ga `supervisor_id`,`production_score` — **VIEW'da YO'Q** → 500 |
| `POST mes/material-consumption` | ❌ BUZUQ | `mes_material_consumption` jadvaliga — **bu jadval DB'da YO'Q** (faqat `material_consumption`/`production_consumption` bor) → 500 |

### 2.5. `mes` maintenance (`mes-maintenance.controller.ts`) — REAL (brauzer 200)
| Endpoint | Brauzer | Izoh |
|---|---|---|
| `GET/POST mes/maintenance-requests`, `PATCH :id` | ✅ 200 (GET) | `mes_maintenance_requests` (real Drizzle/SQL) |
| `GET mes/tasks`, `PATCH mes/tasks/:id/progress` | ✅ 200 (GET) | `mes_maintenance_tasks` |
| `POST mes/sos`, `GET mes/sos/history` | (kod real) | SOS |
| `GET mes/downtime-reasons` | ✅ 200 | reason codes |
| `GET/POST mes/downtime-events` | (kod real) | `OperationsService` → `downtime_events` |

**MES backend xulosasi:** 6 controller, ~50 endpoint. ~85% REAL Drizzle/SQL (stub emas, soxta javob emas). 4 ta confirmed **drift bug** (mavjud bo'lmagan jadval/ustunga yozadi → 500): `mes_downtime_events`, `mes_material_consumption`, shift-handover/evaluation VIEW ustunlari. ~3 ta jiddiy **arxitektura uzilishi**: 2-3 parallel session jadvali.

---

## 3. WORK_CENTERS (SEXLAR — Flekso/Ofset)

- ❌ **`work_centers` = 0 qator** (base table). Flekso/Ofset sexlari DB'da YO'Q.
- ✅ **CRUD REAL:** `pp/work-centers` controller (`PpWorkCentersController`) — `GET`/`GET :id`/`GET stats`/`POST`/`PUT :id`/`PATCH :id/toggle-active`. CQRS + `DrizzleWorkCenterRepository` → `pp_work_centers`.
- ⚠️ **VIEW orqali yozadi:** repo `db.insert(ppWorkCenters)` → `pp_work_centers` bu **VIEW** (`SELECT ... FROM work_centers`, bitta jadval, JOIN yo'q → PostgreSQL auto-updatable → INSERT/UPDATE ISHLAYDI). MES sessiyalar esa to'g'ridan `work_centers` base jadvalga ishora qiladi. Funksional, lekin nomi chalkash.
- `work-center.aggregate.ts` — to'liq DDD aggregate (type: machine/manual/..., capacity, LMS sertifikat, department). `WorkCenterType` enum bor.
- **type maydonida Flekso/Ofset YO'Q** — `type` generic ('machine' default). Flekso/Ofset = alohida ish markazlari sifatida seed qilinishi kerak (kod o'zgarmaydi).

**Hukm:** sex tushunchasi (work_center) to'liq qurilgan (CRUD+aggregate+repo) — lekin **0 sex**. Flekso/Ofset = 2 qator seed masalasi, qurish emas.

---

## 4. MARSHRUT (ROUTING — sexma-sex yo'l)

- ❌ **`routings`=0, `routing_operations`=0, `pp_routing`=0** (`pp_routing_operations` = VIEW, 0).
- ⚠️ **`pp/routing` POST `create` = STUB** — `pp-routing.controller.ts:78` da `return 0;` (hardcoded, servisni CHAQIRMAYDI). Marshrut yaratish HECH NARSA qilmaydi.
- ✅ **Service REAL:** `RoutingsService` (`routings.service.ts`) — findAll/findOne/create/update/remove to'liq, `DrizzlePpRoutingsRepository` → `routings` + `routingOperations` (sequence bo'yicha). Controller esa `create`'da servisni chetlab o'tadi.
- ✅ `pp/routing` `GET`/`GET :id`/`PATCH :id`/`POST :id/approve`/`DELETE :id` — REAL (servisga delegatsiya).
- FE: `RoutingConfiguration.tsx` + `RoutingConfigurationCreateDialog.tsx` (yaratish dialogi bor) → `/erp/pp/routing` route'da.

**Hukm:** Marshrut o'qish/tahrir/o'chir/tasdiq — REAL; **YARATISH stub** (`return 0`). Marshrut = buyurtma sexma-sex yo'li, lekin yaratish ishlamagani uchun **0 marshrut** → sexma-sex yo'l mavjud emas. Operatsiya darajasida (`routing_operations`) sex ketma-ketligi modellanган, lekin bo'sh.

---

## 5. PRODUCTION-SESSIONS — start/stop/defect REAL yoki STUB?

**3 ta turli "production session" surface mavjud, bir-birini ko'rmaydi:**

| # | Surface | Controller | Jadval | Ustun to'plami |
|---|---|---|---|---|
| 1 | DDD MES | `mes/sessions` start/complete | `production_sessions` | pp_id, work_center_id, operator_id, started_at, completed_at |
| 2 | Raw MES | `mes/production-sessions`, `mes/sessions` list/create, `mes/shifts-stats` | `mes_sessions` + `mes_production_sessions` (VIEW→production_sessions) | worker_id, equipment_id, produced_qty, defect_qty |
| 3 | Shift reports | `production/shift-reports` | `production_sessions` | worker_id, equipment_id, actual_quantity, worker_notes |
| 4 | IoT tablet | `iot/production-sessions/:id/start\|stop\|defect` | — | **501 STUB** (IoT hisobotida) |

- `production_sessions` jadvali **34 ustun** — 3-4 drift to'lqinidan yig'ilgan aralash (worker_id+operator_id, equipment_id+machine_id+work_center_id(text), actual_quantity+produced_qty, **defect_quantity+defect_qty**, session_id(text), oee/availability/performance/quality). Og'ir schema drift.
- **start/stop:** #1 (DDD) va #3 (shift report close) REAL — lekin `production_sessions` 0 qator. #2 pause/resume REAL (`mes_production_sessions` VIEW orqali).
- **defect (brak):** #2 `updateSessionQuantity` `defect_qty` yozadi ✅; #3 shift-report `closeShiftReport` faqat `actual_quantity` yozadi, **defect_quantity'ni YOZMAYDI** ❌. IoT `defect` = **501 STUB**.
- **`production-session.aggregate.ts`** (DDD): status mashina (ready→checklist→running→paused→completed→sent_to_qc) + downtime ro'yxati. **defect/qoldiq/output-quantity logikasi YO'Q** — faqat holat o'tishlari.

**Hukm:** start/stop — bir nechta joyda REAL (lekin 0 data, ba'zi yo'l 500). defect — schema bor, bitta yo'l (`/quantity`) yozadi, IoT yo'li stub, DDD aggregate'da yo'q. **Tarqoq va ulanmagan**: bitta sessiyani bir surface'da boshlab boshqasida ko'rib bo'lmaydi.

---

## 6. IoT TABLET BOG'LANISHI (sexma-sex skaner)

- ❌ IoT tablet operatsion endpointlari (`material-kit-items/:id/scan`, `production-sessions/:id/start|stop|defect|material-return|inline-qc`, `tablet/handover`) = **501 STUB** (alohida `docs/iot-tablet-asl-holat-2026-06-02.md` da batafsil).
- ⚠️ FE `MESWorkCenters.tsx` **`/api/iot/production-sessions`** dan o'qiydi (equipment grid uchun) + `mesApi.createSession` (→ `/api/mes/sessions`). Ya'ni MES Ish Markazlari sahifasi sessiya ro'yxatini **IoT 501 stub** dan kutadi (bo'sh qaytadi), faqat WC yaratish (`ppApi.createWorkCenter` → `/pp/work-centers`) real.
- **`tablet/handover` (keyingi sexga yarim tayyor o'tkazish) = 501 STUB** — sexma-sex transfer mavjud EMAS.

**Hukm:** Tablet ↔ MES operatsion ulanmagan. Skaner→buyurtma sarfi va sex-ga transfer = stub.

---

## 7. SEXMA-SEX O'TISH (HANDOVER / TRANSFER)

Vizyon: buyurtma Flekso→Ofset→... sexma-sex o'tadi, har sexda yarim tayyor transfer.

- ❌ **Yarim tayyor → keyingi sex transfer:** IoT `tablet/handover` = **501 STUB**. Boshqa joyда ham yo'q.
- ⚠️ **`mes/shifts/handover`** bor LEKIN bu **SMENA topshirish** (chiqayotgan→kiruvchi supervisor), buyurtma sex-transfer EMAS. Ustasi ham **drift bug** (VIEW ustun yo'q → 500).
- ✅ **Marshrut operatsiyalari** (`routing_operations`) sex ketma-ketligini modellaydi (sequence) — lekin 0 marshrut.
- ⚠️ Sexma-sex oqim faqat **boshqa joyda** qisman bor: `sd_order_departments` fan-out (Phase 4, memory `session_2026-06-01_phase4_fanout.md`) — buyurtma→bo'limlarga tarqatish (mold/design/cliché/logistics/warehouse), lekin bu **MES sex marshruti emas**, balki order→department job tracking.

**Hukm:** Haqiqiy MES "buyurtma sexma-sex o'tadi va yarim tayyor transfer bo'ladi" oqimi **YO'Q** (handover stub + 0 marshrut). Faqat smena-topshirish (buzuq) va order→dept fan-out (boshqa modul).

---

## 8. BRAK / QOLDIQ / KAMOMAD HISOBI

| Daraja | Schema | Yozuvchi oqim | Holat |
|---|---|---|---|
| Session | `production_sessions.defect_quantity` + `defect_qty` | `updateSessionQuantity` (`/quantity`) `defect_qty` yozadi ✅; `closeShiftReport` defect YOZMAYDI ❌; IoT `defect` 501 ❌ | QISMAN |
| Production order | `production_orders.defective_qty` + `scrap_quantity` + `confirmed_quantity` | aggregate'da defekt logikasi YO'Q; faqat status o'tishi | schema bor, oqim yo'q |
| Stats | `getStats` → `defect_rate = defect_qty/produced_qty * 100` | REAL hisob (lekin 0 data) | ISHLAYDI |
| Brak ombori | `warehouse_types` 'defective' turi (POS/Ombor) | ombor moduli (boshqa hisobot) | ombor tomonda bor |

- Brak DB jadvali: `qc_defects`(0), `qc_defects_extended`(0), `defect_reports`(0), `camera_quality_defects`(0) — QC modulida (alohida).
- **Kamomad (material yetishmovchilik):** material consumption (`mes_material_consumption`) **jadvali YO'Q** → consumption yozuvi 500. `production_consumption`(0)/`material_consumption`(0) bor lekin MES yo'li ularni ishlatmaydi.
- **Qoldiq (makulatura/waste):** ombor `warehouse_types` 'waste_paper' turi bor (ombor moduli).

**Hukm:** brak — schema 100% tayyor (session+order darajasida defect/scrap ustunlari), `defect_rate` hisobi real, FE'da "Brak %" KPI ko'rinadi — lekin **yozuvchi oqim qisman/buzuq** (bitta yo'l yozadi, IoT stub, shift-report yozmaydi, consumption jadvali yo'q). 0 data.

---

## 9. AI REJALASHTIRISH (/planning)

**Ikki ALOHIDA AI-planning surface:**

### 9.1. `AiPlannerService` (`ai-agents/planning/planner.service.ts`) — ⭐ REAL ALGORITM
- **Johnson's rule** (2-mashina ketma-ketlik) + **CPM** (critical path, forward/backward pass, float, critical/at-risk) + **EOQ** (iqtisodiy buyurtma miqdori) + makespan.
- 1-soatlik idempotency cache (`AiDecisionLogService.findCachedDecision`), AI decision log yozadi, `deadline_risk` event emit qiladi.
- Endpoint: **`POST ai-agents/planning/plan`** (`ai-agents.controller.ts:125`). Shuningdek `POST ai-agents/mes/oee`, `mes/anomaly`, `qc/vision-analyze`, `logistics/vrp`.
- **Haqiqiy hisob-kitob dvigateli** (matematik, soxta emas).

### 9.2. `/ai-planning/*` (`ai/presentation/ai-planning.controller.ts`) — REAL CRUD
- `GET dashboard`/`plans`/`config`, `POST plans`/`generate`, `POST plans/:id/approve`/`reject`/`reschedule`/`block-material`, `PUT/PATCH config`. `AiPlanningService` ga delegatsiya → **`ai_production_plans`** jadval (0 qator).
- FE: `AIProductionPlanning.tsx` (`/ai-production-planning`) — to'liq UI (generate/approve/reject/override/reschedule/block-material dialoglari, batch-groups). Hammasi `/api/ai-planning/*` ga ulanган.

### 9.3. PP intelligence (MRP/MPS/CRP)
- `pp/mrp/run` (POST), `pp/mps` (GET), `pp/crp` (GET), `pp/learning-curve/:productId` — `PpIntelligenceService`.
- ⚠️ `pp/crp` 503 — `work_centers.efficiency_rate` ustuni yo'q (memory `project_crp_503_efficiency_rate.md`).
- `pp/orders/plan/:start/:end`, `planning/schedule` (pp-planning.controller) — REAL.
- Scheduling domain xizmatlari: Johnson, network, capacity, learning-curve, costing — to'liq kod (`pp/domain/services/`).

**Hukm:** AI rejalashtirish — **eng kuchli qism**: real algoritmlar (Johnson/CPM/EOQ/MRP/MPS/CRP) + 2 ta endpoint surface + boy FE. LEKIN 0 reja, 0 buyurtma, 0 sex → hech narsa rejalashtiradigan data yo'q. CRP 503 (ustun drift).

---

## 10. MES FRONTEND SAHIFALAR

### 10.1. Route'lar (`routes/ProductionRoutes.tsx`)
- **MES_ROUTES (12):** `/mes/dashboard-home`, `work-centers`, `products`, `downtimes`, `workers`, `oee-monitor`, `reason-log`, `zone-management`, `maintenance-request`, `gamification`, `machine-norms`, `smena-handover`.
- ⚠️ 7 ta MES route (`oee-monitor`/`reason-log`/`zone-management`/`maintenance-request`/`gamification`/`machine-norms`/`smena-handover`) → **bitta `MESExtended` komponenti** (URL→tab map). Mega-page 7 tab.
- **PRODUCTION/PP_ROUTES (40+):** `/planning`, `/ai-production-planning`, `/production/orders`(+:id 360), `/pp/dashboard`, `/erp/pp/bom`, `/erp/pp/routing`, `/erp/pp/capacity`, `/pp/mrp`, `/pp/crp`, +15 `/pp/*` va `/tech/*` → **bitta `TechPPExtended` catch-all** komponenti.

### 10.2. Sahifalar holati
| Sahifa | Holat | Dalil |
|---|---|---|
| `MESHomeDashboard` (`/mes/dashboard-home`) | ✅ ISHLAYDI (brauzer) | KPI: Faol sessiya 0, OEE 0%, Ishlab chiqarildi 0, **Brak 0%**, To'xtash 0; "Sessiya topilmadi" — toza UI, 0 data |
| `MESExtended` (`/mes/oee-monitor` +6) | ✅ ISHLAYDI (brauzer) | 7 tab (OEE/Sabablar/Vazifalar/Texnik Xizmat/Gamifikatsiya/Normalar/Smena O'tkazish); 7 API → hammasi **200** |
| `MESWorkCenters` (`/mes/work-centers`) | ⚠️ QISMAN | WC yaratish real (`/pp/work-centers`); sessiya grid `/api/iot/production-sessions` (501 stub) dan o'qiydi → bo'sh |
| `MESProducts`, `MESDowntimes`, `MESWorkerAssignments` | (mutation bor) | CRUD-li sahifalar |
| `AIProductionPlanning` (`/ai-production-planning`) | (real, boy UI) | `/api/ai-planning/*`; generate/approve/reschedule |
| `PlanningBoard` (`/planning`) | (real) | rejalashtirish doskasi |
| `ProductionOrder360` (`/production/orders/:id`) | (8 tab) | BOM/Cost/Equipment/Quality/Shifts/TimeAnalysis/Timeline |
| `RoutingConfiguration`, `CapacityPlanning`, `MrpMatrix`, `CrpPage` | (real UI) | marshrut/quvvat/MRP/CRP; CRP BE 503 |
| `ProductionReport`, `ProductionFactsPage`, `ShiftReportsPage`, `ShiftSchedule` | (real) | hisobotlar/smena |

### 10.3. FE↔BE drift (API client)
`mesApi` (`lib/api/mes.ts`) ko'p endpoint chaqiradi — ko'pi BE'da BOR (`mes-shifts-stats` quvvatlaydi: pause/resume/quantity/material-consumption/shifts), lekin ba'zilari BE'da yo'q yoki 500: `/api/mes/sos` (bor), `/api/mes/shifts/close-evaluation` (bor lekin **500 drift**), `/api/mes/material-consumption` (**500 — jadval yo'q**).

**FE hukmi:** MES FE — **boy va professional** (12 MES + 40 PP route, toza dizayn, brauzer 200). Lekin (a) ko'p route bitta mega-komponent ortida (MESExtended/TechPPExtended catch-all), (b) hammasi 0 data, (c) ba'zi yozuv yo'llari drift bug bilan 500.

---

## 11. JADVALLAR — QATOR SONI (jonli DB, 2026-06-02)

**Barchasi 0 (1 istisno):**
`work_centers`=0, `pp_work_centers`=VIEW, `work_center_capacity`=0, `employee_work_centers`=0, `routings`=0, `routing_operations`=0, `pp_routing`=0, `pp_routing_operations`=VIEW, `mes_operations`=0, `mes_sessions`=0, `mes_production_sessions`=VIEW(→production_sessions=0), `mes_tasks`=0, `mes_papka_orders`=VIEW(→papka_orders), `mes_shift_stats`=0, `mes_shift_handovers`=VIEW(→shift_handovers), `mes_shift_evaluations`=VIEW(→shift_evaluations), `mes_maintenance_requests`=0, `mes_maintenance_tasks`=0, `production_sessions`=0, `production_orders`=0, `pp_orders`=VIEW, `pp_mrp_runs`=VIEW, `production_order_operations`=0, `production_order_components`=0, `production_facts`=0, `production_consumption`=0, `downtime_events`=0, `oee_records`=0, `oee_snapshots`=0, `ai_production_plans`=0, `shifts`=0, `shift_assignments`=0, `equipment`=0, `sales_orders`=0.
**Istisno:** `gamification_points`=48 (leaderboard data bor).

**Mavjud bo'lmagan jadval (kod yozadi → 500):** `mes_downtime_events`, `mes_material_consumption`, `operator_certifications`.

---

## 12. ARXITEKTURA MUAMMOLARI (xulosaviy)

1. **Parallel session jadvallari (P0):** `mes_sessions` ↔ `production_sessions` ↔ IoT tablet — 3 surface, 1 sessiyani biri ikkinchisida ko'rmaydi. `production_sessions` 34 ustun = og'ir drift.
2. **4 ta drift bug (P0):** `mes_downtime_events` yo'q, `mes_material_consumption` yo'q, `operator_certifications` yo'q, shift-handover/evaluation VIEW ustunlari mos emas → tegishli POST/PATCH 500.
3. **Routing yaratish stub (P1):** `pp-routing.controller.ts:78 return 0` — servis real, controller chetlab o'tadi.
4. **work_centers vs pp_work_centers (P2):** base table va VIEW ikkalasi ishlatiladi (funksional lekin chalkash).
5. **WorkOrdersService controllersiz (P2):** to'liq real service (crew+sessions, status machine) `mes.module` dan eksport qilingan lekin **hech qaysi controller HTTP'ga chiqarmaydi** → o'lik-lekin-qurilgan kod (`production_orders`+`machine_crews` ga ishora).
6. **CRP 503 (P2):** `work_centers.efficiency_rate` ustuni yo'q.
7. **Catch-all FE (P2):** 7 MES route → MESExtended; 15+ PP route → TechPPExtended.
8. **dead event listenerlar:** `MesCompletedEvent`/`MesToHr360Event` publish bo'ladi (CompleteSession) — qabul qiluvchi QC/HR listener alohida tekshirilishi kerak.

---

## 13. XULOSA — MES NECHA %

| Jihat | Tayyorlik | Izoh |
|---|---|---|
| **Skelet/struktura** (modul, controller, service, repo, DDD aggregate, FE sahifa) | **~70%** | Juda boy: 45+80 fayl, CQRS, scheduling algoritmlar, 50 FE sahifa |
| **Funksional read** (jonli 200 qaytaradi) | **~60%** | MES Dashboard + 7 MES read endpoint brauzerda 200; PP CRUD real |
| **Funksional write** (haqiqatda data yozadi) | **~25%** | Ko'p POST/PATCH real, lekin 4 drift bug 500 + 0 data |
| **work_centers (Flekso/Ofset)** | ⚠️ CRUD bor, **0 sex** | seed masalasi |
| **Routing (sexma-sex marshrut)** | ⚠️ o'qish real, **yaratish stub**, 0 marshrut | `return 0` |
| **Production session start/stop** | ⚠️ 3 surface real, ulanmagan, 0 data | parallel jadval |
| **Defect/brak/qoldiq** | ⚠️ schema 100%, oqim qisman/buzuq, 0 data | `/quantity` yozadi, IoT stub, consumption jadvali yo'q |
| **IoT tablet skaner / sex transfer** | ❌ 501 STUB | qurish kerak |
| **AI rejalashtirish** | ✅ algoritm real (Johnson/CPM/EOQ/MRP), 2 endpoint surface, boy FE; **0 reja** | eng kuchli, lekin data yo'q + CRP 503 |
| **Sexma-sex buyurtma oqimi (yadro vizyon)** | ❌ YO'Q | handover stub + 0 marshrut |

**UMUMIY MES: ~30-35% (struktura ~70%, jonli yadro ~15-20%).**

**Nima bor:** MES+PP modullari (50+ controller endpoint, ko'pi real Drizzle/SQL), DDD aggregatlar, AI planner (Johnson/CPM/EOQ), MRP/MPS/CRP/scheduling kod, work-center/routing/BOM/PO CRUD, 50 FE sahifa (brauzer 200), defect schema, OEE hisob, maintenance, gamification (48 qator).

**Nima yo'q / buzuq:** 0 sex / 0 marshrut / 0 sessiya / 0 buyurtma (data yo'q); sexma-sex transfer (handover stub); IoT skaner→sarf (501 stub); routing yaratish (return 0); brak yozuv oqimi (qisman + 500); 4 ta DB drift bug; 3 parallel session tizimi; WorkOrdersService controllersiz; CRP 503.

**Egasi vizyoni bo'yicha:** "buyurtma Flekso/Ofset sexma-sex o'tadi, IoT tablet skaner, yarim tayyor transfer, brak/qoldiq/kamomad" — **yadro (sex marshruti + transfer + skaner) YO'Q yoki stub**. Skelet (sex/marshrut/session/AI struktura) qurilgan, lekin oqim ulanmagan va bo'sh. "Ballonsiz mashina" — dvigatel (AI planner, scheduling) bor, g'ildirak (sexma-sex marshrut+transfer+skaner) yo'q.

---

*Tahlil 2026-06-02 — kod (Read/Grep, fayl:satr) + jonli DB (`_audit/q.cjs`, qator/ustun/view) + brauzer (:20806, MES Dashboard + OEE Monitor, 7 endpoint 200). Hech narsa o'zgartirilmadi.*
