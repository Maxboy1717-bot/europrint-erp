# MODUL 10 — MOLIYA (Buxgalteriya) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Pul miyasi — buxgalteriya kitobi (har pul harakati yoziladigan asosiy kitob),
> mijozlardan kelgan pul, ta'minotchilarga/oyliklarga ketgan pul, naqd/bank, va moliyaviy hisobotlar
> (foyda, balans). Boshqa modullar buni AVTOMATIK to'ldirishi kerak (sotuv→daromad, xarid→hisob,
> ombor→qiymat).

> ⭐⭐ **BIR JUMLALI XULOSA (eng muhim kashfiyot):** Buxgalteriya kitobi ochilgan, hisoblar reja yozilgan
> (42 ta hisob), hisobot motori to'g'ri hisoblaydi — LEKIN **kitobga hech narsa AVTOMATIK yozilmaydi.**
> Har sotuv, har hisob-faktura, har stok harakati kitobga qo'lda ko'chirilishi kerak. Bu modul butun
> ERP'ning HAQIQATINI ochib beradi: bu — bir-biriga ulangan TIZIM emas, ko'p ALOHIDA OROL.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: ~20 ta moliya sahifasi topdim.**

| Guruh | Sahifalar |
|---|---|
| **Buxgalteriya yadrosi** | Hisoblar rejasi (/accounting/chart-of-accounts), Buxgalteriya yozuvlari (/accounting/gl-documents, /gl), Davr yopish (/accounting/period-closing) |
| **Pul kirim/chiqim** | To'lanadigan hisoblar (/accounting/ap), Olinadigan hisoblar (/accounting/ar), Daromad-xarajat, Kassa (/accounting/cash-register), Cash-flow (/finance/cashflow) |
| **Oylik/byudjet** | Oylik avtomatlashtirish (/accounting/payroll-automation), Byudjet (/finance/budgets) |
| **Hisobotlar** | Moliyaviy hisobotlar (/finance/reports), Moliya paneli (/finance-dashboard), Kunlik KPI, Foyda, Variance, Break-even |
| **Aktiv/baholash** | Aktiv boshqaruvi, Inventar baholash, Buyurtma tannarxi, Narx pog'onalari |
| **FI kengaytirilgan** | /fi/audit-log + /fi/cost-centers + /fi/risk-ai + /fi/tax-calendar + /fi/tax-management + /fi/transfer-pricing (**6 havola → 1 sahifa**) |
| **Integratsiya** | GL yozuv monitori (/integration/gl-posting), Xarajat boshqaruvi, Hisob-faktura tekshiruvi, AI moliya |

**Jadval DATASI:** accounts (hisoblar rejasi)=**42** (DATA bor!) · gl_documents=0 · gl_lines=0 · sales_invoices=0 · purchase_invoices=0 · budgets=0 · oyliklar=0. Ya'ni hisoblar reja tayyor, lekin **kitobda hech qanday yozuv yo'q**.

---

# 2-QADAM — HAR SAHIFA

## 🟢 HISOBLAR REJASI — `/accounting/chart-of-accounts` (ChartOfAccounts.tsx)
**Nima uchun:** Buxgalteriya hisoblari ro'yxati (kassa, bank, daromad, xarajat va h.k.) — kitobning "mundarijasi".
**Tugma:** Hisob qo'shish/tahrirlash → **REAL**. **Ma'lumot:** accounts=**42** (O'zbekiston BHMS hisoblari seed qilingan).
**Holat:** 🟢. **Foydalanuvchi nima qila olmaydi:** Ishlaydi (42 hisob tayyor).

## 🟢 BUXGALTERIYA YOZUVLARI — `/accounting/gl-documents`, `/gl` (GLDocuments)
**Nima uchun:** Har pul harakatini kitobga qo'lda yozish (debit/kredit).
**Tugma:** "Yozuv yaratish" → **REAL** (`POST /accounting/gl-documents` + qatorlar, finance-accounting.controller:90). "Tasdiqlash (post)" → **REAL** (fi.controller:85).
**⚠️ Texnik xavf:** Yozuv ikki qator (debit+kredit) bo'lib, ular alohida yoziladi — agar yarmida uzilsa, balanssiz yarim yozuv qolishi mumkin (yagona himoyalangan paketda emas, gl-posting.service).
**Ma'lumot:** gl_documents=0, gl_lines=0 (bo'sh).
**Holat:** 🟢 (qo'lda yozish real, lekin bo'sh).
**Foydalanuvchi nima qila olmaydi:** Qo'lda yozuv kirita oladi, lekin avtomatik yozuv kelmaydi (pastda zanjir).

## 🟢 TO'LANADIGAN/OLINADIGAN HISOBLAR — `/accounting/ap`, `/accounting/ar`
**Nima uchun:** Ta'minotchiga qarz (AP), mijozdan olinadigan (AR).
**Tugma:** Hisob-faktura yaratish → **REAL** (sales_invoices/purchase_invoices, finance-ar/ap.repo). **Ma'lumot:** 0 (bo'sh).
**Holat:** 🟢 (real, bo'sh).

## 🟢 DAVR YOPISH — `/accounting/period-closing` (PeriodClosing)
**Nima uchun:** Oy/chorak yopilganda hisoblarni yakunlash.
**Tugma:** "Davr yopish" → **REAL** (fi.controller:76, finance-accounting:109).
**Holat:** 🟢.

## 🟢 OYLIK + BYUDJET — `/accounting/payroll-automation`, `/finance/budgets`
**Tugma:** Oylik hisoblash/run → **REAL** (payroll_calculations, INPS/JSHD). Byudjet yaratish → **REAL** (budgets, yagona paketda). **Holat:** 🟢.

## 🟡 MOLIYAVIY HISOBOTLAR — `/finance/reports` (FinancialReports)
**Nima uchun:** Foyda-zarar, balans, oborot-balans (trial balance).
**Tugma:** Hisobotlar → **REAL HISOBLAYDI** (reports.controller:30-65: trial-balance, profit-loss, oylik/haftalik) — yozuvlardan haqiqatan jamlaydi (qattiq yozilgan emas).
**⚠️ AMMO:** kitobda yozuv yo'q (0) → hisobotlar **0 ko'rsatadi**.
**Holat:** 🟡 (motor real, lekin ma'lumotsiz → bo'sh hisobot).
**Foydalanuvchi nima qila olmaydi:** Hisobotni ochadi, lekin yozuvlar bo'lmagani uchun foyda/balans 0 ko'rinadi.

## 🔴 KASSA — `/accounting/cash-register` (CashRegister) — NOTO'G'RI KONSEPT
**Nima uchun:** Egasi vizyoni — naqd nazorat markazi (oylik/avans/podotchet). LEKIN hozir bu — **chakana do'kon kassasi** (tovar skanerlab sotish, QQS, "Sotishni yakunlash").
**Holat:** 🔴 (ishlaydi, lekin egasi xohlagan narsa EMAS).
**Foydalanuvchi nima qila olmaydi:** Naqd nazorat (oylik/avans/qarz) qila olmaydi — bu ekran do'kon kassasi, egasining naqd-hub vizyoni emas.

## 🔴 GL YOZUV MONITORI — `/integration/gl-posting` (GLPostingMonitor)
**Nima uchun:** Boshqa modullardan avtomatik kelgan buxgalteriya yozuvlarini ko'rsatadi.
**⚠️ Muammo:** Avtomatik yozuv KELMAYDI (pastda) → bu ekran doim bo'sh.
**Holat:** 🔴 (monitor bor, kuzatadigan narsa yo'q).

## 🟡 Boshqa (daromad-xarajat, aktiv, inventar baholash, tannarx, foyda, variance, cash-flow, FI kengaytirilgan 6→1, AI moliya, xarajat) — asosan real o'qiydi/yozadi, lekin bo'sh data. 🟡.

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali (asosiylari)
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Hisoblar rejasi | 🟢 | — (42 data) | ~85 |
| Buxgalteriya yozuvlari | 🟢 | yarim-yozuv xavfi | ~70 |
| AP / AR | 🟢 | bo'sh | ~70 |
| Davr yopish | 🟢 | — | ~75 |
| Oylik / Byudjet | 🟢 | — | ~75 |
| Moliyaviy hisobotlar | 🟡 | motor real, data 0 | ~60 |
| **Kassa** | 🔴 | **noto'g'ri konsept (do'kon)** | ~10 |
| **GL yozuv monitori** | 🔴 | **avtomatik yozuv kelmaydi** | ~5 |
| Boshqalar | 🟡 | bo'sh data | ~50 |

**Jami (asosiy): ~7 🟢 · ~9 🟡 · ~2 🔴 → ekran darajasida ~55%; LEKIN avtomatik ulanish ~5%.**

## ⭐⭐ ZANJIR — ENG MUHIM (moliya — hammasi shu yerda birlashishi kerak edi)
Moliyaga 4 oqim AVTOMATIK kelishi kerak. **Hammasi UZILGAN:**
| Oqim | Holat | Sodda izoh |
|---|---|---|
| **Sotuv → daromad** | 🔴 | Sotuv bo'lganda avtomatik yozuv yaratiladigan listener BOR, lekin sotuv moduli signal YUBORMAYDI (kod izohi: "no publisher wired", tech-three-checkpoint.listener:23) |
| **Xarid → to'lanadigan hisob** | 🔴 | Ta'minotchi hisob-fakturasi butunlay "tayyor emas" (9-modul) → moliyaga hech narsa kelmaydi |
| **Ombor → stok qiymati** | 🔴 | Stok ko'chganda buxgalteriya yozuvi avtomatik tushmaydi (8-modulda ko'rdik — o'lik signal) |
| **Oylik → xarajat** | 🟡 | Oylik hisoblanadi, lekin GL kitobiga avtomatik o'tishi to'liq emas |

➡️ **MOLIYA YAKKALANGAN OROL.** Kitob, hisoblar reja (42), hisobot motori — hammasi tayyor, LEKIN hech bir modul kitobni avtomatik to'ldirmaydi. Listenerlar "kutib turibdi", lekin hech kim signal yubormaydi. Bu — egasi his qilgan "ballonsiz mashina"ning eng yuqori isboti: ERP qismlar bor, lekin ular bir-biriga ulanmagan.

## JADVAL MUAMMOLARI (sodda)
- ❌ **`gl_journal_lines` jadval YO'Q** — eski GL ekrani shu sababli xato (503)
- ✅ Hisoblar reja (accounts=42) bor; asosiy jadvallar (gl_documents, gl_lines, invoices) bor lekin bo'sh
- ⚠️ Buxgalteriya yozuvi yagona himoyalangan paketda emas (yarim-yozuv xavfi)

## ⭐ ENG MUHIM 5 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **Hech narsa avtomatik yozilmaydi (ENG MUHIM)** — sotuv/xarid/ombor/oylik moliyaga avtomatik o'tmaydi. Listenerlar bor, lekin signal yubaruvchi yo'q. Bu — ERP'ni "tizim" qiladigan eng muhim ulanish
2. 🔴 **Kassa noto'g'ri konsept** — do'kon kassasi, egasi xohlagan naqd-nazorat markazi emas
3. 🟡 **Hisobotlar bo'sh** — motor ishlaydi, lekin yozuv yo'qligi uchun foyda/balans 0
4. 🔴 **Eski GL ekrani xato** — `gl_journal_lines` jadval yo'q (503)
5. ⚠️ **Yarim-yozuv xavfi** — buxgalteriya yozuvi atomik emas (balanssiz qolishi mumkin)

---

## XULOSA (egasiga)
Moliyaning **asoslari yaxshi qurilgan:** buxgalteriya kitobi, hisoblar rejasi (42 ta), foyda-balans hisobot motori, oylik, byudjet, davr yopish — hammasi haqiqatan ishlaydi. LEKIN bu modul butun ERP'ning HAQIQATINI ochib beradi:

**Hech bir modul moliyaga avtomatik ulanmagan.** Sotuv bo'lsa — kitobga daromad yozilmaydi. Ta'minotchi hisob-faktura yuborsa — qarz yozilmaydi. Ombordan material chiqsa — qiymat yozilmaydi. Hammasini qo'lda kiritish kerak, va hozir kitob bo'sh.

Moliya "kutib turibdi" (listenerlar tayyor), lekin boshqa modullar "gapirmaydi" (signal yubormaydi). Bu — egasi sezgan asosiy muammo: **ERP qismlari bor, lekin ular bitta tizim sifatida birlashmagan — ular alohida orollar.**

Metafora: buxgalteriya kitobi ochilgan, chiziqlangan, birinchi betiga hisoblar reja yozilgan — lekin hech bir kotib unga avtomatik yozmaydi. Sotuv, hisob-faktura, stok harakati — hammasi qo'lda ko'chirilishi kerak, va hozircha kitob bo'sh.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
