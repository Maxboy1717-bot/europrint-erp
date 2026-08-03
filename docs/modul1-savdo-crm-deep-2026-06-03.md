# MODUL 1 — SAVDO & CRM — Chuqur Tahlil (tugma/forma/maydon darajasi)
> Sana: 2026-06-03 | Rejim: QAT'IY READ-ONLY | 2 agent + jonli DB (_audit/q.cjs) + BE handler tekshiruvi
> ⭐ VERIFY-DON'T-TRUST: FE ko'rinishiga emas, backend+DB ga qaraldi. Eski auditlardan 5 da'vo eskirgan/noto'g'ri chiqdi; 8 yangi haqiqiy bug topildi.

---

## 0. JONLI DB HOLATI (qurilish bosqichi — deyarli bo'sh)
crm_leads=**5** · crm_deals=0 · crm_contacts=0 · crm_companies=0 · crm_activities=3 · crm_custom_fields=0
sd_customers=**9** · sd_sales_orders=**12** · sales_orders=**12** · sd_quotations=0 · sd_contracts=0 · sd_leads=0 · sd_payments=0 · sd_customer_interactions=7 · sd_price_formulas=1
⚠️ `sd_kpi_targets` jadvali **umuman yo'q**.

---

## 1. CRM SAHIFALAR (9 ta)

### /crm-workspace — CRM Workspace (asosiy CRM kanban) — 🟡
**Funksiya:** Lid/bitim/kontakt/kompaniya kanban (drag-drop), vazifa, kalendar, robotlar.
- ✅ Lid yaratish, bosqich ko'chirish (drag-drop), bulk o'chirish, vazifa qo'shish — REAL DB
- 🔴 **"+ Bitim / Kontakt / Kompaniya" tugmasi BUZUQ** — QuickCreateModal FE↔BE maydon nomi mos emas (`companyId`/`totalAmount`/`first_name`/`name` yetishmaydi) → **400 xato**. Faqat "+ Lid" ishlaydi. → shuning uchun deals/contacts/companies jadvallar BO'SH
**Foydalanuvchi qila olmaydi:** Kanbanda yangi bitim/kontakt/kompaniya qo'sha olmaydi (xato beradi).

### DetailSheet (yon-panel, har entity bosilganda) — 🟢
- ✅ "Sotuvga aylantirish" (lead→deal) REAL + ⭐ **lid→sd_customers ENDI AVTOMATIK** (`LeadConvertedCustomerListener`) — eski doc "qo'lda kiritish kerak" degani ESKIRGAN
- ✅ Qo'ng'iroq/izoh formalari REAL DB

### /ai/crm — AI CRM — 🟢 (ma'lumotsiz)
- ✅ Lid skoring, churn, NBA — real LLM (`ai/ai-crm.controller`). ⚠️ deals/contacts bo'sh → tahlil qiladigan obyekt yo'q

### /crm/funnel — Sotuv voronkasi — 🔴
- ✅ Voronka o'qish REAL
- 🔴 **"Bosqich yangilash" forma BUZUQ** (`{stage}` yuboradi, BE `stageId` kutadi → xato)
- 🔴 **"Bitimni yopish" forma BUZUQ** (`PATCH /crm/deals/close` route umuman yo'q)
**Foydalanuvchi qila olmaydi:** Voronka sahifasidan bitim bosqichini o'zgartira/yopa olmaydi.

### /crm/rfm — RFM segmentatsiya — 🟡
- ✅ K-Means algoritm REAL (BE), lekin ⚠️ **kirish = TASODIFIY soxta data** (`Math.random()` 80 nuqta) — haqiqiy mijozlarni emas
**Foydalanuvchi qila olmaydi:** O'z mijozlarini segmentlay olmaydi (har safar soxta 80 mijoz).

### /crm/cohort — Kogort tahlil — 🟢 (read-only, ma'lumot kam)
### /crm/activities — Aktivliklar — 🟢 (yaratish/bajarildi/bekor REAL)
### /crm/settings — CRM sozlamalari — 🟡
- ✅ Maxsus maydonlar tab REAL CRUD
- 🔴 **5 tabdan 4 tasi STATIK PLACEHOLDER** (Rekvizit/Kirish-huquqi/Tovar/Integratsiya — bo'sh kartochka)

### /sd/customers/:id — Customer 360 — 🟢
- ✅ To'liq 360 ko'rinish REAL. ⭐ Eski "return {} soxta" da'vo NOTO'G'RI — controller qayta yozilgan, haqiqiy enrichment

### ⚠️ Comms (email/SMS/WhatsApp) — JIM YOLG'ON
`POST /crm/email|sms|whatsapp/send` → DB ga "yuborildi" yozadi, `{sent:true}` qaytaradi, lekin **haqiqiy SMTP/SMS/WhatsApp chaqirmaydi**. Mijozga hech narsa bormaydi.

---

## 2. SD/SOTUV SAHIFALAR (15 ta)

### /sd/customers — Mijozlar bazasi — 🟢
- ✅ Yaratish/tahrirlash/o'chirish + Customer360 (kontakt/hujjat/NPS/shikoyat) HAMMASI REAL
- 🟢 ⭐ "return {}" = real soft-delete (eski flag NOTO'G'RI)
**Qila olmaydi:** Haqiqiy fayl (PDF/skan) yuklay olmaydi — faqat URL matn.

### /sd/quotations ╳ /sd/sales-quotes — Taklifnomalar (2 DUBLIKAT sahifa) — 🟡
- ✅ Yaratish/yuborish/tasdiqlash/convert REAL
- 🟡 **Narx kalkulyatori yarim** — faqat miqdor chegirmasi; **o'lcham/karton turi/bosma rangi narxga TA'SIR QILMAYDI**; `sd_price_formulas` qiymatlari ishlatilmaydi
- 🟡 **FE pul hisoblaydi** + **QQS=0 qattiq kodlangan**
**Qila olmaydi:** Karton turi/bosma tanlab to'g'ri narx ololmaydi; QQS avtomatik qo'shilmaydi.

### /sd/sales-orders — Savdo buyurtmalari (asosiy) — 🟡
- ✅ Buyurtma yaratish, 13-bosqich holat, bekor qilish REAL; avans/qoldiq ko'rinadi
- 🟡 **Mahsulot qatorlari (line-item) YO'Q** — faqat bitta "umumiy summa"
- 🔴 ⚠️ **IKKI BUYURTMA OLAMI** — bu sahifa `sd_sales_orders` o'qiydi, lekin lid/taklif konversiyasi `sales_orders` ga yozadi → **konversiyadan kelgan buyurtma bu yerda KO'RINMAYDI**
**Qila olmaydi:** Buyurtmaga konkret mahsulot qatorlari qo'sha olmaydi; aylantirilgan buyurtmani topa olmasligi mumkin.

### /erp/sales — SAP buyurtmalar — 🟢 (lekin ortiqcha)
- ✅ ⭐ Eski "Date.now() soxta" da'vo NOTO'G'RI — endi real `INSERT INTO sales_orders`. ❌ Yana bir buyurtma kirish nuqtasi (ikkilik)

### /sd/leads — Lidlar — 🟢
- ✅ Yaratish/tahrirlash/convert/CSV-import REAL
- 🟡 ⚠️ **IKKI LID TIZIMI** — `sd_leads` (bu) ╳ `crm_leads` (CRM Workspace)

### /sd/contracts — Shartnomalar — 🟢
- ✅ ⭐ Eski "POST handler YO'Q" da'vo NOTO'G'RI — yaratish REAL (`INSERT INTO sd_contracts`, boshqa controllerda); imzolash REAL; taklif tasdiqlanganda avto-yaratish REAL
- 🟡 Shartnomada alohida "70% avans" maydoni yo'q (avans buyurtmada)
**Qila olmaydi:** Shartnoma PDF/Word generatsiya qilib yuklab ololmaydi.

### /sd/deliveries — Yetkazib berish — 🟢 (holat boshqaruvi REAL)
### /sd/sales-payments — To'lovlar — 🟡
- ✅ To'lov kiritish + "To'landi" REAL (⭐ to'g'ri jadval `sd_payments`, eski "fi_payments" da'vo NOTO'G'RI)
- 🟡 **"Avans qayd etish" tugmasi `amount:0` yuboradi** (summa maydoni yo'q)

### /sd/debitors — Debitorlar — 🟢
- ✅ Aging hisoboti, faktura yaratish REAL. ⚠️ "Eslatma yuborish" = faqat ichki yozuv (haqiqiy SMS/email yo'q)

### /sd/kpi — KPI — 🟡
- ✅ Menejer reyting + voronka REAL
- 🔴 **Kvota maqsadlari BUZUQ** — `sd_kpi_targets` jadval YO'Q → doim bo'sh, tahrirlash ishlamaydi

### /sd/settings — Narx formulasi sozlamasi — 🟢 (lekin "o'lik")
- ✅ Saqlash REAL (`sd_price_formulas` singleton, tuzatilgan 29d637a6)
- 🟡 **AMMO qiymatlar `calculatePrice` da ISHLATILMAYDI** → sozlama taklifga ta'sir qilmaydi

### /sd/dashboard — SD panel — 🟡 (read-only; bo'sh DB → 0)
### /sd/sales-management (+invoices/forecast/analytics/commission, 5 route→1) — 🟡
- ✅ Invoices/commission REAL
- 🔴 **"Prognoz yaratish" tugmasi BUZUQ** — `/api/sd/forecast/generate` yo'q (real: `/api/sales/...`) → 404
- 🟡 Forecast aniqligi **qattiq kodlangan** (78.5% soxta)

### /sd/manager-panel (+warehouse-rental/advance-control, 3 route→1) — 🟢 (monitoring, read-only)
### /sd/crm — CRM Savdo (yagona oqim aggregator) — 🟢 (eng yaxlit ekran)

---

## 3. ⭐ VIZYON ZANJIRI MOSLIGI (SALES_PROCESS_INTENDED_VS_ACTUAL bo'yicha)

| Qadam | Holat | Izoh |
|---|---|---|
| 0a. Lid (yangi mijoz) | 🟡 ~70% | Real, lekin sd_leads ╳ crm_leads ikkilik |
| 1. Mijoz bazasi | ✅ ~85% | sd_customers yagona, to'liq CRUD |
| 2. Taklif + narx | 🟡 ~55% | Yaratish real; narx formulasi yarim (o'lcham/karton/bosma yo'q); QQS=0 |
| 3. Buyurtma | 🟡 ~60% | Real, lekin 2 jadval ikkilik + line-item yo'q |
| 4. Shartnoma + 70% avans | ✅ ~80% | Yaratish/imzolash REAL (doc xato edi) |
| 5. Buyurtma→ishlab chiqarish | 🟡 ~40% | Phase 4 fan-out kodda BOR, lekin SD UI'ga ulanmagan + data oqmaydi (QO'LDA) |
| 6. Yetkazish | ✅ ~75% | deliveries holat boshqaruvi real |
| 7. To'lov + qarz | ✅ ~75% | sd_payments to'g'ri jadval (doc xato edi); avans tugmasi summa=0 |

**Umumiy moslik: ~70%.** Asosiy bloklar real ishlaydi. Bo'shliq: (1) 2 buyurtma + 2 lid jadval, (2) narx formulasi yarim, (3) buyurtma→ishlab chiqarish UI ulanmagan.

---

## 4. ESKI 5 "JIM BUG" — QAYTA TEKSHIRUV (4 tuzatilgan, 1 qisman)
| Eski da'vo (2026-05-31) | Hozir |
|---|---|
| SAP create soxta (Date.now) | ❌ TUZATILGAN (real INSERT sales_orders) |
| To'lov fi_payments noto'g'ri | ❌ TUZATILGAN (UPDATE sd_payments) |
| Shartnoma POST YO'Q | ❌ NOTO'G'RI (POST boshqa controllerda real) |
| Taklif Approve yolg'on | ❌ NOTO'G'RI (real zanjir: sales_orders+sd_contracts) |
| Dashboard 0 ko'rsatadi | 🟡 QISMAN (SQL real, bo'sh DB) |

---

## 5. ⭐ YANGI HAQIQIY BUGLAR (hozirgi, eski emas)
| # | Bug | Holat | Foydalanuvchi ta'siri |
|---|---|---|---|
| 1 | QuickCreateModal deals/contacts/companies = 400 (maydon nomi) | 🔴 | Kanbanda 4 turdan 3 tasi qo'shilmaydi |
| 2 | CrmFunnel 2 forma buzuq (stageId; /deals/close yo'q) | 🔴 | Voronkadan bitim boshqarib bo'lmaydi |
| 3 | CRM lead email soxta (id:Date.now) | 🔴 | Email yuborilmaydi/saqlanmaydi |
| 4 | Comms email/SMS/WhatsApp jim yolg'on ({sent:true}) | 🔴 | Mijozga xabar bormaydi |
| 5 | 2 buyurtma jadval bog'lanmagan (sd_sales_orders ╳ sales_orders) | 🔴 | Aylantirilgan buyurtma SD ekranida ko'rinmaydi |
| 6 | RFM tasodifiy soxta data | 🟡 | Haqiqiy mijoz segmentatsiya yo'q |
| 7 | Narx kalkulyatori yarim + QQS=0 | 🟡 | To'g'ri narx/QQS chiqmaydi |
| 8 | forecast/generate 404 + sd_kpi_targets jadval yo'q + avans amount:0 | 🟡 | Prognoz/kvota/avans-summa ishlamaydi |

---

## 6. 🛑 EGASI QARORI KERAK (intervyu uchun)
1. **2 lid tizimi** (crm_leads ╳ sd_leads) → bittaga birlashtirilsinmi?
2. **2 buyurtma jadval** (sd_sales_orders ╳ sales_orders) → kanonik tanlash (two-worlds tahliliga bog'liq)
3. **Narx formulasi** → o'lcham/karton/bosma to'liq formula qurilsinmi (sd_price_formulas ulansin)?
4. **Buyurtma→ishlab chiqarish** → SD UI'ga departament fan-out ulansinmi (hozir qo'lda)?
5. **Comms** (email/SMS/WhatsApp) → haqiqiy gateway ulansinmi yoki "ichki jurnal" deb qoldirilsinmi?
6. **Dublikat sahifalar** (taklif ×2, buyurtma ×2, SDSalesManagement 5→1) → qaysi qoladi?

> Hech narsa o'zgartirilmadi (read-only). Yagona yozuv: bu hujjat + agent topilmalari.
