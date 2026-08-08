-- APPROVED: egasi 2026-07-02 vizyonni toliq qilish
-- MASTER-REJA-VIZYON-2026-07-02.md band 2.13 (cameras-404): POST/PUT /api/camera-settings
-- upserts a singleton row into the generic `settings` key-value table via
-- `onConflictDoUpdate({ target: settings.key })`. The Drizzle pgTable declares
-- `uniqueIndex('settings_key_idx').on(table.key)` but that index was never applied
-- to the live DB (schema drift) — ON CONFLICT fails without it. Additive index only.
CREATE UNIQUE INDEX IF NOT EXISTS settings_key_idx ON settings (key);
