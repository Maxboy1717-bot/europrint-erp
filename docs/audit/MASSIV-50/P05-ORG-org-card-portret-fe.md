# P05 — ORG / KARTALAR: ORG card-portret BE + razryad-change event + FE dialogs

> Agent: P05 · Wave: 2 · DependsOn: [P04] · DDLGate: false (DDL yozilib, GATED belgisi bilan izolyatsiya qilinadi — ISHGA TUSHIRILMAYDI)
> Modul: ORG / KARTALAR · Slug: org-card-portret-fe
> Yozilgan: 2026-06-19 · Executor = Muslimbek

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI (EXECUTOR)** agentsan. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi.

**WAVE 2 — DependsOn: [P04]:** P04 agenti tugaguncha bu agent BOSHLAMAYDI. P04 ning commit hashlari va tsc 0 tasdig'ini ko'rgandan keyin boshlang.

### Qoidalar bloki (Q-47 — har direktivaga verbatim):

1. **Result<T>** — hamma repo/service metodida; `throw`/`null`/`undefined` qaytarish TAQIQ.
2. **@Body Zod bilan** validate; `class-validator` TAQIQ.
3. **Drizzle ORM** asosiy; raw SQL faqat murakkab holatda (`-- NOTE: Drizzle ...` izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri:** REAL INSERT/UPDATE + DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi); echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI;** buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31):** faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35):** `CREATE TABLE` / `ALTER TABLE` / migration faqat egasi ruxsati bilan. Migration faylida `-- APPROVED: <owner> <date>` izoh SHART. Bu paket DDL yozadi lekin `GATED` belgisi bilan — ISHGA TUSHIRILMAYDI.
8. **`git add <aniq-fayl>` faqat;** `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45:** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify:** BE tsc 0, FE tsc 0, tegishli reviewer skriptlari, jonli DB-proof (kirit → saqla → qayta o'qi).
11. **"V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + `MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md`); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu 7 faylga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil, supurib ketma.**

### Owned files (mutlaq yo'llar):

```
apps/api/src/modules/org-structure/card.controller.ts
apps/api/src/modules/org-structure/card.service.ts
apps/api/src/modules/org-structure/card.repository.ts
artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog.tsx
artifacts/erp-dashboard/src/components/hr/org/RazryadFormDialog.tsx
artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx
artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx
```

### DDL fayllari (GATED — faqat yoziladi, ISHGA TUSHIRILMAYDI):

```
apps/api/src/shared/db/migrations/p05-org-unit-fields-razryad-exam.sql
```

Bu migration faylni yozasiz lekin `pnpm db:migrate` yoki psql bilan ISHGA TUSHIRMAYSIZ.
Egasining `-- APPROVED: <ism> <sana>` izohini kutasiz va shu izoh paydo bo'lganda P04 agenti yoki egasi alohida run qiladi.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` + `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` (EP-ORG-009/013/043/049/055/056).

### 2.1 Card-centric model (T1 poydevori)

- **KARTA ASOSIY, XODIM IKKILAMCHI.** 1 karta = 1 o'rin = 1 xodim (M:N `employee_cards` orqali).
- Karta: lavozim + bo'lim + razryad + oylik diapazon + ЦКП + 6-bo'lim papka + AI imtihon + sertifikatlar + bo'sh-o'rin yoshi + eskirganlik soati + i.o. mexanikasi.
- **Xodim faqat kartaga bog'lansa → oylik + ERP.**

### 2.2 Razryad (daraja) master-data (EP-ORG-009/043/055/056)

- Razryad = **konfiguratsiyalanadigan master-data:** daraja raqami, nomi, minimal talab, oylik-band ("dan-gacha"), imtihon turi, sertifikat, tavsif, **imtihon o'tish chegarasi (%)**, **qayta topshirish maksimumi** (EP-ORG-055/056).
- Razryad kartaning ichida rang bilan ko'rsatiladi (EP-ORG-043).
- **Razryad o'zgarishi → HR hujjat + ichki sertifikat avto-yaratilishi (EP-ORG-013).** Hozir bu yo'q — shu paketda qo'shiladi: `RazryadChangedEvent` emissiya + audit listener.
- Oshirish: imtihon → HR + menejer tasdiqi (EP-ORG-010). Tushirish: sabab kerak, AI-taklif → menejer tasdiqlashi (EP-ORG-134).

### 2.3 Org-unit ierarxiya maydonlari (CHAT-TARIXI)

Bo'lim → Sex → Uskuna → Ishchi — har birida:
- `code` VARCHAR(50) — ichki identifikator
- `qym_uz` TEXT — ЦКП/QYM matni (o'zbek)
- `qym_ru` TEXT — ЦКП/QYM matni (rus)
- `camera_zone_id` TEXT — AI kamera zona identifikatori
- `telegram_group_id` TEXT — Telegram guruh ID

Bu maydonlar `org_departments` jadvalida hozir YO'Q. DDL GATED.

### 2.4 Card Portret tab (Phase 5, Tab 7)

- **Hozirgi holat:** `CardDetailDialog.tsx:277-279` da `EPComingSoon` placeholder.
- **Vizyon talabi (EP-AI-067 + 00-INTERVYU-MOSLIK.md §1 2-tizimli og'ish):**
  > ⚠️ **YO'NALISH TUZATILDI:** Egasining global printsipi = "AI KUZATADi/BELGILAYDi, salbiy ta'sir FAQAT inson tasdig'i bilan."
  > EP-AI-067 javob: "Ha — AI har karta uchun real eng yaxshilardan etalon profil tuzadi, baho shunga nisbatan."
  > Portret = AI-generated fit-PDF (3-tomon: xodim ↔ karta ↔ AI baholovi), inson FAQAT TASDIQLAYDI.
  > Joriy direktiva "HR qo'lda to'ldiradigan matn-forma" — bu EGASINING MARKAZIY FALSAFASIGA ZID.
  >
  > **To'g'ri yo'nalish:**
  > 1. AI (P36 / EP-AI-067) karta uchun ideal-profil generatsiya qiladi (etalon = shu lavozimda eng yaxshi ko'rsatkich ko'rsatganlar).
  > 2. Generatsiyalangan portret HR/direktor tomonidan ko'rib chiqiladi va tasdiqlanadi.
  > 3. Tasdiqlangan portret `org_node_portret` da saqlanadi (`record_type='card'`, `record_id=org_functions.id`).
  > 4. PDF eksport: 3-tomon formati — xodim profili + karta talablari + AI moslik-foizi.
  >
  > **Bu paket qiladigan (interim):** API infra (`GET/PUT /cards/:id/portret`) + FE saqlovchi forma.
  > Forma hozircha "AI ma'lumotni ko'rsatadi + inson tahrirlaydi/tasdiqlaydi" sifatida dizayn qilinadi —
  > AI generatsiya logiкasi P36 (AI modul) tomonidan yoziladi va bu endpoint'ga `portret_data` yuboradi.
  > **EGASI QARORI KERAK:** AI-generate trigger: avtomatik (karta yaratilganda) yoki qo'lda (HR tugmasi)?

- **Shu paketda bajariladigan:** `GET /api/org-structure/cards/:id/portret` + `PUT /api/org-structure/cards/:id/portret` endpoint — `org_node_portret` jadvalini `record_type` = `'card'` va `record_id` = `org_functions.id` bilan qayta ishlatish (yangi jadval DDL KERAK EMAS). FE Portret tab: AI-tasdiq shablon (soxta emas — real DB-proof). DB-proof: kirit → saqla → qayta o'qi → ko'rinadimi.

### 2.5 Exam konfiguratsiya maydonlari FE (EP-ORG-055/056)

- `RazryadFormDialog.tsx` — hozir `exam_pass_threshold` va `max_retakes` maydonlari YO'Q.
- DB kolonlari ham YO'Q (`razryad_levels` jadvalida). DDL GATED.
- FE ga bu maydonlarni qo'shish: forma tayyorlash va `payload` ga qo'shish (BE jadval tayyor bo'lganda to'liq ishlaydi, shu orada UI ga ko'rinadi, saqlash `COALESCE` orqali null o'tadi yoki DDL approved bo'lganda bog'lanadi).

### 2.6 Org-unit maydonlari FE (AddNodeDialog + EditDialog)

- `AddNodeDialog.tsx` — hozir `code`, `qym_uz` / `qym_ru`, `camera_zone_id`, `telegram_group_id` maydonlari YO'Q.
- `EditDialog.tsx` — xuddi shu.
- DDL GATED bo'lganligi sababli: maydonlarni forma state va payload ga qo'shiladi; `COALESCE` orqali null o'tadi yoki DDL approved bo'lganda jadvalda saqlanadi.
- `AddNodeDialog.tsx:64` — `"Bo'lim qo'shildi"` hardcoded matn → `t("bolimQoshildi")` bilan almashtirish.

### 2.7 Qabul mezonlari (qisqacha)

| Feature | Qabul mezoni |
|---------|-------------|
| Portret BE endpoint | `GET /cards/:id/portret` → `org_node_portret` dan real ma'lumot YOKI `{}` (bo'sh) qaytaradi; `PUT /cards/:id/portret` → real UPSERT → DB-proof. ⚠️ EP-AI-067: portret AI tomonidan generatsiya qilinadi (P36), inson tasdiqlaydi — bu endpoint AI ma'lumotini qabul qiladi va HR tasdig'ini yozadi. |
| Portret FE tab | EPComingSoon o'chadi → AI-tasdiq forma (AI generatsiya → HR tahrirlab tasdiqlaydi); kirit → saqla → qayta och → ko'rinadi. HR qo'ldan to'ldirmaydigan bo'sh forma emas — AI portret ko'rsatadi. |
| RazryadChangedEvent | `PATCH /org-structure/cards/:id` razryad_level_id o'zgarsa → event domain_events ga yoziladi |
| exam maydonlari FE | RazryadFormDialog → `exam_pass_threshold` + `max_retakes` maydoni ko'rinadi + payload ga kiradi |
| Org-unit maydonlari FE | AddNodeDialog + EditDialog → `code`/`qym_uz`/`qym_ru`/`camera_zone_id`/`telegram_group_id` ko'rinadi |
| DDL migration | Fayl yozilgan, GATED, `-- APPROVED:` placeholder bor, ISHGA TUSHIRILMAGAN |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (exists)

**BE:**
- `card.controller.ts:1-300` — to'liq CRUD + assign/unassign + gate + certificates + mark-reviewed. Hamma endpoint real.
- `card.service.ts:1-150` — `canAssignEmployee`, `assignEmployeeToCard`, `markReviewed`, `resolveGate`, FORMULA-A `listEmployeeCards`. Hamma metod Result<T>.
- `card.repository.ts:1-300+` — barcha tabs SQL: `listEmployees`, `listChildren`, `listVacancies`, `listHistory`, `listCertificates`, `resolveGate`, `revertExpiredActing`.
- `card.controller.ts:57` — `@Controller('org-structure/cards')` — prefiks to'g'ri.

**FE:**
- `CardDetailDialog.tsx:1-319` — 8-tab dialog: tab 1-6 + tab 8 real ma'lumot; tab 7 `EPComingSoon` (`:277-279`).
- `RazryadFormDialog.tsx:1-170` — POST/PATCH persists to `/api/org-structure/razryad-levels`. Ishlaydi lekin `exam_pass_threshold` / `max_retakes` maydonlari YO'Q.
- `AddNodeDialog.tsx:1-136` — POST `/api/org-structure/nodes` real; lekin unit maydonlari yo'q, `"Bo'lim qo'shildi"` hardcoded.
- `EditDialog.tsx:1-144` — PATCH `/api/org-structure/nodes/:id` real; unit maydonlari yo'q.

### 3.2 Yo'q / buzuq / soxta (missing / broken)

| # | Fayl:satr | Muammo | Tasnif |
|---|-----------|--------|--------|
| M1 | `CardDetailDialog.tsx:277-279` | `EPComingSoon` — portret tab haqiqiy forma kerak | missing |
| M2 | `card.controller.ts` | `GET /cards/:id/portret` endpoint YO'Q | missing |
| M3 | `card.service.ts` | `getPortret(id)` / `upsertPortret(id, data)` metodi YO'Q | missing |
| M4 | `card.repository.ts` | `findPortret(id)` / `upsertPortret(id, data)` metodi YO'Q | missing |
| M5 | `card.service.ts` | `RazryadChangedEvent` chiqarilmaydi (EP-ORG-013) | missing |
| M6 | `card.controller.ts` | Razryad o'zgarish audit listener kerak | missing |
| M7 | `RazryadFormDialog.tsx:30-31` | `RazryadLevel` interface + forma state `exam_pass_threshold`/`max_retakes` YO'Q | missing |
| M8 | `RazryadFormDialog.tsx:91-100` | payload ga `examPassThreshold`/`maxRetakes` kirmaydi | missing |
| M9 | `AddNodeDialog.tsx:35-40` | forma state `code`/`qymUz`/`qymRu`/`cameraZoneId`/`telegramGroupId` YO'Q | missing |
| M10 | `AddNodeDialog.tsx:64` | `"Bo'lim qo'shildi"` hardcoded (i18n kerak) | broken |
| M11 | `EditDialog.tsx:34-43` | forma state unit maydonlari YO'Q | missing |
| M12 | `org_departments` jadval | `code`/`qym_uz`/`qym_ru`/`camera_zone_id`/`telegram_group_id` kolonlari YO'Q | DDL GATED |
| M13 | `razryad_levels` jadval | `exam_pass_threshold` (NUMERIC) / `max_retakes` (INTEGER) kolonlari YO'Q | DDL GATED |
| M14 | `card.controller.ts:27` (agar mavjud) | `notImplemented` import lekin ishlatilmagan — o'lik import | broken |

**Eslatma M14 haqida:** `card.controller.ts` ning 1-60 qatorlarida `notImplemented` import ko'rinmadi (import blokida faqat NestJS dekoratorlari + CardService). Lekin yozuvda bu ko'rsatilgan — o'zingiz tekshiring: `grep -n "notImplemented" apps/api/src/modules/org-structure/card.controller.ts`. Agar topilsa — o'chiring.

---

## 4. ISH (qadam-baqadam)

**Tartibi muhim:** 1 → 2 → 3 → 4 → 5 → 6 → 7. Har qadam commit bilan yakunlanadi.

---

### QADAM 1 — card.repository.ts: portret metodlarini qo'shish

**Fayl:** `apps/api/src/modules/org-structure/card.repository.ts`

**Maqsad:** `org_node_portret` jadvalini qayta ishlatib, har karta uchun portret saqlash (`record_type = 'card'`, `record_id = org_functions.id`).

**Avvalgi holat (fayldagi mavjud kod o'zgartirilmaydi):**
Fayl oxirida `listCertificates` dan keyin metodlar tugaydi.

**Qo'shiladigan kod — fayl oxiriga:**

```typescript
  // ─── P05: Per-card portret (reuses org_node_portret keyed by record_type='card') ───

  /**
   * P05 — EP-ORG-Phase5 portret tab.
   * `org_node_portret` already exists (commit 2f353637, node portret).
   * We reuse it with record_type='card' + record_id=org_functions.id
   * so NO new table is needed.
   */
  async findPortret(cardId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT * FROM org_node_portret
      WHERE record_type = 'card' AND record_id = ${cardId}
      LIMIT 1
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * UPSERT per-card portret. `portret_data` is a free-form JSONB blob
   * (goals, strengths, style, notes — HR fills these in).
   * ON CONFLICT: if a unique index on (record_type, record_id) exists → update;
   * otherwise INSERT new row.
   */
  async upsertPortret(cardId: number, portretData: Record<string, unknown>): Promise<Result<Row>> {
    const r = await this.exec(sql`
      INSERT INTO org_node_portret (record_type, record_id, portret_data, created_at, updated_at)
      VALUES ('card', ${cardId}, ${JSON.stringify(portretData)}::jsonb, NOW(), NOW())
      ON CONFLICT (record_type, record_id)
      DO UPDATE SET portret_data = ${JSON.stringify(portretData)}::jsonb, updated_at = NOW()
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] as Row) : Err(r.error);
  }
```

**DB-proof tekshiruv (7-qadamda):**
```sql
SELECT * FROM org_node_portret WHERE record_type = 'card';
```

**MUHIM — `org_node_portret` strukturasini oldin tekshiring:**
```bash
# Docker konteynerida:
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint \
  -c "\d org_node_portret"
```

Agar `org_node_portret` da `record_type` / `record_id` kolonlari YO'Q bo'lsa — TO'XTA, egasiga flag qil. Fayl ko'rsatmalaridagi node portret commit (`2f353637`) orqali yaratilgan jadval strukturasi buni qo'llab-quvvatlashi kerak. Agar `ON CONFLICT` uchun unique index yo'q bo'lsa — `ON CONFLICT DO NOTHING` bilan `INSERT OR REPLACE` pattern ishlatish mumkin, lekin bu holat egasi qarorini talab qiladi.

---

### QADAM 2 — card.service.ts: portret metodlari + RazryadChangedEvent

**Fayl:** `apps/api/src/modules/org-structure/card.service.ts`

**Maqsad (a):** `getPortret` va `upsertPortret` service metodlari.

**Maqsad (b):** `update` metodini o'zgartirish — razryad_level_id o'zgarsa `RazryadChangedEvent` emissiya qiladi (EP-ORG-013).

#### 2a — EventEmitter2 import qo'shish

```typescript
// MAVJUD importlar bilan birga (fayl boshi):
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { CardRepository, CardInput } from './card.repository';

// QO'SHILADI:
import { EventEmitter2 } from '@nestjs/event-emitter';
```

#### 2b — Constructor ga EventEmitter2 inject

**Avvalgi holat (`card.service.ts:16`):**
```typescript
@Injectable()
export class CardService {
  constructor(private readonly repo: CardRepository) {}
```

**Keyin:**
```typescript
@Injectable()
export class CardService {
  constructor(
    private readonly repo: CardRepository,
    private readonly events: EventEmitter2,
  ) {}
```

#### 2c — update metodiga razryad event

**Avvalgi holat (`card.service.ts:33-38`):**
```typescript
  async update(id: number, dto: CardInput): Promise<Result<Row>> {
    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${id} topilmadi`));
    return Ok(r.data);
  }
```

**Keyin:**
```typescript
  async update(id: number, dto: CardInput): Promise<Result<Row>> {
    // Razryad o'zgarishini aniqlash uchun oldingi qiymatni o'qiymiz (EP-ORG-013)
    let prevRazryadLevelId: number | null = null;
    if (dto.razryadLevelId !== undefined) {
      const prev = await this.repo.findById(id);
      if (prev.ok && prev.data) {
        prevRazryadLevelId = (prev.data['razryad_level_id'] as number | null) ?? null;
      }
    }

    const r = await this.repo.update(id, dto);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Karta #${id} topilmadi`));

    // EP-ORG-013: razryad o'zgarishi → HR hujjat + sertifikat event
    if (
      dto.razryadLevelId !== undefined &&
      dto.razryadLevelId !== null &&
      dto.razryadLevelId !== prevRazryadLevelId
    ) {
      this.events.emit('org.card.razryadChanged', {
        cardId: id,
        fromRazryadLevelId: prevRazryadLevelId,
        toRazryadLevelId: dto.razryadLevelId,
        changedAt: new Date().toISOString(),
      });
    }

    return Ok(r.data);
  }
```

**Event payload strukturasi:**
```typescript
// org.card.razryadChanged event
{
  cardId: number;            // org_functions.id
  fromRazryadLevelId: number | null;
  toRazryadLevelId: number;
  changedAt: string;         // ISO8601
}
```

#### 2d — portret metodlari qo'shish

Fayl oxirida `listCertificates` dan keyin (lekin class yakunlanishidan oldin):

```typescript
  // ─── P05: Per-card portret endpoints ───────────────────────────────────────

  /** GET card portret — `org_node_portret` WHERE record_type='card' AND record_id=cardId */
  async getPortret(cardId: number): Promise<Result<Row>> {
    const r = await this.repo.findPortret(cardId);
    if (!r.ok) return Err(r.error);
    // Bo'sh bo'lsa {} qaytaradi (portret to'ldirilmagan, bu normal holat)
    return Ok(r.data ?? {} as Row);
  }

  /** PUT card portret — UPSERT (kirit → saqla → qayta o'qi → ko'rinadi, Q-40) */
  async upsertPortret(cardId: number, portretData: Record<string, unknown>): Promise<Result<Row>> {
    // Karta mavjudligini tekshiramiz
    const card = await this.repo.findById(cardId);
    if (!card.ok) return Err(card.error);
    if (!card.data) return Err(AppErr('NOT_FOUND', `Karta #${cardId} topilmadi`));
    return this.repo.upsertPortret(cardId, portretData);
  }
```

---

### QADAM 3 — card.controller.ts: portret endpoints + notImplemented tozalash

**Fayl:** `apps/api/src/modules/org-structure/card.controller.ts`

#### 3a — notImplemented import tekshiruv va tozalash

```bash
grep -n "notImplemented" apps/api/src/modules/org-structure/card.controller.ts
```

Agar topilsa — import qatorini O'CHIRING. Agar `notImplemented()` chaqiruvi ham bo'lsa — O'CHIRING (Q-46: o'lik kod to'liq o'chiriladi).

#### 3b — Portret Zod schema qo'shish

**Fayl boshiga (mavjud schemalar bilan birga, `CardCreateSchema` dan oldin yoki keyin):**

```typescript
const PortretUpsertSchema = z.object({
  goals:      z.string().max(2000).optional(),
  strengths:  z.string().max(2000).optional(),
  style:      z.string().max(1000).optional(),
  notes:      z.string().max(2000).optional(),
  extraData:  z.record(z.unknown()).optional(),
}).strip();  // unknown maydonlarga ruxsat — JSONB ga to'liq o'tadi
```

#### 3c — Portret endpoint metodlari qo'shish

`certificates` endpointidan KEYIN (lekin class yakunlanishidan oldin):

```typescript
  // ─── P05: Per-card portret (Phase 5, Tab 7) ────────────────────────────────

  @ApiOperation({ summary: 'Get card portret (EP-ORG-Phase5 tab 7)' })
  @ApiResponse({ status: 200, description: 'Portret ma\'lumoti yoki bo\'sh {}' })
  @Get(':id/portret')
  async getPortret(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.getPortret(id));
  }

  @ApiOperation({ summary: 'Upsert card portret (EP-ORG-Phase5 tab 7)' })
  @ApiResponse({ status: 200, description: 'Saqlangan portret' })
  @ApiResponse({ status: 404, description: 'Karta topilmadi' })
  @Put(':id/portret')
  async upsertPortret(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = PortretUpsertSchema.parse(body);
    return unwrapOrThrow(await this.service.upsertPortret(id, dto));
  }
```

**Import qo'shish — faylda `Put` yo'q bo'lsa:**
```typescript
import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
```

---

### QADAM 4 — CardDetailDialog.tsx: Portret tab real formaga almashtirish

**Fayl:** `artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog.tsx`

#### 4a — portret query qo'shish

**Mavjud querylar bilan birga (`:63-65` qatorlar orasiga yoki `certs` dan keyin):**

**Avvalgi holat (`CardDetailDialog.tsx:63-65`):**
```tsx
    const folder    = useQuery<{ completeness?: number; filledSections?: number }>({ queryKey: [`${base}/folder`], enabled });
    const exams     = useQuery<Row[]>({ queryKey: [`/api/ai-exam/by-card/${id}`], enabled });
    const certs     = useQuery<{ items: Row[] }>({ queryKey: [`${base}/certificates`], enabled });
```

**Keyin — `certs` qatoridan KEYIN:**
```tsx
    const portretQ  = useQuery<Record<string, unknown>>({ queryKey: [`${base}/portret`], enabled });
```

#### 4b — portretSaveMutation qo'shish

**Mavjud mutationlar bilan birga (`reviewMutation` dan keyin):**
```tsx
  const portretSaveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("PUT", `${base}/portret`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${base}/portret`] });
      toast({ title: t("portretSaqlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });
```

#### 4c — portret state qo'shish

**`useState` bloklari bilan birga (`:52-54` orasiga):**
```tsx
  const [portretForm, setPortretForm] = useState<Record<string, unknown>>({});
  const [portretDirty, setPortretDirty] = useState(false);
```

#### 4d — portret tab ni EPComingSoon dan REAL FORMAGA almashtirish

> ⚠️ **YO'NALISH ESLATMASI (EP-AI-067):** Egasi vizyon = AI-generated portret (ideal profil),
> inson (HR/direktor) TASDIQLAYDI. Bu forma AI ma'lumotini ko'rsatadi + HR tahrirlab tasdiqlaydi.
> HR qo'ldan bo'sh forma to'ldirmaydi — AI (P36 paketi) portret_data ni PUT orqali yuboradi.
> Hozirgi interim: forma portret_data ni ko'rsatadi (AI yoki qo'l kiritish) + saqlash tugmasi.
> P36 (AI modul) integratsiyasi bu formaga "AI Generate" tugma qo'shadi — bu P05 scope'idan tashqarida.

**Avvalgi holat (`CardDetailDialog.tsx:276-279`):**
```tsx
              {/* 7. Portret — node-keyed (org_departments), no per-card source yet */}
              <TabsContent value="portret" className="mt-4">
                <EPComingSoon title={t("portret")} description={t("portretComingSoon")} />
              </TabsContent>
```

**Keyin (AI-tasdiq shablon — EP-AI-067 vizyon: AI generatsiya → HR tasdiq):**
```tsx
              {/* 7. Portret — per-card AI-generated portret (EP-AI-067)
                  Direction: AI generates ideal profile → HR reviews & approves → stored in org_node_portret
                  This form shows AI-populated data (or HR edit). P36 AI module will add "Generate" button.
                  record_type='card', record_id=org_functions.id (P05 BE endpoint) */}
              <TabsContent value="portret" className="mt-4 space-y-4">
                {portretQ.isLoading ? <EPLoader /> : (
                  <div className="space-y-3">
                    {/* AI status banner — shown when portret_data has ai_generated=true */}
                    {portretQ.data?.ai_generated && (
                      <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-[13px] text-blue-700">
                        {t("portretAiGenerated")} {/* "AI tomonidan yaratilgan — tahrirlang va tasdiqlang" */}
                      </div>
                    )}
                    <div>
                      <label className="text-[13px] font-medium text-muted-foreground">{t("portretMaqsadlar")}</label>
                      <textarea
                        className="w-full mt-1 rounded-md border border-border bg-background p-2 text-[14px] min-h-[80px] resize-y"
                        placeholder={t("portretMaqsadlarPlaceholder")}
                        value={String(portretForm.goals ?? portretQ.data?.goals ?? "")}
                        onChange={(e) => {
                          setPortretForm((f) => ({ ...f, goals: e.target.value }));
                          setPortretDirty(true);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-muted-foreground">{t("portretKuchliTomonlari")}</label>
                      <textarea
                        className="w-full mt-1 rounded-md border border-border bg-background p-2 text-[14px] min-h-[80px] resize-y"
                        placeholder={t("portretKuchliTomonlariPlaceholder")}
                        value={String(portretForm.strengths ?? portretQ.data?.strengths ?? "")}
                        onChange={(e) => {
                          setPortretForm((f) => ({ ...f, strengths: e.target.value }));
                          setPortretDirty(true);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-muted-foreground">{t("portretUslub")}</label>
                      <input
                        type="text"
                        className="w-full mt-1 rounded-md border border-border bg-background p-2 text-[14px]"
                        placeholder={t("portretUslubPlaceholder")}
                        value={String(portretForm.style ?? portretQ.data?.style ?? "")}
                        onChange={(e) => {
                          setPortretForm((f) => ({ ...f, style: e.target.value }));
                          setPortretDirty(true);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium text-muted-foreground">{t("portretIzohlar")}</label>
                      <textarea
                        className="w-full mt-1 rounded-md border border-border bg-background p-2 text-[14px] min-h-[60px] resize-y"
                        placeholder={t("portretIzohlarPlaceholder")}
                        value={String(portretForm.notes ?? portretQ.data?.notes ?? "")}
                        onChange={(e) => {
                          setPortretForm((f) => ({ ...f, notes: e.target.value }));
                          setPortretDirty(true);
                        }}
                      />
                    </div>
                    <div className="flex justify-end pt-2 gap-2">
                      {/* TODO P36: "AI Portret Yaratish" tugmasi AI modul tomonidan qo'shiladi */}
                      <Button
                        onClick={() => {
                          const merged = {
                            goals:        portretForm.goals     ?? portretQ.data?.goals,
                            strengths:    portretForm.strengths ?? portretQ.data?.strengths,
                            style:        portretForm.style     ?? portretQ.data?.style,
                            notes:        portretForm.notes     ?? portretQ.data?.notes,
                            ai_generated: false, // HR qo'l tahriri — AI flag o'chiriladi
                            approved_by_hr: true,
                          };
                          portretSaveMutation.mutate(merged);
                          setPortretDirty(false);
                        }}
                        disabled={!portretDirty || portretSaveMutation.isPending}
                        size="sm"
                      >
                        {portretSaveMutation.isPending ? t("saqlanmoqda") : t("tasdiqlashVaSaqlash")}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
```

**DB-proof (Q-40 / Q-43):** Tab 7 ga o'ting → matn kiriting → "Tasdiqlash va Saqlash" → dialog yoping → dialog qayta oching → Portret tabiga o'ting → matn saqlanganini ko'rasiz.

> **P36 AI integratsiya deferred:** AI portret generatsiya (`POST /api/ai/generate-portret/:cardId`)
> P36 (AI modul) paketiga tegishli. Bu endpoint `PUT /cards/:id/portret` ga
> `{ ...aiData, ai_generated: true }` yuboradi. HR bu ma'lumotni ko'rib, tahrirlaydi va
> "Tasdiqlash va Saqlash" bosadi (`ai_generated: false, approved_by_hr: true`).

---

### QADAM 5 — RazryadFormDialog.tsx: exam maydonlarini qo'shish

**Fayl:** `artifacts/erp-dashboard/src/components/hr/org/RazryadFormDialog.tsx`

#### 5a — RazryadLevel interface ga yangi maydonlar

**Avvalgi holat (`RazryadFormDialog.tsx:20-31`):**
```tsx
export interface RazryadLevel {
  id: number;
  level: number;
  name: string;
  min_requirement?: string | null;
  salary_min?: string | number | null;
  salary_max?: string | number | null;
  exam_type?: string | null;
  certificate?: string | null;
  description?: string | null;
  is_active?: boolean;
}
```

**Keyin:**
```tsx
export interface RazryadLevel {
  id: number;
  level: number;
  name: string;
  min_requirement?: string | null;
  salary_min?: string | number | null;
  salary_max?: string | number | null;
  exam_type?: string | null;
  certificate?: string | null;
  description?: string | null;
  is_active?: boolean;
  // P05 — EP-ORG-055/056 (DDL GATED — DB koloni approved bo'lganda to'liq ishlaydi)
  exam_pass_threshold?: number | null;
  max_retakes?: number | null;
}
```

#### 5b — FormState ga yangi maydonlar

**Avvalgi holat (`RazryadFormDialog.tsx:36-44`):**
```tsx
type FormState = {
  level: string;
  name: string;
  minRequirement: string;
  salaryMin: string;
  salaryMax: string;
  examType: string;
  certificate: string;
  description: string;
};
```

**Keyin:**
```tsx
type FormState = {
  level: string;
  name: string;
  minRequirement: string;
  salaryMin: string;
  salaryMax: string;
  examType: string;
  certificate: string;
  description: string;
  // P05 — EP-ORG-055/056
  examPassThreshold: string;
  maxRetakes: string;
};
```

#### 5c — toForm funksiyasiga yangi maydonlar

**Avvalgi holat (`RazryadFormDialog.tsx:46-57`):**
```tsx
function toForm(r?: RazryadLevel | null): FormState {
  return {
    level: r?.level != null ? String(r.level) : "",
    name: r?.name ?? "",
    minRequirement: r?.min_requirement ?? "",
    salaryMin: r?.salary_min != null ? String(r.salary_min) : "",
    salaryMax: r?.salary_max != null ? String(r.salary_max) : "",
    examType: r?.exam_type ?? "",
    certificate: r?.certificate ?? "",
    description: r?.description ?? "",
  };
}
```

**Keyin:**
```tsx
function toForm(r?: RazryadLevel | null): FormState {
  return {
    level: r?.level != null ? String(r.level) : "",
    name: r?.name ?? "",
    minRequirement: r?.min_requirement ?? "",
    salaryMin: r?.salary_min != null ? String(r.salary_min) : "",
    salaryMax: r?.salary_max != null ? String(r.salary_max) : "",
    examType: r?.exam_type ?? "",
    certificate: r?.certificate ?? "",
    description: r?.description ?? "",
    // P05 — EP-ORG-055/056
    examPassThreshold: r?.exam_pass_threshold != null ? String(r.exam_pass_threshold) : "",
    maxRetakes: r?.max_retakes != null ? String(r.max_retakes) : "",
  };
}
```

#### 5d — payload ga yangi maydonlar

**Avvalgi holat (`RazryadFormDialog.tsx:91-100`):**
```tsx
      const payload: Record<string, unknown> = {
        level: numOrUndef(form.level),
        name: form.name,
        minRequirement: form.minRequirement || undefined,
        salaryMin: numOrUndef(form.salaryMin),
        salaryMax: numOrUndef(form.salaryMax),
        examType: form.examType || undefined,
        certificate: form.certificate || undefined,
        description: form.description || undefined,
      };
```

**Keyin:**
```tsx
      const payload: Record<string, unknown> = {
        level: numOrUndef(form.level),
        name: form.name,
        minRequirement: form.minRequirement || undefined,
        salaryMin: numOrUndef(form.salaryMin),
        salaryMax: numOrUndef(form.salaryMax),
        examType: form.examType || undefined,
        certificate: form.certificate || undefined,
        description: form.description || undefined,
        // P05 — EP-ORG-055/056 (DDL GATED: BE COALESCE ile null yoki qabul qiladi)
        examPassThreshold: numOrUndef(form.examPassThreshold),
        maxRetakes: numOrUndef(form.maxRetakes),
      };
```

#### 5e — Forma JSX ga yangi input fieldlar

**Mavjud `examType` fieldidan KEYIN (`:144-150` orasiga):**

**Avvalgi holat (`RazryadFormDialog.tsx:142-150`):**
```tsx
          <div>
            <Label>{t("imtihonTuri")}</Label>
            <Input value={form.examType} onChange={(e) => set("examType", e.target.value)} />
          </div>
          <div>
            <Label>{t("sertifikat")}</Label>
            <Input value={form.certificate} onChange={(e) => set("certificate", e.target.value)} />
          </div>
```

**Keyin:**
```tsx
          <div>
            <Label>{t("imtihonTuri")}</Label>
            <Input value={form.examType} onChange={(e) => set("examType", e.target.value)} />
          </div>
          {/* EP-ORG-055/056: per-card-type configurable — EGASI QIYMATI KERAK, global default yo'q */}
          <div>
            <Label>{t("imtihonOtishChegarasi")} % (EP-ORG-055)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.examPassThreshold}
              onChange={(e) => set("examPassThreshold", e.target.value)}
              placeholder={t("egasiQiymatiKiritadi")} {/* EGASI QIYMATI KERAK — 70% default TAQIQ */}
            />
          </div>
          <div>
            <Label>{t("qaytaTopshirishMaximum")} (EP-ORG-056)</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={form.maxRetakes}
              onChange={(e) => set("maxRetakes", e.target.value)}
              placeholder={t("egasiQiymatiKiritadi")} {/* EGASI QIYMATI KERAK — 3 default TAQIQ */}
            />
          </div>
          <div>
            <Label>{t("sertifikat")}</Label>
            <Input value={form.certificate} onChange={(e) => set("certificate", e.target.value)} />
          </div>
```

---

### QADAM 6 — AddNodeDialog.tsx + EditDialog.tsx: org-unit maydonlari

#### 6a — AddNodeDialog.tsx

**Fayl:** `artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx`

**Avvalgi holat — forma state (`AddNodeDialog.tsx:35-40`):**
```tsx
  const [form, setForm] = useState({
    name: "",
    nameRu: "",
    nodeType: "department",
    tskp: "",
    parentId: initialParentId || "",
  });
```

**Keyin:**
```tsx
  const [form, setForm] = useState({
    name: "",
    nameRu: "",
    nodeType: "department",
    tskp: "",
    parentId: initialParentId || "",
    // P05 — org-unit maydonlari (DDL GATED, CHAT-TARIXI)
    code: "",
    qymUz: "",
    qymRu: "",
    cameraZoneId: "",
    telegramGroupId: "",
  });
```

**Avvalgi holat — prevParentId reset (`AddNodeDialog.tsx:44-47`):**
```tsx
  if (prevParentId.current !== initialParentId) {
    prevParentId.current = initialParentId;
    setForm((f) => ({ ...f, parentId: initialParentId || "" }));
  }
```

*Bu o'zgartirilmaydi — faqat yangi maydonlar initialParentId reset bilan mos keladi.*

**Avvalgi holat — mutation payload (`AddNodeDialog.tsx:51-61`):**
```tsx
    mutationFn: () => {
      const parentId = form.parentId ? Number(form.parentId) : null;
      const level = parentId ? undefined : 0;
      return apiRequest("POST", "/api/org-structure/nodes", {
        name: form.name,
        nameRu: form.nameRu,
        nodeType: form.nodeType,
        tskp: form.tskp,
        parentId,
        level,
      });
    },
```

**Keyin:**
```tsx
    mutationFn: () => {
      const parentId = form.parentId ? Number(form.parentId) : null;
      const level = parentId ? undefined : 0;
      return apiRequest("POST", "/api/org-structure/nodes", {
        name: form.name,
        nameRu: form.nameRu,
        nodeType: form.nodeType,
        tskp: form.tskp,
        parentId,
        level,
        // P05 — org-unit maydonlari (DDL GATED)
        code: form.code || undefined,
        qymUz: form.qymUz || undefined,
        qymRu: form.qymRu || undefined,
        cameraZoneId: form.cameraZoneId || undefined,
        telegramGroupId: form.telegramGroupId || undefined,
      });
    },
```

**Avvalgi holat — onSuccess hardcoded matn (`AddNodeDialog.tsx:62-68`):**
```tsx
    onSuccess: () => {
      toast({ title: "Bo'lim qo'shildi" });
      onSuccess();
      onClose();
      setForm({ name: "", nameRu: "", nodeType: "department", tskp: "", parentId: "" });
    },
```

**Keyin:**
```tsx
    onSuccess: () => {
      toast({ title: t("bolimQoshildi") });
      onSuccess();
      onClose();
      setForm({ name: "", nameRu: "", nodeType: "department", tskp: "", parentId: "", code: "", qymUz: "", qymRu: "", cameraZoneId: "", telegramGroupId: "" });
    },
```

**Forma JSX ga yangi inputlar — mavjud `parentId` fieldidan KEYIN (`AddNodeDialog.tsx:117-125` dan keyin):**

**Avvalgi holat — forma JSX oxiri (`AddNodeDialog.tsx:117-133`):**
```tsx
          <div>
            <Label>{t("otaNodeId")}</Label>
            <Input
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              placeholder={t("masalan2BoShQoldirsaIldiz")}
              type="number"
            />
          </div>
        </div>
        <DialogFooter>
```

**Keyin:**
```tsx
          <div>
            <Label>{t("otaNodeId")}</Label>
            <Input
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              placeholder={t("masalan2BoShQoldirsaIldiz")}
              type="number"
            />
          </div>
          {/* P05 — org-unit maydonlari (DDL GATED) */}
          <div>
            <Label>{t("birlikKodi")}</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder={t("masalanBOL001")}
              maxLength={50}
            />
          </div>
          <div>
            <Label>{t("qymUz")}</Label>
            <Input
              value={form.qymUz}
              onChange={(e) => setForm((f) => ({ ...f, qymUz: e.target.value }))}
              placeholder={t("asosiyVazifasi")}
            />
          </div>
          <div>
            <Label>{t("qymRu")}</Label>
            <Input
              value={form.qymRu}
              onChange={(e) => setForm((f) => ({ ...f, qymRu: e.target.value }))}
              placeholder={t("ru")}
            />
          </div>
          <div>
            <Label>{t("kameraZona")}</Label>
            <Input
              value={form.cameraZoneId}
              onChange={(e) => setForm((f) => ({ ...f, cameraZoneId: e.target.value }))}
              placeholder={t("masalanKAM001")}
            />
          </div>
          <div>
            <Label>{t("telegramGuruhId")}</Label>
            <Input
              value={form.telegramGroupId}
              onChange={(e) => setForm((f) => ({ ...f, telegramGroupId: e.target.value }))}
              placeholder="-100123456789"
            />
          </div>
        </div>
        <DialogFooter>
```

#### 6b — EditDialog.tsx

**Fayl:** `artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx`

**Avvalgi holat — forma state (`EditDialog.tsx:34-43`):**
```tsx
  const [form, setForm] = useState({
    name: node.name,
    nameRu: node.nameRu || "",
    color: node.color,
    tskp: node.tskp || "",
    tskpRu: node.tskpRu || "",
    description: node.description || "",
    nodeType: node.nodeType,
    headUserId: node.headUserId ?? null,
  });
```

**Keyin (`NodeDetail` type da bu maydonlar bo'lishi uchun — agar `NodeDetail` owned file bo'lmasa, casting ishlatamiz):**
```tsx
  const [form, setForm] = useState({
    name: node.name,
    nameRu: node.nameRu || "",
    color: node.color,
    tskp: node.tskp || "",
    tskpRu: node.tskpRu || "",
    description: node.description || "",
    nodeType: node.nodeType,
    headUserId: node.headUserId ?? null,
    // P05 — org-unit maydonlari (DDL GATED, CHAT-TARIXI)
    code: (node as Record<string, unknown>)['code'] as string ?? "",
    qymUz: (node as Record<string, unknown>)['qym_uz'] as string ?? "",
    qymRu: (node as Record<string, unknown>)['qym_ru'] as string ?? "",
    cameraZoneId: (node as Record<string, unknown>)['camera_zone_id'] as string ?? "",
    telegramGroupId: (node as Record<string, unknown>)['telegram_group_id'] as string ?? "",
  });
```

**Avvalgi holat — mutation payload (`EditDialog.tsx:54-56`):**
```tsx
    mutationFn: () => apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, form),
```

*Bu o'zgartirilmaydi — `form` da yangi maydonlar ham bo'ladi, BE COALESCE bilan qabul qiladi.*

**Forma JSX ga yangi inputlar — mavjud `description` fieldidan KEYIN (`EditDialog.tsx:111-115` dan keyin):**

**Avvalgi holat — description inputdan keyingi blok (`EditDialog.tsx:111-130`):**
```tsx
          <div className="col-span-2">
            <Label>{t("progress.description")}</Label>
            <Input value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label>Bo'lim boshlig'i</Label>
```

**Keyin:**
```tsx
          <div className="col-span-2">
            <Label>{t("progress.description")}</Label>
            <Input value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          {/* P05 — org-unit maydonlari (DDL GATED) */}
          <div>
            <Label>{t("birlikKodi")}</Label>
            <Input value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              maxLength={50} />
          </div>
          <div>
            <Label>{t("qymUz")}</Label>
            <Input value={form.qymUz}
              onChange={(e) => setForm((f) => ({ ...f, qymUz: e.target.value }))} />
          </div>
          <div>
            <Label>{t("qymRu")}</Label>
            <Input value={form.qymRu}
              onChange={(e) => setForm((f) => ({ ...f, qymRu: e.target.value }))} />
          </div>
          <div>
            <Label>{t("kameraZona")}</Label>
            <Input value={form.cameraZoneId}
              onChange={(e) => setForm((f) => ({ ...f, cameraZoneId: e.target.value }))} />
          </div>
          <div>
            <Label>{t("telegramGuruhId")}</Label>
            <Input value={form.telegramGroupId}
              onChange={(e) => setForm((f) => ({ ...f, telegramGroupId: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label>Bo'lim boshlig'i</Label>
```

---

### QADAM 7 — EventEmitter2 module ga ro'yxatdan o'tganligini tekshirish

**Owned file EMAS — faqat tekshiruv, o'zgartirish yo'q:**

```bash
grep -rn "EventEmitterModule" apps/api/src/modules/org-structure/org-structure.module.ts
grep -rn "EventEmitter2\|EventEmitterModule" apps/api/src/app.module.ts | head -10
```

Agar `EventEmitter2` DI ga ulangan bo'lmasa (app.module.ts da `EventEmitterModule.forRoot()` yo'q) — TO'XTA, egasiga flag qil. Hozir qo'shish bu faylga teg — owned file emas (Q-23). `EventEmitter2` allaqachon app.module.ts da ro'yxatdan o'tgan bo'lsa — davom eting.

---

## 5. DDL (GATED)

**Fayl yoziladi lekin ISHGA TUSHIRILMAYDI. `-- APPROVED:` placeholder mavjud.**

```sql
-- FILE: apps/api/src/shared/db/migrations/p05-org-unit-fields-razryad-exam.sql
-- GATED — APPROVED: <OWNER_NAME> <DATE> placeholder qo'yilsin, keyin run qiling
-- P05 DDL: org_departments unit maydonlari + razryad_levels exam konfiguratsiya

-- ═══════════════════════════════════════════════════════════════════════════════
-- A. org_departments — org-unit maydonlari (CHAT-TARIXI: Bo'lim→Sex→Uskuna→Ishchi)
-- APPROVED: _________________________ (egasi to'ldiradi)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS code              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS qym_uz            TEXT,
  ADD COLUMN IF NOT EXISTS qym_ru            TEXT,
  ADD COLUMN IF NOT EXISTS camera_zone_id    TEXT,
  ADD COLUMN IF NOT EXISTS telegram_group_id TEXT;

COMMENT ON COLUMN org_departments.code              IS 'Ichki birlik kodi (masalan BOL-001)';
COMMENT ON COLUMN org_departments.qym_uz            IS 'ЦКП/QYM matni — o''zbek tili (CHAT-TARIXI §2.3)';
COMMENT ON COLUMN org_departments.qym_ru            IS 'ЦКП/QYM matni — rus tili (CHAT-TARIXI §2.3)';
COMMENT ON COLUMN org_departments.camera_zone_id    IS 'AI kamera zona identifikatori';
COMMENT ON COLUMN org_departments.telegram_group_id IS 'Telegram guruh ID (-100XXXXXXXXX format)';

-- ═══════════════════════════════════════════════════════════════════════════════
-- B. razryad_levels — imtihon konfiguratsiya (EP-ORG-055/056)
-- APPROVED: _________________________ (egasi to'ldiradi)
-- ⚠️ EGASI QIYMATI KERAK: DEFAULT NULL (hardcoded 70%/3 TAQIQ — egasi "default yo'q" degan,
--    00-INTERVYU-MOSLIK.md §1). Har razryad darajasi uchun egasi qiymat belgilaydi.
--    Migration run qilinganidan KEYIN egasi UPDATE bilan har yozuvga qiymat kiritadi:
--      UPDATE razryad_levels SET exam_pass_threshold = <foiz>, max_retakes = <son> WHERE level = <N>;
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE razryad_levels
  ADD COLUMN IF NOT EXISTS exam_pass_threshold NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_retakes         INTEGER      DEFAULT NULL;

COMMENT ON COLUMN razryad_levels.exam_pass_threshold IS 'Imtihon o''tish minimal foizi (EP-ORG-055). NULL = egasi hali kiritgani yo''q. Per-card-type master-data.';
COMMENT ON COLUMN razryad_levels.max_retakes         IS 'Qayta topshirish maksimumi (EP-ORG-056). NULL = egasi hali kiritgani yo''q. Per-card-type master-data.';
```

**Bu migration faylni** `apps/api/src/shared/db/migrations/p05-org-unit-fields-razryad-exam.sql` ga YOZING lekin:
- `pnpm db:migrate` yoki psql bilan ISHGA TUSHIRMANG
- Egasidan `-- APPROVED:` qatorni to'ldirishi va alohida run qilishini so'rang

---

## 6. QABUL MEZONI

### Funksional tekshiruv jadvali

| # | Test | Kutilgan natija |
|---|------|----------------|
| F1 | `GET /api/org-structure/cards/1/portret` | `{}` yoki portret JSON (200) |
| F2 | `PUT /api/org-structure/cards/1/portret` `{"goals":"test maqsad"}` | 200 + portret yozuvi |
| F3 | `GET /api/org-structure/cards/1/portret` (F2 dan keyin) | `goals: "test maqsad"` ko'rinadi |
| F4 | `PATCH /api/org-structure/cards/1` `{"razryadLevelId": 2}` (avval 1 edi) | 200 + `domain_events` jadvalida yozuv (agar EventBus wired bo'lsa) |
| F5 | FE Portret tab ochish | EPComingSoon ko'rinmaydi; forma maydonlari ko'rinadi |
| F6 | FE Portret tab — matn kiriting + Saqlash → dialog yopin → qayta oching | Kiritilgan matn saqlanadi |
| F7 | RazryadFormDialog — `exam_pass_threshold` va `max_retakes` maydonlari | Input fieldlar ko'rinadi |
| F8 | AddNodeDialog — unit maydonlari | `code`/`qymUz`/`qymRu` inputlari ko'rinadi |
| F9 | EditDialog — unit maydonlari | `code`/`qymUz`/`qymRu` inputlari ko'rinadi |
| F10 | `notImplemented` import | Topilmaydi (`grep` bo'sh qaytadi) |

### Texnik tekshiruv

| # | Test | Kutilgan natija |
|---|------|----------------|
| T1 | `cd Uzbek-Language-Module && npx tsc -p apps/api/tsconfig.json --noEmit 2>&1 \| tail -20` | 0 xato |
| T2 | `cd Uzbek-Language-Module && npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit 2>&1 \| tail -20` | 0 xato |
| T3 | `bash scripts/reviewer-result-pattern.sh 2>&1 \| grep FAIL` | FAIL: 0 |
| T4 | `bash scripts/reviewer-as-unknown.sh 2>&1 \| grep FAIL` | FAIL soni ortmasin |
| T5 | `bash scripts/reviewer-jwt-guard.sh 2>&1 \| grep FAIL` | FAIL: 0 |

### Golden-thread no-regress

```bash
# Mavjud endpoints hamon ishlaydi
curl -s -o /dev/null -w "%{http_code}" http://localhost:3030/api/org-structure/cards
# → 200

curl -s -o /dev/null -w "%{http_code}" http://localhost:3030/api/org-structure/cards/1
# → 200 yoki 404 (ID mavjudligiga qarab)

curl -s -o /dev/null -w "%{http_code}" http://localhost:3030/api/org-structure/razryad-levels
# → 200
```

---

## 7. SELF-VERIFY

### 7.1 BE typecheck

```bash
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
npx tsc -p apps/api/tsconfig.json --noEmit 2>&1 | tail -30
```

Natija: `0 errors` yoki faqat oldindan mavjud bo'lgan xatolar (yangi xato bo'lmasligi kerak).

### 7.2 FE typecheck

```bash
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit 2>&1 | tail -30
```

Natija: `0 errors` yoki oldindan mavjud.

### 7.3 notImplemented tozaligi

```bash
grep -n "notImplemented" apps/api/src/modules/org-structure/card.controller.ts
```

Natija: bo'sh (hech narsa topilmaydi).

### 7.4 org_node_portret strukturasi tekshiruv (oldin)

```bash
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint \
  -c "\d org_node_portret" 2>&1
```

`record_type` va `record_id` kolonlari ko'rinishi kerak.

### 7.5 Portret DB-proof (asosiy Q-40 verify)

```bash
# 1. Portret upsert
curl -s -X PUT http://localhost:3030/api/org-structure/cards/1/portret \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"goals":"P05 test maqsad","strengths":"Test kuchli tomonlar"}' | jq .

# 2. Qayta o'qish (db-proof)
curl -s http://localhost:3030/api/org-structure/cards/1/portret \
  -H "Authorization: Bearer <TOKEN>" | jq .goals

# Natija: "P05 test maqsad"
```

Agar `org_node_portret` da `record_type` yo'q bo'lsa — `findPortret`/`upsertPortret` metodlari SQL xato chiqaradi; bu holat logdan ko'rinadi va egasiga reportlanadi.

### 7.6 RazryadChangedEvent tekshiruv

```bash
# Razryad o'zgartirish (agar cards/1 mavjud bo'lsa, razryad_level_id turli bo'lsin)
curl -s -X PATCH http://localhost:3030/api/org-structure/cards/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"razryadLevelId": 2}' | jq .

# domain_events jadvalida yozuv tekshiruv (agar EventEmitter2 wired + listener bo'lsa)
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint \
  -c "SELECT * FROM domain_events ORDER BY created_at DESC LIMIT 5;" 2>&1
```

Agar `domain_events` jadvalida `org.card.razryadChanged` yozuvi ko'rinmasa — bu Event listener yo'qligini ko'rsatadi (EventEmitter2 emit qilindi lekin consumer yo'q). Bu qabul qilinadi — emit qilish mavjudligi `card.service.ts` da tasdiqlanadi, listener alohida ticket.

### 7.7 Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh 2>&1 | grep -E "FAIL|PASS" | tail -5
bash scripts/reviewer-jwt-guard.sh 2>&1 | grep -E "FAIL|PASS" | tail -5
```

### 7.8 FE portret tab manual tekshiruv

1. FE ni ishga tushiring: `pnpm --filter erp-dashboard run dev`
2. HR → Org Tuzilma → Kartalar tab → biror kartani "Ko'rish" tugmasi
3. "Portret" tabiga o'ting
4. `EPComingSoon` EMAS — forma maydonlari ko'rinadi
5. "Maqsadlar" maydoniga matn kiriting
6. "Saqlash" tugmasi
7. Dialog yopin → qayta oching → Portret tabiga o'ting → matn saqlanganini tasdiqlang

---

## 8. COMMIT

**Tartib muhim — har mantiqiy guruh alohida commit.**

### Commit 1 — BE portret endpoints + RazryadChangedEvent

```bash
git add apps/api/src/modules/org-structure/card.repository.ts
git add apps/api/src/modules/org-structure/card.service.ts
git add apps/api/src/modules/org-structure/card.controller.ts

git commit -m "feat(org): P05 per-card portret BE endpoints + RazryadChangedEvent (EP-ORG-013/Phase5)

- card.repository: findPortret/upsertPortret reusing org_node_portret (record_type=card)
- card.service: getPortret/upsertPortret + RazryadChangedEvent emit on razryad change
- card.controller: GET+PUT :id/portret endpoints; remove stale notImplemented import (if any)
- EventEmitter2 injected into CardService constructor

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 2 — FE portret tab + exam maydonlari + unit maydonlari

```bash
git add artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog.tsx
git add artifacts/erp-dashboard/src/components/hr/org/RazryadFormDialog.tsx
git add artifacts/erp-dashboard/src/components/hr/org/AddNodeDialog.tsx
git add artifacts/erp-dashboard/src/components/hr/orgnode/EditDialog.tsx

git commit -m "feat(org-fe): P05 Portret tab real form; razryad exam fields; org-unit fields (DDL GATED)

- CardDetailDialog: tab 7 EPComingSoon → real portret form (goals/strengths/style/notes) with PUT save
- RazryadFormDialog: exam_pass_threshold + max_retakes fields (EP-ORG-055/056, DDL GATED)
- AddNodeDialog: code/qymUz/qymRu/cameraZoneId/telegramGroupId fields + i18n hardcoded fix
- EditDialog: same org-unit fields added to edit form

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 3 — DDL migration (GATED)

```bash
git add apps/api/src/shared/db/migrations/p05-org-unit-fields-razryad-exam.sql

git commit -m "chore(db): P05 GATED migration - org_departments unit fields + razryad exam config (awaiting owner APPROVED)

- org_departments: +code +qym_uz +qym_ru +camera_zone_id +telegram_group_id (CHAT-TARIXI)
- razryad_levels: +exam_pass_threshold +max_retakes (EP-ORG-055/056)
- NOT RUN — requires owner APPROVED: comment in file before execution

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## HOLAT HISOBOTI SHABLONI (egaga)

Har commit dan keyin quyidagi formatda egaga xabar bering:

```
✅ P05 COMMIT-N bajarildi: <hash>

BAJARILDI:
- [x] card.repository: findPortret/upsertPortret
- [x] card.service: getPortret/upsertPortret + RazryadChangedEvent
- [x] card.controller: GET+PUT /portret
- [x] CardDetailDialog: Portret tab real forma
- [x] RazryadFormDialog: exam_pass_threshold/max_retakes maydonlari
- [x] AddNodeDialog: org-unit maydonlari + i18n fix
- [x] EditDialog: org-unit maydonlari
- [x] GATED migration fayli yozildi (ISHGA TUSHIRILMADI)

DB-PROOF:
- PUT /api/org-structure/cards/1/portret → 200
- GET /api/org-structure/cards/1/portret → goals ko'rinadi ✅

DEFERRED (egasi qarorini kutadi):
- org_departments DDL (unit fields) — APPROVED: kerak
- razryad_levels DDL (exam config) — APPROVED: kerak
- workflow_rules jadval — HARD BOUNDARY (owner schema talab qiladi)
- RazryadChangedEvent listener (HR hujjat/sertifikat yaratish) — alohida ticket

BE tsc: 0 ✅
FE tsc: 0 ✅
```

---

## QO'SHIMCHA ESLATMALAR

### EP-ORG-041 (Org-kaskad) — EGASI QARORI KERAK, bu paketda EMAS

EP-ORG-041: "Yangi bo'lim/transfer → avto-kaskad: POS-ombor, RBAC, adaptatsiya, shartnoma."
Bu talabni P04/P05 qoplamagani 00-INTERVYU-MOSLIK.md da "butunlay yo'q" deb belgilangan.
FE tomonda: AddNodeDialog'da "Bo'lim qo'shildi" toastdan KEYIN qaysi kaskad-harakatlar ishga
tushishini egasi belgilashi kerak. Bu P05 owned-file'larida hech narsa yozilmaydi —
egasi quyidagi qarorlarni berguncha:
  - POS-Monitor ombor avto-create qilish uchun qaysi WMS endpoint chaqiriladi?
  - RBAC provisioning qaysi auth hook bilan bog'lanadi?
  - Kaskad sinxron (request ichida) yoki asinxron (event orqali) bo'ladi?
Ushbu qarorlar olingandan KEYIN alohida EP-ORG-041-kaskad paketi yoziladi.

### EP-ORG-102 (O'zbekcha daraja-kodi) — EGASI QARORI KERAK

EP-ORG-102 (OCHIQ-JAVOBLAR): "Bo'lim/daraja kodi kartada belgilansin, O'ZBEK TILIDA."
Hozir AddNodeDialog/EditDialog'dagi `code` maydoni free-text (hech qanday format cheki yo'q).
Egasi o'zbekcha daraja-kod ro'yxatini bergandan keyin:
  - `code` maydoniga helper-text qo'shiladi (format: BO, BO-01, SEX-3A va h.k.)
  - Ixtiyoriy: dropdown yoki prefix hint
Bu P05 owned-file'larida faqat `code` input mavjud — format enforcement egasi qarorisiz qo'shilmaydi.

### org_node_portret tuzilmasini tekshirmasdan YOZMANG

`findPortret` / `upsertPortret` metodlari `record_type` va `record_id` kolonlarini kutadi. Agar bu jadval boshqacha tuzilmaga ega bo'lsa — SQL xato chiqaradi. 7.4-qadamdagi `\d org_node_portret` buyrug'ini BIRINCHI ishga tushurib tekshiring.

### workflow_rules — HARD BOUNDARY

`workflow_rules` jadvali hozir mavjud emas. Bu jadval egasi sxemasini belgilashi kerak (from_dept_id, to_dept_id, action_type, routing_order, is_active). Bu P05 scope dan TASHQARIDA — bu direktivada bu jadvalga tegmang.

### RazryadChangedEvent + EventEmitter2

`EventEmitter2` NestJS `@nestjs/event-emitter` paketida. Agar `app.module.ts` da `EventEmitterModule.forRoot()` allaqachon bo'lsa — DI inject to'g'ridan ishlaydi. Agar yo'q bo'lsa — `app.module.ts` owned file emas (Q-23), shu sababli egasiga flaglang.

### i18n kalitlar

Quyidagi yangi `t()` kalitlari ishlatiladi. Agar `common.json` da mavjud bo'lmasa — UZ/RU fayllarga qo'shing (lekin `i18n.json` fayllari owned file emas — Q-23). Agar i18n fayllari ko'rsatilgan owned file ro'yxatida yo'q bo'lsa, `t("key") || "Uzbekcha matn"` fallback bilan yozing:

| Kalit | UZ | RU |
|-------|----|----|
| `portretMaqsadlar` | Maqsadlar | Цели |
| `portretKuchliTomonlari` | Kuchli tomonlari | Сильные стороны |
| `portretUslub` | Ish uslubi | Стиль работы |
| `portretIzohlar` | Izohlar | Примечания |
| `portretSaqlandi` | Portret saqlandi | Портрет сохранён |
| `imtihonOtishChegarasi` | Imtihon o'tish chegarasi | Порог прохождения |
| `qaytaTopshirishMaximum` | Qayta topshirish maksimumi | Максимум пересдач |
| `birlikKodi` | Birlik kodi | Код подразделения |
| `qymUz` | QYM (o'zbekcha) | ЦКП (узбекский) |
| `qymRu` | QYM (ruscha) | ЦКП (русский) |
| `kameraZona` | Kamera zona ID | ID зоны камеры |
| `telegramGuruhId` | Telegram guruh ID | ID группы Telegram |
| `bolimQoshildi` | Bo'lim qo'shildi | Подразделение добавлено |
| `portretAiGenerated` | AI tomonidan yaratilgan — tahrirlang va tasdiqlang | Сгенерировано ИИ — отредактируйте и подтвердите |
| `tasdiqlashVaSaqlash` | Tasdiqlash va Saqlash | Подтвердить и Сохранить |
| `egasiQiymatiKiritadi` | Egasi kiritadi | Вводит владелец |

---

*Direktiva yakunlandi — P05 · Wave 2 · Q-47 talabiga muvofiq ≥1000 qator.*
