# EUROPRINT ERP — MASTER EXECUTOR PROMPT

> **Bajaruvchi:** Muslimbek (Claude Code, alohida sessiya)
> **Maslahatchi:** Claude (vizyon/direktiv sessiyasi — faqat hujjat, KOD YOZMAS)
> **Bu faylni har sessiya boshida o'qi.** Uzoq bo'lsayam — muhim.

---

## QISM A: DOIMIY KONTEKST (har sessiya, o'zgarmaydi)

---

### A.1 Loyiha haqida

EuroPrint ERP — O'zbekistondagi yirik gofra/offset qadoqlash zavodining boshqaruv tizimi.
20 ta modul: SD (savdo) → PP (reja) → MES (ijro) → QC (sifat) → WMS (ombor) → FIN (moliya) + HR, CRM, AI/IoT, DIR va boshqalar.

**Holat (2026-06-18):** Loyiha ~8 oy davomida qurildi (avval kod, keyin audit — noto'g'ri usul).
V2 qayta qurilmoqda: avval poydevor, keyin har modul bosqichma-bosqich.

**Vizyon (muhim):**
- Har lavozim = KARTA (`org_function`). Karta = ta'rif + razryad + talab + darslik + oylik formula + AI moslik.
- Buyurtma keladi → AI 7 qadam bilan reja tuzadi → menejer tasdiqlaydi → ijro.
- Har mashina IoT sensor bilan kuzatiladi → anomaliya → avtomatik to'xtatish.
- Direktor real-time zavod holati ko'radi (Andon taxtasi).

---

### A.2 Texnologiya Steki

| Qatlam | Texnologiya |
|--------|-------------|
| BE Framework | NestJS 11 + Fastify |
| ORM | Drizzle ORM (tip-xavfsiz) |
| DB | PostgreSQL 16 |
| Xato pattern | `Result<T>` — `Ok(value)` / `Err(message)` |
| FE | React 19 + Vite + TanStack Query |
| Validatsiya | Zod (DTO va Env schema) |
| Package manager | pnpm workspace |
| Test | Jest |
| CI | GitHub Actions |

**Muhim fayl yo'llari:**
```
apps/api/src/modules/[modul]/  ← BE modul kodlari
lib/db/src/schema/             ← Drizzle schema fayllar
artifacts/erp-dashboard/src/   ← FE sahifalar va komponentlar
docs/migration/                ← SQL migration fayllar (APPROVED belgi kerak)
docs/V2-REBUILD/Backend_Reja/  ← Har bosqich texnik spec
STANDARTLAR.md                 ← ⭐ AGENT QOIDA HUJJATI (har sessiyada o'qi)
LOYIHA_QOIDALARI.md            ← 17 bo'lim konstitutsiya
DIZAYN_QOIDALARI.md            ← EP Design System (#FF902F orange, tokenlar)
```

---

### A.3 Kanonik Jadvallar (yagona haqiqat)

**To'liq ro'yxat:** STANDARTLAR.md §1. Bu yerda kritik tezkor ro'yxat:

```
✅ KANONIK                    ❌ TEGMA (o'rniga kanonikni ishlatgin)
---------------------------------------------------------------------------
sales_orders                  orders (two-worlds muammo)
warehouse_stock               stocks, wms_stock
entries (GL)                  gl_journal_entries, gl_lines (SAP#76)
technology_cards              tech_cards (order-bound, master emas)
work_centers                  pp_work_centers (deprecated)
org_functions                 positions (0 FK, legacy)
material_cards                materials, mm_materials
unit_of_measures              units (deprecated)
current_stock                 ← VIEW, INSERT/ALTER TAQIQ
mes_shift_handovers           ← VIEW, INSERT TAQIQ (shift_handovers ga yoz)
```

---

### A.4 Modul Bog'liqligi

```
auth → org → hr → sd → wms
                  ↓     ↓
                  pp → mes → qc → wms (tayyor mahsulot)
                              ↓
                          fin (GL posting)
                              ↑
hrm (ish haqi) ──────────────┘
crm → sd (deal → order)
iot → mes (anomaliya)
ai → pp (plan) + mes (OEE)
dir ← barcha modullardan (o'qish)
```

**Oltin zanjir:** `SD → PP → MES → QC → WMS → FIN`
Tekshirish: `node scripts/golden-thread-chain-proof.cjs`

---

### A.5 Muhim Qoidalar (buzilmaydi)

**Q-30:** JWT token yaratma. Maxfiy ma'lumotlarni (parol, API key, token) hech qachon log, response, yoki boshqa agentga berma.

**Q-35:** DDL (CREATE TABLE, ALTER TABLE, DROP) faqat egasi "ha" deguncha. Migration faylda `-- APPROVED: owner (sana)` belgi shart.

**Q-45:** Log fayllar (`backend.log*`, `*.log.*`) hech qachon git da.

**Q-46:** Ishlab turgan kod o'chirilmaydi. Buzilgan/fake/stub kod to'liq o'chiriladi.

**Q-47:** Direktiv hujjatlar ≥1000 qator (padding emas — mazmunan to'liq).

**SAP#76:** `gl_journal_entries` va `gl_lines` jadvallariga TEGMA.

**git:** `git add <aniq-fayl>` faqat. `git add -A` va `git add .` = TAQIQ.

**Bir bajaruvchi:** Bir vaqtda faqat bitta sessiya ishlaydi. Parallel clobber yo'q.

---

### A.6 Sessiya Boshida O'qi (avtomatik CLAUDE.md da)

```
1. STANDARTLAR.md      ← §1 (kanonik jadvallar) + §15 (tarixiy xatolar)
2. LOYIHA_QOIDALARI.md ← 17 bo'lim konstitutsiya
3. DIZAYN_QOIDALARI.md ← EP design system
4. docs/V2-REBUILD/Backend_Reja/00_Indeks.md ← joriy bosqich holati
```

---

### A.7 Sessiya Boshida Majburiy Tekshiruvlar

Har sessiyada bu buyruqlarni bajar:

```bash
# 1. TypeCheck (0 xato bo'lishi kerak):
npx tsc -p apps/api/tsconfig.json --noEmit

# 2. Oltin zanjir holati:
node scripts/golden-thread-chain-proof.cjs

# 3. Agar jadval ishlatsang — DB da bormi:
node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name='[jadval_nomi]'"

# 4. Commit (har o'zgarishdan keyin):
git add <aniq-fayl> && git commit -m "feat: ..."
```

---

## QISM B: FAZ PROMPTLARI

Har faz uchun alohida prompt. Egasi qaysi fazani buyursa — shu bo'limni qo'sh.

---

### FAZ-00: POYDEVOR (auth + org + CI)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 0 (Poydevor) ustida ishlaysiz.

Maqsad: Auth, RBAC, org tuzilma, audit log va CI/CD poydevorini mustahkamlash.

Joriy holat:
- JwtAuthGuard, RolesGuard, SodGuard, PermissionGuard — 4 global guard mavjud
- JWT: JWT_SECRET/JWT_REFRESH_SECRET env dan (alohida)
- org_functions (29 FK hub) — kanonik karta
- razryad_levels (1-6) — mavjud
- audit_log — mavjud (append-only)

Bu sessiyada bajaring:
1. JWT algorithms: ['HS256'] explicit pin qo'shing (SEC-6)
2. Barcha @UseGuards → @Roles ham bor ekanini tekshiring (SEC-1)
   grep -rn "@UseGuards" apps/api/src/ | grep -v "@Roles\|@Public"
3. Har topilgan endpoint ga @Roles qo'shing

Qoidalar:
- Q-35: DDL faqat egasi "ha" degandan keyin
- git add <aniq-fayl>
- tsc 0 ta'minlang
```

---

### FAZ-01: ORG + HR (karta-markaz model)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 1 (Org + HR) ustida ishlaysiz.

Karta-markaz model:
- org_function = KARTA (lavozim ta'rifi + razryad + talab + formula + AI)
- Xodim kartaga bog'lanadi (aksincha emas)
- Razryad → talab → o'sish → oylik formula

Joriy holat (2026-06-18):
- razryad_levels (✅), org_functions (✅, 13 yangi ustun)
- org_function_ai_assessments (🔲 kerak)
- hr_razryad_history (🔲 kerak)

Bu sessiyada bajaring (egasi tasdiqlagan vazifa ko'rsatiladi):
[EGASI VAZIFANI QIYMATINI KIRITADI]

Qoidalar: §15 SEC-1 (guards), FAKE-1 (stub emas), DB-6 (default majburiy)
```

---

### FAZ-02: SD (savdo va buyurtmalar)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 2 (SD — Sales Distribution) ustida ishlaysiz.

Kanonik jadval: sales_orders (INT PK). orders jadvaliga TEGMA.
SD → PP bog'liq: SalesOrderConfirmedEvent emit qilishi kerak.

Joriy holat:
- sales_orders, sd_customers, sd_order_departments — mavjud
- CRM integratsiya (deal → order) — yo'q
- AI narxlash — yo'q

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: TWO-1 (sales_orders kanonik), EVT-3 (backbone link)
```

---

### FAZ-03: PP (ishlab chiqarish rejasi)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 3 (PP — Production Planning) ustida ishlaysiz.

Kanonik jadvallar:
- technology_cards (MASTER — ALTER qilingan 2026-06-18)
- tech_cards (ORDER-BOUND — master sifatida TEGMA)
- work_centers (kanonik — 12 ta mavjud)
- work_orders (PP → MES)

AI 7-qadam planner:
1. Material tekshiruv → 2. Rezerv → 3. Marshrut → 4. CRP → 5. Jadval → 6. Tayinlash → 7. Tasdiqlash

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: DB-5 (timestamptz regex xato), API-6 (to'g'ri ustun nomlari)
```

---

### FAZ-04: MES (ishlab chiqarish ijrosi)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 4 (MES — Manufacturing Execution) ustida ishlaysiz.

Kanonik jadvallar:
- work_orders, production_sessions, mes_operations
- shift_handovers (KANONIK yozuv jadvali)
- mes_shift_handovers (VIEW — faqat o'qish!)
- iot_readings (APPEND-ONLY, o'chirilmaydi)

MES → QC zanjir:
WorkOrderCompletedEvent → quality_check yaratilishi (stub emas, REAL)

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: DB-1 (VIEW ga ALTER taqiq), EVT-1 (CQRS vs EventEmitter2)
Spec: docs/V2-REBUILD/Backend_Reja/07_Bosqich4_MES.md
```

---

### FAZ-05: QC (sifat nazorati)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 5 (QC — Quality Control) ustida ishlaysiz.

Kanonik jadvallar:
- quality_checks, quality_check_items, defect_reports
- defect_catalog (lookup, seed kerak)
- ai_camera_detections (APPEND-ONLY)

Oqim: MES WorkOrderCompletedEvent → QC yaratish → PASS/FAIL → WMS

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: FAKE-6 (listener stub emas), EVT-1 (event mexanizm)
Spec: docs/V2-REBUILD/Backend_Reja/08_Bosqich5_QC.md
```

---

### FAZ-06: WMS (ombor)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 6 (WMS — Warehouse Management) ustida ishlaysiz.

Kanonik jadvallar:
- warehouse_stock (BITTA yozuv joyi)
- warehouse_transactions (append-only)
- current_stock (VIEW — INSERT/ALTER TAQIQ)

stocks, wms_stock = TEGMA.

POS sync: TYPE_MAP bilan ('kirim'/'chiqim' hardcoded emas).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: TWO-4 (stock kanonik), API-3 (hardcoded type taqiq)
Spec: docs/V2-REBUILD/Backend_Reja/09_Bosqich6_WMS.md
```

---

### FAZ-07: FIN (moliya)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 7 (FIN — Finance) ustida ishlaysiz.

Kanonik jadval: entries (GL).
⛔ SAP#76: gl_journal_entries, gl_lines TEGMA.

GL posting: db.transaction() MAJBURIY. Debit = Kredit tekshiruvi.

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: API-1 (atomic transaction), TWO-3 (entries kanonik)
Spec: docs/V2-REBUILD/Backend_Reja/10_Bosqich7_FIN.md
```

---

### FAZ-08: CRM (mijoz munosabatlari)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 8 (CRM) ustida ishlaysiz.

Kanonik jadvallar: crm_leads, crm_deals, crm_contacts, crm_activities.
MUHIM: crm_deals.assigned_by_id NOT NULL → fallback zanjiri majburiy.
UUID ↔ INT mismatch bo'lmaydi (lead.id INT, deal.lead_id INT).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: DB-7 (fallback zanjir), TWO-2 (type mismatch)
Spec: docs/V2-REBUILD/Backend_Reja/11_Bosqich8_CRM.md
```

---

### FAZ-09: AI/IoT

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 9 (AI/IoT) ustida ishlaysiz.

Kanonik jadvallar:
- iot_readings (APPEND-ONLY, HECH QACHON o'chirilmaydi)
- iot_alerts, ai_production_plans, ai_demand_forecasts

IoT anomaliya → MES pause + DIR Andon + NTF: REAL (no-op emas).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: FAKE-7 (listener real harakat), FAKE-8 (zero-listener taqiq)
Spec: docs/V2-REBUILD/Backend_Reja/12_Bosqich9_AI_IOT.md
```

---

### FAZ-10: DIREKTOR PANELI

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 10 (DIR — Director) ustida ishlaysiz.

DIR = barcha modullardan o'qiydi (yozmaydi).
Real-time: WebSocket Andon. Snapshot: kunlik cron 23:55.
Moliya: entries jadvalidan (accounts.code bo'yicha GROUP).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Spec: docs/V2-REBUILD/Backend_Reja/13_Bosqich10_DIR.md
```

---

### FAZ-11: HR (xodimlar)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 11 (HR) ustida ishlaysiz.

Kanonik: hr_employees, hr_leave_requests, hr_documents, payroll_periods.
Ish haqi: INPS 8%, NDFL 12%, razryad koeffitsienti × base_salary.
GL: PayrollClosedEvent → FIN entries (atomic).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]
```

---

### FAZ-12: MM (materiallar va xarid)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 12 (MM — Materials Management) ustida ishlaysiz.

Kanonik: material_cards, purchase_orders, purchase_order_items.
mm_purchase_order_lines = YO'Q jadval (to'g'ri: purchase_order_items).
Xarid qabul → WMS (warehouse_transactions) + FIN (GL kreditorlik).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: NAM-1 (jadval nomi taxmin taqiq)
```

---

### FAZ-13: LMS (o'quv tizimi)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 13 (LMS) ustida ishlaysiz.

Karta-markaz: darslik → karta (org_function) ga bog'liq, xodimga emas.
Razryad oshishi → yangi darsliklar tavsiya.

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]
```

---

### FAZ-14: KAN (kanban vazifalar)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 14 (KAN — Kanban) ustida ishlaysiz.

Kanban drag: status_id (coarse FK) yangilanadi.
Fine state → status_description (TEXT), CHECK constraint buzilmaydi.

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: API-7 (controller logika emas)
```

---

### FAZ-15: CC (muvofiqlashtirish / coordination)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 15 (CC) ustida ishlaysiz.

MUHIM: manager_id 0 yoki NULL bo'lsa CC MANAGER_OF_SENDER throw qiladi.
Backfill: 30+ xodimning manager_id NULL — tuzatish kerak.

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: DB-7 (fallback zanjir)
```

---

### FAZ-16: NTF (xabarnomalar)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 16 (NTF — Notifications) ustida ishlaysiz.

Push, email, in-app xabarnomalar.
Kanal: IoT anomaliya, low stock, approval kerak, ish haqi.

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]
```

---

### FAZ-17: MKT (marketing)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 17 (MKT) ustida ishlaysiz.

NPS, blog, byudjet, kampaniya — real DB dan (stub emas).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: FAKE-2 (empty array taqiq)
```

---

### FAZ-18: POS (savdo nuqtasi / ombor)

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 18 (POS — Point of Sale / Warehouse monitor) ustida ishlaysiz.

POS = zavod omborining kirim/chiqim interfeysi (kassir emas!).
POS harakatlar → warehouse_transactions → warehouse_stock.
TYPE_MAP: 'kirim'/'chiqim' hardcoded emas — event type dan maplanadi.

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: API-3 (hardcoded type), API-2 (unit_of_measure vs unit)
```

---

### FAZ-19: IoT OPERATOR TABLET

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 19 (IoT operator tablet) ustida ishlaysiz.

Tablet = oddiy interfeys (QR skanerlash, qty kiritish).
@Public() ← TabletTokenGuard + IP whitelist (izoh bilan!).
Production session yoziladi → work_order progress yangilanadi.

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: SEC-2 (@Public izoh), DIZAYN_QOIDALARI.md (oddiy UI)
```

---

### FAZ-20: AUDIT VA TOZALASH

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 20 (Audit va tozalash) ustida ishlaysiz.

Maqsad: FAKE/stub lar topish va 501 bilan almashtirish yoki to'ldirish.
Tekshiruv: grep -rn "return { ok: true }\|return { data: \[\]" apps/api/src/

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: §15 FAKE-1..FAKE-9 — har stub ni tekshir
```

---

### FAZ-21: DEPLOY VA CI

```
Siz EuroPrint ERP ning bajaruvchisisiz. Faz 21 (Deploy va CI) ustida ishlaysiz.

CI pipeline: tsc + test + build + pre-commit checks.
Deploy: docker compose up --build + healthcheck 127.0.0.1 (localhost emas!).

Bu sessiyada bajaring: [EGASI VAZIFANI KIRITADI]

Qoidalar: PRC-3 (IPv6/IPv4), 15_DevOps.md
Spec: docs/V2-REBUILD/Backend_Reja/15_DevOps.md
```

---

## QISM C: FAZ BOSHIDA STANDART FORMAT

Har sessiya boshi uchun quyidagi format ishlatiladi:

```
=== SESSIYA BOSHI ===
Sessiya: [FAZ nomi] — [sana]
Oldingi sessiya: [commit hash] / [nima qilingan]
Bu sessiya maqsadi: [aniq maqsad]
Tekshirish: tsc 0 ✅ | golden-thread ✅

Boshlashdan oldin o'qiganman:
☑ STANDARTLAR.md §1 + §15
☑ LOYIHA_QOIDALARI.md
☑ docs/V2-REBUILD/Backend_Reja/[joriy-faz].md

=== ISHLASH ===
[Kod yoziladi]

=== SESSIYA YAKUNI ===
Qilingan: [nima qilindi]
Commit: [hash]
tsc: 0 ✅ | test: PASS ✅
Keyingi: [nima qoldi]
```

---

*EuroPrint ERP Master Executor Prompt · Versiya: 2026-06-18*
*Maslahatchi: Claude · Bajaruvchi: Muslimbek*
