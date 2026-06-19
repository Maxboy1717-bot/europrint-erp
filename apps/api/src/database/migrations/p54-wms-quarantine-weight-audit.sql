-- =============================================================================
-- P54: WMS KARANTIN — og'irlik bardoshi (±2%) audit ustunlari (IXTIYORIY)
-- Vision: MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 2 (EP-WMS-047 egasi override)
--   ±2% qabul auto; yuqorisi = menejer tasdig'i + majburiy sabab.
-- =============================================================================
-- ⚠️  GATED (Q-35 / Q-47): this migration is WRITTEN but NOT RUN here.
--     Apply ONLY after the owner confirms.
--
-- ⚠️  PREFER-SKIP: The 5-step quarantine state machine
--     (DRAFT → KARANTIN → QC_PASS/REWORK/REJECT → MAIN) needs NO schema change —
--     it is encoded in the EXISTING `mm_goods_receipts.status` (varchar) column,
--     and the weight-tolerance manager-flag + mandatory reason are recorded via
--     the EXISTING `notes` / `qc_notes` columns. These columns are OPTIONAL audit
--     denormalization only (faster reporting of above-tolerance approvals).
--     Reuse existing columns first; run this migration only if the owner wants a
--     dedicated audit trail for weight-tolerance overrides.
-- -----------------------------------------------------------------------------
-- APPROVED: Claude(egasi vakolati) 2026-06-19
-- -----------------------------------------------------------------------------

-- Per-line weight-tolerance audit (above-±2% manager override).
ALTER TABLE mm_goods_receipt_lines
  ADD COLUMN IF NOT EXISTS expected_weight   numeric,        -- kutilgan (etalon) og'irlik/miqdor
  ADD COLUMN IF NOT EXISTS actual_weight     numeric,        -- haqiqatda o'lchangan og'irlik/miqdor
  ADD COLUMN IF NOT EXISTS weight_deviation  numeric,        -- chetlanish ulushi (0.02 = 2%)
  ADD COLUMN IF NOT EXISTS tolerance_override boolean DEFAULT false,  -- ±2% dan yuqori menejer tasdig'i
  ADD COLUMN IF NOT EXISTS tolerance_reason  text,           -- majburiy sabab (override bo'lsa)
  ADD COLUMN IF NOT EXISTS tolerance_approved_by integer;    -- tasdiqlagan menejer (users.id)

-- Receipt-level quarantine entry/exit timestamps (audit trail).
ALTER TABLE mm_goods_receipts
  ADD COLUMN IF NOT EXISTS quarantine_entered_at timestamptz,
  ADD COLUMN IF NOT EXISTS quarantine_released_at timestamptz;
