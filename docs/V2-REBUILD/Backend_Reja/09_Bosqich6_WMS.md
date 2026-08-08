# 09 — BOSQICH 6: OMBOR VA POS (WMS)

> Material qabul → ombor harakati → lot kuzatuv → POS → tayyorlanma chiqarish.
> **Holat: 🔧 ~55% mavjud** — warehouse_stock kanonik; POS sync tuzatilgan; lot tracking stub.
> Bog'liqlik: Bosqich 2 (SD), Bosqich 3 (PP) material rezerv, Bosqich 5 (QC) tayyor mahsulot.

---

## 6.1 Kanonik jadvallar

```sql
warehouse_stock      -- KANONIK qoldiq (VIEW current_stock shu ustidan) ← YAGONA YOZUV JOYI
warehouse_transactions -- harakat yozuvi (append-only, kirim/chiqim/transfer)
warehouse_locations  -- joy/katak (A1, B2, ...)
lot_tracking         -- lot/batch kuzatuv (qabul → ishlab chiqarish → sotish)
material_reservations -- material rezerv (PP buyurtmasi uchun)
pos_movements        -- POS harakat yozuvi
```

⚠️ `stocks` = ❌ WMS receiveFg noto'g'ri shu jadvalga yozgan edi. TEGMA.
⚠️ `wms_stock` = ❌ DEPRECATED stub. TEGMA.
⚠️ `current_stock` = VIEW over `warehouse_stock`. Unga INSERT/UPDATE TAQIQ.

---

## 6.2 Stock yozuvi — yagona joy

```ts
// ✅ BITTA yozuv joyi: warehouse_stock (upsert pattern)
async adjustStock(dto: StockAdjustDto, tx: DbTransaction): Promise<void> {
  // 1. Harakat yozuvi (append-only):
  await tx.insert(warehouseTransactions).values({
    material_id: dto.materialId,
    location_id: dto.locationId,
    transaction_type: dto.type,  // 'RECEIPT'|'ISSUE'|'TRANSFER'|'ADJUSTMENT'
    quantity: dto.quantity,
    unit: dto.unit,
    reference_type: dto.refType,
    reference_id: dto.refId,
    created_by: dto.userId,
  });

  // 2. Balans yangilash (upsert):
  await tx.insert(warehouseStock).values({
    material_id: dto.materialId,
    location_id: dto.locationId,
    quantity: dto.quantity,
    unit: dto.unit,
  }).onConflictDoUpdate({
    target: [warehouseStock.materialId, warehouseStock.locationId],
    set: { quantity: sql`warehouse_stock.quantity + ${dto.quantity}` },
  });
}

// ❌ XATO: stocks yoki wms_stock ga yozish
// ❌ XATO: current_stock ga INSERT (u VIEW)
```

---

## 6.3 Material Qabul oqimi (MM → WMS)

```
MM: PurchaseOrderReceivedEvent (yetkazuvchi qabul qilindi)
    ↓ WmsReceiptListener
WMS: warehouse_transactions (RECEIPT) + warehouse_stock upsert
    ↓
WMS: lot_tracking yaratiladi (LOT nomi = PO nomi + sana)
    ↓
FIN: kreditorlik GL entry (PurchaseOrderReceivedEvent → FIN listener)
```

---

## 6.4 Material Chiqarish (PP rezerv → ishlab chiqarish)

```ts
// PP dan material rezerv so'rovi:
async reserveMaterials(workOrderId: number, bom: BomLine[]): Promise<Result<void>> {
  return this.db.transaction(async (tx) => {
    for (const line of bom) {
      const stock = await tx.select().from(warehouseStock)
        .where(eq(warehouseStock.materialId, line.materialId)).for('update');

      if (!stock[0] || stock[0].quantity < line.quantity) {
        return Err(`Material yetarli emas: ${line.materialId}`);
      }

      await tx.insert(materialReservations).values({
        work_order_id: workOrderId,
        material_id: line.materialId,
        quantity: line.quantity,
        status: 'RESERVED',
      });
    }
    return Ok(undefined);
  });
}
```

---

## 6.5 POS → WMS Sync (tuzatilgan)

POS harakatlar `warehouse_transactions` ga yoziladi, `warehouse_stock` upsert bilan yangilanadi.

```ts
// POS movement event handler:
@OnEvent('pos.movement.completed')
async handlePosMovement(event: PosMovementCompletedEvent): Promise<void> {
  // transaction_type map (hardcoded string emas):
  const TYPE_MAP: Record<string, 'ISSUE' | 'RECEIPT'> = {
    sell: 'ISSUE',
    return: 'RECEIPT',
    receive: 'RECEIPT',
    adjustment: 'ADJUSTMENT',
  };

  const txType = TYPE_MAP[event.movementType];
  if (!txType) {
    this.logger.error(`Noma'lum POS movement type: ${event.movementType}`);
    return;
  }

  const qty = txType === 'ISSUE' ? -Math.abs(event.quantity) : Math.abs(event.quantity);
  await this.adjustStock({ materialId: event.materialId, quantity: qty, type: txType, ... }, this.db);
}
```

---

## 6.6 Lot Kuzatuv

```sql
-- lot_tracking:
id            SERIAL PRIMARY KEY
lot_number    VARCHAR(50) UNIQUE NOT NULL   -- 'LOT-2026-06-18-001'
material_id   INTEGER REFERENCES material_cards(id)
quantity      NUMERIC(15,4) NOT NULL
unit          VARCHAR(20)
received_at   TIMESTAMPTZ DEFAULT now()
expires_at    TIMESTAMPTZ
source_type   VARCHAR(50)   -- 'PURCHASE_ORDER'|'PRODUCTION'|'RETURN'
source_id     INTEGER
status        VARCHAR(20) DEFAULT 'ACTIVE'  -- 'ACTIVE'|'CONSUMED'|'EXPIRED'
```

---

## 6.7 Acceptance kriterlari

```
☐ Material qabul → warehouse_transactions RECEIPT + warehouse_stock upsert
☐ Material rezerv (work_order uchun) — pessimistic lock
☐ Tayyor mahsulot (QcInspectionPassedEvent → warehouse_stock)
☐ POS harakatlar → warehouse_transactions + warehouse_stock (TYPE_MAP bilan)
☐ current_stock VIEW = warehouse_stock real-time qoldig'ini ko'rsatadi
☐ Lot tracking: qabul → ishlab chiqarish → chiqarish zanjiri
☐ Minimum stock ogohlantirish (StockLevelCriticalEvent)
☐ Ombor hisoboti: balans, harakat tarixi, lot bo'yicha
☐ tsc 0 + test PASS
```

---

## 6.8 Ko'chiriladigan qismlar

| Qism | Holat |
|------|-------|
| `apps/api/src/modules/wms/` | ✅ ko'chir, POS listener tuzatilgan |
| `lib/db/src/schema/warehouse-stock.ts` | ✅ ko'chir |
| `lib/db/src/schema/warehouse-transactions.ts` | ✅ ko'chir (append-only) |
| `lib/db/src/schema/material-reservations.ts` | 🔧 yaratish kerak |
| `lib/db/src/schema/lot-tracking.ts` | 🔲 yangi |
| Lot tracking CRUD | 🔲 yangi |

---
*Keyingi: [10_Bosqich7_FIN.md](10_Bosqich7_FIN.md)*
