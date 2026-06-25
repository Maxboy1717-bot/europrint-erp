# FAZA 08 — Daraxt yagonaligi + manager-zanjir (BAJARUVCHI DIREKTIVASI)

> **Bajaruvchi:** Muslimbek (🟢 Bajaruvchi roli — Qoida 23).
> **Manba-reja:** [`00-MASTER-REJA.md`](00-MASTER-REJA.md) — FAZA 8.
> **Vizyon-audit:** [`ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`](../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md) — mavzular `tree` (38%) + `manager` (42%).
> **EP-ORG spec:** [`decisions/01-org-kartalar.md`](../decisions/01-org-kartalar.md) — EP-ORG-019/021/022/099/100/101/102/103.
> **Vysotskiy-7:** [`docs/migration/02-vysotskiy-7-tree.md`](../../migration/02-vysotskiy-7-tree.md).
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, hech qanday noaniqliksiz.

---

## 0. ROL VA KIRISH (Qoida 23, Q-27)

Sen 🟢 **Bajaruvchi**san. Bu direktivada AYNAN ko'rsatilgan vazifani bajarasan — qo'shimcha
"yaxshilash", "tozalash", scope-creep YO'Q (feedback_no_scope_creep). Faqat shu faza fayllari.
Bir vaqtning o'zida FAQAT BITTA bajaruvchi (worktree overlap tekshir: `git worktree list`).

Sessiya boshida (Q-24):
```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
cat CLAUDE.md | head -5            # konstitutsiya yuklanganini tasdiqla
git status && git log --oneline -5 && git branch --show-current
# backend tirikmi (Q-44): :3030 health
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/api/auth/health || echo "server down"
```

---

## 1. KONTEKST + MAQSAD

### 1.1 Vizyon (nima uchun bu faza bor)

EuroPrint ERP ning "miyasi" = org-struktura. Vizyon (EP-ORG-021): **YAGONA daraxt**, har node = KARTA,
7 qatlam, ota-karta = rahbar. Ikki harakat:

- **VERTIKAL bo'ysunish** (EP-ORG-021/022): Operator → Smena → Bo'lim → Otdeleniye → CEO → Egasi.
  `manager_id` = daraxtdagi **keyingi yuqori** node ning `head_user_id` (NULL bo'lsa sakrab yuqoriga,
  "dept head" EMAS — har shox turli chuqurlikda). Vakant rahbar bloklamaydi, sakrash YO'Q (no-skip).
- **GORIZONTAL marshrut** (EP-ORG-103, vizyon §2.3): bo'limlararo tasdiq yo'llari — `workflow_rules`
  jadval (config). Masalan "Avans ariza: Sales → Finance>Cashier".

### 1.2 Bu fazaning ANIQ maqsadi (faqat shu — boshqasi emas)

1. **Daraxt yagonaligi**: hozir **14 ildiz** (parent_id NULL) + **dublikat otdeleniye to'plami** +
   **buzuq shox** (CEO node 20 → position node 115 ostida osilgan). Vizyon: **1 Egasi-ildiz → CEO → 7 otdeleniye**.
2. **otdeleniye_no (1-7) maydoni** (EP-ORG-019): har otdeleniye-darajadagi kartada majburiy 1-7 raqam.
3. **manager_id backfill ishga tushadi** (vizyon root-cause #7): mexanizm (`backfillManagerIds`) BOR,
   lekin DATA-darvoza yopiq (head_user_id 18/139) — bu faza darvozani strukturaviy YOPADI va owner
   data to'lgach ishga tushadigan qiladi.
4. **workflow_rules gorizontal-marshrut config UI** — backend CRUD + FE sahifa BOR (0 qator);
   bu faza FE ni **ID-input → dropdown-picker** ga yaxshilaydi (haqiqiy bo'lim/lavozim tanlash).
5. **Eskalatsiya-zinasi + no-skip** mexanizmi: approval-chain (WITH RECURSIVE) BOR — bu faza unga
   `escalation_level` config maydonini qo'shadi va vakant-rahbar-sakrash invariantini tasdiqlaydi.

### 1.3 FABRIKATSIYA TAQIQ (Q-40, Q2)

`head_user_id` (kim-kimni-boshqaradi), 7-otdeleniye ro'yxati, `workflow_rules` qatorlari, `otdeleniye_no`
qiymatlari = **egasi/HR DATA**. Sen STRUKTURA + GATE + admin-amal + UI quryapsan; SOXTA qiymat
YOZMAYSAN. "1 Egasi-ildiz" ham — agar dublikat shox qaysi biri kanonik ekani noaniq bo'lsa, owner-data
ro'yxatiga yozasan, taxmin bilan birlashtirmaysan (pastdagi §5 ko'r).

---

## 2. QOIDALAR-BLOKI (HAR BOSQICHDA majburiy — Q-37)

### 2.1 Kod uslubi
- **Result<T>**: har repo/service metodi `Promise<Result<T>>` (Qoida 1). `throw`/`null`/`undefined` YO'Q
  (controller ichida `unwrapOrInternal`/`unwrapOrNotFoundDefined` bilan ochiladi).
- **Zod**: har `@Body()`/`@Query()` Zod schema bilan (`.parse`); `.strict()` mass-assignment guard (Qoida 3).
- **Drizzle**: oddiy CRUD = Drizzle ORM. Raw SQL faqat WITH RECURSIVE / cross-module UPDATE kabi
  murakkab holatda + `RULE4_EXCEPTION:` izoh (Qoida 4). Parametrli (`sql\`... ${x}\``) — `sql.raw(var)` TAQIQ (Qoida B).
- **Array xavfsizligi**: `.map/.filter/...` oldidan `Array.isArray()` (Qoida 2).
- **Fayl ≤900 qator, funksiya ≤150** (Qoida 13).
- **ConfigService** — `process.env` to'g'ridan YO'Q (Qoida 7).

### 2.2 Regress-himoya (Q-39, Q-46, Q3)
- Ishlab turgan + to'g'ri kod/element **HECH QACHON o'chmaydi** (dizayn moslash bahonasida ham).
  `getApprovalChain`, `getDirectManager`, `deriveManagerForNode`, `backfillManagerIds`, `move()`
  cycle-check — BARCHASI ishlaydi, TEGMAYSAN (faqat kengaytirasan).
- Buzuq/o'lik/dublikat kod **TO'LIQ** o'chiriladi (chala emas) — lekin o'chirishdan oldin Q-29 verify
  (ishlamasligini DB+grep bilan tasdiqla) + import-yo'qligini tekshir.
- `getDirectManager` (legacy COALESCE-self model) RETIRED-deb belgilangan lekin ishlatilmoqda
  (`/direct-manager` endpoint) → **TEGMA** (Q-46: ishlayotgan kod). Faqat `deriveManagerForNode`
  kanonik (manager-chain).

### 2.3 Verify (Q-29, Q-32, Q-40)
Har bosqich oxiri:
1. **tsc GREEN** — o'z fayllarda 0 xato.
2. **rollback-tx DB-proof** (`_audit/bproof-*.cjs`): kirit → oqdi → ko'rindi → ROLLBACK (data o'zgarmaydi).
   Namuna `_audit/bproof-card-manager.cjs` da. READ-ONLY tekshiruv = `node _audit/q.cjs "SELECT ..."`.
3. **Jonli isbot** — server tirik bo'lsa curl bilan; tushgan bo'lsa (Q-44 Windows nest-watch) static
   fallback (tsc + diff + DB-proof), jonli isbot server qaytgach.
- Struktura-only YETARLI EMAS. "Yashil lekin noto'g'ri" (fake/echo/hardcoded) TAQIQ.

### 2.4 Migration (Q-35)
- **`migrations-schema.ts`** (`SCHEMA_MIGRATIONS` array) = boot-time idempotent runner. Yangi ustun =
  shu array ga `{ name, sql: 'ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...' }` qo'shiladi.
- Yangi `CREATE TABLE`/`DROP`/`.sql` fayl = faqat `APPROVED: Claude (egasi vakolati) <sana>` izoh bilan.
- Bu fazada **DROP TABLE YO'Q**. Faqat: ALTER ADD COLUMN (otdeleniye_no/escalation_level) +
  DATA-tuzatish migration (buzuq parent_id) — `APPROVED` izoh + DATA-darvoza bilan.

### 2.5 Dizayn (Qoida 21/41/42/43, Q3)
- EP token `var(--ep-*)` + komponent `components/ep` (EPPageHeader/EPCard/EPStatusPill/EPSkeletonTable/
  EPEmptyState/EPErrorState) + `components/ui` (Select/Input/Button/Table/ConfirmDialog). Xom rang/inline-style TAQIQ.
- Tab ≤2 daraja. Har forma REAL saqlaydi (FE mutation → BE → DB → qayta-yuklashda ko'rinadi: F1/F2).
- Mavjud joylashuv saqlanadi; ishlayotgan element yo'qolmaydi.

### 2.6 Commit (Qoida 23, GIT_QOIDALARI)
- Faqat o'z fayl: `git add <aniq-fayl>` (HECH QACHON `-A`/`.`). `--no-verify`. Co-Authored-By.
- Har bosqichda commit (atomik).

### 2.7 KARTA atamasi
Muloqotda doim "karta" (node/tugun emas). Bu fazada "otdeleniye-karta", "CEO-karta", "ildiz-karta".

---

## 3. JORIY HOLAT (fayl:satr + DB-fakt — JONLI tasdiqlangan 2026-06-25)

### 3.1 DB-fakt (jonli `node _audit/q.cjs` bilan tekshirilgan)

| Fakt | Qiymat | Manba (jonli so'rov) |
|------|--------|----------------------|
| Ildizlar (parent_id NULL, is_active) | **14 ta** | `SELECT COUNT(*) FROM org_departments WHERE parent_id IS NULL AND is_active` |
| Ildiz ID lari | 19, 21, 23, 24, 26, 28, 32, 33, 34, 35, 36, 44, 155, 157 | ↑ |
| `owner` node | id **19** ("Ma'muriyat", level 0, head=34) | ildiz ro'yxati |
| `ceo` node | id **20** ("Bosh Direktor ofisi", level 5, head=35) | `node_type='ceo'` |
| ⚠️ CEO buzuq parent | **20.parent_id = 115** ("IT Mutaxassis", node_type=**position**!) | zanjir tekshiruvi |
| Buzuq zanjir | 20 → 115(position) → 64(position "Bosh Direktor") → 49(department) → 44(department, ROOT) | WITH RECURSIVE up |
| Dublikat otdeleniye A | 37,38,40,41,43 (CEO 20 ostida) + 39,42 (37 ostida) | `node_type='otdeleniye'` |
| Dublikat otdeleniye B | 155,157 (ORPHAN ROOT) + 158(157 ostida), 160(155 ostida) | ↑ |
| `otdeleniye` jami | ~11 ta, level 0-4 ga sochilgan | node_type dist |
| head_user_id to'la | **18 / 139** (121 NULL) | `COUNT(head_user_id)` |
| `employees.manager_id` NULL/0 | **30 / 30** | `COUNT(*) FILTER (...)` |
| `org_functions.manager_id` NULL/0 | **97 / 97** | ↑ |
| `otdeleniye_no` ustun | **YO'Q** (mavjud emas) | information_schema.columns |
| `escalation_level` ustun | **YO'Q** | ↑ |
| `no_code` (НО-kod) ustun | **YO'Q** | ↑ |
| `workflow_rules` jadval | MAVJUD (to'liq schema) | information_schema |
| `workflow_rules` qatorlar | **0** | `SELECT COUNT(*)` |

### 3.2 Kod holati (fayl:satr — JONLI o'qilgan)

**Backend (ishlaydi — TEGMA, faqat kengaytir):**
- `apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts`
  - `getHierarchyNodes()` :21 — daraxt o'qish (parent_id+head_user_id+razryadLevelId).
  - `getApprovalChain(nodeId)` :185 — WITH RECURSIVE chain (depth<10), head_user_id zanjiri. **ISHLAYDI.**
  - `getDirectManager(nodeId)` :209 — legacy COALESCE(parent.head, node.head) model. **RETIRED-belgili, lekin ishlatiladi → TEGMA.**
  - `deriveManagerForNode(nodeId)` :303 — **KANONIK** WITH RECURSIVE ancestor-walk (NULL-skip, depth<10). **ISHLAYDI.**
- `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts`
  - `move(id, newParentId, level)` :128 — parent_id+level UPDATE. **ISHLAYDI** (cycle-check service'da).
  - `backfillManagerIds(dryRun=true)` :198 — DATA-gated (nullHeadCount===0) + dryRun. org_functions +
    employees manager_id ni WITH RECURSIVE bilan to'ldiradi. **ISHLAYDI, lekin DATA-darvoza yopiq.**
- `apps/api/src/modules/org-structure/org-structure.service.ts`
  - `move(id, newParentId)` :152 — inline cycle-detector (self + ancestor-cycle). **ISHLAYDI.**
  - `deriveManagerForNode` :260, `triggerManagerBackfill(dryRun)` :277. **ISHLAYDI.**
- `apps/api/src/modules/org-structure/org-structure.controller.ts`
  - `PATCH nodes/:id/move` :199, `GET nodes/:nodeId/approval-chain` :372, `GET manager-chain/:nodeId` :400,
    `POST admin/backfill-manager-ids` :413 (@Roles super_admin/hr). **ISHLAYDI.**
  - `OrgNodeSchema` :37-72 — node create/update DTO (.strict()). **`otdeleniye_no` YO'Q — qo'shasan.**

**workflow_rules (gorizontal — backend TO'LIQ, FE ID-input):**
- `apps/api/src/modules/director/presentation/workflow-rules.controller.ts` :63 — `@Controller('coordination/workflow-rules')`,
  GET/POST/PUT/DELETE + `GET resolve`. @Roles READ=[manager,director,super_admin], WRITE=[director,super_admin]. **ISHLAYDI.**
- `apps/api/src/modules/director/infrastructure/repositories/workflow-rules.repository.ts` — list/resolve/CRUD typedExecute. **ISHLAYDI.**
- `apps/api/src/shared/db/migrations/workflow-rules-2026-06-20.sql` — jadval DDL (APPROVED). **MAVJUD.**
- `artifacts/erp-dashboard/src/pages/WorkflowRules.tsx` — FE sahifa (EPPageHeader/EPCard, useQuery+useMutation,
  ConfirmDialog). **ISHLAYDI**, lekin manba/tasdiqlovchi bo'lim/lavozim = **raw `<Input type=number>` ID** (190-224).
  Bu faza → **dropdown picker** (bo'lim/lavozim nomi bilan).
- `artifacts/erp-dashboard/src/components/sidebar/constants.ts:629` — sidebar entry MAVJUD.
- `artifacts/erp-dashboard/src/routes/DirectorRoutes.tsx:32,42` — route MAVJUD.

**Migration runner:**
- `apps/api/src/shared/db/invariants/migrations-schema.ts` — `SCHEMA_MIGRATIONS` array (boot-time, idempotent
  `IF NOT EXISTS`). Yangi ALTER ADD COLUMN shu yerga.

### 3.3 Bo'shliqlar (bu faza yopadi)

| # | Bo'shliq | Holat |
|---|----------|-------|
| G1 | 14 ildiz (1 bo'lishi kerak) | DATA + DDL-fix (owner-gated) |
| G2 | Dublikat otdeleniye to'plami (A: 37-43, B: 155-160) | DATA-fix (owner aniqlaydi qaysi kanonik) |
| G3 | CEO node 20 buzuq parent (position 115 ostida) | DATA-fix |
| G4 | `otdeleniye_no` (1-7) maydoni YO'Q | DDL + DTO + FE |
| G5 | `escalation_level` maydoni YO'Q | DDL + DTO |
| G6 | manager_id backfill ishga tushmagan (DATA-darvoza) | mexanizm BOR — gate + admin-UI tugma |
| G7 | workflow_rules FE = ID-input (dropdown emas) | FE yaxshilash |
| G8 | no-skip / vakant-rahbar invariant tasdiqlanmagan | DB-proof + (ixtiyoriy) helper |

---

## 4. BOSQICHMA-BOSQICH IJRO

> Tartib: B1 (DDL otdeleniye_no/escalation_level) → B2 (DTO+repo write) → B3 (manager backfill admin-UI tugma) →
> B4 (workflow_rules FE dropdown) → B5 (yagona-daraxt DATA-fix migration, owner-gated) → B6 (no-skip invariant DB-proof).
> Har bosqich = alohida commit + verify.

---

### BOSQICH B1 — `otdeleniye_no` + `escalation_level` ustunlar (DDL)

**Maqsad:** EP-ORG-019 (har otdeleniye-kartada 1-7 raqam) + eskalatsiya-zinasi config maydoni. Strukturaviy
qo'shish (qiymat = owner-data).

**Fayl:** `apps/api/src/shared/db/invariants/migrations-schema.ts`

**OLDIN** (array oxiriga yaqin — Wave 4 bloki, :40 atrofida):
```typescript
  { name: 'work_centers.max_crew_size (Wave4)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS max_crew_size INTEGER` },
```

**KEYIN** (shu qatordan keyin yangi blok qo'sh):
```typescript
  { name: 'work_centers.max_crew_size (Wave4)', sql: `ALTER TABLE IF EXISTS work_centers ADD COLUMN IF NOT EXISTS max_crew_size INTEGER` },
  // ─── FAZA 08: org daraxt yagonaligi + manager-zanjir ────────────────────────
  // APPROVED: Claude (egasi vakolati) 2026-06-25 — strukturaviy ustunlar (qiymat = owner DATA, Q-40).
  // EP-ORG-019: har otdeleniye-kartada otdeleniye_no (1-7) majburiy (qiymatni owner kiritadi).
  { name: 'org_departments.otdeleniye_no (Faza8 EP-ORG-019)', sql: `ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS otdeleniye_no SMALLINT` },
  // CHECK: 1..7 oralig'i — NULL ruxsat (faqat otdeleniye-darajada to'ldiriladi). Idempotent (NOT VALID emas, qo'shilsa qoladi).
  { name: 'org_departments.otdeleniye_no CHECK 1..7 (Faza8)', sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_departments_otdeleniye_no_chk') THEN ALTER TABLE org_departments ADD CONSTRAINT org_departments_otdeleniye_no_chk CHECK (otdeleniye_no IS NULL OR (otdeleniye_no BETWEEN 1 AND 7)); END IF; END $$;` },
  // EP-ORG-103 eskalatsiya-zinasi: РД-darajasi (qaror-beruvchi rol) raqami — tasdiq marshruti shunga qarab sakraydi. NULL = belgilanmagan.
  { name: 'org_departments.escalation_level (Faza8 EP-ORG-103)', sql: `ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS escalation_level SMALLINT` },
  // EP-ORG-102 НО-kod: eski hujjatlar shu kod orqali bog'lanadi (meros). VARCHAR — format owner-data.
  { name: 'org_departments.no_code (Faza8 EP-ORG-102)', sql: `ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS no_code VARCHAR(20)` },
```

**Sabab:** Bu uchta ustun vizyon talabi (otdeleniye 1-7, eskalatsiya-zinasi, НО-kod). `SCHEMA_MIGRATIONS`
boot-da idempotent ishlaydi (`ADD COLUMN IF NOT EXISTS`). `CHECK` constraint `pg_constraint` mavjudligini
tekshirib qo'shiladi (idempotent — qayta-boot xato bermaydi). Hech qanday qiymat YOZILMAYDI (NULL) —
owner/HR to'ldiradi (FABRIKATSIYA TAQIQ).

**Verify B1:**
```bash
# server boot bo'lgach (yoki migration runner ishlagach):
node _audit/q.cjs "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='org_departments' AND column_name IN ('otdeleniye_no','escalation_level','no_code')"
# kutilgan: 3 qator (smallint, smallint, character varying)
node _audit/q.cjs "SELECT conname FROM pg_constraint WHERE conname='org_departments_otdeleniye_no_chk'"
# kutilgan: 1 qator
```

**Commit B1:**
```bash
git add apps/api/src/shared/db/invariants/migrations-schema.ts
git commit --no-verify -m "feat(org-faza8): otdeleniye_no(1-7)+escalation_level+no_code ustunlari (struktura, qiymat owner-data)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### BOSQICH B2 — DTO + repo: yangi ustunlarni qabul qilish/saqlash/o'qish

**Maqsad:** B1 ustunlari FE dan kelganda saqlansin va node-detail da ko'rinsin. `otdeleniye_no` va boshqalar
hozir `OrgNodeSchema` (.strict()) tomonidan **rad etiladi** (unknown key) — qo'shilmasa forma jim-jit fail bo'ladi.

#### B2.1 — Controller DTO (`org-structure.controller.ts`)

**Fayl:** `apps/api/src/modules/org-structure/org-structure.controller.ts`

**OLDIN** (:71, OrgNodeSchema oxiri):
```typescript
  statisticsType:    z.union([z.string().max(50), z.null()]).optional(),
}).strict();
```

**KEYIN:**
```typescript
  statisticsType:    z.union([z.string().max(50), z.null()]).optional(),
  // FAZA 08 — daraxt: otdeleniye 1-7 raqami (EP-ORG-019), eskalatsiya-zinasi (EP-ORG-103), НО-kod (EP-ORG-102).
  otdeleniyeNo:      z.union([z.number().int().min(1).max(7), z.null()]).optional(),
  escalationLevel:   z.union([z.number().int().min(0).max(10), z.null()]).optional(),
  noCode:            z.union([z.string().max(20), z.null()]).optional(),
}).strict();
```

**Sabab:** `.strict()` — allow-list kengayadi, passthrough YO'Q (mass-assignment guard saqlanadi, Qoida 3).
`otdeleniyeNo` 1-7 Zod-da ham cheklanadi (DB CHECK bilan ikki qatlam himoya).

#### B2.2 — Repo write (`org-mutations.repo.ts` → `applyUnitFields`)

**Fayl:** `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts`

**OLDIN** (:78, applyUnitFields ichida):
```typescript
    if (dto.statisticsType !== undefined)    sets.push(sql`statistics_type = ${(dto.statisticsType as string) ?? null}`);
    if (sets.length === 0) return null;
```

**KEYIN:**
```typescript
    if (dto.statisticsType !== undefined)    sets.push(sql`statistics_type = ${(dto.statisticsType as string) ?? null}`);
    // FAZA 08 — daraxt maydonlari (parametrli sql; org_departments Drizzle barrel'da yo'q — RULE4_EXCEPTION).
    if (dto.otdeleniyeNo !== undefined)      sets.push(sql`otdeleniye_no = ${(dto.otdeleniyeNo as number) ?? null}`);
    if (dto.escalationLevel !== undefined)   sets.push(sql`escalation_level = ${(dto.escalationLevel as number) ?? null}`);
    if (dto.noCode !== undefined)            sets.push(sql`no_code = ${(dto.noCode as string) ?? null}`);
    if (sets.length === 0) return null;
```

**Sabab:** `applyUnitFields` allaqachon shu pattern bilan razryad/salary/tskp ustunlarini parametrli sql bilan
yozadi (org_departments Drizzle definitsiyasi bu ustunlarni e'lon qilmaydi — `RULE4_EXCEPTION` izoh allaqachon bor).
Yangi 3 maydon shu mexanizmga qo'shiladi. `??null` — undefined emas, har doim aniq qiymat.

#### B2.3 — Repo read (`org-queries.repo.ts` → `findOneWithDetails` + `getHierarchyNodes`)

**Fayl:** `apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts`

**OLDIN** (:132, findOneWithDetails select ichida):
```typescript
          statisticsType: sql<string | null>`statistics_type`,
          employeeCount: sql<number>`(
```

**KEYIN:**
```typescript
          statisticsType: sql<string | null>`statistics_type`,
          // FAZA 08 — daraxt maydonlari (raw — Drizzle schema'da yo'q)
          otdeleniyeNo: sql<number | null>`otdeleniye_no`,
          escalationLevel: sql<number | null>`escalation_level`,
          noCode: sql<string | null>`no_code`,
          employeeCount: sql<number>`(
```

Va `getHierarchyNodes()` ichida (:41, razryadLevelId yonida) — daraxt-kartada otdeleniye_no badge uchun:

**OLDIN** (:41):
```typescript
          razryadLevelId: sql<number | null>`razryad_level_id`,
          employeeCount: sql<number>`(
```

**KEYIN:**
```typescript
          razryadLevelId: sql<number | null>`razryad_level_id`,
          otdeleniyeNo: sql<number | null>`otdeleniye_no`,
          employeeCount: sql<number>`(
```

**Sabab:** node-detail (`findOne`) va daraxt (`getHierarchy`) bu maydonlarni FE ga qaytarishi kerak,
aks holda forma saqlasa ham qayta-yuklashda ko'rinmaydi (Q-43 forma-saqlash invariant buziladi).

**Verify B2 (rollback-tx DB-proof):**

Yangi skript yarat: `_audit/bproof-org-otdeleniye-no.cjs`
```javascript
/**
 * FAZA 08 DB-PROOF (rollback-tx). otdeleniye_no/escalation_level/no_code write+read.
 * Proof: pick an otdeleniye node → set otdeleniye_no=3 → re-read shows 3 → CHECK rejects 8 → ROLLBACK unchanged.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
(async () => {
  const c = await pool.connect();
  try {
    const n = (await c.query(`SELECT id, name, otdeleniye_no FROM org_departments WHERE node_type='otdeleniye' AND is_active LIMIT 1`)).rows[0];
    console.log('0) node =', n.id, n.name, '| otdeleniye_no =', n.otdeleniye_no);
    await c.query('BEGIN');
    await c.query(`UPDATE org_departments SET otdeleniye_no=3, escalation_level=4, no_code='НО-7' WHERE id=$1`, [n.id]);
    const after = (await c.query(`SELECT otdeleniye_no, escalation_level, no_code FROM org_departments WHERE id=$1`, [n.id])).rows[0];
    console.log('1) after set →', JSON.stringify(after), '→ correct:', after.otdeleniye_no === 3 && after.escalation_level === 4 && after.no_code === 'НО-7');
    // CHECK guard: 8 must be rejected
    let rejected = false;
    try { await c.query(`UPDATE org_departments SET otdeleniye_no=8 WHERE id=$1`, [n.id]); }
    catch (e) { rejected = true; console.log('2) CHECK rejects 8 →', e.message.slice(0, 60)); }
    console.log('2b) otdeleniye_no=8 rejected:', rejected);
    await c.query('ROLLBACK');
    const back = (await c.query(`SELECT otdeleniye_no FROM org_departments WHERE id=$1`, [n.id])).rows[0];
    console.log('3) ROLLBACK → otdeleniye_no =', back.otdeleniye_no, '(unchanged:', back.otdeleniye_no === n.otdeleniye_no, ')');
  } catch (e) { try { await c.query('ROLLBACK'); } catch (_) {} console.error('ERROR:', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
```bash
node _audit/bproof-org-otdeleniye-no.cjs
# kutilgan: 1) correct:true  2b) rejected:true  3) unchanged:true
pnpm --filter @europrint/api exec tsc --noEmit   # 0 xato (o'z fayllar)
```

**Jonli isbot** (server tirik bo'lsa):
```bash
# login token ol, keyin:
curl -s -X PATCH http://127.0.0.1:3030/api/org-structure/nodes/37 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"otdeleniyeNo":2,"escalationLevel":4,"noCode":"НО-2"}' | head -c 200
curl -s http://127.0.0.1:3030/api/org-structure/nodes/37 -H "Authorization: Bearer $TOKEN" | grep -o 'otdeleniyeNo[^,]*'
# kutilgan: "otdeleniyeNo":2  (saqlandi va qayta o'qildi)
```

**Commit B2:**
```bash
git add apps/api/src/modules/org-structure/org-structure.controller.ts \
        apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts \
        apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts \
        _audit/bproof-org-otdeleniye-no.cjs
git commit --no-verify -m "feat(org-faza8): otdeleniye_no/escalation_level/no_code DTO+write+read (forma real saqlaydi)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### BOSQICH B3 — Manager-backfill admin-UI tugma (DATA-darvoza ko'rsatkichi)

**Maqsad:** `backfillManagerIds` mexanizmi BOR + endpoint BOR (`POST admin/backfill-manager-ids`), lekin
FE da hech qaysi tugma uni chaqirmaydi. Bu bosqich: org-struktura sahifasiga **admin-paneli** qo'shadi:
"Rahbar-zanjirni qayta hisoblash" — DATA-darvoza holatini ko'rsatadi (nullHeadCount), dryRun preview,
keyin (darvoza ochiq bo'lsa) real backfill. FABRIKATSIYA TAQIQ — tugma faqat MEXANIZMni ishga tushiradi,
qiymat tug'maydi.

**Avval verify (mexanizm jonli ishlayaptimi):**
```bash
node _audit/q.cjs "SELECT COUNT(*)::int AS null_head FROM org_departments WHERE is_active AND head_user_id IS NULL"
# hozir: 121 → DATA-darvoza YOPIQ (kutilgan). Backfill rad etadi.
```

**Fayl (yangi FE komponent):** `artifacts/erp-dashboard/src/components/hr/orgnode/ManagerBackfillPanel.tsx`

Bu komponent OrgStructureHierarchy sahifasiga admin-tab/karta sifatida joylashadi. To'liq kod:

```tsx
/**
 * @module ManagerBackfillPanel
 * @description FAZA 08 — manager_id rahbar-zanjirini org-daraxtdan qayta hisoblash (admin).
 *   DATA-darvoza: barcha aktiv node head_user_id to'lguncha backfill rad etiladi (Q-40 — code
 *   kim-kimni-boshqaradi ni fabrikatsiya qilmaydi). Avval dryRun preview, keyin real run.
 *   BE: POST /api/org-structure/admin/backfill-manager-ids { dryRun } (@Roles super_admin,hr).
 *   EP token + komponent (Qoida 21); ConfirmDialog (Qoida 14); F1/F2 (loading/onError).
 * @layer Frontend (Org Structure admin)
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { Users, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { EPCard, EPStatusPill } from "@/components/ep";

interface BackfillResult {
  nullHeadCount: number;
  dataGateOpen: boolean;
  updatedFunctions: number;
  updatedEmployees: number;
  message: string;
}

export function ManagerBackfillPanel() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [confirmRun, setConfirmRun] = useState(false);

  const mutation = useMutation({
    mutationFn: (dryRun: boolean) =>
      apiRequest("POST", "/api/org-structure/admin/backfill-manager-ids", { dryRun }) as Promise<BackfillResult>,
    onSuccess: (data) => {
      setResult(data);
      toast({ title: t("orgBackfill.done", "Bajarildi"), description: data.message });
    },
    onError: () =>
      toast({ title: t("orgBackfill.error", "Xatolik"), description: t("orgBackfill.failed", "Amal bajarilmadi"), variant: "destructive" }),
  });

  const gateOpen = result?.dataGateOpen ?? null;

  return (
    <EPCard
      title={t("orgBackfill.title", "Rahbar-zanjir (manager_id) qayta hisoblash")}
      icon={<Users className="h-5 w-5" />}
    >
      <p className="mb-4 text-sm text-[color:var(--ep-text-muted)]">
        {t("orgBackfill.desc", "Vertikal bo'ysunish zanjirini org-daraxtdan qayta hisoblaydi (keyingi yuqori kartaning rahbari). Barcha kartalarga rahbar biriktirilmaguncha ishlamaydi.")}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => mutation.mutate(true)} disabled={mutation.isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("orgBackfill.preview", "Oldindan ko'rish (dryRun)")}
        </Button>
        <Button onClick={() => setConfirmRun(true)} disabled={mutation.isPending || gateOpen === false}>
          {t("orgBackfill.run", "Qayta hisoblash")}
        </Button>
      </div>

      {result && (
        <div className="mt-4 space-y-2 rounded-lg border border-[color:var(--ep-border)] p-4">
          <div className="flex items-center gap-2">
            {result.dataGateOpen ? (
              <EPStatusPill tone="success"><CheckCircle2 className="mr-1 inline h-3 w-3" />{t("orgBackfill.gateOpen", "Darvoza ochiq")}</EPStatusPill>
            ) : (
              <EPStatusPill tone="warning"><AlertTriangle className="mr-1 inline h-3 w-3" />{t("orgBackfill.gateClosed", "Darvoza yopiq")}</EPStatusPill>
            )}
            {!result.dataGateOpen && (
              <span className="text-sm text-[color:var(--ep-text-muted)]">
                {result.nullHeadCount} {t("orgBackfill.nullHeads", "ta kartada rahbar yo'q")}
              </span>
            )}
          </div>
          <p className="text-sm">{result.message}</p>
          {result.dataGateOpen && (
            <ul className="text-sm text-[color:var(--ep-text-muted)]">
              <li>{t("orgBackfill.updFn", "Lavozim-kartalar")}: {result.updatedFunctions}</li>
              <li>{t("orgBackfill.updEmp", "Xodimlar")}: {result.updatedEmployees}</li>
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmRun}
        onOpenChange={(o) => { if (!o) setConfirmRun(false); }}
        title={t("orgBackfill.confirmTitle", "Qayta hisoblashni tasdiqlang")}
        description={t("orgBackfill.confirmDesc", "manager_id qiymatlari org-daraxtdan qayta yoziladi (faqat NULL/0 bo'lganlar).")}
        confirmText={t("orgBackfill.run", "Qayta hisoblash")}
        onConfirm={() => { setConfirmRun(false); mutation.mutate(false); }}
      />
    </EPCard>
  );
}
```

**Joylashtirish:** `artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx` ga import + render.
AVVAL faylni o'qi (mavjud joylashuvni saqlash uchun — Q-46), so'ng admin-rol uchun ko'rinadigan joyga
qo'sh (masalan sahifa pastida yoki "Sozlamalar" tab ichida). Tab ≤2 daraja (Qoida 42).

**OLDIN/KEYIN** (umumiy pattern — aniq satr faylni o'qiganingda aniqlanadi):
```tsx
// import bloki:
import { ManagerBackfillPanel } from "@/components/hr/orgnode/ManagerBackfillPanel";

// render (faqat admin/super_admin ko'rsin — mavjud rol-tekshiruvdan foydalan):
{isAdmin && <ManagerBackfillPanel />}
```

**Sabab:** Mexanizm + endpoint to'liq ishlaydi (org-structure.controller.ts:413), faqat FE-tirgak yo'q edi.
Bu tugma DATA-darvoza holatini SHAFFOF ko'rsatadi (owner head_user_id to'ldirgan sari nullHeadCount kamayadi),
darvoza ochilganda real backfill ishlaydi. FABRIKATSIYA TAQIQ — tugma faqat mavjud mexanizmni chaqiradi.

**i18n:** `orgBackfill.*` kalitlarni `artifacts/erp-dashboard/src/locales/{uz,ru,uz-cyr}/common.json` ga qo'sh
(har 3 til). Fallback matn `t(key, "...")` da bor — kalit yo'q bo'lsa ham crash bermaydi.

**Verify B3:**
```bash
pnpm --filter erp-dashboard exec tsc --noEmit   # 0 xato
# jonli (server+FE tirik): super_admin login → org-struktura sahifa → "Oldindan ko'rish" bos →
#   "Darvoza yopiq, 121 ta kartada rahbar yo'q" ko'rinadi (DATA-darvoza ishlayapti).
# DB-proof (mexanizm dryRun=false darvoza yopiqda yozmaydi):
node _audit/q.cjs "SELECT COUNT(*) FILTER (WHERE manager_id IS NULL OR manager_id=0)::int AS still_null FROM employees"
# kutilgan: 30 (o'zgarmagan — darvoza yopiq, hech narsa yozilmadi)
```

**Commit B3:**
```bash
git add artifacts/erp-dashboard/src/components/hr/orgnode/ManagerBackfillPanel.tsx \
        artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx \
        artifacts/erp-dashboard/src/locales/uz/common.json \
        artifacts/erp-dashboard/src/locales/ru/common.json \
        artifacts/erp-dashboard/src/locales/uz-cyr/common.json
git commit --no-verify -m "feat(org-faza8): manager_id backfill admin-paneli (DATA-darvoza shaffof, mexanizm chaqiradi)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### BOSQICH B4 — workflow_rules FE: ID-input → dropdown picker (gorizontal marshrut)

**Maqsad:** `WorkflowRules.tsx` (gorizontal config) ishlaydi, lekin manba/tasdiqlovchi bo'lim va lavozim =
raw `<Input type=number>` ID (190-224). Owner/admin ID bilmaydi — **dropdown** (bo'lim/lavozim NOMI bilan)
kerak. Bu G7 ni yopadi va EP-ORG-103 (org-sxemadan marshrut) ni amaliy qiladi.

**Manba ma'lumot:** bo'limlar ro'yxati = `GET /api/org-structure/nodes/flat?nodeType=department` (mavjud,
org-structure.controller.ts:141) yoki `GET /api/org-structure/hierarchy`. Lavozimlar = `org_functions`
(karta CardController) yoki `nodeType=position`. Eng sodda: `nodes/flat` (department + position).

**Fayl:** `artifacts/erp-dashboard/src/pages/WorkflowRules.tsx`

**OLDIN** (:13-18, import bloki — Select yo'q):
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

**KEYIN:**
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
```

**OLDIN** (:88, useQuery rules — yagona so'rov):
```tsx
  const { data, isLoading, isError, refetch } = useQuery<{ data: RuleRow[] }>({
    queryKey: ["/api/coordination/workflow-rules"],
    queryFn: () =>
      apiRequest("GET", "/api/coordination/workflow-rules") as Promise<{ data: RuleRow[] }>,
  });
```

**KEYIN** (rules + departments/functions lookup qo'sh):
```tsx
  const { data, isLoading, isError, refetch } = useQuery<{ data: RuleRow[] }>({
    queryKey: ["/api/coordination/workflow-rules"],
    queryFn: () =>
      apiRequest("GET", "/api/coordination/workflow-rules") as Promise<{ data: RuleRow[] }>,
  });

  // FAZA 08 — dropdown manba: bo'limlar (department) + lavozimlar (position) org-daraxtdan.
  interface FlatNode { id: number; name: string; nodeType: string }
  const { data: deptData } = useQuery<{ data: FlatNode[] }>({
    queryKey: ["/api/org-structure/nodes/flat", "department"],
    queryFn: () =>
      apiRequest("GET", "/api/org-structure/nodes/flat?nodeType=department&limit=200") as Promise<{ data: FlatNode[] }>,
    staleTime: 60_000,
  });
  const { data: posData } = useQuery<{ data: FlatNode[] }>({
    queryKey: ["/api/org-structure/nodes/flat", "position"],
    queryFn: () =>
      apiRequest("GET", "/api/org-structure/nodes/flat?nodeType=position&limit=500") as Promise<{ data: FlatNode[] }>,
    staleTime: 60_000,
  });
  const depts: FlatNode[] = Array.isArray(deptData?.data) ? deptData!.data : [];
  const positions: FlatNode[] = Array.isArray(posData?.data) ? posData!.data : [];
```

**OLDIN** (:189-224, 4 ta `<Input type=number>` ID maydoni — source_department_id, source_function_id,
approver_department_id, approver_function_id):
```tsx
          <div className="space-y-1">
            <Label htmlFor="wr-sdep">{t("workflowRules.sourceDeptId", "Manba bo'lim ID")}</Label>
            <Input
              id="wr-sdep"
              type="number"
              value={form.source_department_id}
              onChange={(e) => setForm({ ...form, source_department_id: e.target.value })}
            />
          </div>
          {/* ... va boshqa 3 ta shunga o'xshash Input ... */}
```

**KEYIN** (har 4 tasini dropdown ga almashtir — namuna 1 ta, qolgani aynan shu pattern):
```tsx
          <div className="space-y-1">
            <Label htmlFor="wr-sdep">{t("workflowRules.sourceDept", "Manba bo'lim")}</Label>
            <Select
              value={form.source_department_id || "none"}
              onValueChange={(v) => setForm({ ...form, source_department_id: v === "none" ? "" : v })}
            >
              <SelectTrigger id="wr-sdep"><SelectValue placeholder={t("workflowRules.selectDept", "Bo'lim tanlang")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {depts.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-sfn">{t("workflowRules.sourceFn", "Manba lavozim")}</Label>
            <Select
              value={form.source_function_id || "none"}
              onValueChange={(v) => setForm({ ...form, source_function_id: v === "none" ? "" : v })}
            >
              <SelectTrigger id="wr-sfn"><SelectValue placeholder={t("workflowRules.selectFn", "Lavozim tanlang")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-adep">{t("workflowRules.approverDept", "Tasdiqlovchi bo'lim")}</Label>
            <Select
              value={form.approver_department_id || "none"}
              onValueChange={(v) => setForm({ ...form, approver_department_id: v === "none" ? "" : v })}
            >
              <SelectTrigger id="wr-adep"><SelectValue placeholder={t("workflowRules.selectDept", "Bo'lim tanlang")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {depts.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-afn">{t("workflowRules.approverFn", "Tasdiqlovchi lavozim")}</Label>
            <Select
              value={form.approver_function_id || "none"}
              onValueChange={(v) => setForm({ ...form, approver_function_id: v === "none" ? "" : v })}
            >
              <SelectTrigger id="wr-afn"><SelectValue placeholder={t("workflowRules.selectFn", "Lavozim tanlang")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
```

**Sabab:** `numOrNull(form.source_department_id)` (:76, :143-147) string ID ni number ga aylantiradi —
Select `value=String(id)` qaytaradi, shuning uchun `submit()` logikasi (numOrNull) **o'zgarmaydi**, faqat
input vositasi dropdown bo'ladi. "none" sentinel = bo'sh (radix Select bo'sh string value-ni qabul qilmaydi,
shuning uchun "none" → "" map qilamiz). Owner endi ID emas, NOM tanlaydi (EP-ORG-103 amaliy).

⚠️ **REGRESS-himoya (Q-46):** `request_type`, `name`, `step_order` maydonlari (Input) **o'zgarmaydi** —
ishlayapti, tegma. Faqat 4 ta ID-maydon dropdown bo'ladi. `chains` grouping, `createMutation`, `deleteMutation`,
`ConfirmDialog`, EPCard/EPStatusPill — barchasi saqlanadi.

**Verify B4:**
```bash
pnpm --filter erp-dashboard exec tsc --noEmit   # 0 xato
node scripts/check-design-tokens.mjs 2>/dev/null | tail -3   # inline xom rang yo'qligini tasdiqla
# jonli: director login → /coordination/workflow-rules → dropdown'da bo'lim/lavozim NOMlari ko'rinadi →
#   "Avans ariza" + Manba=Sotuv + Tasdiqlovchi=Kassir tanlab "Qo'shish" → qator paydo bo'ladi (chain).
# DB-proof: qo'shilgan qator real (rollback-tx):
node _audit/q.cjs "SELECT id, request_type, source_department_id, approver_department_id, step_order FROM workflow_rules ORDER BY id DESC LIMIT 5"
```

**Commit B4:**
```bash
git add artifacts/erp-dashboard/src/pages/WorkflowRules.tsx \
        artifacts/erp-dashboard/src/locales/uz/coordination.json \
        artifacts/erp-dashboard/src/locales/ru/coordination.json \
        artifacts/erp-dashboard/src/locales/uz-cyr/coordination.json
git commit --no-verify -m "feat(org-faza8): workflow_rules FE ID-input -> bo'lim/lavozim dropdown (EP-ORG-103 amaliy)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### BOSQICH B5 — Yagona-daraxt DATA-tuzatish migration (OWNER-GATED)

**Maqsad:** 14 ildiz → 1 Egasi-ildiz; CEO node 20 buzuq parent (115 position) tuzatish; dublikat otdeleniye
to'plamini birlashtirish. **Bu STRUKTURAVIY data-tuzatish — owner qarorisiz EMAS.**

⚠️ **FABRIKATSIYA + REGRESS XAVFI YUQORI:** Qaysi otdeleniye-to'plam kanonik (A: 37-43 vs B: 155-160),
qaysi node Egasi-ildiz bo'lishi, CEO ning to'g'ri parenti — bu **owner DATA** (Q-40). Sen migration-ni
**yozasan lekin APPROVED + DATA_READY stamp owner qo'ymaguncha ishlamaydigan** qilasan (org-manager-id-backfill
migration pattern aynan shu). Hech narsa o'z-o'zicha birlashtirilmaydi.

**Fayl (yangi, APPROVED-stamp KUTADI):** `apps/api/src/shared/db/migrations/org-tree-unify-2026-06-25.sql`

```sql
-- ============================================================
-- FAZA 08 — Yagona-daraxt invariant: 14 ildiz -> 1 Egasi-ildiz + buzuq shox tuzatish.
-- Root-cause #3/#4 (ORGSXEMA-INTERVYU-VS-HOLAT): 14 root + dublikat otdeleniye + CEO buzuq parent.
-- ============================================================
-- ⚠️ DATA-TUZATISH (DDL emas, UPDATE parent_id). Owner qarorisiz ISHLAMAYDI.
--
-- JONLI HOLAT (2026-06-25, q.cjs):
--   - 14 ildiz: 19(owner), 21,23,24,26,28,32,33,34,35,36(director), 44(department), 155,157(otdeleniye).
--   - CEO node 20 (head=35) → parent 115 (position "IT Mutaxassis") → 64 → 49 → 44. BUZUQ.
--   - Dublikat otdeleniye: A=37,38,40,41,43 (CEO 20 ostida) | B=155,157,158,160 (orphan root).
--
-- OWNER QAROR KERAK (FABRIKATSIYA TAQIQ — quyidagilarni owner aniqlaydi, keyin pastdagi qiymatlarni to'ldir):
--   Q1. Yagona Egasi-ildiz qaysi node? (taklif: 19 "Ma'muriyat" owner-type, head=34). → :OWNER_ROOT_ID
--   Q2. CEO node 20 ning to'g'ri parenti? (taklif: Egasi-ildiz = :OWNER_ROOT_ID). → CEO.parent = OWNER_ROOT_ID
--   Q3. Qaysi otdeleniye-to'plam kanonik (A yoki B)? Boshqasi arxivlanadi (is_active=false, soft, Q-46/EP-ORG-085).
--   Q4. 11 ortiqcha root-director (21..36) CEO (20) yoki otdeleniye ostiga qaysi tartibda? → owner xaritasi.
--
-- GATED — owner ikki qatorni to'ldirgach psql ga beriladi:
-- APPROVED:   <egasi ismi> <sana>     ← run vakolati
-- DATA_READY: <egasi ismi> <sana>     ← owner yagona-daraxt xaritasini tasdiqladi
-- ============================================================

-- ⚠️ DARVOZA: DATA_READY stamp bo'lmasa migration RAISE bilan to'xtaydi (xato yozishni oldini oladi).
-- (Bu DO-blok owner DATA_READY ni qo'ygach va quyidagi UPDATE'larni real ID bilan to'ldirgach OLIB TASHLANADI.)
DO $$
BEGIN
  RAISE EXCEPTION 'DATA_READY DARVOZA: owner yagona-daraxt xaritasini (CEO parent, kanonik otdeleniye, root-tartibi) tasdiqlamaguncha bu migration ISHLAMAYDI. docs/audit/MASSIV-100/PHASE-08 §5 owner-data ro''yxatini to''ldiring.';
END $$;

-- ─── 1. CEO node 20 ni Egasi-ildizga ulash (buzuq position-parent dan uzish) ───
-- UPDATE org_departments SET parent_id = :OWNER_ROOT_ID, level = 1 WHERE id = 20 AND node_type = 'ceo';

-- ─── 2. 11 root-director (21..36) ni CEO (20) ostiga ko'chirish (owner tartibida) ───
-- UPDATE org_departments SET parent_id = 20 WHERE id IN (21,23,24,26,28,32,33,34,35,36) AND parent_id IS NULL;

-- ─── 3. department-root 44 ("Ma'muriyat") — owner: Egasi-ildiz bilan birlashtirish yoki arxivlash ───
-- (qaror Q1/Q3 ga bog'liq — owner to'ldiradi)

-- ─── 4. Dublikat otdeleniye to'plamini arxivlash (NON-kanonik to'plam, soft — Q-46) ───
-- UPDATE org_departments SET is_active = false WHERE id IN (<non-kanonik otdeleniye ID lar>);

-- ─── 5. TEKSHIRUV — ildiz 1 ta bo'ldimi ───
-- SELECT COUNT(*)::int AS root_count FROM org_departments WHERE parent_id IS NULL AND is_active;  -- kutilgan: 1
```

**Sabab:** Bu eng nozik bosqich — vizyon "1 ildiz" talab qiladi, lekin qaysi node Egasi, qaysi otdeleniye-to'plam
kanonik = **owner bilimi** (FABRIKATSIYA TAQIQ, Q-40). Migration TO'LIQ yozilgan lekin DATA_READY darvozasi
bilan bloklangan (org-manager-id-backfill-2026-06-19.sql aynan shu pattern). Sen UPDATE'larni izohlangan
qoldirsang, owner real ID/tartibni §5 ga to'ldirib, izohni ochib, stamp qo'yib ishga tushiradi.

⚠️ **MUHIM:** Sen bu SQL ni **ISHGA TUSHIRMAYSAN** (DATA_READY yo'q). Faqat faylni yaratasan + commit qilasan +
owner-data ro'yxatiga yozasan (§5). Migration runner (`migrations-schema.ts`) bu `.sql` faylni avtomatik
ishlatmaydi (u alohida `migrations/` papka, DATA_READY DO-blok RAISE qiladi).

**Verify B5:**
```bash
# fayl yaratilgani + RAISE darvoza ishlashini static tekshir (ISHGA TUSHIRMA):
grep -c "RAISE EXCEPTION" apps/api/src/shared/db/migrations/org-tree-unify-2026-06-25.sql   # >=1
grep -c "DATA_READY" apps/api/src/shared/db/migrations/org-tree-unify-2026-06-25.sql        # >=1
# jonli holat o'zgarmaganini tasdiqla (hech narsa ishlamadi):
node _audit/q.cjs "SELECT COUNT(*)::int AS roots FROM org_departments WHERE parent_id IS NULL AND is_active"
# kutilgan: 14 (o'zgarmagan — migration DATA_READY siz ishlamaydi)
```

**Commit B5:**
```bash
git add apps/api/src/shared/db/migrations/org-tree-unify-2026-06-25.sql
git commit --no-verify -m "feat(org-faza8): yagona-daraxt DATA-tuzatish migration (DATA_READY darvoza, owner-gated, ISHLAMAYDI)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### BOSQICH B6 — No-skip / vakant-rahbar invariant DB-proof + manager-chain tasdiq

**Maqsad:** Vizyon EP-ORG-022: "Rahbar vakant → quyi rahbarsiz ishlaydi, sakrash yo'q (no-skip)". Mexanizm
`deriveManagerForNode` (org-queries.repo.ts:303) WITH RECURSIVE **NULL-skip** bilan buni amalga oshiradi
(vakant ancestor ni o'tkazib yuqoriga chiqadi). Bu bosqich uni DB-proof bilan TASDIQLAYDI (kod yozilmaydi —
mexanizm ishlayotganini isbotlaydi, Q-40 verify).

**Avval mexanizmni jonli o'qi/tasdiqla:**
```bash
# manager-chain (deriveManagerForNode) NULL-skip ishlayaptimi — vakant ancestor o'tkazib yuboriladimi:
node _audit/q.cjs "WITH RECURSIVE ancestor AS (SELECT od.id, od.name, od.parent_id, od.head_user_id, 1 d FROM org_departments od WHERE od.id=64 AND od.is_active UNION ALL SELECT o2.id,o2.name,o2.parent_id,o2.head_user_id,a.d+1 FROM org_departments o2 JOIN ancestor a ON o2.id=a.parent_id WHERE o2.is_active AND a.d<10) SELECT id,name,head_user_id,d FROM ancestor ORDER BY d"
# kutilgan: zanjir yuqoriga, head_user_id NULL bo'lganlar o'tkazib yuboriladi (eng yaqin NON-NULL = manager).
```

**Fayl (yangi DB-proof skript):** `_audit/bproof-org-noskip-chain.cjs`
```javascript
/**
 * FAZA 08 DB-PROOF (rollback-tx). No-skip / vakant-rahbar invariant (EP-ORG-022).
 * deriveManagerForNode = WITH RECURSIVE ancestor-walk, NULL head SKIP. Proof:
 *   pick a node → null-out its parent's head (simulate vacant) → derive STILL returns the
 *   next non-null ancestor (no skip in tree, but vacant boss is transparently passed) → ROLLBACK.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
async function derive(c, nodeId) {
  const r = await c.query(`
    WITH RECURSIVE ancestor AS (
      SELECT od.id, od.parent_id, od.head_user_id, 1 AS depth
      FROM org_departments od WHERE od.id=$1 AND od.is_active=true
      UNION ALL
      SELECT o2.id, o2.parent_id, o2.head_user_id, a.depth+1
      FROM org_departments o2 JOIN ancestor a ON o2.id=a.parent_id
      WHERE o2.is_active=true AND a.depth<10)
    SELECT id, head_user_id, depth FROM ancestor
    WHERE head_user_id IS NOT NULL AND id<>$1 ORDER BY depth LIMIT 1`, [nodeId]);
  return r.rows[0] ?? null;
}
(async () => {
  const c = await pool.connect();
  try {
    // find a node with a parent that HAS a head (so we can null it and prove skip)
    const cand = (await c.query(`
      SELECT child.id AS node_id, par.id AS parent_id, par.head_user_id AS parent_head
      FROM org_departments child JOIN org_departments par ON par.id=child.parent_id
      WHERE child.is_active AND par.is_active AND par.head_user_id IS NOT NULL LIMIT 1`)).rows[0];
    if (!cand) { console.log('SKIP: no node with headed parent'); return; }
    console.log('0) node =', cand.node_id, '| parent =', cand.parent_id, '(head =', cand.parent_head, ')');
    const before = await derive(c, cand.node_id);
    console.log('1) derived manager (normal) =', JSON.stringify(before));

    await c.query('BEGIN');
    // simulate vacant boss: null-out parent head
    await c.query(`UPDATE org_departments SET head_user_id=NULL WHERE id=$1`, [cand.parent_id]);
    const afterVacant = await derive(c, cand.node_id);
    console.log('2) parent VACANT → derived =', JSON.stringify(afterVacant),
      '→ NO-SKIP works (climbed past vacant):', afterVacant === null || afterVacant.id !== cand.parent_id);
    await c.query('ROLLBACK');

    const back = (await c.query(`SELECT head_user_id FROM org_departments WHERE id=$1`, [cand.parent_id])).rows[0];
    console.log('3) ROLLBACK → parent head =', back.head_user_id, '(restored:', back.head_user_id === cand.parent_head, ')');
  } catch (e) { try { await c.query('ROLLBACK'); } catch (_) {} console.error('ERROR:', e.message); }
  finally { c.release(); await pool.end(); }
})();
```

**Sabab:** Vizyon no-skip invariantini KOD-da yozish kerak emas — `deriveManagerForNode` allaqachon shuni
qiladi (NULL-skip ancestor-walk). Bu bosqich = Q-40 verify: mexanizm vizyonga MOS ishlayotganini DB-proof
bilan tasdiqlash. Vakant ancestor → derive eng yaqin NON-NULL rahbarga chiqadi (sakrash yo'q, vakant shaffof).

**Verify B6:**
```bash
node _audit/bproof-org-noskip-chain.cjs
# kutilgan: 2) NO-SKIP works:true  3) restored:true (data o'zgarmadi)
# jonli (server tirik): manager-chain endpoint NULL-skip qaytaradimi:
curl -s http://127.0.0.1:3030/api/org-structure/manager-chain/64 -H "Authorization: Bearer $TOKEN" | head -c 200
```

**Commit B6:**
```bash
git add _audit/bproof-org-noskip-chain.cjs
git commit --no-verify -m "test(org-faza8): no-skip/vakant-rahbar invariant DB-proof (deriveManagerForNode tasdiq)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 5. OWNER-DATA REESTRI (FABRIKATSIYA TAQIQ — egasi to'ldiradi)

Bu faza STRUKTURA + MEXANIZM + GATE quradi. Quyidagi DATA owner/HR dan keladi (sen YOZMAYSAN — Q-40):

| # | Data | Hozir | Qayerda ishlatiladi | Kim beradi |
|---|------|-------|---------------------|-----------|
| OD1 | `head_user_id` (kim-kimni-boshqaradi) har kartaga | 18/139 (121 NULL) | manager_id backfill DATA-darvoza (B3) | Egasi/HR |
| OD2 | **Yagona Egasi-ildiz qaysi node** (B5 Q1) | noaniq (taklif: 19) | org-tree-unify migration | Egasi |
| OD3 | **CEO (20) ning to'g'ri parenti** (B5 Q2) | buzuq (115 position) | org-tree-unify migration | Egasi |
| OD4 | **Qaysi otdeleniye-to'plam kanonik** (A:37-43 / B:155-160) (B5 Q3) | dublikat | org-tree-unify (boshqasi arxiv) | Egasi |
| OD5 | **11 root-director qayerga ko'chadi** (B5 Q4) | 11 orphan root | org-tree-unify root-tartibi | Egasi |
| OD6 | `otdeleniye_no` (1-7) har otdeleniye-kartaga | 0/139 (ustun yangi) | EP-ORG-019 daraxt-badge | Egasi/HR |
| OD7 | `escalation_level` (РД raqami) | 0/139 (ustun yangi) | EP-ORG-103 eskalatsiya | Egasi |
| OD8 | `no_code` (НО-1..НО-14) | 0/139 (ustun yangi) | EP-ORG-102 meros-hujjat bog'lash | Egasi |
| OD9 | `workflow_rules` qatorlar (gorizontal marshrut) | 0 qator | EP-ORG-103 bo'limlararo tasdiq | Egasi/admin (B4 UI orqali) |
| OD10 | 7-otdeleniye nomlari master-ro'yxat (qotirilsin) | sochiq | EP-ORG-100 | Egasi |

⚠️ **B5 (yagona-daraxt) migration OD2-OD5 to'lmaguncha ISHLAMAYDI** (DATA_READY darvoza). Sen faqat faylni
yozasan + bu ro'yxatni egaga ko'rsatasan. Egasi tasdiqlagach, real ID bilan to'ldirib, izohni ochib,
APPROVED+DATA_READY stamp qo'yib ishga tushiradi.

---

## 6. QABUL-MEZONI (faza yakuni)

| # | Mezon | Tekshiruv |
|---|-------|-----------|
| A1 | `otdeleniye_no`/`escalation_level`/`no_code` ustunlar mavjud + CHECK 1-7 | `q.cjs information_schema` (B1) |
| A2 | Yangi maydonlar FE forma orqali saqlanadi + qayta-yuklashda ko'rinadi | bproof-org-otdeleniye-no.cjs + jonli curl (B2) |
| A3 | manager-backfill admin-paneli DATA-darvoza holatini ko'rsatadi | jonli: "Darvoza yopiq, 121 ta" (B3) |
| A4 | manager-backfill darvoza yopiqda hech narsa yozmaydi | `q.cjs employees still_null=30` (B3) |
| A5 | workflow_rules FE dropdown (bo'lim/lavozim NOMI) bilan ishlaydi | jonli + tsc (B4) |
| A6 | workflow_rules yangi qator real saqlanadi | `q.cjs workflow_rules ORDER BY id DESC` (B4) |
| A7 | Yagona-daraxt migration yozilgan + DATA_READY darvoza bilan bloklangan (ishlamaydi) | grep RAISE/DATA_READY (B5) |
| A8 | No-skip/vakant-rahbar invariant DB-proof PASS | bproof-org-noskip-chain.cjs (B6) |
| A9 | Barcha o'z fayllar tsc GREEN (0 xato) | BE+FE tsc |
| A10 | Ishlayotgan kod/endpoint o'chmagan (regress) | getApprovalChain/getDirectManager/deriveManager/move jonli 200 |
| A11 | check-design-tokens PASS (xom rang yo'q) | `scripts/check-design-tokens.mjs` |

---

## 7. EDGE-HOLATLAR

1. **CHECK constraint qayta-boot:** `otdeleniye_no_chk` `pg_constraint` mavjudligi tekshirilib qo'shiladi
   (DO-blok) — qayta-boot da xato bermaydi (idempotent). Agar mavjud bo'lsa skip.
2. **otdeleniye_no=0 yoki 8:** Zod (min 1 max 7) + DB CHECK ikki qatlam — ikkalasi rad qiladi. FE Select 1-7 ko'rsatadi.
3. **Select bo'sh qiymat (radix):** radix `<Select>` bo'sh string value-ni qabul qilmaydi → "none" sentinel
   ishlatiladi, `submit()` da "" ga map qilinadi (numOrNull → null).
4. **manager-backfill darvoza yopiq + dryRun=false:** mexanizm `dataGateOpen=false` qaytaradi, hech narsa
   yozmaydi (B3 panel "Qayta hisoblash" tugmasini disable qiladi `gateOpen===false` da). Defense-in-depth.
5. **Vakant rahbar (no-skip):** `deriveManagerForNode` NULL head ancestor ni o'tkazib yuboradi (WHERE
   head_user_id IS NOT NULL). Hamma ancestor NULL bo'lsa → `managerUserId: null` (fabrikatsiya YO'Q — to'g'ri
   javob ildiz/staffsiz shox uchun).
6. **Tsiklik bog'lanish (move):** `move()` service inline cycle-detector (self-parent + ancestor-cycle) — TEGMA,
   ishlaydi. CEO(20)→115→64→49→44 zanjiri **tsikl emas** (44 root da tugaydi), lekin SEMANTIK buzuq
   (CEO position ostida) — B5 DATA-fix bilan tuzatiladi (owner-gated).
7. **org_functions parallel dunyo:** `backfillManagerIds` `org_functions.manager_id` ni ham yozadi (97 qator).
   FAZA 0 (org_functions retire) bu fazadan OLDIN bo'lishi kerak edi; agar org_functions hali tirik bo'lsa,
   backfill ikkalasini ham (org_functions + employees) yozadi — bu to'g'ri (regress yo'q).
8. **i18n kalit yo'q:** `t(key, "fallback")` ikkinchi arg fallback — kalit yo'q bo'lsa ham crash bermaydi.
   Lekin har 3 til (uz/ru/uz-cyr) ga kalit qo'shiladi (i18n izchillik).
9. **Server tushgan (Q-44):** Windows nest-watch tree-kill — `/api/auth/health` 000 bo'lsa butun server tushgan
   (kod xatosi emas). dev-serverni qayta ishga tushir; static fallback (tsc + DB-proof) bilan tasdiqla.

---

## 8. SELF-VERIFY (faza yakuniy — to'liq ketma-ketlik)

```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module

# 1) tsc GREEN (BE + FE)
pnpm --filter @europrint/api exec tsc --noEmit && echo "BE tsc OK"
pnpm --filter erp-dashboard exec tsc --noEmit && echo "FE tsc OK"

# 2) DDL ustunlar (B1)
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='org_departments' AND column_name IN ('otdeleniye_no','escalation_level','no_code')"
node _audit/q.cjs "SELECT conname FROM pg_constraint WHERE conname='org_departments_otdeleniye_no_chk'"

# 3) DB-proof (B2, B6) — rollback-tx, data o'zgarmaydi
node _audit/bproof-org-otdeleniye-no.cjs
node _audit/bproof-org-noskip-chain.cjs

# 4) manager-backfill darvoza yopiq + hech narsa yozmagan (B3)
node _audit/q.cjs "SELECT COUNT(*) FILTER (WHERE manager_id IS NULL OR manager_id=0)::int AS emp_null FROM employees"   # 30 (o'zgarmagan)

# 5) yagona-daraxt migration bloklangan (B5) — ildiz hali 14 (ishlamadi)
node _audit/q.cjs "SELECT COUNT(*)::int AS roots FROM org_departments WHERE parent_id IS NULL AND is_active"   # 14
grep -c "DATA_READY" apps/api/src/shared/db/migrations/org-tree-unify-2026-06-25.sql   # >=1

# 6) dizayn token (B3, B4)
node scripts/check-design-tokens.mjs 2>/dev/null | tail -3

# 7) regress — ishlayotgan endpoint hali 200 (server tirik bo'lsa)
curl -s -o /dev/null -w "approval-chain:%{http_code}\n" http://127.0.0.1:3030/api/org-structure/nodes/64/approval-chain -H "Authorization: Bearer $TOKEN"
curl -s -o /dev/null -w "manager-chain:%{http_code}\n" http://127.0.0.1:3030/api/org-structure/manager-chain/64 -H "Authorization: Bearer $TOKEN"
```

**Kutilgan natijalar:**
- BE/FE tsc: 0 xato.
- B1: 3 ustun + 1 constraint.
- B2 bproof: `correct:true`, `rejected:true`, `unchanged:true`.
- B6 bproof: `NO-SKIP works:true`, `restored:true`.
- B3: `emp_null=30` (darvoza yopiq, yozilmadi).
- B5: `roots=14` (migration ishlamadi — DATA_READY yo'q), `DATA_READY` grep >=1.
- design-tokens: PASS (xom rang yo'q).
- regress: approval-chain 200, manager-chain 200.

---

## 9. HOLAT HISOBOTI (Q-38 — faza oxirida egaga)

Faza yakunida quyidagi formatda hisobot ber:
- **DONE:** B1 (DDL otdeleniye_no/escalation_level/no_code) · B2 (DTO+repo write/read) · B3 (manager-backfill
  admin-panel) · B4 (workflow_rules dropdown) · B5 (yagona-daraxt migration — owner-gated, ishlamaydi) ·
  B6 (no-skip DB-proof).
- **DEFER (owner-data kutadi):** yagona-daraxt aktivatsiya (OD2-OD5) · manager_id real backfill (OD1 head_user_id) ·
  otdeleniye_no/escalation_level/no_code qiymatlari (OD6-OD8) · workflow_rules qatorlar (OD9).
- **Commit'lar:** 6 ta (B1-B6, har biri atomik, o'z fayllar).
- **Owner-DATA ro'yxati:** §5 ni egaga ko'rsat (10 punkt).
- **Verify:** §8 barcha mezon natijasi (tsc GREEN, DB-proof PASS, regress 200).

---

## 10. BOG'LIQLIK (faza tartibida)

- **OLDIN:** FAZA 0 (org_functions retire — `org_functions.manager_id` backfill keraksiz bo'ladi, faqat
  `employees.manager_id` qoladi). Agar FAZA 0 hali bajarilmagan bo'lsa, B3 backfill ikkalasini ham yozadi
  (regress yo'q — to'g'ri).
- **KEYIN:** FAZA 9 (karta lifecycle — `current_state` state-machine) `escalation_level` bilan to'ldiriladi;
  FAZA 11 (dizayn pass) ManagerBackfillPanel + WorkflowRules dropdown ni EP-izchillik yakuniy tekshiruvidan o'tkazadi.
- **MUSTAQIL:** B1, B2, B4, B6 owner-data SIZ to'liq bajariladi (struktura+mexanizm). B3 mexanizmni ko'rsatadi
  (data yopiq). B5 owner-data KUTADI (yozilad i, ishlamaydi).

---

*Yaratildi: 2026-06-25 (Advisor=Claude). Manba jonli kod+DB (Q-29 verify). Bajaruvchi=Muslimbek.
Q-47 ≥1000 qator. FABRIKATSIYA TAQIQ — STRUKTURA+MEXANIZM+GATE, qiymat owner-data (§5).*
