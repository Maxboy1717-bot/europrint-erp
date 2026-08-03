# P51 — ORG: manager_id derivatsiyasi + head_user_id backfill infra

> **Agent ID:** P51 · **To'lqin (Wave):** 1 · **Bog'liqlik:** P04 tugashi shart
> **Sana:** 2026-06-19 · **Modul:** ORG / Org-Struktura
> **DDL darvozasi:** FAOL (GATED — egasi ruxsati shart, DATA darvozasi ham bor)
> Ushbu direktiva **Q-47** bo'yicha to'liq, batafsil, hech qanday noaniqlik qoldirmaydigan tarzda yozilgan.

---

## 0. ROL VA QOIDALAR

Sen **🟢 BAJARUVCHI (EXECUTOR)** agentsan. Har sessiyada `CLAUDE.md` va
`docs/agent-constitution.md` ni o'qib boshla.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. **Result\<T\>** — hamma repo/service metodida; `throw` / `null` / `undefined`
   qaytarish TAQIQ. `@common/result`dagi `Ok`, `Err`, `safeCall` ishlatilsin.
2. **@Body Zod bilan validate** — `class-validator` TAQIQ. Har `@Post`/`@Patch`
   `@Body() body: unknown` → `ZodSchema.parse(body)` bilan boshlaydi.
3. **Drizzle ORM** — raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
   Oddiy SELECT/INSERT/UPDATE → Drizzle fluent API.
4. **Q-40 ishlaydi ≠ to'g'ri** — REAL INSERT/UPDATE + DB-proof (kirit → saqla →
   qayta o'qi → ko'rinadimi). echo/hardcoded/fake javob TAQIQ. TO'G'RI o'lchovi =
   master vizyon (`docs/XARITA-REJA-YONALISH-2026-06-07.md` § 2.3).
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI** — buzuq/o'lik/dublikat kod TO'LIQ
   o'chiriladi (chala qoldirilmaydi).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)** — faqat OWNED-FILE ro'yxatidagi fayllarga
   teg. Boshqa fayl kerak bo'lsa TO'XTA + egasiga flag.
7. **DDL DARVOZASI (Q-35)** — migration fayllar yoziladi lekin `-- GATED` belgisi
   bilan. Egasi `-- APPROVED: <ism> <sana>` qo'shib "run" berguncha `psql` TAQIQ.
8. **DATA DARVOZASI** — bu paketning asosiy blokirovkasi. `head_user_id` har bir
   `org_departments` nodiga faqat egasi/HR to'ldirishi mumkin (kim qaysi bo'limga
   rahbar — bu TIZIM emas, INSON bilimi). Infra (migratsiya + service) tayyorlanadi,
   lekin REAL backfill SQL EGASIsiz ISHLATILMAYDI.
9. **`git add <aniq-fayl>` faqat** — `-A` / `.` TAQIQ. Bitta commit = bitta
   mantiqiy guruh.
10. **Q-45/Q-30** — log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi,
    shu yerda to'g'irlanadi.
12. **Vizyon-moslik** — manager_id = daraxtda bevosita yuqori node'ning boshlig'i
    ("dept head" EMAS; har bo'lim har xil chuqurlik). Manba:
    `docs/XARITA-REJA-YONALISH-2026-06-07.md` § 2.3, Q1/Q4.

**Bu agent WAVE 1 da ishlaydi. dependsOn: ["P04"] — P04 migratsiyalari DB ga
qo'llanilgan bo'lishi shart (`org_functions.manager_id` ustuni mavjud bo'lishi
kerak — org-phase1-canonical-card-2026-06-08.sql tomonidan yaratilgan).**

---

## 1. MUAMMO TAVSIFI — NIMA BUZUQ VA NIMA KERAK

### 1.1 Joriy holat (jonli tasdiqlangan — 2026-06-07)

Master vizyon § 1.5 "5 ildiz muammo" reyestri, ildiz #3:

```
| 3 | manager_id 30/30 NULL | 🔴 ochiq — avval head_user_id (124/142 bo'sh) to'ldirish kerak |
```

Aniq son:
- `org_departments`: 142 ta aktiv node → `head_user_id` faqat **18** tasida to'lgan (124 ta bo'sh).
- `org_functions`: 30 ta karta → `manager_id` **barchasi NULL** (0/30 to'lgan).
- `employees`: `manager_id` — ko'pchiligi NULL (xodim qaysi boshqaruvchi ostida ekanini bilmaymiz).

### 1.2 Nima uchun bu "foundational" muammo

Vizyon § 2.3:
> "Org-chart = YAGONA master (Vysotskiy 7-Otdeleniye, o'zgaruvchan chuqurlik daraxt). Hammasi undan DATA-driven."

- `manager_id` — eskalatsiya zanjiriga asosiy kalit: xodim muammo yozsa → kimga boradi?
- Tasdiqlash yo'li (avans, ta'til, jarimalar) org daraxtidan COMPUTED bo'lishi kerak.
- CC modul (Communication Center) `MANAGER_OF_SENDER` topay deb `manager_id` 0 / NULL
  ustiga tushib xato bergan (transmission map 2026-06-05 topilmasi).
- Payroll, HR-reports, Director-panel — hammasi "rahbar kim?" deb so'raydi.

### 1.3 Nima AVVAL kerak (blokirovka zanjiri)

```
[EGASI DATA: head_user_id]
        ↓
[INFRA: derive_manager_id(node)]     ← bu paket quradi
        ↓
[FOYDALANUVCHI: eskalatsiya ishlaydi]
```

**Birinchi: `head_user_id`** — har `org_departments` nodiga kim rahbarlik qilishini
faqat egasi/HR biladi. Bu kod yoza olmaydi, bu INSON bilimi.

**Ikkinchi: `manager_id` derivatsiyasi** — `head_user_id` to'lganidan keyin,
har node'ning "bevosita yuqori boshlig'i" = parent node'ning `head_user_id` hisoblanadi.
Bu matematik: `deriveManagerId(node) = parentOf(node).head_user_id`. Bu kod qila oladi.

### 1.4 Vizyon ta'rifi — manager_id nima EMAS, nima

Vizyon § 2.3, Q1/Q4 (RETRACTED noto'g'ri model + to'g'ri model):

```
❌ Noto'g'ri (oldingi soddalashtirilgan model):
   manager_id = bo'lim boshlig'i ("dept head")
   — Bu O'CHIRILGAN (RETRACTED 2026-06-07)

✅ To'g'ri (Vysotskiy 7 model):
   manager_id = daraxtda BEVOSITA YUQORI NODE'ning boshlig'i
   — har bo'lim har xil chuqurlikda → "dept head" EMAS
   — L0: Owner (root) — hech kimga hisobot bermaydi
   — L1: CEO → Owner'ga
   — L2: 7-Otdeleniye boshliqlar → CEO'ga
   — L3: Bo'lim boshliqlari → Otdeleniye'ga
   — L4: Seksiya boshliqlari → Bo'limga
   — L5: Operator/Xodim → Seksiyaga
```

Derivatsiya formulasi:
```
employees.manager_id   = employees.userId'ga birikkan org_functions.manager_id
org_functions.manager_id = departmentOf(func).parentDept.head_user_id
org_departments (har node).effectiveManager = parent node.head_user_id
```

---

## 2. DERIVATSIYA ALGORITMI — manager_id qanday hisoblanadi

### 2.1 org_departments daraxtida manager zanjiri

Har `org_departments` node uchun "bevosita manager" quyidagicha:

```sql
-- Node X ning bevosita manageri:
SELECT parent.head_user_id AS manager_user_id
FROM   org_departments child
JOIN   org_departments parent ON parent.id = child.parent_id
WHERE  child.id = :node_id
  AND  child.is_active = true
  AND  parent.is_active = true;
```

- Agar `parent.head_user_id IS NULL` → parent'ning parent'iga ko'tariladi
  (rekursiv, chuqurlik chegarasi = 10).
- Root node (parent_id IS NULL) → manager yo'q (Owner level).

### 2.2 org_functions.manager_id derivatsiyasi

`org_functions` = karta. Har karta bitta `org_departments` ga bog'liq
(`department_id` FK). Karta'ning manageri = shu department'ning bevosita yuqori
node boshlig'i:

```sql
-- Karta X ning manageri:
SELECT parent.head_user_id AS card_manager_id
FROM   org_functions     f
JOIN   org_departments   dept   ON dept.id = f.department_id
JOIN   org_departments   parent ON parent.id = dept.parent_id
WHERE  f.id = :function_id
  AND  f.is_active = true
  AND  dept.is_active = true
  AND  parent.is_active = true;
```

Agar `parent.head_user_id IS NULL` → rekursiv yuqorига ko'tariladi.

### 2.3 employees.manager_id derivatsiyasi

`employees.manager_id` — xodimning bevosita rahbari (users.id emas, employees.id):

> ⚠️ **KANONIK JOIN:** `employee_cards` (M:N jadvali, org-phase6-employee-cards-2026-06-08.sql tomonidan yaratilgan).
> `employee_functions` jadvali MAVJUD EMAS — runtime da "relation does not exist" beradi.
> To'g'ri yo'l: `employee_cards ON ec.employee_id = e.id AND ec.is_primary = true AND ec.is_active = true`,
> so'ng `org_functions ON f.id = ec.card_id`.
> (Manba: 00-INTERVYU-MOSLIK.md §3 1-DARAJA — P51 runtime crash, P04 Drizzle `employeeCards` to'g'ri)

```sql
-- Xodim E ning manageri:
-- 1) Xodimning primary employee_cards yozuvini top (kanonik M:N jadval)
-- 2) Shu card (org_functions) ning org_department ini top
-- 3) Department ning parent ining head_user_id ini top
-- 4) Shu user_id ga mos employees.id qaytarish

SELECT mgr_emp.id AS manager_employee_id
FROM   employees         e
JOIN   employee_cards    ec   ON ec.employee_id = e.id AND ec.is_primary = true
                               AND ec.is_active = true
JOIN   org_functions     f   ON f.id = ec.card_id AND f.is_active = true
JOIN   org_departments   dept ON dept.id = f.department_id AND dept.is_active = true
JOIN   org_departments   par  ON par.id = dept.parent_id AND par.is_active = true
JOIN   employees         mgr_emp ON mgr_emp.user_id = par.head_user_id
WHERE  e.id = :employee_id;
```

### 2.4 Rekursiv "eng yaqin to'lgan rahbar" qidiruvi

Ba'zi intermediate node'larda `head_user_id NULL` bo'lishi mumkin.
Rekursiv CTE bilan eng yaqin to'lgan parent topiladi:

```sql
WITH RECURSIVE ancestor AS (
  SELECT id, parent_id, head_user_id, 1 AS depth
  FROM   org_departments
  WHERE  id = :start_node_id AND is_active = true

  UNION ALL

  SELECT od.id, od.parent_id, od.head_user_id, a.depth + 1
  FROM   org_departments od
  JOIN   ancestor a ON od.id = a.parent_id
  WHERE  od.is_active = true AND a.depth < 10
)
SELECT head_user_id
FROM   ancestor
WHERE  head_user_id IS NOT NULL
ORDER  BY depth
LIMIT  1;
```

Bu CTE `getApprovalChain` (mavjud, `org-queries.repo.ts:166`) bilan bir xil pattern.

---

## 3. FAYL IZOLYATSIYASI MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil.**

| # | Fayl | Amal | Holat |
|---|------|------|-------|
| 1 | `apps/api/src/shared/db/migrations/org-manager-id-backfill-2026-06-19.sql` | YANGI — `org_functions.manager_id` va `employees.manager_id` backfill SQL (GATED + DATA-GATED) | Yangi fayl |
| 2 | `apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts` | Yangi metod: `deriveManagerForNode(nodeId)` qo'shish | Mavjud fayl, qo'shimcha |
| 3 | `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts` | Yangi metod: `backfillManagerIds()` qo'shish | Mavjud fayl, qo'shimcha |
| 4 | `apps/api/src/modules/org-structure/org-structure.repository.ts` | `deriveManagerForNode` + `backfillManagerIds` facade'ga qo'shish | Mavjud fayl, qo'shimcha |
| 5 | `apps/api/src/modules/org-structure/org-structure.service.ts` | `deriveManagerForNode(nodeId)` + `triggerManagerBackfill()` servis metodlari qo'shish | Mavjud fayl, qo'shimcha |
| 6 | `apps/api/src/modules/org-structure/org-structure.controller.ts` | `GET /org-structure/manager-chain/:nodeId` va `POST /org-structure/admin/backfill-manager-ids` endpointlari qo'shish | Mavjud fayl, qo'shimcha |

**OWNED-FILE CHEGARALARI:**
- `lib/db/src/schema/core-schema.ts` — tegilmaydi (P04 tomonidan o'zgartirilgan, bu paket faqat runtime read qiladi).
- `lib/db/src/schema/employees.ts` — tegilmaydi (`manager_id` ustuni allaqachon mavjud, line 38).
- Boshqa har qanday fayl — TAQIQ.

---

## 4. MIGRATION FAYL — GATED + DATA-GATED

**Fayl:** `apps/api/src/shared/db/migrations/org-manager-id-backfill-2026-06-19.sql`

```sql
-- ============================================================
-- P51 — org_functions.manager_id + employees.manager_id backfill
-- ============================================================
-- GATED: Bu faylni psql bilan ISHLATISH uchun IKKI darvoza kerak:
--   1. DDL DARVOZA (Q-35):
--      Egasi quyidagi izohni qo'shishi shart:
--      -- APPROVED: <egasi ismi> <sana>
--   2. DATA DARVOZA:
--      Barcha asosiy org_departments nodlariga head_user_id to'ldirilgan bo'lishi shart.
--      Tekshiruv so'rovi (egasi bajaradi):
--        SELECT COUNT(*) FROM org_departments WHERE is_active = true AND head_user_id IS NULL;
--      Natija 0 bo'lguncha bu migration ISHLATILMAYDI.
--      Hozirgi holat: 124 ta node head_user_id = NULL (2026-06-07).
--
-- APPROVED: <egasi ismi> <sana>     ← egasi bu satrni to'ldiradi
-- DATA_READY: <egasi ismi> <sana>   ← egasi head_user_id to'ldirilganda bu satrni qo'shadi
-- ============================================================

-- ⚠️ SAFETY CHECK: NULL node'lar soni 0 bo'lmasa — TO'XTAYDI
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM   org_departments
  WHERE  is_active = true AND head_user_id IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION
      'DATA DARVOZA BLOKIROVKA: % ta aktiv node head_user_id = NULL. '
      'Avval barcha rahbarlik ma''lumotlarini to''ldiring, so''ng qayta ishlating.',
      null_count;
  END IF;
END $$;

-- ============================================================
-- QISM A: org_functions.manager_id backfill
-- Har karta uchun: department'ning parent node'ining head_user_id
-- ============================================================
UPDATE org_functions f
SET    manager_id = (
  WITH RECURSIVE ancestor AS (
    SELECT od.id, od.parent_id, od.head_user_id, 1 AS depth
    FROM   org_departments od
    WHERE  od.id = f.department_id AND od.is_active = true

    UNION ALL

    SELECT od2.id, od2.parent_id, od2.head_user_id, a.depth + 1
    FROM   org_departments od2
    JOIN   ancestor a ON od2.id = a.parent_id
    WHERE  od2.is_active = true AND a.depth < 10
  )
  SELECT head_user_id
  FROM   ancestor
  WHERE  head_user_id IS NOT NULL
  ORDER  BY depth
  LIMIT  1
)
WHERE  f.is_active = true
  AND  (f.manager_id IS NULL OR f.manager_id = 0);

-- ============================================================
-- QISM B: employees.manager_id backfill
-- Xodimning primary kartasi orqali department → parent → head_user_id → employees.id
-- ⚠️ KANONIK JOIN: employee_cards (M:N, org-phase6 migration).
--    employee_functions JADVALI MAVJUD EMAS — u employee_cards deb ataladi.
--    Xato: JOIN employee_functions → runtime "relation does not exist".
--    To'g'ri: JOIN employee_cards ON ec.employee_id = e.id AND ec.is_primary = true.
--    (00-INTERVYU-MOSLIK.md §3 1-DARAJA runtime crash, P51 backfill fix)
-- ============================================================
UPDATE employees e
SET    manager_id = mgr.id
FROM (
  SELECT
    e2.id AS employee_id,
    mgr_emp.id AS manager_emp_id
  FROM   employees e2
  JOIN   employee_cards ec ON ec.employee_id = e2.id
                           AND ec.is_primary = true
                           AND ec.is_active = true
  JOIN   org_functions f  ON f.id = ec.card_id AND f.is_active = true
  JOIN   org_departments dept ON dept.id = f.department_id AND dept.is_active = true
  JOIN   LATERAL (
    -- rekursiv: eng yaqin to'lgan parent head_user_id
    WITH RECURSIVE anc AS (
      SELECT id, parent_id, head_user_id, 1 AS depth
      FROM   org_departments
      WHERE  id = dept.parent_id AND is_active = true
      UNION ALL
      SELECT od.id, od.parent_id, od.head_user_id, anc.depth + 1
      FROM   org_departments od
      JOIN   anc ON od.id = anc.parent_id
      WHERE  od.is_active = true AND anc.depth < 10
    )
    SELECT head_user_id
    FROM   anc
    WHERE  head_user_id IS NOT NULL
    ORDER  BY depth
    LIMIT  1
  ) mgr_chain ON true
  JOIN   employees mgr_emp ON mgr_emp.user_id = mgr_chain.head_user_id
  WHERE  e2.manager_id IS NULL
    AND  mgr_chain.head_user_id IS NOT NULL
) mgr
WHERE e.id = mgr.employee_id;

-- ============================================================
-- TEKSHIRUV (migration oxirida natija ko'rsatadi)
-- ============================================================
SELECT
  'org_functions.manager_id' AS "jadval",
  COUNT(*) FILTER (WHERE manager_id IS NOT NULL) AS "to'ldirildi",
  COUNT(*) FILTER (WHERE manager_id IS NULL)     AS "null_qoldi",
  COUNT(*)                                        AS "jami"
FROM org_functions WHERE is_active = true

UNION ALL

SELECT
  'employees.manager_id',
  COUNT(*) FILTER (WHERE manager_id IS NOT NULL),
  COUNT(*) FILTER (WHERE manager_id IS NULL),
  COUNT(*)
FROM employees;
```

---

## 5. DATA DARVOZASI — EGASI UCHUN TO'LDIRISH YO'RIQNOMASI

> **⚠️ MUHIM: Bu bo'lim FAQAT EGASI / HR tomonidan bajariladi. Agent bu ma'lumotni
> bilmaydi va BILMASLIGi kerak. Bu inson bilimi.**

### 5.1 Holat tekshiruvi (agent o'zi bajarishi mumkin — read-only)

```sql
-- head_user_id to'ldirilmagan nodlar ro'yxati (egaga ko'rsatiladi)
SELECT
  od.id,
  od.level,
  od.node_type,
  od.name,
  od.name_ru,
  parent.name AS parent_name,
  od.head_user_id
FROM   org_departments od
LEFT   JOIN org_departments parent ON parent.id = od.parent_id
WHERE  od.is_active = true
  AND  od.head_user_id IS NULL
ORDER  BY od.level, od.name;
```

Bu so'rovni bajarish va natijani egaga ko'rsatish agent vazifasi.

### 5.2 Egasi to'ldiradigan ma'lumot formati

Egasi quyidagi formatda har node uchun rahbar userId'ni taqdim etadi:

```
Node ID | Node nomi           | Rahbar ismi       | users.id
--------|---------------------|-------------------|----------
   5    | Ishlab Chiqarish     | Aliyev Jasur      | 42
  12    | Sifat Nazorati       | Karimov Sarvar    | 67
  ...   | ...                  | ...               | ...
```

### 5.3 head_user_id yangilash SQL (egasi qabul qilgach, agent yozadi)

Egasi ma'lumot bergach — bu blok har node uchun alohida UPDATE:

```sql
-- APPROVED: <egasi ismi> <sana>
-- Node 5 (Ishlab Chiqarish) → rahbar: Aliyev Jasur (users.id = 42)
UPDATE org_departments SET head_user_id = 42 WHERE id = 5 AND is_active = true;

-- Node 12 (Sifat Nazorati) → rahbar: Karimov Sarvar (users.id = 67)
UPDATE org_departments SET head_user_id = 67 WHERE id = 12 AND is_active = true;

-- ... (har node uchun davom)
```

**Bu SQL ni agent YOZADI lekin ISHLATMAYDI — egasi tasdiqlagandan keyin.**

### 5.4 Tekshiruv: DATA darvozasi ochiq/yopiqmi?

```sql
-- 0 bo'lsa → DATA darvozasi ochiq (migration ishlatsa bo'ladi)
-- > 0 bo'lsa → hali to'ldirilmagan nodlar bor
SELECT COUNT(*) AS "null_head_user_id_count"
FROM   org_departments
WHERE  is_active = true AND head_user_id IS NULL;
```

---

## 6. YANGI REPO METODLARI

### 6.1 `org-queries.repo.ts` — `deriveManagerForNode(nodeId: number)`

Bu metod `getDirectManager` (line 190, mavjud) ning YANGILANGAN versiyasi emas —
mavjud metod saqlanadi (Q-46). Bu — yangi, aniq semantikali, vizyon-mos metod.

**Qo'shilishi kerak bo'lgan metod (fayl oxiriga, `existsById` dan keyin):**

```typescript
/**
 * Berilgan node'ning bevosita manageri kim ekanini aniqlaydi.
 * Algoritm: parent node'ning head_user_id si → agar NULL bo'lsa rekursiv yuqoriga.
 * Vizyon §2.3 Q1/Q4: manager_id = daraxtda bevosita yuqori node boshlig'i.
 */
async deriveManagerForNode(nodeId: number): Promise<Result<{
  managerUserId: number | null;
  managerName: string | null;
  resolvedAtNodeId: number | null;
  resolvedAtNodeName: string | null;
  depth: number;
}>> {
  return safeCall(async () => {
    const rows = await exec(sql`
      WITH RECURSIVE ancestor AS (
        SELECT
          od.id,
          od.name,
          od.parent_id,
          od.head_user_id,
          1 AS depth
        FROM   org_departments od
        WHERE  od.id = ${nodeId}
          AND  od.is_active = true

        UNION ALL

        SELECT
          od2.id,
          od2.name,
          od2.parent_id,
          od2.head_user_id,
          a.depth + 1
        FROM   org_departments od2
        JOIN   ancestor a ON od2.id = a.parent_id
        WHERE  od2.is_active = true
          AND  a.depth < 10
      )
      SELECT
        a.head_user_id                    AS "managerUserId",
        a.id                              AS "resolvedAtNodeId",
        a.name                            AS "resolvedAtNodeName",
        a.depth,
        TRIM(
          COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')
        )                                 AS "managerName"
      FROM   ancestor a
      LEFT   JOIN users u ON u.id = a.head_user_id AND u.is_active = true
      WHERE  a.head_user_id IS NOT NULL
        AND  a.id <> ${nodeId}
      ORDER  BY a.depth
      LIMIT  1
    `);

    if (!rows[0]) {
      return {
        managerUserId: null,
        managerName: null,
        resolvedAtNodeId: null,
        resolvedAtNodeName: null,
        depth: 0,
      };
    }

    const r = rows[0] as Record<string, unknown>;
    return {
      managerUserId:      r['managerUserId']      !== undefined ? Number(r['managerUserId'])      : null,
      managerName:        r['managerName']         !== undefined ? String(r['managerName'])         : null,
      resolvedAtNodeId:   r['resolvedAtNodeId']   !== undefined ? Number(r['resolvedAtNodeId'])   : null,
      resolvedAtNodeName: r['resolvedAtNodeName'] !== undefined ? String(r['resolvedAtNodeName']) : null,
      depth:              r['depth']               !== undefined ? Number(r['depth'])               : 0,
    };
  }, 'DB_ERROR');
}
```

### 6.2 `org-mutations.repo.ts` — `backfillManagerIds(dryRun: boolean)`

Bu metod migration'ni triggerlamaydi — faqat DATA darvozasi ochiqmi tekshirib,
ochiq bo'lsa `org_functions.manager_id` ni derive qiladi.

**Qo'shilishi kerak bo'lgan metod (fayl oxiriga `assignUser` dan keyin):**

```typescript
/**
 * org_functions.manager_id ni org daraxtidan rekursiv hisoblab to'ldiradi.
 * DATA darvozasi: head_user_id NULL bo'lgan nodlar soni 0 bo'lishi shart.
 * dryRun=true bo'lsa — faqat tekshiradi, yozmaydi.
 * Vizyon §2.3: manager derivatsiyasi DATA darvozasidan keyin.
 */
async backfillManagerIds(dryRun = false): Promise<Result<{
  nullHeadCount: number;
  dataGateOpen: boolean;
  updatedFunctions: number;
  updatedEmployees: number;
  message: string;
}>> {
  return safeCall(async () => {
    // 1. DATA darvozasini tekshir
    const gateRows = await exec(sql`
      SELECT COUNT(*)::int AS null_head_count
      FROM   org_departments
      WHERE  is_active = true AND head_user_id IS NULL
    `);
    const nullHeadCount = Number((gateRows[0] as Record<string, unknown>)?.['null_head_count'] ?? 999);
    const dataGateOpen  = nullHeadCount === 0;

    if (!dataGateOpen) {
      return {
        nullHeadCount,
        dataGateOpen: false,
        updatedFunctions: 0,
        updatedEmployees: 0,
        message: `DATA DARVOZA YOPIQ: ${nullHeadCount} ta aktiv node head_user_id = NULL. ` +
                 `Avval barcha rahbarlik ma'lumotlarini to'ldiring.`,
      };
    }

    if (dryRun) {
      // Qancha qator yangilanishi haqida preview
      const previewFn = await exec(sql`
        SELECT COUNT(*)::int AS cnt
        FROM   org_functions f
        WHERE  f.is_active = true AND (f.manager_id IS NULL OR f.manager_id = 0)
      `);
      const previewEmp = await exec(sql`
        SELECT COUNT(*)::int AS cnt
        FROM   employees
        WHERE  manager_id IS NULL
      `);
      return {
        nullHeadCount: 0,
        dataGateOpen: true,
        updatedFunctions: Number((previewFn[0] as Record<string, unknown>)?.['cnt'] ?? 0),
        updatedEmployees:  Number((previewEmp[0] as Record<string, unknown>)?.['cnt'] ?? 0),
        message: 'DRY RUN: haqiqiy yozish yo\'q. dryRun=false bilan qayta chaqiring.',
      };
    }

    // 2. org_functions.manager_id backfill
    const fnResult = await exec(sql`
      UPDATE org_functions f
      SET    manager_id = (
        WITH RECURSIVE ancestor AS (
          SELECT od.id, od.parent_id, od.head_user_id, 1 AS depth
          FROM   org_departments od
          WHERE  od.id = f.department_id AND od.is_active = true
          UNION ALL
          SELECT od2.id, od2.parent_id, od2.head_user_id, a.depth + 1
          FROM   org_departments od2
          JOIN   ancestor a ON od2.id = a.parent_id
          WHERE  od2.is_active = true AND a.depth < 10
        )
        SELECT head_user_id
        FROM   ancestor
        WHERE  head_user_id IS NOT NULL
        ORDER  BY depth
        LIMIT  1
      )
      WHERE  f.is_active = true
        AND  (f.manager_id IS NULL OR f.manager_id = 0)
      RETURNING f.id
    `);
    const updatedFunctions = Array.isArray(fnResult) ? fnResult.length : 0;

    // 3. employees.manager_id backfill (primary karta orqali)
    // ⚠️ KANONIK JOIN: employee_cards (M:N, org-phase6 migration).
    //    employee_functions JADVALI MAVJUD EMAS — kanonik nom = employee_cards.
    //    (00-INTERVYU-MOSLIK.md §3 1-DARAJA runtime fix)
    const empResult = await exec(sql`
      UPDATE employees e
      SET    manager_id = mgr_emp.id
      FROM   employee_cards    ec
      JOIN   org_functions      f    ON f.id = ec.card_id AND f.is_active = true
      JOIN   org_departments    dept ON dept.id = f.department_id AND dept.is_active = true
      JOIN   org_departments    par  ON par.id = dept.parent_id  AND par.is_active = true
      JOIN   employees          mgr_emp ON mgr_emp.user_id = par.head_user_id
      WHERE  ec.employee_id = e.id
        AND  ec.is_primary = true
        AND  ec.is_active = true
        AND  e.manager_id IS NULL
        AND  par.head_user_id IS NOT NULL
      RETURNING e.id
    `);
    const updatedEmployees = Array.isArray(empResult) ? empResult.length : 0;

    return {
      nullHeadCount: 0,
      dataGateOpen: true,
      updatedFunctions,
      updatedEmployees,
      message: `Backfill yakunlandi: org_functions=${updatedFunctions} ta yangilandi, ` +
               `employees=${updatedEmployees} ta yangilandi.`,
    };
  }, 'DB_ERROR');
}
```

---

## 7. FACADE VA SERVICE

### 7.1 `org-structure.repository.ts` — facade yangilash

Mavjud `getDirectManager` (line 28) saqlanib qoladi (Q-46).
Quyidagi 2 qator `// ─── Mutations ───` blokidan keyin qo'shiladi:

```typescript
// Yangi: P51
deriveManagerForNode = (nodeId: number) => this.queries.deriveManagerForNode(nodeId);
backfillManagerIds   = (dryRun: boolean) => this.mutations.backfillManagerIds(dryRun);
```

### 7.2 `org-structure.service.ts` — 2 ta yangi metod

Mavjud `getDirectManager` (line 186) metodidan KEYIN qo'shiladi:

```typescript
/**
 * Berilgan node uchun bevosita managerni aniqlaydi (derivatsiya orqali).
 * Vizyon §2.3 Q1/Q4: daraxtda bevosita yuqori node boshlig'i.
 */
async deriveManagerForNode(nodeId: number) {
  return safeCall(async () => {
    const r = await this.repo.deriveManagerForNode(nodeId);
    if (!r.ok) return Err(r.error.message);
    return { derivedManager: r.data };
  });
}

/**
 * Admin operatsiya: barcha org_functions va employees.manager_id ni
 * org daraxtidan rekursiv hisoblaydi.
 * DATA DARVOZA: head_user_id NULL bo'lgan nodlar soni > 0 bo'lsa — bajarilmaydi.
 */
async triggerManagerBackfill(dryRun: boolean) {
  return safeCall(async () => {
    const r = await this.repo.backfillManagerIds(dryRun);
    if (!r.ok) return Err(r.error.message);
    this.logger.log(
      `manager backfill: dataGateOpen=${r.data.dataGateOpen}, ` +
      `functions=${r.data.updatedFunctions}, employees=${r.data.updatedEmployees}`,
    );
    return r.data;
  });
}
```

---

## 8. CONTROLLER — 2 TA YANGI ENDPOINT

### 8.1 Endpoint spesifikatsiyasi

| Method | Path | Guard | Rol | Maqsad |
|--------|------|-------|-----|--------|
| `GET` | `/org-structure/manager-chain/:nodeId` | JwtAuthGuard | barcha autentifikatsiya qilinganlar | Node'ning derive qilingan manageri |
| `POST` | `/org-structure/admin/backfill-manager-ids` | JwtAuthGuard + `@Roles('super_admin','hr')` | faqat admin/HR | Barcha manager_id ni qayta hisoblash |

### 8.2 `GET /org-structure/manager-chain/:nodeId`

Mavjud `GET /org-structure/manager/:nodeId` (line nomi: `getDirectManager`) dan
FARQLI — u `COALESCE(parent.head_user_id, self.head_user_id)` dan foydalanar edi
(noto'g'ri, vizyon § 2.3 RETRACTED model). Bu yangi endpoint faqat parent chain
bo'yicha ishlaydi.

Controller'ga qo'shiladi (mavjud `getDirectManager` handler SAQLANADI, Q-46):

```typescript
@Get('manager-chain/:nodeId')
@ApiOperation({ summary: 'Node uchun derive qilingan manager (parent chain)' })
@ApiResponse({ status: 200, description: 'Manager ma\'lumoti' })
async getDerivedManager(
  @Param('nodeId', ParseIntPipe) nodeId: number,
) {
  const r = await this.service.deriveManagerForNode(nodeId);
  if (!r.ok) throw new InternalServerErrorException(r.error.message);
  return r.data;
}
```

### 8.3 `POST /org-structure/admin/backfill-manager-ids`

Zod schema va endpoint:

```typescript
const BackfillManagerSchema = z.object({
  dryRun: z.boolean().default(true),
}).strict();

@Post('admin/backfill-manager-ids')
@Roles('super_admin', 'hr')
@ApiOperation({ summary: 'Barcha manager_id ni org daraxtidan qayta hisoblash (ADMIN)' })
@ApiResponse({ status: 200, description: 'Backfill natijasi' })
async backfillManagerIds(
  @Body() body: unknown,
) {
  const dto   = BackfillManagerSchema.parse(body);
  const r     = await this.service.triggerManagerBackfill(dto.dryRun);
  if (!r.ok) throw new InternalServerErrorException(r.error.message);
  return r.data;
}
```

**Xavfsizlik eslatmasi:** `POST /org-structure/admin/*` path segmenti admin operatsiyani
aniqroq belgilaydi. `@Roles('super_admin', 'hr')` — faqat shu rollar kirishi mumkin.

---

## 9. SELF-VERIFY QO'LLANMASI — QABUL MEZONI

Har bosqichdan keyin agent quyidagi tekshiruvlarni bajaradi.

### 9.1 TypeScript tekshiruvi

```bash
# Backend TypeScript
cd Uzbek-Language-Module
pnpm --filter @europrint/api run typecheck
# Natija: 0 xato bo'lishi shart
```

### 9.2 Yangi endpointlar ishlayaptimi?

```bash
# Backend ishga tushirilgan bo'lishi kerak (port 3030)

# 1) GET /org-structure/manager-chain/:nodeId
curl -s -X GET http://localhost:3030/api/org-structure/manager-chain/5 \
  -H "Authorization: Bearer <token>" | jq .

# Kutilgan: { "derivedManager": { "managerUserId": ... , "depth": ... } }
# head_user_id NULL bo'lsa: { "derivedManager": { "managerUserId": null, ... } }

# 2) POST /org-structure/admin/backfill-manager-ids (dry run)
curl -s -X POST http://localhost:3030/api/org-structure/admin/backfill-manager-ids \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' | jq .

# Kutilgan: { "dataGateOpen": false, "nullHeadCount": 124, "message": "DATA DARVOZA YOPIQ: ..." }
# (hozir 124 ta NULL node bor — DATA darvozasi yopiq, bu TO'G'RI holat)
```

### 9.3 DATA darvozasi to'g'ri ishlaydimi?

```sql
-- To'g'ridan DB ga so'rov
SELECT COUNT(*) AS null_head_count
FROM   org_departments
WHERE  is_active = true AND head_user_id IS NULL;
-- Natija hozir: ~124 (joriy holat)
-- Migration chaqirilsa PL/pgSQL blokirovka qilishi kerak
```

### 9.4 Drizzle schema tekshiruvi

```bash
# lib/db build (schema import)
pnpm --filter @europrint/db run build
# 0 xato
```

### 9.5 Migration fayl holati

```bash
# GATED yorlig'i bor bo'lishi shart
grep -n "GATED\|APPROVED\|DATA_READY" \
  apps/api/src/shared/db/migrations/org-manager-id-backfill-2026-06-19.sql
# Natija: ikkala yorliq mavjud, APPROVED bo'sh (egasi to'ldiradi)
```

### 9.6 Qabul mezoni jadvali

| # | Tekshiruv | Kutilgan natija |
|---|-----------|-----------------|
| 1 | `tsc` BE | 0 xato |
| 2 | `GET /manager-chain/:nodeId` (node=1) | 200, JSON qaytaradi |
| 3 | `POST /admin/backfill-manager-ids` `{dryRun:true}` | `dataGateOpen: false` (yopiq) |
| 4 | Migration fayl `-- GATED` yorlig'i | grep topadi |
| 5 | Migration fayl `-- APPROVED` bo'sh | grep topadi (egasi to'ldirmagan) |
| 6 | Migration HECH QACHON psql'ga berilmaydi | Agent bu buyruqni bermaydi |

---

## 10. EDGE HOLATLAR VA QOIDALAR

### 10.1 Root node (Owner darajasi)

`parent_id IS NULL` bo'lgan node — bu top-level (Owner). Uning `manager_id`:
- `org_functions.manager_id` = NULL (hech kimga hisobot bermaydi)
- `employees.manager_id` = NULL (Owner — zanjir tepasi)

Bu to'g'ri va kutilgan holat. NULL = "eng yuqori daraja".

### 10.2 Intermediate NULL head_user_id

Ba'zi departmentlarda `head_user_id NULL` bo'lishi mumkin (rahbar tayinlanmagan).
Rekursiv CTE bu holatda yuqori ko'tariladi — birinchi to'lgan `head_user_id` ni qaytaradi.
Natijada `resolvedAtNodeId` != bevosita parent ID bo'lishi mumkin — bu to'g'ri.

### 10.3 Tsiklik daraxt himoyasi

Rekursiv CTE `depth < 10` chegarasi bilan cheklangan. Agar daraxtda tsiklik bog'lanish
bo'lsa (bu org-mutations.repo.ts `move()` metodida oldini olgan, line 125-161),
CTE 10 iteratsiyadan keyin to'xtaydi va NULL qaytaradi.

### 10.4 Backfill idempotentligi

Migration `WHERE manager_id IS NULL OR manager_id = 0` sharti bilan — faqat NULL
qiymatlarga teg. Allaqachon to'ldirilgan qatorlarga tegmaydi. Bir necha marta
ishlatsa ham xavfsiz.

### 10.5 Yangi node yaratilganda manager avtomatik o'rnatilishi

Bu paket FAQAT BACKFILL infrasini quradi. Kelajakda `create()` metodida
`deriveManagerForNode(newNodeId)` chaqirilib, yaratilgan node darhol `manager_id`
olishi mumkin. Bu kelajak vazifasi (P52 yoki keyingi paketda) — bu paketga kirmaydi
(scope creep taqiq, Q-qoidalar "faqat so'ralgan vazifa").

### 10.6 `employees.manager_id` vs `org_functions.manager_id` farqi

- `org_functions.manager_id`: INTEGER — `users.id` saqlaydi (kimning rahbar ekanini,
  users jadvalidan). Bu vizyon § 2.3 dan keladi.
- `employees.manager_id`: INTEGER — `employees.id` saqlaydi (schema `employees.ts`
  line 38: `references(() => employees.id)`). Backfill bu farqni hisobga oladi:
  `head_user_id` → `employees` jadvalida shu `user_id` ga mos `employees.id` topiladi.

---

## 11. COMMIT TARTIBI

Har bosqich alohida commit. `-A` TAQIQ.

```bash
# BOSQICH 1: Migration fayl (GATED — faqat fayl yaratish)
git add apps/api/src/shared/db/migrations/org-manager-id-backfill-2026-06-19.sql
git commit -m "feat(org): P51 manager-id backfill migration (GATED - awaiting owner data)"

# BOSQICH 2: Repo metodlari
git add apps/api/src/modules/org-structure/org-structure/org-queries.repo.ts
git add apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts
git commit -m "feat(org): P51 deriveManagerForNode + backfillManagerIds repo methods"

# BOSQICH 3: Facade + Service
git add apps/api/src/modules/org-structure/org-structure.repository.ts
git add apps/api/src/modules/org-structure/org-structure.service.ts
git commit -m "feat(org): P51 manager derivation service methods"

# BOSQICH 4: Controller
git add apps/api/src/modules/org-structure/org-structure.controller.ts
git commit -m "feat(org): P51 GET manager-chain + POST backfill-manager-ids endpoints"
```

---

## 12. HOLAT HISOBOTI SHABLONI

Har bosqich oxirida egaga:

```
P51 HOLAT HISOBOTI — <sana>

BOSQICH 1 (Migration):
  ✅ org-manager-id-backfill-2026-06-19.sql yaratildi
  ⚠️ GATED (egasi APPROVED stamp kerak)
  ⚠️ DATA DARVOZA: 124 ta node head_user_id = NULL (joriy holat)

BOSQICH 2 (Repo):
  ✅ deriveManagerForNode() — org-queries.repo.ts ga qo'shildi
  ✅ backfillManagerIds() — org-mutations.repo.ts ga qo'shildi
  ✅ tsc: 0 xato

BOSQICH 3 (Service):
  ✅ deriveManagerForNode() + triggerManagerBackfill() service'ga qo'shildi
  ✅ tsc: 0 xato

BOSQICH 4 (Controller + Self-verify):
  ✅ GET /manager-chain/:nodeId → 200 (test nodeId=1)
  ✅ POST /admin/backfill-manager-ids dryRun=true → dataGateOpen: false (to'g'ri)
  ✅ tsc: 0 xato

KEYINGI QADAM (egasi):
  1. head_user_id to'ldirish: 124 ta nodga rahbar tayinlash
     (yuqoridagi §5.1 SQL bilan ro'yxat oling)
  2. Barcha tayinlash tugagach: DATA darvozasini tekshiring:
     SELECT COUNT(*) FROM org_departments WHERE is_active=true AND head_user_id IS NULL;
  3. Natija 0 bo'lsa:
     a) Migration fayliga APPROVED stamp qo'ying
     b) DATA_READY stamp qo'ying
     c) psql buyrug'ini bering
     d) POST /admin/backfill-manager-ids {"dryRun": false} chaqiring
```

---

## XULOSA VA ASOSIY QARORLAR

| Qaror | Ta'rif |
|-------|--------|
| **manager_id = parent chain HEAD** | "dept head" emas, daraxtdagi bevosita yuqori node boshlig'i. Vizyon §2.3 Q1/Q4. |
| **Ikki darvoza** | DDL darvozasi (Q-35) + DATA darvozasi (head_user_id 0 bo'lishi shart) — ikkisi ham ochiq bo'lmasa migration TAQIQ. |
| **Mavjud `getDirectManager` saqlanadi** | Q-46: ishlab turgan kod o'chirilmaydi. Yangi `deriveManagerForNode` parallel yashaydi. |
| **Backfill idempotent** | `WHERE manager_id IS NULL OR manager_id = 0` — xavfsiz ko'p marta chaqirish. |
| **employees.manager_id tipi** | `employees.id` (INT) saqlaydi — `users.id` emas. `head_user_id` → `employees` table lookup kerak. |
| **Kelajak** | Node yaratilganda avtomatik `manager_id` = P52/keyingi paket. Bu paket faqat backfill infra. |
