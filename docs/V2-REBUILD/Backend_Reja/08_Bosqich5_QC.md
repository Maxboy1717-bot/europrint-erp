# 08 — BOSQICH 5: SIFAT NAZORATI (QC)

> MES yakunidan keyin sifat tekshiruvi → AI kamera → defekt katalogi → qayta ishlov.
> **Holat: 🔧 ~40% mavjud** — quality_checks/defect_reports mavjud; AI kamera stub; MES→QC handoff no-op.
> Bog'liqlik: Bosqich 4 (MES) + `WorkOrderCompletedEvent` listener.

---

## 5.1 Kanonik jadvallar

```sql
quality_checks       -- tekshiruv yozuvi (work_order ga bog'liq)
quality_check_items  -- har nuqta (checkpoint) natijasi
defect_reports       -- aniqlangan kamchiliklar
defect_catalog       -- defekt turlari lug'at (lookup)
qc_parameters        -- texkarta bo'yicha tekshiruv mezonlari
ai_camera_detections -- AI kamera topilmalar (append-only)
```

---

## 5.2 QC Oqimi

```
MES: WorkOrderCompletedEvent
    ↓ QcMesCompletedListener
QC: quality_check yaratiladi (status=PENDING)
    ↓ AI kamera YOKI manual tekshiruv
QC: quality_check_items yoziladi (har checkpoint)
    ↓
QC: natija → PASS yoki FAIL
    ├── PASS → QcInspectionPassedEvent (→ WMS)
    └── FAIL → QcInspectionFailedEvent (→ MES qayta, defect_report)
```

```ts
// MES→QC Listener (REAL, stub emas):
@OnEvent('mes.work_order.completed')
async handleMesCompleted(event: WorkOrderCompletedEvent): Promise<void> {
  const card = await this.technologyCardRepo.findById(event.technologyCardId);
  const parameters = await this.qcParameterRepo.findByCardId(event.technologyCardId);
  
  const check = await this.db.insert(qualityChecks).values({
    work_order_id: event.workOrderId,
    technology_card_id: event.technologyCardId,
    quantity_to_check: event.quantityProduced,
    status: 'PENDING',
    parameters_snapshot: parameters,
  }).returning();

  await this.eventBus.publish(new QcCheckCreatedEvent(check[0].id));
}
```

---

## 5.3 AI Kamera Integratsiya

AI kamera `POST /api/iot/camera/detection` ga natija yuboradi.

```ts
// Camera detection endpoint (POST /api/iot/camera/detection):
@Post('detection')
@Public() // PUBLIC: kamera webhook — IP whitelist + kamera token bilan himoyalangan
async receiveDetection(@Body() dto: CameraDetectionDto) {
  // 1. Append-only yozuv:
  await this.db.insert(aiCameraDetections).values({
    camera_id: dto.cameraId,
    work_order_id: dto.workOrderId,
    defect_type: dto.defectType,
    confidence: dto.confidence,
    image_url: dto.imageUrl,
    detected_at: new Date(dto.timestamp),
  });

  // 2. Defect threshold tekshiruvi:
  if (dto.confidence >= AI_CAMERA_MIN_CONFIDENCE) {
    await this.defectReportService.create({
      workOrderId: dto.workOrderId,
      source: 'AI_CAMERA',
      defectCatalogId: dto.defectCatalogId,
      quantity: 1,
      imageUrl: dto.imageUrl,
    });
  }
}
```

---

## 5.4 Defekt Katalogi (Lookup jadval)

```ts
// defect_catalog: Lookup jadval (o'zgarmaydi, seed bilan to'ldiriladi)
// EuroPrint gofra/offset spesifik defektlar:
const defects = [
  { code: 'DEF-001', name_uz: 'Bosma siljishi', category: 'PRINT', severity: 'MAJOR' },
  { code: 'DEF-002', name_uz: 'Rang farqi', category: 'PRINT', severity: 'MINOR' },
  { code: 'DEF-003', name_uz: 'Kesim notogri', category: 'CUTTING', severity: 'MAJOR' },
  { code: 'DEF-004', name_uz: 'Gofra sinishi', category: 'MATERIAL', severity: 'CRITICAL' },
  { code: 'DEF-005', name_uz: 'Yopishtiruv yetishmasligi', category: 'GLUING', severity: 'MAJOR' },
  // ... (migration faylda to'liq ro'yxat)
];
```

---

## 5.5 QC Parametrlari (texkartaga bog'liq)

```sql
-- qc_parameters:
technology_card_id  INTEGER REFERENCES technology_cards(id)
parameter_name      VARCHAR(100)   -- masalan: 'print_color_delta', 'cut_tolerance_mm'
min_value           NUMERIC(10,4)
max_value           NUMERIC(10,4)
unit                VARCHAR(20)    -- masalan: 'mm', 'dE', '%'
is_critical         BOOLEAN DEFAULT FALSE  -- critical fail = REJECT
```

---

## 5.6 Acceptance kriterlari

```
☐ WorkOrderCompletedEvent → quality_check PENDING yaratiladi (REAL, stub emas)
☐ Manual tekshiruv: inspector quality_check_items to'ldiradi
☐ AI kamera detection endpoint ishlaydi (append + defect_report)
☐ PASS → QcInspectionPassedEvent (→ WMS tayyor mahsulot)
☐ FAIL → QcInspectionFailedEvent (→ MES + defect_report)
☐ Defekt katalogi seedi mavjud (gofra/offset spesifik)
☐ QC dashboard: pending/passed/failed stats
☐ tsc 0 + test PASS
```

---

## 5.7 Ko'chiriladigan qismlar

| Qism | Holat |
|------|-------|
| `apps/api/src/modules/qc/` | ✅ asosini ko'chir, MES listener to'ldir |
| `lib/db/src/schema/quality-checks.ts` | ✅ ko'chir |
| `lib/db/src/schema/defect-reports.ts` | ✅ ko'chir |
| `lib/db/src/schema/defect-catalog.ts` | 🔲 yaratish + seed kerak |
| `lib/db/src/schema/ai-camera-detections.ts` | 🔲 yaratish |
| `qc_parameters` jadval + seed | 🔲 yangi |
| AI kamera webhook endpoint | 🔲 yangi |

---
*Keyingi: [09_Bosqich6_WMS.md](09_Bosqich6_WMS.md)*
