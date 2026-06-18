# ADR-002: `sales_orders` kanonik buyurtma jadvali

**Sana:** 2026-06-04
**Holat:** ✅ QABUL QILINGAN
**Qaror qabul qildi:** Egasi (two-worlds tahlil asosida)

---

## Muammo

Ikkita parallel "buyurtma" jadvali:
- `sales_orders` — INT PK, SD moduli, FK qabul qiladi, UI ishlatadi
- `orders` — boshqa tuzilma, PP moduli ishlatgan, FK yo'q

PP `OrderCreatedEvent` tinglamagan → ikki dunyo, data mos emas.

## Qaror

**`sales_orders` = kanonik.**
- `orders` jadvaliga yangi FK yozilmaydi
- SD → PP ko'prigi: `SalesOrderConfirmedEvent` emit → PP listener `sales_orders` dan oladi
- 7 ta ow_* jadvaldan `sales_orders(id)` ga FK qo'shilgan (2026-06-04, commit e845726d)

## Oqibat

- `orders` = legacy, ehtiyotkorlik bilan ko'rib chiqiladi
- Har `ORDER` ma'nosi = `sales_orders`
- Golden thread boshlanishi: `sales_orders.status = 'CONFIRMED'`
