# EuroPrint ERP — 100 i18n Tarjima Task Agent Promti (Atomic Execution)

> **Bu fayl AI agent (Claude Code, Cursor) uchun yo'riqnoma.**
> Agent **100 ta atomic tarjima taski** yaratadi va birma-bir bajaradi.
> Maqsad: **UZ va RU 100% to'liq**, hech qanday inglizcha matn (whitelist'dan tashqari) qolmasin.
> Promtni o'zgartirmasdan to'liqligicha agentga bering.

---

## SIZ KIMSIZ

Siz — **i18n Translation Agent**. Vazifangiz: EuroPrint ERP loyihasini **O'zbek (uz) va Rus (ru)** tillarida **100% to'liq tarjima qilish**. Inglizcha matn (texnik atamalar va brand'lardan tashqari) **qoldirilmasligi shart**.

Loyiha:
```
Uzbek-Language-Module/
├── artifacts/erp-dashboard/src/
│   ├── locales/
│   │   ├── uz/   ← 49 ta JSON fayl, 13 416 kalit
│   │   └── ru/   ← 49 ta JSON fayl, 13 416 kalit
│   ├── pages/    ← 891 sahifa
│   ├── components/
│   └── pos-monitor/
└── apps/api/src/  ← backend xato xabarlari
```

**Hozirgi holat (auditdan):**
- UZ tarjima darajasi: ~95% (kalit-shaklidagi stub'lar bor)
- RU tarjima darajasi: 81.7% (2 449 kalit Cyrillic emas)
- Hardcoded TSX matnlar: 223 ta
- Backend i18n: 0%
- **Maqsad: UZ 100% + RU 100% + 0 hardcoded**

---

## ⚠️ ISH BOSHIDA — BIR MARTALIK RUXSAT

Birinchi xabaringizda foydalanuvchidan **bitta** ruxsat so'rang:

```
Quyidagi fayl va papkalarga to'liq o'qish + yozish ruxsati so'rayman.
Har task uchun qaytadan ruxsat so'ramayman — 100 taskni oxirigacha bajaraman.

1. artifacts/erp-dashboard/src/locales/uz/**/*.json   (49 fayl)
2. artifacts/erp-dashboard/src/locales/ru/**/*.json   (49 fayl)
3. artifacts/erp-dashboard/src/pages/**/*.tsx          (891 sahifa)
4. artifacts/erp-dashboard/src/components/**/*.tsx
5. artifacts/erp-dashboard/src/pos-monitor/**/*.tsx
6. artifacts/erp-dashboard/src/routes/**/*.tsx
7. artifacts/erp-dashboard/src/hooks/**/*.ts
8. artifacts/erp-dashboard/src/lib/i18n/**/*.ts
9. artifacts/erp-dashboard/scripts/i18n-check.cjs
10. apps/api/src/**/*.ts                              (backend xato xabarlari)
11. apps/api/src/locales/                              (yangi yaratiladi)
12. docs/i18n-glossary.md                              (glossariy)
13. docs/i18n-progress.md                              (progress hisobot)
14. scripts/i18n-*.mjs                                 (yangi auditor skriptlar)
15. .github/workflows/code-quality.yml                  (CI gate)

Ruxsat berasizmi? (HA / YO'Q)
```

**"HA" desa** — boshlaysiz va keyin **hech qachon ruxsat so'ramaysiz**.

---

## QATTIQ QOIDALAR

1. **100 task — har biri alohida fayl yoki aniq scope.**
2. **TaskCreate orqali 100 task** yaratasiz birinchi marta.
3. **Hadeb so'rashga TAQIQLANGAN** — 100 ta oxirigacha.
4. **RU qiymat — faqat Kirill alifbosida.** Lotin harf — faqat whitelist'dan.
5. **UZ qiymat — faqat o'zbek lotinida.** Inglizcha so'z — faqat whitelist'dan.
6. **Kalit-shakldagi qiymatlar TAQIQLANGAN:** `dashboard9`, `kutish1`, `tab1`, `surcharge`, `barchaBuyurtmalarKoribChiqilgan`. Hammasi real matnga aylantirasiz.
7. **JSON sintaksisini buzmaslik** — har edit'dan keyin `JSON.parse()` tekshiruvi.
8. **Kalit nomlarini o'zgartirish TAQIQLANGAN.** Faqat qiymatlarni.
9. **UZ va RU kalit to'plami bir xil bo'lishi SHART.** Birida bor — ikkinchisida ham bor.
10. **Sahifa to'liq tarjima qilinmasdan keyingisiga o'tish TAQIQLANGAN.**
11. **Yarim task qoldirish TAQIQLANGAN** — buyruq tugaguncha bajarasiz.
12. **`console.log` taqiqlangan.**

---

## ⚠️ WHITELIST (TARJIMA QILINMAYDIGAN)

Brand nomlar va texnik atamalar **bir xil holatda saqlanadi** (UZ va RU da bir xil yoziladi):

```
Brand:      EuroPrint, Telegram, WhatsApp, PostgreSQL, Redis, Drizzle,
            NestJS, React, Fastify, Anthropic, Claude, OpenAI, Gemini,
            ElevenLabs, Cloudflare, GitHub, Slack, Notion, Zoom

Texnik:     API, URL, JWT, OAuth, OTP, 2FA, SaaS, ERP, CRM, HR, FI,
            PP, MES, QC, WMS, SD, MRO, POS, MM, LMS, KPI, OEE, RBAC,
            SOS, SLA, SoD, GL, AP, AR, BOM, MRP, CRP, RFM, CLV, NPS,
            ID, IP, OK, PDF, CSV, XLSX, JSON, HTML, CSS, JS, TS,
            SQL, REST, GraphQL, WebSocket, SSE,
            Wi-Fi, iOS, Android, Email (lekin ru: "Эл. почта" ham OK)
```

---

## 0-QADAM — AUDIT VA TAYYORLANISH

Birinchi qadam (1-taskdan oldin) — joriy holatni o'lchang:

```bash
# 1. Mavjud RU kalitlardagi Cyrillic-siz qiymatlarni topish
node <<'EOF' > docs/i18n-ru-gaps.csv
const fs = require('fs');
const glob = require('glob');
const files = glob.sync('artifacts/erp-dashboard/src/locales/ru/*.json');
const out = [['fayl','kalit','qiymat']];
function flatten(obj, prefix='', acc={}) {
  for (const k in obj) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) flatten(obj[k], key, acc);
    else acc[key] = obj[k];
  }
  return acc;
}
const cyrRe = /[А-Яа-яЁё]/;
for (const f of files) {
  const data = flatten(JSON.parse(fs.readFileSync(f, 'utf8')));
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string' && v.trim() && !cyrRe.test(v)) {
      out.push([f.split('/').pop(), k, JSON.stringify(v)]);
    }
  }
}
console.log(out.map(r => r.join(',')).join('\n'));
EOF

# 2. UZ stub'larni topish
# (UZ va RU bir xil bo'lganlar)
node scripts/find-uz-stubs.mjs > docs/i18n-uz-stubs.csv

# 3. Hardcoded TSX matnlar
node analyze-hardcoded.mjs > docs/i18n-hardcoded.csv

# 4. Status hisobot
cat docs/i18n-baseline.md <<EOF
RU Kirill darajasi: 81.7%
RU non-Cyrillic kalitlar: 2449
UZ stub'lar: ~200
Hardcoded TSX: 223
EOF
```

---

## 1-QADAM — 100 TASKNI YARATING

TaskCreate orqali **100 taskni bir vaqtda** yarating. Quyidagi 100 task ro'yxati:

---

## 100 TASK RO'YXATI

### GURUH 1 — Infratuzilma (Task 1–5)

| # | Vazifa | Yetkazib beriladigan |
|:---:|---|---|
| 1 | Glossariy yaratish | `docs/i18n-glossary.md` — UZ↔RU 80+ atama |
| 2 | RU bo'shliqlarni eksport skript | `scripts/extract-ru-gaps.mjs` |
| 3 | i18n status skript (foiz, hisobot) | `scripts/i18n-status.mjs` + `docs/i18n-status.md` |
| 4 | ESLint `no-literal-string` rule yoqish | `artifacts/erp-dashboard/.eslintrc.cjs` |
| 5 | CI gate (`i18n-check.cjs` har push'da) | `.github/workflows/code-quality.yml` |

### GURUH 2 — Sidebar va Navigation (Task 6–15) — **BIRINCHI USTUVOR**

Foydalanuvchi tizimga kirgan birinchi soniyada sidebar ko'radi.

| # | Fayl | Vazifa |
|:---:|---|---|
| 6 | `locales/uz/navigation.json` | Inglizcha kalitlarni topib UZ ga aylantirish (kamida 13 ta) |
| 7 | `locales/ru/navigation.json` | UZ aralashlarni RU ga aylantirish (kamida 13 ta) |
| 8 | `locales/uz/nav.json` | To'liq UZ |
| 9 | `locales/ru/nav.json` | To'liq RU |
| 10 | `components/AppSidebar.tsx` | Hardcoded matnlarni `t()` ga ko'chirish |
| 11 | `components/ModuleSidebar.tsx` | Hardcoded matnlar → `t()` |
| 12 | `components/sidebar/MobileSidebar.tsx` | 1 ta hardcoded ("print") + boshqalar |
| 13 | `locales/uz/auth.json` + `ru/auth.json` | Login sahifa tarjimasi to'liq |
| 14 | `routes/AppRouter.tsx` | Page title meta'lar tarjimasi |
| 15 | Sidebar QA — 2 tilda screenshot | Playwright bilan `e2e/sidebar-i18n.spec.ts` |

### GURUH 3 — common.json (Task 16–30) — **ENG KATTA FAYL** (7 642 kalit)

`common.json` har sahifada ishlatiladi. Bo'lakma-bo'lakma:

| # | UZ/RU | Bo'lim |
|:---:|:---:|---|
| 16 | UZ | Buttons (save, cancel, edit, delete, add, remove, ...) |
| 17 | RU | Buttons (Сохранить, Отмена, Редактировать, Удалить, ...) |
| 18 | UZ | Table headers (name, type, status, date, amount, ...) |
| 19 | RU | Table headers (Название, Тип, Статус, Дата, Сумма, ...) |
| 20 | UZ | Status / state (active, inactive, pending, approved, ...) |
| 21 | RU | Status / state (Активный, Неактивный, Ожидание, ...) |
| 22 | UZ | Validation messages (required, min, max, email, ...) |
| 23 | RU | Validation messages |
| 24 | UZ | Date / time (today, yesterday, week, month, ...) |
| 25 | RU | Date / time (Сегодня, Вчера, Неделя, Месяц, ...) |
| 26 | UZ | File actions (upload, download, attach, remove, ...) |
| 27 | RU | File actions (Загрузить, Скачать, Прикрепить, ...) |
| 28 | UZ | Search / filter (search, clear, apply, reset, ...) |
| 29 | RU | Search / filter (Поиск, Очистить, Применить, Сброс, ...) |
| 30 | UZ + RU | Kalit-stub'lar (`dashboard9`, `tab1`...) real matnga |

### GURUH 4 — Asosiy modul locale fayllari UZ (Task 31–48)

UZ modul fayllarida stub va kalit-shakldagi qiymatlarni tozalash:

| # | Fayl | Tozalash kerak |
|:---:|---|:---:|
| 31 | `uz/finance.json` | 558 kalit, ~120 stub |
| 32 | `uz/hr.json` | 561 kalit, ~45 stub |
| 33 | `uz/warehouse.json` | 448 kalit, ~43 stub |
| 34 | `uz/production.json` | 455 kalit, ~27 stub |
| 35 | `uz/crm.json` | 418 kalit, ~20 stub |
| 36 | `uz/wms.json` | 81 kalit, ~12 stub |
| 37 | `uz/ai.json` | 232 kalit, ~18 stub (eng ko'p kalit-stub'lar shu yerda) |
| 38 | `uz/qc.json` | 82 kalit, ~10 stub |
| 39 | `uz/design.json` | 78 kalit, ~9 stub |
| 40 | `uz/lms.json` | 123 kalit, ~13 stub |
| 41 | `uz/mes.json` | ~147 kalit |
| 42 | `uz/mro.json` | 410 kalit |
| 43 | `uz/director.json` | 122 kalit, ~18 stub |
| 44 | `uz/marketing.json` | 100 kalit |
| 45 | `uz/iot.json` | 159 kalit |
| 46 | `uz/admin.json` | 92 kalit |
| 47 | `uz/sd.json` + `uz/pos.json` + `uz/dashboard.json` | Kichik fayllar |
| 48 | `uz/`-dagi qolgan fayllar (errors, validation, public, footer, settings va h.k.) | Hammasi |

### GURUH 5 — Asosiy modul locale fayllari RU (Task 49–66)

RU modul fayllarida Cyrillic-siz qiymatlarni rus tiliga tarjima qilish:

| # | Fayl | Tarjima kerak (kamida) |
|:---:|---|:---:|
| 49 | `ru/finance.json` | 121 |
| 50 | `ru/hr.json` | 44 |
| 51 | `ru/warehouse.json` | 43 |
| 52 | `ru/production.json` | 27 |
| 53 | `ru/crm.json` | 20 |
| 54 | `ru/wms.json` | 12 |
| 55 | `ru/ai.json` | 18 |
| 56 | `ru/qc.json` | 10 |
| 57 | `ru/design.json` | 9 |
| 58 | `ru/lms.json` | 13 |
| 59 | `ru/mes.json` | shu darajada |
| 60 | `ru/mro.json` | barcha Cyrillic-siz |
| 61 | `ru/director.json` | 18 |
| 62 | `ru/marketing.json` | 3 |
| 63 | `ru/iot.json` | 6 |
| 64 | `ru/admin.json` | 3 |
| 65 | `ru/sd.json` + `ru/pos.json` + `ru/dashboard.json` | Kichik |
| 66 | `ru/`-dagi qolgan fayllar (errors, validation, public, footer, settings) | Hammasi |

### GURUH 6 — Hardcoded TSX migratsiya (Task 67–86) — **20 BATCH**

223 ta hardcoded matn audit'da topilgan. Batch'larga ajratilgan:

| # | Batch | Misol fayllar |
|:---:|---|---|
| 67 | CRM sahifalar | `pages/AiCrmPage.tsx`, `components/crm/company/CompanyEditForm.tsx` |
| 68 | HR sahifalar | `pages/Employees.tsx`, `components/AddDisciplineDialog.tsx`, `components/hr/extended/*` |
| 69 | Production / MES sahifalar | `components/production/qc/DefectSection.tsx`, `LabSection.tsx` |
| 70 | WMS / Inventory sahifalar | `pages/WMS*.tsx`, sklad jadvallari |
| 71 | Finance sahifalar | `pages/AccountsPayable.tsx`, `pages/AccountsReceivable.tsx` |
| 72 | LMS sahifalar | `components/lms/CourseBasicInfoForm.tsx`, `LearningPathVisualization.tsx` |
| 73 | POS / pos-monitor | `pos-monitor/*` (12 ta hardcoded) |
| 74 | Director sahifalar | `components/director/ModuleHealthGrid.tsx`, `pages/Director*.tsx` |
| 75 | Settings sahifalar | `pages/Settings*.tsx`, sozlamalar dialog'lari |
| 76 | UI base components batch 1 | `components/ui/carousel.tsx`, `dialog.tsx`, `pagination.tsx` |
| 77 | UI base components batch 2 | `components/ui/sheet.tsx`, `table.tsx`, `form.tsx`, `command.tsx` |
| 78 | Dialog components | `components/AddCourseDialog.tsx`, `AddLessonDialog.tsx`, `EditPersonalInfo.tsx` |
| 79 | Form components | `components/AddTestDialog.tsx`, `AddQuestionDialog.tsx`, `AddModuleDialog.tsx` |
| 80 | Sidebar / header / nav | `components/sidebar/*`, `components/Topbar.tsx` |
| 81 | Auth sahifalar | `pages/Login.tsx`, `pages/OTPVerify.tsx` |
| 82 | Public / landing | `pages/PublicHome.tsx`, marketing landing |
| 83 | Chat / Telegram | `components/chat/page/*` (ChatLayout, CreateTaskModal, MessageBubble) |
| 84 | Error / empty / loading states | `components/EmptyState.tsx`, error boundaries |
| 85 | Kanban + DnD | `components/KanbanBoard.tsx`, `kanban/*` |
| 86 | Boshqa qolganlar (lib, misc) | `lib/*`, `components/EuroprintLogo.tsx` (1 ta), boshqalar |

**Har batch uchun:**
1. CSV'da ko'rsatilgan har qator (`fayl, qator raqami, tur, matn`)
2. Matnni `t('module.key')` ga ko'chirish
3. Tegishli `module.json` ga UZ + RU qo'shish
4. Kalit nomi `camelCase` formatda
5. Test: sahifa ishlamoqdami?

### GURUH 7 — Component i18n test va sifat (Task 87–92)

| # | Vazifa | Yetkazib beriladigan |
|:---:|---|---|
| 87 | UZ tilida sidebar render test | `e2e/sidebar-uz.spec.ts` — barcha menyu o'zbekcha |
| 88 | RU tilida sidebar render test | `e2e/sidebar-ru.spec.ts` — barcha menyu ruscha |
| 89 | Language switcher integration test | `__tests__/LanguageSwitcher.test.tsx` |
| 90 | i18n kalit borligi test (UZ ↔ RU) | Vitest: har kalit ikkala tilda |
| 91 | Storybook 2 tilda (ixtiyoriy) | har komponent UZ + RU story |
| 92 | Visual regression (Chromatic) | UZ vs RU diff < 5% |

### GURUH 8 — Backend i18n (Task 93–97)

| # | Vazifa | Yetkazib beriladigan |
|:---:|---|---|
| 93 | `nestjs-i18n` setup + `Accept-Language` middleware | `apps/api/src/lib/i18n.module.ts` |
| 94 | HTTP xato xabarlari → key'larga | `apps/api/src/locales/uz/errors.json` + `ru/errors.json` |
| 95 | Email shablonlari UZ + RU | `apps/api/src/lib/email/templates/{uz,ru}/*.html` |
| 96 | Telegram bot javoblari UZ + RU | 3 bot (Director, HR, CRM) — `~200 string × 2` |
| 97 | PDF eksport sarlavhalari UZ + RU | Invoice, contract, payroll templates |

### GURUH 9 — Final Validatsiya va Hisobot (Task 98–100)

| # | Vazifa | Yetkazib beriladigan |
|:---:|---|---|
| 98 | Playwright E2E asosiy 10 sahifa 2 tilda | `e2e/i18n-full-coverage.spec.ts` (Login → Dashboard → CRM → HR → Finance → WMS → POS → Settings → Logout — UZ va RU) |
| 99 | CI gate yashil (i18n-check + lint + build) | barcha workflow PASS |
| 100 | Yakuniy hisobot | `docs/i18n-final-report.md` (foiz, fayllar, jadval) |

---

## 2-QADAM — HAR TASKNI BAJARASIZ

```
1. TaskList orqali keyingi `pending` taskni oling (ID tartibda)
2. TaskUpdate(id, status='in_progress')
3. Vazifaga muvofiq:
   - JSON fayl bo'lsa: o'qish → bo'shliqlarni topish → tarjima → JSON.parse() test
   - TSX fayl bo'lsa: matnlarni topish → t() ga ko'chirish → tegishli JSON'ga qo'shish
   - Infratuzilma bo'lsa: skript yozish → ishlash testi
4. Tasdiqlash:
   - `node artifacts/erp-dashboard/scripts/i18n-check.cjs` — kalit to'plami teng
   - JSON valid (har fayl uchun)
   - Lint o'tadi
5. TaskUpdate(id, status='completed')
6. docs/i18n-progress.md ga 1 qator: "TASK N | fayl | tarjima qilingan kalitlar | vaqt"
7. Keyingi task'ga
```

**Har 10 taskdan keyin** umumiy foiz o'lchang: `node scripts/i18n-status.mjs`

---

## 3-QADAM — TARJIMA KO'RSATMALARI

### A) RU faylda Cyrillic-siz qiymatlarni topish va to'g'rilash

**Misol 1 — UZ kalit-shakl:**
```json
// AVVAL (ru/ai.json):
"kutish1": "kutish1",
"barchaBuyurtmalarKoribChiqilgan": "barchaBuyurtmalarKoribChiqilgan",
"surcharge": "surcharge"

// KEYIN:
"kutish1": "Ожидание (1)",
"barchaBuyurtmalarKoribChiqilgan": "Все заказы просмотрены",
"surcharge": "Доплата"
```

**Misol 2 — UZ matn aralashgan:**
```json
// AVVAL (ru/common.json):
"save": "Saqlash",
"cancel": "Bekor qilish",
"loading": "Yuklanmoqda...",
"search": "Qidirish",
"actions": "Harakatlar",
"status": "Holat"

// KEYIN:
"save": "Сохранить",
"cancel": "Отмена",
"loading": "Загрузка...",
"search": "Поиск",
"actions": "Действия",
"status": "Статус"
```

**Misol 3 — Sidebar item:**
```json
// AVVAL (ru/navigation.json):
"superAdminOverride": "SUPER ADMIN OVERRIDE",
"realTimeKpi": "Real-time KPI",
"oldDashboard": "Eski Dashboard"

// KEYIN:
"superAdminOverride": "Прямое подтверждение супер админа",
"realTimeKpi": "KPI в реальном времени",
"oldDashboard": "Старая панель управления"
```

### B) UZ kalit-shaklidagi qiymatlarni real matnga aylantirish

**Misol 1 — kalit-shakl:**
```json
// AVVAL (uz/ai.json):
"dashboard9": "dashboard9",
"texnologTasdiqlash": "texnologTasdiqlash",
"k3CheckpointTasdiqlashAiTahlil": "k3CheckpointTasdiqlashAiTahlil"

// KEYIN:
"dashboard9": "9-panel",
"texnologTasdiqlash": "Texnolog tasdiqlashi",
"k3CheckpointTasdiqlashAiTahlil": "3-checkpoint tasdiqlash AI tahlili"
```

**Misol 2 — UZ inglizcha aralash:**
```json
// AVVAL (uz/navigation.json):
"superAdminOverride": "SUPER ADMIN OVERRIDE",
"realTimeKpi": "Real-time KPI"

// KEYIN:
"superAdminOverride": "Super admin to'g'ridan tasdiq",
"realTimeKpi": "Real vaqt KPI"
```

### C) Hardcoded TSX matnni i18n'ga ko'chirish

```tsx
// AVVAL — components/AddDisciplineDialog.tsx:170
<select placeholder="HR/Admin tanlang">

// KEYIN:
const { t } = useTranslation();
<select placeholder={t('hr.selectHrOrAdmin')}>

// uz/hr.json ga qo'shish:
"selectHrOrAdmin": "HR yoki Admin tanlang"

// ru/hr.json ga qo'shish:
"selectHrOrAdmin": "Выберите HR или Админ"
```

```tsx
// AVVAL — components/ui/dialog.tsx:54
<DialogClose>Close</DialogClose>

// KEYIN:
<DialogClose>{t('common.close')}</DialogClose>

// uz/common.json: "close": "Yopish"
// ru/common.json: "close": "Закрыть"
```

```tsx
// AVVAL — components/EuroprintLogo.tsx:22
<span>print</span>

// KEYIN:
// (BU brand qismi — saqlanadi)
<span>print</span>
// (whitelist'dagi atama, tarjima qilinmaydi)
```

---

## 4-QADAM — GLOSSARIY (MAJBURIY ISHLATILADI)

**Task 1** da yaratiladigan `docs/i18n-glossary.md` faylga quyidagi atamalar majburiy kiritiladi:

### Asosiy fe'llar (UI actions)

| UZ | RU | EN |
|---|---|---|
| Saqlash | Сохранить | save |
| Bekor qilish | Отмена | cancel |
| Tahrirlash | Редактировать | edit |
| O'chirish | Удалить | delete |
| Qo'shish | Добавить | add |
| Yangilash | Обновить | update |
| Yaratish | Создать | create |
| Yuklash | Загрузить | load |
| Yuklab olish | Скачать | download |
| Yuklab joylash | Загрузить (файл) | upload |
| Qidirish | Поиск | search |
| Filtr | Фильтр | filter |
| Saralash | Сортировка | sort |
| Eksport | Экспорт | export |
| Import qilish | Импорт | import |
| Yopish | Закрыть | close |
| Orqaga | Назад | back |
| Keyingi | Далее | next |
| Oldingi | Предыдущий | previous |
| Yuborish | Отправить | submit |
| Tasdiqlash | Подтвердить | confirm |
| Rad etish | Отклонить | reject |
| Qabul qilish | Принять | accept |
| Qo'llash | Применить | apply |
| Qaytarish | Сбросить | reset |
| Tanlash | Выбрать | select |
| Tanlang | Выберите | select (placeholder) |
| Ko'chirish | Переместить | move |
| Nusxalash | Копировать | copy |
| Yopishtirish | Вставить | paste |
| Chop etish | Печать | print |
| Yangilash (qayta yuklash) | Обновить (перезагрузка) | refresh |

### Status va holat

| UZ | RU |
|---|---|
| Faol | Активный |
| Nofaol | Неактивный |
| Yangi | Новый |
| Kutilmoqda | Ожидание |
| Tasdiqlangan | Подтверждённый |
| Rad etilgan | Отклонённый |
| Yakunlangan | Завершённый |
| Bekor qilingan | Отменённый |
| Bajarilmoqda | В процессе |
| Yopilgan | Закрытый |
| Ochiq | Открытый |
| Muvaffaqiyatli | Успешно |
| Xato | Ошибка |
| Ogohlantirish | Предупреждение |
| Ma'lumot | Информация |

### Jadval va forma

| UZ | RU |
|---|---|
| Nomi | Название |
| Tavsif | Описание |
| Turi | Тип |
| Holat | Статус |
| Sana | Дата |
| Vaqt | Время |
| Miqdor | Сумма / Количество |
| Jami | Всего / Итого |
| Foiz | Процент |
| Narx | Цена |
| Soni | Количество |
| Birlik | Единица |
| Manba | Источник |
| Manzil | Адрес |
| Telefon | Телефон |
| Elektron pochta | Электронная почта |
| Yuklab olish | Скачать |
| Tafsilotlar | Подробности |
| Harakatlar | Действия |
| Sozlamalar | Настройки |
| Filtrlar | Фильтры |
| Saralash | Сортировка |

### ERP biznes atamalari

| UZ | RU | Sharh |
|---|---|---|
| Buyurtma | Заказ | SD / CRM |
| Hujjat | Документ | universal |
| Mijoz | Клиент | CRM |
| Yetkazib beruvchi | Поставщик | MM |
| Tovar | Товар | WMS |
| Sklad | Склад | WMS |
| Omborxona | Склад | WMS (sinonim) |
| Xodim | Сотрудник | HR |
| Ishchi | Работник | HR |
| Daromad | Доход | FI |
| Xarajat | Расход | FI |
| Foyda | Прибыль | FI |
| Zarar | Убыток | FI |
| Hisob-faktura | Счёт-фактура | FI / SD |
| Hisob raqami | Счёт | bank |
| Ishlab chiqarish buyurtmasi | Производственный заказ | PP / MES |
| Smena | Смена | HR / MES |
| Marshrut | Маршрут | PP |
| Rejalashtirish | Планирование | PP |
| Avans | Аванс | SD / FI |
| Yetkazib berish | Доставка | SD / Logistics |
| Hisobot | Отчёт | universal |
| Buxgalteriya | Бухгалтерия | FI |
| Lavozim | Должность | HR / Org |
| Bo'lim | Отдел | Org |
| Boshlig'i | Руководитель | Org |
| Rahbar | Руководитель / Директор | Org |
| Direktor | Директор | C-level |
| Bosh direktor | Генеральный директор | C-level |
| Korxona | Предприятие | universal |
| Tashkilot | Организация | universal |
| Foydalanuvchi | Пользователь | Auth |
| Parol | Пароль | Auth |
| Tizimga kirish | Вход в систему | Auth |
| Tizimdan chiqish | Выход из системы | Auth |
| Ruxsat | Разрешение / Доступ | Auth |
| Rol | Роль | Auth |
| Xavfsizlik | Безопасность | Security |
| Audit jurnali | Журнал аудита | Security |

### Boshqaruv paneli

| UZ | RU |
|---|---|
| Boshqaruv paneli | Панель управления |
| Bosh sahifa | Главная страница |
| Ko'rib chiqish | Обзор |
| Statistika | Статистика |
| Ko'rsatkichlar | Показатели |
| Diagrammalar | Диаграммы |
| Grafiklar | Графики |
| Xulosa | Резюме / Сводка |
| Tendensiya | Тенденция |
| Taqqoslash | Сравнение |

---

## 5-QADAM — YAKUNIY HISOBOT

100 task tugaganda **bitta hisobot** chiqaring:

```markdown
# 100 i18n Task — Yakuniy Hisobot

## Umumiy raqamlar
- Boshlandi: 2026-XX-XX
- Yakunlandi: 2026-XX-XX
- Davomiyligi: X soat

## Guruh bo'yicha bajarilgan ish
| Guruh | Task # | Tarjima qilingan | Hardcoded ko'chirilgan |
|---|---|---:|---:|
| 1. Infratuzilma | 1–5 | — | — |
| 2. Sidebar / Navigation | 6–15 | ~30 kalit | ~12 hardcoded |
| 3. common.json | 16–30 | ~2 072 kalit | — |
| 4. UZ modul fayllar | 31–48 | ~400 kalit-stub | — |
| 5. RU modul fayllar | 49–66 | ~380 kalit | — |
| 6. Hardcoded TSX migratsiya | 67–86 | — | 223 ta |
| 7. Component test | 87–92 | — | — |
| 8. Backend i18n | 93–97 | ~400 kalit (2 til) | — |
| 9. Final validatsiya | 98–100 | — | — |
| **JAMI** | — | **~3 280 tarjima** | **223** |

## Foiz farqi
| O'lcham | Avval | Keyin |
|---|:---:|:---:|
| UZ tarjima darajasi | 95.2% | **100%** |
| RU tarjima darajasi | 81.7% | **100%** |
| Hardcoded TSX matn | 223 | **0** |
| Backend i18n | 0% | **100%** |
| UZ kalit-stub | ~200 | **0** |
| RU Cyrillic-siz qiymat | 2 449 | **<50** (faqat whitelist) |
| **Umumiy i18n yetuklik** | **~88.5%** | **100%** |

## Validatsiya
- ✅ `i18n-check.cjs` PASS (UZ va RU kalit to'plami teng)
- ✅ ESLint `no-literal-string` PASS
- ✅ Playwright E2E PASS (10 sahifa × 2 til = 20 test)
- ✅ JSON valid (98 fayl)
- ✅ Build PASS
- ✅ Glossariy 80+ atamali

## O'zgartirilgan fayllar
- Locale JSON: 98 fayl
- TSX sahifa: ~50 fayl (223 ta o'zgartirish)
- Backend: 5 fayl (errors, email, telegram, pdf)
- Test: 6 yangi fayl
- Skript: 4 yangi fayl
- CI workflow: 1 yangi gate

## Keyingi qadamlar (qo'shimcha tavsiyalar)
- Storybook 2 tilda visual diff
- Tarjima sifatini domain ekspert bilan ko'rib chiqish
- Foydalanuvchi til afzalligi (DB column)
- Tarjimon doimiy yo'naltirish — har yangi PR uchun
```

---

## 6-QADAM — NIMA QILMASLIK

- ❌ Har task uchun ruxsat so'rash
- ❌ Yarim tarjima qoldirish (RU faylda 50% Kirill, 50% Lotin)
- ❌ Kalit-shaklidagi qiymatlarni o'zgartirmaslik (`dashboard9` qoldirish)
- ❌ JSON sintaksisini buzish
- ❌ UZ va RU kalit to'plamini sinxron qilmaslik
- ❌ Whitelist'dagi atamalarni tarjima qilish (`API` → "ИНТЕРФЕЙС")
- ❌ Brand nomlarni tarjima qilish (`EuroPrint` → "EvroPrint")
- ❌ Kalit nomlarini o'zgartirish
- ❌ Tarjima sifatsiz qilish ("Save" → "Save" deb qoldirish)
- ❌ Sahifani yarim tarjima qilib keyingisiga o'tish
- ❌ "Bu kalit nima ma'noni anglatadi?" deb to'xtab so'rash — kontekst'dan tushunasiz

---

## 7-QADAM — NIMA QILISH KERAK

- ✅ Bir martagina ruxsat olib oxirigacha ishlash
- ✅ Sidebar va navigation'ni birinchi navbatda 100% qilish
- ✅ Glossariy bo'yicha yagona standart ishlatish
- ✅ Har fayl edit'dan keyin JSON valid'ligini tekshirish
- ✅ UZ va RU kalit to'plamini sinxron saqlash
- ✅ `docs/i18n-progress.md` ga har 5 taskdan keyin progress yozish
- ✅ Hardcoded TSX matnlarni `t()` ga ko'chirib, tegishli JSON'ga qo'shish
- ✅ Har 10 taskdan keyin foiz o'lchash
- ✅ Yakuniy hisobot bilan tugatish

---

## ENG OXIRGI ESLATMA

Sizning ishingiz — **kodni o'qish, JSON ni yangilash, sahifalarni i18n'ga ko'chirish**.

**Asosiy maqsad:** Foydalanuvchi birinchi marta sahifani ochsa — birorta inglizcha so'z ko'rmasligi (whitelist'dan tashqari). UZ tanlasa — to'liq o'zbek. RU tanlasa — to'liq rus. Aralashgan matn yo'q. Stub yo'q. Hardcoded yo'q.

Sidebar — birinchi va eng muhim. Foydalanuvchi 1 sekund ichida ko'radi. Agar u yerda "Real-time KPI" yoki "SUPER ADMIN OVERRIDE" qolgan bo'lsa — siz tugatmadingiz.

**Boshlang:**
1. Ruxsat oling (bir martagina)
2. 0-qadam — audit + tayyorlanish (CSV eksport)
3. TaskCreate orqali 100 task yarating
4. Task 1-5 (infratuzilma) → 6-15 (sidebar) → 16-30 (common) → 31-66 (modullar) → 67-86 (hardcoded) → 87-92 (test) → 93-97 (backend) → 98-100 (yakun)
5. Har 10 taskdan keyin foiz o'lchang
6. 100-task tugaganda yakuniy hisobot

**Bo'lmasa "tugadi" demang.** 100 ta task bajarilmaguncha, UZ 100% va RU 100% bo'lmaguncha to'xtamaysiz.

Boshlayman demang — **boshlang**.
