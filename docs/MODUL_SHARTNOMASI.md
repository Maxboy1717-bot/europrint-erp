# EUROPRINT ERP — MODUL SHARTNOMASI

> **Modullar o'rtasida qanday muloqot qilinadi. Kim nimaga kirishi mumkin.**
> "Two-worlds" muammosining asosi — modullar bevosita bir-birining servisini import qiladi.
> Yechim: modul chegaralari = event-driven + shared read-only.
> Bog'liq: [EVENT_KATALOGI.md](EVENT_KATALOGI.md) · [PARAZIT_KOD_QOIDALARI.md](PARAZIT_KOD_QOIDALARI.md) · [XAVF_REESTRI.md](XAVF_REESTRI.md) R-09

---

## 1. OLTIN QOIDA: MODUL CHEGARASI

```
Modul A boshqa Modul B dan faqat 3 yo'l bilan:

1. EVENT (asosiy yo'l):
   ModulA → this.eventEmitter.emit('b.thing.happened', event) → ModulB listens

2. SHARED READ (faqat o'qish):
   ModulA → db.select().from(b_table) → WHERE kerak (faqat kerak bo'lganda)
   (WRITE emas! ModulB o'z jadvalini o'zi yozadi)

3. SHARED INFRA (lib/ papka):
   @common/result, @common/guards, @common/errors → barcha modul ishlatadi
   @shared/db → kanonik Drizzle schema (barcha modul o'qiy oladi)

❌ TAQIQ — to'g'ridan import:
import { PpWorkOrderService } from '../../pp/application/services/...';
import { WmsStockRepository } from '../../wms/infrastructure/repositories/...';
```

---

## 2. MODUL → JADVAL EGASI XARITASI

| Modul | Egasi bo'lgan jadvallar | Faqat o'qiy oladigan |
|-------|------------------------|---------------------|
| `hr` | hr_employees, hr_leaves, hr_documents, payroll_* | org_functions |
| `org` | org_functions, org_departments, razryad_levels | users |
| `sd` | sales_orders, sales_order_items, sd_customers | material_cards |
| `pp` | work_orders, work_order_items, schedules | sales_orders, material_cards, technology_cards |
| `mes` | mes_sessions, mes_telemetry, mes_defects, shift_handovers | work_orders, work_centers |
| `qc` | qc_inspections, qc_checklists, qc_items | mes_sessions, material_cards |
| `wms` | warehouse_stock, warehouse_transactions, ow_* | qc_inspections, material_cards |
| `fin` | entries, budget_lines, accounts | warehouse_transactions, sales_orders, hr_employees |
| `crm` | crm_leads, crm_deals, crm_activities | sd_customers, hr_employees |
| `mm` | material_cards, technology_cards, work_centers | (foundation module) |
| `auth` | users, roles, refresh_tokens | hr_employees (join) |
| `iot` | iot_devices, iot_telemetry, iot_anomalies | mes_sessions, work_centers |

---

## 3. EVENT-DRIVEN MULOQOT (Asosiy yo'l)

### Event yozish qoidalari:

```typescript
// ✅ TO'G'RI event class:
// apps/api/src/modules/sd/domain/events/sales-order-created.event.ts
export class SalesOrderCreatedEvent {
  constructor(
    public readonly salesOrderId: number,
    public readonly customerId: number,
    public readonly totalAmount: number,
    public readonly createdBy: number,
    public readonly createdAt: Date,
  ) {}
}

// ✅ EMIT (SD moduli):
this.eventEmitter.emit(
  'sales_order.created',              // snake_case, past tense
  new SalesOrderCreatedEvent(
    order.id,
    order.customer_id,
    order.total_amount,
    userId,
    new Date(),
  )
);

// ✅ LISTEN (PP moduli):
@OnEvent('sales_order.created')
async handleSalesOrderCreated(event: SalesOrderCreatedEvent): Promise<void> {
  // PP o'z ishini qiladi — SD ga qaytmaydi, import qilmaydi
  const workOrder = await this.workOrderService.createFromSalesOrder(event);
  // Muvaffaqiyatli bo'lsa PP o'z eventini chiqaradi:
  this.eventEmitter.emit('work_order.created', new WorkOrderCreatedEvent(...));
}
```

### Event nomlash:

```
Format: [modul_prefiksi].[entity].[amal]

sd.sales_order.created     (buyurtma yaratildi)
sd.sales_order.cancelled   (buyurtma bekor qilindi)
pp.work_order.created      (ishlanma buyurildi)
pp.work_order.completed    (ishlanma tugadi)
mes.session.started        (smena boshlandi)
mes.session.completed      (smena tugadi)
qc.inspection.passed       (sifat tekshiruv o'tdi)
qc.inspection.failed       (sifat tekshiruv o'tmadi)
wms.stock.received         (ombor kirim)
wms.stock.issued           (ombor chiqim)
fin.payment.received       (to'lov keldi)
hr.employee.created        (xodim yaratildi)
hr.payroll.period_closed   (maosh davri yopildi)
```

---

## 4. OUTBOX PATTERN (Event yo'qolmasin)

```typescript
// domain_events jadvali — barcha modul uchun bir jadval:
// (har event emit qilinganda outbox ga yoziladi)

// 1. Service da event emit:
@Injectable()
export class SdOrderService {
  async create(dto: CreateOrderDto): Promise<Result<SalesOrder>> {
    return await this.db.transaction(async (tx) => {
      // a) Asosiy yozuv:
      const [order] = await tx.insert(sales_orders).values(dto).returning();

      // b) Outbox ga yozish (bir tranzaksiyada!):
      await tx.insert(domain_events).values({
        event_type: 'sales_order.created',
        aggregate_id: order.id,
        payload: JSON.stringify(new SalesOrderCreatedEvent(order.id, ...)),
        status: 'PENDING',
      });

      return Ok(order);
    });
  }
}

// 2. Relay processor (5 sekund interval):
// apps/api/src/common/outbox/outbox-relay.service.ts
// → PENDING eventlarni EventEmitter2 ga uzatadi
// → PUBLISHED ga o'zgartiradi
// Idempotent: event listener uchun unikal event_id tekshirishi kerak
```

---

## 5. SHARED READ (Faqat o'qish qoidasi)

```typescript
// ✅ TO'G'RI — PP moduli SD jadvaldan o'qish:
// apps/api/src/modules/pp/infrastructure/repositories/pp-work-order.repository.ts
const salesOrder = await this.db
  .select({
    id: sales_orders.id,
    customer_id: sales_orders.customer_id,
    total_amount: sales_orders.total_amount,
  })
  .from(sales_orders)
  .where(eq(sales_orders.id, salesOrderId))
  .limit(1);

// ❌ TAQIQ — PP moduli SD jadvalga yozish:
await this.db.update(sales_orders)
  .set({ status: 'IN_PRODUCTION' })
  .where(eq(sales_orders.id, id));
// → SD moduli o'z jadvalini o'zi yangilaydi (event orqali!)
```

---

## 6. MODULAR IMPORT QOIDALARI (NestJS)

```typescript
// ✅ TO'G'RI — modul exports/imports:
// apps/api/src/modules/sd/sd.module.ts
@Module({
  imports: [
    DatabaseModule,             // shared DB
    EventEmitterModule,         // events
    // ❌ TAQIQ: import PpModule → circular dependency!
  ],
  providers: [
    SdOrderService,
    { provide: IOrderRepository, useClass: DrizzleOrderRepository },
  ],
  controllers: [SdOrderController],
  exports: [SdOrderService],    // faqat kerak bo'lsa export
})
export class SdModule {}

// ❌ TAQIQ — modul ichida boshqa modul import:
@Module({
  imports: [PpModule, WmsModule, FinModule], // → circular dependency!
})
export class SdModule {}
```

---

## 7. OLTIN ZANJIR EVENT OQIMI

```
SD (buyurtma) → PP (ishlanma) → MES (smena) → QC (sifat) → WMS (ombor) → FIN (hisob)

Har o'tish = event:
sd.sales_order.confirmed
  └→ [PP] work_order.created
         └→ [MES] session.started → session.completed
                   └→ [QC] inspection.created → inspection.passed/failed
                             └→ [WMS] stock.received (passed)
                             └→ [MES] rework.created (failed)
                                       └→ [FIN] entries (GL posting)

Har modul: faqat O'Z QISMI uchun javobgar.
SD — buyurtma holati.
PP — ishlanma holati.
MES — smena/sesiya holati.
QC — sifat holati.
WMS — ombor holati.
FIN — buxgalteriya yozuvi.
```

---

## 8. MODUL HOLAT TEKSHIRUVI (Pre-Sprint)

```bash
# Yangi modul yaratishdan oldin:
# 1. Bu modul qaysi jadvallarni egallaydi? → MODUL_SHARTNOMASI.md §2 yangilash
# 2. Bu modul qaysi eventlarni emit qiladi? → EVENT_KATALOGI.md yangilash
# 3. Bu modul qaysi eventlarni tinglaydi? → EVENT_KATALOGI.md yangilash
# 4. Bu modul qaysi jadvallardan o'qiydi (shared read)? → §5 qoidasini bajar

# Circular dependency tekshiruvi:
npx madge --circular apps/api/src/modules/

# Ruxsatsiz cross-modul import tekshiruvi:
node scripts/check-module-boundaries.mjs
# → "sd/application/... imports pp/application/... → TAQIQ!"
```

---

*EuroPrint ERP · Modul Shartnomasi · Versiya: 2026-06-18*
