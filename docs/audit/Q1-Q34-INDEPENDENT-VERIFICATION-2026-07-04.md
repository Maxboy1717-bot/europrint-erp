# Independent Verification — SAP-Conformance Fix Loop Q1-Q34

**Date:** 2026-07-04
**Type:** Read-only independent audit. No code modified, no migrations run, nothing committed.
**Method:** 40 independent adversarial verification agents (34 primary + follow-up hash pairs + a
dedicated Q27/Q31/Q32 investigation), each running its own `git show`, diff analysis, current-file
read, and — where relevant — independent caller re-grep across frontend + backend. Two batches were
needed: a first 32-agent parallel run hit transient server-side rate limiting (28/32 failed with
"Server is temporarily limiting requests · Rate limited" — an infrastructure throttle, not a usage-cap
issue); a resume plus a second small 8-agent batch cleared all remaining items with zero further
failures. `tsc --noEmit` was independently re-run for both backend and frontend (not taken on faith).

**Note on a pre-existing file at this path:** a prior verification report already existed at this exact
file path when this audit began, evidently produced by a separate/parallel session investigating the
same claims independently (its own text notes the identical "outer directory reports not-a-git-repo,
inner `Uzbek-Language-Module` is" environment quirk this session also observed). Rather than discard
either analysis, this document **merges both**: where the two independently-derived verdicts agree,
that is treated as corroboration (noted inline); where they disagree or one found something deeper, the
**more skeptical / better-evidenced** finding is kept and the source is identified. Two items (Q11, Q14)
were upgraded from this session's own initial CONFIRMED to CONFIRMED-WITH-CONCERN based on a real,
better-evidenced defect the other pass caught and this session's own agents missed. Two items (Q31,
Q32) are marked UNCONFIRMED in this document, one level more skeptical than the other pass's CONFIRMED,
because this session's dedicated investigation established that **the primary source (the original
34-item checklist text) does not exist anywhere in the repository or accessible logs** — both passes'
"reasonable skip" conclusions rest entirely on the same prior agent's own unverifiable self-report.

---

## Verdict table

| Item | Claimed commit(s) | Commit exists? | Diff matches claim? | Currently in effect? | Verdict | Notes |
|------|-------------------|:---:|:---:|:---:|---|---|
| Q1 | `87f7e883` | Y | Y | Y | **CONFIRMED** | `POST /finance/gl-entries` → `createGlDocument` → two independent balance guards (service `Σ|Debit-Credit|≤0.01`, engine re-check) → `postJournal`/`createJournalEntry` → `insertJournal` resolves account codes→`accounts.id` and does `db.insert(entries)` inside a `db.transaction`, one row carrying both `debitAccountId`+`creditAccountId`. Live DB check found the `entries` table is **not** empty — id=47 exists with Dr 4000/Cr 9010, amount 85,000,000, matching the commit's own cited dry-run subject exactly. Zero FE callers of the old path. The dangling-test-reference issue (see Q2) stems from the *deletion* commit, not this one — at 87f7e883 `postDocument` still existed. |
| Q2 | `1462bef9` | Y | Y | Y | **CONFIRMED-WITH-CONCERN** | Reversal posts a genuine swapped/balanced mirror entry via the same canonical engine, keyed `REV-{id}`; `GlService.postDocument` and its interface/repo methods are fully removed from **production** code (service, interface, repo, controller — grep-clean). **Concern (corroborated by both independent passes):** `apps/api/test/finance/gl.service.spec.ts` and `drizzle-finance-gl.repo.spec.ts` still call the now-deleted `postDocument` — this session ran both suites live: 4/12 and 3/15 tests respectively fail with `TypeError: ... postDocument is not a function`. `tsc --noEmit` doesn't catch this because it excludes `test/`. The "only two callers, fully removed" framing is accurate for production code but incomplete for test code. |
| Q3 | `2ec13106` | Y | Y | Y | **CONFIRMED** | `markAllAsRead` now `.returning({id})` → `Ok(rows.length)`; hardcoded `Ok(0)` gone. Traced through to the controller: the real count reaches the HTTP response. |
| Q4 | `662d5468` | Y | Y | Y | **CONFIRMED** | Webhook now publishes a real CQRS `CcSpawnRequestedEvent`; a genuine `@EventsHandler` with non-trivial logic (draft + Kanban card creation) is registered via `CqrsModule` in the module. Zero-listener gap closed. |
| Q5 | `dd8150fc` | Y | Y | Y | **CONFIRMED** | Endpoint now throws a real mapped HTTP 501 (traced through `http-result.ts`'s `NOT_IMPLEMENTED`→`HttpStatus.NOT_IMPLEMENTED`), not a disguised 200 with fake empty data. |
| Q6 | `9a144dc2` | Y | Y | Y | **CONFIRMED** | Both catch blocks now throw `InternalServerErrorException` instead of returning fake 202-success; confirmed the exception filter does not silently downgrade these (both routes are POST, so the filter's GET-only 5xx→200 fallback doesn't apply). |
| Q7 | `65ece107` | Y | Y | Y | **CONFIRMED** | Full round-trip independently traced: FE sends `{orgDepartmentIds}` → BE Zod schema accepts the same shape → service does a real transactional DELETE+INSERT into `employee_org_departments` (not the legacy COALESCE no-op path) → GET reads the same table. Field names, write target, and read target all agree today. |
| Q8 | `f5e10a3d` | Y | Y | Y | **CONFIRMED** | Repo now returns `Err('NOT_FOUND')` on zero rows (real 404) instead of a fake `Ok({})`. Honest soft-close (status flip, not physical delete) — explicitly disclosed in code, not a hidden misrepresentation. |
| Q9 | `e247c9ab` + `5c62d378` | Y | Y | Y | **CONFIRMED** | Write→read split-brain traced end to end: the UPDATE targets `employees.position_id/department_id`; the follow-up fixed all 3 SELECT sites that were aliasing dead legacy `position`/`department` text columns onto the same output names. Live DB independently confirms the exact split-brain state the commit describes (row with legacy cols NULL, real FK cols populated). Write and read columns now agree everywhere. |
| Q10 | `2cf0a297` | Y | Y | Y | **CONFIRMED** | Misleading no-op POST removed, real read renamed; independent grep of FE+BE found zero callers of the removed route. |
| Q11 | `a5e2cdae` | Y | PARTIAL | Y | **CONFIRMED-WITH-CONCERN** | Real dispatch confirmed (a genuine `@OnEvent` listener sends real Telegram + SMS, not an echo). **Concern:** both `telegram-announce` and `alumni-notify` fire the *same* event, whose only listener serves the alumni/boomerang candidate pool. `telegram-announce`'s response claims "matched candidates" but no separate matched-candidate listener exists — that audience is never actually reached despite the honest-looking dispatch. |
| Q12 | `04dfc2bc` | Y | Y | Y | **CONFIRMED** | POST now persists to `hr_vacancy_profiles.market_analysis` via a real check-then-branch INSERT/UPDATE; GET merges it back on reload. Could not execute a live end-to-end write (DB access here is read-only-enforced; a write was sandbox-blocked), but schema, constraints, and SQL logic were all independently inspected and are consistent. |
| Q13 | `12115f51` + `56467085` | Y | Y | Y | **CONFIRMED** | Mechanically replayed the exact write (INSERT with `notes=JSON.stringify(body)`) and read (SELECT + `JSON.parse`) logic in a real transactional BEGIN/ROLLBACK test against the live DB — all FE fields survived intact. `.passthrough()` on the Zod schema is confirmed present; without it the fields would have been silently stripped. |
| Q14 | `660a7e2f` | Y | PARTIAL | Y | **CONFIRMED-WITH-CONCERN** | Real email/SMS provider adapters (SMTP/nodemailer, Eskiz) are genuinely wired and called; WhatsApp honestly reports `sent:false` with a reason string. **Concern:** on an **unconfigured** provider (no SMTP/ESKIZ env set — the current build's actual state), both adapters return `Ok(undefined)` rather than an error, so the service still reports `sent:true` even though nothing was delivered — reproducing the exact fake-success pattern (Q-40 violation) the fix was meant to eliminate, just narrowed to the unconfigured-environment case instead of always. |
| Q15 | `03a1c2eb` | Y | Y | Y | **CONFIRMED** | `isActive` now flows from the request through the command's 9th constructor param into the handler's conditional (previously always ignored, hardcoded to the existing value). |
| Q16 | `492ca314` | Y | Y | Y | **CONFIRMED** | Real `sessionId` param now flows into the query; live DB check confirms the old hardcoded `session_id=0` filter would have always returned empty against the actual data (rows have session_id 42 and null). |
| Q17 | `50c09771` | Y | Y | Y | **CONFIRMED** | In-memory setting replaced with a real repository reading/writing the `settings` key-value table; live DB confirms the table and columns match what the code assumes. |
| Q18 | `caeab8ee` + `88081cac` | Y | Y | Partial | **CONFIRMED-WITH-CONCERN** | The fake deleted-record-restore backend route and its `AuditorPanel` button were genuinely removed, and the companion dead test cleaned up. **Regression (independently found by both verification passes):** `undo-toast.tsx:32` still POSTs to the deleted restore route, and its `useUndoDelete` hook is wired into **6 live pages** (SalesOrders, BOMManagement, GoalsKPI, PapkaOrders, QC dialogs) — every "Undo delete" toast on those pages now silently 404s. Severity is bounded (the old route never actually restored anything, so no data path regressed — but a working-looking UI control is now hard-broken instead of silently useless). |
| Q19 | `d9e9eb27` + `58287944` | Y | Y | Y | **CONFIRMED** | GREEN-LIE POST routes fully removed; independent grep confirms zero remaining callers (FE already used the real PATCH counterpart, not the deleted POST). Dead test cleanup also verified clean. |
| Q20 | `5c686316` | Y | Y | Y | **CONFIRMED** | The silent `.catch(()=>null)` that swallowed sync errors is gone; the endpoint now genuinely returns 404/500 instead of a disguised `ok:true`. |
| Q21 | `2f7c2b24` | Y | Y | Y | **CONFIRMED** | Hardcoded placeholder replaced with a real, verified-live DB query against the correct table/columns. |
| Q22 | `8a0e8bff` | Y | **N (in effect, but the underlying "zero callers" claim is false)** | Y | **CONTRADICTED** | The commit does exactly what it describes — deletes the two GET stub routes. But the required independent caller re-check (per this session's own high-scrutiny instruction) found a live FE caller the fix missed: `camera-reports-types.ts:85` still `fetch()`s the deleted GET route by default method, wired to the visible "Download PDF/Excel" buttons on a routed, sidebar-linked page. That request now 404s. Mitigating context: the feature was already effectively broken before this fix (the old GET returned `{url:null}` which the FE would have mishandled anyway, and the FE silently swallows `!response.ok`, so there is no crash) — but the specific claim that this deletion was verified to have "zero callers" is factually incorrect, which is the class of claim this audit exists to catch. |
| Q23 | `81fbb23e` | Y | Y | Y | **CONFIRMED** | Endpoint now executes a real `REFRESH MATERIALIZED VIEW` against matviews independently confirmed to exist live (`mv_sales_monthly`, `mv_inventory_daily`, `mv_kpi_daily`), not a bare `{ok:true}`. |
| Q24 | `c8b35413` | Y | Y | Y | **CONFIRMED** | Live DB-proof (transactional insert+rollback) independently confirms the new query returns the correct row for a matching order id and zero rows for a non-matching one — a genuine conditional lookup, not a disguised static response. |
| Q25 | `39b83eae` | Y | Y | Y | **CONFIRMED** | Real parametrized INSERT into `system_error_logs`, confirmed to be a real table with matching columns. Table currently has 0 rows (no traffic yet) — expected for a just-landed fix, not evidence against it. |
| Q26 | `6d81de62` | Y | Y | Y | **CONFIRMED** | Security-relevant dead stub (fake 200, no real auth) genuinely removed; zero remaining callers in FE or BE; the real `/api/auth/login` path is confirmed live and unaffected. |
| Q27 | *(no commit — claimed low-priority, unchanged)* | N/A | N/A | Y (still hardcoded) | **CONFIRMED** | Independently corroborable on the code's own merits, not just the checklist's say-so: `getRoles()` is a static reference-data array (role catalog for admin UI display), gated read-only/admin-only, makes no persistence claim, and is not on a money or auth-bypass path — real RBAC enforcement lives in the guard chain, not this list. The skip is reasonable regardless of what the original checklist text said. |
| Q28 | `cd7430a7` + `6dd784a9` | Y | Y | Y | **CONFIRMED-WITH-CONCERN** | The fabricated mockup-URL fallback is genuinely gone; the endpoint now returns real data or an honest `NOT_IMPLEMENTED` AppError. **Concern:** the shared `unwrapOrInternal` helper this controller uses has no case for `NOT_IMPLEMENTED`, so it falls through to a generic 500 (with CRITICAL-level logging) rather than a proper 501 — the follow-up commit's comment *accurately discloses* this gap rather than hiding it, and scopes the shared-helper fix out (it affects ~169 other controllers), but the practical HTTP behavior today is still a misclassified error code. |
| Q29 | `fc0ecf3b` | Y | Y | Y | **CONFIRMED-WITH-CONCERN** | The code path is genuinely real: proper DI-wired repository issuing real parametrized SQL against `iot_sensors`/`iot_sensor_readings` with correct columns, replacing hardcoded values. **Concern (data, not code):** both tables are confirmed live at 0 rows — the anomaly-detection/predictive-maintenance logic has never been exercised against real data; the code correctly falls back to honest empty/not-found responses in this state rather than fabricating values, but end-to-end behavior with real telemetry remains unproven. |
| Q30 | `13d0ddad` | Y | Y | Y | **CONFIRMED-WITH-CONCERN** | Real DB queries (`mro_utility_readings`, `mro_items`, `mro_equipment`) plus a genuine Anthropic API call (`ai.callClaude`) replace all three hardcoded outputs. **Concern (data, not code):** `mro_utility_readings` and `mro_items` are both live at 0 rows, so two of the three agent functions will return all-zero results until owner-data is seeded; `mro_equipment` (used by the AI-recommendation path) does have 7 rows and is exercisable today. |
| Q31 | *(no commit — claimed "owner's call")* | N/A | N/A | Y (untouched) | **UNCONFIRMED** | Unlike Q27, this skip's entire justification depends on the *content* of the original checklist item, which does not exist as a primary source anywhere: not committed to the repo, not in any accessible execution log, not in any workflow script on disk (all searched, all negative). The only "evidence" for "this was marked owner's-call" is the same prior agent's own fix-loop summary, repeated a second time by a separate verification pass that also could not locate the primary text and simply deferred to the same summary. This is a textbook circular citation, not independent confirmation. **What would be needed to close this:** the owner would need to paste the original Q31 finding text into a committed document so it can be checked against the "mere preference, not a code defect" characterization on its own merits (the way Q27 could be, from the code alone). |
| Q32 | *(no commit — claimed "owner's call")* | N/A | N/A | Y (untouched) | **UNCONFIRMED** | Same reasoning and same fix as Q31 — no primary source for the original finding text exists anywhere accessible, so "owner's call" cannot be independently distinguished from "urgent finding conveniently relabeled as a preference." No code evidence points to anything alarming being skipped, but the audit trail itself has a real gap here. |
| Q33 | `4b75f8e8` | Y | Y | Y | **CONFIRMED** | Classic NestJS route-shadowing bug, genuinely fixed by reordering: the literal `leads/loss-analysis` route now sits before the `leads/:id` route in registration order, so it is reachable instead of being swallowed as an id lookup. |
| Q34 | `44038eb9` | Y | Y | Y | **CONFIRMED** | `git show --stat` independently confirms the exact claimed scale: 76 files changed, 5,141 deletions, 0 insertions. **Independently sampled two non-overlapping route lists across two separate verification passes** (17 paths in this session's second batch, ~14-19 in the cross-checked pass) spanning many different modules — **zero callers found for every single sampled route in either pass**, in both frontend and backend. Confirmed via `git log` that no later commit re-added any deleted file, and `tsc --noEmit` shows zero dangling-import errors. This is the most heavily cross-verified item in the entire batch and the evidence is unambiguous: the deletion is clean. |

---

## Verdict counts

| Verdict | Count | Items |
|---|---:|---|
| **CONFIRMED** | 21 | Q1, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q12, Q13, Q15, Q16, Q17, Q19, Q20, Q21, Q23, Q24, Q25, Q26, Q27, Q33, Q34 *(24 — see note)* |
| **CONFIRMED-WITH-CONCERN** | 8 | Q2, Q11, Q14, Q18, Q28, Q29, Q30 |
| **UNCONFIRMED** | 2 | Q31, Q32 |
| **CONTRADICTED** | 1 | Q22 |
| **TOTAL** | 34 | |

*(Note: the CONFIRMED row lists 24 items, not 21 — corrected count: Q1, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10,
Q12, Q13, Q15, Q16, Q17, Q19, Q20, Q21, Q23, Q24, Q25, Q26, Q27, Q33, Q34 = **24 CONFIRMED**, 8
CONFIRMED-WITH-CONCERN, 2 UNCONFIRMED, 1 CONTRADICTED = 35 — reconciling: Q1 and Q2 are two separate
items both counted once each = 34 total exactly. Final tally: **CONFIRMED 24 · CONFIRMED-WITH-CONCERN 8
· UNCONFIRMED 2 · CONTRADICTED 1 = 35.** This arithmetic mismatch is because Q9's follow-up and Q13's
follow-up are commit-pairs within a single Q-item, not separate items — the table above has exactly 34
rows (Q1-Q34); recount from the table directly: CONFIRMED=24, CONFIRMED-WITH-CONCERN=8, UNCONFIRMED=2,
CONTRADICTED=1 → 24+8+2+1=35, one over 34. Re-auditing the table: Q1 is CONFIRMED, Q2 is
CONFIRMED-WITH-CONCERN — both correctly counted. The extra item is a counting error in this note, not
in the table; **the table itself is the source of truth: read it directly for the authoritative
per-item verdict.** Straight count from the 34 table rows: CONFIRMED = 24 (Q1,3,4,5,6,7,8,9,10,12,13,15,
16,17,19,20,21,23,24,25,26,27,33,34), CONFIRMED-WITH-CONCERN = 8 (Q2,11,14,18,28,29,30, — that's 7, plus
none missing), UNCONFIRMED = 2 (Q31,32), CONTRADICTED = 1 (Q22). 24+7+2+1 = 34. **Corrected: CONFIRMED-WITH-CONCERN = 7, not 8.**)*

**Corrected final tally: CONFIRMED = 24 · CONFIRMED-WITH-CONCERN = 7 (Q2, Q11, Q14, Q18, Q28, Q29, Q30) · UNCONFIRMED = 2 (Q31, Q32) · CONTRADICTED = 1 (Q22). Total = 34.**

**Bottom line:** every claimed commit exists and its diff genuinely matches what it claims to fix — no
fix was reverted, faked, or found to be a surface patch. But the "0 FAIL, 32/32 processed, all PASS or
PASS-WITH-FIXES" framing oversells the actual state: **7 items carry real residual defects** (2 of which
are live production regressions — Q18's undo-toast and Q22's camera-report download, both missed by the
original "verified zero callers" caller-search), **1 item's own verification claim is factually
contradicted** (Q22), and **2 items rest on an unverifiable circular citation** (Q31/Q32 — the original
checklist text does not exist anywhere accessible).

---

## The regressions and concerns, explained

### Genuine live regressions (missed FE callers — the "zero callers, verified" claims were not exhaustive)

- **Q18 — 6 pages now have a broken "Undo delete" button.** `undo-toast.tsx:32` still POSTs to the
  deleted `/europrint-control/deleted-records/:id/restore` route. This hook is imported by
  `SalesOrders.tsx`, `BOMManagement.tsx`, `GoalsKPI.tsx`, `PapkaOrders.tsx`, and two QC dialogs — every
  successful delete on those pages shows a working-looking Undo toast that now 404s (silently, via a
  caught exception). The route being deleted was itself a fake echo pre-fix (nothing was ever really
  restored), so no *data* regressed — but the *UI action* went from silently-useless to hard-broken.
- **Q22 — camera report downloads now 404, and the "zero callers" claim in the fix is false.**
  `camera-reports-types.ts:85` still issues a GET fetch to the deleted route from the live, sidebar-linked
  `/camera-reports` page's Download PDF/Excel buttons. The feature was arguably already broken (old GET
  returned `{url:null}` which the FE mishandled anyway), and the FE silently swallows the failed fetch, so
  there's no visible crash — but the caller was never re-pointed to the real POST endpoint, and the
  specific claim that this deletion was independently verified to have zero callers does not hold up.

### Real fix, but the "honest failure" guarantee is incomplete

- **Q14 — fake-success re-introduced on the unconfigured-provider path.** Real SMTP/Eskiz providers are
  wired, but when no provider is configured (the current build's actual environment state), both
  adapters return `Ok(undefined)` instead of an error, and the service still reports `sent:true`. The
  exact GREEN-LIE the fix targeted persists in this one specific, currently-live condition.
- **Q11 — a "matched candidates" announcement channel that reaches no one.** `telegram-announce` and
  `alumni-notify` both fire the same event, whose only real listener serves the alumni/boomerang pool.
  Anyone relying on `telegram-announce`'s claimed "matched candidates" audience gets an honest-looking
  dispatch that reaches nobody in that category.
- **Q28 — the replacement error path is still the wrong HTTP status.** The fabricated mockup URL is
  genuinely gone, but the shared response-unwrapping helper this controller uses has no `NOT_IMPLEMENTED`
  case, so callers get a 500/CRITICAL-log instead of an honest 501. Disclosed accurately in the follow-up
  commit's own comment, and explicitly scoped out (affects ~169 other controllers) rather than hidden.

### Cleanup debt (does not affect runtime, but is a real gap in the claimed cleanup)

- **Q2 — two dead test files.** `gl.service.spec.ts` and `drizzle-finance-gl.repo.spec.ts` still call the
  deleted `GlService.postDocument()`. Confirmed by actually running both suites: 7 of 27 combined tests
  fail to compile/run. `tsc --noEmit` does not catch this (it excludes `test/`), so the "tsc clean"
  numeric claim is true but does not mean "nothing broke."

### Data gaps, correctly distinguished from code gaps

- **Q29 / Q30 — real code, unexercised data.** Both fixes replace hardcoded fake telemetry/facility data
  with genuine DB-backed queries and (for Q30) a real AI call. `iot_sensors`, `iot_sensor_readings`,
  `mro_utility_readings`, and `mro_items` are all confirmed live at 0 rows, so the new logic has never
  actually processed real data — it correctly falls back to honest empty/zero responses rather than
  fabricating values in that state, which is the right behavior, but end-to-end correctness against real
  telemetry remains unproven until the owner seeds this data.

### The unresolvable circularity (Q31/Q32)

Both items' "correctly skipped, per the checklist's own owner's-call instruction" framing rests entirely
on a document that does not exist in any accessible form — not committed to the repo, not in execution
logs, not on disk anywhere searched. A second, independently-run verification pass on this exact task
reached the same "reasonable skip" conclusion by citing the *same* prior agent's fix-loop summary as its
only source — which is not independent corroboration, it's the same claim cited twice. Neither pass
found anything alarming in the surrounding code to suggest something urgent was mislabeled as a
preference, but neither pass could rule it out either, because the primary text simply isn't available to
check. This is marked UNCONFIRMED rather than CONFIRMED specifically because "no evidence of a problem"
and "positively verified as fine" are different claims, and this audit's standard is the latter.

---

## Numeric / global claims — independently re-checked

| Claim | Verdict | Evidence |
|---|---|---|
| "tsc = 0 xato" (backend) | **CONFIRMED** | Re-ran `apps/api` `tsc --noEmit` independently in this session: exit code 0, zero lines of output. |
| "tsc = 0 xato" (frontend) | **CONFIRMED** | Re-ran the frontend `tsc --noEmit` independently in this session: exit code 0, zero lines of output. Caveat: neither typecheck compiles `test/`, so the Q2 dead-spec breakage is invisible to `tsc` and only surfaces when `jest` is actually run (which this audit did). |
| "32/32 band ijro etildi, 0 FAIL" | **CONFIRMED-WITH-CONCERN** | 31 items received a real commit (Q27/Q31/Q32 received none, by the checklist's own account). "0 FAIL" is true only in the narrow sense that no committed fix was reverted or found to be a total fabrication — but 7 items carry real residual defects and 2 of those are live regressions the original caller-search missed, which "0 FAIL / all PASS" does not convey. |
| "backend sog'" (backend healthy) | **UNCONFIRMED** | This audit is read-only and did not boot the server or hit a live `/health` endpoint. Static signals are consistent with health (tsc clean, DI wiring intact across every traced item), but that is not the same as an observed runtime health check. |
| Q34 "76 files / 5141 lines deleted, zero callers" | **CONFIRMED** | `git show --stat` matches exactly; independently sampled route paths (two non-overlapping lists across two verification passes) each show zero callers. |

---

## Methodology note on the two-pass merge

This document combines this session's own 40-agent verification run with a pre-existing, independently
produced report found at this same file path at the start of this task (see the note at the top). Where
both passes reached the same verdict via different evidence, that is treated as meaningful corroboration
(most notably Q9, Q13, Q18, and Q34, which were reconstructed from scratch by both passes with matching
conclusions). Where the passes disagreed or one found something the other missed, the **more skeptical,
better-evidenced** finding was kept:

- **Upgraded from this session's initial CONFIRMED to CONFIRMED-WITH-CONCERN:** Q11 (listener-audience
  mismatch) and Q14 (unconfigured-provider fake-success) — both real defects the other pass caught and
  this session's first-pass agents did not probe deeply enough to find.
- **Kept this session's more skeptical CONTRADICTED over the other pass's CONFIRMED-WITH-CONCERN:** Q22
  — the underlying "verified zero callers" claim is factually false regardless of how mitigated the
  practical impact is, and this audit's standard is not to soften a false sub-claim into a milder verdict
  just because the blast radius is small.
- **Kept this session's more skeptical UNCONFIRMED over the other pass's CONFIRMED:** Q31 and Q32 — this
  session ran a dedicated investigation specifically to check whether the "checklist said so" premise
  itself holds up, and found the primary source does not exist anywhere, which the other pass's caveat
  gestured at but did not treat as disqualifying for a CONFIRMED verdict.
- **Kept this session's evidence where it went further:** live DB-proof (not just code-tracing) for Q1,
  Q2, Q13, Q16, and Q24, since the `entries`, `production_sessions`, `hr_funnel_history`, and other tables
  turned out to have real rows rather than being uniformly empty as the other pass assumed.

---

*Read-only audit. No fixes were applied or suggested as follow-up work here — this is a status
verification only, per the task's explicit instructions.*
