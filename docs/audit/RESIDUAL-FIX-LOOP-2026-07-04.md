# EuroPrint ERP — Full Residual Fix Loop: Governance-Audit + Q1-Q34 Verification (sequential, plan-first)

> Status: IN PROGRESS (started 2026-07-05). G1 ✅ DONE — commit `d77062b1` (mini-app
> approve/reject gated via new `canManageRequest` admin/department-manager check; test
> `test/pos/mini-app-approval-gate.spec.ts` + full `test/pos/` suite 99/99 pass; also fixed
> a pre-existing `jest.config.js` gap, missing general `@shared/(.*)` moduleNameMapper fallback).
> G2 ✅ DONE — commit `f136f39f` (`HrLeaveRepo.save360Feedback` catch block now returns
> `Err(...)` like every sibling method, instead of a fake `{ok:true, data:{id:null}}`;
> zero caller changes needed, `Record360FeedbackHandler`/`MesTo360Listener` were already
> built correctly for this case; new test `test/hr/save-360-feedback.repo.spec.ts`; confirmed
> pre-existing unrelated failures in `create-employee.handler.spec.ts` are NOT a regression,
> via git-stash A/B against the pre-fix baseline).
> R1 ✅ DONE — commit `91c60c91` (removed dead `undo-toast.tsx`, calls the fake restore
> route Q18 deleted; no soft-delete pattern exists for a real restore, so the fake Undo
> capability was removed entirely from all 5 real call sites, not half-fixed; delete
> mutations + confirm dialogs untouched; BE+FE tsc 0 errors).
> Owner directive 2026-07-05: continue R1→R6→G3→R7→R8→G4 autonomously, no per-item
> confirmation — dry-run-then-report (not dry-run-then-ask) for schema/GL/backfill items.
> R2 ✅ DONE — commit `dd4db385` (camera-reports download re-pointed to the real POST
> generate-pdf/generate-excel endpoints with {date_from,date_to} body; backend returns
> JSON aggregate rows not a binary, so the file is now built client-side via the
> codebase's existing exportToPDF/exportToExcel helpers; BE+FE tsc 0 errors).
> Next: R3.
>
> Execution model is deliberately
> DIFFERENT from the Phase-1/Phase-2 VISION-3340 loops (docs/audit/COMPLETION-LOG-2026-07.md),
> which run continuously with no per-item stop. This queue is sequential and plan-first:
> one item at a time, PLAN → owner confirmation → EXECUTE → verify → commit → Uzbek report → STOP,
> repeated per item. Never combine two items into one commit.
>
> Source: merges the sharpest findings from the 16-principle Extended Governance Check with the
> confirmed residual defects from the two independent verification passes of the Q1-Q34
> SAP-Conformance fix loop (docs/audit/MASTER-REJA-VIZYON-2026-07-02.md §8.9). Several items here
> (R1-R3) are regressions caused BY that loop's own route/method deletions (Q18, Q2) — confirmed
> live, not hypothetical.

ROLE: Fix agent. Process items below IN ORDER, one at a time. PLAN step first
(no edits), wait for confirmation, then EXECUTE, verify, commit, report in
Uzbek, STOP. Never combine two items into one commit. This queue merges two
sources: the sharpest findings from the 16-principle Extended Governance
Check, and the confirmed residual defects from the two independent
verification passes of the Q1-Q34 SAP-fix loop. Security and silent-failure
items go first — they outrank UI regressions in severity.

---

## G1 — mini-app.controller.ts: manager-only approve/reject is @Public() with zero role check (SECURITY, fix first)

Any authenticated Telegram mini-app session can currently approve/reject
material requests — an endpoint designed to be manager-only has no role
guard at all.

### PLAN
```
Plan how to add the correct role guard (matching the pattern used by other manager-only endpoints in this codebase, e.g. RolesGuard/PermissionGuard) to the approve and reject endpoints in mini-app.controller.ts. Identify the exact role(s) that should be allowed, and confirm this won't break the existing mini-app flow for legitimate managers. Do not edit anything yet.
```

### EXECUTE (after confirmation)
```
Implement the plan, add a test proving a non-manager session is rejected and a manager session still succeeds, run it, show me the diff before committing.
```

---

## G2 — save360Feedback silently reports success on DB-write failure (sits on the MES→HR golden-thread event chain)

This is a GREEN-LIE inside the monitored golden-thread path — a DB failure
here is currently invisible to everyone.

### PLAN
```
Plan how to fix save360Feedback so a database write failure surfaces as a real error (not swallowed into a fake-success response), matching the error-handling pattern used elsewhere in this event chain. Trace exactly where in the MES→HR event flow this function sits, so we understand the blast radius of a fix here. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, add a test that proves a DB-write failure now surfaces correctly instead of reporting success, run it, show me the diff before committing.
```

---

## R1 — undo-toast.tsx calls deleted restore route (LIVE REGRESSION)

`undo-toast.tsx:32` still POSTs to the restore route deleted in Q18. This
breaks the "Undo delete" button on 6 live pages (SalesOrders, BOMManagement,
GoalsKPI, PapkaOrders, QC dialogs).

### PLAN
```
Plan how to fix undo-toast.tsx so it no longer calls the deleted /europrint-control/deleted-records/:id/restore route. Since that route was itself a fake echo before deletion (it never actually restored anything), decide whether to: (a) implement a real restore endpoint and wire this component to it, or (b) remove the "Undo" capability from useUndoDelete and its 6 call sites honestly, since it was never functional. List every file you'd touch for each option and recommend one. Do not edit anything yet.
```

### EXECUTE
```
Implement the chosen option. Verify all 6 pages that use useUndoDelete no longer reference the deleted route, run tests, show me the diff before committing.
```

---

## R2 — camera-reports-types.ts calls deleted GET route (LIVE REGRESSION)

`camera-reports-types.ts:85` still fetches the deleted GET
`/camera-reports/generate-pdf`/`generate-excel` routes. The real POST
endpoints use a different contract (`{date_from,date_to}` body vs `?period=`
query).

### PLAN
```
Plan how to re-point camera-reports-types.ts to call the real POST generate-pdf/generate-excel endpoints with their correct request contract (date_from/date_to body, not a period query param). Show the current and target request shape side by side. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, confirm the download feature actually produces a real file end to end (not just a 200 response), run tests, show me the diff before committing.
```

---

## R3 — Q2 dead test files reference deleted postDocument method

`apps/api/test/finance/gl.service.spec.ts` and
`drizzle-finance-gl.repo.spec.ts` still call the removed `postDocument`
method (4/12 and 3/15 tests failing).

### PLAN
```
Plan how to update these two test files to test the NEW real reversal path (reverseEntry / postJournal with REV-{id} reference) instead of the deleted postDocument method. Do not just delete the failing tests — replace them with tests that cover the actual current behavior. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, run both test suites, confirm 0 failures, show me the diff before committing.
```

---

## R4 — Q14: unconfigured email/SMS provider still reports sent:true

When SMTP/ESKIZ env vars are unset, both adapters return `Ok(undefined)`
instead of an error, so the service reports `sent:true` despite nothing being
delivered — the exact fake-success pattern the original fix was meant to
eliminate, just narrowed to the unconfigured case.

### PLAN
```
Plan how to make the SMTP and Eskiz adapters return an explicit Err (not Ok(undefined)) when required configuration is missing, so the calling service correctly reports sent:false in that case too. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, add a test that proves sent:false is returned when the provider is unconfigured, run it, show me the diff before committing.
```

---

## R5 — Q11: telegram-announce and alumni-notify fire the same event, reaching only alumni

Both endpoints emit `vacancy.published`, but the only listener serves the
alumni/boomerang pool. `telegram-announce` claims to reach "matched
candidates" but no such listener exists.

### PLAN
```
Plan how to give telegram-announce its own distinct event (e.g. vacancy.telegram-announce-requested) with a real listener that reaches the matched-candidate audience the endpoint's response claims to reach, separate from the alumni-notify path. Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, verify each endpoint now reaches its own claimed audience, run tests, show me the diff before committing.
```

---

## R6 — Q28: NOT_IMPLEMENTED falls through to a generic 500 instead of 501

The shared `unwrapOrInternal` helper has no case for `NOT_IMPLEMENTED`, so
this controller's honest "not implemented" response gets logged as a
CRITICAL 500 instead of a proper 501.

### PLAN
```
Plan how to add a NOT_IMPLEMENTED case to unwrapOrInternal that returns a proper 501 without CRITICAL-level logging. Note: this helper is shared by ~169 other controllers — plan how to verify this change doesn't alter behavior for any of them (a NOT_IMPLEMENTED case that didn't exist before should be additive, not behavior-changing for existing error types). Do not edit anything yet.
```

### EXECUTE
```
Implement the plan, run the full test suite (not just this controller's tests, since the helper is shared), show me the diff before committing.
```

---

## G3 — A6: missing FK indexes on the new org-card columns (performance/data-integrity)

Foreign-key columns on the recently-added org-card tables have no index,
which will degrade as data grows and slows every JOIN that touches them.

### PLAN
```
Plan how to add indexes to the FK columns on the org-card tables identified in the Extended Governance Check (A6). List the exact table.column pairs and the migration you'd write. Do not run anything yet.
```

### EXECUTE
```
Apply the migration, confirm the indexes exist via a schema query, run existing tests to confirm nothing regresses, show me the diff before committing.
```

---

## R7 — Q29/Q30: code is correct, but tables are empty (not a code fix)

`iot_sensors`/`iot_sensor_readings` and `mro_utility_readings`/`mro_items`
are live at 0 rows. The code correctly returns honest empty results, but the
feature is unproven end-to-end.

### ACTION (not PLAN/EXECUTE — this is data, not code)
```
Do not write any code for this item. Instead, list the exact tables and minimum row counts needed to exercise these features end-to-end (which sensors, which utility meters, which MRO items), so I can provide seed data or confirm this is expected to stay empty until real hardware/ops data arrives. Output the list only — no code changes.
```

---

## R8 — Q31/Q32: unresolved circularity, requires a decision first

The independent verification flagged these as UNCONFIRMED due to a
"circularity" — re-read the exact language both verification passes used for
Q31/Q32 before doing anything.

### ACTION (decision needed before any code work)
```
Quote the exact original checklist language for Q31 and Q32 (what they said "owner's call" / "do not touch unless requested" actually referred to), and the exact circularity concern raised by the independent verification. Present this to me in Uzbek so I can decide whether these need code work or remain intentionally untouched. Do not write any code yet.
```

---

## G4 — B11/B12: no duplicate-check on customer/material create; "mandatory" fields nullable at DB level

Two related master-data gaps from the governance audit, grouped since a fix
to one often touches the same create-handlers as the other.

### PLAN
```
Plan how to: (a) add a duplicate-check (name/phone/tax-id match) to the customer and material create-handlers before insert, and (b) add NOT NULL constraints at the schema level for the key fields currently only validated in Zod/frontend (customer_id, amount, status on orders/invoices — confirm the exact list from the governance report). For (b), first check whether any existing rows would violate the new constraint before adding it — if so, list them instead of migrating blindly. Do not edit or migrate anything yet.
```

### EXECUTE
```
Implement the duplicate-check first (lower risk), run tests, commit. Then, in a SEPARATE commit, apply the NOT NULL migration only after confirming no existing rows violate it — if violations exist, report them to me instead of migrating, and treat this sub-item as BLOCKED-OWNER-DATA.
```

---

## Order of execution

G1 → G2 → R1 → R2 → R3 → R4 → R5 → R6 → G3 → R7 (data-only) → R8
(decision-only) → G4. Do not skip ahead. After G2, and again after R6,
produce a short status table confirming everything so far is committed and
tests pass, before continuing.
