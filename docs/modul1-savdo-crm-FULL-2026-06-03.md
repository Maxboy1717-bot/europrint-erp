# MODUL 1 — SAVDO & CRM — TO'LIQ CHUQUR TAHLIL (rasmiy, intervyu uchun)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | QAT'IY READ-ONLY — hech narsa o'zgartirilmadi
> Usul: har sahifa→FE fayl→endpoint→BE handler→DB jadval zanjiri. Jonli DB (_audit/q.cjs) + BE kod.
> ⭐ VERIFY-DON'T-TRUST: FE ko'rinishiga emas, backend+DB ga qaraldi. Eski 5 da'vo eskirgan, 8 yangi bug topildi.
> ⚠️ Vizyon arxiv `EUROPRINT_BARCHA_JAVOBLAR.md` repoda YO'Q — vizyon mapping `SALES_PROCESS_INTENDED_VS_ACTUAL.md` (mo'ljal zanjiri) bo'yicha.

---

# QADAM 1 — KASHF (butun rasm)

## Jami: 24 alohida sahifa + 8 redirect-alias + 5 order-chegarasi sahifa

**Route → sahifa xaritasi:**
- **CRM (9 sahifa):** /crm-workspace · /ai/crm (+/ai-crm) · /crm/funnel · /crm/rfm · /crm/cohort · /crm/activities · /crm/settings · /sd|crm/customer/:id (Customer360)
- **⭐ 8 redirect-alias → hammasi /crm-workspace ga:** /crm · /crm/dashboard · /crm/leads · /crm/deals · /crm/contacts · /crm/companies · /crm/proposals · /crm/invoices (AppRouter.tsx:145-152) — **8 menyu havola, 1 sahifa**
- **SD (15 sahifa):** /sd/customers · /sd/quotations · /sd/sales-quotes · /sd/sales-orders · /erp/sales · /sd/leads · /sd/contracts · /sd/deliveries · /sd/sales-payments · /sd/debitors · /sd/kpi · /sd/settings · /sd/dashboard · /sd/sales-management(+4 alias) · /sd/manager-panel(+2 alias) · /sd/crm(SDEuroprint)
- **Order-chegarasi (5 sahifa — ishlab chiqarish moduli, lekin SD↔ishlab chiqarish ko'prigi):** /order-create (OrderCreationWizard) · /order-workflow · /order-approval · /order-status · /orders-registry
- **Boshqa:** /customer-portal (CustomerPortalConfig — sozlama)

> ⚠️ Order-* sahifalar `ProductionRoutes`/`AdminRoutes` da (ishlab chiqarish/order-olami `ow_orders`/`papka_orders`). Bular SD buyurtma (`sd_sales_orders`/`sales_orders`) dan ALOHIDA — bu "ikki buyurtma olami" muammosining bir qismi (pastda).

## Jonli DB holati (qurilish bosqichi)
crm_leads=**5** · crm_deals=0 · crm_contacts=0 · crm_companies=0 · crm_activities=3 · crm_custom_fields=0
sd_customers=**9** · sd_sales_orders=**12** · sales_orders=**12** · sd_quotations=0 · sd_contracts=0 · sd_leads=0 · sd_payments=0 · sd_customer_interactions=7 · sd_price_formulas=1 · **sd_kpi_targets=JADVAL YO'Q**

---

# QADAM 2 — HAR SAHIFA (A–G)

## 🟡 1. CRM Workspace — `/crm-workspace` (+ 8 redirect-alias)
**A.** FE: `pages/CRMWorkspace.tsx` (382q) → `hooks/useCRMWorkspace.ts`. Sub: `pages/crm/QuickCreateModal.tsx`, `DetailSheet.tsx`.
**FUNKSIYA:** Asosiy CRM. Sotuv menejeri yangi mijozlar (lid), bitim, kontaktni kanban doskasida (drag-drop) boshqaradi. 8 menyu havolasi shu bitta sahifaga olib keladi.
**B. Tugma/forma:**
- ✅ Kanban drag-drop (bosqich) → `PATCH /crm/leads|deals/:id/stage` (useCRMWorkspace:159) — REAL DB
- ✅ Bulk o'chirish → `DELETE :id` (REAL) · ✅ Vazifa qo'shish/bajarildi/o'chirish → `/crm/followup-activities` (REAL)
- 🔴 **QuickCreateModal "+ yaratish": 4 turdan 3 BUZUQ** — deals (`companyId`+`totalAmount` yo'q→400), contacts (`first_name` yo'q→400), companies (`name` yo'q→400). Faqat **lead** ishlaydi (controller `title`→name normalize qiladi). FE↔BE maydon-nom drift.
**C. Ma'lumot:** crm_leads(5) jonli; deals/contacts/companies(0) — chunki yaratish buzuq. FE pul hisoblamaydi.
**D. Muammo:** 🔴 QuickCreateModal 3/4 turi 400 (FE-BE drift, `QuickCreateModal.tsx:37-66` ╳ `create-deal.dto.ts:10`, `crm-contacts.controller.ts:75`, `crm-companies.controller.ts:127`).
**E. HOLAT:** 🟡 (lid to'liq; bitim/kontakt/kompaniya yaratish buzuq)
**F. Vizyon (0a lid intake):** 🟡 ~70% — lid ishlaydi, lekin 2 lid tizimi (crm_leads ╳ sd_leads).
**G. Qila olmaydi:** Kanbanda yangi bitim/kontakt/kompaniya qo'sha olmaydi (xato).

## 🟢 1b. DetailSheet (CRM yon-panel)
**B/D:** ✅ "Sotuvga aylantirish" (lead→deal) REAL + ⭐ **lid→sd_customers AVTOMATIK** (`LeadConvertedCustomerListener:49`). Qo'ng'iroq/izoh formalari REAL DB.
**F. ⭐ Eski doc XATO:** "lid→mijoz qo'lda kiritish kerak" — ENDI avtomatik. ~85%.

## 🟢 2. AI CRM — `/ai/crm` (+/ai-crm)
**FUNKSIYA:** AI yordamida lid skoring, churn xavfi, keyingi-harakat tavsiya.
**B/C:** ✅ Real LLM (`ai/ai-crm.controller` → CrmAiService → AI gateway). ⚠️ deals/contacts bo'sh → tahlil obyekti yo'q.
**E.** 🟢 (funksional, ma'lumotsiz). **F.** vizyon: bonus. **G.** Bitim bo'lmagani uchun AI tugmasini bosadigan obyekt kam.

## 🔴 3. CRM Funnel — `/crm/funnel`
**FUNKSIYA:** Sotuv voronkasi (bosqichlar bo'yicha bitim, konversiya).
**B/D:** ✅ Voronka o'qish REAL. 🔴 **"Bosqich yangilash" forma BUZUQ** (`{stage}` yuboradi, BE `stageId` kutadi → xato, crm-deals.controller:15). 🔴 **"Bitim yopish" forma BUZUQ** (`PATCH /crm/deals/close` route YO'Q).
**E.** 🔴 (o'qish ✅, 2 yozuv formasi ✗). **F.** 🟡 ~50%. **G.** Voronkadan bitim bosqichini o'zgartira/yopa olmaydi.

## 🟡 4. CRM RFM — `/crm/rfm`
**FUNKSIYA:** Mijozlarni R/F/M bo'yicha K-Means bilan segmentlash.
**B/C:** ✅ K-Means algoritm REAL (BE). ⚠️ **kirish = TASODIFIY soxta** (`Math.random()` 80 nuqta, `CrmRfmClusters.tsx:41`), haqiqiy mijoz emas.
**E.** 🟡. **F.** 🟡 ~55%. **G.** O'z mijozlarini segmentlay olmaydi (har safar soxta 80).

## 🟢 5. CRM Cohort — `/crm/cohort` — read-only retention; REAL, ma'lumot kam. F: ~70%.
## 🟢 6. CRM Activities — `/crm/activities` — yaratish/bajarildi/bekor REAL DB. F: ~85%.

## 🟡 7. CRM Settings — `/crm/settings`
**B/D:** ✅ Maxsus maydonlar tab REAL CRUD (`/crm/custom-fields`). 🔴 **5 tabdan 4 STATIK PLACEHOLDER** (Rekvizit/Kirish-huquqi/Tovar/Integratsiya — `CRMSettingsPlaceholders.tsx`, hech qanday API/tugma yo'q).
**E.** 🟡 (1/5 real). **G.** Rekvizit/huquq/tovar/integratsiya sozlamalarini umuman kira olmaydi.

## 🟢 8. Customer 360 — `/sd/customers/:id`, `/crm/customer/:id`
**B/C:** ✅ To'liq 360 ko'rinish REAL (`get360View`, sd-customers.controller:177). ⭐ Eski "return {} soxta" NOTO'G'RI — controller qayta yozilgan.
**E.** 🟢. **F.** ~85%. **G.** Bu sahifadan tahrir yo'q (faqat ko'rish).

## ⚠️ CRM Comms (email/SMS/WhatsApp) — JIM YOLG'ON
`POST /crm/email|sms|whatsapp/send` → DB ga "yuborildi" yozadi, `{sent:true}` qaytaradi, lekin **haqiqiy gateway chaqirmaydi** (crm-comms.service.ts:16). Mijozga hech narsa bormaydi.

---

## 🟢 9. SD Customers — `/sd/customers`
**A.** FE: `pages/SDCustomers.tsx` (602q). **FUNKSIYA:** B2B mijoz bazasi — yaratish/tahrirlash/o'chirish + Customer360 (kontakt/hujjat/NPS/shikoyat).
**B.** ✅ Yaratish (`POST /sd/customers`:193), tahrir (`PUT`:210), o'chirish (`DELETE` soft-delete:220) — HAMMASI REAL. ⭐ "return {}" = real softDelete (eski flag NOTO'G'RI). Customer360 ichki CRUD REAL. 🟢 **Hujjat = faqat URL matn maydoni (fayl yuklash YO'Q)**.
**C.** sd_customers(9). FE pul hisoblamaydi.
**E.** 🟢. **F.** ✅ ~85% (qadam 1 yagona mijoz bazasi). **G.** Haqiqiy fayl (PDF/skan) yuklay olmaydi.

## 🟡 10. SD Quotations `/sd/quotations` ╳ 11. SD Sales Quotes `/sd/sales-quotes` (2 DUBLIKAT, 1 jadval)
**FUNKSIYA:** Mijozga narx taklifi yaratish/yuborish/tasdiqlash/buyurtmaga aylantirish.
**B/C/D:** ✅ Yaratish/convert REAL. 🟡 **Narx kalkulyatori YARIM** — `calculatePrice` faqat bitta bazaviy narx + miqdor chegirmasi; **o'lcham/karton turi/bosma rangi narxga TA'SIR QILMAYDI**; `sd_price_formulas` qiymatlari ISHLATILMAYDI (sd-quotations.service.ts:87). 🟡 **FE pul hisoblaydi** (`netValue`, SDQuotationsHooks:63) + **QQS=0 qattiq kodlangan**.
**E.** 🟡. **F.** 🟡 ~55% (qadam 2). **G.** Karton/bosma tanlab to'g'ri narx ololmaydi; QQS avtomatik qo'shilmaydi.

## 🟡 12. SD Sales Orders — `/sd/sales-orders` ⭐ asosiy buyurtma
**A.** FE: `SDSalesOrders.tsx` (481q). **FUNKSIYA:** Buyurtma yaratish, 13-bosqich holat, avans/qoldiq, bekor.
**B/C/D:** ✅ Yaratish (`POST /sd/orders`→CQRS→sd_sales_orders), holat, bekor — REAL. 🟡 **Mahsulot qatorlari (line-item) YO'Q** — faqat bitta "umumiy summa". 🔴 ⚠️ **IKKI BUYURTMA OLAMI** — bu sahifa `sd_sales_orders` o'qiydi, lekin lid/taklif konversiyasi `sales_orders` ga yozadi (sd-leads.repository:146, drizzle-quotation.repo:92) → **konversiyadan kelgan buyurtma bu yerda KO'RINMAYDI**.
**E.** 🟡. **F.** 🟡 ~60% (qadam 3). **G.** Buyurtmaga mahsulot qatorlari qo'sha olmaydi; aylantirilgan buyurtmani topa olmasligi mumkin.

## 🟢 13. SAP Sales — `/erp/sales` (ortiqcha)
**B/D:** ✅ ⭐ Eski "Date.now() soxta" NOTO'G'RI — endi real `INSERT sales_orders` (sap.controller:85). ❌ Yana bir buyurtma kirish nuqtasi (ikkilik). **G.** Bu yerdagi buyurtma /sd/sales-orders da ko'rinmaydi.

## 🟢 14. SD Leads — `/sd/leads`
**B:** ✅ Yaratish/tahrir/convert/CSV-import REAL. **D:** 🟡 ⚠️ **2 LID TIZIMI** (sd_leads ╳ crm_leads); convert→`sales_orders`. **F.** 🟡 ~70%. **G.** SD va CRM lidi alohida.

## 🟢 15. SD Contracts — `/sd/contracts`
**B/D:** ✅ ⭐ Eski "POST handler YO'Q" NOTO'G'RI — yaratish REAL (`INSERT sd_contracts`, quotations controller:92); imzolash REAL; taklif tasdiqlanganda avto-yaratish REAL. 🟡 Alohida "70% avans" maydoni yo'q (avans buyurtmada). **G.** Shartnoma PDF/Word generatsiya yo'q.

## 🟢 16. SD Deliveries — `/sd/deliveries` — holat boshqaruvi REAL (yaratish yo'q, buyurtmadan keladi). F: ✅ ~75%.

## 🟡 17. SD Sales Payments — `/sd/sales-payments`
**B/D:** ✅ To'lov kiritish + "To'landi" REAL. ⭐ to'g'ri jadval `sd_payments` (eski "fi_payments" NOTO'G'RI). 🟡 **"Avans qayd" tugmasi `amount:0` yuboradi** (summa maydoni yo'q, SDSalesPayments:162). **G.** Aniq avans summasini kirita olmaydi.

## 🟢 18. SD Debitors — `/sd/debitors` — aging + faktura REAL. ⚠️ "Eslatma yuborish" = faqat ichki yozuv (haqiqiy SMS/email yo'q). F: ✅ ~75%.

## 🟡 19. SD KPI — `/sd/kpi`
**B/D:** ✅ Menejer reyting + voronka REAL. 🔴 **Kvota maqsadlari BUZUQ** — `sd_kpi_targets` jadval YO'Q → doim bo'sh. **G.** Kvota maqsadlarini ko'ra/tahrirlay olmaydi.

## 🟢 20. SD Settings (narx formulasi) — `/sd/settings`
**B/D:** ✅ Saqlash REAL (`sd_price_formulas` singleton). 🟡 **AMMO qiymatlar `calculatePrice` da ISHLATILMAYDI** → sozlama "o'lik". **G.** Kiritilgan narxlar taklifga ulanmaydi.

## 🟡 21. SD Dashboard — `/sd/dashboard` — read-only; SQL real, bo'sh DB→0.
## 🟡 22. SD Sales Management — `/sd/sales-management` (+invoices/forecast/analytics/commission, **5 route→1**)
**B/D:** ✅ Invoices/commission REAL. 🔴 **"Prognoz yaratish" 404** — `/api/sd/forecast/generate` yo'q (real: `/api/sales/...`, SDSalesManagement:108). 🟡 Forecast aniqligi **qattiq kodlangan** (78.5%, sales.service:42). **G.** Prognoz tugmasi ishlamaydi.

## 🟢 23. SD Extended — `/sd/manager-panel` (+warehouse-rental/advance-control, **3 route→1**) — monitoring, read-only. ⚠️ Advance tab papka_orders o'qiydi (ishlab chiqarish jadvali). **G.** Bu paneldan avansni TASDIQLAY olmaydi (faqat ko'radi).
## 🟢 24. SD Europrint (CRM Savdo) — `/sd/crm` — 7 bo'limni 1 scroll sahifaga jamlaydi (eng yaxlit ekran). Sub-komponentlar real SD API.

---

# QADAM 3 — MODUL UMUMIY

## Sahifa jadvali
| Sahifa | Holat | Asosiy muammo | Vizyon % |
|---|---|---|---|
| CRM Workspace | 🟡 | QuickCreate 3/4 turi 400 | ~70 |
| AI CRM | 🟢 | ma'lumotsiz | bonus |
| CRM Funnel | 🔴 | 2 forma buzuq | ~50 |
| CRM RFM | 🟡 | tasodifiy soxta data | ~55 |
| CRM Cohort | 🟢 | ma'lumot kam | ~70 |
| CRM Activities | 🟢 | — | ~85 |
| CRM Settings | 🟡 | 4/5 tab placeholder | ~30 |
| Customer 360 | 🟢 | fayl yuklash yo'q | ~85 |
| SD Customers | 🟢 | fayl yuklash yo'q | ~85 |
| SD Quotations ×2 | 🟡 | narx yarim, QQS=0, dublikat | ~55 |
| SD Sales Orders | 🟡 | 2 buyurtma olami, line-item yo'q | ~60 |
| SAP Sales | 🟢 | ortiqcha (ikkilik) | — |
| SD Leads | 🟢 | 2 lid tizimi | ~70 |
| SD Contracts | 🟢 | PDF generatsiya yo'q | ~80 |
| SD Deliveries | 🟢 | — | ~75 |
| SD Payments | 🟡 | avans amount:0 | ~75 |
| SD Debitors | 🟢 | eslatma jo'natmaydi | ~75 |
| SD KPI | 🟡 | kvota jadval yo'q | ~50 |
| SD Settings | 🟢 | qiymat ishlatilmaydi | ~50 |
| SD Dashboard | 🟡 | bo'sh DB | — |
| SD Sales Mgmt (5→1) | 🟡 | forecast 404 | — |
| SD Extended (3→1) | 🟢 | monitoring | — |
| SD Europrint | 🟢 | aggregator | — |

**Jami: ~11 🟢 · ~9 🟡 · ~2 🔴.** Modul taxminan **~70% real ishlaydi** (sahifa darajasida).

## ⭐ ZANJIR MUAMMOLARI (eng muhim — "ballonsiz mashina")
1. 🔴 **2 LID TIZIMI** — `crm_leads`(5) ╳ `sd_leads`(0) bog'lanmagan
2. 🔴 **2 BUYURTMA OLAMI** — `sd_sales_orders`(12) ╳ `sales_orders`(12), FK yo'q. Konversiyadan kelgan buyurtma SD ekranida ko'rinmaydi
3. 🔴 **BUYURTMA→ISHLAB CHIQARISH UI ULANMAGAN** — Phase 4 fan-out kodi bor (sd_order_departments + ow_*), lekin SD buyurtma sahifasida departament tanlash YO'Q; order-* sahifalar boshqa olam (ow_orders/papka_orders)
4. 🟡 **Narx formulasi ulanmagan** — SD Settings qiymatlari taklif kalkulyatorida ishlatilmaydi

## DB MUAMMOLARI
- ❌ **`sd_kpi_targets` jadval YO'Q** (SD KPI kvota buzuq)
- ⚠️ **`sd_sales_orders` ╳ `sales_orders`** — 2 jadval (two-worlds tahlilida: sales_orders kanonik + sd_sales_orders VIEW; lekin SD repo va konversiya turli jadvalga yozadi)
- ⚠️ **Taklif dublikat sahifa** (/sd/quotations ╳ /sd/sales-quotes, 1 jadval)
- ⚠️ **8 redirect-alias** (/crm/* → /crm-workspace) + 5→1 (Sales Mgmt) + 3→1 (Extended) — menyu shishirilgan

## ⭐ ENG MUHIM 5 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **2 buyurtma + 2 lid olami** — kanonik tanlash (two-worlds qaroriga bog'liq). Bu zanjirning yuragi.
2. 🔴 **QuickCreateModal 3/4 turi 400** — kanbanda bitim/kontakt/kompaniya qo'shilmaydi (arzon kod-fix: maydon nomi)
3. 🔴 **CRM Funnel 2 forma + CRM email + Comms jim yolg'on** — foydalanuvchi aldanadi
4. 🟡 **Narx formulasi yarim** — o'lcham/karton/bosma ulanmagan + QQS=0
5. 🟡 **Buyurtma→ishlab chiqarish UI ulanmagan** — SD'dan ishlab chiqarishga avtomatik o'tmaydi

## ESKI 5 "JIM BUG" — qayta tekshiruv (4 tuzatilgan)
| Eski da'vo | Hozir |
|---|---|
| SAP create soxta | ❌ TUZATILGAN |
| To'lov fi_payments noto'g'ri | ❌ TUZATILGAN (sd_payments) |
| Shartnoma POST yo'q | ❌ NOTO'G'RI (real) |
| Taklif Approve yolg'on | ❌ NOTO'G'RI (real zanjir) |
| Dashboard 0 | 🟡 QISMAN (bo'sh DB) |

> Hech narsa o'zgartirilmadi (read-only). Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
