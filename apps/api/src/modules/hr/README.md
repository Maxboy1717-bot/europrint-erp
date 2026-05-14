# HR module (`apps/api/src/modules/hr/`)

> Employee lifecycle + workforce analytics for a ~400-person manufacturing
> floor. Covers attendance, payroll, KPI, recruitment, adaptation, leave,
> safety, and the AI interview pipeline. The biggest domain module in the
> codebase.

## Subfolder map (by concern)

```
hr/
├── employees/             Master data — employee profiles, contracts
├── attendance/            Daily attendance, time entry, room-snapshot cron
├── shift/                 Shift planning + assignment + swaps
├── leave/                 Vacation, sick leave, business trips
├── payroll/               Gross-to-net (INPS / JSHD / income tax)
├── domain/services/
│   ├── kpi.service.ts                  Weighted KPI score + rating
│   └── overtime-calculator.service.ts  Configurable OT pay
├── application/queries/
│   └── employee-kpi.handler.ts         Period-window KPI rollup
├── recruitment/           Candidate funnel, interview, hire
├── ai-interview-v2/       Claude/OpenAI-driven first-round interview
├── onboarding/            New-hire plan with checkpoints
├── adaptation/            *(see modules/adaptation/)*
├── offboarding/           Exit checklist, asset return, knowledge transfer
├── career-path/           Skill progression, promotion plan
├── skills-matrix/         Competency assessment grid
├── inspection/            On-floor inspection rounds (safety + quality)
├── safety/                Incidents, PPE compliance, hazard zones
├── reception/             Reception/lobby greeting, visitor mgmt
├── discipline-v2/         Warnings, write-ups, PIP triggers
├── pip/                   Performance Improvement Plan workflow
├── enps/                  Employee Net Promoter Score surveys
├── gamification/          Badges, leaderboards, point rewards
├── daily-report/          End-of-shift handoff report
├── document-workflow/     PIN-signed HR documents (offer, NDA, contract)
├── telegram-bots/         HR-facing Telegram bot endpoints
├── analytics/             Cross-cutting workforce analytics
├── common/                Shared helpers within HR
├── infrastructure/        Drizzle repositories
├── presentation/          NestJS controllers (thin transport)
└── hr.module.ts           Wiring
```

## Key formulas

| Need to know...                                | Read this                                              |
|------------------------------------------------|--------------------------------------------------------|
| How an employee's KPI score is computed         | `domain/services/kpi.service.ts`                       |
| Period-window KPI with feedback aggregation     | `application/queries/employee-kpi.handler.ts`          |
| Overtime pay segmentation (reg/ext/weekend/night) | `domain/services/overtime-calculator.service.ts`     |
| Payroll gross-to-net (INPS 12% / JSHD 1%)       | `payroll/payroll.service.ts`                           |

## Workforce-state model

Every employee has a tree of related rows:

```
employees                      master record
  ↳ employment_contracts       active + history
  ↳ attendance_records         daily clock-in/out
  ↳ shift_assignments          which shift, which line
  ↳ leave_requests             approved + draft
  ↳ salary_history             baseline + bonus + deductions
  ↳ kpi_history                computed monthly, kept for trend
  ↳ disciplines                warnings + write-ups
  ↳ certificates               training/safety qualifications
  ↳ skills_matrix_assessments  per-skill rating
  ↳ overtime_records           non-shift hours
  ↳ telegram_chat_id           optional, for bot notifications
```

## KPI weight history (important — affects bonus math)

`business.constants.ts` defines `KPI_WEIGHTS`:
```ts
{ attendance: 0.5, performance: 0.3, tasks: 0.2 }
```

**Naming is legacy** — `attendance` here actually means "achievement (volume)",
`performance` means "quality", `tasks` means "OEE". The labels match the
union agreement document (collective contract), not the metric semantics.
DO NOT rename without renegotiating the contract. See `kpi.service.ts`
top-of-file for the full explanation.

## AI interview pipeline (recruitment)

Candidate → public link → `ai-interview-v2/` flow:
1. Candidate clicks Telegram link → captcha → 4-tip onboarding modal
2. Camera + mic check, voice/text answer mode
3. Claude/OpenAI conducts the interview (5-10 questions)
4. Score + transcript saved to `ai_interview_sessions`
5. Recruiter reviews + scores in `recruitment/`

Public surface lives in `apps/api/src/modules/hr/ai-interview-v2/public/`
and is the only HR endpoint without JWT (`@Public()` decorator).

## Cron jobs (in `hr/attendance/` and `hr/`)

- `room-snapshot.cron.ts` — every 5 min, polls face-cam endpoints to record
  who's physically in which room. Backs the IoT attendance dashboard.
- `enps-survey.cron.ts` — monthly nudge to fill ENPS survey.
- `badge-award.cron.ts` (lives in `apps/api/src/cron/`) — nightly badge eval.

## Conventions

- All employee IDs are `number` (legacy autoincrement). UUID transition
  isn't planned — references span ~30+ tables.
- Salary stored as `numeric` UZS. Always parse with `safeNum(value, 0)`.
- Date arithmetic uses `TashkentTimeService.now()`, never raw `new Date()`.
- Status enums are strings (`'active' | 'inactive' | 'terminated' | ...`).
  Don't introduce numeric codes — breaks i18n + audit log readability.

## Where to read deeper

- KPI formula + weight naming rationale → top of `domain/services/kpi.service.ts`
- Overtime policy table + DB constraints → top of `domain/services/overtime-calculator.service.ts`
- AI interview architecture → `ai-interview-v2/README.md` (if present, else module index)
- Payroll tax mapping (INPS/JSHD/income) → top of `payroll/payroll.service.ts`
