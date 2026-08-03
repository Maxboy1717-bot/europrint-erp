# P14 — PP — Rejalashtirish (Production Planning): PP shift-plan + plan-fact 4-number entry + reason seed + brak→rework

> **Agent:** P14 · **Wave:** 4 · **DependsOn:** P12, P13
> **Slug:** `pp-shift-planfact`
> **DDL Gate:** `false` — DDL talab yo'q. Bu paket P12 da yaratilgan jadvallarni FAQAT ishlatadi (import qiladi). DDL/migration bu paketda YO'Q.
> **Vizyon manba:** `docs/audit/MUSLIMBEK-PROMT-05-PP-2026-06-08.md` PHASE 5 + EP-PP-023/053..057/072/073/091..093/107/110/127/128/135
> **Sana:** 2026-06-19

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI (EXECUTOR)**. Sessiya boshida majburiy:
1. `CLAUDE.md` + `docs/agent-constitution.md` o'qi
2. `git status` + `git log -5` + `git branch` tekshir
3. Backend `:3030` va Frontend `:5173` health tekshir
4. Boshqa parallel sessiya yoki worktree borligini tekshir (Q-24)

**WAVE 4 tartib:** P12 (PP production order lifecycle + pp-shift-plan.ts + pp-plan-fact.ts sxemalari) va P13 (PP brak DDL + reason schema) AVVAL tugagan bo'lishi SHART. `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallar P12 tomonidan yaratiladi — bu P14 ularni faqat import qiladi va CRUD mantiq yozadi. Agar bu jadvallar DB da yo'q bo'lsa — P12 ni avval bajar, bu paketga QAYTMA.

---

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin)

1. **Result\<T\>** — hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod bilan validate** — `class-validator` TAQIQ.
3. **Drizzle ORM** — raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri** — REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)** — faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)** — Bu paket DDL talab QILMAYDI. `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallar P12 egaligida — P12 da egasi APPROVED stamp bilan yaratiladi. `pp_reason_codes` seed ham P12 da (yagona). P14 faqat servis/repo/controller yozadi; `pp_reason_codes` ni FAQAT o'qiydi.
8. **git add \<aniq-fayl\>** faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** — log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify** — BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik (Q-40)** — TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + `docs/audit/MUSLIMBEK-PROMT-05-PP-2026-06-08.md`); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil:**

```
apps/api/src/modules/pp/production/shift-plan.service.ts          ← YANGI YARAT
apps/api/src/modules/pp/production/shift-plan.repository.ts       ← YANGI YARAT
apps/api/src/modules/pp/production/production-shift-reports.controller.ts  ← KENGAYTIR
artifacts/erp-dashboard/src/pages/ai-planning/AIShiftManagementPage.tsx    ← QAYTA YOZ
```

**Qo'shimcha (faqat tegishli bulmalar):**

```
apps/api/src/modules/pp/production/dto/production.dto.ts          ← yangi sxemalar qo'sh
```

> ⭐ **BOGLIQLIK — pp.module.ts (P14 TEGMAYDI):** `apps/api/src/modules/pp/pp.module.ts` P14 owned file EMAS. P14 ning `ShiftPlanService` / `ShiftPlanRepository` / `BrakReworkListener` provayderlari pp.module.ts ga **P13 (yagona egasi)** tomonidan ro'yxatdan o'tkaziladi (qarang P13 §2.6b + §4 QADAM 4b). **P14 bu faylga TEGMAYDI.**
>
> ⭐ **BOGLIQLIK — pp_reason_codes seed (P14 faqat o'qiydi):** `pp_reason_codes` jadval VA uning 11-qatorli seed'i **P12 da** (yagona — qarang P12 §5 DDL BLOK E). P14 alohida seed fayli YARATMAYDI; faqat tayyor `pp_reason_codes` jadvalini O'QIYDI (listReasonCodes).

> ⭐ **BOGLIQLIK ESLATMASI:** `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallar **P12 da yaratiladi** (pp-shift-plan.ts, pp-plan-fact.ts schema fayllari). Bu P14 paketi ularni faqat **import qilib ishlatadi** — HECH QANDAY `pgTable(...)` ta'rifi yozmaydi. `lib/db/src/schema/pp/pp-production.ts` fayliga teg TAQIQLANGAN — u P12 egaligida.

**DDL Gate:** Bu paketda DDL talab QILINMAYDI. `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallari P12 da APPROVED migration orqali yaratilgan bo'lishi SHART. `pp_reason_codes` seed ham P12 da (yagona — qarang P12 §5 BLOK E). Bu paket faqat servis/repo/controller yozadi va `pp_reason_codes` ni FAQAT o'qiydi.

> ⚠️ P12 bog'liqlik: `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallar **P12 da yaratiladi**, bu P14 emas. Agar bu jadvallar DB da yo'q bo'lsa — P12 ni avval bajar. P14 hech qachon bu jadvallarni CREATE qilmaydi.

---

## 2. VIZYON

### 2.1 Asosiy biznes maqsadi (EP-PP-072/073/092/055/093)

PP moduli = oltin-ip (SD→**PP**→MES→QC→WMS→FIN) ning yadrosidir. Bu P14 pакeti vizyon PHASE 5 ni (shift close + plan-fact 4-raqam + sabab kodi + brak→qayta ishlash) to'liq amalga oshiradi.

**Qabul mezonlari (EP-PP-092 — kitob: "Plan/Fakt vyrabotka / Ostalsya sdelat / Brak"):**

| Xususiyat | Vizyon talab | EP kod |
|-----------|-------------|---------|
| Smena rejasi CRUD | smena × stanok × buyurtma × operator + yordamchi, ден/ноч navbati | EP-PP-072/073/107 |
| 4-raqam yopish | reja / fakt / qolgan / brak — usta kiritadi smena yopilganda | EP-PP-092 |
| Sabab kodi majburiy | fakt < reja bo'lsa izoh kodi shart; yopilmagan = "bajarilmagan" | EP-PP-055/EP-PP-092 |
| 5 ta sabab guruhi | material yo'qligi / dastgoh buzilishi / kadr yetishmasligi / texnologik xato / reja noto'g'ri | EP-PP-055 (kitob EXACT) |
| Brak→rework | brak > 0 kirilganda avtomatik qayta-ishlash vazifasi yaratiladi | EP-PP-093 |
| Plan-fakt taqqoslash | 4 o'lcham × 4 metrik; haftalik ko'rinish asosiy | EP-PP-023/053/110 |

### 2.2 E1-E6 kesish qoidalari (PP uchun MAJBURIY)

- **E1:** AI kuzatadi, inson tasdiqlaydi. Avtomatik jarimalar/bloklar TAQIQ. Brak→rework = avtomatik TAKLIF, inson tasdiqlaydi (ConfirmDialog).
- **E2:** Operator tayinlash karta asosida (razryad/ko'nikma); mos kelmasa → ogohlantirish (blok emas).
- **E4:** Operator IoT-tablet = asosiy qurilma; 4-raqam yopish tablet orqali kiriladi (FE mobil-friendly).
- **E6:** Yagona haqiqat manbai: `production_orders` (holat), `warehouse_stock` (material), `entries` (GL) — duplikat dunyo yo'q.

### 2.3 Smena modeli

```
Har kun × Har stanok × 2 smena (ден 08:00-20:00 / noch 20:00-08:00)
pp_shift_plans:
  plan_date DATE
  smena: 'den' | 'noch'
  work_center_id → work_centers.id
  production_order_id → production_orders.id
  operator_id → users.id
  helper_id → users.id (ixtiyoriy)
  queue_position INTEGER  ← "Очеред" raqami
  planned_qty INTEGER
```

### 2.3b ZARUR navbat-mantig'i (⚠️ MUVOFIQLIK FIX 2026-06-19 — DEFERRED)

> **Konformans audit xulosasi:** "ZARUR navbat-mantig'i yo'q — qo'sh yoki defer-note qil."
> Egasi EP-PP-010/097: `priority_flag = 'zarur'` = eng yuqori ustuvorlik, UI'da **alohida blok**.
> EP-PP-058: ustuvorlik = eng yaqin muddat; teng bo'lsa mijoz darajasi; "Очеред" + "ЗАРУР" qo'llaydi.
>
> **ZARUR navbat talablari (egasi):**
> - `priority_flag = 'zarur'` bo'lgan buyurtmalar smena qatorida BIRINCHI joyga (queue_position = 0, boshqa zarur_lar oldida ham) avtomatik ko'tarilishi kerak.
> - UI'da `zarur` buyurtmalar **qizil/alohida blok** sifatida ko'rsatiladi (oddiy tartib bilan aralashtirilmaydi).
> - Bir smena/stanokda bir nechta `zarur` bo'lsa — ular orasida deadline bo'yicha tartiblanadi.
>
> **Nima uchun P14 da yo'q:** `priority_flag` ustuni P12 da `production_orders` ga qo'shiladi (GATED);
> smena qatori mantiqini P14 `ShiftPlanService` boshqaradi, lekin zarur-sort mantiqini bajarish uchun
> `production_orders.priority_flag` ustuni DB da mavjud bo'lishi SHART (P12 migration tasdiqlangandan keyin).
>
> **⚠️ DEFERRED:** ZARUR navbat-sort mantiqini `shift-plan.repository.ts` da implement qilish
> P12 migration APPROVED va tasdiqlangandan keyin bajariladi (P12 dependency).
> Joriy `listShiftPlans` raw SQL da `ORDER BY sp.plan_date DESC, sp.smena, sp.queue_position` —
> P12 approved bo'lganda qo'shimcha sort qo'shiladi:
> ```sql
> ORDER BY
>   CASE WHEN po.priority_flag = 'zarur' THEN 0 ELSE 1 END,  -- ZARUR birinchi
>   sp.plan_date DESC,
>   sp.smena,
>   sp.queue_position
> ```
> **🚩 FLAG P14:** ZARUR sort mantiqini `shift-plan.repository.ts:listShiftPlans` ga qo'shish —
> P12 APPROVED bo'lgandan keyin, alohida commit bilan. FE `AIShiftManagementPage.tsx` da
> `zarur` badge/blok qo'shish ham shu faza (P12 dependency).

### 2.4 4-raqam yopish modeli

```
pp_plan_fact_entries:
  shift_plan_id → pp_shift_plans.id
  reja INTEGER NOT NULL     ← smena uchun rejalashtirilgan miqdor
  fakt INTEGER NOT NULL     ← haqiqatda ishlab chiqarilgan
  qolgan INTEGER NOT NULL   ← (reja - fakt) > 0 bo'lsa; operatordan olinadi
  brak INTEGER DEFAULT 0    ← rad etilgan miqdor
  reason_code VARCHAR(50)   ← pp_reason_codes.code dan; fakt < reja bo'lsa MAJBURIY
  reason_text TEXT          ← ixtiyoriy izoh
  closed_by → users.id      ← yopgan usta
  closed_at TIMESTAMPTZ
```

### 2.5 5+1 sabab guruhi (kitob EXACT + egasi "+ boshqa/izoh", EP-PP-055)

> ⚠️ **MUVOFIQLIK FIX (2026-06-19):** Guruh nomlari O'ZBEKCHA — inglizcha EMAS.
> P12 `pp_reason_codes_group_name_chk` CHECK o'zbekcha nomlarni kutadi.
> Avvalgi direktiva `equipment/staffing/technology/planning/other` degan edi — bu CHECK buzilishi.
> Kanonik to'plam: `material/dastgoh/kadr/texnologik/reja/boshqa` (P12 bilan mos).

| Kod | Guruh (kanonik) | Label UZ | Label RU |
|-----|-----------------|----------|----------|
| `material_yoqligi` | **material** | Material yo'qligi | Отсутствие материала |
| `material_sifati` | **material** | Material sifati past | Низкое качество материала |
| `dastgoh_buzilishi` | **dastgoh** | Dastgoh buzilishi | Поломка оборудования |
| `dastgoh_texservis` | **dastgoh** | Dastgoh texnik xizmati | ТО оборудования |
| `kadr_yetishmasligi` | **kadr** | Kadr yetishmasligi | Нехватка кадров |
| `kadr_kelmaslik` | **kadr** | Kadrning kelmasligi | Неявка сотрудника |
| `texnologik_xato` | **texnologik** | Texnologik xato | Технологическая ошибка |
| `texkarta_yoqligi` | **texnologik** | Texkarta yo'qligi | Отсутствие тех. карты |
| `reja_notogri` | **reja** | Reja noto'g'ri tuzilgan | Неверно составлен план |
| `buyurtma_ozgarishi` | **reja** | Buyurtma o'zgarishi | Изменение заказа |
| `boshqa_sabab` | **boshqa** | Boshqa sabab | Другая причина |

(6-guruh "boshqa" — egasi EP-PP-055 da "+ boshqa/izoh" degan; P12 CHECK ga qo'shildi)

### 2.6 Brak→Rework avtomatik tarmoq (EP-PP-093)

```
Shift yopilganda brak > 0:
  shortfall = production_orders.planned_qty - (SUM(fakt) - SUM(brak))
  if shortfall > 0:
    → EventEmitter2.emit('pp.brak.detected', { orderId, brakQty, shortfall, shiftPlanId })
    → ShiftPlanService listener:
        INSERT INTO production_orders (order_type='rework', parent_order_id=orderId,
          planned_qty=shortfall, status='reja', ...)
        → emit('pp.order.released') oltin-ip uchun
```

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (EXISTS)

| Fayl/Jadval | Satr | Holat |
|-------------|------|-------|
| `apps/api/src/modules/pp/production/production-shift-reports.controller.ts` | 1-126 | MAVJUD — `production_sessions` ustida ishlaydi (IoT smena, vizyon smena-plan EMAS) |
| `apps/api/src/modules/pp/production/production.service.ts` | 1-49 | MAVJUD — `listShiftReports/createShiftReport/closeShiftReport` — HAMMASI `production_sessions` jadvalida |
| `apps/api/src/modules/pp/production/production.repository.ts` | 1-95 | MAVJUD — raw SQL, `production_sessions` ga yozadi, `pp_shift_plans` YO'Q |
| `apps/api/src/modules/pp/production/dto/production.dto.ts` | 1-43 | MAVJUD — `shift_type: 'morning'/'afternoon'/'night'` (vizyon `den`/`noch` emas — MISMATCH) |
| `artifacts/erp-dashboard/src/pages/ai-planning/AIShiftManagementPage.tsx` | 1-84 | MAVJUD — `/api/ai/shift/recommendations` ga ulangan (AI modul — PP vizyon smena sahifasi EMAS) |
| `lib/db/src/schema/pp/pp-production.ts` | 48-95 | `work_centers` pgTable — `id: serial()` (integer), FK uchun ishlatiladi |
| `lib/db/src/schema/pp/pp-production.ts` | 446-492 | `production_orders` pgTable — status CHECK faqat 6 qiymat (`created/released/in_progress/completed/closed/qc_hold`) |
| `apps/api/src/modules/pp/pp.module.ts` | 80-82, 116-118, 157-158 | `ProductionService` + `ProductionRepository` ro'yxatdan o'tgan; `ProductionShiftReportsController` ham ro'yxatda |
| `apps/api/src/common/constants/erp-events.constants.ts` | 15 | `PP_RELEASED_TO_PRODUCTION: 'pp.order.released'` — mavjud |

### 3.2 Yo'q (MISSING — P14 da yaratilishi kerak)

> ⭐ `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` Drizzle sxemalari va DB jadvallari **P12 egaligida** — bu jadvallar P12 da yaratiladi. P14 bu ro'yxatda faqat **servis/repo/controller/FE** qismini yozadi.

| Nima yo'q | Qaerda kerak | EP kod | EGASI |
|-----------|-------------|---------|-------|
| `pp_shift_plans` Drizzle sxemasi | `lib/db/src/schema/pp/pp-shift-plan.ts` | EP-PP-072 | **P12** |
| `pp_plan_fact_entries` Drizzle sxemasi | `lib/db/src/schema/pp/pp-plan-fact.ts` | EP-PP-092 | **P12** |
| `pp_reason_codes` Drizzle sxemasi + DB | `lib/db/src/schema/pp/pp-plan-fact.ts` yoki alohida | EP-PP-055 | **P12** |
| `shift-plan.service.ts` | `apps/api/src/modules/pp/production/` | EP-PP-072/092/093 | **P14** |
| `shift-plan.repository.ts` | `apps/api/src/modules/pp/production/` | EP-PP-072/092 | **P14** |
| Shift-plan DTO sxemalari (Zod) | `dto/production.dto.ts` | — | **P14** |
| Brak→rework event trigger | `shift-plan.service.ts` | EP-PP-093 | **P14** |
| `PP_BRAK_DETECTED` event konstanta | `erp-events.constants.ts` | EP-PP-093 | **P14** (flag) |
| FE: ShiftPlan sahifasi `/pp/shift-management` (REAL) | `AIShiftManagementPage.tsx` | EP-PP-072/092 | **P14** |
| Seed: `pp_reason_codes` 5+1 guruh (o'zbekcha nom — fix 2026-06-19) | P12 §5 BLOK E (yagona) | EP-PP-055 | **P12** (P14 faqat o'qiydi) |
| ZARUR navbat-sort (`priority_flag='zarur'` → birinchi) | `shift-plan.repository.ts:listShiftPlans` | EP-PP-010/097/058 | **P14 (DEFERRED — P12 APPROVED keyin)** |

### 3.3 Buzuq/Soxta (BROKEN/FAKE)

| Fayl | Satr | Muammo |
|------|------|--------|
| `production.repository.ts` | 36 | `createShiftReport` — `production_sessions` ga yozadi, vizyon `pp_shift_plans` EMAS; smena vizyon ma'nosi YO'Q |
| `production.repository.ts` | 52 | `closeShiftReport` — `production_sessions.status='completed'` yozadi, 4-raqam KIRMAYDI |
| `AIShiftManagementPage.tsx` | 31-34 | `/api/ai/shift/recommendations` ga ulangan — AI moduli, PP smena vizyon sahifasi EMAS; ma'lumot YOLG'ON (ShiftRecommendation AI interface — real shift plan EMAS) |
| `production.dto.ts` | 9 | `shift_type: 'morning'/'afternoon'/'night'` — vizyon `den`/`noch` (EP-PP-107) — MISMATCH |
| `production_orders` status CHECK | 492 | Faqat 6 holat — vizyon 7 holat talab qiladi (`reja` holati yo'q — bu P12/P13 ishi; P14 da `reja` statusini ishlatamiz) |

> **P14 doirasi eslatmasi:** `production_orders` status CHECK muammosi P12/P13 tomonidan hal qilinishi kerak (owner approval bilan). P14 shu status mavjud deb taxmin qiladi. Agar `reja` statusi yo'q bo'lsa, rework order `created` statusida yaratiladi.

---

## 4. ISH (qadam-baqadam)

### Qadam 1 — P12 sxemalaridan import (JADVAL YOZMA, FAQAT IMPORT)

> ⭐ **BOGLIQLIK:** `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallar **P12 da yaratiladi** (pp-shift-plan.ts, pp-plan-fact.ts fayllarida). Bu P14 ular uchun **hech qanday `pgTable(...)` yozmaydi**. `lib/db/src/schema/pp/pp-production.ts` fayliga TEGILMAYDI — u P12 egaligida.
>
> Bu jadvallar P12 da yaratiladi, bu paket ularga FAQAT yozadi/oqiydi.

**P14 repository va service larida quyidagi importlardan foydalaniladi:**

```typescript
// shift-plan.repository.ts ichida — P12 sxemalaridan import
import {
  ppShiftPlans,
  ppPlanFactEntries,
  ppReasonCodes,
  PpShiftPlan,
  InsertPpShiftPlan,
  PpPlanFactEntry,
  InsertPpPlanFactEntry,
  PpReasonCode,
} from '@europrint/schemas';
// ↑ Bu eksportlar P12 da yaratilgan pp-shift-plan.ts / pp-plan-fact.ts dan keladi.
//   P14 hech qanday pgTable ta'rifi yozmaydi.
```

**P12 dan kutiluvchi eksport tuzilmasi** (P14 ular mavjud deb taxmin qiladi):
- `ppShiftPlans` — pgTable, `pp_shift_plans` ga mos
- `ppPlanFactEntries` — pgTable, `pp_plan_fact_entries` ga mos
- `ppReasonCodes` — pgTable, `pp_reason_codes` ga mos
- `PpShiftPlan`, `InsertPpShiftPlan` — type inference
- `PpPlanFactEntry`, `InsertPpPlanFactEntry` — type inference
- `PpReasonCode` — type inference

**Agar P12 bajarilmagan bo'lsa:** Bu importlar kompilyatsiya xato beradi. P12 ni avval bajar.

---

### Qadam 2 — DDL (P14 DAN TAQIQLANGAN)

> ❌ **P14 bu jadvallar uchun migration YOZMAYDI va ISHGA TUSHIRMAYDI.**
> `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` — bu jadvallarning DDL **P12 egaligida**.
> P12 da bu jadvallar yaratilgan bo'lishi SHART (egasi APPROVED stamp bilan).
>
> ⭐ Bu jadvallar P12 da yaratiladi, bu paket ularga FAQAT yozadi/oqiydi.

**P14 da Qadam 2 yo'q** — migration fayli yaratilmaydi, `CREATE TABLE` yozilmaydi, `psql -f` ishga tushirilmaydi. Bu qoida Q-35 (DDL faqat egasi ruxsati bilan) va BOGLIQLIK printsipiga muvofiq.

Agar `pp_shift_plans` DB da yo'q bo'lsa → **P12 ga qayt**, P12 ni bajar.

---

### Qadam 3 — pp_reason_codes seed P12 da (yagona); P14 faqat o'qiydi

> ⚠️ **MUVOFIQLIK FIX (2026-06-19):** `pp_reason_codes` seed (11 qator — 5+1 guruh, kanonik o'zbekcha nom) **P12 §5 DDL BLOK E da** (jadval egasi). Bu yagona seed manbai. P14 alohida `docs/migration/seed/pp-reason-codes-seed.sql` fayli YARATMAYDI — bu duplikat bo'lardi.
>
> **P14 doirasi:** P14 `pp_reason_codes` ni FAQAT o'qiydi (`ShiftPlanRepository.listReasonCodes` / `getReasonCodeByCode` — qarang Qadam 4). Hech qanday seed faylini yozmaydi va `INSERT INTO pp_reason_codes` qilmaydi.
>
> **Seed mazmuni** (P12 da — bu yerda faqat ma'lumot uchun, P14 nusxa OLMAYDI): `material_yoqligi/material_sifati` (material), `dastgoh_buzilishi/dastgoh_texservis` (dastgoh), `kadr_yetishmasligi/kadr_kelmaslik` (kadr), `texnologik_xato/texkarta_yoqligi` (texnologik), `reja_notogri/buyurtma_ozgarishi` (reja), `boshqa_sabab` (boshqa) — jami 11 kod, 6 guruh.

---

### Qadam 4 — Repository yaratish (`shift-plan.repository.ts`)

**Fayl:** `apps/api/src/modules/pp/production/shift-plan.repository.ts`

```typescript
/**
 * @module shift-plan.repository
 * @description Repository / data-access layer for pp_shift_plans + pp_plan_fact_entries
 *   + pp_reason_codes. Wraps Drizzle ORM; returns Result<T>.
 * EP-PP-072 (shift plan CRUD) · EP-PP-092 (4-number close) · EP-PP-055 (reason codes)
 */

import { Injectable } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { Ok, Err, Result, safeCall } from '@common/result';
import {
  ppShiftPlans,
  ppPlanFactEntries,
  ppReasonCodes,
  PpShiftPlan,
  InsertPpShiftPlan,
  PpPlanFactEntry,
  InsertPpPlanFactEntry,
  PpReasonCode,
} from '@europrint/schemas';

export interface ShiftPlanRow extends PpShiftPlan {
  orderCode?: string | null;
  workCenterName?: string | null;
  operatorName?: string | null;
  helperName?: string | null;
  planFactEntry?: PpPlanFactEntry | null;
}

export interface CreateShiftPlanDto {
  planDate: string;           // 'YYYY-MM-DD'
  smena: 'den' | 'noch';
  workCenterId: number;
  productionOrderId: number;
  operatorId?: number;
  helperId?: number;
  queuePosition?: number;
  plannedQty: number;
  notes?: string;
}

export interface CloseShiftPlanDto {
  reja: number;
  fakt: number;
  qolgan: number;
  brak: number;
  reasonCode?: string;
  reasonText?: string;
  closedBy: number;
}

@Injectable()
export class ShiftPlanRepository {
  // ── Smena Rejalari ──────────────────────────────────────────────────────────

  async listShiftPlans(
    planDate?: string,
    workCenterId?: number,
    limit = 50,
    offset = 0,
  ): Promise<Result<ShiftPlanRow[]>> {
    return safeCall(async () => {
      // NOTE: Drizzle multi-table JOIN uchun raw SQL ishlatildi (lateral join pattern)
      const rows = await db.execute<ShiftPlanRow>(sql`
        SELECT
          sp.*,
          po.papka_no              AS order_code,
          wc.name                  AS work_center_name,
          (u1.first_name || ' ' || u1.last_name) AS operator_name,
          (u2.first_name || ' ' || u2.last_name) AS helper_name,
          row_to_json(pfe.*)::jsonb AS plan_fact_entry
        FROM pp_shift_plans sp
        LEFT JOIN production_orders po ON po.id = sp.production_order_id
        LEFT JOIN work_centers wc      ON wc.id = sp.work_center_id
        LEFT JOIN users u1             ON u1.id = sp.operator_id
        LEFT JOIN users u2             ON u2.id = sp.helper_id
        LEFT JOIN pp_plan_fact_entries pfe ON pfe.shift_plan_id = sp.id
        WHERE 1=1
          ${planDate ? sql`AND sp.plan_date = ${planDate}` : sql``}
          ${workCenterId ? sql`AND sp.work_center_id = ${workCenterId}` : sql``}
        ORDER BY sp.plan_date DESC, sp.smena, sp.queue_position
        LIMIT ${limit} OFFSET ${offset}
      `);
      return Array.isArray(rows.rows) ? rows.rows : [];
    });
  }

  async getShiftPlanById(id: number): Promise<Result<ShiftPlanRow | null>> {
    return safeCall(async () => {
      const rows = await db.execute<ShiftPlanRow>(sql`
        SELECT
          sp.*,
          po.papka_no              AS order_code,
          wc.name                  AS work_center_name,
          (u1.first_name || ' ' || u1.last_name) AS operator_name,
          (u2.first_name || ' ' || u2.last_name) AS helper_name,
          row_to_json(pfe.*)::jsonb AS plan_fact_entry
        FROM pp_shift_plans sp
        LEFT JOIN production_orders po ON po.id = sp.production_order_id
        LEFT JOIN work_centers wc      ON wc.id = sp.work_center_id
        LEFT JOIN users u1             ON u1.id = sp.operator_id
        LEFT JOIN users u2             ON u2.id = sp.helper_id
        LEFT JOIN pp_plan_fact_entries pfe ON pfe.shift_plan_id = sp.id
        WHERE sp.id = ${id}
        LIMIT 1
      `);
      const r = Array.isArray(rows.rows) ? rows.rows[0] ?? null : null;
      return r;
    });
  }

  async createShiftPlan(dto: CreateShiftPlanDto): Promise<Result<PpShiftPlan>> {
    return safeCall(async () => {
      const inserted: InsertPpShiftPlan = {
        planDate: dto.planDate,
        smena: dto.smena,
        workCenterId: dto.workCenterId,
        productionOrderId: dto.productionOrderId,
        operatorId: dto.operatorId ?? null,
        helperId: dto.helperId ?? null,
        queuePosition: dto.queuePosition ?? 0,
        plannedQty: dto.plannedQty,
        notes: dto.notes ?? null,
      };
      const rows = await db.insert(ppShiftPlans).values(inserted).returning();
      if (!rows[0]) throw new Error('INSERT pp_shift_plans natija qaytarmadi');
      return rows[0];
    });
  }

  async updateShiftPlan(
    id: number,
    patch: Partial<CreateShiftPlanDto>,
  ): Promise<Result<PpShiftPlan | null>> {
    return safeCall(async () => {
      const rows = await db
        .update(ppShiftPlans)
        .set({
          ...(patch.operatorId !== undefined ? { operatorId: patch.operatorId } : {}),
          ...(patch.helperId !== undefined ? { helperId: patch.helperId } : {}),
          ...(patch.queuePosition !== undefined ? { queuePosition: patch.queuePosition } : {}),
          ...(patch.plannedQty !== undefined ? { plannedQty: patch.plannedQty } : {}),
          ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        })
        .where(eq(ppShiftPlans.id, id))
        .returning();
      return rows[0] ?? null;
    });
  }

  async deleteShiftPlan(id: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      // Faqat yopilmagan smenalarni o'chirish mumkin
      const existing = await db.select().from(ppPlanFactEntries)
        .where(eq(ppPlanFactEntries.shiftPlanId, id)).limit(1);
      if (existing.length > 0) {
        throw new Error('Yopilgan smena o\'chirib bo\'lmaydi');
      }
      await db.delete(ppShiftPlans).where(eq(ppShiftPlans.id, id));
      return true;
    });
  }

  // ── Plan-Fakt Yopish ────────────────────────────────────────────────────────

  /**
   * Smena yopish: 4-raqam kiritish (reja/fakt/qolgan/brak).
   * fakt < reja bo'lsa reasonCode MAJBURIY — servis tekshiradi.
   * Bir smena uchun faqat 1 ta yozuv mumkin (UPSERT mantiq).
   */
  async closeShiftPlan(
    shiftPlanId: number,
    dto: CloseShiftPlanDto,
  ): Promise<Result<PpPlanFactEntry>> {
    return safeCall(async () => {
      // Avval mavjud yozuv borligini tekshir
      const existing = await db.select().from(ppPlanFactEntries)
        .where(eq(ppPlanFactEntries.shiftPlanId, shiftPlanId)).limit(1);
      if (existing.length > 0) {
        throw new Error(`Smena id=${shiftPlanId} allaqachon yopilgan`);
      }
      const inserted: InsertPpPlanFactEntry = {
        shiftPlanId,
        reja: dto.reja,
        fakt: dto.fakt,
        qolgan: dto.qolgan,
        brak: dto.brak,
        reasonCode: dto.reasonCode ?? null,
        reasonText: dto.reasonText ?? null,
        closedBy: dto.closedBy,
        closedAt: new Date(),
      };
      const rows = await db.insert(ppPlanFactEntries).values(inserted).returning();
      if (!rows[0]) throw new Error('INSERT pp_plan_fact_entries natija qaytarmadi');
      return rows[0];
    });
  }

  async getPlanFactByShiftPlan(shiftPlanId: number): Promise<Result<PpPlanFactEntry | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(ppPlanFactEntries)
        .where(eq(ppPlanFactEntries.shiftPlanId, shiftPlanId)).limit(1);
      return rows[0] ?? null;
    });
  }

  /**
   * Plan-fakt taqqoslash: order × smena × stanok bo'yicha yig'ma.
   * EP-PP-023/053: 4 o'lcham, 4 metrik.
   */
  async getPlanFactSummary(params: {
    productionOrderId?: number;
    workCenterId?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db.execute<Record<string, unknown>>(sql`
        SELECT
          sp.plan_date,
          sp.smena,
          sp.work_center_id,
          wc.name                   AS work_center_name,
          sp.production_order_id,
          po.papka_no               AS order_code,
          sp.operator_id,
          (u.first_name || ' ' || u.last_name) AS operator_name,
          pfe.reja,
          pfe.fakt,
          pfe.qolgan,
          pfe.brak,
          CASE WHEN pfe.reja > 0
               THEN ROUND((pfe.fakt::numeric / pfe.reja) * 100, 2)
               ELSE 0 END           AS fakt_pct,
          pfe.reason_code,
          rc.label_uz               AS reason_label,
          pfe.closed_at
        FROM pp_shift_plans sp
        JOIN pp_plan_fact_entries pfe ON pfe.shift_plan_id = sp.id
        LEFT JOIN work_centers wc   ON wc.id = sp.work_center_id
        LEFT JOIN production_orders po ON po.id = sp.production_order_id
        LEFT JOIN users u           ON u.id = sp.operator_id
        LEFT JOIN pp_reason_codes rc ON rc.code = pfe.reason_code
        WHERE 1=1
          ${params.productionOrderId ? sql`AND sp.production_order_id = ${params.productionOrderId}` : sql``}
          ${params.workCenterId ? sql`AND sp.work_center_id = ${params.workCenterId}` : sql``}
          ${params.fromDate ? sql`AND sp.plan_date >= ${params.fromDate}` : sql``}
          ${params.toDate ? sql`AND sp.plan_date <= ${params.toDate}` : sql``}
        ORDER BY sp.plan_date DESC, sp.smena
        LIMIT 200
      `);
      return Array.isArray(rows.rows) ? rows.rows : [];
    });
  }

  // ── Sabab Kodlari ───────────────────────────────────────────────────────────

  async listReasonCodes(groupName?: string): Promise<Result<PpReasonCode[]>> {
    return safeCall(async () => {
      const rows = groupName
        ? await db.select().from(ppReasonCodes)
            .where(and(eq(ppReasonCodes.groupName, groupName), eq(ppReasonCodes.isActive, true)))
            .orderBy(ppReasonCodes.code)
        : await db.select().from(ppReasonCodes)
            .where(eq(ppReasonCodes.isActive, true))
            .orderBy(ppReasonCodes.groupName, ppReasonCodes.code);
      return rows;
    });
  }

  async getReasonCodeByCode(code: string): Promise<Result<PpReasonCode | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(ppReasonCodes)
        .where(eq(ppReasonCodes.code, code)).limit(1);
      return rows[0] ?? null;
    });
  }

  // ── Brak yig'ma (rework trigger uchun) ─────────────────────────────────────

  /**
   * Berilgan production_order uchun jami fakt va brak miqdorini hisoblaydi.
   * Rework shortfall = planned_qty - (sum(fakt) - sum(brak))
   */
  async getOrderPlanFactTotals(productionOrderId: number): Promise<Result<{
    sumReja: number;
    sumFakt: number;
    sumBrak: number;
    shortfall: number;
    plannedQty: number;
  }>> {
    return safeCall(async () => {
      const rows = await db.execute<{
        sum_reja: string;
        sum_fakt: string;
        sum_brak: string;
        planned_qty: string;
      }>(sql`
        SELECT
          COALESCE(SUM(pfe.reja), 0)      AS sum_reja,
          COALESCE(SUM(pfe.fakt), 0)      AS sum_fakt,
          COALESCE(SUM(pfe.brak), 0)      AS sum_brak,
          po.planned_qty
        FROM pp_shift_plans sp
        JOIN pp_plan_fact_entries pfe ON pfe.shift_plan_id = sp.id
        JOIN production_orders po    ON po.id = sp.production_order_id
        WHERE sp.production_order_id = ${productionOrderId}
        GROUP BY po.planned_qty
      `);
      const r = rows.rows[0];
      if (!r) return { sumReja: 0, sumFakt: 0, sumBrak: 0, shortfall: 0, plannedQty: 0 };
      const sumFakt = Number(r.sum_fakt);
      const sumBrak = Number(r.sum_brak);
      const plannedQty = Number(r.planned_qty);
      const shortfall = Math.max(0, plannedQty - (sumFakt - sumBrak));
      return {
        sumReja: Number(r.sum_reja),
        sumFakt,
        sumBrak,
        shortfall,
        plannedQty,
      };
    });
  }
}
```

---

### Qadam 5 — Service yaratish (`shift-plan.service.ts`)

**Fayl:** `apps/api/src/modules/pp/production/shift-plan.service.ts`

**Muhim biznes qoidalar bu yerda:**
- `fakt < reja` bo'lsa `reasonCode` MAJBURIY (EP-PP-055/092)
- `brak > 0` bo'lsa → rework event emit qilinadi (EP-PP-093)
- E1 qoidasi: rework taklif qilinadi, human confirms (controller da ConfirmDialog FE tomonida)

```typescript
/**
 * @module shift-plan.service
 * @description Business-logic for PP shift planning + plan-fact 4-number entry.
 * EP-PP-072 (shift CRUD) · EP-PP-092 (close) · EP-PP-055 (reason) · EP-PP-093 (brak→rework)
 * E1: AI observes → human confirms; no auto-block/penalty.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  ShiftPlanRepository,
  CreateShiftPlanDto,
  CloseShiftPlanDto,
  ShiftPlanRow,
} from './shift-plan.repository';
import { PpShiftPlan, PpPlanFactEntry, PpReasonCode } from '@europrint/schemas';

/** EP-PP-093: Brak aniqlanganda emit qilinadigan event payload */
export interface PpBrakDetectedPayload {
  productionOrderId: number;
  shiftPlanId: number;
  brakQty: number;
  shortfall: number;    // plannedQty - (sumFakt - sumBrak)
  closedBy: number;
}

@Injectable()
export class ShiftPlanService {
  private readonly logger = new Logger(ShiftPlanService.name);

  constructor(
    private readonly repo: ShiftPlanRepository,
    private readonly events: EventEmitter2,
  ) {}

  // ── Smena Rejalari ──────────────────────────────────────────────────────────

  async listShiftPlans(params: {
    planDate?: string;
    workCenterId?: number;
    page?: number;
    limit?: number;
  }): Promise<Result<ShiftPlanRow[]>> {
    const limit = Math.min(params.limit ?? 50, 200);
    const offset = ((params.page ?? 1) - 1) * limit;
    return this.repo.listShiftPlans(params.planDate, params.workCenterId, limit, offset);
  }

  async getShiftPlan(id: number): Promise<Result<ShiftPlanRow | null>> {
    if (!Number.isFinite(id) || id <= 0) {
      return Err(AppErr('VALIDATION', 'Noto\'g\'ri smena rejasi ID'));
    }
    return this.repo.getShiftPlanById(id);
  }

  async createShiftPlan(dto: CreateShiftPlanDto): Promise<Result<PpShiftPlan>> {
    // Smena qiymati tekshiruvi
    if (!['den', 'noch'].includes(dto.smena)) {
      return Err(AppErr('VALIDATION', 'smena faqat "den" yoki "noch" bo\'lishi mumkin'));
    }
    // Sana formati tekshiruvi
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.planDate)) {
      return Err(AppErr('VALIDATION', 'plan_date YYYY-MM-DD formatida bo\'lishi kerak'));
    }
    if (dto.plannedQty <= 0) {
      return Err(AppErr('VALIDATION', 'planned_qty musbat bo\'lishi kerak'));
    }
    return this.repo.createShiftPlan(dto);
  }

  async updateShiftPlan(
    id: number,
    patch: Partial<CreateShiftPlanDto>,
  ): Promise<Result<PpShiftPlan | null>> {
    if (!Number.isFinite(id) || id <= 0) {
      return Err(AppErr('VALIDATION', 'Noto\'g\'ri smena rejasi ID'));
    }
    // Yopilgan smenani o'zgartirish mumkin emas
    const factR = await this.repo.getPlanFactByShiftPlan(id);
    if (factR.ok && factR.data !== null) {
      return Err(AppErr('CONFLICT', 'Yopilgan smena rejalashmasi o\'zgartirib bo\'lmaydi'));
    }
    return this.repo.updateShiftPlan(id, patch);
  }

  async deleteShiftPlan(id: number): Promise<Result<boolean>> {
    if (!Number.isFinite(id) || id <= 0) {
      return Err(AppErr('VALIDATION', 'Noto\'g\'ri smena rejasi ID'));
    }
    return this.repo.deleteShiftPlan(id);
  }

  // ── Plan-Fakt Yopish ────────────────────────────────────────────────────────

  /**
   * Smena yopish: 4-raqam kiritish.
   * Biznes qoidalar (EP-PP-092/055/093):
   *   1. fakt < reja → reasonCode MAJBURIY
   *   2. brak > 0 → shortfall hisoblash + 'pp.brak.detected' event emit
   *   3. E1: rework taklif (auto-block emas); FE da ConfirmDialog ko'rsatish
   */
  async closeShiftPlan(
    shiftPlanId: number,
    dto: CloseShiftPlanDto,
  ): Promise<Result<{ entry: PpPlanFactEntry; reworkSuggested: boolean; shortfall: number }>> {
    if (!Number.isFinite(shiftPlanId) || shiftPlanId <= 0) {
      return Err(AppErr('VALIDATION', 'Noto\'g\'ri shift_plan_id'));
    }

    // Smena mavjudligini tekshir
    const planR = await this.repo.getShiftPlanById(shiftPlanId);
    if (!planR.ok) return Err(planR.error);
    if (!planR.data) return Err(AppErr('NOT_FOUND', `Smena rejasi id=${shiftPlanId} topilmadi`));

    // EP-PP-092: fakt < reja bo'lsa reason MAJBURIY
    if (dto.fakt < dto.reja && !dto.reasonCode) {
      return Err(AppErr('VALIDATION', 'fakt < reja: reason_code majburiy (EP-PP-055)'));
    }

    // Sabab kodi validatsiyasi (agar berilgan bo'lsa)
    if (dto.reasonCode) {
      const rcR = await this.repo.getReasonCodeByCode(dto.reasonCode);
      if (!rcR.ok) return Err(rcR.error);
      if (!rcR.data) {
        return Err(AppErr('VALIDATION', `Noto'g'ri reason_code: ${dto.reasonCode}`));
      }
    }

    // Smena yopish
    const entryR = await this.repo.closeShiftPlan(shiftPlanId, dto);
    if (!entryR.ok) return Err(entryR.error);

    const productionOrderId = planR.data.productionOrderId;

    // EP-PP-093: brak > 0 → shortfall hisoblash + event emit
    let reworkSuggested = false;
    let shortfall = 0;

    if (dto.brak > 0) {
      const totalsR = await this.repo.getOrderPlanFactTotals(productionOrderId);
      if (totalsR.ok && totalsR.data.shortfall > 0) {
        shortfall = totalsR.data.shortfall;
        reworkSuggested = true;

        const payload: PpBrakDetectedPayload = {
          productionOrderId,
          shiftPlanId,
          brakQty: dto.brak,
          shortfall,
          closedBy: dto.closedBy,
        };

        // E1: event emit qilinadi; listener rework order yaratishni TAKLIF qiladi
        // (auto-create emas — FE da ConfirmDialog; inson tasdiqlaydi)
        this.events.emit('pp.brak.detected', payload);
        this.logger.log(
          `Brak aniqlandi: orderId=${productionOrderId} brak=${dto.brak} shortfall=${shortfall}`
        );
      }
    }

    return Ok({ entry: entryR.data, reworkSuggested, shortfall });
  }

  async getPlanFactSummary(params: {
    productionOrderId?: number;
    workCenterId?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getPlanFactSummary(params);
  }

  // ── Sabab Kodlari ───────────────────────────────────────────────────────────

  async listReasonCodes(groupName?: string): Promise<Result<PpReasonCode[]>> {
    return this.repo.listReasonCodes(groupName);
  }
}
```

---

### Qadam 6 — Brak→Rework Listener (PP ichida, `shift-plan.service.ts` yonida)

**Fayl:** `apps/api/src/modules/pp/production/brak-rework.listener.ts` — **P14 YARATADI** (yangi fayl, mavjud kodga tegmaydi).

> **MUHIM — ro'yxatdan o'tkazish P13 da:** Bu listenerni `pp.module.ts` da ro'yxatdan o'tkazish kerak. pp.module.ts ning **yagona egasi = P13** (manifest §5: 1 fayl = 1 ega). Shuning uchun P14 listener FAYLINI yaratadi, lekin uni pp.module.ts ga **P13 ro'yxatdan o'tkazadi** (P13 §2.6b + §4 QADAM 4b — `ShiftPlanService` + `ShiftPlanRepository` + `BrakReworkListener` birga). P14 pp.module.ts ga TEGMAYDI.

Vaqtincha: `shift-plan.service.ts` ichida eventni emit qilamiz (yuqorida ko'rsatilgan), lekin rework order yaratish uchun alohida listener kerak. Listener faylini P14 yaratadi; P13 uni providers[] ga qo'shadi.

**Minimal listener kodi (agar ruxsat berilsa):**

```typescript
// apps/api/src/modules/pp/production/brak-rework.listener.ts
// P14 yaratadi; pp.module.ts da ro'yxatdan o'tkazish — P13 (yagona ega, §2.6b/QADAM 4b)
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { PpBrakDetectedPayload } from './shift-plan.service';

@Injectable()
export class BrakReworkListener {
  private readonly logger = new Logger(BrakReworkListener.name);

  @OnEvent('pp.brak.detected')
  async handle(payload: PpBrakDetectedPayload): Promise<void> {
    // E1: Bu yerda rework order TAKLIF qilinadi, log yoziladi.
    // Haqiqiy INSERT faqat inson tasdiqlagandan keyin (FE ConfirmDialog → POST /pp/shift-plans/:id/confirm-rework)
    this.logger.log(
      `[EP-PP-093] Brak aniqlandi: orderId=${payload.productionOrderId} ` +
      `brak=${payload.brakQty} shortfall=${payload.shortfall} — rework taklif qilinmoqda`
    );
    // TODO P50: confirm-rework endpoint orqali production_orders INSERT (order_type='rework')
  }
}
```

---

### Qadam 7 — DTO sxemalari (`dto/production.dto.ts` ga qo'sh)

**Fayl:** `apps/api/src/modules/pp/production/dto/production.dto.ts`

**Mavjud faylga QUYIDAGILARNI QO'SH (oxiriga):**

```typescript
// ── PP Shift Plan DTOlar (P14 — EP-PP-072/092/055) ──────────────────────────

export const CreateShiftPlanSchema = z.object({
  planDate:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
  smena:               z.enum(['den', 'noch']),
  workCenterId:        z.number().int().positive(),
  productionOrderId:   z.number().int().positive(),
  operatorId:          z.number().int().positive().optional(),
  helperId:            z.number().int().positive().optional(),
  queuePosition:       z.number().int().min(0).optional().default(0),
  plannedQty:          z.number().int().positive(),
  notes:               z.string().max(500).optional(),
});
export type CreateShiftPlanDto = z.infer<typeof CreateShiftPlanSchema>;

export const UpdateShiftPlanSchema = z.object({
  operatorId:          z.number().int().positive().optional(),
  helperId:            z.number().int().positive().optional(),
  queuePosition:       z.number().int().min(0).optional(),
  plannedQty:          z.number().int().positive().optional(),
  notes:               z.string().max(500).optional(),
});
export type UpdateShiftPlanSchema = z.infer<typeof UpdateShiftPlanSchema>;

export const CloseShiftPlanSchema = z.object({
  reja:                z.number().int().min(0),
  fakt:                z.number().int().min(0),
  qolgan:              z.number().int().min(0),
  brak:                z.number().int().min(0).default(0),
  reasonCode:          z.string().max(30).optional(),
  reasonText:          z.string().max(1000).optional(),
  closedBy:            z.number().int().positive(),
}).refine(
  (d) => d.fakt >= d.reja || !!d.reasonCode,
  { message: 'fakt < reja bo\'lsa reason_code majburiy (EP-PP-055)', path: ['reasonCode'] }
);
export type CloseShiftPlanDto = z.infer<typeof CloseShiftPlanSchema>;

export const ListShiftPlansQuerySchema = z.object({
  planDate:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  workCenterId:        z.coerce.number().int().positive().optional(),
  page:                z.coerce.number().int().positive().optional().default(1),
  limit:               z.coerce.number().int().positive().max(200).optional().default(50),
});
export type ListShiftPlansQueryDto = z.infer<typeof ListShiftPlansQuerySchema>;

export const PlanFactSummaryQuerySchema = z.object({
  productionOrderId:   z.coerce.number().int().positive().optional(),
  workCenterId:        z.coerce.number().int().positive().optional(),
  fromDate:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate:              z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type PlanFactSummaryQueryDto = z.infer<typeof PlanFactSummaryQuerySchema>;
```

---

### Qadam 8 — Controller kengaytirish (`production-shift-reports.controller.ts`)

**Fayl:** `apps/api/src/modules/pp/production/production-shift-reports.controller.ts`

**Holat:** Fayl mavjud (1-126 satr). `ProductionService` (`production_sessions`) ga ulangan. Shu faylga PP smena rejasi endpointlarini QO'SHAMIZ — mavjud kod O'CHIRILMAYDI (Q-46).

**Qo'shimcha import qatorlari (fayl boshiga, mavjud importlardan keyin):**

```typescript
import { ShiftPlanService } from './shift-plan.service';
import {
  CreateShiftPlanSchema, CreateShiftPlanDto,
  UpdateShiftPlanSchema,
  CloseShiftPlanSchema, CloseShiftPlanDto,
  ListShiftPlansQuerySchema, ListShiftPlansQueryDto,
  PlanFactSummaryQuerySchema,
} from './dto/production.dto';
```

**Constructor ga qo'sh:**

```typescript
// Oldin (50-satr):
constructor(private readonly svc: ProductionService) {}

// Keyin:
constructor(
  private readonly svc: ProductionService,
  private readonly shiftPlanSvc: ShiftPlanService,
) {}
```

**Faylning OXIRIGA (126-satrdan keyin) qo'shiluvchi yangi metodlar:**

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// PP SHIFT PLAN — EP-PP-072/073 (smena × stanok × buyurtma CRUD)
// ═══════════════════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Smena rejalari ro\'yxati (EP-PP-072)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shift-plans')
  @Roles(...PROD_ROLES)
  async listShiftPlans(@Query() rawQuery: unknown) {
    const query = ListShiftPlansQuerySchema.parse(rawQuery) as ListShiftPlansQueryDto;
    return unwrapOrThrow(await this.shiftPlanSvc.listShiftPlans({
      planDate:     query.planDate,
      workCenterId: query.workCenterId,
      page:         query.page,
      limit:        query.limit,
    }));
  }

  @ApiOperation({ summary: 'Smena rejasi (ID bo\'yicha, EP-PP-072)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('shift-plans/:id')
  @Roles(...PROD_ROLES)
  async getShiftPlan(@Param('id') id: string) {
    const r = await this.shiftPlanSvc.getShiftPlan(safeInt(id, 0));
    if (!r.ok) throwFromError(r.error);
    if (!r.data) throw new NotFoundException('Smena rejasi topilmadi');
    return r.data;
  }

  @ApiOperation({ summary: 'Smena rejasi yaratish (EP-PP-072)' })
  @ApiResponse({ status: 201, description: 'Yaratildi' })
  @Post('shift-plans')
  @Roles(...PROD_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateShiftPlanSchema))
  async createShiftPlan(@Body() body: CreateShiftPlanDto) {
    return unwrapOrThrow(await this.shiftPlanSvc.createShiftPlan(body));
  }

  @ApiOperation({ summary: 'Smena rejasini yangilash (EP-PP-072)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('shift-plans/:id')
  @Roles(...PROD_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateShiftPlanSchema))
  async updateShiftPlan(@Param('id') id: string, @Body() body: unknown) {
    const r = await this.shiftPlanSvc.updateShiftPlan(safeInt(id, 0), body as Record<string, unknown>);
    if (!r.ok) throwFromError(r.error);
    if (!r.data) throw new NotFoundException('Smena rejasi topilmadi');
    return r.data;
  }

  @ApiOperation({ summary: 'Smena rejasini o\'chirish' })
  @ApiResponse({ status: 200, description: 'O\'chirildi' })
  @Delete('shift-plans/:id')
  @Roles(...PROD_WRITE_ROLES)
  async deleteShiftPlan(@Param('id') id: string) {
    return unwrapOrThrow(await this.shiftPlanSvc.deleteShiftPlan(safeInt(id, 0)));
  }

  // ── Plan-Fakt Yopish (EP-PP-092) ─────────────────────────────────────────

  @ApiOperation({ summary: 'Smena yopish: 4-raqam kiritish (EP-PP-092)' })
  @ApiResponse({ status: 201, description: 'Yopildi; reworkSuggested=true bo\'lsa FE ConfirmDialog ko\'rsatsin' })
  @Post('shift-plans/:id/close')
  @Roles(...PROD_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CloseShiftPlanSchema))
  async closeShiftPlan(@Param('id') id: string, @Body() body: CloseShiftPlanDto) {
    return unwrapOrThrow(await this.shiftPlanSvc.closeShiftPlan(safeInt(id, 0), body));
  }

  // ── Plan-Fakt Taqqoslash (EP-PP-023/053) ────────────────────────────────

  @ApiOperation({ summary: 'Plan-fakt taqqoslash (EP-PP-023): order × smena × stanok' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('plan-fact-summary')
  @Roles(...PROD_ROLES)
  async planFactSummary(@Query() rawQuery: unknown) {
    const q = PlanFactSummaryQuerySchema.parse(rawQuery);
    return unwrapOrThrow(await this.shiftPlanSvc.getPlanFactSummary({
      productionOrderId: q.productionOrderId,
      workCenterId:      q.workCenterId,
      fromDate:          q.fromDate,
      toDate:            q.toDate,
    }));
  }

  // ── Sabab Kodlari (EP-PP-055) ────────────────────────────────────────────

  @ApiOperation({ summary: 'Sabab kodlari ro\'yxati (EP-PP-055)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reason-codes')
  @Roles(...PROD_ROLES)
  async listReasonCodes(@Query('group') group?: string) {
    return unwrapOrThrow(await this.shiftPlanSvc.listReasonCodes(group));
  }
```

**Import qo'shmalar (fayl boshiga, mavjud importlar bilan birga):**
- `Delete` — `@nestjs/common` dan (mavjud import qatoriga qo'sh)

---

### Qadam 9 — `pp.module.ts` — P13 ro'yxatdan o'tkazadi (P14 TEGMAYDI)

> **IZOLYATSIYA — YAGONA EGA:** `apps/api/src/modules/pp/pp.module.ts` ning **yagona egasi va commit qiluvchisi = P13** (manifest §5: 1 fayl = 1 ega). P14 bu faylga **TEGMAYDI** va commit qilmaydi.
>
> P14 ning `ShiftPlanService` / `ShiftPlanRepository` / `BrakReworkListener` provayderlarini pp.module.ts ga **P13 ro'yxatdan o'tkazadi** (P13 §2.6b + §4 QADAM 4b). P14 faqat shu fayllarni YARATADI (`shift-plan.service.ts`, `shift-plan.repository.ts`, `brak-rework.listener.ts`) va P13 ularni simlaydi.
>
> **P14 javobgarligi:** uchta fayl P13 import qila oladigan holatda — to'g'ri eksport nomlari (`ShiftPlanService`, `ShiftPlanRepository`, `BrakReworkListener`) bilan yaratilgan bo'lishi. Boshqa hech narsa.

**P14 da bu qadamda HECH QANDAY pp.module.ts tahriri yo'q.** (Avval bu qadam P50 ga defer qilingan edi — endi P13 yagona ega bo'lgani uchun defer kerak emas; P13 darhol simlaydi.)

---

### Qadam 10 — ERP Events konstantasiga qo'shish (🚩 FLAG)

> **IZOLYATSIYA:** `apps/api/src/common/constants/erp-events.constants.ts` shared fayl, P14 owned file emas.

🚩 **FLAG:** `erp-events.constants.ts` ga qo'shish kerak:

```typescript
// EP-PP-093: Brak aniqlanganda emit qilinadi → BrakReworkListener ushlaydi
PP_BRAK_DETECTED: 'pp.brak.detected',
```

Joriy holat: `PP_RELEASED_TO_PRODUCTION: 'pp.order.released'` (15-satr) mavjud. Yangi konstanta shu bilan birga qo'shiladi.

---

### Qadam 11 — FE sahifasini qayta yozish (`AIShiftManagementPage.tsx`)

**Fayl:** `artifacts/erp-dashboard/src/pages/ai-planning/AIShiftManagementPage.tsx`

**Holat:** Mavjud (1-84 satr) — `/api/ai/shift/recommendations` ga ulangan; bu PP smena vizyon sahifasi EMAS (AI tavsiya sahifasi).

**Muammo (Q-46):** Mavjud sahifa `/pp/shift-management` routiga yo'naltirilgan lekin noto'g'ri endpoint ishlatadi. Bu "ishlab turgan" kod emas — ma'lumot soxta (AI `ShiftRecommendation`, PP `pp_shift_plans` emas). Shuning uchun TO'LIQ qayta yoziladi (Q-46: to'g'ri ishlamaydigan → to'liq o'chiriladi/almashtiriladi).

**Yangi fayl (to'liq, vizyon EP-PP-072/092 ga mos):**

```typescript
/**
 * @module AIShiftManagementPage
 * @description PP Smena Rejalashtirish sahifasi. Route: /pp/shift-management
 * EP-PP-072 (shift plan CRUD, ден/ноч) · EP-PP-092 (4-number close) · EP-PP-055 (reason codes)
 * E1: brak→rework taklif, inson tasdiqlaydi (ConfirmDialog).
 * FE_STANDARTLAR: DedicatedPageShell + EP tokenlar + useQuery/useMutation naqshi.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Factory, User, CheckCircle2, AlertTriangle, Plus, X } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

// ─── Turlar ─────────────────────────────────────────────────────────────────

interface ShiftPlanRow {
  id: number;
  planDate: string;
  smena: 'den' | 'noch';
  workCenterId: number;
  productionOrderId: number;
  queuePosition: number;
  plannedQty: number;
  notes?: string | null;
  orderCode?: string | null;
  workCenterName?: string | null;
  operatorName?: string | null;
  helperName?: string | null;
  planFactEntry?: PlanFactEntry | null;
}

interface PlanFactEntry {
  id: number;
  reja: number;
  fakt: number;
  qolgan: number;
  brak: number;
  reasonCode?: string | null;
  reasonText?: string | null;
  closedAt?: string | null;
}

interface ReasonCode {
  id: number;
  code: string;
  groupName: string;
  labelUz: string;
  labelRu: string;
}

interface CloseFormState {
  shiftPlanId: number;
  reja: number;
  fakt: string;
  qolgan: string;
  brak: string;
  reasonCode: string;
  reasonText: string;
}

interface ReworkSuggestion {
  shiftPlanId: number;
  shortfall: number;
  productionOrderId: number;
}

// ─── Komponent ──────────────────────────────────────────────────────────────

export default function AIShiftManagementPage() {
  const { t } = useTranslation('pp');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [closeDialog, setCloseDialog] = useState<CloseFormState | null>(null);
  const [reworkDialog, setReworkDialog] = useState<ReworkSuggestion | null>(null);

  // ─── So'rovlar ─────────────────────────────────────────────────────────────

  const { data: plansData, isLoading: plansLoading } = useQuery<{ items?: ShiftPlanRow[] }>({
    queryKey: ["/api/production/shift-reports/shift-plans", selectedDate],
    queryFn: () => apiRequest("GET", `/api/production/shift-reports/shift-plans?planDate=${selectedDate}&limit=100`),
  });

  const { data: reasonsData } = useQuery<ReasonCode[]>({
    queryKey: ["/api/production/shift-reports/reason-codes"],
    queryFn: () => apiRequest("GET", "/api/production/shift-reports/reason-codes"),
  });

  const plans = selectArray<ShiftPlanRow>(plansData, "items");
  const reasons = Array.isArray(reasonsData) ? reasonsData : [];

  // ─── KPI Hisoblash ─────────────────────────────────────────────────────────
  const closedPlans = plans.filter((p) => p.planFactEntry !== null);
  const openPlans = plans.filter((p) => p.planFactEntry === null);
  const totalReja = closedPlans.reduce((s, p) => s + (p.planFactEntry?.reja ?? 0), 0);
  const totalFakt = closedPlans.reduce((s, p) => s + (p.planFactEntry?.fakt ?? 0), 0);
  const totalBrak = closedPlans.reduce((s, p) => s + (p.planFactEntry?.brak ?? 0), 0);
  const faktPct = totalReja > 0 ? Math.round((totalFakt / totalReja) * 100) : 0;

  // ─── Mutatsiyalar ──────────────────────────────────────────────────────────

  const closeMutation = useMutation({
    mutationFn: (payload: {
      id: number;
      reja: number; fakt: number; qolgan: number; brak: number;
      reasonCode?: string; reasonText?: string; closedBy: number;
    }) => apiRequest("POST", `/api/production/shift-reports/shift-plans/${payload.id}/close`, {
      reja: payload.reja,
      fakt: payload.fakt,
      qolgan: payload.qolgan,
      brak: payload.brak,
      reasonCode: payload.reasonCode || undefined,
      reasonText: payload.reasonText || undefined,
      closedBy: payload.closedBy,
    }),
    onSuccess: (resp: { entry: PlanFactEntry; reworkSuggested: boolean; shortfall: number }, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/production/shift-reports/shift-plans"] });
      toast({ title: t('shift.closed', "Smena muvaffaqiyatli yopildi") });
      setCloseDialog(null);
      // E1: rework taklif qilinadi, inson tasdiqlaydi
      if (resp.reworkSuggested && resp.shortfall > 0) {
        setReworkDialog({ shiftPlanId: vars.id, shortfall: resp.shortfall, productionOrderId: 0 });
      }
    },
    onError: (err: Error) => {
      toast({ title: t('shift.closeError', "Yopish xatosi"), description: err.message, variant: "destructive" });
    },
  });

  // Rework tasdiqlash (E1 — inson tasdiqlaydi)
  const reworkMutation = useMutation({
    mutationFn: (payload: { shiftPlanId: number; shortfall: number }) =>
      apiRequest("POST", `/api/production/shift-reports/shift-plans/${payload.shiftPlanId}/confirm-rework`, {
        shortfall: payload.shortfall,
      }),
    onSuccess: () => {
      toast({ title: t('shift.reworkCreated', "Qayta-ishlash buyurtmasi yaratildi") });
      setReworkDialog(null);
    },
    onError: (err: Error) => {
      toast({ title: t('shift.reworkError', "Rework xatosi"), description: err.message, variant: "destructive" });
    },
  });

  // ─── Yopish handler ────────────────────────────────────────────────────────

  const handleCloseSubmit = () => {
    if (!closeDialog) return;
    const fakt = parseInt(closeDialog.fakt, 10) || 0;
    const qolgan = parseInt(closeDialog.qolgan, 10) || 0;
    const brak = parseInt(closeDialog.brak, 10) || 0;
    // FE validatsiya (BE ham tekshiradi)
    if (fakt < closeDialog.reja && !closeDialog.reasonCode) {
      toast({ title: t('shift.reasonRequired', "Sabab kodi majburiy (fakt < reja)"), variant: "destructive" });
      return;
    }
    closeMutation.mutate({
      id: closeDialog.shiftPlanId,
      reja: closeDialog.reja,
      fakt,
      qolgan,
      brak,
      reasonCode: closeDialog.reasonCode || undefined,
      reasonText: closeDialog.reasonText || undefined,
      closedBy: 1, // TODO: joriy foydalanuvchi ID dan olish (useCurrentUser hook)
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DedicatedPageShell
      title={t('shift.title', "Smena Rejalashtirish")}
      description={t('shift.description', "Kunlik smena rejasi (ден/ноч) va plan-fakt kiritish")}
    >
      {/* Sana tanlash */}
      <div className="flex items-center gap-3 mb-4">
        <Label htmlFor="plan-date" className="text-sm font-medium">
          {t('shift.date', "Sana")}:
        </Label>
        <Input
          id="plan-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-44"
        />
      </div>

      {/* KPI kartalar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KpiCard
          label={t('shift.totalPlans', "Jami rejalashma")}
          value={plans.length}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          label={t('shift.openPlans', "Ochiq smenalar")}
          value={openPlans.length}
          icon={<Factory className="h-4 w-4" />}
          variant={openPlans.length > 0 ? "warning" : "success"}
        />
        <KpiCard
          label={t('shift.faktPct', "Fakt %")}
          value={`${faktPct}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant={faktPct >= 90 ? "success" : faktPct >= 70 ? "warning" : "danger"}
        />
        <KpiCard
          label={t('shift.totalBrak', "Jami brak")}
          value={totalBrak}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={totalBrak > 0 ? "danger" : "success"}
        />
      </div>

      {/* Smena rejalari jadvali */}
      <Section title={t('shift.plans', "Smena rejalari")}>
        {plansLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('shift.empty', `${selectedDate} uchun smena rejasi yo'q`)}
          </p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border rounded-md p-3 flex flex-col md:flex-row md:items-center justify-between gap-2"
                style={{ borderLeftColor: plan.smena === 'den' ? 'var(--ep-amber)' : 'var(--ep-blue)', borderLeftWidth: 3 }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={plan.smena === 'den' ? 'default' : 'outline'}>
                      {plan.smena === 'den' ? 'Kunduz' : 'Tun'}
                    </Badge>
                    <span className="font-medium text-sm">{plan.workCenterName ?? `WC#${plan.workCenterId}`}</span>
                    <span className="text-xs text-muted-foreground">№{plan.queuePosition}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Buyurtma: <span className="font-mono">{plan.orderCode ?? `#${plan.productionOrderId}`}</span></div>
                    <div className="flex gap-3">
                      <span><User className="h-3 w-3 inline mr-1" />{plan.operatorName ?? '—'}</span>
                      {plan.helperName && <span>Yordamchi: {plan.helperName}</span>}
                    </div>
                  </div>
                </div>

                {plan.planFactEntry ? (
                  /* Yopilgan smena */
                  <div className="flex flex-col items-end gap-1">
                    <EPStatusPill tone="success" className="text-xs">Yopilgan</EPStatusPill>
                    <div className="text-xs font-mono grid grid-cols-4 gap-2 text-center">
                      <div><div className="text-muted-foreground">Reja</div><div>{plan.planFactEntry.reja}</div></div>
                      <div><div className="text-muted-foreground">Fakt</div><div className={plan.planFactEntry.fakt < plan.planFactEntry.reja ? 'text-orange-500' : 'text-green-600'}>{plan.planFactEntry.fakt}</div></div>
                      <div><div className="text-muted-foreground">Qolgan</div><div>{plan.planFactEntry.qolgan}</div></div>
                      <div><div className="text-muted-foreground">Brak</div><div className={plan.planFactEntry.brak > 0 ? 'text-red-500' : ''}>{plan.planFactEntry.brak}</div></div>
                    </div>
                    {plan.planFactEntry.reasonCode && (
                      <span className="text-xs text-muted-foreground italic">{plan.planFactEntry.reasonCode}</span>
                    )}
                  </div>
                ) : (
                  /* Ochiq smena — yopish tugmasi */
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCloseDialog({
                      shiftPlanId: plan.id,
                      reja: plan.plannedQty,
                      fakt: '',
                      qolgan: '',
                      brak: '0',
                      reasonCode: '',
                      reasonText: '',
                    })}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t('shift.close', "Yop")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Smena yopish dialogi (4-raqam) ── */}
      <Dialog open={closeDialog !== null} onOpenChange={(open) => { if (!open) setCloseDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('shift.closeTitle', "Smena Yopish — 4 Raqam Kiritish")}</DialogTitle>
          </DialogHeader>
          {closeDialog && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t('shift.reja', "Reja")} *</Label>
                  <Input value={closeDialog.reja} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs">{t('shift.fakt', "Fakt")} *</Label>
                  <Input
                    type="number" min={0}
                    value={closeDialog.fakt}
                    onChange={(e) => setCloseDialog({ ...closeDialog, fakt: e.target.value })}
                    placeholder="Haqiqiy miqdor"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('shift.qolgan', "Qolgan")} *</Label>
                  <Input
                    type="number" min={0}
                    value={closeDialog.qolgan}
                    onChange={(e) => setCloseDialog({ ...closeDialog, qolgan: e.target.value })}
                    placeholder="Bajarilmagan miqdor"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('shift.brak', "Brak")}</Label>
                  <Input
                    type="number" min={0}
                    value={closeDialog.brak}
                    onChange={(e) => setCloseDialog({ ...closeDialog, brak: e.target.value })}
                    placeholder="Rad etilgan"
                  />
                </div>
              </div>

              {/* Sabab kodi — fakt < reja bo'lsa majburiy */}
              {(parseInt(closeDialog.fakt, 10) || 0) < closeDialog.reja && (
                <div className="space-y-2 border border-orange-200 rounded-md p-3 bg-orange-50">
                  <p className="text-xs text-orange-700 font-medium">
                    ⚠️ Fakt &lt; Reja — sabab kodi majburiy (EP-PP-055)
                  </p>
                  <div>
                    <Label className="text-xs">{t('shift.reasonCode', "Sabab kodi")} *</Label>
                    <Select
                      value={closeDialog.reasonCode}
                      onValueChange={(v) => setCloseDialog({ ...closeDialog, reasonCode: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sabab tanlang..." />
                      </SelectTrigger>
                      <SelectContent>
                        {reasons.map((r) => (
                          <SelectItem key={r.code} value={r.code}>
                            {r.labelUz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t('shift.reasonText', "Izoh (ixtiyoriy)")}</Label>
                    <Input
                      value={closeDialog.reasonText}
                      onChange={(e) => setCloseDialog({ ...closeDialog, reasonText: e.target.value })}
                      placeholder="Qo'shimcha izoh..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(null)}>
              <X className="h-3 w-3 mr-1" /> {t('common.cancel', "Bekor")}
            </Button>
            <Button onClick={handleCloseSubmit} disabled={closeMutation.isPending}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {closeMutation.isPending ? t('common.saving', "Saqlanmoqda...") : t('shift.closeBtn', "Yop")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rework taklif dialogi (E1: inson tasdiqlaydi) ── */}
      <Dialog open={reworkDialog !== null} onOpenChange={(open) => { if (!open) setReworkDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('shift.reworkTitle', "Brak Aniqlandi — Qayta Ishlash Taklifi")}</DialogTitle>
          </DialogHeader>
          {reworkDialog && (
            <div className="py-2 space-y-3">
              <p className="text-sm">
                Kamomad: <span className="font-bold text-red-500">{reworkDialog.shortfall} dona</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Tizim qayta-ishlash buyurtmasi yaratishni taklif qilmoqda (EP-PP-093).
                Tasdiqlaysizmi?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReworkDialog(null)}>
              {t('shift.reworkSkip', "Yo'q, keyinroq")}
            </Button>
            <Button
              onClick={() => reworkDialog && reworkMutation.mutate({
                shiftPlanId: reworkDialog.shiftPlanId,
                shortfall: reworkDialog.shortfall,
              })}
              disabled={reworkMutation.isPending}
            >
              {reworkMutation.isPending ? t('common.creating', "Yaratilmoqda...") : t('shift.reworkConfirm', "Ha, qayta-ishlash qo'sh")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DedicatedPageShell>
  );
}
```

---

## 5. DDL (MIGRATION)

> ❌ **P14 migration fayli YARATMAYDI.** `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallarining DDL **P12 egaligida** — egasi APPROVED stamp bilan P12 da bajaradi.
>
> ⭐ Bu jadvallar P12 da yaratiladi, bu paket ularga FAQAT yozadi/oqiydi. Q-35: DDL faqat egasi stamp qilganda ishlaydi; P14 bu jadvallar uchun DDL mualliflik qila olmaydi.

**P14 dan HECH QANDAY DDL yoki seed fayli yaratilmaydi.** `pp_reason_codes` jadval VA seed (11 qator) **P12 §5 BLOK E da** (yagona ega + yagona seed). P14 bu jadvalni FAQAT o'qiydi.

**Seed (P12 ishga tushiradi, P14 emas):** `pp_reason_codes` seed P12 migration ichida (BLOK E, `ON CONFLICT DO NOTHING` idempotent). P14 alohida seed faylga ega emas.

**Tekshiruv (P12 seed ishga tushgach):**
```bash
psql -U europrint -d europrint -c "SELECT COUNT(*) FROM pp_reason_codes"
# → 11 qator bo'lishi kerak (P12 seed dan)
```

---

## 6. QABUL MEZONI

### 6.1 Texnik mezoni

- [ ] BE `tsc 0` — typecheck xatosiz
- [ ] FE `tsc 0` — typecheck xatosiz
- [ ] `bash scripts/reviewer-result-pattern.sh` — FAIL: 0
- [ ] `bash scripts/reviewer-array-safety.sh` — FAIL: 0
- [ ] `bash scripts/reviewer-as-unknown.sh` — FAIL: 0 (yangi kod uchun)

### 6.2 DB isboti (Q-40 real-INSERT)

> Shart: `pp_shift_plans`, `pp_plan_fact_entries`, `pp_reason_codes` jadvallar P12 da AVVAL yaratilgan bo'lishi kerak. Bu jadvallar P14 migration tomonidan yaratilmaydi.

```sql
-- 1. pp_reason_codes toʻldirilgan (P12 seed dan — P14 faqat o'qiydi)
SELECT COUNT(*) FROM pp_reason_codes;
-- → 11 (P12 §5 BLOK E seed dan)

-- 2. pp_shift_plans CRUD
INSERT INTO pp_shift_plans (plan_date, smena, work_center_id, production_order_id, planned_qty)
VALUES ('2026-06-19', 'den', 1, 1, 100)
RETURNING id;
-- → id qaytishi kerak

-- 3. pp_plan_fact_entries yopish
INSERT INTO pp_plan_fact_entries (shift_plan_id, reja, fakt, qolgan, brak, closed_by, closed_at)
VALUES (<id>, 100, 85, 15, 5, 1, NOW())
RETURNING id;
-- → id qaytishi kerak

-- 4. Yopilgan smena qayta o'qish
SELECT sp.*, pfe.reja, pfe.fakt, pfe.brak
FROM pp_shift_plans sp
JOIN pp_plan_fact_entries pfe ON pfe.shift_plan_id = sp.id
WHERE sp.id = <id>;
-- → 1 qator, hamma ustunlar to'ldirilgan
```

### 6.3 HTTP isboti

```bash
# Auth token olish
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"..."}' | jq -r '.accessToken')

# 1. Sabab kodlari
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/production/shift-reports/reason-codes \
  | jq 'length'
# → 11

# 2. Smena rejasi yaratish
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planDate":"2026-06-19","smena":"den","workCenterId":1,"productionOrderId":1,"plannedQty":100}' \
  http://localhost:3030/api/production/shift-reports/shift-plans \
  | jq '.id'
# → yangi ID

# 3. Smena yopish (fakt < reja, reason bilan)
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reja":100,"fakt":80,"qolgan":20,"brak":5,"reasonCode":"EQP_001","closedBy":1}' \
  http://localhost:3030/api/production/shift-reports/shift-plans/<ID>/close \
  | jq '{entry:.entry.id, reworkSuggested:.reworkSuggested}'
# → {entry: <number>, reworkSuggested: false/true}

# 4. Plan-fakt taqqoslash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/production/shift-reports/plan-fact-summary?fromDate=2026-06-19" \
  | jq 'length'
# → 1+
```

### 6.4 FE isboti (Q-40 round-trip)

1. `/pp/shift-management` sahifasini oching
2. Bugungi sanani tanlang
3. Mavjud smena rejasi "Yop" tugmasini bosing
4. 4-raqam kiriting (fakt < reja → sabab kodi majburiy tekshiring)
5. "Yop" bosing → smena yopilgan ko'rsatilishi kerak
6. Sahifani qayta yuklang → yopilgan holat saqlanadi
7. Brak > 0 kiritsangiz → rework taklif dialogi chiqishi kerak

### 6.5 Vizyon moslik (Q-40/Q-12)

- [ ] EP-PP-072: smena × stanok × buyurtma × operator (ден/ноч) → `pp_shift_plans` ga yoziladi ✓
- [ ] EP-PP-092: 4-raqam (reja/fakt/qolgan/brak) → `pp_plan_fact_entries` ga yoziladi ✓
- [ ] EP-PP-055: 5+1 guruh sabab kodlari → `pp_reason_codes` da to'ldirilgan ✓
- [ ] EP-PP-093: brak > 0 → `pp.brak.detected` event emit qilinadi ✓
- [ ] E1: rework avtomatik YARATILMAYDI — taklif qilinadi, inson ConfirmDialog da tasdiqlaydi ✓
- [ ] E4: FE mobil-friendly (4-raqam yopish forma kichik ekranda ham ishlaydi) ✓

### 6.6 Oltin-ip regressiya tekshiruvi

```bash
# SD→PP→MES zanjiri buzilinmaganligini tekshir
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/pp/orders | jq '.total'
# → 0 dan ko'p (agar production_orders mavjud bo'lsa)

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/production/shift-reports | jq '.data | length'
# → Avvalgi natija (production_sessions BUZMAYDI — ular o'z endpointda qoladi)
```

---

## 7. SELF-VERIFY

```bash
# ── Backend typecheck ────────────────────────────────────────────────────────
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -5
# → 0 ta xato

# ── Frontend typecheck ───────────────────────────────────────────────────────
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | tail -5
# → 0 ta xato

# ── Reviewer skriptlar ───────────────────────────────────────────────────────
bash scripts/reviewer-result-pattern.sh 2>&1 | grep "FAIL:"
bash scripts/reviewer-array-safety.sh  2>&1 | grep "FAIL:"
bash scripts/reviewer-as-unknown.sh    2>&1 | grep "FAIL:"
# → Hamma FAIL: 0

# ── DB tekshiruv (Docker ichida) ─────────────────────────────────────────────
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "
  SELECT 'pp_shift_plans'      AS tbl, COUNT(*) FROM pp_shift_plans
  UNION ALL
  SELECT 'pp_plan_fact_entries',       COUNT(*) FROM pp_plan_fact_entries
  UNION ALL
  SELECT 'pp_reason_codes',            COUNT(*) FROM pp_reason_codes;
"
# → pp_reason_codes: 11 (seed to'ldirilgan)

# ── Yangi endpoint tekshiruvi ─────────────────────────────────────────────────
curl -sf http://localhost:3030/api/production/shift-reports/reason-codes \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
# → 11

# ── Mavjud endpointlar buzilmaganligini tekshir ───────────────────────────────
curl -sf http://localhost:3030/api/production/shift-reports | jq 'keys'
# → {data: [...], total: ...} (production_sessions hamon ishlaydi)
```

---

## 8. COMMIT

> ❌ `lib/db/src/schema/pp/pp-production.ts` ga teg TAQIQLANGAN — P12 egaligida.
> ❌ `docs/migration/pp-shift-planfact-p14.sql` yaratilmaydi — P14 DDL authoring qilmaydi.
> ❌ `docs/migration/seed/pp-reason-codes-seed.sql` yaratilmaydi — seed P12 da (yagona, §5 BLOK E). P14 `pp_reason_codes` ni faqat o'qiydi.
> ❌ `apps/api/src/modules/pp/pp.module.ts` ga teg TAQIQLANGAN — yagona egasi P13; provayderlarni P13 ro'yxatdan o'tkazadi (Qadam 9).

```bash
# ── 1. Repository + Service + Listener ───────────────────────────────────────
git add apps/api/src/modules/pp/production/shift-plan.repository.ts
git add apps/api/src/modules/pp/production/shift-plan.service.ts
git add apps/api/src/modules/pp/production/brak-rework.listener.ts
git commit -m "feat(pp): shift-plan repository + service + brak listener (CRUD + 4-number close + brak event EP-PP-072/092/093)"

# ── 2. DTO + Controller kengayish ────────────────────────────────────────────
git add apps/api/src/modules/pp/production/dto/production.dto.ts
git add apps/api/src/modules/pp/production/production-shift-reports.controller.ts
git commit -m "feat(pp): shift-plan + plan-fact + reason-codes endpoints on ProductionShiftReportsController"

# ── 3. FE sahifasi ───────────────────────────────────────────────────────────
git add artifacts/erp-dashboard/src/pages/ai-planning/AIShiftManagementPage.tsx
git commit -m "feat(pp/fe): AIShiftManagementPage → real PP shift plan + 4-number close + rework dialog (EP-PP-072/092/093)"
```

> ⚠️ **HECH QACHON:** `git add -A` yoki `git add .` ishlatma (Q-8). Faqat yuqoridagi aniq fayllar.
> ℹ️ pp.module.ts P14 commit ro'yxatida YO'Q — uni P13 (yagona ega) commit qiladi. Seed fayli ham YO'Q — P12 da.

---

## 9. FLAG JADVALI (P50 / Modul Egasi)

| # | Nima kerak | Qaerda | Sabab |
|---|-----------|--------|-------|
| ✅F1 | `pp.module.ts` ga `ShiftPlanService`, `ShiftPlanRepository`, `BrakReworkListener` qo'shish | **P13 (yagona ega)** — §2.6b/QADAM 4b | P14 pp.module.ts ga tegmaydi; P13 simlaydi (flag emas — hal qilingan) |
| 🚩F2 | `erp-events.constants.ts` ga `PP_BRAK_DETECTED: 'pp.brak.detected'` qo'shish | P50 yoki shared egasi | Shared fayl |
| 🚩F3 | `confirm-rework` endpoint yaratish (POST shift-plans/:id/confirm-rework → production_orders INSERT rework) | P50 | Rework order yaratish mantiq |
| 🚩F4 | `useCurrentUser()` hook FE da closedBy ni real JWT dan olishi | P14 FE yoki Auth modul | JWT foydalanuvchi ID kerak |
| 🚩F5 | `production_orders` status CHECK ga `reja` qo'shish (EP-PP-082) | P12/P13 | P14 `reja` statusini ishlatadi |

---

## 10. EDGE HOLATLAR VA OGOHLANTIRISHLAR

### 10.1 Bir smena — bir yozuv

`pp_plan_fact_entries` da bitta `shift_plan_id` uchun faqat bitta yozuv bo'lishi kerak. Repository `closeShiftPlan()` funksiyasi avval mavjudlikni tekshiradi va xato qaytaradi. Bu BE darajasida kafolatlanadi.

### 10.2 Fakt va qolgan munosabati

Vizyon bo'yicha (EP-PP-092): `qolgan = reja - fakt` (taxminan). Lekin operator uni qo'lda kiritadi, chunki qayta ishlash va smena o'tishi natijasida faktik qolgan operator biladi. Tizim `qolgan`ni avtomatik hisoblashga urinmaydi — operatorning kiritishi asosiy.

### 10.3 `production_orders.id` FK

`pp_shift_plans.production_order_id → production_orders.id` FK `ON DELETE RESTRICT`. Bu buyurtma o'chirilishini smena bog'liq bo'lsa oldini oladi.

### 10.4 Rework yaratish (E1)

`brak > 0` bo'lganda tizim `pp.brak.detected` event emit qiladi. FE `reworkSuggested: true` qiymatini oladi va ConfirmDialog ko'rsatadi. Foydalanuvchi "Ha" desa `confirm-rework` endpoint chaqiriladi (P50 da yaratiladi). Foydalanuvchi "Yo'q" desa — hech narsa bo'lmaydi, bu E1 qoidasiga mos.

### 10.5 `work_center_id` INTEGER, `productionOrders.id` INTEGER

`pp-production.ts` da `workCenters.id = serial("id").primaryKey()` — bu integer. FK muammo yo'q. `productionOrders.id` ham `serial` — integer. Sxemada to'g'ri belgilangan.

### 10.6 Parallel P12/P13 bog'liqlik

P12 `production_orders` 7-status lifecycle qo'shishi kerak (EP-PP-082). P14 rework order yaratganda `status='reja'` ishlatadi. Agar P12 tugamagan bo'lsa va `reja` statusi mavjud bo'lmasa — `status='created'` dan foydalaniladi (fallback). Rework order yaratish `confirm-rework` endpointida (P50) to'g'ri status tekshiriladi.

---

*Direktiva yozilgan: 2026-06-19 · Q-47 ≥1000 qator talabiga mos*
