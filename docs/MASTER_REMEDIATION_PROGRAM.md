# EuroPrint ERP — Master Remediation Program

> **Maqsad:** V3 audit'da topilgan barcha muammolarni tuzatish + barcha yo'nalishlarda sifatni 85/100+ ga ko'tarish
> **Davomiyligi:** **8 sprint × 2 hafta = 16 hafta (4 oy)**
> **Jami task:** **170 ta** (har biri atomic, agent bajaradigan)
> **Agent arxitekturasi:** Multi-agent — workerlar + supervisor + reviewerlar + rule enforcerlar
> **Sana:** 2026-05-15
> **Maqsad ball:** V3 65/100 → V8 92/100

---

## 1. UMUMIY ARXITEKTURA

### 1.1 Agent ierarxiyasi

```
                    ┌────────────────────────────┐
                    │   ORCHESTRATOR AGENT       │  (siz — yoki master Claude)
                    │   Plan + Coordination      │
                    └────────────┬───────────────┘
                                 │
        ┌────────────────────────┼──────────────────────────┐
        │                        │                          │
        ▼                        ▼                          ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ CODE REVIEWER    │   │ RULE ENFORCER    │   │ TEST QUALITY     │
│ AGENT            │   │ AGENT            │   │ AUDITOR AGENT    │
│ (har PR review)  │   │ (22 qoida)       │   │ (test sifat)     │
└──────────────────┘   └──────────────────┘   └──────────────────┘
        │                        │                          │
        └────────────────────────┼──────────────────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  │     WORKER SQUADS (7 ta)    │
                  └──────────────┬──────────────┘
                                 │
   ┌──────┬──────┬──────┬──────┬┴─────┬──────┬──────┐
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
[SQ-A] [SQ-B] [SQ-C] [SQ-D] [SQ-E] [SQ-F] [SQ-G]
DDD   DB     FE     SEC    TEST   AISHA  DEVOPS
```

### 1.2 Agentlar va rollar

| Agent | Soni | Rolli | Asosiy javobgarlik |
|---|:---:|---|---|
| **Orchestrator** | 1 | Bosh koordinator | Sprint rejasini boshqarish, blokerlarni bartaraf etish |
| **Code Reviewer** | 1 | PR tekshiruvchi | Har commit'ni o'qish, sifat baholash, oldindan ruxsat |
| **Rule Enforcer** | 1 | Qoida kuzatuvchisi | 22 ARCHITECTURE_RULES check, FAIL'lar e'lon qilish |
| **Test Quality Auditor** | 1 | Test sifati nazoratchisi | Stub test'lar, mutation score, real coverage |
| **Worker Squad A — DDD** | 1-3 | DDD refactoring | Backend modullarini to'g'ri DDD'ga keltirish |
| **Worker Squad B — DB** | 1-2 | Database | Multi-tenancy, schema consolidation, migration |
| **Worker Squad C — Frontend** | 1-3 | Frontend | Pages, components, hooks consistency |
| **Worker Squad D — Security** | 1-2 | Xavfsizlik | SQL injection, audit, RBAC, secrets |
| **Worker Squad E — Tests** | 1-2 | Test sifati | Stub o'chirish, real test yozish |
| **Worker Squad F — AIsha** | 1-2 | AIsha real ulanish | LLM, tools, dashboard integration |
| **Worker Squad G — DevOps** | 1 | CI/CD, monitoring | Pipeline, observability, perf |

**Jami: 11 agent rol** — har biri o'z ish soni va prompti bilan.

---

## 2. WORKFLOW PROTOKOLI

### 2.1 Har task lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. ORCHESTRATOR pickslari pending task'ni                  │
│     TaskList → topmosti pending task                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Worker Squad agentini dispatch qiladi                   │
│     Squad: A/B/C/D/E/F/G                                    │
│     TaskUpdate(id, status='in_progress', owner='squad-X')   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Worker ish bajaradi (≤ 4 soat)                          │
│     - Manba kod o'qish                                       │
│     - Implementation                                         │
│     - Tests yozish                                           │
│     - Git commit (feature branch'ga)                         │
│     - PR ochish                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CODE REVIEWER avtomatik tekshiradi                      │
│     - Diff o'qish                                            │
│     - Pattern moslik                                         │
│     - Comment yozish PR'da                                   │
│     - APPROVE yoki REJECT                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. RULE ENFORCER 22 qoida tekshiradi                       │
│     - bash scripts/run-all-reviewers.sh                     │
│     - 22 dan 22 PASS bo'lishi shart                         │
│     - Buzilish bo'lsa — REJECT                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. TEST QUALITY AUDITOR tekshiradi                         │
│     - Yangi test fayllar sifat                               │
│     - Stub padding bormi                                     │
│     - Real assertion bormi                                   │
│     - Coverage delta                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  7. AGAR HAMMASI YASHIL:                                    │
│     - Auto-merge PR                                          │
│     - TaskUpdate(id, status='completed')                     │
│     - docs/remediation-progress.md ga yozish                 │
│     - Keyingi task                                           │
│     AGAR QIZIL:                                              │
│     - Worker'ga qaytarish + sabab                            │
│     - Loop                                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Quality gates — har task uchun

Task **DONE** deb hisoblanadi qachonki:

1. ✅ Manba kod o'qildi va tushunilgan
2. ✅ Implementation yozildi (≤ 300 qator/fayl)
3. ✅ Yangi testlar yozildi (kamida 5 ta meaningful)
4. ✅ `pnpm test` PASS
5. ✅ `pnpm typecheck` 0 xato
6. ✅ `pnpm lint` 0 warning
7. ✅ `bash scripts/run-all-reviewers.sh` 22/22 PASS
8. ✅ Code Reviewer APPROVE qildi
9. ✅ Test Quality Auditor PASS
10. ✅ Coverage faqat o'sgan (pasaymagan)
11. ✅ Git commit aniq sarlavha bilan
12. ✅ docs/remediation-progress.md yangilangan

**Birorta gate FAIL bo'lsa — task qaytariladi.**

### 2.3 Sprint protokoli

Har sprint (2 hafta) tartibi:

| Hafta | Hafta 1 | Hafta 2 |
|---|---|---|
| **Dushanba** | Sprint planning (Orchestrator) | Continuation |
| **Seshanba-Chorshanba** | Worker squad'lar parallel | Worker continuation |
| **Payshanba** | Code review marathon | Code review marathon |
| **Juma** | Demo + retrospective | **Sprint demo + ball o'lchash** |

**Sprint ohirida:**
- Yangi V-ball o'lchanadi
- docs/remediation-progress.md update
- Code metrics dashboard

---

## 3. SPRINT REJASI (8 sprint × 2 hafta = 16 hafta)

| Sprint | Hafta | Mavzu | Squad'lar | Task soni |
|:---:|:---:|---|---|:---:|
| **S1** | 1-2 | **KRITIK xavfsizlik** | B, D | 20 |
| **S2** | 3-4 | **DDD konsolidatsiya — Faza 1** | A, B | 22 |
| **S3** | 5-6 | **Frontend va i18n haqiqiy fix** | C | 28 |
| **S4** | 7-8 | **AIsha real ulanish + AI features** | F | 20 |
| **S5** | 9-10 | **Test sifati — stub cleanup** | E | 20 |
| **S6** | 11-12 | **DDD konsolidatsiya — Faza 2** | A | 22 |
| **S7** | 13-14 | **DevOps + Monitoring + Performance** | G | 18 |
| **S8** | 15-16 | **Polishing + Documentation + Launch** | All | 20 |
| **JAMI** | 16 | — | — | **170** |

---

## 4. SQUAD A — DDD REFACTORING (22+22 = 44 task)

### Squad A vazifasi

Real DDD darajasini **35% → 80%** ga ko'tarish. CRM 3 parallel path, HR aralashish, anemic domain'larni tuzatish.

### Sprint 2 — DDD Faza 1 (22 task)

```
A.1   crm/application/crm-leads-ops.repository.ts ni o'chirish
A.2   crm/application/crm-leads-ops.service.ts ni o'chirish
A.3   CRM controllers'da har endpoint CommandBus.execute() ga o'tkazish
A.4   Lead aggregate.qualify() — barcha qualification yo'l shu yerdan o'tsin
A.5   Lead aggregate.convertToDeal() — barcha conversion yo'l shu yerdan o'tsin
A.6   Deal aggregate.markAsWon() — barcha won yo'l shu yerdan
A.7   Deal aggregate.markAsLost() — barcha lost yo'l shu yerdan
A.8   CRM testlar yangi pattern bilan (handler test 20+)
A.9   CRM domain event'lar — har action uchun
A.10  CRM event listener test (5 ta)
A.11  crm-bitrix-compat.service.ts — to'liq legacy/ ga ko'chirish
A.12  HR leave-request.aggregate.ts — getter'lar qo'shish (public property o'chirish)
A.13  HR LeaveRequest aggregate barcha service'larda majburiy
A.14  HR application/ ichidagi 10+ service'larni guruhlash
A.15  HR controller'lar handler orqali (service bypass yo'q)
A.16  HR ApproveLeaveHandler — SoD tekshiruvi (so'rovchi != tasdiqlovchi)
A.17  HR testlar yangi pattern
A.18  Anemic domain audit: barcha aggregate'larda getter mavjudligini tekshirish
A.19  Anemic domain fix script — public field'larni private + getter qiladi
A.20  Service files in application/commands/ — to'liq olib tashlash
A.21  Repositories'ni application/'dan infrastructure/'ga ko'chirish
A.22  Sprint demo: CRM va HR full DDD scorecard
```

### Sprint 6 — DDD Faza 2 (22 task)

```
A.23  Aisha — Conversation aggregate haqiqatda ishlatilsin
A.24  Aisha — har chat session aggregate orqali yaratilsin
A.25  Aisha tool execution — aggregate.executeTool() metodi orqali
A.26  Aisha event publishing — har tool call event chiqarsin
A.27  Aisha tests: aggregate-orqali oqim test
A.28  Finance modul DDD audit (hozir klassik)
A.29  Finance: GLDocument aggregate yaratish
A.30  Finance: GLPostingHandler — DDD pattern bilan
A.31  Finance: invariant test (debit=credit)
A.32  Production modul DDD audit
A.33  Production: ProductionOrder aggregate
A.34  Production: StartProduction/CompleteProduction handler
A.35  WMS modul DDD audit
A.36  WMS: InventoryMovement aggregate
A.37  WMS: TransferInventory handler
A.38  Sales modul DDD audit (hozir klassik)
A.39  Sales: Quotation aggregate
A.40  Sales: CreateQuotation handler
A.41  Cross-module audit: anti-pattern qoldiqlari
A.42  CRM 3-path bypass — final removal
A.43  DDD reality scorecard — har modul uchun
A.44  Sprint demo: 80% real DDD ball
```

---

## 5. SQUAD B — DATABASE (15 task)

### Squad B vazifasi

Multi-tenancy, schema consolidation, migration discipline.

### Sprint 1 (10 task — kritik)

```
B.1   Migration 0012_add_tenant_id.sql yaratish
      - Jadval: users, sales_orders, crm_deals, crm_companies,
                production_orders, hr_employees, fi_invoices, wms_stock
      - Default tenant_id = 1
      - NOT NULL constraint
      - Index har biriga
B.2   apps/api/src/shared/db/tenant-context.ts — AsyncLocalStorage
B.3   TenantMiddleware — JWT'dan tenant_id chiqarib context'ga qo'yish
B.4   Drizzle queries — global tenant filter (RLS pattern)
B.5   Integration test: 2 ta tenant data isolation
B.6   Schema fragmentation audit: 108+58 fayl
B.7   Duplicate table eliminate: users, crmDeals, crmContacts
B.8   schema-compat-* fayllarni 1 ta consolidated fayl ga birlashtirish
B.9   fix-schema-FINAL*.sql fayllarni Drizzle migration'ga ko'chirish
B.10  Schema source-of-truth: lib/db/src/schema yagona joy
```

### Sprint 2 (5 task — qolgan)

```
B.11  Soft delete audit: production_facts_sm72, work_centers'ga deletedAt
B.12  Indexes audit: FK columns'ga indexes qo'shish
B.13  AishaPendingApprovals — createdAt + updatedAt qo'shish
B.14  Migration journal cleanup — 0011 dan keyin toza tartib
B.15  DB schema documentation (auto-gen Drizzle Studio'dan)
```

---

## 6. SQUAD C — FRONTEND (28 task)

### Squad C vazifasi

Pattern consistency 72/100 → 90/100. Hardcoded matn 0. Loading/error/empty state unified.

### Sprint 3 (28 task)

```
C.1   AICrmPage.tsx — useTranslation import fix (fatal bug)
C.2   DirectorDashboard.tsx — "24h SLA buzilgan" → t() ga ko'chirish
C.3   Login.tsx — Zod messages locales/uz/auth.json ga
C.4   hooks/use-crm.ts — toast hardcoded matn fix
C.5   Hardcoded matn skaner: barcha pages
C.6   ESLint qoidasi react-i18next/no-literal-string yoqish
C.7   Unified loading: PageState komponenti yaratish
      - Loading: skeleton
      - Error: EPErrorState
      - Empty: EPEmptyState
      - Data: children
C.8   100 ta sahifa PageState'ga migration (batch 1)
C.9   100 ta sahifa PageState'ga migration (batch 2)
C.10  100 ta sahifa PageState'ga migration (batch 3)
C.11  Unified toast pattern: useToast hook + i18n
C.12  Pages > 300 qator — bo'lish (EmployeeDialog, AccountsPayable, ...)
C.13  EmployeeDialog'ni 5 ta subcomponentga bo'lish
C.14  Mutation silent fail audit — barcha hook'larda onError
C.15  React Query — runtime Zod validation
C.16  RBAC component: <RoleGate role={...}> wrapper
C.17  Sahifalarda role-level gating
C.18  Component design system: shadcn/ui'ni majburiy ishlatish
C.19  Storybook setup (har major komponent)
C.20  Visual regression: Chromatic integration
C.21  Mobile responsive audit (top 50 sahifa)
C.22  Accessibility audit (ARIA labels, keyboard nav)
C.23  Performance audit: bundle size analyzer
C.24  Code splitting: lazy load all pages (allaqachon — verify)
C.25  Image optimization: AVIF/WebP
C.26  Form validation: react-hook-form + Zod resolver everywhere
C.27  Error Boundary: page-level (App-level emas)
C.28  Sprint demo: page consistency 90/100
```

---

## 7. SQUAD D — SECURITY (15 task)

### Sprint 1 (15 task — kritik)

```
D.1   compare-periods.tool.ts:62 — SQL injection fix
D.2   Raw SQL audit: 48 violations review
D.3   Raw SQL violations — har biriga // WHY: comment yoki Drizzle'ga ko'chirish
D.4   ESLint qoidasi: sql.raw bilan literal-only argument
D.5   admin.seed.ts — Admin123! fallback olib tashlash
D.6   org-structure-sync.sql — test123 hash olib tashlash
D.7   admin-auth.controller.ts:33 — wrong JWT secret fix
D.8   password.vo.ts — bcrypt rounds 10 → 12 (admin bilan moslash)
D.9   JWT secret rotation policy + KMS integration
D.10  Audit log: business intent events table
      - audit_events: id, tenant_id, user_id, action, entity, entity_id, before, after, ts
D.11  AuditInterceptor — domain events'ga subscribe
D.12  @AuditAction decorator — high-stake method'lar uchun
D.13  /admin/audit page (admin role only)
D.14  Penetration test: SQL injection, XSS, CSRF probes
D.15  Sprint demo: 0 known vulnerabilities
```

---

## 8. SQUAD E — TEST QUALITY (20 task)

### Sprint 5 (20 task)

```
E.1   _stubs/ papka audit — qaysi service'lar real test'ga arzir
E.2   _stubs/AdaptationService.spec.ts kabi — 50 ta o'chirish
E.3   _stubs ichida real test'ga aylantirish kerak bo'lganlar — 100 ta refactor
E.4   _stubs ichidagi qolgan 595 ta — o'chirish
E.5   Real test yozish: 50 ta aggregate (har biri 8 test)
E.6   Real test yozish: 50 ta handler (har biri 6 test)
E.7   Real test yozish: 30 ta repository integration (Docker postgres)
E.8   apps/api/test/_helpers/setup-test-db.ts — real Docker postgres
E.9   apps/api/test/_fixtures/factories.ts — 30+ factory function
E.10  Supertest controller e2e — 20 ta controller
E.11  Trigger/event e2e test — 10 ta cross-module flow
E.12  Mutation testing: Stryker setup
E.13  Stryker run on auth module → target 75% mutation score
E.14  Stryker run on sd module
E.15  Stryker run on crm module
E.16  Coverage threshold: lines 25 → 60 (force PR fails)
E.17  Coverage threshold: lines 60 → 75 (a week later)
E.18  Coverage threshold: lines 75 → 80 (sprint end)
E.19  Test naming audit — `it('verb expected when condition')` everywhere
E.20  Sprint demo: 1175 tests → 600 real tests, coverage 25% → 80%
```

---

## 9. SQUAD F — AISHA INTEGRATION (20 task)

### Sprint 4 (20 task)

```
F.1   Anthropic Claude API kalit olish
F.2   OpenAI Whisper API kalit olish
F.3   ElevenLabs API kalit olish + voice tanlash
F.4   Picovoice Porcupine — "Aisha" wake word train
F.5   .env'da real kalitlar
F.6   AishaConfig — kalitlar validation startup'da
F.7   ClaudeService — streamWithTools haqiqatan ulansin
F.8   AishaChatController — stub'dan real LLM call'ga
F.9   Tool registry — LLM bilan ulanish
F.10  Tool execution loop: model → tool_use → tool_result → continue
F.11  SSE streaming — frontend'ga
F.12  Voice pipeline POC: matn input → Claude → matn output
F.13  Voice pipeline: + Whisper STT
F.14  Voice pipeline: + ElevenLabs TTS streaming
F.15  Frontend: useWakeWord hook real ishlash
F.16  DirectorDashboard.tsx — AishaPanel haqiqatan mount qilish
F.17  TransparencyPanel — provenance ko'rsatish
F.18  Camera integration: get_camera_snapshot real ishlash
F.19  Camera AI vision: analyze_camera_feed Claude Vision orqali
F.20  Director pilot test (10 ta real buyruq) + final demo
```

---

## 10. SQUAD G — DEVOPS / MONITORING / PERFORMANCE (18 task)

### Sprint 7 (18 task)

```
G.1   CI workflow update: 22 ARCHITECTURE_RULES har push'da
G.2   CI workflow: coverage threshold gate
G.3   CI workflow: mutation score gate (warning only initially)
G.4   CI workflow: bundle size gate (frontend < 5MB)
G.5   Branch protection: main faqat green CI bilan
G.6   Pre-commit hook (husky): lint + typecheck + spell check
G.7   Sentry integration — backend va frontend
G.8   OpenTelemetry traces — har request
G.9   Prometheus metrics — endpoint latency, error rate
G.10  Grafana dashboard — KPI'lar
G.11  Log aggregation — Loki / ELK
G.12  Alerts: 500 error rate > 1%, latency p95 > 1s
G.13  Performance budget: k6 load test (100 RPS, 10 min)
G.14  Database connection pool tuning
G.15  Redis cache hit rate monitoring
G.16  BullMQ queue monitoring
G.17  Backup strategy: PG daily + WAL streaming
G.18  Disaster recovery test (restore from backup)
```

---

## 11. SQUAD H (S8) — POLISHING + LAUNCH (20 task)

### Sprint 8 (20 task)

```
H.1   ARCHITECTURE_RULES 4 FAIL → 0 FAIL
H.2   Documentation audit: README, CONTRIBUTING, RUN_LOCAL
H.3   API documentation: Swagger/OpenAPI to'liq
H.4   Backend metrics dashboard
H.5   Frontend metrics dashboard
H.6   User guide: rahbar uchun Aisha qo'llanma
H.7   User guide: sex menejer uchun ERP
H.8   Migration guide: yangi versiyaga ko'chirish
H.9   Onboarding tutorial: yangi xodim
H.10  Video demo: AIsha use cases
H.11  Final V-score audit (V8)
H.12  Security audit (3rd party penetration test)
H.13  Compliance audit (GDPR, O'zbekiston ML qonun)
H.14  Performance benchmark report
H.15  Cost analysis: API costs, infra
H.16  Pilot launch: 1 ta mijoz
H.17  Customer support training
H.18  Pilot feedback collection (2 hafta)
H.19  Bug triage va fix
H.20  Public launch + press release
```

---

## 12. AGENT PROMTLARI

Quyida har bir agent rol uchun **tayyor prompt**. Bularni Claude Code, Cursor yoki boshqa agent'ga to'g'ridan-to'g'ri berishingiz mumkin.

---

### 12.1 ORCHESTRATOR AGENT PROMPT

```
You are the ORCHESTRATOR for the EuroPrint ERP Master Remediation Program.

Project: C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module
Reference: MASTER_REMEDIATION_PROGRAM.md

Your job:
1. At sprint start: create all sprint tasks via TaskCreate (review the
   sprint's task list in MASTER_REMEDIATION_PROGRAM.md)
2. Dispatch worker squad agents (use Agent tool with Explore subtype)
   to do the work in parallel where possible
3. After each task completion, dispatch:
   - Code Reviewer agent (review the diff)
   - Rule Enforcer agent (run scripts/run-all-reviewers.sh)
   - Test Quality Auditor agent (if test files changed)
4. If any review fails — re-dispatch the worker with feedback
5. Update docs/remediation-progress.md after each task
6. At sprint end: produce sprint demo report

RULES:
- Never bypass quality gates
- Always run all 3 review agents per task
- One task per worker at a time
- Failed reviews → loop until pass
- Report progress every 5 tasks

Begin with Sprint 1 (Security + DB) — dispatch B + D squads in parallel.
Read MASTER_REMEDIATION_PROGRAM.md §5 (Squad B) and §7 (Squad D) for tasks.
```

---

### 12.2 CODE REVIEWER AGENT PROMPT

```
You are the CODE REVIEWER for EuroPrint ERP.

When called with a task ID, do this:
1. Read the task description and acceptance criteria
2. Run: git diff main..HEAD --stat
3. For each changed file:
   a. Open and read in full
   b. Compare against EuroPrint patterns (DDD, Result pattern, Zod, i18n)
   c. Check ARCHITECTURE_RULES.md compliance
   d. Check task-specific acceptance criteria
4. Verdict: APPROVE or REJECT
5. If REJECT: provide specific feedback (file:line + reason + fix)

Reject reasons (any one triggers reject):
- any used
- console.log present
- expect(true) or it.skip
- Business logic in controller
- Service mixed with handler in application/commands/
- Hardcoded English strings (non-whitelist)
- Files > 300 lines
- Functions > 50 lines
- Direct DB access from controller
- Missing tests for new logic
- Coverage decreased
- ARCHITECTURE_RULES regression

Output format:
```
VERDICT: APPROVE | REJECT
TASK: N
FILES_REVIEWED: X
ISSUES_FOUND: Y
DETAIL:
  - file.ts:42 — [issue type] — [explanation] — [fix suggestion]
```

Be strict but constructive. Worker's job is to fix, not feel bad.
```

---

### 12.3 RULE ENFORCER AGENT PROMPT

```
You are the RULE ENFORCER for EuroPrint ERP.

After each task PR, run these checks and report:

1. Run: bash scripts/run-all-reviewers.sh
   - Captures 22 ARCHITECTURE_RULES status
   - PASS/FAIL per rule + violation count

2. Run: pnpm --filter @europrint/api exec tsc --noEmit
   - Backend TS errors must be 0

3. Run: pnpm --filter erp-dashboard run typecheck
   - Frontend TS errors must be 0

4. Run: pnpm --filter @europrint/api run lint
   - 0 warnings, 0 errors

5. Run: pnpm --filter erp-dashboard run lint
   - 0 warnings, 0 errors

Output:
```
RULE ENFORCEMENT: PASS | FAIL
ARCHITECTURE_RULES: 18/22 PASS  (or whatever)
FAILED RULES: [list with violation count]
TS errors: backend 0, frontend 0
Lint: backend OK, frontend OK
```

If ANY check fails — return FAIL with specifics.
Worker must fix before task can be marked done.
```

---

### 12.4 TEST QUALITY AUDITOR PROMPT

```
You are the TEST QUALITY AUDITOR for EuroPrint ERP.

When new test files are added/modified in a PR:

1. List new/modified .spec.ts files
2. For each, read in full and check:
   - it() name format: 'verb expected when condition'?
   - At least 5 meaningful assertions per test?
   - No expect(true).toBe(true) or trivial assertions?
   - No it.skip / xit / test.todo / describe.skip?
   - No console.log?
   - No any type?
   - Business logic NOT mocked (only I/O)?
   - Factories used (not hardcoded data)?
   - Both happy path AND error path tested?
   - File ≤ 300 lines?

3. Run: pnpm --filter @europrint/api run test:related <changed files>
   - All tests pass
   - Coverage report

4. Check coverage delta:
   - Per-module: did it increase?
   - Global: 0% change minimum, prefer +X%

Output:
```
TEST QUALITY: PASS | FAIL
FILES_AUDITED: X
QUALITY_SCORE: 0-100
ISSUES:
  - file.spec.ts:12 — [issue]
COVERAGE: +X.X% (lines), +Y.Y% (branches)
```

If quality < 70 — REJECT.
If coverage decreased — REJECT.
```

---

### 12.5 SQUAD A — DDD WORKER PROMPT

```
You are SQUAD A — DDD Refactoring worker.

Mission: Take EuroPrint ERP from 35% real DDD to 80% real DDD.

Current state:
- 27/56 modules have DDD folder structure
- But only auth (80%) and sd (85%) implement DDD properly
- CRM has 3 parallel update paths
- HR has 10+ services mixed with handlers
- AIsha has aggregate but doesn't use it

Your task (per assignment from Orchestrator):
1. Read the task ID and description
2. Read the target files in depth
3. Understand current pattern
4. Refactor to proper DDD:
   - Business logic IN aggregate (rich domain)
   - Handler loads aggregate → calls method → saves
   - No service in application/commands/
   - Repository only in infrastructure/
   - Domain events emitted from aggregate
5. Write tests:
   - Aggregate tests (unit, no mocks)
   - Handler tests (mock repo + event emitter)
   - Integration test if applicable
6. Run: pnpm test:api passes
7. Run: pnpm typecheck passes
8. Commit + PR

Be aggressive about removing duplicate paths.
Be careful about backward compat — check controllers still work.

When unsure, prefer the SD module pattern (it's the gold standard).
```

---

### 12.6 SQUAD B — DATABASE WORKER PROMPT

```
You are SQUAD B — Database worker.

Mission: Implement multi-tenancy + consolidate 166 schema files.

Current state:
- NO table has tenant_id column (data leak risk!)
- 108 schema files in lib/db/src/schema/
- 58 secondary schema files in apps/api/src/shared/db/
- 5 fix-schema-FINAL*.sql in project root (outside Drizzle journal)
- Migration 0011 consolidated 17 fixes manually

Your tasks per assignment:
1. For multi-tenancy:
   - Create new Drizzle migration
   - Add tenant_id column to specified tables
   - Index it
   - Update Drizzle schemas to include tenant_id
   - Add tenant context middleware
   - Add tests for isolation

2. For schema consolidation:
   - Identify duplicates
   - Move secondary schemas to be re-exports only
   - Update compat shim files
   - Verify no breaking changes

3. For migration discipline:
   - Move fix-schema-FINAL*.sql content into proper Drizzle migration
   - Mark them archived

Always test with Docker postgres:
- docker compose up -d postgres-test
- pnpm db:migrate
- Run all integration tests

NEVER break the existing schema. Use IF NOT EXISTS guards.
```

---

### 12.7 SQUAD C — FRONTEND WORKER PROMPT

```
You are SQUAD C — Frontend worker.

Mission: Bring frontend pattern consistency from 72/100 to 90/100.

Current issues:
- Hardcoded Uzbek strings still exist (despite "0" claim)
- AICrmPage.tsx:31 — useTranslation() without import (FATAL)
- 3 different loading patterns (EPSkeleton, Skeleton, none)
- 3 different error patterns (EPErrorState, ErrorBoundary, silent)
- Mutation silent fails common
- Some pages > 300 lines

Your tasks per assignment:
1. For hardcoded strings:
   - Open file at the specified line
   - Replace string with t('module.key')
   - Add key to locales/uz/<module>.json
   - Add key to locales/ru/<module>.json
   - Verify with i18n-check.cjs

2. For PageState unification:
   - Wrap page render in <PageState loading={...} error={...} empty={...}>
   - Remove manual skeleton/error/empty handling
   - Test render in all 4 states

3. For page splitting:
   - Move dialogs to separate files
   - Move types to <Page>Types.ts
   - Move sections to <Page>Sections.tsx
   - Each file ≤ 300 lines

4. For RoleGate:
   - Wrap sensitive sections: <RoleGate role="admin">...</RoleGate>
   - Move RBAC out of useEffect

Always run:
- pnpm --filter erp-dashboard run typecheck
- pnpm --filter erp-dashboard run test
- pnpm --filter erp-dashboard run lint

Page must render without console errors after refactor.
```

---

### 12.8 SQUAD D — SECURITY WORKER PROMPT

```
You are SQUAD D — Security worker.

Mission: Fix all known security issues.

Known issues:
1. SQL injection: apps/api/src/modules/aisha/application/tools/compare-periods.tool.ts:62
   - sql.raw with unparameterized date params
2. Hardcoded credentials:
   - admin.seed.ts:6 — 'Admin123!' fallback
   - org-structure-sync.sql:40 — 'test123' hash
   - admin-auth.controller.ts:33 — wrong JWT secret
3. Audit log: HTTP-only, no business intent
4. 48 Raw SQL violations to audit

Your tasks:
1. For SQL injection:
   - Replace sql.raw with Drizzle typed builder
   - Use between(), eq(), and() operators
   - Add test with malicious input → reject

2. For credentials:
   - Remove all fallback passwords
   - Throw if env var missing on startup
   - Add tests verifying app refuses to start with missing secrets

3. For audit log:
   - Create audit_events table
   - Subscribe AuditService to all domain events
   - Add @AuditAction decorator for high-stake methods
   - Add /admin/audit UI page (admin only)

Test each fix with adversarial input:
- SQL: '; DROP TABLE users; --
- XSS: <script>alert(1)</script>
- Path: ../../../etc/passwd

Output: penetration test report after each task.
```

---

### 12.9 SQUAD E — TEST WORKER PROMPT

```
You are SQUAD E — Test Quality worker.

Mission: 1175 tests with 63% stub padding → 600 real tests with 0% padding.

Current state:
- 1175 test files
- ~745 are stubs (apps/api/test/_stubs/) — only check module is defined
- ~430 real tests
- Coverage threshold: 25% (very permissive)

Your tasks:
1. For each _stubs/*.spec.ts file:
   - Read the corresponding source service
   - If service is trivial (passthrough only) → DELETE the spec
   - If service has real logic → REWRITE with 5+ meaningful tests
     - Test happy path
     - Test error paths (at least 2)
     - Test edge cases
     - Use factories from _fixtures/
     - Mock only I/O (DB, HTTP)

2. For new real tests:
   - Follow templates from TEST_AGENT_100_TASKS_PROMPT.md
   - Use Jest + supertest for e2e
   - Use Testing Library for frontend

3. Coverage threshold ramp-up:
   - Week 1: 25 → 50 (some tests will fail — fix them or add tests)
   - Week 2: 50 → 70
   - Week 3: 70 → 80

Always run:
- pnpm test:api --coverage
- pnpm test:erp --coverage
- Check coverage delta is +X% (never negative)

Mutation testing:
- After coverage 80%+, run: pnpm exec stryker run
- Target mutation score ≥ 75%
```

---

### 12.10 SQUAD F — AISHA WORKER PROMPT

```
You are SQUAD F — AIsha Integration worker.

Mission: AIsha from "stub returning 'integratsiyasi tayyorlanmoqda'" to fully working voice AI assistant.

Current state:
- AishaPanel exists in components/aisha/
- ClaudeService exists but not invoked
- Tool registry has 25 tools but not connected to LLM
- AishaChatController returns stub text
- DirectorDashboard does NOT mount AishaPanel

Your tasks:
1. Get real API keys (you have a guide in AISHA_DISPATCHER_MODULE_PLAN.md §6.8):
   - Anthropic Claude
   - OpenAI Whisper
   - ElevenLabs
   - Picovoice Porcupine
   - Google Gemini (fallback)

2. Wire ClaudeService:
   - Initialize Anthropic client with ANTHROPIC_API_KEY
   - Implement streamWithTools(messages, tools) method
   - Stream events: text deltas, tool_use blocks, tool_result blocks

3. Connect Tool Registry to LLM:
   - On tool_use → look up tool → execute → return result to Claude
   - Loop until model done
   - Include provenance in tool results

4. Voice pipeline:
   - Whisper for STT (audio upload endpoint)
   - ElevenLabs for TTS (streaming response)
   - Wake word Porcupine (.ppn file at frontend assets)

5. Frontend mount:
   - Edit DirectorDashboard.tsx
   - Add <AishaPanel /> + <TransparencyPanel />
   - Wire wake word detection
   - Test with real microphone

6. End-to-end test:
   - User says "Aisha"
   - User asks "show today's production status"
   - Verify: Claude → get_production_status tool → real DB data → response
   - Verify: TransparencyPanel shows sources

After each task, run:
- pnpm dev (start backend + frontend)
- Manual test the feature
- Update aisha-final-report.md with REAL status (not stub)
```

---

### 12.11 SQUAD G — DEVOPS WORKER PROMPT

```
You are SQUAD G — DevOps / Monitoring / Performance worker.

Mission: Make the codebase production-grade with proper CI/CD, monitoring, and performance.

Current state:
- GitHub Actions exists but not enforcing rules
- No Sentry, no traces
- No load test
- No performance budget
- No backup strategy

Your tasks (per assignment):
1. CI workflow:
   - Edit .github/workflows/code-quality.yml
   - Add jobs: test-backend, test-frontend, test-architecture, test-mutation
   - Branch protection: main requires all 4 PASS
   - Codecov integration

2. Monitoring:
   - Sentry SDK (backend + frontend)
   - OpenTelemetry traces
   - Prometheus metrics endpoint
   - Grafana dashboards (provisioned via Helm or docker-compose)

3. Performance:
   - k6 load test scripts (auth, sales, KPI dashboard)
   - Performance budget: p95 latency < 500ms
   - Bundle size: frontend < 5MB gzipped
   - DB connection pool tuning

4. Backup:
   - PostgreSQL pg_dump daily cron
   - WAL streaming to S3
   - Disaster recovery test (monthly)

Document everything in docs/devops/.
```

---

## 13. PROGRESS TRACKING

### 13.1 Hisobot fayli

`docs/remediation-progress.md` — har task tugagandan keyin yangilanadi:

```markdown
# Remediation Progress

## Sprint 1 (Hafta 1-2)
| Task | Squad | Status | Reviewer | Time | Notes |
|------|-------|--------|----------|------|-------|
| B.1  | DB    | done   | APPROVE  | 8h   | tenant_id migration |
| B.2  | DB    | done   | APPROVE  | 4h   | TenantMiddleware |
| D.1  | SEC   | done   | APPROVE  | 6h   | SQL inj fix |
...

## Coverage Progress
| Week | Backend | Frontend | E2E | Mutation |
|------|---------|----------|-----|----------|
| 0    | 25%     | 5%       | 2%  | n/a      |
| 1    | 35%     | 15%      | 5%  | n/a      |
| 2    | 50%     | 30%      | 10% | n/a      |
...

## V-score Progress
| Sprint | V-score | Δ |
|--------|---------|---|
| 0      | 65      | - |
| S1     | 70      | +5 |
| S2     | 75      | +5 |
...
```

### 13.2 Metrics dashboard

Real-time updated daily:

```
EuroPrint Remediation — Live Dashboard
══════════════════════════════════════
Tasks: 47/170 done (27.6%)
Days elapsed: 18 / 112 (16%)
V-score: 71/100 (start 65, target 92)
Coverage: 42% (start 25%, target 80%)
TS errors: 0 (held)
Architecture rules: 19/22 PASS (start 18)
PRs merged: 47, Rejected: 8 (sifat gate)
```

---

## 14. RISKLAR VA EHTIYOT CHORALARI

| Risk | Ehtimol | Ta'sir | Yumshatish |
|---|:---:|:---:|---|
| Squad'lar bir-birini bloklash | Yuqori | O'rta | Sprint planning'da dependency aniqlash |
| Test coverage threshold ko'tarish PR'ni buzadi | O'rta | Yuqori | Pre-merge: testlarni yozish + threshold |
| Multi-tenant migration production'da fail | O'rta | Yuqori | Staging'da to'liq test + rollback plan |
| AIsha LLM API kalitlari topib bo'lmasligi | Past | Yuqori | Sprint 4 boshida kalit olish - 1-task |
| Code Reviewer juda qattiq qaytaradi | O'rta | Past | Threshold tuning + retro |
| 16 hafta uzun — energy decline | Yuqori | O'rta | Har 4 hafta — demo + retrospective + dam |
| Mijoz yangi feature so'raydi | Yuqori | Yuqori | Sprint backlog'ga emas, parking lot'ga |

---

## 15. SPRINT DEMO ROADMAP

| Sprint | Demo | V-score |
|:---:|---|:---:|
| S1 end | Multi-tenant isolation + SQL injection fix demo | 70 |
| S2 end | CRM + HR full DDD compliance demo | 75 |
| S3 end | Frontend i18n + page consistency demo | 78 |
| S4 end | AIsha live voice demo with director | 82 |
| S5 end | Test quality dashboard (real coverage + mutation) | 85 |
| S6 end | Aisha DDD + Finance/Production DDD demo | 87 |
| S7 end | Monitoring + perf + observability demo | 90 |
| S8 end | Full system launch demo | 92 |

---

## 16. BIRINCHI QADAM (BUGUN BOSHLASH)

```bash
# 1. Plan'ni o'qing (sizning oldingiz)
cat MASTER_REMEDIATION_PROGRAM.md | head -200

# 2. Sprint 1 tasklarni TaskCreate orqali yarating (B + D squads, 25 task)
# (Orchestrator Agent buni avtomatik qiladi)

# 3. Squad B birinchi task — multi-tenant migration
git checkout -b feature/multi-tenant-migration

# 4. Squad D birinchi task — SQL injection fix
git checkout -b feature/sql-injection-fix

# 5. Worker agentlar paralel ish:
# - Backend worker A: B.1 task
# - Backend worker B: D.1 task

# 6. Har task tugaganda:
bash scripts/run-all-reviewers.sh       # Rule Enforcer
pnpm test                                # Test runner
git push origin <branch>                 # PR
# Code Reviewer agent dispatch via Agent tool

# 7. Sprint 1 demo (2 hafta keyin):
# - Multi-tenant isolation working
# - SQL injection vulnerability closed
# - All 22 rules PASS
# - V-score 65 → 70
```

---

## 17. BITTA JUMLALI MAQSAD

> **170 task × 11 agent rol × 8 sprint × 2 hafta = 16 haftalik kompleks remediation. Maqsad: V-score 65 → 92, real DDD 35 → 80%, test quality 36 → 85%, multi-tenancy ishlaydi, AIsha haqiqatan ishlaydi, audit log compliance, 0 known vulnerabilities. Subagent supervisor + code reviewer + rule enforcer har task uchun. Hech qanday "yarim ish" yo'q.**

---

## 18. MANBALAR

- `ARCHITECTURE_AUDIT_REPORT_V3_DEEP.md` — chuqur audit topilmalari
- `ARCHITECTURE_RULES.md` — 22 qoida
- `CLAUDE.md` — qo'llanma
- `TEST_AGENT_100_TASKS_PROMPT.md` — test pattern shablonlari
- `I18N_AGENT_100_TASKS_PROMPT.md` — i18n shablonlar
- `AISHA_AGENT_50_TASKS_PROMPT.md` — AIsha shablonlar
- `docs/aisha-final-report.md` — joriy AIsha holati (stub)
- `docs/i18n-final-report.md` — joriy i18n holati
- `docs/pages-audit-report.md` — sahifa salomatligi

---

## SPRINT 1 IMMEDIATE START — copy-paste qilish uchun

Orchestrator agent uchun birinchi xabar:

```
Begin Sprint 1 of EuroPrint ERP Master Remediation Program.

Read MASTER_REMEDIATION_PROGRAM.md sections 5 (Squad B), 7 (Squad D), 12.6
(Squad B prompt), and 12.8 (Squad D prompt).

Create the following tasks via TaskCreate (25 tasks total):
- B.1 through B.10 (Squad B — Multi-tenancy + Schema consolidation)
- B.11 through B.15 (Squad B — remaining DB tasks)
- D.1 through D.15 (Squad D — Security)

Dispatch:
- Squad B worker for tasks B.1, B.2 (in parallel)
- Squad D worker for tasks D.1 (start)

After each task PR opens:
- Dispatch Code Reviewer (see §12.2 prompt)
- Dispatch Rule Enforcer (see §12.3 prompt)
- Dispatch Test Quality Auditor (see §12.4 prompt)

If all 3 PASS — merge. Update docs/remediation-progress.md.
If any FAIL — re-dispatch worker with feedback.

Sprint 1 target:
- V-score 65 → 70
- Multi-tenant isolation working
- SQL injection vulnerability closed
- All 22 ARCHITECTURE_RULES still PASS
- Coverage 25% → 35%

Sprint 1 end: 2 weeks from today. Produce sprint demo report.

Go.
```
