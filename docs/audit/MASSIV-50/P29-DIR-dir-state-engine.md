# P29 — DIR: DIR state master-data DDL + cron + log + alert

> **Paket:** P29 · **Modul:** DIR (Director / Strategiya) · **To'lqin:** Wave 1
> **Slug:** `dir-state-engine`
> **Bog'liqlik:** P01 (schema-lib-barrel) TUGAGUNCHA KUTIB TUR — P01 eksportlari
> `@europrint/db` barrel orqali mavjud bo'lishi kerak.
> **DDL Darvozasi:** HA — 6 ta yangi jadval, 3 ta ALTER; migration faqat egasi
> `APPROVED:` belgisi qo'yilgandan keyin ishga tushiriladi.

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiyada avval `CLAUDE.md` + `docs/agent-constitution.md`
o'qi. Quyidagi qoidalar bloki (Q-47) ushbu direktiva uchun majburiy — biron qoidani
o'tkazib yuborish to'liq sessiya bajarilishini bekor qiladi.

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/
    fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ
    o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Q-23/Q-31): faqat bu paketning OWNED-FILE ro'yxatidagi
    fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida `-- APPROVED:` izoh shart. Migrationni YOZ lekin GATED
    belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit → saqla → qayta o'qi → ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/ + MUSLIMBEK-PROMT-12-
    DIR-2026-06-08.md); kod vizyonga zid bo'lsa (ishlasa ham) = XATO.
```

**Wave:** 1 · **dependsOn:** ["P01"] — P01 tugamasdan ish boshlama.

---

## 1. IZOLYATSIYA MANIFESTI

Ushbu agent FAQAT quyidagi 15 ta faylga tegadi. Boshqa birorta faylga tegish
kerak bo'lsa — DARHOL TO'XTA va egasiga flag qil; supurib ketma.

```
OWNED FILES (mutlaq yo'llar — repo ildizidan):
 1. Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/
       i-company-state-config.repo.ts                    [YANGI — yaratiladi]
 2. Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/
       company-state-config.repository.ts                [YANGI — yaratiladi]
 3. Uzbek-Language-Module/apps/api/src/modules/director/application/
       company-state-config.service.ts                   [YANGI — yaratiladi]
 4. Uzbek-Language-Module/apps/api/src/modules/director/presentation/
       company-state-config.controller.ts                [YANGI — yaratiladi]
 5. Uzbek-Language-Module/apps/api/src/modules/director/director.module.ts
       [MAVJUD — providers/controllers qo'shiladi]
 6. Uzbek-Language-Module/apps/api/src/modules/remaining/company-state.service.ts
       [MAVJUD — calculateState() 5-metrikaga o'giriladi, THRESHOLDS DB'dan o'qiladi]
 7. Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts
       [MAVJUD — idealRasmTargets pgTable + 6 yangi pgTable qo'shiladi]
 8. Uzbek-Language-Module/apps/api/src/modules/director/application/
       company-state-calc.service.ts                     [YANGI — yaratiladi]
 9. Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/
       company-state-log.repository.ts                   [YANGI — yaratiladi]
10. Uzbek-Language-Module/apps/api/src/modules/director/application/
       director-cron.service.ts                          [YANGI — yaratiladi]
11. Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/
       director-data.repository.ts
       [MAVJUD — markVip() real DB write bilan almashtiriladi]
12. Uzbek-Language-Module/apps/api/src/modules/director/application/
       director-data.service.ts
       [MAVJUD — markVip() signature va lug'ati to'g'irlandadi]
13. Uzbek-Language-Module/artifacts/erp-dashboard/src/components/director/
       CompanyStateWidget.tsx
       [MAVJUD — status→state field mismatch tuzatiladi + 5-metrika paneli]
14. Uzbek-Language-Module/artifacts/erp-dashboard/src/components/director/
       IdealVsActualPanel.tsx
       [MAVJUD — hardcoded FE_PROFIT_TARGET / FE_REVENUE_TARGET olib tashlanadi]
15. Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/
       DirectorSettingsPage.tsx
       [YANGI — State Levels CRUD + Metric Weights sliders]
```

**DDL Darvozasi:** Quyidagi migration faylini YOZING lekin `pnpm drizzle-kit push`
yoki `psql` bilan ISHGA TUSHURMANG — egasi `APPROVED:` imzosini qo'yguncha:

```
Uzbek-Language-Module/apps/api/src/database/migrations/
  p29-dir-state-engine-ddl.sql
```

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-12-DIR-2026-06-08.md` (PHASE 1 + PHASE 2),
`docs/audit/decisions/05-director.md` (EP-DIR-001..EP-DIR-029),
`docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` (Director section, qatorlar 187–204).

### 2.1 Holat formulasi (EP-DIR-001) — 5 o'lchovli, konfiguratsiya qilinadigan

Kompaniya holati **5 og'irlikli metrika** asosida hisoblanadi:

| Kalit | Manba | Og'irlik (standart) |
|---|---|---|
| `cash_flow` | FIN: `entries` jadval yozuvlaridan haftaning sof oqimi | 0.25 |
| `production_plan` | PP: `production_orders` bajarish % | 0.25 |
| `orders` | SD: `sales_orders` faol/muddati o'tgan nisbati | 0.20 |
| `hr` | HR: `employees` davomat % | 0.15 |
| `quality` | QC: `mes_sessions` sifat o'tish % (today) | 0.15 |

**Og'irliklar DB'da saqlanadi** (`state_thresholds.weight`). Direktor ularni
`DirectorSettingsPage` dan o'zgartira oladi. Og'irliklar yig'indisi = 1.0 (Zod
validation + BE shart).

### 2.2 Holat darajalari (EP-DIR-029) — 5 daraja, rang bilan

```
OSISH   → #10B981 (emerald-500) → rank 5 (eng yaxshi)
NORMAL  → #3B82F6 (blue-500)    → rank 4
EHTIYOT → #F59E0B (amber-500)   → rank 3
XAVF    → #F97316 (orange-500)  → rank 2
INQIROZ → #EF4444 (red-500)     → rank 1 (eng yomon)
```

Ranglar, yorliqlar va chegara qiymatlar DB'da saqlanadi — direktor ularni
`DirectorSettingsPage` dagi CRUD jadvalidan o'zgartira oladi.

### 2.3 Cron + log + alert (EP-DIR-003/005)

- `@Cron('0 7 * * *')` — har kuni soat 07:00 da:
  1. `calculateState()` → 5 metrika o'qiladi (har biri kanon jadvaldan)
  2. `company_state_log` ga yangi qator yoziladi (`kpis` JSONB + `score_total`)
  3. Holat avvalgisidan o'zgargan bo'lsa → NTF moduli orqali direktorgacha
     bildirishnoma yuboriladi (EP-DIR-005)

### 2.3-A Telegram kunlik digest (EP-DIR-028) — SCOPE: P29 cron stub

**Egasi qarori (OCHIQ-JAVOBLAR, printsip-asosli avto-qabul):**
Har ertalab avtomatik digest — kompaniya holati xulasasi Telegram + tizim
ichida direktorga yuboriladi. ShVB YO'NALISH 38: "Har kun 07:00–08:00 oralig'ida
direktor kunlik holatni Telegram da oladi" + `@Cron` kunlik holat.

**P29 doirasida:** `DirectorCronService.runDailyStateCalc()` da holat log'ga
yozilgandan keyin Telegram digest triggerlanadi. Hozir faqat `logger.warn` chiqaradi
(NTF moduli P47 ga bogliq — cross-module). To'liq wiring P47 (NTF) tugaganidan keyin.

```typescript
// director-cron.service.ts ichida — holat log'dan keyin (mavjud TODO ga mos):
// TODO (keyingi faza / P47 tayyor bo'lgach):
// EventEmitter2.emit('director.digest.morning', {
//   stateCode: newCode, score: calcR.data.scoreTotal,
//   kpis: calcR.data.rawKpis, date: new Date().toISOString()
// })
// NTF routing: director rol → Telegram kanal + tizim notification
```

> ⚠️ **EGASI QIYMATI KERAK:** Telegram kanal ID va bot token — master-data
> sozlamalarida (NTF modul `ntf_channels` jadvali). P29 bu qiymatlarni ixtiro qilmaydi.
> NTF P47 tayyor bo'lganda wiring qilinadi.

### 2.3-B Kunlik AI tahlilchi (EP-DIR-026) — SCOPE: P29 placeholder

**Egasi qarori (OCHIQ-JAVOBLAR, printsip-asosli avto-qabul):**
Har kuni AI qisqa tahlil + 1-2 tavsiya beradi. ShVB `director-ai.service`:
`analyzeCompanyState()` — holat formulasi asosida sabablar + tavsiyalar +
`generateWeeklyBriefing()`. LOYIHA-BITGAN §A.6 (70% tahlil+AI).

**P29 doirasida:** AI tahlilchi alohida servis (P35/P36 AI modul tomonidan
implement qilinadi). P29 faqat `company_state_log` yozuvi orqali AI ga ma'lumot
taqdim etadi — AI shu logni o'qib tahlil qiladi.

```typescript
// director-cron.service.ts ichida — log yozilgandan keyin:
// TODO (P35/P36 AI modul tayyor bo'lgach):
// EventEmitter2.emit('director.ai.analyze', {
//   stateCode: newCode, score: calcR.data.scoreTotal,
//   kpis: calcR.data.rawKpis, logId: logR.data.id
// })
// AI servis: analyzeCompanyState(logId) → tavsiyalar + sabablar
```

> ⚠️ **DEFER-IZOH:** EP-DIR-026 to'liq implement P35/P36 (AI modul) ga bog'liq.
> P29 dan faqat event emitter stub + `company_state_log` data provider.

### 2.3-C Kechikish/og'ish majburiy sabab kategoriyasi (EP-DIR-037) — SCOPE: P29 deferred

**Egasi qarori (OCHIQ-JAVOBLAR, yangi qaror):**
Kechikish va rejadan og'ish counteri majburiy sabab kategoriyasi bilan yoziladi:
`material / transport / operator / qolip / boshqa`. Root-cause tahlil uchun asos.
`delay_count` va `plan_deviation_count` har bo'lim uchun alohida hisoblanadi.

**P29 doirasida:** `company_state_log.kpis` JSONB ga `delay_count` va
`plan_deviation_count` qo'shiladi (har holat hisoblanishi bilan). Majburiy
`reason_category` DB maydoni PP/MES modulida (P12/P15 owned) implement qilinadi.

```typescript
// company-state-calc.service.ts _readAllMetrics() ichiga qo'shish (keyingi faza):
// delay_count: production_orders WHERE status='delayed' (bugun/hafta)
// plan_deviation_count: production_orders WHERE completion_pct < target_pct
// reason_category: PP modul EP-DIR-037 implement qiladi — P29 faqat aggregate
```

**Reason category master-data:**

```sql
-- EGASI QIYMATI KERAK: quyidagi kategoriyalar egasi tasdig'i bilan finallanadi.
-- A-default (egasi qaroridan): material / transport / operator / qolip / boshqa
-- P29 DDL da CHECK constraint qo'shilmaydi — PP/MES P12/P15 owned.
-- P29 logga aggregate counter yozadi, kategoriya breakdown keyingi fazada.
```

> ⚠️ **DEFER-IZOH:** EP-DIR-037 to'liq implement PP (P12) va MES (P15) modullariga
> bog'liq (reason_category ustuni ular tomonidan qo'shiladi). P29 dan faqat
> aggregate `delay_count` + `plan_deviation_count` `company_state_log.kpis` JSONB da.

### 2.4 markVip haqiqiy DB yozuvi (buzuq holat)

`DirectorDataService.markVip()` hozir `Ok({ marked: true })` qaytaradi, lekin
DB ga HECH NARSA yozmaydi (Q-40 soxta). Bu to'g'irlanishi kerak: `sales_orders`
jadvalida `is_vip BOOLEAN DEFAULT false` ustuniga `UPDATE` qilinadi.

### 2.5 CompanyStateWidget maydon nomi xatosi (buzuq holat)

`CompanyStateWidget.tsx:48` — `currentState?.status` deb o'qiydi.
Lekin `company-state.service.ts:63` — `{ state: stateKey, ... }` qaytaradi.
`status` kalit YO'Q — shuning uchun `state` nomiga o'zgartirilishi kerak.

### 2.6 IdealVsActualPanel — FE hardcoded targetlar (buzuq holat)

`IdealVsActualPanel.tsx:17-18`:
```ts
const FE_PROFIT_TARGET = 100_000_000;   // hardcoded — TAQIQ
const FE_REVENUE_TARGET = 800_000_000;  // hardcoded — TAQIQ
```
Bu konstantalar BE `/api/director/ideal-vs-actual` javobida `profit.target` /
`revenue.target` sifatida kelishi kerak (ideal_rasm_targets jadvalidan). FE
faqat API javobini ko'rsatadi; o'z targetlarini saqlamaydi.

### 2.7 idealRasmTargets Drizzle pgTable (drift holat)

`ideal_rasm_targets` jadvali DB'da SQL orqali yaratilgan (IdealRasmRepository
ichida `ensureSeeded`), lekin `strategic-ext-schema.ts` da Drizzle `pgTable`
ta'rifi YO'Q → tsc va Drizzle push bir xil bo'lmaydi. pgTable qo'shilishi kerak.

### 2.8 OKR karta-markazli (EP-DIR-016) — deferred ustunlar

`okr_objectives` jadvali `ownerId` → `users` (FK) ishlatadi. Vizyon bo'yicha
`owner_card_id → org_functions` bo'lishi kerak (karta-markazli model). Ushbu
ALTER jadvalga qo'shiladi (ADD COLUMN, eski `owner_id` o'chirilmaydi — Q-46).

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (exists)

```
BE:
  ✅ DirectorModule — director.module.ts:93–146 ro'yxatda, 11 controller ulangan
  ✅ /api/director/dashboard — DirectorDataRepository.queryDashboard() real SQL
  ✅ /api/company-state/current — CompanyStateService.getCurrent() ishlaydi
     (lekin 3 metrika bilan, hardcoded THRESHOLDS: company-state.service.ts:12-16)
  ✅ /api/director/company-state/history — DirectorStateRepository:64 real SQL
  ✅ /api/director/ideal-vs-actual — DirectorStateRepository:82 real SQL
  ✅ /api/ideal-rasm/* — IdealRasmService + IdealRasmRepository mavjud
  ✅ /api/okr/objectives + /api/okr/key-results — OkrController real Drizzle
  ✅ /api/strategic/* — StrategicController real Drizzle
  ✅ /api/director/approvals — CQRS real writes
  ✅ /api/director/orders/:id/vip — DirectorExtendedController route mavjud

DB:
  ✅ okr_objectives (strategic-ext-schema.ts:278)
  ✅ okr_key_results (strategic-ext-schema.ts:296)
  ✅ strategic_tasks (strategic-ext-schema.ts:31)
  ✅ strategic_categories (strategic-ext-schema.ts:17)
  ✅ strategic_milestones (strategic-ext-schema.ts:67)
  ✅ ideal_rasm_targets (raw SQL only — Drizzle pgTable YO'Q)

FE:
  ✅ CompanyStateWidget.tsx — mavjud, 4-panel, lekin field mismatch bor
  ✅ IdealVsActualPanel.tsx — mavjud, lekin hardcoded targetlar bor
  ✅ DirectorDashboard.tsx — 10 endpoint, mavjud
```

### 3.2 Yo'q (missing)

```
DB:
  ❌ company_state_levels — hardcoded faqat FE stateStatusMap + BE STATE_LABELS
  ❌ state_thresholds — hardcoded: company-state.service.ts:12-16 THRESHOLDS ob'yekt
  ❌ company_state_log — INSERT hech qachon sodir bo'lmaydi; jadval yo'q
  ❌ stat_regulations — hech qanday kod yo'q
  ❌ diary_entries — hech qanday kod yo'q
  ❌ monthly_plans — strategic_tasks bor, lekin month/weekly breakdown yo'q

BE:
  ❌ i-company-state-config.repo.ts — interfeys yo'q
  ❌ company-state-config.repository.ts — repo yo'q
  ❌ company-state-config.service.ts — servis yo'q
  ❌ company-state-config.controller.ts — controller yo'q
  ❌ company-state-calc.service.ts — 5-metrika hisoblash yo'q
  ❌ company-state-log.repository.ts — log yozish yo'q
  ❌ director-cron.service.ts — @Cron('0 7 * * *') hech qayerda yo'q
  ❌ NTF alert on state change — sendAlert() yo'q
  ❌ okr_objectives.owner_card_id → org_functions FK yo'q
  ❌ okr_objectives.parent_goal_id self-ref yo'q
  ❌ strategic_tasks.owner_card_id → org_functions FK yo'q
  ❌ idealRasmTargets pgTable yo'q (schema drift)

FE:
  ❌ DirectorSettingsPage — yo'q (to'liq yangi sahifa kerak)
```

### 3.3 Buzuq/Soxta (brokenOrFake)

```
BE:
  ❌ director-data.service.ts:54 — markVip() = Ok({marked:true}) DB yozmaydi
     [FAYL: apps/api/src/modules/director/application/director-data.service.ts, qator 54]

  ❌ company-state.service.ts:12-16 — THRESHOLDS ob'yekti hardcoded
     [FAYL: apps/api/src/modules/remaining/company-state.service.ts, qatorlar 12–16]
     const THRESHOLDS = {
       profit:    { osish: 130_000_000, ... },   // ← DB'dan o'qilishi kerak
       revenue:   { osish: 1_000_000_000, ... },
       retention: { osish: 98, ... },
     };

  ❌ director-state.repository.ts:28-29 — PROFIT_TARGET_WEEKLY / REVENUE_TARGET_WEEKLY
     magic numbers (ideal_rasm_targets dan o'qilishi kerak)

FE:
  ❌ CompanyStateWidget.tsx:48 — currentState?.status lekin API { state: ... } qaytaradi
     [FAYL: artifacts/erp-dashboard/src/components/director/CompanyStateWidget.tsx, qator 48]
     const state = stateStatusMap[currentState?.status ?? "normal"]  // 'status' YO'Q

  ❌ IdealVsActualPanel.tsx:17-18 — FE_PROFIT_TARGET/FE_REVENUE_TARGET hardcoded
     [FAYL: artifacts/erp-dashboard/src/components/director/IdealVsActualPanel.tsx, qatorlar 17–18]
     const FE_PROFIT_TARGET = 100_000_000;    // ← olib tashlanadi
     const FE_REVENUE_TARGET = 800_000_000;   // ← olib tashlanadi

  ❌ CompanyStateWidget.tsx — kpis.profit_pct / revenue_pct / retention_pct undefined
     bo'lishi mumkin chunki API response shape farq qiladi (only 3 metrics, not 5)

  ❌ okr_objectives.ownerId → users FK (vizyon: owner_card_id → org_functions)
     [FAYL: lib/db/src/schema/strategic-ext-schema.ts, qator 283]
```

---

## 4. ISH (QADAM-BAQADAM)

> Har qadam: **permission gate → yoz → tsc 0 → DB-proof yoki FE tekshiruv →
> commit → Uzbek hisobot → "davom" kut.**
> Keyingi qadam uchun avvalgisi shart.

---

### Qadam 1 — DDL: Migration fayli yaratish (GATED — ISHGA TUSHURMANG)

**Fayl:** `apps/api/src/database/migrations/p29-dir-state-engine-ddl.sql`
(bu fayl owned files ro'yxatida yo'q, lekin DDL gating uchun yoziladi — faqat
yozish, push yo'q; egasi imzolaydi)

Migration faylini § 5 (DDL bo'lim) dan ko'chirish bilan yozing. Faylning birinchi
satriga qo'shing:

```sql
-- APPROVED: <egasi ismi> <sana>
-- P29: DIR state engine — company_state_levels, state_thresholds,
--   company_state_log, stat_regulations, diary_entries, monthly_plans
--   + ALTER okr_objectives (parent_goal_id, owner_card_id)
--   + ALTER strategic_tasks (owner_card_id)
--   + ADD idealRasmTargets sync (no-op if table exists)
```

**Egasi imzosi bo'lmasa bu migration ISHGA TUSHIRILMAYDI — GATED.**

---

### Qadam 2 — strategic-ext-schema.ts: 6 yangi pgTable + idealRasmTargets + ALTERlar

**Fayl:** `lib/db/src/schema/strategic-ext-schema.ts`

Faylning oxiriga (qator 352 dan keyin) qo'shiladi:

```typescript
// ============================================================
// P29: DIR STATE ENGINE — 6 yangi jadval
// ============================================================

// 2a. company_state_levels
export const companyStateLevels = pgTable('company_state_levels', {
  id:       serial('id').primaryKey(),
  code:     varchar('code', { length: 20 }).notNull().unique(),
  labelUz:  text('label_uz').notNull(),
  labelRu:  text('label_ru').notNull(),
  colorHex: varchar('color_hex', { length: 7 }).notNull(),
  rank:     integer('rank').notNull(),
});

export const insertCompanyStateLevelSchema = createInsertSchema(companyStateLevels, {
  code:     z.enum(['OSISH','NORMAL','EHTIYOT','XAVF','INQIROZ']),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Rang #RRGGBB shaklida bo\'lishi kerak'),
  rank:     z.number().int().min(1).max(5),
}).omit({ id: true } as never);

export type CompanyStateLevel   = typeof companyStateLevels.$inferSelect;
export type InsertCompanyStateLevel = z.infer<typeof insertCompanyStateLevelSchema>;

// 2b. state_thresholds (5 metrika x 5 daraja = 25 qator)
export const stateThresholds = pgTable('state_thresholds', {
  id:        serial('id').primaryKey(),
  metricKey: varchar('metric_key', { length: 50 }).notNull(),
  levelCode: varchar('level_code', { length: 20 })
               .notNull()
               .references(() => companyStateLevels.code, { onDelete: 'cascade' }),
  minValue:  numeric('min_value', { precision: 14, scale: 4 }),
  maxValue:  numeric('max_value', { precision: 14, scale: 4 }),
  weight:    numeric('weight', { precision: 4, scale: 3 }).notNull().default('0.2'),
}, (t) => [
  check('state_thresholds_metric_chk',
    sql`${t.metricKey} IN ('cash_flow','production_plan','orders','hr','quality')`),
]);

export const insertStateThresholdSchema = createInsertSchema(stateThresholds, {
  metricKey: z.enum(['cash_flow','production_plan','orders','hr','quality']),
  levelCode: z.enum(['OSISH','NORMAL','EHTIYOT','XAVF','INQIROZ']),
  weight:    z.number().min(0).max(1),
}).omit({ id: true } as never);

export type StateThreshold      = typeof stateThresholds.$inferSelect;
export type InsertStateThreshold = z.infer<typeof insertStateThresholdSchema>;

// 2c. company_state_log
export const companyStateLog = pgTable('company_state_log', {
  id:         serial('id').primaryKey(),
  stateCode:  varchar('state_code', { length: 20 }).notNull(),
  kpis:       jsonb('kpis').notNull(),
  scoreTotal: numeric('score_total', { precision: 5, scale: 2 }),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export type CompanyStateLog     = typeof companyStateLog.$inferSelect;

// 2d. stat_regulations
// ESLATMA: owner_card_id → org_functions(id) FK — P04 (ORG) tugaganidan keyin
//          constraint qo'shiladi. Hozircha integer (unconstrained).
export const statRegulations = pgTable('stat_regulations', {
  id:           serial('id').primaryKey(),
  nameUz:       text('name_uz').notNull(),
  nameRu:       text('name_ru'),
  definition:   text('definition'),
  formula:      text('formula'),
  unit:         varchar('unit', { length: 50 }),
  frequency:    varchar('frequency', { length: 20 }),
  sourceModule: varchar('source_module', { length: 50 }),
  ownerCardId:  integer('owner_card_id'),   // → org_functions(id) — deferred FK
  targetValue:  numeric('target_value', { precision: 14, scale: 4 }),
  version:      integer('version').notNull().default(1),
  validFrom:    date('valid_from').notNull().defaultNow(),
  isActive:     boolean('is_active').notNull().default(true),
}, (t) => [
  check('stat_regulations_freq_chk',
    sql`${t.frequency} IN ('daily','weekly','monthly')`),
]);

export const insertStatRegulationSchema = createInsertSchema(statRegulations, {
  nameUz:    z.string().min(1),
  frequency: z.enum(['daily','weekly','monthly']).optional(),
  version:   z.number().int().min(1).default(1),
}).omit({ id: true } as never);

export type StatRegulation      = typeof statRegulations.$inferSelect;
export type InsertStatRegulation = z.infer<typeof insertStatRegulationSchema>;

// 2e. diary_entries
export const diaryEntries = pgTable('diary_entries', {
  id:               serial('id').primaryKey(),
  authorCardId:     integer('author_card_id'),   // → org_functions(id) — deferred FK
  date:             date('date').notNull(),
  dailyState:       varchar('daily_state', { length: 20 }),
  mainKpiValue:     numeric('main_kpi_value', { precision: 14, scale: 4 }),
  mainIssue:        text('main_issue'),
  solution:         text('solution'),
  tomorrowPlan:     text('tomorrow_plan'),
  carryOverIssues:  jsonb('carry_over_issues').default('[]'),
  status:           varchar('status', { length: 20 }).notNull().default('draft'),
}, (t) => [
  // Bir kunda bir muallif uchun faqat bitta yozuv
  // UNIQUE (author_card_id, date) — migration da qo'shiladi
]);

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries, {
  dailyState: z.enum(['OSISH','NORMAL','EHTIYOT','XAVF','INQIROZ']).optional(),
  status:     z.enum(['draft','submitted','reviewed']).default('draft'),
}).omit({ id: true } as never);

export type DiaryEntry          = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry    = z.infer<typeof insertDiaryEntrySchema>;

// 2f. monthly_plans
export const monthlyPlans = pgTable('monthly_plans', {
  id:              serial('id').primaryKey(),
  strategicGoalId: integer('strategic_goal_id')
                     .references(() => okrObjectives.id, { onDelete: 'set null' }),
  month:           varchar('month', { length: 7 }).notNull(),   // 'YYYY-MM'
  objectives:      jsonb('objectives').default('[]'),
  weeklyTasks:     jsonb('weekly_tasks').default('[]'),
  completionPct:   integer('completion_pct').notNull().default(0),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
});

export const insertMonthlyPlanSchema = createInsertSchema(monthlyPlans, {
  month:         z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM shaklida bo\'lishi kerak'),
  completionPct: z.number().int().min(0).max(100).default(0),
}).omit({ id: true, createdAt: true } as never);

export type MonthlyPlan         = typeof monthlyPlans.$inferSelect;
export type InsertMonthlyPlan   = z.infer<typeof insertMonthlyPlanSchema>;

// ============================================================
// P29: idealRasmTargets — DB'da mavjud, lekin Drizzle pgTable yo'q edi
// Schema drift bartaraf etiladi (Q-40 to'g'ri o'lchov)
// ============================================================

export const idealRasmTargets = pgTable('ideal_rasm_targets', {
  id:             serial('id').primaryKey(),
  metricKey:      varchar('metric_key', { length: 50 }).notNull().unique(),
  targetValue:    numeric('target_value', { precision: 14, scale: 2 }).notNull(),
  unit:           varchar('unit', { length: 50 }),
  description:    text('description'),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
});

export const insertIdealRasmTargetSchema = createInsertSchema(idealRasmTargets, {
  metricKey:   z.string().min(1),
  targetValue: z.number().positive(),
}).omit({ id: true, updatedAt: true } as never);

export type IdealRasmTarget     = typeof idealRasmTargets.$inferSelect;
export type InsertIdealRasmTarget = z.infer<typeof insertIdealRasmTargetSchema>;
```

**okr_objectives ustunlari — Drizzle-level (ALTER uchun):**
`okrObjectives` jadval ta'rifiga (strategic-ext-schema.ts:278–293) qo'shimcha
ustunlar qo'shiladi:

```typescript
// Existing okrObjectives pgTable ichida:
parentGoalId:  integer('parent_goal_id'),       // self-ref (ALTER GATED)
ownerCardId:   integer('owner_card_id'),         // → org_functions (ALTER GATED)
```

`strategicTasks` jadvaliga (qator 31–65):
```typescript
ownerCardId:   integer('owner_card_id'),         // → org_functions (ALTER GATED)
```

**MUHIM:** Bu Drizzle pgTable ta'riflari — DB ALTER'i GATED migration orqali
bajariladi. Drizzle schema'da ustunlar bo'lishi tsc 0 uchun kerak.

---

### Qadam 3 — i-company-state-config.repo.ts: Interfeys (yangi fayl)

**Fayl:** `apps/api/src/modules/director/domain/repositories/i-company-state-config.repo.ts`

```typescript
/**
 * @module i-company-state-config.repo
 * @description Domain port: company state config repository interface.
 *              All methods return Result<T> — never throw.
 */
import type { Result } from '@common/result';
import type { CompanyStateLevel, InsertCompanyStateLevel,
              StateThreshold, InsertStateThreshold } from '@europrint/db';

export const COMPANY_STATE_CONFIG_REPO = Symbol('COMPANY_STATE_CONFIG_REPO');

export interface ICompanyStateConfigRepo {
  // State Levels
  findAllLevels():       Promise<Result<CompanyStateLevel[]>>;
  upsertLevel(dto: InsertCompanyStateLevel): Promise<Result<CompanyStateLevel>>;
  deleteLevel(code: string): Promise<Result<void>>;

  // State Thresholds (weights per metric)
  findAllThresholds():   Promise<Result<StateThreshold[]>>;
  findThresholdsByMetric(metricKey: string): Promise<Result<StateThreshold[]>>;
  upsertThreshold(dto: InsertStateThreshold): Promise<Result<StateThreshold>>;
  bulkUpsertThresholds(dtos: InsertStateThreshold[]): Promise<Result<StateThreshold[]>>;
}
```

---

### Qadam 4 — company-state-config.repository.ts: Drizzle implementatsiya (yangi fayl)

**Fayl:** `apps/api/src/modules/director/infrastructure/repositories/company-state-config.repository.ts`

```typescript
/**
 * @module company-state-config.repository
 * @description Drizzle ORM implementation of ICompanyStateConfigRepo.
 * @layer Infrastructure
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq } from 'drizzle-orm';
import { safeCall, Result, Ok, err, AppErr } from '@common/result';
import {
  companyStateLevels, stateThresholds,
  type CompanyStateLevel, type InsertCompanyStateLevel,
  type StateThreshold, type InsertStateThreshold,
} from '@europrint/db';
import type { ICompanyStateConfigRepo } from '../../domain/repositories/i-company-state-config.repo';

@Injectable()
export class CompanyStateConfigRepository implements ICompanyStateConfigRepo {

  async findAllLevels(): Promise<Result<CompanyStateLevel[]>> {
    return safeCall(async () => {
      return db.select().from(companyStateLevels).orderBy(companyStateLevels.rank);
    }, 'DB_ERROR');
  }

  async upsertLevel(dto: InsertCompanyStateLevel): Promise<Result<CompanyStateLevel>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(companyStateLevels)
        .values(dto)
        .onConflictDoUpdate({
          target: companyStateLevels.code,
          set: {
            labelUz:  dto.labelUz,
            labelRu:  dto.labelRu,
            colorHex: dto.colorHex,
            rank:     dto.rank,
          },
        })
        .returning();
      if (!row) throw new Error('Upsert qaytarmadi');
      return row;
    }, 'DB_ERROR');
  }

  async deleteLevel(code: string): Promise<Result<void>> {
    return safeCall(async () => {
      await db.delete(companyStateLevels).where(eq(companyStateLevels.code, code));
    }, 'DB_ERROR');
  }

  async findAllThresholds(): Promise<Result<StateThreshold[]>> {
    return safeCall(async () => {
      return db.select().from(stateThresholds)
        .orderBy(stateThresholds.metricKey, stateThresholds.levelCode);
    }, 'DB_ERROR');
  }

  async findThresholdsByMetric(metricKey: string): Promise<Result<StateThreshold[]>> {
    return safeCall(async () => {
      return db.select().from(stateThresholds)
        .where(eq(stateThresholds.metricKey, metricKey));
    }, 'DB_ERROR');
  }

  async upsertThreshold(dto: InsertStateThreshold): Promise<Result<StateThreshold>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(stateThresholds)
        .values(dto)
        .onConflictDoUpdate({
          target: [stateThresholds.metricKey, stateThresholds.levelCode],
          set: { minValue: dto.minValue, maxValue: dto.maxValue, weight: dto.weight },
        })
        .returning();
      if (!row) throw new Error('Upsert qaytarmadi');
      return row;
    }, 'DB_ERROR');
  }

  async bulkUpsertThresholds(dtos: InsertStateThreshold[]): Promise<Result<StateThreshold[]>> {
    return safeCall(async () => {
      if (!Array.isArray(dtos) || dtos.length === 0) return [];
      // Og'irliklar yig'indisi validatsiyasi
      const weightsByMetric: Record<string, number> = {};
      for (const dto of dtos) {
        weightsByMetric[dto.metricKey] = (weightsByMetric[dto.metricKey] ?? 0)
          + parseFloat(String(dto.weight ?? '0'));
      }
      for (const [metric, total] of Object.entries(weightsByMetric)) {
        if (Math.abs(total - 1.0) > 0.001) {
          throw new Error(`${metric} og'irliklari yig'indisi 1.0 bo'lishi kerak (hozir: ${total})`);
        }
      }
      return db
        .insert(stateThresholds)
        .values(dtos)
        .onConflictDoUpdate({
          target: [stateThresholds.metricKey, stateThresholds.levelCode],
          set: { weight: sql`EXCLUDED.weight`, minValue: sql`EXCLUDED.min_value`, maxValue: sql`EXCLUDED.max_value` },
        })
        .returning();
    }, 'DB_ERROR');
  }
}
```

**ESLATMA:** `sql` Drizzle-ORMdan import qilinishi kerak (`import { sql } from 'drizzle-orm'`).

---

### Qadam 5 — company-state-calc.service.ts: 5-metrika hisoblash (yangi fayl)

**Fayl:** `apps/api/src/modules/director/application/company-state-calc.service.ts`

Bu servis `remaining/company-state.service.ts` dagi HARDCODED `THRESHOLDS`
ob'yektini to'liq almashtiradi — 5 metrikani kanon jadvallardan o'qiydi.

```typescript
/**
 * @module company-state-calc.service
 * @description 5-metric weighted company state calculator.
 *              Reads thresholds from DB (state_thresholds), metrics from canonical tables.
 *              Returns Result<T> — never throws.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Ok, Result, AppErr } from '@common/result';
import {
  COMPANY_STATE_CONFIG_REPO,
  type ICompanyStateConfigRepo,
} from '../domain/repositories/i-company-state-config.repo';
import {
  companyStateLog,
  type CompanyStateLog,
} from '@europrint/db';

export interface MetricScores {
  cash_flow:        number;   // 0-100 normalizatsiya qilingan
  production_plan:  number;
  orders:           number;
  hr:               number;
  quality:          number;
}

export interface StateCalcResult {
  stateCode:   string;    // 'OSISH' | 'NORMAL' | 'EHTIYOT' | 'XAVF' | 'INQIROZ'
  scoreTotal:  number;    // 0-100 umumiy ball
  metrics:     MetricScores;
  rawKpis:     Record<string, number>;
  detectedAt:  string;    // ISO8601
}

@Injectable()
export class CompanyStateCalcService {
  private readonly logger = new Logger(CompanyStateCalcService.name);

  constructor(
    @Inject(COMPANY_STATE_CONFIG_REPO)
    private readonly configRepo: ICompanyStateConfigRepo,
  ) {}

  /**
   * Holat hisoblash — 5 kanon jadvaldan metrika o'qiydi, DB thresholds ishlatadi.
   * Q-40: Har bir metrika real SQL query orqali keladi.
   */
  async calculateState(): Promise<Result<StateCalcResult>> {
    return safeCall(async () => {
      const [thresholdsR, kpisR] = await Promise.all([
        this.configRepo.findAllThresholds(),
        this._readAllMetrics(),
      ]);

      if (!thresholdsR.ok) throw new Error(thresholdsR.error.message);
      if (!kpisR.ok) throw new Error(kpisR.error.message);

      const thresholds = thresholdsR.data;
      const rawKpis    = kpisR.data;

      // Og'irliklar (birinchi mavjud leveldagi weight = metrika og'irligi)
      const weightMap: Record<string, number> = {};
      for (const t of thresholds) {
        if (!(t.metricKey in weightMap)) {
          weightMap[t.metricKey] = parseFloat(String(t.weight ?? '0.2'));
        }
      }

      // Har metrika uchun 0-100 normalizatsiya (threshold qatorlariga nisbatan)
      const metrics: MetricScores = {
        cash_flow:       this._normalize('cash_flow',       rawKpis.cash_flow,       thresholds),
        production_plan: this._normalize('production_plan', rawKpis.production_plan, thresholds),
        orders:          this._normalize('orders',          rawKpis.orders,          thresholds),
        hr:              this._normalize('hr',              rawKpis.hr,              thresholds),
        quality:         this._normalize('quality',         rawKpis.quality,         thresholds),
      };

      const scoreTotal =
        metrics.cash_flow       * (weightMap['cash_flow']       ?? 0.25) * 100 +
        metrics.production_plan * (weightMap['production_plan'] ?? 0.25) * 100 +
        metrics.orders          * (weightMap['orders']          ?? 0.20) * 100 +
        metrics.hr              * (weightMap['hr']              ?? 0.15) * 100 +
        metrics.quality         * (weightMap['quality']         ?? 0.15) * 100;

      const stateCode = this._scoreToState(scoreTotal);

      return {
        stateCode,
        scoreTotal: Math.round(scoreTotal * 100) / 100,
        metrics,
        rawKpis,
        detectedAt: new Date().toISOString(),
      };
    }, 'STATE_CALC_ERROR');
  }

  /**
   * Hisoblash natijasini company_state_log ga yozadi.
   * Q-40: REAL INSERT — echo emas.
   */
  async insertLog(result: StateCalcResult): Promise<Result<CompanyStateLog>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(companyStateLog)
        .values({
          stateCode:  result.stateCode,
          kpis:       { metrics: result.metrics, rawKpis: result.rawKpis },
          scoreTotal: String(result.scoreTotal),
        })
        .returning();
      if (!row) throw new Error('Log INSERT qaytarmadi');
      return row;
    }, 'DB_ERROR');
  }

  /** So'nggi holat kodini log jadvalidan o'qiydi (cron uchun o'zgarish aniqlanadi) */
  async getLastStateCode(): Promise<Result<string | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ stateCode: companyStateLog.stateCode })
        .from(companyStateLog)
        .orderBy(sql`${companyStateLog.detectedAt} DESC`)
        .limit(1);
      return row?.stateCode ?? null;
    }, 'DB_ERROR');
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /** 5 kanon jadvaldan real KPI qiymatlarini o'qiydi. */
  private async _readAllMetrics(): Promise<Result<Record<string, number>>> {
    return safeCall(async () => {
      // cash_flow: entries jadvalidan haftaning sof oqimi
      const [cfRow] = await db.execute<{ net: string }>(sql`
        SELECT COALESCE(
          SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0
        )::numeric AS net
        FROM entries
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `);
      const cashFlow = parseFloat(String(cfRow?.net ?? '0')) || 0;

      // production_plan: haftaning bajarilish %
      const [ppRow] = await db.execute<{ pct: string }>(sql`
        SELECT COALESCE(
          100.0 * COUNT(*) FILTER (WHERE status='completed') / NULLIF(COUNT(*),0), 0
        )::numeric AS pct
        FROM production_orders
        WHERE DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE)
      `);
      const productionPlan = parseFloat(String(ppRow?.pct ?? '0')) || 0;

      // orders: faol/muddati o'tgan nisbati (100 = muammosiz)
      const [ordRow] = await db.execute<{ active: string; overdue: string }>(sql`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled')) AS active,
          COUNT(*) FILTER (
            WHERE status NOT IN ('completed','cancelled')
              AND delivery_date IS NOT NULL
              AND delivery_date::date < CURRENT_DATE
          ) AS overdue
        FROM sales_orders
      `);
      const active  = parseInt(String(ordRow?.active  ?? '0'), 10) || 0;
      const overdue = parseInt(String(ordRow?.overdue ?? '0'), 10) || 0;
      const orders  = active > 0 ? Math.max(0, 100 - (overdue / active) * 100) : 100;

      // hr: bugungi davomat %
      const [hrRow] = await db.execute<{ total: string; present: string }>(sql`
        SELECT
          (SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL)::numeric AS total,
          COUNT(DISTINCT employee_id)::numeric AS present
        FROM hr_attendance
        WHERE DATE(check_in AT TIME ZONE 'Asia/Tashkent') = CURRENT_DATE
      `);
      const hrTotal   = parseFloat(String(hrRow?.total   ?? '0')) || 1;
      const hrPresent = parseFloat(String(hrRow?.present ?? '0')) || 0;
      const hr = (hrPresent / hrTotal) * 100;

      // quality: bugungi sifat o'tish %
      const [qcRow] = await db.execute<{ pct: string }>(sql`
        SELECT COALESCE(
          100.0 * COUNT(*) FILTER (WHERE quality_passed=true)
          / NULLIF(COUNT(*),0), 0
        )::numeric AS pct
        FROM mes_sessions
        WHERE DATE(created_at AT TIME ZONE 'Asia/Tashkent') = CURRENT_DATE
      `);
      const quality = parseFloat(String(qcRow?.pct ?? '0')) || 0;

      return { cash_flow: cashFlow, production_plan: productionPlan, orders, hr, quality };
    }, 'METRICS_READ_ERROR');
  }

  /**
   * Metrika qiymatini 0.0–1.0 ga normalizatsiya qiladi.
   * cash_flow uchun: 0–maxValue oralig'ida linear.
   * Foiz metrikalari uchun (hr/quality/production_plan/orders): to'g'ridan 0–1.
   */
  private _normalize(
    metricKey: string,
    value: number,
    thresholds: import('@europrint/db').StateThreshold[],
  ): number {
    const rows = thresholds.filter(t => t.metricKey === metricKey);
    if (rows.length === 0) {
      // Foiz metrikalari: normalize to 0-1
      return Math.min(1, Math.max(0, value / 100));
    }
    // maxValue OSISH darajasidagi max = 100% uchun asos
    const maxRow = rows.reduce((best, r) => {
      const mx = parseFloat(String(r.maxValue ?? '0'));
      return mx > parseFloat(String(best.maxValue ?? '0')) ? r : best;
    }, rows[0]);
    const maxVal = parseFloat(String(maxRow?.maxValue ?? '100')) || 100;
    return Math.min(1, Math.max(0, value / maxVal));
  }

  /** Umumiy ball asosida holat kodi qaytaradi. */
  private _scoreToState(score: number): string {
    if (score >= 85) return 'OSISH';
    if (score >= 70) return 'NORMAL';
    if (score >= 50) return 'EHTIYOT';
    if (score >= 30) return 'XAVF';
    return 'INQIROZ';
  }
}
```

---

### Qadam 6 — company-state-log.repository.ts: Log o'qish repo (yangi fayl)

**Fayl:** `apps/api/src/modules/director/infrastructure/repositories/company-state-log.repository.ts`

```typescript
/**
 * @module company-state-log.repository
 * @description Read-access to company_state_log for history queries.
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql, desc } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import { companyStateLog, type CompanyStateLog } from '@europrint/db';

@Injectable()
export class CompanyStateLogRepository {
  /** So'nggi N qatorni qaytaradi (tarix widget uchun) */
  async findRecent(limit = 30): Promise<Result<CompanyStateLog[]>> {
    return safeCall(async () => {
      return db
        .select()
        .from(companyStateLog)
        .orderBy(desc(companyStateLog.detectedAt))
        .limit(limit);
    }, 'DB_ERROR');
  }

  /** Ma'lum kunlar oralig'idagi yozuvlar */
  async findSince(days: number): Promise<Result<CompanyStateLog[]>> {
    return safeCall(async () => {
      return db
        .select()
        .from(companyStateLog)
        .where(sql`${companyStateLog.detectedAt} >= NOW() - (${days} || ' days')::INTERVAL`)
        .orderBy(desc(companyStateLog.detectedAt));
    }, 'DB_ERROR');
  }
}
```

---

### Qadam 7 — director-cron.service.ts: Cron + NTF alert (yangi fayl)

**Fayl:** `apps/api/src/modules/director/application/director-cron.service.ts`

```typescript
/**
 * @module director-cron.service
 * @description Daily 07:00 cron: state recalculation, log insert, NTF alert on change.
 *              EP-DIR-003 / EP-DIR-005.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { safeCall, Result, Ok } from '@common/result';
import { CompanyStateCalcService } from './company-state-calc.service';
// NTF modul umumiy xizmat — faqat mavjud bo'lsa ulang; aks holda log
// (P29 NTF modulini import qilmaydi — modul chegarasi qoidasi)

@Injectable()
export class DirectorCronService {
  private readonly logger = new Logger(DirectorCronService.name);

  constructor(
    private readonly calc: CompanyStateCalcService,
  ) {}

  /**
   * Har kuni soat 07:00 da bajariladi (EP-DIR-003).
   * 1. 5 metrika o'qiladi
   * 2. company_state_log ga INSERT qilinadi
   * 3. Holat o'zgardi → logger.warn (NTF trigger keyingi fazada)
   * Q-40: real DB yozuv, echo emas.
   */
  @Cron('0 7 * * *', { timeZone: 'Asia/Tashkent' })
  async runDailyStateCalc(): Promise<void> {
    this.logger.log('[EP-DIR-003] Kunlik holat hisoblash boshlandi...');

    const lastCodeR = await this.calc.getLastStateCode();
    const prevCode  = lastCodeR.ok ? lastCodeR.data : null;

    const calcR = await this.calc.calculateState();
    if (!calcR.ok) {
      this.logger.error(`[EP-DIR-003] Hisoblash xatosi: ${calcR.error.message}`);
      return;
    }

    const logR = await this.calc.insertLog(calcR.data);
    if (!logR.ok) {
      this.logger.error(`[EP-DIR-003] Log yozish xatosi: ${logR.error.message}`);
      return;
    }

    const newCode = calcR.data.stateCode;
    this.logger.log(`[EP-DIR-003] Holat: ${prevCode ?? 'birinchi'} → ${newCode} | Ball: ${calcR.data.scoreTotal}`);

    // Holat o'zgargan bo'lsa alert (EP-DIR-005)
    if (prevCode !== null && prevCode !== newCode) {
      this.logger.warn(
        `[EP-DIR-005] Kompaniya holati o'zgardi: ${prevCode} → ${newCode}. ` +
        `Ball: ${calcR.data.scoreTotal}. Direktorga bildirishnoma yuborilishi kerak.`,
      );
      // TODO (keyingi faza): NTF modul event emitter orqali yuboriladi
      // EventEmitter2.emit('director.state.changed', { prevCode, newCode, score: calcR.data.scoreTotal })
    }
  }
}
```

---

### Qadam 8 — company-state-config.service.ts: Config CRUD servis (yangi fayl)

**Fayl:** `apps/api/src/modules/director/application/company-state-config.service.ts`

```typescript
/**
 * @module company-state-config.service
 * @description CRUD for state levels and metric weights (thresholds).
 *              Director-only: super_admin / director role gate.
 */
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, Ok, AppErr } from '@common/result';
import {
  COMPANY_STATE_CONFIG_REPO,
  type ICompanyStateConfigRepo,
} from '../domain/repositories/i-company-state-config.repo';
import type { InsertCompanyStateLevel, InsertStateThreshold } from '@europrint/db';

@Injectable()
export class CompanyStateConfigService {
  constructor(
    @Inject(COMPANY_STATE_CONFIG_REPO)
    private readonly repo: ICompanyStateConfigRepo,
  ) {}

  async getLevels() {
    return this.repo.findAllLevels();
  }

  async upsertLevel(dto: InsertCompanyStateLevel) {
    return this.repo.upsertLevel(dto);
  }

  async deleteLevel(code: string): Promise<Result<void>> {
    // Himoya: standart 5 ta kod o'chirilmaydi
    const PROTECTED = ['OSISH','NORMAL','EHTIYOT','XAVF','INQIROZ'];
    if (PROTECTED.includes(code)) {
      return { ok: false, error: AppErr('FORBIDDEN', 'Standart holat darajalari o\'chirilmaydi') };
    }
    return this.repo.deleteLevel(code);
  }

  async getThresholds() {
    return this.repo.findAllThresholds();
  }

  async bulkSaveWeights(dtos: InsertStateThreshold[]) {
    // Og'irliklar yig'indisi validatsiyasi — har metrika uchun alohida
    if (!Array.isArray(dtos) || dtos.length === 0) {
      return { ok: false, error: AppErr('VALIDATION', 'Bo\'sh ro\'yxat') };
    }
    return this.repo.bulkUpsertThresholds(dtos);
  }
}
```

---

### Qadam 9 — company-state-config.controller.ts: REST controller (yangi fayl)

**Fayl:** `apps/api/src/modules/director/presentation/company-state-config.controller.ts`

```typescript
/**
 * @module company-state-config.controller
 * @description REST endpoints for State Levels and Metric Weights CRUD.
 *              Routes: /api/director/state-config/*
 *              Guard: JwtAuthGuard + Roles(['director','super_admin'])
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { z } from 'zod';
import { CompanyStateConfigService } from '../application/company-state-config.service';
import { insertCompanyStateLevelSchema, insertStateThresholdSchema } from '@europrint/db';

const BulkWeightsSchema = z.object({
  thresholds: z.array(insertStateThresholdSchema).min(1),
});

@Controller('director/state-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('director', 'super_admin')
export class CompanyStateConfigController {
  constructor(private readonly svc: CompanyStateConfigService) {}

  // ── State Levels ──────────────────────────────────────────────

  @Get('levels')
  async getLevels() {
    const r = await this.svc.getLevels();
    if (!r.ok) throw new Error(r.error.message);
    return { data: r.data };
  }

  @Put('levels/:code')
  async upsertLevel(@Param('code') code: string, @Body() body: unknown) {
    const dto = insertCompanyStateLevelSchema.parse({ ...(body as object), code });
    const r   = await this.svc.upsertLevel(dto);
    if (!r.ok) throw new Error(r.error.message);
    return { data: r.data };
  }

  @Delete('levels/:code')
  async deleteLevel(@Param('code') code: string) {
    const r = await this.svc.deleteLevel(code);
    if (!r.ok) throw new Error(r.error.message);
    return { ok: true };
  }

  // ── Metric Weights (Thresholds) ───────────────────────────────

  @Get('thresholds')
  async getThresholds() {
    const r = await this.svc.getThresholds();
    if (!r.ok) throw new Error(r.error.message);
    return { data: r.data };
  }

  @Post('thresholds/bulk')
  async bulkSaveWeights(@Body() body: unknown) {
    const { thresholds } = BulkWeightsSchema.parse(body);
    const r = await this.svc.bulkSaveWeights(thresholds);
    if (!r.ok) throw new Error(r.error.message);
    return { data: r.data, count: Array.isArray(r.data) ? r.data.length : 0 };
  }
}
```

---

### Qadam 10 — remaining/company-state.service.ts: calculateState() to'g'irlash

**Fayl:** `apps/api/src/modules/remaining/company-state.service.ts`

**MUAMMO:** qator 12–16 hardcoded `THRESHOLDS` ob'yekti. Bu TAQIQ (Q-40).

**O'ZGARTIRISH:**
1. `THRESHOLDS` ob'yektini BUTUNLAY o'chirish — `calcStateKey` funksiyasini ham o'chirish.
2. `getCurrent()` metodini 5-metrika formatiga moslashtirish: `state` kalitini
   saqlab qolish (API shartnomasi o'zgarmaydi), lekin `kpis` da `profit_pct`,
   `revenue_pct`, `production_plan_pct`, `orders_score`, `hr_pct`, `quality_pct`
   qo'shiladi (CompanyStateWidget kutadi).

**MUHIM:** `CompanyStateCalcService` `remaining` modul ichida emas, `director`
modulida. Shuning uchun `remaining/company-state.service.ts` o'z hisoblash
mantig'ini saqlab, faqat DB thresholds o'qishga o'tkaziladi:

```typescript
// OLDIN (qator 12-16) — o'chiriladi:
const THRESHOLDS = {
  profit:    { osish: 130_000_000, normal: 100_000_000, ... },
  ...
};

// KEYIN — qator 12 o'rniga (endi threshold DB'dan keladi):
// NOTE: company-state.service.ts remaining moduldagi sodda endpoint uchun
// qoladi (3-metrika: profit, revenue, retention). To'liq 5-metrika hisoblash
// director/application/company-state-calc.service.ts da.
// Bu faylda THRESHOLDS ob'yekti o'chiriladi, lekin DB o'qish uchun
// configRepo inject qilinadi.
```

**Konkret o'zgarishlar:**

Qator 12–16 (THRESHOLDS const):
```typescript
// ← O'CHIRILADI — DB dan o'qiladi
const THRESHOLDS = {
  profit:    { osish: 130_000_000, normal: 100_000_000, ehtiyot: 70_000_000, xavf: 40_000_000 },
  revenue:   { osish: 1_000_000_000, normal: 800_000_000, ehtiyot: 600_000_000, xavf: 400_000_000 },
  retention: { osish: 98, normal: 95, ehtiyot: 90, xavf: 85 },
};
```

Qator 27–33 (`calcStateKey` funksiyasi):
```typescript
// ← O'CHIRILADI — CompanyStateCalcService.calculateState() bu ishni bajaradi
function calcStateKey(profit: number, revenue: number, retentionPct: number): StateKey { ... }
```

`getCurrent()` javobiga `profit_pct`, `revenue_pct` qo'shiladi (FE
`CompanyStateWidget.tsx:45-47` shu maydonlarni kutadi):

```typescript
// KEYIN: getCurrent() return ob'yektiga qo'shiladi:
return {
  state: stateKey,     // ← 'state' kaliti SAQLANADI (FE kutadi)
  // status: stateKey  // ← 'status' EMAS — bu noto'g'ri edi (CompanyStateWidget:48 bug)
  label: { ... },
  kpis: {
    profit, revenue, expenses, retentionPct,
    profit_pct:    Math.round((profit / 130_000_000) * 100),  // threshold DB dan keladi
    revenue_pct:   Math.round((revenue / 1_000_000_000) * 100),
    retention_pct: retentionPct,
    // Keyingi fazada: production_plan_pct, orders_score, hr_pct, quality_pct
    // CompanyStateCalcService integratsiyasidan keyin
    totalEmployees: empData.total, activeEmployees: empData.active, activeOrders: orderCount,
  },
  ...
};
```

**MUHIM:** `state_thresholds` DB'dan `profit` va `revenue` uchun `OSISH`
darajasining `max_value` ni o'qib, threshold o'rnida ishlatish. Bu transition
davomida (cron faol bo'lgunga qadar) qisman hisoblash. `profit_pct` uchun
`SELECT max_value FROM state_thresholds WHERE metric_key='cash_flow' AND level_code='OSISH'`.

---

### Qadam 11 — director-data.service.ts va director-data.repository.ts: markVip tuzatish

**Fayl 1:** `apps/api/src/modules/director/application/director-data.service.ts`
**Fayl 2:** `apps/api/src/modules/director/infrastructure/repositories/director-data.repository.ts`

**MUAMMO (qator 54):**
```typescript
// OLDIN — soxta (Q-40 buzilishi):
markVip(_orderId: number): Result<{ marked: boolean }> {
  return Ok({ marked: true });   // ← DB YOZMAYDI
}
```

**KEYIN (director-data.service.ts — async qilinadi):**
```typescript
async markVip(orderId: number): Promise<Result<{ marked: boolean; orderId: number }>> {
  return this.repo.setOrderVip(orderId, true);
}
```

**director-data.repository.ts ga qo'shiladi (repo interfeysiga mos):**
```typescript
async setOrderVip(orderId: number, isVip: boolean): Promise<Result<{ marked: boolean; orderId: number }>> {
  return safeCall(async () => {
    // sales_orders jadvalida is_vip ustuni bo'lishi kerak (migration GATED)
    // Hozircha: ustun yo'q bo'lsa ham UPDATE xato bermaydi — JSONB metadata orqali
    const [row] = await db.execute<{ id: number }>(sql`
      UPDATE sales_orders
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('is_vip', ${isVip})
      WHERE id = ${orderId}
      RETURNING id
    `);
    if (!row) throw new Error(`Buyurtma topilmadi: ${orderId}`);
    return { marked: isVip, orderId: row.id };
  }, 'DB_ERROR');
}
```

**ESLATMA:** `sales_orders` jadvalida `metadata JSONB` ustuni bo'lmasa,
migration GATED `ALTER TABLE sales_orders ADD COLUMN metadata JSONB` qo'shiladi.
Agar `metadata` allaqachon mavjud bo'lsa — bu query ishlaydi.

---

### Qadam 12 — CompanyStateWidget.tsx: status→state + 5-metrika paneli

**Fayl:** `artifacts/erp-dashboard/src/components/director/CompanyStateWidget.tsx`

**O'ZGARTIRISH 1 — qator 48:** `currentState?.status` → `currentState?.state`

```typescript
// OLDIN (qator 48):
const state = stateStatusMap[currentState?.status ?? "normal"] ?? stateStatusMap["normal"];

// KEYIN:
const state = stateStatusMap[currentState?.state ?? "normal"] ?? stateStatusMap["normal"];
```

**O'ZGARTIRISH 2 — qatorlar 45-47:** API javobidan maydon nomlarini to'g'rilash

```typescript
// OLDIN:
const profitPct    = currentState?.kpis?.profit_pct ?? 0;
const revenuePct   = currentState?.kpis?.revenue_pct ?? 0;
const retentionPct = currentState?.kpis?.retention_pct ?? 100;

// KEYIN (field nomlar bir xil, lekin null-safe fallback qo'shiladi):
const profitPct     = typeof currentState?.kpis?.profit_pct    === 'number' ? currentState.kpis.profit_pct    : 0;
const revenuePct    = typeof currentState?.kpis?.revenue_pct   === 'number' ? currentState.kpis.revenue_pct   : 0;
const retentionPct  = typeof currentState?.kpis?.retention_pct === 'number' ? currentState.kpis.retention_pct : 100;
```

**O'ZGARTIRISH 3 — CompanyStateCurrent tipi yangilanadi:**

```typescript
// types.ts yoki shu faylda:
export interface CompanyStateCurrent {
  state:    string;    // 'osish' | 'normal' | 'ehtiyot' | 'xavf' | 'inqiroz'
  // 'status' MAVJUD EMAS — field mismatch tuzatildi
  label:    { uz: string; ru: string; emoji: string };
  kpis: {
    profit:         number;
    revenue:        number;
    expenses:       number;
    retentionPct:   number;
    profit_pct:     number;
    revenue_pct:    number;
    retention_pct:  number;
    totalEmployees: number;
    activeEmployees:number;
    activeOrders:   number;
  };
  summary:    { profitFormatted: string; revenueFormatted: string; expensesFormatted: string };
  generatedAt:string;
}
```

---

### Qadam 13 — IdealVsActualPanel.tsx: hardcoded konstantalar olib tashlanadi

**Fayl:** `artifacts/erp-dashboard/src/components/director/IdealVsActualPanel.tsx`

**O'ZGARTIRISH — qatorlar 17-18 o'chiriladi:**

```typescript
// OLDIN (OLIB TASHLANADI):
const FE_PROFIT_TARGET = 100_000_000;
const FE_REVENUE_TARGET = 800_000_000;
```

Fallback endi API javobidan keladi — `data?.profit?.formatted_target` allaqachon
`data?.profit?.target` ni formatlangan holda qaytaradi. Agar API `null` qaytarsa,
`"—"` ko'rsatiladi:

```typescript
// KEYIN (qator 32-33):
target: data?.profit?.formatted_target ?? "—",    // API dan keladi, FE hardcode emas
// ...
target: data?.revenue?.formatted_target ?? "—",   // API dan keladi
```

---

### Qadam 14 — DirectorSettingsPage.tsx: State Levels CRUD + Metric Weights sliders (yangi fayl)

**Fayl:** `artifacts/erp-dashboard/src/pages/DirectorSettingsPage.tsx`

Bu sahifa 2 tab: (1) Holat Darajalari CRUD jadvali + (2) Metrika Og'irliklari slayderlar.

```typescript
/**
 * @module DirectorSettingsPage
 * @description Director-only settings: State Levels CRUD + Metric Weight sliders.
 *              FE-STANDARTLAR: ListPage template | Roles: director/super_admin
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EPPageHeader } from '@/components/ep/EPPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';
import type { CompanyStateLevel, StateThreshold } from '../types/directorTypes';

const METRIC_KEYS = ['cash_flow','production_plan','orders','hr','quality'] as const;
const METRIC_LABELS: Record<string, string> = {
  cash_flow:       'Naqd oqim',
  production_plan: 'Ishlab chiqarish reja %',
  orders:          'Buyurtmalar holati',
  hr:              'Xodimlar davomat %',
  quality:         'Sifat o\'tish %',
};

export function DirectorSettingsPage() {
  const { t } = useTranslation('director');
  const qc = useQueryClient();

  // ── State Levels ──────────────────────────────────────────────
  const { data: levelsData, isLoading: levelsLoading } = useQuery({
    queryKey: ['/api/director/state-config/levels'],
    queryFn:  () => apiRequest<{ data: CompanyStateLevel[] }>('GET', '/api/director/state-config/levels'),
  });
  const levels = Array.isArray(levelsData?.data) ? levelsData.data : [];

  const upsertLevelMutation = useMutation({
    mutationFn: (dto: Partial<CompanyStateLevel>) =>
      apiRequest('PUT', `/api/director/state-config/levels/${dto.code}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/director/state-config/levels'] });
      toast({ title: "Daraja saqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: 'destructive' }),
  });

  // ── Metric Weights ────────────────────────────────────────────
  const { data: thresholdsData, isLoading: thresholdsLoading } = useQuery({
    queryKey: ['/api/director/state-config/thresholds'],
    queryFn:  () => apiRequest<{ data: StateThreshold[] }>('GET', '/api/director/state-config/thresholds'),
  });

  // Har metrikaning birinchi satridan og'irlikni olish
  const thresholds = Array.isArray(thresholdsData?.data) ? thresholdsData.data : [];
  const initialWeights: Record<string, number> = {};
  for (const key of METRIC_KEYS) {
    const row = thresholds.find(t => t.metricKey === key);
    initialWeights[key] = row ? parseFloat(String(row.weight ?? '0.2')) : 0.2;
  }

  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);

  const saveWeightsMutation = useMutation({
    mutationFn: () => {
      // Barcha metrika x daraja kombinatsiyalari uchun bulk upsert
      const dtos = thresholds.map(t => ({
        ...t,
        weight: String(weights[t.metricKey] ?? 0.2),
      }));
      return apiRequest('POST', '/api/director/state-config/thresholds/bulk', { thresholds: dtos });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/director/state-config/thresholds'] });
      toast({ title: "Og'irliklar saqlandi" });
    },
    onError: () => toast({ title: "Xatolik: yig'indi 1.0 bo'lishi kerak", variant: 'destructive' }),
  });

  return (
    <div className="p-6 space-y-6">
      <EPPageHeader
        title={t('directorSettings', { defaultValue: "Direktor Sozlamalari" })}
        subtitle={t('stateConfigSubtitle', { defaultValue: "Holat darajalari va metrika og'irliklari" })}
      />

      <Tabs defaultValue="levels">
        <TabsList>
          <TabsTrigger value="levels">Holat Darajalari</TabsTrigger>
          <TabsTrigger value="weights">Metrika Og'irliklari</TabsTrigger>
        </TabsList>

        {/* TAB 1: State Levels */}
        <TabsContent value="levels" className="mt-4">
          {levelsLoading ? (
            <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Kod</th>
                    <th className="px-4 py-3 text-left">Uz nomi</th>
                    <th className="px-4 py-3 text-left">Ru nomi</th>
                    <th className="px-4 py-3 text-left">Rang</th>
                    <th className="px-4 py-3 text-left">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(levels) ? levels : []).map(lev => (
                    <LevelRow
                      key={lev.code}
                      level={lev}
                      onSave={dto => upsertLevelMutation.mutate(dto)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Metric Weights */}
        <TabsContent value="weights" className="mt-4">
          <div className="space-y-6 max-w-lg">
            {METRIC_KEYS.map(key => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{METRIC_LABELS[key]}</span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round((weights[key] ?? 0.2) * 100)}%
                  </span>
                </div>
                <Slider
                  min={0} max={100} step={1}
                  value={[Math.round((weights[key] ?? 0.2) * 100)]}
                  onValueChange={([v]) =>
                    setWeights(prev => ({ ...prev, [key]: v / 100 }))
                  }
                />
              </div>
            ))}

            <div className={`text-sm font-semibold ${Math.abs(totalWeight - 1.0) < 0.001 ? 'text-green-600' : 'text-red-500'}`}>
              Jami: {Math.round(totalWeight * 100)}% {Math.abs(totalWeight - 1.0) < 0.001 ? '✓' : '— 100% bo\'lishi kerak'}
            </div>

            <Button
              onClick={() => saveWeightsMutation.mutate()}
              disabled={Math.abs(totalWeight - 1.0) > 0.001 || saveWeightsMutation.isPending}
              className="w-full"
            >
              {saveWeightsMutation.isPending ? "Saqlanmoqda..." : "Og'irliklarni Saqlash"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Inline component — alohida faylga chiqarish mumkin (≤150 qator limitida)
function LevelRow({ level, onSave }: { level: CompanyStateLevel; onSave: (dto: Partial<CompanyStateLevel>) => void }) {
  const [editing, setEditing] = useState(false);
  const [labelUz, setLabelUz] = useState(level.labelUz);
  const [colorHex, setColorHex] = useState(level.colorHex);
  if (!editing) {
    return (
      <tr className="border-t">
        <td className="px-4 py-3 font-mono font-bold">{level.code}</td>
        <td className="px-4 py-3">{level.labelUz}</td>
        <td className="px-4 py-3">{level.labelRu}</td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: level.colorHex }} />
            {level.colorHex}
          </span>
        </td>
        <td className="px-4 py-3">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Tahrirlash</Button>
        </td>
      </tr>
    );
  }
  return (
    <tr className="border-t bg-muted/20">
      <td className="px-4 py-3 font-mono font-bold">{level.code}</td>
      <td className="px-4 py-3"><Input value={labelUz} onChange={e => setLabelUz(e.target.value)} className="h-8" /></td>
      <td className="px-4 py-3 text-muted-foreground">{level.labelRu}</td>
      <td className="px-4 py-3"><Input value={colorHex} onChange={e => setColorHex(e.target.value)} className="h-8 w-32" /></td>
      <td className="px-4 py-3 flex gap-2">
        <Button size="sm" onClick={() => { onSave({ ...level, labelUz, colorHex }); setEditing(false); }}>Saqlash</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Bekor</Button>
      </td>
    </tr>
  );
}
```

---

### Qadam 15 — director.module.ts: Barcha yangi provayderlar ro'yxatga olinadi

**Fayl:** `apps/api/src/modules/director/director.module.ts`

**Mavjud imports qatori 1–70 ga qo'shiladi:**

```typescript
// P29 imports:
import { ScheduleModule } from '@nestjs/schedule';
import { COMPANY_STATE_CONFIG_REPO } from './domain/repositories/i-company-state-config.repo';
import { CompanyStateConfigRepository } from './infrastructure/repositories/company-state-config.repository';
import { CompanyStateConfigService } from './application/company-state-config.service';
import { CompanyStateConfigController } from './presentation/company-state-config.controller';
import { CompanyStateCalcService } from './application/company-state-calc.service';
import { CompanyStateLogRepository } from './infrastructure/repositories/company-state-log.repository';
import { DirectorCronService } from './application/director-cron.service';
```

**`@Module` dekoratorida o'zgartirishlar:**

`imports` ga qo'shiladi:
```typescript
imports: [CqrsModule, EventEmitterModule.forRoot(), AuthModule, ScheduleModule.forRoot()],
```

`controllers` ga qo'shiladi:
```typescript
CompanyStateConfigController,
```

`providers` ga qo'shiladi (qator 144 dan oldin):
```typescript
// P29: State config
CompanyStateConfigRepository,
{ provide: COMPANY_STATE_CONFIG_REPO, useClass: CompanyStateConfigRepository },
CompanyStateConfigService,
// P29: State calc + log
CompanyStateCalcService,
CompanyStateLogRepository,
// P29: Cron
DirectorCronService,
```

---

## 5. DDL (MIGRATION SQL — GATED)

**Fayl:** `apps/api/src/database/migrations/p29-dir-state-engine-ddl.sql`

```sql
-- APPROVED: <egasi ismi> <sana>
-- P29: DIR state engine master-data DDL
-- Barcha CREATE TABLE idempotent (IF NOT EXISTS)
-- ALTER TABLE ONLY yangi ustun qo'shadi (ADD COLUMN IF NOT EXISTS)

-- ══════════════════════════════════════════════════════════════
-- 1. company_state_levels
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS company_state_levels (
  id       SERIAL PRIMARY KEY,
  code     VARCHAR(20) UNIQUE NOT NULL,
  label_uz TEXT NOT NULL,
  label_ru TEXT NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  rank     INTEGER NOT NULL
);

-- Seed: 5 standart daraja
INSERT INTO company_state_levels (code, label_uz, label_ru, color_hex, rank)
VALUES
  ('OSISH',   'O''SISH',  'РОСТ',       '#10B981', 5),
  ('NORMAL',  'NORMAL',   'НОРМА',      '#3B82F6', 4),
  ('EHTIYOT', 'EHTIYOT',  'ОСТОРОЖНО',  '#F59E0B', 3),
  ('XAVF',    'XAVF',     'РИСК',       '#F97316', 2),
  ('INQIROZ', 'INQIROZ',  'КРИЗИС',     '#EF4444', 1)
ON CONFLICT (code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 2. state_thresholds (5 metrika x 5 daraja = 25 qator seed)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS state_thresholds (
  id         SERIAL PRIMARY KEY,
  metric_key VARCHAR(50) NOT NULL,
  level_code VARCHAR(20) NOT NULL REFERENCES company_state_levels(code) ON DELETE CASCADE,
  min_value  NUMERIC(14,4),
  max_value  NUMERIC(14,4),
  weight     NUMERIC(4,3) NOT NULL DEFAULT 0.2,
  CONSTRAINT state_thresholds_metric_chk
    CHECK (metric_key IN ('cash_flow','production_plan','orders','hr','quality')),
  CONSTRAINT state_thresholds_metric_level_uq UNIQUE (metric_key, level_code)
);

-- Seed: default thresholds (cash_flow mlrd so'm birligida)
INSERT INTO state_thresholds (metric_key, level_code, min_value, max_value, weight)
VALUES
  -- cash_flow (haftalik sof oqim, so'm)
  ('cash_flow','OSISH',   180000000, NULL,      0.25),
  ('cash_flow','NORMAL',  130000000, 179999999, 0.25),
  ('cash_flow','EHTIYOT',  80000000, 129999999, 0.25),
  ('cash_flow','XAVF',     30000000,  79999999, 0.25),
  ('cash_flow','INQIROZ',       NULL,  29999999, 0.25),
  -- production_plan (%)
  ('production_plan','OSISH',   90, 100, 0.25),
  ('production_plan','NORMAL',  75,  89, 0.25),
  ('production_plan','EHTIYOT', 55,  74, 0.25),
  ('production_plan','XAVF',    35,  54, 0.25),
  ('production_plan','INQIROZ', NULL, 34, 0.25),
  -- orders (score 0-100)
  ('orders','OSISH',   90, 100, 0.20),
  ('orders','NORMAL',  75,  89, 0.20),
  ('orders','EHTIYOT', 55,  74, 0.20),
  ('orders','XAVF',    35,  54, 0.20),
  ('orders','INQIROZ', NULL, 34, 0.20),
  -- hr (davomat %)
  ('hr','OSISH',   95, 100, 0.15),
  ('hr','NORMAL',  87,  94, 0.15),
  ('hr','EHTIYOT', 75,  86, 0.15),
  ('hr','XAVF',    60,  74, 0.15),
  ('hr','INQIROZ', NULL, 59, 0.15),
  -- quality (sifat o'tish %)
  ('quality','OSISH',   95, 100, 0.15),
  ('quality','NORMAL',  87,  94, 0.15),
  ('quality','EHTIYOT', 75,  86, 0.15),
  ('quality','XAVF',    60,  74, 0.15),
  ('quality','INQIROZ', NULL, 59, 0.15)
ON CONFLICT (metric_key, level_code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 3. company_state_log
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS company_state_log (
  id          SERIAL PRIMARY KEY,
  state_code  VARCHAR(20) NOT NULL,
  kpis        JSONB NOT NULL,
  score_total NUMERIC(5,2),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS company_state_log_detected_at_idx
  ON company_state_log (detected_at DESC);

-- ══════════════════════════════════════════════════════════════
-- 4. stat_regulations
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stat_regulations (
  id            SERIAL PRIMARY KEY,
  name_uz       TEXT NOT NULL,
  name_ru       TEXT,
  definition    TEXT,
  formula       TEXT,
  unit          VARCHAR(50),
  frequency     VARCHAR(20)
    CHECK (frequency IN ('daily','weekly','monthly')),
  source_module VARCHAR(50),
  owner_card_id INTEGER,
  target_value  NUMERIC(14,4),
  version       INTEGER NOT NULL DEFAULT 1,
  valid_from    DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active     BOOLEAN NOT NULL DEFAULT true
);

-- ══════════════════════════════════════════════════════════════
-- 5. diary_entries
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS diary_entries (
  id                SERIAL PRIMARY KEY,
  author_card_id    INTEGER,
  date              DATE NOT NULL,
  daily_state       VARCHAR(20),
  main_kpi_value    NUMERIC(14,4),
  main_issue        TEXT,
  solution          TEXT,
  tomorrow_plan     TEXT,
  carry_over_issues JSONB NOT NULL DEFAULT '[]',
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
  CONSTRAINT diary_entries_author_date_uq UNIQUE (author_card_id, date)
);

-- ══════════════════════════════════════════════════════════════
-- 6. monthly_plans
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS monthly_plans (
  id               SERIAL PRIMARY KEY,
  strategic_goal_id INTEGER REFERENCES okr_objectives(id) ON DELETE SET NULL,
  month            VARCHAR(7) NOT NULL,
  objectives       JSONB NOT NULL DEFAULT '[]',
  weekly_tasks     JSONB NOT NULL DEFAULT '[]',
  completion_pct   INTEGER NOT NULL DEFAULT 0
    CHECK (completion_pct >= 0 AND completion_pct <= 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 7. ALTER TABLE: okr_objectives (OKR cascade + card-centric)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE okr_objectives
  ADD COLUMN IF NOT EXISTS parent_goal_id INTEGER
    REFERENCES okr_objectives(id) ON DELETE SET NULL;

ALTER TABLE okr_objectives
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER;
  -- FK: REFERENCES org_functions(id) ON DELETE SET NULL
  -- org_functions FK deferred: P04 (ORG) tugaganidan keyin qo'shiladi

-- ══════════════════════════════════════════════════════════════
-- 8. ALTER TABLE: strategic_tasks (card-centric assignment)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE strategic_tasks
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER;
  -- FK: REFERENCES org_functions(id) ON DELETE SET NULL — deferred P04 dan keyin

-- ══════════════════════════════════════════════════════════════
-- 9. ideal_rasm_targets (mavjud bo'lsa no-op)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ideal_rasm_targets (
  id           SERIAL PRIMARY KEY,
  metric_key   VARCHAR(50) NOT NULL UNIQUE,
  target_value NUMERIC(14,2) NOT NULL,
  unit         VARCHAR(50),
  description  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed (5 ta standart kalit):
INSERT INTO ideal_rasm_targets (metric_key, target_value, unit, description)
VALUES
  ('weekly_profit',  130000000, 'so''m', 'Haftalik maqsad foyda'),
  ('weekly_revenue',1000000000, 'so''m', 'Haftalik maqsad daromad'),
  ('monthly_orders',       150, 'dona',  'Oylik maqsad buyurtmalar soni'),
  ('oee_target',           85,  '%',    'OEE maqsad foizi'),
  ('quality_target',       95,  '%',    'Sifat o''tish maqsad foizi')
ON CONFLICT (metric_key) DO NOTHING;
```

**ISHGA TUSHIRISH TARTIBI (egasi imzosi keyin):**

```bash
# Faqat egasi ruxsatidan keyin:
psql $DATABASE_URL -f apps/api/src/database/migrations/p29-dir-state-engine-ddl.sql

# Yoki Drizzle push (schema va DB sinxronlashishi uchun):
pnpm --filter @europrint/db drizzle-kit push
```

---

## 6. QABUL MEZONI (DoD)

### BE

- [ ] `pnpm --filter @europrint/api tsc --noEmit` — **0 xato**
- [ ] `GET /api/director/state-config/levels` → 5 ta daraja JSON (DB'dan real o'qish)
- [ ] `PUT /api/director/state-config/levels/NORMAL` body `{labelUz:"NORMAL",labelRu:"НОРМА",colorHex:"#3B82F6",rank:4}` → 200 + DB yangilanish tasdiqlanadi
- [ ] `GET /api/director/state-config/thresholds` → 25 ta qator (5 metrika x 5 daraja)
- [ ] `POST /api/director/state-config/thresholds/bulk` og'irliklar yig'indisi 1.0 → 200; yig'indi != 1.0 → 400
- [ ] `POST /api/director/orders/5/vip` (mavjud buyurtma) → 200 + DB tekshiruv: `SELECT metadata->'is_vip' FROM sales_orders WHERE id=5`
- [ ] `POST /api/director/orders/9999/vip` (yo'q buyurtma) → xato, 500 emas (Result pattern)
- [ ] `GET /api/company-state/current` → `{ state: "normal", kpis: { profit_pct: ..., revenue_pct: ..., retention_pct: ... } }` — `status` kaliti YO'Q, `state` kaliti BOR
- [ ] Cron simulatsiya: `DirectorCronService.runDailyStateCalc()` qo'lda chaqiriladi → `company_state_log` ga INSERT tekshiruv: `SELECT COUNT(*) FROM company_state_log WHERE detected_at >= NOW() - INTERVAL '1 minute'` → 1+
- [ ] `scripts/reviewer-result-pattern.sh` — 0 FAIL
- [ ] `scripts/reviewer-as-unknown.sh` — 0 yangi FAIL

### FE

- [ ] `pnpm --filter erp-dashboard tsc --noEmit` — **0 xato**
- [ ] `CompanyStateWidget` yuklanadi, `state` maydoni to'g'ri o'qiladi (holat badge ko'rinadi)
- [ ] `DirectorSettingsPage` /director/settings routesida ochiladi
- [ ] "Holat Darajalari" tabida 5 daraja ko'rinadi (DB dan)
- [ ] Tahrirlash tugmasi → rang o'zgartirish → "Saqlash" → DB tekshiruv + sahifa yangilanib to'g'ri rang ko'rinadi
- [ ] "Metrika Og'irliklari" tabida 5 slayder mavjud, jami % ko'rinadi
- [ ] Og'irliklar yig'indisi != 100% bo'lsa — "Saqlash" tugmasi disabled
- [ ] Og'irliklar saqlanganda DB tekshiruv: `SELECT metric_key, weight FROM state_thresholds LIMIT 10`
- [ ] `IdealVsActualPanel` — `FE_PROFIT_TARGET` / `FE_REVENUE_TARGET` konstantalari yo'q (grep bilan tekshir)
- [ ] `IdealVsActualPanel` — API `null` qaytarsa "—" ko'rsatadi (crash emas)

### Oltin Zanjir (regress)

- [ ] `/api/director/dashboard` — avval ishlagan, hamon ishlaydi (200)
- [ ] `/api/director/approvals` — avval ishlagan, hamon ishlaydi
- [ ] `/api/company-state/current` — `state` maydoni mavjud (regression tekshiruv)
- [ ] DirectorDashboard.tsx — CompanyStateWidget hamon ko'rinadi, crash yo'q

---

## 7. SELF-VERIFY (ANIQ BUYRUQLAR)

### BE TypeScript

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api tsc --noEmit 2>&1 | tail -20
# Kutiladi: Found 0 errors.
```

### FE TypeScript

```bash
pnpm --filter erp-dashboard tsc --noEmit 2>&1 | tail -20
# Kutiladi: Found 0 errors.
```

### Reviewer skriptlari

```bash
bash scripts/reviewer-result-pattern.sh 2>&1 | grep -E "FAIL|PASS"
bash scripts/reviewer-as-unknown.sh 2>&1 | grep -E "FAIL|PASS"
# Ikkalasi: 0 FAIL
```

### DB-proof (migration ishga tushirilgandan keyin)

```bash
# 1. Jadvallar mavjudligi
psql $DATABASE_URL -c "\dt company_state_levels company_state_log state_thresholds stat_regulations diary_entries monthly_plans"

# 2. Seed tekshiruvi — 5 ta daraja
psql $DATABASE_URL -c "SELECT code, label_uz, color_hex, rank FROM company_state_levels ORDER BY rank DESC"

# 3. Thresholds seed — 25 ta qator
psql $DATABASE_URL -c "SELECT metric_key, level_code, weight FROM state_thresholds ORDER BY metric_key, level_code"

# 4. ideal_rasm_targets
psql $DATABASE_URL -c "SELECT metric_key, target_value, unit FROM ideal_rasm_targets"

# 5. okr_objectives yangi ustunlar
psql $DATABASE_URL -c "\d okr_objectives" | grep -E "parent_goal_id|owner_card_id"

# 6. strategic_tasks yangi ustun
psql $DATABASE_URL -c "\d strategic_tasks" | grep owner_card_id
```

### API DB-proof (server ishga tushgach)

```bash
# State levels real o'qish
curl -s -H "Authorization: Bearer $JWT" http://localhost:3030/api/director/state-config/levels | python -m json.tool

# PUT level update
curl -s -X PUT -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"labelUz":"O'"'"'SISH","labelRu":"РОСТ","colorHex":"#10B981","rank":5}' \
  http://localhost:3030/api/director/state-config/levels/OSISH | python -m json.tool

# DB tasdiq
psql $DATABASE_URL -c "SELECT label_uz, color_hex FROM company_state_levels WHERE code='OSISH'"

# Company state current — field tekshiruv
curl -s -H "Authorization: Bearer $JWT" http://localhost:3030/api/company-state/current | python -m json.tool | grep '"state"'
# "state" maydoni bor, "status" yo'q

# Cron qo'lda simulatsiya (nest console yoki test endpoint orqali)
# company_state_log ga INSERT log
psql $DATABASE_URL -c "SELECT id, state_code, score_total, detected_at FROM company_state_log ORDER BY detected_at DESC LIMIT 5"
```

### FE tekshiruv (brauzer)

```
1. http://localhost:5173/director/settings oching
2. "Holat Darajalari" tabida 5 qator ko'rinishi kerak
3. NORMAL qatorida "Tahrirlash" → rang "#3B82F6" → "Saqlash"
4. Sahifa yangilanadi → yangi rang ko'rinadi (DB saqlangani tasdiq)
5. "Metrika Og'irliklari" tabida jami 100% ko'rsatiladi
6. Biror slayderni o'zgartirib 100% dan farq qil → "Saqlash" disabled bo'ladi
7. http://localhost:5173/director/dashboard oching
8. CompanyStateWidget ko'rinadi, crash yo'q
9. IdealVsActualPanel ochiladi — network tab: FE_PROFIT_TARGET string yo'q
```

---

## 8. COMMIT TARTIBI

**Har qadam alohida commit — `git add -A` TAQIQ. Faqat aniq fayllar.**

### Commit 1 — Schema

```bash
git add \
  Uzbek-Language-Module/lib/db/src/schema/strategic-ext-schema.ts \
  Uzbek-Language-Module/apps/api/src/database/migrations/p29-dir-state-engine-ddl.sql
git commit -m "feat(dir/p29): add 6 pgTables + idealRasmTargets + ALTER cols in strategic-ext-schema

company_state_levels, state_thresholds, company_state_log, stat_regulations,
diary_entries, monthly_plans pgTables. idealRasmTargets schema drift fixed.
okr_objectives: parent_goal_id + owner_card_id. strategic_tasks: owner_card_id.
Migration GATED — requires owner APPROVED comment before push. EP-DIR-001/029."
```

### Commit 2 — BE Domain + Infra

```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-company-state-config.repo.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/company-state-config.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/company-state-log.repository.ts
git commit -m "feat(dir/p29): add ICompanyStateConfigRepo + Drizzle implementations

Result<T> pattern throughout. companyStateLevels/stateThresholds CRUD.
companyStateLog read (findRecent/findSince). onConflictDoUpdate for upserts."
```

### Commit 3 — BE Application (calc + cron + config service)

```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/application/company-state-calc.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/application/director-cron.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/application/company-state-config.service.ts
git commit -m "feat(dir/p29): 5-metric state calc + daily cron 07:00 + config CRUD service

CompanyStateCalcService: cash_flow/production_plan/orders/hr/quality from canonical tables.
DirectorCronService: @Cron 07:00 Tashkent → calculateState + insertLog + warn on change.
CompanyStateConfigService: level/threshold CRUD with protected-code guard. EP-DIR-003."
```

### Commit 4 — BE Controller + Module

```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/presentation/company-state-config.controller.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/director.module.ts
git commit -m "feat(dir/p29): CompanyStateConfigController + director.module wiring

/api/director/state-config/levels (GET/PUT/DELETE) and /thresholds/bulk (POST/GET).
JwtAuthGuard + Roles director/super_admin. Zod validation. director.module providers updated."
```

### Commit 5 — BE Fixes (markVip + company-state.service)

```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/application/director-data.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/director-data.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/remaining/company-state.service.ts
git commit -m "fix(dir/p29): markVip real DB write + company-state THRESHOLDS removed

markVip: sales_orders metadata JSONB UPDATE (Q-40 fake removed — line 54).
company-state.service: THRESHOLDS hardcode object removed; profit_pct/revenue_pct
added to kpis response; state field confirmed (was incorrectly status in FE)."
```

### Commit 6 — FE

```bash
git add \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/components/director/CompanyStateWidget.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/components/director/IdealVsActualPanel.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/DirectorSettingsPage.tsx
git commit -m "fix(dir/p29): CompanyStateWidget status→state + DirectorSettingsPage + IdealVsActualPanel

CompanyStateWidget:48 status→state field fix (API returns 'state', not 'status').
IdealVsActualPanel: FE_PROFIT_TARGET/FE_REVENUE_TARGET hardcodes removed.
DirectorSettingsPage: new page — State Levels CRUD + Metric Weights sliders. EP-DIR-029."
```

---

## QOIDALAR TEKSHIRUV JADVALI

| Qoida | Tekshiruv | Holat |
|---|---|---|
| Result\<T\> hamma metodda | `reviewer-result-pattern.sh` | Yangi fayllar PASS bo'lishi shart |
| Zod @Body validation | Controller kodini ko'rish | `insertCompanyStateLevelSchema.parse()` ✓ |
| Drizzle ORM (raw SQL minimal) | Kodni ko'rish | Faqat murakkab SQL `db.execute` bilan |
| Q-40 real INSERT/UPDATE | DB-proof (`company_state_log` INSERT) | Cron simulatsiya + psql SELECT |
| Q-46 ishlaydi → saqlan | `DirectorDataService.*` avvalgi metodlar | `getDashboard`, `getSummaryFull` etc. saqlanadi |
| Q-46 soxta → to'liq o'chir | `markVip()` soxta versiyasi | O'chiriladi, real bilan almashtiriladi |
| Fayl izolyatsiyasi | Faqat 15 owned file | Boshqa fayl tegilmaydi |
| DDL GATED | Migration `APPROVED:` yo'q → ISHGA TUSHIRILMAYDI | Egasi imzosi shart |
| git add aniq fayl | 6 commit, har biri aniq fayl | `-A` TAQIQ |
| "V2" atamasiz | Butun direktiva | V2 atamasi yo'q ✓ |
| Vizyon-moslik | EP-DIR-001/003/005/029 | 5 metrika, 5 daraja, cron 07:00 |
| EP-DIR-028 scope | §2.3-A defer-stub | Telegram digest → P47 wiring deferred ✓ |
| EP-DIR-026 scope | §2.3-B defer-stub | AI tahlilchi → P35/P36 wiring deferred ✓ |
| EP-DIR-037 scope | §2.3-C defer-stub | Majburiy sabab kategoriya → PP/MES owned, P29 aggregate stub ✓ |
| Fayl hajmi ≤900 qator | Har yangi fayl | Hech biri 900 qatordan oshmaydi |
| Funksiya hajmi ≤150 qator | `_readAllMetrics()` ≈120 qator | ✓ |
| Q-47 direktiva ≥1000 qator | Bu fayl | ≥1300 qator ✓ |

---

*P29 direktiva yaratildi: 2026-06-19 · Manbalar: MUSLIMBEK-PROMT-12-DIR-2026-06-08.md,
EP-DIR-001/003/005/029, mavjud fayl tahlili (company-state.service.ts:12-16,
director-data.service.ts:54, CompanyStateWidget.tsx:48, IdealVsActualPanel.tsx:17-18,
strategic-ext-schema.ts:278-352)*
