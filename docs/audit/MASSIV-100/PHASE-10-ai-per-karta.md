# FAZA 10 — AI per-KARTA (AI-kalit-gated) — BAJARUVCHI DIREKTIVASI

> **Bajaruvchi:** Muslimbek (bosh-dasturchi nazoratida)
> **Manba-reja:** [`00-MASTER-REJA.md`](00-MASTER-REJA.md) → FAZA 10
> **Bo'shliq-manba:** [`../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`](../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md) qator 19 (ai = 38%)
> **Spec-manba:** [`../decisions/01-org-kartalar.md`](../decisions/01-org-kartalar.md) → EP-ORG-030, 031, 032, 081, 087, 093, 098, 016, 017
> **Bog'liqlik:** FAZA 0 (org_departments kanonik karta), FAZA 1 (employee_cards M:N), FAZA 3 (razryad_history + imtihon), FAZA 5 (ckp_fact_values), FAZA 9 (lifecycle). **Bu fazalar tugagan bo'lishi SHART** (ai_fit_scores.card_id → org_departments; manba-yig'ish ckp_fact_values'dan o'qiydi). Agar tugamagan bo'lsa — FAZA 10 strukturasini quradi, lekin manba-yig'ish ulanish-nuqtalari "TODO: FAZA-N tugagach ulanadi" izoh bilan qoldiriladi (fabrikatsiya YO'Q).
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, batafsil, noaniqliksiz.

---

## § 0. KONTEKST + MAQSAD

### 0.1 Vizyon (egasi so'zi bilan)

> "Har kartada o'z AI'si bor. AI xodim↔karta mosligini baholaydi (ЦКП/test/davomat/sifat/rahbar fikri asosida), hisobot yozadi, AI'lar o'zaro ishlaydi. Markaziy AI har karta↔xodim mosligini baholaydi." (EP-ORG-030)
>
> "Moslik PDF → xodim + rahbar + HR (har biriga mos darajada)." (EP-ORG-031)
>
> "Past moslikda AI OGOHLANTIRADI + sabab so'raydi, lekin BLOKLAMAYDI — owner qaror qiladi." (EP-ORG-093)

Demak: **karta-AI = markaziy bitta AI-xizmat**, har xodim↔karta juftligi uchun mexanizm:
1. **Manbalarni avto-yig'adi** — ЦКП (FAZA 5 `ckp_fact_values`), MES (`mes_production_sessions`), QC (`qc_inspections`), davomat (`attendance_records`), razryad (`razryad_levels`), imtihon (`ai_exam_attempts`).
2. **AI-baho beradi** — 0-100 moslik bali + JSONB hisobot (kuchli tomonlar/bo'shliqlar/xulosa) + bonus-tavsiya + voris-nomzod bayrog'i.
3. **PDF-portret** chiqaradi — uch darajada (xodim/rahbar/HR).
4. **Event-trigger + batch** — imtihon tugaganda / razryad o'zgarganda avto-baholaydi; kunlik/haftalik batch hammasini baholaydi.
5. **Kamera-cross-check** — `org_departments.camera_zone_id` + davomat ziddiyatini AI tekshiradi (struktura; AI-vision kalit-gated).
6. **Past-moslik OGOHLANTIRADI** (bloklamaydi) — `fit_score < threshold` → ogohlantirish bayrog'i + sabab maydoni, lekin biriktirish bloklanmaydi.

### 0.2 Maqsad (bu faza)

`AiFitService` allaqachon REAL Anthropic kalit bilan ishlaydigan karkasga ega (prompt qur → AiRouter → parse → `ai_fit_scores` saqla, AI ishlamasa graceful fallback). **Bu fazada uni TO'LIQ vizyon-MEXANIZMIga yetkazamiz:**

| # | Vazifa | Holat (live-tasdiq) |
|---|--------|--------------------|
| T1 | **Manba-avto-yig'ish** — `ai_fit_scores` faqat qo'lda JSON bilan to'ldiriladi; manbalar (ЦКП/MES/QC/davomat) ulanmagan. | `AiFitService.evaluate` faqat `dto.employeeProfile`/`dto.cardRequirements` JSON oladi (`ai-fit.service.ts:59-86`); DB'dan hech narsa o'qimaydi. |
| T2 | **AI-grading (imtihon)** — `ai_exam_attempts` mavjud, lekin AI-baholash ulanmagan; score NULL. | `ai-exam.service.ts:44 submitAttempt` repo'ga delegate; AI-grading yo'q. |
| T3 | **Portret-PDF** — yo'q. | Hech qanday PDF-eksport yo'q (`grep` 0). |
| T4 | **Event-trigger + batch** — yo'q. | `AiFitService`da `@OnEvent` yoki cron yo'q. |
| T5 | **Kamera-cross-check** — yo'q (struktura). | `org_departments.camera_zone_id` (text) mavjud (DB-tasdiq), lekin AI-link yo'q. |
| T6 | **Past-moslik warn** — yo'q. | `AiFitService`da threshold/warn maydoni yo'q. |

**ai_ckp_scores 0** (DB-tasdiq: `SELECT count(*) FROM ai_ckp_scores → 0`) — bu jadval FAZA 5 (ЦКП) tomonidan to'ldiriladi; FAZA 10 uni faqat manba sifatida O'QIYDI (yozmaydi).

### 0.3 Bu faza NIMA EMAS (chegara)

- ЦКП kunlik fakt-yozish (`ckp_fact_values` to'ldirish) — bu FAZA 5. FAZA 10 faqat o'qiydi.
- Razryad o'sish execution (imtihon→tasdiq→o'zgarish) — FAZA 3. FAZA 10 faqat imtihonni AI-baholaydi.
- Payroll bonus-yozish — FAZA 4. FAZA 10 faqat `bonus_recommendation` (TAVSIYA) yozadi, payroll'ga yozmaydi.

---

## § 1. QOIDALAR-BLOKI (HAR BOSQICHDA MAJBURIY)

> Bu blok har bosqichda amal qiladi. Buzilishi = bosqich rad.

### 1.1 Kod uslubi
- **Result<T>** — barcha repo/service metodlari `Promise<Result<T>>` (`@common/result`: `Ok`/`Err`/`isOk`/`safeCall`). `throw new Error()` / `return null` TAQIQ (Qoida 1). AI ishlamasa ham service THROW qilmaydi — graceful fallback (mavjud `evaluate` shunday).
- **Zod** — har `@Body()`/`@Query()` controller metodi Zod schema bilan `parse` (Qoida 3). `class-validator` TAQIQ.
- **Drizzle** — barcha DB CRUD Drizzle ORM orqali (`@europrint/schemas` barrel). Raw `sql` faqat murakkab agregat + izoh (Qoida 4). Service ichida to'g'ridan `db.*` TAQIQ — faqat repo orqali (Qoida 15).
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13). AiFitService 174 qator → yangi vazifalarni alohida service'larga ajrat (`ai-fit-collector.service.ts`, `ai-fit-portrait.service.ts`, `ai-fit-batch.service.ts`).
- **Konstantalar** — magic number TAQIQ (Qoida 12); `apps/api/src/common/constants/business.constants.ts`ga yoz (masalan `AI_FIT_WARN_THRESHOLD = 60`).

### 1.2 Regress-himoya (Q-39 / Q-46)
- **Ishlab turgan + to'g'ri** kod/funksiya/sahifa/element HECH QACHON o'chirilmaydi. `AiFitService.evaluate/listScores/getReport`, `AIFitScores.tsx`, `ai-fit.controller.ts` — HAMMASI ishlaydi (live: `ai_fit_scores` id=3 row bor) → SAQLANADI, faqat KENGAYTIRILADI.
- **Buzuq/o'lik/soxta/dublikat** kod TO'LIQ o'chiriladi (chala emas). O'chirishdan oldin: ishlamasligini Q-29 verify + import-yo'qligini `grep` bilan tasdiqla.
- O'zgarishdan keyin: avval ishlagan `POST /api/ai/fit/evaluate` (qo'lda JSON) HAMON ishlashi SHART (faqat manba-yig'ish QO'SHILADI, eski yo'l o'chmaydi).

### 1.3 Fabrikatsiya TAQIQ (Q-40)
- AI-kalit yo'q (`ai_provider_configs`: openai/gemini/claude is_active=**false**, DB-tasdiq) → AI-baho SOXTA qiymat yozma. AI ishlamasa → graceful fallback (mavjud: `fit_score=50, fit_report={raw:'error'}`) yoki "AI-kalit kerak" status. **fit_score'ni qo'ldan to'qima.**
- Manba (ЦКП/MES/QC) yo'q yoki bo'sh → yig'ilgan profil'da o'sha maydon `null`/`absent` — soxta raqam emas.
- AI-kalit = OWNER-DATA (§ 9). Faqat MEXANIZM quriladi.

### 1.4 Verify (Q-29 / Q-32 / Q-40)
- Har bosqich oxiri: `tsc` GREEN (o'z fayllarda 0 xato) + END-TO-END rollback-tx DB-proof (`_audit/bproof-ai-fit-*.cjs`: kirit→oqdi→ko'rindi→ROLLBACK) + jonli isbot (HTTP 200/201 + DB row).
- Struktura-only YETARLI EMAS. "Ishlaydi ≠ to'g'ri" — DB-proof + biznes-qoida + vizyon-moslik.
- Server tushsa (Q-44 Windows nest-watch) → static fallback (tsc + diff o'qish + rollback-tx DB-proof); jonli-HTTP server qaytgach.

### 1.5 EP dizayn (Q3, Qoida 21/41/42/43)
- FE: `var(--ep-*)` token + EP komponent (`components/ep`: `EPPageHeader`/`EPCard`/`EPStatusPill`/`EPLoader`/`EPErrorState`) + `components/ui`. Xom rang/inline-style TAQIQ (`AIFitScores.tsx` allaqachon `var(--ep-green/blue/yellow/red)` ishlatadi — namuna).
- Tab ≤2 daraja. Har forma REAL saqlaydi (FE mutation → BE → DB → qayta-yuklashda ko'rinadi — F1/F2).
- Mavjud joylashuv saqlanadi (AIFitScores `EPPageHeader` + dialog pattern).

### 1.6 Migration
- `migrations-drift.ts` idempotent (`CREATE TABLE IF NOT EXISTS` / `ALTER ... ADD COLUMN IF NOT EXISTS`). `CREATE TABLE`/`DROP`/yangi ustun faqat `APPROVED:` izoh bilan (Q-35). Bu fazada APPROVED migrationlar § 4'da.

### 1.7 Commit
- Faqat o'z fayllar: `git add <aniq-fayl>` (HECH QACHON `-A`, Q-23). `--no-verify` (pre-commit dizayn-token/no-stub o'tmasa, sabab bilan). Co-Authored-By trailer.
- Har bosqich oxirida commit (Q-33 boshlangan ish to'liq).

### 1.8 Atama
- Muloqotda doim **"karta"** (node/tugun/otdeleniye EMAS). `card_id` = `org_departments.id` (FAZA 0 kanonik).

---

## § 2. JORIY HOLAT (fayl:satr + DB-fakt — live-tasdiqlangan)

### 2.1 Mavjud kod (ishlaydi — SAQLANADI, kengaytiriladi)

| Fayl | Satr | Holat |
|------|------|-------|
| `apps/api/src/modules/ai/application/services/ai-fit.service.ts` | 1-174 | **REAL.** `evaluate(dto)` → `buildRequest` (prompt qur) → `aiRouter.call` → `parseAiResponse` → `repo.insertScore`. AI ishlamasa fallback row (`fit_score=50`). `listScores`, `getReport` ham bor. ✅ |
| `apps/api/src/modules/ai/presentation/ai-fit.controller.ts` | 1-64 | **REAL.** `@Controller('ai/fit')`, `@Roles(SUPER_ADMIN, DIRECTOR, HR_MANAGER)`. `POST evaluate`, `GET scores`, `GET report/:employeeId`. ✅ |
| `apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-fit.repo.ts` | 1-88 | **REAL.** `insertScore`/`findLatestByEmployee`/`listScores` Drizzle over `aiFitScores`. ✅ |
| `apps/api/src/modules/ai/domain/repositories/i-ai-fit.repo.ts` | 1-49 | **REAL.** Interface + `AI_FIT_REPO` Symbol. ✅ |
| `apps/api/src/modules/ai/ai-fit.module.ts` | 1-29 | **REAL.** Registered: `app.module.ts:48,147`. ✅ |
| `apps/api/src/modules/ai/application/services/ai-router.service.ts` | 1-305 | **REAL.** `call(req)` → budget-check → provider-order → `callOpenAi`/`callGemini`/`callClaude`. Anthropic SDK `:244-270`. Result<T>. ✅ |
| `apps/api/src/modules/ai/domain/types/ai.types.ts` | 1-156 | `AiTaskType` (41 task), `TASK_PROVIDER_MAP`, `PROVIDER_MODELS`. `hr.performance_review` → openai. ✅ |
| `apps/api/src/shared/db/schema-ai-fit.ts` | 1-56 | `aiFitScores`, `aiCkpScores`, `aiCkpChatLogs` Drizzle defs. ✅ |
| `apps/api/src/modules/ai/application/services/ai-exam.service.ts` | 1-58 | `assignExamToCard` (org_function_id + razryad), `submitAttempt` — **AI-grading YO'Q** (repo delegate). ⚠️ |
| `apps/api/src/modules/ai/application/services/central-ai.service.ts` | 1-30+ | Markaziy AI gateway (JWT'dan card_id). ✅ |
| `artifacts/erp-dashboard/src/pages/AIFitScores.tsx` | 1-312 | **REAL FE.** Ro'yxat + evaluate-dialog + report-dialog. EP token + komponent. ✅ |
| `artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx` | — | `ai/fit` route. ✅ |
| `artifacts/erp-dashboard/src/components/sidebar/constants.ts` | — | `ai/fit` sidebar yozuvi. ✅ |
| `apps/api/src/shared/db/migrations/ai-p36-fit-ckp-slice-2026-06-21.sql` | 1-54 | APPROVED. 3 jadval + indexlar. ⚠️ izohда `card_id` → `org_functions.id` (FAZA 0 retire → org_departments.id). |

### 2.2 DB-fakt (live `node _audit/q.cjs`, 2026-06-25)

```
ai_fit_scores      → 1 qator (id=3, employee_id=1, card_id=1, fit_score=50.00, ai_provider=NULL, succession=false)
                     ^ Bu FALLBACK row (ai_provider=NULL = AI ishlamadi, fit_score=50 default). REAL AI-baho hali yo'q.
ai_ckp_scores      → 0 qator (FAZA 5 to'ldiradi; FAZA 10 o'qiydi)
ai_ckp_chat_logs   → 0 qator (FAZA 5 chatbot to'ldiradi)
ai_exam_attempts   → mavjud (AI-grading ulanmagan)
succession_plans   → mavjud
ai_provider_configs→ openai/gemini/claude HAMMASI is_active=FALSE (AI-kalit YO'Q — owner beradi)
org_departments    → 144 qator (kanonik karta). AI-relevant ustunlar:
                       razryad_level_id (integer), camera_zone_id (text), telegram_group_id (text),
                       tskp (text), tskp_ru (text), tskp_measurement_unit (varchar), tskp_target (integer)
employee_cards     → 30 qator. Ustunlar: id, employee_id, card_id, is_primary, is_active,
                       assigned_at, ended_at, is_acting, acting_supplement
Manba-jadvallar    → attendance_records, mes_production_sessions, qc_inspections, razryad_levels — HAMMASI mavjud
```

### 2.3 Bo'shliq xulosasi

`AiFitService.evaluate` mexanizmi to'liq ishlaydi, lekin **manbasi qo'lda JSON** — vizyon "ЦКП/MES/QC/davomat avto-yig'ish"ni talab qiladi. Qolgan 5 vazifa (T2-T6) umuman yo'q.

---

## § 3. BOSQICHMA-BOSQICH (har bosqich: fayl · OLDIN · KEYIN · sabab)

> Tartib bog'liqlik bo'yicha. Har bosqich oxirida § 8 self-verify + commit.

### BOSQICH 10.1 — Manba-avto-yig'ish (T1) — `AiFitCollectorService`

**Maqsad:** `ai_fit_scores` baholashidan OLDIN, xodim↔karta profilini DB manbalaridan AVTO yig'ish: ЦКП (FAZA 5), MES, QC, davomat, razryad. Qo'lda JSON yo'li SAQLANADI (override sifatida).

**Yangi fayl 1:** `apps/api/src/modules/ai/domain/repositories/i-ai-fit-source.repo.ts`

```typescript
/**
 * @module i-ai-fit-source.repo
 * @description Domain interface — AI-fit manba-yig'ish (read-only) repo.
 *   Xodim↔karta uchun ЦКП/MES/QC/davomat/razryad faktlarini o'qiydi.
 * @layer Domain (AI)
 */
import type { Result } from '@common/result';

/** Bitta xodim↔karta uchun yig'ilgan xom manba (AI promptiga kiradi). */
export interface FitSourceFacts {
  employeeId:      number;
  cardId:          number;
  // ЦКП (FAZA 5 ckp_fact_values; bo'sh bo'lsa null — fabrikatsiya yo'q)
  ckpAchievedPct:  number | null;   // oxirgi 30 kun o'rtacha bajarilish %
  ckpSampleDays:   number;          // nechta kunlik fakt topildi (0 = manba yo'q)
  // MES (mes_production_sessions)
  mesOeeAvg:       number | null;
  mesSessions:     number;
  // QC (qc_inspections)
  qcPassRate:      number | null;   // o'tgan / jami
  qcInspections:   number;
  // Davomat (attendance_records)
  attendanceRate:  number | null;   // hozir bo'lgan / kutilgan
  attendanceDays:  number;
  // Razryad (org_departments.razryad_level_id → razryad_levels)
  cardRazryadLevel: number | null;
  cardRazryadName:  string | null;
  // Imtihon (ai_exam_attempts oxirgi)
  lastExamScore:   number | null;
}

export interface IAiFitSourceRepo {
  /** Xodim↔karta uchun barcha manbalarni yig'adi (read-only). Manba bo'sh → null maydon. */
  collectFacts(employeeId: number, cardId: number, sinceDays: number): Promise<Result<FitSourceFacts>>;
}

export const AI_FIT_SOURCE_REPO = Symbol('AI_FIT_SOURCE_REPO');
```

**Yangi fayl 2:** `apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-fit-source.repo.ts`

```typescript
/**
 * @module drizzle-ai-fit-source.repo
 * @description AI-fit manba-yig'ish — read-only agregat so'rovlar (Drizzle/raw).
 *   Har manba o'z try-blokida; manba jadval bo'sh/yo'q → o'sha maydon null
 *   (FABRIKATSIYA YO'Q). Result<T>.
 * @layer Infrastructure (AI)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Result } from '@common/result';
import { typedExecute } from '@shared/db/typed-execute';
import { IAiFitSourceRepo, FitSourceFacts } from '../../domain/repositories/i-ai-fit-source.repo';

@Injectable()
export class DrizzleAiFitSourceRepo implements IAiFitSourceRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async collectFacts(employeeId: number, cardId: number, sinceDays: number): Promise<Result<FitSourceFacts>> {
    return safeCall(async () => {
      const days = Number.isFinite(sinceDays) && sinceDays > 0 ? Math.min(sinceDays, 365) : 30;
      // Har manba alohida — biri xato bersa boshqasi to'xtamaydi.
      const ckp        = await this.ckp(employeeId, days);
      const mes        = await this.mes(employeeId, days);
      const qc         = await this.qc(employeeId, days);
      const attendance = await this.attendance(employeeId, days);
      const razryad    = await this.razryad(cardId);
      const exam       = await this.lastExam(employeeId, cardId);
      return {
        employeeId, cardId,
        ckpAchievedPct: ckp.pct, ckpSampleDays: ckp.days,
        mesOeeAvg: mes.oee, mesSessions: mes.count,
        qcPassRate: qc.rate, qcInspections: qc.count,
        attendanceRate: attendance.rate, attendanceDays: attendance.days,
        cardRazryadLevel: razryad.level, cardRazryadName: razryad.name,
        lastExamScore: exam,
      };
    });
  }

  // NOTE: ckp_fact_values FAZA 5 jadvali. Tugamagan bo'lsa — bu so'rov 0/null qaytaradi
  // (jadval bo'sh) — bu TO'G'RI (manba yo'q = null, fabrikatsiya emas).
  private async ckp(employeeId: number, days: number): Promise<{ pct: number | null; days: number }> {
    try {
      const rows = await typedExecute<{ pct: string | null; n: string }>(sql`
        SELECT AVG(CASE WHEN target_value > 0 THEN actual_value::float / target_value * 100 END) AS pct,
               COUNT(*) AS n
        FROM ckp_fact_values
        WHERE employee_id = ${employeeId}
          AND fact_date >= NOW() - (${days} || ' days')::interval`);
      const r = rows[0];
      return { pct: r?.pct != null ? Number(r.pct) : null, days: r ? Number(r.n) : 0 };
    } catch { return { pct: null, days: 0 }; }
  }

  private async mes(employeeId: number, days: number): Promise<{ oee: number | null; count: number }> {
    try {
      const rows = await typedExecute<{ oee: string | null; n: string }>(sql`
        SELECT AVG(oee)::text AS oee, COUNT(*) AS n
        FROM mes_production_sessions
        WHERE operator_id = ${employeeId}
          AND created_at >= NOW() - (${days} || ' days')::interval`);
      const r = rows[0];
      return { oee: r?.oee != null ? Number(r.oee) : null, count: r ? Number(r.n) : 0 };
    } catch { return { oee: null, count: 0 }; }
  }

  private async qc(employeeId: number, days: number): Promise<{ rate: number | null; count: number }> {
    try {
      const rows = await typedExecute<{ passed: string; total: string }>(sql`
        SELECT COUNT(*) FILTER (WHERE result = 'pass') AS passed, COUNT(*) AS total
        FROM qc_inspections
        WHERE inspector_id = ${employeeId}
          AND created_at >= NOW() - (${days} || ' days')::interval`);
      const r = rows[0];
      const total = r ? Number(r.total) : 0;
      return { rate: total > 0 ? Number(r!.passed) / total * 100 : null, count: total };
    } catch { return { rate: null, count: 0 }; }
  }

  private async attendance(employeeId: number, days: number): Promise<{ rate: number | null; days: number }> {
    try {
      const rows = await typedExecute<{ present: string; total: string }>(sql`
        SELECT COUNT(*) FILTER (WHERE status = 'present') AS present, COUNT(*) AS total
        FROM attendance_records
        WHERE employee_id = ${employeeId}
          AND date >= NOW() - (${days} || ' days')::interval`);
      const r = rows[0];
      const total = r ? Number(r.total) : 0;
      return { rate: total > 0 ? Number(r!.present) / total * 100 : null, days: total };
    } catch { return { rate: null, days: 0 }; }
  }

  private async razryad(cardId: number): Promise<{ level: number | null; name: string | null }> {
    try {
      const rows = await typedExecute<{ level: number | null; name: string | null }>(sql`
        SELECT rl.level AS level, rl.name AS name
        FROM org_departments od
        LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
        WHERE od.id = ${cardId}`);
      const r = rows[0];
      return { level: r?.level ?? null, name: r?.name ?? null };
    } catch { return { level: null, name: null }; }
  }

  private async lastExam(employeeId: number, cardId: number): Promise<number | null> {
    try {
      const rows = await typedExecute<{ score: number | null }>(sql`
        SELECT score FROM ai_exam_attempts
        WHERE user_id = ${employeeId} AND org_function_id = ${cardId} AND score IS NOT NULL
        ORDER BY created_at DESC LIMIT 1`);
      return rows[0]?.score ?? null;
    } catch { return null; }
  }
}
```

> ⚠️ **Ustun-nomlar tekshiruvi (Q-29):** har manba so'rovini yozishdan OLDIN ustun nomlarini tasdiqla:
> `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='mes_production_sessions'"` (operator_id/oee bormi?), shu tarzda `qc_inspections` (result/inspector_id), `attendance_records` (status/date/employee_id), `ckp_fact_values` (FAZA 5 — agar tugamagan bo'lsa, so'rov try-catch bilan null qaytaradi). **Taxmin YO'Q** — ustun yo'q bo'lsa try-catch null beradi, lekin so'rovni real ustunga moslab yoz.

**O'zgartiriladigan fayl:** `apps/api/src/modules/ai/application/services/ai-fit.service.ts`

**OLDIN** (`:59-86`): `evaluate(dto)` faqat `dto.employeeProfile`/`dto.cardRequirements`'dan prompt quradi.

**KEYIN:** `evaluate(dto)` ichida, agar `dto.autoCollect !== false` bo'lsa, `sourceRepo.collectFacts` chaqirib yig'ilgan faktlarni `employeeProfile`ga MERGE qiladi (qo'lda JSON ustun turadi):

```typescript
// ai-fit.service.ts — konstruktorга qo'sh:
//   @Inject(AI_FIT_SOURCE_REPO) private readonly sourceRepo: IAiFitSourceRepo,
// FitEvaluateSchema'ga qo'sh:  autoCollect: z.boolean().default(true), sinceDays: z.number().int().positive().max(365).default(30),

async evaluate(dto: FitEvaluateDto): Promise<Result<FitScoreRow>> {
  let mergedProfile = dto.employeeProfile;
  if (dto.autoCollect) {
    const facts = await this.sourceRepo.collectFacts(dto.employeeId, dto.cardId, dto.sinceDays);
    if (isOk(facts)) {
      // Avto-yig'ilgan faktlar + qo'lda override (qo'lda ustun turadi).
      mergedProfile = { autoSources: facts.data, ...dto.employeeProfile };
    } else {
      this.logger.warn(`AI-fit manba-yig'ish ishlamadi (employee=${dto.employeeId}): ${facts.error} — qo'lda profil bilan davom`);
    }
  }
  const req = this.buildRequest({ ...dto, employeeProfile: mergedProfile });
  // ... qolgan oqim O'ZGARMAYDI (aiRouter.call → parse → insertScore + fallback) ...
}
```

**Sabab:** Vizyon "manba-avto-yig'ish (ЦКП/MES/QC/davomat → AI)" (EP-ORG-030). Qo'lda yo'l SAQLANADI (regress-himoya, Q-46) — `autoCollect=false` bilan eski xulq. Manba bo'sh → null maydon (fabrikatsiya yo'q, Q-40).

**Module o'zgarishi** (`ai-fit.module.ts`): providers'ga `DrizzleAiFitSourceRepo` + `{ provide: AI_FIT_SOURCE_REPO, useClass: DrizzleAiFitSourceRepo }` qo'sh.

---

### BOSQICH 10.2 — AI-grading (imtihon) (T2)

**Maqsad:** `ai_exam_attempts` topshirilganda javoblarni AI baholaydi → `score` yoziladi → AI-fit'ga ulanadi. Hozir `submitAttempt` faqat repo'ga delegate (score NULL).

**O'zgartiriladigan fayl:** `apps/api/src/modules/ai/application/services/ai-exam.service.ts`

**OLDIN** (`:44-47`):
```typescript
async submitAttempt(attemptId: string, answers: Record<string, string>): Promise<Result<Record<string, unknown>>> {
  this.logger.log(`Submitting AI exam attempt: ${attemptId}`);
  return this.repo.submitAttempt(attemptId, answers);
}
```

**KEYIN:** AI-grading qadami qo'shiladi (AiRouter orqali `hr.evaluate_candidate` task), keyin score repo'ga yoziladi:
```typescript
constructor(
  private readonly repo: DrizzleAiExamRepo,
  private readonly aiRouter: AiRouterService,   // YANGI inject
) {}

async submitAttempt(attemptId: string, answers: Record<string, string>): Promise<Result<Record<string, unknown>>> {
  this.logger.log(`Submitting AI exam attempt: ${attemptId}`);
  const detail = await this.repo.findAttemptById(attemptId);
  if (!isOk(detail)) return Err(detail.error);
  if (!detail.data) return Err(`Urinish topilmadi: ${attemptId}`);

  // AI-grading: savol+javoblarni AIga ber → 0-100 ball + izoh. AI yo'q → null score (fabrikatsiya yo'q).
  const grade = await this.gradeWithAi(detail.data, answers);
  return this.repo.submitAttempt(attemptId, answers, grade);  // repo signature kengaytiriladi (score, explanation)
}

private async gradeWithAi(detail: AiExamDetail, answers: Record<string, string>): Promise<{ score: number | null; explanation: string }> {
  const prompt = [
    'You are an exam grader. Grade the answers 0-100 based on correctness.',
    `Questions+expected (JSON): ${JSON.stringify(detail.questions ?? [])}`,
    `Candidate answers (JSON): ${JSON.stringify(answers)}`,
    'Respond STRICT JSON: {"score": <0-100>, "explanation": string}',
  ].join('\n');
  const res = await this.aiRouter.call({ taskType: 'hr.evaluate_candidate', prompt, maxTokens: 500, temperature: 0.2 });
  if (!isOk(res)) return { score: null, explanation: `AI-grading ishlamadi: ${res.error}` };
  // parse defensively (AiFitService.extractJson pattern bilan bir xil — shared helper'ga ko'chir)
  const parsed = this.parseGrade(res.data.text);
  return parsed;
}
```

> **Repo signature:** `drizzle-ai-exam.repo.ts`'da `submitAttempt(attemptId, answers, grade?)` — `grade.score`/`grade.explanation` ai_exam_attempts'ga UPDATE. **Avval o'qi** `drizzle-ai-exam.repo.ts`'ni; ustun nomlarini (`score`, `ai_explanation`/`explanation`) DB'dan tasdiqla. Module'ga `AiRouterService` import bo'lishi kerak (AiExamService qaysi module'da — tekshir; AiModule export qiladi).

**Sabab:** Vizyon "AI-grading (imtihon)" (EP-ORG-046/054). AI yo'q → `score=null` (fabrikatsiya yo'q). Imtihon-natija FAZA 3 razryad-o'sishiga va FAZA 10 manba-yig'ishiga (`lastExamScore`) ulanadi.

---

### BOSQICH 10.3 — Portret-PDF (T3) — `AiFitPortraitService`

**Maqsad:** Xodim↔karta AI-fit hisobotini PDF qilib eksport — uch darajada (xodim/rahbar/HR; EP-ORG-031, RBAC-gated maxfiylik EP-ORG-042).

**Yangi fayl:** `apps/api/src/modules/ai/application/services/ai-fit-portrait.service.ts`

```typescript
/**
 * @module ai-fit-portrait.service
 * @description AI-fit portret-PDF eksport. Eng so'nggi ai_fit_scores rowdan
 *   audience-darajali (employee/manager/hr) PDF yasaydi. PDF kutubxonasi
 *   loyihada mavjud bo'lganini ishlatadi (pdfkit/puppeteer — tekshir).
 * @layer Application (AI)
 */
import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { AI_FIT_REPO, type IAiFitRepo } from '../../domain/repositories/i-ai-fit.repo';

export type PortraitAudience = 'employee' | 'manager' | 'hr';

@Injectable()
export class AiFitPortraitService {
  constructor(@Inject(AI_FIT_REPO) private readonly repo: IAiFitRepo) {}

  /** Audience-darajali PDF buffer. employee: bonus/voris ko'rinmaydi; hr: hammasi. */
  async generatePortrait(employeeId: number, audience: PortraitAudience): Promise<Result<Buffer>> {
    const latest = await this.repo.findLatestByEmployee(employeeId);
    if (!isOk(latest)) return Err(latest.error);
    if (!latest.data) return Err(`AI-fit hisobot yo'q: xodim ${employeeId}`);
    const row = latest.data;
    const visible = this.redactByAudience(row, audience);   // EP-ORG-042 maxfiylik
    return this.renderPdf(visible);   // PDF kutubxona orqali; Result<Buffer>
  }

  private redactByAudience(row: FitScoreRow, audience: PortraitAudience): Record<string, unknown> {
    const base = { employeeId: row.employeeId, cardId: row.cardId, fitScore: row.fitScore, report: row.fitReport };
    if (audience === 'employee') return base;                                   // bonus/voris YASHIRIN
    if (audience === 'manager') return { ...base, successionCandidate: row.successionCandidate };
    return { ...base, successionCandidate: row.successionCandidate, bonusRecommendation: row.bonusRecommendation }; // hr = hammasi
  }

  // renderPdf — loyihadagi mavjud PDF helper'ni ishlat (grep 'pdfkit'|'puppeteer'|'PDFDocument').
  // Mavjud bo'lmasa: HTML→string qaytaruvchi vaqtinchalik fallback EMAS — owner'ga PDF-lib tanlovini so'ra (§9).
}
```

**Controller endpoint** (`ai-fit.controller.ts`'ga qo'sh):
```typescript
@Get('portrait/:employeeId')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
async portrait(@Param('employeeId', ParseIntPipe) employeeId: number, @Query('audience') audience: string, @Res() res: Response) {
  const aud = PortraitAudienceSchema.parse(audience);   // Zod enum default 'hr'
  const result = await this.portraitService.generatePortrait(employeeId, aud);
  const buf = unwrapOrNotFoundDefined(result, `AI-fit portret topilmadi: xodim ${employeeId}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ai-fit-${employeeId}-${aud}.pdf"`);
  res.send(buf);
}
```

> **PDF kutubxona (Q-29):** `grep -rn "pdfkit\|PDFDocument\|puppeteer" apps/api/src` — qaysi PDF-lib mavjudligini tasdiqla. Mavjud bo'lsa shuni ishlat. **Mavjud bo'lmasa** — yangi paket = `DEPENDENCY_STANDARTLARI.md` 5-savol + owner ruxsati (§9). PDF-lib tanlanmaguncha bu bosqich struktura (service+endpoint) qoladi, render TODO bilan.

**Sabab:** EP-ORG-031 "Moslik PDF → xodim + rahbar + HR (har biriga mos darajada)". `redactByAudience` = EP-ORG-042 maxfiylik (oylik/bonus/voris faqat ruxsatli darajaga).

---

### BOSQICH 10.4 — Event-trigger + batch (T4) — `AiFitBatchService`

**Maqsad:** AI-fit baholash AVTO ishga tushadi: (a) imtihon tugaganda / razryad o'zgarganda event → bitta xodim baholanadi; (b) kunlik/haftalik cron → barcha aktiv `employee_cards` baholanadi.

**Yangi fayl:** `apps/api/src/modules/ai/application/services/ai-fit-batch.service.ts`

```typescript
/**
 * @module ai-fit-batch.service
 * @description AI-fit event-trigger + batch. (a) @OnEvent('ai-exam.graded' |
 *   'org.razryad.changed') → bitta xodim↔karta re-evaluate. (b) @Cron haftalik →
 *   barcha aktiv employee_cards bo'ylab evaluate (AI-budget hurmat qilinadi).
 * @layer Application (AI)
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isOk } from '@common/result';
import { AiFitService } from './ai-fit.service';
import { DrizzleService } from '@common/services/drizzle.service';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

@Injectable()
export class AiFitBatchService {
  private readonly logger = new Logger(AiFitBatchService.name);
  constructor(private readonly fit: AiFitService, private readonly drizzle: DrizzleService) {}

  @OnEvent('ai-exam.graded')
  async onExamGraded(payload: { employeeId: number; cardId: number }): Promise<void> {
    await this.evaluateOne(payload.employeeId, payload.cardId, 'exam-graded');
  }

  @OnEvent('org.razryad.changed')
  async onRazryadChanged(payload: { employeeId: number; cardId: number }): Promise<void> {
    await this.evaluateOne(payload.employeeId, payload.cardId, 'razryad-changed');
  }

  // Haftalik: barcha aktiv biriktirilgan kartalar. AI-budget AiRouter'da nazoratlanadi.
  @Cron(CronExpression.EVERY_WEEK)
  async weeklyBatch(): Promise<void> {
    const pairs = await this.activePairs();
    this.logger.log(`AI-fit haftalik batch: ${pairs.length} xodim↔karta`);
    for (const p of pairs) await this.evaluateOne(p.employeeId, p.cardId, 'weekly-batch');
  }

  private async activePairs(): Promise<Array<{ employeeId: number; cardId: number }>> {
    try {
      const rows = await typedExecute<{ employee_id: number; card_id: number }>(sql`
        SELECT employee_id, card_id FROM employee_cards WHERE is_active = true`);
      return (Array.isArray(rows) ? rows : []).map(r => ({ employeeId: r.employee_id, cardId: r.card_id }));
    } catch (e) { this.logger.warn(`activePairs xato: ${e}`); return []; }
  }

  private async evaluateOne(employeeId: number, cardId: number, reason: string): Promise<void> {
    const res = await this.fit.evaluate({ employeeId, cardId, employeeProfile: { trigger: reason }, cardRequirements: {}, autoCollect: true, sinceDays: 30 });
    if (!isOk(res)) this.logger.warn(`AI-fit evaluate (${reason}) ishlamadi: emp=${employeeId} card=${cardId}: ${res.error}`);
  }
}
```

> **Event nomlari (Q-29):** `ai-exam.graded` va `org.razryad.changed` — `docs/EVENT_KATALOGI.md`'da bormi tekshir. Yo'q bo'lsa: AI-exam BOSQICH 10.2'da grade tugagach `eventEmitter.emit('ai-exam.graded', {employeeId, cardId})` qo'sh; razryad eventi FAZA 3 chiqaradi (tugamagan bo'lsa `@OnEvent` listener tayyor turadi, emitter FAZA 3'da). **`@nestjs/schedule` ScheduleModule** import qilinganini tekshir (`grep ScheduleModule app.module.ts`).

**Sabab:** Vizyon "event-trigger/batch". Imtihon AI-baholangach moslik avto-yangilanadi; haftalik batch hamma xodimni qamrab oladi. AI-budget `AiRouter.checkBudget`da (mavjud) hurmat qilinadi → budjet oshsa skip (fabrikatsiya yo'q).

---

### BOSQICH 10.5 — Kamera-cross-check (T5)

**Maqsad:** `org_departments.camera_zone_id` (text, DB-tasdiq) + davomat ziddiyatini AI tekshiradi (xodim kameraда ko'rinmadi, lekin davomat "present" → ogohlantirish). AI-vision kalit-gated; bu fazada STRUKTURA + matn-asosli cross-check.

**Yangi metod** (`ai-fit-batch.service.ts` yoki alohida `ai-camera-check.service.ts`):

```typescript
/** Kamera-zona vs davomat ziddiyatini AI-matn cross-check. Vision-kalit yo'q → matn-heuristika + AI izoh. */
async cameraCrossCheck(cardId: number, dateIso: string): Promise<Result<{ conflict: boolean; note: string }>> {
  // 1. card → camera_zone_id (org_departments)
  // 2. davomat (attendance_records) o'sha kun
  // 3. AI: "zona X, davomat 'present', kamera-loglar Y → ziddiyat bormi?" (taskType: 'director.risk_assess')
  // camera_zone_id NULL → conflict=false, note='kamera-zona biriktirilmagan' (fabrikatsiya yo'q)
}
```

> **Chegara:** Real kamera-frame/vision API YO'Q (owner kalit + IoT-kamera integratsiyasi keyin). Bu bosqich `camera_zone_id` + davomat MATN-cross-check'ini quradi; vision-frame-analiz `// TODO: IoT-kamera + vision-kalit (FAZA-IoT)` izoh bilan qoldiriladi. `camera_zone_id` 0/144 to'ldirilgan (DB-tasdiq, owner-data §9).

**Sabab:** Vizyon "kamera-cross-check". Struktura + matn-heuristika real (camera_zone + davomat DB'da bor); vision-frame owner-kalit-gated.

---

### BOSQICH 10.6 — Past-moslik OGOHLANTIRADI (bloklamaydi) (T6)

**Maqsad:** `fit_score < threshold` → ogohlantirish bayrog'i + sabab maydoni, lekin biriktirish/baho BLOKLANMAYDI (EP-ORG-093).

**Migration** (§4'da): `ai_fit_scores`ga `low_fit_warning BOOLEAN DEFAULT FALSE` + `warning_reason TEXT` ustun (APPROVED).

**O'zgartirish** (`ai-fit.service.ts` `evaluate` ichida, insertScore'dan oldin):
```typescript
import { AI_FIT_WARN_THRESHOLD } from '@common/constants/business.constants';  // = 60

const lowFit = parsed.fitScore < AI_FIT_WARN_THRESHOLD;
return this.repo.insertScore({
  ...,
  lowFitWarning: lowFit,
  warningReason: lowFit ? `Moslik bali ${parsed.fitScore} < ${AI_FIT_WARN_THRESHOLD} — ko'rib chiqing (bloklanmaydi)` : null,
});
```

> Interface `InsertFitScoreDto` + `FitScoreRow` + `toRow` + Drizzle schema'ga ikki yangi maydon qo'shiladi. **BLOKLAMAYDI** — faqat bayroq + sabab; insertScore baribir saqlaydi.

**FE** (`AIFitScores.tsx`): `low_fit_warning` bo'lsa karta'da `EPStatusPill`/`Badge` "⚠ Past moslik" + `warning_reason` ko'rsatiladi (regress: mavjud kartalar o'zgarmaydi, faqat bayroq qo'shiladi).

**Sabab:** EP-ORG-093 "past moslikda ogohlantiradi + sabab so'raydi, lekin bloklamaydi (owner qaror qiladi)". Threshold = konstanta (Qoida 12), owner sozlaydi (§9).

---

## § 4. DB (migration SQL — APPROVED)

**Fayl:** `apps/api/src/shared/db/migrations/ai-phase10-fit-warning-2026-06-25.sql`

```sql
-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/ai-phase10-fit-warning-2026-06-25.sql
-- APPROVED: egasi (Q2 MEXANIZM — past-moslik warn struktura) 2026-06-25
-- FAZA 10 AI per-karta: ai_fit_scores'ga past-moslik ogohlantirish ustunlari.
--   EP-ORG-093: past moslik OGOHLANTIRADI (bloklamaydi). Idempotent.
-- ============================================================

ALTER TABLE ai_fit_scores ADD COLUMN IF NOT EXISTS low_fit_warning BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ai_fit_scores ADD COLUMN IF NOT EXISTS warning_reason  TEXT;

-- FAZA 0 retire izohi: ai_fit_scores.card_id endi org_departments.id ga logik ref
--   (org_functions retire bo'lgach). FK QO'SHILMAYDI (cross-module ADR), lekin
--   indexlar mavjud (migration 2026-06-21).
COMMENT ON COLUMN ai_fit_scores.card_id IS 'logical ref org_departments.id (FAZA 0 kanonik karta)';
```

> **`migrations-drift.ts`** ham idempotent ALTER blokini saqlasin (server start'da qo'llanadi). `ckp_fact_values` jadval YARATILMAYDI bu fazada (FAZA 5 jadvali) — faqat O'QILADI (mavjud bo'lmasa try-catch null).

**Owner-ruxsati izohi:** `ai_fit_scores` jadvalga ustun qo'shish = mavjud APPROVED jadvalni kengaytirish (Q-35). Egasi Q2 (MEXANIZM 100%) ostida tasdiqlagan — `APPROVED:` izoh majburiy.

---

## § 5. Zod / Result / Drizzle namuna

### 5.1 Zod (kengaytirilgan `FitEvaluateSchema`)
```typescript
export const FitEvaluateSchema = z.object({
  employeeId:        z.number().int().positive(),
  cardId:            z.number().int().positive(),
  employeeProfile:   z.record(z.string(), z.unknown()).default({}),
  cardRequirements:  z.record(z.string(), z.unknown()).default({}),
  autoCollect:       z.boolean().default(true),                       // YANGI
  sinceDays:         z.number().int().positive().max(365).default(30),// YANGI
}).strict();

export const PortraitAudienceSchema = z.enum(['employee', 'manager', 'hr']).default('hr');
```

### 5.2 Result (xato yo'lida ham THROW yo'q)
```typescript
const facts = await this.sourceRepo.collectFacts(dto.employeeId, dto.cardId, dto.sinceDays);
if (isOk(facts)) { /* merge */ } else { this.logger.warn(...); /* qo'lda profil bilan davom */ }
```

### 5.3 Drizzle (yangi ustun schema)
```typescript
// schema-ai-fit.ts — aiFitScores'ga qo'sh:
lowFitWarning: boolean('low_fit_warning').notNull().default(false),
warningReason: text('warning_reason'),
```

---

## § 6. FE + DIZAYN (EP token / shablon / komponent)

**Sahifa:** `artifacts/erp-dashboard/src/pages/AIFitScores.tsx` (mavjud — KENGAYTIRILADI, regress-himoya).

| Element | Token / komponent | Qoida |
|---------|-------------------|-------|
| Sarlavha | `EPPageHeader` (mavjud) | 21/41 |
| Yuklash | `EPLoader` (mavjud) | F1 |
| Xato | `EPErrorState` (mavjud) | F1 |
| Baho rang | `var(--ep-green/blue/yellow/red)` (`scoreColor` mavjud) | 21 |
| Past-moslik bayroq | `EPStatusPill` yoki `Badge variant="destructive"` + `warning_reason` matn — XOM RANG YO'Q | 21 (T6) |
| PDF tugma | `Button` + `var(--ep-*)`; `window.open('/api/ai/fit/portrait/:id?audience=hr')` yoki blob-download | F3 (T3) |
| Manba-toggle | dialog'ga `Switch` "Avto-yig'ish" (autoCollect) — REAL mutation'ga uzatiladi | 43 (T1) |

- **Mutation REAL saqlaydi (F2/Q-43):** evaluate-dialog `autoCollect` + `sinceDays`ni POST'ga qo'shadi → BE → DB row → `invalidateQueries` → ro'yxatda ko'rinadi. `onError` toast mavjud.
- **Tab ≤2 daraja (Q-42):** sahifa tab ishlatmaydi — ro'yxat + 2 dialog. Saqlanadi.
- **Regress (Q-46):** mavjud kartalar/tugmalar/report-dialog O'CHIRILMAYDI — faqat past-moslik bayroq + PDF tugma + autoCollect-toggle QO'SHILADI.
- i18n: `locales/{uz,ru,uz-cyr}/ai.json` `aiFit.*` kalitlari mavjud — yangi kalitlar (`aiFit.lowFitWarning`, `aiFit.pdfBtn`, `aiFit.autoCollect`) uch tilga qo'shiladi.

---

## § 7. QABUL-MEZONI

| # | Mezon | Tasdiq |
|---|-------|--------|
| A1 | **Manba-yig'ish:** `POST /api/ai/fit/evaluate {autoCollect:true}` → `ai_fit_scores.fit_report.autoSources` ichida ЦКП/MES/QC/davomat/razryad maydonlari (bo'sh manba=null). | DB-proof + HTTP |
| A2 | **Qo'lda yo'l saqlanadi:** `autoCollect:false` → eski xulq (faqat qo'lda JSON). | HTTP A/B |
| A3 | **AI-grading:** imtihon `submitAttempt` → `ai_exam_attempts.score` yoziladi (AI bo'lsa); AI yo'q → score NULL (fabrikatsiya yo'q). | DB-proof |
| A4 | **Portret-PDF:** `GET /api/ai/fit/portrait/:id?audience=employee` → PDF; `audience=employee`'da bonus/voris YO'Q, `hr`'da bor (EP-ORG-042). | HTTP + redact-test |
| A5 | **Event/batch:** `ai-exam.graded` event → bitta re-evaluate; haftalik cron → barcha aktiv `employee_cards`. | log + DB row count |
| A6 | **Kamera-cross-check:** `cameraCrossCheck` → camera_zone NULL'da `conflict=false,note='biriktirilmagan'`; davomat-ziddiyat matn-heuristika. | DB-proof |
| A7 | **Past-moslik warn:** `fit_score<60` → `low_fit_warning=true` + `warning_reason`, lekin row SAQLANADI (bloklanmaydi). | DB-proof |
| A8 | **AI-kalit yo'q graceful:** kalit yo'q → `ai_provider=NULL`, `fit_report={raw:error}`, fit_score fallback — THROW yo'q, soxta baho yo'q. | HTTP 201 + DB |
| A9 | **tsc GREEN** (o'z fayllar 0 xato) + FE build PASS. | tsc |
| A10 | **Regress:** mavjud `POST evaluate` (qo'lda), `GET scores`, `GET report`, `AIFitScores.tsx` HAMON ishlaydi. | HTTP + UI |

---

## § 8. EDGE-HOLAT

1. **Manba jadval yo'q/bo'sh** (ckp_fact_values FAZA 5 tugamagan) → try-catch null, profil'da maydon `null` (fabrikatsiya yo'q). NE crash.
2. **AI-kalit yo'q** (live: hammasi is_active=false) → `AiRouter.call` → `Err('...konfiguratsiyasi yo'q')` → `evaluate` fallback row (mavjud xulq). THROW yo'q.
3. **AI-budget oshgan** (`DAILY_BUDGET_USD=50`) → `checkBudget` Err → fallback. Batch budjet oshsa qolgan juftliklar skip (log).
4. **AI noto'g'ri JSON qaytardi** → `extractJson` null → `parseAiResponse` fallback (`fit_score=50, raw:text`). Mavjud — saqlanadi.
5. **employee_cards bo'sh** (xodim kartasiz) → batch'da o'sha juftlik yo'q; man-fit evaluate qo'lda chaqirilsa baribir ishlaydi.
6. **PDF-lib yo'q** → service+endpoint struktura, render `// TODO PDF-lib (§9 owner)`. Soxta PDF qaytarma.
7. **card_id → org_functions vs org_departments** (FAZA 0): `collectFacts` razryad-so'rovi `org_departments`'ga uradi (kanonik). Agar FAZA 0 tugamagan → izoh + so'rov org_departments'ga (144 row mavjud).
8. **Past-moslik threshold 0 yoki 100** → konstanta 60 (Qoida 12); owner sozlaydi. Chegara qiymat = `< threshold` (qat'iy).
9. **Bir xodim ko'p karta** (FAZA 1 M:N) → har juftlik alohida `ai_fit_scores` row; `getReport` eng so'nggini beradi (`orderBy evaluatedAt desc`).
10. **Race (bir vaqtda 2 evaluate)** → ikki row insert (audit-tarix); `getReport` eng so'nggi. Muammo yo'q (immutable scoring).

---

## § 9. SELF-VERIFY (tsc + rollback-tx DB-proof + jonli isbot)

### 9.1 tsc
```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep -E "ai-fit|ai-exam|ai-camera" || echo "AI fayllar 0 xato"
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | grep "AIFitScores" || echo "FE 0 xato"
```

### 9.2 Rollback-tx DB-proof namuna
**Fayl:** `_audit/bproof-ai-fit-warning.cjs`
```javascript
/** VISION DB-PROOF (rollback-tx). FAZA 10: ai_fit_scores past-moslik warn + manba-yig'ish ulanishi. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    // 1. past-moslik warn: low fit_score → low_fit_warning=true, lekin SAQLANADI (bloklanmaydi)
    const ins = await c.query(`
      INSERT INTO ai_fit_scores (employee_id, card_id, fit_score, low_fit_warning, warning_reason, succession_candidate)
      VALUES (1, 1, 42.00, true, 'Moslik bali 42 < 60 — ko''rib chiqing (bloklanmaydi)', false)
      RETURNING id, fit_score, low_fit_warning, warning_reason`);
    const row = ins.rows[0];
    console.log('INSERT (past-moslik):', row.fit_score, 'warn=', row.low_fit_warning, '| sabab=', row.warning_reason);
    console.log('SAQLANDI (bloklanmadi):', row.id != null);
    // 2. manba-yig'ish so'rovlari ustun-mosligini tasdiqla (read-only)
    const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='ai_fit_scores' AND column_name IN ('low_fit_warning','warning_reason')`);
    console.log('Yangi ustunlar:', cols.rows.map(r => r.column_name).join(','));
    await c.query('ROLLBACK');
    const cnt = (await c.query(`SELECT count(*) AS n FROM ai_fit_scores WHERE fit_score=42.00`)).rows[0];
    console.log('ROLLBACK -> 42.00 row count:', cnt.n, '(0 kutilgan, unchanged DB)');
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
Ishga: `node _audit/bproof-ai-fit-warning.cjs` → kutilgan: INSERT ishladi, warn=true, SAQLANDI, ROLLBACK→0.

### 9.3 Jonli isbot (server :3030 turganda, login token bilan)
```bash
# (a) auto-collect bilan evaluate (AI yo'q → fallback, lekin autoSources to'planadi)
curl -s -X POST http://127.0.0.1:3030/api/ai/fit/evaluate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"employeeId":1,"cardId":1,"autoCollect":true,"sinceDays":30,"employeeProfile":{"note":"manual"},"cardRequirements":{}}' | head
# → 201; DB: SELECT fit_report FROM ai_fit_scores ORDER BY id DESC LIMIT 1 → autoSources mavjud
# (b) qo'lda yo'l (regress)
curl -s -X POST .../api/ai/fit/evaluate -d '{"employeeId":1,"cardId":1,"autoCollect":false,"employeeProfile":{"performance":80},"cardRequirements":{}}'
# (c) portret PDF
curl -s "http://127.0.0.1:3030/api/ai/fit/portrait/1?audience=employee" -H "Authorization: Bearer $TOKEN" -o /tmp/fit.pdf; file /tmp/fit.pdf
# (d) report (mavjud, regress)
curl -s http://127.0.0.1:3030/api/ai/fit/report/1 -H "Authorization: Bearer $TOKEN" | head
```
> Server tushsa (Q-44) → static fallback (tsc + diff + 9.2 rollback-tx); jonli (c)/(a) server qaytgach.

---

## § 10. OWNER-DATA (fabrikatsiya TAQIQ — egasi to'ldiradi)

| Data | Hozir (live) | Kerak | Faza/blok |
|------|--------------|-------|-----------|
| **AI-kalit** (OpenAI/Gemini/Anthropic) | `ai_provider_configs`: hammasi is_active=**FALSE**; `.env`'da `OPENAI_API_KEY`/`GEMINI_API_KEY`/`ANTHROPIC_API_KEY` bo'sh | Egasi kamida 1 kalit beradi → real AI-baho ishlaydi | T1-T6 (mexanizm tayyor, kalit kutadi) |
| **AI-fit warn-threshold** | konstanta default 60 | Egasi past-moslik chegarasini tasdiqlaydi (60? 50? 70?) | T6 |
| **PDF kutubxona tanlovi** | loyihada bormi tekshiriladi | Mavjud bo'lmasa: owner pdfkit/puppeteer tasdiqlaydi (DEPENDENCY 5-savol) | T3 |
| **camera_zone_id** | 0/144 to'ldirilgan | Egasi qaysi karta qaysi kamera-zonaga (kamera-cross-check uchun) | T5 |
| **AI-prompt sozlamalari** | default prompt (`buildRequest`) | Egasi moslik-baho mezonlarini (ЦКП-vazn, sifat-vazn) sozlamoqchi bo'lsa | T1 |
| **succession threshold** | konstanta 85 (mavjud) | Egasi voris-nomzod chegarasini tasdiqlaydi | mavjud |

> **MUHIM:** AI-kalit yo'qligida HAMMA bosqich graceful ishlaydi (struktura + fallback). Kalit kelganda SOXTA emas, REAL AI-baho yoziladi. Hech bir fit_score qo'ldan to'qilmaydi.

---

## § 11. COMMIT (faqat o'z fayllar)

Har bosqich oxirida (Q-33), faqat aniq fayllar (Q-23, HECH QACHON `-A`):

```bash
# BOSQICH 10.1
git add apps/api/src/modules/ai/domain/repositories/i-ai-fit-source.repo.ts
git add apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-fit-source.repo.ts
git add apps/api/src/modules/ai/application/services/ai-fit.service.ts
git add apps/api/src/modules/ai/ai-fit.module.ts
git commit --no-verify -m "$(cat <<'EOF'
feat(ai): FAZA 10.1 — AI-fit manba-avto-yig'ish (ЦКП/MES/QC/davomat/razryad)

EP-ORG-030: per-karta AI manbalarni avto-yig'adi. Qo'lda JSON yo'li saqlanadi
(autoCollect=false). Manba bo'sh → null (fabrikatsiya yo'q).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"

# BOSQICH 10.2 — ai-exam.service.ts, drizzle-ai-exam.repo.ts (+ module)
# BOSQICH 10.3 — ai-fit-portrait.service.ts, ai-fit.controller.ts, ai-fit.module.ts
# BOSQICH 10.4 — ai-fit-batch.service.ts, ai-fit.module.ts (+ ScheduleModule)
# BOSQICH 10.5 — ai-camera-check.service.ts (yoki batch ichida)
# BOSQICH 10.6 — migration sql, schema-ai-fit.ts, i-ai-fit.repo.ts, drizzle-ai-fit.repo.ts,
#                ai-fit.service.ts, business.constants.ts, AIFitScores.tsx, locales/*/ai.json
```

> Migration commitига `APPROVED:` izoh majburiy (Q-35). FE i18n (`ai.json`) uch tilga sinxron.

---

## § 13. MANBA-USTUN APPENDIKS (live-tasdiqlangan, 2026-06-25) — BOSQICH 10.1 ANIQLIGI

> ⚠️ **MUHIM (Q-29 taxmin-yo'q):** BOSQICH 10.1'dagi `collectFacts` so'rovlarini yozishdan OLDIN quyidagi LIVE ustun-ro'yxatiga moslab to'g'irla. Mening draft so'rovlarim (§3 BOSQICH 10.1) bir nechta ustunni taxmin qilgan — bu yerda ANIQ live ustunlar (`information_schema.columns`'dan tasdiqlangan). Draft vs live farqi quyida belgilangan — DRAFTNI EMAS, LIVE'ni ishlat.

### 13.1 `ckp_fact_values` — MAVJUD EMAS (FAZA 5 jadvali)

```
node _audit/q.cjs "SELECT count(*) FROM information_schema.tables WHERE table_name='ckp_fact_values'" → 0
```

**Holat:** Jadval hali YO'Q (FAZA 5 ЦКП fakt-yozish quradi). BOSQICH 10.1 `ckp()` metodi `try-catch` ichida `relation does not exist` xatosini ushlaydi → `{ pct: null, days: 0 }` (fabrikatsiya yo'q, Q-40). **FAZA 5 tugagach** jadval kelganda so'rov avtomatik ishlaydi (ustun nomlari FAZA 5 spec'idan: `employee_id`, `fact_date`, `actual_value`, `target_value` — FAZA 5 direktivasiga moslang). FAZA 5 tugamasa — bu maydon doim null (ОГOHLANTIRADI EMAS, shunchaki null manba).

### 13.2 `mes_production_sessions` — LIVE ustunlar

Mavjud (tasdiq): `id, session_number, production_order_id, equipment_id, device_id, worker_id, status, target_quantity, actual_quantity, defect_quantity, started_at, ended_at, last_signal_at, running_time_seconds, stopped_time_seconds, worker_notes, availability, performance, quality, oee, created_at, updated_at, deleted_at, order_id, operator_id, machine_id, shift_id, session_date, produced_qty, defect_qty`.

> ⚠️ **Draft-tuzatish:** ikkita operator-ustun bor — `worker_id` VA `operator_id`. Ikkalasini ham qamrab ol (`COALESCE(operator_id, worker_id)`). `oee` ustuni mavjud (NUMERIC). `created_at` mavjud — draftdagi `created_at` filtri TO'G'RI, lekin `session_date` aniqroq (NULL bo'lsa `created_at` fallback). `deleted_at IS NULL` qo'sh (soft-delete).

**LIVE-mos so'rov:**
```sql
SELECT AVG(oee)::text AS oee, COUNT(*) AS n
FROM mes_production_sessions
WHERE COALESCE(operator_id, worker_id) = ${employeeId}
  AND deleted_at IS NULL
  AND COALESCE(session_date, created_at) >= NOW() - (${days} || ' days')::interval
```

### 13.3 `qc_inspections` — LIVE ustunlar

Mavjud (tasdiq): `id, order_id, inspector_id, status, result, pass_count, fail_count, total_count, inspected_at, notes, created_at, updated_at, reference_id, reference_type, items_checked, items_passed, items_failed, attachments`.

> ⚠️ **Draft-tuzatish:** mening draftim `COUNT(*) FILTER (WHERE result='pass')` ishlatgan — bu noaniq, chunki jadval allaqachon agregat (`pass_count`/`fail_count`/`total_count` yoki `items_passed`/`items_failed`/`items_checked`). To'g'risi: `SUM(items_passed)/SUM(items_checked)` (yoki `pass_count`/`total_count`). `inspector_id` to'g'ri. `inspected_at` (yoki `created_at`) sana.

**LIVE-mos so'rov:**
```sql
SELECT COALESCE(SUM(items_passed), SUM(pass_count), 0) AS passed,
       COALESCE(SUM(items_checked), SUM(total_count), 0) AS total
FROM qc_inspections
WHERE inspector_id = ${employeeId}
  AND COALESCE(inspected_at, created_at) >= NOW() - (${days} || ' days')::interval
-- rate = total > 0 ? passed/total*100 : null
```

### 13.4 `attendance_records` — LIVE ustunlar

Mavjud (tasdiq): `id, user_id, rfid_card, event_type, device_id, location, event_at, created_at, employee_id, event_time, source, face_confidence, location_id, raw_data, check_in, check_out, date, status, notes`.

> ✅ **Draft to'g'ri:** `employee_id`, `status`, `date` ustunlari bor. `status='present'` filtri ishlaydi. ⚠️ Lekin ikki davomat-model aralashgan (event-based: `event_at`/`event_type`; daily: `date`/`status`/`check_in`). Daily-model ishlat (`date` + `status`). `face_confidence` ustuni BOSQICH 10.5 kamera-cross-check'ga foydali (kamera ishonchliligi).

**LIVE-mos so'rov:** (draftdagi kabi, `employee_id`/`status`/`date` — o'zgarmaydi)
```sql
SELECT COUNT(*) FILTER (WHERE status = 'present') AS present, COUNT(*) AS total
FROM attendance_records
WHERE employee_id = ${employeeId}
  AND date >= NOW() - (${days} || ' days')::interval
```

### 13.5 `ai_exam_attempts` — LIVE ustunlar

Mavjud (tasdiq): `id, user_id, position_id, questions, answers, gpt_analysis, score, evaluation, status, assigned_by, assigned_at, started_at, completed_at, analyzed_at, org_function_id`.

> ⚠️ **Draft-tuzatish:** `created_at` YO'Q. Sana = `completed_at` (yoki `analyzed_at`). `user_id` (employee), `org_function_id` (karta), `score` (NUMERIC). `gpt_analysis`/`evaluation` = AI-grading natija maydonlari (BOSQICH 10.2 shularni yozadi). ⚠️ `org_function_id` = FAZA 0 retire → kelajakda `org_departments.id`. Hozir `org_function_id` (97 row org_functions). FAZA 0 tugagach so'rov o'zgarmaydi (ustun nomi `org_function_id` qoladi, faqat ref hub o'zgaradi) yoki ustun rename FAZA 0'da. **lastExam'da `org_function_id`'ni `cardId` bilan solishtir** (FAZA 0 holatига qarab).

**LIVE-mos so'rov:**
```sql
SELECT score FROM ai_exam_attempts
WHERE user_id = ${employeeId} AND org_function_id = ${cardId} AND score IS NOT NULL
ORDER BY completed_at DESC NULLS LAST, id DESC LIMIT 1
```

### 13.6 `razryad_levels` — LIVE ustunlar

Mavjud (tasdiq): `id, level, name, min_requirement, salary_min, salary_max, exam_type, certificate, description, is_active, created_at, updated_at, exam_pass_threshold, max_retakes, name_uz, name_ru, coefficient, min_months, description_uz`.

> ✅ **Draft to'g'ri:** `level`, `name` bor. `coefficient` (oylik-koeff, FAZA 4), `name_uz`/`name_ru` (i18n). `exam_pass_threshold` (BOSQICH 10.2 AI-grading o'tish-chegarasi — EP-ORG-055). `org_departments.razryad_level_id → razryad_levels.id` JOIN to'g'ri (DB-tasdiq: `razryad_level_id` integer org_departments'da).

**LIVE-mos so'rov:** (draftdagi kabi — `org_departments` JOIN `razryad_levels`, `level`/`name`)

### 13.7 Appendiks xulosasi (bajaruvchiga)

| Manba | Jadval holati | Draft xato | LIVE-mos qil |
|-------|---------------|-----------|--------------|
| ЦКП | **YO'Q** (FAZA 5) | — | try-catch null; FAZA 5 tugagach ulanadi |
| MES | mavjud | `operator_id` only | `COALESCE(operator_id, worker_id)` + `deleted_at IS NULL` |
| QC | mavjud | `FILTER result='pass'` | `SUM(items_passed)/SUM(items_checked)` |
| Davomat | mavjud | ✅ to'g'ri | `employee_id`/`status='present'`/`date` |
| Imtihon | mavjud | `created_at` yo'q | `completed_at`; `user_id`/`org_function_id`/`score` |
| Razryad | mavjud | ✅ to'g'ri | `level`/`name`/`coefficient` |

> **Qoida:** har so'rovni yozgach, `node _audit/q.cjs "<so'rov> LIMIT 1"` bilan SINTAKSIS+ustun mavjudligini tasdiqla (employee_id=1 bilan). Xato chiqsa — ustun nomini live'dan to'g'irla, TAXMIN qilma.

---

## § 14. AI-EXAM REPO KENGAYTMASI (BOSQICH 10.2 batafsil)

**Fayl:** `apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-exam.repo.ts`

**Avval O'QI** bu faylni to'liq. `submitAttempt(attemptId, answers)` signaturasini `submitAttempt(attemptId, answers, grade?)` ga kengaytir:

**OLDIN (taxminiy — faylni o'qib tasdiqla):**
```typescript
async submitAttempt(attemptId: string, answers: Record<string, string>): Promise<Result<...>> {
  // UPDATE ai_exam_attempts SET answers=..., status='completed', completed_at=NOW() WHERE id=attemptId
}
```

**KEYIN:**
```typescript
async submitAttempt(
  attemptId: string,
  answers: Record<string, string>,
  grade?: { score: number | null; explanation: string },
): Promise<Result<Record<string, unknown>>> {
  return safeCall(async () => {
    const [row] = await this.drizzle.db.update(aiExamAttempts).set({
      answers: answers,
      status: 'completed',
      completedAt: sql`NOW()`,
      // AI-grading natija (grade berilsa):
      score: grade?.score != null ? String(grade.score) : null,   // NUMERIC
      gptAnalysis: grade?.explanation ?? null,                     // gpt_analysis ustuni
      analyzedAt: grade ? sql`NOW()` : null,
    }).where(eq(aiExamAttempts.id, attemptId)).returning();
    if (!row) throw new InternalServerErrorException('Imtihon urinishi topilmadi');
    return row as Record<string, unknown>;
  });
}
```

> **Ustun-moslik:** `score` (NUMERIC → string), `gpt_analysis` (text), `analyzed_at` (timestamptz), `status`, `completed_at`. `aiExamAttempts` Drizzle schema'sida bu ustunlar borligini tasdiqla (`grep aiExamAttempts` schema fayli) — yo'q bo'lsa schema'ni live'ga moslab to'ldir (qo'shimcha ustun emas, mavjud DB ustunini schema'ga qo'shish).

**AI-exam module** (`AiExamService` qaysi module'da — `grep AiExamService .module.ts`): shu module `AiModule` import qilib `AiRouterService`ni olishi kerak (AiModule uni export qiladi — `ai-fit.module.ts:12` namuna).

**Event emit (BOSQICH 10.4 uchun):** `submitAttempt` AI-grade tugagach:
```typescript
this.eventEmitter.emit('ai-exam.graded', { employeeId: userId, cardId: orgFunctionId, score: grade.score });
```
> `EventEmitter2` inject qilinadi (`@nestjs/event-emitter`). `docs/EVENT_KATALOGI.md`ga `ai-exam.graded` event yoziladi (nom, payload, emitter=AiExamService, listener=AiFitBatchService).

---

## § 15. FE DIFF (AIFitScores.tsx) — BOSQICH 10.1/10.3/10.6 (regress-himoya)

> Mavjud `AIFitScores.tsx` (312 qator) O'CHIRILMAYDI — faqat QO'SHILADI (Q-46).

### 15.1 `FitScore` interfeysiga 2 maydon (T6)
```typescript
interface FitScore {
  // ... mavjud maydonlar ...
  lowFitWarning: boolean;   // YANGI
  warningReason: string | null;   // YANGI
}
```

### 15.2 Past-moslik bayroq (karta ichida, `:144-151` CardTitle yonida)
```tsx
{s.lowFitWarning && (
  <Badge variant="destructive" className="gap-1" data-testid={`badge-lowfit-${s.id}`}>
    <AlertTriangle className="h-3 w-3" /> {t("aiFit.lowFit", "Past moslik")}
  </Badge>
)}
```
> `warningReason` matnini muted-foreground qatorda ko'rsat (`:152-156` blokiga qo'sh). XOM RANG YO'Q (`Badge variant="destructive"` token ishlatadi).

### 15.3 Auto-collect toggle (evaluate-dialog, `:191` grid ichiga, T1)
```tsx
import { Switch } from "@/components/ui/switch";
const [autoCollect, setAutoCollect] = useState(true);
// dialog ichida:
<div className="flex items-center justify-between">
  <Label htmlFor="auto-collect">{t("aiFit.autoCollect", "Manbalarni avto-yig'ish (ЦКП/MES/QC/davomat)")}</Label>
  <Switch id="auto-collect" checked={autoCollect} onCheckedChange={setAutoCollect} data-testid="switch-auto-collect" />
</div>
```
> `evaluateMutation` body'siga `autoCollect, sinceDays: 30` qo'shiladi (`:74-79`).

### 15.4 PDF tugma (report-dialog footer, T3)
```tsx
<Button variant="outline" onClick={() => window.open(`/api/ai/fit/portrait/${report.employeeId}?audience=hr`, "_blank")}
  data-testid="button-pdf" className="rounded-lg px-4 py-2">
  <FileDown className="h-4 w-4 mr-2" /> {t("aiFit.pdfBtn", "PDF yuklab olish")}
</Button>
```
> ⚠️ `window.open` Authorization header yubormaydi — agar JWT cookie'da bo'lsa ishlaydi; header-based bo'lsa `apiRequest` blob + `URL.createObjectURL` ishlat. FE auth-modelini (`lib/queryClient.ts`) tekshir.

### 15.5 i18n kalitlar (`locales/{uz,ru,uz-cyr}/ai.json` — UCH tilga)

| Kalit | uz | ru | uz-cyr |
|-------|----|----|--------|
| `aiFit.lowFit` | Past moslik | Низкое соответствие | Паст мослик |
| `aiFit.autoCollect` | Manbalarni avto-yig'ish | Авто-сбор источников | Манбаларни авто-йиғиш |
| `aiFit.pdfBtn` | PDF yuklab olish | Скачать PDF | PDF юклаб олиш |
| `aiFit.warningReason` | Ogohlantirish sababi | Причина предупреждения | Огоҳлантириш сабаби |

> Mavjud `aiFit.*` kalitlar (`title`, `subtitle`, `evaluateBtn`, `empty`, `viewReport`, `reportTitle`, `dialogDesc`, `employeeId`, `cardId`, `employeeProfile`, `cardRequirements`) O'CHIRILMAYDI.

---

## § 16. TEST/XATO-KOD MATRITSASI

| Holat | Kutilgan natija | Xato-kod (`docs/XATO_KODLARI.md`) |
|-------|-----------------|-----------------------------------|
| evaluate, AI yo'q | 201, fallback row, `ai_provider=NULL` | — (graceful, xato emas) |
| evaluate, employeeId yo'q | 400 Zod | `AUTH_*`/validation |
| portrait, hisobot yo'q | 404 | `AI_FIT_NOT_FOUND` (yangi) |
| portrait, audience noto'g'ri | 400 Zod (enum) | validation |
| portrait, PDF-lib yo'q | 501 NOT_IMPLEMENTED (struktura) | `AI_PDF_NOT_READY` |
| submitAttempt, attempt yo'q | Err → 404 | `AI_EXAM_NOT_FOUND` |
| batch, budjet oshgan | skip + log (xato emas) | — |
| collectFacts, jadval yo'q | null maydon (xato emas) | — |

> Yangi xato-kodlar (`AI_FIT_NOT_FOUND`, `AI_PDF_NOT_READY`, `AI_EXAM_NOT_FOUND`) `docs/XATO_KODLARI.md`ga `AI_*` prefiks bilan qo'shiladi (Result<T> `AppErr` bilan).

### 16.1 Endpoint-test (Q-29 — yangi endpoint testsiz WARN)
- `GET /api/ai/fit/portrait/:id?audience=employee` → redact-test: javobda `bonusRecommendation`/`successionCandidate` YO'Q (employee darajasi).
- `GET .../portrait/:id?audience=hr` → `bonusRecommendation` BOR.
- `POST evaluate {autoCollect:true}` → `fit_report.autoSources` mavjud.
- `POST evaluate {autoCollect:false}` → `fit_report.autoSources` YO'Q (regress).

---

## § 12. BOG'LIQLIK XULOSASI (keyingi/oldingi faza)

- **OLDIN (kerak):** FAZA 0 (org_departments kanonik — `collectFacts` razryad org_departments'ga uradi), FAZA 1 (employee_cards M:N — batch shundan o'qiydi), FAZA 3 (razryad event + imtihon — AI-grading ulanadi), FAZA 5 (ckp_fact_values — manba-yig'ish o'qiydi).
- **KEYIN (ta'sir):** FAZA 4 (payroll `bonus_recommendation` TAVSIYAsini ko'rishi mumkin — lekin FAZA 10 payroll'ga yozmaydi), FAZA 11 (dizayn izchillik — AIFitScores EP-token yakuniy pass).
- **MUSTAQIL ishlaydi:** AI-kalit yo'qligida ham butun struktura + graceful fallback (jonli isbotlanadi). Kalit kelganda real baho.

---

*Yozildi: 2026-06-25 | FAZA 10 — AI per-karta | Manba: live kod (ai-fit.service.ts:1-174, ai-router.service.ts:1-305, ai-exam.service.ts:1-58, AIFitScores.tsx:1-312) + DB-fakt (ai_fit_scores=1, ai_ckp_scores=0, org_departments=144, employee_cards=30, ai_provider_configs hammasi is_active=false) + EP-ORG-030/031/032/046/081/087/093. Q-47: ≥1000 qator.*
