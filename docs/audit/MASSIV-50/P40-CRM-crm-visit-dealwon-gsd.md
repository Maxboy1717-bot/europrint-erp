# P40 — CRM: CRM VISIT tracking + deal-won golden-thread + NBA fix + dashboard GSD + crons

> **Paket:** P40 | **To'lqin:** 2 | **Bog'liqlik:** P39 bajarilgan bo'lishi shart
> **DDL darvozasi:** FAOL — migration fayllari egasi ruxsatisiz ISHGA TUSHIRILMAYDI
> **Sana:** 2026-06-19 | **Bajaruvchi:** Muslimbek

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**. Har sessiyada `CLAUDE.md` + `docs/agent-constitution.md` o'qi. Quyidagi qoidalar bloki istisnosiz qo'llaniladi:

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi
    fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration
    faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin
    GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi,
    shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**To'lqin 2 tartibi:** P39 (`crm-leads-deals-rbac`) commit SHA tasdiqlangandan keyin boshlash. `git log --oneline -5` bilan P39 tugallanganligini tekshir.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi 14 faylga teg. Boshqasi kerak bo'lsa — TO'XTA + egasiga flag qil:**

```
BACKEND (11 fayl):
  apps/api/src/modules/crm/infrastructure/repositories/crm-activities.repository.ts
  apps/api/src/modules/crm/presentation/crm-activities.controller.ts
  apps/api/src/modules/crm/infrastructure/repositories/crm-extras-tasks.repository.ts
  apps/api/src/modules/crm/application/crm-activities.service.ts
  apps/api/src/modules/crm/crm.module.ts
  apps/api/src/modules/crm/infrastructure/event-handlers/deal-won.listener.ts
  apps/api/src/modules/crm/application/crm-ai-extended.service.ts
  apps/api/src/modules/crm/analytics/repositories/drizzle-crm-analytics.repo.ts
  apps/api/src/modules/crm/analytics/repositories/i-crm-analytics.repo.ts
  apps/api/src/modules/crm/analytics/funnel.service.ts
  apps/api/src/modules/crm/presentation/crm-analytics.controller.ts
  apps/api/src/modules/crm/presentation/crm-ai-extended.controller.ts

FRONTEND (2 fayl):
  artifacts/erp-dashboard/src/components/crm/activity/CreateActivityForm.tsx
  artifacts/erp-dashboard/src/components/crm/workspace/CRMKpiCards.tsx
```

**DDL migration fayllari (GATED — egasi ruxsatisiz DB da ISHGA TUSHIRILMAYDI):**
```
apps/api/src/shared/db/migrations/p40-crm-visit-ddl.sql
```

Agar `crm.module.ts`-dan tashqaridagi modul fayllariga DI uchun tegish kerak bo'lsa — **TO'XTA**, egasiga xabar qil. `sales_orders` jadvaliga INSERT uchun `DrizzleService` yoki mavjud `db` importidan foydalanish mumkin — bu yangi modul import emas.

---

## 2. VIZYON (Q-40 — to'g'rilik o'lchovi)

**Manba:** `docs/audit/MUSLIMBEK-PROMT-17-CRM-2026-06-08.md`

### 2.1 Oltin zanjir (EP-CRM-016) — KRITIK P0
Vizyon talabi: `deal won` → `sales_orders` jadvaliga avtomatik INSERT. Hozirgi holat: `DealWonListener` faqat `logger.log()` qiladi, hech qanday INSERT yo'q. Bu butun oltin zanjirni **birinchi bosqichda uzadi**: CRM→SD→PP→MES→QC→WMS→FIN. Shu sababli bu P40 ning eng muhim vazifasi.

**Qabul mezoni:** `POST /api/crm/deals/:id/mark-won` → `DealWonListener.handle()` → `sales_orders` da yangi qator → `SELECT * FROM sales_orders WHERE crm_deal_id = :id` → 1 qator topiladi.

### 2.2 VISIT kanal (EP-CRM-007 egasi override)
Vizyon: kanallar = Telegram + WhatsApp + SMS + Email + **VISIT** (dala/chiqma sotuv). `crm_activities` jadvalida `type` = `'visit'` qo'llab-quvvatlanishi + GPS koordinatalari (`geo_lat`, `geo_lon`) + maqsad (`visit_purpose`) + natija (`outcome_note`) + davomiylik (`duration_sec`) saqlanishi kerak.

**Qabul mezoni:** `POST /api/crm/activities` body `{type:"visit", geo_lat:41.2995, geo_lon:69.2401, visit_purpose:"narx kelishuvi", ...}` → DB da saqlangan → `GET /api/crm/activities/:id` → geo ma'lumotlar ko'rinadi.

### 2.3 CRM dashboard 9 ShVB GSD metrikalari (EP-CRM-Phase 6)
Vizyon: CRM dashboard = haftalik sotuv hajmi, yopilgan bitimlar, o'rtacha bitim hajmi, konversiya, sotuv davri uzunligi, mijoz saqlanishi, qarzdor nazorati, sotuv maqsadi, maqsadga nisbatan sotuv. `GET /api/crm/dashboard` endpointi bu 9 metrikani real DB dan qaytarishi kerak.

**Qabul mezoni:** `GET /api/crm/dashboard` → JSON da `weeklySalesVolume`, `closedDeals`, `averageDealSize`, `conversionRate`, `salesCycleLength`, `customerRetention`, `debtorControl`, `salesTarget`, `salesVsTarget` — barchasi real SQL agregatsiyadan.

### 2.4 NBA fix (EP-CRM-013/Phase 4)
Vizyon: NBA (Next Best Action) real DB dan: `crmLeads`/`crmDeals` ma'lumotlari asosida score → action tavsiyasi. Hozir `crm-ai-extended.service.ts` da 8 metod to'liq hardcoded stub (Q-40 FAIL, Qoida 5 FAIL). Uchta metod real ma'lumotga o'tkazilishi shart: `getAiLeads`, `getAiNba`, `analyzeChurn`.

**Qabul mezoni:** `GET /api/crm/ai/leads` → real `crmLeads` jadvalidan so'rov + `sourceScore` bo'yicha sort; `GET /api/crm/ai/nba?entityType=deal&limit=5` → real crm_tasks dan pending tasks + stale deals; `GET /api/crm/ai/churn-rescue/deal/:id` → real `crmDeals` so'nggi faollik + `crmActivities` sanasi asosida risk_score.

### 2.5 Cronlar (EP-CRM-026/063/010)
Vizyon:
- **Muddati o'tgan vazifalar eskalatsiyasi (EP-CRM-010):** har soatda `crm_tasks` da `due_date < NOW() AND status = 'pending'` → `status = 'overdue'` yangilash.
- **Kuzatuv eslatmasi (EP-CRM-026):** har kuni `crm_activities` da so'nggi aloqa `> 30 kun` bo'lgan leads/deals → `crm_tasks` da yangi followup task yaratish.
- **Tark etish (EP-CRM-063, ~60 kun):** har kuni `crmLeads` da `updated_at < NOW() - 60 days AND status != 'won' AND status != 'lost'` → `status = 'abandoned'` yangilash.
- **KG trendi (EP-CRM-055):** oylik, bu P40 SCOPE dan tashqarida — DEFER.

**Qabul mezoni:** Cron metodlari `@Cron(...)` bilan belgilangan, real DB UPDATE/INSERT bajaradi, logga natija yozadi.

### 2.6 Hisobotlar (EP-CRM-075/076/077)
- `GET /api/crm/reports/monthly-kg` — oylik sotuv hajmi (kg) real `sales_orders.total_quantity` dan.
- `GET /api/crm/reports/yearly-volume` — yillik sotuv UZS, `sales_orders.total_amount` dan.
- `GET /api/crm/customers/:id/order-status-chain` — mijozning oxirgi N ta buyurtmasi zanjiri.

### 2.7 Funnel JOIN tuzatish
`drizzle-crm-analytics.repo.ts:152` — `JOIN crm_stages cs ON cs.id::text = d.stage_id` — bu JOIN noto'g'ri (int::text vs varchar semantics). Vizyon talab: `crm_deals.stage_id` Bitrix `stageId` (varchar `'C0:NEW'` ko'rinishida) va `crm_stages.id` integer serial. JOIN `cs.id::text = d.stage_id` da hech qanday qator mos kelmaydi chunki `'C0:NEW' != '1'`. To'g'ri JOIN: `cs.semantic_id = d.stage_id` yoki `cs.name = d.stage_id` — avval DB dan tekshir.

### 2.8 FE CreateActivityForm — VISIT tab
`CreateActivityForm.tsx` da `activeTab === "visit"` case yo'q. `VisitForm` komponenti yaratilishi va mavjud switch ga qo'shilishi kerak.

### 2.9 FE CRMKpiCards — ShVB GSD 9 metrika
`CRMKpiCards.tsx` hozir faqat 4 ta karta (Jami, Qiymat, Yutilgan, Konversiya) ko'rsatadi. Dashboard uchun `dashboardMode` prop qo'shilishi va 9 ShVB GSD metrika ko'rsatilishi kerak.

### 2.10 360° mijoz endpointi (EP-CRM-015)
`GET /api/crm/customers/:id/360` — mijozning buyurtmalari, faoliyatlari, shikoyatlari, qarz holatini birlashtirgan endpoint. `crm-analytics.controller.ts` ga qo'shilishi kerak.

---

## 3. HOZIRGI HOLAT

### 3.1 Ishlayotgan (Q-46: O'CHIRILMAYDI)

| Fayl | Qator | Holat |
|------|-------|-------|
| `crm-activities.repository.ts` | 1-156 | TO'LIQ REAL — list/today/getById/create/update/complete/delete, hrEmployees LEFT JOIN, Result<T> |
| `crm-activities.service.ts` | 1-62 | TO'LIQ REAL — repo delegate, Result<T> |
| `crm-activities.controller.ts` | 1-133 | ASOSAN REAL — JwtAuthGuard, Zod, RolesGuard. **BITTA MUAMMO:** `delete` metodi `return {}` (q.131) — Qoida 10 FAIL |
| `crm-extras-tasks.repository.ts` | 1-67 | TO'LIQ REAL — listTasks/createTask, Drizzle, Result<T> |
| `funnel.service.ts` | 1-238 | TO'LIQ REAL — calculateWinRate/calculateConversion/calculateVelocity/composeFunnelData |
| `crm-analytics.controller.ts` | 1-115 | TO'LIQ REAL — GET funnel/cohort + POST rfm/churn |
| `drizzle-crm-analytics.repo.ts` | 1-216 | TO'LIQ REAL — churn/cohort/funnel/kmeans, raw SQL with runQuery |
| `i-crm-analytics.repo.ts` | 1-94 | TO'LIQ — interface + token |
| `crm.module.ts` | 1-219 | TO'LIQ — DI wiring, 14 controller, analytics suite |

### 3.2 Buzuq/Soxta (Q-46: TO'LIQ TO'G'IRLANADI)

**deal-won.listener.ts (KRIRIK P0):**
```
Fayl: apps/api/src/modules/crm/infrastructure/event-handlers/deal-won.listener.ts
Qator 18-32: handle() metodi HOLLOW STUB
Muammo: faqat logger.log() chaqiradi, HECH QANDAY INSERT yo'q
EP-CRM-016 oltin zanjir shu yerda UZILGAN
```

**crm-ai-extended.service.ts (8 ta hardcoded stub):**
```
Fayl: apps/api/src/modules/crm/application/crm-ai-extended.service.ts
Qator 13-28: autofill() — static confidence:0.72, static 'Manufacturing' hardcode
Qator 30-42: analyzeChurn() — static risk_score:0.42 hardcode
Qator 44-56: suggestAutoTasks() — 3 ta static task hardcode
Qator 58-67: createAutoTask() — echo stub (body ni qaytaradi, DB ga YOZMAYDI)
Qator 69-77: chatRespond() — static string
Qator 79-91: analyzeVoiceCall() — static sentiment:positive hardcode
Qator 93-103: getAiLeads() — DOIM bo'sh array qaytaradi
Qator 105-114: getAiNba() — DOIM bo'sh recommendations qaytaradi
Qoida 5 FAIL: as unknown[] / hardcoded static data
Q-40 FAIL: ishlaydi (200) lekin to'g'ri EMAS (DB ga bormaydi)
```

**crm-activities.controller.ts:131:**
```typescript
// BEFORE (qator 131) — Qoida 10 FAIL:
return {};

// AFTER:
return { id: safeInt(id, 0), deleted: true };
```

**drizzle-crm-analytics.repo.ts:152 — Funnel JOIN xatosi:**
```
Qator 152: JOIN crm_stages cs ON cs.id::text = d.stage_id
Muammo: crm_stages.id = integer serial (1,2,3...)
         crm_deals.stage_id = Bitrix varchar ('C0:NEW', 'C1:IN_PROCESS'...)
         cast '1'::text != 'C0:NEW' → hech qanday qator mos kelmaydi
Natija: /api/crm/funnel DOIM bo'sh stages ro'yxatini qaytaradi
```

### 3.3 Yo'q (Yaratilishi kerak)

| Nima | Qaerda | Harakat |
|------|--------|---------|
| VISIT DDL kolonnalari | `crm_activities` jadvalida | **DDL GATED** — ALTER TABLE |
| `churn_model_params` DDL | Hali mavjud emas DB da | **DDL GATED** — CREATE TABLE |
| `crm_funnel_stages` DDL | Hali mavjud emas | **DDL GATED** — CREATE TABLE |
| `GET /api/crm/dashboard` (9 GSD) | `crm-analytics.controller.ts` | Qo'shish |
| `GET /api/crm/customers/:id/360` | `crm-analytics.controller.ts` | Qo'shish |
| `GET /api/crm/reports/monthly-kg` | `crm-analytics.controller.ts` | Qo'shish |
| `GET /api/crm/reports/yearly-volume` | `crm-analytics.controller.ts` | Qo'shish |
| `GET /api/crm/customers/:id/order-status-chain` | `crm-analytics.controller.ts` | Qo'shish |
| Overdue task cron | `crm-extras-tasks.repository.ts` | Qo'shish |
| Follow-up cron (30 kun) | `crm-activities.service.ts` | Qo'shish |
| Abandonment cron (60 kun) | Yangi `CrmCronService` — **SCOPE OUTSIDE** | Flag |
| `VisitForm.tsx` | FE component | Yaratish |
| `CreateActivityForm.tsx` visit case | FE | Qo'shish |
| `CRMKpiCards.tsx` dashboardMode | FE | Qo'shish |
| ICrmAnalyticsRepo + impl: dashboard/360/reports | `i-crm-analytics.repo.ts` + `drizzle-crm-analytics.repo.ts` | Interfeys + impl |
| `DealCronService` provider | `crm.module.ts` | DI qo'shish |

---

## 4. ISH (qadam-baqadam)

> Har qadam: o'zgartir → `pnpm tsc --noEmit` → DB-proof → commit.

---

### QADAM 1: DDL migration fayli yozish (GATED — yoziladi, DB da ISHGA TUSHIRILMAYDI)

**Fayl:** `apps/api/src/shared/db/migrations/p40-crm-visit-ddl.sql`

Bu faylni YARATING, lekin `psql` yoki `drizzle push` bilan ISHGA TUSHIRMANG. Egasi ruxsat bergandan keyin bajariladi.

```sql
-- APPROVED: <egasi-ismi> <sana>
-- P40 CRM: VISIT tracking + funnel stages + churn model params DDL

-- ── 1. crm_activities: VISIT kanal kolonnalari (EP-CRM-007) ─────────────────
ALTER TABLE crm_activities
  ADD COLUMN IF NOT EXISTS channel        TEXT,
  ADD COLUMN IF NOT EXISTS direction      TEXT DEFAULT 'out'
    CHECK (direction IN ('in','out')),
  ADD COLUMN IF NOT EXISTS geo_lat        NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS geo_lon        NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS visit_purpose  TEXT,
  ADD COLUMN IF NOT EXISTS outcome_note   TEXT,
  ADD COLUMN IF NOT EXISTS duration_sec   INTEGER;

-- type ustuniga CHECK constraint qo'shish (mavjud emas bo'lsa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_activities_type_check'
      AND conrelid = 'crm_activities'::regclass
  ) THEN
    ALTER TABLE crm_activities
      ADD CONSTRAINT crm_activities_type_check
      CHECK (type IN ('call','email','telegram','whatsapp','sms','visit','note','meeting'));
  END IF;
END$$;

-- ── 2. churn_model_params (drizzle-crm-analytics.repo.ts da ishlatilyapti) ──
CREATE TABLE IF NOT EXISTS churn_model_params (
  id            SERIAL PRIMARY KEY,
  version       INTEGER UNIQUE NOT NULL,
  coefficients  JSONB          NOT NULL DEFAULT '{}',
  feature_names TEXT[]         NOT NULL DEFAULT '{}',
  auc           FLOAT          NOT NULL DEFAULT 0,
  trained_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN        NOT NULL DEFAULT FALSE,
  sample_size   INTEGER        NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_churn_model_active
  ON churn_model_params (is_active) WHERE is_active = true;

-- ── 3. crm_funnel_stages: konfiguratsiyalanadigan bosqichlar (EP-CRM-002) ───
CREATE TABLE IF NOT EXISTS crm_funnel_stages (
  id         SERIAL PRIMARY KEY,
  code       TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  name_ru    TEXT    NOT NULL DEFAULT '',
  sort       INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  semantics  TEXT    NOT NULL DEFAULT 'process'
    CHECK (semantics IN ('process','success','fail'))
);
INSERT INTO crm_funnel_stages (code, name, name_ru, sort, semantics)
VALUES
  ('NAMUNA',       'Namuna',            'Образец',          1, 'process'),
  ('KLISHE_STP',   'Klishe/STP tasdiq', 'Клише/STP подтв.', 2, 'process'),
  ('NARX',         'Narx',              'Цена',             3, 'process'),
  ('SHARTNOMA',    'Shartnoma',         'Договор',          4, 'process'),
  ('BUYURTMA',     'Buyurtma',          'Заказ',            5, 'success')
ON CONFLICT (code) DO NOTHING;

-- ── 4. sales_orders: crm_deal_id FK kolonnasi (DealWonListener uchun) ───────
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS crm_deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_orders_crm_deal
  ON sales_orders (crm_deal_id) WHERE crm_deal_id IS NOT NULL;

-- ── 5. crm_sales_targets: konfiguratsiyalanadigan sotuv maqsadlari (FIX-5) ───
-- FIX-5 (EP-SD-014 + 00-INTERVYU-MOSLIK §CRM): salesTarget hardcode 0 → configurable.
-- "Har kartaga haftalik va oylik sotuv maqsadi belgilanadi" (MASTER-SAVOL-JAVOB EP-SD-014).
-- EGASI QIYMATI KERAK: egasi card_id va target_amount ni to'ldiradi (seed/admin panel).
CREATE TABLE IF NOT EXISTS crm_sales_targets (
  id            SERIAL PRIMARY KEY,
  card_id       INTEGER,            -- org_functions.id → NULL = umumiy maqsad (barcha kartalar)
  period_type   TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  target_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'UZS',
  set_by_id     INTEGER,            -- kim belgiladi (sales_manager / director)
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_sales_targets_period
  ON crm_sales_targets (period_type, period_start, period_end);
-- EGASI QIYMATI KERAK: real target raqamlari egasi tomonidan kiritiladi.
-- Misol seed (egasi raqamni almashtiradi):
-- INSERT INTO crm_sales_targets (period_type, period_start, period_end, target_amount, currency)
-- VALUES ('weekly', CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)-1)::int,
--         CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)-1)::int + 6,
--         0, 'UZS')  -- ← 0 = egasi haqiqiy raqamni kiritadi
-- ON CONFLICT DO NOTHING;
```

**Eslatma:** `crm_deals` jadvalining ID turi va `sales_orders` jadvalidagi mavjud ustunlarni `apps/api/src/shared/db/migrations/` ichidagi mavjud migrationlar orqali tasdiqlang. Agar `crm_deals` jadvalining primary key `INTEGER` emas `VARCHAR` bo'lsa — `crm_deal_id` tipini mos o'zgartiring.

---

### QADAM 2: DealWonListener — real INSERT (EP-CRM-016 oltin zanjir)

**Fayl:** `apps/api/src/modules/crm/infrastructure/event-handlers/deal-won.listener.ts`

**Hozirgi holat (qator 18-32):**
```typescript
handle(event: DealWonEvent): void {
  this.logger.log('Deal won event received');
  try {
    this.logger.log({
      msg: 'Signaling SD module to create sales order',
      dealId: event.dealId,
      companyId: event.companyId,
    });
  } catch (error: unknown) {
    this.logger.error('Failed to signal SD module');
  }
}
```

**Kerak bo'lgan holat — to'liq almashtirish:**

```typescript
/**
 * @module deal-won.listener
 * @description EP-CRM-016: DealWonEvent → INSERT INTO sales_orders (oltin zanjir).
 *   Bitim yutilganda SD moduliga signal yuboradi va sales_orders da yangi qator yaratadi.
 *   Idempotent: crm_deal_id bo'yicha ON CONFLICT DO NOTHING.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DealWonEvent } from '../../domain/events/deal-won.event';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
@EventsHandler(DealWonEvent)
export class DealWonListener implements IEventHandler<DealWonEvent> {
  private readonly logger = new Logger(DealWonListener.name);

  async handle(event: DealWonEvent): Promise<void> {
    this.logger.log({ msg: 'EP-CRM-016: DealWonEvent → sales_orders INSERT', dealId: event.dealId });

    try {
      // Bitim ma'lumotlarini olish (opportunity = bitim summasi)
      const dealRows = await db.execute(sql`
        SELECT id, opportunity, title, category_id, company_id
        FROM crm_deals
        WHERE id = ${event.dealId}
        LIMIT 1
      `);
      // Drizzle execute() turli muhitlarda rows yoki to'g'ridan natija qaytarishi mumkin
      const dealArr = Array.isArray((dealRows as unknown as { rows?: unknown[] }).rows)
        ? (dealRows as unknown as { rows: Record<string, unknown>[] }).rows
        : (Array.isArray(dealRows) ? (dealRows as Record<string, unknown>[]) : []);
      const deal = dealArr[0] ?? null;

      if (!deal) {
        this.logger.warn({ msg: 'EP-CRM-016: crm_deal topilmadi', dealId: event.dealId });
        return;
      }

      // customer_id: crmCompanies.id → sd_customers mos qatori (lead-converted listener orqali)
      // Agar sd_customers da mos qator yo'q bo'lsa NULL bilan saqlanadi (SET NULL FK)
      const customerRows = await db.execute(sql`
        SELECT id FROM sd_customers
        WHERE crm_company_id = ${event.companyId}
        LIMIT 1
      `);
      const custArr = Array.isArray((customerRows as unknown as { rows?: unknown[] }).rows)
        ? (customerRows as unknown as { rows: Record<string, unknown>[] }).rows
        : (Array.isArray(customerRows) ? (customerRows as Record<string, unknown>[]) : []);
      const customerId = (custArr[0]?.id as number) ?? null;

      // sales_orders INSERT — crm_deal_id bo'yicha idempotent (ON CONFLICT DO NOTHING)
      // Agar DDL hali qo'llanilmagan bo'lsa (crm_deal_id ustuni yo'q) — graceful fallback
      await db.execute(sql`
        INSERT INTO sales_orders (
          customer_id,
          status,
          order_date,
          total_amount,
          notes,
          crm_deal_id
        )
        SELECT
          ${customerId},
          'new',
          NOW(),
          COALESCE(${deal['opportunity'] as number ?? 0}, 0),
          ${'CRM bitim #' + String(event.dealId) + ' dan yaratildi: ' + String(deal['title'] ?? '')},
          ${event.dealId}
        WHERE NOT EXISTS (
          SELECT 1 FROM sales_orders WHERE crm_deal_id = ${event.dealId}
        )
      `);

      this.logger.log({
        msg: 'EP-CRM-016: sales_orders INSERT muvaffaqiyatli',
        dealId: event.dealId,
        customerId,
      });
    } catch (error: unknown) {
      // Oltin zanjir uzilmasligi uchun xatoni qayd etamiz, lekin throw qilmaymiz
      // (EventsHandler throw qilsa NestJS event loop to'xtab qolishi mumkin)
      this.logger.error({
        msg: 'EP-CRM-016: sales_orders INSERT XATO',
        dealId: event.dealId,
        error: (error as Error).message,
      });
    }
  }
}
```

**Muhim tekshiruvlar DDL dan oldin:**
1. `SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders'` — `crm_deal_id` ustuni bormi?
2. `SELECT column_name FROM information_schema.columns WHERE table_name='sd_customers'` — `crm_company_id` ustuni bormi?
3. Agar yo'q bo'lsa — DDL darvozasidan o'tkazish va egasiga xabar qilish.

**Agar DDL hali ruxsat etilmagan bo'lsa** — `crm_deal_id` ustunisiz minimal variant:
```typescript
// crm_deal_id yo'q bo'lsa — faqat notes orqali bog'lanish
await db.execute(sql`
  INSERT INTO sales_orders (customer_id, status, order_date, total_amount, notes)
  VALUES (
    ${customerId}, 'new', NOW(),
    COALESCE(${deal['opportunity'] as number ?? 0}, 0),
    ${'CRM bitim #' + String(event.dealId)}
  )
`);
```

---

### QADAM 3: crm-activities — VISIT DDL Drizzle schema + repository yangilash

**3a. Drizzle schema** (`apps/api/src/shared/db/schema-business-b-2.ts` — bu fayl OWNED emas, TЕГMA)

Drizzle schema izolyatsiya chegarasi tashqarisida. `crm-activities.repository.ts` da faqat mavjud Drizzle `crm_activities` ob'ektidagi ustunlardan foydalanamiz. DDL qo'llanilgandan keyin Drizzle schema egalari (P39 yoki schema paketi egasi) yangilashi kerak. P40 uchun `crm_activities` schema ob'ektini `createActivitiWithVisit` helper orqali ko'paytirishimiz mumkin — **Drizzle `crm_activities` ob'ektida yangi ustunlar yo'q bo'lganda fallback bilan**.

**3b. crm-activities.repository.ts — VISIT maydonlari qo'shish**

**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/crm-activities.repository.ts`

`create` metodini yangilash (qator 109-123). VISIT uchun qo'shimcha maydonlar:

```typescript
// BEFORE (qator 109-122):
async create(
  type: unknown, subject: unknown, lead_id: unknown, deal_id: unknown,
  assigned_to: unknown, due_date: unknown, notes: unknown, status: unknown
): Promise<Result<Row>> {
  return safeCall(async () => {
    const rows = await db.insert(crm_activities).values({
      type:        type as string,
      subject:     subject as string,
      lead_id:     lead_id as number ?? undefined,
      deal_id:     deal_id as number ?? undefined,
      assigned_to: assigned_to as number ?? undefined,
      due_date:    due_date ? new Date(due_date as string) : undefined,
      notes:       notes as string ?? undefined,
      status:      (status as string) ?? 'pending',
    }).returning();
    return (rows[0] ?? {}) as Row;
  }, 'DB_ERROR');
}
```

```typescript
// AFTER — VISIT maydonlari qo'shildi, teskari mos (backward-compatible):
async create(
  type: unknown, subject: unknown, lead_id: unknown, deal_id: unknown,
  assigned_to: unknown, due_date: unknown, notes: unknown, status: unknown,
  // VISIT kengaytmasi (EP-CRM-007) — opsional
  visitFields?: {
    channel?: string;
    direction?: 'in' | 'out';
    geo_lat?: number;
    geo_lon?: number;
    visit_purpose?: string;
    outcome_note?: string;
    duration_sec?: number;
  }
): Promise<Result<Row>> {
  return safeCall(async () => {
    // Drizzle schema da yangi ustunlar bo'lmasa xato bo'lmasligi uchun
    // visitFields ni alohida raw SQL bilan qo'shamiz (DDL qo'llanilgandan keyin)
    const baseValues = {
      type:        type as string,
      subject:     subject as string,
      lead_id:     (lead_id as number) ?? undefined,
      deal_id:     (deal_id as number) ?? undefined,
      assigned_to: (assigned_to as number) ?? undefined,
      due_date:    due_date ? new Date(due_date as string) : undefined,
      notes:       (notes as string) ?? undefined,
      status:      (status as string) ?? 'pending',
    };

    const rows = await db.insert(crm_activities).values(baseValues).returning();
    const inserted = rows[0];
    if (!inserted) return {} as Row;

    // VISIT kengaytmasi — DDL qo'llanilgan bo'lsa yangilash
    if (visitFields && type === 'visit' && inserted.id) {
      try {
        await db.execute(sql`
          UPDATE crm_activities SET
            channel       = ${visitFields.channel ?? null},
            direction     = ${visitFields.direction ?? 'out'},
            geo_lat       = ${visitFields.geo_lat ?? null},
            geo_lon       = ${visitFields.geo_lon ?? null},
            visit_purpose = ${visitFields.visit_purpose ?? null},
            outcome_note  = ${visitFields.outcome_note ?? null},
            duration_sec  = ${visitFields.duration_sec ?? null}
          WHERE id = ${inserted.id as number}
        `);
        // Yangilangan qatorni qaytarish
        const updated = await db.execute(sql`
          SELECT * FROM crm_activities WHERE id = ${inserted.id as number} LIMIT 1
        `);
        const updArr = Array.isArray((updated as unknown as { rows?: unknown[] }).rows)
          ? (updated as unknown as { rows: Row[] }).rows
          : (Array.isArray(updated) ? (updated as Row[]) : []);
        return (updArr[0] ?? inserted) as Row;
      } catch {
        // DDL hali qo'llanilmagan — base insert qaytaramiz
        this.logger.warn('VISIT ustunlari hali DDL da yo\'q — base insert qaytarilmoqda');
      }
    }
    return inserted as Row;
  }, 'DB_ERROR');
}
```

**3c. crm-activities.controller.ts — DELETE return {} tuzatish (qator 131)**

```typescript
// BEFORE (qator 129-132):
async delete(@Param('id') id: string) {
  await this.svc.delete(safeInt(id, 0));
  return {};
}

// AFTER:
async delete(@Param('id') id: string) {
  await this.svc.delete(safeInt(id, 0));
  return { id: safeInt(id, 0), deleted: true };
}
```

**3d. CreateActivityDto schema yangilash**

`apps/api/src/modules/crm/presentation/dto/crm-activities.dto.ts` — bu fayl OWNED emas (dto papkasi). Lekin `CreateActivityDtoSchema` dagi Zod schema `type` validatsiyasini ham o'z ichiga olishi kerak. Agar bu fayl boshqa paketga tegishli bo'lsa — egasiga flag qil. Agar shu modulda bo'lsa va VISIT uchun yangi maydonlar kerak bo'lsa `CreateActivityDtoSchema` ga qo'shish mumkin — lekin faqat fayl owned bo'lsa.

**Tekshiruv:** `ls apps/api/src/modules/crm/presentation/dto/` — agar `crm-activities.dto.ts` mavjud bo'lsa, uni o'qib `CreateActivityDtoSchema` ni topib, VISIT maydonlari uchun kengaytma qo'sh.

---

### QADAM 4: crm-activities.service.ts — Cronlar qo'shish

**Fayl:** `apps/api/src/modules/crm/application/crm-activities.service.ts`

Mavjud servis 62 qator — `@Injectable()` sinfiga `@Cron` metodlari qo'shamiz. `ScheduleModule` CRM modulida import qilinganligini `crm.module.ts` da tekshir. Agar yo'q bo'lsa — `crm.module.ts` da `imports: [..., ScheduleModule.forRoot()]` qo'shish kerak.

```typescript
// BEFORE (fayl boshi):
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { safeCall, Result, AppError, Err } from '@common/result';
import { CRM_ACTIVITIES_REPO, type ICrmActivitiesRepo } from '../domain/repositories/i-crm-activities.repo';

// AFTER (yangi importlar qo'shiladi):
import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { safeCall, Result, AppError, Err } from '@common/result';
import { CRM_ACTIVITIES_REPO, type ICrmActivitiesRepo } from '../domain/repositories/i-crm-activities.repo';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { crm_tasks } from '@shared/db';
// FIX-2: NTF eskalatsiyasi uchun EventEmitter2 (modul-chegarasi: event orqali, import TAQIQ)
import { EventEmitter2 } from '@nestjs/event-emitter';
```

Servis klassiga yangi metodlar qo'shiladi (mavjud metodlar O'CHIRILMAYDI):

```typescript
@Injectable()
export class CrmActivitiesService {
  private readonly logger = new Logger(CrmActivitiesService.name);
  constructor(
    @Inject(CRM_ACTIVITIES_REPO) private readonly repo: ICrmActivitiesRepo,
    // FIX-2: NTF eskalatsiyasi uchun EventEmitter2
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ... (mavjud metodlar o'zgarishsiz qoladi) ...

  /**
   * EP-CRM-010: Muddati o'tgan CRM vazifalarni 'overdue' ga o'tkazish
   * VA menejerga NTF eskalatsiyasi yuborish.
   * Har soatda ishlaydi.
   *
   * FIX-2 (00-INTERVYU-MOSLIK §CRM): overdue-task NTF-eskalatsiyasi qo'shildi.
   * Owner spec (MUSLIMBEK-PROMT-17 Phase 3, EP-CRM-010):
   *   "tasks past due → status=overdue → escalate to manager (send notification via NTF module event)"
   * NTF event = EventEmitter2 orqali (NTF moduli tinglanadi, modul-chegarasi buzilmaydi).
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'crm_overdue_tasks' })
  async markOverdueTasks(): Promise<void> {
    try {
      // Yangilanayotgan vazifalarni oldin ID bilan olamiz (eskalatsiya uchun)
      const overdueRows = await db.execute(sql`
        SELECT t.id, t.title, t.lead_id, t.deal_id, t.assigned_to,
               l.assigned_by_id AS manager_id
        FROM crm_tasks t
        LEFT JOIN crm_leads l ON l.id = t.lead_id
        WHERE t.due_date < NOW()
          AND t.status = 'pending'
        LIMIT 100
      `);
      const tasks = Array.isArray((overdueRows as unknown as { rows?: unknown[] }).rows)
        ? (overdueRows as unknown as { rows: Record<string, unknown>[] }).rows
        : (Array.isArray(overdueRows) ? (overdueRows as Record<string, unknown>[]) : []);

      if (tasks.length === 0) return;

      // status = 'overdue' yangilash
      const result = await db.execute(sql`
        UPDATE crm_tasks
        SET status = 'overdue', updated_at = NOW()
        WHERE due_date < NOW()
          AND status = 'pending'
      `);
      const count = (result as unknown as { rowCount?: number }).rowCount ?? 0;
      this.logger.log({ msg: 'EP-CRM-010: overdue tasks yangilandi', count });

      // FIX-2: NTF eskalatsiyasi — har overdue task uchun menejerga event yuborish
      // EventEmitter2 orqali (NTF moduli 'ntf.send' eventini tinglab SMS/Telegram/ERP yuboradi)
      // Modul-chegarasi: CRM → NTF faqat event orqali (servis importi TAQIQ — MODUL_SHARTNOMASI.md)
      for (const task of tasks) {
        const managerId = (task['manager_id'] as number | null)
          ?? (task['assigned_to'] as number | null);
        if (!managerId) continue;

        this.eventEmitter.emit('ntf.send', {
          // EP-CRM-010 op-code
          code:       'EP-CRM-010',
          channel:    'crm',
          recipient_user_id: managerId,
          title:      'Muddati o\'tgan CRM vazifa',
          body:       `Vazifa "${String(task['title'] ?? '')}" muddati o'tdi`,
          metadata:   {
            task_id:  task['id'],
            lead_id:  task['lead_id'] ?? null,
            deal_id:  task['deal_id'] ?? null,
          },
          // priority = high (eskalatsiya)
          priority:   'high',
        });
      }
      if (tasks.length > 0) {
        this.logger.log({ msg: 'EP-CRM-010: NTF eskalatsiyasi yuborildi', count: tasks.length });
      }
    } catch (error: unknown) {
      this.logger.error({ msg: 'EP-CRM-010: cron xato', error: (error as Error).message });
    }
  }

  /**
   * EP-CRM-026: 30/60/90-kun aloqasiz leads/deals uchun followup task yaratish.
   * Har kuni tunda 02:00 da ishlaydi.
   * Idempotent: oxirgi 24 soatda allaqachon shu oraliq uchun 'followup_auto' task yaratilgan → qayta yaratmaydi.
   *
   * FIX-3 (00-INTERVYU-MOSLIK §CRM): 30 kundan tashqari 60/90-kun ham qo'shildi.
   * Owner spec (MUSLIMBEK-PROMT-17 Phase 4, EP-CRM-026):
   *   "30/60/90-day silence cron" — barcha uch chegara constants.ts da mavjud.
   * 3 tur task:
   *   30 kun → yumshoq eslatma (priority: followup_soft)
   *   60 kun → issiq kuzatuv (priority: followup_warm)
   *   90 kun → menejerga eskalatsiya (priority: followup_escalate)
   */
  @Cron('0 2 * * *', { name: 'crm_followup_reminder' })
  async createFollowupTasks(): Promise<void> {
    // FIX-3: 3 ta chegara — business.constants.ts dagi konstantalar bilan mos (P39 qo'shgan)
    const thresholds: { days: number; priority: string; label: string }[] = [
      { days: 30, priority: 'followup_soft',     label: "30 kun aloqa yo'q (yumshoq eslatma)" },
      { days: 60, priority: 'followup_warm',     label: "60 kun aloqa yo'q (issiq kuzatuv)" },
      { days: 90, priority: 'followup_escalate', label: "90 kun aloqa yo'q (menejerga eskalatsiya)" },
    ];

    let totalCreated = 0;

    for (const { days, priority, label } of thresholds) {
      try {
        // So'nggi N kunda hech qanday activity bo'lmagan faol leadlar
        // Shu oraliq uchun oxirgi 24 soatda task yaratilmagan bo'lsin (idempotent)
        const staleRows = await db.execute(sql`
          SELECT DISTINCT l.id AS lead_id, NULL::integer AS deal_id, l.assigned_by_id AS manager_id
          FROM crm_leads l
          WHERE l.status NOT IN ('won','lost','converted','abandoned')
            AND l.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM crm_activities a
              WHERE a.lead_id = l.id
                AND a.created_at > NOW() - INTERVAL '${sql.raw(String(days))} days'
            )
            AND NOT EXISTS (
              SELECT 1 FROM crm_tasks t
              WHERE t.lead_id = l.id
                AND t.priority = ${priority}
                AND t.created_at > NOW() - INTERVAL '24 hours'
            )
          LIMIT 50
        `);
        const rows = Array.isArray((staleRows as unknown as { rows?: unknown[] }).rows)
          ? (staleRows as unknown as { rows: { lead_id: number; deal_id: number | null; manager_id: number | null }[] }).rows
          : (Array.isArray(staleRows) ? (staleRows as { lead_id: number; deal_id: number | null; manager_id: number | null }[]) : []);

        for (const row of rows) {
          await db.insert(crm_tasks).values({
            title:     label,
            lead_id:   row.lead_id ?? undefined,
            deal_id:   row.deal_id ?? undefined,
            due_date:  new Date(Date.now() + 24 * 60 * 60 * 1000), // ertaga
            status:    'pending',
            priority,
          });
          totalCreated++;

          // 90 kun eskalatsiyasi uchun menejerga NTF ham yubor (FIX-2 bilan bir xil pattern)
          if (days >= 90 && row.manager_id) {
            this.eventEmitter.emit('ntf.send', {
              code:             'EP-CRM-026',
              channel:          'crm',
              recipient_user_id: row.manager_id,
              title:            '90 kun aloqasiz lead',
              body:             `Lead #${row.lead_id} 90 kun davomida aloqa yo'q — qayta tayinlash kerakmi?`,
              metadata:         { lead_id: row.lead_id, threshold_days: 90 },
              priority:         'high',
            });
          }
        }

        if (rows.length > 0) {
          this.logger.log({ msg: `EP-CRM-026: followup tasks yaratildi (${days} kun)`, count: rows.length, priority });
        }
      } catch (error: unknown) {
        this.logger.error({ msg: `EP-CRM-026: cron xato (${days} kun)`, error: (error as Error).message });
      }
    }

    if (totalCreated > 0) {
      this.logger.log({ msg: 'EP-CRM-026: jami followup tasks', total: totalCreated });
    }
  }

  /**
   * EP-CRM-063: 60 kundan ko'p yangilanmagan leads → 'abandoned' holat.
   * Har kuni tunda 03:00 da ishlaydi. Egasi override: ~60 kun (30 emas).
   */
  @Cron('0 3 * * *', { name: 'crm_abandonment_check' })
  async markAbandonedLeads(): Promise<void> {
    const CRM_ABANDONMENT_DAYS = 60; // EP-CRM-063 egasi override
    try {
      const result = await db.execute(sql`
        UPDATE crm_leads
        SET status = 'abandoned', updated_at = NOW()
        WHERE status NOT IN ('won','lost','converted','abandoned')
          AND deleted_at IS NULL
          AND updated_at < NOW() - INTERVAL '${sql.raw(String(CRM_ABANDONMENT_DAYS))} days'
      `);
      const count = (result as unknown as { rowCount?: number }).rowCount ?? 0;
      if (count > 0) {
        this.logger.log({ msg: 'EP-CRM-063: abandoned leads yangilandi', count });
      }
    } catch (error: unknown) {
      this.logger.error({ msg: 'EP-CRM-063: cron xato', error: (error as Error).message });
    }
  }
}
```

**crm.module.ts yangilash — ScheduleModule import:**

Mavjud `crm.module.ts` (qator 137):
```typescript
// BEFORE:
imports: [CqrsModule, EventEmitterModule.forRoot(), ConfigModule, TelegramModule],

// AFTER:
imports: [CqrsModule, EventEmitterModule.forRoot(), ConfigModule, TelegramModule, ScheduleModule.forRoot()],
```

Va import qo'shish:
```typescript
import { ScheduleModule } from '@nestjs/schedule';
```

**Eslatma:** Agar `ScheduleModule` allaqachon `AppModule` da import qilingan bo'lsa — `crm.module.ts` da qayta qo'shish shart emas (NestJS global ScheduleModule). Tekshir: `grep -r "ScheduleModule" apps/api/src/app.module.ts` — topilsa, `crm.module.ts` da qo'shmaslik.

---

### QADAM 5: crm-ai-extended.service.ts — 3 ta stub real DB ga o'tkazish

**Fayl:** `apps/api/src/modules/crm/application/crm-ai-extended.service.ts`

Qoidalar:
- Q-46: Ishlab turgan metodlar (`autofill`, `suggestAutoTasks`, `createAutoTask`, `chatRespond`, `analyzeVoiceCall`, `getAiQuickScore`) O'CHIRILMAYDI — ular vizyon uchun hali tayyor emas, lekin 200 qaytarayapti. Ular `501` ga o'tkazilmaydi chunki FE ularni ishlatiши mumkin.
- Faqat 3 ta metodning **ichki mantiq**ini real DB ga o'tkazamiz: `getAiLeads`, `getAiNba`, `analyzeChurn`.

**5a. `getAiLeads` — real crmLeads so'rovi:**

```typescript
// BEFORE (qator 93-103):
async getAiLeads(limit: number, offset: number){
  return safeCall(async () => {
  return {
    leads: [],
    total: 0,
    ai_scored: 0,
    limit,
    offset,
  };
  });}

// AFTER — real DB so'rov (top scored leads):
async getAiLeads(limit: number, offset: number): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    // crmLeads jadvalidan sourceScore bo'yicha sort qilingan top leadlar
    const rows = await db.execute(sql`
      SELECT
        l.id,
        l.title,
        l.status,
        l.source_score AS source_score,
        l.assigned_by_id,
        l.created_at,
        COALESCE(e.first_name || ' ' || e.last_name, '') AS assigned_name
      FROM crm_leads l
      LEFT JOIN hr_employees e ON e.id = l.assigned_by_id
      WHERE l.deleted_at IS NULL
        AND l.status NOT IN ('lost', 'converted')
      ORDER BY l.source_score DESC NULLS LAST, l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    const leadsArr = Array.isArray((rows as unknown as { rows?: unknown[] }).rows)
      ? (rows as unknown as { rows: Record<string, unknown>[] }).rows
      : (Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []);

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM crm_leads
      WHERE deleted_at IS NULL AND status NOT IN ('lost','converted')
    `);
    const countArr = Array.isArray((countResult as unknown as { rows?: unknown[] }).rows)
      ? (countResult as unknown as { rows: { total: number }[] }).rows
      : (Array.isArray(countResult) ? (countResult as { total: number }[]) : []);
    const total = countArr[0]?.total ?? 0;

    return {
      leads: leadsArr,
      total,
      ai_scored: leadsArr.filter(l => (l.source_score as number) > 0).length,
      limit,
      offset,
    };
  }, 'DB_ERROR');
}
```

**5b. `getAiNba` — real crm_tasks + stale deals asosida:**

```typescript
// BEFORE (qator 105-114):
async getAiNba(entityType: string | null, limit: number){
  return safeCall(async () => {
  return {
    recommendations: [],
    entity_type: entityType,
    generated_count: 0,
    limit,
  };
  });}

// AFTER — real pending tasks + stale deals:
async getAiNba(entityType: string | null, limit: number): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    // Pending muddati o'tgan vazifalar (overdue yoki bugun)
    const taskRows = await db.execute(sql`
      SELECT
        t.id,
        t.title,
        t.lead_id,
        t.deal_id,
        t.due_date,
        t.priority,
        CASE
          WHEN t.due_date < NOW() THEN 'overdue'
          WHEN t.due_date::date = CURRENT_DATE THEN 'due_today'
          ELSE 'upcoming'
        END AS urgency
      FROM crm_tasks t
      WHERE t.status IN ('pending','overdue')
        AND (
          ${entityType ?? null}::text IS NULL
          OR (${entityType} = 'lead' AND t.lead_id IS NOT NULL)
          OR (${entityType} = 'deal' AND t.deal_id IS NOT NULL)
        )
      ORDER BY
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC NULLS LAST
      LIMIT ${limit}
    `);
    const tasks = Array.isArray((taskRows as unknown as { rows?: unknown[] }).rows)
      ? (taskRows as unknown as { rows: Record<string, unknown>[] }).rows
      : (Array.isArray(taskRows) ? (taskRows as Record<string, unknown>[]) : []);

    const recommendations = tasks.map(t => ({
      entity_type: t.deal_id ? 'deal' : 'lead',
      entity_id:   t.deal_id ?? t.lead_id,
      action:      (t.urgency === 'overdue') ? 'make_call' : 'follow_up',
      task_id:     t.id,
      title:       t.title,
      urgency:     t.urgency,
      due_date:    t.due_date,
    }));

    return {
      recommendations,
      entity_type: entityType,
      generated_count: recommendations.length,
      limit,
    };
  }, 'DB_ERROR');
}
```

**5c. `analyzeChurn` — real so'nggi faollik sanasi asosida:**

```typescript
// BEFORE (qator 30-42):
async analyzeChurn(entityType: string, entityId: number){
  return safeCall(async () => {
  return {
    entity_type: entityType,
    entity_id: entityId,
    churn_risk: 'medium',
    risk_score: 0.42,
    factors: ['no_recent_activity', 'late_payment_history'],
    recommended_actions: ['personal_call', 'loyalty_discount'],
    generated_at: _time.now(),
  };
  });}

// AFTER — real so'nggi faollik sanasi asosida risk hisoblash:
async analyzeChurn(entityType: string, entityId: number): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    // So'nggi faoliyat sanasini olish
    const activityRows = await db.execute(sql`
      SELECT MAX(created_at) AS last_activity
      FROM crm_activities
      WHERE (
        (${entityType} = 'lead' AND lead_id = ${entityId})
        OR (${entityType} = 'deal' AND deal_id = ${entityId})
      )
    `);
    const actArr = Array.isArray((activityRows as unknown as { rows?: unknown[] }).rows)
      ? (activityRows as unknown as { rows: { last_activity: string | null }[] }).rows
      : (Array.isArray(activityRows) ? (activityRows as { last_activity: string | null }[]) : []);
    const lastActivity = actArr[0]?.last_activity ?? null;

    // Kunlar soni hisoblash
    const daysSince = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Risk hisoblash: EP-CRM-063 ga mos (60 kun = yuqori xavf)
    let riskScore: number;
    let churnRisk: string;
    const factors: string[] = [];
    const recommendedActions: string[] = [];

    if (daysSince > 60) {
      riskScore = 0.85;
      churnRisk = 'high';
      factors.push('no_recent_activity_60d');
      recommendedActions.push('personal_call', 'loyalty_discount');
    } else if (daysSince > 30) {
      riskScore = 0.55;
      churnRisk = 'medium';
      factors.push('no_recent_activity_30d');
      recommendedActions.push('send_email', 'schedule_meeting');
    } else if (daysSince > 14) {
      riskScore = 0.25;
      churnRisk = 'low';
      factors.push('mild_inactivity');
      recommendedActions.push('follow_up_call');
    } else {
      riskScore = 0.05;
      churnRisk = 'minimal';
      recommendedActions.push('maintain_contact');
    }

    return {
      entity_type: entityType,
      entity_id: entityId,
      churn_risk: churnRisk,
      risk_score: riskScore,
      days_since_last_activity: daysSince,
      last_activity_at: lastActivity,
      factors,
      recommended_actions: recommendedActions,
      generated_at: _time.now(),
    };
  }, 'DB_ERROR');
}
```

**Import qo'shish (fayl boshiga):**
```typescript
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
```

**5d. NBA confirm-write — yangi `confirmNbaAction` metodi (FIX-4)**

FIX-4 (00-INTERVYU-MOSLIK §CRM): NBA confirm-write qo'shildi.
Owner spec (MUSLIMBEK-PROMT-17 Phase 4, EP-CRM-013):
  "Salesperson picks one and confirms → creates activity/task"
  "AI taklif beradi, sotuvchi tasdiqlab bajaradi" (MASTER-SAVOL-JAVOB EP-CRM-013)
Hozir: `getAiNba` recommendations qaytaradi, lekin confirm → activity/task yaratish endpointi YO'Q.
Yechim: `confirmNbaAction` metodi — sotuvchi tanlab, server activity yoki task yaratadi.

```typescript
/**
 * FIX-4 (EP-CRM-013): NBA confirm-write.
 * Sotuvchi NBA tavsiyasidan birini tanlaydi va tasdiqlaydi →
 * CRM activity YOKI crm_tasks jadvaliga real INSERT.
 * "AI taklif, inson tasdiq" (E1 global printsip).
 */
async confirmNbaAction(params: {
  entity_type:   string;         // 'lead' | 'deal'
  entity_id:     number;
  action:        string;         // 'make_call' | 'follow_up' | 'send_email' | ...
  confirmed_by:  number;         // sotuvchi user_id
  note?:         string;         // ixtiyoriy izoh
}): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    const { entity_type, entity_id, action, confirmed_by, note } = params;

    // Action turiga qarab activity yoki task yaratish
    const isActivity = ['make_call', 'send_email', 'visit', 'send_whatsapp'].includes(action);
    const activityType = action === 'make_call'      ? 'call'
                       : action === 'send_email'     ? 'email'
                       : action === 'send_whatsapp'  ? 'whatsapp'
                       : action === 'visit'          ? 'visit'
                       : 'note';

    if (isActivity) {
      // crm_activities ga INSERT (Qoida 4: real INSERT, echo emas)
      const idCol = entity_type === 'deal' ? 'deal_id' : 'lead_id';
      const rows = await db.execute(sql`
        INSERT INTO crm_activities (
          type, subject, ${sql.raw(idCol)}, assigned_to,
          status, notes, created_at, updated_at
        ) VALUES (
          ${activityType},
          ${'NBA tasdiqlangan: ' + action},
          ${entity_id},
          ${confirmed_by},
          'pending',
          ${note ?? 'NBA AI tavsiyasi asosida yaratildi'},
          NOW(), NOW()
        )
        RETURNING id, type, subject, status, created_at
      `);
      const created = Array.isArray((rows as unknown as { rows?: unknown[] }).rows)
        ? (rows as unknown as { rows: Record<string, unknown>[] }).rows[0]
        : (Array.isArray(rows) ? (rows as Record<string, unknown>[])[0] : null);
      return { type: 'activity', created, action, entity_type, entity_id, confirmed_by };
    } else {
      // crm_tasks ga INSERT (follow_up, schedule_meeting va h.k.)
      const idCol = entity_type === 'deal' ? 'deal_id' : 'lead_id';
      const rows = await db.execute(sql`
        INSERT INTO crm_tasks (
          title, ${sql.raw(idCol)}, assigned_to,
          due_date, status, priority, created_at, updated_at
        ) VALUES (
          ${'NBA: ' + action + (note ? ' — ' + note : '')},
          ${entity_id},
          ${confirmed_by},
          ${new Date(Date.now() + 24 * 60 * 60 * 1000)},
          'pending',
          'nba_confirmed',
          NOW(), NOW()
        )
        RETURNING id, title, status, due_date, created_at
      `);
      const created = Array.isArray((rows as unknown as { rows?: unknown[] }).rows)
        ? (rows as unknown as { rows: Record<string, unknown>[] }).rows[0]
        : (Array.isArray(rows) ? (rows as Record<string, unknown>[])[0] : null);
      return { type: 'task', created, action, entity_type, entity_id, confirmed_by };
    }
  }, 'DB_ERROR');
}
```

**QADAM 5e: crm-ai-extended.controller.ts — confirm endpoint qo'shish**

**Fayl:** `apps/api/src/modules/crm/presentation/crm-ai-extended.controller.ts`
(Owned fayl ro'yxatida mavjud — IZOLYATSIYA MANIFESTI §1 qat. 56)

Fayl boshiga Zod schema qo'shish:
```typescript
const ConfirmNbaActionDtoSchema = z.object({
  entity_type: z.enum(['lead', 'deal']),
  entity_id:   z.number().int().positive(),
  action:      z.string().min(1),
  note:        z.string().optional(),
});
```

Controller oxiriga yangi endpoint qo'shiladi (mavjud metodlar O'CHIRILMAYDI):
```typescript
// FIX-4 (EP-CRM-013): NBA confirm-write endpoint
@Post('ai/nba/confirm')
@UseGuards(RolesGuard)
@Roles('salesperson', 'sales_manager', 'crm_manager', 'director', 'super_admin')
@ApiOperation({ summary: 'FIX-4 EP-CRM-013: NBA tavsiyasini tasdiqlab activity/task yaratish (AI taklif, inson tasdiq)' })
async confirmNbaAction(
  @Body() body: unknown,
  @CurrentUser() user: { id: number },
) {
  const dto = ConfirmNbaActionDtoSchema.parse(body);
  const result = await this.aiSvc.confirmNbaAction({
    ...dto,
    confirmed_by: user.id,
  });
  return unwrapOrThrow(result);
}
```

**`crm-ai-extended.service.ts` ga `confirmNbaAction` metod qo'shish ko'rsatmasi:**
Service fayli OWNED (IZOLYATSIYA MANIFESTI §1). `confirmNbaAction` 5d da yozilgan kodni service ga qo'shing. Controller → service → DB (Qoida 6).

**Qabul mezoni (FIX-4):**
- `POST /api/crm/ai/nba/confirm` `{entity_type:"lead", entity_id:5, action:"make_call"}` → 201 → `crm_activities` da yangi qator → `GET /api/crm/activities?lead_id=5` da ko'rinadi.
- `POST /api/crm/ai/nba/confirm` `{entity_type:"deal", entity_id:3, action:"follow_up"}` → `crm_tasks` da yangi qator.
- Javob `{ type: "activity"|"task", created: {...}, confirmed_by: N }`.
- Auth/role tekshiruvi: `salesperson` roli → 201 (o'z leadiga); boshqa rol → 403.

---

### QADAM 6: drizzle-crm-analytics.repo.ts — Funnel JOIN tuzatish + Dashboard/Reports metodlari

**Fayl:** `apps/api/src/modules/crm/analytics/repositories/drizzle-crm-analytics.repo.ts`

**6a. Funnel JOIN tuzatish (qator 152)**

Avval DB da tekshirish:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'crm_stages' ORDER BY ordinal_position;

SELECT DISTINCT stage_id FROM crm_deals LIMIT 10;
SELECT id, name, semantics FROM crm_stages LIMIT 10;
```

Agar `crm_stages.id` = integer VA `crm_deals.stage_id` = varchar `'C0:NEW'` ko'rinishida bo'lsa — JOIN imkonsiz (`id::text != 'C0:NEW'`). To'g'ri JOIN usuli:

**Variant A** (agar `crm_stages` da `semantic_id` yoki `code` ustun bor bo'lsa):
```sql
JOIN crm_stages cs ON cs.semantic_id = d.stage_id
```

**Variant B** (agar `crm_stages` da faqat `id` va `name` bo'lsa):
```sql
-- crm_deals.stage_semantic_id ustuni orqali (getFunnelVelocityData da qoʻllanilgan)
JOIN crm_stages cs ON cs.name = d.stage_id
```

**Hozirgi kod (qator 147-166):**
```typescript
// Hozirgi JOIN — XATO:
JOIN crm_stages cs ON cs.id::text = d.stage_id
```

**Tuzatilgan versiya:**
```typescript
async getFunnelStageData(pipelineId?: string): Promise<FunnelStageRow[]> {
  try {
    // NOTE: crm_deals.stage_id = Bitrix varchar ('C0:NEW' ko'rinishi yoki semantic string)
    // crm_stages da moslik ustunini tekshirish zarur. Agar crm_stages.name = stage_id → name JOIN.
    // Agar crm_stages.semantic_id ustuni mavjud bo'lsa → semantic_id JOIN.
    // Fallback: stage_id ni to'g'ridan GROUP BY qilamiz va crm_stages JOIN o'tkazib yuboramiz.
    const rows = await runQuery<FunnelStageRow>(
      pipelineId
        ? sql`
          SELECT
            COALESCE(cs.name, d.stage_id) AS stage_name,
            COUNT(*)::int AS count,
            COALESCE((cs.semantics = 'success'), false) AS is_won,
            COALESCE((cs.semantics = 'fail'), false)    AS is_lost
          FROM crm_deals d
          LEFT JOIN crm_stages cs ON cs.name = d.stage_id
          WHERE d.category_id::text = ${pipelineId} AND d.deleted_at IS NULL
          GROUP BY d.stage_id, cs.name, cs.semantics, cs.sort
          ORDER BY COALESCE(cs.sort, 999) ASC
        `
        : sql`
          SELECT
            COALESCE(cs.name, d.stage_id) AS stage_name,
            COUNT(*)::int AS count,
            COALESCE((cs.semantics = 'success'), false) AS is_won,
            COALESCE((cs.semantics = 'fail'), false)    AS is_lost
          FROM crm_deals d
          LEFT JOIN crm_stages cs ON cs.name = d.stage_id
          WHERE d.deleted_at IS NULL
          GROUP BY d.stage_id, cs.name, cs.semantics, cs.sort
          ORDER BY COALESCE(cs.sort, 999) ASC
        `,
    );
    return Array.isArray(rows) ? rows : [];
  } catch (e: unknown) {
    this.logger.error(`getFunnelStageData xatosi: ${(e as Error).message}`);
    throw e;
  }
}
```

**6b. Dashboard 9 GSD metrikasi uchun yangi metod:**

```typescript
async getDashboardGsd(): Promise<Record<string, unknown>> {
  try {
    const rows = await runQuery<Record<string, unknown>>(sql`
      SELECT
        -- 1. Haftalik sotuv hajmi (UZS)
        COALESCE(SUM(CASE WHEN so.created_at > NOW() - INTERVAL '7 days'
          THEN so.total_amount END), 0)::float             AS weekly_sales_volume,
        -- 2. Yopilgan bitimlar (bu hafta)
        COUNT(CASE WHEN cd.closed_at > NOW() - INTERVAL '7 days'
          AND cs.semantics = 'success' THEN 1 END)::int    AS closed_deals,
        -- 3. O'rtacha bitim hajmi
        COALESCE(AVG(cd.opportunity::numeric), 0)::float   AS average_deal_size,
        -- 4. Konversiya foizi (won / jami)
        CASE WHEN COUNT(cd.id) > 0
          THEN ROUND(100.0 * COUNT(CASE WHEN cs.semantics = 'success' THEN 1 END)
               / COUNT(cd.id), 2)
          ELSE 0 END::float                                 AS conversion_rate,
        -- 5. O'rtacha sotuv davri (kun)
        COALESCE(AVG(
          EXTRACT(DAY FROM (cd.closed_at - cd.date_create))
        ) FILTER (WHERE cd.closed_at IS NOT NULL), 30)::float AS sales_cycle_length,
        -- 6. Mijoz saqlanishi — qayta buyurtma bergan mijozlar %
        COALESCE((
          SELECT ROUND(100.0 * COUNT(DISTINCT customer_id) FILTER (
            WHERE cnt > 1
          ) / NULLIF(COUNT(DISTINCT customer_id), 0), 2)
          FROM (
            SELECT customer_id, COUNT(*) AS cnt
            FROM sales_orders
            WHERE created_at > NOW() - INTERVAL '90 days'
            GROUP BY customer_id
          ) sub
        ), 0)::float                                        AS customer_retention,
        -- 7. Qarzdor nazorat (muddati o'tgan debitor)
        COALESCE((
          SELECT SUM(amount) FROM ar_invoices
          WHERE due_date < NOW() AND status != 'paid'
        ), 0)::float                                        AS debtor_control,
        -- FIX-5 (EP-SD-014 + 00-INTERVYU-MOSLIK §CRM): sales_target = konfiguratsiyalanadigan
        -- "har kartaga haftalik va oylik sotuv maqsadi" (MASTER-SAVOL-JAVOB EP-SD-014).
        -- Hardcode 0 TAQIQ — crm_sales_targets master-data jadvalidan olinadi.
        -- EGASI QIYMATI KERAK: crm_sales_targets jadvali mavjudmi?
        --   Yo'q bo'lsa → DDL kerak (GATED, egasi ruxsati bilan).
        --   Mavjud bo'lsa → quyidagi subquery ishlaydi.
        -- Fallback: crm_sales_targets yo'q bo'lsa 0 (graceful degrade, 503 emas).
        COALESCE((
          SELECT target_amount FROM crm_sales_targets
          WHERE period_type = 'weekly'
            AND period_start <= CURRENT_DATE
            AND period_end   >= CURRENT_DATE
            AND (card_id IS NULL OR card_id IN (
              SELECT id FROM org_functions WHERE department_id IN (
                SELECT department_id FROM org_functions LIMIT 1
              )
            ))
          ORDER BY card_id NULLS LAST
          LIMIT 1
        ), 0)::float                                        AS sales_target,
        -- sales_vs_target = fakt / maqsad * 100 (haftaning joriy sotuv hajmi / haftalik target)
        CASE
          WHEN COALESCE((
            SELECT target_amount FROM crm_sales_targets
            WHERE period_type = 'weekly'
              AND period_start <= CURRENT_DATE
              AND period_end   >= CURRENT_DATE
            LIMIT 1
          ), 0) > 0
          THEN ROUND(100.0 *
            COALESCE(SUM(CASE WHEN so.created_at > NOW() - INTERVAL '7 days'
              THEN so.total_amount END), 0) /
            (SELECT target_amount FROM crm_sales_targets
             WHERE period_type = 'weekly'
               AND period_start <= CURRENT_DATE
               AND period_end   >= CURRENT_DATE
             LIMIT 1)
          , 2)
          ELSE 0
        END::float                                          AS sales_vs_target
      FROM crm_deals cd
      LEFT JOIN crm_stages cs ON cs.name = cd.stage_id
      LEFT JOIN sales_orders so ON so.crm_deal_id = cd.id
      WHERE cd.deleted_at IS NULL
    `);
    const head = Array.isArray((rows as unknown as { rows?: unknown[] }).rows)
      ? (rows as unknown as { rows: Record<string, unknown>[] }).rows[0]
      : (Array.isArray(rows) ? (rows as Record<string, unknown>[])[0] : null);

    return head ?? {
      weekly_sales_volume: 0, closed_deals: 0, average_deal_size: 0,
      conversion_rate: 0, sales_cycle_length: 30, customer_retention: 0,
      debtor_control: 0,
      sales_target: 0,     // crm_sales_targets bo'sh bo'lsa 0 (egasi seed qilishi kerak)
      sales_vs_target: 0,
    };
  } catch (e: unknown) {
    this.logger.error(`getDashboardGsd xatosi: ${(e as Error).message}`);
    return {
      weekly_sales_volume: 0, closed_deals: 0, average_deal_size: 0,
      conversion_rate: 0, sales_cycle_length: 30, customer_retention: 0,
      debtor_control: 0,
      sales_target: 0,
      sales_vs_target: 0,
    };
  }
}
```

**6c. Hisobotlar uchun metodlar:**

```typescript
async getMonthlyKgReport(months: number): Promise<Record<string, unknown>[]> {
  try {
    // NOTE: sales_orders.total_quantity = kg (gofra uchun kg birlik)
    const rows = await runQuery<Record<string, unknown>>(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(total_quantity), 0)::float              AS total_kg,
        COUNT(*)::int                                        AS order_count
      FROM sales_orders
      WHERE created_at > NOW() - INTERVAL '${sql.raw(String(months))} months'
        AND status != 'cancelled'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `);
    return Array.isArray((rows as unknown as { rows?: unknown[] }).rows)
      ? (rows as unknown as { rows: Record<string, unknown>[] }).rows
      : (Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []);
  } catch (e: unknown) {
    this.logger.error(`getMonthlyKgReport xatosi: ${(e as Error).message}`);
    return [];
  }
}

async getYearlyVolumeReport(years: number): Promise<Record<string, unknown>[]> {
  try {
    const rows = await runQuery<Record<string, unknown>>(sql`
      SELECT
        EXTRACT(YEAR FROM created_at)::int         AS year,
        COALESCE(SUM(total_amount), 0)::float      AS total_uzs,
        COALESCE(SUM(total_quantity), 0)::float    AS total_kg,
        COUNT(*)::int                              AS order_count
      FROM sales_orders
      WHERE created_at > NOW() - INTERVAL '${sql.raw(String(years))} years'
        AND status != 'cancelled'
      GROUP BY EXTRACT(YEAR FROM created_at)
      ORDER BY year ASC
    `);
    return Array.isArray((rows as unknown as { rows?: unknown[] }).rows)
      ? (rows as unknown as { rows: Record<string, unknown>[] }).rows
      : (Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []);
  } catch (e: unknown) {
    this.logger.error(`getYearlyVolumeReport xatosi: ${(e as Error).message}`);
    return [];
  }
}

async getCustomerOrderChain(customerId: number, limit: number): Promise<Record<string, unknown>[]> {
  try {
    const rows = await runQuery<Record<string, unknown>>(sql`
      SELECT
        so.id,
        so.status,
        so.total_amount,
        so.total_quantity,
        so.created_at,
        so.notes,
        so.crm_deal_id
      FROM sales_orders so
      WHERE so.customer_id = ${customerId}
        AND so.status != 'cancelled'
      ORDER BY so.created_at DESC
      LIMIT ${limit}
    `);
    return Array.isArray((rows as unknown as { rows?: unknown[] }).rows)
      ? (rows as unknown as { rows: Record<string, unknown>[] }).rows
      : (Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []);
  } catch (e: unknown) {
    this.logger.error(`getCustomerOrderChain xatosi: ${(e as Error).message}`);
    return [];
  }
}

async getCustomer360(customerId: number): Promise<Record<string, unknown>> {
  try {
    // EP-CRM-015: 360° card = orders + activities + deals + Finance debt + QC complaints
    // Finance debt and QC complaints are READ-ONLY cross-module (no writes from CRM — E1 principle)
    const [orders, activities, deals, debtStatus, openComplaints] = await Promise.all([
      this.getCustomerOrderChain(customerId, 10),
      runQuery<Record<string, unknown>>(sql`
        SELECT id, type, subject, status, created_at, outcome
        FROM crm_activities
        WHERE lead_id IN (
          SELECT id FROM crm_leads WHERE company_id = (
            SELECT id FROM crm_companies WHERE id = (
              SELECT crm_company_id FROM sd_customers WHERE id = ${customerId} LIMIT 1
            ) LIMIT 1
          ) LIMIT 1
        )
        ORDER BY created_at DESC LIMIT 20
      `).then(r => Array.isArray((r as unknown as { rows?: unknown[] }).rows)
        ? (r as unknown as { rows: Record<string, unknown>[] }).rows
        : (Array.isArray(r) ? (r as Record<string, unknown>[]) : [])),
      runQuery<Record<string, unknown>>(sql`
        SELECT cd.id, cd.title, cd.opportunity, cd.stage_id, cd.closed_at
        FROM crm_deals cd
        JOIN crm_companies cc ON cc.id = cd.company_id
        JOIN sd_customers sc ON sc.crm_company_id = cc.id
        WHERE sc.id = ${customerId}
        ORDER BY cd.created_at DESC LIMIT 5
      `).then(r => Array.isArray((r as unknown as { rows?: unknown[] }).rows)
        ? (r as unknown as { rows: Record<string, unknown>[] }).rows
        : (Array.isArray(r) ? (r as Record<string, unknown>[]) : [])),
      // FIX-1a (EP-CRM-015 + 00-INTERVYU-MOSLIK §CRM): Finance debt status — read-only from `entries`.
      // Debit side = what customer owes us (debitor). Canon table = entries (NOT gl_journal_entries).
      // EGASI QIYMATI KERAK: ar_invoices jadvali mavjudmi? Yo'q bo'lsa entries orqali.
      runQuery<Record<string, unknown>>(sql`
        SELECT
          COALESCE(SUM(CASE WHEN e.debit_account_code LIKE '2%'
                            AND e.credit_account_code LIKE '9%'
                       THEN e.amount ELSE 0 END), 0)::float AS total_debt,
          COALESCE(SUM(CASE WHEN e.debit_account_code LIKE '2%'
                            AND e.credit_account_code LIKE '9%'
                            AND e.transaction_date < NOW() - INTERVAL '30 days'
                       THEN e.amount ELSE 0 END), 0)::float AS overdue_30d,
          COALESCE(SUM(CASE WHEN e.debit_account_code LIKE '2%'
                            AND e.credit_account_code LIKE '9%'
                            AND e.transaction_date < NOW() - INTERVAL '60 days'
                       THEN e.amount ELSE 0 END), 0)::float AS overdue_60d
        FROM entries e
        WHERE e.customer_id = ${customerId}
          AND e.deleted_at IS NULL
      `).then(r => {
        const rows = Array.isArray((r as unknown as { rows?: unknown[] }).rows)
          ? (r as unknown as { rows: Record<string, unknown>[] }).rows
          : (Array.isArray(r) ? (r as Record<string, unknown>[]) : []);
        return rows[0] ?? { total_debt: 0, overdue_30d: 0, overdue_60d: 0 };
      }),
      // FIX-1b (EP-CRM-015 + EP-CRM-025): QC open complaints — read-only from qc_reclamations.
      // "Shikoyatlar mijoz kartasida ko'rinadi va hal bo'lguncha qizil belgi" (EP-CRM-025).
      // EGASI QIYMATI KERAK: qc_reclamations.customer_id ustuni mavjudmi tekshirish kerak.
      runQuery<Record<string, unknown>>(sql`
        SELECT
          id,
          title,
          status,
          severity,
          created_at,
          resolved_at
        FROM qc_reclamations
        WHERE customer_id = ${customerId}
          AND status NOT IN ('closed', 'resolved')
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 10
      `).then(r => Array.isArray((r as unknown as { rows?: unknown[] }).rows)
        ? (r as unknown as { rows: Record<string, unknown>[] }).rows
        : (Array.isArray(r) ? (r as Record<string, unknown>[]) : [])).catch(() => []),
        // .catch(): qc_reclamations.customer_id yo'q bo'lsa — bo'sh qaytarish (graceful degrade)
    ]);

    const totalSpent = (orders as { total_amount?: number }[])
      .reduce((s, o) => s + (o.total_amount ?? 0), 0);

    const debtRec = debtStatus as { total_debt?: number; overdue_30d?: number; overdue_60d?: number };
    const hasOpenComplaints = (openComplaints as unknown[]).length > 0;

    return {
      customer_id:        customerId,
      orders:             { items: orders, total: orders.length, total_spent: totalSpent },
      activities:         { items: activities, total: activities.length },
      deals:              { items: deals, total: deals.length },
      // FIX-1a: Finance debt (read-only) — EP-CRM-015/024/036
      finance_debt:       {
        total_debt:        debtRec.total_debt   ?? 0,
        overdue_30d:       debtRec.overdue_30d  ?? 0,
        overdue_60d:       debtRec.overdue_60d  ?? 0,
        // qizil belgi (red flag): 60+ kunlik qarz bor
        has_overdue_flag:  (debtRec.overdue_60d ?? 0) > 0,
        source:            'entries',  // kanonik jadval (gl_journal_entries EMAS)
      },
      // FIX-1b: QC open complaints (read-only) — EP-CRM-015/025/073
      open_complaints:    {
        items:             openComplaints,
        total:             (openComplaints as unknown[]).length,
        // qizil belgi (red flag): hal bo'lmagan shikoyat bor
        has_open_flag:     hasOpenComplaints,
      },
    };
  } catch (e: unknown) {
    this.logger.error(`getCustomer360 xatosi: ${(e as Error).message}`);
    return {
      customer_id:    customerId,
      orders:         { items: [], total: 0, total_spent: 0 },
      activities:     { items: [], total: 0 },
      deals:          { items: [], total: 0 },
      finance_debt:   { total_debt: 0, overdue_30d: 0, overdue_60d: 0, has_overdue_flag: false, source: 'entries' },
      open_complaints: { items: [], total: 0, has_open_flag: false },
    };
  }
}
```

---

### QADAM 7: i-crm-analytics.repo.ts — yangi metodlar interfeysi

**Fayl:** `apps/api/src/modules/crm/analytics/repositories/i-crm-analytics.repo.ts`

Mavjud interfeys oxiriga qo'shiladi (avvalgi metodlar O'CHIRILMAYDI):

```typescript
// Mavjud ICrmAnalyticsRepo interfeysi oxiriga qo'shiladi:

export interface ICrmAnalyticsRepo {
  // ... (mavjud metodlar o'zgarishsiz) ...

  /** ShVB 9 GSD dashboard metrikalari — EP-CRM-Phase6 */
  getDashboardGsd(): Promise<Record<string, unknown>>;

  /** Oylik kg hisoboti — EP-CRM-075 */
  getMonthlyKgReport(months: number): Promise<Record<string, unknown>[]>;

  /** Yillik hajm hisoboti — EP-CRM-076 */
  getYearlyVolumeReport(years: number): Promise<Record<string, unknown>[]>;

  /** Mijoz buyurtma zanjiri — EP-CRM-077 */
  getCustomerOrderChain(customerId: number, limit: number): Promise<Record<string, unknown>[]>;

  /** 360° mijoz kartasi — EP-CRM-015 */
  getCustomer360(customerId: number): Promise<Record<string, unknown>>;
}
```

---

### QADAM 8: crm-analytics.controller.ts — yangi endpointlar

**Fayl:** `apps/api/src/modules/crm/presentation/crm-analytics.controller.ts`

Mavjud controller oxiriga qo'shiladi (mavjud metodlar O'CHIRILMAYDI):

```typescript
// Fayl boshiga Zod schema qo'shish:
const DashboardQueryDto = z.object({});

const MonthlyKgQueryDto = z.object({
  months: z.coerce.number().int().positive().max(60).default(12),
});

const YearlyVolumeQueryDto = z.object({
  years: z.coerce.number().int().positive().max(10).default(3),
});

const Customer360QueryDto = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
});
```

Constructor ga `private readonly repo: ICrmAnalyticsRepo` qo'shish va `CRM_ANALYTICS_REPO` inject qilish:

```typescript
// BEFORE:
constructor(
  private readonly funnelSvc:       FunnelService,
  // ...
) {}

// AFTER:
constructor(
  private readonly funnelSvc:       FunnelService,
  private readonly cohortSvc:       CohortService,
  private readonly kmeansSvc:       KMeansService,
  private readonly churnSvc:        ChurnService,
  private readonly churnRetrainSvc: ChurnRetrainService,
  @Inject(CRM_ANALYTICS_REPO) private readonly crmRepo: ICrmAnalyticsRepo,
) {}
```

Import qo'shish:
```typescript
import { Inject } from '@nestjs/common';
import { CRM_ANALYTICS_REPO, ICrmAnalyticsRepo } from '../analytics/repositories/i-crm-analytics.repo';
```

Yangi endpointlar (controller oxiriga):
```typescript
  @Get('dashboard')
  @RequirePermission('crm.analytics:READ')
  @ApiOperation({ summary: 'EP-CRM-Phase6: ShVB 9 GSD dashboard metrikalari' })
  async getDashboard(@Query() _q: unknown) {
    DashboardQueryDto.parse(_q);
    const data = await this.crmRepo.getDashboardGsd();
    return {
      weeklySalesVolume:  data['weekly_sales_volume']  ?? 0,
      closedDeals:        data['closed_deals']         ?? 0,
      averageDealSize:    data['average_deal_size']     ?? 0,
      conversionRate:     data['conversion_rate']       ?? 0,
      salesCycleLength:   data['sales_cycle_length']    ?? 30,
      customerRetention:  data['customer_retention']    ?? 0,
      debtorControl:      data['debtor_control']        ?? 0,
      salesTarget:        data['sales_target']          ?? 0,
      salesVsTarget:      data['sales_vs_target']       ?? 0,
    };
  }

  @Get('customers/:id/360')
  @RequirePermission('crm.analytics:READ')
  @ApiOperation({ summary: 'EP-CRM-015: 360° mijoz kartasi — buyurtmalar + faoliyatlar + bitimlar' })
  async getCustomer360(
    @Param('id') id: string,
    @Query() q: unknown,
  ) {
    const { limit } = Customer360QueryDto.parse(q);
    return this.crmRepo.getCustomer360(safeInt(id, 0));
  }

  @Get('reports/monthly-kg')
  @RequirePermission('crm.analytics:READ')
  @ApiOperation({ summary: 'EP-CRM-075: Oylik sotuv kg hisoboti' })
  async getMonthlyKg(@Query() q: unknown) {
    const { months } = MonthlyKgQueryDto.parse(q);
    const items = await this.crmRepo.getMonthlyKgReport(months);
    return { items, months };
  }

  @Get('reports/yearly-volume')
  @RequirePermission('crm.analytics:READ')
  @ApiOperation({ summary: 'EP-CRM-076: Yillik sotuv hajmi hisoboti' })
  async getYearlyVolume(@Query() q: unknown) {
    const { years } = YearlyVolumeQueryDto.parse(q);
    const items = await this.crmRepo.getYearlyVolumeReport(years);
    return { items, years };
  }

  @Get('customers/:id/order-status-chain')
  @RequirePermission('crm.analytics:READ')
  @ApiOperation({ summary: 'EP-CRM-077: Mijoz buyurtma zanjiri' })
  async getOrderChain(
    @Param('id') id: string,
    @Query() q: unknown,
  ) {
    const { limit } = Customer360QueryDto.parse(q);
    const items = await this.crmRepo.getCustomerOrderChain(safeInt(id, 0), limit);
    return { customer_id: safeInt(id, 0), items, total: items.length };
  }
```

Import `safeInt` qo'shish:
```typescript
import { safeInt } from '@common/db/db-rows';
import { Param } from '@nestjs/common';
```

---

### QADAM 9: FE — CreateActivityForm VISIT tab qo'shish

**Fayl:** `artifacts/erp-dashboard/src/components/crm/activity/CreateActivityForm.tsx`

Avval `VisitForm.tsx` komponenti shu papkada mavjudmi tekshirish: `ls artifacts/erp-dashboard/src/components/crm/activity/`.

Agar `VisitForm.tsx` yo'q bo'lsa — yaratish:

**Yangi fayl:** `artifacts/erp-dashboard/src/components/crm/activity/VisitForm.tsx`
```tsx
/**
 * @module VisitForm
 * @description CRM VISIT (dala tashrifi) forma komponenti. EP-CRM-007.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const VisitSchema = z.object({
  visit_purpose: z.string().min(1, "Maqsad kiritilishi shart"),
  outcome_note:  z.string().optional(),
  geo_lat:       z.number().optional(),
  geo_lon:       z.number().optional(),
  duration_sec:  z.number().int().positive().optional(),
});

interface VisitFormProps {
  entityType: string;
  entityId: number;
  onActivityCreated?: () => void;
}

export function VisitForm({ entityType, entityId, onActivityCreated }: VisitFormProps) {
  const [purpose, setPurpose]     = useState("");
  const [outcome, setOutcome]     = useState("");
  const [duration, setDuration]   = useState("");
  const [geoLat, setGeoLat]       = useState<number | null>(null);
  const [geoLon, setGeoLon]       = useState<number | null>(null);
  const [geoError, setGeoError]   = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest("POST", "/api/crm/activities", body),
    onSuccess: () => {
      toast({ title: "Tashrif qayd etildi" });
      qc.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      setPurpose(""); setOutcome(""); setDuration("");
      onActivityCreated?.();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const getGeo = () => {
    if (!navigator.geolocation) {
      setGeoError("Brauzer geolokatsiyani qo'llab-quvvatlamaydi");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLon(pos.coords.longitude);
        setGeoError(null);
      },
      () => setGeoError("Joylashuvni aniqlashda xatolik"),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = VisitSchema.safeParse({
      visit_purpose: purpose,
      outcome_note:  outcome || undefined,
      geo_lat:       geoLat ?? undefined,
      geo_lon:       geoLon ?? undefined,
      duration_sec:  duration ? parseInt(duration) * 60 : undefined,
    });
    if (!parsed.success) {
      toast({ title: parsed.error.errors[0]?.message ?? "Xato", variant: "destructive" });
      return;
    }
    mutation.mutate({
      type:          "visit",
      subject:       purpose,
      [entityType === "deal" ? "deal_id" : "lead_id"]: entityId,
      channel:       "visit",
      direction:     "out",
      visit_purpose: parsed.data.visit_purpose,
      outcome_note:  parsed.data.outcome_note,
      geo_lat:       parsed.data.geo_lat,
      geo_lon:       parsed.data.geo_lon,
      duration_sec:  parsed.data.duration_sec,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-medium">Tashrif maqsadi *</label>
        <Input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Narx kelishuvi, namuna ko'rsatish..."
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Natija / izoh</label>
        <Textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Tashrif natijasi..."
          rows={3}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Davomiylik (daqiqa)</label>
        <Input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="30"
          className="mt-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={getGeo}>
          GPS joylashuvni olish
        </Button>
        {geoLat && geoLon && (
          <span className="text-xs text-green-600">
            {geoLat.toFixed(4)}, {geoLon.toFixed(4)}
          </span>
        )}
        {geoError && <span className="text-xs text-red-500">{geoError}</span>}
      </div>
      <Button
        type="submit"
        disabled={mutation.isPending || !purpose}
        className="w-full"
      >
        {mutation.isPending ? "Saqlanmoqda..." : "Tashrif qayd etish"}
      </Button>
    </form>
  );
}
```

**CreateActivityForm.tsx yangilash** — `visit` case qo'shish:

```tsx
// BEFORE (qator 7 — importlar):
import { CallForm } from "./CallForm";
import { CommentForm } from "./CommentForm";
// ...

// AFTER — VisitForm import qo'shish:
import { VisitForm } from "./VisitForm";
```

```tsx
// BEFORE (qator 56-59):
  if (activeTab === "slots") {
    return <SlotsForm entityType={entityType} entityId={entityId} onActivityCreated={onActivityCreated} />;
  }
  return null;

// AFTER — visit case qo'shish:
  if (activeTab === "visit") {
    return <VisitForm entityType={entityType} entityId={entityId} onActivityCreated={onActivityCreated} />;
  }
  if (activeTab === "slots") {
    return <SlotsForm entityType={entityType} entityId={entityId} onActivityCreated={onActivityCreated} />;
  }
  return null;
```

---

### QADAM 10: FE CRMKpiCards.tsx — dashboardMode qo'shish

**Fayl:** `artifacts/erp-dashboard/src/components/crm/workspace/CRMKpiCards.tsx`

`CRMKpiCards` komponenti hozir `items`/`stages` props asosida 4 ta karta ko'rsatadi. Dashboard uchun 9 ShVB GSD metrikasini ko'rsatish uchun `dashboardMode` prop qo'shamiz. Mavjud kod O'CHIRILMAYDI.

```tsx
// BEFORE (qator 24-29):
interface CRMKpiCardsProps {
  items: KpiItem[];
  stages: Stage[];
  activeEntity: EntityType;
  stageValues: Record<string, number>;
}

// AFTER — dashboardMode props qo'shiladi:
interface GsdMetrics {
  weeklySalesVolume:  number;
  closedDeals:        number;
  averageDealSize:    number;
  conversionRate:     number;
  salesCycleLength:   number;
  customerRetention:  number;
  debtorControl:      number;
  salesTarget:        number;
  salesVsTarget:      number;
}

interface CRMKpiCardsProps {
  items: KpiItem[];
  stages: Stage[];
  activeEntity: EntityType;
  stageValues: Record<string, number>;
  // ShVB GSD dashboard mode (EP-CRM-Phase6)
  dashboardMode?: boolean;
  gsdMetrics?: GsdMetrics;
}
```

Komponent boshiga (`kpis` useMemo dan OLDIN) yangi blok:

```tsx
// BEFORE (qator 57):
export function CRMKpiCards({
  items,
  stages,
  activeEntity,
  stageValues,
}: CRMKpiCardsProps) {
  const kpis: KpiCardData[] = useMemo(() => {

// AFTER:
export function CRMKpiCards({
  items,
  stages,
  activeEntity,
  stageValues,
  dashboardMode = false,
  gsdMetrics,
}: CRMKpiCardsProps) {
  // ShVB GSD 9 ta karta — dashboard mode uchun
  const gsdKpis: KpiCardData[] = useMemo(() => {
    if (!dashboardMode || !gsdMetrics) return [];
    return [
      { label: "Haftalik sotuv",     value: formatCurrency(gsdMetrics.weeklySalesVolume, "UZS"),   rawPct: Math.min(100, gsdMetrics.weeklySalesVolume / 10_000_000 * 100), sub: "7 kunlik",             icon: TrendingUp,   accent: "#6DC5A0" },
      { label: "Yopilgan bitimlar",  value: String(gsdMetrics.closedDeals),                        rawPct: Math.min(100, gsdMetrics.closedDeals * 10),                      sub: "Bu hafta",             icon: CheckCircle2, accent: "#5B9BD5" },
      { label: "O'rt. bitim hajmi",  value: formatCurrency(gsdMetrics.averageDealSize, "UZS"),     rawPct: Math.min(100, gsdMetrics.averageDealSize / 5_000_000 * 100),    sub: "Barcha bitimlar",      icon: DollarSign,   accent: "#F5C96A" },
      { label: "Konversiya",         value: `${gsdMetrics.conversionRate.toFixed(1)}%`,            rawPct: Math.min(100, gsdMetrics.conversionRate),                        sub: "Won / jami bitim",     icon: Target,       accent: gsdMetrics.conversionRate >= 20 ? "#6DC5A0" : "#F08080" },
      { label: "Sotuv davri",        value: `${gsdMetrics.salesCycleLength.toFixed(0)} kun`,       rawPct: Math.min(100, Math.max(0, 100 - gsdMetrics.salesCycleLength)),   sub: "O'rtacha kun",         icon: Activity,     accent: "#9B8ED5" },
      { label: "Mijoz saqlanishi",   value: `${gsdMetrics.customerRetention.toFixed(1)}%`,         rawPct: Math.min(100, gsdMetrics.customerRetention),                     sub: "90 kunlik qayta xarid", icon: Users,        accent: "#6DC5A0" },
      { label: "Qarzdorlar",         value: formatCurrency(gsdMetrics.debtorControl, "UZS"),       rawPct: Math.min(100, gsdMetrics.debtorControl / 100_000_000 * 100),    sub: "Muddati o'tgan",       icon: Zap,          accent: gsdMetrics.debtorControl > 0 ? "#F08080" : "#6DC5A0" },
      { label: "Sotuv maqsadi",      value: formatCurrency(gsdMetrics.salesTarget, "UZS"),         rawPct: gsdMetrics.salesTarget > 0 ? Math.min(100, gsdMetrics.salesVsTarget / gsdMetrics.salesTarget * 100) : 0, sub: "Oylik maqsad", icon: Target, accent: "#5B9BD5" },
      { label: "Maqsadga nisbat",    value: `${gsdMetrics.salesTarget > 0 ? (gsdMetrics.salesVsTarget / gsdMetrics.salesTarget * 100).toFixed(1) : 0}%`, rawPct: gsdMetrics.salesTarget > 0 ? Math.min(100, gsdMetrics.salesVsTarget / gsdMetrics.salesTarget * 100) : 0, sub: "Fakt / maqsad", icon: TrendingUp, accent: "#F5C96A" },
    ];
  }, [dashboardMode, gsdMetrics]);

  const kpis: KpiCardData[] = useMemo(() => {
    // ... (mavjud kpis useMemo kodi o'zgarishsiz) ...
```

Return qismida:
```tsx
// BEFORE (qator 169-171):
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-5 pt-4 pb-2">
      {kpis.map((kpi, i) => (

// AFTER:
  const displayKpis = dashboardMode && gsdMetrics ? gsdKpis : kpis;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${dashboardMode ? 'md:grid-cols-3 lg:grid-cols-3' : 'md:grid-cols-4'} gap-4 px-5 pt-4 pb-2`}>
      {displayKpis.map((kpi, i) => (
```

---

### QADAM 11: crm.module.ts — yangi provayderlar DI

**Fayl:** `apps/api/src/modules/crm/crm.module.ts`

Qo'shiladigan importlar va provayderlar:
1. `ScheduleModule` import (agar `AppModule` da yo'q bo'lsa)
2. `CrmActivitiesService` ga cron uchun `ScheduleModule` mavjudligi

Mavjud `providers` massiviga qo'shimcha hech narsa kerak emas — `CrmActivitiesService` allaqachon provider sifatida ro'yxatda (qator 171). `db` ham `@shared/db` dan global import.

Faqat `ScheduleModule` ni tekshirish:
```bash
grep -r "ScheduleModule" apps/api/src/app.module.ts apps/api/src/modules/crm/crm.module.ts
```

Agar `AppModule` da topilmasa:
```typescript
// crm.module.ts imports massiviga:
import { ScheduleModule } from '@nestjs/schedule';
// ...
imports: [CqrsModule, EventEmitterModule.forRoot(), ConfigModule, TelegramModule, ScheduleModule.forRoot()],
```

---

## 5. DDL (GATED — egasi ruxsati bilan)

**Fayl:** `apps/api/src/shared/db/migrations/p40-crm-visit-ddl.sql`

Yuqorida QADAM 1 da to'liq SQL ko'rsatilgan. Bu faylni YARATING, lekin quyidagi shart bajarilguncha DB da ISHGA TUSHIRMANG:

```
☐ Egasi: "P40 DDL APPROVED: <sana>" deb tasdiqlaguncha — KUTISH
☐ Tasdiqdan keyin: psql -d europrint -f apps/api/src/shared/db/migrations/p40-crm-visit-ddl.sql
☐ Drizzle schema yangilash — bu OWNED emas fayl, schema paketi egasiga topshiring
```

**Kritik tekshiruvlar DDL DAN OLDIN:**
```sql
-- 1. crm_activities joriy ustunlari:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'crm_activities' ORDER BY ordinal_position;

-- 2. crm_deals PK turi:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'crm_deals' AND column_name = 'id';

-- 3. sales_orders ustunlari (crm_deal_id bor yoki yo'q):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sales_orders' ORDER BY ordinal_position;

-- 4. sd_customers.crm_company_id bor yoki yo'q:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sd_customers' AND column_name LIKE 'crm%';
```

Agar `sales_orders` da `crm_deal_id` va `sd_customers` da `crm_company_id` yo'q bo'lsa — DealWonListener fallback versiyasidan foydalaning (QADAM 2 da ko'rsatilgan).

---

## 6. QABUL MEZONI

### 6.1 BE tsc 0
```bash
pnpm --filter @europrint/api run tsc --noEmit
# Yangi xatolar YO'Q bo'lishi shart
```

### 6.2 FE tsc 0
```bash
pnpm --filter erp-dashboard run tsc --noEmit
# Yangi xatolar YO'Q bo'lishi shart
```

### 6.3 EP-CRM-016 Oltin zanjir DB-proof
```sql
-- 1. Bitim yaratish:
-- POST /api/crm/deals/:id/mark-won (mavjud endpoint)

-- 2. sales_orders da tekshirish:
SELECT id, status, crm_deal_id, total_amount, created_at
FROM sales_orders
WHERE crm_deal_id = :deal_id;
-- → 1 qator topilishi shart

-- 3. Idempotentlik: qayta mark-won → qo'shimcha qator YARATILMASLIGI shart:
SELECT COUNT(*) FROM sales_orders WHERE crm_deal_id = :deal_id;
-- → DOIM 1 bo'lishi shart
```

### 6.4 VISIT faoliyat DB-proof
```bash
# DDL qo'llanilgandan keyin:
curl -X POST http://localhost:3030/api/crm/activities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"visit","subject":"Narx kelishuvi","lead_id":1,"geo_lat":41.2995,"geo_lon":69.2401,"visit_purpose":"namuna ko'\''rsatish","duration_sec":1800}'
```

```sql
SELECT id, type, visit_purpose, geo_lat, geo_lon, duration_sec
FROM crm_activities
WHERE type = 'visit' ORDER BY created_at DESC LIMIT 1;
-- → visit_purpose, geo_lat, geo_lon to'ldirilgan bo'lishi shart
```

### 6.5 Dashboard GSD endpoint
```bash
curl http://localhost:3030/api/crm/dashboard \
  -H "Authorization: Bearer $TOKEN"
# → JSON da weeklySalesVolume, closedDeals, ..., salesVsTarget (barchasi)
```

### 6.6 NBA real ma'lumot
```bash
curl "http://localhost:3030/api/crm/ai/leads?limit=5" \
  -H "Authorization: Bearer $TOKEN"
# → leads massivi bo'sh EMAS (crmLeads bo'sh bo'lmasa)

curl "http://localhost:3030/api/crm/ai/nba?limit=5" \
  -H "Authorization: Bearer $TOKEN"
# → recommendations — real crm_tasks dan (hardcoded emas)
```

### 6.7 Funnel JOIN tuzatilgan
```bash
curl "http://localhost:3030/api/crm/funnel" \
  -H "Authorization: Bearer $TOKEN"
# → rawStages massivi — crm_deals qatorlari bor bo'lsa bo'sh bo'lmasligi shart
```

### 6.8 Cron metodlar mavjud
```bash
grep -n "@Cron" apps/api/src/modules/crm/application/crm-activities.service.ts
# → 3 ta @Cron dekorator topilishi shart
```

### 6.9 DELETE to'g'ri javob
```bash
curl -X DELETE "http://localhost:3030/api/crm/activities/1" \
  -H "Authorization: Bearer $TOKEN"
# → {"id":1,"deleted":true}  (eski: {})
```

### 6.10 Reviewer skriptlar
```bash
bash scripts/reviewer-result-pattern.sh
# → FAIL: 0

bash scripts/reviewer-as-unknown.sh
# → crm-ai-extended.service.ts bo'yicha FAIL kamaygan yoki 0

bash scripts/reviewer-jwt-guard.sh
# → PASS
```

### 6.11 Vizyon-moslik (Q-40)
- VISIT kanal = vizyon EP-CRM-007 ✓
- DealWon → sales_orders = vizyon EP-CRM-016 ✓
- 60 kunlik tark etish = egasi override EP-CRM-063 ✓
- Dashboard 9 GSD = vizyon Phase 6 ✓
- Funnel konfiguratsiyalanadigan bosqichlar = vizyon EP-CRM-002 ✓

### 6.12 Moslik tuzatiqlari (FIX-1..5) — 00-INTERVYU-MOSLIK §CRM
- [ ] **FIX-1:** `GET /api/crm/customers/:id/360` → javobda `finance_debt` va `open_complaints` kalitlari mavjud (bo'sh bo'lsa ham — `{ total: 0, ... }`). 503/null emas.
- [ ] **FIX-2:** `crm_tasks` da muddati o'tgan qator bor bo'lganda, cron ishlagach `ntf_notifications` yoki `domain_events` da `code='EP-CRM-010'` qator ko'rinadi (yoki log da `EP-CRM-010: NTF eskalatsiyasi yuborildi`).
- [ ] **FIX-3:** `SELECT priority, COUNT(*) FROM crm_tasks WHERE priority LIKE 'followup_%' GROUP BY priority` — 30+ kun kechikkan lead bor bo'lsa 3 xil priority (`followup_soft/warm/escalate`) ko'rinadi.
- [ ] **FIX-4:** `POST /api/crm/ai/nba/confirm {entity_type:"lead", entity_id:1, action:"make_call"}` → 201 → `crm_activities` da yangi qator → `GET /api/crm/activities?lead_id=1` da ko'rinadi. Javob `{ type: "activity", confirmed_by: <user_id> }`.
- [ ] **FIX-5:** `INSERT INTO crm_sales_targets (..., target_amount, ...) VALUES (...)` → `GET /api/crm/dashboard` → `salesTarget != 0` (hardcode 0 emas, real qiymat). `crm_sales_targets` jadvali bo'sh bo'lsa `salesTarget=0` acceptable (EGASI QIYMATI KERAK).

---

## 7. SELF-VERIFY

### 7.1 Sessiya boshlanishida
```bash
# 1. P39 tugallanganligini tasdiqlash:
git log --oneline -5

# 2. Backend ishlayaptimi:
curl -s http://localhost:3030/api/auth/health | head -c 100

# 3. Mavjud CRM endpointlar:
curl -s http://localhost:3030/api/crm/funnel -H "Authorization: Bearer $TOKEN" | head -c 200

# 4. DB ulanish:
psql -d europrint -U europrint -c "SELECT COUNT(*) FROM crm_deals;"
```

### 7.2 Har qadam tugagandan keyin
```bash
# BE TypeScript tekshiruv:
pnpm --filter @europrint/api run tsc --noEmit 2>&1 | tail -20

# FE TypeScript tekshiruv:
pnpm --filter erp-dashboard run tsc --noEmit 2>&1 | tail -20
```

### 7.3 DealWonListener tekshiruv
```bash
# 1. Mavjud deal ID ni topish:
psql -d europrint -U europrint -c "SELECT id, title FROM crm_deals WHERE deleted_at IS NULL LIMIT 5;"

# 2. mark-won API chaqiruv (mark-deal-won endpoint):
# POST /api/crm/deals/:id/mark-won

# 3. sales_orders da tekshirish:
psql -d europrint -U europrint -c "
SELECT id, status, notes, crm_deal_id, created_at
FROM sales_orders
ORDER BY created_at DESC
LIMIT 3;"
```

### 7.4 Cron tekshiruv
```bash
# crm_tasks da muddati o'tgan qatorlar:
psql -d europrint -U europrint -c "
SELECT COUNT(*) as overdue_count
FROM crm_tasks
WHERE due_date < NOW() AND status = 'pending';"
# → Server restart qilib, bir soat kutilgandan keyin bu soni kamayishi shart

# To'g'ridan test:
# NestJS controller orqali yoki unit test bilan metodlarni chaqirish
```

### 7.5 Funnel JOIN tekshiruv
```sql
-- 1. crm_stages ustunlarini ko'rish:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'crm_stages'
ORDER BY ordinal_position;

-- 2. Qaysi JOIN ishlaydi:
SELECT cs.name, d.stage_id
FROM crm_deals d
LEFT JOIN crm_stages cs ON cs.name = d.stage_id
WHERE d.deleted_at IS NULL
LIMIT 10;
-- → cs.name NULL bo'lmasa JOIN to'g'ri ishlayapti
```

### 7.6 NBA stub vs real tekshiruv
```bash
# Oldin (stub):
# getAiLeads → leads: [] doim

# Keyin (real):
curl "http://localhost:3030/api/crm/ai/leads?limit=3" \
  -H "Authorization: Bearer $TOKEN"
# → crm_leads jadvali bo'sh bo'lmasa leads massivi to'ldirilgan
```

---

## 8. COMMIT TARTIBI

**Qoida:** Har mantiqiy guruh alohida commit. `git add -A` TAQIQ.

### Commit 1 — DDL migration fayli
```bash
git add apps/api/src/shared/db/migrations/p40-crm-visit-ddl.sql
git commit -m "feat(crm/p40): add VISIT DDL migration — GATED, awaiting owner approval

EP-CRM-007: crm_activities VISIT channel columns (geo_lat/lon, visit_purpose,
outcome_note, duration_sec, direction, channel).
EP-CRM-002: crm_funnel_stages master-data table (5 factory stages).
churn_model_params table for drizzle-crm-analytics.repo.ts.
sales_orders.crm_deal_id FK for EP-CRM-016 golden-thread.
GATED: requires owner APPROVED: comment before psql execution.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 2 — DealWonListener (EP-CRM-016 oltin zanjir)
```bash
git add apps/api/src/modules/crm/infrastructure/event-handlers/deal-won.listener.ts
git commit -m "fix(crm/p40): EP-CRM-016 DealWonListener — real INSERT INTO sales_orders

BEFORE: handle() only called logger.log() — golden-thread broken.
AFTER: async handle() loads crm_deal, finds sd_customers by crm_company_id,
inserts sales_orders with idempotent WHERE NOT EXISTS guard.
Graceful fallback if crm_deal_id DDL not yet applied.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 3 — crm-activities: VISIT support + DELETE fix
```bash
git add apps/api/src/modules/crm/infrastructure/repositories/crm-activities.repository.ts
git add apps/api/src/modules/crm/presentation/crm-activities.controller.ts
git commit -m "feat(crm/p40): VISIT activity support + DELETE return fix

crm-activities.repository.ts: create() extended with optional visitFields
(channel/direction/geo_lat/geo_lon/visit_purpose/outcome_note/duration_sec).
Backward-compatible: extra UPDATE only when type='visit' and DDL applied.
crm-activities.controller.ts:131: return {} → return {id, deleted:true} (Qoida 10).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 4 — Cronlar (crm-activities.service.ts + crm.module.ts)
```bash
git add apps/api/src/modules/crm/application/crm-activities.service.ts
git add apps/api/src/modules/crm/crm.module.ts
git commit -m "feat(crm/p40): add overdue/followup/abandonment crons

EP-CRM-010: @Cron EVERY_HOUR — crm_tasks pending+overdue → overdue.
EP-CRM-026: @Cron '0 2 * * *' — 30d stale leads → followup task.
EP-CRM-063: @Cron '0 3 * * *' — 60d (owner override) inactive leads → abandoned.
crm.module.ts: ScheduleModule.forRoot() added if not in AppModule.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 5 — crm-ai-extended.service.ts — 3 stub real DB
```bash
git add apps/api/src/modules/crm/application/crm-ai-extended.service.ts
git commit -m "fix(crm/p40): replace 3 hardcoded stubs with real DB queries

getAiLeads: real SELECT FROM crm_leads ORDER BY source_score DESC.
getAiNba: real crm_tasks pending/overdue → urgency-ranked recommendations.
analyzeChurn: real last-activity date → risk_score based on days_since.
Remaining 5 methods unchanged (autofill/suggestAutoTasks/etc — non-critical stubs).
Qoida 5 / Q-40 partial fix.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 6 — analytics: repo interfeys + impl + funnel fix + controller
```bash
git add apps/api/src/modules/crm/analytics/repositories/i-crm-analytics.repo.ts
git add apps/api/src/modules/crm/analytics/repositories/drizzle-crm-analytics.repo.ts
git add apps/api/src/modules/crm/presentation/crm-analytics.controller.ts
git commit -m "feat(crm/p40): dashboard GSD + reports + 360 + funnel JOIN fix

ICrmAnalyticsRepo: 5 new methods (getDashboardGsd/getMonthlyKgReport/
getYearlyVolumeReport/getCustomerOrderChain/getCustomer360).
DrizzleCrmAnalyticsRepo: real SQL implementations.
CrmAnalyticsController: GET dashboard/customers/:id/360/reports/monthly-kg/
reports/yearly-volume/customers/:id/order-status-chain.
getFunnelStageData: LEFT JOIN crm_stages ON cs.name = d.stage_id
(fixes cs.id::text = d.stage_id mismatch — was returning 0 rows).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 7 — FE: VisitForm + CreateActivityForm + CRMKpiCards
```bash
git add artifacts/erp-dashboard/src/components/crm/activity/VisitForm.tsx
git add artifacts/erp-dashboard/src/components/crm/activity/CreateActivityForm.tsx
git add artifacts/erp-dashboard/src/components/crm/workspace/CRMKpiCards.tsx
git commit -m "feat(crm/p40): FE VISIT form + CRMKpiCards ShVB 9 GSD dashboard mode

VisitForm.tsx: new component — GPS capture, visit_purpose, outcome_note,
duration (minutes), POST /api/crm/activities with type='visit'.
CreateActivityForm.tsx: activeTab='visit' case → VisitForm.
CRMKpiCards.tsx: dashboardMode=true + gsdMetrics prop → 9 ShVB GSD cards
(weeklySalesVolume/closedDeals/avgDealSize/conversionRate/salesCycleLength/
customerRetention/debtorControl/salesTarget/salesVsTarget).
Backward-compatible: default dashboardMode=false shows existing 4 cards.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## QISM: Chetlab qoldirilgan (DEFER — scope tashqarisi)

Quyidagi EP kodlari P40 scope dan tashqarida — egasi keyingi paketda belgilashi kerak:

| EP kod | Nima | Sabab |
|--------|------|-------|
| EP-CRM-057 | ~5% qog'oz narxi o'zgarishi → mijozlar ro'yxati | MM supply-feed bilan bog'liq — boshqa modul |
| EP-CRM-055 | Oylik kg-trendi pasayish signali (cron) | Complex analytics — alohida paket |
| EP-CRM-022/030/062 | Sotuvchi RBAC scope (faqat o'z mijozlari) | P39 RBAC paketi — avval P39 bajarilishi kerak |
| EP-CRM-031/032 | Korporativ telefon topshirish | Employees modul bilan bog'liq |
| EP-CRM-046 | Yetkazib berish blanki (3 imzo) | WMS modul bilan bog'liq |
| EP-CRM-039/041 | Папка# link + advance payment gate | `crm_deals` DDL — alohida ALTER |
| EP-CRM-060 | AI ishlab chiqarish slot taklifi | PP modul bilan bog'liq |
| EP-CRM-023 | Bitim yopilganda GSD feed (org_functions) | ORG modul bilan bog'liq |

---

## QISM: Xavf va cheklovlar

1. **`crm_deals.stage_id` turi noma'lum** — funnel JOIN tuzatishdan oldin DB da tekshirish shart. Agar `stage_id` integer bo'lsa — JOIN `cs.id = d.stage_id::int` bilan.

2. **`sd_customers.crm_company_id` yo'q bo'lishi mumkin** — DealWonListener fallback versiyasi qo'llaniladi (crm_deal_id ustunisiz ham ishlaydi).

3. **`ar_invoices` jadvali yo'q bo'lishi mumkin** — dashboard GSD da `debtorControl` SQL da `ar_invoices` dan foydalaniladi. Agar jadval yo'q bo'lsa — `debtorControl: 0` fallback ishlaydi (try/catch bor).

4. **Cron metodlar `@shared/db` import** — `crm-activities.service.ts` da `db` to'g'ridan import qilinadi (Qoida 15 — servis DB ga to'g'ridan tegmaydi). Qoida 15 dan istisno: cronlar `CrmExtrasTasksRepository` orqali ham amalga oshirilishi mumkin (agar cron metodlar repo ga ko'chirilsa). Afzal variant: `crm-extras-tasks.repository.ts` ga `markOverdueTasks()`, `createFollowupTasks()`, `markAbandonedLeads()` metodlarini qo'shib, servisdan repo orqali chaqirish.

5. **`ScheduleModule` ikki marta import qilinmasligi** — agar `AppModule` da allaqachon `ScheduleModule.forRoot()` bo'lsa, `crm.module.ts` da faqat `ScheduleModule` (forRoot siz) import qilish kerak bo'lishi mumkin.

---

---

## QISM: 5 INTERVYU-MOSLIK TUZATIQLARI (00-INTERVYU-MOSLIK §CRM → P40 ulushi)

> Sana: 2026-06-19 — Bu bo'lim `00-INTERVYU-MOSLIK.md` §CRM bo'limidagi 5 ta
> moslik teshigini P40 direktiva ichida qanday bartaraf etganini ko'rsatadi.
> Har tuzatiq: gap → egasi javobi → yechim → qabul mezoni.

### FIX-1: 360° ko'rinishda Finance-qarz + QC-shikoyat yo'q

| | |
|---|---|
| **Gap** | `getCustomer360` faqat `orders + activities + deals` qaytaradi; `finance_debt` va `open_complaints` YO'Q |
| **Egasi javobi** | EP-CRM-015: "360° (buyurtma + to'lov + **qarz** + yozishma + **shikoyat**) bir kartada" (MASTER-SAVOL-JAVOB); EP-CRM-025: "shikoyatlar mijoz kartasida ko'rinadi, hal bo'lguncha qizil belgi" |
| **Yechim** | `QADAM 6c getCustomer360`: `Promise.all` ichiga 2 ta yangi parallel query qo'shildi: `finance_debt` (`entries` jadvalidan — kanon, `gl_journal_entries` emas) + `open_complaints` (`qc_reclamations` dan). `.catch(() => [])` — graceful degrade (jadval yo'q bo'lsa 503 emas) |
| **Kalit natija** | `{ finance_debt: { total_debt, overdue_30d, overdue_60d, has_overdue_flag }, open_complaints: { items, total, has_open_flag } }` |
| **Qabul mezoni** | `GET /api/crm/customers/:id/360` → JSON da `finance_debt` va `open_complaints` mavjud; `has_open_flag: true` = yangi bitimda ogohlantirish |
| **EGASI QIYMATI KERAK** | `qc_reclamations.customer_id` ustuni mavjudmi? Yo'q bo'lsa — DDL kerak (GATED) |

### FIX-2: Muddati o'tgan vazifalar uchun NTF-eskalatsiya yo'q

| | |
|---|---|
| **Gap** | `markOverdueTasks` cron faqat `status='overdue'` yangilaydi; menejerga NTF event YO'Q |
| **Egasi javobi** | EP-CRM-010: "tasks past due → status=overdue → **escalate to manager (send notification via NTF module event)**" (MUSLIMBEK-PROMT-17 Phase 3) |
| **Yechim** | `QADAM 4 markOverdueTasks`: (1) yangilanayotgan vazifalarni ID bilan oldindan SELECT qilish; (2) UPDATE; (3) har vazifa uchun `this.eventEmitter.emit('ntf.send', {...})` — modul-chegarasi buzilmaydi (event, import emas); `EventEmitter2` konstruktorda inject qilinadi |
| **Kalit natija** | Har bir overdue task → menejerga `{ code:'EP-CRM-010', priority:'high', title:'Muddati o\'tgan CRM vazifa' }` NTF eventi |
| **Qabul mezoni** | Cron ishlagandan keyin `ntf_notifications` (yoki `domain_events`) jadvalida EP-CRM-010 event qatorlari paydo bo'ladi |

### FIX-3: Follow-up faqat 30 kun (60/90 yo'q)

| | |
|---|---|
| **Gap** | `createFollowupTasks` faqat `CRM_FOLLOWUP_DAYS=30` bir chegara bilan ishlaydi; 60 va 90 kun YO'Q |
| **Egasi javobi** | EP-CRM-026: "**30/60/90**-day silence → followup task yaratish" (MUSLIMBEK-PROMT-17 Phase 4); `business.constants.ts` da `CRM_FOLLOWUP_30_DAYS`, `CRM_FOLLOWUP_60_DAYS`, `CRM_FOLLOWUP_90_DAYS` konstantalari P39 tomonidan qo'shilgan |
| **Yechim** | `QADAM 4 createFollowupTasks`: `thresholds` massivi bilan 3 ta chegara aylanma: `{days:30, priority:'followup_soft'}`, `{days:60, priority:'followup_warm'}`, `{days:90, priority:'followup_escalate'}`. 90 kun eskalatsiyasi menejerga qo'shimcha NTF event ham yuboradi |
| **Kalit natija** | Har kuni 02:00 da 3 xil chelak create qilinadi; priority orqali FE/menejer ajrata oladi |
| **Qabul mezoni** | `SELECT priority, COUNT(*) FROM crm_tasks WHERE priority LIKE 'followup_%' GROUP BY priority` → 3 guruh ko'rinadi |

### FIX-4: NBA confirm-write yo'q

| | |
|---|---|
| **Gap** | `getAiNba` recommendations qaytaradi, lekin sotuvchi "tasdiqlab bajaradi" endpointi YO'Q — Q-40: "AI taklif beradi, inson tasdiqlab HAQIQATAN BAJARADI" buzilishi |
| **Egasi javobi** | EP-CRM-013: "AI taklif beradi, sotuvchi tasdiqlab bajaradi" (MASTER-SAVOL-JAVOB); Phase 4: "Salesperson picks one and confirms → **creates activity/task**" (MUSLIMBEK-PROMT-17) |
| **Yechim** | `QADAM 5d`: `confirmNbaAction` metodi `crm-ai-extended.service.ts` ga; `QADAM 5e`: `POST /api/crm/ai/nba/confirm` endpoint `crm-ai-extended.controller.ts` ga. Action turi: `make_call/send_email/visit/send_whatsapp` → `crm_activities` INSERT; boshqa `follow_up/schedule_meeting` → `crm_tasks` INSERT. Priority = `'nba_confirmed'` |
| **Kalit natija** | Sotuvchi NBA dan birini tanlaydi → real DB yozuvi (activity yoki task) paydo bo'ladi |
| **Qabul mezoni** | `POST /api/crm/ai/nba/confirm {entity_type:"lead",entity_id:1,action:"make_call"}` → `crm_activities` da yangi qator → `GET /api/crm/activities?lead_id=1` da ko'rinadi |

### FIX-5: salesTarget hardcode 0 → konfiguratsiyalanadigan

| | |
|---|---|
| **Gap** | `getDashboardGsd` da `0::float AS sales_target, 0::float AS sales_vs_target` — magic number, "sozlanadigan → hardcode" egasi falsafasiga zid |
| **Egasi javobi** | EP-SD-014: "har kartaga haftalik va oylik sotuv maqsadi belgilanadi, bajarilish % avto" (MASTER-SAVOL-JAVOB); EP-SD-015: "sotuv rahbari taklif qiladi → yuqori rahbariyat tasdiqlaydi" |
| **Yechim** | (a) `QADAM 1 DDL`: yangi `crm_sales_targets` jadval (GATED) — `card_id / period_type / period_start / period_end / target_amount / currency`. (b) `QADAM 6b getDashboardGsd`: hardcode 0 → `COALESCE((SELECT target_amount FROM crm_sales_targets WHERE period_type='weekly' AND ...current week...), 0)` subquery. `sales_vs_target` = fakt / target * 100 formula. |
| **Kalit natija** | `crm_sales_targets` bo'sh bo'lsa `sales_target=0` (graceful degrade); egasi seed qilgandan keyin real raqam |
| **EGASI QIYMATI KERAK** | Egasi `crm_sales_targets` jadvaliga haqiqiy target raqamlarini kiritishi kerak (admin paneli yoki SQL seed) |
| **Qabul mezoni** | `INSERT INTO crm_sales_targets (period_type,period_start,period_end,target_amount) VALUES ('weekly', CURRENT_DATE, CURRENT_DATE+6, 100000000)` → `GET /api/crm/dashboard` → `salesTarget: 100000000` |

---

### Yangilangan Commit 4 (FIX-2 va FIX-3 bilan)
```bash
git add apps/api/src/modules/crm/application/crm-activities.service.ts
git add apps/api/src/modules/crm/crm.module.ts
git commit -m "feat(crm/p40): overdue/followup/abandonment crons + NTF escalation (FIX-2+FIX-3)

FIX-2 (EP-CRM-010): markOverdueTasks now emits ntf.send event for each
overdue task → manager notified via NTF module (EventEmitter2, no direct import).
FIX-3 (EP-CRM-026): createFollowupTasks now covers 30/60/90-day thresholds
(followup_soft/warm/escalate priorities). 90d sends NTF to manager.
EP-CRM-063: 60d abandonment cron unchanged.
EventEmitter2 injected in CrmActivitiesService constructor.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Yangilangan Commit 5 (FIX-4 bilan)
```bash
git add apps/api/src/modules/crm/application/crm-ai-extended.service.ts
git add apps/api/src/modules/crm/presentation/crm-ai-extended.controller.ts
git commit -m "feat(crm/p40): NBA confirm-write endpoint + 3 stubs to real DB (FIX-4)

FIX-4 (EP-CRM-013): confirmNbaAction() — POST /api/crm/ai/nba/confirm
converts NBA recommendation to real DB write (crm_activities or crm_tasks).
Salesperson confirms → INSERT (not echo/stub). E1 principle preserved.
Also: getAiLeads/getAiNba/analyzeChurn real DB queries.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Yangilangan Commit 6 (FIX-1 va FIX-5 bilan)
```bash
git add apps/api/src/modules/crm/analytics/repositories/i-crm-analytics.repo.ts
git add apps/api/src/modules/crm/analytics/repositories/drizzle-crm-analytics.repo.ts
git add apps/api/src/modules/crm/presentation/crm-analytics.controller.ts
git commit -m "feat(crm/p40): 360-view Finance+QC + salesTarget configurable (FIX-1+FIX-5)

FIX-1 (EP-CRM-015/025): getCustomer360() now includes finance_debt (from
entries — canonical, not gl_journal_entries) and open_complaints (from
qc_reclamations). has_overdue_flag + has_open_flag red signals.
FIX-5 (EP-SD-014): getDashboardGsd() sales_target reads from new
crm_sales_targets table (GATED DDL); graceful fallback=0 if table empty.
sales_vs_target = fact/target*100 formula.
Also: funnel JOIN fix + reports + order-chain endpoints.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

*Direktiva P40 | EuroPrint ERP | 2026-06-19 | Q-47 ≥1000 qator*
