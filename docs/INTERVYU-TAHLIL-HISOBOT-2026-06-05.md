# EUROPRINT ERP — INTERVYU vs HAQIQAT TAHLILI (Faza 1, Agent 2 = Tahlilchi)
> Sana: 2026-06-05 | READ-ONLY (hech narsa o'zgartirilmadi — faqat o'qildi + bu hisobot)
> Maqsad: har interview talabini KOD + BAZA ga solishtirish — ishlaydimi yoki yo'q, va NEGA.
> Dalil: har holat fayl:qator yoki baza so'rovi bilan. Eski hisobotlar = yo'lboshchi, isbot EMAS (qayta tekshirildi).

---

## 0. MANBALAR HOLATI (verify-don't-trust — fayllar bormi?)

| Manba | Joy | Holat |
|---|---|---|
| EUROPRINT_BARCHA_JAVOBLAR.md (POS 60 + HR 200 + Org) | D:\kitob | ✅ bor (931 qator) |
| EUROPRINT-OMBOR-POS-KASSIR-MASTER-REJA.md | D:\kitob | ✅ bor (1878 qator) |
| EUROPRINT-INTERVYU-QARORLARI.md (har modul qarori) | D:\kitob | ✅ bor (327 qator) |
| EUROPRINT-ISHLAB-CHIQARISH-150-SAVOL.md | D:\kitob | ✅ bor (287) |
| EUROPRINT-ESKI-FAYL-50-SAVOL / QOLGAN-VIZYON / INVOYS-VIZYON / POS-IOT-CHAT | D:\kitob | ✅ bor |
| ombor-pos-master-plan / POS-MONITOR-INPUT / IOT-OPERATOR-TABLET | repo docs/ | ✅ bor |

**Hammasi mavjud (8 ta D:\kitob, 3 ta repo).**

---

## 1. ⭐⭐ MASTER XULOSA — eng muhim 3 strukturaviy topilma

### TOPILMA A — INTERVYU QISMAN (faqat 3 soha to'liq javob berilgan)
`INTERVYU-QARORLARI.md` da QAROR (kerak/birlashtir/tuzat/qur) FAQAT shularda tugagan:
- ✅ **Modul 1 (Savdo & CRM)** — to'liq qaror
- ✅ **Modul 2 (Marketing)** — to'liq qaror
- ✅ **Org-struktura** — to'liq qaror (markaziy)
- ❌ **Modul 3-20** — "kutilmoqda" (qaror YO'Q = **JAVOBSIZ** qaror darajasida)

Lekin SOHAVIY interview'lar bor: POS-60, HR-200, Ishlab-chiqarish-150, IoT/POS input maydonlari.
➡️ Demak Modul 3-20 ning "birlashtir/tuzat" qarorlari hali yo'q; faqat sohaviy talablar (POS/HR/ishlab-chiqarish) tekshiriladi.

### TOPILMA B — ⭐ ILDIZ ISHLARI ALLAQACHON BAJARILGAN (men kuzatdim + tasdiqladim)
`INTERVYU-QARORLARI.md` dagi "ILDIZ ISHLARI" (STEP 0/1/2/3) = aynan men butun sessiya watchdog bilan kuzatgan executor ishi:
- ✅ STEP 1 (Lid): sd_leads/leads → crm_leads (DROP VIEW + DDL + 8 fayl repoint) — **DB-isbot bilan tasdiqlandi**
- ✅ STEP 2 (Taklif): 2 sahifa → 1 (b84a7a70)
- ✅ STEP 3 (Buyurtma): A.1 director 0→12 (a1bb3ec5) + B lead→order convert (d0e723f3, crm_lead_id+FK)
- ⏳ 3 DEFERRED → "order/QC arxitektura intervyusi": production-order olami (A.4) · sd_sales_orders view (C) · QC verdict zanjiri (D)

### TOPILMA C — MARKAZIY PRINTSIP hali bog'lanmagan
Ega qarori: "Butun ERP org-strukturaga bog'lanadi" (master data, bitta manba = head_user_id). LEKIN:
- ⚠️ **manager_id 30/30 NULL** (baza tasdiqladi) — eskalatsiya/tasdiq zanjiri shunga tayanadi, hali bo'sh
- head_user_id master, manager_id avtomatik to'ldirilishi kerak — hali ulanmagan

---

## 2. MODUL 1 — SAVDO & CRM (to'liq tekshirildi, dalil bilan)

| # | Talab (manba: INTERVYU-QARORLARI Modul 1) | Holat | Dalil | Sabab |
|---|---|---|---|---|
| 1 | Lid: sd_leads + crm_leads → BITTA | **ISHLAYDI** | `to_regclass('sd_leads')`=YO'Q (DROP); crm_leads=5 kanonik | STEP 1 bajarilgan, sd_leads view o'chirilgan, hamma kod crm_leads'ga repoint |
| 2 | Taklif: 2 sahifa → BITTA | **ISHLAYDI** | commit b84a7a70 (qarorlar hujjati); SDSalesQuotes kanonik | STEP 2 bajarilgan, 8 yetim fayl o'chdi, tsc PASS |
| 3 | Buyurtma: 3 olam → BITTA | **QISMAN** | sales_orders=12 kanonik (a1bb3ec5); orders/sd_orders/ow_orders DEFERRED | Kanonik tanlandi (sales_orders), lekin production-order olami birlashtirilmagan (arxitektura intervyusi kutmoqda) |
| 4 | Order-* sahifalar → BITTA (yaratish+ro'yxat+holat) | **QISMAN** | OrdersRegistry ✅, OrderStatus ✅, OrderCreate ❌(topilmadi) | Ro'yxat+holat bor, lekin 1 sahifaga to'liq birlashtirilmagan |
| 7 | Narx formulasi → taklifga ulansin (hozir o'lik) | **QISMAN** | calculatePrice real (sd-quotations.service:87, price_formulas o'qiydi) + endpoint (controller:107) | Hisoblash endpoint REAL, lekin taklif-yaratishda avtomatik qo'llanishi (FE) tasdiqlanmadi |
| 8 | Email/SMS/WhatsApp → halol "tayyor emas" qil | **BUZUQ** | crm-comms.service:16-40 → `logEmail/logSms` qiladi, lekin `return Ok({sent:true})` | ⚠️ Hali SOXTA — "sent:true" qaytaradi, faqat bazaga LOG yozadi, HAQIQIY gateway YO'Q. Halol "tayyor emas" qaror BAJARILMAGAN (lekin aloqa-tarixi log bor) |
| 9 | Kvota maqsadlari (sd_kpi_targets) → jadval qur | **YO'Q** | `to_regclass('sd_kpi_targets')`=YO'Q | Jadval umuman yaratilmagan |
| D | Buyurtma line-item (har mahsulot alohida) | **QISMAN** | `sales_order_items` jadval BOR, lekin **0 qator** | Jadval mavjud, lekin hech qachon ishlatilmagan — FE hali "umumiy summa" ishlatadi (line-item to'ldirilmaydi) |
| D | Menejer buyurtma-paneli (o'z buyurtmalari, bosqich, real-time) | **YO'Q** | ManagerPanel sahifasi topilmadi | Qurilmagan |
| 2(B) | Faktura ALOHIDA sahifa | **QISMAN** | (tekshirilmadi — keyingi turda) | — |
| F | Mijoz: /sd/customers (ro'yxat) + Customer360 (profil) — ikkalasi | **ISHLAYDI** | Customer360 ✅ + customers ro'yxati (SD modulida) | Ikkalasi alohida mavjud |
| E | SD sahifalar: Shartnoma/Yetkazish/To'lov/Qarzdor | **QISMAN** | SdContracts ✅, SdDeliveries ✅, SdPayments ❌(nom?), debtors (tekshirilmadi) | Shartnoma+yetkazish bor; to'lov sahifasi nomi mos kelmadi (qayta tekshirish kerak) |

### Modul 1 oraliq hisob
- **ISHLAYDI: 3** (lid merge, taklif merge, mijoz 2 sahifa)
- **QISMAN: 5** (buyurtma kanonik, order-sahifa, narx formula, line-item, SD sahifalar)
- **BUZUQ: 1** (email/SMS soxta sent:true)
- **YO'Q: 2** (kvota jadval, menejer paneli)
- ➡️ Modul 1 ~ **40-50% ishlaydi** (ildiz birlashtirishlar bajarilgan; yangi qurishlar — line-item/kvota/menejer-panel — hali yo'q)

---

## 3. TIZIM BO'YLAB TAKRORLANUVCHI UZILISHLAR (Modul 1 + tasdiqlangan)

| Uzilish | Dalil | Qaysi talablarni bloklaydi |
|---|---|---|
| **manager_id 30/30 NULL** | baza (employees) | Eskalatsiya, tasdiq zanjiri, menejer-panel, org-printsip |
| **Bo'sh jadvallar (build-bosqich)** | sales_order_items=0, crm_leads=5, sales_orders=12 | "Ishlamaydi" emas — "hech qachon ishlatilmagan" (FE to'ldirmaydi) |
| **Soxta sent:true** (email/SMS) | crm-comms.service:16-40 | Halol "tayyor emas" qarori; CRM aloqa-tarixi (chala) |
| **Production-order 3 olam** | orders/sd_orders/ow_orders DEFERRED | Buyurtma to'liq birlashtirish, MES, QC zanjiri |

---

## 4. ⭐ HAMMA MODUL — JORIY HOLAT (intervyu uchun asos)

> Ega qarori: "hammasining hozirgi holatini aniqlash kerak — intervyu shunga qarab bo'ladi".
> Quyida har modulning JORIY HOLATI (bu sessiyada modul1-20-FULL tahlili + bugungi DB/kod sweep bilan).
> Dalil: DB sweep (jadval bor/yo'q/qator) + kod (fayl:qator). Eski emas — bugun qayta tekshirildi.

### ⚠️ ENG MUHIM 2 RAQAM (butun tizim halolligi — bugun)
- **35 fayl** `501` (halol "tayyor emas") qaytaradi
- **12 fayl** soxta-200 (echo — "ishladi" deydi, saqlamaydi) — ⭐ eng yomon (yashil yolg'on)

### 📊 DATA BOR jadvallar (ishlatilgan): audit_logs=9324 · org_departments=142 · accounts=42 · chat_messages=34 · employees=30 · warehouse_stock=25 · vendors=15 · sales_orders=12 · crm_leads=5 · pos_movements=2
### ❌ YO'Q jadvallar (vizyon talab, yaratilmagan): qc_approvals · gl_journal · hr_attendance · payroll_records · gate_logs · visitor_passes · canteen_meals · utility_readings · iot_production_sessions · iot_downtime_events · mes_downtime_events · company_state · director_alerts · demand_forecasts · design_order_messages · sd_kpi_targets

| # | Modul | ~% | 🟢 Ishlaydi (dalil) | 🔴 Soxta/buzuq | ⚫ Yo'q (jadval) |
|---|---|---|---|---|---|
| 1 | Savdo & CRM | ~45 | lid/taklif merge; mijoz 2 sahifa | email/SMS sent:true | sd_kpi_targets; menejer-panel |
| 2 | Marketing | ~58 | Website CMS blog real | settings/social 501 | lead-gen kanallar 0% (web/TG/LinkedIn) |
| 3 | Dizayn | ~45 | — | DesignOrders intake 501; fayl-upload yo'q | design_order_messages |
| 4 | QC | ~72 | inspection CRUD real (qc_inspections bor) | order-darajasi 3-qaror SOXTA (echo) | qc_approvals |
| 5 | Texnologiya | ~65 | BOM/Routing real (bom_items bor) | tech-cards 501; 13 menyu→1 | — |
| 6 | AI-Reja | ~50 | MRP/CRP real hisob | bottleneck SOXTA (bo'sh); yoqilg'i yo'q | demand_forecasts |
| 7 | MES | ~50 | — | ⚠️ OEE HARDCODED 92/85/97; operator planshet 501 | mes_downtime_events; iot_production_sessions |
| 8 | Ombor/WMS | ~65 | ⭐ kirim/chiqim STOK atomik real; rulon real | GL→pos_gl_postings (orol) | — |
| 9 | Ta'minot | ~50 | vendors(15)/PO/qabul real | vendor hisob-faktura HAMMASI 501 | — |
| 10 | Moliya | ~55/5 | accounts(42), hisobot engine real | ⚠️ HECH NARSA avtomatik tushmaydi (orol) | gl_journal |
| 11 | HR | ~58 | employees(30)/org/ta'til/hiring real | davomat→ish haqi UZILGAN; manager_id NULL | hr_attendance; payroll_records |
| 12 | LMS | ~70 | ⭐ kurs/imtihon/sertifikat real | video URL (fayl emas) | — |
| 13 | Xavfsizlik | **~20** | HR face-camera | ⚠️ tashrif `return []` SOXTA | gate_logs; visitor_passes (ENG ZAIF) |
| 14 | Xo'jalik/MRO | ~35 | jihoz/so'rov real | oshxona/kommunal faqat ekran | canteen_meals; utility_readings |
| 15 | IoT/Kamera | ~55 | kamera AI real (Claude) | sensor real lekin 0 qurilma; planshet 501 | iot_production_sessions |
| 16 | Direktor | ~55 | ⭐ raqamlar REAL SQL (soxta EMAS) | manba bo'sh | company_state; director_alerts |
| 17 | Admin | ~65 | ⭐ ruxsat ROST majburlanadi; audit=9324 | SaaS tenant stub | — |
| 18 | Vazifalar | ~70 | Kanban real (data) | rol-filtri kosmetik; vazifa tarqoq (5 joy) | yagona tasks jadval |
| 19 | Koordinatsiya | ~60 | ⭐ buyurtma→5 bo'lim fan-out REAL (yagona bog') | bo'sh; eskalatsiya buzuq | — |
| 20 | Chat | ~70 | ⭐ ROST jonli (websocket); data(34) | — | ERP voqealari chatga tushmaydi |
| Org | ~80 | departments/positions/vizual daraxt real | manager_id 30/30 NULL; master-data ulanmagan | — |

### Jami (joriy holat, taxminiy)
- ⭐ **Eng kuchli:** Admin(ruxsat real) · Chat(jonli+data) · Ombor(atomik stok) · LMS · Koordinatsiya fan-out
- 🔴 **Eng zaif:** Xavfsizlik ~20% (soxta+jadvalsiz) · Dizayn ~45% · MRO ~35% · Moliya avtomatik-feed ~5%
- **O'rtacha ekran ~55%, lekin BOG'LANISH ~15%** (modullar orol — Koordinatsiya fan-out yagona ROST bog')

---

## 5. KEYINGI QADAMLAR (Faza 1 davomi)
1. Modul 2 (Marketing) — lead-gen kanallar, web-sayt, xarajat→kassa talablari tekshirilsin
2. Org-struktura — manager_id↔head_user_id, konstruktor UI, vizual daraxt jonli tekshirilsin
3. POS/Ombor/Kassir (OMBOR-POS-KASSIR 1878 qator) — eng katta sohaviy interview
4. HR-200, Ishlab-chiqarish-150 — sohaviy talablar
5. Har modul: FE→API→handler→DB zanjiri + dalil; oxirida master jadval (ISHLAYDI/QISMAN/BUZUQ/YO'Q/JAVOBSIZ totallari)

> ⚠️ Modul 3-20  "birlashtir/tuzat" qarorlari hali JAVOBSIZ — ular uchun avval egasi intervyusi kerak (qaror darajasida). Sohaviy talablar (POS/HR/ishlab-chiqarish) tekshirilishi mumkin.

---

## SPOT-CHECK (o'z hisobotimni qayta-isbot — verify-don't-trust)
- ✅ "Lid ISHLAYDI" → `to_regclass('sd_leads')`=null qayta so'raldi (DROP tasdiq)
- ✅ "sd_kpi_targets YO'Q" → to_regclass=null (qayta)
- ✅ "Email soxta sent:true" → crm-comms.service:16-40 o'qildi (logEmail + return Ok sent:true)
- ✅ "line-item 0 qator" → SELECT count(*) sales_order_items = 0
- ✅ "manager_id NULL" → sessiya davomida bir necha bor baza bilan tasdiqlangan

---

> Hech narsa o'zgartirmadim (faqat o'qidim + bu hisobotni yozdim). Bu — Faza 1 ning Modul 1 qismi (to'liq) + qolganlar uchun usul/reja. Tuzatish — Agent 1 (Faza 3), egasi qaroridan (Faza 2) so'ng.
