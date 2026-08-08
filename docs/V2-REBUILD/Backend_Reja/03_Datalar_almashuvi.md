# 03 — DATALAR ALMASHUVI (Event/Outbox/Sync)

> Modullar orasidagi muloqot arxitekturasi: event-driven + outbox pattern + golden thread.
> **Holat: 🔧 ~40%** — EventEmitter2 ishlaydi; outbox relay aktiv lekin domain_events=0; backbone link yo'q.
> Bu hujjatni CQRS/event yozishdan OLDIN o'qi.

---

## 3.1 Ikki xil event mexanizmi (MUHIM farq)

EuroPrint ikki alohida event kanalidan foydalanadi. Ular bir-birini AVTOMATIK olmaydi.

| Mexanizm | Qachon | Misol |
|----------|--------|-------|
| `EventEmitter2` string event | Modul ichida yoki yaqin modul orasida, tez | `'pos.movement.completed'` |
| CQRS `EventBus.publish()` | Domain aggregate event — audit log + outbox + saga | `new SalesOrderConfirmedEvent(...)` |

```ts
// ❌ XATO: string event + @EventsHandler — hech qachon yetib bormaydi
this.eventEmitter.emit('order.confirmed', data);
// ...boshqa joyda:
@EventsHandler(OrderConfirmedEvent) // CQRS handler string eventni olmaydi

// ✅ TO'G'RI 1: EventEmitter2 + @OnEvent (bir xil mexanizm)
this.eventEmitter.emit('order.confirmed', data);
@OnEvent('order.confirmed') async handle(data) { ... }

// ✅ TO'G'RI 2: CQRS EventBus + @EventsHandler (bir xil mexanizm)
this.eventBus.publish(new SalesOrderConfirmedEvent(orderId));
@EventsHandler(SalesOrderConfirmedEvent) async handle(event) { ... }
```

---

## 3.2 Outbox Pattern (domain_events jadvali)

Outbox — event yo'qolmasligini kafolatlaydi (at-least-once delivery).

```sql
-- Jadval: domain_events (kanonik, append-only)
id            UUID DEFAULT gen_random_uuid() PRIMARY KEY
aggregate_id  VARCHAR(50) NOT NULL   -- masalan: sales_order_id
event_type    VARCHAR(100) NOT NULL  -- masalan: 'SalesOrderConfirmed'
payload       JSONB NOT NULL
created_at    TIMESTAMPTZ DEFAULT now()
processed_at  TIMESTAMPTZ            -- relay tomonidan yangilanadi
retry_count   INTEGER DEFAULT 0
```

```ts
// Outbox yozish (aggregate ichida, transaction bilan birga):
await db.transaction(async (tx) => {
  await tx.insert(salesOrders).values(order);
  await tx.insert(domainEvents).values({
    aggregate_id: order.id.toString(),
    event_type: 'SalesOrderConfirmed',
    payload: { orderId: order.id, customerId: order.customerId, total: order.total },
  });
});

// Outbox relay (AiMesMonitorService emas — alohida OutboxRelayService):
@Cron('*/10 * * * * *') // 10 sekundda bir
async processOutbox() {
  const pending = await db.select().from(domainEvents)
    .where(isNull(domainEvents.processedAt)).limit(50);
  for (const event of pending) {
    await this.eventBus.publish(this.deserialize(event));
    await db.update(domainEvents).set({ processedAt: new Date() })
      .where(eq(domainEvents.id, event.id));
  }
}
```

**Qoida:** Outbox faqat `domain_events` ga real yozuv borligida yoqilsin.
Relay yozishdan OLDIN: `SELECT COUNT(*) FROM domain_events` > 0 bo'lishi kerak.

---

## 3.3 Domain Event katalogi (modul bo'yicha)

Har event uchun: emit qiluvchi modul → listener modul(lar).

| Event | Emit | Listener | Holat |
|-------|------|----------|-------|
| `SalesOrderConfirmedEvent` | SD | PP (plan), WMS (rezerv), FIN (debitorlik) | 🔲 YO'Q |
| `ProductionPlanCreatedEvent` | PP | MES (work_order), WMS (material chiqarish) | 🔲 YO'Q |
| `WorkOrderStartedEvent` | MES | IoT (monitoring boshlash), DIR (Andon) | 🔲 YO'Q |
| `WorkOrderCompletedEvent` | MES | QC (tekshiruv yaratish), WMS (tayyor mahsulot) | 🔧 STUB |
| `QcInspectionPassedEvent` | QC | WMS (tayyor mahsulot → ombor), FIN (tayyor tovar) | 🔲 YO'Q |
| `QcInspectionFailedEvent` | QC | MES (qayta ishlov), PP (reja tuzatish) | 🔲 YO'Q |
| `StockLevelCriticalEvent` | WMS | MM (xarid buyurtma), DIR (ogohlantirish) | 🔲 YO'Q |
| `PurchaseOrderReceivedEvent` | MM | WMS (qabul qilish), FIN (kreditorlik) | 🔲 YO'Q |
| `PosMovementCompletedEvent` | POS | WMS (warehouse_transactions), FIN (GL) | 🔧 ~50% |
| `PayrollClosedEvent` | HR | FIN (GL posting: ish haqi xarajati) | 🔲 YO'Q |
| `LeadConvertedEvent` | CRM | SD (taklif/buyurtma yaratish) | 🔲 YO'Q |
| `InvoiceCreatedEvent` | FIN | SD (hisob-faktura), NTF (xabar) | 🔲 YO'Q |
| `IoTAnomalyDetectedEvent` | IoT | MES (to'xtatish), DIR (Andon), NTF (xabar) | 🔧 STUB |

**Yangi event yozishdan OLDIN:**
```bash
# Listener bor-yo'qligini tekshir:
grep -rn "@OnEvent\|@EventsHandler" apps/api/src/ | grep "[event_name]"
# 0 natija = event befoyda — avval listener yoz
```

---

## 3.4 Oltin Zanjir (Golden Thread) — SD → PP → MES → QC → WMS → FIN

Backbone — barcha modulning asosi. Har bosqich avvalgiga bog'liq.

```
[Mijoz buyurtma beradi]
        ↓
SD: sales_orders (CONFIRMED)
        ↓ SalesOrderConfirmedEvent
PP: work_orders yaratiladi + material rezerv
        ↓ ProductionPlanCreatedEvent
MES: production_sessions + smena taqsimoti
        ↓ WorkOrderCompletedEvent
QC: quality_checks + tekshiruv
        ↓ QcInspectionPassedEvent
WMS: warehouse_transactions + warehouse_stock yangilanadi
        ↓ DeliveryReadyEvent
FIN: entries (debitorlik + daromad GL posting)
```

```bash
# Zanjir ishlashini tekshirish:
node scripts/golden-thread-chain-proof.cjs
# Har sprint yakunida majburiy.
```

---

## 3.5 Cross-module qoidalar

1. **Modul A modul B ning reposi/serviceni import qilmaydi.** Faqat event orqali muloqot.
2. **Sinxron so'rov** (bir modul ikkinchisidan ma'lumot kerak): `GET /api/[modul]/[resource]` HTTP — to'g'ridan import emas.
3. **Asinxron xabar** (bir voqea boshqa modulda harakat qilishi kerak): event + listener.
4. **Shared jadval** yo'q. Har modul o'z jadvallarini yozadi. Boshqa modulni o'qishi mumkin (JOIN), lekin yozmasligi kerak.
5. **Circular dependency** — NestJS da boot fail. Modul A → B va B → A bo'lmasligi kerak. `forwardRef()` = vaqtinchalik, arxitekturaviy muammo.

---

## 3.6 Acceptance kriterlari

```
☐ domain_events jadvali ilovada yoziladi (SalesOrderConfirmedEvent dan keyin COUNT > 0)
☐ Outbox relay processed_at yangilaydi
☐ SD→PP backbone ishlaydi (SalesOrderConfirmedEvent → work_order yaratiladi)
☐ WorkOrderCompletedEvent → QC quality_check yaratiladi
☐ QcInspectionPassedEvent → warehouse_stock yangilanadi
☐ golden-thread-chain-proof.cjs PASS
☐ tsc 0 + test PASS
```

---
*Keyingi: [04_Bosqich1_ORG_HR.md](04_Bosqich1_ORG_HR.md)*
