# EXECUTOR DIRECTIVE #01B — PHASE 0 APPROVED, PROCEED
> Owner reviewed your Phase 0 RE-AUDIT and approved. Continue as below.
> English directive · Reports back to owner in Uzbek (Latin). 2026-06-08

## ✅ Phase 0 — approved, excellent work
Verify-don't-trust paid off: you proved the foundation is much cleaner than the stale catalogs claimed (FAKE-CREATE = 0, duplicates already canonical, only 15 real column-drifts + 1 FK + 2 decisions). Read-only mandate respected (no JWT mint, static fallback). Good.

## ▶️ GREENLIGHT — Package A, sub-group 1: the 6 CLEAN RENAMES (do now)
Apply **B1, B2, B3, B10, B11, C1** — each as its own cycle:
1. **Permission (Q-28):** post `file:line` + exact change + reason.
2. **Fix:** prefer code/alias (e.g. `xom_ashyo AS name`) over `ALTER` when the DB column already holds the data. The C1 FK case → safe `::text` cast only.
3. **Verify (Q-29/Q-40):** `tsc` 0 + DB-proof — the live SQL fragment now resolves / the endpoint returns 200 with REAL data.
4. **Commit** separately (`git add <exact-file>`; NEVER `-A`).
These unblock the MES/ERP endpoints. Zero-risk, so move briskly but verify each.

## ▶️ A2 — APPROVED: repoint `PosLowStockJob` to canonical `warehouse_stock`
- **Do NOT disable the cron** — the low-stock alert is a real vision feature (WMS-064 / MM-012: "min qoldiq → avto-signal").
- Repoint the job to read from the canonical **`warehouse_stock`** table (with the correct material reference). This stops the per-minute crash AND keeps the feature.
- Verify: the cron runs one cycle with no error (check logs). Commit.

## ▶️ A1 — APPROVED path: INVESTIGATE first, reuse — do NOT create a new two-world
- First find what the VIEW sits over:
  `node _audit/q.cjs "SELECT definition FROM pg_views WHERE viewname='mm_purchase_order_items'"`
- If it has a **writable base table** → use that base for PO line items (no new table).
- If there is **no writable base** and PO lines genuinely need persisting → **STOP and return to the owner** with a concrete proposal for a new `mm_purchase_order_lines` table (Q-35 approval required). Do NOT create it unilaterally. PO line items are real (supply-chain vision), so this matters — but reuse beats a new table.

## ⏭️ NEXT — the 10 semantic/DDL drifts (after the above are committed)
- Prepare the **specific list**: for each of the 10, `file:line` + the exact `ALTER`/code change + why.
- **Present that list to the owner for per-item approval BEFORE applying any DDL** (Q-35). No `ALTER`/`CREATE` without the owner's "yes" per item.

## Rails (unchanged)
Per-item permission · verify (tsc + DB-proof) · separate commit · no regressions (Q-39) · no rewrites · honest 501 over fake · report to owner in **Uzbek** after this sub-group (done/deferred/commits). Leave the untracked `batch_*.sql` alone (another session). If `:3030` drops to 000 → Q-44 (restart, static fallback).

## After the foundation is clean
Hand back to the advisor → **Prompt #02: build T1 ORG/KARTALAR** (vision ready in `OCHIQ-JAVOBLAR-2026-06-08.md` + `decisions/01-org-kartalar.md`).
