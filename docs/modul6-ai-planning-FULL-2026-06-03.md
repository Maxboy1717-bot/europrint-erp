# MODUL 6 — AI REJALASHTIRISH (Ishlab Chiqarish Rejasi / PP) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Rejalashtirish miyasi — NIMANI, QANCHA, QACHON va QAYSI mashinada
> ishlab chiqarishni hal qiladi. Ichida: ishlab chiqarish rejasi (MPS), material hisobi (MRP),
> quvvat rejasi (CRP), talab bashorati, AI jadvallashtirish.

> ⭐⭐ **BIR JUMLALI XULOSA:** Rejalashtirish MOTORI qurilgan va haqiqatan hisoblaydi (MRP, MPS, CRP,
> jadval — hammasi ishlaydi), LEKIN **YOQILG'Isi yo'q** — unga haqiqiy buyurtma va retsept kelmaydi,
> shuning uchun ko'rsatadigan narsasi yo'q. Mashina yaxshi, lekin benzin quyilmagan.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 13 ta PP/rejalashtirish sahifasi topdim** (HR/logistika/MRO rejalashtirish — boshqa modul, sanalmadi).

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | Rejalashtirish doskasi | /planning |
| 2 | AI ishlab chiqarish rejasi | /ai-planning |
| 3 | AI ishlab chiqarish (2-versiya) | /ai-production-planning |
| 4 | Bashorat tahlili | /ai/forecast |
| 5 | Quvvat rejasi | /erp/pp/capacity |
| 6 | AI material bron | /pp/ai-reservation |
| 7 | Tor joy (bottleneck) tahlili | /pp/bottleneck |
| 8 | Quvvat hisobi (CRP) | /pp/crp |
| 9 | PP paneli | /pp/dashboard |
| 10 | Talab bashorati | /pp/demand-forecast |
| 11 | Material hisobi (MRP) | /pp/mrp |
| 12 | Shoshilinch buyurtmalar | /pp/rush-orders |
| 13 | AI smena boshqaruvi | /pp/shift-management |

**Jadvallar:** Reja jadvallari bazada BOR (ai_planning_plans, production_orders), lekin **hammasi BO'SH (0 yozuv)**.

---

# 2-QADAM — HAR SAHIFA

## 🟡 11. MATERIAL HISOBI (MRP) — `/pp/mrp` (MrpMatrix.tsx)
**Nima uchun:** Buyurtmalar uchun qancha material kerakligini hisoblaydi — "10000 quti uchun X kg qog'oz, Y kg kley kerak, omborda Z bor, qolganini sotib olish kerak".
**Tugma:**
- "MRP ishga tushirish" → **HAQIQIY HISOBLAYDI** — bazadagi buyurtma va retseptdan hisoblaydi (`/pp/mrp/run`, pp-intelligence.controller:49 → real `runMrp`)
**Ma'lumot:** Haqiqiy hisob, LEKIN bazada buyurtma/retsept bo'sh → natija ham bo'sh.
**Holat:** 🟡 (hisob haqiqiy, lekin yoqilg'i yo'q).
**Foydalanuvchi nima qila olmaydi:** Tugmani bosadi, lekin haqiqiy buyurtma/retsept kiritilmagani uchun bo'sh natija chiqadi.

## 🟡 8. QUVVAT HISOBI (CRP) — `/pp/crp` (CrpPage.tsx)
**Nima uchun:** Mashinalar bu rejaga bardosh bera oladimi — har mashinaning quvvati yetadimi yoki ortiqcha yuklanadimi.
**⭐ YAXSHI XABAR:** Avval bu sahifa xato berardi (mashina jadvalida "samaradorlik" ustuni yo'q edi). **Endi o'sha ustun bor** (`work_centers.efficiency_rate` bazada mavjud) — sahifa endi ishlashi kerak (pp-crp.service.ts:120).
**Holat:** 🟡 (hisob haqiqiy, samaradorlik ustuni endi bor; lekin reja/buyurtma bo'sh).
**Foydalanuvchi nima qila olmaydi:** Quvvatni hisoblaydi, lekin reja bo'sh bo'lgani uchun ko'rsatadigan yuk yo'q.

## 🟡 1. REJALASHTIRISH DOSKASI — `/planning` (PlanningBoard.tsx)
**Nima uchun:** Bosh rejalashtirish ekrani — buyurtmalarni mashinalarga va vaqtga taqsimlaydi.
**Tugma/forma:**
- "Jadval" va "Operatsiya yaratish" → **HAQIQIY ISHLAYDI** — bazaga yozadi (`/planning/schedule` pp-planning.controller:59; `/planning/operations` general-legacy-a:169 real qo'shadi)
- Ko'p ko'rish: MRP natijalari, ishlab chiqarish rejalari, ish markazlari, papka buyurtmalari (`/erp/mrp-results`, `/erp/production-plans`, `/papka-orders` — o'qiydi)
**Holat:** 🟡 (saqlash haqiqiy, lekin ko'rsatadigan buyurtma yo'q).
**Foydalanuvchi nima qila olmaydi:** Reja yaratishi mumkin, lekin haqiqiy buyurtmalar kelmagani uchun taqsimlash uchun ish yo'q.

## 🟢 6. AI MATERIAL BRON — `/pp/ai-reservation` (AIReservation.tsx)
**Nima uchun:** Buyurtma uchun materialni oldindan zaxiraga oladi (band qiladi), boshqa buyurtma o'sha materialni olib qo'ymasligi uchun.
**Tugma:**
- "Bron so'rovi yaratish" → **HAQIQIY ISHLAYDI** — bazaga yozadi (`/ai-reservation/request`, ai-reservation.controller:49 real)
- Ko'rish: so'rovlar, partiyalar, panel (hammasi real o'qiydi)
**Holat:** 🟢 (haqiqiy ishlaydi).
**Foydalanuvchi nima qila olmaydi:** Hozircha ishlaydi (bazada bron data hali yo'q).

## 🔴 7. TOR JOY (BOTTLENECK) TAHLILI — `/pp/bottleneck` (BottleneckAnalysisPage.tsx)
**Nima uchun:** Qaysi mashina/bosqich ishlab chiqarishni sekinlashtirayotganini ko'rsatadi.
**Tugma:**
- "Tahlil" → **SOXTA — har doim BO'SH qaytaradi** (`/ai/bottleneck/analysis` → `return { bottlenecks: [], analyzedAt: ... }`, ai.controller:169 — haqiqiy tahlil yo'q, har doim bo'sh ro'yxat)
**Holat:** 🔴 (ekran bor, tahlil soxta — har doim bo'sh).
**Foydalanuvchi nima qila olmaydi:** Tor joyni umuman ko'ra olmaydi — tugma har doim "tor joy yo'q" deb bo'sh javob qaytaradi (haqiqiy tahlil qilmaydi).

## 🔴 10. TALAB BASHORATI — `/pp/demand-forecast` (DemandForecastingPage.tsx)
**Nima uchun:** Kelajakda qancha mahsulot kerak bo'lishini bashorat qiladi (o'tgan sotuvlardan).
**Tugma:**
- "Bashorat" → **ISHLAMAYDI** (`/ai/forecast/demand` → "tayyor emas" javobi, ai.controller:181)
**Holat:** 🔴 (tugma "tayyor emas" deydi).
**Foydalanuvchi nima qila olmaydi:** Talab bashoratini umuman qila olmaydi — tugma "tayyor emas" javobini qaytaradi.

## 🟡 5. QUVVAT REJASI — `/erp/pp/capacity` (CapacityPlanning.tsx)
**Nima uchun:** Har mashinaning yuki va quvvatini rejalashtiradi (kalendar, smena).
**Tugma:** Ko'rish + yuk tahlili (`/erp/capacity`, `/load-analysis`, `/work-center-capacity`). ⚠️ `/erp/capacity` avval xato berardi (mashina-sessiya jadvallari mos kelmaydi). 
**Holat:** 🟡.
**Foydalanuvchi nima qila olmaydi:** Quvvatni ko'radi, lekin ba'zi qism mashina-data muammosi tufayli to'liq emas.

## 🟡 2,3. AI ISHLAB CHIQARISH REJASI — `/ai-planning` + `/ai-production-planning` (2 alohida sahifa)
**Nima uchun:** AI yordamida ishlab chiqarish jadvalini tuzadi.
**⚠️ G'alati:** AI rejalashtirish IKKITA alohida sahifada (AIProductionPlanningPage ╳ AIProductionPlanning) — bir xil ish uchun ikki ekran.
**Ma'lumot:** AI rejalashtirish hisobi kodda bor (Johnson qoidasi, kritik yo'l — matematik usul), lekin reja jadvali bo'sh (0).
**Holat:** 🟡 (hisob bor, data yo'q, 2 dublikat sahifa).
**Foydalanuvchi nima qila olmaydi:** AI reja tuzishi mumkin, lekin buyurtma yo'qligi uchun rejalaydigan narsa yo'q; qaysi sahifa asosiy ekani noaniq.

## 🟡 4. BASHORAT TAHLILI — `/ai/forecast` (ForecastAnalytics.tsx) — bashorat ko'rinishi (talab bashorati 501'ga bog'liq). 🟡
## 🟡 9. PP PANELI — `/pp/dashboard` (PPDashboard.tsx) — ishlab chiqarish statistikasi, faqat ko'rish (bo'sh data). 🟡
## 🟡 12. SHOSHILINCH BUYURTMALAR — `/pp/rush-orders` (RushOrderPage.tsx) — shoshilinch buyurtmalar ko'rinishi. 🟡
## 🟡 13. AI SMENA BOSHQARUVI — `/pp/shift-management` (AIShiftManagementPage.tsx) — smena rejasi. 🟡

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Material hisobi (MRP) | 🟡 | hisob real, data yo'q | ~60 |
| Quvvat hisobi (CRP) | 🟡 | endi ishlaydi, data yo'q | ~60 |
| Rejalashtirish doskasi | 🟡 | saqlaydi, buyurtma yo'q | ~55 |
| AI material bron | 🟢 | ishlaydi | ~75 |
| **Tor joy tahlili** | 🔴 | **soxta — har doim bo'sh** | ~10 |
| **Talab bashorati** | 🔴 | **ishlamaydi (tayyor emas)** | ~10 |
| Quvvat rejasi | 🟡 | qism mashina-data muammosi | ~55 |
| AI reja (×2 sahifa) | 🟡 | hisob bor, data yo'q, dublikat | ~50 |
| Bashorat tahlili | 🟡 | bashorat 501'ga bog'liq | ~40 |
| PP paneli | 🟡 | bo'sh data | ~50 |
| Shoshilinch buyurtmalar | 🟡 | bo'sh data | ~50 |
| AI smena | 🟡 | bo'sh data | ~50 |

**Jami: 1 🟢 · 9 🟡 · 2 🔴 → taxminan ~50% haqiqatan ishlaydi.**
⭐ MUHIM: Ko'p 🟡 — chunki HISOB MOTORI ishlaydi, lekin YOQILG'I (buyurtma/retsept) yo'q.

## ⭐ VIZYON — 4 asosiy talab
| Talab | Holat | Sodda izoh |
|---|---|---|
| **Ishlab chiqarish rejasi (MPS)** | 🟡 | Hisob real (oldingi ustun-muammo tuzatilgan), lekin buyurtma kelmaydi |
| **Material hisobi (MRP)** | 🟡 | Hisob real, retsept/buyurtma bo'sh |
| **Quvvat rejasi (CRP)** | 🟡 | Endi ishlaydi (samaradorlik ustuni qo'shildi), data bo'sh |
| **Talab bashorati** | 🔴 | Ishlamaydi (tayyor emas) |
| **AI jadvallashtirish** | 🟡 | Matematik hisob bor, data yo'q, 2 dublikat sahifa |

## ⭐ ZANJIR MUAMMOSI (eng muhim — sodda)
Rejalashtirish miyasi 3 narsadan oziqlanishi kerak, lekin uchalasi ham uzilgan:
1. 🔴 **Buyurtmalar (Savdodan)** — Savdo modulida "2 buyurtma jadvali" muammosi bor (tizim qaysi biri haqiqiy ekanini bilmaydi) → rejaga haqiqiy buyurtma to'liq kelmaydi
2. 🔴 **Retseptlar (Texnologiyadan)** — retsept yaratish ishlaydi, lekin hali bo'sh; texnik karta esa umuman ishlamaydi (5-modul) → rejaga material ma'lumoti kelmaydi
3. 🟡 **Ishlab chiqarishga uzatish (MES)** — reja MES'ga to'liq ulanmagan

➡️ **Natija:** Rejalashtirish motori (MRP, MPS, CRP) qurilgan va ishlaydi, lekin uch tomondan ham yoqilg'i kelmagani uchun BO'SH ishlaydi. Bu "ballonsiz mashina" muammosining markazi.

## JADVAL MUAMMOLARI (sodda)
- ✅ Reja jadvallari bor; "samaradorlik" ustuni (CRP uchun) ENDI qo'shilgan
- ❌ `mps_entries` jadval YO'Q (lekin MPS boshqa jadvaldan o'qiydi)
- Hammasi bo'sh (0 yozuv — qurilish bosqichi)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **Yoqilg'i yo'q (eng muhim)** — reja motori ishlaydi, lekin haqiqiy buyurtma (Savdo 2-jadval muammosi) va retsept (Texnologiya) kelmaydi. Avval Savdo va Texnologiya zanjirini ulash kerak
2. 🔴 **Tor joy tahlili soxta** — har doim bo'sh javob qaytaradi (haqiqiy tahlil yo'q)
3. 🔴 **Talab bashorati ishlamaydi** — "tayyor emas"
4. 🟡 **AI reja 2 dublikat sahifa** — qaysi biri asosiy noaniq

---

## XULOSA (egasiga)
Bu modul boshqalardan farq qiladi: **muammo "tugmalar soxta" emas** (ko'p tugma haqiqatan hisoblaydi — MRP, MPS, CRP, bron, jadval real ishlaydi). **Muammo — ularga ozuqa yo'q.** Rejalashtirish miyasi qurilgan, lekin:
- Savdodan haqiqiy buyurtma to'liq kelmaydi (2 buyurtma jadvali muammosi)
- Texnologiyadan retsept/texnik karta kelmaydi (5-modulda buzuq)
- Demak miya o'ylaydi, lekin o'ylaydigan narsasi yo'q

Qisqasi: **bu yerda tuzatish — yangi tugma yasash emas, balki Savdo va Texnologiyani Rejalashtirishga ULASH.** 2 ta tugma (tor joy, talab bashorati) esa haqiqatan soxta/ishlamaydi.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
