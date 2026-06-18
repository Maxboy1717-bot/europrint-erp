# 06 — BOSQICH 3: ISHLAB CHIQARISH REJASI (PP)

> Tech-karta master → CRP → MRP → AI 7-qadam planner → plan-fakt.
> **Holat: 🔧 ~65% mavjud** — CQRS/BOM/CRP mavjud; tech-karta master 2026-06-18 ALTER qilingan.
> Bog'liqlik: Bosqich 2 (SD) tayyor + `technology_cards` kanonik.

---

## 3.1 Kanonik jadvallar

```sql
technology_cards     -- master texkarta (ALTER + 20 col qo'shildi 2026-06-18)
tech_card_bom        -- material normasi (technology_card_id FK)
tech_card_routes     -- operatsiya marshruti (technology_card_id FK)
tech_card_versions   -- versiya tarixi
work_centers         -- mashina/ish markazi (12 mavjud: OFFSET-1, CUTTING-1 va h.k.)
work_orders          -- ishlab chiqarish buyurtma
pp_production_plans  -- reja jadval
```

⚠️ `tech_cards` (order-bound) — TEGMA. `technology_cards` — kanonik master.

---

## 3.2 Tech-karta tuzilmasi (ALTER qilingan 2026-06-18)

```sql
-- technology_cards (approved: 2026-06-18):
code              VARCHAR(50) UNIQUE
name_uz           VARCHAR(200)
direction         VARCHAR(50)  -- 'gofra'/'offset'/'silkscreen'
material_type     VARCHAR(50)
print_params      JSONB        -- rangli bosma parametrlari
kesim_schema      JSONB        -- kesim sxemasi
post_press        JSONB        -- laklash/laminatsiya
ish_tartibi       TEXT         -- ishlab chiqarish tartibi
gofra_profile     VARCHAR(10)  -- 'B'/'C'/'E'/'BC'
raskroy_per_list  INTEGER      -- listdan kesim soni
scrap_pct         NUMERIC(5,2) DEFAULT 5
version           INTEGER DEFAULT 1
status            VARCHAR(50)  DEFAULT 'draft'
lab_approved      BOOLEAN DEFAULT FALSE
lab_approved_by   INTEGER REFERENCES users(id)
lab_approved_at   TIMESTAMPTZ
maket_approved    BOOLEAN DEFAULT FALSE
created_by        INTEGER REFERENCES users(id)
```

---

## 3.3 AI 7-qadam planner (vizyon)

```
1. Buyurtma kelib tushdi (SalesOrderConfirmedEvent)
   ↓
2. Material tekshiruvi (BOM → warehouse_stock → yetarlilik)
   ↓
3. Material bron qilish (rezerv)
   ↓
4. Marshrut aniqlash (tech_card_routes → work_centers)
   ↓
5. Vaqt hisoblash (CRP: capacity × efficiency_rate)
   ↓
6. Reja tuzish (work_orders yaratish, smena taqsim)
   ↓
7. Ijrochi tayinlash (xodim + smena + org_function moslik)
   → Menejer tasdig'i → DB saqlash
```

---

## 3.4 CRP hisoblash (mavjud, efficiency_rate 2026-06-08 tuzatilgan)

```ts
// work_centers.efficiency_rate DEFAULT 0.85 (mavjud)
const availableMinutes = work_center.available_hours * 60 * work_center.efficiency_rate;
const requiredMinutes = route.operation_time_minutes * order_qty;
const load_pct = (requiredMinutes / availableMinutes) * 100;
```

---

## 3.5 Acceptance kriterlari

```
☐ Tech-karta CRUD (technology_cards + bom + routes)
☐ Lab tasdig'i / Maket tasdig'i oqimi
☐ Versiyalash (versiya oshishi → tech_card_versions snapshot)
☐ CRP ishlaydi (work_center yuklanish hisob)
☐ MRP: BOM → talab → warehouse_stock → yetishmovchilik ro'yxati
☐ AI 7-qadam: buyurtma → plan (menejer tasdig'i bilan)
☐ Plan-fakt tahlil
☐ tsc 0 + test PASS
```

---

## 3.6 Ko'chiriladigan qismlar

| | Holat |
|-|-------|
| `apps/api/src/modules/pp/` | ✅ ko'chir |
| `lib/db/src/schema/technology-cards.ts` | ✅ ko'chir (ALTER qilingan) |
| `lib/db/src/schema/tech-card-bom.ts` | ✅ ko'chir |
| `lib/db/src/schema/tech-card-routes.ts` | ✅ ko'chir |
| `lib/db/src/schema/work-centers.ts` | ✅ ko'chir |
| AI 7-qadam planner | 🔲 yangi |
| Plan-fakt tahlil | 🔲 yangi |

---
*Keyingi: [07_Bosqich4_MES.md](07_Bosqich4_MES.md)*
