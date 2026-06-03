# IoT / SENSOR / TABLET — CHUQUR ASL HOLAT (agent11-iot-sensor, 2026-06-02)

> **FAQAT TAHLIL** — hech narsa o'zgartirilmadi. Kod (Read/Grep) + jonli DB (`europrint`@127.0.0.1:5432) + mavjud hisobotlar.
> Bu hisobot `docs/iot-tablet-asl-holat-2026-06-02.md` ni OQIB, tasdiqlab, KENGAYTIRADI (yangi dalillar + fayl:satr).
> Vizyon: ishchi IoT planshetda material skaner qiladi (buyurtmaga sarf) → yarim tayyorni keyingi sexga o'tkazadi;
> 3 sensor (issiqlik/bosim/vibratsiya) mexaniklarga real-time; predictive maintenance.

---

## 0. QISQA HUKM (1 jumlada)
IoT — **boy skelet, sensor O'QISH yo'li to'liq real (threshold bilan), lekin: (a) hech qanday sensor/data/ingest yo'q (8 ta IoT jadval 0 qator), (b) tablet operatsion oqimi 501 stub, (c) sensor YOZISH (`POST devices/:id/readings`) DB'ga yozmaydi — in-memory aggregate, (d) WebSocket gateway o'lik (chaqiruvchi yo'q), (e) anomaliya DB'ga yozilmaydi, (f) operator akkaunti YO'Q (0 employee↔user) → planshetga kirib bo'lmaydi, (g) predictive engine (z-score) bor lekin boshqa jadvaldan (`mes_telemetry`) o'qiydi va 3 sensorga ulanmagan.**

**Umumiy IoT tayyorlik: ~25-30%** (struktura ~65%, jonli funksiya ~12%). Quyida har biri dalillangan.

---

## 1. IoT MODUL TUZILMASI (backend)

`apps/api/src/modules/iot/` — **58 fayl**. 1 modul (`iot.module.ts`), **9 controller IoT-uchun** (+ kamera). Boshqa modullarda yana IoT-route'lar bor (WMS material-kits, MES sessions/downtime, general-legacy IoT).

Registratsiya: `iot.module.ts:97-127` — controllers (18) + providers. **`IotGateway` (WebSocket) ro'yxatdan O'TMAGAN** (providers ichida yo'q — pastda 4.5-band).

**Controllerlar (`@Controller('iot')` va boshqa):**
| Controller | Prefix | Holat |
|---|---|---|
| `iot-tablet.controller.ts` | `iot` | login/sos/orders/equipment/schedule REAL; qolgani 501 |
| `iot-main.controller.ts` | `iot` | dashboard/environment/sensors/oee REAL; 3 ta stub |
| `iot-sensors.controller.ts` | `iot` | devices CRUD + readings (CQRS) — **readings YOZMAYDI** |
| `iot-sensors-main.controller.ts` | `iot-sensors` | dashboard/live/oee/trends/history REAL; predictive 501 |
| `iot-alerts.controller.ts` | `iot` | alerts (real DB) |
| `iot-camera*.controller.ts` ×6 | `iot`/`camera-ai` | kamera config/analytics REAL (AI inference EMAS) |
| `iot-material-kits.controller.ts` (WMS) | `iot` | material-kit generate/items REAL |
| `iot-enhanced.controller.ts` (WMS) | `iot` | material-kits dublikat |

---

## 2. TABLET OPERATSION ENDPOINTLAR (ishchi ish-oqimi)

`iot-tablet.controller.ts` — **klassda `@UseGuards(JwtAuthGuard, RolesGuard)`**, lekin 3 ta GET (`tablet/orders|worker-schedule|equipment`) `@Public()` + `@UseGuards(TabletTokenGuard)` (security pentest #1 tuzatgan: `x-tablet-token` JWT majburiy).

| Endpoint | Fayl:satr | Holat | Dalil |
|---|---|---|---|
| `POST tablet/login` | iot-tablet.controller.ts:115 | ✅ REAL | `IotTabletService.login()` (iot-tablet.service.ts:59) bcrypt verify + JWT 8h |
| `GET tablet/orders` | :60 | ✅ REAL | `findTabletOrders` (drizzle-iot-tablet.repo.ts:150) production_orders JOIN |
| `GET tablet/worker-schedule` | :72 | ✅ REAL | `findWorkerSchedule` (:197) shift_assignments JOIN |
| `GET tablet/equipment` | :84 | ✅ REAL | `findTabletEquipment` (:102) equipment JOIN |
| `POST tablet/sos-alert` | :126 | ✅ REAL | `insertSosAlert` (:237) → sos_alerts INSERT + `SosAlertRaisedEvent` |
| `POST tablet/handover` (→keyingi sex) | :147 | ❌ 501 STUB | `notImplemented(...)` |
| `GET tablet/shift` | :96 | ❌ 501 STUB | |
| `GET tablet/sessions` (+POST) | :101,:106 | ❌ 501 STUB | |
| `POST material-kit-items/:id/scan` (+PATCH) — **skaner→sarf** | :156,:164 | ❌ 501 STUB | **asosiy ishchi amali** |
| `POST production-sessions` | :176 | ❌ 501 STUB | |
| `GET production-sessions/:id/crew` | :184 | ❌ 501 STUB | |
| `POST production-sessions/:id/start\|stop\|defect\|evaluation\|material-return\|inline-qc` | :190..:225 | ❌ 501 STUB | 6 ta |

**Hukm:** Ishchining HAQIQIY ish-oqimi — **session yaratish, start/stop, skaner→sarf, brak, inline-QC, material-return, smena topshirish (handover), keyingi sexga o'tkazish** — **hammasi 501 stub**. Faqat **login + o'qish + SOS** ishlaydi (5/18 endpoint).

### 2.1 FE bu stublarni chaqiradi (uzilgan shartnoma)
`useIoTTablet.ts` 11 ta `useMutation` — hammasi stub endpoint'larga:
- `createSession` → `POST /iot/production-sessions` (501) — useIoTTablet.ts:131
- `scanMaterial` → `POST /iot/material-kit-items/:id/scan` (501) — :152 (try/catch bilan, xato yutiladi → UI "skanlandi" deydi lekin BE yozmaydi)
- `startSession`/`stopSession`/`reportDefect`/`submitInlineQC` → production-sessions/* (501) — :186,:200,:218,:260
- `submitHandover` → `POST /iot/tablet/handover` (501) — :237
- `reportDowntime` → `POST /iot/downtime-events` (BU REAL — MES'da, 5.2-band)
- `startProductionFromChecklist` → crew + start (501) — :172

**Eslatma:** `applyKitChecklist` (useIoTTablet.ts:105) `POST /iot/material-kits/generate` chaqiradi — bu **REAL** (WMS, 5.3-band), faqat per-item SCAN stub.

---

## 3. SENSOR O'QISH YO'LI (issiqlik / bosim / vibratsiya) — REAL, threshold bilan

### 3.1 Endpointlar — REAL DB so'rovlar
`iot-main.controller.ts`:
- `GET iot/temperature` (:152), `iot/pressure` (:168), `iot/vibration` (:174), `iot/humidity` (:158), `iot/gas-levels` (:185), `iot/noise-levels` (:193) → hammasi `svc.getEnvironmentData(type, ...)` → `findEnvironmentData` (drizzle-iot-main.repo.ts:62) — `iot_sensors WHERE type=$1` (haqiqiy parametrli so'rov).
- `GET iot/sensors` (:247), `iot/telemetry` (:254), `iot/environment` (:105), `iot/oee` (:212).

`iot-sensors-main.controller.ts` (`@Controller('iot-sensors')`):
- `GET iot-sensors/dashboard|live|alerts|oee|trends|:id/history` — hammasi `IotSensorsExtendedService` → `DrizzleIotSensorsRepo` REAL.
- `GET iot-sensors/live` (:63) — **threshold-aware**: `drizzle-iot-sensors.repo.ts:31` LATERAL JOIN oxirgi o'qish + `CASE WHEN value > max_threshold THEN 'critical' WHEN value > min_threshold THEN 'warning' ELSE 'normal'` → `alert_level`. **3 sensor uchun aynan kerakli mantiq tayyor.**

### 3.2 Sensor jadval struktura — 3 sensor uchun TAYYOR (DB tasdiq)
`iot_sensors` ustunlari (DB'dan, information_schema):
`id, sensor_code, name, **type** (varchar NOT NULL), machine_id (int), location, **unit** (varchar), **min_threshold** (numeric), **max_threshold** (numeric), is_active, last_reading (numeric), last_reading_at, created_at, device_code, status, thresholds (text)`
→ **issiqlik/bosim/vibratsiya = `type` ustunidagi 3 qiymat. Yangi jadval/migration KERAK EMAS.**

`iot_sensor_readings`: `id, device_id, pulse_count, reading_time, session_id (int), is_processed, sensor_id (int), value (numeric), status, recorded_at, unit, created_at` → o'qishlar uchun tayyor.

### 3.3 ❌ Lekin data yo'q — hamma IoT jadval 0 qator (DB tasdiq)
```
iot_sensors=0   iot_sensor_readings=0   iot_alerts=0   iot_devices=0
sensor_devices=0  sensor_readings=0  mes_telemetry=0  sos_alerts=0
cameras=0  camera_events=0  equipment=0  work_centers=0
machine_status_logs=0  machine_crews=0  machine_tasks=0
```
**Seed fayl YO'Q** (grep `iotSensors|iot_sensors` `*seed*` → 0 natija). Ya'ni 0 sensor = qurilish bosqichi, demo data ham yo'q.

### 3.4 🔴 YANGI BUG — sensor YOZISH DB'ga yozmaydi
`POST iot/devices/:id/readings` (iot-sensors.controller.ts:118) → `RecordSensorReadingCommand` → **`RecordSensorReadingHandler` (record-sensor-reading.handler.ts:24)**:
- `SensorReading.create()` — faqat **in-memory aggregate** (sensor-reading.aggregate.ts:63, `uuid()` id).
- `detectAnomaly(value > 90)` → agar anomaliya bo'lsa Telegram + event.
- **`return Ok(reading.id)`** — **hech qanday `INSERT INTO iot_sensor_readings` YO'Q.**

Real yozuvchi metod **BOR lekin chaqirilmaydi**: `DrizzleSensorRepo.saveReading()` (drizzle-sensor.repo.ts:113) — `INSERT INTO iot_sensor_readings ... RETURNING ...` (:122). Grep `saveReading` → faqat 2 ta: interfeys (i-sensor.repo.ts:29) + repo ta'rifi. **Hech bir handler/service chaqirmaydi → o'lik.**

→ **Demak: `POST devices/:id/readings` UUID qaytaradi lekin DB'ga YOZMAYDI** (Qoida 10 buzilishi — soxta muvaffaqiyat). Sensor o'qishini qabul qiluvchi yagona endpoint ham aslida yozmaydi.

**TASKIDDA:** `POST iot/devices` (registerDevice, :82) → `RegisterDeviceHandler` → `SENSOR_REPO.registerDevice()` → **REAL INSERT** `iot_sensors` (drizzle-sensor.repo.ts:45). Ya'ni **device REGISTRATSIYA real, lekin reading YOZISH stub** — assimetrik.

### 3.5 🔴 Anomaliya DB'ga yozilmaydi
`AnomalyDetectedHandler` (anomaly-detected.handler.ts:17) — faqat `logger.error(...)`. **`iot_alerts`ga INSERT yo'q.** Grep `INSERT INTO iot_alerts` → 0 natija (faqat migrations-drift'da CREATE TABLE). Ya'ni `iot_alerts` o'qish so'rovlari (drizzle-iot-main.repo.ts:25, drizzle-iot-sensors.repo.ts:44) hech qachon handler-yaratgan qator topmaydi.

### 3.6 CQRS update-thresholds — REAL
`PATCH iot/devices/:id/thresholds` (iot-sensors.controller.ts:103) → `UpdateDeviceThresholdsCommand` → `DrizzleSensorRepo.updateThresholds()` (drizzle-sensor.repo.ts:51) — **REAL UPDATE** `iot_sensors SET min/max_threshold`. Ya'ni threshold sozlash ishlaydi.

---

## 4. WEBSOCKET / REAL-TIME (mexaniklarga jonli)

### 4.5 🔴 `IotGateway` o'lik (defined, but no producer + ro'yxatdan o'tmagan)
`iot.gateway.ts` — `@WebSocketGateway({namespace:'/iot'})`, `pushSensorUpdate()` (:73), `pushEquipmentAlert()` (:78), JWT auth handshake (:43).
- **Grep `pushSensorUpdate|pushEquipmentAlert|IotGateway` → faqat 1 fayl (o'zi).** Hech kim chaqirmaydi.
- Hujjatda yozadi (iot.gateway.ts:8): *"Data flow: iot-sensor-cron.service.ts → emit('sensor:update')"* — lekin **`iot-sensor-cron.service.ts` MAVJUD EMAS** (grep → 0).
- **`iot.module.ts` providers'ida `IotGateway` YO'Q** (97-127) → NestJS uni instansiyalamaydi → WebSocket server umuman ishga tushmaydi.

→ **Real-time push (jonli sensor → mexanik ekrani) 0%.** Faqat FE poll qiladi (useIoTTabletData refetchInterval 5-60s).

**Eslatma:** `mes.gateway.ts` (alohida) bor — MES uchun. IoT WebSocket esa o'lik.

---

## 5. MES / ISHLAB CHIQARISH BOG'LANISHI + qo'shimcha IoT endpointlar

### 5.1 FE chaqiradigan, lekin BOSHQA modulda joylashgan IoT endpointlar
| FE chaqiruvi | Joylashuv | Holat |
|---|---|---|
| `GET iot/production-sessions` | general-legacy-b.controller.ts:149 | ✅ REAL (LegacyIotService, legacy-iot.service.ts:55, `production_sessions` raw SQL, 0 qator → []) |
| `GET iot/downtime-events` | general-legacy-b.controller.ts:154 | ✅ REAL (legacy-iot.service.ts:68, Drizzle `downtime_events`) |
| `GET iot/dashboard/stats` | general-legacy-b.controller.ts:142 | ✅ REAL (legacy-iot.service.ts:27, `equipment` FILTER agg; oeeAvg=78.5 hardcoded) |
| `GET iot/tablet/defect-reasons` | general-legacy-b.controller.ts:159 | ⚠️ REAL+fallback (legacy-iot.service.ts:76, `defect_types` yo'q bo'lsa 3 ta hardcoded) |
| `GET iot/downtime-reason-codes` | iot-main.controller.ts:269 | ❌ 501 STUB |

**Eslatma:** `iot-tablet.controller.ts:171-173` izohi tasdiqlaydi: GET `iot/production-sessions` general-legacy-b'da — Fastify dublikat GET'ni rad qiladi, shuning uchun tablet controller'da faqat POST.

### 5.2 MES downtime — REAL
`mes-maintenance.controller.ts`: `GET/POST downtime-events` (:125,:133), `downtime-reasons` (:118), `sos/history` (:111) → `MesMaintenanceService` REAL. FE `reportDowntime` (useIoTTablet.ts:280) shu real endpointga boradi.

### 5.3 Material-kit pipeline — REAL (WMS), faqat per-item SCAN stub
`iot-material-kits.controller.ts` (`@Controller('iot')`, WMS modulida) → `IotEnhancedService`:
- `POST iot/material-kits/generate` (:63) ✅ REAL
- `GET iot/material-kits/:id` (:78), `/items` (:111) ✅ REAL
- `PATCH iot/material-kits/:id/prepare` (:88), `/ready` (:100) ✅ REAL
- FE `WarehouseMaterialKits.tsx` + `applyKitChecklist` shularni chaqiradi.

→ **Material-kit YARATISH (ombor) real, lekin planshetda per-item SKANER→sarf (`material-kit-items/:id/scan`) 501** (2-band). Ya'ni "komplekt tayyorlandi" ishlaydi, "ishchi har bir materialni skaner qildi → sarfga yozildi" ishlamaydi.

### 5.4 ❌ MES bo'sh: 0 sex, 0 marshrut
`work_centers=0`, `production_orders=0`, `production_sessions=0`, `downtime_reason_codes=0`, `products=0`, `shift_types=0`. Buyurtmaning sexma-sex o'tishi kuzatilmaydi (struktura bor, data + tablet operatsiyasi yo'q).
`shift_assignments=30`, `batch_lots=21` — yagona to'ldirilgan ishlab-chiqarish jadvallari.

---

## 6. PREDICTIVE MAINTENANCE — engine BOR, lekin 3 sensorga ULANMAGAN

### 6.1 Real anomaly engine (z-score) mavjud
`ai-agents/mes/mes-monitor.service.ts` — `AiMesMonitorService`:
- 30s cron (`onModuleInit`, :66) → `runTelemetryCheck` (:78).
- z-score rolling-window (`computeZScore`, :169), severity NORMAL/ALERT/AUTO_STOP (:178).
- AUTO_STOP → `mes_work_orders SET status='PAUSED'` (:202) + `mes.machine.emergency_stop` event.
- ALERT → HITL escalation event (:211). AI decision log (:218).
- OEE kalkulyator (`calcOee`, :98).

### 6.2 🔴 Lekin boshqa jadvaldan o'qiydi va 3 sensorga ulanmagan
- `runTelemetryCheck` **`FROM mes_telemetry`** (mes-monitor.service.ts:80) o'qiydi.
- **`mes_telemetry=0` qator + YOZUVCHI YO'Q** (grep `INSERT INTO mes_telemetry` → 0; faqat migrations-drift CREATE TABLE — memory `project_api_healthcheck_and_mes_telemetry.md` bilan mos: "table created, no writer yet").
- IoT sensor o'qishlar `iot_sensor_readings`ga (yozilsa edi) ketardi, **`mes_telemetry`ga EMAS**. Ikki tizim **uzilgan**.
- `iot-sensors-main.controller.ts:121` `GET predictive-maintenance` → **501 STUB** (engine'ga ulanmagan).

→ **Predictive maintenance: dvigatel (z-score, auto-stop) tayyor, lekin (a) data yo'q, (b) IoT 3 sensordan oziqlanmaydi (`mes_telemetry` vs `iot_sensor_readings` ajralgan), (c) FE endpoint 501.** Ulash = `iot_sensor_readings` → engine ko'prik + `mes_telemetry` writer YOKI engine'ni `iot_sensor_readings`ga qaratish.

---

## 7. AI KAMERA MODULI — config/analytics REAL, computer-vision YO'Q

- `camera-ai.controller.ts` (`@Controller('camera-ai')`): summary/safety-trends/quality-analysis/productivity/machine-utilization/anomaly-detection/cameras/trigger-rules/prompt → `CameraAiService` → `DrizzleCameraAiRepo` (REAL DB agregatlar `cameras`/`camera_events`/`camera_safety_violations` ustidan).
- `PUT camera-ai/cameras/:id/prompt` (:108), `/trigger-rules` (:128) — **AI prompt + trigger qoidalarini SAQLAYDI** (camera-ai.service.ts:46, JSON config upsert).
- `iot-camera.service.ts` — kamera/zona CRUD (RTSP url, zone coordinates).
- **🔴 Haqiqiy CV/LLM inference YO'Q:** kadr tahlili, yuz aniqlash, AI model chaqiruvi kod ichida yo'q. Modul **tashqi vizyon tizimi `camera_events`/`camera_detections`ga yozishini KUTADI** (config + agregatsiya qatlami).
- `cameras=0`, `camera_events=0` → demo data ham yo'q.
- FE: `CameraAIModernHub`, `CameraAIAnalytics`, `CameraLiveMonitoring`, `camera-*` (20+ sahifa) — boy UI, lekin data yo'q + AI inference yo'q.

**Hukm:** AI kamera = **konfiguratsiya + hisobot skeleti** (prompt/zona/trigger saqlaydi), **real "AI ko'radi" qismi yo'q** (tashqi servis kerak).

---

## 8. OPERATOR / MEXANIK AKKAUNTLARI + MEXANIKLAR SAHIFASI

### 8.1 🔴 Hech kim planshetga kira olmaydi (ildiz sabab — DB tasdiq)
`IotTabletService.login()` (iot-tablet.service.ts:59) → `findWorkerByTabel` (drizzle-iot-tablet.repo.ts:69):
```sql
FROM employees e LEFT JOIN users u ON u.id = e.user_id ...
```
`password_hash` `users`dan keladi (e.user_id orqali). DB:
```
employees=30   employees_with_user=0  ← HAMMA employees.user_id = NULL
users=31  users_with_pwhash=31
```
→ **`worker.password_hash` HAR DOIM NULL → login.service.ts:69 `Err('Tabel raqami yoki parol noto'g'ri')`.** **0 employee↔user bog'lanish = HECH KIM kira olmaydi.** (Brauzer dalili oldingi hisobotda: KIRISH bosilsa ichkariga o'tmaydi — endi ildiz sababi aniq.)

### 8.2 🔴 Operator/mexanik ROLI provision qilinmagan
- `users.role` faqat: **director, manager, super_admin** (DB DISTINCT).
- Login role'ni `positions.name`dan oladi (`p.name AS role`, drizzle-iot-tablet.repo.ts:79), yo'q bo'lsa default `'operator'` (iot-tablet.service.ts:83).
- **96 positions ichida `mexanik/mehanik/mechanic/operator/texnolog/slesar` YO'Q** (DB ILIKE → 0). Ya'ni real operator/mexanik lavozimi ham yaratilmagan.

### 8.3 Mexaniklar sahifasi = IoT Planshetning O'ZI
- Alohida "MechanicWorkstation" sahifa **yo'q** (grep `mexanik|mechanic|MechanicWorkstation` FE → 0).
- Mexanik/operator interfeysi = **IoT Planshet PWA** (`IoTTablet.tsx`).
- FE rol-menyu konfigda **`operator` roli BOR**: `use-role-menus.ts:42` → `["mes/", "iot/tablet", "iot/live", "shift"]` (TZ-07). Ya'ni dizayn bor, lekin DB'da operator akkaunt/lavozim yo'q.

### 8.4 FE planshet UI — to'liq ko'p-ekranli workflow (lekin login + stub ortida)
`IoTTablet.tsx` (App.tsx:79 — `/iot/tablet` full-screen, dashboard chrome'siz):
- `IoTLoginPanel` → `IoTSchedulePanel` (smena/jihoz/buyurtma tanlash) → `IoTChecklistModal` (material skaner cheklisti) → `IoTProductionDashboard` (start/stop/brak/QC/SOS/downtime/handover) → `IoTCompletionReport`.
- Hooklar: `useIoTTablet` (11 mutation) + `useIoTTabletCore/Data/Alerts/Auth/Formatters` + offline queue (useIoTTabletAlerts.ts:78, localStorage) + QC reminder (har N dona, :62) + USB skaner (`useHardwareScanner.ts`) + kamera skaner.
→ **UI 90% yozilgan, lekin (a) login ortida (operator yo'q), (b) backend mutationlar 501.**

---

## 9. SKANER VA BARCODE

- FE: `useHardwareScanner.ts` (USB HID / Web Serial / klaviatura-wedge), `PosBarcodeScanner.tsx`, `BarcodeScanner.tsx`.
- POS barcode: `POST /api/pos/barcode/scan` — POS Monitor'da REAL (material kartochka qaytaradi).
- ❌ Tablet-maxsus skaner→sarf (`material-kit-items/:id/scan`) = 501 (3.4 + 2-band).
- `batch_lots=21`, `barcode_print_queue` bor; lekin order-QR↔paddon ota-bola ierarxiyasi tasdiqlanmadi.

---

## 10. DUBLIKAT / O'LIK KOD (yangi topilgan)

| Element | Holat | Dalil |
|---|---|---|
| `iot/sensors/` (SensorsService+Repository) | 🔴 O'LIK | hech bir modulda ro'yxatdan o'tmagan (grep faqat metadata.ts swagger); `@europrint/schemas iotSensors` ishlatadi (parallel 3-chi sensor impl) |
| `IotGateway` (WebSocket) | 🔴 O'LIK | provider emas + chaqiruvchi yo'q (4.5) |
| `DrizzleSensorRepo.saveReading()` | 🔴 O'LIK | chaqiruvchi yo'q (3.4) |
| `iot_devices`, `sensor_devices`, `sensor_readings` jadvallari | 🔴 O'LIK | IoT modul faqat `iot_sensors`/`iot_sensor_readings` so'raydi (grep modul ichida → 0); orphan duplikat, 0 qator |
| material-kits ×3 controller (wms-barcode `/warehouse`, iot-material-kits `/iot`, iot-enhanced `/iot`) | ⚠️ DUBLIKAT | iot-material-kits + iot-enhanced ikkalasi `@Controller('iot')` material-kits — Fastify yo'l to'qnashuvi xavfi (tekshirilsin) |
| `RecordSensorReadingHandler` vs `SENSOR_REPO` | ⚠️ assimetrik | handler aggregate-only, repo real (3.4) |

---

## 11. XAVFSIZLIK (IoT-specific, security-pentest bilan mos)

- `iot-tablet.controller.ts` 3 GET `@Public()`+`TabletTokenGuard` — pentest #1 tuzatgan (token majburiy). ✅
- `iot-sensors.controller.ts:44-46` — `@UseGuards(RolesGuard)` bor, `JwtAuthGuard` YO'Q, `@Public` ham yo'q → **global JwtAuthGuard (app.module.ts:194) himoya qiladi** (pentest tasdiqlagan global guard). `@Roles('operator','technologist','super_admin')`.
- `iot.gateway.ts` JWT handshake bor (:43) — lekin gateway o'lik (ishlamaydi).
- SOS `@Public` (iot-tablet.controller.ts:127) — ataylab (panic tugma fail-closed bo'lmasligi uchun, iot-tablet.controller.ts:130 izoh).

---

## 12. XULOSA — IoT necha %, 3 sensor uchun nima kerak

### Tayyorlik jadvali
| Jihat | % | Izoh |
|---|---|---|
| Struktura (modul, controller, jadval, FE UI, hooklar) | ~65% | ko'p yozilgan |
| Sensor O'QISH yo'li (temperature/pressure/vibration + threshold) | ✅ ~85% | endpoint + LATERAL + alert_level REAL, faqat data yo'q |
| Sensor YOZISH (ingest) | 🔴 ~10% | `POST readings` DB'ga yozmaydi (3.4); real `saveReading` o'lik |
| 3 sensor schema (type/unit/min-max) | ✅ TAYYOR | yangi jadval kerak emas (3.2) |
| Tablet operatsion (session/scan→sarf/handover/QC) | 🔴 ~12% | 5/18 endpoint; qolgani 501 |
| WebSocket real-time (mexanikga jonli) | 🔴 0% | gateway o'lik (4.5) |
| Predictive maintenance | 🟠 ~40% | engine real, lekin `mes_telemetry`dan (bo'sh) o'qiydi, 3 sensorga ulanmagan, FE 501 (6) |
| AI kamera | 🟠 ~35% | config/analytics real, CV/LLM inference yo'q (7) |
| Operator/mexanik akkaunt | 🔴 0% | 0 employee↔user, 0 operator lavozim (8.1-8.2) |
| MES (sex/marshrut) | 🔴 ~5% | 0 work_center, 0 marshrut (5.4) |

**Umumiy IoT: ~25-30%.**

### "3 sensor (issiqlik/bosim/vibratsiya)" uchun ANIQ ish ro'yxati
Noldan QURISH EMAS — quyidagi integratsiya/ulash:
1. **Seed 3 sensor** → `iot_sensors`ga 3 qator (type=temperature/pressure/vibration, unit=°C/bar/mm·s⁻¹, min/max_threshold). Schema tayyor.
2. **🔴 Ingest yo'lini ULASH** — `RecordSensorReadingHandler`ni `SENSOR_REPO.saveReading()`ga ulash (hozir aggregate-only, DB'ga yozmaydi, 3.4). YOKI fizik sensordan MQTT/HTTP bridge → `iot_sensor_readings` INSERT.
3. **🔴 Anomaliya persist** — `AnomalyDetectedHandler`ga `INSERT INTO iot_alerts` qo'shish (hozir faqat log, 3.5).
4. **🔴 Real-time ULASH** — `IotGateway`ni providerга qo'shish + ingest'da `pushSensorUpdate()` chaqirish (hozir o'lik, 4.5) → mexanikga jonli.
5. **Predictive ULASH** — engine'ni `iot_sensor_readings`ga qaratish YOKI `mes_telemetry` writer qo'shish + `GET predictive-maintenance` 501'ni real qilish (6).
6. **UI** — `IotSensorsPage` (temperature/pressure/vibration ikonkalari bor, IotSensorsPage.tsx:40) + `iot-sensors/live` allaqachon tayyor; faqat data kelishi kerak.

### Mexaniklarga real-time + planshet uchun
7. **🔴 Operator akkaunt** — kamida 1 employee↔user bog'lash + operator lavozim/parol (8.1-8.2) → planshetga kirish.
8. **Tablet operatsion endpoint'larni real qilish** — 13 ta 501 stub (session/scan/handover/QC) — bu eng katta ish (2-band).

---

*Tahlil 2026-06-02 — kod (Read/Grep) + jonli DB (read-only SELECT) + mavjud hisobotlar. Hech narsa o'zgartirilmadi. Brauzer ishlatilmadi (oldingi hisobot brauzer dalili bilan mos: login ekrani ishlaydi, ichkariga o'tmaydi — ildiz sabab 8.1).*
