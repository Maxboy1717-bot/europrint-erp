# EUROPRINT ERP — MASTER DATA STANDARTLARI

> **Master ma'lumotlarni kim yaratadi, kim o'zgartiradi, qanday kuzatiladi.**
> Master data = biznes asosi (mahsulot, mijoz, xodim, hisoblar).
> Noto'g'ri master data = butun tizim noto'g'ri ishlaydi.
> Bog'liq: [LUGAT.md](LUGAT.md) §4 · [DB_ERD.md](DB_ERD.md) §10 · ADR-001..006

---

## 1. MASTER DATA NIMA?

```
MASTER DATA:
  ✅ Barcha bo'limlar foydalanadigan UMUMIY ma'lumot
  ✅ Kam o'zgaradi (transactions dan farqli)
  ✅ Yaratish/o'zgartirish = maxsus ruxsat
  ✅ Har transaksiya shu ma'lumotga havolalaydi

TRANSAKSIYA DATA:
  📊 Kunlik operatsiyalar: buyurtma, to'lov, harakat, sessiya
  📊 Tez o'zgaradi
  📊 Master data ga FK bilan bog'liq

LOOKUP DATA (Kichik kataloglar):
  🔍 Deyarli o'zgarmaydi: rollar, razryad, birliklar, nuqsonlar
  🔍 Seed SQL orqali yuklangan
  🔍 ERP jarayonida odatda o'zgartirilmaydi
```

---

## 2. MASTER DATA JADVALLARI

### Guruh A: Org/HR Master Data

| Jadval | Egasi | Kim yarata oladi | Kim o'zgartira oladi |
|--------|-------|-----------------|---------------------|
| `razryad_levels` | HR Director | Faqat seed | Faqat super_admin |
| `org_functions` | HR Director | HR Manager, Admin | HR Manager |
| `org_departments` | CEO | Admin | Admin, Director |
| `hr_employees` | HR | HR Manager | HR Manager (o'zi) |
| `roles` | IT Admin | Faqat seed | super_admin |
| `unit_of_measures` | IT Admin | Faqat seed | super_admin |

### Guruh B: Mahsulot/Material Master Data

| Jadval | Egasi | Kim yarata oladi | Kim o'zgartira oladi |
|--------|-------|-----------------|---------------------|
| `material_cards` | Texnolog | Texnolog, PP Manager | Texnolog |
| `technology_cards` | Texnolog | Texnolog | Texnolog (versiya bilan) |
| `work_centers` | PP Manager | PP Manager, Admin | PP Manager |
| `defect_catalog` | QC Manager | QC Manager | QC Manager |

### Guruh C: Moliya Master Data

| Jadval | Egasi | Kim yarata oladi | Kim o'zgartira oladi |
|--------|-------|-----------------|---------------------|
| `accounts` | Bosh buxgalter | Bosh buxgalter | Bosh buxgalter |
| `budget_lines` | Director, Buxgalter | Buxgalter | Buxgalter (tasdiqlangandan keyin emas) |

### Guruh D: CRM/Savdo Master Data

| Jadval | Egasi | Kim yarata oladi | Kim o'zgartira oladi |
|--------|-------|-----------------|---------------------|
| `sd_customers` | Savdo | Sales Manager | Sales Manager |
| `crm_pipeline_stages` | CRM | Admin | Admin |
| `price_lists` | Savdo Director | Sales Manager | Sales Manager |

---

## 3. MASTER DATA YARATISH QOIDALARI

### Qoida M-1: Har master data jadvalida `version` ustuni
```sql
-- technology_cards versiya ko'rinishi:
ALTER TABLE technology_cards
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS superseded_by_id INTEGER REFERENCES technology_cards(id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- O'zgartirish = YANGI versiya yaratish (eski o'chirilmaydi)
-- superseded_by_id → yangi versiya ID si
```

### Qoida M-2: Soft delete MAJBURIY
```sql
-- Master data HECH QACHON to'liq o'chirilmaydi:
-- Boshqa transaksiyalar unga havola qilishi mumkin
ALTER TABLE material_cards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE org_functions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- O'chirish = deleted_at = NOW() (soft delete)
-- Hard DELETE = TAQIQ (FK constraint buzilishi)
```

### Qoida M-3: Yaratuvchi/o'zgartiruvchi kuzatuvi
```sql
-- Barcha master data jadvallari:
created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
created_by   INTEGER REFERENCES users(id) NOT NULL,
updated_by   INTEGER REFERENCES users(id),
deleted_at   TIMESTAMPTZ,
deleted_by   INTEGER REFERENCES users(id)
```

### Qoida M-4: Biznes kalit (code/number)
```sql
-- Har master data jadvalida UNIQUE biznes kalit bo'lishi kerak:
-- (id = texnik, code = biznes)
material_cards.code    UNIQUE  -- "GF-B-001", "OFF-A4-001"
work_centers.code      UNIQUE  -- "WC-GF-01", "WC-OFF-01"
accounts.code          UNIQUE  -- "9010", "1110"
org_functions.code     UNIQUE  -- "ORG-OP-01", "ORG-MG-01"

-- WHY: id o'zgarmasligi kafolatlanmaydi (dump/restore);
--       code = human-readable, stable reference
```

### Qoida M-5: Lookup jadvallar faqat seed orqali
```bash
# roles, razryad_levels, unit_of_measures, defect_catalog:
# ❌ TAQIQ — ERP UI orqali yaratish (foydalanuvchi xatosi)
# ✅ TO'G'RI — faqat seed SQL + super_admin ruxsati

# Agar yangi razryad kerak bo'lsa:
# 1. docs/migration/seed/seed-02-razryad.sql ga qo'sh
# 2. super_admin tasdiqlaydi
# 3. Migration ishga tushiriladi
```

---

## 4. MATERIAL MASTER DATA (EuroPrint maxsus)

### material_cards — barcha materiallar

```sql
-- Standart ustunlar:
material_cards:
  code            VARCHAR UNIQUE  -- "GF-CARTO-B-001" (gofra-karton-profil-nomer)
  name_uz         TEXT NOT NULL   -- "Karton B-profil 3mm"
  name_ru         TEXT
  direction       VARCHAR         -- 'gofra'|'offset'|'silkscreen'|'flexi'|'universal'
  material_type   VARCHAR         -- 'raw_material'|'consumable'|'finished_good'
  unit_of_measure VARCHAR         -- unit_of_measures.code
  min_stock       NUMERIC(18,2)   -- minimum zaxira (ogohlantirish uchun)
  is_active       BOOLEAN DEFAULT true
```

### MATERIAL KOD STANDARTI:
```
Format: [YO'NALISH]-[KATEGORIYA]-[XUSUSIYAT]-[RAQAM]

Gofra:       GF-CARTO-B-001   (gofra karton B-profil #001)
Offset:      OFF-PAPER-A4-001 (offset qog'oz A4 #001)
Siyoh:       INK-CYAN-001     (moviy siyoh #001)
Tayyor mahsulot: FG-BOX-GF-001 (tayyor mahsulot - quti - gofra - #001)
```

---

## 5. TEXNOLOGIK KARTA VERSIYALASH

```
technology_cards = MASTER SPEC (ADR-006: tech_cards ≠ technology_cards)

Versiyalash qoidasi:
- v1.0 → faol
- O'zgartirish kerak → v2.0 yarating (v1.0 = superseded)
- Avvalgi buyurtmalar v1.0 texkartaga havola qilaveradi
- Yangi buyurtmalar v2.0 texkartadan yaratiladi

TAQIQ:
❌ Faol texkartani bevosita o'zgartirish (buyurtmalar buziladi)
❌ Faol texkartani o'chirish (FK error)
```

---

## 6. MASTER DATA IMPORT/EKSPORT

```bash
# Backup (har kun 02:00 da — 15_DevOps.md):
pg_dump -t material_cards -t technology_cards -t org_functions \
  -t accounts -t work_centers $DATABASE_URL > master_data_$(date +%Y%m%d).sql

# Import (yangi muhit uchun):
# Avval: seed fayllar (roles, razryad, units, accounts, defects)
# Keyin: master data backup
psql $DATABASE_URL < master_data_YYYYMMDD.sql

# Excel dan import (material_cards):
# /api/mm/materials/import-excel endpoint (MM moduli sprint da)
# Format: code | name_uz | name_ru | direction | unit | min_stock
```

---

## 7. MASTER DATA MUAMMO HOLATLARI

### Muammo: Ikki xil joyda bir xil ma'lumot
```
Misol: material_cards va mm_materials ikkalasida ham material bor
Yechim: mm_materials = TEST — o'chiriladi (ADR tekshirish)
        material_cards = KANONIK

Qoida M-6: Master data FAQAT BIR JADVALDA bo'lishi shart.
           Agar ikki jadvalda bo'lsa → audit + birini o'chirish (Q-29 verify)
```

### Muammo: Kod loyihasida jadval nomi noto'g'ri
```typescript
// ❌ XATO — material_card_id (eski nom)
const mat = await db.select().from(material_cards)
  .where(eq(material_cards.material_card_id, id)); // eski ustun!

// ✅ TO'G'RI — material_id (kanonik)
const mat = await db.select().from(material_cards)
  .where(eq(material_cards.id, id));
```

### Muammo: Lookup jadvalda UI orqali yaratish
```
Agar foydalanuvchi UI dan rol yoki razryad qo'sha olsa →
→ noto'g'ri ma'lumot kiritish xavfi
→ seed SQL bilan mos kelmaydi

Yechim:
- Lookup jadvallari uchun CREATE API YO'Q
- Faqat READ (GET) endpoint
- O'zgartirish = super_admin + migration + seed fayl yangilash
```

---

## 8. MASTER DATA TEKSHIRUV (AUDIT)

```bash
# Master data yaxlitligi tekshiruvi (har hafta):
node _audit/q.cjs "
  -- Org functions FK dan ajralgan xodimlar:
  SELECT COUNT(*) FROM hr_employees WHERE org_function_id NOT IN
    (SELECT id FROM org_functions WHERE deleted_at IS NULL);

  -- Faol texkarta bo'lmagan buyurtmalar:
  SELECT COUNT(*) FROM work_orders WHERE technology_card_id NOT IN
    (SELECT id FROM technology_cards WHERE is_active = true);

  -- Balans tengligi (GL entries):
  SELECT SUM(CASE WHEN side='DEBIT' THEN amount ELSE -amount END) AS balance
  FROM entries WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
  -- → 0 bo'lishi kerak (debet = kredit)
"
```

---

*EuroPrint ERP · Master Data Standartlari · Versiya: 2026-06-18*
