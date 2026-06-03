# EUROPRINT ERP — TO'LIQ AUDIT HISOBOTI

**Sana:** 2026-05-30 · **Usul:** 81 read-only agent (50 production-audit + 31 tozalik) · har topilma kod/grep bilan tasdiqlangan (verify-don't-trust).
**Xom natijalar:** `…/tasks/wu3te87bt.output` (production), `…/tasks/wn7y7u9gy.output` (tozalik).

---

## 0. XULOSA (Executive Summary)

EuroPrint — to'liq enterprise ERP (BE 2,552 fayl · FE 2,450 fayl/906 sahifa · 696 pgTable · ~800 DB jadval · 43–50 modul).
Kompilyatsiya butun (BE+FE tsc 0), lekin:

- **Production'ga bugun XAVFSIZ EMAS** — pul/stok amallari atomik emas, DB-daraja himoya yo'q, ba'zi endpoint auth'siz, pul testi yo'q.
- **~35% to'liq ishlaydi · ~45% qisman · ~20% stub.** Asosiy to'siq "yomon kod" emas, **ulanmaganlik + tartibsizlik** edi
  (dalil: bitta POS SSO tuzatish ~80% funksiyani ochdi).
- **Jonli tizimda REAL pul buglari bor** (INPS stavkasi 8–12× farq qiladi — quyida).

**Asosiy raqamlar:**
| Audit | Topilma |
|---|---|
| Production (11 qatlam) | **26 CRITICAL · 62 HIGH · 79 MEDIUM · 32 LOW** (199) |
| Tozalik (A–I) | **88 DUP · 39 DEAD · 17 STUB · 35 WIRED-STUB · 31 DRIFT** (215), 147 DANGER |

**TAVSIYA (quyida §6 batafsil):** joyida tozalash (C) — TOR doirada (ishlatadigan modullar + pul buglari + 9 gate). v2 tozaroq, lekin og'irroq + tashlab ketish xavfi (eski `pos-v2` allaqachon tashlangan).

---

## 1. PRODUCTION-READINESS AUDIT — 26 CRITICAL

### Qatlamlar bo'yicha (CRITICAL/HIGH)
| Qatlam | C | H |
|---|---|---|
| Security (auth/authz/token) | 4 | 6 |
| DB Integrity & Transactions | 9 | 15 |
| Business Logic (GL/inventory/payroll) | 7 | 11 |
| Input Validation | 0 | 10 |
| Architecture & Duplication | 1 | 4 |
| Error Handling | 0 | 2 |
| Testing | 2 | 7 |
| Observability | 0 | 2 |
| Performance | 2 | 2 |
| Infra/Secrets/Backup | 1 | 1 |

### 26 CRITICAL ro'yxati (joy + muammo)
**Xavfsizlik (4):**
1. `general-legacy-a.controller.ts:46-74` — /face-embeddings, /attendance* GET endpointlari **@UseGuards YO'Q** (auth'siz).
2. `general-legacy-a.controller.ts:79-169` — /papka-orders, /machine-tasks, /planning/operations (GET/POST/PATCH/DELETE) auth'siz.
3. `mini-app.controller.ts:54` — butun controller `@Public()` (JWT bypass; faqat x-tg-session).
4. `admin.seed.ts:6` — default parol fallback `'Admin123!'`.

**DB yaxlitlik & tranzaksiya (9):**
5. `hr/payroll/payroll.service.ts:77-86` — payroll closure 4 ta DB amali transaction'siz (yarim-yiqilish).
6. `finance/domain/services/gl-posting.service.ts:97-116` — GL qatorlari alohida insert; #3 yiqilsa #1-2 committed (balanssiz).
7. `hr/payroll/drizzle-hr-payroll.repo.ts:101-102` — debit_account VA credit_account bir xil qiymat (GL semantikasi buzilgan).
8. `pos/.../pos-wms-sync.helpers.ts:82-117` — upsertWarehouseStock locking/isolation yo'q (race).
9. `pos/.../stock-reservation.service.ts:44-82` — SELECT→INSERT transaction'siz (oraliqda boshqa rezerv).
10. `pos/.../pos-wms-sync.service.ts:95-110` — ketma-ket upsert atomik emas (qisman sync).
11. `lib/db/schema/wms-schema.ts:391-409` — warehouse_stock (warehouse_id,material_id) UNIQUE yo'q.
12. `lib/db/schema/fi-gl.ts:193-204` — glLines double-entry CHECK/trigger yo'q.
13. `shared/db/migrations/` (46 fayl) — versiyalanmagan ad-hoc nom (drift-fix-*).

**Biznes mantiq (5):**
14. `finance/.../finance.dto.ts:71` — GL document Zod `z.record(z.unknown())` (validatsiya yo'q, ixtiyoriy JSON).
15. `finance-accounting.service.ts:36-44` — createGlDocument debit/credit balansini tekshirmasdan insert.
16. `pos-schema-v2.ts` (batchId×4) — pos_batches jadvali ta'rifi YO'Q, FK osilgan.
17. `pos-schema-v2.ts:71` — posMovements idempotencyKey YO'Q (retry → dublikat harakat).
18. `fi-gl.ts:142` — glDocuments accounting_period FK yo'q; yopilgan davrga yozish mumkin.

**Pul (payroll) — eng xavfli:**
19. `finance-extended-payroll.service.ts:19` — INPS=0.08, lekin canonical 0.01 (8× farq).
20. `TaxCalculator.tsx:14` — pension 0.001 (0.1%) — 1% o'rniga 10× kam.
22. `gl-posting.service.ts:72-83` — payroll GL formulasi balanssiz (inps≠0 da debit≠credit).

**Test/Perf/Infra (5):**
23. `apps/api/test` — 17 E2E, faqat 2 ta moliyaviy; Order→Invoice→AR, payroll GL uchun ZERO test.
24. `wms-schema.ts:391-409` — warehouse_stock 0 index (hot path).
25. `pos-inventory-count-query.repository.ts:72` — SELECT ichida subquery (500+ qator = 500+ subquery, N+1).
26. **`.env:14-26` git'ga commit qilingan — JWT_SECRET va 4 ta real secret ochiq.** ← darhol rotatsiya.

---

## 2. TOZALIK XARITASI — 215 finding

**Tur:** 88 DUPLICATE · 39 DEAD (27 o'chsa bo'ladi) · 17 STUB · **35 WIRED-STUB** (tugallanmagan feature, o'chirma) · 31 DRIFT.
**Kategoriya:** A const 11 · B types 14 · C utils 19 · D routes 6 · E dead 28 · F stubs 17 · G shim 8 · H tables 33 · I arch 35.

### 🔴 DANGER ZONE — qiymati FARQ qiladigan duplikatlar = LATENT BUGLAR
| ID | Muammo | Joy |
|---|---|---|
| DUP-TAX-001/005 | **INPS 0.01 vs 0.08 vs 0.12** (4-6 fayl) → payroll 8-12× xato | business.constants:124 · finance-extended-payroll:19 · finance-payroll.repo:13 · calculate-payroll.handler:20 |
| DUP-CONST-005 | Schema default **teskari**: inps='0.12' jshd='0.01' | schema-hr-lms.ts:59-60 |
| DUP-TAX-003/004 | Pension FE 0.001 vs BE 0.01 (10× kam) | TaxCalculator.tsx:14 |
| DUP-ROLE-001 | rollar `super_admin` vs `SUPER_ADMIN` (3 xil enum) | roles.constants:8 · role.enum:6 · user.aggregate:11 |
| DUP-STATUS-ORDER-001 | **4 xil order state-machine** turli transition | order-status.vo · orders.constants · sales-order-transitions |
| DUP-STATUS-MOVEMENT-001 | movement enum 10 holat vs 6 holat | movement-enums.ts · pos.dto.ts · status-machines.constants |
| DUP-EMPLOYEE/USER/INVOICE-001 | bir entity 3 xil interfeys (data loss) | lib/types vs FE vs page-local |

### Boshqa muhim
- **3 parallel movement tizimi:** `pos-movement` · `pos-operations` · **`pos-v2`** (oxirgisi tashlangan stub) — birlashtirish kerak.
- `status-machines.constants.ts` — IKKI fayl **bayt-ma-bayt IDENTIK** (oson o'chirish).
- **35 WIRED-STUB** — jonli route'ga ulangan, lekin real logikasiz (hr-dashboard, wms-catalog, wms-barcode, crm-activities, sd-customers, mm-goods, pos-stub, marketing-analytics-stubs...) = tugallanmagan feature.

---

## 3. 6-FAZA TOZALASH BACKLOG (past xavfdan, har faza verifikatsiyalanadi)

| Faza | Nima | Soni | Verifikatsiya |
|---|---|---|---|
| **1** | Dup konstanta: avval DANGER stavkalar (odam aniqlaydi to'g'ri qiymat), keyin identik → import | A 11 | tsc 0, payroll test, grep 1 manba |
| **2** | Dup tip/DTO → packages/shared; dup util/logika → EP/ui + shared | B 14 + C 19 | tsc 0, FE↔BE parity test |
| **3** | Dead dup route o'chirish (NestJS bind aniqlanadi) | D 6 | dup-routes-scan 0, route probe |
| **4** | Isbotlangan dead kod (27 YES) + bypassed shim | E 39 + G 8 | grep 0-ref, tsc 0, build |
| **5** | db.*→repo (17), katta fayl bo'lish, mexanizm birlashtirish (pos-movement/operations/v2) | I 35 | ESLint no-db, tsc 0 |
| **6** | PLAN-ONLY: divergent jadval + 35 wired-stub → ODAM qarori | H 33 + 35 | migration + backfill reja |

**Eng yuqori qiymat / past xavf (shu yerdan):** E dead (27) + I arch quick-win (10) + C util (19) — eng ko'p kod, eng kam xavf.

---

## 4. PREVENTION KONSTITUTSIYASI (31 root-cause → 9 qoida, har biri MASHINA-GATE)

> Prinsip: machine-gate inson intizomidan uzoq yashaydi. Bu loyihaning CLAUDE.md'i eskirgan → hujjat enforcement EMAS.

| # | Qoida | Gate |
|---|---|---|
| 1 | Shared konstanta/enum bitta joyda, import | ESLint no-restricted-syntax (soliq literal) + CI grep |
| 2 | Har tushuncha bitta DTO (packages/shared) | ESLint import rule |
| 3 | Bir biznes-logika bitta service; FE BE hisobini takrorlamaydi | FE↔BE parity test |
| 4 | Route path bir marta | CI route-uniqueness (dup-routes-scan=0) |
| 5 | Dead kod merge yo'q | CI `knip`/`ts-prune` |
| 6 | Jonli route'da soxta-success yo'q | check-no-new-stubs + real-call-path test |
| 7 | Bir jadval bitta kanonik; runtime DDL yo'q | schema-uniqueness check + boot DDL ban |
| 8 | Service'da to'g'ridan db.* yo'q | ESLint no-restricted-syntax |
| 9 | CI HAQIQIY: `\|\| true` yo'q, --max-warnings 0, test pass; fayl-hajmi cap | ci.yml fix (rule zero) |

**Enforcement setup tasklari (⚡ quick win):** ① ci.yml `\|\| true` olib tashlash · ② ESLint db.* ban · ③ const-literal ban · ④ knip · ⑤ route/schema uniqueness · ⑥ FE↔BE parity test · ⑦ file-size warn · ⑧ CLAUDE.md → faqat gate ro'yxati.

---

## 5. DARHOL CHORALAR (production-blocker)
1. **`.env` secretlarini rotatsiya qiling** + git tarixidan olib tashlang (#26).
2. Auth'siz endpointlarni yoping (#1-3).
3. To'g'ri INPS/JSHD/pension stavkasini aniqlang (CFO/HR) — payroll hozir noto'g'ri.
4. Pul/stok amallarini transaction'ga o'rang (#5-10) + idempotency (#17).

---

## 6. QAROR: joyida tozalash (C) vs v2 (B)

| Mezon | C (joyida) | B (v2) |
|---|---|---|
| Boshlash | ✅ oson, tizim live | ❌ skelet+port+cutover |
| Qisqa muddat xavf | 🟢 past | 🟡 o'rta |
| Uzoq muddat tozalik | 🟡 gate bilan | 🟢 toza struktura+gate |
| **Tashlab ketish xavfi** | 🟢 yo'q | 🔴 yuqori (`pos-v2` allaqachon tashlangan) |
| Data (DB) | tegilmaydi | tegilmaydi (bir xil DB) |

**Tavsiya:** **C — TOR doirada.** Butun 215 ni emas, faqat: (1) ishlatadigan modullar (Ombor+POS, Finance, HR, Sales), (2) DANGER pul buglari, (3) 26 CRITICAL himoya o'sha modullarga, (4) 9 gate. Bu — warehouse'da isbotlangan yo'l. v2 ni faqat strukturaviy tartibsizlikdan butunlay qutulmoqchi bo'lsangiz + tugatishga qat'iy bo'lsangiz tanlang.
