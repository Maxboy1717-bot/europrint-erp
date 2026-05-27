# Audit: 02 — POS Sotuv Oqimi Trace

**Sana:** 2026-05-25  
**Auditor:** Claude (avtomatik)  
**Usul:** Fayl-satr darajasida kod trace, DB write tasdiqlangan

---

## 1. Frontend: Savat va Checkout

**Fayl:** `artifacts/erp-dashboard/src/pages/POSDashboard.tsx:113–175`

```ts
// Online holatda mutation
const saleMutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/pos/sales", data),
  ...
});

// Checkout handler
async function handleConfirmPayment() {
  if (!isOnline) {
    // Offline: Dexie'ga saqlaydi
    const localId = await saveOfflineSale({ items, paymentMethod, ... });
    return;
  }
  // Online: to'g'ridan-to'g'ri serverga
  saleMutation.mutate({
    items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
    paymentMethod,
    customerName,
    discountAmount,
  });
}
```

**Verdikt:** ISHLAYDI  
**Sabab:** Online rejimda `POST /api/pos/sales` chaqiriladi. Offline rejimda Dexie'ga yoziladi va keyinchalik sync bo'ladi. Ikkala yo'l ham to'liq.

**Savat komponenti:** `artifacts/erp-dashboard/src/components/pos/CartPanel.tsx` — faqat UI, state parent'da.  
**To'lov paneli:** `artifacts/erp-dashboard/src/components/pos/PaymentPanel.tsx` — `onComplete` callback orqali `handleConfirmPayment` chaqiriladi.

---

## 2. Offline Dexie

**Fayl:** `artifacts/erp-dashboard/src/lib/pos-db.ts`

```ts
export class PosDatabase extends Dexie {
  products!: Table<OfflinePosProduct, number>;
  pendingSales!: Table<OfflinePendingSale, number>;
  syncMeta!: Table<OfflineSyncMeta, string>;
  // version(1) va version(2) chain mavjud
}

export async function savePendingSale(sale) {
  return posDb.pendingSales.add(sale);  // IndexedDB'ga yozadi
}

export async function decreaseLocalStock(productId, quantity) {
  // Mahalliy cache'da stokni kamaytiradi
  await posDb.products.update(productId, { stockQuantity: newQty });
}
```

**Verdikt:** ISHLAYDI  
**Sabab:** `OfflinePendingSale` interface to'liq: `localId`, `items`, `status ("pending"|"syncing"|"synced"|"failed")`, `cartSnapshot`. Dexie version migration zanjiri to'g'ri tuzilgan (v1 va v2).

**Sync fayl:** `artifacts/erp-dashboard/src/lib/pos-sync.ts:56`
```ts
const result = await apiRequest<{ saleNumber: string }>(
  "POST", "/api/pos/sales", {
    items: sale.items,
    paymentMethod: sale.paymentMethod,
    customerName: sale.customerName,
    discountAmount: sale.discountAmount,
    offlineLocalId: sale.localId,
    offlineCreatedAt: new Date(sale.createdAt).toISOString(),
  }
);
```
Sync ham `POST /api/pos/sales` ga boradi — xuddi online yo'l bilan bir xil endpoint.

**Hook:** `artifacts/erp-dashboard/src/hooks/use-pos-offline.ts` — `window` `online`/`offline` eventlarini kuzatadi, online bo'lganda 1.5 sek kechikish bilan `syncPendingSales()` chaqiradi.

---

## 3. Backend Controller(lar)

### PosStubController — asosiy sotuv yo'li
**Fayl:** `apps/api/src/modules/pos/presentation/pos-stub.controller.ts:98–108`

```ts
@Post('sales')
@Controller('pos')
async createSale(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
  const dto = adaptLegacySale(body);   // Zod validatsiya + mapping
  const cashierId = user?.id !== undefined ? String(user.id) : undefined;
  const sale = unwrapOrInternal(
    await this.cashRegisterService.createTransaction(dto, cashierId)
  );
  const saleNumber = sale.transactionNumber ?? sale.id ?? `POS-${Date.now()}`;
  return { saleNumber, sale };
}
```

**Verdikt:** REAL (DB write bor)  
**Sabab:** `CashRegisterService.createTransaction()` ga delegatsiya qiladi — bu servis haqiqiy DB INSERT bajaradi. `Date.now()` faqat fallback saleNumber uchun (tranzaksiya yaratilgan bo'lsa), DB'ga yozuvga ta'sir qilmaydi.

### CashRegisterController — kanonik endpoint
**Fayl:** `apps/api/src/modules/pos/presentation/cash-register.controller.ts:60–67`

```ts
@Post('transactions')
@Controller('pos')
async createTransaction(@Body() body: PosCreateTransactionDto, @CurrentUser() user) {
  return unwrapOrInternal(
    await this.svc.createTransaction(body, String(user.id))
  );
}
```

**Verdikt:** REAL (DB write bor)  
**Sabab:** `CashRegisterService.createTransaction()` bir xil servisga boradi.

### Legacy Inventory Adjust — NOOP shim
**Fayl:** `apps/api/src/modules/pos/presentation/pos-stub.controller.ts:129–134`

```ts
@Patch('inventory/:productId/adjust')
adjustInventory(@Param('productId') productId: string, @Body() body: unknown) {
  const dto = AdjustInventorySchema.parse(body);
  return { productId, adjusted: true, ...dto };  // DB write YO'Q
}
```

**Verdikt:** STUB (DB write yo'q)  
**Sabab:** Payload'ni echo qiladi, hech narsa saqlamaydi. Comment'da `TODO P3-26: migrate to /pos-v2/inventory` deyilgan. Ammo bu asosiy sotuv oqimiga ta'sir qilmaydi.

---

## 4. Repository — DB Write

**Fayl:** `apps/api/src/modules/pos/infrastructure/repositories/cash-register.repository.ts:143–171`

```ts
async insertTransaction(data: CreateTransactionInput, cashierId?: string): Promise<Result<RetailTransaction>> {
  return safeCall(async () => {
    const txNum = `TXN-${year}${month}${day}-${createId().slice(0,6).toUpperCase()}`;
    const rows = await db.insert(retail_pos_transactions).values({
      transaction_number: txNum,
      receipt_number:     receiptNum,
      cashier_id:         cashierId ?? data.cashierId ?? null,
      items:              data.items,        // JSONB
      subtotal:           String(data.subtotal),
      discount_amount:    String(data.discountAmount ?? 0),
      tax_rate:           String(data.taxRate ?? 12),
      tax_amount:         String(data.taxAmount ?? 0),
      total_amount:       String(data.totalAmount),
      payment_method:     data.paymentMethod,
      status:             'completed',
    }).returning();
    return rows[0];
  });
}
```

**Verdikt:** REAL — Drizzle ORM `.insert().returning()` — PostgreSQL'ga yoziladi va yangi row qaytariladi.

**Stock decrement:**

```ts
// cash-register.service.ts:139-141
for (const item of dto.items) {
  await this.repo.decrementStock(item.productId, item.quantity);
}
```

**Fayl:** `apps/api/src/modules/pos/infrastructure/repositories/cash-register.repository.ts:247–257`
```ts
async decrementStock(productId: string, quantity: number) {
  await db.update(retail_pos_products)
    .set({ stock_quantity: sql`GREATEST(0, stock_quantity::numeric - ${quantity})` })
    .where(eq(retail_pos_products.id, productId));
}
```

**Verdikt:** REAL — `GREATEST(0, ...)` — stok manfiyga tushmaydi. Tranzaksiya insertdan keyin loop'da bajariladi.

---

## 5. POS Schema

**Fayl:** `lib/db/src/schema/pos-retail.ts`

### retail_pos_products
```ts
unit_price:     decimal("unit_price", { precision: 18, scale: 2 }).notNull().default("0"),
stock_quantity: decimal("stock_quantity", { precision: 12, scale: 3 }).default("0"),
min_stock:      decimal("min_stock", { precision: 12, scale: 3 }).default("0"),
```

**Verdikt:** `decimal` ishlatilgan — pul summalari uchun to'g'ri. `doublePrecision` yo'q (floating-point xatosi xavfi yo'q).

### retail_pos_transactions
```ts
subtotal:        decimal("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
discount_amount: decimal("discount_amount", { precision: 18, scale: 2 }).default("0"),
tax_rate:        decimal("tax_rate", { precision: 5, scale: 2 }).default("12"),
tax_amount:      decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
total_amount:    decimal("total_amount", { precision: 18, scale: 2 }).notNull().default("0"),
```

**Verdikt:** Barcha pul ustunlari `decimal(18,2)` — to'g'ri. CHECK constraint'lar mavjud:
- `payment_method IN ('cash','card','transfer','mixed')`
- `status IN ('completed','refunded','pending')`
- `subtotal >= 0`, `total_amount >= 0`

**Kichik muammo:** Repository'da pul summalari `String(data.subtotal)` sifatida uzatiladi. Drizzle decimal ustunini string sifatida qabul qiladi va PostgreSQL to'g'ri cast qiladi — amalda ishlaydi. Ammo servis darajasida type safety zaif.

---

## 6. Stock Decrement

**To'liq oqim:**

1. `createTransaction()` — `cash-register.service.ts:107`
2. Har bir item uchun `repo.findProductById()` — narx olish
3. `repo.insertTransaction()` — DB'ga sotuv yoziladi
4. Loop: `repo.decrementStock(item.productId, item.quantity)` — har mahsulot uchun stock kamayadi

**MUAMMO — P1:** Stock decrement tranzaksiya ichida emas. Agar 3-item decrementda xato bo'lsa yoki server tushib qolsa, `retail_pos_transactions`'da "completed" row bo'lib qoladi, lekin stok to'liq kamaytirilmaydi. PostgreSQL `BEGIN/COMMIT` bloki yo'q.

**Refund da stock qaytish:** `incrementStock()` mavjud va ishlaydi (`cash-register.service.ts:167`).

---

## Oqim Xulosasi

| Qadam | Holat | Muammo |
|---|---|---|
| Savat (CartPanel) | ISHLAYDI | — |
| Checkout button (PaymentPanel) | ISHLAYDI | — |
| Online: POST /api/pos/sales | ISHLAYDI | — |
| Offline: Dexie'ga saqlash | ISHLAYDI | — |
| Offline sync (pos-sync.ts) | ISHLAYDI | — |
| PosStubController.createSale | REAL | `Date.now()` faqat fallback label |
| CashRegisterService.createTransaction | REAL | — |
| CashRegisterRepository.insertTransaction | REAL (DB INSERT) | — |
| retail_pos_transactions tablega yozuv | TASDIQLANGAN | — |
| Stock decrement (decrementStock) | REAL | P1: DB transaction yo'q |
| Schema (decimal) | TO'G'RI | String cast zaif |
| /pos/inventory/:id/adjust | STUB | Legacy noop, P3-26 |
| GET /pos/sales/daily | HTTP 501 | Intentional, notImplemented() |
| GET /pos/inventory/low-stock | HTTP 501 | Intentional, notImplemented() |

---

## P0 Topilmalar

**Yo'q.** Sotuv haqiqatan PostgreSQL'ga yoziladi. `PosStubController` dastlab stub edi, keyinchalik `CashRegisterService.createTransaction()` ga delegatsiya qilingan (controller comment'da "A.2 (P0)" deb belgilangan — bu muammo avval topilgan va tuzatilgan).

---

## P1 Topilmalar

### P1 — Stock decrement atomik emas
**Fayl:** `apps/api/src/modules/pos/application/services/cash-register.service.ts:137–142`

Tranzaksiya INSERT va stock decrement alohida query'lar. Agar server o'rtada tushib qolsa yoki network xato bo'lsa, `retail_pos_transactions`'da "completed" row bo'lib, stock esa kamaytirilmagan holda qolishi mumkin.

**Tavsiya:** `insertTransaction` + `decrementStock` loop'ni bitta Drizzle transaction'ga o'rash:
```ts
await db.transaction(async (tx) => {
  await tx.insert(retail_pos_transactions).values(...);
  for (const item of dto.items) {
    await tx.update(retail_pos_products)
      .set({ stock_quantity: sql`GREATEST(0, stock_quantity::numeric - ${item.quantity})` })
      .where(eq(retail_pos_products.id, item.productId));
  }
});
```

---

## P2 Topilmalar

### P2 — Tax hisob-kitobi noto'g'ri (inclusive vs exclusive)
**Fayl:** `apps/api/src/modules/pos/application/services/cash-register.service.ts:121`

```ts
const taxAmount = Math.round((taxableBase * dto.taxRate) / (100 + dto.taxRate));
// Bu — inclusive tax (QQS summadan ajratilgan)
// Lekin totalAmount = subtotal - discountAmount (tax qo'shilmagan)
// Natija: mijoz QQS to'lamaydi, faqat chekda ko'rsatiladi
```

Hisob-kitob noto'g'ri: `totalAmount = subtotal - discountAmount` (taxsiz), ammo `taxAmount` inclusive sifatida hisoblanadi. To'lov summasi va QQS miqdori mos kelmaydi. O'zbek soliq talabi bilan kelishish kerak.

### P2 — offlineLocalId server tomonida saqlanmaydi
**Fayl:** `apps/api/src/modules/pos/presentation/pos-stub.controller.ts`, `lib/db/src/schema/pos-retail.ts`

`pos-sync.ts` offline sotuvlarda `offlineLocalId` va `offlineCreatedAt` yuboradi, ammo server bu fieldlarni `retail_pos_transactions` schemaga saqlamaydi. Duplicate detection imkonsiz — internet tiklanganda network retry bo'lsa, bir sotuv ikki marta yozilishi mumkin.

---

## P3 Topilmalar

### P3 — GET /pos/sales/daily va /pos/inventory/low-stock — HTTP 501
Dashboard'da bu endpoint'lar so'raladi (`POSDashboard.tsx:92–103`), lekin server `notImplemented()` qaytaradi. Frontend xato handle qiladi (TanStack Query xatoni yutadi), ammo KPI kartalar bo'sh ko'rinadi.

### P3 — paymentBreakdown va topProducts har doim bo'sh
**Fayl:** `apps/api/src/modules/pos/infrastructure/repositories/cash-register.repository.ts:239`

```ts
return { salesToday, ..., paymentBreakdown: [], topProducts: [], lowStockCount };
```

Dashboard'da to'lov usullari bo'yicha taqsimot va eng ko'p sotiladigan mahsulotlar hech qachon ko'rsatilmaydi. SQL query yozilmagan.
