-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- SD #18-followup: makes taxonomy_entries category='code_prefix' (KT/PT/E/GL — Korobka
-- tartibi/Paddon tartibi/Etiketka/Gofra list; seeded taxonomy-entries-2026-07-11.sql) load-
-- bearing on a real table. Investigated live: ow_molds.die_code (vision 06-sd#18,
-- sd-ow-molds-die-code-18-2026-07-11.sql) is a free-text physical-die identity tagged
-- MANUALLY by a human via PATCH /sd/orders/:id/molds/:moldId/die-code
-- (SdOrderDepartmentsRepository.setDieCode) — there is no numbering sequence anywhere in
-- the ow_molds insert path to prepend a prefix onto, so code_prefix is added as a
-- CLASSIFICATION TAG on the mold/die (which of the 4 taxonomy categories it belongs to),
-- not a codegen prefix. Validated against the live taxonomy_entries set at the application
-- layer (SdOrderDepartmentsRepository.setCodePrefix reads taxonomy_entries at request time —
-- not hardcoded, Q-40). Additive, nullable — no regression until a mold is tagged (0 rows
-- in ow_molds today).

ALTER TABLE ow_molds ADD COLUMN IF NOT EXISTS code_prefix TEXT;

COMMENT ON COLUMN ow_molds.code_prefix IS
  'taxonomy_entries(category=code_prefix).code classification tag for this mold/die (kt/pt/e/gl = Korobka tartibi/Paddon tartibi/Etiketka/Gofra list). NULL until tagged; validated against the live taxonomy_entries set at the application layer (SdOrderDepartmentsRepository.setCodePrefix), not hardcoded.';

CREATE INDEX IF NOT EXISTS idx_ow_molds_code_prefix ON ow_molds (code_prefix) WHERE code_prefix IS NOT NULL;
