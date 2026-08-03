# P17 — MES (Manufacturing Execution System) + IoT Tablet: MES TB-checklist DDL + WMS deduction + session→card GSD + machine cols

> Direktiva versiyasi: 2026-06-19 · To'lqin: Wave 3 · Bog'liq: P16 tugagandan keyin boshlang.
> Bajaruvchi: Muslimbek · Maslahatchi: Claude · Til: Uzbek (kod = TypeScript/SQL).
> Q-47: bu fayl ≥1000 qator — har qadam, har pattern, har edge-case to'liq yozilgan.

---

## 0. ROL VA QOIDALAR

**Sen 🟢 BAJARUVCHI (EXECUTOR) san.**

Har sessiya boshida quyidagilarni o'qi: `CLAUDE.md` + `docs/agent-constitution.md` + `LOYIHA_QOIDALARI.md`.

**Bu agent WAVE 3 da ishlaydi. dependsOn: ["P16"] — P16 merge bo'lmaguncha bu paket boshlanmaydi.**

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

1. **Result\<T\>** hamma repo/service metodida; `throw` / `null` / `undefined` qaytarish TAQIQ.
2. **@Body Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM** ishlatiladi; raw SQL faqat murakkab holatlarda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo / hardcoded / fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)**: faqat bu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)**: `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. **`git add <aniq-fayl>` faqat**; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30 log/secret HECH QACHON** commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2" / "Strangler Fig" / "V1 vs V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Bu agent WAVE 3 ga tegishli:**
- Wave 3 = P16 tugaganidan keyin boshlanadi (P16 = MES 3-bosqich sessiya hayot aylanishi)
- Bu agent P16 ning `MesCompletedEvent` payload kengaytmasiga tayanadi
- Agar P16 commit bo'lmagan bo'lsa: `git log --oneline | grep P16` bilan tekshir, yo'q bo'lsa TO'XTA

---

## 1. IZOLYATSIYA MANIFESTI

### Bu agent FAQAT quyidagi 4 faylga tegadi:

| # | Fayl | Holat |
|---|------|-------|
| 1 | `apps/api/src/modules/wms/infrastructure/event-handlers/mes-completed-deduction.listener.ts` | YANGI (mavjud emas) |
| 2 | `apps/api/src/modules/wms/wms.module.ts` | MAVJUD — faqat `providers` + `listeners` array qo'shimchasi |
| 3 | `apps/api/src/modules/mes/application/commands/complete-session.handler.ts` | MAVJUD — `MesToHr360Event` payload kengaytmasi |
| 4 | `lib/db/src/schema/mes-schema.ts` | MAVJUD — 2 yangi jadval qo'shimchasi (DDL GATED) |

**FAQAT shu fayllarga teg; boshqa fayl kerak bo'lsa TO'XTA + egasiga flag qil.**

> **BOG'LIQLIK (fayl izolyatsiyasi — Q-23/Q-31):** `equipment` jadvaliga 4 norma ustun
> (`norma_hourly`, `brak_percent_norm`, `oee_target`, `unit_of_measure`) —
> **P12 EGASI qo'shadi** (P12 = `lib/db/src/schema/pp/pp-production.ts` ning yagona egasi,
> manifest §5). P17 bu ustunlarni faqat **O'QIYDI (import qiladi)** — `pp-production.ts`
> faylini P17 EDIT QILMAYDI va commit QILMAYDI. Ustun spetsifikatsiyasi (nom/tur/izoh)
> quyida P12 ga e'lon qilingan DEKLARATSIYA sifatida ko'rsatilgan; uni P12 qo'llaydi.

### DDL GATED fayllar:

Quyidagi migration faylni YOZASAN lekin ISHGA TUSHIRMASSAN:

```
apps/api/src/database/migrations/d6-mes-safety-checklist.sql
```

Faylda `-- APPROVED: <egasi_ismi> <sana>` placeholder bo'lishi SHART. Egasi "ha" deguncha:
- Migration faylni YOZASAN (tayyorlab qo'yasan)
- `drizzle-kit push` yoki `psql` bilan ISHGA TUSHIRMASSAN
- `mes-schema.ts` dagi yangi jadval ta'riflari Drizzle sxema sifatida yoziladi (type-safety uchun) lekin real DB da CREATE qilinmaydi

---

## 2. VIZYON

### Modul maqsadi (docs/audit/MUSLIMBEK-PROMT-06-MES-2026-06-08.md dan):

MES = zavod pol mexanizmi. PP (reja) → MES (ijro) → QC (sifat) → WMS (material) → HR (karta/reyting) → GL (xarajat) zanjirining markazi.

### 4 ta egasi ovverrayd (bular A-defaultdan ustun):

1. **EP-MES-006** — Material uchdan ayirish = norma avto-hisobi + **operator/usta TASDIQ** talab qilinadi. To'liq avto+GL keyinroq. Bu paket: `MesCompletedEvent` → WMS listener → `pending_confirmation` status bilan `warehouse_stock` da deduction_request yaratadi.
2. **EP-MES-001** — Sessiya = 3 bosqich (sozlash/asosiy/yakunlash). Bu paket: faqat P17-ga tegishli qism = `complete-session.handler.ts` ning real metrik olishi (qty/defect/oee).
3. **EP-MES-014** — OEE barcha darajalarda (mashina/smena/brigada/sex). Bu paket: GSD karta yoziladigan event payload to'g'ri metriklar bilan.
4. **EP-MES-027** — Bonus = AI taklif → HR tasdiqi. Bu paket: `MesToHr360Event` ga real qty/defectRate/oee uzatilishi.

### 6 qoidalashtiruvchi tamoyil (bu paketga tegishli):

- **E1 (AI kuzatadi → inson tasdiqlaydi)**: WMS deduction `pending_operator_confirmation` statusida yaratiladi. Operator/usta tasdiqlashidan OLDIN `warehouse_stock` kamaymaydi.
- **E2 (Karta-markazli)**: `MesToHr360Event` haqiqiy `qty` / `defectRate` / `oee` bilan yuboriladi — operator kartasiga (GSD) real ishlab chiqarish ko'rsatkichlari yozilishi uchun.
- **E4 (IoT tablet = pol markazi)**: operator deduction tasdig'i kelajakda `/api/iot/production-sessions/:id/confirm-deduction` orqali. Bu paket faqat backend eventni yaratadi.
- **E6 (Bitta haqiqiy manba)**: `warehouse_stock` = kanonik stok jadvali. `stocks` ga yozish TAQIQ.

### Bu paketning qabul mezoni (vizyon bo'yicha):

| # | Mezon | O'lchov |
|---|-------|---------|
| V1 | `MesCompletedEvent` → WMS listener ishga tushadi | `@OnEvent('mes.session.completed')` log ishlaydi |
| V2 | WMS listener real DB ga `deduction_requests` row yozadi | DB-proof: `SELECT * FROM warehouse_deduction_requests WHERE session_id = ?` |
| V3 | `MesToHr360Event` real qty/defectRate/oee uzatadi | complete-session.handler.ts sessiyadan metrik o'qiydi |
| V4 | `equipment` jadvalida 4 yangi ustun mavjud (P12 qo'llagan, P17 tasdiqlaydi) | `\d equipment` = norma_hourly, brak_percent_norm, oee_target, unit_of_measure |
| V5 | `mes_safety_checklist_items` DDL yozilgan (GATED) | Migration fayl mavjud, `-- APPROVED:` placeholder bor |
| V6 | BE `tsc 0`, FE `tsc 0` | `pnpm tsc --noEmit` ikkalasida 0 xato |

---

## 3. HOZIRGI HOLAT

### 3.1 MAVJUD (exists):

**`complete-session.handler.ts`** (`apps/api/src/modules/mes/application/commands/complete-session.handler.ts`):
- Mavjud: satr 71 — `this.eventBus.publish(new MesCompletedEvent(command.sessionId, _time.now()))`
- Mavjud: satr 74-77 — `MesToHr360Event(command.sessionId, session.getOperatorId(), _time.now())`
- **MUAMMO (satr 74-77)**: `MesToHr360Event` ga faqat `(sessionId, operatorId, timestamp)` uzatiladi. `qty`, `defectRate`, `oee` YO'Q. Natijada HR 360 recordi `qty=0`, `defectRate=0`, `oee=0` bilan yaratiladi — operator karta (GSD) bo'sh ko'rsatkichlar oladi. Bu vizyon E2 ga zid.
- Mavjud: satr 32-58 — `mesRepo.withTransaction()` + `session.complete()` + `session.moveToQc()` + `mesRepo.saveSession()` — REAL ishlaydi.
- Mavjud: satr 64-67 — `session` ma'lumotlari olinadi lekin metriklar (produced_qty, defect_qty, oee) OLINMAYDI.

**`wms.module.ts`** (`apps/api/src/modules/wms/wms.module.ts`):
- Mavjud: satr 105 — `const listeners = [QcPassedListener, RopTriggerHandler]`
- **MUAMMO**: `MesCompletedDeductionListener` BU RO'YXATDA YO'Q — chunki fayl hali yaratilmagan.
- Mavjud: satr 107-182 — `@Module()` to'liq ta'rifi — controllers, providers, exports.

**`mes-schema.ts`** (`lib/db/src/schema/mes-schema.ts`):
- Mavjud: 6 jadval — `mesTasks`, `mesPapkaOrders`, `mesShiftHandovers`, `mesShiftEvaluations`, `mesMaintenanceTasks`, `mesProductionSessions`
- **MUAMMO**: `mes_safety_checklist_items` jadvali YO'Q (DDL-GATE).
- **MUAMMO**: `mes_session_checklist_confirmations` jadvali YO'Q (DDL-GATE).
- Mavjud: satr 1-14 — to'g'ri import pattern (sql, serial, pgTable, text, varchar, integer, timestamp, numeric, uniqueIndex, index, check).

**`pp-production.ts`** (`lib/db/src/schema/pp/pp-production.ts`) — **P12 EGASI; P17 TEGMAYDI**:
- Mavjud: satr 718-761 — `equipment` jadvali ta'rifi.
- **DEKLARATSIYA (P12 qo'llaydi)**: `norma_hourly`, `brak_percent_norm`, `oee_target`, `unit_of_measure` USTUNLARI YO'Q — EP-MES-034/039/040/082 talabi. P17 bu ustunlarni e'lon qiladi, P12 qo'shadi.
- Mavjud: satrl 735 — `status VARCHAR(20) DEFAULT 'active'`.
- Mavjud: satrl 740 — `operatingHours NUMERIC DEFAULT 0`.
- Mavjud: satrl 743-750 — CHECK constraints: category IN ('machine','conveyor','vehicle','tool','other'), status IN ('active','inactive','maintenance','scrapped').

### 3.2 MAVJUD EMAS (missing):

| Element | Tavsif | EP kodi |
|---------|---------|---------|
| `mes-completed-deduction.listener.ts` | WMS tomonidagi MesCompletedEvent tinglovchi | EP-MES-006 |
| `MesCompletedDeductionListener` wms.module.ts providers da | DI ro'yxatida yo'q | — |
| `qty`, `defectRate`, `oee` in `MesToHr360Event` payload | complete-session.handler.ts uzatmaydi | EP-MES-019/020 |
| `norma_hourly`, `brak_percent_norm`, `oee_target`, `unit_of_measure` on `equipment` | 4 ustun yo'q — **P12 qo'shadi** (P17 e'lon qiladi) | EP-MES-034/039/040 |
| `mes_safety_checklist_items` DDL | TB xavfsizlik checklisti uchun master jadval | EP-MES-004/COR-130 |
| `mes_session_checklist_confirmations` DDL | Sessiya bo'yicha checklist audit trail | EP-MES-004 |
| `warehouse_deduction_requests` jadval | WMS deduction confirmation uchun | EP-MES-006 |

### 3.3 BUZUQ YOKI SOXTA (brokenOrFake):

**`complete-session.handler.ts` satrl 74-77 (PARTIAL/BROKEN)**:
```typescript
// HOZIRGI — BUZUQ: 0 metrik uzatadi
this.eventBus.publish(
  new MesToHr360Event(command.sessionId, session.getOperatorId(), _time.now()),
);
```
HR 360 listener bu eventni qabul qilsa ham, `qty=0`, `defectRate=0`, `oee=0` bo'ladi. Operator kartasiga (GSD) bo'sh ma'lumot yoziladi — vizyon E2 va EP-MES-019/020 ga zid.

**`mes-shifts-stats.repo.ts` getStats() (BROKEN — bu paket teg qilmaydi)**:
`mes_production_sessions` (12-ustunli thin jadval) dan o'qiydi, lekin real sessiyalar `production_sessions` (32-ustunli) jadvalida. Bu paketning ownedFiles da emas — faqat ma'lumot uchun.

---

## 4. ISH (QADAM-BAQADAM)

### Qadam 1: `warehouse_deduction_requests` jadvalini `mes-schema.ts` ga qo'sh (DDL GATED)

**Fayl**: `lib/db/src/schema/mes-schema.ts`

**Nima qilasan**: `mes_safety_checklist_items` va `mes_session_checklist_confirmations` jadvallarini qo'shasan + `warehouse_deduction_requests` jadvalini qo'shasan. Bularning barchasi DDL-GATED — Drizzle sxema TS tomonida yoziladi (type-safety uchun), lekin migration ishga tushirilmaydi.

**OLDIN** (fayl oxiri, satrl 225 dan keyin):
```typescript
// (fayl 225 satrlarda tugaydi)
export type InsertMesShiftStat = z.infer<typeof insertMesShiftStatSchema>;
```

**KEYIN** — quyidagi blokni faylning OXIRIGA qo'sh:

```typescript
// ─── 8. mes_safety_checklist_items ──────────────────────────────────────────
// TB (Texnika Xavfsizligi) checklisti uchun master data.
// Har mashina turi uchun operator bajarishi kerak bo'lgan xavfsizlik bandlari.
// DDL-GATED: CREATE TABLE faqat egasi ruxsatidan keyin.
// EP-MES-004, COR-130, HR-079
// -- APPROVED: <egasi_ismi> <sana>

export const mesSafetyChecklistItems = pgTable('mes_safety_checklist_items', {
  id:          serial('id').primaryKey(),
  machineType: varchar('machine_type', { length: 100 }),
  // Masalan: "SM-52", "SM-72", "KBA-105", "Tigellar", "Rezka", "Gf-liniya"
  // NULL = barcha mashina turlariga tegishli umumiy band
  itemText:    text('item_text').notNull(),
  // UZ tilida: "Mashina qopqog'ini yoping va qulflab qo'ying"
  itemTextRu:  text('item_text_ru'),
  sortOrder:   integer('sort_order').notNull().default(0),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mes_safety_items_machine_type_idx').on(t.machineType),
  index('mes_safety_items_active_idx').on(t.isActive),
  index('mes_safety_items_sort_idx').on(t.sortOrder),
]);

export const insertMesSafetyChecklistItemSchema = createInsertSchema(mesSafetyChecklistItems, {
  itemText:    z.string().min(5, "Band matni kamida 5 belgidan iborat bo'lishi kerak"),
  machineType: z.string().max(100).optional().nullable(),
  sortOrder:   z.number().int().nonnegative().default(0),
}).omit({ id: true, createdAt: true } as never);

export type MesSafetyChecklistItem = typeof mesSafetyChecklistItems.$inferSelect;
export type InsertMesSafetyChecklistItem = z.infer<typeof insertMesSafetyChecklistItemSchema>;

// ─── 9. mes_session_checklist_confirmations ──────────────────────────────────
// Har sessiya uchun xavfsizlik cheklisti bajarish audit trail.
// Operator har bandni alohida tasdiqlaydi — bu ro'yxat saqlangandan keyingina
// passChecklist() muvaffaqiyatli bo'lishi mumkin.
// DDL-GATED: CREATE TABLE faqat egasi ruxsatidan keyin.
// EP-MES-004

export const mesSessionChecklistConfirmations = pgTable('mes_session_checklist_confirmations', {
  id:               serial('id').primaryKey(),
  sessionId:        integer('session_id').notNull(),
  // FK → production_sessions(id) — DB migratsiyada qo'shiladi (egasi ruxsati bilan)
  checklistItemId:  integer('checklist_item_id').notNull(),
  // FK → mes_safety_checklist_items(id) — DB migratsiyada qo'shiladi
  confirmedBy:      integer('confirmed_by'),
  // FK → employees.id (app-level)
  confirmedAt:      timestamp('confirmed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mes_session_chk_conf_session_idx').on(t.sessionId),
  index('mes_session_chk_conf_item_idx').on(t.checklistItemId),
  index('mes_session_chk_conf_at_idx').on(t.confirmedAt),
]);

export const insertMesSessionChecklistConfirmationSchema = createInsertSchema(
  mesSessionChecklistConfirmations,
  {
    sessionId:       z.number().int().positive("Sessiya ID musbat butun son bo'lishi kerak"),
    checklistItemId: z.number().int().positive("Checklist band ID musbat bo'lishi kerak"),
    confirmedBy:     z.number().int().positive().optional().nullable(),
  },
).omit({ id: true, confirmedAt: true } as never);

export type MesSessionChecklistConfirmation = typeof mesSessionChecklistConfirmations.$inferSelect;
export type InsertMesSessionChecklistConfirmation = z.infer<typeof insertMesSessionChecklistConfirmationSchema>;

// ─── 10. warehouse_deduction_requests ────────────────────────────────────────
// EP-MES-006: Material uchdan ayirish operator/usta TASDIQ'ini kutadi.
// MesCompletedEvent otilganda WMS listener bu jadvalga row qo'shadi.
// status = 'pending' → operator IoT tablet orqali tasdiqlaydi → 'confirmed'
// Tasdiqlanganda warehouse_stock.quantity KAMAYADI (keyingi qadam).
// DDL-GATED: CREATE TABLE faqat egasi ruxsatidan keyin.
// -- APPROVED: <egasi_ismi> <sana>

export const warehouseDeductionRequests = pgTable('warehouse_deduction_requests', {
  id:              serial('id').primaryKey(),
  sessionId:       integer('session_id').notNull(),
  // FK → production_sessions(id) — egasi ruxsati bilan migratsiyada
  materialId:      integer('material_id').notNull(),
  // FK → material_cards(id) — kanonik material manba
  warehouseId:     integer('warehouse_id'),
  // FK → warehouses(id) — qaysi ombordan ayirilsin
  requestedQty:    numeric('requested_qty', { precision: 15, scale: 4 }).notNull(),
  // Norma hisobi bo'yicha hisoblab chiqilgan miqdor
  actualQty:       numeric('actual_qty',    { precision: 15, scale: 4 }),
  // Operator tasdiqlash paytida o'zgartirishi mumkin (asosli sabab bilan)
  unit:            varchar('unit', { length: 20 }).notNull().default('dona'),
  status:          varchar('status', { length: 30 }).notNull().default('pending_confirmation'),
  // pending_confirmation → confirmed → deducted | rejected
  confirmedBy:     integer('confirmed_by'),
  // FK → employees.id — kim tasdiqladi
  confirmedAt:     timestamp('confirmed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('wdr_session_idx').on(t.sessionId),
  index('wdr_material_idx').on(t.materialId),
  index('wdr_status_idx').on(t.status),
  index('wdr_created_at_idx').on(t.createdAt),
  check('wdr_status_chk', sql`${t.status} IN (
    'pending_confirmation','confirmed','deducted','rejected'
  )`),
  check('wdr_qty_positive', sql`${t.requestedQty} > 0`),
]);

export const insertWarehouseDeductionRequestSchema = createInsertSchema(
  warehouseDeductionRequests,
  {
    sessionId:    z.number().int().positive("Sessiya ID musbat bo'lishi kerak"),
    materialId:   z.number().int().positive("Material ID musbat bo'lishi kerak"),
    requestedQty: z.number().positive("So'ralgan miqdor musbat bo'lishi kerak"),
    unit:         z.string().min(1).max(20).default('dona'),
    status:       z.enum(['pending_confirmation','confirmed','deducted','rejected'])
                   .default('pending_confirmation'),
  },
).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type WarehouseDeductionRequest = typeof warehouseDeductionRequests.$inferSelect;
export type InsertWarehouseDeductionRequest = z.infer<typeof insertWarehouseDeductionRequestSchema>;
```

**Import kerak**: `boolean` ni importga qo'sh (mavjud import satri 10):

```typescript
// OLDIN (satrl 10):
import {
  serial, pgTable, text, varchar, integer, timestamp,
  numeric, uniqueIndex, index, check,
} from 'drizzle-orm/pg-core';

// KEYIN:
import {
  serial, pgTable, text, varchar, integer, boolean, timestamp,
  numeric, uniqueIndex, index, check,
} from 'drizzle-orm/pg-core';
```

**Edge-case**: `boolean` import allaqachon bor yoki yo'qligini tekshir:
```bash
grep -n "boolean" lib/db/src/schema/mes-schema.ts
```
Yo'q bo'lsa — qo'sh. Bor bo'lsa — qo'shma.

---

### Qadam 2: `equipment` jadvaliga 4 norma ustun — P12 ga DEKLARATSIYA (P17 EDIT QILMAYDI)

**Fayl egasi**: `lib/db/src/schema/pp/pp-production.ts` — **P12** (P17 EMAS).

**Nima qilasan**: HECH NARSA — bu faylga P17 TEGMAYDI. Quyidagi 4 ustun spetsifikatsiyasi
P12 ga **e'lon qilingan deklaratsiya** (MES P17 talab qildi, lekin `pp-production.ts` egasi
P12 qo'llaydi). P17 bu ustunlarni faqat **O'QIYDI/import qiladi** (masalan, kelajakdagi
norma hisoblari uchun). Ustun spetsifikatsiyasi shu yerda ko'rinib turibdi — bu P12 qo'shishi
kerak bo'lgan aniq nomlar/turlar/izohlar; P17 buni `pp-production.ts` ga YOZMAYDI.

> **P12 ga uzatish:** P12 quyidagi 4 ustunni `equipment` jadvali ta'rifiga (taxminan satrl
> 718-761) qo'shadi — `operatingHours` ustunidan KEYIN, `isActive` dan OLDIN. Bu ham DDL-GATED.

**P12 qo'shadigan joy**: `operatingHours` ustunidan KEYIN, `isActive` dan OLDIN:

```typescript
// OLDIN (satrl 738-742 taxminan):
  operatingHours: numericMoney("operating_hours").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

```typescript
// KEYIN — 4 ustun qo'shiladi:
  operatingHours: numericMoney("operating_hours").default(0),
  // ── MES Phase 6 norma cols (EP-MES-034/039/040/082) ──
  // -- APPROVED: <egasi_ismi> <sana>
  normaHourly:      numericMoney("norma_hourly"),
  // Soatlik norma ishlab chiqarish miqdori (mashina turiga qarab, masalan: SM-52=5000 varoq/soat)
  brakPercentNorm:  numericMoney("brak_percent_norm"),
  // Ruxsat etilgan brak foizi (masalan: 0.50 = 0.5%). Oshsa — signal.
  oeeTarget:        numericMoney("oee_target"),
  // OEE maqsadli ko'rsatkich (masalan: 0.85 = 85%). EP-MES-014 barcha darajalarda.
  unitOfMeasure:    varchar("unit_of_measure", { length: 20 }),
  // Mahsulot o'lchov birligi: 'varoq', 'dona', 'metr', 'kg'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

**Zod sxemasi (P12 yangilaydi — P17 EMAS)** (satrl 753-758 taxminan): P12 ushbu Zod
kengaytmasini `pp-production.ts` da qo'llaydi (P17 bu faylga yozmaydi):

```typescript
// OLDIN:
export const insertEquipmentSchema = createInsertSchema(equipment, {
  equipmentNumber: z.string().min(1, "Uskuna raqami kerak"),
  name: z.string().min(2, "Nom kerak"),
  category: z.enum(["machine", "conveyor", "vehicle", "tool", "other"]),
  status: z.enum(["active", "inactive", "maintenance", "scrapped"]),
}).omit({ id: true, createdAt: true } as never);

// KEYIN:
export const insertEquipmentSchema = createInsertSchema(equipment, {
  equipmentNumber: z.string().min(1, "Uskuna raqami kerak"),
  name: z.string().min(2, "Nom kerak"),
  category: z.enum(["machine", "conveyor", "vehicle", "tool", "other"]),
  status: z.enum(["active", "inactive", "maintenance", "scrapped"]),
  normaHourly:     z.number().positive().optional().nullable(),
  brakPercentNorm: z.number().min(0).max(100).optional().nullable(),
  oeeTarget:       z.number().min(0).max(1).optional().nullable(),
  unitOfMeasure:   z.string().max(20).optional().nullable(),
}).omit({ id: true, createdAt: true } as never);
```

**Tekshir (P12 uchun ma'lumot)**: `numericMoney` helper pp-production.ts da qanday
ishlatilganini ko'r:
```bash
grep -n "numericMoney" lib/db/src/schema/pp/pp-production.ts | head -5
```
Agar `numericMoney("norma_hourly")` import bo'lgan bo'lsa — muammo yo'q. Mavjud
(`import { numericMoney } from "../numeric-money"` — satrl 6). Bu P12 qo'llaganda
ishlatadigan helper — P17 bu faylga TEGMAYDI.

---

### Qadam 3: `MesToHr360Event` payload ga real metriklar qo'sh

**Fayl**: `apps/api/src/modules/mes/application/commands/complete-session.handler.ts`

**Muammo**: satrl 74-77 — `MesToHr360Event` faqat `(sessionId, operatorId, timestamp)` oladi. Real `qty`, `defectRate`, `oee` uzatilmaydi.

**Avval**: `MesToHr360Event` domenida qanday ta'riflangani tekshir:
```bash
grep -rn "MesToHr360Event" apps/api/src/modules/mes/domain/events/ --include="*.ts"
```

Agar event konstruktori `(sessionId, operatorId, timestamp)` dan iborat bo'lsa — kengaytirishimiz kerak. Lekin `MesToHr360Event` faylini bu agent TEGMAYDI (owned-files da yo'q). Shu sababli:

**YONDASHUV**: `complete-session.handler.ts` da `MesToHr360Event` ni chaqirishdan OLDIN sessiya metriklarini `production_sessions` jadvalidan o'qiymiz va event ga optional fields sifatida emas, kengaytirilgan payload sifatida uzatamiz.

**OWNED-FILE CHECK**: `MesToHr360Event` faylini tekshir:
```bash
cat apps/api/src/modules/mes/domain/events/mes-to-hr-360.event.ts
```

Agar event klassi `(sessionId: number, operatorId: number, timestamp: Date)` ko'rinishida bo'lsa — bu agent MesToHr360Event faylini o'zgartira olmaydi (owned emas). Shu holda:

**ALTERNATIV YONDASHUV (owned-file doirasida)**:

`complete-session.handler.ts` ning `execute()` metodida, `session.complete()` + `session.moveToQc()` dan SO'NG, `production_sessions` jadvalidan `produced_qty`, `defect_qty`, `oee` ni o'qiymiz va `MesCompletedEvent` ga kengaytirilgan payload sifatida beramiz.

**ANIQ O'ZGARTIRISH — complete-session.handler.ts:**

```typescript
// OLDIN (satrl 1-15 — import bloki):
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, AppErr } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMesRepository, MES_REPO } from '../../domain/repositories/mes.repository';
import { MesCompletedEvent } from '../../domain/events/mes-completed.event';
import { MesToHr360Event } from '../../domain/events/mes-to-hr-360.event';
```

```typescript
// KEYIN — DrizzleService import qo'shamiz:
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, AppErr } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMesRepository, MES_REPO } from '../../domain/repositories/mes.repository';
import { MesCompletedEvent } from '../../domain/events/mes-completed.event';
import { MesToHr360Event } from '../../domain/events/mes-to-hr-360.event';
import { DrizzleService } from '@database/drizzle.service';
import { productionSessions } from '@db/schema/pp/pp-iot';
import { eq } from 'drizzle-orm';
```

**Constructor ga DrizzleService qo'sh** (satrl 22-26):

```typescript
// OLDIN:
  constructor(
    @Inject(MES_REPO) private mesRepo: IMesRepository,
    private eventBus: EventBus
  ) {}

// KEYIN:
  constructor(
    @Inject(MES_REPO) private mesRepo: IMesRepository,
    private eventBus: EventBus,
    private db: DrizzleService,
  ) {}
```

**`execute()` metodida metrik o'qish** (satrl 60 dan keyin, eventBus.publish dan OLDIN):

```typescript
// OLDIN (satrl 60-80):
    if (!outcome.ok) {
      return Err(outcome.error);
    }

    const session = outcome.data;
    if (!session) {
      return Err(AppErr('INTERNAL', 'Session transaction returned no data'));
    }

    // Trigger 10: MES completed → QC (only after commit)
    this.eventBus.publish(new MesCompletedEvent(command.sessionId, _time.now()));

    // Trigger 16: MES → HR 360° (only after commit)
    this.eventBus.publish(
      new MesToHr360Event(command.sessionId, session.getOperatorId(), _time.now()),
    );

    this.logger.log('MES session completed and sent to QC');
    return Ok(undefined);
```

```typescript
// KEYIN — real metriklar o'qiladi:
    if (!outcome.ok) {
      return Err(outcome.error);
    }

    const session = outcome.data;
    if (!session) {
      return Err(AppErr('INTERNAL', 'Session transaction returned no data'));
    }

    // EP-MES-019/020: sessiya metriklarini real DB dan o'qi (GSD karta uchun)
    // Q-40: ishlaydi ≠ to'g'ri — 0 uzatish = noto'g'ri, vizyon E2 ga zid
    let producedQty = 0;
    let defectQty   = 0;
    let oeeValue    = 0;
    try {
      const rows = await this.db.db
        .select({
          producedQty: productionSessions.producedQty,
          defectQty:   productionSessions.defectQty,
          oee:         productionSessions.oee,
        })
        .from(productionSessions)
        .where(eq(productionSessions.id, command.sessionId))
        .limit(1);

      if (rows[0]) {
        producedQty = Number(rows[0].producedQty ?? 0);
        defectQty   = Number(rows[0].defectQty ?? 0);
        oeeValue    = Number(rows[0].oee ?? 0);
      }
      this.logger.log(
        `code=EP-MES-019 sessionId=${command.sessionId} qty=${producedQty} defect=${defectQty} oee=${oeeValue}`,
      );
    } catch (metricErr) {
      // Metrik o'qish xatosi sessionni to'xtatmaydi — 0 bilan davom etadi,
      // lekin log orqali operator bilib oladi
      this.logger.warn(
        `code=EP-MES-019 WARN sessionId=${command.sessionId} metric-read failed: ${String(metricErr)}`,
      );
    }

    const defectRate = producedQty > 0
      ? Number(((defectQty / producedQty) * 100).toFixed(2))
      : 0;

    // Trigger 10: MES completed → QC (only after commit)
    // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy @OnEvent listeners.
    this.eventBus.publish(new MesCompletedEvent(command.sessionId, _time.now()));

    // Trigger 16: MES → HR 360° (only after commit)
    // EP-MES-020: real metriklar bilan — operator GSD kartasiga yoziladi
    this.eventBus.publish(
      new MesToHr360Event(
        command.sessionId,
        session.getOperatorId(),
        _time.now(),
        producedQty,   // real ishlab chiqarilgan miqdor
        defectRate,    // brak foizi (%)
        oeeValue,      // OEE ko'rsatkichi
      ),
    );

    this.logger.log(
      `code=EP-MES-028 sessionId=${command.sessionId} status=COMPLETED_AND_SENT_TO_QC`,
    );
    return Ok(undefined);
```

**MUHIM CHECK**: `MesToHr360Event` konstruktori qo'shimcha parametrlarni qabul qila oladimi?

```bash
cat apps/api/src/modules/mes/domain/events/mes-to-hr-360.event.ts
```

- Agar konstruktor `(sessionId, operatorId, timestamp)` — 3 parametr: kengaytiring (lekin bu owned emas!).
- **Agar bu fayl owned emas bo'lsa**: `MesToHr360Event` konstruktorini o'zgartira olmaysan. Shu holda:
  - `MesCompletedEvent` ga metriklarni qo'sh (u ham owned fayl emas, lekin muammo boshqacha).
  - **TO'G'RI YO'L**: egasiga flag qil: "P17 uchun `MesToHr360Event` konstruktoriga `producedQty: number`, `defectRate: number`, `oee: number` parametrlar kerak. Bu faylni qaysi agent owns qiladi?"
  - Agar `mes-to-hr-360.event.ts` hech qaysi paketda owned emas bo'lsa — bu P17 agentining ishi.

**AGENT KAROR DARAXTI**:

```
MesToHr360Event owned by this agent? 
  → grep "mes-to-hr-360.event.ts" MASSIV-50/ — qaysi P-da bor?
  → Yo'q bo'lsa: P17 agenti bu faylni ham edit qilishi mumkin (qo'shimcha flag bilan)
  → Bor bo'lsa: TO'XTA, owned agent bilan koordinatsiya
```

Agar event faylini edit qilish kerak bo'lsa — quyidagi o'zgarish:

```typescript
// mes-to-hr-360.event.ts — AGAR EDIT RUXSAT BO'LSA
export class MesToHr360Event {
  constructor(
    public readonly sessionId:  number,
    public readonly operatorId: number,
    public readonly timestamp:  Date,
    // EP-MES-020 kengaytma: GSD karta uchun real metriklar
    public readonly producedQty:  number = 0,
    public readonly defectRate:   number = 0,
    public readonly oee:          number = 0,
  ) {}
}
```

Default `= 0` qiymati tufayli mavjud kod (MesToHr360Event ni chaqiruvchi boshqa joylar) SINMAYDI — Q-39 regress himoyasi.

---

### Qadam 4: `MesCompletedDeductionListener` yarat (yangi fayl)

**Fayl**: `apps/api/src/modules/wms/infrastructure/event-handlers/mes-completed-deduction.listener.ts`

Bu fayl MAVJUD EMAS — yangi yaratiladi.

**Biznes logika (EP-MES-006)**:
1. `MesCompletedEvent` otilganda ishga tushadi.
2. `production_sessions` dan `material_kit_id` yoki `production_order_id` olinadi.
3. Agar BOM/norma ma'lumoti bo'lsa — kerakli materiallar hisoblanadi.
4. Har material uchun `warehouse_deduction_requests` ga `pending_confirmation` statusida row qo'shiladi.
5. `warehouse_stock` hali KAMAYTIRILMAYDI — faqat so'rov yaratiladi.
6. Operator IoT tablet orqali tasdiqlaydi (keyingi qadam, bu paketda emas).

```typescript
/**
 * @module mes-completed-deduction.listener
 * @description WMS tomonidagi MesCompletedEvent tinglovchi.
 * EP-MES-006: sessiya tugaganda material ayirish SO'ROVINI yaratadi.
 * warehouse_stock darhol KAMAYTIRILMAYDI — operator/usta tasdiqidan keyin.
 * Op-code: EP-MES-006
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Ok, Err } from '@common/result';
import { Result } from '@common/result';
import { DrizzleService } from '@database/drizzle.service';
import { eq, and } from 'drizzle-orm';
import { productionSessions } from '@db/schema/pp/pp-iot';
import { productionOrderComponents } from '@db/schema/pp/pp-production';
import { warehouseDeductionRequests } from '@db/schema/mes-schema';
import { MesCompletedEvent } from '../../../mes/domain/events/mes-completed.event';

@Injectable()
export class MesCompletedDeductionListener {
  private readonly logger = new Logger(MesCompletedDeductionListener.name);

  constructor(private readonly db: DrizzleService) {}

  /**
   * MesCompletedEvent → warehouse_deduction_requests YARATISH
   *
   * EP-MES-006: operator TASDIQ talab qilinadi.
   * Bu metod faqat so'rov (request) yaratadi — haqiqiy ayirish KEYINROQ.
   *
   * @throws HECH QACHON — xatolar Result<T> orqali log qilinadi.
   */
  @OnEvent('mes.session.completed', { async: true })
  async handleMesCompleted(event: MesCompletedEvent): Promise<void> {
    this.logger.log(
      `code=EP-MES-006 event=mes.session.completed sessionId=${event.sessionId} — deduction request processing`,
    );

    const result = await this.createDeductionRequests(event.sessionId);

    if (!result.ok) {
      // Xato event zanjirini to'xtatmaydi — faqat log
      this.logger.error(
        `code=EP-MES-006 ERR sessionId=${event.sessionId} error=${result.error.code}: ${result.error.message}`,
      );
      return;
    }

    this.logger.log(
      `code=EP-MES-006 OK sessionId=${event.sessionId} deductionRequestsCreated=${result.data}`,
    );
  }

  /**
   * Sessiya uchun material ayirish so'rovlarini yaratadi.
   * 1. production_sessions → production_order_id olinadi
   * 2. production_order_components → material ro'yxati olinadi
   * 3. Har material uchun warehouse_deduction_requests qo'shiladi
   *
   * Result<number> — yaratilgan requestlar soni
   */
  private async createDeductionRequests(sessionId: number): Promise<Result<number>> {
    // 1. Sessiyadan production_order_id ni o'qi
    const sessionRows = await this.db.db
      .select({
        productionOrderId: productionSessions.productionOrderId,
        producedQty:       productionSessions.producedQty,
      })
      .from(productionSessions)
      .where(eq(productionSessions.id, sessionId))
      .limit(1);

    if (!sessionRows[0]) {
      return Err({
        code: 'NOT_FOUND',
        message: `production_sessions id=${sessionId} topilmadi`,
        status: 404,
      } as any);
    }

    const { productionOrderId, producedQty } = sessionRows[0];

    if (!productionOrderId) {
      // Sessiyada buyurtma bog'lanmagan — deduction mumkin emas, bu normal holat
      this.logger.warn(
        `code=EP-MES-006 SKIP sessionId=${sessionId} reason=no_production_order_id`,
      );
      return Ok(0);
    }

    // 2. production_order_components → material ro'yxati
    const components = await this.db.db
      .select({
        rawMaterialId:    productionOrderComponents.rawMaterialId,
        requiredQuantity: productionOrderComponents.requiredQuantity,
        unit:             productionOrderComponents.unit,
        warehouseId:      productionOrderComponents.warehouseId,
      })
      .from(productionOrderComponents)
      .where(
        eq(productionOrderComponents.productionOrderId, String(productionOrderId)),
      );

    if (components.length === 0) {
      this.logger.warn(
        `code=EP-MES-006 SKIP sessionId=${sessionId} productionOrderId=${productionOrderId} reason=no_components`,
      );
      return Ok(0);
    }

    // 3. Har komponent uchun deduction_request yaratamiz
    // EP-MES-006: norma bo'yicha hisob — hozircha requiredQuantity ishlatiladi
    // Kelajakda: producedQty/plannedQty koeffitsiyenti bilan normalashtirish
    const requestsToInsert = components.map((comp) => ({
      sessionId,
      materialId:   comp.rawMaterialId,
      warehouseId:  comp.warehouseId ? Number(comp.warehouseId) : null,
      requestedQty: String(comp.requiredQuantity ?? '0'),
      unit:         comp.unit ?? 'dona',
      status:       'pending_confirmation' as const,
    }));

    // Idempotent: agar bu sessiya uchun request allaqachon bor bo'lsa, qo'shma
    // (MesCompletedEvent bir necha marta kelishi mumkin — event bus at-least-once)
    const existingRequests = await this.db.db
      .select({ id: warehouseDeductionRequests.id })
      .from(warehouseDeductionRequests)
      .where(eq(warehouseDeductionRequests.sessionId, sessionId))
      .limit(1);

    if (existingRequests.length > 0) {
      this.logger.warn(
        `code=EP-MES-006 IDEMPOTENT sessionId=${sessionId} — requests already exist, skipping`,
      );
      return Ok(0);
    }

    await this.db.db
      .insert(warehouseDeductionRequests)
      .values(requestsToInsert);

    this.logger.log(
      `code=EP-MES-006 INSERT sessionId=${sessionId} materialsCount=${requestsToInsert.length}`,
    );

    return Ok(requestsToInsert.length);
  }
}
```

**MUHIM**: `productionSessions.productionOrderId` ustuni bor yoki yo'qligini tekshir:
```bash
grep -n "productionOrderId\|production_order_id" lib/db/src/schema/pp/pp-iot.ts | head -10
```

Agar ustun yo'q bo'lsa — `productionSessions.orderId` yoki boshqa ustun ishlatiladi. TO'XTA + egasiga flag qil.

**MUHIM**: `warehouseDeductionRequests` — yangi jadval (DDL-GATED). Bu faylni import qilish tsc da xato bermaydi lekin runtime da jadval yo'q bo'ladi. Shu sababli:

- Migration faylini YOZING (Qadam 6)
- Egasi migratsiyani tasdiqlagunicha: WMS listener `try/catch` ichida ishlaydi va xato bo'lsa faqat log qiladi (sessiya to'xtamaydi)

---

### Qadam 5: `wms.module.ts` ga listener qo'sh

**Fayl**: `apps/api/src/modules/wms/wms.module.ts`

**Nima qilasan**:
1. Import qo'sh
2. `listeners` array ga qo'sh

**OLDIN (satrl 81, QcPassedListener import)**:
```typescript
import { QcPassedListener } from './infrastructure/event-handlers/qc-passed.listener';
```

**KEYIN — keyin import qo'sh (satrl 82 ga)**:
```typescript
import { QcPassedListener } from './infrastructure/event-handlers/qc-passed.listener';
import { MesCompletedDeductionListener } from './infrastructure/event-handlers/mes-completed-deduction.listener';
```

**OLDIN (satrl 105)**:
```typescript
const listeners = [QcPassedListener, RopTriggerHandler];
```

**KEYIN**:
```typescript
const listeners = [QcPassedListener, RopTriggerHandler, MesCompletedDeductionListener];
```

**Providers da DrizzleService/DrizzleModule mavjudligini tekshir**:
```bash
grep -n "DrizzleService\|DrizzleModule\|DatabaseModule" apps/api/src/modules/wms/wms.module.ts
```
Agar yo'q bo'lsa — `DrizzleService` providers orqali yoki `DatabaseModule` import orqali kiritilganini tekshir. Ko'pincha global module orqali kiritilgan bo'ladi.

---

### Qadam 6: DDL migration fayli yoz (GATED — ISHGA TUSHIRMA)

**Fayl**: `apps/api/src/database/migrations/d6-mes-safety-checklist.sql`

```sql
-- ============================================================
-- MIGRATION: d6-mes-safety-checklist.sql
-- Maqsad: MES TB xavfsizlik checklisti + WMS deduction requests
-- ESLATMA: equipment 4 norma ustun BU YERDA EMAS — ularni P12
--          (pp-production.ts egasi) o'z GATED migratsiyasida qo'llaydi.
-- Egasi tasdiq: -- APPROVED: <egasi_ismi> <sana>
-- GATED: egasi "ha" demaguncha bu migrationni ISHGA TUSHIRMA
-- ============================================================

-- 1. mes_safety_checklist_items
-- TB (Texnika Xavfsizligi) cheklisti master data
-- EP-MES-004, COR-130, HR-079
CREATE TABLE IF NOT EXISTS mes_safety_checklist_items (
  id            SERIAL PRIMARY KEY,
  machine_type  VARCHAR(100),
  -- NULL = barcha mashinalarga tegishli umumiy band
  item_text     TEXT NOT NULL,
  item_text_ru  TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mes_safety_items_machine_type_idx
  ON mes_safety_checklist_items (machine_type);
CREATE INDEX IF NOT EXISTS mes_safety_items_active_idx
  ON mes_safety_checklist_items (is_active);
CREATE INDEX IF NOT EXISTS mes_safety_items_sort_idx
  ON mes_safety_checklist_items (sort_order);

-- 2. mes_session_checklist_confirmations
-- Sessiya xavfsizlik cheklisti bajarish audit trail
-- EP-MES-004
CREATE TABLE IF NOT EXISTS mes_session_checklist_confirmations (
  id                   SERIAL PRIMARY KEY,
  session_id           INT NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
  checklist_item_id    INT NOT NULL REFERENCES mes_safety_checklist_items(id) ON DELETE RESTRICT,
  confirmed_by         INT,
  -- FK → employees(id) — app-level, qat'iy FK keyinroq
  confirmed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mes_session_chk_conf_session_idx
  ON mes_session_checklist_confirmations (session_id);
CREATE INDEX IF NOT EXISTS mes_session_chk_conf_item_idx
  ON mes_session_checklist_confirmations (checklist_item_id);

-- 3. warehouse_deduction_requests
-- EP-MES-006: operator tasdiqini kutuvchi material ayirish so'rovlari
-- warehouse_stock darhol KAMAYTIRILMAYDI — faqat so'rov
CREATE TABLE IF NOT EXISTS warehouse_deduction_requests (
  id                SERIAL PRIMARY KEY,
  session_id        INT NOT NULL,
  -- FK production_sessions(id) — production_sessions mavjud bo'lgandan keyin qo'shiladi
  material_id       INT NOT NULL,
  -- FK material_cards(id)
  warehouse_id      INT,
  -- FK warehouses(id) — NULL bo'lishi mumkin (omborxona aniqlanmagan holat)
  requested_qty     NUMERIC(15, 4) NOT NULL,
  actual_qty        NUMERIC(15, 4),
  unit              VARCHAR(20) NOT NULL DEFAULT 'dona',
  status            VARCHAR(30) NOT NULL DEFAULT 'pending_confirmation',
  confirmed_by      INT,
  confirmed_at      TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wdr_status_chk CHECK (
    status IN ('pending_confirmation','confirmed','deducted','rejected')
  ),
  CONSTRAINT wdr_qty_positive CHECK (requested_qty > 0)
);

CREATE INDEX IF NOT EXISTS wdr_session_idx    ON warehouse_deduction_requests (session_id);
CREATE INDEX IF NOT EXISTS wdr_material_idx   ON warehouse_deduction_requests (material_id);
CREATE INDEX IF NOT EXISTS wdr_status_idx     ON warehouse_deduction_requests (status);
CREATE INDEX IF NOT EXISTS wdr_created_at_idx ON warehouse_deduction_requests (created_at);

-- 4. ADD COLUMN: equipment norma ustunlari — BU MIGRATSIYADA YO'Q.
-- EP-MES-034/039/040/082: bu 4 ustun (`norma_hourly`, `brak_percent_norm`,
-- `oee_target`, `unit_of_measure`) `equipment` jadvaliga **P12 tomonidan** qo'shiladi
-- (P12 = `lib/db/src/schema/pp/pp-production.ts` egasi; ALTER P12 ning GATED migratsiyasida
-- `pp-phase1-schema.sql`). P17 (MES) bu ustunlarni e'lon qildi, lekin EGASI P12 qo'llaydi.
-- P17 bu yerda equipment ALTER YOZMAYDI — fayl izolyatsiyasi (Q-23/Q-31).
-- Verify: ustunlar P12 migratsiyasidan keyin mavjud bo'ladi (qarang §6 V4 tekshiruvi).

-- 5. SEED: mes_safety_checklist_items — asosiy TB bandlari
-- Karton/gofra sex uchun standart xavfsizlik cheklisti (EP-MES-004)
INSERT INTO mes_safety_checklist_items (machine_type, item_text, item_text_ru, sort_order)
VALUES
  ('SM-52',   'Mashina qopqog''ini yoping va qulflab qo''ying',
               'Закройте и заблокируйте крышку машины', 10),
  ('SM-52',   'Bosma silindrlar tozaligini tekshiring',
               'Проверьте чистоту печатных цилиндров', 20),
  ('SM-52',   'Boyoq darajasini tekshiring (kamida 20%)',
               'Проверьте уровень краски (не менее 20%)', 30),
  ('SM-72',   'Mashina qopqog''ini yoping va qulflab qo''ying',
               'Закройте и заблокируйте крышку машины', 10),
  ('SM-72',   'Bosma silindrlar tozaligini tekshiring',
               'Проверьте чистоту печатных цилиндров', 20),
  ('SM-72',   'Qog''oz yo''lagini tekshiring (uzilish yo''q)',
               'Проверьте подачу бумаги (нет разрывов)', 30),
  ('SM-72',   'Boyoq darajasini tekshiring (kamida 20%)',
               'Проверьте уровень краски (не менее 20%)', 40),
  ('KBA-105', 'Mashina qopqog''ini yoping va qulflab qo''ying',
               'Закройте и заблокируйте крышку машины', 10),
  ('KBA-105', 'Bosma silindrlar tozaligini tekshiring',
               'Проверьте чистоту печатных цилиндров', 20),
  ('KBA-105', 'Qog''oz yo''lagini tekshiring (uzilish yo''q)',
               'Проверьте подачу бумаги (нет разрывов)', 30),
  ('KBA-105', 'Boyoq darajasini tekshiring (kamida 20%)',
               'Проверьте уровень краски (не менее 20%)', 40),
  ('KBA-105', 'Suvlash tizimini tekshiring',
               'Проверьте систему увлажнения', 50),
  (NULL,      'Individual himoya vositalarini kiyib oling (ko''zoynak, quloq himoyasi)',
               'Наденьте СИЗ (очки, защита слуха)', 5),
  (NULL,      'Ish joyi tozaligini ta''minlang (axlat yo''q, sirpanish xavfi yo''q)',
               'Обеспечьте чистоту рабочего места', 7),
  (NULL,      'Elektr ulanishlarni vizual tekshiring (yalang''och sim ko''rinmaydi)',
               'Визуально проверьте электрические подключения', 8),
  (NULL,      'Avval navbatdagi operatordan topshiriqni qabul qilib olganingizni tasdiqlang',
               'Подтвердите принятие задания от предыдущего оператора', 9)
ON CONFLICT DO NOTHING;
```

---

### Qadam 7: Barcha o'zgarishlarni tekshir

**7a. TypeScript compile tekshiruvi:**
```bash
# Backend tsc
pnpm --filter @europrint/api exec tsc --noEmit --skipLibCheck 2>&1 | tail -20

# Schema library tsc
pnpm --filter @europrint/db exec tsc --noEmit --skipLibCheck 2>&1 | tail -20
```

**7b. Import tekshiruvi:**
```bash
# warehouseDeductionRequests export qilinganmi?
grep -n "warehouseDeductionRequests" lib/db/src/schema/mes-schema.ts

# MesCompletedDeductionListener wms.module da bormi?
grep -n "MesCompletedDeductionListener" apps/api/src/modules/wms/wms.module.ts

# complete-session.handler.ts import tekshiruvi
grep -n "DrizzleService\|productionSessions\|eq" apps/api/src/modules/mes/application/commands/complete-session.handler.ts
```

**7c. Owned fayllar FAQAT o'zgarganini tekshir:**
```bash
git diff --name-only
# Natijada FAQAT bu 4 fayl ko'rinishi kerak (+ migration fayl):
# apps/api/src/modules/wms/infrastructure/event-handlers/mes-completed-deduction.listener.ts (yangi)
# apps/api/src/modules/wms/wms.module.ts
# apps/api/src/modules/mes/application/commands/complete-session.handler.ts
# lib/db/src/schema/mes-schema.ts
# apps/api/src/database/migrations/d6-mes-safety-checklist.sql (yangi, GATED)
# ⚠️ pp-production.ts BU YERDA KO'RINMASLIGI KERAK — u P12 ning fayli (P17 tegmaydi)
```

**7d. NestJS boot tekshiruvi (DDL migration ISHGA TUSHIRILMAGAN holda):**
```bash
pnpm --filter @europrint/api run dev:unsafe &
sleep 10
curl -s http://localhost:3030/api/auth/health | jq .
# Natija: {"status":"ok"} yoki {"status":"unhealthy"} bo'lmasligi kerak
# MUHIM: server boot bo'lishi kerak — DI xatosi bo'lmasligi shart
```

Agar server boot qilmasa — `MesCompletedDeductionListener` DI xatosi bo'lishi mumkin. Tekshir:
```bash
# DrizzleService wms.module.ts da mavjudmi?
grep -rn "DrizzleService\|DrizzleModule" apps/api/src/modules/wms/wms.module.ts
# Agar yo'q bo'lsa — global module orqali kiritilgan bo'lishi kerak
grep -n "isGlobal" apps/api/src/database/database.module.ts 2>/dev/null || \
  grep -rn "DatabaseModule\|DrizzleModule" apps/api/src/app.module.ts | head -5
```

---

## 5. DDL (GATED)

### DDL talab qiladigan o'zgarishlar ro'yxati:

| # | Jadval | Amal | EP kodi | Status |
|---|--------|------|---------|--------|
| D1 | `mes_safety_checklist_items` | CREATE TABLE | EP-MES-004/COR-130 | GATED (P17) |
| D2 | `mes_session_checklist_confirmations` | CREATE TABLE | EP-MES-004 | GATED (P17) |
| D3 | `warehouse_deduction_requests` | CREATE TABLE | EP-MES-006 | GATED (P17) |
| D4 | `equipment` | ADD COLUMN ×4 | EP-MES-034/039/040 | GATED — **P12 qo'llaydi** (P17 e'lon qildi; pp-production.ts egasi P12) |
| S1 | `mes_safety_checklist_items` | SEED 16 qator | EP-MES-004 | GATED (P17) |

### Egasiga ko'rsatish kerak bo'lgan savollar:

```
❓ EGASIGA SAVOL (Q-35 ruxsat so'rovi):

P17 agenti quyidagi DDL larni tayyorladi — ISHGA TUSHIRISH UCHUN RUXSAT KERAK:

1. CREATE TABLE mes_safety_checklist_items
   — TB xavfsizlik cheklisti master data
   — EP-MES-004, COR-130, HR-079
   — 16 ta mashina/umumiy band seedi bor

2. CREATE TABLE mes_session_checklist_confirmations
   — Sessiya bo'yicha checklist audit trail
   — production_sessions(id) ga FK

3. CREATE TABLE warehouse_deduction_requests
   — EP-MES-006: operator tasdiqi kutuvchi material so'rovlari
   — warehouse_stock hali KAMAYTIRILMAYDI

ESLATMA: equipment 4 norma ustun (norma_hourly/brak_percent_norm/oee_target/unit_of_measure)
   — EP-MES-034/039/040/082 — bu P17 ning d6 migratsiyasida EMAS.
   — Ularni P12 (pp-production.ts egasi) o'z GATED migratsiyasida (pp-phase1-schema.sql) qo'llaydi.
   — P17 bu ustunlarni e'lon qildi; egasi P12 ning migratsiyasida tasdiqlaydi.

Migration fayli: apps/api/src/database/migrations/d6-mes-safety-checklist.sql
Ishga tushirish: psql $DATABASE_URL -f apps/api/src/database/migrations/d6-mes-safety-checklist.sql

Ha desangiz — migration ishga tushiriladi va -- APPROVED: <ismingiz> <sana> qo'shiladi.
```

### Migration ishga tushirish tartibi (egasi ruxsatidan KEYIN):

```bash
# 1. Oldin backup
pg_dump $DATABASE_URL --schema-only -f /tmp/pre-d6-backup.sql

# 2. Migration qo'llash
psql $DATABASE_URL -f apps/api/src/database/migrations/d6-mes-safety-checklist.sql

# 3. Tekshirish
psql $DATABASE_URL -c "\d mes_safety_checklist_items"
psql $DATABASE_URL -c "\d warehouse_deduction_requests"
psql $DATABASE_URL -c "SELECT count(*) FROM mes_safety_checklist_items"
# Natija: count=16 (seed qatorlar)
# equipment 4 norma ustun — P12 migratsiyasidan keyin tekshiriladi (P17 d6 da emas):
# psql $DATABASE_URL -c "\d+ equipment" | grep -E "norma_hourly|brak_percent_norm|oee_target|unit_of_measure"

# 4. Faylga APPROVED belgisi qo'sh
sed -i "s/-- APPROVED: <egasi_ismi> <sana>/-- APPROVED: <egasi_ismi> $(date +%Y-%m-%d)/" \
  apps/api/src/database/migrations/d6-mes-safety-checklist.sql
```

---

## 6. QABUL MEZONI

Barcha checklar PASS bo'lganda buyurtma yopiladi:

### 6.1 Kod sifati:

- [ ] `BE tsc 0`: `pnpm --filter @europrint/api exec tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS"` → 0
- [ ] `Schema tsc 0`: `pnpm --filter @europrint/db exec tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS"` → 0
- [ ] Result\<T\> pattern: `mes-completed-deduction.listener.ts` da barcha repo metodlar `Result<T>` qaytaradi
- [ ] Zod validation: listener da kelgan event payload tekshiriladi (sessionId number va musbat)
- [ ] Drizzle ORM: raw sql ishlatilmagan (faqat `.select().from().where()` pattern)
- [ ] Magic number yo'q: barcha konstantalar (`'pending_confirmation'`, `0`) inline string emas, `as const` yoki `business.constants.ts` dan

### 6.2 Funksional:

- [ ] `MesCompletedDeductionListener` wms.module.ts providers da registratsiya qilingan
- [ ] `complete-session.handler.ts` — `production_sessions` dan real qty/defectQty/oee o'qiladi
- [ ] `MesToHr360Event` ga `producedQty`, `defectRate`, `oeeValue` uzatiladi (0 emas)
- [ ] `equipment` jadvalida 4 yangi Drizzle ustun ta'rifi bor (pp-production.ts — **P12 qo'shadi**, P17 import qiladi/tasdiqlaydi; P17 bu faylga yozmaydi)
- [ ] `mes-schema.ts` da 3 yangi jadval ta'rifi bor (Drizzle level)
- [ ] Migration fayli mavjud, `-- APPROVED: <egasi_ismi> <sana>` placeholder bor

### 6.3 DB proof (migration ishga tushirilgandan KEYIN):

```sql
-- V1: mes_safety_checklist_items yaratilganmi?
SELECT count(*) FROM mes_safety_checklist_items;
-- Kutilgan: 16

-- V2: warehouse_deduction_requests yaratilganmi?
SELECT count(*) FROM warehouse_deduction_requests;
-- Kutilgan: 0 (bo'sh, hali sessiya yopilmagan)

-- V3: equipment ustunlari qo'shilganmi?
-- V4 (P12 qo'llaganini tasdiqlash — P17 yaratmagan, faqat O'QIYDI):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'equipment'
  AND column_name IN ('norma_hourly','brak_percent_norm','oee_target','unit_of_measure');
-- Kutilgan: 4 qator (P12 ning pp-phase1-schema.sql migratsiyasidan keyin)

-- V4: MesCompletedEvent otilganda deduction_request yaratilishi (E2E test):
-- 1. Biror sessiyani yakunla: POST /api/mes/sessions/:id/complete
-- 2. Yangi deduction_request borligini tekshir:
SELECT * FROM warehouse_deduction_requests WHERE session_id = :id;
-- Kutilgan: sessiyada production_order_id bo'lsa — 1+ qator, status='pending_confirmation'
```

### 6.4 Regressiya tekshiruvi (Q-39):

- [ ] `QcPassedListener` hali ishlayapti: `grep -n "QcPassedListener" apps/api/src/modules/wms/wms.module.ts` — mavjud
- [ ] `RopTriggerHandler` hali ishlayapti: listeners arrayda mavjud
- [ ] `MesCompletedEvent` → QC listener hali ishlayapti: `apps/api/src/modules/qc/infrastructure/event-handlers/mes-completed.listener.ts` — O'ZGARTIRILMAGAN
- [ ] `MesToHr360Event` → HR listener hali ishlayapti: `apps/api/src/modules/hr/infrastructure/event-handlers/mes-completed.listener.ts` — O'ZGARTIRILMAGAN
- [ ] `wms.module.ts` da mavjud controllers hali ro'yxatda — o'chirilmagan

### 6.5 Oltin zanjir tekshiruvi (SD→PP→MES→QC→WMS→FIN):

```bash
# Golden thread: MES → WMS segment
curl -s -X POST http://localhost:3030/api/mes/sessions/1/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# WMS deduction request yaratilganmi?
psql $DATABASE_URL -c \
  "SELECT id, session_id, material_id, requested_qty, status FROM warehouse_deduction_requests WHERE session_id=1"

# HR 360 event qayta ishlangan holat (real metrik):
psql $DATABASE_URL -c \
  "SELECT qty, defect_rate, oee FROM hr_360_feedbacks WHERE session_id=1 ORDER BY created_at DESC LIMIT 1"
```

---

## 7. SELF-VERIFY

Buyurtmani yopishdan OLDIN quyidagi barcha buyruqlarni o'zing bajaring va natijalarini tekshiring:

### 7.1 Fayl tekshiruvi:

```bash
# Yangi fayl yaratilganmi?
ls -la apps/api/src/modules/wms/infrastructure/event-handlers/mes-completed-deduction.listener.ts
# Natija: fayl mavjud

# Migration fayl mavjudmi?
ls -la apps/api/src/database/migrations/d6-mes-safety-checklist.sql
# Natija: fayl mavjud

# Faqat owned fayllar o'zgarganmi?
git diff --name-only
# Natijada FAQAT bu fayllar ko'rinishi kerak (5 ta — pp-production.ts P12 da, bu yerda EMAS)
```

### 7.2 TypeScript tekshiruvi:

```bash
# Backend
pnpm --filter @europrint/api exec tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS|Found [0-9]+ error"
# Natija: "Found 0 errors." yoki xato yo'q

# Schema lib
pnpm --filter @europrint/db exec tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS|Found [0-9]+ error"
# Natija: "Found 0 errors."
```

### 7.3 Reviewer skriptlar:

```bash
# Result<T> pattern
bash scripts/reviewer-result-pattern.sh 2>&1 | tail -5
# Natija: FAIL: 0

# as unknown stub
bash scripts/reviewer-as-unknown.sh 2>&1 | tail -5
# Natija: FAIL: 0 (yoki oldingi holat o'zgarmagan)

# JWT guard
bash scripts/reviewer-jwt-guard.sh 2>&1 | tail -5
# Natija: PASS
```

### 7.4 Boot tekshiruvi:

```bash
# Backend ishga tushirish (agar hali ishlamayotgan bo'lsa)
pnpm --filter @europrint/api run dev:unsafe > /tmp/api-boot.log 2>&1 &
sleep 12

# DI xatosi yo'qmi?
grep -i "error\|exception\|Cannot resolve\|Circular" /tmp/api-boot.log | head -10
# Natija: yo'q (bo'sh natija)

# Health check
curl -s http://localhost:3030/api/auth/health
# Natija: {"status":"ok"} yoki shunga o'xshash
```

### 7.5 Import tekshiruvi:

```bash
# mes-completed-deduction.listener.ts to'g'ri import qiladimi?
grep -n "import" apps/api/src/modules/wms/infrastructure/event-handlers/mes-completed-deduction.listener.ts

# wms.module.ts da MesCompletedDeductionListener bormi?
grep -n "MesCompletedDeductionListener" apps/api/src/modules/wms/wms.module.ts
# Natija: 2 qator (import + listeners array)

# complete-session.handler.ts da metrik o'qish bormi?
grep -n "producedQty\|defectRate\|oeeValue\|EP-MES-019" \
  apps/api/src/modules/mes/application/commands/complete-session.handler.ts
# Natija: 4+ qator
```

### 7.6 Edge-case tekshiruvi:

```bash
# MesToHr360Event konstruktori qancha parametr qabul qiladi?
grep -n "constructor" apps/api/src/modules/mes/domain/events/mes-to-hr-360.event.ts

# Agar faqat 3 parametr (kengaytirilmagan) bo'lsa:
# complete-session.handler.ts da yangi parametrlar tsc xato bermaydi?
pnpm --filter @europrint/api exec tsc --noEmit --skipLibCheck 2>&1 | grep "mes-to-hr-360\|MesToHr360"
# Natija: xato yo'q (default parametrlar bilan)
```

---

## 8. COMMIT

### Commit tartibi va aniq fayllar:

**Commit 1: Schema additions (DDL types + Drizzle schema)**
```bash
# ESLATMA: pp-production.ts P17 da commit QILINMAYDI — u P12 ning fayli.
# equipment 4 norma ustunni P12 o'z faylida (pp-production.ts) qo'shadi va commit qiladi.
git add lib/db/src/schema/mes-schema.ts
git commit -m "feat(mes/wms): add checklist + deduction DDL types (Drizzle, GATED)

- mes-schema.ts: warehouseDeductionRequests, mesSafetyChecklistItems,
  mesSessionChecklistConfirmations Drizzle tables (DDL GATED)
- equipment norma cols (norma_hourly/brak_percent_norm/oee_target/unit_of_measure)
  P17 da EMAS — P12 (pp-production.ts egasi) qo'shadi/commit qiladi (EP-MES-034/039/040/082 deklaratsiyasi)
- EP-MES-004/006

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

**Commit 2: complete-session.handler.ts — real metrik fix**
```bash
git add apps/api/src/modules/mes/application/commands/complete-session.handler.ts
git commit -m "fix(mes): complete-session passes real qty/defectRate/oee to MesToHr360Event

Before: MesToHr360Event received qty=0, defectRate=0, oee=0 (defaults)
After: reads production_sessions.produced_qty/defect_qty/oee before publish
- EP-MES-019/020: GSD karta operator kartasiga real ko'rsatkichlar yoziladi
- EP-MES-028 op-code log qo'shildi
- Edge: metric read fail → 0 bilan davom etadi (session block bo'lmaydi)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

**Commit 3: WMS deduction listener**
```bash
git add apps/api/src/modules/wms/infrastructure/event-handlers/mes-completed-deduction.listener.ts
git add apps/api/src/modules/wms/wms.module.ts
git commit -m "feat(wms): MesCompletedDeductionListener — EP-MES-006 deferred confirm

- New: mes-completed-deduction.listener.ts — @OnEvent('mes.session.completed')
  creates warehouse_deduction_requests with status=pending_confirmation
- warehouse_stock NOT decremented yet — operator IoT confirm required (E1)
- Idempotent: skips if requests already exist for session (at-least-once safety)
- wms.module.ts: registered in listeners array
- Op-code EP-MES-006

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

**Commit 4: Migration (GATED)**
```bash
git add apps/api/src/database/migrations/d6-mes-safety-checklist.sql
git commit -m "chore(migration): d6 MES checklist + WMS deduction DDL (GATED — awaiting owner approval)

Tables: mes_safety_checklist_items, mes_session_checklist_confirmations,
warehouse_deduction_requests
Seed: 16 TB safety checklist items (SM-52/SM-72/KBA-105 + universal)
NOTE: equipment norma cols ALTER bu migratsiyada EMAS — P12 (pp-phase1-schema.sql) qo'llaydi
DO NOT RUN until owner approves: -- APPROVED: placeholder in file

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### TAQIQLANGAN amallar:
```bash
# HECH QACHON qilma:
git add -A           # ❌ barcha fayllar — boshqa agentlar ishi o'chiriladi
git add .            # ❌ bir xil sabab
git add --all        # ❌ bir xil sabab

# FAQAT shularni qil:
git add <aniq_fayl>  # ✅
```

---

## 9. KUTILMAGAN HOLATLAR VA QAROR DARAXTI

### Holat 1: `productionSessions.productionOrderId` ustuni yo'q

```
Muammo: pp-iot.ts da production_sessions jadvalida productionOrderId ustuni ko'rinmaydi.

Qaror:
1. grep -n "productionOrderId\|production_order_id\|orderId\|order_id" lib/db/src/schema/pp/pp-iot.ts
2. Agar orderId bo'lsa — shuni ishlatiladi
3. Agar umuman yo'q bo'lsa — TO'XTA + egasiga flag qil:
   "P17: production_sessions da production_order_id ustuni yo'q.
   WMS deduction listener ishlay olmaydi. Qaysi ustun orqali production_order_id olinadi?"
```

### Holat 2: `MesToHr360Event` konstruktori qo'shimcha parametr qabul qilmaydi (owned emas)

```
Muammo: MesToHr360Event da producedQty/defectRate/oee paramse yo'q, tsc xato beradi.

Qaror:
1. Qaysi paket owns qiladi: grep -r "mes-to-hr-360.event.ts" docs/audit/MASSIV-50/
2. Hech qaysi paket own qilmasa — P17 agenti o'zgartiради (flag bilan):
   "P17: MesToHr360Event ga 3 optional parametr qo'shildi (default 0).
   Mavjud chaqiruvlar sinmaydi (default=0)."
3. Boshqa paket own qilsa — TO'XTA + koordinatsiya:
   "P17 dan P?? ga: MesToHr360Event konstruktoriga producedQty/defectRate/oee
   optional parametrlar kerak. Bu faylni kengaytira olasizmi?"
```

### Holat 3: `DrizzleService` wms.module.ts ga inject qilinmagan

```
Muammo: MesCompletedDeductionListener constructor da DrizzleService inject qilinmoqchi
lekin WmsModule da DatabaseModule import qilinmagan, server boot qilmaydi.

Qaror:
1. grep -rn "isGlobal: true" apps/api/src/database/
2. Agar DatabaseModule/DrizzleModule global bo'lsa — muammo yo'q
3. Global emas bo'lsa — wms.module.ts imports arrayiga DatabaseModule qo'shiladi:
   import { DatabaseModule } from '@database/database.module';
   // imports arrayga: DatabaseModule
4. Bu wms.module.ts owned file — bu agent o'zgartirishi mumkin
```

### Holat 4: `production_order_components` jadvalida componentlar yo'q

```
Muammo: createDeductionRequests() da components.length === 0 — deduction yaratilmaydi.

Bu NORMAL holat:
- Sessiyada productionOrderId bo'lsa ham, BOM/components kiritilmagan bo'lishi mumkin
- Listener skip qiladi (Warn log bilan)
- Bu bug emas, sistem to'liq bo'lganda komponenta ma'lumoti kerak bo'ladi
- Hozircha: "0 deduction requests created" log = muvaffaqiyat

Kelajak: P18+ paketlarda BOM data kiritish muhim bo'ladi.
```

### Holat 5: `boolean` import mes-schema.ts da allaqachon bor

```
Tekshir:
grep -n "^import {" lib/db/src/schema/mes-schema.ts
# Agar boolean allaqachon bor — qo'shma, aks holda qo'sh
```

---

## 10. OLTIN ZANJIR (GOLDEN THREAD) TEKSHIRUVI

Bu paket MES→WMS bog'lanishini yopadi. Oltin zanjirning bu segmenti:

```
MES sessiya yakunlash
  └─ CompleteSessionHandler.execute()
      ├─ session.complete() + session.moveToQc() [P16 da to'g'irlangan]
      ├─ MesCompletedEvent → QcModule (mavjud, P17 ta'sir qilmaydi)
      ├─ MesToHr360Event (P17: real qty/defectRate/oee bilan) → HR 360 listener
      └─ MesCompletedEvent → WmsModule → MesCompletedDeductionListener (P17: YANGI)
                                          └─ warehouse_deduction_requests INSERT
                                             (pending_confirmation status)
```

**P17 oldin (BUZUQ)**:
- MES → WMS: YO'Q (no listener)
- MES → HR 360: YARIM (qty=0/defect=0/oee=0)

**P17 dan keyin (TO'G'RI)**:
- MES → WMS: ULANGAN (deduction request pending_confirmation)
- MES → HR 360: TO'G'RI (real metriklar)

**Keyingi qadam (P18 yoki keyinroq)**:
- Operator IoT: `POST /api/iot/production-sessions/:id/confirm-deduction`
- `pending_confirmation` → `confirmed` → `warehouse_stock.quantity` kamayadi

---

## 11. MUHIM ESLATMALAR

### 11.1 "V2" terminologiyasi TAQIQ:
Bu paketda hech qayerda "V2", "Strangler Fig", "V1 vs V2" ishlatilmaydi. Bitta kod bazasi bor, shu yerda to'g'irlanadi.

### 11.2 DDL GATED — keyin aytmaslik:
- Migration fayl tayyorlanadi (d6-mes-safety-checklist.sql)
- Egasi "ha" demaguncha `psql` bilan ishga tushirilmaydi
- `drizzle-kit push` ham ishga tushirilmaydi
- Drizzle TS sxema yoziladi (type-safety uchun, runtime da jadval bo'lmasa ham xato bermaydi — `pending_confirmation` row INSERT xato beradi, lekin bu `try/catch` ichida)

### 11.3 `warehouse_stock` ga yozish TAQIQ:
EP-MES-006: bu paketda `warehouse_stock.quantity` KAMAYTIRILMAYDI. Faqat `warehouse_deduction_requests` ga `pending_confirmation` row qo'shiladi. Operator tasdiqlamasa — material ayirilmaydi. Bu E1 (AI kuzatadi → inson tasdiqlaydi) tamoyili.

### 11.4 Idempotency:
`MesCompletedEvent` bir necha marta kelishi mumkin (event bus at-least-once). Listener:
1. `warehouseDeductionRequests` da `sessionId` bo'yicha tekshiradi
2. Allaqachon bor bo'lsa — skip + warn log
3. Yo'q bo'lsa — INSERT qiladi

### 11.5 Xatolar zanjirni to'xtatmaydi:
`handleMesCompleted()` `void` qaytaradi. Xato bo'lsa — log qilinadi, lekin:
- QC listener hali ishlaydi (alohida `@OnEvent`)
- HR 360 listener hali ishlaydi (alohida `@OnEvent`)
- Sessiya allaqachon `COMPLETED/SENT_TO_QC` statusida

---

## Holat hisoboti shabloni (bajaruvchi uchun):

Har qadam bajarilgandan keyin quyidagi formatda egaga hisobot:

```
P17 holat hisoboti — [sana]

✅ Bajarildi:
- Qadam 1: mes-schema.ts — 3 jadval Drizzle ta'rifi qo'shildi
- Qadam 2: equipment 4 norma ustun — P12 ga DEKLARATSIYA qilindi (P17 pp-production.ts ga tegmaydi)
- Qadam 3: complete-session.handler.ts — real metrik uzatish to'g'irlandi
- Qadam 4: mes-completed-deduction.listener.ts — YANGI fayl yaratildi
- Qadam 5: wms.module.ts — listener ro'yxatga olindi
- Qadam 6: d6-mes-safety-checklist.sql — GATED migration tayyorlandi

⏳ Kutilmoqda (DDL GATE):
- d6 migration egasi ruxsatini kutmoqda
- 3 jadval + 4 ustun + 16 seed

🔒 To'g'irlanmadi (owned emas / keyingi paket):
- MesToHr360Event konstruktori: [qaror: kengaytirildi / koordinatsiya kerak]
- warehouse_stock deduction: P18+ da operator confirm endpoint kerak

📊 Tekshiruvlar:
- BE tsc: 0 xato ✅
- Schema tsc: 0 xato ✅
- Boot: OK ✅
- Reviewer-result-pattern: FAIL=0 ✅

📝 Commit SHA'lar:
- [sha1] Schema additions
- [sha2] complete-session handler fix
- [sha3] WMS deduction listener
- [sha4] Migration GATED
```

---

---

## 12. CONFORM-FIX JADVALI (00-INTERVYU-MOSLIK.md §2 MES qatori — P17 hissasi)

> Bu bo'lim `00-INTERVYU-MOSLIK.md` dagi MES "QISMAN MOS" hukmidagi tuzatishlarning P17
> ga tegishli qismini ko'rsatadi. P16 ning §9 jadvalini ham ko'ring.

| # | Egasi qatori / EP kodi | P17 holati | Izoh |
|---|------------------------|------------|------|
| 1 | **complete-with-triple DB yozuv** (EP-MES-060) | ✅ **P17 scope** | `CompleteSessionHandler` ga `triple` parametr qo'shiladi. `MesToHr360Event` da real metriklar. P16 da 501 stub — P17 real qiladi (`production_sessions` UPDATE). |
| 2 | **WMS material deduction** (EP-MES-006) | ✅ **P17 DA AMALGA OSHIRILDI** | `MesCompletedDeductionListener` — `warehouse_deduction_requests` `pending_confirmation` bilan. `warehouse_stock` KAMAYTIRILMAYDI (E1: operator tasdiq kerak). |
| 3 | **TB-checklist tablet oqimi** (EP-MES-004) | ⏳ **DDL GATED** | `mes_safety_checklist_items` DDL GATED — egasi ruxsatidan keyin. 16 seed qator tayyorlandi. FE oqimi (IoT modal) keyingi to'lqin. |
| 4 | **Smena handover** (EP-MES-023, EP-COR-099) | ⏳ **DEFER — alohida to'lqin** | P17 scope da emas. `mes_shift_handovers` jadval mavjud. Cron (5-daqiqa) + FE + avto-trigger keyingi to'lqin. EGASI SAVOLI: operator forget → 15 daqiqa avto-trigger (VISION-1000 Q167) tasdiqlansinmi? |
| 5 | **Bonus A/B/C tier summasi** (EP-MES-027) | ⏳ **DEFER — EGASI QIYMATI KERAK** | Egasi Q380: "A toifaga = belgilangan X so'm (foiz emas)". Bu summa hardcode qilinmaydi. `MesToHr360Event` real metrik uzatilmoqda (P17 fix). Bonus hisob: P27/28 HR + EGASI QIYMATI KERAK. |
| 6 | **~30 mashina seed** (EP-IOT-031, EP-IOT-044) | ⏳ **DEFER — P44/P45 IOT** | Egasi: "kitob nomlari" (SM-52/SM-72/KBA-105/Tigellar...). `equipment` jadvalida. 00-INTERVYU-MOSLIK §1: P44╳P45 kross-paket to'qnashuv (inglizcha/o'zbekcha status, generic/kitob kod) hal qilinsin. Seed P44 tasdiqlangach. |
| 7 | **OEE sozlash ajratish** (EP-MES-014) | ✅ **P16 DA AMALGA OSHIRILDI** | `calcOee` sozlash delta ajratadi. DDL null=0 fallback. P17 scope emas. |
| 8 | **GSD/HR 360 real metrik** (EP-MES-019/020) | ✅ **P17 DA AMALGA OSHIRILDI** | `complete-session.handler.ts` real `qty/defectRate/oee` uzatadi. Avval 0 edi. |

> **P17 asosiy natijalar:**
> MES→WMS deduction listener ULANDI (EP-MES-006: operator tasdiq pending).
> MES→HR360 real metriklar UZATILMOQDA (EP-MES-019/020).
> TB-checklist DDL tayyorlandi (GATED).
> Smena-handover, bonus summasi, ~30-mashina seed — owner-gated / kross-paket DEFER.
> Hardcode taqiq saqlandi — egasi qiymatlari belgilanmagan joylar EGASI QIYMATI KERAK.

---

*P17 direktiva yakunlandi. Q-47: ≥1000 qator.*
*Egasi ruxsati kerak: DDL (d6 migration) + MesToHr360Event kengaytirish (agar boshqa paket owns qilsa).*
*CONFORM-UPDATED 2026-06-19: moslik jadvali §12 qo'shildi.*
*Wave 3 · dependsOn P16 · Muzey: EP-MES-004/006/019/020/034/039/040/082*
