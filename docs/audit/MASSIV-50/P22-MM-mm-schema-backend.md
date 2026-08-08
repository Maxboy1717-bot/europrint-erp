# P22 — MM / Ta'minot (Procurement): MM vendor-card + PO/PR + QC-lab + rating/transport DDL + BE

> **Paket:** P22 | **To'lqin:** Wave 1 | **DDL Darvozasi:** HA (GATED) | **Bog'liqlik:** P01, P02 bajarilgandan keyin
> **Yozilgan:** 2026-06-19 | **Egasi tasdig'i:** har migration faylida `-- APPROVED:` majburiy

---

## 0. ROL VA QOIDALAR

Sen **🟢 BAJARUVCHI** agentsan. `CLAUDE.md` + `docs/agent-constitution.md` ni o'qi.

**To'liq qoidalar bloki (Q-47 — har direktivaga kiritilsin):**

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod** bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ. TO'G'RI o'lchovi = master vizyon (`docs/`).
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)**: faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil.
7. **DDL DARVOZASI (Q-35)**: CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Bu paket DDL talab qiladi — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Bu agent WAVE 1 da ishlaydi.** P01 (golden int-schema-lib-barrel) va P02 (golden int-schema-api-barrel) yakunlanganligini `git log --oneline -10` bilan tasdiqla. Agar P01/P02 commit ko'rinmasa — TO'XTA.

**Kanonik jadvallar (hech qachon parallel dunyo yaratma):**
- Buyurtmalar → `sales_orders` (`sd_sales_orders` = VIEW, shu jadval emas)
- Ombor → `warehouse_stock` (`current_stock` = VIEW)
- GL → `gl_entries` / `entries` (HECH QACHON `gl_journal_entries` + `gl_lines`)
- Material → `material_cards` (kanonik, JONLI)

---

## 1. IZOLYATSIYA MANIFESTI

Faqat quyidagi fayllarga tegasan. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag:

```
apps/api/src/shared/db/schema-misc-qc.ts
apps/api/src/shared/db/schema-business-b-1.ts
apps/api/src/modules/mm/dto/mm.dto.ts
apps/api/src/modules/mm/infrastructure/repositories/mm-vendors-pr.repository.ts
apps/api/src/modules/mm/application/commands/create-purchase-order.handler.ts
apps/api/src/modules/mm/presentation/mm-vendors-pr.controller.ts
apps/api/src/modules/mm/presentation/mm-purchase-orders.controller.ts
apps/api/src/modules/mm/application/mm-vendors-pr.service.ts
apps/api/src/modules/mm/infrastructure/repositories/mm-dashboard.repository.ts
apps/api/src/modules/mm/application/mm-goods.service.ts
apps/api/src/modules/mm/infrastructure/repositories/drizzle-mm-goods.repo.ts
apps/api/src/modules/mm/presentation/mm-goods.controller.ts
apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts
apps/api/src/modules/mm/application/mm-dashboard.service.ts

— DDL (GATED — egasi ruxsatisiz ISHGA TUSHIRMA):
apps/api/src/shared/db/migrations/mm-p1-vendor-card-2026-06-19.sql
apps/api/src/shared/db/migrations/mm-p2-po-pr-fixes-2026-06-19.sql
apps/api/src/shared/db/migrations/mm-p3-qc-lab-quarantine-2026-06-19.sql
apps/api/src/shared/db/migrations/mm-p4-rating-transport-2026-06-19.sql
```

**DDL DARVOZASI:** Migration fayllari yoziladi lekin `psql` / Drizzle migrate bilan ISHGA TUSHIRILMAYDI. Har migration faylining boshiga `-- APPROVED: <egasi ismi> <sana>` satri qo'yiladi (placeholder). Egasi "ha, ishga tushir" demaguncha — faqat yozilgan holda qoladi.

---

## 2. VIZYON (Qabul mezoni)

Vizyon manba: `docs/audit/MUSLIMBEK-PROMT-09-MM-2026-06-08.md` va `docs/audit/decisions/11-mm.md`

### 2.1 Vendor Kartasi (EP-MM-037..043, EP-MM-079..102)
- Yetkazuvchi kartasida **barcha majburiy maydonlar** (saqlash bloklansa): nomi, STIR/INN, bank hisob raqami, MFO, yuridik manzil, telefon, aloqa shaxsi
- **6 tur** (xom-ashyo / kimyo / ehtiyot-qism / xizmat / yoqilg'i / transport) — majburiy
  > ⚠️ INTERVYU-MOSLIK TUZATMA (00-INTERVYU-MOSLIK.md §MM): Yetkazuvchi turlari **MASTER-DATA** — hardcoded DB CHECK emas. Egasi "qotirilmaydi, ekrandan sozlanadi" qoidasi (OCHIQ-JAVOBLAR §C). DB CHECK o'rniga `mm_vendor_types` lookup jadvali ishlatilsin. Quyidagi §4 QADAM 1 SQL da CHECK constraint saqlangan — GATED migratsiyada egasi belgisiga qadar qoladi; bajaruvchi uchun ESLATMA: migration tasdiqlanganda CHECK o'rniga lookup jadval + FK usulini qo'llash tavsiya etiladi yoki CHECK qiymatlarini OCHIQ-JAVOBLAR §MM da tasdiqlangan `raw_material/chemical/spare_part/service/fuel/transport` bilan sozlash (P23 FE `manufacturer/distributor/importer` RO'YXATI NOTO'G'RI — §4 P23 tuzatmasini ham ko'r).
- **5 holat**: Faol / Yangi-tekshiruvda / To'xtatilgan / Qora-ro'yxat / Arxiv
- **Qora-ro'yxat** = PO yaratish to'liq bloklangan (BE darajasida tekshiruv)
- Hujjatlar tab (`mm_vendor_documents`): kontrakt + sertifikatlar, 30 kun expiry CRON
- Aloqa tarixi jurnali (`mm_vendor_contact_history`): CRM pattern
- Yaqin tomon bayrog'i (`is_related_party`): yuqori darajali tasdiqni talab qiladi
- NDS bayrog'i: tender narx taqqoslashida ishlatiladi

### 2.2 Ariza (PR) + Tasdiq Zanjiri (EP-MM-024..047)
- 7 maydon: material / qty / unit / kerak-sana / sabab / qaysi-buyurtma / taxminiy-narx
- Manba: qo'lda / min-ombor-avtomatik / BOM-talabi
- **Konfiguratsiya qilinadigan** tasdiq chegaralari (`mm_approval_thresholds` jadval):
  - < 5 mln UZS → ta'minot boshlig'i
  - 5–50 mln UZS → moliya bo'limi
  - > 50 mln UZS → direktor
- Shoshilinch bayrog'i + rad sababi maydoni
- Har operatsiya `audit_log`ga `EP-MM-###` op-kod bilan yoziladi

### 2.3 PO (Xarid Buyurtmasi) Tuzatishlari (EP-MM-005..007, EP-MM-050..054)
- **Raqam formati**: `PO-2026-000123` (yil-ketma-ket) — hozir `PO-{Date.now()}` (epoch) = XATO
- **7 holat** (hozir faqat 5 ta): Qoralama / Yuborildi / Tasdiqlandi / Qisman-keldi / To'liq-keldi / Yopildi / Bekor
- **Vendor nomi**: real JOIN `mm_vendors` bilan — hozir `'Vendor #N'` hardcoded = Q-40 XATO
- **Ikki valyuta**: `original_currency` + `mb_rate` + `uzs_amount` — hozir bitta `currency` maydoni
- `expected_delivery_date` ustun nomi: sxemada `expected_date`, repository'da `expected_delivery_date` — DRIFT, birlashtirilsin
- Qisman yetkazib berishni saqlash: buyurtma/qabul qilingan/qolgan holati

### 2.4 Tovarlar Qabuli + QC Lab Darvozasi (EP-MM-090..096)
- `mm_goods_receipts`ga `quarantine_status` + `lab_status` + `nakladnoy_*` + `lot_number` maydonlari
- `mm_lab_results` yangi jadval: namlik/gramaj/qalinlik/ECT/marka, lab qarorlari
- Namlik > chegara → avtomatik karantin (**konfiguratsiya qilinadigan — qog'oz TURIGA qarab har xil**)
  > ⚠️ INTERVYU-MOSLIK TUZATMA (00-INTERVYU-MOSLIK.md §2 §C — "Sozlanadigan → kod-hardcode" naqshi): Egasi "namlik chegarasi qog'oz turiga qarab har xil: toplajner ≠ mahalliy rulon" degan (MASTER-SAVOL-JAVOB EP-QC-034: "namlik normasi diapazon 6–9% + ogohlantirish zonasi"). **Hardcoded `12`/`14`% yoki istalgan bitta raqam TAQIQ.** Namlik chegarasi `mm_lab_thresholds` konfiguratsiya jadvalida material_cards turiga bog'liq satr sifatida saqlanishi kerak. QADAM 12 da (`mm-goods.service.ts`) `> 12` qatoriga **"EGASI QIYMATI KERAK — namlik chegarasi har material turiga alohida saqlanishi kerak, mm_lab_thresholds yoki material_cards.max_namlik_pct"** izohi qo'shilsin; bu qiymat ishga tushirishdan OLDIN egasi tomonidan har material turi uchun to'ldiriladi.
- QC 3 qaror: o'tdi / shartli / rad
- Rad → `mm_vendor_returns` hujjati

### 2.5 Vendor Reytingi Kompozit Formula (EP-MM-001..003, EP-MM-041)
- **Egasi bekor qilish EP-MM-002/040**: sifat×40% + muddat×30% + narx×20% + hujjat×10%
- Hozir `mm_vendor_ratings`da `hujjat_score` va `composite_score` yo'q
- `mm_vendor_rating_weights` — admin tomonidan konfiguratsiya qilinadigan og'irliklar

### 2.6 Transport Master-Ma'lumotlari (EP-MM-020, EP-MM-059..060)
- `mm_vehicles` + `mm_vehicle_fuel_logs` — Drizzle sxemasi MAJBURIY (hozir faqat raw SQL, jadvallar mavjud bo'lmasligi mumkin)
- Yonilg'i formulalari EP-MM-062/063/064 = **501 PENDING** egasi 10-savol sessiyasigacha — bu cheklovni saqla

### 2.7 Qo'shimcha Jadvallar
- `mm_price_history` — har qabuldan keyin avtomatik yoziladi
- `mm_material_vendors` — asosiy + zaxira yetkazuvchi materialga bog'liq

### 2.8 TUSHIB QOLGAN (INTERVYU-MOSLIK TUZATMA — EP-MM-018/052) — AP-Aging + 3-Way Match

> ⚠️ INTERVYU-MOSLIK TUZATMA (00-INTERVYU-MOSLIK.md §MM — §3 3-DARAJA): Egasi quyidagi 2 xususiyatni A-default sifatida tasdiqlagan (OCHIQ-JAVOBLAR §MM ta'minot bo'limi):
>
> **3-Way Match (EP-MM-018/052):**
> - Egasi: `3-way match (±3%→blok)` — OCHIQ-JAVOBLAR §MM `*3-way/narx: 018/052 3-way match (±3%→blok)*`
> - Ta'rif: PO miqdori × GR miqdori × vendor invoice miqdori o'rtasida ±3% dan farq bo'lsa → to'lov bloklangan, menejer tasdig'i kerak
> - Hozirgi holat: `mm-dashboard.controller.ts` da `/api/mm/dashboard/3way-match` → **501** (stub)
> - **Bu paketda bajarilmagan** — DEFER sababli emas, e'tibordan chetda qolgan
> - Keyingi paket yoki P22 kengaytmasi sifatida: `mm_invoice_matching` jadval + `invoiceNumber/invoiceAmount/poAmount/receiptAmount/variance_pct/status` + ±3% CHECK mantiq
> - **EGASI TASDIQLASHI KERAK:** ±3% chegara sozlanadigan bo'lsinmi? Hozir hardcoded qilish taqiq — `mm_approval_thresholds` jadvaliga `3way_tolerance_pct` qatari qo'shish tavsiya etiladi.
>
> **AP-Aging (kreditor qarz eskirishi, EP-FIN-054 + MM integratsiya):**
> - Egasi: "har yetkazib beruvchi to'lov muddati profili → aging shu muddatga nisbatan" (MASTER-SAVOL-JAVOB EP-FIN-054)
> - Ta'rif: yetkazuvchiga to'lanmagan invoicelar: 0-30 / 31-60 / 61-90 / 90+ kun eskirish hisoboti
> - Hozirgi holat: `mm-dashboard.controller.ts` da `/api/mm/dashboard/vendor-invoices` → **501** (stub)
> - **Bu paketda bajarilmagan** — FIN moduli bilan kross-modul, MM tarafidan `mm_vendor_invoices` jadval kerak
> - Keyingi paket yoki P52/FIN kengaytmasi: `mm_vendor_invoices` jadval (po_id/vendor_id/invoice_number/invoice_date/due_date/amount/currency/status) + aging VIEW
> - **Egasi uchun defer-note:** AP-aging to'liq FIN modul doirasida quriladi (FIN P24-P26); MM tarafidan faqat `mm_vendor_invoices` jadval va PO bog'lanishi kerak.

---

## 3. HOZIRGI HOLAT (Fayl:Qator bilan)

### 3.1 Mavjud (REAL ishlaydi)
| Fayl | Holat |
|------|-------|
| `apps/api/src/modules/mm/mm.module.ts` | MmModule `app.module.ts:137` va `feature-modules.ts:29` da ro'yxatda. REAL. |
| `mm-vendors-pr.controller.ts` | Vendor CRUD + PR CRUD REAL. `mm_vendors` va `mm_purchase_requisitions` jadvallaridan o'qiydi. |
| `mm-vendors-pr.repository.ts` | Real DB INSERT/UPDATE/DELETE, Result\<T\>, parametrli SQL. |
| `mm-purchase-orders.controller.ts` | GET/POST/PATCH/DELETE `/api/mm/purchase-orders`. CQRS orqali. |
| `create-purchase-order.handler.ts` | CQRS handler: PO saqlaydi, 50M+ HITL event chiqaradi. |
| `mm-goods.controller.ts` + `mm-goods.service.ts` | Tovar qabuli CRUD + `/post` → `warehouse_stock`. REAL. |
| `mm-dashboard.controller.ts` | Dashboard/vendor-ratings/mrp/fleet REAL. Vendor-invoices/3way/fleet-maintenance = 501. |
| `schema-misc-qc.ts:122` | `mm_vendors` jadval: id/name/code/contactPerson/phone/email/address/paymentTerms/currency. |
| `schema-business-b-1.ts:160` | `mm_purchase_orders`: id/vendor_id/status/total_amount/currency/order_date/expected_date/notes/created_by. |
| `phase2-approved-tables-2026-06-07.sql` | `mm_vendor_ratings` (id/vendor_id/quality_score/delivery_score/price_score) TASDIQLANGAN. |

### 3.2 Buzuq / Soxta (file:line)

| # | Fayl | Qator | Muammo |
|---|------|-------|--------|
| B1 | `mm-purchase-orders.controller.ts` | 54 | `vendor_name: 'Vendor #${r.vendor_id ?? 0}'` — hardcoded. `mm_vendors` JOIN yo'q. Q-40 XATO. |
| B2 | `mm-purchase-orders.controller.ts` | 53 | `po_number: \`PO-${String(r.id).padStart(6, '0')}\`` — kosmetik, DB da saqlanmaydi. Handler 33-qatorda `PO-${Date.now()}` (epoch) = xato format. |
| B3 | `mm-purchase-orders.controller.ts` | 196 | `updatePo` faqat sarlavha (notes/vendor) yangilaydi; PO satrlari hech qachon yangilanmaydi. |
| B4 | `mm-dashboard.repository.ts` | 93 | `po.expected_delivery_date` ustuni yo'q — sxemada `expected_date`. Runtime 500. |
| B5 | `mm-dashboard.repository.ts` | 101 | `purchase_order_items` (lib/db) → `mm_purchase_orders` (shared/db) JOIN: `purchase_order_id` FK emas. 0 qator yoki 500. |
| B6 | `mm-dashboard.repository.ts` | 55–88 | `mm_vehicles` + `mm_vehicle_fuel_logs` raw SQL da, Drizzle pgTable sxemasi yo'q. Fresh DB da 500. |
| B7 | `mm-vendors-pr.controller.ts` | 57–74 | `vendor_performance` jadval (emas `mm_vendor_ratings`) dan o'qiydi; xato bo'lsa `[]` qaytaradi (sukut saqlovchi catch). |
| B8 | `create-purchase-order.handler.ts` | 33 | `PO_MAX_AMOUNT_UZS` konstanta qattiq kodlangan, konfiguratsiyadan emas. EP-MM-025 talab qiladi. |
| B9 | `schema-business-b-1.ts` | 163 | `status` maydonida CHECK cheklovi yo'q; faqat 'draft' default. 7 holat qo'llab-quvvatlanmaydi. |
| B10 | `mm-dashboard.repository.ts` | 21 | `is_active = true` ustun `mm_vendors` sxemada yo'q (schema-misc-qc.ts:122 da ko'rinmaydi). P1 DDL qo'shguncha 500. |

### 3.3 Yetishmayotgan (To'liq yo'q)

| Xususiyat | Holat |
|-----------|-------|
| `mm_vendor_documents` jadval | YO'Q — hech qanday joyda |
| `mm_vendor_contact_history` jadval | YO'Q |
| `mm_approval_thresholds` jadval | YO'Q — chegaralar faqat PO uchun qattiq kodlangan |
| `mm_vendor_quotations` jadval | YO'Q (tender taqqoslash) |
| `mm_price_history` jadval | YO'Q — endpoint bor, ammo `purchase_order_items` dan o'qiydi (noto'g'ri dunyo) |
| `mm_lab_results` jadval | YO'Q |
| `mm_vendor_returns` jadval | YO'Q |
| `mm_vendor_rating_weights` jadval | YO'Q |
| `mm_vehicles` Drizzle pgTable | YO'Q — faqat raw SQL insertlar |
| `mm_vehicle_fuel_logs` Drizzle pgTable | YO'Q — faqat raw SQL |
| `mm_material_vendors` jadval | YO'Q |
| `vendor_type` ustun `mm_vendors`da | YO'Q |
| `vendor_status` ustun `mm_vendors`da | YO'Q (holat yo'q) |
| `stir`, `bank_account`, `mfo` ustunlari | YO'Q |
| `nds_flag`, `is_related_party` ustunlari | YO'Q |
| `lead_time_days` ustun | YO'Q |
| PR `source`, `urgency`, `reject_reason` | YO'Q |
| PR `material_id`, `qty`, `unit`, `estimated_price` | YO'Q (7 maydon spec) |
| PO 7-holat CHECK cheklovi | YO'Q |
| PO `po_number` yil-ketma-ket format | YO'Q |
| PO `original_currency` + `mb_rate` + `uzs_amount` | YO'Q |
| GR `quarantine_status`, `lab_status` | YO'Q |
| GR `nakladnoy_number`, `nakladnoy_date`, `nakladnoy_scan_url` | YO'Q |
| GR `lot_number` | YO'Q |
| VR `hujjat_score`, `composite_score`, `weights_snapshot` | YO'Q |
| Qora-ro'yxat PO blok BE tekshiruvi | YO'Q |
| GL yozuvi qabulda | YO'Q |
| 30-kun expiry CRON | YO'Q |

---

## 4. ISH (Qadam-Baqadam)

> **Muhim:** Har qadam — TO'XTA va egadan RUXSAT ol (Q-28). DDL migratsionlari uchun egasi "APPROVED" deb yozmaguncha — SQL faylini tayyorla, LEKIN ISHGA TUSHIRMA.

---

### QADAM 1 — P1 Migration Tayyorlash: Vendor Kartasi Kengaytmasi

**Fayl:** `apps/api/src/shared/db/migrations/mm-p1-vendor-card-2026-06-19.sql`

Bu migratsiya to'rtta asosiy maqsadga xizmat qiladi:
1. `mm_vendors` ga yetishmayotgan ustunlar qo'shish
2. `mm_vendor_documents` yangi jadval yaratish
3. `mm_vendor_contact_history` yangi jadval yaratish
4. Yetkazuvchi holat CHECK cheklovi qo'shish

**To'liq SQL (GATED — egasi ruxsatisiz ishga tushirma):**

```sql
-- APPROVED: <egasi ismi> <sana>
-- P22 Phase 1: Vendor card completeness
-- EP-MM-037/038/039/042/079/085/080/102

BEGIN;

-- 1a. mm_vendors ga yetishmayotgan ustunlar qo'shish
ALTER TABLE mm_vendors
  ADD COLUMN IF NOT EXISTS vendor_type    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS vendor_status  VARCHAR(30) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stir           VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_account   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS mfo            VARCHAR(20),
  ADD COLUMN IF NOT EXISTS legal_address  TEXT,
  ADD COLUMN IF NOT EXISTS nds_flag       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_related_party BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS related_party_note TEXT,
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER,
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

-- 1b. Vendor holat CHECK cheklovi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mm_vendors_status_check'
  ) THEN
    ALTER TABLE mm_vendors
      ADD CONSTRAINT mm_vendors_status_check
      CHECK (vendor_status IN ('active','pending','suspended','blacklisted','archived'));
  END IF;
END$$;

-- 1c. Vendor tur CHECK cheklovi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mm_vendors_type_check'
  ) THEN
    ALTER TABLE mm_vendors
      ADD CONSTRAINT mm_vendors_type_check
      CHECK (vendor_type IN ('raw_material','chemical','spare_part','service','fuel','transport') OR vendor_type IS NULL);
  END IF;
END$$;

-- 2. Yetkazuvchi hujjatlari jadvali (EP-MM-030/042/079)
CREATE TABLE IF NOT EXISTS mm_vendor_documents (
  id          SERIAL PRIMARY KEY,
  vendor_id   INTEGER NOT NULL REFERENCES mm_vendors(id) ON DELETE CASCADE,
  doc_type    VARCHAR(30) NOT NULL,  -- 'contract','certificate','license','other'
  doc_number  VARCHAR(100),
  doc_date    DATE,
  expiry_date DATE,
  scan_url    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mm_vendor_docs_vendor_id
  ON mm_vendor_documents(vendor_id);

CREATE INDEX IF NOT EXISTS idx_mm_vendor_docs_expiry
  ON mm_vendor_documents(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- 3. Aloqa tarixi jurnali (EP-MM-085)
CREATE TABLE IF NOT EXISTS mm_vendor_contact_history (
  id            SERIAL PRIMARY KEY,
  vendor_id     INTEGER NOT NULL REFERENCES mm_vendors(id) ON DELETE CASCADE,
  contact_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  contacted_by  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  topic         TEXT NOT NULL,
  result        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mm_vendor_contact_vendor_id
  ON mm_vendor_contact_history(vendor_id);

COMMIT;
```

**Tasdiqdan KEYIN** (egasi "ha" deganidan keyin) bu migratsiyani ishga tushir:
```bash
psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/mm-p1-vendor-card-2026-06-19.sql
```

---

### QADAM 2 — schema-misc-qc.ts: mm_vendors Drizzle Sxemasini Yangilash

**Fayl:** `apps/api/src/shared/db/schema-misc-qc.ts`

**OLDIN (122-133 qatorlar):**
```typescript
export const mm_vendors = pgTable('mm_vendors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  paymentTerms: integer('payment_terms'),
  currency: text('currency'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**KEYIN:**
```typescript
export const mm_vendors = pgTable('mm_vendors', {
  id:               serial('id').primaryKey(),
  name:             text('name').notNull(),
  code:             text('code'),
  contactPerson:    text('contact_person'),
  phone:            text('phone'),
  email:            text('email'),
  address:          text('address'),
  paymentTerms:     integer('payment_terms'),
  currency:         text('currency'),
  // Phase 1 additions (mm-p1-vendor-card-2026-06-19.sql) — EP-MM-037/038/039/080/102
  vendorType:       text('vendor_type'),   // 'raw_material'|'chemical'|'spare_part'|'service'|'fuel'|'transport'
  vendorStatus:     text('vendor_status').notNull().default('active'),  // 5 values
  stir:             text('stir'),
  bankAccount:      text('bank_account'),
  mfo:              text('mfo'),
  legalAddress:     text('legal_address'),
  ndsFlag:          boolean('nds_flag').notNull().default(false),
  isRelatedParty:   boolean('is_related_party').notNull().default(false),
  relatedPartyNote: text('related_party_note'),
  leadTimeDays:     integer('lead_time_days'),
  isActive:         boolean('is_active').notNull().default(true),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// mm_vendor_documents (EP-MM-030/042/079) — requires mm-p1 migration
export const mm_vendor_documents = pgTable('mm_vendor_documents', {
  id:         serial('id').primaryKey(),
  vendorId:   integer('vendor_id').notNull().references(() => mm_vendors.id, { onDelete: 'cascade' }),
  docType:    text('doc_type').notNull(),   // 'contract'|'certificate'|'license'|'other'
  docNumber:  text('doc_number'),
  docDate:    date('doc_date'),
  expiryDate: date('expiry_date'),
  scanUrl:    text('scan_url'),
  notes:      text('notes'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// mm_vendor_contact_history (EP-MM-085) — requires mm-p1 migration
export const mm_vendor_contact_history = pgTable('mm_vendor_contact_history', {
  id:           serial('id').primaryKey(),
  vendorId:     integer('vendor_id').notNull().references(() => mm_vendors.id, { onDelete: 'cascade' }),
  contactDate:  date('contact_date').notNull(),
  contactedBy:  integer('contacted_by'),
  topic:        text('topic').notNull(),
  result:       text('result'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**E'tibor:** `mm_vendor_documents` va `mm_vendor_contact_history` jadvallarini `@shared/db` barrel eksporti (`apps/api/src/shared/db/index.ts`) ga qo'shish kerak — LEKIN bu fayl OWNED emas. Bu import kerak bo'lganda egaga flag qil va P01/P02 barrel agentlari orqali qo'shilishini so'ra.

---

### QADAM 3 — P2 Migration Tayyorlash: PO/PR Tuzatishlari

**Fayl:** `apps/api/src/shared/db/migrations/mm-p2-po-pr-fixes-2026-06-19.sql`

```sql
-- APPROVED: <egasi ismi> <sana>
-- P22 Phase 2: PO/PR fixes
-- EP-MM-005/006/024/025/031/046/047/050/054

BEGIN;

-- 1. mm_purchase_requisitions kengaytmasi (EP-MM-046/047)
ALTER TABLE mm_purchase_requisitions
  ADD COLUMN IF NOT EXISTS source              VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS urgency             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reject_reason       TEXT,
  ADD COLUMN IF NOT EXISTS material_id         INTEGER REFERENCES material_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS qty                 NUMERIC(14,3),
  ADD COLUMN IF NOT EXISTS unit                VARCHAR(20),
  ADD COLUMN IF NOT EXISTS estimated_price     NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS from_material_card_id INTEGER REFERENCES material_cards(id) ON DELETE SET NULL;

-- PR manba CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mm_pr_source_check'
  ) THEN
    ALTER TABLE mm_purchase_requisitions
      ADD CONSTRAINT mm_pr_source_check
      CHECK (source IN ('manual','min_stock','bom_demand'));
  END IF;
END$$;

-- 2. Konfiguratsiya qilinadigan tasdiq chegaralari jadvali (EP-MM-025)
CREATE TABLE IF NOT EXISTS mm_approval_thresholds (
  id            SERIAL PRIMARY KEY,
  level         VARCHAR(20) NOT NULL UNIQUE,  -- 'level1'|'level2'|'level3'
  min_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_amount    NUMERIC(15,2),               -- NULL = cheksiz
  approver_role VARCHAR(50) NOT NULL,
  updated_by    INTEGER,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Boshlang'ich seed: 3 daraja
INSERT INTO mm_approval_thresholds (level, min_amount, max_amount, approver_role)
VALUES
  ('level1', 0,          4999999.99, 'supply_head'),
  ('level2', 5000000,    49999999.99,'finance_head'),
  ('level3', 50000000,   NULL,        'director')
ON CONFLICT (level) DO NOTHING;

-- 3. mm_purchase_orders kengaytmasi (EP-MM-005/050/054)
ALTER TABLE mm_purchase_orders
  ADD COLUMN IF NOT EXISTS po_number          VARCHAR(30),
  ADD COLUMN IF NOT EXISTS po_seq             INTEGER,
  ADD COLUMN IF NOT EXISTS original_currency  VARCHAR(10),
  ADD COLUMN IF NOT EXISTS mb_rate            NUMERIC(14,6),
  ADD COLUMN IF NOT EXISTS uzs_amount         NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS approved_by        INTEGER,
  ADD COLUMN IF NOT EXISTS approved_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partial_qty_received NUMERIC(14,3) DEFAULT 0;

-- expected_date → expected_delivery_date alias (drift tuzatish)
-- Eslatma: ustun nomini o'zgartirish emas — faqat VIEW orqali; haqiqiy ustun = expected_date
-- Dashboard repository B4 xatosi uchun:
ALTER TABLE mm_purchase_orders
  ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;

-- Mavjud qiymatlarni backfill qilish
UPDATE mm_purchase_orders
  SET expected_delivery_date = expected_date
  WHERE expected_delivery_date IS NULL AND expected_date IS NOT NULL;

-- PO yil-ketma-ket raqam uchun ketma-ketlik (EP-MM-005)
CREATE SEQUENCE IF NOT EXISTS po_year_seq_2026 START 1;

-- 7-holat CHECK cheklovi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mm_po_status_check'
  ) THEN
    ALTER TABLE mm_purchase_orders
      ADD CONSTRAINT mm_po_status_check
      CHECK (status IN (
        'draft','sent','confirmed',
        'partial','received','closed','cancelled'
      ));
  END IF;
END$$;

-- Mavjud PO lar uchun po_number backfill (taxminiy)
UPDATE mm_purchase_orders
  SET po_number = 'PO-' || EXTRACT(YEAR FROM COALESCE(order_date, created_at::date))::text || '-' || LPAD(id::text, 6, '0')
  WHERE po_number IS NULL;

-- 4. mm_vendor_quotations (EP-MM-056/057 — tender taqqoslash)
CREATE TABLE IF NOT EXISTS mm_vendor_quotations (
  id                  SERIAL PRIMARY KEY,
  pr_id               INTEGER REFERENCES mm_purchase_requisitions(id) ON DELETE SET NULL,
  vendor_id           INTEGER NOT NULL REFERENCES mm_vendors(id) ON DELETE CASCADE,
  price               NUMERIC(12,2) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'UZS',
  delivery_days       INTEGER,
  payment_terms       VARCHAR(50),
  distance_km         NUMERIC(8,1),
  rating_score        NUMERIC(4,2),
  selected            BOOLEAN NOT NULL DEFAULT false,
  not_cheapest_reason TEXT,    -- EP-MM-057: arzon emas tanlansa sabab MAJBURIY
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. mm_price_history (EP-MM-007/053)
CREATE TABLE IF NOT EXISTS mm_price_history (
  id            SERIAL PRIMARY KEY,
  material_id   INTEGER NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
  vendor_id     INTEGER REFERENCES mm_vendors(id) ON DELETE SET NULL,
  unit_price    NUMERIC(12,2) NOT NULL,
  currency      VARCHAR(10) NOT NULL DEFAULT 'UZS',
  po_id         INTEGER REFERENCES mm_purchase_orders(id) ON DELETE SET NULL,
  receipt_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mm_price_history_material
  ON mm_price_history(material_id, receipt_date DESC);

COMMIT;
```

---

### QADAM 4 — P3 Migration Tayyorlash: QC Lab + Karantin

**Fayl:** `apps/api/src/shared/db/migrations/mm-p3-qc-lab-quarantine-2026-06-19.sql`

```sql
-- APPROVED: <egasi ismi> <sana>
-- P22 Phase 3: QC lab gate + quarantine
-- EP-MM-090/091/092/093/094/095/096/097/013/076

BEGIN;

-- 1. mm_goods_receipts kengaytmasi
ALTER TABLE mm_goods_receipts
  ADD COLUMN IF NOT EXISTS quarantine_status  VARCHAR(20) NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS lab_status         VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS nakladnoy_number   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS nakladnoy_date     DATE,
  ADD COLUMN IF NOT EXISTS nakladnoy_scan_url TEXT,
  ADD COLUMN IF NOT EXISTS lot_number         VARCHAR(50),
  ADD COLUMN IF NOT EXISTS batch_number       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS purchase_order_id  INTEGER REFERENCES mm_purchase_orders(id) ON DELETE SET NULL;

-- Holat CHECK lar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mm_gr_quarantine_check'
  ) THEN
    ALTER TABLE mm_goods_receipts
      ADD CONSTRAINT mm_gr_quarantine_check
      CHECK (quarantine_status IN ('none','quarantined','released','rejected'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mm_gr_lab_check'
  ) THEN
    ALTER TABLE mm_goods_receipts
      ADD CONSTRAINT mm_gr_lab_check
      CHECK (lab_status IN ('pending','passed','conditional','rejected'));
  END IF;
END$$;

-- 2. mm_lab_results (EP-MM-090 РД-5)
CREATE TABLE IF NOT EXISTS mm_lab_results (
  id              SERIAL PRIMARY KEY,
  receipt_id      INTEGER NOT NULL REFERENCES mm_goods_receipts(id) ON DELETE CASCADE,
  material_id     INTEGER REFERENCES material_cards(id) ON DELETE SET NULL,
  namlik_pct      NUMERIC(5,2),       -- namlik % EP-MM-091
  gramage_gsm     NUMERIC(8,2),       -- граммаж g/m² EP-MM-092
  qalinlik_mkr    NUMERIC(8,2),       -- qalinlik mkr
  material_mark   VARCHAR(50),        -- qog'oz turi/marka
  ect_value       NUMERIC(8,2),       -- ECT qiymati EP-MM-094
  layer_count     INTEGER,            -- qavat soni (3/5 gofra uchun)
  lab_decision    VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'passed'|'conditional'|'rejected'
  restriction_note TEXT,              -- shartli qabulda cheklov tavsifi
  authorized_by   INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  tested_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lab qaror CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mm_lab_decision_check'
  ) THEN
    ALTER TABLE mm_lab_results
      ADD CONSTRAINT mm_lab_decision_check
      CHECK (lab_decision IN ('pending','passed','conditional','rejected'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_mm_lab_results_receipt
  ON mm_lab_results(receipt_id);

-- 3. mm_vendor_returns (EP-MM-013/076 — rad→qaytarish hujjati)
CREATE TABLE IF NOT EXISTS mm_vendor_returns (
  id           SERIAL PRIMARY KEY,
  receipt_id   INTEGER NOT NULL REFERENCES mm_goods_receipts(id) ON DELETE CASCADE,
  vendor_id    INTEGER NOT NULL REFERENCES mm_vendors(id) ON DELETE CASCADE,
  qty          NUMERIC(14,3) NOT NULL,
  amount       NUMERIC(12,2),
  reason       TEXT NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'draft',  -- 'draft'|'sent'|'accepted'|'closed'
  created_by   INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mm_vendor_returns_vendor
  ON mm_vendor_returns(vendor_id);

COMMIT;
```

---

### QADAM 5 — P4 Migration Tayyorlash: Reyting + Transport

**Fayl:** `apps/api/src/shared/db/migrations/mm-p4-rating-transport-2026-06-19.sql`

```sql
-- APPROVED: <egasi ismi> <sana>
-- P22 Phase 4: Vendor rating composite + transport master-data
-- EP-MM-001/002/003/041/020/059/060/073/132

BEGIN;

-- 1. mm_vendor_ratings kengaytmasi (EP-MM-001/040)
ALTER TABLE mm_vendor_ratings
  ADD COLUMN IF NOT EXISTS hujjat_score      NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS composite_score   NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS weights_snapshot  JSONB;

-- 2. Konfiguratsiya qilinadigan reyting og'irliklari (EP-MM-002/040)
CREATE TABLE IF NOT EXISTS mm_vendor_rating_weights (
  id          SERIAL PRIMARY KEY,
  sifat_pct   NUMERIC(4,1) NOT NULL DEFAULT 40,   -- sifat 40%
  muddat_pct  NUMERIC(4,1) NOT NULL DEFAULT 30,   -- muddat 30%
  narx_pct    NUMERIC(4,1) NOT NULL DEFAULT 20,   -- narx 20%
  hujjat_pct  NUMERIC(4,1) NOT NULL DEFAULT 10,   -- hujjat 10%
  updated_by  INTEGER,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Boshlang'ich seed (faqat bitta qator)
INSERT INTO mm_vendor_rating_weights (sifat_pct, muddat_pct, narx_pct, hujjat_pct)
VALUES (40, 30, 20, 10)
ON CONFLICT DO NOTHING;

-- 3. mm_vehicles — transport asosiy ma'lumotlar (EP-MM-020/059)
-- Eslatma: Yonilg'i formulalari EP-MM-062/063/064 = PENDING egasi sessiyasigacha
CREATE TABLE IF NOT EXISTS mm_vehicles (
  id                  SERIAL PRIMARY KEY,
  plate_number        VARCHAR(20) NOT NULL UNIQUE,
  type                VARCHAR(30),   -- 'truck'|'van'|'forklift'|'other'
  model               VARCHAR(100),
  year                INTEGER,
  driver_id           INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'active',
  fuel_norm_per_100km NUMERIC(5,2),  -- me'yor (formulalar keyinroq)
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. mm_vehicle_fuel_logs — yonilg'i jurnali asosiy ma'lumotlar (EP-MM-060)
-- Formulalar (501) hali qurilmaydi — faqat asosiy ma'lumotlar
CREATE TABLE IF NOT EXISTS mm_vehicle_fuel_logs (
  id          SERIAL PRIMARY KEY,
  vehicle_id  INTEGER NOT NULL REFERENCES mm_vehicles(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  fuel_amount NUMERIC(8,2),   -- litr
  fuel_cost   NUMERIC(10,2),  -- narx
  mileage     INTEGER,        -- km
  driver_id   INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mm_fuel_logs_vehicle
  ON mm_vehicle_fuel_logs(vehicle_id, log_date DESC);

-- 5. mm_material_vendors — asosiy + zaxira yetkazuvchi (EP-MM-073/132)
CREATE TABLE IF NOT EXISTS mm_material_vendors (
  id              SERIAL PRIMARY KEY,
  material_id     INTEGER NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
  vendor_id       INTEGER NOT NULL REFERENCES mm_vendors(id) ON DELETE CASCADE,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  lead_time_days  INTEGER,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (material_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_mm_material_vendors_material
  ON mm_material_vendors(material_id);

COMMIT;
```

---

### QADAM 6 — schema-business-b-1.ts: PO/PR/GR Sxemalarini Yangilash

**Fayl:** `apps/api/src/shared/db/schema-business-b-1.ts`

#### 6a. mm_purchase_orders (160-172 qatorlar)

**OLDIN:**
```typescript
export const mm_purchase_orders = pgTable('mm_purchase_orders', {
  id:              serial('id').primaryKey(),
  vendor_id:       integer('vendor_id'),
  status:          text('status').default('draft'),
  total_amount:    numeric('total_amount', { precision: 15, scale: 2 }),
  currency:        text('currency').default('UZS'),
  order_date:      date('order_date'),
  expected_date:   date('expected_date'),
  notes:           text('notes'),
  created_by:      integer('created_by'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});
```

**KEYIN:**
```typescript
export const mm_purchase_orders = pgTable('mm_purchase_orders', {
  id:                   serial('id').primaryKey(),
  vendor_id:            integer('vendor_id'),
  // EP-MM-005: yil-ketma-ket format PO-2026-000123
  po_number:            text('po_number'),
  po_seq:               integer('po_seq'),
  // EP-MM-050: 7 holat
  status:               text('status').default('draft'),  // draft|sent|confirmed|partial|received|closed|cancelled
  total_amount:         numeric('total_amount', { precision: 15, scale: 2 }),
  // EP-MM-054 egasi bekor qilish: ikki valyuta saqlash
  currency:             text('currency').default('UZS'),
  original_currency:    text('original_currency'),
  mb_rate:              numeric('mb_rate', { precision: 14, scale: 6 }),
  uzs_amount:           numeric('uzs_amount', { precision: 15, scale: 2 }),
  order_date:           date('order_date'),
  expected_date:        date('expected_date'),        // kanonik nom
  expected_delivery_date: date('expected_delivery_date'),  // drift tuzatish uchun alias (B4)
  notes:                text('notes'),
  created_by:           integer('created_by'),
  approved_by:          integer('approved_by'),
  approved_at:          timestamp('approved_at'),
  partial_qty_received: numeric('partial_qty_received', { precision: 14, scale: 3 }).default('0'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});
```

#### 6b. mm_purchase_requisitions (174-183 qatorlar)

**OLDIN:**
```typescript
export const mm_purchase_requisitions = pgTable('mm_purchase_requisitions', {
  id:           serial('id').primaryKey(),
  title:        text('title'),
  requested_by: integer('requested_by'),
  needed_by:    date('needed_by'),
  notes:        text('notes'),
  status:       text('status').default('pending'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});
```

**KEYIN:**
```typescript
export const mm_purchase_requisitions = pgTable('mm_purchase_requisitions', {
  id:                   serial('id').primaryKey(),
  title:                text('title'),
  requested_by:         integer('requested_by'),
  needed_by:            date('needed_by'),
  notes:                text('notes'),
  status:               text('status').default('pending'),
  // EP-MM-046: 7 maydon spetsifikatsiyasi
  source:               text('source').default('manual'),  // 'manual'|'min_stock'|'bom_demand'
  urgency:              boolean('urgency').default(false),
  reject_reason:        text('reject_reason'),
  material_id:          integer('material_id'),
  qty:                  numeric('qty', { precision: 14, scale: 3 }),
  unit:                 text('unit'),
  estimated_price:      numeric('estimated_price', { precision: 12, scale: 2 }),
  from_material_card_id: integer('from_material_card_id'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});
```

#### 6c. mm_goods_receipts (193-202 qatorlar)

**OLDIN:**
```typescript
export const mm_goods_receipts = pgTable('mm_goods_receipts', {
  id:           serial('id').primaryKey(),
  po_id:        integer('po_id'),
  warehouse_id: integer('warehouse_id'),
  received_by:  integer('received_by'),
  receipt_date: date('receipt_date'),
  status:       text('status').default('pending'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
});
```

**KEYIN:**
```typescript
export const mm_goods_receipts = pgTable('mm_goods_receipts', {
  id:                   serial('id').primaryKey(),
  po_id:                integer('po_id'),
  purchase_order_id:    integer('purchase_order_id').references(() => mm_purchase_orders.id, { onDelete: 'set null' }),
  warehouse_id:         integer('warehouse_id'),
  received_by:          integer('received_by'),
  receipt_date:         date('receipt_date'),
  status:               text('status').default('pending'),
  notes:                text('notes'),
  // Phase 3 additions (mm-p3-qc-lab-quarantine-2026-06-19.sql)
  quarantine_status:    text('quarantine_status').default('none'),  // 'none'|'quarantined'|'released'|'rejected'
  lab_status:           text('lab_status').default('pending'),      // 'pending'|'passed'|'conditional'|'rejected'
  nakladnoy_number:     text('nakladnoy_number'),
  nakladnoy_date:       date('nakladnoy_date'),
  nakladnoy_scan_url:   text('nakladnoy_scan_url'),
  lot_number:           text('lot_number'),
  batch_number:         text('batch_number'),
  created_at:           timestamp('created_at').defaultNow(),
});
```

---

### QADAM 7 — mm.dto.ts: Yangi DTO Sxemalar

**Fayl:** `apps/api/src/modules/mm/dto/mm.dto.ts`

Mavjud sxemalarga qo'shimcha, faylning oxiriga qo'sh:

```typescript
// ─── Vendor Card Kengaytmasi (EP-MM-037/038/039) ───────────────────────────

export const MmCreateVendorSchema = z.object({
  name:              z.string().min(1).max(200),
  code:              z.string().max(50).optional(),
  vendor_type:       z.enum(['raw_material','chemical','spare_part','service','fuel','transport']),
  vendor_status:     z.enum(['active','pending','suspended','blacklisted','archived']).default('pending'),
  stir:              z.string().max(50).optional(),
  bank_account:      z.string().max(50).optional(),
  mfo:               z.string().max(20).optional(),
  legal_address:     z.string().optional(),
  contact_person:    z.string().optional(),
  phone:             z.string().optional(),
  email:             z.string().email().optional(),
  address:           z.string().optional(),
  payment_terms:     z.number().int().positive().optional(),
  currency:          z.string().default('UZS'),
  nds_flag:          z.boolean().default(false),
  is_related_party:  z.boolean().default(false),
  related_party_note: z.string().optional(),
  lead_time_days:    z.number().int().positive().optional(),
});
export type MmCreateVendorDto = z.infer<typeof MmCreateVendorSchema>;

export const MmUpdateVendorSchema = MmCreateVendorSchema.partial();
export type MmUpdateVendorDto = z.infer<typeof MmUpdateVendorSchema>;

// ─── Vendor Hujjat DTO (EP-MM-030/042) ─────────────────────────────────────

export const MmCreateVendorDocSchema = z.object({
  vendor_id:   z.number().int().positive(),
  doc_type:    z.enum(['contract','certificate','license','other']),
  doc_number:  z.string().optional(),
  doc_date:    z.string().optional(),
  expiry_date: z.string().optional(),
  scan_url:    z.string().url().optional(),
  notes:       z.string().optional(),
});
export type MmCreateVendorDocDto = z.infer<typeof MmCreateVendorDocSchema>;

// ─── Vendor Aloqa Tarixi DTO (EP-MM-085) ───────────────────────────────────

export const MmCreateContactHistorySchema = z.object({
  vendor_id:    z.number().int().positive(),
  contact_date: z.string(),
  contacted_by: z.number().int().positive().optional(),
  topic:        z.string().min(1),
  result:       z.string().optional(),
});
export type MmCreateContactHistoryDto = z.infer<typeof MmCreateContactHistorySchema>;

// ─── Ariza (PR) Kengaytmasi DTO (EP-MM-046) ────────────────────────────────

export const MmCreateRequisitionSchema = z.object({
  title:           z.string().min(1).max(200),
  requested_by:    z.number().int().positive().optional(),
  needed_by:       z.string(),          // ISO sana, MAJBURIY
  notes:           z.string().optional(),
  source:          z.enum(['manual','min_stock','bom_demand']).default('manual'),
  urgency:         z.boolean().default(false),
  material_id:     z.number().int().positive().optional(),
  qty:             z.number().positive().optional(),
  unit:            z.string().optional(),
  estimated_price: z.number().positive().optional(),
  items:           z.array(z.object({
    material_id:  z.number().int().positive(),
    quantity:     z.number().positive(),
    unit:         z.string().optional(),
    unit_price:   z.number().positive().optional(),
  })).optional(),
});
export type MmCreateRequisitionDto = z.infer<typeof MmCreateRequisitionSchema>;

export const MmUpdateRequisitionSchema = MmCreateRequisitionSchema.partial().extend({
  status:        z.enum(['pending','approved','rejected','draft']).optional(),
  reject_reason: z.string().optional(),
});
export type MmUpdateRequisitionDto = z.infer<typeof MmUpdateRequisitionSchema>;

// ─── Lab Natijasi DTO (EP-MM-090) ──────────────────────────────────────────

export const MmCreateLabResultSchema = z.object({
  receipt_id:    z.number().int().positive(),
  material_id:   z.number().int().positive().optional(),
  namlik_pct:    z.number().min(0).max(100).optional(),
  gramage_gsm:   z.number().positive().optional(),
  qalinlik_mkr:  z.number().positive().optional(),
  material_mark: z.string().optional(),
  ect_value:     z.number().positive().optional(),
  layer_count:   z.number().int().positive().optional(),
  lab_decision:  z.enum(['pending','passed','conditional','rejected']).default('pending'),
  restriction_note: z.string().optional(),
  authorized_by: z.number().int().positive().optional(),
});
export type MmCreateLabResultDto = z.infer<typeof MmCreateLabResultSchema>;

// ─── Vendor Qaytarish DTO (EP-MM-013/076) ──────────────────────────────────

export const MmCreateVendorReturnSchema = z.object({
  receipt_id: z.number().int().positive(),
  vendor_id:  z.number().int().positive(),
  qty:        z.number().positive(),
  amount:     z.number().positive().optional(),
  reason:     z.string().min(1),
});
export type MmCreateVendorReturnDto = z.infer<typeof MmCreateVendorReturnSchema>;

// ─── Reyting Og'irliklari DTO (EP-MM-002/040) ──────────────────────────────

export const MmRatingWeightsSchema = z.object({
  sifat_pct:  z.number().min(0).max(100),
  muddat_pct: z.number().min(0).max(100),
  narx_pct:   z.number().min(0).max(100),
  hujjat_pct: z.number().min(0).max(100),
}).refine(
  d => d.sifat_pct + d.muddat_pct + d.narx_pct + d.hujjat_pct === 100,
  { message: 'Og\'irliklar yig\'indisi 100% bo\'lishi kerak' }
);
export type MmRatingWeightsDto = z.infer<typeof MmRatingWeightsSchema>;
```

---

### QADAM 8 — create-purchase-order.handler.ts: PO Raqam Formati Tuzatish

**Fayl:** `apps/api/src/modules/mm/application/commands/create-purchase-order.handler.ts`

**MUAMMO (33-qator):** `const poNumber = \`PO-${Date.now()}\`;` — epoch ms, XATO format.

**OLDIN (33-34 qatorlar):**
```typescript
const poNumber = `PO-${Date.now()}`;
const po = new PurchaseOrder(0, poNumber, command.supplierId, command.createdBy);
```

**KEYIN:**
```typescript
// EP-MM-005: yil-ketma-ket format PO-2026-000123
// DB ketma-ketligidan keyingi raqamni olish (real saqlangandan keyin yangilanadi)
const year = new Date().getFullYear();
const poNumberDraft = `PO-${year}-TMP`; // saqlashdan keyin real seq bilan yangilanadi
const po = new PurchaseOrder(0, poNumberDraft, command.supplierId, command.createdBy);
```

Keyin `saveResult` muvaffaqiyatli bo'lgandan keyin:
```typescript
const saveResult = await this.mmRepo.savePurchaseOrder(po);
if (!saveResult.ok) {
  return saveResult;
}

// EP-MM-005: saqlashdan keyin real yil-ketma-ket raqam berish
const poId = saveResult.data;
const finalPoNumber = `PO-${year}-${String(poId).padStart(6, '0')}`;
await this.mmRepo.updatePoNumber(poId, finalPoNumber);
```

**E'tibor:** `this.mmRepo.updatePoNumber()` metodi `IMmRepository` va uning Drizzle implementatsiyasiga qo'shilishi kerak. Bu fayl OWNED emas. TO'XTA — egaga flag qil va MM repo interfeys faylini OWNED ro'yxatiga qo'shishni so'ra. Muqobil: handler ichidagi raw SQL UPDATE `db` orqali to'g'ridan chaqirish — bu esa Qoida 15 ni buzadi. Eng to'g'ri yo'l: egasi MM repo fayllarini P22 OWNED ro'yxatiga qo'shishini tasdiqlaydi.

---

### QADAM 9 — mm-purchase-orders.controller.ts: Vendor JOIN Tuzatish

**Fayl:** `apps/api/src/modules/mm/presentation/mm-purchase-orders.controller.ts`

**MUAMMO (B1):** `vendor_name: 'Vendor #${r.vendor_id ?? 0}'` — hardcoded, Q-40 XATO.

`listPos()` metodini to'liq almashtir (48-64 qatorlar):

**OLDIN:**
```typescript
async listPos(){
  try {
    const rows = await db.select().from(mm_purchase_orders)
      .orderBy(desc(mm_purchase_orders.created_at)).limit(50);
    return rows.map((r) => ({
      id: String(r.id),
      po_number: `PO-${String(r.id).padStart(6, '0')}`,
      vendor_name: `Vendor #${r.vendor_id ?? 0}`,   // ← SOXTA
      ...
    }));
  } catch (e) { throw new InternalServerErrorException(String(e)); }
}
```

**KEYIN:**
```typescript
async listPos() {
  try {
    // Real JOIN mm_vendors bilan — Q-40 talabi
    const rows = await db.execute(sql`
      SELECT
        po.id,
        po.po_number,
        po.status,
        po.total_amount,
        po.currency,
        po.original_currency,
        po.order_date,
        po.expected_date,
        po.expected_delivery_date,
        po.notes,
        v.name AS vendor_name,
        v.id   AS vendor_id,
        v.vendor_status
      FROM mm_purchase_orders po
      LEFT JOIN mm_vendors v ON v.id = po.vendor_id
      ORDER BY po.created_at DESC
      LIMIT 50
    `);
    return (rows as { rows: Record<string, unknown>[] }).rows ?? [];
  } catch (e) {
    throw new InternalServerErrorException(String(e));
  }
}
```

Xuddi shunday `getPendingReceipt()` va `getPo()` metodlarini ham JOIN bilan yangilash kerak.

---

### QADAM 10 — mm-dashboard.repository.ts: Runtime Xatolarini Tuzatish

**Fayl:** `apps/api/src/modules/mm/infrastructure/repositories/mm-dashboard.repository.ts`

#### B4 tuzatish (93-qator): `expected_delivery_date` drift

**OLDIN (93-qator):**
```typescript
return exec(sql`... EXTRACT(EPOCH FROM (gr.received_at - po.expected_delivery_date)) ...`);
```

**KEYIN:**
```typescript
// B4: sxemada 'expected_date' ustun, endi 'expected_delivery_date' ham qo'shildi (P2 migration)
// Ikki ustundan HAR BIRI bo'lishi mumkin — COALESCE ishlatamiz
return exec(sql`
  SELECT v.id, v.name,
    COUNT(po.id)::int AS total_orders,
    COUNT(po.id) FILTER (WHERE po.status = 'received' OR po.status = 'closed')::int AS completed_orders,
    COALESCE(SUM(po.total_amount), 0)::numeric(15,2) AS total_spend,
    COALESCE(AVG(
      EXTRACT(EPOCH FROM (gr.receipt_date::timestamptz -
        COALESCE(po.expected_delivery_date, po.expected_date)::timestamptz))
      / ${SECONDS_PER_DAY}
    ), 0)::numeric(5,1) AS avg_delay_days
  FROM mm_vendors v
  LEFT JOIN mm_purchase_orders po ON po.vendor_id = v.id
  LEFT JOIN mm_goods_receipts gr ON gr.purchase_order_id = po.id
  WHERE v.is_active = true
  GROUP BY v.id, v.name
  ORDER BY total_spend DESC
`);
```

#### B5 tuzatish (99-104 qatorlar): `getPriceHistory` noto'g'ri dunyo

**OLDIN (101-qator):**
```typescript
return exec(sql`SELECT pol.unit_price, ... FROM purchase_order_items pol
  JOIN mm_purchase_orders po ON po.id = pol.purchase_order_id ...`);
```

**KEYIN:** `mm_price_history` jadvalidan o'qi (P2 migration talab qilinadi):
```typescript
async getPriceHistory(materialId: number): Promise<Result<Row[]>> {
  try {
    // B5: purchase_order_items (lib/db) → mm_purchase_orders (shared/db) JOIN = noto'g'ri dunyo.
    // P2 migration dan keyin mm_price_history jadvalidan o'qish.
    return exec(sql`
      SELECT
        ph.id,
        ph.unit_price,
        ph.currency,
        ph.receipt_date,
        ph.created_at,
        v.name AS vendor_name,
        mc.name AS material_name
      FROM mm_price_history ph
      LEFT JOIN mm_vendors v ON v.id = ph.vendor_id
      LEFT JOIN material_cards mc ON mc.id = ph.material_id
      WHERE ph.material_id = ${materialId}
      ORDER BY ph.receipt_date DESC
      LIMIT 50
    `);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

**MUHIM:** Bu metod P2 migration ishga tushirilgunga qadar `[]` qaytaradi — bu to'g'ri xulq (jadval mavjud bo'lmasa empty). P2 GATED.

#### Reyting kompozit formulasi qo'shish:

`getVendorRatings()` metodini yangilash (28-33 qatorlar):

```typescript
async getVendorRatings(): Promise<Result<Row[]>> {
  try {
    // EP-MM-002/040: sifat×40% + muddat×30% + narx×20% + hujjat×10%
    // Og'irliklar mm_vendor_rating_weights dan konfiguratsiya qilinadi
    return exec(sql`
      SELECT
        v.id, v.name,
        COALESCE(AVG(vr.quality_score), 0)::numeric(4,2)  AS avg_quality,
        COALESCE(AVG(vr.delivery_score), 0)::numeric(4,2) AS avg_delivery,
        COALESCE(AVG(vr.price_score), 0)::numeric(4,2)    AS avg_price,
        COALESCE(AVG(vr.hujjat_score), 0)::numeric(4,2)   AS avg_hujjat,
        -- Kompozit formula: og'irliklar mm_vendor_rating_weights dan (default 40/30/20/10)
        COALESCE(
          AVG(vr.quality_score)  * (SELECT sifat_pct  / 100.0 FROM mm_vendor_rating_weights ORDER BY id DESC LIMIT 1) +
          AVG(vr.delivery_score) * (SELECT muddat_pct / 100.0 FROM mm_vendor_rating_weights ORDER BY id DESC LIMIT 1) +
          AVG(vr.price_score)    * (SELECT narx_pct   / 100.0 FROM mm_vendor_rating_weights ORDER BY id DESC LIMIT 1) +
          AVG(vr.hujjat_score)   * (SELECT hujjat_pct / 100.0 FROM mm_vendor_rating_weights ORDER BY id DESC LIMIT 1),
          0
        )::numeric(4,2) AS composite_score,
        COUNT(vr.id)::int AS rating_count,
        MAX(vr.rated_at) AS last_rated,
        v.vendor_status
      FROM mm_vendors v
      LEFT JOIN mm_vendor_ratings vr ON vr.vendor_id = v.id
      WHERE v.is_active = true
      GROUP BY v.id, v.name, v.vendor_status
      ORDER BY composite_score DESC
    `);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

---

### QADAM 11 — mm-vendors-pr.repository.ts: Qora-ro'yxat PO Bloki

**Fayl:** `apps/api/src/modules/mm/infrastructure/repositories/mm-vendors-pr.repository.ts`

`createVendor()` metodidan KEYIN yangi metod qo'sh:

```typescript
// EP-MM-039: Qora-ro'yxat tekshiruvi — PO yaratishdan OLDIN chaqirilishi kerak
async checkVendorBlacklist(vendorId: number): Promise<Result<boolean>> {
  try {
    const rows = await runQuery<{ vendor_status: string }>(sql`
      SELECT vendor_status FROM mm_vendors WHERE id = ${vendorId}
    `);
    const status = (rows.rows[0] as { vendor_status: string } | undefined)?.vendor_status;
    if (status === 'blacklisted') {
      return Err('Yetkazuvchi Qora-ro\'yxatda — PO yaratish bloklangan (EP-MM-039)');
    }
    return Ok(true);
  } catch (_e) {
    return Err(String(_e));
  }
}

// Vendor hujjatlarini qo'shish (EP-MM-030)
async createVendorDocument(body: Row): Promise<Result<Row>> {
  try {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mm_vendor_documents (vendor_id, doc_type, doc_number, doc_date, expiry_date, scan_url, notes)
      VALUES (${body.vendor_id}, ${body.doc_type}, ${body.doc_number ?? null},
              ${body.doc_date ?? null}, ${body.expiry_date ?? null},
              ${body.scan_url ?? null}, ${body.notes ?? null})
      RETURNING *
    `);
    return Ok((rows.rows[0] ?? {}) as Row);
  } catch (_e) {
    return Err(String(_e));
  }
}

// Vendor aloqa tarixi qo'shish (EP-MM-085)
async createContactHistory(body: Row): Promise<Result<Row>> {
  try {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mm_vendor_contact_history (vendor_id, contact_date, contacted_by, topic, result)
      VALUES (${body.vendor_id}, ${body.contact_date ?? 'CURRENT_DATE'},
              ${body.contacted_by ?? null}, ${body.topic}, ${body.result ?? null})
      RETURNING *
    `);
    return Ok((rows.rows[0] ?? {}) as Row);
  } catch (_e) {
    return Err(String(_e));
  }
}

// 30-kun expiry muddati yaqinlashgan hujjatlar (CRON uchun)
async getExpiringDocuments(daysAhead: number): Promise<Result<Row[]>> {
  try {
    const rows = await runQuery<Row>(sql`
      SELECT vd.*, v.name AS vendor_name, v.phone AS vendor_phone
      FROM mm_vendor_documents vd
      JOIN mm_vendors v ON v.id = vd.vendor_id
      WHERE vd.expiry_date IS NOT NULL
        AND vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ${daysAhead}
      ORDER BY vd.expiry_date ASC
    `);
    return Ok(rows.rows as Row[]);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

---

### QADAM 12 — mm-goods.service.ts: Lab Natijasi + Vendor Qaytarish

**Fayl:** `apps/api/src/modules/mm/application/mm-goods.service.ts`

Mavjud `postGoodsReceipt` metodidan KEYIN qo'sh:

```typescript
// EP-MM-090: Lab natijasini saqlash + karantin holatini yangilash
async createLabResult(dto: {
  receipt_id: number;
  material_id?: number;
  namlik_pct?: number;
  gramage_gsm?: number;
  qalinlik_mkr?: number;
  material_mark?: string;
  ect_value?: number;
  layer_count?: number;
  lab_decision: 'pending' | 'passed' | 'conditional' | 'rejected';
  restriction_note?: string;
  authorized_by?: number;
}): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    const result = await this.repo.createLabResult(dto);
    // EP-MM-091: Namlik > chegara bo'lsa — avtomatik karantin
    // ⚠️ EGASI QIYMATI KERAK: namlik chegarasi qog'oz turiga qarab har xil (toplajner ≠ mahalliy).
    // Bu qiymat mm_lab_thresholds yoki material_cards.max_namlik_pct jadvalidan o'qilishi kerak.
    // Hozircha placeholder: chegara DB dan olinmaguncha ishga tushirish BLOKLANGAN.
    // Bajaruvchi: dto.material_id bilan material_cards.max_namlik_pct ni JOIN orqali o'qi.
    const namlikChegara = /* TODO: DB dan material turiga qarab */ null; // EGASI QIYMATI KERAK
    if (dto.namlik_pct && namlikChegara !== null && dto.namlik_pct > namlikChegara) {
      await this.repo.updateGoodsReceiptQuarantine(dto.receipt_id, 'quarantined');
    }
    // QC rad qaroriga → qaytarish hujjati tayyorlash uchun signal
    if (dto.lab_decision === 'rejected') {
      await this.repo.updateGoodsReceiptLabStatus(dto.receipt_id, 'rejected');
    }
    return result;
  });
}

// EP-MM-013/076: Vendor qaytarish hujjati yaratish
async createVendorReturn(dto: {
  receipt_id: number;
  vendor_id: number;
  qty: number;
  amount?: number;
  reason: string;
  created_by?: number;
}): Promise<Result<object, AppError>> {
  return safeCall(async () => this.repo.createVendorReturn(dto));
}
```

---

### QADAM 13 — mm-dashboard.service.ts: Yangi Metodlar

**Fayl:** `apps/api/src/modules/mm/application/mm-dashboard.service.ts`

Mavjud metodlarga qo'shish:

```typescript
// EP-MM-002/040: Reyting og'irliklarini yangilash
async updateRatingWeights(dto: {
  sifat_pct: number;
  muddat_pct: number;
  narx_pct: number;
  hujjat_pct: number;
  updated_by?: number;
}): Promise<Result<object, AppError>> {
  return safeCall(async () => this.repo.updateRatingWeights(dto));
}

// EP-MM-025: Tasdiq chegaralarini olish
async getApprovalThresholds(): Promise<Result<object, AppError>> {
  return safeCall(async () => this.repo.getApprovalThresholds());
}

// EP-MM-025: Tasdiq chegaralarini yangilash
async updateApprovalThreshold(id: number, dto: {
  min_amount: number;
  max_amount?: number;
  approver_role: string;
  updated_by?: number;
}): Promise<Result<object, AppError>> {
  return safeCall(async () => this.repo.updateApprovalThreshold(id, dto));
}
```

---

### QADAM 14 — mm-dashboard.repository.ts: Yangi Repository Metodlar

**Fayl:** `apps/api/src/modules/mm/infrastructure/repositories/mm-dashboard.repository.ts`

Mavjud metodlarning OXIRIGA qo'sh (yangi metodlar):

```typescript
// EP-MM-002/040: Reyting og'irliklarini yangilash
async updateRatingWeights(dto: {
  sifat_pct: number;
  muddat_pct: number;
  narx_pct: number;
  hujjat_pct: number;
  updated_by?: number;
}): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      UPDATE mm_vendor_rating_weights
      SET sifat_pct  = ${dto.sifat_pct},
          muddat_pct = ${dto.muddat_pct},
          narx_pct   = ${dto.narx_pct},
          hujjat_pct = ${dto.hujjat_pct},
          updated_by = ${dto.updated_by ?? null},
          updated_at = NOW()
      WHERE id = (SELECT id FROM mm_vendor_rating_weights ORDER BY id LIMIT 1)
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? {}) : Err(r.error);
  } catch (_e) {
    return Err(String(_e));
  }
}

// EP-MM-025: Tasdiq chegaralarini olish
async getApprovalThresholds(): Promise<Result<Row[]>> {
  try {
    return exec(sql`
      SELECT * FROM mm_approval_thresholds ORDER BY min_amount ASC
    `);
  } catch (_e) {
    return Err(String(_e));
  }
}

// EP-MM-025: Tasdiq chegarasini yangilash
async updateApprovalThreshold(id: number, dto: {
  min_amount: number;
  max_amount?: number;
  approver_role: string;
  updated_by?: number;
}): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      UPDATE mm_approval_thresholds
      SET min_amount   = ${dto.min_amount},
          max_amount   = ${dto.max_amount ?? null},
          approver_role = ${dto.approver_role},
          updated_by   = ${dto.updated_by ?? null},
          updated_at   = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? {}) : Err(r.error);
  } catch (_e) {
    return Err(String(_e));
  }
}

// mm_price_history ga yozish — har qabuldan keyin (EP-MM-007/053)
async insertPriceHistory(dto: {
  material_id: number;
  vendor_id?: number;
  unit_price: number;
  currency: string;
  po_id?: number;
  receipt_date?: string;
}): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      INSERT INTO mm_price_history (material_id, vendor_id, unit_price, currency, po_id, receipt_date)
      VALUES (${dto.material_id}, ${dto.vendor_id ?? null}, ${dto.unit_price},
              ${dto.currency}, ${dto.po_id ?? null},
              ${dto.receipt_date ?? new Date().toISOString().slice(0, 10)})
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? {}) : Err(r.error);
  } catch (_e) {
    return Err(String(_e));
  }
}
```

---

### QADAM 15 — mm-dashboard.controller.ts: Yangi Endpoint Yo'naltirish

**Fayl:** `apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts`

Mavjud controller ga qo'shimcha endpointlar (faylning oxiriga):

```typescript
// EP-MM-025: Tasdiq chegaralari
@Get('approval-thresholds')
@Roles('director', 'finance_head', 'super_admin')
async getApprovalThresholds() {
  return unwrapOrThrow(await this.svc.getApprovalThresholds());
}

@Patch('approval-thresholds/:id')
@Roles('director', 'super_admin')
async updateApprovalThreshold(@Param('id') id: string, @Body() body: unknown) {
  const dto = z.object({
    min_amount:    z.number(),
    max_amount:    z.number().optional(),
    approver_role: z.string(),
  }).parse(body);
  return unwrapOrThrow(await this.svc.updateApprovalThreshold(+id, dto));
}

// EP-MM-002/040: Reyting og'irliklari
@Get('rating-weights')
@Roles('director', 'super_admin', 'mm_manager')
async getRatingWeights() {
  // Hozircha to'g'ridan DB dan o'qish (P4 migration talab qilinadi)
  return unwrapOrThrow(await this.svc.getRatingWeights());
}

@Patch('rating-weights')
@Roles('director', 'super_admin')
async updateRatingWeights(@Body() body: unknown) {
  const MmRatingWeightsSchema = z.object({
    sifat_pct:  z.number().min(0).max(100),
    muddat_pct: z.number().min(0).max(100),
    narx_pct:   z.number().min(0).max(100),
    hujjat_pct: z.number().min(0).max(100),
  }).refine(d => d.sifat_pct + d.muddat_pct + d.narx_pct + d.hujjat_pct === 100,
    { message: 'Og\'irliklar yig\'indisi 100% bo\'lishi kerak' });
  const dto = MmRatingWeightsSchema.parse(body);
  return unwrapOrThrow(await this.svc.updateRatingWeights(dto));
}
```

---

### QADAM 16 — drizzle-mm-goods.repo.ts: Lab + Karantin Metodlar

**Fayl:** `apps/api/src/modules/mm/infrastructure/repositories/drizzle-mm-goods.repo.ts`

Mavjud metodlar oxiriga qo'sh:

```typescript
// EP-MM-090: Lab natijasini saqlash
async createLabResult(dto: {
  receipt_id: number;
  material_id?: number;
  namlik_pct?: number;
  gramage_gsm?: number;
  qalinlik_mkr?: number;
  material_mark?: string;
  ect_value?: number;
  layer_count?: number;
  lab_decision: string;
  restriction_note?: string;
  authorized_by?: number;
}): Promise<Row> {
  return execCreateLabResult(dto);
}

// Karantin holatini yangilash (EP-MM-091)
async updateGoodsReceiptQuarantine(receiptId: number, quarantineStatus: string): Promise<void> {
  return execUpdateGoodsReceiptQuarantine(receiptId, quarantineStatus);
}

// Lab holatini yangilash
async updateGoodsReceiptLabStatus(receiptId: number, labStatus: string): Promise<void> {
  return execUpdateGoodsReceiptLabStatus(receiptId, labStatus);
}

// Vendor qaytarish hujjati (EP-MM-013/076)
async createVendorReturn(dto: {
  receipt_id: number;
  vendor_id: number;
  qty: number;
  amount?: number;
  reason: string;
  created_by?: number;
}): Promise<Row> {
  return execCreateVendorReturn(dto);
}
```

**E'tibor:** `execCreateLabResult`, `execUpdateGoodsReceiptQuarantine`, `execUpdateGoodsReceiptLabStatus`, `execCreateVendorReturn` funksiyalari `@common/database/queries-mm-goods` fayliga qo'shilishi kerak. Bu fayl OWNED emas. TO'XTA — egaga flag qil.

---

## 5. DDL (Migratsiya SQL Fayllar) — GATED

4 ta migratsiya fayli 4-qadam dan 5-qadamgacha to'liq yozilgan. Quyidagi cheklash MAJBURIY:

```
⚠️ DDL DARVOZASI (Q-35):
- mm-p1-vendor-card-2026-06-19.sql  → GATED: egasi ruxsati MAJBURIY
- mm-p2-po-pr-fixes-2026-06-19.sql  → GATED: egasi ruxsati MAJBURIY
- mm-p3-qc-lab-quarantine-2026-06-19.sql → GATED: egasi ruxsati MAJBURIY
- mm-p4-rating-transport-2026-06-19.sql → GATED: egasi ruxsati MAJBURIY

Har faylda: -- APPROVED: <egasi ismi> <sana> → PLACEHOLDER holatida qoladi.
Egasi aniq "ha, ishga tushir" demaguncha psql / Drizzle migrate TAQIQ.
```

---

## 6. QABUL MEZONI

Quyidagi barcha bandlar ✅ bo'lmaguncha vazifa YAKUNLANMAGAN:

### 6.1 Kod sifati
- [ ] BE TypeScript: `pnpm --filter @europrint/api run build` — 0 xato
- [ ] FE TypeScript: `pnpm --filter erp-dashboard run typecheck` — 0 xato
- [ ] `bash scripts/reviewer-result-pattern.sh` — 0 FAIL (yangi metodlar Result\<T\> bilan)
- [ ] `bash scripts/reviewer-array-safety.sh` — 0 FAIL
- [ ] `bash scripts/reviewer-as-unknown.sh` — FAIL 3 dan OSHMAYDI (yangi stub qo'shilmaydi)
- [ ] `bash scripts/reviewer-jwt-guard.sh` — PASS (yangi controllerlar himoyalangan)

### 6.2 Qoidalar tekshiruvi
- [ ] Hech qanday `vendor_name: 'Vendor #N'` hardcoded qolmadi
- [ ] `PO-${Date.now()}` epoch format yo'q — `PO-2026-XXXXXX` formatida
- [ ] `expected_delivery_date` drift tuzatildi (B4 xato yo'q)
- [ ] `purchase_order_items` → `mm_price_history` dunyo almashtirish (B5)
- [ ] Mm vehicles Drizzle pgTable sxemasi mavjud

### 6.3 DB-proof (REAL INSERT test)
- [ ] Vendor yaratish: `POST /api/mm/vendors` → DB da ko'rinish: `SELECT * FROM mm_vendors WHERE id = <yangi_id>`
- [ ] Qora-ro'yxat blok: vendor_status = 'blacklisted' → `POST /api/mm/purchase-orders` → 400/422 xato
- [ ] PO yaratish: `POST /api/mm/purchase-orders` → `SELECT po_number FROM mm_purchase_orders WHERE id = <id>` → `PO-2026-XXXXXX` format
- [ ] PO list: `GET /api/mm/purchase-orders` → har bir qatorda `vendor_name` = real nom (NULL emas, 'Vendor #N' emas)
- [ ] Reyting: `GET /api/mm/dashboard/vendor-ratings` → `composite_score` ustuni mavjud va hisoblangan

### 6.4 Migratsiyalar (GATED — egasi tasdiqidan keyin)
- [ ] P1 migration: `\d mm_vendors` → `vendor_type`, `vendor_status`, `stir`, `bank_account`, `mfo`, `is_related_party` ustunlari bor
- [ ] P1 migration: `SELECT * FROM mm_vendor_documents LIMIT 1` → jadval mavjud
- [ ] P2 migration: `\d mm_purchase_orders` → `po_number`, `original_currency`, `mb_rate`, `expected_delivery_date` bor
- [ ] P2 migration: `SELECT * FROM mm_approval_thresholds` → 3 qator (level1/level2/level3)
- [ ] P3 migration: `\d mm_goods_receipts` → `quarantine_status`, `lab_status`, `nakladnoy_number`, `lot_number` bor
- [ ] P3 migration: `SELECT * FROM mm_lab_results LIMIT 1` → jadval mavjud
- [ ] P4 migration: `SELECT * FROM mm_vendor_rating_weights` → 1 qator (40/30/20/10)
- [ ] P4 migration: `SELECT * FROM mm_vehicles LIMIT 1` → jadval mavjud (Drizzle pgTable bilan mos)

### 6.5 Oltin zanjir regressiyasi (yo'qotilmagan)
- [ ] Mavjud endpoint `GET /api/mm/vendors` hali ishlaydi
- [ ] `POST /api/mm/purchase-orders` hali ishlaydi (HITL event yo'qolmagan)
- [ ] `POST /api/mm/goods-receipts/:id/post` → `warehouse_stock` ga kiritish hali ishlaydi
- [ ] `GET /api/mm/dashboard` hali 200 qaytaradi

---

## 7. SELF-VERIFY (Aniq Buyruqlar)

### 7.1 Migratsiyadan oldin (GATED holat)
```bash
# 1. P01/P02 bajarilganligini tekshir
git log --oneline -10 | grep -E "P01|P02|golden-schema"

# 2. Mavjud mm_vendors ustunlarini ko'r
psql "$DATABASE_URL" -c "\d mm_vendors"

# 3. Mavjud mm_purchase_orders ustunlarini ko'r
psql "$DATABASE_URL" -c "\d mm_purchase_orders"

# 4. mm_vendor_ratings jadval bormi?
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_vendor_ratings"

# 5. mm_vehicles bormi?
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_vehicles" 2>&1

# 6. TypeScript tsc tekshiruv
pnpm --filter @europrint/api run build 2>&1 | tail -20
```

### 7.2 Migratsiyadan keyin (egasi ruxsatidan keyin)

```bash
# P1 migration verify
psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/mm-p1-vendor-card-2026-06-19.sql
psql "$DATABASE_URL" -c "\d mm_vendors" | grep -E "vendor_type|vendor_status|stir|bank_account|mfo|is_related_party"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_vendor_documents"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_vendor_contact_history"

# P2 migration verify
psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/mm-p2-po-pr-fixes-2026-06-19.sql
psql "$DATABASE_URL" -c "SELECT * FROM mm_approval_thresholds ORDER BY min_amount"
psql "$DATABASE_URL" -c "\d mm_purchase_orders" | grep -E "po_number|original_currency|mb_rate|expected_delivery_date"

# P3 migration verify
psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/mm-p3-qc-lab-quarantine-2026-06-19.sql
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_lab_results"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_vendor_returns"

# P4 migration verify
psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/mm-p4-rating-transport-2026-06-19.sql
psql "$DATABASE_URL" -c "SELECT * FROM mm_vendor_rating_weights"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_vehicles"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mm_material_vendors"
```

### 7.3 DB-proof: Real INSERT → SELECT

```bash
# Vendor yaratish (REAL)
curl -s -X POST http://localhost:3030/api/mm/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Vendor","vendor_type":"raw_material","vendor_status":"pending","stir":"123456789"}' | jq .

# Yaratilgan vendor ID ni ol va DB dan tekshir
VENDOR_ID=$(psql "$DATABASE_URL" -t -c "SELECT id FROM mm_vendors ORDER BY id DESC LIMIT 1")
psql "$DATABASE_URL" -c "SELECT id, name, vendor_type, vendor_status, stir FROM mm_vendors WHERE id = $VENDOR_ID"

# Qora-ro'yxat blok tekshiruvi
psql "$DATABASE_URL" -c "UPDATE mm_vendors SET vendor_status = 'blacklisted' WHERE id = $VENDOR_ID"
curl -s -X POST http://localhost:3030/api/mm/purchase-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vendor_id\":$VENDOR_ID,\"items\":[]}" | jq .status_code
# → 422/400 bo'lishi KERAK

# PO raqam formati tekshiruvi
PO_ID=$(psql "$DATABASE_URL" -t -c "SELECT id FROM mm_purchase_orders ORDER BY id DESC LIMIT 1")
psql "$DATABASE_URL" -c "SELECT id, po_number FROM mm_purchase_orders WHERE id = $PO_ID"
# → 'PO-2026-XXXXXX' format bo'lishi KERAK (epoch emas)

# Vendor list — vendor_name real nom
curl -s http://localhost:3030/api/mm/purchase-orders \
  -H "Authorization: Bearer $TOKEN" | jq '.[0].vendor_name'
# → null emas, 'Vendor #N' emas — real nom

# Reyting composite score
curl -s http://localhost:3030/api/mm/dashboard/vendor-ratings \
  -H "Authorization: Bearer $TOKEN" | jq '.[0].composite_score'
```

### 7.4 TypeScript tekshiruv

```bash
# Backend tsc
pnpm --filter @europrint/api run build
# → 0 xato bo'lishi KERAK

# Reviewer skriptlar
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-array-safety.sh
bash scripts/reviewer-jwt-guard.sh
```

---

## 8. COMMIT TARTIBI

Har qadam o'z commitiga ega (hech qachon `-A` emas):

```bash
# Qadam 1-2: Vendor kartasi sxema + migration
git add apps/api/src/shared/db/schema-misc-qc.ts
git add apps/api/src/shared/db/migrations/mm-p1-vendor-card-2026-06-19.sql
git commit -m "feat(mm/p22): vendor card schema — vendor_type/status/stir/bank/mfo/related-party + mm_vendor_documents + mm_vendor_contact_history [GATED]"

# Qadam 3 + 6 (bir qismida): PO/PR sxema + migration
git add apps/api/src/shared/db/schema-business-b-1.ts
git add apps/api/src/shared/db/migrations/mm-p2-po-pr-fixes-2026-06-19.sql
git commit -m "feat(mm/p22): PO 7-status + year-seq number + dual-currency + PR 7-fields + approval-thresholds + price-history DDL [GATED]"

# Qadam 4: QC lab migration
git add apps/api/src/shared/db/migrations/mm-p3-qc-lab-quarantine-2026-06-19.sql
git commit -m "feat(mm/p22): QC lab gate — mm_lab_results + mm_vendor_returns + GR quarantine/lab cols [GATED]"

# Qadam 5: Rating + transport migration
git add apps/api/src/shared/db/migrations/mm-p4-rating-transport-2026-06-19.sql
git commit -m "feat(mm/p22): vendor rating weights + mm_vehicles + mm_vehicle_fuel_logs + mm_material_vendors [GATED]"

# Qadam 7-8: DTO + handler
git add apps/api/src/modules/mm/dto/mm.dto.ts
git add apps/api/src/modules/mm/application/commands/create-purchase-order.handler.ts
git commit -m "feat(mm/p22): DTO schemas — vendor-card/doc/contact/lab/return/rating-weights + PO number year-seq fix"

# Qadam 9-11: Controller + repository tuzatishlar
git add apps/api/src/modules/mm/presentation/mm-purchase-orders.controller.ts
git add apps/api/src/modules/mm/infrastructure/repositories/mm-vendors-pr.repository.ts
git add apps/api/src/modules/mm/application/mm-vendors-pr.service.ts
git commit -m "fix(mm/p22): PO vendor JOIN (kill 'Vendor #N' fake), blacklist PO-block, vendor doc/contact-history repo"

# Qadam 10 + 14: Dashboard repository tuzatishlar
git add apps/api/src/modules/mm/infrastructure/repositories/mm-dashboard.repository.ts
git commit -m "fix(mm/p22): dashboard repo — expected_delivery_date drift B4, price-history B5, rating composite formula, approval-thresholds + rating-weights"

# Qadam 12-13: Goods service + dashboard service
git add apps/api/src/modules/mm/application/mm-goods.service.ts
git add apps/api/src/modules/mm/application/mm-dashboard.service.ts
git commit -m "feat(mm/p22): goods service lab-result + vendor-return, dashboard service approval-thresholds + rating-weights"

# Qadam 15-16: Controller + goods repo
git add apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts
git add apps/api/src/modules/mm/infrastructure/repositories/drizzle-mm-goods.repo.ts
git add apps/api/src/modules/mm/presentation/mm-goods.controller.ts
git commit -m "feat(mm/p22): dashboard controller approval-thresholds/rating-weights endpoints, goods repo lab/quarantine/vendor-return"
```

---

## 9. CHETGA QO'YILGAN (DEFERRED — OWNED EMAS)

Quyidagilar vizyon talabida bor, LEKIN shu paket uchun OWNED fayllarda bajarib bo'lmaydi:

| Xususiyat | Sabab | Kim bajaradi |
|-----------|-------|--------------|
| `@common/database/queries-mm-goods.ts` da lab/quarantine/vendor-return funksiyalari | Fayl OWNED emas | P02 yoki MM-backend agent |
| `IMmRepository` interfeys + `updatePoNumber()` metodi | Interfeys fayli OWNED emas | MM domain agent |
| 30-kun expiry CRON module (NestJS ScheduleModule) | `mm.module.ts` OWNED emas | MM module agent |
| GL posting `gl_entries` ga qabulda | `gl_entries` — Finance moduli | P08 (golden-wms-fin-e2e) |
| `@shared/db/index.ts` barrel eksporti yangilash | Fayl OWNED emas | P01/P02 barrel agent |
| Yonilg'i formulalari (EP-MM-062/063/064) | Egasi 10-savol sessiyasi PENDING | Kelajakda alohida paket |
| FE sahifalar (MM vendor hujjatlar, Lab natijasi) | FE fayllar OWNED emas | Alohida FE agent |
| AP aging + payment CRON | Finance moduli | P08/Finance agent |
| Min-ombor → auto-draft PR event | Cron/Event fayl OWNED emas | MM cron agent |
| Tender taqqoslash 5-ustun FE sahifasi | FE OWNED emas | MM FE agent |

---

## 10. XATOLARDAN SAQLANISH (EDGE CASE)

### 10.1 DDL Darvozasi xatosi
```
❌ XATO: migration faylini yozib, darhol psql bilan ishga tushirish
✅ TO'G'RI: fayl yoz → egaga ko'rsat → "APPROVED: Muslimbek 2026-06-19" qo'sh → ishga tushir
```

### 10.2 Vendor holat tekshiruvi (Qora-ro'yxat)
```
❌ XATO: tekshiruvni faqat FE da qilish (bypass mumkin)
✅ TO'G'RI: BE da — createVendor yoki PO yaratishdan OLDIN checkVendorBlacklist()
```

### 10.3 Ikki valyuta saqlash
```
❌ XATO: faqat UZS saqlash (asl valyuta yo'qoladi)
✅ TO'G'RI: original_currency + mb_rate + uzs_amount — uchalasi ham saqlanadi
```

### 10.4 Kompozit reyting formulasi bo'lmagan holat
```
# P4 migration ishga tushirilmagan bo'lsa mm_vendor_rating_weights jadval yo'q
# getVendorRatings() subquery 500 beradi
# Yechim: COALESCE bilan default qiymatlar ishlatish:
COALESCE(
  (SELECT sifat_pct/100.0 FROM mm_vendor_rating_weights LIMIT 1),
  0.40  -- default agar jadval bo'sh/yo'q
)
```

### 10.5 `expected_date` vs `expected_delivery_date` ikkinchi ustun
```
# P2 migration ikkala ustunni saqlaydi (mavjud + yangi)
# B4 tuzatishda COALESCE(expected_delivery_date, expected_date) ishlatiladi
# Bu backwardly compat — mavjud kod buzilmaydi
```

### 10.6 mm_vehicles jadval P4 dan OLDIN ishlashi
```
# P4 migration ishga tushirilmagunga qadar mm_vehicles yo'q
# dashboard.repository.ts: getFleetVehicles() try-catch ichida — xato bo'lsa Err qaytaradi
# Bu to'g'ri xulq: server 500 bermaydi, faqat bo'sh ro'yxat
```

---

## 11. OLTIN ZANJIR MOS KELISHI

Bu paket quyidagi oltin zanjir bo'g'inlariga ta'sir qiladi:

```
MM Ta'minot → (vendor qabuli → warehouse_stock) → WMS
MM Ta'minot → (PO receipt → gl_entries) → Finance [P08 bajaradi]
MM Ta'minot → (lab rejected → vendor return) → Ombor chiqim
MM Ta'minot → (min-stock → auto PR) → PP MRP [deferred]
```

**Regressiya tekshiruvi:**
```bash
# WMS ga kirim hali ishlaydi
curl -X POST http://localhost:3030/api/mm/goods-receipts/$GR_ID/post \
  -H "Authorization: Bearer $TOKEN" | jq .posted
# → true bo'lishi KERAK

# warehouse_stock yangilanganmi?
psql "$DATABASE_URL" -c "SELECT material_id, quantity FROM warehouse_stock ORDER BY updated_at DESC LIMIT 5"
```

---

> **Holat hisoboti (Har qadam oxirida egaga Uzbekcha yoz):**
>
> Qadam X tugadi:
> - Nima qilindi: [aniq fayl + o'zgarish]
> - DB-proof: [SQL + natija]
> - Tsc: [0 xato / N xato]
> - Keyingi qadam: [ruxsat so'rash / kutish]
> - Deferred: [nima keyinga qoldirildi + sabab]
