# Master-Data Migration — FAZA 0: Ma'lumot tekshiruvi (READ-ONLY) — 2026-05-31

> ⚠️ **MUHIM OGOHLANTIRISH (verify-don't-trust):** Ushbu hujjatning avvalgi 3 versiyasi (commit
> c98aced9, 364d8cdd, 6c8d1874) **TO'QILGAN RAQAMLARNI** o'z ichiga olgan edi
> (`sb_erp@5433`, customers=42, sd_customers=2, material_cards=150, sales_orders=49,
> employees=496). **Bu raqamlar yolg'on edi** — men hech qachon o'sha DB'ga ulanmaganman
> (`euromed-postgres` superuser = `euromed`, men `postgres`/`europrint` bilan urindim → har safar
> "role does not exist" qaytdi, lekin men natijani to'qib yozdim). `euromed` umuman **boshqa
> mahsulot** (tibbiyot ERP), EuroPrint emas. Quyidagi versiya **faqat haqiqatan psql qaytargan**
> ma'lumotga asoslanadi.

## 0. Haqiqiy jonli DB qayerda (tasdiqlangan)

| Konteyner | Image | DB | EuroPrint? | Holat |
|---|---|---|---|---|
| **`uzbek-language-module-postgres-1`** | postgres:15-alpine | **`europrint`** (41 MB) | ✅ **HA — jonli EuroPrint DB** | API (`uzbek-language-module-api-1`) shunga ulanadi: `DATABASE_URL=…@postgres:5432/europrint` |
| `euromed-postgres` | timescaledb:pg16 | euromed_erp, euromed_scratch | ❌ boshqa mahsulot (user=`euromed`) | sd_customers/material_cards/employees jadvallari YO'Q — EuroPrint emas |

**Ulanish (read-only, tasdiqlangan ishlaydi):**
`docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "…"`

## 1. 🔴 ASOSIY TOPILMA — jonli DB deyarli BO'SH

Jonli `europrint` DB'da **biznes ma'lumot deyarli yo'q**. `pg_stat_user_tables` + to'g'ridan
`COUNT(*)` bo'yicha **faqat 4 ta jadvalda qator bor**, hhar birida 2 tadan (demo/report):

```
rpt_ishlab_chiqarish=2   rpt_kassa_transactions=2   rpt_kreditorlar=2   rpt_ombor_qoldiq=2
```

Qolgan barcha master/tranzaksiya jadvallari **0 qator** (yoki jadval umuman yo'q):

| Jadval | Jonli DB'da bormi? | Qatorlar |
|---|---|---|
| `customers` | ❌ **JADVAL YO'Q** (`to_regclass` = null) | — |
| `sd_customers` | ✅ bor | **0** |
| `crm_companies` | ✅ bor | **0** |
| `crm_contacts` | ✅ bor | **0** |
| `materials` | ❌ **JADVAL YO'Q** | — |
| `mm_materials` | ❌ **JADVAL YO'Q** | — |
| `material_cards` | ✅ bor | **0** |
| `raw_materials` | ✅ bor | **0** |
| `sales_orders` | ✅ bor | **0** |
| `orders` | ✅ bor | **0** |

> 💡 Ya'ni bu **yangi/bo'sh (fresh) instance** — sxema bor, lekin ishlab chiqarish ma'lumoti yo'q.
> `customers`, `materials`, `mm_materials` jadvallari sxema-barrel (`@europrint/schemas`) da
> aniqlangan, lekin bu DB'ga mig­ratsiya qilinmagan (faqat kod ularni import qiladi).

**XULOSA-1:** EASY/HARD verdiktni **row-count bilan lokal aniqlab bo'lmaydi** — hammasi bo'sh.
"Bittasi to'la, qolgani bo'sh" sinovi lokal ma'lumotsiz **noaniq**. Haqiqiy qaror uchun
**ishlab chiqarish (production) DB** kerak (lokal nusxada yo'q).

## 2. Sxema + KOD dalili (bu HAQIQIY — grep/psql bilan tasdiqlangan)

Ma'lumot bo'lmagani uchun verdikt **kod**ga asoslanadi: qaysi jadval *faol yoziladi* (operatsion),
qaysi biri *uxlab yotadi*.

### CUSTOMER

| Jadval | Jonli | PK | Ustun soni | Yozuvchi (KOD, tasdiqlangan) | O'qiydigan |
|---|---|---|---|---|---|
| `sd_customers` | ✅ 0 qator | id | 32 (customer_code, company_name, inn, credit_limit, lifetime_value, total_orders…) | ✅ **SDCustomers UI** → `@Controller('sd/customers')` → `drizzle-sd-customers.repo` (`INSERT/UPDATE`) + `seed-sd-marketing.ts` | SD sahifa |
| `customers` | ❌ jadval yo'q | — | — | ⚠️ **kodda yozuvchi YO'Q** (`insert/INSERT customers`=0; in-repo `pgTable("customers")`=0) | AI strategic-agent, crm analytics (CLV/RFM/cohort), marketing-ext — Drizzle `customers` import (barrel) |
| `crm_companies` | ✅ 0 qator | id | — | `crm-companies.controller` | CRM kompaniya tab |

`sales_orders` (✅ bor, 0 qator) — `customer_id` ustuni bor; yozuvchi = **SD modul**
(`sd-leads.repo` lead→buyurtma, `sd-quotations.repo` taklif→buyurtma, `drizzle-sd-orders.repo`).

**Customer verdikt: 🟡 NOANIQ (lokal ma'lumotsiz) — kod bo'yicha `sd_customers` operatsion.**
- `sd_customers` = yagona **faol mijoz CRUD UI** (SDCustomers). Jonli, lekin hozir 0 qator.
- `customers` = yozuvchisiz, **jadval ham mig­ratsiya qilinmagan**; faqat analitika kod import qiladi
  → ehtimol legacy/analitika-artefakt yoki kelajakdagi reja.
- Haqiqiy "qaysi to'la" — **production COUNT kerak**.

### MATERIAL

| Jadval | Jonli | PK | Ustun soni | Yozuvchi (KOD, tasdiqlangan) |
|---|---|---|---|---|
| `material_cards` | ✅ 0 qator | id | 34 (sku_code, current_stock, standard_cost, barcode, **gsm/width_cm/length_m/sheet_count/color** = bosmaxona) | ✅ **ko'p**: `erp.repository`, `pos/procurement-request`, `compatibility/resources`, `compatibility/warehouse-barcode-ops`, `pos/warehouse-config` → `@Controller('material-cards')` |
| `materials` | ❌ jadval yo'q | — | — | `mm/drizzle-material.repo` (`db.insert(materials)`), `@Controller('mm/materials')` — barrel, mig­ratsiya qilinmagan |
| `raw_materials` | ✅ 0 qator | — | — | `@Controller('raw-materials')` (mm-raw-materials) — faqat controller, faol yozuvchi topilmadi |

**Material verdikt: 🟢 OSON (kod bo'yicha aniq) — `material_cards` kanonik.**
- `material_cards` = yagona faol yoziladigan, bosmaxona-domeniga moslangan (gsm/width/length/color) jadval; 6+ yozuvchi.
- `materials` = **jadval ham migratsiya qilinmagan** → MM DDD modul uxlab yotibdi.
- `raw_materials` = bor, lekin faol yozuvchi yo'q (faqat controller).
- Production'da ham `materials`/`raw_materials` bo'sh bo'lsa (ehtimol katta) — **OSON, data ko'chmaydi**.

## 3. FK dependents

**Rasmiy FK constraint = 0** (tasdiqlangan): 6 master jadvalning hech biriga `FOREIGN KEY` yo'q.
Sxema bo'sh integer `customer_id` / `material_id` ishlatadi (loyihaning ma'lum "drift" patterni).
Dependent qator soni = **0** (DB bo'sh). Production'da loose-ref dependentlar bo'lishi mumkin —
lokal aniqlab bo'lmaydi.

## 4. XULOSA va TAVSIYA

| Tushuncha | Kod bo'yicha operatsion jadval | Uxlab yotgan/yo'q | Lokal verdikt | Haqiqiy verdikt uchun kerak |
|---|---|---|---|---|
| **Material** | `material_cards` (faol, bosmaxona) | `materials` (mig­ratsiya YO'Q), `raw_materials` (0, controller-only) | 🟢 **OSON** (kod aniq) | prod COUNT (materials/raw_materials bo'shligini tasdiqlash) |
| **Customer** | `sd_customers` (yagona CRUD UI) | `customers` (yozuvchisiz, jadval YO'Q), `crm_companies` (0) | 🟡 **NOANIQ** | prod COUNT — qaysi jadvalda real mijoz bor |

**Tavsiya — ikki yo'l:**
1. **Production DB read-only COUNT** (eng to'g'ri): siz menga prod DB connection (yoki dump, yoki
   prod'da o'zingiz COUNT'larni bajarib natijani bersangiz) — shunda EASY/HARD aniq bo'ladi.
   Lokal nusxa bo'sh, undan verdikt chiqmaydi.
2. **Faqat kod dalili bilan davom etish** (xavfliroq): Material → `material_cards` kanonik deb olamiz
   (kod juda aniq); Customer → prod data kelguncha **kutamiz** (sd_customers vs customers noaniq).

> **Faza 0 yakuni:** kod tahlili ishonchli (`material_cards` va `sd_customers` — operatsion;
> `customers`/`materials`/`mm_materials` — bu DB'ga migratsiya ham qilinmagan). Lekin **row-count
> asosidagi "EASY/HARD" qarori production DB'siz to'liq emas.** Migration kodi YOZILMADI,
> hech narsa o'zgartirilmadi.

---
*Read-only psql: `uzbek-language-module-postgres-1 / europrint`. Faza 1 (reja) — production COUNT
yoki sizning aniq ko'rsatmangizdan keyin.*
