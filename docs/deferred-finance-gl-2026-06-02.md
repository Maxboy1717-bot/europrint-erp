# Deferred: Finance GL subsystem — phantom query model (2026-06-02)

**Status:** DEFERRED (NOT Stage 0.2 drift). Owner-approved 2026-06-02.
**Branch:** chore/schema-convergence
**Source:** Executor session, Stage 0.2 item #4c investigation.

## Summary

`gl_journal_lines` appeared in the Stage 0.2 "Group A — missing tables" catalog
(`docs/xato1-katalog-2026-06-02.md`) as a simple CREATE-TABLE fix for two 503
endpoints: `GET /api/finance/ratios` and `GET /api/finance/gl`. Investigation
showed it is NOT a single missing table — the two consumer queries are written
against a schema that does not exist in this DB, and the entire GL is empty.

## Evidence (read-only, live DB `europrint`)

The two consumer queries reference these objects:

| Referenced by code | Live DB state |
|---|---|
| `gl_journal_lines` (table) | **MISSING** |
| `gl_accounts` (table) | **MISSING** — real chart-of-accounts table is `accounts` |
| `e.entry_date` / `gje.entry_date` (column) | **MISSING** — real column is `posted_at` |
| `gje.source_id` (column) | **MISSING** |
| `gl_journal_entries` (table) | exists, but **0 rows** |

GL row counts — all empty: `gl_journal_entries=0`, `gl_documents=0`, `gl_lines=0`.

No code WRITES to `gl_journal_lines` (read-only; `INSERT/UPDATE/DELETE` grep is
empty) — so creating the table would NOT activate any GL-posting path.

Real `gl_journal_entries` shape (single-row double-entry, NOT header+lines):

```
id, document_id, document_type, debit_account, credit_account, amount,
currency, description, posted_at, created_at
```

## Why creating an empty `gl_journal_lines` does NOT fix it

- **`GET /api/finance/ratios`** (`drizzle-finance-planning.repo.ts:148-166`):
  would STILL 503 — it also JOINs the missing `gl_accounts` table and filters on
  the missing `e.entry_date` column. An empty lines table changes nothing here.
- **`GET /api/finance/gl`** (`drizzle-finance-invoice.repo.ts:236-244`):
  unfiltered would 200 (empty `lines '[]'`); filtered (account/date) still 503
  via missing `gje.source_id` / `gje.entry_date`.

So the catalog's "503 → empty-200 improvement" holds only for the unfiltered
finance/gl path, not for finance/ratios. The owner's original assumption was
corrected by this evidence.

## The real task (later finance/GL stage)

Rewrite the two consumer queries against the REAL schema, OR build + populate the
intended double-entry-with-lines schema properly:

1. `drizzle-finance-planning.repo.ts:148-166` (`GET /api/finance/ratios`)
   - Rewrite to read `gl_journal_entries` real columns (`debit_account`,
     `credit_account`, `amount`, `posted_at`) joined to `accounts` (not
     `gl_accounts`), OR redesign around the intended ledger model.
2. `drizzle-finance-invoice.repo.ts:236-244` (`GET /api/finance/gl`)
   - Drop/replace the `gl_journal_lines` LEFT JOIN; map filters to real columns
     (`posted_at` instead of `entry_date`; remove/replace `source_id`).

This belongs to the finance/GL subsystem stage already noted in the master plan
("moliya/GL 4 joyda yo'q"). It is a finance-logic rewrite, not a column-name
drift fix.

## Urgency: LOW

GL is 0 rows across all tables — no real data is blocked. These two endpoints
return 503, but there is nothing to display yet regardless. Safe to defer to the
finance/GL build stage.
