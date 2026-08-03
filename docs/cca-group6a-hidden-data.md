# CCA Group 6A — Yashirin Ma'lumot Muammolari (Hidden Data Defects)

> Tahlil sanasi: 2026-06-03 · QAT'IY READ-ONLY (faqat shu hujjat yozildi)
> Backend: `apps/api/src` · Live DB: `europrint` (verify-don't-trust: har topilma kod + jonli DB bilan tasdiqlangan)
> Metodologiya: "xato bermaydi, lekin ichdan noto'g'ri" — bugun 200/yashil qaytaradi, lekin ma'lumot mazmunan buziladi.

## Xulosa jadvali (severity bo'yicha)

| # | Kategoriya | Joy | Severity | Bugun jonli? |
|---|-----------|-----|----------|--------------|
| F1 | 6.3 Buzuq event | `PosMovementCompletedEvent` hech qachon publish qilinmaydi → 2 listener o'lik | **P0** | Ha (kod) |
| F2 | 6.1 Jim buzilish | `pos-wms-sync.service.ts:214` har turga `'kirim'` hardcoded | **P1** | Ha (kod) |
| F3 | 6.5 FK yo'q | 73 jadvalda `order_id`, faqat 1 tasida FK → 72 orphan-risk | **P1** | Ha (DB) |
| F4 | 6.4 Data-model | `sd_sales_orders`╳`sales_orders` ikkalasi 12 qator, 0 FK | **P1** | Ha (DB) |
| F5 | 6.6 Race | `stock-ledger.service.ts:43-56` read-modify-write balans clobber | **P1** (latent) | Latent |
| F6 | 6.6 Race | `pos-fifo.service.ts:78-103` allocate decrement yo'q → over-allocation | **P1** | Ha (kod) |
| F7 | 6.2 Tranzaksiyasiz | `createMovement` header+lines tx siz (orphan movement) | **P1** | Ha (kod) |
| F8 | 6.2 Tranzaksiyasiz | `warehouse-config.issueStock` 3 yozuv tx siz (stock−, movement yo'q) | **P1** | Ha (kod) |
| F9 | 6.4 Data-model | 4 parallel stock-haqiqat jadvali (current_stock/warehouse_stock/material_cards.current_stock/pos_stock_ledger) | **P1** | Ha (DB) |
| F10 | 6.4 Data-model | 4 material jadvali + `customers` yo'q/`sd_customers` bor (AI bo'linishi) | **P2** | Ha (DB) |
| F11 | 6.1/6.6 | `createMovement` movement_number = count()+1 (race → dup raqam) | **P2** | Ha (kod) |
| F12 | 6.1 | `resources.service.ts:75` material_cards INSERT `kod` (NOT NULL) tushiradi | **P2** | Ha (kod, lekin ERROR beradi) |

---

## 6.1 — JIM MA'LUMOT BUZILISHI

### F2 (P1) — `pos-wms-sync.service.ts:214` — har harakat turiga `'kirim'` hardcoded
**Fayl:** `apps/api/src/modules/pos/application/services/pos-wms-sync.service.ts:214`
```ts
// onMovementCreated() — DRAFT warehouse_transactions insert
INSERT INTO warehouse_transactions
  (material_id, transaction_date, transaction_type, ...)
VALUES
  (${matId}, ${txDate}, 'kirim', ...)   // ← har doim 'kirim', tur e'tiborga olinmaydi
```
- **Nega jim:** `onMovementCreated` BARCHA movement turlari uchun chaqiriladi (EXTERNAL_OUT, INTERNAL_ISSUE, DAMAGE, TRANSFER ham), lekin `transaction_type` doim `'kirim'`. INSERT muvaffaqiyatli o'tadi (xato yo'q). Taqqoslang: o'sha fayldagi `onMovementCompleted:120` to'g'ri `${transType}` (MOVEMENT_TYPE_MAP orqali) ishlatadi.
- **Nima buziladi:** chiqim/transfer harakatlari ham `warehouse_transactions`ga `'kirim'` sifatida yoziladi → ombor harakatlar hisoboti (kirim/chiqim balansi) noto'g'ri; chiqim "kirim" deb sanaladi.
- **Qachon:** har qanday non-kirim POS harakat YARATILGANDA (draft tx). Hozir `warehouse_transactions`=0 (quyida F1 sababli), shu bois bugun ko'rinmaydi, lekin draft-tx yo'li ishga tushganda darrov buzadi.
- **Tuzatish yo'nalishi:** `MOVEMENT_TYPE_MAP[movement.movement_type] ?? 'adjustment'` ishlatish (completed yo'lidagidek).

### F12 (P2) — `resources.service.ts:75` — material_cards INSERT `kod` ustunini tushiradi
**Fayl:** `apps/api/src/modules/compatibility/resources.service.ts:75`
```ts
INSERT INTO material_cards (xom_ashyo, sku_code, unit_of_measure, material_type, created_at)
VALUES (${name}, ${sku}, ${unit}, ${category}, NOW())
```
- **DB:** `material_cards.kod` = **NOT NULL, default YO'Q** (verified). INSERT `kod`ni bermaydi.
- **Nega "jim" emas:** aslida bu **xato beradi** (NOT NULL violation) — bugun ko'rinadigan 500. Lekin to'liqlik uchun yozildi: agar `kod`ga kelajakda default qo'shilsa, jim bo'lib qoladi. Shuningdek `unit_price/min_stock/category` kabi maydonlar ham tushib qoladi (ular nullable/defaultli, jim). Severity P2 chunki hozir error.

### Eslatma — TO'G'RI hardcoded literallar (bug EMAS, false-positive)
`warehouse-config.service.ts:126('ISSUE')/194('RECEIVE')` va `procurement-request.service.ts:299('RECEIVE')` — har biri kontekst-aniq metodda (issueStock doim ISSUE, receiveStock doim RECEIVE). Bular to'g'ri, o'zgartirilmasin.

---

## 6.2 — TRANZAKSIYASIZ KO'P-YOZISH (yarmida uzilsa orphan)

### F7 (P1) — `createMovement`: header + lines tx siz
**Fayllar:**
- Service: `apps/api/src/modules/pos/application/services/pos-movement.service.ts:140` (`insertMovement`) + `:159/:203` (`addLines`→`insertLines`)
- Repo: `apps/api/src/modules/pos/infrastructure/repositories/pos-movement.repository.ts:56,74` (2 ta alohida `db.insert`)
- `db.transaction` — service'da **YO'Q** (grep tasdiqladi).
- **Nega jim:** header INSERT muvaffaqiyatli (Result.ok). Keyin `addLines` chaqiriladi — agar u xato bersa (constraint, noto'g'ri material_card_id), `createMovement` `InternalServerError` qaytarmaydi (line 159 natijani tekshirmaydi ham) → header qoladi, lines yo'q.
- **Nima buziladi:** `pos_movements`da qatorsiz (lines-siz) yetim movement to'planadi. Keyin completed bo'lganda `_processCompletedMovement` 0 qator bilan ishlaydi → stock harakati bo'lmaydi, lekin movement "yakunlangan" ko'rinadi.
- **Qachon:** lines insert qisman/to'liq fail bo'lganda (masalan bir line'da noto'g'ri FK).
- **Tuzatish:** `db.transaction`da header+lines bitta atomik blokda.

### F8 (P1) — `warehouse-config.issueStock`: 3 yozuv tx siz
**Fayl:** `apps/api/src/modules/pos/application/services/warehouse-config.service.ts:112-128`
- 3 ketma-ket yozuv: `warehouse_stock` UPDATE (atomik −qty) → `material_cards.current_stock` UPDATE → `material_movements` INSERT. `db.transaction` **YO'Q**.
- **Nega jim:** birinchi UPDATE atomik (`WHERE available_quantity >= qty`) — yaxshi. Lekin agar `material_movements` INSERT (line 125) yoki `material_cards` UPDATE fail bo'lsa, **stock allaqachon kamaytirildi** — rollback yo'q.
- **Nima buziladi:** ombor qoldig'i kamayadi, lekin harakat jurnali (`material_movements`) yozuvi yo'q → audit izsiz stock "yo'qoladi". Yoki `material_cards.current_stock` denormal qiymat `warehouse_stock`dan ajraladi.
- **Qachon:** 2-3-yozuv fail bo'lganda (DB lock timeout, constraint).
- **Eslatma:** `receiveStock` (xuddi shu fayl, ~line 180+) ham bir xil naqsh.

### Boshqa ko'p-insert repolar (kontekst: ko'pchiligi MUSTAQIL insert metodlari, parent+child EMAS)
Skan 40+ repo topdi (`6 ins/0 tx` eng yuqori: `hr-compat-a`, `financial-reports`, `erp-reports`), lekin tekshiruvda ular **alohida CRUD metodlari** (har biri 1 insert), bitta oqimda parent+child emas — orphan-risk past. Haqiqiy parent+child tx-siz oqim = F7 (movement). Boshqalarni alohida tekshirish kerak, lekin bu skan ularni avtomatik P1 qilmaydi.

---

## 6.3 — BUZUQ EVENT ZANJIRI (emit ↔ listener mos emas)

### F1 (P0) — `PosMovementCompletedEvent` HECH QACHON publish qilinmaydi → 2 listener o'lik
**Tasdiq (grep, butun `apps/api/src`):** `eventBus.publish(new PosMovementCompletedEvent(...))` — **0 ta emit sayti**. Yagona publish = `PosMovementCreatedEvent` (`pos-movement.service.ts:171`).

**O'lik listenerlar (`@EventsHandler(PosMovementCompletedEvent)` = CQRS bus):**
1. `apps/api/src/modules/pos/application/event-handlers/pos-wms-sync-completed.listener.ts` → `PosWmsSyncService.onMovementCompleted` (warehouse_stock upsert + warehouse_transactions insert + Socket broadcast)
2. `apps/api/src/modules/pos/application/event-handlers/pos-gl-auto.listener.ts` → `gl_posting_log` ga AWAITING_REVIEW yozuvi

**Mexanizm nuance (MUHIM — verify qilindi):**
- `pos-movement-status.service.ts:86` `this.eventEmitter.emit('pos.movement.data.${dto.status}', ...)` → bu **EventEmitter2 string** topic. `status='completed'` da `'pos.movement.data.completed'` string emit qiladi.
- Bu string emit **faqat `@OnEvent('pos.movement.data.completed')`** ni uyg'otadi (`pos.events.ts:166` — faqat bildirishnoma). U `@EventsHandler` (CQRS) listenerlarga **YETIB BORMAYDI**.
- `event-bridge.service.ts:74` `PosMovementCompletedEvent → 'pos.movement.data.completed'` xaritasi faqat teskari yo'nalishda ishlaydi (CQRS publish → string). Hech kim CQRS'ga publish qilmagani uchun bridge ham ishlamaydi.

- **Nega jim:** kod kompilyatsiya bo'ladi, listenerlar ro'yxatdan o'tadi, hech qanday runtime xato yo'q. Faqat hech qachon chaqirilmaydi (dead-letter).
- **Nima buziladi:**
  1. **`warehouse_transactions` (WMS jurnali) hech qachon to'lmaydi** — jonli DB: `warehouse_transactions = 0 qator` (pos_movements bor bo'lsa ham). Tasdiqlangan.
  2. **GL auto-posting (gl_posting_log AWAITING_REVIEW) hech qachon yozilmaydi** bu yo'l orqali.
- **Yengillashtirish (nima uchun "umuman ishlamaydi" emas):** warehouse_stock/current_stock yangilanishi `_processCompletedMovement` ichida **inline** (`pos-movement-status.service.ts:163-174` → `upsertStockIn`/`decrementStock` → `current_stock` jadvali) amalga oshadi — listenerga bog'liq emas. Va GL approval bosqichida `pos.events.ts:131` `autoGl.postForMovement` orqali yoziladi. Shuning uchun POS-ichki stock VA GL ishlaydi; **faqat WMS-bridge jadvallar (`warehouse_transactions`) va completed-bosqich GL-log o'lik.**
- **Qachon:** har movement 'completed' bo'lganda WMS jurnali yozilmaydi (doimiy). Hozir `pos_stock_ledger=0`, `warehouse_transactions=0` — movementlar hali completed bo'lmagan, shuning uchun samara latent + WMS-tarafda doimiy bo'sh.
- **Tuzatish:** `pos-movement-status.service.ts`da `dto.status==='completed'` bo'lganda `this.eventBus.publish(new PosMovementCompletedEvent({...}))` qo'shish (createMovement'dagi CreatedEvent kabi).

**Eslatma:** Ikkala listener fayli o'z JSDoc'ida buni ochiq tan oladi: *"No production code currently publishes `pos.movement.data.completed` on either bus (no emit site exists today); the listener was therefore already a dead-letter prior to migration."* — ya'ni bu ataylab emas, migratsiya chala qolgan.

---

## 6.4 — DATA-MODEL CHALKASHLIK (jadval 2 maqsad / 2 parallel)

### F4 (P1) — `sd_sales_orders` ╳ `sales_orders`: 2 olam, 0 bog'lanish
**Jonli DB (verified):** `sd_sales_orders = 12 qator`, `sales_orders = 12 qator`. **Ikkala jadvalga ham, ikkalasidan ham 0 ta FOREIGN KEY** (information_schema bo'yicha bo'sh natija).
- **Nega jim:** ikkala jadval ham mustaqil ishlaydi, INSERT/SELECT xato bermaydi.
- **Nima buziladi:** bir buyurtma ikki jadvalda turli ID bilan yashashi mumkin; modullar qaysi birini o'qishiga qarab turli "haqiqat" ko'radi. Hech qanday referensial bog'lanish yo'q → sinxronlik faqat kod-mantiq orqali (mo'rt).
- **Qachon:** buyurtma yaratilganda qaysi jadvalga yozilishiga qarab — downstream modul boshqasini o'qisa, "topilmadi" yoki eski ma'lumot.
- **Manba:** memory `project_chain_ui_full_analysis` ("2 order worlds") — DB darajasida tasdiqlandi.

### F9 (P1) — 4 parallel stock-haqiqat jadvali
Jonli DB row counts:
| Jadval | Kalit | Qator | Yozuvchi |
|--------|-------|-------|----------|
| `current_stock` | material_card_id + warehouse_id | 24 | `_processCompletedMovement` (POS inline) |
| `warehouse_stock` | material_id + warehouse_id | 24 | `warehouse-config` issue/receive + (o'lik) WMS sync |
| `material_cards.current_stock` | (denormal ustun) | — | `warehouse-config` issueStock:121 |
| `pos_stock_ledger` | material_card_id + warehouse_id (balansli) | 0 | `stock-ledger.service.recordEntry` |
- **Nega jim:** har biri alohida yoziladi, xato yo'q.
- **Nima buziladi:** to'rt manba bir-biridan ajraladi (drift). Masalan POS harakat `current_stock`ni yangilaydi, lekin `warehouse_stock` (WMS UI o'qiydigan) o'sha yo'lda yangilanmaydi (F1 o'lik listener sababli). UI qaysi jadvalni o'qishiga qarab turli qoldiq ko'rsatadi.
- **Qachon:** POS va WMS yo'llari aralashganda — doimiy potensial.

### F10 (P2) — 4 material jadvali + `customers` yo'q
Jonli DB: `material_cards`, `materials`, `mm_materials`, `raw_materials` — **4 ta material jadvali mavjud**. Mijoz tomonida: `customers` jadvali **YO'Q**, `sd_customers` **BOR**.
- **Nima buziladi:** AI/integratsiya kodi ko'pincha `customers`/`mm_materials` kutadi, UI esa `sd_customers`/`material_cards` ishlatadi → "bo'linish" (memory `reference_live_db_location` bilan mos). Yozuv bir jadvalga tushadi, o'quvchi boshqasini qaraydi → bo'sh natija (jim).
- **Severity P2:** bu qurilish-bosqich holati (DB asosan bo'sh), runtime crash emas — lekin kanonik jadval tanlanmaguncha jim ma'lumot yo'qolishi xavfi.

---

## 6.5 — YO'Q FK / INTEGRITY (orphan row to'planadi)

### F3 (P1) — 73 jadvalda `order_id`, faqat 1 tasida FK
**Jonli DB (verified):**
- `order_id` ustuni bor jadvallar: **73 ta**
- `order_id` da FK constraint bor jadvallar: **1 ta**
- Umumiy FK soni (public schema): **183 ta** (ya'ni FK butunlay yo'q emas, lekin order_id bog'lanishi deyarli yo'q).
- **Nega jim:** FK yo'q bo'lsa, noto'g'ri/yo'q `order_id` bilan INSERT bemalol o'tadi (xato yo'q).
- **Nima buziladi:** 72 jadvalda (`invoices`, `deliveries`, `material_consumption`, `designs`, `customer_complaints`, `defect_reports`, `machine_tasks`, ...) yetim qatorlar to'planadi — o'chirilgan/mavjud bo'lmagan buyurtmaga ishora qiluvchi qatorlar. JOIN'lar jim ravishda qator yo'qotadi yoki NULL beradi.
- **Qachon:** buyurtma o'chirilganda yoki noto'g'ri ID yozilganda — bog'liq qatorlar "osilib" qoladi.
- **Eslatma:** `sd_sales_orders`/`sales_orders`da PK bor, lekin ularga ishora qiluvchi `order_id`lar FK bilan himoyalanmagan. Qaysi jadval "buyurtma" ekani noaniq (F4) → FK qo'yish ham qiyin.

---

## 6.6 — RACE / ATOMIKLIK (stock/counter clobber)

### F5 (P1, latent) — `stock-ledger.service.ts:43-56` — balans read-modify-write clobber
**Fayl:** `apps/api/src/modules/pos/application/services/stock-ledger.service.ts:43-56`
```ts
const balanceR = await this.repo.getBalance(materialCardId, warehouseId); // SELECT ... ORDER BY ts DESC LIMIT 1
const prevBalance = balanceR.ok && balanceR.data ? balanceR.data.balance : 0;
const balanceAfter = prevBalance + qtyChange;                              // JS xotirada
await this.repo.insertLedgerEntry({ ..., balanceAfter, ... });             // INSERT
```
- **Nega jim:** ketma-ket bitta chaqiruvda to'g'ri ishlaydi.
- **Nima buziladi:** bir xil (material, warehouse) uchun 2 parallel harakat ikkalasi ham **bir xil `prevBalance`** o'qiydi, ikkalasi ham o'sha bazadan hisoblaydi → lost update. Running `balanceAfter` noto'g'ri bo'ladi. `getAllStockSummary` (`pos_stock_ledger`dan oxirgi balansni oladi) → stock hisoboti va LOW_STOCK/OUT_OF_STOCK alertlari jim ravishda noto'g'ri.
- **Lock yo'q:** `SELECT ... FOR UPDATE` ham, atomik SQL ham, advisory lock ham yo'q.
- **Qachon:** bir materialga bir vaqtda ikki harakat completed bo'lganda (parallel kassir/tablet). Hozir `pos_stock_ledger=0` (movementlar completed bo'lmagan) → **latent**, lekin yo'l ishga tushishi bilan faollashadi.
- **Tuzatish:** balansni atomik SQL bilan hisoblash (masalan `balance_after = (SELECT balance_after FROM ... FOR UPDATE) + delta` bitta statementda) yoki ledger'siz, faqat atomik `current_stock` UPDATE'ga tayanish.

### F6 (P1) — `pos-fifo.service.ts:78-103` — allocate decrement qilmaydi (over-allocation)
**Fayl:** `apps/api/src/modules/pos/application/services/pos-fifo.service.ts:78-103`
- `allocate()` `getCandidates()` (partiyalarni `current_qty > 0` bilan o'qiydi) → JS xotirada `take = min(remaining, batch.availableQty)` ajratadi → natija array qaytaradi. **Hech qachon `pos_batches.current_qty`ni kamaytirmaydi / band qilmaydi.**
- **Nega jim:** bitta chaqiruvda "Yetarli qoldiq yo'q" tekshiruvi to'g'ri ishlaydi.
- **Nima buziladi:** 2 parallel allocate ikkalasi ham bir xil `current_qty` ko'radi, ikkalasi ham o'sha partiyadan to'liq ajratadi → jami ajratilgan miqdor real qoldiqdan oshadi (over-allocation). Guard mantiqsiz bo'lib qoladi.
- **Lock yo'q:** `FOR UPDATE` yo'q, ajratilgandan keyin atomik decrement yo'q.
- **Qachon:** bir partiyadan bir vaqtda ikki harakat material so'raganda.

### F11 (P2) — `createMovement` movement_number = count()+1 (dup raqam race)
**Fayl:** `apps/api/src/modules/pos/application/services/pos-movement.service.ts:136-138`
```ts
const countR = await this.repo.countMovements();
const movementNumber = `POS-${year}-${String(count + 1).padStart(5,'0')}`;
```
- **Nima buziladi:** 2 parallel create bir xil `count` o'qiydi → bir xil `movement_number` (`POS-2026-00001`). `movement_number`da UNIQUE constraint bo'lmasa, dublikat hujjat raqami jim yaratiladi.
- **Qachon:** parallel movement yaratishda. Severity P2 (kosmetik-biznes, stock buzilmaydi, lekin hujjat raqami noyob emas).

### TO'G'RI atomik naqshlar (bug EMAS — tasdiq uchun)
- `warehouse-config.service.ts:113-118` issueStock — `WHERE available_quantity >= ${qty} RETURNING` (atomik, race-safe) ✅
- `inventory-agent.service.ts:198` — `SELECT ... FOR UPDATE` ✅
- `cc-baskets.repo.ts:132`, `cc-documents-write.repo.ts:74,165` — `FOR UPDATE` ✅
- `current_stock` upsert/decrement (`queries-remaining-a.ts:26-48`) — SQL arifmetika (`quantity_on_hand + qty`, `GREATEST(0, ... - qty)`), atomik ✅

---

## Verifikatsiya izi (verify-don't-trust)

| Da'vo | Tekshiruv | Natija |
|-------|-----------|--------|
| CompletedEvent o'lik | grep `eventBus.publish(new PosMovementCompletedEvent` butun src | 0 emit |
| warehouse_transactions bo'sh | `SELECT count(*)` | 0 |
| 2 order olam | `SELECT count(*)` ×2 + FK so'rov | 12/12, 0 FK |
| order_id FK yo'q | information_schema columns vs key_column_usage | 73 vs 1 |
| 4 stock jadval | row counts | current_stock 24, warehouse_stock 24, ledger 0 |
| material_cards.kod NOT NULL | information_schema.columns | NOT NULL, default null |
| issueStock atomik | kod o'qish (WHERE >= qty) | tasdiq (GOOD) |
| ledger race | kod o'qish (getBalance→+→insert) | tasdiq (BAD, lock yo'q) |
| fifo over-alloc | kod o'qish (decrement yo'q) | tasdiq (BAD) |

**Eng qimmatli (P0):** F1 — `PosMovementCompletedEvent` publish qilinmasligi WMS jurnalini (`warehouse_transactions`) butunlay o'lik qiladi; bu jim, chunki POS-ichki stock alohida yo'l bilan ishlaydi va hech qanday xato chiqmaydi.
