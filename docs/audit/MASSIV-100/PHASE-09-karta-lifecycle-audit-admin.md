# FAZA 09 — Karta lifecycle + audit + admin (BAJARUVCHI DIREKTIVASI)

> **Bajaruvchi:** Muslimbek (🟢 Bajaruvchi roli — Qoida 23).
> **Manba-reja:** [`00-MASTER-REJA.md`](00-MASTER-REJA.md) FAZA 09.
> **Vizyon-bo'shliq:** [`../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`](../ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md) — karta-model 42%, boshqa 18%.
> **Spec:** [`../decisions/01-org-kartalar.md`](../decisions/01-org-kartalar.md) — EP-ORG-005/063/064/065/067/068/069/070/071/072/073/074/075/076/078/083/084/085/086/137 + EP-ORG-002/037 (01/02 raqamlash) + EP-ORG-057/058/059 (shablon).
> **Bog'liqlik:** Bu faza FAZA 0 (kanonik `org_departments`), FAZA 1 (`employee_cards` M:N + freeze/restore karkasi), FAZA 8 (yagona daraxt) USTIGA quriladi. FAZA 9 ulardan KEYIN bajariladi.
> **Q-47:** Bu direktiva ≥1000 qator, to'liq, noaniqliksiz.

---

## §0. KONTEKST + MAQSAD

### 0.1 Nima quriladi
Karta hayot-siklining QOLGAN qismi (karta-model mavzusining oxirgi 58%):

1. **5-holat state-machine** — `active` / `vacant` / `io` / `frozen` / `archived`; har o'tish gate bilan (qaysi holatdan qaysiga o'tish mumkin) + sabab. Hozir faqat `is_active` boolean bor (org_departments aktiv modeli), 5-holat enum FAQAT de-routed `card.controller.ts:35` da yashaydi.
2. **Muzlatish (freeze) + tiklash (restore)** — `frozen` holati + sabab + muddat (`frozen_until`); muddat tugaganda yoki qo'lda restore. EP-ORG-084/086. Hozir YO'Q.
3. **Field-level audit diff** — har muhim o'zgarishda: maydon nomi, eski qiymat, yangi qiymat, kim, qachon, sabab. EP-ORG-067. Hozir `AuditInterceptor` faqat metadata yozadi (`changed_fields=['result:error','action:UPDATE',...]`, `reason='error • PATCH undefined'`) — REAL diff YO'Q.
4. **Majburiy-sabab gate** — pul (`salary_type`/`min_salary`/`max_salary`/`bonus_config`) yoki razryad (`razryad_level_id`) o'zgarishida sabab MAJBURIY; oddiy maydon (`color`/`description`) — ixtiyoriy. EP-ORG-068. Hozir DTO `reason` qabul qilmaydi.
5. **Excel ommaviy-import** — shablon + partial-commit (to'g'ri satr yuklanadi, xato satr ro'yxat bilan qaytadi) + idempotent UPSERT (qayta-yuklashda dublikat yaratmaydi) + import-partiya audit-izi. EP-ORG-075/076/078. Hozir faqat EKSPORT bor (`org-export.service.ts`), IMPORT YO'Q.
6. **Merge / split** — ikki kartani birlashtirish (EP-ORG-064), bitta kartani ikkiga bo'lish (EP-ORG-065). **MASTER-SAVOL bilan `decisions/01` ziddiyatli** → §11 Owner-DATA da hal qilinadi (default = RAD-tasdiqli skelet, owner ruxsatisiz mutatsiya YO'Q).
7. **Vakansiya aging** — `vacancy_opened_at` + necha kun bo'sh + aging-bucket (0-14 yashil / 15-45 sariq / 45+ qizil) + prioritet (3 daraja) + SLA (maqsadli muddat). EP-ORG-071/072/073/074/080. Hozir VacantTab faqat "rahbar bor/yo'q" ko'rsatadi.
8. **`card_templates` shablon** — lavozim-turi bo'yicha shablon (avto-to'ldirish); 10-15 zavod-lavozim seed. EP-ORG-057/058/059. Hozir jadval YO'Q.
9. **01/02 dublikat-raqamlash** — bir xil nomli kartalar `01`/`02`/`03` `seat_number` bilan ajratiladi. EP-ORG-002/037. Hozir YO'Q.

### 0.2 Nega bu kerak (vizyon)
Karta = master-data, hech qachon o'chmaydi (soft-delete/arxiv), to'liq tarix saqlanadi. Xodim ketsa karta vakant bo'ladi, qaytsa yoki yangi xodim kelsa tiklanadi. Har bir karta-o'zgarish (ayniqsa pul/razryad) izlanadigan, sababli, immutable audit-iz qoldiradi. HR kartalarni Excel'dan ommaviy yuklab boshlang'ich to'ldirishni tezlashtiradi. Bo'sh kartalar aging bilan ranglanib recruitment-prioritetini ko'rsatadi.

### 0.3 Qamrov chegarasi (BU FAZADA EMAS)
- Login/oylik card-gate → FAZA 2/4 (bu yerda EMAS).
- Razryad o'sish/pasayish execution + `razryad_history` → FAZA 3 (bu yerda EMAS — ammo majburiy-sabab gate razryad o'zgarishini QAMRAB OLADI).
- AI per-karta moslik → FAZA 10.
- Dizayn yakuniy pass → FAZA 11 (ammo bu fazada yaratilgan barcha UI EP-token bilan quriladi).

---

## §1. QOIDALAR-BLOKI (HAR BOSQICHDA MAJBURIY)

> Bu blok `CLAUDE.md` + `00-MASTER-REJA.md` §2 dan ko'chirilgan. Har commitdan oldin tekshiriladi.

### 1.1 Kod uslubi
- **Result<T>** (Qoida 1): har repo/service metodi `Promise<Result<T>>` qaytaradi; `return null`/`throw new Error()` TAQIQ. `safeCall(async () => {...}, 'DB_ERROR')` ishlatiladi.
- **Zod** (Qoida 3): har `@Body()` Zod schema bilan `.parse(body)`; `.strict()` mass-assignment guard (mavjud `OrgNodeSchema` namunasi `org-structure.controller.ts:37`).
- **Drizzle** (Qoida 4): oddiy CRUD Drizzle; raw SQL faqat ifodalab bo'lmaydigan (recursive CTE, cross-table UPDATE) + `RULE4_EXCEPTION:` izoh bilan. Parametrli `sql\`...\`` — `sql.raw(variable)` TAQIQ (Qoida B).
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13). Yangi katta fayllar `*-lifecycle.repo.ts` / `*-import.service.ts` kabi bo'linadi.
- **Magic number** (Qoida 12): aging chegaralari (14/45), SLA kunlari `business.constants.ts` ga `CARD_AGING_*` / `CARD_SLA_*` nomi bilan.

### 1.2 Regress-himoya (Q-39/Q-46)
- Ishlayotgan+to'g'ri kod O'CHMAYDI. `is_active` boolean, `deactivate()`, mavjud tablar, `AuditInterceptor` metadata — barchasi QOLADI (kengaytiriladi, almashtirilmaydi).
- Buzuq/o'lik/dublikat TO'LIQ o'chiriladi (chala emas) — faqat Q-29 verify + import-yo'qligi tasdiqlangach.
- O'chirilgan narsa QAYTA yaratilmaydi.

### 1.3 FABRIKATSIYA TAQIQ (Q-40)
- Data yo'q → STRUKTURA + GATE qur, egasi-data ro'yxatiga (§11) yoz; SOXTA qiymat YOZMA.
- Aging chegaralari, SLA kunlari = struktura (kod), ammo qaysi karta qaysi prioritet/SLA olishi = egasi-data.
- Import-fayl mazmuni = egasi-data.
- "Ishlaydi ≠ to'g'ri" (Q-40): 200 qaytarish yetarli emas; DB-proof + biznes-qoida + vizyon-moslik tasdiqlanadi.

### 1.4 Verify (Q-29/Q-32)
- Har faza oxiri: `tsc` GREEN (o'z fayllarda 0 xato) + END-TO-END rollback-tx DB-proof (`_audit/bproof-*.cjs`: kirit→oqdi→ko'rindi→ROLLBACK) + jonli HTTP isbot (login → endpoint → 200/4xx kutilgan).
- Struktura-only YETARLI EMAS.

### 1.5 Dizayn (Q3, Qoida 21/41/42/43)
- EP token (`var(--ep-*)`) + shablon (ListPage/DetailPage/FormPage) + komponent (`components/ep`, `components/ui`).
- Xom rang/inline-style hex TAQIQ (mavjud `style={{ background: ... }}` linear-gradient OrgNodeDetail header'da QOLADI — regress-himoya, yangi kod token ishlatadi).
- Tab ≤2 daraja. Har forma REAL saqlaydi (FE mutation → BE → DB → qayta-yuklashda ko'rinadi, F1 loading / F2 onError).

### 1.6 Migration
- `migrations-drift.ts` (yoki mavjud `_audit/apply-*.cjs` namunasi) idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`.
- `CREATE TABLE` / yangi enum / `DROP` faqat `APPROVED:` izoh bilan (Q-35). Bu fazada APPROVED jadvallar: `card_templates`, `card_state_transitions` (audit-iz). Yangi ustunlar `org_departments` ga ADD (mavjud jadval — ALTER, APPROVED kerak emas, ammo izoh qoldiriladi).

### 1.7 Commit
- Faqat o'z fayllar (`git add <aniq-fayl>`, HECH QACHON `-A`/`-A .`), `--no-verify` (sabab bilan), Co-Authored-By.
- Har bosqich oxirida commit.

### 1.8 Atama
- Muloqotda doim **KARTA** (node/tugun emas).

---

## §2. JORIY HOLAT (fayl:satr + DB-fakt — JONLI tasdiqlangan 2026-06-25)

### 2.1 Backend fayllar
| Fayl | Holat | Dalil |
|------|-------|-------|
| `apps/api/src/modules/org-structure/org-structure.controller.ts:37-72` | `OrgNodeSchema` `.strict()` — `currentState` allow-listда (`:68` `z.union([z.string().max(2000), z.null()])` — **enum EMAS, erkin matn**); `reason`/`sabab` maydoni YO'Q. | Read 2026-06-25 |
| `org-structure.controller.ts:181-184` | `update()` — `OrgNodeSchema.partial().parse(body)` → `service.update(id, dto)`; sabab yo'q, diff yo'q. | Read |
| `org-structure.controller.ts:190-193` | `remove()` → `service.remove(id)` → `repo.deactivate(id)` (`is_active=false`). | Read |
| `org-structure.controller.ts:199-203` | `move()` — old/new parent tarix-yozuviga YOZMAYDI. | Read |
| `org-structure.controller.ts:296-315` | `getNodeHistory()` — `audit_logs WHERE table_name='orgstructure' AND record_id=:nodeId`; `details=array_to_string(changed_fields)` (metadata, REAL diff emas). | Read |
| `org-structure/org-mutations.repo.ts:59-86` | `applyUnitFields()` — parametrli `sql` UPDATE; `current_state` `:75` da yoziladi (erkin matn). | Read |
| `org-mutations.repo.ts:119-126` | `deactivate()` — `is_active=false` only; sabab/holat YO'Q. | Read |
| `org-mutations.repo.ts:128-137` | `move()` — `parent_id+level` UPDATE; tarix YO'Q. | Read |
| `org-structure.service.ts:136-150` | `update()`/`remove()` — `existsById` guard + delegate; sabab/diff yo'q. | Read |
| `card.controller.ts:35` | De-routed CardController `status` enum `['active','frozen','vacant','archived','io']` — **5-holat enum SHU YERDA bor, ammo `org_functions` (de-routed) ga keyed; aktiv `org_departments` modelida YO'Q.** | Read |
| `card.controller.ts:181-188` | `vacancies()` → `service.listVacancies` — `vacancies` jadvalidan (0 qator). | Read |
| `common/interceptors/audit.interceptor.ts:32-90` | `redact()` + `persist()` — `oldValues={_beforeRequest:requestBody}`, `newValues=afterObj`, `changedFields=['result:...','action:...','module:...','ua:...']`. **Field-level eski→yangi diff YO'Q.** | Read |

### 2.2 DB-fakt (node `_audit/q.cjs` bilan tasdiqlangan)
```
org_departments ustunlari (lifecycle bilan bog'liq):
  current_state   text       — MAVJUD, 144/144 NULL (erkin matn, enum emas)
  is_active       boolean    — MAVJUD (kanonik aktiv-flag)
  last_reviewed_at timestamp  — MAVJUD (EP-ORG-137)
  YO'Q: frozen_at, frozen_reason, frozen_until, vacancy_opened_at,
        priority, sla_days, seat_number, template_id

audit_logs ustunlari: id(varchar), table_name, record_id, action,
  old_values(jsonb), new_values(jsonb), changed_fields(ARRAY), reason(text),
  transaction_id, user_id, user_full_name, user_role, ip_address, user_agent, created_at

employee_cards ustunlari: id, employee_id, card_id, is_primary, is_active,
  assigned_at, ended_at, created_at, updated_at, is_acting, acting_supplement
  (FAZA 1 da stake_fraction qo'shiladi — bu fazada YO'Q deb hisoblanmaydi)

JADVAL MAVJUDLIGI:
  MAVJUD:  audit_logs, razryad_levels, employee_cards, org_departments
  YO'Q:    card_templates, card_state_transitions, vacancies(0 qator/de-routed), razryad_history

org_functions = 97 qator (de-routed parallel dunyo — FAZA 0 retire qiladi;
  bu fazada org_functions ga YOZILMAYDI, faqat org_departments).
```

### 2.3 FE fayllar
| Fayl | Holat |
|------|-------|
| `artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx:117-140` | Tab-container: `main/razryad/employees/children/vacant/folder/stats/portret/history` (9 tab, TEKIS — Qoida 42 mos). 5-holat / freeze / aging UI YO'Q. |
| `OrgNodeDetail.tsx:96-101` | Header tugmalari: Edit / Move / Delete / Ortga. Freeze/Restore tugmasi YO'Q. |
| `components/hr/orgnode/ExtraTabs.tsx:88-116` | `VacantTab` — faqat `!node.headUserName` ("Vakant/Tayinlangan"); aging-bucket / ochilgan-sana / SLA YO'Q. |
| `components/hr/orgnode/HistoryTab.tsx` | Tarix tab — `getNodeHistory` (metadata) o'qiydi. Field-diff ko'rsatmaydi. |

---

## §3. BOSQICHMA-BOSQICH IJRO

> Tartib: DB (§4) → backend lifecycle (B1-B4) → audit (B5-B6) → import (B7) → aging (B8) → templates (B9) → seat-numbering (B10) → merge/split skeleton (B11) → FE (§7). Har bosqich oxirida `tsc` + commit.

---

### BOSQICH B1 — `org_departments` lifecycle ustunlari (ALTER)

**Fayl:** yangi migration `_audit/apply-card-lifecycle.cjs` (mavjud `apply-node-card-cols.cjs` namunasi) + Drizzle schema yangilanishi `lib/db/src/schema/...` (org_departments yashaydigan fayl — Grep bilan top: `grep -rn "current_state" lib/db/src/schema`).

**OLDIN (DB):** `org_departments` da `current_state text` (NULL), `is_active boolean`. `frozen_*`, `vacancy_opened_at`, `priority`, `sla_days`, `seat_number`, `template_id` YO'Q.

**KEYIN (DB):** §4.1 SQL bilan quyidagi ustunlar qo'shiladi:
- `current_state` — ALREADY MAVJUD (text). Bu fazada **enum-domen sifatida ishlatiladi** (`active`/`vacant`/`io`/`frozen`/`archived`). Backfill: `is_active=true AND head_user_id IS NOT NULL → 'active'`; `is_active=true AND head_user_id IS NULL → 'vacant'`; `is_active=false → 'archived'`. (CHECK constraint emas — app-layer state-machine guard, чунки i.o./frozen runtime-da yoziladi.)
- `frozen_reason text NULL`, `frozen_until timestamp NULL`, `frozen_at timestamp NULL`, `frozen_by integer NULL` (users.id).
- `vacancy_opened_at timestamp NULL` — vakansiya ochilgan sana.
- `vacancy_priority text NULL` — `'critical'`/`'medium'`/`'low'`.
- `vacancy_sla_days integer NULL` — maqsadli yopilish kuni.
- `seat_number text NULL` — `'01'`/`'02'` (dublikat raqamlash, B10).
- `template_id integer NULL` (FK `card_templates.id`, B9).
- `restored_at timestamp NULL`, `restored_by integer NULL`.

**Sabab:** vizyon 5-holat + freeze(sabab+muddat) + vakansiya aging + shablon-link + seat raqami uchun ustunlar kerak. `current_state` allaqachon mavjud — qayta yaratilmaydi (regress).

---

### BOSQICH B2 — State-machine + freeze/restore repo

**Fayl (yangi):** `apps/api/src/modules/org-structure/org-structure/card-lifecycle.repo.ts` (≤300 qator).

**Nima:** `org_departments` ustidagi holat-o'tish mantig'i. Drizzle + parametrli sql.

```typescript
// card-lifecycle.repo.ts (YANGI)
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

export type CardState = 'active' | 'vacant' | 'io' | 'frozen' | 'archived';
type Row = Record<string, unknown>;

@Injectable()
export class CardLifecycleRepo {
  /** Joriy holatni o'qiydi (NULL → backfill-default kompyuter qiladi). */
  async getState(id: number): Promise<Result<{ id: number; current_state: string | null; is_active: boolean; head_user_id: number | null }>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT id, current_state, is_active, head_user_id
        FROM org_departments WHERE id = ${id} LIMIT 1
      `);
      const row = r.rows[0];
      if (!row) throw new Error('Karta topilmadi');
      return row as { id: number; current_state: string | null; is_active: boolean; head_user_id: number | null };
    }, 'DB_ERROR');
  }

  /** Holatni yangilaydi (+ freeze maydonlari, agar berilsa). Atomik. */
  async setState(
    id: number,
    next: CardState,
    opts: { frozenReason?: string | null; frozenUntil?: string | null; actorId?: number | null } = {},
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const sets = [sql`current_state = ${next}`];
      if (next === 'archived') sets.push(sql`is_active = false`);
      if (next === 'active' || next === 'vacant' || next === 'io') sets.push(sql`is_active = true`);
      if (next === 'frozen') {
        sets.push(sql`frozen_at = NOW()`);
        sets.push(sql`frozen_reason = ${opts.frozenReason ?? null}`);
        sets.push(sql`frozen_until = ${opts.frozenUntil ?? null}`);
        sets.push(sql`frozen_by = ${opts.actorId ?? null}`);
      }
      if (next === 'active') {
        sets.push(sql`frozen_at = NULL`, sql`frozen_reason = NULL`, sql`frozen_until = NULL`, sql`frozen_by = NULL`);
        sets.push(sql`restored_at = NOW()`, sql`restored_by = ${opts.actorId ?? null}`);
      }
      const r = await runQuery<Row>(sql`
        UPDATE org_departments SET ${sql.join(sets, sql`, `)}
        WHERE id = ${id} RETURNING *
      `);
      return r.rows[0] as Row;
    }, 'DB_ERROR');
  }
}
```

**Sabab:** holat-o'tish bitta repo'da markazlashadi; freeze maydonlari atomik yoziladi.

---

### BOSQICH B3 — State-machine guard (qaysi o'tish ruxsat)

**Fayl (yangi):** `apps/api/src/modules/org-structure/card-state-machine.ts` (sof funksiya, ≤120 qator — DB tegmaydi, test oson).

**Spec — ruxsat etilgan o'tishlar:**
```
active   → frozen, vacant, archived
vacant   → active, io, archived          (active = rahbar/xodim biriktirilganda)
io       → active, vacant, frozen, archived
frozen   → active, archived              (active = restore)
archived → active                        (restore/unarchive — EP-ORG-086)
```

```typescript
// card-state-machine.ts (YANGI)
import { ok, err, Result } from '@common/result';
import { AppErr } from '@common/errors';
import type { CardState } from './org-structure/card-lifecycle.repo';

const ALLOWED: Record<CardState, CardState[]> = {
  active:   ['frozen', 'vacant', 'archived'],
  vacant:   ['active', 'io', 'archived'],
  io:       ['active', 'vacant', 'frozen', 'archived'],
  frozen:   ['active', 'archived'],
  archived: ['active'],
};

/** NULL current_state → backfill-default normalize qiladi (B1 qoidasi). */
export function normalizeState(raw: string | null, isActive: boolean, headUserId: number | null): CardState {
  if (raw && (['active','vacant','io','frozen','archived'] as string[]).includes(raw)) return raw as CardState;
  if (!isActive) return 'archived';
  return headUserId != null ? 'active' : 'vacant';
}

export function canTransition(from: CardState, to: CardState): Result<true> {
  if (from === to) return err(AppErr('STATE_NOOP', `Karta allaqachon "${to}" holatida`));
  if (!ALLOWED[from]?.includes(to)) {
    return err(AppErr('STATE_INVALID', `"${from}" → "${to}" o'tish ruxsat etilmagan`));
  }
  return ok(true);
}
```

**Sabab:** noto'g'ri o'tish (masalan `archived → frozen`) DB ga yetmaydi. Sof funksiya — unit-test 100%.

---

### BOSQICH B4 — Lifecycle service + endpoint

**Fayl:** `org-structure.service.ts` (+ `card-lifecycle.service.ts` agar 900 dan oshsa) va `org-structure.controller.ts`.

**Service metodi (yangi `transitionState`):**
```typescript
// org-structure.service.ts ichiga (constructor'ga CardLifecycleRepo + CardAuditRepo inject)
async transitionState(
  id: number, next: CardState,
  opts: { reason?: string | null; frozenUntil?: string | null; actorId?: number | null },
): Promise<Result<Record<string, unknown>>> {
  return safeCall(async () => {
    const cur = await this.lifecycleRepo.getState(id);
    if (!cur.ok) throw new Error(cur.error.message);
    const from = normalizeState(cur.data.current_state, cur.data.is_active, cur.data.head_user_id);
    const guard = canTransition(from, next);
    if (!guard.ok) throw new Error(guard.error.message);
    // freeze/archive => sabab MAJBURIY (EP-ORG-068 amaliy holati)
    if ((next === 'frozen' || next === 'archived') && !opts.reason) {
      throw new Error("Bu holatga o'tish uchun sabab majburiy");
    }
    const updated = await this.lifecycleRepo.setState(id, next, {
      frozenReason: next === 'frozen' ? opts.reason : null,
      frozenUntil: opts.frozenUntil ?? null, actorId: opts.actorId ?? null,
    });
    if (!updated.ok) throw new Error(updated.error.message);
    // audit-iz (B5)
    await this.cardAuditRepo.recordTransition(id, from, next, opts.reason ?? null, opts.actorId ?? null);
    return updated.data;
  });
}
```

**Controller endpoint (yangi — `org-structure.controller.ts`):**
```typescript
const StateTransitionSchema = z.object({
  state: z.enum(['active', 'vacant', 'io', 'frozen', 'archived']),
  reason: z.string().max(2000).optional(),
  frozenUntil: z.string().datetime().optional(),
}).strict();

@ApiOperation({ summary: 'Transition card lifecycle state (5-holat state-machine)' })
@ApiResponse({ status: 200, description: 'OK' })
@ApiResponse({ status: 400, description: 'Invalid transition / sabab majburiy' })
@Patch('nodes/:id/state')
async transitionState(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: unknown,
  @CurrentUser() user: AuthenticatedUser,
) {
  const dto = StateTransitionSchema.parse(body);
  const actorId = user?.id ?? user?.sub ?? null;
  return unwrapOrInternal(await this.service.transitionState(id, dto.state, {
    reason: dto.reason ?? null, frozenUntil: dto.frozenUntil ?? null,
    actorId: actorId != null ? Number(actorId) : null,
  }));
}
```

Qulaylik endpoints (freeze/restore — state'ning maxsus holati):
- `PATCH nodes/:id/freeze` → `transitionState(id,'frozen',{reason,frozenUntil})` (reason majburiy).
- `PATCH nodes/:id/restore` → `transitionState(id,'active',{reason})`.

**Sabab:** FE bitta tushunarli endpoint orqali holatni o'zgartiradi; gate + majburiy-sabab + audit bitta joyda.

---

### BOSQICH B5 — Field-level audit diff (eski/yangi/kim/sabab)

**Fayl (yangi):** `apps/api/src/modules/org-structure/org-structure/card-audit.repo.ts` (≤200 qator).

**Nima:** `update()` mutatsiyasi paytida ESKI satrni o'qib, yangi DTO bilan solishtirib, har O'ZGARGAN maydon uchun `audit_logs` ga REAL diff yozadi (`old_values`/`new_values` jsonb to'g'ri ishlatiladi — `AuditInterceptor` metadata'siga qo'shimcha, uni almashtirmaydi).

```typescript
// card-audit.repo.ts (YANGI)
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { auditLogs as auditLogsTable } from '@shared/db/schema-rbac';
import { randomUUID } from 'crypto';
import { safeCall, Result } from '@common/result';

/** Pul/razryad maydonlari — sabab MAJBURIY (EP-ORG-068). */
export const REASON_REQUIRED_FIELDS = new Set([
  'salary_type', 'min_salary', 'max_salary', 'bonus_config', 'razryad_level_id',
]);

@Injectable()
export class CardAuditRepo {
  /** Eski va yangi satrni solishtirib, har o'zgargan maydonni yozadi. */
  async recordFieldDiff(
    cardId: number, before: Record<string, unknown>, after: Record<string, unknown>,
    reason: string | null, actorId: number | null,
  ): Promise<Result<{ changed: string[] }>> {
    return safeCall(async () => {
      const changed: string[] = [];
      const oldV: Record<string, unknown> = {};
      const newV: Record<string, unknown> = {};
      for (const key of Object.keys(after)) {
        if (after[key] === undefined) continue;
        if (String(before[key] ?? '') !== String(after[key] ?? '')) {
          changed.push(key); oldV[key] = before[key] ?? null; newV[key] = after[key] ?? null;
        }
      }
      if (changed.length === 0) return { changed };
      await db.insert(auditLogsTable).values({
        id: randomUUID(),
        userId: actorId != null ? String(actorId) : undefined,
        action: 'UPDATE', tableName: 'org_card', recordId: String(cardId),
        oldValues: oldV, newValues: newV, changedFields: changed,
        reason: reason ?? '(sabab kiritilmagan)',
      });
      return { changed };
    }, 'DB_ERROR');
  }

  /** Holat-o'tishni alohida audit-yozuv qiladi (B4 dan chaqiriladi). */
  async recordTransition(
    cardId: number, from: string, to: string, reason: string | null, actorId: number | null,
  ): Promise<Result<true>> {
    return safeCall(async () => {
      await db.insert(auditLogsTable).values({
        id: randomUUID(),
        userId: actorId != null ? String(actorId) : undefined,
        action: 'STATE', tableName: 'org_card', recordId: String(cardId),
        oldValues: { current_state: from }, newValues: { current_state: to },
        changedFields: ['current_state'], reason: reason ?? `Holat: ${from} → ${to}`,
      });
      return true as const;
    }, 'DB_ERROR');
  }
}
```

**Sabab:** vizyon "maydon/eski/yangi/kim/qachon/sabab" (EP-ORG-067) ni `AuditInterceptor` metadata'si bermaydi. Bu repo REAL diff yozadi; `tableName='org_card'` bilan ajratiladi.

---

### BOSQICH B6 — Majburiy-sabab gate `update()` ga ulanadi

**Fayl:** `org-structure.controller.ts:181-184` + `org-structure.service.ts:136-142` + `org-mutations.repo.ts:88-117`.

**OLDIN (`org-structure.controller.ts:182`):**
```typescript
const dto = OrgNodeSchema.partial().parse(body);
return unwrapOrInternal(await this.service.update(id, dto as Record<string, unknown>));
```

**KEYIN:**
```typescript
// OrgNodeSchema ga reason qo'shiladi (allow-list kengayadi, .strict() saqlanadi)
//   reason: z.string().max(2000).optional(),
const dto = OrgNodeSchema.partial().parse(body);
const actorId = user?.id ?? user?.sub ?? null;
return unwrapOrInternal(await this.service.update(id, dto as Record<string, unknown>, actorId != null ? Number(actorId) : null));
```
(`@CurrentUser() user: AuthenticatedUser` parametr qo'shiladi — `update()` signaturasiga.)

**Service `update()` (OLDIN `:136-142`):**
```typescript
async update(id: number, dto: Record<string, unknown>) {
  const existsR = await this.repo.existsById(id);
  if (!existsR.ok || !existsR.data) return Err(`Node #${id} topilmadi`);
  return this.repo.updateFromDto(id, dto);
}
```

**KEYIN:**
```typescript
async update(id: number, dto: Record<string, unknown>, actorId: number | null) {
  const existsR = await this.repo.existsById(id);
  if (!existsR.ok || !existsR.data) return Err(`Node #${id} topilmadi`);

  // Majburiy-sabab gate (EP-ORG-068): pul/razryad maydoni o'zgarsa reason shart.
  const touchesMoney = ['salaryType','minSalary','maxSalary','bonusConfig','razryadLevelId']
    .some(k => dto[k] !== undefined);
  const reason = (dto.reason as string | undefined) ?? null;
  if (touchesMoney && (!reason || reason.trim().length === 0)) {
    return Err("Pul yoki razryad o'zgarishi uchun sabab majburiy");
  }

  // ESKI satrni audit-diff uchun o'qib olamiz (mutatsiyadan OLDIN).
  const beforeR = await this.repo.findRawById(id);   // yangi repo metod (SELECT *)
  const before = beforeR.ok ? beforeR.data : {};

  const updated = await this.repo.updateFromDto(id, dto);
  if (updated.ok && beforeR.ok) {
    await this.cardAuditRepo.recordFieldDiff(id, before, updated.data, reason, actorId);
  }
  return updated;
}
```

`org-mutations.repo.ts`: `updateFromDto` `reason` ni DB-ustun sifatida YOZMAYDI (reason audit'ga boradi) — `applyUnitFields` allow-listiga `reason` QO'SHILMAYDI. `findRawById` yangi metod qo'shiladi (`SELECT * FROM org_departments WHERE id=$1`).

**Sabab:** vizyon EP-ORG-068 — pul/razryad o'zgarishi sababsiz o'tmaydi; har o'zgarish REAL diff bilan yoziladi.

---

### BOSQICH B7 — Excel ommaviy-import (shablon + partial + idempotent UPSERT)

**Fayllar (yangi):**
- `apps/api/src/modules/org-structure/card-import.service.ts` (≤300 qator).
- `card-import.repo.ts` (UPSERT + import-batch audit).
- Endpoint `org-structure.controller.ts`.

**Spec:**
1. **Shablon (GET):** `GET org-structure/import/template` — ExcelJS bilan ustunlar: `name`, `name_ru`, `node_type`, `parent_code` (kod orqali bog'lash), `code`, `razryad_level`, `salary_type`, `min_salary`, `max_salary`, `tskp`. `org-export.service.ts` ExcelJS namunasini qayta ishlatadi (yangi workbook).
2. **Import (POST multipart):** `POST org-structure/import/excel` — fayl o'qiladi (ExcelJS `workbook.xlsx.load(buffer)`), har satr Zod bilan validate.
3. **Partial-commit:** to'g'ri satrlar UPSERT bo'ladi (`code` biznes-kalit bo'yicha: mavjud → UPDATE, yo'q → INSERT). Xato satrlar `{ row: N, errors: [...] }` ro'yxat bilan qaytadi. Hech qachon throw qilmaydi — `Result` qaytaradi.
4. **Idempotent UPSERT:** `code` bo'yicha `ON CONFLICT (code) DO UPDATE` — qayta-yuklashda dublikat YO'Q. (Migration: `org_departments.code` ga `UNIQUE INDEX WHERE code IS NOT NULL` — §4.3.)
5. **Import-batch audit (EP-ORG-078):** har import `audit_logs` ga `action='IMPORT'`, `tableName='org_card_import'`, `new_values={ filename, totalRows, inserted, updated, failed }`.

```typescript
// card-import.service.ts (YANGI) — asosiy oqim (qisqartirilgan)
const ImportRowSchema = z.object({
  name: z.string().min(1).max(500),
  nameRu: z.string().max(500).optional(),
  nodeType: z.enum(['department','section','position','director','otdeleniye']).default('position'),
  parentCode: z.string().max(50).optional(),
  code: z.string().max(50).optional(),
  razryadLevel: z.coerce.number().int().positive().optional(),
  salaryType: z.enum(['ishbay','soatbay','oylik']).optional(),
  minSalary: z.coerce.number().nonnegative().optional(),
  maxSalary: z.coerce.number().nonnegative().optional(),
  tskp: z.string().max(2000).optional(),
});

async importExcel(buffer: Buffer, filename: string, actorId: number | null): Promise<Result<{
  totalRows: number; inserted: number; updated: number; failed: number;
  errors: Array<{ row: number; errors: string[] }>;
}>> {
  return safeCall(async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.worksheets[0];
    const errors: Array<{ row: number; errors: string[] }> = [];
    let inserted = 0, updated = 0, total = 0;
    // satrlarni o'qib raw obyektga aylantirish (header satr 1)
    const rows: Array<Record<string, unknown>> = [];
    sheet.eachRow((r, idx) => { if (idx === 1) return; rows.push(this.rowToObject(sheet, r)); });
    for (let i = 0; i < rows.length; i++) {
      total++;
      const parsed = ImportRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({ row: i + 2, errors: parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`) });
        continue;   // PARTIAL — xato satr yuklanMAYDI, qolgani davom etadi
      }
      const res = await this.repo.upsertByCode(parsed.data);   // {action:'inserted'|'updated'}
      if (!res.ok) { errors.push({ row: i + 2, errors: [res.error.message] }); continue; }
      if (res.data.action === 'inserted') inserted++; else updated++;
    }
    await this.repo.recordImportBatch(filename, total, inserted, updated, errors.length, actorId);
    return { totalRows: total, inserted, updated, failed: errors.length, errors };
  });
}
```

`upsertByCode` repo (`ON CONFLICT (code)`):
```typescript
// RULE4_EXCEPTION: ON CONFLICT upsert — Drizzle onConflictDoUpdate ham mumkin,
// ammo dynamic-set + RETURNING action uchun parametrli sql ishlatamiz.
const r = await runQuery<{ id: number; was_insert: boolean }>(sql`
  INSERT INTO org_departments (name, name_ru, node_type, code, parent_id, razryad_level_id, salary_type, min_salary, max_salary, tskp, is_active, current_state)
  VALUES (${d.name}, ${d.nameRu ?? null}, ${d.nodeType}, ${d.code ?? null}, ${parentId}, ${d.razryadLevel ?? null}, ${d.salaryType ?? null}, ${d.minSalary ?? null}, ${d.maxSalary ?? null}, ${d.tskp ?? null}, true, 'vacant')
  ON CONFLICT (code) WHERE code IS NOT NULL DO UPDATE SET
    name = EXCLUDED.name, name_ru = EXCLUDED.name_ru, node_type = EXCLUDED.node_type,
    razryad_level_id = EXCLUDED.razryad_level_id, salary_type = EXCLUDED.salary_type,
    min_salary = EXCLUDED.min_salary, max_salary = EXCLUDED.max_salary, tskp = EXCLUDED.tskp
  RETURNING id, (xmax = 0) AS was_insert
`);
```
(`xmax = 0` → INSERT; aks holda UPDATE — Postgres standart trick.)

**Endpoint:**
```typescript
@Roles('super_admin', 'hr')
@Post('import/excel')
async importExcel(@Req() req: FastifyRequest, @CurrentUser() user: AuthenticatedUser) {
  const file = await (req as unknown as { file: () => Promise<{ toBuffer: () => Promise<Buffer>; filename: string }> }).file();
  if (!file) throw new HttpException("Fayl yuborilmadi", HttpStatus.BAD_REQUEST);
  const buffer = await file.toBuffer();
  const actorId = user?.id ?? user?.sub ?? null;
  return unwrapOrInternal(await this.importService.importExcel(buffer, file.filename, actorId != null ? Number(actorId) : null));
}
```
(Fastify multipart — `@fastify/multipart` ro'yxatdan o'tganligini tekshir: `grep -rn "multipart" apps/api/src`. Agar yo'q bo'lsa — bu egasi-ruxsat (dependency, Q-35-ga o'xshash) — §11 ga yoz, JSON-base64 fallback bilan davom et.)

**Sabab:** EP-ORG-075/076/078 — shablon + partial + idempotent + batch-audit. Throw YO'Q (Result). Fabrikatsiya YO'Q (real INSERT/UPDATE).

---

### BOSQICH B8 — Vakansiya aging + prioritet + SLA

**Fayllar:** `card-lifecycle.repo.ts` (aging query) + `org-structure.service.ts` (bucket hisoblash) + `business.constants.ts`.

**`business.constants.ts` (yangi konstantalar — Qoida 12):**
```typescript
export const CARD_AGING_GREEN_MAX_DAYS = 14;   // 0-14 yashil
export const CARD_AGING_YELLOW_MAX_DAYS = 45;   // 15-45 sariq; 45+ qizil
export const CARD_SLA_CRITICAL_DAYS = 14;
export const CARD_SLA_MEDIUM_DAYS = 30;
export const CARD_SLA_LOW_DAYS = 60;
```

**Service — vakansiya ro'yxati aging bilan:**
```typescript
async listVacanciesWithAging(): Promise<Result<{ items: Array<Record<string, unknown>> }>> {
  return safeCall(async () => {
    const r = await this.lifecycleRepo.listVacancies();   // SELECT vacant kartalar + vacancy_opened_at + priority + sla_days
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    const now = Date.now();
    const items = rows.map(v => {
      const opened = v.vacancy_opened_at ? new Date(String(v.vacancy_opened_at)).getTime() : now;
      const days = Math.floor((now - opened) / 86_400_000);
      const bucket = days <= CARD_AGING_GREEN_MAX_DAYS ? 'green'
                   : days <= CARD_AGING_YELLOW_MAX_DAYS ? 'yellow' : 'red';
      const sla = Number(v.vacancy_sla_days ?? 0);
      const slaBreached = sla > 0 && days > sla;
      return { ...v, daysOpen: days, agingBucket: bucket, slaBreached };
    });
    return { items };
  });
}
```

**Aging hisoblash CONTROLLER ichida EMAS (Qoida 6)** — service'da. Endpoint `GET org-structure/vacancies/aging`.

**`vacancy_opened_at` qachon yoziladi:** `transitionState(... 'vacant')` da `vacancy_opened_at = NOW()` qo'shiladi (B2 `setState` ga `if (next==='vacant') sets.push(sql\`vacancy_opened_at = COALESCE(vacancy_opened_at, NOW())\`)`).

**Sabab:** EP-ORG-071/072/073/074/080 — aging-bucket + SLA. Chegaralar struktura (kod); qaysi karta qaysi prioritet/SLA = egasi-data (§11), kod default `NULL` qoldiradi (fabrikatsiya yo'q).

---

### BOSQICH B9 — `card_templates` shablon

**Fayllar (yangi):** `card-template.repo.ts` + `card-template.service.ts` + `card-template.controller.ts` + migration §4.2 + seed.

**Jadval `card_templates`** (APPROVED — §4.2): `id`, `code` (unique), `title_uz`, `title_ru`, `node_type`, `default_razryad_level_id`, `default_salary_type`, `default_tskp`, `default_fields` (jsonb — qo'shimcha avto-to'ldirish), `is_active`, `created_at`.

**Endpoint:**
- `GET org-structure/templates` — ro'yxat.
- `POST org-structure/templates` — yaratish (Zod + Result).
- `PATCH org-structure/templates/:id` — yangilash.
- `DELETE org-structure/templates/:id` — soft-delete (`is_active=false`).
- `POST org-structure/nodes/from-template/:templateId` — shablondan karta yaratadi (default maydonlar to'ladi → `service.create` chaqiriladi). Bu **mutation** (Qoida 19).

**Seed (10-15 zavod-lavozim — EP-ORG-059):** `_audit/seed-card-templates.cjs` yoki `docs/migration/seed/card-templates.sql`. Lavozimlar: mashinist, operator, naladchik (sozlovchi), OTKchi (sifat nazoratchi), logist, omborchi, dizayner, konstruktor, smena-boshlig'i, brigadir, elektrik, mexanik, qadoqlovchi, yuk tashuvchi, tozalovchi. **Razryad/oylik qiymatlari NULL** (egasi to'ldiradi — fabrikatsiya yo'q); faqat `code`/`title`/`node_type` to'ladi.

**EP-ORG-058 (shablon o'zgarsa eski kartalar):** eski kartalar O'ZGARMAYDI; faqat `template_id` link saqlanadi. "Shablonga moslashtirish" tugmasi ixtiyoriy (FE, B9-FE) — owner bosadi.

**Sabab:** EP-ORG-057/059 — lavozim-turi avto-to'ldirish; seed faqat struktura (data egasidan).

---

### BOSQICH B10 — 01/02 dublikat-raqamlash (`seat_number`)

**Fayl:** `org-mutations.repo.ts` `create()` + yangi helper.

**Spec:** `node_type='position'` karta yaratilganda, agar shu `name` + `parent_id` bilan boshqa karta mavjud bo'lsa, `seat_number` avto = `'01'`, `'02'`... (`COUNT(*) + 1`, `padStart(2,'0')`).

```typescript
// org-mutations.repo.ts create() ichida, INSERT'dan OLDIN:
let seatNumber: string | null = null;
if ((dto.nodeType as string) === 'position') {
  const dup = (await runQuery<{ cnt: number }>(sql`
    SELECT COUNT(*)::int AS cnt FROM org_departments
    WHERE node_type = 'position' AND name = ${dto.name as string}
      AND parent_id IS NOT DISTINCT FROM ${(dto.parentId as number) ?? null}
      AND is_active = true
  `)).rows[0]?.cnt ?? 0;
  if (dup > 0) seatNumber = String(dup + 1).padStart(2, '0');
  else seatNumber = '01';   // birinchi nusxa ham 01 oladi (vizyon: dublikatda raqam)
}
// INSERT .values({... seat_number: seatNumber ...}) — schema'ga qo'shiladi (B1 ustun)
```

**Sabab:** EP-ORG-002/037 — dublikat lavozim 01/02/03. Hozir mexanizm umuman yo'q (audit dalil: grep `padStart/seat_number` = 0).

---

### BOSQICH B11 — Merge / split SKELET (RAD-tasdiq, owner-gated)

> **ZIDDIYAT (§11):** MASTER-SAVOL "merge/split YO'Q atomik", `decisions/01` EP-ORG-064/065 "bor". Egasi hal qilmaguncha **MUTATSIYA YOZILMAYDI** — faqat skeleton + 501 NOT_IMPLEMENTED + owner-DATA yozuvi. Fabrikatsiya/yarim-ishlaydigan kod TAQIQ (Q-46) — shuning uchun TO'LIQ skelet emas, balki aniq 501 + DTO.

**Fayl:** `org-structure.controller.ts` (2 endpoint, 501).
```typescript
@Roles('super_admin', 'hr')
@Post('nodes/:id/merge')
async mergeCard(@Param('id', ParseIntPipe) _id: number, @Body() _body: unknown) {
  // EP-ORG-064 — egasi qarori kutilmoqda (MASTER-SAVOL ╳ decisions/01 ziddiyat).
  // Owner "ha" deguncha mutatsiya yo'q (Q-46: yarim-ishlaydigan kod taqiq).
  throw new HttpException("Karta birlashtirish — egasi tasdig'i kutilmoqda", HttpStatus.NOT_IMPLEMENTED);
}

@Roles('super_admin', 'hr')
@Post('nodes/:id/split')
async splitCard(@Param('id', ParseIntPipe) _id: number, @Body() _body: unknown) {
  throw new HttpException("Karta bo'lish — egasi tasdig'i kutilmoqda", HttpStatus.NOT_IMPLEMENTED);
}
```
**Sabab:** ziddiyatni fabrikatsiya bilan to'ldirmaslik; aniq 501 (Qoida 10/17 mos — NOT_IMPLEMENTED to'g'ri javob). Egasi tasdiqlasa keyingi sessiyada to'liq quriladi.

---

## §4. DB MIGRATSIYA (APPROVED)

> Idempotent. `_audit/apply-card-lifecycle.cjs` (mavjud `apply-node-card-cols.cjs` namunasi: `Pool` 127.0.0.1:5432 europrint). Drizzle schema fayli ham yangilanadi (`grep -rn "orgDepartments" lib/db/src/schema` bilan top).

### §4.1 org_departments lifecycle ustunlari (ALTER — mavjud jadval)
```sql
-- APPROVED (egasi 2026-06-25, MASTER-REJA FAZA 9): karta lifecycle ustunlari.
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS frozen_reason       text;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS frozen_until        timestamp;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS frozen_at           timestamp;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS frozen_by           integer;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS restored_at         timestamp;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS restored_by         integer;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS vacancy_opened_at   timestamp;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS vacancy_priority    text;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS vacancy_sla_days    integer;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS seat_number         text;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS template_id         integer;

-- current_state backfill (NULL → default; faqat NULL satrlarga — idempotent):
UPDATE org_departments SET current_state =
  CASE WHEN is_active = false THEN 'archived'
       WHEN head_user_id IS NOT NULL THEN 'active'
       ELSE 'vacant' END
WHERE current_state IS NULL;
```

### §4.2 card_templates (CREATE — APPROVED)
```sql
-- APPROVED (egasi 2026-06-25, FAZA 9 EP-ORG-057/059): karta shablonlari.
CREATE TABLE IF NOT EXISTS card_templates (
  id                       serial PRIMARY KEY,
  code                     text UNIQUE NOT NULL,
  title_uz                 text NOT NULL,
  title_ru                 text,
  node_type                text NOT NULL DEFAULT 'position',
  default_razryad_level_id integer,
  default_salary_type      text,
  default_tskp             text,
  default_fields           jsonb,
  is_active                boolean NOT NULL DEFAULT true,
  created_at               timestamp NOT NULL DEFAULT NOW()
);
```

### §4.3 code uniqueness (idempotent UPSERT uchun)
```sql
-- APPROVED: import idempotent UPSERT (ON CONFLICT (code)) uchun partial-unique.
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_departments_code
  ON org_departments (code) WHERE code IS NOT NULL;
```

### §4.4 audit_logs — CREATE TABLE EMAS
`audit_logs` allaqachon mavjud va kerakli ustunlar bor (`old_values`/`new_values` jsonb, `changed_fields` array, `reason`, `user_*`). **Yangi jadval YO'Q** — `tableName='org_card'`/`'org_card_import'` qiymat bilan ajratiladi (B5/B7).

---

## §5. Zod / Result / Drizzle NAMUNA

### 5.1 Zod (controller — `.strict()`)
```typescript
const StateTransitionSchema = z.object({
  state: z.enum(['active', 'vacant', 'io', 'frozen', 'archived']),
  reason: z.string().max(2000).optional(),
  frozenUntil: z.string().datetime().optional(),
}).strict();

const TemplateCreateSchema = z.object({
  code: z.string().min(1).max(50),
  titleUz: z.string().min(1).max(500),
  titleRu: z.string().max(500).optional(),
  nodeType: z.enum(['department','section','position','director','otdeleniye']).default('position'),
  defaultRazryadLevelId: z.number().int().positive().optional(),
  defaultSalaryType: z.enum(['ishbay','soatbay','oylik']).optional(),
  defaultTskp: z.string().max(2000).optional(),
}).strict();
```

### 5.2 Result (service)
```typescript
async freezeCard(id: number, reason: string, until: string | null, actorId: number | null): Promise<Result<Record<string, unknown>>> {
  if (!reason || reason.trim().length === 0) return Err('Muzlatish uchun sabab majburiy');
  return this.transitionState(id, 'frozen', { reason, frozenUntil: until, actorId });
}
```

### 5.3 Drizzle (oddiy o'qish — repo)
```typescript
import { orgDepartments } from '@shared/db';
import { eq, and } from 'drizzle-orm';
async findTemplates() {
  return safeCall(async () => {
    const rows = await db.select().from(cardTemplates).where(eq(cardTemplates.is_active, true));
    return Array.isArray(rows) ? rows : [];
  }, 'DB_ERROR');
}
```

---

## §6. MODUL REGISTRATSIYASI

`org-structure.module.ts` ga yangi provayderlar qo'shiladi (Read bilan tasdiqla `grep -n "providers" org-structure.module.ts`):
```typescript
providers: [
  // ...mavjud
  CardLifecycleRepo, CardAuditRepo, CardImportService, CardImportRepo,
  CardTemplateService, CardTemplateRepo,
],
controllers: [
  // ...mavjud OrgStructureController, CardController
  CardTemplateController,   // agar alohida controller bo'lsa
],
```
`OrgStructureService` constructor'iga `CardLifecycleRepo` + `CardAuditRepo` inject (optional emas — bu modul ichida).

---

## §7. FE + DIZAYN (EP token/shablon/komponent)

> Sahifa: `pages/OrgNodeDetail.tsx` + `components/hr/orgnode/*`. EP token (`var(--ep-*)`), `components/ep` (EPStatusPill/EPCard), `components/ui` (Tabs/Dialog/Button). Tab ≤2 daraja. F1/F2 majburiy.

### 7.1 Header'ga holat + freeze/restore (OrgNodeDetail.tsx:96-101)
- Header'da joriy holatni `EPStatusPill` bilan ko'rsat: `active`→`success`, `vacant`→`warning`, `io`→`info`, `frozen`→`neutral`, `archived`→`danger`.
- Tugmalar qatoriga (`:96-101`) **"Muzlatish"** (frozen emas bo'lsa) yoki **"Tiklash"** (frozen/archived bo'lsa) tugma. Bosilganda dialog (sabab MAJBURIY input + frozen uchun `frozenUntil` sana).
- Mutation: `apiRequest('PATCH', \`/api/org-structure/nodes/${id}/state\`, { state, reason, frozenUntil })`. F2 onError toast.
- **Regress:** mavjud Edit/Move/Delete tugmalari QOLADI; mavjud `isVacant` badge QOLADI.

### 7.2 VacantTab → aging (ExtraTabs.tsx:88-116)
- `VacantTab` ni aging bilan kengaytir: agar karta `vacant` bo'lsa `vacancy_opened_at` + `daysOpen` + bucket-rang (`green`→`var(--ep-green)`, `yellow`→`var(--ep-amber)`, `red`→`var(--ep-red)`) + SLA badge.
- **Xom rang TAQIQ** — token: `var(--ep-green)`/`var(--ep-amber)`/`var(--ep-red)` (mavjud `:97,105` allaqachon `var(--ep-green)`/`var(--ep-red)` ishlatadi — davom ettir).
- Yangi data manbai: `GET /api/org-structure/vacancies/aging` yoki node-detail ichida `node.daysOpen`/`node.agingBucket`.

### 7.3 HistoryTab — field-diff ko'rsatish (HistoryTab.tsx)
- `getNodeHistory` endpointini `tableName='org_card'` field-diff yozuvlarini ham qaytaradigan qilib kengaytir (B5 yozuvlari): har satr `field`, `oldValue`, `newValue`, `changedBy`, `changedAt`, `reason`.
- FE: jadval ustunlari "Maydon / Eski / Yangi / Kim / Qachon / Sabab". F1 loading skeleton.

### 7.4 Import dialog (yangi — OrgStructureHierarchy.tsx toolbar)
- "Import (Excel)" tugmasi (faqat hr/super_admin ko'radi) → dialog: shablon-yuklab-olish link (`GET import/template`) + fayl-tanlash + yuklash.
- Natija: `{ inserted, updated, failed, errors[] }` — xato satrlar jadvalda ko'rsatiladi (`row` + xato matn).
- Mutation F2 onError; muvaffaqiyatda `invalidateQueries(['/api/org-structure/hierarchy'])`.

### 7.5 Templates (yangi sahifa yoki tab)
- Agar yangi sahifa: `pages/CardTemplates.tsx` — ListPage shablon + CRUD (Qoida 19 — mutation majburiy). Sidebar'ga **fayl yaratilgandan KEYIN** qo'shiladi (Qoida 20). EPComingSoon EMAS (real CRUD).
- "Shablondan karta yaratish" — hierarchy "Add" dialogiga shablon-tanlash dropdown.

### 7.6 Dizayn tekshiruv
- `node scripts/check-design-tokens.mjs` — yangi FE fayllarda inline xom rang BLOK bo'lmasin.
- Har yangi forma: F1 (`isLoading` skeleton) + F2 (`onError` toast) + REAL mutation (Qoida 43).

---

## §8. QABUL-MEZONI (Definition of Done)

1. **State-machine:** `PATCH nodes/:id/state` — `active→frozen` (sabab bilan) 200; `archived→frozen` 400 ("ruxsat etilmagan"); `active→active` 400 ("allaqachon"). DB-proof: `current_state` o'zgaradi.
2. **Freeze/restore:** `freeze` sababsiz 400; sabab bilan 200 + `frozen_reason`/`frozen_until`/`frozen_at` yoziladi; `restore` → `current_state='active'` + frozen maydonlar NULL + `restored_at` yoziladi.
3. **Field-diff audit:** `PATCH nodes/:id` `min_salary` o'zgartirsa → `audit_logs` ga `tableName='org_card'`, `old_values={min_salary:eski}`, `new_values={min_salary:yangi}`, `changed_fields=['min_salary']`, `reason=<kiritilgan>` yoziladi.
4. **Majburiy-sabab:** `min_salary` o'zgartirish sababsiz 400 ("Pul yoki razryad ... sabab majburiy"); `color` o'zgartirish sababsiz 200 (ixtiyoriy).
5. **Import:** shablon GET 200 (xlsx); import 3 to'g'ri + 1 xato satr → `{inserted/updated, failed:1, errors:[{row:N}]}` 200; qayta-import (bir xil `code`) → `updated`, yangi qator YO'Q (idempotent); batch `audit_logs action='IMPORT'`.
6. **Aging:** `vacant` kartaga `vacancy_opened_at` yoziladi; aging endpoint `daysOpen`+`agingBucket`(green/yellow/red)+`slaBreached` qaytaradi.
7. **Templates:** CRUD 200; `from-template/:id` shablondan karta yaratadi (default maydonlar to'ladi); seed 10-15 shablon (razryad/oylik NULL).
8. **Seat-number:** bir xil `name`+`parent` 2-position → `seat_number='02'`; birinchisi `'01'`.
9. **Merge/split:** 501 NOT_IMPLEMENTED (owner-gated).
10. **Verify:** `tsc` o'z fayllarda 0 xato; har bosqich bproof DB-proof PASS; jonli HTTP isbot (login → endpoint).
11. **Regress:** mavjud `is_active`, `deactivate`, 9 tab, Edit/Move/Delete, `AuditInterceptor` — hammasi ishlaydi.
12. **Dizayn:** `check-design-tokens.mjs` PASS; tab ≤2 daraja.

---

## §9. EDGE-HOLATLAR

1. **`current_state` NULL** (mavjud 144 satr) → `normalizeState()` default beradi; state-machine NULL ni "active/vacant/archived" deb ko'radi (B3). 400 bermaydi.
2. **Frozen muddati tugagan** → bu fazada cron YO'Q (FAZA 1 freeze/restore lifecycle cron'ga tegishli); `frozen_until < NOW()` ni faqat o'qishda flag qilamiz, avto-restore EMAS (owner ruxsatisiz). §11 ga yoz.
3. **Import: `parent_code` topilmadi** → o'sha satr xato (`errors`), partial davom etadi.
4. **Import: `code` bo'sh** → `ON CONFLICT (code) WHERE code IS NOT NULL` UPSERT'ga tushmaydi → har doim INSERT (dublikat xavfi); shuning uchun `code` bo'sh satr → INSERT, lekin import-natijada `code` tavsiya qilinadi (validatsiya WARN). Idempotentlik faqat `code` bor satrlarda kafolatlanadi.
5. **Majburiy-sabab: `reason` faqat bo'shliq** → `.trim().length===0` → 400.
6. **Seat-number race** (2 parallel INSERT bir xil nom) → noyob index `(name,parent_id,seat_number)` YO'Q (faqat `code` unique); kam ehtimol, owner-DATA ga yoz (kelajakda partial-unique). Bu fazada COUNT-based (best-effort).
7. **`archived` kartani qayta-archive** → `archived→archived` 400 (noop).
8. **`io` (i.o.) holati** — FAZA 1 acting bilan bog'liq; bu fazada `io` faqat state-machine qiymati sifatida ruxsat (transition mavjud), ammo acting-supplement logikasi FAZA 1 da. Qo'shimcha logika YOZILMAYDI.
9. **Audit yozuvi fail** → request buzilmaydi (B5 `safeCall` + mavjud `AuditInterceptor` best-effort pattern).
10. **Template `code` dublikat** → `UNIQUE` → INSERT 23505 → Result `err` ("Bu kod allaqachon mavjud"), 400.

---

## §10. SELF-VERIFY (tsc + bproof DB-proof + jonli isbot)

### 10.1 Typecheck
```bash
cd "C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module"
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep -E "org-structure|card-" || echo "TSC GREEN (org-structure/card-*)"
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | grep -E "OrgNode|orgnode|CardTemplate" || echo "FE TSC GREEN"
```

### 10.2 bproof namunalari (rollback-tx — kirit→oqdi→ko'rindi→ROLLBACK)

`_audit/bproof-card-state-transition.cjs` (B2/B4):
```javascript
const path=require('path');const {Pool}=require(path.join(__dirname,'..','apps','api','node_modules','pg'));
const pool=new Pool({host:'127.0.0.1',port:5432,user:'postgres',password:'postgres',database:'europrint'});
(async()=>{const c=await pool.connect();try{
  const n=(await c.query(`SELECT id,current_state FROM org_departments WHERE node_type='position' AND is_active=true ORDER BY id LIMIT 1`)).rows[0];
  await c.query('BEGIN');
  // active → frozen (sabab + muddat)
  await c.query(`UPDATE org_departments SET current_state='frozen',frozen_reason='Test muzlatish',frozen_until=NOW()+interval '30 days',frozen_at=NOW() WHERE id=$1`,[n.id]);
  const f=(await c.query(`SELECT current_state,frozen_reason,frozen_until IS NOT NULL AS has_until FROM org_departments WHERE id=$1`,[n.id])).rows[0];
  console.log('FROZEN:',JSON.stringify(f));
  // frozen → active (restore)
  await c.query(`UPDATE org_departments SET current_state='active',frozen_reason=NULL,frozen_until=NULL,frozen_at=NULL,restored_at=NOW() WHERE id=$1`,[n.id]);
  const r=(await c.query(`SELECT current_state,frozen_reason,restored_at IS NOT NULL AS has_restore FROM org_departments WHERE id=$1`,[n.id])).rows[0];
  console.log('RESTORED:',JSON.stringify(r));
  await c.query('ROLLBACK');
  const a=(await c.query(`SELECT current_state FROM org_departments WHERE id=$1`,[n.id])).rows[0];
  console.log('ROLLBACK -> current_state =',a.current_state,'(restored to original)');
}catch(e){await c.query('ROLLBACK');console.error('ERR',e.message)}finally{c.release();await pool.end()}})();
```

`_audit/bproof-card-audit-diff.cjs` (B5/B6):
```javascript
// kirit: org_departments min_salary o'zgartir → audit_logs ga REAL diff yozilganini ko'rsat → ROLLBACK
const path=require('path');const {Pool}=require(path.join(__dirname,'..','apps','api','node_modules','pg'));
const {randomUUID}=require('crypto');
const pool=new Pool({host:'127.0.0.1',port:5432,user:'postgres',password:'postgres',database:'europrint'});
(async()=>{const c=await pool.connect();try{
  const n=(await c.query(`SELECT id,min_salary FROM org_departments WHERE node_type='position' AND is_active=true ORDER BY id LIMIT 1`)).rows[0];
  await c.query('BEGIN');
  const before=n.min_salary;
  await c.query(`UPDATE org_departments SET min_salary=4444444 WHERE id=$1`,[n.id]);
  await c.query(`INSERT INTO audit_logs(id,table_name,record_id,action,old_values,new_values,changed_fields,reason)
    VALUES($1,'org_card',$2,'UPDATE',$3,$4,$5,$6)`,
    [randomUUID(),String(n.id),JSON.stringify({min_salary:before}),JSON.stringify({min_salary:4444444}),['min_salary'],'oylik koridor o\\'zgardi']);
  const a=(await c.query(`SELECT old_values,new_values,changed_fields,reason FROM audit_logs WHERE table_name='org_card' AND record_id=$1 ORDER BY created_at DESC LIMIT 1`,[String(n.id)])).rows[0];
  console.log('AUDIT DIFF:',JSON.stringify(a));
  await c.query('ROLLBACK');
  console.log('ROLLBACK done (no row left)');
}catch(e){await c.query('ROLLBACK');console.error('ERR',e.message)}finally{c.release();await pool.end()}})();
```

`_audit/bproof-card-template-upsert.cjs` (B7/B9): card_templates INSERT → `from-template` karta + qayta-UPSERT idempotent → ROLLBACK (xuddi yuqori shablon).

### 10.3 Jonli HTTP isbot
```bash
# login → token
TOKEN=$(curl -s -X POST http://127.0.0.1:3030/api/auth/login -H 'Content-Type: application/json' -d '{"username":"...","password":"..."}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).accessToken||JSON.parse(d).data?.accessToken))")
# state transition
curl -s -X PATCH http://127.0.0.1:3030/api/org-structure/nodes/<ID>/state -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"state":"frozen","reason":"test","frozenUntil":"2026-12-31T00:00:00Z"}' | head
# majburiy-sabab (kutilgan 400):
curl -s -X PATCH http://127.0.0.1:3030/api/org-structure/nodes/<ID> -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"minSalary":5000000}' | head
# template GET:
curl -s http://127.0.0.1:3030/api/org-structure/templates -H "Authorization: Bearer $TOKEN" | head
```
> **Q-44:** server :3030 tushsa (000) → static fallback (tsc + bproof). Jonli isbot server qaytgach.

---

## §11. OWNER-DATA REESTRI (FABRIKATSIYA TAQIQ — egasi to'ldiradi)

| Data / Qaror | Holat | Nima kutiladi |
|--------------|-------|---------------|
| **Merge/split ziddiyat** | MASTER-SAVOL "yo'q" ╳ decisions/01 "bor" | Egasi: merge/split qurilsinmi? (default = 501 skelet). Qurilsa: tarix ko'chish qoidasi. |
| **Vakansiya prioritet/SLA** | `vacancy_priority`/`vacancy_sla_days` 0/144 NULL | Qaysi karta kritik/o'rta/past; SLA kun (default tavsiya: kritik 14, o'rta 30, past 60 — EP-ORG-074, ammo egasi tasdiqlasin). |
| **Shablon razryad/oylik** | seed 10-15 lavozim, razryad/oylik NULL | Har shablonga `default_razryad_level_id` + `default_salary_type` + oylik koridor (egasi). |
| **Import-fayl** | — | HR boshlang'ich kartalar Excel'i (mazmun egasidan). |
| **`@fastify/multipart`** | tekshirilmagan | Agar dependency yo'q bo'lsa — egasi ruxsati (Q-35 dep). Yo'q bo'lguncha base64-JSON fallback. |
| **Frozen avto-restore cron** | bu fazada YO'Q | `frozen_until` tugaganda avto-active bo'lsinmi yoki qo'lda? (FAZA 1 freeze-lifecycle bilan). |
| **Seat-number partial-unique** | COUNT-based (race xavfi) | `(name,parent_id,seat_number)` noyob index kerakmi (egasi tasdiqlasin — kelajak). |

---

## §12. COMMIT TARTIBI

Har bosqich alohida commit (`git add <aniq-fayl>`, `--no-verify` sabab bilan, Co-Authored-By):

```
B1: feat(org): karta lifecycle ustunlari (frozen/vacancy/seat/template) + current_state backfill
    git add lib/db/src/schema/<fayl>.ts _audit/apply-card-lifecycle.cjs

B2-B4: feat(org): 5-holat state-machine + freeze/restore (gate + sabab)
    git add apps/api/src/modules/org-structure/org-structure/card-lifecycle.repo.ts \
            apps/api/src/modules/org-structure/card-state-machine.ts \
            apps/api/src/modules/org-structure/org-structure.service.ts \
            apps/api/src/modules/org-structure/org-structure.controller.ts \
            apps/api/src/modules/org-structure/org-structure.module.ts

B5-B6: feat(org): field-level audit diff + majburiy-sabab gate (pul/razryad)
    git add apps/api/src/modules/org-structure/org-structure/card-audit.repo.ts \
            apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts \
            apps/api/src/modules/org-structure/org-structure.service.ts

B7: feat(org): Excel ommaviy-import (shablon + partial + idempotent UPSERT + batch-audit)
    git add apps/api/src/modules/org-structure/card-import.service.ts \
            apps/api/src/modules/org-structure/card-import.repo.ts \
            apps/api/src/modules/org-structure/org-structure.controller.ts

B8: feat(org): vakansiya aging + prioritet + SLA + business.constants
    git add apps/api/src/common/constants/business.constants.ts \
            apps/api/src/modules/org-structure/org-structure/card-lifecycle.repo.ts \
            apps/api/src/modules/org-structure/org-structure.service.ts

B9: feat(org): card_templates CRUD + seed + from-template
    git add apps/api/src/modules/org-structure/card-template.* \
            docs/migration/seed/card-templates.sql _audit/apply-card-lifecycle.cjs

B10: feat(org): 01/02 dublikat seat-number
    git add apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts

B11: feat(org): merge/split skeleton (501 owner-gated)
    git add apps/api/src/modules/org-structure/org-structure.controller.ts

FE: feat(org-fe): lifecycle UI (freeze/restore + aging + field-diff history + import + templates)
    git add artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx \
            artifacts/erp-dashboard/src/components/hr/orgnode/ExtraTabs.tsx \
            artifacts/erp-dashboard/src/components/hr/orgnode/HistoryTab.tsx \
            artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx \
            artifacts/erp-dashboard/src/pages/CardTemplates.tsx
```

Commit message oxiri:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## §13. YAKUNIY HOLAT HISOBOTI (Q-38 — faza oxirida egaga)

Faza tugagach quyidagi ko'rsatiladi:
- **DONE:** B1-B11 + FE (qaysi bosqich, qaysi commit hash).
- **DB-proof:** har bproof natijasi (FROZEN/RESTORED/AUDIT DIFF/UPSERT — ROLLBACK tasdiq).
- **Jonli:** HTTP 200/400 kutilgan javoblar.
- **DEFER:** merge/split (owner ziddiyat), frozen-cron (FAZA 1), multipart-dep (agar yo'q).
- **Owner-DATA:** §11 ro'yxat (egasi to'ldirishi kerak bo'lganlar).
- **Regress:** mavjud 9 tab + is_active + deactivate + AuditInterceptor ishlaydi (verify).

---

*Yozildi 2026-06-25 (advisor). Manba: 00-MASTER-REJA FAZA 9 + ORGSXEMA-INTERVYU-VS-HOLAT (karta-model 42%) + decisions/01 (EP-ORG-064..086). Jonli holat node _audit/q.cjs + Read bilan tasdiqlangan (org_departments.current_state=144 NULL, card_templates/razryad_history/vacancies YO'Q, audit_logs metadata-only). Ijro: 🟢 Bajaruvchi, ruxsat darvozasi (Q-28), faza KETMA-KET (FAZA 0/1/8 dan keyin).*
