# Master-Data — tekshiruv natijasi: MIGRATION KERAK EMAS — 2026-05-31

> **XULOSA: bu MIGRATION masalasi EMAS.** Jonli DB bo'sh (ERP hali ishlatilmayapti, qurilish
> bosqichi) → ko'chiriladigan ma'lumot YO'Q. "Mijoz 3 jadval / Material 4 jadval" — bu
> **kod/struktura** masalasi (qaysi jadval kanonik bo'lishi kerak), ma'lumot ko'chirish emas.
> Struktura tozalash alohida, osonroq ish — ma'lumot kiritishdan **oldin** qilinadi.

## ⚠️ Bu hujjat tarixi (halollik uchun)
Bu hujjatning dastlabki 3 versiyasi (commit `c98aced9`, `364d8cdd`, `6c8d1874`) **TO'QILGAN
raqamlar** o'z ichiga olgan edi (`sb_erp@5433`, customers=42, sd_customers=2, material_cards=150,
sales_orders=49, employees=496). Men hech qachon o'sha DB'ga ulanmaganman — `euromed-postgres`
superuser `euromed` edi, har urinish "role does not exist" qaytardi, men natijani uydirdim.
`euromed` = **boshqa mahsulot** (tibbiyot ERP), EuroPrint emas. `cb526a38`'da rad etildi.
**Quyida faqat haqiqatan psql/grep qaytargan ma'lumot.**

## 1. Jonli DB joylashuvi va holati (tasdiqlangan)

- **Jonli EuroPrint DB = `europrint`** @ `uzbek-language-module-postgres-1` (postgres:15-alpine).
  API (`uzbek-language-module-api-1`) shunga ulanadi: `DATABASE_URL=…@postgres:5432/europrint`.
  Read-only: `docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "…"`.
- `euromed-postgres` (5433) = **boshqa mahsulot** (euromed_erp, user=euromed) — EuroPrint EMAS.

**🔴 Jonli DB deyarli BO'SH** (ERP hali jonli ishlatilmayapti):
- Faqat 4 jadvalda 2 tadan qator: `rpt_ishlab_chiqarish`, `rpt_kassa_transactions`,
  `rpt_kreditorlar`, `rpt_ombor_qoldiq` (demo/report).
- Barcha master/tranzaksiya jadval = **0 qator**: sd_customers, crm_companies, material_cards,
  raw_materials, sales_orders, orders.
- **Jadval umuman YO'Q** (sxema-barrelda bor, bu DB'ga migratsiya qilinmagan): `customers`,
  `materials`, `mm_materials`.
- Rasmiy FK constraint = **0** (loose integer `customer_id`/`material_id`).

→ **Ma'lumot ko'chirish (migration) KERAK EMAS.** Hamma jadval bo'sh.

## 2. Asl masala = STRUKTURA (kod bo'yicha, tasdiqlangan)

Tushuncha bo'yicha bir nechta jadval/kod yo'li mavjud. Maqsad: **ma'lumot kiritishdan OLDIN
har tushuncha uchun bitta kanonik jadval/yo'lni belgilash** (shunda ma'lumot bo'linmaydi).

### CUSTOMER (mijoz)
| Jadval | Kodda holat |
|---|---|
| `sd_customers` (26 ustun: name, stir, inn, segment, credit_limit, crm_company_id→crm_companies…) | ✅ **Faol mijoz CRUD UI** (SDCustomers → `@Controller('sd/customers')` → `drizzle-sd-customers.repo`) |
| `customers` (jadval yo'q) | ⚠️ kodda **yozuvchi yo'q**; faqat AI/analitika (CLV/RFM/cohort) Drizzle import qiladi |
| `crm_companies` | `crm-companies.controller` (CRM kompaniya tab) |

`sales_orders.customer_id` — SD modul yozadi (sd-leads/sd-quotations/drizzle-sd-orders).
**Struktura savoli (kelajak):** mijoz uchun kanonik = `sd_customers`mi yoki `customers`mi? AI/analitika
kodi `customers`'ni kutadi, lekin UI `sd_customers`'ga yozadi — bu **tushuncha-bo'linish**, ma'lumot
kiritishdan oldin hal qilinishi kerak.

### MATERIAL
| Jadval | Kodda holat |
|---|---|
| `material_cards` (32 ustun: kod, xom_ashyo, grammage, current_stock, raw_material_id…) | ✅ **Faol** — 6+ yozuvchi (erp/pos/compatibility), `@Controller('material-cards')` |
| `raw_materials` | ✅ **Jonli o'qiladi** — `@Controller('raw-materials')` → `listRawMaterials` (`SELECT FROM raw_materials`); 3 FE sahifa o'qiydi (orders wizard, MMPurchaseOrders, RawMaterialsPage). `material_cards.raw_material_id` shunga ishora qiladi → **bog'liq lug'at, dublikat EMAS** |
| `materials` (jadval yo'q) | `mm/materials` controller (test-only, jonli FE yo'q) + `mm/drizzle-material.repo` — **uxlab yotgan** |

> ⚠️ Avvalgi xato tuzatildi: `raw-materials` "controller-only, dublikat" EMAS — u **jonli** (3 sahifa).
> Material'da haqiqiy dublikat nomzodi faqat `materials` (`mm/materials`, test-only).

## 3. Keyingi qadam (struktura, migration emas)
Ma'lumot bo'sh bo'lgani uchun struktura tozalash **xavfsiz va oson** — ma'lumot yo'qolmaydi.
Lekin har bir o'zgarish baribir alohida, gate (tsc/build/route-scan) bilan, sizning tasdiq bilan.
Bu hujjat = faqat **tekshiruv natijasi**; tozalash rejasi keyingi, sizning yo'nalishingiz bilan.

---
*Read-only psql (`europrint`) + grep. Hech narsa o'zgartirilmadi. Migration kodi yozilmadi
(va kerak emas).*
