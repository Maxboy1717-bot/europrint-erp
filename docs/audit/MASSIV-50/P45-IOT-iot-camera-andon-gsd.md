# P45 — iot: IOT checklist gate + reason-code seed + GSD bridge + Andon + AI camera inspection

---

## 0. ROL VA QOIDALAR

**Rol:** Bajaruvchi (Wave 2). **dependsOn:** ["P44"]. P44 tugamasdan bu paket boshlanmaydi.

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi.
6.  FAYL IZOLYATSIYASI (Q-23/Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg.
    Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): migration faqat egasi ruxsati bilan; '-- APPROVED:' izoh SHART.
    Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof.
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon; kod vizyonga zid bo'lsa = xato.
```

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + flag:**

```
lib/db/src/schema/iot-schema.ts
lib/db/src/schema/pp/pp-enhanced.ts
apps/migrations/add-tablet-checklist-defect-codes.sql        ← DDL GATED
apps/migrations/add-card-gsd-log.sql                         ← DDL GATED
apps/migrations/add-camera-inspection-tables.sql             ← DDL GATED
apps/api/src/modules/iot/application/iot-tablet.service.ts
apps/api/src/modules/iot/application/camera-ai.service.ts
apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts
apps/api/src/modules/iot/presentation/camera-ai.controller.ts
apps/api/src/modules/iot/application/iot-main.service.ts
apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-main.repo.ts
apps/api/src/modules/iot/infrastructure/event-handlers/anomaly-detected.handler.ts
apps/api/src/modules/iot/iot.module.ts
artifacts/erp-dashboard/src/pages/iot/TbChecklist.tsx
artifacts/erp-dashboard/src/pages/iot/SmenaReadyChecklist.tsx
artifacts/erp-dashboard/src/pages/iot/AndonBoard.tsx
artifacts/erp-dashboard/src/pages/iot/IotDashboard.tsx
artifacts/erp-dashboard/src/pages/iot/CameraInspection.tsx
artifacts/erp-dashboard/src/pages/iot/PpeAlerts.tsx
artifacts/erp-dashboard/src/pages/iot/AttendanceCamera.tsx
```

**DDL DARVOZASI:** `apps/migrations/add-tablet-checklist-defect-codes.sql`,
`apps/migrations/add-card-gsd-log.sql`, `apps/migrations/add-camera-inspection-tables.sql` —
uchala migration faylini YOZ, lekin **egasi `-- APPROVED: <ism> <sana>` qo'shmaguncha
`psql` / Docker exec orqali ISHGA TUSHIRMA.**

**⚠️ KROSS-PAKET CHEKLOV — P44 KANONIK:**
`machines` jadvali va uning seed'i (SM-52, KBA-105, Тигель 1-10) **faqat P44 egasidir**.
P45 `machines` CREATE TABLE yoki seed QILMAYDI. P45 da generic-kod (GF-001) va inglizcha-status
(active/idle/decommissioned) TAQIQLANGAN — EP-IOT-031 bo'yicha P44 kanonik (kitob nomlari +
o'zbekcha status). (00-INTERVYU-MOSLIK §3 — IOT P44╳P45 collision darhol tuzatilishi shart)

---

## 2. VIZYON

### 2.1 IoT moduli — zavod aqliy markazi (T3 supporting)

Manba: `docs/audit/MUSLIMBEK-PROMT-20-IOT-2026-06-08.md`

IoT = **factory floor intelligence hub**. Sensorlar hali o'rnatilmagan; **kamera ASOSIY
yetkazib beriladigan narsa**. 6 ta tamoyil:

| Tamoyil | Ma'no |
|---------|-------|
| E1 — AI kuzatadi, inson tasdiqlaydi | AI aniqlagach operator/HR tasdiqlaydi |
| Karta-markazli | Xodim KARTA orqali bog'lanadi |
| AI rejalashtiradi | 7-bosqich AI rejalash |
| Tablet = zavod markazi | Operator barcha kirituvni tabletdan qiladi |
| Org-chart marshrutlash | Xabarnomalar ierarxiya bo'yicha tarqaladi |
| Bitta kanonik haqiqat | pp-iot.ts `production_sessions` (34 ustun) |

**Owner override EP-IOT-018/030 (OCHIQ-JAVOBLAR):** `GET /api/iot/energy-consumption` →
**501** bilan sex-hisoblagich fazasi kodi qaytarsin.
Owner AYNAN: "energiya = mashina darajasida → tannarxga avto; **sensor o'rnatilguncha umumiy
sex hisoblagichidan boshlanadi**". Demak:
- Hozirgi faza = sex (bo'lim) umumiy hisoblagich (per-mashina sensor yo'q)
- `code: "EP-IOT-ENERGY-SEX-METER"`, `phase: "sex_meter"` qaytarsin
- Hozir per-mashina sensor proxy'dan o'qiydi — bu NOTO'G'RI manba
- **EGASI QIYMATI KERAK:** sex hisoblagich ma'lumoti qaysi DB jadvaldan keladini egasi belgilaydi

### 2.2 Qabul mezoni har xususiyat uchun

| Xususiyat | Qabul mezoni |
|-----------|-------------|
| TB/smena checklist BE gate | POST /api/iot/tablet/checklist/tb-confirm va /smena-ready real INSERT; sessiya start endpoint ULAR tasdiqlanmasdan 403 qaytaradi |
| Downtime/defect reason seed | `downtime_reason_codes` 10 qator; `defect_reason_codes` 8 qator; DB-proof: SELECT COUNT(*) |
| alternative_work_log | Jadval mavjud; POST /api/iot/tablet/alternative-work real INSERT |
| card_gsd_log + OEE snapshot | `MesCompletedEvent` handlerida GSD yoziladi; DB-proof: event → INSERT |
| Andon live | GET /api/iot/andon/live real data; AndonBoard.tsx render |
| IoT Dashboard | IotDashboard.tsx 6 widget real API |
| AI kamera xona tekshiruvi | CameraInspectionService Gemini VLM chaqiradi; 2h cron; room_inspections INSERT |
| Violation closed-loop | inspection_violations: assign → resolve → escalate |
| PPE human-gate | ppe_alerts: AI aniqlaydi → operator tasdiqlaydi (E1) |
| Attendance log | attendance_camera_log: entry/exit/workspace event-based |
| Energy sex-meter faza | GET /api/iot/energy-consumption → 501 `EP-IOT-ENERGY-SEX-METER`, `phase:"sex_meter"` (Owner: sex hisoblagichidan boshlanadi) |
| Operator role | IOT_READ va IOT_WRITE ga 'operator' qo'shiladi |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (ISHLAMOQDA — O'CHIRMA)

```
apps/api/src/modules/iot/iot.module.ts:97-127
  — Module wired: AnomalyDetectedHandler, DrizzleCameraAiRepo, CameraAiController,
    IotTabletController, IotMainController, IotTabletService va boshqalar.

apps/api/src/modules/iot/presentation/iot-tablet.controller.ts
  — login/SOS/equipment/orders/schedule/sessions-CRUD/start/stop/defect/inline-qc/handover/material-return.
  — IOT_READ = iot-tablet.schemas.ts:116 = ['super_admin','director','production_manager',
    'ERP_MANAGER','admin','technologist'] — 'operator' YO'Q (bug).

apps/api/src/modules/iot/application/camera-ai.service.ts:11-70
  — getSummary/getSafetyTrends/getQualityAnalysis/getProductivityScores/getMachineUtilization/
    getAnomalyDetection/listCamerasAi/getCameraTriggerRules/updateCameraPrompt — barchasi real DB.

apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts:1-60
  — cameras, camera_events, camera_safety_violations, camera_quality_defects, camera_ai_configs.

apps/api/src/modules/iot/infrastructure/event-handlers/anomaly-detected.handler.ts:14-34
  — @EventsHandler(AnomalyDetectedEvent) → iot_alerts INSERT (real DB, avval NO-OP edi).

apps/api/src/modules/iot/application/iot-main.service.ts:23-60
  — getAlerts/acknowledgeAlert/getAttendanceLive/getRoomInspections/getEmployeeHealth.

lib/db/src/schema/iot-schema.ts:18-80
  — cameras (30 ustun), camera_zones, camera_events, camera_safety_violations,
    camera_quality_defects, camera_ai_configs, camera_detections, employee_zone_tracking,
    iot_sensors, iot_sensor_readings, iot_alerts, pm_schedules, operator_performance_summary.

lib/db/src/schema/pp/pp-enhanced.ts:19-60
  — machineCrews (session_id FK, crew roles), setupChecklists (session_id FK, checklist fields).

artifacts/erp-dashboard/src/pages/iot/IoTChecklistModal.tsx
  — FE checklist modal mavjud — lekin BE endpoint YO'Q (fake gate).
```

### 3.2 YO'Q (YARATILISHI KERAK)

```
machines kanonik jadval (norma_per_hour/norma_per_12h/responsible_card_id) — YO'Q
production_sessions.smena_type A/B/C — ustun YO'Q (pp-iot.ts)
production_sessions.smena_boss_card_id — ustun YO'Q
POST /api/iot/production-sessions/:id/crew — faqat GET mavjud
POST /api/iot/tablet/checklist/tb-confirm — TO'LIQ YO'Q
POST /api/iot/tablet/checklist/smena-ready — TO'LIQ YO'Q
Session start blocking gate — checklist tasdiqlanmasdan start bo'ladi (xato)
downtime_reason_codes seed — jadval bor, 0 qator (EP-IOT kitob codes)
defect_reason_codes jadval — YO'Q (pgTable yo'q)
alternative_work_log jadval — YO'Q
card_gsd_log jadval — YO'Q
OEE snapshot write MesCompletedEvent — handler YO'Q
GSD write handler — YO'Q
GET /api/iot/andon/live — YO'Q
AndonBoard.tsx — YO'Q (faqat sidebar entry bor)
IotDashboard.tsx real 6 widget — YO'Q
room_inspections jadval (ideal_photo_url semantics) — YO'Q
inspection_violations jadval — YO'Q
ppe_alerts jadval (E1 human-gate) — YO'Q
attendance_camera_log jadval (event-based) — YO'Q
CameraInspectionService (Gemini VLM) — TO'LIQ YO'Q
2h cron xona tekshiruvi — YO'Q
Violation closed-loop (assign→resolve→escalate) — YO'Q
CameraInspection.tsx, PpeAlerts.tsx, AttendanceCamera.tsx — YO'Q
TbChecklist.tsx, SmenaReadyChecklist.tsx — YO'Q
machine_maintenance_logs — YO'Q
norma_change_log — YO'Q
GET /api/iot/analytics/downtime-pareto — YO'Q
GET /api/iot/analytics/smena-report/:sessionId — YO'Q
GET /api/iot/gsd-summary — YO'Q
```

### 3.3 BUZUQ / SOXTA

```
iot-main.controller.ts:143-150
  GET /api/iot/energy-consumption → getEnvironmentData('energy') → sensor float → SOXTA
  KERAK: 501 { message: "Energiya: sex umumiy hisoblagich fazasi — per-mashina sensor kutilmoqda", code: "EP-IOT-ENERGY-SEX-METER", phase: "sex_meter" }

drizzle-iot-oee.repo.ts:23-24
  OEE = iot_sensor_readings.value > 80 (float proxy) → SEMANTIK XATO
  KERAK: production_sessions.running_time_seconds / planned_qty / actual_qty

iot-tablet.schemas.ts:116
  IOT_READ = [...] — 'operator' MISSING → floor operator access yo'q → BUG

IoTChecklistModal.tsx (FE)
  Modal bor, BE endpoint YO'Q → fake gate → sessiya checklistsiz boshlanadi
```

---

## 4. ISH (qadam-baqadam)

### QADAM 1: Energy endpoint → sex-hisoblagich faza 501

**Owner override (OCHIQ-JAVOBLAR EP-IOT-018/030):** "sensor o'rnatilguncha umumiy sex
hisoblagichidan boshlanadi." Hozirgi faza = sex (bo'lim) umumiy hisoblagich; per-mashina sensor
keyingi fazada. **EGASI QIYMATI KERAK:** sex hisoblagich DB manbai egasi belgilaydi.

**Fayl:** `apps/api/src/modules/iot/application/iot-main.service.ts`

Hozirgi holat (satr ~60-70):
```typescript
// getEnvironmentData method sensor proxy qaytaradi
getEnvironmentData(type: string, ...): ReturnType<...> {
  return this.repo.findEnvironmentData(type, ...);
}
```

Yangi holat — `getEnvironmentData` ichida `'energy'` uchun erta qaytish:
```typescript
async getEnvironmentData(
  type: string,
  location?: string,
  deviceId?: string,
): Promise<Result<unknown>> {
  if (type === 'energy') {
    // EP-IOT-018/030 owner override (OCHIQ-JAVOBLAR):
    //   "sensor o'rnatilguncha umumiy sex hisoblagichidan boshlanadi"
    //   Hozirgi faza: sex (bo'lim) umumiy hisoblagich manbasi.
    //   Per-mashina sensor o'rnatilgach bu blok olib tashlanadi.
    //   EGASI QIYMATI KERAK: sex hisoblagich DB manbai egasi belgilaydi.
    return Err({
      code: 'EP-IOT-ENERGY-SEX-METER',
      message: "Energiya: sex umumiy hisoblagich fazasi — per-mashina sensor kutilmoqda",
      phase: 'sex_meter',
    });
  }
  return this.repo.findEnvironmentData(type, location, deviceId);
}
```

**Fayl:** `apps/api/src/modules/iot/presentation/iot-main.controller.ts` (satr 143-150)

```typescript
// OLDIN:
async getEnergyConsumption(@Query() raw: Record<string, unknown>) {
  const q = DeviceIdQuerySchema.parse(raw);
  return unwrapOrThrow(await this.svc.getEnvironmentData('energy', undefined, q.device_id));
}

// KEYIN:
async getEnergyConsumption() {
  // EP-IOT-018/030: Owner: "sensor o'rnatilguncha sex hisoblagichidan boshlanadi"
  // EGASI QIYMATI KERAK: sex hisoblagich DB manbai belgilanmaguncha 501 qaytaradi.
  throw new HttpException(
    {
      message: "Energiya: sex umumiy hisoblagich fazasi — per-mashina sensor kutilmoqda",
      code: 'EP-IOT-ENERGY-SEX-METER',
      phase: 'sex_meter',
      note: 'Owner: sensor o\'rnatilguncha umumiy sex hisoblagichidan boshlanadi (EP-IOT-018/030)',
    },
    HttpStatus.NOT_IMPLEMENTED,
  );
}
```

DB-proof: `curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/iot/energy-consumption` → 501, `code: 'EP-IOT-ENERGY-SEX-METER'`.

---

### QADAM 2: Operator roli IOT_READ/IOT_WRITE ga qo'shish

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts` (satr 116)

```typescript
// OLDIN:
export const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];

// KEYIN:
export const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist', 'operator'];
export const IOT_WRITE = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'operator'];
```

**Fayl:** `apps/api/src/modules/iot/presentation/iot-main.controller.ts` (satr 40-41)

```typescript
// OLDIN:
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin'];

// KEYIN:
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist', 'operator'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'operator'];
```

DDL kerak emas — faqat guard constants.

---

### QADAM 3: DDL migratsiya fayllarini yoz (GATED — ishga tushirma)

#### 3A: `apps/migrations/add-tablet-checklist-defect-codes.sql`

```sql
-- APPROVED: <egasi_ismi> <sana>
-- P45 IoT: TB/smena checklist gate + defect/downtime reason codes + alternative_work_log
-- Wave 2 | dependsOn: P44
--
-- ⚠️  MUHIM: machines jadvali va uning seed'i P44 da (KANONIK).
--     P45 machines CREATE TABLE va GF-001/generic seed ni O'Z ICHIGA OLMAYDI.
--     Sabab: P44 = kitob nomlari (SM-52, KBA-105, Тигель 1-10) + o'zbekcha status
--             (ishlayapti/to'xtagan/...) — EP-IOT-031 bo'yicha KANONIK.
--            P45 da generic-kod (GF-001) + inglizcha status (active/idle) = CONTRADICTS P44.
--     Agar machines jadvali hali yaratilmagan bo'lsa → P44 ni avval ishga tushiring.
--     (00-INTERVYU-MOSLIK.md §3 1-DARAJA — IOT P44╳P45 machines collision)

-- 1. production_sessions ga smena ustunlari qo'shish
--    (P44 migration APPROVED bo'lmaganida bu ham GATED)
ALTER TABLE production_sessions
  ADD COLUMN IF NOT EXISTS smena_type        VARCHAR(1) CHECK (smena_type IN ('A','B','C')),
  ADD COLUMN IF NOT EXISTS smena_boss_card_id INTEGER;

-- 2. TB checklist confirmation
CREATE TABLE IF NOT EXISTS tb_checklist_confirmations (
  id             SERIAL PRIMARY KEY,
  session_id     VARCHAR(100) NOT NULL,
  confirmed_by   INTEGER NOT NULL,  -- employees.id
  confirmed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items_json     JSONB,             -- [{item, checked, note}]
  notes          TEXT
);

-- 3. Smena ready confirmation
CREATE TABLE IF NOT EXISTS smena_ready_confirmations (
  id             SERIAL PRIMARY KEY,
  session_id     VARCHAR(100) NOT NULL,
  confirmed_by   INTEGER NOT NULL,
  confirmed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  crew_complete  BOOLEAN NOT NULL DEFAULT false,
  materials_ok   BOOLEAN NOT NULL DEFAULT false,
  machine_ok     BOOLEAN NOT NULL DEFAULT false,
  notes          TEXT
);

-- 4. Defect reason codes (downtime dan alohida — 8 kitob kodi)
CREATE TABLE IF NOT EXISTS defect_reason_codes (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(30) NOT NULL UNIQUE,
  name_uz      TEXT NOT NULL,
  name_ru      TEXT NOT NULL,
  machine_type VARCHAR(50),   -- NULL = hamma mashinaga tegishli
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO defect_reason_codes (code, name_uz, name_ru, machine_type)
VALUES
  ('DEF-001', 'Bosma sifati past',          'Низкое качество печати',    'offset'),
  ('DEF-002', 'Rangli mos kelmaydi',        'Несоответствие цвета',      'offset'),
  ('DEF-003', 'Yelim yopishmasin',          'Не приклеивается клей',     'gofra'),
  ('DEF-004', 'Gofra deformatsiyasi',       'Деформация гофры',          'gofra'),
  ('DEF-005', 'O'lchov xatosi',            'Ошибка размера',            NULL),
  ('DEF-006', 'Yirtilish/yorilish',         'Разрыв/трещина',            NULL),
  ('DEF-007', 'Ifloslanish',               'Загрязнение',               NULL),
  ('DEF-008', 'Boshqa nuqson',             'Другой дефект',             NULL)
ON CONFLICT (code) DO NOTHING;

-- 5. Downtime reason codes seed (jadval pp-iot.ts da bor — 0 qator)
INSERT INTO downtime_reason_codes (code, name_uz, name_ru, category, is_active)
VALUES
  ('DT-001', 'Sozlash',                'Наладка',                   'setup',       true),
  ('DT-002', 'Иш йук',                'Нет работы',                'no_work',     true),
  ('DT-003', 'Qolip tayyor emas',      'Форма не готова',           'tooling',     true),
  ('DT-004', 'Переделка',             'Переработка',               'rework',      true),
  ('DT-005', 'Material yoq',          'Нет материала',             'material',    true),
  ('DT-006', 'Tok yoq',               'Нет электричества',         'utilities',   true),
  ('DT-007', 'Operator yoq',          'Нет оператора',             'staffing',    true),
  ('DT-008', 'Tuzatish',              'Ремонт',                    'maintenance', true),
  ('DT-009', 'Tozalash',              'Уборка/чистка',             'cleaning',    true),
  ('DT-010', 'Boshqa',                'Другое',                    'other',       true)
ON CONFLICT (code) DO NOTHING;

-- 6. alternative_work_log (EP-IOT-059: иш йук → арчиш/паддон)
CREATE TABLE IF NOT EXISTS alternative_work_log (
  id            SERIAL PRIMARY KEY,
  session_id    VARCHAR(100) NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  work_type     VARCHAR(50) NOT NULL CHECK (work_type IN ('arching','paddon','cleaning','setup','other')),
  performed_by  INTEGER NOT NULL,  -- employees.id
  quantity      NUMERIC(10,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. machine_maintenance_logs (EP-IOT-072)
-- NOTE: machines.id FK talab qiladi — P44 migration APPROVED va ishga tushirilgan bo'lishi shart
CREATE TABLE IF NOT EXISTS machine_maintenance_logs (
  id                  SERIAL PRIMARY KEY,
  machine_id          INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  log_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  work_type           VARCHAR(50) NOT NULL CHECK (work_type IN ('preventive','corrective','emergency','inspection')),
  parts_replaced      JSONB,
  cost                NUMERIC(14,2),
  technician_card_id  INTEGER,
  duration_hours      NUMERIC(6,2),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. norma_change_log (EP-IOT-054)
-- NOTE: machines.id FK talab qiladi — P44 migration APPROVED va ishga tushirilgan bo'lishi shart
CREATE TABLE IF NOT EXISTS norma_change_log (
  id                    SERIAL PRIMARY KEY,
  machine_id            INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  old_norma             NUMERIC(10,2) NOT NULL,
  new_norma             NUMERIC(10,2) NOT NULL,
  changed_by_card_id    INTEGER NOT NULL,
  rd4_approved_by       INTEGER,
  director_approved_by  INTEGER,
  approved_at           TIMESTAMPTZ,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','rd4','director','active','rejected')),
  reason                TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tb_checklist_session      ON tb_checklist_confirmations(session_id);
CREATE INDEX IF NOT EXISTS idx_smena_ready_session       ON smena_ready_confirmations(session_id);
CREATE INDEX IF NOT EXISTS idx_alt_work_session          ON alternative_work_log(session_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_machine       ON machine_maintenance_logs(machine_id, log_date);
CREATE INDEX IF NOT EXISTS idx_norma_change_machine      ON norma_change_log(machine_id, status);
```

#### 3B: `apps/migrations/add-card-gsd-log.sql`

```sql
-- APPROVED: <egasi_ismi> <sana>
-- P45 IoT: GSD bridge — card_gsd_log + oee_snapshots real write

-- 1. card_gsd_log (EP-IOT-025: GSD per smena per card)
CREATE TABLE IF NOT EXISTS card_gsd_log (
  id                    SERIAL PRIMARY KEY,
  card_id               INTEGER NOT NULL,   -- org_functions.id (karta)
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  smena                 VARCHAR(1) NOT NULL CHECK (smena IN ('A','B','C')),
  metric_code           VARCHAR(30) NOT NULL,  -- 'GSD_OUTPUT','GSD_NORMA','GSD_EFFICIENCY'
  value                 NUMERIC(14,4) NOT NULL,
  excluded_downtime_min INTEGER NOT NULL DEFAULT 0,
  session_id            VARCHAR(100),       -- source production_sessions.id
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_card_gsd_log_unique
  ON card_gsd_log(card_id, date, smena, metric_code);

CREATE INDEX IF NOT EXISTS idx_card_gsd_log_date ON card_gsd_log(date, card_id);

-- 2. oee_snapshots — real session data bilan to'ldirishga tayyor
-- Jadval pp-iot.ts da bor (schema-only); ustunlarni tekshirib qo'shamiz
ALTER TABLE oee_snapshots
  ADD COLUMN IF NOT EXISTS source_session_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS calculated_at     TIMESTAMPTZ DEFAULT NOW();
```

#### 3C: `apps/migrations/add-camera-inspection-tables.sql`

```sql
-- APPROVED: <egasi_ismi> <sana>
-- P45 IoT: Camera AI inspection tables — room_inspections, inspection_violations,
--          ppe_alerts (E1), attendance_camera_log

-- 1. camera_zones ga ideal_photo_url qo'shish
ALTER TABLE camera_zones
  ADD COLUMN IF NOT EXISTS ideal_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS description     TEXT;

-- 2. room_inspections (EP-IOT-010/011)
CREATE TABLE IF NOT EXISTS room_inspections (
  id              SERIAL PRIMARY KEY,
  camera_zone_id  INTEGER NOT NULL REFERENCES camera_zones(id) ON DELETE CASCADE,
  inspected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score_0_100     INTEGER NOT NULL CHECK (score_0_100 BETWEEN 0 AND 100),
  violations      JSONB,    -- [{criterion, description, severity}]
  ai_model        VARCHAR(100) NOT NULL DEFAULT 'gemini-1.5-flash',
  prompt_used     TEXT,
  raw_response    TEXT,
  ideal_url       TEXT,     -- ideal_photo_url snapshot
  actual_url      TEXT,     -- snapshot at inspection time
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_insp_zone_time ON room_inspections(camera_zone_id, inspected_at DESC);

-- 3. inspection_violations (EP-IOT-012 closed loop)
CREATE TABLE IF NOT EXISTS inspection_violations (
  id                    SERIAL PRIMARY KEY,
  inspection_id         INTEGER NOT NULL REFERENCES room_inspections(id) ON DELETE CASCADE,
  criterion_code        VARCHAR(50) NOT NULL,
  description           TEXT NOT NULL,
  severity              VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  photo_url             TEXT,
  assigned_to_card_id   INTEGER,
  due_date              DATE,
  resolved_at           TIMESTAMPTZ,
  resolved_by_card_id   INTEGER,
  escalated_at          TIMESTAMPTZ,
  escalated_to_card_id  INTEGER,
  status                VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','assigned','resolved','escalated','closed')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_violations_status ON inspection_violations(status, due_date);

-- 4. ppe_alerts (EP-IOT-077/078) — E1: AI aniqlaydi, inson tasdiqlaydi
CREATE TABLE IF NOT EXISTS ppe_alerts (
  id                    SERIAL PRIMARY KEY,
  camera_zone_id        INTEGER REFERENCES camera_zones(id) ON DELETE SET NULL,
  detected_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  worker_card_id        INTEGER,              -- NULL = noma'lum
  violation_type        VARCHAR(50) NOT NULL, -- no_helmet, no_vest, no_gloves, no_mask, other
  photo_url             TEXT,
  ai_confidence         NUMERIC(5,4),         -- 0.0-1.0
  confirmed_by_card_id  INTEGER,              -- E1: inson tasdiqlaydi (NULL = hali tasdiqlanmagan)
  confirmed_at          TIMESTAMPTZ,
  action_taken          TEXT,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','dismissed','resolved')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppe_alerts_status    ON ppe_alerts(status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppe_alerts_zone      ON ppe_alerts(camera_zone_id, detected_at DESC);

-- 5. attendance_camera_log (Q108: event-based — entry/exit)
CREATE TABLE IF NOT EXISTS attendance_camera_log (
  id              SERIAL PRIMARY KEY,
  worker_card_id  INTEGER NOT NULL,    -- employees.id
  camera_zone_id  INTEGER REFERENCES camera_zones(id) ON DELETE SET NULL,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type      VARCHAR(30) NOT NULL
    CHECK (event_type IN ('entry','exit','workspace_arrival','workspace_departure')),
  ai_confidence   NUMERIC(5,4),
  photo_url       TEXT,
  verified        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_cam_log_worker ON attendance_camera_log(worker_card_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_att_cam_log_zone   ON attendance_camera_log(camera_zone_id, detected_at DESC);
```

---

### QADAM 4: iot-schema.ts ga yangi jadvallar qo'shish (Drizzle schema)

**Fayl:** `lib/db/src/schema/iot-schema.ts`

Mavjud importlar ostiga qo'sh (fayl oxiriga):

```typescript
// ========== P45: TB/SMENA CHECKLIST GATE ==========

export const tbChecklistConfirmations = pgTable('tb_checklist_confirmations', {
  id:          serial('id').primaryKey(),
  sessionId:   varchar('session_id', { length: 100 }).notNull(),
  confirmedBy: integer('confirmed_by').notNull(),
  confirmedAt: timestamp('confirmed_at').notNull().defaultNow(),
  itemsJson:   jsonb('items_json'),
  notes:       text('notes'),
});

export const smenaReadyConfirmations = pgTable('smena_ready_confirmations', {
  id:           serial('id').primaryKey(),
  sessionId:    varchar('session_id', { length: 100 }).notNull(),
  confirmedBy:  integer('confirmed_by').notNull(),
  confirmedAt:  timestamp('confirmed_at').notNull().defaultNow(),
  crewComplete: boolean('crew_complete').notNull().default(false),
  materialsOk:  boolean('materials_ok').notNull().default(false),
  machineOk:    boolean('machine_ok').notNull().default(false),
  notes:        text('notes'),
});

export const defectReasonCodes = pgTable('defect_reason_codes', {
  id:          serial('id').primaryKey(),
  code:        varchar('code', { length: 30 }).notNull().unique(),
  nameUz:      text('name_uz').notNull(),
  nameRu:      text('name_ru').notNull(),
  machineType: varchar('machine_type', { length: 50 }),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
});

export const alternativeWorkLog = pgTable('alternative_work_log', {
  id:          serial('id').primaryKey(),
  sessionId:   varchar('session_id', { length: 100 }).notNull(),
  startedAt:   timestamp('started_at').notNull().defaultNow(),
  endedAt:     timestamp('ended_at'),
  workType:    varchar('work_type', { length: 50 }).notNull(),
  performedBy: integer('performed_by').notNull(),
  quantity:    integer('quantity'),
  notes:       text('notes'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check('alt_work_type_chk', sql`${t.workType} IN ('arching','paddon','cleaning','setup','other')`),
]);

// ⚠️  MACHINES SCHEMA: P44 egasidir.
// P45 da `machines` pgTable YO'Q — P44 (lib/db/src/schema/pp/pp-iot.ts) dan import qiling.
// P44 schema: export const machines = pgTable("machines", {...}) — o'zbekcha status, kitob nomlari.
// P45 da `machineMachines` (inglizcha-status, generic-code) ni qo'SHMA — collision beradi.
// (00-INTERVYU-MOSLIK.md §3 — IOT P44╳P45 machines collision)
//
// P45 ga machines import kerak bo'lsa:
// import { machines } from '@europrint/db/schema/pp/pp-iot';

// ========== P45: GSD BRIDGE ==========

export const cardGsdLog = pgTable('card_gsd_log', {
  id:                 serial('id').primaryKey(),
  cardId:             integer('card_id').notNull(),
  date:               timestamp('date').notNull().defaultNow(),
  smena:              varchar('smena', { length: 1 }).notNull(),
  metricCode:         varchar('metric_code', { length: 30 }).notNull(),
  value:              integer('value').notNull(),
  excludedDowntimeMin: integer('excluded_downtime_min').notNull().default(0),
  sessionId:          varchar('session_id', { length: 100 }),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check('card_gsd_smena_chk', sql`${t.smena} IN ('A','B','C')`),
]);

// ========== P45: CAMERA INSPECTION ==========

export const roomInspections = pgTable('room_inspections', {
  id:            serial('id').primaryKey(),
  cameraZoneId:  integer('camera_zone_id').references(() => cameraZones.id, { onDelete: 'cascade' }).notNull(),
  inspectedAt:   timestamp('inspected_at').notNull().defaultNow(),
  score0100:     integer('score_0_100').notNull(),
  violations:    jsonb('violations'),
  aiModel:       varchar('ai_model', { length: 100 }).notNull().default('gemini-1.5-flash'),
  promptUsed:    text('prompt_used'),
  rawResponse:   text('raw_response'),
  idealUrl:      text('ideal_url'),
  actualUrl:     text('actual_url'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
});

export type RoomInspection = typeof roomInspections.$inferSelect;

export const inspectionViolations = pgTable('inspection_violations', {
  id:                  serial('id').primaryKey(),
  inspectionId:        integer('inspection_id').references(() => roomInspections.id, { onDelete: 'cascade' }).notNull(),
  criterionCode:       varchar('criterion_code', { length: 50 }).notNull(),
  description:         text('description').notNull(),
  severity:            varchar('severity', { length: 20 }).notNull().default('medium'),
  photoUrl:            text('photo_url'),
  assignedToCardId:    integer('assigned_to_card_id'),
  dueDate:             timestamp('due_date'),
  resolvedAt:          timestamp('resolved_at'),
  resolvedByCardId:    integer('resolved_by_card_id'),
  escalatedAt:         timestamp('escalated_at'),
  escalatedToCardId:   integer('escalated_to_card_id'),
  status:              varchar('status', { length: 20 }).notNull().default('open'),
  notes:               text('notes'),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check('insp_viol_status_chk', sql`${t.status} IN ('open','assigned','resolved','escalated','closed')`),
  check('insp_viol_sev_chk', sql`${t.severity} IN ('low','medium','high','critical')`),
]);

export type InspectionViolation = typeof inspectionViolations.$inferSelect;

export const ppeAlerts = pgTable('ppe_alerts', {
  id:                 serial('id').primaryKey(),
  cameraZoneId:       integer('camera_zone_id').references(() => cameraZones.id, { onDelete: 'set null' }),
  detectedAt:         timestamp('detected_at').notNull().defaultNow(),
  workerCardId:       integer('worker_card_id'),
  violationType:      varchar('violation_type', { length: 50 }).notNull(),
  photoUrl:           text('photo_url'),
  aiConfidence:       integer('ai_confidence'),  // 0-100
  confirmedByCardId:  integer('confirmed_by_card_id'),  // E1 human gate
  confirmedAt:        timestamp('confirmed_at'),
  actionTaken:        text('action_taken'),
  status:             varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check('ppe_status_chk', sql`${t.status} IN ('pending','confirmed','dismissed','resolved')`),
]);

export type PpeAlert = typeof ppeAlerts.$inferSelect;

export const attendanceCameraLog = pgTable('attendance_camera_log', {
  id:            serial('id').primaryKey(),
  workerCardId:  integer('worker_card_id').notNull(),
  cameraZoneId:  integer('camera_zone_id').references(() => cameraZones.id, { onDelete: 'set null' }),
  detectedAt:    timestamp('detected_at').notNull().defaultNow(),
  eventType:     varchar('event_type', { length: 30 }).notNull(),
  aiConfidence:  integer('ai_confidence'),
  photoUrl:      text('photo_url'),
  verified:      boolean('verified').notNull().default(false),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check('att_cam_event_chk', sql`${t.eventType} IN ('entry','exit','workspace_arrival','workspace_departure')`),
]);

export type AttendanceCameraLog = typeof attendanceCameraLog.$inferSelect;
```

---

### QADAM 5: iot-tablet.service.ts — checklist gate metodlari

**Fayl:** `apps/api/src/modules/iot/application/iot-tablet.service.ts`

Mavjud `IotTabletService` classiga qo'sh:

```typescript
// Import qo'sh (fayl boshiga):
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

// Class ichiga qo'sh:

async confirmTbChecklist(
  sessionId: string,
  confirmedBy: number,
  itemsJson: unknown[],
  notes?: string,
): Promise<Result<{ id: number; sessionId: string; confirmedAt: Date }>> {
  try {
    const rows = await db.execute(sql`
      INSERT INTO tb_checklist_confirmations (session_id, confirmed_by, items_json, notes)
      VALUES (${sessionId}, ${confirmedBy}, ${JSON.stringify(itemsJson)}::jsonb, ${notes ?? null})
      RETURNING id, session_id, confirmed_at
    `);
    const row = (rows as { rows?: unknown[] }).rows?.[0] as
      { id: number; session_id: string; confirmed_at: Date } | undefined;
    if (!row) return Err(AppErr('INTERNAL', 'TB checklist INSERT qaytarmadi'));
    return Ok({ id: row.id, sessionId: row.session_id, confirmedAt: row.confirmed_at });
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async confirmSmenaReady(
  sessionId: string,
  confirmedBy: number,
  crewComplete: boolean,
  materialsOk: boolean,
  machineOk: boolean,
  notes?: string,
): Promise<Result<{ id: number; sessionId: string; confirmedAt: Date }>> {
  try {
    const rows = await db.execute(sql`
      INSERT INTO smena_ready_confirmations
        (session_id, confirmed_by, crew_complete, materials_ok, machine_ok, notes)
      VALUES
        (${sessionId}, ${confirmedBy}, ${crewComplete}, ${materialsOk}, ${machineOk}, ${notes ?? null})
      RETURNING id, session_id, confirmed_at
    `);
    const row = (rows as { rows?: unknown[] }).rows?.[0] as
      { id: number; session_id: string; confirmed_at: Date } | undefined;
    if (!row) return Err(AppErr('INTERNAL', 'Smena ready INSERT qaytarmadi'));
    return Ok({ id: row.id, sessionId: row.session_id, confirmedAt: row.confirmed_at });
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async checkSessionChecklists(
  sessionId: string,
): Promise<Result<{ tbDone: boolean; smenaDone: boolean }>> {
  try {
    const tbRows = await db.execute(sql`
      SELECT id FROM tb_checklist_confirmations WHERE session_id = ${sessionId} LIMIT 1`);
    const smenaRows = await db.execute(sql`
      SELECT id FROM smena_ready_confirmations WHERE session_id = ${sessionId} LIMIT 1`);
    const tbDone  = ((tbRows as { rows?: unknown[] }).rows?.length ?? 0) > 0;
    const smenaDone = ((smenaRows as { rows?: unknown[] }).rows?.length ?? 0) > 0;
    return Ok({ tbDone, smenaDone });
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async logAlternativeWork(
  sessionId: string,
  workType: string,
  performedBy: number,
  quantity: number | undefined,
  notes?: string,
): Promise<Result<{ id: number }>> {
  try {
    const rows = await db.execute(sql`
      INSERT INTO alternative_work_log
        (session_id, work_type, performed_by, quantity, notes)
      VALUES
        (${sessionId}, ${workType}, ${performedBy}, ${quantity ?? null}, ${notes ?? null})
      RETURNING id
    `);
    const row = (rows as { rows?: unknown[] }).rows?.[0] as { id: number } | undefined;
    if (!row) return Err(AppErr('INTERNAL', 'alt_work INSERT qaytarmadi'));
    return Ok({ id: row.id });
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async getAndonLive(): Promise<Result<unknown[]>> {
  try {
    const rows = await db.execute(sql`
      SELECT
        ps.id            AS session_id,
        ps.status,
        ps.machine_id,
        ps.order_id,
        ps.operator_id,
        ps.actual_quantity,
        ps.planned_quantity,
        ps.started_at,
        ps.smena_type,
        COALESCE(
          (SELECT COUNT(*) FROM downtime_events de
           WHERE de.session_id = ps.id AND de.ended_at IS NULL), 0
        ) AS active_downtime_count,
        (SELECT de.reason_code FROM downtime_events de
         WHERE de.session_id = ps.id AND de.ended_at IS NULL
         ORDER BY de.started_at DESC LIMIT 1
        ) AS latest_downtime_reason,
        -- lag_pct: DEFER — EGASI QIYMATI KERAK (formula belgilanmagan)
        -- Owner Andon "ortda qolish %" talab qilgan (00-INTERVYU-MOSLIK §79)
        -- Formula tanlanganidan keyin bu yerga qo'shiladi.
        -- Variant A: (planned_quantity - actual_quantity)::float / NULLIF(planned_quantity, 0) * 100
        -- Variant B: vaqt bo'yicha lag
        NULL::numeric AS lag_pct
      FROM production_sessions ps
      WHERE ps.status IN ('active','paused')
      ORDER BY ps.started_at DESC
      LIMIT 50
    `);
    return Ok((rows as { rows?: unknown[] }).rows ?? []);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}
```

---

### QADAM 6: iot-tablet.controller.ts — checklist + alternative-work + andon endpoints

**Fayl:** `apps/api/src/modules/iot/application/iot-tablet.service.ts` da metodlar bor.
Endi controllerga qo'sh.

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts`

Mavjud controller ichida (`IotTabletController` class) qo'shimcha route'lar:

```typescript
// Zod schema'larni fayl tepasiga qo'sh:
const TbChecklistSchema = z.object({
  sessionId:   z.string().min(1),
  confirmedBy: z.number().int().positive(),
  items:       z.array(z.object({
    item:    z.string(),
    checked: z.boolean(),
    note:    z.string().optional(),
  })),
  notes:       z.string().optional(),
});

const SmenaReadySchema = z.object({
  sessionId:    z.string().min(1),
  confirmedBy:  z.number().int().positive(),
  crewComplete: z.boolean(),
  materialsOk:  z.boolean(),
  machineOk:    z.boolean(),
  notes:        z.string().optional(),
});

const AltWorkSchema = z.object({
  sessionId:   z.string().min(1),
  workType:    z.enum(['arching','paddon','cleaning','setup','other']),
  performedBy: z.number().int().positive(),
  quantity:    z.number().optional(),
  notes:       z.string().optional(),
});

// Controller ichida:

@Post('tablet/checklist/tb-confirm')
@Roles(...IOT_WRITE)
@ApiOperation({ summary: 'TB checklist tasdiqla (HR-079/EP-IOT-080)' })
async tbChecklistConfirm(@Body() body: unknown) {
  const dto = TbChecklistSchema.parse(body);
  return unwrapOrThrow(
    await this.svc.confirmTbChecklist(dto.sessionId, dto.confirmedBy, dto.items, dto.notes),
  );
}

@Post('tablet/checklist/smena-ready')
@Roles(...IOT_WRITE)
@ApiOperation({ summary: 'Smena ready tasdiqla (COR-130)' })
async smenaReadyConfirm(@Body() body: unknown) {
  const dto = SmenaReadySchema.parse(body);
  return unwrapOrThrow(
    await this.svc.confirmSmenaReady(
      dto.sessionId, dto.confirmedBy,
      dto.crewComplete, dto.materialsOk, dto.machineOk, dto.notes,
    ),
  );
}

@Get('tablet/checklist/status/:sessionId')
@Roles(...IOT_READ)
@ApiOperation({ summary: 'Sessiya checklist holati (blocker gate check)' })
async checklistStatus(@Param('sessionId') sessionId: string) {
  return unwrapOrThrow(await this.svc.checkSessionChecklists(sessionId));
}

@Post('tablet/alternative-work')
@Roles(...IOT_WRITE)
@ApiOperation({ summary: 'Muqobil ish logi (EP-IOT-059: арчиш/паддон)' })
async logAltWork(@Body() body: unknown) {
  const dto = AltWorkSchema.parse(body);
  return unwrapOrThrow(
    await this.svc.logAlternativeWork(dto.sessionId, dto.workType, dto.performedBy, dto.quantity, dto.notes),
  );
}

@Get('andon/live')
@Roles(...IOT_READ)
@ApiOperation({ summary: 'Andon board — jonli sessiyalar (EP-IOT-021/066)' })
async andonLive() {
  return unwrapOrThrow(await this.svc.getAndonLive());
}
```

**Blocker gate:** Sessiya start endpointida (`POST iot/tablet/sessions/:id/start`)
checklist check qo'sh:

```typescript
// Mavjud start endpoint ichida (satrni toping, pattern: start session):
@Post('tablet/sessions/:id/start')
@Roles(...IOT_WRITE)
async startSession(@Param('id') id: string, @Body() body: unknown) {
  // Checklist gate (EP-IOT-080/COR-130)
  const checkR = await this.svc.checkSessionChecklists(id);
  if (!checkR.ok) throw new InternalServerErrorException(checkR.error);
  if (!checkR.data.tbDone) {
    throw new HttpException(
      { message: 'TB checklist tasdiqlanmagan', code: 'IOT_TB_CHECKLIST_REQUIRED' },
      HttpStatus.FORBIDDEN,
    );
  }
  if (!checkR.data.smenaDone) {
    throw new HttpException(
      { message: 'Smena tayyor cheklisti tasdiqlanmagan', code: 'IOT_SMENA_READY_REQUIRED' },
      HttpStatus.FORBIDDEN,
    );
  }
  // ...existing start logic
}
```

---

### QADAM 7: camera-ai.service.ts — Gemini VLM xona tekshiruvi + 2h cron

**Fayl:** `apps/api/src/modules/iot/application/camera-ai.service.ts`

Mavjud `CameraAiService` classiga qo'sh (Gemini VLM integration):

```typescript
// Import qo'sh:
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

// Constructor ga ConfigService qo'sh:
constructor(
  private readonly repo: DrizzleCameraAiRepo,
  private readonly config: ConfigService,
) {}

// 2 soatlik cron (EP-IOT-010):
@Cron('0 */2 * * *')  // Har 2 soatda
async runRoomInspections(): Promise<void> {
  const zonesR = await this.repo.findActiveZonesWithIdealPhoto();
  if (!zonesR.ok) return;
  for (const zone of zonesR.data) {
    await this.inspectRoom(zone.id, zone.ideal_photo_url, zone.camera_id);
  }
}

async inspectRoom(
  zoneId: number,
  idealPhotoUrl: string | null,
  cameraId: number | null,
): Promise<Result<{ inspectionId: number; score: number }>> {
  try {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    // Gemini VLM chaqiruvi
    const prompt = `Sen zavod xonasini tekshirayotgan AI inspektori.
Ushbu rasmda xonaning hozirgi holatini baholang.
${idealPhotoUrl ? `Ideal holat: ${idealPhotoUrl}` : ''}
JSON formatida qaytaring: {
  "score": 0-100 (100=mukammal),
  "violations": [{"criterion": "string", "description": "string", "severity": "low|medium|high|critical"}]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const fetchModule = await import('node-fetch');
    const fetchFn = fetchModule.default;
    const body = {
      contents: [{
        parts: [{ text: prompt }],
      }],
    };
    const resp = await fetchFn(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    let parsed: { score?: number; violations?: unknown[] } = {};
    try { parsed = JSON.parse(rawText) as typeof parsed; } catch { parsed = { score: 50, violations: [] }; }

    const score = Math.min(100, Math.max(0, Number(parsed.score ?? 50)));
    const violations = Array.isArray(parsed.violations) ? parsed.violations : [];

    // room_inspections INSERT
    const insertRows = await db.execute(sql`
      INSERT INTO room_inspections
        (camera_zone_id, score_0_100, violations, ai_model, prompt_used, raw_response, ideal_url)
      VALUES
        (${zoneId}, ${score}, ${JSON.stringify(violations)}::jsonb,
         'gemini-1.5-flash', ${prompt}, ${rawText}, ${idealPhotoUrl ?? null})
      RETURNING id
    `);
    const insRow = (insertRows as { rows?: unknown[] }).rows?.[0] as { id: number } | undefined;
    if (!insRow) return Err(AppErr('INTERNAL', 'room_inspections INSERT qaytarmadi'));

    // inspection_violations INSERT (har bir violation uchun)
    for (const v of violations) {
      const vv = v as { criterion?: string; description?: string; severity?: string };
      await db.execute(sql`
        INSERT INTO inspection_violations
          (inspection_id, criterion_code, description, severity, status)
        VALUES
          (${insRow.id}, ${vv.criterion ?? 'unknown'}, ${vv.description ?? ''},
           ${vv.severity ?? 'medium'}, 'open')
      `);
    }

    return Ok({ inspectionId: insRow.id, score });
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async resolveViolation(
  violationId: number,
  resolvedByCardId: number,
  notes?: string,
): Promise<Result<{ id: number; status: string }>> {
  try {
    const rows = await db.execute(sql`
      UPDATE inspection_violations
      SET status = 'resolved', resolved_at = NOW(), resolved_by_card_id = ${resolvedByCardId},
          notes = ${notes ?? null}
      WHERE id = ${violationId}
      RETURNING id, status
    `);
    const row = (rows as { rows?: unknown[] }).rows?.[0] as { id: number; status: string } | undefined;
    if (!row) return Err(AppErr('NOT_FOUND', 'Violation topilmadi'));
    return Ok(row);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async escalateViolation(
  violationId: number,
  escalatedToCardId: number,
): Promise<Result<{ id: number; status: string }>> {
  try {
    const rows = await db.execute(sql`
      UPDATE inspection_violations
      SET status = 'escalated', escalated_at = NOW(), escalated_to_card_id = ${escalatedToCardId}
      WHERE id = ${violationId}
      RETURNING id, status
    `);
    const row = (rows as { rows?: unknown[] }).rows?.[0] as { id: number; status: string } | undefined;
    if (!row) return Err(AppErr('NOT_FOUND', 'Violation topilmadi'));
    return Ok(row);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async confirmPpeAlert(
  alertId: number,
  confirmedByCardId: number,
  actionTaken?: string,
): Promise<Result<{ id: number; status: string }>> {
  try {
    const rows = await db.execute(sql`
      UPDATE ppe_alerts
      SET status = 'confirmed', confirmed_by_card_id = ${confirmedByCardId},
          confirmed_at = NOW(), action_taken = ${actionTaken ?? null}
      WHERE id = ${alertId}
      RETURNING id, status
    `);
    const row = (rows as { rows?: unknown[] }).rows?.[0] as { id: number; status: string } | undefined;
    if (!row) return Err(AppErr('NOT_FOUND', 'PPE alert topilmadi'));
    return Ok(row);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async logAttendanceEvent(
  workerCardId: number,
  cameraZoneId: number | null,
  eventType: 'entry' | 'exit' | 'workspace_arrival' | 'workspace_departure',
  photoUrl?: string,
  aiConfidence?: number,
): Promise<Result<{ id: number }>> {
  try {
    const rows = await db.execute(sql`
      INSERT INTO attendance_camera_log
        (worker_card_id, camera_zone_id, event_type, photo_url, ai_confidence)
      VALUES
        (${workerCardId}, ${cameraZoneId ?? null}, ${eventType},
         ${photoUrl ?? null}, ${aiConfidence ?? null})
      RETURNING id
    `);
    const row = (rows as { rows?: unknown[] }).rows?.[0] as { id: number } | undefined;
    if (!row) return Err(AppErr('INTERNAL', 'attendance_camera_log INSERT qaytarmadi'));
    return Ok({ id: row.id });
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async getRoomInspectionHistory(
  zoneId: number,
  limit = 10,
): Promise<Result<unknown[]>> {
  try {
    const rows = await db.execute(sql`
      SELECT ri.id, ri.camera_zone_id, ri.inspected_at, ri.score_0_100,
             ri.violations, ri.ai_model, ri.created_at,
             cz.zone_name, cz.zone_type
      FROM room_inspections ri
      LEFT JOIN camera_zones cz ON cz.id = ri.camera_zone_id
      WHERE ri.camera_zone_id = ${zoneId}
      ORDER BY ri.inspected_at DESC
      LIMIT ${limit}
    `);
    return Ok((rows as { rows?: unknown[] }).rows ?? []);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async getPpeAlerts(
  status: string | undefined,
  limit = 50,
): Promise<Result<unknown[]>> {
  try {
    const cond = status ? sql`WHERE pa.status = ${status}` : sql``;
    const rows = await db.execute(sql`
      SELECT pa.id, pa.camera_zone_id, pa.detected_at, pa.worker_card_id,
             pa.violation_type, pa.photo_url, pa.ai_confidence,
             pa.confirmed_by_card_id, pa.confirmed_at, pa.action_taken,
             pa.status, cz.zone_name
      FROM ppe_alerts pa
      LEFT JOIN camera_zones cz ON cz.id = pa.camera_zone_id
      ${cond}
      ORDER BY pa.detected_at DESC
      LIMIT ${limit}
    `);
    return Ok((rows as { rows?: unknown[] }).rows ?? []);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

async getAttendanceCameraLog(
  workerCardId: number | undefined,
  limit = 100,
): Promise<Result<unknown[]>> {
  try {
    const cond = workerCardId ? sql`WHERE acl.worker_card_id = ${workerCardId}` : sql``;
    const rows = await db.execute(sql`
      SELECT acl.id, acl.worker_card_id, acl.camera_zone_id, acl.detected_at,
             acl.event_type, acl.ai_confidence, acl.photo_url, acl.verified,
             cz.zone_name
      FROM attendance_camera_log acl
      LEFT JOIN camera_zones cz ON cz.id = acl.camera_zone_id
      ${cond}
      ORDER BY acl.detected_at DESC
      LIMIT ${limit}
    `);
    return Ok((rows as { rows?: unknown[] }).rows ?? []);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}
```

---

### QADAM 8: camera-ai.controller.ts — yangi endpoints

**Fayl:** `apps/api/src/modules/iot/presentation/camera-ai.controller.ts`

Mavjud controller'ga qo'sh:

```typescript
// Zod schemalar:
const InspectRoomSchema = z.object({
  zoneId: z.number().int().positive(),
});
const ResolveViolationSchema = z.object({
  resolvedByCardId: z.number().int().positive(),
  notes: z.string().optional(),
});
const EscalateViolationSchema = z.object({
  escalatedToCardId: z.number().int().positive(),
});
const ConfirmPpeSchema = z.object({
  alertId:            z.number().int().positive(),
  confirmedByCardId:  z.number().int().positive(),
  actionTaken:        z.string().optional(),
});
const LogAttendanceSchema = z.object({
  workerCardId:  z.number().int().positive(),
  cameraZoneId:  z.number().int().positive().nullable(),
  eventType:     z.enum(['entry','exit','workspace_arrival','workspace_departure']),
  photoUrl:      z.string().url().optional(),
  aiConfidence:  z.number().int().min(0).max(100).optional(),
});

// Endpoints (CameraAiController class ichida):

@Post('room-inspect')
@Roles(...CAM_WRITE)
@ApiOperation({ summary: 'Xona tekshiruvi boshlash (EP-IOT-010) — Gemini VLM' })
async inspectRoom(@Body() body: unknown) {
  const dto = InspectRoomSchema.parse(body);
  return unwrapOrThrow(await this.svc.inspectRoom(dto.zoneId, null, null));
}

@Get('room-inspections/:zoneId')
@Roles(...CAM_READ)
@ApiOperation({ summary: 'Xona tekshiruv tarixi' })
async getRoomInspections(
  @Param('zoneId') zoneId: string,
  @Query('limit') limit?: string,
) {
  return unwrapOrThrow(await this.svc.getRoomInspectionHistory(+zoneId, limit ? +limit : 10));
}

@Put('violations/:id/resolve')
@Roles(...CAM_WRITE)
@ApiOperation({ summary: 'Violation yopish (EP-IOT-012)' })
async resolveViolation(@Param('id') id: string, @Body() body: unknown) {
  const dto = ResolveViolationSchema.parse(body);
  return unwrapOrThrow(await this.svc.resolveViolation(+id, dto.resolvedByCardId, dto.notes));
}

@Put('violations/:id/escalate')
@Roles(...CAM_WRITE)
@ApiOperation({ summary: 'Violation escalate (EP-IOT-012)' })
async escalateViolation(@Param('id') id: string, @Body() body: unknown) {
  const dto = EscalateViolationSchema.parse(body);
  return unwrapOrThrow(await this.svc.escalateViolation(+id, dto.escalatedToCardId));
}

@Get('ppe-alerts')
@Roles(...CAM_READ)
@ApiOperation({ summary: 'PPE alerts (EP-IOT-077)' })
async getPpeAlerts(@Query('status') status?: string, @Query('limit') limit?: string) {
  return unwrapOrThrow(await this.svc.getPpeAlerts(status, limit ? +limit : 50));
}

@Put('ppe-alerts/confirm')
@Roles(...CAM_WRITE)
@ApiOperation({ summary: 'PPE alert E1 tasdiqlash (EP-IOT-078)' })
async confirmPpe(@Body() body: unknown) {
  const dto = ConfirmPpeSchema.parse(body);
  return unwrapOrThrow(await this.svc.confirmPpeAlert(dto.alertId, dto.confirmedByCardId, dto.actionTaken));
}

@Post('attendance/log')
@Roles(...CAM_WRITE)
@ApiOperation({ summary: 'Kamera orqali davomat logi (Q108)' })
async logAttendance(@Body() body: unknown) {
  const dto = LogAttendanceSchema.parse(body);
  return unwrapOrThrow(
    await this.svc.logAttendanceEvent(dto.workerCardId, dto.cameraZoneId, dto.eventType, dto.photoUrl, dto.aiConfidence),
  );
}

@Get('attendance/log')
@Roles(...CAM_READ)
@ApiOperation({ summary: 'Davomat kamera logi ro\'yxati' })
async getAttendanceLog(
  @Query('worker_card_id') workerCardId?: string,
  @Query('limit') limit?: string,
) {
  return unwrapOrThrow(
    await this.svc.getAttendanceCameraLog(workerCardId ? +workerCardId : undefined, limit ? +limit : 100),
  );
}
```

---

### QADAM 9: GSD bridge — MesCompletedEvent handler

**Fayl:** `apps/api/src/modules/iot/infrastructure/event-handlers/anomaly-detected.handler.ts`

Yangi handler SHU FAYLGA qo'shimcha class sifatida QO'SH (Q-46: anomaly handler o'chirilmaydi):

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
// MesCompletedEvent import kerak — lekin bu boshqa modul fayli:
// apps/api/src/modules/mes/domain/events/mes-completed.event.ts
// Q-6 qoidasi: boshqa moduldan import qilishdan avval — fayl mavjudligini tekshir:
// grep -r "MesCompletedEvent" apps/api/src/modules/mes/
// Agar topilsa, import yo'lini aniqla.

// MUHIM: MesCompletedEvent import yo'li quyidagi pattern:
// import { MesCompletedEvent } from '../../mes/domain/events/mes-completed.event';
// Agar bu fayl yo'q bo'lsa yoki path noto'g'ri bo'lsa — TO'XTA va flag qil.

@Injectable()
@EventsHandler(/* MesCompletedEvent — import yo'lini tekshirib to'g'irla */)
export class GsdWriteHandler implements IEventHandler</* MesCompletedEvent */> {
  private readonly logger = new Logger(GsdWriteHandler.name);

  async handle(event: /* MesCompletedEvent */ any): Promise<void> {
    // GSD yozish: card_gsd_log INSERT
    try {
      const cardId = event.cardId ?? event.operatorCardId;
      const sessionId = event.sessionId;
      const smena = event.smena ?? 'A';
      const actualQty = event.actualQuantity ?? 0;
      const normaQty = event.normaQuantity ?? event.plannedQuantity ?? 0;
      const efficiency = normaQty > 0 ? Math.round((actualQty / normaQty) * 100) : 0;

      if (!cardId || !sessionId) return;

      // card_gsd_log — 3 metric
      for (const [code, value] of [
        ['GSD_OUTPUT', actualQty],
        ['GSD_NORMA', normaQty],
        ['GSD_EFFICIENCY', efficiency],
      ] as [string, number][]) {
        await db.execute(sql`
          INSERT INTO card_gsd_log (card_id, date, smena, metric_code, value, session_id)
          VALUES (${cardId}, CURRENT_DATE, ${smena}, ${code}, ${value}, ${sessionId})
          ON CONFLICT (card_id, date, smena, metric_code) DO UPDATE
          SET value = EXCLUDED.value
        `);
      }

      // OEE snapshot write
      await db.execute(sql`
        INSERT INTO oee_snapshots
          (session_id, availability, performance, quality, oee_score, source_session_id, calculated_at)
        VALUES
          (${sessionId},
           ${event.availability ?? 0.85},
           ${event.performance ?? (normaQty > 0 ? Math.min(1, actualQty / normaQty) : 0)},
           ${event.quality ?? 0.97},
           ${event.oee ?? 0.8},
           ${sessionId},
           NOW())
        ON CONFLICT DO NOTHING
      `);

      this.logger.log({ cardId, sessionId, smena }, 'GSD va OEE snapshot yozildi');
    } catch (e) {
      this.logger.error('GSD handler xatosi: ' + String(e));
    }
  }
}
```

**iot.module.ts ga qo'sh:**

```typescript
// Import qo'sh:
import { GsdWriteHandler } from './infrastructure/event-handlers/anomaly-detected.handler';
import { ScheduleModule } from '@nestjs/schedule';

// @Module imports:
imports: [AuthModule, CqrsModule, NotificationsModule, ScheduleModule.forFeature()],

// eventHandlers arrayiga qo'sh:
const eventHandlers = [AnomalyDetectedHandler, GsdWriteHandler];
```

---

### QADAM 10: drizzle-iot-main.repo.ts — GSD summary endpoint

**Fayl:** `apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-main.repo.ts`

Repo classiga qo'sh:

```typescript
async findGsdSummary(cardId: number | undefined, date: string | undefined) {
  try {
    const cond = cardId
      ? (date ? sql`WHERE gl.card_id = ${cardId} AND gl.date::date = ${date}::date`
              : sql`WHERE gl.card_id = ${cardId}`)
      : (date ? sql`WHERE gl.date::date = ${date}::date` : sql``);
    const rows = await exec(sql`
      SELECT gl.card_id, gl.date, gl.smena, gl.metric_code, gl.value,
             gl.excluded_downtime_min, gl.session_id, gl.created_at
      FROM card_gsd_log gl
      ${cond}
      ORDER BY gl.date DESC, gl.card_id, gl.smena
      LIMIT 200
    `);
    return Ok(rows);
  } catch (e) { return Err((e as Error).message); }
}

async findDowntimePareto(machineId: string | undefined, days: number) {
  try {
    const cond = machineId ? sql`AND de.machine_id = ${machineId}` : sql``;
    const rows = await exec(sql`
      SELECT de.reason_code, drc.name_uz, drc.name_ru, drc.category,
             COUNT(*) AS total_count,
             SUM(EXTRACT(EPOCH FROM (COALESCE(de.ended_at, NOW()) - de.started_at))/60) AS total_minutes
      FROM downtime_events de
      LEFT JOIN downtime_reason_codes drc ON drc.code = de.reason_code
      WHERE de.started_at >= NOW() - (${days} || ' days')::INTERVAL
      ${cond}
      GROUP BY de.reason_code, drc.name_uz, drc.name_ru, drc.category
      ORDER BY total_minutes DESC
      LIMIT 20
    `);
    return Ok(rows);
  } catch (e) { return Err((e as Error).message); }
}
```

---

### QADAM 11: FE sahifalari

#### TbChecklist.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/iot/TbChecklist.tsx`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EPPageHeader, EPLoader } from '@/components/ep';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const TB_ITEMS = [
  { id: 'materials', label: 'Materiallar tekshirildi' },
  { id: 'machine_clean', label: 'Mashina tozalandi' },
  { id: 'tools_ready', label: 'Asboblar tayyor' },
  { id: 'safety_check', label: 'Xavfsizlik tekshirildi' },
  { id: 'crew_present', label: 'Jamoa to\'liq' },
];

export default function TbChecklist() {
  const qc = useQueryClient();
  const sessionId = new URLSearchParams(window.location.search).get('session_id') ?? '';
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['/api/iot/tablet/checklist/status', sessionId],
    queryFn: () => apiRequest('GET', `/api/iot/tablet/checklist/status/${sessionId}`),
    enabled: !!sessionId,
  });

  const confirmMut = useMutation({
    mutationFn: (items: { item: string; checked: boolean }[]) =>
      apiRequest('POST', '/api/iot/tablet/checklist/tb-confirm', {
        sessionId,
        confirmedBy: 1, // TODO: current user card_id from auth context
        items,
      }),
    onSuccess: () => {
      toast({ title: 'TB checklist tasdiqlandi' });
      qc.invalidateQueries({ queryKey: ['/api/iot/tablet/checklist/status', sessionId] });
    },
    onError: () => toast({ title: 'Xatolik', variant: 'destructive' }),
  });

  if (isLoading) return <EPLoader />;
  const status = statusData as { tbDone?: boolean } | undefined;
  const allChecked = TB_ITEMS.every(i => checked[i.id]);

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader title="TB Checklist" subtitle="Ish boshlashdan oldin tekshiruv" />
      {status?.tbDone ? (
        <Card className="border-green-500">
          <CardContent className="p-4 text-green-700">TB checklist tasdiqlangan ✓</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Tekshiruv ro'yxati</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {TB_ITEMS.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <Checkbox
                  id={item.id}
                  checked={!!checked[item.id]}
                  onCheckedChange={v => setChecked(prev => ({ ...prev, [item.id]: !!v }))}
                />
                <label htmlFor={item.id}>{item.label}</label>
              </div>
            ))}
            <Button
              disabled={!allChecked || confirmMut.isPending}
              onClick={() => confirmMut.mutate(TB_ITEMS.map(i => ({ item: i.id, checked: !!checked[i.id] })))}
            >
              Tasdiqlash
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

#### SmenaReadyChecklist.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/iot/SmenaReadyChecklist.tsx`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { EPPageHeader, EPLoader } from '@/components/ep';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function SmenaReadyChecklist() {
  const qc = useQueryClient();
  const sessionId = new URLSearchParams(window.location.search).get('session_id') ?? '';
  const [crew, setCrew] = useState(false);
  const [materials, setMaterials] = useState(false);
  const [machine, setMachine] = useState(false);

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['/api/iot/tablet/checklist/status', sessionId],
    queryFn: () => apiRequest('GET', `/api/iot/tablet/checklist/status/${sessionId}`),
    enabled: !!sessionId,
  });

  const confirmMut = useMutation({
    mutationFn: () =>
      apiRequest('POST', '/api/iot/tablet/checklist/smena-ready', {
        sessionId,
        confirmedBy: 1,
        crewComplete: crew,
        materialsOk: materials,
        machineOk: machine,
      }),
    onSuccess: () => {
      toast({ title: 'Smena tayyor tasdiqlandi' });
      qc.invalidateQueries({ queryKey: ['/api/iot/tablet/checklist/status', sessionId] });
    },
    onError: () => toast({ title: 'Xatolik', variant: 'destructive' }),
  });

  if (isLoading) return <EPLoader />;
  const status = statusData as { smenaDone?: boolean } | undefined;

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader title="Smena Tayyor Cheklisti" subtitle="COR-130" />
      {status?.smenaDone ? (
        <Card className="border-green-500">
          <CardContent className="p-4 text-green-700">Smena ready tasdiqlangan ✓</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Smena tayyor holati</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Jamoa to\'liq', value: crew, onChange: setCrew },
              { label: 'Materiallar tayyor', value: materials, onChange: setMaterials },
              { label: 'Mashina tayyor', value: machine, onChange: setMachine },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <span>{label}</span>
                <Switch checked={value} onCheckedChange={onChange} />
              </div>
            ))}
            <Button
              disabled={!crew || !materials || !machine || confirmMut.isPending}
              onClick={() => confirmMut.mutate()}
            >
              Tasdiqlash
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

#### AndonBoard.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/iot/AndonBoard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader, EPKpiCard, EPLoader } from '@/components/ep';
import { EPStatusPill } from '@/components/ep';
import { Badge } from '@/components/ui/badge';

type AndonSession = {
  session_id: string;
  status: string;
  machine_id: number | null;
  order_id: string | null;
  actual_quantity: number | null;
  planned_quantity: number | null;
  started_at: string | null;
  smena_type: string | null;
  active_downtime_count: number;
  latest_downtime_reason: string | null;
  lag_pct: number | null; // DEFER: formula belgilanmagan (00-INTERVYU-MOSLIK §79); hozir null
};

export default function AndonBoard() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/iot/andon/live'],
    queryFn: () => apiRequest('GET', '/api/iot/andon/live'),
    refetchInterval: 10_000, // 10 sekund yangilanish
  });

  if (isLoading) return <EPLoader />;
  const sessions: AndonSession[] = Array.isArray(data) ? data : [];

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader title="Andon Board" subtitle="Jonli ishlab chiqarish holati" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map(s => (
          <div key={s.session_id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Mashina #{s.machine_id}</span>
              <EPStatusPill
                status={s.status === 'active' ? 'success' : s.active_downtime_count > 0 ? 'error' : 'warning'}
                label={s.status}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Buyurtma: {s.order_id ?? '—'} | Smena: {s.smena_type ?? '—'}
            </div>
            <div className="flex gap-2 text-sm">
              <span>Fact: <strong>{s.actual_quantity ?? 0}</strong></span>
              <span>Plan: <strong>{s.planned_quantity ?? 0}</strong></span>
              {/* lag_pct: DEFER — formula egasi belgilaydi (00-INTERVYU-MOSLIK §79) */}
              <span>Lag: <strong>{s.lag_pct != null ? `${s.lag_pct}%` : '—'}</strong></span>
            </div>
            {s.active_downtime_count > 0 && (
              <Badge variant="destructive">
                Downtime: {s.latest_downtime_reason ?? 'sabab ko\'rsatilmagan'}
              </Badge>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="col-span-3 text-center text-muted-foreground py-8">
            Hozir faol sessiya yo'q
          </div>
        )}
      </div>
    </div>
  );
}
```

#### IotDashboard.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/iot/IotDashboard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader, EPKpiCard, EPLoader } from '@/components/ep';

export default function IotDashboard() {
  const { data: dashboard, isLoading: dl } = useQuery({
    queryKey: ['/api/iot/dashboard'],
    queryFn: () => apiRequest('GET', '/api/iot/dashboard'),
  });
  const { data: alerts } = useQuery({
    queryKey: ['/api/iot/alerts'],
    queryFn: () => apiRequest('GET', '/api/iot/alerts?status=active&limit=5'),
  });
  const { data: andon } = useQuery({
    queryKey: ['/api/iot/andon/live'],
    queryFn: () => apiRequest('GET', '/api/iot/andon/live'),
    refetchInterval: 15_000,
  });
  const { data: cameraSummary } = useQuery({
    queryKey: ['/api/camera-ai/summary'],
    queryFn: () => apiRequest('GET', '/api/camera-ai/summary'),
  });
  const { data: ppeAlerts } = useQuery({
    queryKey: ['/api/camera-ai/ppe-alerts', 'pending'],
    queryFn: () => apiRequest('GET', '/api/camera-ai/ppe-alerts?status=pending&limit=5'),
  });

  if (dl) return <EPLoader />;

  const d = dashboard as Record<string, unknown> | undefined;
  const cam = cameraSummary as { open_violations?: number; active_cameras?: number } | undefined;
  const andonList = Array.isArray(andon) ? andon : [];
  const ppeList = Array.isArray(ppeAlerts) ? ppeAlerts : [];
  const alertList = Array.isArray(alerts) ? alerts : (alerts as { data?: unknown[] } | undefined)?.data ?? [];

  return (
    <div className="p-4 space-y-6">
      <EPPageHeader title="IoT Dashboard" subtitle="Zavod monitoring" />

      {/* 6 widget */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <EPKpiCard
          title="Faol sensorlar"
          value={String(d?.active_sensors ?? 0)}
          subtitle="iot_sensors"
        />
        <EPKpiCard
          title="Faol sessiyalar"
          value={String(andonList.length)}
          subtitle="ishlab chiqarish"
        />
        <EPKpiCard
          title="Ochiq ogohlantirishlar"
          value={String(alertList.length)}
          subtitle="iot_alerts"
          className={alertList.length > 0 ? 'border-red-300' : ''}
        />
        <EPKpiCard
          title="Kamera buzilishlari"
          value={String(cam?.open_violations ?? 0)}
          subtitle="camera_ai"
          className={(cam?.open_violations ?? 0) > 0 ? 'border-orange-300' : ''}
        />
        <EPKpiCard
          title="PPE kutmoqda"
          value={String(ppeList.length)}
          subtitle="E1 tasdiq kerak"
          className={ppeList.length > 0 ? 'border-yellow-300' : ''}
        />
        <EPKpiCard
          title="Faol kameralar"
          value={String(cam?.active_cameras ?? 0)}
          subtitle="cameras"
        />
      </div>
    </div>
  );
}
```

#### CameraInspection.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/iot/CameraInspection.tsx`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader, EPLoader } from '@/components/ep';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

type Violation = {
  id: number;
  criterion_code: string;
  description: string;
  severity: string;
  status: string;
  due_date: string | null;
};

type Inspection = {
  id: number;
  camera_zone_id: number;
  inspected_at: string;
  score_0_100: number;
  zone_name: string;
  violations: Violation[];
};

export default function CameraInspection() {
  const qc = useQueryClient();
  const zoneId = new URLSearchParams(window.location.search).get('zone_id') ?? '1';

  const { data, isLoading } = useQuery({
    queryKey: ['/api/camera-ai/room-inspections', zoneId],
    queryFn: () => apiRequest('GET', `/api/camera-ai/room-inspections/${zoneId}?limit=10`),
  });

  const inspectMut = useMutation({
    mutationFn: () =>
      apiRequest('POST', '/api/camera-ai/room-inspect', { zoneId: +zoneId }),
    onSuccess: () => {
      toast({ title: 'Tekshiruv boshlandi — Gemini VLM ishlamoqda' });
      qc.invalidateQueries({ queryKey: ['/api/camera-ai/room-inspections', zoneId] });
    },
    onError: () => toast({ title: 'Tekshiruv xatosi', variant: 'destructive' }),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, cardId }: { id: number; cardId: number }) =>
      apiRequest('PUT', `/api/camera-ai/violations/${id}/resolve`, { resolvedByCardId: cardId }),
    onSuccess: () => {
      toast({ title: 'Violation yopildi' });
      qc.invalidateQueries({ queryKey: ['/api/camera-ai/room-inspections', zoneId] });
    },
    onError: () => toast({ title: 'Xatolik', variant: 'destructive' }),
  });

  if (isLoading) return <EPLoader />;
  const inspections: Inspection[] = Array.isArray(data) ? data : [];

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader
        title="Kamera Xona Tekshiruvi"
        subtitle="Gemini VLM AI — EP-IOT-010"
        actions={
          <Button onClick={() => inspectMut.mutate()} disabled={inspectMut.isPending}>
            Yangi tekshiruv
          </Button>
        }
      />
      <div className="space-y-4">
        {inspections.map(ins => (
          <Card key={ins.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{ins.zone_name} — Ball: {ins.score_0_100}/100</span>
                <Badge variant={ins.score_0_100 >= 80 ? 'default' : ins.score_0_100 >= 60 ? 'secondary' : 'destructive'}>
                  {ins.score_0_100 >= 80 ? 'Yaxshi' : ins.score_0_100 >= 60 ? 'O\'rtacha' : 'Yomon'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(Array.isArray(ins.violations) ? ins.violations : []).map(v => (
                  <div key={v.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <Badge variant={v.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {v.severity}
                      </Badge>
                      <span className="ml-2 text-sm">{v.description}</span>
                    </div>
                    {v.status === 'open' && (
                      <Button
                        size="sm"
                        onClick={() => resolveMut.mutate({ id: v.id, cardId: 1 })}
                        disabled={resolveMut.isPending}
                      >
                        Yopish
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### PpeAlerts.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/iot/PpeAlerts.tsx`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader, EPLoader } from '@/components/ep';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EPStatusPill } from '@/components/ep';
import { toast } from '@/hooks/use-toast';

type PpeAlert = {
  id: number;
  detected_at: string;
  violation_type: string;
  zone_name: string | null;
  status: string;
  ai_confidence: number | null;
  confirmed_by_card_id: number | null;
};

export default function PpeAlerts() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/camera-ai/ppe-alerts'],
    queryFn: () => apiRequest('GET', '/api/camera-ai/ppe-alerts?status=pending&limit=50'),
    refetchInterval: 30_000,
  });

  const confirmMut = useMutation({
    mutationFn: ({ alertId, cardId, action }: { alertId: number; cardId: number; action: string }) =>
      apiRequest('PUT', '/api/camera-ai/ppe-alerts/confirm', {
        alertId,
        confirmedByCardId: cardId,
        actionTaken: action,
      }),
    onSuccess: () => {
      toast({ title: 'PPE alert tasdiqlandi (E1)' });
      qc.invalidateQueries({ queryKey: ['/api/camera-ai/ppe-alerts'] });
    },
    onError: () => toast({ title: 'Xatolik', variant: 'destructive' }),
  });

  if (isLoading) return <EPLoader />;
  const alerts: PpeAlert[] = Array.isArray(data) ? data : [];

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader
        title="PPE Ogohlantirishlar"
        subtitle="E1: AI kuzatadi, inson tasdiqlaydi — EP-IOT-077/078"
      />
      {alerts.length === 0 && (
        <p className="text-muted-foreground text-center py-8">Kutayotgan PPE alert yo'q</p>
      )}
      <div className="space-y-3">
        {alerts.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{a.violation_type}</Badge>
                  <span className="text-sm text-muted-foreground">{a.zone_name ?? '—'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.detected_at).toLocaleString('uz-UZ')}
                  {a.ai_confidence ? ` | Ishonch: ${a.ai_confidence}%` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <EPStatusPill
                  status={a.status === 'pending' ? 'warning' : 'success'}
                  label={a.status}
                />
                {a.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => confirmMut.mutate({ alertId: a.id, cardId: 1, action: 'Ogohlantirish berildi' })}
                    disabled={confirmMut.isPending}
                  >
                    Tasdiqlash
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### AttendanceCamera.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/iot/AttendanceCamera.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader, EPLoader } from '@/components/ep';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type AttEvent = {
  id: number;
  worker_card_id: number;
  detected_at: string;
  event_type: string;
  zone_name: string | null;
  ai_confidence: number | null;
};

const EVENT_COLOR: Record<string, 'default' | 'secondary' | 'destructive'> = {
  entry: 'default',
  exit: 'secondary',
  workspace_arrival: 'default',
  workspace_departure: 'secondary',
};

export default function AttendanceCamera() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/camera-ai/attendance/log'],
    queryFn: () => apiRequest('GET', '/api/camera-ai/attendance/log?limit=100'),
    refetchInterval: 20_000,
  });

  if (isLoading) return <EPLoader />;
  const events: AttEvent[] = Array.isArray(data) ? data : [];

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader
        title="Kamera Davomat Logi"
        subtitle="Q108: kirish/chiqish/ish joyi — event-based"
      />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {events.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Badge variant={EVENT_COLOR[e.event_type] ?? 'secondary'}>
                    {e.event_type}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">Karta #{e.worker_card_id}</div>
                    <div className="text-xs text-muted-foreground">{e.zone_name ?? '—'}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <div>{new Date(e.detected_at).toLocaleString('uz-UZ')}</div>
                  {e.ai_confidence && <div>AI: {e.ai_confidence}%</div>}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Log bo'sh</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### QADAM 12: iot.module.ts — ScheduleModule va GsdWriteHandler

**Fayl:** `apps/api/src/modules/iot/iot.module.ts`

```typescript
// OLDIN (satr 8-9):
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// KEYIN:
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';

// GsdWriteHandler import (satr 14 yoniga):
import { AnomalyDetectedHandler } from './infrastructure/event-handlers/anomaly-detected.handler';
import { GsdWriteHandler } from './infrastructure/event-handlers/anomaly-detected.handler';

// eventHandlers array (satr 63):
// OLDIN:
const eventHandlers = [AnomalyDetectedHandler];
// KEYIN:
const eventHandlers = [AnomalyDetectedHandler, GsdWriteHandler];

// @Module imports (satr 98):
// OLDIN:
imports: [AuthModule, CqrsModule, NotificationsModule],
// KEYIN:
imports: [AuthModule, CqrsModule, NotificationsModule, ScheduleModule.forFeature()],
```

---

### QADAM 13: drizzle-camera-ai.repo.ts — findActiveZonesWithIdealPhoto

**Fayl:** `apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts`

Mavjud class ichiga qo'sh:

```typescript
async findActiveZonesWithIdealPhoto() {
  try {
    const rows = await (db as unknown as { execute: (q: unknown) => Promise<{ rows?: unknown[] }> })
      .execute(sql`
        SELECT cz.id, cz.zone_name, cz.zone_type, cz.camera_id,
               cz.ideal_photo_url, c.rtsp_url
        FROM camera_zones cz
        LEFT JOIN cameras c ON c.id::text = cz.camera_id
        WHERE cz.is_active = true
        ORDER BY cz.id
        LIMIT 50
      `);
    return Ok((rows.rows ?? []) as Array<{
      id: number;
      zone_name: string;
      zone_type: string;
      camera_id: string | null;
      ideal_photo_url: string | null;
    }>);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}
```

---

## 5. DDL

Uchta migration fayl § 4 da to'liq yozilgan. Quyida xulosa:

| Fayl | Jadvallar | Maqsad |
|------|-----------|--------|
| `add-tablet-checklist-defect-codes.sql` | ~~machines (P44 kanonik — P45 da YO'Q)~~, production_sessions ALTER (smena cols), tb_checklist_confirmations, smena_ready_confirmations, defect_reason_codes (8 seed), downtime_reason_codes (10 seed), alternative_work_log, machine_maintenance_logs\*, norma_change_log\* | Checklist gate + reason seed |
| `add-card-gsd-log.sql` | card_gsd_log, oee_snapshots ALTER | GSD bridge |
| `add-camera-inspection-tables.sql` | camera_zones ALTER (ideal_photo_url), room_inspections, inspection_violations, ppe_alerts, attendance_camera_log | Camera AI tables |

\* `machine_maintenance_logs` va `norma_change_log` jadvallari `machines.id` FK talab qiladi — P44 migration APPROVED va ishga tushirilgan bo'lishi shart.

**Barcha fayllar `-- APPROVED: <ism> <sana>` satrini kutmoqda.**

---

## 6. QABUL MEZONI

- [ ] `GET /api/iot/energy-consumption` → 501 `{ code: 'EP-IOT-ENERGY-SEX-METER', phase: 'sex_meter' }` (Owner: sex hisoblagich fazasi, EP-IOT-018/030)
- [ ] `POST /api/iot/tablet/checklist/tb-confirm` → 201 + DB INSERT (SELECT COUNT(*) FROM tb_checklist_confirmations WHERE session_id=X = 1)
- [ ] `POST /api/iot/tablet/checklist/smena-ready` → 201 + DB INSERT
- [ ] `POST /api/iot/tablet/sessions/:id/start` → 403 agar checklist yo'q
- [ ] `GET /api/iot/tablet/checklist/status/:id` → `{tbDone: true/false, smenaDone: true/false}`
- [ ] `downtime_reason_codes`: SELECT COUNT(*) = 10 (kitob kodi)
- [ ] `defect_reason_codes`: SELECT COUNT(*) = 8
- [ ] `machines`: P44 migration APPROVED bo'lsa SELECT COUNT(*) >= 27 (P44 seed); P45 bu jadvalga seed QILMAYDI
- [ ] `POST /api/iot/tablet/alternative-work` → 201 + DB INSERT (alternative_work_log)
- [ ] `GET /api/iot/andon/live` → 200, array (production_sessions.status IN ('active','paused'))
- [ ] `POST /api/camera-ai/room-inspect` → 201, room_inspections INSERT, inspection_violations INSERT (agar violations bor)
- [ ] `GET /api/camera-ai/room-inspections/:zoneId` → 200, array
- [ ] `PUT /api/camera-ai/violations/:id/resolve` → 200, status='resolved'
- [ ] `PUT /api/camera-ai/violations/:id/escalate` → 200, status='escalated'
- [ ] `GET /api/camera-ai/ppe-alerts` → 200, array
- [ ] `PUT /api/camera-ai/ppe-alerts/confirm` → 200, confirmed_by_card_id to'ldirilgan (E1)
- [ ] `POST /api/camera-ai/attendance/log` → 201 + DB INSERT (attendance_camera_log)
- [ ] `GET /api/camera-ai/attendance/log` → 200, array
- [ ] GsdWriteHandler: MesCompletedEvent → card_gsd_log 3 qator INSERT (DB-proof)
- [ ] `IOT_READ` va `IOT_WRITE` da 'operator' roli bor
- [ ] TbChecklist.tsx, SmenaReadyChecklist.tsx, AndonBoard.tsx, IotDashboard.tsx, CameraInspection.tsx, PpeAlerts.tsx, AttendanceCamera.tsx — RENDER (FE tsc 0)
- [ ] BE tsc 0: `pnpm --filter @europrint/api exec tsc --noEmit`
- [ ] FE tsc 0: `pnpm --filter erp-dashboard exec tsc --noEmit`
- [ ] Oltin zanjir no-regress: `GET /api/iot/dashboard` → 200
- [ ] `GET /api/iot/alerts?status=active` → 200

---

## 7. SELF-VERIFY

```bash
# 1. BE typecheck
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -20

# 2. FE typecheck
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | tail -20

# 3. Energy → 501 sex-meter faza (EP-IOT-018/030 owner override)
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/iot/energy-consumption
# Kutilayotgan: 501

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/iot/energy-consumption | jq .code
# Kutilayotgan: "EP-IOT-ENERGY-SEX-METER"

# 4. Andon live
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/iot/andon/live | head -c 200

# 5. Checklist status (hali tasdiqlanmagan)
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/iot/tablet/checklist/status/test-session-001
# Kutilayotgan: {"tbDone":false,"smenaDone":false}

# 6. DB-proof: reason codes
# docker exec <postgres-container> psql -U europrint europrint -c \
#   "SELECT COUNT(*) FROM downtime_reason_codes; SELECT COUNT(*) FROM defect_reason_codes;"
# Kutilayotgan: 10 va 8

# 7. DB-proof: machines (P44 seed)
# P45 machines seed QILMAYDI — P44 migration APPROVED va ishga tushirilgan bo'lsa:
# docker exec <postgres-container> psql -U europrint europrint -c \
#   "SELECT COUNT(*) FROM machines;"
# Kutilayotgan: >= 27 (P44 dan: SM-52, KBA-105, Тигель 1-10 va boshqalar)

# 8. TB checklist confirm + start gate
# POST /api/iot/tablet/checklist/tb-confirm → 201
# POST /api/iot/tablet/sessions/test-001/start → 403 (smena-ready yo'q)
# POST /api/iot/tablet/checklist/smena-ready → 201
# POST /api/iot/tablet/sessions/test-001/start → bu safar ruxsat berilishi kerak

# 9. PPE alert E1 confirm
# GET /api/camera-ai/ppe-alerts?status=pending → array
# PUT /api/camera-ai/ppe-alerts/confirm {alertId:1, confirmedByCardId:1} → 200

# 10. Reviewer skriptlar
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-array-safety.sh
bash scripts/reviewer-jwt-guard.sh
```

---

## 8. COMMIT

```bash
# Migration fayllar (egasi APPROVED qo'shgandan keyin):
git add apps/migrations/add-tablet-checklist-defect-codes.sql
git add apps/migrations/add-card-gsd-log.sql
git add apps/migrations/add-camera-inspection-tables.sql
git commit -m "feat(iot/P45): DDL migrations — machines+checklist+gsd+camera-inspection [GATED]"

# Schema
git add lib/db/src/schema/iot-schema.ts
git add lib/db/src/schema/pp/pp-enhanced.ts
git commit -m "feat(iot/P45): Drizzle schema — checklist/gsd/camera/ppe/attendance tables"

# BE
git add apps/api/src/modules/iot/application/iot-tablet.service.ts
git add apps/api/src/modules/iot/application/camera-ai.service.ts
git add apps/api/src/modules/iot/application/iot-main.service.ts
git add apps/api/src/modules/iot/infrastructure/repositories/drizzle-camera-ai.repo.ts
git add apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-main.repo.ts
git add apps/api/src/modules/iot/infrastructure/event-handlers/anomaly-detected.handler.ts
git add apps/api/src/modules/iot/presentation/camera-ai.controller.ts
git add apps/api/src/modules/iot/presentation/iot-tablet.controller.ts
git add apps/api/src/modules/iot/presentation/iot-main.controller.ts
git add apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts
git add apps/api/src/modules/iot/iot.module.ts
git commit -m "feat(iot/P45): BE — checklist gate + reason seed + GSD bridge + Andon + camera AI (Gemini VLM)"

# FE
git add artifacts/erp-dashboard/src/pages/iot/TbChecklist.tsx
git add artifacts/erp-dashboard/src/pages/iot/SmenaReadyChecklist.tsx
git add artifacts/erp-dashboard/src/pages/iot/AndonBoard.tsx
git add artifacts/erp-dashboard/src/pages/iot/IotDashboard.tsx
git add artifacts/erp-dashboard/src/pages/iot/CameraInspection.tsx
git add artifacts/erp-dashboard/src/pages/iot/PpeAlerts.tsx
git add artifacts/erp-dashboard/src/pages/iot/AttendanceCamera.tsx
git commit -m "feat(iot/P45): FE — TbChecklist/SmenaReady/Andon/Dashboard/CameraInspection/Ppe/Attendance"
```

**HECH QACHON `git add -A` yoki `git add .` ishlatma.**

---

## ESLATMALAR

1. **GsdWriteHandler MesCompletedEvent import:** `apps/api/src/modules/mes/domain/events/` yo'lini
   avval `grep -r "MesCompletedEvent"` bilan topib, keyin to'g'ri import yo'lini qo'y.
   Agar fayl yo'q bo'lsa — TO'XTA va flag qil.

2. **ScheduleModule:** `iot.module.ts` da `ScheduleModule.forFeature()` ni qo'shish uchun
   avval `apps/api/src/app.module.ts` da `ScheduleModule.forRoot()` mavjudligini tekshir.
   Agar yo'q bo'lsa — TO'XTA va app.module.ts egasiga flag qil (P45 OWNED FILES ichida emas).

3. **Gemini API key:** `GEMINI_API_KEY` env o'zgaruvchisi `apps/api/.env` da bo'lishi kerak.
   Kod faqat `ConfigService.getOrThrow` orqali oladi (Q-7, Q-30).

4. **camera_zones.camera_id:** Mavjud schema da `varchar` (iot-schema.ts:61), lekin
   `cameras.id` — `serial` (integer). FK type mismatch mavjud. Shu sababdan
   `findActiveZonesWithIdealPhoto` da `c.id::text = cz.camera_id` cast ishlatilgan.
   Bu existing schema bug (P45 scope emas) — workaround bilan davom et.

5. **Worker card_id FE:** Hozir hardcoded `confirmedBy: 1`. Production da auth context
   (JWT payload) dan `card_id` olinishi kerak. Bu TODO sifatida comment qoldirilsin.

6. **@nestjs/schedule paket:** `pnpm --filter @europrint/api add @nestjs/schedule` kerak bo'lishi
   mumkin. Avval `package.json` da bor-yo'qligini tekshir.

7. **Sensor rollout override (EP-IOT-001 — EGASI QARORIGA DEFER):**
   Owner (OCHIQ-JAVOBLAR): "HAMMA mashinaga BIRDAN" — rollout to'liq qamrov.
   P44/P45 `machines` jadvali va DDL tayyor (GATED). Lekin:
   - Sensor hardware o'rnatilish jadvali egasida (ERP ichida emas).
   - O'rnatilish boshlanguncha `GET /api/iot/energy-consumption` → 501 sex-meter faza.
   - O'rnatish tartibi: `machines.is_active=true` bo'lgan mashinalardan boshlanadi.
   - **EGASI QIYMATI KERAK:** qaysi mashina birinchi sensor olishini egasi belgilaydi.

8. **Andon ortda-qolish-% (lag %) — EGASI QIYMATI KERAK + DEFER:**
   Owner Andon'da "ortda qolish foizi" ko'rsatkichini talab qiladi (00-INTERVYU-MOSLIK §79).
   `GET /api/iot/andon/live` hozir `actual_quantity`, `planned_quantity`, `active_downtime_count`
   qaytaradi. Lekin "lag %" formulasi egasi belgilamagan:
   - Variant A: `(planned_qty - actual_qty) / planned_qty * 100` (reja foizi ortda qolish)
   - Variant B: Vaqt bo'yicha (ish soati foydalanish %)
   - Variant C: Boshqa formula
   **DEFER:** egasi "lag %" formulasini belgilagunicha `lag_pct` maydoni response'da `null` keladi.
   Egasi formula bersa — `getAndonLive()` metodiga `lag_pct` hisoblash qo'shiladi.
