# AI Camera + IoT modullari — chuqur tahlil va tuzatish rejasi

Sana: 2026-05-16
Skoup: backend (`apps/api/src/modules/{iot,camera,erp/erp-camera*,aisha,ai-agents/qc}`) + frontend (`artifacts/erp-dashboard/src/{pages/camera-*,pages/iot,camera-ai-modern,components/camera-ai,hooks/use-iot}`)

---

## 1. Modulning hozirgi anatomiyasi

### 1.1 Backend modullari (5 ta alohida joyda kamera kodi bor)

| # | Joy | Rolllari | Holat |
|---|---|---|---|
| 1 | `apps/api/src/modules/iot/` | **Asosiy modul** — 10 ta controller, 8 ta service, 8 ta repository, sensor CQRS handlers, OEE, kamera AI/dashboard/heatmap/alerts | ✅ Eng to'liq |
| 2 | `apps/api/src/modules/camera/` | Standalone `CameraModule` — 2 ta controller (`CameraController` + `AiCameraController`), 1 ta service, 1 ta repo | ⚠ Dublikat |
| 3 | `apps/api/src/modules/erp/erp-camera.*` | ErpModule ichida — `/api/erp/camera-reports/...` va `/api/erp/cameras/...` | ⚠ Alohida prefix |
| 4 | `apps/api/src/modules/aisha/application/tools/` | AIsha vision tools — `analyze-camera-feed`, `get-camera-snapshot`, `get-machine-state-via-vision`, `list-available-cameras` | ✅ AIsha bilan ulangan |
| 5 | `apps/api/src/modules/ai-agents/qc/vision-qc.service.ts` | QC vision agent | ✅ Alohida xizmat |

### 1.2 Frontend yuzlari (3 alohida UI)

| Yuz | Joy | Sahifalar soni |
|---|---|---|
| **Legacy/main** | `artifacts/erp-dashboard/src/pages/camera-*.tsx` | ~40 fayl (alerts, dashboard, employees, employee-ratings, heatmap, machines, quality, reports, safety, settings, ai-analytics, …) |
| **Modern hub** | `artifacts/erp-dashboard/src/camera-ai-modern/` | 4 fayl (`CameraAIModernHub.tsx`, `CameraAnalysisWorkbench.tsx`, `CameraMissionEditor.tsx`, `api.ts`, `taskCatalog.ts`) |
| **Settings UI** | `artifacts/erp-dashboard/src/components/settings/camera/` | 2 fayl (`CameraAIPrompts.tsx`, `CameraTriggerRules.tsx`) |
| **IoT tablet** | `artifacts/erp-dashboard/src/pages/iot/` | 22 fayl — production dashboard, tablet, checklist, completion report, schedule, login |
| **IoT root** | `artifacts/erp-dashboard/src/pages/IoTDashboard.tsx` | 1 fayl + smoke test |
| **i18n** | `artifacts/erp-dashboard/src/locales/{uz,ru}/iot.json` | 2 fayl |

### 1.3 IoT controller endpoint xaritasi (`apps/api/src/modules/iot/presentation/`)

10 ta controller bor, jami ~110 ta endpoint:

| Controller | Prefix | Endpoint soni | Eng muhimlari |
|---|---|---|---|
| `iot-main.controller.ts` | `iot` | ~30 | `dashboard`, `alerts`, `machine-status`, `safety-violations`, `tablet/{orders,shift,sessions}`, `environment`, `temperature`, `humidity`, `pressure`, `vibration`, `gas-levels`, `noise-levels`, `production-metrics`, `oee`, `downtime`, `energy-consumption` |
| `iot-sensors-main.controller.ts` | `iot-sensors` | 11 | `dashboard`, `live`, `alerts`, `oee`, `:id/history`, `trends`, `predictive-maintenance` |
| `iot-sensors.controller.ts` | `iot` | 9 | CQRS — `devices`, `devices/:id/thresholds`, `devices/:id/readings`, `anomalies`, `sensors/:id/oee` |
| `iot-camera.controller.ts` | **`camera`** | 6 | `cameras`, `cameras/:id`, `cameras/:cameraId/zones` (CRUD) |
| `iot-camera-events.controller.ts` | **`camera`** | 8 | `camera-events`, `safety-violations`, `quality-defects-camera` (CRUD) |
| `camera-recognition.controller.ts` | **`camera`** | 6 | `recognition-stats`, `recognition-logs/:id/{flag,unflag}` |
| `camera-ai.controller.ts` | `camera-ai` | 10 | `summary`, `safety-trends`, `quality-analysis`, `productivity-scores`, `machine-utilization`, `anomaly-detection`, `cameras/:id/{prompt,trigger-rules}` |
| `camera-dashboard.controller.ts` | `camera-dashboard` | 9 | `stats`, `pending-alerts`, `recent-events`, `top-employees`, `quality-stats`, `attendance-stats`, `production-stats`, `safety-stats`, `weekly-trend` |
| `camera-heatmap-reports.controller.ts` | `camera-heatmap`, `camera-reports` | 8 | `data`, `employees`, `employee/:id`, `generate-pdf`, `generate-excel` |
| `camera-alerts.controller.ts` | **9 ta alohida `@Controller`** | ~22 | `camera-alerts`, `camera-settings`, `cameras`, `camera-employee-ratings`, **`ai-camera`**, `machine-status-current`, `machine-status-logs`, `safety-violations`, `employee-productivity`, `quality-defects-camera` |

### 1.4 Standalone CameraModule (`apps/api/src/modules/camera/`)

| Controller | Prefix | Endpoint soni |
|---|---|---|
| `camera.controller.ts` | **`camera`** | 5 (`status`, `list`, `events`, `zones`, `violations/:id/auto-discipline`) |
| `ai-camera.controller.ts` | **`ai-camera`** | 4 (`dashboard`, `events`, `alerts`, `analyze-by-missions`) |

### 1.5 DB sxema jadvallari

**Kamera (9 ta jadval):**
- `cameras` — kamera ro'yxati (`schema-misc-iot.ts:42`)
- `camera_zones` — kamera zonalari
- `camera_events` — voqealar
- `camera_alerts` — ogohlantirishlar
- `camera_safety_violations` — xavfsizlik buzilishlari
- `camera_quality_defects` — sifat nuqsonlari
- `camera_ai_configs` — AI sozlamalari
- `camera_employee_reports` — xodim hisobotlari (`schema-ext-b-3.ts:83`)
- `camera_logs` — loglar (`schema-ext-b-3.ts:91`)

**IoT (5 ta + 2 ta stub dublikat):**
- `iot_sensors` (`schema-ext-b-2.ts:259`) + stub dublikat `schema-compat-4.ts:21`
- `iot_sensor_readings`
- `iot_alerts` + stub dublikat `schema-misc-app-b.ts:156`
- `sensor_devices` (`schema-misc-iot.ts:12`)
- `sensor_readings`

---

## 2. ASOSIY MUAMMOLAR

### 🔴 P1 — Route collision (haqiqiy bag)

**`@Controller('camera')` 4 marta declare qilingan:**
1. `modules/camera/camera.controller.ts:18`
2. `modules/iot/presentation/iot-camera.controller.ts:38`
3. `modules/iot/presentation/iot-camera-events.controller.ts:38`
4. `modules/iot/presentation/camera-recognition.controller.ts:24`

NestJS controller'larni bir nechta joydan **birlashtirmaydi** — bir xil pathga (masalan, `/api/camera/events`) so'rov kelganda, NestJS ro'yxatga olish tartibiga qarab BIRTASIni tanlaydi va boshqalar **butunlay olib tashlanadi**. Bu route'lar:

| Yo'l | Hozir qaysiga ketishi mumkin |
|---|---|
| GET `/api/camera/events` | Ehtimol `iot-camera-events.controller` (`camera-events` yo'qoldi) |
| POST `/api/camera/events` | `iot-camera-events.controller` |
| GET `/api/camera/cameras` | `iot-camera.controller` |
| GET `/api/camera/recognition-stats` | `camera-recognition.controller` |
| GET `/api/camera/status` | `camera.controller` (standalone) — **ehtimol ishlamaydi** |
| GET `/api/camera/list` | `camera.controller` (standalone) — **ehtimol ishlamaydi** |
| GET `/api/camera/zones` | `camera.controller` (standalone) |

**Bashorat:** standalone `CameraModule` route'lari `IotModule`'dagi controller'lardan keyin ro'yxatga olinadi, lekin NestJS aniq xato bermaydi — quietly overrides. Frontend'da kutilmagan 404 yoki noto'g'ri javoblar.

**`@Controller('ai-camera')` 2 marta:**
1. `modules/camera/ai-camera.controller.ts:18`
2. `modules/iot/presentation/camera-alerts.controller.ts:143`

### 🔴 P2 — Duplikat camera-alerts endpoints

`iot/presentation/camera-alerts.controller.ts` faylida **9 ta `@Controller` deklaratsiya** bitta faylda — antiPattern (boshqa Rule 16 hisobi). Bu fayl 220+ qator va architecture qoidasiga ko'ra bo'linishi kerak edi, lekin Agent 3 buni o'tkazib yuborgan.

Yana bu fayl boshqa controller fayllar bilan dublikat path beradi:
- `@Controller('safety-violations')` (qator 186) — `iot-camera-events.controller.ts:74` ham `safety-violations` ishlatadi
- `@Controller('quality-defects-camera')` (qator 214) — `iot-camera-events.controller.ts:96` ham shu

### 🔴 P3 — Schema dublikat (real + stub)

`iot_sensors` va `iot_alerts` jadvallari **ikki marta** declare qilingan:
- `schema-ext-b-2.ts:259` (haqiqiy)
- `schema-compat-4.ts:21` (stub)

Drizzle bir xil nomli ikkita pgTable bilan ishlamaydi — runtime'da paniklashi yoki nuqsonli SELECT'lar berishi mumkin. Kompilyatorlik ishlasa-da, semantik xavfli.

### 🟡 P4 — ErpCamera moduli aralash

`erp-camera.controller.ts` `@Controller('erp')` ostida `camera-reports/...` route'lariga ega — bu hujjat tartibida ham, modulda ham noto'g'ri yondashuv:
- Frontend `/api/erp/camera-reports/...` ga so'rov yuboradi
- Lekin IoT module'da `/api/camera-reports/...` ham bor (legacy)
- Hech kim qaysi birini ishlatish kerakligini bilmaydi

### 🟡 P5 — Frontend 3 ta turli UI

Frontend kamera/IoT uchun **3 ta alohida UI** mavjud:
1. `pages/camera-*.tsx` — 40 ta legacy fayl (eski stable UI)
2. `camera-ai-modern/` — yangi hub UI (alohida `api.ts`, `taskCatalog.ts`)
3. `components/settings/camera/` — sozlamalar UI

Birlashtirish (yoki har birini alohida saqlash) qaror qilinmagan. Foydalanuvchi sidebar'dan qaysiga kirishini ham tushunmaydi.

### 🟡 P6 — Frontend IoT tablet endpoints fragmentatsiya

Frontend chaqiradi:
- `/api/iot/tablet/orders` → `iot-main.controller.ts:232` ✅
- `/api/iot/tablet/shift` → `iot-main.controller.ts:241` ✅
- `/api/iot/tablet/sessions` → `iot-main.controller.ts:244` ✅
- `/api/iot/tablet/defect-reasons` → **`general-legacy-b.controller.ts:134`** ❌ (boshqa modulda!)
- `/api/iot/tablet/equipment` → **topilmadi** ❌
- `/api/iot/tablet/worker-schedule` → **topilmadi** ❌
- `/api/iot/downtime-reason-codes` → **topilmadi** ❌
- `/api/iot/production-sessions` → **topilmadi** ❌

Bu IoT planshet UI (zavoddagi operator tablet'lari) qisman buzilgan.

### 🟢 P7 — Backend stubs (deferred, OK)

`iot-main.controller.ts` da bir nechta endpoint `return [];` stub qaytaradi (oldingi commit'da konvertatsiya qilingan). Bu hozircha OK — frontend bo'sh holatni ko'rsatadi.

---

## 3. TUZATISH REJASI — bosqichli

### 🎯 FAZA A — Route collision tozalash (P1, P2) — **2-3 soat**

**Maqsad:** har bir URL pathga aniq bir controller mas'ul.

#### A.1 Standalone `CameraModule`'ni o'chirib tashlash (yoki boshqa nom berish)
`modules/camera/` butunlay olib tashlash kerak — uning 9 ta endpoint'i (`status`, `list`, `events`, `zones`, `analyze-by-missions`, `dashboard`, `events`, `alerts`) IoT modulida allaqachon bor (ba'zilari).

Variant **A1-O'CHIR** (tavsiya etiladi):
1. `modules/camera/camera.controller.ts` — `/api/camera/status` va `/api/camera/list` route'larini `IotCameraController`'ga ko'chirish (yoki frontend o'zgartirish — `cameras` allaqachon bor)
2. `modules/camera/ai-camera.controller.ts` — `/api/ai-camera/{dashboard,events,alerts,analyze-by-missions}`'ni `iot/camera-alerts.controller.ts:143` AiCameraController'ga birlashtirish
3. `CameraModule`'ni AppModule'dan olib tashlash
4. Eski papkani tarixiy archivga ko'chirish

#### A.2 ErpCamera'ni nomini o'zgartirish
`erp-camera.controller.ts`'ning `@Controller('erp')` prefiksi cherry-pick:
- `erp/camera-reports/employees` → `camera-reports/employees` (camera-heatmap-reports.controller.ts'ga birlashtirish)
- `erp/cameras/live-detections` → `camera-recognition` modulida joylashtirish
- `erp/team-analytics/*` → alohida `team-analytics` controllerga olib chiqish

#### A.3 `iot/presentation/camera-alerts.controller.ts`'ni bo'lish
Bu fayl 220+ qator va 9 ta @Controller saqlaydi. Bo'lish:
- `camera-alerts.controller.ts` — faqat `@Controller('camera-alerts')` va `@Controller('camera-settings')`
- `cameras.controller.ts` — `@Controller('cameras')` 
- `camera-employee-ratings.controller.ts` — alohida
- `ai-camera-missions.controller.ts` — `@Controller('ai-camera')`
- `machine-status.controller.ts` — `@Controller('machine-status-current')` + `@Controller('machine-status-logs')`
- `quality-defects-camera.controller.ts` — alohida
- `safety-violations` va `employee-productivity` — `iot-main`'ga ko'chiriladi (allaqachon u yerda bo'lishi mumkin)

### 🎯 FAZA B — DB schema tozalash (P3) — **1 soat**

**Maqsad:** har bir table bir marta declare qilingan.

#### B.1 Stub jadval dublikatlarni olib tashlash
- `schema-compat-4.ts:21` `iotSensors` stub'ni olib tashlash — `schema-ext-b-2.ts:259` da `iot_sensors` real versiya bor
- `schema-misc-app-b.ts:156` `iotAlerts` stub'ni olib tashlash — `iot_alerts` real `schema-ext-b-2.ts`'da
- Bu stub'larni ishlatadigan har qanday joyni real import'ga o'tkazish

#### B.2 Drizzle export birlashtirish
`apps/api/src/shared/db/index.ts` (yoki barrel) faqat real jadvallarni eksport qilsin:
```ts
export { iot_sensors, iot_sensor_readings, iot_alerts } from './schema-ext-b-2';
export { sensor_devices, sensor_readings, cameras, camera_zones, camera_events,
         camera_alerts, camera_safety_violations, camera_quality_defects,
         camera_ai_configs } from './schema-misc-iot';
export { camera_employee_reports, camera_logs } from './schema-ext-b-3';
```

### 🎯 FAZA C — Yetishmayotgan IoT tablet endpoint'larini yaratish (P6) — **2-3 soat**

**Maqsad:** frontend tablet UI ishlasin.

| Endpoint | Joy | Holat |
|---|---|---|
| `GET /api/iot/tablet/defect-reasons` | `general-legacy-b.controller.ts:134` | ⚠ Ko'chirish kerak `iot-main`'ga |
| `GET /api/iot/tablet/equipment` | yo'q | ❌ Yaratish kerak — `tabletEquipment(@Query workerId)` |
| `GET /api/iot/tablet/worker-schedule` | yo'q | ❌ Yaratish — `tabletWorkerSchedule(@Query workerId)` |
| `GET /api/iot/downtime-reason-codes` | yo'q | ❌ Yaratish — `getDowntimeReasonCodes()` (static lookup) |
| `GET /api/iot/production-sessions` | yo'q | ❌ Yaratish — `getProductionSessions(@Query workerId)` |

Har biri DB jadvalga ulansa yaxshi, hozircha xavfsiz bo'sh javob (Rule 10).

### 🎯 FAZA D — Frontend yagona kamera UI (P5) — **4-6 soat**

**Maqsad:** foydalanuvchi qaysi UI'dan foydalanishni tushunsin.

Tavsiya:
1. **`camera-ai-modern/`** (yangi) — asosiy interfeys, **default** sahifa qiling
2. **`pages/camera-*.tsx`** (legacy) — saqlash, lekin sidebar'da "Eski versiya" ostida ko'chirish
3. **`components/settings/camera/`** — sozlamalar dialogi ichida saqlash

VA: sidebar `constants-security-infra.ts:77`'da "Sifat Nazorati" → `camera-quality` link bor — bu boshqa "Sifat Nazorati"'dan (`qc/dashboard`) farqlanishi uchun nomini "Kamera Sifati" qilish kerak.

### 🎯 FAZA E — Vision/AI integratsiya (real LLM) — **6-8 soat**

**Maqsad:** AIsha vision tools backend chat bilan ulansin.

Hozir AIsha vision tools (`analyze-camera-feed.tool.ts`, `get-camera-snapshot.tool.ts`, `get-machine-state-via-vision.tool.ts`) backend'da kod sifatida mavjud, lekin chat controller'iga ulanmagan. Plan:
1. ClaudeService'ni AishaChatController'ga inject qilish
2. Tool registry sozlamoq (5 ta kamera tool + boshqa 20 ta tool)
3. Tool result'larni SSE stream orqali ChatPanel'ga uzatish
4. Foydalanuvchi "Linia 3 da nima bo'lyapti?" deganda — AIsha kamerani ko'rib javob bera oladi

### 🎯 FAZA F — Schema kengaytirish (kelajak) — **2-3 soat**

**Yetishmayotgan jadvallar (hozircha bo'sh stub):**
- `iot_downtime_reason_codes` — to'xtash sabablari ro'yxati
- `iot_tablet_equipment_assignments` — operator-uskuna bog'lanishi
- `iot_worker_schedules` — kunlik smena rejasi
- `iot_production_sessions` — operator ish sessiyalari

Har biriga Drizzle pgTable yaratish, migration yozish, repository + service + controller.

---

## 4. Prioritet va xarakat tartibi

| Faza | Prioritet | Vaqt | Effekt |
|---|---|---|---|
| **A** Route collision | 🔴 KRITIK | 2-3 soat | Yashirin bug'lar yo'qoladi |
| **B** Schema dublikat | 🔴 MUHIM | 1 soat | Drizzle xavfsiz bo'ladi |
| **C** Tablet endpoints | 🟠 HIGH | 2-3 soat | Zavod operatorlari tablet'i ishlaydi |
| **D** Frontend yagona UI | 🟠 HIGH | 4-6 soat | UX yaxshilanadi |
| **E** AIsha vision | 🟡 MEDIUM | 6-8 soat | Yangi xususiyat |
| **F** Schema kengaytirish | 🟢 LOW | 2-3 soat | Faza C bilan birga ham qilish mumkin |

**Jami:** 17-24 soat ish — 2-3 kunlik sprint.

---

## 5. Tavsiya etilgan boshlash tartibi

**Bugun (2-3 soat):** Faza A — route collision  
**Ertaga (4 soat):** Faza B + C — schema clean + tablet endpoints  
**Keyingi kuni (6 soat):** Faza D + (vaqt bo'lsa) E boshlanishi

Bu rejani ko'rib chiqing va qaysi fazadan boshlashni xohlaysiz?

Yoki barchasini ketma-ket avtomatik bajarish — har bir fazadan keyin commit + verify qilib, regress yo'qligini tasdiqlashim mumkin.
