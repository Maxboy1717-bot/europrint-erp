# ADR-001: `org_functions` kanonik karta (positions emas)

**Sana:** 2026-06-08
**Holat:** ✅ QABUL QILINGAN (egasi tasdiqlagan)
**Qaror qabul qildi:** Egasi (live FK audit asosida)

---

## Muammo

Ikkita lavozim jadvali mavjud:
- `positions` — dastlab yaratilgan. 0 FK boshqa jadvalga. UI ishlatmaydi.
- `org_functions` — keyinroq yaratilgan. **29 FK** boshqa jadvallardan. Employees, razryad, salary, KPI, AI assessment hammasining asosi.

Qaysi jadval "kanonik karta"?

## Tekshiruv natijasi

```sql
SELECT ccu.table_name AS referenced_table, COUNT(*) 
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name IN ('positions','org_functions')
GROUP BY 1;
-- positions:     0 FK (hech kim bog'lanmagan)
-- org_functions: 29 FK (employees, razryad, salary...)
```

## Qaror

**`org_functions` = kanonik karta.** Sabab:
1. 29 FK = tizimning asosiy ob'ekti
2. Vizyon: "karta = to'g'ri ishning ta'rifi" → `org_functions` bu ta'rifni saqlaydi
3. `positions` = 0 FK = hech kim ishlatmaydi

## Oqibat

- Yangi FK → `org_functions` ga (positions ga emas)
- `positions` → faqat legacy compat uchun VIEW ga aylantirish (yozuvchi bor, shu sababdan defer)
- Har "lavozim" so'zi uchraganda: `org_functions` ma'noni anglatadi
