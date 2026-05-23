# EuroPrint ERP — UZ/RU i18n To'liq Tahlil Hisoboti

**Generated:** 2026-05-21T13:44:55.878Z  
**Scope:** Frontend (55 namespace) + Backend (6 namespace) + POS Monitor (single pair)  
**Source:** `_audit_out/i18n-full-report.json` + `i18n-issues-details.json`

---

## Boshqarma xulosasi

| Sohaning | UZ kalit | RU kalit | RU yo'q | RU bo'sh | English-in-RU | Cyrillic-in-UZ | UZ-in-RU | Identical (UZ=RU) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **FE** | 13824 | 13802 | 22 | 0 | **101** | **112** | 9 | 154 |
| **BE** | 282 | 282 | 0 | 0 | **3** | **0** | 0 | 3 |
| **POS** | 293 | 291 | 2 | 0 | **6** | **0** | 1 | 8 |

**Jami:** 14399 UZ + 14375 RU kalit | **24** missing | **110** English-in-RU | **112** Cyrillic-in-UZ | 10 UZ-in-RU | 165 identical

### Eng diqqat talab muammolar

1. **112 ta Cyrillic-in-UZ** — Uzbek qiymatlar Kirill yozuvida (Uzbek rasman Lotin). Bu eng yomon, foydalanuvchi ko'rishi qiyin bo'lib qoladi.
2. **110 ta English-in-RU** — RU faylda ingliz so'zi ("logging In", "world Class") — namuna: auto-camelCase fallback yoki tarjima qilinmagan stub.
3. **165 ta identical UZ=RU** — bir xil qiymat ikkala tilda. Tech terms (API, ID) bo'lsa OK, lekin "Saqlash" UZ va RU bir xil bo'lishi mumkin emas — RU tarjima qilinmagan.
4. **10 ta UZ-in-RU** — RU faylda Uzbek so'zlari (mas. "Saqlash" RU faylida) — copy-paste xatosi.
5. **24 ta missing-in-RU** — UZ kalit bor, RU yo'q. Status: RU coverage 99.68%.

---

## FE sohasi

**Yo'l:** `artifacts/erp-dashboard/src/locales/{uz,ru}/*.json` — 55 namespace

### Muammoli namespacelar

| Namespace | UZ | RU | RU yo'q | English-in-RU | Cyrillic-in-UZ | UZ-in-RU | Identical |
|---|---:|---:|---:|---:|---:|---:|---:|
| `common` | 8353 | 8350 | 3 | 64 | 17 | 7 | 72 |
| `warehouse` | 448 | 448 | 0 | 1 | 45 | 0 | 46 |
| `finance` | 568 | 568 | 0 | 6 | 21 | 0 | 5 |
| `navigation` | 130 | 122 | 8 | 11 | 0 | 0 | 11 |
| `coordination` | 60 | 60 | 0 | 0 | 14 | 0 | 2 |
| `hr` | 583 | 572 | 11 | 3 | 3 | 0 | 4 |
| `lms` | 156 | 156 | 0 | 0 | 5 | 0 | 5 |
| `settings` | 75 | 75 | 0 | 1 | 2 | 2 | 4 |
| `design` | 78 | 78 | 0 | 4 | 0 | 0 | 3 |
| `production` | 456 | 456 | 0 | 1 | 2 | 0 | 1 |
| `public` | 150 | 150 | 0 | 4 | 0 | 0 | 0 |
| `crm` | 421 | 421 | 0 | 3 | 0 | 0 | 0 |
| `kanban` | 104 | 104 | 0 | 0 | 2 | 0 | 0 |
| `security` | 67 | 67 | 0 | 1 | 0 | 0 | 1 |
| `iot` | 159 | 159 | 0 | 1 | 0 | 0 | 0 |
| `director` | 122 | 122 | 0 | 0 | 1 | 0 | 0 |
| `auth` | 84 | 84 | 0 | 1 | 0 | 0 | 0 |

### Bo'sh namespacelar (5 ta — 0 kalit)

- `adaptation`
- `analytics`
- `employee-profile`
- `erp`
- `planning`

**Tavsiya:** yo o'chirilsin, yo content qo'shilsin. Build vaqtida `i18next-loadResources` bularni yuklaydi.

## BE sohasi

**Yo'l:** `apps/api/src/i18n/{uz,ru}/*.json` — 6 namespace (nestjs-i18n)

### Muammoli namespacelar

| Namespace | UZ | RU | RU yo'q | English-in-RU | Cyrillic-in-UZ | UZ-in-RU | Identical |
|---|---:|---:|---:|---:|---:|---:|---:|
| `common` | 61 | 61 | 0 | 3 | 0 | 0 | 3 |

## POS sohasi

**Yo'l:** `artifacts/erp-dashboard/src/pos-monitor/i18n/{uz,ru}.json` — 1 fayl pair

### Muammoli namespacelar

| Namespace | UZ | RU | RU yo'q | English-in-RU | Cyrillic-in-UZ | UZ-in-RU | Identical |
|---|---:|---:|---:|---:|---:|---:|---:|
| `pos-monitor` | 293 | 291 | 2 | 6 | 0 | 1 | 8 |

---

## Konkret muammo namunalari

### 1) Cyrillic-in-UZ — UZ qiymat Kirill yozuvida (FE eng yomon)

Uzbek tili rasman Lotin yozuvida. UZ faylida Kirill harf bo'lishi xato. Top 30 namuna:

| Namespace | Key | UZ qiymat (Kirill — XATO) |
|---|---|---|
| `common` | `language.ru` | Русский |
| `common` | `titleRussian` | Sarlavha (Русский) |
| `common` | `titleRussianPlaceholder` | Учебное занятие |
| `common` | `descriptionRussian` | Tavsif (Русский) |
| `common` | `vacationApplicationPlaceholder` | Например: Заявление на отпуск |
| `common` | `safetyTestPlaceholder` | Тест по технике безопасности |
| `common` | `untitled` | безопасность |
| `common` | `dizaynTexnologSifatNazoratiMoliya` | Dizayn → Texnolog → Sifat nazorati → Moliya / Дизайн → Технолог → Контроль качес |
| `common` | `sifatSertifikati` | SIFAT SERTIFIKATI / СЕРТИФИКАТ КАЧЕСТВА |
| `common` | `lclPastkiChegar` | LCL (Pastki chegarа) |
| `common` | `uclYuqoriChegar` | UCL (Yuqori chegarа) |
| `common` | `python2` | Языки программирования Python... |
| `common` | `python` | Программирование Python |
| `common` | `ru` | ЦКП (RU)... |
| `common` | `qyam` | QYaM / ЦКП |
| `common` | `xizmatSafariK` | Xizmat safari (K командировка) |
| `common` | `untitled2` | производства |
| `hr` | `positionFolder` | Lavozim Papkasi (Должностная Папка) |
| `hr` | `departments.nameRuPlaceholder` | Название отдела |
| `hr` | `reasonRuPlaceholder` | Причина и подробности... |
| `finance` | `aiRecommendations` | AI tavsiялari |
| `finance` | `zvs` | Pul ajratish ariza (ЗВС) |
| `finance` | `zno` | Majburiyat ariza (ЗНО) |
| `finance` | `createZvs` | ЗВС yaratish |
| `finance` | `zvsNumber` | ЗВС raqami |
| `finance` | `zvsDate` | ЗВС sanasi |
| `finance` | `zvsStatus` | ЗВС holati |
| `finance` | `zvsPending` | ЗВС ko'rib chiqilmoqda |
| `finance` | `zvsApproved` | ЗВС tasdiqlandi |
| `finance` | `zvsRejected` | ЗВС rad etildi |

**To'liq ro'yxat:** `_audit_out/i18n-issues-details.json` → `fe.<namespace>.cyrillicInUz`

### 2) English-in-RU — RU faylda ingliz so'z (top 30)

Avtomatik camelCase split fallback ("loggingIn" → "logging In") yoki tarjima qilinmagan stub.

| Sohaning | Namespace | Key | RU qiymat (English — XATO) |
|---|---|---|---|
| FE | `common` | `id` | ID |
| FE | `common` | `hrEmail` | HR email |
| FE | `common` | `SOS` | SOS |
| FE | `common` | `socialApi` | Social API |
| FE | `common` | `geminiVision` | Gemini Vision |
| FE | `common` | `whatsapp` | WhatsApp |
| FE | `common` | `telegram` | Telegram |
| FE | `common` | `europrintErp` | EuroPrint ERP |
| FE | `common` | `telegramId` | Telegram ID |
| FE | `common` | `europrint` | EuroPrint |
| FE | `common` | `jpegPngWebp` | JPEG, PNG, WebP |
| FE | `common` | `europrint1` | EuroPrint |
| FE | `common` | `europrintHr` | EuroPrint HR |
| FE | `common` | `europrintPaper` | EuroPrint Paper... |
| FE | `common` | `instagram` | Instagram |
| FE | `common` | `facebook` | Facebook |
| FE | `common` | `linkedin` | LinkedIn |
| FE | `common` | `excel` | Excel |
| FE | `common` | `gemini` | Gemini |
| FE | `common` | `openai` | OpenAI |
| FE | `common` | `zplZebraZplIi` | ZPL — Zebra ZPL II |
| FE | `common` | `eplEltronEpl2` | EPL — Eltron EPL2 |
| FE | `common` | `interBold` | Inter Bold |
| FE | `common` | `interRegular` | Inter Regular |
| FE | `common` | `appleSamsung` | Apple, Samsung… |
| FE | `common` | `abcCompany` | ABC Company |
| FE | `common` | `macbookPro14` | MacBook Pro 14 |
| FE | `common` | `openstreetmap` | OpenStreetMap |
| FE | `common` | `aiPredictiveEngine` | AI Predictive Engine |
| FE | `common` | `telegramInstagram` | Telegram, Instagram… |

### 3) Identical (UZ=RU) — bir xil qiymat (top 30)

Tech term (API, ID, JSON) bo'lsa OK. "Saqlash", "Yangi" kabilar tarjima qilinmagan bo'lsa kerak.

| Sohaning | Namespace | Key | Qiymat (ikkala tilda bir xil) |
|---|---|---|---|
| FE | `common` | `language.ru` | Русский |
| FE | `common` | `hrEmail` | HR email |
| FE | `common` | `socialApi` | Social API |
| FE | `common` | `geminiVision` | Gemini Vision |
| FE | `common` | `whatsapp` | WhatsApp |
| FE | `common` | `telegram` | Telegram |
| FE | `common` | `europrintErp` | EuroPrint ERP |
| FE | `common` | `telegramId` | Telegram ID |
| FE | `common` | `jpegPngWebp` | JPEG, PNG, WebP |
| FE | `common` | `europrint1` | EuroPrint |
| FE | `common` | `europrintHr` | EuroPrint HR |
| FE | `common` | `europrintPaper` | EuroPrint Paper... |
| FE | `common` | `zplZebraZplIi` | ZPL — Zebra ZPL II |
| FE | `common` | `eplEltronEpl2` | EPL — Eltron EPL2 |
| FE | `common` | `interBold` | Inter Bold |
| FE | `common` | `interRegular` | Inter Regular |
| FE | `common` | `abcCompany` | ABC Company |
| FE | `common` | `macbookPro14` | MacBook Pro 14 |
| FE | `common` | `aiPredictiveEngine` | AI Predictive Engine |
| FE | `common` | `apiKey` | API Key |
| FE | `common` | `apiSecret` | API Secret |
| FE | `common` | `webhookSecret` | Webhook Secret |
| FE | `common` | `previousPassrateUpLatestPassrate` | previous.passRate ? "up" : latest.passRate |
| FE | `common` | `qcExtended` | QC Extended |
| FE | `common` | `hrCapital9` | HR Capital №9 |
| FE | `common` | `zavodLlc` | Zavod LLC |
| FE | `common` | `gpt4oMini` | GPT-4o Mini |
| FE | `common` | `alfaTexLlc` | Alfa-Tex LLC |
| FE | `common` | `kr20PercentLabel` | KR-20 % |
| FE | `common` | `titleRussianPlaceholder` | Учебное занятие |

### 4) Uzbek-in-RU — RU faylda Uzbek matn

| Sohaning | Namespace | Key | RU qiymat (UZ — XATO) |
|---|---|---|---|
| FE | `common` | `hhUzTelegram` | hh.uz, Telegram… |
| FE | `common` | `uzs` | UZS |
| FE | `common` | `xodimEuroprintUz` | xodim@europrint.uz |
| FE | `common` | `suppliersEuroprintUz` | suppliers.europrint.uz |
| FE | `common` | `adminZavodUz` | admin@zavod.uz |
| FE | `common` | `zavodUz` | zavod.uz |
| FE | `common` | `adminCompanyUz` | admin@company.uz |
| FE | `common` | `samarkandEuroprintUz` | samarkand.europrint.uz |
| FE | `settings` | `wwwEuroprintUz` | www.europrint.uz |
| FE | `settings` | `infoEuroprintUz` | info@europrint.uz |
| BE | `common` | `currencyCode` | UZS |
| POS | `pos-monitor` | `common.supplierDoc` | Supplier Doc |

### 5) Missing-in-RU — UZ kalit bor, RU yo'q

| Sohaning | Namespace | Key | UZ qiymat |
|---|---|---|---|
| FE | `common` | `telefon` | Telefon |
| FE | `common` | `orgBolim` | Tashkiliy bo'lim |
| FE | `common` | `orgLavozim` | Tashkiliy lavozim |
| FE | `hr` | `alertlar` | Alertlar |
| FE | `hr` | `kadrlar` | Kadrlar |
| FE | `hr` | `xavfsizlik` | Xavfsizlik |
| FE | `hr` | `ogohlantirish` | Ogohlantirish |
| FE | `hr` | `malumot` | Ma'lumot |
| FE | `hr` | `orta` | O'rta |
| FE | `hr` | `HRDashboard.hujjatOqimi` | Hujjat Oqimi |
| FE | `hr` | `HRDashboard.kunlikHisobot` | Kunlik Hisobot |
| FE | `hr` | `HRDashboard.pipRejalar` | PIP Rejalar |
| FE | `hr` | `HRDashboard.enpsSorov` | eNPS So'rov |
| FE | `hr` | `HRDashboard.malakalarMatritsasi` | Malakalar Matritsasi |
| FE | `navigation` | `menyu` | Menyu |
| FE | `navigation` | `euro` | Euro |
| FE | `navigation` | `print` | Print |
| FE | `navigation` | `close2` | Yopish |
| FE | `navigation` | `modullar` | Modullar |
| FE | `navigation` | `yangiVazifa1` | Yangi vazifa |
| FE | `navigation` | `help` | Yordam |
| FE | `navigation` | `fikr` | Fikr |
| POS | `pos-monitor` | `movements.actions.DRAFT` | Tahrirlash,Bekor qilish,Karantinga yuborish |
| POS | `pos-monitor` | `movements.actions.QC_PENDING` | Qabul,Qayta ishlash,Chiqarish |

### 6) I18n bloat — bir xil qiymat 8+ kalit'da (top 15)

Bir xil "Saqlash" 50 ta kalitda qaytarilsa — namespace shared key kerak.

| Sohaning | Namespace | UZ qiymat | Kalit soni | Namuna |
|---|---|---|---:|---|
| FE | `common` | "holat" | 30 | `status`, `Status` |
| FE | `common` | "boshqaruv paneli" | 10 | `dashboard`, `dashboard1` |

---

## Tavsiya etiladigan qadamlar (prioritet bo'yicha)

### 🔴 Darhol (1-2 soat)
- 112 ta **Cyrillic-in-UZ** ni Lotin Uzbek'ga konvertatsiya qilish (auto script bilan: Kirill→Lotin transliteratsiya)
- 24 ta **missing-in-RU** tarjima qo'shish (yo manual yo OpenAI translation)
- 10 ta **UZ-in-RU** ni RU ga tarjima qilish (copy-paste xato bartaraf etish)

### 🟡 O'rta muddat (1-2 kun)
- 110 ta **English-in-RU** ni RU ga tarjima qilish (top: `common.json` 64 ta, `finance.json` 6 ta)
- 165 ta **identical UZ=RU** ni qayta ko'rib chiqish (tech term'lar OK, real so'zlar tarjima kerak)
- 5 ta bo'sh namespace (adaptation, analytics, employee-profile, erp, planning) — yo content qo'shilsin yo o'chirilsin

### ⚪ Uzoq (haftalar)
- I18n bloat — yuqori takrorlanuvchan qiymatlar `common:btn.save` kabi shared keylarga ko'chirilsin
- TSX hardcoded strings — quyidagi bo'lim

---

## 7) Hardcoded TSX strings — Explore agent natijasi

**Skan ko'lami:** ~1754 TSX fayl, `artifacts/erp-dashboard/src/`
**Topilgan miqdor:** **~180-250 ta hardcoded user-visible string**
**I18n compliance:** ~80-85% (15-20% string `t()` chaqirig'idan tashqari)

### Eng yomon 8 fayl

| Fayl | Soni | Misol |
|---|---:|---|
| `pages/ExceptionLog.tsx` | **14** | `EXCEPTION_LABELS` const: `advance_bypass: "Avans o'tkazib yuborish"` (line 55-67) |
| `pages/WarehouseDashboard.tsx` | 6 | `QUICK_LINKS` const: `{ label: "Qabul Akti (GRN)" }` (line 26-32) |
| `pages/OTPVerify.tsx` | 6 | `toast({ title: "Yangi kod yuborildi" })` (line 46, 49, 62, 66, 120) |
| `pages/QueueMonitor.tsx` | 4 | `toast({ title: "Muvaffaqiyatli", description: "Job qayta ishga tushirildi" })` (line 49, 54, 63, 68) |
| `components/crm/QuickCreateModal.tsx` | 2 | `{entityType === "lead" ? "Yangi lid yaratish" : "Yangi bitim yaratish"}` (line 63) |
| `components/crm/DealCard.tsx` | 2 | `<span>Kontakt #{deal.contactId}</span>` (line 98, 104) |
| `components/crm/company/CompanyHeader.tsx` | 2 | `{category} kategoriya` badge (line 39) |
| `pages/RoutingConfigurationCard.tsx` | 1 | UI text via `labels` prop |

### Toifalar bo'yicha

| Toifa | Taxmin | Severity |
|---|---:|---|
| Toast notifications (title/description) | ~50+ | 🔴 Yuqori |
| Dialog/Sheet titlelari | ~30+ | 🔴 Yuqori |
| `Error()` xabarlari (try/catch) | ~15+ | 🔴 Yuqori |
| Hardcoded label konstantlari (EXCEPTION_LABELS, QUICK_LINKS) | ~60+ | 🔴 Yuqori |
| Badge/label matn | ~25+ | 🟡 O'rta |
| Shartli UI matn (`{x ? "..." : "..."}`) | ~40+ | 🔴 Yuqori |
| Hardcoded ingliz so'z | ~20+ | 🟡 O'rta |

### `useTranslation` import qiluvchi, lekin baribir hardcoded ishlatadiganlar (eng yomon)

1. `OTPVerify.tsx` — line 15 da import bor, lekin 6 ta hardcoded
2. `ExceptionLog.tsx` — line 24 da import, 14 ta hardcoded const
3. `QueueMonitor.tsx` — line 15 da import, 4 ta hardcoded toast
4. `WarehouseDashboard.tsx` — line 36 da import, 6 ta hardcoded link
5. `QuickCreateModal.tsx` — import yo'q, 2 ta hardcoded dialog title

**To'liq Explore natijasi:** sessiya transkriptida, ~2000 tokenli batafsil tahlil bilan.

---

## Mashina o'qiy oladigan ma'lumotlar

- **Per-namespace counts:** `_audit_out/i18n-full-report.json`
- **Aktual qiymatlar:** `_audit_out/i18n-issues-details.json` (har bir namespace uchun to'liq ro'yxat)
- **Generator:** `_audit_out/i18n-full-analyzer.mjs` + `i18n-full-report-md.mjs`

Qayta ishga tushirish:
```bash
node _audit_out/i18n-full-analyzer.mjs
node _audit_out/i18n-full-report-md.mjs
```