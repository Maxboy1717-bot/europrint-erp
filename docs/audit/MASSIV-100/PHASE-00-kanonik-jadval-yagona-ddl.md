# PHASE-00 — Kanonik karta-jadval + yagona DDL (BAJARUVCHI DIREKTIVASI)

> **Bajaruvchi:** Muslimbek (🟢 Bajaruvchi roli — Qoida 23).
> **Bosh-dasturchi/menejer:** Claude (vizyon + qaror).
> **Faza:** MASSIV-100 → FAZA 00 (POYDEVOR — hamma keyingi fazani ochadi).
> **Manba-hujjatlar:** [`00-MASTER-REJA.md`](00-MASTER-REJA.md) · [`../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`](../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md) · [`../decisions/01-org-kartalar.md`](../decisions/01-org-kartalar.md).
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, noaniqliksiz. Har bosqich: `fayl:satr`, OLDIN/KEYIN kod, sabab, qabul-mezoni, edge-holat, self-verify.

---

## MUNDARIJA

1. § A — Kontekst va maqsad
2. § B — Qoidalar-bloki (HAR bosqichda majburiy)
3. § C — Joriy holat (jonli-tasdiqlangan: fayl:satr + DB-fakt)
4. § D — Arxitektura qarori va strategiya (NEGA re-point, NEGA migrate-emas)
5. § E — Bosqichma-bosqich ijro (D0..D12)
6. § F — DB migration (APPROVED SQL bloklari)
7. § G — Zod / Result / Drizzle namunalari
8. § H — FE + dizayn (EP token/shablon/komponent)
9. § I — Qabul-mezoni (faza yopilish sharti)
10. § J — Edge-holatlar
11. § K — Self-verify (tsc + rollback-tx DB-proof skript + jonli isbot)
12. § L — Owner-DATA reestri
13. § M — Commit tartibi

---

## § A — KONTEKST VA MAQSAD

### A.1 — Vizyon (nega bu faza birinchi)

EuroPrint ERP ning "miyasi" — org-struktura — KARTA-markazli bo'lishi kerak: har lavozim-o'rindiq bitta **KARTA**, butun ERP shu karta orqali oziqlanadi (login, oylik, RBAC, darslik, ЦКП, AI). Vizyon talabi (EP-ORG-040 / Q-40):

> **"Bitta DDL / ikki-olam yo'q"** — yagona org-struktura jadvali; barcha modul + AI-kamera shunga ulanadi.

Hozir bu buzilgan: org-struktura **ikki parallel BASE jadval**da yashaydi —
- `org_departments` (144 qator) — daraxt/node dunyosi. FE (`OrgStructureHierarchy`, `OrgNodeDetail`, tree, EditDialog) FAQAT shunga ulangan; `assignUser` shunga yozadi (`employee_org_departments`).
- `org_functions` (97 qator) — "kanonik karta" deb yozilgan (`card.repository.ts:3`) CardController dunyosi. `employee_cards` (M:N), `card_folders`, payroll/RBAC/LMS refs, va 39 ta FK shunga keyed. FE `EmployeeCardsSummary` + `CardAssignDialog` + `CardDetailDialog` shunga uradi.

Xodim **3 pointer** ko'taradi: `employees.department_id`, `employees.org_function_id`, `employee_org_departments.org_department_id`. Bu — Q-40 vizyon-buzilishi: kod "ishlaydi" (200 qaytaradi) lekin mazmunan NOTO'G'RI (yagona haqiqat manbai yo'q).

### A.2 — Bu fazaning aniq maqsadi

**`org_departments` = YAGONA kanonik karta-jadval.** `org_functions` retire qilinadi:
1. `card.repository.ts` ning 20+ so'rovi `org_functions` → `org_departments`ga ko'chiriladi (CardController endi org_departments'ga uradi — FE buzilmaydi, chunki route `/org-structure/cards` o'zgarmaydi).
2. `employee_cards.card_id` FK → `org_departments.id` (M:N link kanonik kartaga keyed bo'ladi).
3. `card_folders.card_id` FK → `org_departments.id`.
4. `org_node_portret.card_id` FK → `org_departments.id`.
5. `org-queries.repo.ts:48` vacant-count cross-ref `org_functions` → `org_departments`.
6. payroll/RBAC/LMS `org_functions` refs (faqat AKTIV o'qiyotganlar) → `org_departments`.
7. `org_functions` → bo'sh (FK keladigan yo'q) → compat-VIEW (DROP keyingi fazaga DEFER, chunki 39 FK + Drizzle schema bog'liq).
8. `departments` (18) → legacy, 0 FK keladi → DEFER VIEW (bu fazada faqat tasdiqlash, DROP emas).

### A.3 — Bu faza NIMA EMAS (ko'lam chegarasi — Q-36/no-scope-creep)

- Ko'p-karta lifecycle (`stake_fraction`, freeze/restore) = **FAZA 1** — TEGMA.
- Login/oylik gate (card_id NULL → 401) = **FAZA 2** — TEGMA.
- Razryad o'sish execution = **FAZA 3** — TEGMA.
- `departments` jadvalini DROP qilish = DEFER (bu faza faqat VIEW-tayyorligini tasdiqlaydi).
- Test-data ko'chirish: **YO'Q.** org_functions data (97 qator) MIGRATE QILINMAYDI (master-reja qarori: "test-data 0, ko'chirilmaydi"). org_departments JONLI data — yagona haqiqat.

---

## § B — QOIDALAR-BLOKI (HAR bosqichda majburiy)

> Bu blokni har commit oldidan qayta o'qi. Manba: `CLAUDE.md` (Qoida A,B,1-23 + Q-24..Q-47), `00-MASTER-REJA.md` §2.

### B.1 — Kod uslubi
- **Result<T>**: har repo/service metod `Promise<Result<T>>` qaytaradi. `throw new Error()` / `return null` TAQIQ (Qoida 1).
- **Zod**: har `@Body()` controller metod Zod schema bilan validate (Qoida 3). `class-validator` TAQIQ.
- **Drizzle**: oddiy CRUD Drizzle ORM. Raw SQL faqat murakkab (LATERAL/RECURSIVE) + izoh bilan (Qoida 4). Bu fazada `card.repository.ts` allaqachon parametrized raw SQL ishlatadi (org-structure modulida ruxsat etilgan pattern) — yangi raw SQL faqat shu mavjud patternga mos.
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13).
- **`as unknown` stub TAQIQ** (Qoida 5). **`sql.raw(variable)` TAQIQ** (Qoida B — SQL injection).

### B.2 — Regress-himoya (Q-39 / Q-46 — egasi qoidasi)
- **Ishlab turgan + to'g'ri kod HECH QACHON o'chirilmaydi.** FE `/org-structure/cards/*` chaqiruvlari ishlaydi → buzma. EmployeeCardsSummary, CardAssignDialog, OrgCardsPanel ishlaydi → saqla.
- **Buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi** (chala emas). O'chirishdan OLDIN: (1) Q-29 verify — haqiqatan ishlamasligini DB+kod bilan tasdiqla; (2) import-yo'qligini `grep` bilan tekshir.
- **Regressiya TAQIQ**: re-point dan keyin AVVAL ishlagan har narsa hamon ishlashi shart (CardController CRUD, EmployeeCardsSummary salary-sum, tree assignUser).

### B.3 — FABRIKATSIYA TAQIQ (Q-40 / Q-2 = "100% = MEXANIZM")
- Data/AI yo'q → **STRUKTURA + GATE** qur, egasi-data ro'yxatiga (§L) yoz. SOXTA qiymat (fake/echo/hardcoded) YOZMA.
- Bu fazada YANGI data kiritilmaydi — faqat FK + so'rov re-point. org_functions data ko'chirilmaydi (qaror).

### B.4 — Verify (Q-29 / Q-32 / Q-40)
- Har bosqich oxiri: **`tsc` GREEN** (o'zgartirgan fayllarda 0 xato) + **END-TO-END rollback-tx DB-proof** (`_audit/bproof-*.cjs`: kirit→oqdi→ko'rindi→ROLLBACK) + jonli isbot (server qaytgach login bilan HTTP).
- Struktura-only YETARLI EMAS. "Yashil lekin noto'g'ri" TAQIQ.
- Server tushsa (Windows `nest watch` crash, Q-44) → static fallback (tsc + diff + DB-proof). Panik yo'q.

### B.5 — Migration (Q-35)
- `migrations-drift.ts` (`apps/api/src/shared/db/invariants/migrations-drift.ts`) idempotent `DRIFT_MIGRATIONS` massiviga qo'shiladi.
- `ALTER ... ADD COLUMN IF NOT EXISTS`, FK uchun `DO $$ ... IF NOT EXISTS ... $$` bloki.
- `DROP` / FK-almashtirish faqat `// APPROVED:` izoh bilan (egasi 2026-06-25 ruxsati — §F da yozilgan).

### B.6 — Dizayn (Q3 / Qoida 21/41/42/43)
- EP token (`var(--ep-*)`) + shablon (ListPage/DetailPage/FormPage) + komponent (`components/ep`, `components/ui`). Xom rang/inline-style TAQIQ.
- Bu faza asosan BACKEND — FE o'zgarishi MINIMAL (faqat re-point natijasida ko'rinish buzilmasligini tasdiqlash). Yangi FE sahifa YO'Q.

### B.7 — Commit (Q-45 / GIT_QOIDALARI)
- Faqat o'z fayllar: `git add <aniq-fayl>`. **`git add -A` / `git add .` TAQIQ.**
- `--no-verify` (pre-commit hook bypass faqat zarurat bo'lsa, sabab bilan).
- Commit oxirida: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Log fayllar (`backend.log*`) HECH QACHON commit qilinmaydi.

### B.8 — Atama
- Muloqotda doim **"KARTA"** (node/tugun/otdeleniye EMAS). "Karta degani bu node."

---

## § C — JORIY HOLAT (jonli-tasdiqlangan)

> Hammasi `node _audit/q.cjs "..."` (read-only tx) + Read/Grep bilan 2026-06-25 da tasdiqlangan. Taxmin YO'Q.

### C.1 — DB jadval qatorlar (q.cjs)

```
org_departments       = 144   (node_type: position 92, department 20, otdeleniye 14, director 11, section 5, ceo 1, owner 1)
org_functions         = 97    (id 1..97, deleted_at=0)
departments           = 18    (legacy)
employee_cards        = 30    (M:N: employee_id → employees, card_id → org_functions)
card_folders          = 2     (card_id → org_functions)
employee_org_departments = 30 (user_id → org_departments — AKTIV tree assignUser yozadi)
```

### C.2 — ⚠️ ID-oraliqlar DISJOINT (crosswalk MAJBURIY)

```
org_functions:   id 1..97
org_departments: id 19..166
```

Ikki jadval ID-lari ustma-ust tushmaydi. Name-match (`lower(trim(name))=lower(trim(position_name))`) → **94/97** mos, lekin DUBLIKAT (of_id 1 "Bosh direktor" + of_id 7 "Bosh Direktor" ikkalasi od_id 64'ga). Demak ID-larni to'g'ridan-to'g'ri ko'chirish MUMKIN EMAS. **Qaror (§D):** FK-data crosswalk (name orqali) faqat AKTIV-data tashiganlar uchun; qolgani (0-data FK) shunchaki struktura re-point.

### C.3 — org_functions'ga keyed 39 FK (qaysilarida DATA bor)

q.cjs bilan tasdiqlangan non-null data:

| Jadval.ustun | non-null qator | Re-point sinfi |
|---|---|---|
| `employee_cards.card_id` | **30** | DATA — crosswalk kerak |
| `card_folders.card_id` | **2** | DATA — crosswalk kerak |
| `users.org_function_id` | **30** | DATA — crosswalk kerak (RBAC/gate o'qiydi) |
| `employees.org_function_id` | **30** | DATA — crosswalk kerak (mirror) |
| `position_permissions.org_function_id` | **1380** | DATA — RBAC (FAZA 2 da to'liq; bu fazada FK saqlanadi) |
| `succession_plans.org_function_id` | **18** | DATA — crosswalk |
| `org_node_portret.card_id` | 0 | struktura-only |
| `position_folder_content.org_function_id` | 0 | struktura-only |
| `salary_bands.org_function_id` | 0 | struktura-only |
| `vacancies.org_function_id` | 0 | struktura-only |
| `tests.org_function_id` | 0 | struktura-only |
| `ai_exam_attempts.org_function_id` | 0 | struktura-only |
| `workflow_rules.source_function_id` | 0 | struktura-only |
| (qolgan ~26 FK: adaptation_programs, applications, candidates, career_development_plans, diary_entries, document_routing_rules, guidelines, hr_onboarding_plans, hr_question_bank, hr_tz2_*, job_templates, okr_*, onboarding_tasks, position_feature_flags, position_required_courses, position_skill_requirements, questionnaire_*, stat_regulations, strategic_tasks) | 0 | struktura-only |

> **org_departments'ga allaqachon 30 FK keladi** (q.cjs) — kanonik hub allaqachon shu yerda.

### C.4 — Asosiy fayllar (fayl:satr — Grep tasdiqlangan)

| Fayl | Satr | Hozir |
|---|---|---|
| `apps/api/src/modules/org-structure/card.repository.ts` | :3, :49, :60, :78-105, :112, :134, :163, :199, :227, :238, :251, :330, :348, :379, :460 | 20+ so'rov `org_functions`'ga keyed |
| `apps/api/src/modules/org-structure/card.controller.ts` | :3, :71 `@Controller('org-structure/cards')` | CardController REGISTERED (de-routed EMAS — modul:30) |
| `apps/api/src/modules/org-structure/card.service.ts` | :3 | "canonical ORG CARD (org_functions)" |
| `apps/api/src/modules/org-structure/card-folder.repository.ts` | :3 `1:1 with org_functions` | card_folders so'rovlari |
| `apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts` | :48 | vacant-count `FROM org_functions f WHERE f.department_id = org_departments.id` (CROSS-REF) |
| `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts` | :184, :230, :247, :251, :284, :304 | backfillManagerIds `org_functions.manager_id` UPDATE |
| `apps/api/src/modules/auth/infrastructure/repositories/drizzle-my-permissions.repo.ts` | :51-52, :68 | RBAC tier `LEFT JOIN org_functions ofn ON ofn.id = u.org_function_id` |
| `apps/api/src/shared/db/invariants/migrations-drift.ts` | :22 `DRIFT_MIGRATIONS` | idempotent ALTER massiv |

### C.5 — FE binding (Grep tasdiqlangan — BUZILMASLIGI shart)

| FE fayl | Endpoint |
|---|---|
| `artifacts/erp-dashboard/src/components/employee/EmployeeCardsSummary.tsx:34` | `GET /api/org-structure/cards/by-employee/:id` |
| `artifacts/erp-dashboard/src/components/hr/org/CardAssignDialog.tsx:67` | `POST /api/org-structure/cards/:id/assign` |
| `artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog.tsx:56` | `/api/org-structure/cards/:id` |
| `artifacts/erp-dashboard/src/components/hr/org/CardFolderDialog.tsx:59,91` | `PUT /api/org-structure/cards/:id/folder` + `PATCH /api/org-structure/cards/:id` |
| `artifacts/erp-dashboard/src/components/hr/org/CardFormDialog.tsx:47` | `/api/org-structure/cards` (POST/PATCH) |
| `artifacts/erp-dashboard/src/components/hr/org/OrgCardsPanel.tsx:28` | `/api/org-structure/cards` |
| `artifacts/erp-dashboard/src/routes/AppRouter.tsx:131-132` | `/org-structure/cards` → `Redirect /hierarchy` (sahifa-route redirect, lekin API ishlatiladi) |

> **MUHIM:** standalone `/org-structure/cards` SAHIFA route redirect bo'lgan, ammo `/api/org-structure/cards/*` API EmployeeProfile + node-detail dialoglari tomonidan AKTIV ishlatiladi. CardController **o'lik EMAS** → retire emas, **re-bind** qilinadi.

### C.6 — org_departments vs org_functions ustun farqi (q.cjs)

| Maqsad | org_departments | org_functions |
|---|---|---|
| Nom | `name`, `name_ru` | `position_name`, `position_name_ru` |
| Ta'rif | `description`, `description_ru` | `function_description`, `function_description_ru` |
| Boshqaruvchi | `head_user_id`, `parent_id` | `manager_id` |
| Soft-delete | **YO'Q** (`is_active` bool + `current_state`) | `deleted_at`, `status` |
| Bo'lim | `parent_id` (daraxt) | `department_id` (FK) |
| Razryad/oylik | `razryad_level_id`, `salary_type`, `min_salary`, `max_salary`, `bonus_config` | `razryad_level_id`, `salary_type`, `min_salary`, `max_salary` |
| RBAC/ЦКП/AI | `rbac_tier`, `tskp`, `tskp_target`, `tskp_measurement_unit`, `statistics_type`, `ai_exam_enabled`, `last_reviewed_at`, `work_schedule` | bir xil + `manager_id` |
| Kod | `code`, `otdeleniye_code` | `code` |

> **Re-bind farqi:** card.repository org_departments'ga ko'chganda `position_name`→`name`, `function_description`→`description`, `manager_id`→`parent_id`, `deleted_at IS NULL`→`is_active = true`, `status`→`current_state`, `department_id = X`→`parent_id = X` (daraxt) map qilinadi. Bu kritik — quyida har so'rov uchun aniq berilgan.

### C.7 — Ikki link-jadval (ZIDDIYAT manbai)

```
employee_org_departments (30)  user_id → org_departments   (AKTIV tree assignUser, bproof-card-assign-1to1.cjs)
employee_cards          (30)   employee_id → org_functions (CardController M:N, EmployeeCardsSummary)
```

Bu — fazaning markaziy ikki-olam ziddiyati. **Qaror (§D.4):** `employee_cards` = kanonik M:N link (FAZA 1 stake_fraction shu yerda quriladi); FK `card_id` → `org_departments`ga ko'chiriladi. `employee_org_departments` → bu fazada SAQLANADI (tree assignUser ishlaydi, regress-himoya) lekin FAZA 1 da `employee_cards`ga konvergatsiya rejalashtirilgan (bu fazada TEGMA, faqat hujjatlashtir).

---

## § D — ARXITEKTURA QARORI VA STRATEGIYA

### D.1 — Yo'nalish: org_departments = haqiqat, org_functions = retire

`org_departments` tanlandi (org_functions emas), chunki:
1. FE TO'LIQ shunga ulangan (tree, hierarchy, node-detail, drag-reparent, EditDialog).
2. Yagona daraxt invariant (parent_id, head_user_id, otdeleniye) shu yerda.
3. JONLI data shu yerda (144 qator, 7 qatlam, razryad/oylik/ЦКП maydonlari).
4. 30 FK allaqachon shunga keladi (kanonik hub).

org_functions:
1. ID disjoint (1-97 vs 19-166) — ko'chirib bo'lmaydi.
2. Data dublikat/nomuvofiq (case-collision).
3. CardController de-facto o'rin-egasi (FE undan salary-sum o'qiydi) — lekin u **org_departments'ga uradigan** qilib re-bind qilinadi, shunda ikki-olam yopiladi.

### D.2 — NEGA migrate-emas (data ko'chirilmaydi)

org_functions ning 97 qatori MIGRATE QILINMAYDI. Sabab (master-reja qarori + Q-40):
- org_departments = ishlab turgan haqiqat. org_functions = qurilish-davri parallel olam (test-data).
- Crosswalk noaniq (94/97, dublikat). Soxta map = fabrikatsiya (B.3 TAQIQ).
- **Faqat AKTIV-data FK** (employee_cards 30, card_folders 2, users/employees 30, succession 18) name-crosswalk orqali org_departments'ga re-point qilinadi (§F.2). Bu DATA bor, demak migrate-emas, balki RE-POINT (mavjud satrning FK qiymatini to'g'ri kartaga yo'naltirish).

### D.3 — Re-point strategiyasi (3 sinf)

1. **SO'ROV re-bind (kod):** `card.repository.ts` + `card-folder.repository.ts` + `org-queries.repo.ts:48` + `drizzle-my-permissions.repo.ts` so'rovlari `org_functions` → `org_departments` (§E, ustun-map §C.6).
2. **DATA FK re-point (DB):** AKTIV-data ko'taradigan 4 jadval (`employee_cards`, `card_folders`, `org_node_portret`, `users`/`employees` mirror) — FK constraint `org_departments`ga + mavjud qiymatlar name-crosswalk orqali yangilanadi (§F.2).
3. **STRUKTURA FK re-point (DB):** 0-data FK (vacancies, tests, salary_bands, ...) — FK constraint `org_departments`ga ko'chiriladi (data UPDATE shart emas, 0 qator). DEFER-mumkin agar Drizzle schema bog'liq bo'lsa — bu fazada faqat **employee_cards + card_folders + org_node_portret** FK majburiy; qolgani DEFER (§F.5).

### D.4 — employee_cards = kanonik M:N

`employee_cards` FK `card_id` → `org_departments.id`. `employee_org_departments` SAQLANADI (tree assignUser regress-himoya). FAZA 1 da konvergatsiya. Bu fazada: faqat employee_cards FK re-point + card.repository so'rovlari org_departments'ga.

### D.5 — org_functions yakuniy holati

- FK keladigan **AKTIV** referrer qolmagach (employee_cards/card_folders/org_node_portret re-pointed, card.repository org_departments'ga) → org_functions **bo'sh-referrer**.
- **VIEW emas, DROP emas BU FAZADA.** Sabab: 39 FK + Drizzle schema (`schema-*.ts`) hali org_functions'ga keyed (struktura-only, 0-data) → DROP qilsa tsc/boot buziladi. **Qaror:** org_functions jadval QOLADI (data 97, lekin AKTIV reader yo'q); compat-VIEW yoki DROP = **FAZA 9 (admin/cleanup)** ga DEFER. Bu fazada `card.repository.ts:3` izoh yangilanadi ("canonical = org_departments; org_functions = retired, no active reader").
- Bu — Q-46 ga mos: org_functions hali 39 FK uchun struktura sifatida kerak (chala-o'chirish TAQIQ); to'liq DROP keyingi fazada barcha FK ko'chgach.

### D.6 — departments (18)

0 FK keladi (q.cjs C.3 da yo'q). DEFER: bu fazada faqat tasdiqlash (0 aktiv reader). VIEW/DROP = FAZA 8 (daraxt yagonaligi). TEGMA.

---

## § E — BOSQICHMA-BOSQICH IJRO (D0..D12)

> Tartib KETMA-KET. Har bosqich: o'zgartir → `tsc` → DB-proof → commit. Bir bosqich buzilsa keyingisiga o'tma.

### D0 — Tayyorgarlik va sessiya protokoli (Q-24)

1. `CLAUDE.md` o'qi (qoidalar). `00-MASTER-REJA.md` + `ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md` § ikki-olam o'qi.
2. `git status` + `git log -5` + `git branch` — toza ish-daraxti, boshqa sessiya yo'qligini tekshir.
3. Backend health: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/api/auth/health` → 200 (yoki dev-server ishga tushir: `pnpm --filter @europrint/api run dev:unsafe`).
4. Joriy holatni qayta-tasdiqla:
   ```bash
   node _audit/q.cjs "SELECT (SELECT count(*) FROM org_departments) od, (SELECT count(*) FROM org_functions) ofn, (SELECT count(*) FROM employee_cards) ec, (SELECT count(*) FROM card_folders) cf"
   ```
   Kutilgan: `od=144, ofn=97, ec=30, cf=2`.
5. **Hech narsa o'zgartirma** bu bosqichda. Faqat tasdiq.

**Qabul:** holat C.1 bilan mos. Commit YO'Q.

---

### D1 — Crosswalk VIEW (org_functions.id → org_departments.id) — name asosida

**Maqsad:** AKTIV-data FK re-point uchun ishonchli, dublikatsiz crosswalk. DB-da material VIEW emas — migration ichida bir martalik UPDATE uchun ishlatiladigan CTE; ammo takror-foydalanish uchun yordamchi VIEW yaratiladi.

**Fayl:** `apps/api/src/shared/db/invariants/migrations-drift.ts` (DRIFT_MIGRATIONS massiviga qo'shiladi).

**Crosswalk qoidasi (dublikat-xavfsiz):**
- `lower(trim(position_name)) = lower(trim(name))` bo'yicha mos.
- Dublikat (1 of_id → ko'p od_id YOKI ko'p of_id → 1 od_id) bo'lsa: eng kichik `org_departments.id` (DISTINCT ON) tanlanadi — deterministik.
- Mos topilmagan of_id (3 ta: "Xavfsizlik xodimi", "HR rahbari", "Moliya direktori") → crosswalk'da YO'Q; ularning FK-data si (agar bo'lsa) D-bosqichda QO'LDA-NULL emas, balki tekshiriladi (§J.3).

**KEYIN (migrations-drift.ts ga qo'shiladigan blok — APPROVED):**

```ts
// APPROVED (egasi 2026-06-25, MASSIV-100 FAZA 00): org_functions → org_departments crosswalk VIEW.
// Read-only yordamchi; name-match, dublikatda eng kichik org_departments.id (deterministik).
{
  name: 'PHASE00 of→od crosswalk VIEW',
  sql: `CREATE OR REPLACE VIEW _of_to_od_crosswalk AS
        SELECT DISTINCT ON (f.id)
               f.id  AS org_function_id,
               d.id  AS org_department_id,
               f.position_name
        FROM org_functions f
        JOIN org_departments d
          ON lower(trim(d.name)) = lower(trim(f.position_name))
        WHERE f.deleted_at IS NULL AND d.is_active = true
        ORDER BY f.id, d.id ASC`,
},
```

**Sabab:** FK re-point UPDATE shu VIEW orqali ishlaydi (bir manba, takrorlanmas). DISTINCT ON dublikatni yo'qotadi.

**Qabul:**
```bash
node _audit/q.cjs "SELECT count(*) matched FROM _of_to_od_crosswalk"   # ~94 kutiladi (migration qo'llangach)
node _audit/q.cjs "SELECT count(*) dup FROM (SELECT org_function_id FROM _of_to_od_crosswalk GROUP BY 1 HAVING count(*)>1) x"  # 0 kutiladi
```

**Edge (§J.3):** crosswalk'da yo'q of_id'lar — D5/D6 da FK re-point qachon UPDATE qilsa, mos-yo'q satr `org_department_id IS NULL` qoladi → bu satr FK-ni buzadi → §J.3 fallback (eng yaqin department yoki QO'LDA owner-data).

**Commit:** `git add apps/api/src/shared/db/invariants/migrations-drift.ts` → `feat(org-phase00): of→od crosswalk view`.

---

### D2 — `card.repository.ts` so'rovlarini org_departments'ga re-bind (ASOSIY)

**Fayl:** `apps/api/src/modules/org-structure/card.repository.ts`.

Bu — fazaning eng katta kod-ishi. 20+ so'rov. Har biri ustun-map (§C.6) bilan ko'chiriladi. Quyida HAR metod uchun OLDIN/KEYIN.

> ⚠️ **Ustun-map qoidasi (har so'rovda):**
> - `org_functions` → `org_departments`
> - `position_name` → `name` · `position_name_ru` → `name_ru`
> - `function_description` → `description` · `function_description_ru` → `description_ru`
> - `manager_id` → `parent_id` (boshqaruvchi/ota-karta)
> - `deleted_at IS NULL` → `is_active = true`
> - `status` → `current_state` · `status = 'archived'` → `current_state = 'archived'`
> - `department_id = X` (FK) → `parent_id = X` (daraxt-ota) — vacant/list filter uchun
> - soft-delete `deleted_at = NOW()` → `is_active = false, current_state = 'archived'`

#### D2.1 — fayl-boshi izoh (:1-7)

**OLDIN:**
```ts
/**
 * @module card.repository
 * @description Data-access for the canonical ORG CARD (`org_functions`). Parametrized SQL ...
 */
```
**KEYIN:**
```ts
/**
 * @module card.repository
 * @description Data-access for the canonical ORG CARD (`org_departments`). Parametrized SQL.
 *   PHASE-00 (MASSIV-100): re-pointed from the retired `org_functions` world to the single
 *   canonical card table `org_departments` (node=karta). Column map: position_name→name,
 *   function_description→description, manager_id→parent_id, deleted_at IS NULL→is_active=true,
 *   status→current_state, department_id filter→parent_id. All reads filter `is_active = true`.
 *   Returns Result<T>.
 */
```
**Sabab:** kanonik manba endi org_departments — izoh haqiqatni aytsin (Q-40).

#### D2.2 — `staleExpr` (:44)
**OLDIN:** `sql\`(f.last_reviewed_at IS NULL OR f.last_reviewed_at < now() - interval '1 year')\``
**KEYIN:** o'zgarmaydi (org_departments'da `last_reviewed_at` bor, C.6). Alias `f` org_departments'ga ishora qiladi.

#### D2.3 — `list()` (:46-56)
**OLDIN:**
```ts
SELECT f.*, d.name AS department_name, ${this.staleExpr} AS is_stale
FROM org_functions f
LEFT JOIN org_departments d ON d.id = f.department_id
WHERE f.deleted_at IS NULL
  AND (${departmentId}::int IS NULL OR f.department_id = ${departmentId})
  AND (${status}::text IS NULL OR f.status = ${status})
ORDER BY f.department_id, f.position_name
```
**KEYIN:**
```ts
SELECT f.*, p.name AS department_name, ${this.staleExpr} AS is_stale
FROM org_departments f
LEFT JOIN org_departments p ON p.id = f.parent_id
WHERE f.is_active = true AND f.node_type = 'position'
  AND (${departmentId}::int IS NULL OR f.parent_id = ${departmentId})
  AND (${status}::text IS NULL OR f.current_state = ${status})
ORDER BY f.parent_id, f.name
```
**Sabab:** karta = `node_type='position'` (C.1); ota-karta = parent_id (daraxt); department_name = ota-node nomi.

#### D2.4 — `findById()` (:58-66)
**OLDIN:** `FROM org_functions f LEFT JOIN org_departments d ON d.id = f.department_id WHERE f.id = ${id} AND f.deleted_at IS NULL`
**KEYIN:** `FROM org_departments f LEFT JOIN org_departments p ON p.id = f.parent_id WHERE f.id = ${id} AND f.is_active = true` (select `p.name AS department_name`).

#### D2.5 — `setCardManager()` (:73-93) + `listManagerCandidates()` (:96-108)
manager_id → parent_id. RECURSIVE descendants `org_functions` → `org_departments`, `f.manager_id = dd.id` → `f.parent_id = dd.id`. UPDATE `org_departments SET parent_id = ${managerId}, ... WHERE id = ${cardId} AND is_active = true RETURNING id, name AS position_name, parent_id AS manager_id`.
**Sabab:** boshqaruvchi = daraxt-ota (org_departments parent_id). Sikl-himoya RECURSIVE bir xil mantiq, parent_id ustida.
**Edge (§J.4):** org_departments'da parent_id ALLAQACHON daraxt-strukturani belgilaydi (tree drag-reparent). setCardManager parent_id'ni o'zgartirsa — bu daraxt-ko'chirish. ⚠️ Bu org-structure move() bilan ZIDLASHMASIN. **Qaror:** setCardManager parent_id YOZADI (manager=ota vizyon EP-ORG-021), move() ham parent_id yozadi — bir xil ustun, ziddiyat yo'q. Lekin CardController:166 `@Patch(':id/manager')` endi tree-reparent qiladi → izohda yoz.

#### D2.6 — `create()` (:110-130)
**OLDIN:** `INSERT INTO org_functions (position_name, position_name_ru, department_id, ...) VALUES (...)`
**KEYIN:** `INSERT INTO org_departments (name, name_ru, parent_id, code, level, razryad_level_id, salary_type, min_salary, max_salary, rbac_tier, current_state, tskp, tskp_target, tskp_measurement_unit, statistics_type, ai_exam_enabled, description, description_ru, node_type, is_active, created_at) VALUES (..., 'position', true, NOW())`.
- `dto.positionName` → name; `dto.departmentId` → parent_id; `dto.status ?? 'active'` → current_state; `node_type = 'position'` qo'shiladi (karta yaratish = position-node).
- ⚠️ org_departments'da `updated_at` yo'q (C.6 da ko'rinmadi — tekshir: `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='org_departments' AND column_name='updated_at'"`). Agar yo'q bo'lsa — `updated_at` ni INSERT/UPDATE'dan OLIB TASHLA (yoki migration ADD COLUMN, §F.4).

#### D2.7 — `update()` (:132-158)
COALESCE-pattern bir xil, ustun-map bilan: position_name→name, ..., department_id→parent_id, status→current_state, function_description→description. `WHERE id = ${id} AND is_active = true`.

#### D2.8 — `softDelete()` (:161-168)
**OLDIN:** `UPDATE org_functions SET deleted_at = NOW(), status = 'archived', updated_at = NOW() WHERE ... AND deleted_at IS NULL RETURNING id, status, deleted_at`
**KEYIN:** `UPDATE org_departments SET is_active = false, current_state = 'archived' WHERE id = ${id} AND is_active = true RETURNING id, current_state AS status`
**Sabab:** org_departments soft-delete = is_active=false (C.6, deleted_at YO'Q). EP-ORG-005 (hech qachon hard-delete) saqlanadi.
**Edge (§J.5):** is_active=false qilingach FE tree'da karta yo'qoladimi? tree query is_active filtrini ishlatadi — ha, vakant/arxiv ajratish FAZA 9. Bu fazada is_active=false = arxiv (regress: avval status='archived' edi, endi is_active=false; FE OrgCardsPanel STATUS_LABEL'ni tekshir — agar status field'ni kutsa, `current_state AS status` alias bilan moslashtirildi).

#### D2.9 — `activeOccupantCount()` (:176-184)
employee_cards so'rovi — `card_id = ${cardId}` o'zgarmaydi (link-jadval), lekin endi cardId = org_departments.id (FK re-pointed D5). So'rov MATNI o'zgarmaydi. **Tasdiqla:** D5 dan keyin card_id qiymatlari org_departments.id bo'ladi.

#### D2.10 — `listEmployees()` (:192-207) + `computeCardFit()` (:215-232) + `listEmployeeCards()` (:323-335) + `employeeSalaryTotal()` (:344-353)
Bularda `JOIN org_functions f2 ON f2.id = ec2.card_id` / `JOIN org_functions f ON f.id = ec.card_id` bor → `JOIN org_departments f ON f.id = ec.card_id`. `f.max_salary` o'zgarmaydi (org_departments'da bor). `f.position_name` → `f.name AS position_name` (alias saqla — FE shu nomni kutadi). `f.deleted_at IS NULL` → `f.is_active = true`. `computeCardFit`'da `f.razryad_level_id` o'zgarmaydi; `LEFT JOIN org_node_portret p ON p.card_id = f.id` o'zgarmaydi (org_node_portret.card_id D6 da org_departments'ga re-pointed).
**Sabab:** FORMULA-A salary-sum endi kanonik kartadan o'qiydi. FE EmployeeCardsSummary buzilmaydi (alias `position_name`, `card_salary` saqlanadi).

#### D2.11 — `listChildren()` (:235-241)
**OLDIN:** `FROM org_functions WHERE manager_id = ${cardId} AND deleted_at IS NULL`
**KEYIN:** `SELECT id, name AS position_name, code, level, current_state AS status FROM org_departments WHERE parent_id = ${cardId} AND is_active = true ORDER BY level NULLS LAST, name`

#### D2.12 — `listVacancies()` (:244-254)
**OLDIN:** `FROM vacancies WHERE org_function_id = ${cardId}`
**KEYIN (qaror):** vacancies.org_function_id = 0 data (C.3). Bu faza: vacancies FK re-point DEFER (FAZA 9). So'rovni o'zgartirma (vacancies hali org_function_id ustunini ko'taradi), LEKIN cardId endi org_departments.id → 0 natija qaytaradi (mos yo'q). **Izoh qo'sh:** `// PHASE-00: vacancies.org_function_id re-point deferred to FAZA 9; 0 rows live, no regress.` Bu Q-46 ga mos (0-data, hech narsa buzilmaydi).

#### D2.13 — `listHistory()` (:257-263)
audit_logs so'rovi — `table_name = 'card'` o'zgarmaydi. cardId qiymati (record_id) endi org_departments.id. O'zgartirma.

#### D2.14 — `assignEmployee()` (:272-285) + `unassignEmployee()` (:288-295) + `setPrimaryCard()` (:298-305) + `repointPrimaryMirror()` (:308-316)
employee_cards INSERT/UPDATE — `card_id` o'zgarmaydi (link). LEKIN `setPrimaryCard` + `repointPrimaryMirror` `employees.org_function_id`ni yozadi (mirror). cardId endi org_departments.id → `employees.org_function_id`ga org_departments.id yoziladi. ⚠️ `employees.org_function_id` FK org_functions'ga (C.3) → org_departments.id INSERT qilsa **FK violation**.
**Qaror (kritik):** `employees.org_function_id` FK D5 da org_departments'ga re-pointed bo'lishi SHART (mirror yozish ishlashi uchun). YOKI mirror `employees.org_department_id`ga (agar ustun bor bo'lsa — tekshir) ko'chiriladi. **Tekshir:** `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='employees' AND column_name IN ('org_function_id','org_department_id')"`. Agar `org_department_id` bor → mirror'ni unga ko'chir (toza); agar faqat `org_function_id` → D5 FK re-point shart.

#### D2.15 — `listCertificates()` (:359-371)
employee_cards + certificates JOIN — `ec.card_id = ${cardId}` o'zgarmaydi. O'zgartirma.

#### D2.16 — `markReviewed()` (:376-383)
**OLDIN:** `UPDATE org_functions SET last_reviewed_at = NOW(), updated_at = NOW() WHERE id = ${cardId} AND deleted_at IS NULL`
**KEYIN:** `UPDATE org_departments SET last_reviewed_at = NOW() WHERE id = ${cardId} AND is_active = true RETURNING id, last_reviewed_at` (updated_at agar yo'q bo'lsa olib tashla).

#### D2.17 — `revertExpiredActing()` (:390-397)
employee_cards-only — o'zgarmaydi.

#### D2.18 — `getCardPortret()` (:405-410) + `saveCardPortret()` (:416-441)
org_node_portret — `card_id = ${cardId}` o'zgarmaydi (link); cardId endi org_departments.id (org_node_portret.card_id D6 re-pointed). O'zgartirma.

#### D2.19 — `resolveGate()` (:451-464)
**OLDIN:** `LEFT JOIN org_functions ofn ON ofn.id = u.org_function_id AND ofn.deleted_at IS NULL ... ofn.position_name AS card_name, ofn.rbac_tier`
**KEYIN:** `LEFT JOIN org_departments ofn ON ofn.id = u.org_function_id AND ofn.is_active = true ... ofn.name AS card_name, ofn.rbac_tier`
**Sabab:** card-gate RBAC tier kanonik kartadan. ⚠️ `u.org_function_id` FK D5 re-pointed bo'lsa, qiymat org_departments.id'ga ishora qiladi → JOIN ishlaydi. FAZA 2 da login-gate to'liq (bu fazada faqat re-bind, gate-logika TEGMA).

**Qabul (D2):** `tsc` GREEN. card.repository.ts'da `org_functions` 0 marta (`grep -c org_functions card.repository.ts` → 0). FE EmployeeCardsSummary alias-larini oladi.

**Commit:** `git add apps/api/src/modules/org-structure/card.repository.ts` → `refactor(org-phase00): rebind card.repository to org_departments`.

---

### D3 — `card-folder.repository.ts` re-bind

**Fayl:** `apps/api/src/modules/org-structure/card-folder.repository.ts`.

So'rovlari `card_folders`ga uradi (org_functions emas) — so'rov MATNI o'zgarmaydi (`card_folders` jadval-nomi). Faqat:
- :3 izoh: `1:1 with org_functions` → `1:1 with org_departments (PHASE-00 re-point)`.
- `cardId` endi org_departments.id (card_folders.card_id D6 FK re-pointed).

**Qabul:** `tsc` GREEN; izoh haqiqatni aytadi.
**Commit:** `git add apps/api/src/modules/org-structure/card-folder.repository.ts` → `docs(org-phase00): card-folder canonical = org_departments`.

---

### D4 — `org-queries.repo.ts:48` vacant-count cross-ref uz

**Fayl:** `apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts:48`.

**OLDIN:**
```ts
vacantCardCount: sql<number>`(SELECT COUNT(*)::int FROM org_functions f WHERE f.department_id = ${orgDepartments.id} AND f.deleted_at IS NULL AND f.is_active = true AND f.status = 'vacant')`,
```
**KEYIN:**
```ts
vacantCardCount: sql<number>`(SELECT COUNT(*)::int FROM org_departments f WHERE f.parent_id = ${orgDepartments.id} AND f.is_active = true AND f.node_type = 'position' AND f.current_state = 'vacant')`,
```
**Sabab:** vacant-count endi kanonik jadval ichida (cross-ref tugaydi — ikki-olam yopiladi). karta = node_type='position'; ota = parent_id.
**Edge:** `current_state = 'vacant'` — hozir 144/144 NULL (C.6, gap-doc). 0 natija qaytaradi (regress yo'q — avval ham org_functions.status='vacant' 0 edi). FAZA 9 da current_state to'ldiriladi.

**Qabul:** `tsc` GREEN; so'rov org_departments-ichida.
**Commit:** `git add apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts` → `refactor(org-phase00): vacant-count within org_departments`.

---

### D5 — DATA FK re-point: employee_cards + users/employees mirror (DB migration)

**Fayl:** `migrations-drift.ts` (APPROVED bloklar — §F.2).

1. **`employee_cards.card_id`** FK `org_functions` → `org_departments` + 30 qiymat crosswalk orqali UPDATE.
2. **`users.org_function_id`** + **`employees.org_function_id`** — mirror. ⚠️ Agar `employees.org_department_id` ustuni bor (D2.14 tekshir) → mirror'ni unga ko'chir (toza, FK re-point shart emas); agar yo'q → FK re-point.

Aniq SQL §F.2 da.

**Qabul (DB-proof, rollback-tx):** §K.2 skript — employee_cards.card_id endi org_departments.id'ga ishora qiladi; FK constraint `employee_cards_card_id_fkey` → org_departments.

**Commit:** `git add apps/api/src/shared/db/invariants/migrations-drift.ts` → `feat(org-phase00): repoint employee_cards FK to org_departments`.

---

### D6 — DATA/STRUKTURA FK re-point: card_folders + org_node_portret (DB migration)

**Fayl:** `migrations-drift.ts` (APPROVED — §F.3).

1. **`card_folders.card_id`** FK → org_departments + 2 qiymat crosswalk UPDATE (`delete_rule` CASCADE → org_departments).
2. **`org_node_portret.card_id`** FK → org_departments (0 data — faqat constraint).

**Qabul (DB-proof):** §K.3 — card_folders FK org_departments; insert org_departments.id → oqdi; insert org_functions-only.id → 23503 (FK violation).

**Commit:** `git add apps/api/src/shared/db/invariants/migrations-drift.ts` → `feat(org-phase00): repoint card_folders+portret FK to org_departments`.

---

### D7 — RBAC permission re-bind (drizzle-my-permissions.repo.ts)

**Fayl:** `apps/api/src/modules/auth/infrastructure/repositories/drizzle-my-permissions.repo.ts:51-68`.

**OLDIN:**
```ts
// EP-ORG-003 card-gate: RBAC tier resolves FROM THE CARD (canonical org_functions via users.org_function_id)
LEFT JOIN org_functions ofn ON ofn.id = u.org_function_id AND ofn.deleted_at IS NULL
```
**KEYIN:**
```ts
// EP-ORG-003 card-gate: RBAC tier resolves FROM THE CARD (canonical org_departments via users.org_function_id; PHASE-00)
LEFT JOIN org_departments ofn ON ofn.id = u.org_function_id AND ofn.is_active = true
```
**Sabab:** RBAC tier kanonik kartadan. `u.org_function_id` D5 re-pointed → org_departments.id.
**⚠️ Ehtiyot:** `position_permissions.org_function_id` (1380 qator) bu fazada TEGMA — RBAC level resolution FAZA 2. Bu yerda faqat tier-JOIN re-bind. Agar bu repo `position_permissions`ni ham org_function_id orqali o'qisa — uni TEGMA (FAZA 2), faqat org_functions JOIN tier-qatorini ko'chir.

**Qabul:** `tsc` GREEN; auth-test (login → /auth/me/permissions 200, tier kartadan).
**Commit:** `git add apps/api/src/modules/auth/infrastructure/repositories/drizzle-my-permissions.repo.ts` → `refactor(org-phase00): rbac tier from org_departments`.

---

### D8 — card.service.ts + card.controller.ts izoh re-bind

**Fayllar:** `card.service.ts:3`, `card.controller.ts:3`.
Faqat izoh: `org_functions` → `org_departments`. Logika TEGMA (so'rovlar repo'da). card.controller.ts:166 `@Patch(':id/manager')` izohiga: `// PHASE-00: manager = parent_id (tree-reparent on org_departments)`.

**Qabul:** `tsc` GREEN; izohlar haqiqatni aytadi.
**Commit:** `git add apps/api/src/modules/org-structure/card.service.ts apps/api/src/modules/org-structure/card.controller.ts` → `docs(org-phase00): card module canonical = org_departments`.

---

### D9 — org_functions retire hujjatlash (DROP EMAS)

**Fayl:** `card.repository.ts:1-7` izoh (D2.1 da bajarilgan) + `docs/audit/MASSIV-100/PHASE-00-kanonik-jadval-yagona-ddl.md` (bu fayl) ga holat-yozuv.

- org_functions jadval QOLADI (39 FK + Drizzle schema). AKTIV reader YO'Q (card.repository, card-folder, org-queries, my-permissions org_departments'ga ko'chgan).
- compat-VIEW yoki DROP = **FAZA 9** DEFER. Bu fazada DROP QILMA (Q-46: chala-o'chirish TAQIQ, struktura hali kerak).

**Qabul:** kodda AKTIV org_functions read 0 (D11 verify). Commit YO'Q (hujjat-only, bu faylga yoziladi).

---

### D10 — departments(18) tasdiqlash (TEGMA)

`node _audit/q.cjs` bilan tasdiqla: departments'ga 0 FK keladi (C.3). VIEW/DROP = FAZA 8. Bu fazada HECH NARSA qilma — faqat tasdiq-yozuv.

---

### D11 — Faza-keng grep verify (AKTIV org_functions reader = 0)

```bash
cd Uzbek-Language-Module
# org-structure modulida AKTIV org_functions read qolmaganini tasdiqla:
grep -rn "org_functions" apps/api/src/modules/org-structure/ | grep -v "PHASE-00\|retired\|backfillManagerIds\|migrations"
# Kutilgan: faqat org-mutations.repo.ts backfillManagerIds (P51, FAZA 8) + izohlar.
```
backfillManagerIds (org-mutations.repo.ts:230-251) `org_functions.manager_id` UPDATE qiladi — bu **FAZA 8** (manager-zanjir) ishi, DATA-gated (head_user_id NULL), dryRun default. Bu fazada TEGMA. Izoh qo'sh: `// PHASE-00: org_functions manager backfill = FAZA 8 (deferred); active card manager = org_departments.parent_id.`

---

### D12 — Yakuniy integratsiya verify (§K to'liq)

`tsc` (BE) GREEN → barcha bproof skriptlar → server qaytsa jonli HTTP. §K.

---

## § F — DB MIGRATION (APPROVED SQL bloklari)

> Hammasi `migrations-drift.ts` `DRIFT_MIGRATIONS` massiviga `{ name, sql }` sifatida. Idempotent. FK-almashtirish `DO $$` bloki bilan (IF EXISTS DROP eski + ADD yangi). **APPROVED: egasi 2026-06-25, MASSIV-100 FAZA 00 — ikki-olam yopish.**

### F.1 — updated_at tekshiruvi (D2.6 sharti)

```bash
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='org_departments' AND column_name='updated_at'"
```
Bo'sh qaytsa → quyidagi ADD COLUMN (yoki INSERT/UPDATE'dan updated_at olib tashlash, D2.6):
```ts
{ name: 'PHASE00 org_departments.updated_at ADD COLUMN', sql: `ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()` },
```

### F.2 — employee_cards.card_id FK re-point (D5)

```ts
// APPROVED (egasi 2026-06-25): employee_cards.card_id → org_departments (kanonik karta).
{
  name: 'PHASE00 employee_cards.card_id repoint values',
  sql: `UPDATE employee_cards ec
        SET card_id = x.org_department_id
        FROM _of_to_od_crosswalk x
        WHERE ec.card_id = x.org_function_id`,
},
{
  name: 'PHASE00 employee_cards.card_id FK → org_departments',
  sql: `DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                     WHERE constraint_name='employee_cards_card_id_fkey') THEN
            ALTER TABLE employee_cards DROP CONSTRAINT employee_cards_card_id_fkey;
          END IF;
          ALTER TABLE employee_cards
            ADD CONSTRAINT employee_cards_card_id_fkey
            FOREIGN KEY (card_id) REFERENCES org_departments(id) ON DELETE RESTRICT;
        END $$;`,
},
```

> **users/employees mirror** (D2.14 tekshiruviga qarab):
> - Agar `employees.org_department_id` bor: mirror'ni unga ko'chir (card.repository D2.14 da `org_department_id` yoz; FK allaqachon org_departments). FK re-point SHART EMAS.
> - Agar faqat `org_function_id`: qiymat UPDATE (crosswalk) + FK re-point (employee_cards bilan bir xil pattern). users/employees `delete_rule` SET NULL saqlanadi.

### F.3 — card_folders + org_node_portret FK re-point (D6)

```ts
{
  name: 'PHASE00 card_folders.card_id repoint values',
  sql: `UPDATE card_folders cf
        SET card_id = x.org_department_id
        FROM _of_to_od_crosswalk x
        WHERE cf.card_id = x.org_function_id`,
},
{
  name: 'PHASE00 card_folders.card_id FK → org_departments',
  sql: `DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                     WHERE constraint_name='card_folders_card_id_fkey') THEN
            ALTER TABLE card_folders DROP CONSTRAINT card_folders_card_id_fkey;
          END IF;
          ALTER TABLE card_folders
            ADD CONSTRAINT card_folders_card_id_fkey
            FOREIGN KEY (card_id) REFERENCES org_departments(id) ON DELETE CASCADE;
        END $$;`,
},
{
  name: 'PHASE00 org_node_portret.card_id FK → org_departments',
  sql: `DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                     WHERE constraint_name='org_node_portret_card_id_fkey') THEN
            ALTER TABLE org_node_portret DROP CONSTRAINT org_node_portret_card_id_fkey;
          END IF;
          ALTER TABLE org_node_portret
            ADD CONSTRAINT org_node_portret_card_id_fkey
            FOREIGN KEY (card_id) REFERENCES org_departments(id) ON DELETE SET NULL;
        END $$;`,
},
```
> org_node_portret.card_id = 0 data → UPDATE shart emas, faqat constraint. Constraint nomini tasdiqla:
> `node _audit/q.cjs "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='org_node_portret' AND constraint_type='FOREIGN KEY'"`

### F.4 — DEFER bloki (BU FAZADA QILINMAYDI — keyingi fazaga)

- 0-data 26+ FK (vacancies, tests, salary_bands, ...) → FAZA 9.
- org_functions DROP/VIEW → FAZA 9.
- departments(18) VIEW/DROP → FAZA 8.
- employee_org_departments → employee_cards konvergatsiya → FAZA 1.

### F.5 — Migration qo'llash

`migrations-drift.ts` startup'da avtomatik ishlaydi (boot). Qo'lda tekshirish: server restart (`pnpm --filter @europrint/api run dev:unsafe`) → boot-log "DRIFT" satrlari → xato yo'q.

---

## § G — Zod / Result / Drizzle namunalari

### G.1 — Result<T> (har repo metod)
```ts
async findById(id: number): Promise<Result<Row | null>> {
  const r = await this.exec(sql`SELECT ... FROM org_departments f WHERE f.id = ${id} AND f.is_active = true`);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```
`exec` (card.repository.ts:39) `safeCall` orqali Result qaytaradi — pattern saqlanadi.

### G.2 — Zod (card.controller — mavjud, TEGMA)
CardController DTO Zod schema ishlatadi (card.controller.ts). Bu fazada controller LOGIKA o'zgarmaydi — Zod schema'lar o'zgarmaydi (faqat repo so'rovi org_departments'ga). Ustun-nomlar DTO'da `positionName` qoladi (FE shu nom yuboradi); repo `dto.positionName → name` map qiladi (D2.6).

### G.3 — Drizzle (org-queries.repo.ts — mavjud)
org-queries.repo.ts `orgDepartments` Drizzle jadval-obyektini ishlatadi (`${orgDepartments.id}`). vacant-count subquery `sql` template — Drizzle-mixed pattern saqlanadi (D4).

---

## § H — FE + DIZAYN (EP token/shablon/komponent)

### H.1 — Bu faza FE-ga TA'SIRI
Bu faza BACKEND re-point. FE kod O'ZGARMAYDI (re-bind shaffof — endpoint URL, response shakli, alias-lar saqlanadi). FE faqat **regress-tasdiqlanadi**:
- `EmployeeCardsSummary.tsx` — salary-sum ko'rsatadi (alias `card_salary`, `position_name`, `total_salary` saqlangani uchun buzilmaydi).
- `CardAssignDialog.tsx` / `CardFormDialog.tsx` / `CardFolderDialog.tsx` — POST/PUT/PATCH ishlaydi (controller-route o'zgarmagan).
- `OrgCardsPanel.tsx` — list ishlaydi (`current_state AS status` alias).
- Tree (`OrgStructureHierarchy`) — assignUser (employee_org_departments) TEGILMAGAN → ishlaydi.

### H.2 — Dizayn-qoida (Q3/Qoida 21)
Yangi FE sahifa YO'Q. Mavjud komponentlar EP token (`var(--ep-*)`) bilan — o'zgarmaydi. Agar re-point natijasida biror alias o'zgarsa (masalan FE `status` field kutsa, BE `current_state` qaytarsa) → BE so'rovida `AS status` alias bilan moslashtir (D2.8/D2.11), FE TEGMA.

### H.3 — Regress-verify (jonli)
Server qaytgach: login → EmployeeProfile och → "Ish" tab → EmployeeCardsSummary kartalar + jami-oylik ko'rinadi (re-point oldin/keyin bir xil). Node-detail → "Xodimlar" tab → occupant ko'rinadi.

---

## § I — QABUL-MEZONI (faza yopilish sharti)

1. ✅ **Bitta karta-jadval:** card.repository.ts + card-folder.repository.ts + org-queries.repo.ts:48 + drizzle-my-permissions.repo.ts AKTIV org_functions read = 0 (D11 grep).
2. ✅ **FK kanonik:** `employee_cards.card_id`, `card_folders.card_id`, `org_node_portret.card_id` FK → `org_departments` (DB-proof §K).
3. ✅ **DATA to'g'ri:** employee_cards 30 qatorning card_id endi org_departments.id'ga ishora qiladi (crosswalk); orphan (FK violation) 0.
4. ✅ **Regress yo'q:** EmployeeCardsSummary salary-sum, CardController CRUD, tree assignUser, RBAC tier — hammasi ishlaydi (jonli).
5. ✅ **tsc GREEN:** o'zgartirilgan BE fayllarda 0 xato.
6. ✅ **DB-proof:** har FK re-point uchun rollback-tx skript (kirit org_departments.id→oqdi; kirit org_functions-only.id→23503 violation).
7. ✅ **Fabrikatsiya yo'q:** YANGI data yozilmagan; org_functions data ko'chirilmagan (faqat AKTIV FK re-point).
8. ✅ **org_functions retire-holat:** jadval qoladi (DROP DEFER FAZA 9), AKTIV reader 0, izoh haqiqatni aytadi.

---

## § J — EDGE-HOLATLAR

- **J.1 — Crosswalk dublikat:** of_id 1 "Bosh direktor" + of_id 7 "Bosh Direktor" → bir od_id. DISTINCT ON (D1) eng kichik od_id tanlaydi. employee_cards 30 qatorning qaysi of_id'ga keyed ekani tekshiriladi (§K.1).
- **J.2 — Mos-yo'q of_id (3 ta):** "Xavfsizlik xodimi"/"HR rahbari"/"Moliya direktori" crosswalk'da YO'Q. Agar employee_cards/users shu of_id'ga keyed bo'lsa → UPDATE'dan keyin o'zgarmagan qoladi → FK ADD paytida violation. **Fallback:** ushbu satrlarni aniqla (`SELECT * FROM employee_cards WHERE card_id NOT IN (SELECT org_function_id FROM _of_to_od_crosswalk)`); agar bor — egasi-data (§L) yoki name-fuzzy qo'shimcha mos (lower+unaccent). FABRIKATSIYA emas — egasiga ro'yxat.
- **J.3 — FK ADD violation:** UPDATE oldin FK ADD qilinmaydi (tartib: avval UPDATE qiymat, keyin DROP+ADD constraint). Agar violation → ROLLBACK, mos-yo'q satr §J.2.
- **J.4 — setCardManager vs tree move():** ikkalasi parent_id yozadi — ziddiyat yo'q (bir ustun). manager = ota-karta (EP-ORG-021). Izoh aniq (D2.5).
- **J.5 — softDelete is_active=false:** FE OrgCardsPanel STATUS_LABEL tekshir — `current_state AS status` alias bilan moslashtirildi (D2.8).
- **J.6 — updated_at yo'q:** org_departments'da updated_at bo'lmasa (F.1) — INSERT/UPDATE'dan olib tashla yoki ADD COLUMN. Tekshirilmasdan yozma (tsc xato emas, runtime SQL xato bo'lardi).
- **J.7 — employees.org_function_id mirror FK:** D2.14 — org_department_id ustuni bor-yo'qligiga qarab toza-mirror yoki FK re-point. Tekshir-keyin-yoz.
- **J.8 — Windows nest-watch crash (Q-44):** rebuild'dan keyin :3030 tushsa (000, /auth/health ham 000) = muhit, kod emas. dev-server restart. Static fallback (tsc + DB-proof) bilan tasdiqla.

---

## § K — SELF-VERIFY (tsc + rollback-tx DB-proof + jonli isbot)

### K.0 — tsc (har bosqich oxiri)
```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit   # o'zgartirilgan fayllarda 0 xato
```

### K.1 — Crosswalk + employee_cards keyed-tekshiruv (read-only)
```bash
node _audit/q.cjs "SELECT count(*) matched FROM _of_to_od_crosswalk"
node _audit/q.cjs "SELECT count(*) dup FROM (SELECT org_function_id FROM _of_to_od_crosswalk GROUP BY 1 HAVING count(*)>1) x"
node _audit/q.cjs "SELECT count(*) unmapped FROM employee_cards WHERE card_id NOT IN (SELECT org_function_id FROM _of_to_od_crosswalk)"
```

### K.2 — DB-proof: employee_cards FK re-point (rollback-tx skript namuna)
Yarat: `_audit/bproof-phase00-employee-cards-fk.cjs`
```js
/** PHASE-00 DB-PROOF (rollback-tx): employee_cards.card_id → org_departments.
 *  1) FK constraint org_departments'ga ishora qiladimi (catalog)
 *  2) org_departments.id'ga INSERT → oqadi
 *  3) org_functions-only id (org_departments'da yo'q) → 23503 FK violation
 *  Oxirida ROLLBACK. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const fk = (await c.query(`SELECT ccu.table_name FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name
      WHERE tc.constraint_name='employee_cards_card_id_fkey'`)).rows[0];
    console.log(`1) FK → ${fk && fk.table_name}  (kutilgan: org_departments)`);

    const od = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active LIMIT 1`)).rows[0].id;
    const emp = (await c.query(`SELECT id FROM employees ORDER BY id LIMIT 1`)).rows[0].id;
    const ofOnly = (await c.query(`SELECT f.id FROM org_functions f
      WHERE NOT EXISTS (SELECT 1 FROM org_departments d WHERE d.id=f.id) LIMIT 1`)).rows[0].id; // 1..18 (od dan tashqari)

    await c.query('BEGIN');
    await c.query(`INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active, assigned_at, created_at, updated_at)
                   VALUES ($1,$2,false,true,now(),now(),now())`, [emp, od]);
    console.log(`2) INSERT card_id=org_departments(${od}) → oqdi (kutilgan: oqadi)`);
    try {
      await c.query(`INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active, assigned_at, created_at, updated_at)
                     VALUES ($1,$2,false,true,now(),now(),now())`, [emp, ofOnly]);
      console.log(`3) INSERT card_id=org_functions-only(${ofOnly}) → OQDI (KUTILMAGAN — FK buzuq!)`);
    } catch (e) {
      console.log(`3) INSERT card_id=${ofOnly} → ${e.code} (kutilgan: 23503 FK violation)`);
    }
    await c.query('ROLLBACK');
    console.log('ROLLBACK — hech narsa saqlanmadi.');
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
Ishga tushir: `node _audit/bproof-phase00-employee-cards-fk.cjs`.

### K.3 — DB-proof: card_folders FK (xuddi K.2, card_folders + CASCADE)
Yarat: `_audit/bproof-phase00-card-folders-fk.cjs` — bir xil shablon (jadval=card_folders, ustun=card_id, INSERT 6-bo'lim minimal, org_departments.id oqadi / org_functions-only 23503).

### K.4 — Jonli isbot (server qaytgach)
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3030/api/auth/health   # 200
# login token bilan:
curl -s http://127.0.0.1:3030/api/org-structure/cards -H "Authorization: Bearer $T" | head -c 400   # 200, kartalar (org_departments-dan)
curl -s "http://127.0.0.1:3030/api/org-structure/cards/by-employee/1" -H "Authorization: Bearer $T" | head -c 400  # salary-sum
```
FE: login → EmployeeProfile "Ish" tab → kartalar + jami-oylik ko'rinadi (regress yo'q).

### K.5 — Grep verify (D11)
```bash
grep -rc "org_functions" apps/api/src/modules/org-structure/card.repository.ts   # 0 (faqat izohda PHASE-00/retired bo'lsa OK)
```

---

## § L — OWNER-DATA REESTRI (fabrikatsiya TAQIQ)

Bu faza STRUKTURA — YANGI owner-data TALAB QILMAYDI. Faqat quyidagi edge'da egasi-aralashuvi mumkin:

| Holat | Nima kerak | Qachon |
|---|---|---|
| Crosswalk mos-yo'q of_id (J.2) — agar employee_cards/users shunga keyed | egasi: shu xodim qaysi org_departments kartasiga tegishli (name-fuzzy yetmasa) | D5 violation bo'lsa |
| (boshqa owner-data YO'Q — bu faza struktura) | — | — |

> Eslatma: razryad/oylik/rbac_tier/head_user_id qiymatlari = FAZA 1-8 owner-data (§ MASTER-REJA §4). Bu fazada TEGILMAYDI.

---

## § M — COMMIT TARTIBI

| Bosqich | Fayl(lar) | Commit xabari |
|---|---|---|
| D1 | migrations-drift.ts | `feat(org-phase00): of→od crosswalk view` |
| D2 | card.repository.ts | `refactor(org-phase00): rebind card.repository to org_departments` |
| D3 | card-folder.repository.ts | `docs(org-phase00): card-folder canonical = org_departments` |
| D4 | org-queries.repo.ts | `refactor(org-phase00): vacant-count within org_departments` |
| D5 | migrations-drift.ts | `feat(org-phase00): repoint employee_cards FK to org_departments` |
| D6 | migrations-drift.ts | `feat(org-phase00): repoint card_folders+portret FK to org_departments` |
| D7 | drizzle-my-permissions.repo.ts | `refactor(org-phase00): rbac tier from org_departments` |
| D8 | card.service.ts, card.controller.ts | `docs(org-phase00): card module canonical = org_departments` |
| K.2/K.3 | _audit/bproof-phase00-*.cjs | `test(org-phase00): db-proof FK repoint` |

Har commit:
```
<xabar>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```
`git add <aniq-fayl>` (HECH QACHON `-A`). `--no-verify` faqat pre-commit hook noto'g'ri bloklasa (sabab bilan).

---

## § N — ILOVA: TO'LIQ OLDIN/KEYIN KOD (card.repository.ts asosiy metodlar)

> Bu ilova D2 ning eng katta/xavfli metodlarini TO'LIQ ko'chiriladigan kod bilan beradi (taxmin/parcha emas). Muslimbek shu bloklarni aynan qo'llaydi. Har biri `exec(sql\`...\`)` ichida.

### N.1 — `list()` to'liq (D2.3)

**OLDIN (card.repository.ts:46-56):**
```ts
async list(departmentId: number | null, status: string | null): Promise<Result<Row[]>> {
  return this.exec(sql`
    SELECT f.*, d.name AS department_name, ${this.staleExpr} AS is_stale
    FROM org_functions f
    LEFT JOIN org_departments d ON d.id = f.department_id
    WHERE f.deleted_at IS NULL
      AND (${departmentId}::int IS NULL OR f.department_id = ${departmentId})
      AND (${status}::text IS NULL OR f.status = ${status})
    ORDER BY f.department_id, f.position_name
  `);
}
```
**KEYIN:**
```ts
async list(departmentId: number | null, status: string | null): Promise<Result<Row[]>> {
  // PHASE-00: kanonik karta = org_departments (node_type='position'); ota-karta = parent_id.
  return this.exec(sql`
    SELECT f.*, f.name AS position_name, p.name AS department_name, ${this.staleExpr} AS is_stale
    FROM org_departments f
    LEFT JOIN org_departments p ON p.id = f.parent_id
    WHERE f.is_active = true AND f.node_type = 'position'
      AND (${departmentId}::int IS NULL OR f.parent_id = ${departmentId})
      AND (${status}::text IS NULL OR f.current_state = ${status})
    ORDER BY f.parent_id, f.name
  `);
}
```
> ⚠️ `f.name AS position_name` alias QO'SHILDI — FE OrgCardsPanel/CardFormDialog `position_name` field'ni kutadi (regress-himoya). `f.*` org_departments'ning `name` ustunini qaytaradi, ammo FE eskicha `position_name` o'qiydi → alias majburiy.

### N.2 — `findById()` to'liq (D2.4)

**KEYIN:**
```ts
async findById(id: number): Promise<Result<Row | null>> {
  const r = await this.exec(sql`
    SELECT f.*, f.name AS position_name, p.name AS department_name, ${this.staleExpr} AS is_stale
    FROM org_departments f
    LEFT JOIN org_departments p ON p.id = f.parent_id
    WHERE f.id = ${id} AND f.is_active = true
  `);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```

### N.3 — `setCardManager()` to'liq (D2.5)

**KEYIN:**
```ts
async setCardManager(cardId: number, managerId: number | null): Promise<Result<Row | null>> {
  // PHASE-00: boshqaruvchi = ota-karta = org_departments.parent_id (EP-ORG-021 daraxt).
  if (managerId !== null) {
    if (managerId === cardId) return Err("Karta o'zini boshqara olmaydi");
    const sub = await this.exec(sql`
      WITH RECURSIVE descendants AS (
        SELECT id FROM org_departments WHERE id = ${cardId}
        UNION ALL
        SELECT f.id FROM org_departments f JOIN descendants dd ON f.parent_id = dd.id
      )
      SELECT 1 AS hit FROM descendants WHERE id = ${managerId} LIMIT 1
    `);
    if (!sub.ok) return Err(sub.error);
    if (sub.data.length > 0) return Err("Sikl: boshqaruvchi quyi (farzand) karta bo'la olmaydi");
  }
  const r = await this.exec(sql`
    UPDATE org_departments SET parent_id = ${managerId}
    WHERE id = ${cardId} AND is_active = true
    RETURNING id, name AS position_name, parent_id AS manager_id
  `);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```
> `RETURNING ... parent_id AS manager_id` — FE ChildrenTab `manager_id` field'ni kutadi (alias regress).

### N.4 — `listManagerCandidates()` to'liq (D2.5)

**KEYIN:**
```ts
async listManagerCandidates(cardId: number): Promise<Result<Row[]>> {
  return this.exec(sql`
    WITH RECURSIVE descendants AS (
      SELECT id FROM org_departments WHERE id = ${cardId}
      UNION ALL
      SELECT f.id FROM org_departments f JOIN descendants dd ON f.parent_id = dd.id
    )
    SELECT f.id, f.name AS position_name, f.code, f.level
    FROM org_departments f
    WHERE f.is_active = true AND f.id NOT IN (SELECT id FROM descendants)
    ORDER BY f.level NULLS LAST, f.name
  `);
}
```

### N.5 — `create()` to'liq (D2.6)

**KEYIN (updated_at org_departments'da BOR deb faraz; F.1 tasdiqlansin):**
```ts
async create(dto: CardInput): Promise<Result<Row | null>> {
  const r = await this.exec(sql`
    INSERT INTO org_departments
      (name, name_ru, parent_id, code, level, razryad_level_id,
       salary_type, min_salary, max_salary, rbac_tier, current_state, tskp, tskp_target,
       tskp_measurement_unit, statistics_type, ai_exam_enabled,
       description, description_ru,
       node_type, is_active, created_at)
    VALUES
      (${dto.positionName ?? ''}, ${dto.positionNameRu ?? null}, ${dto.departmentId ?? null},
       ${dto.code ?? null}, ${dto.level ?? null}, ${dto.razryadLevelId ?? null},
       ${dto.salaryType ?? null}, ${dto.minSalary ?? null}, ${dto.maxSalary ?? null},
       ${dto.rbacTier ?? null}, ${dto.status ?? 'active'}, ${dto.tskp ?? null},
       ${dto.tskpTarget ?? null}, ${dto.tskpMeasurementUnit ?? null}, ${dto.statisticsType ?? null},
       ${dto.aiExamEnabled ?? false},
       ${dto.functionDescription ?? null}, ${dto.functionDescriptionRu ?? null},
       'position', true, NOW())
    RETURNING *, name AS position_name
  `);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```
> ⚠️ `node_type='position'` MAJBURIY — karta yaratish = position-node (aks holda u list()'ning `node_type='position'` filtridan tushib qoladi → "yaratdim lekin ko'rinmaydi" = Q-43 forma-saqlash buzilishi). Bu eng nozik nuqta — tekshir.

### N.6 — `softDelete()` to'liq (D2.8)

**KEYIN:**
```ts
async softDelete(id: number): Promise<Result<Row | null>> {
  // PHASE-00: org_departments soft-delete = is_active=false (deleted_at ustuni yo'q). EP-ORG-005 hard-delete TAQIQ.
  const r = await this.exec(sql`
    UPDATE org_departments SET is_active = false, current_state = 'archived'
    WHERE id = ${id} AND is_active = true
    RETURNING id, current_state AS status
  `);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```

### N.7 — `listEmployees()` to'liq (D2.10)

**KEYIN:**
```ts
async listEmployees(cardId: number): Promise<Result<Row[]>> {
  return this.exec(sql`
    SELECT e.id, e.first_name, e.last_name, COALESCE(e.status,'active') AS status,
           ec.is_primary, COALESCE(ec.is_acting, false) AS is_acting, ec.acting_supplement, ec.ended_at,
           COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
           (SELECT COALESCE(SUM(CASE WHEN COALESCE(ec2.is_acting,false) THEN 0 ELSE COALESCE(f2.max_salary,0) END),0)
                 + COALESCE(SUM(CASE WHEN ec2.is_acting THEN COALESCE(ec2.acting_supplement,0) ELSE 0 END),0)
              FROM employee_cards ec2 JOIN org_departments f2 ON f2.id = ec2.card_id
             WHERE ec2.employee_id = e.id AND ec2.is_active
               AND (ec2.ended_at IS NULL OR ec2.ended_at > now()) AND f2.is_active = true) AS total_salary
    FROM employee_cards ec
    JOIN employees e ON e.id = ec.employee_id
    WHERE ec.card_id = ${cardId} AND ec.is_active AND (ec.ended_at IS NULL OR ec.ended_at > now())
    ORDER BY ec.is_primary DESC, ec.is_acting, e.last_name, e.first_name
  `);
}
```
> `JOIN org_functions f2` → `JOIN org_departments f2`; `f2.deleted_at IS NULL` → `f2.is_active = true`. `max_salary` org_departments'da bor.

### N.8 — `computeCardFit()` to'liq (D2.10)

**KEYIN:**
```ts
async computeCardFit(cardId: number): Promise<Result<Row[]>> {
  return this.exec(sql`
    SELECT e.id AS employee_id,
           COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
           ec.is_primary, COALESCE(ec.is_acting,false) AS is_acting,
           (CASE WHEN COALESCE(ec.is_acting,false) THEN 50 WHEN ec.is_primary THEN 100 ELSE 70 END)::int AS assignment_score,
           (CASE WHEN f.razryad_level_id IS NOT NULL THEN 50 ELSE 0 END
            + CASE WHEN COALESCE(NULLIF(TRIM(p.portret_data->>'requirements'),''),'') <> '' THEN 50 ELSE 0 END)::int AS definition_score,
           (f.razryad_level_id IS NOT NULL) AS razryad_set,
           (COALESCE(NULLIF(TRIM(p.portret_data->>'requirements'),''),'') <> '') AS requirements_set
    FROM employee_cards ec
    JOIN employees e ON e.id = ec.employee_id
    JOIN org_departments f ON f.id = ec.card_id
    LEFT JOIN org_node_portret p ON p.card_id = f.id
    WHERE ec.card_id = ${cardId} AND ec.is_active AND (ec.ended_at IS NULL OR ec.ended_at > now())
    ORDER BY ec.is_primary DESC, ec.is_acting, e.last_name
  `);
}
```

### N.9 — `listEmployeeCards()` + `employeeSalaryTotal()` to'liq (D2.10)

**KEYIN `listEmployeeCards`:**
```ts
async listEmployeeCards(employeeId: number): Promise<Result<Row[]>> {
  return this.exec(sql`
    SELECT ec.card_id, ec.is_primary, COALESCE(ec.is_acting, false) AS is_acting,
           ec.acting_supplement, ec.ended_at, f.name AS position_name, f.code, f.max_salary,
           (CASE WHEN COALESCE(ec.is_acting,false) THEN COALESCE(ec.acting_supplement,0) ELSE COALESCE(f.max_salary,0) END) AS card_salary
    FROM employee_cards ec
    JOIN org_departments f ON f.id = ec.card_id
    WHERE ec.employee_id = ${employeeId} AND ec.is_active
      AND (ec.ended_at IS NULL OR ec.ended_at > now()) AND f.is_active = true
    ORDER BY ec.is_primary DESC, ec.is_acting, f.name
  `);
}
```
**KEYIN `employeeSalaryTotal`:**
```ts
async employeeSalaryTotal(employeeId: number): Promise<Result<number>> {
  const r = await this.exec(sql`
    SELECT ( COALESCE(SUM(CASE WHEN COALESCE(ec.is_acting,false) THEN 0 ELSE COALESCE(f.max_salary,0) END), 0)
           + COALESCE(SUM(CASE WHEN ec.is_acting THEN COALESCE(ec.acting_supplement,0) ELSE 0 END), 0) )::numeric AS total
    FROM employee_cards ec JOIN org_departments f ON f.id = ec.card_id
    WHERE ec.employee_id = ${employeeId} AND ec.is_active
      AND (ec.ended_at IS NULL OR ec.ended_at > now()) AND f.is_active = true
  `);
  return r.ok ? Ok(Number(r.data[0]?.total ?? 0)) : Err(r.error);
}
```

### N.10 — `listChildren()` + `markReviewed()` + `resolveGate()` to'liq (D2.11/D2.16/D2.19)

**`listChildren`:**
```ts
async listChildren(cardId: number): Promise<Result<Row[]>> {
  return this.exec(sql`
    SELECT id, name AS position_name, code, level, current_state AS status
    FROM org_departments WHERE parent_id = ${cardId} AND is_active = true
    ORDER BY level NULLS LAST, name
  `);
}
```
**`markReviewed`:**
```ts
async markReviewed(cardId: number): Promise<Result<Row | null>> {
  const r = await this.exec(sql`
    UPDATE org_departments SET last_reviewed_at = NOW()
    WHERE id = ${cardId} AND is_active = true
    RETURNING id, last_reviewed_at
  `);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```
**`resolveGate`:**
```ts
async resolveGate(userId: number): Promise<Result<Row | null>> {
  const r = await this.exec(sql`
    SELECT u.id AS user_id, u.username, u.role,
           u.org_function_id AS card_id, ofn.name AS card_name, ofn.rbac_tier AS rbac_tier,
           (u.org_function_id IS NOT NULL AND ofn.id IS NOT NULL) AS has_card,
           EXISTS (SELECT 1 FROM employees e JOIN employee_cards ec ON ec.employee_id = e.id
                   WHERE e.user_id = u.id AND ec.is_active
                     AND (ec.ended_at IS NULL OR ec.ended_at > now())) AS salary_eligible
    FROM users u
    LEFT JOIN org_departments ofn ON ofn.id = u.org_function_id AND ofn.is_active = true
    WHERE u.id = ${userId}
  `);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```
> ⚠️ `u.org_function_id` — bu users-ustun nomi O'ZGARMAYDI (FK re-point qiymatni org_departments.id'ga yo'naltiradi, ustun-nom emas). JOIN `org_departments`'ga. `ofn.name AS card_name` (position_name emas).

### N.11 — update() to'liq (D2.7)

**KEYIN:**
```ts
async update(id: number, dto: CardInput): Promise<Result<Row | null>> {
  const r = await this.exec(sql`
    UPDATE org_departments SET
      name                  = COALESCE(${dto.positionName ?? null}, name),
      name_ru               = COALESCE(${dto.positionNameRu ?? null}, name_ru),
      parent_id             = COALESCE(${dto.departmentId ?? null}, parent_id),
      code                  = COALESCE(${dto.code ?? null}, code),
      level                 = COALESCE(${dto.level ?? null}, level),
      razryad_level_id      = COALESCE(${dto.razryadLevelId ?? null}, razryad_level_id),
      salary_type           = COALESCE(${dto.salaryType ?? null}, salary_type),
      min_salary            = COALESCE(${dto.minSalary ?? null}, min_salary),
      max_salary            = COALESCE(${dto.maxSalary ?? null}, max_salary),
      rbac_tier             = COALESCE(${dto.rbacTier ?? null}, rbac_tier),
      current_state         = COALESCE(${dto.status ?? null}, current_state),
      tskp                  = COALESCE(${dto.tskp ?? null}, tskp),
      tskp_target           = COALESCE(${dto.tskpTarget ?? null}, tskp_target),
      tskp_measurement_unit = COALESCE(${dto.tskpMeasurementUnit ?? null}, tskp_measurement_unit),
      statistics_type       = COALESCE(${dto.statisticsType ?? null}, statistics_type),
      ai_exam_enabled       = COALESCE(${dto.aiExamEnabled ?? null}, ai_exam_enabled),
      description           = COALESCE(${dto.functionDescription ?? null}, description),
      description_ru        = COALESCE(${dto.functionDescriptionRu ?? null}, description_ru)
    WHERE id = ${id} AND is_active = true
    RETURNING *, name AS position_name
  `);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```
> `department_id` → `parent_id` (daraxt-ota); `status` → `current_state`. `updated_at = NOW()` OLIB TASHLANDI (org_departments'da yo'q bo'lsa, F.1). Agar ADD COLUMN qilingan bo'lsa qaytar.

---

## § O — BOG'LIQLIK VA KEYINGI FAZA

- **Bu faza (FAZA 0) ochadi:** FAZA 1 (employee_cards stake_fraction — endi org_departments FK), FAZA 2 (login/RBAC kartadan — resolveGate org_departments'ga), FAZA 4 (oylik kartadan — payroll org_departments.razryad_level_id), FAZA 6 (card_folders 6-bo'lim — org_departments FK).
- **Bog'liqlik:** hech qaysi keyingi faza FAZA 0 tugamasdan boshlanmaydi (yagona-jadval poydevor).
- **Defer-ro'yxat (bu fazada QILINMAYDI):** org_functions DROP/VIEW (FAZA 9), 0-data 26 FK re-point (FAZA 9), departments VIEW (FAZA 8), employee_org_departments→employee_cards konvergatsiya (FAZA 1), backfillManagerIds org_functions (FAZA 8).

---

## § P — TEKSHIRUV-RO'YXAT (Muslimbek faza oxirida belgilaydi)

- [ ] D0 holat C.1 bilan mos (od=144, ofn=97, ec=30, cf=2).
- [ ] D1 crosswalk VIEW: matched ~94, dup=0.
- [ ] D2 card.repository.ts: org_functions read=0 (faqat izoh), tsc GREEN.
- [ ] D3 card-folder.repository.ts izoh.
- [ ] D4 org-queries.repo.ts:48 org_departments-ichida.
- [ ] D5 employee_cards FK → org_departments (bproof K.2 PASS: oqdi + 23503).
- [ ] D6 card_folders + org_node_portret FK → org_departments (bproof K.3 PASS).
- [ ] D7 drizzle-my-permissions.repo.ts tier org_departments'dan.
- [ ] D8 card.service/controller izoh.
- [ ] D11 grep: AKTIV org_functions reader=0 (backfillManagerIds DEFER izohli).
- [ ] K.4 jonli: /api/org-structure/cards 200; EmployeeCardsSummary salary-sum ko'rinadi.
- [ ] Regress: tree assignUser, CardController CRUD, RBAC tier — ishlaydi.
- [ ] §M barcha commitlar (faqat o'z fayllar, Co-Authored-By).

---

## YAKUNIY ESLATMA (Q-46/Q-40)

- org_functions DROP QILMA bu fazada (39 FK + Drizzle schema; chala-o'chirish TAQIQ). Retire = "AKTIV reader 0", DROP = FAZA 9.
- Ishlab turgan FE/CardController/tree O'CHIRILMAYDI — re-bind shaffof.
- "100% = MEXANIZM" (Q-2): bu faza yagona-jadval MEXANIZMINI quradi; data (razryad/oylik/...) keyingi fazalarda egasidan.
- Har o'zgarish: tsc → DB-proof → jonli → commit. Struktura-only yetarli EMAS (Q-40).
