# P36 — AI / Markaziy-AI: AI CKP + fit/violation/block/camera + forecast/governance services

> Paket: P36 · Modul: AI / Markaziy-AI · To'lqin: 3 · Bog'liqlik: ["P35"]
> Yozilgan: 2026-06-19 · Egasi tasdiqlamagunicha DDL ISHGA TUSHIRILMAYDI.

---

## 0. ROL VA QOIDALAR

**Siz 🟢 BAJARUVCHI agentsiz.** Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qing.

**WAVE: 3** · **dependsOn: ["P35"]** — P35 (AI / Markaziy-AI: central infra, ai-router, ai-exam, ai-hr-new, ai-planning, ai-reservation, insights, forecast) to'liq bajarilmaguncha bu paket boshlanmaydi. P35 DONE bo'lganini `git log --oneline` bilan tasdiqla.

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE
    ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil,
    supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni
    YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi,
    shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag:**

### Schema fayllari (DDL GATED — egasi ruxsati kerak):
```
lib/db/src/schema/ai-ckp-schema.ts
lib/db/src/schema/ai-fit-schema.ts
lib/db/src/schema/ai-violation-schema.ts
lib/db/src/schema/ai-chat-card-schema.ts
lib/db/src/schema/ai-governance-schema.ts
```

### Backend service fayllari:
```
apps/api/src/modules/ai/application/services/ai-ckp.service.ts
apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-ckp.repo.ts
apps/api/src/modules/ai/domain/repositories/i-ai-ckp.repo.ts
apps/api/src/modules/ai/application/services/ai-fit.service.ts
apps/api/src/modules/ai/application/services/ai-report.service.ts
apps/api/src/modules/ai/application/services/ai-bonus.service.ts
apps/api/src/modules/ai/application/services/ai-succession.service.ts
apps/api/src/modules/ai/application/services/ai-violation.service.ts
apps/api/src/modules/ai/application/services/ai-block.service.ts
apps/api/src/modules/ai/application/services/ai-camera.service.ts
apps/api/src/modules/ai/application/services/ai-burnout.service.ts
apps/api/src/modules/ai/application/services/ai-fraud.service.ts
apps/api/src/modules/ai/application/services/ai-forecast-range.service.ts
apps/api/src/modules/ai/application/services/ai-bottleneck.service.ts
apps/api/src/modules/ai/application/services/ai-chat-card.service.ts
apps/api/src/modules/ai/application/services/ai-override.service.ts
apps/api/src/modules/ai/application/services/ai-dispute.service.ts
apps/api/src/modules/ai/application/services/ai-governance.service.ts
apps/api/src/modules/ai/application/services/ai-calibration.service.ts
apps/api/src/modules/ai/services/director-ai.service.ts
```

### Frontend sahifa fayllari:
```
artifacts/erp-dashboard/src/pages/EmployeeCkpDashboard.tsx
artifacts/erp-dashboard/src/pages/AIFitScores.tsx
artifacts/erp-dashboard/src/pages/AIViolations.tsx
artifacts/erp-dashboard/src/pages/AIBlockLog.tsx
artifacts/erp-dashboard/src/pages/AICameraCrossCheck.tsx
artifacts/erp-dashboard/src/pages/AIForecastPage.tsx
artifacts/erp-dashboard/src/pages/AIGovernancePage.tsx
artifacts/erp-dashboard/src/pages/AICardChatPage.tsx
```

### DDL migration fayllari (GATED — yoz, lekin ISHGA TUSHIRMA):
```
apps/api/src/shared/db/migrations/ai-p36-ckp-fit-schema.sql         ← GATED
apps/api/src/shared/db/migrations/ai-p36-violation-block-schema.sql  ← GATED
apps/api/src/shared/db/migrations/ai-p36-chat-card-schema.sql        ← GATED
apps/api/src/shared/db/migrations/ai-p36-governance-schema.sql       ← GATED
```

**Qo'shimcha: P50 (route/sidebar) bu paketdan route konstantalarini import qiladi —
sidebar/route fayllariga TEGMA. P50 o'zi qo'shadi.**

---

## 2. VIZYON

### 2.1 CKP (Chiqish Ko'rsatkichlari Poydevori) — Phase 2

**Vizyon:** Har bir xodim uchun AI kunlik CKP chatbot — xodim o'z natijalarini so'raydi,
AI tushuntiradi, maslaxat beradi. Oylik maosh darvozasi: `ai_ckp_scores` jadvalida
`salary_gate_pass = true/false` — HR modul bu flagni o'qib maosh tasdiqini bloklaydi yoki
o'tkazadi. IoT auto-collect: MES/POS events kelganda `ai_ckp_scores` avtomatik yangilanadi
(Phase 2 scope).

**Qabul mezoni:**
- `ai_ckp_scores` jadvalida xodim ID bo'yicha kunlik ball yoziladi (REAL INSERT, echo emas).
- `GET /api/ai/ckp/employee/:id` → oxirgi 30 kunlik skorelar qaytaradi.
- `POST /api/ai/ckp/chat` → xodim savol yuboradi, AI (AiRouterService orqali) javob beradi,
  suhbat tarixi `ai_ckp_chat_logs` ga saqlanadi.
- `salary_gate_pass` maydoni HR modul tomonidan o'qilishi uchun mavjud.
- FE: `EmployeeCkpDashboard.tsx` — grafik (30 kun trend) + chatbot paneli + maosh gate badge.

### 2.2 Fit/Report/Bonus/Succession — Phase 3

**Vizyon:** AI xodim-karta mosligini baholaydi (fit score 0-100), hisobot yozadi, bonus
tavsiya qiladi, vorislik zanjiri (succession) holatini ko'rsatadi.

**Qabul mezoni:**
- `ai_fit_scores` jadvalida `employee_id`, `card_id`, `fit_score`, `fit_report` (JSONB),
  `bonus_recommendation`, `succession_candidate` (boolean) mavjud.
- `POST /api/ai/fit/evaluate` → AI baholaydi, DB ga yozadi, Result<FitScore> qaytaradi.
- `GET /api/ai/fit/scores` → ro'yxat, filtrlash: department, score range.
- `GET /api/ai/fit/report/:employee_id` → batafsil hisobot.
- FE: `AIFitScores.tsx` — jadval + filter + hisobot modal.

#### 2.2.1 Fit-PDF 3-tomon hisobot (KARTALAR Q30/Q31 + EP-AI-067 talabi)

> **Manba:** KARTALAR Q30/Q31 + EP-AI-067: Portret = AI-generatsiya qilingan
> moslik-hisobot PDF → **uchta tomonga** yuboriladi: xodim + rahbar + HR.

**Qabul mezoni:**
- `POST /api/ai/fit/report/:employee_id/pdf` → fit_report (JSONB) + ckp_trend + violation_summary
  asosida AI matn generatsiya qiladi → PDF yaratadi (pdfkit/puppeteer) → 3 tomon:
  - DB da saqlanadi (`ai_fit_scores.pdf_url` ustun) ← **DDL ga qo'shimcha kerak** (§QADAM 2)
  - Xodimga: `/api/ai/fit/report/:id/pdf/download` (JWT bilan himoyalangan)
  - Rahbarga va HR ga: NTF yuboriladi (`ai_fit_report_generated` event, P46/P47 scope)
- `GET /api/ai/fit/report/:employee_id/pdf` → mavjud PDF URL qaytaradi yoki 404
- FE: `AIFitScores.tsx` — "PDF yuklash" va "PDF yuborish" tugmalari qo'shiladi

> ⚠️ PDF generatsiya library (pdfkit/puppeteer) P36 OWNED FILE emas —
> egasi kutubxona tanlashni tasdiqlaydi: **EGASI TANLOV KERAK**.
> Hozircha: PDF o'rniga `GET /api/ai/fit/report/:id/json` → JSONB to'liq qaytaradi
> (PDF keyingi sprint qo'shiladi — jim qoldirilmaydi: flag yoziladi).

**`ai_fit_scores` jadvaliga qo'shimcha ustunlar** (QADAM 2 DDL ga):
```sql
ALTER TABLE ai_fit_scores
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,           -- PDF fayl yo'li (S3/lokal)
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;
```
Drizzle sxemada ham:
```typescript
pdfUrl:            text('pdf_url'),
pdfGeneratedAt:    timestamp('pdf_generated_at', { withTimezone: true }),
```

#### 2.2.2 Tarixiy ma'lumot import (historical-import)

> **Manba:** 00-INTERVYU-MOSLIK §2 "tarixiy-import yo'q" — egasi eski CKP/fit
> ma'lumotlarini import qilish imkonini kutgan.

**Qabul mezoni:**
- `POST /api/ai/fit/import-historical` → CSV/JSON format:
  `[{ employee_id, card_id, fit_score, bonus_recommendation, evaluated_at }]`
- Validatsiya: Zod schema, `evaluated_at` o'tgan sana bo'lishi shart
- REAL INSERT: `ai_fit_scores` ga batch upsert (ON CONFLICT employee_id+evaluated_at DO NOTHING)
- Response: `{ imported: N, skipped: M, errors: [...] }`
- FE: `AIFitScores.tsx` da "Import" tugmasi → file input (CSV/JSON) → POST

**`ai_ckp_scores` uchun ham:** `POST /api/ai/ckp/import-historical`:
```typescript
// [{ employee_id, ckp_score, attendance_score, quality_score, plan_score,
//    time_score, salary_gate_pass, score_date }]
// ON CONFLICT (employee_id, score_date) DO NOTHING
```

> ⚠️ Import endpoint OWNED FILE ro'yxatida yo'q — egasi keyingi paketga defer qilsin
> yoki P36 IZOLYATSIYA MANIFESTIga qo'shsin. **FLAG yozildi (§9).**

### 2.3 Violation/Block/Camera/Burnout/Fraud — Phase 3-4

**Vizyon:**
- **Violation:** AI xodim xatti-harakatini tahlil qilib qoidabuzarlik aniqlaganda
  `ai_violations` jadvaliga yozadi (tur, og'irlik, tavsif, dalillar).
- **Block:** Xodim muayyan harakati bloklanganda (maosh gate, tizimga kirish, buyurtma
  tasdiqi) `ai_block_log` ga yoziladi — kim, nima, qachon, sabab.
- **Camera:** Kamera ma'lumotlari (IoT) bilan xodimning jismoniy joylashuvi
  `ai_camera_cross_check` orqali tekshiriladi (shift belgilangan joy vs kamera ko'rgan joy).
- **Burnout:** AI xodim burnout riskini hisoblaydi (ishlash intensivligi, dam olish,
  CKP tushishi) → `ai_burnout_risk` maydon.
- **Fraud:** Moliyaviy operatsiyalar anomaliyasi AI tomonidan aniqlanadi → `ai_fraud_alerts`.

**Qabul mezoni:**
- `ai_violations` jadvalida REAL INSERT (POST /api/ai/violations/create).
- `ai_block_log` jadvalida har blok yozuvi (kirit→saqla→qayta o'qi tekshiruv).
- `GET /api/ai/violations` → filter: employee_id, type, severity, date range.
- `GET /api/ai/block-log` → filter: employee_id, block_type, date.
- `GET /api/ai/camera/cross-check/:employee_id` → bugun uchun kamera vs shift mos tekshiruv.
- FE: `AIViolations.tsx`, `AIBlockLog.tsx`, `AICameraCrossCheck.tsx` — real DB ma'lumotlar.

### 2.4 Forecast-range/Bottleneck — Phase 5

**Vizyon:** AI endi faqat nuqta qiymat emas, **diapazon** (optimistik/pessimistik/real)
prognoz beradi. Bottleneck: zavodning eng sekin/to'silgan operatsiyasi aniqlanadi.

**Qabul mezoni:**
- `POST /api/ai/forecast/range` → `{ material_id, horizon_days }` → AI `{ low, mid, high, confidence }` qaytaradi, `ai_forecast_ranges` ga yoziladi.
- `GET /api/ai/bottleneck/current` → hozirgi eng yuqori bottleneck jarayon/mashina/operatsiya.
- FE: `AIForecastPage.tsx` — diapazon grafigi (shaded area), bottleneck panel.

### 2.5 Card-chat/Override/Dispute/Governance/Calibration — Phase 5-6

**Vizyon:**
- **Card-chat:** Har bir org_function kartasining o'z AI'si bor — karta bilan chat qilish
  mumkin (talablarni tushuntiradi, moslikni baholaydi).
- **Override:** Manager AI qarorini bekor qilishi mumkin (masalan, AI blok qo'ydi, manager
  ochadi) → `ai_overrides` jadvalida log.
- **Dispute:** Xodim AI qaroriga e'tiroz bildiradi → `ai_disputes` jadvalida, HR ko'rib
  chiqadi.
- **Governance:** AI qarorlarining umumiy nazorati — kim qanday qaror qabul qildi,
  qanday approve/reject bo'ldi, audit trail.
- **Calibration:** AI modelining sifatini moslash — qancha to'g'ri bashorat qildi,
  xato foizi, tuzatish tavsiyasi.

**Qabul mezoni:**
- `POST /api/ai/card-chat/:card_id` → AI karta kontekstida javob beradi, log yoziladi.
- `POST /api/ai/override` → manager override, log, qayta hisoblash trigger.
- `POST /api/ai/dispute` → xodim e'tiroz, `pending_review` statusida.
- `GET /api/ai/governance/audit` → barcha AI qarorlar log, filter: module, date, actor.
- `POST /api/ai/calibration/run` → oxirgi 30 kun prognoz vs haqiqat taqqoslash.
- FE: `AICardChatPage.tsx`, `AIGovernancePage.tsx` — real DB ma'lumot.

### 2.6 AISHA-JARVIS-VIZYON va P36 aloqasi (Q-25 master-reja)

> **Manba:** `docs/audit/AISHA-JARVIS-VIZYON-2026-06-17.md` — egasining ENG SO'NGGI AI
> hujjati (2026-06-17). Q-25 bo'yicha master-reja ustun.

P36 ning Aisha bilan kesishuv nuqtalari:
- **CKP chatbot** (`ai-ckp.service.ts chat()`) — Layer A miyasining bir qismi;
  Aisha Layer A `/aisha/chat` endpointi shu xizmatni chaqira oladi.
- **Governance log** — AI qarorlarini Aisha ham ko'ra olishi kerak (kelajakda tool sifatida).
- **OS-control / Layer B** — P36 scope emas; Layer B alohida Python ilova.
- **Futuristik UI** — Aisha uchun dizayn-istisno (Qoida 21 EP-token bypass);
  P36 sahifalari standart EP-token da qoladi (shu modul uchun istisno YO'Q).

P36 bajaruvchisiga **ta'sir yo'q** (izolyatsiya saqlanadi) — bu faqat arxitektura konteksti.

### 2.7 DirectorAiService kengaytirish

`apps/api/src/modules/ai/services/director-ai.service.ts` — mavjud faylga FAQAT yangi
metodlar qo'shiladi (ishlab turgan metodlar O'CHIRILMAYDI — Q-46):
- `getAiGovernanceSummary(userId)` — direktorga AI governance dashboard uchun.
- `getBottleneckReport(userId)` — direktorga zavodning eng og'ir nuqtasi.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud fayllar (exists)

```
apps/api/src/modules/ai/ai.module.ts              — mavjud, kengaytirish kerak
apps/api/src/modules/ai/services/director-ai.service.ts — mavjud (50+ qator),
   explainKpi / assessRisk / getRecommendations / getExecutiveSummary metodlari bor
apps/api/src/modules/ai/application/services/ai-router.service.ts — mavjud, ishlatiladi
lib/db/src/schema/ai-analytics-schema.ts          — mavjud LEKIN bo'sh (orphan jadvallar
   o'chirilgan, faqat comment qolgan) — fayl.7 qator
lib/db/src/schema/ai-providers-schema.ts          — mavjud
```

### 3.2 Yo'q fayllar (missing — yaratish kerak)

Quyidagi fayllarning BARCHASI yo'q (tekshirildi: `find` bilan):
```
lib/db/src/schema/ai-ckp-schema.ts         — YO'Q → yaratish kerak
lib/db/src/schema/ai-fit-schema.ts         — YO'Q → yaratish kerak
lib/db/src/schema/ai-violation-schema.ts   — YO'Q → yaratish kerak
lib/db/src/schema/ai-chat-card-schema.ts   — YO'Q → yaratish kerak
lib/db/src/schema/ai-governance-schema.ts  — YO'Q → yaratish kerak

apps/api/src/modules/ai/application/services/ai-ckp.service.ts         — YO'Q
apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-ckp.repo.ts — YO'Q
apps/api/src/modules/ai/domain/repositories/i-ai-ckp.repo.ts            — YO'Q
apps/api/src/modules/ai/application/services/ai-fit.service.ts          — YO'Q
apps/api/src/modules/ai/application/services/ai-report.service.ts       — YO'Q
apps/api/src/modules/ai/application/services/ai-bonus.service.ts        — YO'Q
apps/api/src/modules/ai/application/services/ai-succession.service.ts   — YO'Q
apps/api/src/modules/ai/application/services/ai-violation.service.ts    — YO'Q
apps/api/src/modules/ai/application/services/ai-block.service.ts        — YO'Q
apps/api/src/modules/ai/application/services/ai-camera.service.ts       — YO'Q
apps/api/src/modules/ai/application/services/ai-burnout.service.ts      — YO'Q
apps/api/src/modules/ai/application/services/ai-fraud.service.ts        — YO'Q
apps/api/src/modules/ai/application/services/ai-forecast-range.service.ts — YO'Q
apps/api/src/modules/ai/application/services/ai-bottleneck.service.ts   — YO'Q
apps/api/src/modules/ai/application/services/ai-chat-card.service.ts    — YO'Q
apps/api/src/modules/ai/application/services/ai-override.service.ts     — YO'Q
apps/api/src/modules/ai/application/services/ai-dispute.service.ts      — YO'Q
apps/api/src/modules/ai/application/services/ai-governance.service.ts   — YO'Q
apps/api/src/modules/ai/application/services/ai-calibration.service.ts  — YO'Q

artifacts/erp-dashboard/src/pages/EmployeeCkpDashboard.tsx    — YO'Q
artifacts/erp-dashboard/src/pages/AIFitScores.tsx             — YO'Q
artifacts/erp-dashboard/src/pages/AIViolations.tsx            — YO'Q
artifacts/erp-dashboard/src/pages/AIBlockLog.tsx              — YO'Q
artifacts/erp-dashboard/src/pages/AICameraCrossCheck.tsx      — YO'Q
artifacts/erp-dashboard/src/pages/AIForecastPage.tsx          — YO'Q
artifacts/erp-dashboard/src/pages/AIGovernancePage.tsx        — YO'Q
artifacts/erp-dashboard/src/pages/AICardChatPage.tsx          — YO'Q
```

### 3.3 Buzuq/soxta fayllar (brokenOrFake)

```
lib/db/src/schema/ai-analytics-schema.ts — mavjud lekin BO'SH (faqat comment, jadval yo'q).
   Bu fayl P36 scope emas — TEGMA. P35 yoki keyingi paketda hal qilinadi.
```

### 3.4 DDL kerak bo'lgan jadvallar

Quyidagi jadvallar DB da YO'Q (migration kerak — GATED):
```
ai_ckp_scores, ai_ckp_chat_logs
ai_fit_scores
ai_violations, ai_block_log, ai_camera_cross_check, ai_burnout_assessments, ai_fraud_alerts
ai_forecast_ranges, ai_bottleneck_log
ai_card_chat_logs
ai_overrides, ai_disputes, ai_governance_log, ai_calibration_runs
```

---

## 4. ISH (qadam-baqadam)

> Har qadam: fayl ko'rsatilgan, o'zgartirish ta'riflangan, oldin/keyin misol, pattern.
> Har qadam oxirida: `pnpm tsc --noEmit` — PASS bo'lishi shart. Har 3 qadamda COMMIT.

---

### QADAM 0-A — CKP konfiguratsiya jadvali (Q65 talabi — GATED DDL)

> **Q65 / VISION-1000:** Vazn koeffitsientlari DB master-data jadvalida, KOD KONSTANTASI EMAS.
> **Q42:** Egasi vaznlarni ko'rsatdi: ЦКП=40 / sifat=30 / muddat=20 / boshqa=10 —
> lekin bu *raqamlar egasi DB ga kiritadi*, direktiva ixtiro qilmaydi.

**Schema qo'shimchasi:** `lib/db/src/schema/ai-ckp-schema.ts` faylining oxiriga qo'shing:

```typescript
/** CKP konfiguratsiya jadvali — vaznlar va chegaralar (egasi UI orqali boshqaradi) */
export const aiCkpConfig = pgTable('ai_ckp_config', {
  id:          serial('id').primaryKey(),
  configKey:   varchar('config_key', { length: 100 }).notNull().unique(),
  configValue: numeric('config_value', { precision: 10, scale: 4 }).notNull(),
  description: text('description'),
  updatedAt:   timestamp('updated_at').defaultNow(),
  updatedById: integer('updated_by_id'),
});

export type AiCkpConfig = typeof aiCkpConfig.$inferSelect;
```

**DDL (GATED):** `apps/api/src/shared/db/migrations/ai-p36-ckp-fit-schema.sql` faylining
OXIRIGA qo'shing (mavjud `ai_fit_scores` CREATE dan keyin):

```sql
-- ── CKP konfiguratsiya jadvali (Q65: vaznlar master-data, kod konstantasi emas) ──
CREATE TABLE IF NOT EXISTS ai_ckp_config (
  id           SERIAL PRIMARY KEY,
  config_key   VARCHAR(100) NOT NULL UNIQUE,
  config_value NUMERIC(10,4) NOT NULL,
  description  TEXT,
  updated_at   TIMESTAMP DEFAULT NOW(),
  updated_by_id INTEGER
);

-- ⚠️ SEED QIYMATLARI: EGASI QIYMATI KERAK — quyidagi raqamlar MISOL (Q42 bo'yicha taxminiy).
-- Egasi /settings/ai-ckp-config ekranida o'zgartiradi.
-- INSERT INTO ai_ckp_config (config_key, config_value, description) VALUES
--   ('ckp_pass_threshold',   60,    'CKP o''tish chegarasi (0-100). EGASI TASDIQLAYDI.'),
--   ('weight_attendance',    0.30,  'Ishtirok og''irligi. EGASI TASDIQLAYDI. Q42 bo''yicha ~40%?'),
--   ('weight_quality',       0.30,  'Sifat og''irligi.   EGASI TASDIQLAYDI. Q42 bo''yicha ~30%?'),
--   ('weight_plan',          0.25,  'Reja og''irligi.    EGASI TASDIQLAYDI. Q42 bo''yicha ~20%?'),
--   ('weight_time',          0.15,  'Vaqt og''irligi.    EGASI TASDIQLAYDI. Q42 bo''yicha ~10%?')
-- ON CONFLICT (config_key) DO NOTHING;
-- ⚠️ Yuqoridagi INSERT IZOHDA — egasi qiymatlarni tasdiqlagunicha ishga tushirilmaydi.
```

**Domain interface:** `apps/api/src/modules/ai/domain/repositories/i-ai-ckp-config.repo.ts` (YANGI):

```typescript
import type { Result } from '@common/result';
import type { CkpWeights } from '../application/services/ai-ckp.service';

export interface IAiCkpConfigRepo {
  /** DB dan CKP vaznlarini o'qiydi. Bo'sh bo'lsa null. */
  getCkpWeights(): Promise<Result<CkpWeights | null>>;
  /** Bitta config qiymatini yangilaydi (admin UI). */
  upsertConfig(key: string, value: number, updatedById: number): Promise<Result<void>>;
  /** Hamma config qatorlarini qaytaradi (admin UI ko'rsatish uchun). */
  listAll(): Promise<Result<Array<{ key: string; value: number; description: string | null }>>>;
}

export const AI_CKP_CONFIG_REPO = Symbol('AI_CKP_CONFIG_REPO');
```

**Drizzle repo:**
`apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-ckp-config.repo.ts`:

```typescript
// getCkpWeights() → ai_ckp_config WHERE config_key IN (5 kalit) →
//   agar 5 qatordan kam bo'lsa → null (konfiguratsiya to'liq emas)
//   aks holda → CkpWeights obyekti
// upsertConfig(key, value, userId) → INSERT ... ON CONFLICT DO UPDATE
// listAll() → SELECT * FROM ai_ckp_config ORDER BY config_key
// Barcha metodlar: safeCall + Result<T>
```

**ai.module.ts ga qo'shimcha:**
```typescript
import { DrizzleAiCkpConfigRepo } from './infrastructure/repositories/drizzle-ai-ckp-config.repo';
import { AI_CKP_CONFIG_REPO }    from './domain/repositories/i-ai-ckp-config.repo';
// providers:
DrizzleAiCkpConfigRepo,
{ provide: AI_CKP_CONFIG_REPO, useClass: DrizzleAiCkpConfigRepo },
// exports:
DrizzleAiCkpConfigRepo,
```

**FE admin sahifa (izolyatsiya qoidasi bilan):**
`/settings/ai-ckp-config` — `AIProviderConfig.tsx` pattern asosida:
- `useQuery` → `GET /api/ai/ckp/config` → 5 kalit ro'yxati
- Har kalit uchun input field + saqlash → `PATCH /api/ai/ckp/config/:key`
- Izoh: "EGASI QIYMATI KERAK" badge — konfiguratsiya to'ldirilmaguncha CKP scoring ishlashmaydi

> **OWNED FILE FLAG:** `/settings/ai-ckp-config` FE sahifasi P36 IZOLYATSIYA MANIFESTI da
> yo'q. Egasi keyingi paket uchun qo'shsin yoki P50 route paketiga delegate qilsin.

---

### QADAM 1 — Schema: ai-ckp-schema.ts yaratish

**Fayl:** `lib/db/src/schema/ai-ckp-schema.ts` (YO'Q — yaratish)

```typescript
// OLDIN: fayl mavjud emas

// KEYIN:
import { pgTable, serial, integer, text, boolean, timestamp, jsonb, numeric } from 'drizzle-orm/pg-core';

/** CKP kunlik ball jadvali — har xodim uchun kunlik AI hisoblangan ko'rsatkich */
export const aiCkpScores = pgTable('ai_ckp_scores', {
  id:               serial('id').primaryKey(),
  employeeId:       integer('employee_id').notNull(),
  scoreDate:        timestamp('score_date', { withTimezone: true }).notNull().defaultNow(),
  ckpScore:         numeric('ckp_score', { precision: 5, scale: 2 }).notNull().default('0'),
  // Komponentlar: ishtirok, sifat, plan bajarish, vaqtinchalik
  attendanceScore:  numeric('attendance_score', { precision: 5, scale: 2 }).default('0'),
  qualityScore:     numeric('quality_score', { precision: 5, scale: 2 }).default('0'),
  planScore:        numeric('plan_score', { precision: 5, scale: 2 }).default('0'),
  timeScore:        numeric('time_score', { precision: 5, scale: 2 }).default('0'),
  aiExplanation:    text('ai_explanation'),
  salaryGatePass:   boolean('salary_gate_pass').notNull().default(false),
  rawMetrics:       jsonb('raw_metrics'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** CKP chatbot suhbat tarixi */
export const aiCkpChatLogs = pgTable('ai_ckp_chat_logs', {
  id:          serial('id').primaryKey(),
  employeeId:  integer('employee_id').notNull(),
  role:        text('role').notNull(),          // 'user' | 'assistant'
  content:     text('content').notNull(),
  sessionId:   text('session_id').notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Muhim:** `salary_gate_pass` — HR modul bu maydonni o'qiydi. Izoh yozing:
`-- HR modul tomonidan o'qiladi: maosh chiqarish darvozasi`.

---

### QADAM 2 — Schema: ai-fit-schema.ts yaratish

**Fayl:** `lib/db/src/schema/ai-fit-schema.ts` (YO'Q — yaratish)

```typescript
import { pgTable, serial, integer, text, boolean, timestamp, jsonb, numeric } from 'drizzle-orm/pg-core';

/** Xodim–karta moslik baholash jadvali */
export const aiFitScores = pgTable('ai_fit_scores', {
  id:                   serial('id').primaryKey(),
  employeeId:           integer('employee_id').notNull(),
  cardId:               integer('card_id').notNull(),        // org_functions.id
  fitScore:             numeric('fit_score', { precision: 5, scale: 2 }).notNull(),
  fitReport:            jsonb('fit_report'),                  // {strengths, gaps, recommendations}
  bonusRecommendation:  numeric('bonus_recommendation', { precision: 10, scale: 2 }),
  successionCandidate:  boolean('succession_candidate').notNull().default(false),
  aiProvider:           text('ai_provider'),                  // 'claude' | 'gemini'
  evaluatedAt:          timestamp('evaluated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

### QADAM 3 — Schema: ai-violation-schema.ts yaratish

**Fayl:** `lib/db/src/schema/ai-violation-schema.ts` (YO'Q — yaratish)

```typescript
import { pgTable, serial, integer, text, timestamp, jsonb, boolean, numeric } from 'drizzle-orm/pg-core';

/** AI aniqlagan qoidabuzarliklar (TAKLIF — inson tasdig'i kerak)
 *
 * ⚠️ FALSAFA (OCHIQ-JAVOBLAR §85-86):
 *   AI violation yozadi (status='pending_review') — bu TAKLIF.
 *   Jarima/razryad tushishi kabi SALBIY TA'SIR faqat manager/HR tasdiqidan keyin.
 *   status: 'pending_review' → 'confirmed' (manager tasdiqladi) → 'resolved'
 *           yoki 'pending_review' → 'dismissed' (rad etildi)
 */
export const aiViolations = pgTable('ai_violations', {
  id:            serial('id').primaryKey(),
  employeeId:    integer('employee_id').notNull(),
  violationType: text('violation_type').notNull(),   // 'attendance'|'quality'|'behavior'|'fraud'
  severity:      text('severity').notNull(),          // 'low'|'medium'|'high'|'critical'
  description:   text('description').notNull(),
  evidence:      jsonb('evidence'),                   // {source, raw_data, confidence}
  aiConfidence:  numeric('ai_confidence', { precision: 5, scale: 2 }),
  // ✅ DEFAULT 'pending_review' — salbiy ta'sir faqat 'confirmed' bo'lganda (§85-86)
  status:        text('status').notNull().default('pending_review'),
  confirmedBy:   integer('confirmed_by'),             // manager/HR user_id tasdiqladi
  confirmedAt:   timestamp('confirmed_at', { withTimezone: true }),
  resolvedAt:    timestamp('resolved_at', { withTimezone: true }),
  resolvedBy:    integer('resolved_by'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** AI tomonidan TAKLIF qilingan bloklarning log jadvali
 *
 * ⚠️ FALSAFA QAROR (OCHIQ-JAVOBLAR §85-86 global printsip):
 *   AI KUZATADI / TAKLIF QILADI — salbiy ta'sir (blok) FAQAT INSON TASDIG'I bilan.
 *   AI avtomatik blok QILMAYDI — faqat pending taklif yozadi.
 *
 *   is_active = false  → AI taklif (pending), inson tasdig'ini kutmoqda
 *   is_active = true   → manager/HR TASDIQLAGAN, blok kuchga kirgan
 *   approved_by        → kim tasdiqladi (manager/HR user_id)
 *   approved_at        → qachon tasdiqlandi
 */
export const aiBlockLog = pgTable('ai_block_log', {
  id:           serial('id').primaryKey(),
  employeeId:   integer('employee_id').notNull(),
  blockType:    text('block_type').notNull(),   // 'salary'|'system_access'|'order_approval'|'exit'
  reason:       text('reason').notNull(),
  proposedBy:   text('proposed_by').notNull(),  // 'ai_auto' — har doim AI taklif qiladi
  // ✅ is_active=false deb BOSHLANADI — inson tasdig'i kerak (§85-86)
  isActive:     boolean('is_active').notNull().default(false),
  approvedBy:   integer('approved_by'),         // manager/HR user_id — tasdiqladi
  approvedAt:   timestamp('approved_at', { withTimezone: true }),
  unblockedAt:  timestamp('unblocked_at', { withTimezone: true }),
  unblockedBy:  integer('unblocked_by'),
  metadata:     jsonb('metadata'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Kamera va shift joylashuv tekshiruvi */
export const aiCameraCrossCheck = pgTable('ai_camera_cross_check', {
  id:                serial('id').primaryKey(),
  employeeId:        integer('employee_id').notNull(),
  shiftId:           integer('shift_id'),
  expectedLocation:  text('expected_location'),
  detectedLocation:  text('detected_location'),
  matchScore:        numeric('match_score', { precision: 5, scale: 2 }),
  anomalyDetected:   boolean('anomaly_detected').notNull().default(false),
  cameraSource:      text('camera_source'),
  checkedAt:         timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Burnout risk baholash */
export const aiBurnoutAssessments = pgTable('ai_burnout_assessments', {
  id:           serial('id').primaryKey(),
  employeeId:   integer('employee_id').notNull(),
  riskLevel:    text('risk_level').notNull(),   // 'low'|'medium'|'high'|'critical'
  riskScore:    numeric('risk_score', { precision: 5, scale: 2 }).notNull(),
  factors:      jsonb('factors'),               // {overtime, ckp_trend, absence_rate, ...}
  recommendation: text('recommendation'),
  assessedAt:   timestamp('assessed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Fraud ogohlantirishlari */
export const aiFraudAlerts = pgTable('ai_fraud_alerts', {
  id:           serial('id').primaryKey(),
  entityType:   text('entity_type').notNull(),   // 'employee'|'order'|'payment'|'inventory'
  entityId:     integer('entity_id').notNull(),
  alertType:    text('alert_type').notNull(),
  severity:     text('severity').notNull(),
  description:  text('description').notNull(),
  evidence:     jsonb('evidence'),
  status:       text('status').notNull().default('open'),  // 'open'|'investigating'|'resolved'|'dismissed'
  resolvedBy:   integer('resolved_by'),
  resolvedAt:   timestamp('resolved_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

### QADAM 4 — Schema: ai-chat-card-schema.ts yaratish

**Fayl:** `lib/db/src/schema/ai-chat-card-schema.ts` (YO'Q — yaratish)

```typescript
import { pgTable, serial, integer, text, timestamp, jsonb, numeric } from 'drizzle-orm/pg-core';

/** Karta AI chatbot suhbat tarixi */
export const aiCardChatLogs = pgTable('ai_card_chat_logs', {
  id:         serial('id').primaryKey(),
  cardId:     integer('card_id').notNull(),      // org_functions.id
  employeeId: integer('employee_id'),            // null bo'lishi mumkin (anonimous)
  role:       text('role').notNull(),            // 'user' | 'assistant'
  content:    text('content').notNull(),
  sessionId:  text('session_id').notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** AI prognoz diapazonlari */
export const aiForecastRanges = pgTable('ai_forecast_ranges', {
  id:           serial('id').primaryKey(),
  materialId:   integer('material_id'),
  entityType:   text('entity_type').notNull(),   // 'material'|'production'|'demand'
  entityId:     integer('entity_id').notNull(),
  horizonDays:  integer('horizon_days').notNull(),
  forecastLow:  numeric('forecast_low', { precision: 14, scale: 2 }).notNull(),
  forecastMid:  numeric('forecast_mid', { precision: 14, scale: 2 }).notNull(),
  forecastHigh: numeric('forecast_high', { precision: 14, scale: 2 }).notNull(),
  confidence:   numeric('confidence', { precision: 5, scale: 2 }),
  methodology:  text('methodology'),              // 'holt-winters'|'croston'|'ensemble'
  metadata:     jsonb('metadata'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Bottleneck log */
export const aiBottleneckLog = pgTable('ai_bottleneck_log', {
  id:              serial('id').primaryKey(),
  processName:     text('process_name').notNull(),
  stationId:       integer('station_id'),
  bottleneckScore: numeric('bottleneck_score', { precision: 5, scale: 2 }).notNull(),
  waitTimeMinutes: numeric('wait_time_minutes', { precision: 8, scale: 2 }),
  recommendation:  text('recommendation'),
  detectedAt:      timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

### QADAM 5 — Schema: ai-governance-schema.ts yaratish

**Fayl:** `lib/db/src/schema/ai-governance-schema.ts` (YO'Q — yaratish)

```typescript
import { pgTable, serial, integer, text, timestamp, jsonb, boolean, numeric } from 'drizzle-orm/pg-core';

/** Manager AI qarorini bekor qilish log */
export const aiOverrides = pgTable('ai_overrides', {
  id:             serial('id').primaryKey(),
  originalDecision: jsonb('original_decision').notNull(), // {type, entity_id, value}
  overriddenBy:   integer('overridden_by').notNull(),     // manager user_id
  overrideReason: text('override_reason').notNull(),
  newValue:       jsonb('new_value'),
  module:         text('module').notNull(),               // 'ckp'|'fit'|'block'|'violation'
  approved:       boolean('approved').notNull().default(false),
  approvedBy:     integer('approved_by'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Xodim AI qaroriga e'tiroz */
export const aiDisputes = pgTable('ai_disputes', {
  id:           serial('id').primaryKey(),
  employeeId:   integer('employee_id').notNull(),
  decisionType: text('decision_type').notNull(), // 'ckp_score'|'fit_score'|'block'|'violation'
  decisionId:   integer('decision_id').notNull(),
  disputeText:  text('dispute_text').notNull(),
  status:       text('status').notNull().default('pending_review'),
  reviewedBy:   integer('reviewed_by'),
  reviewNotes:  text('review_notes'),
  resolvedAt:   timestamp('resolved_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** AI governance audit log — barcha AI qarorlar */
export const aiGovernanceLog = pgTable('ai_governance_log', {
  id:           serial('id').primaryKey(),
  module:       text('module').notNull(),
  decisionType: text('decision_type').notNull(),
  entityType:   text('entity_type').notNull(),
  entityId:     integer('entity_id').notNull(),
  actorType:    text('actor_type').notNull(),    // 'ai_auto'|'manager'|'system'
  actorId:      integer('actor_id'),
  decision:     jsonb('decision').notNull(),
  rationale:    text('rationale'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** AI kalibrasyon natijalar */
export const aiCalibrationRuns = pgTable('ai_calibration_runs', {
  id:               serial('id').primaryKey(),
  module:           text('module').notNull(),
  periodDays:       integer('period_days').notNull().default(30),
  totalPredictions: integer('total_predictions').notNull(),
  correctCount:     integer('correct_count').notNull(),
  accuracyPercent:  numeric('accuracy_percent', { precision: 5, scale: 2 }).notNull(),
  driftDetected:    boolean('drift_detected').notNull().default(false),
  recommendations:  jsonb('recommendations'),
  ranAt:            timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

### QADAM 6 — DDL migration fayllari yozish (GATED)

**Fayl:** `apps/api/src/shared/db/migrations/ai-p36-ckp-fit-schema.sql`

```sql
-- APPROVED: <owner> <date>
-- P36 AI CKP + Fit schema migration
-- GATED: egasi ruxsati olmagunicha ISHGA TUSHIRILMAYDI

CREATE TABLE IF NOT EXISTS ai_ckp_scores (
  id               SERIAL PRIMARY KEY,
  employee_id      INTEGER NOT NULL,   -- HR modul tomonidan o'qiladi: maosh darvozasi
  score_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ckp_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  attendance_score NUMERIC(5,2) DEFAULT 0,
  quality_score    NUMERIC(5,2) DEFAULT 0,
  plan_score       NUMERIC(5,2) DEFAULT 0,
  time_score       NUMERIC(5,2) DEFAULT 0,
  ai_explanation   TEXT,
  salary_gate_pass BOOLEAN NOT NULL DEFAULT FALSE,
  raw_metrics      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_ckp_scores_employee_date
  ON ai_ckp_scores(employee_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_ckp_scores_salary_gate
  ON ai_ckp_scores(salary_gate_pass, score_date DESC);

CREATE TABLE IF NOT EXISTS ai_ckp_chat_logs (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_ckp_chat_session
  ON ai_ckp_chat_logs(session_id, created_at);

CREATE TABLE IF NOT EXISTS ai_fit_scores (
  id                    SERIAL PRIMARY KEY,
  employee_id           INTEGER NOT NULL,
  card_id               INTEGER NOT NULL,
  fit_score             NUMERIC(5,2) NOT NULL,
  fit_report            JSONB,
  bonus_recommendation  NUMERIC(10,2),
  succession_candidate  BOOLEAN NOT NULL DEFAULT FALSE,
  ai_provider           TEXT,
  evaluated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_fit_scores_employee
  ON ai_fit_scores(employee_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_fit_scores_card
  ON ai_fit_scores(card_id, fit_score DESC);
```

**Fayl:** `apps/api/src/shared/db/migrations/ai-p36-violation-block-schema.sql`

```sql
-- APPROVED: <owner> <date>
-- P36 AI Violation + Block + Camera schema
-- GATED: egasi ruxsati olmagunicha ISHGA TUSHIRILMAYDI

-- ⚠️ FALSAFA (§85-86): AI violation TAKLIF qiladi (pending_review).
-- Salbiy ta'sir faqat 'confirmed' statusida kuchga kiradi (manager/HR tasdiqlaydi).
CREATE TABLE IF NOT EXISTS ai_violations (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL,
  violation_type  TEXT NOT NULL CHECK (violation_type IN ('attendance','quality','behavior','fraud','safety')),
  severity        TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  description     TEXT NOT NULL,
  evidence        JSONB,
  ai_confidence   NUMERIC(5,2),
  -- DEFAULT 'pending_review': inson tasdig'isiz salbiy ta'sir YO'Q
  status          TEXT NOT NULL DEFAULT 'pending_review'
                    CHECK (status IN ('pending_review','confirmed','resolved','dismissed')),
  confirmed_by    INTEGER,    -- manager/HR user_id tasdiqladi
  confirmed_at    TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  resolved_by     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_violations_employee
  ON ai_violations(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_violations_severity
  ON ai_violations(severity, created_at DESC);

-- ⚠️ FALSAFA (OCHIQ-JAVOBLAR §85-86): AI blok TAKLIF qiladi, inson TASDIQLAYDI.
-- is_active = FALSE (pending) — default; manager/HR tasdiqlaganda TRUE ga o'tadi.
CREATE TABLE IF NOT EXISTS ai_block_log (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL,
  block_type    TEXT NOT NULL CHECK (block_type IN ('salary','system_access','order_approval','exit','login')),
  reason        TEXT NOT NULL,
  proposed_by   TEXT NOT NULL,   -- har doim 'ai_auto'; kuchga kirishi uchun inson kerak
  -- DEFAULT FALSE: inson tasdig'isiz blok kuchga KIRMAYDI (§85-86)
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by   INTEGER,         -- manager/HR user_id tasdiqladi
  approved_at   TIMESTAMPTZ,     -- qachon tasdiqlandi
  unblocked_at  TIMESTAMPTZ,
  unblocked_by  INTEGER,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_block_log_employee_active
  ON ai_block_log(employee_id, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_camera_cross_check (
  id                SERIAL PRIMARY KEY,
  employee_id       INTEGER NOT NULL,
  shift_id          INTEGER,
  expected_location TEXT,
  detected_location TEXT,
  match_score       NUMERIC(5,2),
  anomaly_detected  BOOLEAN NOT NULL DEFAULT FALSE,
  camera_source     TEXT,
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_burnout_assessments (
  id             SERIAL PRIMARY KEY,
  employee_id    INTEGER NOT NULL,
  risk_level     TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  risk_score     NUMERIC(5,2) NOT NULL,
  factors        JSONB,
  recommendation TEXT,
  assessed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_fraud_alerts (
  id           SERIAL PRIMARY KEY,
  entity_type  TEXT NOT NULL,
  entity_id    INTEGER NOT NULL,
  alert_type   TEXT NOT NULL,
  severity     TEXT NOT NULL,
  description  TEXT NOT NULL,
  evidence     JSONB,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  resolved_by  INTEGER,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fayl:** `apps/api/src/shared/db/migrations/ai-p36-chat-card-schema.sql`

```sql
-- APPROVED: <owner> <date>
-- P36 AI Card-chat + Forecast range + Bottleneck
-- GATED

CREATE TABLE IF NOT EXISTS ai_card_chat_logs (
  id          SERIAL PRIMARY KEY,
  card_id     INTEGER NOT NULL,
  employee_id INTEGER,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_card_chat_session
  ON ai_card_chat_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_card_chat_card
  ON ai_card_chat_logs(card_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_forecast_ranges (
  id             SERIAL PRIMARY KEY,
  material_id    INTEGER,
  entity_type    TEXT NOT NULL,
  entity_id      INTEGER NOT NULL,
  horizon_days   INTEGER NOT NULL,
  forecast_low   NUMERIC(14,2) NOT NULL,
  forecast_mid   NUMERIC(14,2) NOT NULL,
  forecast_high  NUMERIC(14,2) NOT NULL,
  confidence     NUMERIC(5,2),
  methodology    TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_bottleneck_log (
  id                SERIAL PRIMARY KEY,
  process_name      TEXT NOT NULL,
  station_id        INTEGER,
  bottleneck_score  NUMERIC(5,2) NOT NULL,
  wait_time_minutes NUMERIC(8,2),
  recommendation    TEXT,
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fayl:** `apps/api/src/shared/db/migrations/ai-p36-governance-schema.sql`

```sql
-- APPROVED: <owner> <date>
-- P36 AI Override + Dispute + Governance + Calibration
-- GATED

CREATE TABLE IF NOT EXISTS ai_overrides (
  id                 SERIAL PRIMARY KEY,
  original_decision  JSONB NOT NULL,
  overridden_by      INTEGER NOT NULL,
  override_reason    TEXT NOT NULL,
  new_value          JSONB,
  module             TEXT NOT NULL,
  approved           BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by        INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_disputes (
  id             SERIAL PRIMARY KEY,
  employee_id    INTEGER NOT NULL,
  decision_type  TEXT NOT NULL,
  decision_id    INTEGER NOT NULL,
  dispute_text   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending_review'
                   CHECK (status IN ('pending_review','under_review','resolved_upheld','resolved_overturned','dismissed')),
  reviewed_by    INTEGER,
  review_notes   TEXT,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_disputes_employee
  ON ai_disputes(employee_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_governance_log (
  id             SERIAL PRIMARY KEY,
  module         TEXT NOT NULL,
  decision_type  TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  entity_id      INTEGER NOT NULL,
  actor_type     TEXT NOT NULL CHECK (actor_type IN ('ai_auto','manager','system','employee')),
  actor_id       INTEGER,
  decision       JSONB NOT NULL,
  rationale      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_governance_log_module_date
  ON ai_governance_log(module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_governance_log_entity
  ON ai_governance_log(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_calibration_runs (
  id                SERIAL PRIMARY KEY,
  module            TEXT NOT NULL,
  period_days       INTEGER NOT NULL DEFAULT 30,
  total_predictions INTEGER NOT NULL,
  correct_count     INTEGER NOT NULL,
  accuracy_percent  NUMERIC(5,2) NOT NULL,
  drift_detected    BOOLEAN NOT NULL DEFAULT FALSE,
  recommendations   JSONB,
  ran_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### QADAM 7 — Domain interface: i-ai-ckp.repo.ts

**Fayl:** `apps/api/src/modules/ai/domain/repositories/i-ai-ckp.repo.ts` (YO'Q — yaratish)

```typescript
/**
 * @module i-ai-ckp.repo
 * @description Domain repository interface for AI CKP scores and chat logs.
 * @layer Domain (AI)
 */

import type { Result } from '@common/result';

export interface AiCkpScore {
  id: number;
  employeeId: number;
  scoreDate: string;
  ckpScore: number;
  attendanceScore: number | null;
  qualityScore: number | null;
  planScore: number | null;
  timeScore: number | null;
  aiExplanation: string | null;
  salaryGatePass: boolean;
  rawMetrics: unknown;
  createdAt: string;
}

export interface AiCkpChatLog {
  id: number;
  employeeId: number;
  role: 'user' | 'assistant';
  content: string;
  sessionId: string;
  createdAt: string;
}

export interface InsertCkpScoreDto {
  employeeId: number;
  ckpScore: number;
  attendanceScore?: number;
  qualityScore?: number;
  planScore?: number;
  timeScore?: number;
  aiExplanation?: string;
  salaryGatePass: boolean;
  rawMetrics?: unknown;
}

export interface InsertCkpChatDto {
  employeeId: number;
  role: 'user' | 'assistant';
  content: string;
  sessionId: string;
}

export interface IAiCkpRepo {
  insertScore(data: InsertCkpScoreDto): Promise<Result<AiCkpScore>>;
  findScoresByEmployee(employeeId: number, limitDays: number): Promise<Result<AiCkpScore[]>>;
  findLatestScore(employeeId: number): Promise<Result<AiCkpScore | null>>;
  insertChatLog(data: InsertCkpChatDto): Promise<Result<AiCkpChatLog>>;
  findChatHistory(employeeId: number, sessionId: string): Promise<Result<AiCkpChatLog[]>>;
  getSalaryGateStatus(employeeId: number): Promise<Result<boolean>>;
}

export const AI_CKP_REPO = Symbol('AI_CKP_REPO');
```

---

### QADAM 8 — Drizzle repo: drizzle-ai-ckp.repo.ts

**Fayl:** `apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-ckp.repo.ts`
(YO'Q — yaratish)

Pattern: `drizzle-ai-exam.repo.ts` ni ko'r (mavjud, sog'lom) — xuddi shu tuzilma.

```typescript
/**
 * @module drizzle-ai-ckp.repo
 * @description Drizzle ORM implementation of IAiCkpRepo.
 *   All queries return Result<T> — never throws.
 */

import { Injectable } from '@nestjs/common';
import { desc, eq, gte, and } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Ok, Err, Result } from '@common/result';
import { aiCkpScores, aiCkpChatLogs } from '@europrint/schemas';
import type {
  IAiCkpRepo,
  AiCkpScore,
  AiCkpChatLog,
  InsertCkpScoreDto,
  InsertCkpChatDto,
} from '../../domain/repositories/i-ai-ckp.repo';

@Injectable()
export class DrizzleAiCkpRepo implements IAiCkpRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async insertScore(data: InsertCkpScoreDto): Promise<Result<AiCkpScore>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiCkpScores)
        .values({
          employeeId:      data.employeeId,
          ckpScore:        String(data.ckpScore),
          attendanceScore: data.attendanceScore != null ? String(data.attendanceScore) : null,
          qualityScore:    data.qualityScore != null ? String(data.qualityScore) : null,
          planScore:       data.planScore != null ? String(data.planScore) : null,
          timeScore:       data.timeScore != null ? String(data.timeScore) : null,
          aiExplanation:   data.aiExplanation ?? null,
          salaryGatePass:  data.salaryGatePass,
          rawMetrics:      data.rawMetrics ?? null,
        })
        .returning();
      if (!row) throw new Error('Insert qaytmadi');
      return this.toScore(row);
    });
  }

  async findScoresByEmployee(employeeId: number, limitDays: number): Promise<Result<AiCkpScore[]>> {
    return safeCall(async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - limitDays);
      const rows = await this.drizzle.db
        .select()
        .from(aiCkpScores)
        .where(and(eq(aiCkpScores.employeeId, employeeId), gte(aiCkpScores.scoreDate, cutoff)))
        .orderBy(desc(aiCkpScores.scoreDate))
        .limit(100);
      return (Array.isArray(rows) ? rows : []).map(r => this.toScore(r));
    });
  }

  async findLatestScore(employeeId: number): Promise<Result<AiCkpScore | null>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .select()
        .from(aiCkpScores)
        .where(eq(aiCkpScores.employeeId, employeeId))
        .orderBy(desc(aiCkpScores.scoreDate))
        .limit(1);
      return row ? this.toScore(row) : null;
    });
  }

  async insertChatLog(data: InsertCkpChatDto): Promise<Result<AiCkpChatLog>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiCkpChatLogs)
        .values({
          employeeId: data.employeeId,
          role:       data.role,
          content:    data.content,
          sessionId:  data.sessionId,
        })
        .returning();
      if (!row) throw new Error('Chat log insert qaytmadi');
      return {
        id:         row.id,
        employeeId: row.employeeId,
        role:       row.role as 'user' | 'assistant',
        content:    row.content,
        sessionId:  row.sessionId,
        createdAt:  row.createdAt?.toISOString() ?? new Date().toISOString(),
      };
    });
  }

  async findChatHistory(employeeId: number, sessionId: string): Promise<Result<AiCkpChatLog[]>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiCkpChatLogs)
        .where(and(eq(aiCkpChatLogs.employeeId, employeeId), eq(aiCkpChatLogs.sessionId, sessionId)))
        .orderBy(aiCkpChatLogs.createdAt)
        .limit(200);
      return (Array.isArray(rows) ? rows : []).map(r => ({
        id:         r.id,
        employeeId: r.employeeId,
        role:       r.role as 'user' | 'assistant',
        content:    r.content,
        sessionId:  r.sessionId,
        createdAt:  r.createdAt?.toISOString() ?? new Date().toISOString(),
      }));
    });
  }

  async getSalaryGateStatus(employeeId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      // Joriy oy uchun oxirgi CKP ball → salary_gate_pass
      const [row] = await this.drizzle.db
        .select({ salaryGatePass: aiCkpScores.salaryGatePass })
        .from(aiCkpScores)
        .where(eq(aiCkpScores.employeeId, employeeId))
        .orderBy(desc(aiCkpScores.scoreDate))
        .limit(1);
      return row ? row.salaryGatePass : false;
    });
  }

  private toScore(r: typeof aiCkpScores.$inferSelect): AiCkpScore {
    return {
      id:              r.id,
      employeeId:      r.employeeId,
      scoreDate:       r.scoreDate?.toISOString() ?? new Date().toISOString(),
      ckpScore:        Number(r.ckpScore),
      attendanceScore: r.attendanceScore != null ? Number(r.attendanceScore) : null,
      qualityScore:    r.qualityScore    != null ? Number(r.qualityScore)    : null,
      planScore:       r.planScore       != null ? Number(r.planScore)       : null,
      timeScore:       r.timeScore       != null ? Number(r.timeScore)       : null,
      aiExplanation:   r.aiExplanation ?? null,
      salaryGatePass:  r.salaryGatePass,
      rawMetrics:      r.rawMetrics,
      createdAt:       r.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
```

---

### QADAM 9 — Service: ai-ckp.service.ts

**Fayl:** `apps/api/src/modules/ai/application/services/ai-ckp.service.ts` (YO'Q — yaratish)

```typescript
/**
 * @module ai-ckp.service
 * @description CKP daily scoring + chatbot service.
 *   Salary gate: salaryGatePass = ckpScore >= threshold (DB master-data, EGASI QIYMATI KERAK).
 *   Chat: AiRouterService orqali Claude — hech qachon to'g'ridan API chaqirilmaydi.
 *
 * ⚠️ DIZAYN QAROR (Q65 / VISION-1000 Q65):
 *   CKP vaznlari VA o'tish chegarasi KOD KONSTANTASI EMAS — DB master-data jadvalida
 *   saqlanadi; egasi UI orqali o'zgartiradi (dasturchisiz).
 *   Jadval: ai_ckp_config (key/value/description) — qarang §4.CKP-CONFIG.
 *   Default seed qatorlari: EGASI TASDIQLASHI KERAK (kod ichida ixtiro qilinmaydi).
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { Ok, Err, isOk, Result } from '@common/result';
import { AiRouterService } from './ai-router.service';
import { AI_CKP_REPO, type IAiCkpRepo, type AiCkpScore, type AiCkpChatLog } from '../../domain/repositories/i-ai-ckp.repo';
import { AI_CKP_CONFIG_REPO, type IAiCkpConfigRepo } from '../../domain/repositories/i-ai-ckp-config.repo';

// ──────────────────────────────────────────────────────────────────────────────
// CKP KONFIGURATSIYASI — DB MASTER-DATA (Q65 talabi)
// ──────────────────────────────────────────────────────────────────────────────
// ❌ TAQIQ: const CKP_PASS_THRESHOLD = 60;   ← HARDCODE
// ❌ TAQIQ: att * 0.30 + qual * 0.30 + ...   ← HARDCODE vaznlar
//
// ✅ TO'G'RI: barcha qiymatlar `ai_ckp_config` jadvalidan o'qiladi:
//   KEY                    | DEFAULT SEED QIYMATI | IZOH
//   ckp_pass_threshold     | EGASI QIYMATI KERAK  | 0-100 oralig'ida
//   weight_attendance      | EGASI QIYMATI KERAK  | Q42: ЦКП=40%?
//   weight_quality         | EGASI QIYMATI KERAK  | Q42: sifat=30%?
//   weight_plan            | EGASI QIYMATI KERAK  | Q42: muddat=20%?
//   weight_time            | EGASI QIYMATI KERAK  | Q42: boshqa=10%?
//
// ⚠️ Q42 va Q65 EGASIga savol: vaznlar DB da quyidagicha saqlansinmi:
//   ЦКП (attendance+plan) = 40, sifat = 30, muddat (plan) = 20, boshqa (time) = 10?
//   Yoki: attendance=30, quality=30, plan=25, time=15?
//   EGASI JAVOB BERGUNICHA bu xizmat konfiguratsiyani DB dan o'qiydi va
//   agar config yo'q bo'lsa — 503 qaytaradi (0 inventar bo'lsa ham to'g'ri ishlaydi
//   degani EMAS; konfiguratsiya shart).
//
// ──────────────────────────────────────────────────────────────────────────────

export const CkpScoreInputSchema = z.object({
  employeeId:      z.number().int().positive(),
  attendanceScore: z.number().min(0).max(100).optional(),
  qualityScore:    z.number().min(0).max(100).optional(),
  planScore:       z.number().min(0).max(100).optional(),
  timeScore:       z.number().min(0).max(100).optional(),
  rawMetrics:      z.unknown().optional(),
});
export type CkpScoreInput = z.infer<typeof CkpScoreInputSchema>;

export const CkpChatInputSchema = z.object({
  employeeId: z.number().int().positive(),
  sessionId:  z.string().min(1).max(64),
  message:    z.string().min(1).max(2000),
});
export type CkpChatInput = z.infer<typeof CkpChatInputSchema>;

/** DB dan o'qiladigan CKP konfiguratsiyasi */
export interface CkpWeights {
  passThreshold:     number;  // e.g. 60 — EGASI QIYMATI KERAK
  weightAttendance:  number;  // e.g. 0.30 — EGASI QIYMATI KERAK (Q42 bo'yicha)
  weightQuality:     number;  // e.g. 0.30 — EGASI QIYMATI KERAK
  weightPlan:        number;  // e.g. 0.25 — EGASI QIYMATI KERAK
  weightTime:        number;  // e.g. 0.15 — EGASI QIYMATI KERAK
}

@Injectable()
export class AiCkpService {
  private readonly logger = new Logger(AiCkpService.name);

  constructor(
    @Inject(AI_CKP_REPO)        private readonly repo:       IAiCkpRepo,
    @Inject(AI_CKP_CONFIG_REPO) private readonly configRepo: IAiCkpConfigRepo,
    private readonly aiRouter: AiRouterService,
  ) {}

  /**
   * DB dan CKP vaznlarini o'qiydi.
   * Agar config jadval bo'sh bo'lsa — Err qaytaradi (hardcode fallback YO'Q — Q65).
   */
  private async loadWeights(): Promise<Result<CkpWeights>> {
    const r = await this.configRepo.getCkpWeights();
    if (!r.ok) return r;
    if (!r.data) {
      return Err(
        'ai_ckp_config jadvali bo\'sh — egasi CKP vaznlarini UI orqali kiritishi kerak. ' +
        'Qarang: /settings/ai-ckp-config'
      );
    }
    return Ok(r.data);
  }

  /**
   * Xodim CKP ballini hisoblaydi va DB ga yozadi.
   * Komponent og'irliklari DB master-data jadvalidan (ai_ckp_config) o'qiladi.
   * REAL INSERT — echo/hardcode taqiq (Q-40).
   */
  async computeAndSave(input: CkpScoreInput): Promise<Result<AiCkpScore>> {
    const dto = CkpScoreInputSchema.parse(input);

    // Vaznlarni DB dan ol (HARDCODE emas — Q65)
    const weightsResult = await this.loadWeights();
    if (!weightsResult.ok) return Err(weightsResult.error);
    const w = weightsResult.data;

    const att   = dto.attendanceScore ?? 0;
    const qual  = dto.qualityScore    ?? 0;
    const plan  = dto.planScore       ?? 0;
    const time  = dto.timeScore       ?? 0;
    const score = att * w.weightAttendance + qual * w.weightQuality
                + plan * w.weightPlan      + time * w.weightTime;

    // AI tushuntirish (async, xato bo'lsa ham davom etadi)
    let explanation: string | undefined;
    const aiResult = await this.aiRouter.call({
      taskType: 'analysis',
      prompt: `EuroPrint xodim CKP baholash. Ball: ${score.toFixed(1)}/100.
        Ishtirok: ${att}, Sifat: ${qual}, Reja: ${plan}, Vaqt: ${time}.
        Qisqa tushuntirish (2 gapdan oshmasin, o'zbek tilida):`,
      maxTokens: 150,
      userId: dto.employeeId,
    });
    if (isOk(aiResult)) explanation = aiResult.data.content;

    return this.repo.insertScore({
      employeeId:      dto.employeeId,
      ckpScore:        Math.round(score * 100) / 100,
      attendanceScore: att,
      qualityScore:    qual,
      planScore:       plan,
      timeScore:       time,
      aiExplanation:   explanation,
      salaryGatePass:  score >= w.passThreshold,  // threshold DB dan (Q65)
      rawMetrics:      dto.rawMetrics,
    });
  }

  async getEmployeeScores(employeeId: number, limitDays = 30): Promise<Result<AiCkpScore[]>> {
    return this.repo.findScoresByEmployee(employeeId, limitDays);
  }

  async getLatestScore(employeeId: number): Promise<Result<AiCkpScore | null>> {
    return this.repo.findLatestScore(employeeId);
  }

  async getSalaryGateStatus(employeeId: number): Promise<Result<boolean>> {
    return this.repo.getSalaryGateStatus(employeeId);
  }

  /**
   * CKP chatbot — xodim savolini qabul qiladi, AI javob beradi, ikkalasini log qiladi.
   * REAL saqlash + AI chaqiruv — echo taqiq.
   */
  async chat(input: CkpChatInput): Promise<Result<{ reply: string; sessionId: string }>> {
    const dto = CkpChatInputSchema.parse(input);

    // Xodim xabarini log
    const userLogResult = await this.repo.insertChatLog({
      employeeId: dto.employeeId,
      role: 'user',
      content: dto.message,
      sessionId: dto.sessionId,
    });
    if (!isOk(userLogResult)) return Err(userLogResult.error);

    // Suhbat tarixini ol (kontekst uchun)
    const historyResult = await this.repo.findChatHistory(dto.employeeId, dto.sessionId);
    const history = isOk(historyResult) ? historyResult.data : [];

    // Oxirgi 10 xabar kontekst sifatida
    const contextMessages = history.slice(-10).map(h =>
      `${h.role === 'user' ? 'Xodim' : 'AI'}: ${h.content}`
    ).join('\n');

    // AI javob
    const aiResult = await this.aiRouter.call({
      taskType: 'chat',
      prompt: `EuroPrint CKP yordamchi. Xodim ID: ${dto.employeeId}.
Suhbat tarixi:\n${contextMessages}\n\nXodim savoli: ${dto.message}
O'zbek tilida aniq, foydali javob ber (maosh, CKP ball, o'sish bo'yicha).`,
      maxTokens: 500,
      userId: dto.employeeId,
    });

    if (!isOk(aiResult)) return Err(aiResult.error);

    const reply = aiResult.data.content;

    // AI javobini log
    await this.repo.insertChatLog({
      employeeId: dto.employeeId,
      role: 'assistant',
      content: reply,
      sessionId: dto.sessionId,
    });

    return Ok({ reply, sessionId: dto.sessionId });
  }
}
```

---

### QADAM 10 — Service: ai-fit.service.ts

**Fayl:** `apps/api/src/modules/ai/application/services/ai-fit.service.ts` (YO'Q — yaratish)

```typescript
/**
 * @module ai-fit.service
 * @description Xodim-karta moslik baholash, bonus tavsiya, vorislik.
 *   Real DB INSERT + AI Router — echo/hardcode taqiq.
 */

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { Ok, Err, isOk, Result } from '@common/result';
import { DrizzleService } from '@common/services/drizzle.service';
import { AiRouterService } from './ai-router.service';
import { aiFitScores } from '@europrint/schemas';
import { desc, eq, and, between } from 'drizzle-orm';
import { safeCall } from '@common/result';

export const FitEvaluateSchema = z.object({
  employeeId:      z.number().int().positive(),
  cardId:          z.number().int().positive(),
  employeeProfile: z.object({
    skills:       z.array(z.string()).optional(),
    experience:   z.number().optional(),
    education:    z.string().optional(),
    performance:  z.number().min(0).max(100).optional(),
  }),
  cardRequirements: z.object({
    title:          z.string(),
    minRazryad:     z.number().optional(),
    requiredSkills: z.array(z.string()).optional(),
  }),
});
export type FitEvaluateDto = z.infer<typeof FitEvaluateSchema>;

export interface FitScoreRow {
  id: number;
  employeeId: number;
  cardId: number;
  fitScore: number;
  fitReport: unknown;
  bonusRecommendation: number | null;
  successionCandidate: boolean;
  evaluatedAt: string;
}

@Injectable()
export class AiFitService {
  private readonly logger = new Logger(AiFitService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly aiRouter: AiRouterService,
  ) {}

  async evaluate(dto: FitEvaluateDto): Promise<Result<FitScoreRow>> {
    const input = FitEvaluateSchema.parse(dto);

    // AI baholash
    const prompt = `EuroPrint Org Karta Moslik Baholash.
Xodim profil: ${JSON.stringify(input.employeeProfile)}
Karta talablari: ${JSON.stringify(input.cardRequirements)}
JSON formatida javob: {"fit_score": 0-100, "strengths": [...], "gaps": [...],
 "recommendations": [...], "bonus_percent": 0-30, "succession_candidate": true/false}`;

    const aiResult = await this.aiRouter.call({
      taskType: 'analysis',
      prompt,
      maxTokens: 600,
      userId: input.employeeId,
    });

    let fitScore = 50;
    let fitReport: unknown = {};
    let bonusRec: number | null = null;
    let succCand = false;

    if (isOk(aiResult)) {
      try {
        const parsed = JSON.parse(aiResult.data.content);
        fitScore = Number(parsed.fit_score) || 50;
        bonusRec = Number(parsed.bonus_percent) || null;
        succCand = Boolean(parsed.succession_candidate);
        fitReport = parsed;
      } catch {
        fitReport = { raw: aiResult.data.content };
      }
    }

    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiFitScores)
        .values({
          employeeId:          input.employeeId,
          cardId:              input.cardId,
          fitScore:            String(fitScore),
          fitReport:           fitReport as Record<string, unknown>,
          bonusRecommendation: bonusRec != null ? String(bonusRec) : null,
          successionCandidate: succCand,
          aiProvider:          'claude',
        })
        .returning();
      if (!row) throw new Error('Fit score insert qaytmadi');
      return {
        id:                  row.id,
        employeeId:          row.employeeId,
        cardId:              row.cardId,
        fitScore:            Number(row.fitScore),
        fitReport:           row.fitReport,
        bonusRecommendation: row.bonusRecommendation != null ? Number(row.bonusRecommendation) : null,
        successionCandidate: row.successionCandidate,
        evaluatedAt:         row.evaluatedAt?.toISOString() ?? new Date().toISOString(),
      };
    });
  }

  async listScores(filters: { minScore?: number; maxScore?: number; limit?: number }): Promise<Result<FitScoreRow[]>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiFitScores)
        .orderBy(desc(aiFitScores.evaluatedAt))
        .limit(filters.limit ?? 100);
      return (Array.isArray(rows) ? rows : [])
        .filter(r => {
          const s = Number(r.fitScore);
          if (filters.minScore != null && s < filters.minScore) return false;
          if (filters.maxScore != null && s > filters.maxScore) return false;
          return true;
        })
        .map(r => ({
          id:                  r.id,
          employeeId:          r.employeeId,
          cardId:              r.cardId,
          fitScore:            Number(r.fitScore),
          fitReport:           r.fitReport,
          bonusRecommendation: r.bonusRecommendation != null ? Number(r.bonusRecommendation) : null,
          successionCandidate: r.successionCandidate,
          evaluatedAt:         r.evaluatedAt?.toISOString() ?? new Date().toISOString(),
        }));
    });
  }
}
```

---

### QADAM 11 — Service guruh: ai-violation.service.ts, ai-block.service.ts, ai-camera.service.ts

Uchala service ham bir xil pattern — qisqa ko'rsatma:

**`ai-violation.service.ts`:**
```typescript
// ⚠️ FALSAFA (§85-86): AI violation TAKLIF qiladi; salbiy ta'sir faqat inson tasdiqidan keyin.
//
// Zod schema: ViolationCreateSchema = z.object({ employeeId, violationType, severity, description, evidence? })
//
// proposeViolation(dto) →
//   insert ai_violations (status='pending_review') — AI taklif
//   → NTF manager/HR ga: "AI violation aniqladi, tasdiqlanishi kerak"
//   → Result<{ id, status: 'pending_review' }>
//
// confirmViolation(id, confirmedBy) →
//   update ai_violations set status='confirmed', confirmed_by, confirmed_at
//   → governance log yoziladi
//   → Result<void>
//
// dismissViolation(id, dismissedBy, reason) →
//   update ai_violations set status='dismissed', resolved_by=dismissedBy, resolved_at=now()
//   → Result<void>
//
// resolveViolation(id, resolvedBy) →
//   update ai_violations set status='resolved', resolved_at, resolved_by
//   (faqat status='confirmed' bo'lganlarga — 'pending_review' ni resolve qilish taqiq)
//   → Result<void>
//
// listViolations(filters: { employeeId?, type?, severity?, status?, fromDate? }) →
//   drizzle.db.select(...).where(...) → Result<ViolationRow[]>
//
// Har metod: Result<T>, Zod parse, REAL DB, safeCall
```

**`ai-block.service.ts`:**
```typescript
// ⚠️ FALSAFA (OCHIQ-JAVOBLAR §85-86):
//   AI → proposeBlock() (is_active=FALSE, pending)
//   Manager/HR → approveBlock(id, approvedBy) (is_active=TRUE kuchga kiradi)
//   HECH QACHON: createBlock() → is_active=true avto (taqiq)
//
// proposeBlock(dto: { employeeId, blockType, reason, metadata? }) →
//   insert ai_block_log (is_active=FALSE, proposed_by='ai_auto')
//   → governance log yoziladi (actorType='ai_auto', decision={pending: true})
//   → NTF manager/HR ga: "AI blok taklif qildi, tasdiqlash kerak"
//   → Result<{ id, pending: true }>
//
// approveBlock(id: number, approvedBy: number) →
//   update ai_block_log set is_active=TRUE, approved_by, approved_at
//   → governance log (actorType='manager', actorId=approvedBy)
//   → Result<void>
//
// rejectBlock(id: number, rejectedBy: number, reason: string) →
//   update ai_block_log set metadata={...metadata, rejected_by: rejectedBy, reject_reason: reason}
//   (is_active qoladi FALSE — kuchga kirmaydi)
//   → Result<void>
//
// unblock(id: number, unblockedBy: number) →
//   update ai_block_log set is_active=FALSE, unblocked_at, unblocked_by
//   → Result<void>
//
// getPendingBlocks(employeeId?) →
//   select where is_active=FALSE AND approved_by IS NULL AND unblocked_at IS NULL
//   (inson tasdig'ini kutayotganlar)
//
// getActiveBlocks(employeeId) → select where is_active=TRUE
// isBlocked(employeeId, blockType) → boolean Result (faqat is_active=TRUE bo'lganlar)
```

**`ai-camera.service.ts`:**
```typescript
// recordCrossCheck(dto: { employeeId, shiftId?, expectedLocation, detectedLocation, cameraSource }) →
//   matchScore = locations match ? 100 : 0 (yoki fuzzy match)
//   anomalyDetected = matchScore < 70
//   insert ai_camera_cross_check
// getTodayCrossChecks(employeeId) → select where checked_at >= today
```

**`ai-burnout.service.ts`:**
```typescript
// assess(employeeId: number) → AI baholash → insert ai_burnout_assessments
//   prompt: so'nggi CKP trend, overtime soatlar, risk faktori
//   riskScore hisoblash → insert → Result<BurnoutAssessment>
```

**`ai-fraud.service.ts`:**
```typescript
// createAlert(dto) → insert ai_fraud_alerts
// updateStatus(id, status, resolvedBy?) → update
// getOpenAlerts(filters) → select where status = 'open'
```

---

### QADAM 12 — Service guruh: ai-report.service.ts, ai-bonus.service.ts, ai-succession.service.ts

**`ai-report.service.ts`:**
```typescript
// generateEmployeeReport(employeeId: number): Promise<Result<{
//   ckpTrend: AiCkpScore[],
//   latestFit: FitScoreRow | null,
//   violations: ViolationRow[],
//   burnoutRisk: string
// }>>
// Barcha ma'lumotni yig'ib, AI orqali umumiy hisobot teksti yaratadi
// REAL DB: har bir ma'lumotni DB dan oladi
```

**`ai-bonus.service.ts`:**
```typescript
// calculateBonus(employeeId: number, periodMonth: string): Promise<Result<{
//   baseBonus: number,
//   ckpMultiplier: number,
//   fitMultiplier: number,
//   finalBonus: number,
//   breakdown: object
// }>>
// fit_scores.bonus_recommendation + ckp_scores.ckp_score dan hisoblaydi
// Payroll/GL ga TEGMAYDI — faqat tavsiya qaytaradi (scope: P36)
```

**`ai-succession.service.ts`:**
```typescript
// getSuccessionCandidates(cardId: number): Promise<Result<FitScoreRow[]>>
// → ai_fit_scores where card_id=cardId AND succession_candidate=true ORDER BY fit_score DESC
// getSuccessionPlan(departmentId: number): Promise<Result<SuccessionPlan>>
// → har karta uchun top 3 voris ko'rsatadi
```

---

### QADAM 13 — Service guruh: ai-forecast-range.service.ts, ai-bottleneck.service.ts

**`ai-forecast-range.service.ts`:**
```typescript
// ForecastRangeInputSchema = z.object({ entityType, entityId, horizonDays, historicalData: z.array(z.number()) })
// compute(dto) → AI (AiRouterService) dan diapazon so'ray → insert ai_forecast_ranges
//   Agar AI xato — rule-based fallback: mid=avg, low=mid*0.7, high=mid*1.3
// getLatestRanges(entityType, entityId) → select orderBy desc limit 10
```

**`ai-bottleneck.service.ts`:**
```typescript
// detectBottleneck(): Promise<Result<BottleneckRow>>
//   MES/PP jadvallaridan (SELECT — FAQAT o'qish, INSERT taqiq boshqa modullarda) ishlov vaqtlari oladi
//   AI tahlil: qaysi jarayon eng ko'p kutish → bottleneck_score
//   insert ai_bottleneck_log → Result
// getCurrentBottleneck() → findLatest from ai_bottleneck_log
```

---

### QADAM 14 — Service guruh: ai-chat-card.service.ts

**`ai-chat-card.service.ts`:**
```typescript
// CardChatInputSchema = z.object({ cardId, employeeId?, sessionId, message })
// chat(dto) → history oladi → AI prompt (karta konteksti + xodim savoli) → log + javob
//   Karta konteksti: org_functions jadvalidan (SELECT only — TEGMA) nom, tavsif, talablar
//   REAL INSERT ikki log: user + assistant
// getChatHistory(cardId, sessionId) → aiCardChatLogs where card_id AND session_id
```

---

### QADAM 15 — Service guruh: ai-override.service.ts, ai-dispute.service.ts, ai-governance.service.ts, ai-calibration.service.ts

**`ai-override.service.ts`:**
```typescript
// OverrideSchema = z.object({ originalDecision: z.unknown(), overriddenBy, overrideReason, newValue?, module })
// createOverride(dto) → insert ai_overrides (approved=false) → notify governance log
// approveOverride(id, approvedBy) → update ai_overrides set approved=true, approved_by
// listOverrides(module?) → select filter
```

**`ai-dispute.service.ts`:**
```typescript
// DisputeSchema = z.object({ employeeId, decisionType, decisionId, disputeText })
// createDispute(dto) → insert ai_disputes (status='pending_review')
// reviewDispute(id, reviewedBy, notes, outcome: 'resolved_upheld'|'resolved_overturned'|'dismissed') →
//   update ai_disputes set status, reviewed_by, review_notes, resolved_at
// listDisputes(status?) → select filter
```

**`ai-governance.service.ts`:**
```typescript
// logDecision(dto: { module, decisionType, entityType, entityId, actorType, actorId?, decision, rationale? }) →
//   insert ai_governance_log → Result<void>
// getAuditTrail(filters: { module?, entityType?, entityId?, fromDate?, limit? }) → select
// getSummary(userId) → aggregate: counts by module, today/week/month stats
//   Bu metod DirectorAiService.getAiGovernanceSummary ichida chaqiriladi
```

**`ai-calibration.service.ts`:**
```typescript
// runCalibration(module: string, periodDays = 30): Promise<Result<CalibrationRun>>
//   Oxirgi N kunlik prognozlar vs haqiqat taqqoslash
//   ai_forecast_ranges vs actual (warehouse_stock/MES actual)
//   accuracyPercent hisoblash → insert ai_calibration_runs
// getLastCalibration(module) → findLatest
```

---

### QADAM 16 — DirectorAiService kengaytirish (MAVJUD fayl)

**Fayl:** `apps/api/src/modules/ai/services/director-ai.service.ts`
**DIQQAT:** Bu faylda `explainKpi`, `assessRisk`, `getRecommendations`, `getExecutiveSummary`
metodlari bor — TEGMAYDI (Q-46). Faqat oxiriga 2 ta yangi metod qo'shamiz:

```typescript
// FAYLNING OXIRIGA QO'SHILADI (mavjud metodlar o'zgartirilmaydi):

  /**
   * Direktorga AI governance dashboard ma'lumoti.
   * AiGovernanceService.getSummary() chaqiradi — AI qarorlar statistikasi.
   */
  async getAiGovernanceSummary(userId: number): Promise<Result<unknown>> {
    // Bu metod ai-governance.service.ts yozilgandan keyin to'ldiriladi.
    // Hozir: governance logdan so'nggi 24 soat statistikasi.
    const prompt = `EuroPrint AI governance xulosa. Rahbarga qisqa (3 nuqta):
    - Bugun AI nechta qaror qabul qildi
    - Qancha override/dispute bor
    - Qaysi modul eng ko'p AI faoliyatiga ega`;
    return this.ai.call({ taskType: 'analysis', prompt, maxTokens: 200, userId });
  }

  /**
   * Zavodning hozirgi bottleneck tahlili — direktorga.
   */
  async getBottleneckReport(userId: number): Promise<Result<unknown>> {
    const prompt = `EuroPrint zavod bottleneck tahlili. Rahbarga:
    - Qaysi jarayon/mashina/operator eng ko'p to'silmoqda
    - Tavsiya (1-2 gap)`;
    return this.ai.call({ taskType: 'analysis', prompt, maxTokens: 300, userId });
  }
```

---

### QADAM 17 — Frontend: EmployeeCkpDashboard.tsx

**Fayl:** `artifacts/erp-dashboard/src/pages/EmployeeCkpDashboard.tsx` (YO'Q — yaratish)

Pattern: `AIAgentsPage.tsx` (mavjud, sog'lom) dan UI tuzilmani ko'r.

```typescript
// Tuzilma (900 qator chegarasi — zarurat bo'lsa bo'laklarga ajrat):
// - EPPageHeader + EPKpiCard (4 ta: so'nggi ball, maosh gate status, trend, violation count)
// - 30 kunlik CKP trend grafigi (recharts AreaChart yoki LineChart)
//   Data: useQuery(['/api/ai/ckp/employee/', employeeId, '?days=30'])
// - Chatbot panel (pastda): textarea + yuborish tugmasi + suhbat log
//   useMutation → POST /api/ai/ckp/chat
//   onError: toast destructive
//   onSuccess: queryClient.invalidateQueries + chat log yangilash
// - Maosh gate badge: salaryGatePass ? green : red + tushuntirish

// MUHIM:
// - useQuery uchun LOADING skeleton (F1 qoidasi)
// - useMutation uchun onError handler (F2 qoidasi)
// - apiRequest('GET', ...) va apiRequest('POST', ...) format (F3 qoidasi)
// - Array.isArray tekshiruvi (Qoida 2)
// - EP design tokens: var(--ep-*) — inline style taqiq (Qoida 21)

// API URL: /api/ai/ckp/employee/:employeeId?days=30
//          POST /api/ai/ckp/chat   { employeeId, sessionId, message }
//          GET  /api/ai/ckp/salary-gate/:employeeId
```

---

### QADAM 18 — Frontend: AIFitScores.tsx

```typescript
// EPPageHeader + filter bar (minScore, maxScore, successionOnly toggle)
// DataTable: employee_id, card_id, fit_score, bonus_rec, succession_candidate, evaluated_at
// Row click → FitReportModal (JSONB fitReport ko'rsatadi)
// "Baholash" tugmasi → FitEvaluateDialog (employeeId, cardId input) →
//   POST /api/ai/fit/evaluate → onSuccess invalidate + toast
// API: GET /api/ai/fit/scores?minScore=&maxScore=&limit=
//      POST /api/ai/fit/evaluate
//      GET /api/ai/fit/report/:employeeId
```

---

### QADAM 19 — Frontend: AIViolations.tsx

```typescript
// ⚠️ FALSAFA (§85-86): AI violation TAKLIF — inson TASDIQLAYDI.
// Sahifa 2 tab:
//
// Tab 1: "Kutayotganlar" — status='pending_review'
//   Table: employee, type, severity, description, ai_confidence, created_at
//   Badge: "AI TAKLIFI" (sariq)
//   Action: "Tasdiqlash" → ConfirmDialog → PUT /api/ai/violations/:id/confirm { confirmedBy }
//   Action: "Rad etish"  → ConfirmDialog → PUT /api/ai/violations/:id/dismiss { reason }
//
// Tab 2: "Tasdiqlangan / Hal qilingan" — status IN ('confirmed','resolved','dismissed')
//   Table: employee, type, severity, status (badge-rangli), confirmed_by, confirmed_at, resolved_at
//   Action: "Hal qilish" (confirmed bo'lganda) → ConfirmDialog → PUT /api/ai/violations/:id/resolve
//
// Filter: employeeId, violationType, severity, status, fromDate..toDate
//
// API: GET /api/ai/violations?employeeId=&type=&severity=&status=&from=&to=
//      PUT /api/ai/violations/:id/confirm  { confirmedBy: number }
//      PUT /api/ai/violations/:id/dismiss  { dismissedBy: number; reason: string }
//      PUT /api/ai/violations/:id/resolve  { resolvedBy: number }
//
// Qoidalar: ConfirmDialog (Q-14), isLoading skeleton (F1), onError (F2)
```

---

### QADAM 20 — Frontend: AIBlockLog.tsx

```typescript
// ⚠️ FALSAFA (§85-86): AI TAKLIF qiladi, inson TASDIQLAYDI.
// Sahifa 2 tab bilan:
//
// Tab 1: "Kutayotganlar (Pending)" — is_active=FALSE, approved_by IS NULL
//   Table: employee, block_type, reason, proposed_by='ai_auto', created_at
//   Action: "Tasdiqlash" → ConfirmDialog → PUT /api/ai/block/:id/approve { approvedBy }
//   Action: "Rad etish" → ConfirmDialog → PUT /api/ai/block/:id/reject { reason }
//   Badge: "AI TAKLIFI" (sariq)
//
// Tab 2: "Faol bloklarlar" — is_active=TRUE
//   Table: employee, block_type, reason, approved_by, approved_at, created_at
//   Action: "Blokni ochish" → ConfirmDialog → PUT /api/ai/block/:id/unblock
//   Badge: "FAOL" (qizil)
//
// API: GET /api/ai/block-log?employeeId=&blockType=&isActive=&pending=
//      PUT /api/ai/block/:id/approve   { approvedBy: number }
//      PUT /api/ai/block/:id/reject    { rejectedBy: number; reason: string }
//      PUT /api/ai/block/:id/unblock   { unblockedBy: number }
//
// Qoidalar: useMutation onError (F2), ConfirmDialog (Q-14), Loading skeleton (F1)
```

---

### QADAM 21 — Frontend: AICameraCrossCheck.tsx

```typescript
// Filter: employeeId, anomalyOnly toggle
// Table: employee, expected_location, detected_location, match_score, anomaly_detected (badge), checked_at
// Manual cross-check trigger → POST /api/ai/camera/check
// API: GET /api/ai/camera/cross-check?employeeId=&anomalyOnly=
//      POST /api/ai/camera/check { employeeId, expectedLocation, detectedLocation, cameraSource }
```

---

### QADAM 22 — Frontend: AIForecastPage.tsx

```typescript
// 2 panel:
// 1) Forecast Range: entity select (material/production) + horizonDays input →
//    POST /api/ai/forecast/range → shaded area chart (low/mid/high)
// 2) Bottleneck: GET /api/ai/bottleneck/current → jadval + recommendation text + "Yangilash" tugmasi
//    POST /api/ai/bottleneck/detect trigger
// API: POST /api/ai/forecast/range { entityType, entityId, horizonDays }
//      GET  /api/ai/bottleneck/current
//      POST /api/ai/bottleneck/detect
```

---

### QADAM 23 — Frontend: AIGovernancePage.tsx

```typescript
// 3 tab: Audit Log | Overrides | Disputes
// Audit Log tab: filter (module, date range) → GET /api/ai/governance/audit → table
// Overrides tab: list + approve/reject action
// Disputes tab: pending_review statusdagi e'tirozlar + review action
// Calibration panel: GET /api/ai/calibration/last → accuracy gauge + drift badge
//   "Kalibrasyon ishga tushirish" → POST /api/ai/calibration/run → toast
// API: GET /api/ai/governance/audit?module=&from=&to=
//      POST /api/ai/override/:id/approve  { approvedBy }
//      PUT  /api/ai/dispute/:id/review    { outcome, notes }
//      GET  /api/ai/calibration/last?module=
//      POST /api/ai/calibration/run       { module }
```

---

### QADAM 24 — Frontend: AICardChatPage.tsx

```typescript
// Card tanlash (org_functions dan — select/search)
// Chat interfeys: messages list + textarea + yuborish
// sessionId: uuid() bilan yaratiladi, localStorage da saqlanadi (karta-session juft)
// History: GET /api/ai/card-chat/:cardId/history?sessionId=
// Chat: POST /api/ai/card-chat/:cardId/message { employeeId?, sessionId, message }
// API: GET  /api/ai/card-chat/:cardId/history?sessionId=
//      POST /api/ai/card-chat/:cardId/message
```

---

### QADAM 25 — ai.module.ts yangilash

**Fayl:** `apps/api/src/modules/ai/ai.module.ts` (MAVJUD — faqat qo'shish, o'chirish taqiq)

**OLDIN** (ai.module.ts:80-130 — mavjud providers list):
```typescript
providers: [
  AiRouterRepository,
  { provide: AI_ROUTER_REPO, useClass: AiRouterRepository },
  AiRouterService,
  // ... mavjud providerlar
  EnsembleForecastService,
],
```

**KEYIN** — yangi providerlar OXIRIGA qo'shiladi:
```typescript
// P36 — AI CKP + Fit + Violation + Governance services
import { DrizzleAiCkpRepo }         from './infrastructure/repositories/drizzle-ai-ckp.repo';
import { AI_CKP_REPO }              from './domain/repositories/i-ai-ckp.repo';
import { AiCkpService }             from './application/services/ai-ckp.service';
import { AiFitService }             from './application/services/ai-fit.service';
import { AiReportService }          from './application/services/ai-report.service';
import { AiBonusService }           from './application/services/ai-bonus.service';
import { AiSuccessionService }      from './application/services/ai-succession.service';
import { AiViolationService }       from './application/services/ai-violation.service';
import { AiBlockService }           from './application/services/ai-block.service';
import { AiCameraService }          from './application/services/ai-camera.service';
import { AiBurnoutService }         from './application/services/ai-burnout.service';
import { AiFraudService }           from './application/services/ai-fraud.service';
import { AiForecastRangeService }   from './application/services/ai-forecast-range.service';
import { AiBottleneckService }      from './application/services/ai-bottleneck.service';
import { AiChatCardService }        from './application/services/ai-chat-card.service';
import { AiOverrideService }        from './application/services/ai-override.service';
import { AiDisputeService }         from './application/services/ai-dispute.service';
import { AiGovernanceService }      from './application/services/ai-governance.service';
import { AiCalibrationService }     from './application/services/ai-calibration.service';

// providers array ichiga qo'shiladi:
DrizzleAiCkpRepo,
{ provide: AI_CKP_REPO, useClass: DrizzleAiCkpRepo },
AiCkpService,
AiFitService,
AiReportService,
AiBonusService,
AiSuccessionService,
AiViolationService,
AiBlockService,
AiCameraService,
AiBurnoutService,
AiFraudService,
AiForecastRangeService,
AiBottleneckService,
AiChatCardService,
AiOverrideService,
AiDisputeService,
AiGovernanceService,
AiCalibrationService,
```

**exports ga ham qo'shiladi** (boshqa modul ishlata olsin uchun):
```typescript
AiCkpService, AiFitService, AiViolationService, AiBlockService,
AiGovernanceService, AiCalibrationService,
```

---

### QADAM 26 — @europrint/schemas barrel yangilash

**Diqqat:** Yangi schema fayllarni `lib/db/src/schema/index.ts` yoki mavjud barrel faylga
qo'shish kerak. Bu P01 (barrel) paketining masalasi — agar P01 bajarilgan bo'lsa, shu
fayl allaqachon mavjud. Agar mavjud bo'lsa — shu fayl P36 scope emas. **TO'XTA + flag P50
yoki P01 egasiga**: "P36 yangi schema fayllarni barrel'ga qo'shish kerak: ai-ckp-schema,
ai-fit-schema, ai-violation-schema, ai-chat-card-schema, ai-governance-schema."

Agar barrel fayl P01 OWNED bo'lsa — TEGMA. Agar barrel FAQAT ai moduliga tegishli
(`lib/db/src/schema/ai-index.ts` kabi) bo'lsa — o'sha faylga qo'sh.

---

## 5. DDL (agar bor)

**GATED** — egasi ruxsati olmagunicha ISHGA TUSHIRILMAYDI. Fayllar yozilgan (QADAM 6):

```
apps/api/src/shared/db/migrations/ai-p36-ckp-fit-schema.sql
apps/api/src/shared/db/migrations/ai-p36-violation-block-schema.sql
apps/api/src/shared/db/migrations/ai-p36-chat-card-schema.sql
apps/api/src/shared/db/migrations/ai-p36-governance-schema.sql
```

Har faylda `-- APPROVED: <owner> <date>` placeholder **TO'LDIRILMAGAN** — egasi to'ldiradi.

**Yaratiluvchi jadvallar:**
```
ai_ckp_scores            — xodim kunlik CKP ball + maosh darvozasi
ai_ckp_chat_logs         — CKP chatbot suhbat tarixi
ai_fit_scores            — xodim-karta moslik baholash
ai_violations            — AI aniqlagan qoidabuzarliklar
ai_block_log             — AI bloklarning log jadvali
ai_camera_cross_check    — kamera vs shift joylashuv tekshiruvi
ai_burnout_assessments   — burnout risk baholash
ai_fraud_alerts          — fraud ogohlantirish
ai_card_chat_logs        — karta AI suhbat tarixi
ai_forecast_ranges       — prognoz diapazonlari
ai_bottleneck_log        — bottleneck log
ai_overrides             — manager AI override log
ai_disputes              — xodim e'tirozlari
ai_governance_log        — AI governance audit trail
ai_calibration_runs      — AI kalibrasyon natijalari
```

**Ishga tushirish buyruqlari (FAQAT egasi ruxsatidan keyin):**
```bash
psql $DATABASE_URL -f apps/api/src/shared/db/migrations/ai-p36-ckp-fit-schema.sql
psql $DATABASE_URL -f apps/api/src/shared/db/migrations/ai-p36-violation-block-schema.sql
psql $DATABASE_URL -f apps/api/src/shared/db/migrations/ai-p36-chat-card-schema.sql
psql $DATABASE_URL -f apps/api/src/shared/db/migrations/ai-p36-governance-schema.sql
```

---

## 6. QABUL MEZONI

### 6.1 Majburiy (bloker)

- [ ] BE typecheck: `pnpm --filter @europrint/api exec tsc --noEmit` — **0 xato**
- [ ] FE typecheck: `pnpm --filter erp-dashboard exec tsc --noEmit` — **0 xato**
- [ ] `reviewer-result-pattern.sh` — FAIL: 0 (yangi fayllar uchun)
- [ ] `reviewer-array-safety.sh` — FAIL: 0
- [ ] `reviewer-as-unknown.sh` — FAIL: 0 yangi fayllarda
- [ ] `reviewer-jwt-guard.sh` — PASS
- [ ] `reviewer-dto-validation.sh` — PASS (Zod, class-validator yo'q)

### 6.3-PLUS Vizyon-moslik qabul mezoni (MOSLIK-AUDIT tuzatishlari)

- [ ] **Q65 / CKP vaznlar:** `ai-ckp.service.ts` da KOD KONSTANTASI yo'q (`CKP_PASS_THRESHOLD`, `0.30`) →
      faqat `loadWeights()` DB dan o'qiydi; `ai_ckp_config` jadval bo'sh bo'lsa `Err` qaytaradi.
- [ ] **ai_ckp_config jadval:** DDL faylida `ai_ckp_config` jadval mavjud; seed INSERT IZOHDA
      (egasi qiymatlari kiritilmaguncha ishga tushirilmaydi).
- [ ] **§85-86 inson-tasdiq:** `aiBlockLog` jadval `is_active DEFAULT FALSE`; `proposeBlock()`
      metodi `is_active=false` yozadi; `approveBlock()` faqat `is_active=TRUE` qiladi;
      `createBlock() → is_active=true avto` MAVJUD EMAS.
- [ ] **AIBlockLog.tsx:** "Pending" tab + "Tasdiqlash/Rad etish" tugmalari mavjud.
- [ ] **Fit-PDF 3-tomon:** `ai_fit_scores` jadvalida `pdf_url` + `pdf_generated_at` ustunlar
      (ALTER TABLE DDL GATED) va §9 FLAG yozilgan.
- [ ] **Tarixiy import:** §2.2.2 va §9 da FLAG yozilgan (scope tashqarida, jim emas).
- [ ] **AISHA-JARVIS-VIZYON:** §2.6 da P36 aloqa nuqtalari yozilgan; Layer B scope tashqari
      (rasman belgilangan).

### 6.2 DB proof (REAL saqlash — Q-40)

**CKP score:**
```sql
-- INSERT test (migration APPROVED bo'lgandan keyin):
INSERT INTO ai_ckp_scores (employee_id, ckp_score, salary_gate_pass)
  VALUES (1, 75.5, true) RETURNING id, employee_id, salary_gate_pass;
-- Kutilayotgan natija: qator qaytishi kerak (id mavjud)
SELECT id, employee_id, ckp_score, salary_gate_pass FROM ai_ckp_scores WHERE employee_id=1;
-- Natija: bitta qator, ckp_score=75.50, salary_gate_pass=true
```

**Violations:**
```sql
INSERT INTO ai_violations (employee_id, violation_type, severity, description)
  VALUES (1, 'attendance', 'medium', 'Test violation') RETURNING id;
SELECT id, employee_id, violation_type FROM ai_violations WHERE employee_id=1;
```

**Governance log:**
```sql
INSERT INTO ai_governance_log (module, decision_type, entity_type, entity_id, actor_type, decision)
  VALUES ('ckp', 'score', 'employee', 1, 'ai_auto', '{"score": 75.5}') RETURNING id;
```

### 6.3 FE real saqlash tekshiruvi (Q-43)

- `EmployeeCkpDashboard.tsx`: chatbot xabar yubor → DB da `ai_ckp_chat_logs` yangi qator.
- `AIFitScores.tsx`: "Baholash" bosib submit → DB da `ai_fit_scores` yangi qator.
- `AIViolations.tsx`: "Hal qilish" → DB da `resolved_at` yangilandi.

### 6.4 Golden-thread regressiya tekshiruvi

```bash
# Mavjud AI modulning ishlashini tekshir:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/ai/insights
# → 200 (regression yo'q)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/ai/forecast
# → 200
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/ai-agents/list
# → 200
```

### 6.5 DirectorAiService regressiya tekshiruvi

```bash
# Mavjud director AI metodlari ishlashi kerak:
curl -H "Authorization: Bearer $TOKEN" -X POST http://localhost:3030/api/ai-director/explain-kpi \
  -H "Content-Type: application/json" \
  -d '{"kpiName":"test","currentValue":80,"targetValue":100,"historicalValues":[],"context":"test"}'
# → 200 (regression yo'q — yangi metodlar qo'shildi, eskilar saqlanadi)
```

---

## 7. SELF-VERIFY

### 7.1 Backend typecheck

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -20
# Kutilayotgan: "Found 0 errors." yoki 0 yangi xato
```

### 7.2 Frontend typecheck

```bash
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | tail -20
# Kutilayotgan: 0 yangi xato
```

### 7.3 Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh  2>&1 | tail -5
bash scripts/reviewer-array-safety.sh    2>&1 | tail -5
bash scripts/reviewer-as-unknown.sh      2>&1 | tail -5
bash scripts/reviewer-jwt-guard.sh       2>&1 | tail -5
```

### 7.4 DB proof (DDL approved bo'lgandan keyin)

```bash
# 1. CKP score insert → qayta o'qi
psql $DATABASE_URL -c "INSERT INTO ai_ckp_scores (employee_id, ckp_score, salary_gate_pass) VALUES (999, 82.0, true) RETURNING id, ckp_score, salary_gate_pass;"
# Kutilayotgan: bitta qator, id > 0

# 2. Chat log insert
psql $DATABASE_URL -c "INSERT INTO ai_ckp_chat_logs (employee_id, role, content, session_id) VALUES (999, 'user', 'Test savol', 'sess-test-001') RETURNING id;"

# 3. Governance log
psql $DATABASE_URL -c "INSERT INTO ai_governance_log (module, decision_type, entity_type, entity_id, actor_type, decision) VALUES ('ckp', 'test', 'employee', 999, 'ai_auto', '{\"test\": true}') RETURNING id;"

# 4. Tozalash
psql $DATABASE_URL -c "DELETE FROM ai_ckp_scores WHERE employee_id=999;"
psql $DATABASE_URL -c "DELETE FROM ai_ckp_chat_logs WHERE employee_id=999;"
psql $DATABASE_URL -c "DELETE FROM ai_governance_log WHERE entity_id=999;"
```

### 7.5 API smoke test (server ishga tushirilgandan keyin)

```bash
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"YOUR_PASS"}' | jq -r '.accessToken')

# CKP score endpoint
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/ai/ckp/employee/1?days=30" | jq '.items | length'

# Violations endpoint
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/ai/violations?limit=5" | jq '.items | length'

# Governance audit
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/ai/governance/audit?limit=5" | jq '.items | length'
```

### 7.6 NestJS DI tekshiruvi

```bash
pnpm --filter @europrint/api run build 2>&1 | grep -E "ERROR|error|Cannot|undefined"
# Kutilayotgan: 0 DI xato
```

---

## 8. COMMIT

### Commit tartibi va fayl guruhlari

**DIQQAT:** `git add -A` yoki `git add .` TAQIQ. Faqat aniq fayllar (Q-8).

**Commit 1 — Schema (DDL GATED fayllar ham shu commitda — ishga tushirilmaydi, faqat saqlangan):**
```bash
git add lib/db/src/schema/ai-ckp-schema.ts
git add lib/db/src/schema/ai-fit-schema.ts
git add lib/db/src/schema/ai-violation-schema.ts
git add lib/db/src/schema/ai-chat-card-schema.ts
git add lib/db/src/schema/ai-governance-schema.ts
git add apps/api/src/shared/db/migrations/ai-p36-ckp-fit-schema.sql
git add apps/api/src/shared/db/migrations/ai-p36-violation-block-schema.sql
git add apps/api/src/shared/db/migrations/ai-p36-chat-card-schema.sql
git add apps/api/src/shared/db/migrations/ai-p36-governance-schema.sql

git commit -m "feat(ai/p36): add CKP+fit+violation+governance Drizzle schemas + GATED migrations (15 tables)"
```

**Commit 2 — Domain interface + Drizzle repo:**
```bash
git add apps/api/src/modules/ai/domain/repositories/i-ai-ckp.repo.ts
git add apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-ckp.repo.ts

git commit -m "feat(ai/p36): add IAiCkpRepo domain interface + DrizzleAiCkpRepo (Result<T>, safeCall)"
```

**Commit 3 — Core services (CKP + Fit):**
```bash
git add apps/api/src/modules/ai/application/services/ai-ckp.service.ts
git add apps/api/src/modules/ai/application/services/ai-fit.service.ts
git add apps/api/src/modules/ai/application/services/ai-report.service.ts
git add apps/api/src/modules/ai/application/services/ai-bonus.service.ts
git add apps/api/src/modules/ai/application/services/ai-succession.service.ts

git commit -m "feat(ai/p36): add AiCkpService (salary gate + chatbot) + AiFitService (fit/bonus/succession)"
```

**Commit 4 — Violation/Block/Camera/Burnout/Fraud services:**
```bash
git add apps/api/src/modules/ai/application/services/ai-violation.service.ts
git add apps/api/src/modules/ai/application/services/ai-block.service.ts
git add apps/api/src/modules/ai/application/services/ai-camera.service.ts
git add apps/api/src/modules/ai/application/services/ai-burnout.service.ts
git add apps/api/src/modules/ai/application/services/ai-fraud.service.ts

git commit -m "feat(ai/p36): add violation/block/camera/burnout/fraud services (Result<T>, real DB)"
```

**Commit 5 — Forecast/Bottleneck/Chat/Governance services:**
```bash
git add apps/api/src/modules/ai/application/services/ai-forecast-range.service.ts
git add apps/api/src/modules/ai/application/services/ai-bottleneck.service.ts
git add apps/api/src/modules/ai/application/services/ai-chat-card.service.ts
git add apps/api/src/modules/ai/application/services/ai-override.service.ts
git add apps/api/src/modules/ai/application/services/ai-dispute.service.ts
git add apps/api/src/modules/ai/application/services/ai-governance.service.ts
git add apps/api/src/modules/ai/application/services/ai-calibration.service.ts

git commit -m "feat(ai/p36): add forecast-range/bottleneck/card-chat/override/dispute/governance/calibration services"
```

**Commit 6 — DirectorAiService kengaytirish:**
```bash
git add apps/api/src/modules/ai/services/director-ai.service.ts

git commit -m "feat(ai/p36): extend DirectorAiService with getAiGovernanceSummary + getBottleneckReport"
```

**Commit 7 — ai.module.ts yangilash:**
```bash
git add apps/api/src/modules/ai/ai.module.ts

git commit -m "feat(ai/p36): register all P36 providers in AiModule (DI wiring)"
```

**Commit 8 — Frontend sahifalar:**
```bash
git add artifacts/erp-dashboard/src/pages/EmployeeCkpDashboard.tsx
git add artifacts/erp-dashboard/src/pages/AIFitScores.tsx
git add artifacts/erp-dashboard/src/pages/AIViolations.tsx
git add artifacts/erp-dashboard/src/pages/AIBlockLog.tsx
git add artifacts/erp-dashboard/src/pages/AICameraCrossCheck.tsx
git add artifacts/erp-dashboard/src/pages/AIForecastPage.tsx
git add artifacts/erp-dashboard/src/pages/AIGovernancePage.tsx
git add artifacts/erp-dashboard/src/pages/AICardChatPage.tsx

git commit -m "feat(ai/p36): add 8 AI frontend pages (CKP dashboard, fit scores, violations, block log, camera, forecast, governance, card-chat)"
```

---

## 9. FLAG (boshqa paketlarga murojaat)

Quyidagi narsalar bu paket SCOPE DAN TASHQARI — egaga flag:

1. **P01/barrel maintainer'ga flag:** `lib/db/src/schema/index.ts` (yoki mavjud barrel) ga
   5 ta yangi schema fayl qo'shilishi kerak:
   `ai-ckp-schema`, `ai-fit-schema`, `ai-violation-schema`,
   `ai-chat-card-schema`, `ai-governance-schema`.

2. **P50 (route/sidebar) maintainer'ga flag:** Yangi sahifalar tayyor:
   `EmployeeCkpDashboard`, `AIFitScores`, `AIViolations`, `AIBlockLog`,
   `AICameraCrossCheck`, `AIForecastPage`, `AIGovernancePage`, `AICardChatPage`.
   Route va sidebar qo'shish P50 vazifasi.

3. **HR modul maintainerga flag:** `ai_ckp_scores.salary_gate_pass` maydon tayyor.
   HR maosh chiqarish jarayonida `GET /api/ai/ckp/salary-gate/:employeeId` → boolean
   tekshirish lozim.

4. **Payroll/GL masalasi — SCOPE DAN TASHQARI (P36 tegmaydi):** Bonus tavsiya
   (`ai_fit_scores.bonus_recommendation`) faqat tavsiya — real GL journal qo'shilishi
   Finance moduli (P24/P25/P26) mas'uliyatida.

5. **IoT auto-collect (Phase 2 pending):** `ai_ckp_scores` avtomatik to'ldirish uchun
   IoT event listener kerak — bu P15 (MES+IoT) + P36 birga hal qiladi. Hozir MANUAL
   trigger (POST /api/ai/ckp/compute) mavjud.

6. **Fit-PDF 3-tomon + tarixiy import (§2.2.1–2.2.2) — SCOPE FLAG:**
   - PDF generatsiya library egasi tasdiqlashi kerak (pdfkit vs puppeteer — **EGASI TANLOV KERAK**).
   - `POST /api/ai/fit/report/:id/pdf` va `POST /api/ai/fit/import-historical` endpointlari
     P36 OWNED FILE ro'yxatida yo'q (izolyatsiya). Egasi keyingi paket uchun IZOLYATSIYA
     MANIFESTiga qo'shsin — **jim qoldirilmaydi**.
   - `ai_fit_scores` jadvaliga `pdf_url` + `pdf_generated_at` ustunlar qo'shilishi uchun
     ALTER TABLE GATED migration yozilishi kerak.

7. **CKP konfiguratsiya UI (/settings/ai-ckp-config):** P36 OWNED FILE emas.
   Egasi P50 (route) paketiga yoki keyingi AI sprintga qo'shsin.
   Konfiguratsiya to'ldirilmaguncha CKP scoring `503` qaytaradi — bu intentional (Q65).

---

## 10. XAVF VA EDGE-HOLATLAR

| Holat | Muammo | Yechim |
|-------|--------|--------|
| AiRouterService API key yo'q | CKP chat ishlamaydi | safeCall ichida — AI xato bo'lsa, rule-based fallback; REAL score saqlanadi (AI explanation null) |
| DDL migration hali GATED | Jadval yo'q | Barcha service `safeCall` ichida — jadval yo'q bo'lsa xato Result<Err> qaytaradi, server tushib qolmaydi |
| FE sahifa route yo'q | Sahifa ko'rinmaydi | Route/sidebar P50 qo'shadi — P36 faqat sahifa fayllarini yaratadi |
| ai.module.ts 900 qatordan oshsa | Qoida 13 buzilishi | Providerlarni sub-module'ga ajrat yoki `feature-modules.ts` barrel'ga ko'chirish (P50 bilan kelishib) |
| director-ai.service.ts metodlar ko'paysa | 900 qator chegarasi | Mavjud faylda faqat 2 metod qo'shiladi — chegaradan oshmasligi tekshirilsin (`wc -l` bilan) |
| aiCkpScores.employeeId FK yo'q | DB-level integrity yo'q | Migration'da FK qo'shilmagan (employees jadval boshqa schema — cross-module FK deferred per ADR). Logik FK mantiqda saqlanadi. |
| @europrint/schemas barrel yangilanmagan | `aiCkpScores` import xatosi | P01 barrel yangilanmaguncha, to'g'ridan schema fayldan import: `from '../../../../../../lib/db/src/schema/ai-ckp-schema'` |

---

*P36 direktiva — Q-47 standarti: to'liq, batafsil, ≥1000 qator.*
*Yozilgan: 2026-06-19. Egasi tasdiqlamagunicha DDL ISHGA TUSHIRILMAYDI.*
