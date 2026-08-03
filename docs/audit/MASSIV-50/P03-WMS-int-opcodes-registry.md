# P03 — WMS: Integration: op-code registry owner

---

## 0. ROL VA QOIDALAR

Sen **BAJARUVCHI** agentsan. Bu sessiyani boshlashdan oldin quyidagilarni o'qi:
- `CLAUDE.md` (loyiha qoidalari, arxitektura standartlari)
- `docs/agent-constitution.md` (agent metodologiyasi)
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` (to'liq qoidalar bloki, J-rail bo'limi)

**WAVE:** 1 (eng birinchi to'lqin — boshqa agentlar ushbu faylga bog'liq, shuning uchun bu paket birinchi yakunlanishi SHART)

**dependsOn:** [] (hech qanday oldingi paketga bog'liq emas — mustaqil ishga tushadi)

---

### QOIDALAR BLOKI (Q-47 — majburiy, har direktivaga kiritiladi)

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40** ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46** ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31):** faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35):** CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify:** BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

---

## 1. IZOLYATSIYA MANIFESTI

### Bu agent FAQAT quyidagi ikki faylga tegadi:

| # | Fayl | Holat |
|---|------|-------|
| 1 | `apps/api/src/common/op-codes.ts` | **YARATILADI** (hozir mavjud emas) |
| 2 | `docs/op-codes/REGISTRY.md` | **YARATILADI** (hozir mavjud emas) |

**FAQAT shu fayllarga teg; boshqasi kerak bo'lsa TO'XTA + flag.**

Bu paket **ddlGate: false** — migration, `CREATE TABLE`, `ALTER TABLE` TAQIQ. Faqat TypeScript konstantalar fayli va Markdown reestr hujjati yoziladi.

Boshqa agentlar (WMS, KAN, IOT, CC modullarini quradigan barcha 50-agentdan har biri) bu faylni faqat **IMPORT** qiladi — o'zgartirmaydi. Agar boshqa agent `op-codes.ts` ga yangi konstantalar qo'shishi kerak bo'lsa — bu P03 agenti bilan muvofiqlashtiriladi yoki P03 agentiga flag qilinadi.

---

## 2. VIZYON

### J-rail (op-code logging) — loyiha qoidasi

`docs/audit/LOYIHA-QOIDALARI-2026-06-08.md` §J bo'limi (satr 83-86):

```
J1. Har operatsiya = EP-<MODUL>-<###> kodi;
    kod logga tushadi (level=info code=EP-ORG-014 ...).
J2. Registry: docs/op-codes/REGISTRY.md
    + apps/api/src/common/op-codes.ts
    Raqamga qarab → modul + operatsiya + harakat turi.
J3. Modul kodlari: ORG·HR·FIN·COR·DIR·SD·PP·MES·QC·WMS·MM·LMS·CRM·MKT·KAN·IOT·AI·NTF·POS·CC
J4. T1 (ORG poydevor + SD/PP/MES/QC/WMS/FIN oltin-ip) eng chuqur
    T2 (DIR/COR/HR/LMS/CC/AI)
    T3 (CRM/MKT/KAN/IOT/NTF/POS)
```

Har WMS operatsiyasi `EP-WMS-###` kodi bilan loglanadi:

```
level=info code=EP-WMS-003 action=CREATE entity=warehouse_receipt userId=42 ...
```

### Bu paket scope'i

P03 faqat **4 modul prefix** uchun konstantalar va reestr yozuvlarini seed qiladi:

- **EP-WMS** — WMS / Ombor moduli (Wave 1 boshqa paketlar ishlatadi)
- **EP-KAN** — Kanban / Vazifalar moduli
- **EP-IOT** — IoT / Sensorlar moduli
- **EP-CC** — Communication Center moduli

Append-only prinsip: `OP_CODES` obyekti modul prefixiga qarab bo'limlar bilan tashkil etiladi. Har modul o'z bo'limiga faqat qo'shadi (o'zgartirmaydi, o'chirmaydi).

### Qabul mezoni (vizyon bo'yicha)

| Xususiyat | Qabul mezoni |
|-----------|-------------|
| WMS op-kodlar | EP-WMS-001..EP-WMS-134 (134 qaror, muhimlari) seed qilingan |
| KAN op-kodlar | EP-KAN-001..EP-KAN-137 boshlang'ich konstantalar |
| IOT op-kodlar | EP-IOT-001..EP-IOT-083 boshlang'ich konstantalar |
| CC op-kodlar | EP-CC-001..EP-CC-084 boshlang'ich konstantalar |
| TypeScript | `OP_CODES.WMS`, `OP_CODES.KAN`, `OP_CODES.IOT`, `OP_CODES.CC` eksport qilinadi |
| Registry | Har op-kod: kodi + tavsif + modul + action turi + holat |
| Append-only | Yangi modul paketlari faqat o'z prefix bo'limini qo'shadi |
| tsc 0 | `pnpm tsc --noEmit` da 0 xato |

---

## 3. HOZIRGI HOLAT

### Mavjud fayllar

```
apps/api/src/common/op-codes.ts   — YO'Q (hozir mavjud emas)
docs/op-codes/REGISTRY.md         — YO'Q (papka ham yo'q)
docs/op-codes/                    — PAPKA YO'Q
```

**Tasdiqlash qadami** (sessiya boshida bajar):

```bash
# 1. Fayl mavjudligini tekshir
ls apps/api/src/common/op-codes.ts 2>/dev/null && echo "MAVJUD" || echo "YOQ"
ls docs/op-codes/ 2>/dev/null && echo "PAPKA_MAVJUD" || echo "PAPKA_YOQ"

# 2. Mavjud common barrel
cat apps/api/src/common/index.ts
```

### Mavjud aloqali konstantalar

`apps/api/src/common/constants/erp-events.constants.ts` — domain event nomlari (bu OP_CODES dan FARQLI: eventlar CQRS/EventEmitter uchun, op-kodlar logging/audit uchun). Ikkalasi aloqa qilmaydi — alohida konstantalar.

`apps/api/src/common/constants/business.constants.ts` — biznes chegaralar (WMS toleranslar ham shu yerda bo'lishi mumkin, lekin op-kodlar — alohida fayl).

### Missing (yo'q)

- `apps/api/src/common/op-codes.ts` — **YARATILADI**
- `docs/op-codes/REGISTRY.md` — **YARATILADI** (papka ham)
- `apps/api/src/common/index.ts` barrel'ga op-codes eksport qo'shilishi kerak — **LEKIN bu owned file emas**, shuning uchun faqat izoh ko'rinishida flag qilinadi (§8 ga qarang)

### Brokenlar / soxta

Hech qanday soxta op-code fayllari topilmadi. `EP-WMS-###` kodlar hozircha faqat hujjatlarda (markdown decision maps) mavjud — kodda hech qanday logging chaqirigi yo'q. Bu paket ularni TypeScript konstantalarga aylantiradi.

---

## 4. ISH (qadam-baqadam)

### Qadam 1 — `docs/op-codes/` papkasini yarating

**Fayl:** `docs/op-codes/REGISTRY.md`

Papka mavjud emasligini tasdiqlab, REGISTRY.md ni yarating. Bu fayl — barcha 50 agent uchun yagona reestr. Har qator: `| KOD | TAVSIF | MODUL | ACTION | HOLAT |`.

**Before:** Fayl yo'q.

**After:** `docs/op-codes/REGISTRY.md` — WMS (134), KAN (137), IOT (83), CC (84) op-kodlar reestrida.

**Format:**

```markdown
# EuroPrint ERP — Op-code Registry

> Append-only. Har modul o'z bo'limiga faqat qo'shadi.
> action turlari: CREATE | READ | UPDATE | DELETE | APPROVE | REJECT | EVENT | CRON | AI | LOGIN | EXPORT

## EP-WMS — Ombor / WMS moduli

| Kod | Tavsif | Action | Holat |
|-----|--------|--------|-------|
| EP-WMS-001 | Kanonik zaxira: warehouse_stock dan o'qish | READ | ✅ |
...
```

**Zod/Drizzle:** Bu fayl TypeScript emas — Markdown hujjat. Zod/Drizzle shart emas.

**DB-proof:** `REGISTRY.md` ga yozish va qayta o'qish = fayl tizimi darajasida isbot.

---

### Qadam 2 — `apps/api/src/common/op-codes.ts` yarating

**Fayl:** `apps/api/src/common/op-codes.ts`

**Before:** Fayl yo'q.

**After:** `OP_CODES` obyekti eksport qilinadi, 4 modul bo'limi: `WMS`, `KAN`, `IOT`, `CC`. Append-only: har bo'lim `as const` bilan — TypeScript keyof/typeof orqali type-safe ishlatish mumkin.

**Pattern:**

```typescript
/**
 * @module op-codes
 * @description EuroPrint ERP operation code registry.
 * Append-only: each module packet adds its own prefix section.
 * Usage: logger.log({ level: 'info', code: OP_CODES.WMS.RECEIPT_CREATE, ... })
 *
 * J-rail rule (LOYIHA-QOIDALARI §J1-J2):
 *   Every operation logs its EP-<MODULE>-### code.
 *   Format: level=info code=EP-WMS-003 action=CREATE entity=... userId=...
 */

export const OP_CODES = {
  WMS: { ... } as const,
  KAN: { ... } as const,
  IOT: { ... } as const,
  CC:  { ... } as const,
} as const;

export type WmsOpCode  = typeof OP_CODES.WMS[keyof typeof OP_CODES.WMS];
export type KanOpCode  = typeof OP_CODES.KAN[keyof typeof OP_CODES.KAN];
export type IotOpCode  = typeof OP_CODES.IOT[keyof typeof OP_CODES.IOT];
export type CcOpCode   = typeof OP_CODES.CC[keyof typeof OP_CODES.CC];
export type AnyOpCode  = WmsOpCode | KanOpCode | IotOpCode | CcOpCode;
```

**WMS bo'limi** — to'liq kod ro'yxati (EP-WMS-001..EP-WMS-134, muhim qarorlar bo'yicha):

```typescript
WMS: {
  // --- I QISM: v1 (001..031) ---
  STOCK_READ:              'EP-WMS-001',  // Kanonik zaxira o'qish (warehouse_stock)
  WAREHOUSE_TYPE_CREATE:   'EP-WMS-002',  // Ombor turi yaratish (master-data)
  RECEIPT_CREATE:          'EP-WMS-003',  // Mol qabul (kirim) jarayoni boshlash
  PO_THREE_WAY_MATCH:      'EP-WMS-004',  // 3-tomonlama moslik (PO ↔ qabul ↔ schyot)
  TRANSFER_INTERNAL:       'EP-WMS-005',  // Ichki ko'chirish (omborlar orasi)
  TRANSFER_APPROVE:        'EP-WMS-006',  // Ko'chirishga ruxsat
  INVENTORY_COUNT_CREATE:  'EP-WMS-007',  // Inventarizatsiya jarayoni
  INVENTORY_ACCURACY_CALC: 'EP-WMS-008',  // Inventarizatsiya aniqlik % (GSD)
  INVENTORY_VARIANCE_APPROVE: 'EP-WMS-009', // Inventarizatsiya farqini tasdiqlash
  INVENTORY_GL_POST:       'EP-WMS-010',  // GL yozuvi (inventarizatsiya farqi)
  LOW_STOCK_SIGNAL:        'EP-WMS-011',  // Minimal qoldiq signali (event)
  AUTO_PR_DRAFT:           'EP-WMS-012',  // Avtomatik xarid so'rovi (ZVS/ZNO)
  DAILY_STOCK_REPORT:      'EP-WMS-013',  // Kunlik stok hisoboti (CRON)
  ROLL_CARD_CREATE:        'EP-WMS-014',  // Rulon kartochkasi yaratish
  SUPPLIER_RETURN:         'EP-WMS-015',  // Yetkazib beruvchiga qaytarish
  RECEIPT_QC_GATE:         'EP-WMS-016',  // QC darvozasi (karantin → o'tish/qaytarish)
  RECEIPT_KARANTIN:        'EP-WMS-017',  // Karantinga yuborish
  EXPIRY_TRACK:            'EP-WMS-018',  // Muddati kuzatish (FEFO)
  STORAGE_FEE_CALC:        'EP-WMS-019',  // Saqlash haqi hisoblash (manager profili)
  STORAGE_FEE_ASSIGN:      'EP-WMS-020',  // Saqlash haqi manager ga yuklatish
  LOCATOR_CREATE:          'EP-WMS-021',  // Ombor xaritasi / locator yaratish
  LABEL_PRINT:             'EP-WMS-022',  // Shtrix-kod / QR etiketi chop etish
  GSD_METRIC_RECORD:       'EP-WMS-023',  // GSD ko'rsatkich yozish (omborchi KPI)
  MOVEMENT_NUMBER_GEN:     'EP-WMS-024',  // Harakat raqami generatsiya
  BATCH_CREATE:            'EP-WMS-025',  // Partiya (batch) yaratish
  FG_RECEIPT_FROM_MES:     'EP-WMS-026',  // MES dan tayyor mahsulot qabuli
  ABC_CLASSIFY:            'EP-WMS-027',  // ABC klassifikatsiya (avtomatik)
  COST_FIFO_CALC:          'EP-WMS-028',  // FIFO narx hisoblash
  NEGATIVE_STOCK_BLOCK:    'EP-WMS-029',  // Manfiy qoldiq bloki
  AUDIT_LOG_WRITE:         'EP-WMS-030',  // To'liq audit log yozish
  TOLERANCE_CHECK:         'EP-WMS-031',  // Tolerans tekshirish (±2% / ±1%)

  // --- II QISM: v2 (032..134) ---
  ROLL_STATUS_UPDATE:      'EP-WMS-032',  // Rulon holati yangilash (To'liq/Ochilgan/Qoldiq)
  ROLL_WEIGHT_DEDUCT:      'EP-WMS-033',  // Rulon og'irligini kamaytirish
  ROLL_GRAMAJ_CHECK:       'EP-WMS-034',  // Gramaj tekshirish (sifat darvozasi)
  ROLL_QR_PRINT:           'EP-WMS-035',  // Rulon QR etiketi chop etish
  ROLL_FIFO_SELECT:        'EP-WMS-036',  // FIFO tartibida rulon tanlash
  ROLL_OVERFLOW_TRACK:     'EP-WMS-037',  // Ortiqcha chiqim kuzatish (overflow)
  ROLL_OFFCUT_RETURN:      'EP-WMS-038',  // Qoldiq/obrezka qaytarish (ikkilamchi)
  ROLL_DUAL_UNIT:          'EP-WMS-039',  // Ikkita o'lchov birligi (kg + dona)
  ZONE_FREEZE:             'EP-WMS-040',  // Zona muzlatish (inventarizatsiya paytida)
  SLOT_SUGGEST:            'EP-WMS-041',  // Bo'sh uyacha taklif (AI)
  MOVEMENT_DRAFT:          'EP-WMS-042',  // Harakat qoralamasi saqlash
  MOVEMENT_CONFIRM:        'EP-WMS-043',  // Harakat tasdiqlash
  ABC_RECLASS:             'EP-WMS-044',  // ABC qayta klassifikatsiya
  MATERIAL_CODE_CHECK:     'EP-WMS-045',  // Material kodi moslik tekshirish
  RECEIPT_FIELDS_VALIDATE: 'EP-WMS-046',  // Majburiy maydonlar tekshirish (kirim)
  WEIGHT_TOLERANCE_CHECK:  'EP-WMS-047',  // Og'irlik tolerans (±2%)
  RECEIPT_DAMAGE_PHOTO:    'EP-WMS-048',  // Shikast rasmi yuklash (majburiy)
  RECEIPT_BATCH_ASSIGN:    'EP-WMS-049',  // Partiya raqami berish (kirimda)
  RECEIPT_LOCATOR_ASSIGN:  'EP-WMS-050',  // Locator biriktirish (kirimda)
  RECEIPT_GL_POST:         'EP-WMS-051',  // GL yozuvi (kirim tasdiqlash)
  ISSUE_REASON_SET:        'EP-WMS-052',  // Chiqim sababi belgilash
  ISSUE_PP_LINK:           'EP-WMS-053',  // Chiqimni PP ish buyrug'iga bog'lash
  FEFO_SELECT:             'EP-WMS-054',  // FEFO tartibida tanlash (muddatli)
  FIFO_FEFO_ENFORCE:       'EP-WMS-055',  // FIFO/FEFO majburiy qo'llash
  NEGATIVE_STOCK_WARN:     'EP-WMS-056',  // Manfiy qoldiq ogohlantirish (sarflanadigan)
  ISSUE_DUAL_APPROVE:      'EP-WMS-057',  // Ikki imzo (katta chiqim)
  INVENTORY_BLIND_ENTRY:   'EP-WMS-058',  // Ko'r sanash (balans ko'rsatilmaydi)
  INVENTORY_BLIND_COMPARE: 'EP-WMS-059',  // Ko'r sanash solishtirish
  INVENTORY_VARIANCE_1PCT: 'EP-WMS-060',  // 1% dan katta farq → tasdiqlash
  INVENTORY_REASON_REQUIRE:'EP-WMS-061',  // Farq sababi majburiy
  INVENTORY_OFFHOURS_LOCK: 'EP-WMS-062',  // Ish vaqtidan tashqari blokirovka
  INVENTORY_GL_VARIANCE:   'EP-WMS-063',  // GL farq yozuvi
  REORDER_POINT_CALC:      'EP-WMS-064',  // Qayta buyurtma nuqtasi hisoblash
  REORDER_FORMULA_APPLY:   'EP-WMS-065',  // Formula: avg×lead_time + safety
  REORDER_MAX_SET:         'EP-WMS-066',  // Maksimal qoldiq belgilash
  MINMAX_AI_RECALC:        'EP-WMS-067',  // AI min/max qayta hisoblash (3-6 oy)
  SAFETY_STOCK_CALC:       'EP-WMS-068',  // Xavfsizlik zahirasi hisoblash
  EXPIRY_WARN_30D:         'EP-WMS-069',  // 30 kunlik muddati ogohlantirish
  EXPIRY_WARN_15D:         'EP-WMS-070',  // 15 kunlik ogohlantirish
  EXPIRY_WARN_7D:          'EP-WMS-071',  // 7 kunlik ogohlantirish
  EXPIRY_BLOCK:            'EP-WMS-072',  // Muddati o'tgan blok
  LOCATOR_STRUCTURED:      'EP-WMS-073',  // Zona→Qator→Javon→Yacheyka locator
  MOL_ASSIGN:              'EP-WMS-074',  // MOL (mas'ul shaxs) biriktirish
  MOL_SHORTAGE_LINK:       'EP-WMS-075',  // Kamomadni MOLga bog'lash
  WRITEOFF_ACT_CREATE:     'EP-WMS-076',  // Spisaniye akti yaratish
  FG_WAREHOUSE_SEPARATE:   'EP-WMS-077',  // Tayyor mahsulot ombori ajratish
  BATCH_TRACEABILITY_FWD:  'EP-WMS-078',  // Partiya kuzatuv (oldinga)
  FIFO_PRICING_ENFORCE:    'EP-WMS-079',  // FIFO narxlash (owner: FIFO ustun)
  STOCK_READ_REALTIME:     'EP-WMS-080',  // Real-time qoldiq o'qish
  DEAD_STOCK_DETECT:       'EP-WMS-081',  // O'lik zaxira aniqlash
  TURNOVER_DAYS_CALC:      'EP-WMS-082',  // Aylanish kunlari hisoblash
  OFFCUT_RETURN_INTERNAL:  'EP-WMS-083',  // Ichki qaytarish (INTERNAL_RETURN)
  TECH_CARD_MATCH_BLOCK:   'EP-WMS-084',  // Tex-karta moslik tekshirish → blok
  GOFRA_LAYER_MATCH_BLOCK: 'EP-WMS-085',  // Gofra qavat tekshirish → blok
  IOT_SCAN_BEFORE_ISSUE:   'EP-WMS-086',  // IoT skan chiqimdan oldin
  IOT_GRAMAJ_VALIDATE:     'EP-WMS-087',  // IoT gramaj validatsiya
  LOGISTICS_DELAY_LOG:     'EP-WMS-088',  // Logistika kechikish kodi
  WASTE_SPLIT:             'EP-WMS-089',  // Chiqindi / qoldiq ajratish
  BATCH_TRACEABILITY_BWD:  'EP-WMS-090',  // Partiya kuzatuv (orqaga)
  GRAMAJ_SAMPLE_CHECK:     'EP-WMS-091',  // Gramaj namuna tekshirish (kirimda)
  SHORTAGE_FORECAST:       'EP-WMS-092',  // Material tugash prognozi (CRON)
  RESERVATION_CREATE:      'EP-WMS-093',  // PP zaxira (reserve) yaratish
  RESERVATION_RELEASE:     'EP-WMS-094',  // Zaxirani bo'shatish
  FREE_STOCK_CALC:         'EP-WMS-095',  // Erkin qoldiq = jami − zaxira − tranzit
  SHIPPING_DOC_CREATE:     'EP-WMS-096',  // Jo'natish hujjati yaratish
  SHIPPING_DISPATCH:       'EP-WMS-097',  // Jo'natish (отгрузка) tasdiqlash
  DELIVERY_CONFIRM:        'EP-WMS-098',  // Yetkazib berish tasdiqlash
  DELIVERY_RETURN:         'EP-WMS-099',  // Qaytarish (jo'natmadan)
  STOCK_BALANCE_READ:      'EP-WMS-100',  // Qoldiq balans o'qish (FE uchun)
  DAVALCHESKIY_OWNER_TAG:  'EP-WMS-101',  // Davallcheskiy owner_type belgisi
  WRITEOFF_GL_LOSS:        'EP-WMS-102',  // Spisaniye GL zarar yozuvi
  WRITEOFF_APPROVE:        'EP-WMS-103',  // Spisaniye tasdiqlash (moliya + rahbar)
  AI_CAMERA_FLAG:          'EP-WMS-104',  // AI kamera: loglanmagan harakatni belgilash
  RECEIPT_DAMAGE_REQUIRE:  'EP-WMS-105',  // Shikast belgisi → rasm majburiy
  RECEIPT_WEIGHT_LOG:      'EP-WMS-106',  // Kirim og'irlik yozuvi
  DAILY_REPORT_CRON:       'EP-WMS-107',  // Kunlik hisobot CRON (CC orqali)
  SHORTAGE_SIGNAL_CRON:    'EP-WMS-108',  // Kamomad signali CRON
  GL_AUTO_POST:            'EP-WMS-109',  // GL avtomatik yozuv
  AVG_COST_OVERRIDE_BLOCK: 'EP-WMS-110',  // O'rtacha narx ustidanlash bloki (FIFO usun)
  MOL_PER_ZONE:            'EP-WMS-111',  // Zona bo'yicha MOL biriktirish
  ISSUE_THRESHOLD_CHECK:   'EP-WMS-112',  // Chiqim chegarasi tekshirish
  RECEIPT_SPEED_KPI:       'EP-WMS-113',  // Qabul tezligi KPI yozish
  STORAGE_ZONE_ASSIGN:     'EP-WMS-114',  // Saqlash zonasi biriktirish
  DEAD_STOCK_REPORT:       'EP-WMS-115',  // O'lik zaxira hisoboti
  STOCK_RESERVATION_VIEW:  'EP-WMS-116',  // Zaxira ko'rinishi (FE)
  ISSUE_MANAGER_SIGN:      'EP-WMS-117',  // Menejer imzosi (katta chiqim)
  WAREHOUSE_DEPT_LINK:     'EP-WMS-118',  // Ombor ↔ bo'lim org-bog'lanish
  LOGISTICS_KPI_RECORD:    'EP-WMS-119',  // Logistika KPI yozish (GSD)
  KARANTIN_RELEASE:        'EP-WMS-120',  // Karantindan chiqarish (QC ruxsati)
  KARANTIN_REWORK:         'EP-WMS-121',  // MES ga qaytarish (rework)
  KARANTIN_REJECT:         'EP-WMS-122',  // Qaytarish yetkazib beruvchiga (reject)
  CLIENT_STOCK_FILTER:     'EP-WMS-123',  // Mijoz materiali filtri (davallcheskiy)
  INVENTORY_CYCLE_PLAN:    'EP-WMS-124',  // Aylanma inventarizatsiya rejasi
  OFFCUT_SECONDARY_TAG:    'EP-WMS-125',  // Ikkilamchi material belgisi
  REMNANT_RESPONSIBLE:     'EP-WMS-126',  // Lahtak mas'ul shaxsga biriktirish
  LAHTAK_RESOLVE:          'EP-WMS-127',  // Lahtak hal qilish
  STORAGE_PDF_DAILY:       'EP-WMS-128',  // Saqlash haqi kunlik PDF
  CUTTING_LIST_STOCK:      'EP-WMS-129',  // Kesilgan list zaxirasi (dona)
  WASTE_MAKULATURA_REV:    'EP-WMS-130',  // Makulatura daromadi qayta hisoblash
  ABC_COUNT_FREQ:          'EP-WMS-131',  // ABC: sanash chastotasi (A=hafta/B=oy/C=yil)
  BLANK_TWO_SIG:           'EP-WMS-132',  // Ikki imzoli QR blank (PDF)
  FG_OUTBOUND_DOC:         'EP-WMS-133',  // Tayyor mahsulot jo'natish hujjati
  TRACEABILITY_REPORT:     'EP-WMS-134',  // To'liq kuzatuv hisoboti (partiya)
} as const,
```

**KAN bo'limi** — boshlang'ich konstantalar (EP-KAN-001..EP-KAN-137):

```typescript
KAN: {
  TASK_CREATE:             'EP-KAN-001',  // Vazifa yaratish (3-savat kirish)
  TASK_TYPES_DEFINE:       'EP-KAN-002',  // Savat tarkibini belgilash
  DEADLINE_24H_CHECK:      'EP-KAN-003',  // 24 soat qoidasi tekshirish
  DEADLINE_24H_TYPE:       'EP-KAN-004',  // 24 soat ish vaqti vs astronomik
  WAITING_STATUS_SET:      'EP-KAN-005',  // "Kutilmoqda" holati belgilash
  ARCHIVE_ON_EXIT:         'EP-KAN-006',  // Chiquvchidan keyin arxivlash
  DAILY_SCHEDULE_VIEW:     'EP-KAN-007',  // Kunlik soatlik ko'rinish
  ROLLOVER_APPLY:          'EP-KAN-008',  // Bajarilmagan vazifani ertangi kunga
  PRIORITY_SET:            'EP-KAN-009',  // Prioritet belgilash
  ASSIGNEE_SET:            'EP-KAN-010',  // Mas'ul tayinlash
  COMMENT_ADD:             'EP-KAN-011',  // Izoh qo'shish
  ATTACHMENT_ADD:          'EP-KAN-012',  // Fayl biriktirish
  STATUS_MOVE:             'EP-KAN-013',  // Holatni ko'chirish (drag)
  BOARD_CREATE:            'EP-KAN-014',  // Kanban taxtasi yaratish
  COLUMN_CREATE:           'EP-KAN-015',  // Ustun yaratish
  TASK_COMPLETE:           'EP-KAN-016',  // Vazifani yakunlash
  TASK_DELEGATE:           'EP-KAN-017',  // Vazifani topshirish
  TASK_ESCALATE:           'EP-KAN-018',  // Eskalatsiya
  TASK_OVERDUE_SIGNAL:     'EP-KAN-019',  // Muddati o'tgan signal (event)
  BOARD_FILTER_APPLY:      'EP-KAN-020',  // Taxtaga filtr qo'llash
  TASK_LINK_ORDER:         'EP-KAN-021',  // Vazifani buyurtmaga bog'lash
  TASK_LINK_MODULE:        'EP-KAN-022',  // Vazifani modulga bog'lash
  RECURRENCE_SET:          'EP-KAN-023',  // Takrorlanuvchi vazifa
  CHECKLIST_ADD:           'EP-KAN-024',  // Chek-list qo'shish
  CHECKLIST_ITEM_CHECK:    'EP-KAN-025',  // Chek-list bandini belgilash
  LABEL_ADD:               'EP-KAN-026',  // Yorliq qo'shish
  WATCHER_ADD:             'EP-KAN-027',  // Kuzatuvchi qo'shish
  DUE_DATE_SET:            'EP-KAN-028',  // Muddat belgilash
  TIME_LOG:                'EP-KAN-029',  // Vaqt hisobi yozish
  TASK_ARCHIVE:            'EP-KAN-030',  // Arxivlash
  TASK_DELETE:             'EP-KAN-031',  // O'chirish
  BOARD_MEMBER_ADD:        'EP-KAN-032',  // Taxtaga a'zo qo'shish
  SPRINT_CREATE:           'EP-KAN-033',  // Sprint yaratish
  SPRINT_START:            'EP-KAN-034',  // Sprint boshlash
  SPRINT_CLOSE:            'EP-KAN-035',  // Sprint yopish
  BACKLOG_GROOM:           'EP-KAN-036',  // Backlog tartibga solish
  VELOCITY_CALC:           'EP-KAN-037',  // Velocity hisoblash
  TASK_IMPORT:             'EP-KAN-038',  // Vazifalar import
  TASK_EXPORT:             'EP-KAN-039',  // Vazifalar export
  NOTIFICATION_SEND:       'EP-KAN-040',  // Bildirishnoma yuborish
  DAILY_STANDUP_LOG:       'EP-KAN-041',  // Kunlik standup yozish
  BLOCKER_SET:             'EP-KAN-042',  // Bloker belgilash
  BLOCKER_RESOLVE:         'EP-KAN-043',  // Bloker hal qilish
  CAPACITY_CHECK:          'EP-KAN-044',  // Yuklanish tekshirish
  BURNDOWN_CALC:           'EP-KAN-045',  // Burndown hisoblash
  EPIC_CREATE:             'EP-KAN-046',  // Epic yaratish
  STORY_CREATE:            'EP-KAN-047',  // Story yaratish
  TASK_SPLIT:              'EP-KAN-048',  // Vazifani bo'lish
  TASK_MERGE:              'EP-KAN-049',  // Vazifalarni birlashtirish
  DEPENDENCY_SET:          'EP-KAN-050',  // Bog'liqlik belgilash
  GANTT_VIEW:              'EP-KAN-051',  // Gantt ko'rinish
  CALENDAR_VIEW:           'EP-KAN-052',  // Kalendar ko'rinish
  TIMELINE_VIEW:           'EP-KAN-053',  // Vaqt chizig'i ko'rinishi
  BOARD_TEMPLATE_APPLY:    'EP-KAN-054',  // Shablon qo'llash
  BOARD_TEMPLATE_SAVE:     'EP-KAN-055',  // Shablon saqlash
  WIP_LIMIT_SET:           'EP-KAN-056',  // WIP chegarasi belgilash
  WIP_LIMIT_BREACH:        'EP-KAN-057',  // WIP chegarasi oshdi (signal)
  CUMULATIVE_FLOW_CALC:    'EP-KAN-058',  // Kumulyativ oqim hisoblash
  CYCLE_TIME_CALC:         'EP-KAN-059',  // Tsikl vaqti hisoblash
  LEAD_TIME_CALC:          'EP-KAN-060',  // Lead time hisoblash
  THROUGHPUT_CALC:         'EP-KAN-061',  // Throughput hisoblash
  BOARD_REPORT_GEN:        'EP-KAN-062',  // Taxta hisoboti
  TASK_COMMENT_MENTION:    'EP-KAN-063',  // Izohda mention
  TASK_REACTION_ADD:       'EP-KAN-064',  // Reaktsiya qo'shish
  ACTIVITY_LOG:            'EP-KAN-065',  // Faoliyat jurnali
  TASK_COPY:               'EP-KAN-066',  // Vazifani nusxalash
  TASK_MOVE_BOARD:         'EP-KAN-067',  // Boshqa taxtaga ko'chirish
  PERMISSION_SET:          'EP-KAN-068',  // Ruxsat belgilash
  ROLE_ASSIGN_BOARD:       'EP-KAN-069',  // Taxtada rol biriktirish
  GUEST_ACCESS:            'EP-KAN-070',  // Mehmon kirish
  BOARD_CLOSE:             'EP-KAN-071',  // Taxtani yopish
  BOARD_REOPEN:            'EP-KAN-072',  // Taxtani qayta ochish
  BOARD_ARCHIVE:           'EP-KAN-073',  // Taxtani arxivlash
  AUTOMATION_RULE_CREATE:  'EP-KAN-074',  // Avtomatlashtirish qoidasi yaratish
  AUTOMATION_TRIGGER:      'EP-KAN-075',  // Avtomatlashtirish ishga tushishi
  WEBHOOK_CREATE:          'EP-KAN-076',  // Webhook yaratish
  INTEGRATION_LINK:        'EP-KAN-077',  // Integratsiya bog'lash
  SEARCH_GLOBAL:           'EP-KAN-078',  // Global qidiruv
  FILTER_SAVE:             'EP-KAN-079',  // Filtr saqlash
  CUSTOM_FIELD_ADD:        'EP-KAN-080',  // Maxsus maydon qo'shish
  FORM_INTAKE_CREATE:      'EP-KAN-081',  // Kirish formasi yaratish
  ROADMAP_VIEW:            'EP-KAN-082',  // Yo'l xaritasi ko'rinishi
  GOAL_CREATE:             'EP-KAN-083',  // Maqsad yaratish
  GOAL_PROGRESS_UPDATE:    'EP-KAN-084',  // Maqsad progress yangilash
  OKR_LINK:                'EP-KAN-085',  // OKR bog'lash
  TASK_AI_SUGGEST:         'EP-KAN-086',  // AI vazifa taklifi
  TASK_AI_PRIORITY:        'EP-KAN-087',  // AI prioritet tavsiyasi
  TASK_AI_ASSIGN:          'EP-KAN-088',  // AI mas'ul tavsiyasi
  TASK_AI_DEADLINE:        'EP-KAN-089',  // AI muddat tavsiyasi
  TASK_AI_RISK:            'EP-KAN-090',  // AI xavf baholash
  COMMENT_AI_SUMMARY:      'EP-KAN-091',  // AI izoh xulosasi
  BOARD_AI_OPTIMIZE:       'EP-KAN-092',  // AI taxta optimallashtirish
  REPORT_AI_INSIGHT:       'EP-KAN-093',  // AI hisobot tahlili
  MOBILE_TASK_UPDATE:      'EP-KAN-094',  // Mobil vazifa yangilash
  OFFLINE_SYNC:            'EP-KAN-095',  // Oflayn sinxronizatsiya
  PUSH_NOTIFY_TASK:        'EP-KAN-096',  // Push bildirishnoma (vazifa)
  EMAIL_TASK_UPDATE:       'EP-KAN-097',  // Email orqali yangilash
  TASK_VOTE:               'EP-KAN-098',  // Ovoz berish
  TASK_APPROVAL_REQUEST:   'EP-KAN-099',  // Tasdiqlash so'rovi
  TASK_APPROVED:           'EP-KAN-100',  // Tasdiqlandi
  TASK_REJECTED:           'EP-KAN-101',  // Rad etildi
  TASK_REOPEN:             'EP-KAN-102',  // Qayta ochish
  TASK_TAG_ADD:            'EP-KAN-103',  // Teg qo'shish
  TASK_TAG_REMOVE:         'EP-KAN-104',  // Teg olib tashlash
  BULK_ACTION_APPLY:       'EP-KAN-105',  // Ommaviy amal
  COLUMN_LIMIT_SET:        'EP-KAN-106',  // Ustun chegarasi belgilash
  BOARD_STATS_VIEW:        'EP-KAN-107',  // Taxta statistika ko'rinishi
  TASK_HISTORY_VIEW:       'EP-KAN-108',  // Vazifa tarixi ko'rinishi
  TASK_RESTORE:            'EP-KAN-109',  // Arxivdan tiklash
  BOARD_DUPLICATE:         'EP-KAN-110',  // Taxtani nusxalash
  TASK_CONVERT_ISSUE:      'EP-KAN-111',  // Vazifani issuega aylantirish
  ISSUE_TRACK:             'EP-KAN-112',  // Muammoni kuzatish
  BUG_REPORT_CREATE:       'EP-KAN-113',  // Bug hisoboti yaratish
  RELEASE_CREATE:          'EP-KAN-114',  // Reliz yaratish
  RELEASE_NOTES_GEN:       'EP-KAN-115',  // Reliz eslatmalari
  MILESTONE_CREATE:        'EP-KAN-116',  // Milestone yaratish
  MILESTONE_COMPLETE:      'EP-KAN-117',  // Milestone yakunlash
  PORTFOLIO_VIEW:          'EP-KAN-118',  // Portfolio ko'rinishi
  CROSS_BOARD_REPORT:      'EP-KAN-119',  // Ko'p taxta hisoboti
  TEAM_WORKLOAD_VIEW:      'EP-KAN-120',  // Jamoa yuklanish ko'rinishi
  RESOURCE_PLAN:           'EP-KAN-121',  // Resurs rejasi
  TASK_REMINDER_SET:       'EP-KAN-122',  // Eslatma belgilash
  TASK_REMINDER_FIRE:      'EP-KAN-123',  // Eslatma ishga tushishi (event)
  BOARD_WIDGET_ADD:        'EP-KAN-124',  // Vidjet qo'shish
  DASHBOARD_KAN_VIEW:      'EP-KAN-125',  // Kanban dashboard ko'rinishi
  TASK_POINTS_SET:         'EP-KAN-126',  // Story point belgilash
  ESTIMATION_UPDATE:       'EP-KAN-127',  // Baholash yangilash
  ACTUAL_VS_ESTIMATE:      'EP-KAN-128',  // Haqiqiy vs taxmin tahlili
  TASK_TEMPLATE_SAVE:      'EP-KAN-129',  // Vazifa shabloni saqlash
  TASK_TEMPLATE_APPLY:     'EP-KAN-130',  // Vazifa shabloni qo'llash
  BOARD_PERMISSION_AUDIT:  'EP-KAN-131',  // Taxta ruxsatlari auditi
  TASK_COMPLIANCE_CHECK:   'EP-KAN-132',  // Muvofiqlik tekshirish
  TASK_SLA_TRACK:          'EP-KAN-133',  // SLA kuzatish
  TASK_SLA_BREACH:         'EP-KAN-134',  // SLA buzilishi (signal)
  TASK_COST_TRACK:         'EP-KAN-135',  // Xarajat kuzatish
  TASK_ROI_CALC:           'EP-KAN-136',  // ROI hisoblash
  BOARD_EXPORT_PDF:        'EP-KAN-137',  // Taxta PDF export
} as const,
```

**IOT bo'limi** — boshlang'ich konstantalar (EP-IOT-001..EP-IOT-083):

```typescript
IOT: {
  SENSOR_MACHINE_ASSIGN:   'EP-IOT-001',  // Sensor mashinaga biriktirish
  TELEMETRY_READ:          'EP-IOT-002',  // Telemetriya ma'lumoti o'qish
  ANOMALY_DETECT:          'EP-IOT-003',  // Anomaliya aniqlash (AI)
  ALERT_RAISE:             'EP-IOT-004',  // Ogohlantirish ko'tarish
  ALERT_RESOLVE:           'EP-IOT-005',  // Ogohlantirishni hal qilish
  MACHINE_STOP_EVENT:      'EP-IOT-006',  // Mashina to'xtash hodisasi
  MACHINE_START_EVENT:     'EP-IOT-007',  // Mashina ishga tushishi hodisasi
  DOWNTIME_LOG:            'EP-IOT-008',  // To'xtash vaqti yozuvi
  OEE_CALC:                'EP-IOT-009',  // OEE hisoblash
  ENERGY_READ:             'EP-IOT-010',  // Energiya sarfi o'qish
  ENERGY_THRESHOLD_WARN:   'EP-IOT-011',  // Energiya chegarasi ogohlantirish
  TEMPERATURE_READ:        'EP-IOT-012',  // Harorat o'qish
  HUMIDITY_READ:           'EP-IOT-013',  // Namlik o'qish
  PRESSURE_READ:           'EP-IOT-014',  // Bosim o'qish
  VIBRATION_READ:          'EP-IOT-015',  // Tebranish o'qish
  BARCODE_SCAN:            'EP-IOT-016',  // Shtrix-kod skanerlash
  QR_SCAN:                 'EP-IOT-017',  // QR kod skanerlash
  ROLL_SCAN_VALIDATE:      'EP-IOT-018',  // Rulon skan + validatsiya (ish boshida)
  SAFETY_CHECKLIST_SHOW:   'EP-IOT-019',  // Xavfsizlik chek-listini ko'rsatish
  SAFETY_CHECKLIST_CONFIRM:'EP-IOT-020',  // Xavfsizlik chek-listini tasdiqlash
  SOS_BUTTON_PRESS:        'EP-IOT-021',  // SOS tugma bosish (IOT_SOS_RAISED)
  SOS_RESOLVE:             'EP-IOT-022',  // SOS hal qilish
  TABLET_LOGIN:            'EP-IOT-023',  // Tablet ilovasiga kirish
  TABLET_WORK_START:       'EP-IOT-024',  // Ishni boshlash (tablet)
  TABLET_WORK_END:         'EP-IOT-025',  // Ishni yakunlash (tablet)
  SHIFT_START_LOG:         'EP-IOT-026',  // Smena boshlanishi yozuvi
  SHIFT_END_LOG:           'EP-IOT-027',  // Smena yakunlanishi yozuvi
  DEFECT_REPORT_IOT:       'EP-IOT-028',  // Nuqson hisobi (IoT tabletdan)
  MACHINE_REGISTRY_READ:   'EP-IOT-029',  // Mashina reestri o'qish
  MACHINE_STATUS_UPDATE:   'EP-IOT-030',  // Mashina holati yangilash
  CAPEX_SENSOR_PLAN:       'EP-IOT-031',  // CAPEX sensor rejasi
  SENSOR_CALIBRATE:        'EP-IOT-032',  // Sensor kalibrovka
  SENSOR_TEST:             'EP-IOT-033',  // Sensor sinovdan o'tkazish
  GATEWAY_CONNECT:         'EP-IOT-034',  // Gateway ulanish
  GATEWAY_DISCONNECT:      'EP-IOT-035',  // Gateway uzilish
  DATA_BUFFER_FLUSH:       'EP-IOT-036',  // Ma'lumot buferi tozalash
  REALTIME_DASHBOARD:      'EP-IOT-037',  // Real-time dashboard ko'rinishi
  MACHINE_HEALTH_SCORE:    'EP-IOT-038',  // Mashina sog'lom ko'rsatkich
  PREDICTIVE_MAINT_SIGNAL: 'EP-IOT-039',  // Profilaktik texnik xizmat signali
  MAINT_SCHEDULE_CREATE:   'EP-IOT-040',  // Texnik xizmat jadvali yaratish
  MAINT_COMPLETE_LOG:      'EP-IOT-041',  // Texnik xizmat yakunlash yozuvi
  SPARE_PART_REQUEST:      'EP-IOT-042',  // Ehtiyot qism so'rovi
  FAILURE_MODE_DETECT:     'EP-IOT-043',  // Buzilish turi aniqlash
  RCA_INITIATE:            'EP-IOT-044',  // Ildiz-sabab tahlili boshlash
  PRODUCTION_COUNTER_READ: 'EP-IOT-045',  // Ishlab chiqarish hisoblagichi o'qish
  WASTE_COUNTER_READ:      'EP-IOT-046',  // Chiqindi hisoblagichi o'qish
  SPEED_READ:              'EP-IOT-047',  // Tezlik o'qish
  CYCLE_TIME_IOT_READ:     'EP-IOT-048',  // IoT tsikl vaqti o'qish
  EFFICIENCY_CALC:         'EP-IOT-049',  // Samaradorlik hisoblash
  BATCH_COMPLETE_IOT:      'EP-IOT-050',  // Partiya yakunlanishi (IoT signal)
  PRODUCT_COUNT_IOT:       'EP-IOT-051',  // Mahsulot sanash (IoT)
  QUALITY_SAMPLE_IOT:      'EP-IOT-052',  // Sifat namunasi (IoT trigger)
  GOFRA_LAYER_SCAN:        'EP-IOT-053',  // Gofra qavat skanerlash
  GRAMAJ_SCAN:             'EP-IOT-054',  // Gramaj skanerlash
  WIDTH_SCAN:              'EP-IOT-055',  // Kenglik skanerlash
  AI_CAMERA_WATCH:         'EP-IOT-056',  // AI kamera kuzatish
  AI_CAMERA_ALERT:         'EP-IOT-057',  // AI kamera ogohlantirish
  WORKER_PRESENCE_CHECK:   'EP-IOT-058',  // Xodim mavjudligi tekshirish
  IDLE_TIME_DETECT:        'EP-IOT-059',  // Bekor turish aniqlash
  OVERLOAD_DETECT:         'EP-IOT-060',  // Yuklamadan oshish aniqlash
  COOLDOWN_MONITOR:        'EP-IOT-061',  // Sovutish kuzatish
  LUBRICATION_ALERT:       'EP-IOT-062',  // Moylash ogohlantirish
  FILTER_CHANGE_ALERT:     'EP-IOT-063',  // Filtr almashtirish ogohlantirish
  BELT_TENSION_READ:       'EP-IOT-064',  // Kamar tarangligi o'qish
  MOTOR_CURRENT_READ:      'EP-IOT-065',  // Motor toki o'qish
  ALARM_HISTORY_VIEW:      'EP-IOT-066',  // Alarm tarixi ko'rinishi
  IOT_CONFIG_UPDATE:       'EP-IOT-067',  // IoT konfiguratsiya yangilash
  THRESHOLD_CONFIG_SET:    'EP-IOT-068',  // Chegaralar konfiguratsiyasi
  NOTIFICATION_ROUTE:      'EP-IOT-069',  // Bildirishnoma yo'naltirish
  SHIFT_HANDOVER_IOT:      'EP-IOT-070',  // Smena topshirish (IoT)
  ASSET_TAG_SCAN:          'EP-IOT-071',  // Aktivga teg skanerlash
  ASSET_LOCATION_UPDATE:   'EP-IOT-072',  // Aktiv joylashuv yangilash
  GEO_FENCE_BREACH:        'EP-IOT-073',  // Geo-chegaradan chiqish
  RFID_READ:               'EP-IOT-074',  // RFID o'qish
  NFC_READ:                'EP-IOT-075',  // NFC o'qish
  CONVEYOR_SPEED_READ:     'EP-IOT-076',  // Konveyer tezligi o'qish
  INK_LEVEL_READ:          'EP-IOT-077',  // Siyoh darajasi o'qish
  INK_LOW_ALERT:           'EP-IOT-078',  // Siyoh kam ogohlantirish
  PLATE_SCAN:              'EP-IOT-079',  // Plashka skanerlash
  PRINT_REGISTER_READ:     'EP-IOT-080',  // Bosma rejestr o'qish
  COLOR_PROFILE_CHECK:     'EP-IOT-081',  // Rang profili tekshirish
  PAPER_TENSION_READ:      'EP-IOT-082',  // Qog'oz tarangligi o'qish
  CUTTER_BLADE_ALERT:      'EP-IOT-083',  // Kesuvchi tigil ogohlantirish
} as const,
```

**CC bo'limi** — boshlang'ich konstantalar (EP-CC-001..EP-CC-084):

```typescript
CC: {
  REQUEST_CREATE:          'EP-CC-001',  // Umumiy ariza yaratish (yagona kirish)
  REQUEST_ROUTE:           'EP-CC-002',  // Arizani yo'naltirish
  REQUEST_STATUS_UPDATE:   'EP-CC-003',  // Ariza holati yangilash
  NOTIFICATION_SEND:       'EP-CC-004',  // Bildirishnoma yuborish
  NOTIFICATION_READ:       'EP-CC-005',  // Bildirishnomani o'qish
  NOTIFICATION_ARCHIVE:    'EP-CC-006',  // Bildirishnomani arxivlash
  CHAT_SEND:               'EP-CC-007',  // Xabar yuborish
  CHAT_READ:               'EP-CC-008',  // Xabar o'qish
  CHAT_REACTION:           'EP-CC-009',  // Reaktsiya qo'shish
  DOCUMENT_UPLOAD:         'EP-CC-010',  // Hujjat yuklash
  DOCUMENT_SHARE:          'EP-CC-011',  // Hujjat ulashish
  DOCUMENT_SIGN:           'EP-CC-012',  // Hujjatni imzolash
  DOCUMENT_APPROVE:        'EP-CC-013',  // Hujjatni tasdiqlash
  DOCUMENT_REJECT:         'EP-CC-014',  // Hujjatni rad etish
  DOCUMENT_VERSION_CREATE: 'EP-CC-015',  // Hujjat versiyasi yaratish
  ANNOUNCEMENT_CREATE:     'EP-CC-016',  // E'lon yaratish
  ANNOUNCEMENT_PUBLISH:    'EP-CC-017',  // E'lonni nashr etish
  ANNOUNCEMENT_READ:       'EP-CC-018',  // E'lonni o'qish
  TASK_REQUEST_CREATE:     'EP-CC-019',  // Vazifa so'rovi yaratish (3-savat)
  TASK_REQUEST_ASSIGN:     'EP-CC-020',  // Vazifa so'rovini tayinlash
  TASK_REQUEST_COMPLETE:   'EP-CC-021',  // Vazifa so'rovini yakunlash
  MEETING_SCHEDULE:        'EP-CC-022',  // Uchrashuv rejalashtirish
  MEETING_CONFIRM:         'EP-CC-023',  // Uchrashuvni tasdiqlash
  MEETING_CANCEL:          'EP-CC-024',  // Uchrashuvni bekor qilish
  MEETING_NOTES_ADD:       'EP-CC-025',  // Uchrashuv eslatmalari
  MEETING_ACTION_CREATE:   'EP-CC-026',  // Uchrashuv amal punkti
  TELEGRAM_SEND:           'EP-CC-027',  // Telegram xabar yuborish
  TELEGRAM_BOT_COMMAND:    'EP-CC-028',  // Telegram bot buyrug'i
  EMAIL_SEND:              'EP-CC-029',  // Email yuborish
  EMAIL_RECEIVE:           'EP-CC-030',  // Email qabul qilish
  SMS_SEND:                'EP-CC-031',  // SMS yuborish
  PUSH_NOTIFY:             'EP-CC-032',  // Push bildirishnoma
  APPROVAL_REQUEST:        'EP-CC-033',  // Tasdiqlash so'rovi
  APPROVAL_GRANTED:        'EP-CC-034',  // Tasdiqlash berildi
  APPROVAL_DENIED:         'EP-CC-035',  // Tasdiqlash rad etildi
  ESCALATION_TRIGGER:      'EP-CC-036',  // Eskalatsiya ishga tushishi
  ESCALATION_RESOLVE:      'EP-CC-037',  // Eskalatsiya hal qilish
  SLA_BREACH_ALERT:        'EP-CC-038',  // SLA buzilishi ogohlantirish
  PRIORITY_CHANGE:         'EP-CC-039',  // Prioritet o'zgartirish
  DELEGATE_ACTION:         'EP-CC-040',  // Vakolat berish
  REPORT_DAILY_SEND:       'EP-CC-041',  // Kunlik hisobot yuborish (CRON)
  REPORT_WEEKLY_SEND:      'EP-CC-042',  // Haftalik hisobot yuborish (CRON)
  REPORT_MONTHLY_SEND:     'EP-CC-043',  // Oylik hisobot yuborish (CRON)
  STOCK_ALERT_RELAY:       'EP-CC-044',  // Zaxira signalini uzatish (WMS dan)
  SHORTAGE_ALERT_RELAY:    'EP-CC-045',  // Kamomad signalini uzatish
  DELIVERY_ALERT_RELAY:    'EP-CC-046',  // Yetkazib berish signalini uzatish
  PAYMENT_ALERT_RELAY:     'EP-CC-047',  // To'lov signalini uzatish
  QUALITY_ALERT_RELAY:     'EP-CC-048',  // Sifat signalini uzatish
  MAINTENANCE_ALERT_RELAY: 'EP-CC-049',  // Texnik xizmat signalini uzatish
  HR_ALERT_RELAY:          'EP-CC-050',  // HR signalini uzatish
  SYSTEM_ALERT_RELAY:      'EP-CC-051',  // Tizim signalini uzatish
  FEEDBACK_COLLECT:        'EP-CC-052',  // Fikr-mulohaza yig'ish
  FEEDBACK_ANALYZE:        'EP-CC-053',  // Fikr-mulohazani tahlil qilish
  SURVEY_CREATE:           'EP-CC-054',  // So'rovnoma yaratish
  SURVEY_SEND:             'EP-CC-055',  // So'rovnoma yuborish
  SURVEY_RESULT_VIEW:      'EP-CC-056',  // So'rovnoma natijasini ko'rish
  KNOWLEDGE_BASE_ADD:      'EP-CC-057',  // Bilimlar bazasiga qo'shish
  KNOWLEDGE_BASE_SEARCH:   'EP-CC-058',  // Bilimlar bazasida qidirish
  FAQ_ADD:                 'EP-CC-059',  // FAQ qo'shish
  FAQ_VIEW:                'EP-CC-060',  // FAQ ko'rish
  POLICY_PUBLISH:          'EP-CC-061',  // Siyosat nashr etish
  POLICY_ACKNOWLEDGE:      'EP-CC-062',  // Siyosatni o'qiganini tasdiqlash
  WORKFLOW_CREATE:         'EP-CC-063',  // Ish oqimi yaratish
  WORKFLOW_TRIGGER:        'EP-CC-064',  // Ish oqimi ishga tushishi
  WORKFLOW_COMPLETE:       'EP-CC-065',  // Ish oqimi yakunlanishi
  TEMPLATE_CREATE:         'EP-CC-066',  // Shablon yaratish
  TEMPLATE_APPLY:          'EP-CC-067',  // Shablon qo'llash
  INTEGRATION_RECEIVE:     'EP-CC-068',  // Integratsiya orqali qabul qilish
  INTEGRATION_FORWARD:     'EP-CC-069',  // Integratsiya orqali yo'naltirish
  CHANNEL_CREATE:          'EP-CC-070',  // Kanal yaratish
  CHANNEL_JOIN:            'EP-CC-071',  // Kanalga qo'shilish
  CHANNEL_LEAVE:           'EP-CC-072',  // Kanaldan chiqish
  CHANNEL_ARCHIVE:         'EP-CC-073',  // Kanalni arxivlash
  MESSAGE_PIN:             'EP-CC-074',  // Xabarni mahkamlash
  MESSAGE_UNPIN:           'EP-CC-075',  // Xabarni bo'shatish
  MESSAGE_EDIT:            'EP-CC-076',  // Xabarni tahrirlash
  MESSAGE_DELETE:          'EP-CC-077',  // Xabarni o'chirish
  THREAD_CREATE:           'EP-CC-078',  // Mavzu yaratish
  THREAD_REPLY:            'EP-CC-079',  // Mavzuga javob
  MENTION_PROCESS:         'EP-CC-080',  // Mention qayta ishlash
  SEARCH_MESSAGE:          'EP-CC-081',  // Xabarlarda qidirish
  AUDIT_LOG_CC:            'EP-CC-082',  // CC audit jurnali yozuvi
  PRIVACY_FILTER:          'EP-CC-083',  // Maxfiylik filtri
  RETENTION_PURGE:         'EP-CC-084',  // Saqlash muddati tugagan o'chirish
} as const,
```

---

### Qadam 3 — `apps/api/src/common/index.ts` ga eksport qo'shish kerak

**DIQQAT: `index.ts` bu paketning owned-file ro'yxatida EMAS.**

Shuning uchun siz bu faylni O'ZGARTIROLMAYSIZ. Bu faylga tegish uchun:

1. Ushbu yozuvni yaratiladigan `op-codes.ts` faylining boshiga qo'shing:

```typescript
/**
 * BARREL NOTE (P03 → P00 flag):
 * Bu fayl yaratilgandan keyin apps/api/src/common/index.ts
 * ga quyidagi export qo'shilishi kerak:
 *   export * from './op-codes';
 * Bu amal P00 (infrastructure owner) yoki BARREL paket egasiga
 * flag qilingan — P03 emas.
 */
```

2. Agar `index.ts` da barrel yozuvini boshqaruvchi alohida paket bo'lmasa, egaga flag qiling: `apps/api/src/common/index.ts:39` ga `export * from './op-codes';` qo'shish kerak.

---

## 5. DDL (agar bor)

**DDL DARVOZASI:** Bu paket `ddlGate: false`. Hech qanday migration, `CREATE TABLE`, `ALTER TABLE` TAQIQ.

Yaratilayotgan narsalar:
- `apps/api/src/common/op-codes.ts` — TypeScript konstantalar fayli (DB ga tegmaydi)
- `docs/op-codes/REGISTRY.md` — Markdown hujjat

---

## 6. QABUL MEZONI

```
[ ] apps/api/src/common/op-codes.ts mavjud
[ ] docs/op-codes/REGISTRY.md mavjud
[ ] docs/op-codes/ papka yaratilgan
[ ] OP_CODES.WMS — EP-WMS-001..EP-WMS-134 barcha 134 kod mavjud
[ ] OP_CODES.KAN — EP-KAN-001..EP-KAN-137 barcha 137 kod mavjud
[ ] OP_CODES.IOT — EP-IOT-001..EP-IOT-083 barcha 83 kod mavjud
[ ] OP_CODES.CC  — EP-CC-001..EP-CC-084  barcha 84 kod mavjud
[ ] WmsOpCode / KanOpCode / IotOpCode / CcOpCode / AnyOpCode type eksport qilingan
[ ] pnpm tsc --noEmit — 0 xato (BE tsc 0)
[ ] FE tsc 0 (bu fayl FE ga tegmaydi — shart emas, lekin build tekshirilsin)
[ ] REGISTRY.md barcha 438 op-kod jadvalda mavjud
[ ] Har kod: kodi | tavsif | modul | action | holat
[ ] Boshqa owned-file emas → faqat op-codes.ts + REGISTRY.md o'zgartirilgan
[ ] git status — faqat 2 yangi fayl (op-codes.ts + REGISTRY.md), boshqa o'zgarish yo'q
[ ] index.ts ga barrel flag yozilgan (izoh sifatida op-codes.ts boshida)
```

---

## 7. SELF-VERIFY

### 7.1 Fayl mavjudligi

```bash
# Yangi fayllar mavjudligini tekshir
ls -la apps/api/src/common/op-codes.ts
ls -la docs/op-codes/REGISTRY.md

# Papka tuzilmasi
ls docs/op-codes/
```

### 7.2 Konstantalar soni

```bash
# WMS kodlar soni (134 bo'lishi kerak)
grep -c "'EP-WMS-" apps/api/src/common/op-codes.ts

# KAN kodlar soni (137 bo'lishi kerak)
grep -c "'EP-KAN-" apps/api/src/common/op-codes.ts

# IOT kodlar soni (83 bo'lishi kerak)
grep -c "'EP-IOT-" apps/api/src/common/op-codes.ts

# CC kodlar soni (84 bo'lishi kerak)
grep -c "'EP-CC-" apps/api/src/common/op-codes.ts

# Jami (438 bo'lishi kerak)
grep -c "'EP-" apps/api/src/common/op-codes.ts
```

### 7.3 TypeScript tekshirish

```bash
# BE typecheck (0 xato bo'lishi kerak)
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit

# Yoki to'liq
pnpm tsc --noEmit
```

### 7.4 Import test (boshqa modul import qila olishini tekshirish)

```bash
# Vaqtinchalik test fayili (o'chirib tashla)
cat > /tmp/test-import.ts << 'EOF'
import { OP_CODES, WmsOpCode, AnyOpCode } from './apps/api/src/common/op-codes';

const code: WmsOpCode = OP_CODES.WMS.RECEIPT_CREATE;
const anyCode: AnyOpCode = OP_CODES.KAN.TASK_CREATE;
console.log(code, anyCode);
EOF
npx tsc --noEmit --target ES2020 --moduleResolution node /tmp/test-import.ts || echo "TYPE_ERROR"
rm /tmp/test-import.ts
```

### 7.5 REGISTRY.md yozuvlari soni

```bash
# Jadval satrlari (| EP- bilan boshlanadigan)
grep -c "| EP-" docs/op-codes/REGISTRY.md
# Natija: 438 (WMS=134 + KAN=137 + IOT=83 + CC=84)
```

### 7.6 git status tekshirish

```bash
git status
# Kutilgan natija:
# Untracked files:
#   apps/api/src/common/op-codes.ts
#   docs/op-codes/REGISTRY.md
# Boshqa o'zgarish YO'Q
```

---

## 8. COMMIT

```bash
# FAQAT shu ikki fayl
git add apps/api/src/common/op-codes.ts
git add docs/op-codes/REGISTRY.md

# Commit
git commit -m "feat(p03): seed WMS/KAN/IOT/CC op-code registry (438 codes, wave-1)"
```

**Commit xabari formati:**
- `feat(p03):` — paket identifikatori
- `seed` — yangi konstantalar qo'shildi (mavjud kod o'chirilmadi)
- `WMS/KAN/IOT/CC` — modul prefixlari
- `438 codes` — jami konstantalar soni
- `wave-1` — bu Wave 1 paketi

**HECH QACHON:**
```bash
# TAQIQ
git add -A
git add .
git add apps/api/src/common/  # papka qo'shish ham taqiq
```

---

## YAKUNIY ESLATMALAR

1. Bu paket Wave 1 da ishlaydi — boshqa 49 agent ushbu faylga bog'liq. Agar kechiksa, wave-2 agentlar bloklanadi.
2. `op-codes.ts` yaratilgandan keyin, boshqa agentlar `import { OP_CODES } from '../../common/op-codes'` orqali import qiladi — o'zi o'zgartirmaydi.
3. Yangi modul prefixlari (EP-ORG, EP-HR, EP-FIN, va boshqalar) boshqa paketlar tomonidan qo'shiladi — bu paket faqat 4 prefix uchun javobgar.
4. REGISTRY.md — loyiha hujjatining bir qismi. Har yozuv `action` turi bilan: `CREATE | READ | UPDATE | DELETE | APPROVE | REJECT | EVENT | CRON | AI | LOGIN | EXPORT`.
5. Agar `pnpm tsc --noEmit` da xato chiqsa — type export sintaksisini tekshiring (`as const` bilan yozilgan bo'lishi kerak).
