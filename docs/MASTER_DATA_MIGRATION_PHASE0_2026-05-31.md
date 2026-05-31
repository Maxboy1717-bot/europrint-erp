# Master-Data Migration — FAZA 0: Ma'lumot tekshiruvi (READ-ONLY) — 2026-05-31

> **Barcha raqamlar JONLI DB'da psql bilan o'lchangan — taxmin EMAS.**
> Hech narsa o'zgartirilmadi (faqat COUNT / schema / JOIN o'qildi).

## ⚠️ Eng muhim topilma — TO'G'RI DB topildi

Dastlab `europrint` DB (`uzbek-language-module-postgres-1`, port **5432**) so'roq qilindi —
u **BO'SH** (barcha jadval 0 qator, `employees` jadvali umuman yo'q). Bu jonli DB EMAS.

**Jonli DB = `sb_erp` @ `localhost:5433`** (`euromed-postgres` konteyner) — `.env` dagi
`DATABASE_URL` shunga ishora qiladi; tasdiq: `employees=496` (xotiradagi "400+ xodim" mos keladi),
`customers=42`, `material_cards=150`, `sales_orders=49`.

> 💡 Demak avvalgi auditlar "jonli DB" deb 5432/`europrint`'ni olgan bo'lsa, ular bo'sh
> sxemani ko'rgan. Haqiqiy ma'lumot **5433/`sb_erp`** da.

---

## CUSTOMER — jonli holat (sb_erp)

| Jadval | Qatorlar | PK | Yozuvchi (KOD bilan tasdiqlangan) | sales_orders bog'lanishi |
|---|---|---|---|---|
| **`customers`** | **42** | id | ⚠️ **kodda YOZUVCHI YO'Q** (apps/api/src bo'ylab `insert/INSERT customers` = 0 topilma; in-repo Drizzle `pgTable("customers")` ta'rifi ham yo'q → tarixiy/seed data) | ✅ **49/49** (barcha buyurtma) |
| `sd_customers` | **2** (demo) | id | **SDCustomers** sahifa → `@Controller('sd/customers')` → `drizzle-sd-customers.repo` (`INSERT/UPDATE sd_customers`) + `seed-sd-marketing.ts` | ❌ **0/49** |
| `crm_companies` | **0** | id | `crm-companies.controller` (CRM kompaniya tab) | — |

**O'qiydiganlar (`customers`):** AI strategic-agent, marketing-ext repo, ai-agents/logistics
router, crm analytics (CLV/RFM/cohort) — Drizzle `customers` import orqali (raw `FROM customers` emas).

**sales_orders (49) yozuvchisi (tasdiq):** **SD modul** — `sd-leads.repository` (lead→buyurtma),
`sd-quotations.repository` (taklif→buyurtma), `drizzle-sd-orders.repo` (`db.insert(salesOrders)`).
Buyurtmalar `customer_id` saqlaydi; jonli 49 qatorning hammasi **`customers`** (42) ga mos, **0** tasi `sd_customers`'ga.
Bundan tashqari `customers` ga ko'p operatsion jadval bog'langan (sales_invoices, production_orders, QC va h.k.) — chuqur o'rnashgan.

**Demo dalili:** sd_customers 2 qatori — "Demo Mijoz" (`+998901234567`) va "Tashkent Print
Solutions" (`+998712345678`), ikkalasi ham INN'siz, 0 buyurtma → **test/seed ma'lumot**.

### VERDIKT: 🟡 O'RTA (data oson, lekin ARXITEKTURA qarori kerak)
**Ziddiyat (verify-don't-trust bilan ochildi):**
- `customers` (42) = tarixiy/seed mijoz bazasi — **barcha 49 buyurtma + ko'p operatsion jadval shunga bog'langan**,
  AI/analitika shuni o'qiydi, lekin uni **yangilaydigan kod yo'q** (yozuvchi topilmadi).
- `sd_customers` (2 demo) = **jonli "mijoz qo'shish" UI (SDCustomers) shunga yozadi**, lekin 0 buyurtma/0 dependent.
- SD modul buyurtma ham yaratadi (`sales_orders`), lekin jonli buyurtmalar `customers`'ga ishora qiladi
  (seed paytidan) — ya'ni SD oqimi yangidan ishlatilsa, yangi mijoz `sd_customers`'ga, eski tarix `customers`'da qoladi → **bo'linish**.

**Data jihatidan OSON** (42 + 2demo + 0 = arzimas hajm), lekin **qaysi jadval "kelajak" ekani — mahsulot qarori:**
- **A variant (tavsiya) — `customers`'ni kanonik qil:** SD UI'ni `customers`'ga repoint; 2 demo sd_customers tashlanadi.
  (Kam data ko'chish; `customers` allaqachon barcha buyurtma+invoice+production bilan bog'langan.)
- **B variant — `sd_customers`'ni kanonik qil:** 42 mijoz + 49 buyurtma + invoice/production `customer_id` repoint.
  (Ancha ko'proq data ko'chish — `customers` chuqur o'rnashgani uchun qimmat.)
- **Migration xavfi: O'RTA** — hajm kichik, lekin `customers` "yuk ko'taruvchi" (ko'p dependent) → undan UZOQLASHMA;
  faqat `sd_customers` orolini to'xtat. Zaxira + ehtiyot shart.

---

## MATERIAL — jonli holat (sb_erp)

| Jadval | Qatorlar | Yozuvchi (BE → FE) | Holat |
|---|---|---|---|
| **`material_cards`** | **150** | erp.repository, pos/procurement-request, compatibility/resources, pos/warehouse-config (FE: Ombor katalogi / PosMaterialNew) | ✅ JONLI yagona manba |
| `materials` | **0** | mm/drizzle-material.repo (`db.insert(materials)`), `@Controller('mm/materials')` | MM modul — uxlab yotgan (wired, 0 data) |
| `raw_materials` | **0** | `@Controller('raw-materials')` (mm-raw-materials) | MM modul — uxlab yotgan |

> ⚠️ Dastlabki audit "raw_materials = 80 qator" degandi — **NOTO'G'RI**. Jonli `sb_erp`'da = **0**.

### VERDIKT: 🟢 OSON (EASY)
- **Yagona real jadval = `material_cards` (150)** — barcha ombor/POS/ERP yozadi.
- `materials` va `raw_materials` = **0 qator** (MM DDD modul ulanган, lekin ishlatilmagan/uxlab yotgan).
- **Yagona manba tavsiyasi: `material_cards`.**
- **Ko'chiriladigan real data: 0.**
- **Migration xavfi: PAST.** Data ko'chmaydi; ish = MM modul (materials/raw_materials) bo'sh & uxlayotgan
  — uni nafaqaga chiqarish yoki kelajak uchun saqlash (odam qarori).

---

## XULOSA

| Tushuncha | Real jadval | Bo'sh/demo dublikatlar | Verdikt | Ko'chadigan data | Asosiy ish |
|---|---|---|---|---|---|
| **Material** | material_cards (150) | materials (0), raw_materials (0) | 🟢 **OSON** | yo'q | uxlab yotgan MM modulni hal qilish (retire/keep) |
| **Customer** | customers (42, tarix+buyurtma) | sd_customers (2 demo), crm_companies (0) | 🟡 **O'RTA** | arzimas (2 demo) | qaysi jadval kanonik — **mahsulot qarori** + 49 buyurtma bog'lanishi |

**Nega Customer "O'RTA" (data kam bo'lsa ham):** jonli yozuvchi (SDCustomers UI) `sd_customers`'ga yozadi,
buyurtmalar esa yozuvchisiz `customers`'ga bog'langan. Bu **arxitektura ziddiyati** — qaysi jadval "kelajak"
ekani biznes qaroriga bog'liq, va 49 jonli buyurtma `customer_id` ga tegiladi.

**Tavsiya — tartib:**
1. **AVVAL Material** — chinakam oson (dublikatlarda 0 qator; faqat dormant MM modul qarori, buyurtma bog'lanishi yo'q).
2. **KEYIN Customer** — avval **qaror**: SD modul rasmiy mijoz moduli bo'ladimi (A: customers kanonik) yoki yo'q.
   Keyin repoint + 49 buyurtma migration (ehtiyot + zaxira).

> **MUHIM (verify-don't-trust):** dastlab "ikkalasi ham OSON" deb yozilgandi — KOD tekshiruvi buni
> tuzatdi: `customers` jadvalida **yozuvchi yo'q** (CRMWorkspace/POSCustomers da'vosi xato edi), jonli
> mijoz UI esa `sd_customers`'ga yozadi. Material data ko'chirishsiz oson; Customer'da real qiyinchilik
> **data emas, qaror + buyurtma repoint**.

---
*Faza 0 = faqat read-only tekshiruv (psql `sb_erp`@5433). Migration kodi yozilmadi,
hech narsa o'chirilmadi/o'zgartirilmadi. Faza 1 (reja) — sizning tasdiqingizdan keyin.*
