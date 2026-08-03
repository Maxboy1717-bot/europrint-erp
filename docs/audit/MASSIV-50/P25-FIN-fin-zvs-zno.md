# P25 — FIN — Finance/GL + KASSIR: FIN ZVS/ZNO 6-state FSM + thresholds + GL auto-post + escalation

> **Agent:** P25 · **Wave:** 2 · **DependsOn:** P01 (lib barrel) must be merged first  
> **DDL Gate:** FAOL — migration yoziladi, lekin APPROVED: belgisiz ISHGA TUSHIRILMAYDI  
> **Owned files:** 8 fayl (quyida §1 da aniq ro'yxat)  
> **Vision doc:** `docs/audit/MUSLIMBEK-PROMT-10-FIN-2026-06-08.md` §PHASE 2  

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI** agentsan. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi. Quyidagi qoidalar istisnasiz amal qiladi:

**QOIDALAR BLOKI (Q-47 — har direktivada kiritilsin):**

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40** ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ. To'g'rilik o'lchovi = master vizyon (`docs/`).
5. **Q-46** ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI** (Q-23/Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI** (Q-35): `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. DDL faylni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify:** BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. `"V2"`/`"Strangler Fig"`/`"V1 vs V2"` terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**WAVE 2 maxsus qoidalar:**
- P01 (lib barrel) merge bo'lmagan bo'lsa → STOP, egasiga xabar ber.
- Director module `ZNO_REPO` / `ZVS_REPO` provider'lari — OWNED, o'zgartirishingiz mumkin.
- Finance module `eventListeners` arrayi — OWNED, yangi listener qo'shing.
- Boshqa module (SD, HR, PP, WMS) fayllari — TEGMA, event orqali ishlang.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu fayllarga teg; boshqasi kerak bo'lsa TO'XTA + flag:**

```
Uzbek-Language-Module/apps/api/src/modules/director/application/zno.service.ts
Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/zno.repository.ts
Uzbek-Language-Module/apps/api/src/modules/director/application/zvs.service.ts
Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/event-handlers/zno-approved.listener.ts   ← YANGI FAYL (yo'q, yaratiladi)
Uzbek-Language-Module/apps/api/src/modules/finance/finance.module.ts
Uzbek-Language-Module/apps/api/src/modules/director/director.module.ts
Uzbek-Language-Module/lib/db/src/schema/fi-zvs-zno.ts                                                        ← YANGI FAYL (yo'q, yaratiladi)
Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceApproval.tsx
```

**DDL GATED fayl** (§5 da SQL bor, APPROVED: belgisisiz run qilma):
```
Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/migrations/d6-zvs-zno-fsm.sql
```

**Bu fayllarga TEGMA** (boshqa paket):
- `apps/api/src/modules/director/presentation/zno.controller.ts` — P26/boshqa paketi
- `apps/api/src/modules/director/presentation/zvs.controller.ts` — P26/boshqa paketi
- `apps/api/src/modules/director/domain/repositories/i-zno.repo.ts` — interfeys o'zgarmaydi (yoki maxsus ruxsat bilan)
- `apps/api/src/modules/director/infrastructure/repositories/zvs.repository.ts` — P25 scope'ida emas (zvs.service.ts threshold fix orqali yetarli)
- Har qanday `hr-*`, `sd-*`, `pp-*`, `wms-*`, `crm-*` fayl
- `lib/db/src/schema/fi-gl.ts` — P01 tomonidan ownedga olindi

---

## 2. VIZYON

### EP-FIN-029 — 6-holatli ZNO FSM (oldindan 3 holat bor: pending/approved/rejected)

**Vizyon (MUSLIMBEK-PROMT-10-FIN §PHASE 2):**

```
Yangi → Bo'lim → Kengash → Direktor → To'langan → Rad
```

- `Yangi` = yaratilgan, hech kim ko'rmagan
- `Bo'lim` = bo'lim boshlig'i ko'rib chiqmoqda (summa ≤ 500k avtomatik bu darajadan o'tadi)
- `Kengash` = Рек.Совет/CFO ko'rib chiqmoqda (500k < summa ≤ 5M)
- `Direktor` = Direktor/CEO tasdiqlamoqda (summa > 5M)
- `To'langan` = ZNO tasdiqlandi VA GL yozuvi amalga oshirildi
- `Rad` = har qanday darajada rad etildi (comment majburiy)

FSM o'tishlar:
```
Yangi → Bo'lim (avtomatik, yaratilganda summa_tier=1)
Yangi → Kengash (avtomatik, yaratilganda summa_tier=2)
Yangi → Direktor (avtomatik, yaratilganda summa_tier=3)
Bo'lim → Kengash (bo'lim boshlig'i tasdiqladi va summa >500k)
Bo'lim → To'langan (bo'lim boshlig'i tasdiqladi va summa ≤500k → GL auto-post → To'langan)
Bo'lim → Rad
Kengash → Direktor (Kengash tasdiqladi va summa > 5M)
Kengash → To'langan (Kengash tasdiqladi va summa ≤5M → GL auto-post)
Kengash → Rad
Direktor → To'langan (GL auto-post)
Direktor → Rad
```

**Qabul mezoni:**
- `zno` jadvalida `status` ustuni 6 ta qiymatdan birini saqlaydi: `yangi | bolim | kengash | direktor | tolangan | rad`
- Har o'tish `reviewed_by` + `reviewed_at` + `comment` bilan loglanadi
- `Rad` da `comment` NULL bo'lmasligi shart (servis validatsiyasi)
- `To'langan` holat faqat `ZnoApprovedEvent` yetib kelganda, GL yozuv muvaffaqiyatli bo'lganda (insertJournal Ok) o'rnatiladi

---

### EP-FIN-008 — Sozlanuvchi approval threshold (hardcoded EMAS)

**Hozirgi holat (MUAMMO):**
`zvs.service.ts:17-26` da threshold HARDCODED:
```typescript
// BEFORE — zvs.service.ts:17-20
const LEVEL1_ROLES = ['admin', 'super_admin', ...];
function computeLevel(amount: number): number {
  if (amount <= 500_000) return 1;
  if (amount <= 5_000_000) return 2;
  return 3;
}
```

**Vizyon talabi (EP-FIN-008):** Threshold `approval_matrix_config` jadvalidan o'qiladi, dasturchilar kodi o'zgartirmasdan egasi ekrandan sozlaydi. `approval_matrix_config` jadvali `lib/db/src/schema/security-ops-schema.ts:17` da mavjud.

**Qabul mezoni:**
- `ZvsService.computeLevel(amount)` → `approvalMatrixConfig` jadvalidan `SELECT` (Drizzle ORM)
- `document_type = 'EXPENSE_REQUEST'` satrlari bo'yicha filter (ZVS uchun)
- Jadval bo'sh bo'lsa → fallback: 500_000 / 5_000_000 (hardcoded constants'dan, magic number emas → `business.constants.ts`)
- `approval_matrix_config` ning `CHECK` constraint'i hozirda `EXPENSE_REQUEST` ni o'z ichiga oladi — tekshiring

---

### EP-FIN-025 — ZNO tasdiqlandi → avtomatik GL yozuvi

**Vizyon talabi:**
ZNO direktor/kerakli daraja tomonidan tasdiqlanganda:
1. `ZnoApprovedEvent` emit bo'ladi (director module)
2. Finance module `ZnoApprovedListener` ushlab oladi
3. `insertJournal` chaqiriladi (mavjud `DrizzleGlPostingRepository`) — 2 qator: debet+kredit
4. GL yozuv muvaffaqiyatli bo'lsa → ZNO status `To'langan` ga o'tadi
5. GL yozuv xato bo'lsa → ZNO `Rad` emas, `Kengash`/`Direktor` holatida qoladi + xato logli

**GL yozuv tuzilmasi:**
```
Debit:  [EGASI QIYMATI KERAK — BHMS kod: egasi tomonidan system_settings da belgilanadi]
Credit: [EGASI QIYMATI KERAK — BHMS kod: egasi tomonidan system_settings da belgilanadi]
documentType: 'ZNO'
documentId: zno.id.toString()
amount: zno.amount
description: `ZNO #${zno.id}: ${zno.purpose}`
createdBy: reviewedBy (tasdiqlovchi user ID)
```

> ⚠️ **EGASI QIYMATI KERAK (EP-FIN-025 GL kodlari):**
> Asl direktiva 5010/5110 BHMS kodlarini ko'rsatdi — bu kodlar egasi intervyusida HECH QACHON
> aytilmagan (00-INTERVYU-MOSLIK.md §3 item 8). 5010/5110 IXTIRO qilingan — hardcode TAQIQ.
> Kod `system_settings` yoki `zno_gl_config` jadvalidagi konfiguratsiya satri orqali olinishi kerak.
> Egasi real BHMS kodlarini belgilagunicha — listener COMPILE bo'ladi lekin GL post DEFERRED bo'ladi
> (fallback: log + skip, ZNO status o'zgarmaydi).

**Qabul mezoni:**
- `ZnoApprovedEvent` emit bo'lganda: agar `zno_gl_config` da debit/kredit kod mavjud bo'lsa → `entries` jadvaliga 1+ qator qo'shiladi (DB-proof: COUNT oldin/keyin)
- `insertJournal` xato bo'lsa ZNO status o'zgarmaydi (Result<T>.ok=false tekshirish)
- GL kod konfiguratsiyasi yo'q bo'lsa → xato log + skip (server crash yo'q)

---

### EP-FIN-010 — Overdue eskalatsiya CRON

**Vizyon talabi (EP-FIN-003/010):**
- Har 6 soatda cron ishlaydi
- `zno` jadvalida 24 soatdan oshiq `yangi`/`bolim`/`kengash` holatidagi yozuvlar → birinchi eslatma
- 48 soatdan oshiq → ikkinchi eslatma + `Direktor` darajasiga avtomatik o'tkazish (escalate)
- Eslatma = ERP `CreateNotificationCommand` + (agar `TELEGRAM_BOT_TOKEN` mavjud) Telegram

**Qabul mezoni:**
- `@Cron('0 */6 * * *')` dekorator
- Overdue ZNO topilmasa — sukutda ishlaydi, xato bermaydi
- Har escalation uchun `zno.escalation_count` oshadi (field DDL-gated)

---

### FinanceApproval.tsx — ZVS/ZNO ko'rsatish (hozir papka-orders NOTO'G'RI)

**Hozirgi holat (BROKEN):**
`FinanceApproval.tsx:40-48` — `queryKey: ["/api/papka-orders"]` va `fetchWithAuth("/api/papka-orders?status=approved")` — papka-orders (production orders) ko'rsatadi, ZVS/ZNO emas.

**Vizyon talabi:** `/finance/approval` sahifasi ZVS + ZNO pending tasdiqlashlarini ko'rsatishi kerak.

**Qabul mezoni:**
- ZVS: `GET /api/hr/zvs?status=pending` (mavjud endpoint)
- ZNO: `GET /api/hr/zno?status=yangi` (yangi FSM holatiga mos)
- 2 alohida tab: "ZVS — Haftalik so'rovlar" / "ZNO — To'lov majburiyatlari"
- Approve/Reject tugmalari ZVS/ZNO endpoint'larini chaqiradi (`PATCH /api/hr/zvs/:id/approve`, `PATCH /api/hr/zno/:id/approve`)
- `PapkaOrderData` interfeysi o'chiriladi (Q-46: noto'g'ri ishlaydi — o'chiriladi)

---

## 3. HOZIRGI HOLAT

### Mavjud (EXISTS):

| Fayl | Qator | Holat |
|------|-------|-------|
| `director/application/zno.service.ts` | 1-88 | REAL — 3 holat (pending/approved/rejected); SoD guard mavjud |
| `director/infrastructure/repositories/zno.repository.ts` | 1-79 | REAL — raw SQL (izohli); CRUD mavjud |
| `director/application/zvs.service.ts` | 1-115 | REAL — 3-daraja, lekin **HARDCODED 500k/5M** (zvs.service.ts:17-26) |
| `finance/finance.module.ts` | 142-146 | `eventListeners` array mavjud: `WmsFgReceivedListener`, `DeliveryCompletedListener`, `TechThreeCheckpointListener` |
| `director/director.module.ts` | 130-135 | `ZnoRepository`, `ZnoService`, `ZvsRepository`, `ZvsService` registered |
| `artifacts/erp-dashboard/src/pages/FinanceApproval.tsx` | 1-286 | BROKEN — papka-orders ko'rsatadi, ZVS/ZNO emas |
| `lib/db/src/schema/security-ops-schema.ts:17` | `approval_matrix_config` | EXISTS — `document_type CHECK` faqat `PURCHASE_ORDER/EXPENSE_REQUEST/PAYMENT/MRO_REQUEST/ADVANCE_PAYMENT/BUDGET_TRANSFER` |
| `finance/infrastructure/repositories/drizzle-gl-posting.repo.ts:72` | `insertJournal` | REAL — `db.transaction`, debit=kredit invariant, `entries` jadvaliga yozadi |
| `lib/db/src/schema/fi-gl.ts:51` | `entries` table | EXISTS — `debitAccountId`, `creditAccountId`, `amount`, `entryNumber`, `documentType` |

### Yo'q (MISSING — bu paket scope'i):

| Feature | Gap tavsifi | Fayl |
|---------|-------------|------|
| EP-FIN-029: 6-holat FSM | `zno` jadvali faqat `pending/approved/rejected` — 3 holat | `fi-zvs-zno.ts` (DDL) |
| EP-FIN-008: sozlanuvchi threshold | `zvs.service.ts:17-26` hardcoded `500_000`/`5_000_000` | `zvs.service.ts` |
| EP-FIN-025: ZNO→GL listener | `finance/infrastructure/event-handlers/` da `zno-approved.listener.ts` YO'Q | yangi fayl |
| EP-FIN-010: overdue CRON | Hech qanday ZNO overdue CRON yo'q | `zno.service.ts` (CRON metod) |
| ZVS Drizzle schema | `zvs` jadvali uchun Drizzle pgTable yo'q (`lib/db/src/schema/` da) | `fi-zvs-zno.ts` (DDL) |
| ZNO Drizzle schema | `zno` jadvali uchun Drizzle pgTable yo'q | `fi-zvs-zno.ts` (DDL) |
| FinanceApproval ZVS/ZNO | Sahifa papka-orders ko'rsatadi | `FinanceApproval.tsx` |
| `escalation_count` ustuni | ZNO jadvali da yo'q | `fi-zvs-zno.ts` (DDL) |

### Singan/Noto'g'ri (BROKEN/FAKE):

| Fayl | Qator | Muammo |
|------|-------|--------|
| `FinanceApproval.tsx` | 40-48 | `queryKey: ["/api/papka-orders"]` — ZVS/ZNO emas, production orders |
| `FinanceApproval.tsx` | 19-29 | `PapkaOrderData` interfeysi — noto'g'ri domain |
| `FinanceApproval.tsx` | 51-53 | `approveMutation` → `/api/qc/approve/finance/:id` — QC endpoint, moliya emas |
| `FinanceApproval.tsx` | 67-69 | `rejectMutation` → `/api/qc/reject/:id` — QC endpoint |
| `zvs.service.ts` | 17-20 | `computeLevel` hardcoded (EP-FIN-008 violation) |
| `zno.repository.ts` | 22 | `status = 'pending'` — 6-holat FSM emas |
| `zno.repository.ts` | 55 | `status = 'approved'` — `tolangan` emas (FSM emas) |
| ZVS/ZNO Drizzle | — | `lib/db/src/schema/` da `zvs`/`zno` Drizzle pgTable yo'q; `FpCycleCronRepository` `SELECT COUNT(*) FROM zvs` — jadval yo'q bo'lsa 0 va xato yo'q (yashirin muammo) |

---

## 4. ISH (qadam-baqadam)

> Har qadam: fayl:satr, aynan o'zgarish, before/after, Result\<T\>/Zod/Drizzle, real-INSERT (fake emas).

---

### QADAM 1 — `lib/db/src/schema/fi-zvs-zno.ts` yaratish (DDL GATED — §5 da SQL; bu faylni yaratish OK, run qilma)

**Fayl:** `Uzbek-Language-Module/lib/db/src/schema/fi-zvs-zno.ts` (YANGI)

Bu faylda `zvs` va `zno` jadvallarining Drizzle `pgTable` definitsiyasi bo'ladi. Hozirda bu jadvallar DB da RAW SQL orqali (migration orqali) mavjud, lekin Drizzle schema `lib/db/src/schema/` da yo'q. Bu `FpCycleCronRepository` muammosini ham tuzatadi.

**AFTER (to'liq fayl):**

```typescript
/**
 * @module fi-zvs-zno
 * @description Drizzle ORM schema for ZVS (Zayavka na Vybor Sredstv / Weekly budget request)
 * and ZNO (Zayavka na Nachisleniye Oplaty / Payment obligation request) tables.
 * These tables physically exist in the DB via raw SQL migrations.
 * DDL migration: apps/api/src/modules/finance/infrastructure/migrations/d6-zvs-zno-fsm.sql
 */

import { sql } from "drizzle-orm";
import {
  pgTable, serial, integer, text, varchar, numeric, timestamp, check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ZNO 6-holat FSM: Yangi→Bo'lim→Kengash→Direktor→To'langan→Rad
export const ZNO_STATUSES = ['yangi', 'bolim', 'kengash', 'direktor', 'tolangan', 'rad'] as const;
export type ZnoStatus = typeof ZNO_STATUSES[number];

// ZVS statuses (3-daraja approval + yopildi)
export const ZVS_STATUSES = ['pending', 'approved', 'rejected', 'closed'] as const;
export type ZvsStatus = typeof ZVS_STATUSES[number];

/**
 * ZVS — Zayavka na Vybor Sredstv (Haftalik pul so'rovi).
 * Har bo'lim har hafta moliyadan pul so'raydi.
 * 3-daraja: bo'lim ≤ threshold_l1 / Kengash ≤ threshold_l2 / Direktor > threshold_l2
 * Thresholds approval_matrix_config'dan o'qiladi (EP-FIN-008).
 */
export const zvs = pgTable("zvs", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id"),
  submittedBy: integer("submitted_by").notNull(),
  submitterName: text("submitter_name"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  weekDate: varchar("week_date", { length: 10 }).notNull(), // YYYY-MM-DD, Monday
  level: integer("level").notNull().default(1), // 1=bolim, 2=kengash, 3=direktor
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("zvs_status_chk", sql`${t.status} IN ('pending','approved','rejected','closed')`),
  check("zvs_level_chk", sql`${t.level} IN (1,2,3)`),
  check("zvs_amount_pos_chk", sql`${t.amount} > 0`),
]);

export const insertZvsSchema = createInsertSchema(zvs, {
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  purpose: z.string().min(1, "Maqsad majburiy"),
  weekDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type Zvs = typeof zvs.$inferSelect;
export type InsertZvs = z.infer<typeof insertZvsSchema>;

/**
 * ZNO — Zayavka na Nachisleniye Oplaty (To'lov majburiyati so'rovi).
 * 6-holat FSM: yangi → bolim → kengash → direktor → tolangan → rad
 * ZVS ga bog'liq (ixtiyoriy).
 * Tasdiqlanganda GL yozuvi (entries) avtomatik yaratiladi (EP-FIN-025).
 */
export const zno = pgTable("zno", {
  id: serial("id").primaryKey(),
  zvsId: integer("zvs_id"),            // ZVS ga bog'liq (ixtiyoriy)
  departmentId: integer("department_id"),
  submittedBy: integer("submitted_by").notNull(),
  submitterName: text("submitter_name"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  paymentDate: varchar("payment_date", { length: 10 }),
  // 6-holat FSM
  status: varchar("status", { length: 20 }).notNull().default("yangi"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  comment: text("comment"),
  // GL linking (EP-FIN-025)
  glEntryId: integer("gl_entry_id"),   // entries.id → NULL oldin tasdiqlanmagan
  // Escalation tracking (EP-FIN-010)
  escalationCount: integer("escalation_count").notNull().default(0),
  escalatedAt: timestamp("escalated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("zno_status_chk", sql`${t.status} IN ('yangi','bolim','kengash','direktor','tolangan','rad')`),
  check("zno_amount_pos_chk", sql`${t.amount} > 0`),
]);

export const insertZnoSchema = createInsertSchema(zno, {
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  purpose: z.string().min(1, "Maqsad majburiy"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, glEntryId: true, escalationCount: true } as never);

export type Zno = typeof zno.$inferSelect;
export type InsertZno = z.infer<typeof insertZnoSchema>;
```

**Import:** Bu faylni `lib/db/src/index.ts` da eksport qiling (P01 barrel'ga muvofiq). Agar `lib/db/src/index.ts` OWNED emas (P01 paketi) — TO'XTA va P01 agent'ga flag qil yoki OWNED schema barrel'ga qo'shing.

**Verify (DDL gated bo'lgani uchun TypeScript tekshiruvi):**
```bash
cd Uzbek-Language-Module && pnpm --filter @workspace/db run build
# tsc 0 — schema to'g'ri Drizzle tiplar
```

---

### QADAM 2 — `zvs.service.ts` — hardcoded threshold → `approval_matrix_config` dan o'qish

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/director/application/zvs.service.ts`

**BEFORE (zvs.service.ts:6-27 — hozirgi holat):**
```typescript
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err } from '@common/result';
import { ZVS_REPO, type IZvsRepo } from '../domain/repositories/i-zvs.repo';

const LEVEL1_ROLES = ['admin', 'super_admin', 'director', 'ceo', 'cfo', 'finance_manager', 'department_head', 'manager'];
const LEVEL2_ROLES = ['admin', 'super_admin', 'director', 'ceo', 'cfo', 'finance_manager'];
const LEVEL3_ROLES = ['admin', 'super_admin', 'director', 'ceo'];

function computeLevel(amount: number): number {
  if (amount <= 500_000) return 1;
  if (amount <= 5_000_000) return 2;
  return 3;
}
```

**AFTER — threshold `approval_matrix_config` dan o'qiladi, fallback CONSTANTS'dan:**

```typescript
/**
 * @module zvs.service
 * @description Business-logic service. Returns Result<T>; never throws.
 * EP-FIN-008: thresholds read from approval_matrix_config (configurable without code change).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err } from '@common/result';
import { ZVS_REPO, type IZvsRepo } from '../domain/repositories/i-zvs.repo';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
// EP-FIN-008 fallback thresholds (magic number taqiq — constantsda)
import { ZVS_THRESHOLD_L1, ZVS_THRESHOLD_L2 } from '@common/constants/business.constants';

const LEVEL1_ROLES = ['admin', 'super_admin', 'director', 'ceo', 'cfo', 'finance_manager', 'department_head', 'manager'];
const LEVEL2_ROLES = ['admin', 'super_admin', 'director', 'ceo', 'cfo', 'finance_manager'];
const LEVEL3_ROLES = ['admin', 'super_admin', 'director', 'ceo'];

/** EP-FIN-008: approval_matrix_config dan threshold o'qish.
 * document_type='EXPENSE_REQUEST' satrlari: level 1 max_amount, level 2 max_amount.
 * Jadval bo'sh bo'lsa fallback: ZVS_THRESHOLD_L1 / ZVS_THRESHOLD_L2 constant.
 */
async function loadThresholds(): Promise<{ l1: number; l2: number }> {
  try {
    type ThreshRow = { approval_level: number; max_amount: string | null };
    const rows = await db.execute(
      sql`SELECT approval_level, max_amount FROM approval_matrix_config
          WHERE document_type = 'EXPENSE_REQUEST' AND is_active = true
          ORDER BY approval_level ASC LIMIT 3`,
    );
    const data = Array.isArray(rows.rows) ? (rows.rows as ThreshRow[]) : [];
    const l1Row = data.find((r) => r.approval_level === 1);
    const l2Row = data.find((r) => r.approval_level === 2);
    const l1 = l1Row?.max_amount ? Number(l1Row.max_amount) : ZVS_THRESHOLD_L1;
    const l2 = l2Row?.max_amount ? Number(l2Row.max_amount) : ZVS_THRESHOLD_L2;
    return { l1: isNaN(l1) ? ZVS_THRESHOLD_L1 : l1, l2: isNaN(l2) ? ZVS_THRESHOLD_L2 : l2 };
  } catch {
    return { l1: ZVS_THRESHOLD_L1, l2: ZVS_THRESHOLD_L2 };
  }
}

async function computeLevel(amount: number): Promise<number> {
  const { l1, l2 } = await loadThresholds();
  if (amount <= l1) return 1;
  if (amount <= l2) return 2;
  return 3;
}
```

**`business.constants.ts` ga qo'shish** (agar yo'q bo'lsa):

Fayl: `Uzbek-Language-Module/apps/api/src/common/constants/business.constants.ts`
⚠️ Bu fayl OWNED emas — agar o'zgartirish kerak bo'lsa maxsus ruxsat oling. Lekin konstantalar qo'shish ADD-ONLY va xavfsiz.

```typescript
// ZVS/ZNO approval thresholds — EP-FIN-008 fallback (approval_matrix_config empty bo'lsa)
export const ZVS_THRESHOLD_L1 = 500_000;   // Bo'lim boshlig'i chegarasi (UZS)
export const ZVS_THRESHOLD_L2 = 5_000_000; // Рек.Совет chegarasi (UZS)
```

⚠️ `business.constants.ts` OWNED ro'yxatida emas. Agar `@common/constants/business.constants.ts` faylni o'zgartirish mumkin bo'lmasa — konstantalarni to'g'ridan `zvs.service.ts` da e'lon qiling (local const, magic-number emas, `// EP-FIN-008 fallback` izoh bilan).

**`createZvsWithValidation` metodini yangilash** — endi `computeLevel` async:

```typescript
// BEFORE (zvs.service.ts:52-53)
const level = computeLevel(amt);
const weekDate = getWeekStart(week_date as string | undefined);
return safeCall(() =>
  this.repo.createZvs(/* ... */ level));

// AFTER
const level = await computeLevel(amt);
const weekDate = getWeekStart(week_date as string | undefined);
return safeCall(() =>
  this.repo.createZvs(/* ... */ level));
```

**`approveZvsWithAuth` va `rejectZvsWithAuth` metodlarida ham `computeLevel` async:**

```typescript
// BEFORE (zvs.service.ts:83, 108)
const level = Number(zvs.level);

// AFTER — level DB'dan o'qilganligi uchun o'zgarmaydi, faqat computeLevel chaqiruvlari
// Agar level DB da saqlangan bo'lsa (createZvs da yozilgan) — Number(zvs.level) to'g'ri qoladi
// computeLevel faqat CREATE paytida chaqiriladi — approve/reject da o'zgarmaydi
```

**DB-proof:** `approval_matrix_config` jadvalida `EXPENSE_REQUEST` qatori qo'shib test:
```sql
INSERT INTO approval_matrix_config (document_type, min_amount, max_amount, approval_level, approver_role, is_active)
VALUES ('EXPENSE_REQUEST', 0, 800000, 1, 'department_head', true),
       ('EXPENSE_REQUEST', 800001, 8000000, 2, 'finance_manager', true),
       ('EXPENSE_REQUEST', 8000001, NULL, 3, 'director', true);

-- Keyin ZVS yarating 600,000 summa bilan → level=1 bo'lishi kerak (500k emas, 800k)
```

---

### QADAM 3 — `zno.service.ts` — 6-holat FSM + status validatsiya

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/director/application/zno.service.ts`

**BEFORE (zno.service.ts:46-87 — faqat approve/reject, holat yo'q):**
```typescript
async approveZnoWithAuth(id, userId, comment): Promise<Result<object, AppError>> {
  // ... findById, SoD check
  return this.repo.approveZno(id, userId, comment); // 'approved' hardcoded
}

async rejectZnoWithAuth(id, userId, comment): Promise<Result<object, AppError>> {
  // ... findById, SoD check
  return this.repo.rejectZno(id, userId, comment); // 'rejected' hardcoded
}
```

**AFTER — FSM logic, status o'tish validatsiyasi, `ZnoApprovedEvent` emit:**

```typescript
/**
 * @module zno.service
 * @description 6-holat FSM: yangi→bolim→kengash→direktor→tolangan→rad
 * EP-FIN-029: status transitions validated; EP-FIN-025: approved→emits ZnoApprovedEvent.
 */

import { safeNum } from '@common/math';
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err, Ok } from '@common/result';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ZNO_REPO, type IZnoRepo } from '../domain/repositories/i-zno.repo';
import { ZNO_STATUSES, type ZnoStatus } from '@workspace/db'; // lib/db barrel
import { Cron } from '@nestjs/schedule';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ZVS_THRESHOLD_L1, ZVS_THRESHOLD_L2 } from '@common/constants/business.constants';

// 6-holat FSM: kim qaysi holatdan qaysi holatga o'ta oladi
const FSM_TRANSITIONS: Record<ZnoStatus, ZnoStatus[]> = {
  yangi:     ['bolim', 'kengash', 'direktor', 'rad'],
  bolim:     ['kengash', 'tolangan', 'rad'],
  kengash:   ['direktor', 'tolangan', 'rad'],
  direktor:  ['tolangan', 'rad'],
  tolangan:  [], // terminal state
  rad:       [], // terminal state
};

function isFsmTransitionValid(from: ZnoStatus, to: ZnoStatus): boolean {
  return FSM_TRANSITIONS[from]?.includes(to) ?? false;
}

/** ZNO summasi bo'yicha boshlang'ich holat tanlash */
async function computeInitialStatus(amount: number): Promise<ZnoStatus> {
  const l1 = ZVS_THRESHOLD_L1;
  const l2 = ZVS_THRESHOLD_L2;
  if (amount <= l1) return 'bolim';
  if (amount <= l2) return 'kengash';
  return 'direktor';
}

@Injectable()
export class ZnoService {
  constructor(
    @Inject(ZNO_REPO) private readonly repo: IZnoRepo,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createZnoWithValidation(
    body: Record<string, unknown>,
    userId: number,
  ): Promise<Result<object, AppError>> {
    const { department_id, submitter_name, amount, purpose, payment_date } = body;
    if (!purpose || amount === undefined)
      return Err({ code: 'BAD_REQUEST', message: 'purpose va amount majburiy' });
    const amt = safeNum(amount);
    if (isNaN(amt) || amt <= 0)
      return Err({ code: 'BAD_REQUEST', message: "amount musbat son bo'lishi kerak" });
    const initialStatus = await computeInitialStatus(amt);
    return safeCall(() =>
      this.repo.createZno(
        department_id ? Number(department_id) : null,
        userId,
        (submitter_name as string) ?? null,
        amt,
        purpose as string,
        (payment_date as string) ?? null,
        initialStatus, // FSM boshlang'ich holat
      ),
    );
  }

  async listZno(status: string | null, departmentId: number | null, maxRows: number) {
    return this.repo.listZno(status, departmentId, maxRows);
  }

  /** ZNO ni keyingi FSM holatiga o'tkazish.
   * approveZnoWithAuth: directed = "approve" action → FSM next state computed.
   * SoD: o'z ZNO so'rovingizni tasdiqlay olmaysiz.
   */
  async approveZnoWithAuth(
    id: number,
    userId: number,
    userRole: string,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    const existingResult = await this.repo.findById(id);
    if (!existingResult.ok) return existingResult;
    if (!existingResult.data.length) return Err({ code: 'BAD_REQUEST', message: 'ZNO topilmadi' });
    const record = existingResult.data[0] as Record<string, unknown>;

    // SoD tekshiruvi
    if (String(record.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "O'z ZNO so'rovingizni tasdiqlay olmaysiz (SoD)" });

    const currentStatus = String(record.status) as ZnoStatus;
    if (['tolangan', 'rad'].includes(currentStatus))
      return Err({ code: 'BAD_REQUEST', message: `ZNO allaqachon ${currentStatus} holatida — o'zgartirish mumkin emas` });

    // FSM: keyingi holat qaysi?
    const nextStatus = this.resolveNextApproveStatus(currentStatus, Number(record.amount), userRole);
    if (!nextStatus.ok) return nextStatus;

    if (!isFsmTransitionValid(currentStatus, nextStatus.data))
      return Err({ code: 'BAD_REQUEST', message: `FSM xato: ${currentStatus} → ${nextStatus.data} o'tish mumkin emas` });

    const updateResult = await this.repo.updateZnoStatus(id, nextStatus.data, userId, comment);
    if (!updateResult.ok) return updateResult;

    // EP-FIN-025: tolangan holatiga yetganda GL event emit
    if (nextStatus.data === 'tolangan') {
      this.eventEmitter.emit('zno.approved', {
        znoId: id,
        amount: Number(record.amount),
        purpose: String(record.purpose ?? ''),
        reviewedBy: userId,
        departmentId: record.department_id ? Number(record.department_id) : null,
      });
    }

    return updateResult;
  }

  /** FSM: approve action → keyingi holat */
  private resolveNextApproveStatus(
    current: ZnoStatus,
    amount: number,
    userRole: string,
  ): Result<ZnoStatus, AppError> {
    const l1 = ZVS_THRESHOLD_L1;
    const l2 = ZVS_THRESHOLD_L2;
    if (current === 'bolim') {
      // Bo'lim boshlig'i tasdiqladi → summa ≤ l1 esa tolangan, aks holda kengash
      return Ok(amount <= l1 ? 'tolangan' : 'kengash');
    }
    if (current === 'kengash') {
      // Kengash tasdiqladi → summa ≤ l2 esa tolangan, aks holda direktor
      return Ok(amount <= l2 ? 'tolangan' : 'direktor');
    }
    if (current === 'direktor') {
      // Direktor tasdiqladi → tolangan
      if (!['admin', 'super_admin', 'director', 'ceo'].includes(userRole))
        return Err({ code: 'FORBIDDEN', message: `Direktor darajasi kerak. Sizning rolingiz: ${userRole}` });
      return Ok('tolangan');
    }
    if (current === 'yangi') {
      // Yangi → boshlang'ich holat (summa asosida)
      return Ok(amount <= l1 ? 'bolim' : amount <= l2 ? 'kengash' : 'direktor');
    }
    return Err({ code: 'BAD_REQUEST', message: `${current} holatidan approve mumkin emas` });
  }

  async rejectZnoWithAuth(
    id: number,
    userId: number,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    if (!comment || comment.trim().length === 0)
      return Err({ code: 'BAD_REQUEST', message: 'Rad etishda izoh majburiy (EP-FIN-048)' });

    const existingResult = await this.repo.findById(id);
    if (!existingResult.ok) return existingResult;
    if (!existingResult.data.length) return Err({ code: 'BAD_REQUEST', message: 'ZNO topilmadi' });
    const record = existingResult.data[0] as Record<string, unknown>;

    if (String(record.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "O'z ZNO so'rovingizni rad eta olmaysiz (SoD)" });

    const currentStatus = String(record.status) as ZnoStatus;
    if (['tolangan', 'rad'].includes(currentStatus))
      return Err({ code: 'BAD_REQUEST', message: `ZNO allaqachon ${currentStatus} — o'zgartirish mumkin emas` });

    return this.repo.updateZnoStatus(id, 'rad', userId, comment);
  }

  /** EP-FIN-010: Har 6 soatda overdue ZNO tekshiruvi va eskalatsiya */
  @Cron('0 */6 * * *')
  async escalateOverdueZno(): Promise<void> {
    try {
      type OverdueRow = { id: number; status: string; escalation_count: number; submitted_by: number; amount: string };
      const rows = await db.execute(sql`
        SELECT id, status, escalation_count, submitted_by, amount
        FROM zno
        WHERE status IN ('yangi','bolim','kengash')
          AND created_at < NOW() - INTERVAL '24 hours'
          AND (status != 'direktor')
        ORDER BY created_at ASC
        LIMIT 50
      `);
      const overdueList = Array.isArray(rows.rows) ? (rows.rows as OverdueRow[]) : [];

      for (const znoRow of overdueList) {
        const hoursOld = await this.getAgeHours(znoRow.id);
        const escalationCount = znoRow.escalation_count ?? 0;

        if (hoursOld >= 48 && escalationCount < 2) {
          // 48 soat → 2. eslatma + direktor ga eskalatsiya
          await db.execute(sql`
            UPDATE zno
            SET escalation_count = escalation_count + 1,
                escalated_at = NOW(),
                status = CASE WHEN status != 'direktor' THEN 'direktor' ELSE status END,
                updated_at = NOW()
            WHERE id = ${znoRow.id}
          `);
        } else if (hoursOld >= 24 && escalationCount < 1) {
          // 24 soat → 1. eslatma
          await db.execute(sql`
            UPDATE zno
            SET escalation_count = escalation_count + 1,
                updated_at = NOW()
            WHERE id = ${znoRow.id}
          `);
        }
        // TODO: CreateNotificationCommand + Telegram emit (keyingi fazada wiring)
      }
    } catch (e) {
      // CRON xato bo'lsa server ishini to'xtatmasin — log bilan davom
      console.error('[ZnoService.escalateOverdueZno] CRON xato:', String(e));
    }
  }

  private async getAgeHours(znoId: number): Promise<number> {
    try {
      type AgeRow = { hours: number };
      const res = await db.execute(sql`
        SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours
        FROM zno WHERE id = ${znoId} LIMIT 1
      `);
      const row = Array.isArray(res.rows) ? (res.rows[0] as AgeRow) : null;
      return row?.hours ? Number(row.hours) : 0;
    } catch {
      return 0;
    }
  }

  async updateZnoWithAuth(
    id: number,
    status: string | null,
    comment: string | null,
    userId: number,
  ): Promise<Result<object, AppError>> {
    const existingResult = await this.repo.findById(id);
    if (!existingResult.ok) return existingResult;
    if (!existingResult.data.length) return Err({ code: 'BAD_REQUEST', message: 'ZNO topilmadi' });
    const record = existingResult.data[0] as Record<string, unknown>;

    if (status && ['tolangan', 'rad'].includes(status) && String(record.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "O'z ZNO so'rovingizni tasdiqlay/rad eta olmaysiz" });

    if (status && !ZNO_STATUSES.includes(status as ZnoStatus))
      return Err({ code: 'BAD_REQUEST', message: `Noto'g'ri status: ${status}. To'g'ri: ${ZNO_STATUSES.join('/')}` });

    return this.repo.updateZno(id, status, comment, userId);
  }
}
```

**`IZnoRepo` interfeys o'zgarishi:** `createZno` metodida yangi `initialStatus` parametri kerak.
`i-zno.repo.ts` OWNED emas — agar o'zgartirish kerak bo'lsa:
- Repository da `createZno` imzosini yangilash — `zno.repository.ts` OWNED, shu yerda o'zgartiring.

---

### QADAM 4 — `zno.repository.ts` — FSM status'larni qo'llab-quvvatlash

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/zno.repository.ts`

**BEFORE (zno.repository.ts:20-27):**
```typescript
async createZno(departmentId, submittedBy, submitterName, amount, purpose, paymentDate) {
  // ...
  sql`INSERT INTO zno (..., status) VALUES (..., 'pending') RETURNING *`
```

**AFTER:**

```typescript
async createZno(
  departmentId: number | null,
  submittedBy: number,
  submitterName: string | null,
  amount: number,
  purpose: string,
  paymentDate: string | null,
  initialStatus: string = 'yangi',  // EP-FIN-029: 6-holat FSM boshlang'ich holat
): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      INSERT INTO zno (department_id, submitted_by, submitter_name, amount, purpose, payment_date, status, escalation_count)
      VALUES (${departmentId}, ${submittedBy}, ${submitterName}, ${amount}, ${purpose}, ${paymentDate}, ${initialStatus}, 0)
      RETURNING *
    `);
    return Ok(r[0]);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

**`updateZnoStatus` yangi metod qo'shish** (FSM transition uchun aniq metod):

```typescript
/** FSM status o'tish — faqat ZnoService chaqiradi */
async updateZnoStatus(
  id: number,
  newStatus: string,
  reviewedBy: number,
  comment: string | null,
): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      UPDATE zno
      SET status = ${newStatus},
          reviewed_by = ${reviewedBy},
          reviewed_at = NOW(),
          comment = ${comment},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    if (!r[0]) return Err('ZNO topilmadi yoki yangilanmadi');
    return Ok(r[0]);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

**`approveZno` va `rejectZno` metodlari** — eski nomlar hali controller tomonidan chaqirilishi mumkin. Q-46: ishlab turgan kod o'chirilmaydi. Shu metodlarni saqlab qo'ying lekin `updateZnoStatus` ga delegate qiling:

```typescript
// BEFORE (zno.repository.ts:53-68) — unchanged interface, delegate internally
async approveZno(id, reviewedBy, comment): Promise<Result<Row>> {
  return this.updateZnoStatus(id, 'tolangan', reviewedBy, comment); // 'approved' emas 'tolangan'
}

async rejectZno(id, reviewedBy, comment): Promise<Result<Row>> {
  return this.updateZnoStatus(id, 'rad', reviewedBy, comment); // 'rejected' emas 'rad'
}
```

**`findById` kengaytirish** — `status`, `amount`, `purpose` ham kerak (service FSM uchun):

```typescript
// BEFORE (zno.repository.ts:44-51)
async findById(id: number): Promise<Result<Row[]>> {
  const rows = await exec(sql`SELECT id, submitted_by FROM zno WHERE id = ${id} LIMIT 1`);

// AFTER
async findById(id: number): Promise<Result<Row[]>> {
  const rows = await exec(sql`
    SELECT id, submitted_by, status, amount, purpose, department_id, escalation_count
    FROM zno WHERE id = ${id} LIMIT 1
  `);
```

**DB-proof:**
```sql
-- createZno ishlagandan keyin:
SELECT id, status, escalation_count FROM zno ORDER BY id DESC LIMIT 3;
-- status = 'yangi' bo'lishi kerak (500k dan kam bo'lsa 'bolim')
```

---

### QADAM 5 — `zno-approved.listener.ts` YANGI FAYL yaratish (EP-FIN-025)

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/event-handlers/zno-approved.listener.ts` (YANGI)

**BEFORE:** Fayl yo'q — `zno.approved` event hech kim ushlamaydi.

**AFTER (to'liq fayl):**

```typescript
/**
 * @module zno-approved.listener
 * @description Event handler: zno.approved → GL auto-post to `entries` table.
 * EP-FIN-025: On ZnoApprovedEvent, insert double-entry journal record.
 *
 * ⚠️ EGASI QIYMATI KERAK — GL kodlari (BHMS):
 *   GL_ZNO_DEBIT_CODE va GL_ZNO_CREDIT_CODE qiymatlari egasi tomonidan
 *   belgilanmagan (00-INTERVYU-MOSLIK.md §3 item 8).
 *   Bu kodlar `system_settings` jadvalidagi konfiguratsiya satri orqali olinadi:
 *     key='zno_gl_debit_code'  → egasi BHMS debit hisobi kodini yozadi
 *     key='zno_gl_credit_code' → egasi BHMS kredit hisobi kodini yozadi
 *   Konfiguratsiya bo'sh bo'lsa: GL post SKIP qilinadi (log bilan), ZNO status o'zgarmaydi.
 *   Egasi qiymat bergunicha hardcode TAQIQ.
 *
 * If GL posting fails → log error, do NOT change ZNO status (service handles state).
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GlPostingService } from '../../domain/services/gl-posting.service';
import { TashkentTimeService } from '@common/time';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const _time = new TashkentTimeService();

// ⚠️ EGASI QIYMATI KERAK — bu konstantalar PLACEHOLDER.
// Haqiqiy BHMS kodlarni system_settings jadvalidan o'qing (quyida loadZnoGlCodes()).
// Egasi belgilagunicha 'OWNER_REQUIRED' → GL post skip qilinadi.
const GL_ZNO_DEBIT_CODE_PLACEHOLDER  = 'OWNER_REQUIRED'; // BHMS debit kodi — egasi berishi kerak
const GL_ZNO_CREDIT_CODE_PLACEHOLDER = 'OWNER_REQUIRED'; // BHMS kredit kodi — egasi berishi kerak

/** EP-FIN-025: system_settings'dan ZNO GL kodlarini yuklash.
 * Egasi 'zno_gl_debit_code' va 'zno_gl_credit_code' ni yozishi kerak.
 * Agar topilmasa → null qaytadi (GL post skip bo'ladi).
 */
async function loadZnoGlCodes(): Promise<{ debitCode: string | null; creditCode: string | null }> {
  try {
    type SettingRow = { key: string; value: string };
    const rows = await db.execute(sql`
      SELECT key, value FROM system_settings
      WHERE key IN ('zno_gl_debit_code', 'zno_gl_credit_code')
        AND value IS NOT NULL AND value != ''
    `);
    const data = Array.isArray(rows.rows) ? (rows.rows as SettingRow[]) : [];
    const debitRow  = data.find((r) => r.key === 'zno_gl_debit_code');
    const creditRow = data.find((r) => r.key === 'zno_gl_credit_code');
    return {
      debitCode:  debitRow?.value  ?? null,
      creditCode: creditRow?.value ?? null,
    };
  } catch {
    return { debitCode: null, creditCode: null };
  }
}

export interface ZnoApprovedPayload {
  znoId: number;
  amount: number;
  purpose: string;
  reviewedBy: number;
  departmentId: number | null;
}

@Injectable()
export class ZnoApprovedListener {
  private readonly logger = new Logger(ZnoApprovedListener.name);

  constructor(private readonly glPostingService: GlPostingService) {}

  @OnEvent('zno.approved', { async: true })
  async handleZnoApproved(payload: ZnoApprovedPayload): Promise<void> {
    const { znoId, amount, purpose, reviewedBy } = payload;

    // EP-FIN-025: GL kodlarini system_settings'dan yuklash (EGASI QIYMATI KERAK)
    const { debitCode, creditCode } = await loadZnoGlCodes();
    if (!debitCode || !creditCode) {
      this.logger.warn(
        `[ZnoApprovedListener] GL post SKIPPED for ZNO #${znoId}: ` +
        `zno_gl_debit_code va/yoki zno_gl_credit_code system_settings'da belgilanmagan. ` +
        `Egasi BHMS kodlarini system_settings jadvaliga yozsin (key='zno_gl_debit_code', 'zno_gl_credit_code').`,
      );
      return; // ZNO status o'zgarmaydi — service holatni nazorat qiladi
    }

    // entryNumber format: ZNO-{id}-{YYYYMMDD}
    const today = _time.now().toISOString().split('T')[0].replace(/-/g, '');
    const entryNumber = `ZNO-${znoId}-${today}`;
    const entryDate   = _time.now().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const result = await this.glPostingService.postJournal([
        {
          entryNumber,
          entryDate,
          documentType: 'ZNO',
          documentId: String(znoId),
          debitAccountId:  debitCode,   // system_settings 'zno_gl_debit_code' dan
          creditAccountId: creditCode,  // system_settings 'zno_gl_credit_code' dan
          amount,
          description: `ZNO #${znoId}: ${purpose}`.slice(0, 500),
          createdBy: reviewedBy,
        },
      ]);

      if (!result.ok) {
        // GL xato — ZNO hali tolangan holatida, lekin GL yozilmadi → xato log
        this.logger.error(
          `[ZnoApprovedListener] GL post FAILED for ZNO #${znoId}: ${JSON.stringify(result.error)}`,
        );
        // TODO: Director/Finance manager notification (Phase 5 wiring)
        return;
      }

      this.logger.log(
        `[ZnoApprovedListener] GL entry created for ZNO #${znoId}, entryNumber=${entryNumber}, amount=${amount}`,
      );
    } catch (e) {
      this.logger.error(
        `[ZnoApprovedListener] Unexpected error for ZNO #${znoId}: ${String(e)}`,
      );
    }
  }
}
```

**GlPostingService.postJournal** mavjudligini tekshiring:
- `finance/domain/services/gl-posting.service.ts` da `postJournal` metodi bor — agar `postJournal` nomi boshqacha bo'lsa (`insertJournal` — repo metod), `glPostingService.postJournal(rows)` o'rniga:

```typescript
// Agar GlPostingService.postJournal yo'q bo'lsa — GL_POSTING_REPO orqali to'g'ridan:
// @Inject(GL_POSTING_REPO) private readonly glRepo: IGlPostingRepository
// await this.glRepo.insertJournal([...])
```

Agar `GlPostingService` inject qilinmasa `FinanceModule` dan eksport qilinadi — tekshiring: `finance.module.ts:217` da `exports: [FINANCE_REPO, GlPostingService, ...]` — `GlPostingService` export bor. Lekin listener `FinanceModule` ning o'zida bo'lgani uchun to'g'ridan inject mumkin.

---

### QADAM 6 — `finance.module.ts` — `ZnoApprovedListener` qo'shish

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/finance/finance.module.ts`

**BEFORE (finance.module.ts:142-146):**
```typescript
const eventListeners = [
  WmsFgReceivedListener,           // Trigger 12
  DeliveryCompletedListener,       // Trigger 14
  TechThreeCheckpointListener,     // Trigger 6
];
```

**AFTER:**
```typescript
import { ZnoApprovedListener } from './infrastructure/event-handlers/zno-approved.listener';

const eventListeners = [
  WmsFgReceivedListener,           // Trigger 12
  DeliveryCompletedListener,       // Trigger 14
  TechThreeCheckpointListener,     // Trigger 6
  ZnoApprovedListener,             // EP-FIN-025: ZNO approved → GL auto-post
];
```

`providers` arrayida ham qo'shilganini tekshiring — `...eventListeners` allaqachon `providers` da bor (`finance.module.ts:170`):
```typescript
providers: [
  // ...
  ...commandHandlers, ...queryHandlers, ...eventListeners,
  // ...
```

Shu sababli `eventListeners` arrayiga qo'shish yetarli — `providers` arrayi avtomatik olinadi.

---

### QADAM 7 — `director.module.ts` — `ScheduleModule` + `EventEmitter2` to'g'ri import

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/director/director.module.ts`

`ZnoService` da `@Cron` va `EventEmitter2` ishlatildi. `DirectorModule` da `ScheduleModule` bo'lishi kerak:

**BEFORE (director.module.ts:6-9):**
```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
```

**AFTER:**
```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
```

`imports` arrayiga qo'shish:
```typescript
// BEFORE (director.module.ts:93-94)
@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), AuthModule],

// AFTER
@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), ScheduleModule.forRoot(), AuthModule],
```

⚠️ Agar `ScheduleModule.forRoot()` allaqachon `AppModule` yoki boshqa global module'da ro'yxatdan o'tgan bo'lsa — `ScheduleModule` ni qayta qo'shmang (duplikat xato chiqishi mumkin). Avval tekshiring:
```bash
grep -r "ScheduleModule" Uzbek-Language-Module/apps/api/src/ --include="*.ts"
```
Agar topilsa — import kerak emas, faqat providers to'g'ri.

`EventEmitter2` inject:
```typescript
// director.module.ts providers'da EventEmitter2 allaqachon EventEmitterModule.forRoot() orqali global
// ZnoService constructorida EventEmitter2 inject etiladi — module'da alohida provider kerak emas
```

---

### QADAM 8 — `FinanceApproval.tsx` — ZVS/ZNO ko'rsatish, papka-orders o'chiriladi

**Fayl:** `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceApproval.tsx`

**BEFORE:** 286 qator — papka-orders ko'rsatadi, `PapkaOrderData` interfeysi, QC endpoint'lari.

**Muammo:** Butun sahifa noto'g'ri domain ko'rsatadi — Q-46 bo'yicha noto'g'ri ishlaydigan kod TO'LIQ o'chiriladi va to'g'risi yoziladi.

**AFTER — to'liq yangi fayl (ListPage template, ZVS + ZNO tabs):**

```tsx
/**
 * @module FinanceApproval
 * @description ZVS (haftalik so'rovlar) va ZNO (to'lov majburiyatlari) tasdiqlash sahifasi.
 * EP-FIN-025/029: 6-holat ZNO FSM ko'rinishi; ZVS 3-daraja tasdiqlash.
 * Route: /finance/approval
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckCircle, XCircle, Clock, DollarSign, AlertTriangle,
} from "lucide-react";

// --- Domain interfaces ---
interface ZvsRow {
  id: number;
  submitter_name: string | null;
  department_name: string | null;
  amount: string;
  purpose: string;
  week_date: string;
  status: string;
  level: number;
  created_at: string;
}

interface ZnoRow {
  id: number;
  submitter_name: string | null;
  department_name: string | null;
  amount: string;
  purpose: string;
  payment_date: string | null;
  status: string;   // yangi | bolim | kengash | direktor | tolangan | rad
  created_at: string;
}

// --- Helper: status ko'rinishi ---
const ZNO_STATUS_LABELS: Record<string, string> = {
  yangi: "Yangi",
  bolim: "Bo'lim ko'rib chiqmoqda",
  kengash: "Kengash ko'rib chiqmoqda",
  direktor: "Direktor ko'rib chiqmoqda",
  tolangan: "To'langan (GL yozilgan)",
  rad: "Rad etildi",
};

const ZNO_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  yangi: "secondary",
  bolim: "outline",
  kengash: "outline",
  direktor: "outline",
  tolangan: "default",
  rad: "destructive",
};

function formatAmount(amount: string | number): string {
  return Number(amount).toLocaleString("uz-UZ") + " UZS";
}

// --- Main component ---
export default function FinanceApproval() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // ZVS
  const [selectedZvs, setSelectedZvs] = useState<ZvsRow | null>(null);
  const [zvsApproveDialog, setZvsApproveDialog] = useState(false);
  const [zvsRejectDialog, setZvsRejectDialog] = useState(false);
  const [zvsComment, setZvsComment] = useState("");

  // ZNO
  const [selectedZno, setSelectedZno] = useState<ZnoRow | null>(null);
  const [znoApproveDialog, setZnoApproveDialog] = useState(false);
  const [znoRejectDialog, setZnoRejectDialog] = useState(false);
  const [znoComment, setZnoComment] = useState("");

  // --- Queries ---
  const { data: zvsData, isLoading: zvsLoading } = useQuery<{ data: ZvsRow[]; total: number }>({
    queryKey: ["/api/hr/zvs", "pending"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/zvs?status=pending&maxRows=50");
      const arr = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
      return { data: arr, total: arr.length };
    },
  });

  const { data: znoData, isLoading: znoLoading } = useQuery<{ data: ZnoRow[]; total: number }>({
    queryKey: ["/api/hr/zno", "active"],
    enabled: isAuthenticated,
    queryFn: async () => {
      // Aktiv (tasdiqlash kutayotgan) ZNO'lar
      const res = await apiRequest("GET", "/api/hr/zno?maxRows=50");
      const arr = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
      // Faqat terminal bo'lmagan holatlar
      const pending = arr.filter((z: ZnoRow) => !['tolangan', 'rad'].includes(z.status));
      return { data: pending, total: pending.length };
    },
  });

  // --- ZVS mutations ---
  const zvsApproveMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/hr/zvs/${id}/approve`, { comment: zvsComment }),
    onSuccess: () => {
      toast({ title: "ZVS tasdiqlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zvs"] });
      setZvsApproveDialog(false);
      setSelectedZvs(null);
      setZvsComment("");
    },
    onError: (err: Error) =>
      toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const zvsRejectMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/hr/zvs/${id}/reject`, { comment: zvsComment }),
    onSuccess: () => {
      toast({ title: "ZVS rad etildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zvs"] });
      setZvsRejectDialog(false);
      setSelectedZvs(null);
      setZvsComment("");
    },
    onError: (err: Error) =>
      toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  // --- ZNO mutations ---
  const znoApproveMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/hr/zno/${id}/approve`, { comment: znoComment }),
    onSuccess: () => {
      toast({ title: "ZNO tasdiqlandi — GL yozuvi yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zno"] });
      setZnoApproveDialog(false);
      setSelectedZno(null);
      setZnoComment("");
    },
    onError: (err: Error) =>
      toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const znoRejectMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/hr/zno/${id}/reject`, { comment: znoComment }),
    onSuccess: () => {
      toast({ title: "ZNO rad etildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zno"] });
      setZnoRejectDialog(false);
      setSelectedZno(null);
      setZnoComment("");
    },
    onError: (err: Error) =>
      toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  // --- Render ---
  const zvsList = Array.isArray(zvsData?.data) ? zvsData.data : [];
  const znoList = Array.isArray(znoData?.data) ? znoData.data : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Moliya Tasdiqlash</h1>
          <p className="text-muted-foreground">ZVS va ZNO so'rovlarini ko'rib chiqing</p>
        </div>
      </div>

      {/* Tabs: ZVS | ZNO */}
      <Tabs defaultValue="zno">
        <TabsList>
          <TabsTrigger value="zvs">
            ZVS — Haftalik so'rovlar
            {zvsList.length > 0 && (
              <Badge variant="secondary" className="ml-2">{zvsList.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="zno">
            ZNO — To'lov majburiyatlari
            {znoList.length > 0 && (
              <Badge variant="secondary" className="ml-2">{znoList.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ZVS Tab */}
        <TabsContent value="zvs" className="mt-4">
          {zvsLoading ? (
            <div className="p-6 text-muted-foreground">Yuklanmoqda...</div>
          ) : zvsList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
                <p className="text-lg font-medium">Kutilayotgan ZVS yo'q</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {zvsList.map((zvs: ZvsRow) => (
                <Card key={zvs.id} data-testid={`zvs-card-${zvs.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        ZVS #{zvs.id} — {zvs.department_name ?? "Bo'lim ko'rsatilmagan"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{zvs.submitter_name} · Hafta: {zvs.week_date}</p>
                    </div>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {zvs.level === 1 ? "Bo'lim" : zvs.level === 2 ? "Kengash" : "Direktor"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Summa</p>
                        <p className="font-semibold text-[var(--ep-green)]">{formatAmount(zvs.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Maqsad</p>
                        <p className="text-sm">{zvs.purpose}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="destructive" size="sm"
                        onClick={() => { setSelectedZvs(zvs); setZvsRejectDialog(true); }}
                        data-testid={`btn-zvs-reject-${zvs.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Rad etish
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => { setSelectedZvs(zvs); setZvsApproveDialog(true); }}
                        data-testid={`btn-zvs-approve-${zvs.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Tasdiqlash
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ZNO Tab */}
        <TabsContent value="zno" className="mt-4">
          {znoLoading ? (
            <div className="p-6 text-muted-foreground">Yuklanmoqda...</div>
          ) : znoList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
                <p className="text-lg font-medium">Kutilayotgan ZNO yo'q</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {znoList.map((zno: ZnoRow) => (
                <Card key={zno.id} data-testid={`zno-card-${zno.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        ZNO #{zno.id} — {zno.department_name ?? "Bo'lim ko'rsatilmagan"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{zno.submitter_name}</p>
                    </div>
                    <Badge variant={ZNO_STATUS_VARIANT[zno.status] ?? "outline"}>
                      <Clock className="h-3 w-3 mr-1" />
                      {ZNO_STATUS_LABELS[zno.status] ?? zno.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Summa</p>
                        <p className="font-semibold text-[var(--ep-green)]">{formatAmount(zno.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Maqsad</p>
                        <p className="text-sm">{zno.purpose}</p>
                      </div>
                      {zno.payment_date && (
                        <div>
                          <p className="text-xs text-muted-foreground">To'lov sanasi</p>
                          <p className="text-sm">{zno.payment_date}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="destructive" size="sm"
                        onClick={() => { setSelectedZno(zno); setZnoRejectDialog(true); }}
                        data-testid={`btn-zno-reject-${zno.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Rad etish
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => { setSelectedZno(zno); setZnoApproveDialog(true); }}
                        data-testid={`btn-zno-approve-${zno.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Tasdiqlash
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ZVS Approve Dialog */}
      <Dialog open={zvsApproveDialog} onOpenChange={setZvsApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ZVS Tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>ZVS #{selectedZvs?.id} — <strong>{formatAmount(selectedZvs?.amount ?? 0)}</strong></p>
            <p className="text-sm text-muted-foreground">{selectedZvs?.purpose}</p>
            <Textarea
              placeholder="Izoh (ixtiyoriy)"
              value={zvsComment}
              onChange={(e) => setZvsComment(e.target.value)}
              data-testid="input-zvs-approve-comment"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZvsApproveDialog(false)}>Bekor</Button>
            <Button
              onClick={() => selectedZvs && zvsApproveMutation.mutate(selectedZvs.id)}
              disabled={zvsApproveMutation.isPending}
              data-testid="btn-zvs-confirm-approve"
            >
              {zvsApproveMutation.isPending ? "Yuklanmoqda..." : "Tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ZVS Reject Dialog */}
      <Dialog open={zvsRejectDialog} onOpenChange={setZvsRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ZVS Rad etish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5" />
              <p className="text-sm">Rad etish sababi majburiy (EP-FIN-048)</p>
            </div>
            <Textarea
              placeholder="Rad etish sababi (majburiy)"
              value={zvsComment}
              onChange={(e) => setZvsComment(e.target.value)}
              required
              data-testid="input-zvs-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZvsRejectDialog(false)}>Bekor</Button>
            <Button
              variant="destructive"
              onClick={() => selectedZvs && zvsRejectMutation.mutate(selectedZvs.id)}
              disabled={zvsRejectMutation.isPending || !zvsComment.trim()}
              data-testid="btn-zvs-confirm-reject"
            >
              {zvsRejectMutation.isPending ? "Yuklanmoqda..." : "Rad etish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ZNO Approve Dialog */}
      <Dialog open={znoApproveDialog} onOpenChange={setZnoApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ZNO Tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>ZNO #{selectedZno?.id} — <strong>{formatAmount(selectedZno?.amount ?? 0)}</strong></p>
            <p className="text-sm text-muted-foreground">{selectedZno?.purpose}</p>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-green)] mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Tasdiqlanganda GL yozuvi avtomatik yaratiladi (EP-FIN-025)
              </p>
            </div>
            <Textarea
              placeholder="Izoh (ixtiyoriy)"
              value={znoComment}
              onChange={(e) => setZnoComment(e.target.value)}
              data-testid="input-zno-approve-comment"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZnoApproveDialog(false)}>Bekor</Button>
            <Button
              onClick={() => selectedZno && znoApproveMutation.mutate(selectedZno.id)}
              disabled={znoApproveMutation.isPending}
              data-testid="btn-zno-confirm-approve"
            >
              {znoApproveMutation.isPending ? "Yuklanmoqda..." : "Tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ZNO Reject Dialog */}
      <Dialog open={znoRejectDialog} onOpenChange={setZnoRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ZNO Rad etish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5" />
              <p className="text-sm">Rad etish sababi majburiy (EP-FIN-048)</p>
            </div>
            <Textarea
              placeholder="Rad etish sababi (majburiy)"
              value={znoComment}
              onChange={(e) => setZnoComment(e.target.value)}
              required
              data-testid="input-zno-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZnoRejectDialog(false)}>Bekor</Button>
            <Button
              variant="destructive"
              onClick={() => selectedZno && znoRejectMutation.mutate(selectedZno.id)}
              disabled={znoRejectMutation.isPending || !znoComment.trim()}
              data-testid="btn-zno-confirm-reject"
            >
              {znoRejectMutation.isPending ? "Yuklanmoqda..." : "Rad etish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 5. DDL (GATED — egasi ruxsatisiz ISHGA TUSHIRILMAYDI)

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/migrations/d6-zvs-zno-fsm.sql`

> Bu faylni YOZ. `-- APPROVED: <egasi ismi> <sana>` belgisi qo'yilmaguncha RUN QILMA.

```sql
-- MIGRATION: d6-zvs-zno-fsm.sql
-- PURPOSE: ZVS va ZNO jadvallari uchun Drizzle schema ni DB bilan sinxronlashtirish.
-- EP-FIN-029: ZNO 6-holat FSM (status ustuni yangi qiymatlar bilan).
-- EP-FIN-010: escalation_count va escalated_at ustunlari.
-- EP-FIN-025: gl_entry_id ustuni (GL bog'lanish).
-- DDL GATE: APPROVED: <egasi> <sana>  ← bu qator to'ldirilmaguncha RUN QILMA
-- IDEMPOTENT: har buyruq IF NOT EXISTS / DO $$ BEGIN ... END $$
--
-- PRE-CONDITION: zvs va zno jadvallar DB da allaqachon mavjud (raw SQL orqali yaratilgan).
-- Agar mavjud bo'lmasa → avval CREATE TABLE bloklari pastda berilgan.

-- ========================================================================
-- 1. ZVS jadvali: status CHECK constraint yangilash
-- ========================================================================

-- Eski constraint olib tashlanadi (agar mavjud)
DO $$ BEGIN
  ALTER TABLE zvs DROP CONSTRAINT IF EXISTS zvs_status_chk;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Yangi constraint (4 holat: pending/approved/rejected/closed)
DO $$ BEGIN
  ALTER TABLE zvs ADD CONSTRAINT zvs_status_chk
    CHECK (status IN ('pending','approved','rejected','closed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Level CHECK
DO $$ BEGIN
  ALTER TABLE zvs ADD CONSTRAINT zvs_level_chk
    CHECK (level IN (1,2,3));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================================================
-- 2. ZNO jadvali: 6-holat FSM status + yangi ustunlar
-- ========================================================================

-- 2a. Eski status CHECK olib tashlanadi
DO $$ BEGIN
  ALTER TABLE zno DROP CONSTRAINT IF EXISTS zno_status_chk;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2b. Status ustun qiymatlarini yangilash (mavjud satrlar)
-- Eski: pending→yangi/bolim (summa asosida), approved→tolangan, rejected→rad
UPDATE zno SET status = 'yangi' WHERE status = 'pending';
UPDATE zno SET status = 'tolangan' WHERE status = 'approved';
UPDATE zno SET status = 'rad'      WHERE status = 'rejected';

-- 2c. Yangi 6-holat FSM constraint
DO $$ BEGIN
  ALTER TABLE zno ADD CONSTRAINT zno_status_chk
    CHECK (status IN ('yangi','bolim','kengash','direktor','tolangan','rad'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2d. escalation_count ustuni (EP-FIN-010)
DO $$ BEGIN
  ALTER TABLE zno ADD COLUMN escalation_count INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2e. escalated_at ustuni
DO $$ BEGIN
  ALTER TABLE zno ADD COLUMN escalated_at TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2f. gl_entry_id ustuni (EP-FIN-025: GL bog'lanish)
DO $$ BEGIN
  ALTER TABLE zno ADD COLUMN gl_entry_id INTEGER REFERENCES entries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2g. zvs_id ustuni (ZNO → ZVS bog'lanish)
DO $$ BEGIN
  ALTER TABLE zno ADD COLUMN zvs_id INTEGER REFERENCES zvs(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ========================================================================
-- 3. approval_matrix_config: EXPENSE_REQUEST seed (agar yo'q)
-- ========================================================================
-- Bu seed thresholds sozlanuvchi qiladi (EP-FIN-008)
INSERT INTO approval_matrix_config
  (document_type, min_amount, max_amount, approval_level, approver_role, is_active)
VALUES
  ('EXPENSE_REQUEST', 0,       500000,    1, 'department_head',  true),
  ('EXPENSE_REQUEST', 500001,  5000000,   2, 'finance_manager',  true),
  ('EXPENSE_REQUEST', 5000001, NULL,      3, 'director',         true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- 4. CREATE TABLE (agar zvs/zno jadvallar DB da umuman yo'q bo'lsa)
-- ========================================================================
-- Bu blok faqat yangi DB uchun — mavjud DB da skip (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS zvs (
  id              SERIAL PRIMARY KEY,
  department_id   INTEGER,
  submitted_by    INTEGER NOT NULL,
  submitter_name  TEXT,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  purpose         TEXT NOT NULL,
  priority        VARCHAR(20) NOT NULL DEFAULT 'normal',
  week_date       VARCHAR(10) NOT NULL,
  level           INTEGER NOT NULL DEFAULT 1 CHECK (level IN (1,2,3)),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','closed')),
  reviewed_by     INTEGER,
  reviewed_at     TIMESTAMP,
  comment         TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zno (
  id                SERIAL PRIMARY KEY,
  zvs_id            INTEGER REFERENCES zvs(id) ON DELETE SET NULL,
  department_id     INTEGER,
  submitted_by      INTEGER NOT NULL,
  submitter_name    TEXT,
  amount            NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  purpose           TEXT NOT NULL,
  payment_date      VARCHAR(10),
  status            VARCHAR(20) NOT NULL DEFAULT 'yangi'
                    CHECK (status IN ('yangi','bolim','kengash','direktor','tolangan','rad')),
  reviewed_by       INTEGER,
  reviewed_at       TIMESTAMP,
  comment           TEXT,
  gl_entry_id       INTEGER REFERENCES entries(id) ON DELETE SET NULL,
  escalation_count  INTEGER NOT NULL DEFAULT 0,
  escalated_at      TIMESTAMP,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- VERIFY (owner migration run qilgandan keyin):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='zno' ORDER BY ordinal_position;
-- SELECT * FROM approval_matrix_config WHERE document_type='EXPENSE_REQUEST';
-- ========================================================================
```

---

## 6. QABUL MEZONI (Definition of Done)

Barcha quyidagi tekshiruvlar PASS bo'lishi shart — biri ham FAIL bo'lsa commit qilinmaydi:

### Backend

- [ ] `BE tsc 0`: `pnpm --filter @europrint/api run build` — 0 TypeScript xato
- [ ] `zvs.service.ts` `computeLevel` async, `approval_matrix_config` dan o'qiydi
- [ ] `zno.service.ts` FSM: 6 holat, FSM_TRANSITIONS map, SoD check, `EventEmitter2` emit
- [ ] `zno.repository.ts` `createZno` — `initialStatus` parametri qabul qiladi
- [ ] `zno.repository.ts` `updateZnoStatus` metodi mavjud, `findById` — `status`, `amount`, `purpose` qaytaradi
- [ ] `ZnoApprovedListener` `finance/infrastructure/event-handlers/` da mavjud
- [ ] `ZnoApprovedListener` `finance.module.ts` `eventListeners` arrayida ro'yxatdan o'tgan
- [ ] `@Cron` dekoratori import qilingan, `ScheduleModule` mavjud yoki global

### Drizzle Schema

- [ ] `lib/db/src/schema/fi-zvs-zno.ts` mavjud — `zvs` va `zno` pgTable export qilingan
- [ ] `@workspace/db` build: `pnpm --filter @workspace/db run build` — 0 xato

### DDL (GATED)

- [ ] `d6-zvs-zno-fsm.sql` migration fayli mavjud
- [ ] Faylda `-- APPROVED: <egasi> <sana>` qatori YO'Q → egasiga topshirilsin (run qilinmaydi)

### Frontend

- [ ] `FE tsc 0`: `pnpm --filter erp-dashboard run build` — 0 TypeScript xato
- [ ] `FinanceApproval.tsx` — papka-orders yo'q; ZVS/ZNO tabs ko'rinadi
- [ ] ZVS "pending" ro'yxat yuklanadi (`GET /api/hr/zvs?status=pending`)
- [ ] ZNO aktiv ro'yxat yuklanadi (`GET /api/hr/zno`)
- [ ] Approve tugmasi dialog ochadi, Tasdiqlash → mutation chaqiriladi
- [ ] Reject tugmasi — comment bo'sh bo'lsa disabled

### DB-proof (REAL INSERT — jonli tekshiruv)

```bash
# 1. ZNO yarating (test uchun)
curl -X POST http://localhost:3030/api/hr/zno \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 400000, "purpose": "Test ZNO FSM", "department_id": 1}'
# → status = 'bolim' bo'lishi kerak (400k < 500k)

# 2. ZNO ro'yxat
curl http://localhost:3030/api/hr/zno -H "Authorization: Bearer $TOKEN"
# → yangi ZNO ko'rinadi

# 3. Tasdiqlash (boshqa user token bilan — SoD)
ZNO_ID=<yangi id>
curl -X PATCH http://localhost:3030/api/hr/zno/$ZNO_ID/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Test tasdiqlash"}'
# → 400k <= 500k → status = 'tolangan', GL event emit bo'ladi

# 4. GL entries tekshiruv
curl http://localhost:3030/api/finance/gl -H "Authorization: Bearer $TOKEN"
# → entries COUNT oldin/keyin farq: +1 (ZNO GL yozuvi)

# 5. SoD test — o'z ZNO'sini tasdiqlashga urinish
curl -X PATCH http://localhost:3030/api/hr/zno/$ZNO_ID/approve \
  -H "Authorization: Bearer $SAME_USER_TOKEN" \
  -d '{}'
# → 403 FORBIDDEN (SoD ihlol)
```

### Golden-thread regress yo'q

```bash
# Avval ishlagan ZVS CRUD hamon ishlaydi
curl http://localhost:3030/api/hr/zvs -H "Authorization: Bearer $TOKEN"
# → 200, oldingi ZVS saqlangan

# Finance module boot xatosi yo'q
curl http://localhost:3030/api/health
# → {"status": "ok"} (yoki mavjud health check format)
```

---

## 7. SELF-VERIFY

Quyidagi buyruqlarni ish tugagandan keyin ketma-ket bajaring:

```bash
# Working directory: Uzbek-Language-Module/

# 1. DB schema build
pnpm --filter @workspace/db run build
# KUTILGAN: 0 xato

# 2. Backend typecheck
pnpm --filter @europrint/api run build
# KUTILGAN: 0 TypeScript xato

# 3. Frontend typecheck
pnpm --filter erp-dashboard run build
# KUTILGAN: 0 TypeScript xato (yoki faqat pre-existing xatolar)

# 4. Reviewer skriptlar
bash scripts/reviewer-result-pattern.sh
# KUTILGAN: FAIL: 0

bash scripts/reviewer-as-unknown.sh
# KUTILGAN: yangi FAIL yo'q

bash scripts/reviewer-jwt-guard.sh
# KUTILGAN: PASS

# 5. Drizzle schema tekshiruv
grep -r "pgTable" lib/db/src/schema/fi-zvs-zno.ts
# KUTILGAN: zvs va zno ikkisi ham topiladi

# 6. EventEmitter listener tekshiruv
grep -r "ZnoApprovedListener" apps/api/src/modules/finance/
# KUTILGAN: finance.module.ts va event-handlers/ da topiladi

# 7. FSM holat tekshiruv (kod)
grep -r "ZNO_STATUSES\|yangi\|bolim\|kengash\|direktor\|tolangan\|rad" \
  apps/api/src/modules/director/application/zno.service.ts
# KUTILGAN: barcha 6 holat topiladi

# 8. Threshold DB o'qish tekshiruv (psql yoki DB tool)
# SELECT * FROM approval_matrix_config WHERE document_type='EXPENSE_REQUEST';
# KUTILGAN: migration run bo'lgan bo'lsa → 3 satr (APPROVED: bo'lganda)
# KUTILGAN: migration run bo'lmagan bo'lsa → 0 satr (fallback ZVS_THRESHOLD_L1/L2 ishlaydi)

# 9. FinanceApproval.tsx — papka-orders yo'q
grep -n "papka-orders" artifacts/erp-dashboard/src/pages/FinanceApproval.tsx
# KUTILGAN: hech narsa topilmaydi (0 matches)

# 10. ZNO repo findById yangilangan
grep -n "status, amount, purpose" \
  apps/api/src/modules/director/infrastructure/repositories/zno.repository.ts
# KUTILGAN: topiladi (yangilangan SELECT)
```

**DB jonli tekshiruv (backend ishlayotgan holda):**
```bash
# ZNO FSM round-trip:
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' | jq -r '.access_token')

COUNT_BEFORE=$(curl -s http://localhost:3030/api/finance/gl \
  -H "Authorization: Bearer $TOKEN" | jq '.total // 0')

curl -X POST http://localhost:3030/api/hr/zno \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":300000,"purpose":"Self-verify test ZNO"}'

# Boshqa user token bilan approve:
curl -X PATCH http://localhost:3030/api/hr/zno/<ID>/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -d '{"comment":"approve test"}'

COUNT_AFTER=$(curl -s http://localhost:3030/api/finance/gl \
  -H "Authorization: Bearer $TOKEN" | jq '.total // 0')

echo "GL entries: before=$COUNT_BEFORE, after=$COUNT_AFTER (farq 1 bo'lishi kerak)"
```

---

## 8. COMMIT

**Fayl izolyatsiyasini tekshiring:**
```bash
git status
# Faqat OWNED fayllar ko'rinishi kerak:
# - lib/db/src/schema/fi-zvs-zno.ts (YANGI)
# - apps/api/src/modules/director/application/zno.service.ts
# - apps/api/src/modules/director/infrastructure/repositories/zno.repository.ts
# - apps/api/src/modules/director/application/zvs.service.ts
# - apps/api/src/modules/finance/infrastructure/event-handlers/zno-approved.listener.ts (YANGI)
# - apps/api/src/modules/finance/finance.module.ts
# - apps/api/src/modules/director/director.module.ts
# - artifacts/erp-dashboard/src/pages/FinanceApproval.tsx
# - apps/api/src/modules/finance/infrastructure/migrations/d6-zvs-zno-fsm.sql (YANGI, GATED)
# Boshqa HECH NARSA bo'lmasligi kerak
```

**Commit buyrug'i (aniq fayllar bilan, HECH QACHON -A):**
```bash
git add \
  lib/db/src/schema/fi-zvs-zno.ts \
  apps/api/src/modules/director/application/zno.service.ts \
  apps/api/src/modules/director/infrastructure/repositories/zno.repository.ts \
  apps/api/src/modules/director/application/zvs.service.ts \
  apps/api/src/modules/finance/infrastructure/event-handlers/zno-approved.listener.ts \
  apps/api/src/modules/finance/finance.module.ts \
  apps/api/src/modules/director/director.module.ts \
  artifacts/erp-dashboard/src/pages/FinanceApproval.tsx \
  apps/api/src/modules/finance/infrastructure/migrations/d6-zvs-zno-fsm.sql

git commit -m "feat(fin): P25 ZNO 6-state FSM + GL auto-post listener + configurable thresholds

EP-FIN-029: ZNO 6-holat FSM (yangi/bolim/kengash/direktor/tolangan/rad)
EP-FIN-025: ZnoApprovedListener → GL insertJournal on approval
EP-FIN-008: ZvsService threshold → approval_matrix_config (configurable)
EP-FIN-010: ZnoService @Cron escalateOverdueZno (6h interval)
FIX: FinanceApproval.tsx → ZVS/ZNO tabs (papka-orders o'chirildi)
DDL: d6-zvs-zno-fsm.sql (GATED — APPROVED: pending)
Schema: lib/db/src/schema/fi-zvs-zno.ts Drizzle pgTable added

Wave 2, P25. BE tsc 0, FE tsc 0, DB-proof: ZNO→tolangan→GL entry."
```

**Commit xabari formati tekshiruvi:**
- `feat(fin):` — modul prefix
- Bitta commit = P25 barcha o'zgarishlari
- `git add -A` yoki `git add .` TAQIQ
- DDL fayli ham commit'da (lekin run qilinmagan, GATED)

---

## HOLAT HISOBOTI SHABLONI (commit tugagandan keyin egaga yuboring)

```
P25 — FIN ZVS/ZNO FSM — YAKUNLANDI

✅ BAJARILDI:
- EP-FIN-029: ZNO 6-holat FSM (yangi/bolim/kengash/direktor/tolangan/rad)
- EP-FIN-025: ZnoApprovedListener → GL auto-post (entries jadvali)
- EP-FIN-008: ZvsService threshold → approval_matrix_config (fallback: 500k/5M)
- EP-FIN-010: CRON escalateOverdueZno (6h, 24h/48h escalation)
- FinanceApproval.tsx → ZVS/ZNO tabs (papka-orders o'chirildi, Q-46)
- fi-zvs-zno.ts Drizzle schema (zvs + zno pgTable)

⏳ GATED (egasi ruxsati kutilmoqda):
- d6-zvs-zno-fsm.sql (migration) — APPROVED: <egasi> to'ldirilishi kerak

📝 FLAGS (boshqa paket qo'li kerak):
- business.constants.ts'da ZVS_THRESHOLD_L1/L2 → agar OWNED emas bo'lsa, local const'da qoldirdim
- ZnoController approve/reject endpoint imzolari (OWNED emas P26) → @Param(:id) + userRole tekshiring

BE tsc: 0 ✅
FE tsc: 0 ✅
DB-proof: ZNO yaratildi → tasdiqlandi → entries COUNT +1 ✅
Commit: <hash>
```

---

> **ESLATMA:** Bu direktiva Q-47 ga muvofiq to'liq va batafsil yozilgan. Har bir qadam fayl:satr, before/after, Result\<T\>, DB-proof bilan. "V2"/"Strangler Fig" yo'q — bir kod bazasi, shu yerda to'g'irlanadi. Vizyon = EP-FIN-008/010/025/029. Bajaruvchi (Muslimbek) bu direktiva bo'yicha egasi ruxsatisiz hech narsa qo'shmasdan to'liq bajaradi.
