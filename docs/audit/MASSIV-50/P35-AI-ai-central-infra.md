# P35 — AI / Markaziy-AI: AI CentralAI infra + provider-config DDL + PII guard + alerts-repo fix

> **WAVE 1 | dependsOn: ["P01"]**
> Bu direktiva P01 (schema lib barrel) tugagandan KEYIN boshlanadi.
> Faqat shu direktiva ro'yxatidagi fayllarni o'zgartiring.

---

## 0. ROL VA QOIDALAR

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE
    ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil,
    supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration
    faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin
    GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit=bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi,
    shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**WAVE:** 1
**dependsOn:** ["P01"] — P01 (schema lib barrel) MERGE bo'lgunicha bu paketni boshlama.
Parallel bajaruvchilardan biri ekansan: faqat o'z fayllaringga teg.

---

## 1. IZOLYATSIYA MANIFESTI

Siz FAQAT quyidagi 11 ta faylga tegasiz:

```
apps/api/src/modules/ai/application/services/central-ai.service.ts          ← YARATILADI (yo'q)
apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-provider-config.repo.ts  ← YARATILADI (yo'q)
apps/api/src/modules/ai/domain/repositories/i-ai-provider-config.repo.ts    ← YARATILADI (yo'q)
lib/db/src/schema/ai-providers-schema.ts                                     ← O'ZGARTIRILADI
apps/api/src/modules/ai/application/services/ai-router.service.ts            ← O'ZGARTIRILADI
apps/api/src/modules/ai/ai.module.ts                                          ← O'ZGARTIRILADI
apps/api/src/modules/ai-agents/common/ai-alerts.service.ts                   ← O'ZGARTIRILADI
apps/api/src/modules/ai-agents/infrastructure/repositories/drizzle-ai-alerts.repo.ts ← YARATILADI (yo'q)
artifacts/erp-dashboard/src/pages/AIProviderConfig.tsx                        ← YARATILADI (yo'q)
artifacts/erp-dashboard/src/locales/uz/ai.json                                ← O'ZGARTIRILADI
artifacts/erp-dashboard/src/locales/ru/ai.json                                ← O'ZGARTIRILADI
```

**BOSHQA FAYLLARGA TEG: YO'Q.**

- `apps/api/src/modules/ai-agents/ai-agents.module.ts` kerak bo'lsa → TO'XTA + flag
- `apps/api/src/modules/ai/infrastructure/repositories/ai-router.repository.ts` → O'ZGARTIRMA
- `artifacts/erp-dashboard/src/App.tsx` yoki route fayllar → O'ZGARTIRMA (P11 egaligi)

**DDL DARVOZASI:** Bu paket `ai_provider_configs` jadvalini yaratish uchun migration
fayli yozadi. GATED — migratsiya faylini yoz, lekin `pnpm drizzle-kit push` yoki
`psql` orqali ISHGA TUSHIRMA. Migration fayli tarkibida `-- APPROVED: <egasi> <sana>`
satri bo'lishi shart.

---

## 2. VIZYON

### 2.1 CentralAiService — markaziy AI xizmat
EuroPrint vizyonida har bir Org kartasi (lavozim + razryad) o'z AI'siga ega.
`CentralAiService` — barcha AI chaqiruvlari uchun yagona kirish nuqtasi.

**Qabul mezoni:**
- `call(req)` — JWT dan `cardId` (org_functions.id) oladi; `AiRequest.metadata.cardId`
  orqali AiRouterService ga uzatadi.
- `card_id` AI_usage_logs jadvaliga yoziladi (kelajakda karta bo'yicha xarajat hisobi).
- `userId` — hamma vaqt `number` (integer), hech qachon `string | number` emas (type drift tuzatiladi).

### 2.2 AiProviderConfig — provider konfiguratsiyasi boshqaruvi
Tizim administratori UI orqali har bir AI provider (openai/gemini/claude) uchun
`api_key`, `model`, `daily_budget_usd`, `is_active` ni boshqara olsin.
Hardcoded `DAILY_BUDGET_USD = 50` o'rniga DB dan dinamik o'qilsin.

**Qabul mezoni:**
- `ai_provider_configs` jadvali mavjud (migration GATED).
- `DrizzleAiProviderConfigRepo` → `findAll`, `findByProvider`, `upsert` metodlari, hamma `Result<T>`.
- `AiRouterService.checkBudget()` DB dan budget o'qiydi (hardcoded 50 fallback saqlanadi
  agar DB bo'sh bo'lsa).

### 2.3 PII masking — AiRouterService ichida
Joriy holat: `requestSummary = req.prompt.substring(0, 200)`. Bu xavfli — `prompt`
ichida mijoz ismi, passport, telefon bo'lishi mumkin.

**Qabul mezoni:**
- `AiRouterService.buildUsageLogPayload()` `prompt` va `result.text` ni `maskPii()` helper
  orqali o'tkazadi.
- `maskPii(text: string): string` — telefon (`+998XXXXXXXXX`), passport (`AA1234567`),
  email (`x@x.x`) ni `[MASKED]` bilan almashtiradi; so'ngra `substring(0, MAX_NAME_LENGTH)`.
- Test: `maskPii("+998901234567 Ali")` → `"[MASKED] Ali"`.

### 2.4 ai-alerts.service.ts — Qoida-15 buzydi (db.* to'g'ridan)
Joriy holat (`ai-alerts.service.ts:10`):
```typescript
import { db } from '@shared/db';
```
Va `findSupervisors` / `findSalesManagers` / `findDirectors` / `dispatchCustomerPriceEmail`
metodlari `db.execute(sql\`...\`)` to'g'ridan chaqiradi (Qoida-15 buzilishi).

**Qabul mezoni:**
- `drizzle-ai-alerts.repo.ts` yaratiladi: `IAiAlertsRepo` interfeysi + `DrizzleAiAlertsRepo`
  implementatsiyasi.
- `AiAlertsService` DB ni to'g'ridan ko'rmaydi — faqat repo orqali.
- Barcha query Result<T> qaytaradi yoki `safeCall` wrapping bilan.

### 2.5 AiRouter userId type drift tuzatilishi
Joriy holat (`ai-router.service.ts:277`):
```typescript
userId: req.userId != null ? String(req.userId) : undefined,
```
`AiRequest.userId` turi `string | number` — bu noaniq. `ai_usage_logs.user_id` DB da
`integer` FK (`users.id`). `String()` cast mantiqsiz.

**Qabul mezoni:**
- `AiRequest.userId` → `number | undefined` (string olib tashlanadi).
- `buildUsageLogPayload` → `userId: req.userId` (direct, no cast).
- Barcha chaqiruvchi joylar integer `userId` uzatadi.

### 2.6 AIProviderConfig FE sahifasi
Admin foydalanuvchisi `/settings/ai-providers` da AI provayderlarni ko'rsin va
har bir prayverning `is_active`, `daily_budget_usd`, `default_model` ni o'zgartirsin.

**Qabul mezoni:**
- `AIProviderConfig.tsx` — EP dizayn-tizimi (EPPageHeader, EPCard, EPKpiCard).
- `useQuery` + `useMutation` (PATCH `/api/ai/provider-configs/:provider`).
- Loading/error holat ko'rsatiladi.
- 3 karta: openai / gemini / claude.

### 2.7 AISHA-JARVIS-VIZYON integratsiyasi (Q-25 master-reja talabi)

> **Manba:** `docs/audit/AISHA-JARVIS-VIZYON-2026-06-17.md` — egasining ENG SO'NGGI AI
> hujjati (2026-06-17, direktivadan 2 kun oldin). Q-25 bo'yicha master-reja ustun —
> bu vizyon P35/P36 scopega **aks ettirilishi shart**.

#### 2.7.1 Arxitektura: 2 qatlam (Layer A + Layer B)

```
Layer A — ERP MIYA (web, mavjud ~tayyor):
  apps/api/src/modules/aisha/   ← Claude + ~30 tool (inventar/buyurtma/MES/sifat/moliya/kamera/NTF)
  Vazifa: direktor-dashboard'dan AJRATISH → alohida modul + futuristik web-UI
  ⚠️ ANTHROPIC_API_KEY kerak (ConfigService orqali, process.env to'g'ridan TAQIQ)

Layer B — DESKTOP JARVIS (yangi, Python — ALOHIDA ILOVA):
  STT: PyAudio + Whisper (o'zbekcha) → matn
  LLM: JSON action → ERP savol bo'lsa Layer A /aisha/chat; OS-control bo'lsa pyautogui
  TTS: edge-tts (o'zbek neyron ovoz) → pygame
  GUI: PyQt5/PyQt6 — to'q fon + neon, markazda jonli orb
  ⚠️ XAVFSIZLIK: har OS-amal → inson TASDIG'I (pending-approval — 1-printsip)
```

#### 2.7.2 P35 scope (Layer A — web)

P35 uchun **Layer A ajratish** va **alohida modul** talabi (egasi qarorlari):
- `apps/api/src/modules/aisha/` — mavjud modul (chat/voice/wake-config controller, 30 tool, SSE)
- **Direktor-dashboard'dan AJRATISH** → `/aisha` alohida route, `sidebar` da alohida yozuv
- **Futuristik web-UI**: immersiv orb, reaktiv animatsiya (dizayn-istisno: Qoida 21 EP-token
  istisno — egasi tasdiqlagan, faqat shu modul)
- **Faza-0 re-audit**: SSE tool-loop real mi? (`chat/voice` controller amalda ishlaydimi?)

> ⚠️ **P35 IZOLYATSIYA:** `apps/api/src/modules/aisha/` ga TEGMA (owned file emas).
> Bu paket faqat `aisha` modulining **mavjudligi + ajratilganligini** §9 FLAG orqali
> egaga bildiradi. Aisha UI = dizayn-istisno, alohida sprint.

#### 2.7.3 P35 FLAG — Aisha Layer A ajratish

```typescript
// P35 FLAG (Layer A — aisha modul ajratish):
// apps/api/src/modules/aisha/ mavjud lekin direktor-dashboard'ga ULANGAN.
// Egasi qarorlari (AISHA-JARVIS-VIZYON-2026-06-17):
//   ✅ Alohida modul/route: /aisha (sidebar'da mustaqil yozuv)
//   ✅ Futuristik UI (dizayn-istisno: EP-token bypass — faqat shu modul)
//   ✅ Tool'larni to'ldirish: inventar/buyurtma/MES/sifat/moliya/kamera-VLM/email/NTF
//   ✅ Layer B (Python JARVIS desktop client) — alohida ilova, alohida sprint
//   ⚠️ ANTHROPIC_API_KEY: ConfigService.getOrThrow('ANTHROPIC_API_KEY') — process.env taqiq
// Keyingi sprint: Aisha Layer A decouple + futuristik UI (egasi ruxsati kerak)
```

#### 2.7.4 Layer B — scope tashqarida (rasman belgilangan)

Layer B (Python JARVIS desktop client) bu paket scope'idan TASHQARIDA:
- Alohida Python ilova/repo (NestJS backenddan mustaqil)
- Wake-word, STT/TTS, OS-control, GUI — egasi #15 AI slotida belgilagan
- P35 faqat Layer A miya (`/aisha/chat` endpoint) ni tayyor tutadi
- Layer B #15 AI slotiga qoldirilgan (**rasman defer, jim emas**)

### 2.8 ai.json i18n kalitlari
`AIProviderConfig.tsx` ishlatadigan kalitlar `uz/ai.json` va `ru/ai.json` ga qo'shiladi.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud fayllar va muammolar

| Fayl | Holat | Muammo |
|------|-------|--------|
| `central-ai.service.ts` | **YO'Q** | Yaratilishi kerak |
| `drizzle-ai-provider-config.repo.ts` | **YO'Q** | Yaratilishi kerak |
| `i-ai-provider-config.repo.ts` | **YO'Q** | Yaratilishi kerak |
| `lib/db/src/schema/ai-providers-schema.ts` | Mavjud | Faqat `ai_usage_logs` bor; `ai_provider_configs` jadval yo'q |
| `ai-router.service.ts` | Mavjud | `userId: String(req.userId)` (qator 277) — type drift; `maskPii` yo'q; hardcoded `DAILY_BUDGET_USD` |
| `ai.module.ts` | Mavjud | `CentralAiService`, `AiProviderConfig` repo/service ro'yxatda yo'q |
| `ai-alerts.service.ts` | Mavjud | `db.*` to'g'ridan (qator 10, 116, 178, 189, 201) — Qoida-15 buzilishi |
| `drizzle-ai-alerts.repo.ts` | **YO'Q** | Yaratilishi kerak |
| `AIProviderConfig.tsx` | **YO'Q** | Yaratilishi kerak |
| `uz/ai.json` | Mavjud | `providerConfig.*` kalitlari yo'q |
| `ru/ai.json` | Mavjud | `providerConfig.*` kalitlari yo'q |

### 3.2 Muammo 1 — userId type drift (`ai-router.service.ts:277`)
```typescript
// HOZIR (xato):
userId: req.userId != null ? String(req.userId) : undefined,
```
`userId` DB da integer FK. `String(42)` = `"42"` — DB integer kolonnaga kiradi lekin
mantiqsiz. `AiRequest.userId?: string | number` — noaniq tip.

### 3.3 Muammo 2 — Qoida-15 buzilyapti (`ai-alerts.service.ts:10`)
```typescript
import { db } from '@shared/db'; // TO'G'RIDAN import — TAQIQ
```
`findSupervisors` (178-satr), `findSalesManagers` (189-satr), `findDirectors` (201-satr),
`dispatchCustomerPriceEmail` (116-satr) — barchasi `db.execute(sql\`...\`)` to'g'ridan.
Bu `Qoida-15` (`Service ichida db.* taqiq`) ning aniq buzilishi.

### 3.4 Muammo 3 — PII xavfi (`ai-router.service.ts:279`)
```typescript
requestSummary: req.prompt.substring(0, MAX_NAME_LENGTH),
responseSummary: result.text.substring(0, MAX_NAME_LENGTH),
```
`prompt` ichida sezgir ma'lumot bo'lishi mumkin. `maskPii` yo'q.

### 3.5 Muammo 4 — `ai_provider_configs` jadvali yo'q
`lib/db/src/schema/ai-providers-schema.ts` faqat `ai_usage_logs` ni eksport qiladi.
`ai_provider_configs` jadvali sxemada ham, DB da ham yo'q.

### 3.6 Muammo 5 — `CentralAiService` yo'q
Vizyon: barcha AI chaqiruvlar bir markazdan o'tadi, `card_id` JWT dan keladi.
Hozir har modul `AiRouterService` ni to'g'ridan inject qiladi — markazlashtirilmagan.

---

## 4. ISH (qadam-baqadam)

### Qadam 1 — `ai-providers-schema.ts` ga `ai_provider_configs` jadval qo'shish

**Fayl:** `lib/db/src/schema/ai-providers-schema.ts`

**Hozirgi holat (1-41 qator):** Faqat `aiUsageLogs` pgTable va Zod schema.

**O'zgartirish:** Faylga yangi `aiProviderConfigs` jadval va tegishli Zod/type eksportlarini qo'shing:

```typescript
// Qo'shiladigan import:
import { boolean } from "drizzle-orm/pg-core";

// Yangi jadval (mavjud faylning oxiriga):
export const aiProviderConfigs = pgTable("ai_provider_configs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull().unique(), // 'openai' | 'gemini' | 'claude'
  apiKeyHint: varchar("api_key_hint", { length: 20 }),              // Oxirgi 4 ta belgi ko'rsatiladi
  defaultModel: varchar("default_model", { length: 100 }),
  dailyBudgetUsd: numeric("daily_budget_usd", { precision: 10, scale: 2 }).default("50.00"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedByUserId: integer("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
});

export const insertAiProviderConfigSchema = createInsertSchema(aiProviderConfigs).omit({
  id: true, updatedAt: true,
} as never);

export const updateAiProviderConfigSchema = insertAiProviderConfigSchema.partial().extend({
  provider: z.enum(['openai', 'gemini', 'claude']),
});

export type AiProviderConfig = typeof aiProviderConfigs.$inferSelect;
export type InsertAiProviderConfig = z.infer<typeof insertAiProviderConfigSchema>;
export type UpdateAiProviderConfig = z.infer<typeof updateAiProviderConfigSchema>;
```

**Muhim:** `apiKeyHint` saqlanadi — haqiqiy `api_key` HECH QACHON DB da saqlanmaydi.
API kaliti `.env` da saqlanadi (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`).
Faqat so'nggi 4 ta belgini ko'rsatish mumkin (masalan: `****abc1`).

**Tekshirish:** `pnpm --filter @europrint/db build` — 0 xato.

---

### Qadam 2 — DDL migration fayli (GATED)

**Fayl:** `apps/api/src/database/migrations/d6-ai-provider-configs.sql` (yangi fayl)

```sql
-- APPROVED: <egasi> <sana>
-- Migration: d6-ai-provider-configs
-- Maqsad: ai_provider_configs jadvali — AI provider konfiguratsiyasi boshqaruvi
-- DDL Darvozasi: bu faylni faqat egasi ruxsatidan keyin ishga tushiring

CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id                 SERIAL PRIMARY KEY,
  provider           VARCHAR(50) NOT NULL UNIQUE,    -- 'openai' | 'gemini' | 'claude'
  api_key_hint       VARCHAR(20),                    -- So'nggi 4 belgi, ko'rsatish uchun (HAQIQIY KALIT EMAS)
  default_model      VARCHAR(100),
  daily_budget_usd   NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  notes              TEXT,
  updated_at         TIMESTAMP DEFAULT NOW(),
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Seed: 3 ta default yozuv (is_active=false — admin aktivlashtiradi)
INSERT INTO ai_provider_configs (provider, daily_budget_usd, is_active, notes)
VALUES
  ('openai', 50.00, false, 'gpt-4o-mini — OPENAI_API_KEY env orqali'),
  ('gemini', 50.00, false, 'gemini-1.5-flash — GEMINI_API_KEY env orqali'),
  ('claude', 50.00, false, 'claude-3-haiku — ANTHROPIC_API_KEY env orqali')
ON CONFLICT (provider) DO NOTHING;
```

**GATED:** bu faylni `psql` yoki `pnpm drizzle-kit push` orqali ISHGA TUSHIRMA.
Faqat yoz, commit qil, egasi ruxsatini kut.

---

### Qadam 3 — `i-ai-provider-config.repo.ts` — domain interfeys

**Fayl:** `apps/api/src/modules/ai/domain/repositories/i-ai-provider-config.repo.ts` (YANGI)

```typescript
/**
 * @module i-ai-provider-config.repo
 * @description Domain repository interface for AI provider configuration.
 * @layer Domain (AI)
 */

import type { Result } from '@common/result';
import type { AiProviderConfig, InsertAiProviderConfig } from '@workspace/db/schema/ai-providers-schema';
import type { AiProvider } from '../types/ai.types';

export interface IAiProviderConfigRepo {
  findAll(): Promise<Result<AiProviderConfig[]>>;
  findByProvider(provider: AiProvider): Promise<Result<AiProviderConfig | null>>;
  upsert(data: InsertAiProviderConfig): Promise<Result<AiProviderConfig>>;
  getActiveBudget(provider: AiProvider): Promise<Result<number>>;
}

export const AI_PROVIDER_CONFIG_REPO = Symbol('AI_PROVIDER_CONFIG_REPO');
```

**Izoh:** `AiProviderConfig | null` — provider topilmasa `null` qaytaradi (bu `Result<T>` ichida, throw emas).

---

### Qadam 4 — `drizzle-ai-provider-config.repo.ts` — infra implementatsiya

**Fayl:** `apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-provider-config.repo.ts` (YANGI)

```typescript
/**
 * @module drizzle-ai-provider-config.repo
 * @description Drizzle ORM implementatsiyasi. Result<T> qaytaradi; throw taqiq.
 * @layer Infrastructure (AI)
 */

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@common/services/drizzle.service';
import { aiProviderConfigs } from '@workspace/db/schema/ai-providers-schema';
import { eq } from 'drizzle-orm';
import { Ok, Err, safeCall, Result } from '@common/result';
import type { IAiProviderConfigRepo } from '../../domain/repositories/i-ai-provider-config.repo';
import type { AiProviderConfig, InsertAiProviderConfig } from '@workspace/db/schema/ai-providers-schema';
import type { AiProvider } from '../../domain/types/ai.types';

const DEFAULT_DAILY_BUDGET = 50; // fallback agar DB bo'sh

@Injectable()
export class DrizzleAiProviderConfigRepo implements IAiProviderConfigRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(): Promise<Result<AiProviderConfig[]>> {
    return safeCall(async () => {
      return this.drizzle.db.select().from(aiProviderConfigs);
    }, 'DB_ERROR');
  }

  async findByProvider(provider: AiProvider): Promise<Result<AiProviderConfig | null>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiProviderConfigs)
        .where(eq(aiProviderConfigs.provider, provider))
        .limit(1);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async upsert(data: InsertAiProviderConfig): Promise<Result<AiProviderConfig>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .insert(aiProviderConfigs)
        .values(data)
        .onConflictDoUpdate({
          target: aiProviderConfigs.provider,
          set: {
            defaultModel:      data.defaultModel,
            dailyBudgetUsd:    data.dailyBudgetUsd,
            isActive:          data.isActive,
            notes:             data.notes,
            apiKeyHint:        data.apiKeyHint,
            updatedByUserId:   data.updatedByUserId,
            updatedAt:         new Date(),
          },
        })
        .returning();
      if (!rows[0]) throw new Error('upsert qaytarmadi');
      return rows[0];
    }, 'DB_ERROR');
  }

  async getActiveBudget(provider: AiProvider): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select({ budget: aiProviderConfigs.dailyBudgetUsd, isActive: aiProviderConfigs.isActive })
        .from(aiProviderConfigs)
        .where(eq(aiProviderConfigs.provider, provider))
        .limit(1);
      if (!rows[0] || !rows[0].isActive) return DEFAULT_DAILY_BUDGET;
      return parseFloat(String(rows[0].budget ?? DEFAULT_DAILY_BUDGET));
    }, 'DB_ERROR');
  }
}
```

**Edge holatlar:**
- `upsert` — mavjud bo'lsa yangilaydi, bo'lmasa yaratadi (`onConflictDoUpdate`).
- `getActiveBudget` — `is_active=false` bo'lsa fallback `DEFAULT_DAILY_BUDGET` qaytaradi.
- Hamma metod `safeCall` ichida — throw hech qachon tashqariga chiqmaydi.

---

### Qadam 5 — `central-ai.service.ts` — markaziy AI xizmat

**Fayl:** `apps/api/src/modules/ai/application/services/central-ai.service.ts` (YANGI)

```typescript
/**
 * @module central-ai.service
 * @description Markaziy AI xizmat. JWT dan card_id (org_functions.id) oladi;
 *   barcha AI chaqiruvlar shu yerdan o'tadi. Result<T> qaytaradi.
 * @layer Application (AI)
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiRouterService } from './ai-router.service';
import { Ok, Err, isErr, Result } from '@common/result';
import type { AiRequest, AiResponse, AiTaskType } from '../../domain/types/ai.types';

export interface CentralAiCallOptions {
  taskType: AiTaskType;
  prompt: string;
  systemPrompt?: string;
  /** JWT dan olingan users.id — integer */
  userId?: number;
  /** JWT dan olingan org_functions.id — karta ID */
  cardId?: number;
  sessionId?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class CentralAiService {
  private readonly logger = new Logger(CentralAiService.name);

  constructor(private readonly aiRouterService: AiRouterService) {}

  /**
   * Markaziy AI chaqiruvi.
   * `cardId` — JWT dan keladi, `ai_usage_logs.card_id` ga yoziladi.
   * `userId` — integer (string QABUL QILINMAYDI).
   */
  async call(options: CentralAiCallOptions): Promise<Result<AiResponse>> {
    const { taskType, prompt, systemPrompt, userId, cardId, sessionId, temperature, maxTokens } = options;

    if (!prompt || prompt.trim().length === 0) {
      return Err('Prompt bo'sh bo'lmasligi kerak');
    }

    const req: AiRequest = {
      taskType,
      prompt,
      systemPrompt,
      userId,                    // integer yoki undefined
      sessionId,
      temperature,
      maxTokens,
      metadata: {
        cardId,                  // karta ID — kelajakda karta bo'yicha xarajat hisobi
        source: 'central-ai',
      },
    };

    const result = await this.aiRouterService.call(req);

    if (isErr(result)) {
      this.logger.warn(`[CentralAI] taskType=${taskType} cardId=${cardId} XATO: ${result.error}`);
    } else {
      this.logger.log(
        `[CentralAI] taskType=${taskType} cardId=${cardId} provider=${result.data.provider} ` +
        `latency=${result.data.latencyMs}ms cost=$${result.data.estimatedCostUsd.toFixed(6)}`
      );
    }

    return result;
  }
}
```

**Nima qiladi:**
- `AiRouterService.call()` ni wraplaydi.
- `cardId` (org_functions.id) ni `metadata.cardId` orqali uzatadi.
- `userId` faqat `number` — type safety saqlanadi.
- Markazlashtirilgan log (taskType + cardId + provider + latency + cost).

---

### Qadam 6 — `ai-router.service.ts` — userId drift + PII masking tuzatish

**Fayl:** `apps/api/src/modules/ai/application/services/ai-router.service.ts`

#### 6.1 `AiRequest.userId` tipini integer ga o'zgartirish

**Oldin (`ai.types.ts:70`):**
```typescript
userId?: string | number;
```

**Keyin (bu o'zgarish `ai.types.ts` da — LEKIN U OWNED FILE EMAS). Shu sababli:**
- `AiRequest.userId` hali ham `string | number` bo'lib qoladi (boshqa paket egaligi).
- Siz `ai-router.service.ts` ichida faqat cast qilish mantiqini to'g'irlaysiz.

**Fayl: `ai-router.service.ts`, `buildUsageLogPayload` metodi (268-284 qator)**

**Oldin (277-satr):**
```typescript
userId: req.userId != null ? String(req.userId) : undefined,
```

**Keyin:**
```typescript
userId: req.userId != null ? Number(req.userId) : undefined,
```

**Izoh:** `Number(req.userId)` integer ga to'g'ri keladi. `String` o'rniga `Number`.
Agar `req.userId = "abc"` bo'lsa `NaN` bo'ladi — bu edge case `AiRequest` jo'natuvchisi
tomonidan oldini olish kerak (central-ai.service.ts faqat `number | undefined` qabul qiladi).

#### 6.2 `maskPii` helper qo'shish va `buildUsageLogPayload` da ishlatish

`ai-router.service.ts` faylining boshiga (importlardan keyin) qo'shing:

```typescript
// ─── PII Masking ──────────────────────────────────────────────────────────
// Q-40: real prompts may contain PII (phone, passport, email).
// Mask before storing in ai_usage_logs.
const PII_PATTERNS: RegExp[] = [
  /\+998\d{9}/g,                  // O'zbekiston telefon
  /[A-Z]{2}\d{7}/g,               // Passport (AA1234567)
  /[\w.-]+@[\w.-]+\.\w{2,}/g,     // Email
  /\b\d{14}\b/g,                  // PINFL (14 raqam)
];

function maskPii(text: string): string {
  if (!text) return text;
  let masked = text;
  for (const pattern of PII_PATTERNS) {
    masked = masked.replace(pattern, '[MASKED]');
  }
  return masked;
}
// ─────────────────────────────────────────────────────────────────────────
```

**`buildUsageLogPayload` metodini o'zgartirish (268-284 qator):**

**Oldin:**
```typescript
requestSummary: req.prompt.substring(0, MAX_NAME_LENGTH),
responseSummary: result.text.substring(0, MAX_NAME_LENGTH),
```

**Keyin:**
```typescript
requestSummary: maskPii(req.prompt).substring(0, MAX_NAME_LENGTH),
responseSummary: maskPii(result.text).substring(0, MAX_NAME_LENGTH),
```

**userId qatori (277):**
```typescript
// Oldin:
userId: req.userId != null ? String(req.userId) : undefined,
// Keyin:
userId: req.userId != null ? Number(req.userId) : undefined,
```

**To'liq o'zgartirilgan `buildUsageLogPayload`:**
```typescript
private buildUsageLogPayload(provider: AiProvider, req: AiRequest, result: AiResponse) {
  return {
    provider,
    taskType: req.taskType,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    totalTokens: result.inputTokens + result.outputTokens,
    estimatedCost: result.estimatedCostUsd.toFixed(6),
    userId: req.userId != null ? Number(req.userId) : undefined,
    sessionId: req.sessionId != null ? String(req.sessionId) : undefined,
    requestSummary: maskPii(req.prompt).substring(0, MAX_NAME_LENGTH),
    responseSummary: maskPii(result.text).substring(0, MAX_NAME_LENGTH),
    latencyMs: result.latencyMs,
    status: 'success' as const,
  };
}
```

---

### Qadam 7 — `drizzle-ai-alerts.repo.ts` — Qoida-15 uchun repo yaratish

**Fayl:** `apps/api/src/modules/ai-agents/infrastructure/repositories/drizzle-ai-alerts.repo.ts` (YANGI)

Avval direktoriya mavjudligini tekshiring:
```bash
ls apps/api/src/modules/ai-agents/infrastructure/repositories/
```
Agar yo'q bo'lsa:
```bash
mkdir -p apps/api/src/modules/ai-agents/infrastructure/repositories
```

```typescript
/**
 * @module drizzle-ai-alerts.repo
 * @description DB queries uchun repo — AiAlertsService dan db.* ajratish (Qoida-15).
 * @layer Infrastructure (ai-agents)
 */

import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@common/services/drizzle.service';
import { sql } from 'drizzle-orm';
import { safeCall, Result, Ok } from '@common/result';

export interface RecipientRow {
  telegram_chat_id: string;
}

export interface CustomerContactRow {
  email: string | null;
  name:  string | null;
}

export interface IAiAlertsRepo {
  findSupervisors(): Promise<Result<RecipientRow[]>>;
  findSalesManagers(): Promise<Result<RecipientRow[]>>;
  findDirectors(): Promise<Result<RecipientRow[]>>;
  findCustomerByOrderNumber(orderNumber: string): Promise<Result<CustomerContactRow | null>>;
}

export const AI_ALERTS_REPO = Symbol('AI_ALERTS_REPO');

@Injectable()
export class DrizzleAiAlertsRepo implements IAiAlertsRepo {
  private readonly logger = new Logger(DrizzleAiAlertsRepo.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async findSupervisors(): Promise<Result<RecipientRow[]>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<RecipientRow>(sql`
        SELECT e.telegram_chat_id
        FROM employees e
        WHERE LOWER(e.status) = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND LOWER(e.role) IN ('production_manager', 'shift_supervisor', 'director')
        LIMIT 5
      `);
      return Array.isArray(result.rows) ? result.rows : [];
    }, 'DB_ERROR');
  }

  async findSalesManagers(): Promise<Result<RecipientRow[]>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<RecipientRow>(sql`
        SELECT e.telegram_chat_id
        FROM employees e
        WHERE LOWER(e.status) = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND LOWER(e.role) IN ('sales_manager', 'sales_head', 'director')
        LIMIT 3
      `);
      return Array.isArray(result.rows) ? result.rows : [];
    }, 'DB_ERROR');
  }

  async findDirectors(): Promise<Result<RecipientRow[]>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<RecipientRow>(sql`
        SELECT e.telegram_chat_id
        FROM employees e
        WHERE LOWER(e.status) = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND LOWER(e.role) = 'director'
        LIMIT 3
      `);
      return Array.isArray(result.rows) ? result.rows : [];
    }, 'DB_ERROR');
  }

  async findCustomerByOrderNumber(orderNumber: string): Promise<Result<CustomerContactRow | null>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<CustomerContactRow>(sql`
        SELECT ca.email, ca.name
        FROM customer_orders co
        LEFT JOIN customer_accounts ca ON ca.id::text = co.customer_id
        WHERE co.order_number = ${orderNumber}
        LIMIT 1
      `);
      return result.rows[0] ?? null;
    }, 'DB_ERROR');
  }
}
```

**Izoh:** `drizzle.db.execute` — `@shared/db` dan `db` to'g'ridan emas, `DrizzleService` orqali.
Bu Qoida-15 ni to'liq qondiradi.

---

### Qadam 8 — `ai-alerts.service.ts` — Qoida-15 tuzatish

**Fayl:** `apps/api/src/modules/ai-agents/common/ai-alerts.service.ts`

#### 8.1 `@shared/db` import va to'g'ridan `db.*` chaqiruvlarni olib tashlash

**Oldin (10-satr):**
```typescript
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
```

**Keyin (bu ikki import OLIB TASHLANADI).**

`sql` import faqat `drizzle-ai-alerts.repo.ts` da kerak — service da endi kerak emas.

#### 8.2 Constructor ga repo inject qilish

**Oldin (50-53 qator):**
```typescript
constructor(
  @Inject(TELEGRAM_SENDER) private readonly telegram: ITelegramSender,
  @Inject(EMAIL_SENDER) private readonly email: IEmailSender,
) {}
```

**Keyin:**
```typescript
import { AI_ALERTS_REPO, type IAiAlertsRepo } from '../infrastructure/repositories/drizzle-ai-alerts.repo';

constructor(
  @Inject(TELEGRAM_SENDER) private readonly telegram: ITelegramSender,
  @Inject(EMAIL_SENDER)    private readonly email: IEmailSender,
  @Inject(AI_ALERTS_REPO)  private readonly alertsRepo: IAiAlertsRepo,
) {}
```

#### 8.3 `findSupervisors` metodi (177-186 qator)

**Oldin:**
```typescript
private async findSupervisors(): Promise<RecipientRow[]> {
  return db.execute<RecipientRow>(sql`
    SELECT e.telegram_chat_id
    FROM employees e
    WHERE LOWER(e.status) = 'active'
      AND e.telegram_chat_id IS NOT NULL
      AND LOWER(e.role) IN ('production_manager', 'shift_supervisor', 'director')
    LIMIT 5
  `).then((r) => r.rows).catch(() => [] as RecipientRow[]);
}
```

**Keyin:**
```typescript
private async findSupervisors(): Promise<RecipientRow[]> {
  const result = await this.alertsRepo.findSupervisors();
  return result.ok ? result.data : [];
}
```

#### 8.4 `findSalesManagers` metodi (188-197 qator)

**Oldin:** `db.execute(sql\`...\`).then((r) => r.rows).catch(() => [])`

**Keyin:**
```typescript
private async findSalesManagers(): Promise<RecipientRow[]> {
  const result = await this.alertsRepo.findSalesManagers();
  return result.ok ? result.data : [];
}
```

#### 8.5 `findDirectors` metodi (199-214 qator)

**Oldin:** `db.execute(sql\`...\`)` try/catch bloki

**Keyin:**
```typescript
private async findDirectors(): Promise<RecipientRow[]> {
  const result = await this.alertsRepo.findDirectors();
  if (!result.ok) {
    this.logger.warn(`aiAlerts.directors lookup failed: ${result.error}`);
    return [];
  }
  return result.data;
}
```

#### 8.6 `dispatchCustomerPriceEmail` (115-133 qator)

**Oldin (116-121 qator):**
```typescript
const customerRow = await db.execute<{ email: string | null; name: string | null }>(sql`
  SELECT ca.email, ca.name
  FROM customer_orders co
  LEFT JOIN customer_accounts ca ON ca.id::text = co.customer_id
  WHERE co.order_number = ${event.orderId}
  LIMIT 1
`).then((r) => r.rows[0]).catch(() => null);
```

**Keyin:**
```typescript
const contactResult = await this.alertsRepo.findCustomerByOrderNumber(event.orderId);
const customerRow = contactResult.ok ? contactResult.data : null;
```

#### 8.7 `RecipientRow` turi

`ai-alerts.service.ts` da `type RecipientRow` (44-satr) o'chiriladi — endi
`drizzle-ai-alerts.repo.ts` dan import qilinadi:

```typescript
import type { RecipientRow } from '../infrastructure/repositories/drizzle-ai-alerts.repo';
```

---

### Qadam 9 — `ai.module.ts` — yangi provider/service ro'yxatiga qo'shish

**Fayl:** `apps/api/src/modules/ai/ai.module.ts`

Yangi importlarni qo'shing:

```typescript
import { CentralAiService }                from './application/services/central-ai.service';
import { DrizzleAiProviderConfigRepo }      from './infrastructure/repositories/drizzle-ai-provider-config.repo';
import { AI_PROVIDER_CONFIG_REPO }          from './domain/repositories/i-ai-provider-config.repo';
```

`providers` ro'yxatiga qo'shing:

```typescript
CentralAiService,
DrizzleAiProviderConfigRepo,
{ provide: AI_PROVIDER_CONFIG_REPO, useClass: DrizzleAiProviderConfigRepo },
```

`exports` ro'yxatiga qo'shing:

```typescript
CentralAiService,
```

**Izoh:** `DrizzleAiAlertsRepo` va `AI_ALERTS_REPO` — `ai-agents.module.ts` egaligi
(bu P35 OWNED FILE emas). `ai-agents.module.ts` ga flag qo'ying: repo va
`AI_ALERTS_REPO` ni shu modulga register qilish kerak.

**FLAG:** `apps/api/src/modules/ai-agents/ai-agents.module.ts` faylida:
```typescript
// P35 FLAG: DrizzleAiAlertsRepo + AI_ALERTS_REPO provide qilish kerak.
// providers: [
//   DrizzleAiAlertsRepo,
//   { provide: AI_ALERTS_REPO, useClass: DrizzleAiAlertsRepo },
// ]
// AiAlertsService constructor: @Inject(AI_ALERTS_REPO) qo'shildi.
// Egasi bu faylni P35 bilan bir vaqtda o'zgartirmaydi — izolyatsiya.
```
Bu faylga TEG YURMA — flag yoz va davom et.

---

### Qadam 10 — `AIProviderConfig.tsx` — FE sahifasi

**Fayl:** `artifacts/erp-dashboard/src/pages/AIProviderConfig.tsx` (YANGI)

EP dizayn-tizimidan: `EPPageHeader`, `EPCard` ishlatiladi.
`useQuery` → `GET /api/ai/provider-configs`
`useMutation` → `PATCH /api/ai/provider-configs/:provider`

```tsx
/**
 * @page AIProviderConfig
 * @description AI Provayder konfiguratsiyasi — admin sahifasi.
 * BE endpoint: GET/PATCH /api/ai/provider-configs
 * EP Dizayn: EPPageHeader + EPCard + Switch + Badge
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader } from '@/components/ep/EPPageHeader';
import { EPCard }       from '@/components/ep/EPCard';
import { Switch }       from '@/components/ui/switch';
import { Badge }        from '@/components/ui/badge';
import { Button }       from '@/components/ui/button';
import { Input }        from '@/components/ui/input';
import { Label }        from '@/components/ui/label';
import { Skeleton }     from '@/components/ui/skeleton';
import { useToast }     from '@/hooks/use-toast';

interface ProviderConfig {
  id: number;
  provider: 'openai' | 'gemini' | 'claude';
  apiKeyHint: string | null;
  defaultModel: string | null;
  dailyBudgetUsd: string;
  isActive: boolean;
  notes: string | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI (GPT-4o-mini)',
  gemini: 'Google Gemini (1.5 Flash)',
  claude: 'Anthropic Claude',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-green-100 text-green-800',
  gemini: 'bg-blue-100 text-blue-800',
  claude: 'bg-purple-100 text-purple-800',
};

export default function AIProviderConfig() {
  const { t } = useTranslation('ai');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [budgetVal, setBudgetVal] = useState('');

  const { data, isLoading, isError } = useQuery<{ data: ProviderConfig[] }>({
    queryKey: ['/api/ai/provider-configs'],
    queryFn: () => apiRequest('GET', '/api/ai/provider-configs'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ provider, isActive }: { provider: string; isActive: boolean }) =>
      apiRequest('PATCH', `/api/ai/provider-configs/${provider}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/provider-configs'] });
      toast({ title: t('providerConfig.updated') });
    },
    onError: () => toast({ title: t('providerConfig.updateFailed'), variant: 'destructive' }),
  });

  const budgetMutation = useMutation({
    mutationFn: ({ provider, dailyBudgetUsd }: { provider: string; dailyBudgetUsd: number }) =>
      apiRequest('PATCH', `/api/ai/provider-configs/${provider}`, { dailyBudgetUsd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/provider-configs'] });
      toast({ title: t('providerConfig.budgetSaved') });
      setEditing(null);
    },
    onError: () => toast({ title: t('providerConfig.updateFailed'), variant: 'destructive' }),
  });

  if (isLoading) return <Skeleton className="h-64 m-6" />;
  if (isError) return (
    <div className="p-6 text-red-600">{t('providerConfig.loadError')}</div>
  );

  const configs = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="space-y-6 p-6">
      <EPPageHeader
        title={t('providerConfig.title')}
        subtitle={t('providerConfig.subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configs.map((cfg) => (
          <EPCard key={cfg.provider} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${PROVIDER_COLORS[cfg.provider] ?? ''}`}>
                  {cfg.provider.toUpperCase()}
                </span>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {PROVIDER_LABELS[cfg.provider] ?? cfg.provider}
                </p>
              </div>
              <Switch
                checked={cfg.isActive}
                onCheckedChange={(checked) =>
                  toggleMutation.mutate({ provider: cfg.provider, isActive: checked })
                }
                disabled={toggleMutation.isPending}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('providerConfig.dailyBudget')}</Label>
              {editing === cfg.provider ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="50"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const val = parseFloat(budgetVal);
                      if (!isNaN(val) && val > 0) {
                        budgetMutation.mutate({ provider: cfg.provider, dailyBudgetUsd: val });
                      }
                    }}
                    disabled={budgetMutation.isPending}
                  >
                    {t('providerConfig.save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    {t('providerConfig.cancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">${cfg.dailyBudgetUsd}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setBudgetVal(cfg.dailyBudgetUsd);
                      setEditing(cfg.provider);
                    }}
                  >
                    {t('providerConfig.edit')}
                  </Button>
                </div>
              )}
            </div>

            {cfg.apiKeyHint && (
              <div>
                <Label className="text-xs text-muted-foreground">{t('providerConfig.apiKey')}</Label>
                <p className="text-sm font-mono text-muted-foreground">****{cfg.apiKeyHint}</p>
              </div>
            )}

            {cfg.defaultModel && (
              <div>
                <Label className="text-xs text-muted-foreground">{t('providerConfig.model')}</Label>
                <p className="text-sm">{cfg.defaultModel}</p>
              </div>
            )}

            <Badge variant={cfg.isActive ? 'default' : 'secondary'}>
              {cfg.isActive ? t('providerConfig.active') : t('providerConfig.inactive')}
            </Badge>
          </EPCard>
        ))}
      </div>
    </div>
  );
}
```

**Qoidalar:**
- `Qoida-14` (o'chirish): bu sahifada o'chirish yo'q — tasdiq kerak emas.
- `Qoida F1/F2`: `isLoading` + `onError` handler — mavjud.
- `Qoida 21`: inline style yo'q, faqat Tailwind class + EP komponent.
- `Qoida 19`: CRUD mutation bor (`useMutation × 2`).

---

### Qadam 11 — i18n kalitlari qo'shish

**Fayl:** `artifacts/erp-dashboard/src/locales/uz/ai.json`

Faylning oxiriga (oxirgi `}` dan oldin) qo'shing:

```json
,
  "providerConfig": {
    "title": "AI Provayder Konfiguratsiyasi",
    "subtitle": "Har bir AI provayder uchun kunlik byudjet va faollikni boshqaring",
    "dailyBudget": "Kunlik byudjet ($)",
    "apiKey": "API kalit (oxirgi 4 belgi)",
    "model": "Standart model",
    "edit": "O'zgartirish",
    "save": "Saqlash",
    "cancel": "Bekor",
    "active": "Faol",
    "inactive": "Nofaol",
    "updated": "Provayder yangilandi",
    "budgetSaved": "Byudjet saqlandi",
    "updateFailed": "Yangilashda xato",
    "loadError": "Konfiguratsiyani yuklab bo'lmadi"
  }
```

**Fayl:** `artifacts/erp-dashboard/src/locales/ru/ai.json`

```json
,
  "providerConfig": {
    "title": "Настройки AI-провайдеров",
    "subtitle": "Управляйте дневным бюджетом и активностью каждого AI-провайдера",
    "dailyBudget": "Дневной бюджет ($)",
    "apiKey": "API ключ (последние 4 символа)",
    "model": "Модель по умолчанию",
    "edit": "Изменить",
    "save": "Сохранить",
    "cancel": "Отмена",
    "active": "Активен",
    "inactive": "Неактивен",
    "updated": "Провайдер обновлён",
    "budgetSaved": "Бюджет сохранён",
    "updateFailed": "Ошибка обновления",
    "loadError": "Не удалось загрузить конфигурацию"
  }
```

---

## 5. DDL (GATED)

```sql
-- Migration: d6-ai-provider-configs.sql
-- APPROVED: <egasi_ismi> <YYYY-MM-DD>
-- Maqsad: AI provayder konfiguratsiyasi jadvali
-- ⚠️  DDL DARVOZASI: bu faylni psql yoki pnpm drizzle-kit push bilan
--     faqat egasi ruxsatidan keyin ishga tushiring.

CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id                 SERIAL PRIMARY KEY,
  provider           VARCHAR(50) NOT NULL UNIQUE,
  api_key_hint       VARCHAR(20),
  default_model      VARCHAR(100),
  daily_budget_usd   NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  notes              TEXT,
  updated_at         TIMESTAMP DEFAULT NOW(),
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE ai_provider_configs IS
  'AI provayder konfiguratsiyasi. api_key HECH QACHON bu jadvalda saqlanmaydi — faqat .env orqali.';

COMMENT ON COLUMN ai_provider_configs.api_key_hint IS
  'Faqat oxirgi 4 belgi (ko''rsatish uchun). Haqiqiy kalit .env da.';

-- Default seed (is_active = false — admin aktivlashtiradi)
INSERT INTO ai_provider_configs (provider, daily_budget_usd, is_active, notes)
VALUES
  ('openai', 50.00, false, 'gpt-4o-mini — OPENAI_API_KEY env orqali'),
  ('gemini', 50.00, false, 'gemini-1.5-flash — GEMINI_API_KEY env orqali'),
  ('claude', 50.00, false, 'claude-3-haiku — ANTHROPIC_API_KEY env orqali')
ON CONFLICT (provider) DO NOTHING;
```

**Status: GATED — ishga tushirilmaydi.**
**Faylni faqat yozing:** `apps/api/src/database/migrations/d6-ai-provider-configs.sql`

---

## 6. QABUL MEZONI

```
□ 1. BE typecheck: cd apps/api && pnpm tsc --noEmit → 0 xato
□ 2. FE typecheck: cd artifacts/erp-dashboard && pnpm tsc --noEmit → 0 xato
□ 3. lib/db build: pnpm --filter @europrint/db build → 0 xato
□ 4. CentralAiService yaratildi + ai.module.ts da registered
□ 5. DrizzleAiProviderConfigRepo yaratildi + ai.module.ts da registered
□ 6. i-ai-provider-config.repo.ts yaratildi
□ 7. ai-providers-schema.ts — aiProviderConfigs pgTable eksport qilingan
□ 8. DDL migration fayli yozildi, GATED belgisi bor
□ 9. ai-router.service.ts — userId: Number() (String() o'chirildi)
□ 10. ai-router.service.ts — maskPii() helper qo'shildi va ishlatildi
□ 11. ai-alerts.service.ts — db.* import yo'q; alertsRepo inject qilingan
□ 12. drizzle-ai-alerts.repo.ts yaratildi + IAiAlertsRepo to'liq implementatsiya
□ 13. ai-agents.module.ts uchun flag izoh yozildi (P35 TO'G'RIDAN O'ZGARTIRMAYDI)
□ 14. AIProviderConfig.tsx yaratildi — useQuery + useMutation × 2, loading/error
□ 15. uz/ai.json — providerConfig.* kalitlari qo'shildi
□ 16. ru/ai.json — providerConfig.* kalitlari qo'shildi
□ 17. DB proof (DDL migrate qilinsa): INSERT ai_provider_configs → SELECT ko'rinadi
□ 18. maskPii("+998901234567 Ali") → "[MASKED] Ali" (unit test yoki console check)
□ 19. Golden thread regressiya yo'q: ai-router.service GET /api/ai/usage hali ishlaydi
□ 20. reviewer-result-pattern.sh → FAIL: 0 (yangi fayllar uchun)
□ 21. reviewer-array-safety.sh → FAIL: 0
□ 22. AISHA-JARVIS-VIZYON moslik: §2.7 FLAG yozildi; aisha modul ajratish keyingi sprintga belgilandi (§9 FLAG)
```

---

## 7. SELF-VERIFY

### 7.1 TypeScript tekshiruvi

```bash
# Backend
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | head -30

# Frontend
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | head -30

# DB schema package
pnpm --filter @europrint/db build 2>&1 | head -20
```

### 7.2 PII mask tekshiruvi (Node.js inline)

```bash
node -e "
const PII_PATTERNS = [/\+998\d{9}/g, /[A-Z]{2}\d{7}/g, /[\w.-]+@[\w.-]+\.\w{2,}/g, /\b\d{14}\b/g];
function maskPii(text) {
  let m = text;
  for (const p of PII_PATTERNS) m = m.replace(p, '[MASKED]');
  return m;
}
console.log(maskPii('+998901234567 Ali Karimov'));
// Kutilgan: '[MASKED] Ali Karimov'
console.log(maskPii('Passport: AA1234567, email: ali@mail.com'));
// Kutilgan: 'Passport: [MASKED], email: [MASKED]'
"
```

### 7.3 Reviewer skriptlari

```bash
bash scripts/reviewer-result-pattern.sh 2>&1 | grep -E "FAIL|PASS"
bash scripts/reviewer-array-safety.sh   2>&1 | grep -E "FAIL|PASS"
```

### 7.4 DB proof (faqat DDL approved va migrate qilinsa)

```bash
# Docker postgres containerda:
docker exec -it uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "
SELECT provider, daily_budget_usd, is_active FROM ai_provider_configs;
"
# Kutilgan: 3 qator (openai/gemini/claude), is_active=false
```

### 7.5 ai-alerts Qoida-15 tekshiruvi

```bash
grep -n "from '@shared/db'" \
  apps/api/src/modules/ai-agents/common/ai-alerts.service.ts
# Kutilgan: hech narsa (import olib tashlangan)

grep -n "db\.execute\|db\.select\|db\.insert" \
  apps/api/src/modules/ai-agents/common/ai-alerts.service.ts
# Kutilgan: hech narsa
```

### 7.6 Modul DI tekshiruvi (boot)

```bash
pnpm --filter @europrint/api run build 2>&1 | grep -E "error|ERROR" | head -10
# Kutilgan: 0 xato

# Boot (agar Docker ishlamoqda):
curl -s http://localhost:3030/api/auth/health | python -m json.tool
# Kutilgan: {"status":"ok"} yoki {"status":"healthy"}
```

### 7.7 CentralAiService namunaviy chaqiruv

```bash
# Agar token mavjud bo'lsa:
TOKEN="..."
curl -s -X POST http://localhost:3030/api/ai/call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskType":"hr.generate_interview_questions","prompt":"Test savol","userId":1,"cardId":5}' \
  | python -m json.tool
# Kutilgan: {"text":"...","provider":"...","latencyMs":...}
```

---

## 8. COMMIT

### Commit 1 — BE infra (schema + repos + service)

```bash
git add lib/db/src/schema/ai-providers-schema.ts
git add apps/api/src/modules/ai/domain/repositories/i-ai-provider-config.repo.ts
git add apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-provider-config.repo.ts
git add apps/api/src/modules/ai/application/services/central-ai.service.ts
git add apps/api/src/modules/ai/application/services/ai-router.service.ts
git add apps/api/src/modules/ai/ai.module.ts
git add apps/api/src/database/migrations/d6-ai-provider-configs.sql

git commit -m "feat(ai): P35 — CentralAiService + AiProviderConfig DDL + PII masking + userId int fix"
```

### Commit 2 — ai-alerts Qoida-15 fix

```bash
git add apps/api/src/modules/ai-agents/common/ai-alerts.service.ts
git add apps/api/src/modules/ai-agents/infrastructure/repositories/drizzle-ai-alerts.repo.ts

git commit -m "fix(ai-agents): P35 — ai-alerts Qoida-15 (db.* → DrizzleAiAlertsRepo)"
```

### Commit 3 — FE sahifasi + i18n

```bash
git add artifacts/erp-dashboard/src/pages/AIProviderConfig.tsx
git add artifacts/erp-dashboard/src/locales/uz/ai.json
git add artifacts/erp-dashboard/src/locales/ru/ai.json

git commit -m "feat(fe): P35 — AIProviderConfig page + ai.json i18n keys (uz/ru)"
```

**ESLATMA:**
- `git add -A` TAQIQ — faqat yuqoridagi aniq fayllar.
- `apps/api/src/modules/ai-agents/ai-agents.module.ts` bu commit larga KIRMASIN
  (boshqa paket egaligi).
- Har commit dan keyin `git status` tekshiring — kutilmagan fayllar yo'qmi.

---

## 9. QIYINLIKLAR VA EDGE HOLATLAR

### 9.1 `ai-agents.module.ts` izolyatsiya masalasi
`AiAlertsService` konstruktori endi `@Inject(AI_ALERTS_REPO)` talab qiladi.
Bu `ai-agents.module.ts` da `DrizzleAiAlertsRepo` register qilinmasini talab qiladi.
Bu fayl P35 OWNED FILE emas.

**Yechim:** Fayl boshiga quyidagi izoh qo'shing (fayl tarkibini o'zgartirmang):
```typescript
// P35 ACTION REQUIRED (ai-agents.module.ts egasi):
// providers ga qo'shing:
//   DrizzleAiAlertsRepo,
//   { provide: AI_ALERTS_REPO, useClass: DrizzleAiAlertsRepo },
// Import:
//   import { DrizzleAiAlertsRepo, AI_ALERTS_REPO }
//     from './infrastructure/repositories/drizzle-ai-alerts.repo';
```
So'ngra egani xabardor qiling.

### 9.2 `aiProviderConfigs` jadval migration trigger vaqti
`DrizzleAiProviderConfigRepo.findByProvider()` jadval mavjud bo'lmasa Drizzle xato
beradi. `safeCall` wrapper uni `Err(...)` ga o'giradi — xizmat ishlashda davom etadi.
`AiRouterService.checkBudget()` agar `getActiveBudget` `Err` qaytarsa `DAILY_BUDGET_USD`
konstantasiga fallback qilishi kerak. Bu holat joriy kodda yo'q — **tuzatish kerak**:

**`ai-router.service.ts` `checkBudget` metodini yangilang:**

```typescript
// Joriy holat (51-59 qator):
private async checkBudget(): Promise<Result<AiResponse> | null> {
  const spentResult = await this.getTodaySpent();
  if (isErr(spentResult)) return Err(spentResult.error);
  if (spentResult.data >= DAILY_BUDGET_USD) {
    // ...
  }
  return null;
}
```

Bu metodda `DAILY_BUDGET_USD` hardcoded qoladi — bu FALLBACK sifatida to'g'ri.
`AiProviderConfigRepo` integration keyinchalik (`P35+` sprint) qo'shiladi.
Hozirgi commit uchun fallback saqlanadi.

### 9.3 `uz-cyr` locale
`artifacts/erp-dashboard/src/locales/uz-cyr/ai.json` ham mavjud ehtimol.
OWNED FILE emas — o'zgartirma. Egasi sync qiladi.

### 9.4 `maskPii` — PINFL false positive
`/\b\d{14}\b/` — 14 raqamli sequence; agar narx `12345678901234` bo'lsa noto'g'ri
mask qilishi mumkin. Bu konservativ yondashuv — ERP da 14 raqam PINFL deb hisoblanadi.
Kelajakda regex refinement qilish mumkin.

---

## 10. XULOSA

P35 quyidagi 4 asosiy muammoni hal qiladi:

| # | Muammo | Hal yo'li |
|---|--------|-----------|
| 1 | `central-ai.service.ts` yo'q | Yaratiladi — markazlashtirilgan AI + cardId |
| 2 | `ai_provider_configs` sxemada yo'q | DDL + Drizzle schema + repo (GATED) |
| 3 | PII AI loglarda saqlanmoqda | `maskPii()` helper + `buildUsageLogPayload` wrap |
| 4 | `ai-alerts.service.ts` Qoida-15 buzadi | `DrizzleAiAlertsRepo` ajratildi |

**Wave 1 maqsadi:** Poydevor infra to'g'rilash — boshqa modullar `CentralAiService`
dan foydalanishini talab qiladi.
