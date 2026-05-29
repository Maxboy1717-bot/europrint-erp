// Vaqtinchalik: 4 agent natijalarini (3 ta diskdagi JSON + bitta inline matn arg)
// birlashtirib docs/hr-module-deep-audit-2026-05-28.md ga yozadi.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'C:/Users/AzzA/.claude/projects/C--Users-AzzA-Downloads-EuroPrint-Clean/31cfa653-cfeb-4459-a175-5c1f1f48b450/tool-results/';
const G1 = BASE + 'toolu_01C8xYnLsm5F6L6CUpBqL6rM.json';
const G2 = BASE + 'toolu_011A8mEQMRrZnhiwQ9V3GTWW.json';
const G4 = BASE + 'toolu_01PTrkNePtu27avS2ePrv3Lm.json';

const extract = (p) => {
  try {
    const arr = JSON.parse(readFileSync(p, 'utf8'));
    return arr.map((x) => x.text || '').join('\n\n');
  } catch (e) { return `[EXTRACT FAILED ${p}: ${e.message}]`; }
};

const g1 = extract(G1);
const g2 = extract(G2);
const g4 = extract(G4);
const g3 = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : '[group 3 inline content placeholder]';

const PHASE1 = `# EuroPrint HR Moduli — Chuqur Kod Auditi (2026-05-28)

> Static-only source-code audit. 28 ta HR sahifa, har biri uchun A–J bo'limlar (file map, UI, data, form, CRUD, BE logic, security, DDD, performance, code quality). Iqtibos: \`file:line\`.

## Phase 1 — Repository Discovery

**Stack:**
- Monorepo (pnpm 9 workspaces) — \`Uzbek-Language-Module/\`
- Backend: NestJS 11 + Fastify, TypeScript strict, Drizzle ORM, PostgreSQL 15+, Redis, Zod validation
- Frontend: React 19 + Vite 7 + TanStack Query 5 + Tailwind v4 + Radix UI + Wouter routing
- Auth: JWT (passport-jwt) + custom \`JwtAuthGuard\` + \`RolesGuard\` with \`@Roles(...)\` decorator
- Telemetry: Sentry, Pino logs, AuditInterceptor

**HR statistikasi:**
| Metric | Qiymat |
|---|---|
| HR backend fayllar (\`apps/api/src/modules/hr/\`) | **287** |
| HR backend controllerlar (\`@Controller('hr*')\`) | **41** |
| HR frontend sahifa fayllari | **162** |
| HR DB schema fayllari | **49** |
| Jami HR endpoint (taxmin) | **~310** |
| Tahlil qilingan dublikat route'lar | **8** topildi (1 ta crash sababi, 7 ta noregistered/false-positive) |

**Asosiy fayllar:**
- FE route map: \`artifacts/erp-dashboard/src/routes/HRRoutes.tsx\` (HR_ROUTES, AI_HR_ROUTES, SELF_SERVICE_ROUTES)
- Sidebar nav: \`artifacts/erp-dashboard/src/components/sidebar/constants-hr-lms.ts\` (tz11)
- BE controllers: \`apps/api/src/modules/hr/presentation/\` + \`modules/compatibility/\` + \`modules/hr-v2/\`
- DB schemas: \`lib/db/src/schema/\` (hr_*, employees, discipline, mentor, succession_plans, ...)

**Sidebar bo'yicha 28 sahifa (= 27 mavjud + 1 yo'q):**
- Page 20 "Intizom V2" — FE'da MAVJUD EMAS (faqat bitta \`pages/Discipline.tsx\`). BE'da esa discipline-records uchun **4 ta** controller (V1 ko'rinishidagi multi-shim). Phase 3 da batafsil.
`;

const PHASE3 = `
## Phase 3 — Cross-Page Duplicate Detection

### 3.1 Dublikat backend controllerlar (eng katta ADD-ONLY zarari)

| Resurs | Controllerlar |
|---|---|
| **discipline-records** | (1) \`modules/compatibility/discipline-records-compat.controller.ts:28\` \`@Controller('discipline-records')\`; (2) \`modules/hr/presentation/hr-compat-a.controller.ts:153\` \`@Get('discipline')\` + \`:158\` \`@Post('discipline-records')\`; (3) \`modules/hr/presentation/hr-dashboard.controller.ts:61\` \`@Get('discipline-records')\` + \`:262\` \`@Get('discipline/blocked')\`; (4) \`modules/general/controllers/general-legacy-b.controller.ts:136\` \`@Get('discipline/user')\` |
| **hr-dashboard** | \`hr-dashboard.controller.ts\` (\`@Controller('hr')\`, agent group 1 da topgan: ~26 routes, ko'plari STUB \`{items:[],total:0}\`) + \`hr-dashboard-extra.controller.ts\` (\`@Controller('hr')\`, 6 ta route — boshqa agent qo'shgan; mening sessiyam davomida 6 ta dublikat boot crashi shu juftlikdan kelib chiqdi va olib tashlandi) |
| **employees** | \`employees-compat.controller.ts\` (\`/api/employees\`) + \`hr-employees.controller.ts\` (\`/api/hr/employees\`) + \`employees-extra.controller.ts\` (qo'shimcha endpointlar) + CQRS handlers (\`modules/hr/employees/application/\`) |
| **leave-requests** | \`hr-compat-safety.controller.ts:116\` \`@Get('leave-requests')\` + \`hr-v2\` leave module (alohida) |
| **shifts** | \`hr-shifts-compat.controller.ts\` (\`@Controller('hr')\`+ \`shifts/*\`) + \`hr-v2/shifts/shift.controller.ts\` (\`@Controller('hr-v2/shifts')\`) — bir xil domain, ikkita prefix |
| **daily-reports** | \`hr-dashboard.controller.ts\` da 4 ta stub (lines 129-142) + \`hr-v2/daily-report.controller.ts\` (real) |
| **safety** | \`hr-compat-safety.controller.ts\` (CRUD) + \`hr-dashboard-extra.controller.ts\` (summary/incidents) + \`hr-safety.controller.ts\` (delete/export) — 3 ta controller bir domeniga |
| **skills / employee-skills** | \`hr-gsd.controller.ts\` + \`hr-compat-a.controller.ts\` (DELETE \`/employee-skills/:id\` ikkalasi da bor edi — men olib tashladim, 2026-05-28 commit \`cea4b4d4\`) |

### 3.2 Dublikat / parallel FE komponentlar

| Komponent | Joylar |
|---|---|
| Employee profile dialog | \`EmployeeProfile.tsx\` + \`pages/employee-profile/\` (sub-tabs) + \`AddEmployeeDialog.tsx\` |
| Stub stats card | \`HRDashboardCards.tsx\` (Tashkilot variant) + \`SDDashboardSections.tsx\` (CRM variant) — bir xil struktura, alohida |
| Confirm-delete dialog | \`DeleteConfirmDialog\` (PapkaOrders) + inline \`AlertDialog\` (HRSafety, HRSuccessionPlanning) — 2 ta pattern |

### 3.3 V1 vs V2 (foydalanuvchining maxsus savol)

- **Intizom V1 vs V2:** FE'da \`Discipline.tsx\` bitta — V2 yo'q. BE'da 4 ta controller bitta domain'ga (yuqori jadval). Ya'ni BE'da implicit duplikatsiya bor — V1 (legacy compat) + hr-compat-a + hr-dashboard re-export + general-legacy-b. Canonical = \`discipline-records-compat\` (compat namespace) yoki kelajakda \`modules/hr/discipline/\` (hozircha yo'q). Boshqalarni \`@deprecated\` qilib, FE Discipline.tsx ni canonical'ga yo'naltirish kerak.
- **hr/* vs hr-v2/*:** sistematik V2 namespace bor (\`hr-v2/shifts\`, \`hr-v2/daily-reports\`, \`hr-v2/reception\`, \`hr-v2/ai-interview\`). Bu ataylab — Tier-2 yangi DDD slice. FE turli sahifalarni TURLI versiyalarni chaqiradi:
  - DailyReportPage → \`/api/hr-v2/daily-reports/*\` (V2 — real)
  - ReceptionPage → \`/api/hr-v2/reception/*\` (V2 — real)
  - AIInterviewPage → \`/api/hr-v2/ai-interview/*\` (V2) + \`/api/ai-hr/interviews\` (boshqa)
  - ShiftSchedule → \`/api/hr/shifts/*\` (V1 — \`hr-shifts-compat\`)
  - HR Dashboard → \`/api/hr-v2/pip\`, \`/api/hr-v2/enps\` (V2) + ko'p V1 endpointlar
  - WeeklyPlanPage → \`/api/weekly-plans\` (V1 \`/api/\` root) — V2 ACL endpoint mavjud lekin ishlatilmagan

  **Verdict:** V1↔V2 ataylab ikkilanish, lekin FE qaysi versiyani chaqirishi tasodifiy (qaysi sahifa qachon yozilganiga qarab). Birlashtirilmagan.

### 3.4 Dublikat route to'liq ro'yxati (scanner: \`scripts/_dup-routes-scan.mjs\`)

**Hozirgi holat (after my session fixes):**
- Jami route: 2924
- TAKROR: 7 (mahalliy boot crash sababi emas — qolgan 7 ta noregistered controllerlardan)

1. GET /api/departments — departments-positions-compat.controller.ts + resources.controller.ts
2. GET /api/hr-v2/daily-reports/employee/:id — daily-report.controller.ts 2 ta metod
3. GET /api/positions — same compat pair
4. GET /api/warehouse/dashboard/kpis — general-legacy-b + wms-catalog
5. GET /api/warehouse/warehouses — general-legacy-b + wms-gateway-warehouses
6. POST /api/attempts/:id/submit — lms-attempts.controller.ts 2 ta metod
7. POST /api/auth/refresh — auth.controller.ts + admin-auth.controller.ts

### 3.5 Dublikat fix history (mening sessiyam davomida)

| Commit | Dublikat | Olib tashlandi |
|---|---|---|
| dea5b7de | hr-dashboard.controller.ts: resignation-stats, safety/summary, safety/incidents, contracts/expiring, offboarding/cases/stats | hr-dashboard'dan; hr-dashboard-extra qoldi |
| (boshqa agent) | hr-dashboard.controller.ts: attendance | dedicated hr-attendance/ qoldi |
| cea4b4d4 | hr-gsd.controller.ts: DELETE /employee-skills/:id | hr-compat-a qoldi |
`;

const PHASE4 = `
## Phase 4 — Module-level Maps

### 4.1 Database schema map (HR-relevant)

Asosiy jadvallar (qisman ro'yxat — to'liqi 49 fayl):

| Jadval | Maqsad | Schema fayl |
|---|---|---|
| \`users\` | autentifikatsiya, base profile | \`lib/db/src/schema/core/users.ts\` |
| \`employees\` | xodim atributlari (HR ma'lumot) | \`lib/db/src/schema/employees.ts\` |
| \`employee_org_departments\` | xodim ↔ org birlik (M:N) | \`lib/db/src/schema/org/\` |
| \`org_departments\`, \`org_functions\` | tashkiliy ierarxiya | \`lib/db/src/schema/org/\` |
| \`discipline_records\` | intizom yozuvlari | \`lib/db/src/schema/discipline.ts\` |
| \`employee_blocks\` | bloklangan xodimlar | \`lib/db/src/schema/discipline.ts\` |
| \`safety_incidents\`, \`ppe_compliance\`, \`safety_training_records\` | mehnat xavfsizligi | \`lib/db/src/schema/hr/safety.ts\` |
| \`mentors\` | mentorlik (FE pairings emas — directory) | \`lib/db/src/schema/hr/mentors.ts\` |
| \`succession_plans\` | vorislik rejasi | \`lib/db/src/schema/hr/succession.ts\` |
| \`offboarding_cases\` | ishdan ketish jarayoni | \`lib/db/src/schema/hr/offboarding.ts\` |
| \`hr_onboarding_checklists\` | onboarding | \`lib/db/src/schema/hr/onboarding.ts\` |
| \`hr_health_checkups\` | tibbiy ko'rik | \`lib/db/src/schema/hr/health.ts\` |
| \`hr_leave_requests\` | ta'til/kasallik | \`lib/db/src/schema/hr/leave.ts\` |
| \`hr_assets\` + history | aktivlar | \`lib/db/src/schema/hr/assets.ts\` |
| \`employee_skills\`, \`skills\` | ko'nikma matritsasi | \`lib/db/src/schema/hr/skills.ts\` |
| \`employee_ratings\`, \`employee_rating_goals\` | 360 baholash | \`lib/db/src/schema/hr/ratings.ts\` |
| \`exit_interviews\` | exit intervyu | \`lib/db/src/schema/hr/offboarding.ts\` |
| \`employment_contracts\` | shartnomalar | \`lib/db/src/schema/hr/contracts.ts\` |
| \`daily_attendance_summary\` | davomat | \`lib/db/src/schema/hr/attendance.ts\` |
| \`shift_schedules\` | smena jadvali | \`lib/db/src/schema/hr/shifts.ts\` |
| \`ai_interview_sessions\`, \`ai_hr_interviews\` | AI HR | \`lib/db/src/schema/hr-v2/ai-interview.ts\` |
| \`papka_orders\` | tipografiya buyurtmalari (HR'siz lekin xodim ulanadi) | \`lib/db\` shim |
| \`weekly_plans\` | haftalik reja | \`lib/db/src/schema/hr-v2/weekly-plan.ts\` |
| \`pip_plans\` | PIP | \`lib/db/src/schema/hr-v2/pip.ts\` |
| \`enps_surveys\` | eNPS | \`lib/db/src/schema/hr-v2/enps.ts\` |
| \`hr_brand_settings\` | HR brend | \`lib/db/src/schema/hr/brand.ts\` |
| \`hr_daily_reports\` | kunlik hisobot | \`lib/db/src/schema/hr-v2/daily-report.ts\` |
| \`hr_v2_reception_visitors\` | reception jurnali | \`lib/db/src/schema/hr-v2/reception.ts\` |

**Sxema bo'yicha topilgan muammolar:**
- \`papka_orders\` — IZMARRUM RICH SXEMA (papka_no, mijoz_nomi, tiraj, format_a/b, bom_id, material_requirements ...) lekin legacy shim faqat 5 ustunni yozardi (men shimni kengaytirdim, commit \`fa69b9a2\`).
- Ko'pchilik jadvallar tenant_id YO'Q (multi-tenancy planlashtirilmagan).
- \`mentors\` jadval FE pairing modelidan (\`mentorId/menteeId/courseId/status\`) tubdan farq qiladi (\`name/bio/expertise/rating/is_active\`).
- \`succession_plans\` — FE \`career-path\` table'i bilan bir xil yagona manba; controller ikkalasini turli shaklda ko'rsatadi.
- Sxema/DB drift: ~73 jadval / 554 ustun jonli DB'da Drizzle sxemasidan farq qiladi (memory: session_2026-05-23_hidden_errors_audit).

### 4.2 API surface map (HR endpointlar — qisman)

41 HR controller. Asosiy endpointlar:

**Asosiy CRUD (real DB):**
- /api/employees [GET LIST, POST, PUT/:id, POST /import] — \`employees-compat.controller.ts\`
- /api/hr/employees [GET LIST] — \`hr-employees.controller.ts\` (CQRS)
- /api/hr/assets [GET LIST, POST, GET/:id, POST/:id/assign, PATCH/:id/return, PATCH/:id/report] — \`hr-assets.controller.ts\`
- /api/hr/leave-requests [GET, POST] — \`hr-compat-safety.controller.ts\`
- /api/hr/safety/* [incidents/PPE/trainings/hazard-zones — full CRUD] — \`hr-compat-safety.controller.ts\`
- /api/hr/health-checkups [GET, POST — no Update/Delete] — \`hr-compat-a.controller.ts\`
- /api/hr/skills, /api/hr/employee-skills — \`hr-gsd.controller.ts\` + \`hr-compat-a.controller.ts\`
- /api/mentorships [GET, POST, PUT/:id, DELETE/:id] — \`mentorships-compat.controller.ts\` (mentors directory, FE-mismatch)
- /api/succession/key-positions, /candidates, /career-plans — \`succession-compat.controller.ts\`
- /api/hr/offboarding/* — \`hr-offboarding.controller.ts\`
- /api/hr/onboarding-checklists — \`onboarding-checklists.controller.ts\`
- /api/hr/recruitment/* — \`hr-vacancies-pipeline.controller.ts\` + \`hr-vacancies.controller.ts\`

**Dashboard:**
- /api/hr/dashboard-stats, /abc-analysis, /alerts, /discipline-records, /risk-scores, /resignation-stats, /safety/summary, /contracts/expiring, /attendance, /gamification/leaderboard, /shifts/today, /ai-interview/sessions, /adaptation/at-risk, /birthdays, /milestones, /enps/surveys, /pip — \`hr-dashboard.controller.ts\` + \`hr-dashboard-extra.controller.ts\`

**HR V2 (yangi):**
- /api/hr-v2/daily-reports/*, /api/hr-v2/reception/*, /api/hr-v2/shifts/*, /api/hr-v2/ai-interview/*, /api/hr-v2/pip, /api/hr-v2/enps

**Eng katta API muammolari:**
1. **Envelope tutqun:** \`{data}\` / \`{items,total}\` / bare-array — bir xil controllerda 3 xil; FE \`api-request.ts\` faqat \`{ok,data}\` ni avtomatik ochadi. ~10 sahifa shu sababdan bo'sh.
2. **camelCase ↔ snake_case:** controllerlar mixed; Zod DTOs aksariyat snake_case talab qiladi, FE camelCase yuboradi → 5-7 sahifaning create/update'i 400.
3. **HTTP method mismatch:** GoalsKPI \`PATCH /api/goals/:id\` — BE faqat \`PUT\`; AiCrmPage POST AI body — BE Zod schema kerakli maydonni qabul qilmaydi.
4. **Stub endpointlar:** hr-dashboard.controller.ts da 14+ ta \`return { items: [], total: 0 }\` (lines 117-249) — frontend ularni chaqirsa ham, real ma'lumot yo'q.
5. **Missing endpointlar:** \`POST /api/ai-hr/tasks/:id\`, \`PATCH /api/goals/:id\`, \`PATCH /api/hr/referrals/:id\`, \`DELETE /api/hr/skills/:id\`.

### 4.3 State management map

- **Server state:** TanStack Query 5 — ~95% sahifa shunda. Asosiy queryKey'lar: \`['/api/hr/...']\` (avto-URL fetch).
- **Client state:** local \`useState\`; bitta umumiy store (Zustand) — \`artifacts/erp-dashboard/src/store/\` ichida \`useAuth\` (JWT, currentUser). Boshqa HR-state global emas — har sahifa o'zining \`useState\`'idan foydalanadi.
- **react-hook-form + zod:** AddEmployee, Goal, leave-request, vacancy, safety — formdoshlar zodResolver bilan validate qiladi.
- **Auth state:** \`useAuth\` hook + \`AuthProvider\` (Context) + JWT localStorage'da. Frontend tokeni \`Authorization: Bearer\` bilan yuboradi.

**State muammolari:**
- Hech qanday cross-page state-cache invalidation pattern — bitta sahifa employee'ni yangilasa, boshqa sahifa cache stale qoladi (faqat o'sha sahifa invalidateQueries qiladi).
- Optimistic update yo'q — UI har doim refetch'ni kutadi.
- TanStack Query default \`staleTime\` (0) — har sahifa o'tishida refetch.

### 4.4 Permission matrix (RolesGuard)

**Topilgan rollar:** \`super_admin\`, \`director\`, \`hr_manager\`, \`hr_specialist\`, \`finance\`, \`sales_manager\`, \`production_manager\`, \`warehouse\`, \`employee\`, \`admin\`.

**HR sahifalari uchun rol-bazasi (HR_ROLES qisqartmasi):**
- Aksariyat HR controllerlar: \`@Roles('HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR','ADMIN','MANAGER')\` — keng (kichikroq kompaniya uchun mantiqiy).
- \`hr-dashboard.controller.ts:17\` — yuqoridagi rollar.
- Aksariyat \`compat\` controllerlar — \`@UseGuards(RolesGuard)\` lekin \`@Roles\` decoratori yo'q (deceptive: guard bor lekin policy yo'q → har autentifikatsiya qilingan foydalanuvchi kira oladi).

**Topilgan teshiklar:**
- \`compat/discipline-records-compat.controller.ts\` — \`@Roles\` decorator yo'q.
- \`compat/mentorships-compat.controller.ts\` — \`@Roles\` decorator yo'q.
- \`compat/goals-compat.controller.ts\` — \`@Roles\` decorator yo'q.
- \`POST /sd/orders/:id/advance-payment\` (FINANCE/DIRECTOR) sotuvchi sahifasida 403 beradi.
- Frontend roleAccess gating: ko'p sahifa \`AppRouter.tsx\` \`role-gated routes\` ni ishlatadi, lekin sub-route'lar (action-level) FE'da hech kim cheklamaydi.

### 4.5 Shared code inventory

**Mavjud shared util'lar:**
- \`apps/api/src/common/\` — \`result\`, \`http-result\` (unwrapOrInternal, unwrapOrDefault, unwrapOrNotFound, notImplemented), \`guards/JwtAuthGuard\`, \`guards/RolesGuard\`, \`decorators/Roles\`, \`pipes/ZodValidationPipe\`, \`interceptors/AuditInterceptor\`, \`constants/business.constants.ts\`.
- \`apps/api/src/shared/db/\` — \`db\` (Drizzle), \`typed-execute\`, \`invariants.ts\`.
- \`artifacts/erp-dashboard/src/lib/\` — \`queryClient.ts\` (apiRequest, selectArray, getQueryFn), \`i18n\`, \`utils\`.
- \`artifacts/erp-dashboard/src/components/ep/\` — EPLoader, EPErrorState, EPPageHeader, EPLayout.
- \`artifacts/erp-dashboard/src/components/ui/\` — Radix wrappers (Button, Dialog, Input, Select, Table, ...) + DeleteConfirmDialog + ConfirmDialog.

**Eng kichik extraction candidates:**
- envelope-aware HR fetch (bare-array vs {items,total} vs {data}) — har sahifa o'zicha unwrap qiladi.
- snake↔camel mapper (papka, leave-request, health-checkup, career-path da takror).
- Per-table audit logger (faqat AuditInterceptor — endpoint level).
- Test data factories (yagona joyda yo'q).

**Mavjud governance gatelar (yaqinda qo'shilgan):**
- \`scripts/check-codeowners.mjs\` (commit \`671edf26\`) — kritik fayllarda non-owner commit bloki.
- \`scripts/check-revert-via-tests.mjs\` (commit \`671edf26\`) — \`fix(tests):\` so'nggi 7 kun \`feat()\` ni qaytarmasin.
- \`scripts/_dup-routes-scan.mjs\` (mening sessiyam) — 2924 routedan dublikatni topadi (Hozir 7 ta).
- \`.husky/pre-commit\` — lint-staged + codeowners + i18n leak detector + typecheck (oxirgi commitda ko'rdim "✅ apps/api typecheck passed").
- \`.husky/commit-msg\` — Conventional Commits + anti-revert.

**Tavsiya:** \`scripts/_dup-routes-scan.mjs\` ni \`.husky/pre-commit\` ga ulash — kelajakda dublikat route commit bo'lmasin.
`;

const PHASE5 = `
## Phase 5 — UMUMIY XULOSA (Uzbek final)

### Statistika (28 sahifa)
| Holat | Soni | Sahifalar |
|---|---|---|
| ✅ To'liq ishlaydi | **7** | Org Tuzilma, Xodimlar, AI Intervyu, Rekruting Voronka, Smena Jadvali, Aktivlar, Sog'liq Nazorati, Kunlik Hisobot, Reception, Haftalik Reja (bir nechta yarim-ishlaydi shu yerda — agentlar verdictlari boshqacha) |
| ⚠️ Qisman ishlaydi | **11-13** | HR Dashboard, AI HR Dashboard, Maqsadlar, Mentorlik, Succession, Onboarding, Offboarding, Xavfsizlik, HR Brend, Intizom |
| ❌ Buzilgan (contract drift / stub) | **7-9** | HR Xarita, Bildirishnomalar, Ta'til va Kasallik, Xodim Baholash, Ko'nikmalar Matritsasi, Kasbiy O'sish, Referral Tizimi |
| 🚫 Bo'sh qobiq | **1** | Intizom V2 (FE'da yo'q) |

> Toza-sof verdict agentlar bo'yicha biroz farq qiladi (ba'zi sahifalar bir agentga ⚠️, boshqasiga ❌); umumiy yo'nalish: ~25% to'liq, ~45% qisman, ~25% buzuq.

### Eng kritik 20 ta muammo (severity bo'yicha)

**🔴 CRITICAL (xavfsizlik yoki ma'lumot yo'qotish)**
1. **\`sql.raw(variable)\` ishlatilishi** — \`legacy.service.ts:27\`, \`shared/db/schema.ts:86,91\`, \`invariants.ts:1047\` (CLAUDE.md Qoida B). **SQL injection xavfi.**
2. **\`admin.seed.ts:6\`** — \`'Admin123!'\` default parol fallback (Production xavfi).
3. **\`compat\` controllerlarda \`@Roles\` yo'q** — discipline-records, mentorships, goals, ko'p compat: har autentifikatsiya qilingan user kira oladi.
4. **Mass-assignment riski:** ko'p compat service \`...body\` to'g'ridan repository'ga uzatadi; Zod \`.passthrough()\` qo'shganim sabab paneldash mavjud (papka_orders, leave-requests).
5. **PII:** medical (\`hr_health_checkups\`), passport (employees), maosh — audit log faqat AuditInterceptor (endpoint), DB-level audit yo'q.
6. **JWT \`admin-auth.controller.ts:33\`** — access secret bilan refresh tokenni verify qiladi (CLAUDE.md Qoida A).

**🟠 MAJOR (funksional buzuq)**
7. **HR Xarita** — 3 endpoint shakl mos emas (\`lat/lng\` yo'q, \`total.employees\` vs \`totalEmployees\`, \`groups\` vs \`items\`) → xarita doim bo'sh.
8. **Bildirishnomalar** — \`.strict()\` flat-flag sxema vs FE ichma-ich massiv → har saqlashda 400.
9. **Ta'til va Kasallik** — camelCase vs snake_case → create 400, ro'yxat ustunlari bo'sh.
10. **Ko'nikmalar Matritsasi** — POST \`/hr/skills\` stub; PATCH/DELETE yo'q; emp-skill POST 400.
11. **Mentorlik** — backend mentor directory'sini modellaydi, FE pairing'ni → create 400.
12. **Offboarding** — har o'qish \`{data}\` konvert o'qilmaydi (ro'yxat bo'sh); create camelCase/enum 400.
13. **Referral Tizimi** — list noto'g'ri jadval (\`employees\`); POST stub; PATCH yo'q.
14. **Kasbiy O'sish** — POST 400 (\`position_id\`/\`candidate_id\` yo'q); ustunlar bo'sh.
15. **Goals PATCH** — FE PATCH, BE faqat PUT → tahrirlash sukut bilan ishlamaydi.
16. **AI HR Dashboard** — \`POST /api/ai-hr/tasks/:id\` yo'q → "AI vazifa bajarish" 404.
17. **Sotish Paneli** — POST/DELETE SAP sales orders STUB (yasama id, hech narsa saqlamaydi).
18. **Hr-dashboard.controller.ts 14+ stub endpoint** (lines 117-249) — \`return { items: [], total: 0 }\`.

**🟡 MINOR (sifat / texnik qarz)**
19. **Fayl hajmi 300+:** HRHealthMonitoring.tsx (346), HRCareerPath.tsx (361), Discipline.tsx, va 10+ boshqa file CLAUDE.md Qoida 13'ni buzadi.
20. **i18n hardcoded:** har sahifada 5-25 ta hardcoded uzbek string, t() chaqirilmagan.

### Topilgan dublikatlar (umumiy)

**Backend controllerlar (ADD-ONLY zarari):**
- discipline-records — 4 ta controller
- hr-dashboard — 2 ta controller (men birga birlashtirdim)
- employees — 3-4 ta controller variant
- safety — 3 ta controller
- daily-reports — 2 ta (V1 stub + V2 real)
- shifts — 2 ta (\`hr/shifts\` + \`hr-v2/shifts\`)

**V1 vs V2:** \`hr-v2/*\` namespace yangi DDD slice; FE qaysi versiyani chaqirishi bir butun emas.

**Dublikat route (Fastify dup):** scanner 7 ta topdi (asosan noregistered, false-positive); o'sha 1 ta (employee-skills) commit bilan tuzatildi.

### Yo'q yoki noto'g'ri API endpointlar
- **MISSING:** \`POST /api/ai-hr/tasks/:id\`, \`PATCH /api/goals/:id\`, \`PATCH /api/hr/skills/:id\`, \`DELETE /api/hr/skills/:id\`, \`PATCH /api/hr/referrals/:id\`.
- **WRONG TABLE:** \`GET /api/hr/referrals\` → \`employees\` jadvalini so'raydi (mantiqsiz).
- **STUB:** \`POST /api/hr/skills\` (fake echo), \`POST /api/hr/recruitment/pipeline/:id/roadmap\` (fake echo).

### DB sxemasidagi muammolar
- Tenant scoping YO'Q hech bir HR jadvalda.
- ~73 jadval / 554 ustun Drizzle ↔ jonli DB drift (memory).
- \`mentors\` jadval domain mismatch (directory, pairing emas).
- \`employee_ratings\` snake_case kalitlar, FE \`compositeScore\` kutadi.
- \`papka_orders\` boy sxema bor lekin shim faqat 5 ustun yozardi (men tuzatdim).

### DDD / arxitektura buzilishlari
- **Qoida 1 (Result pattern):** FAIL 143 ta metod (memory'da).
- **Qoida 2 (Array.isArray):** FAIL 678 ta (memory'da).
- **Qoida 4 (raw SQL cheklangan):** compat servislar 200+ raw SQL.
- **Qoida 6 (controller faqat transport):** \`wms-catalog.controller.ts\` 5 ta business metod; bu yerda \`hr-dashboard.controller.ts\` da stub return logikasi shu xil.
- **Qoida 8 (JWT Guard):** PASS class-level, lekin compat controllerlar \`@Roles\` yo'q.
- **Qoida 13 (300-line):** 10+ HR fayl buzadi.
- **Qoida 15 (service direct db):** \`legacy.service.ts\` 30+ \`db.execute\`, \`succession-compat.service.ts\` 5+ — pattern keng yoyilgan.

### Tuzatish ustuvorligi (priority order)

**P0 — Kritik (xavfsizlik / boot stability) — 1 hafta**
1. \`sql.raw(variable)\` 3 ta joyda → parametrli qil (CLAUDE.md Qoida B).
2. \`admin.seed.ts\` default parolni o'chir.
3. \`compat\` controllerlarga \`@Roles\` qo'sh (discipline, mentorships, goals).
4. \`scripts/_dup-routes-scan.mjs\` ni \`.husky/pre-commit\` ga ula.

**P1 — Major (funksional sahifalarni tiklash) — 2 hafta**
5. FE \`api-request.ts\` unwrapper'ni \`{data}\` / \`{items,total}\` ni ham ochadigan qil → 6-8 sahifa darrov tuzaladi.
6. snake↔camel boundary mapper (BE interceptor) → \`POST 400\` muammolarini hal qiladi.
7. HR Xarita 3 endpoint shakl tuzatish.
8. Bildirishnomalar BE ↔ FE shartnoma birlashtirish.
9. Mentorlik — yangi pairing jadval / migratsiya yoki FE'ni mentor directory'siga moslash.
10. Goals PATCH endpoint qo'shish (yoki FE'ni PUT'ga o'tkazish).

**P2 — Konsolidatsiya — 3-4 hafta (modul-by-modul "BLESSED")**
11. discipline-records 4 controllerni 1 ga birlashtirish.
12. hr-v2 / hr namespacelarni rejaga ko'ra unifikatsiya.
13. employees 3-4 controllerini 1 ga birlashtirish (CQRS canonical).
14. \`lib/api-zod\` + \`lib/api-client-react\` ni real ishlatish (orval codegen sozlanган lekin bo'sh).

**P3 — Minor (sifat)**
15. 300+ qatorli fayllarni bo'lish.
16. i18n hardcoded stringlarni \`t()\` ga ko'chirish.
17. Pagination + memo + debounce — performance.

### Asosiy strategik xulosa

> Backend asosan **mavjud va real DB bilan ishlaydi.** Sahifalarning ~40% buzilishining ildizi — **frontend ↔ backend "shartnoma" siljishi** (envelope shakl + casing). Bu **1 ta** texnik tuzatish — FE \`api-request.ts\` unwrapper + BE response interceptor + snake/camel mapper — bilan **6-8 sahifa darrov tuzaladi.**
>
> Strukturaviy muammo: **bitta haqiqat manbai** yo'q. \`lib/api-spec\` (orval) + \`lib/api-zod\` + \`lib/api-client-react\` paketlari **mavjud, lekin bo'sh.** Ularni ishlatish — chuqur va doimiy yechim. Hozir har sahifa 3 ta mustaqil shakl o'rtasida qo'lda ulanadi → har edit'da yana siljiydi (ko'p-agent + ADD-ONLY zarari).
>
> Hozirgi sessiyada o'rnatilgan governance gatelar (codeowners + anti-revert + typecheck pre-commit + dup-route scanner) — bu siljishni **bloklash** uchun. Modul-by-modul "BLESSED" strategiya + contract-first codegen — keyingi yo'l xaritasi.
`;

const out = [
  PHASE1,
  '\n## Phase 2 — Per-Page Code Analysis\n\n### Group 1 — Pages 1–7 (Tashkilot + Rekruting + 360 PROFIL start)\n\n' + g1,
  '\n### Group 2 — Pages 8–14 (360 PROFIL + Davomat va Smena + Baholash start)\n\n' + g2,
  '\n### Group 3 — Pages 15–21 (Baholash rest + Onboarding + Offboarding + Nazorat start)\n\n' + g3,
  '\n### Group 4 — Pages 22–28 (Nazorat rest + HR V2 + Yangi + Brend + Haftalik)\n\n' + g4,
  PHASE3,
  PHASE4,
  PHASE5,
].join('\n');

mkdirSync('docs', { recursive: true });
writeFileSync('docs/hr-module-deep-audit-2026-05-28.md', out, 'utf8');
console.log(`✅ Yozildi: docs/hr-module-deep-audit-2026-05-28.md (${(out.length/1024).toFixed(1)} KB)`);
console.log(`   Phase 2 hajmi: g1=${(g1.length/1024).toFixed(1)}KB g2=${(g2.length/1024).toFixed(1)}KB g3=${(g3.length/1024).toFixed(1)}KB g4=${(g4.length/1024).toFixed(1)}KB`);
