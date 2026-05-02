# EuroPrint ERP - CRM va SD Modullar Arxitekturasi

## Umumiy Ma'lumot

Ushbu dokumentatsiya **Domain-Driven Design (DDD)** arxitekturasi bilan yozilgan CRM va Sales Delivery (SD) modullarini tavsiflaydi.

## CRM Moduli

### Fayl Tuzilishi

```
crm/
├── domain/
│   ├── aggregates/
│   │   ├── lead.aggregate.ts
│   │   └── deal.aggregate.ts
│   ├── events/
│   │   └── deal-won.event.ts
│   ├── repositories/
│   │   ├── i-lead.repo.ts
│   │   └── i-deal.repo.ts
│   └── value-objects/
│       ├── lead-status.vo.ts
│       ├── ai-score.vo.ts
│       └── deal-status.vo.ts
├── application/
│   ├── commands/
│   │   ├── create-lead.handler.ts
│   │   ├── qualify-lead.handler.ts
│   │   ├── create-deal.handler.ts
│   │   └── mark-deal-won.handler.ts
│   └── queries/
│       ├── list-leads.handler.ts
│       ├── get-lead-by-id.handler.ts
│       └── crm-pipeline.handler.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── drizzle-lead.repo.ts
│   │   └── drizzle-deal.repo.ts
│   └── event-handlers/
│       └── deal-won.listener.ts
├── presentation/
│   ├── crm-leads.controller.ts
│   ├── crm-deals.controller.ts
│   └── dto/
│       ├── create-lead.dto.ts
│       └── create-deal.dto.ts
└── crm.module.ts
```

### Lead Aggregate

- Status: new → contacted → qualified → proposal → negotiation → converted/lost
- AI Score: 0-100 ball
- Business Methods:
  - `qualify()`: Leadi qualified holatiga o'tkazish
  - `convertToDeal()`: Lead → Deal ga aylantirish
  - `markAsLost()`: Leadni yo'qotilgan deb belgilash

### Deal Aggregate

- Status: qualification → proposal → negotiation → won/lost
- Business Methods:
  - `markAsWon()`: Trigger 2 emit qiladi → SD moduli SO yaratadi
  - `markAsLost(reason)`: Dealni yo'qotilgan deb belgilash
  - `updateStatus(newStatus)`: Status o'zgartirish

### CRM Triggers

- **Trigger 1**: Lead qualified → CRM pipeline ga kiritiladi
- **Trigger 2**: Deal Won → SD Orders (avtomatik SO yaratish)

## SD Moduli (Eng Muhim)

### Fayl Tuzilishi

```
sd/
├── domain/
│   ├── aggregates/
│   │   └── sales-order.aggregate.ts
│   ├── events/
│   │   ├── order-created.event.ts
│   │   ├── order-status-changed.event.ts
│   │   └── advance-check-failed.event.ts
│   ├── repositories/
│   │   └── i-sales-order.repo.ts
│   └── value-objects/
│       └── so-status.vo.ts
├── application/
│   ├── commands/
│   │   ├── create-order.handler.ts
│   │   ├── update-order-status.handler.ts
│   │   ├── approve-advance-bypass.handler.ts
│   │   └── approve-tech-checkpoint.handler.ts
│   └── queries/
│       ├── list-orders.handler.ts
│       ├── get-order-by-id.handler.ts
│       └── pending-advance-orders.handler.ts
├── infrastructure/
│   ├── repositories/
│   │   └── drizzle-sales-order.repo.ts
│   └── event-handlers/
│       ├── deal-won.listener.ts
│       └── payment-received.listener.ts
├── presentation/
│   ├── sd-orders.controller.ts
│   └── dto/
│       ├── create-order.dto.ts
│       ├── update-status.dto.ts
│       ├── advance-bypass.dto.ts
│       └── tech-checkpoint.dto.ts
└── sd.module.ts
```

### SalesOrder Aggregate

#### Status Holatlari (20+ holat)
- draft
- pending_approval
- approved
- pending_advance
- ready_for_planning
- in_planning
- completed_planning
- ready_for_production
- in_production
- ready_for_shipment
- shipped
- delivered
- closed
- cancelled
- on_hold

#### HARD BLOCK §8.1

```typescript
checkAdvanceAndBlock(): { blocked: boolean; reason?: string }
```

- Avans DEFAULT 70% talab qilinadi
- `pending_advance` → `ready_for_planning` ga o'tishda tekshiriladi
- Agar `advancePaid < required` va `advanceStatus !== 'bypassed'` → BLOCK
- Bypass faqat Director/Super Admin qilishi mumkin (reason MAJBURIY)

#### 3-Checkpoint §8.2

```typescript
isThreeCheckpointPassed(): boolean
```

BOM, Routing, TechCard alohida tasdiqlash
- Uchovi ham approved → Trigger 5 emit
- PP moduliga signal yuboradi

#### Business Methods

- `bypassAdvance(bypassBy, reason)`: Avans bypass (reason REQUIRED)
- `approveTechCheckpoint(type)`: BOM, Routing, Card tasdiqlash
- `updateStatus(newStatus)`: Status o'zgartirish (valid transitions tekshiradi)

### SD Triggers

- **Trigger 2**: Deal Won → SO avtomatik yaratish
- **Trigger 3**: `design_flag=true` → Design event emit
- **Trigger 4**: `sample_flag=true` → Sample event emit
- **Trigger 5**: 3-checkpoint completed → PP signal
- **Trigger 15**: Full payment → Order closed
- **Trigger 20**: Advance bypass audit log

## Shared Domain

### Result Pattern

```typescript
Result<T> {
  isSuccess: boolean
  value?: T
  error?: string
}

// Usage
const result = await handler.execute(command);
if (!result.isSuccess) {
  return Result.fail('Error message');
}
return Result.ok(value);
```

### Value Objects

- `Money`: Currency bilan birga pul miqdori
- `LeadStatus`: 'new' | 'contacted' | 'qualified' | ...
- `DealStatus`: 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost'
- `SoStatus`: 15 ta holat

### Domain Events

```typescript
interface DomainEvent {
  aggregateId: number
  aggregateName: string
  eventName: string
  timestamp: Date
  data?: Record<string, any>
}
```

## CQRS Pattern

### Commands (Yozish)
- `CreateLeadCommand` → `CreateLeadHandler`
- `QualifyLeadCommand` → `QualifyLeadHandler`
- `CreateDealCommand` → `CreateDealHandler`
- `MarkDealWonCommand` → `MarkDealWonHandler`
- `CreateOrderCommand` → `CreateOrderHandler`
- `UpdateOrderStatusCommand` → `UpdateOrderStatusHandler`
- `ApproveAdvanceBypassCommand` → `ApproveAdvanceBypassHandler`
- `ApproveTechCheckpointCommand` → `ApproveTechCheckpointHandler`

### Queries (O'qish)
- `ListLeadsQuery` → `ListLeadsHandler`
- `GetLeadByIdQuery` → `GetLeadByIdHandler`
- `CrmPipelineQuery` → `CrmPipelineHandler`
- `ListOrdersQuery` → `ListOrdersHandler`
- `GetOrderByIdQuery` → `GetOrderByIdHandler` (360° card view)
- `PendingAdvanceOrdersQuery` → `PendingAdvanceOrdersHandler`

## Validation

### Zod Schemas

- `CreateLeadDtoSchema`: firstName, lastName, email, phone, source
- `CreateDealDtoSchema`: leadId, totalAmount, currency, expectedClosureDate, assignedTo
- `CreateOrderDtoSchema`: companyId, totalAmount, currency, designFlag, sampleFlag
- `UpdateStatusDtoSchema`: newStatus
- `AdvanceBypassDtoSchema`: reason (REQUIRED, min 5, max 500)
- `TechCheckpointDtoSchema`: type ('bom' | 'routing' | 'card')

## Logging

Pino logger bilan barcha operatsiyalar log qilinadi:

```typescript
this.logger.log({ msg: 'message', context: 'data' })
this.logger.error({ msg: 'error', error: 'details' })
this.logger.debug({ msg: 'debug', ...data })
this.logger.warn({ msg: 'warning', ...data })
```

## Authorization

- `@Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)`
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@CurrentUser()` - Authenticated user decorator

## Event Bus

NestJS EventEmitter2 bilan asyncronous event handling:

```typescript
@OnEvent('deal.won', { async: true })
async handleDealWon(event: DealWonEvent) { }

this.eventBus.publish(new DealWonEvent(...))
```

## Key Rules

1. **No ANY type** - Barcha types strongly typed
2. **Max 300 lines per file** - Code clarity
3. **Result pattern** - Error handling
4. **Pino logger** - Structured logging
5. **DDD principles** - Domain logic aggregates-da
6. **CQRS separation** - Commands va Queries ajratilgan
7. **Event sourcing** - Domain events publish qilinadi
8. **Advance check** - §8.1 HARD BLOCK
9. **3-checkpoint** - §8.2 mandatory approval
10. **Valid transitions** - Status changes validated

## Testing Notes

- Commands test - database mock
- Queries test - repository mock
- Aggregate test - business logic isolation
- Controller test - authorization guards
- Event handlers test - event consumption
