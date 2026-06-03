# IoT TABLET — ASL HOLAT HISOBOTI (2026-06-02)

> **FAQAT TAHLIL** — hech narsa o'zgartirilmadi. Kod + jonli DB (:5432) + brauzer (:20806).
> Kontekst: ishchi material skaner qiladi (buyurtmaga sarf), yarim tayyorni keyingi sexga o'tkazadi;
> reja — 3 sensor (issiqlik/bosim/vibratsiya) qo'shish. Avval hozir nima borligini aniqlash.

---

## QISQA HUKM
IoT tablet — **boy SKELET, lekin operatsion yadrosi STUB/BO'SH**. Login + o'qish (buyurtma/jihoz/jadval) +
SOS ishlaydi; lekin **ishchi ish-oqimi** (material skaner→buyurtmaga sarf, sex-ga o'tkazish, production
session) **501 "Not implemented"**. Sensor (issiqlik/bosim/vibratsiya) **strukturasi tayyor (~70%)**, lekin
data/jonli yozuvchi yo'q. MES jadvallari bor, lekin **0 sex (work_centers), 0 marshrut**. Hamma IoT/sensor/MES
jadvali **0 qator**.

---

## 1. BACKEND
IoT moduli boy (modules/iot): `iot-tablet`, `iot-sensors`, `iot-sensors-main`, `iot-main`, `iot-alerts`,
`iot-camera`, `iot.gateway` (WebSocket), sensor aggregatlar, `record-sensor-reading` command/handler.

**IoT tablet endpointlari (`@Controller('iot')`):**
| Endpoint | Holat |
|---|---|
| `POST tablet/login` | ✅ ISHLAYDI (x-tablet-token JWT beradi) |
| `GET tablet/orders`, `tablet/worker-schedule`, `tablet/equipment` | ✅ ISHLAYDI (o'qish) |
| `POST tablet/sos-alert` | ✅ ISHLAYDI |
| `POST material-kit-items/:id/scan` (+PATCH) — **material skaner→sarf** | ❌ 501 STUB |
| `POST production-sessions/:id/start \| stop \| defect \| evaluation \| material-return \| inline-qc` | ❌ 501 STUB |
| `GET production-sessions/:id/crew`, `POST production-sessions` | ❌ 501 STUB |
| `POST tablet/handover` — **keyingi sexga o'tkazish** | ❌ 501 STUB |
| `GET tablet/shift`, `tablet/sessions` (+POST) | ❌ 501 STUB |

→ **Ishchining asosiy oqimi (material skaner→buyurtmaga sarf, yarim tayyor→keyingi sex, smena/session) — hammasi STUB.** Faqat login + o'qish + SOS ishlaydi.

**Sensor endpointlari — REAL (stub emas):**
- `iot-main`: `GET iot/temperature`, `iot/pressure`, `iot/vibration`, `iot/humidity`, `iot/gas-levels`, `iot/noise-levels` → `svc.getEnvironmentData(type, location, deviceId)` (haqiqiy so'rov).
- `iot-sensors`: `GET/POST devices`, `PATCH devices/:id/thresholds`, **`POST devices/:id/readings`** (yozuv kirimi), `GET devices/:id/readings`, `GET anomalies`, `GET sensors/:id/oee`.
- `iot-sensors-main` (`@Controller('iot-sensors')`): dashboard, live, alerts, oee, trends, history, predictive-maintenance.
- `iot.gateway` — WebSocket (jonli ko'rsatish uchun).

**DB (hammasi 0 qator):** `iot_devices`, `iot_sensors`, `iot_sensor_readings`, `iot_alerts`, `sensor_devices`, `sensor_readings`, `mes_telemetry`.
- `iot_sensors` ustunlari: `sensor_code, name, **type**, machine_id, location, **unit, min_threshold, max_threshold**, last_reading, status, thresholds` → **issiqlik/bosim/vibratsiya uchun schema TAYYOR** (type — generic; yangi jadval kerak emas).
- `iot_sensor_readings`: `sensor_id, device_id, value, unit, recorded_at, session_id` → o'qishlar uchun tayyor.

**Backend hukmi:** skelet katta + sensor o'qish/kirim yo'li ulangan; lekin tablet operatsion endpointlari STUB; hamma jadval bo'sh; jonli yozuvchi (hardware ingest) yo'q.

---

## 2. FRONTEND (brauzer dalili, :20806)
- `/iot/tablet` → **"Operator kirishi"** ekrani: TABEL RAQAMI + PAROL + KIRISH + RU tarjima. **Toza, professional dizayn.**
- KIRISH bosildi → tabel maydoni tozalandi (validatsiya), **ichkariga o'tmadi** — chunki **operator akkaunt sozlanmagan** (DB'da tablet-parolli ishchi yo'q). Ya'ni login ekrani ishlaydi, lekin demonstratsiya uchun operator yo'q.
- Tablet ish-oqimi UI (kirim/chiqim/skaner) kodda bor (PosMonitorPage + `useIoTTablet/Data/Alerts/Auth` hooklari), lekin (a) login ortida, (b) backend operatsiyalari stub.
- **FE hukmi:** login UI tayyor; ish-oqimi UI kodda bor lekin yetib bo'lmaydi (operator yo'q) + backend stub.

---

## 3. SKANER VA BARCODE
- FE: `useHardwareScanner.ts` (USB HID / Web Serial / klaviatura-wedge) + `useCameraScanner` (BarcodeDetector + ZXing) + `pos-monitor.api.ts`.
- Barcode skaner endpoint: **`POST /api/pos/barcode/scan`** → POS Monitor'da ISHLAYDI (material kartochka qaytaradi).
- LEKIN **tablet-maxsus material skaner→buyurtmaga sarf** (`material-kit-items/:id/scan`) = **501 STUB**.
- Buyurtma QR + paddon (ota-bola) struktura: barcode infra bor (`batch_lots`, `barcode_print_queue`) lekin **bo'sh**; order-QR↔paddon ota-bola ierarxiyasi sozlanmagan/tasdiqlanmadi.
- **Hukm:** skaner apparat + kamera + umumiy barcode o'qish ishlaydi; tablet-maxsus "skaner→buyurtma sarfi" stub.

---

## 4. SENSOR (ISSIQLIK / BOSIM / VIBRATSIYA)
**Struktura BOR (~70% tayyor), data/jonli ingest YO'Q:**
- ✅ Jadval: `iot_sensors` (type+unit+min/max_threshold), `iot_sensor_readings` (value+sensor_id), `mes_telemetry` (metric_type+value).
- ✅ Endpoint: o'qish (`iot/temperature|pressure|vibration`), kirim (`POST iot/devices/:id/readings`), threshold (`PATCH .../thresholds`), anomaliya, OEE, WebSocket live.
- ✅ Command: `record-sensor-reading` (CQRS).
- ❌ 0 sensor qurilma, 0 o'qish; **jonli hardware yozuvchi yo'q** (MQTT/HTTP bridge fizik sensordan).
- **Hukm:** "3 sensor qo'shish" = **yangi jadval/strukturadan qurish EMAS** — balki: (1) `iot_sensors`'ga 3 qator seed (type=temperature/pressure/vibration), (2) fizik sensordan ingest (MQTT/HTTP), (3) tablet/dashboard UI'da ko'rsatish, (4) threshold-alert ulash. Ish — **integratsiya, noldan qurish emas.**

---

## 5. MES (ISHLAB CHIQARISH) BOG'LANISHI
- MES moduli BOR: `mes-operations`, `mes-production-sessions`, `mes-sessions`, `mes-shifts-stats`, `mes-maintenance` + `ai-agents/mes` (telemetry monitor cron).
- ❌ **`work_centers` = 0** — sexlar (Flekso/Ofset...) DB'da YO'Q.
- ❌ `pp_routing_operations`, `routing_operations`, `mes_operations` = 0 → **sexma-sex marshrut sozlanmagan**.
- ❌ Tablet ↔ MES: tablet `production-sessions/*` endpointlari STUB → tablet MES bilan **operatsion ulanmagan**.
- **Hukm:** MES struktura bor, lekin **bo'sh (0 sex, 0 marshrut)** + tablet↔MES ulanmagan. Buyurtmaning sexma-sex o'tishi kuzatilmaydi.

---

## 6. XULOSA — IoT tablet necha % tayyor

| Jihat | Tayyorlik | Izoh |
|---|---|---|
| Skelet/struktura (modul, controller, sensor infra, FE login, WebSocket) | **~60–70%** | ko'p narsa yozilgan |
| Funksional/operatsion (haqiqatda ishlaydi) | **~15–20%** | faqat login + o'qish + SOS |
| Material skaner → buyurtmaga sarf | ❌ STUB | qurish kerak |
| Yarim tayyor → keyingi sex (handover/marshrut) | ❌ STUB + 0 sex/marshrut | qurish kerak |
| 3 sensor (issiqlik/bosim/vibratsiya) | ⚠️ ~70% skelet | seed + hardware ingest + UI (integratsiya) |
| MES bog'lanishi | ❌ bo'sh + stub | sex/marshrut + tablet↔MES ulash |
| Operator akkauntlari | ❌ yo'q | tablet'ga kirib bo'lmaydi |

**Asosiy xulosa:** IoT tablet — **skelet** (login + o'qish ishlaydi, sensor infra tayyor), lekin **ishchining haqiqiy ish-oqimi (skaner→sarf, sex-ga o'tkazish) hali yozilmagan (501 stub)** va hamma narsa bo'sh (0 sensor, 0 sex, 0 operator).

**Nima bor:** IoT modul + sensor jadval/endpoint/command + WebSocket + FE login + skaner hooklari + POS barcode scan.
**Nima yo'q:** tablet operatsion endpointlari (stub), jonli sensor data + ingest, work_centers (sexlar), marshrut, operator akkauntlari, tablet↔MES operatsion ulanish.
**3 sensor uchun:** schema tayyor → faqat seed + hardware ingest + UI/alert (noldan qurish shart emas).

*Tahlil 2026-06-02 — kod + DB + brauzer. Hech narsa o'zgartirilmadi.*
