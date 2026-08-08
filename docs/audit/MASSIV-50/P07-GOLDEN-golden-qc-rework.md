# P07 — GOLDEN: GOLDEN QC correctness + 3-decision MES rework bridge

> **Agent:** P07 · **Wave:** 2 · **DependsOn:** P06, P02  
> **DDL Gate:** HA (migration fayli yoziladi, lekin GATED — egasi ruxsatisiz ISHGA TUSHIRILMAYDI)  
> **Sana:** 2026-06-19

---

## 0. ROL VA QOIDALAR

**Siz BAJARUVCHI agentsiz (🟢).** Faqat quyida ko'rsatilgan OWNED-FILE ro'yxatiga teging.
Boshqa fayl kerak bo'lsa — TO'XTANG, egaga flag qiling, supurib ketmang.
Har qadam oxirida `git add <aniq-fayl>` + commit. Hech qachon `git add -A` yoki `git add .` ishlatmang.

---

### QOIDALAR BLOKI (Q-47 — har direktivada bo'lishi shart)

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` qaytarish TAQIQ.
2. **@Body** Zod bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>` yoki `sql\`...\``).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46**: ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI** (Q-23/Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI** (Q-35): `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi?).
11. **"V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Wave 2** — P06 (MES to'liq tugashi) va P02 (schema/invariants API barrel) completeda boshlanadi. P02 ning `qc_inspections` ustun invariantlariga tayaning; o'zingiz ustun qo'shsangiz, shu direktivadagi DDL gate orqali o'ting.

---

## 1. IZOLYATSIYA MANIFESTI

Siz **FAQAT** quyidagi 4 ta faylga tegishiz:

```
Uzbek-Language-Module/apps/api/src/modules/qc/infrastructure/event-handlers/mes-completed.listener.ts
Uzbek-Language-Module/apps/api/src/modules/qc/application/commands/create-inspection.handler.ts
Uzbek-Language-Module/apps/api/src/modules/mes/infrastructure/event-handlers/qc-failed-rework.listener.ts   ← YANGI FAYL (yaratiladi)
Uzbek-Language-Module/apps/api/src/modules/mes/mes.module.ts
```

Qo'shimcha DDL migration fayli (GATED):

```
Uzbek-Language-Module/apps/api/src/shared/db/migrations/p07-qc-inspections-aql-decision.sql   ← GATED
```

**Boshqa birorta fayl o'zgartirilmaydi.** Agar boshqa faylni o'zgartirmasdan ishni bajara olmasangiz — TO'XTANG va egaga aniq flag qiling: qaysi fayl, nima uchun, qaysi agent egasi.

### DDL Gate qoidasi
`qc_inspections` jadvaliga `aql_level`, `decision`, `sales_order_id` ustunlarini qo'shish DDL talab qiladi. Siz migration SQL faylini yozasiz va uni `-- GATED` deb belgilaysiz. Egasi "APPROVED" berganda va P02 merge bo'lganda migration ishga tushiriladi. Sizning kod o'zgartirishlaringiz ushbu ustunlarni `COALESCE(..., NULL)` shaklida yumshoq ishlatadi — ustun mavjud bo'lmasa NULL, mavjud bo'lsa to'g'ri qiymat. Bu P02 bilan parallel ishlashga imkon beradi.

---

## 2. VIZYON

### 2.1 Oltin zanjir (Golden Thread) konteksti

```
SD → PP → MES → QC → WMS → FIN
               ↓      ↓
         [session_id] [inspectionId]
              ↕ (P07 vazifasi)
         [sales_order_id] bog'liq bo'lishi shart
```

EuroPrint ERP ning QC moduli uch qaror chiqaradi (3-decision):
- **PASS** → WMS ga `QcPassedEvent` → warehouse_stock UPSERT
- **FAIL → REWORK** → MES ga qayta ishlov sessiyasi ochilishi shart (`QcFailedEvent` → `QcFailedReworkListener`)
- **FAIL → SCRAP** → WMS ga hisobdan chiqarish (bu P07 ga tegishli emas — WMS agenti)

### 2.2 P07 tuzatishi kerak bo'lgan 3 muammo

**Muammo A — MesCompletedListener: session_id o'rniga sales_order_id uzatilishi shart**

`MesCompletedEvent` hozirda faqat `sessionId` (production_sessions.id) uzatadi. `MesCompletedListener` esa `qc_inspections.order_id` ga ushbu `sessionId` ni yozadi. Ammo `qc_inspections.order_id` semantikasi = `sales_orders.id` (savdo buyurtmasi). Session ID va sales order ID — ikki xil tushuncha.

`production_sessions` jadvalida `order_id` ustuni mavjud bo'lib, u `sales_order_id` ni saqlaydi (pp-released-mes.listener.ts:30 da aniq ko'rsatilgan: `po.sales_order_id` → `order_id`). Shuning uchun listener `production_sessions` dan `order_id` ni o'qib, uni `qc_inspections.order_id` ga yozishi kerak.

**Qabul mezoni A:** `qc_inspections.order_id` = `production_sessions.order_id` (ya'ni `sales_orders.id`), session id emas.

**Muammo B — CreateInspectionHandler: pre-claim bug**

`CreateInspectionHandler` (fayl: create-inspection.handler.ts) `items_passed = ${command.sampleSize}` deb INSERT qiladi — ya'ni hali tekshirilmagan namuna darhol "o'tdi" deb belgilanadi. Bu noto'g'ri: inspection endigina ochilgan, hali hech qanday qaror yo'q. Tekshiruv ochiladigan paytda `items_passed = 0` bo'lishi kerak.

**Qabul mezoni B:** `CREATE` da `items_passed = 0`; `items_checked = command.sampleSize` (necha dona tekshirilishi rejalashtirilgan).

**Muammo C — QcFailedEvent → MES rework sessiyasi yo'q**

`SubmitInspectionHandler` (fayl: submit-inspection.handler.ts — **bu faylga tegmaysiz**, faqat o'qing) `QcFailedEvent` chiqaradi. Lekin hech qaysi listener uni qabul qilib, MES da rework sessiyasi ochmaydi. Bu "golden thread" ning uzilgan bo'g'ini.

Siz yangi `QcFailedReworkListener` yaratasiz va uni `mes.module.ts` ga ro'yxatdan o'tkazasiz.

**Qabul mezoni C:** `QcFailedEvent` chop etilganda, `production_sessions` jadvalida `rework` status bilan yangi qator INSERT qilinishi kerak. DB-proof: `SELECT * FROM production_sessions WHERE status = 'rework' ORDER BY id DESC LIMIT 5` — yangi qator ko'rinadi.

### 2.3 AQL va decision ustunlari (DDL — GATED)

`qc_inspections` jadvalida hozir `aql_level` va `decision` ustunlari yo'q. Vizyon bo'yicha:
- `aql_level` — ISO 2859-1 standartiga ko'ra namuna hajmini belgilaydi (masalan: `'AQL_1.0'`, `'AQL_2.5'`, `'AQL_4.0'`)
- `decision` — tekshiruv yakuni: `'PASS'` | `'REWORK'` | `'SCRAP'` | NULL (hali qaror yo'q)
- `sales_order_id` — qaysi savdo buyurtmasiga tegishli ekani (hozir `order_id` ishlatilmoqda, lekin semantika noaniq)

Migration GATED — egasi ruxsati bilan ishga tushiriladi. Kod ushbu ustunlarni mavjud bo'lsa ishlatadi, yo'q bo'lsa NULL qoldiradi.

### 2.4 Egasi talab qilgan 3 ta QC feature — P07 skopiga qo'shildi

> **Moslik tuzatishi (00-INTERVYU-MOSLIK §2 modul GOLDEN, QC MISSING features):**
> OCHIQ-JAVOBLAR-2026-06-08.md QC bo'limida egasi aniq talab qilgan, lekin P07
> asl direktivasida yo'q edi. Quyida ularning sxema va mantiq talablari keltirilgan.

#### 2.4.1 EP-QC-072 — Sort narx-koeffitsienti (1/2/3-sort + brak)

**Egasi:** "Sort = 1/2/3-sort + brak, har biriga narx koeffitsienti — yaroqli mahsulot
tashlanmaydi, arzonroq sotiladi."

**Talablar:**
- `qc_inspections` da `sort_grade` ustuni: `'SORT_1'` | `'SORT_2'` | `'SORT_3'` | `'BRAK'` | NULL
- Har sort uchun narx koeffitsienti `qc_sort_price_config` master-data jadvalidan o'qiladi:
  ```
  sort_grade  | price_ratio | description
  SORT_1      | 1.00        | To'liq narx (standart)
  SORT_2      | <egasi>     | Kamroq narx — EGASI QIYMATI KERAK
  SORT_3      | <egasi>     | Yanada kamroq — EGASI QIYMATI KERAK
  BRAK        | 0.00        | Sotilmaydi / utilizatsiya
  ```
- `SubmitInspectionHandler` (P07 owned FILE EMAS — faqat kontekst) `sort_grade` ni
  belgilash uchun QC tekshiruvchisi kiritgan `items_grade` dan foydalanadi.
- **EGASI QIYMATI KERAK:** Sort 2 va Sort 3 narx nisbatlari egasi belgilaydi —
  hardcode TAQIQ (masalan: Sort_2=0.70, Sort_3=0.40 — egasi tasdiqlagan emas).

**DDL (GATED — p07-qc-inspections-aql-decision.sql ga qo'shiladi):**
```sql
-- Sort grade: 1/2/3-sort yoki brak (EP-QC-072)
ADD COLUMN IF NOT EXISTS sort_grade VARCHAR(10) DEFAULT NULL
  CHECK (sort_grade IS NULL OR sort_grade IN ('SORT_1', 'SORT_2', 'SORT_3', 'BRAK'));

-- Sort narx konfiguratsiyasi jadvali (master-data, sozlanadigan)
-- GATED: egasi ruxsati bilan
CREATE TABLE IF NOT EXISTS qc_sort_price_config (
  id          SERIAL PRIMARY KEY,
  sort_grade  VARCHAR(10) NOT NULL UNIQUE
    CHECK (sort_grade IN ('SORT_1', 'SORT_2', 'SORT_3', 'BRAK')),
  price_ratio NUMERIC(5,4) DEFAULT NULL, -- EGASI QIYMATI KERAK (0.0000–1.0000)
  description TEXT,
  updated_by  INTEGER,
  updated_at  TIMESTAMP DEFAULT NOW()
);
-- APPROVED: <owner> <date>

-- Seed (EGASI QIYMATI KERAK — price_ratio NULL qoladi):
INSERT INTO qc_sort_price_config (sort_grade, price_ratio, description)
VALUES
  ('SORT_1', 1.0000, 'To''liq narx (standart sifat)'),
  ('SORT_2', NULL,   'EGASI QIYMATI KERAK: 2-sort narx nisbati (0.0–1.0)'),
  ('SORT_3', NULL,   'EGASI QIYMATI KERAK: 3-sort narx nisbati (0.0–1.0)'),
  ('BRAK',   0.0000, 'Brak — sotilmaydi, utilizatsiya')
ON CONFLICT (sort_grade) DO NOTHING;
```

**Kod talabi (`create-inspection.handler.ts` — OWNED F2):**
- INSERT da `sort_grade = NULL` (tekshiruv boshida hali sort belgilanmaydi — SubmitHandler belgilaydi).

#### 2.4.2 EP-QC-005 — Defekt og'irlik bloki (3 daraja)

**Egasi:** "Defekt og'irlik = 3 daraja: kritik 0% o'tmaydi / jiddiy / kichik kosmetik
chegara bilan."

**Talablar:**
- `qc_defect_weight` enum/lookup: `'CRITICAL'` | `'MAJOR'` | `'MINOR'`
- Qaror qoidalari (master-data):
  - `CRITICAL`: bitta topilsa ham → avtomatik `FAIL` (0% tolerans)
  - `MAJOR`: AQL Ac/Re qoida bo'yicha (namuna hajmiga qarab)
  - `MINOR`: yuqori tolerans chegara (egasi belgilaydi)
- `qc_defects` jadvali (allaqachon mavjud bo'lishi kerak) da `defect_weight VARCHAR(10)` ustuni.
- **Qaror logikasi (SubmitInspectionHandler — P07 owned FILE EMAS):** tekshiruv
  submit bo'lganda `qc_defects.defect_weight = 'CRITICAL'` topilsa → `decision = 'FAIL'`,
  inson tasdiqsiz (egasi "kritik = 0% o'tmaydi" degan — bu avtomatik blok, inson tasdig'i kerak emas).

**DDL (GATED — p07-qc-inspections-aql-decision.sql ga qo'shiladi):**
```sql
-- qc_defects jadvali mavjud bo'lsa defect_weight ustuni qo'shiladi:
-- GATED: egasi ruxsati bilan
ALTER TABLE qc_defects
  ADD COLUMN IF NOT EXISTS defect_weight VARCHAR(10) DEFAULT 'MINOR'
    CHECK (defect_weight IN ('CRITICAL', 'MAJOR', 'MINOR'));

-- Kritik defekt qoidasi (master-data, sozlanadigan):
CREATE TABLE IF NOT EXISTS qc_defect_weight_rules (
  defect_weight  VARCHAR(10) NOT NULL PRIMARY KEY
    CHECK (defect_weight IN ('CRITICAL', 'MAJOR', 'MINOR')),
  auto_fail      BOOLEAN NOT NULL DEFAULT FALSE, -- kritik uchun TRUE
  tolerance_pct  NUMERIC(5,2) DEFAULT NULL,      -- EGASI QIYMATI KERAK (minor/major uchun)
  description    TEXT
);
-- APPROVED: <owner> <date>

INSERT INTO qc_defect_weight_rules (defect_weight, auto_fail, tolerance_pct, description)
VALUES
  ('CRITICAL', TRUE,  0.00, 'Kritik — bitta topilsa ham avtomatik FAIL (0% tolerans)'),
  ('MAJOR',    FALSE, NULL, 'Jiddiy — AQL Ac/Re qoida bo''yicha. EGASI QIYMATI KERAK.'),
  ('MINOR',    FALSE, NULL, 'Kichik kosmetik — yuqori chegara. EGASI QIYMATI KERAK.')
ON CONFLICT (defect_weight) DO NOTHING;
```

**Kod talabi (`mes-completed.listener.ts` — OWNED F1, `create-inspection.handler.ts` — OWNED F2):**
- QC inspection ochiladigan paytda `defect_weight` tekshiruvi qo'llanmaydi (hali defekt yo'q).
- `QcFailedReworkListener` (OWNED F — yangi fayl) `QcFailedEvent` ni `reason` bilan qabul qiladi —
  agar reason `'CRITICAL_DEFECT'` bo'lsa rework emas, `SCRAP` bo'lishi kerak (P07 scope tashqarisida,
  lekin `reason` field `qc-failed-rework.listener.ts` da filter qilinsin):
  ```typescript
  // CRITICAL defekt → rework emas, WMS Scrap yo'li (bu listener faqat REWORK yo'li)
  if (event.reason === 'CRITICAL_DEFECT') {
    this.logger.log({ inspectionId: event.inspectionId }, 'Critical defect — SCRAP yo\'li (WMS), rework ochilmadi');
    return; // WMS listener hal qiladi
  }
  ```

#### 2.4.3 EP-QC-090 — Brak sababchisi (kirim braki vs shu bosqich braki)

**Egasi:** "Brak sababchisi = 'kirim braki' (oldingi bosqich) va 'shu bosqich braki' alohida
(adolatli sabab)."

**Talablar:**
- `qc_inspections` da `defect_source` ustuni: `'INCOMING'` | `'CURRENT_STAGE'` | `'UNKNOWN'` | NULL
  - `INCOMING` = avvalgi bosqich (WMS/PP/MES) dan kelgan brak
  - `CURRENT_STAGE` = ushbu QC tekshiruv bosqichida aniqlangan brak
  - `UNKNOWN` = aniqlanmagan (default)
- QC tekshiruvchisi inspection submit paytida `defect_source` ni belgilaydi.
- Direktor dashboard va QC analitikasi uchun `defect_source` bo'yicha filtr/guruhlash.

**DDL (GATED — p07-qc-inspections-aql-decision.sql ga qo'shiladi):**
```sql
-- Brak sababchisi (EP-QC-090)
ADD COLUMN IF NOT EXISTS defect_source VARCHAR(20) DEFAULT 'UNKNOWN'
  CHECK (defect_source IS NULL
      OR defect_source IN ('INCOMING', 'CURRENT_STAGE', 'UNKNOWN'));
-- APPROVED: <owner> <date>
```

**Kod talabi:**
- `create-inspection.handler.ts` (OWNED F2): INSERT da `defect_source = 'UNKNOWN'` default.
- `mes-completed.listener.ts` (OWNED F1): MES bosqichidan keyin ochiladigan inspection
  `defect_source = 'CURRENT_STAGE'` bilan boshlanadi (chunki MES bosqichi tekshirilmoqda).
  INSERT ga qo'shimcha:
  ```typescript
  // EP-QC-090: MES completed → inspection is checking current MES stage output
  // defect_source = 'CURRENT_STAGE' (default 'UNKNOWN' o'rniga)
  await db.execute(sql`
    INSERT INTO qc_inspections
      (order_id, reference_type, status, items_checked, items_passed, items_failed,
       defect_source, created_at, updated_at)
    VALUES
      (${salesOrderId}, 'mes_session', 'pending', 0, 0, 0,
       'CURRENT_STAGE', NOW(), NOW())
  `);
  ```
  Agar `defect_source` ustuni DDL migration kelmaguncha mavjud bo'lmasa — `COALESCE` yoki
  `IF EXISTS` tekshiruvi bilan xavfsiz INSERT yozing (ustun yo'q bo'lsa — oddiy INSERT,
  ustun bor bo'lsa — `defect_source` ham qo'shiladi).

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud fayllar va holat

**`mes-completed.listener.ts`** — MAVJUD, BUZUQ
- Fayl: `Uzbek-Language-Module/apps/api/src/modules/qc/infrastructure/event-handlers/mes-completed.listener.ts`
- Muammo (satr 29–30): `order_id = ${event.sessionId}` — bu XATO. `sessionId` = `production_sessions.id`, lekin `qc_inspections.order_id` `sales_orders.id` bo'lishi kerak.
- Joriy holat: listener `MesCompletedEvent.sessionId` (integer) ni `qc_inspections.order_id` ga yozadi. Bu semantik xato — QC inspection keyinchalik savdo buyurtmasi bo'yicha qidirilganda, session id bilan sales order id mos tushmaydi.
- Tuzatish: `production_sessions WHERE id = ${event.sessionId}` dan `order_id` ni o'qib, uni `qc_inspections.order_id` ga yozish.

```typescript
// HOZIR (XATO) — satr 28-30:
await db.execute(sql`
  INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, created_at, updated_at)
  VALUES (${event.sessionId}, 'mes_session', 'pending', 0, 0, 0, NOW(), NOW())`);
```

**`create-inspection.handler.ts`** — MAVJUD, BUZUQ
- Fayl: `Uzbek-Language-Module/apps/api/src/modules/qc/application/commands/create-inspection.handler.ts`
- Muammo (satr 38): `${command.sampleSize}` items_passed o'rnida — ya'ni endigina ochilgan inspection "o'tdi" deb belgilanadi.
- Joriy holat (satr 33–43):
  ```typescript
  INSERT INTO qc_inspections
    (status, inspector_id, items_checked, items_passed, items_failed, reference_type)
  VALUES
    ('pending',
     ${command.inspectorId},
     ${command.sampleSize},
     ${command.sampleSize},  // ← BU XATO: items_passed = sampleSize (pre-claim)
     0,
     ${referenceType})
  ```

**`qc-failed-rework.listener.ts`** — MAVJUD EMAS (yaratiladi)
- Glob natijasi: fayl topilmadi.
- `QcFailedEvent` hozir hech qaysi listener tomonidan rework maqsadida qabul qilinmaydi.
- `mes.module.ts` da `QcFailedReworkListener` ro'yxatda yo'q.

**`mes.module.ts`** — MAVJUD, TO'LDIRILADI
- Fayl: `Uzbek-Language-Module/apps/api/src/modules/mes/mes.module.ts`
- Hozirgi `listeners` massivi (satr 41–45): faqat `LmsCertExpiredMesListener`, `LmsCertExpiredLiveMesListener`, `PpReleasedMesListener`.
- `QcFailedReworkListener` import va listeners massiviga qo'shilishi shart.

### 3.2 Tegishli kontekst (faqat o'qing, o'zgartirmang)

- `QcFailedEvent` manbai: `Uzbek-Language-Module/apps/api/src/modules/qc/domain/events/index.ts` satr 11–16
  ```typescript
  export class QcFailedEvent {
    constructor(
      readonly inspectionId: string,
      readonly orderId: number,
      readonly reason: string,
    ) {}
  }
  ```
- `MesCompletedEvent` manbai: `Uzbek-Language-Module/apps/api/src/modules/mes/domain/events/mes-completed.event.ts` satr 11–16
  ```typescript
  export class MesCompletedEvent {
    constructor(
      public readonly sessionId: number,
      public readonly timestamp: Date,
    ) {}
  }
  ```
- `production_sessions.order_id` = `sales_orders.id` (pp-released-mes.listener.ts satr 25–30 da tasdiqlangan: `po.sales_order_id` → `order_id` ustuniga yoziladi)
- `production_sessions` canonical jadval (mes_production_sessions — VIEW, to'g'ridan emas, canonical = `production_sessions`)

---

## 4. ISH (qadam-baqadam)

> Har qadam oxirida: `git add <aniq-fayl>` + commit. Hech qadam o'tkazib yuborilmaydi.

---

### Qadam 1 — `mes-completed.listener.ts` to'g'irlash

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/qc/infrastructure/event-handlers/mes-completed.listener.ts`

**Muammo:** `event.sessionId` to'g'ridan `qc_inspections.order_id` ga yozilmoqda. Bu semantik xato — `order_id` = `sales_orders.id` bo'lishi kerak, `production_sessions.id` emas.

**Tuzatish strategiyasi:**
1. `production_sessions` dan `order_id` (= `sales_orders.id`) ni o'qing.
2. O'qilgan `salesOrderId` ni `qc_inspections.order_id` ga yozing.
3. `reference_id` ustunida (uuid) `sessionId` ni saqlash imkoni yo'q (integer/uuid drift). `reference_type = 'mes_session'` + `order_id = salesOrderId` kombinatsiyasi yetarli kontekst beradi.
4. Agar `production_sessions` da hech qanday qator topilmasa (ya'ni session mavjud emas) — warning log chiqaring va qaytib keting (DB da inspection ochilmaydi).

**OLDIN (buzuq, satr 23–38):**
```typescript
async handle(event: MesCompletedEvent): Promise<void> {
  try {
    // order_id (integer) holds the completed MES session id — reference_id is a uuid column so the
    // numeric session id can't go there; reference_type='mes_session' clarifies the link.
    await db.execute(sql`
      INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, created_at, updated_at)
      VALUES (${event.sessionId}, 'mes_session', 'pending', 0, 0, 0, NOW(), NOW())`);
    this.logger.log(
      { sessionId: event.sessionId, timestamp: event.timestamp },
      'MES completed - Trigger 10: PENDING QC inspection opened',
    );
  } catch (error: unknown) {
    this.logger.error('MES completed listener error');
  }
}
```

**KEYIN (to'g'ri):**
```typescript
async handle(event: MesCompletedEvent): Promise<void> {
  try {
    // Step 1: production_sessions.order_id = sales_orders.id (pp-released-mes.listener yozadi)
    // sessionId emas, salesOrderId qc_inspections.order_id ga yozilishi kerak (golden-thread).
    type SessionRow = { order_id: unknown };
    const sessionRows = (await db.execute(
      sql`SELECT order_id FROM production_sessions WHERE id = ${event.sessionId} LIMIT 1`,
    )) as { rows?: SessionRow[] };
    const rows = Array.isArray(sessionRows?.rows) ? sessionRows.rows : [];
    if (rows.length === 0) {
      this.logger.warn(
        { sessionId: event.sessionId },
        'MES completed listener: production_sessions qatori topilmadi — QC inspection ochilmadi',
      );
      return;
    }
    const salesOrderId = Number(rows[0]?.order_id ?? 0);
    if (!salesOrderId) {
      this.logger.warn(
        { sessionId: event.sessionId },
        'MES completed listener: production_sessions.order_id = 0 — QC inspection ochilmadi',
      );
      return;
    }

    // Step 2: PENDING QC inspection — sales_orders.id orqali bog'liq
    await db.execute(sql`
      INSERT INTO qc_inspections
        (order_id, reference_type, status, items_checked, items_passed, items_failed, created_at, updated_at)
      VALUES
        (${salesOrderId}, 'mes_session', 'pending', 0, 0, 0, NOW(), NOW())
    `);
    this.logger.log(
      { sessionId: event.sessionId, salesOrderId, timestamp: event.timestamp },
      'MES completed - Trigger 10: PENDING QC inspection opened (sales_order_id bog\'liq)',
    );
  } catch (error: unknown) {
    this.logger.error(
      { sessionId: event.sessionId, err: String(error) },
      'MES completed listener error',
    );
  }
}
```

**Tekshiruv:**
- `qc_inspections.order_id` = `sales_orders.id` (production_sessions.order_id orqali)
- Session mavjud bo'lmasa yoki `order_id = 0` bo'lsa — xavfsiz warning + early return (crash yo'q)
- Array.isArray tekshiruvi (CLAUDE.md Qoida 2)

**Commit:**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/qc/infrastructure/event-handlers/mes-completed.listener.ts
git commit -m "fix(qc): mes-completed listener writes sales_order_id not session_id to qc_inspections.order_id (P07)"
```

---

### Qadam 2 — `create-inspection.handler.ts` pre-claim bug tuzatish

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/qc/application/commands/create-inspection.handler.ts`

**Muammo (satr 38):** `${command.sampleSize}` `items_passed` o'rnida — yangi ochilgan inspection da hali hech narsa tekshirilmagan, lekin `items_passed = sampleSize` deb yozilmoqda. Bu semantik xato: "tekshiriladigan" va "o'tgan" bir xil bo'lishi mumkin emas tekshiruv boshida.

**OLDIN (buzuq, satr 32–43):**
```typescript
const r = await db.execute(sql`
  INSERT INTO qc_inspections
    (status, inspector_id, items_checked, items_passed, items_failed, reference_type)
  VALUES
    ('pending',
     ${command.inspectorId},
     ${command.sampleSize},
     ${command.sampleSize},   // ← BU XATO: items_passed = sampleSize at open time
     0,
     ${referenceType})
  RETURNING id
`);
```

**KEYIN (to'g'ri):**
```typescript
// items_passed = 0 at open time — inspection endigina ochildi, hali hech narsa tekshirilmagan.
// items_checked = sampleSize — bu rejalashtirilgan namuna hajmi.
// items_passed va items_failed faqat SubmitInspectionHandler tomonidan yangilanadi.
const r = await db.execute(sql`
  INSERT INTO qc_inspections
    (status, inspector_id, items_checked, items_passed, items_failed, reference_type)
  VALUES
    ('pending',
     ${command.inspectorId},
     ${command.sampleSize},
     0,
     0,
     ${referenceType})
  RETURNING id
`);
```

To'liq handler (o'zgartirilgan qism faqat):

**OLDIN (to'liq, satr 27–54):**
```typescript
async execute(command: CreateInspectionCommand): Promise<Result<string>> {
  try {
    const referenceType = command.batchId ? 'batch' : 'order';
    const r = await db.execute(sql`
      INSERT INTO qc_inspections
        (status, inspector_id, items_checked, items_passed, items_failed, reference_type)
      VALUES
        ('pending',
         ${command.inspectorId},
         ${command.sampleSize},
         ${command.sampleSize},  // ← XATO
         0,
         ${referenceType})
      RETURNING id
    `);
    // ...
  }
}
```

**KEYIN (to'liq, o'zgartirilgan):**
```typescript
async execute(command: CreateInspectionCommand): Promise<Result<string>> {
  try {
    // RULE4_EXCEPTION: qc_inspections.id INTEGER in live DB (schema drift); raw SQL avoids cast error.
    // items_passed = 0 at open time (pre-claim bug fix: inspection just opened, nothing checked yet).
    // items_checked = planned sample size; items_passed updated by SubmitInspectionHandler on decision.
    const referenceType = command.batchId ? 'batch' : 'order';
    const r = await db.execute(sql`
      INSERT INTO qc_inspections
        (status, inspector_id, items_checked, items_passed, items_failed, reference_type)
      VALUES
        ('pending',
         ${command.inspectorId},
         ${command.sampleSize},
         0,
         0,
         ${referenceType})
      RETURNING id
    `);
    const rows = ((r as { rows?: Row[] }).rows) ?? [];
    const id = String(rows[0]?.['id'] ?? '');
    if (!id) return Err(AppErr('INTERNAL', 'Insert qc_inspections yieldga id qaytarmadi'));
    this.logger.log(`QC inspection created: id=${id}`);
    return Ok(id);
  } catch (e: unknown) {
    const msg = (e as Error)?.message || 'Tekshiruv yaratishda xatolik';
    this.logger.error(msg);
    return Err(AppErr('INTERNAL', msg));
  }
}
```

**Tekshiruv:**
- `POST /api/qc/inspections` → DB da yangi qator: `items_passed = 0`, `items_checked = sampleSize`
- `items_passed = 0` ≠ `sampleSize` — pre-claim bug yo'qolgan

**Commit:**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/qc/application/commands/create-inspection.handler.ts
git commit -m "fix(qc): create-inspection pre-claim bug — items_passed=0 at open time not sampleSize (P07)"
```

---

### Qadam 3 — `qc-failed-rework.listener.ts` yangi fayl yaratish

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/mes/infrastructure/event-handlers/qc-failed-rework.listener.ts`

**Maqsad:** `QcFailedEvent` ni qabul qilib, `production_sessions` jadvalida `rework` status bilan yangi sessiya ochadi. Bu goldenthread ning MES→QC→MES(rework) bo'g'inini yopadi.

**Biznes qoidasi:**
- `QcFailedEvent.orderId` = `sales_orders.id` (inspect qilingan buyurtma)
- `production_sessions` da ushbu `order_id` ga tegishli eng so'nggi `sent_to_qc` statusli sessiyani topamiz
- Yangi sessiya: `status = 'rework'`, `session_number = 'REWORK-<originalSessionId>'`, idempotent (allaqachon rework sessiya bo'lsa — skip)
- `equipment_id = 0`, `worker_id = 0` (operator keyinchalik belgilaydi — PP released sessiya xuddi shunday ochiladi)

**To'liq fayl:**

```typescript
/**
 * @module qc-failed-rework.listener
 * @description CQRS @EventsHandler for QcFailedEvent (golden-thread MES→QC→MES rework bridge).
 *
 *   When QC fails an inspection (SubmitInspectionHandler publishes QcFailedEvent), this listener
 *   opens a REWORK production session in MES so the operator sees it on the IoT tablet.
 *
 *   Lookup: find the most recent production_sessions row for the failed sales_order_id
 *   (production_sessions.order_id = sales_orders.id, written by pp-released-mes.listener).
 *   Insert a new session with status='rework' keyed to the same production_order_id.
 *   Idempotent: skips if an open rework session already exists for this production_order.
 *
 *   The 3-decision QC model:
 *     PASS    → WmsReceiveListener (not here, WMS agent)
 *     REWORK  → THIS LISTENER → production_sessions INSERT status='rework'
 *     SCRAP   → WmsScrapListener (not here, WMS agent)
 *
 *   P07 WAVE-2 fix. DependsOn: P06 (MES complete), P02 (schema barrel).
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { QcFailedEvent } from '@modules/qc/domain/events';

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcFailedReworkListener implements IEventHandler<QcFailedEvent> {
  private readonly logger = new Logger(QcFailedReworkListener.name);

  async handle(event: QcFailedEvent): Promise<void> {
    try {
      // Step 1: Find the most recent production session for this sales order.
      // production_sessions.order_id = sales_orders.id (canonical mapping from pp-released-mes.listener).
      type SessionRow = { id: unknown; production_order_id: unknown };
      const sessionResult = (await db.execute(sql`
        SELECT id, production_order_id
        FROM production_sessions
        WHERE order_id = ${event.orderId}
          AND status = 'sent_to_qc'
        ORDER BY id DESC
        LIMIT 1
      `)) as { rows?: SessionRow[] };

      const rows = Array.isArray(sessionResult?.rows) ? sessionResult.rows : [];
      if (rows.length === 0) {
        this.logger.warn(
          { orderId: event.orderId, inspectionId: event.inspectionId },
          'QcFailedReworkListener: sent_to_qc sessiya topilmadi — rework session ochilmadi',
        );
        return;
      }

      const originalSessionId = Number(rows[0]?.id ?? 0);
      const productionOrderId = Number(rows[0]?.production_order_id ?? 0);

      if (!originalSessionId || !productionOrderId) {
        this.logger.warn(
          { orderId: event.orderId, originalSessionId, productionOrderId },
          'QcFailedReworkListener: session yoki production_order_id aniqlanmadi',
        );
        return;
      }

      // Step 2: Idempotent INSERT — skip if a rework session already exists for this production_order.
      await db.execute(sql`
        INSERT INTO production_sessions
          (session_number, production_order_id, order_id, equipment_id, worker_id,
           status, target_quantity, started_at, created_at)
        SELECT
          ${'REWORK-' + String(originalSessionId)},
          ${productionOrderId},
          ${event.orderId},
          0,
          0,
          'rework',
          0,
          NOW(),
          NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM production_sessions
          WHERE production_order_id = ${productionOrderId}
            AND status = 'rework'
        )
      `);

      this.logger.log(
        {
          inspectionId: event.inspectionId,
          orderId: event.orderId,
          originalSessionId,
          productionOrderId,
          reason: event.reason,
        },
        'QC failed - Trigger 12: REWORK production session ochildi (MES→QC→MES golden-thread)',
      );
    } catch (error: unknown) {
      this.logger.error(
        { inspectionId: event.inspectionId, orderId: event.orderId, err: String(error) },
        'QcFailedReworkListener: rework session ochishda xatolik',
      );
    }
  }
}
```

**Diqqat — import yo'li:**
- `@modules/qc/domain/events` path aliasi mavjudligini tekshiring. Agar alias yo'q bo'lsa relative path ishlating:
  ```typescript
  import { QcFailedEvent } from '../../../qc/domain/events';
  ```
- `@shared/db` va `drizzle-orm` — mavjud (boshqa listenerlar shu import yo'llarini ishlatadi).

**Tekshiruv:**
- TypeScript `tsc` — 0 xato
- `@EventsHandler(QcFailedEvent)` dekoratori to'g'ri
- Fayl yaratildi: `qc-failed-rework.listener.ts`

**Commit:**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/mes/infrastructure/event-handlers/qc-failed-rework.listener.ts
git commit -m "feat(mes): QcFailedReworkListener — QC fail triggers rework production session in MES (P07)"
```

---

### Qadam 4 — `mes.module.ts` ga `QcFailedReworkListener` ro'yxatdan o'tkazish

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/mes/mes.module.ts`

**Hozirgi holat (satr 41–45):**
```typescript
const listeners = [
  LmsCertExpiredMesListener,       // Trigger 17 — daily-sweep variant (Wave 4 round-2)
  LmsCertExpiredLiveMesListener,   // Trigger 17 — realtime variant   (Wave 4 round-2)
  PpReleasedMesListener,           // #03 HOP-2 — PP released → open MES production session
];
```

**Keyin bo'lishi kerak:**
```typescript
import { QcFailedReworkListener } from './infrastructure/event-handlers/qc-failed-rework.listener';

const listeners = [
  LmsCertExpiredMesListener,       // Trigger 17 — daily-sweep variant (Wave 4 round-2)
  LmsCertExpiredLiveMesListener,   // Trigger 17 — realtime variant   (Wave 4 round-2)
  PpReleasedMesListener,           // #03 HOP-2 — PP released → open MES production session
  QcFailedReworkListener,          // P07 Trigger 12 — QC fail → REWORK production session
];
```

**O'zgartirish tartibi:**

1. Import qatorini qo'shing (satr 39 dan keyin):
   ```typescript
   import { QcFailedReworkListener } from './infrastructure/event-handlers/qc-failed-rework.listener';
   ```

2. `listeners` massiviga qo'shing (satr 44 dan keyin):
   ```typescript
   QcFailedReworkListener,          // P07 Trigger 12 — QC fail → REWORK production session
   ```

`providers` massivi `...listeners` orqali avtomatik qo'shiladi — boshqa o'zgartirish kerak emas.

**Tekshiruv:**
- `mes.module.ts` da `QcFailedReworkListener` import va listeners massivida ko'rinadi
- BE tsc 0

**Commit:**
```bash
git add Uzbek-Language-Module/apps/api/src/modules/mes/mes.module.ts
git commit -m "feat(mes): register QcFailedReworkListener in MesModule providers (P07)"
```

---

### Qadam 5 — DDL migration fayli (GATED)

**Fayl:** `Uzbek-Language-Module/apps/api/src/shared/db/migrations/p07-qc-inspections-aql-decision.sql`

**Bu fayl GATED — egasi ruxsati bo'lguncha ISHGA TUSHIRILMAYDI.**

```sql
-- P07 — GOLDEN: QC inspections — AQL/decision semantic columns + EP-QC-072/005/090 features
-- GATED: Faqat egasi "APPROVED" bergandan keyin ishga tushiriladi.
-- P02 ning schema barrel yangilanishi bilan birga bajarilishi kerak.
-- APPROVED: <owner> <date>
--
-- Maqsad:
--   1. qc_inspections.sales_order_id  — aniq FK (hozir order_id ishlatilmoqda, semantika noaniq)
--   2. qc_inspections.aql_level       — ISO 2859-1 namuna darajasi
--   3. qc_inspections.decision        — tekshiruv yakuni (PASS | REWORK | SCRAP)
--   4. qc_inspections.sort_grade      — EP-QC-072: 1/2/3-sort + brak (§2.4.1)
--   5. qc_inspections.defect_source   — EP-QC-090: brak sababchisi (§2.4.3)
--   6. qc_defect_weight_rules         — EP-QC-005: 3-daraja defekt og'irlik qoidasi (§2.4.2)
--   7. qc_sort_price_config           — EP-QC-072: sort narx koeffitsienti (§2.4.1)
--   8. qc_defects.defect_weight       — EP-QC-005: defekt og'irlik ustuni
--
-- Barcha ustunlar NULLABLE — mavjud qatorlarni buzib qo'ymaydi.
-- Mavjud order_id ustuni SAQLANADI (boshqa kod ishlatadi, olib tashlanmaydi).

-- ─── qc_inspections yangi ustunlar ───────────────────────────────────────────
ALTER TABLE qc_inspections
  ADD COLUMN IF NOT EXISTS sales_order_id INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aql_level       VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS decision        VARCHAR(10) DEFAULT NULL
    CHECK (decision IS NULL OR decision IN ('PASS', 'REWORK', 'SCRAP')),
  -- EP-QC-072: sort daraja (§2.4.1)
  ADD COLUMN IF NOT EXISTS sort_grade      VARCHAR(10) DEFAULT NULL
    CHECK (sort_grade IS NULL OR sort_grade IN ('SORT_1', 'SORT_2', 'SORT_3', 'BRAK')),
  -- EP-QC-090: brak sababchisi (§2.4.3)
  ADD COLUMN IF NOT EXISTS defect_source   VARCHAR(20) DEFAULT 'UNKNOWN'
    CHECK (defect_source IS NULL OR defect_source IN ('INCOMING', 'CURRENT_STAGE', 'UNKNOWN'));

-- Eslatma: sales_order_id ustuni uchun FK qo'shilmaydi (sales_orders.id bilan
-- FK bo'lsa, sales_orders bo'sh bo'lganda test ma'lumotlari kiritib bo'lmaydi).
-- FK keyinchalik owner qaroriga ko'ra qo'shiladi.

-- ─── Index ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_qc_inspections_sales_order_id
  ON qc_inspections(sales_order_id)
  WHERE sales_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qc_inspections_decision
  ON qc_inspections(decision)
  WHERE decision IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qc_inspections_sort_grade
  ON qc_inspections(sort_grade)
  WHERE sort_grade IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qc_inspections_defect_source
  ON qc_inspections(defect_source)
  WHERE defect_source IS NOT NULL;

-- ─── EP-QC-072: Sort narx konfiguratsiyasi (master-data, sozlanadigan) ────────
-- EGASI QIYMATI KERAK: Sort 2 va Sort 3 price_ratio egasi belgilaydi (§2.4.1).
CREATE TABLE IF NOT EXISTS qc_sort_price_config (
  id          SERIAL PRIMARY KEY,
  sort_grade  VARCHAR(10) NOT NULL UNIQUE
    CHECK (sort_grade IN ('SORT_1', 'SORT_2', 'SORT_3', 'BRAK')),
  price_ratio NUMERIC(5,4) DEFAULT NULL, -- EGASI QIYMATI KERAK: 0.0000–1.0000
  description TEXT,
  updated_by  INTEGER,
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO qc_sort_price_config (sort_grade, price_ratio, description)
VALUES
  ('SORT_1', 1.0000, 'To''liq narx (standart sifat)'),
  ('SORT_2', NULL,   'EGASI QIYMATI KERAK: 2-sort narx nisbati (0.0–1.0)'),
  ('SORT_3', NULL,   'EGASI QIYMATI KERAK: 3-sort narx nisbati (0.0–1.0)'),
  ('BRAK',   0.0000, 'Brak — sotilmaydi / utilizatsiya')
ON CONFLICT (sort_grade) DO NOTHING;

-- ─── EP-QC-005: Defekt og'irlik qoidalari (master-data, sozlanadigan) ─────────
-- EGASI QIYMATI KERAK: Major va Minor tolerans chegaralari (§2.4.2).
CREATE TABLE IF NOT EXISTS qc_defect_weight_rules (
  defect_weight  VARCHAR(10) NOT NULL PRIMARY KEY
    CHECK (defect_weight IN ('CRITICAL', 'MAJOR', 'MINOR')),
  auto_fail      BOOLEAN NOT NULL DEFAULT FALSE,
  tolerance_pct  NUMERIC(5,2) DEFAULT NULL,      -- EGASI QIYMATI KERAK
  description    TEXT
);

INSERT INTO qc_defect_weight_rules (defect_weight, auto_fail, tolerance_pct, description)
VALUES
  ('CRITICAL', TRUE,  0.00, 'Kritik — bitta topilsa ham avtomatik FAIL (0% tolerans)'),
  ('MAJOR',    FALSE, NULL, 'Jiddiy — AQL Ac/Re bo''yicha. EGASI QIYMATI KERAK.'),
  ('MINOR',    FALSE, NULL, 'Kichik kosmetik — yuqori chegara. EGASI QIYMATI KERAK.')
ON CONFLICT (defect_weight) DO NOTHING;

-- ─── EP-QC-005: qc_defects jadvali defect_weight ustuni ──────────────────────
-- qc_defects jadvali mavjud bo'lsa:
ALTER TABLE qc_defects
  ADD COLUMN IF NOT EXISTS defect_weight VARCHAR(10) DEFAULT 'MINOR'
    CHECK (defect_weight IN ('CRITICAL', 'MAJOR', 'MINOR'));
```

**GATED belgisi:** Bu faylni yozing, lekin `psql` yoki migration runner orqali ISHGA TUSHIRMANG. Commit qiling (faqat fayl).

**Commit:**
```bash
git add Uzbek-Language-Module/apps/api/src/shared/db/migrations/p07-qc-inspections-aql-decision.sql
git commit -m "feat(qc/ddl): GATED — qc_inspections AQL/decision/sales_order_id columns migration (P07, needs owner APPROVED)"
```

---

## 5. DDL (GATED)

Yuqorida §4 Qadam 5 da to'liq SQL keltirilgan.

**Qisqacha (§2.3 + §2.4 da qo'shilgan barcha ustunlar):**
- `qc_inspections.sales_order_id INTEGER DEFAULT NULL` — aniq savdo buyurtmasi bog'lanishi
- `qc_inspections.aql_level VARCHAR(20) DEFAULT NULL` — ISO 2859-1: `'AQL_1.0'` | `'AQL_2.5'` | `'AQL_4.0'`
- `qc_inspections.decision VARCHAR(10) DEFAULT NULL CHECK (IN ('PASS','REWORK','SCRAP'))` — yakuniy qaror
- `qc_inspections.sort_grade VARCHAR(10) DEFAULT NULL` — **EP-QC-072**: 1/2/3-sort + brak
- `qc_inspections.defect_source VARCHAR(20) DEFAULT 'UNKNOWN'` — **EP-QC-090**: brak sababchisi
- `qc_sort_price_config` — **EP-QC-072**: sort narx koeffitsienti (master-data; EGASI QIYMATI KERAK)
- `qc_defect_weight_rules` — **EP-QC-005**: 3-daraja defekt og'irlik qoidalari (EGASI QIYMATI KERAK)
- `qc_defects.defect_weight VARCHAR(10) DEFAULT 'MINOR'` — **EP-QC-005**: har defekt uchun og'irlik daraja

**Kod bilan munosabat:**
- `mes-completed.listener.ts` hozirda `sales_order_id` ustunini ISHLATMAYDI (faqat `order_id` ga yozadi).
  Migration tushgandan keyin: `defect_source = 'CURRENT_STAGE'` bilan INSERT yangilanadi (§2.4.3).
- `create-inspection.handler.ts` hozirda `aql_level` va `decision` ustunlarini ISHLATMAYDI (NULL qoladi).
  Bu ustunlar keyinchalik `SubmitInspectionHandler` yoki AQL servis tomonidan yangilanadi.
  `sort_grade = NULL` (submit paytida belgilanadi), `defect_source = 'UNKNOWN'` default.
- `qc-failed-rework.listener.ts` (yangi fayl): `event.reason === 'CRITICAL_DEFECT'` bo'lsa
  rework ochilmaydi — SCRAP yo'li (§2.4.2).

**EGASI QIYMATI KERAK (migration ishga tushirishdan OLDIN):**
- `qc_sort_price_config.price_ratio` — Sort 2 va Sort 3 narx nisbatlari
- `qc_defect_weight_rules.tolerance_pct` — Major va Minor tolerans chegaralari

**APPROVED placeholder:** Migration faylning `-- APPROVED:` qatoriga egasi ismi va sana yozilishi shart.
Siz `<owner> <date>` placeholder qoldirasiz — bu egasi imzolashi uchun.

---

## 6. QABUL MEZONI

Quyidagi barcha bandlar ✅ bo'lishi shart — P07 tayyor hisoblanadi:

### A. MesCompletedListener to'g'irlash

- [ ] `qc_inspections.order_id` = `sales_orders.id` (session id emas)
- [ ] `production_sessions` da session mavjud bo'lmasa — warning log, crash yo'q
- [ ] `production_sessions.order_id = 0` bo'lsa — warning log, inspection ochilmaydi
- [ ] DB-proof: `SELECT qi.order_id, ps.order_id as ps_sales_order_id FROM qc_inspections qi JOIN production_sessions ps ON qi.order_id = ps.order_id WHERE qi.reference_type = 'mes_session' LIMIT 5` — qatorlar mos kelishi kerak

### B. CreateInspectionHandler pre-claim fix

- [ ] `POST /api/qc/inspections` → yangi qatorda `items_passed = 0` (sampleSize emas)
- [ ] `items_checked = sampleSize` (rejalashtirilgan namuna hajmi)
- [ ] DB-proof: `SELECT id, items_checked, items_passed, items_failed FROM qc_inspections ORDER BY id DESC LIMIT 5` — `items_passed = 0` ko'rinadi

### C. QcFailedReworkListener

- [ ] Yangi fayl yaratildi: `mes/infrastructure/event-handlers/qc-failed-rework.listener.ts`
- [ ] `@EventsHandler(QcFailedEvent)` dekoratori to'g'ri
- [ ] `mes.module.ts` da import va `listeners` massivida ro'yxatda bor
- [ ] Idempotent: ikkinchi marta chaqirilganda ikkinchi rework sessiya ochilmaydi
- [ ] DB-proof (QcFailedEvent chop etilgandan keyin): `SELECT * FROM production_sessions WHERE status = 'rework' ORDER BY id DESC LIMIT 5` — yangi qator ko'rinadi
- [ ] Warning log chiqadi (production_sessions topilmasa)

### D. DDL (GATED)

- [ ] Migration fayli yozilgan: `p07-qc-inspections-aql-decision.sql`
- [ ] Faylda `-- GATED` va `-- APPROVED: <owner> <date>` placeholder bor
- [ ] Migration ISHGA TUSHIRILMAGAN (faqat commit)
- [ ] `\d qc_inspections` — `sales_order_id`, `aql_level`, `decision`, `sort_grade`, `defect_source` ustunlari YO'Q (hali migration kelmagan)

### E-extra. EP-QC-072/005/090 — Yangi QC feature checklistlari

- [ ] **EP-QC-072 sort_grade**: `p07-qc-inspections-aql-decision.sql` da `sort_grade` ustuni va
  `qc_sort_price_config` jadvali + seed (price_ratio NULL, EGASI QIYMATI KERAK belgisi bor)
- [ ] **EP-QC-005 defect_weight**: `qc_defect_weight_rules` jadvali + seed (tolerance_pct NULL,
  EGASI QIYMATI KERAK); `qc_defects.defect_weight` ustuni migration da bor
- [ ] **EP-QC-090 defect_source**: `qc_inspections.defect_source` ustuni migration da bor;
  `mes-completed.listener.ts` INSERT da `defect_source = 'CURRENT_STAGE'` (DDL kelgandan keyin)
- [ ] **Critical-defect guard**: `qc-failed-rework.listener.ts` da `event.reason === 'CRITICAL_DEFECT'`
  bo'lsa rework ochilmaydi (SCRAP yo'li — §2.4.2)
- [ ] **Hardcode TAQIQ**: `qc_sort_price_config.price_ratio` va `qc_defect_weight_rules.tolerance_pct`
  da hech qanday raqam hardcode qilinmagan — NULL + "EGASI QIYMATI KERAK" belgisi bor

### E. Umumiy sifat

- [ ] BE `tsc --noEmit` — 0 xato
- [ ] FE `tsc --noEmit` — 0 xato (FE fayllari o'zgartirilmagan, lekin tekshirilsin)
- [ ] `bash scripts/reviewer-result-pattern.sh` — yangi faylda Result\<T\> buzilmagan
- [ ] `bash scripts/reviewer-array-safety.sh` — Array.isArray ishlatilgan (listener larda)
- [ ] Golden-thread regress yo'q: MES sessiyasi yakunlanishi hali ham QC inspection ochadi

---

## 7. SELF-VERIFY

Quyidagi buyruqlarni ketma-ket bajaring va natijani tekshiring:

### 7.1 TypeScript tekshiruvi

```bash
# Backend typecheck
cd Uzbek-Language-Module
pnpm --filter @europrint/api run build 2>&1 | tail -30
# Yoki:
npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | head -40
```

Kutilgan natija: `0 errors`.

### 7.2 Backend boot tekshiruvi

```bash
pnpm --filter @europrint/api run dev:unsafe
# Biroz kuting (5-10 soniya)
curl -s http://localhost:3030/api/auth/health | head -5
```

Kutilgan: `200 OK` va `{"status":"ok"}` yoki shunga o'xshash.

### 7.3 DB-proof: mes-completed listener (Qadam 1)

```sql
-- 1. Test uchun production_sessions da qator borligini tekshiring
SELECT id, order_id, status FROM production_sessions ORDER BY id DESC LIMIT 5;

-- 2. MES completed eventini simulate qilish (mavjud session bilan)
-- production_sessions.id ni olasiz va http orqali complete chaqirasiz
-- YOKI to'g'ridan qc_inspections ga INSERT qilib, order_id ni tekshirasiz:
SELECT qi.order_id, ps.order_id AS ps_order_id
FROM qc_inspections qi
JOIN production_sessions ps ON qi.order_id = ps.order_id
WHERE qi.reference_type = 'mes_session'
ORDER BY qi.id DESC LIMIT 5;
-- Natija: qi.order_id = ps.order_id (ikkisi ham sales_orders.id)
```

### 7.4 DB-proof: create-inspection (Qadam 2)

```bash
# POST /api/qc/inspections endpointiga so'rov yuboring
curl -s -X POST http://localhost:3030/api/qc/inspections \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{"orderId":1,"batchId":"BATCH-001","inspectorId":1,"sampleSize":50}'
```

```sql
-- Natijani tekshiring
SELECT id, items_checked, items_passed, items_failed, status
FROM qc_inspections
ORDER BY id DESC LIMIT 3;
-- Kutilgan: items_passed=0, items_checked=50, items_failed=0, status='pending'
```

### 7.5 DB-proof: QcFailedReworkListener (Qadam 3)

```bash
# Agar test uchun QcFailedEvent chiqarish imkoni bo'lmasa, to'g'ridan listener ni test qiling:
# 1. Avval production_sessions da sent_to_qc statusli qator borligini tekshiring
```

```sql
SELECT id, production_order_id, order_id, status
FROM production_sessions
WHERE status = 'sent_to_qc'
ORDER BY id DESC LIMIT 5;

-- Agar bor bo'lsa — manual test:
-- POST /api/qc/inspections/:id/submit bilan fail=true yuboring
-- Keyin:
SELECT id, session_number, production_order_id, order_id, status
FROM production_sessions
WHERE status = 'rework'
ORDER BY id DESC LIMIT 5;
-- Kutilgan: yangi qator session_number='REWORK-<originalId>' bilan
```

### 7.6 Idempotentlik tekshiruvi

```sql
-- Ikki marta rework insert qilinmaydi:
-- Birinchi trigger → bir qator
-- Ikkinchi trigger → hali ham bir qator
SELECT COUNT(*) FROM production_sessions
WHERE production_order_id = <PRODUCTION_ORDER_ID>
  AND status = 'rework';
-- Kutilgan: 1 (ikki marta chaqirilganda ham)
```

### 7.7 Reviewer skriptlar

```bash
cd Uzbek-Language-Module
bash scripts/reviewer-result-pattern.sh 2>&1 | tail -5
bash scripts/reviewer-array-safety.sh 2>&1 | tail -5
bash scripts/reviewer-jwt-guard.sh 2>&1 | tail -5
```

Kutilgan: FAIL: 0 (yangi fayllar regression keltirmaydi).

### 7.8 DDL gate tekshiruvi (migration ISHGA TUSHIRILMAGAN)

```sql
-- Migration ishga tushirilmagan ekanini tasdiqlang:
\d qc_inspections
-- sales_order_id, aql_level, decision ustunlari KO'RINMASLIGI kerak (GATED)
```

---

## 8. COMMIT

### Commit tartibi va formati

Har qadam uchun alohida commit. Barcha commitlar `chore/schema-convergence` branchida.

```bash
# Qadam 1
git add Uzbek-Language-Module/apps/api/src/modules/qc/infrastructure/event-handlers/mes-completed.listener.ts
git commit -m "fix(qc): mes-completed listener writes sales_order_id not session_id to qc_inspections.order_id (P07)"

# Qadam 2
git add Uzbek-Language-Module/apps/api/src/modules/qc/application/commands/create-inspection.handler.ts
git commit -m "fix(qc): create-inspection pre-claim bug — items_passed=0 at open time not sampleSize (P07)"

# Qadam 3
git add Uzbek-Language-Module/apps/api/src/modules/mes/infrastructure/event-handlers/qc-failed-rework.listener.ts
git commit -m "feat(mes): QcFailedReworkListener — QC fail triggers rework production session in MES (P07)"

# Qadam 4
git add Uzbek-Language-Module/apps/api/src/modules/mes/mes.module.ts
git commit -m "feat(mes): register QcFailedReworkListener in MesModule providers (P07)"

# Qadam 5 (GATED — faqat fayl, migration ishga tushirilmaydi)
git add Uzbek-Language-Module/apps/api/src/shared/db/migrations/p07-qc-inspections-aql-decision.sql
git commit -m "feat(qc/ddl): GATED — qc_inspections AQL/decision/sales_order_id columns migration (P07, needs owner APPROVED)"
```

### Taqiqlangan commit amallar

```bash
# TAQIQ:
git add -A         # barcha fayllar — boshqa agent ishini supurib ketadi
git add .          # xuddi shunday
git commit --amend # oldingi commitni o'zgartirish
git push --force   # main/chore branchiga force push
```

### Branch tekshiruvi

```bash
git branch        # chore/schema-convergence da ekaningizni tasdiqlang
git log --oneline -5  # so'nggi 5 commit ko'ring
git status        # faqat owned-file o'zgartirilgan ekanini tasdiqlang
```

---

## QOIDA ESLATMALARI

- **Q-40**: `items_passed = 0` va `sales_order_id = production_sessions.order_id` — bu faqat "ishlaydi" emas, semantik jihatdan TO'G'RI bo'lishi shart. DB-proof bilan tasdiqlang.
- **Q-46**: `submit-inspection.handler.ts` (QcFailedEvent emitter) — bu fayl O'ZGARTIRILMAYDI. Faqat o'qiladi. Ishlayotgan listener (SoSampleRequestedListener, MesCompletedListener eski versiyasi) O'CHIRILMAYDI — faqat to'g'irlanadi.
- **Q-35**: `p07-qc-inspections-aql-decision.sql` migration GATED — `-- APPROVED:` placeholder bor, egasi imzolagan. ISHGA TUSHIRILMAYDI.
- **Q-23**: Faqat 4 ta owned-file + 1 ta GATED migration. `submit-inspection.handler.ts`, `qc.module.ts`, `qc/domain/events/index.ts` — bu fayllarga TEGMANG.
- **Q-31**: Agar `@modules/qc/domain/events` path aliasi mavjud bo'lmasa va relative path kerak bo'lsa — faqat import yo'lini o'zgartiring, boshqa narsa emas.

---

## CHETGA CHIQISH HOLATLARI (Edge Cases)

P07 ning har bir qadami uchun noaniq holatlar va ularni hal qilish yo'li:

### Edge Case 1 — `production_sessions.order_id = 0` yoki NULL

`pp-released-mes.listener.ts` da sessiya ochilganda `po.sales_order_id` NULL bo'lsa, `order_id = NULL` yoziladi. `mes-completed.listener.ts` da bu holatni aniqlab, inspection ochmaslik kerak (aks holda `qc_inspections.order_id = 0` — ma'nosiz qator).

Tuzatilgan kod allaqachon buni handle qiladi:
```typescript
if (!salesOrderId) {
  this.logger.warn({ sessionId: event.sessionId }, '...');
  return;
}
```

Siz ushbu warning log ni tasdiqlashingiz kerak — agar `order_id = 0` bo'lsa `qc_inspections` da yangi qator PAYDO BO'LMASLIGI kerak.

### Edge Case 2 — `QcFailedEvent` chiqariladi lekin `production_sessions` da mos qator yo'q

Bu holat `sales_orders.id` orqali bog'langan sessiya `sent_to_qc` statusida bo'lmasa yuz beradi. Masalan: birov sessiyani `completed` dan `sent_to_qc` ga o'tkazishni unutib qo'ygan, yoki boshqa status bilan tugagan.

`QcFailedReworkListener` da:
```typescript
if (rows.length === 0) {
  this.logger.warn({ orderId: event.orderId, inspectionId: event.inspectionId }, '...');
  return;
}
```
Bu holatda listener CRASH QILMAYDI, faqat warning log chiqaradi. Rework sessiya ochilmaydi — egasi qo'lda hal qiladi.

### Edge Case 3 — `QcFailedEvent` ikki marta chiqariladi (retry scenario)

`NOT EXISTS` guard idempotentlikni ta'minlaydi:
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM production_sessions
  WHERE production_order_id = ${productionOrderId}
    AND status = 'rework'
)
```
Ikkinchi INSERT ishga tushmaydi (0 ta qator kiritiladi, xato yo'q).

### Edge Case 4 — Parallel agent `qc.module.ts` ga tegadi

Agar boshqa agent (masalan P06) `qc.module.ts` ga parallel o'zgartirish kiritse, merge conflict paydo bo'lishi mumkin. P07 faqat `mes.module.ts` ga `QcFailedReworkListener` ni qo'shadi — `qc.module.ts` ga TEGMAYDI. Shu sababli parallel conflict ehtimoli minimal.

Biroq `mes.module.ts` ga P06 ham tegar bo'lsa — P06 tugaganini (`dependsOn: P06`) kuting va keyin P07 ning Qadam 4 ni bajaring.

### Edge Case 5 — `@modules/qc/domain/events` path aliasi

NestJS `tsconfig.json` da `@modules/*` aliasi mavjud bo'lsa:
```typescript
import { QcFailedEvent } from '@modules/qc/domain/events';
```

Mavjud bo'lmasa relative path:
```typescript
import { QcFailedEvent } from '../../../qc/domain/events';
```

`QcFailedReworkListener` fayli joylashuvi: `mes/infrastructure/event-handlers/` — ya'ni `qc/domain/events/index.ts` ga nisbatan `../../../qc/domain/events`.

Tekshiruv: `grep -r "from '@modules/" apps/api/src/modules/mes/ | head -5` — agar mavjud bo'lsa alias ishlating.

### Edge Case 6 — `items_checked = 0` bilan `CreateInspectionCommand`

`command.sampleSize = 0` kelsa — `items_checked = 0` bo'ladi (bu xato command tomonidan keladi, handler tomonidan emas). Handler bu holatni tekshirmaydi — Zod validation controller darajasida amalga oshirilishi kerak. Agar controller da `sampleSize: z.number().int().positive()` bo'lmasa, bu alohida agent vazifasi (P07 scope emas).

### Edge Case 7 — `production_sessions` jadvalida `session_number` UNIQUE constraint

`REWORK-<id>` format unique bo'lishi kerak. Agar bir xil `originalSessionId` uchun ikkinchi marta `INSERT` bo'lsa — `NOT EXISTS` guard uni to'sadi. Lekin agar `session_number` ustunida UNIQUE index bo'lsa va `NOT EXISTS` guard race condition sababli ikki marta o'tib ketsa — `duplicate key` xatosi chiqadi. Bu holat `.catch()` da handle qilinadi (listener try/catch bor).

---

## ALOQADOR AGENTLAR VA CHEGARALAR

### P02 bilan chegara

P02 (`GOLDEN int-schema-api-barrel`) `@shared/db` barrel ni to'g'irlaydi va `qc_inspections` Drizzle schema ni eksport qiladi. P07 ning listener lari raw SQL ishlatadi (`sql\`...\`` — RULE4_EXCEPTION sababli), shuning uchun P02 merge bo'lmaguncha ham ishlaydi. DDL migration esa P02 bilan birga merge qilinishi maqsadga muvofiq.

Chegara: P07 `lib/db/src/schema/` fayllariga TEGMAYDI — bu P02 territoriyasi.

### P06 bilan chegara

P06 (`MES full` agent) `mes.module.ts` ni o'zgartirishi mumkin. P07 shu sababli Wave 2 da — P06 tugagandan keyin boshlaydi. P07 `mes.module.ts` ga faqat `QcFailedReworkListener` ni qo'shadi; boshqa o'zgarish P06 ga tegadi.

Chegara: P07 `complete-session.handler.ts`, `drizzle-mes.repo.ts`, `production-session.aggregate.ts` fayllariga TEGMAYDI.

### WMS agenti bilan chegara

`QcPassedEvent` → `WmsReceiveListener` (P07 scope emas).
`QcFailedEvent` → `WmsScrapListener` (`SCRAP` qaror uchun, P07 scope emas).
P07 faqat `QcFailedEvent` → `REWORK` yo'nalishini yopadi.

---

## TEXNIK QARZ HISOBGA OLINGAN MUAMMO

Hozirgi holat bo'yicha `qc_inspections.order_id` semantikasi ikki hil:
1. `mes-completed.listener.ts` — `sessionId` yozadi (XATO, P07 to'g'irlaydi)
2. `qc-defects.controller.ts:64` — `order_id` bo'yicha UPDATE qiladi (bu P07 scope emas)

P07 dan keyin `order_id = sales_orders.id` bo'ladi. `qc-defects.controller.ts:64` da `order_id` bo'yicha UPDATE ham shunga muvofiq ishlaydi — chunki u ham `sales_orders.id` bo'yicha filter qiladi.

Agar keyinchalik `sales_order_id` ustuni DDL migration bilan qo'shilsa va `order_id` ning o'rnini bosishi kerak bo'lsa — bu alohida agent vazifasi, P07 scope emas.

---

## P07 HOLAT HISOBOTI SHABLONI

Ishni yakunlagandan keyin egaga quyidagi formatda hisobot yuboring:

```
P07 HOLAT HISOBOTI — GOLDEN QC correctness + 3-decision MES rework bridge

✅ Qadam 1 — mes-completed.listener: sales_order_id fix — DONE
  Commit: <hash>
  DB-proof: qc_inspections.order_id = production_sessions.order_id ✅

✅ Qadam 2 — create-inspection pre-claim bug — DONE
  Commit: <hash>
  DB-proof: items_passed=0 at open time ✅

✅ Qadam 3 — QcFailedReworkListener yangi fayl — DONE
  Commit: <hash>
  DB-proof: production_sessions WHERE status='rework' yangi qator ✅

✅ Qadam 4 — mes.module.ts registration — DONE
  Commit: <hash>

⏳ Qadam 5 — DDL GATED migration — YOZILDI, ISHGA TUSHIRILMADI
  Commit: <hash>
  Egasi "APPROVED" + P02 merge keyin ishga tushiriladi.
  Migration: qc_inspections (sales_order_id + aql_level + decision + sort_grade + defect_source)
           + qc_sort_price_config (EP-QC-072, price_ratio NULL — EGASI QIYMATI KERAK)
           + qc_defect_weight_rules (EP-QC-005, tolerance_pct NULL — EGASI QIYMATI KERAK)
           + qc_defects.defect_weight (EP-QC-005)

BE tsc: 0 xato ✅
FE tsc: 0 xato ✅
reviewer-result-pattern: FAIL 0 ✅
reviewer-array-safety: FAIL 0 ✅

DEFERRED (DDL merge keyin):
- sales_order_id ustunini qc_inspections da to'ldirish
- aql_level va decision ustunlarini SubmitInspectionHandler da yangilash
- mes-completed.listener.ts INSERT da defect_source = 'CURRENT_STAGE' qo'shish (EP-QC-090)
- sort_grade ni SubmitInspectionHandler da belgilash (EP-QC-072)

EGASI QIYMATI KERAK (migration ishga tushirishdan OLDIN):
- qc_sort_price_config: Sort 2 va Sort 3 price_ratio (EP-QC-072)
- qc_defect_weight_rules: Major va Minor tolerance_pct (EP-QC-005)
```
