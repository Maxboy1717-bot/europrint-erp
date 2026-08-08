# ADR-004: `warehouse_stock` kanonik ombor qoldig'i

**Sana:** 2026-06-04
**Holat:** ✅ QABUL QILINGAN

---

## Muammo

Uch parallel stock modeli:
- `warehouse_stock` — UI `current_stock` VIEW orqali shu jadvaldan o'qiydi
- `stocks` — WMS `receiveFg` shu jadvalga yozgan (noto'g'ri)
- `wms_stock` — stub, hech kim ishlatmaydi

WMS yozuvi ko'rinmagan — UI da ombor doim bo'sh ko'rindi.

## Qaror

**`warehouse_stock` = kanonik.** Yagona yozuv joyi.

- `current_stock` = VIEW over `warehouse_stock` (faqat o'qish)
- `stocks` va `wms_stock` → TEGMA
- WMS receiveFg: `stocks` → `warehouse_stock` ga o'zgartirildi (commit 497a731c)

## Qoida

```ts
// ✅ BITTA yozuv:
await db.insert(warehouseStock).values({...}).onConflictDoUpdate({...});
// ❌ stocks, wms_stock → TEGMA
// ❌ current_stock → VIEW, INSERT TAQIQ
```
