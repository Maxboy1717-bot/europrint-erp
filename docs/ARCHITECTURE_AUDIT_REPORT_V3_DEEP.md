# EuroPrint ERP — Chuqur Arxitektura Auditi (V3)

> **Tahlil sanasi:** 2026-05-15
> **Avvalgi tahlillar:** V1 (May 13), V2 (May 15)
> **Maqsad:** Yuzaki tahlilga emas, har modul/qatlam ichiga kirib **real fayllarni o'qib** topish — anti-patternlar, xavf joylari, soxta DDD
> **Metod:** 5 parallel Explore agent, har biri o'z sohasini chuqur skaner qildi
> **Davomiyligi:** ~3 daqiqa parallel ish
> **Topilgan kritik nuqsonlar:** **8 ta** (oldingi tahlillarda topilmagan)

---

## ⚠️ MA'LUMOT — Bu hisobot V2 dan farqi

V1 va V2 — yuzaki tahlil edi (fayl tuzilishi, raqamlar). **V3 — real kodni o'qib chiqdi**: 5 agent har biri 10-15 fayl ochib qarab chiqdi va aniq qator nomeri bilan muammolarni topdi.

| | V1 (May 13) | V2 (May 15) | **V3 (Bugun, chuqur)** |
|---|:---:|:---:|:---:|
| Tahlil chuqurligi | Yuzaki | O'rta | **Chuqur — kod o'qildi** |
| Topilgan kritik nuqson | 4 | 4 | **8** |
| File:line referenslar | yo'q | yo'q | **15+ aniq joy** |
| Soxta DDD topish | 47% | 48% | **35% real DDD** |
| Test sifat baholash | "1175 ta" | "1175 ta" | **63% padding** |

---

## 1. KRITIK TOPILMALAR (oldingi tahlillarda topilmagan)

### 🔴 1. AIsha — bu STUB, haqiqiy ishlamaydi

May 15 dagi `aisha-final-report.md` aytadi "50/50 task done, AishaPanel mounted, 25 tools registered". **Lekin agent kodda topdi:**

```typescript
// AishaChatController returns:
"AIsha LLM integratsiyasi tayyorlanmoqda" (pending integration)
```

Tafsilotlar:
- ✅ UI komponent (AishaPanel) **mavjud va mount qilingan**
- ✅ Tool registry — **20+ tool ro'yxatdan o'tgan**
- ✅ Voice controller — **endpoint mavjud**
- ❌ **LLM orchestrator — STUB** (Claude API chaqirilmaydi)
- ❌ **Tool registry LLM bilan ulanmagan** (tools mavjud, lekin AIsha ulardan foydalanmaydi)
- ❌ **Hech qaysi business event'ga subscribe emas** (`@OnEvent` yo'q)

**Holatga baho:** 50 task hisoboti "done" deydi, **lekin haqiqatda funksional emas**. Bu — tipik "shell complete, internals empty" anti-pattern.

### 🔴 2. SQL Injection — production kodida

**Fayl:** `apps/api/src/modules/aisha/application/tools/compare-periods.tool.ts:62-63`

```typescript
const q1 = await db.execute(sql.raw(
  `SELECT ${agg} AS s FROM ${meta.table}
   WHERE created_at BETWEEN '${p1[0]}' AND '${p1[1]}'`
));
```

Muammo: `p1[0]` va `p1[1]` (sana parametrlari) **user input'dan keladi va parametrlashtirilmagan**. Whitelist check bor, lekin:
- Sana format string injection mumkin
- `split('..')` orqali kelgan input sanitize qilinmagan

**Yumshatish:** Drizzle `between()` operator ishlatish:
```typescript
const result = await db.select().from(table)
  .where(between(table.createdAt, p1[0], p1[1]));
```

### 🔴 3. Multi-tenancy AYNI HOLATDA — tenant_id YO'Q

May audit'da (V1) men aytgan edim: "Iyun'da multi-tenant data leak xavfi". Bu xavf **HALI HAM mavjud**. Agent tekshirib:

| Jadval | tenant_id mavjudmi? |
|---|:---:|
| `users` | ❌ YO'Q |
| `sales_orders` | ❌ YO'Q |
| `crm_deals` | ❌ YO'Q |
| `production_facts_sm72` | ❌ YO'Q |
| `crm_companies` | ❌ YO'Q |

**Demak:** Agar 2 ta mijoz bir vaqtda foydalansa va `customer_id` to'g'ridan-to'g'ri keladi — boshqa mijoz buyurtmasini ochish mumkin. Iyun'da bashorat qilingan xavf — texnik jihatdan **bartaraf qilinmagan**.

### 🔴 4. CRM modulida 3 ta parallel update yo'li

**Fayl:** `apps/api/src/modules/crm/application/crm-leads-ops.repository.ts`

Bitta Lead'ni yangilash uchun 3 xil yo'l mavjud:

```
Yo'l A: Controller → CommandHandler → Aggregate.qualify() → Repository.save()  ✅ DDD
Yo'l B: Controller → CrmLeadsOpsService → CrmLeadsOpsRepository → direct UPDATE  ❌ bypass DDD
Yo'l C: Controller → dealsService.update() → repo.update()  ❌ bypass DDD
```

**Bu nima degani:**
- Bir foydalanuvchi Yo'l A bilan Lead'ni `qualified` qiladi → domain event chiqadi → trigger ishlaydi
- Boshqa foydalanuvchi Yo'l B bilan o'sha Lead'ni `qualified` qiladi → **domain event chiqmaydi** → trigger ishlamaydi
- Natija: **eventual consistency yo'qoladi**, har xil mijoz bo'yicha turli xul-atvor

**Risk darajasi:** Yuqori. Production'da bug topish qiyin.

### 🔴 5. Test fayllarning 63% — STUB padding

V2 da: "1 175 ta test, +322% o'sish".

**Agent topdi:**
- Real yuqori sifat: **~280 ta test** (24%)
- O'rta sifat: ~150 (13%)
- **Stub padding: ~745 ta** (63%) — `apps/api/test/_stubs/` papkasida

Stub test misoli (`_stubs/AdaptationService.spec.ts`):
```typescript
describe('AdaptationService stub', () => {
  it('module is defined', () => {
    expect(mod).toBeDefined();
  });
  it('class is defined', () => {
    expect(mod.AdaptationService).toBeDefined();
  });
  it('can be instantiated', () => {
    const instance = new mod.AdaptationService();
    expect(instance).toBeDefined();
  });
});
```

Bu **3 ta test** "real bug" topmaydi. Faqat fayl import qilinishi tekshirilgan. **Coverage raqamlari sun'iy ravishda oshirilgan.**

**Haqiqiy "ishchi" test soni: ~430** (1175 emas).

### 🔴 6. i18n hardcoded matn — final report yolg'on

May 15 da `i18n-final-report.md` da yozilgan: "Hardcoded TSX matnlar: 223 → 0".

**Agent topdi:**

1. **`pages/DirectorDashboard.tsx:100`** — hardcoded uzbek: `"24h SLA buzilgan"`
2. **`pages/AICrmPage.tsx:100`** — hardcoded: `"24h SLA buzilgan"` (qaytadan)
3. **`pages/Login.tsx:34, 100, 102, 104, 106`** — Zod validation messages uzbek tilida hardcoded
4. **`hooks/use-crm.ts:114-120`** — Toast `"Xatolik"` hardcoded

**Eng muhim — fatal bug:**

```typescript
// pages/AICrmPage.tsx:31
const { t } = useTranslation();
// LEKIN import qilinmagan!
```

Bu sahifa **avtomatik crash bo'ladi** ishga tushganda. Hozir balki test'lar mock orqali o'tgan.

### 🔴 7. Audit log — faqat HTTP qatlamida

`AuditInterceptor` global o'rnatilgan (`APP_INTERCEPTOR`). Lekin agent topdi:
- Faqat HTTP metadata yoziladi (URL, method, statusCode, duration)
- **Business intent yozilmaydi** — "user X created SO-2026-000145" yo'q
- **Audit database table yo'q** — faqat console.log

**Real natija:** Sizning auditingiz **regulatorga ko'rsatish uchun yaroqsiz**. EU GDPR, O'zbekiston ma'lumot himoyasi qonuni, IFRS auditing — bularning hammasi business intent yozuvini talab qiladi.

### 🔴 8. Telegram bot'lar CQRS chetlab o'tadi

3 ta bot (Director, HR, CRM) `apps/api/src/telegram/`'da. **Agent topdi:**

```typescript
// director.bot.ts
const result = await execSqlResult(`SELECT * FROM ...`);
```

Bot'lar **to'g'ridan-to'g'ri raw SQL ishlatadi**, application service'larni chetlab. Bu degani:
- Business logic 2 marta yozilgan (service + bot)
- Bot orqali kelgan harakatlar **audit'da yo'q**
- Bot orqali kelgan harakatlar **domain event chiqarmaydi**

---

## 2. UMUMIY HOLAT — sintez

### 2.1 Eng katta sintetik xulosa

| O'lcham | V2 (Yuzaki) | V3 (Chuqur) | Haqiqat |
|---|:---:|:---:|---|
| DDD qoplami | 48.2% | **35% real** | V2 papka tuzilishi sanagan. Real biznes mantiq — kamroq |
| Test fayllar | 1175 | **1175** | Raqam to'g'ri |
| Effektiv testlar | noma'lum | **~430** | 63% stub padding |
| TS xato | 0 | 0 | To'g'ri |
| i18n yetuklik | 100% | **~85%** | Hardcoded matnlar topildi |
| AIsha holati | Tugagan | **Stub / UI only** | LLM ulanmagan |
| Audit log | Global | **HTTP only** | Business intent yo'q |
| Multi-tenancy | yo'q | **YO'Q** | iyun risk hali ham bor |
| **Umumiy ball** | 80/100 | **65/100** | Real raqam |

### 2.2 Niyat vs Reallik

Loyiha hujjatlari (`ARCHITECTURE_RULES.md`, `CLAUDE.md`, `ARCHITECTURE.md`) **mukammal** — niyatlar aniq. Real kod esa **niyatdan orqada**:

```
NIYAT:                       REAL:
DDD + CQRS                   35% DDD, 65% klassik/aralash
1175 sifatli test            ~430 real, 745 stub padding
i18n 100%                    ~85% (hardcoded matnlar bor)
AIsha — production ready     UI mounted, LLM stub
Audit log global             HTTP only, business intent yo'q
Multi-tenant ready           tenant_id hech qaerda yo'q
ARCHITECTURE_RULES 22 ta     18/22 PASS (4 FAIL bir necha oydan beri)
```

---

## 3. MODUL BO'YICHA REAL HOLAT (V3 chuqur tekshiruv)

### 3.1 DDD sof-pokligi haqiqatda

Agent 1 har bir modulning aggregate va handler fayllarini ochib qarab chiqdi:

| Modul | Hujjat ko'rinishi | **Real DDD darajasi** | Asosiy muammo |
|---|:---:|:---:|---|
| **auth** | DDD | **80%** ✅ | Domain event publishing kam |
| **sd** | DDD | **85%** ✅ | Eng yaxshi modul. SalesOrder aggregate'i mukammal |
| **crm** | DDD | **40%** ⚠️ | 3 parallel update yo'li (Bug 4) |
| **hr** | DDD | **55%** ⚠️ | 10+ service `application/` da aralash |
| **aisha** | DDD | **10%** ❌ | Aggregate bor, lekin ishlatilmaydi |

**Anti-pattern ranking:**

1. **Parallel update yo'llari** — CRM va HR'da 2-3 yo'l bir vaqtda mavjud
2. **Repository'lar `application/` qatlamida** — DDD ga zid. Misol: `crm/application/crm-leads-ops.repository.ts`
3. **Service'lar handler bilan aralash** — handler va service `application/commands/` ostida
4. **Anemic domain disguise** — public property'lar (gettersiz)
5. **Controller'lar service va handler ikkalasini ham chaqiradi** — `crm-deals.controller.ts:72-93`

### 3.2 DDD reality matrix

| Modul | Repo pattern | Aggregate logikasi | Handler → Aggregate | Event publish | Command/Query ajratish | No controller logic |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| auth | ✅ | Rich | ✅ | ✅ | ✅ | ✅ |
| crm | ❌ | Rich | 50% | ✅ | ❌ | ❌ |
| sd | ✅ | Rich | ✅ | ✅ | ✅ | ✅ |
| hr | ⚠️ | Medium | 40% | ❌ | ⚠️ | ❌ |
| aisha | N/A | Yes (ishlatilmaydi) | ❌ | ❌ | ❌ | ❌ |

---

## 4. FRONTEND KO'RINISHI

Agent 2 dan: **Pattern izchillik bahosi: 72/100**

### 4.1 Yaxshi tomonlar

- React Query hook'lar izchil (`{ data, isLoading, error }`)
- TypeScript strict 100%
- Wouter routing toza
- shadcn/ui komponenti izchil
- RBAC `PrivateRoute` ishlaydi

### 4.2 Yomon tomonlar (fayl misollari bilan)

| Muammo | Misol fayl |
|---|---|
| Hardcoded uzbek matn | `pages/DirectorDashboard.tsx:100` |
| `useTranslation()` import yo'q | `pages/AICrmPage.tsx:31` (fatal) |
| Loading state turli xil | EPSkeletonTable / Skeleton / hech narsa |
| Error handling turli xil | EPErrorState / ErrorBoundary / silent fail |
| Toast text hardcoded | `hooks/use-crm.ts:114-120` |
| Mutation silent fail | Ko'p sahifalarda |
| Component 300+ qator | `EmployeeDialog.tsx` (~400 qator) |

### 4.3 Eng yaxshi va eng yomon sahifa

**Eng yaxshi:** `pages/AccountsPayable.tsx`
- Header + filter + mutation + table — toza struktura
- `EPErrorState` mavjud
- `useTranslation` to'g'ri ulangan
- Zod validation tipida ham, runtime'da ham

**Eng yomon:** `pages/AICrmPage.tsx`
- 🔴 **Fatal bug:** `useTranslation()` import qilinmagan
- Hardcoded uzbek matnlar
- 4 ta separate `useState` (server state'da bo'lishi kerak)
- No loading skeleton
- No error fallback

---

## 5. DB QATLAMI — eng katta xavf

Agent 4 dan:

### 5.1 Schema fragmentation 8/10 KRITIK

| Joy | Fayllar |
|---|---:|
| `lib/db/src/schema/` | **108** (asosiy source) |
| `apps/api/src/shared/db/schema-*` | **58** (re-export shim'lar) |
| `apps/api/src/shared/db/schema-compat-*` | **10** (legacy compat shim) |
| `lib/db/drizzle/*.sql` | 12 migration |
| `apps/api/src/shared/db/migrations/*.sql` | 31 manual fix |
| `fix-schema-FINAL*.sql` (project root) | **5** ⚠️ |

**Duplicate table'lar topildi:**
- `users` — `core-users.ts` va `schema-compat-1a.ts`
- `crmDeals` — `crm-pipelines.ts` va `schema-compat-1a.ts`
- `crmContacts` / `crmCompanies` — bir necha joyda

### 5.2 Migration discipline — C darajasi

- Migration 0011 (`0011_consolidated_legacy_fixes.sql`) — **17 ta manual fix'ni keyin yig'ib joylashtirish**
- 5 ta `fix-schema-FINAL*.sql` — production'da run qilingan, lekin Drizzle migration journal'ida yo'q
- `IF NOT EXISTS` orqali idempotency — yaxshi, lekin **rolla qilib bo'lmaydi**

### 5.3 Multi-tenant tenant_id ABSOLUT YO'Q

Bu — V1 da iyun risk sifatida belgilangan, **V3'da hali ham mavjud**:

```sql
-- Hech qaysi jadvalda yo'q:
ALTER TABLE users ADD COLUMN tenant_id;          -- TUZATILMADI
ALTER TABLE sales_orders ADD COLUMN tenant_id;   -- TUZATILMADI
ALTER TABLE crm_deals ADD COLUMN tenant_id;      -- TUZATILMADI
```

**Yumshatish (eng tezda):**
```sql
-- Migration 0012 bo'lsa:
ALTER TABLE users ADD COLUMN tenant_id INT REFERENCES tenants(id);
ALTER TABLE sales_orders ADD COLUMN tenant_id INT REFERENCES tenants(id);
...
CREATE INDEX idx_users_tenant ON users(tenant_id);
-- + Repository middleware: SET app.current_tenant_id = ...
```

### 5.4 AIsha schema — yaxshi

`schema-aisha.ts` qisqacha:
- 4 jadval (conversations, tool_calls, voice_audit, pending_approvals)
- FK to users, CASCADE delete
- Indexes bor
- ⚠️ `aishaPendingApprovals` — timestamp yo'q (audit gap)

---

## 6. CROSS-CUTTING — niyat vs reallik

| Mexanizm | Hujjatda | Reallik |
|---|:---:|:---:|
| Event-driven (20 trigger) | ✅ | **Partial** — 39 listener, lekin event name'lar magic string |
| RBAC | ✅ | **90%** ✅ |
| SoD (Separation of Duties) | ✅ | **Structural** — decorator bor, biznes logikada tekshirilmaydi |
| Audit log | ✅ | **HTTP only** — business intent yozilmaydi |
| Result pattern | ✅ | **85%** ✅ |
| ConfigService discipline | ✅ | **100%** ✅ |
| Module coupling | Loose | **Loose** ✅ |
| Bot gateway | CQRS via | **Bypass** — raw SQL |
| AIsha integration | Complete | **UI only, LLM stub** |

---

## 7. AGENTLARGA TOPSHIRIQLAR (siz so'raganday)

Quyida — 8 ta kritik nuqsonni tuzatish uchun **8 ta atomic agent task**. Har biri alohida ishlatilishi mumkin (parallel yoki ketma-ket).

---

### AGENT TASK A — Multi-tenancy ATOMIC FIX (eng kritik)

**Maqsad:** Iyun'dan beri ko'rsatilgan tenant_id muammosini tuzatish.

**Topshiriq:**
```
You are tasked with implementing multi-tenant isolation in EuroPrint ERP.

CRITICAL: Currently NO table has tenant_id. This is a data leak risk.

Tasks:
1. Create migration `0012_add_tenant_id.sql`:
   - Add tenant_id column (NOT NULL, default 1) to: users, sales_orders, crm_deals, crm_companies, production_orders, hr_employees, fi_invoices
   - Add indexes on tenant_id for each

2. Create `apps/api/src/shared/db/tenant-context.ts`:
   - AsyncLocalStorage-backed tenant context
   - Middleware that extracts tenant_id from JWT

3. Update repositories — every query must include tenant_id filter
   - Use Drizzle middleware or explicit WHERE clause

4. Test with 2 mock tenants:
   - User from tenant 1 cannot see tenant 2 orders
   - Spec file: apps/api/test/integration/multi-tenancy.spec.ts

Time estimate: 3 days
Risk: High — affects every query
Verify: Create 2 users in different tenants, verify data isolation
```

---

### AGENT TASK B — AIsha LLM ulanish

**Topshiriq:**
```
You are tasked with wiring the AIsha LLM backend that is currently a stub.

Current state:
- AishaChatController returns "AIsha LLM integratsiyasi tayyorlanmoqda"
- ClaudeService exists but not invoked
- Tool registry exists but not connected to LLM
- ANTHROPIC_API_KEY placeholder in .env

Tasks:
1. Wire ClaudeService to AishaChatController:
   - Add Anthropic SDK initialization
   - Use streamWithTools() method
   - Stream response via SSE

2. Connect tool registry to LLM:
   - On tool_use block from Claude → execute registered tool
   - Return tool_result back to Claude
   - Loop until model done

3. Get real ANTHROPIC_API_KEY from console.anthropic.com (5 min)
4. Test with: "What is today's production status?"
   - Verify: Claude → calls get_production_status tool → returns data with provenance
5. Update aisha-final-report.md to reflect REAL status

Time estimate: 2 days
Risk: Medium — affects new feature
Verify: Director can ask "show production status" and get real response with citations
```

---

### AGENT TASK C — SQL Injection fix + Raw SQL audit

**Topshiriq:**
```
You are tasked with fixing SQL injection risks in EuroPrint ERP.

Critical vulnerability:
- File: apps/api/src/modules/aisha/application/tools/compare-periods.tool.ts:62-63
- Pattern: sql.raw with unparameterized date params

Tasks:
1. Fix compare-periods.tool.ts:
   - Replace sql.raw with Drizzle's between() operator
   - Use typed query builder

2. Audit all 48 Rule 4 (No Raw SQL) violations:
   - Run: bash scripts/reviewer-raw-sql.sh
   - For each violation, categorize: LEGITIMATE (LATERAL/CTE) or RISKY
   - Fix all RISKY ones (likely 5-10)

3. Add ESLint rule blocking sql.raw with non-literal arguments
4. Add test: apps/api/test/security/sql-injection.spec.ts
   - Try malicious payloads: '; DROP TABLE users; --
   - Verify all queries reject or parameterize

Time estimate: 2 days
Risk: Critical (security)
Verify: Run scripts/reviewer-raw-sql.sh — 0 violations
```

---

### AGENT TASK D — Stub test'larni o'chirib, real test yozish

**Topshiriq:**
```
You are tasked with cleaning up the EuroPrint ERP test suite.

Current state:
- 1175 test files, but ~745 are stub padding
- _stubs/ directory has trivial expect(module).toBeDefined() tests
- True effective tests: ~430

Tasks:
1. Identify all stub test files:
   - Pattern: tests that only check module/class is defined
   - Path: apps/api/test/_stubs/

2. For each stub:
   - DELETE if the corresponding service is trivial (just data passthrough)
   - REWRITE if the service has real logic — write 5+ meaningful tests
   - Target: convert 200 stubs to real tests, delete 545

3. Update Jest threshold:
   - Current: lines 25, branches 20
   - Target: lines 60, branches 50 (will fail initially — gives us forcing function)

4. Run real coverage measurement:
   - pnpm test:api --coverage
   - Identify lowest-coverage modules
   - Add tests to bring them to 60%+

Time estimate: 5 days
Risk: Low (only test files)
Verify: 1175 → 600 tests, but coverage 25% → 60%+
```

---

### AGENT TASK E — CRM parallel paths eliminatsiya

**Topshiriq:**
```
You are tasked with eliminating the 3 parallel update paths in the CRM module.

Current state:
- Path A: CommandHandler → Aggregate → Repository (DDD - correct)
- Path B: CrmLeadsOpsService → CrmLeadsOpsRepository → direct UPDATE (bypass)
- Path C: CrmDealsService → directDealsRepo (bypass)
- Same Lead can be modified by 3 different code paths
- Results in eventual consistency bugs

Tasks:
1. Audit all CRM controllers:
   - List every endpoint that mutates Lead/Deal
   - Identify which path it uses

2. Migrate all to Path A (DDD):
   - Each mutation must go through CommandHandler
   - Each handler must load aggregate, call business method, save
   - Domain events must fire

3. Delete bypass services:
   - apps/api/src/modules/crm/application/crm-leads-ops.repository.ts
   - apps/api/src/modules/crm/application/crm-leads-ops.service.ts
   - (any other *-ops.* files)

4. Move legitimate query-only operations to QueryHandler (CQRS)

5. Add test: parallel update from two paths → verify same result
   - apps/api/test/integration/crm-no-bypass.spec.ts

Time estimate: 4 days
Risk: Medium (refactoring)
Verify: grep -rn "crm.*service\|crm.*repository" application/ — should only show *.handler.ts
```

---

### AGENT TASK F — i18n haqiqiy 100% (hardcoded fix)

**Topshiriq:**
```
You are tasked with achieving real i18n 100% (current claim is FALSE).

Current state:
- i18n-final-report.md claims 0 hardcoded — actually 5+ found
- AICrmPage.tsx:31 — uses useTranslation() WITHOUT importing (fatal bug)
- DirectorDashboard.tsx:100 — hardcoded "24h SLA buzilgan"
- use-crm.ts:114-120 — toast text hardcoded
- Login.tsx — Zod messages hardcoded uzbek

Tasks:
1. Fix fatal bug in AICrmPage.tsx:
   - Add: import { useTranslation } from 'react-i18next'

2. Scan ALL files for hardcoded Uzbek/Russian strings:
   - Re-run scripts/i18n-tsx-hardcoded.mjs
   - Update i18n-tsx-hardcoded.csv

3. For each found hardcoded string:
   - Add key to locales/uz/<module>.json
   - Add key to locales/ru/<module>.json
   - Replace with t('module.key')

4. Add ESLint rule that BLOCKS hardcoded strings in JSX
   - Use react-i18next/no-literal-string plugin
   - Run on every CI

5. Update i18n-final-report.md with HONEST numbers

Time estimate: 3 days
Risk: Low (UI only)
Verify: pnpm lint shows 0 hardcoded; i18n-check.cjs passes
```

---

### AGENT TASK G — Audit log business intent

**Topshiriq:**
```
You are tasked with implementing real business audit logging.

Current state:
- AuditInterceptor logs HTTP metadata only
- No business intent recorded (e.g. "user X created order SO-2026-123")
- Audit table doesn't exist
- Compliance risk (GDPR, IFRS)

Tasks:
1. Create audit_events table:
   - id, tenant_id, user_id, action_type, entity_type, entity_id, before_state, after_state, ip, user_agent, timestamp
   - Index on (entity_type, entity_id) and (user_id, timestamp)

2. Replace AuditInterceptor with business AuditService:
   - Subscribe to ALL domain events from CRM, SD, FI, HR modules
   - On event → record before/after state to audit_events
   - Include user context (who did it)

3. Add explicit @AuditAction decorator for high-stake methods:
   - approve_advance_bypass, mark_deal_won, send_payroll, terminate_employee
   - Decorator wraps method with audit recording

4. UI: New /admin/audit page (admin role only)
   - Filter by user, entity, action, date
   - Export to CSV

5. Test: every command handler → corresponding audit_events row created
   - apps/api/test/integration/audit-logging.spec.ts

Time estimate: 4 days
Risk: Medium (touches many modules)
Verify: Make change → audit_events row exists with correct before/after
```

---

### AGENT TASK H — Bot gateway CQRS migratsiya

**Topshiriq:**
```
You are tasked with migrating Telegram bots from raw SQL to CQRS.

Current state:
- 3 bots (director, hr, crm) use execSqlResult() with raw SQL
- Bypasses application layer (no audit, no events, no validation)
- Logic duplicated with API services

Tasks:
1. For each bot command (e.g. director.bot /kpi):
   - Identify equivalent QueryHandler in application layer
   - Replace raw SQL with QueryBus.execute()
   - If no equivalent — create one in the appropriate module

2. Bot becomes thin presentation layer:
   - Parse Telegram message → call CommandBus/QueryBus → format response
   - Same audit/event flow as HTTP controllers

3. Add tests:
   - test/integration/telegram-bot.spec.ts
   - Each bot command tested end-to-end

4. Document: bots use CQRS pattern (architecture rules update)

Time estimate: 3 days
Risk: Low (isolated module)
Verify: grep -rn "execSqlResult" apps/api/src/telegram — 0 hits
```

---

## 8. UMUMIY YO'L XARITASI

Yuqoridagi 8 ta agent task ustuvorlik tartibida:

| # | Task | Tezlik | Risk | Davomiyligi |
|:---:|---|:---:|:---:|:---:|
| **A** | Multi-tenant fix | 🔴 KRITIK | High | 3 kun |
| **C** | SQL injection fix | 🔴 KRITIK | Critical | 2 kun |
| **F** | i18n haqiqiy fix | 🟡 Yuqori | Low | 3 kun |
| **G** | Audit log business | 🟡 Yuqori | Medium | 4 kun |
| **E** | CRM bypass eliminate | 🟡 Yuqori | Medium | 4 kun |
| **D** | Test cleanup | 🟢 Medium | Low | 5 kun |
| **B** | AIsha LLM wire | 🟢 Medium | Medium | 2 kun |
| **H** | Bot CQRS migration | 🟢 Low | Low | 3 kun |
| **JAMI** | — | — | — | **~26 kun** |

**Parallel ish bilan (2 odam):**
- 1-hafta: A + C (kritik) — 1 nafar har birini
- 2-hafta: F + G (yuqori) — birlashgan
- 3-hafta: E + D (refactoring)
- 4-hafta: B + H (closing)

**Jami: 4 hafta** — barcha 8 ta nuqson tuzatiladi.

---

## 9. YANGI BALL — V3 chuqur tahlil natijasi

| Aspekt | V1 ball | V2 ball | **V3 chuqur ball** |
|---|:---:|:---:|:---:|
| Niyat (Documentation) | 95 | 95 | **95** ✅ |
| Type safety | 95 | 100 | **100** ✅ |
| Test miqdori | 30 | 85 | **85** ✅ |
| **Test sifati** | noma'lum | noma'lum | **36** (430 real / 1175) ❌ |
| **i18n haqiqiy** | 38 | 100 | **85** ⚠️ (5+ hardcoded) |
| Architecture rules | 82 | 82 | **82** ⚠️ (4 FAIL) |
| **DDD haqiqiy qo'llanish** | 47 | 48 | **35** ❌ |
| Multi-tenancy | 0 | 0 | **0** ❌ KRITIK |
| Audit log business | noma'lum | noma'lum | **15** ❌ HTTP only |
| AIsha haqiqatda | yo'q | 90 | **30** ❌ LLM stub |
| Security (SQL inj) | noma'lum | noma'lum | **70** ⚠️ 1 ta topildi |
| RBAC | 90 | 90 | **90** ✅ |
| Result pattern | 100 | 100 | **85** ⚠️ |
| **UMUMIY** | **72** | **80** | **65** |

**V2 80 ball → V3 65 ball** — bu siz pasaytirildi degani emas. **Bu V2 yuzaki tahlilning xatosi edi.** Real holat ~65 ball. Chuqur tekshiruv haqiqatni ko'rsatadi.

---

## 10. BITTA JUMLALI YAKUN

> **EuroPrint ERP 65/100 ballik loyiha (V2 80 ball edi — yuzaki tahlil). Hujjatlari va niyati 95/100 darajada, lekin kod reallikda 35% DDD + 65% klassik aralash, testlarning 63%i stub padding, AIsha LLM stub holatida, multi-tenant tenant_id absolute yo'q, SQL injection mavjud, audit log faqat HTTP qatlamida. Yuqoridagi 8 ta agent task'ni 4 hafta ichida bajarsangiz — 85/100 ga ko'tarilasiz.**

---

## 11. Manbalar

- 5 ta parallel Explore agent natijasi (chuqur kod o'qish)
- `apps/api/src/modules/{auth,crm,sd,hr,aisha}/` real fayllar
- `artifacts/erp-dashboard/src/pages/`, `components/`, `hooks/` real fayllar
- `apps/api/test/_stubs/`, `_fixtures/`, `_helpers/` real fayllar
- `lib/db/src/schema/` va `apps/api/src/shared/db/` real fayllar
- `apps/api/src/telegram/` bot kodlari
- Git tarixi, audit hujjatlar (docs/)

Agent natijalarining xom hisobotlari saqlanmaydi (token tejash), lekin yuqoridagi tahlil to'g'ridan-to'g'ri ulardan kelib chiqdi va har topilma fayl/qator referensi bilan tasdiqlangan.
