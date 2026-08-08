# P15 — MES (Manufacturing Execution System) + IoT Tablet: MES guard fix + MesGateway registration + POST crew endpoint

> **Paket:** P15 · **To'lqin:** Wave 1 · **DDL darvozasi:** YO'Q  
> **Egasi fayllari:** 2 ta (iot-tablet.schemas.ts, iot-tablet.controller.ts)  
> **Bog'liqlik:** Hech kimga bog'liq emas (dependsOn: [])  
> **Umumiy ko'lam:** 3 ta aniq, izolyatsiyalangan wiring tuzatish — guard, DI, POST endpoint

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Quyidagi qoidalar blokini o'qi va har qadamda qat'iy amal qil.

```
QOIDALAR BLOKI (Q-47):
1. Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2. @Body Zod bilan validate; class-validator TAQIQ.
3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4. Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi
   fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration
   faylida `-- APPROVED:` izoh shart. Bu paketda DDL YO'Q — machine_crews jadvali ALLAQACHON
   mavjud (lib/db/src/schema/pp/pp-enhanced.ts:20).
8. git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda
    to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul
    vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Wave:** 1 (boshqa barcha MES paketlardan oldin bajariladi; P07/P16/P18 shu paketning
mes.module.ts providers o'zgarishiga tayanadi — ular shu paketdan keyin boshlaydi).

**dependsOn:** [] — bu paket hech kimga bog'liq emas, darhol boshlanishi mumkin.

---

## 1. IZOLYATSIYA MANIFESTI

### Egasi fayllar (FAQAT shu ikki fayl):

```
apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts   ← Qadam 1 (IOT_READ)
apps/api/src/modules/iot/presentation/iot-tablet.controller.ts ← Qadam 2 (POST crew)
```

### Yon ta'sir (bu paket TO'G'RIDAN o'zgartirmaydi — flag):

```
apps/api/src/modules/mes/mes.module.ts  ← MesGateway registration
```

> ⚠️ **MUHIM:** `mes.module.ts` faqat bitta qator o'zgarish talab qiladi (providers arrayiga
> `MesGateway` qo'shish). Lekin bu fayl **P07/P16/P18 bilan UMUMIY** (sharedFileResolutions).
> Bu paket (P15) `mes.module.ts` providers-array o'zgarishiga **EGA** (owns it). Ammo fayl
> `ownedFiles` ro'yxatida yo'q — shuning uchun:
>
> **Variant A (tavsiya):** Bu paket `mes.module.ts` o'zgarishini bajaradi va P07/P16/P18 ga
> bu o'zgarish ALLAQACHON qilinganini bildiradi (holat hisobotida).
>
> **Variant B:** `mes.module.ts` o'zgarishini flag sifatida belgilab, egasi (Muslimbek) qaror
> qilsin qaysi agent bajarsın.
>
> Agar parallelda P07/P16/P18 allaqachon ishlayotgan bo'lsa — TO'XTA, parallel merge conflict
> xavfi bor. Faqat bitta agent `mes.module.ts` ga tegsin.

### DDL holati:

`machine_crews` jadvali **ALLAQACHON mavjud** (`lib/db/src/schema/pp/pp-enhanced.ts:20-36`).
Yangi migration SHART EMAS. DDL darvozasi YOPIQ — hech qanday `CREATE TABLE` yo'q.

---

## 2. VIZYON

### Modul maqsadi (EP-MES vizyon hujjatidan — `MUSLIMBEK-PROMT-06-MES-2026-06-08.md`):

MES = **zavod pol koordinatori, OEE dvigateli, operator tablet markazi** (§1 WHY, qator 29).
Operator IoT-tablet = zavod poli markazi (printsip E4): brak kiritish, TB xavfsizlik cheklisti,
vaqt to'xtatish jurnali, priladka vaqti, material-kit skanerlash — HAMMASI operator tablet
orqali (qator 49).

### Shu paket hal qiladigan 3 ta muammo:

#### Muammo 1 — `operator` roli IOT_READ dan tushib qolgan (403 xato)

Vizyon: Operator JWT bilan `/api/iot/*` endpointlarga murojaat qila olishi shart.
Hozir: `IOT_READ` ro'yxatida `operator` roli yo'q → har qanday operator JWTsi 403 qaytaradi.
Qabul mezoni: `operator` roli bilan JWT → GET/POST `/api/iot/*` → 200/201.

#### Muammo 2 — `MesGateway` NestJS DI da ro'yxatdan o'tmagan

Vizyon: Real-time OEE push (`pushOeeUpdate`) va smena topshiruv push (`pushShiftHandover`)
ishlashi kerak (ADR-008: /mes WebSocket namespace). Hozir: `MesGateway` `mes.module.ts`
providers arrayida yo'q → NestJS DI instantiate qilmaydi → WebSocket aloqasi o'lik.
Qabul mezoni: `MesGateway` providers ga qo'shilgandan keyin `/mes` WebSocket namespace
ulanishi mumkin bo'ladi.

#### Muammo 3 — `POST /api/iot/production-sessions/:id/crew` endpoint yo'q (404)

Vizyon (printsip E2 + E4): IoT tablet cheklistidan ishlab chiqarishni boshlashda jamoa
tayinlanishi shart — `masterId` (majburiy), `polmasterId`, `shogirdId`, `roklerId` (ixtiyoriy).
`useIoTTablet.ts:172` bu endpointni chaqiradi → 404 xatosi chiqadi → checklist bloklanadi →
`startProductionFromChecklist` mutation muvaffaqiyatsiz tugaydi.
Qabul mezoni: POST → `machine_crews` ga real INSERT → GET `/crew` esa yangi qatorni qaytaradi.

---

## 3. HOZIRGI HOLAT

### Mavjud (exists):

```
apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts:116
  export const IOT_READ = ['super_admin', 'director', 'production_manager',
                           'ERP_MANAGER', 'admin', 'technologist'];
  // ← 'operator' YO'Q — XATO
```

```
apps/api/src/modules/iot/presentation/iot-tablet.controller.ts:268-278
  @Get('production-sessions/:id/crew') @Roles(...IOT_READ)
  async getProductionSessionCrew(@Param('id') id: string) {
    // SELECT * FROM machine_crews — ishlaydi (GET bor)
  }
  // ← POST yo'q — XATO
```

```
apps/api/src/modules/mes/mes.gateway.ts
  @WebSocketGateway({ namespace: '/mes', ... })
  @Injectable()
  export class MesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly jwtService: JwtService) {}
    // pushOeeUpdate(), pushShiftHandover() metodlari mavjud
    // ← Lekin mes.module.ts da REGISTER QILINMAGAN
  }
```

```
apps/api/src/modules/mes/mes.module.ts:58-77
  @Module({
    imports: [CqrsModule, EventEmitterModule.forRoot()],
    // ← JwtModule yo'q, MesGateway yo'q
    providers: [
      ...handlers, ...listeners,
      LmsCertExpiredBlockService,
      { provide: MES_REPO, useClass: DrizzleMesRepository },
      ...
      // ← MesGateway bu yerda YO'Q
    ],
  })
```

```
lib/db/src/schema/pp/pp-enhanced.ts:20-36
  export const machineCrews = pgTable("machine_crews", {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id")
      .references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
    masterId: integer("master_id").notNull(),
    polmasterId: integer("polmaster_id"),
    shogirdId: integer("shogird_id"),
    roklerId: integer("rokler_id"),
    workCenterId: integer("work_center_id"),
    employeeId: integer("employee_id"),
    productionOrderId: integer("production_order_id"),
    role: varchar("role", { length: 30 }),
    startDate: varchar("start_date", { length: 10 }),
    endDate: varchar("end_date", { length: 10 }),
    isActive: boolean("is_active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  });
  // ← Jadval MAVJUD; DDL kerak emas
```

```
apps/api/src/modules/auth/auth.module.ts:37-46
  JwtModule.registerAsync({
    global: true,   // ← GLOBAL = barcha modul JwtService ni import qilmasdan oladi
    inject: [ConfigService],
    useFactory: (cfg: ConfigService) => ({ secret: cfg.getOrThrow<string>('JWT_SECRET'), ... }),
  }),
  // ← Shuning uchun mes.module.ts ga JwtModule import QILISH SHART EMAS
```

### Yo'q (missing):

```
- POST /api/iot/production-sessions/:id/crew  → useIoTTablet.ts:172 da chaqiriladi, 404
- IOT_READ da 'operator' roli               → operator JWTsi 403
- MesGateway mes.module.ts providers da     → WebSocket o'lik
```

### Buzuq/Soxta (broken/fake):

```
apps/api/src/modules/iot/presentation/iot-tablet.controller.ts:9 (comment)
  // DDL-GATE (needs new table): crew, evaluation, material-return
  // ← Bu izoh ESKIRGAN: evaluation (shift_evaluations) va material-return
  //   (material_movements) ALLAQACHON ishlaydi (controller:332-385).
  //   machine_crews jadvali ham mavjud. DDL darvozasi OCHIQ emas — faol jadval bor.
  //   Bu izohni yangilash kerak (chalkashtirib qo'yadi).
```

---

## 4. ISH (qadam-baqadam)

### Qadam 1 — `IOT_READ` ga `operator` roli qo'shish

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts`  
**Qator:** 116  
**O'zgarish:** `IOT_READ` konstantasiga `'operator'` qo'shish

**OLDIN (qator 116):**
```typescript
export const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];
```

**KEYIN:**
```typescript
export const IOT_READ = [
  'super_admin',
  'director',
  'production_manager',
  'ERP_MANAGER',
  'admin',
  'technologist',
  'operator',   // EP-MES-001: IoT tablet asosiy foydalanuvchi; operator JWT /iot/* endpointlarga kirishi kerak
];
```

**Izoh:** Bu o'zgarish barcha `@Roles(...IOT_READ)` dekoratorlarini birdan to'g'irlaydi —
tablet/sessions (117), tablet/shift (104), production-sessions (245, 270, 282, 295, 308,
332, 363, 389), material-kit-items (214, 227), tablet/handover (183). Har birini alohida
qo'lda o'zgartirish shart emas — konstantadan keladi.

**Tekshirish (oldin o'zgartir):**
```bash
# Hozir operator roli bor-yo'qligini tekshir
grep -n "IOT_READ" apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts
# Kutilgan natija: qator 116 da 'operator' YO'Q
```

---

### Qadam 2 — `MesGateway` ni `mes.module.ts` providers ga qo'shish

**Fayl:** `apps/api/src/modules/mes/mes.module.ts`  
**Qator:** 39-40 (import), 62-75 (providers)

> ⚠️ **Avval tekshir:** Agar P07/P16/P18 parallelda ishlayotgan bo'lsa va ular ham
> `mes.module.ts` ga teggisi kelsa — bu qadamni flag qil va egasidan qaror so'ra.
> Faqat bitta agent `mes.module.ts` ga tegishi shart (Q-31 subagent izolyatsiyasi).

**OLDIN (import bloki, qatorlar 6-40):**
```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
// ... (boshqa importlar)
import { PpReleasedMesListener } from './infrastructure/event-handlers/pp-released-mes.listener';
```

**KEYIN (import blokiga `MesGateway` import qo'shish — 40-qatordan keyin):**
```typescript
// MAVJUD importlar o'zgarishsiz qoladi
import { PpReleasedMesListener } from './infrastructure/event-handlers/pp-released-mes.listener';
import { MesGateway } from './mes.gateway';  // ← QO'SHILDI: WebSocket /mes namespace
```

**OLDIN (providers array, qatorlar 61-75):**
```typescript
  providers: [
    ...handlers,
    ...listeners,
    LmsCertExpiredBlockService,    // Wave 4 round-2: shared by Trigger 17 split listeners
    { provide: MES_REPO, useClass: DrizzleMesRepository },
    { provide: DOWNTIME_REPO, useClass: DrizzleDowntimeRepository },
    { provide: WORK_ORDERS_REPO, useClass: DrizzleWorkOrdersRepository },
    WorkOrdersService,
    MesMaintenanceService,
    MesShiftsStatsService,
    MesProductionSessionsService,
    MesMaintenanceRepository,
    MesShiftsStatsRepository,
    MesProductionSessionsRepository,
  ],
```

**KEYIN:**
```typescript
  providers: [
    ...handlers,
    ...listeners,
    LmsCertExpiredBlockService,    // Wave 4 round-2: shared by Trigger 17 split listeners
    MesGateway,                    // ADR-008: /mes WebSocket namespace — OEE + shift real-time push
    { provide: MES_REPO, useClass: DrizzleMesRepository },
    { provide: DOWNTIME_REPO, useClass: DrizzleDowntimeRepository },
    { provide: WORK_ORDERS_REPO, useClass: DrizzleWorkOrdersRepository },
    WorkOrdersService,
    MesMaintenanceService,
    MesShiftsStatsService,
    MesProductionSessionsService,
    MesMaintenanceRepository,
    MesShiftsStatsRepository,
    MesProductionSessionsRepository,
  ],
```

**Izoh (`JwtModule` kerakmi?):**  
`auth.module.ts:37` da `JwtModule.registerAsync({ global: true, ... })` mavjud.
`global: true` bayrog'i NestJS da `JwtService` ni barcha modul uchun global provider
sifatida ro'yxatga oladi — `mes.module.ts` da `JwtModule` ni `imports` ga qo'shish
**SHART EMAS**. `JwtService` `MesGateway` konstruktori orqali avtomatik inject qilinadi.

---

### Qadam 3 — `POST /api/iot/production-sessions/:id/crew` endpoint qo'shish

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts`  
**Joylashish:** Mavjud `GET /production-sessions/:id/crew` (qator 268-278) dan KEYIN,
`POST /production-sessions/:id/start` (qator 280) DAN OLDIN.  
**Zod schema:** Yangi `CrewAssignSchema` — `iot-tablet.schemas.ts` ga qo'shiladi.

#### 3a — `iot-tablet.schemas.ts` ga schema qo'shish

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts`  
**Qator:** 116 dan keyin (IOT_READ konstantasidan oldin), yoki fayl oxiriga.

`machine_crews` jadvali ustunlari (pp-enhanced.ts:20-36):
- `session_id` VARCHAR (NOT NULL, FK → production_sessions.id CASCADE)
- `master_id` INTEGER NOT NULL
- `polmaster_id` INTEGER NULLABLE
- `shogird_id` INTEGER NULLABLE
- `rokler_id` INTEGER NULLABLE

Zod schemasi:
```typescript
// apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts ga qo'shish
// (116-qatordan keyin, IOT_READ dan oldin yoki oxiriga)

/**
 * POST /iot/production-sessions/:id/crew body schema.
 * Faqat asosiy 4 rol (machine_crews jadvalidagi ustunlarga mos):
 *   masterId    — majburiy (usta), machine_crews.master_id INTEGER NOT NULL
 *   polmasterId — ixtiyoriy (pol-usta)
 *   shogirdId   — ixtiyoriy (shogird)
 *   roklerId    — ixtiyoriy (rokler)
 * sessionId URL param orqali keladi (@Param), body da shart emas.
 * FE manba: useIoTTablet.ts:172 → crewAssignment = { masterId, polmasterId,
 *   shogirdId, roklerId } (null = tanlanmagan).
 */
export const CrewAssignSchema = z.object({
  masterId:    z.coerce.number().int().positive({ message: 'masterId majburiy (musbat butun son)' }),
  polmasterId: z.coerce.number().int().positive().nullable().optional(),
  shogirdId:   z.coerce.number().int().positive().nullable().optional(),
  roklerId:    z.coerce.number().int().positive().nullable().optional(),
}).passthrough();
```

> **Muhim:** `masterId` — MAJBURIY (`machine_crews.master_id` `NOT NULL`).
> FE `IoTChecklistModal.tsx:199` ham `!crewAssignment.masterId` bo'lsa tugmani disable qiladi.
> Zod `positive()` validatsiyasi nolni ham rad etadi — bu to'g'ri (0 = "aniqlanmagan" emas).

**iot-tablet.controller.ts importiga qo'shish:**
```typescript
// qator 35-52 orasidagi import blokiga CrewAssignSchema ni qo'shish
import {
  IotPassthroughSchema,
  TabletLoginSchema,
  TabletSessionSchema,
  ProductionSessionSchema,
  TabletSosAlertSchema,
  TabletEquipmentQuerySchema,
  TabletOrdersQuerySchema,
  WorkerScheduleQuerySchema,
  DefectReportSchema,
  InlineQcSchema,
  HandoverSchema,
  MaterialKitScanSchema,
  EvaluationSchema,
  MaterialReturnSchema,
  CrewAssignSchema,   // ← QO'SHILDI
  IOT_READ,
  coerceWorkerId,
} from './iot-tablet.schemas';
```

#### 3b — Controller ga POST endpoint qo'shish

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts`  
**Joylashish:** qator 278 dan keyin (GET crew oxiri), qator 280 dan oldin (POST start).

**QO'SHILADIGAN KOD (qator 279 ga kiritish):**

```typescript
  @ApiOperation({ summary: 'Assign machine crew for production session (INSERT machine_crews)' })
  @ApiResponse({ status: 201, description: 'Crew assigned' })
  @ApiResponse({ status: 400, description: 'masterId majburiy' })
  @Post('production-sessions/:id/crew') @Roles(...IOT_READ)
  async assignProductionSessionCrew(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    // EP-MES-001 / E4: checklist bosqichida jamoa tayinlanadi (masterId MAJBURIY)
    const dto = CrewAssignSchema.parse(body ?? {});
    const sessionId = String(parseInt(id, 10));   // machine_crews.session_id = VARCHAR → string

    const r = await db.execute(sql`
      INSERT INTO machine_crews (
        session_id,
        master_id,
        polmaster_id,
        shogird_id,
        rokler_id,
        created_at
      ) VALUES (
        ${sessionId},
        ${dto.masterId},
        ${dto.polmasterId ?? null},
        ${dto.shogirdId   ?? null},
        ${dto.roklerId    ?? null},
        NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `);

    const row = ((r as Rows).rows ?? [])[0] ?? null;
    // ON CONFLICT DO NOTHING → null bo'lishi mumkin (allaqachon tayinlangan)
    return {
      data:    row,
      sessionId: parseInt(id, 10),
      assigned: row !== null,
    };
  }
```

**Texnik izohlar:**

1. **`sessionId` — VARCHAR masalasi:** `machine_crews.session_id` Drizzle schemada
   `varchar("session_id")` (pp-enhanced.ts:22) — `production_sessions.id` INTEGER bilan
   varchar FK. SQL `INSERT` da `String(parseInt(id, 10))` ishlatiladi: URL param string
   bo'lib keladi, `parseInt` xavfli belgilarni tozalaydi, `String()` esa varchar ga
   mos qiladi.

2. **`ON CONFLICT DO NOTHING`:** Bir sessiyaga bir necha marta POST (retry, double-tap)
   bo'lishi mumkin. `ON CONFLICT DO NOTHING` idempotent qiladi — ikkinchi murojaat
   xato bermaydi, faqat `assigned: false` qaytaradi.

3. **Raw SQL izoh:** `machine_crews` jadvali Drizzle schemada `@workspace/db` dan
   re-export qilingan yoki yo'qligini tekshirish kerak. Agar Drizzle insert ishlatsa:
   ```typescript
   // ALTERNATIV: Drizzle ORM variant (agar machineCrews import qilinsa)
   // import { machineCrews } from '@workspace/db';
   // await db.insert(machineCrews).values({ sessionId, masterId: dto.masterId, ... })
   //         .onConflictDoNothing();
   ```
   Raw SQL ishlatilishining sababi: mavjud controller patternga mos (qator 273-277 da
   ham raw SQL — `SELECT * FROM machine_crews`), va import chain xavfsiz.

4. **`Rows` type:** Controller da allaqachon `type Rows = { rows?: unknown[] }` (qator 54)
   mavjud — yangi qo'shish shart emas.

#### 3c — Eskirgan izohni yangilash (Q-46 — noto'g'ri ma'lumot o'chiriladi)

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts`  
**Qator:** 9

**OLDIN:**
```typescript
 *   DDL-GATE (needs new table): crew, evaluation, material-return.
```

**KEYIN:**
```typescript
 *   Phase-2 gaps: 3-stage session lifecycle (sozlash/asosiy/yakunlash, EP-MES-001),
 *   TB safety checklist per session (EP-MES-004), SOS org-chart routing (EP-MES-009).
```

**Sabab:** `crew` (POST qo'shildi, qadam 3b), `evaluation` (qator 332-358 da ishlaydi),
`material-return` (qator 363-385 da ishlaydi) — barchasi ISHLAYDI. Eskirgan izoh
yangi bajaruvchini chalg'itadi (Q-46 qoidasi: to'g'ri ishlamaydigan izoh ham o'chiriladi).

---

## 5. DDL

**Bu paketda DDL YO'Q.** `machine_crews` jadvali allaqachon mavjud:

```
lib/db/src/schema/pp/pp-enhanced.ts:20-36 — machineCrews pgTable (VERIFIED)
```

Keyingi paketlar (Phase 2+) uchun DDL rejalashtirilgan (egasi ruxsati kerak):

```sql
-- DEFERRED — P15 DA EMAS, KEYINGI FAZADA:
-- ALTER TABLE production_sessions
--   ADD COLUMN stage VARCHAR(20) DEFAULT 'sozlash',
--   ADD COLUMN sozlash_started_at TIMESTAMPTZ,
--   ADD COLUMN sozlash_ended_at TIMESTAMPTZ,
--   ADD COLUMN asosiy_started_at TIMESTAMPTZ,
--   ADD COLUMN yakunlash_started_at TIMESTAMPTZ,
--   ADD COLUMN yakunlash_ended_at TIMESTAMPTZ;
-- APPROVED: <egasi> <sana>  ← Bu fayl YOZILMAYDI, DDL darvozasi YOPIQ
```

---

## 6. QABUL MEZONI

### Minimal checklist (barcha qatorlar ✅ bo'lishi shart):

```
[ ] 1. iot-tablet.schemas.ts:IOT_READ — 'operator' roli mavjud (7 element)
[ ] 2. BE tsc 0 — `pnpm --filter @europrint/api exec tsc --noEmit` = 0 xato
[ ] 3. FE tsc 0 — `pnpm --filter erp-dashboard exec tsc --noEmit` = 0 xato
[ ] 4. mes.module.ts providers — MesGateway kiritilgan (import + providers array)
[ ] 5. POST /api/iot/production-sessions/:id/crew — HTTP 201 qaytaradi
[ ] 6. DB-proof: POST crew → SELECT machine_crews WHERE session_id = :id → qator mavjud
[ ] 7. operator JWTsi bilan GET /api/iot/tablet/sessions → 200 (avval 403 edi)
[ ] 8. operator JWTsi bilan POST /api/iot/production-sessions/:id/crew → 201
[ ] 9. reviewer-result-pattern.sh — FAIL: 0
[ ] 10. reviewer-jwt-guard.sh — PASS (yangi endpoint @Roles(...IOT_READ) bor)
[ ] 11. Golden-thread: POST crew → GET crew → natija izchil (round-trip)
[ ] 12. Regressiya yo'q: mavjud GET /crew, POST /start, POST /stop, POST /defect ishlamoqda
```

### Biznes qoidasi tekshiruvi (vizyon-moslik Q-40):

```
[ ] masterId bo'lmasa → Zod 400 xato (EP-MES plastinka: masterId NOT NULL)
[ ] polmasterId/shogirdId/roklerId null bo'lsa → INSERT qilinadi (ixtiyoriy)
[ ] Bir sessiyaga ikki marta POST crew → ikkinchi so'rov ham 201 qaytaradi
    (ON CONFLICT DO NOTHING, assigned: false)
[ ] MesGateway WebSocket /mes namespace — ulanish mumkin (isNotDead)
```

---

## 7. SELF-VERIFY

### 7a — TypeScript tekshiruvi

```bash
# Backend typecheck
pnpm --filter @europrint/api exec tsc --noEmit
# Natija: 0 xato

# Frontend typecheck
pnpm --filter erp-dashboard exec tsc --noEmit
# Natija: 0 xato
```

### 7b — Reviewer skriptlari

```bash
# Result<T> pattern
bash scripts/reviewer-result-pattern.sh
# Natija: FAIL: 0

# JWT Guard
bash scripts/reviewer-jwt-guard.sh
# Natija: PASS (yangi POST crew ham @Roles bor)

# As-unknown stubs
bash scripts/reviewer-as-unknown.sh
# Natija: yangi xato YO'Q (avvalgi 3 ta FAIL o'zgarmaydi — bu paket tegmagan fayllarda)
```

### 7c — IOT_READ tekshiruvi (static)

```bash
grep -n "IOT_READ" apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts
# Natija:
# 116: export const IOT_READ = [
# 117:   'super_admin',
# 118:   'director',
# ...
# 123:   'operator',  ← BU QATOR MAVJUD BO'LISHI KERAK
```

### 7d — DB-proof (jonli tekshiruv)

```bash
# 1. Backend ishga tushirilganligini tekshir
curl -s http://127.0.0.1:3030/api/auth/health | jq '.status'
# Natija: "ok" yoki "healthy"

# 2. operator JWTsi olish (login orqali)
# (operator roli bilan foydalanuvchi bo'lishi kerak — test uchun mavjud operatorni ishlat)
OPERATOR_JWT="<operator_jwt_token_bu_yerga>"

# 3. Avval production session yaratish
SESSION=$(curl -s -X POST http://127.0.0.1:3030/api/iot/production-sessions \
  -H "Authorization: Bearer $OPERATOR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1, "machineId": 1}' | jq -r '.data.id')
echo "Session ID: $SESSION"
# Natija: raqam (masalan, 42)

# 4. Crew tayinlash (POST - YANGI ENDPOINT)
curl -s -X POST "http://127.0.0.1:3030/api/iot/production-sessions/$SESSION/crew" \
  -H "Authorization: Bearer $OPERATOR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"masterId": 1, "polmasterId": 2, "shogirdId": null, "roklerId": null}' | jq .
# Kutilgan natija:
# { "data": { "id": <raqam>, "session_id": "<SESSION>", "master_id": 1, ... }, "assigned": true }

# 5. GET crew — round-trip tekshiruvi
curl -s "http://127.0.0.1:3030/api/iot/production-sessions/$SESSION/crew" \
  -H "Authorization: Bearer $OPERATOR_JWT" | jq .
# Kutilgan natija: { "items": [{ "id": ..., "master_id": 1, "polmaster_id": 2, ... }], "total": 1 }

# 6. To'g'ridan DB ga tekshiruv
node _audit/q.cjs "SELECT * FROM machine_crews WHERE session_id = '$SESSION' ORDER BY id DESC LIMIT 1"
# Natija: 1 qator, master_id = 1

# 7. masterId YO'Q holat — 400 bo'lishi kerak
curl -s -X POST "http://127.0.0.1:3030/api/iot/production-sessions/$SESSION/crew" \
  -H "Authorization: Bearer $OPERATOR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"polmasterId": 2}' | jq '.statusCode'
# Kutilgan natija: 400 (Zod validation xato)

# 8. operator JWT bilan mavjud GET tablet/sessions — avval 403, endi 200
curl -s http://127.0.0.1:3030/api/iot/tablet/sessions \
  -H "Authorization: Bearer $OPERATOR_JWT" | jq '.total'
# Kutilgan natija: raqam (0 yoki ko'proq), EMAS 401/403

# 9. MesGateway — WebSocket ulanish (ishlash tekshiruvi, ixtiyoriy)
# node -e "
#   const io = require('socket.io-client');
#   const s = io('http://127.0.0.1:3030/mes', { auth: { token: process.env.JWT } });
#   s.on('connect', () => { console.log('CONNECTED:', s.id); s.disconnect(); });
#   s.on('connect_error', (e) => { console.error('ERROR:', e.message); });
# "
```

### 7e — Regressiya tekshiruvi

```bash
# Mavjud endpoint'lar hali ishlayotganligini tekshir
# POST tablet login
curl -s -X POST http://127.0.0.1:3030/api/iot/tablet/login \
  -H "Content-Type: application/json" \
  -d '{"tabelNumber":"999","password":"wrong"}' | jq '.statusCode'
# Natija: 401 (ishlaydi, crash bermaslik kerak)

# GET crew (GET hali ishlaydi)
curl -s "http://127.0.0.1:3030/api/iot/production-sessions/1/crew" \
  -H "Authorization: Bearer $OPERATOR_JWT" | jq '.total'
# Natija: raqam (crash emas)
```

---

## 8. COMMIT

### Staging va commit tartibi:

```bash
# 1. Faqat egasi fayllarni stage qil
git add apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts
git add apps/api/src/modules/iot/presentation/iot-tablet.controller.ts

# Agar mes.module.ts ham bu paket tomonidan o'zgartirilgan bo'lsa:
# git add apps/api/src/modules/mes/mes.module.ts

# 2. Hech qachon:
# git add -A  ← TAQIQ
# git add .   ← TAQIQ

# 3. Commit (Wave 1, P15)
git commit -m "$(cat <<'EOF'
feat(iot/mes): P15 Wave1 — operator guard, MesGateway DI, POST crew endpoint

- iot-tablet.schemas.ts: add 'operator' to IOT_READ (was 403 for all operators)
- mes.module.ts: register MesGateway in providers (WebSocket /mes namespace was dead)
- iot-tablet.controller.ts: add POST /iot/production-sessions/:id/crew
  (INSERT machine_crews; ON CONFLICT DO NOTHING; masterId required per EP-MES-001)
- Update stale DDL-GATE comment (crew/eval/mat-return all implemented)

DB-proof: POST crew → machine_crews INSERT RETURNING * confirmed.
BE tsc 0, reviewer-result-pattern FAIL:0, reviewer-jwt-guard PASS.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# 4. Holat tekshiruvi
git status
# Natija: faqat commit qilingan fayllar, boshqa o'zgarish ko'rinmasin
```

### Commit maydon qoidalari:

- **Bitta commit = bitta mantiqiy guruh** (3 ta wiring o'zgarish birgalikda mantiqiy)
- **Fayl sanasi:** `git log --oneline -1` bilan tasdiqlash
- **HECH QACHON** `--no-verify`, `--no-gpg-sign`, `-A`, `.`

---

## Appendix A — Fayl tuzilishi (reference)

```
apps/api/src/modules/iot/presentation/
├── iot-tablet.schemas.ts          ← P15 EGASI (IOT_READ + CrewAssignSchema)
├── iot-tablet.controller.ts       ← P15 EGASI (POST crew endpoint)
├── iot-sensors.controller.ts      ← TEGMA
├── iot-main.controller.ts         ← TEGMA
└── ...

apps/api/src/modules/mes/
├── mes.module.ts                  ← P15 (MesGateway registration) — UMUMIY FAYL
├── mes.gateway.ts                 ← TEGMA (faqat o'qiladi)
└── ...

lib/db/src/schema/pp/
├── pp-enhanced.ts                 ← TEGMA (machine_crews — faqat o'qiladi)
└── pp-iot.ts                      ← TEGMA (production_sessions — faqat o'qiladi)
```

---

## Appendix B — FE chaqiruv joyi (reference)

```typescript
// artifacts/erp-dashboard/src/pages/iot/useIoTTablet.ts:169-175
const startProductionFromChecklist = useMutation({
  mutationFn: async () => {
    if (!core.activeSession) throw new Error("No session");
    // Qator 172: BU ENDPOINT — P15 natijasi bilan to'ldiriladi
    await data.tabletFetch("POST",
      `/api/iot/production-sessions/${core.activeSession.id}/crew`,
      core.crewAssignment   // { masterId, polmasterId, shogirdId, roklerId }
    );
    // Qator 173: agar crew POST muvaffaqiyatli bo'lsa — start chaqiriladi
    const res = await data.tabletFetch("POST",
      `/api/iot/production-sessions/${core.activeSession.id}/start`
    );
    return res.json() as Promise<ProductionSession>;
  },
  ...
});
```

`crewAssignment` (useIoTTabletCore.ts:90-92):
```typescript
const [crewAssignment, setCrewAssignment] = useState<CrewAssignment>({
  masterId: null, polmasterId: null, shogirdId: null, roklerId: null,
});
```

→ Zod `CrewAssignSchema` null qiymatlarini qabul qiladi (`nullable().optional()`).  
→ `masterId: null` bo'lsa Zod `positive()` validatsiyasi 400 qaytaradi — FE da tugma
   disable (IoTChecklistModal.tsx:199: `disabled={... || !crewAssignment.masterId ...}`)
   shuning uchun amalda bo'lmasligi kerak, lekin BE validatsiyasi defense-in-depth.

---

## Appendix C — sharedFileResolutions uchun eslatma (P07/P16/P18 ga)

Agar siz P07/P16/P18 agentsiz:

> `mes.module.ts` — P15 tomonidan providers array o'zgartirildi:
> `MesGateway` qo'shildi (import + providers[]).
> Agar siz ham `mes.module.ts` ga tegishingiz kerak bo'lsa —
> avval `git log apps/api/src/modules/mes/mes.module.ts` bilan
> P15 commitini ko'ring. Keyin faqat O'Z o'zgarishingizni qo'shing
> (merge conflict bo'lsa — P15 o'zgarishini saqlang, ustiga o'zingiznikini qo'shing).

---

## Appendix D — Kelajakdagi fazalar (bu paket BAJARMAYDI)

Quyidagilar P15 DOIRASIDAN TASHQARI — keyingi paketlar uchun:

| Muammo | Paket | Maqsad |
|--------|-------|--------|
| 3-bosqich session (sozlash/asosiy/yakunlash, EP-MES-001) | **P16** ✅ (amalga oshirildi) | DDL: production_sessions.stage |
| OEE formula tuzatish — sozlash vaqti ajratish (EP-MES-014) | **P16** ✅ (amalga oshirildi) | calcOee sozlashStartedAt-sozlashEndedAt delta |
| TB xavfsizlik cheklisti per session (EP-MES-004) | **P17** ⏳ DDL GATED | mes_safety_checklist_items — egasi ruxsati kerak |
| WMS material deduction (MesCompletedEvent → warehouse_stock) | **P17** ✅ (amalga oshirildi) | WMS deduction listener (pending_confirmation) |
| SOS org-chart routing (EP-MES-009) | Phase 3 | event handler |
| downtime_reason_codes seed (~20 qator) | Phase 3 | seed (DDL emas) |
| shift_types A/B/C seed | Phase 3 | seed (DDL emas) |
| Smena reja ekrani | Phase 6 | FE |
| OEE-target alert (EP-MES-015) | Phase 6 | equipment.oee_target DDL + EGASI QIYMATI |
| Smena handover cron (EP-MES-023) | Alohida to'lqin | 5-daqiqa cron + avto-trigger |
| Bonus A/B/C tier (EP-MES-027) | P27/P28 HR | EGASI QIYMATI KERAK (sum, foiz emas) |
| ~30 mashina seed (EP-IOT-031) | P44/P45 (IOT) | P44╳P45 kross-to'qnashuv hal qilinsin |

---

## Appendix D2 — CONFORM-FIX xulosa (00-INTERVYU-MOSLIK.md §2 MES — P15 hissasi)

P15 3 ta wiring tuzatishi egasi qolganlarini (P16/P17) bloklamaslik uchun kerakli zamindir.
P15 ning CONFORM holati: **MATCH** (3 muammo to'g'ri aniqlangan va to'g'ri hal qilinmoqda).

Quyidagi elementlar P15 scope emas — P16/P17 CONFORM jadvallari qarang:

| Element | Holat | Qaerda hal |
|---------|-------|-----------|
| OEE sozlash-vaqti ajratish (asosiy teshik) | ✅ P16 da to'g'irlandi | P16 §9 |
| complete-with-triple stub → 501 | ✅ P16 da to'g'irlandi | P16 QADAM 4 |
| OEE-target alert | ⏳ DEFER Phase6 DDL | P16 §9 |
| Smena handover | ⏳ DEFER | P17 §12 |
| Bonus A/B/C summasi | ⏳ DEFER + EGASI QIYMATI | P17 §12 |
| TB-checklist tablet oqimi | ⏳ DDL GATED | P17 §12 |
| ~30 mashina seed | ⏳ P44/P45 | P17 §12 |

---

## Appendix E — mes.module.ts to'liq oldin/keyin ko'rinishi

Bu bo'lim P07/P16/P18 uchun reference va merge conflict oldini olish uchun.

### OLDIN (mes.module.ts to'liq holat):

```typescript
/**
 * @module mes.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MesSessionsController } from './presentation/mes-sessions.controller';
import { MesOperationsController } from './presentation/mes-operations.controller';
import { MesMaintenanceController }  from './presentation/mes-maintenance.controller';
import { MesShiftsStatsController }  from './presentation/mes-shifts-stats.controller';
import { MesProductionSessionsController } from './presentation/mes-production-sessions.controller';
import { StartSessionHandler } from './application/commands/start-session.handler';
import { CompleteSessionHandler } from './application/commands/complete-session.handler';
import { RecordDowntimeHandler } from './application/commands/record-downtime.handler';
import { EndDowntimeHandler } from './application/commands/end-downtime.handler';
import { GetSessionsHandler } from './application/queries/get-sessions.handler';
import { GetOeeHandler } from './application/queries/get-oee.handler';
import { GetDowntimeHandler } from './application/queries/get-downtime.handler';
import { GetDowntimeSummaryHandler } from './application/queries/get-downtime-summary.handler';
import { DrizzleMesRepository } from './infrastructure/repositories/drizzle-mes.repo';
import { DrizzleDowntimeRepository } from './infrastructure/repositories/drizzle-downtime.repo';
import { MES_REPO, DOWNTIME_REPO } from './domain/repositories/mes.repository';
import { WorkOrdersService } from './work-orders/work-orders.service';
import { MesMaintenanceService } from './application/mes-maintenance.service';
import { MesShiftsStatsService } from './application/mes-shifts-stats.service';
import { MesProductionSessionsService } from './application/mes-production-sessions.service';
import { DrizzleWorkOrdersRepository } from './work-orders/drizzle-work-orders.repo';
import { WORK_ORDERS_REPO } from './work-orders/i-work-orders.repo';
import { MesMaintenanceRepository } from './infrastructure/repositories/mes-maintenance.repo';
import { MesShiftsStatsRepository } from './infrastructure/repositories/mes-shifts-stats.repo';
import { MesProductionSessionsRepository } from './infrastructure/repositories/mes-production-sessions.repo';
import { LmsCertExpiredMesListener } from './infrastructure/event-handlers/lms-cert-expired-mes.listener';
import { LmsCertExpiredLiveMesListener } from './infrastructure/event-handlers/lms-cert-expired-live-mes.listener';
import { LmsCertExpiredBlockService } from './infrastructure/event-handlers/lms-cert-expired-block.service';
import { PpReleasedMesListener } from './infrastructure/event-handlers/pp-released-mes.listener';

const listeners = [
  LmsCertExpiredMesListener,
  LmsCertExpiredLiveMesListener,
  PpReleasedMesListener,
];

const handlers = [
  StartSessionHandler,
  CompleteSessionHandler,
  RecordDowntimeHandler,
  EndDowntimeHandler,
  GetSessionsHandler,
  GetOeeHandler,
  GetDowntimeHandler,
  GetDowntimeSummaryHandler,
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot()],
  controllers: [MesSessionsController, MesOperationsController, MesMaintenanceController,
                MesShiftsStatsController, MesProductionSessionsController],
  providers: [
    ...handlers,
    ...listeners,
    LmsCertExpiredBlockService,
    { provide: MES_REPO, useClass: DrizzleMesRepository },
    { provide: DOWNTIME_REPO, useClass: DrizzleDowntimeRepository },
    { provide: WORK_ORDERS_REPO, useClass: DrizzleWorkOrdersRepository },
    WorkOrdersService,
    MesMaintenanceService,
    MesShiftsStatsService,
    MesProductionSessionsService,
    MesMaintenanceRepository,
    MesShiftsStatsRepository,
    MesProductionSessionsRepository,
  ],
  exports: [MES_REPO, DOWNTIME_REPO, WORK_ORDERS_REPO, WorkOrdersService],
})
export class MesModule {}
```

### KEYIN (P15 o'zgartirishidan keyin):

```typescript
/**
 * @module mes.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MesSessionsController } from './presentation/mes-sessions.controller';
import { MesOperationsController } from './presentation/mes-operations.controller';
import { MesMaintenanceController }  from './presentation/mes-maintenance.controller';
import { MesShiftsStatsController }  from './presentation/mes-shifts-stats.controller';
import { MesProductionSessionsController } from './presentation/mes-production-sessions.controller';
import { StartSessionHandler } from './application/commands/start-session.handler';
import { CompleteSessionHandler } from './application/commands/complete-session.handler';
import { RecordDowntimeHandler } from './application/commands/record-downtime.handler';
import { EndDowntimeHandler } from './application/commands/end-downtime.handler';
import { GetSessionsHandler } from './application/queries/get-sessions.handler';
import { GetOeeHandler } from './application/queries/get-oee.handler';
import { GetDowntimeHandler } from './application/queries/get-downtime.handler';
import { GetDowntimeSummaryHandler } from './application/queries/get-downtime-summary.handler';
import { DrizzleMesRepository } from './infrastructure/repositories/drizzle-mes.repo';
import { DrizzleDowntimeRepository } from './infrastructure/repositories/drizzle-downtime.repo';
import { MES_REPO, DOWNTIME_REPO } from './domain/repositories/mes.repository';
import { WorkOrdersService } from './work-orders/work-orders.service';
import { MesMaintenanceService } from './application/mes-maintenance.service';
import { MesShiftsStatsService } from './application/mes-shifts-stats.service';
import { MesProductionSessionsService } from './application/mes-production-sessions.service';
import { DrizzleWorkOrdersRepository } from './work-orders/drizzle-work-orders.repo';
import { WORK_ORDERS_REPO } from './work-orders/i-work-orders.repo';
import { MesMaintenanceRepository } from './infrastructure/repositories/mes-maintenance.repo';
import { MesShiftsStatsRepository } from './infrastructure/repositories/mes-shifts-stats.repo';
import { MesProductionSessionsRepository } from './infrastructure/repositories/mes-production-sessions.repo';
import { LmsCertExpiredMesListener } from './infrastructure/event-handlers/lms-cert-expired-mes.listener';
import { LmsCertExpiredLiveMesListener } from './infrastructure/event-handlers/lms-cert-expired-live-mes.listener';
import { LmsCertExpiredBlockService } from './infrastructure/event-handlers/lms-cert-expired-block.service';
import { PpReleasedMesListener } from './infrastructure/event-handlers/pp-released-mes.listener';
import { MesGateway } from './mes.gateway';  // ← P15: ADR-008 /mes WebSocket namespace

const listeners = [
  LmsCertExpiredMesListener,
  LmsCertExpiredLiveMesListener,
  PpReleasedMesListener,
];

const handlers = [
  StartSessionHandler,
  CompleteSessionHandler,
  RecordDowntimeHandler,
  EndDowntimeHandler,
  GetSessionsHandler,
  GetOeeHandler,
  GetDowntimeHandler,
  GetDowntimeSummaryHandler,
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot()],
  // JwtModule import SHART EMAS: auth.module.ts da global:true bilan ro'yxatdan o'tgan
  controllers: [MesSessionsController, MesOperationsController, MesMaintenanceController,
                MesShiftsStatsController, MesProductionSessionsController],
  providers: [
    ...handlers,
    ...listeners,
    LmsCertExpiredBlockService,
    MesGateway,                    // ← P15: /mes WS namespace (JwtService global DI orqali)
    { provide: MES_REPO, useClass: DrizzleMesRepository },
    { provide: DOWNTIME_REPO, useClass: DrizzleDowntimeRepository },
    { provide: WORK_ORDERS_REPO, useClass: DrizzleWorkOrdersRepository },
    WorkOrdersService,
    MesMaintenanceService,
    MesShiftsStatsService,
    MesProductionSessionsService,
    MesMaintenanceRepository,
    MesShiftsStatsRepository,
    MesProductionSessionsRepository,
  ],
  exports: [MES_REPO, DOWNTIME_REPO, WORK_ORDERS_REPO, WorkOrdersService],
})
export class MesModule {}
```

**Diff xulosa (mes.module.ts):**
- 1 ta yangi import qatori: `import { MesGateway } from './mes.gateway';`
- 1 ta yangi provider: `MesGateway,` (providers array ichida `LmsCertExpiredBlockService` dan keyin)
- Jami: +2 qator, 0 o'chirish, 0 mantiqiy o'zgarish boshqa funksional uchun

---

## Appendix F — xato holatlari va edge case'lar

### F1 — `masterId` nol yoki manfiy son

```
Input:  { "masterId": 0 }
Zod:    z.coerce.number().int().positive() → FAIL (0 > 0 false)
HTTP:   400 Bad Request
Xato:   { "message": "masterId majburiy (musbat butun son)", "statusCode": 400 }
```

Izoh: `0` real employee ID bo'lmaydi (SERIAL auto-increment 1 dan boshlanadi).

### F2 — `sessionId` URL parametri noto'g'ri (NaN)

```
URL:    POST /api/iot/production-sessions/abc/crew
Ko'd:   const sessionId = String(parseInt("abc", 10)); → "NaN"
SQL:    INSERT ... session_id = 'NaN' ...
Result: FK violation (machine_crews.session_id → production_sessions.id FK)
        PostgreSQL: 23503 foreign_key_violation
HTTP:   500 Internal Server Error
```

Yaxshilash (bu paket doirasida ixtiyoriy, ammo tavsiya):
```typescript
const rawId = parseInt(id, 10);
if (isNaN(rawId) || rawId <= 0) {
  throw new BadRequestException(`sessionId invalid: ${id}`);
}
const sessionId = String(rawId);
```

Agar xavfsiz yechim kerak bo'lsa — qo'shing. Agar controller qolgan metodlar
(`/start`, `/stop`, `/defect`) da ham xuddi `parseInt(id, 10)` ishlatilayotgan bo'lsa
(qatorlar 288, 302, 311) — izchillik uchun hozir O'ZGARTIRMA (Q-46 regressiya xavfi).

### F3 — Session mavjud emas

```
URL:    POST /api/iot/production-sessions/99999/crew
SQL:    INSERT machine_crews session_id = '99999'
Result: production_sessions.id = 99999 yo'q → FK violation 23503
HTTP:   500 Internal Server Error
```

Bu yetarli — FE `activeSession` null bo'lsa (useIoTTablet.ts:171) throw qiladi,
endpoint ga yetmaydi. Agar qo'shimcha `NotFoundException` kerak bo'lsa — keyingi fazaga.

### F4 — ON CONFLICT DO NOTHING — nima bo'ladi?

```
Birinchi POST:  session_id='42', master_id=1 → INSERT → "assigned": true, "data": {row}
Ikkinchi POST:  session_id='42', master_id=2 → ON CONFLICT DO NOTHING
                → "assigned": false, "data": null
```

`machine_crews` da unique constraint bormi? `pp-enhanced.ts` da `unique()` ko'rsatilmagan.
Demak, aslida ON CONFLICT trigger bo'lmaydi — har POST yangi qator qo'shadi.
Bu `ON CONFLICT DO NOTHING` aslida no-op (conflict bo'lmaydi).

**Xulosa:** Idempotent bo'lish uchun `ON CONFLICT` o'rniga UPSERT ishlatish mumkin,
lekin bu paketning doirasi minimal wiring. Hozir har POST yangi `machine_crews` qatori
qo'shadi. GET /crew → `{ items: [..., ...], total: N }` qaytaradi (N ta qator).

FE xatti-harakati (useIoTTablet.ts:172-173): POST crew → keyin POST start.
GET crew faqat viewing uchun. Bir sessiyaga bir necha crew qatori muammo emas
(brigada a'zolari o'zgarishi mumkin) — bu MA'QUL.

### F5 — MesGateway va EventEmitterModule.forRoot() konflikti

`mes.module.ts` da allaqachon `EventEmitterModule.forRoot()` mavjud (qator 59).
`MesGateway` WebSocket events uchun `EventEmitterModule` ishlatmaydi (`socket.io` to'g'ridan).
`JwtService` esa global (auth.module.ts da `global: true`).
Shuning uchun `MesGateway` ni providers ga qo'shish boshqa importlarga ta'sir qilmaydi.

### F6 — `@WebSocketGateway` va NestJS bootstrap

NestJS `@WebSocketGateway` dekoratori bilan belgilangan class `providers` arrayga
qo'shilganda avtomatik bootstrap qilinadi — alohida `.register()` yoki `useWebSocketAdapter`
shart emas (Socket.IO adapter default).

Bootstrap tekshiruvi: server ishga tushganda logda ko'rinadi:
```
[NestApplication] WebSocket Server running on... port 3030 (namespace: /mes)
```
yoki ulanish test: `io('http://localhost:3030/mes')` ulanishi mumkin bo'ladi.

---

## Appendix G — Parallel agentlar bilan koordinatsiya (Wave 1)

Bu paket Wave 1 da — boshqa barcha MES paketlaridan OLDIN bajariladi.

### Bu paket tugagandan keyin P07/P16/P18 nima oladi:

```
P07 (MES OEE fix):   mes.module.ts ga MesGateway allaqachon qo'shilgan
                     → P07 faqat GetOeeHandler ni handlers array ga qo'shadi
P16 (MES smena):     mes.module.ts ga yangi smena handlers qo'shadi
P18 (MES downtime):  mes.module.ts ga yangi downtime handlers qo'shadi
```

### Merge conflict oldini olish:

```bash
# P07/P16/P18 boshlanishidan oldin:
git log --oneline apps/api/src/modules/mes/mes.module.ts
# P15 commiti ko'rinishi kerak (bu isbot)

# Keyin P07/P16/P18 o'z qo'shimchalarini USTIGA qo'shadi:
# git diff HEAD~1 HEAD -- apps/api/src/modules/mes/mes.module.ts
# Faqat O'Z o'zgarishini ko'rish kerak (P15 ni emas)
```

---

## Appendix H — Holat hisoboti shabloni (qadam tugagach)

Har bir qadam tugagach quyidagi shaklda egaga yuboring:

```
P15 HOLAT HISOBOTI
==================
Qadam 1 (IOT_READ + operator): ✅/❌
  Fayl: apps/api/src/modules/iot/presentation/iot-tablet.schemas.ts:116
  O'zgarish: 'operator' qo'shildi / XATO: <izoh>

Qadam 2 (MesGateway mes.module.ts): ✅/❌
  Fayl: apps/api/src/modules/mes/mes.module.ts
  O'zgarish: import + providers qo'shildi / XATO: <izoh>
  Parallel agent xavfi: bor/yo'q (flag agar bor bo'lsa)

Qadam 3 (POST crew endpoint): ✅/❌
  Fayl: apps/api/src/modules/iot/presentation/iot-tablet.controller.ts
  Schema: CrewAssignSchema iot-tablet.schemas.ts ga qo'shildi
  Endpoint: POST /iot/production-sessions/:id/crew — 201
  DB-proof: machine_crews qatori INSERT tasdiqlandi (session_id=<X>)

TypeScript:
  BE tsc: 0 xato / <N> xato
  FE tsc: 0 xato / <N> xato

Reviewers:
  result-pattern: FAIL: 0 / FAIL: <N>
  jwt-guard: PASS / FAIL

Commit: <sha> chore/schema-convergence

Keyingi: P07/P16/P18 — mes.module.ts da P15 commiti tasdiqlangan ✅
```
