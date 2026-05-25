# QC — Quality Control module (`apps/api/src/modules/qc/`)

> Quality control across the production lifecycle: incoming material
> inspection, in-process SPC monitoring, final inspection, defect logging,
> reclamation handling, supplier-quality scoring, FMEA, and AI-assisted
> prepress checks.

## Subfolder map

```
qc/
├── application/                Use-case handlers
├── domain/
│   └── services/               Pure compute (algorithms)
│       ├── spc.service.ts         X-bar/R control chart + Cp/Cpk
│       └── ink-consumption.service.ts  CMYK TAC + ink estimate
├── defects/                    Defect catalog + tracking
├── constants/                  Inspection codes, reason codes
├── dto/                        Zod schemas
├── infrastructure/             Drizzle repositories
├── presentation/               NestJS controllers
└── qc.module.ts                Wiring
```

## Operations covered

| Stage             | What QC does                                                 |
|-------------------|--------------------------------------------------------------|
| Prepress          | AI preflight check (TAC, registration, color profile)        |
| Incoming material | Sample inspection per AQL plan, supplier-quality score       |
| In-process        | X-bar/R chart, alert on out-of-control points                |
| Final inspection  | Pass/fail per spec, defect log if fail                       |
| Post-delivery     | Reclamation intake, RCA workflow, corrective action          |

## Key algorithms

| Need to know...                                  | Read this                                                  |
|--------------------------------------------------|------------------------------------------------------------|
| SPC X-bar/R chart + UCL/LCL + Shewhart constants | `domain/services/spc.service.ts`                           |
| Process capability Cp / Cpk                       | `domain/services/spc.service.ts`                           |
| CMYK ink consumption + TAC (ISO 12647-2)          | `domain/services/ink-consumption.service.ts`               |
| FMEA Risk Priority Number (RPN)                   | `application/fmea.service.ts`                              |

## SPC at a glance

```
Operator records 5 measurements per inspection (subgroup size n=5)
        │
        ▼
SpcService.computeXbarR(subgroups, n=5)
   → grand mean μ̂
   → mean range R̄
   → σ̂ = R̄ / d2(5) = R̄ / 2.326
   → UCL_X = μ̂ + A2(5) × R̄ = μ̂ + 0.577 × R̄
   → LCL_X = μ̂ − A2(5) × R̄
        │
        ▼
For each measurement, mark out-of-control if outside [LCL, UCL]
        │
        ▼
QC dashboard renders chart with control limits + alerts QC manager if any
out-of-control points appear (process drift signal)
```

Process capability check:
```
SpcService.computeCapability(measurements, LSL, USL)
   → Cp  = (USL − LSL) / (6σ̂)
   → Cpk = min((USL − μ̂)/3σ̂, (μ̂ − LSL)/3σ̂)
   → isCapable   = Cpk ≥ 1.33
   → isExcellent = Cpk ≥ 1.67
```

## Defect lifecycle

```
Inspection fails → defect logged
        │
        ▼
defect_records (with photo + measurement + reason code)
        │
        ▼
RCA — Root Cause Analysis
   ↳ 5 Whys / Ishikawa diagram fields
        │
        ▼
Corrective action plan
        │
        ▼
Verify (next batch) → close defect
```

If the same root cause recurs 3× in a quarter, the system auto-suggests
opening an FMEA review.

## Reclamation (customer complaint)

```
Customer reports issue → reclamation row created
        │
        ▼
Investigation (QC + sales)
        │
        ▼
Resolution: refund / replace / discount
        │
        ▼
Status: new → investigating → resolved → closed
```

Open reclamations show on the QC dashboard "Attention" panel. Resolution
rate is part of supplier-quality scoring for upstream suppliers, and
part of the CFO dashboard for customer-facing quality.

## AI prepress

Living in `ai-agents/agents/prepress-assistant.service.ts` — runs CMYK
TAC check + registration tolerance + color-profile match BEFORE plates
are made. Saves ~3M UZS per caught error (no plate-make + reprint). The
agent flags HITL (Human-In-The-Loop) for borderline cases instead of
auto-rejecting.

## Conventions

- Defect codes are a closed enum (`constants/defect-codes.ts`). Adding
  one requires UZ+RU i18n + dashboard update.
- Measurements stored with explicit unit (mm, %, gsm, °C, etc.). Never
  bare numbers — the SPC chart calibrates UCL/LCL per unit.
- Inspection plans use **AQL** (Acceptable Quality Limit) sampling:
  sample-size depends on lot size, AQL level, inspection severity.
  Tables live in `application/aql-plan.service.ts`.
- Every QC event records inspector userId + timestamp for audit.

## Where to read deeper

- SPC math + Shewhart constants → top of `domain/services/spc.service.ts`
- Cp/Cpk thresholds (1.33 / 1.67) rationale → top of `spc.service.ts`
- Ink-consumption ISO standards → top of `ink-consumption.service.ts`
- AI prepress agent → `ai-agents/agents/prepress-assistant.service.ts`
- Defect RCA workflow → `defects/` controllers
