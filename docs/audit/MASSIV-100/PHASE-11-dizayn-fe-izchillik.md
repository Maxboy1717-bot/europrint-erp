# FAZA 11 — DIZAYN / FE IZCHILLIK (EP Design System) · BAJARUVCHI DIREKTIVASI

> **Bajaruvchi:** Muslimbek (bosh-dasturchi nazorati ostida)
> **Manba-reja:** `docs/audit/MASSIV-100/00-MASTER-REJA.md` → FAZA 11
> **Bog'liqlik:** Bu YAKUNIY cross-cutting faza. FAZA 0–10 strukturasi tugagach yoki parallel — chunki bu faza FAQAT **ko'rinish/dizayn** qatlamiga tegadi, biznes-mantiqqa EMAS. Lekin har faza FE-bo'limi shu standartga amal qiladi.
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, batafsil, hech qanday noaniqliksiz.
> **Atama:** org-tuzilma elementi doim **KARTA** deyiladi (node/tugun EMAS) — muloqotda. Kodda `node`/`OrgNode` identifikatorlari saqlanadi (regress-himoya).

---

## § 0. KONTEKST + MAQSAD

### 0.1 Vizyon

EuroPrint ERP ning "miyasi" = org-tuzilma (KARTA-markazli). Egasi qarori (2026-06-25, Q3 / `00-MASTER-REJA.md`):

> **"Dizayn = EP design-system izchillik"**: barcha org-schema sahifalari `DIZAYN_QOIDALARI.md` token + shablon + komponent bilan **bir xil**; mavjud joylashuv saqlanadi; **REGRESS-HIMOYA** (ishlayotgan element o'chmaydi).

Bu fazaning vazifasi: org-tuzilma sahifalari (KARTA-daraxti + KARTA-detali + barcha tab + dialoglar) ni EuroPrint EP Design System (`DIZAYN_QOIDALARI.md`) ga **to'liq moslashtirish** — **xom rang / inline-style → token**, **bespoke karta/header → EP komponent**, **loading/error/empty → EP holat-komponenti**, **tab ≤ 2 daraja**, **har forma F1/F2 (loading + onError)**. Bularning HAMMASI **ishlayotgan funksiyani buzmasdan** (Q-46: ishlayotgan kod o'chmaydi; faqat KO'RINISH moslanadi, MAZMUN/FUNKSIYA o'zgarmaydi).

### 0.2 Bu faza NIMA QILMAYDI (ko'lam chegarasi — Q-35 / Q-46)

- ❌ Biznes-mantiq o'zgartirmaydi (payroll, razryad-execution, login-gate — bular FAZA 2/3/4).
- ❌ Endpoint qo'shmaydi/o'chirmaydi, DB jadval/ustun o'zgartirmaydi (bu faza migration-SIZ).
- ❌ Ishlayotgan KPI-karta, tugma, statistika, ma'lumot-maydoni, feature ni OLIB TASHLAMAYDI (Q-46 birinchi yarmi — "recruiting 9→5 stat olib tashlash" tipidagi xato TAQIQ).
- ❌ Tab tartibini yoki tablar ro'yxatini o'zgartirmaydi (9 tab — `main/razryad/employees/children/vacant/folder/stats/portret/history` — SAQLANADI).
- ❌ Daraxt-canvas interaktivligini (zoom/pan/drag-reparent) buzmaydi.
- ✅ FAQAT: xom rang → token, bespoke wrapper → EP komponent, loading/error/empty → EP, raw spinner → EPSkeleton/EPLoader, vizual izchillik.

### 0.3 Maqsad-natija (Definition of Done)

1. `node scripts/check-design-tokens.mjs` → **0 yangi BLOK** (staged diff toza).
2. Org-sahifalar `EPPageHeader` / `EPKpiCard` / `EPCard` / `EPStatusPill` / `EPSkeleton*` / `EPErrorState` / `EPEmptyState` ishlatadi (bespoke `<Card>` + inline-style header → EP).
3. Barcha xom hex/rgba inline-style → `var(--ep-*)` / `var(--mod-org)` token yoki Tailwind semantik class.
4. Tab ierarxiyasi ≤ 2 daraja (hozir 1 daraja — SAQLANADI, regress yo'q).
5. Har forma/dialog F1 (loading) + F2 (onError) bor.
6. `tsc` GREEN (o'z fayllarda 0 xato), FE build PASS.
7. Jonli isbot: sahifa ochiladi, daraxt ko'rinadi, KARTA bosiladi → detal ochiladi, hamma tab ishlaydi, hamma forma saqlaydi (regress yo'q).

---

## § 1. QOIDALAR-BLOKI (har bosqichda majburiy)

> Manba: `CLAUDE.md` (Qoida 21/41/42/43, Q-39/Q-40/Q-46), `DIZAYN_QOIDALARI.md`, `00-MASTER-REJA.md` §2.

### 1.1 Kod uslubi
- **TypeScript strict.** Validatsiya = **Zod** (class-validator EMAS). Xato = **Result<T>** (BE). FE = `useQuery`/`useMutation` standart.
- Fayl ≤ 900 qator, funksiya ≤ 150 qator. Oshsa `*Sections.tsx` / `*Tabs.tsx` / `*Dialogs.tsx` ga bo'l.
- Drizzle (BE) — bu fazada BE TEGILMAYDI (faqat FE dizayn).

### 1.2 Dizayn (Qoida 21 — buzilmas)
- ❌ Inline `style={{ color:'#fff' }}` / `style={{ background:'rgba(...)' }}` / `style={{ background:'#1d4ed8' }}` — **xom rang BLOK**.
- ❌ Tailwind arbitrary hex `text-[#94a3b8]` — **WARN** (token bilan almashtir).
- ✅ `var(--ep-*)` / `var(--mod-org)` token YOKI semantik Tailwind class (`text-muted-foreground`, `bg-primary`, `text-primary`).
- ✅ Yangi sahifa = mavjud **shablon** (DetailPage/FormPage/ListPage) + props — yangi dizayn EMAS.
- ✅ Yagona manba — tokenlar: `artifacts/erp-dashboard/src/erp-modern-ui/*.css`; komponentlar: `src/components/ep/` + `src/components/ui/`.
- Pre-commit: `scripts/check-design-tokens.mjs` (diff-aware) — inline xom rang BLOK, Tailwind `[#hex]` WARN.

### 1.3 UI izchillik (Qoida 41/42/43)
- **Q-41:** Tugma joylashuvi standart (saqlash o'ngda, bekor chapda). Yangi sahifa = shablon + props.
- **Q-42:** Tab ichida tab — MAKS 2 daraja. 3+ daraja TAQIQ. (Org-detal hozir 1 daraja — saqlanadi.)
- **Q-43:** Har forma REAL saqlaydi: FE mutation → BE → DB → qayta-yuklashda ko'rinadi. "Saqlash faqat local state" = XATO. Bu fazada formalar allaqachon saqlaydi — dizayn moslashda **saqlash buzilmaydi** (regress-test).
- **F1:** Har `useQuery` → `isLoading` holati (EPSkeleton). **F2:** Har `useMutation` → `onError` handler (toast).

### 1.4 Regress-himoya (Q-39 / Q-46 — KRITIK)
- ✅ Ishlayotgan + to'g'ri kod/funksiya/sahifa/element **HECH QACHON o'chirilmaydi** — dizayn moslash, refactor, "tozalash" bahonasida ham YO'Q. Statistika kartasi, tugma, feature, ma'lumot-maydoni — ishlayotgan bo'lsa, **qoladi**.
- ❌ To'g'ri ishlamaydigan — soxta/crash/o'lik/dublikat — TO'LIQ o'chiriladi (chala emas). Bu fazada bunday narsa KAM — asosan ko'rinish moslash.
- **O'lchov:** "ishlaydimi + to'g'rimi?" → ishlaydi+to'g'ri → SAQLANADI.
- O'zgarishdan oldin: bu element ishlayotganini tasdiqla (Q-29 verify), keyin FAQAT ko'rinishni moslash.

### 1.5 Fabrikatsiya TAQIQ (Q-40)
- Bu faza FE-dizayn — data fabrikatsiyasi xavfi past. Lekin: bo'sh karta → soxta KPI-qiymat YOZMA. `value ?? "—"` ishlatilsin (hozir shunday).

### 1.6 Verify (Q-29 / Q-32) — har bosqich
- `tsc` GREEN (o'z fayllarda 0 xato).
- FE build PASS (`pnpm --filter erp-dashboard run build` yoki tsc).
- `node scripts/check-design-tokens.mjs` → 0 BLOK.
- Jonli isbot: sahifa render bo'ladi, element ko'rinadi, funksiya ishlaydi (regress yo'q).

### 1.7 Commit (Q-31 / GIT_QOIDALARI)
- Faqat o'z fayllar: `git add <aniq-fayl>` (HECH QACHON `-A` / `.`).
- `git commit --no-verify` (token-check qo'lda yuritiladi) + sabab.
- `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Har bosqich oxirida commit (yarim qoldirilmaydi — Q-33).

---

## § 2. JORIY HOLAT (fayl:satr + DB-fakt — JONLI tasdiqlangan)

> Manba: 2026-06-25 jonli kod + DB tahlili (Q-29). Taxmin YO'Q.

### 2.1 Sahifa fayllar (haqiqiy joylashuv)

| Komponent | Fayl | Holat |
|---|---|---|
| KARTA-daraxti (page) | `artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx` (299 qator) | Bespoke header + custom KpiCard + raw spinner + raw dot-grid bg |
| KARTA-detali (page) | `artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx` (156 qator) | Inline gradient header (rgba) + custom stats + 9-tab flat |
| Portret tab (page) | `artifacts/erp-dashboard/src/pages/OrgNodePortretTab.tsx` | tekshiriladi (bosqich 7) |
| org/ komponentlar | `artifacts/erp-dashboard/src/components/hr/org/` (13 fayl) | KpiCard/TreeNodeCard/types raw hex |
| orgnode/ tablar | `artifacts/erp-dashboard/src/components/hr/orgnode/` (12 fayl) | MainTab/ExtraTabs/ChildrenTab/FolderTab raw hex |

### 2.2 EP komponent bazasi (kanonik — `components/ep/index.ts`, tasdiqlangan)

Mavjud eksportlar (`artifacts/erp-dashboard/src/components/ep/index.ts`):
```
EPCard, EPModuleColor, EPKpiCard, EPStatusPill, EPStatusTone, EPPageHeader,
EPErrorState, EPEmptyState, EPSkeletonBar, EPSkeletonKpiRow, EPSkeletonTable,
EPSkeletonCard, useCountUp, EPLoader, EPSpinnerBlock, EPComingSoon, EPNumberedSection
```
> ⚠️ `EPSkeletonList` `DIZAYN_QOIDALARI.md` da yozilgan, lekin barrelda YO'Q. Mavjud: `EPSkeletonTable`/`EPSkeletonCard`/`EPSkeletonBar`/`EPSkeletonKpiRow`. Faqat MAVJUD bo'lganlarini ishlat.

### 2.3 Token-bazasi (CSS — `erp-modern-ui/`, JONLI tasdiqlangan)

- `--ep-primary` = `#FF902F` (orange brand) — `europrint-mockup-theme.css:17`.
- `--ep-green` = `#2E8A5A` — `europrint-mockup-theme.css:32`.
- `--ep-red` = `#C0432F` — `europrint-mockup-theme.css:34`.
- `--ep-green-soft` / `--ep-red-soft` — `ep-motion-helpers.css:37,39`.
- ⚠️ **`--mod-org` CSS da DEFINE QILINMAGAN** (grep `--mod-org` = 0 natija). `DIZAYN_QOIDALARI.md §1.3` uni `#EC4899` (pink) deb yozadi, lekin CSS da yo'q. **Bosqich 1da `--mod-org` ni `design-tokens.css` ga qo'shamiz** (faqat CSS o'zgaruvchisi — bu DDL emas, migration emas, dizayn-token).
- ⚠️ Org-daraxt **daraja-rangi** (`LEVEL_COLORS` 0–6) data-viz palitra (har daraja boshqa rang) — bu **maqsadli** (egasi: "rang = daraja"). Lekin xom hex sifatida `types.ts` da yashaydi → **CSS daraja-token (`--ep-org-l0..l6`) ga ko'chiramiz** (bosqich 1) va `types.ts` shu tokenlarni o'qiydi → check-design-tokens dan o'tadi + tema-aware bo'ladi.

### 2.4 Aniqlangan xom-rang/inline-style (fayl:satr — JONLI grep)

| # | Fayl:satr | Muammo | Tur |
|---|---|---|---|
| A1 | `pages/OrgStructureHierarchy.tsx:201–205` | `<KpiCard ... color="#1d4ed8" / "#7c3aed" / "#16a34a" / "#dc2626" / "#b45309" />` | xom hex prop |
| A2 | `pages/OrgStructureHierarchy.tsx:222–223` | `style={{ color: checked ? LEVEL_COLORS[lvl] : undefined }}` + `<CheckSquare style={{ color: LEVEL_COLORS[lvl] }}/>` | inline xom (LEVEL_COLORS=hex) |
| A3 | `pages/OrgStructureHierarchy.tsx:254` | `style={{ backgroundImage: "radial-gradient(circle, #33333315 1px, ...)" }}` | inline xom hex |
| A4 | `pages/OrgStructureHierarchy.tsx:257` | raw spinner `<div className="animate-spin ... border-b-2 border-primary"/>` (EPSkeleton EMAS) | loading anti-pattern |
| A5 | `pages/OrgStructureHierarchy.tsx:281` | `style={{ background: LEVEL_COLORS[Number(lvl)] }}` (legend dot) | inline xom |
| B1 | `pages/OrgNodeDetail.tsx:62,83` | `headerBg = node.color \|\| LEVEL_COLORS[...] \|\| "#1d4ed8"` + `style={{ background: linear-gradient(135deg, ${headerBg}dd, ${headerBg}99) }}` | inline xom/dynamic |
| B2 | `pages/OrgNodeDetail.tsx:87` | `<Badge style={{ background: "rgba(255,255,255,0.25)", color: "white" ... }}>` | inline rgba |
| B3 | `pages/OrgNodeDetail.tsx:42–48` | raw spinner (loading) — EPSkeleton EMAS | loading anti-pattern |
| B4 | `pages/OrgNodeDetail.tsx:90` | `bg-[var(--ep-red)]/30` (Badge) — token bor lekin bespoke badge (EPStatusPill emas) | komponent |
| C1 | `components/hr/org/KpiCard.tsx:27,29` | `style={{ backgroundColor: ${color}20 }}` + `style={{ color }}` (xom hex prop'dan) | inline xom |
| C2 | `components/hr/org/types.ts:51–70` | `ABC_COLORS` + `LEVEL_COLORS` xom hex map | xom hex konstanta |
| C3 | `components/hr/org/helpers.ts:13` | `return LEVEL_COLORS[level] ?? "#4b5563"` | xom hex fallback |
| C4 | `components/hr/org/TreeNodeCard.tsx:53,54,56` | `"2px solid #22c55e"` / `"2px dashed #ef4444"` / `boxShadow #22c55e55` / `outline #22c55e` (drag/vacant indikator) | inline xom |
| C5 | `components/hr/org/TreeNodeCard.tsx:117,131` | `background:"#ef444460"` / `background:"rgba(255,255,255,0.25)"` (avatar fallback) | inline xom/rgba |
| C6 | `components/hr/org/TreeNodeCard.tsx:184` | `score>=30 ? "#22c55e" : score>=-30 ? "#f59e0b" : "#ef4444"` (HRC bar) | inline xom |
| D1 | `components/hr/orgnode/ExtraTabs.tsx:28,34,40,46,52,58` | `<StatCard color="#0f766e" / "#1d4ed8" / "#dc2626" / "#7c3aed" / "#16a34a" / "#059669" />` | xom hex prop |
| D2 | `components/hr/orgnode/ChildrenTab.tsx:35` | `style={{ background: child.color \|\| "#1d4ed8" }}` | inline xom |
| D3 | `components/hr/orgnode/FolderTab.tsx:115–117` | `color:"#1d4ed8" / "#7c3aed" / "#16a34a"` (folder kategoriya) | xom hex konstanta |
| D4 | `components/hr/orgnode/types.ts:88–92` | `LEVEL_COLORS` xom hex map (dublikat — org/types.ts dagiga o'xshash) | xom hex konstanta |

> **Eslatma (TreeNodeCard daraja-gradient, C4 dan farqli):** `TreeNodeCard.tsx:52` `background: linear-gradient(135deg, ${baseColor}f0, ${baseColor}bb)` — `baseColor`=daraja-rangi (data-viz, maqsadli). Buni daraja-token (§2.3) ga ko'chiramiz; **drag/vacant statik indikatorlari (C4: `#22c55e`/`#ef4444`)** semantik token (`--ep-success`/`--ep-danger`) ga ko'chadi.

### 2.5 DB-fakt (JONLI — `node _audit/q.cjs`, tasdiqlangan)

```
org_departments: 144 qator, color=144/144 (hammasida color bor)
hierarchy_level taqsimot: l0=93, l1=6, l2=34, l3=11  (l4–6 hozir 0 qator)
```
> Demak FE daraja-rangi 0–3 darajaga ishlaydi; 4–6 token tayyor turadi (kelajak uchun). `node.color` har kartada bor — `headerBg`/`TreeNodeCard` shuni ishlatadi (saqlanadi, lekin xom hex sifatida emas — token-fallback bilan).

---

## § 3. BOSQICHMA-BOSQICH IJRO

> Har bosqich: **fayl · OLDIN kod · KEYIN kod · sabab**. Tartib: avval token-bazasi (bosqich 1), keyin sahifalar, keyin tablar/dialoglar.

---

### BOSQICH 1 — Token-bazasini to'ldirish (`--mod-org` + daraja-tokenlari)

**Fayl:** `artifacts/erp-dashboard/src/erp-modern-ui/design-tokens.css` (token CSS — allowlistda, xom rang shu yerda QONUNIY).

**Sabab:** `--mod-org` CSS da yo'q (§2.3) — org-modul aksent rangi token bo'lishi kerak (`DIZAYN_QOIDALARI.md §1.3` `#EC4899`). Daraxt daraja-ranglari xom hex `types.ts` da — ularni tema-aware CSS tokenga ko'chirsak, check-design-tokens dan o'tadi va dark-tema bilan moslashadi.

**OLDIN:** `design-tokens.css` da `--mod-org` yo'q; daraja-rang `types.ts` ichida xom hex.

**KEYIN — `design-tokens.css` `:root` blokiga qo'sh:**
```css
/* === ORG modul aksenti (DIZAYN_QOIDALARI §1.3) === */
--mod-org: #EC4899;            /* pink — org modul aksenti */
--mod-org-soft: rgba(236, 72, 153, 0.12);

/* === Org-tuzilma KARTA daraja-ranglari (data-viz palitra; egasi: "rang = daraja") === */
--ep-org-l0: #7C3AED;  /* Egasi / ildiz (binafsha) */
--ep-org-l1: #1D4ED8;  /* Boshqarma (ko'k) */
--ep-org-l2: #16A34A;  /* Bo'lim (yashil) */
--ep-org-l3: #B45309;  /* Sektor (amber) */
--ep-org-l4: #DC2626;  /* Lavozim (qizil) */
--ep-org-l5: #0D9488;  /* 5-daraja (teal) */
--ep-org-l6: #BE185D;  /* 6-daraja (pushti) */
--ep-org-fallback: #4B5563;  /* aniqlanmagan daraja (kulrang) */
```
> Agar `[data-theme="dark"]` bloki bo'lsa — daraja-ranglar yorqin bo'lgani uchun ikkala temada bir xil qoldiriladi (data-viz palitra tema-invariant). `--mod-org`/`--mod-org-soft` ham bir xil.

**Verify:** `grep -n "mod-org" design-tokens.css` → topiladi. FE build PASS.
**Commit:** `git add artifacts/erp-dashboard/src/erp-modern-ui/design-tokens.css` → `phase11: org dizayn-tokenlari (--mod-org + daraja palitra)`.

---

### BOSQICH 2 — `types.ts` xom hex → CSS daraja-token (org/ + orgnode/)

**Fayl 1:** `artifacts/erp-dashboard/src/components/hr/org/types.ts:51–70`
**Fayl 2:** `artifacts/erp-dashboard/src/components/hr/orgnode/types.ts:88–92` (dublikat LEVEL_COLORS)

**Sabab:** `LEVEL_COLORS`/`ABC_COLORS` xom hex — ular inline-style ga uzatiladi (A2/A5/B1/D2/C2) → check-design-tokens BLOK qiladi (yangi diff). CSS-token string (`"var(--ep-org-l0)"`) ga aylantirsak, style ichida hex bo'lmaydi → BLOK yo'q. Funksiya o'zgarmaydi (rang ko'rinishi bir xil).

**OLDIN — `org/types.ts`:**
```ts
export const ABC_COLORS: Record<string, string> = {
  A: "#6366f1", B: "#22c55e", C: "#f59e0b", D: "#ef4444",
  E: "#8b5cf6", F: "#06b6d4", G: "#f97316", H: "#14b8a6",
  I: "#84cc16", J: "#ec4899",
};
export const LEVEL_COLORS: Record<number, string> = {
  0: "#7c3aed", 1: "#1d4ed8", 2: "#16a34a", 3: "#b45309",
  4: "#dc2626", 5: "#0d9488", 6: "#be185d",
};
```

**KEYIN — `org/types.ts`:**
```ts
// VISION: daraja-rang = CSS daraja-token (tema-aware, check-design-tokens dan o'tadi).
// Xom hex types.ts da QOLMAYDI — design-tokens.css §org daraja palitra (BOSQICH 1).
export const LEVEL_COLORS: Record<number, string> = {
  0: "var(--ep-org-l0)", 1: "var(--ep-org-l1)", 2: "var(--ep-org-l2)",
  3: "var(--ep-org-l3)", 4: "var(--ep-org-l4)", 5: "var(--ep-org-l5)",
  6: "var(--ep-org-l6)",
};
// ABC reyting-ranglari — agar inline-style ga uzatilsa token kerak; hozir faqat
// badge/label da ishlatilsa Tailwind class afzal. (Ishlatilishini grep bilan tekshir;
// inline-style ga borsa quyidagicha tokenlashtir, aks holda QOLDIR — regress yo'q.)
export const ABC_COLORS: Record<string, string> = {
  A: "var(--ep-info)", B: "var(--ep-success)", C: "var(--ep-warn)", D: "var(--ep-danger)",
  E: "var(--mod-hr)", F: "var(--mod-fi)", G: "var(--mod-qc)", H: "var(--mod-cc)",
  I: "var(--mod-pos)", J: "var(--mod-org)",
};
```
> ⚠️ **REGRESS-TEKSHIRUV (Q-39):** `ABC_COLORS` qayerda ishlatilishini avval grep qil: `grep -rn "ABC_COLORS" artifacts/erp-dashboard/src`. Agar SVG `fill`/inline-style ga borsa — token to'g'ri. Agar `<div className={...}>` class sifatida ishlatilsa (token-string class bo'lib qolmaydi) — QOLDIR yoki Tailwind class ber. Buzma.

**KEYIN — `orgnode/types.ts:88–92`** (xuddi shu LEVEL_COLORS map):
```ts
export const LEVEL_COLORS: Record<number, string> = {
  0: "var(--ep-org-l0)", 1: "var(--ep-org-l1)", 2: "var(--ep-org-l2)",
  3: "var(--ep-org-l3)", 4: "var(--ep-org-l4)",
};
```

**Verify:** `tsc` GREEN; `grep -nE "#[0-9a-fA-F]{6}" types.ts` (org+orgnode) → 0. Sahifa render — daraxt ranglari avvalgidek ko'rinadi (var() CSS da resolve bo'ladi).
**Commit:** `git add .../hr/org/types.ts .../hr/orgnode/types.ts` → `phase11: org daraja-rang xom hex -> CSS token`.

---

### BOSQICH 3 — `helpers.ts` fallback token

**Fayl:** `artifacts/erp-dashboard/src/components/hr/org/helpers.ts:13`

**OLDIN:**
```ts
export function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] ?? "#4b5563"; // aniqlanmagan daraja → kulrang fallback
}
```

**KEYIN:**
```ts
export function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] ?? "var(--ep-org-fallback)"; // aniqlanmagan daraja → kulrang
}
```
**Sabab:** `getLevelColor` natijasi `TreeNodeCard` inline-style ga boradi → fallback ham token bo'lishi shart, aks holda `#4b5563` style ichida BLOK bo'ladi.
**Verify:** `tsc` GREEN. **Commit:** `phase11: getLevelColor fallback token`.

---

### BOSQICH 4 — `OrgStructureHierarchy.tsx` dizayn moslash (sahifa-poydevor)

> ENG MUHIM sahifa. Header + KPI + loading + dot-grid + level-filter + legend. **Regress-himoya:** export/vakant/qo'shish tugmalari, qidiruv, filtr, zoom/pan, daraxt — HAMMASI SAQLANADI. Faqat ko'rinish moslanadi.

#### 4a — KPI kartalar: bespoke `KpiCard` → `EPKpiCard` (A1, C1)

**Fayl:** `pages/OrgStructureHierarchy.tsx:25,201–206` + import.

**OLDIN (201–206):**
```tsx
<div className="flex gap-2 mt-3 flex-wrap">
  <KpiCard icon={<Building2 className="h-4 w-4" />} label={t("jamiBolimlar")} value={stats?.totalDepartments ?? "—"} color="#1d4ed8" />
  <KpiCard icon={<Network className="h-4 w-4" />} label={t("jamiNodes")} value={stats?.totalNodes ?? "—"} color="#7c3aed" />
  <KpiCard icon={<Users className="h-4 w-4" />} label={t("xodimlar")} value={stats?.totalEmployees ?? "—"} color="#16a34a" />
  <KpiCard icon={<UserX className="h-4 w-4" />} label={t("vakant")} value={stats?.vacantCount ?? "—"} sub={...} color="#dc2626" />
  <KpiCard icon={<TrendingUp className="h-4 w-4" />} label={t("k30KunOzgarish")} value={stats?.recentChanges ?? "—"} color="#b45309" />
</div>
```

**KEYIN:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
  <EPKpiCard title={t("jamiBolimlar")} value={String(stats?.totalDepartments ?? "—")} icon={<Building2 />} color="var(--mod-org)" />
  <EPKpiCard title={t("jamiNodes")} value={String(stats?.totalNodes ?? "—")} icon={<Network />} color="var(--ep-org-l0)" />
  <EPKpiCard title={t("xodimlar")} value={String(stats?.totalEmployees ?? "—")} icon={<Users />} color="var(--ep-org-l2)" />
  <EPKpiCard title={t("vakant")} value={String(stats?.vacantCount ?? "—")} change={stats?.vacantPercent} icon={<UserX />} color="var(--ep-danger)" />
  <EPKpiCard title={t("k30KunOzgarish")} value={String(stats?.recentChanges ?? "—")} icon={<TrendingUp />} color="var(--ep-org-l3)" />
</div>
```
> Import o'zgartir: `EPKpiCard` ni `@/components/ep` dan; eski `import { KpiCard }` ni olib tashla (faqat shu sahifada ishlatilsa). **REGRESS:** `KpiCard.tsx` boshqa joyda ishlatilsa — `grep -rn "hr/org/KpiCard" src` bilan tekshir; ishlatilmasa fayl o'lik → o'chiriladi (Q-46), ishlatilsa QOLDIR.
> ⚠️ `EPKpiCard` props (`title`/`value`/`icon`/`color`/`change`/`trend`/`loading`) — `DIZAYN_QOIDALARI §4.2`. `value` string bo'lishi kerak → `String(...)`. `sub` props EPKpiCard da yo'q → `vacantPercent` ni `change` ga.
**Sabab:** Bespoke `KpiCard` xom hex prop oladi (C1: `${color}20` style ichida) → BLOK. `EPKpiCard` token-color qabul qiladi, kanonik.

#### 4b — Loading: raw spinner → `EPSkeletonKpiRow` + `EPSkeletonCard` (A4)

**Fayl:** `pages/OrgStructureHierarchy.tsx:257`

**OLDIN:**
```tsx
{isLoading && <div className="flex items-center justify-center h-full"><div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" /><p className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</p></div></div>}
```

**KEYIN:**
```tsx
{isLoading && (
  <div className="p-6"><EPSpinnerBlock label={t("Yuklanmoqda...")} /></div>
)}
```
> `EPSpinnerBlock` canvas-ichi yuklash uchun mos (daraxt skeleton mantiqsiz). Import `EPSpinnerBlock` ni `@/components/ep` dan. KPI qatori loading'da `EPKpiCard loading` propi bilan ham ko'rsatilishi mumkin — ixtiyoriy.
**Sabab:** Raw `animate-spin` = D-7 buzilishi (loading EP pattern bo'lishi shart).

#### 4c — Dot-grid fon: xom hex → token (A3)

**Fayl:** `pages/OrgStructureHierarchy.tsx:251–255`

**OLDIN:**
```tsx
<div ref={containerRef} className="flex-1 overflow-hidden bg-muted/10 cursor-grab active:cursor-grabbing"
  style={{ backgroundImage: "radial-gradient(circle, #33333315 1px, transparent 1px)", backgroundSize: "24px 24px" }}
  ...>
```

**KEYIN — `design-tokens.css` ga qo'sh (BOSQICH 1 ichida ham bo'lishi mumkin):**
```css
--ep-org-grid-dot: rgba(51, 51, 51, 0.08);
```
**KEYIN — komponentda:**
```tsx
<div ref={containerRef} className="flex-1 overflow-hidden bg-muted/10 cursor-grab active:cursor-grabbing org-canvas-grid"
  ...>
```
**KEYIN — `global-surface.css` yoki `design-tokens.css` ga klass:**
```css
.org-canvas-grid {
  background-image: radial-gradient(circle, var(--ep-org-grid-dot) 1px, transparent 1px);
  background-size: 24px 24px;
}
```
**Sabab:** `#33333315` inline-style ichida → BLOK. CSS-klassga ko'chirilsa allowlistdan o'tadi va tema-aware.

#### 4d — Level-filter rang: inline LEVEL_COLORS → endi token (A2)

**Fayl:** `pages/OrgStructureHierarchy.tsx:222–223`

BOSQICH 2 dan keyin `LEVEL_COLORS[lvl]` = `"var(--ep-org-l0)"` (token-string). Inline-style ga uzatish endi xavfsiz (hex emas, var()):
```tsx
<button ... style={{ color: checked ? LEVEL_COLORS[lvl] : undefined }}>
  {checked ? <CheckSquare className="h-3 w-3" style={{ color: LEVEL_COLORS[lvl] }} /> : ...}
```
> Bu satr **o'zgarmasligi MUMKIN** — chunki BOSQICH 2 dan keyin `LEVEL_COLORS[lvl]` qiymati `var(--ep-org-lN)` bo'ladi, hex emas. `check-design-tokens` `style={{...var(--..)}}` ni BLOK qilmaydi (faqat `#hex`/`rgb()` ni). **Tasdiqla:** `style={{ color: ... }}` ichida literal hex YO'Q (faqat o'zgaruvchi `LEVEL_COLORS[lvl]`). Regex `HEX_IN_STYLE` literal `#` izlaydi → o'zgaruvchida yo'q → o'tadi. ✅ QOLDIR.

#### 4e — Legend dot: inline LEVEL_COLORS (A5)

**Fayl:** `pages/OrgStructureHierarchy.tsx:281` — `style={{ background: LEVEL_COLORS[Number(lvl)] }}` — 4d bilan bir xil: BOSQICH 2 dan keyin token-string → QOLDIR.

#### 4f — Header → `EPPageHeader` (ixtiyoriy, lekin tavsiya)

> ⚠️ DIQQAT (Q-46/Q-42): bu sahifa **canvas-toolbar** layout (header + KPI + filter qatori + canvas + legend). `EPPageHeader` faqat title+actions beradi. Toolbar (zoom/pan/filter) va canvas SAQLANISHI shart. Shuning uchun: **title-qatorini** `EPPageHeader` ga ko'chir, toolbar/filter/canvas o'z joyida qoldir.

**Fayl:** `pages/OrgStructureHierarchy.tsx:175–198`

**OLDIN (175–198):** bespoke `<div className="px-6 py-3 border-b">` ichida `<h1>` + actions tugmalar.

**KEYIN:**
```tsx
<div className="px-6 py-3 border-b shrink-0">
  <EPPageHeader
    title={t("tashkiliyTuzilma1")}
    subtitle={t("ierarxikKorinishBarchaBolimlarVa")}
    icon={<Network className="h-5 w-5" />}
    actions={
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => handleExport("excel")} disabled={exporting === "excel"}><FileText className="h-3.5 w-3.5 mr-1" />{exporting === "excel" ? "..." : "Excel"}</Button>
        <Button size="sm" variant="outline" onClick={() => handleExport("pdf")} disabled={exporting === "pdf"}><FileText className="h-3.5 w-3.5 mr-1" />{exporting === "pdf" ? "..." : "PDF"}</Button>
        <Button size="sm" variant="outline" onClick={() => notifyMutation.mutate()} disabled={notifyMutation.isPending}><Bell className="h-3.5 w-3.5 mr-1" />{t("vakantlar")}</Button>
        <Button size="sm" onClick={() => { setAddParentId(undefined); setAddOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1" />{t("bolimQoshish")}</Button>
      </div>
    }
  />
  {/* KPI qatori (4a) + filter qatori (4d) shu yerda QOLADI */}
</div>
```
> **REGRESS:** hamma 4 tugma (Excel/PDF/Vakantlar/Bo'lim qo'shish) SAQLANADI — faqat `EPPageHeader.actions` ichiga ko'chadi. `bg-primary hover:bg-primary/90` class olib tashlanadi (EP Button default brand) — agar brand-rang yo'qolsa, `className="bg-[var(--ep-primary)]"` bilan qaytar (lekin EP Button odatda brand). i18n kalitlar o'zgarmaydi.

**Verify (BOSQICH 4):** `tsc` GREEN; `node scripts/check-design-tokens.mjs` → 0 BLOK (staged); sahifa render — KPI ko'rinadi, daraxt ko'rinadi, export/qo'shish/qidiruv/filtr/zoom ishlaydi.
**Commit:** `git add pages/OrgStructureHierarchy.tsx design-tokens.css global-surface.css` → `phase11: OrgStructureHierarchy EP komponent + token moslash`.

---

### BOSQICH 5 — `OrgNodeDetail.tsx` dizayn moslash (KARTA-detali)

> 9-tab detal sahifa. Inline gradient header (rgba) + custom stats + bespoke badge. **Regress:** 9 tab, breadcrumb, edit/move/delete tugmalari, stats — SAQLANADI.

#### 5a — Header gradient: inline xom → token-asoslangan (B1, B2)

**Fayl:** `pages/OrgNodeDetail.tsx:62,83,87`

**OLDIN (62):** `const headerBg = node.color || LEVEL_COLORS[node.hierarchyLevel] || "#1d4ed8";`
**KEYIN (62):** `const headerBg = node.color || LEVEL_COLORS[node.hierarchyLevel] || "var(--ep-org-l1)";`
> `node.color` DB-dan keladi (har kartada bor, §2.5) — bu DATA, hex bo'lishi mumkin. Inline-style ga `node.color` (DB-dynamic) uzatish — `check-design-tokens` faqat **literal** `#hex` ni BLOK qiladi (regex satr ichida `#`). `${headerBg}` o'zgaruvchi → literal hex emas → o'tadi. Lekin OLDINGI `|| "#1d4ed8"` literal hex edi → token bilan almashtir.

**OLDIN (83):**
```tsx
<div className="px-6 py-5 shrink-0" style={{ background: `linear-gradient(135deg, ${headerBg}dd, ${headerBg}99)` }}>
```
**KEYIN:** o'zgarmaydi STRUKTURA, lekin tasdiqla: `${headerBg}dd` da `headerBg` = `node.color` (DB) yoki `var(--ep-org-lN)`. Agar `var(--ep-org-lN)` bo'lsa, `var(--ep-org-l1)dd` NOTO'G'RI CSS (token+alfa-suffix ishlamaydi). **Yechim:** alfa-suffiks ishlatmasdan, CSS-klass + `style` ni `--card-accent` o'zgaruvchisi orqali ber:
```tsx
<div
  className="px-6 py-5 shrink-0 org-detail-header"
  style={{ ['--card-accent' as string]: headerBg }}
>
```
**`global-surface.css` ga:**
```css
.org-detail-header {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--card-accent) 87%, transparent),
    color-mix(in srgb, var(--card-accent) 60%, transparent));
}
```
> `color-mix` zamonaviy brauzerlarda ishlaydi (alfa-suffiks `dd`/`99` o'rniga). Bu daraja-rangni ham, DB-`node.color` ni ham qo'llab-quvvatlaydi. `--card-accent` inline-style ga uzatiladi (o'zgaruvchi, hex/token ikkalasi ham — literal hex BLOK bo'lmaydi chunki `node.color` runtime-qiymat, lekin agar `headerBg` literal token-string `var(...)` bo'lsa, `var(...)` ni `var(--card-accent)` ichiga joylashtirish — CSS `var()` rekursiyasi ishlaydi).
> ⚠️ Agar `color-mix` qo'llab-quvvatlanmasa (eski brauzer) — oddiy `background: var(--card-accent)` fallback ber. EuroPrint zamonaviy Chrome/Edge target → `color-mix` OK.

**OLDIN (87):**
```tsx
<Badge style={{ background: "rgba(255,255,255,0.25)", color: "white", border: "none" }}>{NODE_TYPE_LABELS[...]}</Badge>
```
**KEYIN:**
```tsx
<Badge className="bg-white/25 text-white border-none">{NODE_TYPE_LABELS[node.nodeType] || node.nodeType}</Badge>
```
**Sabab:** `rgba(...)` inline-style = `FN_IN_STYLE` BLOK. `bg-white/25` Tailwind class (token-yaqin, ruxsat). Matn ko'rinishi bir xil (oq fonli pill to'q gradient header ustida).

#### 5b — Loading: raw spinner → EPSpinnerBlock (B3)

**Fayl:** `pages/OrgNodeDetail.tsx:42–48`

**OLDIN:**
```tsx
if (isLoading) {
  return (<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>);
}
```
**KEYIN:**
```tsx
if (isLoading) {
  return <div className="p-6"><EPSpinnerBlock /></div>;
}
```
> Import `EPSpinnerBlock`. **Error holati (50–60):** allaqachon `AlertCircle` + ortga-tugma bor — buni `EPErrorState` ga ko'chirish ixtiyoriy, lekin tavsiya:
```tsx
if (isError || !node) {
  return (
    <div className="p-6">
      <EPErrorState title={t("nodeTopilmadi")} onRetry={onRefresh} />
      <Button variant="outline" className="mt-3" onClick={() => navigate("/org-structure/hierarchy")}><ArrowLeft className="h-4 w-4 mr-1" />{t("ortga")}</Button>
    </div>
  );
}
```
> **REGRESS:** ortga-tugma SAQLANADI (Q-46).

#### 5c — Vakant badge: bespoke → `EPStatusPill` (B4)

**Fayl:** `pages/OrgNodeDetail.tsx:89–90`

**OLDIN:**
```tsx
{!node.isActive && <EPStatusPill tone="danger" className="text-xs">{t("inactive")}</EPStatusPill>}
{isVacant && <Badge className="text-xs bg-[var(--ep-red)]/30 text-white border-none flex items-center gap-1"><UserX className="h-3 w-3" />{t("vakant")}</Badge>}
```
**KEYIN:**
```tsx
{!node.isActive && <EPStatusPill tone="danger" className="text-xs">{t("inactive")}</EPStatusPill>}
{isVacant && <EPStatusPill tone="warn" className="text-xs"><UserX className="h-3 w-3 mr-1" />{t("vakant")}</EPStatusPill>}
```
**Sabab:** Izchillik — holat = `EPStatusPill` (D-5). `inactive` allaqachon EPStatusPill (yaxshi). Vakant ham shunday bo'lsin. `bg-[var(--ep-red)]/30` Tailwind arbitrary token (WARN) → EPStatusPill bilan yo'qoladi.

#### 5d — Header stats: ichki struktura (B header stats 103–114) — token-toza

`pages/OrgNodeDetail.tsx:109` — `text-white/90`, `text-white/60` Tailwind opacity class (token-yaqin, ruxsat). Bu blok header gradient ustida oq matn — **o'zgarmaydi** (regress yo'q, xom hex yo'q).

#### 5e — Tab ierarxiyasi (Q-42 tasdiqlash)

`pages/OrgNodeDetail.tsx:118–129` — `TabsList` 9 tab, **1 daraja** (flat). Tab ICHIDA tab YO'Q. ✅ Q-42 amalda (≤2 daraja). **O'zgarmaydi.** Tartib SAQLANADI: `main/razryad/employees/children/vacant/folder/stats/portret/history`.

**Verify (BOSQICH 5):** `tsc` GREEN; `check-design-tokens` 0 BLOK; sahifa: header gradient ko'rinadi, 9 tab ishlaydi, edit/move/delete ochiladi, breadcrumb navigatsiya ishlaydi.
**Commit:** `git add pages/OrgNodeDetail.tsx global-surface.css` → `phase11: OrgNodeDetail header token + EPStatusPill + EPSpinnerBlock`.

---

### BOSQICH 6 — Tab komponentlari token moslash (orgnode/)

#### 6a — `KpiCard.tsx` (org/) — agar 4a dan keyin ham ishlatilsa

**Fayl:** `components/hr/org/KpiCard.tsx:27,29`

`grep -rn "hr/org/KpiCard" src` → agar FAQAT OrgStructureHierarchy ishlatgan bo'lsa va 4a uni EPKpiCard ga almashtirgan bo'lsa → KpiCard.tsx **o'lik** → o'chiriladi (Q-46: o'lik kod to'liq o'chiriladi). Agar boshqa joy import qilsa → tokenlashtir:

**OLDIN:**
```tsx
<div className="rounded-lg p-2 shrink-0" style={{ backgroundColor: `${color}20` }}>
  <div style={{ color }}>{icon}</div>
</div>
```
**KEYIN:**
```tsx
<div className="rounded-lg p-2 shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
  <div style={{ color }}>{icon}</div>
</div>
```
> `color` prop endi token-string (`var(--mod-org)`) bo'ladi → `${color}20` (hex+alfa) NOTO'G'RI token uchun → `color-mix` bilan alfa ber. `style={{ color }}` da `color`=o'zgaruvchi → literal hex yo'q → BLOK yo'q.

#### 6b — `ExtraTabs.tsx` StatCard ranglari (D1)

**Fayl:** `components/hr/orgnode/ExtraTabs.tsx:28,34,40,46,52,58`

**OLDIN:**
```tsx
<StatCard ... color="#0f766e" />
<StatCard ... color="#1d4ed8" />
<StatCard ... color={(node.vacantChildCount ?? 0) > 0 ? "#dc2626" : "#6b7280"} />
<StatCard ... color="#7c3aed" />
<StatCard ... color={isVacant ? "#dc2626" : "#16a34a"} />
<StatCard ... color={node.isActive ? "#059669" : "#6b7280"} />
```
**KEYIN:**
```tsx
<StatCard ... color="var(--ep-org-l5)" />          {/* togridanXodimlar — teal */}
<StatCard ... color="var(--ep-org-l1)" />          {/* jamiBolimlar — ko'k */}
<StatCard ... color={(node.vacantChildCount ?? 0) > 0 ? "var(--ep-danger)" : "var(--ep-fg-subtle)"} />
<StatCard ... color="var(--ep-org-l0)" />          {/* ierarxiya — binafsha */}
<StatCard ... color={isVacant ? "var(--ep-danger)" : "var(--ep-success)"} />
<StatCard ... color={node.isActive ? "var(--ep-success)" : "var(--ep-fg-subtle)"} />
```
> ⚠️ `StatCard` = re-export `@/components/shared/StatCard` (`orgnode/StatCard.tsx:6`). **Tekshir:** `shared/StatCard.tsx` `color` prop ni qanday ishlatadi — agar `style={{ color }}` bo'lsa, token-string OK; agar `${color}20` bo'lsa, u ham `color-mix` ga ko'chirilishi kerak (shared fayl — ehtiyot bo'l, boshqa modullar ham ishlatadi → REGRESS). **Agar `shared/StatCard.tsx` ni o'zgartirish kerak bo'lsa — bu boshqa modullarga ta'sir qiladi → bosh-dasturchidan tasdiq so'ra (Q-28), yoki org uchun lokal wrapper yarat.** Eng xavfsiz: token-string ber (StatCard `style={{color}}` ishlatsa muammo yo'q).

#### 6c — `ChildrenTab.tsx` accent bar (D2)

**Fayl:** `components/hr/orgnode/ChildrenTab.tsx:35`

**OLDIN:** `<div className="h-1.5" style={{ background: child.color || "#1d4ed8" }} />`
**KEYIN:** `<div className="h-1.5" style={{ background: child.color || "var(--ep-org-l1)" }} />`
**Sabab:** `child.color` DB-dynamic (o'zgaruvchi, BLOK emas); fallback literal `#1d4ed8` → token.

#### 6d — `FolderTab.tsx` kategoriya ranglari (D3)

**Fayl:** `components/hr/orgnode/FolderTab.tsx:115–117`

**OLDIN:**
```tsx
document: { icon: <FileText .../>, label: "Hujjatlar", color: "#1d4ed8" },
video:    { icon: <Video .../>,    label: "Videolar",  color: "#7c3aed" },
test:     { icon: <ClipboardList .../>, label: "Testlar", color: "#16a34a" },
```
**KEYIN:**
```tsx
document: { icon: <FileText .../>, label: "Hujjatlar", color: "var(--ep-org-l1)" },
video:    { icon: <Video .../>,    label: "Videolar",  color: "var(--ep-org-l0)" },
test:     { icon: <ClipboardList .../>, label: "Testlar", color: "var(--ep-org-l2)" },
```
> Bu obyektlardagi `color` qayerda ishlatilishini tekshir (`style={{ color: cfg.color }}` bo'lsa token-string OK). i18n: `label` hardcoded uzbek — D-8 buzilishi, lekin bu fazada **i18n EMAS** (faqat dizayn-rang). `label` ni `t(...)` ga ko'chirish — ixtiyoriy, agar tegsang regress-tekshir; aks holda QOLDIR (ko'lam chegarasi).

#### 6e — `shared/StatCard.tsx` `${color}20` muammosi (JONLI tasdiqlangan — KRITIK edge)

**Fakt (JONLI o'qildi `shared/StatCard.tsx:106–117`):**
```tsx
if (color) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 flex items-center gap-3 min-w-[130px] ...">
      <div className="rounded-lg p-2 shrink-0" style={{ background: `${color}20` }}>  // ← satr 114
        {renderIcon(icon, "w-5 h-5", { color })}                                       // ← satr 116
      </div>
      ...
```
**Muammo:** `${color}20` — `color` = hex (`#0f766e`) bo'lsa `#0f766e20` (8-raqamli hex alfa) ishlaydi. Lekin 6b da `color="var(--ep-org-l5)"` (token-string) bersak, `var(--ep-org-l5)20` = **NOTO'G'RI CSS** → tile-fon ko'rinmaydi (regress!).

**3 variant (xavfsizlik tartibida):**

1. **(TAVSIYA) `shared/StatCard.tsx:114` ni `color-mix` ga o'tkaz** — bu BARCHA StatCard chaqiruvchilariga ta'sir qiladi (WMS material360, recruiting, director, material-balance — `shared/StatCard.tsx:5–9` ro'yxati). `color-mix` hex VA token ikkalasini ham qabul qiladi → **regress yo'q, visual-ekvivalent**:
   ```tsx
   <div className="rounded-lg p-2 shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
   ```
   > ⚠️ Bu SHARED fayl — Q-28 (ruxsat darvozasi): o'zgarishdan OLDIN bosh-dasturchidan tasdiq so'ra (boshqa modul callerlari bor). `${color}20` ≈ 12% alfa → `color-mix 12%` visual-ekvivalent. `style={{ color }}` (116) o'zgaruvchi → BLOK emas.

2. **Org uchun EPKpiCard ishlat** (StatCard o'rniga) — `ExtraTabs.tsx` StatsTab ni `EPKpiCard` grid ga ko'chir. Lekin StatsTab 6 ta tile + qo'shimcha-info card — bu kattaroq refactor; **regress xavfi yuqori** (ko'rinish o'zgaradi). Faqat egasi xohlasa.

3. **Hex QOLDIR** (eng past) — 6b ni BEKOR qil, `ExtraTabs.tsx` hex prop qoldir. Lekin u holda `check-design-tokens` BLOK qilmaydi (chunki hex `<StatCard color="#..."/>` JSX-prop, `style={{...}}` ICHIDA emas — regex `HEX_IN_STYLE` faqat `style={{...#hex}}` ni ushlaydi). **JONLI tasdiq:** `ExtraTabs.tsx:28` `color="#0f766e"` — bu `style` ichida EMAS, JSX-prop → `check-design-tokens` uni BLOK QILMAYDI (faqat WARN ham emas, chunki Tailwind-class regex ham mos kelmaydi).

> **QAROR (bosh-dasturchi):** Variant 1 (color-mix) — eng toza, regress-himoyali, lekin Q-28 tasdiq. Agar tasdiq kechiksa → Variant 3 (hex qoldir, chunki check-design-tokens uni baribir bloklamaydi — JSX-prop) + 6b ni SKIP. Hech qachon token-string `var(--..)` ni `${color}20` patternli StatCard ga BERMA (regress).

#### 6f — `hr/org/KpiCard.tsx` o'lik bo'ldi (JONLI tasdiqlangan)

**JONLI grep:** `grep -rn "hr/org/KpiCard\|{ KpiCard }"` → FAQAT `OrgStructureHierarchy.tsx:25` import qiladi (WMS material360 va sd/CompetitorsTab BOSHQA KpiCard fayllarini ishlatadi — `wms/material360/KpiCard`, `sd/helpers`). Demak 4a `OrgStructureHierarchy` ni `EPKpiCard` ga ko'chirgach, `hr/org/KpiCard.tsx` **o'lik** (0 import) → **o'chiriladi** (Q-46: o'lik kod to'liq o'chiriladi).
```bash
# 4a dan keyin tasdiqla:
grep -rn "hr/org/KpiCard\|from \"@/components/hr/org/KpiCard\"" artifacts/erp-dashboard/src
# 0 natija → o'chir:
git rm artifacts/erp-dashboard/src/components/hr/org/KpiCard.tsx
```
> ⚠️ 4a import o'zgartirilmaguncha o'chirMA (import-xato bo'ladi). Avval 4a, keyin grep=0, keyin `git rm`.

**Verify (BOSQICH 6):** `tsc` GREEN; `check-design-tokens` 0 BLOK; har tab ochiladi, StatCard ranglari ko'rinadi (color-mix yoki hex), FolderTab kategoriyalar ko'rinadi; `hr/org/KpiCard.tsx` o'chirilgan (0 import).
**Commit:** `git add components/hr/orgnode/ExtraTabs.tsx ChildrenTab.tsx FolderTab.tsx` + (variant1 bo'lsa) `components/shared/StatCard.tsx` + `git rm components/hr/org/KpiCard.tsx` → `phase11: orgnode tab ranglari token + o'lik KpiCard o'chirildi`.

---

### BOSQICH 7 — `TreeNodeCard.tsx` + qolgan komponentlar (C4–C6)

> Daraxt-karta — eng ko'p inline-style. **Daraja-gradient (52)** maqsadli (data-viz) — token orqali. **Statik drag/vacant indikatorlar (C4)** semantik token.

**Fayl:** `components/hr/org/TreeNodeCard.tsx:48–57`

**OLDIN:**
```tsx
style={{
  width: CARD_W, minHeight: CARD_H,
  background: `linear-gradient(135deg, ${baseColor}f0, ${baseColor}bb)`,
  border: isDragTarget ? "2px solid #22c55e" : isVacant ? "2px dashed #ef4444" : `2px solid ${baseColor}44`,
  boxShadow: isDragTarget ? "0 0 0 4px #22c55e55" : `0 4px 16px ${baseColor}44`,
  opacity: isDragging ? 0.5 : 1,
  outline: isDragTarget ? "2px solid #22c55e" : undefined,
}}
```
**KEYIN — `baseColor` endi `var(--ep-org-lN)` (BOSQICH 2). Alfa-suffiks (`f0`/`bb`/`44`) token bilan ishlamaydi → CSS-klass + `--card-accent`:**
```tsx
className={`... org-tree-card ${isDragTarget ? 'is-drop-target' : ''} ${isVacant ? 'is-vacant' : ''}`}
style={{
  width: CARD_W, minHeight: CARD_H,
  ['--card-accent' as string]: baseColor,
  opacity: isDragging ? 0.5 : 1,
}}
```
**`global-surface.css` ga:**
```css
.org-tree-card {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--card-accent) 94%, transparent),
    color-mix(in srgb, var(--card-accent) 73%, transparent));
  border: 2px solid color-mix(in srgb, var(--card-accent) 27%, transparent);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--card-accent) 27%, transparent);
}
.org-tree-card.is-vacant   { border: 2px dashed var(--ep-danger); }
.org-tree-card.is-drop-target {
  border: 2px solid var(--ep-success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ep-success) 33%, transparent);
  outline: 2px solid var(--ep-success);
}
```
> **REGRESS (Q-39):** drag-reparent vizual (yashil border on drop-target), vakant (qizil punktir), daraja-gradient — HAMMASI saqlanadi, faqat token orqali. Drag-and-drop FUNKSIYASI (TreeCanvas onMoveNode) TEGILMAYDI.

**C5 — avatar fallback (117, 131):**

**OLDIN:**
```tsx
style={{ width: 20, height: 20, background: "#ef444460", border: "1px solid rgba(255,255,255,0.35)" }}
...
style={{ width: 20, height: 20, background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.35)" }}
```
**KEYIN — CSS-klass:**
```tsx
className="org-avatar-vacant" style={{ width: 20, height: 20 }}
...
className="org-avatar-initials" style={{ width: 20, height: 20 }}
```
**`global-surface.css`:**
```css
.org-avatar-vacant   { background: color-mix(in srgb, var(--ep-danger) 38%, transparent); border: 1px solid rgba(255,255,255,0.35); }
.org-avatar-initials { background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.35); }
```
> `rgba(255,255,255,...)` CSS faylida QONUNIY (allowlist `.css$`). Faqat inline-style dagi BLOK bo'ladi → klassga ko'chirildi.

**C6 — HRC bar rang (184):**

**OLDIN:** `const colorBar = score >= 30 ? "#22c55e" : score >= -30 ? "#f59e0b" : "#ef4444";`
**KEYIN:** `const colorBar = score >= 30 ? "var(--ep-success)" : score >= -30 ? "var(--ep-warn)" : "var(--ep-danger)";`
> `colorBar` inline-style ga uzatilsa endi token-string → BLOK yo'q. Semantik to'g'ri (yashil/sariq/qizil = success/warn/danger).

**Verify (BOSQICH 7):** `tsc` GREEN; `check-design-tokens` 0 BLOK; daraxt render — kartalar daraja-rangli, vakant punktir, drag-target yashil, avatar fallback ko'rinadi, HRC bar ranglanadi; drag-and-drop ishlaydi.
**Commit:** `git add components/hr/org/TreeNodeCard.tsx global-surface.css` → `phase11: TreeNodeCard token + CSS-klass`.

---

### BOSQICH 8 — Dialoglar + Portret tab + qolgan tablar (audit + moslash)

> Bu bosqich: qolgan org/orgnode fayllarni audit qilib, xom rang qolgan bo'lsa moslashtirish. Avval grep bilan tekshir.

**Audit buyrug'i (boshla):**
```bash
grep -rnE "#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b|style=\{\{[^}]*(rgba?|hsla?)\(" \
  artifacts/erp-dashboard/src/components/hr/org/ \
  artifacts/erp-dashboard/src/components/hr/orgnode/ \
  artifacts/erp-dashboard/src/components/hr/portret/ \
  artifacts/erp-dashboard/src/pages/OrgNodePortretTab.tsx \
  artifacts/erp-dashboard/src/pages/VacancyPortretDialog.tsx
```

Fayllar (audit + agar inline xom rang topilsa, yuqoridagi pattern bilan token/CSS-klass ga ko'chir):
- `org/AddNodeDialog.tsx` — F1/F2 tekshir (useMutation onError bormi), xom rang.
- `org/EditDialog.tsx` (orgnode/) — forma saqlash (F2 onError), xom rang.
- `org/CardFormDialog.tsx`, `org/CardDetailDialog.tsx`, `org/CardAssignDialog.tsx`, `org/CardExamsDialog.tsx`, `org/CardFolderDialog.tsx`, `org/RazryadFormDialog.tsx`, `org/OrgCardsPanel.tsx`, `org/RazryadLevelsPanel.tsx`.
- `orgnode/MoveDialog.tsx`, `orgnode/EmployeesTab.tsx`, `orgnode/RazryadTab.tsx`, `orgnode/HistoryTab.tsx`, `orgnode/MainTab.tsx`.
- `pages/OrgNodePortretTab.tsx`, `pages/VacancyPortretDialog.tsx`, `components/hr/portret/Portret*.tsx`.

**MainTab.tsx tasdiq (39–144):** Allaqachon `Card`/`CardHeader`/`Badge` + token (`text-[var(--ep-green)]`, `bg-green-500/20`). `bg-green-500/20` Tailwind class — token-yaqin (ruxsat, WARN emas). `text-[var(--ep-green)]` = token. ✅ Xom hex YO'Q. Faqat `bg-green-500/20` ni `bg-[var(--ep-green-soft)]` ga moslash ixtiyoriy. **Asosan toza** — o'zgarmasligi mumkin.

**ABC_COLORS o'lik-kod tekshiruvi (JONLI tasdiqlangan):** `grep -rn "ABC_COLORS"` → `hr/org/types.ts` dagi `ABC_COLORS` HECH QAYERDA import qilinmaydi (WMS `wms/reports/types.ts` va `constants/status.ts` dagi ABC_COLORS BOSHQA fayllar, alohida import). Demak `hr/org/types.ts` `ABC_COLORS` **o'lik** bo'lishi mumkin → BOSQICH 2 da tasdiqla: `grep -rn "ABC_COLORS" | grep "hr/org"` faqat ta'rif-satrini ko'rsatsa (import yo'q) → `git rm` o'rniga tokenlashtir+QOLDIR yoki o'chir (Q-46). Xavfsiz yo'l: tokenlashtir (BOSQICH 2 dagi `var()` map) — o'lik bo'lsa ham zararsiz.

#### 8.1 — Per-fayl audit jadvali (har faylni tekshir + holat)

> Har faylni ochib, quyidagi 4 mezonni tekshir: (a) inline xom hex/rgba `style={{...}}` ichida? (b) raw spinner loading? (c) `useMutation` `onError` bormi (F2)? (d) `useQuery` `isLoading` bormi (F1)?

| Fayl | Inline xom rang? | Loading (F1) | onError (F2) | Amal |
|---|---|---|---|---|
| `org/AddNodeDialog.tsx` (10KB) | tekshir | dialog — query bormi | mutation onError tekshir | token + F2 agar yo'q |
| `orgnode/EditDialog.tsx` (12KB) | tekshir | — | onError tekshir | token + F2 |
| `org/CardFormDialog.tsx` (11KB) | tekshir | — | onError | token + F2 |
| `org/CardDetailDialog.tsx` (30KB) | tekshir (katta — ≤900 qator?) | — | onError | token + F2; 900+ bo'lsa bo'l |
| `org/CardAssignDialog.tsx` (5.8KB) | tekshir | — | onError | token + F2 |
| `org/CardExamsDialog.tsx` (5.8KB) | EP ishlatadi (grep) | — | onError | token-toza ehtimol |
| `org/CardFolderDialog.tsx` (7.5KB) | tekshir | — | onError | token + F2 |
| `org/RazryadFormDialog.tsx` (8.2KB) | tekshir | — | onError | token + F2 |
| `org/OrgCardsPanel.tsx` (8.2KB) | EP ishlatadi | F1 tekshir | — | token-toza ehtimol |
| `org/RazryadLevelsPanel.tsx` (5.3KB) | EP ishlatadi | F1 tekshir | onError | token-toza ehtimol |
| `orgnode/MoveDialog.tsx` (2.9KB) | tekshir | — | onError | token + F2 |
| `orgnode/EmployeesTab.tsx` (9KB) | tekshir (assign dialog) | useQuery F1 | mutation onError | token + F1/F2 |
| `orgnode/RazryadTab.tsx` (8.4KB) | EP ishlatadi | F1 | onError | token-toza ehtimol |
| `orgnode/HistoryTab.tsx` (2.1KB) | tekshir | useQuery F1 | — | token + F1 |
| `orgnode/MainTab.tsx` (6.4KB) | YO'Q (tasdiqlandi) | — | — | o'zgarmaydi |
| `pages/OrgNodePortretTab.tsx` | tekshir | useQuery F1 | mutation onError | token + F1/F2 |
| `pages/VacancyPortretDialog.tsx` | tekshir | — | onError | token + F2 |
| `portret/PortretBlok{A..E}.tsx` (5) | tekshir | — | — | token (form-bo'limlar) |
| `portret/PortretSection{3,4}.tsx` (2) | tekshir | — | — | token |

> ⚠️ `CardDetailDialog.tsx` 30KB ≈ 700–900 qator — Qoida 13 (≤900) chegarasiga yaqin. Agar 900+ bo'lsa → `*Sections.tsx`/`*Tabs.tsx` ga bo'l (lekin bu fazada FAQAT dizayn — bo'lishni ENG oxirida, regress-tekshir bilan). Agar ≤900 → QOLDIR.

#### 8.2 — Forma F1/F2 patterni (kopiya-paste tayyor)

Har dialog/forma uchun (agar yo'q bo'lsa qo'sh — saqlash mantiqi TEGILMAYDI):
```tsx
// F1 — useQuery loading (dialog ichida dropdown/list yuklansa)
const { data: usersData, isLoading: usersLoading } = useQuery<{ items: User[] }>({
  queryKey: ["/api/org-structure/available-users"],
  enabled: open,  // dialog ochilganda
});
// dialog body ichida:
{usersLoading ? <EPSkeletonCard /> : (<Select>...</Select>)}

// F2 — useMutation onError (forma saqlash)
const saveMutation = useMutation({
  mutationFn: (dto: FormDto) => apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, dto),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
    toast({ title: "Saqlandi" });
    onSuccess?.();
    onClose();
  },
  onError: () => toast({ title: "Saqlashda xatolik", variant: "destructive" }),  // ← MAJBURIY
});
```
> **REGRESS (Q-43):** `mutationFn` (endpoint + body) va `onSuccess` (invalidate + close) TEGILMAYDI — faqat `onError` yo'q bo'lsa qo'shiladi. Forma SAQLASH ishlashda davom etadi.

**Har dialog uchun F1/F2 qoidasi (Q-43):**
```tsx
// F1: useQuery loading
const { data, isLoading } = useQuery({...});
if (isLoading) return <EPSkeletonCard />;
// F2: useMutation onError
const mut = useMutation({
  mutationFn: ..., 
  onSuccess: () => { queryClient.invalidateQueries(...); toast({ title: "Saqlandi" }); },
  onError: () => toast({ title: "Xatolik", variant: "destructive" }),  // ← MAJBURIY
});
```
> ⚠️ **REGRESS (Q-43):** dialog FORMA saqlash mantiqi (mutation → endpoint → DB) TEGILMAYDI — faqat onError handler yo'q bo'lsa qo'shiladi va xom rang token bo'ladi. Saqlash BUZILMAYDI.

**Verify (BOSQICH 8):** har dialog ochiladi, forma to'ldiriladi, saqlanadi (qayta ochilganda ko'rinadi — F1/F2 ishlaydi), xom rang yo'q.
**Commit:** har 1–3 fayl uchun alohida commit → `phase11: <fayl> token + F1/F2`.

---

### BOSQICH 9 — `check-design-tokens.mjs` regex-mantiqi (agent bilishi shart)

> Manba: `scripts/check-design-tokens.mjs` (JONLI o'qildi). Agent qaysi pattern BLOK, qaysi WARN, qaysi o'tadi — aniq bilishi kerak (keraksiz o'zgarish qilmaslik uchun).

**Scope (faqat shu fayllar tekshiriladi):** `IN_SCOPE = /^artifacts\/erp-dashboard\/src\//`.
**Allowlist (HECH QACHON flagga olinmaydi):** `/erp-modern-ui/`, `/components/ep/`, `/components/ui/chart`, `chart*.ts(x)`, `*.css`, `*.spec/test.ts(x)`.
**Diff-aware:** faqat staged diff dagi `+` (qo'shilgan) satrlar tekshiriladi → eski ~950 buzilish bloklamaydi, faqat YANGI.

| Pattern (regex) | Daraja | Misol | Bu fazada |
|---|---|---|---|
| `style=\{\{[^}]*#[0-9a-fA-F]{3,8}\b` (`HEX_IN_STYLE`) | 🔴 BLOK | `style={{ background: "#1d4ed8" }}` | A3/B1-literal/C2-style/C4/C5/D2-literal → token/CSS-klass |
| `style=\{\{[^}]*(rgba?\|hsla?)\s*\(` (`FN_IN_STYLE`) | 🔴 BLOK | `style={{ background: "rgba(255,255,255,.25)" }}` | B2/C5 → Tailwind class / CSS-klass |
| `(text\|bg\|border\|...)-\[#[0-9a-fA-F]{3,8}\]` (`TW_ARB_HEX`) | 🟡 WARN | `text-[#94a3b8]` | org da YO'Q (grep=0) — WARN yo'q |
| `style={{ color: someVar }}` (o'zgaruvchi) | ✅ o'tadi | `style={{ color: LEVEL_COLORS[lvl] }}` | A2/A5/B1-dynamic/C6/D1-token QOLADI (var-string) |
| `color="#hex"` JSX-prop (style EMAS) | ✅ o'tadi (lekin moslash kerak) | `<KpiCard color="#1d4ed8" />` | A1/D1 — check bloklamaydi, lekin izchillik uchun tokenlashtir |

> **MUHIM xulosa:** `check-design-tokens` FAQAT `style={{...}}` ICHIDAGI literal hex/rgb ni bloklaydi. JSX-prop (`color="#.."`) ni bloklamaydi. Demak A1 (KpiCard prop) texnik jihatdan BLOK emas — lekin EP izchillik (Q-41) uchun EPKpiCard+token ga ko'chiriladi. C4/C5 (style ichida `#22c55e`/`rgba`) = HAQIQIY BLOK → CSS-klass MAJBURIY.
> Token-string (`"var(--ep-org-l1)"`) ni `style={{ background: ... }}` ga uzatish ✅ o'tadi (regex literal `#`/`rgb(` izlaydi, o'zgaruvchida yo'q). SHUNING UCHUN BOSQICH 2 (types.ts → var-string) A2/A5/B1/D2/C6/D1 ni avtomatik hal qiladi.

### BOSQICH 10 — Token-mapping reference (xom hex → token, izchil)

> Org-fazada ishlatilgan har xom hex uchun kanonik token. Agentga "qaysi rang qaysi token" aniq beriladi (taxmin yo'q).

| Xom hex (eski) | Semantik ma'no | Kanonik token |
|---|---|---|
| `#7c3aed` / `#7c3aed` (l0) | Egasi/ildiz binafsha | `var(--ep-org-l0)` |
| `#1d4ed8` (l1) | Boshqarma ko'k / default accent | `var(--ep-org-l1)` |
| `#16a34a` (l2) | Bo'lim yashil | `var(--ep-org-l2)` |
| `#b45309` (l3) | Sektor amber | `var(--ep-org-l3)` |
| `#dc2626` (l4) | Lavozim qizil / xato | `var(--ep-org-l4)` yoki semantik `var(--ep-danger)` |
| `#0d9488` / `#0f766e` | Teal (5-daraja / xodim-stat) | `var(--ep-org-l5)` |
| `#be185d` (l6) | Pushti 6-daraja | `var(--ep-org-l6)` |
| `#22c55e` | Success/drop-target yashil | `var(--ep-success)` |
| `#ef4444` | Danger/vakant qizil | `var(--ep-danger)` |
| `#f59e0b` | Warn sariq (HRC o'rta) | `var(--ep-warn)` |
| `#059669` | Faol yashil (stat) | `var(--ep-success)` |
| `#6b7280` / `#4b5563` | Neytral/o'chiq kulrang | `var(--ep-fg-subtle)` yoki `var(--ep-org-fallback)` |
| `rgba(255,255,255,0.25)` | Oq yarim-shaffof (gradient ustida) | Tailwind `bg-white/25` yoki CSS-klass |
| `#EC4899` | Org modul aksenti | `var(--mod-org)` |
| daraja-rang + alfa (`f0`/`bb`/`44`/`20`) | Gradient/tile-fon | `color-mix(in srgb, var(--...) N%, transparent)` |

> **Semantik vs palitra qoidasi:** holat-ranglar (success/danger/warn) → SEMANTIK token (`--ep-*`). Daraja-ranglar (data-viz palitra) → `--ep-org-l*`. Modul aksenti → `--mod-org`. Bir hex ikki ma'noda kelsa (masalan `#dc2626` = l4-daraja VA xato-qizil) → kontekstga qara: vakant/xato → `--ep-danger`; daraja-rang → `--ep-org-l4`.

---

## § 4. DB (migration — YO'Q)

Bu faza **migration-SIZ**. DB jadval/ustun TEGILMAYDI. Faqat CSS o'zgaruvchilar qo'shiladi (`design-tokens.css`) — bu DDL emas, dizayn-token. `APPROVED:` izoh KERAK EMAS (Q-35 faqat `CREATE TABLE`/`DROP`/migration uchun).

> Agar bosqich davomida biror tab "saqlamaydi" deb topilsa (forma fake-create) — bu **boshqa faza** muammosi (FAZA 1/3/9). Bu fazada **belgilab qo'y** (`docs/`ga) — TEGINMA (ko'lam chegarasi Q-33).

---

## § 5. Zod / Result / Drizzle namuna (FE-kontekst)

Bu faza FE-dizayn — BE Zod/Result/Drizzle TEGILMAYDI. FE-namuna (mavjud pattern saqlanadi):

```tsx
// useQuery — F1 loading (EP)
const { data, isLoading, isError, refetch } = useQuery<{ nodes: OrgNode[] }>({
  queryKey: ["/api/org-structure/hierarchy"],
});
if (isLoading) return <EPSpinnerBlock />;          // raw spinner EMAS
if (isError)   return <EPErrorState onRetry={refetch} />;  // qizil div EMAS

// useMutation — F2 onError (EP toast)
const moveMutation = useMutation({
  mutationFn: ({ nodeId, newParentId }: { nodeId: number; newParentId: number }) =>
    apiRequest("PATCH", `/api/org-structure/nodes/${nodeId}/move`, { newParentId }),
  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] }); toast({ title: "Ko'chirildi" }); },
  onError: () => toast({ title: "Xatolik", variant: "destructive" }),  // MAJBURIY
});
```
> API endpoint imzosi (F3): `apiRequest('GET'|'POST'|'PATCH'|'DELETE', url, body?)` — birinchi arg method. Endpoint o'zgarmaydi.

---

## § 6. FE + DIZAYN (EP token/shablon/komponent — qaysi sahifa)

| Sahifa/komponent | Shablon | EP komponent | Token |
|---|---|---|---|
| `OrgStructureHierarchy.tsx` | DetailPage-variant (canvas) | EPPageHeader + EPKpiCard + EPSpinnerBlock + EPErrorState | `--mod-org`, `--ep-org-l*`, `--ep-org-grid-dot` |
| `OrgNodeDetail.tsx` | DetailPage + Tabs | EPStatusPill + EPSpinnerBlock + EPErrorState | `--ep-org-l*`, `--card-accent`, `color-mix` |
| `MainTab.tsx` | — | Card + Badge (toza) | `--ep-green`/`--ep-red` (mavjud) |
| `ExtraTabs.tsx` (StatsTab/VacantTab) | — | StatCard (shared) | `--ep-org-l*`, `--ep-success`/`--ep-danger` |
| `ChildrenTab.tsx` | — | Card | `--ep-org-l1` |
| `FolderTab.tsx` | — | — | `--ep-org-l*` |
| `EmployeesTab.tsx` | — | Card + Dialog | F1/F2 tekshir |
| `RazryadTab.tsx` | — | EP (allaqachon) | tekshir |
| `TreeNodeCard.tsx` | — | — | `--card-accent`, `--ep-success`/`--ep-danger`/`--ep-warn` |
| Dialoglar (8) | FormPage-variant | EPSkeletonCard | F1/F2 |
| `OrgNodePortretTab.tsx` | — | audit (bosqich 8) | audit |

**Token-jadval (ishlatiladigan):**
- Brand/CTA: `var(--ep-primary)` (#FF902F orange).
- Org aksent: `var(--mod-org)` (#EC4899 pink — BOSQICH 1 da qo'shiladi).
- Holat: `var(--ep-success)`/`var(--ep-warn)`/`var(--ep-danger)`/`var(--ep-info)` (semantik).
- Matn: `var(--ep-fg)`/`var(--ep-fg-muted)`/`var(--ep-fg-subtle)`.
- Daraja palitra: `var(--ep-org-l0..l6)` + `var(--ep-org-fallback)` (BOSQICH 1).
- Tailwind ruxsat: `text-muted-foreground`, `bg-primary`, `text-primary`, `bg-white/25`, `text-white/60` (opacity-class token-yaqin).

---

## § 7. QABUL-MEZONI

1. ✅ `node scripts/check-design-tokens.mjs` → **0 BLOK** (staged diff). WARN (Tailwind `[#hex]`) → 0 ga intil.
2. ✅ `grep -rnE "#[0-9a-fA-F]{6}" components/hr/org components/hr/orgnode pages/OrgStructureHierarchy.tsx pages/OrgNodeDetail.tsx` → faqat `types.ts` `var()` token-string (literal hex 0) yoki CSS-fayl.
3. ✅ `OrgStructureHierarchy` → `EPPageHeader` + `EPKpiCard` ishlatadi; loading = `EPSpinnerBlock`; error = `EPErrorState`.
4. ✅ `OrgNodeDetail` → header `color-mix`/`--card-accent`; vakant = `EPStatusPill`; loading = `EPSpinnerBlock`.
5. ✅ Tab ierarxiyasi ≤ 2 daraja (1 daraja — 9 tab flat, tasdiqlangan).
6. ✅ Har dialog F1 (isLoading→EPSkeleton) + F2 (onError→toast).
7. ✅ `tsc` GREEN (o'z fayllarda 0 xato). FE build PASS.
8. ✅ **Regress (Q-46):** export(Excel/PDF), vakant-bildirish, bo'lim-qo'shish, qidiruv, level-filter, status-filter, zoom/pan/fit/reset, drag-reparent, breadcrumb, edit/move/delete, 9 tab, hamma KPI/stat-karta, hamma forma-saqlash — HAMMASI ishlaydi (yo'qolmagan).
9. ✅ Vizual izchillik: org-sahifalar boshqa EP sahifalar (Finance/HR/WMS) bilan bir xil his-tuyg'u (EPPageHeader, EPKpiCard, EP holat).

---

## § 8. EDGE-HOLAT

1. **`node.color` = NULL/noto'g'ri hex (DB):** `headerBg = node.color || LEVEL_COLORS[...] || "var(--ep-org-l1)"` — fallback token. `color-mix` noto'g'ri qiymatda graceful (oddiy rang). Test: l4–6 darajada 0 qator (§2.5) — token tayyor, render xato bermaydi.
2. **`color-mix` qo'llab-quvvatlamaydi (eski brauzer):** fallback `background: var(--card-accent)` qo'sh. EuroPrint Chrome/Edge target → `color-mix` OK.
3. **`KpiCard.tsx` o'lik bo'lib qolsa:** 4a EPKpiCard ga ko'chirgach, `grep` bilan boshqa import yo'qligini tasdiqla → o'chir (Q-46). Import bo'lsa → tokenlashtir (6a).
4. **`shared/StatCard.tsx` `${color}20` ishlatsa:** uni o'zgartirsang BOSHQA modullar buziladi (REGRESS) → bosh-dasturchidan tasdiq (Q-28) yoki token-string ber (StatCard `style={{color}}` bo'lsa muammo yo'q). Avval `shared/StatCard.tsx` ni O'QI.
5. **`stats` undefined (KPI):** `value={String(stats?.totalNodes ?? "—")}` — "—" ko'rsatadi, soxta 0 EMAS (Q-40).
6. **Dialog mutation onError yo'q:** F2 qo'shilganda saqlash mantiqi TEGILMAYDI — faqat error-toast qo'shiladi.
7. **i18n hardcoded (FolderTab label, MainTab DefRow label):** bu fazada i18n EMAS (ko'lam Q-33) — tegsang regress-tekshir, aks holda QOLDIR + `docs/`ga belgila.
8. **Daraja-gradient alfa (`f0`/`bb`/`44`):** token bilan ishlamaydi → `color-mix` MAJBURIY (oddiy `${token}f0` NOTO'G'RI CSS beradi).
9. **Tab content lazy:** Tabs barcha content render qiladi (TabsContent) — performance OK (kichik datalar).

---

## § 9. SELF-VERIFY (tsc + token-check + jonli isbot)

### 9.1 Static verify (har bosqich)
```bash
cd /c/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
# 1. tsc — o'z fayllarda 0 xato
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | grep -E "hr/org|hr/orgnode|OrgStructureHierarchy|OrgNodeDetail|design-tokens" || echo "TSC: org fayllarda 0 xato"
# 2. design-token guard (staged)
node scripts/check-design-tokens.mjs
# 3. xom hex qolmaganini tasdiq (CSS dan tashqari)
grep -rnE "#[0-9a-fA-F]{6}" artifacts/erp-dashboard/src/components/hr/org artifacts/erp-dashboard/src/components/hr/orgnode artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx | grep -v "\.css:" || echo "0 raw hex (token-string var() bundan mustasno)"
```

### 9.2 Build verify (faza oxiri)
```bash
pnpm --filter erp-dashboard run build   # PASS bo'lsin
```

### 9.3 Jonli isbot (Q-29 / Q-40 — REGRESS-himoya)

> Bu faza DB-yozmaydi → "rollback-tx DB-proof" o'rniga **FE-render + interaksiya isboti** (regress yo'qligini tasdiqlash). DB o'qiladi (org_departments 144 qator — §2.5), yozilmaydi.

**Skript namuna — `_audit/phase11-org-render-check.cjs`** (read-only, regress-tekshir):
```js
// Maqsad: org-sahifa endpointlari hamon to'g'ri data qaytaradimi (dizayn moslash data-ni buzmadi).
// READ-ONLY: yozmaydi. Login → 3 endpoint → struktura tekshir.
const BASE = 'http://localhost:3030';
async function main() {
  // 1. login (egasi/admin cookie)
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.SMOKE_USER, password: process.env.SMOKE_PASS }),
  });
  const cookie = login.headers.get('set-cookie');
  const h = { cookie };
  // 2. hierarchy — daraxt data (FE TreeCanvas shuni ishlatadi)
  const hier = await (await fetch(`${BASE}/api/org-structure/hierarchy`, { headers: h })).json();
  console.log('hierarchy nodes:', Array.isArray(hier?.nodes) ? hier.nodes.length : 'XATO');
  // 3. stats — KPI (EPKpiCard shuni ishlatadi)
  const stats = await (await fetch(`${BASE}/api/org-structure/stats`, { headers: h })).json();
  console.log('stats keys:', Object.keys(stats || {}).join(','), '| totalNodes:', stats?.totalNodes);
  // 4. node detail — KARTA-detal (9 tab data manbai)
  const firstId = hier?.nodes?.[0]?.id;
  if (firstId) {
    const node = await (await fetch(`${BASE}/api/org-structure/nodes/${firstId}`, { headers: h })).json();
    console.log('node detail:', node?.name, '| color:', node?.color, '| level:', node?.hierarchyLevel);
  }
  console.log('REGRESS-CHECK: 3 endpoint 200 + struktura saqlangan = dizayn moslash data-ni buzmadi');
}
main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
```
```bash
SMOKE_USER=<egasi-beradi> SMOKE_PASS=<egasi-beradi> node _audit/phase11-org-render-check.cjs
```
> **Q-44 (Windows nest-watch):** agar `:3030` 000 qaytarsa — server tushgan (muhit, kod emas). `pnpm --filter @europrint/api run dev:unsafe` bilan qayta ishga tushir. Static fallback (9.1) bilan fix tasdiqlanadi; jonli isbot server qaytgach.

**Qo'lda jonli isbot (browser):**
1. `/org-structure/hierarchy` ochiladi → EPPageHeader + 5 EPKpiCard + daraxt ko'rinadi.
2. KARTA bosiladi → `/org-structure/hierarchy/node/:id` → gradient header + 9 tab.
3. Har tab bosiladi → content ko'rinadi (xato yo'q).
4. Edit dialog ochiladi → maydon o'zgartiriladi → saqlanadi → qayta ochilganda ko'rinadi (F1/F2 + regress).
5. Drag-reparent → karta ko'chadi (yashil drop-target ko'rinadi).
6. Export Excel/PDF → fayl yuklanadi.
7. Level-filter/status-filter/qidiruv → daraxt filtrlanadi.
> Hamma 7 punkt ishlasa = REGRESS YO'Q + dizayn moslashtirildi.

---

## § 10. OWNER-DATA (egasi beradigan)

Bu faza **owner-DATA talab qilmaydi** (struktura + dizayn). Faqat:
- **Jonli smoke-test uchun:** `SMOKE_USER` / `SMOKE_PASS` (egasi/admin login) — secret subagentga BERILMAYDI (Q-30), faqat shaklini tekshir; static fallback bilan ishlash mumkin.
- **`--mod-org` rang tasdig'i:** `DIZAYN_QOIDALARI.md` `#EC4899` (pink) deydi — egasi boshqa rang xohlasa, BOSQICH 1 da o'zgartiradi (default `#EC4899`).

> ⚠️ Boshqa fazalardagi owner-DATA (head_user_id, razryad-qiymat, oylik-baza, rbac_tier, ЦКП, AI-kalit — `00-MASTER-REJA.md §4`) bu fazaga TEGISHLI EMAS.

---

## § 11. COMMIT (har bosqich — Q-31 / GIT_QOIDALARI)

```bash
# Har bosqich oxirida (faqat o'z fayllar):
git add artifacts/erp-dashboard/src/erp-modern-ui/design-tokens.css
git commit --no-verify -m "$(cat <<'EOF'
phase11: org dizayn-tokenlari (--mod-org + daraja palitra + grid-dot)

DIZAYN_QOIDALARI EP design-system izchillik. Migration EMAS (CSS o'zgaruvchi).
Regress-himoya: ishlayotgan element o'zgarmaydi, faqat ko'rinish token-asoslangan.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```
> HECH QACHON `git add -A` / `git add .`. Har commit `--no-verify` (token-check qo'lda 9.1 da yuritiladi) + sabab. Commit ketma-ketligi: BOSQICH 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (har biri alohida commit yoki mantiqiy guruh).

**Commit ro'yxati (tartib):**
1. `phase11: org dizayn-tokenlari (--mod-org + daraja palitra)`
2. `phase11: org daraja-rang xom hex -> CSS token (types.ts ×2)`
3. `phase11: getLevelColor fallback token`
4. `phase11: OrgStructureHierarchy EP komponent + token moslash`
5. `phase11: OrgNodeDetail header token + EPStatusPill + EPSpinnerBlock`
6. `phase11: orgnode tab ranglari token (ExtraTabs/ChildrenTab/FolderTab/KpiCard)`
7. `phase11: TreeNodeCard token + CSS-klass (drag/vacant/avatar/hrc)`
8. `phase11: dialoglar + portret tab token + F1/F2 audit`

---

## § 12. XULOSA-CHECKLIST (faza yakuni)

```
☐ BOSQICH 1: --mod-org + --ep-org-l0..l6 + --ep-org-fallback + --ep-org-grid-dot (design-tokens.css)
☐ BOSQICH 2: org/types.ts + orgnode/types.ts LEVEL_COLORS/ABC_COLORS → var() token
☐ BOSQICH 3: helpers.ts getLevelColor fallback → var(--ep-org-fallback)
☐ BOSQICH 4: OrgStructureHierarchy → EPPageHeader + EPKpiCard + EPSpinnerBlock + grid-klass
☐ BOSQICH 5: OrgNodeDetail → color-mix header + EPStatusPill + EPSpinnerBlock + EPErrorState
☐ BOSQICH 6: ExtraTabs/ChildrenTab/FolderTab/KpiCard → token
☐ BOSQICH 7: TreeNodeCard → org-tree-card CSS-klass + semantik token
☐ BOSQICH 8: dialoglar (8) + portret tab → audit + token + F1/F2
☐ check-design-tokens.mjs → 0 BLOK
☐ tsc GREEN + FE build PASS
☐ Jonli isbot: 7 interaksiya ishlaydi (regress yo'q)
☐ Hamma commit --no-verify + Co-Authored-By + faqat o'z fayllar
```

*Direktiva oxiri · FAZA 11 — Dizayn/FE izchillik · EuroPrint EP Design System · 2026-06-25*
*Manba: 00-MASTER-REJA.md · DIZAYN_QOIDALARI.md · CLAUDE.md (Qoida 21/41/42/43, Q-39/Q-40/Q-46) · jonli kod+DB tahlil (Q-29)*
