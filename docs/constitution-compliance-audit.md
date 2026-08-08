# EuroPrint ERP — Konstitutsiya Muvofiqlik Auditi (TO'LIQ KATALOG)
> Sana: 2026-06-03 | Rejim: QAT'IY READ-ONLY (Tahlilchi) | Branch: chore/schema-convergence
> Manba: 6 parallel read-only agent + reviewer skriptlar + jonli DB (_audit/q.cjs) + avvalgi auditlar
> Guruh fayllari: `cca-group1-codestyle.md` · `cca-group2-silent-failures.md` · `cca-group34-process-ui.md` · `cca-group5-db-drift.md` · `cca-group6a-hidden-data.md` · (group6b inline quyida)

---

## ⚠️ 0. METODOLOGIK OGOHLANTIRISH (muhim)

1. **CLAUDE.md qoidalari = A, B, 1–23, F1–F4** (jami ~29 qoida). Topshiriqdagi "Q-1..Q-43" raqamlash CLAUDE.md'da YO'Q — u `docs/parallel-sessiya-nazorati.md` + master-plandan. Audit haqiqiy qoidalarga qarshi qilindi.

2. **⭐ ASOSIY KASHFIYOT: Eski audit raqamlari ~40% ESKIRGAN.** Kodbaza so'nggi sprintlarda ancha tuzatilgan. Avtoritativ `reviewer-*.sh` skriptlar (2026-06-03):

   | Qoida | CLAUDE.md "Hozirgi holat" | Bugun reviewer | Holat |
   |---|---|---|---|
   | 1 Result | FAIL **143** | **FAIL 2** | ✅ deyarli tuzatilgan |
   | 2 Array | FAIL **678** | **FAIL 6** | ✅ deyarli tuzatilgan |
   | 5 as-unknown | FAIL **3** | **FAIL 0** | ✅ tuzatilgan |
   | 6,7,8,9,15 | muammolar | **PASS 0** | ✅ tuzatilgan |

   **Verify-don't-trust qoidasi har guruhda eski da'voni qisqartirdi.** Quyidagi katalog FAQAT jonli tasdiqlangan AKTIV muammolarni sanaydi.

3. **DB qurilish bosqichida** (deyarli bo'sh; faqat `cfo_config`=11, `sd_sales_orders`=12, `warehouse_stock`=24, va h.k.). Bo'sh jadval ≠ buzuq. Migration KERAK EMAS — bu kod/struktura masalasi.

4. **`git status` toza emas** — `apps/api/src/metadata.ts` o'zgargan (parallel BAJARUVCHI sessiyaniki). Mening yozuvlarim FAQAT `docs/cca-*.md`.

---

## 1. TOP-LEVEL SUMMARY — qoida → sanoq → severity → fix-type

### Kod-uslubi qoidalari (AKTIV, reviewer + grep tasdiqlangan)
| Qoida | Buzilish | Severity | Fix-type | Metod |
|---|---|---|---|---|
| **A** secret | 0 ekspluatatsion | — | — | `env ??` ×51 hammasi non-secret config default; admin.seed throw |
| **B** SQL-inj | 0 ekspluatatsion (11 `sql.raw(VAR)` hammasi guard'langan) | — | (monitoring) | DDL-prefix runtime check / whitelist / literal manba |
| **1** Result | 2 | P2 | code-fix | reviewer-result-pattern.sh |
| **2** Array | 6 | P2 | code-fix (Array.isArray guard) | reviewer-array-safety.sh |
| **5** as-unknown | 0 | — | — | reviewer-as-unknown.sh |
| **13** fayl 900+ | ~2 BE (migrations-drift 3632 auto-gen + 1) ; FE ≤340 | P3 | split / @generated marker | wc -l |
| **16** as-unknown-as-T | **121** | P2 | code-fix (`typedExecute<T>`) | grep; helper mavjud, ishlatilmagan |
| **17** notImplemented | **121** (42 fayl) | P2 (halol) | implement yoki ComingSoon | qoida mavjudni ruxsat etadi |
| **21/F** inline xom rang | **275** | P3 | token (`var(--ep-*)`) | diff-guard PASS (pre-existing); ~60% pos-monitor |
| **F2** useMutation onError | ~kam (global MutationCache.onError bor) | P3 | per-mutation | eski da'vo asosan STALE |

### Jarayon/arxitektura
| Tekshiruv | Natija | Severity |
|---|---|---|
| Duplicate route (haqiqiy collision) | **1**: `POST /api/auth/refresh` (auth.controller:147 ╳ admin-auth.controller:40) | P1 |
| Deleted-but-resurrected | **0** (deleted-routes.md toza) | — |
| Dizayn shablon (Qoida 21) | **0/851 sahifa** shablon ishlatadi — shablon komponentlari UMUMAN YO'Q | P2 (poydevor) |
| Tab 2+ chuqur | **0** production (faqat 2 test fixture) | — |
| Orphan servis | ~17 (REAL logika, ulanmagan) — 3 ULA, 12 noaniq, 2 o'chir | P2 |
| Dead listener | ~12 candidate (template/EVENT_MAP chiqarilgach) — emitter yozilmagan | P2 |

---

## 2. ⭐ SOXTA MUVAFFAQIYAT / JIM YO'QOTISH (eng yuqori — foydalanuvchini ALDAYDI)

> 200 qaytaradi, DB yozmaydi. 501'dan BATTAR — yolg'on "saqlandi" deydi. (manba: cca-group2)

| # | Endpoint | file:line | Soxta kod | Jadval bor? | FE chaqiradi? | Severity |
|---|---|---|---|---|---|---|
| 1 | **QC approve/reject/inspector-submit (8 endpoint)** | qc-defects.controller.ts | `{orderId, approved:true}` | — | ✅ QCApproval.tsx + FinanceApproval.tsx | 🔴 P0 (0% saqlaydi; halol deferred lekin AKTIV aldov) |
| 2 | **POST /api/attendance** | general-legacy-b:205 | `id:Date.now(), created:true` | ✅ attendance | ✅ AddAttendanceDialog:55 | 🔴 P0 (eng toza tuzatiladigan — route to'qnashuvi: real handler /employee-kpi/attendance da) |
| 3 | CRM lead email | crm-leads.controller:186 | `id:Date.now(), sent:true` | ❌ | ✅ | 🟠 P1 |
| 4 | IoT sensor create | iot-sensors-main:145 | `id:Date.now()` | ✅ | ❌ (halol deferred) | 🟡 P2 |
| 5 | cfo-config / cc-prefs / ideal-rasm POST | har xil | `{success:true}` | qisman | ❌ (yonida real PUT bor) | 🟢 P3 (ma'lumot yo'qolmaydi) |
| 6 | wms-inventory / wms-stock | — | `{success:true}` | — | ❌ orphan | 🟢 P3 |

**Tuzatilgan (regress emas — 2026-06-03 commitlar):** asset depreciate/insurance/maintenance (`64d093f3`), SDSettings narx (`29d637a6`), finance inventory-counts/asset-inventory, warehouse goods-receipt lines, material create (`1a45b326`). design/orders → halol 501.

**1 ESKI DA'VO YOLG'ON:** "NotificationSettings 40 toggle jim tashlanadi" — NOTO'G'RI. `PATCH /notifications/preferences` REAL saqlaydi (topilgan echo = boshqa, ishlatilmaydigan `cc/notification-prefs`).

**Forma saqlash foizi (jonli):** ~95%+ write endpoint REAL. Eng past: **QC tasdiqlash 0%**, **IoT tablet ~10%**. ~12 soxta-muvaffaqiyat (~0.9%) ALDAYDI; ~149 halol-501 (~11%) ROST "tayyor emas".

---

## 3. ⭐⭐ YASHIRIN MUAMMOLAR — "nima buziladi va qachon" bo'yicha tartiblangan

> Bugun xato bermaydi. Egasi ko'ra olmaydi. Eng qimmatli bo'lim. (manba: cca-group6a + group6b)

### 🔴 P0 — Hozir noto'g'ri, jim
| # | Muammo | file:line | Nega jim | Nima buziladi / qachon |
|---|---|---|---|---|
| H1 | **PosMovementCompletedEvent hech qachon publish qilinmaydi** | pos-movement-status flow (0 `eventBus.publish`) | POS-ichki `current_stock` alohida inline yangilanadi, xato chiqmaydi | `warehouse_stock`+`warehouse_transactions`+`gl_posting_log` bridge O'LIK → WMS jurnal doim bo'sh (DB: warehouse_transactions=0). 2 listener (pos-wms-sync-completed, pos-gl-auto) hech qachon ishlamaydi |
| H2 | **PIP + eNPS rol darvozasi YO'Q** | pip.controller.ts:46,52,60 · enps.controller.ts:43,57,82 | JWT bor, ko'rinishda himoyalangandek | Har `manager` (×27) BARCHA xodimning maxfiy disiplinar PIP'ini o'qiydi + istalgan `employee_id`ga PIP yaratadi. Maxfiy HR ma'lumot ochiq. **Xavfsizlik teshigi** |
| H3 | **GL jurnal NOTRANZAKSION** | gl-posting.service.ts:85-120 (db.transaction YO'Q) | 2-leg balans faqat xotirada tekshiriladi | leg-1 commit + leg-2 INSERT qulasa → DB'da **balanssiz yarim-jurnal**. Sibling repolar (budget/ap/ar) to'g'ri tx ishlatadi — GL izchil emas. Moliya yaxlitligi |
| H4 | **pos-wms-sync 'kirim' hardcoded** | pos-wms-sync.service.ts:214 | INSERT muvaffaqiyatli, 200 | onMovementCreated BARCHA harakatga `transaction_type='kirim'` yozadi (chiqim/transfer ham "kirim"). WMS jurnal nuqul noto'g'ri yo'nalish |

### 🟠 P1 — Latent, ma'lumot to'lganda buziladi
| # | Muammo | file:line | Nima buziladi / qachon |
|---|---|---|---|
| H5 | **sd_sales_orders ╳ sales_orders — 2 order olam, 0 FK** | (DB: ikkalasi 12 qator, 0 FK har tomondan) | Savdo buyurtma ishlab chiqarishga AVTOMATIK o'tmaydi. "Ballonsiz mashina"ning texnik ildizi |
| H6 | **72 jadvalda order_id, faqat 1 FK** | DB-verified | Order o'chsa orphan satrlar jim to'planadi |
| H7 | **createMovement header+lines tx siz** | pos-movement.service | lines fail → yetim movement header |
| H8 | **issueStock 3 yozuv tx siz** | warehouse-config | stock kamayadi-yu movement jurnali yozilmasligi mumkin |
| H9 | **stock-ledger getBalance→+delta→insert lock yo'q** | stock-ledger.service.ts:43-56 | parallel harakatda balans clobber (hozir pos_stock_ledger=0) |
| H10 | **FIFO allocate partiyani band qilmaydi** | pos-fifo.service.ts:78-103 | over-allocation race |
| H11 | **4 parallel stock-haqiqat jadvali** | current_stock(24)/warehouse_stock(24)/material_cards.current_stock/pos_stock_ledger(0) | desync — bir material 2 xil qoldiq |

### 🟡 P2 — Sifat / izchillik
| # | Muammo | file:line | Izoh |
|---|---|---|---|
| H12 | GL entryNumber `Date.now()+Math.random()` | gl-posting.service.ts:101 | collision xavfi, idempotent emas |
| H13 | Debit/credit bir qatorga siqilgan | drizzle-gl-posting.repo + payroll:102 | trial-balance rekonstruksiya qiyin |
| H14 | pos-balance `material_type` fail-open | pos-balance-guard.service.ts:128-135 | asset DB-xatoda consumable deb baholanadi |
| H15 | Kanban roleFilter kosmetik | useKanbanBoard.ts:95 | dropdown kartalarni filtrlamaydi (maxfiylik illyuziyasi) |
| H16 | GL entryDate xom `new Date()` | gl-posting.service.ts:94 | yarim tunda non-UTC noto'g'ri kunga |
| H17 | Actor-identity body'dan | finance-advance:64,77 · payroll:79 · kanban-cards:233 | audit izi soxtalashtiriladi (privilegiya oshmaydi) |

**STALENESS tuzatishlari (5 eski da'vo NOTO'G'RI/tuzatilgan):**
- pos-balance-guard "fail-open" → endi **fail-CLOSED** ✅
- FE "useMutation onError yo'q" → **global MutationCache.onError bor** ✅
- file-upload "MIME yo'q" → **extension allowlist + size cap** (kanban+knowledge-base) ✅ High→Low
- GL "soxta trial-balance" → real repo metodga ulangan ✅
- "383/529 FK indekssiz" → DB to'ldirilgan, 1677/2239 indeksli ✅

**TO'G'RI naqshlar (false-positive — TEGMA):** warehouse-config issueStock atomik decrement (`WHERE available_quantity>=qty RETURNING`), FOR UPDATE (inventory-agent/cc), current_stock SQL-arifmetika upsert.

---

## 4. DB DRIFT (5xx sabab) — staleness tasdiqlangan

> ~40% eski drift TUZATILGAN. (manba: cca-group5)

**✅ TUZATILGAN:** `material_cards.name`→xom_ashyo (0 match, commit 80c1faaa); `warehouse_stock.material_card_id`→material_id (1 qoldiq: wms-crud.repo:162); mes_sessions start_time→started_at; erp GET JOIN'lar; erp_production_facts ustunlar DB'da BOR.

**❗ HALI AKTIV:**
| Tur | Element | Tuzatish | Egasi ruxsati? |
|---|---|---|---|
| Yo'q jadval | `gl_journal_lines` (+gl_accounts yo'q→accounts) | CREATE / DDL'ni accounts'ga moslash | ⚠️ HA |
| Yo'q jadval | `qc_approvals` | CREATE | ⚠️ HA |
| Yo'q jadval | `fi_payments` | CREATE yoki mavjud `payments`ga yo'naltir | ⚠️ HA |
| Yo'q jadval | `mes_downtime_events` (mes-maintenance.repo) | CREATE | ⚠️ HA |
| Yo'q ustun | mes_shift_handovers.incoming_supervisor · mes_maintenance_requests.assigned_to/work_center_id · wms_transactions.deleted_at · erp_downtime_logs.duration_minutes/resolved/updated_at | ALTER ADD COLUMN | ⚠️ HA |
| FK tur (uuid↔int) | mes_sessions.work_center_id(uuid)↔work_centers.id(int) → erp/capacity 503 | ALTER yoki `::text` cast (ikki jadval 0 qator → xavfsiz) | ⚠️ HA |
| FK tur | wms_transactions.material_id(int)↔mm_materials.id(uuid) → wms/transactions 503 | `::text` cast | ⚠️ HA |
| Kod-fix (nom) | internal_requests→material_id/warehouse_id · warehouse_batches→item_id (3 fayl) · production_material_balance→material_id · wms-crud.repo:162 | code-fix | yo'q |

**Nuance:** `m.name AS material_name` driftga o'xshaydi lekin `m.`=`mm_materials` (DB'da `name` BOR) → TO'G'RI. Eski hujjat chalkashtirgan.

---

## 5. MASS-FIX GROUPING (bajaruvchi uchun — strategiya bo'yicha)

| Guruh | Strategiya | Elementlar | Xavf | Egasi ruxsati? |
|---|---|---|---|---|
| **MF-1** | Auth gate qo'sh | PIP+eNPS `@Roles(HR_MANAGER,DIRECTOR,SUPER_ADMIN)` + ownership filter (H2) | xavfsiz | yo'q |
| **MF-2** | db.transaction o'rang | GL journal (H3), createMovement (H7), issueStock (H8) | o'rta | yo'q |
| **MF-3** | Event publish ula | PosMovementCompletedEvent emit qo'sh (H1) → warehouse_stock/GL bridge tiriladi | o'rta | yo'q |
| **MF-4** | Soxta→real yoki halol-501 | QC approve/reject (#1), attendance (#2), CRM email (#3) | xavfsiz | yo'q |
| **MF-5** | Hardcoded→dinamik | pos-wms-sync 'kirim'→`${transType}` (H4) | xavfsiz | yo'q |
| **MF-6** | `as unknown as T`→`typedExecute<T>` | 121 joy (Qoida 16) | xavfsiz | yo'q |
| **MF-7** | Inline rang→token | 275 joy (Qoida 21, ~60% pos-monitor) | xavfsiz | yo'q |
| **MF-8** | Kod-fix ustun nom | warehouse_batches→item_id, internal_requests→material_id, wms-crud:162 | xavfsiz | yo'q |
| **MF-9** | DDL (jadval/ustun) | gl_journal_lines, qc_approvals, fi_payments, mes_downtime_events + 6 ustun | xavfli | ⚠️ HA |
| **MF-10** | FK tur birlashtirish | mes_sessions/wms_transactions uuid↔int (`::text` yoki ALTER) | xavfli | ⚠️ HA |
| **MF-11** | Result/Array fix | 2+6 joy (Qoida 1,2) | xavfsiz | yo'q |
| **MF-12** | Duplicate route | `POST /auth/refresh` legacy handler olib tashlash | o'rta | ⚠️ tasdiq |

---

## 6. EGASI QARORI KERAK (tahlilchi HAL QILMAYDI — flag)

1. **Yo'q jadvallar (MF-9):** `gl_journal_lines`, `qc_approvals`, `fi_payments`, `mes_downtime_events` — yaratilsinmi yoki kod mavjud jadvalga yo'naltirilsinmi (Q-35).
2. **FK tur drift (MF-10):** uuid↔int — DDL ALTER yoki `::text` cast (ikkalasi ham xatarli, semantik).
3. **2 order olam (H5):** `sd_sales_orders` ╳ `sales_orders` birlashtirilsinmi (kanonik tanlash — katta arxitektura qarori).
4. **Dizayn shablon (Qoida 21):** 0 shablon komponenti bor — ListPage/FormPage poydevorini qurish katta ish, ustuvorlik egasiniki.
5. **17 orphan servis + 12 dead listener:** vizyonda kerakli (ApprovalsService, Sensors, Vendors...) — ULA yoki o'chir.
6. **QC tasdiqlash (deferred STAGE 1.3):** kanonik order-status jadval noaniq — egasi belgilashi kerak.
7. **12 noaniq servis (parallel impl):** konsolidatsiya yoki o'chirish.

---

## 7. HAR SANOQ QANDAY O'LCHANDI (qayta-tekshirish uchun)

| Da'vo | Metod |
|---|---|
| Result FAIL 2, Array FAIL 6 | `bash scripts/reviewer-result-pattern.sh` / `reviewer-array-safety.sh` |
| sql.raw 11 hammasi guard | `grep -rn "sql\.raw(" apps/api/src` + har birini fayl o'qib |
| as-unknown-as-T 121 | `grep -rn "as unknown as"` |
| inline rang 275 | `grep -rn "style={{...color:'#..."` |
| material_cards.name 0 | `grep -rn "mc\.name\|materialCards\.name"` = 0 |
| warehouse_transactions=0 | `_audit/q.cjs "SELECT count(*) FROM warehouse_transactions"` |
| sd ╳ sales_orders 0 FK | `_audit/q.cjs` constraint query |
| 72 order_id / 1 FK | `_audit/q.cjs` information_schema |
| PosMovementCompletedEvent 0 publish | `grep -rn "eventBus.publish" + event nomi` = 0 |
| PIP/eNPS no @Roles | pip.controller.ts:46 fayl o'qib |
| GL no tx | gl-posting.service.ts:85-120 fayl o'qib |
| Duplicate /auth/refresh | `node scripts/_dup-routes-scan.mjs` + qo'lda tasdiq (6/7 false-positive izoh edi) |

---

## 8. YAKUNIY XULOSA (egasiga)

**Tizim eski auditlar ko'rsatganidan ANCHA sog'lom** — kod-uslubi qoidalari deyarli tuzatilgan (143→2, 678→6), xavfsizlik asoslari mustahkam (4 guard, SQL-inj yo'q, secret yo'q), drift ~40% tuzatilgan.

**LEKIN 4 ta haqiqiy P0 yashirin muammo bor (xato bermaydi, ichdan noto'g'ri):**
1. 🔴 **PosMovementCompletedEvent o'lik** → POS sotish ombor jurnaliga/GLga yetmaydi
2. 🔴 **PIP+eNPS auth teshigi** → maxfiy HR ma'lumot har managerga ochiq
3. 🔴 **GL jurnal atomik emas** → balanssiz yarim-provodka xavfi
4. 🔴 **QC tasdiqlash soxta** → "tasdiqladim" yolg'on, DB o'zgarmaydi

Bular + 2 order olam (H5) — egasi his qilgan "ballonsiz mashina"ning aniq texnik ildizlari.

**Eng arzon yutuqlar (DDL'siz, faqat kod):** MF-1 (auth), MF-3 (event), MF-4 (soxta→real), MF-5 (hardcoded). MF-9/MF-10 (DDL) egasi ruxsatini kutadi.

> Hech narsa o'zgartirilmadi. Yagona yozuv: `docs/cca-*.md` + bu master fayl. Bajaruvchi shu katalogga tayanadi.
