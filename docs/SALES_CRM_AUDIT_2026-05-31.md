# Sales & CRM moduli — chuqur audit (FE+BE, sahifa-ba-sahifa) — 2026-05-31

> READ-ONLY. 33 sahifa (16 nomma-nom + 17 yashirin). Har REAL/STUB da'vo file:line bilan
> tasdiqlangan (35-agent workflow). Jonli DB bo'sh → REAL/STUB faqat KOD bo'yicha aniqlangan.

## Umumiy holat
- **18 GREEN** (real DB'ga yozadi/o'qiydi) · **12 YELLOW** (yarim — ba'zi endpoint stub) · **3 RED** (label) — lekin **funksional 4 sahifa 0 ishlaydigan endpoint** (Lead Capture ham R0).
- **Asosiy muammo texnik emas — STRUKTURA:** 1 mijoz + 1 buyurtma o'rniga **2 mijoz jadval + 2 buyurtma jadval = 4 master store**. Zanjir o'rtasidan uzilgan.

## ENG MUHIM — ikki parallel olam (mijoz/buyurtma bo'linishi)

| | CRM tomoni | SD tomoni |
|---|---|---|
| Mijoz jadval | `crm_companies` | `sd_customers` (faol CRUD UI) |
| Buyurtma | — | `sd_orders` (Orders/Order-Create/Payments) **VA** `sales_orders` (Dashboard/Sales/KPI) |
| Sahifalar | CRM Workspace, AI CRM ×2, CRM Activities, Cohort, RFM, Funnel, Segments, Portal | Customers, Quotes, Orders, Contracts, Payments, Advance, Order-Create |

**Oqibat:** `/sd/customers`'da qo'shilgan mijoz CRM pipeline'da KO'RINMAYDI va aksincha. Yutilgan lid
avtomatik buyurtmaga aylanmaydi — mijozni qo'lda qayta kiritish kerak. Hatto SD ichida ham
ikki buyurtma jadval: Dashboard `sales_orders`'ni sanaydi, Orders ro'yxati `sd_orders`'ni — **sonlar mos kelmasligi mumkin**.

## Sotish jarayon-zanjiri (qaysi sahifa qaysi qadam)
1. **LID** → Lidlar/CRM Workspace (`/crm-workspace`) + Lead Capture (`/lead-capture`, BUZUQ)
2. **TAKLIF** → Taklifnomalar (`/sd/sales-quotes`) + Quotation Builder (`/sd/quotation-builder`)
3. **BUYURTMA** → Buyurtma Yaratish (`/order-create`) → Buyurtmalar (`/sd/sales-orders`) → Workflow (`/order-workflow`)
4. **SHARTNOMA** → Shartnomalar (`/sd/contracts`)
5. **70% AVANS** → Avans Nazorat (`/sd/advance-control`) — ishlab chiqarishni ochadi
6. **TO'LOV** → To'lovlar (`/sd/sales-payments`)
7. **YETKAZISH** → Order Tracking (`/order-tracking`)

🔴 **Zanjir o'rtada uzilgan:** lidlar `crm_companies`'da, lekin taklif/buyurtma `sd_customers`'da → yutilgan lid qo'lda qayta kiritilmasa buyurtmaga o'tmaydi.

## Sahifa-ba-sahifa (33)

### Yadro sotish zanjiri
| # | Sahifa | Holat | Tizim | Izoh |
|---|---|---|---|---|
| 1 | SD Dashboard `/sd/dashboard` | 🟢 6/6 | sales_orders+sd_customers | Sotish boshqaruv markazi. KPI=sales_orders, ro'yxat=sd_orders (aralash) |
| 2 | Mijozlar `/sd/customers` | 🟢 6/6 | **sd_customers** | Mijoz CRUD — asosiy mijoz kitobi. crm_companies bilan dublikat |
| 3 | Lidlar/CRM Workspace `/crm-workspace` | 🟢 8/8 | **crm_companies** | CRM pipeline (kanban). sd_customers'dan ALOHIDA olam |
| 6 | Taklifnomalar `/sd/sales-quotes` | 🟡 4/5 | sd_customers | TAKLIF qadami. 1 stub (PDF/email) |
| 27 | Quotation Builder `/sd/quotation-builder` | 🟢 5/5 | sd_quotations | Taklif tuzuvchi (qator/narx) |
| 7 | Buyurtmalar `/sd/sales-orders` | 🟢 6/6 | **sd_orders** | BUYURTMA ro'yxati. Dashboard sanog'idan farq qilishi mumkin |
| 10 | Buyurtma Yaratish `/order-create` | 🟢 3/3 | sd_orders | Buyurtma yaratish sehrgari |
| 11 | Buyurtma Workflow `/order-workflow` | 🟡 4/6 | sd_orders | Status dvigatel. 2 transition no-op → bosqich qo'zg'almasligi mumkin |
| 9 | Shartnomalar `/sd/contracts` | 🟡 3/4 | sd_contracts | SHARTNOMA. :id/pdf stub (PDF eksport yo'q) |
| 14 | 70% Avans Nazorat `/sd/advance-control` | 🟡 3/4 | sales_orders | Zavod amaliyoti (avans → ishlab chiqarish). 1 stub |
| 13 | To'lovlar `/sd/sales-payments` | 🟢 5/5 | order→payment | TO'LOV. Qaysi buyurtma jadvalini ishlatishini tekshiring |
| 31 | Order Tracking `/order-tracking` | 🟢 4/4 | — | Buyurtma kuzatuv (o'qish). Workflow bilan to'ldiruvchi |
| 8 | Papka Buyurtmalari `/papka-orders` | 🟢 5/5 | — | Zavodga xos papka/job to'plami. sales-orders bilan overlap? |

### Boshqaruv / tahlil
| # | Sahifa | Holat | Izoh |
|---|---|---|---|
| 4 | Sotish Paneli `/sales` | 🟡 5/7 | SD Dashboard bilan DUBLIKAT home screen. `/api/sales/leads`={data:[]} stub |
| 15 | KPI `/sd/kpi` | 🟢 4/4 | Manager KPI/kvota. Dashboard kvota paneli bilan overlap |
| 25 | Sales Commissions `/sales/commissions` | 🟢 4/4 | Komissiya hisobi |
| 21 | Customer 360 `/customer-360` | 🟢 5/5 | Bitta mijoz to'liq ko'rinishi. Qaysi mijoz id? (sd vs crm) muhim |
| 20 | CRM Funnel Analytics `/crm/funnel-analytics` | 🟢 4/4 | Funnel tahlil. Dashboard funnel + sd/reports/funnel bilan 3× overlap |
| 5 | AI CRM `/ai/crm` | 🟢 5/5 | AI CRM insights (crm tomonida) |
| 17 | CRM Activities `/crm-activities` | 🟢 6/6 | Faoliyat jurnali (crm leads/companies) |

### Marketing / qo'shimcha (asosan yarim yoki bo'sh)
| # | Sahifa | Holat | Izoh |
|---|---|---|---|
| 12 | Ombor Ijara `/sd/warehouse-rental` | 🟢 5/5 | Yon daromad (ombor ijarasi). Asosiy zanjirda emas |
| 16 | Sozlamalar `/sd/settings` | 🟢 4/4 | SD config |
| 18 | CRM Cohort `/crm/cohort-analysis` | 🟡 2/3 | Kohort tahlil (analitika) |
| 19 | CRM RFM Clusters `/crm/rfm-clusters` | 🟡 2/4 | RFM segmentatsiya (yarim) |
| 28 | Customer Segments `/crm/segments` | 🟡 2/3 | Segmentatsiya — RFM/Cohort bilan 3× overlap |
| 29 | Contract Templates `/sd/contract-templates` | 🟡 2/4 | Shartnoma shablonlari (yarim) |
| 32 | Discount Rules `/sd/discount-rules` | 🟡 3/4 | Narx/chegirma qoidalari (yarim) |
| 23 | CRM Settings `/crm-settings` | 🟡 3/5 | SD Settings bilan DUBLIKAT |
| 24 | AI CRM Page (alt) `/ai-crm` | 🟡 3/5 | #5 bilan DUBLIKAT (ikki AI-CRM route) |

### 🔴 Hech narsa saqlamaydi (0 ishlaydigan endpoint)
| # | Sahifa | Holat | Izoh |
|---|---|---|---|
| 22 | Customer Portal Config `/customer-portal-config` | 🔴 0/4 (2 stub+2 missing) | Mijoz portali — kengaytirilgan, hozir kerak emas ehtimol |
| 26 | Lead Capture (public) `/lead-capture` | 🔴 0/3 (3 missing) | Web-to-lead — submit endpoint YO'Q, hech narsa qo'shmaydi |
| 30 | SMS Campaigns `/crm/sms-campaigns` | 🔴 0/3 (3 stub) | Bulk SMS — gateway yo'q, hech narsa yubormaydi |
| 33 | SMS/Notif `/crm/notifications` | 🔴 0/3 (3 stub) | Bildirishnoma — #30 bilan overlap, hech narsa yubormaydi |

## Dublikatlar (xulosadan)
- **Mijoz master ×2:** sd_customers vs crm_companies (hech qachon sync bo'lmaydi)
- **Buyurtma jadval ×2:** sd_orders vs sales_orders (sonlar farq qiladi)
- **Sotish home screen ×2:** SD Dashboard vs Sotish Paneli
- **AI-CRM ×2:** /ai/crm vs /ai-crm
- **Funnel ×3:** Dashboard strip + /sd/reports/funnel + /crm/funnel-analytics
- **Segmentatsiya ×3:** RFM + Cohort + Segments
- **Settings ×2:** SD Settings vs CRM Settings
- **SMS ×2:** SMS Campaigns vs Notifications (ikkalasi bo'sh)

## Tavsiyalar (egaga — qaror variantlari, buyruq emas)
1. **Bitta mijoz master tanlang:** `sd_customers` kanonik (faol CRUD + buyurtma/to'lov bog'langan); `crm_companies` = pipeline pre-stage → yutilganda sd_customers'ga AYLANTIRISH.
2. **Bitta buyurtma jadval tanlang:** `sd_orders` (haqiqiy buyurtma/to'lov oqimi) standart; Dashboard/Sales/KPI'ni sales_orders'dan ko'chiring — yoki aksincha, lekin BITTA.
3. **Ikki home screen'ni birlashtiring** (SD Dashboard + Sotish Paneli).
4. **Yig'ish:** AI-CRM (2→1), funnel (3→1), segmentatsiya (3→1), settings (2→1).
5. **Marketing-outbound (SMS×2, Lead Capture, Portal):** gateway/endpoint ulang YOKI tayyor bo'lguncha menyudan olib qo'ying.
6. **Zanjir uzilishini tuzating:** "lid → SD mijoz + buyurtma" konversiya qo'shing (qo'lda qayta kiritishsiz).

---
*35-agent read-only workflow. Hech narsa o'zgartirilmadi. To'liq xom natija: tasks/wpvydjlc0.output.*
