# P53 — PP — Gofra / Sloy 3-Formula Konversiya Dvigateli (kg ↔ m² ↔ list)

> **Agent ID:** P53 | **Wave:** 1-2 | **dependsOn:** P12 | **ddlGate:** TRUE — yangi jadval kerak (egasi ruxsati shart)
> **Slug:** pp-gofra-sloy-formula | **Modul rangi:** `--mod-pp-*` (production orange family)
> **Yozilgan:** 2026-06-19 | **Vizyon manba:** `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md §29` +
> `docs/audit/00-INTERVYU-MOSLIK.md §4-A` | **Egasi uchun:** PP/SD/MES konversiya dvigateli
>
> **⭐ BU PAKET YULDUZLI VIZYON ELEMENTINI YOPADI** —
> `00-INTERVYU-MOSLIK.md §4-A` da kross-kesuvchi eng og'ir teshik sifatida aniqlangan.
> 52 ta mavjud paketda egalik qilinmagan; `§5 TAVSIYA` da `P53` sifatida nomlangan.

---

## ⚠️ EGASI QARORI KERAK (DDL HARD BOUNDARY)

```
╔══════════════════════════════════════════════════════════════════╗
║  EGASI QARORI KERAK — DDL BAJARILIB BO'LMAYDI                   ║
║                                                                  ║
║  Masala 1 (SEED): 21 material seed qiymatlarini KIM kirítadi?    ║
║  ──────────────────────────────────────────────────────────────  ║
║  CHAT-TARIXI §35 deydi: "21 material seed (GSM/flute/format)    ║
║  — egasi o'zi to'ldiradi (soxta qiymat emas)".                  ║
║  Bu direktiva seed faylni tuzilmasi bilan YOZADI,               ║
║  lekin qiymatlar NULL / placeholder — egasi INSERT qiladi.       ║
║                                                                  ║
║  Masala 2 (MASTER-DATA): Flute take-up faktor qiymatlari         ║
║  ──────────────────────────────────────────────────────────────  ║
║  Dunyo standartida (ISO 4046):                                   ║
║    A-flute ≈ 1.53 · B-flute ≈ 1.31 · C-flute ≈ 1.43            ║
║    E-flute ≈ 1.26 · BC-flute ≈ 1.37 (qo'shma)                  ║
║  Bu TAXMINIY qiymatlar — real zavod o'lchovi farq qiladi.        ║
║  Seed faylda bu raqamlar YOZILMAYDI — egasi o'zi kiritadi.       ║
║  ⚠️ EGASI QIYMATI KERAK: flute_take_up_factor har tip uchun.    ║
║                                                                  ║
║  Masala 3 (DDL): Yangi jadval va migration                        ║
║  ──────────────────────────────────────────────────────────────  ║
║  Q-35: CREATE TABLE faqat egasi ruxsati bilan.                   ║
║  Migration faylda "-- APPROVED: [ism] [sana]" izoh shart.        ║
║  Bu paket migratsiyani YOZADI lekin ISHGA TUSHIRMAYDI.           ║
║                                                                  ║
║  Masala 4 (API caller): PP/SD/MES qaysi modul chaqiradi?         ║
║  ──────────────────────────────────────────────────────────────  ║
║  Konversiya servisi PP ichida joylashadi, lekin                   ║
║  SD (buyurtma narxi = sloy formula + ustama) va                  ║
║  MES (norma = list + m²) ham ishlatadi.                          ║
║  Bu paket faqat PP konversiya servisini quradi —                 ║
║  SD/MES integratsiyasi keyingi paket yoki egasi qaroriga.        ║
║                                                                  ║
║  Javobi kerak bo'lgan savollar:                                   ║
║  1. 21 material seed qiymatlarini egasi qachon kiritadi?         ║
║  2. Flute take-up faktorlari qanday (zavod o'lchovi)?            ║
║  3. DDL migratsiyaga "APPROVED:" berasizmi?                      ║
║  4. SD/MES konversiyasi ushbu paket ichidami yoki keyingi?       ║
║                                                                  ║
║  QAROR KELGUNCHA DDL BAJARILIB BO'LMAYDI.                       ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiyada avval `CLAUDE.md` + `docs/agent-constitution.md` o'qi.
Quyidagi qoidalar bloki (Q-47 bo'yicha) ISTISNOSIZ qo'llanadi:

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

 1. Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
 2. @Body Zod bilan validate; class-validator TAQIQ.
 3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
 4. Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
 5. Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat TO'LIQ o'chiriladi (chala emas).
 6. FAYL IZOLYATSIYASI (Q-23/Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllar.
    Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
 7. DDL DARVOZASI (Q-35): CREATE TABLE / ALTER TABLE faqat egasi ruxsati bilan.
    Migration faylida "-- APPROVED: [egasi ismi] [sana]" izoh shart.
    Bu paket DDL TALAB QILADI — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
 8. git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
 9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon
    (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
13. "Sozlanadigan" → hardcode TAQIQ. Har koeffitsient master-data jadvalidan kelinadi.
    Kodga hech qanday birlik konversiya raqami yozilmaydi (0.65, 1.53 kabi emas).
14. GATED paket: egasi APPROVED: berguncha DDL bajariLMASIN.
    Migration draft — egasi stamp bosguncha qo'llash TAQIQ.
```

**WAVE 1-2 ma'nosi:**
- Wave 1: P12 (PP schema DDL) commitdan KEYIN boshlanadi (DB jadval poydevori kerak).
- Wave 2: Schema + Drizzle stubs (Wave 1) tugaganidan keyin backend servis + controller + FE.
- P12 migration `-- APPROVED:` bilan ISHGA TUSHIRILGAN bo'lishi kerak. P12 tugamagan bo'lsa — TO'XTA.

---

## 1. IZOLYATSIYA MANIFESTI

**Shu paket FAQAT quyidagi fayllarga tegadi. Boshqa hech qanday fayl o'zgartirilmaydi.**

```
OWNED FILES (P53):

  SCHEMA (Drizzle):
    lib/db/src/schema/pp/pp-gofra-formula.ts          ← YANGI fayl; master-data jadvallari

  BACKEND (NestJS):
    apps/api/src/modules/pp/conversion/               ← YANGI papka
      gofra-conversion.service.ts                     ← 3-formula konversiya dvigateli
      i-gofra-conversion.repo.ts                      ← repo interfeysi
      drizzle-gofra-conversion.repo.ts                ← Drizzle implementatsiyasi
      gofra-conversion.controller.ts                  ← REST endpoint
      gofra-conversion.dto.ts                         ← Zod DTO + input/output typalari

  FRONTEND (React):
    artifacts/erp-dashboard/src/hooks/useGofrConversion.ts  ← YANGI hook; FE helper

  DDL (GATED — ISHGA TUSHIRMA, faqat yoz):
    apps/api/src/database/migrations/p53-gofra-sloy-formula.sql
```

> ⭐ **BOGLIQLIK — pp.module.ts (P53 TEGMAYDI):** `apps/api/src/modules/pp/pp.module.ts` P53 owned file EMAS. Uning yagona egasi = **P13** (manifest §5: 1 fayl = 1 ega; uchta PP paketi — P13/P14/P53 — bu faylga tegadi, shuning uchun bitta ega simlaydi). P53 ning `GofraConversionController` + `GofraConversionService` + `{ provide: GOFRA_CONVERSION_REPO, useClass: DrizzleGofraConversionRepo }` provayderlari pp.module.ts ga **P13 tomonidan** ro'yxatdan o'tkaziladi (qarang P13 §2.6b + §4 QADAM 4b). **P53 bu faylga TEGMAYDI** — faqat `conversion/*` fayllarini yaratadi (P13 import qila oladigan to'g'ri eksport nomlari bilan).

**QUYIDAGILARGA TEGMA:**
- `lib/db/src/schema/pp/pp-enhanced.ts` — boshqa agent boshqaradi
- `lib/db/src/schema/pp/pp-production.ts` — P12 agentida
- `apps/api/src/modules/pp/technology/**` — P13 agentida
- `apps/api/src/modules/sd/**` — SD moduli, boshqa paket
- `apps/api/src/modules/mes/**` — MES moduli, boshqa paket
- `apps/api/src/modules/wms/**` — WMS moduli, boshqa paket
- Har qanday mavjud controller yoki servis (PP ichida ham, tashqarida ham)

---

## 2. VIZYON — GOFRA 3-FORMULA (manba: verbatim)

### 2.1 Egasi So'zlari (CHAT-TARIXI-YANGI §29 — yulduzli element)

```
CHAT-TARIXI-YANGI-2026-06-08.md, Qator 29-35 (verbatim):

### 3. GOFRA/SLOY FORMULASI = 3 FORMULA (sozlanadigan, PP-094 sharper)
- `m² = yoyilgan o'lcham × chiqindi`
- `kg = m² × grammaj`
- `grammaj = liner1 + liner2 + (flute × take-up faktor)`
- Marka (makro/mikro) = flute take-up + grammaj + sloy + chiqindi (dunyo standarti).
- **Sozlanadigan:** har material uchun GSM + format; gofra uchun har qatlam GSM +
  flute (A/B/C/E) + take-up. **kg ↔ list avtomatik.**
- 21 material seed (GSM/flute/format) — egasi o'zi to'ldiradi (soxta qiymat emas).
```

**Qo'shimcha kontekst (CHAT-TARIXI §43-44):**
```
- Norma = list + m² (uskunaga bog'liq); tizim aralash (soat + bajarilgan ish).
- Norma/formula/brak/ishchi/mashina = SOZLAMALAR + ORGSXEMA orqali (kodga HARDCODE EMAS)
  — har uskuna alohida sozlama, data analitika uchun.
```

**FIN moduli bilan bog'lanish (OCHIQ-JAVOBLAR §69):**
```
- Narx = sloy formula + ustama % (yoki sozlamadan).
```

**WMS moduli bilan bog'lanish (VISION-1000 EP-WMS-042):**
```
- birlik konvertatsiya (kg↔m↔m²) — WMS da ham kerak
```

**QC moduli bilan bog'lanish (MASTER-SAVOL-JAVOB §292):**
```
- gramaj/namlik/RCT/BCT/qalinlik min-max — QC fizik normalar master-data
```

### 2.2 3 Formula — Texnik Ta'rif

```
FORMULA 1 (m² hisob):
  m² = yoyilgan_uzunlik_m × yoyilgan_kenglik_m × chiqindi_koeffitsient
  
  Bu yerda:
    yoyilgan_uzunlik_m  = tayyor mahsulot uzunligi + qirqish chiqindisi (mm → m)
    yoyilgan_kenglik_m  = tayyor mahsulot kengligi + qirqish chiqindisi (mm → m)
    chiqindi_koeffitsient = (1 + chiqindi_foizi / 100.0)

  Misol (egasining qiymati emas — faqat tuzilma):
    buyurtma 500×300 mm tayyor kartón, chiqindi = ?% → egasi beradi
    m²_bir_list = (0.5 + ?) × (0.3 + ?) × (1 + ?)

FORMULA 2 (kg hisob):
  kg = m² × grammaj_gsm / 1000.0
  
  Bu yerda:
    grammaj_gsm = FORMULA 3 dan keladi (yoki to'g'ridan material master-datadan)
    / 1000.0 = GSM → kg/m² konversiya

FORMULA 3 (grammaj hisob — gofra uchun):
  grammaj_gsm = liner1_gsm + liner2_gsm + (flute_medium_gsm × take_up_factor)
  
  Bu yerda:
    liner1_gsm    = tashqi qatlam GSM (master-data)
    liner2_gsm    = ichki qatlam GSM (master-data)
    flute_medium_gsm = to'lqin qatlam GSM (master-data)
    take_up_factor   = flute turiga qarab (A/B/C/E) — master-data
    
  QOIDA: flute_take_up_factor HECH QACHON kodga yozilmaydi.
         Master-data jadvalidan olinadi (pp_flute_types jadvali).
  ⚠️ EGASI QIYMATI KERAK: har flute turi uchun take_up_factor.

FORMULA 4 (list hisob — teskari yo'nalish):
  list_soni = umumiy_kg / (bir_list_kg)
  bir_list_kg = m²_bir_list × grammaj_gsm / 1000.0
  
  YOKI to'g'ridan:
  list_soni = zarur_m² / m²_bir_list
```

### 2.3 Konversiya Yo'nalishlari

```
kg → m² → list   (buyurtmadan ishlab chiqarishga)
list → m² → kg   (ombor bilan solishtirish uchun)
m² → kg           (material sarfi hisob)
m² → list         (norma hisob)
```

### 2.4 Material Turlari (egasi to'ldiradi)

```
GOFRA KARTON (qatlamli):
  - Bir tomonlama (E-B-C-A flute) — liner1 + flute + liner2
  - Ikki tomonlama (BC-flute) — liner1 + flute1 + medium + flute2 + liner2
  - Micro-gofra (E/F-flute) — ingichka to'lqin
  
ODDIY KARTON (qatlamli emas):
  - Duplex/Triplex — faqat liner qatlamlari
  - Kraft qog'oz — bir qatlam
  
21 MATERIAL SEED TUZILMASI (egasi to'ldiradi):
  material_code, material_name, paper_type,
  liner1_gsm, liner2_gsm, flute_type, medium_gsm,
  sheet_width_mm, sheet_length_mm, waste_pct
  
  ⚠️ EGASI QIYMATI KERAK: Hamma 21 material qiymati egasi kiritadi.
     Bu direktiva seed TUZILMASINI yozadi, qiymatlarni emas.
```

---

## 3. JORIY HOLAT — VERIFY-DON'T-TRUST

### 3.1 Mavjud Sxema Tekshiruvi

Joriy `lib/db/src/schema/pp/` papkasida konversiyaga tegishli fragmentlar:

| Jadval | Fayl | Ustun | Holat |
|--------|------|-------|-------|
| `tech_card_bom` (stub) | `pp-enhanced.ts` | `material_id`, `quantity_m2`, `waste_pct` | BOM da m² va chiqindi bor, lekin konversiya formulasi YO'Q |
| `equipment` (stub) | `pp-production.ts` | `format_width_mm`, `format_length_mm` | Format ustunlari bor — sheet size mavjud |
| `warehouse_stock` | `wms-schema.ts` (boshqa) | `unit_of_measure` | Birlik mavjud — lekin konversiya ko'prigi YO'Q |
| `pp_plan_fact_entries` | `pp-plan-fact.ts` (P12) | `qty_plan`, `qty_actual` | Miqdor — lekin qaysi birlikda? Noaniq |

**XULOSA:** Konversiya dvigateli 52 paketda **MUTLAQO YO'Q** — faqat tarqoq maydonlar.

### 3.2 Skanerlash Buyruqlari (bajaruvchi uchun)

```bash
# Har qanday konversiya logikasi bormi?
grep -r "gsm\|grammaj\|take_up\|flute\|liner.*gsm\|m2.*kg\|kg.*m2" \
  apps/api/src/modules/pp/ --include="*.ts" -i

# BOM da qanday maydonlar bor?
grep -r "quantity_m2\|waste_pct\|grammage\|layer" \
  lib/db/src/schema/pp/ --include="*.ts" -i

# Birlik konversiya qayerdadir bormi?
grep -r "unit.*convert\|convert.*unit\|m2.*list\|kg.*list" \
  apps/api/src/ --include="*.ts" -i
```

Agar bu greplarda natija chiqsa — mavjud logikani o'chirma (Q-46).
Faqat yangi fayllarda yoz; pp.module.ts ga TEGMA (yagona egasi P13 — provayderlarni P13 ro'yxatdan o'tkazadi).

---

## 4. ARXITEKTURA DIZAYN

### 4.1 Qatlam Tuzilmasi (DDD)

```
lib/db/src/schema/pp/
  pp-gofra-formula.ts          ← Drizzle: pp_material_profiles + pp_flute_types + pp_conversion_log

apps/api/src/modules/pp/conversion/
  ├── gofra-conversion.dto.ts           ← Zod: ConvertInput / ConvertResult
  ├── i-gofra-conversion.repo.ts        ← Interfeys: findProfile, findFlute, logConversion
  ├── drizzle-gofra-conversion.repo.ts  ← Drizzle impl
  ├── gofra-conversion.service.ts       ← 3-formula logika (pure, no DB side-effect)
  └── gofra-conversion.controller.ts    ← GET /pp/conversion/convert + GET /pp/conversion/profiles

artifacts/erp-dashboard/src/hooks/
  └── useGofrConversion.ts              ← React hook: useConvert(input) → {m2, kg, listCount}
```

### 4.2 Master-Data Jadval Modeli

```
pp_flute_types (flute turlar — sozlanadigan):
  id           SERIAL PK
  code         VARCHAR(5) UNIQUE  -- 'A', 'B', 'C', 'E', 'BC', 'EB', 'F'
  name_uz      TEXT               -- 'A-flute (makro)', 'E-flute (mikro)'
  name_ru      TEXT
  take_up_factor NUMERIC(6,4)     -- ⚠️ EGASI QIYMATI KERAK (NULL defaultda)
  description  TEXT
  is_active    BOOLEAN DEFAULT true
  created_at   TIMESTAMP DEFAULT NOW()

pp_material_profiles (material profillar — sozlanadigan):
  id              SERIAL PK
  material_code   VARCHAR(50) UNIQUE   -- 'KR-125-1400' kabi (LUGAT §41 standart)
  material_name   TEXT NOT NULL
  paper_type      VARCHAR(20) CHECK (...'gofra', 'karton', 'kraft', 'duplex', 'triplex'...)
  liner1_gsm      NUMERIC(7,2)         -- tashqi qatlam (NULL gofra bo'lmasa)
  liner2_gsm      NUMERIC(7,2)         -- ichki qatlam (NULL oddiy qog'ozda)
  flute_type_id   INTEGER FK pp_flute_types.id   -- NULL gofra bo'lmasa
  medium_gsm      NUMERIC(7,2)         -- to'lqin qatlam GSM (NULL gofra bo'lmasa)
  total_gsm       NUMERIC(7,2)         -- ⬅ Formula 3 natijasi YOKI to'g'ridan kiritish
  sheet_width_mm  NUMERIC(8,2)         -- standart list kengligi (NULL = custom)
  sheet_length_mm NUMERIC(8,2)         -- standart list uzunligi (NULL = custom)
  waste_pct       NUMERIC(5,2)         -- chiqindi foizi (0-100) ⚠️ EGASI QIYMATI KERAK
  is_active       BOOLEAN DEFAULT true
  notes           TEXT
  created_at      TIMESTAMP DEFAULT NOW()
  updated_at      TIMESTAMP DEFAULT NOW()

pp_conversion_log (konversiya tarixi — audit):
  id              SERIAL PK
  material_profile_id INTEGER FK pp_material_profiles.id
  requested_by    INTEGER FK users.id
  direction       VARCHAR(20) CHECK ('kg_to_list', 'list_to_kg', 'm2_to_list', 'list_to_m2', 'm2_to_kg', 'kg_to_m2')
  input_value     NUMERIC(14,4) NOT NULL
  input_unit      VARCHAR(10)   -- 'kg', 'm2', 'list'
  output_value    NUMERIC(14,4)
  output_unit     VARCHAR(10)
  sheet_width_mm  NUMERIC(8,2)  -- agar custom format ishlatilsa
  sheet_length_mm NUMERIC(8,2)
  waste_pct_used  NUMERIC(5,2)  -- qaysi chiqindi % ishlatildi
  context         VARCHAR(30)   -- 'PP_ORDER', 'SD_QUOTE', 'MES_NORM', 'MANUAL'
  context_id      INTEGER       -- bog'liq buyurtma/kotirovka ID (NULL=manual)
  created_at      TIMESTAMP DEFAULT NOW()

INDEXES:
  pp_material_profiles(material_code) UNIQUE
  pp_material_profiles(paper_type, is_active)
  pp_flute_types(code) UNIQUE
  pp_conversion_log(material_profile_id, created_at)
  pp_conversion_log(context, context_id)
```

---

## 5. DDL MIGRATION (GATED — ISHGA TUSHIRMA)

**Fayl:** `apps/api/src/database/migrations/p53-gofra-sloy-formula.sql`

```sql
-- =============================================================================
-- P53: GOFRA / SLOY 3-FORMULA KONVERSIYA DVIGATELI
-- Vizyon: CHAT-TARIXI-YANGI-2026-06-08.md §29 (yulduzli element)
-- Egasi: Gofra 3-formula (kg→m²→list) sozlanadigan master-data
-- =============================================================================
-- ⚠️  GATED: Bu migration faqat egasi quyidagi blokni to'ldirganidan keyin ishga tushiriladi:
-- -- APPROVED: [EGASI ISMI] [SANA]
-- Hozir = BLANK (approval kutilmoqda).
-- =============================================================================

-- APPROVED: 
-- (egasi ismi va sana — yukqorida bo'sh joy — egasi to'ldiradi)

-- -----------------------------------------------------------------------------
-- 1. Flute turlari (sozlanadigan, take-up faktor master-data)
-- -----------------------------------------------------------------------------
-- GATED: awaiting owner approval
CREATE TABLE IF NOT EXISTS pp_flute_types (
    id             SERIAL PRIMARY KEY,
    code           VARCHAR(5)   NOT NULL,
    name_uz        TEXT         NOT NULL,
    name_ru        TEXT,
    take_up_factor NUMERIC(6,4),        -- ⚠️ EGASI QIYMATI KERAK (NULL = sozlanmagan)
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pp_flute_types_code_unique UNIQUE (code),
    CONSTRAINT pp_flute_types_take_up_positive
        CHECK (take_up_factor IS NULL OR take_up_factor > 0)
);

-- -----------------------------------------------------------------------------
-- 2. Material profillar (sozlanadigan, GSM/format/chiqindi master-data)
-- -----------------------------------------------------------------------------
-- GATED: awaiting owner approval
CREATE TABLE IF NOT EXISTS pp_material_profiles (
    id              SERIAL PRIMARY KEY,
    material_code   VARCHAR(50)  NOT NULL,
    material_name   TEXT         NOT NULL,
    paper_type      VARCHAR(20)  NOT NULL,
    liner1_gsm      NUMERIC(7,2),
    liner2_gsm      NUMERIC(7,2),
    flute_type_id   INTEGER      REFERENCES pp_flute_types(id) ON DELETE SET NULL,
    medium_gsm      NUMERIC(7,2),
    total_gsm       NUMERIC(7,2),       -- ⚠️ EGASI QIYMATI KERAK (yoki formula 3 dan)
    sheet_width_mm  NUMERIC(8,2),       -- ⚠️ EGASI QIYMATI KERAK
    sheet_length_mm NUMERIC(8,2),       -- ⚠️ EGASI QIYMATI KERAK
    waste_pct       NUMERIC(5,2),       -- ⚠️ EGASI QIYMATI KERAK
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    notes           TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pp_material_profiles_code_unique UNIQUE (material_code),
    CONSTRAINT pp_material_profiles_paper_type_check
        CHECK (paper_type IN ('gofra','karton','kraft','duplex','triplex','rulon','boshqa')),
    CONSTRAINT pp_material_profiles_liner1_positive
        CHECK (liner1_gsm IS NULL OR liner1_gsm > 0),
    CONSTRAINT pp_material_profiles_liner2_positive
        CHECK (liner2_gsm IS NULL OR liner2_gsm > 0),
    CONSTRAINT pp_material_profiles_total_positive
        CHECK (total_gsm IS NULL OR total_gsm > 0),
    CONSTRAINT pp_material_profiles_waste_range
        CHECK (waste_pct IS NULL OR (waste_pct >= 0 AND waste_pct <= 100))
);

CREATE INDEX IF NOT EXISTS idx_pp_material_profiles_paper_type
    ON pp_material_profiles(paper_type, is_active);

-- -----------------------------------------------------------------------------
-- 3. Konversiya audit logi
-- -----------------------------------------------------------------------------
-- GATED: awaiting owner approval
CREATE TABLE IF NOT EXISTS pp_conversion_log (
    id                  SERIAL      PRIMARY KEY,
    material_profile_id INTEGER     REFERENCES pp_material_profiles(id) ON DELETE SET NULL,
    requested_by        INTEGER,
    direction           VARCHAR(20) NOT NULL,
    input_value         NUMERIC(14,4) NOT NULL,
    input_unit          VARCHAR(10) NOT NULL,
    output_value        NUMERIC(14,4),
    output_unit         VARCHAR(10),
    sheet_width_mm      NUMERIC(8,2),
    sheet_length_mm     NUMERIC(8,2),
    waste_pct_used      NUMERIC(5,2),
    context             VARCHAR(30),
    context_id          INTEGER,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT pp_conversion_log_direction_check
        CHECK (direction IN ('kg_to_list','list_to_kg','m2_to_list',
                             'list_to_m2','m2_to_kg','kg_to_m2')),
    CONSTRAINT pp_conversion_log_input_positive
        CHECK (input_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_pp_conversion_log_profile
    ON pp_conversion_log(material_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pp_conversion_log_context
    ON pp_conversion_log(context, context_id);

-- -----------------------------------------------------------------------------
-- 4. Flute types TUZILMA seed (qiymatlar BO'SH — egasi to'ldiradi)
-- -----------------------------------------------------------------------------
-- ⚠️ EGASI QIYMATI KERAK: take_up_factor har tur uchun (hozir NULL)
-- Quyidagi kodlar dunyo standartiga mos (ISO 4046) — egasi zavod o'lchovi bilan yangilaydi
INSERT INTO pp_flute_types (code, name_uz, name_ru, take_up_factor, description)
VALUES
    ('A',  'A-flute (makro)',     'A-флют (макро)',    NULL, 'Egasi qiymati kerak'),
    ('B',  'B-flute (o''rta)',    'B-флют (средний)',  NULL, 'Egasi qiymati kerak'),
    ('C',  'C-flute (standart)',  'C-флют (стандарт)', NULL, 'Egasi qiymati kerak'),
    ('E',  'E-flute (mikro)',     'E-флют (микро)',    NULL, 'Egasi qiymati kerak'),
    ('BC', 'BC-flute (qo''shma)', 'BC-флют (двойной)', NULL, 'Egasi qiymati kerak'),
    ('EB', 'EB-flute (qo''shma)', 'EB-флют (двойной)', NULL, 'Egasi qiymati kerak'),
    ('F',  'F-flute (ultra-mikro)','F-флют (ультра)',  NULL, 'Egasi qiymati kerak')
ON CONFLICT (code) DO NOTHING;

-- Material profiles: TUZILMA faqat (21 ta material — egasi to'ldiradi)
-- Hozir 0 ta seed qatori — egasi INSERT qiladi (CHAT-TARIXI §35: "soxta qiymat emas")
-- Egasi to'ldirganda qo'llash uchun namuna:
-- INSERT INTO pp_material_profiles
--   (material_code, material_name, paper_type, liner1_gsm, liner2_gsm,
--    flute_type_id, medium_gsm, total_gsm, sheet_width_mm, sheet_length_mm, waste_pct)
-- VALUES
--   ('KR-XXX-XXXX', 'Egasi nomi', 'gofra', NULL, NULL, (SELECT id FROM pp_flute_types WHERE code='B'), NULL, NULL, NULL, NULL, NULL);
```

---

## 6. DRIZZLE SCHEMA (Wave 1)

**Fayl:** `lib/db/src/schema/pp/pp-gofra-formula.ts`

```typescript
/**
 * @module pp-gofra-formula
 * @description Gofra / Sloy 3-formula konversiya dvigateli uchun master-data jadvallari.
 * Vizyon: CHAT-TARIXI-YANGI-2026-06-08.md §29 (yulduzli element, PP-094 sharper).
 * Barcha koeffitsientlar master-data (HARDCODE EMAS) — egasi sozlaydi.
 */
import {
  serial, pgTable, text, varchar, integer, boolean,
  timestamp, numeric, index, check, unique
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// =============================================================================
// pp_flute_types — Flute turlari (take-up faktor sozlanadigan master-data)
// =============================================================================
export const ppFluteTypes = pgTable(
  'pp_flute_types',
  {
    id:           serial('id').primaryKey(),
    code:         varchar('code', { length: 5 }).notNull(),
    nameUz:       text('name_uz').notNull(),
    nameRu:       text('name_ru'),
    // ⚠️ EGASI QIYMATI KERAK — NULL = hali sozlanmagan (xavfsiz default)
    takeUpFactor: numeric('take_up_factor', { precision: 6, scale: 4 }),
    description:  text('description'),
    isActive:     boolean('is_active').notNull().default(true),
    createdAt:    timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    unique('pp_flute_types_code_unique').on(t.code),
    check('pp_flute_types_take_up_positive',
      // take_up_factor IS NULL OR take_up_factor > 0
      // Drizzle raw check:
      sql`take_up_factor IS NULL OR take_up_factor > 0`
    ),
  ]
);

export const insertPpFluteTypeSchema = createInsertSchema(ppFluteTypes).omit({ id: true, createdAt: true } as never);
export const selectPpFluteTypeSchema = createSelectSchema(ppFluteTypes);
export type PpFluteType   = typeof ppFluteTypes.$inferSelect;
export type InsertPpFluteType = z.infer<typeof insertPpFluteTypeSchema>;

// =============================================================================
// pp_material_profiles — Material profillar (GSM/format/chiqindi sozlanadigan)
// =============================================================================
export const ppMaterialProfiles = pgTable(
  'pp_material_profiles',
  {
    id:             serial('id').primaryKey(),
    materialCode:   varchar('material_code', { length: 50 }).notNull(),
    materialName:   text('material_name').notNull(),
    // Qog'oz turi (CHECK constraint — migration da ham bor)
    paperType:      varchar('paper_type', { length: 20 }).notNull(),
    // Gofra qatlamlari (NULL = gofra emas yoki bilinmaydi)
    liner1Gsm:      numeric('liner1_gsm', { precision: 7, scale: 2 }),
    liner2Gsm:      numeric('liner2_gsm', { precision: 7, scale: 2 }),
    fluteTypeId:    integer('flute_type_id').references(() => ppFluteTypes.id, { onDelete: 'set null' }),
    mediumGsm:      numeric('medium_gsm', { precision: 7, scale: 2 }),
    // total_gsm = Formula 3 natijasi YOKI to'g'ridan kiritiladi
    // ⚠️ EGASI QIYMATI KERAK
    totalGsm:       numeric('total_gsm', { precision: 7, scale: 2 }),
    // Standart list o'lchami — ⚠️ EGASI QIYMATI KERAK (NULL = custom per-order)
    sheetWidthMm:   numeric('sheet_width_mm', { precision: 8, scale: 2 }),
    sheetLengthMm:  numeric('sheet_length_mm', { precision: 8, scale: 2 }),
    // Chiqindi % — ⚠️ EGASI QIYMATI KERAK
    wastePct:       numeric('waste_pct', { precision: 5, scale: 2 }),
    isActive:       boolean('is_active').notNull().default(true),
    notes:          text('notes'),
    createdAt:      timestamp('created_at').notNull().defaultNow(),
    updatedAt:      timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('pp_material_profiles_code_unique').on(t.materialCode),
    index('idx_pp_material_profiles_paper_type').on(t.paperType, t.isActive),
    check('pp_material_profiles_paper_type_check',
      sql`paper_type IN ('gofra','karton','kraft','duplex','triplex','rulon','boshqa')`
    ),
    check('pp_material_profiles_waste_range',
      sql`waste_pct IS NULL OR (waste_pct >= 0 AND waste_pct <= 100)`
    ),
  ]
);

export const insertPpMaterialProfileSchema = createInsertSchema(ppMaterialProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true } as never);
export const selectPpMaterialProfileSchema = createSelectSchema(ppMaterialProfiles);
export type PpMaterialProfile       = typeof ppMaterialProfiles.$inferSelect;
export type InsertPpMaterialProfile = z.infer<typeof insertPpMaterialProfileSchema>;

// =============================================================================
// pp_conversion_log — Konversiya audit logi (immutable)
// =============================================================================
export const ppConversionLog = pgTable(
  'pp_conversion_log',
  {
    id:                serial('id').primaryKey(),
    materialProfileId: integer('material_profile_id')
                         .references(() => ppMaterialProfiles.id, { onDelete: 'set null' }),
    requestedBy:       integer('requested_by'),   // users.id (soft FK — users jadvali boshqa sxemada)
    direction:         varchar('direction', { length: 20 }).notNull(),
    inputValue:        numeric('input_value', { precision: 14, scale: 4 }).notNull(),
    inputUnit:         varchar('input_unit', { length: 10 }).notNull(),
    outputValue:       numeric('output_value', { precision: 14, scale: 4 }),
    outputUnit:        varchar('output_unit', { length: 10 }),
    sheetWidthMm:      numeric('sheet_width_mm', { precision: 8, scale: 2 }),
    sheetLengthMm:     numeric('sheet_length_mm', { precision: 8, scale: 2 }),
    wastePctUsed:      numeric('waste_pct_used', { precision: 5, scale: 2 }),
    context:           varchar('context', { length: 30 }),  // 'PP_ORDER','SD_QUOTE','MES_NORM','MANUAL'
    contextId:         integer('context_id'),
    createdAt:         timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_pp_conversion_log_profile').on(t.materialProfileId, t.createdAt),
    index('idx_pp_conversion_log_context').on(t.context, t.contextId),
    check('pp_conversion_log_direction_check',
      sql`direction IN ('kg_to_list','list_to_kg','m2_to_list','list_to_m2','m2_to_kg','kg_to_m2')`
    ),
    check('pp_conversion_log_input_positive', sql`input_value > 0`),
  ]
);

export const insertPpConversionLogSchema = createInsertSchema(ppConversionLog)
  .omit({ id: true, createdAt: true } as never);
export type PpConversionLog       = typeof ppConversionLog.$inferSelect;
export type InsertPpConversionLog = z.infer<typeof insertPpConversionLogSchema>;
```

> **ESLATMA:** `sql` import — Drizzle-orm dan olinadi: `import { sql } from 'drizzle-orm';`
> Bu faylni PP schema barrel (`lib/db/src/schema/pp/index.ts`) ga qo'sh:
> `export * from './pp-gofra-formula';`

---

## 7. BACKEND — CONVERSION SERVICE (Wave 2)

### 7.1 DTO va Zod Validatsiya

**Fayl:** `apps/api/src/modules/pp/conversion/gofra-conversion.dto.ts`

```typescript
import { z } from 'zod';

// Kirish yo'nalishlari
export const ConversionDirectionSchema = z.enum([
  'kg_to_list', 'list_to_kg',
  'm2_to_list', 'list_to_m2',
  'm2_to_kg',   'kg_to_m2',
]);
export type ConversionDirection = z.infer<typeof ConversionDirectionSchema>;

// Konversiya so'rovi (profil + qo'lda o'lcham bilan)
export const ConvertRequestSchema = z.object({
  materialProfileId: z.number().int().positive().optional(),
  // Agar profil bo'lmasa, qo'lda kiritiladi (ikkisi ham yo'q bo'lsa — xato)
  manualGsm:         z.number().positive().optional(),
  manualWastePct:    z.number().min(0).max(100).optional(),
  sheetWidthMm:      z.number().positive().optional(),   // NULL = profil default
  sheetLengthMm:     z.number().positive().optional(),   // NULL = profil default
  direction:         ConversionDirectionSchema,
  inputValue:        z.number().positive(),
  // Audit konteksti (ixtiyoriy)
  context:           z.enum(['PP_ORDER','SD_QUOTE','MES_NORM','MANUAL']).optional(),
  contextId:         z.number().int().optional(),
}).refine(
  (d) => d.materialProfileId !== undefined || (d.manualGsm !== undefined),
  { message: 'materialProfileId yoki manualGsm kerak' }
);
export type ConvertRequest = z.infer<typeof ConvertRequestSchema>;

// Konversiya natijasi
export const ConvertResultSchema = z.object({
  inputValue:      z.number(),
  inputUnit:       z.string(),
  outputValue:     z.number(),
  outputUnit:      z.string(),
  m2PerSheet:      z.number().optional(),   // bir list m²
  gsmUsed:         z.number().optional(),   // qaysi GSM ishlatildi
  wastePctUsed:    z.number().optional(),   // qaysi chiqindi % ishlatildi
  formulaTrace:    z.object({              // formula izi (debug/audit)
    formula1_m2:   z.number().optional(),
    formula2_kg:   z.number().optional(),
    formula3_gsm:  z.number().optional(),
  }),
  warnings:        z.array(z.string()),    // "take_up NULL" kabi ogohlantirishlar
});
export type ConvertResult = z.infer<typeof ConvertResultSchema>;

// Material profil so'rovi
export const MaterialProfileQuerySchema = z.object({
  paperType: z.enum(['gofra','karton','kraft','duplex','triplex','rulon','boshqa']).optional(),
  isActive:  z.coerce.boolean().optional().default(true),
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(100).optional().default(50),
});
export type MaterialProfileQuery = z.infer<typeof MaterialProfileQuerySchema>;
```

### 7.2 Repository Interfeysi

**Fayl:** `apps/api/src/modules/pp/conversion/i-gofra-conversion.repo.ts`

```typescript
import type { Result } from '@common/result';
import type { PpFluteType, PpMaterialProfile, InsertPpConversionLog, PpConversionLog } from '@workspace/db';
import type { MaterialProfileQuery } from './gofra-conversion.dto';

export interface IGofraConversionRepo {
  findProfileById(id: number): Promise<Result<PpMaterialProfile | null>>;
  findProfiles(query: MaterialProfileQuery): Promise<Result<{ items: PpMaterialProfile[]; total: number }>>;
  findFluteById(id: number): Promise<Result<PpFluteType | null>>;
  findAllFluteTypes(): Promise<Result<PpFluteType[]>>;
  logConversion(data: InsertPpConversionLog): Promise<Result<PpConversionLog>>;
  upsertMaterialProfile(data: Omit<PpMaterialProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<PpMaterialProfile>>;
}

export const GOFRA_CONVERSION_REPO = Symbol('IGofraConversionRepo');
```

### 7.3 Drizzle Repository Implementatsiyasi

**Fayl:** `apps/api/src/modules/pp/conversion/drizzle-gofra-conversion.repo.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@common/drizzle';
import { DrizzleDb } from '@workspace/db';
import { ppFluteTypes, ppMaterialProfiles, ppConversionLog } from '@workspace/db/schema/pp/pp-gofra-formula';
import { eq, and, count } from 'drizzle-orm';
import { ok, err, AppErr } from '@common/result';
import type { Result } from '@common/result';
import type { IGofraConversionRepo } from './i-gofra-conversion.repo';
import type { PpFluteType, PpMaterialProfile, InsertPpConversionLog, PpConversionLog } from '@workspace/db';
import type { MaterialProfileQuery } from './gofra-conversion.dto';

@Injectable()
export class DrizzleGofraConversionRepo implements IGofraConversionRepo {
  constructor(@InjectDrizzle() private readonly db: DrizzleDb) {}

  async findProfileById(id: number): Promise<Result<PpMaterialProfile | null>> {
    try {
      const rows = await this.db
        .select()
        .from(ppMaterialProfiles)
        .where(eq(ppMaterialProfiles.id, id))
        .limit(1);
      return ok(rows[0] ?? null);
    } catch (e) {
      return err(AppErr('INTERNAL', String(e)));
    }
  }

  async findProfiles(query: MaterialProfileQuery): Promise<Result<{ items: PpMaterialProfile[]; total: number }>> {
    try {
      const conditions = [];
      if (query.isActive !== undefined) {
        conditions.push(eq(ppMaterialProfiles.isActive, query.isActive));
      }
      if (query.paperType) {
        conditions.push(eq(ppMaterialProfiles.paperType, query.paperType));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const offset = (query.page - 1) * query.limit;
      const [items, [{ value: total }]] = await Promise.all([
        this.db.select().from(ppMaterialProfiles)
          .where(where).limit(query.limit).offset(offset),
        this.db.select({ value: count() }).from(ppMaterialProfiles).where(where),
      ]);
      return ok({ items: Array.isArray(items) ? items : [], total: Number(total) });
    } catch (e) {
      return err(AppErr('INTERNAL', String(e)));
    }
  }

  async findFluteById(id: number): Promise<Result<PpFluteType | null>> {
    try {
      const rows = await this.db.select().from(ppFluteTypes).where(eq(ppFluteTypes.id, id)).limit(1);
      return ok(rows[0] ?? null);
    } catch (e) {
      return err(AppErr('INTERNAL', String(e)));
    }
  }

  async findAllFluteTypes(): Promise<Result<PpFluteType[]>> {
    try {
      const rows = await this.db
        .select()
        .from(ppFluteTypes)
        .where(eq(ppFluteTypes.isActive, true));
      return ok(Array.isArray(rows) ? rows : []);
    } catch (e) {
      return err(AppErr('INTERNAL', String(e)));
    }
  }

  async logConversion(data: InsertPpConversionLog): Promise<Result<PpConversionLog>> {
    try {
      const rows = await this.db.insert(ppConversionLog).values(data).returning();
      if (!rows[0]) return err(AppErr('INTERNAL', 'Log yozilmadi'));
      return ok(rows[0]);
    } catch (e) {
      return err(AppErr('INTERNAL', String(e)));
    }
  }

  async upsertMaterialProfile(
    data: Omit<PpMaterialProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<PpMaterialProfile>> {
    try {
      const rows = await this.db
        .insert(ppMaterialProfiles)
        .values(data)
        .onConflictDoUpdate({
          target: ppMaterialProfiles.materialCode,
          set: { ...data, updatedAt: new Date() },
        })
        .returning();
      if (!rows[0]) return err(AppErr('INTERNAL', 'Profil saqlanmadi'));
      return ok(rows[0]);
    } catch (e) {
      return err(AppErr('INTERNAL', String(e)));
    }
  }
}
```

### 7.4 Konversiya Servisi (3-formula logika)

**Fayl:** `apps/api/src/modules/pp/conversion/gofra-conversion.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { GOFRA_CONVERSION_REPO, IGofraConversionRepo } from './i-gofra-conversion.repo';
import { ok, err, AppErr } from '@common/result';
import type { Result } from '@common/result';
import type { ConvertRequest, ConvertResult } from './gofra-conversion.dto';

/**
 * GofraConversionService
 *
 * 3-formula konversiya dvigateli (kg ↔ m² ↔ list).
 * Vizyon: CHAT-TARIXI-YANGI §29 — yulduzli element.
 *
 * Muhim: Hech qanday birlik koeffitsienti KODGA YOZILMAYDI.
 * Barcha koeffitsientlar (GSM, take_up, waste_pct) master-datadan olinadi.
 * Agar take_up_factor NULL bo'lsa — warnings[] ga yoziladi, hisob bajarilmaydi.
 */
@Injectable()
export class GofraConversionService {
  constructor(
    @Inject(GOFRA_CONVERSION_REPO)
    private readonly repo: IGofraConversionRepo,
  ) {}

  /**
   * convert — asosiy konversiya metodi
   * Q-40: REAL hisoblanadi + DB proof (log yoziladi).
   */
  async convert(req: ConvertRequest, userId?: number): Promise<Result<ConvertResult>> {
    const warnings: string[] = [];

    // 1. Material profil olish
    let gsm: number | null = null;
    let wastePct: number | null = null;
    let sheetWidthMm: number | null = req.sheetWidthMm ?? null;
    let sheetLengthMm: number | null = req.sheetLengthMm ?? null;

    if (req.materialProfileId) {
      const profileResult = await this.repo.findProfileById(req.materialProfileId);
      if (!profileResult.ok) return err(profileResult.error);
      const profile = profileResult.data;
      if (!profile) return err(AppErr('NOT_FOUND', `Material profil #${req.materialProfileId} topilmadi`));

      gsm = profile.totalGsm !== null ? Number(profile.totalGsm) : null;

      // Agar total_gsm yo'q va flute ma'lumotlari bor — Formula 3 hisoblash
      if (gsm === null && profile.fluteTypeId) {
        const fluteResult = await this.repo.findFluteById(profile.fluteTypeId);
        if (!fluteResult.ok) return err(fluteResult.error);
        const flute = fluteResult.data;

        if (flute && flute.takeUpFactor !== null) {
          const l1 = profile.liner1Gsm !== null ? Number(profile.liner1Gsm) : 0;
          const l2 = profile.liner2Gsm !== null ? Number(profile.liner2Gsm) : 0;
          const medium = profile.mediumGsm !== null ? Number(profile.mediumGsm) : 0;
          const tuf = Number(flute.takeUpFactor);
          // FORMULA 3: grammaj = liner1 + liner2 + (flute_medium × take_up_factor)
          gsm = l1 + l2 + medium * tuf;
        } else {
          warnings.push('take_up_factor sozlanmagan — GSM hisoblanmadi. Egasi pp_flute_types da to\'ldirsin.');
        }
      }

      if (gsm === null) {
        warnings.push('total_gsm ham, Formula-3 uchun flute/take_up ham yo\'q. Egasi material profilni to\'ldirsin.');
      }

      wastePct = profile.wastePct !== null ? Number(profile.wastePct) : null;
      if (wastePct === null) {
        warnings.push('waste_pct sozlanmagan — chiqindisiz hisob (0% deb olinadi).');
      }

      // Profil default o'lchamlari (agar so'rovda berilmagan bo'lsa)
      if (!sheetWidthMm && profile.sheetWidthMm !== null) {
        sheetWidthMm = Number(profile.sheetWidthMm);
      }
      if (!sheetLengthMm && profile.sheetLengthMm !== null) {
        sheetLengthMm = Number(profile.sheetLengthMm);
      }
    } else {
      // Qo'lda kiritilgan qiymatlar
      gsm = req.manualGsm ?? null;
      wastePct = req.manualWastePct ?? null;
    }

    if (gsm !== null && gsm <= 0) {
      return err(AppErr('VALIDATION', 'GSM 0 dan katta bo\'lishi kerak'));
    }

    // 2. Bir list m² hisoblash
    let m2PerSheet: number | null = null;
    if (sheetWidthMm && sheetLengthMm) {
      const wasteK = 1 + (wastePct ?? 0) / 100.0;
      // FORMULA 1: m² = yoyilgan_uzunlik × yoyilgan_kenglik × chiqindi_koeff
      // Bu yerda: yoyilgan = sheet_size (mm → m)
      m2PerSheet = (sheetWidthMm / 1000.0) * (sheetLengthMm / 1000.0) * wasteK;
    } else {
      if (['m2_to_list', 'list_to_m2', 'kg_to_list', 'list_to_kg'].includes(req.direction)) {
        return err(AppErr('VALIDATION',
          'List hisob uchun sheetWidthMm va sheetLengthMm kerak (profil yoki qo\'lda)'));
      }
    }

    // 3. Konversiya hisoblash
    const trace: ConvertResult['formulaTrace'] = {
      formula1_m2: m2PerSheet ?? undefined,
      formula3_gsm: gsm ?? undefined,
    };
    let outputValue: number;
    let outputUnit: string;
    const inputUnit = req.direction.split('_to_')[0]!;

    switch (req.direction) {
      case 'kg_to_m2': {
        if (!gsm) return err(AppErr('VALIDATION', 'GSM kerak (kg→m² uchun)'));
        // FORMULA 2 teskari: m² = kg / (gsm / 1000)
        outputValue = req.inputValue / (gsm / 1000.0);
        outputUnit = 'm2';
        trace.formula2_kg = req.inputValue;
        break;
      }
      case 'm2_to_kg': {
        if (!gsm) return err(AppErr('VALIDATION', 'GSM kerak (m²→kg uchun)'));
        // FORMULA 2: kg = m² × gsm / 1000
        outputValue = req.inputValue * (gsm / 1000.0);
        outputUnit = 'kg';
        trace.formula2_kg = outputValue;
        break;
      }
      case 'm2_to_list': {
        if (!m2PerSheet) return err(AppErr('VALIDATION', 'Sheet o\'lchamlari kerak (m²→list uchun)'));
        outputValue = req.inputValue / m2PerSheet;
        outputUnit = 'list';
        break;
      }
      case 'list_to_m2': {
        if (!m2PerSheet) return err(AppErr('VALIDATION', 'Sheet o\'lchamlari kerak (list→m² uchun)'));
        outputValue = req.inputValue * m2PerSheet;
        outputUnit = 'm2';
        break;
      }
      case 'kg_to_list': {
        if (!gsm) return err(AppErr('VALIDATION', 'GSM kerak (kg→list uchun)'));
        if (!m2PerSheet) return err(AppErr('VALIDATION', 'Sheet o\'lchamlari kerak (kg→list uchun)'));
        // kg → m² → list
        const totalM2 = req.inputValue / (gsm / 1000.0);
        outputValue = totalM2 / m2PerSheet;
        outputUnit = 'list';
        trace.formula2_kg = req.inputValue;
        break;
      }
      case 'list_to_kg': {
        if (!gsm) return err(AppErr('VALIDATION', 'GSM kerak (list→kg uchun)'));
        if (!m2PerSheet) return err(AppErr('VALIDATION', 'Sheet o\'lchamlari kerak (list→kg uchun)'));
        // list → m² → kg
        const totalM2 = req.inputValue * m2PerSheet;
        outputValue = totalM2 * (gsm / 1000.0);
        outputUnit = 'kg';
        trace.formula2_kg = outputValue;
        break;
      }
      default: {
        return err(AppErr('VALIDATION', `Noma'lum yo'nalish: ${req.direction}`));
      }
    }

    // 4. Audit logi yozish (Q-40: REAL yozuv)
    await this.repo.logConversion({
      materialProfileId: req.materialProfileId ?? null,
      requestedBy: userId ?? null,
      direction: req.direction,
      inputValue: String(req.inputValue),
      inputUnit,
      outputValue: String(outputValue),
      outputUnit,
      sheetWidthMm:  sheetWidthMm  ? String(sheetWidthMm)  : null,
      sheetLengthMm: sheetLengthMm ? String(sheetLengthMm) : null,
      wastePctUsed:  wastePct      ? String(wastePct)       : null,
      context: req.context ?? null,
      contextId: req.contextId ?? null,
    });

    return ok({
      inputValue:   req.inputValue,
      inputUnit,
      outputValue:  Math.round(outputValue * 10000) / 10000, // 4 kasr aniqlik
      outputUnit,
      m2PerSheet:   m2PerSheet ?? undefined,
      gsmUsed:      gsm ?? undefined,
      wastePctUsed: wastePct ?? undefined,
      formulaTrace: trace,
      warnings,
    });
  }

  /**
   * getProfiles — material profillar ro'yxati
   */
  async getProfiles(query: import('./gofra-conversion.dto').MaterialProfileQuery) {
    return this.repo.findProfiles(query);
  }

  /**
   * getFluteTypes — flute turlari ro'yxati
   */
  async getFluteTypes() {
    return this.repo.findAllFluteTypes();
  }
}
```

### 7.5 Controller

**Fayl:** `apps/api/src/modules/pp/conversion/gofra-conversion.controller.ts`

```typescript
import {
  Controller, Post, Get, Body, Query,
  UseGuards, HttpCode, HttpStatus, Request as Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { GofraConversionService } from './gofra-conversion.service';
import {
  ConvertRequestSchema, MaterialProfileQuerySchema,
} from './gofra-conversion.dto';

@Controller('pp/conversion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GofraConversionController {
  constructor(private readonly svc: GofraConversionService) {}

  /**
   * POST /api/pp/conversion/convert
   * 3-formula konversiya: kg↔m²↔list
   * Barcha autentifikatsiya qilingan foydalanuvchilar uchun ochiq
   * (PP/SD/MES texnologlar o'qishi kerak)
   */
  @Post('convert')
  @HttpCode(HttpStatus.OK)
  async convert(@Body() body: unknown, @Req() req: any) {
    const dto = ConvertRequestSchema.parse(body);
    const userId = req.user?.id as number | undefined;
    const result = await this.svc.convert(dto, userId);
    if (!result.ok) {
      throw new (require('@nestjs/common').BadRequestException)(result.error.message);
    }
    return result.data;
  }

  /**
   * GET /api/pp/conversion/profiles
   * Material profillar ro'yxati (master-data)
   */
  @Get('profiles')
  async getProfiles(@Query() query: unknown) {
    const dto = MaterialProfileQuerySchema.parse(query);
    const result = await this.svc.getProfiles(dto);
    if (!result.ok) {
      throw new (require('@nestjs/common').InternalServerErrorException)(result.error.message);
    }
    return result.data;
  }

  /**
   * GET /api/pp/conversion/flute-types
   * Flute turlari va take-up faktorlar (egasi to'ldiradi)
   */
  @Get('flute-types')
  async getFluteTypes() {
    const result = await this.svc.getFluteTypes();
    if (!result.ok) {
      throw new (require('@nestjs/common').InternalServerErrorException)(result.error.message);
    }
    return result.data;
  }
}
```

### 7.6 pp.module.ts ro'yxatdan o'tkazish — P13 bajaradi (P53 TEGMAYDI)

> **IZOLYATSIYA — YAGONA EGA:** `apps/api/src/modules/pp/pp.module.ts` ning yagona egasi va commit qiluvchisi = **P13** (manifest §5: 1 fayl = 1 ega). P53 bu faylga **TEGMAYDI** va commit qilmaydi.
>
> P53 ning konversiya provayderlarini pp.module.ts ga **P13 ro'yxatdan o'tkazadi** (P13 §2.6b + §4 QADAM 4b). P13 quyidagilarni qo'shadi:
>
> ```typescript
> // import bloki:
> import { GofraConversionController } from './conversion/gofra-conversion.controller';
> import { GofraConversionService } from './conversion/gofra-conversion.service';
> import { DrizzleGofraConversionRepo } from './conversion/drizzle-gofra-conversion.repo';
> import { GOFRA_CONVERSION_REPO } from './conversion/i-gofra-conversion.repo';
>
> // controllers[]: GofraConversionController
> // providers[]:   GofraConversionService,
> //                { provide: GOFRA_CONVERSION_REPO, useClass: DrizzleGofraConversionRepo }
> ```
>
> **P53 javobgarligi:** `conversion/` papkasidagi 5 faylni P13 import qila oladigan holatda (to'g'ri eksport nomlari bilan) yaratish. Boshqa hech narsa. P13 simlashni o'z QADAM 4b sweepida bajaradi.

---

## 8. FRONTEND HELPER — useGofrConversion HOOK (Wave 2)

**Fayl:** `artifacts/erp-dashboard/src/hooks/useGofrConversion.ts`

```typescript
/**
 * useGofrConversion — Gofra 3-formula konversiya React hook
 * Vizyon: CHAT-TARIXI-YANGI §29 (kg↔m²↔list avtomatik)
 *
 * Ishlatish:
 *   const { convert, profiles, fluteTypes, isLoading } = useGofrConversion();
 *   const result = await convert({ materialProfileId: 3, direction: 'kg_to_list', inputValue: 100 });
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { toast } from '@/hooks/use-toast';

export type ConversionDirection =
  | 'kg_to_list' | 'list_to_kg'
  | 'm2_to_list' | 'list_to_m2'
  | 'm2_to_kg'   | 'kg_to_m2';

export interface ConvertInput {
  materialProfileId?: number;
  manualGsm?: number;
  manualWastePct?: number;
  sheetWidthMm?: number;
  sheetLengthMm?: number;
  direction: ConversionDirection;
  inputValue: number;
  context?: 'PP_ORDER' | 'SD_QUOTE' | 'MES_NORM' | 'MANUAL';
  contextId?: number;
}

export interface ConvertOutput {
  inputValue: number;
  inputUnit: string;
  outputValue: number;
  outputUnit: string;
  m2PerSheet?: number;
  gsmUsed?: number;
  wastePctUsed?: number;
  formulaTrace: {
    formula1_m2?: number;
    formula2_kg?: number;
    formula3_gsm?: number;
  };
  warnings: string[];
}

export interface MaterialProfile {
  id: number;
  materialCode: string;
  materialName: string;
  paperType: string;
  totalGsm?: number;
  sheetWidthMm?: number;
  sheetLengthMm?: number;
  wastePct?: number;
  isActive: boolean;
}

export interface FluteType {
  id: number;
  code: string;
  nameUz: string;
  nameRu?: string;
  takeUpFactor?: number;   // null = egasi to'ldirmagan
  isActive: boolean;
}

export function useGofrConversion() {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<ConvertOutput | null>(null);

  // Material profillar ro'yxati (master-data)
  const profilesQuery = useQuery({
    queryKey: ['/api/pp/conversion/profiles'],
    queryFn: () =>
      apiRequest<{ items: MaterialProfile[]; total: number }>(
        'GET', '/api/pp/conversion/profiles?isActive=true&limit=100'
      ),
    staleTime: 5 * 60 * 1000, // 5 daqiqa cache
  });

  // Flute turlari (master-data)
  const fluteQuery = useQuery({
    queryKey: ['/api/pp/conversion/flute-types'],
    queryFn: () => apiRequest<FluteType[]>('GET', '/api/pp/conversion/flute-types'),
    staleTime: 10 * 60 * 1000,
  });

  // Konversiya mutation
  const convertMutation = useMutation({
    mutationFn: (input: ConvertInput) =>
      apiRequest<ConvertOutput>('POST', '/api/pp/conversion/convert', input),
    onSuccess: (data) => {
      setLastResult(data);
      // Ogohlantirishlarni ko'rsat
      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        data.warnings.forEach((w) =>
          toast({ title: 'Konversiya ogohlantirish', description: w, variant: 'default' })
        );
      }
    },
    onError: () =>
      toast({ title: 'Konversiya xatoligi', variant: 'destructive' }),
  });

  const convert = useCallback(
    (input: ConvertInput) => convertMutation.mutateAsync(input),
    [convertMutation]
  );

  // Profil null-xavfsiz ro'yxati
  const profiles: MaterialProfile[] = Array.isArray(profilesQuery.data?.items)
    ? profilesQuery.data.items
    : [];
  const fluteTypes: FluteType[] = Array.isArray(fluteQuery.data)
    ? fluteQuery.data
    : [];

  return {
    convert,
    profiles,
    fluteTypes,
    lastResult,
    isLoading: convertMutation.isPending || profilesQuery.isLoading,
    isProfilesLoading: profilesQuery.isLoading,
    isFluteLoading: fluteQuery.isLoading,
  };
}
```

---

## 9. SELF-VERIFY QADAMLARI

### 9.1 Wave 1 (Schema) — Tugatgandan Keyin

```bash
# 1. TypeScript kompilyatsiya (lib/db)
pnpm --filter @workspace/db run build
# Natija: 0 xato

# 2. Yangi eksportlar mavjudmi?
grep -r "ppFluteTypes\|ppMaterialProfiles\|ppConversionLog" \
  lib/db/src/schema/pp/ --include="*.ts"

# 3. Barrel eksporti qo'shilganmi?
grep "pp-gofra-formula" lib/db/src/schema/pp/index.ts

# 4. Mavjud PP sxemalari buzilmaganmi?
pnpm --filter @europrint/api run tsc:check
```

### 9.2 Wave 2 (Backend) — Migration GATED, lekin TypeCheck

```bash
# 1. Backend typecheck (migration ishga tushirilmagan holda)
pnpm --filter @europrint/api run tsc:check
# Natija: 0 xato (migration yuklanmagan, lekin DI provayderlar to'g'ri)

# 2. Conversion fayllar to'g'ri eksport qiladimi (P13 import qila olishi uchun)?
grep -r "export class GofraConversionController\|export class GofraConversionService\|export const GOFRA_CONVERSION_REPO\|export class DrizzleGofraConversionRepo" \
  apps/api/src/modules/pp/conversion/
# Eslatma: pp.module.ts ga ro'yxatdan o'tkazish P13 da (P53 tegmaydi).
# DI to'liq simlangach (P13 QADAM 4b) boot/tsc orqali tasdiqlanadi.

# 3. Conversion papkasi barcha fayllar mavjudmi?
ls apps/api/src/modules/pp/conversion/

# 4. FE hook typecheck
pnpm --filter erp-dashboard run tsc:check
```

### 9.3 Egasi DDL ni APPROVE qilganidan KEYIN (qo'lda)

```bash
# 1. Migration ishga tushirish (faqat egasi APPROVED: berganidan keyin)
psql $DATABASE_URL -f apps/api/src/database/migrations/p53-gofra-sloy-formula.sql

# 2. Jadval mavjudligini tekshirish
psql $DATABASE_URL -c "\dt pp_flute_types"
psql $DATABASE_URL -c "\dt pp_material_profiles"
psql $DATABASE_URL -c "\dt pp_conversion_log"

# 3. Flute types seed tekshirish
psql $DATABASE_URL -c "SELECT code, name_uz, take_up_factor FROM pp_flute_types ORDER BY code;"
# take_up_factor = NULL bo'lishi kerak (egasi to'ldiradi)

# 4. Jonli endpoint tekshirish (server ishga tushgandan keyin)
curl -s -X GET "http://localhost:3030/api/pp/conversion/flute-types" \
  -H "Authorization: Bearer $TOKEN" | jq .

curl -s -X GET "http://localhost:3030/api/pp/conversion/profiles" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Konversiya testi — profil yo'q holat (egasi qiymat kiritmagan)
curl -s -X POST "http://localhost:3030/api/pp/conversion/convert" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"manualGsm": 200, "manualWastePct": 5,
       "sheetWidthMm": 1000, "sheetLengthMm": 700,
       "direction": "list_to_kg", "inputValue": 1000}' | jq .
# Natija: outputValue = 200 * 0.01 * 0.001 * 1000 = taxminan 1.47 kg/list * 1000 list
# (aniq raqam formula bilan tekshiriladi — echo emas)

# 6. DB log tekshirish (Q-40 real yozuv)
psql $DATABASE_URL -c "SELECT id, direction, input_value, output_value, created_at FROM pp_conversion_log LIMIT 5;"
```

---

## 10. EGASI UCHUN IZOH VA KEYINGI QADAM

### A. Egasi To'ldirishi Kerak (ISHGA TUSHIRISHDAN OLDIN)

| Narsa | Jadval | Ustun | Eslatma |
|-------|--------|-------|---------|
| Flute A take-up | `pp_flute_types` | `take_up_factor` | Zavod o'lchovi (taxminiy emas) |
| Flute B take-up | `pp_flute_types` | `take_up_factor` | Zavod o'lchovi |
| Flute C take-up | `pp_flute_types` | `take_up_factor` | Zavod o'lchovi |
| Flute E take-up | `pp_flute_types` | `take_up_factor` | Zavod o'lchovi |
| 21 material profil | `pp_material_profiles` | barcha | Egasi o'zi kiritadi |
| Chiqindi % | `pp_material_profiles` | `waste_pct` | Har material uchun |
| Sheet o'lchamlari | `pp_material_profiles` | `sheet_width/length_mm` | Standart formatlar |

### B. SD/MES Integratsiyasi (KEYINGI PAKET)

Bu paket **FAQAT PP konversiya servisini** quradi.
SD (narx = sloy formula + ustama) va MES (norma = list + m²) integratsiyasi
**alohida paketda** yoki egasining keyingi buyrug'i bilan amalga oshiriladi.

SD integratsiyasi uchun:
```
SD buyurtma yaratishda:
  1. sd-order-items.quantity → pp/conversion/convert (list → kg)
  2. Natija: material_kg_required → BOM/MRP uchun
  3. Narx: material_kg × kg_narx + ustama_pct
```

MES integratsiyasi uchun:
```
MES smena norma uchun:
  1. work_center.format + material_profile → m2_per_shift
  2. m2_per_shift → list_per_shift (norma)
  3. List/soat = norma, IoT dan fakt olinadi
```

### C. QABUL MEZONI (Definition of Done)

Ushbu paket QABUL QILINGAN deb hisoblanadi, agar:

- [ ] `pp-gofra-formula.ts` Drizzle sxemasi to'g'ri yozilgan (`tsc 0`)
- [ ] `conversion/` papkasi barcha 5 fayl mavjud (to'g'ri eksport nomlari bilan — P13 import qiladi)
- [ ] `pp.module.ts` ga P53 TEGMAGAN (ro'yxatdan o'tkazish P13 da — §7.6); P53 commitida pp.module.ts YO'Q
- [ ] `useGofrConversion.ts` FE hook yozilgan (`tsc 0`)
- [ ] Migration fayli yozilgan, LEKIN `-- APPROVED:` bo'sh (gated)
- [ ] Egasi migration ga `-- APPROVED:` qo'ydi
- [ ] Migration ishga tushdi (3 jadval yaratildi)
- [ ] Flute types seed qo'shildi (7 row, take_up NULL)
- [ ] POST /api/pp/conversion/convert real hisob qiladi, echo emas
- [ ] GET /api/pp/conversion/profiles DB dan qaytaradi
- [ ] GET /api/pp/conversion/flute-types DB dan qaytaradi
- [ ] pp_conversion_log ga real yozuv tushadi
- [ ] warnings[] take_up NULL bo'lsa ogohlantirishlar beradi
- [ ] Egasi 21 material profil kiritdi

---

## KROSS-PAKET TA'SIR VA BOG'LIQLIKLAR

| Modul | Ta'sir | Tur |
|-------|--------|-----|
| PP / BOM (P13) | `pp_material_profiles.id` → BOM da `materialProfileId` FK qo'shish | Keyingi paket |
| PP / MRP (P12) | Material norma hisob → `kg_to_m2` konversiya | Keyingi paket |
| SD / Narx (P10) | "narx = sloy formula + ustama" → `convert()` chaqiruv | Keyingi paket |
| MES / Norma (P15) | "norma = list + m²" → `m2_to_list` konversiya | Keyingi paket |
| WMS (EP-WMS-042) | `kg↔m↔m²` birlik konvertatsiya → ushbu servis | Keyingi paket |
| QC (gramaj norma) | `pp_material_profiles.totalGsm` → QC fizik norma bilan solishtirish | Keyingi paket |

**Bu paket:** konversiya dvigateli va master-data jadvallarni quradi.
Ulash (wiring) alohida paket yoki tegishli modul buyrug'i bilan.

---

> **Direktiva holati:** TAYYOR — egasi DDL APPROVED: berguncha GATED.
> **Yozilgan:** 2026-06-19 | **Muallif:** Maslahatchi (Claude) — 🔵 Tahlilchi artefakt.
> **Egasi harakati kerak:** `-- APPROVED:` + 21 material seed qiymatlar + flute take-up.
