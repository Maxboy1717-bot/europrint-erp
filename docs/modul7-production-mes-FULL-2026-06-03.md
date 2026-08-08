# MODUL 7 — ISHLAB CHIQARISH (Sex / MES) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Sex (ishlab chiqarish maydoni) — hozir NIMA, QAYSI mashinada, QAYSI smenada
> ishlab chiqarilayotganini kuzatadi; to'xtashlarni (mashina to'xtaganda) va chiqarilgan mahsulotni
> qayd qiladi; mashina samaradorligini (OEE) o'lchaydi.

> ⭐⭐ **BIR JUMLALI XULOSA:** Sex ekranlari bor va sozlash qismi ishlaydi (mashina, ish markazi,
> jihoz), LEKIN 3 ta katta muammo: (1) **samaradorlik (OEE) raqamlari SOXTA** — har doim bir xil,
> haqiqiy mashinadan emas; (2) **operator planshetdan ishni qayd qila olmaydi** (tugma "tayyor emas");
> (3) sexga **haqiqiy ish kelmaydi** (oldingi modullar zanjiri uzilgan).

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 14 ta sex/ishlab chiqarish sahifasi topdim.**

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | MES bosh panel | /mes/dashboard-home |
| 2 | To'xtashlar (downtime) | /mes/downtimes |
| 3 | Ish markazlari (mashinalar) | /mes/work-centers |
| 4 | Ishchi tayinlash | /mes/workers |
| 5 | MES mahsulotlar | /mes/products |
| 6 | **MES kengaytirilgan** | ⭐ **7 menyu havola → bitta sahifa** (gamification, mashina normalari, ta'mir so'rovi, OEE monitor, sabab jurnali, smena topshirish, zona boshqaruvi) |
| 7 | Jihozlar | /equipment |
| 8 | Mashina holati | /machine-status-current + /machine-status-logs (2→1) |
| 9 | ERP ishlab chiqarish | /erp-production |
| 10 | Ishlab chiqarish faktlari | /production-facts |
| 11 | Ishlab chiqarish hisoboti | /production/orders |
| 12 | Smena hisobotlari | /production/shift-reports |
| 13 | OEE jonli monitor | /pp/oee-monitor |
| 14 | Buyurtma 360 | /production/orders/:id |

**Jadvallar:** Asosiy jadvallar bazada BOR (mes_sessions, production_sessions, downtime_events, ish markazlari, jihozlar), lekin **hammasi BO'SH (0 yozuv)**. Ikkita jadval YO'Q (pastda).

---

# 2-QADAM — HAR SAHIFA

## 🟢 3. ISH MARKAZLARI (mashinalar) — `/mes/work-centers` (MESWorkCenters.tsx)
**Nima uchun:** Sex menejeri mashinalarni (ish markazlarini) ro'yxatga oladi — Flekso, Ofset va h.k.
**Tugma:**
- "Ish markazi yaratish" → **HAQIQIY ISHLAYDI** — bazaga yozadi (`/pp/work-centers`, real)
**Holat:** 🟢. **Foydalanuvchi nima qila olmaydi:** Hozircha ishlaydi.

## 🟢 7. JIHOZLAR — `/equipment` (EquipmentPage.tsx)
**Nima uchun:** Sex jihozlari ro'yxati va boshqaruvi.
**Tugma:** Yaratish/tahrirlash → **HAQIQIY ISHLAYDI** (`/mro/equipment`, real).
**Holat:** 🟢.

## 🟢 11,12. ISHLAB CHIQARISH + SMENA HISOBOTLARI — `/production/orders`, `/production/shift-reports`
**Nima uchun:** Ishlab chiqarish va smena hisobotlarini ko'rsatadi, Excel'ga chiqaradi.
**Tugma:** Ko'rish + Excel eksport → **HAQIQIY** (`/production/orders`, production-reports.controller:79).
**Holat:** 🟢 (lekin hisobot uchun data bo'sh).

## 🔴 13. OEE JONLI MONITOR — `/pp/oee-monitor` + MESExtended OEE tab ⭐ MUHIM
**Nima uchun:** Mashina samaradorligini (OEE = mavjudlik × ishlash × sifat) jonli ko'rsatadi — sexning eng muhim ko'rsatkichi.
**⚠️ KATTA MUAMMO — RAQAMLAR SOXTA:**
- OEE raqamlari **QATTIQ YOZILGAN** — har doim 0.92 (mavjudlik), 0.85 (ishlash), 0.97 (sifat). Haqiqiy mashinadan o'qilmaydi (production-agent.service.ts:111-119). Kodning O'ZIDA izoh bor: "WHY calculateOEE RETURNS HARDCODED 0.92/0.85/0.97 (TODO)" (:34)
**Holat:** 🔴 (raqamlar ko'rinadi, lekin SOXTA — har doim bir xil).
**Foydalanuvchi nima qila olmaydi:** Mashinaning HAQIQIY samaradorligini ko'ra olmaydi — ekran har doim bir xil soxta raqamlarni (92%/85%/97%) ko'rsatadi.

## 🟡 1. MES BOSH PANEL — `/mes/dashboard-home` (MESHomeDashboard.tsx)
**Nima uchun:** Sex umumiy ko'rinishi — sessiyalar, to'xtashlar, statistika.
**Tugma/forma:** Ko'rish — LEKIN `/iot/production-sessions` (planshet) ma'lumotidan o'qiydi, u esa bo'sh/stub.
**Holat:** 🟡 (ko'rsatadi, lekin data yo'q).

## 🟡 2. TO'XTASHLAR (DOWNTIME) — `/mes/downtimes` (MESDowntimes.tsx)
**Nima uchun:** Mashina to'xtaganda sababini qayd qiladi (nega to'xtadi, qancha vaqt).
**Tugma:** To'xtash qayd qilish → ikki yo'l bor: `/mes/sessions/.../downtime` (HAQIQIY) ╳ planshet `/iot/.../downtime` (stub). MES sahifasi `/iot/downtime-events` o'qiydi.
**⚠️ Jadval muammosi:** `mes_downtime_events` jadval bazada **YO'Q** (bir yo'l shu jadvalga yozmoqchi → xato).
**Holat:** 🟡 (bir yo'l ishlaydi, ikkinchisi jadvalsiz).
**Foydalanuvchi nima qila olmaydi:** Ba'zi to'xtash qayd yo'llari ishlamaydi (jadval yo'q).

## 🟡 4. ISHCHI TAYINLASH — `/mes/workers` (MESWorkerAssignments.tsx)
**Nima uchun:** Qaysi ishchi qaysi mashinada/smenada ishlashini belgilaydi.
**Tugma:** `/iot/production-sessions`, `/mes` — planshet sessiyasiga bog'liq (stub).
**Holat:** 🟡.

## 🟡 6. MES KENGAYTIRILGAN — 7 havola→1 (MESExtended.tsx)
**Nima uchun:** 7 xil funksiya (o'yinlashtirish, mashina normalari, ta'mir so'rovi, OEE, sabab jurnali, smena topshirish, zona) bitta sahifada.
**⚠️ Muammolar:**
- **Smena topshirish (smena-handover)** → mashina jadvalida kerakli ustun (`incoming_supervisor`) **YO'Q** → xato (503). Bazada faqat `received_by` ustuni bor, kod boshqasini kutadi
- **Ta'mir so'rovi (maintenance)** → kerakli ustunlar yo'q → xato (503)
- **OEE tab** → soxta raqamlar (yuqorida)
**Holat:** 🟡/🔴 (7 funksiyadan bir nechtasi xato beradi).
**Foydalanuvchi nima qila olmaydi:** Smenani topshira olmaydi (xato) va ta'mir so'rovi yubora olmaydi (ekranning ma'lumoti bazaga mos kelmaydi); 7 funksiya bitta sahifada chalkash.

## 🟡 ⚠️ OPERATOR PLANSHETI (asosiy sex kirish nuqtasi) — 501 (eng muhim)
Sex operatorlari ishni PLANSHETDAN qayd qiladi (ish boshlash, to'xtash, brak, material). Lekin planshet oqimi BUTUNLAY "tayyor emas":
- "Ishlab chiqarishni boshlash" (planshet) → **ISHLAMAYDI** (`POST /iot/production-sessions` → "tayyor emas", iot-tablet.controller:176-179)
- "Sessiyalar ro'yxati", "Smena", "Smena topshirish" (planshet) → **ISHLAMAYDI** (501, :97-150)
- "Material skaneri" (planshet) → **ISHLAMAYDI** (501, :159)
**Foydalanuvchi nima qila olmaydi:** Operator planshetdan ishni boshlay/qayd qila olmaydi — sexning asosiy kirish nuqtasi tayyor emas.

## 🟡 5,8,9,10,14. MES Products, Mashina holati, ERP Production, Ishlab chiqarish faktlari, Buyurtma 360
Asosan ko'rish sahifalari — ba'zilari haqiqiy o'qiydi, lekin data bo'sh. (Ishlab chiqarish faktlari avval xato berardi — material nom-muammosi tuzatilgan; mashina holati 2 havola→1.) Hammasi 🟡.

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Ish markazlari | 🟢 | — ishlaydi | ~80 |
| Jihozlar | 🟢 | — ishlaydi | ~80 |
| Ishlab chiqarish/smena hisoboti | 🟢 | data bo'sh | ~70 |
| **OEE monitor** | 🔴 | **raqamlar soxta** | ~15 |
| MES bosh panel | 🟡 | planshet datasi yo'q | ~50 |
| To'xtashlar | 🟡 | bir jadval yo'q | ~55 |
| Ishchi tayinlash | 🟡 | planshetga bog'liq | ~50 |
| MES kengaytirilgan (7→1) | 🟡 | smena/ta'mir xato | ~40 |
| **Operator planshet oqimi** | 🔴 | **ishlash boshlash 501** | ~10 |
| Boshqalar (5,8,9,10,14) | 🟡 | data bo'sh | ~50 |

**Jami: 3 🟢 · 9 🟡 · 2 🔴 → taxminan ~50% haqiqatan ishlaydi.**

## ⭐ VIZYON — 5 asosiy talab
| Talab | Holat | Sodda izoh |
|---|---|---|
| **Ishlab chiqarish buyurtmalari** (haqiqiy ish) | 🟡 | Yo'l bor (/mes/sessions real), lekin haqiqiy ish kelmaydi + planshet 501 |
| **Smena boshqaruvi** | 🟡 | Hisobot real, lekin smena topshirish ustun-muammosi (503) |
| **To'xtash qayd qilish** | 🟡 | Bir yo'l real, bir jadval yo'q + planshet 501 |
| **Jihoz/mashina kuzatuvi** | 🟢 | Ishlaydi |
| **OEE (samaradorlik)** | 🔴 | SOXTA — qattiq yozilgan raqamlar |

## ⭐ ZANJIR MUAMMOSI (eng muhim — sodda)
Sex 3 narsani olishi kerak, lekin uchalasi ham muammoli:
1. 🔴 **Haqiqiy ish (Rejalashtirishdan)** — 6-modulda ko'rdik: reja motori ishlaydi, lekin yoqilg'i yo'q → sexga haqiqiy ish kelmaydi
2. 🔴 **Operator kirishi (planshet)** — planshetdan ishni qayd qilish 501 (tayyor emas) → operator ishlay olmaydi
3. 🟡 **Omborga/Sifatga qaytarish** — tugagan mahsulot omborga, sifatga — bu ham to'liq ulanmagan (4-modulda QC qaror soxta edi)

➡️ **Sex zanjirning navbatdagi uzilgan halqasi:** haqiqiy ish kelmaydi (Reja), operator kirita olmaydi (planshet stub), va samaradorlik soxta (OEE qattiq yozilgan).

## JADVAL MUAMMOLARI (sodda)
- ❌ **`mes_downtime_events` jadval YO'Q** — ba'zi to'xtash qayd yo'llari xato
- ❌ **`mes_shift_handovers` jadvalida kerakli ustun yo'q** (`incoming_supervisor`) — smena topshirish xato (503)
- ❌ Ta'mir so'rovi jadvalida kerakli ustunlar yo'q (503)
- ✅ Asosiy jadvallar bor (sessiya, to'xtash, mashina, jihoz)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **OEE raqamlari soxta** — sexning eng muhim ko'rsatkichi har doim bir xil qattiq yozilgan raqam (92/85/97). Haqiqiy samaradorlik ko'rinmaydi
2. 🔴 **Operator planshet oqimi 501** — operator ishni boshlay/qayd qila olmaydi (sexning asosiy kirish nuqtasi)
3. 🟡 **Smena topshirish + ta'mir so'rovi xato** — ekran bazaga mos kelmaydi (ustunlar yo'q)
4. 🔴 **Sexga haqiqiy ish kelmaydi** — Rejalashtirish zanjiri uzilgan (6-modul)

---

## XULOSA (egasiga)
Sexning **sozlash qismi yaxshi** — mashinalar, ish markazlari, jihozlarni ro'yxatga olish va hisobotlar haqiqatan ishlaydi. LEKIN sexning **kunlik ishlashi** uch joyda buzuq:
- **Samaradorlik (OEE) raqamlari soxta** — har doim bir xil (92%/85%/97%), haqiqiy mashinadan emas
- **Operator planshetdan ish qayd qila olmaydi** — eng asosiy tugma "tayyor emas"
- **Sexga haqiqiy ish kelmaydi** — oldingi modullar (Savdo→Reja) zanjiri uzilgan

Metafora: zavod binosi va mashinalari joyida turibdi, lekin ishchilar mashina yonidagi tugmani bosib ishni boshlay olmaydi, va tablodagi samaradorlik raqami har doim bir xil (haqiqiy emas).

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
