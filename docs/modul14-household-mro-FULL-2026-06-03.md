# MODUL 14 — XO'JALIK / AHO (MRO — ta'mir-xo'jalik) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Zavodning umumiy/xo'jalik ishlari (AHO) — bino va jihozlar ta'miri, korxona
> transporti, ofis kerak-yarog'i va sarflanadigan materiallar, oshxona, tozalash, kommunal hisoblar.
> Zavodni yuritishning kundalik "uy ishlari".

> ⭐⭐ **BIR JUMLALI XULOSA:** Yarmi ishlaydi — jihozlarni ro'yxatga olish, ta'mir so'rovi yaratish va
> xo'jalik materiallarini qayd qilish HAQIQATAN ishlaydi. LEKIN ko'p xo'jalik bo'limi (oshxona,
> tozalash, kommunal, bino inventari) faqat KO'RISH ekrani — ularning bazada jadvali ham yo'q, demak
> bo'sh/ishlamaydi.

> **DB holati:** jihoz + xo'jalik-inventar jadvallari bor (bo'sh); oshxona/kommunal/transport/bino jadvallari YO'Q.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 8 ta xo'jalik (MRO) sahifasi topdim.**

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | MRO paneli | /mro/dashboard, /integration/mro |
| 2 | Bino/ofis inventari | /mro/building-inventory, /mro/office-inventory (2 havola → 1 sahifa) |
| 3 | Tozalash jadvali | /mro/cleaning |
| 4 | Oshxona boshqaruvi | /mro/kitchen |
| 5 | Profilaktik ta'mir | /mro/preventive |
| 6 | Ehtiyot qismlar | /mro/spare-parts |
| 7 | Kommunal o'qishlar | /mro/utilities |
| 8 | **MRO kengaytirilgan** | /mro/expense-control + /mro/sanitation + /mro/uniforms (**3 havola → 1 sahifa**) |

> Eslatma: Mashina/jihoz ta'miri shu yerda (MRO), lekin ishlab chiqarish mashinalari MES modulida ham ko'rinadi (7-modul) — ikkalasi `mro_equipment` jadvalini ulashadi.

---

# 2-QADAM — HAR SAHIFA

## 🟡 1. MRO PANELI — `/mro/dashboard` (MRODashboard.tsx)
**Nima uchun:** Xo'jalik bo'limi umumiy ko'rinishi — so'rovlar, jihozlar, materiallar, statistika.
**Tugma:**
- "Ta'mir/xizmat so'rovi yaratish" → **HAQIQATAN ISHLAYDI** — bazaga yozadi (`POST /integration/mro/requests`, integration-mro.controller:71, real `createRequest`)
- "Material (item) qo'shish" → **REAL** (:52 `POST /items`)
- Ko'rish: so'rovlar, jihozlar, statistika (real o'qiydi)
**Ma'lumot:** mro_inventory/mro_equipment jadval bor, bo'sh (0).
**Holat:** 🟡 (so'rov/material yaratish real, lekin data bo'sh).
**Foydalanuvchi nima qila olmaydi:** So'rov yarata oladi, lekin data hali bo'sh (ko'rsatadigan kam).

## 🟢 JIHOZLAR (MRO panel ichida + MES ulashadi)
**Tugma:**
- "Jihoz qo'shish" → **REAL** (mro.controller:218 `POST equipment`, createEquipment)
- "Jihoz holatini o'zgartirish" → **REAL** (:228 `PATCH equipment/:id/status`)
- "Mashinani to'xtatish" → **REAL** (:111 `POST /stop-machine`)
**Holat:** 🟢. **Foydalanuvchi nima qila olmaydi:** Ishlaydi.

## 🔴 4. OSHXONA BOSHQARUVI — `/mro/kitchen` (CanteenManagementPage)
**Nima uchun:** Oshxona/ovqatlanish boshqaruvi (egasi vizyonida: povar podotcheti, menyu, ovqatlanuvchilar soni).
**Tugma:** Faqat "statistika ko'rish" (`GET /mro/canteen/stats`, mro.controller:169) — yaratish/forma YO'Q.
**Ma'lumot:** Oshxona jadvali (canteen_meals) **bazada YO'Q** → statistika bo'sh/ishlamaydi.
**Holat:** 🔴 (faqat bo'sh statistika ekrani).
**Foydalanuvchi nima qila olmaydi:** Oshxonani umuman boshqara olmaydi — menyu/ovqatlanuvchi/povar podotcheti uchun joy yo'q (faqat bo'sh statistika).

## 🔴 7. KOMMUNAL O'QISHLAR — `/mro/utilities` (UtilityReadingsPage)
**Nima uchun:** Suv/elektr/gaz hisoblagichlari o'qishlarini qayd qilish.
**Tugma:** Faqat "o'qishlar ko'rish" (`GET /mro/utility/readings`, mro.controller:201) — qayd qilish YO'Q.
**Ma'lumot:** Kommunal jadvali (utility_readings) **bazada YO'Q** → bo'sh.
**Holat:** 🔴. **Foydalanuvchi nima qila olmaydi:** Hisoblagich o'qishini qayd qila olmaydi (saqlaydigan joy yo'q).

## 🟡 2,3,5,6. BINO INVENTARI / TOZALASH / PROFILAKTIK TA'MIR / EHTIYOT QISMLAR
**Nima uchun:** Bino inventari, tozalash jadvali, davriy ta'mir rejasi, ehtiyot qismlar.
**Tugma:** Hammasi faqat **KO'RISH** (`GET /mro/facilities`, `/cleaning/schedules`, `/pm/schedules`, `/spare-parts`) — yaratish/forma ko'rinmaydi.
**Ma'lumot:** Bino/kommunal jadvallari (facility_inventory, fleet) **YO'Q**; ehtiyot qism/tozalash mro_inventory'dan o'qiydi (bo'sh).
**Holat:** 🟡 (o'qish real, lekin data yo'q/jadval yo'q, qayd qilish yo'q).
**Foydalanuvchi nima qila olmaydi:** Bino inventari/tozalash/ta'mir jadvalini bu ekranlardan yarata/saqlay olmaydi (faqat ko'rish).

## 🟡 8. MRO KENGAYTIRILGAN — 3 havola→1 (xarajat nazorati / sanitariya / formalar)
**Holat:** 🟡 (ko'p funksiya bitta sahifada, asosan ko'rish).

## ⚠️ TRANSPORT / YOQILG'I (alohida joyda)
Korxona transporti (mashina/yoqilg'i) bu modulda emas, MM/Logistika panelida — u yerda ba'zi tugmalar real, ba'zilari "tayyor emas" (9-modulda ko'rdik: fleet/maintenance, fleet/deliveries 501).

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| MRO paneli (so'rov/material) | 🟡 | data bo'sh | ~55 |
| Jihozlar | 🟢 | — (yaratish real) | ~75 |
| **Oshxona** | 🔴 | jadval yo'q, faqat statistika | ~10 |
| **Kommunal o'qishlar** | 🔴 | jadval yo'q, qayd yo'q | ~10 |
| Bino inventari (2→1) | 🟡 | faqat ko'rish | ~35 |
| Tozalash jadvali | 🟡 | faqat ko'rish | ~35 |
| Profilaktik ta'mir | 🟡 | faqat ko'rish | ~35 |
| Ehtiyot qismlar | 🟡 | faqat ko'rish | ~40 |
| MRO kengaytirilgan (3→1) | 🟡 | ko'rish-asosiy | ~30 |

**Jami: 1 🟢 · 6 🟡 · 2 🔴 → taxminan ~35% haqiqatan ishlaydi.**

## ⭐ VIZYON — asosiy talablar
| Talab | Holat | Sodda izoh |
|---|---|---|
| **Ta'mir/xizmat so'rovi** | 🟢 | So'rov yaratish real |
| **Jihozlar** | 🟢 | Qo'shish/holat real |
| **Transport/yoqilg'i** | 🟡 | MM/Logistikada, qism 501 |
| **Ofis kerak-yarog'i (sarflanadigan)** | 🟡 | MRO-inventar real, lekin omborга ulanmagan |
| **Oshxona** | 🔴 | Jadval yo'q — boshqarib bo'lmaydi |
| **Tozalash** | 🟡 | Faqat ko'rish |
| **Kommunal** | 🔴 | Jadval yo'q — qayd qilib bo'lmaydi |

## ⭐ ZANJIR (sodda)
| Zanjir | Holat |
|---|---|
| **Material so'rovi → Ombor/Xarid** | 🔴 UZILGAN — MRO o'z inventari (mro_inventory) alohida, ombor (warehouse_stock) bilan bog'lanmagan |
| **Ta'mir xarajati → Moliya** | 🔴 UZILGAN — ta'mir narxi buxgalteriyaga avtomatik o'tmaydi |
| **Mashina to'xtadi → MRO** | 🟡 Bog'lanish bor (machine-stopped tinglovchi, machine-stopped.listener.ts:37) |

## DB MUAMMOLARI (sodda)
- ❌ **Oshxona, kommunal, bino, transport jadvallari YO'Q** (canteen_meals, utility_readings, facility_inventory, fleet_vehicles) — shu sahifalar bo'sh/ishlamaydi
- ✅ Jihoz (mro_equipment) + xo'jalik-inventar (mro_inventory) jadvallari bor (bo'sh)
- ⚠️ MRO inventari ombordan alohida (ikki xil material ombori)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **Oshxona + kommunal umuman ishlamaydi** — jadval yo'q, faqat bo'sh statistika ekrani
2. 🔴 **Material so'rovi omborga/xaridga ulanmagan** — MRO o'z alohida inventari (ikki material ombori)
3. 🟡 **Ko'p sahifa faqat ko'rish** — bino/tozalash/ta'mir jadvalini bu ekranlardan yaratib bo'lmaydi
4. 🔴 **Ta'mir xarajati moliyaga o'tmaydi**

---

## XULOSA (egasiga)
Xo'jalik (AHO) — yarmi ishlaydi: jihozlarni ro'yxatga olish, ta'mir/xizmat so'rovi yaratish, xo'jalik materialini qayd qilish haqiqatan ishlaydi. LEKIN ko'p xo'jalik bo'limi — **oshxona, kommunal hisoblar, bino inventari, tozalash** — faqat ko'rish ekrani, ularning bazada jadvali ham yo'q.

Va ulanish zaif: MRO o'z alohida material omboriga ega (asosiy ombordan ajralgan), ta'mir xarajati buxgalteriyaga o'tmaydi.

Metafora: xo'jalik idorasida ko'p eshik bor (jihoz, ta'mir, oshxona, kommunal, tozalash), lekin ko'pining orqasida shkaf yo'q — ta'mir so'rovi yozish va jihoz qo'shish ishlaydi, lekin oshxona, kommunal va tozalash ekranlari bo'sh oyna, saqlaydigan joyi yo'q.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
