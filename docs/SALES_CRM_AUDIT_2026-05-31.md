# Sales & CRM moduli — chuqur audit (FE+BE, sahifa-ba-sahifa) — 2026-05-31

> READ-ONLY, 35-agent workflow. **33 sahifa** topildi (egangiz 16 nomladi; +17 yashirin route).
> Har REAL/STUB/MISSING da'vo handler file:line + sitata bilan tasdiqlangan. Jonli DB BO'SH →
> REAL/STUB faqat KOD bo'yicha aniqlandi (qator soni emas).

## Umumiy holat (tasdiqlangan raqamlar)
- **9 🟢 GREEN** (haqiqatan DB'ga yozadi/o'qiydi) · **20 🟡 YELLOW** (yarim — kontrakt/shakl nomi mos kelmaydi yoki ba'zi stub) · **4 🔴 RED** (saqlamaydi/buzuq).
- **175 endpoint:** 160 REAL · 8 STUB · 7 MISSING. Ya'ni **backend asosan yozilgan** — muammo ko'pincha FE↔BE shakl/nom mosligida va jadval bo'linishida.
- **Asl muammo TEXNIK emas — STRUKTURA:** 1 mijoz + 1 buyurtma o'rniga **3 mijoz jadval + 5 buyurtma jadval + 2 lid jadval**. Zanjir o'rtasidan uziladi.

## 🔴 ENG MUHIM — necha parallel olam bor

| Tushuncha | Jadvallar (bog'lanmagan) | Sahifalar |
|---|---|---|
| **MIJOZ ×3** | `sd_customers` (faol CRUD), `crm_companies` (CRM), `crm_contacts` (SAP sahifalarida "mijoz") | Customers, Customer360, Quotes, Orders, Payments → sd_customers; SD Quotations/Order-Create dropdown → crm_companies; /sales,/erp/sales dropdown → crm_contacts |
| **BUYURTMA ×5** | `sd_orders`, `sales_orders`, `sap_sales_orders`, `papka_orders`, `ow_orders` | har sahifa boshqa jadval (pastda) |
| **LID ×2** | `sd_leads`, `crm_leads` | SD Leads + SD/crm cockpit → sd_leads; CRM Workspace → crm_leads |

**Eng achchiq haqiqat (egaga):** nomi "kanonik" bo'lgan `sd_orders` amalda deyarli BO'SH qoladi — chunki **lid→buyurtma va taklif→buyurtma konversiyasi `sales_orders`'ga yozadi**, dashboardlar/KPI/to'lov/Customer360 ham `sales_orders`'ni o'qiydi. Ya'ni pul `sales_orders`'da, lekin asosiy "Buyurtmalar" sahifasi (`/sd/sales-orders`) `sd_orders`'ga yozadi → yangi buyurtma "yo'qolgandek" ko'rinadi. Sonlar hech qachon mos kelmaydi.

## Sotish jarayon-zanjiri (real chain, qaysi sahifa qaysi qadam)
1. **LID** → SD Leads `/sd/leads` (sd_leads) **YOKI** CRM Workspace `/crm-workspace` (crm_leads) — ikki alohida olam
2. **TAKLIF** → Taklifnomalar `/sd/sales-quotes` + SD Quotations `/sd/quotations` (ikkalasi sd_quotations) — narx kalkulyatori **soxta** (0 so'm saqlaydi)
3. **BUYURTMA** → 5 jadval: `/sd/sales-orders`(sd_orders) · `/order-create`(papka_orders) · `/sales`,`/erp/sales`(sap_sales_orders, soxta) · `/order-workflow`(ow_orders) · konversiya(sales_orders)
4. **SHARTNOMA** → `/sd/contracts` (sd_contracts) — **yaratish BUZUQ** (POST handler yo'q)
5. **70% AVANS** → `/sd/advance-control` (papka_orders'dan o'qiydi, KPI kartalari qattiq 0)
6. **TO'LOV** → `/sd/sales-payments` (sd_payments) — "To'landi" tugmasi **noto'g'ri jadvalga** (fi_payments) yozadi
7. **YETKAZISH** → `/sd/deliveries` (deliveries)

🔴 **Uzilish nuqtalari:** (a) yutilgan CRM lidi mijoz/buyurtmaga avtomatik aylanmaydi; (b) taklif "tasdiqlash" tugmasi "buyurtma+shartnoma yaratdim" deydi — aslida faqat status o'zgartiradi; (c) konversiya `sales_orders`'ga tushadi, "Buyurtmalar" sahifasi `sd_orders`'ni ko'radi.

## Sahifa-ba-sahifa (33) — tasdiqlangan

### Yadro sotish zanjiri
| # | Sahifa (route) | Holat | Endpoint | Mijoz / Buyurtma tizimi | Izoh |
|---|---|---|---|---|---|
| 1 | SD Dashboard `/sd/dashboard` | 🟢 | 6R | sd_customers + **aralash** | KPI=sales_orders, ro'yxat=sd_orders → sonlar farq qilishi mumkin |
| 2 | Mijozlar `/sd/customers` | 🟢 | 5R | **sd_customers** | Asosiy mijoz kitobi (kredit limit, to'lov muddati, A/B/C segment) |
| 17 | Customer 360 `/sd/customers/:id` | 🟢 | 1R | sd_customers + **sales_orders** | Mijoz kartasi; buyurtma=sales_orders (sd_orders EMAS) |
| 25 | SD Leads `/sd/leads` | 🟡 | 9R | sd_leads → **sales_orders** | Lid; convert→sales_orders (atomik, yaxshi); create shakl nomi mos emas |
| 3 | CRM Workspace (Lidlar) `/crm-workspace` | 🟡 | 6R | **crm_leads/crm_deals** | Bitrix kanban; list shakli noto'g'ri → kanban BO'SH ko'rinadi; convert→deal (buyurtma emas) |
| 6 | Taklifnomalar `/sd/sales-quotes` | 🟡 | 7R/1S | sd_customers / sd_quotations | TAKLIF; narx kalkulyator soxta (qattiq raqam); "Approve" buyurtma yaratmaydi |
| 19 | SD Quotations `/sd/quotations` | 🟡 | 7R/1M | **crm_companies** dropdown / sd_customers join | Ism bo'sh chiqadi (dropdown crm, join sd); convert→sales_orders; getById yo'q |
| 7 | Buyurtmalar `/sd/sales-orders` | 🟡 | 5R/1M | sd_customers / **sd_orders** | Asosiy buyurtma; create 400 (snake vs camelCase), Cancel endpoint YO'Q |
| 10 | Buyurtma Yaratish `/order-create` | 🟡 | 8R | crm_companies / **papka_orders** | Ishlaydi, lekin legacy papka_orders'ga yozadi, mijoz=faqat ism (id yo'q) |
| 11 | Buyurtma Workflow `/order-workflow` | 🟢 | 2R | **ow_orders** (orol) | Real, lekin o'z 17 jadvalli olami; mijoz masteriga bog'lanmagan |
| 9 | Shartnomalar `/sd/contracts` | 🔴 | 3R/1M | sd_customers / sd_contracts | **Yaratish ishlamaydi** (POST handler YO'Q + ustun nomlari mos emas); faqat ko'rish+imzolash |
| 14 | 70% Avans Nazorat `/sd/advance-control` | 🟡 | 5R | papka_orders | Real o'qiydi, lekin KPI kartalari **qattiq 0**; mijoz/buyurtma FK yo'q |
| 13 | To'lovlar `/sd/sales-payments` | 🟡 | 5R/1S/1M | sd_customers / sales_orders | "To'landi" **fi_payments**'ga yozadi (noto'g'ri jadval→ jim ishlamaydi); export YO'Q |
| 27 | SD Debitors `/sd/debitors` | 🟡 | 3R | sd_customers | Qarz yoshi ro'yxati real; "Faktura" 400, "Eslatma" matnni tashlaydi |
| 26 | SD Deliveries `/sd/deliveries` | 🟢 | 2R | crm_companies / sales_orders | Yetkazish (pick→pack→issue); real `deliveries` jadval |
| 8 | Papka Buyurtmalari `/papka-orders` | 🟢 | 4R | **papka_orders** | Zavodga xos papka/job; aslida ishlab chiqarish (MES) yozuvi, sotish emas |

### Boshqaruv / hisobot / SAP
| # | Sahifa (route) | Holat | Endpoint | Izoh |
|---|---|---|---|---|
| 4 | Sotish Paneli `/sales` | 🔴 | 4R/2S | SAP buyurtma; **create/delete SOXTA** (Date.now() qaytaradi, DB yozmaydi); mijoz=crm_contacts |
| 18 | Sotish `/erp/sales` | 🟡 | 4R/2S | #4 bilan bir xil SAP sahifa, ikkinchi route; xuddi shu soxta create/delete |
| 22 | SD Overview Dashboard `/sd/dashboard/overview` | 🔴 | 3R | SQL real, lekin **javob shakli noto'g'ri** → barcha KPI/funnel 0 ko'rsatadi |
| 23 | SD Quota Dashboard `/sd/dashboard/quota` | 🔴 | 1R | Shakl noto'g'ri (massiv vs obyekt) → hammasi 0; kvota=qattiq 0 |
| 24 | SD Manager Panel `/sd/manager-panel` | 🟢 | 5R | Manager kuzatuv (real); kvota maqsadlari qattiq konstanta |
| 15 | KPI `/sd/kpi` | 🟡 | 3R/1S | sales_orders; jamoa/funnel bo'sh (shakl drift); kpi-targets stub bo'sh massiv |
| 20 | SD Europrint cockpit `/sd/crm` | 🟡 | 22R/1M | sd_customers/sd_orders; eng katta sahifa (23 ep); payments PUT yo'q, narx kalkulyator soxta |
| 21 | Sales Management `/sd/sales-management` | 🟡 | 2R/1M | Invoice+komissiya real; Forecast endpoint YO'Q; Analytics placeholder |
| 16 | Sozlamalar (narx editori) `/sd/settings` | 🟡 | 2R | sd_price_formulas; 18-maydon model row-modelga mos emas → yuklamaydi/saqlamaydi (shu sbabli kalkulyator soxta) |
| 12 | Ombor Ijara `/sd/warehouse-rental` | 🟡 | 8R/1S | sd_rentals (ombor ijara haqi — sotish hujjati emas); recalculate stub; alohida orphan CRUD bor (warehouse_rental_records) |

### CRM / AI / analitika
| # | Sahifa (route) | Holat | Endpoint | Izoh |
|---|---|---|---|---|
| 5 | AI CRM `/ai/crm` | 🟡 | 7R | crm contacts/deals; 3 AI amal (churn/email/NBA) 400 (shakl); score+probability ishlaydi |
| 28 | CRM Funnel `/crm/funnel` | 🟢 | 3R | crm_deals pipeline scoreboard (real) |
| 30 | CRM Cohort `/crm/cohort` | 🟢 | 1R | sales_orders'dan kohort (real); mijoz masteriga join qilmaydi |
| 29 | CRM RFM Clusters `/crm/rfm` | 🟡 | 1R | K-Means+DB yozish real, lekin FE **80 TASODIFIY soxta mijoz** (C001..C080) yuboradi → rfm_clusters'ga axlat yozadi |
| 17b| CRM Activities `/crm/activities` | 🟡 | 5R | crm_activities; create maydonlarni tashlaydi (camelCase vs snake) |
| 31 | CRM Settings `/crm/settings` | 🟡 | 5R | crm_custom_fields real; Add/Reorder 400; 4/5 bo'lim placeholder |
| 33 | Order Approval Workflow `/order-approval` | 🟡 | 6R/1M | approval_requests (umumiy 1-qatorli) vs UI 4-bosqichli → bo'sh kataklar; submit 400 |

## 🔴 4 RED + "jim muvaffaqiyat" buglari (eng xavfli — egaga BIRINCHI)
Eng xavflisi — foydalanuvchi "saqlandi" deb o'ylaydi, aslida yo'qoladi:
1. **`/sales` + `/erp/sales` (SAP)** — buyurtma create/delete SOXTA (`sap.controller.ts:87,106` → `{id:Date.now(),created:true}`, DB yozmaydi). Refreshda yo'qoladi.
2. **`/sd/sales-payments` "To'landi"** — `fi_payments`'ga yozadi (`drizzle-quotation.repo:133`), FE esa `sd_payments` ro'yxatini ko'rsatadi → qarz hech qachon "to'langan" bo'lmaydi.
3. **`/sd/contracts` yaratish** — POST handler umuman YO'Q (`sd-contracts.controller.ts` faqat GET+sign) → "Saqlash" hech narsa saqlamaydi.
4. **`/sd/sales-quotes` "Approve"** — "buyurtma+shartnoma yaratildi" deydi, aslida faqat status flag.
5. **`/sd/dashboard/overview` + `/quota`** — SQL real, javob shakli noto'g'ri → SD bosh ekrani bo'sh/o'lik ko'rinadi.

## Dublikatlar (tasdiqlangan)
- **Mijoz ×3:** sd_customers / crm_companies / crm_contacts (bitta xaridor 3 xil joyda)
- **Buyurtma ×5:** sd_orders / sales_orders / sap_sales_orders / papka_orders / ow_orders (sonlar hech qachon mos kelmaydi)
- **Lid ×2, 3 UI:** sd_leads (SD Leads + cockpit) vs crm_leads (CRM Workspace)
- **Taklif:** 1 jadval (sd_quotations), 3 FE ekran
- **SD dashboard oilasi:** /sd/dashboard, /overview, /quota, /sd/kpi, /sd/manager-panel — ust-ust KPI/funnel/kvota
- **To'lov/qarz:** SD Payments+Debitors ↔ Finance AR; 1 "to'lash" 4 jadvalga tegadi (sd_payments, sales_orders, invoices, fi_payments)
- **Invoice ×2:** legacy `invoices` vs `sales_invoices`
- **Ombor ijara ×2:** sd_rentals (SD tab) vs warehouse_rental_records (orphan WMS CRUD)
- **CRM analitika:** funnel/rfm/cohort/churn + Customer360 segmentatsiya + SD ABC — ust-ust

## Tavsiyalar (egaga — qaror variantlari)
1. **Bitta mijoz masteri:** `sd_customers` (to'liq CRUD + Customer360 + ko'p dropdown) — kanonik qiling; SD Quotations/Order-Create dropdownni crm_companies→sd_customers ga, SAP sahifalardan crm_contacts-as-customer'ni olib tashlang. Bu ko'p "bo'sh ism" bugini yopadi.
2. **Bitta buyurtma jadval:** amalda pul `sales_orders`'da. Variant A (kam ish): `sales_orders`'ni standart qiling, Buyurtmalar sahifasi + hisobotlarni unga qarating, `sd_orders`'ni nafaqaga. Variant B: `sd_orders`'ni kanonik qiling, lekin konversiya+dashboard+to'lovni unga ko'chiring. **Ikkalasini saqlamang.** sap_sales_orders/papka_orders/ow_orders — nafaqa yoki aniq qayta nomlang.
3. **AVVAL 5 "jim muvaffaqiyat" bugini tuzating** (yuqorida) — eng xavfli, foydalanuvchi aldanyapti.
4. **FE↔BE shakl/nom drift** — bitta fokusli o'tishda ko'p YELLOW sahifa (Orders create, Overview/Quota/KPI shakl, Debitors, AI CRM 3 amal, CRM Settings, Activities) ishga tushadi — yangi feature kerak emas.
5. **Narx strategiyasi:** kalkulyator soxta (sd_price_formulas yuklanmaydi). Avtomatik narx kerak bo'lsa — narx jadval+sahifani tuzating; bo'lmasa — qo'lda summa kiriting (taklif hech bo'lmasa real raqam saqlasin).
6. **Ekranlarni yig'ish:** 1 lid sahifa, 1 taklif sahifa, 1 SD dashboard oilasi, 1 ijara sahifa.
7. **Qabul/Invoice egaligi:** SD vs Finance — qaysi biri to'lov/qarz/invoice egasi? Bitta to'lov jadval + bitta invoice jadval tanlang, qolgani read-only ko'rinish.

---
*35-agent read-only workflow (8.2M token, 6770 tool-use). Hech narsa o'zgartirilmadi. Xom natija: tasks/wpvydjlc0.output. Avvalgi commit (fec73523) raqamlari xato edi — bu versiya tasdiqlangan.*
