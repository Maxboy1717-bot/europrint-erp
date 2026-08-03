# EuroPrint ERP — What's Actually Left (Master-Status-Board vs Git Reality)

**2026-07-08, read-only investigation.** Every stream's board claim was cross-checked against actual git history (`git show --stat`/diff) and live code/grep — not trusted at its "DONE" label. Verification method: this main agent for VISION-3340 + vision-extraction; 5 parallel read-only sub-agents (workflow `wf_65be2817-8c4`) for the other streams, each confirming the cited commit hashes exist and match, and grep-checking "open"/"partial" items live.

**Headline:** the data-integrity / correctness foundation is essentially closed. What remains is (a) ~15 VISION-3340 feature-gap clusters, (b) a handful of medium/low code-cleanups, and (c) a set of **owner decisions** that block specific feature areas (org-card canonicalization, finance SoD, bilingual-Cyrillic) — not the whole system. **The board itself is stale in several places (it understates completion).**

---

## Master table — every stream, true status

### Stream: VISION-3340 fixable-now (65 items) + 6 schema items
| Item | True status | What's left | Commit |
|---|---|---|---|
| Batch-1 items 1-8,10,11,14,18,19,22,25,27 (16) | DONE-VERIFIED | — | per board batch-1 CLOSED-OUT |
| Batch-2 items 12,13,15,16-17,20,24,26,28,30,33,36,37,39 (14) | DONE-VERIFIED | — | a5282363,a1dbd39d,7916944a,32bd6ccb,53ffb456,976ee28c,6632f1db,a19218e0,acee03f9,f855ca16,d62d0784,0af03e54,b931b326 |
| Round-1: #42,#55,#57,#63,#65 | DONE-VERIFIED | — | 2cc898b6,8bc8fd69,c09cf883,01daa468,c8a6abdb |
| Round-2: #41,#46,#50,#56,#64 | DONE-VERIFIED | — | 60a34921,9d8f8117,0feaadfe,82079d38,f6343749 |
| **6 schema items #21,#23,#31,#32,#34,#38** | DONE-VERIFIED | — | 58bfcdc9,e594c987,83bb47d7,ace8852,be68dd24,31455104 |
| #29 Customer-360 financial fields | PARTIAL | FE "Financial status" block (backend done) | b1e1c767,7827d3a1 |
| #9 root-cause/delay taxonomy on director dashboard | NOT-STARTED | seed qc_root_causes + director rollup widget | — |
| #35 CRM row-level manager scoping | NOT-STARTED | scoped `manager_id` filter on leads/deals list | — |
| #40 multi-hop material→QC→delivery traceability | NOT-STARTED | JOIN-based `/qc/traceability/:poId` | — |
| #43 FMEA critical-RPN stop-production enforcement | NOT-STARTED | wire FmeaService.analyze → qc_hold | — |
| #44-45 IoT downtime reason FK + session checklist CRUD | NOT-STARTED | reason_code_id on tablet path + checklist seed/PATCH | — |
| #47 sales_orders/sd_order_departments card/dept FK | NOT-STARTED | org_department_id FK + card-scoped SD RBAC | — |
| #48-49 advance-% default + quotation→order CQRS | NOT-STARTED | route convert through CreateOrderCommand | — |
| #51 SD delivery↔WMS stock link + partial-qty | NOT-STARTED | DeliveryCreatedEvent + EXTERNAL_OUT + qty col | — |
| #52 FG storage-charge formula | NOT-STARTED | accrual calc (cron/on-read) | — |
| #53 RepeatOrderDialog (clone order) FE | NOT-STARTED | "Takrorlash" dialog on SDSalesOrders | — |
| #54 SDOrderDetail standalone page | NOT-STARTED | new /sd/orders/:id page (4 tabs) | — |
| #58 failed-production-QC → WMS quarantine/scrap | NOT-STARTED | QcFailedFgListener in wms module | — |
| #59 "Pres-kirim" quick-entry screen | NOT-STARTED | compose scale→barcode→INTERNAL_IN | — |
| #60 movement photo-evidence wiring | NOT-STARTED | photoEvidenceUrl into CreateMovement + FE upload | — |
| #61-62 org-card CSS token + EPPageHeader | NOT-STARTED | color-mix() in TreeNodeCard + EPPageHeader on 3 org pages | — |

**VISION-3340 tally: ~47 of 65 clusters DONE + 1 partial (#29 FE) + 15 clusters open.** The board's "28 items never attempted" line is stale — 10 of those 28 (#41,#42,#46,#50,#55,#56,#57,#63,#64,#65) plus all 6 schema items landed this session.

### Stream: Critical-Correctness
| Item | True status | What's left | Commit |
|---|---|---|---|
| C1-C4 (4 CRITICAL) | DONE-VERIFIED | — | a7f0129e; f4d17363,b29c8bce; e6cebf7d; cc3f8a9d,1e5802d9 |
| All 12 HIGH (1.2bk,1.4,1.5,6.1,6.2,8.1,8.2 …) | DONE-VERIFIED | 1.2 is backend-debounce stopgap only | 6e86310c,e8c5a1f6,7e8d7bd9,dfa2b1d7,4432944,817fa27c,12e6bd63,9f8a62e1 |
| 32 of 35 MEDIUM/LOW | DONE-VERIFIED | — | 18+ commits verified (fb01fc44,e3a4dc22,ca186aed,f0ae8c56,5a9fb60e,867b1cf5,a9d1a583,…) |
| 1.8 warehouse dup-name guard | PARTIAL | non-atomic SELECT-then-INSERT; no UNIQUE index (blocked by pre-existing dup names) | d75898a2 |
| 2.3 ЦКП 16h deadline UTC-anchored | BLOCKED-OWNER | ckp-gate.ts:93 uses 21:00 not 16:00 Tashkent — live payroll rule | — |
| 7.5 wizard unsaved-POST lost on token expiry | BLOCKED-OWNER | no autosave/draft before forced logout | — |
| 1.2-frontend client idempotency-key | NOT-STARTED | payment form sends no key (only advance-payment path has one) | — |

### Stream: Magic-Numbers (M1-M11)
| Item | True status | What's left | Commit |
|---|---|---|---|
| M2,M3,M4,M6,M7,M9 | DONE-VERIFIED | M6 now 4/4, M9 both EOQ schemes tunable | 31c6953c;9919dc92+3;6e92aaf7,110aa00f;f069bb09,5726e00a;deb801c3;81126af9,a09b2a3b |
| M8 role-catalog unification | PARTIAL | slice-1 done; ~666 uppercase literals / 29 local `enum Role` / ~36 catalogs remain — **cosmetic only** (guard is case-insensitive + fail-closed, no auth vuln) | a96b1980 |
| M11 duplication clusters | PARTIAL (1/7) | 6 open: OEE bands, AR/AP aging 90/60/30, material-type taxonomy, lead-scoring, order-state-machine, 48h-SLA | d2a216b1 |
| M1 payroll tax, M5 GL 0.01 tol, M10 Aisha | BLOCKED-OWNER | permanent owner exclusion — confirm | — |

### Stream: Org-Card Manual-Entry (G1-G12)
| Item | True status | What's left | Commit |
|---|---|---|---|
| G1,G2,G3,G4,G6 | DONE-VERIFIED | — | 8507126a,82d24fe6,0c3a9474,db05b9b3+893c1c54,879258e1 |
| G7,G8 ЦКП/LMS→payroll gates | DONE-VERIFIED (code) + DATA-gated | code live (pre-existing); owner DATA (tskp_target 0, courses.card_id 0/5) | — |
| G11 mandatory-reason audit | DONE (board STALE) | landed via VISION-3340 #24 after the board was written | 976ee28c |
| G5 legacy mirror-write in sync-helper | BLOCKED-OWNER (deferred, justified) | repoint 8+ live readers of positions/departments → org_departments (schema-scale), then stop mirror | — |
| G9 single-tree invariant | BLOCKED-OWNER (not impl) | owner picks single-root model → collapse 14 roots, enforce otdeleniye 1-7 | — |
| G10 single canonical card table | BLOCKED-OWNER (not impl) | 3 parallel worlds still fed; owner names the ONE table | — |
| G12 BE confidential-field projection | NOT-STARTED | findOne returns unfiltered node — all roles see salary/razryad (security) | — |

### Stream: i18n (F1/F3/F4) + Design-QA top-10
| Item | True status | What's left | Commit |
|---|---|---|---|
| F4 BE exception messages | DONE-VERIFIED | 42 commits; 1 `assert*()` literal left (17 machine-codes intentional) | 275d32a0..96d24101 etc. |
| F2 file-level 2-arg t() | DONE-VERIFIED | — | 891f9401,7069d2f5 |
| F1 centralize locale (uz-UZ hardcode) | BLOCKED-OWNER | needs uz-Cyrl locale-string decision (blocks format centralization) | — |
| F3 Cyrillic DB column | NOT-STARTED / BLOCKED-OWNER | architecture decision: `_cyrl` sibling column vs translations table | — |
| F5-F10 | N/A | never defined as work items (doc only ever specified F1) | — |
| Design-QA #1 (dup grid), #4-#10 | DONE-VERIFIED | board wrongly said #1 "scoped out" — it was the full D1 sweep | 7a462a72…9d574f26; 4db11567,6ddee48f,6383ae79,882f476c,503ca93f,949490db |
| Design-QA #2 app-shell padding sweep | NOT-STARTED | systemic AppShell padding reconciliation (~all pages) | — |
| Design-QA #3 EPPageHeader adoption | NOT-STARTED | wholesale migration (~54+ pages) | — |

### Stream: Accounting-Standards / Finance GL (F1-F11)
| Item | True status | What's left | Commit |
|---|---|---|---|
| F1-F10 + F11-1 (11 items) | DONE-VERIFIED | residual dead `saveGlEntry` orphan (0 callers, LOW) | 3508537d,9b04fd3f,f25e8811,b42ab33f,495c8128,f26b6469,53ab2edd,99f019c2,e9495c09,064852ad,7a7a09a2,0461eb5f,4ed79e1e,ce308e9e |
| F7 Separation of Duties | BLOCKED-OWNER | mechanism proven; pure owner-data (Finance card duplicated 5×, head/member on split twins, FINANCE_OFFICER 0 users) | — |
| F11-2 year-end close / retained-earnings | NOT-STARTED | 0 impl files (deferred as claimed) | — |
| F11-3 period-end FX revaluation | NOT-STARTED | 0 impl files (deferred as claimed) | — |

### Stream: Two-Worlds
| Sub-item | True status | What's left | Commit |
|---|---|---|---|
| sales_orders ╳ orders | DONE-VERIFIED | legacy `orders` table dropped | ce8d72c4 |
| GL two-world (A2) | DONE-VERIFIED | `entries` canonical; alternates empty; F1/F3 unified writers | — |
| Role-catalog (D1-D3) | DONE-VERIFIED | M8 slice | 5b68d53b |
| KARTA-unification cluster-3 (d89c87de) | PARTIAL | d89c87de is only the SCHEMA step (additive cols); data-convergence + twin retirement owner-blocked (=G5/G9/G10) | d89c87de |
| Invoices (A1/A18/C2/C3) | PARTIAL | aging handlers fixed by F4; 3 SQL views + FE snapshot three-way still legacy | f26b6469 |
| `/erp/sales` read/write asymmetry (C1) | NOT-STARTED (HIGH) | reads sap_sales_orders-first, writes sales_orders | — |
| Payments 3-table (B5) | BLOCKED-OWNER | collapse finance_payments/payments/sd_payments | — |
| Golden-thread listeners | IN-PROGRESS | many never-registered listeners wired post-audit (QcRework c815c5a3, FinanceInvoiceCreated 0db81c59, PpCancelled 9f3f3e61, auto-invoice 0feaadfe, fraud 1d97fb92, NDA ae4c6665) — ongoing | — |

### Stream: Vision-extraction (`FULL-VISION-EXTRACTION-2026-07-07.md`)
| Item | True status | What's left | — |
|---|---|---|---|
| Coverage of distinct owner decisions | DONE-VERIFIED | ~100% | — |

**Real coverage %:** the "~4000" owner estimate is a **gross** count across 3 overlapping question-generations; **distinct decisions ≈ 2146 core (~1000 cleanest)**. Extracted rows ≈ **4786** (1000 core + ~370 interview + ~2787 B-gen + 629 cross-ref-verify). Real coverage: **distinct core 100%, all 4 interviews 100%, B-gen TASDIQ 100%, cross-ref verification 20/20 modules 100%.** The 629 cross-ref rows resolved to **Ha 16 / Qisman 222 / Yo'q 390 / 1 data-check** (i.e. of the vision, ~2% fully built, ~35% partial, ~62% absent). Remaining: one **mechanical** doc task (migrate `B04-coordination.md` EP-COR-031..135 traceability IDs into Step-2b), 1 `data-check` row (live-DB rowcount, DB empty in build phase), and owner-DATA-blocked rows (not extraction gaps).

---

## Everything still OPEN, ranked by priority

**P1 — real correctness/security gaps (code-only, no owner decision needed):**
1. **Two-Worlds C1** — `/erp/sales` reads `sap_sales_orders` but writes `sales_orders` (read/write asymmetry, HIGH).
2. **G12** — BE confidential-field projection: `findOne`/list return salary/razryad unfiltered to every role (security).
3. **VISION-3340 #47, #51, #58, #40** — SD card/dept FK + RBAC; SD-delivery↔WMS stock link; failed-QC→WMS quarantine; material→QC→delivery traceability (real golden-thread/integrity gaps).
4. **Critical 1.2-frontend** — payment form has no client idempotency key (double-submit still possible; backend debounce is a stopgap).

**P2 — feature completion (code-only):**
5. VISION-3340 #48-49 (quotation→order CQRS), #54 (SDOrderDetail page), #9, #35, #43, #44-45, #52, #53, #59, #60, #61-62, #29-FE.
6. Invoices A18/C2/C3 — 3 legacy SQL views + FE aging snapshot three-way reconciliation.
7. M11 — 6 remaining duplication clusters (OEE bands, AR/AP aging, material-type, lead-scoring, order-state-machine, 48h-SLA).

**P3 — cleanup / cosmetic (low value, non-blocking):**
8. Critical 1.8 (warehouse dup-name UNIQUE index — needs data dedup first).
9. i18n: last 1 `assert*()` literal; Design-QA #2/#3 systemic sweeps (app-shell padding, EPPageHeader ~54 pages).
10. M8 broader role-catalog unification (666 literals — cosmetic, no security gain).
11. Dead `saveGlEntry` orphan removal (0 callers); vision `B04-coordination` traceability-ID doc migration.

---

## Everything needing an OWNER DECISION (exact question each)

**Org-card canonicalization (blocks org/HR restructuring features):**
1. **G10** — Which ONE table is the canonical "card"? `org_departments` vs `employee_cards` vs `org_functions` — so the other two can be retired.
2. **G9** — Which single-root tree model, and confirm the otdeleniye 1-7 mapping, so the 14 duplicate root nodes can be collapsed?
3. **G5 / Two-Worlds A7** — Approve the schema-scale migration (repoint 8+ live readers of `positions`/`departments` → `org_departments`, then drop the mirror-write) — or keep the legacy mirror indefinitely?
4. **G7/G8 (data, not decision)** — Populate `tskp_target` values + bind `courses.card_id` so the already-wired ЦКП/LMS salary gates actually withhold pay.

**Finance:**
5. **F7 SoD** — Which `org_departments` card is the canonical Finance dept (head-bearing #26/27 vs member-bearing #51/60/42/159), and provision real `FINANCE_OFFICER`/accountant users (today only super_admin/director exist), else maker≠checker can never fire.
6. **Two-Worlds B5** — Approve collapsing `finance_payments`/`payments`/`sd_payments` into one table + FK?

**Bilingual / i18n (blocks Cyrillic feature work):**
7. **F1** — What locale string represents Uzbek-Cyrillic display (`uz-Cyrl-UZ`, or fall back to `uz-UZ`/`ru-RU`)? Blocks formatting centralization.
8. **F3** — For Cyrillic storage: add a third `_cyrl` sibling column (per existing `_ru` convention) or migrate to a proper translations table? (Affects every future bilingual column.)

**Payroll / correctness rules:**
9. **Critical 2.3** — Anchor the ЦКП deadline to 16:00 Tashkent instead of the current 21:00 (UTC-midnight)? Live payroll-gate rule change.
10. **Critical 7.5** — Should long wizard forms autosave (localStorage/server draft) before a forced-logout redirect, or is losing unsaved state on token expiry acceptable?
11. **Critical 1.8** — Dedup the pre-existing duplicate warehouse names so a `UNIQUE(name)` index can be added, or keep the app-level guard?

**Magic-numbers (low urgency):**
12. **M9** — Which EOQ scheme is canonical: flat (150k/0.20) vs ABC-tiered (50k, 0.20-0.25-0.30 by segment)? Both are now tunable; only the methodology label is undecided.
13. **M8** — Is broader role-catalog unification worth the churn given the guard already normalizes case + fails closed (no security gain)?
14. **M1 / M5 / M10** — Confirm permanent exclusion (payroll tax rate, GL 0.01 tolerance, Aisha thresholds).

**Already delivered, awaiting owner input (not a blocker):**
15. `docs/audit/CARD-ATTRIBUTES-REQUEST.md` (93 positions) — owner to fill in razryad/rbac_tier/salary/otdeleniye per lavozim (this single data-set unblocks G7/G8, F7, RBAC, and the ЦКП/LMS gates at once).

---

## Is vision-building (new features) ready to start?

**Partially — the correctness/data-integrity foundation is closed (all CRITICAL + HIGH done, GL unified, two-worlds mostly resolved), so feature work can begin now on the modules that aren't gated (Production/MES, QC, WMS, most of SD), while org-restructuring, finance-SoD, and bilingual-Cyrillic features stay blocked until the owner answers the ~8 canonicalization/locale decisions above — the single highest-leverage unblock is filling the card-attributes template, which clears four of them at once.**
