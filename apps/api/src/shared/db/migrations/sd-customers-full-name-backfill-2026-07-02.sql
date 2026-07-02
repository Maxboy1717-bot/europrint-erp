-- APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
-- sd_customers.full_name (deprecated duplicate of `name`) — one-time additive backfill.
--
-- Context: two independent Drizzle pgTable('sd_customers', ...) declarations existed for the
-- SAME physical table — one keyed on `full_name` (apps/api/src/shared/db/schema-business-b-2.ts,
-- used by queries-sd.ts), one keyed on `name` (lib/db sd-europrint-schema.ts `sdCustomers`, used by
-- drizzle-marketing-ext.repo.ts + ~20 raw-SQL SD/CRM/Director repositories). DB-proof: `name` is
-- populated on 15/15 live rows; `full_name` was always NULL (never written anywhere). The two
-- Drizzle declarations were merged into the single canonical `sdCustomers` (name = canonical,
-- full_name = deprecated/read-only compat column, see fullName doc-comment in
-- lib/db/src/schema/sd-europrint-schema.ts).
--
-- This migration backfills full_name = name for existing rows only (idempotent, only touches
-- NULL full_name; never overwrites a non-NULL value; no writer sets full_name going forward, so
-- this is a one-time sync, not an ongoing dual-write). FAQAT ADDITIV — DROP/ALTER TYPE yo'q.

UPDATE sd_customers
   SET full_name = name
 WHERE full_name IS NULL
   AND name IS NOT NULL;
