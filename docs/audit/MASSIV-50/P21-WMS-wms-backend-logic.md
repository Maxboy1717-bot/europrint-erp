# P21 — WMS / Ombor: WMS roll-card CRUD + numbering + tolerance + quarantine + outbound blocks + ROP cron

> **To'lqin:** Wave 2 · **Bog'liqlik:** P20 (WMS DDL sxemasi) bajarilgandan keyin boshlang.
> **Variant:** bajaruvchi direktiva (Q-47: ≥1000 qator, to'liq, noaniqlik yo'q).
> **Vizyon manba:** `docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md` + `docs/audit/decisions/10-warehouse.md`.

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI (EXECUTOR)** sifatida ishlaysan. Har sessiya boshida quyidagilarni o'qi:
`CLAUDE.md` → `docs/agent-constitution.md` → `FE_STANDARTLAR.md`.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **`@Body` Zod bilan validate**; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)**: faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)**: `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. **`git add <aniq-fayl>` faqat**; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Wave:** 2 · **dependsOn:** `["P20"]` — P20 (WMS DDL: `roll_cards`, `movement_sequences`, `warehouse_locations`) MERGE bo'lmaguncha bu paketga BOSHLAMAGIN.

---

## 1. IZOLYATSIYA MANIFESTI

Shu paket FAQAT quyidagi fayllarga tegishi mumkin. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga xabar qil:

```
apps/api/src/modules/wms/domain/repositories/i-wms-roll-card.repo.ts          [YANGI — yaratiladi]
apps/api/src/modules/wms/infrastructure/repositories/drizzle-wms-roll-card.repo.ts [YANGI — yaratiladi]
apps/api/src/modules/wms/application/wms-roll-card.service.ts                 [YANGI — yaratiladi]
apps/api/src/modules/wms/presentation/wms-roll-card.controller.ts             [YANGI — yaratiladi]
apps/api/src/modules/wms/application/movement-number.service.ts               [YANGI — yaratiladi]
apps/api/src/modules/pos/application/services/goods-receipt.service.ts        [O'ZGARTIRISH — tolerance gate + karantin]
apps/api/src/modules/wms/presentation/wms-catalog.controller.ts               [TUZATISH — getDashboard hardcoded zeros]
apps/api/src/modules/wms/presentation/wms-warehouses.controller.ts            [TUZATISH — getById O(N) in-memory scan]
apps/api/src/modules/wms/wms.module.ts                                        [O'ZGARTIRISH — yangi provider'lar ro'yxatga olish]
apps/api/src/modules/wms/application/outbound-enforcement.service.ts          [YANGI — tech-card/gofra mismatch blocks]
apps/api/src/modules/wms/application/commands/goods-issue.handler.ts          [O'ZGARTIRISH — outbound enforcement chaqiruv]
apps/api/src/modules/wms/application/wms-counts.service.ts                    [O'ZGARTIRISH — blind-count rejim + GSD accuracy]
apps/api/src/modules/wms/infrastructure/repositories/wms-counts.repository.ts [O'ZGARTIRISH — blind-count + accuracy query]
apps/api/src/cron/wms-reorder.cron.ts                                         [YANGI — dynamic ROP cron]
artifacts/erp-dashboard/src/pages/WarehousesPage.tsx                          [O'ZGARTIRISH — real 7-ombor ko'rinishi]
artifacts/erp-dashboard/src/pages/warehouse/RollManagementPage.tsx            [O'ZGARTIRISH — /api/wms/rolls URL'ga ko'chirish]
```

**DDL GATED** (P20 paketidan keladi — bu paket migrationni ISHGA TUSHIRMAYDI):
- `roll_cards` jadvali — P20 tomonidan yaratilgan bo'lishi shart
- `movement_sequences` jadvali — P20 tomonidan yaratilgan bo'lishi shart
- `warehouse_locations` jadvali — P20 tomonidan yaratilgan bo'lishi shart
- `warehouse_stock.owner_type` ustuni — P20 tomonidan qo'shilgan bo'lishi shart

Agar P20 hali merge bo'lmagan bo'lsa yoki bu jadvallar mavjud bo'lmasa → `HttpStatus.NOT_IMPLEMENTED` qaytaruvchi stub yozing + `// BLOCKED_ON_P20` izohi qo'shing. Stub = soxta data EMAS, faqat 501.

---

## 2. VIZYON

Vizyon manba: `docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md` + `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md`.

### 2.1 Roll Card (Rulon Qog'oz Kartochkasi)

**EP-WMS-014, EP-WMS-032..039, EP-WMS-083, EP-WMS-125, EP-WMS-129**

Roll card — WMS ning eng muhim mikro-ob'ekti. Har rulon o'z kartochkasiga ega. Qabul qabulida avtomatik QR-yorliq chop etiladi. Ishlab chiqarish boshlashdan oldin operator IoT planshetda rulonni skanerlaydi.

**Qabul mezoni (acceptance):**
- `POST /api/wms/rolls` — yangi roll card yaratish → `roll_cards` jadvaliga REAL INSERT
- `GET /api/wms/rolls` — ro'yxat (filterlash: articleCode, warehouseId, status)
- `GET /api/wms/rolls/:id` — bitta roll card (to'liq maydonlar)
- `PATCH /api/wms/rolls/:id/weigh` — joriy og'irlik yangilash (chiqim/ishlatish paytida)
- `GET /api/wms/rolls/fifo?articleCode=X` — FIFO navbat (ochilgan → to'liq tartibida)
- `POST /api/wms/rolls/scan` — IoT skanerlash: roll_id + work_order_id → material mosligini tekshir → OK yoki BLOCK

**Roll card maydonlari (vizyon EP-WMS-032..036):**
```
unique_roll_id     — noyob ID (QR uchun: ROLL-YYYY-NNNNNN format)
warehouse_id       — qaysi omborda (FK warehouses)
material_id        — material kartochka (FK material_cards)
width_mm           — kenglik mm
diameter_mm        — diametr mm
gramaj_gsm         — gramaj g/m² (80-300 oralig'ida tekshiruv)
initial_weight_kg  — boshlang'ich og'irlik
current_weight_kg  — joriy qoldiq (chiqimda kamayadi)
estimated_length_m — taxminiy uzunlik (AUTO: weight/(gramaj×kenglik×0.001), faqat o'qish)
roll_type          — (kraft|test_liner|fluting|white|makulatura)
supplier_id        — yetkazib beruvchi (nullable FK)
certificate_no     — sertifikat raqami (nullable)
received_date      — kelgan sana
humidity_pct       — namlik % (nullable, 0-100)
storage_zone       — saqlash zonasi (nullable text)
status             — (full|opened|remnant) — FIFO uchun
is_fifo_locked     — bool, FIFO qulflash
```

### 2.2 Movement Numbering (Harakat Raqamlash)

**EP-WMS-002 / OMBOR-KASSIR-INTERVYU §13**

Format: `HOM-KIRIM-2026-00001`
- `HOM` = ombor kodi (warehouse.code dan)
- `KIRIM|CHIQIM|TRANSFER|COUNT` = harakat turi
- `2026` = yil
- `00001` = yil bo'yicha tartib raqam (5 xona, etakchi nollar bilan)

`movement_sequences` jadvali: `(warehouse_code, action_type, year)` → `last_seq` atomic `UPDATE ... RETURNING` orqali.

**Qabul mezoni:** `MovementNumberService.generate('HOM', 'KIRIM', 2026)` → `'HOM-KIRIM-2026-00001'` qaytaradi. Ikki parallel chaqiruv HECH QACHON bir xil raqam bermaydi (DB-level serialization).

### 2.3 Tolerance Gate va Karantin (Goods Receipt)

**EP-WMS-047 / EP-WMS-048 / EP-WMS-050**

`GoodsReceiptService.create()` hozir tolerance tekshiruvisiz. Vizyon:
1. Har tashqi qabul (external inbound) **majburiy KARANTIN** ga tushadi — istisno yo'q.
2. Og'irlik/miqdor farqi ±2% gacha → avtomatik qabul + karantin bayrog'i.
3. Farq >±2% → `needs_manager_approval = true` + `status = 'PENDING_APPROVAL'` → menejer tasdiqi kerak.
4. Shikast bayrog'i (`has_damage = true`) → `photo_required = true` qaytaradi (FE foto shart qiladi).

**Qabul mezoni:**
- `create()` endi `declared_qty`, `actual_qty`, `has_damage` qabul qiladi
- Tolerance hisob: `deviation_pct = Math.abs((actual - declared) / declared) * 100`
- Agar `deviation_pct > 2.0` → `needs_manager_approval: true`
- `status` har doim `'KARANTIN'` (`'draft'` emas) — tashqi qabul uchun
- Real INSERT `pos_goods_receipts` jadvaliga, `grnNumber` formati `GRN-YYYY-NNNNN` saqlanadi

### 2.4 getDashboard Tuzatish

**BROKEN/FAKE — `wms-catalog.controller.ts:99`**

```typescript
// HOZIR (XATO):
getDashboard() {
  return { totalItems: 0, lowStock: 0, pendingReceipts: 0, pendingTransfers: 0 };
}
```

Bu real DB ma'lumotini qaytarmaydi. Vizyon: `WmsCatalogService` ga `getDashboard()` metodi qo'shiladi va u `warehouse_stock`, `pos_goods_receipts`, `stock_transfers` jadvallaridan real COUNT so'rovlari bilan ma'lumot to'playdi.

**Qabul mezoni:** `GET /warehouse/dashboard` → `totalItems`, `lowStock`, `pendingReceipts`, `pendingTransfers` hammasi real DB COUNT dan keladi. Agar barcha jadvallar bo'sh bo'lsa — 0 to'g'ri, lekin DB ga borishi shart.

### 2.5 getById O(N) Skan Tuzatish

**BROKEN — `wms-warehouses.controller.ts:64-72`**

```typescript
// HOZIR (XATO — O(N) in-memory scan):
async getById(@Param('id') id: string) {
  const result = await this.queryBus.execute(new GetWarehousesQuery({}));
  // Barcha omborlarni olib kelib, xotirada qidiradi!
  const warehouse = items.find((w) => w.id === id);
}
```

To'g'ri yechim: `WmsCrudService` orqali `WHERE id = $1` SQL so'rovi bilan bitta ombor olish.

**Qabul mezoni:** `GET /wms/warehouses/5` → faqat id=5 bo'lgan ombor qaytadi. SQL `LIMIT 1 WHERE id = $id` ishlatiladi.

### 2.6 Outbound Enforcement (Tech-card + Gofra Mismatch Blocks)

**EP-WMS-084, EP-WMS-085**

`GoodsIssueHandler` hozir faqat `warehouse_stock` ni kamaytiradi. Vizyon:
- **Tech-card material match BLOCK (EP-WMS-084):** Chiqarilayotgan material kodi tech-card da talab qilingan material bilan mos kelishi shart. Mos kelmasa → `BLOCK_TECH_CARD_MISMATCH` xatosi, chiqim bekor.
- **Gofra layer mismatch BLOCK (EP-WMS-085):** Gofra karton uchun: tech-card 3-qavat talab qilsa, 5-qavatli material berib bo'lmaydi. Mos kelmasa → `BLOCK_GOFRA_LAYER_MISMATCH` xatosi.

`OutboundEnforcementService` yangi servis sifatida yaratiladi, `GoodsIssueHandler` uni chaqiradi.

**Qabul mezoni:**
- `POST /wms/goods-issue` bilan noto'g'ri material → 422 + `BLOCK_TECH_CARD_MISMATCH`
- `POST /wms/goods-issue` bilan noto'g'ri gofra qavat → 422 + `BLOCK_GOFRA_LAYER_MISMATCH`
- To'g'ri material → avvalgidek ishlaydi (regress yo'q)

### 2.7 Blind-Count Rejimi

**EP-WMS-059**

Hisoblash (`wms-inventory-counts`) da operator tizim balansini ko'rmaydi. `WmsCountsService.createInventoryCount()` da yangi `is_blind` maydon. Operator natijasini kiritganda `system_qty` yashiriladi, faqat `counted_qty` ko'rinadi.

**Qabul mezoni:** `POST /wms/counts` → `{ is_blind: true }` bilan yaratilsa, `GET /wms/counts/:id/lines` da `system_qty: null` qaytadi (operator ko'rmasligi uchun).

### 2.8 GSD Accuracy KPI

**EP-WMS-008**

Har hisoblash yopilganda accuracy hisob-kitobi: `accuracy_pct = (lines_within_tolerance / total_lines) * 100`. `wms_inventory_counts` jadvaliga `accuracy_pct NUMERIC(5,2)` ustuni (P20 DDL). Xodim karta KPI ga bog'lanish uchun `counted_by_employee_id` va `accuracy_pct` saqlanadi.

**Qabul mezoni:** Hisoblash yopilganda `UPDATE wms_inventory_counts SET accuracy_pct = X WHERE id = Y` — DB-proof bilan tasdiqlanadi.

### 2.9 Dynamic ROP Cron (Konfiguratsiyali AI-yordamchi min/max)

**EP-WMS-067, EP-WMS-012, EP-WMS-013, EP-WMS-064, EP-WMS-065, EP-WMS-066**

**⚠️ MUHIM TUZATISH (00-INTERVYU-MOSLIK §2 WMS CONTRADICTS):**
Avvalgi direktiva versiyasida tavsiya qilingan miqdor **hardcode `reorder_point * 2`** edi.
Bu egasining EP-WMS-067 qaroriga ZIDDIR:
> "Dinamik (oxirgi 3-6 oy sarfiga avto-qayta hisob)" — MASTER-SAVOL-JAVOB EP-WMS-067.
> VISION-1000 Q454: "Ochiq PR miqdori avtomatik yangilanmaydi — AI yangi min/max hisobni
> PR yoniga 'tavsiya yangilangan' belgisi bilan ko'rsatadi; **xarid bo'limi qarori bilan**
> PR o'zgartiriladi."

**To'g'ri yondashuv:**
- Tavsiya miqdori = oxirgi 3 oylik o'rtacha kunlik sarf × (lead_time_days + safety_buffer_days)
- `lead_time_days` va `safety_buffer_days` — `warehouse_stock` yoki `material_cards` jadvalidagi
  sozlanadigan ustunlar (egasi master-data deydi — kod konstantasi EMAS).
- Agar bu ustunlar mavjud bo'lmasa → FALLBACK: `reorder_point × 2` ishlatiladi,
  lekin **izohi bilan logglanadi** va egasiga "sozlama kerak" signali yuboriladi.

> ⚠️ **EGASI QIYMATI KERAK:**
> - `lead_time_days` qiymati har material/yetkazuvchi uchun qancha? (MM modulida)
> - `safety_buffer_days` standart qiymati qancha? (taxminan 7 kun, lekin egasi tasdig'i shart)
> - Oxirgi necha oy sarfi o'rtacha olinadi: 3 oy yoki 6 oy? (EP-WMS-067: "3-6 oy")
> Hozircha 90 kun (3 oy) ishlatiladi — **EGASI TASDIG'I KUTILMOQDA**.
> Tasdiqlanganda `warehouse_rop_config` jadval yoki `material_cards.lead_time_days` ustunga ko'chirish kerak.

`apps/api/src/cron/wms-reorder.cron.ts` — yangi CRON fayl (stock-alert.cron.ts ni ALMASHTIRMAYDI, parallel ishlaydi):
- Har kuni 07:00 da ishga tushadi
- `warehouse_stock` dan `reorder_point` va `quantity` ni taqqoslaydi
- Chegara ostidagi materiallar uchun: **dinamik tavsiya miqdor** hisoblanadi (oxirgi 90 kun sarf × lead_time orqali)
- `procurement_requests` ga DRAFT yozuv yaratadi (auto PR)
- Op-code: `EP-WMS-012` (auto PR draft), `EP-WMS-013` (daily report signal)

**Qabul mezoni:** Cron ishlagandan keyin: `SELECT * FROM procurement_requests WHERE triggered_by = 'WMS_ROP_CRON' ORDER BY created_at DESC LIMIT 5` — real yozuvlar ko'rinadi. `suggested_qty` ustunida statik `reorder_point * 2` EMAS, dinamik hisob ko'rinadi (yoki fallback belgisi bilan).

### 2.9-A owner_type Enforcement (FINISHED_GOODS faqat)

**⚠️ DOIRA CHEKLOVI (00-INTERVYU-MOSLIK §2 WMS CONTRADICTS — P20 dan ko'chirilgan):**
`warehouse_stock.owner_type` ustuni DB darajasida barcha qatorlarga qo'shilgan (ALTER TABLE),
lekin egasi kontekstida `CLIENT_{id}` tayinlash **FAQAT `FINISHED_GOODS` ombori uchun ma'noli**
(EP-WMS-019/020/123/133 + VISION-1000 Q141 lahtak/menejer konteksti).

`GoodsReceiptService`, `GoodsIssueHandler` va boshqa WMS servislarida:
- `owner_type` faqat `FINISHED_GOODS` ombor turida `CLIENT_{id}` qiymati bilan to'ldiriladi.
- Boshqa ombor turlarida `owner_type` = `'US'` default bo'lib qoladi.
- `CLIENT_{id}` tayinlash boshqa ombor turlariga **SERVIS QATLAMIDA BLOKLANADI**.

```typescript
// GoodsReceiptService yoki WmsRollCardService ichida — owner_type SET qilishdan oldin:
if (ownerType && ownerType !== 'US') {
  // owner_type='CLIENT_*' faqat FINISHED_GOODS ombori uchun ruxsat
  const whType = await this.getWarehouseType(warehouseId);
  if (whType !== 'FINISHED_GOODS') {
    // ⚠️ EGASI QIYMATI KERAK: Boshqa ombor turlarida CLIENT tayinlash kerakmi?
    // Hozircha bloklash. Egasi tasdig'i bilan kengaytirish mumkin.
    this.logger.warn(
      { code: 'EP-WMS-123-SCOPE', warehouseId, ownerType },
      'owner_type=CLIENT_* faqat FINISHED_GOODS ombori uchun. Boshqa turlar uchun egasi tasdig\'i kerak.'
    );
    ownerType = 'US'; // Fallback — bloklash o'rniga silent override
  }
}
```

### 2.9-B DEPARTMENT_* Omborlar va Lahtak (DEFER + Scoping)

**⚠️ TUSHIB QOLGAN (00-INTERVYU-MOSLIK §2 WMS MISSING — P20 dan ko'chirilgan):**

**DEPARTMENT_* ombor turlari (EP-WMS-002):**
Egasi POS Q29 da `DEPARTMENT_* (30+)` ombor turlarini sanagan. Bu omborlar
har bo'lim (org_function) uchun avto-yaratilishi kerak — **EP-ORG-041 org-kaskad** bilan
birgalikda amalga oshiriladi. P21 bu omborlar **mavjud** deb faraz qiladi va `type='DEPARTMENT'`
omborlarga generic operatsiyalarni bajaradi.

**Overflow mantig'i:** Asosiy ombor to'lganda DEPARTMENT ichki omboriga o'tkazish —
**EGASI SPETSIFIKATSIYASI KERAK** (hech qanday miqdor/trigger qoidasi o'ylab topilmadi).
Defer: ORG-kaskad paketi yoki alohida WMS-overflow paketi.

**Lahtak (offcut/qoldiq) tayinlash (EP-WMS-125, VISION-1000 Q141):**
Tayyor mahsulot omboridagi lahtak → aybdor menejer profiliga mas'uliyat belgisi.
- Lahtak `SCRAP_BRAK` omboriga yoki `FINISHED_GOODS` ichida alohida zona/flag sifatida saqlanadi.
- Menejer profili bog'lanishi (`org_functions.id` + audit) — **HR/ORG moduliga tegishli**.
- GL ma'nosi: Q141 — lahtak inventar aktiv bo'lib qoladi, menejer "balansiga" O'TMAYDI,
  faqat mas'uliyat belgisi. Lahtak sotilganda daromad kompaniyaga tushadi.

Hozircha P21 uchun: `FINISHED_GOODS` `rules.lahtak_tracking=true` (P20 seed) — bu yetarli.
To'liq lahtak workflow keyingi paketga qoldirildi.

### 2.10 FE Wiring

**WarehousesPage.tsx** — hozir `warehouseApi.types()` ni chaqiradi. Vizyon: 8 ta ombor turi ko'rsatilishi shart (ROLL_PAPER/FINISHED_GOODS/RAW_MATERIAL/HOUSEHOLD/EQUIPMENT/TOOLS/SCRAP_BRAK + DEPARTMENT generic). Agar types API bo'sh qaytsa — P20 DDL seed ni tekshir.

**RollManagementPage.tsx** — hozir `/api/agents/inventory/rolls` chaqiradi (agents stub xavfi bor). Vizyon: to'g'ridan `/api/wms/rolls` WMS moduliga ko'chirish.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (exists)

| Fayl | Satır | Holat |
|------|-------|-------|
| `apps/api/src/modules/wms/presentation/wms-catalog.controller.ts` | 99 | **XATO/FAKE** — `getDashboard()` hardcoded `{totalItems:0, ...}` qaytaradi |
| `apps/api/src/modules/wms/presentation/wms-warehouses.controller.ts` | 64-72 | **XATO** — `getById()` barcha omborlarni olib xotirada `Array.find()` qiladi (O(N) skan) |
| `apps/api/src/modules/pos/application/services/goods-receipt.service.ts` | 29-58 | Mavjud, lekin tolerance gate YO'Q — har qabul `status='draft'` |
| `apps/api/src/modules/wms/application/commands/goods-issue.handler.ts` | 30-60 | Mavjud, lekin tech-card/gofra check YO'Q — faqat stock decrement |
| `apps/api/src/modules/wms/application/wms-counts.service.ts` | 1-41 | Mavjud, lekin blind-count rejim YO'Q |
| `apps/api/src/modules/wms/infrastructure/repositories/wms-counts.repository.ts` | 1-60+ | Mavjud, lekin accuracy_pct hisob-kitobi YO'Q |
| `apps/api/src/cron/stock-alert.cron.ts` | 13 | Mavjud lekin **STUB** — hech narsa qilmaydi (`processed=0`, real so'rov yo'q) |
| `apps/api/src/cron/eoq-safety-stock-refresh.cron.ts` | 1-50+ | Mavjud, EOQ/safety-stock refresh qiladi — SAQLA, almashtirma |
| `artifacts/erp-dashboard/src/pages/warehouse/RollManagementPage.tsx` | 31,37,42 | **XATO URL** — `/api/agents/inventory/rolls` chaqiradi (agents stub) |
| `artifacts/erp-dashboard/src/pages/WarehousesPage.tsx` | 29 | Mavjud, `warehouseApi.types()` orqali ishlaydi |
| `apps/api/src/modules/wms/wms.module.ts` | 107-180 | Mavjud, ko'p provider — yangi provider'larni qo'shish kerak |

### 3.2 Yo'q (missing)

| Nima yo'q | Qaerda bo'lishi kerak |
|-----------|----------------------|
| `i-wms-roll-card.repo.ts` | domain/repositories/ — yangi fayl |
| `drizzle-wms-roll-card.repo.ts` | infrastructure/repositories/ — yangi fayl |
| `wms-roll-card.service.ts` | application/ — yangi fayl |
| `wms-roll-card.controller.ts` | presentation/ — yangi fayl |
| `movement-number.service.ts` | application/ — yangi fayl |
| `outbound-enforcement.service.ts` | application/ — yangi fayl |
| `wms-reorder.cron.ts` | apps/api/src/cron/ — yangi fayl |
| Movement numbering (HOM-KIRIM-2026-00001) | `movement_sequences` jadvali (P20 DDL) + `MovementNumberService` |
| Roll card jadvali (`roll_cards`) | P20 DDL — bu paket faqat foydalanadi |
| Tolerance gate (`±2%`) | `goods-receipt.service.ts` ga qo'shiladi |
| Karantin majburiyligi | `goods-receipt.service.ts` — `status` har doim `KARANTIN` |
| Tech-card match BLOCK | `outbound-enforcement.service.ts` + `goods-issue.handler.ts` |
| Gofra layer BLOCK | `outbound-enforcement.service.ts` + `goods-issue.handler.ts` |
| Blind-count rejim | `wms-counts.service.ts` + `wms-counts.repository.ts` |
| GSD accuracy KPI | `wms-counts.service.ts` — hisoblash yopilganda |
| Dynamic ROP cron | `apps/api/src/cron/wms-reorder.cron.ts` — yangi fayl |

### 3.3 Buzuq yoki Soxta (brokenOrFake)

| Fayl:Satır | Muammo |
|-----------|--------|
| `wms-catalog.controller.ts:99` | `return { totalItems: 0, ... }` — real DB ga bormaydi |
| `wms-warehouses.controller.ts:64-72` | `GetWarehousesQuery({})` barcha omborlarni olib, xotirada `.find()` — DB WHERE yo'q |
| `RollManagementPage.tsx:31` | `queryKey: ['/api/agents/inventory/rolls']` — agents module orqali, stub xavfi |
| `stock-alert.cron.ts:15-24` | `result.processed = 0` + hech narsa qilmaydi — STUB |
| `goods-receipt.service.ts` | `status` = GRN-NNNNN, karantin yo'q, tolerance yo'q |
| `goods-issue.handler.ts` | Material/gofra mismatch tekshirishi yo'q |

---

## 4. ISH (QADAM-BAQADAM)

### QADAM 0: P20 tekshiruvi (MANDATORY — oldin bu qadamni bajar)

```bash
# Docker ichida tekshir:
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "\dt roll_cards" 2>/dev/null
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "\dt movement_sequences" 2>/dev/null
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "\dt warehouse_locations" 2>/dev/null
```

Agar jadvallar **yo'q** bo'lsa → barcha yangi endpoint'larga `HttpStatus.NOT_IMPLEMENTED` + `// BLOCKED_ON_P20` yoz va TO'XTA. P20 merge bo'lgandan keyin davom et.

Agar jadvallar **mavjud** bo'lsa → davom et.

---

### QADAM 1: MovementNumberService yaratish

**Fayl:** `apps/api/src/modules/wms/application/movement-number.service.ts` (YANGI)

**Logika:** `movement_sequences` jadvalidan atomic `UPDATE ... RETURNING` orqali keyingi tartib raqamni oladi. Bir vaqtda 2 chaqiruv = 2 xil raqam (PostgreSQL serialization).

```typescript
// apps/api/src/modules/wms/application/movement-number.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

@Injectable()
export class MovementNumberService {
  private readonly logger = new Logger(MovementNumberService.name);

  /**
   * Yil bo'yicha atomic tartib raqam generatsiya.
   * Format: {warehouseCode}-{actionType}-{year}-{seq:5}
   * Misol: HOM-KIRIM-2026-00001
   *
   * @param warehouseCode — ombor kodi (warehouses.code dan, masalan 'HOM')
   * @param actionType    — 'KIRIM' | 'CHIQIM' | 'TRANSFER' | 'COUNT'
   * @param year          — to'liq yil (masalan 2026)
   */
  async generate(
    warehouseCode: string,
    actionType: 'KIRIM' | 'CHIQIM' | 'TRANSFER' | 'COUNT',
    year: number,
  ): Promise<Result<string>> {
    try {
      // Atomic: INSERT ON CONFLICT + UPDATE RETURNING — ikki parallel chaqiruv har xil raqam beradi
      type SeqRow = { next_seq: number };
      const rows = await typedExecute<SeqRow>(sql`
        INSERT INTO movement_sequences (warehouse_code, action_type, year, last_seq)
        VALUES (${warehouseCode}, ${actionType}, ${year}, 1)
        ON CONFLICT (warehouse_code, action_type, year)
        DO UPDATE SET last_seq = movement_sequences.last_seq + 1
        RETURNING last_seq AS next_seq
      `);
      const seq = rows[0]?.next_seq ?? 1;
      const formatted = String(seq).padStart(5, '0');
      const number = `${warehouseCode}-${actionType}-${year}-${formatted}`;
      this.logger.log({ code: 'EP-WMS-002', number }, 'Movement number generated');
      return Ok(number);
    } catch (e) {
      return Err({ code: 'WMS_NUMBER_GEN_FAILED', message: String(e) });
    }
  }
}
```

**Oldin/keyin:** Oldin bu servis YO'Q edi — `goods-receipt.service.ts` `GRN-YYYY-NNNNN` formatini o'zi yasardi, WMS standart format yo'q edi. Keyin: barcha WMS harakatlari `HOM-KIRIM-2026-00001` formatida raqamlanadi.

**DB-proof:** `SELECT * FROM movement_sequences ORDER BY created_at DESC LIMIT 3;` — 3 ta qo'ng'iroq = 3 ta qator yoki `last_seq=3` bo'lishi kerak.

---

### QADAM 2: Roll Card interfeysi va reposi yaratish

**Fayl:** `apps/api/src/modules/wms/domain/repositories/i-wms-roll-card.repo.ts` (YANGI)

```typescript
// apps/api/src/modules/wms/domain/repositories/i-wms-roll-card.repo.ts
import { Result } from '@common/result';

export interface RollCardRow {
  id: number;
  unique_roll_id: string;
  warehouse_id: number;
  material_id: number;
  width_mm: number | null;
  diameter_mm: number | null;
  gramaj_gsm: number | null;
  initial_weight_kg: number;
  current_weight_kg: number;
  estimated_length_m: number | null; // computed kolumn yoki null
  roll_type: 'kraft' | 'test_liner' | 'fluting' | 'white' | 'makulatura' | null;
  supplier_id: number | null;
  certificate_no: string | null;
  received_date: string;
  humidity_pct: number | null;
  storage_zone: string | null;
  status: 'full' | 'opened' | 'remnant';
  is_fifo_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRollCardDto {
  warehouseId: number;
  materialId: number;
  widthMm?: number;
  diameterMm?: number;
  gramajGsm?: number;
  initialWeightKg: number;
  rollType?: string;
  supplierId?: number;
  certificateNo?: string;
  receivedDate: string;
  humidityPct?: number;
  storageZone?: string;
}

export interface IWmsRollCardRepo {
  findAll(filter: {
    articleCode?: string;
    warehouseId?: number;
    status?: string;
    limit?: number;
  }): Promise<Result<RollCardRow[]>>;
  findById(id: number): Promise<Result<RollCardRow>>;
  findFifo(articleCode: string): Promise<Result<RollCardRow[]>>;
  create(dto: CreateRollCardDto): Promise<Result<RollCardRow>>;
  updateWeight(id: number, newWeightKg: number): Promise<Result<RollCardRow>>;
  validateForIssue(uniqueRollId: string, workOrderId: number): Promise<Result<{
    allowed: boolean;
    blockReason: string | null;
  }>>;
}

export const WMS_ROLL_CARD_REPO = 'WMS_ROLL_CARD_REPO';
```

**Fayl:** `apps/api/src/modules/wms/infrastructure/repositories/drizzle-wms-roll-card.repo.ts` (YANGI)

```typescript
// apps/api/src/modules/wms/infrastructure/repositories/drizzle-wms-roll-card.repo.ts
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import type { IWmsRollCardRepo, RollCardRow, CreateRollCardDto } from '../../domain/repositories/i-wms-roll-card.repo';

@Injectable()
export class DrizzleWmsRollCardRepo implements IWmsRollCardRepo {

  async findAll(filter: {
    articleCode?: string;
    warehouseId?: number;
    status?: string;
    limit?: number;
  }): Promise<Result<RollCardRow[]>> {
    try {
      const lim = filter.limit ?? 50;
      // NOTE: raw SQL — Drizzle ORM roll_cards jadvali uchun sxema P20 dan keladi
      const rows = await typedExecute<RollCardRow>(sql`
        SELECT rc.*, mc.code AS article_code
        FROM roll_cards rc
        LEFT JOIN material_cards mc ON mc.id = rc.material_id
        WHERE rc.deleted_at IS NULL
          ${filter.warehouseId ? sql`AND rc.warehouse_id = ${filter.warehouseId}` : sql``}
          ${filter.status ? sql`AND rc.status = ${filter.status}` : sql``}
          ${filter.articleCode ? sql`AND mc.code = ${filter.articleCode}` : sql``}
        ORDER BY
          CASE rc.status WHEN 'opened' THEN 1 WHEN 'full' THEN 2 ELSE 3 END,
          rc.received_date ASC
        LIMIT ${lim}
      `);
      return Ok(rows);
    } catch (e) {
      return Err({ code: 'WMS_ROLL_FIND_FAILED', message: String(e) });
    }
  }

  async findById(id: number): Promise<Result<RollCardRow>> {
    try {
      const rows = await typedExecute<RollCardRow>(sql`
        SELECT * FROM roll_cards WHERE id = ${id} AND deleted_at IS NULL LIMIT 1
      `);
      if (!rows[0]) return Err({ code: 'WMS_ROLL_NOT_FOUND', message: `Roll ${id} topilmadi` });
      return Ok(rows[0]);
    } catch (e) {
      return Err({ code: 'WMS_ROLL_FIND_FAILED', message: String(e) });
    }
  }

  async findFifo(articleCode: string): Promise<Result<RollCardRow[]>> {
    try {
      const rows = await typedExecute<RollCardRow>(sql`
        SELECT rc.*
        FROM roll_cards rc
        JOIN material_cards mc ON mc.id = rc.material_id
        WHERE mc.code = ${articleCode}
          AND rc.status IN ('opened', 'full')
          AND rc.deleted_at IS NULL
        ORDER BY
          CASE rc.status WHEN 'opened' THEN 1 ELSE 2 END,
          rc.received_date ASC
      `);
      return Ok(rows);
    } catch (e) {
      return Err({ code: 'WMS_ROLL_FIFO_FAILED', message: String(e) });
    }
  }

  async create(dto: CreateRollCardDto): Promise<Result<RollCardRow>> {
    try {
      // unique_roll_id formati: ROLL-YYYY-NNNNNN (sequence orqali)
      const year = new Date().getFullYear();
      type SeqRow = { seq: number };
      const seqRows = await typedExecute<SeqRow>(sql`
        SELECT nextval('roll_card_seq') AS seq
      `);
      const seq = String(seqRows[0]?.seq ?? 1).padStart(6, '0');
      const uniqueRollId = `ROLL-${year}-${seq}`;

      const rows = await typedExecute<RollCardRow>(sql`
        INSERT INTO roll_cards (
          unique_roll_id, warehouse_id, material_id,
          width_mm, diameter_mm, gramaj_gsm,
          initial_weight_kg, current_weight_kg,
          roll_type, supplier_id, certificate_no,
          received_date, humidity_pct, storage_zone,
          status, is_fifo_locked
        ) VALUES (
          ${uniqueRollId}, ${dto.warehouseId}, ${dto.materialId},
          ${dto.widthMm ?? null}, ${dto.diameterMm ?? null}, ${dto.gramajGsm ?? null},
          ${dto.initialWeightKg}, ${dto.initialWeightKg},
          ${dto.rollType ?? null}, ${dto.supplierId ?? null}, ${dto.certificateNo ?? null},
          ${dto.receivedDate}, ${dto.humidityPct ?? null}, ${dto.storageZone ?? null},
          'full', false
        )
        RETURNING *
      `);
      if (!rows[0]) return Err({ code: 'WMS_ROLL_CREATE_FAILED', message: 'INSERT qaytarmadi' });
      return Ok(rows[0]);
    } catch (e) {
      return Err({ code: 'WMS_ROLL_CREATE_FAILED', message: String(e) });
    }
  }

  async updateWeight(id: number, newWeightKg: number): Promise<Result<RollCardRow>> {
    try {
      const newStatus = newWeightKg <= 0 ? 'remnant' : 'opened';
      const rows = await typedExecute<RollCardRow>(sql`
        UPDATE roll_cards
        SET current_weight_kg = ${newWeightKg},
            status = ${newStatus},
            updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING *
      `);
      if (!rows[0]) return Err({ code: 'WMS_ROLL_NOT_FOUND', message: `Roll ${id} topilmadi` });
      return Ok(rows[0]);
    } catch (e) {
      return Err({ code: 'WMS_ROLL_UPDATE_FAILED', message: String(e) });
    }
  }

  async validateForIssue(uniqueRollId: string, workOrderId: number): Promise<Result<{
    allowed: boolean;
    blockReason: string | null;
  }>> {
    try {
      // Tech-card moslik tekshiruvi: work order → tech-card → required material → roll material taqqoslash
      type CheckRow = {
        roll_material_id: number;
        roll_gramaj: number | null;
        required_material_id: number | null;
        required_gramaj: number | null;
      };
      const rows = await typedExecute<CheckRow>(sql`
        SELECT
          rc.material_id AS roll_material_id,
          rc.gramaj_gsm  AS roll_gramaj,
          tcm.material_id AS required_material_id,
          tcm.gramaj_gsm  AS required_gramaj
        FROM roll_cards rc
        LEFT JOIN pp_orders po ON po.id = ${workOrderId}
        LEFT JOIN technology_cards tc ON tc.id = po.technology_card_id
        LEFT JOIN technology_card_materials tcm ON tcm.technology_card_id = tc.id
          AND tcm.material_id = rc.material_id
        WHERE rc.unique_roll_id = ${uniqueRollId}
          AND rc.deleted_at IS NULL
        LIMIT 1
      `);
      if (!rows[0]) {
        return Ok({ allowed: false, blockReason: 'Roll topilmadi yoki ishlab chiqarish orderiga ulanmagan' });
      }
      const r = rows[0];
      if (r.required_material_id !== null && r.roll_material_id !== r.required_material_id) {
        return Ok({ allowed: false, blockReason: 'EP-WMS-084: Tech-card material mos kelmadi' });
      }
      if (r.required_gramaj !== null && r.roll_gramaj !== null &&
          Math.abs(r.roll_gramaj - r.required_gramaj) > 5) { // ±5 g/m² tolerans
        return Ok({ allowed: false, blockReason: 'EP-WMS-085: Gramaj/qavat mos kelmadi' });
      }
      return Ok({ allowed: true, blockReason: null });
    } catch (e) {
      return Err({ code: 'WMS_ROLL_VALIDATE_FAILED', message: String(e) });
    }
  }
}
```

---

### QADAM 3: WmsRollCardService yaratish

**Fayl:** `apps/api/src/modules/wms/application/wms-roll-card.service.ts` (YANGI)

```typescript
// apps/api/src/modules/wms/application/wms-roll-card.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { Result, Ok, Err } from '@common/result';
import { WMS_ROLL_CARD_REPO, type IWmsRollCardRepo } from '../domain/repositories/i-wms-roll-card.repo';

// Zod sxemalari (class-validator TAQIQ)
export const CreateRollCardSchema = z.object({
  warehouseId:   z.number().int().positive(),
  materialId:    z.number().int().positive(),
  widthMm:       z.number().positive().max(5000).optional(),
  diameterMm:    z.number().positive().max(2000).optional(),
  gramajGsm:     z.number().min(60).max(500).optional(),  // g/m² 60-500 diapazoni
  initialWeightKg: z.number().positive().max(10000),
  rollType:      z.enum(['kraft','test_liner','fluting','white','makulatura']).optional(),
  supplierId:    z.number().int().positive().optional(),
  certificateNo: z.string().max(100).optional(),
  receivedDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  humidityPct:   z.number().min(0).max(100).optional(),
  storageZone:   z.string().max(50).optional(),
});

export const WeighRollSchema = z.object({
  newWeightKg: z.number().min(0).max(10000),
});

@Injectable()
export class WmsRollCardService {
  private readonly logger = new Logger(WmsRollCardService.name);

  constructor(
    @Inject(WMS_ROLL_CARD_REPO) private readonly repo: IWmsRollCardRepo,
  ) {}

  async list(filter: { articleCode?: string; warehouseId?: number; status?: string; limit?: number }) {
    return this.repo.findAll(filter);
  }

  async getById(id: number) {
    return this.repo.findById(id);
  }

  async getFifo(articleCode: string) {
    return this.repo.findFifo(articleCode);
  }

  async create(raw: unknown): Promise<Result<unknown>> {
    const parsed = CreateRollCardSchema.safeParse(raw);
    if (!parsed.success) {
      return Err({ code: 'WMS_ROLL_VALIDATION_FAILED', message: parsed.error.message });
    }
    const result = await this.repo.create(parsed.data);
    if (result.ok) {
      this.logger.log({ code: 'EP-WMS-032', rollId: (result.data as Record<string, unknown>).unique_roll_id }, 'Roll card yaratildi');
    }
    return result;
  }

  async updateWeight(id: number, raw: unknown): Promise<Result<unknown>> {
    const parsed = WeighRollSchema.safeParse(raw);
    if (!parsed.success) {
      return Err({ code: 'WMS_ROLL_VALIDATION_FAILED', message: parsed.error.message });
    }
    return this.repo.updateWeight(id, parsed.data.newWeightKg);
  }

  async validateScan(uniqueRollId: string, workOrderId: number) {
    const result = await this.repo.validateForIssue(uniqueRollId, workOrderId);
    if (result.ok) {
      this.logger.log({ code: 'EP-WMS-085', uniqueRollId, workOrderId, allowed: result.data.allowed }, 'IoT scan tekshiruv');
    }
    return result;
  }
}
```

---

### QADAM 4: WmsRollCardController yaratish

**Fayl:** `apps/api/src/modules/wms/presentation/wms-roll-card.controller.ts` (YANGI)

```typescript
// apps/api/src/modules/wms/presentation/wms-roll-card.controller.ts
import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Logger, HttpException, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { WmsRollCardService } from '../application/wms-roll-card.service';

const WH_ROLES = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'director', 'admin'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('WMS Roll Cards')
@ApiBearerAuth()
@Controller('wms/rolls')
export class WmsRollCardController {
  private readonly logger = new Logger(WmsRollCardController.name);

  constructor(private readonly svc: WmsRollCardService) {}

  @ApiOperation({ summary: 'Barcha rollar ro\'yxati (FIFO tartibida)' })
  @Get()
  @Roles(...WH_ROLES, 'mes_operator')
  async list(
    @Query('articleCode') articleCode?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.svc.list({
      articleCode,
      warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    if (!result.ok) throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    return { items: result.data, total: Array.isArray(result.data) ? result.data.length : 0 };
  }

  @ApiOperation({ summary: 'FIFO tartibida rollar (articleCode bo\'yicha)' })
  @Get('fifo')
  @Roles(...WH_ROLES, 'mes_operator')
  async fifo(@Query('articleCode') articleCode: string) {
    if (!articleCode) throw new HttpException('articleCode majburiy', HttpStatus.BAD_REQUEST);
    const result = await this.svc.getFifo(articleCode);
    if (!result.ok) throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    return result.data;
  }

  @ApiOperation({ summary: 'Roll kartochkasi (ID bo\'yicha)' })
  @Get(':id')
  @Roles(...WH_ROLES, 'mes_operator')
  async getById(@Param('id') id: string) {
    const result = await this.svc.getById(parseInt(id, 10));
    if (!result.ok) throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);
    return result.data;
  }

  @ApiOperation({ summary: 'Yangi roll qabul qilish' })
  @Post()
  @Roles(...WH_ROLES)
  async create(@Body() body: unknown) {
    const result = await this.svc.create(body);
    if (!result.ok) throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);
    return result.data;
  }

  @ApiOperation({ summary: 'Joriy og\'irlikni yangilash (chiqim/ishlatish)' })
  @Patch(':id/weigh')
  @Roles(...WH_ROLES, 'mes_operator')
  async weigh(@Param('id') id: string, @Body() body: unknown) {
    const result = await this.svc.updateWeight(parseInt(id, 10), body);
    if (!result.ok) throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);
    return result.data;
  }

  @ApiOperation({ summary: 'IoT skanerlash tekshiruvi — roll ishlab chiqarish buyrug\'iga mos kelishini tekshirish' })
  @Post('scan')
  @Roles(...WH_ROLES, 'mes_operator', 'iot_tablet')
  async scan(@Body() body: unknown) {
    const b = body as Record<string, unknown>;
    const rollId = String(b.rollId ?? '');
    const workOrderId = Number(b.workOrderId ?? 0);
    if (!rollId || !workOrderId) {
      throw new HttpException('rollId va workOrderId majburiy', HttpStatus.BAD_REQUEST);
    }
    const result = await this.svc.validateScan(rollId, workOrderId);
    if (!result.ok) throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    if (!result.data.allowed) {
      throw new HttpException(result.data.blockReason ?? 'BLOCK', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return { allowed: true };
  }
}
```

---

### QADAM 5: OutboundEnforcementService yaratish

**Fayl:** `apps/api/src/modules/wms/application/outbound-enforcement.service.ts` (YANGI)

```typescript
// apps/api/src/modules/wms/application/outbound-enforcement.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

export interface EnforcementResult {
  allowed: boolean;
  blockCode: 'BLOCK_TECH_CARD_MISMATCH' | 'BLOCK_GOFRA_LAYER_MISMATCH' | null;
  message: string | null;
}

@Injectable()
export class OutboundEnforcementService {
  private readonly logger = new Logger(OutboundEnforcementService.name);

  /**
   * EP-WMS-084: Tech-card material moslik tekshiruvi
   * EP-WMS-085: Gofra qavat moslik tekshiruvi
   *
   * Chiqarilayotgan material tech-card talabiga mos kelmasa — BLOCK.
   */
  async checkIssueAllowed(params: {
    materialId: number;
    warehouseId: number;
    amount: number;
    ppOrderId: number;
  }): Promise<Result<EnforcementResult>> {
    try {
      type CheckRow = {
        tech_card_material_id: number | null;
        tech_card_gofra_layers: number | null;
        material_gofra_layers: number | null;
        material_name: string;
        tech_card_material_name: string | null;
      };

      const rows = await typedExecute<CheckRow>(sql`
        SELECT
          tcm.material_id          AS tech_card_material_id,
          tc.gofra_layers          AS tech_card_gofra_layers,
          mc_issued.gofra_layers   AS material_gofra_layers,
          mc_issued.name           AS material_name,
          mc_tc.name               AS tech_card_material_name
        FROM pp_orders po
        LEFT JOIN technology_cards tc     ON tc.id = po.technology_card_id
        LEFT JOIN technology_card_materials tcm ON tcm.technology_card_id = tc.id
          AND tcm.position = 1  -- asosiy material
        LEFT JOIN material_cards mc_issued ON mc_issued.id = ${params.materialId}
        LEFT JOIN material_cards mc_tc    ON mc_tc.id = tcm.material_id
        WHERE po.id = ${params.ppOrderId}
        LIMIT 1
      `);

      // Agar PP order yoki tech-card bo'lmasa — ruxsat beriladi (strict mode keyin yoqiladi)
      if (!rows[0] || rows[0].tech_card_material_id === null) {
        return Ok({ allowed: true, blockCode: null, message: null });
      }

      const r = rows[0];

      // EP-WMS-084: Material moslik tekshiruvi
      if (r.tech_card_material_id !== params.materialId) {
        const msg = `EP-WMS-084: Tech-card "${r.tech_card_material_name}" talab qiladi, lekin "${r.material_name}" chiqarilmoqda`;
        this.logger.warn({ code: 'EP-WMS-084', ...params }, msg);
        return Ok({ allowed: false, blockCode: 'BLOCK_TECH_CARD_MISMATCH', message: msg });
      }

      // EP-WMS-085: Gofra qavat moslik tekshiruvi
      if (r.tech_card_gofra_layers !== null && r.material_gofra_layers !== null &&
          r.tech_card_gofra_layers !== r.material_gofra_layers) {
        const msg = `EP-WMS-085: Tech-card ${r.tech_card_gofra_layers}-qavat talab qiladi, material ${r.material_gofra_layers}-qavat`;
        this.logger.warn({ code: 'EP-WMS-085', ...params }, msg);
        return Ok({ allowed: false, blockCode: 'BLOCK_GOFRA_LAYER_MISMATCH', message: msg });
      }

      return Ok({ allowed: true, blockCode: null, message: null });
    } catch (e) {
      // Enforcement xatosi = chiqimni to'xtatmaydi (fail-open), lekin loglanadi
      this.logger.error({ code: 'EP-WMS-ENFORCE-ERR', error: String(e) }, 'Enforcement tekshiruvida xato');
      return Ok({ allowed: true, blockCode: null, message: null });
    }
  }
}
```

---

### QADAM 6: GoodsIssueHandler — enforcement chaqiruvini qo'shish

**Fayl:** `apps/api/src/modules/wms/application/commands/goods-issue.handler.ts` (O'ZGARTIRISH)

Mavjud fayl (`goods-issue.handler.ts`) ga `OutboundEnforcementService` ni inject qilib, `execute()` boshida tekshiruv qo'shing.

**Oldin (satr 30-44):**
```typescript
async execute(command: GoodsIssueCommand): Promise<Result<void>> {
  this.logger.log(
    { materialId: command.materialId, amount: command.amount },
    'Issuing goods from canonical warehouse_stock',
  );
  const outcome = await this.wmsRepo.issueFromWarehouseStock(
    command.materialId,
    command.warehouseId,
    command.amount,
  );
  if (!outcome.ok) {
    return Err(outcome.error);
  }
```

**Keyin:**
```typescript
async execute(command: GoodsIssueCommand): Promise<Result<void>> {
  this.logger.log(
    { materialId: command.materialId, amount: command.amount },
    'Issuing goods from canonical warehouse_stock',
  );

  // EP-WMS-084/085: Tech-card va gofra qavat tekshiruvi
  if (command.ppId) {
    const check = await this.enforcementSvc.checkIssueAllowed({
      materialId: command.materialId,
      warehouseId: command.warehouseId,
      amount: command.amount,
      ppOrderId: command.ppId,
    });
    if (!check.ok) return Err(check.error);
    if (!check.data.allowed) {
      return Err({ code: check.data.blockCode ?? 'BLOCK', message: check.data.message ?? 'Chiqim bloklandi' });
    }
  }

  const outcome = await this.wmsRepo.issueFromWarehouseStock(
    command.materialId,
    command.warehouseId,
    command.amount,
  );
  if (!outcome.ok) {
    return Err(outcome.error);
  }
```

Constructor'ga `OutboundEnforcementService` inject qiling:
```typescript
constructor(
  @Inject(WMS_REPO) private wmsRepo: IWmsRepository,
  private eventBus: EventBus,
  private enforcementSvc: OutboundEnforcementService,  // YANGI
) {}
```

---

### QADAM 7: GoodsReceiptService — tolerance gate va karantin

**Fayl:** `apps/api/src/modules/pos/application/services/goods-receipt.service.ts` (O'ZGARTIRISH)

`create()` metodini kengaytiring:

**create() ga yangi maydonlar qo'shing:**
```typescript
// Zod schema (fayl boshiga qo'shing)
import { z } from 'zod';

export const GoodsReceiptCreateSchema = z.object({
  supplierName:    z.string().min(1).max(200),
  supplierTin:     z.string().max(20).optional(),
  warehouseId:     z.number().int().positive(),
  waybillNumber:   z.string().max(100).optional(),
  contractNumber:  z.string().max(100).optional(),
  totalAmount:     z.number().nonnegative().optional(),
  currency:        z.string().max(10).optional(),
  notes:           z.string().max(1000).optional(),
  movementId:      z.number().int().optional(),
  purchaseOrderId: z.string().optional(),
  receivedBy:      z.number().int().positive(),
  // YANGI: tolerance tekshiruvi uchun
  declaredQty:     z.number().positive().optional(),
  actualQty:       z.number().positive().optional(),
  hasDamage:       z.boolean().optional(),
});
```

`create()` ichida tolerance logikasi (mavjud koddan keyin):
```typescript
// Tolerance gate: EP-WMS-047
let needsManagerApproval = false;
let toleranceNote = '';
if (dto.declaredQty && dto.actualQty) {
  const deviationPct = Math.abs((dto.actualQty - dto.declaredQty) / dto.declaredQty) * 100;
  if (deviationPct > 2.0) {
    needsManagerApproval = true;
    toleranceNote = `Farq ${deviationPct.toFixed(2)}% (±2% chegaradan oshdi)`;
    this.logger.warn({ code: 'EP-WMS-047', deviationPct }, 'Tolerance oshdi — menejer tasdiqi kerak');
  }
}

// EP-WMS-050: Tashqi qabul MAJBURIY karantin
// status = 'KARANTIN' (draft EMAS)
const result = await this.repo.insert({
  ...dto,
  grnNumber,
  status: 'KARANTIN',                    // DOIM karantin
  needsManagerApproval,
  toleranceNote: toleranceNote || null,
  photoRequired: dto.hasDamage === true,  // EP-WMS-105
});
```

**Oldin:** `status` hech qayerda o'rnatilmagan (repo defaulti `'draft'`)
**Keyin:** `status: 'KARANTIN'` har doim; `needsManagerApproval` tolerance >2% bo'lsa `true`

---

### QADAM 8: getDashboard tuzatish

**Fayl:** `apps/api/src/modules/wms/presentation/wms-catalog.controller.ts` (TUZATISH)

Hozir:
```typescript
// satr 98-100:
getDashboard() {
  return { totalItems: 0, lowStock: 0, pendingReceipts: 0, pendingTransfers: 0 };
}
```

Servisga delegatsiya qo'shing. Avval `WmsCatalogService` ga real metod qo'shing:

**`wms-catalog.service.ts`** ga (OWNED-FILE EMAS — bu P50 servisi bo'lishi mumkin. Lekin `wms-catalog.controller.ts` owned. Shuning uchun controller'da to'g'ridan DB so'rovi yozing, servisga delegate qilishni P50 ga qoldiring. Kontrollerda Qoida-6 buzilmasligi uchun — `WmsCatalogDashboardService` ga delegat qiling, uni owned fayl EMAS, lekin `WmsCatalogService` OWNED-FILE RO'YXATIDA YO'Q. Shuning uchun: to'g'ri yo'l — `WmsCatalogService.getDashboard()` metodini `wms-catalog.service.ts` ga qo'shing. Bu fayl OWNED EMAS — TO'XTA, P50 ga flag qil.)**

> **FLAG P50:** `WmsCatalogService.getDashboard()` metodi `wms-catalog.service.ts` ga kerak. Bu fayl P21 OWNED-FILE RO'YXATIDA YO'Q. P50 (route/sidebar wiring) bu metodini qo'shsin. P21 agenti faqat controller'dagi hardcoded return'ni `notImplemented()` → `this.catalogService.getDashboard()` ga o'zgartiradi VA `wms-catalog.service.ts` fayliga P50 direktiva orqali metod qo'shilishini belgilaydi.

Vaqtinchalik yechim (P50 kutmasdan):
```typescript
// satr 98-100 — OLDIN:
getDashboard() {
  return { totalItems: 0, lowStock: 0, pendingReceipts: 0, pendingTransfers: 0 };
}

// KEYIN (real DB query, controller ichida — Qoida 6 ga vaqtincha istisno, P50 servisga ko'chiradi):
@Get('dashboard')
@Roles(...WH_READ)
async getDashboard() {
  try {
    type DashRow = { total_items: string; low_stock: string; pending_receipts: string; pending_transfers: string };
    const rows = await typedExecute<DashRow>(sql`
      SELECT
        (SELECT COUNT(DISTINCT material_id) FROM warehouse_stock WHERE quantity > 0)::text AS total_items,
        (SELECT COUNT(*) FROM warehouse_stock ws JOIN material_cards mc ON mc.id = ws.material_id
          WHERE ws.quantity <= ws.reorder_point AND ws.reorder_point > 0)::text AS low_stock,
        (SELECT COUNT(*) FROM pos_goods_receipts WHERE status = 'KARANTIN')::text AS pending_receipts,
        (SELECT COUNT(*) FROM stock_transfers WHERE status = 'pending')::text AS pending_transfers
    `);
    const r = rows[0] ?? { total_items: '0', low_stock: '0', pending_receipts: '0', pending_transfers: '0' };
    return {
      totalItems:       parseInt(r.total_items, 10),
      lowStock:         parseInt(r.low_stock, 10),
      pendingReceipts:  parseInt(r.pending_receipts, 10),
      pendingTransfers: parseInt(r.pending_transfers, 10),
    };
  } catch (e) {
    this.logger.error('getDashboard SQL xato', String(e));
    throw new HttpException('Dashboard yuklanmadi', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

Bu yerda `import { sql } from 'drizzle-orm'` va `import { typedExecute } from '@shared/db/typed-execute'` va `import { HttpStatus, HttpException } from '@nestjs/common'` qo'shilishini unutma.

---

### QADAM 9: getById O(N) skan tuzatish

**Fayl:** `apps/api/src/modules/wms/presentation/wms-warehouses.controller.ts` (TUZATISH)

**Oldin (satr 64-72):**
```typescript
async getById(@Param('id') id: string) {
  this.logger.log('Getting warehouse by ID');
  const result = await this.queryBus.execute(new GetWarehousesQuery({}));
  assertOk(result);
  const items = Array.isArray(result.data?.items) ? result.data.items : [];
  const warehouse = (Array.isArray(items) ? items : []).find((w: Record<string, unknown>) => w.id === id);
  assertRequired(warehouse, 'Omborni topilmadi');
  return warehouse;
}
```

**Keyin (real DB WHERE):**
```typescript
async getById(@Param('id') id: string) {
  this.logger.log({ id }, 'Getting warehouse by ID');
  // NOTE: raw SQL — WmsCrudService yoki GetWarehousesQuery(id) pattern hozir mavjud emas
  // WmsCrudRepository orqali to'g'ri so'rov (O(1))
  const result = await this.crudSvc.findWarehouseById(parseInt(id, 10));
  if (!result || !result.ok) throw new NotFoundException('Ombor topilmadi');
  return result.data;
}
```

`WmsCrudService` da `findWarehouseById()` metodi qo'shilishi kerak (bu fayl OWNED EMAS — lekin `WmsCrudService` ni `wms-warehouses.controller.ts` allaqachon inject qiladi, faqat metod qo'shish kerak):

> **FLAG:** `WmsCrudService.findWarehouseById()` metodi `wms-crud.service.ts` ga kerak. Bu fayl OWNED EMAS. Yechim: to'g'ridan `rawSql` ishlatish controller'da:

```typescript
async getById(@Param('id') id: string) {
  this.logger.log({ id }, 'Getting warehouse by ID');
  try {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('id raqam bo\'lishi kerak');
    const r = await rawSql(sql`
      SELECT * FROM warehouses WHERE id = ${numId} AND deleted_at IS NULL LIMIT 1
    `);
    const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0];
    if (!row) throw new NotFoundException('Ombor topilmadi');
    return row;
  } catch (e) {
    if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
    throw new BadRequestException(`Xatolik: ${String(e).substring(0, 200)}`);
  }
}
```

`rawSql` va `sql` allaqachon import qilingan (`wms-warehouses.controller.ts:25-26`). Qo'shimcha import kerak emas.

---

### QADAM 10: WmsCountsService — blind-count rejimi va GSD accuracy

**Fayl:** `apps/api/src/modules/wms/application/wms-counts.service.ts` (O'ZGARTIRISH)

`createInventoryCount()` ga `isBlind` parametr qo'shing:
```typescript
async createInventoryCount(
  warehouseId: number,
  countedBy: number | null,
  notes: string | null,
  isBlind = false,  // YANGI: EP-WMS-059
): Promise<Result<object, AppError>> {
  return this.repo.createInventoryCount(warehouseId, countedBy, notes, isBlind);
}
```

`closeInventoryCount()` yangi metod (GSD accuracy hisob-kitobi):
```typescript
async closeInventoryCount(countId: number): Promise<Result<{ accuracyPct: number }, AppError>> {
  return this.repo.closeWithAccuracy(countId);
}
```

**Fayl:** `apps/api/src/modules/wms/infrastructure/repositories/wms-counts.repository.ts` (O'ZGARTIRISH)

`createInventoryCount()` ga `is_blind` qo'shing:
```typescript
async createInventoryCount(warehouseId: number, countedBy: number | null, notes: string | null, isBlind = false): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      INSERT INTO wms_inventory_counts (warehouse_id, counted_by, notes, status, count_date, is_blind)
      VALUES (${warehouseId}, ${countedBy ?? null}, ${notes ?? null}, 'in_progress', NOW(), ${isBlind})
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

`closeWithAccuracy()` yangi metod:
```typescript
async closeWithAccuracy(countId: number): Promise<Result<{ accuracyPct: number }>> {
  try {
    // Accuracy hisob-kitobi: tolerance ichidagi satrlar / jami satrlar
    type AccRow = { accuracy_pct: string };
    const rows = await exec(sql`
      WITH lines AS (
        SELECT
          ABS((counted_qty - system_qty) / NULLIF(system_qty, 0)) * 100 AS deviation_pct
        FROM wms_inventory_count_lines
        WHERE count_id = ${countId}
      )
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE deviation_pct <= 1.0) * 100.0 / NULLIF(COUNT(*), 0),
          2
        )::text AS accuracy_pct
      FROM lines
    `) as unknown as Promise<{ rows: AccRow[] }>;

    const pct = parseFloat(((await rows) as unknown as { rows: AccRow[] }).rows?.[0]?.accuracy_pct ?? '100');

    await exec(sql`
      UPDATE wms_inventory_counts
      SET status = 'completed', accuracy_pct = ${pct}, closed_at = NOW()
      WHERE id = ${countId}
    `);

    return Ok({ accuracyPct: pct });
  } catch (_e) {
    return Err(String(_e));
  }
}
```

> Eslatma: `wms_inventory_count_lines` va `wms_inventory_counts.is_blind`/`accuracy_pct`/`closed_at` ustunlari P20 DDL dan keladi. Agar yo'q bo'lsa → `// BLOCKED_ON_P20` izohi + 501.

---

### QADAM 11: WmsReorderCron yaratish

**Fayl:** `apps/api/src/cron/wms-reorder.cron.ts` (YANGI)

```typescript
// apps/api/src/cron/wms-reorder.cron.ts
/**
 * WMS ROP (Reorder Point) dinamik cron — EP-WMS-012/013/067
 * Har kuni 07:00 da ishga tushadi.
 * 1. warehouse_stock dan reorder_point belgisini tekshiradi
 * 2. Past stock → procurement_requests ga DRAFT yaratadi (EP-WMS-012: auto PR)
 * 3. Kunlik hisobot signali (EP-WMS-013)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

type LowStockRow = {
  material_id: number;
  warehouse_id: number;
  current_qty: number;
  reorder_point: number;
  material_name: string;
  warehouse_code: string;
};

@Injectable()
export class WmsReorderCron {
  private readonly logger = new Logger(WmsReorderCron.name);

  /** Har kuni 07:00 (Toshkent UTC+5: 02:00 UTC) */
  @Cron('0 7 * * *')
  async runDailyRopCheck(): Promise<void> {
    this.logger.log({ code: 'EP-WMS-013' }, 'WMS ROP kunlik tekshiruv boshlandi');
    try {
      // 1. Past stok materiallarni aniqlash
      const lowStockItems = await typedExecute<LowStockRow>(sql`
        SELECT
          ws.material_id,
          ws.warehouse_id,
          ws.quantity       AS current_qty,
          ws.reorder_point,
          mc.name           AS material_name,
          w.code            AS warehouse_code
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_id
        JOIN warehouses w      ON w.id  = ws.warehouse_id
        WHERE ws.reorder_point > 0
          AND ws.quantity <= ws.reorder_point
          AND ws.deleted_at IS NULL
        ORDER BY (ws.quantity::float / NULLIF(ws.reorder_point, 0)) ASC
        LIMIT 100
      `);

      this.logger.log({ code: 'EP-WMS-013', count: lowStockItems.length }, `${lowStockItems.length} ta past stok topildi`);

      let createdPrs = 0;
      for (const item of lowStockItems) {
        // 2. EP-WMS-012: Har past stok uchun DRAFT PR yaratish (agar allaqachon yo'q bo'lsa)
        type ExistingPr = { id: number };
        const existing = await typedExecute<ExistingPr>(sql`
          SELECT id FROM procurement_requests
          WHERE material_id = ${item.material_id}
            AND warehouse_id = ${item.warehouse_id}
            AND status = 'draft'
            AND triggered_by = 'WMS_ROP_CRON'
            AND created_at > NOW() - INTERVAL '3 days'
          LIMIT 1
        `);

        if (existing.length === 0) {
          // EP-WMS-067: Dinamik tavsiya miqdori — oxirgi 90 kun o'rtacha kunlik sarf × lead_time
          // ⚠️ EGASI QIYMATI KERAK: lead_time_days va safety_buffer_days master-data da bo'lishi kerak.
          // Hozircha material_cards.lead_time_days ustunidan o'qiladi (agar mavjud bo'lsa).
          // Yo'q bo'lsa: FALLBACK = reorder_point × 2 (statik) + ogohlantirish logi.
          type DynamicQtyRow = {
            avg_daily_consumption: string | null;
            lead_time_days: number | null;
          };
          const dynRows = await typedExecute<DynamicQtyRow>(sql`
            SELECT
              -- Oxirgi 90 kun kunlik o'rtacha sarf (EP-WMS-067: "3-6 oy" → 90 kun default)
              -- ⚠️ EGASI TASDIG'I KERAK: 90 kun mi yoki 180 kun? Hozircha 90 kun.
              ROUND(
                COALESCE(
                  (SELECT SUM(ABS(wt.quantity_change)) / 90.0
                   FROM warehouse_transactions wt
                   WHERE wt.material_id = ${item.material_id}
                     AND wt.transaction_type IN ('ISSUE', 'CONSUMPTION')
                     AND wt.created_at >= NOW() - INTERVAL '90 days'),
                  0
                ),
                3
              )::text AS avg_daily_consumption,
              -- material_cards.lead_time_days — EGASI QIYMATI KERAK (MM modulida sozlanadi)
              mc.lead_time_days
            FROM material_cards mc
            WHERE mc.id = ${item.material_id}
            LIMIT 1
          `);

          const avgDaily = parseFloat(dynRows[0]?.avg_daily_consumption ?? '0');
          // lead_time_days: material_cards dan (MM modulida sozlanadi); default = 14 kun
          // ⚠️ EGASI QIYMATI KERAK: 14 kun standart lead_time to'g'rimi?
          const leadTimeDays = dynRows[0]?.lead_time_days ?? 14;
          // safety_buffer_days: ⚠️ EGASI QIYMATI KERAK (hozircha 7 kun default)
          const safetyBufferDays = 7; // EGASI_QIYMATI_KERAK — master-data jadvalidan o'qish kerak

          let suggestedQty: number;
          let qtyMethod: string;

          if (avgDaily > 0) {
            // Dinamik hisob: kunlik sarf × (lead_time + safety_buffer)
            suggestedQty = Math.ceil(avgDaily * (leadTimeDays + safetyBufferDays));
            qtyMethod = `dinamik: ${avgDaily.toFixed(2)} kun/sarf × ${leadTimeDays + safetyBufferDays} kun`;
          } else {
            // Fallback: reorder_point × 2 (sarf tarixi yo'q yoki 0)
            suggestedQty = item.reorder_point * 2;
            qtyMethod = 'fallback: reorder_point × 2 (sarf tarixi topilmadi — EP-WMS-067 EGASI SOZLAMASI KERAK)';
            this.logger.warn(
              { code: 'EP-WMS-067-FALLBACK', materialId: item.material_id },
              `Material ${item.material_name} uchun sarf tarixi yo'q — statik fallback ishlatildi. `
              + 'lead_time_days va safety_buffer_days sozlamasini material_cards ga qo\'shing.'
            );
          }

          await typedExecute<{ id: number }>(sql`
            INSERT INTO procurement_requests (
              material_id, warehouse_id, requested_qty, status,
              triggered_by, notes, created_at
            ) VALUES (
              ${item.material_id}, ${item.warehouse_id}, ${suggestedQty}, 'draft',
              'WMS_ROP_CRON',
              ${`Avtomatik (${qtyMethod}): ${item.material_name} zaxirasi chegara ostiga tushdi (${item.current_qty} <= ${item.reorder_point})`},
              NOW()
            )
          `);
          createdPrs++;
          this.logger.log({ code: 'EP-WMS-012', materialId: item.material_id, suggestedQty, qtyMethod }, 'Auto PR draft yaratildi');
        }
      }

      this.logger.log({ code: 'EP-WMS-013', lowStock: lowStockItems.length, prsCreated: createdPrs }, 'WMS ROP tekshiruv yakunlandi');
    } catch (e) {
      this.logger.error({ code: 'EP-WMS-CRON-ERR', error: String(e) }, 'WMS ROP cron xatosi');
    }
  }
}
```

**Eslatma:** `procurement_requests` jadvali mavjudligini P20 bilan tekshir. Yo'q bo'lsa → INSERT qismi `// BLOCKED_ON_P20` belgisi bilan.

---

### QADAM 12: wms.module.ts — yangi provider'lar + CqrsModule + P08 event-handler'lar ro'yxatga olish

**Fayl:** `apps/api/src/modules/wms/wms.module.ts` (O'ZGARTIRISH)

> ⭐ **BOGLIQLIK — P21 P08 uchun ham ishlaydi:**
> `wms.module.ts` P21 ning OWNED fayli. P08 (golden-wms-fin-e2e) paketi
> `CommandBus` ni `QcPassedListener` da inject qiladi va `wms.module.ts` da
> `CqrsModule` import bo'lishini talab qiladi. Shuningdek P08 ning WMS
> event-handler'lari (`QcPassedListener`, `ReceiveFgHandler`) providers'da
> ro'yxatdan o'tishi kerak.
>
> **P21 bajaruvchisi quyidagilarni ham qo'shadi:**
> - `CqrsModule` ni imports massiviga (CommandBus mavjud bo'lishi uchun)
> - P08 owned WMS event-handler'larini providers'ga (ular allaqachon yozilgan bo'lsa)
>
> Bu P08 commit logi ko'rsatganidek `// DEPENDS_ON_P21` flagini hal qiladi.

Import qiling:
```typescript
import { CqrsModule } from '@nestjs/cqrs';
import { WmsRollCardController } from './presentation/wms-roll-card.controller';
import { WmsRollCardService } from './application/wms-roll-card.service';
import { DrizzleWmsRollCardRepo } from './infrastructure/repositories/drizzle-wms-roll-card.repo';
import { WMS_ROLL_CARD_REPO } from './domain/repositories/i-wms-roll-card.repo';
import { MovementNumberService } from './application/movement-number.service';
import { OutboundEnforcementService } from './application/outbound-enforcement.service';
// P08 event-handler'lari (agar mavjud bo'lsa — P08 merge bo'lgandan keyin):
import { QcPassedListener } from './infrastructure/event-handlers/qc-passed.listener';
import { ReceiveFgHandler } from './application/commands/receive-fg.handler';
```

`imports` massiviga `CqrsModule` qo'shing (allaqachon mavjud bo'lsa o'tkazib yuboring):
```typescript
imports: [
  CqrsModule,   // ← CommandBus, EventBus — P08 QcPassedListener uchun kerak
  // ... boshqa importlar
],
```

`controllers` massiviga qo'shing: `WmsRollCardController`

`providers` massiviga qo'shing:
```typescript
WmsRollCardService,
{ provide: WMS_ROLL_CARD_REPO, useClass: DrizzleWmsRollCardRepo },
MovementNumberService,
OutboundEnforcementService,
// P08 WMS event-handler'lari — P08 merge bo'lgandan keyin qo'shing:
// (Agar fayllar mavjud bo'lsa — keyin emas, hozir qo'shing)
QcPassedListener,
ReceiveFgHandler,
```

**Tekshiruv:**
```bash
grep -n "CqrsModule\|CommandBus\|QcPassedListener\|ReceiveFgHandler" \
  Uzbek-Language-Module/apps/api/src/modules/wms/wms.module.ts
# Har biri kamida bitta satrda ko'rinishi kerak
```

---

### QADAM 13: CronModule — WmsReorderCron ro'yxatga olish

`WmsReorderCron` ni `apps/api/src/cron/cron.module.ts` ga qo'shing:
```typescript
// cron.module.ts OWNED EMAS — bu faylga teginish uchun TO'XTA + egaga flag
```

> **FLAG:** `apps/api/src/cron/cron.module.ts` P21 OWNED-FILE EMAS. `WmsReorderCron` ni ro'yxatga olish uchun P50 (route/sidebar) yoki P03 (op-codes) agentidan so'rang. Yoki egasi ruxsati bilan P21 OWNED-FILE ro'yxatiga cron.module.ts qo'shing.

---

### QADAM 14: FE — RollManagementPage URL tuzatish

**Fayl:** `artifacts/erp-dashboard/src/pages/warehouse/RollManagementPage.tsx` (O'ZGARTIRISH)

**Oldin (satr 31, 37, 42):**
```typescript
queryKey: ['/api/agents/inventory/rolls'],
queryFn: () => apiRequest<RollBalance[]>('GET', '/api/agents/inventory/rolls'),
// ...
queryKey: ['/api/agents/inventory/rolls/fifo', filterArticle],
queryFn: () => apiRequest<FifoRoll[]>('GET', `/api/agents/inventory/rolls/fifo?...`),
// ...
mutationFn: (data: typeof scanForm) => apiRequest('POST', '/api/agents/inventory/rolls/scan', {...}),
```

**Keyin (to'g'ri WMS endpoint):**
```typescript
queryKey: ['/api/wms/rolls'],
queryFn: () => apiRequest<{ items: RollBalance[]; total: number }>('GET', '/api/wms/rolls'),
// ...
queryKey: ['/api/wms/rolls/fifo', filterArticle],
queryFn: () => apiRequest<FifoRoll[]>('GET', `/api/wms/rolls/fifo?articleCode=${encodeURIComponent(filterArticle)}`),
// ...
mutationFn: (data: typeof scanForm) => apiRequest('POST', '/api/wms/rolls/scan', {
  rollId: data.rollId,
  workOrderId: parseInt(data.warehouseId, 10) || 0,  // Agar workOrderId maydon qo'shilsa
  ...data,
  initialWeightKg: parseFloat(data.initialWeightKg),
}),
```

Natija formati o'zgardi (`items` ichida): `balance.data?.items ?? []` ishlatilsin.

---

### QADAM 15: FE — WarehousesPage tekshiruvi

**Fayl:** `artifacts/erp-dashboard/src/pages/WarehousesPage.tsx` (TEKSHIRUV)

`warehouseApi.types()` → `/api/wms/warehouse-types` yoki `/api/warehouse/types` — qaysi endpoint mavjudligini tekshir:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/wms/warehouse-types
```

Agar endpoint 200 qaytarsa va 7 tur kelsa — fayl o'zgarmaydi. Agar bo'sh yoki yo'q bo'lsa — P50 ga flag.

---

## 5. DDL (GATED — ISHGA TUSHIRMA)

Bu jadvallar P20 paketidan keladi. P21 ularni FAQAT FOYDALANADI, yaratmaydi.

Agar P20 ushbu jadvallarni yaratmagan bo'lsa, quyidagi DDL P20 direktiva fayliga ko'chiring va `-- APPROVED: <egasi> <sana>` izohidan keyin egasi ruxsatini oling:

```sql
-- migration: p20-wms-roll-cards.sql
-- APPROVED: <egasi nomi> <sana>
-- GATED: Bu migrationni P21 agenti ISHGA TUSHIRMAYDI — P20 paketiga tegishli

CREATE SEQUENCE IF NOT EXISTS roll_card_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS roll_cards (
  id                SERIAL PRIMARY KEY,
  unique_roll_id    VARCHAR(30) NOT NULL UNIQUE, -- ROLL-2026-000001
  warehouse_id      INTEGER NOT NULL REFERENCES warehouses(id),
  material_id       INTEGER NOT NULL REFERENCES material_cards(id),
  width_mm          NUMERIC(8,2),
  diameter_mm       NUMERIC(8,2),
  gramaj_gsm        NUMERIC(8,2) CHECK (gramaj_gsm BETWEEN 60 AND 500),
  initial_weight_kg NUMERIC(10,3) NOT NULL,
  current_weight_kg NUMERIC(10,3) NOT NULL,
  -- estimated_length_m = current_weight_kg / (gramaj_gsm * width_mm * 0.000001) — computed in app
  roll_type         VARCHAR(20) CHECK (roll_type IN ('kraft','test_liner','fluting','white','makulatura')),
  supplier_id       INTEGER REFERENCES suppliers(id),
  certificate_no    VARCHAR(100),
  received_date     DATE NOT NULL,
  humidity_pct      NUMERIC(5,2) CHECK (humidity_pct BETWEEN 0 AND 100),
  storage_zone      VARCHAR(50),
  status            VARCHAR(20) NOT NULL DEFAULT 'full'
                    CHECK (status IN ('full','opened','remnant')),
  is_fifo_locked    BOOLEAN NOT NULL DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roll_cards_warehouse ON roll_cards(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_roll_cards_material  ON roll_cards(material_id);
CREATE INDEX IF NOT EXISTS idx_roll_cards_status    ON roll_cards(status);

CREATE TABLE IF NOT EXISTS movement_sequences (
  warehouse_code VARCHAR(20) NOT NULL,
  action_type    VARCHAR(20) NOT NULL CHECK (action_type IN ('KIRIM','CHIQIM','TRANSFER','COUNT')),
  year           INTEGER NOT NULL,
  last_seq       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (warehouse_code, action_type, year)
);

-- warehouse_stock ga tolerance/karantin uchun ustunlar (ALTER TABLE)
-- APPROVED: <egasi> <sana>
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS owner_type VARCHAR(20) DEFAULT 'US';

-- wms_inventory_counts ga blind-count + accuracy
ALTER TABLE wms_inventory_counts ADD COLUMN IF NOT EXISTS is_blind BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE wms_inventory_counts ADD COLUMN IF NOT EXISTS accuracy_pct NUMERIC(5,2);
ALTER TABLE wms_inventory_counts ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- pos_goods_receipts ga tolerance maydonlari
ALTER TABLE pos_goods_receipts ADD COLUMN IF NOT EXISTS declared_qty NUMERIC(12,3);
ALTER TABLE pos_goods_receipts ADD COLUMN IF NOT EXISTS actual_qty NUMERIC(12,3);
ALTER TABLE pos_goods_receipts ADD COLUMN IF NOT EXISTS needs_manager_approval BOOLEAN DEFAULT false;
ALTER TABLE pos_goods_receipts ADD COLUMN IF NOT EXISTS tolerance_note TEXT;
ALTER TABLE pos_goods_receipts ADD COLUMN IF NOT EXISTS photo_required BOOLEAN DEFAULT false;
```

---

## 6. QABUL MEZONI

Har qadam uchun quyidagi checklisti to'ldir:

### Backend
- [ ] `GET /api/wms/rolls` — 200, `items` massiv (bo'sh bo'lsa ham)
- [ ] `POST /api/wms/rolls` — `{ warehouseId, materialId, initialWeightKg, receivedDate }` → 201, `unique_roll_id` = `ROLL-YYYY-NNNNNN` format
- [ ] `GET /api/wms/rolls/:id` — 200 yoki 404 (xotirada qidirmaydi, SQL WHERE)
- [ ] `GET /api/wms/rolls/fifo?articleCode=KRAFT-80` — FIFO tartibida (`opened` birinchi)
- [ ] `PATCH /api/wms/rolls/:id/weigh` — `{ newWeightKg: 45.5 }` → `warehouse_stock` da ozaydi (DB-proof)
- [ ] `POST /api/wms/rolls/scan` — noto'g'ri material → 422 + `EP-WMS-084/085` xato kodi
- [ ] `POST /api/pos/goods-receipt` (GoodsReceiptService) — `status = 'KARANTIN'`, tolerance >2% → `needs_manager_approval = true`
- [ ] `GET /warehouse/dashboard` — real raqamlar (DB ga boradi), endi `{0,0,0,0}` EMAS
- [ ] `GET /wms/warehouses/:id` — SQL `WHERE id = $1` (O(1)), barcha omborlarni olmaydi
- [ ] `POST /wms/goods-issue` — noto'g'ri material → 422 `BLOCK_TECH_CARD_MISMATCH`
- [ ] `POST /wms/goods-issue` — noto'g'ri gofra qavat → 422 `BLOCK_GOFRA_LAYER_MISMATCH`
- [ ] `POST /wms/goods-issue` — to'g'ri material → avvalgidek ishlaydi (regress yo'q)
- [ ] `POST /wms/counts` bilan `{ is_blind: true }` → `wms_inventory_counts.is_blind = true` DB da
- [ ] WmsReorderCron → `SELECT * FROM procurement_requests WHERE triggered_by = 'WMS_ROP_CRON'` — qator ko'rinadi
- [ ] `notes` ustunida "dinamik: X.XX kun/sarf × N kun" yoki "fallback: reorder_point × 2" matni bor (statik hardcode emas)
- [ ] `owner_type='CLIENT_*'` faqat `FINISHED_GOODS` ombori uchun servis qatlamida tekshiriladi (boshqa turlarda 'US' fallback)

### Frontend
- [ ] `RollManagementPage.tsx` — `/api/wms/rolls` endpoint chaqiradi (agents emas)
- [ ] Roll ro'yxat ko'rsatiladi (bo'sh bo'lsa "Hozircha rollar yo'q" matn)
- [ ] Yangi roll formi → saqlanadi → sahifa yangilanadi → ro'yxatda ko'rinadi (round-trip)
- [ ] `WarehousesPage.tsx` — 8 ombor turi ko'rsatiladi (agar P20 seed bo'lsa: 7 asosiy + DEPARTMENT generic)

### Sifat
- [ ] BE `tsc --noEmit` = 0 xato
- [ ] FE `tsc --noEmit` = 0 xato
- [ ] `bash scripts/reviewer-result-pattern.sh` — FAIL: 0
- [ ] `bash scripts/reviewer-array-safety.sh` — FAIL: 0
- [ ] `bash scripts/reviewer-jwt-guard.sh` — FAIL: 0
- [ ] Ishlayotgan `/wms/goods-issue` endpoint avvalgidek ishlaydi (regress yo'q — Q-39)
- [ ] Ishlayotgan `/warehouse/rolls` FE sahifasi (eski URL → 404 bo'lmasligi)

### DB-proof
```sql
-- Roll card yaratilgandan keyin:
SELECT unique_roll_id, status, initial_weight_kg FROM roll_cards ORDER BY id DESC LIMIT 3;

-- Karantin gate:
SELECT id, grn_number, status, needs_manager_approval, tolerance_note
FROM pos_goods_receipts ORDER BY id DESC LIMIT 3;

-- ROP cron:
SELECT id, material_id, status, triggered_by, created_at
FROM procurement_requests WHERE triggered_by = 'WMS_ROP_CRON' ORDER BY id DESC LIMIT 5;

-- Movement numbering:
SELECT * FROM movement_sequences ORDER BY year DESC, last_seq DESC LIMIT 5;

-- Dashboard real:
SELECT COUNT(DISTINCT material_id) FROM warehouse_stock WHERE quantity > 0;
```

---

## 7. SELF-VERIFY

```bash
# 1. P20 jadvallari mavjudligini tekshir (BIRINCHI)
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint \
  -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('roll_cards','movement_sequences','warehouse_locations');"

# 2. Backend typecheck
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -20

# 3. Frontend typecheck
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | tail -20

# 4. Roll CRUD round-trip
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"EuroPrint2024!"}' | jq -r .accessToken)

# 4a. Roll yaratish
curl -s -X POST http://localhost:3030/api/wms/rolls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warehouseId":1,"materialId":1,"initialWeightKg":850,"receivedDate":"2026-06-19"}' | jq .unique_roll_id

# 4b. Ro'yxat (yaratilganmi?)
curl -s http://localhost:3030/api/wms/rolls \
  -H "Authorization: Bearer $TOKEN" | jq '.items | length'

# 5. Dashboard real data
curl -s http://localhost:3030/api/warehouse/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq .

# 6. getById O(1) (SQL EXPLAIN ko'rish uchun)
curl -s http://localhost:3030/api/wms/warehouses/1 \
  -H "Authorization: Bearer $TOKEN" | jq .id

# 7. Goods receipt karantin
curl -s -X POST http://localhost:3030/api/pos/wms/goods-receipts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"supplierName":"Test","warehouseId":1,"receivedBy":1,"declaredQty":100,"actualQty":105}' | jq '{status,needs_manager_approval}'
# Natija: {status:"KARANTIN", needs_manager_approval:true} chunki 5% > 2%

# 8. Reviewer skriptlar
bash scripts/reviewer-result-pattern.sh 2>&1 | grep "FAIL:"
bash scripts/reviewer-array-safety.sh 2>&1 | grep "FAIL:"
bash scripts/reviewer-jwt-guard.sh 2>&1 | grep "FAIL:"

# 9. WmsReorderCron DB-proof
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint \
  -c "SELECT COUNT(*) FROM procurement_requests WHERE triggered_by = 'WMS_ROP_CRON';"
```

---

## 8. COMMIT

Har mantiqiy guruh uchun alohida commit:

```bash
# Commit 1: Roll card + movement numbering (yangi servis/repo/controller)
git add apps/api/src/modules/wms/domain/repositories/i-wms-roll-card.repo.ts
git add apps/api/src/modules/wms/infrastructure/repositories/drizzle-wms-roll-card.repo.ts
git add apps/api/src/modules/wms/application/wms-roll-card.service.ts
git add apps/api/src/modules/wms/presentation/wms-roll-card.controller.ts
git add apps/api/src/modules/wms/application/movement-number.service.ts
git add apps/api/src/modules/wms/wms.module.ts
git commit -m "feat(wms): P21 roll-card CRUD + movement numbering HOM-KIRIM-YYYY-NNNNN"

# Commit 2: Outbound enforcement (tech-card/gofra blocks)
git add apps/api/src/modules/wms/application/outbound-enforcement.service.ts
git add apps/api/src/modules/wms/application/commands/goods-issue.handler.ts
git commit -m "feat(wms): P21 outbound enforcement EP-WMS-084/085 tech-card+gofra blocks"

# Commit 3: Goods receipt tolerance gate + karantin
git add apps/api/src/modules/pos/application/services/goods-receipt.service.ts
git commit -m "fix(pos): P21 goods-receipt mandatory KARANTIN + ±2% tolerance gate EP-WMS-047/050"

# Commit 4: Dashboard tuzatish + getById O(1)
git add apps/api/src/modules/wms/presentation/wms-catalog.controller.ts
git add apps/api/src/modules/wms/presentation/wms-warehouses.controller.ts
git commit -m "fix(wms): P21 getDashboard real DB + getById O(1) SQL WHERE"

# Commit 5: Blind-count + GSD accuracy
git add apps/api/src/modules/wms/application/wms-counts.service.ts
git add apps/api/src/modules/wms/infrastructure/repositories/wms-counts.repository.ts
git commit -m "feat(wms): P21 blind-count mode EP-WMS-059 + GSD accuracy KPI EP-WMS-008"

# Commit 6: ROP cron
git add apps/api/src/cron/wms-reorder.cron.ts
git commit -m "feat(cron): P21 WMS dynamic ROP cron EP-WMS-012/013/067 auto-PR draft"

# Commit 7: FE URL tuzatish
git add artifacts/erp-dashboard/src/pages/warehouse/RollManagementPage.tsx
git add artifacts/erp-dashboard/src/pages/WarehousesPage.tsx
git commit -m "fix(fe): P21 RollManagementPage /api/agents → /api/wms/rolls wiring"
```

---

## HOLAT HISOBOTI SHABLONI (Q-38)

Har qadam bajarilgandan keyin egaga quyidagilarni ko'rsating:

```
## P21 Holat Hisoboti

**Bajarildi:**
- [x] Roll card CRUD (i-wms-roll-card.repo.ts, drizzle-wms-roll-card.repo.ts, wms-roll-card.service.ts, wms-roll-card.controller.ts)
- [x] MovementNumberService (HOM-KIRIM-2026-00001)
- [x] GoodsReceiptService tolerance gate (±2%) + mandatory KARANTIN
- [x] getDashboard real DB
- [x] getById O(1) SQL WHERE
- [x] OutboundEnforcementService + goods-issue.handler block
- [x] blind-count rejim + GSD accuracy
- [x] WmsReorderCron
- [x] FE URL tuzatish

**Defer (P50 ga):**
- [ ] WmsCatalogService.getDashboard() metod delegatsiyasi
- [ ] cron.module.ts da WmsReorderCron ro'yxatga olish
- [ ] WmsCrudService.findWarehouseById() metod

**Commits:** [hash1] [hash2] [hash3] ...

**DB-proof:**
- roll_cards: SELECT COUNT(*) = [N]
- procurement_requests triggered_by='WMS_ROP_CRON': [N]
- pos_goods_receipts status='KARANTIN': [N]

**Keyingi qadam:** P50 (route/sidebar) mergi
```

---

## OP-CODE RO'YXATI (EP-WMS-### loglar)

P03 paketiga (op-codes registry) quyidagi kodlarni qo'shish kerakligini flag qiling:

| Kod | Tavsif | Trigger |
|-----|--------|---------|
| EP-WMS-002 | Movement number generatsiya | MovementNumberService.generate() |
| EP-WMS-008 | GSD accuracy KPI hisob-kitobi | WmsCountsService.closeWithAccuracy() |
| EP-WMS-012 | Auto PR draft yaratildi | WmsReorderCron |
| EP-WMS-013 | Kunlik ROP tekshiruv | WmsReorderCron |
| EP-WMS-032 | Yangi roll card yaratildi | WmsRollCardService.create() |
| EP-WMS-047 | Tolerance chegaradan oshdi | GoodsReceiptService.create() |
| EP-WMS-050 | Tashqi qabul KARANTIN ga yuborildi | GoodsReceiptService.create() |
| EP-WMS-059 | Blind-count hisoblash boshlandi | WmsCountsService.createInventoryCount() |
| EP-WMS-084 | Tech-card material BLOCK | OutboundEnforcementService |
| EP-WMS-085 | Gofra qavat BLOCK | OutboundEnforcementService |

---

## MUHIM ESLATMALAR

1. **FIFO tartib:** Roll card `findAll()` va `findFifo()` da `status=opened` birinchi, `received_date ASC` — eski rulon avval chiqadi.
2. **estimated_length_m hisob-kitobi:** DB da saqlanmaydi, app'da hisoblanadi: `weight / (gramaj_gsm × width_mm × 0.000001)`. Qiymat `null` bo'lishi mumkin (gramaj yoki width yo'q bo'lsa).
3. **Tolerance >2% → menejer tasdiqi:** FE bu holat uchun modal yoki badge ko'rsatishi kerak. BE faqat `needs_manager_approval: true` bayrog'ini beradi.
4. **Gofra enforcement fail-open:** `checkIssueAllowed()` DB xatosi bo'lsa → ruxsat beradi (logger bilan). Bu production'ni bloklamamsligi uchun. Agar strict mode kerak bo'lsa — egasidan so'rang.
5. **RollManagementPage scan formi:** `workOrderId` maydoni hozir `warehouseId` dan foydalanmoqda (noto'g'ri). To'g'ri maydon qo'shilishi kerak — vaqtincha `0` yuboriladi va backend `null` sifatida qabul qiladi.
6. **stock-alert.cron.ts** — bu fayl STUB bo'lib qoladi (P21 OWNED EMAS). `wms-reorder.cron.ts` undan ALOHIDA ishlaydi — almashtirmaydi.
7. **Agents module `/api/agents/inventory/rolls`** — bu route P21 dan keyin ham mavjud bo'ladi. FE faqat `/api/wms/rolls` ishlatadi. Agents route backward compat uchun saqlanadi (Q-39/Q-46).
