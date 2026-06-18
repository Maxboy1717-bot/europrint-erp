# 12 — BOSQICH 9: AI / IoT PLATFORMASI

> OEE AI → anomaliya → talab prognozi → AI kamera → operator AI.
> **Holat: 🔲 ~20% mavjud** — IoT sensor qabul stub; AI servislar mostly mock; kamera no-op.
> Bog'liqlik: Bosqich 4 (MES) + Bosqich 5 (QC) + IoT hardware.

---

## 9.1 Kanonik jadvallar

```sql
iot_sensors          -- sensor ro'yxati (har mashina uchun)
iot_readings         -- sensor o'lchovlari (APPEND-ONLY, o'chirilmaydi)
iot_alerts           -- ogohlantirish yozuvi
ai_production_plans  -- AI tuzgan ishlab chiqarish reja
ai_demand_forecasts  -- talab prognozi
ai_camera_detections -- AI kamera topilmalar (APPEND-ONLY, QC §5.3 dan)
ai_chat_sessions     -- operator AI suhbati
ai_chat_messages     -- suhbat xabarlari
```

---

## 9.2 IoT Arxitekturasi

```
[Sensor/PLC] → MQTT yoki HTTP POST
                    ↓
           IoT Gateway (iot_readings append)
                    ↓
           Threshold Engine (real-time)
            ├── Normal → continue
            └── Anomaliya → IoTAnomalyDetectedEvent
                              ├── MES: work_order pause
                              ├── DIR: Andon signal
                              └── NTF: Push notification
```

```ts
// IoT Reading endpoint (POST /api/iot/readings):
@Post('readings')
@Public() // PUBLIC: IoT gateway — mTLS + IP whitelist bilan himoyalangan
async receiveReading(@Body() dto: IoTReadingDto) {
  // 1. Append-only yozuv:
  await this.db.insert(iotReadings).values({
    sensor_id: dto.sensorId,
    value: dto.value,
    unit: dto.unit,
    measured_at: new Date(dto.timestamp),
  });

  // 2. Sensor parametrlarini olish (cache da):
  const sensor = await this.sensorCache.get(dto.sensorId);

  // 3. Real-time anomaliya tekshiruvi:
  if (sensor && (dto.value > sensor.max_threshold || dto.value < sensor.min_threshold)) {
    await this.db.insert(iotAlerts).values({
      sensor_id: dto.sensorId, value: dto.value, alert_type: 'THRESHOLD',
    });
    await this.eventBus.publish(new IoTAnomalyDetectedEvent({
      sensorId: dto.sensorId, value: dto.value, workCenterId: sensor.work_center_id,
    }));
  }
}
```

---

## 9.3 AI Ishlab Chiqarish Rejalash (7-qadam)

Vizyon: buyurtma kelganda AI 7 qadam orqali reja tuzadi.

```ts
interface AiProductionPlan {
  step1_material_check: MaterialAvailability[];    // BOM → warehouse_stock
  step2_material_reserve: ReservationResult;       // materiallar rezerv
  step3_route_plan: RoutePlan[];                   // tech_card_routes → work_centers
  step4_capacity_check: CapacityResult;            // CRP: available vs required
  step5_schedule: WorkOrderSchedule[];             // work_orders jadval
  step6_worker_assignment: WorkerAssignment[];     // org_function moslik
  step7_approval_request: ApprovalRequest;         // menejer tasdig'ini kutish
}

// AI plan yaratish (SalesOrderConfirmedEvent dan):
async createAiPlan(orderId: number): Promise<Result<AiProductionPlan>> {
  const order = await this.sdService.getOrder(orderId);
  const techCard = await this.ppService.findTechCard(order.product_type);
  
  // 7 qadam ketma-ket:
  const matCheck = await this.checkMaterials(techCard.bom, order.quantity);
  if (!matCheck.sufficient) return Ok({ step1: matCheck, needsManualIntervention: true, ... });
  
  const reserve = await this.wmsService.reserveMaterials(matCheck.required);
  const route = await this.routePlanner.plan(techCard.routes, order.quantity);
  // ... boshqa qadamlar
  
  await this.db.insert(aiProductionPlans).values({ order_id: orderId, plan: fullPlan, status: 'PENDING_APPROVAL' });
  return Ok(fullPlan);
}
```

---

## 9.4 Talab Prognozi

```ts
// Har hafta ishga tushadi (yoki manual trigger):
async forecastDemand(horizonWeeks: number = 12): Promise<void> {
  // Tarixiy buyurtmalar:
  const history = await this.db.select().from(salesOrders)
    .where(gte(salesOrders.createdAt, subWeeks(new Date(), 52)));

  // Simple moving average (keyin ML modeli bilan almashtiriladi):
  const forecasts = this.calculateMovingAverage(history, horizonWeeks);

  for (const f of forecasts) {
    await this.db.insert(aiDemandForecasts).values({
      product_category: f.category,
      week_start: f.weekStart,
      predicted_quantity: f.quantity,
      confidence_pct: f.confidence,
      model_version: 'SMA-4w',
    });
  }
}
```

---

## 9.5 Operator AI Yordamchi (Chat)

```ts
// POST /api/ai/chat — operator savollariga javob:
async chat(userId: number, message: string): Promise<string> {
  // Kontekst: xodimning smena, work_order, OEE
  const context = await this.buildOperatorContext(userId);
  
  // Savollar: "Mashina qachon ta'mirlash kerak?", "Bugungi OEE qancha?", "Material yetarlimi?"
  const prompt = `
    Kontekst: ${JSON.stringify(context)}
    Savol: ${message}
    Faqat EuroPrint ERP ma'lumotlari asosida javob ber. Uzbek tilida.
  `;
  
  // AI javob (Claude API yoki boshqa LLM):
  return this.llmService.complete(prompt);
}
```

---

## 9.6 Acceptance kriterlari

```
☐ IoT sensor yozuvi (iot_readings APPEND-ONLY)
☐ Anomaliya tekshiruvi (threshold → iot_alerts + event)
☐ IoTAnomalyDetectedEvent → MES pause + DIR Andon + NTF (REAL, no-op emas)
☐ AI production plan yaratish (7 qadam, menejer tasdig'i bilan)
☐ Talab prognozi (SMA, haftalik)
☐ Operator AI chat (kontekstli javob)
☐ OEE real-time dashboard (10s interval)
☐ tsc 0 + test PASS
```

---

## 9.7 Ko'chiriladigan qismlar

| Qism | Holat |
|------|-------|
| `apps/api/src/modules/iot/` | ✅ threshold engine to'ldir |
| `lib/db/src/schema/iot-readings.ts` | ✅ ko'chir (APPEND-ONLY) |
| `lib/db/src/schema/ai-production-plans.ts` | 🔲 yangi |
| `lib/db/src/schema/ai-demand-forecasts.ts` | 🔲 yangi |
| `lib/db/src/schema/ai-chat-sessions.ts` | 🔲 yangi |
| AI 7-qadam planner | 🔲 yangi |
| Operator AI chat | 🔲 yangi |

---
*Keyingi: [13_Bosqich10_DIR.md](13_Bosqich10_DIR.md)*
