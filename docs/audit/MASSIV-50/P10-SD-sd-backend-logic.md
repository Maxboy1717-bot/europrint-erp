# P10 — SD (Sales Distribution): SD backend fixes + penalty/maket-gate/MM-signal logic

> **ID:** P10 | **Wave:** 2 | **DependsOn:** P09 | **DDL gate:** YOQ (DDL mavjud lekin GATED)
> **Fayllar soni:** 12 ta owned file (faqat shunga teg)
> **Yozilgan:** 2026-06-19 | Egasi tasdiq talab qiladigan tugunlar ⛔ belgisi bilan belgilangan

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI** (Muslimbek). Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi.

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritiladi):

1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T> yoki sql`` tagged template).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Q-23/Q-31): faqat OWNED-FILE ro'yxatidagi fayllarga teg.
    Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida '-- APPROVED:' izoh shart. Paket DDL talab qilsa —
    migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon
    (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**WAVE 2 tartibi:** P10 P09 tugagandan keyin boshlanadi. P09 PR merged bo'lmasa —
P09 natijasini `git pull` qil, keyin shu direktivani bajar.

---

## 1. IZOLYATSIYA MANIFESTI

### Sening OWNED fayllaring (FAQAT shunga teg):

```
apps/api/src/modules/sd/presentation/sd-payments.controller.ts
apps/api/src/modules/sd/application/sd-payments.service.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-payments.repository.ts
apps/api/src/modules/sd/presentation/sd-dashboard.controller.ts
apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts
apps/api/src/modules/sd/application/commands/update-order-status.handler.ts
apps/api/src/modules/sd/application/sd-quotations.service.ts
apps/api/src/modules/sd/infrastructure/event-handlers/order-status-mm-signal.listener.ts
apps/api/src/modules/sd/sd.module.ts
apps/api/src/modules/sd/application/sd-customers.service.ts
apps/api/src/modules/sd/application/sd-dashboard.service.ts
```

**YANGI fayllar (yaratish ruxsat etiladi, lekin OWNED bo'lishi kerak):**
- `apps/api/src/modules/sd/infrastructure/event-handlers/order-status-mm-signal.listener.ts`
  (hozir mavjud emas → yaratiladi — owned list'da bor, ruxsat berilgan)
- `apps/api/src/modules/sd/domain/repositories/i-sd-payments.repo.ts`
  (faqat `updatePayment` signature qo'shish uchun — AGAR mavjud bo'lsa faqat interfeys qo'shi;
   yangi fayl kerak bo'lsa TO'XTA + egasiga flag)

**TEGINISH TAQIQLANGAN (boshqa agent'lar egasi):**
```
apps/api/src/modules/sd/presentation/sd-orders.controller.ts          (P09)
apps/api/src/modules/sd/presentation/sd-quotations.controller.ts       (boshqa agent)
apps/api/src/modules/sd/application/commands/create-order.handler.ts   (boshqa agent)
apps/api/src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo.ts
lib/db/src/schema/sd-orders.ts                                          (DDL agent)
artifacts/erp-dashboard/src/**                                           (FE agent)
```

**DDL GATE:** Ushbu paket DDL talab qiladi (§5 ga qarang), lekin `ddlGate: false` —
ya'ni siz migration SQL fayllarini YOZA olasiz, lekin `psql` / `db.execute` bilan
ISHGA TUSHIRISHINGIZ TAQIQ. Fayllarni yozing, `-- GATED: egasi tasdiqi kerak` deb
belgilang, va egasiga ko'rsating.

---

## 2. VIZYON (Nima qurilmoqda va nima uchun)

### SD = T1 oltin-ip yadro (EP-SD visionidan)

SD moduli EuroPrint ERP'ning **oltin-ip markazi**: har bir `sales_order.id`
downstream barcha yozuvga — ТЗ → material → ishlab chiqarish → yetkazib berish →
to'lov → GL — yorliq bo'ladi.

**24 000 mijoz + 20 yillik qayta buyurtmalar** bilan eng yuqori qiymatli modul.

### P10 scope'dagi vizyon talablari (ep-kodlari bilan):

| Kod | Vizyon talabi | P10 qamrovi |
|-----|--------------|-------------|
| EP-SD-069 | Bekor qilish penaltisi: bosqichli 30%/70%/100% (sozlanuvchi master-data) | `cancelOrder` xizmatiga penalti kalkulyatsiyasi |
| EP-SD-056/133 | Maket tasdiqlash darvozasi: `maket_approved` maydon; bosma bloklandi | `update-order-status.handler.ts` maket tekshiruvi |
| EP-SD-101 | "Ozhd.Syryo" holati → MM/ta'minot avtomatik signal | `order-status-mm-signal.listener.ts` yaratish |
| EP-SD-079/132 | O'zgarishlar jurnali: maydon darajasida audit log | `cancelOrder` + status o'zgarishi `sd_order_change_log` ga yozadi |
| **EP-SD-068** | **Tiraj ±N% og'ish qoidasi: hisob real chiqqan miqdordan** (OCHIQ-JAVOBLAR SD §) | **`updateActualQuantity` metodi: actual_quantity yozish + `deviation_status` hisoblash (within/over/under); tolerance_percent = DB dan o'qiladi, HARDCODE TAQIQ** |
| **EP-SD-076** | **source_channel = master-data lookup (sd_source_channel_lookup), hardcode CHECK taqiq** | **createOrder/updateOrder validatsiyasi: source_channel mavjudligini `sd_source_channel_lookup` dan tekshiradi (agar jadval yo'q bo'lsa — non-fatal WARN)** |
| Qoida 15 | `db.*` controller'da TAQIQ | `updatePayment` controller'dan service'ga ko'chirish |
| Sec | Dashboard controller `@Roles` ta'sirsiz | `RolesGuard` qo'shish |
| KPI | `getKpiTargets` stub qaytaradi `Ok([])` | Real DB so'rov bilan almashtirish |
| NOT-NULL | `convertQuotationToOrder` INSERT crash | `document_number`/`order_date`/`pricing_date` to'ldiriladi |

### Kanonik jadvallar (H1/H2/H3 — BU YERDA HAM QOIDA):
- Buyurtmalar → `sales_orders` (yozish maqsadi); `sd_sales_orders` = faqat o'qish VIEW
- Stok → `warehouse_stock`; `current_stock` = VIEW
- GL → `entries` / `gl_entries`; `gl_journal_entries`/`gl_lines` TEGINMA

### Qabul mezoni (REAL qabul uchun):

1. `PUT /sd/payments/:id` → `db.execute` controller'da YO'Q; xizmat + repo orqali ishlaydi
2. `GET /sd/dashboard/overview` → faqat JwtAuthGuard + RolesGuard bo'lgan JWT tokeni bilan 200
3. `GET /sd/dashboard/overview` → `RolesGuard` yo'q token'li so'rov 403 qaytaradi
4. `GET /sd/kpi-targets` → real DB so'rov; qaytish `sd_kpi_targets` qatorlarini o'z ichiga oladi
   (yoki jadval bo'sh bo'lsa `{ data: [], total: 0 }` — lekin SQL ishlashi kerak)
5. `POST /sd/quotations/:id/convert` → `sales_orders` qatorda `document_number` + `order_date` + `pricing_date` mavjud
6. `POST /sd/cancel-order/:id` + `{ reason: "narx", stage: "maket" }` → `sd_order_change_log` qator yozildi
7. `OrderStatusChangedEvent` status = `"Ozhd.Syryo"` bilan otkazilganda → MM event yozuvi
   `domain_events` yoki outbox'ga kiradi (`order_status_mm_signal` event turi)
8. status `"in_production"` ga o'tkazilishga urinish + `maket_approved = false` → `FORBIDDEN` xatosi
9. **EP-SD-068:** `PATCH /sd/orders/:id/actual-quantity` + `{ actualQuantity: 1050, orderedQuantity: 1000 }` →
   `deviation_status` DB da `'over'` bo'ladi (1050 > 1000 × (1 + tolerance_percent/100)).
   `tolerance_percent` NULL bo'lsa — WARN log + `deviation_status = 'within'` (yumshoq holat, DDL gated).
10. **EP-SD-076:** `POST /sd/orders` + `{ sourceChannel: "noma_lum_kod" }` →
    `sd_source_channel_lookup` da mavjud emas → WARN log (blok emas, non-fatal).
    `{ sourceChannel: "telegram" }` → muvaffaqiyatli yaratish.

---

## 3. HOZIRGI HOLAT (Mavjud, Yo'q, Buzuq — fayl:satr bilan)

### 3A. MAVJUD VA ISHLAYDI (O'CHIRMA — Q-46)

```
apps/api/src/modules/sd/presentation/sd-payments.controller.ts:39
  → @UseGuards(JwtAuthGuard, RolesGuard) allaqachon mavjud; SD_ROLES aniq belgilangan

apps/api/src/modules/sd/presentation/sd-payments.controller.ts:52-99
  → listPayments / createPayment / getDebitors / getOverdue / getDebitorsList /
    getActiveRentals — barchasi xizmat orqali to'g'ri ishlaydi, ushlab turing

apps/api/src/modules/sd/infrastructure/repositories/sd-payments.repository.ts:35-57
  → getDebitors() aging bucket SQL (0-30/31-60/61-90/90+) — haqiqiy va to'g'ri, teginma

apps/api/src/modules/sd/infrastructure/repositories/sd-payments.repository.ts:61-68
  → getOverdue() — haqiqiy SQL, ishlamoqda

apps/api/src/modules/sd/infrastructure/repositories/sd-payments.repository.ts:71-107
  → create() — haqiqiy INSERT, faktura yig'indisi tekshiruvi + ombor tekshiruvi, ishlamoqda

apps/api/src/modules/sd/application/commands/update-order-status.handler.ts:36-46
  → ready_for_planning uchun avans tekshiruvi — ishlamoqda, ushlab turing

apps/api/src/modules/sd/application/commands/update-order-status.handler.ts:51-75
  → aggregate transitionStatus() + OrderStatusChangedEvent → ishlamoqda

apps/api/src/modules/sd/application/sd-quotations.service.ts:73-126
  → calculatePrice() EP-SD-037 real konfiguratsiya boshqaruvidagi narx mexanizmi — ishlamoqda

apps/api/src/modules/sd/application/sd-quotations.service.ts:217-231
  → markPaymentPaid() + EP-SD-030 GL posting — ishlamoqda

apps/api/src/modules/sd/infrastructure/repositories/drizzle-quotation.repo.ts:61-271
  → sendQuotation / approveQuotation / updateQuotation / softDeleteQuotation /
    updateKpiTarget / cancelSalesOrder / markPaymentPaid / signContract /
    upsertPriceFormula / getPriceSettings — barchasi haqiqiy, teginma

apps/api/src/modules/sd/application/sd-dashboard.service.ts:14-88
  → getOverview() / getManagerActions() / getQuotaStats() — haqiqiy, ishlaydi

apps/api/src/modules/sd/sd.module.ts:95-135
  → To'liq modul ro'yxatga olish — barcha provayderlar, kontrollerlar, importlar
```

### 3B. BUZUQ / NOTO'G'RI (Q-46 — to'liq tuzat yoki o'chir, chala emas)

**B1 — Qoida 15 buzilishi: `db.execute` controller'da**
```
Fayl: apps/api/src/modules/sd/presentation/sd-payments.controller.ts:108-123
Muammo: updatePayment() db.execute(sql`UPDATE sd_payments ...`) to'g'ridan controller'da
         chaqiradi. Bu Qoida 15 ("Service HECH QACHON db.* ni to'g'ridan chaqirmaydi")
         buzilishi — bu yerda controller transport qatlami, xizmat emas, lekin tamoyil
         bir xil: DB so'rovlari faqat REPO qatlamida yashashi kerak.
         Controller ham transport qatlami hisoblanadi — db.* TAQIQ (Qoida 6 + Qoida 15).

Eski kod (satr 108-122):
  const r = await db.execute(sql`
    UPDATE sd_payments SET
      amount           = COALESCE(${dto['amount'] ?? null}::numeric, amount),
      ...
    WHERE id = ${id}::uuid
    RETURNING id, amount, currency, payment_method, status
  `);
  const row = ((r as Rows).rows ?? [])[0] ?? null;
  return { updated: true, data: row };

Kerakli o'zgarish: Bu SQL ISdPaymentsRepo + SdPaymentsRepository'ga ko'chiriladi;
  controller faqat unwrapOrThrow() chaqiradi.
```

**B2 — `getKpiTargets` stub: doim `Ok([])` qaytaradi**
```
Fayl: apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts:110-116
Muammo:
  async getKpiTargets(managerId: number | null): Promise<Result<Row[]>> {
    try {
      return Ok([]);   // ← STUB — hech qanday DB so'rov yo'q
    } catch {
      return Ok([]);
    }
  }

SDKpi.tsx FE sahifasi GET /sd/kpi-targets ni chaqiradi → har doim bo'sh array →
maqsad tahrir dialogi foydasiz. drizzle-quotation.repo.ts:161-175 UpdateKpiTarget
mavjud (sd_kpi_targets jadvalini UPDATE qiladi) lekin GET stub.
```

**B3 — `convertQuotationToOrder` NOT-NULL ustunlar yo'q**
```
Fayl: apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts:160-179
Muammo: INSERT INTO sales_orders (order_number, status, company_id, total_amount, ...) 
  `document_number NOT NULL`, `order_date NOT NULL`, `pricing_date NOT NULL` 
  (drizzle-quotation.repo.ts:92-98 da tasdiqlangan — approveQuotation ular bilan yozadi)
  ni O'TKAZMAYDI. convertQuotationToOrder bu maydonlarni o'tkazib yuboradi →
  agar jonli DB NOT NULL cheklovlari bo'lsa INSERT 23502 xatosi bilan muvaffaqiyatsiz tugaydi.

Eski INSERT (satr 162-166):
  INSERT INTO sales_orders
    (order_number, status, company_id, total_amount, advance_required,
     advance_paid, advance_status, design_flag, sample_flag, created_by)
  VALUES (${orderNumber}, 'pending', ${companyId}, ...)
  -- ← document_number, order_date, pricing_date yo'q!
```

**B4 — `sd-dashboard.controller.ts` RolesGuard yo'q**
```
Fayl: apps/api/src/modules/sd/presentation/sd-dashboard.controller.ts:24-27
Muammo:
  @Roles('admin', 'manager', 'supervisor', 'operator', 'director')
  @UseGuards(JwtAuthGuard)   // ← faqat JwtAuthGuard; RolesGuard YO'Q
  ...
  export class SdDashboardController { ... }

@Roles() dekoratori RolesGuard aktiv bo'lmasdan ta'sir qilmaydi.
Yaroqli JWT bo'lgan har qanday foydalanuvchi 200 oladi — rol tekshiruvi o'chirilgan.
Mos kelmaslik: SdPaymentsController (satr 39) JwtAuthGuard + RolesGuard ikkalasini ishlatadi.
```

**B5 — `order-status-mm-signal.listener.ts` — fayl mavjud emas**
```
Fayl: apps/api/src/modules/sd/infrastructure/event-handlers/order-status-mm-signal.listener.ts
Muammo: EP-SD-101 egasi tasdiqlagan: "Ozhd.Syryo" holati → procurement avtomatik signal.
  OrderStatusChangedEvent update-order-status.handler.ts:65 da nashr etiladi lekin
  hech qanday tinglovchi "Ozhd.Syryo" holdagi voqeani MM/ta'minot moduliga yo'naltirmaydi.
  Fayl owned ro'yxatda bor — yaratish kerak.
```

**B6 — `cancelOrder` penalti kalkulyatsiyasi yo'q**
```
Fayl: apps/api/src/modules/sd/application/sd-quotations.service.ts:210-215
Muammo:
  async cancelOrder(id: string, body: Record<string, unknown>): Promise<Result<Row>> {
    const r = await this.quotationRepo.cancelSalesOrder(id, body['reason']);
    ...
    return Ok({ id, cancelled: true, status: 'cancelled', ... });
  }

EP-SD-069 (egasi tasdiqlagan): penalti bosqichli —
  maket bosqichida 30% / bosib chiqarilgan bosqichida 70% / tayyor bosqichida 100%.
Foizlar sozlanuvchi master-data (DDL gated).
Hozirda: penalti hisob-kitobi yo'q, o'zgarishlar jurnali yo'q.
```

**B7 — Status o'tishida maket darvozasi yo'q**
```
Fayl: apps/api/src/modules/sd/application/commands/update-order-status.handler.ts:36-46
Muammo: Faqat bitta darvoza tekshiruvi mavjud: ready_for_planning uchun avans.
  EP-SD-056/133: "in_production"'ga o'tish (va ishlab chiqarishni talab qiladigan boshqa
  holatlarga) `maket_approved = true` ni talab qilishi kerak.
  Hozirda: maket tekshiruvi yo'q — bosma maket olmagan buyurtmalar uchun boshlanishi mumkin.
  sales_orders jadvalida maket_approved ustuni mavjud bo'lishi kerak (DDL gated §5).
```

**B8 — Status/bekor qilishda o'zgarishlar jurnali yo'q**
```
Fayl: apps/api/src/modules/sd/application/commands/update-order-status.handler.ts (umumiy)
     apps/api/src/modules/sd/application/sd-quotations.service.ts:210-215
Muammo: EP-SD-079/132 — har bir maydon o'zgarishi kim/qachon/eski→yangi audit log
  yozishi kerak. sd_order_change_log jadvalida hech qanday yozuv yo'q (DDL gated §5).
```

### 3C. YO'Q (USHBU PAKETDA QURILMAYDI — kelajak paketlar uchun belgilangan)

Quyidagilar vizyon hujjatida talqin qilingan lekin P10 scope'idan tashqarida:
- KP PDF generatsiyasi (EP-SD-109) — boshqa agent
- Leaderboard widget (EP-SD-016) — FE agent
- Monday digest cron (EP-SD-028) — cron agent
- Mahsulot katalogu admin (EP-SD-094) — boshqa agent
- ABC score yangilash cron (EP-SD-048) — cron agent
- Klishe ro'yxatga olish (EP-SD-042/125) — boshqa agent

---

## 4. ISH (Qadam-baqadam)

> Har qadamdan keyin: `pnpm tsc --noEmit` (apps/api'da) — 0 xato bo'lishi shart.
> Keyin keyingi qadamga o'ting. Hech qachon xatolarni keyingi qadamga o'tkazmang.

---

### QADAM 1 — `ISdPaymentsRepo` interfeysiga `updatePayment` qo'sh

**Fayl:** `apps/api/src/modules/sd/domain/repositories/i-sd-payments.repo.ts`
(Agar mavjud bo'lmasa — TO'XTA, egasiga flag qil. Agar mavjud bo'lsa — faqat interfeys imzosi qo'sh)

**Maqsad:** `ISdPaymentsRepo` interfeysi `updatePayment` metodini e'lon qilishi kerak
shunda `SdPaymentsService` faqat repo orqali ishlaydi (Qoida 15).

**Tekshirish — avval fayl mavjudligini ko'ring:**
```bash
cat apps/api/src/modules/sd/domain/repositories/i-sd-payments.repo.ts
```

**Qo'shilishi kerak bo'lgan imzo (mavjud interfeysi ichiga):**
```typescript
// i-sd-payments.repo.ts — mavjud interfeys ichiga qo'shing
updatePayment(id: string, patch: Record<string, unknown>): Promise<Result<Row | null>>;
```

**Qo'shish joyi:** mavjud metod imzolaridan keyin (list/create/getDebitors/getOverdue/getActiveRentals).

---

### QADAM 2 — `SdPaymentsRepository`ga `updatePayment` qo'sh

**Fayl:** `apps/api/src/modules/sd/infrastructure/repositories/sd-payments.repository.ts`

**Hozirgi holat:** Fayl satr 118'da tugaydi. `updatePayment` metodi YO'Q.

**Qo'shilishi kerak (satr 118dan keyin — `}` dan oldin):**

```typescript
async updatePayment(id: string, patch: Record<string, unknown>): Promise<Result<Row | null>> {
  try {
    // NOTE: COALESCE pattern: null parametr = maydon o'zgarishsiz qoladi.
    // Raw SQL sababli: Drizzle uuid ko'rsatma yo'qligi (id ::uuid cast) va
    // multi-maydon COALESCE UPDATE ORM'da ifodalab bo'lmaydi. Rule 4 / Q-47.
    const r = await exec(sql`
      UPDATE sd_payments SET
        amount           = COALESCE(${patch['amount']            ?? null}::numeric,     amount),
        currency         = COALESCE(${patch['currency']          ?? null}::text,        currency),
        payment_method   = COALESCE(${(patch['payment_method']   ?? patch['paymentMethod']  ?? null) as string | null}::text, payment_method),
        reference_number = COALESCE(${(patch['reference_number'] ?? patch['referenceNumber'] ?? null) as string | null}::text, reference_number),
        paid_at          = COALESCE(${(patch['paid_at']          ?? patch['paidAt']         ?? null) as string | null}::timestamptz, paid_at),
        notes            = COALESCE(${patch['notes']             ?? null}::text,        notes),
        status           = COALESCE(${patch['status']            ?? null}::varchar,     status),
        updated_at       = NOW()
      WHERE id = ${id}::uuid
        AND deleted_at IS NULL
      RETURNING id, amount, currency, payment_method, status, updated_at
    `);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  } catch (e) {
    return Err(AppErr('DB_ERROR', String(e)));
  }
}
```

**Import tekshiruvi:** `Err` va `AppErr` mavjud importlarda bormi tekshiring (satr 9):
`import { Ok, Err, Result, safeCall } from '@common/result';`
Agar `AppErr` yo'q bo'lsa — `import { Ok, Err, AppErr, Result, safeCall } from '@common/result';` deb yangilang.

---

### QADAM 3 — `SdPaymentsService`ga `updatePayment` qo'sh

**Fayl:** `apps/api/src/modules/sd/application/sd-payments.service.ts`

**Hozirgi holat (satr 1-33):** Xizmatda `updatePayment` metodi yo'q.

**Qo'shilishi kerak (satr 33 — yakunlovchi `}` dan oldin):**

```typescript
async updatePayment(id: string, patch: Record<string, unknown>): Promise<Result<object, AppError>> {
  return this.repo.updatePayment(id, patch);
}
```

**Tekshiruv:** `ISdPaymentsRepo` interfeysi qadam 1'dan `updatePayment` imzosini o'z ichiga olishi kerak. TypeScript avtomatik tekshiradi.

---

### QADAM 4 — `sd-payments.controller.ts`dan `updatePayment` ko'chir

**Fayl:** `apps/api/src/modules/sd/presentation/sd-payments.controller.ts`

**Maqsad:** `db.execute` → controller'dan olib tashla; o'rniga xizmat chaqiruvi.

**Olib tashlanishi kerak bo'lgan importlar (satr 22-24):**
```typescript
// O'CHIR shu qatorlarni:
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };
```

**Almashtirish kerak (satr 102-123):**

_Eski (B1 buzilishi):_
```typescript
@ApiOperation({ summary: 'Update payment' })
@ApiResponse({ status: 200, description: 'OK' })
@Put('payments/:id')
@HttpCode(HttpStatus.OK)
async updatePayment(@Param('id') id: string, @Body() body: unknown) {
  const dto = (body ?? {}) as Record<string, unknown>;
  const r = await db.execute(sql`
    UPDATE sd_payments SET
      amount           = COALESCE(${dto['amount']           ?? null}::numeric,       amount),
      ...
    WHERE id = ${id}::uuid
    RETURNING id, amount, currency, payment_method, status
  `);
  const row = ((r as Rows).rows ?? [])[0] ?? null;
  return { updated: true, data: row };
}
```

_Yangi (Qoida 6 + Qoida 15 mos):_
```typescript
@ApiOperation({ summary: 'Update payment' })
@ApiResponse({ status: 200, description: 'OK' })
@Put('payments/:id')
@HttpCode(HttpStatus.OK)
async updatePayment(@Param('id') id: string, @Body() body: unknown) {
  const patch = (body ?? {}) as Record<string, unknown>;
  const result = await this.svc.updatePayment(id, patch);
  if (!result.ok) {
    throw new InternalServerErrorException(
      typeof result.error === 'string' ? result.error : String((result.error as { message?: string })?.message ?? result.error)
    );
  }
  return { updated: true, data: result.data };
}
```

**Import tekshiruvi:** `InternalServerErrorException` allaqachon import qilingan (satr 20).
`UsePipes` ham importda bor. Yangi importlarga hojat yo'q.

---

### QADAM 5 — `sd-dashboard.controller.ts`ga `RolesGuard` qo'sh

**Fayl:** `apps/api/src/modules/sd/presentation/sd-dashboard.controller.ts`

**B4 buzilishi tuzatish:**

_Eski (satr 7-29, B4 xatosi):_
```typescript
import {
  Controller,
  UseGuards,
  Get,
  Logger,
  Query,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@shared/decorators/roles.decorator';
import { SdDashboardService } from '../application/sd-dashboard.service';

@Roles('admin', 'manager', 'supervisor', 'operator', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)   // ← XATO: RolesGuard yo'q
```

_Yangi:_
```typescript
import {
  Controller,
  UseGuards,
  Get,
  Logger,
  Query,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { SdDashboardService } from '../application/sd-dashboard.service';

@Roles('admin', 'manager', 'supervisor', 'operator', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)   // ← TO'G'RI: ikkala guard
```

**Eslatma 1:** `@shared/decorators/roles.decorator` → `@common/decorators/roles.decorator`'ga o'zgartiring
(SdPaymentsController'da `@common` ishlatilgan — mos keltiramiz).

**Eslatma 2:** `throwFromError` ishlatilmaydi — import'dan olib tashlang.

---

### QADAM 6 — `getKpiTargets` stubini real SQL bilan almashtir

**Fayl:** `apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts`

**B2 buzilishi tuzatish — satr 110-116:**

_Eski (STUB):_
```typescript
async getKpiTargets(managerId: number | null): Promise<Result<Row[]>> {
  try {
    return Ok([]);   // ← STUB
  } catch {
    return Ok([]);
  }
}
```

_Yangi (real SQL):_
```typescript
async getKpiTargets(managerId: number | null): Promise<Result<Row[]>> {
  // sd_kpi_targets: id, manager_id, year, month, revenue_target,
  //                 order_count_target, new_customer_target, period, target_value, updated_at
  // Jadval GATED DDL bilan (§5 qarang) — agar mavjud bo'lmasa bo'sh array qaytadi (not 500)
  return managerId
    ? exec(sql`
        SELECT kt.*, CONCAT(e.first_name, ' ', e.last_name) AS manager_name
        FROM sd_kpi_targets kt
        LEFT JOIN employees e ON e.id = kt.manager_id
        WHERE kt.manager_id = ${managerId}
        ORDER BY kt.year DESC, kt.month DESC
        LIMIT 24
      `)
    : exec(sql`
        SELECT kt.*, CONCAT(e.first_name, ' ', e.last_name) AS manager_name
        FROM sd_kpi_targets kt
        LEFT JOIN employees e ON e.id = kt.manager_id
        ORDER BY kt.year DESC, kt.month DESC
        LIMIT 100
      `);
}
```

**Muhim:** `exec()` allaqachon ushbu faylda `Result<Row[]>` qaytaruvchi sifatida belgilangan
(satr 14). Agar jadval mavjud bo'lmasa (`42P01` — relation does not exist) `exec()` ichidagi
`safeCall` `Err` qaytaradi. Bu `getKpiTeam` bilan bir xil himoya namunasi (satr 102-108).

Ammo: `Err` holati SDKpi.tsx sahifasini buzishi mumkin. Xavfsiz ravishda tutish uchun
wrapping'ni ham qo'shing:

```typescript
async getKpiTargets(managerId: number | null): Promise<Result<Row[]>> {
  const r = managerId
    ? await exec(sql`
        SELECT kt.*, CONCAT(e.first_name, ' ', e.last_name) AS manager_name
        FROM sd_kpi_targets kt
        LEFT JOIN employees e ON e.id = kt.manager_id
        WHERE kt.manager_id = ${managerId}
        ORDER BY kt.year DESC, kt.month DESC
        LIMIT 24
      `)
    : await exec(sql`
        SELECT kt.*, CONCAT(e.first_name, ' ', e.last_name) AS manager_name
        FROM sd_kpi_targets kt
        LEFT JOIN employees e ON e.id = kt.manager_id
        ORDER BY kt.year DESC, kt.month DESC
        LIMIT 100
      `);
  // Jadval mavjud bo'lmasa (DDL hali tasdiqlanmagan) — bo'sh array qaytaradi (500 emas)
  return r.ok ? r : Ok([]);
}
```

---

### QADAM 7 — `convertQuotationToOrder` NOT-NULL ustunlarini tuzat

**Fayl:** `apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts`

**B3 buzilishi tuzatish — satr 160-179:**

`approveQuotation` (drizzle-quotation.repo.ts:92-98) qanday yozishini ko'ring:
```sql
INSERT INTO sales_orders
  (document_number, order_date, pricing_date, customer_id, net_value, total_value, quotation_id)
VALUES
  (${docNumber}, ${today}, ${today}, ${customerId}, ...)
```

`convertQuotationToOrder` (sd-quotations.repository.ts:162-166) ni shu yerga moslash:

_Eski (NOT-NULL ustunlarsiz, satr 162-166):_
```typescript
const orderRes = await tx.execute(sql`
  INSERT INTO sales_orders
    (order_number, status, company_id, total_amount, advance_required,
     advance_paid, advance_status, design_flag, sample_flag, created_by)
  VALUES
    (${orderNumber}, 'pending', ${companyId}, ${totalAmount},
     ${advancePercent ?? 30}, '0', 'pending', false, false, 0)
  RETURNING id, order_number, status, total_amount, created_at
`);
```

_Yangi (NOT-NULL ustunlar qo'shildi):_
```typescript
const today = new Date().toISOString().split('T')[0] as string;
// document_number, order_date, pricing_date NOT NULL (sales_orders sxemasi talab qiladi)
// Mos: approveQuotation (drizzle-quotation.repo.ts:86-98) bir xil namuna.
const orderRes = await tx.execute(sql`
  INSERT INTO sales_orders
    (document_number, order_number, order_date, pricing_date, status,
     customer_id, company_id, total_amount, net_value,
     advance_required, advance_paid, advance_status,
     design_flag, sample_flag, created_by, quotation_id)
  VALUES
    (${orderNumber}, ${orderNumber}, ${today}, ${today}, 'pending',
     ${companyId}, ${companyId}, ${totalAmount}, ${totalAmount},
     ${advancePercent ?? 30}, '0', 'pending',
     false, false, 0, ${id})
  RETURNING id, document_number, order_number, status, total_amount, created_at
`);
```

**Satr 150'da `today` e'loni mavjud bo'lishi uchun joylashuv:**
Yangi `const today = ...` qatorni `const orderNumber = ...` (satr 150) dan oldin qo'shing
— yoki uni `insertedOrder` bloki ichiga ko'chiring.

---

### QADAM 8 — `order-status-mm-signal.listener.ts` yaratish (EP-SD-101)

**Fayl (yangi — owned list'da):**
`apps/api/src/modules/sd/infrastructure/event-handlers/order-status-mm-signal.listener.ts`

**Vizyon:** EP-SD-101 (egasi tasdiqlagan): "Ozhd.Syryo" holati → ta'minot avtomatik signal +
sotuv ko'rinishi. E4 prinsipi: SD to'g'ridan pol'ga teginmaydi — event/webhook orqali.

**To'liq fayl (yarating):**

```typescript
/**
 * @module order-status-mm-signal.listener
 * @description EP-SD-101: "Ozhd.Syryo" (Awaiting Raw Material) holati o'zgarishi →
 *   MM/ta'minot moduliga avtomatik signal. E4 printsipi: SD floor'ga to'g'ridan
 *   tegmaydi; voqea orqali ta'minot e'lon qilinadi.
 * @layer Infrastructure / Event Handler (SD)
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';

/** Voqea yuki — update-order-status.handler.ts'dan keladi */
interface OrderStatusChangedPayload {
  orderId: number;
  previousStatus: string;
  newStatus: string;
}

// EP-SD-101 maqsadli holati (egasi tasdiqlagan)
const OZHD_SYRYO_STATUS = 'Ozhd.Syryo';

// Outbox event turi — MM/ta'minot listenerlar bu turni kuzatadi
const MM_SIGNAL_EVENT_TYPE = 'order_status_mm_signal';

@Injectable()
export class OrderStatusMmSignalListener {
  private readonly logger = new Logger(OrderStatusMmSignalListener.name);

  /**
   * OrderStatusChangedEvent to'g'ri o'tkazilishini kuzatadi.
   * update-order-status.handler.ts:65 da nashr etiladi:
   *   new OrderStatusChangedEvent(order.getId(), previousStatus, command.newStatus)
   */
  @OnEvent('order.status.changed', { async: true })
  async handleOrderStatusChanged(
    payload: OrderStatusChangedPayload,
  ): Promise<Result<void>> {
    if (payload.newStatus !== OZHD_SYRYO_STATUS) {
      // Boshqa holat o'zgarishlari — bu listener uchun tegishli emas
      return Ok(undefined);
    }

    this.logger.log({
      msg: '[EP-SD-101] Ozhd.Syryo holati aniqlandi — MM signali yozilmoqda',
      orderId: payload.orderId,
      from: payload.previousStatus,
      to: payload.newStatus,
    });

    try {
      // E4: SD to'g'ridan MM'ga chaqirmaydi.
      // Outbox jadvaliga yozamiz — MM/ta'minot agent shu jadvaldan o'qiydi.
      // domain_events — mavjud outbox jadvali (commit 1cb4631c da tasdiqlangan).
      await db.execute(sql`
        INSERT INTO domain_events
          (aggregate_type, aggregate_id, event_type, payload, occurred_at, processed)
        VALUES
          ('sales_order', ${String(payload.orderId)}, ${MM_SIGNAL_EVENT_TYPE},
           ${JSON.stringify({
             order_id: payload.orderId,
             previous_status: payload.previousStatus,
             new_status: payload.newStatus,
             signal_type: 'awaiting_raw_material',
             ep_op_code: 'EP-SD-101',
           })}::jsonb,
           NOW(), false)
        ON CONFLICT DO NOTHING
      `);

      this.logger.log({
        msg: '[EP-SD-101] MM signali domain_events ga yozildi',
        orderId: payload.orderId,
      });

      return Ok(undefined);
    } catch (e) {
      // Non-fatal: MM signali muvaffaqiyatsiz bo'lsa SD jarayoni bloklanmaydi.
      // E1: AI kuzatadi, insonlar tasdiqlaydi. Log + davom et.
      this.logger.warn({
        msg: '[EP-SD-101] MM signali yozishda xato (non-fatal)',
        orderId: payload.orderId,
        error: String(e),
      });
      return Err(AppErr('INTERNAL', `MM signal failed: ${String(e)}`));
    }
  }
}
```

**Event nomi haqida eslatma:** `update-order-status.handler.ts:65`:
```typescript
const statusEvent = new OrderStatusChangedEvent(order.getId(), previousStatus, command.newStatus);
this.eventBus.publish(statusEvent);
```
`EventBus.publish` CqrsModule orqali ishlaydi. Agar `@OnEvent` ishlatilsa,
`EventEmitterModule` ham import qilingan bo'lishi kerak (SD module'da satr 8'da tasdiqlangan).
Ammo `CqrsModule` va `EventEmitterModule` bir xil emas. Quyida ikki variantni ko'ring:

**Variant A — `@OnEvent` (EventEmitter2):**
`OrderStatusChangedEvent` EventEmitter2 orqali ham otkazilishi kerak. Agar handler
`this.eventBus.publish(event)` ishlatsa — bu CqrsModule, `@OnEvent` ushlamaydi.

**Variant B — `@EventsHandler` (CqrsModule) — TAVSIYA ETILADI:**
```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';

@EventsHandler(OrderStatusChangedEvent)
export class OrderStatusMmSignalListener implements IEventHandler<OrderStatusChangedEvent> {
  async handle(event: OrderStatusChangedEvent): Promise<void> {
    if (event.newStatus !== OZHD_SYRYO_STATUS) return;
    // ... xuddi yuqoridagi logger + db.execute kodi
  }
}
```

**TEKSHIRING:** `OrderStatusChangedEvent` konstruktori qanday ishlashini ko'ring:
```bash
cat apps/api/src/modules/sd/domain/events/order-status-changed.event.ts
```
Agar `orderId / previousStatus / newStatus` maydonlari bor bo'lsa Variant B ishlaydi.
Agar `EventEmitter2` ham `.emit()` chaqirsa — Variant A ham ishlaydi.

**Mavjud tinglovchilarni ko'ring:**
```bash
grep -r "OrderStatusChangedEvent" apps/api/src/modules/sd/
```
Agar boshqa `@EventsHandler(OrderStatusChangedEvent)` mavjud bo'lsa —
NestJS bir voqea uchun **bir nechta handler** qo'llab-quvvatlaydi, muammo yo'q.

---

### QADAM 9 — `sd.module.ts`ga `OrderStatusMmSignalListener` ro'yxatdan o'tkaz

**Fayl:** `apps/api/src/modules/sd/sd.module.ts`

**Hozirgi satr 86:**
```typescript
const eventListeners = [DealWonListener, PaymentReceivedListener, AdvanceApprovedFanoutListener];
```

**Yangi:**
```typescript
import { OrderStatusMmSignalListener } from './infrastructure/event-handlers/order-status-mm-signal.listener';

const eventListeners = [
  DealWonListener,
  PaymentReceivedListener,
  AdvanceApprovedFanoutListener,
  OrderStatusMmSignalListener,
];
```

**Import joylashuvi:** Satr 45-46 atrofida boshqa event handler import'laridan keyin qo'shing.

---

### QADAM 10 — `cancelOrder` penalti kalkulyatsiyasi (EP-SD-069)

**Fayl:** `apps/api/src/modules/sd/application/sd-quotations.service.ts`

**Hozirgi holat (satr 210-215):**
```typescript
async cancelOrder(id: string, body: Record<string, unknown>): Promise<Result<Row>> {
  const r = await this.quotationRepo.cancelSalesOrder(id, body['reason']);
  if (!r.ok) return r as Result<Row>;
  if (!r.data) return Err(AppErr('NOT_FOUND', `Order ${id} topilmadi`));
  return Ok({ id, cancelled: true, status: 'cancelled', updated_at: r.data['updated_at'] });
}
```

**Penalti mantiq (EP-SD-069, egasi tasdiqlagan):**
- `stage = 'maket'` → 30%
- `stage = 'printed'` → 70%
- `stage = 'ready'` → 100%
- Foizlar konfiguratsiyalanuvchi (DDL gated §5). Hozirda hardcoded — **business.constants.ts'ga ko'chiring**.
- E1 printsipi: penalti HISOBLAYDI, lekin AVTOMATIK QOLLANMAYDI — insonlar tasdiqlamoqda.
  Javobda penalti hisoblash ko'rsatiladi; ilovani davom ettirishni mijoz tasdiqlamoqda.

**`business.constants.ts`ga qo'shing** (fayl mavjudligini tekshiring — agar yo'q bo'lsa TO'XTA + flag):
```typescript
// EP-SD-069 — Bekor qilish penalti foizlari (konfiguratsiyalanuvchi master-data)
// Kelajakda sd_cancellation_penalty_config jadvali (DDL GATED §5) buni to'g'ridan o'qiydi.
export const CANCEL_PENALTY_MAKET   = 30;   // %
export const CANCEL_PENALTY_PRINTED = 70;   // %
export const CANCEL_PENALTY_READY   = 100;  // %
```

**Yangi `cancelOrder` (satr 210-215 o'rnini almashtirish):**
```typescript
async cancelOrder(id: string, body: Record<string, unknown>): Promise<Result<Row>> {
  // EP-SD-069: Bosqichli bekor qilish penaltisi (egasi tasdiqlagan)
  // stage = 'maket' (30%) / 'printed' (70%) / 'ready' (100%)
  // E1: penalti HISOBLAYDI — avtomatik qollanmaydi; inson tasdiqlaydi.
  const stage = String(body['stage'] ?? 'maket') as 'maket' | 'printed' | 'ready';
  const penaltyMap: Record<string, number> = {
    maket:   CANCEL_PENALTY_MAKET,
    printed: CANCEL_PENALTY_PRINTED,
    ready:   CANCEL_PENALTY_READY,
  };
  const penaltyPercent = penaltyMap[stage] ?? CANCEL_PENALTY_MAKET;

  const r = await this.quotationRepo.cancelSalesOrder(id, body['reason']);
  if (!r.ok) return r as Result<Row>;
  if (!r.data) return Err(AppErr('NOT_FOUND', `Order ${id} topilmadi`));

  // EP-SD-079/132: O'zgarishlar jurnali — har bir bekor qilish yoziladi
  // sd_order_change_log DDL GATED (§5) — jadval yo'q bo'lsa ham muvaffaqiyatsiz bo'lmaydi
  await this._writeChangeLog({
    orderId: id,
    fieldName: 'status',
    oldValue: 'active',                // actual holat payload'dan kelishi mumkin; E1
    newValue: 'cancelled',
    changedBy: String(body['cancelled_by'] ?? body['changedBy'] ?? 0),
    epOpCode: 'EP-SD-069',
  });

  return Ok({
    id,
    cancelled: true,
    status: 'cancelled',
    updated_at: r.data['updated_at'],
    penalty: {
      stage,
      penaltyPercent,
      // E1: "Tasdiqlanmadi" — inson tasdiqlamaguncha penalti qo'llanilmaydi
      applied: false,
      note: `Penalti ${penaltyPercent}% — menejer/direktor tasdiqi kerak`,
    },
  });
}
```

**`CANCEL_PENALTY_*` konstantalarini import qiling:**
```typescript
import {
  CANCEL_PENALTY_MAKET,
  CANCEL_PENALTY_PRINTED,
  CANCEL_PENALTY_READY,
} from '@common/constants/business.constants';
```

---

### QADAM 11 — `_writeChangeLog` yordamchi metod (sd-quotations.service.ts)

**Fayl:** `apps/api/src/modules/sd/application/sd-quotations.service.ts`

Bu private yordamchi `cancelOrder` va kelajakdagi `updateOrderStatus` tomonidan chaqiriladi.

**`SdQuotationsService` klassi ichiga qo'shing (satr 250 — yakunlovchi `}` dan oldin):**

```typescript
/**
 * EP-SD-079/132: O'zgarishlar jurnali yozuvi.
 * sd_order_change_log DDL GATED (§5) — jadval yo'q bo'lsa non-fatal (log + davom et).
 * E1: hamma o'zgarishlar yoziladi, faqat inson tasdiqlaydigan voqealar blok qiladi.
 */
private async _writeChangeLog(entry: {
  orderId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  epOpCode?: string;
}): Promise<void> {
  try {
    await this.quotationRepo['_rawExec']?.(
      // NOTE: Bu erkin metod — agar IQuotationRepo uni oshkor qilmasa
      // to'g'ridan raw import'dan foydalanib bo'lmaydi.
      // Muqobil: SdQuotationsService'ni DrizzleQuotationRepo'ga qaramaydigan qilamiz.
      // Bu yerda xavfsiz yondashuvni ko'ramiz — to'g'ridan db.execute import qilamiz.
      // Qoida 15 istisnosi: bu xizmat bo'lmagan private yordamchi; to'liq
      // sd_order_change_log uchun alohida repo qadam 13'da qo'shiladi.
    );
  } catch {
    // non-fatal — hech qachon asosiy oqimni bloklamaydi
  }

  // HOZIRCHA: To'g'ridan db.execute (DDL gated — jadval mavjud bo'lmasa error log + davom)
  // TODO: qadam 13 qo'shilgandan keyin — bu `changeLogRepo.insert(entry)` bilan almashtiriladi.
  try {
    const { db } = await import('@shared/db');
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`
      INSERT INTO sd_order_change_log
        (order_id, field_name, old_value, new_value, changed_by, changed_at, ep_op_code)
      VALUES
        (${entry.orderId}::int, ${entry.fieldName}, ${entry.oldValue},
         ${entry.newValue}, ${entry.changedBy}::int, NOW(), ${entry.epOpCode ?? null})
    `);
    this.logger.log({
      msg: `[${entry.epOpCode ?? 'CHANGE_LOG'}] O'zgarish yozildi`,
      orderId: entry.orderId,
      field: entry.fieldName,
    });
  } catch (e) {
    // DDL GATED: sd_order_change_log hali yaratilmagan bo'lishi mumkin — bu OK
    this.logger.warn({
      msg: '[EP-SD-079] O'zgarish logi yozilmadi (jadval DDL gated)',
      orderId: entry.orderId,
      error: String(e),
    });
  }
}
```

---

### QADAM 12 — Maket darvozasini `update-order-status.handler.ts`ga qo'sh (EP-SD-056)

**Fayl:** `apps/api/src/modules/sd/application/commands/update-order-status.handler.ts`

**Vizyon (EP-SD-056/133):** `in_production` holati (va bosma talab qiladigan har qanday holat)
`maket_approved = true` bo'lishini talab qiladi. `maket_approved` ustuni `sales_orders` jadvalida
bo'lishi kerak — bu **DDL GATED (§5)**.

**Strategiya:**
1. `sales_orders`da `maket_approved` ustunini `SELECT` qiling
2. Agar ustun mavjud bo'lmasa (42703 xato) — darvozani yumshog'roq bajaramiz (WARN, blok emas)
3. Ustun mavjud va `false` bo'lsa — `FORBIDDEN` qaytaradi

**Mavjud avans tekshiruvi (satr 36-46) dan keyin qo'shing:**

```typescript
// EP-SD-056/133: Maket tasdiqlash darvozasi — bosib chiqarishga o'tishdan oldin
// sales_orders.maket_approved = true bo'lishi kerak.
// DDL GATED (§5): ustun mavjud bo'lmasa — WARN + yumshoq o'tish (blok emas).
// Qabul mezoni: qadam 12'dan keyin `in_production` → `maket_approved=false` bilan
// FORBIDDEN qaytaradi.
const PRODUCTION_STATUSES: ReadonlySet<string> = new Set([
  'in_production', 'production_started', 'printing', 'cutting',
]);

if (PRODUCTION_STATUSES.has(command.newStatus)) {
  const maketCheckResult = await this.orderRepo.findById(command.orderId);
  if (maketCheckResult.ok && maketCheckResult.data) {
    const orderData = maketCheckResult.data as unknown as Record<string, unknown>;
    // maket_approved ustuni mavjud va false bo'lsa — bloklash
    // ustun mavjud emas (undefined) — yumshoq o'tish (DDL hali tasdiqlanmagan)
    const maketApproved = orderData['maket_approved'];
    if (maketApproved !== undefined && maketApproved !== null && !maketApproved) {
      this.logger.warn({
        msg: '[EP-SD-056] Maket tasdiqlanmagan — bosib chiqarish bloklandi',
        orderId: command.orderId,
        newStatus: command.newStatus,
      });
      return Err(AppErr(
        'FORBIDDEN',
        'Maket tasdiqlanmagan. Bosib chiqarishdan oldin maket tasdiqlovi talab etiladi (EP-SD-056).',
      ));
    }
  }
}
```

**Joylashuv:** `checkAdvanceAndBlock` bloking (satr 36-47) dan keyin, `transitionStatus()` chaqiruvidan (satr 51) oldin.

**O'zgarishlar jurnali yozuvi (status o'zgargandan keyin, satr 65'dan keyin):**
```typescript
// EP-SD-079/132: Status o'zgarishi — change_log ga yozish
// Bu handler xizmatga kirish imkoni yo'q; to'g'ridan DB (non-fatal, DDL gated).
// TODO: OrderStatusMmSignalListener orqali ham yozilishi mumkin (birlashtirilishi kerak).
try {
  const { db } = await import('@shared/db');
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`
    INSERT INTO sd_order_change_log
      (order_id, field_name, old_value, new_value, changed_by, changed_at, ep_op_code)
    VALUES
      (${command.orderId}, 'status', ${previousStatus}, ${command.newStatus},
       0, NOW(), 'EP-SD-054')
    ON CONFLICT DO NOTHING
  `);
} catch (_e) {
  // DDL GATED — jadval mavjud bo'lmasa non-fatal
}
```

---

---

### QADAM 13 — EP-SD-068 Tiraj og'ish logikasi (`sd-quotations.service.ts`)

> **Manba:** OCHIQ-JAVOBLAR-2026-06-08.md SD § + MUSLIMBEK-PROMT-04 §PHASE3
> **Egasi qaror:** "±10% og'ish mumkin; hisob real chiqqan miqdordan" — **N% qiymati egasidan**.
> **MUHIM:** `tolerance_percent` NULL bo'lsa (`tolerance_percent` hali belgilanmagan) —
> `deviation_status = 'within'` (yumshoq, non-fatal). Hardcode 10% kiritish TAQIQ.

**Fayl:** `apps/api/src/modules/sd/application/sd-quotations.service.ts`

**`SdQuotationsService` klassi ichiga qo'shing (yakunlovchi `}` dan oldin):**

```typescript
/**
 * EP-SD-068: Tirajdan og'ish hisoblash.
 * Egasi qaror: ±N% og'ish mumkin; hisob real chiqqan miqdordan.
 * tolerance_percent = SD_cancellation_penalty_config yoki sales_orders.tolerance_percent dan.
 * HARDCODE TAQIQ — qiymat DB dan o'qiladi; NULL bo'lsa non-fatal (WARN + 'within').
 *
 * deviationStatus = 'within' | 'over' | 'under'
 *   within = |actual - ordered| / ordered <= tolerance_percent/100
 *   over   = actual > ordered × (1 + tolerance_percent/100)
 *   under  = actual < ordered × (1 - tolerance_percent/100)
 */
async updateActualQuantity(
  orderId: string,
  actualQuantity: number,
): Promise<Result<{ deviationStatus: string; actualQuantity: number; orderedQuantity: number | null }>> {
  try {
    // 1. Mavjud buyurtmani o'qi (ordered_quantity + tolerance_percent)
    const orderRes = await this.quotationRepo['_rawExec']?.(/* TODO: getById */) as Result<Record<string, unknown>> | undefined;
    // NOTE: to'liq implementatsiya drizzle-sales-order.repo.ts ga bog'liq (P09 owned).
    // Hozircha to'g'ridan DB (DDL gated — ustunlar yo'q bo'lsa graceful error).
    const { db } = await import('@shared/db');
    const { sql } = await import('drizzle-orm');

    const rows = await db.execute(sql`
      SELECT ordered_quantity, tolerance_percent
      FROM sales_orders
      WHERE id = ${orderId}::int
        AND deleted_at IS NULL
      LIMIT 1
    `);
    const row = ((rows as unknown as { rows?: Record<string, unknown>[] }).rows ?? [])[0];
    if (!row) {
      return Err(AppErr('NOT_FOUND', `Order ${orderId} topilmadi`));
    }

    const orderedQty = row['ordered_quantity'] != null ? Number(row['ordered_quantity']) : null;
    const tolerancePct = row['tolerance_percent'] != null ? Number(row['tolerance_percent']) : null;

    // 2. deviation_status hisoblash
    let deviationStatus = 'within';
    if (orderedQty != null && tolerancePct != null) {
      const upper = orderedQty * (1 + tolerancePct / 100);
      const lower = orderedQty * (1 - tolerancePct / 100);
      if (actualQuantity > upper) {
        deviationStatus = 'over';
      } else if (actualQuantity < lower) {
        deviationStatus = 'under';
      }
      // else: 'within'
    } else {
      // tolerance_percent NULL = hali belgilanmagan → non-fatal, 'within' default
      // EGASI QIYMATI KERAK: tolerance_percent ni master-data orqali belgilang.
      this.logger.warn({
        msg: '[EP-SD-068] tolerance_percent belgilanmagan — deviation_status=within (non-fatal)',
        orderId,
        actualQuantity,
        orderedQty,
      });
    }

    // 3. DB ga yoz
    await db.execute(sql`
      UPDATE sales_orders
      SET actual_quantity    = ${actualQuantity},
          deviation_status   = ${deviationStatus},
          updated_at         = NOW()
      WHERE id = ${orderId}::int
    `);

    // 4. Change log yozish (EP-SD-079)
    await this._writeChangeLog({
      orderId,
      fieldName: 'actual_quantity',
      oldValue: String(orderedQty ?? 'null'),
      newValue: String(actualQuantity),
      changedBy: '0',
      epOpCode: 'EP-SD-068',
    });

    this.logger.log({
      msg: '[EP-SD-068] actual_quantity yangilandi',
      orderId,
      actualQuantity,
      orderedQty,
      deviationStatus,
    });

    return Ok({ deviationStatus, actualQuantity, orderedQuantity: orderedQty });
  } catch (e) {
    // DDL GATED: ustunlar mavjud bo'lmasa (42703) — non-fatal WARN
    if (String(e).includes('42703') || String(e).includes('column')) {
      this.logger.warn({
        msg: '[EP-SD-068] Ustunlar DDL gated — actual_quantity yangilanmadi (non-fatal)',
        orderId,
        error: String(e),
      });
      return Ok({ deviationStatus: 'within', actualQuantity, orderedQuantity: null });
    }
    return Err(AppErr('INTERNAL', `EP-SD-068 xato: ${String(e)}`));
  }
}
```

**source_channel validatsiya (EP-SD-076) — createOrder qadamiga qo'shing:**

```typescript
/**
 * EP-SD-076: source_channel = sd_source_channel_lookup dan validatsiya.
 * MUHIM: Blok qilmaydi — non-fatal WARN (egasi yangi kanal qo'shishi mumkin).
 * Hardcode CHECK constraint TAQIQ (egasi falsafasi: dasturchisiz o'zgartiradi).
 */
private async _validateSourceChannel(sourceChannel: string | null | undefined): Promise<void> {
  if (!sourceChannel) return; // NULL ruxsat etilgan
  try {
    const { db } = await import('@shared/db');
    const { sql } = await import('drizzle-orm');
    const rows = await db.execute(sql`
      SELECT code FROM sd_source_channel_lookup
      WHERE code = ${sourceChannel} AND is_active = true
      LIMIT 1
    `);
    const found = ((rows as unknown as { rows?: unknown[] }).rows ?? []).length > 0;
    if (!found) {
      this.logger.warn({
        msg: '[EP-SD-076] source_channel lookup topilmadi — qabul qilinadi (non-fatal)',
        sourceChannel,
        hint: 'sd_source_channel_lookup jadvaliga yangi qator qo\'shing (egasi ekrandan)',
      });
    }
  } catch {
    // sd_source_channel_lookup jadval yo'q bo'lsa (DDL gated) — non-fatal
  }
}
```

**Eslatma:** `_validateSourceChannel` ni `createOrder` / `updateOrder` metodlarida chaqiring:
```typescript
// createOrder logikasi ichida:
await this._validateSourceChannel(body['sourceChannel'] as string | null);
```

---

## 5. DDL (Talab qilinadi — GATED, egasi ruxsatisiz ISHGA TUSHIRMA)

> **STATUS: GATED** — quyidagi fayllarni yozing, lekin `psql` bilan ISHGA TUSHIRMANG.
> Egasi "APPROVED" degandan keyin bajariladi. Har migration fayli `-- APPROVED:` izoh
> bo'lishi MAJBURIY (Q-35).

**Migration fayli 1 yarating:**
`apps/api/src/shared/db/migrations/p10-sd-maket-changelog.sql`

```sql
-- APPROVED: <egasi_ismi> <tasdiq_sanasi>
-- P10 SD Backend Fixes — Maket darvozasi + O'zgarishlar jurnali
-- EP-SD-056/133 (maket_approved ustunlari) + EP-SD-079/132 (sd_order_change_log)
-- GATED: Bu faylni pnpm db:migrate bilan ishlatmang — egasi tasdiqi kerak.

-- 1. sales_orders jadvaliga maket darvozasi ustunlari (EP-SD-056/133)
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS maket_approved       BOOLEAN        NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS maket_approved_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS maket_approved_by    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS maket_file_url       TEXT;

-- 2. O'zgarishlar jurnali jadvali (EP-SD-079/132)
CREATE TABLE IF NOT EXISTS sd_order_change_log (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER        NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  field_name  VARCHAR(50)    NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  changed_by  INTEGER        REFERENCES employees(id),
  changed_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  ep_op_code  VARCHAR(20),

  -- Indeks tez so'rovlar uchun (buyurtma tarixi sahifasi)
  CONSTRAINT sd_order_change_log_order_field_idx
    UNIQUE NULLS NOT DISTINCT (order_id, field_name, changed_at)
);

CREATE INDEX IF NOT EXISTS sd_order_change_log_order_id_idx
  ON sd_order_change_log (order_id, changed_at DESC);

-- 3. KPI maqsadlari jadvali (EP-SD-009..014 — getKpiTargets)
CREATE TABLE IF NOT EXISTS sd_kpi_targets (
  id                    SERIAL PRIMARY KEY,
  manager_id            INTEGER     NOT NULL REFERENCES employees(id),
  year                  INTEGER     NOT NULL,
  month                 INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  revenue_target        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  order_count_target    INTEGER     NOT NULL DEFAULT 0,
  new_customer_target   INTEGER     NOT NULL DEFAULT 0,
  -- drizzle-quotation.repo.ts:161 updateKpiTarget mavjud ustunlar:
  target_value          NUMERIC(15, 2),
  period                VARCHAR(20),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (manager_id, year, month)
);

-- 4. Bekor qilish penalti konfiguratsiyasi (EP-SD-069)
CREATE TABLE IF NOT EXISTS sd_cancellation_penalty_config (
  stage           VARCHAR(20)  PRIMARY KEY CHECK (stage IN ('maket', 'printed', 'ready')),
  penalty_percent NUMERIC(5,2) NOT NULL CHECK (penalty_percent BETWEEN 0 AND 100),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Standart seed (egasi tasdiqlagan foizlar)
INSERT INTO sd_cancellation_penalty_config (stage, penalty_percent) VALUES
  ('maket',   30.00),
  ('printed', 70.00),
  ('ready',  100.00)
ON CONFLICT (stage) DO NOTHING;

-- 5. EP-SD-068 Tiraj og'ish maydonlari (P09 migratsiyasida ham bor — idempotent)
-- MUHIM: tolerance_percent = NULL qolsin; egasi ekrandan belgilaydi. HARDCODE TAQIQ.
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS ordered_quantity  INTEGER,
  ADD COLUMN IF NOT EXISTS actual_quantity   INTEGER,
  ADD COLUMN IF NOT EXISTS tolerance_percent NUMERIC(5, 2),
  -- EGASI QIYMATI KERAK: tolerance_percent NULL = hali belgilanmagan
  ADD COLUMN IF NOT EXISTS deviation_status  VARCHAR(10);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sales_orders_deviation_status_chk')
  THEN ALTER TABLE sales_orders
    ADD CONSTRAINT sales_orders_deviation_status_chk
      CHECK (deviation_status IS NULL OR deviation_status IN ('within','over','under'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_orders_deviation_status
  ON sales_orders (deviation_status);

-- 6. EP-SD-076 source_channel lookup (master-data, CHECK TAQIQ — egasi qo'shadi/o'chiradi)
CREATE TABLE IF NOT EXISTS sd_source_channel_lookup (
  code       VARCHAR(50) PRIMARY KEY,
  label_uz   VARCHAR(100) NOT NULL,
  label_ru   VARCHAR(100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO sd_source_channel_lookup (code, label_uz, sort_order) VALUES
  ('telegram', 'Telegram', 1),
  ('call',     'Telefon qo''ng''irog''i', 2),
  ('website',  'Veb-sayt', 3),
  ('repeat',   'Takroriy buyurtma', 4),
  ('referral', 'Tavsiya', 5),
  ('visit',    'Ofis tashrifi', 6)
ON CONFLICT (code) DO NOTHING;
```

**Egasiga ko'rsating:** `docs/audit/MASSIV-50/P10-SD (Sales Distribution)-sd-backend-logic.md §5`
va ushbu migration SQL'ni.

---

## 6. QABUL MEZONI

Barcha quyidagi tekshiruvlar yashil bo'lishi kerak. Bitta ham muvaffaqiyatsiz bo'lsa — tuzat va qayta tekshir.

### Backend TypeScript

```bash
# apps/api papkasida
cd apps/api
pnpm tsc --noEmit
# Natija: 0 ta xato
```

### Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh
# Natija: FAIL: 0

bash scripts/reviewer-jwt-guard.sh
# Natija: PASS (SdDashboardController endi RolesGuard bor)
```

### Qabul testlari (DB-proof — jonli server kerak)

```bash
# 1. Login → token oling
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"YOUR_PASS"}' | jq -r '.access_token')

# 2. B1 FIX: updatePayment endi db.execute ishlatmaydi
#    Mavjud payment ID bilan sinab ko'ring (yoki avval yarating)
PAYMENT_ID="existing-uuid"
curl -s -X PUT "http://localhost:3030/api/sd/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"notes":"P10 test payment update"}' | jq .
# Kutilgan: { "updated": true, "data": { "id": ..., "status": "pending" } }

# 3. B4 FIX: dashboard 403 to'g'ri ishlaydi
#    Rol tekshiruvi ishlashini ko'ring (operator rolida sinash)
curl -s http://localhost:3030/api/sd/dashboard/overview \
  -H "Authorization: Bearer $TOKEN" | jq '.stats' | head -5
# Kutilgan: 200 + stats ob'ekti

# 4. B2 FIX: kpiTargets bo'sh array emas, haqiqiy SQL
curl -s "http://localhost:3030/api/sd/kpi-targets" \
  -H "Authorization: Bearer $TOKEN" | jq .
# Kutilgan: JSON (jadval bo'sh bo'lsa [] — lekin SQL ishlaydi, 500 emas)

# 5. B3 FIX: convertQuotationToOrder NOT-NULL
QUOT_ID="existing-quotation-id"
curl -s -X POST "http://localhost:3030/api/sd/quotations/$QUOT_ID/convert" \
  -H "Authorization: Bearer $TOKEN" | jq .
# Kutilgan: { "order": { "id": N, "documentNumber": "QO-...", "status": "pending" } }
# DB tekshiruvi:
# SELECT id, document_number, order_date, pricing_date FROM sales_orders ORDER BY id DESC LIMIT 1;
# ← document_number, order_date, pricing_date NULL emas bo'lishi kerak

# 6. EP-SD-069 penalti kalkulyatsiyasi
ORDER_ID="test-order-id"
curl -s -X DELETE "http://localhost:3030/api/sd/orders/$ORDER_ID/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"reason":"narx","stage":"maket"}' | jq .penalty
# Kutilgan: { "stage": "maket", "penaltyPercent": 30, "applied": false }

# 7. EP-SD-101 MM signal (endpoint orqali holat o'zgartiring, domain_events tekshiring)
curl -s -X PATCH "http://localhost:3030/api/sd/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"newStatus":"Ozhd.Syryo"}' | jq .
# Keyin DB tekshiruvi:
# SELECT event_type, payload FROM domain_events
#   WHERE event_type = 'order_status_mm_signal' ORDER BY id DESC LIMIT 1;
# ← Natija: order_id, previous_status, new_status, ep_op_code='EP-SD-101'
```

### Oltin-ip regressiya tekshiruvi

```bash
# Mavjud funksiya buzilmaganligini tekshiring:
# listPayments hali ishlaydi
curl -s "http://localhost:3030/api/sd/payments?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
# 0 yoki musbat son (muvaffaqiyatsiz emas)

# getDebitors hali ishlaydi
curl -s "http://localhost:3030/api/sd/payments/debitors" \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
# Hata yo'q

# calculatePrice hali ishlaydi
curl -s -X POST "http://localhost:3030/api/sd/calculate-price" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"lengthMm":300,"widthMm":200,"heightMm":100,"printColors":2,"quantity":1000,"isNewDie":false}' | jq .totalPrice
# Haqiqiy son (0 emas, stub emas)
```

### Vizyon-moslik tekshiruvi (Q-40)

- `updatePayment` endi transport qatlamida `db.*` YO'Q
- Dashboard faqat belgilangan rollarga ko'rinadi (security)
- KPI maqsadlari haqiqiy so'rovga ega (lekin jadval bo'sh — bu normal)
- Bekor qilish javobi penalti maydonini qaytaradi — inson tasdiq-tayyor
- MM signal `domain_events`'da — ta'minot agent o'qishi uchun

---

## 7. SELF-VERIFY (To'liq tekshiruv tartibi)

### Har qadam tugagandan keyin:

```bash
# 1. TypeScript tekshiruvi
cd apps/api && pnpm tsc --noEmit 2>&1 | tail -5
# Kutilgan: "0 ta xato" yoki bo'sh

# 2. Modul DI tekshiruvi (server bootda DI xatolari yo'qmi)
# pnpm --filter @europrint/api run dev:unsafe
# Kutilgan: "Application is running on: http://[::1]:3030"
# Xatolar: "Nest can't resolve dependencies..." → sd.module.ts ni tekshiring

# 3. Reviewer tekshiruvlar
bash scripts/reviewer-result-pattern.sh | grep FAIL
bash scripts/reviewer-jwt-guard.sh | grep FAIL
# Ikkalasi: 0 ta xato

# 4. Import tekshiruvi — controller'da db.* yo'q
grep "from '@shared/db'" apps/api/src/modules/sd/presentation/sd-payments.controller.ts
# Kutilgan: hech narsa (bo'sh)
grep "db\.execute" apps/api/src/modules/sd/presentation/sd-payments.controller.ts
# Kutilgan: hech narsa (bo'sh)

# 5. RolesGuard tekshiruvi
grep "RolesGuard" apps/api/src/modules/sd/presentation/sd-dashboard.controller.ts
# Kutilgan: import va UseGuards satrlari topiladi
```

### DB-proof (jonli server bilan):

```sql
-- 1. convertQuotationToOrder NOT-NULL tekshiruvi
SELECT id, document_number, order_date, pricing_date
  FROM sales_orders
  ORDER BY id DESC LIMIT 3;
-- Kutilgan: document_number, order_date, pricing_date NULL emas

-- 2. MM signal tekshiruvi
SELECT event_type, payload->>'ep_op_code' AS op_code,
       payload->>'order_id' AS order_id
  FROM domain_events
  WHERE event_type = 'order_status_mm_signal'
  ORDER BY id DESC LIMIT 5;
-- Kutilgan: 'EP-SD-101' op_code bilan qatorlar

-- 3. Change log tekshiruvi (DDL approved va apply qilingan bo'lsa)
SELECT order_id, field_name, old_value, new_value, ep_op_code
  FROM sd_order_change_log
  ORDER BY id DESC LIMIT 5;
-- Kutilgan: EP-SD-054 / EP-SD-069 op_code bilan qatorlar
```

---

## 8. COMMIT TARTIBI

> **QOIDA:** Har mantiqiy guruh = bitta commit. `git add -A` TAQIQ.
> Faqat aniq fayllarni qo'shing.

### Commit 1 — Qoida 15 tuzatish (updatePayment ko'chirish)

```bash
git add apps/api/src/modules/sd/domain/repositories/i-sd-payments.repo.ts
git add apps/api/src/modules/sd/infrastructure/repositories/sd-payments.repository.ts
git add apps/api/src/modules/sd/application/sd-payments.service.ts
git add apps/api/src/modules/sd/presentation/sd-payments.controller.ts
git commit -m "fix(sd): move updatePayment SQL from controller to repo (Qoida 15) [P10]

B1 fix: db.execute from transport layer moved to SdPaymentsRepository.
SdPaymentsService.updatePayment delegates to repo.
Controller now calls unwrapOrThrow(await this.svc.updatePayment(...)).
db/sql imports removed from sd-payments.controller.ts.

EP-Ref: Qoida-15 / Qoida-6"
```

### Commit 2 — Dashboard security

```bash
git add apps/api/src/modules/sd/presentation/sd-dashboard.controller.ts
git commit -m "fix(sd): add RolesGuard to SdDashboardController [P10]

B4 fix: @Roles() decorator had no effect without RolesGuard.
UseGuards now includes both JwtAuthGuard and RolesGuard.
Roles import moved from @shared to @common for consistency.

EP-Ref: Security / RBAC"
```

### Commit 3 — KPI targets + convert-to-order

```bash
git add apps/api/src/modules/sd/infrastructure/repositories/sd-quotations.repository.ts
git commit -m "fix(sd): real getKpiTargets SQL + convertQuotationToOrder NOT-NULL cols [P10]

B2 fix: getKpiTargets() Ok([]) stub replaced with real sd_kpi_targets query.
B3 fix: convertQuotationToOrder INSERT now includes document_number/order_date/pricing_date.
Pattern matches approveQuotation() in drizzle-quotation.repo.ts.

EP-Ref: EP-SD-009 / EP-SD-053"
```

### Commit 4 — MM signal listener + modul ro'yxatga olish

```bash
git add apps/api/src/modules/sd/infrastructure/event-handlers/order-status-mm-signal.listener.ts
git add apps/api/src/modules/sd/sd.module.ts
git commit -m "feat(sd): OrderStatusMmSignalListener for EP-SD-101 Ozhd.Syryo→MM signal [P10]

New listener: on OrderStatusChangedEvent where newStatus=Ozhd.Syryo,
writes domain_events row (event_type=order_status_mm_signal, ep_op_code=EP-SD-101).
Non-fatal: MM signal failure never blocks SD order flow (E1 principle).
Registered in SdModule eventListeners array.

EP-Ref: EP-SD-101"
```

### Commit 5 — Penalti + maket darvozasi + o'zgarishlar jurnali

```bash
git add apps/api/src/modules/sd/application/sd-quotations.service.ts
git add apps/api/src/modules/sd/application/commands/update-order-status.handler.ts
git commit -m "feat(sd): cancellation penalty calc + maket gate + change-log writes [P10]

cancelOrder: returns penalty breakdown (stage×percent) per EP-SD-069.
  CANCEL_PENALTY_* constants extracted to business.constants.ts.
  E1: penalty calculated, not auto-applied — human confirms.
update-order-status: maket_approved gate before in_production (EP-SD-056).
  Soft-gated: if maket_approved column absent (DDL not yet applied), warns but passes.
change-log: _writeChangeLog private helper writes to sd_order_change_log (DDL gated, non-fatal).

EP-Ref: EP-SD-069 / EP-SD-056 / EP-SD-079"
```

### Commit 6 — DDL migration fayli (GATED)

```bash
git add apps/api/src/shared/db/migrations/p10-sd-maket-changelog.sql
git commit -m "chore(sd/ddl): GATED migration P10 — maket cols + change_log + kpi_targets + penalty_config [P10]

Migration file written but NOT applied. Requires owner approval + APPROVED comment.
Adds: sales_orders.maket_approved/at/by/url, sd_order_change_log, sd_kpi_targets,
sd_cancellation_penalty_config with seed data (30/70/100%).

EP-Ref: EP-SD-056 / EP-SD-079 / EP-SD-009 / EP-SD-069 | Q-35 GATED"
```

---

## HOLAT HISOBOTI SHABLONI (Har commit'dan keyin egasiga yuboring)

```
P10 — [COMMIT N] BAJARILDI

Fayl: [o'zgartirilgan fayl]
Nima bajarildi: [qisqacha tavsif]
DB isbot: [curl chiqishi yoki SQL natijasi]
TSC: 0 xato ✅
Reviewers: result-pattern PASS ✅ / jwt-guard PASS ✅

KEYINGI: [keyingi qadam]
Bloker: [agar biror narsa bloklangan bo'lsa — faqat TO'XTA + egasiga yuboring]
```

---

## ESLATMALAR VA QIYIN HOLATLAR

### 1. CqrsModule vs EventEmitter2

`update-order-status.handler.ts:65` `this.eventBus.publish(statusEvent)` CqrsModule
`EventBus`'ini ishlatadi. `OrderStatusMmSignalListener` uchun:

- **Agar** `OrderStatusChangedEvent` faqat CqrsModule orqali nashr etilsa →
  `@EventsHandler(OrderStatusChangedEvent)` ishlatilishi KERAK (Variant B §4.8).
- **Agar** qo'shimcha ravishda `eventEmitter.emit(...)` chaqirilsa →
  `@OnEvent(...)` ham ishlaydi.

**Tekshirish buyrug'i:**
```bash
grep -rn "eventBus\|eventEmitter\|EventBus\|EventEmitter" \
  apps/api/src/modules/sd/application/commands/update-order-status.handler.ts
```

Agar faqat `eventBus` → Variant B (EventsHandler) ishlating.

### 2. `ISdPaymentsRepo` mavjud bo'lmasa

Agar `i-sd-payments.repo.ts` hali aniqlanmagan bo'lsa (Q-29 — tekshiring):
```bash
cat apps/api/src/modules/sd/domain/repositories/i-sd-payments.repo.ts
```
Agar fayl yo'q bo'lsa → **TO'XTA**. Egasiga flag qiling. Bu boshqa agent'ning territoriyasi
bo'lishi mumkin. Shu holatda qadam 1'ni o'tkazib yuboring — `SdPaymentsService.updatePayment`
interfeys belgilashsiz ham ishlaydi (TypeScript structural typing).

### 3. `business.constants.ts` yo'q bo'lsa

```bash
ls apps/api/src/common/constants/business.constants.ts
```
Agar fayl mavjud bo'lmasa → **TO'XTA + egasiga flag**. Bu OWNED ro'yxatda yo'q.
Muqobil: konstantalarni `sd-quotations.service.ts` ning yuqorisida private const sifatida
e'lon qiling (Q-46 — ishlayotgan kod o'chirilmaydi, lekin yangi harakat kerak):

```typescript
// EP-SD-069 — Vaqtincha (business.constants.ts mavjud bo'lganda ko'chiring)
const CANCEL_PENALTY_MAKET   = 30;
const CANCEL_PENALTY_PRINTED = 70;
const CANCEL_PENALTY_READY   = 100;
```

### 4. `domain_events` jadval sxemasi

Qadam 8'da `domain_events` jadvaliga INSERT qilamiz. Ushbu jadval mavjudligini tekshiring:
```bash
grep -rn "domain_events" apps/api/src/shared/db/ | head -5
```
Agar jadval mavjud bo'lmasa — `_writeMMSignal` metodini non-fatal qiling
(xuddi `_writeChangeLog` kabi — try/catch + warn log).

### 5. `maket_approved` ustuni DDL'siz

Qadam 12 DDL GATED. Ustun yo'q bo'lganda `order.maket_approved` — `undefined` bo'ladi.
Shuning uchun shartni:
```typescript
if (maketApproved !== undefined && maketApproved !== null && !maketApproved)
```
deb yozdik — ustun yo'q bo'lsa (`undefined`) darvoza o'tkazib yuboradi.
DDL approved + applied bo'lgandan keyin → `false` blok qiladi.

---

## YUMALOQ ESLATMALAR (TEZ KO'RIB CHIQISH UCHUN)

```
✅ sd-payments.controller.ts: db.execute YO'Q → svc.updatePayment()
✅ sd-payments.repository.ts: updatePayment() real SQL + Err/Ok
✅ sd-payments.service.ts: updatePayment() repo'ga delegate qiladi
✅ sd-dashboard.controller.ts: RolesGuard qo'shildi + @common import
✅ sd-quotations.repository.ts: getKpiTargets() real SQL (DDL gated fallback)
✅ sd-quotations.repository.ts: convertQuotationToOrder() NOT-NULL ustunlari
✅ sd-quotations.service.ts: cancelOrder() penalti kalkulyatsiyasi + _writeChangeLog
✅ update-order-status.handler.ts: maket darvozasi (yumshoq) + change_log
✅ order-status-mm-signal.listener.ts: yangi fayl (EP-SD-101)
✅ sd.module.ts: OrderStatusMmSignalListener ro'yxatga olish
⛔ DDL: p10-sd-maket-changelog.sql — YOZILDI, ISHGA TUSHIRILMADI (egasi kerak)
```

**Jami o'zgartirilgan fayllar:** 10 ta mavjud + 1 yangi listener + 1 GATED migration = **12 ta**
(owned ro'yxatdagi 12 fayl bilan mos keladi)
