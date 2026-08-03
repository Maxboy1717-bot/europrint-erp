# P16 — MES (Manufacturing Execution System) + IoT Tablet: MES OEE engine fix + 3-stage session lifecycle DDL

> **Paket ID:** P16 · **To'lqin:** Wave 2 · **DDL Darvozasi:** HA (egasi ruxsati shart)
> **Bog'liq:** P12 (PP schema DDL) to'liq yakunlangan bo'lishi SHART
> **Bajaruvchi:** Muslimbek · **Tayyorlagan:** Claude (Advisor) · **Sana:** 2026-06-19
> **Fayl:** `docs/audit/MASSIV-50/P16-MES (Manufacturing Execution System) + IoT Tablet-mes-oee-stages.md`

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI** agentsan. Ushbu direktiva Wave 2 ning P16 paketidir. Boshlashdan oldin:
- `CLAUDE.md` + `docs/agent-constitution.md` o'qi
- `git status` + `git log -5` + `:3030` health tekshir
- P12 (PP schema DDL) DONE ekanini tasdiqlash: `git log --oneline | grep P12`

**WAVE:** 2 · **dependsOn:** `["P12"]` — P12 merge bo'lmasa TO'XTA, egaga flag qil.

---

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

**1. Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.**

```typescript
// ❌ NOTO'G'RI
async getSession(id: number) { return null; }
// ✅ TO'G'RI
async getSession(id: number): Promise<Result<Session>> {
  try { ... return { ok: true, data: row }; }
  catch (e) { return { ok: false, error: AppErr('INTERNAL', String(e)) }; }
}
```

**2. @Body Zod bilan validate; class-validator TAQIQ.**

**3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).**

**4. Q-40 ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.**

**5. Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).**

**6. FAYL IZOLYATSIYASI (Q-23/Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.**

**7. DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.**

**8. git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.**

**9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.**

**10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).**

**11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.**

**12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.**

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi 6 ta faylga teg. Boshqasi kerak bo'lsa — TO'XTA + egaga flag qil:**

| # | Fayl (loyiha ildizidan) | Holat | Maqsad |
|---|-------------------------|-------|--------|
| F1 | `apps/api/src/modules/mes/application/queries/get-oee.handler.ts` | MAVJUD (BUZUQ) | OEE handler to'liq qayta yozish |
| F2 | `apps/api/src/modules/mes/domain/aggregates/production-session.aggregate.ts` | MAVJUD | 3-bosqich lifecycle qo'shish |
| F3 | `apps/api/src/modules/mes/application/commands/advance-stage.handler.ts` | YO'Q — YARATILADI | advanceStage CQRS handler |
| F4 | `apps/api/src/modules/mes/presentation/mes-sessions.controller.ts` | MAVJUD | advanceStage endpoint qo'shish |
| F5 | `apps/api/src/modules/mes/dto/mes.dto.ts` | MAVJUD | AdvanceStage + CompleteWithTriple DTOlari |
| F6 | `lib/db/src/schema/pp/pp-iot.ts` | MAVJUD | production_sessions ga stage kolonlar |

**DDL DARVOZASI:** `lib/db/src/schema/pp/pp-iot.ts` ga ustun qo'shish DDL migration talab qiladi.

Migration fayli: `lib/db/src/schema/pp/migrations/d6-production-sessions-stage-cols.sql`

Bu fayl YOZILADI lekin ishga TUSHIRILMAYDI. Faylda `-- APPROVED: <ega-ismi> <sana>` eri bo'sh qoldiriladi. Egasi ruxsat bergach bajaruvchi `psql` orqali qo'lda ishlatadi.

**Shu fayldan tashqari hech narsaga tegma:**
- `mes.module.ts` — TEGILMAYDI (GetOeeHandler allaqachon `handlers[]` arrayda, line 52)
- `apps/api/src/modules/mes/application/mes-shifts-stats.service.ts` — P15 paketi, TEGILMAYDI
- `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts` — P15/P17 paketi, TEGILMAYDI
- `apps/api/src/modules/mes/infrastructure/repositories/*.ts` — TEGILMAYDI

---

## 2. VIZYON

### Biznes maqsad (EP-MES owner overridesdan)

EuroPrint MES moduli zavodning yurak urishi — har bir mashinadagi ishlab chiqarishni real vaqtda boshqaradi. Ushbu P16 paketi ikki asosiy muammoni hal qiladi:

#### 2.1 EP-MES-001 — 3-bosqich sessiya (owner override, A-defaultni BEKOR QILADI)

Har bir ishlab chiqarish sessiyasi 3 aniq bosqichdan iborat:

```
SOZLASH (sozlash/priladka)   → ASOSIY (asosiy ishlov)   → YAKUNLASH (yakunlash/qadoqlash)
   ↑                                  ↑                           ↑
  Sozlash vaqti              Asosiy ishlov vaqti          Yakunlash vaqti
  (OEE Availability          (Performance hisob-         (Umumiy/Brak/Sof
   uchun alohida)             kitobi uchun)                tekshiruvi)
```

Qabul mezoni:
- Har bosqichning boshi/oxiri alohida timestamp sifatida `production_sessions` jadvaliga yoziladi
- `advanceStage()` domain metodi SOZLASH → ASOSIY → YAKUNLASH → COMPLETE tartibini majburlaydi
- Bosqichni qaytish mumkin emas (YAKUNLASH → SOZLASH = TAQIQ)
- OEE Availability = `asosiy_started_at - sozlash_ended_at` yordamida hisob-kitob qilinadi (sozlash vaqti ajratiladi)

#### 2.2 EP-MES-014 — 4-darajali OEE hisob-kitobi (owner override)

OEE faqat "bir xil bo'ladi" emas — 4 darajada ko'rsatilishi SHART:

| Daraja | Aggregatsiya | Endpoint parametri |
|--------|-------------|-------------------|
| Mashina | Bitta `equipment_id` bo'yicha | `?level=machine&equipmentId=5` |
| Smena | `shift_id` / vaqt oralig'i bo'yicha | `?level=shift&date=2026-06-19` |
| Brigada | `worker_id` gruhi bo'yicha | `?level=brigade&workerId=12` |
| Sex (umumiy) | Hamma sessiyalar bo'yicha | `?level=shop` |

#### 2.3 EP-MES-060 — Umumiy/Brak/Sof uchlik tekshiruvi

Session yakunlanayotganda uchta maydon majburiy:
- `umumiy_son` (jami chiqarilgan mahsulot)
- `brak_soni` (nuqsonli mahsulot soni)
- `sof_mahsulot` (yaroqli mahsulot = umumiy − brak)

Tekshiruv qoidasi: `sof_mahsulot === umumiy_son − brak_soni` bo'lishi SHART. Agar tenglamaz → 400 xato.

#### 2.4 OEE formulasi (EP-MES-014 vizyon-hujjatidan)

Vizyon bo'yicha to'g'ri formulalar:

```
Availability  = net_run_seconds / scheduled_seconds
                 (net_run = running_time_seconds − sozlash_vaqti_seconds)
                 ⭐ ASOSIY OEE TESHIGI: sozlash vaqtini ajratmaslik → Availability doim >100%
                    sozlash_vaqti = sozlash_ended_at − sozlash_started_at (Phase 2 DDL GATED)
                    Hozirgi holat (Phase 1): net_run = running_time_seconds (sozlash ajratilmagan)
                    Bu ochiq bo'shliq — DEFERRED DEFER-NOTE §9 ga qarang.

Performance   = actual_quantity / (norma_hourly × net_run_hours)
                 (norma_hourly = equipment.norma_hourly — Phase 6 DDL, hozircha default)

Quality       = sof_mahsulot / umumiy_son
                 (actual_quantity − defect_quantity / actual_quantity)

OEE           = Availability × Performance × Quality
```

> ⚠️ **CONFORM-FIX (moslik tuzatish, 00-INTERVYU-MOSLIK.md §3 15-band):**
> Egasi aniq aytgan: "sozlash vaqti alohida → OEE to'g'ri bo'ladi" (OCHIQ-JAVOBLAR EP-COR-098,
> VISION-1000 Q368). Hozirgi `calcOee` funksiyasi sozlash vaqtini **ajratmaydi** — bu asosiy
> OEE teshigi. Tuzatish 2 bosqichda amalga oshiriladi:
>
> - **Phase 1 (bu paket):** `runningTimeSeconds` dan `sozlashSec` (agar mavjud bo'lsa)
>   ayiriladi; ustunlar DDL GATED bo'lgani uchun `?? 0` fallback bilan himoyalangan.
>   `calcOee` funksiyasiga `sozlashSec` parametri qo'shildi (qarang: QADAM 5 yangilangan kod).
>
> - **Phase 2 (DDL APPROVED keyin):** stage ustunlar migratsiyadan o'tgach, haqiqiy
>   `sozlash_ended_at - sozlash_started_at` delta ishlatiladi. `calcOee` kodi o'zgarmaydi —
>   faqat SELECT ga ustunlar qo'shiladi.
>
> **OEE-target alert (EP-MES-015):**
> Egasi: "OEE target mashina/sexga sozlanadigan" — `equipment.oee_target` ustuni (Phase 6 DDL,
> P12 qo'shadi). Hozirda bu ustun mavjud emas → alert **DEFER qilinadi** (P12 + Phase 6 DDL
> APPROVED keyin). `calcOee` natijasida `targetMet: boolean` maydoni placeholder sifatida
> qo'shildi (`oee_target` ustun mavjud bo'lganda to'ldiriladi).
> **EGASI QIYMATI KERAK:** `equipment.oee_target` default qiymati (masalan 0.85 = 85%) egasi
> belgilaydi — direktiva ichiga hardcode qilinmaydi.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud fayllar va aniqlangan muammolar

#### F1: get-oee.handler.ts — BUZUQ (4 muammo)

**Fayl:** `apps/api/src/modules/mes/application/queries/get-oee.handler.ts`

```
Muammo 1 (satr 8): import { db, mes_sessions } from '@shared/db'
  → mes_sessions (12-ustunli UUID jadval, haqiqiy sessiyalar saqlamaydi)
  → KERAK: import { productionSessions } from '@shared/db' yoki lib/db/src/schema/pp/pp-iot.ts

Muammo 2 (satr 62-63): totalPlannedTime += actualTime; totalPlannedTime = totalActualTime
  → Availability = actualTime/plannedTime = DOIM 1.0 (100%) — mantiqan noto'g'ri
  → KERAK: scheduledTime = running_time_seconds + stopped_time_seconds; netRunTime = running_time_seconds

Muammo 3 (satr 65): passedQty = Math.max(0, (quality_passed ? 1 : 0) - defects)
  → Boolean-dan int ayirish semantikasi noto'g'ri; passed boolean = sessiya to'g'ri o'tdimi
  → KERAK: passedQty = (actualQty - defectQty); quality = passedQty / actualQty

Muammo 4 (satr 67-68): totalActualOutput += 1; totalPlannedOutput += 1
  → Har sessiya 1 birlik sifatida hisoblanadi — bu noto'g'ri
  → KERAK: totalActualOutput += session.actualQuantity; totalPlannedOutput += session.targetQuantity

Muammo 5 (mes.module.ts satr 52): GetOeeHandler handlers[] arrayida BOR
  → Bu muammo aslida yo'q — CONFIRMED: handlers[] satr 47-55 da GetOeeHandler mavjud
  → LEKIN handler mes_sessions dan o'qiydi (bo'sh jadval) → natijalari har doim []
```

**Xulosa:** Handler registratsiyasi to'g'ri, lekin noto'g'ri jadvaldan o'qiydi + formulalar buzuq.

#### F2: production-session.aggregate.ts — TO'LIQ MAVJUD, KENGAYTIRISH KERAK

**Fayl:** `apps/api/src/modules/mes/domain/aggregates/production-session.aggregate.ts`

```
Hozirgi MesStatus enum (satr 12-19):
  READY / CHECKLIST_PENDING / RUNNING / PAUSED / COMPLETED / SENT_TO_QC

Hozirgi metodlar (satr 81-153):
  start() — CHECKLIST_PENDING → RUNNING
  pause() — RUNNING → PAUSED
  complete() — RUNNING|PAUSED → COMPLETED
  recordDowntime() — downtime yozadi
  moveToQc() — COMPLETED → SENT_TO_QC
  passChecklist() — READY → CHECKLIST_PENDING

MUAMMO: Stage kontseptsiyasi YO'Q
  → MesStage enum qo'shilishi SHART: SOZLASH | ASOSIY | YAKUNLASH
  → advanceStage() metodi qo'shilishi SHART
  → stage va barcha stage timestamp maydonlari aggregate ichida tracking qilinishi SHART
```

#### F3: advance-stage.handler.ts — UMUMAN YO'Q

**Fayl:** `apps/api/src/modules/mes/application/commands/advance-stage.handler.ts`

```
Ushbu fayl MAVJUD EMAS — yaratilishi shart.
CQRS CommandHandler AdvanceStageCommand uchun.
```

#### F4: mes-sessions.controller.ts — MAVJUD, ENDPOINT QO'SHISH KERAK

**Fayl:** `apps/api/src/modules/mes/presentation/mes-sessions.controller.ts`

```
Hozirgi endpointlar (satr 51-136):
  GET  /mes/sessions
  GET  /mes/sessions/:id
  POST /mes/sessions
  POST /mes/sessions/:id/start
  POST /mes/sessions/:id/complete
  POST /mes/sessions/:id/downtime

KERAK QO'SHILSIN:
  POST /mes/sessions/:id/advance-stage  → advanceStage command
  POST /mes/sessions/:id/complete-with-triple → umumiy/brak/sof tekshiruvi bilan
```

#### F5: mes.dto.ts — MAVJUD, DTO QO'SHISH KERAK

**Fayl:** `apps/api/src/modules/mes/dto/mes.dto.ts`

```
Hozirgi DTOlar (satr 1-140):
  MesCreateProductionSessionSchema, MesStartSessionSchema,
  MesCompleteSessionSchema, MesAddDowntimeSchema, ... jami 14 ta schema

KERAK QO'SHILSIN:
  AdvanceStageSchema / AdvanceStageDto
  CompleteWithTripleSchema / CompleteWithTripleDto
```

#### F6: pp-iot.ts — MAVJUD, USTUNLAR QO'SHISH KERAK (DDL GATED)

**Fayl:** `lib/db/src/schema/pp/pp-iot.ts`

```
Hozirgi production_sessions ustunlari (satr 51-89):
  id, sessionNumber, productionOrderId, equipmentId, deviceId, workerId,
  status, targetQuantity, actualQuantity, defectQuantity,
  startedAt, endedAt, lastSignalAt,
  runningTimeSeconds, stoppedTimeSeconds,
  workerNotes, availability, performance, quality, oee,
  ... (add-only legacy ustunlar) ...
  createdAt, updatedAt, deletedAt

KERAK QO'SHILSIN (DDL GATED — egasi ruxsati shart):
  stage              VARCHAR(20) DEFAULT 'sozlash'
  sozlash_started_at TIMESTAMPTZ
  sozlash_ended_at   TIMESTAMPTZ
  asosiy_started_at  TIMESTAMPTZ
  yakunlash_started_at TIMESTAMPTZ
  yakunlash_ended_at TIMESTAMPTZ
```

### 3.2 Mavjud EMAS (missing) — P16 scopida

- `advance-stage.handler.ts` — MAVJUD EMAS, YARATILADI
- `AdvanceStageSchema` DTO — MAVJUD EMAS, YARATILADI
- `CompleteWithTripleSchema` DTO — MAVJUD EMAS, YARATILADI
- OEE 4-daraja aggregatsiyasi — BUZUQ FORMULALAR BILAN MAVJUD, TO'G'IRLANADI
- production_sessions.stage ustuni — MAVJUD EMAS, DDL GATED

### 3.3 Buzuq/Soxta (brokenOrFake) — P16 scopida

| Fayl | Satr | Muammo | Jiddiylik |
|------|------|--------|-----------|
| `get-oee.handler.ts` | 8 | `mes_sessions` import — bo'sh jadval | KRITIK |
| `get-oee.handler.ts` | 62-63 | Availability=1.0 doim | KRITIK |
| `get-oee.handler.ts` | 65 | Boolean-int ayirish semantikasi | O'RTA |
| `get-oee.handler.ts` | 67-68 | Har sessiya 1 birlik | O'RTA |
| `production-session.aggregate.ts` | 12-19 | Stage kontseptsiyasi yo'q | MUHIM |

---

## 4. ISH (qadam-baqadam)

> **MUHIM:** Har qadam ohirida `pnpm tsc --noEmit` ishlatib BE build tekshir. Xato bo'lsa — keyingi qadam BOSHLANMAYDI.

---

### QADAM 1: F5 — AdvanceStage va CompleteWithTriple DTOlarini qo'shish

**Fayl:** `apps/api/src/modules/mes/dto/mes.dto.ts`

**Maqsad:** Yangi CQRS command va endpoint uchun Zod schemalar.

**140-satr ohiriga qo'shiladi** (hozirgi oxirgi schema `MesMaterialConsumptionSchema`):

```typescript
// ── QADAM 1 QO'SHIMCHA: Bosqich almashtirish (EP-MES-001) ──────────────────

export const MES_STAGE_VALUES = ['sozlash', 'asosiy', 'yakunlash'] as const;
export type MesStageValue = (typeof MES_STAGE_VALUES)[number];

export const AdvanceStageSchema = z.object({
  notes: z.string().max(500).optional(),
});
export type AdvanceStageDto = z.infer<typeof AdvanceStageSchema>;

// ── QADAM 1 QO'SHIMCHA: Umumiy/Brak/Sof uchlik tekshiruvi (EP-MES-060) ────

export const CompleteWithTripleSchema = z.object({
  umumiy_son:   z.number().int().min(0, 'Umumiy son manfiy bo\'lishi mumkin emas'),
  brak_soni:    z.number().int().min(0, 'Brak soni manfiy bo\'lishi mumkin emas'),
  sof_mahsulot: z.number().int().min(0, 'Sof mahsulot manfiy bo\'lishi mumkin emas'),
  notes:        z.string().optional(),
}).refine(
  (data) => data.sof_mahsulot === data.umumiy_son - data.brak_soni,
  {
    message: 'Sof mahsulot = Umumiy son − Brak soni bo\'lishi shart (EP-MES-060)',
    path: ['sof_mahsulot'],
  },
);
export type CompleteWithTripleDto = z.infer<typeof CompleteWithTripleSchema>;
```

**Tekshiruv:** `.refine()` validatsiyasi uchlik tenglama: `sof === umumiy − brak`. Agar mos kelmasa Zod 400 qaytaradi — DB ga YOZILMAYDI.

**Before:** mes.dto.ts 140 satrda tugaydi, `MesMaterialConsumptionDto` — oxirgi export.
**After:** +26 satr qo'shiladi → jami ~166 satr.

---

### QADAM 2: F2 — ProductionSession aggregate ga MesStage qo'shish

**Fayl:** `apps/api/src/modules/mes/domain/aggregates/production-session.aggregate.ts`

**Hozirgi holat (satr 12-19):**
```typescript
export enum MesStatus {
  READY = 'ready',
  CHECKLIST_PENDING = 'checklist_pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  SENT_TO_QC = 'sent_to_qc',
}
```

**Kerakli o'zgarishlar:**

**2a. MesStage enum qo'shish (satr 20 ga, MesStatus enumdan keyin):**

```typescript
// ── EP-MES-001: 3-bosqich sessiya lifecycle ───────────────────────────────
export enum MesStage {
  SOZLASH    = 'sozlash',    // Sozlash / priladka bosqichi
  ASOSIY     = 'asosiy',     // Asosiy ishlov bosqichi
  YAKUNLASH  = 'yakunlash',  // Yakunlash / qadoqlash bosqichi
}
```

**2b. ProductionSession class ga yangi maydonlar qo'shish (satr 34-35 dan keyin, `downtimes` maydonidan keyin):**

```typescript
  // ── EP-MES-001: 3-bosqich timestamp tracking ──────────────────────────────
  private stage: MesStage = MesStage.SOZLASH;
  private sozlashStartedAt: Date | null   = null;
  private sozlashEndedAt: Date | null     = null;
  private asosiyStartedAt: Date | null    = null;
  private yakunlashStartedAt: Date | null = null;
  private yakunlashEndedAt: Date | null   = null;
```

**2c. Getter metodlari qo'shish (satr 80 dan oldin, `start()` metodidan oldin):**

```typescript
  // ── EP-MES-001: Stage getterlar ───────────────────────────────────────────
  getStage(): MesStage { return this.stage; }
  getSozlashStartedAt(): Date | null { return this.sozlashStartedAt; }
  getSozlashEndedAt(): Date | null { return this.sozlashEndedAt; }
  getAsosiyStartedAt(): Date | null { return this.asosiyStartedAt; }
  getYakunlashStartedAt(): Date | null { return this.yakunlashStartedAt; }
  getYakunlashEndedAt(): Date | null { return this.yakunlashEndedAt; }
```

**2d. `start()` metodini o'zgartirish — sozlash bosqichini boshlash (satr 81-89):**

Hozirgi holat:
```typescript
  start(): Result<void> {
    if (this.status !== MesStatus.CHECKLIST_PENDING) {
      return Err('Faqat tekshiruv olingan sessiyani boshlash mumkin');
    }
    this.status = MesStatus.RUNNING;
    this.startedAt = _time.now();
    this.addDomainEvent({ type: 'MES_SESSION_STARTED', data: { sessionId: this.id } });
    return { ok: true, data: undefined };
  }
```

Yangi holat:
```typescript
  start(): Result<void> {
    if (this.status !== MesStatus.CHECKLIST_PENDING) {
      return Err('Faqat tekshiruv olingan sessiyani boshlash mumkin');
    }
    this.status = MesStatus.RUNNING;
    this.stage = MesStage.SOZLASH;          // EP-MES-001: sozlash bosqichi boshlanadi
    this.startedAt = _time.now();
    this.sozlashStartedAt = this.startedAt; // EP-MES-001: sozlash vaqt belgisi
    this.addDomainEvent({
      type: 'MES_SESSION_STARTED',
      data: { sessionId: this.id, stage: this.stage },
    });
    return { ok: true, data: undefined };
  }
```

**2e. `advanceStage()` yangi metod qo'shish (satr 115 dan keyin, `complete()` metodidan oldin):**

```typescript
  // ── EP-MES-001: Bosqichni oldinga siljitish ───────────────────────────────
  advanceStage(): Result<{ stage: MesStage; advancedAt: Date }> {
    if (this.status !== MesStatus.RUNNING) {
      return Err('Faqat ishchi sessiyada bosqich almashtirish mumkin');
    }
    const now = _time.now();

    if (this.stage === MesStage.SOZLASH) {
      this.sozlashEndedAt = now;
      this.stage = MesStage.ASOSIY;
      this.asosiyStartedAt = now;
      this.addDomainEvent({
        type: 'MES_STAGE_ADVANCED',
        data: { sessionId: this.id, from: MesStage.SOZLASH, to: MesStage.ASOSIY, at: now },
      });
      return { ok: true, data: { stage: this.stage, advancedAt: now } };
    }

    if (this.stage === MesStage.ASOSIY) {
      this.stage = MesStage.YAKUNLASH;
      this.yakunlashStartedAt = now;
      this.addDomainEvent({
        type: 'MES_STAGE_ADVANCED',
        data: { sessionId: this.id, from: MesStage.ASOSIY, to: MesStage.YAKUNLASH, at: now },
      });
      return { ok: true, data: { stage: this.stage, advancedAt: now } };
    }

    if (this.stage === MesStage.YAKUNLASH) {
      return Err(
        'Yakunlash bosqichi oxirgi bosqich — complete() ni chaqiring (EP-MES-001)',
      );
    }

    return Err(`Noma'lum bosqich: ${this.stage}`);
  }
```

**2f. `complete()` metodini kengaytirish — uchlik tekshiruvi qabul qiladi (satr 103-115):**

Hozirgi holat:
```typescript
  complete(): Result<void> {
    if (this.status !== MesStatus.RUNNING && this.status !== MesStatus.PAUSED) {
      return Err('Sessiya ish jarayonida emas');
    }
    this.status = MesStatus.COMPLETED;
    this.completedAt = _time.now();
    this.addDomainEvent({ type: 'MES_COMPLETED', data: { sessionId: this.id } });
    this.addDomainEvent({
      type: 'MES_TO_HR_360',
      data: { sessionId: this.id, operatorId: this.operatorId },
    });
    return { ok: true, data: undefined };
  }
```

Yangi holat (uchlik ma'lumotlarini qabul qiladi):
```typescript
  complete(triple?: {
    umumiy_son: number;
    brak_soni: number;
    sof_mahsulot: number;
  }): Result<void> {
    if (this.status !== MesStatus.RUNNING && this.status !== MesStatus.PAUSED) {
      return Err('Sessiya ish jarayonida emas');
    }
    // EP-MES-060: yakunlash bosqichida uchlik tekshiruvi
    if (triple) {
      if (triple.sof_mahsulot !== triple.umumiy_son - triple.brak_soni) {
        return Err(
          `Sof mahsulot (${triple.sof_mahsulot}) ≠ Umumiy (${triple.umumiy_son}) − Brak (${triple.brak_soni}). EP-MES-060`,
        );
      }
    }
    const now = _time.now();
    this.status = MesStatus.COMPLETED;
    this.completedAt = now;
    // EP-MES-001: yakunlash bosqichi tugaydi
    if (this.stage === MesStage.YAKUNLASH) {
      this.yakunlashEndedAt = now;
    }
    this.addDomainEvent({
      type: 'MES_COMPLETED',
      data: {
        sessionId: this.id,
        operatorId: this.operatorId,
        umumiy_son: triple?.umumiy_son ?? 0,
        brak_soni: triple?.brak_soni ?? 0,
        sof_mahsulot: triple?.sof_mahsulot ?? 0,
      },
    });
    this.addDomainEvent({
      type: 'MES_TO_HR_360',
      data: { sessionId: this.id, operatorId: this.operatorId },
    });
    return { ok: true, data: undefined };
  }
```

**Muhim:** `complete()` imzosi o'zgardi — u chaqirilgan joylardagi kod tekshirilishi SHART. Ammo P16 izolyatsiyasi sababli faqat `advance-stage.handler.ts` (F3) va `mes-sessions.controller.ts` (F4) qo'lda yoziladi. Boshqa handler (`complete-session.handler.ts`) — TEGILMAYDI (P15 paketi).

**Before aggregate:** 155 satr
**After aggregate:** ~230 satr (+75 satr)

---

### QADAM 3: F3 — advance-stage.handler.ts yangi fayl yaratish

**Fayl:** `apps/api/src/modules/mes/application/commands/advance-stage.handler.ts`

**Bu fayl MAVJUD EMAS** — scratch dan yaratiladi.

```typescript
/**
 * @module advance-stage.handler
 * @description CQRS CommandHandler. advanceStage() ni ProductionSession aggregateda chaqiradi.
 * EP-MES-001: 3-bosqich (SOZLASH → ASOSIY → YAKUNLASH) lifecycle.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { db } from '@shared/db';
import { productionSessions } from 'lib/db/src/schema/pp/pp-iot';
import { eq } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { AppErr } from '@common/errors/app-error';
import { MesStage } from '../../domain/aggregates/production-session.aggregate';
import { MES_REPO } from '../../domain/repositories/mes.repository';
import type { IMesRepository } from '../../domain/repositories/mes.repository';

// ─── Command DTO ─────────────────────────────────────────────────────────────

export class AdvanceStageCommand {
  constructor(
    public readonly sessionId: number,
    public readonly notes?: string,
  ) {}
}

// ─── Handler ────────────────────────────────────────────────────────────────

@Injectable()
@CommandHandler(AdvanceStageCommand)
export class AdvanceStageHandler implements ICommandHandler<AdvanceStageCommand> {
  private readonly logger = new Logger(AdvanceStageHandler.name);

  constructor(
    @Inject(MES_REPO) private readonly mesRepo: IMesRepository,
  ) {}

  async execute(command: AdvanceStageCommand): Promise<Result<{
    sessionId: number;
    stage: MesStage;
    advancedAt: Date;
  }>> {
    this.logger.log(
      `code=EP-MES-001 sessionId=${command.sessionId} action=advanceStage`,
    );

    // 1. Aggregateni yuklash
    const loadResult = await this.mesRepo.findById(command.sessionId);
    if (!loadResult.ok) {
      return { ok: false, error: loadResult.error };
    }
    const session = loadResult.data;

    // 2. Domain: bosqichni oldinga siljit
    const advanceResult = session.advanceStage();
    if (!advanceResult.ok) {
      return { ok: false, error: advanceResult.error };
    }

    const { stage, advancedAt } = advanceResult.data;

    // 3. DB ga yozish — faqat tegishli ustun(lar)
    //    DDL GATED: agar stage ustuni hali mavjud bo'lmasa, bu satr xato beradi.
    //    Migration d6-production-sessions-stage-cols.sql APPROVED bo'lguncha
    //    bu handler ishga tushirilmaydi (GATED comment).
    const updateFields: Record<string, unknown> = { updatedAt: advancedAt };

    if (stage === MesStage.ASOSIY) {
      // SOZLASH → ASOSIY: sozlash_ended_at va asosiy_started_at
      updateFields['stage'] = MesStage.ASOSIY;
      updateFields['sozlash_ended_at'] = session.getSozlashEndedAt();
      updateFields['asosiy_started_at'] = session.getAsosiyStartedAt();
    } else if (stage === MesStage.YAKUNLASH) {
      // ASOSIY → YAKUNLASH: yakunlash_started_at
      updateFields['stage'] = MesStage.YAKUNLASH;
      updateFields['yakunlash_started_at'] = session.getYakunlashStartedAt();
    }

    await db
      .update(productionSessions)
      .set(updateFields as Parameters<typeof productionSessions.$inferSelect>[0])
      .where(eq(productionSessions.id, command.sessionId));

    this.logger.log(
      `code=EP-MES-001 sessionId=${command.sessionId} stage=${stage} advancedAt=${advancedAt.toISOString()} DB_UPDATED`,
    );

    return {
      ok: true,
      data: { sessionId: command.sessionId, stage, advancedAt },
    };
  }
}
```

**Muhim eslatma:**
- `IMesRepository.findById()` metodi `DrizzleMesRepository` da mavjud bo'lishi SHART. Agar mavjud bo'lmasa — TO'XTA, P15 paketiga flag qil (bu P15 scope).
- `updateFields` cast — Drizzle `.set()` uchun partial type ishlatiladi. Agar TypeScript xato bersa:

```typescript
// Xato bo'lganda alternative:
await db.execute(sql`
  UPDATE production_sessions
  SET stage = ${stage},
      sozlash_ended_at = ${session.getSozlashEndedAt()},
      updated_at = NOW()
  WHERE id = ${command.sessionId}
`);
// typedExecute<T> ishlatilmaydi — bu DDL-gated ustunlar uchun
```

**Before:** fayl YO'Q
**After:** ~80 satr yangi fayl

---

### QADAM 4: F4 — mes-sessions.controller.ts ga 2 ta endpoint qo'shish

**Fayl:** `apps/api/src/modules/mes/presentation/mes-sessions.controller.ts`

**Import qo'shish** — satr 18-26 ga (mavjud importlar blokiga):

```typescript
import { AdvanceStageCommand } from '../application/commands/advance-stage.handler';
import {
  AdvanceStageSchema, AdvanceStageDto,
  CompleteWithTripleSchema, CompleteWithTripleDto,
} from '../dto/mes.dto';
```

**advanceStage endpoint** — satr 137 (hozirgi oxirgi `}`) dan oldin qo'shiladi:

```typescript
  // ── EP-MES-001: Bosqich almashtirish ──────────────────────────────────────

  @ApiOperation({ summary: 'Sessiya bosqichini oldinga siljitish (SOZLASH→ASOSIY→YAKUNLASH)' })
  @ApiResponse({ status: 200, description: 'Bosqich almashtirildi' })
  @ApiResponse({ status: 400, description: 'Noto\'g\'ri so\'rov yoki bosqich xatosi' })
  @ApiResponse({ status: 404, description: 'Sessiya topilmadi' })
  @Post(':id/advance-stage')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async advanceStage(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = AdvanceStageSchema.parse(body) as AdvanceStageDto;
    this.logger.log(`code=EP-MES-001 action=advanceStage sessionId=${id}`);
    const command = new AdvanceStageCommand(Number(id), dto.notes);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  // ── EP-MES-060: Umumiy/Brak/Sof uchlik tekshiruvi bilan yakunlash ─────────
  // ⭐ CONFORM-FIX (Q-40 / Q-10): avvalgi "validated:true + message" = SOXTA JAVOB.
  // Q-40: ishlaydi ≠ to'g'ri — DB ga YOZILMAYDI, lekin 200 qaytarardi.
  // Q-10: tayyor bo'lmagan endpoint 501 NOT_IMPLEMENTED qaytarishi shart.
  // EGASI TASDIQIDAN KEYIN: CompleteSessionCommand (complete-session.handler.ts) ga
  //   `triple` parametr qo'shiladi → real UPDATE production_sessions + MES_COMPLETED event.
  //   Bu P16 owned fayllarida emas (complete-session.handler.ts = P17 scope) → DEFERRED.

  @ApiOperation({ summary: 'Sessiyani uchlik tekshiruvi bilan yakunlash (EP-MES-060)' })
  @ApiResponse({ status: 501, description: 'Hali amalga oshirilmagan — P17 ga defer' })
  @ApiResponse({ status: 400, description: 'Uchlik tenglama xatosi: sof≠umumiy-brak' })
  @Post(':id/complete-with-triple')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async completeWithTriple(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    // EP-MES-060: Avval Zod validatsiya — uchlik tenglama noto'g'ri bo'lsa 400 beradi (real)
    CompleteWithTripleSchema.parse(body);
    // ✅ Validatsiya o'tdi → lekin DB yozuv P17 (CompleteSessionHandler extend) keyin.
    // Q-10 / Q-40: soxta 200 TAQIQ — 501 qaytariladi.
    throw new HttpException(
      {
        statusCode: 501,
        code: 'EP-MES-060-DEFER',
        message: 'complete-with-triple DB yozuv hali amalga oshirilmagan (P17 wave3). ' +
                 'Zod validatsiya o\'tdi (sof=umumiy-brak to\'g\'ri). ' +
                 'To\'liq implement: CompleteSessionCommand ga triple parametr + ' +
                 'production_sessions UPDATE + MES_COMPLETED event (P17 scope).',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
```

> **CONFORM-FIX izohi (Q-40 "ishlaydi ≠ to'g'ri"):**
> Oldingi kod `{validated:true, message:"DB yozuv P17 da..."}` qaytarardi — bu SOXTA JAVOB.
> Operator 200 ko'radi, DB ga hech narsa yozilmaydi, sessiya hali COMPLETED holatga o'tmaydi.
> 00-INTERVYU-MOSLIK.md §3: "complete-with-triple stub qaytaradi (Q-40 buzilishi)".
> To'g'ri yechim: `HttpStatus.NOT_IMPLEMENTED` (501) + Zod validatsiya (400 ishlaydi).
> P17 `CompleteSessionHandler` ga `triple` parametr qo'shilgach bu endpoint real qilinadi.

> **`HttpException` va `HttpStatus` importlari kerak** — `mes-sessions.controller.ts` da
> allaqachon `NotFoundException` bor, lekin `HttpException`/`HttpStatus` qo'shimcha import
> kerak bo'lishi mumkin:
> ```typescript
> import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
> ```

**Before controller:** 138 satr
**After controller:** ~185 satr (+47 satr)

---

### QADAM 5: F1 — get-oee.handler.ts to'liq qayta yozish

**Fayl:** `apps/api/src/modules/mes/application/queries/get-oee.handler.ts`

Bu handler to'liq qayta yoziladi — hozirgi kod 4 ta kritik xato bilan BUZUQ.

**Q-46 qoidasi:** Hozirgi `get-oee.handler.ts` buzuq (bo'sh jadvaldan o'qiydi, formulalar noto'g'ri) — **TO'LIQ** almashtiriladi.

**Yangi fayl to'liq kodi:**

```typescript
/**
 * @module get-oee.handler
 * @description CQRS query handler. OEE hisob-kitobi — 4 daraja (EP-MES-014 owner override).
 * Canonical jadval: production_sessions (pp-iot.ts).
 * Formula: Availability=netRun/scheduled · Performance=actual/norma · Quality=sof/umumiy.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { productionSessions } from 'lib/db/src/schema/pp/pp-iot';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { AppErr } from '@common/errors/app-error';

// ─── Query DTO ───────────────────────────────────────────────────────────────

export class GetOeeQuery {
  constructor(
    public readonly filters: {
      from?: string;         // ISO8601 sana
      to?: string;
      equipmentId?: number;  // mashina darajasi (EP-MES-014 level=machine)
      workerId?: number;     // brigada darajasi (EP-MES-014 level=brigade)
      shiftDate?: string;    // smena darajasi (EP-MES-014 level=shift)
      level?: 'machine' | 'shift' | 'brigade' | 'shop'; // 4-daraja (EP-MES-014)
    },
  ) {}
}

// ─── Ichki tuzilmalar ────────────────────────────────────────────────────────

interface SessionRow {
  id: number;
  equipmentId: number;
  workerId: number;
  targetQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  runningTimeSeconds: number;
  stoppedTimeSeconds: number;
  startedAt: Date | null;
  endedAt: Date | null;
}

interface OeeResult {
  level: string;
  groupKey: string;
  availability: number;    // 0-100
  performance: number;     // 0-100
  quality: number;         // 0-100
  oee: number;             // 0-100
  sessionCount: number;
  totalActualQty: number;
  totalTargetQty: number;
  from: string | undefined;
  to: string | undefined;
  setupSegmented: boolean; // true = sozlash vaqti ajratilgan (EP-MES-014 CONFORM)
  // OEE-target alert (EP-MES-015) — DEFER: equipment.oee_target ustuni P12+Phase6 DDL keyin
  // targetMet?: boolean;  // EGASI QIYMATI KERAK — hardcode qilinmaydi
}

// ─── Ichki tuzilmalar (sozlash ustunlari qo'shildi) ──────────────────────────

interface SessionRow {
  id: number;
  equipmentId: number;
  workerId: number;
  targetQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  runningTimeSeconds: number;
  stoppedTimeSeconds: number;
  startedAt: Date | null;
  endedAt: Date | null;
  // ── EP-MES-001 Phase 2 sozlash ustunlari (DDL GATED — mavjud bo'lmasa null) ─
  sozlashStartedAt?: Date | null;  // sozlash_started_at — DDL APPROVED keyin
  sozlashEndedAt?:   Date | null;  // sozlash_ended_at   — DDL APPROVED keyin
}

// ─── Hisob-kitob yordamchi funksiyasi ─────────────────────────────────────────
// ⭐ CONFORM-FIX: sozlash vaqtini runningTime dan ajratadi (EP-MES-014, egasi Q368).
// sozlash_started/ended_at DDL GATED bo'lgani uchun null/undefined bo'lsa 0 fallback.

function calcOee(sessions: SessionRow[]): {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  totalActualQty: number;
  totalTargetQty: number;
  setupSegmented: boolean;  // sozlash vaqti ajratilganini bildiruvchi flag
} {
  if (sessions.length === 0) {
    return {
      availability: 0, performance: 0, quality: 0, oee: 0,
      totalActualQty: 0, totalTargetQty: 0, setupSegmented: false,
    };
  }

  let totalScheduledSec = 0;
  let totalNetRunSec    = 0;
  let totalActualQty    = 0;
  let totalTargetQty    = 0;
  let totalSofQty       = 0;
  let totalSozlashSec   = 0;   // ⭐ ajratilgan sozlash vaqti
  let setupDataCount    = 0;   // sozlash vaqti ma'lumoti mavjud bo'lgan sessiyalar

  for (const s of sessions) {
    // Rejalangan vaqt = ishlab turgan + to'xtagan vaqt (soniyalarda)
    const scheduledSec = (s.runningTimeSeconds ?? 0) + (s.stoppedTimeSeconds ?? 0);

    // ⭐ EP-MES-014 CONFORM-FIX: sozlash vaqtini ajratish
    // sozlash_ended_at - sozlash_started_at = sozlash davomiyligi (soniyalarda)
    // DDL GATED: ustunlar mavjud bo'lmasa → 0 fallback (ajratilmaydi)
    let sozlashSec = 0;
    if (s.sozlashStartedAt && s.sozlashEndedAt) {
      sozlashSec = Math.max(
        0,
        Math.floor(
          (new Date(s.sozlashEndedAt).getTime() - new Date(s.sozlashStartedAt).getTime()) / 1000,
        ),
      );
      setupDataCount++;
    }
    totalSozlashSec += sozlashSec;

    // Net ishlab turish = runningTime − sozlash vaqti (EP-MES-014)
    // Sozlash vaqti "rejalangan to'xtash" bo'lgani uchun scheduled dan ham ayiriladi
    const netRunSec = Math.max(0, (s.runningTimeSeconds ?? 0) - sozlashSec);

    totalScheduledSec += Math.max(0, scheduledSec - sozlashSec);
    totalNetRunSec    += netRunSec;
    totalActualQty    += s.actualQuantity ?? 0;
    totalTargetQty    += s.targetQuantity ?? 0;
    // Sof mahsulot = actual - defect (EP-MES-060)
    const sofQty = Math.max(0, (s.actualQuantity ?? 0) - (s.defectQuantity ?? 0));
    totalSofQty += sofQty;
  }

  // Availability = netRun / scheduled (sozlash ajratilgan — EP-MES-014)
  // setupSegmented=true bo'lsa haqiqiy ajratish bor; false bo'lsa Phase 1 taxminiy
  const availability = totalScheduledSec > 0 ? totalNetRunSec / totalScheduledSec : 0;

  // Performance = actual / target (norma_hourly Phase 6 DDL ga defer — EP-MES-039)
  // EGASI QIYMATI KERAK: equipment.norma_hourly — hardcode qilinmaydi
  const performance = totalTargetQty > 0 ? totalActualQty / totalTargetQty : 0;

  // Quality = sof / umumiy (EP-MES-060)
  const quality = totalActualQty > 0 ? totalSofQty / totalActualQty : 0;

  // OEE = A × P × Q
  const oee = availability * performance * quality;

  return {
    availability: Math.round(availability * 100),
    performance:  Math.round(performance * 100),
    quality:      Math.round(quality * 100),
    oee:          Math.round(oee * 100),
    totalActualQty,
    totalTargetQty,
    setupSegmented: setupDataCount > 0,  // true = haqiqiy sozlash ajratildi
  };
}

// ─── Handler ────────────────────────────────────────────────────────────────

@Injectable()
@QueryHandler(GetOeeQuery)
export class GetOeeHandler implements IQueryHandler<GetOeeQuery> {
  private readonly logger = new Logger(GetOeeHandler.name);

  async execute(query: GetOeeQuery): Promise<Result<OeeResult[]>> {
    this.logger.log(`code=EP-MES-014 action=getOee level=${query.filters.level ?? 'shop'}`);

    try {
      // ── 1. WHERE filterlari ───────────────────────────────────────────────
      const conditions: ReturnType<typeof gte>[] = [];

      if (query.filters.from) {
        conditions.push(gte(productionSessions.startedAt, new Date(query.filters.from)));
      }
      if (query.filters.to) {
        conditions.push(lte(productionSessions.startedAt, new Date(query.filters.to)));
      }
      if (query.filters.equipmentId) {
        conditions.push(eq(productionSessions.equipmentId, query.filters.equipmentId));
      }
      if (query.filters.workerId) {
        conditions.push(eq(productionSessions.workerId, query.filters.workerId));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // ── 2. DB dan haqiqiy ma'lumot olish (canonical: production_sessions) ─
      // ⭐ CONFORM-FIX: sozlashStartedAt + sozlashEndedAt ham o'qiladi (EP-MES-014).
      // Bu ustunlar DDL GATED — mavjud bo'lmasa Drizzle null qaytaradi (type: Date|null).
      // DDL APPROVED + migration ishga tushgandan keyin haqiqiy qiymatlar keladi.
      const rows = await db
        .select({
          id:                  productionSessions.id,
          equipmentId:         productionSessions.equipmentId,
          workerId:            productionSessions.workerId,
          targetQuantity:      productionSessions.targetQuantity,
          actualQuantity:      productionSessions.actualQuantity,
          defectQuantity:      productionSessions.defectQuantity,
          runningTimeSeconds:  productionSessions.runningTimeSeconds,
          stoppedTimeSeconds:  productionSessions.stoppedTimeSeconds,
          startedAt:           productionSessions.startedAt,
          endedAt:             productionSessions.endedAt,
          // EP-MES-001/014: sozlash vaqti ajratish uchun — DDL GATED ustunlar
          sozlashStartedAt:    productionSessions.sozlashStartedAt,
          sozlashEndedAt:      productionSessions.sozlashEndedAt,
        })
        .from(productionSessions)
        .where(where);

      this.logger.log(
        `code=EP-MES-014 rowsFromDB=${rows.length} level=${query.filters.level ?? 'shop'}`,
      );

      // ── 3. 4-daraja aggregatsiya (EP-MES-014 owner override) ─────────────
      const level = query.filters.level ?? 'shop';
      const results: OeeResult[] = [];

      if (level === 'shop') {
        // Umumiy sex darajasi — hammasi bir guruhda
        const metrics = calcOee(rows as SessionRow[]);
        results.push({
          level: 'shop',
          groupKey: 'all',
          ...metrics,
          sessionCount: rows.length,
          from: query.filters.from,
          to: query.filters.to,
          // setupSegmented: metrics.setupSegmented — spread orqali keladi
        });
      } else if (level === 'machine') {
        // Mashina darajasi — equipmentId bo'yicha guruhlab
        const byEquipment = new Map<number, SessionRow[]>();
        for (const row of rows as SessionRow[]) {
          const key = row.equipmentId;
          if (!byEquipment.has(key)) byEquipment.set(key, []);
          byEquipment.get(key)!.push(row);
        }
        for (const [eqId, sessList] of byEquipment.entries()) {
          const metrics = calcOee(sessList);
          results.push({
            level: 'machine',
            groupKey: String(eqId),
            ...metrics,
            sessionCount: sessList.length,
            from: query.filters.from,
            to: query.filters.to,
          });
        }
      } else if (level === 'brigade') {
        // Brigada darajasi — workerId bo'yicha guruhlab
        const byWorker = new Map<number, SessionRow[]>();
        for (const row of rows as SessionRow[]) {
          const key = row.workerId;
          if (!byWorker.has(key)) byWorker.set(key, []);
          byWorker.get(key)!.push(row);
        }
        for (const [wId, sessList] of byWorker.entries()) {
          const metrics = calcOee(sessList);
          results.push({
            level: 'brigade',
            groupKey: String(wId),
            ...metrics,
            sessionCount: sessList.length,
            from: query.filters.from,
            to: query.filters.to,
          });
        }
      } else if (level === 'shift') {
        // Smena darajasi — shiftDate bo'yicha (sana kesimi)
        const byDate = new Map<string, SessionRow[]>();
        for (const row of rows as SessionRow[]) {
          const dateKey = row.startedAt
            ? new Date(row.startedAt).toISOString().slice(0, 10)
            : 'unknown';
          if (!byDate.has(dateKey)) byDate.set(dateKey, []);
          byDate.get(dateKey)!.push(row);
        }
        for (const [dateKey, sessList] of byDate.entries()) {
          const metrics = calcOee(sessList);
          results.push({
            level: 'shift',
            groupKey: dateKey,
            ...metrics,
            sessionCount: sessList.length,
            from: query.filters.from,
            to: query.filters.to,
          });
        }
      }

      this.logger.log(
        `code=EP-MES-014 level=${level} resultGroups=${results.length} DONE`,
      );

      return { ok: true, data: results };

    } catch (e) {
      this.logger.error(`code=EP-MES-014 ERROR: ${String(e)}`);
      return { ok: false, error: AppErr('INTERNAL', `OEE hisob-kitob xatosi: ${String(e)}`) };
    }
  }
}
```

**Before:** 95 satr (buzuq: mes_sessions, formulalar noto'g'ri)
**After:** ~170 satr (to'g'ri: productionSessions, 4-daraja, to'g'ri formulalar)

**GetOeeQuery** klassini tekshirish — agar boshqa faylda import qilingan bo'lsa:
```bash
grep -r "GetOeeQuery" apps/api/src/ --include="*.ts" -l
```

Agar `get-oee.query.ts` alohida fayl bo'lsa — u TEGILMAYDI, lekin handler ichida qayta e'lon qilish o'rniga import qilinadi. Hozircha handler ichida `GetOeeQuery` klassi ham e'lon qilingan (asl fayl line 14 da `GetOeeQuery` bor). Bu holat to'g'ri — bir xil nom, handler fayl ichida.

---

### QADAM 6: F6 — pp-iot.ts Drizzle schema yangilash (DDL GATED)

**Fayl:** `lib/db/src/schema/pp/pp-iot.ts`

**Ushbu qadam DDL GATED.** Drizzle schemaga ustunlar qo'shiladi, lekin DB migratsiyasi egasi ruxsatisiz ishga tushirilmaydi.

**O'zgartirish:** `productionSessions` table (satr 51-89), `createdAt` dan OLDIN qo'shiladi:

Hozirgi (satr 83-88):
```typescript
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

Yangi holat (stage ustunlari qo'shiladi):
```typescript
  // ── EP-MES-001: 3-bosqich sessiya lifecycle ────────────────────────────────
  // DDL GATED: migrations/d6-production-sessions-stage-cols.sql APPROVED bo'lguncha
  // bu ustunlar DB da MAVJUD EMAS — handler ularga YOZMAYDI (error beradi).
  // Egasi ruxsati → psql migration → keyin handler faollashadi.
  stage:               varchar("stage", { length: 20 }).default('sozlash'),
  sozlashStartedAt:    timestamp("sozlash_started_at"),
  sozlashEndedAt:      timestamp("sozlash_ended_at"),
  asosiyStartedAt:     timestamp("asosiy_started_at"),
  yakunlashStartedAt:  timestamp("yakunlash_started_at"),
  yakunlashEndedAt:    timestamp("yakunlash_ended_at"),
  // ── /EP-MES-001 ───────────────────────────────────────────────────────────
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

**Before:** production_sessions — ustunlar 58-88 satr orasida
**After:** +7 satr, CHECK constraint ham yangilanishi kerak:

Hozirgi CHECK constraint (satr 88):
```typescript
  check("production_sessions_status_chk", sql`${t.status} IN ('pending','running','paused','stopped','completed')`),
```

Yangi (satr qo'shiladi):
```typescript
  check("production_sessions_status_chk", sql`${t.status} IN ('pending','running','paused','stopped','completed')`),
  check("production_sessions_stage_chk", sql`${t.stage} IS NULL OR ${t.stage} IN ('sozlash','asosiy','yakunlash')`),
```

**Drizzle schema o'zgarishi tsc da xato bermasligi kerak** — ustunlar optional, DB da mavjud bo'lmasa ham Drizzle type-safe qoladi.

---

### QADAM 7: mes.module.ts — AdvanceStageHandler ro'yxatdan o'tkazish

**MUHIM:** `mes.module.ts` OWNED FILES da EMAS — lekin `advance-stage.handler.ts` ni `handlers[]` ga qo'shmasdan CQRS ishlamaydi.

**Bu holat qarama-qarshilik yaratadi (Q-6 izolyatsiya vs NestJS DI zaruriyati).**

**Yechim:** `advance-stage.handler.ts` yaratilgandan so'ng, EGA DAN RUXSAT SO'RASH KERAK:

> "Egasi, `AdvanceStageHandler` ni `mes.module.ts` handlers[] ga qo'shishim kerak.
> Bu P16 izolyatsiyasidan tashqarida, lekin NestJS DI uchun zarur.
> `mes.module.ts` satr 47-55 dagi `handlers` arrayga 1 satr qo'shiladi.
> Ruxsat bering?"

Ruxsat kelganda qo'shiladi:
```typescript
// mes.module.ts satr 47-55 — handlers array:
const handlers = [
  StartSessionHandler,
  CompleteSessionHandler,
  RecordDowntimeHandler,
  EndDowntimeHandler,
  GetSessionsHandler,
  GetOeeHandler,
  GetDowntimeHandler,
  GetDowntimeSummaryHandler,
  AdvanceStageHandler,  // ← QO'SHILADI (egasi ruxsatidan keyin)
];
```

---

## 5. DDL (egasi ruxsati talab qilinadi)

**Migration fayli:** `lib/db/src/schema/pp/migrations/d6-production-sessions-stage-cols.sql`

> Bu fayl YARATILADI lekin ISHGA TUSHIRILMAYDI.
> Egasi "ruxsat beraman" degandagina `psql` bilan qo'lda qo'llaniladi.

```sql
-- MIGRATION: d6-production-sessions-stage-cols.sql
-- MAQSAD: EP-MES-001 3-bosqich sessiya lifecycle uchun production_sessions jadvaliga
--         stage va 5 ta timestamp ustun qo'shish.
-- APPROVED: <EGA_ISMI> <SANA>  ← ← ← BO'SH: egasi to'ldiradi
-- TAYYORLAGAN: P16 agent, 2026-06-19
-- WAVE: 2 · PAKET: P16 · dependsOn: P12
--
-- ISHLATISH:
--   psql -U europrint -d europrint -f d6-production-sessions-stage-cols.sql
--
-- ROLLBACK:
--   ALTER TABLE production_sessions
--     DROP COLUMN IF EXISTS stage,
--     DROP COLUMN IF EXISTS sozlash_started_at,
--     DROP COLUMN IF EXISTS sozlash_ended_at,
--     DROP COLUMN IF EXISTS asosiy_started_at,
--     DROP COLUMN IF EXISTS yakunlash_started_at,
--     DROP COLUMN IF EXISTS yakunlash_ended_at;

BEGIN;

-- 1. stage ustuni: default = 'sozlash' (mavjud sessiyalar sozlash bosqichida deb hisoblanadi)
ALTER TABLE production_sessions
  ADD COLUMN IF NOT EXISTS stage VARCHAR(20) DEFAULT 'sozlash';

-- 2. Sozlash bosqichi vaqt belgilari
ALTER TABLE production_sessions
  ADD COLUMN IF NOT EXISTS sozlash_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sozlash_ended_at   TIMESTAMPTZ;

-- 3. Asosiy bosqichi boshlanish vaqti
ALTER TABLE production_sessions
  ADD COLUMN IF NOT EXISTS asosiy_started_at TIMESTAMPTZ;

-- 4. Yakunlash bosqichi vaqt belgilari
ALTER TABLE production_sessions
  ADD COLUMN IF NOT EXISTS yakunlash_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS yakunlash_ended_at   TIMESTAMPTZ;

-- 5. CHECK constraint: faqat ruxsat etilgan qiymatlar
ALTER TABLE production_sessions
  DROP CONSTRAINT IF EXISTS production_sessions_stage_chk;
ALTER TABLE production_sessions
  ADD CONSTRAINT production_sessions_stage_chk
    CHECK (stage IS NULL OR stage IN ('sozlash', 'asosiy', 'yakunlash'));

-- 6. Tekshiruv so'rovi (migration muvaffaqiyatli bo'lishi uchun)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'production_sessions'
       AND column_name = 'stage'
  ) THEN
    RAISE EXCEPTION 'stage ustuni qo''shilmadi — migration muvaffaqiyatsiz!';
  END IF;
END $$;

COMMIT;

-- TEKSHIRUV SO'ROVI (migration ohirida qo'lda ishlatiladi):
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'production_sessions'
--   AND column_name IN ('stage','sozlash_started_at','sozlash_ended_at',
--                       'asosiy_started_at','yakunlash_started_at','yakunlash_ended_at')
-- ORDER BY ordinal_position;
-- → 6 ta satr ko'rinishi kerak
```

---

## 6. QABUL MEZONI

Quyidagi barcha bandlar BAJARILISHI shart — bitta ham o'tkazib yuborilmaydi:

### 6.1 BE tsc 0

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api tsc --noEmit
# Natija: 0 xato
```

### 6.2 FE tsc 0

```bash
pnpm --filter erp-dashboard tsc --noEmit
# Natija: 0 xato
```

### 6.3 Result<T> pattern

```bash
bash scripts/reviewer-result-pattern.sh
# FAIL: 0 (WARN maqbul)
```

### 6.4 Array xavfsizligi

```bash
bash scripts/reviewer-array-safety.sh
# FAIL: 0
```

### 6.5 GetOeeHandler — canonical jadvaldan o'qiydi (DB-proof)

```bash
# Jonli DB da hech bo'lmaganda 1 ta production_sessions qaydini tekshir:
node _audit/q.cjs "SELECT count(*) FROM production_sessions WHERE status='completed'"
# Agar 0 bo'lsa — test sessiya yaratish:
# POST /api/mes/sessions (create → start → complete)
# Keyin OEE so'rov:
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3030/api/mes/oee?level=shop"
# Natija: [{level:'shop', oee:N, sessionCount:N}] (bo'sh emas)
```

### 6.6 advanceStage endpoint — real DB yozuv (DDL APPROVED bo'lgach)

```bash
# DDL migration ishga tushgandan keyin:
# 1. Sessiya boshlash
curl -X POST http://localhost:3030/api/mes/sessions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
# SESSION_ID olish

# 2. Checklist o'tkazish va boshlash
curl -X POST http://localhost:3030/api/mes/sessions/<SESSION_ID>/start \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{}'

# 3. SOZLASH → ASOSIY
curl -X POST http://localhost:3030/api/mes/sessions/<SESSION_ID>/advance-stage \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{}'
# Natija: {stage:'asosiy', advancedAt:'...'}

# 4. DB-proof
node _audit/q.cjs "SELECT stage, asosiy_started_at FROM production_sessions WHERE id=<SESSION_ID>"
# Natija: stage='asosiy', asosiy_started_at IS NOT NULL
```

### 6.7 CompleteWithTriple — uchlik tenglama tekshiruvi (CONFORM-FIX: 501)

```bash
# Noto'g'ri tenglama → 400 (Zod xato)
curl -X POST http://localhost:3030/api/mes/sessions/<ID>/complete-with-triple \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"umumiy_son":100,"brak_soni":10,"sof_mahsulot":85}'
# Natija: 400 "Sof mahsulot (85) ≠ Umumiy (100) − Brak (10). EP-MES-060"

# To'g'ri tenglama → 501 NOT_IMPLEMENTED (CONFORM-FIX: soxta 200 emas)
curl -X POST http://localhost:3030/api/mes/sessions/<ID>/complete-with-triple \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"umumiy_son":100,"brak_soni":10,"sof_mahsulot":90}'
# Natija: 501 {"statusCode":501,"code":"EP-MES-060-DEFER","message":"complete-with-triple DB yozuv hali..."}
# ✅ Q-40 CONFORM: soxta 200 EMAS — to'g'ri holat 501 (hali qurilmagan, lekin DISHONESTlik yo'q)
```

### 6.8 OEE 4-daraja — har daraja natija beradi

```bash
# machine darajasi
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3030/api/mes/oee?level=machine"
# Natija: [{level:'machine', groupKey:'<equipmentId>', oee:N}]

# shift darajasi
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3030/api/mes/oee?level=shift"
# Natija: [{level:'shift', groupKey:'2026-06-19', oee:N}]
```

### 6.9 Golden-thread regressiya

```bash
# PP → MES oltin zanjiri buzilib qolmagan ekanini tekshirish
curl -X POST http://localhost:3030/api/pp/production-orders \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"title":"Test","quantity":100}'
# → PpReleasedEvent → production_sessions ga INSERT
node _audit/q.cjs "SELECT count(*) FROM production_sessions WHERE status='pending'"
# → 0 dan katta bo'lishi kerak
```

### 6.10 Vizyon-moslik tekshiruvi (Q-40 + Q-12 + CONFORM-FIX)

- OEE Availability formulasi `sozlash vaqti` ni hisobga oladi: **HA** ✅
  `calcOee` funksiyasi `sozlashStartedAt`→`sozlashEndedAt` delta ni ajratadi.
  DDL GATED ustunlar null bo'lsa `sozlashSec=0` fallback — xavfsiz.
  `setupSegmented: true/false` flag javobda ko'rinadi.
- OEE-target alert: **DEFER** ⏳ — `equipment.oee_target` P12+Phase6 DDL keyin. §9 jadval.
- 4 daraja mavjud: `level=machine|shift|brigade|shop` — hamma parameter 200 beradi ✅
- `sof_mahsulot = umumiy_son - brak_soni` tenglama 400 bilan rad etiladi ✅
- `complete-with-triple` noto'g'ri → 400 ✅; to'g'ri → 501 NOT_IMPLEMENTED ✅ (Q-40 conform)

---

## 7. SELF-VERIFY

Har qadam ohirida quyidagi buyruqlar bajariladi:

```bash
# === A. TypeScript tekshiruvi ===
pnpm --filter @europrint/api tsc --noEmit 2>&1 | tail -5
# Kutilgan natija: "Found 0 errors."

# === B. Reviewer skriptlari ===
bash scripts/reviewer-result-pattern.sh 2>&1 | grep -E "FAIL|PASS|WARN"
bash scripts/reviewer-array-safety.sh 2>&1 | grep -E "FAIL|PASS"

# === C. Handler ro'yxatdan o'tganini tekshirish (DI) ===
grep -n "GetOeeHandler\|AdvanceStageHandler" apps/api/src/modules/mes/mes.module.ts
# Natija:
#   52: GetOeeHandler,        ← handlers[] arrayda (allaqachon)
#   XX: AdvanceStageHandler,  ← egasi ruxsatidan keyin qo'shiladi

# === D. Import to'g'riligini tekshirish ===
grep -n "mes_sessions\|mesProduction" apps/api/src/modules/mes/application/queries/get-oee.handler.ts
# Natija: 0 satr (es_sessions import bo'lmasligi kerak — o'chirildi)
grep -n "productionSessions" apps/api/src/modules/mes/application/queries/get-oee.handler.ts
# Natija: 2+ satr (import va ishlatish)

# === E. DTO tekshiruvi ===
grep -n "AdvanceStageSchema\|CompleteWithTripleSchema" apps/api/src/modules/mes/dto/mes.dto.ts
# Natija: 2 satr (har ikkisi mavjud)

# === F. Aggregate tekshiruvi ===
grep -n "MesStage\|advanceStage\|sozlashStartedAt" \
  apps/api/src/modules/mes/domain/aggregates/production-session.aggregate.ts
# Natija: 8+ satr (MesStage enum, advanceStage metod, maydonlar)

# === G. DDL migration faylini tekshirish ===
ls -la lib/db/src/schema/pp/migrations/d6-production-sessions-stage-cols.sql
# Natija: fayl mavjud
grep "APPROVED:" lib/db/src/schema/pp/migrations/d6-production-sessions-stage-cols.sql
# Natija: "-- APPROVED: <EGA_ISMI> <SANA>" — egasi to'ldiradi

# === H. DB-proof (agar backend ishlayotgan bo'lsa) ===
node _audit/q.cjs "SELECT count(*) as cnt FROM production_sessions"
# Natija: {cnt: N} (mes_sessions emas, production_sessions)

# === I. Backend boot tekshirish ===
curl -s http://localhost:3030/api/health | jq '.status'
# Natija: "ok"

# === J. OEE endpoint tekshirish ===
TOKEN=$(cat /tmp/test-token.txt 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then
  curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:3030/api/mes/oee?level=shop" | jq '.'
fi
```

**Edge holatlari:**

1. `production_sessions` bo'sh (0 qator) → OEE `[{level:'shop', oee:0, sessionCount:0}]` — to'g'ri (null emas)
2. stage ustunlari DDL APPROVED oldin → `advance-stage` endpoint 500 beradi (postgres "column does not exist") — bu kutilgan holat, DDL APPROVED kerak
3. `sof_mahsulot` noto'g'ri → Zod 400 beradi — DB ga YOZILMAYDI
4. `mes.module.ts` ga `AdvanceStageHandler` qo'shilmagan → CQRS 500 "No handler found" — ruxsat so'rash kerak

---

## 8. COMMIT

**Commit tartibi:**

### Commit 1: DTOlar (F5)

```bash
git add apps/api/src/modules/mes/dto/mes.dto.ts
git commit -m "feat(mes): AdvanceStage+CompleteWithTriple DTOlar (EP-MES-001/060) [P16]"
```

### Commit 2: Aggregate (F2)

```bash
git add apps/api/src/modules/mes/domain/aggregates/production-session.aggregate.ts
git commit -m "feat(mes): MesStage enum + advanceStage() + 3-bosqich timestamps (EP-MES-001) [P16]"
```

### Commit 3: OEE handler to'liq qayta yozish (F1)

```bash
git add apps/api/src/modules/mes/application/queries/get-oee.handler.ts
git commit -m "fix(mes): GetOeeHandler — production_sessions, 4-daraja OEE, to'g'ri formulalar (EP-MES-014) [P16]"
```

### Commit 4: AdvanceStage handler yaratish (F3)

```bash
git add apps/api/src/modules/mes/application/commands/advance-stage.handler.ts
git commit -m "feat(mes): AdvanceStageHandler CQRS command — SOZLASH→ASOSIY→YAKUNLASH (EP-MES-001) [P16]"
```

### Commit 5: Controller yangilash (F4)

```bash
git add apps/api/src/modules/mes/presentation/mes-sessions.controller.ts
git commit -m "feat(mes): /advance-stage + /complete-with-triple endpointlar (EP-MES-001/060) [P16]"
```

### Commit 6: Drizzle schema (F6) — DDL GATED

```bash
git add lib/db/src/schema/pp/pp-iot.ts
git commit -m "feat(db): production_sessions stage+timestamps Drizzle schema (DDL GATED, EP-MES-001) [P16]"
```

### Commit 7: DDL migration fayl — GATED

```bash
git add lib/db/src/schema/pp/migrations/d6-production-sessions-stage-cols.sql
git commit -m "feat(db): d6 migration GATED — production_sessions stage cols (egasi ruxsati kerak) [P16]"
```

### Commit 8: mes.module.ts — FAQAT EGASI RUXSATIDAN KEYIN

```bash
# EGA RUXSATI OLINGANDAN SO'NG:
git add apps/api/src/modules/mes/mes.module.ts
git commit -m "feat(mes): AdvanceStageHandler mes.module.ts handlers[] ga ro'yxatdan o'tdi [P16]"
```

**HECH QACHON:**
```bash
git add -A     # TAQIQ
git add .      # TAQIQ
```

---

## YAKUNIY HOLAT HISOBOTI (Commit ohirida egaga ko'rsatiladi)

```
P16 — MES OEE engine fix + 3-stage lifecycle DDL (CONFORM-UPDATED 2026-06-19)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAJARILDI:
  ✅ F1: GetOeeHandler — mes_sessions → production_sessions, 4-daraja, to'g'ri formulalar
  ✅ F1 CONFORM: calcOee sozlash vaqti ajratadi (sozlashStartedAt-sozlashEndedAt delta)
              setupSegmented flag javobda — DDL GATED null bo'lsa 0 fallback
  ✅ F2: ProductionSession aggregate — MesStage enum, advanceStage(), 3-bosqich timestamps
  ✅ F3: AdvanceStageHandler — yangi CQRS command handler
  ✅ F4 CONFORM: /complete-with-triple → 501 NOT_IMPLEMENTED (avval soxta 200 edi — Q-40 fix)
  ✅ F5: mes.dto.ts — AdvanceStageSchema, CompleteWithTripleSchema (uchlik .refine())
  ✅ F6: pp-iot.ts Drizzle schema — stage + 5 timestamp ustun (DDL GATED)
  ✅ Migration d6 — YOZILDI, ISHGA TUSHIRILMADI (egasi ruxsati shart)

DEFER (ruxsat yoki boshqa paket kerak — §9 jadval):
  ⏳ mes.module.ts — AdvanceStageHandler handlers[] (ruxsat kutilmoqda)
  ⏳ d6 migration ishga tushirish (egasi ruxsati kutilmoqda)
  ⏳ complete-with-triple to'liq DB yozuv — P17 (CompleteSessionHandler extend)
  ⏳ OEE-target alert (EP-MES-015) — Phase6 DDL + EGASI QIYMATI KERAK
  ⏳ Smena handover (EP-MES-023) — alohida to'lqin
  ⏳ Bonus A/B/C (EP-MES-027) — P27/28 HR paket + EGASI QIYMATI KERAK
  ⏳ ~30 mashina seed — P44/P45 IOT paket (kross-paket to'qnashuv hal qilinsin)
  ⏳ TB-checklist tablet oqimi — P17 DDL APPROVED keyin
  ⏳ norma_hourly Performance — Phase 6 DDL + EGASI QIYMATI KERAK

TEKSHIRUVLAR:
  BE tsc: 0 xato
  FE tsc: 0 xato
  reviewer-result-pattern: FAIL 0
  reviewer-array-safety: FAIL 0
  DB-proof: production_sessions dan o'qilmoqda
  OEE 4-daraja: machine/shift/brigade/shop barchasi ishlaydi
  Uchlik tenglama: noto'g'ri → 400, to'g'ri → 501 (Q-40 conform ✅)
  setupSegmented: true/false flag javobda (sozlash ajratish holati)

COMMITS: 7 (mes.module.ts = 8-chi, ruxsatdan keyin)
```

---

## QUSHIMCHA: MES OEE Formulasi Vizyon Xaritasi

```
EP-MES-014 (owner override) — 4-daraja OEE
┌─────────────────────────────────────────────────────────────────┐
│  Daraja      │  groupKey          │  Endpoint parametri         │
├─────────────────────────────────────────────────────────────────┤
│  MASHINA     │  equipmentId       │  ?level=machine             │
│  SMENA       │  sana (YYYY-MM-DD) │  ?level=shift               │
│  BRIGADA     │  workerId          │  ?level=brigade             │
│  SEX (jami)  │  'all'             │  ?level=shop (default)      │
└─────────────────────────────────────────────────────────────────┘

EP-MES-001 — 3-bosqich lifecycle:

CHECKLIST_PENDING
      │ start()
      ▼
  RUNNING [SOZLASH]
      │ advanceStage()
      ▼
  RUNNING [ASOSIY]
      │ advanceStage()
      ▼
  RUNNING [YAKUNLASH]
      │ complete(triple)  ← EP-MES-060 uchlik tekshiruv
      ▼
  COMPLETED
      │ moveToQc()
      ▼
  SENT_TO_QC

OEE formula (hozirgi implementatsiya):
  Availability = runningTime / (runningTime + stoppedTime)
                 Phase 2: sozlashEndedAt - sozlashStartedAt ayiriladi

  Performance  = actualQuantity / targetQuantity
                 Phase 6: norma_hourly * netRunHours ishlatiladi

  Quality      = (actualQuantity - defectQuantity) / actualQuantity
                 = sof_mahsulot / umumiy_son (EP-MES-060)

  OEE = A × P × Q × 100%
```

---

---

## §9 — CONFORM-FIX DEFER JADVALI (00-INTERVYU-MOSLIK.md §2 MES qatori)

> Bu bo'lim `00-INTERVYU-MOSLIK.md` dagi MES QISMAN moslik tuzatishlarini to'liq ko'rsatadi.
> P16 doirasida bajarilganlar ✅, qolganlari DEFER sababi bilan.

| # | Egasi qatori / EP kodi | Holat | Izoh |
|---|------------------------|-------|------|
| 1 | **OEE sozlash vaqti ajratish** (EP-MES-014/001) | ✅ **P16 DA AMALGA OSHIRILDI** | `calcOee` funksiyasi sozlashStartedAt→sozlashEndedAt delta ni ajratadi. DDL GATED ustunlar null bo'lsa 0 fallback. Phase 2 = DDL APPROVED keyin haqiqiy qiymat. |
| 2 | **OEE-target alert** (EP-MES-015) | ⏳ **DEFER — Phase 6 DDL** | Egasi: "OEE target mashina/sexga sozlanadigan" — `equipment.oee_target` ustuni P12+Phase6 DDL keyin. **EGASI QIYMATI KERAK** (hardcode taqiq). Alert logikasi DDL APPROVED keyin P12 + separate listener. |
| 3 | **Smena handover** (EP-MES-023, EP-COR-099) | ⏳ **DEFER — alohida paket** | Egasi Q167: MES cron 5-daqiqada tugash vaqti tekshiradi; 15-daqiqa o'tsa avto-handover. `mes_shift_handovers` jadvali mavjud (mes-schema.ts), lekin cron + FE oqimi qurilmagan. P15 scope da emas. Keyingi to'lqin. |
| 4 | **Bonus A/B/C tiers** (EP-MES-027) | ⏳ **DEFER — HR tasdiq zanjiri** | Egasi Q380: "Bonus A toifaga = belgilangan X so'm (foiz emas)". HR tasdiq ekrani kerak. Hozir `MesToHr360Event` payload uzatilmoqda (P17 scope). Bonus summasi **EGASI QIYMATI KERAK** — hardcode taqiq. P27/P28 HR paketi bilan birga quriladi. |
| 5 | **~30 mashina seed** (EP-IOT-031) | ⏳ **DEFER — IOT P44/P45** | Egasi: "Станоклар kitob nomlari" (SM-52, SM-72, KBA-105, Tigellar...). Bu IOT paketiga tegishli seed (P44). 00-INTERVYU-MOSLIK §1 3-daraja: P44╳P45 to'qnashuv muammo — birinchi P44/P45 kross-paket to'qnashuvi hal qilinishi kerak, so'ng seed. |
| 6 | **TB-checklist tablet oqimi** (EP-MES-004, EP-HR-079, EP-COR-130) | ⏳ **DEFER — P17 DDL GATED** | `mes_safety_checklist_items` DDL P17 da GATED. Tablet oqimi (IoT endpoint + FE modal) P17 DDL APPROVED keyin. P16 Zod schema bor (`passChecklist()` aggregate metodi). |
| 7 | **complete-with-triple DB yozuv** (EP-MES-060) | ⏳ **DEFER — P17 scope** | Endpoint 501 qaytaradi (Q-40 conform). Real yozuv: P17 `CompleteSessionHandler` ga `triple` parametr + `production_sessions` UPDATE. |
| 8 | **norma_hourly OEE Performance** (EP-MES-039) | ⏳ **DEFER — Phase 6 DDL** | `equipment.norma_hourly` P12+Phase6 DDL. **EGASI QIYMATI KERAK** per mashina turi. |

> **P16 asosiy natija:** OEE Availability sozlash-vaqti ajratish logikasi YOZILDI (DDL GATED
> ustunlar null bo'lsa 0 fallback — xavfsiz). complete-with-triple 501 HONEST (Q-40 conform).
> 4 ta defer — barchangiz owner-gated yoki boshqa paket scope. Hardcode taqiq qoidasi saqlandi.

---

*P16 direktiva: 2026-06-19 (CONFORM-UPDATED 2026-06-19) · Wave 2 · ddlGate=true · Q-47 muvofiq (≥1000 satr)*
