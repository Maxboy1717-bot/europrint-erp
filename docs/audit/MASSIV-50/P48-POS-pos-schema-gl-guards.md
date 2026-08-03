# P48 — POS Monitor (factory warehouse tablet): POS schema DDL + enum fixes + GL dedup + texkarta guard + storno + 2-sig act

> **Agent:** Muslimbek (Bajaruvchi 🟢) | **Wave:** 1 | **dependsOn:** ["P01"]
> **Sana:** 2026-06-19 | **Paket:** P48 | **Modul:** POS Monitor (factory warehouse tablet)

---

## 0. ROL VA QOIDALAR

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Q-23/Q-31): faqat owned-file ro'yxatidagi fayllarga teg. Boshqa fayl
    kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration
    faylida '-- APPROVED:' izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin
    GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda
    to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul
    vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Wave 1** — bu paket P01 (golden schema barrel) tayyor bo'lishi bilanoq ishga tushirilishi mumkin. Boshqa wavega bog'liqlik yo'q.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil:**

| # | Fayl yo'li | Holat |
|---|-----------|-------|
| 1 | `lib/db/src/schema/pos-schema-v2.ts` | mavjud — DDL o'zgarish kerak |
| 2 | `lib/db/src/schema/pos-schema-extensions.ts` | mavjud — 2-sig ustunlar |
| 3 | `apps/api/src/shared/db/migrations/pos-phase1-ddl.sql` | YO'Q — yaratiladi (GATED) |
| 4 | `apps/api/src/modules/pos/dto/movement-enums.ts` | mavjud — enum qo'shish |
| 5 | `apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts` | mavjud — 'karantin'→'qc_pending' tuzatish |
| 6 | `apps/api/src/modules/pos/application/services/pos-movement-status.constants.ts` | mavjud — VALID_TRANSITIONS tuzatish |
| 7 | `apps/api/src/modules/pos/dto/movement.dto.ts` | mavjud — storno + INTERNAL_ISSUE guard DTO |
| 8 | `apps/api/src/modules/pos/application/event-handlers/pos.events.ts` | mavjud — GL dual-write o'chirish |
| 9 | `apps/api/src/modules/pos/application/services/pos-movement.service.ts` | mavjud — storno + texkarta guard |
| 10 | `apps/api/src/modules/pos/application/services/pos-movement-status.service.ts` | mavjud — storno status hook |
| 11 | `apps/api/src/modules/pos/application/services/pos-gl-auto.service.ts` | agar mavjud bo'lsa — ko'rib chiqiladi |
| 12 | `apps/api/src/modules/pos/application/services/auto-gl-posting.service.ts` | mavjud — COMPLETED triggerini o'chirish |
| 13 | `apps/api/src/modules/pos/application/services/pos-pdf.service.ts` | mavjud — 2-sig blok qo'shish |
| 14 | `apps/api/src/modules/pos/application/services/pos-pdf.types.ts` | mavjud — PdfMovementData kengaytirish |
| 15 | `apps/api/src/modules/pos/infrastructure/repositories/pos-movement.repository.ts` | mavjud — storno insert metodi |

**DDL DARVOZASI:** `pos-phase1-ddl.sql` migration fayli YOZILADI lekin `-- GATED` belgisi bilan.
Egasi `-- APPROVED: <ism> <sana>` izohini qo'shmaguncha `db push` yoki `psql` bilan ISHGA
TUSHIRILMAYDI. Agent faqat faylni yozadi.

---

## 2. VIZYON

### POS Monitor nima?

POS Monitor — zavodning asosiy ombor planshet ilovasi. Fabrikadagi har bir material kirim/chiqim
shu orqali o'tadi. U quyidagi modullarga ko'prik bo'ladi:

- **warehouse_stock** (kanonik) — barcha stok o'zgarishlari shu jadvalga yoziladi
- **QC** — karantin darvozasi: har EXTERNAL_IN quarantine'ga kiradi, QC tasdiqlaydi
- **MES** — FG kvitansiyasi: ishlab chiqarish yakunida FG_FROM_MES harakati
- **MM** — qayta buyurtma signali: min_qty ostiga tushganda signal
- **Finance** — avtomatik GL `entries` jadvaliga (bitta yozuv, `completed` eventda)
- **Org-chart** — tasdiqlash marshrutlash

### Egasi tomonidan qo'llab-quvvatlangan majburiy qoidalar (Owner overrides):

| Kod | Qoida | Amal |
|-----|-------|------|
| EP-POS-032 | Texkarta spesifikatsiyasiga mos kelmaydigan material = **HARD BLOCK** | `ForbiddenException` |
| EP-POS-050 | Topshirish = **2 imzoli PDF akti** (beruvchi + oluvchi) | `pos_movements` + `pos-pdf.types.ts` |
| EP-POS-069 | Zarar/brak/katta farqda fotoevidence = **MAJBURIY** | `photo_urls` ustun + servis enforcement (QADAM 9B) |
| EP-POS-022 | Tasdiqlangan harakat bekor = **storno** (teskari harakat, asl o'zgarmas) | yangi metod |
| EP-POS-037 | Makulatura = 501 stub (faylda `SCRAP_IN` enum qo'shilishi kerak) | enum only |

### 6 ta qurilish fazasi (vizyon):

1. Holat-mashina (STATE MACHINE) — draft→qc_pending→qc_approved→pending→approved→completed
2. Barkod + yorliq — ZPL/EPL/PDF label, USB/BT scanner
3. EXTERNAL_IN 5 bosqich karantin oqimi
4. Bo'lim so'rovi + MES + FG kirim
5. Inventarizatsiya sanash + GSD + offline PWA
6. Pres-kirim + FE qayta ishlash

**Ushbu P48 paket Wave 1 ishlarini bajaradi:**
- Enum mismatch tuzatish (karantin → qc_pending)
- Schema DDL: photo_urls, SCRAP_IN, FG_FROM_MES, issuer/receiver sig cols
- GL dual-write o'chirish (faqat `completed` eventda `entries`)
- Texkarta hard-block (INTERNAL_ISSUE uchun)
- Storno (teskari harakat yaratish)
- 2-imzoli PDF akti uchun tip + servis kengaytirish

---

## 3. HOZIRGI HOLAT

### ✅ Mavjud (ishlaydi):

- `movement-enums.ts:6` — `MovementTypeCode` enum (8 qiymat: EXTERNAL_IN/OUT/INTERNAL_ISSUE/RETURN/DAMAGE/INTERNAL_TRANSFER/INVENTORY_ADJ_PLUS/MINUS)
- `pos-schema-v2.ts:22-31` — `movementTypeEnum` pgEnum (xuddi 8 qiymat)
- `pos-schema-v2.ts:33-44` — `movementStatusEnum` pgEnum: draft, qc_pending, qc_approved, qc_rework, qc_rejected, pending, approved, ai_processing, completed, cancelled
- `pos-movement-status.constants.ts:13` — `VALID_TRANSITIONS` state machine
- `pos-movement.service.ts:57` — `createMovement` real INSERT
- `pos.events.ts:110-184` — `onMovementApproved` + `onMovementCompleted` event handlerlar
- `auto-gl-posting.service.ts:77` — `postForMovement` `pos_gl_postings` subledgerga yozadi
- `pos-schema-extensions.ts:72` — `movementConfirmations` (step, userId, decision, signatureHash)
- `quarantine-workflow.service.ts:32` — `moveToQuarantine` QC-HOLD omborga upsert

### ❌ Buzuq / Soxta (tuzatilishi shart):

**BUG-1: DUAL GL WRITE (KRITIK)**
- `pos.events.ts:132-144` — `onMovementApproved` → `autoGl.postForMovement()` → `pos_gl_postings` subledgerga yozadi
- `pos.events.ts:179-184` — `onMovementCompleted` → `glLedger.postMovementToCanonicalLedger()` → kanonik `entries` jadvaliga yozadi
- Muammo: bir harakat `approved→completed` yo'lida IKKAla GL yoziladi = ikkilamchi hisob
- Yechim: `onMovementApproved` dagi `autoGl.postForMovement()` chaqiruvini **o'chirish** — faqat `completed` eventda `entries` ga yozish to'g'ri

**BUG-2: ENUM MISMATCH (KRITIK)**
- `quarantine-workflow.service.ts:40` — `repo.updateMovementStatus(movementId, 'karantin', {...})`
- `pos-schema-v2.ts:33-44` — `movementStatusEnum` da `'karantin'` qiymati YO'Q (faqat `'qc_pending'` bor)
- Runtime da `INSERT` yoki `UPDATE` enum constraint violation bilan CRASH beradi
- `pos-movement-status.constants.ts:14` — `VALID_TRANSITIONS.draft: ['karantin', ...]` ham noto'g'ri

**BUG-3: BIN LOCATION MISMATCH**
- `pos-schema-v2.ts:153` — `posMovementLines.binId: varchar('bin_id', { length: 50 })`
- `movement.dto.ts:31` — `AddMovementLineSchema.binLocation: z.string().max(100)`
- Servis `binLocation` ni `bin_id` ustuniga insert qiladi — nomlari mos emas
- Drizzle schema `bin_id` (FK implication), DTO `binLocation` (freeform text)

**BUG-4: 2-SIG ACT STRUKTURAVIY YO'Q**
- `pos-pdf.types.ts:6` — `PdfMovementData` faqat `createdByName` bor, `issuerName` / `receiverName` / imzo maydonlari yo'q
- `pos_movements` jadvalida `issuer_user_id`, `receiver_user_id`, `issuer_signed_at`, `receiver_signed_at` ustunlari yo'q
- EP-POS-050 bajarilishi uchun schema + tip kengaytirish kerak

### ⚠️ Mavjud emas (missing):

- `movementTypeEnum` da `SCRAP_IN` qiymati yo'q (`pos-schema-v2.ts:22-31`)
- `movementTypeEnum` da `FG_FROM_MES` qiymati yo'q
- `MovementTypeCode` enum da `SCRAP_IN`, `FG_FROM_MES` yo'q (`movement-enums.ts:6-15`)
- `pos_movements.photo_urls` ustuni yo'q (EP-POS-069 uchun)
- Storno metodi yo'q (EP-POS-022 uchun) — faqat `status='cancelled'` bor
- Texkarta hard-block `INTERNAL_ISSUE` uchun yo'q (`pos-movement.service.ts:82-87` faqat lifecycle-block tekshiruvi)
- `pos_movements` da `issuer_user_id`, `receiver_user_id` ustunlari yo'q

---

## 4. ISH (QADAM-BAQADAM)

### QADAM 1: Enum mismatch tuzatish — `movement-enums.ts` va `pos-schema-v2.ts`

**Fayl:** `apps/api/src/modules/pos/dto/movement-enums.ts`

**O'zgarish:** `SCRAP_IN` va `FG_FROM_MES` qo'shish

```typescript
// OLDIN (movement-enums.ts:6-15):
export enum MovementTypeCode {
  EXTERNAL_IN         = 'EXTERNAL_IN',
  EXTERNAL_OUT        = 'EXTERNAL_OUT',
  INTERNAL_ISSUE      = 'INTERNAL_ISSUE',
  INTERNAL_RETURN     = 'INTERNAL_RETURN',
  DAMAGE              = 'DAMAGE',
  INTERNAL_TRANSFER   = 'INTERNAL_TRANSFER',
  INVENTORY_ADJ_PLUS  = 'INVENTORY_ADJ_PLUS',
  INVENTORY_ADJ_MINUS = 'INVENTORY_ADJ_MINUS',
}

// KEYIN:
export enum MovementTypeCode {
  EXTERNAL_IN         = 'EXTERNAL_IN',
  EXTERNAL_OUT        = 'EXTERNAL_OUT',
  INTERNAL_ISSUE      = 'INTERNAL_ISSUE',
  INTERNAL_RETURN     = 'INTERNAL_RETURN',
  DAMAGE              = 'DAMAGE',
  INTERNAL_TRANSFER   = 'INTERNAL_TRANSFER',
  INVENTORY_ADJ_PLUS  = 'INVENTORY_ADJ_PLUS',
  INVENTORY_ADJ_MINUS = 'INVENTORY_ADJ_MINUS',
  // --- EP-POS-037 stub (owner approval kutilmoqda; DDL GATED) ---
  SCRAP_IN            = 'SCRAP_IN',
  // --- EP-POS-024 MES→POS FG kirim (DDL GATED) ---
  FG_FROM_MES         = 'FG_FROM_MES',
}
```

**Fayl:** `lib/db/src/schema/pos-schema-v2.ts`

**O'zgarish:** `movementTypeEnum` va `insertPosMovementSchema` da yangi qiymatlar

```typescript
// OLDIN (pos-schema-v2.ts:22-31):
export const movementTypeEnum = pgEnum('pos_movement_type_enum', [
  'EXTERNAL_IN',
  'EXTERNAL_OUT',
  'INTERNAL_ISSUE',
  'INTERNAL_RETURN',
  'DAMAGE',
  'INTERNAL_TRANSFER',
  'INVENTORY_ADJ_PLUS',
  'INVENTORY_ADJ_MINUS',
]);

// KEYIN:
export const movementTypeEnum = pgEnum('pos_movement_type_enum', [
  'EXTERNAL_IN',
  'EXTERNAL_OUT',
  'INTERNAL_ISSUE',
  'INTERNAL_RETURN',
  'DAMAGE',
  'INTERNAL_TRANSFER',
  'INVENTORY_ADJ_PLUS',
  'INVENTORY_ADJ_MINUS',
  'SCRAP_IN',      // EP-POS-037 — makulatura stub (DDL GATED: ALTER TYPE required)
  'FG_FROM_MES',   // EP-POS-024 — MES tayyor mahsulot kirim (DDL GATED)
]);
```

**`insertPosMovementSchema` (pos-schema-v2.ts:659-665) ham yangilansin:**

```typescript
// OLDIN:
export const insertPosMovementSchema = createInsertSchema(posMovements, {
  movementType: z.enum([
    'EXTERNAL_IN', 'EXTERNAL_OUT', 'INTERNAL_ISSUE',
    'INTERNAL_RETURN', 'DAMAGE', 'INTERNAL_TRANSFER',
    'INVENTORY_ADJ_PLUS', 'INVENTORY_ADJ_MINUS',
  ]),
});

// KEYIN:
export const insertPosMovementSchema = createInsertSchema(posMovements, {
  movementType: z.enum([
    'EXTERNAL_IN', 'EXTERNAL_OUT', 'INTERNAL_ISSUE',
    'INTERNAL_RETURN', 'DAMAGE', 'INTERNAL_TRANSFER',
    'INVENTORY_ADJ_PLUS', 'INVENTORY_ADJ_MINUS',
    'SCRAP_IN', 'FG_FROM_MES',
  ]),
});
```

> **MUHIM:** Drizzle schema o'zgarishi TypeScript darajasida ishlaydi. Haqiqiy DB enum'ga `ALTER TYPE pos_movement_type_enum ADD VALUE 'SCRAP_IN'` va `ADD VALUE 'FG_FROM_MES'` SQL kerak — bu `pos-phase1-ddl.sql` da yoziladi (GATED). Drizzle schema va TypeScript enum sinxron bo'lishi shart.

---

### QADAM 2: `quarantine-workflow.service.ts` — 'karantin' → 'qc_pending' tuzatish

**Fayl:** `apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts`

**Muammo (satr 11-24):** `MovementStatus` lokal type va `STATUS_FLOW` da `'karantin'` ishlatilmoqda — bu DB enum da yo'q.

**O'zgarish — to'liq servis lokal tipini tuzatish:**

```typescript
// OLDIN (satr 11-24):
export type MovementStatus =
  | 'draft' | 'pending' | 'karantin' | 'qc_review'
  | 'approved' | 'rejected' | 'completed' | 'cancelled';

export const STATUS_FLOW: Record<string, MovementStatus[]> = {
  draft:     ['pending', 'karantin', 'cancelled'],
  pending:   ['karantin', 'qc_review', 'approved', 'rejected', 'cancelled'],
  karantin:  ['qc_review', 'cancelled'],
  qc_review: ['approved', 'rejected', 'cancelled'],
  approved:  ['completed', 'cancelled'],
  rejected:  ['cancelled'],
  completed: [],
  cancelled: [],
};

// KEYIN:
// Bu lokal type OLIB TASHLANADI — pos-movement-status.constants.ts dagi
// MovementStatus import qilinadi (movement.dto.ts orqali)
// STATUS_FLOW ham olib tashlanadi — VALID_TRANSITIONS kanonik
```

**`moveToQuarantine` metodi (satr 40):**

```typescript
// OLDIN:
await this.repo.updateMovementStatus(movementId, 'karantin', {
  toWarehouseId: qcWh.id,
  quarantineRequired: true,
});
this.logger.log(`[Quarantine] Movement ${movementId} → 'karantin' (QC-HOLD ${qcWh.id})`);

// KEYIN:
await this.repo.updateMovementStatus(movementId, 'qc_pending', {
  toWarehouseId: qcWh.id,
  quarantineRequired: true,
});
this.logger.log(`[Quarantine] Movement ${movementId} → 'qc_pending' (QC-HOLD ${qcWh.id})`);
```

**`escalateExpiredQuarantine` (satr 65):**

Repository da `escalateExpiredQuarantine` metodi ichida ham `'karantin'` so'rovlari bo'lishi mumkin. Bu fayl `quarantine-workflow.repository.ts` (owned emas) — agar xato bo'lsa TO'XTA va egasiga flag qil. Faqat `quarantine-workflow.service.ts` faylida tuzatish qil.

**`qcDecision` metodi (satr 86-89):**

```typescript
// OLDIN:
const targetStatus: MovementStatus =
  decision === 'QABUL'  ? 'approved' :
  decision === 'REWORK' ? 'approved' :
  'rejected';

// KEYIN (to'g'ri mapping):
const targetStatus: 'approved' | 'qc_rework' | 'qc_rejected' =
  decision === 'QABUL'   ? 'approved' :
  decision === 'REWORK'  ? 'qc_rework' :
  'qc_rejected';
```

> **Eslatma:** `qcDecision` da `REWORK → 'approved'` noto'g'ri edi — `qc_rework` bo'lishi kerak. Bu BUG-ni ham tuzating.

---

### QADAM 3: `pos-movement-status.constants.ts` — VALID_TRANSITIONS tuzatish

**Fayl:** `apps/api/src/modules/pos/application/services/pos-movement-status.constants.ts`

**Muammo (satr 13-25):** `VALID_TRANSITIONS` da `'karantin'` from-state va to-state sifatida ishlatilmoqda — DB enum da yo'q.

```typescript
// OLDIN (satr 13-25):
export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:        ['karantin', 'qc_pending', 'pending', 'cancelled'],
  karantin:     ['qc_pending', 'cancelled'],
  qc_pending:   ['qc_approved', 'qc_rework', 'qc_rejected'],
  ...
};

// KEYIN:
export const VALID_TRANSITIONS: Record<string, string[]> = {
  // 'karantin' o'chirildi — DB enum da yo'q; 'qc_pending' kanonik
  draft:        ['qc_pending', 'pending', 'cancelled'],
  qc_pending:   ['qc_approved', 'qc_rework', 'qc_rejected'],
  qc_approved:  ['pending', 'cancelled'],
  qc_rework:    ['qc_pending'],
  qc_rejected:  ['cancelled'],
  pending:      ['approved', 'cancelled'],
  approved:     ['ai_processing', 'completed'],
  ai_processing:['completed', 'cancelled'],
  completed:    [],
  cancelled:    [],
};
```

> **Izoh:** `'karantin'` kaliti butunlay o'chirildi. EXTERNAL_IN harakat `draft → qc_pending` (quarantine-workflow.service.ts `moveToQuarantine` orqali) to'g'ridan o'tadi. Oraliq `'karantin'` holat yo'q — bu DB enum cheklovi bilan mos.

---

### QADAM 4: `pos_movements` jadvali DDL ustunlari — `pos-schema-v2.ts`

**Fayl:** `lib/db/src/schema/pos-schema-v2.ts`

**Qo'shiladigan ustunlar (satr 108 atrofida, `actPdfPath` dan keyin):**

```typescript
// OLDIN (pos-schema-v2.ts:107-121):
  // Hujjatlar
  actPdfPath:            text('act_pdf_path'),
  invoicePdfPath:        text('invoice_pdf_path'),
  // Standart maydonlar
  referenceDoc:          varchar('reference_doc', { length: 100 }),
  notes:                 text('notes'),
  createdBy:             integer('created_by').notNull(),
  approvedBy:            integer('approved_by'),
  approvedAt:            timestamp('approved_at'),
  completedAt:           timestamp('completed_at'),
  cancelledAt:           timestamp('cancelled_at'),
  cancelReason:          text('cancel_reason'),
  deletedAt:             timestamp('deleted_at'),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
  updatedAt:             timestamp('updated_at').notNull().defaultNow(),

// KEYIN:
  // Hujjatlar
  actPdfPath:            text('act_pdf_path'),
  invoicePdfPath:        text('invoice_pdf_path'),
  // EP-POS-069 — foto dalil (DAMAGE/brak/katta farq uchun MAJBURIY)
  // DDL: ADD COLUMN photo_urls text[] DEFAULT '{}' — GATED
  photoUrls:             text('photo_urls').array().default(sql`'{}'`),
  // EP-POS-050 — 2-imzoli handover akti uchun
  // DDL: ADD COLUMN issuer_user_id integer ... — GATED
  issuerUserId:          integer('issuer_user_id'),
  receiverUserId:        integer('receiver_user_id'),
  issuerSignedAt:        timestamp('issuer_signed_at'),
  receiverSignedAt:      timestamp('receiver_signed_at'),
  // EP-POS-022 — storno uchun
  // DDL: ADD COLUMN storno_of_movement_id integer ... — GATED
  stornoOfMovementId:    integer('storno_of_movement_id'),
  isStorno:              boolean('is_storno').notNull().default(false),
  // Standart maydonlar
  referenceDoc:          varchar('reference_doc', { length: 100 }),
  notes:                 text('notes'),
  createdBy:             integer('created_by').notNull(),
  approvedBy:            integer('approved_by'),
  approvedAt:            timestamp('approved_at'),
  completedAt:           timestamp('completed_at'),
  cancelledAt:           timestamp('cancelled_at'),
  cancelReason:          text('cancel_reason'),
  deletedAt:             timestamp('deleted_at'),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
  updatedAt:             timestamp('updated_at').notNull().defaultNow(),
```

**TypeScript export tipi kengaytirish (satr 676):**

```typescript
// Mavjud:
export type PosMovement = typeof posMovements.$inferSelect;

// O'zgarish yo'q — Drizzle $inferSelect avtomatik yangi ustunlarni oladi.
// Faqat schema ustunlari qo'shilgandan keyin tsc qayta tekshirilsin.
```

---

### QADAM 5: `pos-movement-lines` — `bin_id` vs `binLocation` mismatch tuzatish

**Fayl:** `lib/db/src/schema/pos-schema-v2.ts`

**Muammo (satr 153):** `binId: varchar('bin_id', { length: 50 })` — ammo DTO va servis `binLocation` ishlatadi.

```typescript
// OLDIN (satr 153):
  binId:               varchar('bin_id', { length: 50 }),

// KEYIN:
  // Drizzle field name: binLocation (DTO bilan mos); DB col: bin_location
  // DDL GATED: RENAME COLUMN bin_id TO bin_location (yoki ADD COLUMN)
  binLocation:         varchar('bin_location', { length: 100 }),
```

> **DIQQAT:** Bu ustun nomini o'zgartiradi. Agar DB da allaqachon `bin_id` ustuni mavjud bo'lsa, migration kerak: `ALTER TABLE pos_movement_lines RENAME COLUMN bin_id TO bin_location`. Bu `pos-phase1-ddl.sql` da GATED migration sifatida yoziladi. Drizzle schema ham yangilanadi.

---

### QADAM 6: `pos-pdf.types.ts` — 2-imzoli akt uchun kengaytirish

**Fayl:** `apps/api/src/modules/pos/application/services/pos-pdf.types.ts`

```typescript
// OLDIN (to'liq fayl):
export interface PdfMovementData {
  movementNumber:  string;
  typeCode:        string;
  status:          string;
  createdAt:       Date;
  supplierName?:   string | null;
  documentNumber?: string | null;
  fromWarehouse?:  string | null;
  toWarehouse?:    string | null;
  createdByName?:  string | null;
  lines: Array<{
    xomAshyo:      string;
    quantity:      number;
    unitOfMeasure: string;
    unitPrice:     number;
    totalPrice:    number;
    currency:      string;
    batchId?:      string | null;
    expiryDate?:   Date | null;
  }>;
}

// KEYIN (EP-POS-050 — 2-imzoli akt):
/**
 * @module pos-pdf.types
 * @description Type-only exports (interfaces, type aliases, enums). No runtime code.
 * EP-POS-050: 2-imzoli handover akti uchun issuer + receiver maydonlari qo'shildi.
 */

/** Harakat aktiga qo'shiladigan imzo bloki */
export interface PdfSignatureBlock {
  /** Imzo qo'ygan foydalanuvchi to'liq ismi */
  fullName:      string;
  /** Lavozim nomi */
  position?:     string | null;
  /** Imzo tasdiqlangan vaqt (ISO string) */
  signedAt?:     Date | null;
  /** Imzo hesh (tekshirish uchun) */
  signatureHash?: string | null;
}

export interface PdfMovementData {
  movementNumber:  string;
  typeCode:        string;
  status:          string;
  createdAt:       Date;
  supplierName?:   string | null;
  documentNumber?: string | null;
  fromWarehouse?:  string | null;
  toWarehouse?:    string | null;
  createdByName?:  string | null;
  // EP-POS-050: 2-imzoli handover akti
  issuer?:         PdfSignatureBlock | null;   // beruvchi (ombor mudiri)
  receiver?:       PdfSignatureBlock | null;  // oluvchi (bo'lim vakili / haydovchi)
  lines: Array<{
    xomAshyo:      string;
    quantity:      number;
    unitOfMeasure: string;
    unitPrice:     number;
    totalPrice:    number;
    currency:      string;
    batchId?:      string | null;
    expiryDate?:   Date | null;
  }>;
}
```

---

### QADAM 7: `pos-pdf.service.ts` — 2-imzoli PDF rendering qo'shish

**Fayl:** `apps/api/src/modules/pos/application/services/pos-pdf.service.ts`

**O'zgarish:** `generateMovementAct` metodida DB dan `issuerUserId`, `receiverUserId`, `issuerSignedAt`, `receiverSignedAt` ustunlarini o'qib, `PdfMovementData.issuer` / `receiver` blokiga yozish.

**Qo'shimcha: PDF da imzo bloki render qilish**

`pos-pdf.service.ts` faylining tegishli joyiga (PDF generation tugagandan keyin, imzo chizig'idan oldin) quyidagi mantiq qo'shiladi:

```typescript
// pos-pdf.service.ts ichida generateMovementAct metodida,
// movement ma'lumotlari o'qilgandan keyin:

// EP-POS-050 — 2-imzoli akt: issuer + receiver ma'lumotlari
let issuerData: PdfSignatureBlock | null = null;
let receiverData: PdfSignatureBlock | null = null;

if (movement.issuer_user_id) {
  const issuerR = await this.pdfRepo.findUserById(movement.issuer_user_id);
  if (issuerR.ok && issuerR.data) {
    issuerData = {
      fullName:  `${issuerR.data.first_name ?? ''} ${issuerR.data.last_name ?? ''}`.trim(),
      position:  issuerR.data.position_name ?? null,
      signedAt:  movement.issuer_signed_at ?? null,
      signatureHash: null,
    };
  }
}

if (movement.receiver_user_id) {
  const receiverR = await this.pdfRepo.findUserById(movement.receiver_user_id);
  if (receiverR.ok && receiverR.data) {
    receiverData = {
      fullName:  `${receiverR.data.first_name ?? ''} ${receiverR.data.last_name ?? ''}`.trim(),
      position:  receiverR.data.position_name ?? null,
      signedAt:  movement.receiver_signed_at ?? null,
      signatureHash: null,
    };
  }
}

const pdfData: PdfMovementData = {
  movementNumber:  movement.movement_number,
  typeCode:        movement.movement_type,
  status:          movement.status,
  createdAt:       movement.created_at,
  supplierName:    movement.supplier_name ?? null,
  documentNumber:  movement.document_number ?? null,
  fromWarehouse:   null, // repo dan olish
  toWarehouse:     null, // repo dan olish
  createdByName:   null, // repo dan olish
  issuer:          issuerData,
  receiver:        receiverData,
  lines: [], // mavjud mantiqdan
};
```

**PDF rendering — imzo bloki (pos-pdf.service.ts da mavjud `PDF_SIGNATURE_*` konstantalar ishlatiladi):**

```typescript
// PDF generatsiya tugagandan keyin, saqlashdan oldin:
// 2 ta imzo bloki: chapda issuer, o'ngda receiver
private renderSignatureBlocks(
  page: PDFPage,
  font: PDFFont,
  yStart: number,
  issuer: PdfSignatureBlock | null,
  receiver: PdfSignatureBlock | null,
): void {
  const leftX  = PDF_MARGIN;
  const rightX = page.getWidth() / 2 + PDF_MARGIN;
  const labelSize = PDF_SMALL_FONT_SIZE;
  const nameSize  = PDF_BODY_FONT_SIZE;

  // Chapda: Berdi (Issuer)
  page.drawText('Berdi:', { x: leftX, y: yStart, size: labelSize, font });
  if (issuer) {
    page.drawText(issuer.fullName, { x: leftX, y: yStart - 14, size: nameSize, font });
    if (issuer.position) {
      page.drawText(issuer.position, { x: leftX, y: yStart - 26, size: labelSize, font });
    }
    const signedStr = issuer.signedAt
      ? issuer.signedAt.toLocaleDateString('uz-UZ')
      : '___________';
    page.drawText(`Sana: ${signedStr}`, { x: leftX, y: yStart - 38, size: labelSize, font });
  }
  // Imzo chizig'i
  page.drawLine({
    start: { x: leftX, y: yStart - PDF_SIGNATURE_Y_GAP },
    end:   { x: leftX + 120, y: yStart - PDF_SIGNATURE_Y_GAP },
    thickness: PDF_SIGNATURE_LINE_THICKNESS,
  });

  // O'ngda: Qabul qildi (Receiver)
  page.drawText('Qabul qildi:', { x: rightX, y: yStart, size: labelSize, font });
  if (receiver) {
    page.drawText(receiver.fullName, { x: rightX, y: yStart - 14, size: nameSize, font });
    if (receiver.position) {
      page.drawText(receiver.position, { x: rightX, y: yStart - 26, size: labelSize, font });
    }
    const signedStr = receiver.signedAt
      ? receiver.signedAt.toLocaleDateString('uz-UZ')
      : '___________';
    page.drawText(`Sana: ${signedStr}`, { x: rightX, y: yStart - 38, size: labelSize, font });
  }
  // Imzo chizig'i
  page.drawLine({
    start: { x: rightX, y: yStart - PDF_SIGNATURE_Y_GAP },
    end:   { x: rightX + 120, y: yStart - PDF_SIGNATURE_Y_GAP },
    thickness: PDF_SIGNATURE_LINE_THICKNESS,
  });
}
```

> `pos-pdf.service.ts` faylida mavjud imzo chizig'i mantiqini OLIB TASHLAMANG (Q-46) — yangi `renderSignatureBlocks` private metodi QO'SHILADI, mavjud logika o'zgartirilmaydi. Faqat `generateMovementAct` ichida yangi metod chaqiriladi.

---

### QADAM 8: GL Dual-Write tuzatish — `pos.events.ts`

**Fayl:** `apps/api/src/modules/pos/application/event-handlers/pos.events.ts`

**Muammo (satr 131-144):** `onMovementApproved` eventida `autoGl.postForMovement()` chaqirilmoqda — bu `pos_gl_postings` subledgerga yozadi. Lekin `onMovementCompleted` (satr 179-184) da `glLedger.postMovementToCanonicalLedger()` kanonik `entries` ga yozadi. Ikkilamchi hisob xavfi.

**Yechim:** `onMovementApproved` da `autoGl.postForMovement()` chaqiruvi O'CHIRILADI. Faqat `completed` eventda `entries` ga yozish qoladi.

```typescript
// OLDIN (pos.events.ts:131-144):
    // AVTOMATIK GL POSTING — har tasdiqlangan harakat uchun
    try {
      const glR = await this.autoGl.postForMovement(payload.movementId);
      if (glR.ok && glR.data.posted > 0) {
        this.logger.log(`[AutoGL] ${payload.movementNumber}: ${glR.data.posted} ta GL yozuvi avtomatik yaratildi`);
        broadcastPosEvent('gl.posted', {
          movementId: payload.movementId,
          movementNumber: payload.movementNumber,
          entriesCount: glR.data.posted,
        });
      }
    } catch (e) {
      this.logger.warn(`[AutoGL] xato (${payload.movementNumber}): ${String(e)}`);
    }

// KEYIN (bu blok TO'LIQ OLIB TASHLANADI):
    // GL POSTING: 'approved' eventida OLINIB TASHLANDI (P48 GL-dedup fix).
    // Kanonik GL yozuv faqat 'completed' eventida entries jadvaliga yoziladi
    // (onMovementCompleted → glLedger.postMovementToCanonicalLedger).
    // pos_gl_postings subledger dual-write xavfini bartaraf etish uchun bu blok o'chirildi.
```

**`AutoGlPostingService` inject qilinishi ham olib tashlanishi kerak:**

```typescript
// OLDIN (pos.events.ts:48-52 — constructor):
  constructor(
    ...
    private readonly autoGl:          AutoGlPostingService,
    private readonly glLedger:        GlPostingLogService,
    ...
  ) {}

// KEYIN:
  constructor(
    ...
    // autoGl OLIB TASHLANDI — GL dual-write fix (P48)
    private readonly glLedger:        GlPostingLogService,
    ...
  ) {}
```

**Import ham olib tashlansin (satr 18):**

```typescript
// OLDIN:
import { AutoGlPostingService }    from '../services/auto-gl-posting.service';

// KEYIN:
// AutoGlPostingService import OLIB TASHLANDI — GL dual-write fix (P48)
// (auto-gl-posting.service.ts fayli o'chirilmaydi — boshqa joyda ishlatilishi mumkin)
```

> **Q-46 qoidasi:** `auto-gl-posting.service.ts` fayli O'CHIRILMAYDI — faqat `pos.events.ts` dagi inject va chaqiruv olib tashlanadi. Servis fayli owned files ro'yxatida bor lekin o'zi o'chirmang — boshqa modul yoki test ishlatishi mumkin.

---

### QADAM 9: Texkarta HARD BLOCK — `pos-movement.service.ts`

**Fayl:** `apps/api/src/modules/pos/application/services/pos-movement.service.ts`

**Mavjud holat (satr 82-87):** INTERNAL_ISSUE uchun faqat `lifecycleBlock.check()` — bu material interval tekshiruvi (Redis TTL). Texkarta spesifikatsiyasiga mos kelmaslik = HARD BLOCK mavjud emas.

**Qo'shiladigan blok (satr 82 atrofida, `INTERNAL_ISSUE && dto.receivedByEmployeeId && dto.lines` tekshiruvidan KEYIN):**

```typescript
// EP-POS-032 — Texkarta (technology card) HARD BLOCK
// INTERNAL_ISSUE: agar harakat biror ishlab chiqarish orderi bilan bog'liq bo'lsa,
// har bir liniya materialining texkarta spesifikatsiyasiga mosligini tekshir.
// Egasi javobi (OCHIQ-JAVOBLAR-2026-06-08.md):
//   "qizil ogohlantirish + QAT'IY BLOK (FAQAT smena/reja boshlig'i ruxsati)"
// → ForbiddenException (HARD BLOCK); override = FAQAT smena_boshlig yoki reja_boshlig roli.
if (movType.code === 'INTERNAL_ISSUE' && dto.productionOrderId && dto.lines?.length) {
  const techCardR = await this.repo.findTechCardMaterialsForOrder(dto.productionOrderId);
  if (techCardR.ok && techCardR.data && techCardR.data.length > 0) {
    const allowedMaterialIds = new Set(techCardR.data.map((m: { materialId: number }) => m.materialId));
    const blockedLines: string[] = [];
    for (const line of dto.lines) {
      if (!allowedMaterialIds.has(line.materialCardId)) {
        blockedLines.push(`Material ID ${line.materialCardId} texkarta spesifikatsiyasida yo'q`);
      }
    }
    if (blockedLines.length > 0) {
      // EP-POS-032: HARD BLOCK — override FAQAT smena_boshlig yoki reja_boshlig roli uchun.
      // Override mexanizmi: `CreateMovementSchema` ga `overrideReason: z.string().min(10).optional()`
      // va `overrideApprovedByRole: z.enum(['smena_boshlig','reja_boshlig']).optional()` qo'shiladi.
      // Bajaruvchi: `dto.overrideApprovedByRole` berilgan va joriy foydalanuvchi o'sha rolga ega bo'lsa
      // BLOCK o'tkazib yuboriladi, aks holda ForbiddenException.
      //
      // PERMISSION GATE (MANDATORY — egasi "faqat smena/reja boshlig'i ruxsati" degan):
      // 1. Tekshir: `dto.overrideApprovedByRole` berilganmi VA
      //    `currentUserRoles.includes('smena_boshlig') || currentUserRoles.includes('reja_boshlig')`
      // 2. Ha bo'lsa → blok o'tkazib yuboriladi (override log yoziladi)
      // 3. Yo'q bo'lsa → ForbiddenException (hech kim — smena/reja boshlig'i bundan mustasno)
      //
      // Misol (CreateMovementSchema ga qo'shilishi kerak — dto/movement.dto.ts):
      //   overrideReason:          z.string().min(10).max(500).optional(),
      //   overrideApprovedByRole:  z.enum(['smena_boshlig', 'reja_boshlig']).optional(),
      //
      // Misol (pos-movement.service.ts ga qo'shilishi kerak):
      //   const hasOverridePermission =
      //     dto.overrideApprovedByRole &&
      //     dto.overrideReason &&
      //     (currentUserRoles.includes('smena_boshlig') ||
      //      currentUserRoles.includes('reja_boshlig'));
      //   if (!hasOverridePermission) {
      //     throw new ForbiddenException(`[EP-POS-032] Texkarta HARD BLOCK:\n${blockedLines.join('\n')}`);
      //   }
      //   // Override log:
      //   await this.auditService.log({
      //     userId: createdById, action: 'pos.techcard.override',
      //     entityType: 'pos_movements', newValue: { blockedLines, reason: dto.overrideReason },
      //   });
      //
      // DIQQAT: `currentUserRoles` JWT payload'dan olinishi kerak (JwtAuthGuard orqali).
      // `@CurrentUser() user: AuthenticatedUser` controller'dan servisga uzatiladi.
      throw new ForbiddenException(
        `[EP-POS-032] Texkarta HARD BLOCK:\n${blockedLines.join('\n')}\n` +
        `Override uchun smena_boshlig yoki reja_boshlig roli + overrideReason talab qilinadi.`,
      );
    }
  }
  // Agar techCard topilmasa yoki bo'sh bo'lsa — blok qilinmaydi (order texkartsiz bo'lishi mumkin)
}
```

**`PosMovementRepository` da yangi metod qo'shish kerak:**

Bu `pos-movement.repository.ts` faylida yangi metod kerak: `findTechCardMaterialsForOrder`.

```typescript
// pos-movement.repository.ts ga qo'shiladi:
async findTechCardMaterialsForOrder(
  productionOrderId: string,
): Promise<Result<Array<{ materialId: number }>>> {
  try {
    // technology_cards → technology_card_materials orqali
    // Agar jadval tuzilmasi boshqacha bo'lsa — TO'XTA va egasiga flag qil
    const rows = await db.execute(sql`
      SELECT DISTINCT tcm.material_id AS "materialId"
      FROM technology_cards tc
      JOIN technology_card_materials tcm ON tcm.technology_card_id = tc.id
      JOIN papka_orders po ON po.technology_card_id = tc.id
      WHERE po.id::text = ${productionOrderId}
        AND tc.deleted_at IS NULL
    `);
    const data = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
    return Ok(data as Array<{ materialId: number }>);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

> **DIQQAT:** `technology_cards` va `papka_orders` jadval tuzilmasi owned files tashqarida. Agar jadval nomi yoki ustunlar boshqacha bo'lsa — bu metodning ichini TO'XTA va egasiga flag qil. `pos-movement.repository.ts` ichidagi metod qo'shishdan oldin `papka_orders.technology_card_id` ustunini verify qil.

**`CreateMovementSchema` (movement.dto.ts) ga `productionOrderId` qo'shish:**

```typescript
// OLDIN (movement.dto.ts:39-60):
export const CreateMovementSchema = z.object({
  ...
  purchaseOrderId:      z.string().optional(),
  ...
});

// KEYIN — productionOrderId allaqachon `purchaseOrderId` dan alohida kerak:
export const CreateMovementSchema = z.object({
  ...
  purchaseOrderId:      z.string().optional(),
  productionOrderId:    z.string().optional(), // EP-POS-032 texkarta guard uchun
  ...
});
```

---

---

### QADAM 9B: Foto-dalil MAJBURIY enforcement — `pos-movement.service.ts`

**EP-POS-069 egasi javobi (OCHIQ-JAVOBLAR-2026-06-08.md):**
> "Foto-dalil = **Ha, majburiy** (buzuq qabul/brak/katta farqda planshet kamerasidan foto)."

**Hozirgi holat (CONFORMANCE BUG):** `photo_urls` ustuni DDL sxemada mavjud (QADAM 4), lekin
`createMovement` servis metodida bu ustun faqat SAQLANADI — zarur bo'lganda TEKSHIRILMAYDI.
`EXTERNAL_IN`, `DAMAGE`, va `discrepancy > 10%` harakatlar uchun foto yo'q bo'lsa ruxsat berilmoqda.

**Fayl:** `apps/api/src/modules/pos/application/services/pos-movement.service.ts`

**Qo'shiladigan enforcement blok** (`createMovement` metodida, `movType.code` aniqlangandan keyin):

```typescript
// EP-POS-069 — Foto-dalil MAJBURIY enforcement
// Egasi javobi: "buzuq qabul/brak/katta farqda foto MAJBURIY" (OCHIQ-JAVOBLAR-2026-06-08.md)
const photoRequiredTypes: string[] = ['EXTERNAL_IN', 'DAMAGE'];
const isPhotoRequired =
  photoRequiredTypes.includes(movType.code) ||
  // Katta farq (discrepancy > 10%): harakat qatoridagi actualQty vs expectedQty
  (dto.discrepancyPct !== undefined && dto.discrepancyPct > 10);

if (isPhotoRequired) {
  const hasPhotos = Array.isArray(dto.photoUrls) && dto.photoUrls.length > 0;
  if (!hasPhotos) {
    throw new BadRequestException(
      `[EP-POS-069] Foto-dalil MAJBURIY: ${movType.code} turi yoki katta farqda ` +
      `kamida 1 ta foto biriktiring (photo_urls bo'sh bo'lishi mumkin emas).`,
    );
  }
}
```

**`CreateMovementSchema` (movement.dto.ts) ga qo'shimcha maydonlar:**
```typescript
// movement.dto.ts ga qo'shilishi kerak (agar mavjud bo'lmasa):
photoUrls:       z.array(z.string().url()).optional().default([]),
discrepancyPct:  z.number().min(0).max(100).optional(), // EP-POS-069: katta farq foizi
```

> **DIQQAT:** `movement.dto.ts` bu paket owned files ro'yxatida (7-chi fayl). `photoUrls` va
> `discrepancyPct` maydonlarini `CreateMovementSchema` ga qo'shing. Agar DTO da allaqachon
> `photoUrls` mavjud bo'lsa — o'zgartirmang (Q-46).

> **FE flag:** Planshet kamera capture UI faqat P49 doirasida (P48 BE only). FE upload'dan
> qaytgan URL(lar) `photoUrls` arrayiga yoziladi, so'ngra `POST /api/pos/movements` ga yuboriladi.

---

### QADAM 10: Storno (teskari harakat) — `pos-movement.service.ts` + `pos-movement.repository.ts`

**EP-POS-022:** Tasdiqlangan (`approved` yoki `completed`) harakat bekor qilinsa, yangi teskari harakat yaratiladi. Asl harakat o'zgarmas (`immutable`), storno yozuvi bog'lanadi.

**`pos-movement.service.ts` da yangi metod:**

```typescript
/**
 * EP-POS-022 — Storno: tasdiqlangan harakatning teskari nusxasini yaratish.
 * - `approved` yoki `completed` status bo'lsa ishga tushiriladi
 * - Asl harakat o'zgarmas qoladi (is_storno=false, cancel_reason=null)
 * - Yangi storno harakati yaratiladi: is_storno=true, storno_of_movement_id=asl.id
 * - Storno harakati zudlik bilan `completed` statusida yaratiladi (ombor balansini qaytaradi)
 */
async createStorno(
  originalMovementId: number,
  reason: string,
  createdById: number,
  ipAddress?: string,
): Promise<Result<PosMovementRow, AppError>> {
  return safeCall(async () => {
    // 1. Asl harakat topish
    const origR = await this.repo.findById(originalMovementId);
    if (!origR.ok || !origR.data) {
      throw new NotFoundException(`Harakat ${originalMovementId} topilmadi`);
    }
    const orig = origR.data;

    // 2. Storno faqat approved yoki completed uchun ruxsat
    if (orig.status !== 'approved' && orig.status !== 'completed') {
      throw new BadRequestException(
        `Storno faqat 'approved' yoki 'completed' harakatlar uchun. Hozirgi status: '${orig.status}'`,
      );
    }

    // 3. Agar allaqachon storno bo'lsa — ikkinchi storno taqiq
    if (orig.is_storno) {
      throw new BadRequestException('Storno harakatning stornosini yaratib bo\'lmaydi');
    }

    // 4. Mavjud storno bormi tekshir
    const existingStornoR = await this.repo.findStornoForMovement(originalMovementId);
    if (existingStornoR.ok && existingStornoR.data) {
      throw new BadRequestException(
        `Harakat ${originalMovementId} uchun storno allaqachon mavjud: ${existingStornoR.data.movement_number}`,
      );
    }

    // 5. Storno harakat raqami
    const countR = await this.repo.countMovements();
    const count = countR.ok ? (countR.data as number) : 0;
    const stornoNumber = `STORNO-${_time.now().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // 6. Storno insertMovement — from/to almashtiriladi (teskari oqim)
    const stornoR = await this.repo.insertMovement({
      movementNumber:       stornoNumber,
      movementType:         orig.movement_type as PosMovementType,
      status:               'completed', // storno zudlik bilan bajariladi
      fromWarehouseId:      orig.to_warehouse_id ?? undefined,   // teskari
      toWarehouseId:        orig.from_warehouse_id ?? undefined, // teskari
      receivedByEmployeeId: orig.received_by_employee_id ?? undefined,
      createdBy:            createdById,
      returnReason:         reason,
      currency:             orig.currency,
      exchangeRate:         Number(orig.exchange_rate),
      notes:                `Storno: ${orig.movement_number} — ${reason}`,
      isStorno:             true,
      stornoOfMovementId:   orig.id,
      completedAt:          new Date(),
    });
    if (!stornoR.ok) throw new InternalServerErrorException(stornoR.error.message);
    const stornoMov = stornoR.data;

    // 7. Asl harakat qatorlarini teskari miqdorda stornoga ko'chirish
    const linesR = await this.repo.findLinesByMovementId(originalMovementId);
    if (linesR.ok && Array.isArray(linesR.data)) {
      for (const line of linesR.data) {
        await this.repo.insertLine({
          movementId:     stornoMov.id,
          materialCardId: line.material_id,
          batchId:        line.batch_id ?? undefined,
          binLocation:    line.bin_location ?? undefined,
          unit:           line.unit,
          quantity:       line.quantity, // teskari ishorasi warehouse servis darajasida
          unitPrice:      line.unit_price,
          totalPrice:     line.total_price,
          currency:       line.currency ?? 'UZS',
          exchangeRate:   line.exchange_rate ?? 1,
          unitPriceBase:  line.unit_price_base ?? 0,
          totalPriceBase: line.total_price_base ?? 0,
          fifoSequence:   0,
          sortOrder:      line.sort_order,
          notes:          `Storno qatori`,
        });
      }
    }

    // 8. Audit log
    await this.auditService.log({
      userId:     createdById,
      action:     'pos.movement.storno_created',
      entityType: 'pos_movements',
      entityId:   stornoMov.id,
      newValue:   { stornoNumber, originalMovementId, reason },
      ipAddress,
    });

    // 9. Event chiqarish
    this.eventEmitter.emit('pos.movement.data.storno_created', {
      movementId:       stornoMov.id,
      movementNumber:   stornoMov.movement_number,
      originalId:       originalMovementId,
      originalNumber:   orig.movement_number,
      createdById,
    });

    this.logger.log(`[Storno] ${stornoNumber} yaratildi → asl: ${orig.movement_number}`);
    return stornoMov;
  });
}
```

**`pos-movement.repository.ts` da yangi metodlar:**

```typescript
// Mavjud findById ni tekshir — agar yo'q bo'lsa qo'shiladi:
async findById(id: number): Promise<Result<PosMovement | null>> {
  try {
    const [row] = await db.select().from(posMovements).where(eq(posMovements.id, id));
    return Ok(row ?? null);
  } catch (_e) {
    return Err(String(_e));
  }
}

// Storno mavjudligini tekshirish:
async findStornoForMovement(originalMovementId: number): Promise<Result<PosMovement | null>> {
  try {
    const [row] = await db.select().from(posMovements).where(
      eq(posMovements.stornoOfMovementId, originalMovementId),
    );
    return Ok(row ?? null);
  } catch (_e) {
    return Err(String(_e));
  }
}

// Qatorlarni harakat bo'yicha olish:
async findLinesByMovementId(movementId: number): Promise<Result<PosMovementLine[]>> {
  try {
    const rows = await db.select().from(posMovementLines).where(
      eq(posMovementLines.movementId, movementId),
    );
    return Ok(Array.isArray(rows) ? rows : []);
  } catch (_e) {
    return Err(String(_e));
  }
}

// Bitta qator insert:
async insertLine(lineRow: Omit<typeof posMovementLines.$inferInsert, 'id'>): Promise<Result<PosMovementLine>> {
  try {
    const [line] = await db.insert(posMovementLines).values(lineRow).returning();
    return Ok(line);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

**`movement.dto.ts` da storno DTO:**

```typescript
// CreateStornoSchema — pos-movement.service.ts::createStorno uchun
export const CreateStornoSchema = z.object({
  reason: z.string().min(5).max(500, { message: 'Storno sababi 5-500 belgi bo\'lishi kerak' }),
});
export class CreateStornoDto extends createZodDto(CreateStornoSchema) {}
```

---

### QADAM 11: `pos-movement-status.service.ts` — storno trigger qo'shish

**Fayl:** `apps/api/src/modules/pos/application/services/pos-movement-status.service.ts`

Agar `pos-movement-status.service.ts` da `updateStatus` metodi `cancelled` holatga o'tishda `stornoOfMovementId` ni tekshirmasa, quyidagi qo'shimcha yoziladi:

```typescript
// updateStatus metodining oxirida, status 'completed' ga o'tganda:
// (storno createStorno orqali alohida yaratiladi — bu yerda faqat audit)
// Bu fayl owned bo'lganligi sababli, faqat tekshirish qo'shiladi:
// Agar movement.is_storno === true bo'lsa — GL posting o'tkazilmasin (completed eventda)
```

> **Eslatma:** Storno harakat `is_storno=true` bilan `completed` statusida yaratiladi. `onMovementCompleted` event handlerda `is_storno` tekshiruvi qo'shilishi kerak — lekin `pos.events.ts` owned files ro'yxatida, shu yerda yoziladi.

**`pos.events.ts` da `onMovementCompleted` — storno GL skip:**

```typescript
// OLDIN (pos.events.ts:168-184):
  @OnEvent('pos.movement.data.completed')
  async onMovementCompleted(payload: MovementStatusChangedEvent) {
    this.logger.log(`Event: pos.movement.completed — ${payload.movementNumber}`);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: 'completed' });
    const mv = await this.eventRepo.findMovementCreator(payload.movementId);
    if (mv?.createdBy) { ... }
    const finUsers = await this.eventRepo.findByRoles(['finance_head']);
    for (const u of finUsers) { ... }

    try {
      await this.glLedger.postMovementToCanonicalLedger(payload.movementId, payload.updatedById ?? 0);
      ...
    } catch (e) { ... }
  }

// KEYIN — storno harakatlar uchun GL o'tkazilmaydi:
  @OnEvent('pos.movement.data.completed')
  async onMovementCompleted(payload: MovementStatusChangedEvent) {
    this.logger.log(`Event: pos.movement.completed — ${payload.movementNumber}`);
    broadcastPosEvent('movement.confirmed', { id: payload.movementId, status: 'completed' });
    const mv = await this.eventRepo.findMovementCreator(payload.movementId);
    if (mv?.createdBy) { this.n(mv.createdBy, 'MOVEMENT_COMPLETED', 'Harakat yakunlandi', `${payload.movementNumber} bajarildi`, payload.movementId); }
    const finUsers = await this.eventRepo.findByRoles(['finance_head']);
    for (const u of finUsers) { this.n(u.id, 'MOVEMENT_COMPLETED', 'Harakat yakunlandi', `${payload.movementNumber} stock ledgerga yozildi`, payload.movementId); }

    // P48: Storno harakatlar uchun GL o'tkazilmaydi (ikkilamchi hisob oldini olish)
    // is_storno tekshiruvi: eventRepo.findMovementCreator da is_storno maydoni qaytarilishi kerak
    if (mv?.isStorno) {
      this.logger.log(`[GL→entries] Storno harakat ${payload.movementNumber} — GL o'tkazilmadi`);
      return;
    }

    try {
      await this.glLedger.postMovementToCanonicalLedger(payload.movementId, payload.updatedById ?? 0);
      broadcastPosEvent('gl.posted', { movementId: payload.movementId, movementNumber: payload.movementNumber, ledger: 'entries' });
    } catch (e) {
      this.logger.warn(`[GL→entries] completed-post xato (${payload.movementNumber}): ${String(e)}`);
    }
  }
```

> **Eslatma:** `eventRepo.findMovementCreator` metodi `is_storno` maydonini qaytarmasa — `PosEventRepository` faylini (owned emas) TO'XTA va egasiga flag qil. Faqat `pos.events.ts` da o'zgarish qil, va agar `mv?.isStorno` aniqlanmasa `null` tashlab ketma — `false` default qo'y.

---

## 5. DDL (MIGRATION — GATED)

**Fayl:** `apps/api/src/shared/db/migrations/pos-phase1-ddl.sql`

Bu fayl YARATILADI lekin `-- GATED` belgisi bilan. Egasi `-- APPROVED: <ism> YYYY-MM-DD`
izohini qo'shmaguncha HECH QACHON ishga tushirilmaydi.

```sql
-- ============================================================
-- P48 — POS Monitor Schema DDL
-- GATED: Egasi ruxsatisiz ishga tushirilmaydi.
-- APPROVED: _____________________ __________ (ism + sana)
-- ============================================================

-- 1. pos_movement_type_enum ga yangi qiymatlar
-- (PostgreSQL 12+: IF NOT EXISTS qo'llab-quvvatlanadi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'pos_movement_type_enum'
      AND e.enumlabel = 'SCRAP_IN'
  ) THEN
    ALTER TYPE pos_movement_type_enum ADD VALUE 'SCRAP_IN';
  END IF;
END $$;
-- APPROVED: _____________________ __________ (SCRAP_IN)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'pos_movement_type_enum'
      AND e.enumlabel = 'FG_FROM_MES'
  ) THEN
    ALTER TYPE pos_movement_type_enum ADD VALUE 'FG_FROM_MES';
  END IF;
END $$;
-- APPROVED: _____________________ __________ (FG_FROM_MES)

-- 2. pos_movements jadvaliga yangi ustunlar
ALTER TABLE pos_movements
  ADD COLUMN IF NOT EXISTS photo_urls       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS issuer_user_id   integer,
  ADD COLUMN IF NOT EXISTS receiver_user_id integer,
  ADD COLUMN IF NOT EXISTS issuer_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receiver_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS storno_of_movement_id integer,
  ADD COLUMN IF NOT EXISTS is_storno        boolean NOT NULL DEFAULT false;
-- APPROVED: _____________________ __________ (pos_movements cols)

-- 3. pos_movement_lines — bin_id → bin_location rename
-- DIQQAT: Agar bin_id ustuni mavjud bo'lsa rename qilinadi;
-- agar allaqachon bin_location bo'lsa bu blok o'tkazib yuboriladi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_movement_lines'
      AND column_name = 'bin_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_movement_lines'
      AND column_name = 'bin_location'
  ) THEN
    ALTER TABLE pos_movement_lines RENAME COLUMN bin_id TO bin_location;
    -- varchar hajmini ham kengaytirish:
    ALTER TABLE pos_movement_lines ALTER COLUMN bin_location TYPE varchar(100);
  END IF;
END $$;
-- APPROVED: _____________________ __________ (bin_id→bin_location)

-- 4. FK indekslar (performance)
CREATE INDEX IF NOT EXISTS idx_pos_movements_storno_of
  ON pos_movements(storno_of_movement_id)
  WHERE storno_of_movement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pos_movements_issuer
  ON pos_movements(issuer_user_id)
  WHERE issuer_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pos_movements_receiver
  ON pos_movements(receiver_user_id)
  WHERE receiver_user_id IS NOT NULL;

-- 5. Enum qayta tekshiruvi (ROLLBACK testi uchun)
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'pos_movement_type_enum'
ORDER BY enumsortorder;
-- Natijada SCRAP_IN va FG_FROM_MES ko'rinishi kerak.
```

---

## 6. QABUL MEZONI

```
[ ] BE tsc 0 — npx tsc --noEmit (apps/api va lib/db uchun)
[ ] FE tsc 0 — pnpm --filter erp-dashboard run type-check
[ ] Enum mismatch tuzatildi:
    [ ] quarantine-workflow.service.ts da 'karantin' → 'qc_pending'
    [ ] VALID_TRANSITIONS da 'karantin' state olib tashlandi
    [ ] movementTypeEnum va MovementTypeCode da SCRAP_IN, FG_FROM_MES qo'shildi
[ ] GL dual-write bartaraf:
    [ ] onMovementApproved da autoGl.postForMovement() chaqiruvi olib tashlandi
    [ ] onMovementCompleted da faqat glLedger.postMovementToCanonicalLedger() qoldi
    [ ] Storno harakatlar uchun GL skip ishlaydi
[ ] 2-imzoli PDF akt:
    [ ] PdfMovementData da issuer, receiver bloki bor
    [ ] pos-pdf.service.ts da renderSignatureBlocks metodi qo'shildi
    [ ] pos_movements sxemasi da issuer_user_id, receiver_user_id (Drizzle schema)
[ ] Texkarta HARD BLOCK (EP-POS-032):
    [ ] INTERNAL_ISSUE + productionOrderId + texkarta → ForbiddenException
    [ ] Override FAQAT smena_boshlig yoki reja_boshlig roli + overrideReason bilan
    [ ] Override log auditServicega yoziladi
    [ ] Agar texkarta yo'q → o'tkazib yuboriladi (blok qilinmaydi)
[ ] Foto-dalil MAJBURIY enforcement (EP-POS-069):
    [ ] EXTERNAL_IN harakati fotoUrls=[] bo'lsa → 400 BadRequestException
    [ ] DAMAGE harakati fotoUrls=[] bo'lsa → 400 BadRequestException
    [ ] discrepancyPct > 10% bo'lsa fotoUrls=[] → 400 BadRequestException
    [ ] CreateMovementSchema da photoUrls va discrepancyPct maydonlari mavjud
[ ] Storno:
    [ ] createStorno metodi pos-movement.service.ts da mavjud
    [ ] approved yoki completed harakat uchun teskari harakat yaratiladi
    [ ] is_storno=true, storno_of_movement_id=asl.id
    [ ] Ikkinchi storno taqiqlangan
[ ] bin_id → binLocation mismatch:
    [ ] Drizzle schema da binLocation varchar('bin_location', 100)
    [ ] DTO da binLocation z.string().max(100)
[ ] DDL migration:
    [ ] pos-phase1-ddl.sql yaratildi
    [ ] '-- GATED' belgisi bor
    [ ] Faylda APPROVED satri BLANK (egasi to'ldiradi)
[ ] Reviewer tekshiruvlari:
    [ ] bash scripts/reviewer-result-pattern.sh — FAIL: 0
    [ ] bash scripts/reviewer-as-unknown.sh — yangi FAIL yo'q
    [ ] bash scripts/reviewer-jwt-guard.sh — PASS
[ ] Oltin zanjir regress yo'q:
    [ ] EXTERNAL_IN → completed oqim ishlaydi (GL faqat completed da)
    [ ] INTERNAL_ISSUE mavjud funksionalligi o'zgartirilmagan (faqat texkarta guard qo'shildi)
[ ] DB-proof (jonli isbotlash):
    [ ] EXTERNAL_IN harakat yarating, completed ga yetkazing
    [ ] SELECT * FROM entries WHERE document_id = <id>; — bitta yozuv
    [ ] pos_gl_postings da ikkinchi yozuv YO'Q (approved va completed orasida)
[ ] Storno DB-proof:
    [ ] approved harakat yarating, createStorno chaqiring
    [ ] SELECT * FROM pos_movements WHERE storno_of_movement_id = <asl_id>; — bitta qator
    [ ] is_storno = true ko'rinadi
```

---

## 7. SELF-VERIFY

**Backend typecheck:**
```bash
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
npx tsc -p apps/api/tsconfig.json --noEmit 2>&1 | head -30
npx tsc -p lib/db/tsconfig.json --noEmit 2>&1 | head -30
```

**Reviewer skriptlar:**
```bash
bash scripts/reviewer-result-pattern.sh 2>&1 | tail -5
bash scripts/reviewer-as-unknown.sh 2>&1 | tail -5
bash scripts/reviewer-jwt-guard.sh 2>&1 | tail -5
```

**Enum mismatch tekshirish (grep):**
```bash
# 'karantin' qolgan joylar bormi? (0 bo'lishi kerak owned files da)
grep -rn "'karantin'" apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts
grep -rn "'karantin'" apps/api/src/modules/pos/application/services/pos-movement-status.constants.ts
# Natija: bo'sh (0 ta topilma)
```

**Enum qiymatlari tekshirish:**
```bash
grep -n "SCRAP_IN\|FG_FROM_MES" \
  lib/db/src/schema/pos-schema-v2.ts \
  apps/api/src/modules/pos/dto/movement-enums.ts
# Natija: har ikkala faylda ham topilishi kerak
```

**GL dual-write tekshirish:**
```bash
# autoGl.postForMovement FAQAT completed eventda emas, approved da ham qolmasligi:
grep -n "autoGl\|postForMovement" apps/api/src/modules/pos/application/event-handlers/pos.events.ts
# Natija: 0 ta topilma (olib tashlangan)
```

**2-sig PDF tip tekshirish:**
```bash
grep -n "issuer\|receiver\|PdfSignatureBlock" \
  apps/api/src/modules/pos/application/services/pos-pdf.types.ts
# Natija: ikkala maydon topiladi
```

**DB-proof — EXTERNAL_IN yaratib, completed ga yetkazish:**
```bash
# 1. Harakat yaratish (faqat test uchun, real env da):
curl -X POST http://localhost:3030/api/pos/movements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"movementTypeCode":"EXTERNAL_IN","toWarehouseId":"QC-HOLD","lines":[{"materialCardId":1,"quantity":10,"unitPrice":100}]}'

# 2. completed ga yetkazish (status transitions orqali)
# 3. DB tekshiruv:
# docker exec <postgres-container> psql -U europrint europrint \
#   -c "SELECT COUNT(*) FROM entries WHERE document_type='pos_movement' AND document_id=<id>;"
# Natija: count=1 (dual-write yo'q)
```

**Storno DB-proof:**
```bash
# 1. approved harakat oling:
# curl GET /api/pos/movements?status=approved

# 2. Storno yarating:
# curl -X POST /api/pos/movements/<id>/storno \
#   -H "Authorization: Bearer <token>" \
#   -d '{"reason":"Test storno — P48 verify"}'

# 3. DB tekshirish:
# SELECT id, movement_number, is_storno, storno_of_movement_id, status
# FROM pos_movements
# WHERE storno_of_movement_id = <asl_id>;
# Natija: bitta qator, is_storno=true, status='completed'
```

---

## 8. COMMIT

**git add faqat aniq fayllar (HECH QACHON -A yoki .):**

```bash
git add lib/db/src/schema/pos-schema-v2.ts
git add lib/db/src/schema/pos-schema-extensions.ts
git add apps/api/src/shared/db/migrations/pos-phase1-ddl.sql
git add apps/api/src/modules/pos/dto/movement-enums.ts
git add apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts
git add apps/api/src/modules/pos/application/services/pos-movement-status.constants.ts
git add apps/api/src/modules/pos/dto/movement.dto.ts
git add apps/api/src/modules/pos/application/event-handlers/pos.events.ts
git add apps/api/src/modules/pos/application/services/pos-movement.service.ts
git add apps/api/src/modules/pos/application/services/pos-movement-status.service.ts
git add apps/api/src/modules/pos/application/services/auto-gl-posting.service.ts
git add apps/api/src/modules/pos/application/services/pos-pdf.service.ts
git add apps/api/src/modules/pos/application/services/pos-pdf.types.ts
git add apps/api/src/modules/pos/infrastructure/repositories/pos-movement.repository.ts
```

**Commit xabari formati:**

```
git commit -m "$(cat <<'EOF'
feat(pos): P48 — enum fixes + GL dedup + storno + 2-sig act + texkarta guard

- karantin→qc_pending enum mismatch barcha owned fayllarda tuzatildi
- movementTypeEnum + MovementTypeCode: SCRAP_IN, FG_FROM_MES qo'shildi (DDL GATED)
- GL dual-write bartaraf: autoGl.postForMovement onMovementApproved dan olib tashlandi;
  faqat onMovementCompleted→entries kanonik (EP-POS GL-dedup)
- pos_movements Drizzle schema: photo_urls, issuer/receiver_user_id, storno cols
- PdfMovementData: PdfSignatureBlock + issuer/receiver (EP-POS-050)
- pos-pdf.service: renderSignatureBlocks — 2-imzoli akt rendering
- pos-movement.service: createStorno (EP-POS-022) — approved/completed teskari harakat
- pos-movement.service: texkarta HARD BLOCK INTERNAL_ISSUE+productionOrderId (EP-POS-032)
- pos-phase1-ddl.sql GATED migration yaratildi (egasi ruxsati kutilmoqda)
- bin_id→binLocation Drizzle schema tuzatildi (DTO mosligi)
- VALID_TRANSITIONS: karantin state olib tashlandi (DB enum sinxron)

BE tsc: 0 | Reviewer: PASS | DDL: GATED (egasi imzosini kutmoqda)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## QABUL QO'YISH TARTIBI (Sign-off)

Bajaruvchi har bosqich tugagach quyidagi shablonni to'ldiradi va egaga yuboradi:

```
P48 HOLAT HISOBOTI:
✅ QADAM 1: Enum (SCRAP_IN, FG_FROM_MES) — DONE | commit: ________
✅ QADAM 2: quarantine karantin→qc_pending — DONE | commit: ________
✅ QADAM 3: VALID_TRANSITIONS tuzatish — DONE | commit: ________
✅ QADAM 4: pos_movements Drizzle schema (photo_urls, 2-sig, storno) — DONE | commit: ________
✅ QADAM 5: bin_id→binLocation — DONE | commit: ________
✅ QADAM 6: PdfMovementData 2-sig blok — DONE | commit: ________
✅ QADAM 7: pos-pdf.service renderSignatureBlocks — DONE | commit: ________
✅ QADAM 8: GL dual-write o'chirish — DONE | commit: ________
✅ QADAM 9: Texkarta HARD BLOCK (EP-POS-032) — DONE | commit: ________
   (override gate: smena_boshlig/reja_boshlig roli + overrideReason + audit log)
✅ QADAM 9B: Foto-dalil MAJBURIY enforcement (EP-POS-069) — DONE | commit: ________
   (EXTERNAL_IN + DAMAGE + discrepancyPct > 10% uchun photoUrls[] majburiy)
✅ QADAM 10: Storno metodi — DONE | commit: ________
✅ QADAM 11: Storno GL skip — DONE | commit: ________
🔴 DDL migration: GATED — egasi ruxsati kutilmoqda

Deferred (scope tashqarida — alohida paket talab qiladi):
- FG_FROM_MES MesSessionCompletedEvent listener (MES moduli bilan birgalikda)
- SCRAP_IN biznes logikasi — EP-POS-037 faqat 501 stub (501 controller deferred)
- GSD metrics → org_functions push (EP-POS-029/056)
- Cycle count daily rotation scheduler (EP-POS-017)
- AI anomaly detection (EP-POS-077)
- Supplier return auto-creation on QC rejection (EP-POS-059)
- ZXing.js camera fallback (EP-POS-006)
- pres-kirim fast-path (Phase 6)
- Overflow logic excess tracking (EP-POS-042)

BE tsc: 0 | FE tsc: 0 | reviewer-result-pattern: FAIL=0 | DDL: GATED
```

---

## MUHIM ESLATMALAR

### ⚠️ Owned Files tashqarisiga chiqmaslik

Quyidagi fayllar bu paketda **TEGILMAYDI** (boshqa paket yoki egasi ruxsati kerak):

- `apps/api/src/modules/pos/infrastructure/repositories/quarantine-workflow.repository.ts` — `escalateExpiredQuarantine` metodi ichida `'karantin'` string bo'lishi mumkin. Agar shu bo'lsa egasiga flag qil, o'zgartirishni so'ra.
- `apps/api/src/modules/pos/infrastructure/repositories/pos-event.repository.ts` — `findMovementCreator` metodi `is_storno` qaytarishi kerak. Bu owned fayl emas — egasiga flag qil.
- `apps/api/src/modules/pos/presentation/movements.controller.ts` — `/storno` endpoint qo'shish kerak. Controller owned emas — egasiga flag qil.
- `artifacts/erp-dashboard/src/pos-monitor/` — FE o'zgarishlar bu paketda yo'q (BE only scope)

### ⚠️ qcDecision REWORK bugini ham tuzating

`quarantine-workflow.service.ts:86-89` da:
```
decision === 'REWORK' ? 'approved' : 'rejected'
```
Bu noto'g'ri — REWORK → `qc_rework` bo'lishi kerak. Shu fayl owned, shu yerda ham tuzating.

### ⚠️ `insertMovement` — yangi ustunlar uchun

`pos-movement.repository.ts:56` da `insertMovement` metodi `isStorno` va `stornoOfMovementId` ustunlarini qabul qilishi kerak. Schema yangilangandan keyin Drizzle `$inferInsert` avtomatik bu ustunlarni oladi — alohida yozuv kerak emas.

### ⚠️ `auto-gl-posting.service.ts` O'CHIRILMAYDI

Servis fayli Q-46 bo'yicha o'chirilmaydi — faqat `pos.events.ts` dagi inject va chaqiruv olib tashlanadi. `auto-gl-posting.service.ts` o'zida test yoki boshqa joy chaqirishi mumkin.

---

*P48 direktiva yakunlandi. Qatorlar: ≥1000 (Q-47 qoida). Bajaruvchi: Muslimbek.*
*Vizyon manba: docs/audit/MUSLIMBEK-PROMT-22-POS-2026-06-08.md*
*Yozilgan: 2026-06-19*
