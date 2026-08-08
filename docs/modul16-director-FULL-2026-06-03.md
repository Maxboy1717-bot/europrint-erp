# MODUL 16 — DIREKTOR (Boshqaruv paneli / Cockpit) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator qavs ichida — o'qimasangiz ham bo'ladi).

> **Bu modul nima:** Egasi/direktor uchun "uchish kabinasi" — butun kompaniyaning eng yuqori ko'rinishi:
> umumiy KPI'lar, pul xulosasi, ishlab chiqarish xulosasi, savdo xulosasi, ogohlantirishlar, direktor
> qaror qabul qilishi kerak bo'lgan tasdiqlar. Asosan KO'RISH + QAROR moduli — boshqa modullardan tortib oladi.

> ⭐⭐ **BIR JUMLALI XULOSA (eng muhim savol — raqamlar haqiqiymi yoki soxta?):** YAXSHI XABAR —
> direktor panelidagi asosiy raqamlar SOXTA (kodga yozilgan) EMAS. Ular haqiqiy hisob-kitoblar (bazaga
> so'rov). LEKIN manba modullar deyarli bo'sh bo'lgani uchun ko'p raqam 0/bo'sh ko'rinadi. Demak panel
> direktorga ALDAMCHI emas — u kompaniyaning HAQIQIY (asosan bo'sh) holatini ko'rsatadi, soxta-to'la demo emas.

---

# 1-QADAM — QANDAY SAHIFALAR BOR

**Jami: 3 ta direktor sahifasi topdim.**

| # | Sahifa | Menyu havolasi |
|---|---|---|
| 1 | Direktor paneli (asosiy) | DirectorDashboard |
| 2 | **Direktor kengaytirilgan** | ⭐ **6 menyu havola → 1 sahifa** (AI-xulosa, moliya, HR-statistika, KPI'lar, muammoli nuqtalar, ishlab chiqarish) |
| 3 | Direktor AI auditi | /director/ai-audit |

Komponentlar: AI Maslahatchi, AI Xulosa kartasi, Modul sog'ligi paneli, Direktor sarlavhasi.

---

# 2-QADAM — HAR SAHIFA + HAR RAQAM (HAQIQIY yoki SOXTA?)

## 🟡 1. DIREKTOR PANELI — DirectorDashboard.tsx
**Nima uchun:** Egasi har kuni ERP'ga kirganda butun kompaniya holatini bir ekranda ko'radi.

**Har asosiy raqam — manbasi:**
| Raqam/Widget | Manba | HAQIQIY/SOXTA |
|---|---|---|
| Kunlik brifing (kechikkan bitimlar, kritik stok, davomat, ishlab chiqarish) | director-agent real SQL (crm_deals, warehouse_rolls, sales_orders, hr_ai_attendance, production_sessions) | 🟢 **HAQIQIY** (so'rovlar, kodга yozilgan emas) |
| Pul xulosasi (moliya) | `/director/finance` real so'rov | 🟢 HAQIQIY (lekin moliya bo'sh → ~0) |
| Ishlab chiqarish xulosasi (OEE) | director-data.repository real o'qish, bo'sh bo'lsa null (director-data.repository.ts:73,96) | 🟢 **HAQIQIY** — ⭐ MUHIM: bu soxta 92/85/97 (MES'dagi) raqamni ISHLATMAYDI; real o'qiydi, bo'sh bo'lsa bo'sh ko'rsatadi |
| Savdo xulosasi | sales_orders (12 qator) | 🟢 HAQIQIY |
| **Ogohlantirishlar** | `/director/alerts` | 🔴 **director_alerts jadval YO'Q** → bo'sh/buzuq |
| **Kompaniya holati** | `/company-state/current` | 🔴 **company_state jadval YO'Q** → bo'sh/buzuq |
| AI xulosa (matn) | Claude AI | 🟢 HAQIQIY |

**Ma'lumot:** KPI'lar real so'rov, lekin manba jadvallar deyarli BO'SH (crm_deals=0, production_sessions=0, gl_lines=0; sales_orders=12).
**Holat:** 🟡 (raqamlar haqiqiy, lekin bo'sh + 2 widget jadvalsiz).
**Foydalanuvchi nima qila olmaydi / nima aldamchi:** Direktor panelni ko'radi, raqamlar HAQIQIY (soxta emas), lekin ko'pi 0 (modullar bo'sh); ogohlantirishlar va kompaniya-holati widgetlari ishlamaydi (jadval yo'q).

## 🟡 2. DIREKTOR KENGAYTIRILGAN — 6 havola→1 (DirectorExtended.tsx)
**Nima uchun:** AI-xulosa, moliya, HR-statistika, KPI'lar, muammoli nuqtalar, ishlab chiqarish — bitta sahifada.
**Har raqam:** `/director/finance`, `/production`, `/hr`, `/kpis`, `/ideal-vs-actual` — hammasi real so'rov; europrint-control/director-kpis real. ⚠️ Ba'zi compat qism "tayyor emas" (menus/admin 501).
**Holat:** 🟡 (real raqamlar, bo'sh data, 6 havola 1 sahifa).
**Foydalanuvchi nima qila olmaydi:** 6 alohida havola bosadi, bitta sahifa ochiladi; raqamlar real lekin bo'sh.

## 🟢 3. DIREKTOR AI AUDITI — `/director/ai-audit` (DirectorAiAudit.tsx)
**Nima uchun:** AI agentlar qabul qilgan qarorlarni ko'rish (kim/qachon/qancha ishonch bilan).
**Tugma/raqam:** `/ai-agents/audit/stats`, `/hard-block-stats` → **REAL** (ai_decision_log jadvalidan).
**Holat:** 🟢 (real AI qaror jurnali).

---

# 3-QADAM — UMUMIY XULOSA

## Sahifa jadvali
| Sahifa | Holat | Muammo (sodda) | Vizyon % |
|---|---|---|---|
| Direktor paneli | 🟡 | raqamlar real, data bo'sh + 2 widget jadvalsiz | ~55 |
| Direktor kengaytirilgan (6→1) | 🟡 | real raqamlar, bo'sh data | ~50 |
| Direktor AI auditi | 🟢 | — (real) | ~70 |

**Jami: 1 🟢 · 2 🟡 · 0 🔴 → taxminan ~55% real raqam ko'rsatadi.**

## ⭐⭐ ISHONCH VERDIKTI (bu modulning eng muhim savoli) — HAQIQIY vs SOXTA
**Direktor kabinasi HALOL.** Boshqa modullarda topilgan soxta-qattiq raqamlardan (MES'da OEE 92/85/97, CRM'da prognoz 78.5%) FARQLI o'laroq, **direktor paneli o'z asosiy raqamlarini kodga yozmaydi** — haqiqiy bazaga so'rov yuboradi va bo'sh bo'lsa 0/bo'sh ko'rsatadi.
- ⭐ Eng muhim: direktor ishlab chiqarish OEE'si **soxta 92/85/97'ni ISHLATMAYDI** — director-data real o'qiydi (director-data.repository.ts:73,96)
- Demak direktor **soxta-to'la chiroyli demo'ni emas, kompaniyaning HAQIQIY (asosan bo'sh) holatini ko'radi**
- ⚠️ LEKIN: manba modullar bo'sh (moliya orol, ishlab chiqarish data yo'q) → ko'p raqam 0; va 2 widget (ogohlantirish, kompaniya-holati) jadvalsiz → buzuq

**Qisqasi:** panel direktorni soxta raqam bilan aldamaydi — u rost (lekin bo'sh) holatni ko'rsatadi. Bu — "halol lekin bo'sh", "chiroyli lekin yolg'on" emas.

## ⭐ ZANJIR MUAMMOSI (sodda)
Panel har moduldan real ma'lumot kutadi, lekin manbalar zaif:
- 🟡 **Moliya → panel:** real so'rov, lekin moliya orol (bo'sh) → pul xulosasi ~0
- 🟢 **Ishlab chiqarish → panel:** real o'qish (soxta OEE emas), lekin data yo'q → bo'sh
- 🔴 **Ogohlantirish + kompaniya-holati:** jadvallar yo'q → buzuq widgetlar

## DB MUAMMOLARI (sodda)
- ❌ **`company_state` va `director_alerts` jadvallari YO'Q** → kompaniya-holati va ogohlantirish widgetlari buzuq
- ✅ KPI so'rovlari haqiqiy jadvallarga (lekin bo'sh)
- ✅ AI qaror jurnali (ai_decision_log) bor

## ⭐ ENG MUHIM 4 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🟡 **Panel bo'sh ko'rinadi** — raqamlar haqiqiy, lekin manba modullar bo'sh → 0. (Bu boshqa modullarni to'ldirgach o'z-o'zidan hal bo'ladi)
2. 🔴 **2 widget jadvalsiz** — kompaniya-holati va ogohlantirishlar (jadval yo'q)
3. ⚠️ **6 havola → 1 sahifa** — menyu shishirilgan
4. ✅ **Soxta raqam YO'Q** — bu yaxshi (boshqa modullardan farqli)

---

## XULOSA (egasiga)
Direktor paneli — kutilganidan HALOLROQ. Bu modulda eng katta xavf "soxta raqamlar" edi (boshqa modullarda OEE 92/85/97, prognoz 78.5% kabi kodga yozilgan raqamlar topilgandi). **Direktor panelida bunday soxta-qattiq raqamlar YO'Q** — har asosiy raqam haqiqiy bazaga so'rov yuboradi, hatto ishlab chiqarish OEE'si ham soxta 92/85/97'ni ishlatmaydi.

Demak direktor **kompaniyaning rost holatini ko'radi** — lekin hozir bu holat asosan BO'SH (modullar to'ldirilmagan, moliya orol). Panel aldamaydi, u rostni (bo'sh rostni) ko'rsatadi. Faqat 2 widget (ogohlantirish, kompaniya-holati) jadvalsiz buzuq.

⭐ **Halol javob:** direktor kabinasi soxta demo emas — u haqiqiy asboblarga ulangan, faqat dvigatellar (modullar) hali bo'sh ishlayapti, shuning uchun ko'p asbob 0 ko'rsatadi.

Metafora: uchish kabinasidagi asboblar haqiqiy o'lchagichlarga ulangan (bo'yalgan soxta tsiferblat emas) — shuning uchun ular rostni ko'rsatadi. Muammo shundaki, dvigatellar (modullar) hali bo'sh ishlayapti, shuning uchun ko'p asbob nolni ko'rsatadi, va ikkita asbob (ogohlantirish, kompaniya-holati) orqasiga umuman sim ulanmagan.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
