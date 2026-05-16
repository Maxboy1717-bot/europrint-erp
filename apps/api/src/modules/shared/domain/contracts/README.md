# Shared Domain Contracts

This folder holds **thin marker interfaces** that span more than one bounded context
in EuroPrint ERP. They exist so cross-cutting code (reporting, audit, generic
serialisers, dashboards) can talk about "an order" or "a document" without
collapsing the per-context semantics into a single shared aggregate.

## Rules

1. Contracts here are **read-only marker interfaces only** — never classes,
   never richer abstractions with methods. If you find yourself adding a method,
   you are unifying aggregates; do that work inside the owning context instead.
2. Each contract documents which bounded contexts implement it and links to the
   context-map entry that explains the relationship.
3. **Do not depend on a contract from inside a context's own command/query
   handler** — depend on the context-specific aggregate, which has the full
   state machine and invariants. Contracts are for code that genuinely spans
   contexts.

## Available contracts

### `i-order-header.ts` — `IOrderHeader`

Lowest-common-denominator shape across the five "order" aggregates:

| Context           | Aggregate           | `kind`         |
|-------------------|---------------------|----------------|
| `sd/`             | `SalesOrder`        | `'sales'`      |
| `pp/`             | `ProductionOrder`   | `'production'` |
| `design/`         | `DesignOrder`       | `'design'`     |
| `mm/`             | `PurchaseOrder`     | `'purchase'`   |
| `order-workflow/` | `OrderAggregate`    | `'workflow'`   |

Use it when you need to render a heterogeneous list of orders, audit any
order-shaped record, or accept any-order in a generic helper. **Do not** use
it when you need the state machine, money math, advance-payment rules, or
domain events — those live on the concrete aggregate.

See `docs/ddd-deep-audit-strategic.md` Step 6 for the audit finding that
motivated this contract.
