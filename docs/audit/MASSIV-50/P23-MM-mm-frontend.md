# P23 — MM / Ta'minot (Procurement): MM FE: vendor card + PO/PR forms + goods-receiving QC-lab + vendor performance

**Agent:** P23 | **Wave:** 4 | **DependsOn:** P22 (MM backend schema DDL) | **DDL Gate:** YO'Q (FE-only)

---

## 0. ROL VA QOIDALAR

Sen **Bajaruvchi 🟢** agentsan. Faqat quyidagi **OWNED FILES** ro'yxatidagi fayllarga tegasan. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31)**: faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)**: CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

### Wave va Bog'liqlik

- **Wave 4** — P22 (MM backend schema DDL va endpoint to'liqligi) TUGALLANGANDAN KEYIN boshlanadi.
- P22 dan kutilgan: `mm_vendors` ga `vendor_type`, `vendor_status`, `stir`, `bank_account`, `mfo`, `nds_flag`, `is_related_party`, `lead_time_days` ustunlari; `mm_vendor_documents`, `mm_vendor_contact_history`, `mm_lab_results`, `mm_vendor_returns` jadvallari; `/api/mm/vendors/:id/documents`, `/api/mm/goods-receipts/:id/lab-result`, `/api/mm/vendor-ratings/composite` endpointlari tayyor.
- P22 hali tugallanmagan bo'lsa: har bir endpoint'ni `useQuery` orqali chaqir — 501 qaytarsa, `EPComingSoon` ko'rsat, lekin REAL hook va schema saqla (stub EMAS).

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu fayllarga teg. Boshqa fayl kerak bo'lsa TO'XTA + flag:**

```
artifacts/erp-dashboard/src/pages/MMVendors.tsx
artifacts/erp-dashboard/src/pages/MMVendorsFormFields.tsx
artifacts/erp-dashboard/src/pages/MMVendorsSections.tsx
artifacts/erp-dashboard/src/pages/MMVendorsDialogs.tsx
artifacts/erp-dashboard/src/pages/MMPurchaseOrders.tsx
artifacts/erp-dashboard/src/pages/MMExtendedTabs.tsx
artifacts/erp-dashboard/src/pages/GoodsReceiving.tsx
artifacts/erp-dashboard/src/pages/MMDashboard.tsx
artifacts/erp-dashboard/src/pages/VendorPerformance.tsx
```

**Yangi fayl yaratish mumkin (faqat shu papkada, shu modul uchun):**
- `artifacts/erp-dashboard/src/pages/MMVendorsTypes.ts` — agar mavjud bo'lmasa (Vendor schema Zod uchun)
- `artifacts/erp-dashboard/src/pages/MMPurchaseOrdersTypes.ts` — PO Zod schema kengaytmasi
- `artifacts/erp-dashboard/src/pages/GoodsReceivingLabTab.tsx` — QC-lab tab (GoodsReceiving.tsx 900+ qator bo'lib ketmasligi uchun)

**DDL Gate:** Bu paket DDL talab qilmaydi — `ddlGate: false`. Barcha DDL P22 da tasdiqlanadi va bajariladi. Agar P22 dan yangi ustun hali DB da yo'q bo'lsa — FE formada maydon ko'rsat, lekin submit qilganda `onError` graceful handle qil.

---

## 2. VIZYON (EP-MM-001..140 asosida)

### 2.1 Vendor Card — Majburiy maydonlar (EP-MM-037)

Vizyon bo'yicha yetkazuvchi kartochkasi **to'liq to'ldirish bloki** bilan ishlaydi:

| Maydon | Vizyon talabi | Hozirgi holat |
|--------|---------------|---------------|
| `vendor_type` | 6 tur egasi spetsifikatsiyasi bo'yicha: Xom-ashyo / Kimyo / Ehtiyot-qism / Xizmat / Yoqilg'i / Transport | YO'Q |
| `vendor_status` | 5 holat: Faol / Yangi-tekshiruvda / To'xtatilgan / Qora-ro'yxat / Arxiv | YO'Q (faqat `isActive` boolean) |
| `stir` | STIR/INN 9-raqam, majburiy, noyob | Mavjud (`taxId` nomi bilan) |
| `bank_account` | Bank hisob raqami (20 xona) | YO'Q |
| `mfo` | MFO kodi (5 xona) | YO'Q |
| `nds_flag` | NDS to'lovchi belgi (boolean) | YO'Q |
| `is_related_party` | Bog'liq tomon / manfaat konflikti | YO'Q |
| Qora-ro'yxat bloki | PO yaratishda `vendor_status === 'blacklisted'` → blok + xabar | YO'Q |

**Qabul mezoni**: Forma submit qilganda `vendor_type` tanlanmasa → Zod xato ko'rinadi. `stir` 9 xonadan kam bo'lsa → "STIR 9 ta raqam bo'lishi kerak" xato. Saqlangandan keyin lista qaytganda yangi ustunlar ko'rinadi.

### 2.2 Vendor Documents Tab (EP-MM-030/042/079)

Har bir yetkazuvchi kartochkasida **Hujjatlar** tab:
- Kontrakt (raqam, sana, tugash sanasi, skaner URL)
- Sertifikatlar va litsenziyalar
- 30 kundan kam qolganda rang o'zgarishi (sariq → qizil)

**Qabul mezoni**: Hujjat qo'shish → `POST /api/mm/vendors/:id/documents` → jadvalda ko'rinadi. `expiry_date` bugundan 30 kun ichida bo'lsa → `text-[var(--ep-red)]` rang.

### 2.3 Vendor Contact History (EP-MM-085)

Yetkazuvchi kartochkasida **Aloqa tarixi** tab:
- `contact_date`, `topic`, `result`, `contacted_by` maydonlari
- Yangi aloqa qo'shish forma

### 2.4 PO Vendor Name — Real JOIN (KRITIK bugfix)

**Hozirgi bug**: `MMExtendedTabs.tsx:216` — `po.vendorName || po.vendorId || \`Vendor #${po.vendorId}\`` — fakecreate! `CreditorTab` da `Vendor #${po.vendorId}` ko'rinadi.

**Vizyon**: PO ro'yxatida yetkazuvchi ismi BE dan JOIN orqali keladi. FE `getVendorName(vendorId)` funksiyasi allaqachon `MMPurchaseOrders.tsx:161` da mavjud — lekin u `vendors` array'dan qidiradi. Agar `vendors` yuklanmagan bo'lsa yoki PO ob'ektida `vendorName` yo'q bo'lsa — fallback. **Shart**: `vendorName` BE API javobida bo'lishi kerak (bu P22 ishi); FE tomondan `po.vendor?.name ?? po.vendorName ?? getVendorName(po.vendorId)` zanjiri qo'llansin.

### 2.5 PO 7-Status + Urgency/Reject (EP-MM-050)

Vizyon 7 status talab qiladi: `Qoralama` / `Yuborildi` / `Tasdiqlandi` / `Qisman-keldi` / `To'liq-keldi` / `Yopildi` / `Bekor`.

**FE qabul mezoni**: `getStatusBadge()` funksiyasiga 2 ta yangi status qo'shiladi: `partial_received` → sariq badge, `fully_received` → yashil badge. Hozirda faqat 5 status bor (draft/sent/confirmed/received/cancelled).

**Urgency flag**: PO yaratish dialogi da `urgency` checkbox. Reject dialog da `reject_reason` matn maydoni (kamida 10 ta belgi, majburiy).

### 2.6 GoodsReceiving — QC Lab Tab (EP-MM-090-095)

`GoodsReceiving.tsx` dagi qabul aktlari jadvaliga yangi **QC Lab** tab qo'shiladi. Bu tab:
- Har bir qabul aktop uchun lab natijalarini ko'rsatadi
- Lab maydonlari: `namlik_pct` (%), `gramage_gsm` (g/m²), `qalinlik_mkr` (mkr), `material_mark`, `ect_value`
- 3 ta qaror: ✅ Qabul qilindi / ⚠️ Shartli qabul / ❌ Rad etildi
- Rad etilganda: qaytarish hujjati yaratish tugmasi

**Karantin logikasi (FE darajasida)**:
- `namlik_pct > [material_cards.max_namlik_pct]` → `quarantine_status` = `quarantine` (sariq ogohlantirish belgisi)
  > ⚠️ INTERVYU-MOSLIK TUZATMA: Hardcoded 14% TAQIQ. Egasi "namlik chegarasi qog'oz turiga qarab har xil: toplajner ≠ mahalliy rulon". **EGASI QIYMATI KERAK** — chegara material kartasidan (BE dan `namlikThreshold` prop sifatida) kelishi kerak. Hozir `NAMLIK_THRESHOLD_PCT = null` (ogohlantirish o'chirib qo'yilgan) — egasi har material turi uchun qiymat belgilagunga qadar.
- Gramaj texkartadagi normadan ±5% farq qilsa → ogohlantirish
- ECT qiymati texnik kartadan past bo'lsa → ogohlantirish

### 2.7 MMDashboard — Composite Rating (EP-MM-001/041)

Hozirgi `MMDashboard.tsx` da vendor ratings ko'rsatilmaydi. Vizyon bo'yicha:
- Dashboard da **top 5 yetkazuvchi** reytingi: composite ball = `sifat×0.4 + muddat×0.3 + narx×0.2 + hujjat×0.1`
- Har bir yetkazuvchi uchun progress bar + badge (A/B/C/D)
- `/api/mm/vendor-ratings` endpointidan `composite_score` olinadi

**Qabul mezoni**: Dashboard yuklaganda vendor ratings blok ko'rinadi, har qator uchun progress bar 0-100% to'g'ri qiymat ko'rsatadi.

### 2.8 VendorPerformance — To'g'ri endpoint + Composite Formula

`VendorPerformance.tsx` hozir `/api/integration/vendor-performance` so'raydi — bu noto'g'ri URL (AdminRoutes da, MM moduli emas). Vizyon bo'yicha: `/api/mm/vendor-ratings` (composite formula qo'llanilgan) va `/api/mm/dashboard/supplier-performance`.

**Baho qo'shish formasi**: hozir faqat `vendorId`, `score`, `comment` — vizyon bo'yicha alohida `quality_score`, `delivery_score`, `price_score`, `doc_score` (0-100 har biri) maydonlari kerak.

### 2.9 TUSHIB QOLGAN (INTERVYU-MOSLIK TUZATMA) — AP-Aging va 3-Way Match FE

> ⚠️ INTERVYU-MOSLIK TUZATMA (00-INTERVYU-MOSLIK.md §MM — §3 3-DARAJA): Bu paketda 2 ta egasi tasdiqlagan xususiyat FE qismi ham yozilmagan:
>
> **3-Way Match UI (EP-MM-018/052):**
> - Egasi: `3-way match (±3%→blok)` — OCHIQ-JAVOBLAR §MM
> - FE zaruri: `/api/mm/dashboard/3way-match` endpointidan match holati olinadi → GoodsReceiving yoki MMExtendedTabs da ko'rsatiladi — agar farq ±3% dan katta bo'lsa "Bloklangan" badge + menejer tasdig'i tugmasi
> - **DEFER sababli emas, e'tibordan chetda qolgan** — BE 501 stub qaytarmoqda
> - BE tayyorlanganida: `GoodsReceiving.tsx` da har qabul aktiga "3-Way Match holati" qatori qo'shilsin
> - Hozir: `EPComingSoon` yoki 501 graceful handle — lekin REAL hook saqlansin (stub emas)
>
> **AP-Aging UI (EP-FIN-054 / MM taraf):**
> - Egasi: "har yetkazuvchi to'lov muddati profili → aging shu muddatga nisbatan"
> - FE zaruri: `VendorPerformance.tsx` da yoki alohida `MMInvoices.tsx` sahifada AP-aging blok: 0-30/31-60/61-90/90+ kun qarz ustunlar
> - **DEFER: FIN modul bilan kross — P24-P26 bilan birgalikda quriladi**
> - Hozir: `VendorPerformance.tsx` da `/api/mm/dashboard/ap-aging` hook qo'sh (enabled=false, EPComingSoon placeholder); REAL hook saqlansin

---

## 3. HOZIRGI HOLAT (fayl:satr aniq)

### 3.1 Mavjud (exists)

**`MMVendors.tsx`** (`artifacts/.../src/pages/MMVendors.tsx:1-261`):
- `useQuery` → `GET /api/mm/vendors` — REAL
- `useMutation` POST/PATCH/DELETE — REAL
- KPI cards: Jami/Faol/Nofaol — ISHLAYDI
- **MUAMMO**: `handleEdit` (satr 129-143) faqat `vendorCode`, `name`, `nameRu`, `address`, `phone`, `email`, `taxId`, `paymentTerms`, `currency`, `isActive` reset qiladi — yangi maydonlar (`vendor_type`, `vendor_status`, `stir`, `bank_account`, `mfo`, `nds_flag`, `is_related_party`) MAVJUD EMAS

**`MMVendorsFormFields.tsx`** (`artifacts/.../src/pages/MMVendorsFormFields.tsx:1-200+`):
- Mavjud maydonlar: `vendorCode`, `name`, `nameRu`, `address`, `phone`, `email`, `taxId`, `paymentTerms`, `currency`, `isActive`
- **MAVJUD EMAS**: `vendor_type` (Select 6 qiymat), `vendor_status` (Select 5 qiymat), `stir` (Input, 9 xona validation), `bank_account` (Input), `mfo` (Input, 5 xona), `nds_flag` (Switch), `is_related_party` (Switch)

**`MMPurchaseOrders.tsx`** (`artifacts/.../src/pages/MMPurchaseOrders.tsx:1-376`):
- `getVendorName(vendorId)` mavjud (satr 161-165) — `vendors` array'dan qidiradi — ISHLAYDI agar vendors yuklansan
- `getStatusBadge()` (satr 143-157) — faqat 5 status: draft/sent/confirmed/received/cancelled — **2 ta yetishmaydi**: `partial_received`, `fully_received`
- Status filter counts (satr 177-184) — faqat 5 status uchun — kengaytirish kerak
- **MAVJUD EMAS**: urgency flag UI, reject_reason dialog

**`MMExtendedTabs.tsx`** (`artifacts/.../src/pages/MMExtendedTabs.tsx:1-219+`):
- `GoodsReceiptsTab` (satr 118-174) — REAL data ko'rsatadi
- `CreditorTab` (satr 186-219+) — `Vendor #${po.vendorId}` GREEN-LIE (satr 216) — **TUZATISH KERAK**
- `SupplierPortalTab` — stub, lekin `EPComingSoon` orqali — TO'G'RI (Q-46: ishlaydigan stub o'chirilmaydi)

**`GoodsReceiving.tsx`** (`artifacts/.../src/pages/GoodsReceiving.tsx:1-180+`):
- `/api/warehouse/goods-receipts` — REAL (WMS moduli)
- `QcCheckDialog` allaqachon mavjud — lekin u oddiy pass/fail (lab maydonlarsiz)
- **MAVJUD EMAS**: Lab natijalar tab, `namlik_pct`/`gramage_gsm`/`qalinlik_mkr`/`ect_value` maydonlari, karantin logikasi

**`MMDashboard.tsx`** (`artifacts/.../src/pages/MMDashboard.tsx:1-230+`):
- 4 stat card: Jami Materiallar / Kam Zaxira / Yetkazuvchilar / Xarid Buyurtmalari — REAL data
- **MAVJUD EMAS**: Vendor ratings/composite score blok
- Quick actions href lar ba'zi noto'g'ri (`/warehouse-management` o'rniga `/mm/vendors`)

**`VendorPerformance.tsx`** (`artifacts/.../src/pages/VendorPerformance.tsx:1-220+`):
- `addRatingMutation` → `POST /api/mm/vendor-performance` — endpoint noto'g'ri (AdminRoutes da)
- `metrics` query: `/api/integration/vendor-performance` — noto'g'ri URL
- `spendAnalysis` query: `/api/integration/vendor-performance/spend-analysis` — noto'g'ri URL
- Baho forma: faqat bitta `score` maydoni — vizyon 4 alohida score talab qiladi
- `ratingBadge()` funksiyasi — ISHLAYDI, SAQLANADI (Q-46)

### 3.2 Yo'q (missing)

- Vendor card: `vendor_type`, `vendor_status` (5-holat), `stir` (9-xona), `bank_account`, `mfo`, `nds_flag`, `is_related_party` form maydonlari
- Vendor Hujjatlar tab (kontrakt/sertifikat, tugash sana ogohlantirish)
- Vendor Aloqa tarixi tab
- PO forma: urgency checkbox, reject_reason dialog
- PO status: `partial_received`, `fully_received` badge va filter
- GoodsReceiving QC-lab tab (lab maydonlar + qarorlar + karantin)
- MMDashboard vendor ratings/composite score blok
- VendorPerformance: to'g'ri API URL, 4-ball forma

### 3.3 Buzuq / Soxta (brokenOrFake)

| Fayl | Satr | Muammo | Yechim |
|------|------|--------|--------|
| `MMExtendedTabs.tsx` | 216 | `` `Vendor #${po.vendorId}` `` green-lie | `po.vendorName \|\| po.vendor?.name \|\| vendors.find(v=>v.id===po.vendorId)?.name \|\| '—'` |
| `VendorPerformance.tsx` | 50 | `POST /api/mm/vendor-performance` noto'g'ri | `POST /api/mm/vendor-ratings` |
| `VendorPerformance.tsx` | 66 | `GET /api/integration/vendor-performance` noto'g'ri | `GET /api/mm/vendor-ratings` |
| `VendorPerformance.tsx` | 70 | `GET /api/integration/vendor-performance/spend-analysis` noto'g'ri | `GET /api/mm/dashboard/supplier-performance` |
| `GoodsReceiving.tsx` | 57 | `/api/warehouse/goods-receipts` — WMS moduli (to'g'ri), MM uchun `/api/mm/goods-receipts` ham bo'lishi kerak | Ikkala endpoint ni qo'llab-quvvatlash, WMS ni saqla |
| `MMDashboard.tsx` | 153-156 | Quick action href `/warehouse-management` → MM uchun noto'g'ri | `/mm/vendors`, `/mm/purchase-orders` ga to'g'irla |

---

## 4. ISH (qadam-baqadam)

### QADAM 1 — MMVendorsTypes.ts: Zod sxemani kengaytir

> ⚠️ INTERVYU-MOSLIK TUZATMA: Quyidagi kod P22 BE enum (`raw_material/chemical/spare_part/service/fuel/transport`) bilan UYGUN holga keltirilgan. Avvalgi versiyada `manufacturer/distributor/importer` qiymatlari NOTO'G'RI edi — egasi "xom-ashyo/kimyo/ehtiyot-qism/xizmat/yoqilg'i/transport" degan. VENDOR_STATUS_OPTIONS da `trial` → `pending` ga o'zgartirildi (P22 CHECK bilan moslik).

**Fayl**: `artifacts/erp-dashboard/src/pages/MMVendorsTypes.ts`

Mavjud `VendorFormData` / `vendorFormSchema` ga yangi maydonlar qo'sh:

```typescript
// OLDIN (fayl:MMVendorsTypes.ts — mavjud schema oxirida):
export const vendorFormSchema = z.object({
  vendorCode: z.string().min(1, "Kod kerak"),
  name: z.string().min(1, "Nomi kerak"),
  nameRu: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Noto'g'ri email").optional().or(z.literal("")).default(""),
  taxId: z.string().optional().default(""),
  paymentTerms: z.string().optional().default(""),
  currency: z.string().default("UZS"),
  isActive: z.boolean().default(true),
});

// KEYIN — yangi maydonlar QO'SHILADI (mavjud maydonlar o'chirilmaydi):
// ⚠️ INTERVYU-MOSLIK TUZATMA (00-INTERVYU-MOSLIK.md §MM): Yetkazuvchi turlari egasi spetsifikatsiyasi
// bo'yicha: xom-ashyo/kimyo/ehtiyot-qism/xizmat/yoqilg'i/transport (OCHIQ-JAVOBLAR §MM).
// P22 BE enum (raw_material/chemical/spare_part/service/fuel/transport) bilan TO'LIQ UYGUN.
// Oldingi ro'yxat (manufacturer/distributor/importer) NOTO'G'RI edi — tuzatildi.
// Egasi qoidasi: tur ro'yxati MASTER-DATA (DB dan sozlanadigan) bo'lishi kerak;
// hozircha seed sifatida qotirilgan — keyingi fazada mm_vendor_types jadvaliga ko'chiriladi.
export const VENDOR_TYPE_OPTIONS = [
  { value: "raw_material",  label: "Xom-ashyo"          },
  { value: "chemical",      label: "Kimyo materiallari"  },
  { value: "spare_part",    label: "Ehtiyot qismlar"     },
  { value: "service",       label: "Xizmat ko'rsatuvchi" },
  { value: "fuel",          label: "Yoqilg'i"            },
  { value: "transport",     label: "Transport"           },
] as const;

// ⚠️ TUZATMA: P22 BE CHECK constraint bilan uygunlashtirildi ('active'|'pending'|'suspended'|'blacklisted'|'archived').
// "trial" → "pending" ga o'zgartirildi (P22 mm-p1 migration CHECK: 'active','pending','suspended','blacklisted','archived').
export const VENDOR_STATUS_OPTIONS = [
  { value: "active",       label: "Faol",             color: "var(--ep-green)"   },
  { value: "pending",      label: "Yangi-tekshiruvda", color: "var(--ep-yellow)"  },
  { value: "suspended",    label: "To'xtatilgan",     color: "var(--ep-orange)"  },
  { value: "blacklisted",  label: "Qora ro'yxat",     color: "var(--ep-red)"     },
  { value: "archived",     label: "Arxiv",            color: "var(--ep-muted)"   },
] as const;

export const vendorFormSchema = z.object({
  vendorCode:        z.string().min(1, "Kod kerak"),
  name:              z.string().min(2, "Kamida 2 ta belgi"),
  nameRu:            z.string().optional().default(""),
  address:           z.string().optional().default(""),
  phone:             z.string().optional().default(""),
  email:             z.string().email("Noto'g'ri email").optional().or(z.literal("")).default(""),
  taxId:             z.string().optional().default(""),       // eskirgan nom, saqlanadi
  stir:              z.string()
                       .regex(/^\d{9}$/, "STIR 9 ta raqam bo'lishi kerak")
                       .optional()
                       .or(z.literal(""))
                       .default(""),
  bank_account:      z.string().max(20, "20 ta belgidan oshmasin").optional().default(""),
  mfo:               z.string()
                       .regex(/^\d{5}$/, "MFO 5 ta raqam bo'lishi kerak")
                       .optional()
                       .or(z.literal(""))
                       .default(""),
  // ⚠️ TUZATMA: egasi spetsifikatsiyasiga mos (P22 BE enum bilan UYGUN — raw_material/chemical/spare_part/service/fuel/transport)
  vendor_type:       z.enum(["raw_material","chemical","spare_part","service","fuel","transport"])
                       .optional(),
  vendor_status:     z.enum(["active","pending","suspended","blacklisted","archived"])
                       .default("active"),
  // Eslatma: vendor_status "trial" → "pending" ga o'zgartirildi (P22 BE CHECK bilan uygunligi: 'active'|'pending'|'suspended'|'blacklisted'|'archived')
  nds_flag:          z.boolean().default(false),
  is_related_party:  z.boolean().default(false),
  paymentTerms:      z.string().optional().default(""),
  currency:          z.string().default("UZS"),
  isActive:          z.boolean().default(true),
  lead_time_days:    z.number().int().min(0).max(365).optional(),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

// Vendor interface — server javobiga mos (yangi ustunlar qo'shiladi):
export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  nameRu?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  stir?: string;
  bank_account?: string;
  mfo?: string;
  vendor_type?: string;
  vendor_status?: string;
  nds_flag?: boolean;
  is_related_party?: boolean;
  paymentTerms?: string;
  currency?: string;
  isActive: boolean;
  lead_time_days?: number;
}
```

**Tekshir**: `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato.

---

### QADAM 2 — MMVendorsFormFields.tsx: Yangi maydonlar qo'sh

**Fayl**: `artifacts/erp-dashboard/src/pages/MMVendorsFormFields.tsx`

Import qatoriga qo'sh:

```typescript
// OLDIN (satr 28-31):
import {
  CURRENCY_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  type VendorFormData,
} from "./MMVendorsTypes";

// KEYIN:
import {
  CURRENCY_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  VENDOR_TYPE_OPTIONS,
  VENDOR_STATUS_OPTIONS,
  type VendorFormData,
} from "./MMVendorsTypes";
```

Mavjud maydonlardan KEYIN (currency row'dan keyin) qo'shiladi — hech narsa o'chirilmaydi:

```tsx
{/* Row 5: vendor_type + vendor_status */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="vendor_type"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Yetkazuvchi turi</FormLabel>
        <Select onValueChange={field.onChange} value={field.value ?? ""}>
          <FormControl>
            <SelectTrigger data-testid={`${idPrefix}-vendor-type`} className="h-9">
              <SelectValue placeholder="Tur tanlang" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {VENDOR_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="vendor_status"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Holati</FormLabel>
        <Select onValueChange={field.onChange} value={field.value ?? "active"}>
          <FormControl>
            <SelectTrigger data-testid={`${idPrefix}-vendor-status`} className="h-9">
              <SelectValue placeholder="Holat tanlang" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {VENDOR_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span style={{ color: opt.color }} className="font-medium">{opt.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

{/* Row 6: stir + mfo */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="stir"
    render={({ field }) => (
      <FormItem>
        <FormLabel>STIR (INN)</FormLabel>
        <FormControl>
          <Input
            {...field}
            placeholder="123456789"
            maxLength={9}
            data-testid={`${idPrefix}-stir`}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="mfo"
    render={({ field }) => (
      <FormItem>
        <FormLabel>MFO (bank kodi)</FormLabel>
        <FormControl>
          <Input
            {...field}
            placeholder="00000"
            maxLength={5}
            data-testid={`${idPrefix}-mfo`}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

{/* Row 7: bank_account + lead_time_days */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="bank_account"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Bank hisob raqami</FormLabel>
        <FormControl>
          <Input
            {...field}
            placeholder="20208000000000000000"
            maxLength={20}
            data-testid={`${idPrefix}-bank-account`}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="lead_time_days"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Yetkazish muddati (kun)</FormLabel>
        <FormControl>
          <Input
            {...field}
            type="number"
            min={0}
            max={365}
            placeholder="7"
            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
            data-testid={`${idPrefix}-lead-time`}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

{/* Row 8: flags */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="nds_flag"
    render={({ field }) => (
      <FormItem className="flex items-center gap-3 space-y-0 pt-1">
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            data-testid={`${idPrefix}-nds-flag`}
          />
        </FormControl>
        <FormLabel className="cursor-pointer">NDS to'lovchi</FormLabel>
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="is_related_party"
    render={({ field }) => (
      <FormItem className="flex items-center gap-3 space-y-0 pt-1">
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            data-testid={`${idPrefix}-related-party`}
          />
        </FormControl>
        <FormLabel className="cursor-pointer text-[var(--ep-orange)]">
          Bog'liq tomon (COI)
        </FormLabel>
      </FormItem>
    )}
  />
</div>
```

**Muhim**: `VendorFormFieldsProps` interfeysi o'zgartirilmaydi — barcha maydonlar `form` orqali kiradi.

---

### QADAM 3 — MMVendors.tsx: handleEdit va stats kengaytir

**Fayl**: `artifacts/erp-dashboard/src/pages/MMVendors.tsx`

`handleEdit` funksiyasini kengaytir (satr 128-143). Mavjud qiymatlar saqlanadi, yangilari qo'shiladi:

```typescript
// OLDIN (satr 129-143):
function handleEdit(vendor: Vendor) {
  setSelectedVendor(vendor);
  editForm.reset({
    vendorCode: vendor.vendorCode,
    name: vendor.name,
    nameRu: vendor.nameRu ?? "",
    address: vendor.address ?? "",
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    taxId: vendor.taxId ?? "",
    paymentTerms: vendor.paymentTerms ?? "",
    currency: vendor.currency ?? "UZS",
    isActive: vendor.isActive,
  });
  setEditDialogOpen(true);
}

// KEYIN:
function handleEdit(vendor: Vendor) {
  setSelectedVendor(vendor);
  editForm.reset({
    vendorCode:       vendor.vendorCode,
    name:             vendor.name,
    nameRu:           vendor.nameRu ?? "",
    address:          vendor.address ?? "",
    phone:            vendor.phone ?? "",
    email:            vendor.email ?? "",
    taxId:            vendor.taxId ?? "",
    stir:             vendor.stir ?? "",
    bank_account:     vendor.bank_account ?? "",
    mfo:              vendor.mfo ?? "",
    vendor_type:      (vendor.vendor_type as VendorFormData["vendor_type"]) ?? undefined,
    vendor_status:    (vendor.vendor_status as VendorFormData["vendor_status"]) ?? "active",
    nds_flag:         vendor.nds_flag ?? false,
    is_related_party: vendor.is_related_party ?? false,
    paymentTerms:     vendor.paymentTerms ?? "",
    currency:         vendor.currency ?? "UZS",
    isActive:         vendor.isActive,
    lead_time_days:   vendor.lead_time_days ?? undefined,
  });
  setEditDialogOpen(true);
}
```

Stats blokiga `vendor_status` bo'yicha hisoblash qo'sh:

```typescript
// OLDIN (satr 168-175):
const stats = useMemo(() => {
  const active = safeVendors.filter((v) => v.isActive).length;
  return {
    total: safeVendors.length,
    active,
    inactive: safeVendors.length - active,
  };
}, [safeVendors]);

// KEYIN — mavjud logika saqlanadi, blacklist hisoblash qo'shiladi:
const stats = useMemo(() => {
  const active = safeVendors.filter((v) => v.isActive || v.vendor_status === "active").length;
  const blacklisted = safeVendors.filter((v) => v.vendor_status === "blacklisted").length;
  return {
    total: safeVendors.length,
    active,
    inactive: safeVendors.length - active,
    blacklisted,
  };
}, [safeVendors]);
```

KPI kartalar blokiga qora ro'yxat hisoblash qo'sh:

```tsx
// Uchinchi EPKpiCard dan keyin (satr 219 atrofida):
{stats.blacklisted > 0 && (
  <EPKpiCard
    label="Qora ro'yxat"
    value={stats.blacklisted}
    icon={AlertTriangle}
    iconBg="var(--ep-red)"
    enterDelayMs={180}
  />
)}
```

Import ga `AlertTriangle` qo'sh:
```typescript
import { Plus, Truck, CheckCircle2, PauseCircle, AlertTriangle } from "lucide-react";
```

**Qora ro'yxat blok (PO yaratishda)**: `MMVendors.tsx` da bu mantiq yo'q — bu `MMPurchaseOrders.tsx` dagi `createPO` da bo'ladi. `MMVendors.tsx` da faqat badge qo'shish yetarli.

---

### QADAM 4 — MMVendorsSections.tsx: Status badge qo'sh

**Fayl**: `artifacts/erp-dashboard/src/pages/MMVendorsSections.tsx`

`VendorsTableCard` komponentida yetkazuvchi holati uchun status badge qo'sh. Hozirgi holat: faqat `isActive` boolean ko'rsatiladi. Keyin: `vendor_status` bo'yicha rang:

```tsx
// Jadval column da (holat ustunida) quyidagini qo'sh:
import { VENDOR_STATUS_OPTIONS } from "./MMVendorsTypes";

// Render ichida:
function VendorStatusBadge({ vendor }: { vendor: Vendor }) {
  const statusOpt = VENDOR_STATUS_OPTIONS.find(s => s.value === vendor.vendor_status);
  if (!statusOpt) {
    // eski isActive fallback
    return vendor.isActive
      ? <span className="text-xs font-medium text-[var(--ep-green)]">Faol</span>
      : <span className="text-xs font-medium text-muted-foreground">Nofaol</span>;
  }
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: statusOpt.color, background: `${statusOpt.color}22` }}
    >
      {statusOpt.label}
    </span>
  );
}
```

---

### QADAM 5 — MMVendorsDialogs.tsx: Tabs qo'sh (Asosiy / Hujjatlar / Aloqa tarixi)

**Fayl**: `artifacts/erp-dashboard/src/pages/MMVendorsDialogs.tsx`

`EditVendorDialog` ga 3 tab qo'sh: **Asosiy ma'lumotlar**, **Hujjatlar**, **Aloqa tarixi**.

> MUHIM: Yangi vendor yaratishda faqat Asosiy tab. Tahrirlashda 3 tab.

```tsx
// Import qo'sh:
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// VendorDocument interfeysi:
interface VendorDocument {
  id: number;
  doc_type: string;
  doc_number: string;
  doc_date: string;
  expiry_date: string;
  scan_url?: string;
  notes?: string;
}

interface VendorContactHistory {
  id: number;
  contact_date: string;
  topic: string;
  result: string;
  contacted_by?: number;
}
```

`EditVendorDialog` ichida Tabs wrapper qo'sh:

```tsx
// EditVendorDialog ichida DialogContent dan keyin:
<Tabs defaultValue="main" className="mt-2">
  <TabsList>
    <TabsTrigger value="main"><FileText className="h-3.5 w-3.5 mr-1.5" />Asosiy</TabsTrigger>
    <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1.5" />Hujjatlar</TabsTrigger>
    <TabsTrigger value="contacts"><Phone className="h-3.5 w-3.5 mr-1.5" />Aloqa tarixi</TabsTrigger>
  </TabsList>

  <TabsContent value="main">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <VendorFormFields ... />
      </form>
    </Form>
  </TabsContent>

  <TabsContent value="documents">
    <VendorDocumentsTab vendorId={selectedVendor?.id ?? ""} />
  </TabsContent>

  <TabsContent value="contacts">
    <VendorContactsTab vendorId={selectedVendor?.id ?? ""} />
  </TabsContent>
</Tabs>
```

**VendorDocumentsTab** komponenti (shu faylda yoki `MMVendorsDialogs.tsx` da, 900 qatordan oshsa alohida fayl):

```tsx
function VendorDocumentsTab({ vendorId }: { vendorId: string }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    doc_type: "contract",
    doc_number: "",
    doc_date: "",
    expiry_date: "",
    notes: "",
  });

  const { data: docs = [], refetch } = useQuery<VendorDocument[]>({
    queryKey: [`/api/mm/vendors/${vendorId}/documents`],
    enabled: !!vendorId,
  });

  const addDoc = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/mm/vendors/${vendorId}/documents`, docForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mm/vendors/${vendorId}/documents`] });
      toast({ title: "Hujjat qo'shildi" });
      setAddOpen(false);
      setDocForm({ doc_type: "contract", doc_number: "", doc_date: "", expiry_date: "", notes: "" });
    },
    onError: (e: Error) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const safeDocs = Array.isArray(docs) ? docs : [];

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const days = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Hujjatlar</h4>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}
          data-testid="button-add-document">
          <Plus className="h-3.5 w-3.5 mr-1" />Qo'shish
        </Button>
      </div>

      {safeDocs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Hujjatlar yo'q</p>
      ) : (
        <div className="space-y-2">
          {safeDocs.map((doc) => (
            <div key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
              data-testid={`doc-row-${doc.id}`}>
              <div>
                <p className="text-sm font-medium">{doc.doc_number}</p>
                <p className="text-xs text-muted-foreground">{doc.doc_type} · {doc.doc_date}</p>
              </div>
              <div className="flex items-center gap-2">
                {isExpired(doc.expiry_date) ? (
                  <Badge className="text-[var(--ep-red)] bg-[var(--ep-red)]/10 text-xs">Muddati o'tdi</Badge>
                ) : isExpiringSoon(doc.expiry_date) ? (
                  <Badge className="text-[var(--ep-yellow)] bg-[var(--ep-yellow)]/10 text-xs">30 kun qoldi</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{doc.expiry_date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <div className="space-y-3 border border-border rounded-lg p-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hujjat turi</Label>
              <select
                className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background"
                value={docForm.doc_type}
                onChange={(e) => setDocForm(f => ({ ...f, doc_type: e.target.value }))}
                data-testid="input-doc-type">
                <option value="contract">Kontrakt</option>
                <option value="certificate">Sertifikat</option>
                <option value="license">Litsenziya</option>
                <option value="other">Boshqa</option>
              </select>
            </div>
            <div>
              <Label>Hujjat raqami</Label>
              <Input
                value={docForm.doc_number}
                onChange={(e) => setDocForm(f => ({ ...f, doc_number: e.target.value }))}
                placeholder="K-2024-001"
                data-testid="input-doc-number"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sana</Label>
              <Input
                type="date"
                value={docForm.doc_date}
                onChange={(e) => setDocForm(f => ({ ...f, doc_date: e.target.value }))}
                data-testid="input-doc-date"
              />
            </div>
            <div>
              <Label>Tugash sanasi</Label>
              <Input
                type="date"
                value={docForm.expiry_date}
                onChange={(e) => setDocForm(f => ({ ...f, expiry_date: e.target.value }))}
                data-testid="input-doc-expiry"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addDoc.mutate()}
              disabled={addDoc.isPending || !docForm.doc_number}
              data-testid="button-save-document">
              {addDoc.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**VendorContactsTab** (shu faylda, VendorDocumentsTab dan keyin):

```tsx
function VendorContactsTab({ vendorId }: { vendorId: string }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    contact_date: new Date().toISOString().split("T")[0],
    topic: "",
    result: "",
  });

  const { data: contacts = [] } = useQuery<VendorContactHistory[]>({
    queryKey: [`/api/mm/vendors/${vendorId}/contacts`],
    enabled: !!vendorId,
  });

  const addContact = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/mm/vendors/${vendorId}/contacts`, contactForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mm/vendors/${vendorId}/contacts`] });
      toast({ title: "Aloqa tarixi qo'shildi" });
      setAddOpen(false);
      setContactForm({ contact_date: new Date().toISOString().split("T")[0], topic: "", result: "" });
    },
    onError: (e: Error) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const safeContacts = Array.isArray(contacts) ? contacts : [];

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Aloqa tarixi</h4>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}
          data-testid="button-add-contact">
          <Plus className="h-3.5 w-3.5 mr-1" />Yangi aloqa
        </Button>
      </div>

      {safeContacts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Aloqa tarixi yo'q</p>
      ) : (
        <div className="space-y-2">
          {safeContacts.map((c) => (
            <div key={c.id}
              className="p-3 rounded-lg bg-muted/40 space-y-1"
              data-testid={`contact-row-${c.id}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{c.topic}</p>
                <span className="text-xs text-muted-foreground">{c.contact_date}</span>
              </div>
              <p className="text-xs text-muted-foreground">{c.result}</p>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <div className="space-y-3 border border-border rounded-lg p-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sana</Label>
              <Input type="date" value={contactForm.contact_date}
                onChange={(e) => setContactForm(f => ({ ...f, contact_date: e.target.value }))}
                data-testid="input-contact-date" />
            </div>
            <div>
              <Label>Mavzu</Label>
              <Input value={contactForm.topic}
                onChange={(e) => setContactForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="Narx muhokamasi"
                data-testid="input-contact-topic" />
            </div>
          </div>
          <div>
            <Label>Natija</Label>
            <Input value={contactForm.result}
              onChange={(e) => setContactForm(f => ({ ...f, result: e.target.value }))}
              placeholder="Kelishuv bo'ldi / Bo'lmadi"
              data-testid="input-contact-result" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addContact.mutate()}
              disabled={addContact.isPending || !contactForm.topic}
              data-testid="button-save-contact">
              {addContact.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### QADAM 6 — MMPurchaseOrders.tsx: 7 status + urgency + vendor blacklist check

**Fayl**: `artifacts/erp-dashboard/src/pages/MMPurchaseOrders.tsx`

`getStatusBadge()` funksiyasiga 2 yangi status qo'sh (mavjud 5 ta saqlanadi):

```tsx
// OLDIN (satr 143-157) — mavjud 5 case saqlanadi:
// KEYIN — partial_received va fully_received qo'shiladi:
case "partial_received":
  return <Badge className="bg-orange-100 text-orange-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1">
    <Package className="h-3 w-3" />{t("mm.statusPartialReceived") ?? "Qisman keldi"}
  </Badge>;
case "fully_received":
  return <Badge className="bg-emerald-100 text-emerald-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1">
    <CheckCircle className="h-3 w-3" />{t("mm.statusFullyReceived") ?? "To'liq keldi"}
  </Badge>;
case "closed":
  return <Badge className="bg-slate-100 text-slate-700 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1">
    <FileText className="h-3 w-3" />{t("mm.statusClosed") ?? "Yopildi"}
  </Badge>;
```

Status counts (satr 177-184) ga yangi statuslar qo'sh:

```typescript
// OLDIN:
const statusCounts = {
  all: purchaseOrders.length,
  draft: ...,
  sent: ...,
  confirmed: ...,
  received: ...,
  cancelled: ...,
};

// KEYIN (mavjud qiymatlar saqlanadi, yangilari qo'shiladi):
const statusCounts = {
  all:              purchaseOrders.length,
  draft:            safePOs.filter(o => o.status === "draft").length,
  sent:             safePOs.filter(o => o.status === "sent").length,
  confirmed:        safePOs.filter(o => o.status === "confirmed").length,
  received:         safePOs.filter(o => o.status === "received").length,
  cancelled:        safePOs.filter(o => o.status === "cancelled").length,
  partial_received: safePOs.filter(o => o.status === "partial_received").length,
  fully_received:   safePOs.filter(o => o.status === "fully_received").length,
  closed:           safePOs.filter(o => o.status === "closed").length,
};
const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];
```

**Urgency flag PO yaratish formasi**: `poFormSchema` ga `urgency` maydoni qo'sh:

```typescript
// poFormSchema (satr 28-40) ga qo'sh:
urgency: z.boolean().default(false),
reject_reason: z.string().optional(),
```

Forma default values ga:
```typescript
urgency: false,
reject_reason: "",
```

Dialog ichida (items array dan oldin):
```tsx
<FormField
  control={form.control}
  name="urgency"
  render={({ field }) => (
    <FormItem className="flex items-center gap-3 space-y-0">
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange}
          data-testid="input-po-urgency" />
      </FormControl>
      <FormLabel className="cursor-pointer text-[var(--ep-orange)]">
        ⚡ Shoshilinch buyurtma
      </FormLabel>
    </FormItem>
  )}
/>
```

**Vendor blacklist check**: `createPO.mutationFn` da vendor status tekshiruv qo'sh:

```typescript
// createPO.mutationFn ichida, apiRequest dan oldin:
const selectedVendor = (Array.isArray(vendors) ? vendors : []).find(
  v => String(v.id) === data.vendorId
);
if (selectedVendor?.vendor_status === "blacklisted") {
  throw new Error(
    `"${selectedVendor.name}" yetkazuvchisi qora ro'yxatda! PO yaratish mumkin emas.`
  );
}
```

---

### QADAM 7 — MMExtendedTabs.tsx: CreditorTab green-lie tuzat

**Fayl**: `artifacts/erp-dashboard/src/pages/MMExtendedTabs.tsx`

`CreditorTab` ichida `Vendor #${po.vendorId}` green-lie ni tuzat (satr 216 atrofida):

```tsx
// OLDIN (satr 216):
<TableCell className="font-medium">{po.vendorName || po.vendorId || `Vendor #${po.vendorId}`}</TableCell>

// KEYIN:
<TableCell className="font-medium">
  {po.vendorName || po.vendor?.name || "—"}
</TableCell>
```

`GoodsReceiptsTab` da `"QC kutmoqda"` badge ni kengaytir — lab status ham ko'rsatsin:

```tsx
// OLDIN:
<Badge variant={gr.status === "completed" ? "default" : gr.status === "pending_qc" ? "secondary" : "outline"}>
  {gr.status === "pending_qc" ? "QC kutmoqda" : gr.status === "completed" ? "Qabul qilindi" : gr.status || "Jarayonda"}
</Badge>

// KEYIN:
<Badge variant={
  gr.status === "completed" ? "default" :
  gr.status === "pending_qc" || gr.status === "in_lab" ? "secondary" :
  gr.status === "rejected" ? "destructive" : "outline"
}>
  {gr.status === "pending_qc"   ? "QC kutmoqda"   :
   gr.status === "in_lab"       ? "Lab tekshiruvi" :
   gr.status === "completed"    ? "Qabul qilindi"  :
   gr.status === "rejected"     ? "Rad etildi"     :
   gr.status || "Jarayonda"}
</Badge>
```

---

### QADAM 8 — GoodsReceiving.tsx: QC Lab Tab

**Fayl**: `artifacts/erp-dashboard/src/pages/GoodsReceiving.tsx`

Mavjud `QcCheckDialog` o'chirilmaydi (Q-46). Yangi **Lab natijalar** tab qo'shiladi yoki `GoodsReceivingLabTab.tsx` alohida fayl sifatida yaratiladi (GoodsReceiving.tsx 900+ qatorga yetmaslik uchun).

`GoodsReceivingLabTab.tsx` yangi fayl:

```tsx
/**
 * @module GoodsReceivingLabTab
 * @description QC-lab tab for goods receiving — lab fields + 3 decisions.
 * Owned by P23 (MM Frontend).
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle, FlaskConical } from "lucide-react";

interface LabResult {
  id: number;
  receipt_id: number;
  material_id?: number;
  namlik_pct?: number;
  gramage_gsm?: number;
  qalinlik_mkr?: number;
  material_mark?: string;
  ect_value?: number;
  lab_decision: "passed" | "conditional" | "rejected";
  restriction_note?: string;
  tested_at: string;
}

interface GoodsReceivingLabTabProps {
  receiptId: number | string;
  onLabComplete?: () => void;
  // ⚠️ EGASI QIYMATI KERAK: namlik chegarasi material turiga qarab har xil.
  // Parent komponent material_cards.max_namlik_pct dan bu qiymatni uzatishi kerak.
  // null/undefined = ogohlantirish ko'rsatilmaydi.
  namlikThreshold?: number | null;
}

// ⚠️ INTERVYU-MOSLIK TUZATMA (00-INTERVYU-MOSLIK.md §2 §C): Egasi "namlik chegarasi qog'oz turiga
// qarab har xil: toplajner ≠ mahalliy rulon" degan. Hardcoded bitta raqam TAQIQ.
// EGASI QIYMATI KERAK: har material turi uchun alohida chegara mm_lab_thresholds yoki
// material_cards.max_namlik_pct jadvalida saqlanishi kerak (P22 §2.4 ga qarang).
// Hozircha FE tarafida umumiy ogohlantirish uchun prop sifatida qabul qilinadi:
// GoodsReceivingLabTabProps ga `namlikThreshold?: number` maydon qo'shilsin va
// u material_cards ma'lumotidan BE/parent komponent tomonidan uzatilsin.
// Interim (placeholder) qiymat qo'llanilmoqda — ishga tushirishdan OLDIN egasi tasdiqlashi kerak:
const NAMLIK_THRESHOLD_PCT = null; // EGASI QIYMATI KERAK — null = ogohlantirish o'chirib qo'yilgan

export function GoodsReceivingLabTab({ receiptId, onLabComplete, namlikThreshold }: GoodsReceivingLabTabProps) {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [labForm, setLabForm] = useState({
    namlik_pct: "",
    gramage_gsm: "",
    qalinlik_mkr: "",
    material_mark: "",
    ect_value: "",
    lab_decision: "passed" as "passed" | "conditional" | "rejected",
    restriction_note: "",
  });

  const { data: labResults = [], refetch } = useQuery<LabResult[]>({
    queryKey: [`/api/mm/goods-receipts/${receiptId}/lab-result`],
    enabled: !!receiptId,
  });

  const saveLabResult = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/mm/goods-receipts/${receiptId}/lab-result`, {
        namlik_pct:     labForm.namlik_pct ? Number(labForm.namlik_pct) : null,
        gramage_gsm:    labForm.gramage_gsm ? Number(labForm.gramage_gsm) : null,
        qalinlik_mkr:   labForm.qalinlik_mkr ? Number(labForm.qalinlik_mkr) : null,
        material_mark:  labForm.material_mark || null,
        ect_value:      labForm.ect_value ? Number(labForm.ect_value) : null,
        lab_decision:   labForm.lab_decision,
        restriction_note: labForm.lab_decision === "conditional" ? labForm.restriction_note : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mm/goods-receipts/${receiptId}/lab-result`] });
      toast({ title: "Lab natija saqlandi" });
      setFormOpen(false);
      onLabComplete?.();
    },
    onError: (e: Error) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  // Karantin ogohlantirish funksiyasi:
  // ⚠️ EGASI QIYMATI KERAK: namlikThreshold prop null/undefined bo'lsa ogohlantirish ko'rsatilmaydi.
  // Parent komponent material_cards.max_namlik_pct dan bu qiymatni uzatishi kerak.
  const getWarnings = () => {
    const warnings: string[] = [];
    const threshold = namlikThreshold ?? NAMLIK_THRESHOLD_PCT;
    if (labForm.namlik_pct && threshold !== null && threshold !== undefined && Number(labForm.namlik_pct) > threshold) {
      warnings.push(`Namlik ${labForm.namlik_pct}% — chegaradan (${threshold}%) yuqori! Karantin tavsiya etiladi.`);
    }
    return warnings;
  };

  const decisionBadge = (decision: string) => {
    switch (decision) {
      case "passed":     return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle2 className="h-3 w-3" />Qabul qilindi</Badge>;
      case "conditional":return <Badge className="bg-amber-100 text-amber-800 gap-1"><AlertTriangle className="h-3 w-3" />Shartli qabul</Badge>;
      case "rejected":   return <Badge className="bg-red-100 text-red-800 gap-1"><XCircle className="h-3 w-3" />Rad etildi</Badge>;
      default:           return <Badge variant="outline">{decision}</Badge>;
    }
  };

  const safeResults = Array.isArray(labResults) ? labResults : [];
  const warnings = getWarnings();

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Lab natijalar</h4>
        </div>
        {safeResults.length === 0 && (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}
            data-testid="button-add-lab-result">
            Lab natija kiritish
          </Button>
        )}
      </div>

      {safeResults.length > 0 ? (
        <div className="space-y-2">
          {safeResults.map((res) => (
            <div key={res.id}
              className="p-4 rounded-lg bg-muted/40 space-y-2"
              data-testid={`lab-result-${res.id}`}>
              <div className="flex items-center justify-between">
                {decisionBadge(res.lab_decision)}
                <span className="text-xs text-muted-foreground">{res.tested_at?.split("T")[0]}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {res.namlik_pct != null && (() => {
                  // ⚠️ EGASI QIYMATI KERAK: namlikThreshold prop null/undefined bo'lsa qizil rang ko'rsatilmaydi
                  const thr = namlikThreshold ?? NAMLIK_THRESHOLD_PCT;
                  const overLimit = thr !== null && thr !== undefined && res.namlik_pct > thr;
                  return (
                    <div className={overLimit ? "text-[var(--ep-red)]" : ""}>
                      <span className="text-muted-foreground">Namlik:</span> {res.namlik_pct}%
                      {overLimit && " ⚠️"}
                    </div>
                  );
                })()}
                {res.gramage_gsm != null && (
                  <div><span className="text-muted-foreground">Gramaj:</span> {res.gramage_gsm} g/m²</div>
                )}
                {res.qalinlik_mkr != null && (
                  <div><span className="text-muted-foreground">Qalinlik:</span> {res.qalinlik_mkr} mkr</div>
                )}
                {res.ect_value != null && (
                  <div><span className="text-muted-foreground">ECT:</span> {res.ect_value}</div>
                )}
                {res.material_mark && (
                  <div><span className="text-muted-foreground">Marka:</span> {res.material_mark}</div>
                )}
              </div>
              {res.restriction_note && (
                <p className="text-xs text-[var(--ep-orange)] bg-[var(--ep-orange)]/10 px-2 py-1 rounded">
                  Cheklov: {res.restriction_note}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Lab natija yo'q</p>
      )}

      {formOpen && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          {warnings.length > 0 && (
            <div className="bg-[var(--ep-red)]/10 border border-[var(--ep-red)]/30 rounded-md p-3 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-[var(--ep-red)] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />{w}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: "namlik_pct",   label: "Namlik (%)",       placeholder: "12.5" },
              { name: "gramage_gsm",  label: "Gramaj (g/m²)",    placeholder: "200"  },
              { name: "qalinlik_mkr", label: "Qalinlik (mkr)",   placeholder: "300"  },
              { name: "ect_value",    label: "ECT qiymati",      placeholder: "3.5"  },
            ].map((f) => (
              <div key={f.name}>
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={f.placeholder}
                  value={(labForm as Record<string, string>)[f.name]}
                  onChange={(e) => setLabForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                  data-testid={`input-lab-${f.name}`}
                />
              </div>
            ))}
            <div>
              <Label className="text-xs">Material marka</Label>
              <Input
                placeholder="T-top / Testliner"
                value={labForm.material_mark}
                onChange={(e) => setLabForm(f => ({ ...f, material_mark: e.target.value }))}
                data-testid="input-lab-mark"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Lab qaror</Label>
            <div className="flex gap-2 mt-1">
              {(["passed", "conditional", "rejected"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setLabForm(f => ({ ...f, lab_decision: d }))}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    labForm.lab_decision === d
                      ? d === "passed"      ? "bg-green-100 border-green-400 text-green-800"
                      : d === "conditional" ? "bg-amber-100 border-amber-400 text-amber-800"
                      :                       "bg-red-100 border-red-400 text-red-800"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                  data-testid={`btn-decision-${d}`}>
                  {d === "passed" ? "✅ Qabul" : d === "conditional" ? "⚠️ Shartli" : "❌ Rad"}
                </button>
              ))}
            </div>
          </div>

          {labForm.lab_decision === "conditional" && (
            <div>
              <Label className="text-xs">Cheklov tavsifi (majburiy)</Label>
              <Input
                placeholder="Faqat ichki qatlam uchun ishlatish mumkin"
                value={labForm.restriction_note}
                onChange={(e) => setLabForm(f => ({ ...f, restriction_note: e.target.value }))}
                data-testid="input-restriction-note"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => saveLabResult.mutate()}
              disabled={
                saveLabResult.isPending ||
                !labForm.lab_decision ||
                (labForm.lab_decision === "conditional" && !labForm.restriction_note)
              }
              data-testid="button-submit-lab">
              {saveLabResult.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFormOpen(false)}>Bekor</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**`GoodsReceiving.tsx` ga import qo'sh**:

```tsx
// Mavjud importlar saqlanadi, qo'shiladi:
import { GoodsReceivingLabTab } from "./GoodsReceivingLabTab";
```

`ReceiptDetailSheet` (yoki mavjud detail ko'rish uchun) ichida QC Lab tab qo'sh. Agar `ReceiptDetailSheet` owned file bo'lmasa — `GoodsReceiving.tsx` ichida `selectedReceipt` mavjud bo'lganda yangi tab ko'rsatish logikal blok qo'sh.

---

### QADAM 9 — MMDashboard.tsx: Vendor Ratings Blok

**Fayl**: `artifacts/erp-dashboard/src/pages/MMDashboard.tsx`

Mavjud `vendorsData` query saqlanadi. Yangi query qo'sh:

```typescript
// Mavjud querylardan keyin:
const { data: vendorRatingsData } = useQuery<{
  id: number;
  vendor_id: number;
  vendor_name?: string;
  composite_score?: number;
  quality_score?: number;
  delivery_score?: number;
  price_score?: number;
  hujjat_score?: number;
}[]>({
  queryKey: ["/api/mm/vendor-ratings"],
});
```

Dashboard main render ichida (existing statCards grid dan keyin) vendor ratings blok qo'sh:

```tsx
{/* Vendor Ratings blok */}
{Array.isArray(vendorRatingsData) && vendorRatingsData.length > 0 && (
  <Card className="bg-card border-none rounded-xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <TrendingUp className="h-4 w-4 text-primary" />
        Top yetkazuvchilar reytingi
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {vendorRatingsData.slice(0, 5).map((vr, idx) => {
        // Composite formula: sifat×0.4 + muddat×0.3 + narx×0.2 + hujjat×0.1
        const composite = vr.composite_score ??
          ((vr.quality_score  ?? 0) * 0.4 +
           (vr.delivery_score ?? 0) * 0.3 +
           (vr.price_score    ?? 0) * 0.2 +
           (vr.hujjat_score   ?? 0) * 0.1);
        const grade = composite >= 90 ? "A" : composite >= 75 ? "B" : composite >= 60 ? "C" : "D";
        const gradeColor = grade === "A" ? "var(--ep-green)" : grade === "B" ? "var(--ep-blue)" : grade === "C" ? "var(--ep-yellow)" : "var(--ep-red)";

        return (
          <div key={vr.id} className="flex items-center gap-3" data-testid={`vendor-rating-row-${idx}`}>
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: gradeColor }}>
              {grade}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{vr.vendor_name ?? `Yetkazuvchi #${vr.vendor_id}`}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(composite, 100)}%`, background: gradeColor }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {composite.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
)}
```

Quick actions ga to'g'ri URL lar (hozirgi `/warehouse-management` URL o'chirilmaydi, faqat MM-specific actions to'g'irlanadi):

```tsx
// OLDIN (satr 152-157):
const quickActions = [
  { title: "Material qo'shish",  href: "/warehouse-management", icon: Plus },
  { title: "Kirim qilish",       href: "/warehouse-management", icon: ArrowDownRight },
  { title: "Chiqim qilish",      href: "/warehouse-management", icon: ArrowUpRight },
  { title: "Xarid buyurtmasi",   href: "/mm/purchase-orders",   icon: ShoppingCart },
];

// KEYIN:
const quickActions = [
  { title: "Yetkazuvchilar",     href: "/mm/vendors",           icon: Truck },
  { title: "Kirim qilish",       href: "/warehouse/goods-receiving", icon: ArrowDownRight },
  { title: "Xarid buyurtmasi",   href: "/mm/purchase-orders",   icon: ShoppingCart },
  { title: "Yetk. reytingi",     href: "/mm/vendor-performance", icon: TrendingUp },
];
```

Import ga `TrendingUp` allaqachon bor (`MMDashboard.tsx:16`). `Truck` qo'sh:
```typescript
import { ..., Truck } from "lucide-react";
```

---

### QADAM 10 — VendorPerformance.tsx: To'g'ri API URL + 4-ball forma

**Fayl**: `artifacts/erp-dashboard/src/pages/VendorPerformance.tsx`

**1. API URL to'g'irlanadi** (mavjud queries o'chirilmaydi, URL o'zgaradi):

```typescript
// OLDIN (satr 66):
const { data: metrics, isLoading, isError, error, refetch } = useQuery<VendorMetric[]>({
  queryKey: ["/api/integration/vendor-performance"],
});

// KEYIN:
const { data: metrics, isLoading, isError, error, refetch } = useQuery<VendorMetric[]>({
  queryKey: ["/api/mm/vendor-ratings"],
});

// OLDIN (satr 70):
const { data: spendAnalysis } = useQuery<SpendAnalysisItem[]>({
  queryKey: ["/api/integration/vendor-performance/spend-analysis"],
});

// KEYIN:
const { data: spendAnalysis } = useQuery<SpendAnalysisItem[]>({
  queryKey: ["/api/mm/dashboard/supplier-performance"],
});
```

**2. addRatingMutation URL to'g'irlanadi** (satr 50):

```typescript
// OLDIN:
apiRequest("POST", "/api/mm/vendor-performance", {
  vendorId: ratingForm.vendorId,
  score: Number(ratingForm.score),
  comment: ratingForm.comment,
})

// KEYIN:
apiRequest("POST", "/api/mm/vendor-ratings", {
  vendor_id: Number(ratingForm.vendorId),
  quality_score:  Number(ratingForm.quality_score),
  delivery_score: Number(ratingForm.delivery_score),
  price_score:    Number(ratingForm.price_score),
  hujjat_score:   Number(ratingForm.hujjat_score),
  notes:          ratingForm.comment,
})
```

**3. `ratingForm` state kengaytir** (4 alohida ball):

```typescript
// OLDIN (satr 46):
const [ratingForm, setRatingForm] = useState({
  vendorId: "", score: "", comment: ""
});

// KEYIN:
const [ratingForm, setRatingForm] = useState({
  vendorId:       "",
  quality_score:  "",   // sifat (40%)
  delivery_score: "",   // muddat (30%)
  price_score:    "",   // narx (20%)
  hujjat_score:   "",   // hujjat (10%)
  comment:        "",
});
```

**4. Baho dialog formasi kengaytir** — hozirgi bitta `score` Input o'rniga 4 ta alohida maydon:

```tsx
// Mavjud forma ichida (DialogContent):
<div className="space-y-4 pt-2">
  <div className="space-y-1">
    <Label htmlFor="vp-vendorId">Yetkazuvchi ID</Label>
    <Input id="vp-vendorId" placeholder="1" value={ratingForm.vendorId}
      onChange={(e) => setRatingForm(f => ({ ...f, vendorId: e.target.value }))}
      data-testid="input-vendor-id" />
  </div>
  <div className="grid grid-cols-2 gap-3">
    {[
      { key: "quality_score",  label: "Sifat ball (0-100, ×40%)" },
      { key: "delivery_score", label: "Muddat ball (0-100, ×30%)" },
      { key: "price_score",    label: "Narx ball (0-100, ×20%)"  },
      { key: "hujjat_score",   label: "Hujjat ball (0-100, ×10%)"},
    ].map((f) => (
      <div key={f.key} className="space-y-1">
        <Label className="text-xs">{f.label}</Label>
        <Input type="number" min={0} max={100} placeholder="85"
          value={(ratingForm as Record<string, string>)[f.key]}
          onChange={(e) => setRatingForm(prev => ({ ...prev, [f.key]: e.target.value }))}
          data-testid={`input-${f.key}`} />
      </div>
    ))}
  </div>

  {/* Composite preview */}
  {ratingForm.quality_score && ratingForm.delivery_score && (
    <div className="text-sm bg-muted/40 rounded-md px-3 py-2">
      Composite ball: <strong>
        {(
          Number(ratingForm.quality_score)  * 0.4 +
          Number(ratingForm.delivery_score) * 0.3 +
          Number(ratingForm.price_score)    * 0.2 +
          Number(ratingForm.hujjat_score)   * 0.1
        ).toFixed(1)}
      </strong> / 100
    </div>
  )}

  <div className="space-y-1">
    <Label htmlFor="vp-comment">Izoh</Label>
    <Input id="vp-comment" placeholder="Izoh"
      value={ratingForm.comment}
      onChange={(e) => setRatingForm(f => ({ ...f, comment: e.target.value }))}
      data-testid="input-comment" />
  </div>

  <Button
    className="w-full"
    onClick={() => addRatingMutation.mutate()}
    disabled={
      addRatingMutation.isPending ||
      !ratingForm.vendorId ||
      !ratingForm.quality_score ||
      !ratingForm.delivery_score
    }
    data-testid="button-submit-rating">
    {addRatingMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
  </Button>
</div>
```

**5. onSuccess invalidateQueries to'g'irla** (satr 57):

```typescript
// OLDIN:
queryClient.invalidateQueries({ queryKey: ["/api/integration/vendor-performance"] });

// KEYIN:
queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-ratings"] });
queryClient.invalidateQueries({ queryKey: ["/api/mm/dashboard/supplier-performance"] });
```

**6. `ratingBadge` funksiyasi** — SAQLANADI, o'chirilmaydi (Q-46 — ishlaydi):
```typescript
// ratingBadge() funksiyasi (satr 74-79) o'zgartirilmaydi
```

**7. Jami xarid + baholangan KPI kartalar** — SAQLANADI (Q-46):
```tsx
// satr 164-181 — mavjud 4 ta KPI karta o'zgartirilmaydi
```

---

## 5. DDL (GATED)

Bu paket `ddlGate: false` — FE-only. Lekin quyidagi DDL P22 da bajarilishi **shart** (agar bajarilmagan bo'lsa, bu tablolar/ustunlar mavjud emas va FE so'rovlari 500 qaytaradi):

```sql
-- P22 da bajarilishi kerak (P23 faqat FE tomonidan ishlaydi):
-- =====================================================
-- APPROVED: <owner> <date> — P22 paketi tomonidan

-- 1. mm_vendors jadvaliga ustunlar:
ALTER TABLE mm_vendors
  ADD COLUMN IF NOT EXISTS vendor_type    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS vendor_status  VARCHAR(30) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stir           VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_account   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS mfo            VARCHAR(20),
  ADD COLUMN IF NOT EXISTS nds_flag       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_related_party BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER;

-- 2. mm_vendor_documents:
CREATE TABLE IF NOT EXISTS mm_vendor_documents (
  id          SERIAL PRIMARY KEY,
  vendor_id   INT NOT NULL REFERENCES mm_vendors(id) ON DELETE CASCADE,
  doc_type    VARCHAR(30) NOT NULL,
  doc_number  VARCHAR(100),
  doc_date    DATE,
  expiry_date DATE,
  scan_url    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. mm_vendor_contact_history:
CREATE TABLE IF NOT EXISTS mm_vendor_contact_history (
  id             SERIAL PRIMARY KEY,
  vendor_id      INT NOT NULL REFERENCES mm_vendors(id) ON DELETE CASCADE,
  contact_date   DATE NOT NULL,
  contacted_by   INT,
  topic          TEXT NOT NULL,
  result         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. mm_goods_receipts ustunlar (agar mavjud bo'lsa):
ALTER TABLE mm_goods_receipts
  ADD COLUMN IF NOT EXISTS quarantine_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS lab_status        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS nakladnoy_number  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS nakladnoy_date    DATE,
  ADD COLUMN IF NOT EXISTS lot_number        VARCHAR(50);

-- 5. mm_lab_results:
CREATE TABLE IF NOT EXISTS mm_lab_results (
  id               SERIAL PRIMARY KEY,
  receipt_id       INT NOT NULL REFERENCES mm_goods_receipts(id) ON DELETE CASCADE,
  material_id      INT,
  namlik_pct       NUMERIC(5,2),
  gramage_gsm      NUMERIC(8,2),
  qalinlik_mkr     NUMERIC(8,2),
  material_mark    VARCHAR(50),
  ect_value        NUMERIC(8,2),
  lab_decision     VARCHAR(20) NOT NULL DEFAULT 'passed'
                   CHECK (lab_decision IN ('passed','conditional','rejected')),
  restriction_note TEXT,
  authorized_by    INT,
  tested_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 6. mm_vendor_ratings ustunlar:
ALTER TABLE mm_vendor_ratings
  ADD COLUMN IF NOT EXISTS hujjat_score    NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS composite_score NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS weights_snapshot JSONB;
```

**P23 agenti bu DDL ni ISHGA TUSHIRMAYDI** — faqat P22 egasi ruxsati bilan.

---

## 6. QABUL MEZONI

Har bir qadam uchun tasdiqlash:

### Vendor Card (QADAM 1-4)
- [ ] `POST /api/mm/vendors` so'rovi yangi payloadni qabul qiladi: `vendor_type`, `vendor_status`, `stir`, `bank_account`, `mfo`, `nds_flag`, `is_related_party`
- [ ] DB-proof: `SELECT vendor_type, vendor_status, stir, mfo FROM mm_vendors WHERE id = <yangi id>;` — NULL emas
- [ ] `stir` = "12345678" (8 xona) → Zod xato: "STIR 9 ta raqam bo'lishi kerak"
- [ ] `vendor_status = 'blacklisted'` → PO yaratganda xato modal: "Qora ro'yxatda!"
- [ ] Edit dialog da 3 tab ko'rinadi: Asosiy / Hujjatlar / Aloqa tarixi

### Vendor Documents (QADAM 5)
- [ ] `POST /api/mm/vendors/:id/documents` → DB-proof: `SELECT * FROM mm_vendor_documents WHERE vendor_id = <id>;`
- [ ] `expiry_date` = bugundan 25 kun keyin → "30 kun qoldi" badge ko'rinadi
- [ ] `expiry_date` = 3 kun oldin → "Muddati o'tdi" badge ko'rinadi

### PO Statuslar (QADAM 6)
- [ ] `partial_received` status badge sariq rangda ko'rinadi
- [ ] `fully_received` status badge yashil rangda ko'rinadi
- [ ] PO forma da urgency checkbox bor
- [ ] Qora ro'yxat vendor tanlanganda xato toast chiqadi

### CreditorTab Green-Lie (QADAM 7)
- [ ] `po.vendorName || po.vendor?.name || '—'` — "Vendor #5" yoki hardcoded string YO'Q
- [ ] Real PO da vendor nomi ko'rinadi (BE JOIN dan)

### QC Lab (QADAM 8)
- [ ] `POST /api/mm/goods-receipts/:id/lab-result` → DB-proof: `SELECT * FROM mm_lab_results WHERE receipt_id = <id>;`
- [ ] `namlik_pct = 15` (14 dan yuqori) → qizil ogohlantirish matni: "Karantin tavsiya etiladi"
- [ ] `lab_decision = 'conditional'` → `restriction_note` majburiy, bo'sh bo'lsa saqlash disabled
- [ ] `lab_decision = 'rejected'` → badge qizil rangda ko'rinadi

### MMDashboard (QADAM 9)
- [ ] Dashboard da "Top yetkazuvchilar reytingi" blok ko'rinadi (agar `mm_vendor_ratings` bo'sh bo'lmasa)
- [ ] Composite ball = `quality×0.4 + delivery×0.3 + price×0.2 + hujjat×0.1` to'g'ri hisoblanadi
- [ ] Progress bar 0-100% oralig'ida to'g'ri

### VendorPerformance (QADAM 10)
- [ ] `GET /api/mm/vendor-ratings` 200 qaytaradi (eski URL `/api/integration/vendor-performance` o'chirildi)
- [ ] Baho forma 4 ta alohida maydon: sifat/muddat/narx/hujjat
- [ ] `POST /api/mm/vendor-ratings` so'rovida `quality_score`, `delivery_score`, `price_score`, `hujjat_score` maydonlari yuboriladi
- [ ] DB-proof: `SELECT quality_score, delivery_score, price_score, hujjat_score FROM mm_vendor_ratings ORDER BY rated_at DESC LIMIT 1;`
- [ ] Composite preview dialog ichida real vaqtda hisoblanadi

### Umumiy (barcha qadam)
- [ ] `pnpm --filter erp-dashboard exec tsc --noEmit` — 0 xato
- [ ] `bash scripts/reviewer-array-safety.sh` — FAIL: 0
- [ ] `bash scripts/reviewer-as-unknown.sh` — yangi fayllarda FAIL: 0
- [ ] Hech qaysi ishlayotgan funksiya o'chirilmagan (Q-46 tekshiruvi)
- [ ] `git status` da faqat owned files ko'rinadi

---

## 7. SELF-VERIFY

Har bir qadam bajarilgandan keyin quyidagi buyruqlarni ishga tushir:

```bash
# 1. TypeScript tekshiruvi (0 xato bo'lishi kerak):
pnpm --filter erp-dashboard exec tsc --noEmit

# 2. Array xavfsizligi (0 FAIL kerak):
bash scripts/reviewer-array-safety.sh

# 3. Soxta javob tekshiruvi:
bash scripts/reviewer-as-unknown.sh
```

**DB-proof so'rovlar** (har bir asosiy o'zgarish uchun):

```sql
-- Vendor yangi maydonlar (P22 DDL bajarilgandan keyin):
SELECT id, name, vendor_type, vendor_status, stir, mfo, nds_flag, is_related_party
FROM mm_vendors
ORDER BY id DESC LIMIT 5;

-- Vendor hujjatlar:
SELECT vd.id, vd.vendor_id, vd.doc_type, vd.doc_number, vd.expiry_date
FROM mm_vendor_documents vd
ORDER BY vd.created_at DESC LIMIT 5;

-- Vendor aloqa tarixi:
SELECT vc.id, vc.vendor_id, vc.topic, vc.result, vc.contact_date
FROM mm_vendor_contact_history vc
ORDER BY vc.created_at DESC LIMIT 5;

-- Lab natijalar:
SELECT lr.id, lr.receipt_id, lr.namlik_pct, lr.gramage_gsm, lr.lab_decision
FROM mm_lab_results lr
ORDER BY lr.tested_at DESC LIMIT 5;

-- Vendor ratings (composite formula tekshiruvi):
SELECT
  vr.id,
  vr.vendor_id,
  vr.quality_score,
  vr.delivery_score,
  vr.price_score,
  vr.hujjat_score,
  ROUND(
    COALESCE(vr.quality_score,0)  * 0.4 +
    COALESCE(vr.delivery_score,0) * 0.3 +
    COALESCE(vr.price_score,0)    * 0.2 +
    COALESCE(vr.hujjat_score,0)   * 0.1
  , 2) AS composite_calc,
  vr.composite_score AS composite_stored
FROM mm_vendor_ratings vr
ORDER BY vr.rated_at DESC LIMIT 5;
```

**Jonli HTTP tekshiruvi** (backend ishlab turgan bo'lsa):

```bash
# Vendor CRUD (login tokeni bilan):
TOKEN="<your-jwt-token>"

# 1. Vendor yaratish (yangi maydonlar bilan):
curl -s -X POST http://localhost:3030/api/mm/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendorCode":"V-TEST","name":"Test Vendor","vendor_type":"raw_material","vendor_status":"active","stir":"123456789","nds_flag":true}' \
  | jq '.id,.vendor_type,.stir'

# 2. Vendor ratings:
curl -s http://localhost:3030/api/mm/vendor-ratings \
  -H "Authorization: Bearer $TOKEN" | jq '.[0]'

# 3. Lab result (receipt ID bilan):
curl -s http://localhost:3030/api/mm/goods-receipts/1/lab-result \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Edge case tekshiruvlar**:

```bash
# STIR validatsiya (8 xona = xato):
curl -s -X POST http://localhost:3030/api/mm/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendorCode":"V-ERR","name":"Bad Vendor","stir":"12345678"}' \
  | jq '.message'
# Kutilgan: Zod validation error yoki BE: "stir must be 9 digits"

# Blacklist vendor PO yaratish:
# 1. Vendor ni blacklist qil
# 2. PO yaratishda xato modal chiqishi kerak (FE darajasida blok)
```

---

## 8. COMMIT

Har bir mantiqiy guruh uchun alohida commit:

### Commit 1: Vendor card kengaytma (QADAM 1-4)
```bash
git add artifacts/erp-dashboard/src/pages/MMVendorsTypes.ts
git add artifacts/erp-dashboard/src/pages/MMVendorsFormFields.tsx
git add artifacts/erp-dashboard/src/pages/MMVendors.tsx
git add artifacts/erp-dashboard/src/pages/MMVendorsSections.tsx
git commit -m "feat(mm-fe): vendor card — STIR/MFO/bank/type/status/NDS/COI fields + KPI blacklist badge"
```

### Commit 2: Vendor dialogs tabs (QADAM 5)
```bash
git add artifacts/erp-dashboard/src/pages/MMVendorsDialogs.tsx
git commit -m "feat(mm-fe): vendor edit dialog — hujjatlar + aloqa tarixi tabs (EP-MM-030/085)"
```

### Commit 3: PO kengaytma + ExtendedTabs bugfix (QADAM 6-7)
```bash
git add artifacts/erp-dashboard/src/pages/MMPurchaseOrders.tsx
git add artifacts/erp-dashboard/src/pages/MMExtendedTabs.tsx
git commit -m "fix(mm-fe): PO 7-status badges + urgency + blacklist check; CreditorTab vendor name green-lie removed"
```

### Commit 4: QC Lab tab (QADAM 8)
```bash
git add artifacts/erp-dashboard/src/pages/GoodsReceiving.tsx
git add artifacts/erp-dashboard/src/pages/GoodsReceivingLabTab.tsx
git commit -m "feat(mm-fe): QC lab tab — namlik/gramage/ECT + 3-decision + karantin ogohlantirish (EP-MM-090-095)"
```

### Commit 5: MMDashboard vendor ratings + VendorPerformance fix (QADAM 9-10)
```bash
git add artifacts/erp-dashboard/src/pages/MMDashboard.tsx
git add artifacts/erp-dashboard/src/pages/VendorPerformance.tsx
git commit -m "feat(mm-fe): dashboard composite rating blok + VendorPerformance correct API URLs + 4-score form"
```

---

## 9. MUHIM ESLATMALAR

### P22 ga bog'liqlik
Bu FE paket P22 (BE schema DDL) ga to'liq bog'liq. Agar P22 hali tugallanmagan bo'lsa:
- Yangi FE maydonlar forma da ko'rinadi
- Submit qilganda BE 400/500 qaytarsa → `onError` toast chiqaradi
- Bu xato EMAS — P22 tugaganida avtomatik ishlaydi
- `EPComingSoon` ko'rsatish SHART EMAS — real forma saqlansin

### Sidebar / Route (P50 tomonidan)
`VendorPerformance` sahifasi hozir `/integration/vendor-performance` route da — bu P50 tomonidan `/mm/vendor-performance` ga ko'chiriladi. P23 faqat `VendorPerformance.tsx` ichki mantiqini to'g'irlaydi, route ni TEGINMAYDI.

### GoodsReceiving WMS vs MM
`GoodsReceiving.tsx` asosan WMS moduli bo'lib, `/api/warehouse/goods-receipts` endpointidan foydalanadi. MM uchun QC-lab tab `/api/mm/goods-receipts/:id/lab-result` ni qo'shimcha ishlatadi. Agar BE da `/api/mm/goods-receipts` mavjud bo'lsa ham, mavjud WMS endpointi O'CHIRILMAYDI (Q-46).

### Q-40 Eslatma
Har bir `useMutation.onSuccess` da `queryClient.invalidateQueries` ishga tushishi shart — UI avtomatik yangilanadi va yangi data DB dan keladi. "Saqlandi" toast + sahifa yangilanmasa = fake-create!

### Q-46 Eslatma
Quyidagilar SAQLANADI (o'chirilmaydi):
- `MMVendors.tsx` dagi barcha mavjud KPI cards va filtr logikasi
- `MMPurchaseOrders.tsx` dagi `getVendorName()`, `getMaterialName()` funksiyalari
- `VendorPerformance.tsx` dagi `ratingBadge()` funksiyasi va KPI cards
- `GoodsReceiving.tsx` dagi `QcCheckDialog` (alohida pass/fail dialog)
- `MMExtendedTabs.tsx` dagi `SupplierPortalTab` (`EPComingSoon` bilan — bu legitimate stub)
- `MMExtendedTabs.tsx` dagi `CheckBotTab` (future feature, ishlab turgan stub)

---

## 10. VIZYON REFERANS

Vision doc: `docs/audit/MUSLIMBEK-PROMT-09-MM-2026-06-08.md`

Asosiy EP kodlar ushbu P23 direktivaga tegishli:
- **EP-MM-001** — vendor rating auto-calc (composite formula)
- **EP-MM-005** — PO raqam formati
- **EP-MM-007** — narx tarixi
- **EP-MM-030** — vendor hujjat tab
- **EP-MM-037** — vendor card majburiy maydonlar
- **EP-MM-041** — vendor composite rating (sifat 40%/muddat 30%/narx 20%/hujjat 10%)
- **EP-MM-042** — vendor kontrakt
- **EP-MM-050** — PO 7 status
- **EP-MM-079** — sertifikatlar/litsenziyalar tab
- **EP-MM-085** — vendor aloqa tarixi
- **EP-MM-090** — QC lab gate
- **EP-MM-091** — lab maydonlari (namlik/gramage/qalinlik/ECT/marka)
- **EP-MM-092** — karantin auto-belgi
- **EP-MM-093** — gramaj vs texkarta tekshiruvi
- **EP-MM-094** — ECT/gofra qavat tekshiruvi
- **EP-MM-095** — 3 ta lab qaror (passed/conditional/rejected)
- **EP-MM-128** — vendor articul xaritasi (P23 scope dan tashqari — P22 ishi)
- **EP-MM-140** — avans tracking (Finance modul, P23 scope dan tashqari)

---

*Direktiva yaratilgan: 2026-06-19 | P23 | Wave 4 | Q-47 ≥1000 qator talabiga muvofiq*
