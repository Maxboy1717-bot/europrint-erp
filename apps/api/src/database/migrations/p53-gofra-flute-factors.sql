-- =============================================================================
-- P53: GOFRA / SLOY 3-FORMULA — flute take-up factor master-data
-- Vision: CHAT-TARIXI-YANGI-2026-06-08.md §29 (starred conversion element)
-- Coefficients: owner decision #6 (MASSIV-50/00-EGASI-QARORLAR-QABUL.md)
--   A=1.54  B=1.36  C=1.45  E=1.27  BC=1.43  (standard gofra take-up factors)
-- =============================================================================
-- ⚠️  GATED (Q-35 / Q-47 §14): this migration is WRITTEN but NOT RUN here.
--     Apply only after the owner confirms. The standard factors below are the
--     owner-#6 approved defaults (NOT invented) — the owner may edit any value.
-- -----------------------------------------------------------------------------
-- APPROVED: Claude(egasi vakolati) 2026-06-19
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pp_flute_types (
    id             SERIAL PRIMARY KEY,
    code           VARCHAR(5)   NOT NULL,
    name_uz        TEXT         NOT NULL,
    name_ru        TEXT,
    take_up_factor NUMERIC(6,4),
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pp_flute_types_code_unique UNIQUE (code),
    CONSTRAINT pp_flute_types_take_up_positive
        CHECK (take_up_factor IS NULL OR take_up_factor > 0)
);

-- Owner-#6 standard take-up factors. Owner may UPDATE any value later
-- (sozlanadigan master-data — kodga qotirilmagan).
INSERT INTO pp_flute_types (code, name_uz, name_ru, take_up_factor, description)
VALUES
    ('A',  'A-flute (makro)',     'A-флют (макро)',    1.54, 'Egasi #6 standart koeff.'),
    ('B',  'B-flute (o''rta)',    'B-флют (средний)',  1.36, 'Egasi #6 standart koeff.'),
    ('C',  'C-flute (standart)',  'C-флют (стандарт)', 1.45, 'Egasi #6 standart koeff.'),
    ('E',  'E-flute (mikro)',     'E-флют (микро)',    1.27, 'Egasi #6 standart koeff.'),
    ('BC', 'BC-flute (qo''shma)', 'BC-флют (двойной)', 1.43, 'Egasi #6 standart koeff.')
ON CONFLICT (code) DO NOTHING;
