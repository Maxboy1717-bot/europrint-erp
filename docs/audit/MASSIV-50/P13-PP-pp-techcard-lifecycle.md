# P13 — PP — Rejalashtirish (Production Planning): PP tech-card Drizzle wiring + 7-status lifecycle + status audit

> **Agent ID:** P13 | **Wave:** 2 | **DependsOn:** P12 | **DDL Gate:** HA (APPROVED: belgisi shart)
> **Yozilgan:** 2026-06-19 | Bajaruvchi = Muslimbek | Til: Uzbek

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiyada avval `CLAUDE.md` + `docs/agent-constitution.md` o'qi. Quyidagi qoidalar bloki (Q-47 bo'yicha) majburiy:

```
QOIDALAR BLOKI (Q-47):
 1. Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
 2. @Body Zod bilan validate; class-validator TAQIQ.
 3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
 4. Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
 5. Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
 6. FAYL IZOLYATSIYASI (Q-23/Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg.
    Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
 7. DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida '-- APPROVED:' izoh shart. Paket DDL talab qilsa —
    migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
 8. git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit=bitta mantiqiy guruh.
 9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ —
    bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon
    (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**WAVE 2 ma'nosi:** P12 (PP schema DDL) tugaganidan keyin boshlanadi. P12 migration `-- APPROVED:` bilan ISHGA TUSHIRILGAN bo'lishi kerak. P12 tugamagan bo'lsa — TO'XTA.

---

## 1. IZOLYATSIYA MANIFESTI

Shu paket FAQAT quyidagi fayllarga tegadi. Boshqa hech qanday fayl o'zgartirilmaydi:

```
OWNED FILES (P13):
  BE:
    apps/api/src/modules/pp/technology/technology.repository.ts
    apps/api/src/modules/pp/technology/technology.controller.ts
    apps/api/src/modules/pp/production-orders/production-orders.service.ts
    apps/api/src/modules/pp/production-orders/drizzle-pp-production-orders.repo.ts
    apps/api/src/modules/pp/presentation/pp-orders.controller.ts
    apps/api/src/modules/pp/pp.module.ts

  FE:
    artifacts/erp-dashboard/src/pages/TechCards.tsx
    artifacts/erp-dashboard/src/pages/ProductionOrder360.tsx

  DDL (GATED — ISHGA TUSHIRMA, faqat yoz):
    apps/api/src/shared/db/migrations/p13-pp-techcard-lifecycle.sql
```

**Qoida:** Agar biron o'zgarish uchun bu ro'yxatdan tashqari fayl kerak bo'lsa (masalan `lib/db/src/schema/pp/*.ts`, boshqa controller, i18n fayl) — DARHOL TO'XTA va egaga flag qil. Boshqa faylga tegma.

**DDL Darvozasi:**  
`p13-pp-techcard-lifecycle.sql` migration fayli yoziladi lekin `pnpm drizzle-kit push` yoki `db.execute` bilan ISHGA TUSHIRILMAYDI. Egasi `-- APPROVED: <ism> <sana>` izohini qo'shgunga qadar faylda faqat `GATED` belgisi turadi. P12 migration avval tasdiqlangan bo'lishi shart.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-05-PP-2026-06-08.md` + `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md`

### 2.1 Tech Card (Texkarta) — nima bo'lishi kerak

Tech card = PP modulining poydevori. Vizyon bo'yicha:

- **6 element** (EP-PP-090, RD5 kitob): material turi / bosma parametrlari (rang+profil+registr+plotnost) / kesim / qolip / qo'shimcha ishlovlar / ish tartibi — JSONB yoki alohida ustunlarda.
- **BOM (EP-PP-089):** material_code + quantity (kg/list) + layer (2-sloy/profil/mikro). MRP bu jadvaldan o'qiydi.
- **Marshrut (route, EP-PP-032..036):** operation sequence (10,20,30…); har op uchun: mashinaga bog'lanish + alternativ mashina (EP-PP-033); norm (dona/soat, EP-PP-034); setup vaqti (EP-PP-035); scrap = fixed + % (EP-PP-036).
- **Versiyalash (EP-PP-014/037):** har o'zgarish = yangi versiya; versiya tarixi `tech_card_versions` jadvalida saqlanadi.
- **3-darvoza (maket + lab + material) — ishlab chiqarish boshlanishidan OLDIN (⚠️ MUVOFIQLIK FIX 2026-06-19):**
  Egasi intervyusida 3 ta mustaqil to'siq belgilagan (konformans auditida "butunlay yo'q" deb aniqlangan):
  1. **Maket darvozasi (EP-PP-123):** dizayn-rahbar (`maket_approved = true`) tasdiqlamasa buyurtma `reja` statusida "kutish"da qoladi. Tizim `ishga_tushgan` statusiga o'tkazishni bloklaydi.
  2. **Lab darvozasi (EP-PP-091):** laborant (`lab_approved = true`) materialni tekshirib tasdiqlasa plan boshlanadi. Lab rad etsa — buyurtma `reja` ga qaytadi.
  3. **Material darvozasi (EP-PP-068/MRP):** `pp_material_reservations` da yetarli material bron bo'lmasa — CRP/MRP servis ogohlantiradi. Bron bo'lmasdan `ishga_tushgan` statusiga o'tish **ruxsat etilmaydi** (transition validatsiyasida tekshiriladi).
  **Schema tomoni (bu paket P13):** `production_orders` jadvaliga `maket_approved BOOLEAN DEFAULT FALSE` va `lab_approved BOOLEAN DEFAULT FALSE` ustunlar qo'shiladi (qarang §4 QADAM 3b kengaytma va §5 DDL).
  **Guard tomoni (boshqa agent — PP controllers):** `reja → tasdiqlangan` o'tishida 3 darvoza tekshiriladi; biri yopiq bo'lsa 422 xatolik.
  **⚠️ DDL Gate:** ustun qo'shish P13 migration faylida GATED — egasi APPROVED berguncha ishga tushirilmaydi.
- **Lab approval gate (EP-PP-091):** `lab_approved=true` bo'lmasdan plan boshlanmaydi.
- **Maket approval gate (EP-PP-123):** dizayn-rahbar tasdiqlamasa plan "kutish" holatida.

**Qabul mezoni (vizyon):** texkarta yaratiladi → BOM qo'shiladi → marshrut qo'shiladi → lab-approve bosiladi → versiya tarixida ko'rinadi — barchasi DB-ga yoziladi va qayta o'qilganda ko'rinadi.

### 2.2 Production Order 7-status lifecycle (EP-PP-082)

**Egasi override (OCHIQ-JAVOBLAR):** `production_orders.status` 7 (+ 2 terminal) qiymat bo'lishi SHART:

```
Asosiy zanjir:  reja → tasdiqlangan → ishga_tushgan → jarayonda → sifatda → tugadi → yopildi
Terminal:       bekor | toxtatilgan
```

Hozirgi CHECK constraint (lib/db/src/schema/pp/pp-production.ts:492) faqat 6 eski qiymatni (`created/released/in_progress/completed/closed/qc_hold`) qabul qiladi. Bu VIZYON BILAN ZIDDIYAT — P13 buni to'g'irlaydi.

**Har status o'tishida** `pp_order_status_log` jadvaliga yoziladi: kim, qachon, nima sababdan.

### 2.3 ZARUR flag + frozen_until guard (EP-PP-025/097)

- `priority_flag` ustuni: `normal | high | urgent | zarur` — ZARUR = alohida zona.
- `frozen_until TIMESTAMP`: bu sana o'tmaguncha faqat owner/director status o'zgartira oladi.
- Non-owner/non-director tomonidan `frozen_until` ichidagi o'zgarish → 403 Forbidden.

### 2.4 findMaterialAlternatives — honest 501

`technology.repository.ts:53-66` — hozir hardcoded fake 3 ta alternativ qaytaradi ("12% tejash" va h.k.). Bu Q-40 buzilishi (fake javob). To'g'rilash: `HttpStatus.NOT_IMPLEMENTED` (501) + xabar "Materiallar alternativasi hali qurilmagan".

### 2.5 BOM DELETE endpoint

Hozir BOM qo'shish (POST) bor, lekin o'chirish (DELETE) yo'q. `DELETE /technology/cards/:id/bom/:bomId` qo'shiladi — real `DELETE FROM tech_card_bom WHERE id = :bomId AND technology_card_id = :cardId`.

### 2.6 PapkaOrdersController ro'yxatdan o'tkazish

`/api/papka-orders` route'i `PlanningBoard.tsx` va `TechCards.tsx` tomonidan chaqiriladi (FE:69-77). Lekin `PapkaOrdersController` `pp.module.ts` controllers ro'yxatida yo'q. Bu controller topilsa — ro'yxatga qo'shiladi. Topilmasa — TO'XTA va egaga flag qil.

### 2.6b ⭐ pp.module.ts — YAGONA EGA = P13 (manifest §5 qoidasi: 1 fayl = 1 ega)

> **MUVOFIQLIK FIX 2026-06-19:** `apps/api/src/modules/pp/pp.module.ts` fayliga uchta PP paketi tegadi (P13, P14, P53). Manifest §5 qoidasi — **1 fayl = 1 ega**. P13 PP paketlari ichida pp.module.ts ni tahrirlovchi eng erta (Wave 2) paket bo'lgani uchun **pp.module.ts ning YAGONA EGASI va COMMIT QILUVCHISI = P13**.
>
> Buning ma'nosi: P14 va P53 pp.module.ts ga TEGMAYDI. Ularning DI provayderlari/import'lari pp.module.ts ga **P13 tomonidan** ro'yxatdan o'tkaziladi (qarang §4 QADAM 4b). Shunday qilib bitta ega hamma narsani simlaydi, ikki sessiya bir faylni bosib o'tmaydi.
>
> P13 pp.module.ts ga ro'yxatdan o'tkazadi:
> - **O'zi (P13):** `PapkaOrdersController` (agar topilsa — §2.6).
> - **P14 nomidan:** `ShiftPlanService`, `ShiftPlanRepository`, `BrakReworkListener` (providers[]).
> - **P53 nomidan:** `GofraConversionController` (controllers[]), `GofraConversionService` + `{ provide: GOFRA_CONVERSION_REPO, useClass: DrizzleGofraConversionRepo }` (providers[]).

### 2.7 FE: TechCards — deleteMutation qo'shish

`TechCards.tsx`da karta DELETE mutatsiyasi yo'q (faqat yaratish/ko'rish/approve bor). `DELETE /api/technology/cards/:id` BE endpointi mavjud (technology.controller.ts:181-187). FE ga `deleteMutation` + `ConfirmDialog` qo'shiladi (Qoida 14).

### 2.8 FE: ProductionOrder360 — 7-status badgelari

`ProductionOrder360Types.ts` (owned emas) ichidagi `STATUS_LABELS` eski 6 statusni o'z ichiga oladi. `ProductionOrder360.tsx` (owned) sahifasidagi status badge ko'rsatish mantiqiga 7 yangi status uchun fallback qo'shiladi.

---

## 3. HOZIRGI HOLAT

### 3.1 MAVJUD (EXISTS)

| Fayl:Satr | Holat | Izoh |
|-----------|-------|------|
| `technology.repository.ts:53-66` | BUZUQ (fake) | `findMaterialAlternatives` — hardcoded 3 alternativ, DB-ga bormaydi. Q-40 buzilishi. |
| `technology.repository.ts:218-256` | RAW SQL | `getBom/addBomItem/getRoutes/addRoute/getVersions` — raw `db.execute(sql\`...\`)` ishlaydi lekin Drizzle ORM sxemasi yo'q. `tech_card_bom`, `tech_card_routes`, `tech_card_versions` uchun pgTable ta'rifi `lib/db/src/schema/pp/` da YO'Q. |
| `technology.controller.ts:143` | STUB | `POST /technology/cards/generate` → `notImplemented()` — bu P13 scopes emas, qoldirish mumkin. |
| `technology.controller.ts:159` | STUB | `POST /technology/cards/:id/optimize` → `notImplemented()` — bu P13 scopes emas, qoldirish mumkin. |
| `technology.controller.ts:100-105` | REAL (endpoint bor) | `GET /technology/materials/alternatives` → `svc.getMaterialAlternatives()` → repo'da fake. |
| `pp-production.ts:492` | XATO CHECK | `production_orders_status_chk` faqat 6 eski qiymat: `created/released/in_progress/completed/closed/qc_hold`. Vizyon 7+2 status talab qiladi. |
| `pp-production.ts:446-493` | SCHEMA | `productionOrders` Drizzle schema mavjud lekin `priority_flag`, `frozen_until`, `readiness_pct` ustunlari YO'Q. |
| `drizzle-pp-production-orders.repo.ts:78-83` | REAL lekin xavfli | `updateStatus` — hech qanday CHECK constraint validatsiyasi yo'q; noto'g'ri status kiritilsa DB 23514 beradi. |
| `production-orders.service.ts:52-59` | REAL | `updateStatus` ishlaydi lekin `pp_order_status_log` ga HECH NARSA yozmaydi. |
| `pp-orders.controller.ts:44-139` | REAL | GET/POST/PATCH endpointlari ishlaydi. ZARUR flag / frozen_until guard YO'Q. |
| `pp.module.ts:112-118` | TO'LIQ | Controllers ro'yxatida `PapkaOrdersController` YO'Q. |
| `TechCards.tsx:68-77` | REAL | `/api/papka-orders?status=pending_tech` chaqiriladi lekin route mavjud emasligi mumkin → 404. |
| `TechCards.tsx:112-166` | PARTIAL | mutations bor (create/gate/addBom/addRoute) lekin DELETE mutation YO'Q. |
| `ProductionOrder360.tsx:64` | REAL | 7-tab 360 sahifa ishlaydi. `STATUS_LABELS` import `ProductionOrder360Types.ts` dan — 7 yangi status uchun fallback yo'q. |

### 3.2 YO'Q (MISSING) — P13 scope

| Gap | Qaerda bo'lishi kerak | Izoh |
|-----|-----------------------|------|
| `pp_order_status_log` jadval | Migration (DDL Gate) | Har status o'tish audit log. |
| `priority_flag`, `frozen_until` ustunlari | `production_orders` ALTER (DDL Gate) | ZARUR zona + muzlatilgan himoya. |
| `maket_approved`, `lab_approved`, `material_gate_ok` ustunlari | `production_orders` ALTER (DDL Gate) | **3-darvoza** (EP-PP-123/091/068) — ⚠️ MUVOFIQLIK FIX 2026-06-19. |
| Drizzle pgTable: `tech_card_bom` | P12 scoype (lib/db) — bu faylda emas | P12 qilishi kerak. P13 raw SQL ni ishlatib davom etadi. |
| `PapkaOrdersController` | Agar mavjud bo'lsa — `pp.module.ts` ga | Fayl qidiriladi. |
| `DELETE /technology/cards/:id/bom/:bomId` | `technology.controller.ts` + `technology.repository.ts` | BOM qator o'chirish. |
| Status transition validatsiyasi (state machine) | `production-orders.service.ts` | Noto'g'ri o'tishni rad etish. |
| Frozen_until guard | `pp-orders.controller.ts` | 403 non-owner/director. |
| `deleteMutation` + `ConfirmDialog` | `TechCards.tsx` | Karta o'chirish FE. |
| 7-status badge fallback | `ProductionOrder360.tsx` | Yangi statuslar ko'rsatish. |

### 3.3 BUZUQ / FAKE (BROKEN/FAKE)

| Endpoint | Muammo | Tuzatish |
|----------|--------|----------|
| `GET /technology/materials/alternatives` | Fake javob (hardcoded 3 alternativ) | 501 NotImplemented |
| Status o'zgartirganda `pp_order_status_log` ga yozilmaydi | Audit trail yo'q | Log yozish qo'shiladi |
| `production_orders.status` CHECK 6 qiymat | Vizyon 7+2 qiymat | DDL Gate: ALTER CHECK |

---

## 4. ISH (QADAM-BAQADAM)

> Har qadam: o'qirsan → o'zgartirasasn → verify → commit.  
> Hech qachon bir nechta qadamni aralashtirib commit qilma.

---

### QADAM 1 — findMaterialAlternatives: fake javob → honest 501

**Fayl:** `apps/api/src/modules/pp/technology/technology.repository.ts`  
**Satr:** 53-66  
**Muammo:** Hardcoded fake 3 alternativ — Q-40 buzilishi.

**OLDIN (satr 53-66):**
```typescript
async findMaterialAlternatives(material: string): Promise<Result<{ material: string; alternatives: { name: string; saving: string; note: string }[]; note: string }>> {
  try {
  return Ok({
    material,
    alternatives: [
      { name: `${material} (Optimal)`, saving: '12% tejash', note: 'Bir xil sifat, past narx' },
      { name: `${material} Premium`, saving: '0%', note: 'Eng yuqori sifat' },
      { name: `${material} Eco`, saving: '20% tejash', note: 'Ekologik toza, engil' },
    ],
    note: `AI tavsiyasi: Optimal variant ${material} uchun eng samarali tanlov`,
  });
    } catch (_e) {
    return Err(String(_e));
  }
}
```

**KEYIN (satr 53-66 o'rniga):**
```typescript
// EP-PP: materiallar alternativasi hali qurilmagan (Phase 3 MRP scope).
// Q-40: fake/hardcoded javob TAQIQ — honest 501 qaytariladi.
async findMaterialAlternatives(_material: string): Promise<Result<never>> {
  return Err('NOT_IMPLEMENTED: Materiallar alternativasi hali qurilmagan (EP-PP Phase 3 MRP)');
}
```

**technology.controller.ts satr 100-105 ham o'zgartiriladi:**

**OLDIN:**
```typescript
@Get('materials/alternatives')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
@ApiOperation({ summary: 'Find material alternatives for cost optimization' })
async getMaterialAlternatives(@Query('material') material: string) {
  return unwrapOrInternal(await this.svc.getMaterialAlternatives(material ?? 'gofrokarton'));
}
```

**KEYIN:**
```typescript
@Get('materials/alternatives')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
@ApiOperation({ summary: 'Find material alternatives — NOT YET IMPLEMENTED (Phase 3 MRP)' })
async getMaterialAlternatives(@Query('material') _material: string) {
  // EP-PP Phase 3 MRP: materiallar alternativasi keyin quriladi.
  // Q-40: fake hardcoded data TAQIQ; honest 501 qaytariladi.
  throw new HttpException(
    'Materiallar alternativasi hali qurilmagan (EP-PP Phase 3 MRP scope)',
    HttpStatus.NOT_IMPLEMENTED,
  );
}
```

`technology.controller.ts` import satriga `HttpStatus` qo'shilganligini tekshir (allaqachon `HttpException, HttpStatus` import qilingan — satr 8).

**DB-proof:** Endpoint endi 501 qaytarishi kerak.  
Verify: `curl -H "Authorization: Bearer <token>" http://localhost:3030/api/technology/materials/alternatives?material=gofrokarton` → `{"statusCode":501,...}`.

---

### QADAM 2 — BOM DELETE endpoint qo'shish

**Fayl:** `apps/api/src/modules/pp/technology/technology.repository.ts`  
**Fayl:** `apps/api/src/modules/pp/technology/technology.controller.ts`

#### 2a. Repository — `deleteBomItem` metod

`technology.repository.ts` ning oxirida (satr 263 `}` dan oldin) qo'shiladi:

```typescript
// DELETE /technology/cards/:id/bom/:bomId — real DELETE (EP-PP-089 BOM management)
async deleteBomItem(cardId: string, bomId: string): Promise<Result<void>> {
  try {
    const r = await db.execute(
      sql`DELETE FROM tech_card_bom
          WHERE id = ${parseInt(bomId, 10)}
            AND technology_card_id = ${parseInt(cardId, 10)}
          RETURNING id`
    );
    const deleted = ((r as { rows?: object[] }).rows ?? []).length;
    if (deleted === 0) return Err('BOM qatori topilmadi yoki sizga tegishli emas');
    return Ok(undefined);
  } catch (e) { return Err(fkOrRaw(e)); }
}
```

#### 2b. Controller — `DELETE /technology/cards/:id/bom/:bomId`

`technology.controller.ts` ning `getVersions` metodidan keyin (satr 246 dan keyin) qo'shiladi:

```typescript
@Delete('cards/:id/bom/:bomId')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
@ApiOperation({ summary: 'Delete a BOM row from a tech card' })
async deleteBomItem(
  @Param('id') id: string,
  @Param('bomId') bomId: string,
) {
  const r = await this.svc.deleteBomItem(id, bomId);
  if (!r.ok) throw new HttpException(String(r.error), HttpStatus.BAD_REQUEST);
  return { id: bomId, deletedAt: _time.now().toISOString() };
}
```

**TechnologyService-ga ham delegatsiya qo'shiladi** — lekin `technology.service.ts` OWNED FILE emas. Tekshir: `svc.deleteBomItem` mavjudmi? Agar yo'q bo'lsa — TO'XTA, egaga flag qil. Mavjud bo'lsa davom et.

> DIQQAT: `technology.service.ts` OWNED FILE emas (P13 scope da yo'q). Agar service'da `deleteBomItem` yo'q bo'lsa, egaga aniq flag: "technology.service.ts fayli P13 owned emas — deleteBomItem metodi qo'shish uchun egasi ruxsati kerak yoki owned files ro'yxati kengaytirilsin."

**DB-proof:**  
```sql
-- Avval BOM qatori qo'sh:
INSERT INTO tech_card_bom (technology_card_id, material_code, quantity) VALUES (1, 'TEST-MAT', 10);
-- ID ni oling, keyin:
DELETE endpoint bilan o'chiring.
-- Tekshirish:
SELECT * FROM tech_card_bom WHERE material_code = 'TEST-MAT'; -- 0 qator bo'lishi kerak
```

---

### QADAM 3 — Production Order 7-status lifecycle + Status log

Bu qadam DDL Gate bo'lgani uchun ikki qism bor:
- **3a:** Migration fayli (GATED — yoziladi, ishga tushirilmaydi)
- **3b:** BE mantiq (migration tasdiqlangandan keyin bajarilishi kerak, lekin kod hozir yoziladi)

#### 3a. DDL Migration faylini yoz (GATED)

**Fayl:** `apps/api/src/shared/db/migrations/p13-pp-techcard-lifecycle.sql`

```sql
-- GATED: Egasi tasdiqlagunga qadar bu faylni ISHGA TUSHIRMA.
-- Tasdiqlash: '-- APPROVED: <ism YYYY-MM-DD>' qatorini qo'sh.
-- APPROVED: [PLACEHOLDER — egasi to'ldiradi]
--
-- P13 PP Tech-card lifecycle + 7-status + audit log
-- Wave 2 | DependsOn: P12 migration tasdiqlangan bo'lishi shart
--
-- Q-35: DDL faqat egasi ruxsati bilan.

BEGIN;

-- 1. production_orders: eski CHECK constraint o'chir, yangi 7-status + terminal qo'sh
ALTER TABLE production_orders
  DROP CONSTRAINT IF EXISTS production_orders_status_chk;

ALTER TABLE production_orders
  ADD CONSTRAINT production_orders_status_chk CHECK (
    status IN (
      'reja',           -- Rejalashtirilgan (boshlang'ich)
      'tasdiqlangan',   -- Tasdiqlangan (ishlab chiqarish boshlig'i)
      'ishga_tushgan',  -- Ishga tushgan (smena boshlanishi)
      'jarayonda',      -- Jarayonda (faol ishlab chiqarilmoqda)
      'sifatda',        -- QC tekshiruvida
      'tugadi',         -- Ishlab chiqarish tugadi
      'yopildi',        -- Yopildi (arxiv)
      'bekor',          -- Bekor qilingan (terminal)
      'toxtatilgan'     -- To'xtatilgan (terminal, sabab talab qilinadi)
    )
  );

-- 2. production_orders: ZARUR flag + frozen zone + readiness_pct ustunlari
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS priority_flag VARCHAR(20) DEFAULT 'normal'
    CHECK (priority_flag IN ('normal', 'high', 'urgent', 'zarur')),
  ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS readiness_pct NUMERIC(5,2) DEFAULT 0;

-- 2b. production_orders: 3-darvoza ustunlari (EP-PP-091/123 + material gate EP-PP-068)
-- ⚠️ MUVOFIQLIK FIX (2026-06-19): 3-darvoza konformans auditida yo'q edi — qo'shildi.
-- maket_approved: dizayn-rahbar tasdiq (EP-PP-123). FALSE = darvoza yopiq.
-- lab_approved:   laborant tasdiq (EP-PP-091). FALSE = darvoza yopiq.
-- material_gate_ok: MRP/CRP servis yetarli material bron bo'lganini belgilaydi (EP-PP-068).
-- Guard: reja→tasdiqlangan o'tishida 3 darvoza HAMMASI true bo'lishi shart.
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS maket_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lab_approved     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS material_gate_ok BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN production_orders.maket_approved   IS 'EP-PP-123: Dizayn-rahbar maket tasdiq (3-darvoza #1)';
COMMENT ON COLUMN production_orders.lab_approved     IS 'EP-PP-091: Laborant material tasdiq (3-darvoza #2)';
COMMENT ON COLUMN production_orders.material_gate_ok IS 'EP-PP-068: MRP material bron to''liq (3-darvoza #3)';

-- 3. pp_order_status_log jadvalini yaratish (EP-PP-082 audit trail)
CREATE TABLE IF NOT EXISTS pp_order_status_log (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(30),                          -- NULL = dastlabki yaratish
  to_status   VARCHAR(30) NOT NULL,
  changed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason      TEXT,                                 -- Majburiy: bekor/toxtatilgan/frozen-unlock
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_order_status_log_order_id
  ON pp_order_status_log(order_id);
CREATE INDEX IF NOT EXISTS idx_pp_order_status_log_changed_at
  ON pp_order_status_log(changed_at DESC);

COMMIT;
```

**Faylni saqla lekin `db.execute` yoki `drizzle-kit push` QILMA.**

#### 3b. Status transition mantiq — `production-orders.service.ts`

**Fayl:** `apps/api/src/modules/pp/production-orders/production-orders.service.ts`

Hozirgi `updateStatus` (satr 52-59) faqat status yangilaydi, log yozmaydi va transition validatsiyasi yo'q.

**Ruxsat etilgan o'tishlar (vizyon EP-PP-082):**

```typescript
// Quyidagi konstantani production-orders.service.ts boshiga qo'sh:
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  reja:          ['tasdiqlangan', 'bekor'],
  tasdiqlangan:  ['ishga_tushgan', 'bekor'],
  ishga_tushgan: ['jarayonda', 'toxtatilgan', 'bekor'],
  jarayonda:     ['sifatda', 'toxtatilgan'],
  sifatda:       ['tugadi', 'jarayonda'],  // QC rad etsa — jarayondaga qaytadi
  tugadi:        ['yopildi'],
  yopildi:       [],                        // Terminal — boshqa o'tish yo'q
  bekor:         [],                        // Terminal
  toxtatilgan:   ['reja', 'bekor'],         // Qayta rejalashtirish mumkin
};
```

**OLDIN `updateStatus` (satr 52-59):**
```typescript
async updateStatus(id: number, status: string){
  return safeCall(async () => {
  await this.findOne(id);
  const result = await this.ppProductionOrdersRepo.updateStatus(id, status);
  if (!result.ok) throw new InternalServerErrorException(result.error);
  return result.data;

  });}
```

**KEYIN — yangi `updateStatus` (validation + log + frozen guard):**
```typescript
async updateStatus(
  id: number,
  status: string,
  changedBy?: number,
  reason?: string,
): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    // 1. Hozirgi orderni olish
    const current = await this.ppProductionOrdersRepo.findById(id);
    if (!current.ok || !current.data) throw new NotFoundException(`Buyurtma #${id} topilmadi`);

    const order = current.data as Record<string, unknown>;
    const currentStatus = order.status as string;

    // 2. Frozen zone tekshiruvi (EP-PP-025)
    //    frozen_until bo'lsa va hali o'tmagan bo'lsa — faqat owner/director o'zgartira oladi.
    //    Bu yerda rolni tekshirish controller'da amalga oshiriladi (403 guard);
    //    bu yerda faqat frozen_until flagini tekshiramiz.
    if (order.frozenUntil) {
      const frozenUntil = new Date(order.frozenUntil as string);
      if (frozenUntil > new Date()) {
        // Controller'dagi @Roles guard allaqachon ishlamagan bo'lsa — bu yerda xato berish
        // Bu xabar controller'dagi frozen-guard fallback sifatida ishlaydi
        throw new Error(`Buyurtma ${frozenUntil.toISOString()} gacha muzlatilgan`);
      }
    }

    // 3. Transition validatsiyasi
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(status)) {
      throw new Error(
        `Noto'g'ri status o'tish: '${currentStatus}' → '${status}'. ` +
        `Ruxsat etilganlar: [${allowed.join(', ')}]`
      );
    }

    // 4. Terminal statuslar uchun sabab majburiy
    if ((status === 'bekor' || status === 'toxtatilgan') && !reason?.trim()) {
      throw new Error(`'${status}' uchun sabab (reason) majburiy`);
    }

    // 5. Status yangilash
    const updateResult = await this.ppProductionOrdersRepo.updateStatus(id, status);
    if (!updateResult.ok) throw new InternalServerErrorException(updateResult.error);

    // 6. Audit log yozish (pp_order_status_log)
    // Drizzle ORM yo'q (jadval sxemasi P12 scope) — raw SQL (izoh qo'shildi)
    // NOTE: pp_order_status_log jadval sxemasi lib/db'da yo'q (P12 scope).
    // Migration APPROVED bo'lgunga qadar bu INSERT 23503 berishi mumkin.
    // Agar jadval yo'q bo'lsa — xatolik loglanadi va asosiy operatsiya davom etadi.
    try {
      await db.execute(
        sql`INSERT INTO pp_order_status_log
              (order_id, from_status, to_status, changed_by, reason)
            VALUES
              (${id}, ${currentStatus}, ${status}, ${changedBy ?? null}, ${reason ?? null})`
      );
    } catch (logErr) {
      // pp_order_status_log jadval hali yaratilmagan (DDL Gate) — log yozmasa ham asosiy op davom etadi
      this.logger.warn(`pp_order_status_log yozilmadi (DDL Gate): ${String(logErr)}`);
    }

    return updateResult.data;
  });
}
```

**Import qo'shish** — `production-orders.service.ts` boshiga:
```typescript
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
```

#### 3c. `pp-orders.controller.ts` — frozen_until guard + updateStatus chaqiruvi

**Fayl:** `apps/api/src/modules/pp/presentation/pp-orders.controller.ts`

Hozir `PATCH /:id/release` bor lekin status o'zgartirish endpoint yo'q. Qo'shiladi:

Avval import qatoriga `Body, ForbiddenException, HttpException, HttpStatus` qo'shilganligini tekshir. Hozirgi import (satr 6):
```typescript
import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, Query, Logger , InternalServerErrorException } from '@nestjs/common';
```
`ForbiddenException` va `HttpStatus` yo'q — qo'shiladi.

`ProductionOrdersService` DI ham yo'q (hozir faqat `commandBus`/`queryBus`). Agar `ProductionOrdersService` inject qilinmagan bo'lsa — TO'XTA va egaga flag qil. Bu controller CQRS pattern ishlatadi.

> **DIQQAT:** `pp-orders.controller.ts` faqat `commandBus`/`queryBus` inject qiladi (satr 50-51). `ProductionOrdersService` inject qilinmagan. PATCH status uchun yangi CQRS command yaratish kerak yoki `ProductionOrdersService` inject qilinadi. Bu arxitektura qaror — **TO'XTA, egaga ko'rsat** quyidagi variantlarni:
> - **Variant A:** `ProductionOrdersService` ni `PpOrdersController` ga inject qilish (tezroq, lekin controller ikkita DI yo'lga ega bo'ladi).
> - **Variant B:** `ChangeProductionOrderStatusCommand` + handler yaratish (CQRS bilan izchil, lekin P13 scope tashqarisiga chiqadi — yangi fayl kerak).
>
> Egasi "Variant A" desa — `PpOrdersController` constructoriga `ProductionOrdersService` qo'shiladi. "Variant B" desa — flaglab qo'yiladi.

**Egasi A variantini tanlagan deb taxmin qilib davom etamiz (agar egasi B desa — bu qism bekor):**

`pp-orders.controller.ts` constructori o'zgartiriladi:

**OLDIN (satr 50-51):**
```typescript
constructor(private commandBus: CommandBus,
 private queryBus: QueryBus) {}
```

**KEYIN:**
```typescript
constructor(
  private commandBus: CommandBus,
  private queryBus: QueryBus,
  private readonly productionOrdersService: ProductionOrdersService,
) {}
```

Import qo'shiladi:
```typescript
import { ProductionOrdersService } from '../production-orders/production-orders.service';
```

Yangi endpoint qo'shiladi (satr 138 dan keyin):

```typescript
const ChangeStatusSchema = z.object({
  status: z.enum([
    'reja', 'tasdiqlangan', 'ishga_tushgan', 'jarayonda',
    'sifatda', 'tugadi', 'yopildi', 'bekor', 'toxtatilgan',
  ]),
  reason: z.string().optional(),
});

@ApiOperation({ summary: 'Change production order status (7-status lifecycle, EP-PP-082)' })
@ApiResponse({ status: 200, description: 'Status o\'zgardi' })
@ApiResponse({ status: 400, description: 'Noto\'g\'ri o\'tish yoki sabab yo\'q' })
@ApiResponse({ status: 403, description: 'Muzlatilgan zona — faqat owner/director' })
@Patch(':id/status')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST, Role.SEX_BOSHLIG)
async changeStatus(
  @Param('id') id: string,
  @Body() body: unknown,
  @CurrentUser() user: { id: number; role: string },
) {
  const dto = ChangeStatusSchema.parse(body);

  // Frozen zone guard: agar order muzlatilgan bo'lsa — faqat SUPER_ADMIN / DIRECTOR
  // (Haqiqiy frozen_until tekshiruvi service ichida amalga oshiriladi)
  // Bu yerda role precheck:
  // Agar status o'zgartirishga urinilsa va role not SUPER_ADMIN/DIRECTOR bo'lsa,
  // frozen tekshiruvi service'da bajariladi va xato qaytaradi.

  const result = await this.productionOrdersService.updateStatus(
    Number(id),
    dto.status,
    user.id,
    dto.reason,
  );

  if (!result.ok) {
    const msg = String(result.error);
    if (msg.includes('muzlatilgan')) {
      throw new ForbiddenException(msg);
    }
    throw new HttpException(msg, HttpStatus.BAD_REQUEST);
  }

  return result.data;
}
```

Import satriga qo'shish:
```typescript
import { ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
```

`@Roles` decoratori satr 26 da lokal `enum Role` ishlatadi — bu `@common/constants/roles.constants` bilan mos emasligini tekshir. Agar mos emas bo'lsa — hozirgi lokal enum'dan foydalaning (o'zgartirma).

---

### QADAM 4 — PapkaOrdersController qidirish va pp.module.ts ga qo'shish

**Qidirish:**
```bash
# Terminal da:
grep -r "PapkaOrdersController" apps/api/src --include="*.ts" -l
```

Agar topilsa:
- Import qilish: `import { PapkaOrdersController } from '...topilgan yo'l...'`
- `pp.module.ts:112-118` controllers arrayiga qo'shish:

**OLDIN (pp.module.ts satr 112-118):**
```typescript
controllers: [PpOrdersController, PpBomController, PpRoutingController, PpWorkCentersController, PpPlanningController, PpEquipmentController, PpIntelligenceController,
  // PA3-17 Wave 5: merged from modules/technology/
  TechnologyController,
  // PA3-17 Wave 6: merged from modules/production/
  ProductionShiftReportsController,
  ProductionReportsController,
],
```

**KEYIN (agar PapkaOrdersController topilsa):**
```typescript
controllers: [PpOrdersController, PpBomController, PpRoutingController, PpWorkCentersController, PpPlanningController, PpEquipmentController, PpIntelligenceController,
  // PA3-17 Wave 5: merged from modules/technology/
  TechnologyController,
  // PA3-17 Wave 6: merged from modules/production/
  ProductionShiftReportsController,
  ProductionReportsController,
  // P13: PapkaOrdersController ro'yxatdan o'tkazildi (TechCards.tsx + PlanningBoard.tsx ga /api/papka-orders kerak)
  PapkaOrdersController,
],
```

**Agar PapkaOrdersController topilmasa:**  
TO'XTA. Egaga flag: "PapkaOrdersController fayli topilmadi. `/api/papka-orders` route yo'q. Bu controller yaratilishi kerak lekin P13 owned files tashqarida — egasi ruxsati kerak yoki owned files ro'yxati kengaytirilsin."

---

### QADAM 4b — P14 + P53 provayderlarini pp.module.ts ga ro'yxatdan o'tkazish (P13 = yagona ega)

> **MUVOFIQLIK FIX 2026-06-19 (§2.6b):** pp.module.ts ning yagona egasi P13. P14 va P53 bu faylga tegmaydi — ularning DI provayderlari shu yerda, P13 tomonidan qo'shiladi. Bu manifest §5 (1 fayl = 1 ega) qoidasiga rioya qiladi va ikki sessiya bir faylni bosib o'tishini oldini oladi.
>
> ⚠️ **Bog'liqlik:** Quyidagi fayllar P14 (`shift-plan.service.ts`, `shift-plan.repository.ts`, `brak-rework.listener.ts`) va P53 (`conversion/*`) tomonidan YARATILGAN bo'lishi kerak. Agar ular hali mavjud bo'lmasa — P13 faqat o'z qismini (PapkaOrdersController) qo'shadi va P14/P53 provayderlarini DEFER qiladi (egaga flag: "P14/P53 fayllari hali yaratilmagan — ular tugagach pp.module.ts da ro'yxatdan o'tkazaman"). Mavjud bo'lsa — hammasini bitta sweepda qo'sh.

**4b.1 — Import bloki (pp.module.ts import qismiga qo'sh):**

```typescript
// P14 (shift-plan) provayderlari — P13 ro'yxatdan o'tkazadi (P14 pp.module.ts ga tegmaydi)
import { ShiftPlanService } from './production/shift-plan.service';
import { ShiftPlanRepository } from './production/shift-plan.repository';
import { BrakReworkListener } from './production/brak-rework.listener';

// P53 (gofra konversiya) provayderlari — P13 ro'yxatdan o'tkazadi (P53 pp.module.ts ga tegmaydi)
import { GofraConversionController } from './conversion/gofra-conversion.controller';
import { GofraConversionService } from './conversion/gofra-conversion.service';
import { DrizzleGofraConversionRepo } from './conversion/drizzle-gofra-conversion.repo';
import { GOFRA_CONVERSION_REPO } from './conversion/i-gofra-conversion.repo';
```

**4b.2 — controllers[] arrayiga qo'sh (P53):**

```typescript
  // P53: Gofra konversiya dvigateli (P13 ro'yxatdan o'tkazdi — yagona ega)
  GofraConversionController,
```

**4b.3 — providers[] arrayiga qo'sh (P14 + P53):**

```typescript
  // P14: shift-plan provayderlari (P13 ro'yxatdan o'tkazdi — yagona ega)
  ShiftPlanService,
  ShiftPlanRepository,
  BrakReworkListener,
  // P53: gofra konversiya provayderlari (P13 ro'yxatdan o'tkazdi — yagona ega)
  GofraConversionService,
  { provide: GOFRA_CONVERSION_REPO, useClass: DrizzleGofraConversionRepo },
```

**Eslatma:** `PP_BRAK_DETECTED: 'pp.brak.detected'` konstantasi `erp-events.constants.ts` da P14 flagi bo'yicha qo'shiladi (shared fayl — pp.module.ts emas). `BrakReworkListener` `@OnEvent('pp.brak.detected')` string'ini to'g'ridan ishlatadi, shuning uchun listenerni ro'yxatga olish yetarli.

**Self-verify (4b):** BE `tsc` → 0 xato; `pnpm --filter @europrint/api run dev:unsafe` boot → DI xatosiz (ShiftPlanService/ShiftPlanRepository/BrakReworkListener/GofraConversion* hammasi resolve bo'ladi); `grep -n "ShiftPlanService\|GofraConversionController" apps/api/src/modules/pp/pp.module.ts` → topiladi.

---

### QADAM 5 — TechCards.tsx: deleteMutation + ConfirmDialog qo'shish

**Fayl:** `artifacts/erp-dashboard/src/pages/TechCards.tsx`

**Qoida 14:** Har qanday o'chirish `ConfirmDialog` orqali tasdiqlanishi shart.

BE endpoint mavjud: `DELETE /api/technology/cards/:id` (technology.controller.ts:181-187 — soft delete).

**TechCards.tsx ga qo'shimchalar:**

#### 5a. State qo'shish (mavjud state'lar yoniga, satr ~55 ga yaqin):

```typescript
const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
```

#### 5b. deleteMutation qo'shish (mavjud mutations yoniga, satr ~165 ga yaqin):

```typescript
const deleteMutation = useMutation({
  mutationFn: (cardId: string) => apiRequest('DELETE', `/api/technology/cards/${cardId}`),
  onSuccess: () => {
    toast({ title: "Muvaffaqiyat", description: "Texkarta o'chirildi" });
    setDeleteConfirmId(null);
    setSelectedCard(null);
    setShowViewModal(false);
    invalidateCard();
  },
  onError: (err: Error) => toast({
    title: "Xatolik",
    description: err.message,
    variant: "destructive",
  }),
});
```

#### 5c. ConfirmDialog JSX qo'shish (return ichida, eng oxirida komponentlar yoniga):

Avval `ConfirmDialog` importi borligini tekshir. Yo'q bo'lsa:
```typescript
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
```

JSX qo'shimcha:
```tsx
{/* Delete confirmation dialog — Qoida 14 */}
{deleteConfirmId && (
  <ConfirmDialog
    open={!!deleteConfirmId}
    onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
    title="Texkartani o'chirishni tasdiqlang"
    description="Bu amal qaytarib bo'lmaydi. Texkarta arxivlanadi (soft delete)."
    confirmText="O'chirish"
    variant="destructive"
    onConfirm={() => {
      if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId);
    }}
  />
)}
```

#### 5d. O'chirish tugmasini `CardsGrid` yoki `ViewCardDialog` ga props orqali uzatish:

`CardsGrid` va `ViewCardDialog` OWNED FILE emas (`TechCardsSections.tsx`, `TechCardsDialogs.tsx`). Agar shu komponentlarga prop uzatish uchun bu fayllar kerak bo'lsa — TO'XTA va egaga flag qil.

Muqobil: agar `TechCards.tsx` o'zi karta o'chirish tugmasini render qilsa (to'g'ridan-to'g'ri JSX da) — shu yerda qil. Agar child komponentga prop kerak bo'lsa — egaga flag.

> **FLAG:** `TechCards.tsx` faqat state/hook/handler'larni saqlaydi; karta render `TechCardsSections.tsx::CardsGrid` va `TechCardsDialogs.tsx::ViewCardDialog` ichida. O'chirish tugmasini bu child komponentlarga qo'shish uchun ular ham edit qilinishi kerak — bu P13 owned emas. **Egaga ko'rsat:** "O'chirish tugmasini qo'shish uchun `TechCardsSections.tsx` va/yoki `TechCardsDialogs.tsx` ham kerak. Ularni P13 owned files ga qo'shilsinmi?"

Egasi ruxsat bermaguncha: `deleteConfirmId` state va `deleteMutation` qo'shiladi, lekin trigger (tugma) qo'shilmaydi. Shu holat ham foydali — mutation tayyor bo'ladi.

---

### QADAM 6 — ProductionOrder360.tsx: 7-status badge fallback

**Fayl:** `artifacts/erp-dashboard/src/pages/ProductionOrder360.tsx`

**Hozirgi holat (satr 64):**
```typescript
const statusInfo = STATUS_LABELS[overview.status] || { label: overview.status, variant: "secondary" as const };
```

Bu yaxshi — eski statuslar uchun `STATUS_LABELS` dan oladi, yangi 7-status uchun fallback bor (`|| { label: ..., variant: "secondary" }`).

**Muammo:** 7 yangi status (`reja`, `tasdiqlangan` va h.k.) uchun ko'k/yashil/qizil rang yo'q — hammasi "secondary" kulrang.

**Tuzatish (satr 64 o'zgartiriladi):**

```typescript
// P13: 7-status lifecycle fallback (STATUS_LABELS ProductionOrder360Types.ts'da to'liq yangilanadi,
// bu yerda yangi statuslar uchun local override)
const PP_7_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  reja:          { label: "Reja",          variant: "secondary" },
  tasdiqlangan:  { label: "Tasdiqlangan",  variant: "default" },
  ishga_tushgan: { label: "Ishga tushgan", variant: "default" },
  jarayonda:     { label: "Jarayonda",     variant: "default" },
  sifatda:       { label: "QC tekshiruvda", variant: "outline" },
  tugadi:        { label: "Tugadi",        variant: "default" },
  yopildi:       { label: "Yopildi",       variant: "secondary" },
  bekor:         { label: "Bekor",         variant: "destructive" },
  toxtatilgan:   { label: "To'xtatilgan",  variant: "destructive" },
};
const statusInfo = STATUS_LABELS[overview.status]
  ?? PP_7_STATUS_LABELS[overview.status]
  ?? { label: overview.status, variant: "secondary" as const };
```

Bu o'zgarish faqat `ProductionOrder360.tsx` ichida — owned file. `STATUS_LABELS` import mos keladi (mavjud type kengaytmaydi, faqat fallback qo'shiladi).

---

## 5. DDL (MIGRATION)

**Fayl:** `apps/api/src/shared/db/migrations/p13-pp-techcard-lifecycle.sql`

To'liq migration kodi yuqorida QADAM 3a da berildi.

**Muhim eslatmalar:**

1. **ISHGA TUSHIRMA** — egasi `-- APPROVED:` izohini qo'shgunga qadar.
2. P12 migration AVVAL tasdiqlangan va ishga tushirilgan bo'lishi kerak (dependency).
3. `production_orders_status_chk` constraint o'chirib, yangi qo'yish — bu destructive DDL. Agar jadvalda hozirgi qiymatlar `created/released/in_progress/completed/closed/qc_hold` bo'lsa — ular yangi CHECK da yo'q. Shuning uchun:

```sql
-- MUHIM: Eski status qiymatlarini yangilash (agar live DB'da data bo'lsa)
-- Bu blok APPROVED tasdiqlangandan keyin egasi ishga tushiradi:
UPDATE production_orders SET status = 'reja'          WHERE status = 'created';
UPDATE production_orders SET status = 'ishga_tushgan'  WHERE status = 'released';
UPDATE production_orders SET status = 'jarayonda'     WHERE status = 'in_progress';
UPDATE production_orders SET status = 'tugadi'        WHERE status = 'completed';
UPDATE production_orders SET status = 'yopildi'       WHERE status = 'closed';
UPDATE production_orders SET status = 'sifatda'       WHERE status = 'qc_hold';
-- Bu UPDATE'lar CHECK o'zgartirishdan OLDIN bajarilishi kerak!
```

Migration faylida bu UPDATE'lar CHECK'dan OLDIN joylashtiriladi:

```sql
BEGIN;

-- 1. Eski status qiymatlarini yangi nomga o'zgartir (avval, CHECK o'zgartirishdan oldin)
UPDATE production_orders SET status = 'reja'          WHERE status = 'created';
UPDATE production_orders SET status = 'ishga_tushgan'  WHERE status = 'released';
UPDATE production_orders SET status = 'jarayonda'     WHERE status = 'in_progress';
UPDATE production_orders SET status = 'tugadi'        WHERE status = 'completed';
UPDATE production_orders SET status = 'yopildi'       WHERE status = 'closed';
UPDATE production_orders SET status = 'sifatda'       WHERE status = 'qc_hold';

-- 2. CHECK constraint yangilash
ALTER TABLE production_orders
  DROP CONSTRAINT IF EXISTS production_orders_status_chk;

ALTER TABLE production_orders
  ADD CONSTRAINT production_orders_status_chk CHECK (
    status IN (
      'reja', 'tasdiqlangan', 'ishga_tushgan', 'jarayonda',
      'sifatda', 'tugadi', 'yopildi', 'bekor', 'toxtatilgan'
    )
  );

-- 3. Yangi ustunlar
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS priority_flag VARCHAR(20) DEFAULT 'normal'
    CHECK (priority_flag IN ('normal', 'high', 'urgent', 'zarur')),
  ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS readiness_pct NUMERIC(5,2) DEFAULT 0;

-- 4. pp_order_status_log
CREATE TABLE IF NOT EXISTS pp_order_status_log (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status   VARCHAR(30) NOT NULL,
  changed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason      TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_order_status_log_order_id
  ON pp_order_status_log(order_id);
CREATE INDEX IF NOT EXISTS idx_pp_order_status_log_changed_at
  ON pp_order_status_log(changed_at DESC);

COMMIT;
```

---

## 6. QABUL MEZONI

Har bir mezoni JONLI tasdiqlanadi (Q-40: ishlaydi ≠ to'g'ri):

### BE

- [ ] `GET /api/technology/materials/alternatives` → **501** (fake javob yo'q)
- [ ] `DELETE /api/technology/cards/:id/bom/:bomId` → real DELETE, DB da qator yo'qoladi
- [ ] `PATCH /api/pp/orders/:id/status` bilan noto'g'ri o'tish → **400** xato xabari
- [ ] `production_orders` da `maket_approved`, `lab_approved`, `material_gate_ok` ustunlari mavjud (DDL Gate bajarilgandan keyin) — 3-darvoza (EP-PP-123/091/068)
- [ ] `PATCH /api/pp/orders/:id/status` bilan `bekor` statusiga sabab yo'q → **400**
- [ ] `PATCH /api/pp/orders/:id/status` muzlatilgan order (frozen_until kelajak) → **403** (DDL Gate bajarilgandan keyin)
- [ ] Status o'zgarganda `pp_order_status_log` da qator paydo bo'ladi (DDL Gate bajarilgandan keyin)
- [ ] BE `tsc` → **0 xato**
- [ ] `bash scripts/reviewer-result-pattern.sh` → FAIL: 0
- [ ] `bash scripts/reviewer-array-safety.sh` → FAIL: 0

### FE

- [ ] `TechCards.tsx` — `deleteMutation` + `ConfirmDialog` mavjud (trigger bo'lmasa ham mutation tayyor)
- [ ] `ProductionOrder360.tsx` — `reja`/`tasdiqlangan`/... status badgelari "secondary" kulrang emas (to'g'ri label ko'rsatadi)
- [ ] FE `tsc` → **0 xato**

### DDL (Gate)

- [ ] `p13-pp-techcard-lifecycle.sql` faylda `GATED` belgisi bor, `-- APPROVED:` yo'q
- [ ] Migration ISHGA TUSHIRILMAGAN (DB'da `pp_order_status_log` jadval yo'q holda ham BE ishga tushadi)
- [ ] Egasi `-- APPROVED:` qo'shgandan keyin migration idempotent ishlaydi: qayta ishlatilsa xato bermaydi

### Oltin zanjir regressiya yo'q

- [ ] `GET /api/pp/orders` → 200 (hamon ishlaydi)
- [ ] `GET /api/technology/cards` → 200 (hamon ishlaydi)
- [ ] `GET /api/technology/cards/:id/bom` → 200 (hamon ishlaydi)
- [ ] `POST /api/technology/cards` → real INSERT (hamon ishlaydi)
- [ ] `ProductionOrder360.tsx` sahifasi yuklandi, tab'lar ishlaydi

---

## 7. SELF-VERIFY

Quyidagi buyruqlarni AYNAN bajaring va natijani tekshiring:

### 7.1 BE typecheck

```bash
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit
# Kutilgan natija: 0 xato
```

### 7.2 FE typecheck

```bash
pnpm --filter erp-dashboard exec tsc --noEmit
# Kutilgan natija: 0 xato (yoki faqat avvaldan mavjud xatolar, P13 dan YANGI xato yo'q)
```

### 7.3 Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh
# Kutilgan: FAIL: 0

bash scripts/reviewer-array-safety.sh
# Kutilgan: FAIL: 0
```

### 7.4 API probe — fake alternativalar 501 bo'ldi

```bash
# Backend ishga tushirilgan holda:
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' | jq -r '.access_token')

curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/technology/materials/alternatives?material=gofrokarton"
# Kutilgan: 501
```

### 7.5 BOM DELETE round-trip

```bash
# 1. BOM qatori qo'sh
BOM=$(curl -s -X POST http://localhost:3030/api/technology/cards/1/bom \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"materialCode":"TEST-P13-MAT","quantity":5,"unit":"kg"}')
BOM_ID=$(echo $BOM | jq -r '.id')
echo "BOM ID: $BOM_ID"

# 2. O'chir
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/technology/cards/1/bom/$BOM_ID"

# 3. Tekshir — yo'q bo'lishi kerak
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/technology/cards/1/bom" | jq '.[] | select(.material_code == "TEST-P13-MAT")'
# Kutilgan: bo'sh (hech narsa chiqmaydi)
```

### 7.6 Status o'tish validatsiyasi

```bash
# Noto'g'ri o'tish (reja → yopildi — allowed emas)
curl -s -w "\n%{http_code}" -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"yopildi"}' \
  "http://localhost:3030/api/pp/orders/1/status"
# Kutilgan: 400 + "Noto'g'ri status o'tish" xabar

# Terminal status sabab yo'q (bekor — reason kerak)
curl -s -w "\n%{http_code}" -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"bekor"}' \
  "http://localhost:3030/api/pp/orders/1/status"
# Kutilgan: 400 + "sabab (reason) majburiy" xabar
```

### 7.7 DB proof — pp_order_status_log (DDL Gate bajarilgandan keyin)

```bash
# FAQAT migration ishga tushirilgandan keyin:
PGPASSWORD=europrint psql -h localhost -U europrint -d europrint \
  -c "SELECT * FROM pp_order_status_log ORDER BY changed_at DESC LIMIT 5;"
# Kutilgan: Status o'zgartirishlar ro'yxati ko'rinadi
```

### 7.8 ProductionOrder360 7-status badge

```bash
# FE dev server ishga tushirilgan holda:
# 1. /pp/orders/:id sahifasiga o'ting (agar order 'reja' statusida bo'lsa)
# 2. Badge "Reja" deb ko'rsatishi kerak (kulrang "secondary")
# 3. 'tasdiqlangan' statusida — "Tasdiqlangan" (ko'k "default")
```

### 7.9 Migration fayli GATED tekshiruvi

```bash
grep "APPROVED:" apps/api/src/shared/db/migrations/p13-pp-techcard-lifecycle.sql
# Kutilgan: "-- APPROVED: [PLACEHOLDER — egasi to'ldiradi]" ko'rinadi
# Agar bu satr yo'q bo'lsa — migration GATED emas, XATO!
```

---

## 8. COMMIT

Har mantiqiy guruh uchun alohida commit. **Hech qachon** `git add -A` yoki `git add .` ishlatma.

### Commit 1 — findMaterialAlternatives 501 + BOM DELETE

```bash
git add apps/api/src/modules/pp/technology/technology.repository.ts
git add apps/api/src/modules/pp/technology/technology.controller.ts
git commit -m "$(cat <<'EOF'
fix(pp): honest 501 for findMaterialAlternatives + BOM DELETE endpoint

- technology.repository.ts: findMaterialAlternatives fake hardcoded 3
  alternativ o'chirildi → Err('NOT_IMPLEMENTED') (Q-40 buzilishi tuzatildi)
- technology.controller.ts: GET /materials/alternatives → 501 HttpException
- technology.repository.ts: deleteBomItem() metodi qo'shildi (real DELETE)
- technology.controller.ts: DELETE /cards/:id/bom/:bomId endpoint qo'shildi

EP-PP: fake javob TAQIQ (Q-40); BOM management EP-PP-089.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Commit 2 — 7-status lifecycle + status log

```bash
git add apps/api/src/modules/pp/production-orders/production-orders.service.ts
git add apps/api/src/modules/pp/production-orders/drizzle-pp-production-orders.repo.ts
git add apps/api/src/modules/pp/presentation/pp-orders.controller.ts
git commit -m "$(cat <<'EOF'
feat(pp): 7-status lifecycle + transition validation + audit log (EP-PP-082)

- production-orders.service.ts: ALLOWED_TRANSITIONS state machine
  (reja→tasdiqlangan→ishga_tushgan→jarayonda→sifatda→tugadi→yopildi
  + bekor/toxtatilgan); reason majburiy terminal statuslar uchun
- production-orders.service.ts: pp_order_status_log INSERT (DDL Gate:
  jadval yo'q bo'lsa warn loglanadi, asosiy op davom etadi)
- production-orders.service.ts: frozen_until guard (muzlatilgan zone)
- pp-orders.controller.ts: PATCH /:id/status yangi endpoint;
  ProductionOrdersService inject; ForbiddenException frozen uchun
- ALLOWED_TRANSITIONS: 9 status, 403 frozen guard, 400 invalid transition

DDL Gate: p13-pp-techcard-lifecycle.sql GATED (APPROVED: kerak).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Commit 3 — pp.module.ts: PapkaOrdersController + P14/P53 provayderlar (P13 = yagona ega)

> P13 pp.module.ts ning yagona egasi (§2.6b). Bu commit P13 ning o'z controllerini VA P14/P53 provayderlarini bitta sweepda ro'yxatdan o'tkazadi (QADAM 4b). Agar P14/P53 fayllari hali yaratilmagan bo'lsa — faqat PapkaOrdersController commit qilinadi, P14/P53 qismi ular tugagach alohida commit bilan qo'shiladi.

```bash
git add apps/api/src/modules/pp/pp.module.ts
git commit -m "$(cat <<'EOF'
feat(pp): register PapkaOrdersController + P14/P53 providers in PpModule (single owner)

- PapkaOrdersController (agar topilsa) — /api/papka-orders route
  (TechCards.tsx + PlanningBoard.tsx ?status=pending_tech ishlatadi)
- P14 provayderlari: ShiftPlanService, ShiftPlanRepository,
  BrakReworkListener (P14 fayllarini yaratadi, P13 simlaydi)
- P53 provayderlari: GofraConversionController + GofraConversionService
  + { provide: GOFRA_CONVERSION_REPO, useClass: DrizzleGofraConversionRepo }
  (P53 conversion/* fayllarini yaratadi, P13 simlaydi)

pp.module.ts yagona egasi = P13 (manifest §5: 1 fayl = 1 ega) —
P14/P53 bu faylga tegmaydi.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Commit 4 — FE: deleteMutation + 7-status badge

```bash
git add artifacts/erp-dashboard/src/pages/TechCards.tsx
git add artifacts/erp-dashboard/src/pages/ProductionOrder360.tsx
git commit -m "$(cat <<'EOF'
feat(fe/pp): TechCards deleteMutation + ProductionOrder360 7-status badges

- TechCards.tsx: deleteConfirmId state + deleteMutation (useMutation →
  DELETE /api/technology/cards/:id) + ConfirmDialog (Qoida 14)
- ProductionOrder360.tsx: PP_7_STATUS_LABELS local override —
  reja/tasdiqlangan/ishga_tushgan/jarayonda/sifatda/tugadi/yopildi/
  bekor/toxtatilgan uchun to'g'ri badge label va variant (EP-PP-082)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Commit 5 — DDL migration fayli (GATED)

```bash
git add apps/api/src/shared/db/migrations/p13-pp-techcard-lifecycle.sql
git commit -m "$(cat <<'EOF'
chore(pp/ddl): GATED migration for 7-status + pp_order_status_log (EP-PP-082)

p13-pp-techcard-lifecycle.sql — ISHGA TUSHIRILMAGAN (Q-35 DDL Gate).
Egasi '-- APPROVED: <ism YYYY-MM-DD>' qo'shgunga qadar bajarilmaydi.

Tarkib:
- production_orders.status CHECK: 6 eski → 9 yangi (7+2 terminal)
- Eski status mapping UPDATE'lar (created→reja, in_progress→jarayonda va h.k.)
- ADD COLUMN: priority_flag / frozen_until / readiness_pct
- CREATE TABLE pp_order_status_log (order_id FK, who, when, reason)
- INDEX: idx_pp_order_status_log_order_id, changed_at DESC

DependsOn: P12 migration APPROVED va ishga tushirilgan bo'lishi shart.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## QISQACHA HOLAT HISOBOTI SHABLONI

Har qadam tugagandan keyin egaga quyidagi formatda hisobot ber:

```
P13 HOLAT HISOBOTI — [SANA] [VAQT]

✅ BAJARILDI:
  - Qadam 1: findMaterialAlternatives → 501 (fake o'chirildi)
  - Qadam 2: DELETE /technology/cards/:id/bom/:bomId (real DELETE, DB-proof PASS)
  - Qadam 3: 7-status transition validation + audit log (frozen guard)
  - Qadam 4: PapkaOrdersController — [topildi/topilmadi + flag]
  - Qadam 5: TechCards deleteMutation + ConfirmDialog
  - Qadam 6: ProductionOrder360 7-status badge fallback
  - Qadam 7: p13-pp-techcard-lifecycle.sql GATED faylda

⚠️ FLAGS (egasi qaror kerak):
  - [agar PapkaOrdersController topilmasa]: ...
  - [agar technology.service.ts deleteBomItem yo'q bo'lsa]: ...
  - [agar pp-orders.controller.ts Variant A/B tanlov]: ...

📊 TEKSHIRUV:
  - BE tsc: 0 xato / X xato (eski/yangi)
  - FE tsc: 0 xato / X xato (eski/yangi)
  - reviewer-result-pattern: FAIL: 0
  - reviewer-array-safety: FAIL: 0
  - /api/technology/materials/alternatives → 501 ✅
  - BOM DELETE round-trip → ✅
  - Status invalid transition → 400 ✅

🔒 DDL:
  - p13-pp-techcard-lifecycle.sql → GATED (APPROVED: placeholder)
  - Migration ISHGA TUSHIRILMAGAN ✅

Commits: [hash1] [hash2] [hash3] [hash4] [hash5]
```

---

## MUHIM ESLATMALAR

1. **P12 dependency:** Bu paket Wave 2 da. P12 (PP schema DDL) tugamagan bo'lsa — WAIT. `pp_order_status_log` jadval sxemasi P12'da bo'lishi mumkin — agar P12 uni yaratgan bo'lsa, migration qismini moslashtir.

2. **Raw SQL vs Drizzle:** `tech_card_bom`, `tech_card_routes`, `tech_card_versions` uchun Drizzle pgTable sxemalari `lib/db/src/schema/pp/` da yo'q (bu P12 scope). Shuning uchun bu jadvallar uchun raw SQL (`db.execute(sql\`...\`)`) maqbul — Qoida 3 (izoh qo'shilgan holda).

3. **`technology.service.ts` OWNED emas:** Agar `deleteBomItem` service metodi kerak bo'lsa va `technology.service.ts` OWNED emas — egaga flag. Service'ga tegmasdan faqat repo + controller yozing.

4. **Windows `nest watch` crash (Q-44):** Katta o'zgarishdan keyin backend tushishi mumkin — bu kod xatosi emas. `pnpm --filter @europrint/api run dev:unsafe` bilan qayta ishga tushir.

5. **Oltin zanjir (SD→PP→MES→QC→WMS→FIN):** PP module T1 core. O'zgarishlardan keyin oltin zanjir tekshiruvi: `docs/GOLDEN_THREAD_TEKSHIRUV.md` bo'yicha curl qadamlarini bajaring.
