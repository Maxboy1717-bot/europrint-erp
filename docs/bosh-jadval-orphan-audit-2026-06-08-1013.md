# Bo'sh jadval va Orphan sxema tekshiruvi

**Sana/vaqt:** 2026-06-08, 10:13
**Tekshiruvchi:** Tahlilchi agent (faqat o'qish — DB'ga faqat SELECT, hech narsa o'zgartirilmadi)
**Baza:** `europrint` (jonli, read-only tranzaksiya ichida o'qildi)

---

## ⚠️ Muhim eslatma — o'lchov usuli

Topshiriqdagi tayyor so'rov (pg "estimate" — taxminiy raqam) bu bazada **ishlamadi**:
butun 968 jadvalni "bo'sh" deb ko'rsatdi. Sababi — PostgreSQL statistikasi hali
yig'ilmagan (`n_live_tup`=0 hamma joyda, 941 jadvalda `reltuples`=-1, ya'ni hech qachon
"analyze" qilinmagan). Shu sabab men **aniq `COUNT(*)`** bilan har bir jadvalni
bittalab sanadim (read-only tranzaksiya ichida). Quyidagi raqamlar — taxmin emas, aniq.

---

## 1. HOZIRGI RAQAMLAR (aniq sanoq)

| Ko'rsatkich | Soni |
|---|---|
| **Jami jadval** (base table) | **968** |
| **Bo'sh jadval** (0 qator) | **830** |
| **To'la jadval** (data bor) | **138** |
| Drizzle-only orphaned (qat'iy: kodda bor, jonli **base table** yo'q) | **55** |
| └ shundan jonli DB'da **VIEW** sifatida mavjud (aslida yo'qolmagan) | **53** |
| └ **chinakam yo'q** (na jadval, na view) | **⭐ 2** |
| Dublikat `pgTable` (bir nom kodda 2+ marta ta'riflangan) | **11** |

> Bo'sh ulush: 830/968 = **~86%** jadval hali bo'sh. Bu tizim hali **qurilish bosqichida**
> ekanini ko'rsatadi (data ko'chirish emas, kod/struktura qurilmoqda — bu memory bilan mos).

---

## 2. ⭐ O'ZGARISH (delta)

`docs/` papkada **oldingi `bosh-jadval-orphan-audit-*.md` hisobot topilmadi.**

➡️ **Bu — BIRINCHI tekshiruv (keyingi solishtirishlar uchun bazaviy nuqta).**

Keyingi tekshiruv bu raqamlar bilan solishtiriladi:
- Bo'sh jadval: **830 / 968**
- To'la jadval: **138**
- Drizzle-only orphaned (qat'iy): **55** (chinakam yo'q: **2**)
- Dublikat pgTable: **11**

---

## 3. To'la jadvallar (data bor) — eng kattalari

Tizim allaqachon ishlatilayotgan joylar (yaxshi belgi). Eng ko'p qatorlilar:

| Jadval | Qatorlar |
|---|---|
| audit_logs | 9 374 |
| agents_audit_log | 4 794 |
| daily_reports | 3 150 |
| position_permissions | 1 380 |
| org_departments | 142 |
| warehouse_bins | 126 |
| org_functions | 97 |
| positions | 96 |
| hr_leave_balances | 90 |
| hr_onboarding_milestones | 90 |

Boshqa muhim to'la jadvallar (qisman): users(31), employees(30), material_cards(21),
warehouse_stock(25), sales_orders(12), sd_customers(9), accounts(42), vendors(15),
crm_leads(5), kanban_cards(2), entries(1 — GL bosh kitob), stock_ledger(1).

Jami **138** jadvalda data bor. (Ko'pchiligida 1–30 qator — demo/boshlang'ich data.)

---

## 4. Drizzle-only "orphaned" — chuqurroq tahlil

Qat'iy hisobda **55** nom kodda `pgTable` bilan ta'riflangan, lekin jonli DB'da
**base table** sifatida yo'q. **Ammo** ularning **53 tasi aslida VIEW** sifatida
jonli DB'da bor — ya'ni yo'qolmagan, faqat kod ularni jadval deb, DB esa ko'rinish (view)
qilib saqlaydi. Bu xato emas (memory'dagi `sd_sales_orders`=VIEW, `current_stock`=VIEW
naqshiga mos).

### ⭐ Chinakam yo'q (na jadval, na view) — faqat 2 ta:

| Nom | Izoh |
|---|---|
| `ow_orders` | Kodda pgTable bor, jonli DB'da umuman yo'q. "Ikki buyurtma dunyosi" (order worlds) bilan bog'liq — memory'da qayd etilgan masala. |
| `pp_orders` | Kodda pgTable bor, jonli DB'da umuman yo'q. Ishlab chiqarish rejasi (PP) buyurtmalari. |

> Bu 2 ta = kod jonli DB bilan **haqiqatan kelishmayotgan** yagona joy. Ular runtime'da
> ishlatilsa xato berishi mumkin. (Tuzatish — bajaruvchi/egasi ishi; bu yerda faqat belgilab qo'yildi.)

53 ta VIEW-orphaned ro'yxati (xavf past, ma'lumot uchun): `asset_items`, `crm_deals`,
`crm_invoices`, `current_stock`, `fi_gl_documents`, `fi_invoices`, `hr_applications`,
`hr_application_responses`, `lms_*` (12 ta), `material_lots_view`, `mes_*` (4 ta),
`mm_*` (12 ta), `mro_*` (3 ta), `pos_*` (6 ta), `pp_mrp_runs`, `pp_work_centers`,
`qc_certificates`, `sd_invoices`, `sd_sales_orders`, `shift_schedules`, `wms_*` (4 ta).

---

## 5. Dublikat `pgTable` (11 ta)

Bir nom kodda **2+ marta** `pgTable(...)` bilan ta'riflangan (barrel/stub mos kelishi —
memory'dagi "schema barrel precedence" naqshiga mos, runtime xatosi bermaydi, lekin
chalkashlik manbai):

```
accounting_periods   attendance   courses   inventory_counts   leave_requests
lms_tests   marketing_content_posts   marketing_social_accounts   materials
salary_history   users
```

---

## 6. Yangi to'lgan / yangi orphaned / yangi dublikat

Oldingi hisobot yo'qligi sababli **solishtirish mumkin emas**. Bu — bazaviy nuqta.
Keyingi tekshiruvda:
- "yangi to'lgan jadvallar" (oldin bo'sh, endi data) = tizim ishlatila boshlandi (✅ yaxshi),
- "yangi orphaned/dublikat" = kod jonli DB bilan ajralib ketdi (⚠️ ogohlantirish)
shu hisobot bilan taqqoslab aniqlanadi.

---

## 7. Texnik eslatma (kelajakdagi tekshiruvchi uchun)

- Jonli DB'da `information_schema` 968 base table beradi; mening lowercase grep'im 966 ta
  ko'rsatdi — farq 2 ta jadval **katta harf bilan** nomlanganidan: `designOrderMessages`,
  `designOrderNotifications` (regex `[a-z_0-9]+` ularni tashlab yubordi). Orphaned hisobiga
  ta'sir qilmaydi (ular pgTable lowercase'da ham yo'q).
- Jonli DB'da jami **71 ta VIEW** bor.

---

## ⭐ XULOSA (egaga, sodda til)

Tizim hali **qurilish bosqichida**: 968 jadvaldan 86% (830 ta) hali bo'sh, 138 tasida
data bor (asosan log va boshlang'ich/demo yozuvlar). **Eng yaxshi xabar:** kod jonli baza
bilan deyarli to'liq mos — "orphaned" deb ko'ringan 55 nomning 53 tasi aslida **VIEW**
sifatida bazada bor, faqat **2 ta** (`ow_orders`, `pp_orders`) chinakam yo'q. Dublikat
ta'rif 11 ta — bu xavfsiz (runtime xatosi yo'q), lekin tartibga solinsa yaxshi. Bu
birinchi tekshiruv bo'lgani uchun "oldinga ketdi/orqaga ketdi" degan baho keyingi
safardan beriladi.
