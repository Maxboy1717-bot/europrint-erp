# EuroPrint ERP - DDD Module Integration Guide

## Architecture Overview

This implementation follows **Domain-Driven Design (DDD)** with **CQRS** pattern for four core modules:
- **PP** (Production Planning) - Production Orders, BOM, Routing
- **MES** (Manufacturing Execution) - Production Sessions, Downtime
- **WMS** (Warehouse Management) - Stock, Goods Issue, FEFO/FIFO
- **MM** (Materials Management) - Materials, Purchase Orders

## Module Structure

Each module follows DDD 4-layer architecture:

```
domain/
  ├── aggregates/      (Business logic entities)
  ├── repositories/    (Interface definitions)
  ├── events/         (Domain events)
  └── value-objects/  (Immutable values)

application/
  ├── commands/       (CommandHandlers)
  └── queries/        (QueryHandlers)

infrastructure/
  ├── repositories/   (Drizzle implementations)
  ├── event-handlers/ (Event listeners)
  └── mappers/       (DTO → Domain)

presentation/
  └── controllers/    (REST endpoints)
```

## Key Features Implemented

### PP Module (Production Planning)

**Aggregates:**
- `ProductionOrder` - Order status: planned → released → in_progress → completed
- `Bom` - Bill of Materials (items + approval)
- `Routing` - Manufacturing operations with work centers

**Checkpoints (§8.2):**
1. BOM Approved (checkpoint 1)
2. Routing Approved (checkpoint 2)
3. Tech Card Approved (checkpoint 3) → Unlock PP creation

**Triggers:**
- **T7**: Advance Approved → Unlock PP planning
- **T8**: PP Released → MM/WMS material reservation
- **T18**: MRO Stop → PP rescheduling

**Commands:**
- `CreateProductionOrderCommand` - Creates PO from 3-checkpoint validated SO
- `ReleaseProductionOrderCommand` - Releases to MES, triggers material reservation
- `ApproveBomCommand` - Checkpoint 1
- `ApproveRoutingCommand` - Checkpoint 2

**Queries:**
- `ProductionPlanQuery` - Date range planning
- `MachineLoadQuery` - Work center capacity

### MES Module (Manufacturing Execution)

**Aggregates:**
- `ProductionSession` - Status: ready → checklist_pending → running → paused → completed → sent_to_qc

**LMS Certification (§8.3):**
- Hard block if operator lacks required course certification
- Checks expiry date before session start

**Commands:**
- `StartSessionCommand` - LMS cert check + checklist verification
- `CompleteSessionCommand` - Moves to QC, emits T10 + T16 events
- `RecordDowntimeCommand` - Reason mandatory (§9 step 9)

**Triggers:**
- **T10**: MES Completed → QC signal
- **T16**: MES → HR 360° database

### WMS Module (Warehouse Management)

**Aggregates:**
- `Stock` - quantity, reserved, expiry_date, batch_number

**FEFO/FIFO (§8.5):**
- Order by: `expiry_date ASC NULLS LAST, received_at ASC`
- Automatic FEFO selection on goods issue

**Commands:**
- `GoodsIssueCommand` - FEFO-ordered stock issue
- `ReceiveFgCommand` - FG receipt with batch tracking
- `ReserveMaterialCommand` - Material reservation from PP

**Triggers:**
- **T9**: WMS Goods Issued → PP completion signal
- **T11**: QC Passed → WMS FG receipt (creates rental timer)
- **T12**: WMS FG Received → FI rental timer start (§8.4)

### MM Module (Materials Management)

**Aggregates:**
- `Material` - Raw, Component, Finished Goods
- `PurchaseOrder` - Draft → Approved → Received → Invoiced → Closed

**SoD (§6):**
- Creator ≠ Approver validation on PO approval

**3-Way Match (§17):**
- PO quantity = GR quantity = Invoice quantity
- Exception: If not matched, purchase manager approval required

**HITL (§7):**
- Automatically flags POs > 50M UZS for Director approval

**Commands:**
- `CreatePurchaseOrderCommand` - Validates total amount, triggers HITL if needed
- `ApprovePurchaseOrderCommand` - SoD validation
- `GoodsReceiptCommand` - 3-Way Match validation

**Triggers:**
- **T8**: PP Released → MM material reservation
- **T19**: Supplier Quality Fail → Vendor rating decrease

## Event-Driven Architecture

### Event Flow

```
PP_RELEASED_TO_PRODUCTION
  ├─→ MM (Material Reservation)
  ├─→ WMS (Stock Reservation)
  └─→ MES (Task Creation)

MES_COMPLETED
  └─→ QC_COMPLETED

QC_PASSED
  └─→ WMS_FG_RECEIVED (Trigger 11)
  └─→ FI_RENTAL_START (Trigger 12)

SUPPLIER_QUALITY_FAIL
  └─→ MM_VENDOR_RATING_UPDATE (Trigger 19)

ADVANCE_APPROVED
  └─→ PP_PLANNING_UNLOCK (Trigger 7)
```

## Database Tables (Schema Outline)

### PP Module
- `production_orders` (35+ fields per §23)
- `boms`, `bom_items`
- `routings`, `routing_operations`

### MES Module
- `production_sessions`
- `downtime_logs`
- `operator_certifications`

### WMS Module (18 tables per §23)
- `stocks`
- `goods_receipts`, `goods_issues`
- `warehouse_locations`, `batch_tracking`

### MM Module (23 tables per §23)
- `materials`, `material_suppliers`
- `purchase_orders`, `po_items`
- `goods_receipts_mm`, `invoices`
- `vendor_ratings`

## Usage Examples

### Create Production Order
```typescript
const command = new CreateProductionOrderCommand(
  soId: 1,
  bomId: 100,
  routingId: 200,
  plannedStart: new Date('2026-04-15'),
  plannedEnd: new Date('2026-04-20'),
  checkpointValidated: true, // All 3 checkpoints passed
);
await commandBus.execute(command);
```

### Release PP (Triggers Material Reservation)
```typescript
const command = new ReleaseProductionOrderCommand(poId: 1);
await commandBus.execute(command);
// Emits: PP_RELEASED_TO_PRODUCTION → MM/WMS reservation
```

### Start MES Session (LMS Cert Check)
```typescript
const command = new StartSessionCommand(
  sessionId: 1,
  workCenterId: 50,
  operatorId: 10,
);
await commandBus.execute(command);
// Throws ForbiddenException if cert expired/missing
```

### Issue Goods (FEFO Order)
```typescript
const command = new GoodsIssueCommand(
  materialId: 5,
  warehouseId: 1,
  amount: 100,
  ppId: 1,
);
await commandBus.execute(command);
// Selects stock: expiry_date ASC, received_at ASC
// Emits: WMS_GOODS_ISSUED
```

### Create PO (SoD + HITL)
```typescript
const command = new CreatePurchaseOrderCommand(
  supplierId: 2,
  items: [{ materialId: 5, quantity: 1000, unitPrice: 5000 }],
  createdBy: 20,
);
await commandBus.execute(command);
// If total > 50M UZS: emits PO_REQUIRES_DIRECTOR_APPROVAL
```

### Approve PO (SoD Validation)
```typescript
const command = new ApprovePurchaseOrderCommand(poId: 1, approvedBy: 21);
await commandBus.execute(command);
// Fails if approvedBy === createdBy (SoD)
```

## Code Standards

- **No `any` type** - Full TypeScript typing
- **Result<T> Pattern** - All operations return Result
- **Pino Logger** - All handlers log with context
- **Max 300 lines/file** - Maintainability
- **DDD Layering** - Clear separation of concerns
- **Event Emitter** - Async event propagation

## Integration Points

1. **Database**: Inject `Database` into repositories
2. **Logger**: Inject `Logger` (Pino) into handlers
3. **Events**: Use `EventBus.emit()` for triggers
4. **Guards**: `JwtAuthGuard` + `RolesGuard` on controllers
5. **Interceptors**: `AuditInterceptor` logs all requests

## Compliance Mapping

- §6: SoD (Separation of Duties) → PO approval validation
- §7: HITL (Human-in-the-Loop) → PO > 50M threshold
- §8.2: 3 Checkpoints → BOM + Routing + TechCard
- §8.3: LMS Cert → Hard block in StartSessionCommand
- §8.4: Internal Rental → Timer on FG receipt
- §8.5: FEFO/FIFO → ORDER BY expiry_date, received_at
- §9: Mandatory Downtime Reason → RecordDowntimeCommand validation
- §10: Triggers 7,8,9,10,11,12,16,18,19 → Event handlers implemented
- §17: 3-Way Match → GoodsReceiptCommand validation
- §23: Table counts → Aggregates map to 35+, 18, 23 tables

## Next Steps

1. Configure database dialect (PostgreSQL/MySQL)
2. Generate migrations from aggregate schemas
3. Implement LMS service integration
4. Set up event broker (RabbitMQ/Kafka optional)
5. Create API documentation (Swagger)
6. Add integration tests per module
