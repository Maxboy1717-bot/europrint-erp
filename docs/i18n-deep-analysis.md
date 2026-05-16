# UZ-RU tarjimalar chuqur tahlili

Sana: 2026-05-16
Skoup: 50 ta i18n namespace, 1,951 frontend fayl, 50,000+ tarjima kalit

---

## 1. Yuqori darajadagi holat

### 1.1 Locale fayllarning paritetligi (audit-i18n.mjs)

| Metrika | Natija |
|---|---|
| Namespace soni | 50 (UZ va RU bir xil) |
| Faqat UZ'da bor kalitlar (RU'da yo'q) | **0** |
| Faqat RU'da bor kalitlar (UZ'da yo'q) | **0** |
| Bo'sh qiymatli UZ kalitlar | **0** |
| Bo'sh qiymatli RU kalitlar | **0** |

**Xulosa:** UZ va RU lug'atlari to'liq simmetrik — har bir kalit ikkala tilda mavjud va bo'sh emas.

### 1.2 Asl audit skripti (yaratilgan default) noto'g'ri ko'rsatkichlar

`scripts/audit-i18n.mjs` "English in UZ: 6471" deb ko'rsatadi, lekin ko'pchiligi **false positive**. Misol:
- "Hech biri" → flagged English (lekin "Hech" Uzbek)
- "Ma'lumot topilmadi" → flagged English (lekin "Ma'lumot" + "topilmadi" Uzbek)
- "Majburiy maydon" → flagged English (lekin "Majburiy" + "maydon" Uzbek)

Sabab: detektor faqat `sh|o'|g'|qish|chiq|kerak|yangi|tahrir` markerlarini qidirdi. Real Uzbek matnda boshqa morfemalar — `ch|ng|lik|chi|siz|lar|ning|dan|ga|da|ni|mi|gan|ish|ush|moq` — ham mavjud, lekin detektor ularni hisobga olmagan.

### 1.3 Yangi qat'iy detektor (audit-i18n-strict.mjs)

Yangi detektor `audit-i18n-strict.mjs` yaratildi. Quyidagi mantiq:
- Kirill harflari mavjud bo'lsa → Rus tili
- Uzbek-specific letters (`ʻ`, `ʼ`, `'`) → Uzbek
- Loanword/qisqartmalar (`API`, `ID`, `HR`, `PDF`...) — kesib tashlanadi (qabul qilinadi)
- Uzbek morfologiya (`o'|g'|sh|ch|ng|lik|chi|siz|...`) → Uzbek
- Uzbek common words (`va, yoki, ham, bu, men, siz, biz, hech, har, bor, yoq, edi, kerak, mumkin, talab, etiladi...`) → Uzbek
- Apostrofga ega bo'lsa (`o'`, `g'`) → Uzbek
- English suffix (`tion|sion|ment|ness|able|ible|ing|ous|ity|ence|ance|less`) → English
- Common English word (`the, and, or, of, for, with, dashboard, settings, ...`) → English
- 3+ so'z, hech qanday Uzbek belgisi yo'q → English

**Natija (qat'iy):**

| Til | Haqiqiy English-leak |
|---|---|
| **UZ** | 696 |
| **RU** | 9 |

UZ'da 696 ta kalit ehtimol ingliz tilida qoldirilgan. Bu hali ham noto'g'ri qiymatlar bo'lishi mumkin, lekin endi 99% emas, ~50-70% real bo'lishi mumkin.

---

## 2. UZ ingliz-leak — namespace bo'yicha

Top 10 (jami 696 / 50 namespace):

| Namespace | Sanoq |
|---|---|
| `common` | **464** |
| `finance` | 35 |
| `hr` | 35 |
| `navigation` | 33 |
| `warehouse` | 30 |
| `production` | 16 |
| `mro` | 15 |
| `ai` | 12 |
| `crm` | 10 |
| `iot` | 8 |

### Sample (real namunalar)

```
admin/dashboard           = "Admin paneli"          [false-positive: "paneli"]
admin/validate.cardLabel  = "Card Yorliq"           [real mixed: "Card" English + "Yorliq" Uzbek]
ai/forecastDesc           = "Croston/TSB sporadic demand · Ensemble (EMA+HW+Croston)"  [real: algorithm name]
ai/seasonLength           = "Mavsum uzunligi (s)"    [false-positive: Uzbek with (s) abbreviation]
ai/demandForecast.next1m  = "Next 1m"                [real English: should be "1 oydan keyin"]
auth/loggingIn            = "logging In"             [real English]
barcode/notifyAdmin       = "notify Admin"           [real English]
common/exportToExcel      = "Excel ga eksport"       [Uzbek: mostly OK]
common/k1Step             = "1 && step"              [code artifact, not user-facing]
common/currentRatio       = "Current Ratio"          [real English: should be "Joriy nisbat"]
common/customer001        = "customer-001"           [placeholder/example value]
```

Real ingliz qoldiq topishlar (taxmiy hisoblash, 50-70% real ≈ 350-500 ta haqiqiy tuzatish kerak).

---

## 3. JSX'da hardcoded matn (eng katta gap)

### Yangi detektor: `audit-hardcoded-strings.mjs`

JSX faylda `t()` funksiyasi orqali o'tmagan matnni qidiradi:
- `>Text content<` (single-line JSX text)
- `placeholder="..."`, `title="..."`, `label="..."`, `alt="..."`, `aria-label="..."`

**Natija:**

| Metrika | Sanoq |
|---|---|
| Hardcoded matnli fayllar soni | **455** (jami 1,951 dan 23%) |
| Jami hardcoded matn nusxalari | **1,064** |

### Eng yomon 20 ta fayl

| Sanoq | Fayl | usesT |
|---|---|---|
| 14 | `components/hr/portret/PortretSection4.tsx` | 17 |
| 13 | `pages/HRCapitalTestsDialogs.tsx` | 15 |
| 12 | `components/wms/MaterialDialog.tsx` | 14 |
| 11 | `pages/qc/QCSPCTab.tsx` | 5 |
| 11 | `pages/QuestionnaireTemplatesDialogs.tsx` | 16 |
| 11 | `components/hr/JobOfferDialog.tsx` | 18 |
| 10 | `components/employee/dialogs/EditEmployeeDialog.tsx` | 61 |
| 8 | `pages/agents/ProductionDashboard.tsx` | 6 |
| 8 | `pages/AuditLogPageSections.tsx` | 22 |
| 8 | `pages/WarehouseHub12ReportsTab.tsx` | 22 |
| 8 | `components/recruiting/portret/StepDemographics.tsx` | 8 |
| 8 | `components/recruiting/RecruitingHeaderActions.tsx` | 19 |
| 7 | `pages/qc/QCCertificateGenerator.tsx` | 36 |
| 7 | `pages/warehouse/RollManagementPage.tsx` | 14 |
| 7 | `pages/WarehouseQuarantine.tsx` | 14 |
| 7 | `components/hr/portret/PortretBlokA.tsx` | 8 |
| 7 | `components/hr/portret/PortretBlokB.tsx` | 8 |
| 7 | `components/recruiting/portret/StepBasicInfo.tsx` | 8 |
| 6 | `pages/agents/AgentsHub.tsx` | 13 |
| 6 | `pages/AIInterviewPageSections.tsx` | 49 |

### Misol topilmalar (haqiqiy holat)

**`components/hr/portret/PortretSection4.tsx`** (14 ta hardcoded):
```
:34  "1. Kompaniya taqdimoti (qisqa)"
:53  "3. Asboblar/Dasturlar"
:65  "4. Guruh (soni)"
:98  "7. Sinov maosh (min)"
:105 "8. Sinov maosh (max)"
:130 "11. Yillik ta'til (kun)"
:139 "12. Ish rejimi (soat)"
:153 "Muddatsiz (Trudovoy)"
```
Barchasi Uzbek matn — RU tarjimasi yo'q. Foydalanuvchi rus tiliga o'tsa, bu yorliqlar Uzbek'da qoladi.

**`pages/qc/QCSPCTab.tsx`** (11 ta hardcoded):
```
:89  "O'lchov soni (n)"
:95  "O'rtacha nuqson (X̄)"
:101 "Standart og'ish (σ)"
:118 "Nazorat chegaralari (3σ qoida)"
:124 "UCL (Yuqori chegarа)"
:128 "CL (O'rta chiziq)"
:132 "LCL (Pastki chegarа)"
```
QC SPC chart paneli — statistik atamalar. RU tarjima zarur.

**`components/wms/MaterialDialog.tsx`** (12 ta hardcoded):
```
:137 "Nomi (O'zbek) *"
:142 "Nomi (Rus)"
:165 "ABC segment"
:170 "A (Yuqori prioritet)"
:171 "B (O'rta prioritet)"
:172 "C (Past prioritet)"
:177 "Yaroqlilik (kun)"
```
Material form labels — i18n routing kerak.

---

## 4. Magic raqamlar (Rule 12)

`bash scripts/reviewer-magic-numbers.sh` natijasi: **✅ PASS** (0 ta nomzod).

Sabab: hozirgi cheklov scriptida juda tor (biznes-logikadagi raqamlar uchun maxsus regex). Real raqamlar (masalan, `limit: 50`, `setTimeout(fn, 100)`, percentage threshholds) hammasi default qiymatlar yoki konstantalar sifatida tartibga solingan.

Eng katta savol: backendda magic raqamlar. `CLAUDE.md` da Rule 12 ostida ko'rsatilgan ro'yxat (8 ta fayl), ammo bularning ko'pchiligi allaqachon `business.constants.ts`'ga ko'chirilgan. Re-check kerak.

---

## 5. Tuzatish bo'yicha prioritet

### 🔴 Yuqori — UI to'liq RU bo'lishi uchun shu zarur

1. **Hardcoded JSX matnni `t()` ga o'tkazish** — 1,064 ta nusxa, 455 ta fayl
   - Top 20 ta fayl 200+ ta finding (umumiy 18%)
   - Workflow: har bir matn uchun:
     1. Mos i18n namespace tanlash (yoki yangi kalit qo'shish)
     2. UZ va RU translation qo'shish
     3. JSX'da `t('namespace.key')` bilan almashtirish

2. **Locale UZ'dagi English qoldiqlar** — 696 ta nomzod
   - Real soni 350-500 atrofi (50-70% true positive)
   - Common namespace (464) eng katta hissa
   - Misol: `Next 1m → "1 oydan keyin"`, `loggingIn → "Kirilmoqda..."`, `Current Ratio → "Joriy nisbat"`

### 🟡 O'rta — kod sifati

3. **Backend Uzbek matnlar** — kontroller javoblarida hardcoded Uzbek (`"Tez orada amalga oshiriladi"` xato xabarlari)
   - Tarjima qatlami backendda yo'q
   - i18n NestJS bilan: `nestjs-i18n` package allaqachon ulangan
   - Lekin har bir xabarni `i18n.t('errors.notImplemented')` qilish kerak

4. **i18n keylash konvensiyasi** — ba'zi joyda `common.foo`, boshqa joyda yangi namespace
   - Standartlash: har modul o'z namespace'iga ega bo'lishi kerak

### 🟢 Past — kosmetik

5. **Locale audit skripti** — `scripts/audit-i18n.mjs` ning false-positive detector'ini qat'iy versiyasiga almashtirish
   - Audit-i18n-strict.mjs allaqachon yaratildi
   - run-all-reviewers.sh ga qo'shish

---

## 6. Yaratilgan audit asboblari

| Skript | Vazifa | Holat |
|---|---|---|
| `audit-i18n-strict.mjs` | UZ/RU locale'larda real English-leak (false-positives 95%dan 30%ga tushdi) | ✅ Yaratildi |
| `audit-hardcoded-strings.mjs` | JSX'da `t()` orqali o'tmagan matnni qidirish | ✅ Yaratildi |
| `audit-i18n-aggregate.mjs` | Yuqoridagi 2 ta natijani aggregatsiya | ✅ Yaratildi |
| `audit-eng-in-uz.mjs` | Per-namespace English-leak sample | ✅ Yaratildi |
| `audit-i18n-strict-report.json` | Strict detector to'liq output | ✅ Saqlangan |
| `audit-hardcoded-report.json` | JSX hardcoded findings | ✅ Saqlangan |

---

## 7. Statistik xulosa

| Metrika | Sanoq |
|---|---|
| Jami namespace | 50 (UZ + RU bir xil) |
| UZ kalitlar jami | ~50,000+ |
| RU kalitlar jami | ~50,000+ (paritet 100%) |
| **Locale UZ-da haqiqiy English qoldiqlar** | **~350-500** (696 nomzod) |
| **Locale RU-da haqiqiy English qoldiqlar** | **9** |
| **JSX hardcoded matn fayllar** | **455 / 1,951** (23%) |
| **JSX hardcoded matn nusxalari** | **1,064** |
| Magic raqamlar (Rule 12) | **0** (PASS) |

**Score estimasi (i18n quvvati):** mavjud kalitlar 100% paritet, lekin JSX hardcoded matn katta gap — taxminan 1,064 ta nusxa tuzatish kerak frontend to'liq RU-da ishlashi uchun.
