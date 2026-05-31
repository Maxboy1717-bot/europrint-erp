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

| Jadval | Qatorlar | PK | Yozuvchi (FE sahifa → endpoint) | sales_orders bog'lanishi |
|---|---|---|---|---|
| **`customers`** | **42** | id | **CRMWorkspace** (`POST /api/crm/customers`), **POSCustomers** (`POST /api/pos/customers`, telegram_chat_id), legacy buyurtma quick-add (`INSERT INTO customers`) | ✅ **49/49** (barcha buyurtma) |
| `sd_customers` | **2** (demo) | id | **SDCustomers** (`@Controller('sd-customers')`) + `seed-sd-marketing.ts` | ❌ **0/49** |
| `crm_companies` | **0** | id | CRMWorkspace (kompaniya tab) | — |

**Demo dalili:** sd_customers 2 qatori — "Demo Mijoz" (`+998901234567`) va "Tashkent Print
Solutions" (`+998712345678`), ikkalasi ham INN'siz, 0 buyurtma → **test/seed ma'lumot**, real mijoz emas.

**O'qiydiganlar (`customers`):** AI strategic-agent, marketing-ext repo, ai-agents/logistics
router, crm analytics — ya'ni butun AI/analitika qatlami `customers`'ni ko'radi.

### VERDIKT: 🟢 OSON (EASY)
- **Yagona real jadval = `customers` (42)** — barcha 49 buyurtma, 3 yozuvchi (CRM+POS+legacy), butun AI/analitika o'qiydi.
- `sd_customers` = faqat **2 demo qator**, 0 buyurtma, izolyatsiya (alohida SD sahifa yozadi). `crm_companies` = **0**.
- **Yagona manba tavsiyasi: `customers`.**
- **Ko'chiriladigan real data: 0** (sd_customers'dagi 2 qator demo — tashlanadi yoki e'tiborsiz).
- **Migration xavfi: PAST.** ⚠️ ASOSIY ISH = data ko'chirish EMAS, balki **takror-divergensiyani
  to'xtatish**: hozir 2 ta "mijoz qo'shish" UI bor — CRMWorkspace/POSCustomers → `customers` (to'g'ri),
  SDCustomers → `sd_customers` (izolyatsiya orol). SDCustomers'ni `customers`'ga yo'naltirish yoki
  nafaqaga chiqarish kerak (aks holda yangi mijozlar yana ikki joyga bo'linadi).

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

## XULOSA — ikkalasi ham OSON

| Tushuncha | Real jadval | Bo'sh/demo dublikatlar | Verdikt | Ko'chadigan data | Asosiy ish |
|---|---|---|---|---|---|
| **Material** | material_cards (150) | materials (0), raw_materials (0) | 🟢 OSON | yo'q | uxlab yotgan MM modulni hal qilish |
| **Customer** | customers (42) | sd_customers (2 demo), crm_companies (0) | 🟢 OSON | yo'q (2 demo) | SDCustomers yozuvchisini yo'naltirish/nafaqa |

**Tavsiya — tartib:**
1. **AVVAL Material** — eng oson (dublikatlarda 0 qator; faqat dormant MM modul qarori).
2. **KEYIN Customer** — deyarli oson (2 demo qator), lekin SDCustomers "mijoz qo'shish" sahifasi
   jonli yozuvchi — uni `customers`'ga repoint qilish (yoki retire) divergensiya qaytmasligi uchun.

> **MUHIM:** "Oson" = data jihatidan. Ikkala holatda ham real qiyinchilik **data ko'chirish emas**,
> balki **takror-yozuvchini bartaraf etish** (SDCustomers sahifa, MM modul) — aks holda dublikat jadval
> kelajakda yana to'ladi. Bu kod o'zgarishi (FE repoint / modul retire), migration emas.

---
*Faza 0 = faqat read-only tekshiruv (psql `sb_erp`@5433). Migration kodi yozilmadi,
hech narsa o'chirilmadi/o'zgartirilmadi. Faza 1 (reja) — sizning tasdiqingizdan keyin.*
