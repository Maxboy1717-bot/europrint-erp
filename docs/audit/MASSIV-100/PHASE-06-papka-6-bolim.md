# PHASE 06 — PAPKA (6 bo'lim) — BAJARUVCHI DIREKTIVA (Muslimbek)

> **MASSIV-100 / FAZA 06**. Manba: `00-MASTER-REJA.md` §3 FAZA 6 + `ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md` (papka — 22%) + `decisions/01-org-kartalar.md` (EP-ORG-007/057-059/089/095/104/105/109/117/125/126/127/138/140/143).
> **Bog'liqlik:** Bu faza FAZA 0 (kanonik karta-jadval) tugaganidan KEYIN ishga tushadi — `card_folders.card_id` FK `org_departments`ga qaratilgan bo'lishi shart. AGAR FAZA 0 hali bajarilmagan bo'lsa, §3-Bosqich 0 (FK re-point) shu direktiva ichida bajariladi (idempotent, xavfsiz).
> **Egasi qarori (Q2):** "100%" = MEXANIZM 100%. Struktura + endpoint + UI + gate + dizayn TO'G'RI ishlaydi; papka-kontent (matn) = egasi-data, productionda 0 dan to'ladi. **FABRIKATSIYA TAQIQ.**
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, noaniqliksiz.

---

## 0. ROL VA MANDAT

- **Rol:** 🟢 Bajaruvchi (Muslimbek). Sen FAQAT shu direktivada AYNAN yozilgan vazifani bajarasan.
- **Bir vaqtda bitta bajaruvchi.** Boshqa worktree (`agent1-wt`, `.claude/worktrees/green-lie-group1`) bilan bir faylga TEGMA.
- **Sessiya boshida (Q-24):** `CLAUDE.md` o'qi → `git status` / `git log -5` / `git branch` → lokal health (`:3030` backend / `:20806` yoki `:5173` frontend) → concurrency tekshir.
- **Vizyon qarorlarini O'ZING qabul qilMA (Q-27).** Bu direktivada yo'q narsa = egasidan so'ra yoki `docs/`ga "keyin" deb belgila (Q-33). Lekin direktivada bor narsani to'liq, oxirigacha qil.

---

## 1. KONTEKST + MAQSAD

### 1.1 Vizyon (nima uchun bu faza bor)
EP-ORG-007 / Q-07: **Har karta (= lavozim-o'rindiq) 6 majburiy bo'limli "Лавозим папкаси"ga ega:**

| # | Bo'lim (uz) | Ma'no | EP-ORG manba |
|---|---|---|---|
| 1 | **vazifa** | Lavozim vazifasining ta'rifi (nima qiladi) | EP-ORG-127 (vazifa ta'rifi) |
| 2 | **javobgarlik** | Javobgarlik bandlari (energiya/sir/moddiy) | EP-ORG-109 |
| 3 | **gsd** | ЦКП / GSD — to'g'ri ishning natijasi (yakuniy mahsulot) | EP-ORG-014 |
| 4 | **reglament** | Reglament / orgpolitika (qoidalar) | EP-ORG-104/117 |
| 5 | **jarayon** | Amaliy qadamlar (ish yo'riqnomasi) | EP-ORG-127 (amaliy qadamlar) |
| 6 | **talim** | Ta'lim / darslik (kartaga biriktirilgan) | EP-ORG-028/088 |

Har bo'lim to'ldirilgan/bo'sh → **to'liqlik% = (to'ldirilgan / 6) × 100** (EP-ORG-007). To'liqlik% faqat ko'rsatkich — **oylikni bloklamaydi** (Q6: "oylikка ta'sir qilmaydi"). 12-bo'lim kengaytirish (EP-ORG-095) bu fazada EMAS — egasi keyin qaror qiladi.

Bu fazada qo'shimcha vizyon-talablar (decisions/01-dan, BARCHA-ga ko'ra A-default tavsiya, lekin egasi-data kutadi):
- **EP-ORG-057/058/059/143 — Karta shabloni:** lavozim-turi tanlansa standart maydonlar avto-to'ladi. **Bu fazada MEXANIZM (card_templates jadval + apply endpoint) quriladi; boshlang'ich 10-15 shablon SEED = egasi-data.**
- **EP-ORG-105/126 — Kontrolniy list / 2-imzo:** har bo'lim "tasdiqladim" + sana + imzo; hammasi tasdiqlanmaguncha "tayyor emas". **Mexanizm quriladi (card_folder_section_signatures jadval + sign endpoint).**
- **EP-ORG-125/Q82/Q243 — Versiyalash:** bo'lim o'zgarsa eski versiya saqlanadi (immutable snapshot). **card_folder_versions jadval + on-upsert snapshot.**
- **EP-ORG-138/Q14/Q37 — Per-karta PDF:** "Должностная инструкция" (6 bo'lim + imzo joylari). **Per-karta PDF endpoint quriladi (pdf-lib, mavjud org-export pattern).**

### 1.2 Joriy holat (qisqacha — to'liq §3-da)
- **card_folders jadval BOR** (6 ustun + completeness%), `CardFolderController` REGISTERED (`org-structure.module.ts:30`), endpoint `PUT/GET /api/org-structure/cards/:cardId/folder`.
- **AMMO:** `card_folders.card_id` FK → **`org_functions`** (de-routed eski karta-dunyo). FE `CardFolderDialog.tsx` ORPHAN — `OrgNodeDetail.tsx:136` `FolderTab` (virtual document/video/test → `position_folders`) ishlatadi, 6-bo'lim papkasini EMAS.
- **YO'Q:** shablon, 2-imzo, versiyalash, per-karta PDF, glossariy-bo'lim, javobgarlik standart-bandlar.

### 1.3 Bu fazaning MAQSADI (bitta jumlada)
6-bo'lim papka MEXANIZMINI **kanonik `org_departments` kartaga ULA** (de-routed holatdan jonli `OrgNodeDetail` "Папка" tabiga olib chiq), **shablon + 2-imzo + versiyalash + per-karta PDF** strukturasini qur; barchasi Result/Zod/Drizzle + EP-dizayn + DB-proof bilan; kontent = egasi-data.

---

## 2. QOIDALAR-BLOKI (HAR BOSQICHDA majburiy — buzilsa ish RAD)

> Bu blok `CLAUDE.md` + `00-MASTER-REJA.md §2`dan ko'chirilgan. Har bosqich oxirida shu blokka qaytib tekshir.

### 2.1 Kod uslubi
- **Result<T>** (`@common/result`: `Ok`/`Err`/`safeCall`) — `throw new Error()` / `return null` TAQIQ (Qoida 1). Controller `unwrapOrThrow(...)` ishlatadi.
- **Zod** validatsiya — har `@Body()`/`@Query()` Zod `.parse()` (Qoida 3). `class-validator` TAQIQ.
- **Drizzle ORM** — oddiy CRUD Drizzle; raw SQL faqat murakkab (izoh bilan, Qoida 4). `card-folder.repository.ts` allaqachon `sql\`...\`` template ishlatadi (parametrli, SQL-inj xavfsiz) — shu uslubni saqla.
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13). Yangi fayl ochsang `*Dialog.tsx`/`*Sections.tsx`/`*Types.ts` konvensiya.
- **Konstant** = `business.constants.ts` (Qoida 12). Magic number TAQIQ (masalan `6` bo'lim soni → `CARD_FOLDER_SECTION_COUNT`).

### 2.2 Xavfsizlik / guard
- Har controller `@UseGuards(JwtAuthGuard)` + `@Roles(...)` (Qoida 8). `CardFolderController` allaqachon `@Roles('admin','manager','hr_manager','director','super_admin')` — yangi endpoint shu darajada bo'lsin (imzo = `hr_manager`/`director`).
- `process.env` TAQIQ → `ConfigService` (Qoida 7).
- 404 to'g'ri (Qoida 11): `@Param('id')` ishlatgan metod natija yo'q bo'lsa `NotFoundException`.

### 2.3 Regress-himoya (Q-39/Q-46) 🔴
- **Ishlab turgan kod O'CHMAYDI.** `FolderTab.tsx` (virtual document/video/test → `position_folders`) JONLI ishlaydi (FolderTab.tsx:46-69, position-folder.repository.ts:39-67). Uni **O'CHIRMA** — 6-bo'lim papkasini uning YONIGA qo'shasan (pastda §5 dizayn).
- **Buzuq/o'lik/dublikat TO'LIQ o'chiriladi.** `CardFolderDialog.tsx` (`components/hr/org/CardFolderDialog.tsx`) — ORPHAN (hech qaysi sahifa import qilmaydi, §3.2-da isbotlanadi). Uni jonli `OrgNodeDetail`ga ULA (qayta foydalanish) YOKI logikasini yangi `orgnode/FolderSectionsTab.tsx`ga ko'chir va orphan'ni O'CHIR — chala qoldirma.
- O'chirishdan oldin: (a) ishlamasligini/orphanligini Q-29 grep bilan tasdiqla, (b) import-yo'qligini tekshir.

### 2.4 Fabrikatsiya TAQIQ (Q-40) 🔴
- Papka-kontent (vazifa/javobgarlik matni), shablon-kontent, imzo-data = **egasi-data**. Soxta matn YOZMA.
- Bo'sh papka → completeness 0% ko'rsatiladi (real). "Namuna" yoki "Lorem" matn TAQIQ.
- DB-proof rollback-tx bilan: kirit→oqdi→ko'rindi→ROLLBACK (data saqlanmaydi).

### 2.5 Dizayn (Q3, Qoida 21/41/42/43)
- EP token (`var(--ep-*)`) + shablon + komponent (`components/ep`, `components/ui`). **Xom rang / inline `style={{color:'#...'}}` TAQIQ** (FolderTab.tsx:115-117 hex `#1d4ed8` bor — yangi kodda ishlatMA, token ishlat). `check-design-tokens.mjs` BLOK qiladi.
- **Tab ≤2 daraja** (Qoida 42). "Папка" tab → ichida ko'pi bilan 1 daraja ichki tab (Virtual / 6-bo'lim). 3-daraja TAQIQ.
- **Forma REAL saqlaydi (Q-43):** FE mutation (PUT) → BE endpoint → real UPSERT → DB → qayta-yuklashda ko'rinadi. F1 (loading) + F2 (onError toast) majburiy.

### 2.6 Migration (Q-35)
- `apps/api/src/shared/db/invariants/migrations-drift.ts` (`DRIFT_MIGRATIONS` array) ga idempotent entry qo'sh: `ALTER TABLE IF EXISTS` / `CREATE TABLE IF NOT EXISTS`.
- **`CREATE TABLE` / `DROP` faqat `APPROVED:` izoh bilan.** Bu fazada APPROVED jadvallar: `card_folder_versions`, `card_folder_section_signatures`, `card_templates`, `card_template_sections` (§4-da SQL + APPROVED izoh).
- FK re-point (`card_folders.card_id` → `org_departments`) — APPROVED (Master-reja §1.1 kanonik qaror).

### 2.7 Commit (Qoida 23 / GIT_QOIDALARI)
- **Faqat o'z fayl:** `git add <aniq-fayl>` — `git add -A` / `git add .` HECH QACHON.
- `git commit --no-verify` (pre-commit hook'lar diff-aware, lekin design-token blokini hurmat qil).
- Commit message oxiri:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```
- Har bosqich = alohida commit (Q-38 holat hisoboti bilan).

### 2.8 Atama
- Muloqotda doim **"karta"** (node/tugun EMAS). Kod ichida `card`/`org_departments`.

---

## 3. JORIY HOLAT (fayl:satr + DB-fakt — JONLI TASDIQLANGAN, taxmin YO'Q)

### 3.1 Backend — card_folders 6-bo'lim (qurilgan, lekin de-routed)

**`apps/api/src/modules/org-structure/card-folder.repository.ts`** (55 qator, to'liq o'qildi):
- `interface FolderInput` (qator 14-21): `vazifa/javobgarlik/gsd/reglament/jarayon/talim` (har biri `string|null`).
- `getByCard(cardId)` (qator 29-32): `SELECT * FROM card_folders WHERE card_id=${cardId} AND is_active=true` → `Result<Row|null>`.
- `upsert(cardId, dto)` (qator 34-54): `INSERT ... ON CONFLICT (card_id) DO UPDATE` → `RETURNING *`. **Bu eski qiymatni o'rniga yozadi (versiyalash YO'Q — EP-ORG-125 bo'shlig'i).**

**`apps/api/src/modules/org-structure/card-folder.service.ts`** (66 qator, to'liq o'qildi):
- `SECTIONS` const (qator 12): `['vazifa','javobgarlik','gsd','reglament','jarayon','talim']` — 6 bo'lim (magic, lekin const).
- `toView()` (qator 27-48): `filled = SECTIONS.filter(non-empty).length`; `completeness = Math.round(filled/6*100)` (qator 46). **Saqlanmaydi (anti-staleness, to'g'ri).**
- `getFolder` / `upsertFolder` (qator 55-65) → `Result<FolderView>`.

**`apps/api/src/modules/org-structure/card-folder.controller.ts`** (57 qator, to'liq o'qildi):
- Prefix: `@Controller('org-structure/cards/:cardId/folder')` (qator 36).
- `@Roles('admin','manager','hr_manager','director','super_admin')` (qator 30), `@UseGuards(JwtAuthGuard)` (qator 33), `@UseInterceptors(AuditInterceptor)` (qator 32).
- `FolderSchema` Zod (qator 21-28): har bo'lim `z.string().max(20000).nullable().optional()`, `.strict()`.
- `GET /` (qator 43-46) → `getFolder`. `PUT /` (qator 51-56) → `upsertFolder`.

**`apps/api/src/modules/org-structure/org-structure.module.ts`** (35 qator, to'liq o'qildi):
- `CardFolderController` REGISTERED (qator 30); `CardFolderService`/`CardFolderRepository` providers (qator 31); `CardFolderService` exported (qator 32). **Backend JONLI mapped (404 emas).**

### 3.2 Frontend — IKKI dunyo (jonli vs orphan)

**JONLI (Папка tab):** `artifacts/erp-dashboard/src/components/hr/orgnode/FolderTab.tsx` (263 qator, to'liq o'qildi):
- `OrgNodeDetail.tsx:136` `<TabsContent value="folder"><FolderTab nodeId={nodeId!} /></TabsContent>` — JONLI ulangan.
- `useQuery` (qator 46): `GET /api/org-structure/nodes/${nodeId}/folder` → **`position_folders`** (document/video/test virtual elementlar).
- `addFolderItemMutation` POST (qator 51-60), `removeFolderItemMutation` DELETE (qator 62-69) — REAL CRUD.
- **3 tip:** document/video/test (qator 111-118). **6-bo'lim papkasi YO'Q.**
- ⚠️ Inline hex rang (qator 115-117: `#1d4ed8`/`#7c3aed`/`#16a34a`) — Qoida 21 buzadi (yangi kodda ishlatMA).

**ORPHAN (de-routed):** `artifacts/erp-dashboard/src/components/hr/org/CardFolderDialog.tsx` (185 qator, to'liq o'qildi):
- 6-bo'lim editor (qator 34: `SECTION_KEYS`), `PUT /api/org-structure/cards/:id/folder` (qator 87) + `PATCH .../cards/:id` ЦКП (qator 91).
- Live completeness% Progress bar (qator 116), GLOSSARY tooltip (qator 37-40, 130-135).
- **ORPHAN:** `OrgNodeDetail.tsx` import qilmaydi (faqat `FolderTab`). Boshqa import bormi — §6.1-da grep bilan tasdiqlanadi.

**`position-folder.repository.ts`** (89 qator, to'liq o'qildi): `position_folders.node_id` → `orgDepartments` (qator 82 innerJoin) — **virtual papka KANONIK `org_departments`ga bog'langan** (to'g'ri).

### 3.3 DB-fakt (JONLI tasdiqlangan — `node _audit/q.cjs`)

```
card_folders ustunlar: id, card_id, vazifa, javobgarlik, gsd, reglament,
                       jarayon, talim, is_active, created_at, updated_at
card_folders qator soni: 2
card_folders FK: card_folders_card_id_fkey → org_functions(id)  ⚠️ DE-ROUTED
card_folders unique: card_folders_card_id_key (UNIQUE card_id)  ✅
card_folders id-mapping: card_id=67 (org_functions ✓ + org_departments ✓),
                         card_id=1 (org_functions ✓, org_departments ✗)
org_departments qator soni: 144
YO'Q jadvallar: card_folder_section_signatures=NULL, card_folder_versions=NULL,
                card_signatures=NULL, card_templates=NULL (to_regclass)
```

**Xulosa:** (1) FK noto'g'ri jadvalga (org_functions); kanonik = org_departments. (2) Versiya/imzo/shablon jadvallari YO'Q. (3) 6-bo'lim FE jonli sahifaga ulanmagan.

---

## 4. DB MIGRATION (APPROVED — Q-35)

> Hammasi `apps/api/src/shared/db/invariants/migrations-drift.ts` `DRIFT_MIGRATIONS` array ga qo'shiladi (boot'da idempotent ishlaydi). Tartib MUHIM: avval FK re-point, keyin yangi jadvallar.

### 4.1 Bosqich 0 — card_folders FK re-point (FAZA 0 ulashi)

> AGAR FAZA 0 buni allaqachon qilgan bo'lsa (`q.cjs` FK = org_departments), SKIP. Aks holda quyidagi entry qo'shiladi. Bu **APPROVED** (Master-reja §1.1: org_functions retire, FK → org_departments).

```ts
// PHASE-06 FAZA0-ulash: card_folders.card_id FK org_functions->org_departments
// APPROVED: 00-MASTER-REJA.md §1.1 (org_functions retire, kanonik karta=org_departments).
// Idempotent: avval mavjud FK'ni nomi bilan DROP (IF EXISTS), keyin org_departments'ga ADD.
{ name: 'card_folders FK drop org_functions', sql:
  `ALTER TABLE IF EXISTS card_folders DROP CONSTRAINT IF EXISTS card_folders_card_id_fkey` },
{ name: 'card_folders FK add org_departments', sql:
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name='card_folders_card_id_org_departments_fkey'
                      AND table_name='card_folders') THEN
       ALTER TABLE card_folders
         ADD CONSTRAINT card_folders_card_id_org_departments_fkey
         FOREIGN KEY (card_id) REFERENCES org_departments(id) ON DELETE CASCADE;
     END IF;
   END $$;` },
```

> ⚠️ **Data ehtiyot:** `card_id=1` jonli `org_departments`da YO'Q (q.cjs: in_depts=0). FK ADD bunda FAIL beradi. Yechim: FK qo'shishdan OLDIN orphan qatorni tozala (yoki re-map). `card_id=1` qatori test-data (2 qatordan biri, NULL kontent). APPROVED tozalash:
```ts
// PHASE-06: org_departments'da mavjud bo'lmagan card_folders qatorlarini tozalash (FK ADD'dan oldin).
// APPROVED: test-data (2 qatordan 1, kontent NULL); org_departments=kanonik.
{ name: 'card_folders prune orphan before FK', sql:
  `DELETE FROM card_folders cf WHERE NOT EXISTS (SELECT 1 FROM org_departments d WHERE d.id = cf.card_id)` },
```
> Tartib: prune → drop FK → add FK.

### 4.2 Bosqich A — card_folders kengaytirish ustunlar

```ts
// PHASE-06 EP-ORG-125 versiyalash + Q5 qayta-tasdiq + EP-ORG-105 "tayyor" holati.
{ name: 'card_folders.version_no ADD COLUMN', sql:
  `ALTER TABLE IF EXISTS card_folders ADD COLUMN IF NOT EXISTS version_no INTEGER NOT NULL DEFAULT 1` },
{ name: 'card_folders.reconfirm_days ADD COLUMN', sql:
  `ALTER TABLE IF EXISTS card_folders ADD COLUMN IF NOT EXISTS reconfirm_days INTEGER` },  // default NULL — egasi sozlaydi (Q5: default 7, lekin NULL=hardcode-taqiq, egasi-data)
{ name: 'card_folders.is_ready ADD COLUMN', sql:
  `ALTER TABLE IF EXISTS card_folders ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT false` },  // EP-ORG-105: hamma imzolansa true
{ name: 'card_folders.last_confirmed_at ADD COLUMN', sql:
  `ALTER TABLE IF EXISTS card_folders ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMPTZ` },
```

### 4.3 Bosqich B — card_folder_versions (APPROVED CREATE — EP-ORG-125)

```ts
// PHASE-06 EP-ORG-125/Q82/Q243: papka versiyalash — har upsert eski snapshot saqlaydi (immutable).
// APPROVED: 00-MASTER-REJA.md FAZA 6 "versiyalash"; egasi qarori Q2 (mexanizm).
{ name: 'CREATE card_folder_versions', sql:
  `CREATE TABLE IF NOT EXISTS card_folder_versions (
     id           SERIAL PRIMARY KEY,
     card_id      INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
     version_no   INTEGER NOT NULL,
     vazifa       TEXT, javobgarlik TEXT, gsd TEXT,
     reglament    TEXT, jarayon TEXT, talim TEXT,
     completeness INTEGER NOT NULL DEFAULT 0,
     changed_by   INTEGER,            -- users.id (kim o'zgartirdi)
     reason       TEXT,               -- EP-ORG-068: pul/razryad emas, lekin papkada ham foydali
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (card_id, version_no)
   )` },
{ name: 'card_folder_versions idx card', sql:
  `CREATE INDEX IF NOT EXISTS idx_card_folder_versions_card ON card_folder_versions(card_id)` },
```

### 4.4 Bosqich C — card_folder_section_signatures (APPROVED CREATE — EP-ORG-105/126)

```ts
// PHASE-06 EP-ORG-105/126: kontrolniy list — har bo'lim uchun "tasdiqladim"+sana+imzo (RD+tanishgan).
// APPROVED: 00-MASTER-REJA.md FAZA 6 "2-imzo"; egasi qarori Q2.
{ name: 'CREATE card_folder_section_signatures', sql:
  `CREATE TABLE IF NOT EXISTS card_folder_section_signatures (
     id          SERIAL PRIMARY KEY,
     card_id     INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
     section_key VARCHAR(20) NOT NULL,  -- vazifa|javobgarlik|gsd|reglament|jarayon|talim
     version_no  INTEGER NOT NULL DEFAULT 1,
     signer_id   INTEGER NOT NULL,      -- users.id
     signer_role VARCHAR(20) NOT NULL,  -- 'rd' (tasdiqlovchi) | 'acknowledged' (tanishgan)
     signed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (card_id, section_key, version_no, signer_id, signer_role)
   )` },
{ name: 'card_folder_section_signatures idx card', sql:
  `CREATE INDEX IF NOT EXISTS idx_cfss_card ON card_folder_section_signatures(card_id)` },
```

### 4.5 Bosqich D — card_templates + card_template_sections (APPROVED CREATE — EP-ORG-057/059/143)

```ts
// PHASE-06 EP-ORG-057/058/059/143: karta shabloni (lavozim-turi -> standart 6 bo'lim avto-to'ladi).
// APPROVED: 00-MASTER-REJA.md FAZA 9 "card_templates shablon" (papka-mazmuni shu fazada keladi);
// egasi qarori Q2 (mexanizm). Boshlang'ich 10-15 shablon SEED = EGASI-DATA (fabrikatsiya taqiq).
{ name: 'CREATE card_templates', sql:
  `CREATE TABLE IF NOT EXISTS card_templates (
     id           SERIAL PRIMARY KEY,
     code         VARCHAR(50) NOT NULL UNIQUE,  -- 'operator' | 'rahbar' | 'mutaxassis' | ...
     name         VARCHAR(200) NOT NULL,
     name_ru      VARCHAR(200),
     description  TEXT,
     is_active    BOOLEAN NOT NULL DEFAULT true,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )` },
{ name: 'CREATE card_template_sections', sql:
  `CREATE TABLE IF NOT EXISTS card_template_sections (
     id          SERIAL PRIMARY KEY,
     template_id INTEGER NOT NULL REFERENCES card_templates(id) ON DELETE CASCADE,
     section_key VARCHAR(20) NOT NULL,  -- 6 bo'limdan biri
     body        TEXT,                  -- standart matn (egasi/HR yozadi)
     UNIQUE (template_id, section_key)
   )` },
```

> ⚠️ `card_templates`/`card_template_sections` qatorlari (kontent) = **egasi-data**. Seed YOZMA — bo'sh jadval + apply-mexanizm. §9 Owner-DATA reestriga yoz.

---

## 5. BOSQICHMA-BOSQICH (har bosqich: fayl · OLDIN · KEYIN · sabab)

> Tartib bog'liqlik bo'yicha: Migration → Repo → Service → Controller → FE. Har bosqich oxirida `tsc` GREEN + commit.

### BOSQICH 1 — Migration (DB struktura)
**Fayl:** `apps/api/src/shared/db/invariants/migrations-drift.ts`
**OLDIN:** `DRIFT_MIGRATIONS` array faqat eski drift entry'lar (qator 22+).
**KEYIN:** Array oxiriga §4 (4.1→4.5) bloklarini qo'sh (tartib: prune→FK→ustunlar→versions→signatures→templates).
**Sabab:** Repo/service yangi ustun/jadvalni o'qishidan OLDIN DB tayyor bo'lishi shart; idempotent → boot'da xavfsiz.
**Verify:** Backend boot → `node _audit/q.cjs "SELECT to_regclass('public.card_folder_versions'), to_regclass('public.card_folder_section_signatures'), to_regclass('public.card_templates')"` → uchalasi NOT NULL; FK = org_departments.

### BOSQICH 2 — card-folder.repository.ts kengaytirish (versiyalash + completeness saqlash versions'da)
**Fayl:** `apps/api/src/modules/org-structure/card-folder.repository.ts`
**OLDIN (qator 34-54):** `upsert()` faqat `card_folders`ga `ON CONFLICT DO UPDATE`, eski qiymat o'chadi.
**KEYIN:** `upsert()`ni transaction qil — yangi version yozishdan oldin eski qatorni `card_folder_versions`ga snapshot:
```ts
async upsert(cardId: number, dto: FolderInput, changedBy: number | null, reason: string | null): Promise<Result<Row | null>> {
  return safeCall(async () => {
    return runInTx(async (tx) => {
      // 1. Mavjud qatorni snapshot (versiyalash, EP-ORG-125)
      const cur = (await tx.query(sql`SELECT * FROM card_folders WHERE card_id=${cardId}`)).rows[0];
      let nextVersion = 1;
      if (cur) {
        nextVersion = Number(cur.version_no ?? 1) + 1;
        await tx.query(sql`
          INSERT INTO card_folder_versions
            (card_id, version_no, vazifa, javobgarlik, gsd, reglament, jarayon, talim, completeness, changed_by, reason)
          VALUES (${cardId}, ${cur.version_no ?? 1}, ${cur.vazifa}, ${cur.javobgarlik}, ${cur.gsd},
                  ${cur.reglament}, ${cur.jarayon}, ${cur.talim}, ${computeCompleteness(cur)}, ${changedBy}, ${reason})
          ON CONFLICT (card_id, version_no) DO NOTHING`);
      }
      // 2. Upsert yangi qiymat + version_no inkrement + is_ready=false (qayta-imzo kerak)
      const r = await tx.query(sql`
        INSERT INTO card_folders
          (card_id, vazifa, javobgarlik, gsd, reglament, jarayon, talim, version_no, is_ready, is_active, created_at, updated_at)
        VALUES (${cardId}, ${dto.vazifa ?? null}, ${dto.javobgarlik ?? null}, ${dto.gsd ?? null},
                ${dto.reglament ?? null}, ${dto.jarayon ?? null}, ${dto.talim ?? null}, ${nextVersion}, false, true, NOW(), NOW())
        ON CONFLICT (card_id) DO UPDATE SET
          vazifa=EXCLUDED.vazifa, javobgarlik=EXCLUDED.javobgarlik, gsd=EXCLUDED.gsd,
          reglament=EXCLUDED.reglament, jarayon=EXCLUDED.jarayon, talim=EXCLUDED.talim,
          version_no=EXCLUDED.version_no, is_ready=false, is_active=true, updated_at=NOW()
        RETURNING *`);
      return r.rows[0] ?? null;
    });
  }, 'DB_ERROR');
}
```
> `runInTx` — loyihada mavjud tx-helper (yo'q bo'lsa `db.transaction(...)` ishlat; `@shared/db` eksportini tekshir). Yangi metodlar: `addSectionSignature`, `listSignatures`, `getVersions`, `getReadiness` (pastda).
**Sabab:** EP-ORG-125 versiyalash; EP-ORG-105 `is_ready` upsertda false'ga tushadi (yangi versiya = qayta-imzo).
**Yangi repo metodlar (qisqa):**
```ts
async getVersions(cardId: number): Promise<Result<Row[]>> {
  return this.exec(sql`SELECT * FROM card_folder_versions WHERE card_id=${cardId} ORDER BY version_no DESC`);
}
async addSectionSignature(cardId: number, sectionKey: string, versionNo: number, signerId: number, role: string): Promise<Result<Row|null>> {
  const r = await this.exec(sql`
    INSERT INTO card_folder_section_signatures (card_id, section_key, version_no, signer_id, signer_role)
    VALUES (${cardId}, ${sectionKey}, ${versionNo}, ${signerId}, ${role})
    ON CONFLICT (card_id, section_key, version_no, signer_id, signer_role) DO NOTHING
    RETURNING *`);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
async listSignatures(cardId: number, versionNo: number): Promise<Result<Row[]>> {
  return this.exec(sql`SELECT * FROM card_folder_section_signatures WHERE card_id=${cardId} AND version_no=${versionNo}`);
}
async markReady(cardId: number, ready: boolean): Promise<Result<Row|null>> {
  const r = await this.exec(sql`UPDATE card_folders SET is_ready=${ready}, last_confirmed_at=NOW(), updated_at=NOW() WHERE card_id=${cardId} RETURNING *`);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
```

### BOSQICH 3 — card-folder.service.ts (readiness + signature business logic)
**Fayl:** `apps/api/src/modules/org-structure/card-folder.service.ts`
**OLDIN (qator 50-66):** faqat `getFolder`/`upsertFolder`.
**KEYIN:** `upsertFolder` `changedBy`/`reason` qabul qiladi (controllerdan); yangi metodlar:
```ts
const SECTIONS = ['vazifa','javobgarlik','gsd','reglament','jarayon','talim'] as const;
// business.constants.ts'ga: export const CARD_FOLDER_SECTIONS = SECTIONS; export const CARD_FOLDER_SECTION_COUNT = 6;

async signSection(cardId: number, sectionKey: string, signerId: number, role: 'rd'|'acknowledged'): Promise<Result<{ isReady: boolean }>> {
  // 1. Joriy version_no'ni o'qi
  const folder = await this.repo.getByCard(cardId);
  if (!folder.ok) return Err(folder.error);
  const versionNo = Number((folder.data as Row | null)?.version_no ?? 1);
  // 2. Imzo yoz
  const sig = await this.repo.addSectionSignature(cardId, sectionKey, versionNo, signerId, role);
  if (!sig.ok) return Err(sig.error);
  // 3. Hamma bo'lim 'rd' imzosi bilan tasdiqlanganmi? -> is_ready (EP-ORG-105)
  const sigs = await this.repo.listSignatures(cardId, versionNo);
  if (!sigs.ok) return Err(sigs.error);
  const rdSigned = new Set((sigs.data as Row[]).filter(s => s.signer_role === 'rd').map(s => s.section_key));
  const allSigned = SECTIONS.every(k => rdSigned.has(k));
  if (allSigned) await this.repo.markReady(cardId, true);
  return Ok({ isReady: allSigned });
}

async getReadiness(cardId: number): Promise<Result<{ versionNo: number; signedSections: string[]; isReady: boolean; completeness: number }>> {
  const folder = await this.repo.getByCard(cardId);
  if (!folder.ok) return Err(folder.error);
  const row = folder.data as Row | null;
  const versionNo = Number(row?.version_no ?? 1);
  const sigs = await this.repo.listSignatures(cardId, versionNo);
  if (!sigs.ok) return Err(sigs.error);
  const signed = [...new Set((sigs.data as Row[]).filter(s => s.signer_role === 'rd').map(s => String(s.section_key)))];
  return Ok({ versionNo, signedSections: signed, isReady: Boolean(row?.is_ready), completeness: toView(cardId, row).completeness });
}
```
**Sabab:** EP-ORG-105 "hammasi tasdiqlanmaguncha tayyor emas" gate. Faqat 'rd' (tasdiqlovchi) imzosi `is_ready`ga ta'sir qiladi; 'acknowledged' (tanishgan) — audit.

### BOSQICH 4 — card-folder.controller.ts (yangi endpointlar + Zod)
**Fayl:** `apps/api/src/modules/org-structure/card-folder.controller.ts`
**OLDIN (qator 41-56):** faqat `GET /` + `PUT /`.
**KEYIN:** Mavjudni saqla, qo'sh:
```ts
const SignSchema = z.object({
  sectionKey: z.enum(['vazifa','javobgarlik','gsd','reglament','jarayon','talim']),
  role: z.enum(['rd','acknowledged']),
}).strict();

@ApiOperation({ summary: 'Sign a folder section (EP-ORG-105 kontrolniy list)' })
@Roles('hr_manager', 'director', 'super_admin')  // imzo = yuqori rol
@Post('sign')
async sign(@Param('cardId', ParseIntPipe) cardId: number, @Body() body: unknown, @CurrentUser() user: { id: number }) {
  const dto = SignSchema.parse(body);
  return unwrapOrThrow(await this.service.signSection(cardId, dto.sectionKey, user.id, dto.role));
}

@ApiOperation({ summary: 'Folder readiness + signatures (current version)' })
@Get('readiness')
async readiness(@Param('cardId', ParseIntPipe) cardId: number) {
  return unwrapOrThrow(await this.service.getReadiness(cardId));
}

@ApiOperation({ summary: 'Folder version history (EP-ORG-125)' })
@Get('versions')
async versions(@Param('cardId', ParseIntPipe) cardId: number) {
  return unwrapOrThrow(await this.service.getVersions(cardId));
}
```
**PUT'ni yangila:** `@CurrentUser()` + optional `reason` qabul qil:
```ts
@Put()
async upsert(@Param('cardId', ParseIntPipe) cardId: number, @Body() body: unknown, @CurrentUser() user: { id: number }) {
  const parsed = FolderSchema.extend({ reason: z.string().max(500).nullable().optional() }).parse(body);
  const { reason, ...sections } = parsed;
  this.logger.log('Upserting card folder');
  return unwrapOrThrow(await this.service.upsertFolder(cardId, sections as FolderInput, user.id, reason ?? null));
}
```
> `@CurrentUser()` — loyihadagi mavjud decorator (auth modulida; `me-permissions.controller.ts` kabi joydan import yo'lini tasdiqla). Yo'q bo'lsa `@Req()` + `req.user.id`.
**Sabab:** EP-ORG-105 imzo, EP-ORG-125 versiya tarixi, EP-ORG-068 sabab (ixtiyoriy papkada).

### BOSQICH 5 — Per-karta PDF (EP-ORG-138)
**Fayl:** Mavjud `apps/api/src/modules/org-structure/org-export.service.ts` (PDF allaqachon `pdf-lib`, `exportPdf` qator ~139) ga `exportCardFolderPdf(cardId)` metod qo'sh; YOKI yangi `card-folder-pdf.service.ts` (≤900 qator) — mavjud pattern (PDFDocument, addPage, font) qayta ishlat.
**KEYIN (controller):**
```ts
@ApiOperation({ summary: 'Per-card "Должностная инструкция" PDF (6 sections + signature slots)' })
@Get('pdf')
async pdf(@Param('cardId', ParseIntPipe) cardId: number, @Res() res: Response) {
  const buf = await this.pdfService.exportCardFolderPdf(cardId);
  if (!buf.ok) throw new NotFoundException(buf.error.message);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="card-${cardId}-folder.pdf"`);
  res.end(buf.data);
}
```
> PDF mazmuni: karta nomi + razryad/unvon (EP-ORG-118: lavozim nomidan alohida) + 6 bo'lim sarlavha + matn + har bo'lim ostida 2 imzo joyi (RD ___ / Tanishgan ___ / sana ___). **Q14 BullMQ async + QR-hash imzo = bu fazada EMAS** (egasi keyin; sync pdf-lib yetarli). `docs/`ga "keyin" deb belgila.
**Sabab:** EP-ORG-138 rasmiy yo'riqnoma PDF.

### BOSQICH 6 — Shablon apply (EP-ORG-057/143)
**Fayl:** `card-folder.service.ts` + `card-folder.controller.ts`
**KEYIN (service):**
```ts
async applyTemplate(cardId: number, templateCode: string, overwrite: boolean): Promise<Result<FolderView>> {
  // 1. Shablon bo'limlarini o'qi
  const tpl = await this.repo.getTemplateSections(templateCode);  // yangi repo metod: card_template_sections JOIN card_templates ON code
  if (!tpl.ok) return Err(tpl.error);
  if ((tpl.data as Row[]).length === 0) return Err(AppErr('NOT_FOUND', 'Shablon topilmadi'));
  // 2. Joriy papka (overwrite=false bo'lsa faqat bo'sh bo'limlarni to'ldiradi — EP-ORG-058 xavfsiz)
  const cur = await this.repo.getByCard(cardId);
  if (!cur.ok) return Err(cur.error);
  const merged = mergeTemplate(cur.data as Row | null, tpl.data as Row[], overwrite);
  return this.upsertFolder(cardId, merged, null, `Shablon qo'llandi: ${templateCode}`);
}
```
**KEYIN (controller):**
```ts
const ApplyTplSchema = z.object({ templateCode: z.string().min(1).max(50), overwrite: z.boolean().default(false) }).strict();
@Post('apply-template')
@Roles('hr_manager','director','super_admin')
async applyTemplate(@Param('cardId', ParseIntPipe) cardId: number, @Body() body: unknown) {
  const dto = ApplyTplSchema.parse(body);
  return unwrapOrThrow(await this.service.applyTemplate(cardId, dto.templateCode, dto.overwrite));
}
```
> EP-ORG-058: `overwrite=false` default — eski qiymat o'zgarmaydi, faqat bo'sh bo'lim to'ladi ("shablonga moslashtirish" tugmasi). Shablon SEED = egasi-data; jadval bo'sh bo'lsa apply 404 (fabrikatsiya yo'q).
**Sabab:** EP-ORG-057 lavozim-turi avto-to'ldirish.

---

## 6. FRONTEND + DIZAYN (EP token/shablon/komponent)

### 6.1 Orphan tozalash (Q-46) — AVVAL bajariladi
1. Tasdiqla: `CardFolderDialog.tsx` haqiqatan orphan:
   ```bash
   # Grep import 'CardFolderDialog' butun FE bo'yicha (faqat o'zini topishi kerak):
   ```
   Grep tool: pattern `CardFolderDialog`, path `artifacts/erp-dashboard/src`. Agar faqat o'z fayli + ehtimol bir orphan parent topilsa → orphan.
2. **Qaror:** `CardFolderDialog.tsx` logikasini (6-bo'lim editor + completeness bar + GLOSSARY + ЦКП) yangi `components/hr/orgnode/FolderSectionsTab.tsx`ga KO'CHIR (jonli `OrgNodeDetail` bilan ishlash uchun `nodeId` prop, `card?.id` emas). Keyin orphan `CardFolderDialog.tsx` + uni import qiluvchi har qanday orphan parent'ni **O'CHIR** (chala qoldirma — Q-46).
   > ⚠️ Inline hex (`CardFolderDialog` da yo'q, lekin tekshir) — yangi `FolderSectionsTab.tsx`da xom rang ISHLATMA, `var(--ep-*)` token.

### 6.2 OrgNodeDetail "Папка" tab — 2-darajali ichki tab (Qoida 42 ≤2 daraja)
**Fayl:** `artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx`
**OLDIN (qator 125, 136):**
```tsx
<TabsTrigger value="folder">...{t("papka3")}</TabsTrigger>
...
<TabsContent value="folder"><FolderTab nodeId={nodeId!} /></TabsContent>
```
**KEYIN:** "Папка" tab ichida 1-daraja ichki tab (2-daraja jami — RUXSAT): "Bo'limlar (6)" + "Materiallar". Yangi wrapper `orgnode/FolderTabHost.tsx`:
```tsx
export function FolderTabHost({ nodeId }: { nodeId: string | number }) {
  const { t } = useTranslation('common');
  const [sub, setSub] = useState('sections');
  return (
    <Tabs value={sub} onValueChange={setSub}>
      <TabsList className="mb-3">
        <TabsTrigger value="sections">{t('folderSections6')}</TabsTrigger>  {/* 6-bo'lim */}
        <TabsTrigger value="materials">{t('folderMaterials')}</TabsTrigger>  {/* document/video/test */}
      </TabsList>
      <TabsContent value="sections"><FolderSectionsTab nodeId={nodeId} /></TabsContent>
      <TabsContent value="materials"><FolderTab nodeId={nodeId} /></TabsContent>
    </Tabs>
  );
}
```
`OrgNodeDetail.tsx:136`ni `<FolderTabHost nodeId={nodeId!} />`ga almashtir.
> **REGRESS-HIMOYA:** `FolderTab` (materiallar) O'CHMAYDI — "Materiallar" ichki tabda QOLADI. Faqat YANGI "Bo'limlar (6)" tabi qo'shildi.

### 6.3 FolderSectionsTab.tsx — 6-bo'lim + completeness + imzo + versiya
**Yangi fayl:** `components/hr/orgnode/FolderSectionsTab.tsx` (≤900 qator; oshsa `*Sections.tsx`ga bo'l).
- **Query:** `GET /api/org-structure/cards/${nodeId}/folder` (FolderView) + `GET .../readiness` + `GET .../versions`.
- **Forma (Q-43 REAL saqlash):** 6 `<Textarea>` (vazifa..talim) + ЦКП bloki (tskp/tskpTarget/tskpMeasurementUnit reuse `CardFolderDialog` logikasi) → `PUT .../folder` mutation.
  - F1: `isLoading` → `<EPLoader />` (FolderTab.tsx:71-77 namuna).
  - F2: `onError` → `toast({ variant: 'destructive' })`.
  - `onSuccess` → `invalidateQueries([folderKey, readinessKey, versionsKey])` + toast.
- **Completeness bar:** `<Progress value={completeness} />` (CardFolderDialog.tsx:116 namuna) — live + server qiymat.
- **GLOSSARY tooltip:** har bo'lim yonida `<HelpCircle>` + `t(GLOSSARY[k])` (CardFolderDialog.tsx:130-135).
- **Imzo (EP-ORG-105):** har bo'lim ostida "Tasdiqlash (RD)" tugma → `POST .../sign {sectionKey, role:'rd'}`; imzolangan bo'lim ✅ ko'rsatadi (readiness.signedSections). Hammasi imzolansa → "Tayyor" badge (`EPStatusPill tone="success"`).
- **Versiya (EP-ORG-125):** "Versiyalar" expander → `versions` ro'yxati (version_no, changed_by, created_at, reason). Diff = keyin (Q243 belgila).
- **PDF:** "Yo'riqnoma PDF" tugma → `window.open('/api/org-structure/cards/${nodeId}/folder/pdf')` yoki `apiRequest` blob.
- **Shablon (EP-ORG-057):** "Shablon qo'llash" tugma → Select (card_templates) + "moslashtirish" checkbox → `POST .../apply-template`.
- **Dizayn:** `EPCard`/`EPPageHeader`/`EPStatusPill`/`EPLoader` (`components/ep`). Xom rang TAQIQ — `var(--ep-*)`. Tugma joylashuvi: Saqlash o'ngda, Bekor chapda (Q-41).

### 6.4 i18n kalitlar (yangi)
`folderSections6`, `folderMaterials`, `glossaryVazifa..glossaryTalim` (CardFolderDialog'da bor — qayta ishlat), `folderReady`, `signSection`, `applyTemplate`, `folderVersions`, `cardFolderPdf`. UZ + RU + UZ-CYR uchun (`add-only`, mavjud i18n skript bilan). Hardcoded matn TAQIQ.

---

## 7. ZOD / RESULT / DRIZZLE NAMUNA (copy-paste tayyor)

```ts
// === Result (controller) ===
import { unwrapOrThrow } from '@common/http-result';
const view = unwrapOrThrow(await this.service.getFolder(cardId)); // !ok -> HttpException

// === Result (repo) ===
import { Ok, Err, Result, safeCall, AppErr } from '@common/result';
async getReadiness(cardId: number): Promise<Result<X>> {
  const r = await this.exec(sql`...`);
  return r.ok ? Ok(map(r.data)) : Err(r.error);
}

// === Zod (controller body) ===
const SignSchema = z.object({
  sectionKey: z.enum(['vazifa','javobgarlik','gsd','reglament','jarayon','talim']),
  role: z.enum(['rd','acknowledged']),
}).strict();
const dto = SignSchema.parse(body); // throws ZodError -> 400

// === Drizzle/raw (parametrli, SQL-inj xavfsiz — card-folder.repository pattern) ===
import { sql } from 'drizzle-orm';
const r = await this.exec(sql`SELECT * FROM card_folder_versions WHERE card_id=${cardId} ORDER BY version_no DESC`);
```

```tsx
// === FE mutation (Q-43 + F1/F2) ===
const mutation = useMutation({
  mutationFn: (dto: FolderForm) => apiRequest('PUT', `/api/org-structure/cards/${nodeId}/folder`, dto),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [folderKey] });
    queryClient.invalidateQueries({ queryKey: [readinessKey] });
    toast({ title: t('papkaSaqlandi') });
  },
  onError: () => toast({ title: t('Xatolik'), variant: 'destructive' }),
});
```

---

## 8. QABUL-MEZONI (Definition of Done)

| # | Mezon | Tekshirish |
|---|---|---|
| 1 | `card_folders.card_id` FK → `org_departments` (org_functions EMAS) | `q.cjs` FK so'rov |
| 2 | `card_folder_versions` + `card_folder_section_signatures` + `card_templates` + `card_template_sections` MAVJUD | `q.cjs to_regclass` |
| 3 | 6-bo'lim PUT → DB UPSERT + eski qiymat `card_folder_versions`ga snapshot (version_no inkrement) | bproof rollback-tx |
| 4 | completeness% = filled/6*100 (real, saqlanmaydi) | service unit / DB-proof |
| 5 | Har bo'lim 'rd' imzosi → hamma 6 imzolansa `is_ready=true` (EP-ORG-105) | bproof rollback-tx sign |
| 6 | Per-karta PDF endpoint 200 + `Content-Type: application/pdf` (EP-ORG-138) | curl (login bilan) |
| 7 | Shablon apply: bo'sh jadval → 404 (fabrikatsiya yo'q); kontent bo'lsa overwrite=false faqat bo'sh to'ldiradi | bproof |
| 8 | FE "Папка" tab: "Bo'limlar (6)" + "Materiallar" ichki tab (≤2 daraja); `FolderTab` materiallar saqlangan (regress yo'q) | FE jonli + grep |
| 9 | Orphan `CardFolderDialog.tsx` O'CHIRILGAN yoki jonli ulangan (chala yo'q) | grep import = 0 |
| 10 | `tsc` GREEN (o'z fayllarda 0 xato); `check-design-tokens.mjs` PASS (xom rang yo'q) | tsc + skript |
| 11 | Forma Q-43: PUT → DB → qayta-yuklashda ko'rinadi (jonli) | FE round-trip |
| 12 | Owner-DATA reestriga shablon-kontent + imzo-rol-data yozilgan | §9 |

---

## 9. OWNER-DATA (fabrikatsiya TAQIQ — egasi to'ldiradi)

| Data | Hozir | Kim beradi |
|------|-------|-----------|
| Papka 6-bo'lim kontenti (vazifa/javobgarlik/gsd/reglament/jarayon/talim matn) | 2 qator NULL | HR / bo'lim boshlig'i (productionda 0 dan) |
| `card_templates` boshlang'ich 10-15 shablon (operator/rahbar/mutaxassis/naladchik/OTK/logist...) + 6-bo'lim standart matn (EP-ORG-059/143) | jadval bo'sh | Egasi / HR |
| `reconfirm_days` (qayta-tasdiq muddati, Q5 default 7 taklif) | NULL | Egasi (har karta yoki global) |
| Imzolovchi RD rol-darajasi (qaysi rol 'rd' imzolaydi) — RBAC tier ulashi | `rbac_tier` 144 NULL | Egasi (Faza 2 bilan) |
| 12-bo'lim kengaytirish (EP-ORG-095) yoki 6-bo'lim qoladimi | 6-bo'lim | Egasi qarori (bu fazada 6) |

> Egasi data bermaguncha: jadvallar bo'sh + apply 404 + completeness 0% (REAL, soxta emas).

---

## 9.A — EP-ORG TALAB → BOSQICH MAPPING (har talab qayerda qoplanadi)

> Bu jadval `decisions/01-org-kartalar.md` + `ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md` (papka — 22%) dagi HAR papka-talabini bu direktivaning aniq bosqichiga bog'laydi. "Hozir" ustuni = jonli tasdiqlangan holat (§3). Hech bir talab "qolib ketmasin" (Q-33).

| EP-ORG | Talab (qisqa) | Hozir (jonli) | Bu fazada | Bosqich |
|--------|---------------|---------------|-----------|---------|
| EP-ORG-007 / Q-07 | 6 bo'lim + to'liqlik% | card_folders BOR, completeness BOR, lekin de-routed + FE jonli emas | FK fix + FE jonli ulash | B1, §6.2/6.3 |
| EP-ORG-089 / ORG-Q5 | Kartaga biriktiriladigan hujjatlar (virtual papka) | FolderTab document/video/test JONLI (position_folders) | SAQLANADI (regress yo'q), "Materiallar" ichki tab | §6.2 |
| EP-ORG-104 | Karta = "Лавозим папкаси" konteyneri | qisman (virtual) | 6-bo'lim + materiallar bitta tabda | §6.2/6.3 |
| EP-ORG-105 / Q47 | Kontrolniy list: har bo'lim "tasdiqladim"+sana+imzo; hammasi→"tayyor" | YO'Q (card_signatures yo'q) | card_folder_section_signatures + sign endpoint + is_ready gate | B/C, B3/B4, §6.3 |
| EP-ORG-126 | Karta 2 imzo bilan kuchga kiradi (RD + tanishgan + sana) | YO'Q | signer_role 'rd'/'acknowledged' + signed_at | B/C, §6.3 |
| EP-ORG-109 | Javobgarlik: standart bandlar (energiya/sir/moddiy) avto + xos qo'lda | qisman (bitta erkin text) | shablon orqali standart bandlar (apply-template) | D, §5-B6 |
| EP-ORG-125 / Q82 / Q243 | Versiyalanadi (eski saqlanadi); versiya o'zgarsa qayta tasdiq | YO'Q (upsert eski o'chiradi) | card_folder_versions + snapshot on-upsert + is_ready→false | B, B2, §5-B2 |
| EP-ORG-127 | 2 qatlam: vazifa ta'rifi + amaliy qadamlar (ish yo'riqnomasi) | qisman (vazifa+jarayon ustun) | 6-bo'lim ichida vazifa (ta'rif) + jarayon (qadamlar) ajratilgan | §6.3 |
| EP-ORG-138 / Q14 / Q37 | Per-karta "Должностная инструкция" PDF (bo'lim+imzo joyi+unvon) | YO'Q (faqat org-chart PDF) | exportCardFolderPdf endpoint (sync pdf-lib) | §5-B5 |
| EP-ORG-057 / EP-ORG-143 | Shablon: lavozim-turi → standart maydon avto-to'ladi | YO'Q (card_templates yo'q) | card_templates + apply-template (overwrite=false) | D, §5-B6 |
| EP-ORG-058 | Shablon o'zgarsa eski karta o'zgarmaydi; "moslashtirish" tugma ixtiyoriy | YO'Q | overwrite=false faqat bo'sh bo'lim to'ldiradi | §5-B6 |
| EP-ORG-059 / EP-ORG-140 | Boshlang'ich 10-15 shablon (operator/rahbar/mutaxassis...) | YO'Q | jadval + apply MEXANIZM; SEED = egasi-data | D, §9 |
| EP-ORG-095 | 6 → 12 bo'lim kengaytirish; "tugallanmagan" holat | 6 bo'lim | 6 QOLADI (12 = egasi qarori); is_ready = "tugallanmagan" gate | DEFER §13 |
| EP-ORG-117 | Orgpolitika "SERIYA" bo'yicha avto-biriktirish | YO'Q (org_policies yo'q) | DEFER (alohida faza — reglament-bo'lim ulashi) | DEFER §13 |
| Q5 | reconfirm_days (default 7) + muddat o'tsa ogohlantirish+Kanban | YO'Q | reconfirm_days ustun (egasi-data); cron/Kanban = DEFER | A, §4.2, DEFER |
| Q6 | To'liqlik% teng vazn; oylikка ta'sir qilmaydi (faqat LMS-gate bilvosita) | 6 teng vazn BOR, oylik-ta'sir yo'q (to'g'ri) | SAQLANADI; LMS-gate Faza 7 | §3.1 |
| Q14 | PDF async BullMQ + karta-versiya + QR-hash imzo | YO'Q | sync pdf-lib (versiya BOR); BullMQ+QR = DEFER | §5-B5, DEFER |
| Q93 | Glossariy "Atamalar" + darslikda tooltip | qisman (orphan dialog tooltip) | jonli FolderSectionsTab tooltip; alohida Atamalar bo'lim = DEFER | §6.3, DEFER |
| Q243 | Yangi versiyada faqat O'ZGARGAN bo'limga qayta-imzo; diff ko'rsatish | YO'Q | is_ready→false (qayta-imzo); diff UI = DEFER | §5-B2, DEFER |

> **Belgilash qoidasi:** "DEFER" deb belgilangan talablar — bu fazada MEXANIZM EMAS (egasi qarori yoki keyingi faza). Ularni `docs/`ga "keyin" deb yoz (Q-33), KOD yozma. Qolganlari (DEFER emas) bu fazada TO'LIQ quriladi.

---

## 9.B — business.constants.ts qo'shimchalari

**Fayl:** `apps/api/src/common/constants/business.constants.ts`
**Qo'sh (Qoida 12 — magic number taqiq):**
```ts
// === Card folder (PHASE-06, EP-ORG-007/105) ===
export const CARD_FOLDER_SECTIONS = ['vazifa', 'javobgarlik', 'gsd', 'reglament', 'jarayon', 'talim'] as const;
export type CardFolderSectionKey = typeof CARD_FOLDER_SECTIONS[number];
export const CARD_FOLDER_SECTION_COUNT = CARD_FOLDER_SECTIONS.length; // 6
export const CARD_FOLDER_SIGNER_ROLES = ['rd', 'acknowledged'] as const; // EP-ORG-126
export const CARD_FOLDER_SECTION_MAX_LEN = 20000; // FolderSchema Zod max
export const CARD_FOLDER_RECONFIRM_DEFAULT_DAYS = 7; // Q5 taklif (egasi NULL bo'lsa fallback EMAS — faqat UI hint)
```
> `CARD_FOLDER_SECTIONS`ni `card-folder.service.ts` (`SECTIONS` const, qator 12) + `card-folder.controller.ts` (Zod enum) + FE `FolderSectionsTab.tsx` (`SECTION_KEYS`) HAMMASI shu yagona manbadan import qilsin — uch joyda takror TAQIQ.

---

## 9.C — i18n kalitlar (to'liq ro'yxat — UZ/RU/UZ-CYR)

> `scripts/i18n-fix-console-gaps.mjs` add-only pattern (memory `session_2026-05-26`). Hardcoded TSX matn TAQIQ (Qoida 21 emas, lekin `STANDARTLAR`). `common` namespace.

| Kalit | UZ | RU |
|-------|----|----|
| `folderSections6` | Bo'limlar (6) | Разделы (6) |
| `folderMaterials` | Materiallar | Материалы |
| `folderReady` | Tayyor | Готово |
| `folderNotReady` | Tugallanmagan | Не завершено |
| `signSection` | Tasdiqlash | Подтвердить |
| `signedRd` | Tasdiqlangan (RD) | Подтверждено (RD) |
| `acknowledge` | Tanishdim | Ознакомлен |
| `applyTemplate` | Shablon qo'llash | Применить шаблон |
| `applyTemplateMerge` | Faqat bo'sh bo'limlar | Только пустые разделы |
| `folderVersions` | Versiyalar | Версии |
| `cardFolderPdf` | Yo'riqnoma PDF | Должностная инструкция PDF |
| `papkaSaqlandi` | Papka saqlandi | Папка сохранена |
| `glossaryVazifa` | Lavozim nima qiladi — asosiy vazifa ta'rifi | Основная задача должности |
| `glossaryJavobgarlik` | Javobgarlik bandlari (energiya/sir/moddiy) | Пункты ответственности |
| `glossaryGsd` | ЦКП / GSD — to'g'ri ishning yakuniy natijasi | ЦКП — конечный продукт |
| `glossaryReglament` | Reglament va orgpolitika qoidalari | Регламент и оргполитика |
| `glossaryJarayon` | Amaliy qadamlar — ish yo'riqnomasi | Практические шаги |
| `glossaryTalim` | Kartaga biriktirilgan darslik | Привязанное обучение |

> `glossaryVazifa..glossaryTalim` — `CardFolderDialog.tsx:37-40`da kalitlar bor; qiymat (matn) bormi tekshir, yo'q bo'lsa qo'sh. UZ-CYR translit avtomatik (`_tlabel_tmp/translit.mjs`).

---

## 9.D — Per-karta PDF layout spetsifikatsiyasi (EP-ORG-138)

> `org-export.service.ts` `exportPdf` (qator ~139, pdf-lib `PDFDocument`/`addPage`/`save`) patternini qayta ishlat. Yagona sahifa (kerak bo'lsa ko'p), A4.

```
┌──────────────────────────────────────────────┐
│  ДОЛЖНОСТНАЯ ИНСТРУКЦИЯ                          │  (sarlavha, bold 16pt)
│  Karta: <org_departments.name>  (#<id>)         │
│  Unvon: <razryad_levels.name>  (EP-ORG-118)     │  ← razryad JOIN, lavozim nomidan ALOHIDA
│  Departament: <otdeleniye>  Versiya: v<version_no> │
├──────────────────────────────────────────────┤
│  1. ВАЗИФА                                       │  (bo'lim sarlavha bold 12pt)
│     <card_folders.vazifa matni yoki "—">        │  (matn 10pt, wrap)
│     ─────────────  RD imzo: ______  Sana: ____  │  (imzo joyi — EP-ORG-105)
│     ─────────────  Tanishdim: ____  Sana: ____  │
│  2. ЖАВОБГАРЛИК ... (xuddi shunday 6 bo'limgacha)│
│  ...                                             │
│  6. ТАЪЛИМ                                       │
├──────────────────────────────────────────────┤
│  To'liqlik: <completeness>%   Tayyor: <is_ready>│
└──────────────────────────────────────────────┘
```
- Imzo joyi: agar `card_folder_section_signatures`da 'rd'/'acknowledged' bor bo'lsa → imzolovchi ism + signed_at chop et (bo'sh chiziq emas). Yo'q bo'lsa bo'sh chiziq.
- **Fabrikatsiya yo'q:** bo'sh bo'lim → "—" (soxta matn emas).
- `exportCardFolderPdf(cardId): Promise<Result<Buffer>>` — karta yo'q → `Err(NOT_FOUND)`.
- **DEFER (Q14):** BullMQ async queue + QR-kod (server-side hash imzo) — bu fazada sync yetarli; `docs/`ga belgila.

---

## 10. EDGE-HOLATLAR

1. **card_id org_departments'da yo'q** (eski `card_id=1`): prune migration (§4.1) tozalaydi; FK ADD'dan keyin yangi PUT 23503 (FK violation) qaytaradi → controller 400/404. Test qil.
2. **Bo'sh papka GET:** `getByCard` null → `toView(cardId, null)` → completeness 0, hamma bo'lim null (xato emas, F1 ko'rsatadi).
3. **Imzo takror:** `ON CONFLICT DO NOTHING` (UNIQUE card_id+section+version+signer+role) → idempotent, 200.
4. **Versiya 1 (birinchi upsert):** `cur` yo'q → snapshot yozilmaydi, `version_no=1`. Keyingi upsert → snapshot v1, yangi v2.
5. **is_ready qayta-false:** har PUT (kontent o'zgarsa) `is_ready=false` (EP-ORG-105: yangi versiya = qayta-imzo kerak, Q243).
6. **PDF karta yo'q:** `exportCardFolderPdf` → `Err(NOT_FOUND)` → controller 404 (Qoida 11).
7. **Shablon code noto'g'ri:** apply → 404 (sections=0). Fabrikatsiya yo'q.
8. **Concurrency (2 upsert bir vaqtda):** tx + `ON CONFLICT (card_id)` → oxirgi yutadi; version_no race ehtimoli past (tx SELECT...INSERT), lekin `UNIQUE(card_id,version_no)` `ON CONFLICT DO NOTHING` snapshot'da himoya qiladi.
9. **Acting/io karta:** papka kartaga (org_departments.id) bog'liq, xodimga emas → i.o. o'zgarsa papka o'zgarmaydi (to'g'ri, EP-ORG-028 darslik kartaga).

---

## 10.A — FolderSectionsTab.tsx to'liq skelet (EP-token, F1/F2, Q-43)

> Yangi fayl: `artifacts/erp-dashboard/src/components/hr/orgnode/FolderSectionsTab.tsx`. Bu skelet — to'ldir, lekin tuzilma shu. Xom rang TAQIQ (token). ≤900 qator.

```tsx
/**
 * @module FolderSectionsTab
 * @description Karta 6-bo'lim papkasi (vazifa/javobgarlik/gsd/reglament/jarayon/talim) +
 *   ЦКП + completeness% + bo'lim-imzo (EP-ORG-105) + versiya (EP-ORG-125) + shablon (EP-ORG-057).
 *   Q-43: PUT -> DB -> qayta-yuklashda ko'rinadi. Jonli OrgNodeDetail "Папка > Bo'limlar" tabi.
 */
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, CheckCircle2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { EPLoader, EPStatusPill } from "@/components/ep";

const SECTION_KEYS = ["vazifa", "javobgarlik", "gsd", "reglament", "jarayon", "talim"] as const;
type SectionKey = typeof SECTION_KEYS[number];
const GLOSSARY: Record<SectionKey, string> = {
  vazifa: "glossaryVazifa", javobgarlik: "glossaryJavobgarlik", gsd: "glossaryGsd",
  reglament: "glossaryReglament", jarayon: "glossaryJarayon", talim: "glossaryTalim",
};
interface FolderView { vazifa: string|null; javobgarlik: string|null; gsd: string|null;
  reglament: string|null; jarayon: string|null; talim: string|null; completeness: number; }
interface Readiness { versionNo: number; signedSections: string[]; isReady: boolean; completeness: number; }

export function FolderSectionsTab({ nodeId }: { nodeId: string | number }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc = useQueryClient();
  const cardId = Number(nodeId);
  const folderKey = `/api/org-structure/cards/${cardId}/folder`;
  const readyKey = `${folderKey}/readiness`;

  const { data: folder, isLoading } = useQuery<FolderView>({ queryKey: [folderKey], enabled: cardId > 0 });
  const { data: ready } = useQuery<Readiness>({ queryKey: [readyKey], enabled: cardId > 0 });

  const [form, setForm] = useState<Record<SectionKey, string>>(() =>
    SECTION_KEYS.reduce((a, k) => ({ ...a, [k]: "" }), {} as Record<SectionKey, string>));
  const loaded = useRef("");
  if (folder && loaded.current !== `${cardId}`) {
    loaded.current = `${cardId}`;
    setForm(SECTION_KEYS.reduce((a, k) => ({ ...a, [k]: folder[k] ?? "" }), {} as Record<SectionKey, string>));
  }
  const set = (k: SectionKey, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const filled = SECTION_KEYS.filter((k) => form[k].trim() !== "").length;
  const completeness = Math.round((filled / 6) * 100);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PUT", folderKey, { ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [folderKey] });
      qc.invalidateQueries({ queryKey: [readyKey] });
      toast({ title: t("papkaSaqlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });
  const signMutation = useMutation({
    mutationFn: (k: SectionKey) => apiRequest("POST", `${folderKey}/sign`, { sectionKey: k, role: "rd" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [readyKey] }); toast({ title: t("signedRd") }); },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><EPLoader size={32} tone="muted" /></div>;
  const signed = new Set(ready?.signedSections ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={completeness} className="h-2 flex-1" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">{t("toliqlik")}: {completeness}% ({filled}/6)</span>
        {ready?.isReady
          ? <EPStatusPill tone="success">{t("folderReady")}</EPStatusPill>
          : <EPStatusPill tone="warning">{t("folderNotReady")}</EPStatusPill>}
      </div>

      {SECTION_KEYS.map((k) => (
        <div key={k} className="rounded-md border border-border p-3">
          <Label className="flex items-center gap-1 mb-1">
            {t(k)}
            <Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent className="max-w-xs">{t(GLOSSARY[k])}</TooltipContent></Tooltip>
            {signed.has(k) && <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />}
          </Label>
          <Textarea value={form[k]} onChange={(e) => set(k, e.target.value)} rows={2} />
          <div className="flex justify-end mt-1">
            <Button size="sm" variant="outline" disabled={signMutation.isPending || signed.has(k)}
              onClick={() => signMutation.mutate(k)}>{t("signSection")}</Button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {/* Shablon Select + apply-template mutation (EP-ORG-057) */}
          <Button variant="ghost" size="sm" onClick={() => window.open(`${folderKey}/pdf`, "_blank")}>
            <FileDown className="h-3.5 w-3.5 mr-1" />{t("cardFolderPdf")}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loaded.current = ""}>{t("Bekor")}</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? t("saqlanmoqda") : t("saqlash")}
          </Button>
        </div>
      </div>
    </div>
  );
}
```
> ЦКП bloki (tskp/tskpTarget/tskpMeasurementUnit) — `CardFolderDialog.tsx:141-164` patternidan ko'chir (orphan o'chirilishidan OLDIN logikasi shu yerga). Versiyalar expander — `GET .../versions`.

---

## 10.B — REGRESS-HIMOYA CHECKLIST (Q-46 — o'chirishdan oldin)

Har o'chirish/o'zgartirishdan oldin shu ro'yxatni belgila:
- [ ] `FolderTab.tsx` (virtual document/video/test) **O'CHMADI** — "Materiallar" ichki tabda jonli qoldi.
- [ ] `position_folders` jadval/repo/endpoint (`GET/POST/DELETE /nodes/:id/folder`) **TEGILMADI**.
- [ ] `OrgNodeDetail` boshqa tablar (main/razryad/employees/children/vacant/stats/portret/history) **O'ZGARMADI** — faqat "folder" tab `FolderTabHost`ga o'raldi.
- [ ] `CardFolderController` mavjud `GET/PUT` endpoint **buzilmadi** (faqat kengaytirildi: sign/readiness/versions/pdf/apply-template qo'shildi).
- [ ] `card_folders` mavjud 2 qator **yo'qolmadi** (FK re-point + prune faqat org_departments'da yo'q `card_id=1` test-qatorni oladi — APPROVED).
- [ ] Orphan `CardFolderDialog.tsx` **TO'LIQ o'chirildi** (yarim qoldirilmadi) — logikasi `FolderSectionsTab.tsx`ga ko'chirilgandan KEYIN.
- [ ] `git rm` qilingan fayl import qiluvchi BOSHQA fayl **yo'q** (grep tasdiqlandi) — aks holda tsc qizil.

---

## 11. SELF-VERIFY (Q-29/Q-32 — tsc + DB-proof + jonli isbot)

### 11.1 Static (har bosqich)
```bash
# Backend tsc (o'z fayllar 0 xato):
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit
# FE tsc:
pnpm --filter erp-dashboard exec tsc --noEmit
# Dizayn token (xom rang BLOK):
node scripts/check-design-tokens.mjs
```

### 11.2 DB-proof rollback-tx skript (NAMUNA — `_audit/bproof-card-folder.cjs`)
> `bproof-node-razryad-display.cjs` patterniga amal qil. Kirit→oqdi→ko'rindi→ROLLBACK (data SAQLANMAYDI).

```js
/** DB-PROOF (rollback-tx): 6-bo'lim papka UPSERT + versiya snapshot + imzo->is_ready.
 *  DATA SAQLANMAYDI — ROLLBACK. Fabrikatsiya yo'q (kontent test-tx ichida, commit emas). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const card = (await c.query(`SELECT id, name FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0];
    console.log(`Test karta: #${card.id} "${card.name}"`);
    await c.query('BEGIN');
    // 1-upsert (version 1)
    await c.query(`INSERT INTO card_folders (card_id,vazifa,javobgarlik,gsd,reglament,jarayon,talim,version_no,is_ready,is_active,created_at,updated_at)
      VALUES ($1,'V1 vazifa',NULL,NULL,NULL,NULL,NULL,1,false,true,NOW(),NOW())
      ON CONFLICT (card_id) DO UPDATE SET vazifa=EXCLUDED.vazifa, version_no=1, is_ready=false, updated_at=NOW()`, [card.id]);
    // 2-upsert (version 2) + snapshot v1
    const cur = (await c.query(`SELECT * FROM card_folders WHERE card_id=$1`, [card.id])).rows[0];
    await c.query(`INSERT INTO card_folder_versions (card_id,version_no,vazifa,completeness,changed_by,reason)
      VALUES ($1,$2,$3,17,NULL,'test') ON CONFLICT (card_id,version_no) DO NOTHING`, [card.id, cur.version_no, cur.vazifa]);
    await c.query(`UPDATE card_folders SET vazifa='V2 vazifa',javobgarlik='javob',gsd='gsd',reglament='reg',jarayon='jar',talim='tal',version_no=2,is_ready=false,updated_at=NOW() WHERE card_id=$1`, [card.id]);
    const v2 = (await c.query(`SELECT vazifa,version_no FROM card_folders WHERE card_id=$1`, [card.id])).rows[0];
    const versions = (await c.query(`SELECT version_no,vazifa FROM card_folder_versions WHERE card_id=$1 ORDER BY version_no`, [card.id])).rows;
    console.log('card_folders KEYIN:', JSON.stringify(v2));
    console.log('card_folder_versions (snapshot):', JSON.stringify(versions));
    // 3-imzo: 6 bo'lim 'rd' -> is_ready
    for (const k of ['vazifa','javobgarlik','gsd','reglament','jarayon','talim']) {
      await c.query(`INSERT INTO card_folder_section_signatures (card_id,section_key,version_no,signer_id,signer_role)
        VALUES ($1,$2,2,1,'rd') ON CONFLICT DO NOTHING`, [card.id, k]);
    }
    const sigCount = (await c.query(`SELECT count(*) n FROM card_folder_section_signatures WHERE card_id=$1 AND version_no=2 AND signer_role='rd'`, [card.id])).rows[0].n;
    await c.query(`UPDATE card_folders SET is_ready=($1::int=6) WHERE card_id=$2`, [sigCount, card.id]);
    const ready = (await c.query(`SELECT is_ready FROM card_folders WHERE card_id=$1`, [card.id])).rows[0];
    console.log(`Imzolar (rd): ${sigCount}/6 -> is_ready=${ready.is_ready}  (EP-ORG-105)`);
    await c.query('ROLLBACK');
    const after = (await c.query(`SELECT count(*) n FROM card_folder_versions WHERE card_id=$1`, [card.id])).rows[0].n;
    console.log(`\nROLLBACK -> card_folder_versions(card #${card.id}) = ${after} qator (0 = saqlanmadi, fabrikatsiya yo'q)`);
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
Ishga tushir: `node _audit/bproof-card-folder.cjs`. Kutilgan: v2 vazifa ko'rinadi, v1 snapshot saqlangan, 6/6 imzo→is_ready=true, ROLLBACK→0 qator.

### 11.3 Jonli isbot (server qaytgach, login bilan)
```bash
# 1. Login (token ol) — mavjud smoke pattern
# 2. PUT 6-bo'lim:
curl -s -X PUT :3030/api/org-structure/cards/67/folder -H "Authorization: Bearer $T" \
  -H 'Content-Type: application/json' -d '{"vazifa":"test","javobgarlik":"t","gsd":"t","reglament":"t","jarayon":"t","talim":"t"}'
# kutilgan: {"completeness":100,"filledSections":6,...}
# 3. GET qayta (round-trip Q-43):
curl -s :3030/api/org-structure/cards/67/folder -H "Authorization: Bearer $T"
# 4. readiness:
curl -s :3030/api/org-structure/cards/67/folder/readiness -H "Authorization: Bearer $T"
# 5. PDF:
curl -s -D- -o /tmp/c67.pdf :3030/api/org-structure/cards/67/folder/pdf -H "Authorization: Bearer $T" | grep -i content-type
# kutilgan: application/pdf
```
> **Q-44:** Agar `:3030` 000 (butun server, `/api/auth/health` ham 000) = Windows nest-watch crash = MUHIT, kod emas → dev-server qayta ishga tushir, panik yo'q. Static fallback (§11.1 + §11.2) bilan tasdiq, jonli isbot server qaytgach.
> **DB-proof yetganidan keyin jonli isbot olib tashlanmaydi** — TEST karta (#67) kontenti egasi-data emas, lekin jonli round-trip uchun kiritilsa, oxirida tozalanadi yoki test-karta sifatida belgilanadi (fabrikatsiya yozma — productionda HR to'ldiradi).

---

## 12. COMMIT TARTIBI (Qoida 23 / GIT_QOIDALARI)

Har bosqich = alohida commit, faqat o'z fayl:
```bash
# Bosqich 1 (migration):
git add apps/api/src/shared/db/invariants/migrations-drift.ts
git commit --no-verify -m "$(cat <<'EOF'
feat(org-papka): card_folders FK org_departments + versions/signatures/templates jadvallar (PHASE-06 §4)

EP-ORG-007/105/125/057. FK re-point (FAZA0 ulash) + 4 APPROVED jadval (idempotent).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"

# Bosqich 2-4 (BE repo/service/controller):
git add apps/api/src/modules/org-structure/card-folder.repository.ts \
        apps/api/src/modules/org-structure/card-folder.service.ts \
        apps/api/src/modules/org-structure/card-folder.controller.ts \
        apps/api/src/common/constants/business.constants.ts
git commit --no-verify -m "feat(org-papka): 6-bo'lim versiyalash + imzo (EP-ORG-105/125) + shablon apply (EP-ORG-057)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# Bosqich 5 (PDF):
git add apps/api/src/modules/org-structure/org-export.service.ts apps/api/src/modules/org-structure/card-folder.controller.ts
git commit --no-verify -m "feat(org-papka): per-karta yo'riqnoma PDF (EP-ORG-138)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# Bosqich 6 (FE):
git add artifacts/erp-dashboard/src/components/hr/orgnode/FolderSectionsTab.tsx \
        artifacts/erp-dashboard/src/components/hr/orgnode/FolderTabHost.tsx \
        artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx
# orphan o'chirish (agar):
git rm artifacts/erp-dashboard/src/components/hr/org/CardFolderDialog.tsx
git commit --no-verify -m "feat(org-papka): OrgNodeDetail Папка tab 6-bo'lim+materiallar (≤2 daraja); orphan CardFolderDialog o'chirildi

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# Bosqich (DB-proof skript):
git add _audit/bproof-card-folder.cjs
git commit --no-verify -m "test(org-papka): bproof rollback-tx (upsert+versiya+imzo->is_ready)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 13. HOLAT HISOBOTI (Q-38 — faza oxirida egaga)

Faza oxirida quyidagi formatda hisobot ber:
- **DONE:** FK re-point, 4 jadval, 6-bo'lim versiyalash+imzo+readiness+PDF+shablon, FE 2-darajali Папка tab, orphan o'chirildi, tsc GREEN, bproof PASS, jonli round-trip PASS.
- **DEFER (docs/ga belgilangan):** Q14 BullMQ async PDF + QR-hash imzo; Q243 versiya-diff UI; EP-ORG-095 12-bo'lim kengaytirish (egasi qarori); EP-ORG-117 orgpolitika SERIYA-biriktirish (alohida faza).
- **OWNER-DATA kutilmoqda:** §9 reestri (shablon-kontent, reconfirm_days, RD imzo-rol).
- **Commit'lar:** ro'yxat (hash + xabar).

---

*PHASE-06 direktiva — MASSIV-100. Yaratildi 2026-06-25. Manba jonli tasdiqlangan (q.cjs + Read). Bog'liqlik: FAZA 0 (FK) → FAZA 06 → (FAZA 7 darslik talim-bo'limga ulanadi).*
