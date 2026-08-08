# P04 — ORG / KARTALAR: ORG schema sync + unit-fields + razryad-exam + card-portret DDL

> **Agent ID:** P04 · **To'lqin (Wave):** 1 · **Bog'liqlik:** P01 tugashi shart  
> **Sana:** 2026-06-19 · **Modul:** ORG / KARTALAR · **DDL darvozasi:** FAOL (owner ruxsati shart)  
> Ushbu direktiva **Q-47** bo'yicha to'liq, batafsil, hech qanday noaniqlik qoldirmaydigan tarzda yozilgan.

---

## 0. ROL VA QOIDALAR

Sen **🟢 BAJARUVCHI (EXECUTOR)** agentsan. Har sessiyada `CLAUDE.md` va `docs/agent-constitution.md` ni o'qib boshla.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. **Result\<T\>** — hamma repo/service metodida; `throw` / `null` / `undefined` qaytarish TAQIQ.
2. **@Body Zod bilan validate** — `class-validator` TAQIQ.
3. **Drizzle ORM** — raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri** — REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ. TO'G'RI o'lchovi = master vizyon (`docs/`).
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI** — buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)** — faqat OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa TO'XTA + egasiga flag.
7. **DDL DARVOZASI (Q-35)** — `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh SHART. Bu paket DDL talab qiladi — migrationlarni YOZ lekin GATED belgila. Egasi "run" demagunicha `psql` bilan ISHLATMA.
8. **`git add <aniq-fayl>` faqat** — `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** — log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify** — BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik** — TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Bu agent WAVE 1 da ishlaydi. dependsOn: ["P01"] — P01 migratsiyalari DB ga qo'llanilgan bo'lishi shart.**

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.**

| # | Fayl | Amal |
|---|------|------|
| 1 | `lib/db/src/schema/core-schema.ts` | Drizzle sync: `orgFunctions.last_reviewed_at` + `employee_cards` + `card_folders` pgTable ta'riflari qo'shish |
| 2 | `apps/api/src/shared/db/migrations/org-unit-fields-2026-06-19.sql` | YANGI — `org_departments` unit field DDL (GATED) |
| 3 | `apps/api/src/shared/db/migrations/org-razryad-exam-config-2026-06-19.sql` | YANGI — `razryad_levels` exam config DDL (GATED) |
| 4 | `apps/api/src/shared/db/migrations/org-card-portret-2026-06-19.sql` | YANGI — `org_node_portret.card_id` DDL (GATED) |
| 5 | `apps/api/src/modules/org-structure/org-structure.controller.ts` | Dead import `notImplemented` o'chirish (satr 27) |
| 6 | `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts` | `create()` va `updateFromDto()` da unit fields mapping qo'shish |
| 7 | `apps/api/src/modules/org-structure/razryad.repository.ts` | `RazryadInput` + `create()` / `update()` da `examPassThreshold` / `maxRetakes` qo'shish |
| 8 | `apps/api/src/modules/org-structure/razryad.controller.ts` | `RazryadCreateSchema` ga `examPassThreshold` / `maxRetakes` maydonlari qo'shish |
| 9 | `apps/api/src/modules/org-structure/razryad.service.ts` | Passthrough — o'zgartirish talab qilinmaydi (repo qatlami yetarli) |

**DDL DARVOZASI:** Fayl № 2, 3, 4 — migration SQL fayllar YOZILADI lekin `-- GATED` belgisi bilan. Egasi `-- APPROVED: <ism> <sana>` izoh qo'shib `psql` buyrug'ini bergandan keyin ISHLATILADI.

---

## 2. VIZYON

### 2.1 Karta-markazli model (Card-centric)
Manba: `docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` Phase 1–7

- **Karta = birlamchi, xodim = ikkilamchi.** 1 karta = 1 o'rin (seat) = 1 xodim. Xodim bir nechta kartaga ega bo'lishi mumkin (M:N `employee_cards` orqali).
- Karta egasi — `org_functions` jadvali (29 FK hub, xodimlar va foydalanuvchilar ulanishi).
- Razryad → karta ichida badge ko'rinishida, rangli darajalar bilan.
- Papka (folder) = 6 bo'lim: `vazifa / javobgarlik / GSD / reglament / jarayon / ta'lim` + to'liqlik % (service tomonida hisoblanadi, DB da saqlanmaydi).
- **Portret tab** — karta darajasida portret (`org_node_portret.card_id` → `org_functions.id`) kerak, lekin hozir faqat node (bo'lim) darajasida mavjud (`node_id` → `org_departments.id`).

### 2.2 Org-unit ierarxiya va unit maydonlar
Manba: `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` — Bo'lim→Sex→Uskuna→Ishchi

Har bo'lim (va uning quyi turlari) quyidagi maydonlarni talab qiladi:

| Maydon | DB ustuni | Maqsad |
|--------|-----------|--------|
| Kod | `code VARCHAR(50)` | Qisqartma identifikator (masalan, "BOLIM-01", "SEX-3A") |
| QYM o'zbekcha | `qym_uz TEXT` | Quyi yig'ilish me'yori — uz tilida |
| QYM ruscha | `qym_ru TEXT` | Quyi yig'ilish me'yori — ru tilida |
| Kamera zonasi | `camera_zone_id TEXT` | IoT / AI-kamera integratsiyasi uchun zona ID |
| Telegram guruh | `telegram_group_id TEXT` | Bildirishnomalar uchun Telegram guruh ID |

Bu maydonlar **vizyon § Phase 1** ning bir qismi (CHAT-TARIXI org-unit model).

### 2.3 Razryad: imtihon konfiguratsiyasi
Manba: `docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` Phase 2

- **EP-ORG-055:** Imtihondan o'tish chegarasi — **sozlanishi mumkin** (`exam_pass_threshold NUMERIC(5,2)`).
  > ⚠️ **EGASI QIYMATI KERAK:** 70.00% default IXTIRO qilingan — egasi "default yo'q" degan
  > (00-INTERVYU-MOSLIK.md §1 1-tizimli og'ish: "sozlanadigan → hardcode").
  > DDL `DEFAULT 70` O'CHIRILDI → `DEFAULT NULL`. Har karta-tur uchun egasi alohida qiymat belgilaydi.
  > Mavjud 6 ta razryad-yozuvga `exam_pass_threshold` backfill uchun egasidan qiymatlar so'raladi.
- **EP-ORG-056:** Qayta topshirish soni — **sozlanishi mumkin** (`max_retakes INTEGER`).
  > ⚠️ **EGASI QIYMATI KERAK:** 3 default IXTIRO qilingan — egasi "default yo'q" degan.
  > DDL `DEFAULT 3` O'CHIRILDI → `DEFAULT NULL`. Har razryad darajasiga egasi belgilaydi.
- Bu ustunlar `razryad_levels` jadvali per-card-type master-data — faqat egasi to'ldiradi.
  LMS/imtihon tizimi imtihon baholashda SHUNING ustunlaridan o'qiydi, hardcode ishlatmaydi.
- Hozirgi `razryad_levels` jadvali bu ustunlarni o'z ichiga olmaydi — DDL talab etiladi.
- FE da `RazryadFormDialog` va `CardExamsDialog` — ushbu maydonlar uchun forma maydonlari yo'q (bu P04 da faqat BE/DDL; FE P05 ga tegishli).

### 2.4 Karta Portret tab
Manba: `docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` Phase 5 — 8-tab UI

- 8-tab: `Asosiy · Xodimlar · Farzandlar · Vakant · Papka · Statistika · Portret · Tarix-jurnali`
- **Tab 7 (Portret)** hozir `EPComingSoon` placeholder ko'rsatadi (`CardDetailDialog.tsx:277–279`).
- Portret hozir **node darajasida** (`org_node_portret.node_id → org_departments.id`).
- Karta darajasida portret uchun: `org_node_portret` ga `card_id INTEGER REFERENCES org_functions(id)` ustuni qo'shish kerak.
- Bu P04 da faqat DDL; FE va service qismi alohida paketga tegishli.

### 2.5 Drizzle sxema sinxronizatsiyasi
- `employee_cards` va `card_folders` jadvallari faqat raw SQL migration orqali yaratilgan; `lib/db/src/schema/core-schema.ts` da `pgTable` ta'riflari **yo'q**.
- `orgFunctions.last_reviewed_at` (`TIMESTAMPTZ NULL`) — `org-phase7-acting-staleness-2026-06-08.sql` orqali DB da mavjud, lekin `core-schema.ts:320–350` da Drizzle ta'rifida **yo'q**.
- Bu uchala sinxronizatsiya shart: Drizzle typecheck 0 maqsadi uchun.

### 2.6 Qabul mezoni (per feature)

| Feature | Qabul mezoni |
|---------|-------------|
| `org_departments` unit fields | 3 ta migration SQL to'g'ri yozilgan + GATED belgili; `OrgNodeSchema` + `org-mutations.repo.ts` da mapping bor |
| `razryad_levels` exam config | Migration SQL to'g'ri yozilgan + GATED belgili; `RazryadInput` + Zod schema + repo INSERT/UPDATE da maydonlar bor |
| `org_node_portret.card_id` | Migration SQL to'g'ri yozilgan + GATED belgili; portret query da `card_id` filtri mavjud |
| Drizzle sync | `core-schema.ts` da `employee_cards`, `card_folders`, `orgFunctions.last_reviewed_at` pgTable ta'riflari to'g'ri; `pnpm --filter @europrint/schemas build` 0 xato |
| Dead import tozalash | `org-structure.controller.ts:27` da `notImplemented` import yo'q; `tsc` 0 |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (exists)

**DB migratsiyalari (qo'llanilgan):**
- `org-phase1-canonical-card-2026-06-08.sql` — `razryad_levels` CREATE + `org_functions` card columns (status/deleted_at/razryad_level_id/salary_type/code/level/rbac_tier/min_salary/max_salary/ai_exam_enabled/statistics_type/manager_id/updated_at).
- `org-phase3-card-folders-2026-06-08.sql` — `card_folders` CREATE (card_id/vazifa/javobgarlik/gsd/reglament/jarayon/talim/is_active/created_at/updated_at) UNIQUE(card_id).
- `org-phase6-employee-cards-2026-06-08.sql` — `employee_cards` M:N CREATE + backfill.
- `org-phase7-acting-staleness-2026-06-08.sql:10–17` — `employee_cards.is_acting`, `employee_cards.acting_supplement`, `org_functions.last_reviewed_at` qo'shilgan.
- `org-node-portret-tables.sql` — `org_node_portret` (node_id → org_departments.id) + `node_hr_requests`.

**BE:**
- `razryad.repository.ts:15–24` — `RazryadInput` interfeysi: `level/name/minRequirement/salaryMin/salaryMax/examType/certificate/description` — `examPassThreshold` va `maxRetakes` **yo'q**.
- `razryad.repository.ts:53–70` — `create()` INSERT: 8 ustun, `exam_pass_threshold`/`max_retakes` **yo'q**.
- `razryad.repository.ts:72–94` — `update()` COALESCE pattern: ham `exam_pass_threshold`/`max_retakes` **yo'q**.
- `razryad.controller.ts:21–30` — `RazryadCreateSchema` Zod: 8 maydon, `examPassThreshold`/`maxRetakes` **yo'q**.
- `org-mutations.repo.ts:24–45` — `create()`: `name/name_ru/description/.../node_type` mapping bor, `code`/`qym_uz`/`qym_ru`/`camera_zone_id`/`telegram_group_id` **yo'q**.
- `org-mutations.repo.ts:48–69` — `updateFromDto()`: xuddi shunday, unit fields mapping **yo'q**.
- `org-structure.controller.ts:27` — `import { notImplemented } from '@common/exceptions/not-implemented'` — **dead import**, bu faylda `notImplemented()` hech qachon chaqirilmaydi.
- `org-structure.controller.ts:38–52` — `OrgNodeSchema` Zod: `name/nameRu/nodeType/tskp/tskpRu/color/parentId/positionId/description/level/headUserId` — unit fields (`code`/`qymUz`/`qymRu`/`cameraZoneId`/`telegramGroupId`) **yo'q**.

**Drizzle schema:**
- `core-schema.ts:294–310` — `orgDepartments` pgTable: `id/name/nameRu/description/descriptionRu/color/displayOrder/headUserId/tskp/tskpRu/parentId/hierarchyLevel/nodeType/isActive/createdAt` — unit fields **yo'q**.
- `core-schema.ts:320–350` — `orgFunctions` pgTable: `id/.../updatedAt` — `last_reviewed_at` **yo'q** (DB da bor, Drizzle ta'rifida yo'q → type mismatch).
- `employee_cards` pgTable ta'rifi `core-schema.ts` da **umuman yo'q** (faqat raw SQL migration mavjud).
- `card_folders` pgTable ta'rifi `core-schema.ts` da **umuman yo'q** (faqat raw SQL migration mavjud).

### 3.2 Yo'q (missing)

| # | Gap | Joylashuv |
|---|-----|----------|
| M-1 | `org_departments` unit fields (5 ustun) | DDL yo'q, Drizzle yo'q, BE mapping yo'q |
| M-2 | `razryad_levels.exam_pass_threshold` + `max_retakes` | DDL yo'q, Drizzle ta'rifida yo'q, BE ta'rifida yo'q |
| M-3 | `org_node_portret.card_id` ustuni | DDL yo'q; karta darajasida portret qilish imkonsiz |
| M-4 | `employee_cards` Drizzle pgTable ta'rifi | `core-schema.ts` da yo'q → TypeScript type yo'q |
| M-5 | `card_folders` Drizzle pgTable ta'rifi | `core-schema.ts` da yo'q → TypeScript type yo'q |
| M-6 | `orgFunctions.last_reviewed_at` Drizzle maydoni | `core-schema.ts:320–350` da yo'q |
| M-7 | `OrgNodeSchema` unit fields | `org-structure.controller.ts:38–52` — Zod da yo'q |
| M-8 | `org-mutations.repo.ts` unit fields mapping | `create()` va `updateFromDto()` da yo'q |

### 3.3 Buzuq/soxta (brokenOrFake)

| # | Muammo | Joylashuv | Holat |
|---|--------|----------|-------|
| B-1 | `import { notImplemented }` — dead import, hech qachon chaqirilmaydi | `org-structure.controller.ts:27` | Q-46: o'lik kod → TO'LIQ o'chirilsin |
| B-2 | `CardDetailDialog.tsx:277–279` — Portret tab `EPComingSoon` | FE (bu paketda emas, P18 ga tegishli) | Honest placeholder (Q-46: ishlaydigan placeholder — O'CHIRILMAYDI) |
| B-3 | `orgFunctions` type Drizzle da `last_reviewed_at` yo'q | `core-schema.ts:350` — DB da bor, type da yo'q | Type mismatch → sync kerak |
| B-4 | `OrgNodeSchema` `.strict()` — unit fields yo'q → FE dan kelgan `code`/`cameraZoneId` reject bo'ladi | `org-structure.controller.ts:38–52` | Zod strict — unit fields qo'shilishi bilan tuzatiladi |

---

## 4. ISH (qadam-baqadam)

### Qadam 1 — Dead import tozalash (`org-structure.controller.ts:27`)

**Fayl:** `apps/api/src/modules/org-structure/org-structure.controller.ts`

**Holat:** `notImplemented` import satri 27 da bor lekin faylda hech qachon ishlatilmaydi. Q-46 bo'yicha o'lik kod TO'LIQ o'chiriladi.

**Oldin (satr 25–29):**
```typescript
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { notImplemented } from '@common/exceptions/not-implemented';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
```

**Keyin (satr 25–29):**
```typescript
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
```

**Verify:** `grep -n "notImplemented" apps/api/src/modules/org-structure/org-structure.controller.ts` → hech natija yo'q.

---

### Qadam 2 — `OrgNodeSchema` ga unit fields qo'shish (`org-structure.controller.ts:38–52`)

**Fayl:** `apps/api/src/modules/org-structure/org-structure.controller.ts`

**Sabab:** `OrgNodeSchema` `.strict()` bilan ishlaydi. FE dan `code`, `qymUz`, `qymRu`, `cameraZoneId`, `telegramGroupId` kelsa — hozirgi holda `ZodError: Unrecognized key` bilan reject qilinadi. Migration qo'llanilgandan keyin ushbu maydonlar qabul qilinishi kerak.

**Oldin (`OrgNodeSchema` ta'rifi satr 38–52):**
```typescript
const OrgNodeSchema = z.object({
  name:        z.string().max(500).optional(),
  nameRu:      z.string().max(500).optional(),
  nodeType:    z.string().max(50).optional(),
  tskp:        z.string().max(500).optional(),
  tskpRu:      z.string().max(500).optional(),
  color:       z.string().max(20).optional(),
  parentId:    z.union([z.string(), z.number()]).nullable().optional(),
  positionId:  z.union([z.string(), z.number()]).optional(),
  description: z.string().max(2000).optional(),
  level:       z.union([z.string(), z.number()]).nullable().optional(),
  headUserId:  z.union([z.number(), z.null()]).optional(),
}).strict();
```

**Keyin:**
```typescript
const OrgNodeSchema = z.object({
  name:              z.string().max(500).optional(),
  nameRu:            z.string().max(500).optional(),
  nodeType:          z.string().max(50).optional(),
  tskp:              z.string().max(500).optional(),
  tskpRu:            z.string().max(500).optional(),
  color:             z.string().max(20).optional(),
  parentId:          z.union([z.string(), z.number()]).nullable().optional(),
  positionId:        z.union([z.string(), z.number()]).optional(),
  description:       z.string().max(2000).optional(),
  level:             z.union([z.string(), z.number()]).nullable().optional(),
  headUserId:        z.union([z.number(), z.null()]).optional(),
  // Unit fields (org-unit-fields migration — EP-ORG Phase 1 CHAT-TARIXI)
  code:              z.string().max(50).optional(),
  qymUz:             z.string().max(2000).optional(),
  qymRu:             z.string().max(2000).optional(),
  cameraZoneId:      z.string().max(200).optional(),
  telegramGroupId:   z.string().max(200).optional(),
}).strict();
```

**Qoida:** `.strict()` saqlanadi — faqat ruxsat etilgan maydonlar ro'yxati kengayadi. Hech qanday passthrough qilinmaydi.

---

### Qadam 3 — `org-mutations.repo.ts` unit fields mapping

**Fayl:** `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts`

**Muhim eslatma:** Drizzle `orgDepartments` pgTable ta'rifida unit fields hali yo'q (Qadam 6 da qo'shiladi). Shuning uchun bu qadamda raw SQL INSERT/UPDATE ishlatiladi. Bu holat `ARCHITECTURE_RULES.md Rule 4` bo'yicha hujjatlashtirilishi shart.

**`create()` metodi — oldin (satr 28–41):**
```typescript
const [row] = await db
  .insert(orgDepartments)
  .values({
    name: dto.name as string,
    name_ru: (dto.nameRu as string) ?? null,
    description: (dto.description as string) ?? null,
    description_ru: (dto.descriptionRu as string) ?? null,
    color: (dto.color as string) ?? '#3b82f6',
    tskp: (dto.tskp as string) ?? null,
    tskp_ru: (dto.tskpRu as string) ?? null,
    parent_id: (dto.parentId as number) ?? null,
    level,
    node_type: (dto.nodeType as string) ?? 'department',
    sort_order: (dto.sortOrder as number) ?? 0,
  })
  .returning();
```

**`create()` metodi — keyin (unit fields qo'shilishi bilan):**

> **MUHIM:** Drizzle `orgDepartments.insert()` unit fields ni bilmaydi hali (Qadam 6 dan oldin). `create()` ni to'liq raw SQL ga o'tkazish o'rniga — Drizzle insert dan keyin `UPDATE` qilish yoki raw `sql` template bilan yozish mumkin. Eng to'g'ri yondashuv: `orgDepartments` schema yangilangandan keyin (Qadam 6) `.values()` ga qo'shish. Shuning uchun **bu qadam Qadam 6 dan KEYIN bajariladi.**

Qadam 6 tugagandan keyin `create()` ni quyidagicha yangilang:

```typescript
const [row] = await db
  .insert(orgDepartments)
  .values({
    name: dto.name as string,
    name_ru: (dto.nameRu as string) ?? null,
    description: (dto.description as string) ?? null,
    description_ru: (dto.descriptionRu as string) ?? null,
    color: (dto.color as string) ?? '#3b82f6',
    tskp: (dto.tskp as string) ?? null,
    tskp_ru: (dto.tskpRu as string) ?? null,
    parent_id: (dto.parentId as number) ?? null,
    level,
    node_type: (dto.nodeType as string) ?? 'department',
    sort_order: (dto.sortOrder as number) ?? 0,
    // Unit fields (org-unit-fields migration — CHAT-TARIXI Bo'lim→Sex→Uskuna→Ishchi)
    // NOTE: added after core-schema.ts Qadam 6 sync — Drizzle types now include these columns
    code: (dto.code as string) ?? null,
    qym_uz: (dto.qymUz as string) ?? null,
    qym_ru: (dto.qymRu as string) ?? null,
    camera_zone_id: (dto.cameraZoneId as string) ?? null,
    telegram_group_id: (dto.telegramGroupId as string) ?? null,
  })
  .returning();
```

**`updateFromDto()` metodi — keyin (satr 51–62 ga qo'shimcha):**
```typescript
// Unit fields (after core-schema sync)
if (dto.code !== undefined)            patch.code = dto.code as string;
if (dto.qymUz !== undefined)           patch.qym_uz = dto.qymUz as string;
if (dto.qymRu !== undefined)           patch.qym_ru = dto.qymRu as string;
if (dto.cameraZoneId !== undefined)    patch.camera_zone_id = dto.cameraZoneId as string;
if (dto.telegramGroupId !== undefined) patch.telegram_group_id = dto.telegramGroupId as string;
```

**Result\<T\> tekshiruvi:** `safeCall` allaqachon ishlatilmoqda — `create()` va `updateFromDto()` `Result<Record<string, unknown>>` qaytaradi. O'zgartirish kerak emas.

---

### Qadam 4 — `RazryadInput` va repo metodlariga exam fields qo'shish

**Fayl:** `apps/api/src/modules/org-structure/razryad.repository.ts`

**`RazryadInput` interfeysi — oldin (satr 15–24):**
```typescript
export interface RazryadInput {
  level?: number;
  name?: string;
  minRequirement?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  examType?: string | null;
  certificate?: string | null;
  description?: string | null;
}
```

**`RazryadInput` interfeysi — keyin:**
```typescript
export interface RazryadInput {
  level?: number;
  name?: string;
  minRequirement?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  examType?: string | null;
  certificate?: string | null;
  description?: string | null;
  /** EP-ORG-055: per-card-type configurable exam pass threshold (%). NULL = egasi belgilaydi (EGASI QIYMATI KERAK). */
  examPassThreshold?: number | null;
  /** EP-ORG-056: per-card-type configurable max retake count. NULL = egasi belgilaydi (EGASI QIYMATI KERAK). */
  maxRetakes?: number | null;
}
```

**`create()` INSERT — oldin (satr 55–63):**
```typescript
INSERT INTO razryad_levels
  (level, name, min_requirement, salary_min, salary_max, exam_type, certificate, description, is_active, created_at, updated_at)
VALUES
  (${dto.level}, ${dto.name ?? ''}, ${dto.minRequirement ?? null}, ${dto.salaryMin ?? null},
   ${dto.salaryMax ?? null}, ${dto.examType ?? null}, ${dto.certificate ?? null}, ${dto.description ?? null},
   true, NOW(), NOW())
RETURNING *
```

**`create()` INSERT — keyin:**
```typescript
INSERT INTO razryad_levels
  (level, name, min_requirement, salary_min, salary_max, exam_type, certificate, description,
   exam_pass_threshold, max_retakes, is_active, created_at, updated_at)
VALUES
  (${dto.level}, ${dto.name ?? ''}, ${dto.minRequirement ?? null}, ${dto.salaryMin ?? null},
   ${dto.salaryMax ?? null}, ${dto.examType ?? null}, ${dto.certificate ?? null}, ${dto.description ?? null},
   ${dto.examPassThreshold ?? null}, ${dto.maxRetakes ?? null},
   true, NOW(), NOW())
RETURNING *
```

> **DDL sinxronligi:** `exam_pass_threshold` va `max_retakes` ustunlari DB da faqat migration (Qadam DDL-2) qo'llanilgandan keyin mavjud bo'ladi. Migration GATED. Ammo repo kodi hozirdan yozish mumkin — `null` yuborish ustun mavjud emas paytida xato bermaydi (PostgreSQL `INSERT` da noma'lum ustun = xato, lekin `NULL` default bilan ustun = OK). **Shuning uchun:** migration GATED qolganda ushbu INSERT xato beradi. Xavfsiz tartib: **avval migration → keyin kod deploy.** Bu standart qoida.

**`update()` COALESCE — oldin (satr 75–84):**
```typescript
UPDATE razryad_levels SET
  level           = COALESCE(${dto.level ?? null}, level),
  name            = COALESCE(${dto.name ?? null}, name),
  min_requirement = COALESCE(${dto.minRequirement ?? null}, min_requirement),
  salary_min      = COALESCE(${dto.salaryMin ?? null}, salary_min),
  salary_max      = COALESCE(${dto.salaryMax ?? null}, salary_max),
  exam_type       = COALESCE(${dto.examType ?? null}, exam_type),
  certificate     = COALESCE(${dto.certificate ?? null}, certificate),
  description     = COALESCE(${dto.description ?? null}, description),
  updated_at      = NOW()
WHERE id = ${id} AND is_active = true
RETURNING *
```

**`update()` COALESCE — keyin:**
```typescript
UPDATE razryad_levels SET
  level                = COALESCE(${dto.level ?? null}, level),
  name                 = COALESCE(${dto.name ?? null}, name),
  min_requirement      = COALESCE(${dto.minRequirement ?? null}, min_requirement),
  salary_min           = COALESCE(${dto.salaryMin ?? null}, salary_min),
  salary_max           = COALESCE(${dto.salaryMax ?? null}, salary_max),
  exam_type            = COALESCE(${dto.examType ?? null}, exam_type),
  certificate          = COALESCE(${dto.certificate ?? null}, certificate),
  description          = COALESCE(${dto.description ?? null}, description),
  exam_pass_threshold  = COALESCE(${dto.examPassThreshold ?? null}, exam_pass_threshold),
  max_retakes          = COALESCE(${dto.maxRetakes ?? null}, max_retakes),
  updated_at           = NOW()
WHERE id = ${id} AND is_active = true
RETURNING *
```

**Result\<T\> tekshiruvi:** Hamma metodlar `Promise<Result<Row | null>>` yoki `Promise<Result<Row[]>>` qaytaradi — O'ZGARTIRISH KERAK EMAS. `throw/null/undefined` ishlatilmaydi.

---

### Qadam 5 — `RazryadCreateSchema` Zod yangilash

**Fayl:** `apps/api/src/modules/org-structure/razryad.controller.ts`

**Oldin (satr 21–30):**
```typescript
const RazryadCreateSchema = z.object({
  level:          z.number().int(),
  name:           z.string().min(1).max(200),
  minRequirement: z.string().max(2000).optional(),
  salaryMin:      z.number().optional(),
  salaryMax:      z.number().optional(),
  examType:       z.string().max(100).optional(),
  certificate:    z.string().max(500).optional(),
  description:    z.string().max(2000).optional(),
}).strict();
```

**Keyin:**
```typescript
const RazryadCreateSchema = z.object({
  level:              z.number().int(),
  name:               z.string().min(1).max(200),
  minRequirement:     z.string().max(2000).optional(),
  salaryMin:          z.number().optional(),
  salaryMax:          z.number().optional(),
  examType:           z.string().max(100).optional(),
  certificate:        z.string().max(500).optional(),
  description:        z.string().max(2000).optional(),
  /** EP-ORG-055: imtihon o'tish chegarasi (foizda). EGASI QIYMATI KERAK — global default yo'q. */
  examPassThreshold:  z.number().min(0).max(100).optional(),
  /** EP-ORG-056: qayta topshirish maksimal soni. EGASI QIYMATI KERAK — global default yo'q. */
  maxRetakes:         z.number().int().min(0).max(10).optional(),
}).strict();

const RazryadUpdateSchema = RazryadCreateSchema.partial();
```

**`RazryadUpdateSchema` satr 32:** `RazryadCreateSchema.partial()` — yangi maydonlar avtomatik `.optional()` bo'ladi. Alohida o'zgartirish kerak emas.

**Zod qoidasi:** `.strict()` saqlanadi. Faqat aniq ruxsat etilgan maydonlar qabul qilinadi. `examPassThreshold` 0–100 orasida (foiz). `maxRetakes` 0–10 orasida (mantiqiy chegara).

**`razryad.service.ts`** — passthrough (`this.repo.create(dto)` / `this.repo.update(id, dto)`). DTO interfeysi `RazryadInput` yangilangandan keyin TypeScript type moslashadi. Bu faylga **alohida o'zgartirish kerak emas.**

---

### Qadam 6 — Drizzle `core-schema.ts` sinxronizatsiyasi

**Fayl:** `lib/db/src/schema/core-schema.ts`

**6a. `orgDepartments` — unit fields qo'shish (satr 294–310 dan keyin):**

**Oldin (satr 294–310):**
```typescript
export const orgDepartments = pgTable("org_departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
  displayOrder: integer("sort_order").notNull().default(0),
  headUserId: integer("head_user_id").references(() => users.id, { onDelete: 'set null' }),
  tskp: text("tskp"),
  tskpRu: text("tskp_ru"),
  parentId: integer("parent_id"),
  hierarchyLevel: integer("level").notNull().default(0),
  nodeType: varchar("node_type", { length: 50 }).notNull().default("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Keyin:**
```typescript
export const orgDepartments = pgTable("org_departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
  displayOrder: integer("sort_order").notNull().default(0),
  headUserId: integer("head_user_id").references(() => users.id, { onDelete: 'set null' }),
  tskp: text("tskp"),
  tskpRu: text("tskp_ru"),
  parentId: integer("parent_id"),
  hierarchyLevel: integer("level").notNull().default(0),
  nodeType: varchar("node_type", { length: 50 }).notNull().default("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ─── unit fields (org-unit-fields migration — CHAT-TARIXI Bo'lim→Sex→Uskuna→Ishchi) ───
  code:             varchar("code", { length: 50 }),
  qymUz:            text("qym_uz"),
  qymRu:            text("qym_ru"),
  cameraZoneId:     text("camera_zone_id"),
  telegramGroupId:  text("telegram_group_id"),
});
```

**6b. `orgFunctions` — `last_reviewed_at` qo'shish (satr 320–350):**

`org-phase7-acting-staleness-2026-06-08.sql:17` — `last_reviewed_at TIMESTAMPTZ NULL` DB da bor. Drizzle ta'rifida yo'q.

**Oldin (satr 347–350):**
```typescript
  managerId:      integer("manager_id"),
  updatedAt:      timestamp("updated_at").defaultNow(),
});
```

**Keyin:**
```typescript
  managerId:       integer("manager_id"),
  updatedAt:       timestamp("updated_at").defaultNow(),
  // ─── Phase 7 staleness (org-phase7-acting-staleness-2026-06-08.sql:17) ───
  // NO default — a never-reviewed card must read as stale (NULL), not "reviewed at creation"
  lastReviewedAt:  timestamp("last_reviewed_at"),
});
```

**6c. `employeeCards` pgTable ta'rifi qo'shish (yangi — `orgFunctions` ta'rifidan keyin):**

Manba: `org-phase6-employee-cards-2026-06-08.sql:14–24` + `org-phase7-acting-staleness-2026-06-08.sql:10–12`

```typescript
// ─── EMPLOYEE ↔ CARD M:N (org-phase6 + org-phase7 migrations) ───────────────
// Drizzle sync only — table already exists in DB via raw SQL migration.
// Do NOT run Drizzle migrate — DB is ADD-ONLY, migration runs psql.
export const employeeCards = pgTable("employee_cards", {
  id:               serial("id").primaryKey(),
  employeeId:       integer("employee_id").notNull(),
  cardId:           integer("card_id").notNull(),
  isPrimary:        boolean("is_primary").notNull().default(false),
  isActive:         boolean("is_active").notNull().default(true),
  assignedAt:       timestamp("assigned_at").notNull().defaultNow(),
  endedAt:          timestamp("ended_at"),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
  // Phase 7 acting columns (org-phase7-acting-staleness-2026-06-08.sql:10–12)
  isActing:         boolean("is_acting").default(false),
  actingSupplement: varchar("acting_supplement"),
});

export type EmployeeCard = typeof employeeCards.$inferSelect;
export type InsertEmployeeCard = typeof employeeCards.$inferInsert;
```

> **Eslatma FK:** `employeeId` va `cardId` uchun `.references()` ni `employees` va `orgFunctions` ga bog'lash mumkin, lekin `employees` jadvali boshqa schema faylida. Xavfsizroq yondashuv: FK ni Drizzle da EMAS, DB migratsiyada aniqlash (allaqachon qilingan). Shuning uchun `.references()` o'tkazib yuboriladi — bu ADD-ONLY sync.

**6d. `cardFolders` pgTable ta'rifi qo'shish:**

Manba: `org-phase3-card-folders-2026-06-08.sql:7–20`

```typescript
// ─── CARD FOLDER (org-phase3 migration) ──────────────────────────────────────
// 6-section folder per card (EP-ORG-007). 1:1 with org_functions via UNIQUE(card_id).
// completeness% computed in service (NOT stored). Drizzle sync only.
export const cardFolders = pgTable("card_folders", {
  id:          serial("id").primaryKey(),
  cardId:      integer("card_id").notNull(),
  vazifa:      text("vazifa"),
  javobgarlik: text("javobgarlik"),
  gsd:         text("gsd"),
  reglament:   text("reglament"),
  jarayon:     text("jarayon"),
  talim:       text("talim"),
  isActive:    boolean("is_active").notNull().default(true),
  createdAt:   timestamp("created_at").defaultNow(),
  updatedAt:   timestamp("updated_at").defaultNow(),
});

export type CardFolder = typeof cardFolders.$inferSelect;
export type InsertCardFolder = typeof cardFolders.$inferInsert;
```

**Import tekshiruvi:** `core-schema.ts` da `numeric` Drizzle column kerak bo'lsa (`actingSupplement` aslida `NUMERIC` — `org-phase7` da `numeric NULL` sifatida) — `import { ..., numeric } from "drizzle-orm/pg-core"` ga `numeric` qo'shish kerak. Yoki `varchar` → `text` sifatida yozish (DB darajasida numeric, Drizzle tomonida text ko'rinishida o'qiladi). Eng xavfsiz: `text("acting_supplement")` ishlatish, chunki hozir ustun qiymati kam ishlatiladi va type mismatch tsc ni buzmaydi.

**6e. Drizzle export barrel tekshiruvi:**

`lib/db/src/schema/core-schema.ts` boshida `export * from` bloklari bor. Yangi `employeeCards` va `cardFolders` ushbu fayldan export qilinishi uchun alohida import kerak emas — ular to'g'ridan ushbu faylga qo'shiladi.

---

## 5. DDL

> **DDL DARVOZASI FAOL.** Quyidagi uch migration faylini YOZING lekin ISHLATMA.  
> Har faylda `-- GATED: owner approval required` satri bo'lishi SHART.  
> Egasi `-- APPROVED: <ism> <sana>` va `psql "$DATABASE_URL" -f <fayl>` ni bergandan keyin ISHLATILADI.

---

### DDL-1: `org-unit-fields-2026-06-19.sql`

**Fayl:** `apps/api/src/shared/db/migrations/org-unit-fields-2026-06-19.sql`

```sql
-- org-unit-fields-2026-06-19.sql
-- ORG Phase 1 extension — org_departments unit fields for Bo'lim→Sex→Uskuna→Ishchi hierarchy.
-- Source: docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md — org-unit model.
-- EP-ORG Phase 1 CHAT-TARIXI: code + QYM(uz/ru) + camera-zone + Telegram-group-ID.
--
-- GATED: owner approval required before running.
-- APPROVED: <egasi ismi> <sana>
--
-- All columns NULLABLE, ADD IF NOT EXISTS — idempotent (re-run = no-op).
-- No FK — code/qym/camera_zone/telegram are free-text identifiers, not FK-referenced.

ALTER TABLE public.org_departments
  ADD COLUMN IF NOT EXISTS code              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS qym_uz            TEXT,
  ADD COLUMN IF NOT EXISTS qym_ru            TEXT,
  ADD COLUMN IF NOT EXISTS camera_zone_id    TEXT,
  ADD COLUMN IF NOT EXISTS telegram_group_id TEXT;

-- DB-proof: after running, check column list
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'org_departments' AND column_name IN ('code','qym_uz','qym_ru','camera_zone_id','telegram_group_id')
-- ORDER BY column_name;
-- Expected: 5 rows returned.
```

---

### DDL-2: `org-razryad-exam-config-2026-06-19.sql`

**Fayl:** `apps/api/src/shared/db/migrations/org-razryad-exam-config-2026-06-19.sql`

> ⚠️ **EGASI QIYMATI KERAK (EP-ORG-055/056):** `exam_pass_threshold` va `max_retakes` uchun
> hech qanday global default YO'Q — egasi "default yo'q" degan (00-INTERVYU-MOSLIK.md §1).
> Har `razryad_levels` yozuvi uchun egasi/HR alohida qiymat belgilaydi (master-data).
> Ustunlar `DEFAULT NULL` bilan yaratiladi. Egasi har razryad darajasi uchun qiymat kiritadi.
> LMS/imtihon tizimi bu ustunlardan o'qiydi, hardcoded 70%/3 ishlatmaydi.

```sql
-- org-razryad-exam-config-2026-06-19.sql
-- razryad_levels exam configurability — EP-ORG-055 (pass threshold) + EP-ORG-056 (max retakes).
-- Source: docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md Phase 2 + Phase 4.
--
-- GATED: owner approval required before running.
-- APPROVED: <egasi ismi> <sana>
--
-- ⚠️ EGASI QIYMATI KERAK: DEFAULT NULL (hardcoded 70%/3 TAQIQ — egasi "default yo'q" degan).
--    Mavjud 6 ta razryad yozuvi uchun egasi quyidagi UPDATE orqali qiymat kiritadi:
--      UPDATE razryad_levels SET exam_pass_threshold = <foiz>, max_retakes = <son> WHERE level = <N>;
--    LMS/imtihon mantiq bu ustunlardan o'qiydi — NULL holat = "egasi hali kiritgani yo'q".
--
-- exam_pass_threshold: NUMERIC(5,2) NULL — 0.00–100.00 foiz (egasi belgilaydi)
-- max_retakes:         INTEGER NULL       — qayta topshirish maks soni (egasi belgilaydi)

ALTER TABLE public.razryad_levels
  ADD COLUMN IF NOT EXISTS exam_pass_threshold NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_retakes         INTEGER       DEFAULT NULL;

-- CHECK constraints for data integrity (approved bilan birga run qiling):
-- ALTER TABLE public.razryad_levels
--   ADD CONSTRAINT chk_razryad_exam_pass_threshold CHECK (exam_pass_threshold IS NULL OR exam_pass_threshold BETWEEN 0 AND 100),
--   ADD CONSTRAINT chk_razryad_max_retakes         CHECK (max_retakes IS NULL OR max_retakes >= 0);

-- DB-proof: after running
-- SELECT id, level, name, exam_pass_threshold, max_retakes FROM razryad_levels ORDER BY level;
-- Expected: all 6 rows with exam_pass_threshold=NULL, max_retakes=NULL (egasi kiritishni kutadi).
```

---

### DDL-3: `org-card-portret-2026-06-19.sql`

**Fayl:** `apps/api/src/shared/db/migrations/org-card-portret-2026-06-19.sql`

```sql
-- org-card-portret-2026-06-19.sql
-- org_node_portret.card_id — enables per-CARD portret (not just per-node/dept).
-- Source: docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md Phase 5 — 8-tab card UI,
--   Tab 7 (Portret). Current table is keyed by node_id (→ org_departments.id).
--   card_id (→ org_functions.id) enables querying portret BY CARD.
--
-- GATED: owner approval required before running.
-- APPROVED: <egasi ismi> <sana>
--
-- NULLABLE — existing rows (portret keyed by node only) untouched. New per-card portret
-- rows can populate card_id. A portret row can have BOTH node_id AND card_id (dual-keyed).
-- ON DELETE SET NULL: if card (org_function) is soft-deleted, portret row stays (historical).
--
-- NOTE: org_node_portret currently has UNIQUE INDEX on node_id (idx_org_node_portret_node_id).
-- A separate index on card_id is NOT unique — a card may have one portret but index enables fast lookup.

ALTER TABLE public.org_node_portret
  ADD COLUMN IF NOT EXISTS card_id INTEGER REFERENCES public.org_functions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_org_node_portret_card_id ON public.org_node_portret(card_id)
  WHERE card_id IS NOT NULL;

-- DB-proof: after running
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'org_node_portret' AND column_name = 'card_id';
-- Expected: 1 row (card_id, integer).
--
-- SELECT indexname FROM pg_indexes WHERE tablename = 'org_node_portret';
-- Expected: idx_org_node_portret_node_id, idx_org_node_portret_card_id.
```

---

## 6. QABUL MEZONI

Har bir mezon **jonli tasdiq** talab qiladi:

### 6.1 TypeScript / Build

```
[ ] pnpm --filter @europrint/schemas build → 0 xato, 0 ogohlantirish (lib/db)
[ ] pnpm --filter @europrint/api tsc --noEmit → 0 xato
[ ] pnpm --filter erp-dashboard tsc --noEmit → 0 xato (FE o'zgartirilmagan, lekin tekshirilsin)
```

### 6.2 Dead import yo'q

```
[ ] grep -n "notImplemented" apps/api/src/modules/org-structure/org-structure.controller.ts
    → natija yo'q (0 qator)
```

### 6.3 Zod qoidalari

```
[ ] bash scripts/reviewer-dto-validation.sh → PASS
[ ] RazryadCreateSchema + RazryadUpdateSchema da examPassThreshold va maxRetakes bor
[ ] OrgNodeSchema da code/qymUz/qymRu/cameraZoneId/telegramGroupId bor, .strict() saqlanmoqda
```

### 6.4 Result<T> tekshiruvi

```
[ ] bash scripts/reviewer-result-pattern.sh → 0 yangi FAIL
[ ] razryad.repository.ts create()/update()/list()/findById()/softDelete() → barchasida Result<T>
```

### 6.5 Migration fayllar (GATED)

```
[ ] apps/api/src/shared/db/migrations/org-unit-fields-2026-06-19.sql — mavjud, "-- GATED" belgili
[ ] apps/api/src/shared/db/migrations/org-razryad-exam-config-2026-06-19.sql — mavjud, "-- GATED" belgili
[ ] apps/api/src/shared/db/migrations/org-card-portret-2026-06-19.sql — mavjud, "-- GATED" belgili
[ ] Uchala faylda "APPROVED:" placeholder bor (egasi to'ldiradi)
[ ] Hech biri psql bilan ishlatilmagan (faqat yozilgan)
```

### 6.6 DB-proof (migration qo'llanilgandan KEYIN — egasi "run" berganda)

```sql
-- DDL-1 proof:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'org_departments'
  AND column_name IN ('code','qym_uz','qym_ru','camera_zone_id','telegram_group_id');
-- → 5 qator

-- DDL-2 proof:
SELECT id, level, name, exam_pass_threshold, max_retakes FROM razryad_levels ORDER BY level;
-- → 6 qator, exam_pass_threshold=70.00, max_retakes=3

-- DDL-3 proof:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'org_node_portret' AND column_name = 'card_id';
-- → 1 qator

-- Drizzle sync proof (last_reviewed_at):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'org_functions' AND column_name = 'last_reviewed_at';
-- → 1 qator (allaqachon mavjud, Phase 7 migration qo'llanilgan)
```

### 6.7 Oltin zanjir regressiya yo'q

```
[ ] bash scripts/reviewer-result-pattern.sh → avvalgi 0 FAIL saqlanmoqda
[ ] bash scripts/reviewer-array-safety.sh → avvalgi 0 FAIL saqlanmoqda
[ ] GET /api/org-structure/hierarchy → 200 (regression yo'q)
[ ] GET /api/org-structure/razryad-levels → 200, items array
[ ] GET /api/org-structure/razryad-levels/:id → 200 yoki 404 (real DB)
[ ] POST /api/org-structure/razryad-levels body: { level: 99, name: "Test" } → 201 (real INSERT)
[ ] DELETE /api/org-structure/razryad-levels/:id → 200 yoki 404 (soft-delete)
```

---

## 7. SELF-VERIFY

### 7.1 Kod o'zgarishlari tekshiruvi

```bash
# 1. Dead import yo'qligini tekshir
grep -n "notImplemented" \
  apps/api/src/modules/org-structure/org-structure.controller.ts
# → natija yo'q

# 2. Yangi Zod maydonlar bor
grep -n "examPassThreshold\|maxRetakes" \
  apps/api/src/modules/org-structure/razryad.controller.ts
# → 2 qator (create schema da)

grep -n "examPassThreshold\|maxRetakes" \
  apps/api/src/modules/org-structure/razryad.repository.ts
# → 4+ qator (interface + create + update da)

# 3. OrgNodeSchema unit fields
grep -n "qymUz\|cameraZoneId\|telegramGroupId" \
  apps/api/src/modules/org-structure/org-structure.controller.ts
# → 3+ qator

# 4. Drizzle schema yangilangan
grep -n "lastReviewedAt\|last_reviewed_at" lib/db/src/schema/core-schema.ts
# → 1 qator (orgFunctions da)

grep -n "employeeCards\|card_folders\|cardFolders" lib/db/src/schema/core-schema.ts
# → 4+ qator (2 ta pgTable ta'rifi)

grep -n "qymUz\|camera_zone_id\|telegram_group_id" lib/db/src/schema/core-schema.ts
# → 5 qator (orgDepartments da)
```

### 7.2 TypeScript build

```bash
# Schemas paket
pnpm --filter @europrint/schemas build
# → exit 0

# Backend typecheck (dist build kerak emas, faqat typecheck)
pnpm --filter @europrint/api exec tsc --noEmit
# → 0 xato

# Frontend typecheck
pnpm --filter erp-dashboard exec tsc --noEmit
# → 0 xato (FE o'zgartirilmagan, lekin confirm)
```

### 7.3 Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh
# → FAIL: 0 (6 WARN = qabul, avvalgi holat)

bash scripts/reviewer-array-safety.sh
# → FAIL: 0

bash scripts/reviewer-dto-validation.sh
# → PASS

bash scripts/reviewer-jwt-guard.sh
# → PASS
```

### 7.4 Live API tekshiruvi (migration GATED paytida)

Migration qo'llanilmagan holatda faqat quyidagi endpointlar tekshiriladi:

```bash
# Health
curl -s http://localhost:3030/api/auth/health
# → 200

# Razryad list (exam fields DB da yo'q paytida NULL qaytaradi — xato emas)
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/org-structure/razryad-levels
# → { items: [...], total: 6 }

# Org hierarchy
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/org-structure/hierarchy
# → 200, tree structure
```

### 7.5 Migration qo'llanilgandan KEYIN (egasi "run" berganda) DB-proof

```bash
# DDL-1: unit fields
psql "$DATABASE_URL" -c "
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'org_departments'
  AND column_name IN ('code','qym_uz','qym_ru','camera_zone_id','telegram_group_id')
ORDER BY column_name;
"
# → 5 qator

# DDL-2: razryad exam config
psql "$DATABASE_URL" -c "
SELECT id, level, name, exam_pass_threshold, max_retakes FROM razryad_levels ORDER BY level;
"
# → 6 qator, exam_pass_threshold=70.00, max_retakes=3

# DDL-2 real INSERT proof (Q-40 — ishlaydi ≠ to'g'ri)
psql "$DATABASE_URL" -c "
INSERT INTO razryad_levels (level, name, exam_pass_threshold, max_retakes, is_active)
VALUES (99, 'Test Razryad', 75.00, 5, true)
RETURNING id, level, name, exam_pass_threshold, max_retakes;
"
# → 1 qator, exam_pass_threshold=75.00, max_retakes=5
psql "$DATABASE_URL" -c "DELETE FROM razryad_levels WHERE level = 99;"

# DDL-3: card_id ustuni
psql "$DATABASE_URL" -c "
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'org_node_portret' AND column_name = 'card_id';
"
# → 1 qator

# Real round-trip test (Q-40): POST → DB → GET
TOKEN="..."  # login orqali oling
NEW_ID=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level":7,"name":"Sietatest","examPassThreshold":80,"maxRetakes":2}' \
  http://localhost:3030/api/org-structure/razryad-levels | jq '.id')

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/org-structure/razryad-levels/$NEW_ID
# → { id: $NEW_ID, level: 7, exam_pass_threshold: "80.00", max_retakes: 2, ... }

# Cleanup
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/org-structure/razryad-levels/$NEW_ID
```

---

## 8. COMMIT

**Tartib:** Har mantiqiy guruh alohida commit. `git add -A` yoki `git add .` TAQIQ. Faqat OWNED-FILE larga `git add`.

### Commit 1 — Code fixes (dead import + Zod + repo)

```bash
git add apps/api/src/modules/org-structure/org-structure.controller.ts
git add apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts
git add apps/api/src/modules/org-structure/razryad.repository.ts
git add apps/api/src/modules/org-structure/razryad.controller.ts

git commit -m "feat(org): P04 unit-fields + razryad exam config BE mapping

- org-structure.controller.ts: remove dead notImplemented import (Q-46)
- org-structure.controller.ts: OrgNodeSchema add unit fields (code/qymUz/qymRu/cameraZoneId/telegramGroupId) EP-ORG Phase 1
- org-mutations.repo.ts: create()+updateFromDto() map unit fields after schema sync
- razryad.repository.ts: RazryadInput + create()/update() add examPassThreshold/maxRetakes EP-ORG-055/056
- razryad.controller.ts: RazryadCreateSchema add examPassThreshold/maxRetakes fields

All Result<T>, Zod .strict(), no throw/null/undefined. tsc 0."
```

### Commit 2 — Drizzle schema sync

```bash
git add lib/db/src/schema/core-schema.ts

git commit -m "feat(schema): P04 Drizzle sync for org tables

- orgDepartments: add 5 unit fields (code/qymUz/qymRu/cameraZoneId/telegramGroupId)
- orgFunctions: add lastReviewedAt (DB via phase7 migration, Drizzle was missing)
- Add employeeCards pgTable (M:N sync, DB via phase6+phase7 migrations)
- Add cardFolders pgTable (6-section sync, DB via phase3 migration)
No new DB tables — ADD-ONLY Drizzle sync. schemas build 0."
```

### Commit 3 — GATED migrations

```bash
git add apps/api/src/shared/db/migrations/org-unit-fields-2026-06-19.sql
git add apps/api/src/shared/db/migrations/org-razryad-exam-config-2026-06-19.sql
git add apps/api/src/shared/db/migrations/org-card-portret-2026-06-19.sql

git commit -m "feat(migrations): P04 GATED DDL for org unit-fields + razryad exam + card portret

- org-unit-fields-2026-06-19.sql: org_departments +5 unit fields (GATED)
- org-razryad-exam-config-2026-06-19.sql: razryad_levels +exam_pass_threshold/max_retakes (GATED)
- org-card-portret-2026-06-19.sql: org_node_portret +card_id FK (GATED)

DO NOT RUN. Owner approval required (APPROVED: placeholder in each file).
EP-ORG-055/056 Phase 1 CHAT-TARIXI."
```

---

## 9. EDGE-CASE LARNI HAL QILISH

### E-1: Migration GATED paytida repo `create()` xato beradimi?

- `exam_pass_threshold` ustuni DB da yo'q paytida INSERT xato beradi (`column "exam_pass_threshold" of relation "razryad_levels" does not exist`).
- **Yechim:** Repo `create()` da `examPassThreshold ?? null` mavjud — NULL ni yuborish ham ustun bo'lmasa xato beradi.
- **To'g'ri tartib:** Migration → deploy (kod). Hozir faqat migration va kod tayyorlash; egasi "run" berganda tartibni saqlash.
- **Xavfsiz fallback (ixtiyoriy):** Repo `create()` da conditional: `dto.examPassThreshold !== undefined ? sql`exam_pass_threshold = ${dto.examPassThreshold}` : sql```. Lekin bu haddan ortiq murakkablik — standart deployment tartibini saqlash yetarli.

### E-2: `orgDepartments` Drizzle types migration oldida FE ga ta'sirimi?

- `orgDepartments.$inferSelect` tip endi `code?: string | null` va boshqa maydonlarni o'z ichiga oladi.
- Bu FE ga ta'sir qilmaydi (FE `lib/db` dan to'g'ridan type import qilmaydi — faqat API javoblarini ishlatadi).
- BE da `OrgMutationsRepo.create()` endi Drizzle type da unit fields ko'radi → type PASS.

### E-3: `cardFolders.talim` ustun nomi `talim` vs `ta'lim` (apostrof bilan)?

- DB migratsiyada: `talim TEXT` (apostrof yo'q — SQL identifikator uchun xavfsiz).
- Drizzle ta'rifida ham: `talim: text("talim")` — izchil.
- FE da `section.ta'lim` → API da `talim` mapping kerak (bu P18 FE paketiniki).

### E-4: `employee_cards.acting_supplement` — DB da `NUMERIC`, Drizzle da `text`?

- `org-phase7-acting-staleness-2026-06-08.sql:12` — `acting_supplement numeric NULL`.
- `core-schema.ts` da `text("acting_supplement")` sifatida yozish — PostgreSQL `NUMERIC → text` cast qiladi read paytida (to'g'ri). Yoki `decimal("acting_supplement")` ishlatish (Drizzle `decimal` = `NUMERIC`).
- **Tavsiya:** `decimal("acting_supplement", { precision: 14, scale: 2 })` ishlatish — aniqroq.
- `import { ..., decimal } from "drizzle-orm/pg-core"` ga `decimal` qo'shish kerak.

### E-5: `org_node_portret.card_id` NULL bo'lsa — portret node darajasida qoladi

- Mavjud portretlar `node_id` bilan ishlaydi. `card_id = NULL` → eski portretlar ishlashda davom etadi.
- Yangi karta portretlari `card_id = orgFunctionId` bilan yaratiladi.
- Bir portret qatorida IKKALASI ham bo'lishi mumkin (`node_id` va `card_id`).

---

## 10. DEFERRED (Bu paketda bajarilmaydi)

Quyidagi ishlar **bu paketga kirmaydi** — scope creep taqiq (Q-47 + no-scope-creep qoidasi):

| # | Defer | Sabab |
|---|-------|-------|
| D-1 | `CardDetailDialog.tsx:277–279` Portret tab real data | FE paketi — P05 ga tegishli |
| D-2 | `workflow_rules` jadvali | HARD BOUNDARY: owner qarorini kutadi (schema noma'lum) |
| D-3 | Razryad o'zgartirish → HR document event | P04 scope emas; alohida event paketi |
| D-4 | **EP-ORG-041: Org-kaskad (yangi bo'lim → avto POS-Monitor ombor + RBAC)** | **EGASI QARORI KERAK.** EP-ORG-041 (MASTER-SAVOL-JAVOB: "Yangi bo'lim/transfer → avto-kaskad: POS-ombor, RBAC, adaptatsiya, shartnoma") butunlay qoplanmagan. Bu P04 scope'ida EMAS, chunki: (a) POS-ombor yaratish WMS moduli chegarasi; (b) RBAC provisioning auth moduli; (c) trigger qaysi event orqali bo'lishi egasi yechimi. Egasi quyidagilarga qaror beradi: yangi `org_departments` qo'shilganda qaysi system-hook ishga tushadi; POS-Monitor ombor avto-create qilish uchun qaysi WMS endpoint chaqiriladi; RBAC permission seeding qaysi packet bajaradi. Bu alohida EP-ORG-041 implementation paketi talab qiladi. |
| D-5 | Vacancy bulk import EP-ORG-075/076 | Alohida paket |
| D-6 | `CardExamsDialog` FE forma maydonlari (examPassThreshold/maxRetakes) | FE paketi — P05 ga tegishli |
| D-7 | `card_portret` GET endpoint (per-card portret so'rov) | Service/repo o'zgartirish — P05 ga tegishli |
| D-8 | `OrgNodeDetail.tsx StatsTab` `vacantChildCount` bug | FE paketi |
| D-9 | **EP-ORG-102: O'zbekcha daraja-kodi talabi** | **EGASI QARORI KERAK.** EP-ORG-102 (OCHIQ-JAVOBLAR: "Bo'lim/daraja kodi kartada belgilansin, O'ZBEK TILIDA — НО/РО kabi rus qisqartmalar o'zbekchaga o'girilsin") bu P04 DDL scope'iga ta'sir qiladi: (a) `code VARCHAR(50)` ustuni (DDL-1) mavjud — lekin qiymat formati belgilanmagan; (b) egasi 7-bosqich ierarxiya uchun o'zbekcha nomlash jadvali berishi kerak (masalan "BO" = bo'lim boshlig'i, "RO" o'rniga); (c) CHECK constraint yoki enum egasi ro'yxatisiz yozilib bo'lmaydi. Egasidan o'zbekcha daraja-kod ro'yxati so'raladi, keyin `code` ustuniga COMMENT va ixtiyoriy CHECK qo'shiladi. |

---

## 11. XATO IZLASH (Troubleshooting)

### Tsc xato: `Property 'code' does not exist on type 'OrgDeptPatch'`

- **Sabab:** `orgDepartments.$inferInsert` da `code` hali yo'q — Drizzle sync bajarilmagan.
- **Yechim:** Qadam 6 (Drizzle sync) ni avval bajaring, keyin Qadam 3 (org-mutations.repo.ts).

### Tsc xato: `Property 'lastReviewedAt' does not exist on type 'OrgFunction'`

- **Sabab:** `core-schema.ts` da `orgFunctions` pgTable ta'rifiga `lastReviewedAt` qo'shilmagan.
- **Yechim:** Qadam 6b ni bajarib, `updatedAt` dan keyin `lastReviewedAt` qo'shing.

### Tsc xato: `Cannot find name 'employeeCards'`

- **Sabab:** `employeeCards` `core-schema.ts` ga qo'shilgan, lekin `@shared/db` barrel export qilmayapti.
- **Yechim:** `lib/db/src/index.ts` yoki `packages/db/index.ts` barrel faylini tekshiring — `core-schema.ts` allaqachon eksport qilinganmi? Odatda `export * from './schema/core-schema'` mavjud. Agar yo'q bo'lsa — qo'shish kerak (lekin bu OWNED FILE emas — TO'XTA, egasiga flag).

### `INSERT` xato: `column "exam_pass_threshold" of relation "razryad_levels" does not exist`

- **Sabab:** Migration GATED — DB ga qo'llanilmagan.
- **Yechim:** Egasi migrationni tasdiqlab `psql` buyrug'ini berishini kuting.

---

*P04 direktiva versiyasi 1.0 · 2026-06-19 · Wave 1 · DDL-GATED · Q-47 to'liq*
