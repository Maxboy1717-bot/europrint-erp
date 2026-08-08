/**
 * @module eoq.constants
 * @description EOQ (Economic Order Quantity) fleet-wide defaults, shared between
 * wms-eoq.service.ts (application layer, calls the calculator) and
 * eoq-calculator.service.ts (pure-compute domain service, uses these only as
 * its own internal fallback when a caller doesn't supply a per-material value).
 *
 * MAGIC-NUMBERS-AUDIT-V2-FULL-2026-07-05.md item #9 (M9): these two files
 * previously each declared an identical-but-independent copy of
 * ordering-cost=150_000 / holding-cost=0.20. Consolidated here so a future
 * change to one doesn't silently drift from the other.
 *
 * Source: 2024 supply-chain audit (see wms-eoq.service.ts header for the full
 * rationale) — ordering cost ≈ paperwork + receiving + QC sample for a typical
 * line item; holding cost ≈ local cost of capital (~14%) + handling/spoilage.
 * Override per-material when better data exists (no per-material override
 * column exists in material_cards yet -- that would be a schema addition,
 * out of scope for this consolidation).
 *
 * NOT consolidated with mrp-run-eoq.helper.ts's ordering-cost=50_000 /
 * ABC-tiered holding-cost (0.20/0.25/0.30 by segment) -- that's a distinct,
 * more granular scheme, not simply a drifted copy of this one. Reconciling
 * which scheme should be canonical (flat fleet-wide vs ABC-tiered) is a real
 * design decision, not a magic-number fix; flagged for owner input.
 */
export const DEFAULT_ORDERING_COST_UZS = 150_000;
export const DEFAULT_HOLDING_COST_PCT = 0.20;
