# P19 — qc: QC broken-handler fixes + inspection gates + reclamation lifecycle + FE

> **Wave:** 2 | **DependsOn:** P18 | **DDL darvozasi:** HA (gated — owner ruxsati shart)
> **Bajaruvchi:** Muslimbek | **Til:** TypeScript strict | **Sana:** 2026-06-19

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` + `LOYIHA_QOIDALARI.md` o'qi. Quyidagi qoidalar bloki Q-47 bo'yicha har direktiva boshiga kiritiladi:

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi.
6.  FAYL IZOLYATSIYASI (Q-23/Q-31): faqat owned-file ro'yxatidagi fayllarga teg.
7.  DDL DARVOZASI (Q-35): CREATE TABLE/migration faqat egasi ruxsati bilan;
    migration faylida `-- APPROVED:` izoh shart. GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, reviewer skriptlar, jonli DB-proof.
11. "V2"/"Strangler Fig" terminologiyasi TAQIQ.
12. Vizyon-moslik: master vizyon = docs/XARITA-REJA-YONALISH + modul vizyon-hujjati.
```

**Bu agent WAVE 2** da ishlaydi. P18 (MES-wiring-fixes) TUGAGANIDAN keyin boshlanadi.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.**

### Backend (BE) owned files:
```
apps/api/src/modules/qc/application/queries/get-defects.handler.ts
apps/api/src/modules/qc/application/queries/get-reclamations.handler.ts
apps/api/src/modules/qc/application/commands/create-reclamation.handler.ts
apps/api/src/modules/qc/infrastructure/event-handlers/operation-closed.listener.ts  ← YANGI FAYL
apps/api/src/modules/qc/presentation/qc-new.controller.ts
apps/api/src/modules/qc/infrastructure/repositories/qc-new.repository.ts
apps/api/src/modules/qc/infrastructure/repositories/qc-checklist.repository.ts      ← YANGI FAYL
apps/api/src/modules/qc/application/qc-checklist.service.ts                         ← YANGI FAYL
apps/api/src/modules/qc/presentation/qc-checklist.controller.ts                     ← YANGI FAYL
apps/api/src/modules/qc/infrastructure/repositories/qc-root-cause.repository.ts     ← YANGI FAYL
apps/api/src/modules/qc/presentation/qc-extended.controller.ts
apps/api/src/modules/qc/application/qc-extended.service.ts
```

### Frontend (FE) owned files:
```
artifacts/erp-dashboard/src/pages/QCDashboard.tsx
artifacts/erp-dashboard/src/pages/qc/ReclamationsPage.tsx
artifacts/erp-dashboard/src/pages/qc/QCBraksTab.tsx
artifacts/erp-dashboard/src/pages/qc/DefectCatalogPage.tsx           ← YANGI FAYL
artifacts/erp-dashboard/src/pages/qc/PreProductionChecklistPage.tsx  ← YANGI FAYL
artifacts/erp-dashboard/src/pages/qc/AQLTablePage.tsx                ← YANGI FAYL
```

### DDL Gated migration files (ISHGA TUSHIRMA — egasi ruxsatini kut):
```
apps/api/src/database/migrations/d19-01-qc-brak-causation.sql
apps/api/src/database/migrations/d19-02-qc-pre-production-checklists.sql
apps/api/src/database/migrations/d19-04-qc-root-causes-ensure.sql
```

> ⚠️ **`d19-03-qc-aql-table.sql` — P19 DAN OLIB TASHLANDI (00-INTERVYU-MOSLIK §1-daraja #2 fix):**
> `qc_aql_table` jadvalini **FAQAT P18** yaratadi (`p18-d2-qc-aql-table.sql`).
> P19 bu jadvalга murojaat qiladi, lekin qayta yaratmaydi.
> Agar P18 `p18-d2-qc-aql-table.sql` hali run etilmagan bo'lsa — avval P18 migratsiyasini run et.

**Qoida:** DDL migration fayllarini yoz, lekin `psql` yoki `migrate` orqali ISHGA TUSHIRMA. Har faylning birinchi qatorida `-- APPROVED: <egasi> <sana>` placeholder bo'lishi shart. Egasi `ha, ruxsat` deydi → ishga tushir.

---

## 2. VIZYON

### 2.1 Modul maqsadi (EP-QC-003 → EP-QC-134)
QC = **T1 golden-thread**: har ishlab chiqarish bosqichida sifat darvozasi bo'lishi shart. Kemani to'xtatish mumkin emas — yukni to'xtatish mumkin. Ushbu mantig'ni kod qilish:

- Har MES operatsiya tugaganda → brak yozish imkoniyati paydo bo'ladi (OperationClosedEvent).
- Pre-production checklist to'ldirilmagan bo'lsa MES sessiyasi boshlanmasligi kerak (bu P18/MES tomoni, lekin QC checklist endpoint bu yerda quriladi).
- Final inspection QABUL/REWORK/CHIQARISH verdikti — shipment gating (P18 bilan kelishilgan).
- Reklamatsiya: OPEN → INVESTIGATING → RESOLVED/REJECTED + root-cause 5-Why majburiy (kritik/jiddiy uchun).

### 2.2 РД-5 zanjiri (biznes qonuni)
```
1. Zakaz start → operator self-check (texkarta + material + parametrlar)
2. Har smena → ОТК interim baza tekshiruvi
3. Defekt topildi → СОЗ xabardor → texnolog + uchastka rahbari
4. Qaror: bosh texnolog (ОТК dalil beradi, qaror qabul qilmaydi)
5. Buyurtma tugashi → ОТК: QABUL / REWORK / CHIQARISH
6. Oylik → Совершенствование tahlili
```

### 2.3 Egasi 4 ta yangi qaror (OCHIQ-JAVOBLAR § QC)
| Kod | Qaror |
|-----|-------|
| EP-QC-003 | AQL standart 2.5 — lot hajmidan namuna hajmi + Ac/Re jadvali |
| EP-QC-005 | Defekt og'irligi 3 daraja: kritik (0% o'tadi) / jiddiy (Ac=1) / kichik (Ac=3 kosmetic) |
| EP-QC-072 | Sort darajasi: 1-sort / 2-sort / 3-sort + brak, narx koeffitsienti bilan |
| EP-QC-090 | Brak kelib chiqishi: `incoming_defect` (oldingi bosqich) / `this_step_defect` (bu bosqich) |

### 2.4 Qabul mezoni (vizyon-moslik, Q-40)
Har feature uchun "to'g'ri" o'lchovlari:

| Feature | To'g'ri deb hisoblanadi |
|---------|------------------------|
| GetDefectsHandler | `qc_defects` jadvalidan SELECT, kamida `defect_code`/`severity`/`status` keladi |
| GetReclamationsHandler | `qc_reclamations` jadvalidan SELECT, `reclamation_number`/`status`/`client_name` keladi |
| CreateReclamationHandler | DB ga REAL INSERT (qcReclamations serial PK), `reclamation_number` auto-format: `RCL-YYYY-NNNNN` |
| OperationClosedListener | Har MES operation_id uchun `qc_braks` INSERT qilishga tayyor prompt ochiladi (brak yozilmasa — PASS, lekin event log yoziladi) |
| QCDashboard `/api/qc/dashboard/stats` | 200 qaytaradi, `open_defects`/`brak_7days`/`pass_rate` haqiqiy DB dan |
| QCDashboard `/api/qc/dashboard/flow` | 200 qaytaradi, 4 bosqich flow (`incoming`/`in_process`/`final`/`dispatch`) bilan |
| `/api/qc/supplier-quality` | 200 qaytaradi (endpoint URL to'g'rilanadi) |
| ReclamationsPage | CREATE mutation ishlaydi, yangi reklamatsiya POST `/api/qc/reclamations` ga boradi va jadvalda ko'rinadi |
| QCBraksTab | `causation_type` field ko'rsatiladi (incoming_defect / this_step_defect) |
| DefectCatalogPage | `defect_catalog` jadvalidan GET, filter va jadval ko'rinishi |
| PreProductionChecklistPage | `qc_pre_production_checklists` jadvalidan GET + PATCH (belgilash) |
| AQLTablePage | `qc_aql_table` jadvalidan GET statik jadval ko'rinishi — **URL: `/api/qc/aql` (P18 endpointi; `/api/qc/aql-table` EMAS)** |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (EXISTS)

**Backend:**
- `apps/api/src/modules/qc/` — to'liq DDD modul (controllers/services/repos/domain/commands/queries/events)
- `apps/api/src/modules/qc/qc.module.ts` — ro'yxatdan o'tgan, barcha provayderlar ulangan
- `apps/api/src/modules/qc/infrastructure/event-handlers/mes-completed.listener.ts` — MesCompletedEvent handler: REAL INSERT qc_inspections jadvaliga (session-level)
- `apps/api/src/modules/qc/presentation/qc-inspections.controller.ts` — CRUD real DB
- `apps/api/src/modules/qc/presentation/qc-reclamations.controller.ts` — list/stats/getById/create real DB
- `apps/api/src/modules/qc/presentation/qc-new.controller.ts` — dashboard/checkpoints/ai-trend/certificates/lab-tests/spc/supplier-quality real DB
- `apps/api/src/modules/qc/presentation/qc-extended.controller.ts` — standards/final-inspection/in-process/root-causes real DB
- `lib/db/src/schema/qc-schema.ts` — qcReclamations (serial PK), qcBraks, qcFinalInspections, qcRootCauses, qcStandards, qcParameterDefinitions, qcMaterialTests, qcSupplierQuality
- `apps/api/src/shared/db/schema-misc-qc.ts` — qc_defects (real table), qc_reclamations (UUID PK — bu IKKINCHI ta'rif), qc_checkpoints, qc_certificates, qc_lab_tests, qc_parameters, qc_spc_data, qc_supplier_quality
- `docs/migration/seed/seed-05-defects.sql` — defect_catalog seed (APPROVED 2026-06-18) — CREATE TABLE + 50+ yozuv

**Frontend:**
- `artifacts/erp-dashboard/src/pages/QCDashboard.tsx` + QCDashboardSections/Types/Helpers — real useQuery + useMutation
- `artifacts/erp-dashboard/src/pages/qc/` — ReclamationsPage, QCBraksTab, QualityTrendPage, SupplierQualityPage, PaperParametersPage va boshqalar
- `artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx` — QC_ROUTES: 14 route wire qilingan

### 3.2 Buzuq yoki noto'g'ri (BROKEN/FAKE)

#### BE-B1: GetDefectsHandler noto'g'ri jadvaldan o'qiydi
**Fayl:** `apps/api/src/modules/qc/application/queries/get-defects.handler.ts:26-27`
```typescript
// HOZIR (NOTO'G'RI) — camera AI jadvalidan o'qiydi
exec(sql`SELECT COUNT(*)::int AS count FROM quality_defects_camera`),
exec(sql`SELECT id, camera_id, work_center_id, product_name, defect_type, severity, description, image_url, ai_confidence, is_resolved, resolved_at, created_at FROM quality_defects_camera ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`),
```
**Muammo:** `quality_defects_camera` = AI kamera jadval; `GetDefectsQuery` = domain defektlari so'rovi. Bu noto'g'ri jadval — MISLABELED handler.

#### BE-B2: GetReclamationsHandler noto'g'ri jadvaldan o'qiydi
**Fayl:** `apps/api/src/modules/qc/application/queries/get-reclamations.handler.ts:26-27`
```typescript
// HOZIR (NOTO'G'RI) — camera jadvalidan, resolved=false filter bilan
exec(sql`SELECT COUNT(*)::int AS count FROM quality_defects_camera WHERE is_resolved = false`),
exec(sql`SELECT id, camera_id, ... FROM quality_defects_camera WHERE is_resolved = false ...`),
```
**Muammo:** Reklamatsiyalar `quality_defects_camera` bilan HECH qanday aloqasi yo'q. `qc_reclamations` ishlatilishi kerak.

#### BE-B3: CreateReclamationHandler noto'g'ri repo ishlatadi
**Fayl:** `apps/api/src/modules/qc/application/commands/create-reclamation.handler.ts:13,21,41`
```typescript
// HOZIR (NOTO'G'RI)
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';
@Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
const saveResult = await this.qcRepository.saveReclamation(reclamation);
```
**Muammo 1:** `QC_DEFECT_REPO` = `IQcDefectRepository` (defect uchun). Reklamatsiya saqlash uchun `DrizzleQcReclamationRepo` kerak.
**Muammo 2:** `generateId()` = `Math.random().toString(36)` — bu `qc_reclamations.id` (serial integer) ga INSERT qilishga mos emas. Serial PK uchun id generatsiya shart emas.
**Muammo 3:** `reclamation_number` ustuni qo'yilmagan (`RCL-YYYY-NNNNN` format kerak).

#### BE-B4: OperationClosedListener MAVJUD EMAS
**Fayl:** `apps/api/src/modules/qc/infrastructure/event-handlers/operation-closed.listener.ts` — **fayl yo'q**
**Muammo:** MES operatsiya tugaganda brak yozish imkoniyati ochilishi kerak (EP-QC-029/083). `MesCompletedEvent` = sessiya darajasi; operatsiya darajasi alohida listener shart.

#### BE-B5: QCDashboard `/api/qc/dashboard/stats` va `/api/qc/dashboard/flow` yo'q
**Fayl:** `apps/api/src/modules/qc/presentation/qc-new.controller.ts`
```typescript
// HOZIR: faqat GET 'dashboard' bor (qator 54-59):
@Get('dashboard')
async getDashboard() { return unwrapOrInternal(await this.svc.getDashboard()); }
// YOQDAGI: GET 'dashboard/stats' va GET 'dashboard/flow' MAVJUD EMAS
```
**Muammo:** `QCDashboard.tsx:39-40` quyidagi URL larni chaqiradi:
```typescript
queryKey: ["/api/qc/dashboard/stats"]  // 404!
queryKey: ["/api/qc/dashboard/flow"]   // 404!
```
Endpoint yo'q → FE doim error ko'rsatadi.

#### BE-B6: `/api/qc/supplier-quality` URL noto'g'ri (FE-BE mismatch)
**FE:** `QCDashboard.tsx:43` — `queryKey: ["/api/qc/supplier-quality"]`
**BE:** `qc-new.controller.ts:143` — `@Get('supplier-quality/ratings')` → `/api/qc/supplier-quality/ratings`
**Muammo:** Trailing path `/ratings` yo'qolgan → 404.

#### BE-B7: `getControlCharts` DB chaqiruvi controller ichida (Qoida 6 buzilishi)
**Fayl:** `apps/api/src/modules/qc/presentation/qc-new.controller.ts:116-129`
```typescript
async getControlCharts() {
  const r = await db.execute(sql`SELECT ...FROM qc_spc_data GROUP BY parameter_id ...`);
  // ← DB to'g'ridan controller ichida! Qoida 15 + Qoida 6 buzilishi
}
```

#### BE-B8: `qcReclamations` dual-schema drift
- `apps/api/src/shared/db/schema-misc-qc.ts:31` — `qc_reclamations` = UUID PK + `customerName text`
- `lib/db/src/schema/qc-schema.ts:205` — `qcReclamations` = serial PK + `clientName text`, `reclamationNumber varchar`
- `DrizzleQcReclamationRepo` → `@shared/db` import → UUID versiyani ishlatadi
- `CreateReclamationHandler` → `QC_DEFECT_REPO` → noto'g'ri (B3)

**Kanonik jadval:** `lib/db/src/schema/qc-schema.ts::qcReclamations` (serial PK) — bu vizyon bilan mos (`reclamation_number` ustuni bor). `schema-misc-qc.ts` ning UUID versiyasi = eski stub.

#### FE-F1: QCDashboard 3 ta 404 URL
```typescript
// QCDashboard.tsx:39,40,43
queryKey: ["/api/qc/dashboard/stats"]     // 404 — mavjud emas
queryKey: ["/api/qc/dashboard/flow"]      // 404 — mavjud emas
queryKey: ["/api/qc/supplier-quality"]    // 404 — /ratings yo'q
```

#### FE-F2: ReclamationsPage — faqat GET, mutation yo'q (Qoida 19 buzilishi)
**Fayl:** `artifacts/erp-dashboard/src/pages/qc/ReclamationsPage.tsx:6-7`
```typescript
import { useQuery } from "@tanstack/react-query";  // faqat useQuery!
// useMutation yo'q — reklamatsiya yaratish/yangilash imkoni yo'q
```

#### FE-F3: QCBraksTab — `causation_type` field yo'q
**Fayl:** `artifacts/erp-dashboard/src/pages/qc/QCBraksTab.tsx`
Brak interfeysi va forma `causation_type` (incoming_defect/this_step_defect) field ko'rsatmaydi (EP-QC-090).

### 3.3 Mavjud emas (MISSING)

| Feature | Holat |
|---------|-------|
| `defect_catalog` Drizzle schema | Seed SQL bor (seed-05), lekin `lib/db/` da `pgTable` yo'q |
| `qc_aql_table` | Jadval ham, schema ham, endpoint ham yo'q |
| `qc_pre_production_checklists` | Jadval yo'q |
| `qcBraks.causation_type` ustuni | Drizzle sxemada yo'q |
| `qcRootCauses` migration | `lib/db/qc-schema.ts` da ta'riflangan, lekin `apps/api/migrations/` da CREATE TABLE yo'q |
| `PreProductionChecklistPage.tsx` | FE sahifa yo'q |
| `DefectCatalogPage.tsx` | FE sahifa yo'q |
| `AQLTablePage.tsx` | FE sahifa yo'q |
| `qc-checklist.repository.ts` | Fayl yo'q |
| `qc-checklist.service.ts` | Fayl yo'q |
| `qc-checklist.controller.ts` | Fayl yo'q |
| `qc-root-cause.repository.ts` | Fayl yo'q (mavjud: `qc-extended-root-causes.repository.ts`) |
| `operation-closed.listener.ts` | Fayl yo'q |

---

## 4. ISH (QADAM-BAQADAM)

### Qadam 1: GetDefectsHandler — noto'g'ri jadval fix
**Fayl:** `apps/api/src/modules/qc/application/queries/get-defects.handler.ts`

**Muammo:** `quality_defects_camera` ishlatilgan (BE-B1).
**Yechim:** `qc_defects` Drizzle table ishlatiladi (`@shared/db` dan import). Drizzle ORM ishlatiladi (Qoida 3).

**Oldin (qator 6-17, NOTO'G'RI):**
```typescript
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
// ...
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};
// execute() ichida:
exec(sql`SELECT COUNT(*)::int AS count FROM quality_defects_camera`),
exec(sql`SELECT id, camera_id, ... FROM quality_defects_camera ORDER BY ...`),
```

**Keyin (TO'G'RI):**
```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, qc_defects } from '@shared/db';
import { desc, ne, sql } from 'drizzle-orm';
import { GetDefectsQuery } from './get-defects.query';

type DefectsRow = {
  id: number; defectCode: string | null; description: string | null;
  severity: string | null; status: string | null;
  productionOrderId: string | null; createdAt: Date | null;
};
type DefectsResponse = {
  ok: boolean;
  data: { data: DefectsRow[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
};

@Injectable()
@QueryHandler(GetDefectsQuery)
export class GetDefectsHandler implements IQueryHandler<GetDefectsQuery, DefectsResponse> {
  private readonly logger = new Logger(GetDefectsHandler.name);

  async execute(query: GetDefectsQuery): Promise<DefectsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [countResult, items] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(qc_defects),
      db.select({
        id: qc_defects.id,
        defectCode: qc_defects.defectCode,
        description: qc_defects.description,
        severity: qc_defects.severity,
        status: qc_defects.status,
        productionOrderId: qc_defects.productionOrderId,
        createdAt: qc_defects.createdAt,
      }).from(qc_defects)
        .orderBy(desc(qc_defects.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    this.logger.log({ page, limit, total }, 'Domain defects retrieved from qc_defects');
    return {
      ok: true,
      data: { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    };
  }
}
```

**Tekshirish:** `SELECT count(*) FROM qc_defects;` → 0 bo'lsa ham OK (to'g'ri jadval). GET /api/qc-defects → 200, data.data = `[]` yoki haqiqiy yozuvlar.

---

### Qadam 2: GetReclamationsHandler — noto'g'ri jadval fix
**Fayl:** `apps/api/src/modules/qc/application/queries/get-reclamations.handler.ts`

**Muammo:** `quality_defects_camera` ishlatilgan (BE-B2).
**Yechim:** Kanonik `qcReclamations` (`lib/db/qc-schema.ts` — serial PK versiyasi) ishlatiladi.

**Import o'zgarishi:** `from '@shared/db'` o'rniga `@workspace/db` dan (qcReclamations serial versiyasi u yerda).

**Oldin (NOTO'G'RI):**
```typescript
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
// ...
exec(sql`SELECT COUNT(*)::int AS count FROM quality_defects_camera WHERE is_resolved = false`),
exec(sql`SELECT id, ... FROM quality_defects_camera WHERE is_resolved = false ...`),
```

**Keyin (TO'G'RI):**
```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { qcReclamations } from '@workspace/db';
import { desc, eq, sql } from 'drizzle-orm';
import { GetReclamationsQuery } from './get-reclamations.query';

type ReclamationRow = {
  id: number; reclamationNumber: string; clientName: string;
  status: string; issueType: string; claimDate: string;
  defectQuantity: number | null; resolvedAt: Date | null; createdAt: Date;
};
type ReclamationsResponse = {
  ok: boolean;
  data: { data: ReclamationRow[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
};

@Injectable()
@QueryHandler(GetReclamationsQuery)
export class GetReclamationsHandler implements IQueryHandler<GetReclamationsQuery, ReclamationsResponse> {
  private readonly logger = new Logger(GetReclamationsHandler.name);

  async execute(query: GetReclamationsQuery): Promise<ReclamationsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [countResult, items] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(qcReclamations),
      db.select({
        id: qcReclamations.id,
        reclamationNumber: qcReclamations.reclamationNumber,
        clientName: qcReclamations.clientName,
        status: qcReclamations.status,
        issueType: qcReclamations.issueType,
        claimDate: qcReclamations.claimDate,
        defectQuantity: qcReclamations.defectQuantity,
        resolvedAt: qcReclamations.resolvedAt,
        createdAt: qcReclamations.createdAt,
      }).from(qcReclamations)
        .orderBy(desc(qcReclamations.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    this.logger.log({ page, limit, total }, 'Reclamations retrieved from qc_reclamations');
    return {
      ok: true,
      data: { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    };
  }
}
```

**DB proof:** `SELECT count(*) FROM qc_reclamations;` ishlashi kerak. Agar jadval mavjud emas bo'lsa → DDL migration d19-04 ni birinchi run et.

---

### Qadam 3: CreateReclamationHandler — repo va ID to'g'irlash
**Fayl:** `apps/api/src/modules/qc/application/commands/create-reclamation.handler.ts`

**Muammo (BE-B3):**
1. `QC_DEFECT_REPO` noto'g'ri — `DrizzleQcReclamationRepo` kerak
2. `generateId()` = `Math.random()` — serial PK uchun id kerak emas; `reclamation_number` format: `RCL-YYYY-NNNNN`
3. `reclamation_number` avtomatik generatsiya qilinmaydi

**Yechim:** Drizzle direct insert `qcReclamations` serial PK jadvaliga. `reclamation_number = 'RCL-' + year + '-' + padded_seq` (DB SEQUENCE yoki count+1 bilan).

**Oldin (NOTO'G'RI):**
```typescript
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';
// ...
@Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
// ...
const reclamation = new Reclamation(this.generateId(), ...);
const saveResult = await this.qcRepository.saveReclamation(reclamation);
// generateId() = Math.random().toString(36)... — serial PK uchun mos emas
```

**Keyin (TO'G'RI):**
```typescript
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { CreateReclamationCommand } from './create-reclamation.command';
import { db } from '@shared/db';
import { qcReclamations } from '@workspace/db';
import { sql } from 'drizzle-orm';

@Injectable()
@CommandHandler(CreateReclamationCommand)
export class CreateReclamationHandler implements ICommandHandler<CreateReclamationCommand> {
  private readonly logger = new Logger(CreateReclamationHandler.name);

  async execute(command: CreateReclamationCommand): Promise<Result<{ id: number; reclamationNumber: string }>> {
    try {
      const year = new Date().getFullYear();
      // Joriy yildagi reklamatsiyalar soni + 1 = ketma-ket raqam
      const countRes = await db.select({ cnt: sql<number>`count(*)::int` })
        .from(qcReclamations)
        .where(sql`extract(year from ${qcReclamations.createdAt}) = ${year}`);
      const seq = (countRes[0]?.cnt ?? 0) + 1;
      const reclamationNumber = `RCL-${year}-${String(seq).padStart(5, '0')}`;

      const claimDate = _time.now().toISOString().slice(0, 10); // YYYY-MM-DD
      const [inserted] = await db.insert(qcReclamations).values({
        reclamationNumber,
        clientName: command.customerName,
        clientId: command.customerId ?? null,
        orderId: command.orderId ?? null,
        claimDate,
        issueType: 'other',          // command dan keladigan bo'lsa o'zgartir
        description: command.description,
        severity: command.severity ?? 'major',
        status: 'new',
      }).returning({ id: qcReclamations.id, reclamationNumber: qcReclamations.reclamationNumber });

      this.logger.log({ id: inserted.id, reclamationNumber }, 'Reclamation created');
      return Ok({ id: inserted.id, reclamationNumber: inserted.reclamationNumber });
    } catch (e: unknown) {
      this.logger.error('Failed to create reclamation', String(e));
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
```

**Diqqat:** `CreateReclamationCommand` da `issueType` field bo'lmasa — `command.description` dan aniqlash logikasi yoki default `'other'` qoldirish. Agar `CreateReclamationCommand` da `issueType` yo'q bo'lsa, FAQAT bu faylga teg (owned file), commandga ham teg bo'lsa — bu `create-reclamation.command.ts` ni ham o'zgartiradi, lekin bu owned file emas → command faylni ko'r, agar oddiy ustun qo'shish bo'lsa 5 qadam ni flag qil.

**DB proof:**
```sql
INSERT INTO qc_reclamations (reclamation_number, client_name, claim_date, issue_type, description, status)
VALUES ('RCL-TEST-00001', 'Test Mijoz', CURRENT_DATE::text, 'other', 'Test', 'new')
RETURNING id, reclamation_number;
-- Natija: id = 1 (serial), reclamation_number = 'RCL-TEST-00001'
```

---

### Qadam 4: OperationClosedListener — yangi fayl yaratish
**Fayl:** `apps/api/src/modules/qc/infrastructure/event-handlers/operation-closed.listener.ts` (YANGI)

**Maqsad (EP-QC-029/083):** MES operatsiya tugaganda (`OperationClosedEvent`) QC brak prompt ochiladi. Agar MES da `OperationClosedEvent` mavjud bo'lmasa → birinchi `mes/domain/events/` ni ko'r.

**Tekshirish:**
```bash
ls apps/api/src/modules/mes/domain/events/
# Natija: mes-completed.event.ts, mes-to-hr-360.event.ts
# OperationClosedEvent YO'Q → biz oddiy NestJS EventEmitter2 event uchun listener yozamiz
```

`OperationClosedEvent` MES tomonda yo'q (P18 buyrug'i bor — lekin bu faylda emas). Bu holda:
- `OperationClosedEvent` ni MES domeni chiqarguncha bu listener NestJS `@OnEvent` pattern bilan `mes.operation.closed` string eventni kutadi.
- Listener `qc_braks` jadvaliga `priladka` / `stage=production` bilan placeholder INSERT qilmaydi — faqat event logini yozadi va `brak_prompt_opened` metadatasini (JSON) `qc_inspections` ga yozadi.

```typescript
/**
 * @module operation-closed.listener
 * @description NestJS @OnEvent listener for 'mes.operation.closed' (EP-QC-029/083).
 *   When a MES operation closes, a brak-prompt flag is written to qc_inspections
 *   so the QC inspector can record brak for this specific operation.
 *   NOTE: OperationClosedEvent is not yet a typed CQRS event in mes/domain/events/;
 *   using NestJS EventEmitter2 string-event as interim bridge (P18 will upgrade).
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

interface OperationClosedPayload {
  sessionId: number;
  operationId: number | string;
  operationType?: string;
  smenaId?: number;
  operatorId?: number;
  timestamp?: Date;
}

@Injectable()
export class OperationClosedListener {
  private readonly logger = new Logger(OperationClosedListener.name);

  @OnEvent('mes.operation.closed', { async: true })
  async handle(payload: OperationClosedPayload): Promise<void> {
    try {
      // brak_prompt_opened = true degan meta yoz, QC inspector ko'rsini
      await db.execute(sql`
        INSERT INTO qc_inspections
          (order_id, reference_type, status, items_checked, items_passed, items_failed, notes, created_at, updated_at)
        VALUES
          (${payload.sessionId}, 'mes_operation', 'pending', 0, 0, 0,
           ${'op:' + String(payload.operationId) + ':brak_prompt'},
           NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);
      this.logger.log(
        { sessionId: payload.sessionId, operationId: payload.operationId },
        'OperationClosed — QC brak-prompt inspection created',
      );
    } catch (e: unknown) {
      this.logger.error({ err: String(e) }, 'OperationClosedListener error');
    }
  }
}
```

**qc.module.ts ga qo'shish:** `OperationClosedListener` ni `providers: []` ga qo'sh — bu **qc.module.ts** fayli owned file emas. TO'XTA → qc.module.ts ga `OperationClosedListener` qo'shish kerak — `egasiga flag qil`:

> **FLAG P19-MOD:** `qc.module.ts` owned file emas. P19 tugaganidan keyin egasi `providers: [..., OperationClosedListener]` qo'shishi kerak, yoki P50 da route-reg bilan birga qo'shiladi. Bu flagni `COMMIT` xabariga qo'sh.

---

### Qadam 5: QcNewController — `dashboard/stats` va `dashboard/flow` endpoint qo'shish
**Fayl:** `apps/api/src/modules/qc/presentation/qc-new.controller.ts`

**Muammo:** `QCDashboard.tsx` quyidagi URL larni chaqiradi lekin ular mavjud emas (BE-B5/FE-F1):
- `GET /api/qc/dashboard/stats`
- `GET /api/qc/dashboard/flow`

**Shuningdek:** `getControlCharts()` ichida `db.execute` to'g'ridan ishlatilgan (Qoida 6/15 buzilishi — BE-B7). Bu metod `QcNewService` + `QcNewRepository` ga ko'chiriladi.

**Shuningdek:** `/api/qc/supplier-quality/ratings` → `/api/qc/supplier-quality` ga ham alias qo'shiladi (BE-B6/FE-F1).

**Controller o'zgarishlari (`qc-new.controller.ts`):**

1. `db` va `sql` import olib tashlanadi (controller DB ni to'g'ridan ishlatmasligi kerak — Qoida 6)
2. `getControlCharts()` → `this.svc.getControlCharts()` ga delegat qilinadi
3. Yangi endpointlar:

```typescript
// qc-new.controller.ts — yangi endpoint bloklari (mavjud @Get('dashboard') dan keyin):

@Get('dashboard/stats')
@Roles(...QC_ROLES)
@ApiOperation({ summary: 'QC dashboard statistics (KPI cards)' })
async getDashboardStats() {
  return unwrapOrInternal(await this.svc.getDashboardStats());
}

@Get('dashboard/flow')
@Roles(...QC_ROLES)
@ApiOperation({ summary: 'QC 4-stage flow data' })
async getDashboardFlow() {
  return unwrapOrInternal(await this.svc.getDashboardFlow());
}

@Get('supplier-quality')
@Roles(...QC_ROLES)
@ApiOperation({ summary: 'Supplier quality ratings (alias without /ratings)' })
async getSupplierQuality() {
  return unwrapOrInternal(await this.svc.getSupplierQualityRatings());
}
```

**`db` import olib tashlash:** `import { db } from '@shared/db';` va `import { sql } from 'drizzle-orm';` — controller dan o'chir (faqat service/repo da bo'lishi kerak).

**`getControlCharts()` controller ichidagi versiyani o'zgartir:**
```typescript
// Oldin (NOTO'G'RI — controller ichida db.execute):
async getControlCharts() {
  const r = await db.execute(sql`SELECT parameter_id ... FROM qc_spc_data ...`);
  const items = ((r as { rows?: unknown[] }).rows) ?? [];
  return { items, total: items.length };
}

// Keyin (TO'G'RI — service ga delegat):
async getControlCharts() {
  return unwrapOrInternal(await this.svc.getControlCharts());
}
```

---

### Qadam 6: QcNewRepository + QcNewService — yangi metodlar
**Fayl:** `apps/api/src/modules/qc/infrastructure/repositories/qc-new.repository.ts`

`getDashboardStats()`, `getDashboardFlow()`, `getControlCharts()` metodlarini qo'sh:

**`getDashboardStats()` — hozirgi `getDashboardStats()` ning qisqartirilgan versiyasi (allaqachon mavjud):**

Mavjud `getDashboardStats()` → `getDashboard()` deb nomlanadi hozir. Yangi endpoint `dashboard/stats` uchun:

```typescript
// qc-new.repository.ts ga qo'sh:
async getDashboardStatsKpi(): Promise<Result<{
  open_defects: number; brak_7days: number; pass_rate: number;
  open_reclamations: number; pending_inspections: number;
  tests: { passRate: number }; openRca: number;
}>> {
  return safeCall(async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);
    const [defects, braks, inspPending, rcaOpen] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(qc_defects)
        .where(ne(qc_defects.status, 'resolved')),
      db.select({ qty: sql<number>`coalesce(sum(${qcBraks.quantity}),0)::int` }).from(qcBraks)
        .where(gte(qcBraks.createdAt, sevenDaysAgo)),
      db.select({ count: sql<number>`count(*)::int` }).from(qc_inspections)
        .where(eq(qc_inspections.status, 'pending')),
      // qc_root_causes — agar jadval mavjud bo'lsa:
      db.execute(sql`SELECT count(*)::int AS cnt FROM qc_root_causes WHERE status='open'`)
        .catch(() => ({ rows: [{ cnt: 0 }] })),
    ]);
    const openRca = Number((rcaOpen as { rows?: Array<{ cnt: number }> }).rows?.[0]?.cnt ?? 0);
    return {
      open_defects: defects[0]?.count ?? 0,
      brak_7days: braks[0]?.qty ?? 0,
      pass_rate: 0,                       // SPC / test natijalaridan hisoblanadi (kengaytirish mumkin)
      open_reclamations: 0,               // qcReclamations COUNT (keyinroq)
      pending_inspections: inspPending[0]?.count ?? 0,
      tests: { passRate: 0 },
      openRca,
    };
  }, 'DB_ERROR');
}

async getDashboardFlow(): Promise<Result<{
  stages: Array<{ stage: string; total: number; pending: number; passed: number; failed: number }>;
}>> {
  return safeCall(async () => {
    const rows = await db.select({
      stage: qc_checkpoints.stage,
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${qc_checkpoints.isActive})::int`,
    }).from(qc_checkpoints).groupBy(qc_checkpoints.stage).orderBy(qc_checkpoints.stage);

    const stages = rows.map((r) => ({
      stage: r.stage,
      total: r.total,
      pending: 0,
      passed: 0,
      failed: 0,
    }));
    // Agar qc_checkpoints bo'sh bo'lsa — default 4 bosqich qaytariladi
    const defaults = ['incoming', 'in_process', 'final', 'dispatch'];
    if (stages.length === 0) {
      return { stages: defaults.map((s) => ({ stage: s, total: 0, pending: 0, passed: 0, failed: 0 })) };
    }
    return { stages };
  }, 'DB_ERROR');
}

async getControlCharts(): Promise<Result<{ items: unknown[]; total: number }>> {
  return safeCall(async () => {
    const rows = await db.select({
      parameterId: qc_spc_data.parameterId,
      dataPoints: sql<number>`count(*)::int`,
      mean: sql<string>`avg(${qc_spc_data.value})::numeric(8,3)`,
      minVal: sql<string>`min(${qc_spc_data.value})::numeric(8,3)`,
      maxVal: sql<string>`max(${qc_spc_data.value})::numeric(8,3)`,
      lastMeasuredAt: sql<Date>`max(${qc_spc_data.measuredAt})`,
    }).from(qc_spc_data)
      .groupBy(qc_spc_data.parameterId)
      .orderBy(sql`max(${qc_spc_data.measuredAt}) DESC NULLS LAST`);
    return { items: rows, total: rows.length };
  }, 'DB_ERROR');
}
```

**Import tekshirish:** `qc_inspections`, `qc_spc_data` → `@shared/db` dan mavjud. `qcBraks` → `@shared/db/schema-compat-3` (hozir ham shu).

**`qc-new.service.ts` ga metodlar qo'sh:**
```typescript
// QcNewService ga qo'sh:
async getDashboardStats() { return this.repo.getDashboardStatsKpi(); }
async getDashboardFlow()  { return this.repo.getDashboardFlow(); }
async getControlCharts()  { return this.repo.getControlCharts(); }
```

---

### Qadam 7: qc-root-cause.repository.ts — yangi fayl
**Fayl:** `apps/api/src/modules/qc/infrastructure/repositories/qc-root-cause.repository.ts` (YANGI)

Mavjud `qc-extended-root-causes.repository.ts` — raw SQL (`runQuery`) ishlatadi va `Err(String(e))` (qoida 1 buzilishi: `AppErr` kerak). Yangi fayl kanonik pattern bilan:

```typescript
/**
 * @module qc-root-cause.repository
 * @description Repository for qc_root_causes — 5-Why RCA lifecycle.
 *   Wraps qcRootCauses (lib/db/qc-schema.ts, serial PK).
 *   Returns Result<T> via safeCall.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { qcRootCauses } from '@workspace/db';
import { eq, desc, and } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();

export type InsertRootCauseDto = {
  entityType: 'final_inspection' | 'brak' | 'reclamation' | 'material_test';
  entityId: string;
  papkaOrderId?: string | null;
  why1?: string; why2?: string; why3?: string; why4?: string; why5?: string;
  rootCause?: string;
  category?: 'equipment' | 'operator' | 'material' | 'process' | 'environment';
  correctiveAction?: string;
  preventiveAction?: string;
  responsibleUserId?: number | null;
  dueDate?: string | null;
};

@Injectable()
export class QcRootCauseRepository {
  async list(entityType?: string, entityId?: string): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const conditions = [];
      if (entityType) conditions.push(eq(qcRootCauses.entityType, entityType));
      if (entityId)   conditions.push(eq(qcRootCauses.entityId, entityId));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(qcRootCauses).where(where)
        .orderBy(desc(qcRootCauses.createdAt)).limit(100);
    }, 'DB_ERROR');
  }

  async create(dto: InsertRootCauseDto): Promise<Result<{ id: number }>> {
    return safeCall(async () => {
      const [row] = await db.insert(qcRootCauses).values({
        entityType: dto.entityType,
        entityId: dto.entityId,
        papkaOrderId: dto.papkaOrderId ?? null,
        why1: dto.why1 ?? null,
        why2: dto.why2 ?? null,
        why3: dto.why3 ?? null,
        why4: dto.why4 ?? null,
        why5: dto.why5 ?? null,
        rootCause: dto.rootCause ?? null,
        category: dto.category ?? null,
        correctiveAction: dto.correctiveAction ?? null,
        preventiveAction: dto.preventiveAction ?? null,
        responsibleUserId: dto.responsibleUserId ?? null,
        dueDate: dto.dueDate ?? null,
        status: 'open',
      }).returning({ id: qcRootCauses.id });
      return { id: row.id };
    }, 'DB_ERROR');
  }

  async updateStatus(id: number, status: 'open' | 'in_progress' | 'closed', closedBy?: number): Promise<Result<{ id: number }>> {
    return safeCall(async () => {
      const [row] = await db.update(qcRootCauses).set({
        status,
        closedAt: status === 'closed' ? _time.now() : null,
        closedBy: closedBy ? String(closedBy) : null,
        updatedAt: _time.now(),
      }).where(eq(qcRootCauses.id, id)).returning({ id: qcRootCauses.id });
      return { id: row.id };
    }, 'DB_ERROR');
  }
}
```

---

### Qadam 8: qc-checklist.repository.ts — yangi fayl
**Fayl:** `apps/api/src/modules/qc/infrastructure/repositories/qc-checklist.repository.ts` (YANGI)

**Diqqat (DDL DARVOZASI):** `qc_pre_production_checklists` jadval YO'Q. Shu sababli:
- Repository yoziladi
- DDL migration d19-02 yoziladi (GATED — ishga tushirilmaydi)
- DB proof faqat migration run etilgandan keyin mumkin

```typescript
/**
 * @module qc-checklist.repository
 * @description Repository for qc_pre_production_checklists.
 *   TABLE: qc_pre_production_checklists (migration d19-02, GATED until owner approves).
 *   Returns Result<T> via safeCall.
 *
 *   NOTE: This repository will throw at runtime until migration d19-02 is run.
 *   The service catches errors via safeCall — callers receive Err('DB_ERROR').
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();

type ChecklistRow = Record<string, unknown>;

export type CreateChecklistDto = {
  orderId?: number | null;
  sessionId?: number | null;
  checkedBy?: number | null;
};

export type PatchChecklistDto = {
  materialChecked?: boolean;
  qolipChecked?: boolean;
  faylChecked?: boolean;
  namunaChecked?: boolean;
  gramajChecked?: boolean;
  status?: 'PENDING' | 'PASSED' | 'FAILED';
};

@Injectable()
export class QcChecklistRepository {
  private readonly logger = new Logger(QcChecklistRepository.name);

  async listByOrder(orderId: number): Promise<Result<ChecklistRow[]>> {
    return safeCall(async () => {
      const res = await db.execute(
        sql`SELECT * FROM qc_pre_production_checklists WHERE order_id = ${orderId} ORDER BY created_at DESC LIMIT 50`
      );
      return (res as { rows?: ChecklistRow[] }).rows ?? [];
    }, 'DB_ERROR');
  }

  async create(dto: CreateChecklistDto): Promise<Result<{ id: number }>> {
    return safeCall(async () => {
      const res = await db.execute(sql`
        INSERT INTO qc_pre_production_checklists
          (order_id, session_id, checked_by, status, created_at, updated_at)
        VALUES
          (${dto.orderId ?? null}, ${dto.sessionId ?? null}, ${dto.checkedBy ?? null}, 'PENDING', NOW(), NOW())
        RETURNING id
      `);
      const row = (res as { rows?: Array<{ id: number }> }).rows?.[0];
      if (!row) throw new Error('Insert returned no row');
      return { id: row.id };
    }, 'DB_ERROR');
  }

  async patch(id: number, dto: PatchChecklistDto): Promise<Result<{ id: number }>> {
    return safeCall(async () => {
      // Ustun bo'yicha dinamik UPDATE
      const sets: string[] = [];
      const vals: unknown[] = [];
      if (dto.materialChecked !== undefined) { sets.push(`material_checked = $${vals.push(dto.materialChecked)}`); }
      if (dto.qolipChecked   !== undefined) { sets.push(`qolip_checked = $${vals.push(dto.qolipChecked)}`); }
      if (dto.faylChecked    !== undefined) { sets.push(`fayl_checked = $${vals.push(dto.faylChecked)}`); }
      if (dto.namunaChecked  !== undefined) { sets.push(`namuna_checked = $${vals.push(dto.namunaChecked)}`); }
      if (dto.gramajChecked  !== undefined) { sets.push(`gramaj_checked = $${vals.push(dto.gramajChecked)}`); }
      if (dto.status         !== undefined) { sets.push(`status = $${vals.push(dto.status)}`); }
      sets.push(`updated_at = NOW()`);
      if (sets.length === 1) return { id }; // faqat updated_at → hech narsa o'zgartirilmagan
      // NOTE: Drizzle parametrli execute ishlatiladi (sql injection yo'q)
      const idxParam = vals.length + 1;
      vals.push(id);
      await db.execute(sql.raw(`UPDATE qc_pre_production_checklists SET ${sets.join(', ')} WHERE id = $${idxParam}`));
      return { id };
    }, 'DB_ERROR');
  }
}
```

**Izoh:** `sql.raw(string)` bu yerda MAQBUL — string `sets.join` = faqat hardcoded ustun nomlari (o'zgaruvchi emas, injection xavfi yo'q, Qoida B).

---

### Qadam 9: qc-checklist.service.ts — yangi fayl
**Fayl:** `apps/api/src/modules/qc/application/qc-checklist.service.ts` (YANGI)

```typescript
/**
 * @module qc-checklist.service
 * @description Pre-production checklist use-cases. Returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { QcChecklistRepository, CreateChecklistDto, PatchChecklistDto } from '../infrastructure/repositories/qc-checklist.repository';
import { Result } from '@common/result';

@Injectable()
export class QcChecklistService {
  constructor(private readonly repo: QcChecklistRepository) {}

  listByOrder(orderId: number): Promise<Result<unknown[]>> {
    return this.repo.listByOrder(orderId);
  }

  create(dto: CreateChecklistDto): Promise<Result<{ id: number }>> {
    return this.repo.create(dto);
  }

  patch(id: number, dto: PatchChecklistDto): Promise<Result<{ id: number }>> {
    return this.repo.patch(id, dto);
  }
}
```

---

### Qadam 10: qc-checklist.controller.ts — yangi fayl
**Fayl:** `apps/api/src/modules/qc/presentation/qc-checklist.controller.ts` (YANGI)

```typescript
/**
 * @module qc-checklist.controller
 * @description Pre-production checklist endpoints.
 *   GET  /api/qc/checklists?orderId=N
 *   POST /api/qc/checklists
 *   PATCH /api/qc/checklists/:id
 *
 *   NOTE: depends on migration d19-02 (qc_pre_production_checklists table).
 *   Returns 500 via safeCall until migration is run.
 */

import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { Role } from '@common/constants/roles.constants';
import { z } from 'zod';
import { QcChecklistService } from '../application/qc-checklist.service';

const QC_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, Role.PRODUCTION_MANAGER, 'qc_manager', 'qc_inspector'];

const CreateChecklistSchema = z.object({
  orderId:   z.number().int().positive().optional(),
  sessionId: z.number().int().positive().optional(),
  checkedBy: z.number().int().positive().optional(),
});

const PatchChecklistSchema = z.object({
  materialChecked: z.boolean().optional(),
  qolipChecked:    z.boolean().optional(),
  faylChecked:     z.boolean().optional(),
  namunaChecked:   z.boolean().optional(),
  gramajChecked:   z.boolean().optional(),
  status:          z.enum(['PENDING', 'PASSED', 'FAILED']).optional(),
});

@ApiTags('QC Checklist')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc/checklists')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcChecklistController {
  constructor(private readonly svc: QcChecklistService) {}

  @Get()
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List pre-production checklists by orderId' })
  async list(@Query('orderId') orderId?: string) {
    const oid = orderId ? parseInt(orderId, 10) : 0;
    return unwrapOrInternal(await this.svc.listByOrder(oid));
  }

  @Post()
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Create pre-production checklist' })
  async create(@Body() body: unknown) {
    const dto = CreateChecklistSchema.parse(body);
    return unwrapOrInternal(await this.svc.create(dto));
  }

  @Patch(':id')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Update pre-production checklist fields' })
  async patch(@Param('id') id: string, @Body() body: unknown) {
    const dto = PatchChecklistSchema.parse(body);
    return unwrapOrInternal(await this.svc.patch(parseInt(id, 10), dto));
  }
}
```

---

### Qadam 11: QCDashboard.tsx — URL va supplier-quality fix
**Fayl:** `artifacts/erp-dashboard/src/pages/QCDashboard.tsx`

**O'zgartirish 1:** `/api/qc/supplier-quality` → URL saqlanib qoladi, faqat BE (Qadam 5) yangi `/api/qc/supplier-quality` endpoint qo'shadi.

**O'zgartirish 2:** Stats va flow typelari aniq bo'lishi kerak (hozir `QcStats` va `QcFlowData` type-safe):

`QCDashboardTypes.ts` owned file emas → faqat `QCDashboard.tsx` ichidagi type annotation/import o'zgaradi.

```typescript
// QCDashboard.tsx — o'zgartirilgan queryKey larni tekshir:
// Oldin:
const { data: stats, isLoading: sLoad } = useQuery<QcStats>({ queryKey: ["/api/qc/dashboard/stats"] });
const { data: flow,  isLoading: fLoad } = useQuery<QcFlowData>({ queryKey: ["/api/qc/dashboard/flow"] });
// ← Bu URL lar Qadam 5 dan keyin ISHLAYDI. O'zgartirish kerak emas, BE fix kerak edi.

// /api/qc/supplier-quality → ISHLAYDI (Qadam 5 dan keyin /api/qc/supplier-quality endpoint qo'shiladi)
// O'zgartirish: QCDashboard.tsx da supplier-quality URL o'zgartirilmaydi
// (BE da alias endpoint qo'shildi)
```

**Amaldagi o'zgartirish (FE-F1 fix):** `QCDashboard.tsx` dagi `approveMutation` va `rejectMutation` `invalidateQueries` lari — `/api/qc/dashboard/stats` mavjud bo'lgandan keyin to'g'ri ishlaydi. Bu fayldagi hech narsa o'chirilmaydi (Q-46).

**Loading state tekshirish:** Barcha `isLoading` hollari handle qilingan — `sLoad`, `fLoad`, `bLoad`, `rLoad`, `suLoad` → to'g'ri.

---

### Qadam 12: ReclamationsPage.tsx — CREATE mutation qo'shish
**Fayl:** `artifacts/erp-dashboard/src/pages/qc/ReclamationsPage.tsx`

**Muammo:** Faqat `useQuery` bor, `useMutation` yo'q (FE-F2). Yangi reklamatsiya yaratish imkoni yo'q.

**Qo'shimchalar:**
1. `useMutation` import qo'shish
2. Dialog state (yangi reklamatsiya yaratish)
3. `createMutation` — POST `/api/qc/reclamations`
4. Forma (clientName, description, issueType, orderId)
5. Jadvalga "Yangi reklamatsiya" tugmasi

```typescript
// ReclamationsPage.tsx — qo'shimchalar (faylni to'liq qayta yozma, faqat qo'sh):

// Import qo'sh:
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Komponent ichida:
const { toast } = useToast();
const queryClient = useQueryClient();
const [createOpen, setCreateOpen] = useState(false);
const [form, setForm] = useState({ clientName: '', description: '', issueType: 'other' as string });

const createMutation = useMutation({
  mutationFn: (data: typeof form) =>
    apiRequest("POST", "/api/qc/reclamations", {
      clientName: data.clientName,
      description: data.description,
      issueType: data.issueType,
      claimDate: new Date().toISOString().slice(0, 10),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/qc/reclamations"] });
    setCreateOpen(false);
    setForm({ clientName: '', description: '', issueType: 'other' });
    toast({ title: "Reklamatsiya yaratildi" });
  },
  onError: () => toast({ title: "Xatolik", variant: "destructive" }),
});

// DedicatedPageShell ichiga header qo'shimcha tugma:
// title prop yoniga action prop qo'shiladi (agar DedicatedPageShell qo'llab-quvvatlasa)
// yoki jadval ustiga Button qo'shiladi:
<div className="flex justify-end mb-3">
  <Button size="sm" onClick={() => setCreateOpen(true)}>
    <Plus className="h-4 w-4 mr-1" /> Yangi reklamatsiya
  </Button>
</div>

// Dialog:
<Dialog open={createOpen} onOpenChange={setCreateOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Yangi reklamatsiya</DialogTitle></DialogHeader>
    <div className="space-y-3 py-2">
      <div>
        <Label>Mijoz nomi *</Label>
        <Input value={form.clientName}
          onChange={(e) => setForm(f => ({ ...f, clientName: e.target.value }))}
          placeholder="Mijoz kompaniyasi" />
      </div>
      <div>
        <Label>Muammo turi</Label>
        <Select value={form.issueType} onValueChange={(v) => setForm(f => ({ ...f, issueType: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="print_quality">Bosma sifati</SelectItem>
            <SelectItem value="size_mismatch">O'lcham mos emas</SelectItem>
            <SelectItem value="moisture">Namlik</SelectItem>
            <SelectItem value="damage">Shikast</SelectItem>
            <SelectItem value="other">Boshqa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tavsif *</Label>
        <Textarea value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Muammoni batafsil tasvirlab bering" />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
      <Button
        disabled={!form.clientName || !form.description || createMutation.isPending}
        onClick={() => createMutation.mutate(form)}>
        {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**DB proof:** POST `/api/qc/reclamations` → `SELECT * FROM qc_reclamations ORDER BY id DESC LIMIT 1;` → yangi yozuv ko'rinishi kerak, `reclamation_number = 'RCL-YYYY-NNNNN'`.

---

### Qadam 13: QCBraksTab.tsx — `causation_type` field qo'shish
**Fayl:** `artifacts/erp-dashboard/src/pages/qc/QCBraksTab.tsx`

**Brak interfeysi ga field qo'sh:**
```typescript
// Oldin:
interface Brak {
  id: string; brakDate: string; stage: string; quantity: number;
  reason: string; description: string; costImpact: number;
  isReworkable: boolean; papkaOrderId?: string | number;
}

// Keyin (EP-QC-090 causation qo'sh):
interface Brak {
  id: string; brakDate: string; stage: string; quantity: number;
  reason: string; description: string; costImpact: number;
  isReworkable: boolean; papkaOrderId?: string | number;
  causationType?: 'incoming_defect' | 'this_step_defect' | null;
}
```

**Brak yaratish formasiga `causation_type` Select qo'sh:**
```typescript
// createBrakMutation ga yuborilayotgan data ichida:
causationType: selectedCausation, // state: 'incoming_defect' | 'this_step_defect'

// Forma ichida:
<Select value={selectedCausation} onValueChange={setSelectedCausation}>
  <SelectTrigger><SelectValue placeholder="Kelib chiqishi" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="incoming_defect">Kiruvchi material (oldingi bosqich)</SelectItem>
    <SelectItem value="this_step_defect">Bu bosqich xatosi</SelectItem>
  </SelectContent>
</Select>
```

**Jadval ustuniga qo'sh:**
```typescript
// Brak ro'yxat jadvalida:
<TableCell>
  {r.causationType === 'incoming_defect'
    ? <Badge className="bg-orange-50 text-orange-700">Kiruvchi</Badge>
    : r.causationType === 'this_step_defect'
    ? <Badge className="bg-red-50 text-red-700">Bu bosqich</Badge>
    : <span className="text-muted-foreground text-xs">—</span>
  }
</TableCell>
```

---

### Qadam 14: DefectCatalogPage.tsx — yangi fayl
**Fayl:** `artifacts/erp-dashboard/src/pages/qc/DefectCatalogPage.tsx` (YANGI)

**Endpoint:** GET `/api/qc-defects` (mavjud `QcDefectsController`) — domain defektlari katalogi.

```typescript
/**
 * @module DefectCatalogPage
 * @description Defekt kataloqi — qc_defects jadvalidan defektlar ro'yxati.
 *   Seed: docs/migration/seed/seed-05-defects.sql (50+ defekt, APPROVED 2026-06-18).
 *   GET /api/qc-defects (mavjud QcDefectsController) — filter: severity, status, search.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DedicatedPageShell, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface DefectItem {
  id: number; defectCode: string | null; description: string | null;
  severity: string | null; status: string | null;
  productionOrderId: string | null; createdAt: string | null;
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  major:    "bg-orange-100 text-orange-700",
  minor:    "bg-yellow-100 text-yellow-700",
};

export default function DefectCatalogPage() {
  const { t } = useTranslation('qc');
  const [search, setSearch]     = useState('');
  const [severity, setSeverity] = useState('all');

  const { data, isLoading } = useQuery<{ data: DefectItem[]; pagination: { total: number } }>({
    queryKey: ["/api/qc-defects", severity],
    queryFn: () => apiRequest("GET", `/api/qc-defects?severity=${severity !== 'all' ? severity : ''}&limit=100`),
  });

  const items = Array.isArray(data?.data) ? data.data : [];
  const filtered = items.filter((d) =>
    search === '' ||
    (d.defectCode ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (d.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DedicatedPageShell
      title={t('defectCatalog.title', "Defekt kataloqi")}
      description={t('defectCatalog.description', "Barcha qayd etilgan defektlar (qc_defects)")}
    >
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Qidirish..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Og'irlik" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="critical">Kritik</SelectItem>
            <SelectItem value="major">Jiddiy</SelectItem>
            <SelectItem value="minor">Kichik</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Section title={`Defektlar (${filtered.length})`}>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 rounded" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Defekt topilmadi</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Tavsif</TableHead>
                <TableHead>Og'irlik</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.defectCode ?? '—'}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{d.description ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={SEVERITY_BADGE[d.severity ?? ''] ?? ''}>
                      {d.severity ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>{d.status ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString('uz-UZ') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
```

---

### Qadam 15: PreProductionChecklistPage.tsx — yangi fayl
**Fayl:** `artifacts/erp-dashboard/src/pages/qc/PreProductionChecklistPage.tsx` (YANGI)

**Endpoint:** GET/POST/PATCH `/api/qc/checklists` (Qadam 10 — yangi controller).

```typescript
/**
 * @module PreProductionChecklistPage
 * @description Ishga tushirishdan oldin tekshiruv ro'yxati (EP-QC-007/105).
 *   Uses GET/POST/PATCH /api/qc/checklists (qc-checklist.controller.ts).
 *   NOTE: Requires migration d19-02 (qc_pre_production_checklists table).
 *   Until migration runs, API returns 500 — page shows "Tezda ishga tushadi" gracefully.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DedicatedPageShell, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

interface Checklist {
  id: number; orderId: number | null; sessionId: number | null;
  materialChecked: boolean; qolipChecked: boolean; faylChecked: boolean;
  namunaChecked: boolean; gramajChecked: boolean;
  status: 'PENDING' | 'PASSED' | 'FAILED'; checkedAt: string | null;
}

const STATUS_CONFIG = {
  PENDING: { label: "Kutilmoqda", className: "bg-yellow-100 text-yellow-700" },
  PASSED:  { label: "O'tdi",     className: "bg-green-100 text-green-700" },
  FAILED:  { label: "Rad",       className: "bg-red-100 text-red-700" },
};

const CHECKLIST_FIELDS: Array<{ key: keyof Checklist; label: string }> = [
  { key: 'materialChecked', label: 'Material tekshirildi' },
  { key: 'qolipChecked',    label: 'Qolip tekshirildi' },
  { key: 'faylChecked',     label: 'Fayl (maksi) tekshirildi' },
  { key: 'namunaChecked',   label: 'Namuna tasdiqlandi' },
  { key: 'gramajChecked',   label: 'Gramaj/og'irlik tekshirildi' },
];

export default function PreProductionChecklistPage() {
  const { t } = useTranslation('qc');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState('');
  const [searchOrderId, setSearchOrderId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery<unknown[]>({
    queryKey: ["/api/qc/checklists", searchOrderId],
    queryFn: () => apiRequest("GET", `/api/qc/checklists?orderId=${searchOrderId ?? 0}`),
    enabled: searchOrderId !== null,
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/qc/checklists", {
      orderId: searchOrderId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/checklists"] });
      toast({ title: "Checklist yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/qc/checklists/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/checklists"] });
      toast({ title: "Saqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const items: Checklist[] = Array.isArray(data) ? (data as Checklist[]) : [];

  return (
    <DedicatedPageShell
      title={t('checklist.title', "Pre-production tekshiruv")}
      description={t('checklist.description', "Ishga tushirishdan oldin majburiy tekshiruv ro'yxati (EP-QC-007)")}
    >
      {/* Buyurtma qidirish */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buyurtma ID..." value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearchOrderId(Number(orderId)); }} />
        </div>
        <Button variant="outline" onClick={() => setSearchOrderId(Number(orderId))}>
          <Search className="h-4 w-4" />
        </Button>
        {searchOrderId && (
          <Button size="sm" onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}>
            <ClipboardCheck className="h-4 w-4 mr-1" /> Yangi checklist
          </Button>
        )}
      </div>

      {isError && (
        <div className="text-sm text-muted-foreground text-center py-8 bg-slate-50 rounded">
          Checklist jadval hali tayyor emas (migration d19-02 kutilmoqda)
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32 rounded" />)}</div>
      ) : items.length === 0 && searchOrderId ? (
        <p className="text-sm text-muted-foreground text-center py-8">Bu buyurtma uchun checklist yo'q</p>
      ) : (
        <div className="space-y-4">
          {items.map((cl) => {
            const sCfg = STATUS_CONFIG[cl.status] ?? STATUS_CONFIG.PENDING;
            return (
              <Section key={cl.id} title={`Checklist #${cl.id}`}>
                <div className="flex justify-between items-center mb-3">
                  <Badge className={sCfg.className}>{sCfg.label}</Badge>
                  <Button size="sm" variant="outline"
                    onClick={() => patchMutation.mutate({ id: cl.id, dto: { status: 'PASSED' } })}
                    disabled={cl.status === 'PASSED' || patchMutation.isPending}>
                    O'tdi deb belgilash
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {CHECKLIST_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <Checkbox
                        id={`${cl.id}-${key}`}
                        checked={!!cl[key]}
                        onCheckedChange={(checked) =>
                          patchMutation.mutate({ id: cl.id, dto: { [key]: checked } })
                        }
                      />
                      <Label htmlFor={`${cl.id}-${key}`} className="cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </Section>
            );
          })}
        </div>
      )}
    </DedicatedPageShell>
  );
}
```

---

### Qadam 16: AQLTablePage.tsx — yangi fayl
**Fayl:** `artifacts/erp-dashboard/src/pages/qc/AQLTablePage.tsx` (YANGI)

**Endpoint:** GET **`/api/qc/aql`** — P18 `QcCatalogController` endpointi (P18 `qc_aql_table` egasi).
`/api/qc/aql-table` URL **ISHLATILMAYDI** — kross-paket to'qnashuv oldini olish (00-INTERVYU-MOSLIK §1-daraja #2).

> ⚠️ **AQL EDITION HIZALANISHI:**
> Statik fallback quyida P18 `p18-d2-qc-aql-table.sql` ning 7-qator ISO 2859-1 soddalashtirilgan
> dataset bilan mos keladi (P19 ning eski 11-qator MIL-STD-1916 dataset EMAS).
> DB dan kelgan ma'lumot (P18 migration run bo'lgandan keyin) doim ustunlik qiladi.

```typescript
/**
 * @module AQLTablePage
 * @description AQL 2.5 standart jadvali (lot hajmi → namuna → Ac/Re per severity).
 *   EP-QC-003/054/056. Endpoint: GET /api/qc/aql (P18 QcCatalogController).
 *   MUHIM: /api/qc/aql-table URL EMAS — P18 yagona egasi.
 *   Jadval tayyor bo'lguncha (P18 migration p18-d2 run bo'lguncha) statik jadval ko'rsatiladi.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DedicatedPageShell, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";

// AQL 2.5 standart jadvali — ISO 2859-1 soddalashtirilgan 7-qator (P18 p18-d2 default bilan mos)
// MUHIM: P18 migration run bo'lgandan keyin DB ma'lumoti shu statikni almashtiradi.
// ⚠️ EGASI QIYMATI KERAK: edition tasdig'i (ISO 2859-1 vs MIL-STD-1916) — hozircha ISO 2859-1 A-default.
const STATIC_AQL_TABLE = [
  { from: 1,     to: 50,     sample: 5,   acCritical: 0, reCritical: 1, acMajor: 1, reMajor: 2, acMinor: 3, reMinor: 4 },
  { from: 51,    to: 150,    sample: 13,  acCritical: 0, reCritical: 1, acMajor: 1, reMajor: 2, acMinor: 3, reMinor: 4 },
  { from: 151,   to: 500,    sample: 20,  acCritical: 0, reCritical: 1, acMajor: 2, reMajor: 3, acMinor: 5, reMinor: 6 },
  { from: 501,   to: 1200,   sample: 32,  acCritical: 0, reCritical: 1, acMajor: 2, reMajor: 3, acMinor: 7, reMinor: 8 },
  { from: 1201,  to: 3200,   sample: 50,  acCritical: 0, reCritical: 1, acMajor: 3, reMajor: 4, acMinor: 10, reMinor: 11 },
  { from: 3201,  to: 10000,  sample: 80,  acCritical: 0, reCritical: 1, acMajor: 3, reMajor: 4, acMinor: 14, reMinor: 15 },
  { from: 10001, to: 999999, sample: 125, acCritical: 0, reCritical: 1, acMajor: 5, reMajor: 6, acMinor: 21, reMinor: 22 },
];

interface AqlRow {
  lotSizeFrom: number; lotSizeTo: number; sampleSize: number;
  acCritical: number; reCritical: number;
  acMajor: number;    reMajor: number;
  acMinor: number;    reMinor: number;
}

export default function AQLTablePage() {
  const { t } = useTranslation('qc');

  // MUHIM: /api/qc/aql — P18 QcCatalogController (yagona URL; /api/qc/aql-table EMAS)
  const { data, isLoading } = useQuery<AqlRow[]>({
    queryKey: ["/api/qc/aql"],
    queryFn: () => apiRequest("GET", "/api/qc/aql"),
    retry: false,                 // P18 migration hali run bo'lmasa — statik fallback ko'rsatiladi
  });

  const dbRows: AqlRow[] = Array.isArray(data) ? data : [];
  const rows = dbRows.length > 0 ? dbRows : STATIC_AQL_TABLE.map(r => ({
    lotSizeFrom: r.from, lotSizeTo: r.to, sampleSize: r.sample,
    acCritical: r.acCritical, reCritical: r.reCritical,
    acMajor: r.acMajor,       reMajor: r.reMajor,
    acMinor: r.acMinor,       reMinor: r.reMinor,
  }));

  const isStaticFallback = dbRows.length === 0;

  return (
    <DedicatedPageShell
      title={t('aql.title', "AQL 2.5 Jadvali")}
      description={t('aql.description', "Lot hajmiga ko'ra namuna hajmi va qabul/rad chegaralari (ISO 2859-1)")}
    >
      {isStaticFallback && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          Statik AQL 2.5 jadvali ko'rsatilmoqda (P18 migration p18-d2 kutilmoqda — ISO 2859-1 A-default)
        </div>
      )}

      <Section title="AQL 2.5 — Nazorat jadvali">
        {isLoading ? (
          <Skeleton className="h-64 rounded" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot hajmi (dari)</TableHead>
                <TableHead>Namuna (n)</TableHead>
                <TableHead colSpan={2} className="text-center bg-red-50">Kritik</TableHead>
                <TableHead colSpan={2} className="text-center bg-orange-50">Jiddiy</TableHead>
                <TableHead colSpan={2} className="text-center bg-yellow-50">Kichik</TableHead>
              </TableRow>
              <TableRow>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead className="text-xs bg-red-50">Ac</TableHead>
                <TableHead className="text-xs bg-red-50">Re</TableHead>
                <TableHead className="text-xs bg-orange-50">Ac</TableHead>
                <TableHead className="text-xs bg-orange-50">Re</TableHead>
                <TableHead className="text-xs bg-yellow-50">Ac</TableHead>
                <TableHead className="text-xs bg-yellow-50">Re</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.lotSizeFrom} – {r.lotSizeTo}</TableCell>
                  <TableCell className="font-semibold">{r.sampleSize}</TableCell>
                  <TableCell className="bg-red-50">{r.acCritical}</TableCell>
                  <TableCell className="bg-red-50">{r.reCritical}</TableCell>
                  <TableCell className="bg-orange-50">{r.acMajor}</TableCell>
                  <TableCell className="bg-orange-50">{r.reMajor}</TableCell>
                  <TableCell className="bg-yellow-50">{r.acMinor}</TableCell>
                  <TableCell className="bg-yellow-50">{r.reMinor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title="Og'irlik darajalari ta'rifi">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-red-50 rounded border border-red-100">
            <Badge className="bg-red-600 text-white mb-2">Kritik</Badge>
            <p>0% o'tish — bitta kritik defekt = LOT RAD. Xavfsizlik/funksional talablar.</p>
          </div>
          <div className="p-3 bg-orange-50 rounded border border-orange-100">
            <Badge className="bg-orange-500 text-white mb-2">Jiddiy</Badge>
            <p>Ac/Re jadvalga ko'ra. Asosiy sifat talablar (bosma aniqlik, o'lcham).</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded border border-yellow-100">
            <Badge className="bg-yellow-500 text-white mb-2">Kichik</Badge>
            <p>Kosmetic kamchiliklar — yuqori chegara bilan. Mijoz ko'rinishiga ta'sir.</p>
          </div>
        </div>
      </Section>
    </DedicatedPageShell>
  );
}
```

---

## 5. DDL (GATED — EGASI RUXSATI KERAK)

> **DIQQAT:** Quyidagi SQL migratsiya fayllarini yoz lekin `psql` yoki `pnpm migrate` bilan ISHGA TUSHIRMA.
> Har faylning 1-qatorida `-- APPROVED: <egasi-ismi> <sana>` placeholder qoladi.
> Egasi `"ha, ruxsat"` deydi → faylni yangilab commit qil, KEYIN run et.

---

### d19-01-qc-brak-causation.sql
**Maqsad:** `qcBraks` jadvaliga EP-QC-090 causation_type qo'shish.

```sql
-- APPROVED: <egasi-ismi> <sana>
-- P19 d19-01: qc_braks.causation_type ustuni (EP-QC-090 — brak kelib chiqishi)
-- Qo'shimcha ustunlar: causation_type, operation_type, is_priladka, smena_id

ALTER TABLE qc_braks
  ADD COLUMN IF NOT EXISTS causation_type varchar(30)
    CHECK (causation_type IN ('incoming_defect', 'this_step_defect')),
  ADD COLUMN IF NOT EXISTS operation_type  varchar(50),
  ADD COLUMN IF NOT EXISTS is_priladka    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS smena_id       integer;

COMMENT ON COLUMN qc_braks.causation_type IS
  'EP-QC-090: incoming_defect=oldingi bosqich; this_step_defect=bu bosqich xatosi';
```

**Drizzle schema yangilash (lib/db/src/schema/qc-schema.ts — owned file emas, flag):**
> **FLAG P19-SCHEMA:** `lib/db/src/schema/qc-schema.ts` owned file emas. Migration run etilgandan keyin `qcBraks` ta'rifiga `causationType`, `operationType`, `isPriladka`, `smenaId` ustunlari qo'shilishi kerak. Bu ish P50 yoki schema-owner bilan kelishiladi.

---

### d19-02-qc-pre-production-checklists.sql
**Maqsad:** EP-QC-007/105 pre-production checklist jadvali.

```sql
-- APPROVED: <egasi-ismi> <sana>
-- P19 d19-02: qc_pre_production_checklists jadvali (EP-QC-007/105)

CREATE TABLE IF NOT EXISTS qc_pre_production_checklists (
  id                serial PRIMARY KEY,
  order_id          integer,
  session_id        integer,
  material_checked  boolean NOT NULL DEFAULT false,
  qolip_checked     boolean NOT NULL DEFAULT false,
  fayl_checked      boolean NOT NULL DEFAULT false,
  namuna_checked    boolean NOT NULL DEFAULT false,
  gramaj_checked    boolean NOT NULL DEFAULT false,
  status            varchar(10) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PASSED', 'FAILED')),
  checked_by        integer REFERENCES users(id) ON DELETE SET NULL,
  checked_at        timestamp,
  created_at        timestamp NOT NULL DEFAULT NOW(),
  updated_at        timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qc_ppc_order_id   ON qc_pre_production_checklists (order_id);
CREATE INDEX IF NOT EXISTS idx_qc_ppc_session_id ON qc_pre_production_checklists (session_id);

COMMENT ON TABLE qc_pre_production_checklists IS
  'EP-QC-007/105: Pre-production tekshiruv roʻyxati — MES sessiyasi boshlanishidan oldin toʻldirilishi shart';
```

---

### ~~d19-03-qc-aql-table.sql~~ — P19 DAN OLIB TASHLANDI

> ⚠️ **BU MIGRATION P19 DA MAVJUD EMAS (00-INTERVYU-MOSLIK §1-daraja #2 fix):**
> `qc_aql_table` jadvalini **FAQAT P18** yaratadi va boshqaradi (`p18-d2-qc-aql-table.sql`).
> P19 bu jadval uchun CREATE TABLE bajarmaydi.
>
> - P18 migration: `apps/api/src/shared/db/migrations/p18-d2-qc-aql-table.sql` (7-qator ISO 2859-1)
> - P19 fayliga `d19-03-qc-aql-table.sql` faylini YARATMA — agar yaratilgan bo'lsa O'CHIR.
>
> Sabab: P18 (7-qator, ISO 2859-1) va P19 (11-qator, MIL-STD-1916) har xil Ac/Re qiymatlar bilan
> bir xil jadvalga INSERT qilsa → UNIQUE constraint `qc_aql_lot_range_unique` buziladi (runtime crash).
> Egasi AQL edition ni tasdiqlagunga qadar P18 ning 7-qator A-default qoldiriladi.

---

### d19-04-qc-root-causes-ensure.sql
**Maqsad:** `qc_root_causes` jadval mavjudligini ta'minlash (lib/db da ta'riflangan lekin migration yo'q edi).

```sql
-- APPROVED: <egasi-ismi> <sana>
-- P19 d19-04: qc_root_causes jadval yaratish (lib/db/qc-schema.ts ta'rifiga mos)
-- Idempotent: IF NOT EXISTS

CREATE TABLE IF NOT EXISTS qc_root_causes (
  id                    serial PRIMARY KEY,
  entity_type           varchar(30) NOT NULL
    CHECK (entity_type IN ('final_inspection','brak','reclamation','material_test')),
  entity_id             varchar NOT NULL,
  papka_order_id        varchar REFERENCES papka_orders(id) ON DELETE SET NULL,
  why1                  text,
  why2                  text,
  why3                  text,
  why4                  text,
  why5                  text,
  root_cause            text,
  category              varchar(50)
    CHECK (category IS NULL OR category IN ('equipment','operator','material','process','environment')),
  corrective_action     text,
  preventive_action     text,
  responsible_user_id   integer REFERENCES users(id) ON DELETE SET NULL,
  due_date              varchar(10),
  status                varchar(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','closed')),
  closed_at             timestamp,
  closed_by             varchar REFERENCES users(id) ON DELETE SET NULL,
  created_by            integer REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamp NOT NULL DEFAULT NOW(),
  updated_at            timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qcrc_entity ON qc_root_causes (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_qcrc_status  ON qc_root_causes (status);

COMMENT ON TABLE qc_root_causes IS
  'EP-QC-013/048: 5-Why root cause analysis — kritik/jiddiy brak va reklamatsiyalar uchun';
```

---

### AQL endpoint — P19 DA YO'Q (P18 endpointini ishlatadi)

> ⚠️ **KROSS-PAKET EGALIK (00-INTERVYU-MOSLIK §1-daraja #2 fix):**
> `qc_aql_table` jadvali va `/api/qc/aql` endpoint **FAQAT P18 egasi**.
> P19 bu jadval uchun alohida repo/service/controller yozmaydi.
> P19 ning `AQLTablePage.tsx` → `/api/qc/aql` URL ishlatadi (pastda qadam 16 da ko'rsatilgan).
>
> **Agar P18 `QcCatalogController` hali deploy qilinmagan bo'lsa:**
> P19 bajarilgunga qadar `AQLTablePage` statik fallback ko'rsatadi (graceful degradation — qadam 16 da).
> `d19-03-qc-aql-table.sql` — **MAVJUD EMAS** (P19 dan o'chirildi, P18 jadvalini qayta yaratmaydi).

---

## 6. QABUL MEZONI

Barcha quyidagi bandlar bajarilgandan keyin P19 TUGADI deb hisoblanadi:

### Backend
- [ ] **BE-tsc-0:** `pnpm --filter @europrint/api exec tsc --noEmit` = 0 xato
- [ ] **BE-B1 fix:** `GET /api/qc-defects` → 200, `data.data` = `qc_defects` dan
- [ ] **BE-B2 fix:** `GetReclamationsHandler.execute()` → `qc_reclamations` dan SELECT
- [ ] **BE-B3 fix:** `POST /api/qc/reclamations` → `qc_reclamations` INSERT, `reclamation_number = 'RCL-YYYY-NNNNN'`
- [ ] **BE-B5 fix:** `GET /api/qc/dashboard/stats` → 200 (open_defects, brak_7days)
- [ ] **BE-B5 fix:** `GET /api/qc/dashboard/flow` → 200 (stages array)
- [ ] **BE-B6 fix:** `GET /api/qc/supplier-quality` → 200 (alias ishlamoqda)
- [ ] **BE-B7 fix:** `qc-new.controller.ts` da `db.execute` yo'q — service ga delegat
- [ ] **operation-closed.listener.ts** fayl yaratildi + qc.module.ts ga qo'shish flagi yozildi
- [ ] **qc-checklist.repository.ts** + `qc-checklist.service.ts` + `qc-checklist.controller.ts` yaratildi
- [ ] **qc-root-cause.repository.ts** yaratildi — safeCall pattern
- [ ] DDL fayllar d19-01..d19-04 YOZILDI (GATED belgisi bilan)

### Frontend
- [ ] **FE-tsc-0:** `pnpm --filter erp-dashboard exec tsc --noEmit` = 0 xato
- [ ] **QCDashboard.tsx** — `dashboard/stats` va `dashboard/flow` URL lar ishlaydi (BE fix keyin)
- [ ] **ReclamationsPage.tsx** — "Yangi reklamatsiya" tugma + dialog + POST mutation
- [ ] **QCBraksTab.tsx** — `causation_type` field forma va jadvalda ko'rinadi
- [ ] **DefectCatalogPage.tsx** — yaratildi, GET `/api/qc-defects` ishlaydi
- [ ] **PreProductionChecklistPage.tsx** — yaratildi, error state gracefully ko'rsatiladi
- [ ] **AQLTablePage.tsx** — yaratildi, statik jadval ko'rinadi

### Golden-thread va regress
- [ ] Mavjud ishlayotgan QC endpointlar: `GET /api/qc/dashboard` (eski), `GET /api/qc/checkpoints`, `GET /api/qc/certificates`, `GET /api/qc/lab-tests`, `GET /api/qc/root-causes`, `GET /api/qc/standards` — hammasi hali ishlaydi (regress yo'q)
- [ ] `MesCompletedListener` hali ishlaydi (o'zgartirilmagan)
- [ ] `GET /api/qc/inspections` hali ishlaydi

### Kross-paket egalik tekshiruvi (00-INTERVYU-MOSLIK §1-daraja #2)
- [ ] `d19-03-qc-aql-table.sql` fayli **MAVJUD EMAS** (yaratilgan bo'lsa o'chir)
- [ ] `AQLTablePage.tsx` — `queryKey` va `queryFn` da `/api/qc/aql` URL (eski `/api/qc/aql-table` EMAS)
- [ ] `qc-new.controller.ts` ga `@Get('aql-table')` endpoint **QO'SHILMAYDI** (P18 egasi)

### Tushib qolgan vizyon elementlari — DEFER YOZUVLARI (OCHIQ-JAVOBLAR §QC)

> Quyidagi elementlar egasi AYNAN talab qilgan (EP-QC-014/018/020/024/025/075/084), lekin P19 Wave-2 doirasida emas.
> **Keyingi paketga o'tkazildi. Bu elementlar jim yo'qolmaydi — flaglangan.**

| Vizyon elementi | Egasi qaror kodi | Defer sababi | Keyingi qadam |
|---|---|---|---|
| **Sertifikat-PDF** (avto PDF SF-2026-NNNNN, uz/ru/en, laborant+sifat-boshlig'i imzo+QR) | EP-QC-014/060-064 | PDF generator + template infra; FE download trigger kerak | P18-Wave-2 yoki PDF paket; **EGASI QIYMATI KERAK**: shablon formati |
| **DPMO/Sigma** (brak% → DPMO, sigma darajasi) | EP-QC-018 | qcBraks + qcInspections to'liq to'ldirilgandan keyin ma'noli | P18-Wave-2; **EGASI QIYMATI KERAK**: sigma maqsad |
| **Pareto tahlili** (nuqson sabab-tur bo'yicha 80/20) | EP-QC-020 | Chart/reporting layer; P19 Wave-2 ma'lumot bazasi kerak | P18-Wave-2 |
| **COQ — sifat xarajati** | EP-QC-025 | GL/FIN integratsiya kerak | FIN modul bilan birgalikda; **EGASI QIYMATI KERAK**: GL kod |
| **СОЗ-Telegram** (anomaliya → СОЗ + texnolog + uchastka rahbari Telegram) | EP-QC-024 | NTF modul (P47) tayyor bo'lgandan keyin; routing matritsa | P47 NTF modul bilan; **EGASI QIYMATI KERAK**: Telegram guruh ID |
| **Brak ≤ 2% maqsad** (sozlanadigan threshold, A-default 2%) | EP-QC-084 | Master-data config jadval kerak (qotirilmaydi); **EGASI QIYMATI KERAK** | `qc_config` jadval yoki `qc_sort_levels` kengaytmasi |
| **Retest** (chegara zonasida 2-namuna qayta tekshiruv) | EP-QC-075 | AQL servis kengaytmasi; Ac va Re orasidagi zona mantig'i | P18-Wave-2 AQL servis |

---

## 7. SELF-VERIFY

### 7.1 BE typecheck
```bash
# Backend TypeScript tekshiruv
pnpm --filter @europrint/api exec tsc --noEmit
# Natija: 0 xato bo'lishi kerak
```

### 7.2 Reviewer skriptlar
```bash
# Result pattern
bash scripts/reviewer-result-pattern.sh
# Array safety
bash scripts/reviewer-array-safety.sh
# as unknown stubs
bash scripts/reviewer-as-unknown.sh
```

### 7.3 FE typecheck
```bash
pnpm --filter erp-dashboard exec tsc --noEmit
# Natija: 0 xato
```

### 7.4 Jonli DB-proof (migration d19-04 run etilgandan keyin)
```sql
-- qc_root_causes jadval bor:
SELECT count(*) FROM qc_root_causes;

-- GetDefectsHandler to'g'ri jadval:
SELECT count(*) FROM qc_defects;

-- GetReclamationsHandler to'g'ri jadval:
SELECT count(*) FROM qc_reclamations;

-- Reklamatsiya yaratish test:
INSERT INTO qc_reclamations (reclamation_number, client_name, claim_date, issue_type, description, status, created_at, updated_at)
VALUES ('RCL-2026-00001', 'Test Mijoz', '2026-06-19', 'other', 'Test reklamatsiya', 'new', NOW(), NOW())
RETURNING id, reclamation_number;
-- Natija: id = serial int, reclamation_number = 'RCL-2026-00001'
```

### 7.5 Endpoint smoke test (backend ishga tushganida)
```bash
# Auth token olish (egasi tokeni)
TOKEN="<JWT>"

# BE-B1 fix
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/qc-defects
# Natija: {ok:true, data:{data:[...], pagination:{...}}} — quality_defects_camera yo'q

# BE-B2 fix (CQRS so'rovchi)
# GET /api/qc-defects/reclamations yoki CQRS handler test

# BE-B5 fix
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/qc/dashboard/stats
# Natija: {open_defects:N, brak_7days:N, ...}

curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/qc/dashboard/flow
# Natija: {stages:[{stage:'incoming', total:N, ...}, ...]}

# BE-B6 fix
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/qc/supplier-quality
# Natija: 200 (list yoki {})

# BE-B3 fix
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"customerName":"Test","description":"Test rekl","severity":"major"}' \
  http://localhost:3030/api/qc/reclamations
# Natija: {id:N, reclamationNumber:"RCL-2026-NNNNN"}

# Checklist (d19-02 keyin):
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/qc/checklists?orderId=1
```

### 7.6 Round-trip tekshirish (Q-43)
```
1. FE: ReclamationsPage → "Yangi reklamatsiya" → clientName="Test" → "Saqlash"
2. DB: SELECT * FROM qc_reclamations WHERE client_name='Test' ORDER BY id DESC LIMIT 1;
   → Ko'rinishi kerak, reclamation_number='RCL-YYYY-NNNNN'
3. FE: Sahifani yangilash → yangi yozuv ro'yxatda ko'rinishi kerak
```

---

## 8. COMMIT

**Tartib:** Har qadam tugagandan keyin alohida commit. `git add -A` TAQIQ.

### Commit 1 — BE handlers fix (Qadam 1-3)
```bash
git add apps/api/src/modules/qc/application/queries/get-defects.handler.ts
git add apps/api/src/modules/qc/application/queries/get-reclamations.handler.ts
git add apps/api/src/modules/qc/application/commands/create-reclamation.handler.ts
git commit -m "fix(qc): GetDefectsHandler/GetReclamationsHandler wrong table → qc_defects/qc_reclamations; CreateReclamationHandler use DrizzleQcReclamationRepo + serial PK + RCL-YYYY-NNNNN number"
```

### Commit 2 — BE repository va service (Qadam 5-10)
```bash
git add apps/api/src/modules/qc/presentation/qc-new.controller.ts
git add apps/api/src/modules/qc/infrastructure/repositories/qc-new.repository.ts
git add apps/api/src/modules/qc/infrastructure/event-handlers/operation-closed.listener.ts
git add apps/api/src/modules/qc/infrastructure/repositories/qc-checklist.repository.ts
git add apps/api/src/modules/qc/application/qc-checklist.service.ts
git add apps/api/src/modules/qc/presentation/qc-checklist.controller.ts
git add apps/api/src/modules/qc/infrastructure/repositories/qc-root-cause.repository.ts
git add apps/api/src/modules/qc/application/qc-extended.service.ts
git add apps/api/src/modules/qc/presentation/qc-extended.controller.ts
git commit -m "feat(qc): dashboard/stats + dashboard/flow + supplier-quality alias endpoints; move getControlCharts to service; operation-closed listener; checklist + root-cause repos/service/controller"
```

### Commit 3 — DDL migration fayllar (GATED)
```bash
# DIQQAT: d19-03-qc-aql-table.sql bu commitga KIRMAYDI — P18 egasi (p18-d2-qc-aql-table.sql)
git add apps/api/src/database/migrations/d19-01-qc-brak-causation.sql
git add apps/api/src/database/migrations/d19-02-qc-pre-production-checklists.sql
git add apps/api/src/database/migrations/d19-04-qc-root-causes-ensure.sql
git commit -m "feat(qc/ddl): GATED migrations d19-01/02/04 — brak causation_type, pre-production checklists, qc_root_causes ensure [APPROVED: <egasi> needed before run]

NOTE: d19-03-qc-aql-table.sql removed — qc_aql_table is owned by P18 (p18-d2-qc-aql-table.sql)"
```

### Commit 4 — FE sahifalar (Qadam 11-16)
```bash
git add artifacts/erp-dashboard/src/pages/QCDashboard.tsx
git add artifacts/erp-dashboard/src/pages/qc/ReclamationsPage.tsx
git add artifacts/erp-dashboard/src/pages/qc/QCBraksTab.tsx
git add artifacts/erp-dashboard/src/pages/qc/DefectCatalogPage.tsx
git add artifacts/erp-dashboard/src/pages/qc/PreProductionChecklistPage.tsx
git add artifacts/erp-dashboard/src/pages/qc/AQLTablePage.tsx
git commit -m "feat(qc/fe): ReclamationsPage CREATE mutation; QCBraksTab causation_type; new DefectCatalogPage + PreProductionChecklistPage + AQLTablePage; QCDashboard URL comments"
```

---

## Flaglar (egasiga yetkazilsin)

> **FLAG P19-MOD-1:** `qc.module.ts` — `providers:[]` ga qo'shilishi kerak:
> - `OperationClosedListener` (Qadam 4)
> - `QcChecklistService`, `QcChecklistRepository`, `QcChecklistController` (Qadam 8-10)
> - `QcRootCauseRepository` (Qadam 7)
> `qc.module.ts` owned file emas → P50 (route-reg) da yoki egasi qo'shadi.

> **FLAG P19-SCHEMA-1:** `lib/db/src/schema/qc-schema.ts` — `qcBraks` ga causation_type/operationType/isPriladka/smenaId ustunlari qo'shilishi kerak (d19-01 migration run etilgandan keyin). Schema owned file emas → P01/P02 barrel agent.

> **FLAG P19-ROUTE-1:** Yangi FE sahifalar — `DefectCatalogPage`, `PreProductionChecklistPage`, `AQLTablePage` — `ProductionRoutes.tsx` ga route qo'shilishi kerak. Route fayli owned file emas → P50 da qilinadi.

> **FLAG P19-DDL-RUN:** d19-01/02/04 migration fayllar yozildi, LEKIN ishga tushirilmadi. Egasi `"ha, ruxsat"` dedikatan keyin:
> ```bash
> psql $DATABASE_URL -f apps/api/src/database/migrations/d19-04-qc-root-causes-ensure.sql
> psql $DATABASE_URL -f apps/api/src/database/migrations/d19-01-qc-brak-causation.sql
> psql $DATABASE_URL -f apps/api/src/database/migrations/d19-02-qc-pre-production-checklists.sql
> # d19-03 YO'Q — qc_aql_table P18 egasi (p18-d2-qc-aql-table.sql ni ishga tushir)
> ```
> Tartib: d19-04 birinchi (xavfsiz, boshqalarga bog'liq emas). AQL jadval uchun avval P18 migrations run et.
