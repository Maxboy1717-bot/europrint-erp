# MODUL 5 — TEXNOLOGIYA — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Texnologiya bo'limi — har mahsulot QANDAY tayyorlanishini belgilaydi:
> retsept (ichiga nima ketadi), bosqichlar (qaysi mashinada qanday qilinadi), texnik kartalar (ish hujjati).

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 7 ta sahifa topdim** (lekin menyu havolalari ancha ko'p — pastda).

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | Texnologiya (asosiy) | /technology |
| 2 | Texnologiya paneli | /tech/dashboard-home |
| 3 | **Texnik kartalar** | /tech-cards, /tech/cards (2 havola → 1 sahifa) |
| 4 | **Texnik buyurtma tasdiqlash** | /tech-approval |
| 5 | **Retsept (BOM)** | /erp/pp/bom |
| 6 | **Bosqichlar (Routing)** | /erp/pp/routing |
| 7 | **Texnologiya kengaytirilgan** | ⭐ **13 menyu havola → bitta sahifa** (TechPPExtended.tsx) |

⭐ **Eng katta topilma:** 7-sahifa (TechPPExtended) ga **13 ta menyu havolasi** olib boradi — yetkazish kalkulyatori, energiya optimizatsiya, KPI, parallel jarayonlar, real-vaqt, "agar-shunday-bo'lsa", o'zgarish tarixi, mijoz talablari, narx optimizatsiya, mashina tanlash, material muqobillari, parallel buyurtmalar, vaqt-narx. **13 boshqa-boshqa nomdagi havola, lekin hammasi bitta sahifani ochadi** (chalkash).

**Jadvallar:** Texnologiyaning hamma jadvallari bazada BOR (texnik kartalar, retsept, bosqichlar) — lekin hammasi BO'SH (0 yozuv, hali qurilish bosqichi).

---

# 2-QADAM — HAR SAHIFA

## 🟢 5. RETSEPT (BOM) — `/erp/pp/bom` (BOMManagement.tsx)
**Nima uchun:** Texnolog har mahsulotning "retseptini" yozadi — bitta karton quti uchun qancha qog'oz, qancha kley, qancha bo'yoq ketishini belgilaydi.
**Tugmalar/forma:**
- "Retsept yaratish" + "Material qo'shish" → **HAQIQIY ISHLAYDI** — bazaga yozadi (`/erp/bom-headers`, `/erp/bom-items`). Maydonlar: mahsulot, material, miqdor, birlik.
**Ma'lumot:** bom_headers/bom_items jadvallari bor, hozir bo'sh (0).
**Holat:** 🟢 (haqiqiy saqlaydi).
**Vizyon (retsept):** ✅ ~85% — retsept yaratish va saqlash ishlaydi.
**Foydalanuvchi nima qila olmaydi:** Hozircha hammasi ishlaydi — faqat haqiqiy data hali kiritilmagan.

## 🟢 6. BOSQICHLAR (Routing) — `/erp/pp/routing` (RoutingConfiguration.tsx)
**Nima uchun:** Texnolog mahsulot qaysi bosqichlardan o'tishini belgilaydi — masalan: kesish → bosma → laminatsiya → quti yasash, har biri qaysi mashinada.
**Tugmalar/forma:**
- "Bosqich (routing) yaratish" + "Operatsiya qo'shish" → **HAQIQIY ISHLAYDI** — bazaga yozadi (`/erp/routings`, `/erp/routing-operations`). Maydonlar: mahsulot, ish markazi (mashina), operatsiya, vaqt.
**Ma'lumot:** routings/routing_operations jadvallari bor, bo'sh (0).
**Holat:** 🟢. **Vizyon (bosqichlar):** ✅ ~85%.
**Foydalanuvchi nima qila olmaydi:** Hozircha ishlaydi.

## 🟢 4. TEXNIK BUYURTMA TASDIQLASH — `/tech-approval` (TechApproval.tsx)
**Nima uchun:** Texnolog kelgan buyurtmaning texnik tomonini ko'rib, tasdiqlaydi yoki rad etadi (mahsulot texnik jihatdan tayyorlanishi mumkinmi).
**Tugmalar:**
- "Tasdiqlash" → **HAQIQIY ISHLAYDI** — bazaga yozadi (`/technology/orders/:id/approve`, technology.controller:85)
- "Rad etish" → **HAQIQIY ISHLAYDI** (`/technology/orders/:id/reject`, :94)
- "AI tekshiruvi" → **HAQIQIY** (`/orders/:id/ai-check`, :78)
- "AI texnik karta (prepress)" → **HAQIQIY** (`/ai-agents/prepress/tech-card`)
**Ma'lumot:** technology orders (bo'sh).
**Holat:** 🟢. **Vizyon:** ✅ tasdiqlash oqimi ishlaydi.
**Foydalanuvchi nima qila olmaydi:** Hozircha tasdiqlash/rad ishlaydi. (Lekin buyurtma jadvallari bo'sh, sinash uchun data yo'q.)

## 🔴 3. TEXNIK KARTALAR — `/tech-cards`, `/tech/cards` (TechCards.tsx, 2 havola→1)
**Nima uchun:** Har buyurtma uchun "texnik karta" — ishlab chiqarish uchun to'liq hujjat (qaysi material, qaysi mashina, qancha vaqt). Bu modulning mohiyati.
**Tugmalar — HAMMASI SOXTA (ishlamaydi):**
- "Texnik karta yaratish (generate)" → **SOXTA — ishlamaydi** (`/technology/cards/generate` → "tayyor emas" javobi qaytaradi, technology.controller:114)
- "Kartalar ro'yxati" → **SOXTA** (`/technology/cards` → "tayyor emas", :107)
- "Karta optimizatsiya" → **SOXTA** (`/cards/:id/optimize` → "tayyor emas", :128)
**Ma'lumot:** technology_cards jadval bazada BOR, lekin tugmalar unga ulanmagan (tugmalar "tayyor emas" deydi).
**Holat:** 🔴 (ekran ko'rinadi, lekin asosiy tugmalar ishlamaydi).
**Vizyon (texnik kartalar):** ❌ ~15% — karta yaratish butunlay ishlamaydi.
**Foydalanuvchi nima qila olmaydi:** Texnik kartani **umuman yarata olmaydi** — tugma "tayyor emas" deb javob qaytaradi, garchi jadval bazada tayyor bo'lsa ham (faqat ulanmagan).

## 🟡 1. TEXNOLOGIYA (asosiy) — `/technology` (Technology.tsx)
**Nima uchun:** Texnologiya bo'limi umumiy ko'rinishi — buyurtmalar va panel.
**Tugmalar:** Asosan ko'rish (`/technology/dashboard`, `/technology/orders` — HAQIQIY o'qiydi).
**Holat:** 🟡 (ko'rsatadi, lekin bo'sh data).
**Foydalanuvchi nima qila olmaydi:** Faqat ko'radi; bo'sh bo'lgani uchun ko'rsatadigan narsa kam.

## 🟡 2. TEXNOLOGIYA PANELI — `/tech/dashboard-home` (TechDashboard.tsx)
**Nima uchun:** Texnologiya boshqaruv paneli.
**⚠️ G'alati:** Bu panel DIZAYN ma'lumotini o'qiydi (`/api/design/orders`, `/design/statistics`, `/design/templates`) — texnologiya emas, dizayn raqamlarini ko'rsatadi.
**Holat:** 🟡 (dizayn datasini ko'rsatadi, texnologiya emas).
**Foydalanuvchi nima qila olmaydi:** Texnologiya paneli, lekin dizayn raqamlarini ko'rsatadi (chalkash).

## 🟡 7. TEXNOLOGIYA KENGAYTIRILGAN — 13 havola→1 (TechPPExtended.tsx)
**Nima uchun:** 13 xil funksiya (yetkazish kalkulyatori, energiya, KPI, mashina tanlash, material muqobillari va h.k.) bitta sahifada.
**Tugmalar:** Asosan ko'rish (`/technology-cards`, `/pp/production-orders`, `/mes/oee`, `/integration/shifts` — o'qiydi). 13 menyu havolasi bir sahifaga olib boradi.
**Holat:** 🟡 (ko'rish-asosiy, ko'p funksiya bitta sahifada).
**Foydalanuvchi nima qila olmaydi:** 13 alohida havola bosadi, lekin hammasi bir xil sahifani ochadi (har biri alohida ekran emas).

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Retsept (BOM) | 🟢 | — (ishlaydi) | ~85 |
| Bosqichlar (Routing) | 🟢 | — (ishlaydi) | ~85 |
| Texnik buyurtma tasdiqlash | 🟢 | — (ishlaydi) | ~80 |
| **Texnik kartalar** | 🔴 | **karta yaratish soxta (ishlamaydi)** | ~15 |
| Texnologiya (asosiy) | 🟡 | bo'sh data | ~60 |
| Texnologiya paneli | 🟡 | dizayn datasini ko'rsatadi | ~50 |
| Kengaytirilgan (13→1) | 🟡 | 13 havola bitta sahifa | ~40 |

**Jami: 3 🟢 · 3 🟡 · 1 🔴 → taxminan ~65% haqiqatan ishlaydi.**

## ⭐ VIZYON — 3 asosiy talab (BOM / Bosqich / Texnik karta)
| Talab | Holat | Sodda izoh |
|---|---|---|
| **Retsept (BOM)** | 🟢 ✅ | Mahsulot retseptini yaratish/saqlash ishlaydi |
| **Bosqichlar (Routing)** | 🟢 ✅ | Ishlab chiqarish bosqichlarini yaratish/saqlash ishlaydi |
| **Texnik kartalar** | 🔴 ❌ | Karta yaratish butunlay ishlamaydi (tugma "tayyor emas") |

## ⭐ ZANJIR MUAMMOSI (sodda)
- ✅ **Retsept va bosqichlar** ishlab chiqarish rejasiga kerakli asos — ular HAQIQIY ishlaydi (lekin hali bo'sh)
- 🔴 **Texnik karta** — buyurtma uchun to'liq ish hujjati — YARATIB BO'LMAYDI (tugma soxta). Bu zanjirning uzilgan halqasi: retsept va bosqich bor, lekin ulardan TEXNIK KARTA tuzib bo'lmaydi
- ⚠️ **Dizayn → Texnologiya → Ishlab chiqarish** — dizayn moduli tasdiqlangan dizaynni texnologiyaga avtomatik bermaydi (3-modulda ko'rilgan: dizayn handoff uzilgan)

## JADVAL MUAMMOLARI (sodda)
- ✅ Hamma jadval BAZADA BOR (retsept, bosqich, texnik karta) — yo'q jadval muammosi yo'q
- ⚠️ **Ikkita texnik karta jadvali** bor (`technology_cards` ╳ `tech_cards`) — bir xil narsa uchun ikki jadval (qaysi biri asosiy noaniq)
- Hamma jadval bo'sh (0 yozuv — qurilish bosqichi)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **Texnik karta yaratib bo'lmaydi** — modulning mohiyati. Tugma "tayyor emas" deydi, garchi jadval tayyor bo'lsa ham (faqat ulanmagan). Bu eng muhim
2. 🟡 **13 havola → 1 sahifa** — menyu shishirilgan, foydalanuvchi 13 alohida funksiya kutadi, bitta sahifa oladi
3. 🟡 **Texnologiya paneli dizayn datasini ko'rsatadi** — chalkash (texnologiya emas, dizayn raqamlari)
4. ⚠️ **Ikki texnik karta jadvali** — bir narsa uchun ikki joy

---

## XULOSA (egasiga)
Texnologiyaning **poydevori yaxshi:** retsept (har mahsulotga nima ketishi) va bosqichlar (qanday tayyorlanishi) — ikkalasi ham HAQIQATAN ishlaydi va saqlaydi. Buyurtma tasdiqlash ham ishlaydi.

**LEKIN modulning mohiyati — texnik karta — ishlamaydi.** Texnik karta = har buyurtma uchun to'liq ish hujjati (retsept + bosqich + vaqt birga). Uni yaratish tugmasi "tayyor emas" deb javob qaytaradi, garchi bazada joy tayyor bo'lsa ham — faqat tugma ulanmagan.

Qisqasi: g'isht (retsept, bosqich) bor, lekin undan uy (texnik karta) qura olmaysiz.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
