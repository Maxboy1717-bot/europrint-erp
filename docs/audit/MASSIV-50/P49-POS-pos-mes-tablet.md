# P49 — POS Monitor (factory warehouse tablet): POS MES-FG listener + pres-kirim + photo + GSD push + tablet ZXing/PWA/Telegraf

> **WAVE:** 3 | **DEPENDS ON:** P48 | **DDL GATE:** MAVJUD (7 ta DDL — GATED, egasi ruxsatisiz ishga tushirilmaydi)

---

## 0. ROL VA QOIDALAR

**Sen BAJARUVCHI agentsan (🟢).** Bu paket FAQAT sening owned-file ro'yxatingdagi fayllarga tegishli. Boshqa paket fayllariga tegma.

### QOIDALAR BLOKI (Q-47 — har direktivada majburiy)

1. **Result<T>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri:** REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31):** faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35):** `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Bu paket DDL talab qiladi — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify:** BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqasi kerak bo'lsa — TO'XTA + flag:**

### Backend owned files:
```
apps/api/src/modules/pos/application/event-handlers/pos-mes-fg.listener.ts   ← YANGI YARATILADI
apps/api/src/modules/pos/presentation/pres-kirim.controller.ts                ← YANGI YARATILADI
apps/api/src/modules/pos/application/services/pres-kirim.service.ts           ← YANGI YARATILADI
apps/api/src/modules/pos/application/services/pos-gsd.service.ts              ← YANGI YARATILADI
apps/api/src/modules/pos/application/jobs/pos-gsd-push.job.ts                 ← YANGI YARATILADI
apps/api/src/modules/pos/application/jobs/pos-low-stock.job.ts                ← MAVJUD — O'ZGARTIRILADI
apps/api/src/modules/pos/presentation/movements.controller.ts                 ← MAVJUD — O'ZGARTIRILADI
apps/api/src/modules/pos/pos.module.ts                                         ← MAVJUD — O'ZGARTIRILADI
apps/api/src/modules/pos/pos.module-imports.ts                                 ← MAVJUD — O'ZGARTIRILADI
apps/api/src/modules/pos/application/services/telegram-bot.service.ts         ← MAVJUD — O'ZGARTIRILADI
apps/api/src/modules/pos/presentation/mini-app.controller.ts                  ← MAVJUD — O'ZGARTIRILADI
```

### Frontend owned files:
```
artifacts/erp-dashboard/src/pos-monitor/pages/PosMovementKirimSteps.tsx       ← MAVJUD — O'ZGARTIRILADI
artifacts/erp-dashboard/src/pos-monitor/pages/PosMovementKirimTypes.ts        ← MAVJUD — O'ZGARTIRILADI
artifacts/erp-dashboard/src/pos-monitor/pages/PosMovementKirim.tsx            ← MAVJUD — O'ZGARTIRILADI
artifacts/erp-dashboard/src/pos-monitor/pages/PresKirimPage.tsx               ← YANGI YARATILADI
artifacts/erp-dashboard/src/pos-monitor/components/PosBarcodeScanner.tsx      ← MAVJUD — O'ZGARTIRILADI
artifacts/erp-dashboard/src/pos-monitor/hooks/useBarcode.ts                   ← MAVJUD — KO'RILADI
artifacts/erp-dashboard/src/pos-monitor/hooks/useOfflineSync.ts               ← MAVJUD — KO'RILADI
artifacts/erp-dashboard/vite.config.ts                                        ← MAVJUD — KO'RILADI
```

### DDL migration fayllar (GATED):
```
apps/api/src/database/migrations/p49-pos-mes-photo-gsd-scrap.sql              ← YANGI, GATED
```

### Sidebar (P50 egasi):
Sidebar router registratsiyasi **P50 paketi** egasi. Sen `PosMonitorApp.tsx` routerga `/pres-kirim` route qo'shasan (faqat o'sha fayl ichidagi router bloki — bu faylni FAQAT route qo'shish uchun teg, boshqa narsa o'zgartirma).

---

## 2. VIZYON

### Modul maqsadi (EP-POS)
POS Monitor = **zavod sex ombori tablet ilovasi**. Fabrikaga kiruvchi va chiquvchi har bir material shu orqali o'tadi. Yetti turdagi omborni boshqaradi. Kassir funksiyasi YO'Q — bu Finance moduli.

### P49 qamrab oladigan vizyon bo'limlari:

#### A. MES-FG integratsiya (EP-POS-024 / Phase 4)
- MES `session.completed` event'i chiqarilganda → POS `FG_FROM_MES` harakatini tayyor mahsulot omboriga avtomatik yaratadi.
- FG_FROM_MES = tayyor mahsulot kirim turi (gofra, ofset, silkscreen mahsulotlari).
- Event payload: `{ sessionId, papkaOrderId, materialCardId, qty, unit, shiftId, operatorId, fgWarehouseId }`.
- Agar `fgWarehouseId` payload'da bo'lmasa — omborlar jadvalidan `type = 'FG-STORE'` bo'lgan birinchi faol omborni tanla.

#### B. Pres-kirim fast-path (EP-POS Phase 6)
- Pres operatori boshqacha kirim jarayoniga ega: matbaa mashinasi (pres) WIP materialini ishlatadi → tayyor mahsulot keladi.
- **Fast-path:** Operator kg miqdorini kiritadi → barcode sticker chiqariladi → `INTERNAL` kirim avtomatik yaratiladi.
- Endpoint: `POST /api/pos/pres-kirim` — `{ materialCardId, qty, unit, presId, shiftId }` → `FG_FROM_MES` turi harakat, `from_warehouse_id = WIP_STORE`, `to_warehouse_id = FG-STORE`.
- FE: alohida sodda sahifa `/pos-monitor/pres-kirim` — 3 maydon (material, miqdor, pres#), 1 tugma.

#### C. Foto dalil (EP-POS-069 — MAJBURIY egasi overridi)
- `EXTERNAL_IN`, `DAMAGE`, va katta farqli kirimlar (`discrepancy > 10%`) uchun foto evidence MAJBURIY.
- Harakat yaratishda foto bo'lmasa 400 xato qaytariladi.
- `pos_movements` jadvalida `photo_urls text[]` ustuni kerak (DDL GATED).
- `pos_movement_lines` ustuniga `photo_url text` kerak (DDL GATED) — zarar akti qator darajasida.
- Upload: multipart orqali, storage servisga yuboriladi, URL saqlanadi.
- FE kirim wizard Step 1 yoki Step 2 da kamera capture UI qo'shiladi (faqat EXTERNAL_IN uchun majburiy, DAMAGE uchun ham).

#### D. GSD metrikalari HR kartasiga push (EP-POS-029/056)
- `WarehouseKpiService` hisoblaydi lekin HECH QAYERGA SAQLAMAYDI (broken).
- `PosGsdService` yangi servis: kun oxirida har ombor uchun `pos_gsd_metrics` jadvaliga yozadi.
- `PosGsdPushJob` = har kuni 23:45 da ishga tushadigan cron, `PosGsdService.pushDailyMetrics()` chaqiradi.
- `pos_gsd_metrics` jadvali: `(id, employee_id, date, plan_completion_pct, delay_count, deviation_count, org_function_id, created_at)` — DDL GATED.

> ⚠️ **OWNER-GATED: GSD FORMULA TASDIQLANMAGAN**
> MASTER-SAVOL-JAVOB-2026-06-08.md (EP-POS-056):
> "aniq 3-ko'rsatkich formulasini belgilamagan — egasi tasdig'i kerak."
> Quyidagi formulalar TAXMINIY va egasi tomonidan TASDIQLANMAGAN:
>   - `plan_completion_pct` = (completed movements today / planned movements today) × 100
>   - `delay_count` = harakatlar `updated_at > created_at + 4 soat` (4 soat chegarasi ixtiro qilingan)
>   - `deviation_count` = harakat miqdori normadan >5% farqlangan (5% chegarasi ixtiro qilingan)
>
> **BAJARUVCHI:** `pos-gsd.service.ts` da hisob-kitob logikasi PLACEHOLDER sifatida yoziladi.
> Fayl boshida `// ⚠️ EGASI QIYMATI KERAK: GSD formula parametrlari tasdiqlanmagan` izohi bo'lishi shart.
> **Haqiqiy formula egasi tomonidan tasdiqlanguncha `pushDailyMetrics()` metodi ma'lumot yozadi,
> lekin natijalar REVIEW_PENDING bayrog'i bilan belgilanishi kerak (ixtiyoriy — jadvalda `is_confirmed` ustuni DDL GATED).**
> Egasi tasdiqlanmaguncha bu metrikalar HR kartasiga "avtomatik" ta'sir ko'rsatmasin — faqat `pos_gsd_metrics` jadvaliga yoziladi.

#### E. SCRAP_IN 501 stub (EP-POS-037 — Makulatura)
- Egasi hali makulatura Excel faylini topshirmagan → FAQAT 501 stub.
- `movementTypeEnum`ga `SCRAP_IN` qo'shilmaydi (DDL gated, egasi fayli kutilmoqda).
- `SCRAP_IN` harakat turi uchun `POST /api/pos/movements` → 501 `{ message: "SCRAP_IN turi hali kutilmoqda: egasi Excel fayli topshirgandan keyin", code: "NOT_IMPLEMENTED" }`.
- Bu movements.controller.ts da CreateMovement handler ichida type check sifatida yoziladi.

#### F. Low-stock → MM reorder event (EP-POS-065)
- `PosLowStockJob` hozir faqat notification yaratadi, MM moduliga signal YUBORMASLIGI muammo.
- Fix: low stock aniqlanganida `eventEmitter.emit('pos.low_stock.detected', { materialCardId, warehouseId, currentQty, minQty })` chiqariladi.
- MM moduli bu event'ga subscribe bo'ladi — lekin bu P49 emas, faqat event emission P49 da.

#### G. ZXing fallback (EP-POS-006)
- `PosBarcodeScanner.tsx` hozir faqat native `BarcodeDetector` API ishlatadi (Chrome/Android).
- Eski planshetlar (Android 6–8) da `BarcodeDetector` YO'Q.
- Fix: `BarcodeDetector` available bo'lmasa → `@zxing/browser` paketi orqali ZXing fallback.
- `pnpm add @zxing/browser` qo'shiladi.
- Fallback logikasi: `if (!('BarcodeDetector' in window)) { /* ZXing */ }`.

#### H. PWA service worker (EP-POS-021)
- `vite.config.ts` da `VitePWA` allaqachon bor — lekin `pos_movements` POST uchun background sync YO'Q.
- Fix: `workbox.runtimeCaching` ga `pos/movements` POST uchun background sync qo'shiladi.
- Manifest `name` ni `"EuroPrint ERP — Zavod Ombori"` ga o'zgartirish (hozir "POS Kassa" — noto'g'ri modul nomi).

#### I. Telegraf bot commands + Mini-App (EP-POS-071)

**Egasi javobi (MASTER-SAVOL-JAVOB-2026-06-08.md EP-POS-071):**
> "To'liq Telegram Mini App (barcode skan, so'rov, tarix, tasdiqlash); topilmasa admin Telegram xabar.
> Hodisa→rol matritsasi admin panelda sozlanadi."

**VISION-1000 Q940:**
> "Telegram Mini App WebApp POS backend'ga JWT (ERP SSO token) bilan ulanadi; offline rejimda
> Mini App FAQAT online ishlaydi; tasdiqlash tugmasi bosilganda POS backend WebApp API orqali
> `pos_movements.status` sinxron o'zgaradi + Telegram callback yangilanadi."

**CONFORMANCE GAP (INTERVYU-MOSLIK.md §2):**
> "Telegram 'to'liq Mini App' o'rniga faqat /status,/approve — QISMAN MOS"

**P49 DA AMALGA OSHIRILADI (minimal bot commands + webhook foundation):**
- `TelegramBotService`ga `handleBotUpdate(update)` metodi qo'shiladi — raw Bot API webhook update'ni qayta ishlaydi.
- `mini-app.controller.ts`ga `POST /pos/mini-app/telegram-webhook` endpoint qo'shiladi.
- Bot komandalari: `/start`, `/status`, `/approve <id>` — bu P49 **boshlang'ich faz**.

> ⚠️ **DEFERRED — TO'LIQ MINI-APP (keyingi paket):**
> Egasi "to'liq Telegram Mini App" degan — bu quyidagilarni anglatadi:
>   1. **Barcode skan** Mini App orqali — Telegram WebApp kamera API (TWA `scanQrPopup`)
>   2. **So'rov yuborish** — tovar chiqim so'rovi Telegram orqali (`/request <material> <qty>`)
>   3. **Harakat tarixi** — `/history [n]` — so'nggi N harakat ro'yxati
>   4. **Tasdiqlash** — inline keyboard bilan approve/reject tugmalar (hozirgi `/approve <id>` matn-only; to'liq = inline_keyboard)
>   5. **JWT-authenticated WebApp** — `initData` tekshiruvi + ERP SSO token exchange
>
> Sabablar (P49 da to'liq Mini App bajarilmaydigan):
>   - JWT WebApp authentication — alohida OAuth/initData endpoint kerak (auth moduli doirasida)
>   - Inline keyboard callback_query handler — `handleBotUpdate` kengaytirish kerak, lekin scope kattalashadi
>   - Barcode skan TWA API — FE Mini App sahifasi kerak (alohida FE paket)
>   - `/request` va `/history` — POS repository yangi metodlar kerak (owned emas)
>
> **P49 foundation qo'yadi (webhook + 3 komanda); to'liq Mini-App = keyingi dedicated POS-Telegram paketi.**

- **Muhim:** Telegraf.js kutubxonasi pnpm dep sifatida qo'shilmaydi (DEPENDENCY_STANDARTLARI.md — yangi dep egasi ruxsati kerak, Q-34). Raw Bot API webhook ishlatiladi.

#### J. Unit conversion (EP-POS-057)
- Rulon/kg o'zgartirish: pres materiallar rulon bilan kiradi, kg bilan sarf qilinadi.
- `pos_movement_lines` ga `input_unit varchar(20)`, `input_quantity numeric` ustunlari kerak (DDL GATED).
- Hozircha: `CreateMovementLineSchema` ga `inputUnit` va `inputQuantity` optional maydonlari qo'shiladi, servis bu maydonlarni qabul qiladi va saqlab qo'yadi — hisoblash EP-POS-057 ikkinchi faza.

#### K. Karantin enum mismatch tuzatish (BROKEN — HIGH)
- `quarantine-workflow.service.ts:40` — `'karantin'` statusini yozmoqda.
- `pos_movement_status_enum` da `'karantin'` YO'Q, faqat `'qc_pending'` bor.
- `pos-movement-status.constants.ts:14` — `VALID_TRANSITIONS` da `'karantin'` ishlatiladi.
- **Fix strategiyasi (egasiz DDL kerak emas):** `quarantine-workflow.service.ts` ichida `'karantin'` → `'qc_pending'` ga o'zgartirish. `pos-movement-status.constants.ts` da ham `VALID_TRANSITIONS` dan `karantin` olib tashlanadi — `draft → ['qc_pending', 'pending', 'cancelled']`.
- Bu DDL talab qilmaydi — faqat kod o'zgarishi.

#### L. Dual GL write xavfi (BROKEN — HIGH)
- `pos.events.ts:133` — `approved` event'da `autoGl.postForMovement()` → `pos_gl_postings`.
- `pos.events.ts:180` — `completed` event'da `glLedger.postMovementToCanonicalLedger()` → `entries`.
- Bu double-write xavfi. **Fix:** `approved` event'dagi `autoGl.postForMovement()` chaqiruvini olib tashla — yagona GL yo'l = `completed` event'da `entries`. Bu P49 owned file bo'lgan `pos.events.ts` emas — **bu P49 SCOPE'DAN TASHQARI** (pos.events.ts owned file ro'yxatida yo'q). Flag egasiga.

---

## 3. HOZIRGI HOLAT

### Mavjud (EXISTS):

| Fayl | Satr | Holat |
|------|------|-------|
| `apps/api/src/modules/pos/application/event-handlers/pos.events.ts` | 1-234 | PosEventHandler — MES event bor, lekin WebSocket broadcast, POS harakat yaratmaydi |
| `apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts` | 40 | `'karantin'` yozmoqda — enum'da YO'Q (BROKEN) |
| `apps/api/src/modules/pos/application/services/pos-movement-status.constants.ts` | 14 | `VALID_TRANSITIONS.draft = ['karantin', ...]` — enum'da `'karantin'` YO'Q (BROKEN) |
| `apps/api/src/modules/pos/application/services/warehouse-kpi.service.ts` | 1+ | KPI hisoblaydi lekin `pos_gsd_metrics` jadvali YO'Q, push YO'Q |
| `apps/api/src/modules/pos/application/jobs/pos-low-stock.job.ts` | 34-48 | Notification yaratadi, MM'ga event CHIQARMAYDI |
| `apps/api/src/modules/pos/application/services/telegram-bot.service.ts` | 1-144 | Raw fetch, passiv, `/status`/`/approve` komandalar YO'Q |
| `apps/api/src/modules/pos/pos.module.ts` | 52-226 | `TelegramBotService` provider sifatida bor |
| `artifacts/erp-dashboard/src/pos-monitor/components/PosBarcodeScanner.tsx` | 92-95 | `BarcodeDetector` tekshiruvi bor, lekin fallback = error message, ZXing YO'Q |
| `artifacts/erp-dashboard/vite.config.ts` | 121-282 | `VitePWA` bor, background sync faqat `/api/pos/sales` uchun — movements uchun YO'Q |
| `artifacts/erp-dashboard/src/pos-monitor/hooks/useOfflineSync.ts` | 1-389 | IndexedDB queue mavjud, background sync API yo'q |
| `lib/db/src/schema/pos-schema-v2.ts` | 22-31 | `movementTypeEnum` — `FG_FROM_MES` va `SCRAP_IN` YO'Q |
| `lib/db/src/schema/pos-schema-v2.ts` | 33-44 | `movementStatusEnum` — `'karantin'` YO'Q (faqat `'qc_pending'` bor) |
| `lib/db/src/schema/pos-schema-v2.ts` | 69-143 | `posMovements` — `photo_urls` ustuni YO'Q |
| `lib/db/src/schema/pos-schema-v2.ts` | 147-165 | `posMovementLines` — `input_unit`, `input_quantity` ustunlari YO'Q |

### Mavjud EMAS (MISSING):

| Narsa | Tavsif |
|-------|--------|
| `pos-mes-fg.listener.ts` | `MesSessionCompletedEvent` listener — POS'da FG harakat yaratadi |
| `pres-kirim.controller.ts` | Pres fast-path controller |
| `pres-kirim.service.ts` | Pres fast-path service |
| `pos-gsd.service.ts` | GSD metrikalari hisoblash va push |
| `pos-gsd-push.job.ts` | Kun oxiri GSD cron job |
| `PresKirimPage.tsx` | Pres kirim FE sahifasi |
| `pos_gsd_metrics` jadvali | GSD metrikalari saqlash uchun |
| `pos_movements.photo_urls` ustuni | Foto dalil (EP-POS-069) |
| `pos_movements.issuer_user_id` va boshqa sign ustunlar | 2-imzo akt (EP-POS-050) — bu P49 da DEFERRED |
| `pos_movement_lines.input_unit`, `input_quantity` | Unit conversion ustunlar |
| `pos_movement_type_enum.FG_FROM_MES` | Enum qiymati |

### Buzuq / Yolg'on (BROKEN/FAKE):

| Fayl | Satr | Muammo |
|------|------|--------|
| `quarantine-workflow.service.ts` | 40 | `'karantin'` → runtime DB enum violation |
| `pos-movement-status.constants.ts` | 14 | `VALID_TRANSITIONS` da `'karantin'` — DB enum'da yo'q |
| `pos.events.ts` | 133 vs 180 | DUAL GL WRITE — `approved`→`pos_gl_postings` + `completed`→`entries` (P49 scope'dan tashqari — flag) |
| `pos-low-stock.job.ts` | 34-48 | MM moduliga event YUBORILMAYDI |
| `PosBarcodeScanner.tsx` | 92-95 | ZXing fallback YO'Q — eski planshetlarda ishlamaydi |
| `vite.config.ts` | 254 | `manifest.name = "EuroPrint ERP — POS Kassa"` — noto'g'ri (bu ombor plansheti) |

---

## 4. ISH (qadam-baqadam)

### QADAM 1: Karantin enum mismatch tuzatish (BROKEN fix — eng muhim)

**Fayl 1:** `apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts`

Muammo: `satr:40` — `'karantin'` → `'qc_pending'` bo'lishi kerak.

```typescript
// OLDIN (satr 40):
await this.repo.updateMovementStatus(movementId, 'karantin', {

// KEYIN:
await this.repo.updateMovementStatus(movementId, 'qc_pending', {
```

`satr:44`:
```typescript
// OLDIN:
this.logger.log(`[Quarantine] Movement ${movementId} → 'karantin' (QC-HOLD ${qcWh.id})`);

// KEYIN:
this.logger.log(`[Quarantine] Movement ${movementId} → 'qc_pending' (QC-HOLD ${qcWh.id})`);
```

`MovementStatus` type (satr 11-13):
```typescript
// OLDIN:
export type MovementStatus =
  | 'draft' | 'pending' | 'karantin' | 'qc_review'
  | 'approved' | 'rejected' | 'completed' | 'cancelled';

// KEYIN:
export type MovementStatus =
  | 'draft' | 'pending' | 'qc_pending' | 'qc_approved' | 'qc_rework'
  | 'qc_rejected' | 'approved' | 'ai_processing' | 'completed' | 'cancelled';
```

`STATUS_FLOW` (satr 15-24):
```typescript
// OLDIN:
export const STATUS_FLOW: Record<string, MovementStatus[]> = {
  draft:     ['pending', 'karantin', 'cancelled'],
  pending:   ['karantin', 'qc_review', 'approved', 'rejected', 'cancelled'],
  karantin:  ['qc_review', 'cancelled'],
  qc_review: ['approved', 'rejected', 'cancelled'],
  ...
};

// KEYIN — enum'dagi qiymatlar bilan mos:
export const STATUS_FLOW: Record<string, MovementStatus[]> = {
  draft:         ['qc_pending', 'pending', 'cancelled'],
  qc_pending:    ['qc_approved', 'qc_rework', 'qc_rejected'],
  qc_approved:   ['pending', 'cancelled'],
  qc_rework:     ['qc_pending'],
  qc_rejected:   ['cancelled'],
  pending:       ['approved', 'cancelled'],
  approved:      ['ai_processing', 'completed'],
  ai_processing: ['completed', 'cancelled'],
  completed:     [],
  cancelled:     [],
};
```

**Fayl 2:** `apps/api/src/modules/pos/application/services/pos-movement-status.constants.ts`

`VALID_TRANSITIONS` (satr 13-25):
```typescript
// OLDIN:
export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:        ['karantin', 'qc_pending', 'pending', 'cancelled'],
  karantin:     ['qc_pending', 'cancelled'],
  qc_pending:   ['qc_approved', 'qc_rework', 'qc_rejected'],
  ...
};

// KEYIN — 'karantin' olib tashlanadi (enum'da yo'q):
export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:         ['qc_pending', 'pending', 'cancelled'],
  qc_pending:    ['qc_approved', 'qc_rework', 'qc_rejected'],
  qc_approved:   ['pending', 'cancelled'],
  qc_rework:     ['qc_pending'],
  qc_rejected:   ['cancelled'],
  pending:       ['approved', 'cancelled'],
  approved:      ['ai_processing', 'completed'],
  ai_processing: ['completed', 'cancelled'],
  completed:     [],
  cancelled:     [],
};
```

> ⚠️ `pos-movement-status.constants.ts` owned file ro'yxatida YO'Q — lekin bu BROKEN fix (karantin mismatch). Bu fayl `movements.controller.ts` orqali ishlatiladi va owned. Barcha o'zgarishlarni owned file chegarasida ushla. Agar `quarantine-workflow.service.ts` ham owned file ro'yxatida bo'lmasa — faqat `quarantine-workflow.service.ts` tegishli qismini o'zgartir, constants faylini to'g'rilash uchun egaga flag.

**DB-proof (bu qadam uchun):**
```sql
-- Eski 'karantin' qiymati yo'qligini tasdiqlash:
SELECT unnest(enum_range(NULL::pos_movement_status_enum)) AS val;
-- 'karantin' ko'rinmasligi kerak
-- 'qc_pending' ko'rinishi kerak
```

---

### QADAM 2: DDL migration faylini yoz (GATED — ishga tushirma)

**Fayl:** `apps/api/src/database/migrations/p49-pos-mes-photo-gsd-scrap.sql`

```sql
-- APPROVED: <egasi ism-sharifi> <sana>
-- P49 POS Monitor: FG_FROM_MES enum + photo_urls + GSD metrics + unit conversion
-- ⚠️ GATED — bu faylni faqat egasi ruxsatidan keyin ishga tushir

-- 1. FG_FROM_MES harakat turi qo'shish
ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'FG_FROM_MES';

-- 2. Photo dalil ustuni (EP-POS-069)
ALTER TABLE pos_movements
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- 3. Qator darajasida foto (zarar akti uchun)
ALTER TABLE pos_movement_lines
  ADD COLUMN IF NOT EXISTS photo_url text;

-- 4. Unit conversion ustunlari (EP-POS-057)
ALTER TABLE pos_movement_lines
  ADD COLUMN IF NOT EXISTS input_unit varchar(20),
  ADD COLUMN IF NOT EXISTS input_quantity numeric(20,4);

-- 5. 2-imzo akt ustunlari (EP-POS-050) — issuer/receiver
ALTER TABLE pos_movements
  ADD COLUMN IF NOT EXISTS issuer_user_id integer,
  ADD COLUMN IF NOT EXISTS receiver_user_id integer,
  ADD COLUMN IF NOT EXISTS issuer_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receiver_signed_at timestamptz;

-- 6. GSD metrikalari jadvali
CREATE TABLE IF NOT EXISTS pos_gsd_metrics (
  id               serial         PRIMARY KEY,
  employee_id      integer        NOT NULL,
  date             date           NOT NULL,
  plan_completion_pct numeric(5,2),
  delay_count      integer        NOT NULL DEFAULT 0,
  deviation_count  integer        NOT NULL DEFAULT 0,
  org_function_id  integer,
  warehouse_id     integer,
  notes            text,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_gsd_metrics_date
  ON pos_gsd_metrics (date);

CREATE INDEX IF NOT EXISTS idx_pos_gsd_metrics_employee
  ON pos_gsd_metrics (employee_id);

-- SCRAP_IN: EP-037 egasi Excel faylini topshirgandan keyin qo'shiladi
-- ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'SCRAP_IN'; -- DEFERRED
```

---

### QADAM 3: Drizzle schema yangilash

**Uyg'unlik eslatmasi:** `lib/db/src/schema/pos-schema-v2.ts` owned file ro'yxatida **YO'Q**. Drizzle schema o'zgarishi lib/db paketi egasinikida. P49 bajaruvchisi bu faylga tegmasligi kerak.

**Flag egasiga:** Qadam 2 DDL approved bo'lgandan keyin, `lib/db/src/schema/pos-schema-v2.ts` faylini yangilash kerak:
- `movementTypeEnum` ga `'FG_FROM_MES'` qo'shish
- `posMovements` ga `photoUrls`, `issuerUserId`, `receiverUserId`, `issuerSignedAt`, `receiverSignedAt` qo'shish
- `posMovementLines` ga `photoUrl`, `inputUnit`, `inputQuantity` qo'shish
- `pos_gsd_metrics` uchun yangi `pgTable` qo'shish

Shu vaqtgacha, P49 backend kodi `db.execute(sql\`...\`)` orqali raw insert ishlatadi (izoh bilan).

---

### QADAM 4: `pos-mes-fg.listener.ts` — YANGI FAYL

**Fayl:** `apps/api/src/modules/pos/application/event-handlers/pos-mes-fg.listener.ts`

Bu fayl `MesSessionCompletedEvent` eventini tinglaydi va `FG_FROM_MES` harakatini yaratadi.

```typescript
/**
 * pos-mes-fg.listener.ts
 *
 * MES sessiyasi yakunlanganda → Tayyor Mahsulot (FG) kirim harakati avtomatik yaratiladi.
 * EP-POS-024 — Phase 4 MES integratsiya.
 *
 * Event: 'mes.session.completed'
 * Payload: MesSessionCompletedPayload
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DrizzleService } from '@common/database/drizzle.service';
import { Result, Ok, Err, AppError } from '@common/result';
import { sql } from 'drizzle-orm';

export interface MesSessionCompletedPayload {
  sessionId:       number;
  papkaOrderId?:   number;
  materialCardId:  number;
  qty:             number;
  unit:            string;
  shiftId?:        number;
  operatorId:      number;
  fgWarehouseId?:  number;   // agar berilmasa — DB dan 'FG-STORE' ombor topiladi
  sessionNumber?:  string;
}

interface FgWarehouseRow { id: number; code: string }

@Injectable()
export class PosMesFgListener {
  private readonly logger = new Logger(PosMesFgListener.name);

  constructor(private readonly db: DrizzleService) {}

  @OnEvent('mes.session.completed', { async: true })
  async handleMesSessionCompleted(payload: MesSessionCompletedPayload): Promise<void> {
    this.logger.log(
      `[MES→FG] Session ${payload.sessionId} yakunlandi — FG harakat yaratilmoqda`,
    );
    const r = await this.createFgMovement(payload);
    if (!r.ok) {
      this.logger.error(
        `[MES→FG] FG harakat yaratishda xato: [${r.error.code}] ${r.error.message}`,
      );
    } else {
      this.logger.log(
        `[MES→FG] FG harakat yaratildi: movementId=${r.data.movementId}, ` +
        `movementNumber=${r.data.movementNumber}`,
      );
    }
  }

  private async createFgMovement(
    payload: MesSessionCompletedPayload,
  ): Promise<Result<{ movementId: number; movementNumber: string }, AppError>> {
    try {
      // 1. FG ombor ID si — payload'dan yoki DB dan FG-STORE turi
      let fgWarehouseId = payload.fgWarehouseId;
      if (!fgWarehouseId) {
        const rows = await this.db.execute<FgWarehouseRow>(
          sql`SELECT id, code FROM warehouses
              WHERE type = 'FG-STORE' AND is_active = TRUE
              ORDER BY id ASC LIMIT 1`,
        );
        const fgWh = Array.isArray(rows) ? rows[0] : null;
        if (!fgWh) {
          return Err({
            message: "FG-STORE turi ombor topilmadi — avval ombor sozlamalarda yarating",
            code: 'NOT_FOUND',
          });
        }
        fgWarehouseId = fgWh.id;
      }

      // 2. Harakat raqami yaratish: FG-{YYYYMMDD}-{sessionId}
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const movementNumber = `FG-${today}-${payload.sessionId}`;

      // 3. Mavjudligini tekshir (idempotent — bir sessiya bir marta)
      const existing = await this.db.execute<{ id: number }>(
        sql`SELECT id FROM pos_movements WHERE movement_number = ${movementNumber} LIMIT 1`,
      );
      if (Array.isArray(existing) && existing.length > 0) {
        this.logger.warn(
          `[MES→FG] ${movementNumber} allaqachon mavjud — takroriy trigger o'tkazib yuborildi`,
        );
        return Ok({ movementId: existing[0].id, movementNumber });
      }

      // 4. Asosiy harakat yozuvi
      const mvRows = await this.db.execute<{ id: number }>(
        sql`INSERT INTO pos_movements (
              movement_number, movement_type, to_warehouse_id,
              status, created_by, notes, created_at, updated_at
            )
            VALUES (
              ${movementNumber}, 'FG_FROM_MES', ${String(fgWarehouseId)},
              'completed', ${payload.operatorId},
              ${'MES sessiya #' + payload.sessionId + ' dan avtomatik kirim'},
              now(), now()
            )
            RETURNING id`,
      );
      const mvId = Array.isArray(mvRows) && mvRows[0]?.id ? mvRows[0].id : null;
      if (!mvId) {
        return Err({ message: 'pos_movements INSERT muvaffaqiyatsiz', code: 'DB_ERROR' });
      }

      // 5. Harakat qatori
      await this.db.execute(
        sql`INSERT INTO pos_movement_lines (
              movement_id, material_id, unit, quantity,
              unit_price, total_price, created_at
            )
            VALUES (
              ${mvId}, ${payload.materialCardId}, ${payload.unit},
              ${payload.qty}, 0, 0, now()
            )`,
      );

      // 6. warehouse_stock'ni yangilash (kanonik ombor, ADR-004)
      await this.db.execute(
        sql`INSERT INTO warehouse_stock (warehouse_id, material_card_id, quantity, unit, updated_at)
            VALUES (${fgWarehouseId}, ${payload.materialCardId}, ${payload.qty}, ${payload.unit}, now())
            ON CONFLICT (warehouse_id, material_card_id)
            DO UPDATE SET
              quantity   = warehouse_stock.quantity + EXCLUDED.quantity,
              updated_at = now()`,
      );

      return Ok({ movementId: mvId, movementNumber });
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
```

---

### QADAM 5: `pres-kirim.service.ts` — YANGI FAYL

**Fayl:** `apps/api/src/modules/pos/application/services/pres-kirim.service.ts`

```typescript
/**
 * pres-kirim.service.ts
 *
 * Pres fast-path: matbaa mashinasi (pres) WIP → FG omborga fast kirim.
 * EP-POS Phase 6.
 *
 * Jarayon: operator kg → harakat avtomatik completed → barcode sticker
 */
import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@common/database/drizzle.service';
import { Result, Ok, Err, AppError } from '@common/result';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

export const PresKirimSchema = z.object({
  materialCardId: z.number().int().positive(),
  qty:            z.number().positive(),
  unit:           z.string().min(1).max(20).default('kg'),
  presId:         z.string().min(1).max(50),       // mashinaning kodi
  shiftId:        z.number().int().positive().optional(),
  operatorId:     z.number().int().positive(),
  notes:          z.string().max(500).optional(),
});
export type PresKirimDto = z.infer<typeof PresKirimSchema>;

export interface PresKirimResult {
  movementId:     number;
  movementNumber: string;
  barcodeData:    string;   // barcode sticker uchun CODE128 qiymati
}

interface WhRow { id: number; code: string }

@Injectable()
export class PresKirimService {
  private readonly logger = new Logger(PresKirimService.name);

  constructor(private readonly db: DrizzleService) {}

  async createPresKirim(dto: PresKirimDto): Promise<Result<PresKirimResult, AppError>> {
    try {
      // 1. WIP-STORE ombori
      const wipRows = await this.db.execute<WhRow>(
        sql`SELECT id, code FROM warehouses WHERE type = 'WIP-STORE' AND is_active = TRUE ORDER BY id LIMIT 1`,
      );
      const wipWh = Array.isArray(wipRows) ? wipRows[0] : null;
      if (!wipWh) {
        return Err({ message: 'WIP-STORE ombori topilmadi', code: 'NOT_FOUND' });
      }

      // 2. FG-STORE ombori
      const fgRows = await this.db.execute<WhRow>(
        sql`SELECT id, code FROM warehouses WHERE type = 'FG-STORE' AND is_active = TRUE ORDER BY id LIMIT 1`,
      );
      const fgWh = Array.isArray(fgRows) ? fgRows[0] : null;
      if (!fgWh) {
        return Err({ message: 'FG-STORE ombori topilmadi', code: 'NOT_FOUND' });
      }

      // 3. Harakat raqami
      const ts    = Date.now().toString(36).toUpperCase();
      const mvNum = `PRS-${dto.presId}-${ts}`;

      // 4. Movement INSERT (status = completed — fast-path)
      const mvRows = await this.db.execute<{ id: number }>(
        sql`INSERT INTO pos_movements (
              movement_number, movement_type, from_warehouse_id, to_warehouse_id,
              status, created_by, notes, created_at, updated_at
            )
            VALUES (
              ${mvNum}, 'INTERNAL_ISSUE', ${String(wipWh.id)}, ${String(fgWh.id)},
              'completed', ${dto.operatorId},
              ${'Pres fast-kirim: mashina ' + dto.presId + (dto.notes ? ' — ' + dto.notes : '')},
              now(), now()
            )
            RETURNING id`,
      );
      const mvId = Array.isArray(mvRows) && mvRows[0]?.id ? mvRows[0].id : null;
      if (!mvId) {
        return Err({ message: 'pos_movements INSERT muvaffaqiyatsiz', code: 'DB_ERROR' });
      }

      // 5. Movement line
      await this.db.execute(
        sql`INSERT INTO pos_movement_lines (movement_id, material_id, unit, quantity, unit_price, total_price, created_at)
            VALUES (${mvId}, ${dto.materialCardId}, ${dto.unit}, ${dto.qty}, 0, 0, now())`,
      );

      // 6. warehouse_stock yangilash
      await this.db.execute(
        sql`INSERT INTO warehouse_stock (warehouse_id, material_card_id, quantity, unit, updated_at)
            VALUES (${fgWh.id}, ${dto.materialCardId}, ${dto.qty}, ${dto.unit}, now())
            ON CONFLICT (warehouse_id, material_card_id)
            DO UPDATE SET quantity = warehouse_stock.quantity + EXCLUDED.quantity, updated_at = now()`,
      );

      const barcodeData = `PRESKIRIM-${mvNum}`;
      this.logger.log(`[PresKirim] Yaratildi: ${mvNum} (mvId=${mvId})`);
      return Ok({ movementId: mvId, movementNumber: mvNum, barcodeData });
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
```

---

### QADAM 6: `pres-kirim.controller.ts` — YANGI FAYL

**Fayl:** `apps/api/src/modules/pos/presentation/pres-kirim.controller.ts`

```typescript
/**
 * pres-kirim.controller.ts
 *
 * Pres fast-path endpoint.
 * POST /api/pos/pres-kirim → PresKirimService.createPresKirim()
 */
import { Controller, Post, Body, UseGuards, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PresKirimService, PresKirimSchema } from '../application/services/pres-kirim.service';

@ApiTags('POS — Pres Kirim')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/pres-kirim')
export class PresKirimController {
  private readonly logger = new Logger(PresKirimController.name);

  constructor(private readonly presKirimService: PresKirimService) {}

  @Post()
  @RequirePermission('pos:movement:create')
  @ApiOperation({ summary: 'Pres fast-kirim — matbaa mashinasidan FG omboriga tez kirim' })
  async create(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = PresKirimSchema.parse(body);
    // operatorId = JWT dan olingan foydalanuvchi
    const dtoWithUser = { ...dto, operatorId: dto.operatorId ?? user.id };
    const result = await this.presKirimService.createPresKirim(dtoWithUser);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
}
```

---

### QADAM 7: `pos-gsd.service.ts` — YANGI FAYL

**Fayl:** `apps/api/src/modules/pos/application/services/pos-gsd.service.ts`

```typescript
/**
 * pos-gsd.service.ts
 *
 * GSD (Günlük Saqlash Darajasi / Kunlik Ish Samaradorligi) metrikalari.
 * EP-POS-029/056 — har ombor uchun ish ko'rsatkichlarini HR kartasiga push.
 *
 * ⚠️ EGASI QIYMATI KERAK: GSD formula parametrlari tasdiqlanmagan.
 * Manba: MASTER-SAVOL-JAVOB-2026-06-08.md (EP-POS-056):
 *   "aniq 3-ko'rsatkich formulasini belgilamagan — egasi tasdig'i kerak."
 *
 * Quyidagi formulalar TAXMINIY — egasi tasdiqlaguncha PLACEHOLDER:
 *   plan_completion_pct = (completed movements today / planned today) × 100
 *     → "planned today" qanday aniqlanadi? (reja jadvali? kutilgan harakat soni?) — EGASI JAVOB KERAK
 *   delay_count         = harakatlar created_at + 4 soat dan kech bajarilgan (4 soat — IXTIRO)
 *     → Haqiqiy muddatni egasi belgilaydi (smena uzunligi? SLA?) — EGASI JAVOB KERAK
 *   deviation_count     = harakat miqdori normadan >5% farqlangan (5% — IXTIRO)
 *     → Haqiqiy chegara egasi belgilaydi — EGASI JAVOB KERAK
 *
 * Egasi formula parametrlarini tasdiqlaguncha:
 *   - Metrikalar pos_gsd_metrics jadvaliga yoziladi (ma'lumot yo'qolmaydi)
 *   - HR kartasiga avtomatik ta'sir KO'RSATMAYDI (faqat saqlash)
 *   - Hisob-kitob natijalar "formula_confirmed: false" bilan belgilanishi tavsiya etiladi
 */
import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@common/database/drizzle.service';
import { Result, Ok, Err, AppError } from '@common/result';
import { sql } from 'drizzle-orm';

interface GsdRow {
  employee_id:        number;
  warehouse_id:       number;
  org_function_id:    number | null;
  completed_today:    number;
  planned_today:      number;
  delay_count:        number;
  deviation_count:    number;
}

interface GsdPushSummary {
  date:    string;
  written: number;
  skipped: number;
}

@Injectable()
export class PosGsdService {
  private readonly logger = new Logger(PosGsdService.name);

  constructor(private readonly db: DrizzleService) {}

  /**
   * Bugungi GSD metrikalari hisoblash va pos_gsd_metrics jadvaliga yozish.
   * pos_gsd_metrics jadvali DDL approved bo'lganidan keyin chaqiriladi.
   * Agar jadval mavjud bo'lmasa — WARN loglanadi, xato tashlanmaydi (best-effort).
   */
  async pushDailyMetrics(date?: Date): Promise<Result<GsdPushSummary, AppError>> {
    const targetDate = date ?? new Date();
    const dateStr = targetDate.toISOString().slice(0, 10);

    try {
      // 1. Bugungi harakat statistikasini hisoblash
      const rows = await this.db.execute<GsdRow>(sql`
        SELECT
          pm.created_by                                                AS employee_id,
          COALESCE(pm.from_warehouse_id::int, pm.to_warehouse_id::int) AS warehouse_id,
          e.org_function_id                                            AS org_function_id,
          COUNT(*) FILTER (WHERE pm.status = 'completed')             AS completed_today,
          COUNT(*)                                                     AS planned_today,
          COUNT(*) FILTER (
            WHERE pm.status = 'completed'
              -- ⚠️ EGASI QIYMATI KERAK: '4 hours' chegara tasdiqlanmagan (ixtiro)
              AND pm.updated_at > pm.created_at + INTERVAL '4 hours'
          )                                                            AS delay_count,
          -- ⚠️ EGASI QIYMATI KERAK: deviation_count formula tasdiqlanmagan (hozir 0 placeholder)
          0                                                            AS deviation_count
        FROM pos_movements pm
        LEFT JOIN employees e ON e.id = pm.created_by
        WHERE pm.created_at::date = ${dateStr}
          AND pm.deleted_at IS NULL
        GROUP BY pm.created_by, pm.from_warehouse_id, pm.to_warehouse_id, e.org_function_id
      `);

      if (!Array.isArray(rows) || rows.length === 0) {
        this.logger.log(`[GSD] ${dateStr} uchun ma'lumot topilmadi`);
        return Ok({ date: dateStr, written: 0, skipped: 0 });
      }

      let written = 0, skipped = 0;

      for (const row of rows) {
        if (!row.employee_id || !row.warehouse_id) { skipped++; continue; }

        const pct =
          row.planned_today > 0
            ? Math.round((row.completed_today / row.planned_today) * 100 * 100) / 100
            : 0;

        try {
          await this.db.execute(sql`
            INSERT INTO pos_gsd_metrics
              (employee_id, date, plan_completion_pct, delay_count, deviation_count, org_function_id, warehouse_id, created_at)
            VALUES
              (${row.employee_id}, ${dateStr}, ${pct}, ${row.delay_count}, ${row.deviation_count},
               ${row.org_function_id ?? null}, ${row.warehouse_id}, now())
            ON CONFLICT (employee_id, date, warehouse_id)
            DO UPDATE SET
              plan_completion_pct = EXCLUDED.plan_completion_pct,
              delay_count         = EXCLUDED.delay_count,
              deviation_count     = EXCLUDED.deviation_count
          `);
          written++;
        } catch (innerErr) {
          // Jadval yo'q bo'lishi mumkin (DDL gated) — WARN, break emas
          this.logger.warn(`[GSD] Yozuvda xato (employee=${row.employee_id}): ${String(innerErr)}`);
          skipped++;
        }
      }

      this.logger.log(`[GSD] ${dateStr}: written=${written}, skipped=${skipped}`);
      return Ok({ date: dateStr, written, skipped });
    } catch (e) {
      this.logger.error(`[GSD] pushDailyMetrics xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
```

---

### QADAM 8: `pos-gsd-push.job.ts` — YANGI FAYL

**Fayl:** `apps/api/src/modules/pos/application/jobs/pos-gsd-push.job.ts`

```typescript
/**
 * pos-gsd-push.job.ts
 *
 * Har kuni 23:45 da ishga tushadi — GSD metrikalari HR kartasiga push.
 * EP-POS-029/056.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PosGsdService } from '../services/pos-gsd.service';

@Injectable()
export class PosGsdPushJob {
  private readonly logger = new Logger(PosGsdPushJob.name);

  constructor(private readonly gsdService: PosGsdService) {}

  @Cron('45 23 * * *', { name: 'pos-gsd-push', timeZone: 'Asia/Tashkent' })
  async pushDailyGsd(): Promise<void> {
    this.logger.log('[GSD Cron] Kunlik GSD push boshlandi...');
    const result = await this.gsdService.pushDailyMetrics();
    if (result.ok) {
      this.logger.log(
        `[GSD Cron] Yakunlandi: date=${result.data.date}, written=${result.data.written}, skipped=${result.data.skipped}`,
      );
    } else {
      this.logger.error(`[GSD Cron] Xato: ${result.error.message}`);
    }
  }
}
```

---

### QADAM 9: `pos-low-stock.job.ts` — MM event emission qo'shish

**Fayl:** `apps/api/src/modules/pos/application/jobs/pos-low-stock.job.ts`

Hozirgi kod (satr 34-48) faqat notification yaratadi. Fix: `EventEmitter2` import qilib `pos.low_stock.detected` event chiqarish.

```typescript
// MAVJUD import qatorlari (satr 6-10):
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PosFifoService } from '../services/pos-fifo.service';
import { PosTelegramService } from '../services/pos-telegram.service';
import { PosNotificationsService } from '../services/pos-notifications.service';

// KEYIN — EventEmitter2 qo'shish:
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PosFifoService } from '../services/pos-fifo.service';
import { PosTelegramService } from '../services/pos-telegram.service';
import { PosNotificationsService } from '../services/pos-notifications.service';
```

Constructor:
```typescript
// OLDIN (satr 16-20):
constructor(
  private readonly fifo:          PosFifoService,
  private readonly telegram:      PosTelegramService,
  private readonly notifications: PosNotificationsService,
) {}

// KEYIN:
constructor(
  private readonly fifo:          PosFifoService,
  private readonly telegram:      PosTelegramService,
  private readonly notifications: PosNotificationsService,
  private readonly eventEmitter:  EventEmitter2,
) {}
```

`checkLowStock` ichida (satr 33-41 dan keyin, notification loop ichida):
```typescript
// OLDIN — faqat notification:
for (const item of r.data.slice(0, 20)) {
  await this.notifications.createNotification({
    type: 'LOW_STOCK',
    title: 'Past qoldiq ogohlantirishi',
    body: `Material ${item.materialCode}: ${item.currentQty}/${item.minQty} (Ombor #${item.warehouseId})`,
    targetRole: 'pos_manager',
  }).catch(() => null);
}

// KEYIN — notification + event emission:
for (const item of r.data.slice(0, 20)) {
  await this.notifications.createNotification({
    type: 'LOW_STOCK',
    title: 'Past qoldiq ogohlantirishi',
    body: `Material ${item.materialCode}: ${item.currentQty}/${item.minQty} (Ombor #${item.warehouseId})`,
    targetRole: 'pos_manager',
  }).catch(() => null);

  // EP-POS-065: MM moduliga reorder signal
  this.eventEmitter.emit('pos.low_stock.detected', {
    materialCardId: item.materialCardId,
    warehouseId:    item.warehouseId,
    currentQty:     item.currentQty,
    minQty:         item.minQty,
    materialCode:   item.materialCode,
    unit:           item.unit ?? 'dona',
  });
}
```

---

### QADAM 10: `movements.controller.ts` — SCRAP_IN 501 stub + photo validation

**Fayl:** `apps/api/src/modules/pos/presentation/movements.controller.ts`

Mavjud `POST /pos/movements` handlerini topib (CreateMovement), SCRAP_IN tekshiruvi qo'sh:

```typescript
// Mavjud @Post() handleridan keyin, CreateMovementDto parse qilingandan so'ng qo'shing:

// SCRAP_IN 501 stub (EP-POS-037 — egasi Excel faylini kutmoqda)
if (dto.movementType === 'SCRAP_IN') {
  throw new HttpException(
    { message: 'SCRAP_IN turi hali kutilmoqda: egasi makulatura Excel faylini topshirgandan keyin', code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
}
```

`HttpException` va `HttpStatus` import qilinganini tekshir (controllers allaqachon import qilgan bo'lishi kerak).

---

### QADAM 11: `telegram-bot.service.ts` — Bot command handler qo'shish (Mini-App foundation)

**Fayl:** `apps/api/src/modules/pos/application/services/telegram-bot.service.ts`

> **Scope eslatmasi:** Bu qadam to'liq Telegram Mini-App uchun FOUNDATION qo'yadi.
> Egasi "to'liq Mini App" degan (EP-POS-071 / VISION-1000 Q940), lekin P49 da faqat
> webhook infrastructure + 3 asosiy komanda (/start, /status, /approve) amalga oshiriladi.
> To'liq Mini-App (barcode skan, so'rov, tarix, inline_keyboard, JWT initData) = keyingi paket.
> Deferred ro'yxati: seksiya I izohida batafsil.

Mavjud faylga (144-qatordan keyin) yangi metodlar qo'shiladi:

```typescript
// Mavjud getLogs() metodidan keyin qo'shish:

/**
 * Webhook update'ni qayta ishlash.
 * P49 qo'llab-quvvatlanadigan komandalari (Mini-App foundation — boshlang'ich faz):
 *   /start   — xush kelibsiz xabari + qo'llanma
 *   /status  — bot holati + so'nggi 5 harakat
 *   /approve <id> — harakatni tasdiqlash (pos_manager roli kerak — tekshiruv DB da)
 *
 * ⚠️ DEFERRED (to'liq Mini-App keyingi paketda):
 *   /request <material> <qty> — tovar chiqim so'rovi
 *   /history [n]              — harakat tarixi
 *   Barcode skan (TWA scanQrPopup API)
 *   Inline keyboard callback_query handler
 *   JWT WebApp authentication (initData + ERP SSO token exchange)
 */
async handleBotUpdate(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg?.text || !msg.chat?.id) return;

  const chatId  = msg.chat.id;
  const text    = msg.text.trim();
  const userId  = msg.from?.id;

  if (text.startsWith('/start')) {
    await this.sendMessage(chatId, '<b>EuroPrint ERP Ombor Boti</b>\n\nFoydalanish:\n/status — holat\n/approve &lt;id&gt; — harakatni tasdiqlash');
    return;
  }

  if (text.startsWith('/status')) {
    const statusText = this.buildStatusText();
    await this.sendMessage(chatId, statusText);
    return;
  }

  if (text.startsWith('/approve ')) {
    const parts    = text.split(' ');
    const mvIdStr  = parts[1];
    const mvId     = mvIdStr ? parseInt(mvIdStr, 10) : NaN;
    if (isNaN(mvId)) {
      await this.sendMessage(chatId, '❌ Noto\'g\'ri harakat ID');
      return;
    }
    await this.sendMessage(
      chatId,
      `📋 Harakat #${mvId} tasdiqlash so'rovi qabul qilindi.\n<i>Tasdiqlash ERP tizimi orqali amalga oshiriladi.</i>`,
    );
    return;
  }

  await this.sendMessage(chatId, 'Noma\'lum komanda. /status yoki /approve &lt;id&gt; yozing.');
}

private buildStatusText(): string {
  const configured = !!this.token;
  const logsCount  = this.logs.length;
  const lastLogs   = this.logs.slice(-5);
  const logLines   = lastLogs
    .map(l => `• ${l.status === 'sent' ? '✅' : '❌'} ${l.chatId}: ${l.text.substring(0, 40)}`)
    .join('\n');

  return (
    `<b>🤖 EuroPrint ERP Bot Holati</b>\n\n` +
    `Token: ${configured ? '✅ Sozlangan' : '❌ Sozlanmagan'}\n` +
    `Jami xabarlar: ${logsCount}\n\n` +
    (logLines ? `<b>So'nggi xabarlar:</b>\n${logLines}` : '<i>Hech qanday xabar yo\'q</i>')
  );
}
```

`TelegramUpdate` interfeysi fayl boshiga qo'shiladi:
```typescript
interface TelegramMessage {
  text?:  string;
  chat?:  { id: number };
  from?:  { id: number; username?: string };
}

export interface TelegramUpdate {
  update_id: number;
  message?:  TelegramMessage;
}
```

---

### QADAM 12: `mini-app.controller.ts` — Telegram webhook endpoint

**Fayl:** `apps/api/src/modules/pos/presentation/mini-app.controller.ts`

Mavjud controller'ga webhook endpoint qo'shiladi:

```typescript
// Mavjud constructor'ga TelegramBotService import qilish:
import { TelegramBotService } from '../application/services/telegram-bot.service';
import type { TelegramUpdate } from '../application/services/telegram-bot.service';

// Constructor'ga parametr qo'shish:
constructor(
  // ... mavjud parametrlar ...
  private readonly telegramBotService: TelegramBotService,
) {}

// Yangi endpoint (fayl oxiriga):
@Post('telegram-webhook')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Telegram bot webhook — Bot API tomonidan chaqiriladi' })
async telegramWebhook(@Body() body: unknown): Promise<{ ok: boolean }> {
  const update = body as TelegramUpdate;
  if (update?.update_id) {
    await this.telegramBotService.handleBotUpdate(update);
  }
  // Har doim 200 qaytariladi — Telegram retry qilmasligi uchun
  return { ok: true };
}
```

---

### QADAM 13: `PosBarcodeScanner.tsx` — ZXing fallback

**Fayl:** `artifacts/erp-dashboard/src/pos-monitor/components/PosBarcodeScanner.tsx`

Hozirgi `startCamera` funksiyasi (satr 91-123):

```typescript
// OLDIN (satr 92-95):
const startCamera = useCallback(async () => {
  setCameraError(null);
  if (!("BarcodeDetector" in window)) {
    setCameraError(t("barcode.cameraUnsupported") || "Bu brauzer kamera skanerni qo'llab-quvvatlamaydi.");
    return;
  }

// KEYIN — ZXing fallback:
const startCamera = useCallback(async () => {
  setCameraError(null);
  const hasNativeDetector = "BarcodeDetector" in window;

  if (!hasNativeDetector) {
    // ZXing fallback — eski planshetlar uchun (Android 6-8)
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const codeReader = new BrowserMultiFormatReader();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        // ZXing continuous decode
        const controls = await codeReader.decodeFromVideoElement(
          videoRef.current,
          (result, err) => {
            if (result) {
              controls.stop();
              stopCamera();
              void doScan(result.getText());
            }
            if (err && !(err.message?.includes("No MultiFormat Readers"))) {
              // Har frame da xato kelishi normal — ignore
            }
          },
        );
      }
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "ZXing xatosi: " + String(err));
    }
    return;
  }

  // Native BarcodeDetector (Chrome/Android 9+):
  // ... mavjud kod davom etadi ...
```

> `@zxing/browser` packageni qo'shish uchun: `pnpm --filter erp-dashboard add @zxing/browser`. Bu **yangi dependency** — DEPENDENCY_STANDARTLARI.md ga ko'ra egasi ruxsati kerak (Q-34). Flag: egasidan `@zxing/browser` qo'shishga ruxsat so'ra. Ruxsat bergunga qadar ZXing import dinamik (`import(...)`) sifatida qoladi — build buzilmaydi, faqat runtime fallback ishlamaydi.

---

### QADAM 14: `vite.config.ts` — PWA manifest name + pos/movements background sync

**Fayl:** `artifacts/erp-dashboard/vite.config.ts`

**O'zgarish 1:** Manifest name (satr 254-257):
```typescript
// OLDIN:
manifest: {
  name: "EuroPrint ERP — POS Kassa",
  short_name: "ERP POS",
  description: "EuroPrint ERP tizimi — POS Kassa oflayn rejimida",

// KEYIN:
manifest: {
  name: "EuroPrint ERP — Zavod Ombori",
  short_name: "ERP Ombor",
  description: "EuroPrint ERP tizimi — Zavod ombori tablet ilovasi (oflayn rejimda ishlaydi)",
```

**O'zgarish 2:** Background sync uchun `pos/movements` POST qo'shish (`workbox.runtimeCaching` massiviga, mavjud `pos-sales-sync-queue` dan keyin):

```typescript
// runtimeCaching massiviga qo'shish:
{
  urlPattern: ({ request }: { request: Request }) =>
    (request.method === "POST" || request.method === "PUT") &&
    /\/api\/pos\/movements/.test(request.url),
  handler: "NetworkOnly",
  options: {
    backgroundSync: {
      name: "pos-movements-sync-queue",
      options: { maxRetentionTime: 24 * 60 },   // 24 soat
    },
  },
},
{
  urlPattern: ({ request }: { request: Request }) =>
    request.method === "POST" &&
    /\/api\/pos\/pres-kirim/.test(request.url),
  handler: "NetworkOnly",
  options: {
    backgroundSync: {
      name: "pos-pres-kirim-sync-queue",
      options: { maxRetentionTime: 8 * 60 },   // 8 soat
    },
  },
},
```

---

### QADAM 15: `PresKirimPage.tsx` — YANGI FAYL

**Fayl:** `artifacts/erp-dashboard/src/pos-monitor/pages/PresKirimPage.tsx`

```tsx
/**
 * PresKirimPage.tsx
 *
 * Pres fast-path sahifasi — matbaa mashinasi operatori uchun tez kirim.
 * 3 maydon: material, miqdor, mashina kodi.
 * EP-POS Phase 6.
 */
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { usePosI18n } from "../i18n/usePosI18n";

interface PresKirimDto {
  materialCardId: number;
  qty:            number;
  unit:           string;
  presId:         string;
  operatorId:     number;
}

interface PresKirimResult {
  movementId:     number;
  movementNumber: string;
  barcodeData:    string;
}

export default function PresKirimPage() {
  const { t } = usePosI18n();

  const [materialCardId, setMaterialCardId] = useState<string>("");
  const [qty,            setQty]            = useState<string>("");
  const [unit,           setUnit]           = useState<string>("kg");
  const [presId,         setPresId]         = useState<string>("");
  const [saving,         setSaving]         = useState(false);
  const [result,         setResult]         = useState<PresKirimResult | null>(null);
  const [error,          setError]          = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const matId = parseInt(materialCardId, 10);
    const qtyNum = parseFloat(qty);

    if (isNaN(matId) || matId <= 0) { setError("Material ID noto'g'ri"); return; }
    if (isNaN(qtyNum) || qtyNum <= 0) { setError("Miqdor musbat bo'lishi kerak"); return; }
    if (!presId.trim()) { setError("Pres mashina kodi kiritilmagan"); return; }

    setSaving(true);
    try {
      const resp = await apiRequest<PresKirimResult>("POST", "/api/pos/pres-kirim", {
        materialCardId: matId,
        qty:            qtyNum,
        unit,
        presId:         presId.trim(),
        operatorId:     0,   // backend JWT dan oladi
      } as PresKirimDto);
      setResult(resp);
      // Formani tozalash
      setMaterialCardId("");
      setQty("");
      setPresId("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Xato: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos-page" style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h2 style={{ color: "var(--pos-text)", marginBottom: 24 }}>
        🖨️ {t("pres.kirimTitle") || "Pres Fast-Kirim"}
      </h2>

      {result && (
        <div style={{
          background: "rgba(0,255,148,0.08)", border: "1px solid rgba(0,255,148,0.3)",
          borderRadius: 10, padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontWeight: 600, color: "var(--pos-success)", marginBottom: 8 }}>
            ✅ {t("pres.kirimCreated") || "Kirim yaratildi"}
          </div>
          <div style={{ fontSize: 13 }}>
            <div>Harakat: <b>{result.movementNumber}</b></div>
            <div>Barcode: <code style={{ fontFamily: "monospace" }}>{result.barcodeData}</code></div>
          </div>
          <button
            className="pos-btn pos-btn-ghost"
            style={{ marginTop: 12, fontSize: 12 }}
            onClick={() => setResult(null)}
          >
            {t("pres.newKirim") || "Yangi kirim"}
          </button>
        </div>
      )}

      {error && (
        <div style={{
          background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.3)",
          borderRadius: 8, padding: 12, marginBottom: 16, color: "var(--pos-danger)", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={(e) => { void handleSubmit(e); }}>
        <div style={{ marginBottom: 16 }}>
          <label className="pos-label">{t("pres.materialId") || "Material ID"}</label>
          <input
            className="pos-input"
            type="number"
            value={materialCardId}
            onChange={e => setMaterialCardId(e.target.value)}
            placeholder="12345"
            required
          />
        </div>

        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <div style={{ flex: 2 }}>
            <label className="pos-label">{t("pres.qty") || "Miqdor"}</label>
            <input
              className="pos-input"
              type="number"
              step="0.001"
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="100.5"
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="pos-label">{t("pres.unit") || "Birlik"}</label>
            <select
              className="pos-input"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            >
              <option value="kg">kg</option>
              <option value="dona">dona</option>
              <option value="m2">m²</option>
              <option value="rulon">rulon</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="pos-label">{t("pres.presId") || "Pres mashina kodi"}</label>
          <input
            className="pos-input"
            type="text"
            value={presId}
            onChange={e => setPresId(e.target.value)}
            placeholder="PRES-01"
            required
          />
        </div>

        <button
          type="submit"
          className="pos-btn pos-btn-primary"
          style={{ width: "100%", padding: "14px 0", fontSize: 16, fontWeight: 600 }}
          disabled={saving}
        >
          {saving ? "..." : (t("pres.submit") || "Kirimni Saqlash")}
        </button>
      </form>
    </div>
  );
}
```

---

### QADAM 16: `pos.module.ts` va `pos.module-imports.ts` yangilash

**Fayl 1:** `apps/api/src/modules/pos/pos.module-imports.ts` — yangi export'lar qo'shish:

```typescript
// Mavjud export'lar oxiriga qo'shish:
export { PosMesFgListener }  from './application/event-handlers/pos-mes-fg.listener';
export { PresKirimController } from './presentation/pres-kirim.controller';
export { PresKirimService }    from './application/services/pres-kirim.service';
export { PosGsdService }       from './application/services/pos-gsd.service';
export { PosGsdPushJob }       from './application/jobs/pos-gsd-push.job';
```

**Fayl 2:** `apps/api/src/modules/pos/pos.module.ts` — yangi provider'lar va controller'lar:

Import blokiga qo'shish:
```typescript
import {
  // ... mavjud import'lar ...
  PosMesFgListener,
  PresKirimController,
  PresKirimService,
  PosGsdService,
  PosGsdPushJob,
} from './pos.module-imports';
```

`controllers` massiviga:
```typescript
// PresKirimController qo'shish:
PresKirimController,
```

`providers` massiviga:
```typescript
// Yangi service'lar qo'shish:
PosMesFgListener,
PresKirimService,
PosGsdService,
PosGsdPushJob,
```

---

### QADAM 17: Foto dalil — CreateMovementDto Zod schema

Hozirgi `CreateMovementSchema` / `CreateMovementDto` fayli `pos/dto/movement.dto.ts` da joylashgan. Bu fayl P49 owned file ro'yxatida **YO'Q** — `movements.controller.ts` bu DTO'ni import qiladi. Flag egasiga: `movement.dto.ts` da `photoUrls: z.array(z.string().url()).optional()` maydonini qo'shish kerak. SCRAP_IN stub P49 controller'da type check sifatida yoziladi.

---

## 5. DDL

```sql
-- =====================================================================
-- FAYL: apps/api/src/database/migrations/p49-pos-mes-photo-gsd-scrap.sql
-- APPROVED: <egasi ism-sharifi> <sana>  ← TO'LDIRING
-- P49 POS Monitor DDL — GATED
-- ⚠️ Bu migration FAQAT egasi ruxsatidan keyin ishga tushiriladi
-- ⚠️ `-- APPROVED:` qatori to'ldirilmagan bo'lsa — ISHGA TUSHIRMA
-- =====================================================================

-- 1. FG_FROM_MES harakat turi
ALTER TYPE pos_movement_type_enum ADD VALUE IF NOT EXISTS 'FG_FROM_MES';
-- Not: SCRAP_IN deferred (egasi Excel fayli kutilmoqda)

-- 2. Foto dalil (EP-POS-069 — MAJBURIY egasi overridi)
ALTER TABLE pos_movements
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

ALTER TABLE pos_movement_lines
  ADD COLUMN IF NOT EXISTS photo_url text;

-- 3. 2-imzo akt (EP-POS-050)
ALTER TABLE pos_movements
  ADD COLUMN IF NOT EXISTS issuer_user_id    integer,
  ADD COLUMN IF NOT EXISTS receiver_user_id  integer,
  ADD COLUMN IF NOT EXISTS issuer_signed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS receiver_signed_at timestamptz;

-- 4. Unit conversion (EP-POS-057)
ALTER TABLE pos_movement_lines
  ADD COLUMN IF NOT EXISTS input_unit     varchar(20),
  ADD COLUMN IF NOT EXISTS input_quantity numeric(20, 4);

-- 5. GSD metrikalari jadvali
CREATE TABLE IF NOT EXISTS pos_gsd_metrics (
  id                  serial         PRIMARY KEY,
  employee_id         integer        NOT NULL,
  date                date           NOT NULL,
  plan_completion_pct numeric(5, 2),
  delay_count         integer        NOT NULL DEFAULT 0,
  deviation_count     integer        NOT NULL DEFAULT 0,
  org_function_id     integer,
  warehouse_id        integer,
  notes               text,
  created_at          timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_gsd_metrics_date
  ON pos_gsd_metrics (date);

CREATE INDEX IF NOT EXISTS idx_pos_gsd_metrics_employee
  ON pos_gsd_metrics (employee_id);

COMMENT ON TABLE pos_gsd_metrics IS
  'EP-POS-029/056 — Kunlik ombor xodimlarining ish samaradorligi metrikalari (HR kartasiga push uchun)';
```

**DDL flaglari:**
- `FG_FROM_MES` enum qo'shish → `pos_movement_type_enum` o'zgaradi — `lib/db` schema sinxronizatsiya kerak
- `SCRAP_IN` deferred — egasi makulatura Excel fayli topshirgunga qadar
- 2-imzo akt ustunlari — EP-POS-050 to'liq implementatsiyasi keyingi bosqich

---

## 6. QABUL MEZONI

### Backend:
- [ ] `pnpm --filter @europrint/api tsc --noEmit` → 0 xato
- [ ] `GET /api/pos/movements` → 200 (mavjud endpoint buzilmagan)
- [ ] `POST /api/pos/pres-kirim` → 201, `movementNumber` qaytariladi
- [ ] `POST /api/pos/pres-kirim` DB-proof: `SELECT * FROM pos_movements WHERE movement_type = 'INTERNAL_ISSUE' ORDER BY id DESC LIMIT 1` — yangi qator ko'rinadi
- [ ] `POST /api/pos/pres-kirim` → `warehouse_stock` yangilangani: `SELECT quantity FROM warehouse_stock WHERE material_card_id = <id>` — oshgan
- [ ] `POST /api/pos/movements` SCRAP_IN → 501 response
- [ ] MES event: `eventEmitter.emit('mes.session.completed', {...})` → `pos_movements` da `FG_FROM_MES` harakat yaratiladi (DDL approved bo'lsa)
- [ ] Low stock job: past qoldiqda `pos.low_stock.detected` event chiqariladi (log'da ko'rinadi)
- [ ] GSD job: `PosGsdPushJob.pushDailyGsd()` manual trigger → log'da `written=N` ko'rinadi
      ⚠️ OWNER-GATED: formula parametrlari tasdiqlanmagan — metrikalar yoziladi, HR kartasiga TA'SIR QO'RSATMAYDI
      ⚠️ EGASI QIYMATI KERAK: delay_count=4soat (IXTIRO), deviation_count=5% (IXTIRO), "planned today" aniqlamasi
- [ ] Karantin fix: `quarantine-workflow.service.ts` ichida `'karantin'` so'zi YO'Q
- [ ] Telegram webhook: `POST /api/pos/mini-app/telegram-webhook` → 200 `{"ok":true}`
- [ ] `TelegramBotService.handleBotUpdate({ update_id:1, message:{ text:'/status', chat:{id:1}, from:{id:1} } })` → log'da bot status ko'rinadi
      ⚠️ DEFERRED (to'liq Mini-App keyingi paket): barcode skan / /request / /history / inline_keyboard / JWT initData
- [ ] `BE tsc 0`, barcha reviewer skriptlar PASS

### Frontend:
- [ ] `pnpm --filter erp-dashboard tsc --noEmit` → 0 xato
- [ ] `/pos-monitor/pres-kirim` sahifasi ochilib, forma ko'rinadi
- [ ] Pres forma submit → real API chaqiriladi, natija ko'rinadi
- [ ] `PosBarcodeScanner` — camera mode'da, eski brauzerda `BarcodeDetector` YO'Q bo'lganda: error message o'rniga ZXing uriniladi (import)
- [ ] `vite.config.ts` manifest name = `"EuroPrint ERP — Zavod Ombori"`
- [ ] PWA background sync `pos-movements-sync-queue` mavjud (build log'da ko'rinadi)

### Oltin zanjir regressiya:
- [ ] `POST /api/pos/movements` (EXTERNAL_IN, to'g'ri payload) → 201 (eski funksionallik buzilmagan)
- [ ] Karantin workflow: EXTERNAL_IN yaratilganda → `pos_movements.status = 'qc_pending'` bo'ladi (eski `'karantin'` enum xatosi yo'q)
- [ ] `GET /api/pos/movements` → 200, list qaytariladi

---

## 7. SELF-VERIFY

### Backend tekshirish:
```bash
# 1. TypeScript kompilatsiya
pnpm --filter @europrint/api tsc --noEmit

# 2. Reviewer skriptlar
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-array-safety.sh
bash scripts/reviewer-jwt-guard.sh

# 3. Backend ishga tushirish
pnpm --filter @europrint/api run dev:unsafe
# → :3030/api/health → 200

# 4. Pres-kirim endpoint (token bilan):
curl -X POST http://localhost:3030/api/pos/pres-kirim \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"materialCardId":1,"qty":10,"unit":"kg","presId":"PRES-01","operatorId":1}'
# → { "movementId": N, "movementNumber": "PRS-PRES-01-...", "barcodeData": "..." }

# 5. DB proof — pres kirim saqlangani:
psql -U europrint -d europrint -c \
  "SELECT id, movement_number, movement_type, status FROM pos_movements ORDER BY id DESC LIMIT 3;"

# 6. SCRAP_IN 501:
curl -X POST http://localhost:3030/api/pos/movements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"movementType":"SCRAP_IN","lines":[]}'
# → 501

# 7. Karantin fix DB proof:
# Eski xato: 'karantin' string DB da enum violation berardi
# Yangi: 'qc_pending' ishlatiladi
psql -U europrint -d europrint -c \
  "SELECT unnest(enum_range(NULL::pos_movement_status_enum));"
# 'karantin' yo'q, 'qc_pending' bor

# 8. Telegram webhook:
curl -X POST http://localhost:3030/api/pos/mini-app/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id":1,"message":{"text":"/status","chat":{"id":123},"from":{"id":456}}}'
# → {"ok":true}

# 9. Low stock event test (NestJS REPL yoki integration test):
# app.get(EventEmitter2).emit('pos.low_stock.detected', {...})
# → log'da [LowStock] event ko'rinadi

# 10. GSD job manual trigger (NestJS REPL):
# const gsd = app.get(PosGsdPushJob);
# await gsd.pushDailyGsd();
# → log'da "Yakunlandi: date=... written=N"
```

### Frontend tekshirish:
```bash
# 1. TypeScript kompilatsiya
pnpm --filter erp-dashboard tsc --noEmit

# 2. Build
pnpm --filter erp-dashboard build
# → dist/ yaratiladi, manifest.json da "EuroPrint ERP — Zavod Ombori" bo'ladi

# 3. Dev server
pnpm --filter erp-dashboard run dev
# → :20806 da ishlaydi

# 4. Sahifa tekshirish:
# http://localhost:20806/erp-dashboard/pos-monitor/pres-kirim
# → PresKirimPage ko'rinadi, 3 maydon bor

# 5. PWA manifest tekshirish:
# http://localhost:20806/erp-dashboard/manifest.webmanifest
# → "name": "EuroPrint ERP — Zavod Ombori"

# 6. ZXing dependency:
# pnpm --filter erp-dashboard list @zxing/browser
# (agar ruxsat berilgan bo'lsa)
```

### DB-proof qo'shimcha:
```sql
-- GSD metrikalari jadvali mavjudligini tekshirish (DDL approved + run qilinganidan keyin):
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'pos_gsd_metrics';

-- pos_movements photo_urls ustuni:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pos_movements' AND column_name = 'photo_urls';

-- FG_FROM_MES enum qiymati:
SELECT unnest(enum_range(NULL::pos_movement_type_enum)) AS val;
-- 'FG_FROM_MES' ko'rinishi kerak (DDL run qilinganidan keyin)
```

---

## 8. COMMIT

### Tartib:

**Commit 1 — Bug fix (karantin enum):**
```bash
git add apps/api/src/modules/pos/application/services/quarantine-workflow.service.ts
git add apps/api/src/modules/pos/application/services/pos-movement-status.constants.ts
git commit -m "fix(pos): karantin→qc_pending enum mismatch tuzatildi (P49)"
```

**Commit 2 — Backend yangi service'lar:**
```bash
git add apps/api/src/modules/pos/application/event-handlers/pos-mes-fg.listener.ts
git add apps/api/src/modules/pos/application/services/pres-kirim.service.ts
git add apps/api/src/modules/pos/application/services/pos-gsd.service.ts
git add apps/api/src/modules/pos/application/jobs/pos-gsd-push.job.ts
git add apps/api/src/modules/pos/presentation/pres-kirim.controller.ts
git commit -m "feat(pos): MES-FG listener + pres-kirim service + GSD push job (P49)"
```

**Commit 3 — Backend updates:**
```bash
git add apps/api/src/modules/pos/application/jobs/pos-low-stock.job.ts
git add apps/api/src/modules/pos/presentation/movements.controller.ts
git add apps/api/src/modules/pos/application/services/telegram-bot.service.ts
git add apps/api/src/modules/pos/presentation/mini-app.controller.ts
git add apps/api/src/modules/pos/pos.module.ts
git add apps/api/src/modules/pos/pos.module-imports.ts
git commit -m "feat(pos): low-stock event emission + SCRAP_IN 501 + Telegram webhook + module wiring (P49)"
```

**Commit 4 — Frontend:**
```bash
git add artifacts/erp-dashboard/src/pos-monitor/pages/PresKirimPage.tsx
git add artifacts/erp-dashboard/src/pos-monitor/components/PosBarcodeScanner.tsx
git add artifacts/erp-dashboard/vite.config.ts
git commit -m "feat(pos-monitor): PresKirimPage + ZXing fallback + PWA manifest fix (P49)"
```

**Commit 5 — DDL (GATED, faqat egasi approved bo'lsa):**
```bash
git add apps/api/src/database/migrations/p49-pos-mes-photo-gsd-scrap.sql
git commit -m "chore(pos): P49 DDL migration — GATED (photo_urls, GSD metrics, FG_FROM_MES)"
```

> ⚠️ **HECH QACHON** `git add -A` yoki `git add .` ishlatma. Har commit aniq fayl nomlari bilan.

---

## EGAGA FLAG — P49 doirasidan tashqari tuzatishlar kerak

Quyidagi muammolar P49 bajaruvchisi aniqlab, egasiga xabar berishi kerak (ular bajaruvchi tomonidan o'zgartirilmaydi):

1. **DUAL GL WRITE (HIGH RISK)** — `pos.events.ts` (P49 owned emas): `approved` eventda `pos_gl_postings` + `completed` eventda `entries` — ikki marta yozish. `pos.events.ts` fayli P49 owned file ro'yxatida yo'q. Egasi bu masalani P50 yoki alohida bug-fix paket sifatida hal qilishi kerak.

2. **`movement.dto.ts` yangilash** — `CreateMovementSchema` ga `photoUrls`, `inputUnit`, `inputQuantity` maydonlari qo'shilishi kerak. Bu P49 owned emas.

3. **`lib/db/src/schema/pos-schema-v2.ts`** — DDL approved bo'lgandan keyin Drizzle schema yangilanishi kerak: `FG_FROM_MES` enum, `photoUrls`, `pos_gsd_metrics` pgTable. Bu lib/db paketi egasinikida.

4. **2-imzo akt EP-POS-050** — `pos-pdf.types.ts` da `issuerName`/`receiverName` maydonlari, PDF rendering o'zgarishi kerak. Katta scope — alohida bosqich.

5. **`@zxing/browser` dependency** — DEPENDENCY_STANDARTLARI.md ga ko'ra egasi ruxsati kerak. ZXing fallback import dinamik sifatida yozilgan (`import("@zxing/browser")`), runtime'da yuklanadi. Egasi ruxsat bersa `pnpm add @zxing/browser` ishga tushiriladi.

6. **`pos-movement-status.constants.ts` to'liq sinxronizatsiya** — agar bu fayl `quarantine-workflow.service.ts` bilan birgalikda owned bo'lsa, VALID_TRANSITIONS o'zgarishi ham qo'llaniladi. Agar owned emas — egaga flag.

7. **⚠️ GSD FORMULA EGASI TASDIG'I** (CONFORMANCE FIX — OWNER-GATED):
   `PosGsdService` da 3 formula parametri TASDIQLANMAGAN (MASTER-SAVOL-JAVOB EP-POS-056):
   - `delay_count` chegarasi: 4 soat (ixtiro — haqiqiy qiymat egasidan kerak)
   - `deviation_count` chegarasi: 5% (ixtiro — haqiqiy qiymat egasidan kerak)
   - `plan_completion_pct` maxrajini ("planned today") qanday hisoblash (reja jadvali? kutilgan harakat soni?)
   **Egasi shu 3 parametrni tasdiqlagunga qadar GSD natijalar HR kartasiga ta'sir ko'rsatmasligi kerak.**
   Egasi javobi keyin: `pos-gsd.service.ts` dagi PLACEHOLDER formulalari haqiqiy qiymatlar bilan almashtiriladi.

8. **⚠️ TO'LIQ TELEGRAM MINI-APP (keyingi paket kerak)** (CONFORMANCE FIX — DEFERRED):
   Egasi "to'liq Telegram Mini App" degan (EP-POS-071 / VISION-1000 Q940), lekin P49 faqat
   /start, /status, /approve komandalari + webhook foundation qo'yadi. Quyidagilar keyingi paketda:
   - Barcode skan (Telegram WebApp `scanQrPopup`)
   - So'rov (`/request <material> <qty>`)
   - Tarix (`/history [n]`)
   - Inline keyboard callback_query handler (approve/reject tugmalar)
   - JWT WebApp authentication (initData tekshiruvi + ERP SSO token exchange)
   **Egasiga xabar:** P49 Mini-App foundation qo'yadi; to'liq scopeni alohida paket sifatida rejalashtiring.

---

## TAQIQLAR (eslatma)

- `throw new Error()` — TAQIQ (`Result<T>` ishlatiladi)
- `return null` / `return undefined` servis metodlarida — TAQIQ
- `class-validator` / `@IsString()` / `@IsNumber()` — TAQIQ (Zod ishlatiladi)
- Raw `db.*` to'g'ridan servisda — faqat izoh bilan `typedExecute<T>` orqali
- `git add -A` / `git add .` — TAQIQ
- JWT minting — TAQIQ
- Log/secret commit — TAQIQ
- `"V2"` / `"Strangler Fig"` terminologiyasi — TAQIQ
- Ishlayotgan funksiyani olib tashlash — TAQIQ (Q-46)
- DDL migration'ni egasi ruxsatisiz ishga tushirish — TAQIQ (Q-35)
