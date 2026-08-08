# ADR-006: `technology_cards` master texkarta (tech_cards order-bound)

**Sana:** 2026-06-18
**Holat:** ✅ QABUL QILINGAN

---

## Muammo

Ikkita texkarta jadvali:
- `technology_cards` — master, moddiy spetsifikatsiya (material turi, gofra profili, operatsiya tartibi)
- `tech_cards` — buyurtmaga bog'liq (order-bound), har buyurtma uchun nusxa

`tech_cards` master ma'lumot sifatida ishlatilgan edi — xato.

## Qaror

**`technology_cards` = master texkarta (KANONIK).**
**`tech_cards` = order-bound (buyurtmaga nusxa) — master sifatida TEGMA.**

- `technology_cards`: ALTER qilingan 2026-06-18 (20 yangi ustun: gofra_profile, print_params JSONB, lab_approved, ...)
- `tech_cards`: `ORDER BY work_order` → har buyurtma uchun snapshot

## Foydalanish

```ts
// ✅ Master texkarta:
const card = await db.select().from(technologyCards).where(eq(technologyCards.id, cardId));

// ✅ Buyurtma uchun snapshot (order-bound):
const orderCard = await db.select().from(techCards).where(eq(techCards.workOrderId, orderId));

// ❌ XATO: tech_cards ni master sifatida (BOM, CRP uchun):
const bom = await db.select().from(techCardBom).where(eq(techCardBom.techCardId, id)); // NOTO'G'RI
// ✅ TO'G'RI:
const bom = await db.select().from(techCardBom).where(eq(techCardBom.technologyCardId, id));
```
