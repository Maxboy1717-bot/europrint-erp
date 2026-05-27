# DB Provisioning & Schema Source-of-Truth

**Status:** 2026-05-27. Read before any fresh-environment deploy or disaster recovery.

## TL;DR
- **The live PostgreSQL database is the source of truth, NOT the Drizzle schema.**
- **Provision a new environment from a `pg_dump --schema-only` snapshot — NEVER from `drizzle-kit push`.**
- `drizzle-kit push` against a real DB is **forbidden** (it would mis-create tables — see "Why" below).

## Why
The codebase has **two parallel Drizzle schema universes** that both map onto the same live DB:
1. `lib/db/src/schema/*` — the `@workspace/db` package (imported by ~77 files).
2. `apps/api/src/shared/db/schema-*.ts` + `schema-compat-*.ts` stubs — exposed via the `@europrint/schemas` barrel (`europrint-compat.ts`, imported by ~95 repos).

These two universes define many of the same tables in **incompatible** ways — e.g. `users.id` is `uuid` in one and `integer` in another; `attendance` is defined in 5 files. The live DB was hand-migrated (ADD-ONLY) into a **superset** that satisfies every variant, so the running app works. But there is **no single Drizzle schema that can recreate this DB**. Running `drizzle-kit push`/`generate` would pick one variant and produce a broken/incomplete schema.

Physically merging the two universes into one source of truth is a large, supervised refactor (migrate ~95 repos off the incompatible-PK stubs). It is tracked in `docs/schema-dedup-20agent-plan.md` and is **out of scope for automated runs**.

## Provisioning a new environment (correct procedure)
```bash
# 1. On a known-good environment, snapshot schema (and seed data if needed):
bash scripts/backup-db.sh schema   # -> backups/schema-<ts>.sql
bash scripts/backup-db.sh full     # -> backups/full-<ts>.sql  (schema + data)

# 2. On the new environment, restore that snapshot:
psql "$DATABASE_URL" -f backups/schema-<ts>.sql

# 3. Apply any pending hand-written migrations (apps/api/src/shared/db/migrations/*.sql)
#    in numeric/lexical order. These are ADD-ONLY drift fixes.
```

## Drizzle's role here
- Drizzle is used as a **typed query builder** against the existing DB, and `lib/db` is kept as an accurate **superset mirror** of the live DB (Wave-1 convergence, 2026-05-27).
- Drizzle migrations (`drizzle-kit generate`) may be used to **author** new ADD-ONLY changes, but the generated SQL must be reviewed and applied as a hand-written migration — never auto-`push`ed.

## Guard
`scripts/reviewer-schema-dup.mjs` ratchets the duplicate-table count (baseline: 193 duplicated tables as of 2026-05-27). It FAILS CI if a NEW table becomes duplicated, preventing the divergence from growing while the merge is pending.
