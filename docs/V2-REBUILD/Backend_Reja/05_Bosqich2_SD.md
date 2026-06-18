# 05 — BOSQICH 2: SAVDO (SD)

> Buyurtma → narxlash → faktura → to'lov. EuroPrint'ning oltin zanjiri boshi.
> **Holat: 🔧 ~65% mavjud** — CRUD ishlaydi, AI narxlash va CRM integratsiya kerak.
> Bog'liqlik: Bosqich 1 (Org/HR) tayyor.

---

## 2.1 Kanonik jadvallar

```sql
sales_orders          -- kanonik buyurtma (sd_sales_orders = VIEW)
sales_order_items     -- buyurtma qatorlari
sd_customers          -- mijoz (customers → sd_customers uylashtirish)
sd_order_departments  -- buyurtma bo'lim taqsimoti
ow_cliches            -- klishe bog'lanish
ow_material_requirements  -- material talab
ow_molds              -- qolip
ow_shipping_requests  -- yetkazib berish
ow_tech_cards         -- uuid (two-world, keyingi sprint)
```

---

## 2.2 Savdo oqimi

```
Yangi mijoz (sd_customers) →
  Narxlash (manual + AI tavsiya) →
  Buyurtma (sales_orders, status: draft) →
  Buyurtma elementlari (sales_order_items) →
  Tasdiqlash (confirmed) →
  PP'ga uzatish (OrderCreatedEvent) →
  Faktura (entries + AR) →
  To'lov (entries) →
  Yopish (done)
```

---

## 2.3 Domain events (SD → PP ko'prigi)

```ts
class SalesOrderConfirmedEvent implements DomainEvent {
  readonly type = 'sales_order.confirmed';
  constructor(
    public readonly orderId: number,
    public readonly customerId: number,
    public readonly items: { materialId: number; qty: number; techCardId?: number }[],
    public readonly deliveryDate: Date,
  ) {}
}
```

Listener: PP'da `@OnEvent('sales_order.confirmed')` → MPS yig'ish.

---

## 2.4 AI narxlash (vizyon)

```ts
// Gemini API + tarixiy narxlar + material tannarx:
async suggestPrice(dto: { materialId: number; qty: number; techCardId?: number }): Promise<Result<PriceSuggestion, AppError>> {
  // 1. Material tannarxi (warehouse_stock + material_cards.cost)
  // 2. Ishlab chiqarish vaqti (technology_cards.routes → work_centers.hourly_rate)
  // 3. Tarixiy o'xshash buyurtmalar
  // 4. Gemini API → tavsiya narx + asoslama
  // 5. Inson tasdig'i (E1)
}
```

---

## 2.5 Acceptance kriterlari

```
☐ Mijoz CRUD (sd_customers)
☐ Buyurtma yaratish/tasdiqlash/bekor qilish
☐ Buyurtma elementlari bilan
☐ OrderConfirmedEvent → PP ga uzatiladi
☐ Faktura chiqarish (entries INSERT)
☐ AI narx tavsiya (inson tasdig'i bilan)
☐ tsc 0 + test PASS
```

---

## 2.6 Ko'chiriladigan qismlar

| | Holat |
|-|-------|
| `apps/api/src/modules/sd/` | ✅ ko'chir |
| `apps/api/src/modules/sales/` | ✅ ko'chir |
| `lib/db/src/schema/sales-orders.ts` | ✅ ko'chir |
| `lib/db/src/schema/sd-customers.ts` | ✅ ko'chir |
| AI narxlash | 🔲 yangi |

---
*Keyingi: [06_Bosqich3_PP.md](06_Bosqich3_PP.md)*
