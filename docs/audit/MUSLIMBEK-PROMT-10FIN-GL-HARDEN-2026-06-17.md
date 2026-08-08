# DIRECTIVE — #10 FIN GL-unify: small HARDENING pass (atomicity / idempotency / tolerance)

> Advisor (Claude) → Executor (Muslimbek). Owner-approved 2026-06-17 ("Kichik mustahkamlash hozir").
> Context: the GL-unify CORE is DONE + advisor-verified (no live wrong-account bypass remains — payroll & invoice
> now post correct accounts via GlPostingService). This pass closes the 2nd-tier robustness edges found by the
> adversarial verify (workflow wxxg5zl4o) + advisor read: double-post / missing-post windows. These are NOT
> wrong-account bugs — they are idempotency/atomicity/tolerance hardening on the money ledger.

---

## RULES BLOCK
- **Role:** EXECUTOR (🟢). Do EXACTLY the items below; no extra refactors/scope. Correctness rails only.
- **Q-30/Q-45:** No token minting. Secrets never printed. Logs NEVER committed. `git add <exact-file>` only — never `-A`.
- **Q-35 / DDL:** Should need NO DDL. If you think an index/column is required (e.g. a dedup index), STOP and show SQL to owner first (`APPROVED:` comment). Do not run DDL silently. Do NOT touch `gl_journal_entries`/`gl_lines` (SAP #76).
- **Style:** Result<T>, Array.isArray guards, `typedExecute<T>`, files ≤900 / funcs ≤150.
- **Q-40:** Prove each fix with a DB-level rollback test — green ≠ correct.
- **Self-verify is the gate.** Finish → run proofs → report.

---

## ITEMS

### H1 ⭐ — Engine-level idempotency on the business reference (kills double-post for ALL callers)
File: `apps/api/src/modules/finance/domain/services/gl-posting.service.ts` (`createJournalEntry`, ~85) and/or its repo
`drizzle-gl-posting.repo.ts` (`insertJournal`).

**Problem:** every posting method uses a stable business reference (`SI-{invoiceId}`, `PR-{periodId}`, `CP-{paymentId}`,
`GR-{grId}`, `VP-{paymentId}`, `MC-{goodsIssueId}`). But `entry_number = \`${reference}-${Date.now()}-${n}\`` includes
`Date.now()`, so a second call for the SAME business event creates DIFFERENT entry_numbers → no unique collision →
**double-post**. The invoice controller's status-check and payroll's status-check are SEPARATE steps, so a failure
between GL-post and the status flip leaves a re-post window. The `finance-gl.controller` admin endpoints
(`post-sales-invoice`, `post-payroll`) have NO guard at all.

**Fix:** make `createJournalEntry(lines, reference)` idempotent on the reference. BEFORE inserting, check whether an
`entries` row already exists for this business reference — i.e. `entry_number LIKE ${reference || '-%'}` (the stable
prefix, e.g. `SI-123-%`). If one exists → return `Ok(existingEntryId)` WITHOUT inserting again (log it as
"already posted, idempotent"). This makes EVERY posting path idempotent on its business key at the source — so both
invoice controllers, payroll, and the finance-gl admin endpoints are all covered by one change.
- Use a parametrized `typedExecute<T>` SELECT (no `sql.raw`). Match the reference prefix exactly (`${reference}-%`).
- Keep the existing balance validation + decomposition unchanged.
- NOTE: this is a SELECT-before-INSERT (small race window under true concurrency, acceptable for this workload; a
  DB unique index on a stable reference column would be the bulletproof version but that's DDL — only propose it to
  the owner if you think it's needed, don't add silently).

### H2 — Align the payroll balance tolerance to the engine
File: `apps/api/src/modules/hr/payroll/payroll-closure.service.ts` (`buildJournal`, ~137).
**Problem:** `buildJournal` rejects only `diff > 0.5`, but the engine `createJournalEntry` rejects `diff > 0.01`. A
payroll with a 0.01–0.5 rounding imbalance PASSES buildJournal but then FAILS the engine post.
**Fix:** change buildJournal's tolerance from `0.5` to `0.01` (match the engine). Put the tolerance in a named
constant if not already. Now an imbalance is caught at buildJournal — BEFORE the period is marked closed.

### H3 — Payroll: post GL BEFORE marking the period closed
File: `apps/api/src/modules/hr/payroll/payroll.service.ts` (`closePeriod`, ~76–94).
**Problem:** `markPeriodClosed` (line ~79) runs BEFORE `postJournal` (line ~93). If the GL post fails, the period is
already closed (and re-close is blocked by the CONFLICT check) → period closed with NO GL entry, no retry path.
**Fix:** reorder so the GL journal is posted FIRST (after `buildJournal` validates balance), and only mark the
period closed + rows posted AFTER `postJournal` succeeds. If `postJournal` returns Err → return Err and leave the
period OPEN (retryable). Combined with H1 (idempotency), a retry after a partial success is safe (won't double-post).
Keep the PAYROLL_CLOSED event emit after the successful close.

### H4 — (verify, no new code) finance-gl admin endpoints now covered
Files: `apps/api/src/modules/finance/presentation/finance-gl.controller.ts` (`post-sales-invoice` ~59,
`post-payroll` ~74). After H1, these become idempotent automatically (same engine). VERIFY this in your DB-proof
(call the endpoint's service path twice → second returns the same entry id, no second row). No separate code change
expected; if for some reason they bypass the engine reference, fix to use it.

### H5 — Test hygiene (the coverage gap)
File: `apps/api/test/hr-payroll-closure.spec.ts`.
- Remove the stale `insertGlJournalLines: jest.fn()` from the repo mock (method was deleted).
- Add a test for the GL-failure path: `gl.postJournal` returns `Err(...)` → `closePeriod` returns Err AND
  `markPeriodClosed` was NOT called (proves H3 ordering — period stays open on GL failure).
- Add a test that a second `closePeriod`/post with the same reference is idempotent (proves H1) — or cover H1 via a
  gl-posting.service unit test if cleaner.

---

## SELF-VERIFY GATE (run before reporting)
1. `tsc --noEmit` 0; reviewers no new FAIL.
2. **DB-proof (BEGIN/ROLLBACK):**
   - H1: insert a journal for `SI-TEST`, then call the engine again with the same reference → assert the 2nd call
     returns the SAME entry id and NO new `entries` row was created.
   - H3: simulate `postJournal` failure during closePeriod → assert period NOT marked closed (still open).
   - H2: feed buildJournal a 0.2 imbalance → assert it returns Err (caught before close).
3. `node scripts/golden-thread-chain-proof.cjs` → exit 0 (no regression).
4. `hr-payroll-closure.spec` green (with the new tests). Boot: health 200, login 422/401.
5. No DDL ran (or owner-approved + shown). `gl_journal_entries`/`gl_lines` untouched. No logs committed.

## COMMIT + REPORT
- `git add <exact files>` only. Commit: `fix(finance): #10 GL-unify hardening — engine idempotency on reference + payroll GL-before-close + tolerance align`.
- Report: per item H1–H5 done/deferred-with-reason, commit hash, DB-proof outputs, harness exit, login. Then stop —
  advisor re-verifies live; then #10 closes and we move to #11 HR.
