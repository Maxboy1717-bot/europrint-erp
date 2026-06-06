# QATLAM FORMULASI (kg↔list) — TO'LIQ REJA + STEP 1 TAHLIL
> 2026-06-06 | Vision #7 — ishlab chiqarish rejalashtirishning "miyasi" | Rol: EDITOR (inline, subagent yo'q)
> Egasi tasdiqladi: konfiguratsiyalanadigan formula (qattiq emas), config = material_cards + qatlam jadvali.

## 0. KONTEKST (eski reja bilan bog'lanish)
Bu — transmissiya missiyasining keyingi yadrosi. Avval ulangan spina: order→line-items→production→**BOM→material_cards** (material iste'mol). BOM material talab qiladi (qty), lekin qog'oz/karton **RULON (kg)** bilan keladi, **LIST (sht)** bo'lib ishlatiladi. Bu formula = kg↔list ko'prigi → BOM, xarid (mm), MPS, POS-qabul hammasi to'g'ri kg/list bilan ishlaydi. Hozir bu ko'prik **YO'Q** (tasdiqlandi).

## 1. ⭐ STEP 1 — TAHLIL (read-only natija)

### Formula (egasi tasdiqi — tekshirildi ✅)
**A) Oddiy (1 qatlam):**
- `area_m2 = (uzunlik_mm/1000) × (kenglik_mm/1000)`
- `list_vazni_g = area_m2 × GSM`
- `list_soni = (jami_kg × 1000) / list_vazni_g`
- teskari: `kg = (area_m2 × GSM × list_soni) / 1000`
- ✅ misol: 1000×700mm @ 300GSM → 0.7m² → 210g → 100kg = **476 list**

**B) Gofrirovka (ko'p qatlam):**
- `jami_GSM = Σ(liner_GSM) + Σ(flute_GSM × take_up_factor)`
- keyin A dagidek list-matematika
- Single-wall=1flute+2liner; Double=2flute+3liner; Triple=3flute+4liner
- ✅ misol: 205+205+(127×1.43) = 410+181.6 = **591.6 ≈ 592 GSM**

### material_cards HOZIR (jonli, 21 qator) — bor vs kerak
| Formula kerak | material_cards'da | Holat |
|---|---|---|
| GSM | **`grammage`** (numeric) | ✅ BOR (5/21 to'ldirilgan) |
| uzunlik (mm) | **`format_a`** (numeric) | ✅ ustun bor, lekin 0/21 to'ldirilgan |
| kenglik (mm) | **`format_b`** (numeric) | ✅ ustun bor, 0/21 |
| tur (oddiy/gofra) | `material_type`='CONSUMABLE' (umumiy) | ⚠️ aniq emas → yangi `material_kind` kerak |
| flute turi/take-up | — | ❌ YO'Q (gofra uchun) |
| liner/flute GSM qatlamlari | — | ❌ YO'Q (gofra uchun) |
| wall_type (single/double/triple) | — | ❌ YO'Q |

### Mavjud formula? — **YO'Q** (tasdiqlandi)
qc/imposition + ink-consumption = **boshqa narsa** (list-joylashuvi + bo'yoq grammi/yuza), kg↔list EMAS. Hech qanday kg↔list konvertatsiya yo'q.

### Realistik call-site'lar (calc service qayerga ulanadi)
1. **POS material qabul (kg bo'yicha)** → list-sonini ko'rsat/saqla (`pos stock.controller`/`stock-ledger`) — **eng ko'rinarli, STEP 4 uchun tavsiya**.
2. **pp material planning** (`pp-planning.repository`) — BOM list-talabini kg'ga (xarid uchun).
3. **MPS / mm purchasing** — keyingi to'liq wiring.

---

## 2. ⛔ STEP 2 — DDL (egasi ruxsati kerak — TAKLIF)
Oddiy formula uchun **ustunlar yetarli** (grammage+format_a+format_b bor). Gofra uchun qatlamlar o'zgaruvchan → **alohida jadval tozaroq** (wide-column emas).

**Taklif:**
1. `material_cards` ga **1 ustun**: `material_kind` varchar (NULL) — `'plain'`/`'corrugated'` (mavjud 21 qator buzilmaydi).
2. **YANGI jadval** `material_layer_config` (gofra qatlamlari uchun — egasi ruxsati, Q-35):
   ```
   id serial PK
   material_card_id integer → material_cards(id)
   layer_index integer        -- 1,2,3...
   role varchar               -- 'liner' | 'flute'
   gsm numeric                -- qatlam GSM
   flute_type varchar NULL    -- A/B/C/E (flute uchun)
   take_up_factor numeric NULL -- flute uchun (A≈1.54, C≈1.43...) — EDITABLE
   ```
   - Oddiy material → bu jadvalda qator YO'Q (faqat grammage ishlatiladi).
   - Gofra material → N qator (liner+flute) → jami_GSM hisoblanadi.
3. Take-up standart qiymatlari **seed** (A=1.54, B=1.38, C=1.43, E=1.2) — lekin har material'da **tahrirlanadi**.

⚠️ **Konfiguratsiyalanadigan**: barcha qiymat (GSM, dimension, take-up, flute) material'dan keladi — qattiq emas. Egasi har material uchun tahrirlaydi.

## 3. STEP 3 — calc service (`LayerFormulaService` — sof matematika)
Funksiyalar:
- `sheetAreaM2(length_mm, width_mm)`
- `plainSheetCount(kg, gsm, L, W)` + `plainKg(sheets, gsm, L, W)`
- `corrugatedTotalGsm(layers[])` — Σliner + Σ(flute×takeup)
- `convert(materialCardId)` — material config'ini o'qiydi → kg↔list ikki tomonlama
- **Unit-test**: egasi misollari (476 list; 592 GSM) — raqamlar ko'rinadi.
- DB-proof: temp material+config → service chaqir → raqam tekshir → tozala.

## 4. STEP 4 — bitta real call-site (STEP 3 isbotlangach)
Tavsiya: **POS material qabul** — kg bo'yicha qabul qilinganда list-soni hisoblanadi/ko'rsatiladi. (Egasi boshqa joyni tanlasa — o'sha.)

---

## 5. JARAYON (egasi qoidasi)
- Inline only, har STEP'da DB-proof, JWT-mint YO'Q, alohida commit.
- **STEP 2 DDL — egasi ruxsatidan KEYIN** (bu reja tasdiqlangach).
- Har STEP'dan keyin STOP + hisobot.

## 6. EGASIDAN SO'RALADI (STEP 2 oldidan)
1. ✅ DDL'ni tasdiqlaysizmi: `material_cards.material_kind` + yangi `material_layer_config` jadvali?
2. STEP 4 call-site: **POS qabul (kg→list)** ma'qulmi yoki boshqa joy (pp planning / mm xarid)?
3. Take-up standart seed (A=1.54/B=1.38/C=1.43/E=1.2) — ma'qulmi yoki o'zingiz berasizmi?
