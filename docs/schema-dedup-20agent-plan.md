# Schema Konvergensiya — 20 Agentlik To'liq Ijro Rejasi (DELETION rejimi)

**Sana:** 2026-05-27
**Rejim:** FULL CONVERGENCE + DELETION (ADD-ONLY chetlab o'tilgan — user ruxsati 2026-05-27)
**Missiya:** Drizzle schema'ni jonli PostgreSQL DB'ning yagona, to'liq aksiga aylantirish; ortiqcha stub/dublikat kodni VA dormant jadvallarni OLIB TASHLASH.

## Baseline (boshlang'ich, har gate shundan past tushmaydi)
- BE+FE `pnpm run typecheck`: PASS (0)
- `test:ci`: 9310/9368 PASS (22 suite/48 test fail — pre-existing)
- branch: `chore/clean-faza-3`

## Buzilmas qoidalar
| # | Qoida |
|---|---|
| G1 | DELETION ruxsat. Lekin **DB DROP'dan oldin `pg_dump` backup MAJBURIY** (ma'lumot qaytmaydi; kod git'da qaytadi) |
| G2 | Disjoint fayllar — ikki agent bir faylga tegmaydi. Shared fayllar (`europrint-compat.ts`, `index.ts`) yagona egada |
| G3 | Har bosqichda `git commit`; `git stash` yo'q |
| G4 | Cyclic shim yo'q — bir tomonli re-export |
| G5 | Har commitdan keyin: `@workspace/db build` + domen `tsc --noEmit` PASS |
| G6 | Jonli DB = haqiqat manbai; ustun mavjudligi `_db_cols.txt`/manifestdan tasdiqlanadi |
| G7 | Baseline HEAD saqlanadi; har agent alohida commit oqimi → yakka revert |

---

## WAVE 0 — Tayyorgarlik (2 agent, ketma-ket)
- **A0 Canon-mapper** → `docs/schema-canon-map.md`: har dublikat jadval uchun YAGONA canonical lib/db fayl + o'chiriladigan stub fayllar ro'yxati + DB ustun soni.
- **A0b DB-manifest** → `_audit_out/db-columns-by-table.json`: `_db_cols.txt`dan har jadval ustun+tip manifesti.
- **Gate G0:** ikkalasi commit bo'lmaguncha Wave 1 yo'q.

## WAVE 1 — Canonical = DB superset (12 agent, PARALLEL, disjoint)
Har agent o'z domeni canonical lib/db schema'sini DB superset'iga aylantiradi (ustun qo'shadi), ortiqcha lib/db dublikat ta'rifni (bir jadval 2 faylda) bittaga yig'adi (canon qoldiradi, ikkinchisini o'chiradi). 73 Drizzle-only jadvalni tasniflaydi: dead → o'chir; planned → `CREATE TABLE IF NOT EXISTS` migratsiya.

| Agent | Domen | Egalik fayllar |
|---|---|---|
| A1 | HR-attendance | `attendance.ts`, `discipline.ts`, `safety.ts` |
| A2 | HR-payroll | `payroll.ts`, `leave.ts`, `kpi.ts` |
| A3 | HR-recruit | `hr-recruiter.ts`, `adaptation.ts`, `assessment.ts`, hr-goals/comp/docs |
| A4 | Core | `core/core-users.ts`, `core-ai-reports.ts`, `users.ts` |
| A5 | Finance/FI | `fi-*.ts` (gl, budgets, expenses, payroll-calc, payroll-ext, kassa, reports) |
| A6 | POS | `pos-schema.ts`, `pos-schema-v2.ts`, `pos-schema-extensions.ts`, `pos-retail.ts` |
| A7 | CRM | `crm-*.ts` |
| A8 | WMS/MM | `mm-*.ts`, wms schema |
| A9 | SD | `sd-*.ts` |
| A10 | LMS/Ecom | `lms-schema.ts`, `ecommerce-schema.ts` |
| A11 | Kanban/OW | `kanban/*.ts`, `order-workflow-schema.ts` |
| A12 | Misc | aisha, chat, agent, iot, mes, admin-ext, marketing, design |

**Gate G1:** 12 agent PASS + to'liq `pnpm run typecheck` PASS.

## WAVE 2 — Barrel konvergensiyasi (1 agent — A13, yagona ega)
`europrint-compat.ts` ni stub o'rniga to'liq canonical re-export qilishga o'tkazadi (guruh-guruh, har guruhdan keyin to'liq typecheck). Repolar o'zgarmaydi (ular barreldan oladi).
**Gate G2:** to'liq typecheck PASS.

## WAVE 3 — Repo verifikatsiya (4 agent, PARALLEL, modul klasteri)
| Agent | Klaster |
|---|---|
| A14 | hr, core, auth |
| A15 | finance, fi, pos, pos-v2 |
| A16 | crm, sd, wms, mm |
| A17 | lms, kanban, mes, pp, qolgan |
Har agent o'z modullarida qoldiq tip xatolarini tuzatadi (schema'ga tegmaydi).
**Gate G3:** to'liq typecheck PASS + test:ci ≥ baseline.

## WAVE 4 — DESTRUCTIVE cleanup (4 agent)
- **A18** → `scripts/reviewer-schema-dup.sh` (yangi) + run-all-reviewers ulash. Guard: bir xil `pgTable("nom")` >1 faylda allowlist'siz = FAIL.
- **A19** → **DB BACKUP (birinchi!)**: `pg_dump` to'liq DB → `backups/pre-drop-<sana>.sql`. + `docs/db-provisioning.md` (pg_dump = provizion manbai, drizzle-kit push EMAS) + DEPLOYMENT.md.
- **A20a (kod o'chirish)** → barrel endi import qilmaydigan stub fayllarni `git rm`: `schema-compat-*.ts`, `schema-business-*.ts`, `schema-misc-app-*.ts` (faqat tasdiqlangan refsiz). Typecheck PASS.
- **A20b (DB DROP — A19 backup'dan KEYIN)** → dormant jadvallarni reversible migratsiya bilan DROP: `payroll_calculations`, `pos_transactions`, `pos_products`, va Wave 1'da dead deb tasdiqlangan jadvallar. Har DROP alohida migratsiya faylida, backup havolasi bilan.

## YAKUNIY GATE G4
1. `pnpm run typecheck` PASS (BE+FE)
2. `test:ci` ≥ 9310 PASS
3. Backend boot smoke (`dev:unsafe`) xatosiz
4. FE `build` PASS
5. `run-all-reviewers.sh` — yangi guard PASS

## Overlap xaritasi (konflikt yo'q)
- lib/db domen fayllari → 1 agent/domen (Wave 1)
- `europrint-compat.ts` → faqat A13 (Wave 2)
- `index.ts` → hech kim
- modul klasterlari → 1 agent/klaster (Wave 3)
- scripts/docs/stublar/migratsiya → A18/19/20 distinct (Wave 4)

## Rollback
- Kod: `git revert <sha>` (har agent yakka commit)
- DB: `backups/pre-drop-<sana>.sql` dan restore
- Barrel: A13 atomik commit → bitta revert butun konvergensiyani bekor qiladi

## Agent pool
20 agentlik pool 5 to'lqinda qayta ishlatiladi (Wave 1 agentlari Wave 3/4'ga qayta tayinlanadi).
