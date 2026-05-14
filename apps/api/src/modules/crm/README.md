# CRM module (`apps/api/src/modules/crm/`)

> Lead-to-deal pipeline + customer analytics. Implemented with Domain-Driven
> Design — `domain/` holds aggregates and pure business logic, `application/`
> holds CQRS command/query handlers, `infrastructure/` is Drizzle repos.
>
> See also: top-level `modules/ARCHITECTURE.md` for the DDD slice diagram.

## Subfolder map

```
crm/
├── domain/
│   ├── aggregates/                Lead, Deal (DDD aggregate roots)
│   ├── value-objects/             LeadStatus, DealStatus, AiScore
│   ├── events/                    DealWon, LeadQualified, etc.
│   ├── services/                  Pure compute (lead scoring)
│   │   ├── lead-scorer.service.ts    V1 heuristic — rules-based, instant
│   │   ├── lead-scorer-v2.service.ts V2 logistic regression + temporal decay
│   │   └── elo-rating.service.ts     ELO rating for sales-rep performance
│   └── repositories/              Repo interfaces (ILeadRepo, IDealRepo)
├── application/
│   ├── commands/                  CreateLead, QualifyLead, CreateDeal, MarkWon
│   └── queries/                   ListLeads, GetLeadById, CrmPipeline
├── analytics/                     Customer-level analytics
│   ├── rfm.service.ts                 9-segment RFM
│   ├── clv.service.ts                 CLV — steady-state + DCF
│   ├── cohort.service.ts              Retention matrix (count + revenue)
│   └── funnel.service.ts              Win-rate + conversion + velocity
├── leads/                         Lead-specific endpoints + DTOs
├── deals/                         Deal-specific endpoints + DTOs
├── contacts/                      Per-company contact persons
├── pipelines/                     Pipeline + stage configuration
├── listeners/                     Cross-module event listeners
│   └── website-lead.service.ts        Public site → CRM lead funnel
├── infrastructure/                Drizzle repository implementations
├── presentation/                  NestJS controllers (thin transport)
└── crm.module.ts                  Wiring
```

## Two lifecycles

```
Lead          →  Deal
 ─ new            ─ qualification
 ─ contacted      ─ proposal
 ─ qualified  →   ─ negotiation
 ─ proposal       ─ won  ──┐
 ─ converted      ─ lost   │
 ─ lost                    ▼
                  SD Sales Order (auto-created)
```

Two important triggers emit domain events:
- **`LeadQualified`** — promotes lead into the pipeline; sales manager
  receives a Telegram notification.
- **`DealWon`** — listener creates an SD sales order automatically. This is
  the contract between CRM and SD: never write SD orders by hand from a
  won deal; emit the event.

## Where each formula lives

| Need to know...                                | Read this                                                  |
|------------------------------------------------|------------------------------------------------------------|
| 9-segment RFM classification (Champions, Lost...)| `analytics/rfm.service.ts`                                |
| Customer Lifetime Value (simple + DCF)         | `analytics/clv.service.ts`                                 |
| Cohort retention matrix (count + revenue)      | `analytics/cohort.service.ts`                              |
| Win-rate, conversion, pipeline velocity        | `analytics/funnel.service.ts`                              |
| Lead score V1 (heuristic, instant)             | `domain/services/lead-scorer.service.ts`                   |
| Lead score V2 (trained logistic + time decay)  | `domain/services/lead-scorer-v2.service.ts`                |
| Sales-rep ELO rating                           | `domain/services/elo-rating.service.ts`                    |

## V1 vs V2 lead scorer — which to use

- **V1 (heuristic)** is the *triage* score shown to SDRs the moment a lead
  arrives. No training data needed; explainable as a points-per-factor
  breakdown ("budget 100M = +25, recent = +5").
- **V2 (logistic regression)** runs nightly retrains over historical
  conversions. Better predictive power once we have >500 labelled
  conversion outcomes, but invisible to SDRs (no breakdown).

The CRM dashboard shows both side-by-side until V2 hits AUC > 0.7 on the
validation set; at that point V2 will become the primary score and V1
demotes to "explanation tooltip" duty.

## CRM ↔ SD boundary

CRM owns the *opportunity* (Lead, Deal). SD owns the *fulfillment* (Order,
Delivery, Invoice). The handoff is `DealWon` → SD Order creation listener.

Things CRM does NOT do:
- Pricing (lives in SD: `sd-quotations.service.ts`)
- Inventory checks (lives in WMS)
- Invoicing (lives in FI / fi/)
- Customer master data (shared, lives partly in SD)

## Conventions

- Lead status / Deal status are enum-typed value objects under
  `domain/value-objects/`. Don't compare raw strings — use the VO.
- AI score is 0..100 (percentage-style). Stored on the lead row,
  refreshed by V2 service nightly.
- Every lead/deal mutation emits a domain event — see `domain/events/`.
- Pipeline stages are configurable per-tenant (`crm_stages` table).
  Stage semantics (won/lost/intermediate) are flags on the stage row,
  NOT enum values — see `funnel.service.ts` for the join.

## Where to read deeper

- DDD slice diagram (Lead + Deal aggregates) → `modules/ARCHITECTURE.md`
- RFM classifier rationale → top of `analytics/rfm.service.ts`
- CLV formula selection → top of `analytics/clv.service.ts`
- V1 vs V2 scoring tradeoff → top of `domain/services/lead-scorer-v2.service.ts`
