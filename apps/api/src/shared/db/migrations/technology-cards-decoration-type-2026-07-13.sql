-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- technology-cards-decoration-type-2026-07-13.sql
-- 07-pp#119 owner-correction (docs/audit/QARORLAR-JURNALI-2026-07-11.md:85): "bezash
-- turlari = CRUD ro'yxat (AI-reja+operator-tayinlash uchun MAJBURIY), 'erkin matn' EMAS."
-- Decoration type (Laminatsiya yaltiroq/mat, UV-lak to'liq/spot, Oddiy lak) must be a
-- MANDATORY STRUCTURED field — taxonomy_entries.code, category='decoration_type' (3 seeded
-- rows, see taxonomy-seed-2026-07-11.sql lines 25-27), never free text. Feeds PP AI-planning
-- (pp-ai-planning.service.ts step 6 shift-assign) + operator-assignment visibility.
--
-- Scope: technology_cards is the master card for ALL product types (boxes, trays, rolls,
-- laminated sheets, ...) — not every one of them involves a decoration/lamination/varnish
-- operation, so the column is nullable rather than NOT NULL (no "requires decoration" flag
-- exists elsewhere to gate a hard requirement). The "mandatory" part of the owner correction
-- is enforced at the application layer: when a value IS supplied it must be one of the 3
-- known taxonomy_entries.code literals (technology.controller.ts CreateCardDto/UpdateCardDto,
-- DECORATION_TYPE_CODES) — free text is rejected.
--
-- Verified before drafting: technology_cards has no decoration_type column (live \d, 41
-- existing columns) and 0 rows (post full-company-reset, 2026-07-11) — additive, no regress
-- on any existing row (Q-46).
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable mirror of the
-- entry actually executed from apps/api/src/shared/db/invariants/migrations-schema.ts
-- (SCHEMA_MIGRATIONS array, 'technology_cards.decoration_type column (07-pp#119)').

ALTER TABLE IF EXISTS technology_cards
  ADD COLUMN IF NOT EXISTS decoration_type VARCHAR(50);
