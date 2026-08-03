# EuroPrint ERP — "Ikki-Olam" Tahlili (current_stock╳warehouse_stock · sd_sales_orders╳sales_orders)
> Sana: 2026-06-03 | Rejim: QAT'IY READ-ONLY | 3 parallel agent + jonli DB (_audit/q.cjs) + git
> ⭐ Har da'vo dalil bilan (TABLE/VIEW = information_schema, file:line = grep, qator = SELECT count). KANONIK TANLANMADI — egasi qaror qiladi.

---

## ⭐⭐ ASOSIY KASHFIYOT (ikkala olam uchun bir xil — burilish nuqtasi)

**IKKALA "ikki-olam" ham aslida BITTA fizik jadval + uning VIEW'i. Haqiqiy ma'lumot bo'linishi YO'Q.**

| "Ikki olam" | Haqiqat | Dalil |
|---|---|---|
| current_stock ╳ warehouse_stock | `current_stock` = **VIEW** → warehouse_stock (BASE TABLE) | `information_schema.tables`: current_stock=VIEW; `pg_get_viewdef` = `SELECT ... FROM warehouse_stock`; 25=25 qator |
| sd_sales_orders ╳ sales_orders | `sd_sales_orders` = **VIEW** → sales_orders (BASE TABLE), auto-updatable | `relkind`: sd_sales_orders=`v`, sales_orders=`r`; `pg_get_viewdef` = `SELECT ... FROM sales_orders`; 12=12 qator; commit f85fc2c9 (Phase 4 STEP 3) |

➡️ **Avvalgi auditlar ("2 order olam, 0 FK", "3 parallel stok") OG'IRLIGI OSHIRIB BAHOLANGAN.** "12 ╳ 12 qator" = AYNAN o'sha 12 qator, ikki marta sanalган. Egasi his qilgan "ballonsiz mashina" — ma'lumot bo'linishi EMAS. Haqiqiy muammo boshqa (quyida).

---

## 🌍 WORLD 1 — STOCK: `current_stock` ╳ `warehouse_stock`

### 1.1 DB Reality
| Xususiyat | `current_stock` | `warehouse_stock` |
|---|---|---|
| Tur | **VIEW** | **BASE TABLE** ⭐ kanonik |
| Qator | 25 (view→table) | 25 |
| Key tur | warehouse_id int, material_id int | warehouse_id int, material_id int |
| Quantity | `quantity_on_hand/reserved/available` (alias) | `quantity/reserved_quantity/available_quantity` (asl) |
| Qo'shimcha | — (9 proyeksiya) | `reorder_point, max_stock, bin_location_id, item_id` |
| Unikal | — | **UNIQUE(warehouse_id, material_id)** |
| FK → materials/warehouses | — | **YO'Q** (faqat NOT NULL; `bin_location_id→warehouse_bins` bor) |

**View ta'rifi:** sof 1:1 proyeksiya (JOIN/filtr yo'q) — `quantity AS quantity_on_hand` legacy-nom alias. Metod: `pg_get_viewdef('current_stock')`.

### 1.2 Writers (hammasi `warehouse_stock` ga)
| Yo'l | file:line | Holat |
|---|---|---|
| pos-warehouse-integration-movement | :126 UPDATE, :136 INSERT ON CONFLICT | ✅ jonli, to'g'ri `material_id` |
| pos-wms-sync.helpers `upsertWarehouseStock` | :93, :106 | ✅ jonli |
| procurement-request | :280, :287 | ✅ jonli |
| warehouse-config | :113 | ✅ jonli |
| quarantine-workflow | :51, :110 | ✅ jonli |
| ⚠️ **execCurrentStockUpsert/Decrement** (VIEW orqali) | queries-remaining-a.ts:27,41 | ❗ **BUZUQ** — quyida |

### 1.3 Readers + FE
- **`current_stock` VIEW** o'qiydi (hammasi `cs.material_id` + `quantity_on_hand`): pos-reports.repository (FE `/api/pos/reports/stock`), pos-barcode-ext, pos-inventory-count-query, pos-stock-reservation
- **`warehouse_stock` TABLE** o'qiydi: wms get-stock-inventory.handler, pos-wms-query, pos-balance-guard, warehouse-kpi; FE `/api/warehouse/stock` (use-wms.ts:20)
- ➡️ FE ikkala nomdan o'qiydi, **lekin oxiri bir xil fizik jadval** (view shaffof)

### 1.4 Vision Fit (13 ombor, per-warehouse, FEFO, barcode)
`warehouse_stock` to'liq mos: per-warehouse grain (6 ombor × 21 material = 25), `bin_location_id` (FEFO/barcode joylashuv), `reorder_point/max_stock`. `current_stock` VIEW bularsiz (faqat 9 proyeksiya).

### 1.5 Verdikt
- **Yagona fizik kanonik = `warehouse_stock`** (BASE TABLE, barcha jonli yozuvchi, bin/reorder/unikal, vizyonga mos)
- `current_stock` = **compat VIEW** (POS `quantity_on_hand` nomini kutadi). O'qish xavfsiz.
- **❗ ASL MUAMMO (dublikat EMAS):** stale Drizzle stub `schema-ext-a-1.ts:43` — `material_card_id` deb e'lon qiladi, jonli ustun `material_id`. Bu `execCurrentStockUpsert/Decrement` ni JIM sindiradi (`material_card_id` ustuni yo'q → runtime xato → fail-soft `Err`). POS movement IN/TRANSFER yo'lidagi stok-yangilash shu yo'l orqali ketsa jimgina ishlamaydi.
- **Konvergensiya: KOD-only, DDL YO'Q.** Stub'ni `material_id`ga moslash YOKI ikki yozuvchini `upsertWarehouseStock`ga yo'naltirish. **Xavf: PAST** (ma'lumot bo'linishi yo'q, 25=25).

---

## 🌍 WORLD 2 — ORDERS: `sd_sales_orders` ╳ `sales_orders`

### 2.1 DB Reality
| Xususiyat | `sd_sales_orders` | `sales_orders` |
|---|---|---|
| Tur | **VIEW** (auto-updatable, is_insertable_into=YES) | **BASE TABLE** ⭐ kanonik |
| Qator | 12 (view→table) | 12 |
| id tur | integer | integer |
| Ustun | 56 (eskirgan proyeksiya) | **70** (boy: advance, tech-checkpoint, Phase-4) |
| FK (orasida yoki tashqi) | — | **YO'Q** (har ikki tomon: `pg_constraint contype='f'` = 0) |

**View ta'rifi:** `SELECT ... FROM sales_orders` — pass-through, auto-updatable (`pg_relation_is_updatable = 28`). `INSERT/UPDATE sd_sales_orders` avtomatik `sales_orders`ga tushadi (shuning uchun Phase 4 order-create ishlaydi).

### 2.2 Writers + Readers
- **Referens hajmi:** `sales_orders`/`salesOrders` = **235 ref / 62 fayl** (PP, MES, finance, SD, SAP, director) vs `sd_sales_orders` ~10 fayl (asosan schema/saga)
- Order yozuvchilar: SD CQRS (view orqali) + SD orders.service (table) + CRM lead→order (`sd-leads.repository.ts:146` INSERT INTO sales_orders) + quotation→order + SAP + tech-checkpoint + WMS/design listenerlar — **hammasi oxiri `sales_orders`**
- **PP/MES izolyatsiya EMAS** — production view'ni ishlatmaydi, to'g'ridan `sales_orders`dan o'qiydi

### 2.3 ❗ ASL UZILGAN ZANJIR (dublikat emas — yetishmayotgan FK + ustun drift)
| # | Gap | file:line | Nega jim |
|---|---|---|---|
| 1 | **MPS talab — FK yo'q + ustun drift** | pp-mps.service.ts:104 `JOIN sales_orders so ON so.id::text = soi.order_id` | `sales_order_items`da `order_id` YO'Q (real: `sales_order_id`); `product_id`/`quantity` YO'Q (real: `material_id`/`order_quantity`) → jonli datada `column does not exist` crash; hozir jadval **0 qator** = yashiringan |
| 2 | MES papka JOIN — FK yo'q | mes-shifts-stats.repo.ts:96 `LEFT JOIN sales_orders ON so.id = po.sales_order_id` | text-cast, FK yo'q |
| 3 | Fan-out FK yo'q | sd_order_departments.order_id + ow_*.order_id → sales_orders.id | 0 FK → orphan job/dept mumkin |
| 4 | sales_order_items.sales_order_id → sales_orders.id | FK yo'q | order-line yaxlitligi kafolatsiz |

### 2.4 Vision Fit (order → bo'lim fan-out)
- Fan-out: `sd_order_departments.order_id` (int) → `sales_orders.id` → har bo'lim `ow_*`. Saga `getSaga()` `FROM sd_sales_orders` (view) → fizik `sales_orders`.
- ➡️ Fan-out ham, savdo ham bir xil fizik jadval. ⚠️ Phase-4 jadvallari hozir **0 qator** ("jonli isbot" rollback-tx'da, persist qilinmagan).

### 2.5 Verdikt
- **Ehtimoliy kanonik = `sales_orders`** (yagona fizik storage, 235 ref, fan-out+savdo+production hammasi)
- `sd_sales_orders` = eskirgan pass-through VIEW (legacy alias, ikkinchi olam EMAS)
- **Konvergensiya: data migratsiya 0** (bitta jadval). Asl ish: **FK qo'shish (DDL) + MPS ustun drift fix (kod)**. **Xavf: O'RTA** (FK = DDL, egasi ruxsati)

---

## 🔍 PART 3 — UMUMIY NAQSH + YASHIRIN DUBLIKATLAR

### 3.1 Umumiy ildiz
`sd_` prefiksli obyektlar = **VIEW (compat shim) kanonik base jadval ustida** — eski qayta qurish EMAS. `sales_orders` SD-domen ustunlarini o'ziga singdirgan (konvergensiya allaqachon DB darajasida bo'lgan). `sd_sales_orders` VIEW commit **f85fc2c9 (2026-06-01, Phase 4 STEP 3)** da yaratilgan: "saga view on the real order — without the orphan ow_orders aggregate".

**"Dup-pgTable" signali manbai (drift artefakti):** `schema-ext-a-1.ts:124` Drizzle stub `pgTable('sd_sales_orders')` + `migrations-drift.ts:2101` `CREATE TABLE IF NOT EXISTS` (no-op, view mavjud). Audit skript buni jadval deb ko'radi — jonli DB'da VIEW.

### 3.2 Boshqa parallel "dublikatlar" (aksariyati VIEW yoki bo'sh)
| Juft | TABLE/VIEW | Qator | Xulosa |
|---|---|---|---|
| mm_materials ╳ materials | VIEW ╳ TABLE | 0╳0 | VIEW→materials (auto-upd) |
| sd_customers ╳ customers | TABLE ╳ **YO'Q** | 9╳— | `customers` UMUMAN YO'Q; sd_customers yagona |
| sd_customers ╳ clients | TABLE ╳ TABLE | 9╳0 | `clients` o'lik bo'sh |
| sd_customer_complaints/documents/competitors ╳ * | VIEW ×3 | — | VIEW→base (compat) |
| customer_orders ╳ sales_orders | TABLE ╳ TABLE | 0╳12 | `customer_orders` o'lik bo'sh |

### 3.3 ⭐ STOK MANBALARI XARITASI — faqat 1 (BIR) xil HAQIQIY stok
26 ta `%stock%`/`%balance%` obyekt, faqat BITTASIDA data:
| Obyekt | Tur | Qator |
|---|---|---|
| **`warehouse_stock`** | BASE TABLE | **25** ⭐ YAGONA jonli |
| `material_movements` | TABLE | 3 (jurnal, snapshot emas) |
| current_stock, pos_warehouse_stock_view | VIEW | →25 (alias) |
| pos_stock_ledger | VIEW | →0 |
| stock_ledger, stocks, wms_stock, wms_stock_levels, production_material_balance, ... (~12) | BASE TABLE | **0** (bo'sh skelet) |

`material_cards.current_stock` = denormalizatsiya ustuni (3-chi manba EMAS). **Xulosa: 1 xil haqiqiy stok = `warehouse_stock`.**

### 3.4 Code-vs-DDL klassifikatsiya
| Konvergensiya | Tur | Harakat | Egasi DDL ruxsati (Q-35)? |
|---|---|---|---|
| sd_sales_orders → sales_orders | VIEW | KOD-only (stub tozalash) | ❌ yo'q |
| current_stock → warehouse_stock | VIEW | KOD-only (stub material_id fix) | ❌ yo'q |
| mm_materials → materials | VIEW | KOD-only | ❌ yo'q |
| sd_customer_* → customer_* | VIEW ×3 | KOD-only | ❌ yo'q |
| **savdo↔production FK qo'shish** | — | **DDL** (sales_order_items, sd_order_departments, ow_*, mes_papka_orders → sales_orders.id) | ⚠️ **HA** |
| **MPS ustun drift fix** | — | KOD (pp-mps.service.ts:104) | ❌ yo'q |
| o'lik jadval DROP (clients, customer_orders, bo'sh stok skelet) | TABLE | DDL | ⚠️ HA (ixtiyoriy) |

➡️ **Deyarli barcha "dublikat" = VIEW yoki bo'sh skelet → konvergensiya asosan KOD.** Data migratsiya KERAK EMAS (memory "MIGRATION KERAK EMAS" tasdiqlanadi). DDL faqat: FK qo'shish + o'lik jadval DROP.

---

## 🎯 EGASI QARORI KERAK (tahlilchi TANLAMADI)

### WORLD 1 — STOCK
| Variant | Trade-off |
|---|---|
| **A. Hech narsa (view qoldir) + stub fix** | Eng arzon. `current_stock` VIEW zarar qilmaydi; faqat `schema-ext-a-1.ts:43` stub `material_card_id→material_id` tuzatilsa POS movement-IN stok-yangilash tiklanadi. DDL yo'q. |
| **B. View DROP + readerlarni warehouse_stock'ga ko'chir** | Tozaroq, lekin DDL (view drop) + 5 reader ko'chirish. Kosmetik foyda. |

### WORLD 2 — ORDERS
| Variant | Trade-off |
|---|---|
| **A. View qoldir, faqat FK + MPS drift fix** | Eng arzon. `sd_sales_orders` VIEW zarar qilmaydi; asl ish — savdo↔production FK qo'shish (DDL) + pp-mps ustun fix (kod). Ikki order nomi qoladi lekin bir jadval. |
| **B. View DROP + eski SD CQRS repo'ni salesOrders'ga ko'chir** | Bitta order nomi. DDL (view drop) + drizzle-sales-order.repo ko'chirish + saga getSaga fix. |
| **C. Drizzle stub→pgView** | `schema-ext-a-1.ts:124` ni `pgTable`→`pgView` qil (ORM drift tuzatish) — Drizzle migration jadval yaratmasin |

**Har ikkala olamda:** kanonik aniq (`warehouse_stock`, `sales_orders`), lekin VIEW'ni saqlash yoki olib tashlash — egasi tanlovi. **Eng muhim ish dublikat tozalash EMAS** — bu World 2'da **savdo↔production FK qo'shish + MPS ustun drift** (hozir bo'sh jadvallar tufayli yashiringan latent bug).

---

## 📐 Har raqam qanday o'lchandi
| Da'vo | Metod |
|---|---|
| VIEW vs TABLE | `SELECT table_type FROM information_schema.tables` / `pg_class.relkind` |
| View ta'rifi | `pg_get_viewdef('...'::regclass, true)` |
| Auto-updatable | `pg_relation_is_updatable` = 28 / `information_schema.views.is_insertable_into` |
| Qator (25=25, 12=12) | `SELECT count(*)` har jadval |
| FK yo'q | `pg_constraint contype='f'` har ikki tomon = 0 |
| Writers/readers | `grep -rn` file:line |
| 235 ref / 62 fayl | `grep -rn "sales_orders" \| wc` |
| Stale stub | `schema-ext-a-1.ts:43,124` o'qish vs jonli ustun ro'yxati |
| f85fc2c9 commit | `git log -S "sd_sales_orders" --all` |

> Hech narsa o'zgartirilmadi (read-only). Yagona yozuv: `docs/two-worlds-analysis.md`. Kanonik TANLANMADI — egasi + advisor qaror qiladi. **Memory yangilash kerak:** "2 order olam, 0 FK" da'vosi — aslida 1 jadval + auto-updatable VIEW; asl muammo FK + MPS drift.
