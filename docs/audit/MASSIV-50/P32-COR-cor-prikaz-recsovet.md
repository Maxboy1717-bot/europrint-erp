# P32 — COR: Prikazlar registry + Rek-Sovet + workflow_rules + dashboard + crons

> **Paket:** P32 · **Modul:** COR · **To'lqin:** Wave 2 · **Bog'liqlik:** P31 (COR council/protocol)
> **DDL Darvozasi:** HA — migration fayllar GATED (egasi ruxsati shart)
> **Yozilgan:** 2026-06-19 · Bajaruvchi: Muslimbek

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiya boshida quyidagilarni o'qi:
`CLAUDE.md` → `docs/agent-constitution.md` → `LOYIHA_QOIDALARI.md` → ushbu fayl.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. `Result<T>` hamma repo/service metodida; `throw`/`null`/`undefined` qaytarish TAQIQ.
2. `@Body` Zod bilan validate qilinadi; `class-validator` TAQIQ.
3. Drizzle ORM ishlat; raw SQL faqat ORM bilan ifodalab bo'lmaydigan murakkab so'rovlar uchun (izoh + `typedExecute<T>`).
4. **Q-40** — ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + jonli DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46** — ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat/stub kod TO'LIQ o'chiriladi (chala qoldirilmaydi).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31):** faqat ushbu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35):** `CREATE TABLE` / migration faqat egasi ruxsati bilan ishga tushiriladi. Migration faylida `-- APPROVED: <egasi> <sana>` izoh shart. Faylni YOZ, lekin GATED belgila, PSQL bilan BAJARMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** — log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: `BE tsc 0`, `FE tsc 0`, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. "V2" / "Strangler Fig" / "V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu yerda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + `MUSLIMBEK-PROMT-13-COR-2026-06-08.md`); kod vizyonga zid ishlasa = xato.

**Bu agent WAVE 2 da ishlaydi. P31 (COR council/protocol) tugaganidan keyin boshlanadi.**
Boshlamadan oldin P31 ning commit-larini va `council_protocols`, `council_protocol_decisions` jadvallarini tasdiqla.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil:**

```
BE — Migrations (GATED):
  apps/api/src/shared/db/migrations/cor-p3-company-orders.sql          [YANGI — GATED]
  apps/api/src/shared/db/migrations/cor-p4-rec-council-workflow-dashboard.sql  [YANGI — GATED]

BE — Company Orders (prikazlar):
  apps/api/src/modules/director/infrastructure/repositories/company-orders.repository.ts  [YANGI]
  apps/api/src/modules/director/domain/repositories/i-company-orders.repo.ts             [YANGI]
  apps/api/src/modules/director/application/company-orders.service.ts                    [YANGI]
  apps/api/src/modules/director/presentation/company-orders.controller.ts                [YANGI]
  apps/api/src/modules/director/presentation/dto/company-orders.dto.ts                   [YANGI]

BE — Rek-Sovet:
  apps/api/src/modules/director/infrastructure/repositories/rec-council.repository.ts    [YANGI]
  apps/api/src/modules/director/domain/repositories/i-rec-council.repo.ts               [YANGI]
  apps/api/src/modules/director/application/rec-council.service.ts                      [YANGI]
  apps/api/src/modules/director/presentation/rec-council.controller.ts                  [YANGI]
  apps/api/src/modules/director/presentation/dto/rec-council.dto.ts                     [YANGI]

BE — Crons:
  apps/api/src/modules/director/infrastructure/crons/coordination-cron.service.ts       [YANGI]

FE:
  artifacts/erp-dashboard/src/pages/coordination/PrikazlarListPage.tsx     [YANGI]
  artifacts/erp-dashboard/src/pages/coordination/PrikazlarFormPage.tsx     [YANGI]
  artifacts/erp-dashboard/src/pages/coordination/RecCouncilPage.tsx        [YANGI]
  artifacts/erp-dashboard/src/pages/coordination/WorkflowRulesPage.tsx     [YANGI]
  artifacts/erp-dashboard/src/pages/CoordinationPage.tsx                   [MAVJUD — extend]
```

**DDL DARVOZASI:**
- `cor-p3-company-orders.sql` — `company_orders` + `order_acknowledgements` jadvallarini yaratadi.
- `cor-p4-rec-council-workflow-dashboard.sql` — `rec_council_sessions` + `rec_council_zvs_items` + `workflow_rules` + `smena_checklist_templates` jadvallarini yaratadi.
- Ikkala migration faylini YOZ, lekin `psql` / `db.execute` bilan BAJARMA.
- Faylda `-- APPROVED: <egasi> <sana>` placeholder qoldir. Egasi stamp qilgach bajariladi.

**H4 two-world tekshiruvi (MUHIM — boshlamadan bajar):**
```sql
-- Mavjud `orders` jadvalini tekshir (ishlab-chiqarish "orders" dunyosi bilan to'qnashuv)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('orders','company_orders','official_orders','prikazlar');
```
Agar `orders` jadvali mavjud bo'lsa va ishlab-chiqarishga tegishli bo'lsa — `company_orders` nomini ishlat (to'qnashuv yo'q). `prikazlar` yoki `official_orders` faqat egasi ruxsati bilan.

**Chegaralar (EP-COR-051 / E4):**
- `rasporyazhenie` lifecycle → **Kanban** moduli egasi. COR faqat `created_kanban_task_id` saqlab qoladi.
- ZVS/ZNO hayot aylanishi → **Finance / Director ZVS** moduli. Rek-Sovet faqat qaror (`decision`) yozadi, ZVS ning asosiy holatini o'zgartirmaydi.
- Priladka (setup time) web-form → **IoT tablet**. COR faqat o'qib ko'rsatadi.
- Smena checklist bajarish → **IoT tablet**. COR faqat `smena_checklist_templates` tavsifini beradi.
- Downtime log → **kanonik jadval** (HR-082 bilan umumiy); yangi jadval yaratilmaydi — mavjud jadvalga `coordination_ref` FK qo'shish kerak bo'lsa, egasidan so'ra.

---

## 2. VIZYON

**Manba:** `docs/audit/MUSLIMBEK-PROMT-13-COR-2026-06-08.md` (PHASE 5 + PHASE 6) · EP-COR-019..025 + EP-COR-015..018 + EP-COR-026..028 + EP-COR-119/131/134/135.

### 2.1 Prikazlar (Company Orders) registry — EP-COR-019..025/049/056..061/132

**Maqsad:** EuroPrint kompaniyasining rasmiy buyruqlari (prikazlar) yagona registrda yuritiladi. 4 kategoriya (EP-COR-057):

| Kategoriya | Prefix | Seriya |
|---|---|---|
| Kadrlar | K | K-2026-001, K-2026-002 … |
| Asosiy | OD | OD-2026-001 … |
| Moliya | F | F-2026-001 … |
| Xo'jalik | AX | AX-2026-001 … |

> ⚠️ **MOSLIK ESLATMASI — Prikaz raqam formati: EP-COR-056 vs EP-COR-057 ZIDDIYATI (EGASI QIYMATI KERAK):**
>
> - **EP-COR-056** (MASTER-SAVOL-JAVOB, `✅` owner tasdiqlagan, v2-Q26): `"PR-YYYY-NNN"` — BARCHA
>   kategoriyalar uchun YAGONA prefiks, yillik seriya (2026-001 dan boshlanadi).
> - **EP-COR-057** (🟢 A-default, v2-Q27): 4 kategoriyaga ALOHIDA prefiks va alohida raqam qatori
>   (K-2026-NNN / OD-2026-NNN / F-2026-NNN / AX-2026-NNN).
>
> Bu direktiva EP-COR-057 (per-kategori) formatini tanlagan. Ammo EP-COR-056 (`✅` confirmed) `PR-YYYY-NNN`
> deган — bu ziddiyat. **Mumkin talqin:** `PR-` = "Prikaz" umumiy prefiks + keyingi savol (Q27)
> har kategoriyaga maxsus prefiks belgilagan (ya'ni Q26 umumiy printsipi, Q27 konkret nomenklatura).
> Shu talqin bo'yicha `K-2026-NNN` / `OD-2026-NNN` / `F-2026-NNN` / `AX-2026-NNN` formati
> EP-COR-057 ga mos va EP-COR-056 dan **mantiqiy kengaytma** hisoblanadi.
>
> **Hozirgi tanlov (EP-COR-057 asosida):** `{PREFIX}-{YYYY}-{NNN}` per-kategoriya.
> **EGASI QIYMATI KERAK:** Agar egasi `PR-YYYY-NNN` (barcha kategoriya uchun yagona) ni tasdiqlaса —
> migration va BE service da `order_number` generation logikasi o'zgartiriladi (CHECK constraint, sequence).
> Egasi tasdig'isiz hozirgi per-kategori format qoladi.

**Qabul mezoni:**
- Raqam avtomatik (`{PREFIX}-{YYYY}-{NNN}`) va kategoriya+yil bo'yicha ketma-ket bo'ladi (EP-COR-058 — bekor qilinsa gap saqlanadi, qonuniy).
- `basis_document` maydoni majburiy (manba: qaysi qaror/ariza/protokolga asoslanadi — EP-COR-059).
- Imzolash: `AWAITING_SIGN` → `SIGNED` → `IN_FORCE`. Imzo = ERP'da kim/qachon/IP tasdiq (EP-COR-023).
- Direktor darvozasi (EP-COR-132): KADRLAR va MOLIYA kategoriyalari uchun direktor Pozilov A.A. tasdig'i kerak. Tasdiqlashsiz → `AWAITING_SIGN` holatida qoladi.
- O'zgarmas (EP-COR-061/F5): `SIGNED` bo'lgandan keyin `is_immutable=true`; o'zgartirish faqat yangi prikaz + `superseded_by_id` havola orqali.
- Tanishuv (EP-COR-025): `order_acknowledgements` jadvali; xodimlar "Ko'rdim" tugmasini bosadi, `acknowledged_at` yoziladi.
- PDF eksport: `GET /api/coordination/orders/:id/pdf` (EP-COR-024).

### 2.2 Rek-Sovet (Advisory Council / ZVS sessions) — EP-COR-015..018/083/089

**Maqsad:** Seshanba har haftada 08:45 da Rek-Sovet sessiyasi o'tkaziladi. ZVS so'rovlari ko'rib chiqilib, qaror qilinadi.

- `rec_council_sessions`: ochiladi → ZVS elementlari qo'shiladi → har biriga qaror (APPROVED/PARTIAL/REJECTED + miqdor) → yopiladi → avtomatik hisobot.
- `rec_council_zvs_items`: `zvs_id` FK orqali Finance `zvs` jadvaliga bog'lanadi; COR faqat qarorni yozadi, ZVS holatini Finance moduli o'zgartiradi.
- Seshanba 08:45 CRON: Rek-Sovet a'zolariga "bugun sessiya, X ta ZVS kutmoqda" xabarnomasi yuboriladi (EP-COR-017).
- Sessiya hisoboti (EP-COR-018): yopilganda avtomatik — jami/tasdiqlangan/rad etilgan/miqdor.

### 2.3 workflow_rules + Escalation + Dashboard — EP-COR-026/027/028/119/131/135

- `workflow_rules` jadvali (EP-COR-119): gorizontal bo'limlararo marshrutlash. Admin panel orqali konfiguratsiya (kod deploy shart emas).
- Escalation CRON (EP-COR-027/053): 3 bosqich org-chart `manager_id` zanjiri bo'yicha — D-1 eslatma → bevosita menejer → +2 kun bo'lim boshlig'i → +3 kun CEO.
- Dashboard (EP-COR-026): `GET /api/coordination/dashboard` — ochiq dokladlar soni, kutilayotgan rasporyazheniyalar (Kanban dan), keyingi 7 kundagi uchrashuvlar, aktiv prikazlar soni, muddati o'tgan eskalatsiyalar.
- Smena checklist templates (EP-COR-130/E4): `smena_checklist_templates` — COR template tavsif beradi (material/qolip/dastgoh/xodim elementlari); IoT tablet bajaradi.
- Card AI feed (EP-COR-135): koordinatsiya hodisalari (kech/STOP/defekt/norm%/SLA) → `CardAiCoordinationEventFeed` domain event chiqariladi.
- Confidential flag (EP-COR-076/131): `is_confidential` maydoni; confidential → faqat a'zolar+CEO ko'radi.

### 2.4 FE sahifalar

| Sahifa | Template | Yo'l |
|---|---|---|
| Prikazlar ro'yxati | ListPage | `/coordination?tab=orders` yoki `/coordination/orders` |
| Yangi prikaz | FormPage | `/coordination/orders/new` |
| Rek-Sovet sessiya | DetailPage | `/coordination/rec-council` |
| Workflow qoidalari | ListPage+FormPage | `/coordination/workflow-rules` |
| CoordinationPage | — extend | mavjud tab strukturasiga "orders" + "rec-council" + "workflow" qo'shiladi |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud infrastruktura (P31 dan meros)

**Backend (apps/api/src/modules/director/):**

- `presentation/coordination.controller.ts:1-185` — mavjud; dokla/rasporyazhenie CRUD, stats endpoint. `GET /api/coordination/councils` raw SQL orqali `councils` jadvalidan o'qiydi (satr 42-47). Prikaz yoki Rek-Sovet endpointlari **YO'Q**.
- `application/coordination.service.ts:1-40+` — mavjud; `createDoklaWithValidation`, `listDokla`, `updateDoklaWithAuth` va boshqalar. Company orders / Rek-Sovet servislari **YO'Q**.
- `infrastructure/repositories/coordination.repository.ts:1-50+` — mavjud; Drizzle ORM, `Result<T>` pattern to'g'ri qo'llangan. `dokla` va `rasporyazhenie` jadvallaridan ishlaydi.
- `presentation/dto/director.dto.ts:1-50+` — mavjud; `CoordinationCreate/UpdateDoklaSchema`, `CoordinationCreateRaspSchema` va boshqa sxemalar. Company orders / Rek-Sovet DTO'lari **YO'Q**.
- `infrastructure/repositories/zvs.repository.ts` — mavjud (ZVS CRUD). Rek-Sovet qaror yozish **YO'Q**.
- **Cron servisi — YO'Q** (`coordination-cron.service.ts` fayli mavjud emas).

**Migrations:**

- `cor-zvs-zno-2026-06-17.sql` — mavjud (`zvs`, `zno` jadvallar). `APPROVED: owner 2026-06-17`.
- `cor-p3-company-orders.sql` — **YO'Q** (yaratilishi kerak, GATED).
- `cor-p4-rec-council-workflow-dashboard.sql` — **YO'Q** (yaratilishi kerak, GATED).

**Database (H4 tekshiruvi):**

- `orders` jadvali mavjudmi? → `shared/db/index.ts:103` da `sd_sales_orders` va `pos_orders` ko'rinadi; `orders` ham mavjud (PP dunyosi). Shuning uchun **`company_orders`** nomini ishlat — to'qnashuv yo'q.
- `company_orders` → **YO'Q** (qurilishi kerak).
- `order_acknowledgements` → **YO'Q** (qurilishi kerak).
- `rec_council_sessions` → **YO'Q** (qurilishi kerak).
- `rec_council_zvs_items` → **YO'Q** (qurilishi kerak).
- `workflow_rules` → **YO'Q** (qurilishi kerak).
- `smena_checklist_templates` → **YO'Q** (qurilishi kerak).

**Frontend (artifacts/erp-dashboard/src/pages/):**

- `CoordinationPage.tsx:1-60+` — mavjud; tab-based (overview/dokla/rasporyazhenie/baskets/councils). `useQuery(["/api/coordination/dokla"])`, `useQuery(["/api/coordination/rasporyazhenie"])` va boshqalar chaqirilmoqda. Prikaz / Rek-Sovet / Workflow tabs **YO'Q**.
- `coordination/` papkasi — **YO'Q** (`PrikazlarListPage`, `PrikazlarFormPage`, `RecCouncilPage`, `WorkflowRulesPage` yaratilishi kerak).

### 3.2 GAP xulosa

| Feature | Holat | Muammo |
|---|---|---|
| `company_orders` DDL | YO'Q | Migration kerak (GATED) |
| `order_acknowledgements` DDL | YO'Q | Migration kerak (GATED) |
| Prikaz CRUD BE | YO'Q | 5 yangi fayl kerak |
| Direktor tasdiqlash gate | YO'Q | Service logika + status flow |
| Auto-numbering (`K-2026-001`) | YO'Q | Repository logika |
| `rec_council_sessions` DDL | YO'Q | Migration kerak (GATED) |
| `rec_council_zvs_items` DDL | YO'Q | Migration kerak (GATED) |
| Rek-Sovet session CRUD BE | YO'Q | 5 yangi fayl kerak |
| `workflow_rules` DDL | YO'Q | Migration kerak (GATED) |
| `smena_checklist_templates` DDL | YO'Q | Migration kerak (GATED) |
| Workflow rules admin CRUD BE | Qisman (coordination.controller.ts da yo'q) | Yangi endpoint kerak |
| Coordination CRON (Seshanba 08:45) | YO'Q | `coordination-cron.service.ts` kerak |
| Escalation CRON | YO'Q | Cron servisda kerak |
| `GET /api/coordination/dashboard` | Qisman (`/stats` bor, to'liq yo'q) | Extend kerak |
| `CoordinationPage.tsx` tabs | Qisman (orders/rec-council/workflow yo'q) | Extend |
| `PrikazlarListPage.tsx` | YO'Q | Yangi fayl |
| `PrikazlarFormPage.tsx` | YO'Q | Yangi fayl |
| `RecCouncilPage.tsx` | YO'Q | Yangi fayl |
| `WorkflowRulesPage.tsx` | YO'Q | Yangi fayl |
| i18n (uz/ru coordination) | Qisman (prikaz/rek-sovet kalitlari yo'q) | Kalit qo'shish |

<!-- DAVOMI -->

---

## 4. ISH (qadam-baqadam)

> Har qadam: fayl + aniq o'zgartirish + oldin/keyin eskiz + Result<T>/Zod/Drizzle + real INSERT.
> Qadamlar tartibda bajariladi; har qadam oxirida `git add <aniq-fayl> && git commit`.

---

### QADAM 1 — H4 two-world tekshiruvi (READ-ONLY, 5 daqiqa)

**Fayl:** DB (psql yoki `_audit/q.cjs`)

```sql
-- 1a. Nomi to'qnashuv tekshiruvi
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('orders','company_orders','official_orders','prikazlar',
                     'rec_council_sessions','workflow_rules','smena_checklist_templates');

-- 1b. `orders` jadvali nima uchun (PP dunyosi)?
SELECT COUNT(*) AS cnt FROM orders LIMIT 1;
```

**Kutilgan natija:** `company_orders`, `rec_council_sessions`, `workflow_rules`, `smena_checklist_templates` mavjud emas → davom et. Agar `company_orders` mavjud bo'lsa — egasiga flag qil, to'xta.

---

### QADAM 2 — DDL (GATED): `cor-p3-company-orders.sql`

**Fayl:** `apps/api/src/shared/db/migrations/cor-p3-company-orders.sql` (YANGI)

Migration faylini YOZ. `psql` bilan BAJARMA. `-- APPROVED:` placeholder qoldir.

```sql
-- APPROVED: <egasi> <sana>
-- EP-COR-019..025/049/057..061/132
-- company_orders: prikazlar registry (4 kategoriya: K/OD/F/AX)
-- H4: "orders" = PP dunyosi; shu sababli "company_orders" nomini ishlatamiz

CREATE TABLE IF NOT EXISTS company_orders (
  id                      SERIAL PRIMARY KEY,
  order_number            VARCHAR(30) NOT NULL UNIQUE,
  -- format: {PREFIX}-{YYYY}-{NNN}, e.g. K-2026-001 (EP-COR-057 per-kategoriya format)
  -- EGASI QIYMATI KERAK: EP-COR-056 (✅) "PR-YYYY-NNN" yagona formatni taklif qiladi.
  -- Agar egasi yagona formatni tanlasa: prefix ustuni olib tashlanadi,
  --   order_number = 'PR-YYYY-NNN', category ustuni saqlanadi (klassifikatsiya uchun).
  -- §2.1 MOSLIK ESLATMASI ga qarang.
  category                VARCHAR(20) NOT NULL
    CHECK (category IN ('KADRLAR','ASOSIY','MOLIYA','XOJALIK')),
  prefix                  VARCHAR(5) NOT NULL
    CHECK (prefix IN ('K','OD','F','AX')),
  title                   VARCHAR(400) NOT NULL,
  content                 TEXT,
  basis_document          TEXT NOT NULL,
  -- EP-COR-059: majburiy — manba hujjat/protokol/ariza
  issued_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_date          TIMESTAMPTZ,
  -- EP-COR-021: imzo sanasidan ajralgan kuch kirish sanasi
  expiry_date             TIMESTAMPTZ,
  status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','AWAITING_SIGN','SIGNED','IN_FORCE','CANCELLED','SUPERSEDED')),
  signed_by_id            INTEGER,
  signed_at               TIMESTAMPTZ,
  signed_confirmation_text TEXT,
  -- EP-COR-023: 2-imzo model (jismoniy + ERP tasdiq: kim/qachon/IP)
  director_approved_at    TIMESTAMPTZ,
  -- EP-COR-132: KADRLAR va MOLIYA uchun majburiy
  director_id             INTEGER,
  is_immutable            BOOLEAN NOT NULL DEFAULT FALSE,
  -- EP-COR-061/F5: SIGNED bo'lgandan keyin true
  version                 INTEGER NOT NULL DEFAULT 1,
  superseded_by_id        INTEGER REFERENCES company_orders(id),
  attachments             JSONB,
  is_confidential         BOOLEAN NOT NULL DEFAULT FALSE,
  created_by              INTEGER NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_orders_category_year
  ON company_orders (category, EXTRACT(YEAR FROM issued_at));

CREATE INDEX IF NOT EXISTS idx_company_orders_status
  ON company_orders (status);

-- order_acknowledgements: EP-COR-025 xodim tanishuvi
CREATE TABLE IF NOT EXISTS order_acknowledgements (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES company_orders(id),
  employee_id     INTEGER NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, employee_id)
);
```

**Commit:**
```
git add apps/api/src/shared/db/migrations/cor-p3-company-orders.sql
git commit -m "feat(COR/P32): add cor-p3-company-orders.sql GATED migration (company_orders + order_acknowledgements)"
```

---

### QADAM 3 — DDL (GATED): `cor-p4-rec-council-workflow-dashboard.sql`

**Fayl:** `apps/api/src/shared/db/migrations/cor-p4-rec-council-workflow-dashboard.sql` (YANGI)

```sql
-- APPROVED: <egasi> <sana>
-- EP-COR-015..018 (Rek-Sovet) + EP-COR-119 (workflow_rules) + EP-COR-130 (smena_checklist_templates)

-- rec_council_sessions: Rek-Sovet sessiya
CREATE TABLE IF NOT EXISTS rec_council_sessions (
  id                    SERIAL PRIMARY KEY,
  session_date          DATE NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','IN_REVIEW','CLOSED')),
  opened_by             INTEGER NOT NULL,
  closed_by             INTEGER,
  opened_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at             TIMESTAMPTZ,
  total_zvs_count       INTEGER NOT NULL DEFAULT 0,
  approved_count        INTEGER NOT NULL DEFAULT 0,
  partial_count         INTEGER NOT NULL DEFAULT 0,
  rejected_count        INTEGER NOT NULL DEFAULT 0,
  total_approved_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_rejected_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- rec_council_zvs_items: har bir ZVS uchun qaror
CREATE TABLE IF NOT EXISTS rec_council_zvs_items (
  id              SERIAL PRIMARY KEY,
  session_id      INTEGER NOT NULL REFERENCES rec_council_sessions(id),
  zvs_id          INTEGER NOT NULL,
  -- FK: zvs jadvali (Finance/Director ZVS, mavjud)
  decision        VARCHAR(20) NOT NULL
    CHECK (decision IN ('APPROVED','PARTIAL','REJECTED')),
  approved_amount NUMERIC(18,2),
  rejected_amount NUMERIC(18,2),
  note            TEXT,
  decided_by      INTEGER NOT NULL,
  decided_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_council_zvs_session
  ON rec_council_zvs_items (session_id);

-- workflow_rules: EP-COR-119 gorizontal marshrutlash
CREATE TABLE IF NOT EXISTS workflow_rules (
  id              SERIAL PRIMARY KEY,
  source_dept_id  INTEGER,
  target_dept_id  INTEGER,
  document_type   VARCHAR(50) NOT NULL,
  routing_rule    JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  description     TEXT,
  created_by      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- smena_checklist_templates: EP-COR-130/E4 IoT tablet uchun template
CREATE TABLE IF NOT EXISTS smena_checklist_templates (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  dept_id     INTEGER,
  items       JSONB NOT NULL DEFAULT '[]',
  -- [{ "key": "material", "label_uz": "Material", "label_ru": "Материал", "required": true }]
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Commit:**
```
git add apps/api/src/shared/db/migrations/cor-p4-rec-council-workflow-dashboard.sql
git commit -m "feat(COR/P32): add cor-p4-rec-council-workflow-dashboard.sql GATED migration"
```

---

### QADAM 4 — Company Orders: Interface + Repository + Service + Controller + DTO

**4a. DTO** — `apps/api/src/modules/director/presentation/dto/company-orders.dto.ts` (YANGI)

```typescript
import { z } from 'zod';

export const CompanyOrderCreateSchema = z.object({
  category:       z.enum(['KADRLAR','ASOSIY','MOLIYA','XOJALIK']),
  title:          z.string().min(1).max(400),
  content:        z.string().optional(),
  basis_document: z.string().min(1),          // EP-COR-059 majburiy
  effective_date: z.string().datetime({ offset: true }).optional(),
  expiry_date:    z.string().datetime({ offset: true }).optional(),
  attachments:    z.array(z.record(z.unknown())).optional(),
});
export type CompanyOrderCreateDto = z.infer<typeof CompanyOrderCreateSchema>;

export const CompanyOrderSignSchema = z.object({
  confirmation_text: z.string().min(1).max(500),
  // EP-COR-023: kim/qachon/IP — IP BE'da req.ip dan olinadi
});
export type CompanyOrderSignDto = z.infer<typeof CompanyOrderSignSchema>;

export const CompanyOrderDirectorApproveSchema = z.object({
  note: z.string().optional(),
});
export type CompanyOrderDirectorApproveDto = z.infer<typeof CompanyOrderDirectorApproveSchema>;

export const OrderAcknowledgeSchema = z.object({
  order_id: z.number().int().positive(),
});
export type OrderAcknowledgeDto = z.infer<typeof OrderAcknowledgeSchema>;
```

**4b. Interface** — `apps/api/src/modules/director/domain/repositories/i-company-orders.repo.ts` (YANGI)

```typescript
import { Result } from '@common/result';

export const COMPANY_ORDERS_REPO = 'COMPANY_ORDERS_REPO';

export type CompanyOrderRow = Record<string, unknown>;

export interface ICompanyOrdersRepo {
  generateOrderNumber(category: string, prefix: string): Promise<Result<string>>;
  create(data: {
    category: string; prefix: string; orderNumber: string;
    title: string; content?: string; basisDocument: string;
    effectiveDate?: Date; expiryDate?: Date;
    attachments?: object; createdBy: number;
  }): Promise<Result<CompanyOrderRow>>;
  findById(id: number): Promise<Result<CompanyOrderRow | null>>;
  findAll(filters?: { category?: string; status?: string }): Promise<Result<CompanyOrderRow[]>>;
  sign(id: number, signedById: number, confirmationText: string, clientIp: string): Promise<Result<CompanyOrderRow>>;
  directorApprove(id: number, directorId: number, note?: string): Promise<Result<CompanyOrderRow>>;
  setInForce(id: number): Promise<Result<CompanyOrderRow>>;
  acknowledge(orderId: number, employeeId: number): Promise<Result<void>>;
  listAcknowledgements(orderId: number): Promise<Result<CompanyOrderRow[]>>;
}
```

**4c. Repository** — `apps/api/src/modules/director/infrastructure/repositories/company-orders.repository.ts` (YANGI)

Muhim nuanslar:
- `generateOrderNumber`: `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, ...) AS INT)), 0) + 1` — gap saqlanadi, bekor qilinsa ham raqam qaytarilmaydi.
- `sign`: `is_immutable=false` bo'lgandagina ishlaydi; `SIGNED` bo'lgandan keyin `is_immutable=true`.
- `directorApprove`: faqat `KADRLAR` va `MOLIYA` uchun amal qiladi (boshqasi — service blok qiladi).

```typescript
// Oldin (mavjud holat): company_orders jadvali YO'Q — barcha metodlar
//   "table does not exist" 42P01 xatosi beradi.
// Keyin (migration APPROVED va bajarilgandan keyin): real INSERT/SELECT ishlaydi.

@Injectable()
export class CompanyOrdersRepository implements ICompanyOrdersRepo {
  async generateOrderNumber(category: string, prefix: string): Promise<Result<string>> {
    return safeCall(async () => {
      const year = new Date().getFullYear();
      const rows = await typedExecute<{ maxnum: number }>(sql`
        SELECT COALESCE(MAX(
          CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INT)
        ), 0) AS maxnum
        FROM company_orders
        WHERE category = ${category}
          AND EXTRACT(YEAR FROM issued_at) = ${year}
      `);
      const next = ((rows[0]?.maxnum ?? 0) + 1).toString().padStart(3, '0');
      return `${prefix}-${year}-${next}`;
    }, 'DB_ERROR');
  }

  async sign(id: number, signedById: number, confirmationText: string, clientIp: string): Promise<Result<CompanyOrderRow>> {
    return safeCall(async () => {
      // EP-COR-061/F5: immutable bo'lsa blok
      const existing = await db.select().from(companyOrders).where(eq(companyOrders.id, id));
      if (!existing[0]) throw new Error('NOT_FOUND');
      if (existing[0].isImmutable) throw new Error('IMMUTABLE: prikaz allaqachon imzolangan va o\'zgarmas');
      const rows = await db.update(companyOrders)
        .set({
          status: 'SIGNED',
          signedById,
          signedAt: new Date(),
          signedConfirmationText: `${confirmationText} | IP: ${clientIp}`,
          isImmutable: true,  // EP-COR-061
        })
        .where(eq(companyOrders.id, id))
        .returning();
      return (rows[0] ?? {}) as CompanyOrderRow;
    }, 'DB_ERROR');
  }
  // ... boshqa metodlar xuddi shu pattern bilan
}
```

**4d. Service** — `apps/api/src/modules/director/application/company-orders.service.ts` (YANGI)

```typescript
// Direktor darvozasi (EP-COR-132):
async signOrder(id: number, signedById: number, confirmationText: string, clientIp: string, userRole: string): Promise<Result<CompanyOrderRow>> {
  // KADRLAR va MOLIYA uchun director_approved_at tekshiruvi
  const existing = await this.repo.findById(id);
  if (!existing.ok || !existing.data) return Err({ code: 'NOT_FOUND', message: 'Prikaz topilmadi' });
  const order = existing.data as Record<string, unknown>;
  if (['KADRLAR','MOLIYA'].includes(order.category as string) && !order.director_approved_at) {
    return Err({ code: 'DIRECTOR_GATE', message: 'Direktor tasdig\'i kutilmoqda (EP-COR-132)' });
  }
  return this.repo.sign(id, signedById, confirmationText, clientIp);
}

// Auto-prefix:
private categoryToPrefix(category: string): string {
  const map: Record<string, string> = {
    KADRLAR: 'K', ASOSIY: 'OD', MOLIYA: 'F', XOJALIK: 'AX',
  };
  return map[category] ?? 'OD';
}
```

**4e. Controller** — `apps/api/src/modules/director/presentation/company-orders.controller.ts` (YANGI)

```typescript
@ApiTags('CompanyOrders')
@Controller('coordination/orders')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin','director','ceo','manager')
export class CompanyOrdersController {
  // GET    /api/coordination/orders           → listOrders
  // POST   /api/coordination/orders           → createOrder
  // GET    /api/coordination/orders/:id       → getOrder
  // POST   /api/coordination/orders/:id/sign  → signOrder (EP-COR-023)
  // POST   /api/coordination/orders/:id/director-approve → directorApprove (EP-COR-132)
  // POST   /api/coordination/orders/:id/force → setInForce
  // POST   /api/coordination/orders/:id/acknowledge → acknowledge (EP-COR-025)
  // GET    /api/coordination/orders/:id/acknowledgements → listAcknowledgements
  // GET    /api/coordination/orders/:id/pdf   → exportPdf (EP-COR-024)
}
```

Commit: qarang §8 — "QADAM 4" bloki.

---

### QADAM 5 — Rek-Sovet: Interface + Repository + Service + Controller + DTO

**5a. DTO** — `apps/api/src/modules/director/presentation/dto/rec-council.dto.ts` (YANGI)

```typescript
import { z } from 'zod';

export const RecCouncilOpenSessionSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes:        z.string().optional(),
});
export type RecCouncilOpenSessionDto = z.infer<typeof RecCouncilOpenSessionSchema>;

export const RecCouncilAddZvsItemSchema = z.object({
  zvs_id:          z.number().int().positive(),
  decision:        z.enum(['APPROVED','PARTIAL','REJECTED']),
  approved_amount: z.number().min(0).optional(),
  rejected_amount: z.number().min(0).optional(),
  note:            z.string().optional(),
});
export type RecCouncilAddZvsItemDto = z.infer<typeof RecCouncilAddZvsItemSchema>;
```

**5b. Interface** — `apps/api/src/modules/director/domain/repositories/i-rec-council.repo.ts` (YANGI)

```typescript
export const REC_COUNCIL_REPO = 'REC_COUNCIL_REPO';
export interface IRecCouncilRepo {
  openSession(data: { sessionDate: string; openedBy: number; notes?: string }): Promise<Result<Row>>;
  closeSession(id: number, closedBy: number): Promise<Result<Row>>;
  addZvsItem(sessionId: number, data: { zvsId: number; decision: string; approvedAmount?: number; rejectedAmount?: number; note?: string; decidedBy: number }): Promise<Result<Row>>;
  getSession(id: number): Promise<Result<Row | null>>;
  listSessions(): Promise<Result<Row[]>>;
  getSessionReport(id: number): Promise<Result<Row>>;
}
```

**5c. Repository** — `apps/api/src/modules/director/infrastructure/repositories/rec-council.repository.ts` (YANGI)

```typescript
// closeSession: avtomatik hisoblash va yopish
async closeSession(id: number, closedBy: number): Promise<Result<Row>> {
  return safeCall(async () => {
    // Avval statistikani hisoblash
    const stats = await typedExecute<{
      total: number; approved: number; partial: number; rejected: number;
      approved_sum: number; rejected_sum: number;
    }>(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE decision = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE decision = 'PARTIAL')  AS partial,
        COUNT(*) FILTER (WHERE decision = 'REJECTED') AS rejected,
        COALESCE(SUM(approved_amount), 0) AS approved_sum,
        COALESCE(SUM(rejected_amount), 0) AS rejected_sum
      FROM rec_council_zvs_items WHERE session_id = ${id}
    `);
    const s = stats[0];
    const rows = await db.update(recCouncilSessions)
      .set({
        status: 'CLOSED', closedBy, closedAt: new Date(),
        totalZvsCount:       s?.total ?? 0,
        approvedCount:       s?.approved ?? 0,
        partialCount:        s?.partial ?? 0,
        rejectedCount:       s?.rejected ?? 0,
        totalApprovedAmount: s?.approved_sum ?? 0,
        totalRejectedAmount: s?.rejected_sum ?? 0,
      })
      .where(eq(recCouncilSessions.id, id))
      .returning();
    return (rows[0] ?? {}) as Row;
  }, 'DB_ERROR');
}
```

**5d. Service** — `apps/api/src/modules/director/application/rec-council.service.ts` (YANGI)

- `addZvsItem`: `session.status === 'OPEN'` bo'lgandagina ruxsat.
- `closeSession`: faqat `OPEN` → `IN_REVIEW` → `CLOSED` ketma-ketligi.

**5e. Controller** — `apps/api/src/modules/director/presentation/rec-council.controller.ts` (YANGI)

```typescript
@Controller('coordination/rec-council')
// GET    /api/coordination/rec-council                  → listSessions
// POST   /api/coordination/rec-council/open             → openSession
// POST   /api/coordination/rec-council/:id/close        → closeSession
// POST   /api/coordination/rec-council/:id/zvs-items    → addZvsItem
// GET    /api/coordination/rec-council/:id              → getSession
// GET    /api/coordination/rec-council/:id/report       → getSessionReport (EP-COR-018)
```

Commit: qarang §8 — "QADAM 5" bloki.

---

### QADAM 6 — Coordination Cron Service

**Fayl:** `apps/api/src/modules/director/infrastructure/crons/coordination-cron.service.ts` (YANGI)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class CoordinationCronService {
  private readonly logger = new Logger(CoordinationCronService.name);

  // EP-COR-017: Seshanba 08:45 — Rek-Sovet xabarnomasi
  @Cron('45 8 * * 2')  // 0=Yak, 2=Seshanba
  async notifyRecCouncil(): Promise<void> {
    this.logger.log('EP-COR-017: Rek-Sovet sessiya xabarnomasi — Seshanba 08:45');
    // Pending ZVS sonini hisoblash
    const rows = await db.execute(sql`
      SELECT COUNT(*) AS pending_count FROM zvs
      WHERE status = 'pending'
        AND EXTRACT(ISODOW FROM NOW()) = 2
    `);
    const count = ((rows as { rows?: { pending_count: number }[] }).rows?.[0]?.pending_count) ?? 0;
    // TODO: NotificationService orqali Rek-Sovet a'zolariga xabar yuborish
    // (P46-NTF moduli tayyor bo'lgach ulab qo'yiladi)
    this.logger.log(`EP-COR-017: ${count} ta ZVS kutmoqda`);
  }

  // EP-COR-027/053: Kunlik escalation tekshiruvi — har kuni soat 09:00
  @Cron('0 9 * * 1-5')  // Du-Ju, 09:00
  async runEscalationCheck(): Promise<void> {
    this.logger.log('EP-COR-027: Kunlik escalation tekshiruvi boshlanmoqda');
    // Muddati o'tgan dokladlar: status='sent' va muddati kechiktirilib
    await db.execute(sql`
      UPDATE dokla
      SET status = 'overdue'
      WHERE status = 'sent'
        AND due_date IS NOT NULL
        AND due_date < NOW() - INTERVAL '3 days'
    `);
    // TODO: manager_id zanjiri bo'yicha eskalatsiya (P31 dan council_members + org_functions)
    this.logger.log('EP-COR-027: Escalation check tugadi');
  }

  // EP-COR-086: Kunlik 24-soatlik reja push — har kuni 07:00
  @Cron('0 7 * * 1-6')
  async push24hPlan(): Promise<void> {
    this.logger.log('EP-COR-086: 24h reja push — logistics/uchastka/warehouse');
    // TODO: PP moduli tayyor bo'lgach real plan push qilinadi (domain event orqali)
    this.logger.log('EP-COR-086: 24h plan signal chiqarildi (PP/MES/WMS listener kutilmoqda)');
  }
}
```

**director.module.ts ga qo'shish kerak** — lekin bu OWNED FILE ro'yxatida emas. TO'XTA va egasiga flag qil:

> ⚠️ FLAG: `apps/api/src/modules/director/director.module.ts` fayliga `CoordinationCronService` ni providers va `ScheduleModule.forRoot()` ni imports ga qo'shish kerak. Bu owned-file emas — egasi ruxsati kerak yoki P32 owned fayllar ro'yxatiga qo'shilsin.

Commit: qarang §8 — "QADAM 6" bloki.

---

### QADAM 7 — Dashboard endpoint extend + workflow_rules CRUD

**Fayl:** `apps/api/src/modules/director/presentation/coordination.controller.ts` (MAVJUD — EXTEND ONLY)

Mavjud `GET /api/coordination/stats` endpointini `GET /api/coordination/dashboard` bilan to'ldirish (yoki yangi endpoint qo'shish):

```typescript
// coordination.controller.ts ga QO'SHILADI (koordinatsiya.controller.ts:185 dan keyin)
// Oldin: faqat /stats mavjud — dokladlar/rasporyazheniyalar statistikasi
// Keyin: /dashboard — to'liqroq (EP-COR-026: uchrashuvlar, prikazlar, eskalatsiyalar)

@Get('dashboard')
@ApiOperation({ summary: 'Coordination dashboard — EP-COR-026' })
async getDashboard() {
  return unwrapOrInternal(await this.svc.getDashboardSummary());
}

@Get('workflow-rules')
@ApiOperation({ summary: 'List workflow rules — EP-COR-119' })
async listWorkflowRules() {
  // raw SQL (workflow_rules jadvali Drizzle sxemasiga henüz qo'shilmagan)
  const r = await db.execute(sql`
    SELECT id, source_dept_id, target_dept_id, document_type,
           routing_rule, is_active, description, created_at
    FROM workflow_rules WHERE is_active = true ORDER BY id
  `);
  return ((r as { rows?: unknown[] }).rows) ?? [];
}

@Post('workflow-rules')
@Roles('admin','director','ceo')
@UsePipes(new ZodValidationPipe(WorkflowRuleCreateSchema))
async createWorkflowRule(@Body() body: WorkflowRuleCreateDto) {
  return unwrapOrThrow(await this.svc.createWorkflowRule(body));
}
```

`getDashboardSummary` service metodida:
```typescript
// coordination.service.ts ga QO'SHILADI
async getDashboardSummary(): Promise<Result<object>> {
  return safeCall(async () => {
    const [dokladStats, prikazStats] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) FILTER (WHERE status='sent') AS open_doklads FROM dokla`),
      db.execute(sql`SELECT COUNT(*) FILTER (WHERE status NOT IN ('CANCELLED','SUPERSEDED')) AS active_orders FROM company_orders`),
    ]);
    // Kanban dan kutilayotgan rasporyazheniyalar — Kanban moduli tayyor bo'lgach to'ldiriladi
    return {
      open_doklads:         Number(((dokladStats as { rows?: {open_doklads: string}[] }).rows?.[0]?.open_doklads) ?? 0),
      active_orders:        Number(((prikazStats as { rows?: {active_orders: string}[] }).rows?.[0]?.active_orders) ?? 0),
      pending_directives:   0, // TODO: Kanban moduli (P42-KAN)
      upcoming_meetings:    0, // TODO: council_meetings (P31 dan)
      overdue_escalations:  0, // TODO: eskalatsiya log (P31 escalation cron)
    };
  }, 'DB_ERROR');
}
```

Commit: qarang §8 — "QADAM 7" bloki.

---

### QADAM 8 — FE: PrikazlarListPage + PrikazlarFormPage

**8a. `artifacts/erp-dashboard/src/pages/coordination/PrikazlarListPage.tsx`** (YANGI)

ListPage template + EP Linear Soft tokens:

```tsx
// ListPage shablon asosida, var(--ep-*) tokenlar
// Filtr: kategoriya (K/OD/F/AX/barchasi) + status + sana oralig'i
// Ustunlar: Raqam | Kategoriya | Sarlavha | Holat | Direktor | Sana | Amallar

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useNavigate } from "wouter";

export function PrikazlarListPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/coordination/orders"],
    select: selectArray,
  });
  // isLoading → <Skeleton>; orders = [] fallback
  // Har prikaz satri: status badge (DRAFT=gray, AWAITING_SIGN=amber,
  //   SIGNED=blue, IN_FORCE=green, CANCELLED=red, SUPERSEDED=slate)
  // Direktor tasdiq: "Tasdiqlangan" yoki "Kutilmoqda" indicator
  // "Yangi prikaz" tugmasi → /coordination/orders/new
}
```

**8b. `artifacts/erp-dashboard/src/pages/coordination/PrikazlarFormPage.tsx`** (YANGI)

FormPage template — REAL mutation (Q-43):

```tsx
// POST /api/coordination/orders → create
// Maydonlar: Kategoriya dropdown (Kadrlar/Asosiy/Moliya/Xo'jalik — Uzbek, EP-COR-057)
//   → Prefix auto-ko'rsatish (K / OD / F / AX)
//   → Sarlavha, Manba hujjat (majburiy), Kuch kirish sanasi, Mazmun
// onSuccess: queryClient.invalidateQueries(["/api/coordination/orders"])
//            navigate("/coordination?tab=orders")
// onError: toast destructive

// Imzolash panel (detail sahifada, bu formda yo'q):
//   "Imzolash tasdig'i" button → POST /api/coordination/orders/:id/sign
//   Direktor holati: "Direktor tasdig'i kutilmoqda" badge agar status=AWAITING_SIGN
//                   va kategoriya KADRLAR/MOLIYA bo'lsa
```

Commit: qarang §8 — "QADAM 8" bloki.

---

### QADAM 9 — FE: RecCouncilPage + WorkflowRulesPage

**9a. `artifacts/erp-dashboard/src/pages/coordination/RecCouncilPage.tsx`** (YANGI)

```tsx
// Tabs: "Sessiyalar" (ListPage) | "Faol sessiya" (DetailPage)
// Sessiyalar ro'yxati: sana | holat | jami ZVS | tasdiqlangan | rad qilingan | jami summa
// Yangi sessiya ochish: POST /api/coordination/rec-council/open (sana + ixtiyoriy izoh)
// Faol sessiya:
//   ZVS qidirish + qo'shish:
//     zvs_id kiritiladi → GET /api/coordination/zvs?status=pending → dropdown
//     Qaror: APPROVED / PARTIAL / REJECTED + miqdor + izoh
//     POST /api/coordination/rec-council/:id/zvs-items
//   Yopish tugmasi: POST /api/coordination/rec-council/:id/close
//     → hisobot ko'rsatiladi (jami/tasdiqlangan/rad/miqdor)
// Round-trip: ochish → ZVS qo'shish → yopish → hisobot → qayta ochganda ko'rinadi
```

**9b. `artifacts/erp-dashboard/src/pages/coordination/WorkflowRulesPage.tsx`** (YANGI)

```tsx
// ListPage + inline FormPage (dialog)
// GET /api/coordination/workflow-rules → ro'yxat
// POST /api/coordination/workflow-rules → yangi qoida
//   Maydonlar: Manba bo'lim, Maqsad bo'lim, Hujjat turi, Marshrut qoidasi (JSON), Tavsif
// Toggle is_active (PATCH /api/coordination/workflow-rules/:id)
// Round-trip: yaratish → ro'yxatda ko'rinishi
```

Commit: qarang §8 — "QADAM 9" bloki.

---

### QADAM 10 — CoordinationPage.tsx extend (yangi tablar)

**Fayl:** `artifacts/erp-dashboard/src/pages/CoordinationPage.tsx` (MAVJUD — extend)

Mavjud satr 40 da `VALID_TABS` massivi bor. Unga yangi tablar qo'shiladi:

```typescript
// Oldin (CoordinationPage.tsx — taxminiy satr 17-20):
// const VALID_TABS = ['overview','dokla','rasporyazhenie','baskets','councils'] as const;

// Keyin:
const VALID_TABS = [
  'overview','dokla','rasporyazhenie','baskets','councils',
  'orders','rec-council','workflow-rules'   // P32 yangi tablar
] as const;
```

Tab content:
```tsx
// Tab "orders" → <PrikazlarListPage />
// Tab "rec-council" → <RecCouncilPage />
// Tab "workflow-rules" → <WorkflowRulesPage /> (faqat admin/director/ceo ko'radi)
```

Commit: qarang §8 — "QADAM 10" bloki.

---

### QADAM 11 — i18n: uz/ru coordination.json kalit qo'shimchalari

**Fayllar:**
- `artifacts/erp-dashboard/src/locales/uz/coordination.json`
- `artifacts/erp-dashboard/src/locales/ru/coordination.json`

```json
// uz — qo'shimcha kalitlar:
{
  "orders": {
    "title": "Prikazlar",
    "new": "Yangi prikaz",
    "category": "Kategoriya",
    "categories": {
      "KADRLAR": "Kadrlar (K)",
      "ASOSIY": "Asosiy (OD)",
      "MOLIYA": "Moliya (F)",
      "XOJALIK": "Xo'jalik (AX)"
    },
    "basis_document": "Manba hujjat",
    "status": {
      "DRAFT": "Qoralama",
      "AWAITING_SIGN": "Imzo kutilmoqda",
      "SIGNED": "Imzolangan",
      "IN_FORCE": "Kuchda",
      "CANCELLED": "Bekor qilingan",
      "SUPERSEDED": "Yangi bilan almashtirilib"
    },
    "director_gate": "Direktor tasdig'i kutilmoqda",
    "sign_confirm": "Imzolash tasdig'i",
    "acknowledge": "Ko'rdim",
    "acknowledged_count": "{{count}} ta ko'rdi"
  },
  "rec_council": {
    "title": "Rek-Sovet",
    "open_session": "Sessiya ochish",
    "close_session": "Sessiyani yopish",
    "add_zvs": "ZVS qo'shish",
    "decision": {
      "APPROVED": "Tasdiqlandi",
      "PARTIAL": "Qisman tasdiqlandi",
      "REJECTED": "Rad etildi"
    },
    "report": "Sessiya hisoboti",
    "pending_zvs": "Kutilayotgan ZVS: {{count}} ta"
  },
  "workflow_rules": {
    "title": "Marshrutlash qoidalari",
    "new_rule": "Yangi qoida",
    "source_dept": "Manba bo'lim",
    "target_dept": "Maqsad bo'lim",
    "doc_type": "Hujjat turi"
  }
}
```

Commit: qarang §8 — "QADAM 11" bloki.

---

## 5. DDL (GATED)

> ⚠️ Quyidagi DDL fayllarini YOZ lekin BAJARMA. Egasi `-- APPROVED:` ni to'ldirguncha psql yoki `db.execute` bilan ishga tushirilmaydi.

### cor-p3-company-orders.sql (to'liq)

To'liq DDL yuqoridagi QADAM 2 da keltirilgan. Fayl manzili:
`apps/api/src/shared/db/migrations/cor-p3-company-orders.sql`

Faylda shart:
```sql
-- APPROVED: <egasi> <sana>
-- EP-COR-019..025/049/057..061/132 | P32 COR Wave 2
```

**Jadvallar:** `company_orders`, `order_acknowledgements`
**Indekslar:** `idx_company_orders_category_year`, `idx_company_orders_status`

### cor-p4-rec-council-workflow-dashboard.sql (to'liq)

To'liq DDL yuqoridagi QADAM 3 da keltirilgan. Fayl manzili:
`apps/api/src/shared/db/migrations/cor-p4-rec-council-workflow-dashboard.sql`

Faylda shart:
```sql
-- APPROVED: <egasi> <sana>
-- EP-COR-015..018 (Rek-Sovet) + EP-COR-119 (workflow_rules) + EP-COR-130 (smena_checklist)
```

**Jadvallar:** `rec_council_sessions`, `rec_council_zvs_items`, `workflow_rules`, `smena_checklist_templates`

### Egasi stamp qilgandan keyin bajarish tartibi:

```bash
# Faqat egasi "APPROVED" deb yozgandan keyin:
psql $DATABASE_URL -f apps/api/src/shared/db/migrations/cor-p3-company-orders.sql
psql $DATABASE_URL -f apps/api/src/shared/db/migrations/cor-p4-rec-council-workflow-dashboard.sql

# Tekshirish:
psql $DATABASE_URL -c "\dt company_orders rec_council_sessions workflow_rules smena_checklist_templates order_acknowledgements"
```

---

## 6. QABUL MEZONI

Barcha 7 shart bajarilgandan keyin paket yopiladi:

### 6.1 BE real (DoD-1)
- [ ] `GET /api/coordination/orders` → real `company_orders` SELECT, bo'sh bo'lsa `[]`
- [ ] `POST /api/coordination/orders` → real INSERT, `order_number` avtomatik (`K-2026-001` formati EP-COR-057; yoki egasi `PR-YYYY-NNN` EP-COR-056 ni tasdiqlasa — §2.1 MOSLIK ESLATMASI)
- [ ] `POST /api/coordination/orders/:id/sign` → `is_immutable=true`, KADRLAR/MOLIYA da director gate ishlaydi
- [ ] `POST /api/coordination/orders/:id/director-approve` → `director_approved_at` yoziladi
- [ ] `POST /api/coordination/orders/:id/acknowledge` → `order_acknowledgements` ga INSERT
- [ ] `GET /api/coordination/rec-council` → real `rec_council_sessions` SELECT
- [ ] `POST /api/coordination/rec-council/open` → real INSERT, status='OPEN'
- [ ] `POST /api/coordination/rec-council/:id/zvs-items` → real INSERT `rec_council_zvs_items`
- [ ] `POST /api/coordination/rec-council/:id/close` → statistika hisoblash + status='CLOSED'
- [ ] `GET /api/coordination/dashboard` → real DB so'rovlar (stub emas)
- [ ] `GET/POST /api/coordination/workflow-rules` → real CRUD
- [ ] Barcha repo/service metodlari `Result<T>` qaytaradi; `throw`/`null` yo'q
- [ ] Zod validation barcha `@Body` uchun ishlaydi

### 6.2 FE real (DoD-2)
- [ ] `PrikazlarListPage`: isLoading → Skeleton; data → jadval; empty → "Prikazlar yo'q" xabari
- [ ] `PrikazlarFormPage`: forma saqlansa → `POST /api/coordination/orders` → `/coordination?tab=orders` ga redirect
- [ ] `RecCouncilPage`: sessiya ochish → ZVS qo'shish → yopish → hisobot (round-trip)
- [ ] `WorkflowRulesPage`: ro'yxat + yangi qoida yaratish (round-trip)
- [ ] `CoordinationPage`: orders/rec-council/workflow-rules tablari ko'rinadi va ishlaydi
- [ ] EP Linear Soft tokenlar (`var(--ep-*)`) — inline `style={{ color:'#xxx' }}` yo'q

### 6.3 i18n (DoD-5)
- [ ] Barcha yangi UI satrlari uz/ru kalit orqali; JSX'da hardcoded Uzbek/Rus yo'q

### 6.4 Cron (DoD-7)
- [ ] `CoordinationCronService` registr qilingan (director.module.ts — FLAG keltirilgan)
- [ ] Seshanba 08:45 CRON: `EP-COR-017` log chiqaradi
- [ ] Kunlik escalation CRON: `EP-COR-027` muddati o'tgan dokladlarni `overdue` qiladi

### 6.5 DDL gated (DoD boshlanishidan oldin)
- [ ] `cor-p3-company-orders.sql` — `-- APPROVED:` to'ldirilgan va psql bilan bajarilgan
- [ ] `cor-p4-rec-council-workflow-dashboard.sql` — `-- APPROVED:` to'ldirilgan va psql bilan bajarilgan
- [ ] H4 two-world tekshiruvi: `company_orders` PP `orders` bilan to'qnashmaydi

### 6.6 Oltin zanjir regress (DoD qayta tekshiruv)
- [ ] Mavjud `GET /api/coordination/dokla` hamon ishlaydi (regress yo'q — Q-39)
- [ ] Mavjud `POST /api/coordination/dokla` hamon ishlaydi
- [ ] Mavjud `GET /api/coordination/stats` hamon ishlaydi
- [ ] `CoordinationPage.tsx` mavjud tablar (overview/dokla/rasporyazhenie) buzilmagan

### 6.7 Tekshiruv skriptlari
```bash
bash scripts/reviewer-result-pattern.sh  # 0 FAIL
bash scripts/reviewer-as-unknown.sh      # yangi fayllar FAIL bermasin
bash scripts/reviewer-dto-validation.sh  # yangi controller DTO bilan
npx tsc -p apps/api/tsconfig.json --noEmit     # 0 xato
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit  # 0 xato
```

---

## 7. SELF-VERIFY

> Har qadam bajarilgandan keyin quyidagi tekshiruvlarni o'tkazish SHART.

### 7.1 BE tsc 0
```bash
npx tsc -p apps/api/tsconfig.json --noEmit 2>&1 | grep -E "error TS" | head -20
# Kutilgan natija: bo'sh chiqish (0 xato)
```

### 7.2 FE tsc 0
```bash
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit 2>&1 | grep -E "error TS" | head -20
# Kutilgan natija: bo'sh chiqish (0 xato)
```

### 7.3 Jonli DB-proof (migration APPROVED va bajarilgandan keyin)

```sql
-- a) Jadvallar mavjudligini tekshir
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'company_orders', 'order_acknowledgements',
    'rec_council_sessions', 'rec_council_zvs_items',
    'workflow_rules', 'smena_checklist_templates'
  )
ORDER BY table_name;
-- Kutilgan: 6 ta qator

-- b) Prikaz yaratish (real INSERT):
INSERT INTO company_orders
  (order_number, category, prefix, title, basis_document, created_by)
VALUES
  ('K-2026-001', 'KADRLAR', 'K', 'Test prikaz', 'Protokol #5 (2026-06-19)', 1)
RETURNING id, order_number, status, is_immutable;
-- Kutilgan: status='DRAFT', is_immutable=false

-- c) Imzolash:
UPDATE company_orders SET status='SIGNED', is_immutable=true,
  signed_by_id=1, signed_at=NOW(),
  signed_confirmation_text='Test imzo | IP: 127.0.0.1'
WHERE id = <id_yuqoridan>
RETURNING id, status, is_immutable;
-- Kutilgan: status='SIGNED', is_immutable=true

-- d) Immutability tekshiruvi:
UPDATE company_orders SET title='O''zgartirishga urinish'
WHERE id = <id_yuqoridan> AND is_immutable = false;
-- Kutilgan: 0 ROWS affected (qoida bajarildi)

-- e) Rek-Sovet sessiya:
INSERT INTO rec_council_sessions (session_date, opened_by)
VALUES (CURRENT_DATE, 1) RETURNING id, status;
-- Kutilgan: status='OPEN'

-- f) ZVS item (agar zvs jadvali tayyor bo'lsa):
INSERT INTO rec_council_zvs_items
  (session_id, zvs_id, decision, approved_amount, decided_by)
VALUES (<session_id>, 1, 'APPROVED', 5000000, 1) RETURNING id;

-- g) Sessiyani yopish:
UPDATE rec_council_sessions
SET status='CLOSED', closed_by=1, closed_at=NOW(),
    total_zvs_count=1, approved_count=1, total_approved_amount=5000000
WHERE id = <session_id> RETURNING id, status, approved_count;
-- Kutilgan: status='CLOSED'

-- h) Workflow rule:
INSERT INTO workflow_rules (document_type, routing_rule, description, created_by)
VALUES ('PRIKAZ', '{"priority": "HIGH"}', 'Test qoida', 1) RETURNING id;
```

### 7.4 API endpoint tekshiruvi (login kerak — JWT token olib)

```bash
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASS>"}' | jq -r '.access_token')

# Prikazlar ro'yxati
curl -s http://localhost:3030/api/coordination/orders \
  -H "Authorization: Bearer $TOKEN" | jq '.data // . | length'
# Kutilgan: 0 yoki ko'proq (list ishlaydi)

# Dashboard
curl -s http://localhost:3030/api/coordination/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq '{open_doklads, active_orders}'
# Kutilgan: raqamlar (stub emas)

# Rek-Sovet sessiyalar
curl -s http://localhost:3030/api/coordination/rec-council \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
```

### 7.5 FE round-trip tekshiruvi

```
1. http://localhost:5173/coordination?tab=orders ochiq → PrikazlarListPage ko'rinadi
2. "Yangi prikaz" → PrikazlarFormPage → kategoriya=Kadrlar, manba hujjat=test, saqla
3. Sahifani qayta och → yangi prikaz ro'yxatda ko'rinadi (real DB)
4. http://localhost:5173/coordination?tab=rec-council → RecCouncilPage ko'rinadi
5. "Sessiya ochish" → form → saqla → sessiya ro'yxatda ko'rinadi
6. http://localhost:5173/coordination?tab=workflow-rules → WorkflowRulesPage ko'rinadi
7. "Yangi qoida" → form → saqla → qoida ro'yxatda ko'rinadi
```

### 7.6 Cron tekshiruvi (log orqali)

```bash
# Backend log da (dev mode):
pnpm --filter @europrint/api run dev:unsafe 2>&1 | grep "EP-COR-017\|EP-COR-027\|EP-COR-086"
# Cron registrlashni manual tekshirish:
grep -r "CoordinationCronService" apps/api/src/modules/director/director.module.ts
```

---

## 8. COMMIT

Barcha commitlar `git add <aniq-fayl>` bilan. `-A` yoki `.` TAQIQ (Q-8, Q-23).

### Commit ketma-ketligi (to'liq ro'yxat):

```bash
# QADAM 2: DDL P3
git add apps/api/src/shared/db/migrations/cor-p3-company-orders.sql
git commit -m "feat(COR/P32): cor-p3-company-orders.sql GATED — company_orders+order_acknowledgements DDL (EP-COR-057..061)"

# QADAM 3: DDL P4
git add apps/api/src/shared/db/migrations/cor-p4-rec-council-workflow-dashboard.sql
git commit -m "feat(COR/P32): cor-p4-rec-council-workflow-dashboard.sql GATED — rec_council/workflow_rules/smena_checklist DDL (EP-COR-015..018/119/130)"

# QADAM 4: Company Orders BE
git add apps/api/src/modules/director/presentation/dto/company-orders.dto.ts
git add apps/api/src/modules/director/domain/repositories/i-company-orders.repo.ts
git add apps/api/src/modules/director/infrastructure/repositories/company-orders.repository.ts
git add apps/api/src/modules/director/application/company-orders.service.ts
git add apps/api/src/modules/director/presentation/company-orders.controller.ts
git commit -m "feat(COR/P32): company_orders CRUD+sign+director-gate+ack (EP-COR-019..025/057..061/132)"

# QADAM 5: Rek-Sovet BE
git add apps/api/src/modules/director/presentation/dto/rec-council.dto.ts
git add apps/api/src/modules/director/domain/repositories/i-rec-council.repo.ts
git add apps/api/src/modules/director/infrastructure/repositories/rec-council.repository.ts
git add apps/api/src/modules/director/application/rec-council.service.ts
git add apps/api/src/modules/director/presentation/rec-council.controller.ts
git commit -m "feat(COR/P32): rec-council session CRUD+ZVS qaror+hisobot (EP-COR-015..018)"

# QADAM 6: Cron
git add apps/api/src/modules/director/infrastructure/crons/coordination-cron.service.ts
git commit -m "feat(COR/P32): coordination-cron — Seshanba 08:45 + escalation + 24h push (EP-COR-017/027/086)"

# QADAM 7: Dashboard+Workflow extend
git add apps/api/src/modules/director/presentation/coordination.controller.ts
git add apps/api/src/modules/director/application/coordination.service.ts
git commit -m "feat(COR/P32): dashboard+workflow_rules endpoints (EP-COR-026/119)"

# QADAM 8: FE sahifalar
git add artifacts/erp-dashboard/src/pages/coordination/PrikazlarListPage.tsx
git add artifacts/erp-dashboard/src/pages/coordination/PrikazlarFormPage.tsx
git commit -m "feat(COR/P32): PrikazlarListPage+PrikazlarFormPage (EP-COR-057/132)"

git add artifacts/erp-dashboard/src/pages/coordination/RecCouncilPage.tsx
git add artifacts/erp-dashboard/src/pages/coordination/WorkflowRulesPage.tsx
git commit -m "feat(COR/P32): RecCouncilPage+WorkflowRulesPage (EP-COR-015..018/119)"

# QADAM 10: CoordinationPage extend
git add artifacts/erp-dashboard/src/pages/CoordinationPage.tsx
git commit -m "feat(COR/P32): CoordinationPage — orders/rec-council/workflow tabs (EP-COR-026)"

# QADAM 11: i18n
git add artifacts/erp-dashboard/src/locales/uz/coordination.json
git add artifacts/erp-dashboard/src/locales/ru/coordination.json
git commit -m "feat(COR/P32): i18n uz+ru — prikazlar/rek-sovet/workflow kalitlari"
```

### Commit format qoidasi:
```
feat(COR/P32): <bir satr tavsif>   ← 70 belgidan oshmasin
                                    ← EP-COR-### kodlari oxirida
```

### Holat hisoboti (har qadam oxirida egaga ko'rsatiladi):
```
P32 holati: Qadam N bajarildi
  ✅ Bajarildi: <nima qilindi>
  📝 Commitlandi: <commit hash>
  ⚠️ Deferred: <nima va nima uchun>
  🔒 GATED: DDL migration — egasi tasdig'i kutilmoqda
  ➡️ Keyingi: Qadam N+1 — <tavsif>
```

---

> **P32 yopilish sharti:** Barcha 6.1–6.7 cheklistlari ✅ + egasi "DONE" deydi.
> **Keyingi paket:** P33 (LMS core DDL) — mustaqil to'lqin.

