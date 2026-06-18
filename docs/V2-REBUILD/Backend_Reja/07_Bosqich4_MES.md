# 07 — BOSQICH 4: ISHLAB CHIQARISH IJROSI (MES)

> Smena → work_order ijro → IoT kuzatuv → OEE → AI anomaliya.
> **Holat: 🔧 ~50% mavjud** — work_orders/shifts mavjud; IoT mostly stub; OEE hisob qisman.
> Bog'liqlik: Bosqich 3 (PP) + `work_centers` kanonik.

---

## 4.1 Kanonik jadvallar

```sql
work_orders          -- ishlab chiqarish buyurtmasi (PP dan keladi)
production_sessions  -- smena ichidagi ijro sessiyasi
mes_operations       -- har operatsiya yozuvi (tact time, qty, reject)
shift_schedules      -- smena jadvali (reja)
shift_handovers      -- smena topshiruvi (asl jadval) ← KANONIK
mes_shift_handovers  -- VIEW over shift_handovers (faqat o'qish!)
equipment            -- mashina/uskunalar (id, code, work_center_id)
maintenance_requests -- ta'mirlash so'rovi
iot_sensors          -- sensor ro'yxati
iot_readings         -- sensor o'lchovlari (append-only)
iot_alerts           -- IoT ogohlantirishlari
```

⚠️ `mes_shift_handovers` = VIEW. Unga `INSERT/UPDATE/ALTER` TAQIQ. Yozuv `shift_handovers` ga.
⚠️ `work_centers` kanonik. `pp_work_centers` = ❌DEPRECATED.

---

## 4.2 Work Order oqimi

```
PP: ProductionPlanCreatedEvent
    ↓
MES: work_order yaratiladi (status=PLANNED)
    ↓ smena tayinlanadi
MES: work_order status → IN_PROGRESS
    ↓ WorkOrderStartedEvent emit
IoT: sensors monitoring boshlaydi
MES: production_sessions yoziladi (har operatsiya)
    ↓
MES: work_order status → COMPLETED
    ↓ WorkOrderCompletedEvent emit → QC
QC: quality_check yaratiladi
```

```ts
// Work order holati (status enum):
type WorkOrderStatus = 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// WorkOrderCompletedEvent:
export class WorkOrderCompletedEvent {
  constructor(
    public readonly workOrderId: number,
    public readonly technologyCardId: number,
    public readonly quantityProduced: number,
    public readonly quantityRejected: number,
    public readonly shiftId: number,
    public readonly completedAt: Date,
  ) {}
}
```

---

## 4.3 OEE Hisoblash

OEE = Mavjudlik × Unumdorlik × Sifat

```ts
// OEE formula (work_centers.efficiency_rate = 0.85 mavjud)
interface OeeResult {
  availability: number;  // (actual_runtime / planned_runtime) * 100
  performance: number;   // (actual_output / ideal_output) * 100
  quality: number;       // (good_qty / total_qty) * 100
  oee: number;           // availability * performance * quality / 10000
}

function calcOee(session: ProductionSession, workCenter: WorkCenter): OeeResult {
  const availability = (session.actual_runtime_min / session.planned_runtime_min) * 100;
  const idealOutput = (session.planned_runtime_min / workCenter.cycle_time_min);
  const performance = (session.quantity_produced / idealOutput) * 100;
  const quality = session.quantity_produced > 0
    ? ((session.quantity_produced - session.quantity_rejected) / session.quantity_produced) * 100
    : 0;
  return { availability, performance, quality, oee: (availability * performance * quality) / 10000 };
}
```

---

## 4.4 Smena Topshiruvi (Shift Handover)

```ts
// shift_handovers (KANONIK jadval):
// ✅ INSERT → shift_handovers
await db.insert(shiftHandovers).values({
  shift_id: dto.shiftId,
  outgoing_shift_leader_id: user.id,
  incoming_shift_leader_id: dto.incomingLeaderId,
  equipment_status: dto.equipmentStatus,
  pending_issues: dto.pendingIssues,
  notes: dto.notes,
});

// ✅ SELECT → mes_shift_handovers (VIEW — qo'shimcha computed fields bilan)
const handovers = await db.select().from(mesShiftHandovers)
  .where(eq(mesShiftHandovers.shiftId, shiftId));
```

---

## 4.5 IoT Integratsiya

```ts
// IoT Reading (append-only — o'chirilmaydi):
await db.insert(iotReadings).values({
  sensor_id: payload.sensorId,
  value: payload.value,
  unit: payload.unit,
  measured_at: new Date(payload.timestamp),
});

// Anomaliya tekshiruvi (threshold):
if (payload.value > sensor.max_threshold || payload.value < sensor.min_threshold) {
  await this.eventBus.publish(new IoTAnomalyDetectedEvent({
    sensorId: payload.sensorId,
    value: payload.value,
    threshold: { min: sensor.min_threshold, max: sensor.max_threshold },
    workCenterId: sensor.work_center_id,
  }));
  await db.insert(iotAlerts).values({ sensor_id: payload.sensorId, value: payload.value, alert_type: 'THRESHOLD' });
}

// Listener (MES):
@OnEvent('iot.anomaly.detected')
async handleAnomaly(event: IoTAnomalyDetectedEvent) {
  // ⚠️ Bu STUB emas — real harakat:
  await this.workOrderService.pauseByWorkCenter(event.workCenterId);
  await this.notificationService.sendAlert(event);
}
```

---

## 4.6 Operator Tablet Interface

- URL: `/tablet` — alohida route, token bilan himoyalangan
- Har operator ko'radi: o'z smenasi, tayinlangan work_order lar, operatsiya vaqtlari
- Input: skanerlangan lot kodi yoki manual qty kiritish
- Avtomatik: production_session yoziladi, work_order progress yangilanadi

---

## 4.7 Acceptance kriterlari

```
☐ Work order yaratish (PP dan SalesOrderConfirmedEvent orqali)
☐ Smena jadvali + tayinlash
☐ Production session yozuvi (har operatsiya)
☐ OEE real-time hisoblash (smena yakuni da)
☐ Shift handover → shift_handovers INSERT (mes_shift_handovers = VIEW)
☐ IoT sensor o'qish → iot_readings append
☐ Anomaliya → iot_alerts + notification + work_order pause
☐ WorkOrderCompletedEvent → QC quality_check yaratiladi
☐ Operator tablet CRUD ishlaydi
☐ tsc 0 + test PASS
```

---

## 4.8 Ko'chiriladigan qismlar

| Qism | Holat |
|------|-------|
| `apps/api/src/modules/mes/` | ✅ asosini ko'chir, stub larni to'ldir |
| `lib/db/src/schema/work-orders.ts` | ✅ ko'chir |
| `lib/db/src/schema/production-sessions.ts` | ✅ ko'chir |
| `lib/db/src/schema/shift-handovers.ts` | ✅ ko'chir (VIEW alias bilan) |
| `lib/db/src/schema/iot-sensors.ts` | ✅ ko'chir |
| `lib/db/src/schema/iot-readings.ts` | ✅ ko'chir (append-only) |
| OEE real-time endpoint | 🔲 yangi |
| Operator tablet FE | 🔲 yangi |

---
*Keyingi: [08_Bosqich5_QC.md](08_Bosqich5_QC.md)*
