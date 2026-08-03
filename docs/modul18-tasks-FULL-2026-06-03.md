# MODUL 18 — VAZIFALAR (Task / Kanban) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Vazifalar (topshiriqlar) tizimi — vazifa yaratish, odamlarga biriktirish, muddat,
> holat (ochiq/jarayonda/bajarildi), eslatmalar, vazifa doskalari. Vazifalar qo'lda YOKI boshqa modullar
> tomonidan avtomatik yaratilishi mumkin (masalan, kam qoldiq → xarid vazifasi).

> ⭐⭐ **BIR JUMLALI XULOSA:** Asosiy vazifa doskasi (Kanban) HAQIQATAN ishlaydi — vazifa qo'shasiz,
> odamga biriktirasiz, ustunlar bo'ylab ko'chirasiz, bajarildi deb belgilaysiz, hammasi saqlanadi.
> LEKIN ikkita kamchilik: (1) butun kompaniya uchun YAGONA vazifa ro'yxati yo'q — har bo'limda o'z
> alohida vazifasi, (2) "faqat mening jamoam vazifalari" filtri faqat ko'rinish uchun (aslida hech
> narsani yashirmaydi).

> **DB holati:** kanban doskalari bor (2 doska, 10 ustun, 2 karta — DATA bor); yagona "tasks" jadvali YO'Q.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 3 ta asosiy vazifa sahifasi topdim** (+ boshqa modullarda tarqoq vazifa-ekranlar).

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | **Kanban doskasi** (asosiy) | /kanban |
| 2 | Koordinatsiya | /coordination |
| 3 | Strategik vazifalar | /strategic-tasks, /europrint/strategic |

**Tarqoq vazifa-ekranlar (boshqa modullarda):** Ishga olish kanbani (HR), Ishchi tayinlash (MES), CRM follow-up aktivliklari — har biri o'z "vazifasi" bilan.

---

# 2-QADAM — HAR SAHIFA

## 🟢 1. KANBAN DOSKASI — `/kanban` (KanbanBoard.tsx) ⭐ ASOSIY
**Nima uchun:** Vazifalarni doska ko'rinishida boshqarish — ustunlar (Yangi/Jarayonda/Bajarildi), kartalar (vazifalar), surib ko'chirish.
**Tugma — HAQIQATAN ISHLAYDI:**
- "Doska yaratish" → **REAL** (kanban-boards.controller:69 `POST boards`)
- "Ustun qo'shish/tahrir/o'chirish" → **REAL** (:79, :87, :98)
- "Karta (vazifa) yaratish" → **REAL** (:112 `POST cards`)
- "Kartani tahrirlash" → **REAL** (:120 `PUT cards/:id`)
- "Kartani ko'chirish" (ustunlar bo'ylab — holat o'zgartirish) → **REAL** (:127 `PUT cards/:id/move`)
- "Kartani o'chirish" → **REAL** (:134 `DELETE cards/:id`)
- "Odamga biriktirish" → **REAL** (create-task.command assigneeId; update-task assignedTo)
- "Shablon qo'llash" → **REAL** (:237 templates/apply)
- "Robot (avtomatlashtirish)" → **REAL** — masalan "nomzod 'Ishga olindi'ga o'tsa → onboarding vazifasini biriktir" (kanban-robot.service:38)
**Ma'lumot:** kanban_boards=2, kanban_columns=10, kanban_cards=2 (DATA bor).
**Holat:** 🟢.
**⚠️ Kamchilik:** "Rol filtri" (faqat mening jamoam) — **KOSMETIK** (useKanbanBoard.ts:43,95: roleFilter o'qiladi, lekin filtrlashda ISHLATILMAYDI → hech narsani yashirmaydi).
**Foydalanuvchi nima qila olmaydi:** Hammasi ishlaydi, LEKIN "faqat mening jamoam vazifalari" filtri aslida ishlamaydi (har kim hamma kartani ko'radi — maxfiylik illuziyasi).

## 🟢 2. KOORDINATSIYA — `/coordination` (CoordinationPage.tsx)
**Nima uchun:** Hujjat oqimi (3-savat: kiruvchi/kutish/chiquvchi), dokladlar, farmoyishlar.
**Tugma:** `/coordination/baskets` (3-savat — real), `/dokla` (dokladlar — real), `/rasporyazhenie` (farmoyishlar — real), `/stats`.
**Holat:** 🟢 (real). **Foydalanuvchi nima qila olmaydi:** Ishlaydi (hujjat oqimi real).

## 🟡 3. STRATEGIK VAZIFALAR — `/strategic-tasks` (StrategicTasksPanel.tsx)
**Nima uchun:** Direktor darajasidagi strategik vazifalar (OKR-ga o'xshash).
**Tugma:** Vazifa/kategoriya yaratish → **REAL** (`/strategic/tasks`, `/categories`). Dashboard, seed.
**Holat:** 🟡 (real, lekin alohida strategik vazifa tizimi — kanbandan ajralgan).
**Foydalanuvchi nima qila olmaydi:** Strategik vazifa real, lekin kanban bilan bog'lanmagan (alohida ro'yxat).

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Kanban doskasi | 🟢 | rol filtri kosmetik | ~80 |
| Koordinatsiya | 🟢 | — | ~75 |
| Strategik vazifalar | 🟡 | kanbandan ajralgan | ~55 |

**Jami: 2 🟢 · 1 🟡 · 0 🔴 → taxminan ~70% haqiqatan ishlaydi.**

## ⭐ VIZYON — asosiy talablar
| Talab | Holat | Sodda izoh |
|---|---|---|
| **Vazifa yaratish/biriktirish/holat/muddat** | 🟢 | Kanban'da hammasi real |
| **Vazifa doskalari** | 🟢 | Doska/ustun/karta real, DATA bor |
| **Boshqa modullardan AVTOMATIK vazifa** | 🟡 | "Robot" mexanizmi bor (doska ichida sozlanadi), lekin modullararo avtomatik emas |
| **Maxfiylik (faqat tegishli vazifalar)** | 🔴 | Rol filtri kosmetik — hech narsani yashirmaydi |

## ⭐ ZANJIR / FRAGMENTATSIYA MUAMMOSI (sodda)
- **Boshqa modullardan avtomatik vazifa:** 🟡 QISMAN — kanban "robot"i bor (masalan nomzod ishga olinsa → onboarding vazifasi avtomatik biriktiriladi, kanban-robot.service:38). LEKIN bu doska ichida qo'lda sozlanadi; "kam qoldiq → xarid vazifasi", "QC brak → rework vazifasi" kabi modullararo avtomatik yaratish ulanmagan
- **⚠️ VAZIFALAR TARQOQ:** Butun kompaniya uchun YAGONA vazifa ro'yxati YO'Q. Har modul o'z "vazifasi" bilan:
  - kanban_cards (Kanban doskasi)
  - crm_activities (CRM follow-up)
  - strategic_tasks (Strategik)
  - hr_candidate_funnels (HR ishga olish)
  - MES ishchi tayinlash
  Demak xodim "mening hamma vazifalarim"ni bitta joyda ko'ra olmaydi — ular 5 xil joyda

## DB MUAMMOLARI (sodda)
- ❌ **Yagona `tasks` jadvali YO'Q** — vazifalar 5 xil jadvalga tarqalgan
- ✅ kanban (doska/ustun/karta) jadvallari bor (DATA bilan: 2/10/2)
- ⚠️ Rol filtri kodda bor, lekin ishlatilmaydi (kosmetik)

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. ⚠️ **Vazifalar tarqoq** — yagona vazifa ro'yxati yo'q, har modul o'z vazifasi bilan (xodim hammasini bir joyda ko'ra olmaydi)
2. 🔴 **Rol filtri kosmetik** — "faqat mening vazifalarim" aslida ishlamaydi (maxfiylik illuziyasi)
3. 🟡 **Modullararo avtomatik vazifa cheklangan** — robot bor, lekin kam qoldiq/QC brak avtomatik vazifa yaratmaydi
4. 🟡 **Strategik vazifa kanbandan ajralgan** — alohida ro'yxat

---

## XULOSA (egasiga)
Vazifalar moduli (Kanban) — asosan ishlaydi: vazifa yaratish, biriktirish, ustunlar bo'ylab ko'chirish, bajarildi belgilash — hammasi real saqlanadi, va data bor (2 doska, 2 karta). Robot-avtomatlashtirish ham bor (masalan nomzod ishga olinsa onboarding vazifasi biriktiriladi).

LEKIN ikkita kamchilik: (1) **butun kompaniya uchun yagona vazifa ro'yxati yo'q** — vazifalar 5 xil joyda tarqoq (Kanban, CRM, Strategik, HR, MES), xodim hammasini bir joyda ko'ra olmaydi; (2) **"faqat mening jamoam" filtri kosmetik** — aslida hech narsani yashirmaydi.

Metafora: ofisda haqiqiy ishlaydigan doska bor — vazifani yopishtirasiz, odamga biriktirasiz, ustunlar bo'ylab ko'chirasiz, hammasi saqlanadi. Lekin butun korxona uchun bitta umumiy vazifa ro'yxati yo'q — har bo'limning o'z doskasi, va "faqat mening jamoam vazifalari" tugmasi shunchaki ko'rinish uchun (hech narsani yashirmaydi).

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
