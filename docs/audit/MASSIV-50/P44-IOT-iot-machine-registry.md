# P44 — iot: IOT machine registry + operator guard + session fields + OEE semantic fix

> Paket ID: P44 | Modul: iot | To'lqin: 1 | Bog'liqlik: P01
> Bajaruvchi: Muslimbek | Tekshiruvchi: Claude (advisor) | Sana: 2026-06-19
> DDL darvozasi: HA — migration fayli yoziladi, lekin FAQAT egasi `APPROVED:` izoh qo'shgach ishga tushiriladi.

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**sан. Sessiyani boshlashdan oldin `CLAUDE.md`, `docs/agent-constitution.md` va `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` o'qi. Quyidagi qoidalar ISTISNOSIZ amal qiladi:

```
QOIDALAR BLOKI (Q-47):
1. Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2. @Body Zod bilan validate; class-validator TAQIQ.
3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4. Q-40 ishlaydi≠to`g`ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. Q-46 ishlab turgan kod O`CHIRILMAYDI; buzuq/o`lik/dublikat kod TO`LIQ o`chiriladi (chala emas).
6. FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro`yxatidagi
   fayllarga teg. Boshqa fayl kerak bo`lsa — TO`XTA, egasiga flag qil, supurib ketma.
7. DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida
   `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila,
   ISHGA TUSHIRMA.
8. git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit=bitta mantiqiy guruh.
9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo`q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit→saqla→qayta o`qi→ko`rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda
    to`g`irlanadi.
12. Vizyon-moslik: TO`G`RI o`lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo`lsa (ishlasa ham) = xato.
```

**WAVE 1** — bu paket birinchi to'lqinda bajariladi. P01 (schema/lib barrel) tugatilgan bo'lishi shart. P01 hali tugatilmagan bo'lsa — STOP, P01 ni kut.

**dependsOn:** `["P01"]` — `@europrint/db` sxema barrelidan import ishlaydigan bo'lishi kerak.

---

## 1. IZOLYATSIYA MANIFESTI

Bu agent FAQAT quyidagi fayllarga tegadi. Boshqa fayl kerak bo'lsa — STOP + egasiga flag qil, o'z-o'zidan supurib ketma.

### Owned files (to'liq ro'yxat):

| # | Fayl yo'li | Holat |
|---|-----------|-------|
| 1 | `apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts` | MAVJUD — o'zgartirish kerak |
| 2 | `apps/api/src/modules/iot/presentation/iot-main.controller.ts` | MAVJUD — o'zgartirish kerak |
| 3 | `apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts` | MAVJUD — kuzatiladi, o'zgartirish kerak bo'lishi mumkin |
| 4 | `apps/migrations/add-machines-registry.sql` | YO'Q — yaratiladi (GATED) |
| 5 | `docs/migration/seed/iot-machines-seed.sql` | YO'Q — yaratiladi (GATED) |
| 6 | `lib/db/src/schema/pp/pp-iot.ts` | MAVJUD — o'zgartirish kerak |

### DDL darvozasi qoidasi:
`apps/migrations/add-machines-registry.sql` va `docs/migration/seed/iot-machines-seed.sql` fayllarini **YOZ** lekin quyidagi shart bajarilmaguncha `psql` bilan ISHGA TUSHIRMA:

```sql
-- APPROVED: <egasi_ismi> <sana>
```

Bu izoh migration fayl boshida bo'lishi shart. Agar yo'q — migration fayl yozilgan, lekin `psql`/`db.execute` chaqirilmaydi. Egasi `APPROVED:` izoh qo'shib "ha, ishga tushir" demaguncha to'xta.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-20-IOT-2026-06-08.md` (Phase 1) + EP-IOT-* kodlari.

### 2.1 IoT moduli roli

IoT = EuroPrint zavod zeminining intellekt qatlami (T3 — qo'llovchi). U MES sessiyalari, QC (brak %), HR karta GSD, Finance (energiya → tannarx) uchun ma'lumot manbai. IoT ma'lumotlarsiz "reja vs amal" zanjiri sinadi.

**6 tamoyil (vizyon):**
1. **AI kuzatadi → inson tasdiqlaydi** (E1) — jarima/ball faqat inson tasdiqidan keyin.
2. **Karta-markazli** — mashinalar ogohlantirishlari mexanik kartasiga yo'naltiriladi; GSD → xodim profili.
3. **AI rejalashtiradi** — MES/IoT sessiya ma'lumotlari AI smena rejachiga uzatiladi.
4. **Operator tablet = zavod markazi** — barcha kirish (brak/to'xtash/TB checklist/smena) planshет orqali.
5. **Org-chart yo'naltirish** — Vysotskiy-7 bo'yicha (anomaliya→mexanik, uzun to'xtash→sex boshliq).
6. **Bitta haqiqat manbai** — `machines` yagona registr; IoT/MES/QC/Finance hammasi shunga murojaat qiladi.

### 2.2 P44 doirasidagi qabul mezoni (per-feature)

| Xususiyat | EP kodi | Vizyon talabi | Qabul mezoni |
|-----------|---------|---------------|--------------|
| `machines` jadval + 20+ mashinalar | EP-IOT-029/031 | Yagona registr, norma_per_hour/norma_per_12h/machine_type/status | Migration yozilgan (GATED); seed SQL 20+ qator; `SELECT count(*) FROM machines >= 20` (egasi ruxsatidan keyin) |
| Operator roli guard | EP-IOT-042 | Operator tablet floor operatorlari uchun — ular `/api/iot/*` ga 403 OLMAYDI | `IOT_READ` va `IOT_WRITE` massivlarida `'operator'` mavjud; curl operator JWT bilan 200 qaytaradi |
| `smena_type` (A/B/C) va `smena_boss_card_id` | EP-IOT-040 | Har smena alohida kuzatiladi | `production_sessions` jadvalida ustunlar bor (migration GATED); insertProductionSessionSchema yangilangan |
| Energiya sex-hisoblagich fazasi | EP-IOT-018/030 | Owner override (OCHIQ-JAVOBLAR EP-IOT-018/030): "sensor o'rnatilguncha umumiy sex hisoblagichidan boshlanadi" — hozircha endpoint sex (umumiy bo'lim) hisoblagichidan o'qiydi; per-mashina sensor kelguncha. Bu "SENSOR_ROLLOUT_PENDING" fazasi. Sensorlar kelganda bu blok olib tashlanadi. | `GET /api/iot/energy-consumption` → HTTP 501, body `{message:'Energiya: sex umumiy hisoblagich fazasi — per-mashina sensor kutilmoqda', code:'EP-IOT-ENERGY-SEX-METER', phase:'sex_meter'}` |
| OEE semantik tuzatish | EP-IOT-014 | OEE `iot_sensor_readings.value > 80` float proxy EMAS — `production_sessions` dan kelishi kerak | `drizzle-iot-oee.repo.ts` endi `production_sessions` (running_time_seconds/planned/actual_quantity) dan hisoblaydi |
| Crew POST | EP-IOT-042 | `machine_crews` jadvaliga operator+yordamchi yoziladi | `POST /api/iot/production-sessions/:id/crew` → 201, DB da qator paydo bo'ladi |

### 2.3 Mashinalar ro'yxati (kitob: "Станоклар норма")

Seed qilinadigan 20+ mashina (EP-IOT-029/031 — owner override: BARCHASI bir vaqtda):

```
SM-52, SM-72, KBA-105,
Тигель-1, Тигель-2, Тигель-3, Тигель-4, Тигель-5,
Тигель-6, Тигель-7, Тигель-8, Тигель-9, Тигель-10,
Гофра линия, ФСМ большой, ФСМ маленький,
Автовысечка (картон), Автовысечка (гофра),
Ламинация, UV Лак, Трафарет,
Степлер-1, Степлер-2, Степлер-3,
Склейка, Резка, Окошка
```

Har mashina uchun: `machine_type` (offset/flexo/cutting/folding/lamination/uv/screen/stapler/gluing/window), `unit_of_measure` (м²/лист/штук/удар — mashina turiga qarab), `norma_per_hour`, `norma_per_12h`, `status='ishlayapti'`, `brak_threshold_pct`.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud fayllar

| Fayl | Qatorlar | Holat |
|------|----------|-------|
| `lib/db/src/schema/pp/pp-iot.ts` | 223 | MAVJUD — `productionSessions` 34 ustun bor, lekin `smena_type`, `smena_boss_card_id` YO'Q |
| `apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts` | 57 | MAVJUD — OEE `iot_sensor_readings.value::float > 80` proxy orqali (SEMANTIK NOTO'G'RI) |
| `apps/api/src/modules/iot/presentation/iot-main.controller.ts` | 327 | MAVJUD — `IOT_READ` da `'operator'` YO'Q; `energy-consumption` sensorizm routaga yo'naltiradi (NOTO'G'RI) |
| `apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts` | 178 | MAVJUD — `IOT_READ` da `'operator'` YO'Q |
| `apps/migrations/add-machines-registry.sql` | — | YO'Q — yaratiladi |
| `docs/migration/seed/iot-machines-seed.sql` | — | YO'Q — yaratiladi |

### 3.2 Aniqlangan muammolar (file:line)

**MUAMMO 1 — Operator guard yo'q (iot-main.controller.ts:40-41)**
```typescript
// HOZIRGI HOLAT (iot-main.controller.ts:40-41)
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin'];
```
`'operator'` yo'q → zavod operatorlari `/api/iot/*` ga murojaat qilsa 403 oladi. DDL kerak emas, faqat massiv o'zgarishi.

**MUAMMO 2 — Operator guard yo'q (iot-sensors-main.controller.ts:44)**
```typescript
// HOZIRGI HOLAT (iot-sensors-main.controller.ts:44)
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];
```
Xuddi shu muammo — `'operator'` yo'q.

**MUAMMO 3 — Energiya endpoint noto'g'ri (iot-main.controller.ts:143-150)**
```typescript
// HOZIRGI HOLAT (iot-main.controller.ts:143-150)
@Get('energy-consumption')
@Roles(...IOT_READ)
async getEnergyConsumption(@Query() raw: Record<string, unknown>) {
  const q = DeviceIdQuerySchema.parse(raw);
  return unwrapOrThrow(await this.svc.getEnvironmentData('energy', undefined, q.device_id));
  // ↑ Bu per-mashina sensor ma'lumotlari — SOXTA. Per-mashina sensor o'rnatilmagan!
}
```
Owner override EP-IOT-018/030 (OCHIQ-JAVOBLAR): "energiya = mashina darajasida → tannarxga avto; **sensor o'rnatilguncha umumiy sex hisoblagichidan boshlanadi**". Bu degani:
- **Hozirgi faza:** sex (bo'lim) umumiy hisoblagich manbai → 501 + `EP-IOT-ENERGY-SEX-METER` kodi + `phase:'sex_meter'` (sensorlar keyingi fazada)
- `getEnvironmentData('energy')` per-mashina sensor proxy'dan o'qiydi — bu NOTO'G'RI manba.
- Sensorlar o'rnatilgach bu endpoint real per-mashina ma'lumotga ulanadi.

**MUAMMO 4 — OEE semantik noto'g'ri (drizzle-iot-oee.repo.ts:23-24)**
```typescript
// HOZIRGI HOLAT (drizzle-iot-oee.repo.ts:23-24) — sensor float proxy
ROUND((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float::numeric /
      GREATEST(COUNT(r.id), 1) * 100, 1) AS availability_pct,
```
Bu `iot_sensor_readings.value > 80` ni availability deb hisoblaydi — ma'nosiz. To'g'ri formula `production_sessions` dan: `running_time_seconds / (target_seconds)`.

**MUAMMO 5 — `machines` jadvali yo'q**
`lib/db/src/schema/pp/pp-iot.ts` da `machines` pgTable yo'q. Faqat `equipment` (PP-centrik, norma maydonlari yo'q). Migration kerak (GATED).

**MUAMMO 6 — `smena_type`, `smena_boss_card_id` yo'q (pp-iot.ts:51-89)**
`productionSessions` jadvalida `smena_type ENUM(A,B,C)` va `smena_boss_card_id` ustunlari yo'q. `ALTER TABLE` kerak (GATED).

**MUAMMO 7 — Crew POST yo'q**
`machine_crews` jadvali `pp-enhanced.ts` da mavjud (schema tomonida), lekin `POST /api/iot/production-sessions/:id/crew` endpoint yo'q. GET faqat bor.

### 3.3 Mavjud (saqlanadigan) funksional kod

- `productionSessions` 34 ustun sxema — SAQLANADI, faqat 2 ustun qo'shiladi
- `downtimeEvents`, `sensorDevices`, `sensorReadings`, `oeeSnapshots`, `downtimeReasonCodes` — SAQLANADI
- `iot-main.controller.ts` barcha boshqa endpointlari — SAQLANADI
- `iot-sensors-main.controller.ts` barcha endpointlari — SAQLANADI
- `drizzle-iot-oee.repo.ts` `findProductionMetrics()` va `findShiftReport()` metodlari — SAQLANADI

---

## 4. ISH (qadam-baqadam)

> Har qadam: ruxsat tekshir → faylni o'qi → o'zgartir → tsc tekshir → DB-proof.
> Tegmayotgan narsaga tegma.

---

### QADAM 1 — Operator roli guardga qo'shish (DDL kerak emas)

**Fayl:** `apps/api/src/modules/iot/presentation/iot-main.controller.ts`
**Qator:** 40–41
**O'zgarish:** `IOT_READ` va `IOT_WRITE` massivlariga `'operator'` qo'shish.

**OLDIN (qator 40-41):**
```typescript
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin'];
```

**KEYIN:**
```typescript
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist', 'operator'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'operator'];
```

**Sabab:** EP-IOT-042 — operator tablet foydalanuvchilari zavod operatorlari. Ular `production-sessions` endpointlariga murojaat qilishi kerak. Hozir 403 olishadi.

**Izoh:** `IOT_WRITE` ga `'operator'` qo'shish — chunki operatorlar sessiya boshlaydi/to'xtatadi/brak qo'shadi. Bular WRITE amallar.

---

### QADAM 2 — Xuddi shunday: iot-sensors-main.controller.ts

**Fayl:** `apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts`
**Qator:** 44
**O'zgarish:** `IOT_READ` massiviga `'operator'` qo'shish.

**OLDIN (qator 44):**
```typescript
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];
```

**KEYIN:**
```typescript
const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist', 'operator'];
```

**Sabab:** Sensor ma'lumotlarini ko'rish uchun operator roli kerak — planshет sensorizm ko'rsatishi uchun.

---

### QADAM 3 — Energiya honest-501 (EP-IOT-018/030)

**Fayl:** `apps/api/src/modules/iot/presentation/iot-main.controller.ts`
**Qator:** 143–150
**O'zgarish:** `getEnergyConsumption` metodini `501 + EP-IOT-ENERGY-SEX-METER` qaytaradigan qilib almashtirish (sex umumiy hisoblagich fazasi — per-mashina sensor kutilmoqda).

**OLDIN (qator 143-150):**
```typescript
@ApiOperation({ summary: 'Get energy consumption' })
@ApiResponse({ status: 200, description: 'OK' })
@Get('energy-consumption')
@Roles(...IOT_READ)
async getEnergyConsumption(@Query() raw: Record<string, unknown>) {
  const q = DeviceIdQuerySchema.parse(raw);
  return unwrapOrThrow(await this.svc.getEnvironmentData('energy', undefined, q.device_id));
}
```

**KEYIN:**
```typescript
@ApiOperation({ summary: 'Get energy consumption' })
@ApiResponse({
  status: 501,
  description: 'Sex (bo\'lim) umumiy hisoblagich fazasi — per-mashina sensor kutilmoqda (EP-IOT-018/030)',
})
@Get('energy-consumption')
@Roles(...IOT_READ)
async getEnergyConsumption() {
  // EP-IOT-018/030: Owner override (OCHIQ-JAVOBLAR):
  //   "sensor o'rnatilguncha umumiy sex hisoblagichidan boshlanadi"
  //   Hozirgi faza = sex (bo'lim) umumiy hisoblagich.
  //   Per-mashina sensor keyingi fazada (EP-IOT-001 rollout — hamma mashinaga birdan).
  //   Sensorlar o'rnatilgach bu blok real IoT endpointga ulanadi.
  // EGASI QIYMATI KERAK: sex hisoblagich ma'lumoti qaysi jadvaldan keladini egasi belgilaydi
  //   (hozircha ma'lumot manbai yo'q → 501 qaytariladi).
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

**Tekshir:** `HttpException` va `HttpStatus` importlari `iot-main.controller.ts:8` da allaqachon mavjud — import qo'shish kerak emas.

**DB-proof:** `curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/iot/energy-consumption` → `HTTP 501`, body da `code: 'EP-IOT-ENERGY-SEX-METER'`, `phase: 'sex_meter'`.

---

### QADAM 4 — OEE semantik tuzatish (drizzle-iot-oee.repo.ts)

**Fayl:** `apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts`
**Qator:** 1–57 (to'liq fayl)
**O'zgarish:** `findOee` metodini `production_sessions` dan hisoblashga o'tkazish.

`findOee` hozir `iot_sensor_readings.value::float > 80` ni availability deb hisoblaydi. Bu semantik noto'g'ri (EP-IOT-014):
- **Availability** = `running_time_seconds / planned_time_seconds` (production_sessions dan)
- **Performance** = `actual_quantity / norma_per_12h` (sessions + machines/equipment norma)
- **Quality** = `(actual_quantity - defect_quantity) / actual_quantity` (sessions dan)
- **OEE** = Availability × Performance × Quality

Qurilmada sensor bo'lmasa ham `production_sessions` da `running_time_seconds`, `actual_quantity`, `defect_quantity`, `target_quantity` bor — bulardan to'g'ri OEE hisoblanadi.

**OLDIN — `findOee` metodi (qator 19-27):**
```typescript
async findOee(deviceId: string | undefined, days: number): Promise<Result<Row>> {
  try {
    const since = new Date(Date.now() - days * 86_400_000);
    const devices = deviceId
      ? await exec(sql`SELECT s.id, s.sensor_code, s.name, ...
          ROUND((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float::numeric /
                GREATEST(COUNT(r.id), 1) * 100, 1) AS availability_pct,
          ...
          FROM iot_sensors s LEFT JOIN iot_sensor_readings r ...`)
      : await exec(sql`...same pattern...`);
    return Ok({ period_days: days, devices });
  } catch (e) { return Err((e as Error).message); }
}
```

**KEYIN — yangi `findOee` (production_sessions asosida):**

```typescript
async findOee(machineId: string | undefined, days: number): Promise<Result<Row>> {
  try {
    const since = new Date(Date.now() - days * 86_400_000);
    // EP-IOT-014: OEE = Availability × Performance × Quality
    // Manba: production_sessions (running_time_seconds, target_quantity,
    //        actual_quantity, defect_quantity)
    // Sensor proxy (value::float > 80) EMAS — bu semantik noto'g'ri.
    const whereClause = machineId
      ? sql`AND ps.equipment_id = ${parseInt(machineId, 10)}`
      : sql``;

    const rows = await exec(sql`
      SELECT
        e.id                                                        AS equipment_id,
        e.name                                                      AS equipment_name,
        COUNT(ps.id)                                                AS session_count,
        COALESCE(SUM(ps.running_time_seconds), 0)                   AS total_running_s,
        COALESCE(SUM(ps.stopped_time_seconds), 0)                   AS total_stopped_s,
        COALESCE(SUM(ps.actual_quantity), 0)                        AS total_actual,
        COALESCE(SUM(ps.target_quantity), 0)                        AS total_target,
        COALESCE(SUM(ps.defect_quantity), 0)                        AS total_defect,
        CASE
          WHEN COALESCE(SUM(ps.running_time_seconds + ps.stopped_time_seconds), 0) = 0
          THEN 0
          ELSE ROUND(
            SUM(ps.running_time_seconds)::numeric /
            GREATEST(SUM(ps.running_time_seconds + ps.stopped_time_seconds), 1) * 100,
            2
          )
        END                                                         AS availability_pct,
        CASE
          WHEN COALESCE(SUM(ps.target_quantity), 0) = 0 THEN 0
          ELSE ROUND(
            SUM(ps.actual_quantity)::numeric /
            GREATEST(SUM(ps.target_quantity), 1) * 100,
            2
          )
        END                                                         AS performance_pct,
        CASE
          WHEN COALESCE(SUM(ps.actual_quantity), 0) = 0 THEN 0
          ELSE ROUND(
            (SUM(ps.actual_quantity) - SUM(ps.defect_quantity))::numeric /
            GREATEST(SUM(ps.actual_quantity), 1) * 100,
            2
          )
        END                                                         AS quality_pct
      FROM equipment e
      LEFT JOIN production_sessions ps
             ON ps.equipment_id = e.id
            AND ps.started_at >= ${since}
            AND ps.status = 'completed'
      ${whereClause}
      GROUP BY e.id, e.name
      ORDER BY availability_pct DESC NULLS LAST
    `);

    // OEE = (availability * performance * quality) / 10000
    const devices = rows.map((r) => {
      const avail = Number(r['availability_pct'] ?? 0);
      const perf  = Number(r['performance_pct']  ?? 0);
      const qual  = Number(r['quality_pct']       ?? 0);
      return {
        ...r,
        oee: Math.round((avail * perf * qual) / 10_000) / 100,
      };
    });

    return Ok({ period_days: days, devices });
  } catch (e) { return Err((e as Error).message); }
}
```

**Muhim:** Fayl boshidagi importlar — `camera_events`, `camera_safety_violations`, `camera_quality_defects`, `count`, `inArray`, `and`, `gte` — `findProductionMetrics` va `findShiftReport` uchun kerak, ular SAQLANADI. Faqat `findOee` ichidagi SQL mantiq o'zgaradi.

**Drizzle import qo'shish:** `equipment` jadvalini import qilish kerak bo'lsa tekshir. Agar `@shared/db` dan kerak bo'lsa:
```typescript
import { db, camera_events, camera_safety_violations, camera_quality_defects, runQuery } from '@shared/db';
```
Bu allaqachon bor. `equipment` Drizzle table ob'ekti kerak emas — raw SQL ishlatyapmiz, izoh bilan (complex aggregation — Drizzle ORM orqali ifodalab bo'lmaydi).

---

### QADAM 5 — `machines` pgTable + `smena_type`/`smena_boss_card_id` sxemaga qo'shish (pp-iot.ts)

**Fayl:** `lib/db/src/schema/pp/pp-iot.ts`
**O'zgartirish 1:** Fayl boshiga `machines` pgTable qo'shish.
**O'zgartirish 2:** `productionSessions` ga `smena_type` va `smena_boss_card_id` qo'shish.

#### O'zgartirish 1: `machines` pgTable

Fayl boshiga (`// Sensor Devices` blokidan OLDIN) quyidagini qo'sh:

```typescript
// Machines canonical registry (EP-IOT-029/031)
// Har bir fizik mashina yagona yozuv. IoT/MES/QC/Finance hammasi shunga murojaat qiladi.
// DDL: apps/migrations/add-machines-registry.sql (GATED — egasi APPROVED: kerak)
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  machineType: varchar("machine_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ishlayapti"),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }).notNull().default("dona"),
  normaPerHour: integer("norma_per_hour"),
  normaPerShift12h: integer("norma_per_shift_12h"),
  shiftHours: integer("shift_hours").notNull().default(12),
  brakThresholdPct: integer("brak_threshold_pct").notNull().default(5),
  sexId: integer("sex_id"),
  responsibleCardId: integer("responsible_card_id"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("machines_status_chk", sql`${t.status} IN (
    'ishlayapti','to_xtagan','sozlanmoqda','nosoz','o_chiq'
  )`),
  check("machines_machine_type_chk", sql`${t.machineType} IN (
    'offset','flexo','cutting','folding','lamination','uv','screen',
    'stapler','gluing','window','corrugation','other'
  )`),
]);

export const insertMachineSchema = createInsertSchema(machines, {
  name: z.string().min(2, "Mashina nomi kerak"),
  machineType: z.enum([
    "offset", "flexo", "cutting", "folding", "lamination",
    "uv", "screen", "stapler", "gluing", "window", "corrugation", "other",
  ]),
  status: z.enum(["ishlayapti", "to_xtagan", "sozlanmoqda", "nosoz", "o_chiq"]),
  normaPerHour: z.number().int().positive().optional(),
  normaPerShift12h: z.number().int().positive().optional(),
  shiftHours: z.number().int().min(1).max(24),
  brakThresholdPct: z.number().int().min(0).max(100),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
```

**Izoh:** `sexId` va `responsibleCardId` FK dekoratori `org_functions` jadvaliga, lekin cross-modul FK qo'shish P04/ORG paketining ishi. Bu paketda integer maydon sifatida qoladi (FK constraint migration faylida bo'ladi).

#### O'zgartirish 2: `productionSessions` ga ustun qo'shish

`productionSessions` pgTable (`pp-iot.ts:51-89`) ichiga `updatedAt` dan OLDIN quyidagini qo'sh:

**Hozirgi qator 83-86 (updatedAt/deletedAt bloki oldidan):**
```typescript
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

**O'zgartirish — smena ustunlarini qo'sh (createdAt dan oldin):**
```typescript
  // EP-IOT-040: Smena A/B/C — har smena alohida kuzatiladi
  // DDL: apps/migrations/add-machines-registry.sql (GATED)
  smenaType: varchar("smena_type", { length: 1 }),
  smenaBossCardId: integer("smena_boss_card_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

`insertProductionSessionSchema` (qator 91-95) ga ham smena maydonini qo'sh:
**Hozirgi:**
```typescript
export const insertProductionSessionSchema = createInsertSchema(productionSessions, {
  sessionNumber: z.string().min(1, "Sessiya raqami kerak"),
  targetQuantity: z.number().min(1, "Reja miqdori kerak"),
  status: z.enum(["pending", "running", "paused", "stopped", "completed"]),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);
```

**KEYIN:**
```typescript
export const insertProductionSessionSchema = createInsertSchema(productionSessions, {
  sessionNumber: z.string().min(1, "Sessiya raqami kerak"),
  targetQuantity: z.number().min(1, "Reja miqdori kerak"),
  status: z.enum(["pending", "running", "paused", "stopped", "completed"]),
  smenaType: z.enum(["A", "B", "C"]).optional(),
  smenaBossCardId: z.number().int().positive().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);
```

---

### QADAM 6 — Crew POST endpointi (iot-main.controller.ts)

**Fayl:** `apps/api/src/modules/iot/presentation/iot-main.controller.ts`

`machine_crews` jadvali `lib/db/src/schema/pp/pp-enhanced.ts` da mavjud (schema tomonida). GET endpoint bor, lekin POST yo'q.

`iot-main.controller.ts` oxiriga (qator 327 dan oldin — oxirgi `}` dan oldin) quyidagi endpointni qo'sh:

**Import qo'shish — fayl boshida `Post` import qo'sh (agar yo'q bo'lsa):**
```typescript
// qator 8 dagi import — Body allaqachon bor; Post qo'shilishi kerak bo'lsa:
import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch,
         Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
```
Tekshir: `Post` allaqachon `qator 8` da bor — agar bor bo'lsa qo'shma.

**Zod schema — fayl boshida `PatchDeviceSchema` yoniga qo'sh:**
```typescript
const AddCrewSchema = z.object({
  operator_card_id:   z.number().int().positive(),
  assistant_card_ids: z.array(z.number().int().positive()).optional().default([]),
  role_note:          z.string().max(500).optional(),
});
```

**Controller ichiga qo'sh (`}` dan oldin):**
```typescript
  // EP-IOT-042: Crew POST — operator + yordamchi kartani sessiyaga bog'lash
  @ApiOperation({ summary: 'Add crew to production session' })
  @ApiResponse({ status: 201, description: 'Crew added' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Post('production-sessions/:id/crew')
  @Roles(...IOT_WRITE)
  async addSessionCrew(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = AddCrewSchema.parse(body);
    const sessionId = parseInt(id, 10);
    if (!Number.isFinite(sessionId)) {
      throw new HttpException('sessionId raqam boʻishi kerak', HttpStatus.BAD_REQUEST);
    }
    // Sessiya mavjudligini tekshir
    const check = await db.execute(
      sql`SELECT id FROM production_sessions WHERE id = ${sessionId} LIMIT 1`,
    );
    const rows = ((check as { rows?: unknown[] }).rows) ?? [];
    if (rows.length === 0) {
      throw new HttpException('Sessiya topilmadi', HttpStatus.NOT_FOUND);
    }
    // Operator yozuvi
    await db.execute(sql`
      INSERT INTO machine_crews (session_id, card_id, role, created_at)
      VALUES (${sessionId}, ${dto.operator_card_id}, 'operator', NOW())
      ON CONFLICT (session_id, card_id) DO UPDATE SET role = 'operator', updated_at = NOW()
    `);
    // Yordamchilar
    for (const assistantCardId of dto.assistant_card_ids) {
      await db.execute(sql`
        INSERT INTO machine_crews (session_id, card_id, role, created_at)
        VALUES (${sessionId}, ${assistantCardId}, 'assistant', NOW())
        ON CONFLICT (session_id, card_id) DO UPDATE SET role = 'assistant', updated_at = NOW()
      `);
    }
    // DB-proof: yangi yozuvlarni qayta o'qi
    const inserted = await db.execute(
      sql`SELECT * FROM machine_crews WHERE session_id = ${sessionId}`,
    );
    const crew = ((inserted as { rows?: unknown[] }).rows) ?? [];
    return { session_id: sessionId, crew, total: crew.length };
  }
```

**Izoh raw SQL:** `machine_crews` jadvalining Drizzle schema eksporti `@shared/db` barrelida bo'lmasligi mumkin (P01 paketiga bog'liq). Agar import ishlamasa raw SQL `APPROVED:` izohi bilan qoladi. `ON CONFLICT` uchun Drizzle `.onConflictDoUpdate()` ishlatish yaxshiroq edi, lekin `machine_crews` schema import aniqlanguncha raw SQL muqobil yechim.

---

### QADAM 7 — `add-machines-registry.sql` migration yozish (GATED)

**Fayl:** `apps/migrations/add-machines-registry.sql` (YO'Q — yaratiladi)

Bu fayl **YOZILADI** lekin `psql` bilan ISHGA TUSHIRILMAYDI. Egasi `-- APPROVED: <ism> <sana>` izoh qo'shguncha kutiladi.

Migration faylini yozish vaqtida:
1. Fayl boshiga `-- GATED: egasi APPROVED: bermaguncha ishga tushirilmaydi` qo'sh.
2. Barcha `CREATE TABLE` va `ALTER TABLE` idempotent bo'lsin (`IF NOT EXISTS`, `IF NOT EXISTS` ADD COLUMN).
3. See §5 (DDL bo'lim) — to'liq SQL unda.

---

### QADAM 8 — `iot-machines-seed.sql` seed yozish (GATED)

**Fayl:** `docs/migration/seed/iot-machines-seed.sql` (YO'Q — yaratiladi)

20+ mashina seed SQL. Idempotent (`INSERT ... ON CONFLICT DO NOTHING`). Migration tugagach ishga tushiriladi.

See §5 — to'liq seed SQL unda.

---

## 5. DDL (GATED — egasi ruxsati kerak)

> Quyidagi SQL fayllar YOZILADI lekin `-- APPROVED: <ism> <sana>` izohi bo'lmaguncha
> `psql` bilan ISHGA TUSHIRILMAYDI. Egasi izoh qo'shib "ha, ishga tushir" demaguncha
> migration skript chaqirilmaydi.

### 5.1 `apps/migrations/add-machines-registry.sql`

```sql
-- GATED: egasi APPROVED: bermaguncha ishga tushirilmaydi
-- APPROVED: <egasi_ismi> <sana>
-- P44 | EP-IOT-029, EP-IOT-031, EP-IOT-040, EP-IOT-002
-- Mashina registri (canonical) + smena ustunlari

BEGIN;

-- ══════════════════════════════════════════════════════════════
-- 1. machines — yagona mashina registri (EP-IOT-029/031)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS machines (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(100) NOT NULL UNIQUE,
  machine_type        VARCHAR(50)  NOT NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'ishlayapti',
  unit_of_measure     VARCHAR(20)  NOT NULL DEFAULT 'dona',
  norma_per_hour      INTEGER,
  norma_per_shift_12h INTEGER,
  shift_hours         INTEGER NOT NULL DEFAULT 12,
  brak_threshold_pct  INTEGER NOT NULL DEFAULT 5,
  sex_id              INTEGER,
  responsible_card_id INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT machines_status_chk CHECK (
    status IN ('ishlayapti','to_xtagan','sozlanmoqda','nosoz','o_chiq')
  ),
  CONSTRAINT machines_machine_type_chk CHECK (
    machine_type IN (
      'offset','flexo','cutting','folding','lamination',
      'uv','screen','stapler','gluing','window','corrugation','other'
    )
  ),
  CONSTRAINT machines_brak_pct_chk CHECK (brak_threshold_pct BETWEEN 0 AND 100),
  CONSTRAINT machines_norma_hour_chk CHECK (norma_per_hour IS NULL OR norma_per_hour > 0),
  CONSTRAINT machines_norma_shift_chk CHECK (norma_per_shift_12h IS NULL OR norma_per_shift_12h > 0)
);

CREATE INDEX IF NOT EXISTS idx_machines_status   ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_type     ON machines(machine_type);
CREATE INDEX IF NOT EXISTS idx_machines_active   ON machines(is_active);
CREATE INDEX IF NOT EXISTS idx_machines_sex_id   ON machines(sex_id) WHERE sex_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 2. production_sessions — smena_type, smena_boss_card_id (EP-IOT-040)
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='production_sessions' AND column_name='smena_type'
  ) THEN
    ALTER TABLE production_sessions
      ADD COLUMN smena_type        VARCHAR(1),
      ADD COLUMN smena_boss_card_id INTEGER;

    ALTER TABLE production_sessions
      ADD CONSTRAINT production_sessions_smena_type_chk
        CHECK (smena_type IS NULL OR smena_type IN ('A','B','C'));
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 3. downtime_reason_codes — idempotent seed (EP-IOT-004/005)
-- Jadval allaqachon mavjud (pp-iot.ts:201-222)
-- ══════════════════════════════════════════════════════════════
INSERT INTO downtime_reason_codes (code, name, name_ru, category, color, is_active, sort_order)
VALUES
  ('SOZLASH',     'Sozlash (nastroyka)',        'Настройка',           'planned',   '#3b82f6', true, 1),
  ('ISH_YUK',     'Ish yo''q (rejalashtirish)', 'Иш йук',              'planned',   '#f59e0b', true, 2),
  ('QOLIP_YOQ',   'Qolip tayyor emas',          'Форма не готова',     'planned',   '#f97316', true, 3),
  ('PEREDELA',    'Qayta urish (переделка)',     'Переделка',           'unplanned', '#ef4444', true, 4),
  ('MATERIAL_YOQ','Material yo''q',             'Материал отсутствует','unplanned', '#8b5cf6', true, 5),
  ('TOK_YOQ',     'Tok yo''q',                  'Нет электричества',   'external',  '#6b7280', true, 6),
  ('OPERATOR_YOQ','Operator yo''q',             'Оператор отсутствует','unplanned', '#ec4899', true, 7),
  ('TAMIRLASH',   'Ta''mirlash',                'Ремонт',              'unplanned', '#dc2626', true, 8),
  ('TOZALASH',    'Tozalash',                   'Уборка',              'planned',   '#10b981', true, 9),
  ('BOSHQA',      'Boshqa',                     'Другое',              'unplanned', '#9ca3af', true, 10)
ON CONFLICT (code) DO NOTHING;

COMMIT;
```

### 5.2 `docs/migration/seed/iot-machines-seed.sql`

```sql
-- GATED: apps/migrations/add-machines-registry.sql APPROVED va ishga tushirilgandan keyin
-- P44 | EP-IOT-029/031 | Kitob: "Станоклар норма" — 27 mashina
-- Idempotent: ON CONFLICT (name) DO NOTHING

INSERT INTO machines (
  name, machine_type, status, unit_of_measure,
  norma_per_hour, norma_per_shift_12h, shift_hours, brak_threshold_pct
) VALUES
  -- Offset bosma
  ('SM-52',             'offset',     'ishlayapti', 'лист', 3000, 36000, 12, 3),
  ('SM-72',             'offset',     'ishlayapti', 'лист', 4000, 48000, 12, 3),
  ('KBA-105',           'offset',     'ishlayapti', 'лист', 5000, 60000, 12, 3),
  -- Тигельlar (high-pressure cutting/embossing)
  ('Тигель-1',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-2',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-3',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-4',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-5',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-6',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-7',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-8',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-9',          'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  ('Тигель-10',         'cutting',    'ishlayapti', 'удар', 2500, 30000, 12, 5),
  -- Гофра va boshqalar
  ('Гофра линия',       'corrugation','ishlayapti', 'м²',   800,  9600,  12, 7),
  ('ФСМ большой',       'cutting',    'ishlayapti', 'удар', 3000, 36000, 12, 5),
  ('ФСМ маленький',     'cutting',    'ishlayapti', 'удар', 2000, 24000, 12, 5),
  ('Автовысечка (картон)', 'cutting', 'ishlayapti', 'штук', 4000, 48000, 12, 4),
  ('Автовысечка (гофра)',  'cutting', 'ishlayapti', 'штук', 3500, 42000, 12, 5),
  -- Qayta ishlash
  ('Ламинация',         'lamination', 'ishlayapti', 'м²',   1200, 14400, 12, 3),
  ('UV Лак',            'uv',         'ishlayapti', 'м²',   1000, 12000, 12, 3),
  ('Трафарет',          'screen',     'ishlayapti', 'штук', 600,  7200,  12, 5),
  -- Qayta yig'ish
  ('Степлер-1',         'stapler',    'ishlayapti', 'штук', 5000, 60000, 12, 4),
  ('Степлер-2',         'stapler',    'ishlayapti', 'штук', 5000, 60000, 12, 4),
  ('Степлер-3',         'stapler',    'ishlayapti', 'штук', 5000, 60000, 12, 4),
  ('Склейка',           'gluing',     'ishlayapti', 'штук', 3000, 36000, 12, 5),
  ('Резка',             'cutting',    'ishlayapti', 'штук', 4000, 48000, 12, 4),
  ('Окошка',            'window',     'ishlayapti', 'штук', 2000, 24000, 12, 6)
ON CONFLICT (name) DO NOTHING;
```

---

## 6. QABUL MEZONI

Quyidagi BARCHA bandlar bajarilishi shart. Bitta bajarilmagan bo'lsa — paket YOPILMADI.

### 6.1 Operator guard (Qadam 1-2)
- [ ] `IOT_READ` da `'operator'` mavjud — `grep "operator" iot-main.controller.ts` ishlaydi
- [ ] `IOT_WRITE` da `'operator'` mavjud — `grep "operator" iot-main.controller.ts` ishlaydi
- [ ] `IOT_READ` da `'operator'` (`iot-sensors-main.controller.ts`) — `grep "operator" iot-sensors-main.controller.ts` ishlaydi
- [ ] **DB-proof:** `curl -H "Authorization: Bearer $OPERATOR_TOKEN" http://localhost:3030/api/iot/production-metrics` → HTTP 200 (avval 403 edi)

### 6.2 Energiya sex-hisoblagich fazasi (Qadam 3)
- [ ] `GET /api/iot/energy-consumption` → HTTP 501
- [ ] Response body: `{ "message": "Energiya: sex umumiy hisoblagich fazasi...", "code": "EP-IOT-ENERGY-SEX-METER", "phase": "sex_meter" }`
- [ ] Boshqa sensorlar (`/api/iot/temperature`, `/api/iot/humidity`) 200 qaytarishda davom etadi (regressiya yo'q)
- [ ] **EGASI QIYMATI KERAK:** sex hisoblagich ma'lumoti qaysi DB jadvaldan/ustundan o'qilishini egasi belgilaydi (hozircha 501, real ma'lumot manbai noaniq)

### 6.3 OEE semantik tuzatish (Qadam 4)
- [ ] `drizzle-iot-oee.repo.ts` da `iot_sensor_readings.value::float > 80` pattern YO'Q
- [ ] `findOee` endi `production_sessions` jadvalidan hisoblaydi
- [ ] `GET /api/iot/oee` → HTTP 200, response da `availability_pct`, `performance_pct`, `quality_pct`, `oee` mavjud
- [ ] `findProductionMetrics()` va `findShiftReport()` metodlari o'zgarmagan (regressiya yo'q)

### 6.4 pp-iot.ts sxema (Qadam 5)
- [ ] `machines` pgTable `lib/db/src/schema/pp/pp-iot.ts` da mavjud
- [ ] `insertMachineSchema` Zod sxemasi eksport qilingan
- [ ] `productionSessions` da `smenaType` va `smenaBossCardId` ustunlari mavjud
- [ ] `lib/db` build: `pnpm --filter @europrint/db build` PASS (0 xato)

### 6.5 Crew POST (Qadam 6)
- [ ] `POST /api/iot/production-sessions/:id/crew` endpoint mavjud
- [ ] `POST` bilan `{ operator_card_id: 1, assistant_card_ids: [2] }` → HTTP 201
- [ ] **DB-proof:** `SELECT * FROM machine_crews WHERE session_id = :id` → yangi qatorlar ko'rinadi
- [ ] Mavjud bo'lmagan session_id bilan POST → HTTP 404

### 6.6 Migration (GATED — Qadam 7-8)
- [ ] `apps/migrations/add-machines-registry.sql` fayli mavjud
- [ ] Fayl boshida `-- GATED:` izohi mavjud
- [ ] `docs/migration/seed/iot-machines-seed.sql` fayli mavjud
- [ ] **Faqat egasi `APPROVED:` berganidan keyin:** `SELECT count(*) FROM machines` → `≥ 27`
- [ ] **Faqat egasi `APPROVED:` berganidan keyin:** `SELECT count(*) FROM downtime_reason_codes` → `≥ 10`

### 6.7 Kod sifati
- [ ] `pnpm --filter @europrint/api exec tsc --noEmit` → 0 xato
- [ ] `bash scripts/reviewer-result-pattern.sh` — yangi qatorlar FAIL qo'shmagan
- [ ] `bash scripts/reviewer-jwt-guard.sh` → PASS (guard qoidasi buzilmagan)
- [ ] `bash scripts/reviewer-array-safety.sh` → PASS

### 6.8 Oltin zanjir regressiyasi
- [ ] `GET /api/iot/dashboard` → HTTP 200 (avval ishlagan)
- [ ] `GET /api/iot/machine-status` → HTTP 200 (avval ishlagan)
- [ ] `GET /api/iot/production-metrics` → HTTP 200 (avval ishlagan)
- [ ] `GET /api/iot-sensors/dashboard` → HTTP 200 (avval ishlagan)

---

## 7. SELF-VERIFY

Har qadam tugagach quyidagi buyruqlarni ishga tushir:

### 7.1 TypeScript tekshiruvi

```bash
# lib/db build
pnpm --filter @europrint/db build
# Kutilgan natija: 0 xato, 0 ogohlantirish

# Backend typecheck
pnpm --filter @europrint/api exec tsc --noEmit
# Kutilgan natija: 0 xato
```

### 7.2 Operator guard tekshiruvi

```bash
# Faylda 'operator' mavjudligini tekshir
grep -n "operator" apps/api/src/modules/iot/presentation/iot-main.controller.ts
# Kutilgan: IOT_READ va IOT_WRITE massivlarida 'operator' ko'rinadi

grep -n "operator" apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts
# Kutilgan: IOT_READ massivida 'operator' ko'rinadi
```

### 7.3 Energiya 501 tekshiruvi

```bash
# Backend ishlab turishi kerak
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/iot/energy-consumption
# Kutilgan: 501

# To'liq javob
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/iot/energy-consumption | jq .
# Kutilgan: {"message":"Energiya: sex umumiy hisoblagich fazasi...","code":"EP-IOT-ENERGY-SEX-METER","phase":"sex_meter",...}

# Boshqa sensor (regressiya yo'q)
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/iot/temperature
# Kutilgan: 200
```

### 7.4 OEE semantik tekshiruvi

```bash
# Eski pattern yo'qligini tekshir
grep -n "value::float > 80" \
  apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts
# Kutilgan: hech narsa chiqmasligi kerak (0 natija)

# Yangi pattern mavjudligini tekshir
grep -n "production_sessions" \
  apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts
# Kutilgan: yangi SQL so'rov ko'rinadi

# Endpoint tekshiruvi
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/iot/oee?period=7" | jq '.devices[0]'
# Kutilgan: availability_pct, performance_pct, quality_pct, oee maydonlari mavjud
```

### 7.5 Crew POST DB-proof

```bash
# Sessiya ID ni toping (mavjud sessiya)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/iot/production-sessions?limit=1" | jq '.data[0].id'

# Crew qo'shing (SESSION_ID ni almashtiring)
SESSION_ID=1
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operator_card_id": 1, "assistant_card_ids": [2]}' \
  http://localhost:3030/api/iot/production-sessions/$SESSION_ID/crew | jq .
# Kutilgan: HTTP 201, {"session_id":1,"crew":[...],"total":2}

# DB-proof: psql bilan to'g'ridan tekshir
# psql -U europrint -d europrint -c \
#   "SELECT * FROM machine_crews WHERE session_id = $SESSION_ID;"
# Kutilgan: operator va assistant qatorlari ko'rinadi
```

### 7.6 Sxema tekshiruvi

```bash
# machines pgTable mavjudligi
grep -n "export const machines" lib/db/src/schema/pp/pp-iot.ts
# Kutilgan: qator raqami bilan chiqadi

# smenaType ustuni mavjudligi
grep -n "smenaType\|smena_type" lib/db/src/schema/pp/pp-iot.ts
# Kutilgan: productionSessions blokida ko'rinadi
```

### 7.7 Reviewer skriptlari

```bash
bash scripts/reviewer-result-pattern.sh
# Kutilgan: FAIL 0 (WARN o'zgarmasin)

bash scripts/reviewer-jwt-guard.sh
# Kutilgan: PASS

bash scripts/reviewer-array-safety.sh
# Kutilgan: PASS (0 FAIL)
```

### 7.8 Migration fayl tekshiruvi

```bash
# Migration fayllar mavjudligini tekshir
ls apps/migrations/add-machines-registry.sql
ls docs/migration/seed/iot-machines-seed.sql
# Kutilgan: ikkala fayl ham mavjud

# GATED izoh mavjudligini tekshir
head -3 apps/migrations/add-machines-registry.sql
# Kutilgan: "-- GATED:" satrini ko'rish kerak

# APPROVED izoh YO'Qligini tekshir (hali egasi bermagan)
grep "APPROVED:" apps/migrations/add-machines-registry.sql
# Kutilgan: faqat "-- APPROVED: <egasi_ismi> <sana>" shablon ko'rinadi — bu to'g'ri
# Egasi hali aniq ism/sana bermagan bo'lishi kerak
```

---

## 8. COMMIT

Har bir mantiqiy guruh alohida commit bo'lishi kerak. HECH QACHON `git add -A` yoki `git add .` ishlatma.

### Commit 1 — Guard + Energiya honest-501 (DDL kerak emas)

```bash
git add apps/api/src/modules/iot/presentation/iot-main.controller.ts
git add apps/api/src/modules/iot/presentation/iot-sensors-main.controller.ts
git commit -m "fix(iot): add operator role to IOT_READ/WRITE guards; energy honest-501

- IOT_READ + IOT_WRITE: add 'operator' role (EP-IOT-042)
  floor operators no longer get 403 on production-session endpoints
- GET /api/iot/energy-consumption: return 501 EP-IOT-ENERGY-SEX-METER
  owner override: sex umumiy hisoblagich fazasi — per-mashina sensor kutilmoqda; fake data TAQIQ

EP codes: EP-IOT-042, EP-IOT-018, EP-IOT-030"
```

### Commit 2 — OEE semantik tuzatish

```bash
git add apps/api/src/modules/iot/infrastructure/repositories/drizzle-iot-oee.repo.ts
git commit -m "fix(iot): OEE from production_sessions, not sensor float proxy

findOee now queries production_sessions (running_time_seconds /
actual_quantity / defect_quantity) for Availability/Performance/Quality.
Removes iot_sensor_readings.value::float > 80 proxy (semantically wrong).

EP code: EP-IOT-014"
```

### Commit 3 — Sxema o'zgarishlari (machines + smena ustunlari)

```bash
git add lib/db/src/schema/pp/pp-iot.ts
git commit -m "feat(iot/schema): machines pgTable + smena_type/smena_boss_card_id

- Add machines pgTable with 5-state status enum (EP-IOT-002/029/031)
- insertMachineSchema Zod validation
- production_sessions: +smena_type VARCHAR(1) + smena_boss_card_id INTEGER (EP-IOT-040)
- insertProductionSessionSchema: smenaType/smenaBossCardId optional fields

DDL: apps/migrations/add-machines-registry.sql GATED (owner approval needed)"
```

### Commit 4 — Crew POST + Migration fayllar

```bash
git add apps/api/src/modules/iot/presentation/iot-main.controller.ts
git add apps/migrations/add-machines-registry.sql
git add docs/migration/seed/iot-machines-seed.sql
git commit -m "feat(iot): crew POST endpoint + machines migration (GATED)

- POST /api/iot/production-sessions/:id/crew (EP-IOT-042)
  operator+assistant cards linked to session via machine_crews table
  404 on missing session; 201+DB-proof on success
- apps/migrations/add-machines-registry.sql: GATED, awaiting APPROVED:
  creates machines table + ALTER production_sessions smena cols
  seeds 10 downtime_reason_codes (kitob-grounded)
- docs/migration/seed/iot-machines-seed.sql: GATED, 27 machines

EP codes: EP-IOT-029, EP-IOT-031, EP-IOT-040, EP-IOT-042, EP-IOT-004/005"
```

---

## 9. DEFERRED (bu pakeтda bajarilmaydi)

Quyidagilar vizyon doirasida, lekin P44 scopesidan tashqarida yoki egasi qarorini talab qiladi:

| Xususiyat | EP kodi | Sabab | Masul |
|-----------|---------|-------|-------|
| TB checklist blocking gate | HR-079/EP-IOT-080 | P17 (mes-checklist-deduction) bilan overlap | P17 |
| Smena tayyorlik checklist | COR-130 | P17 bilan overlap | P17 |
| OEE snapshot write on completion | EP-IOT-081 | `MesCompletedEvent` handler — MES moduli ishi | P15/P16 |
| GSD→card bridge | EP-IOT-025 | `card_gsd_log` jadval DDL + HR modul event — keng scope | Keyingi sprint |
| Andon board endpoint | EP-IOT-021/066 | Yangi jadval + FE sahifa — P44 scope emas | Keyingi sprint |
| **Andon ortda-qolish-% (lag %)** | EP-IOT-021/066 | Owner aytgan Andon'da "ortda qolish foizi" ko'rsatkichi — P44 scopesidan tashqari, P45 Andon endpointida **EGASI QIYMATI KERAK**: lag % hisoblash formulasi (reja vs fakt, vaqt oralig'i) egasi belgilashi shart | P45/Keyingi sprint |
| **Sensor rollout override** | EP-IOT-001 | Owner (OCHIQ-JAVOBLAR): "HAMMA mashinaga BIRDAN" — rollout tartibi/jadval egasi belgilaydi; `machines` jadval tayyor (migration GATED), ammo sensor hardware o'rnatilish jadvali egasida | Egasi qaroriga |
| **Energiya sex-hisoblagich → per-mashina** | EP-IOT-018/030 | Hozir 501 (sex-meter-faza); per-mashina sensor o'rnatilgach real ma'lumot manbai ulanadi — **EGASI QIYMATI KERAK**: sex hisoblagich DB manbai + rollout kalendar | Sensor rollout qaroriga |
| AI camera (Gemini VLM) | EP-IOT-010 | Keng scope, alohida sprint | Keyingi sprint |
| `norma_change_log` | EP-IOT-054 | Approval chain — alohida sprint | Keyingi sprint |
| Telegram alerts | EP-IOT-028 | Bot integratsiya — alohida sprint | Keyingi sprint |

---

*P44 direktiva oxiri. Satr soni: ~400+ (Q-47 talabiga javob). Barcha file:line ma'lumotlari jonli fayllardan olindi.*
