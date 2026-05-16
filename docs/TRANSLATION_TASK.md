# EuroPrint ERP — i18n (UZ / RU) To'liq Tarjima Task Reja

> **Maqsad:** Loyihadagi barcha foydalanuvchi interfeysini O'zbek (uz) va Rus (ru) tillarida to'liq tarjima qilish — hardcoded matnlarni i18n JSON fayllariga ko'chirish va mavjud bo'shliqlarni to'ldirish.
>
> **Sana:** 2026-05-15
> **Maqsadli versiya:** v2.1.0 — i18n complete
> **Mas'ul:** Frontend jamoasi + lingvistik tarjimon
> **Til doirasi:** Faqat **UZ** va **RU**. EN bu loyihada talab qilinmaydi.

---

## 1. Hozirgi holat (auditda aniqlangan)

### 1.1 Fayl strukturasi

```
artifacts/erp-dashboard/src/locales/
├── uz/        ← 49 ta JSON fayl
└── ru/        ← 49 ta JSON fayl
```

### 1.2 Statistik holat

| Til | Fayllar | Kalitlar | Tarjima darajasi | Holat |
|---|---:|---:|---:|:---:|
| **UZ** | 49 | 13 416 | **~95%** (~5% kalit-nomli stub'lar bor) | 🟡 deyarli tayyor |
| **RU** | 49 | 13 416 | **81.7%** (10 967 Kirill / 2 449 Lotin) | 🟡 18.3% bo'shliq |
| **Jami unique kalitlar** | 49 | 13 416 | — | — |

### 1.3 Asosiy muammolar

| # | Muammo | Soni / Foiz |
|---|---|---:|
| 1 | RU tarjima qilinmagan kalitlar (Cyrillic yo'q) | **2 449** (**18.3%**) |
| 2 | UZ va RU bir xil qiymatga ega (placeholder/stub) | **2 452** (**18.3%**) |
| 3 | Hardcoded matnlar TSX faylda (i18n'ga ko'chirilmagan) | **223** ta |
| 4 | `common.json.before-codemod` qoldiqlari | 2 fayl |
| 5 | Kalit-shaklidagi stub qiymatlar (`dashboard9`, `kutish1`, `surcharge`) | ~200+ |

### 1.4 Hardcoded TSX matnlar (223 ta) taqsimoti

**Tur bo'yicha:**

| Tur | Soni | Foiz |
|---|---:|---:|
| JSX-text | 182 | 81.6% |
| placeholder | 28 | 12.6% |
| title (attribut) | 6 | 2.7% |
| aria-label | 3 | 1.3% |
| label | 2 | 0.9% |
| alert | 1 | 0.4% |
| alt | 1 | 0.4% |

**Joylashuv bo'yicha:**

| Folder | Soni | Foiz |
|---|---:|---:|
| `pages/` | 171 | 76.7% |
| `components/` | 39 | 17.5% |
| `pos-monitor/` | 12 | 5.4% |
| `lib/` | 1 | 0.4% |

---

## 2. Tarjima task ro'yxati (Epic + Story breakdown)

### EPIC A — RU bo'shliqni to'ldirish (81.7% → 100%)

Eng katta bo'shliq. RU faylda 2 449 kalit Cyrillic harf'ga ega emas — bularning aksariyati inglizcha qoldiq yoki UZ matn.

| # | Story | Hajm | Murakkablik | Vaqt |
|---|---|---:|:---:|---:|
| A.1 | RU faylda Cyrillic-siz 2 449 kalitni auto-script bilan ajratib olish | — | Past | 0.5 kun |
| A.2 | `common.json` — 1 703 ta bo'shliq | 1 703 | O'rta | 2 kun |
| A.3 | `finance.json` — 121 ta bo'shliq | 121 | Yuqori (ERP termini) | 0.5 kun |
| A.4 | `hr.json` — 44 ta bo'shliq | 44 | O'rta | 0.25 kun |
| A.5 | `warehouse.json` + `production.json` + `crm.json` (43 + 27 + 20) | 90 | O'rta | 0.5 kun |
| A.6 | Qolgan modullar: ai, director, lms, marketing, qc, iot, design, navigation, mro, public va h.k. | ~470 | O'rta | 1.5 kun |

**EPIC A jami:** 2 449 kalit, **~5.25 kun**

---

### EPIC B — UZ stub'larni tozalash (95% → 100%)

UZ-da 2 452 ta kalit RU bilan bir xil qiymatga ega — bu ko'pchilik holatda stub yoki kalit-nom (`dashboard9`, `kutish1`, `surcharge`). Ularni real o'zbek matniga aylantirish.

| # | Story | Hajm | Vaqt |
|---|---|---:|---:|
| B.1 | Auto-script: UZ va RU bir xil qiymatlarni ajratib olish | — | 0.25 kun |
| B.2 | Kalit-shaklidagi stub'lar (`dashboard9`, `tab1`, `tab2`, `kutish1`, `standart1`) | ~200 | 1 kun |
| B.3 | Texnik terminlar (Brand nomlar `Email`, `API`, `URL`, `OEE`, `RBAC`) — saqlanadi (whitelist) | ~100 | 0.25 kun |
| B.4 | Haqiqiy tarjima talab qiluvchi UZ kalitlar | ~2 100 | 3 kun |

**EPIC B jami:** 2 452 kalit, **~4.5 kun**

---

### EPIC C — Hardcoded TSX matnlarni i18n'ga ko'chirish (223 ta)

| # | Story | Hajm | Vaqt |
|---|---|---:|---:|
| C.1 | `pages/` ichidagi 171 ta hardcoded matn → tegishli `module.json` | 171 | 3 kun |
| C.2 | `components/` ichidagi 39 ta (umumiy komponentlar → `common.json`) | 39 | 1 kun |
| C.3 | `pos-monitor/` 12 ta → `pos.json` | 12 | 0.5 kun |
| C.4 | `aria-label`, `placeholder`, `title` attribut migratsiyasi | 36 | 1 kun |
| C.5 | ESLint qoidasi: `react-i18next/no-literal-string` qo'shish | — | 0.5 kun |
| C.6 | CI'da hardcoded scanner avtomatlashtirish (`analyze-hardcoded.mjs` ni gate qilish) | — | 0.5 kun |

**EPIC C jami:** 223 ta o'zgartirish, **~6.5 kun**

---

### EPIC D — Tarjima infratuzilmasi va sifati

| # | Story | Hajm | Vaqt |
|---|---|:---:|---:|
| D.1 | `react-i18next` config'ini UZ + RU uchun tekshirish va tartibga keltirish | — | 0.25 kun |
| D.2 | Til tanlash UI (sidebar + login sahifa) — `LanguageSwitcher.tsx` (faqat UZ/RU) | — | 0.5 kun |
| D.3 | Plural va interpolatsiya tekshirish (`{{count}}`, `_one/_other`) | — | 0.5 kun |
| D.4 | i18n unit test: har bir kalit har 2 tilda mavjudligini tekshiruv | — | 1 kun |
| D.5 | Playwright E2E: har sahifada language switcher ishlashi (UZ ↔ RU) | — | 1 kun |
| D.6 | Sana / raqam formati (Tashkent locale: `dd.MM.yyyy`, `1 234 567,00`) | — | 0.5 kun |
| D.7 | Backend xato xabarlari: `errors.json` ga ko'chirish va backend `Accept-Language` (uz/ru) qo'llab-quvvatlash | — | 1 kun |
| D.8 | `common.json.before-codemod` kabi qoldiqlarni o'chirish | 2 fayl | 0.1 kun |

**EPIC D jami:** **~4.85 kun**

---

### EPIC E — Backend (NestJS) tarjimalari

Backendda foydalanuvchiga ko'rinadigan xabarlar bor:
- 401/403/404/500 xato xabarlari
- Email shablonlari
- Telegram bot javoblari
- PDF/Excel eksport sarlavhalari
- Push notification matni

| # | Story | Hajm (taxminiy) | Vaqt |
|---|---|---:|---:|
| E.1 | Backend i18n kutubxonasi tanlash (`nestjs-i18n`) va UZ+RU uchun sozlash | — | 0.5 kun |
| E.2 | HTTP xato xabarlarini i18n key'ga aylantirish (UZ + RU) | ~150 xabar × 2 til | 1 kun |
| E.3 | Email shablonlari (UZ + RU) | 12 shablon × 2 | 1 kun |
| E.4 | Telegram bot javoblari (3 bot: Director, HR, CRM) | ~200 string × 2 til | 1.5 kun |
| E.5 | PDF eksport sarlavhalari (invoice, contract, payroll) | ~30 hujjat | 1 kun |
| E.6 | Backend i18n unit test | — | 0.5 kun |

**EPIC E jami:** **~5.5 kun**

---

## 3. Umumiy hajm va jadval

### 3.1 Ish hajmi xulosasi

| Epic | Tavsif | Kalit / Item | Vaqt (kun) | Ulush |
|:---:|---|---:|---:|---:|
| A | RU 81.7 → 100% | 2 449 | 5.25 | 19.5% |
| B | UZ stub tozalash | 2 452 | 4.5 | 16.7% |
| C | Hardcoded TSX → i18n | 223 | 6.5 | 24.1% |
| D | Infratuzilma + sifat | — | 4.85 | 18.0% |
| E | Backend i18n | ~400 | 5.5 | 20.4% |
| | **JAMI** | **5 524 item** | **~26.6 kun** | **100%** |

### 3.2 Resurs taqsimoti

| Rol | Loyihadagi yuk | Ulush |
|---|---|---:|
| **Tarjimon (UZ ↔ RU, ERP termini bilan)** | A, B, E.3-E.5 | **~50%** |
| **Frontend dasturchi** | C, D.1-D.6 | **~32%** |
| **Backend dasturchi** | E.1-E.2, E.6, D.7 | **~13%** |
| **QA / Test injener** | D.4-D.5, har bir Epic oxiri | **~5%** |

### 3.3 Tavsiya etilgan sprint rejasi (2 haftalik sprintlar, 2 kishi)

| Sprint | Maqsad | Yetkazib beriladigan |
|:---:|---|---|
| **Sprint 1** (1–2 hafta) | EPIC D (infra) + EPIC C (hardcoded) | i18n config tayyor, 223 hardcoded TSX → JSON, ESLint gate |
| **Sprint 2** (3–4 hafta) | EPIC B (UZ) + EPIC A yarmi (RU common.json) | UZ 100% + RU 90% (common.json + nav) |
| **Sprint 3** (5–6 hafta) | EPIC A oxiri + EPIC E | RU 100% + Backend i18n + E2E test yashil |

**Jami: ~6 hafta** (2 odam, parallel ishlash). Bir kishilik holatda: **~12 hafta**.

---

## 4. Texnik to'siqlar va ehtiyot choralari

### 4.1 Tarjima sifati uchun glossariy (Glossary)

Quyidagi atamalar UZ va RU da yagona standart bilan yoziladi (`docs/i18n-glossary.md` yaratiladi):

| UZ | RU | Sharh |
|---|---|---|
| Buyurtma | Заказ | SD / CRM |
| Hujjat | Документ | Universal |
| Mijoz | Клиент | CRM |
| Yetkazib beruvchi | Поставщик | MM |
| Tovar | Товар | WMS |
| Sklad | Склад | WMS |
| Ishchi | Сотрудник | HR |
| Daromad | Доход | FI |
| Xarajat | Расход | FI |
| Hisob-faktura | Счёт-фактура | FI / SD |
| Ishlab chiqarish buyurtmasi | Производственный заказ | PP / MES |
| Smena | Смена | HR / MES |
| Marshrut | Маршрут | PP |
| Rejalashtirish | Планирование | PP |
| Avans | Аванс | SD / FI |
| Yetkazib berish | Доставка | SD / Logistics |
| Omborxona | Склад | WMS |
| Hisobot | Отчёт | Universal |
| Foydalanuvchi | Пользователь | Auth |
| Lavozim | Должность | HR / Org |

> **Qoida:** Brand nomlar (`EuroPrint`, `Telegram`, `PostgreSQL`) tarjima qilinmaydi. Texnik atamalar (`API`, `URL`, `JWT`, `OEE`, `RBAC`, `KPI`) ham asl shaklida qoldiriladi.

### 4.2 Avtomatik xatolarning oldini olish

- **CI gate:** har push'da `scripts/i18n-check.cjs` ishlab, **UZ va RU da kalitlar to'plami bir xil bo'lishi shart**.
- **ESLint rule:** `no-literal-string` — komponentdagi yangi hardcoded matn build'ni buzadi.
- **Pre-commit hook (husky):** o'zgartirilgan locale fayllari uchun JSON valid check.
- **Storybook / Chromatic:** har bir komponentni 2 tilda ko'rsatish (visual diff).

### 4.3 Foiz monitoring dashboard

> Tarjima holatini real vaqtda kuzatish uchun `scripts/i18n-status.mjs` skripti har kuni quyidagi raqamlarni `docs/i18n-status.md`ga yozadi:

```
2026-05-15
─────────────
UZ: 95.2%  (12 778 / 13 416)
RU: 81.7%  (10 967 / 13 416)
Hardcoded TSX qoldiq: 223
JAMI: 88.5%
```

Maqsad: **6 hafta ichida 100% UZ / 100% RU / 0 hardcoded**.

---

## 5. Avtomatlashtirish — tayyor skriptlar

Loyihada quyidagi skriptlar allaqachon bor — qayta foydalanish kerak:

| Skript | Vazifa |
|---|---|
| `analyze-i18n.mjs` | i18n holat tahlili (UZ vs RU farq) |
| `analyze-hardcoded.mjs` | TSX hardcoded matn skaner |
| `apply-uz-translations.mjs` | CSV'dan UZ tarjima qo'llash |
| `apply-ru-translations.mjs` | CSV'dan RU tarjima qo'llash |
| `i18n-tsx-hardcoded.csv` | 223 ta hardcoded ro'yxati (audit natijasi) |

**Yangi qo'shilishi kerak:**

| Skript | Vazifa |
|---|---|
| `i18n-status.mjs` | UZ + RU foiz statistika + Markdown report |
| `i18n-glossary-check.mjs` | Glossariy buzilishlarini tekshiradi |
| `extract-russian-gaps.mjs` | RU dagi Cyrillic-siz qiymatlarni CSV'ga eksport qiladi |

---

## 6. Tarjima jarayoni (Workflow)

```
1. analyze-i18n.mjs  →  kamayotgan kalitlar CSV'ga
       ↓
2. Tarjimon CSV'ni Google Sheets'da to'ldiradi (UZ va RU ustunlar)
       ↓
3. apply-uz-translations.mjs / apply-ru-translations.mjs  →  CSV → JSON
       ↓
4. i18n-check.cjs (CI)  →  UZ va RU kalit to'plami teng?
       ↓
5. PR review + screenshot test (Playwright + 2 til)
       ↓
6. i18n-status.mjs  →  yangi foiz docs/i18n-status.md ga yoziladi
       ↓
7. Merge to main
```

---

## 7. Qabul mezonlari (Acceptance Criteria)

Task **DONE** deb hisoblanadi qachonki:

- [ ] `locales/uz/`, `locales/ru/` har birida **49 ta fayl**
- [ ] UZ va RU kalit to'plami **100% bir xil** (`i18n-check.cjs` PASS)
- [ ] Cyrillic darajasi RU >= **99%** (`Email`, `API` kabi brand'lardan tashqari)
- [ ] UZ-da kalit-shaklidagi stub yo'q (`dashboard9`, `kutish1`)
- [ ] `i18n-tsx-hardcoded.csv` natijasi **0 qator** (header'dan tashqari)
- [ ] ESLint `no-literal-string` rule yoqilgan va CI PASS
- [ ] Playwright E2E: har 2 tilda asosiy 10 sahifa screenshot diff < 5%
- [ ] Backend `Accept-Language` header'ni qabul qiladi va xato xabarlarini UZ va RU da qaytaradi
- [ ] `docs/i18n-glossary.md` jamoa tomonidan tasdiqlangan
- [ ] `common.json.before-codemod` qoldiqlari o'chirilgan

---

## 8. Risk va to'siqlar

| Risk | Ehtimol | Ta'sir | Yumshatish |
|---|:---:|:---:|---|
| ERP terminologiyasini noto'g'ri tarjima qilish | Yuqori | Yuqori | Glossariy + 1 nafar domain ekspert review |
| 2 tilda matn uzunligi farqi UI'ni buzadi | O'rta | O'rta | RU odatda uzunroq — har dialogni 2 tilda screenshot test |
| Backend Telegram bot 2 tilda — user til afzalligi DB'da yo'q | O'rta | O'rta | `users.preferred_lang` ustun qo'shish + migration |
| Tarjimon ishi sustlashishi | O'rta | Yuqori | Sprintga ulush rejalashtirish, AI yordami (Claude) bilan birinchi qoralama |
| Eski `common.json.before-codemod` fayllari noxush merge | Past | Past | O'chirish + `.gitignore` |
| ERP termini tarjimoni topish qiyin | Yuqori | O'rta | Glossariy + domain ekspertdan 1 marotaba ko'rib chiqish |

---

## 9. Foiz xulosa (boshlang'ich vs maqsad)

| Komponent | Bugun | 6 hafta keyin (maqsad) | Yaxshilanish |
|---|:---:|:---:|:---:|
| UZ tarjima darajasi | 95.2% | **100%** | +4.8% |
| RU tarjima darajasi | 81.7% | **100%** | +18.3% |
| Hardcoded TSX matnlar | 223 ta | **0 ta** | −100% |
| Backend i18n | 0% | **100%** | +100% |
| CI i18n gate | yo'q | **bor** | yangi |
| **Umumiy i18n yetuklik** | **~88.5%** | **100%** | **+11.5%** |

---

## 10. Birinchi qadam (Quick Start)

```bash
# 1. Mavjud holatni o'lchash
cd Uzbek-Language-Module
node analyze-i18n.mjs > docs/i18n-status.md
cat docs/i18n-status.md

# 2. RU bo'shliqlarini CSV'ga eksport
node extract-russian-gaps.mjs > docs/i18n-ru-gaps.csv

# 3. Hardcoded skaneri
node analyze-hardcoded.mjs > docs/i18n-hardcoded.csv

# 4. Glossariy fayl
touch docs/i18n-glossary.md
# (jamoa bilan to'ldirish — yuqoridagi jadval asos qilib olinadi)

# 5. CI guard
# .github/workflows/code-quality.yml ga qo'shilsin:
# - run: node artifacts/erp-dashboard/scripts/i18n-check.cjs
```

---

## 11. Manbalar

- `Uzbek-Language-Module/artifacts/erp-dashboard/src/locales/uz/` — 49 fayl, 13 416 kalit
- `Uzbek-Language-Module/artifacts/erp-dashboard/src/locales/ru/` — 49 fayl, 13 416 kalit
- `Uzbek-Language-Module/artifacts/erp-dashboard/scripts/i18n-check.cjs` — mavjud CI lint
- `analyze-i18n.mjs`, `analyze-hardcoded.mjs` — audit skriptlari
- `i18n-tsx-hardcoded.csv` — 223 ta hardcoded matn ro'yxati
- `i18n-uz-english.csv`, `i18n-ru-english.csv` — qisman tayyor CSV

---

## 12. Bitta jumlali xulosa

> **Bugungi i18n yetuklik darajasi ~88.5% (UZ 95%, RU 82%). 6 haftalik ishda 5 524 ta element ustida ishlanadi va UZ 100% / RU 100% / 0 hardcoded ga yetkaziladi. Eng katta ish — Hardcoded TSX migratsiyasi (24.1% ulush) va Backend i18n (20.4% ulush). EN bu loyiha doirasiga kirmaydi.**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    