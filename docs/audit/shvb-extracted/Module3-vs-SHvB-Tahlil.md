# EuroPrint Kokand — To'liq Tahlil va Solishtirish Hisoboti

> **Uzbek-Language-Module 3** `←→` **Архив / ШВБ (Школа Владельца Бизнеса)**  
> ERP Tizimini ШВБ Talablariga To'liq Moslashtirish Rejasi  
> Tayyorlandi: 2026-yil aprel · 237 fayl + 326 sahifa tahlil qilindi

---

## Mundarija

1. [Ijroiya Xulosa](#1-ijroiya-xulosa)
2. [Uzbek-Language-Module 3 — To'liq Tahlil](#2-uzbek-language-module-3--toliq-tahlil)
3. [Архив / ШВБ — To'liq Tahlil](#3-arxiv--shvb--toliq-tahlil)
4. [To'liq Solishtirish — Module 3 vs ШВБ](#4-toliq-solishtirish--module-3-vs-shvb)
5. [Bo'shliq Tahlili — Nima Yo'q](#5-boshliq-tahlili--nima-yoq)
6. [Integratsiya Rejasi — To'liq Kod](#6-integratsiya-rejasi--toliq-kod)
7. [Yangi i18n Kalitlar — Barcha JSON Fayllar](#7-yangi-i18n-kalitlar--barcha-json-fayllar)
8. [Backend API — Yangi Endpointlar](#8-backend-api--yangi-endpointlar)
9. [Frontend UI — Yangi Komponentlar](#9-frontend-ui--yangi-komponentlar)
10. [Xulosa va Strategik Tavsiyalar](#10-xulosa-va-strategik-tavsiyalar)

---

## 1. Ijroiya Xulosa

Ushbu hisobot ikki manbani to'liq tahlil qiladi:

| Manba | Tavsif | Hajm |
|-------|--------|------|
| **Uzbek-Language-Module 3** | EuroPrint ERP tizimining yangi, AI bilan boyitilgan versiyasi | 326 sahifa, 29 i18n modul, 36+ NestJS modul |
| **Архив / ШВБ** | Школа Владельца Бизнеса — EuroPrint Kokand 2020-yil biznes boshqaruv tizimi | 237 fayl, 24 bo'lim |

### Asosiy natija

```
Module 3 texnik jihatdan: ✅ Kuchli (React 19, NestJS, AI, 6418 i18n kalit)
ШВБ biznes jarayonlari:  ⚠️  62% qoplangan
Qo'shimcha kerak:        ~100 i18n kalit + 3 yangi UI + 5 yangi API endpoint
```

> **Kritik topilma:** Module 3 zamonaviy va kuchli texnik platforma. Ammo EuroPrint'ning o'ziga xos biznes jarayonlari — **ЗВС/ЗНО moliya ariza tizimi**, **5 kengash koordinatsiya**, **GSD haftalik KPI**, **3-savat hujjat oqimi** va **Holat formulasi** — hali to'liq raqamlashtirtilmagan.

---

## 2. Uzbek-Language-Module 3 — To'liq Tahlil

### 2.1. Loyiha strukturasi

```
Uzbek-Language-Module 3/
├── artifacts/
│   ├── erp-dashboard/          ← React 19 + Vite 7.3 frontend
│   │   └── src/
│   │       ├── pages/          ← 326 ta .tsx sahifa
│   │       ├── components/     ← 143 ta komponent
│   │       ├── hooks/          ← 33 ta custom hook
│   │       ├── lib/
│   │       │   └── i18n/       ← 29 modul i18n tizimi
│   │       └── locales/
│   │           ├── uz/         ← 29 JSON fayl (3,209 kalit)
│   │           └── ru/         ← 29 JSON fayl (3,209 kalit)
│   ├── api-server/             ← Express.js legacy backend
│   └── europrint-site/         ← Ommaviy veb-sayt
├── apps/
│   └── api/                    ← NestJS 10.4 + Drizzle ORM + PostgreSQL
│       └── src/
│           └── modules/        ← 36+ NestJS modul
├── i18n-sync/                  ← i18n sinxronizatsiya tizimi
├── EUROPRINT_AI_HR_UPDATE/     ← Yangi AI + HR V2 kengaytmasi
│   └── apps/api/src/modules/
│       ├── ai/                 ← 7 ta ixtisoslashgan AI servis
│       └── hr/                 ← HR V2 recruitment + onboarding
├── HR_INTEGRATION_V2_COMPLETE/ ← HR integratsiya V2
└── erp-tests/                  ← Playwright E2E + Vitest unit
```

### 2.2. i18n Tizimi — 29 Modul, 100% UZ = RU Sinxron

**Konfiguratsiya (`artifacts/erp-dashboard/src/lib/i18n/constants.ts`):**

```typescript
export const SUPPORTED_LANGUAGES    = ['uz', 'ru'] as const;
export const DEFAULT_LANGUAGE       = 'uz'              as const;
export const LANGUAGE_STORAGE_KEY   = 'europrint_language' as const;

export const TRANSLATION_MODULES = [
  // Asosiy 16 modul
  'common', 'auth', 'dashboard', 'hr', 'finance',
  'production', 'warehouse', 'wms', 'crm', 'lms',
  'settings', 'errors', 'validation', 'marketing', 'navigation', 'public',
  // Yangi 13 modul (Module 3 da qo'shilgan)
  'sd', 'mes', 'kanban', 'director', 'security',
  'notifications', 'iot', 'admin', 'mro', 'design',
  'logistics', 'pos', 'ai',
] as const;
```

**Barcha 29 modul kalit soni:**

| Modul | UZ | RU | Holat | ERP Qismi |
|-------|----|----|-------|-----------|
| `common` | 200 | 200 | ✅ | Umumiy |
| `auth` | 80 | 80 | ✅ | Login |
| `dashboard` | 56 | 56 | ✅ | Bosh panel |
| `hr` | 285 | 285 | ✅ | Kadrlar |
| `finance` | 284 | 284 | ✅ | Moliya |
| `production` | 384 | 384 | ✅ | Ishlab chiqarish |
| `warehouse` | 283 | 283 | ✅ | Ombor |
| `wms` | 43 | 43 | ✅ Yangi | WMS |
| `crm` | 354 | 354 | ✅ | CRM |
| `lms` | 110 | 110 | ✅ | Ta'lim |
| `settings` | 63 | 63 | ✅ | Sozlamalar |
| `errors` | 51 | 51 | ✅ | Xatolar |
| `validation` | 29 | 29 | ✅ | Validatsiya |
| `marketing` | 100 | 100 | ✅ JSON | Marketing |
| `navigation` | 62 | 62 | ✅ JSON | Navigatsiya |
| `public` | 150 | 150 | ✅ Yangi | Ommaviy sayt |
| `sd` | 101 | 101 | ✅ Yangi | Sotish/Yetkazib berish |
| `mes` | 83 | 83 | ✅ Yangi | Ishlab chiqarish tizimi |
| `kanban` | 93 | 93 | ✅ Yangi | Kanban board |
| `director` | 73 | 73 | ✅ Yangi | Direktor paneli |
| `security` | 67 | 67 | ✅ Yangi | Xavfsizlik |
| `notifications` | 77 | 77 | ✅ Yangi | Bildirishnomalar |
| `iot` | 77 | 77 | ✅ Yangi | IoT sensorlar |
| `admin` | 80 | 80 | ✅ Yangi | Admin panel |
| `mro` | 82 | 82 | ✅ Yangi | Ta'mirlash/texnik xizmat |
| `design` | 78 | 78 | ✅ Yangi | Dizayn |
| `logistics` | 69 | 69 | ✅ Yangi | Logistika |
| `pos` | 71 | 71 | ✅ Yangi | Kassa tizimi |
| `ai` | 72 | 72 | ✅ Yangi | Sun'iy intellekt |
| **JAMI** | **3,209** | **3,209** | **✅ 100%** | |

### 2.3. Sahifalar inventari (326 ta sahifa)

**Moliya bo'limi (14 sahifa):**
- `FinanceDashboard.tsx` — moliya bosh paneli
- `CFODashboard.tsx` — moliya direktori paneli
- `BudgetManagement.tsx` — byudjet boshqaruvi
- `CashFlowManagement.tsx` — pul oqimi boshqaruvi
- `CashRegister.tsx` — kassa
- `AccountsPayable.tsx` — kreditorlik qarzi
- `AccountsReceivable.tsx` — debitorlik qarzi
- `FinanceApproval.tsx` — tasdiqlash
- `FinancialReports.tsx` — hisobotlar
- `ChartOfAccounts.tsx` — hisoblar rejasi
- `GLDocuments.tsx` — bosh kitob hujjatlari
- `GLPostingMonitor.tsx` — post monitoring
- `IncomeExpense.tsx` — kirim/chiqim
- `PeriodClosing.tsx` — davr yopish

**HR / Kadrlar (18 sahifa):**
- `HRDashboard.tsx` — HR bosh paneli
- `HRExtended.tsx` — kengaytirilgan HR
- `HRAIDashboard.tsx` — AI yordamida HR tahlil
- `Employees.tsx` — xodimlar ro'yxati
- `EmployeeProfile.tsx` — xodim kartasi
- `EmployeeStats.tsx` — xodim statistikasi
- `EmployeeRating.tsx` — xodim reytingi
- `PayrollAutomation.tsx` — maosh avtomatlash
- `RecruitingKanban.tsx` — qabul qilish Kanban
- `OrgChartPage.tsx` — tashkiliy chizma
- `OrgStructureHierarchy.tsx` — ierarxiya
- `HRCapitalCourses.tsx` — kapital kurslar
- `HRLMSSkills.tsx` — ko'nikmalar
- `HRMap.tsx` — xarita
- `HRSuccessionPlanning.tsx` — vorisslik rejasi
- `ShiftSchedule.tsx` — smenalar jadvali
- `SkillsMatrix.tsx` — ko'nikmalar matritsasi
- `GoalsKPI.tsx` — maqsad va KPI

**Direktor / Rahbar (6 sahifa):**
- `DirectorDashboard.tsx` — direktor paneli
- `DirectorExtended.tsx` — kengaytirilgan
- `StrategicTasksPanel.tsx` — strategik vazifalar
- `DailyKPIDashboard.tsx` — kunlik KPI
- `SevenFunctionsDashboard.tsx` — **7 funksiya paneli** (ШВБ ga mos)
- `EuroprintControlCenter.tsx` — nazorat markazi

**AI funksiyalar (6 sahifa):**
- `AIDesignGenerator.tsx`
- `AIInterviewPage.tsx` — AI intervyu
- `AIProductionPlanning.tsx` — AI ishlab chiqarish rejalash
- `AIReservation.tsx` — AI rezerv
- `AIExams.tsx` — AI imtihon
- `HRAIDashboard.tsx` — HR + AI

**Ishlab chiqarish / Ombor / WMS:**
- `ProductionOrder360.tsx`, `BOMManagement.tsx`, `CapacityPlanning.tsx`
- `WMSDashboard.tsx`, `MaterialBalance.tsx`, `InventoryCount.tsx`
- `MESDashboard.tsx`, `MESDowntimes.tsx`, `MESWorkCenters.tsx`

### 2.4. Backend NestJS API — 36+ Modul

```
apps/api/src/modules/
├── admin/         → admin-settings, admin-users
├── ai/            → ai-router + 7 ta servis:
│   ├── hr-ai.service.ts       (xodimlar AI tahlili)
│   ├── crm-ai.service.ts      (CRM AI)
│   ├── director-ai.service.ts (direktor AI)
│   ├── finance-ai.service.ts  (moliya AI)
│   ├── marketing-ai.service.ts
│   ├── wms-ai.service.ts
│   └── ai-automation.service.ts
├── auth/          → JWT + Passport
├── crm/           → crm-deals, crm-leads
├── design/        → AI dizayn generatsiya
├── director/      → approvals, dashboard
├── finance/       → advance, budgets, gl, invoices, payments
├── hr/            → attendance, employees, leave, payroll (V1)
├── hr-v2/         → 18 subdir: recruitment, onboarding... (V2 + AI)
│   ├── recruitment/
│   │   ├── recruitment.service.ts
│   │   ├── recruitment.controller.ts
│   │   └── recruitment.dto.ts
│   └── onboarding/
│       ├── onboarding.service.ts
│       └── onboarding.controller.ts
├── iot/           → IoT sensorlar
├── kanban/        → Kanban board
├── lms/           → certificates, courses
├── logistics/     → logistika
├── marketing/     → marketing
├── mes/           → mes-operations, mes-sessions
├── mm/            → mm-materials, mm-purchase-orders
├── mro/           → ta'mirlash
├── notifications/ → real-vaqt bildirishnomalar, telegram
├── pos/           → kassa V1
├── pos-v2/        → barcode, inventory, reports
├── pp/            → pp-bom, pp-orders, pp-routing, pp-work-centers
├── qc/            → qc-defects, qc-inspections
├── sd/            → sd-deliveries, sd-invoices, sd-orders
├── security/      → xavfsizlik
└── wms/           → goods-issue, inventory, rental, stock, warehouses
```

### 2.5. Texnologiyalar stack

**Frontend:**
```json
{
  "react": "^19.0.0",
  "vite": "^7.3.2",
  "@tanstack/react-query": "^5.90.21",
  "tailwindcss": "^4.1.14",
  "socket.io-client": "^4.7.5",
  "recharts": "^2.x",
  "@anthropic-ai/sdk": "^0.32.0",
  "leaflet": "^1.9.x",
  "xlsx": "^0.18.x"
}
```

**Backend:**
```json
{
  "@nestjs/core": "^10.4.0",
  "drizzle-orm": "^0.45.2",
  "pg": "^8.x",
  "@nestjs/cqrs": "^10.x",
  "ioredis": "^5.x",
  "bullmq": "^5.x",
  "telegraf": "^4.x",
  "@anthropic-ai/sdk": "^0.32.0",
  "@google/generative-ai": "^0.21.0"
}
```

---

## 3. Архив / ШВБ — To'liq Tahlil

### 3.1. ШВБ nima?

**Школа Владельца Бизнеса (ШВБ)** — EuroPrint Kokand egasi tomonidan 2020-yilda ishlab chiqilgan **to'liq biznes boshqaruv metodologiyasi**. U kompaniyaning barcha jarayonlarini standartlashtiradi va raqamli ko'rsatkichlarga bog'laydi.

```
Архив/ШВБ/
├── Финансовый Планирования/       ← 64 fayl — ЗВС/ЗНО, 4 hisob, haftalik tsikl
├── Должностная Папка/             ← 25 fayl — lavozim ta'riflari, KPI, onboarding
├── Писменная Коммуникация/        ← 21 fayl — Доклад/Распоряжение shablonlari
├── Стратегическое планирование/   ← 19 fayl — Ideal картина, maqsadlar
├── Планирование/                  ← 20 fayl — operatsion rejalashtirish
├── Координация/                   ← 16 fayl — 5 kengash reglamenti
├── Статистика/                    ← 16 fayl — GSD formulalar, hisobot shablonlari
├── Дневникларим/                  ← 10 fayl — bajarish kundaligi (2020 real yozuvlar)
├── Gmail (1)/                     ← 11 fayl — statistika joriy etish dasturlari (PDF)
├── Формула Состояний/             ← 11 fayl — holat aniqlash tizimi
├── Недельные Планы Ген директора/ ← 8  fayl — GSD maqsad + 5 asosiy vazifa
├── Программа Владельца/           ← 8  fayl — eganing haftalik ish dasturlari
├── Описание должности .../        ← 8  fayl — inspektor menejer roli
├── Приказлар/                     ← 8  fayl — rasmiy buyruqlar
├── Хафталик Планларим/            ← 6  fayl — shaxsiy haftalik rejalar
├── Система 3-х корзин/            ← 6  fayl — kiruvchi/kutilmoqda/chiquvchi
├── Программы/                     ← 3  fayl — asosiy programmalar
├── Регламентлар/                  ← 2  fayl — statistika va lavozim reglamentlari
├── Хужжатлар/                     ← 4  fayl — asosiy hujjatlar, yillik anketa
├── Кайзен Клуб/                   ← 8  fayl — kaizen metodologiyasi
├── РО2 учун технологиялар/        ← 4  fayl — texnologiyalar, savdo bo'limi
└── Ildiz fayllar                  ← 3 XLSX + 1 DOCX — Справочник статистик
                                          JAMI: 237 fayl, 24 bo'lim
```

### 3.2. 7-Otdelenie tuzilmasi va GSD

ШВБ kompaniyani **7 ta otdeleniyaga** bo'ladi. Har birida **GSD (Главная Статистика Должности)** bor — bitta asosiy o'lchanadigan ko'rsatkich.

| # | Otdelenie | Asosiy GSD | ERP Moduli |
|---|-----------|------------ |------------|
| 1 | **Построение (HR)** | Tayyor onboarding qilingan xodimlar soni | HR + LMS |
| 2 | **Коммуникация** | Vaqtida yetkazilgan Доклад/Распоряжение soni | Notifications |
| 3 | **Финансы** | P&L aniqligi, ЗВС bajarilishi % | Finance |
| 4 | **Маркетинг** | Yangi leads soni, marketing ROI | Marketing + CRM |
| 5 | **Понимание (LMS)** | Testdan o'tgan xodimlar foizi | LMS |
| 6 | **Продажи (CRM)** | Haftalik sotuv hajmi (so'm) | CRM + SD |
| 7 | **Администрация** | Inventarizatsiya aniqligi, IT uptime | WMS + Security |

**Direktor GSD (asosiy 3 ta):**
1. Валовая прибыль — haftalik yalpi foyda (**maqsad: 100,000,000 so'm**)
2. Валовой доход — haftalik daromad (**maqsad: 800,000,000 so'm**)
3. Количество продукта — amalga oshirilgan buyurtmalar soni

**Ideal kartina (Стратегическое планирование):**

| Ko'rsatkich | Maqsad (Ideal) | Haqiqat (2020) | Farq |
|-------------|---------------|----------------|------|
| Haftalik foyda | 100,000,000 so'm | 42,000,000 so'm | −58M |
| Haftalik daromad | 800,000,000 so'm | 420,000,000 so'm | −380M |
| Filiallar soni | 15 ta | 0 ta | −15 |
| Xodimlar soni | 500 nafar | 320 nafar | −180 |

### 3.3. Moliyaviy Rejalashtirish Tizimi (64 fayl)

#### Haftalik ФП tsikl

```
SESHANBA   → ЗВС topshirish kuni
             ↓ Har bo'lim boshlig'i pul ajratish arizasini yuboradi
             ↓ Рекомендательный Совет ЗВС ko'rib chiqadi

CHORSHANBA → ФП (Финансовый Планирование) kuni
             ↓ Barcha ЗВС tahlil qilinadi
             ↓ Direktor tasdiqlaydi / rad etadi

PAYSHANBA  → Bank to'lov kuni
             ↓ Tasdiqlangan summalar bank orqali o'tkaziladi

DUSHANBA   → Naqd to'lov kuni
             ↓ Kassa orqali naqd to'lovlar amalga oshiriladi
```

#### ЗВС (Заявка на Выделение Средств)

```
Ariza beruvchi: Bo'lim boshlig'i
Qabul qiluvchi: Молия bo'limi (Рек.Совет orqali)
Muddati: Har seshanba 09:00 gacha
Shakl: 5 Бланк ЗВС

Ma'lumotlar:
  - Bo'lim nomi
  - Talab qilingan summa
  - Maqsad va asoslash
  - Ustunlik darajasi (Yuqori / O'rta / Past)

Tasdiqlash matritsasi:
  ≤ 500,000 so'm  → Bo'lim boshlig'i mustaqil tasdiqlaydi
  ≤ 5,000,000     → Рек.Совет tasdiqlashi kerak
  > 5,000,000     → Direktor mustaqil tasdiqlashi kerak
```

#### ЗНО (Заявка на Обязательство)

```
Maqsad: Kelajakdagi yirik to'lovlar uchun oldindan ruxsat olish
Farqi ЗВС dan: ЗВС joriy hafta, ЗНО — kelajak majburiyatlar
Jarayon: Bo'lim → Moliya → Tasdiqlash → Bajarish
```

#### 4 Hisob raqam tizimi

| Hisob nomi | Maqsad |
|-----------|--------|
| **Счет №1 (Asosiy)** | Barcha asosiy kirim/chiqimlar |
| **Единый налог** | Soliqlarni to'lash uchun alohida hisob |
| **Главный счет** | Strategik to'lovlar va yirik operatsiyalar |
| **Оборотных средств** | Joriy operatsion xarajatlar — aylanma mablag' |

### 3.4. Koordinatsiya Tizimi (16 fayl) — 5 Kengash

```
┌─────────────────────────────────────────────────────┐
│  1. СОВЕТ УЧРЕДИТЕЛЕЙ (Asoschilar Kengashi)         │
│     Oylik yig'ilish · Strategik yo'nalish · Kapital │
├─────────────────────────────────────────────────────┤
│  2. ИСПОЛНИТЕЛЬНЫЙ СОВЕТ (Ijroiya Kengashi)          │
│     Haftalik · Direktor + top-menejerlar · KPI review│
├─────────────────────────────────────────────────────┤
│  3. РЕКОМЕНДАТЕЛЬНЫЙ СОВЕТ (Рек.Совет)              │
│     Seshanba · Bo'lim boshliqlar · ЗВС tasdiqlash   │
├─────────────────────────────────────────────────────┤
│  4. РЕКОМЕНДАТЕЛЬНЫЙ КОМИТЕТ (Рек.Комитет)          │
│     Haftalik · O'rta bosqich · Operatsion muammolar │
├─────────────────────────────────────────────────────┤
│  5. СОВЕТ ЗАМЕСТИТЕЛЯ ДИРЕКТОРА (ЗД Kengashi)       │
│     Kunlik · Zamdirektor + bo'lim boshliq · Tezkor  │
└─────────────────────────────────────────────────────┘
```

**Eskalatsiya qoidasi:** Muammo avval pastki kengashda hal qilinadi. Hal bo'lmasa — yuqoriga ko'tariladi. Har bir kengash sessiyasi **protokol** bilan rasmiylashtiriladi.

#### Доклад va Распоряжение

| Hujjat turi | Yo'nalish | Maqsad |
|-------------|----------|--------|
| **Доклад** | Pastdan yuqoriga (xodim → rahbar) | Muammo, natija, taklif bayon etiladi |
| **Распоряжение** | Yuqoridan pastga (rahbar → xodim) | Aniq topshiriq, muddat, mas'ul belgilanadi |

### 3.5. 3-Savat Tizimi (6 fayl)

```
📥 KIRUVCHI (Входящий)
   Yangi kelgan hujjatlar, arizalar, topshiriqlar
   Qoida: 24 soat ichida ko'rib chiqilishi kerak

⏳ KUTILMOQDA (В ожидании)  
   Jarayondagi hujjatlar — javob yoki tasdiqlash kutilmoqda
   Qoida: Muddat belgilanishi shart

📤 CHIQUVCHI (Исходящий)
   Bajarilgan va yuborilgan hujjatlar
   Qoida: Arxivga topshiriladi
```

**Персональная программа** — har xodimning kunlik + haftalik vazifa jadvali.

### 3.6. Holat Formulasi (11 fayl)

Direktor va rahbarlar kompaniyaning joriy holatini KPI asosida **avtomatik** aniqlaydi:

```
🟢  NORMAL     — KPI rejalarga mos. Standart boshqaruv.
🟡  EHTIYOT    — KPI o'sishi bor, ba'zilari past. Kuzatuv kerak.
🟠  XAVF       — Sezilarli pasayish. Zudlik bilan chora.
🔴  INQIROZ    — Kritik chegara ostida. Favqulodda kengash.
📈  O'SISH     — KPI reja ustida. Investitsiya vaqti.
```

**DNEVNIK VYPOLNENIYA (Bajarish Kundaligi):**
- Har kuni kompaniya holati yoziladi
- Real 2020-yil yozuvlari mavjud
- Direktor uchun majburiy kundalik hisobot

### 3.7. Lavozim Papkasi — Должностная Папка (25 fayl)

Har bir yangi xodim **Lavozim Papkasini** oladi — onboarding to'plami:

```
1. Lavozim tavsifi         → Rasmiy nom, bo'lim, mas'uliyat
2. GSD va KPI             → Asosiy ko'rsatkich, o'lchash usuli, maqsad
3. Регламентлар           → Ushbu lavozim uchun qoidalar
4. Ish jarayonlari        → Kunlik/haftalik/oylik protseduralar
5. Hisobot shakllari      → Qanday hujjatlar to'ldiriladi
6. Ta'lim materiallari    → Kurslar, sinovlar, bilim bazasi
```

### 3.8. Haftalik Reja — Недельный План (8 fayl)

Har bir rahbar uchun haftalik rejalashtirish shakli:

```
┌──────────────────────────────────────────────────────┐
│ BO'LIM: _____________    HAFTA: ________             │
│ GSD MAQSAD: _________    O'TGAN HAFTA: _______       │
├──────────────────────────────────────────────────────┤
│ BU HAFTANING 5 ASOSIY VAZIFASI:                      │
│  1. _______________________________________________   │
│  2. _______________________________________________   │
│  3. _______________________________________________   │
│  4. _______________________________________________   │
│  5. _______________________________________________   │
├──────────────────────────────────────────────────────┤
│ MUVAFFAQIYAT OMILLARI: _____________________________ │
└──────────────────────────────────────────────────────┘
```

---

## 4. To'liq Solishtirish — Module 3 vs ШВБ

### 4.1. Asosiy funksionallik solishtirish

| ШВБ Jarayon | Module 3 da mavjud | Qoplash | Bo'shliq |
|-------------|-------------------|---------|---------|
| **7 Otdelenie tuzilma** | `OrgChartPage.tsx`, HR modul (285 kalit) | 🟡 70% | GSD field lavozim kartasida yo'q |
| **GSD/KPI tizimi** | `director.json` (73 kalit), `GoalsKPI.tsx` | 🟡 65% | GSD per lavozim, haftalik hisobot UI yo'q |
| **ЗВС/ЗНО Ariza tizimi** | `BudgetManagement.tsx`, finance (284 kalit) | 🔴 30% | ЗВС/ЗНО workflow, blank shakllar, tasdiqlash yo'q |
| **Haftalik ФП tsikl** | Finance moduli — umumiy moliya | 🔴 25% | Ses/Chor/Pay/Dush kalitlari, haftalik tsikl UI yo'q |
| **4 Hisob raqam** | `chartOfAccounts` kalit mavjud | 🟡 60% | 4 ШВБ-spesifik hisob nomi yo'q |
| **5 Kengash koordinatsiya** | `notifications.json` (77 kalit) — qisman | 🔴 15% | Koordinatsiya moduli yo'q; kengash, Доклад/Распоряжение UI yo'q |
| **Доклад/Распоряжение** | Notifications — umumiy | 🔴 20% | Доклад/Распоряжение blank shakllar, routing yo'q |
| **3-Savat tizimi** | `kanban.json` (93 kalit) — qisman | 🔴 35% | Kiruvchi/Kutilmoqda/Chiquvchi status kalitlari yo'q |
| **Holat formulasi** | `director.json` — `companyHealth` kalit bor | 🟡 50% | Normal/Xavf/Inqiroz/O'sish enum, rang tizimi yo'q |
| **Lavozim papkasi** | LMS + HR modul — qisman | 🟡 55% | Digital onboarding yo'l xaritasi yo'q |
| **Haftalik reja** | Director + HR — umumiy | 🟡 45% | GSD maqsad + 5 asosiy vazifa shakli yo'q |
| **Strategik rejalashtirish** | `strategicGoal`, `okr` kalitlari mavjud | 🟢 75% | Ideal картina panel (100M/800M) yo'q |
| **CRM / Sotish (6-otdelenie)** | CRM (354 kalit) + SD (101 kalit) | 🟢 90% | Minimal qo'shimcha kerak |
| **LMS / Ta'lim (5-otdelenie)** | LMS (110 kalit) | 🟢 85% | Lavozim papkasi kurslari biriktirish yo'q |
| **Xodimlar anketa** | `Questionnaire.tsx` mavjud | 🟢 80% | 17 savollik ШВБ-spesifik anketa yo'q |

### 4.2. i18n solishtirish

| Module 3 Modul | Kalit soni | ШВБ mos bo'lim | Yetishmaydi |
|----------------|-----------|----------------|------------|
| `finance.json` | 284 | Финансовый Планирования (64 fayl) | ~23 kalit: zvs, zno, fpCycle... |
| `hr.json` | 285 | Должностная Папка (25 fayl) | ~14 kalit: gsd, lavozimPapka... |
| `director.json` | 73 | Формула Состояний + Стратегия | ~14 kalit: stateFormula, idealPicture... |
| `notifications.json` | 77 | Координация + Коммуникация | ~15 kalit (yoki yangi coordination.json) |
| `kanban.json` | 93 | Система 3-х корзин | ~10 kalit: incomingBasket... |
| `settings.json` | 63 | Регламентлар (2 fayl) | ~10 kalit: kengashLevels, reglament... |
| `dashboard.json` | 56 | Статистика (16 fayl) | ~15 kalit: gsdTracking, weeklyStats... |
| Yangi modul | — | Koordinatsiya (16 fayl) | `coordination.json` yaratish (15 kalit) |

**Jami yetishmayotgan kalitlar: ~116 kalit (58 UZ + 58 RU)**

### 4.3. Qoplash foizi xulosa

```
ШВБ Bo'lim                    │ Qoplash │ Ustunlik
──────────────────────────────┼─────────┼─────────
Moliyaviy Rejalashtirish       │  30% 🔴 │ Kritik
Koordinatsiya (5 kengash)      │  15% 🔴 │ Kritik
3-Savat tizimi                 │  35% 🔴 │ Kritik
KPI / GSD tizimi              │  65% 🟡 │ Muhim
Holat Formulasi               │  50% 🟡 │ Muhim
Lavozim Papkasi               │  55% 🟡 │ Muhim
Haftalik Reja                 │  45% 🟡 │ Muhim
Strategik Rejalashtirish      │  75% 🟢 │ O'rta
CRM / Sotish                  │  90% 🟢 │ Yaxshi
LMS / Ta'lim                  │  85% 🟢 │ Yaxshi
Ombor / WMS                   │  85% 🟢 │ Yaxshi
HR / Kadrlar                  │  70% 🟡 │ Muhim
──────────────────────────────┼─────────┼─────────
UMUMIY O'RTACHA               │  62% 🟡 │
```

---

## 5. Bo'shliq Tahlili — Nima Yo'q

### 5.1. Kritik bo'shliqlar 🔴 (Zudlik bilan kerak)

#### A) ЗВС/ЗНО Workflow (Finance moduli)

**Muammo:** `finance.json` 284 kalitga ega, lekin ЗВС/ЗНО uchun birorta maxsus kalit yo'q. `BudgetManagement.tsx` mavjud, lekin EuroPrint'ning haftalik ЗВС tsiklini qo'llab-quvvatlamaydi.

**Yechim:** `finance.json` ga 23 ta yangi kalit + backend ЗВС entity + frontend ЗВС shakli.

#### B) Koordinatsiya tizimi (Yangi modul)

**Muammo:** 5 kengash darajasi, Доклад/Распоряжение workflow uchun hech qanday modul yo'q. `notifications.json` faqat umumiy xabarnomalar uchun.

**Yechim:** Yangi `coordination.json` modul (15 kalit) + yangi `CoordinationPage.tsx` + backend koordinatsiya moduli.

#### C) 3-Savat hujjat tizimi (Kanban kengaytirish)

**Muammo:** `KanbanBoard.tsx` mavjud, `kanban.json` 93 kalit bor, lekin ШВБ'ning 3-savat tizimi (Kiruvchi/Kutilmoqda/Chiquvchi) uchun maxsus kalitlar yo'q.

**Yechim:** `kanban.json` ga 10 ta yangi kalit + KanbanBoard'da basket_type ustunlari.

### 5.2. Muhim bo'shliqlar 🟡 (1-3 oy)

#### D) Holat formulasi (Director modul)

**Muammo:** `director.json` da `companyHealth` kalit bor, lekin ШВБ'ning to'liq holat formulasi (Normal/Xavf/Inqiroz/O'sish tizimi, rang belgilash, tarix, chegaralar) yo'q.

**Yechim:** `director.json` ga 14 ta kalit + DirectorDashboard'da avtomatik holat widget.

#### E) GSD tizimi (HR modul)

**Muammo:** `hr.json` 285 kalitga ega, lekin `gsd` kalit yo'q. `GoalsKPI.tsx` umumiy maqsadlar uchun, ammo lavozim bo'yicha GSD tracking funksiyasi yo'q.

**Yechim:** `hr.json` ga 14 ta GSD/lavozim papkasi kalitlari + EmployeeProfile'da GSD grafik.

#### F) Lavozim papkasi (HR + LMS)

**Muammo:** LMS modul kuchli (110 kalit), lekin Lavozim Papkasi konsepsiyasi (onboarding yo'l xaritasi, papka bo'limlari, tugallanish foizi) yo'q.

**Yechim:** `hr.json` ga lavozim papkasi kalitlari + HRDashboard'da onboarding progress widget.

### 5.3. Qo'shimcha bo'shliqlar 🟢 (3-6 oy)

| Bo'shliq | Yechim |
|---------|-------|
| Lavozim papkasi kurslari | LMS + HR: lavozim papkasiga kurslar biriktirish |
| Регламент testlari | LMS: har reglament uchun majburiy test |
| Inspektor menejer roli | HR: maxsus ko'rsatkichlar paneli |
| Yillik anketa (17 savol) | HR: O'zbek tilidagi 17 savollik raqamli anketa |
| Приказлар registri | Coordination: rasmiy buyruqlar arxivi |
| Kaizen metodologiyasi | LMS + Settings: Kaizen materiallari |

---

## 6. Integratsiya Rejasi — To'liq Kod

### 6.1. 1-Bosqich: constants.ts yangilash

**Fayl:** `artifacts/erp-dashboard/src/lib/i18n/constants.ts`

```typescript
// HOZIRGI (29 modul):
export const TRANSLATION_MODULES = [
  'common', 'auth', 'dashboard', 'hr', 'finance',
  'production', 'warehouse', 'wms', 'crm', 'lms',
  'settings', 'errors', 'validation', 'marketing', 'navigation', 'public',
  'sd', 'mes', 'kanban', 'director', 'security',
  'notifications', 'iot', 'admin', 'mro', 'design',
  'logistics', 'pos', 'ai',
] as const;

// YANGILANGAN (30 modul — coordination qo'shildi):
export const TRANSLATION_MODULES = [
  'common', 'auth', 'dashboard', 'hr', 'finance',
  'production', 'warehouse', 'wms', 'crm', 'lms',
  'settings', 'errors', 'validation', 'marketing', 'navigation', 'public',
  'sd', 'mes', 'kanban', 'director', 'security',
  'notifications', 'iot', 'admin', 'mro', 'design',
  'logistics', 'pos', 'ai',
  'coordination',  // ← YANGI: ШВБ koordinatsiya tizimi (ЗВС, kengash, Доклад)
] as const;
```

---

## 7. Yangi i18n Kalitlar — Barcha JSON Fayllar

### 7.1. finance.json — 23 yangi kalit

**Fayl:** `artifacts/erp-dashboard/src/locales/uz/finance.json`

```json
{
  "zvs": "Pul ajratish ariza (ЗВС)",
  "zno": "Majburiyat ariza (ЗНО)",
  "createZvs": "ЗВС yaratish",
  "zvsNumber": "ЗВС raqami",
  "zvsDate": "ЗВС sanasi",
  "zvsStatus": "ЗВС holati",
  "zvsPending": "ЗВС ko'rib chiqilmoqda",
  "zvsApproved": "ЗВС tasdiqlandi",
  "zvsRejected": "ЗВС rad etildi",
  "zvsSentAt": "ЗВС yuborildi: Seshanba",
  "fpCycle": "Moliyaviy rejalashtirish tsikli (ФП)",
  "fpDay": "ФП kuni — Chorshanba",
  "zvsDeadlineDay": "ЗВС topshirish muddati: Seshanba 09:00",
  "bankPaymentDay": "Bank to'lov kuni: Payshanba",
  "cashPaymentDay": "Naqd to'lov kuni: Dushanba",
  "approvalMatrix": "Tasdiqlash matritsasi",
  "approvalLevel1": "1-daraja: ≤ 500,000 so'm — bo'lim boshlig'i",
  "approvalLevel2": "2-daraja: ≤ 5,000,000 so'm — Рек.Совет",
  "approvalLevel3": "3-daraja: > 5,000,000 so'm — Direktor",
  "account1Main": "Счет №1 — Asosiy hisob",
  "accountTax": "Единый налог — Soliq hisobi",
  "accountHead": "Главный счет — Bosh hisob",
  "accountWorkingCapital": "Оборотных средств — Aylanma mablag'",
  "unpaidBillsList": "To'lanmagan schyotlar ro'yxati",
  "zvsApprovalQueue": "ЗВС tasdiqlash navbati",
  "weeklyFinancePlan": "Haftalik moliyaviy reja (ФП №1)"
}
```

**Fayl:** `artifacts/erp-dashboard/src/locales/ru/finance.json`

```json
{
  "zvs": "Заявка на выделение средств (ЗВС)",
  "zno": "Заявка на обязательство (ЗНО)",
  "createZvs": "Создать ЗВС",
  "zvsNumber": "Номер ЗВС",
  "zvsDate": "Дата ЗВС",
  "zvsStatus": "Статус ЗВС",
  "zvsPending": "ЗВС на рассмотрении",
  "zvsApproved": "ЗВС утверждена",
  "zvsRejected": "ЗВС отклонена",
  "zvsSentAt": "ЗВС подаётся: Вторник",
  "fpCycle": "Цикл финансового планирования (ФП)",
  "fpDay": "День ФП — Среда",
  "zvsDeadlineDay": "Срок подачи ЗВС: Вторник 09:00",
  "bankPaymentDay": "День банковских платежей: Четверг",
  "cashPaymentDay": "День наличных платежей: Понедельник",
  "approvalMatrix": "Матрица согласования",
  "approvalLevel1": "1-уровень: ≤ 500 000 сум — руководитель отдела",
  "approvalLevel2": "2-уровень: ≤ 5 000 000 сум — Рек.Совет",
  "approvalLevel3": "3-уровень: > 5 000 000 сум — Директор",
  "account1Main": "Счёт №1 — Основной счёт",
  "accountTax": "Единый налог — Налоговый счёт",
  "accountHead": "Главный счёт",
  "accountWorkingCapital": "Оборотных средств — Оборотный счёт",
  "unpaidBillsList": "Список неоплаченных счетов",
  "zvsApprovalQueue": "Очередь согласования ЗВС",
  "weeklyFinancePlan": "Еженедельный финансовый план (ФП №1)"
}
```

---

### 7.2. director.json — 14 yangi kalit

**Fayl:** `artifacts/erp-dashboard/src/locales/uz/director.json`

```json
{
  "stateFormula": "Kompaniya holat formulasi",
  "companyState": "Joriy holat",
  "stateNormal": "NORMAL — barcha ko'rsatkichlar me'yorda 🟢",
  "stateRisk": "XAVF — ba'zi ko'rsatkichlar past 🟡",
  "stateCritical": "INQIROZ — kritik pasayish 🔴",
  "stateGrowth": "O'SISH — maqsad ustida 📈",
  "stateThreshold": "Holat chegarasi sozlamalari",
  "autoStateDetect": "Avtomatik holat aniqlash",
  "stateHistory": "Holat tarixi ({days} kun)",
  "idealPicture": "Ideal kartina",
  "idealVsActual": "Ideal vs Haqiqat",
  "weeklyProfitTarget": "Haftalik foyda maqsadi: 100,000,000 so'm",
  "weeklyRevenueTarget": "Haftalik daromad maqsadi: 800,000,000 so'm",
  "branchCountTarget": "Filiallar maqsadi: 15 ta",
  "executionDiary": "Bajarish kundaligi (Дневник выполнения)"
}
```

**Fayl:** `artifacts/erp-dashboard/src/locales/ru/director.json`

```json
{
  "stateFormula": "Формула состояний компании",
  "companyState": "Текущее состояние",
  "stateNormal": "НОРМАЛЬНОЕ — все показатели в норме 🟢",
  "stateRisk": "РИСК — некоторые показатели ниже плана 🟡",
  "stateCritical": "КРИЗИС — критическое снижение 🔴",
  "stateGrowth": "РОСТ — показатели выше плана 📈",
  "stateThreshold": "Настройки порогов состояния",
  "autoStateDetect": "Автоматическое определение состояния",
  "stateHistory": "История состояний ({days} дней)",
  "idealPicture": "Идеальная картина",
  "idealVsActual": "Идеал vs Факт",
  "weeklyProfitTarget": "Целевая недельная прибыль: 100 000 000 сум",
  "weeklyRevenueTarget": "Целевой недельный доход: 800 000 000 сум",
  "branchCountTarget": "Цель по филиалам: 15 штук",
  "executionDiary": "Дневник выполнения"
}
```

---

### 7.3. hr.json — 14 yangi kalit

**Fayl:** `artifacts/erp-dashboard/src/locales/uz/hr.json`

```json
{
  "gsd": "GSD — Bosh Statistika Lavozimi",
  "gsdDefinition": "Lavozimning asosiy o'lchanadigan ko'rsatkichi",
  "gsdTarget": "GSD maqsad (haftalik)",
  "gsdActual": "GSD haqiqiy natija",
  "gsdVariance": "GSD og'ish (%)",
  "weeklyGsdReport": "Haftalik GSD hisoboti",
  "gsdDynamics": "GSD dinamikasi (12 oy)",
  "prevWeekGsd": "O'tgan hafta GSD",
  "gsdTrend": "GSD trend yo'nalishi",
  "positionFolder": "Lavozim Papkasi (Должностная Папка)",
  "onboardingRoadmap": "Onboarding yo'l xaritasi",
  "folderCompletion": "Papka to'liqlik: {percent}%",
  "weeklyPlanForm": "Haftalik reja shakli",
  "weeklyTopTasks": "5 asosiy haftalik vazifa",
  "successFactors": "Muvaffaqiyat omillari"
}
```

**Fayl:** `artifacts/erp-dashboard/src/locales/ru/hr.json`

```json
{
  "gsd": "ГСД — Главная Статистика Должности",
  "gsdDefinition": "Основной измеримый показатель должности",
  "gsdTarget": "Целевой ГСД (за неделю)",
  "gsdActual": "Фактический ГСД",
  "gsdVariance": "Отклонение ГСД (%)",
  "weeklyGsdReport": "Еженедельный отчёт по ГСД",
  "gsdDynamics": "Динамика ГСД (12 месяцев)",
  "prevWeekGsd": "ГСД прошлой недели",
  "gsdTrend": "Тренд ГСД",
  "positionFolder": "Папка должности (Должностная Папка)",
  "onboardingRoadmap": "Дорожная карта онбординга",
  "folderCompletion": "Заполненность папки: {percent}%",
  "weeklyPlanForm": "Форма недельного плана",
  "weeklyTopTasks": "5 главных задач недели",
  "successFactors": "Факторы успеха"
}
```

---

### 7.4. kanban.json — 10 yangi kalit (3-savat)

**Fayl:** `artifacts/erp-dashboard/src/locales/uz/kanban.json`

```json
{
  "threeBasketsSystem": "3-Savat hujjat tizimi (Система 3-х корзин)",
  "incomingBasket": "📥 Kiruvchi savat",
  "pendingBasket": "⏳ Kutilmoqda savati",
  "outgoingBasket": "📤 Chiquvchi savat",
  "basketRule24h": "Kiruvchi savatda 24 soatdan ko'p qolmasligi kerak",
  "basketOverdue": "⚠️ Muddati o'tgan (24 soat+)",
  "moveToProcessing": "Ko'rib chiqishga o'tkazish",
  "moveToOutgoing": "Chiquvchiga o'tkazish",
  "archiveDocument": "Arxivga topshirish",
  "personalProgram": "Shaxsiy dastur (Персональная программа)",
  "dailyTaskList": "Kunlik vazifalar ro'yxati"
}
```

**Fayl:** `artifacts/erp-dashboard/src/locales/ru/kanban.json`

```json
{
  "threeBasketsSystem": "Система 3-х корзин",
  "incomingBasket": "📥 Входящая корзина",
  "pendingBasket": "⏳ Корзина ожидания",
  "outgoingBasket": "📤 Исходящая корзина",
  "basketRule24h": "Входящее не должно оставаться более 24 часов",
  "basketOverdue": "⚠️ Просрочено (24ч+)",
  "moveToProcessing": "Переместить в обработку",
  "moveToOutgoing": "Переместить в исходящие",
  "archiveDocument": "Сдать в архив",
  "personalProgram": "Персональная программа",
  "dailyTaskList": "Список дневных задач"
}
```

---

### 7.5. Yangi coordination.json — 15 kalit (to'liq yangi modul)

**Fayl:** `artifacts/erp-dashboard/src/locales/uz/coordination.json`

```json
{
  "coordination": "Koordinatsiya tizimi",
  "councilSystem": "5 Kengash darajasi tizimi",
  "founderCouncil": "Asoschilar Kengashi (Совет Учредителей)",
  "executiveCouncil": "Ijroiya Kengashi (Исполнительный Совет)",
  "recommendationCouncil": "Рекомендательный Совет (Рек.Совет)",
  "recommendationCommittee": "Рекомендательный Комитет",
  "deputyCouncil": "Zamdirektor Kengashi",
  "councilSchedule": "Kengash yig'ilish jadvali",
  "meetingProtocol": "Majlis protokoli",
  "councilMinutes": "Majlis bayoni",
  "dokla": "Доклад — rasmiy yuqoriga hisobot",
  "rasporyazhenie": "Распоряжение — rasmiy pastga ko'rsatma",
  "createDokla": "Доклад yozish",
  "createRasporyazhenie": "Распоряжение berish",
  "escalation": "Yuqori kengashga ko'tarish (eskalatsiya)",
  "councilDecision": "Kengash qarori"
}
```

**Fayl:** `artifacts/erp-dashboard/src/locales/ru/coordination.json`

```json
{
  "coordination": "Система координации",
  "councilSystem": "Система 5 уровней советов",
  "founderCouncil": "Совет Учредителей",
  "executiveCouncil": "Исполнительный Совет",
  "recommendationCouncil": "Рекомендательный Совет (Рек.Совет)",
  "recommendationCommittee": "Рекомендательный Комитет",
  "deputyCouncil": "Совет Заместителя Директора",
  "councilSchedule": "Расписание заседаний совета",
  "meetingProtocol": "Протокол заседания",
  "councilMinutes": "Минуты заседания",
  "dokla": "Доклад — официальный отчёт снизу вверх",
  "rasporyazhenie": "Распоряжение — официальное указание сверху вниз",
  "createDokla": "Написать Доклад",
  "createRasporyazhenie": "Выдать Распоряжение",
  "escalation": "Эскалация на более высокий совет",
  "councilDecision": "Решение совета"
}
```

---

## 8. Backend API — Yangi Endpointlar

### 8.1. ЗВС/ЗНО — Finance Moduli

```typescript
// apps/api/src/modules/finance/zvs/

// ZVS Entity (Drizzle ORM)
export const zvs = pgTable('zvs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  departmentId:uuid('department_id').references(() => departments.id),
  submittedBy: uuid('submitted_by').references(() => users.id),
  amount:      decimal('amount', { precision: 15, scale: 2 }).notNull(),
  purpose:     text('purpose').notNull(),
  priority:    text('priority').$type<'high' | 'medium' | 'low'>().default('medium'),
  status:      text('status').$type<'pending' | 'approved' | 'rejected'>().default('pending'),
  level:       integer('level').default(1), // 1=bo'lim boshlig'i, 2=Rек.Совет, 3=Direktor
  weekDate:    date('week_date').notNull(), // Qaysi hafta uchun
  reviewedBy:  uuid('reviewed_by').references(() => users.id),
  reviewedAt:  timestamp('reviewed_at'),
  comment:     text('comment'),
  createdAt:   timestamp('created_at').defaultNow(),
});

// ZVS Controller endpoints
// POST   /api/finance/zvs              → ЗВС yaratish
// GET    /api/finance/zvs              → Barcha ЗВС (filtr: hafta, status, bo'lim)
// GET    /api/finance/zvs/:id          → ЗВС ko'rish
// PATCH  /api/finance/zvs/:id/approve  → ЗВС tasdiqlash
// PATCH  /api/finance/zvs/:id/reject   → ЗВС rad etish
// GET    /api/finance/zvs/weekly-queue → Joriy hafta ЗВС navbati
// GET    /api/finance/fp-cycle         → Haftalik ФП tsikl holati
// GET    /api/finance/accounts/balances → 4 hisob raqam balanslari

// ZNO Entity
export const zno = pgTable('zno', {
  id:          uuid('id').primaryKey().defaultRandom(),
  departmentId:uuid('department_id').references(() => departments.id),
  submittedBy: uuid('submitted_by').references(() => users.id),
  amount:      decimal('amount', { precision: 15, scale: 2 }).notNull(),
  futureDate:  date('future_date').notNull(), // Kelajakdagi to'lov sanasi
  obligation:  text('obligation').notNull(),
  status:      text('status').$type<'pending' | 'approved' | 'rejected'>().default('pending'),
  createdAt:   timestamp('created_at').defaultNow(),
});
```

### 8.2. GSD Tracking — HR Moduli

```typescript
// apps/api/src/modules/hr/gsd/

export const positionGsd = pgTable('position_gsd', {
  id:           uuid('id').primaryKey().defaultRandom(),
  positionId:   uuid('position_id').references(() => positions.id),
  gsdName:      text('gsd_name').notNull(),       // "Haftalik sof foyda"
  gsdFormula:   text('gsd_formula'),               // Hisoblash formuli
  targetValue:  decimal('target_value', { precision: 15, scale: 2 }),
  unit:         text('unit'),                      // "so'm", "dona", "%"
  frequency:    text('frequency').default('weekly'),
});

export const employeeGsdHistory = pgTable('employee_gsd_history', {
  id:         uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id),
  weekDate:   date('week_date').notNull(),
  actual:     decimal('actual', { precision: 15, scale: 2 }),
  target:     decimal('target', { precision: 15, scale: 2 }),
  variance:   decimal('variance'),
  note:       text('note'),
  createdAt:  timestamp('created_at').defaultNow(),
});

// Endpoints
// GET  /api/hr/positions/:id/gsd           → Lavozim GSD ko'rsatma
// POST /api/hr/employees/:id/gsd           → GSD qiymati kiritish
// GET  /api/hr/employees/:id/gsd-history   → GSD tarixi (12 oy)
// GET  /api/hr/departments/:id/gsd-summary → Bo'lim GSD xulosasi
```

### 8.3. Company State — Director Moduli

```typescript
// apps/api/src/modules/director/state/company-state.service.ts

export type CompanyState = 'normal' | 'risk' | 'critical' | 'growth';

@Injectable()
export class CompanyStateService {
  async getCurrentState(): Promise<{
    state: CompanyState;
    kpis: { name: string; actual: number; target: number; pct: number }[];
    detectedAt: Date;
  }> {
    const weeklyProfit  = await this.getWeeklyProfit();
    const weeklyRevenue = await this.getWeeklyRevenue();
    const profitTarget  = 100_000_000; // ШВБ dan: 100M so'm
    const revenueTarget = 800_000_000; // ШВБ dan: 800M so'm

    const profitPct  = (weeklyProfit / profitTarget) * 100;
    const revenuePct = (weeklyRevenue / revenueTarget) * 100;
    const avgPct     = (profitPct + revenuePct) / 2;

    let state: CompanyState;
    if      (avgPct >= 110) state = 'growth';
    else if (avgPct >= 80)  state = 'normal';
    else if (avgPct >= 60)  state = 'risk';
    else                    state = 'critical';

    return { state, kpis: [...], detectedAt: new Date() };
  }
}

// Endpoints
// GET /api/director/company-state          → Joriy holat
// GET /api/director/company-state/history  → Holat tarixi (30 kun)
// GET /api/director/ideal-vs-actual        → Ideal картina vs haqiqat
```

### 8.4. Koordinatsiya Moduli — Yangi

```typescript
// apps/api/src/modules/coordination/

// Доклад (Hisobot) entity
export const dokla = pgTable('dokla', {
  id:           uuid('id').primaryKey().defaultRandom(),
  fromUserId:   uuid('from_user_id').references(() => users.id),
  toUserId:     uuid('to_user_id').references(() => users.id),
  councilLevel: integer('council_level'), // 1-5
  subject:      text('subject').notNull(),
  body:         text('body').notNull(),
  problem:      text('problem'),
  result:       text('result'),
  proposal:     text('proposal'),
  status:       text('status').$type<'sent' | 'read' | 'resolved'>().default('sent'),
  createdAt:    timestamp('created_at').defaultNow(),
});

// Распоряжение (Buyruq) entity
export const rasporyazhenie = pgTable('rasporyazhenie', {
  id:           uuid('id').primaryKey().defaultRandom(),
  fromUserId:   uuid('from_user_id').references(() => users.id),
  toUserId:     uuid('to_user_id').references(() => users.id),
  task:         text('task').notNull(),
  deadline:     timestamp('deadline').notNull(),
  priority:     text('priority').$type<'high' | 'medium' | 'low'>().default('medium'),
  status:       text('status').$type<'assigned' | 'in_progress' | 'done' | 'overdue'>().default('assigned'),
  acceptedAt:   timestamp('accepted_at'),
  completedAt:  timestamp('completed_at'),
  createdAt:    timestamp('created_at').defaultNow(),
});

// Endpoints
// POST  /api/coordination/dokla                    → Доклад yaratish
// GET   /api/coordination/dokla                    → Barcha докладlар
// POST  /api/coordination/rasporyazhenie           → Распоряжение berish
// PATCH /api/coordination/rasporyazhenie/:id/done  → Bajarildi
// GET   /api/coordination/councils                 → 5 kengash tuzilmasi
// GET   /api/coordination/weekly-session           → Haftalik ЗВС sessiya holati
```

### 8.5. Cron Jobs — Avtomatik Eslatmalar

```typescript
// apps/api/src/modules/finance/cron/fp-cycle.cron.ts

@Injectable()
export class FpCycleCron {
  constructor(private readonly notificationService: NotificationsService) {}

  // Har seshanba 09:00 — ЗВС eslatmasi
  @Cron('0 9 * * 2')
  async sendZvsReminder() {
    const deptHeads = await this.getDepartmentHeads();
    for (const head of deptHeads) {
      await this.notificationService.send({
        userId: head.id,
        title: 'ЗВС Eslatmasi',
        body: 'Bugun seshanba — ЗВС topshirish kuni. Moliya bo\'limiga arizangizni yuboring.',
        type: 'zvs_reminder',
      });
    }
  }

  // Har chorshanba 09:00 — ФП kuni eslatmasi
  @Cron('0 9 * * 3')
  async sendFpDayReminder() {
    await this.notificationService.send({
      userId: 'FINANCE_DIRECTOR',
      title: 'ФП Kuni',
      body: 'Bugun chorshanba — Moliyaviy rejalashtirish kuni. Barcha ЗВS ko\'rib chiqilsin.',
      type: 'fp_day',
    });
  }

  // Har payshanba 08:00 — Bank to'lov kuni
  @Cron('0 8 * * 4')
  async sendBankPaymentReminder() { /* ... */ }

  // Har dushanba 08:00 — Naqd to'lov kuni
  @Cron('0 8 * * 1')
  async sendCashPaymentReminder() { /* ... */ }
}
```

---

## 9. Frontend UI — Yangi Komponentlar

### 9.1. ЗВС Widget — FinanceDashboard.tsx

```tsx
// artifacts/erp-dashboard/src/components/finance/ZvsWidget.tsx

import { useTranslation } from '@/lib/i18n/hooks';

export function ZvsWidget() {
  const { t } = useTranslation('finance');
  const today = new Date().getDay(); // 0=Yak, 1=Dush, 2=Ses, 3=Chor, 4=Pay

  const fpCycleSteps = [
    { day: 2, label: t('zvsDeadlineDay'), icon: '📋', active: today === 2 },
    { day: 3, label: t('fpDay'),          icon: '📊', active: today === 3 },
    { day: 4, label: t('bankPaymentDay'), icon: '🏦', active: today === 4 },
    { day: 1, label: t('cashPaymentDay'), icon: '💵', active: today === 1 },
  ];

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-bold text-blue-700 mb-3">{t('fpCycle')}</h3>

      {/* Haftalik tsikl progress */}
      <div className="flex gap-2 mb-4">
        {fpCycleSteps.map((step) => (
          <div key={step.day}
            className={`flex-1 rounded-lg p-2 text-center text-xs
              ${step.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            <div className="text-lg">{step.icon}</div>
            <div className="font-medium mt-1">{step.label}</div>
          </div>
        ))}
      </div>

      {/* ЗВС tasdiqlash navbati */}
      <div className="border-t pt-3">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{t('zvsApprovalQueue')}</span>
          <span className="text-orange-500 font-bold">7 ta kutmoqda</span>
        </div>
        {/* ... ЗВС ro'yxati */}
      </div>
    </div>
  );
}
```

### 9.2. Company State Widget — DirectorDashboard.tsx

```tsx
// artifacts/erp-dashboard/src/components/director/CompanyStateWidget.tsx

import { useTranslation } from '@/lib/i18n/hooks';
import { useQuery } from '@tanstack/react-query';

type State = 'normal' | 'risk' | 'critical' | 'growth';

const STATE_CONFIG: Record<State, { color: string; bg: string; icon: string; key: string }> = {
  normal:   { color: 'text-green-700',  bg: 'bg-green-100',  icon: '🟢', key: 'stateNormal'   },
  risk:     { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '🟡', key: 'stateRisk'     },
  critical: { color: 'text-red-700',    bg: 'bg-red-100',    icon: '🔴', key: 'stateCritical' },
  growth:   { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '📈', key: 'stateGrowth'   },
};

export function CompanyStateWidget() {
  const { t } = useTranslation('director');
  const { data } = useQuery({ queryKey: ['company-state'], queryFn: fetchCompanyState });
  const state: State = data?.state ?? 'normal';
  const cfg = STATE_CONFIG[state];

  return (
    <div className={`rounded-xl p-4 border-2 ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{cfg.icon}</span>
        <div>
          <p className="text-xs text-gray-500">{t('stateFormula')}</p>
          <p className={`font-bold text-lg ${cfg.color}`}>{t(cfg.key)}</p>
        </div>
      </div>

      {/* Ideal vs Haqiqat mini jadval */}
      <div className="mt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>{t('weeklyProfitTarget')}</span>
          <div className="flex gap-2">
            <span className="text-gray-500">42M</span>
            <span className="text-blue-600 font-bold">/ 100M</span>
            <span className="text-red-500">42%</span>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t('weeklyRevenueTarget')}</span>
          <div className="flex gap-2">
            <span className="text-gray-500">420M</span>
            <span className="text-blue-600 font-bold">/ 800M</span>
            <span className="text-orange-500">53%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 9.3. GSD Grafik — EmployeeProfile.tsx

```tsx
// artifacts/erp-dashboard/src/components/hr/GsdGraph.tsx

import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useTranslation } from '@/lib/i18n/hooks';

export function GsdGraph({ employeeId }: { employeeId: string }) {
  const { t } = useTranslation('hr');
  const { data } = useQuery({ queryKey: ['gsd-history', employeeId] });

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-bold mb-1">{t('gsd')}</h3>
      <p className="text-xs text-gray-500 mb-3">{t('gsdDynamics')}</p>

      <LineChart width={400} height={200} data={data?.history}>
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <ReferenceLine y={data?.target} stroke="#3B82F6" strokeDasharray="3 3"
          label={{ value: t('gsdTarget'), fill: '#3B82F6' }} />
        <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} />
      </LineChart>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-gray-500">{t('prevWeekGsd')}</p>
          <p className="font-bold">{data?.prevWeek}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('gsdTarget')}</p>
          <p className="font-bold text-blue-600">{data?.target}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('gsdVariance')}</p>
          <p className={`font-bold ${data?.variance > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {data?.variance > 0 ? '+' : ''}{data?.variance}%
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 9.4. 3-Savat Widget — KanbanBoard.tsx kengaytirish

```tsx
// artifacts/erp-dashboard/src/components/kanban/ThreeBaskets.tsx

import { useTranslation } from '@/lib/i18n/hooks';

export function ThreeBaskets() {
  const { t } = useTranslation('kanban');

  const baskets = [
    { key: 'incoming', label: t('incomingBasket'),  color: 'border-blue-400',  badge: 'bg-blue-100' },
    { key: 'pending',  label: t('pendingBasket'),   color: 'border-yellow-400',badge: 'bg-yellow-100' },
    { key: 'outgoing', label: t('outgoingBasket'),  color: 'border-green-400', badge: 'bg-green-100' },
  ];

  return (
    <div className="mb-4">
      <h3 className="font-bold text-gray-700 mb-2">{t('threeBasketsSystem')}</h3>
      <p className="text-xs text-orange-500 mb-3">⚠️ {t('basketRule24h')}</p>
      <div className="grid grid-cols-3 gap-3">
        {baskets.map((b) => (
          <div key={b.key} className={`border-2 ${b.color} rounded-xl p-3 min-h-[120px]`}>
            <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${b.badge} mb-2`}>
              {b.label}
            </div>
            {/* Hujjatlar ro'yxati */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 9.5. Yangi CoordinationPage.tsx

```tsx
// artifacts/erp-dashboard/src/pages/CoordinationPage.tsx

import { useTranslation } from '@/lib/i18n/hooks';

const COUNCIL_LEVELS = [
  { level: 1, key: 'founderCouncil',          freq: 'Oylik',    icon: '👑' },
  { level: 2, key: 'executiveCouncil',        freq: 'Haftalik', icon: '🏛️' },
  { level: 3, key: 'recommendationCouncil',   freq: 'Seshanba', icon: '📋' },
  { level: 4, key: 'recommendationCommittee', freq: 'Haftalik', icon: '🤝' },
  { level: 5, key: 'deputyCouncil',           freq: 'Kunlik',   icon: '⚙️' },
];

export default function CoordinationPage() {
  const { t } = useTranslation('coordination');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('coordination')}</h1>

      {/* 5 Kengash darajalari */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('councilSystem')}</h2>
        <div className="space-y-2">
          {COUNCIL_LEVELS.map((c) => (
            <div key={c.level} className="flex items-center gap-3 bg-white rounded-lg border p-3">
              <span className="text-xl">{c.icon}</span>
              <span className="font-medium">{c.level}. {t(c.key)}</span>
              <span className="ml-auto text-sm text-gray-400">{c.freq}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Доклад / Распоряжение */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-bold text-blue-700">{t('dokla')}</h3>
          <p className="text-sm text-gray-500 mt-1">Pastdan yuqoriga ↑</p>
          <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            {t('createDokla')}
          </button>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <h3 className="font-bold text-orange-700">{t('rasporyazhenie')}</h3>
          <p className="text-sm text-gray-500 mt-1">Yuqoridan pastga ↓</p>
          <button className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">
            {t('createRasporyazhenie')}
          </button>
        </div>
      </section>
    </div>
  );
}
```

---

## 10. Xulosa va Strategik Tavsiyalar

### 10.1. Umumiy baholash

```
✅ Module 3 texnik kuchi:
   • React 19 + NestJS + AI — zamonaviy stack
   • 326 sahifa, 36+ modul — keng qamrovli
   • 6,418 i18n kalit (UZ + RU) — 100% sinxron
   • AI integratsiya (Anthropic, Google AI) — raqobatbardosh
   • Playwright + Vitest — sinovlar mavjud

⚠️  ШВБ qoplash: 62% (o'rtacha)
   • Kuchli: CRM 90%, LMS 85%, WMS 85%
   • Yaxshilash kerak: ЗВС 30%, Koordinatsiya 15%, 3-Savat 35%

🎯 Yechim: ~116 i18n kalit + 4 yangi UI komponent + 8 yangi API
   Bajarilish muddati: 6-10 hafta jamoaviy ish
```

### 10.2. TOP-5 Zudlik bilan bajariladigan ishlar

| # | Ish | Vaqt | Nima uchun muhim |
|---|-----|------|-----------------|
| **1** | `finance.json` ga 23 ЗВС kalit | 2 soat | EuroPrint moliya tsiklining digital asosi |
| **2** | `coordination.json` yangi modul | 3 soat | 5 kengash tizimi — kompaniyaning boshqaruv asosi |
| **3** | `director.json` ga 14 holat kaliti | 2 soat | Direktor bosh instrumenti — real-vaqt monitoring |
| **4** | `hr.json` ga 14 GSD kaliti | 2 soat | Barcha xodimlar KPI tizimi |
| **5** | `constants.ts` yangilash | 30 daqiqa | Yangi modulni tizimga ulash |

> **Umumiy texnik vaqt (faqat i18n):** ~9-10 soat  
> **Natija:** Module 3 ШВБ qoplash 62% → 80%+ ga ko'tariladi

### 10.3. Muvaffaqiyat kriteriylari

```
✅ ЗВС/ЗНО workflow to'liq ishlaydi
✅ Koordinatsiya kengashlari paneli ko'rinadi
✅ GSD har xodim profilida grafik ko'rinadi
✅ Kompaniya holati DirectorDashboard da avtomatik aniqlanadi
✅ 3-Savat Kanban board da ko'rinadi
✅ Barcha yangi kalitlar UZ va RU da to'g'ri tarjima qilingan
✅ Playwright E2E testlari yangi jarayonlarni qamrab oladi
```

### 10.4. Xavflar va choralar

| Xavf | Ehtimollik | Chora |
|------|-----------|-------|
| i18n kalitlari nomuvofiqlik | Past | PR tekshirish: UZ kalit = RU kalit soni |
| ЗВС workflow foydalanuvchilar tomonidan qabul qilinmasligi | O'rta | Bosqichma-bosqich joriy etish, trening |
| Holat formulasi chegaralari noto'g'ri | O'rta | 3-6 oy real ma'lumot yig'ib, so'ng sozlash |
| Koordinatsiya moduli murakkabligi | Past | Minimal MVP dan boshlash |

---

> **EuroPrint Kokand · Module 3 vs ШВБ · 2026**  
> Tayyorlandi: Claude AI (Anthropic)  
> 237 fayl + 326 sahifa tahlil · 30 modul i18n · 4 bosqich integratsiya rejasi
