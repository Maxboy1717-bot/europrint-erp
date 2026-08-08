# EUROPRINT ERP — MIGRATION TARTIB VA QOIDALAR

> **Migratsiyalarni qaysi tartibda ishga tushirish kerak.**
> FK bog'liqlik zanjiri bo'lgani uchun TARTIB MUHIM.
> Idempotenlik: har fayl qayta ishga tushirilsa xato bermaydi (IF NOT EXISTS / ON CONFLICT).

---

## Muhim Qoidalar

```
1. Har migration = alohida tranzaksiya (BEGIN / COMMIT)
2. Har migration IDEMPOTENT bo'lishi shart (qayta ishlaganda xatosiz)
3. FK ga ega jadval → bog'liq jadvaldan KEYIN yaratiladi
4. DROP TABLE FAQAT egasi ruxsati bilan (Q-35)
5. ALTER TABLE bilan VIEW ni o'zgartirish TAQIQ (B10 xato)
6. gl_journal_entries TEGMA — SAP#76 (ADR-003)
```

---

## TARTIB 1: POYDEVOR JADVALLARI (boshqa hamma bog'liq)

```bash
# Bu jadvallar boshqa hamma jadvallarga kerak — BIRINCHI

psql $DATABASE_URL -c "
  -- Rollar:
  CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- O'lchov birliklari:
  CREATE TABLE IF NOT EXISTS unit_of_measures (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name_uz VARCHAR(100),
    name_ru VARCHAR(100),
    symbol VARCHAR(10),
    is_base BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Foydalanuvchilar:
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );
"
```

---

## TARTIB 2: ORG/HR JADVALLARI

```bash
# Razryad → org_functions → hr_employees (tartib shart)

psql $DATABASE_URL -f docs/migration/d2-org-functions-columns.sql

# Seed: razryad va roles
psql $DATABASE_URL -f docs/migration/seed/seed-02-razryad.sql
psql $DATABASE_URL -f docs/migration/seed/seed-01-roles.sql
psql $DATABASE_URL -f docs/migration/seed/seed-03-units.sql
```

---

## TARTIB 3: MATERIAL VA MIJOZ JADVALLARI

```bash
# SD va PP uchun kerak:
# material_cards, sd_customers, unit_of_measures (allaqachon TARTIB 1)

# Seed: o'lchov birliklari (TARTIB 1 da qilingan)
```

---

## TARTIB 4: SD (SAVDO) JADVALLARI

```bash
# sales_orders → sd_customers ga bog'liq
psql $DATABASE_URL -f docs/migration/add-sales-orders-fks.sql
```

---

## TARTIB 5: PP (ISHLAB CHIQARISH) JADVALLARI

```bash
# work_orders → sales_orders → technology_cards
psql $DATABASE_URL -f docs/migration/d1-technology-cards-alter.sql
```

---

## TARTIB 6: MES JADVALLARI

```bash
# production_sessions → work_orders → work_centers
# shift_handovers (KANONIK) — mes_shift_handovers = VIEW (ALTER TAQIQ)
```

---

## TARTIB 7: QC JADVALLARI

```bash
# quality_checks → work_orders
# defect_catalog (mustaqil lookup)
psql $DATABASE_URL -f docs/migration/seed/seed-05-defects.sql
```

---

## TARTIB 8: WMS JADVALLARI

```bash
# warehouse_stock → material_cards (KANONIK — stocks/wms_stock TEGMA)
# current_stock = VIEW (CREATE VIEW, INSERT TAQIQ)
```

---

## TARTIB 9: FIN (MOLIYA) JADVALLARI

```bash
# accounts (Chart of Accounts)
psql $DATABASE_URL -f docs/migration/seed/seed-04-accounts.sql

# entries → accounts (kanonik GL — gl_journal_entries TEGMA, SAP#76)
```

---

## MAVJUD MIGRATION FAYLLAR (docs/migration/)

| Fayl | Tartib | Tarkib | Holat |
|------|--------|--------|-------|
| `d1-technology-cards-alter.sql` | 5 | technology_cards ustunlar | ✅ APPROVED |
| `d2-org-functions-columns.sql` | 2 | org_functions +13 ustun | ✅ APPROVED |
| `d3-*.sql` | 3 | material_cards | ✅ APPROVED |
| `d4-*.sql` | 4 | SD FK bog'lanishlar | ✅ APPROVED |
| `d5-*.sql` | 6 | MES jadvallar | ✅ APPROVED |
| `add-sales-orders-fks.sql` | 4 | 7 FK → sales_orders | ✅ APPROVED |
| `seed/seed-01-roles.sql` | 1 | 14 rol | ✅ APPROVED |
| `seed/seed-02-razryad.sql` | 2 | Razryad 1-6 | ✅ APPROVED |
| `seed/seed-03-units.sql` | 1 | 21 birlik | ✅ APPROVED |
| `seed/seed-04-accounts.sql` | 9 | 42 BHMS hisobi | ✅ APPROVED |
| `seed/seed-05-defects.sql` | 7 | 23 nuqson | ✅ APPROVED |

---

## Yangi Migration Yozish Qoidasi

```sql
-- APPROVED: owner (sana) ← MAJBURIY belgi
-- fayl-nomi: docs/migration/d[N]-[jadval-nomi]-[amal].sql
-- Sana formatidan tartib soni afzal: d6-, d7-, ...

BEGIN;

-- Idempotent misol:
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER REFERENCES razryad_levels(id);

CREATE INDEX IF NOT EXISTS ix_hr_employees_razryad
  ON hr_employees(razryad_level_id);

COMMIT;
```

**Idempotent bo'lish usullari:**
- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `INSERT ... ON CONFLICT DO NOTHING`
- `INSERT ... ON CONFLICT DO UPDATE SET ...`
- `DROP TABLE IF EXISTS` (egasi ruxsati bilan)

---

## To'liq Yangi Loyiha Setup (Boshlash)

```bash
# 1. DB yaratish:
createdb europrint || true

# 2. Seed tartibda:
psql $DATABASE_URL -f docs/migration/seed/seed-03-units.sql   # birliklar
psql $DATABASE_URL -f docs/migration/seed/seed-01-roles.sql   # rollar
psql $DATABASE_URL -f docs/migration/seed/seed-02-razryad.sql # razryad
psql $DATABASE_URL -f docs/migration/seed/seed-04-accounts.sql # hisoblar
psql $DATABASE_URL -f docs/migration/seed/seed-05-defects.sql # nuqsonlar

# 3. Struktura migration:
for f in docs/migration/d*.sql; do psql $DATABASE_URL -f "$f"; done

# 4. Admin yaratish:
NODE_ENV=development npx ts-node apps/api/src/seeds/admin.seed.ts
```

---

*EuroPrint ERP · Migration Tartib · Versiya: 2026-06-18*
