# EUROPRINT ERP — DOMAIN EVENT KATALOGI

> **Barcha domain eventlar — bir joyda. Har event uchun: nom, payload, emitter, listener, holat.**
> EventEmitter2 va CQRS EventBus — ALOHIDA KANALLAR, avtomatik ko'prik YO'Q.
> ⚠️ ZERO-LISTENER event = XAVF (PRC-10): har event kamida 1 listener ga ega bo'lishi SHART.
> Bog'liq: [Backend_Reja/03_Datalar_almashuvi.md](V2-REBUILD/Backend_Reja/03_Datalar_almashuvi.md)

---

## Eventlarni Qo'llash Qoidasi

```typescript
// ✅ TO'G'RI — EventEmitter2 orqali emit (NestJS EventEmitter2):
this.eventEmitter.emit('sales_order.created', new SalesOrderCreatedEvent(order));

// ✅ TO'G'RI — EventEmitter2 listener:
@OnEvent('sales_order.created')
async handle(event: SalesOrderCreatedEvent) { ... }

// ✅ TO'G'RI — Outbox (ishonchli delivery, at-least-once):
// domain_events jadvalga yozing → relay processor eventni jo'natadi

// ❌ XATO — EventEmitter2 da CQRS @EventsHandler ishlaydi deb taxmin qilish
// EventEmitter2 kanali va CQRS EventBus kanali — ALOHIDA, avtomatik ko'prik YO'Q
```

---

## GOLDENTHREAD: Asosiy Event Zanjiri

```
SD (Savdo) → PP (Reja) → MES (Ijro) → QC (Sifat) → WMS (Ombor) → FIN (Moliya)
     ↓           ↓           ↓           ↓            ↓              ↓
SalesOrder    WorkOrder  Production   QcCheck    WH_Stock       GL Entry
Created      Created     Started      Passed     Updated        Created
```

---

## 1. SD — SAVDO EVENTLARI

### `sales_order.created`
```typescript
class SalesOrderCreatedEvent {
  salesOrderId: number;      // sales_orders.id
  customerId: number;        // sd_customers.id
  totalAmount: number;       // NUMERIC(18,2)
  deliveryDate: string;      // ISO8601: "2026-07-01T00:00:00Z"
  lineItems: Array<{
    materialCardId: number;  // material_cards.id
    quantity: number;        // dona yoki M2
    unitOfMeasure: string;   // unit_of_measures.code: "PCS"|"M2"|"SHEET"
    unitPrice: number;
  }>;
  createdAt: string;         // ISO8601
}
// Emitter: SdOrdersService.createOrder()
// Listener: PpMpsService (→ MPS hisoblash trigger)
// Channel: EventEmitter2
// Holat: ✅ ULANGAN
```

### `sales_order.confirmed`
```typescript
class SalesOrderConfirmedEvent {
  salesOrderId: number;
  confirmedBy: number;       // users.id
  confirmedAt: string;       // ISO8601
}
// Emitter: SdOrdersService.confirmOrder()
// Listener: PpWorkOrderService (→ work_order yaratish)
// Channel: EventEmitter2
// Holat: ⚠️ QISMAN — listener mavjud, lekin work_order CREATE tekshirilsin
```

### `sales_order.cancelled`
```typescript
class SalesOrderCancelledEvent {
  salesOrderId: number;
  reason: string;
  cancelledBy: number;
  cancelledAt: string;
}
// Emitter: SdOrdersService.cancelOrder()
// Listener: PpWorkOrderService (→ work_order CANCEL), WmsReserveService (→ reserve bo'shatish)
// Channel: EventEmitter2
// Holat: 🔲 QURILMAGAN
```

---

## 2. PP — ISHLAB CHIQARISH REJASI EVENTLARI

### `work_order.created`
```typescript
class WorkOrderCreatedEvent {
  workOrderId: number;       // work_orders.id
  salesOrderId: number;      // sales_orders.id ga FK
  technologyCardId: number;  // technology_cards.id (MASTER spec)
  plannedQuantity: number;
  plannedStartDate: string;  // ISO8601
  plannedEndDate: string;    // ISO8601
  workCenterId: number;      // work_centers.id
}
// Emitter: PpWorkOrderService.createWorkOrder()
// Listener: MesProductionService (→ ish navbati)
// Channel: EventEmitter2
// Holat: ✅ ULANGAN
```

### `work_order.released`
```typescript
class WorkOrderReleasedEvent {
  workOrderId: number;
  releasedBy: number;        // users.id (PP manager)
  releasedAt: string;
}
// Emitter: PpWorkOrderService.releaseWorkOrder()
// Listener: MesOperatorService (→ operator tablet da ko'rinadi)
// Channel: EventEmitter2
// Holat: ⚠️ QISMAN
```

---

## 3. MES — ISHLAB CHIQARISH IJROSI EVENTLARI

### `production_session.started`
```typescript
class ProductionSessionStartedEvent {
  sessionId: number;         // production_sessions.id
  workOrderId: number;
  workCenterId: number;
  operatorId: number;        // users.id (operator)
  shiftId: number;           // shift_schedules.id
  startedAt: string;         // ISO8601
}
// Emitter: MesProductionService.startSession()
// Listener: IotMonitorService (→ sensor kuzatuv boshlash)
// Channel: EventEmitter2
// Holat: ✅ ULANGAN
```

### `production_session.completed`
```typescript
class ProductionSessionCompletedEvent {
  sessionId: number;
  workOrderId: number;
  quantityProduced: number;
  quantityRejected: number;  // operator kiritgan brak
  durationMinutes: number;
  oeeActual: number;         // 0.0 - 1.0 (availability × performance × quality)
  completedAt: string;
}
// Emitter: MesProductionService.completeSession()
// Listener: QcService (→ qc_checks yaratish trigger)
// Channel: EventEmitter2
// Holat: ✅ ULANGAN
```

### `work_order.completed`
```typescript
class WorkOrderCompletedEvent {
  workOrderId: number;
  salesOrderId: number;
  totalQuantityProduced: number;
  totalQuantityRejected: number;
  completedAt: string;
}
// Emitter: MesProductionService (barcha sessiyalar tugaganda)
// Listener: QcService (→ REAL qc_check INSERT — stub emas!)
// Channel: EventEmitter2
// Holat: ⚠️ QISMAN — QC listener real INSERT bo'lishi kerak (T7 texnik qarz)
```

### `shift.started`
```typescript
class ShiftStartedEvent {
  shiftId: number;           // shift_schedules.id
  shiftName: string;         // "1-smena" | "2-smena" | "3-smena"
  supervisorId: number;
  startedAt: string;
}
// Emitter: MesShiftService.startShift()
// Listener: MesOperatorService (tablet reset), DirAndonService (Andon update)
// Channel: EventEmitter2
// Holat: ✅ ULANGAN
```

### `shift.ended`
```typescript
class ShiftEndedEvent {
  shiftId: number;
  handoverId: number;        // shift_handovers.id (KANONIK jadval — VIEW emas)
  totalProduced: number;
  totalBrak: number;
  oeeShift: number;
  endedAt: string;
}
// Emitter: MesShiftService.endShift()
// Listener: DirReportService (→ kunlik snapshot), HrAttendanceService
// Channel: EventEmitter2
// Holat: ✅ ULANGAN
```

---

## 4. IoT — SENSOR EVENTLARI

### `iot.anomaly_detected`
```typescript
class IoTAnomalyDetectedEvent {
  sensorId: number;          // iot_sensors.id
  workCenterId: number;
  anomalyType: 'temperature' | 'pressure' | 'vibration' | 'humidity' | 'power';
  measuredValue: number;
  threshold: number;         // belgilangan chegara
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: string;        // ISO8601
}
// Emitter: IotMonitorService (sensor threshold tekshiruvi)
// Listener:
//   1. MesProductionService (CRITICAL → session PAUSE)
//   2. DirAndonService (Andon rangi qizilga o'zgartirish)
//   3. NtfNotificationService (bog'liq supervisor ga xabar)
// Channel: EventEmitter2
// Holat: ⚠️ QISMAN — listener mavjud lekin stub edi (T8) → REAL bo'lishi kerak
```

---

## 5. QC — SIFAT NAZORATI EVENTLARI

### `qc.inspection_passed`
```typescript
class QcInspectionPassedEvent {
  qcCheckId: number;         // quality_checks.id
  workOrderId: number;
  inspectedQuantity: number;
  passedQuantity: number;
  defectsFound: number;      // minor defects (PASSED bo'lgani)
  inspectedBy: number;       // users.id (QC inspector)
  passedAt: string;
}
// Emitter: QcService.passInspection()
// Listener: WmsReceiveService (→ warehouse_stock INSERT/UPSERT)
// Channel: EventEmitter2
// Holat: ⚠️ QISMAN — listener real warehouse_stock UPSERT bo'lishi kerak
```

### `qc.inspection_failed`
```typescript
class QcInspectionFailedEvent {
  qcCheckId: number;
  workOrderId: number;
  failedQuantity: number;
  defectCodes: string[];     // defect_catalog.code[] masalan: ["DEF-G-001", "DEF-O-004"]
  severity: 'MAJOR' | 'CRITICAL';
  failureAction: 'REWORK' | 'SCRAP';  // qayta ishlov | yo'q qilish
  failedAt: string;
}
// Emitter: QcService.failInspection()
// Listener:
//   1. MesProductionService (→ REWORK ish buyurtmasi yaratish)
//   2. WmsScrapService (→ SCRAP holatida brakni hisobdan chiqarish)
// Channel: EventEmitter2
// Holat: ⚠️ QISMAN — scrap listener bo'lishi kerak
```

---

## 6. WMS — OMBOR EVENTLARI

### `warehouse.stock_updated`
```typescript
class WarehouseStockUpdatedEvent {
  materialCardId: number;    // material_cards.id
  warehouseCode: string;     // "RM-MAIN" | "WIP" | "FG" | "QUARANTINE"
  quantityBefore: number;
  quantityAfter: number;
  transactionType: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  referenceId?: number;      // work_orders.id yoki sales_orders.id
  updatedAt: string;
}
// Emitter: WmsStockService (warehouse_stock UPSERT dan keyin)
// Listener:
//   1. PpMpsService (→ material yetarli bo'lsa MPS qayta hisob)
//   2. NtfNotificationService (→ min_stock chegaradan tushsa ogohlantirish)
// Channel: EventEmitter2
// Holat: ⚠️ QISMAN
```

### `inventory.reserved`
```typescript
class InventoryReservedEvent {
  salesOrderId: number;
  materialCardId: number;
  reservedQuantity: number;
  warehouseCode: string;
  reservedUntil: string;     // ISO8601
}
// Emitter: WmsReserveService.reserve()
// Listener: SdOrdersService (→ buyurtma status "RESERVED")
// Channel: EventEmitter2
// Holat: 🔲 QURILMAGAN
```

---

## 7. FIN — MOLIYA EVENTLARI

### `pos.movement_completed`
```typescript
class PosMovementCompletedEvent {
  movementId: number;
  movementType: 'RECEIPT' | 'ISSUE';  // HARDCODED 'kirim' EMAS! (FIX2)
  materialCardId: number;
  quantity: number;
  unit: string;              // unit_of_measures.code
  warehouseCode: string;
  completedAt: string;
}
// Emitter: PosMovementService.complete()
// Listener: WmsStockService (→ warehouse_stock UPSERT → TYPE_MAP bilan)
// Channel: EventEmitter2
// Holat: ✅ ULANGAN (FIX2 bilan to'g'irlandi)
```

### `payroll.period_closed`
```typescript
class PayrollPeriodClosedEvent {
  periodYear: number;        // 2026
  periodMonth: number;       // 6 (1-12)
  totalGross: number;        // NUMERIC(18,2)
  totalInps: number;         // gross * 0.08
  totalNdfl: number;         // gross * 0.12
  totalNet: number;          // gross - inps - ndfl
  employeeCount: number;
  closedBy: number;          // users.id (accountant)
  closedAt: string;
}
// Emitter: HrPayrollService.closePeriod()
// Listener: FinGlPostingService (→ GL entries INSERT — db.transaction() bilan!)
// Channel: EventEmitter2
// ⚠️ entries jadvali (SAP#76): gl_journal_entries TEGMA
// Holat: ⚠️ QISMAN — GL listener real entries INSERT bo'lishi kerak
```

---

## 8. CRM — EVENTLARI

### `deal.won`
```typescript
class DealWonEvent {
  dealId: number;            // crm_deals.id
  customerId: number;        // sd_customers.id
  dealValue: number;
  products: Array<{
    materialCardId: number;
    quantity: number;
    agreedPrice: number;
  }>;
  wonAt: string;
}
// Emitter: CrmDealsService.markWon()
// Listener: SdOrdersService (→ sales_order YARATISH — avtomatik ko'prik!)
// Channel: EventEmitter2
// Holat: 🔲 QURILMAGAN — MUHIM XUSUSIYAT
```

### `deal.lost`
```typescript
class DealLostEvent {
  dealId: number;
  reason: string;
  lostAt: string;
}
// Emitter: CrmDealsService.markLost()
// Listener: CrmAnalyticsService (→ win-rate hisoblash)
// Channel: EventEmitter2
// Holat: 🔲 QURILMAGAN
```

---

## 9. HR/ORG — EVENTLARI

### `employee.function_assigned`
```typescript
class EmployeeFunctionAssignedEvent {
  employeeId: number;        // hr_employees.id
  orgFunctionId: number;     // org_functions.id (KANONIK KARTA)
  razryadLevelId: number;    // razryad_levels.id
  assignedBy: number;
  effectiveDate: string;
  baseSalary: number;
}
// Emitter: HrEmployeeService.assignFunction()
// Listener: HrPayrollService (→ oylik hisob bazaviy maosh yangilash)
// Channel: EventEmitter2
// Holat: 🔲 QURILMAGAN
```

---

## Holat Xulosasi

| Holat | Soni | Ma'nosi |
|-------|------|---------|
| ✅ ULANGAN | 5 | Emitter + listener ishlaydi, real DB |
| ⚠️ QISMAN | 9 | Biri yo'q (emitter yoki listener stub) |
| 🔲 QURILMAGAN | 5 | Hech biri yo'q |

**Ustuvor qurilishi keraklar:**
1. `work_order.completed` → QC real INSERT (T7)
2. `iot.anomaly_detected` → MES PAUSE + Andon REAL (T8)
3. `deal.won` → SD salesOrder CREATE avtomatik
4. `qc.inspection_passed` → WMS real UPSERT
5. `payroll.period_closed` → GL real entries INSERT

---

## Outbox Pattern (ishonchli delivery)

```sql
-- domain_events jadvalga yozish:
INSERT INTO domain_events (event_type, payload, status, created_at)
VALUES ('sales_order.created', '{"salesOrderId":1,...}', 'PENDING', NOW());

-- Relay processor (har 5 sekunda):
SELECT * FROM domain_events WHERE status = 'PENDING' ORDER BY created_at LIMIT 50;
-- EventEmitter2 emit() → status = 'DELIVERED'
-- Xato bo'lsa: status = 'FAILED', retry_count++
```

---

*EuroPrint ERP · Event Katalogi · Versiya: 2026-06-18*
