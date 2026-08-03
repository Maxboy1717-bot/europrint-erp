# MASSIV CLEANUP — to'liq vizyon-oldi tozalash direktivasi (Q-47: ≥1000 qator)

> Advisor (Claude) → Executor (Muslimbek). Egasi 2026-06-17: **vizyon-build'dan OLDIN hamma tozalash/tuzatish —
> MASSIV** (avtonom, modul-modul, sahifa-ba-sahifa so'rab o'tirmasdan). BITTA executor (Qoida 23). Self-verify =
> darvoza; advisor HAR modul/fazani qayta tekshiradi (verify-don't-trust shu sessiyada ko'p over-claim ushladi).
> Manba: PROBLEM-REGISTRY-2026-06-17, 503-sweep, design-consistency audit, i18n, ORG/recruiting.
>
> Bu direktiva ATAYIN to'liq va uzun (Q-47). Hech qanday noaniqlik qoldirmaslik uchun har bosqich, har modul,
> har pattern, kod misoli, standart API, qabul-mezoni va self-verify qadami yozilgan. Ketma-ket o'qib, fazama-faza
> bajar. Har MODUL oxirida commit + qisqa hisobot → advisor tasdiqlaydi → keyingi modul.

---

## 0. ROLLAR VA UMUMIY PRINTSIP

- Sen **EXECUTOR (🟢)** — yagona, ketma-ket quruvchi. Boshqa hech kim shu repoda kod yozmaydi (Qoida 23).
- Advisor (Claude) = nazoratchi: kod yozmaydi, faqat tekshiradi + direktiva beradi. Egasi = qaror.
- Bu massiv cleanup'ning maqsadi: **vizyon-build uchun TOZA, IZCHIL, ISHLAYDIGAN poydevor**. Vizyon (intervyu
  bo'yicha qurish) keyin boshlanadi — hozir uni boshlama.
- ⭐ **Ranglar/dizayn = sizning EP standartingiz** (egasi belgilagan, Q-41). Yangi dizayn o'ylab topma — mavjud
  EP-tizimni (token + komponent + shablon) **izchil qo'lla**.

---

## 1. QOIDALAR BLOKI (har fazada amal qil — to'liq)

### 1.1 Kod hayoti (Q-46) — ENG MUHIM
- ✅ **Ishlab turgan (to'g'ri ishlaydigan) kod HECH QACHON o'chirilmaydi.** Dizayn moslash / refactor / "tozalash"
  bahonasida ham YO'Q. Har statistika kartasi, tugma, feature, ma'lumot maydoni, endpoint, hook — ishlayotgan
  bo'lsa, **qoladi**. Dizayn moslash = **faqat ko'rinish**; mazmun/funksiya **o'chmaydi**.
  - ⚠️ ANTI-PATTERN (TAQIQ): "9 ta statistikani 5 taga qisqartirdim" — bu ishlab turgan 4 narsani O'CHIRISH =
    Q-46 buzilishi. To'g'risi: 9 tasini ham QOLDIR, faqat ixcham/bir xil ko'rinishga keltir.
- ❌ **To'g'ri ISHLAMAYDIGAN kod TO'LIQ o'chiriladi:** yarim-ishlaydigan, soxta (fake/echo/hardcoded javob),
  crash beradigan, o'lik (de-routed/orphan), dublikat. Buzuq kodni "saqlab qo'yish" yoki chala holatda qoldirish
  TAQIQ — **yo to'g'irla, yo butunlay o'chir** (oraliq holat yo'q).
  - O'chirishdan OLDIN majburiy: (a) kod haqiqatan ishlamasligini jonli tasdiqla (Q-29 — DB/runtime proof),
    (b) boshqa joy import/route qilmasligini grep bilan tekshir (Q-39 regress himoyasi).
- O'lchov (Q-40): "ishlaydimi VA to'g'rimi?" → ha → saqla; yo'q → to'liq o'chir yoki to'g'irla, **chala emas**.

### 1.2 Regress taqiq (Q-39)
- O'zgarishdan keyin avval ishlagan narsa hamon ishlashi shart. Drag-drop, mutatsiya, dialog, event, WS, route —
  hammasi ishlashda davom etadi. Har modul oxirida tekshiriladi.
- O'chirilgan (de-routed) narsa QAYTA yaratilmaydi; ishlayotgan funksiya egasi ruxsatisiz o'zgartirilmaydi.

### 1.3 DDL = egasi ruxsati (Q-35)
- Yangi `CREATE TABLE` / `ALTER` → AVVAL SQL'ni egaga ko'rsat (`-- APPROVED: owner ...` izoh). Egasi "ha"
  demaguncha ishga tushirma. Bu cleanup'da DDL deyarli kerak emas (P1 dan tashqari — u ham ko'rsatiladi).

### 1.4 Tegilmaydigan zonalar
- `payroll-closure` GL, `gl-posting.service`, `entries` ledger — #10'da hardening qilingan, TEGMA.
- `gl_journal_entries` / `gl_lines` — SAP#76, TEGMA.
- Aisha (`modules/aisha`) — #15'da qilingan, faqat crash/fake bo'lsa.
- `dizayn-new/AppSidebar.tsx` — O'LIK re-export (jonli sidebar = `components/sidebar/constants.ts`). Top-nav/sidebar
  ishi uchun JONLI komponentni top.

### 1.5 Commit / fayl xavfsizligi
- `git add <aniq-fayl>` faqat — HECH QACHON `git add -A`/`.` (boshqa ishni supurib ketadi).
- Log fayllar (`backend.log*`, `*.log.*`) HECH QACHON commit qilinmaydi (Q-45).
- Har MODUL = bitta commit (har sahifa emas). Commit xabari aniq: `style(<modul>): EP standartga keltirildi` /
  `fix(<modul>): ...`.

### 1.6 Tekshiruv darvozalari (har modul/faza)
- `pnpm --filter @europrint/api exec tsc --noEmit` = 0 (BE tegsa); FE `tsc --noEmit` = 0.
- `node scripts/check-design-tokens.mjs` PASS (xom inline rang yo'q).
- `node scripts/check-sidebar-routes.mjs` PASS (sidebar→yo'q-sahifa yo'q).
- BE tegsa: `node scripts/golden-thread-chain-proof.cjs` exit 0; health 200; login 401/422.
- Q-46: o'zgartirilgan sahifada HECH NARSA o'chmaganini tasdiqla (mazmun/feature/tugma soni avvalgidek).

### 1.7 Self-verify = darvoza (Q-38)
- Har modulni tugatib → tekshiruvlarni o'zing yugurt → commit → qisqa hisobot (nima o'zgardi, nima SAQLANDI,
  commit hash, proof). Advisor o'sha modulni tekshirmaguncha keyingisiga o'tma (advisor "OK" bersa davom).

---

## 2. EP DIZAYN STANDARTI (kanonik ma'lumotnoma — P4 da shuni qo'llaysan)

Bu — hamma sahifa kelishi kerak bo'lgan YAGONA standart. Komponentlar `artifacts/erp-dashboard/src/components/ep/`
da, tokenlar `artifacts/erp-dashboard/src/erp-modern-ui/*.css` da. Har sahifani shu standartga keltir, mazmunni
o'chirmasdan (Q-46).

### 2.1 Sahifa sarlavhasi → `EPPageHeader` (majburiy)
**Muammo (audit):** ~70% sahifa bespoke sarlavha ishlatadi — `<h1 className="text-4xl">`, `page-title`, `ep-h1`,
xom `<h2>`, har xil `text-[Npx]`. Faqat ~30% (122 sahifa) `EPPageHeader` ishlatadi.

**Standart:** har sahifa yuqorisida `EPPageHeader` (title + subtitle + actions slot).
```tsx
// ❌ NOTO'G'RI (bespoke)
<h1 className="text-4xl font-light tracking-tight text-on-surface">Yollash <span>Kanban</span></h1>
<h1 className="page-title">Sotuvlar</h1>
<h2 className="text-[16px] font-semibold">Kartalar</h2>

// ✅ TO'G'RI (standart)
<EPPageHeader
  title={t("...")}
  subtitle={t("...")}
  actions={<Button>...</Button>}
/>
```
- `EPPageHeader` API'sini `components/ep/EPPageHeader.tsx` dan o'qib, aniq props bilan ishlat.
- Subtitle bor sahifalarda subtitle, yo'qlarda yo'q. Actions (tugmalar) o'ng tomonda (Q-41 standart joylashuv).
- Sarlavha MATNI o'zgarmaydi — faqat o'rovi standartga o'tadi (Q-46).

### 2.2 KPI/statistika plitkalari → `EPKpiCard` (bir xil) — LEKIN HAMMASI QOLADI
**Muammo:** ba'zi sahifalar 9 ta "kamalak" `StatCard` (`color="bg-green-500"` — xom palitra) ishlatadi.
**Standart:** `EPKpiCard` (token-rang, bir xil). ⭐ **HAR statistika QOLADI** — bittasi ham o'chmaydi (Q-46).
```tsx
// ❌ NOTO'G'RI (xom rang, har biri boshqa)
<StatCard icon={Users} label="..." value={n} color="bg-green-500" />
<StatCard ... color="bg-indigo-500" />

// ✅ TO'G'RI (bir xil token, hammasi qoladi)
<EPKpiCard icon={Users} iconBg="hr" label={t("...")} value={n} />
<EPKpiCard icon={CheckCircle} iconBg="var(--ep-green)" label={t("...")} value={n} />  // faqat semantik (Qabul=yashil)
```
- Agar 9 ta KPI bo'lsa — 9 tasini ham `EPKpiCard` qil (ixcham grid: `repeat(auto-fit, minmax(...))` yoki 2 qator).
  **O'chirma.** Semantik rang faqat ma'noli joyda (Qabul=success, Rad=danger) — qolgani bir xil neytral token.

### 2.3 Ranglar → EP token (xom palitra TAQIQ)
**Muammo:** `bg-green-500/red-500/indigo-500/violet-500/emerald-*`, `text-[#hex]`, inline `style={{color:'#fff'}}`.
**Standart:** `var(--ep-*)` token yoki semantik Tailwind class (`bg-surface`, `text-on-surface`, semantic).
```tsx
// ❌ NOTO'G'RI
className="bg-emerald-600 text-emerald-400 border-emerald-500/40"
style={{ color: '#fff', boxShadow: '2px 2px 8px rgba(163,177,198,0.35)' }}
className="text-[#94a3b8]"

// ✅ TO'G'RI
className="bg-[var(--ep-surface)] text-[var(--ep-on-surface)]"   // yoki semantic class
// status uchun: var(--ep-green)/var(--ep-red)/var(--ep-primary)
```
- `check-design-tokens.mjs` xom inline hex'ni BLOK qiladi — har modulda PASS bo'lsin.
- Token ro'yxati `erp-modern-ui/*.css` da (`--ep-primary`, `--ep-surface`, `--ep-on-surface`, `--ep-green`,
  `--ep-red`, `--ep-amber`, `--ep-border`, ...). O'sha fayldan aniq nomlarni o'qib ishlat.

### 2.4 Tugmalar → standart `<Button>` (bir xil o'lcham)
**Muammo:** 464 sahifa size'siz, 252 ta `size="sm"`, ad-hoc `h-8/h-9/p-3/p-4`. Har xil balandlik.
**Standart:** umumiy `<Button>` (`components/ui/button`), standart `size` (default/`sm`/`icon`), variant
(`default`/`outline`/`ghost`/`destructive`). Ad-hoc `h-*/px-*` olib tashla.
```tsx
// ❌ NOTO'G'RI
<button className="h-8 px-3 bg-emerald-600 ...">
<Button className="h-10 px-5 ...">

// ✅ TO'G'RI
<Button size="sm" variant="outline">...</Button>     // ikkilamchi amal
<Button>...</Button>                                  // asosiy amal (default size)
<Button size="icon" variant="ghost" aria-label="...">  // ikonka tugma
```
- Bir sahifada bir xil rol = bir xil size/variant. Asosiy amal = default; ikkilamchi = sm/outline; ikonka = icon/ghost.

### 2.5 Sahifa o'rovi + scroll patterni (qisilishni ochish)
**Muammo:** har sahifa boshqa padding/spacing; board sahifalar nested scroll (tashqi `overflow-auto` + ichki
`overflow-x-auto`) → qutiga qamalgan, siqilgan (recruiting kanban misoli).
**Standart o'rov:**
```tsx
// Oddiy sahifa
<div className="flex flex-col gap-4 p-6">
  <EPPageHeader ... />
  {/* KPI strip, content */}
</div>

// Board/kanban sahifa — BITTA scroll konteksti (nested EMAS)
<div className="flex flex-col h-full overflow-hidden p-6 gap-4">   // tashqi: overflow-HIDDEN
  <EPPageHeader ... />
  {/* compact KPI + 1 banner */}
  <div className="flex-1 overflow-x-auto">                          // board: gorizontal scroll
    <div className="flex gap-3 h-full min-w-max">
      {/* columns: har biri overflow-y-auto */}
    </div>
  </div>
</div>
```
- Nested scroll yo'q: tashqi `overflow-hidden`, board `overflow-x-auto`, ustun `overflow-y-auto`. Board to'liq
  en + balandlikni egallaydi, qutiga qamalmaydi.
- Padding standart: sahifa root `p-6`, ichki gap `gap-4` / `space-y-4`. Inline `style` padding/margin olib tashla.

### 2.6 Tipografiya shkalasi (sarlavha o'lchamlari)
**Muammo:** sarlavhalar text-4xl/3xl/2xl/[16px]/lg — turlicha.
**Standart:** sahifa sarlavhasi `EPPageHeader` ichida (o'lcham komponentdan); bo'lim sarlavhasi bir xil
(`text-base font-semibold` yoki EP class). Ixtiyoriy `text-[Npx]` sarlavha TAQIQ — standart class.

### 2.7 Bo'sh/xato/yuklash holatlari → EP komponentlar
- Yuklash: `EPLoader` / `EPSkeleton`. Xato: `EPErrorState` (retry bilan). Bo'sh: `EPEmptyState`.
- Har `useQuery` sahifasi loading + error + empty holatga ega (F1). Yangi yozma — mavjudlarni standartga keltir.

### 2.8 Custom CSS class'larni token'ga (ep-h1/page-title)
- `ep-h1` (15 fayl), `page-title` (20 fayl) — bu class'lar kanonik tizimda emas. `EPPageHeader` yoki standart
  class bilan almashtir. `text-on-surface` kabi yetim token'larni `var(--ep-on-surface)` ga.

---

## 3. PHASE 0 — STABILIZE (majburiy old-shart)

⚠️ **Boshlashdan oldin:**
1. Hech qaysi boshqa sessiya/jarayon shu repoda kod yozmayotganini tasdiqla (egasi tasdiqlaydi). O'tgan
   navbatda recruiting redizayni working tree'da QAYTARILGAN + 174 untracked fayl bor edi = parallel clobber.
2. `git status` toza/ma'lum holatga keltir. Untracked _audit/* proof skriptlarni (kerakmas bo'lsa) tartibga sol.
3. Recruiting sahifasi: redizayn `799e329a` da bor, lekin u 9→5 stat O'CHIRGAN (Q-46 buzilishi). Shuning uchun
   **uni tiklama** — P4 da to'liq (9 statli) versiyadan, DELETE-NOTHING bilan qayta moslaymiz.
4. Faqat shundan keyin P1 ga o't.

---

## 4. PHASE 1 — Real 503 / backend so'rov xatolari (kichik, yuqori qiymat)

Audit (DB-tasdiqlangan) faqat 3 ta real backend xato topdi (qolgan "503" da'volar SOXTA edi — ai-exam/
ai-reservation jadvallari MAVJUD, marketing transient). Bularni tuzat:

### 4.1 qc_final_inspections ustun-drift (GET /qc/final-orders 503 + POST /qc/final-inspections)
- Fayl: `apps/api/src/modules/qc/infrastructure/repositories/qc-extended-final.repository.ts`
- Muammo: SELECT (≈22-26) va INSERT (≈41) `order_id / status / inspector_id` ustunlarini ishlatadi, lekin JONLI
  jadval ustunlari `papka_order_id / result / inspected_by`. → 42703 → 503.
- AVVAL DB-tasdiq: `cd .../Uzbek-Language-Module && node _audit/q.cjs "SELECT column_name,data_type FROM
  information_schema.columns WHERE table_name='qc_final_inspections' ORDER BY ordinal_position"` — aniq ustun
  nomlarini ko'r.
- Tuzatish: SELECT + INSERT + UPDATE da `order_id→papka_order_id`, `status→result`, `inspector_id→inspected_by`
  (aniq jonli nomlarga). Boshqa ustunlarni ham tekshir (`inspected_at`, `passed`).
- Isbot: BEGIN/ROLLBACK bilan SELECT ishlaydi (xato yo'q); GET /qc/final-orders endi 503 emas.

### 4.2 finance record-payment — fi_payments jadval yo'q (POST /finance/record-payment)
- Fayl: `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-ops.repo.ts` (≈86-92)
- Muammo: `INSERT INTO fi_payments (...)` — `fi_payments` JONLI DB'da YO'Q. Jonli jadval = `finance_payments`.
- AVVAL DB-tasdiq: `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE
  table_name='finance_payments' ORDER BY ordinal_position"` — finance_payments ustunlarini ko'r.
- Tuzatish: INSERT'ni `finance_payments`ga yo'naltir, ustun nomlarini finance_payments'ga moslab (invoice_id/
  amount/status/recorded_by/payment_date — jonli ustunlar bilan tasdiqlab). DDL yo'q (jadval bor).
- Isbot: BEGIN/ROLLBACK INSERT finance_payments'ga tushadi.

### 4.3 ow_orders — order-workflow buyurtma jadvali yo'q (GET /order-workflow/orders 503) → VIZYONGA QOLADI
- Fayl: `apps/api/src/modules/order-workflow/infrastructure/repositories/drizzle-order.repo.ts` (≈98)
- Muammo: `owOrders` (jadval `ow_orders`) YO'Q. Bu — "ikki-dunyo" buyurtma-jadval DIZAYN qarori (sales_orders ╳
  ow_orders). Egasi R2/R3 (uuid↔int) ni vizyonga qoldirgan — bu ham o'sha sinf.
- **HOZIR TUZATMA** — vizyon-build'da hal qilinadi. Faqat halol izoh qoldir (kod ichida `// TODO vizyon:
  ow_orders order-world table — see two-worlds decision`). Soxta jadval yaratma.
- ⚠️ SOXTA "503" da'volar (tuzatma): ai-exam (`ai_exam_attempts` BOR), ai-reservation (`ai_reservation_requests`/
  `batches` BOR), marketing/inbox/conversations (`social_conversations` + ustunlar BOR — transient edi). Bularga
  TEGMA — ishlaydi.

### 4.4 Phase 1 qabul-mezoni
- BE tsc 0; golden-thread exit 0; health 200; login 401/422. qc + finance endpointlar 503 bermaydi (DB-proof).
- Commit: `fix(503): qc_final_inspections col-drift + finance→finance_payments (ow_orders→vizyon)`.

---

## 5. PHASE 2 — i18n auto-fill skript (bir martada, butun app)

**Muammo:** konsol "Missing key" ogohlantirishlari (yuzlab) — `orders.*`, `SDExtended.*`, `DesignExtended.*`,
`QCModule.*`, `TechPPExtended.*` va h.k. Ko'pi fallback bilan (matn TO'G'RI ko'rinadi) = kosmetik konsol shovqini.
Lekin egasi ularni ko'rib bezovta bo'ladi. Hozir avtomatik to'ldiruvchi skript YO'Q (faqat qo'lda
`i18n-fix-console-gaps.mjs`).

**Vazifa:** `scripts/i18n-autofill-from-source.mjs` yarat (yangi skript):
1. FE manbasini (`artifacts/erp-dashboard/src/**/*.{ts,tsx}`) skanerlab, `tLabel("key", "fallback")` va
   `t("key")` chaqiruvlarini regex bilan ajrat. `tLabel(k, fb)` dan key + fallback; `t(k)` dan key (fallback yo'q).
2. Har key uchun **namespace**ni aniqla (chaqiruvchi `useTranslation("ns")` yoki prop). Agar aniqlab bo'lmasa —
   `common` default, lekin LOG qil.
3. Locale fayllar: `artifacts/erp-dashboard/src/locales/{uz,ru,uz-cyr}/{ns}.json`. Har key yetishmasa, o'sha
   namespace faylga **qo'sh** (ADD-ONLY — mavjudni o'zgartirma).
4. Qiymat = manbadagi `fallback` (tLabel bo'lsa). `t(k)` (fallback yo'q) bo'lsa — key'ni human-readable o'zbekchaga
   o'gir (camelCase → so'zlar) LEKIN faqat aniq bo'lsa; aniq bo'lmasa LOG qil, **taxminiy tarjima YOZMA** (Q-40).
5. uz to'ldirilgach, ru va uz-cyr ga ham (uz qiymatidan — ru uchun keyin Yandex bilan; hozir uz qiymati bilan
   parity, yoki uz-cyr translit). ⭐ Taxminiy/noto'g'ri tarjima YOZMA — uz=manba, ru/uz-cyr=uz-qiymati (placeholder)
   + LOG.
6. Idempotent (qayta yugurtsa dublikat qo'shmaydi). Dry-run flag (`--dry`) preview uchun.
- Skript ADD-ONLY: mavjud kalitni HECH QACHON o'zgartirma/o'chirma (Q-46 — ishlaydigan tarjima qoladi).
- Yugurt: `node scripts/i18n-autofill-from-source.mjs --dry` → preview → keyin haqiqiy. Maqsad: 0 missing.

**Dev-bundle eslatma:** egasi ko'rgan "xom kalit" (ismYokiTelefon) aslida locale'da BOR edi — eski dev-bundle
sababli. Skript yugurib bo'lgach, dev-serverni qayta ishga tushir (`pnpm --filter erp-dashboard run dev`) — yangi
bundle kalitlarni oladi.

**Phase 2 qabul:** skript ishlaydi, dry-run + apply; i18n missing count ~0; uz parity; commit
`feat(i18n): auto-fill missing keys from source fallbacks`.

---

## 6. PHASE 3 — O'lik (orphan) sahifa fayllarini o'chirish (~180 fayl)

**Muammo:** `pages/*.tsx` da 846 fayl, lekin faqat ~230 faol (routed + sidebar). Farqi (~180-430) = (a) sub-komponent
fayllar (Sections/Dialogs/Tabs/Types — BULAR KERAK, o'chirma), (b) o'lik orphan sahifalar (eski tozalashda
menyu/route'dan olingan, fayli qolgan). Egasi: o'liklarni o'chir (846 fayl ≠ faol sahifa chalkashligini oldini olish).

**Vazifa (Q-46: o'lik = to'liq o'chir, lekin EHTIYOT):**
1. Faol komponentlar ro'yxatini yig': `routes/*.tsx` + `AppRouter.tsx` import qiladigan barcha `@/pages/...`
   komponentlar + ular import qiladigan sub-komponentlar (tranzitiv).
2. Har `pages/*.tsx` (top-level, sub-part EMAS) fayl uchun: u (a) route'da, (b) sidebar'da, yoki (c) faol sahifa
   import qilganmi? grep bilan tekshir.
3. Hech qaysida bo'lmasa = ORPHAN (o'lik). LEKIN o'chirishdan oldin: `grep -rl "ComponentName\|from.*pageFile"
   src` — HECH KIM import qilmasligini tasdiqla (Q-39). Test fayl import qilsa — test ham o'lik (birga o'chadi).
4. Tasdiqlangan orphan'larni `git rm` qil. ⚠️ Sub-part fayllarni (Sections/Dialogs/Tabs/Types/Helpers) o'chirma
   agar parent faol bo'lsa.
5. Har 20-30 fayl o'chirgach: FE tsc 0 (o'chirish hech narsani buzmaganini tasdiqla) + commit.

**Phase 3 qabul:** orphan'lar o'chirildi, FE tsc 0 (hech qanday "module not found"), check-sidebar-routes PASS;
fayl soni ≈ faol sahifa. Commit(lar) `chore: remove ~N de-routed orphan pages (dead code)`.

---

## 7. PHASE 4 — Dizayn standartlashtirish (ASOSIY — modul-modul, DELETE-NOTHING)

~230 faol sahifani §2 EP standartiga keltir. **MODUL-MODUL** (bitta sidebar guruhi = bitta partiya). Har sahifaga
§2.1-2.8 ni qo'lla, **HECH NARSA o'chirmasdan** (Q-46). Har modul oxirida commit + advisor tekshiruvi.

### 7.1 Modullar ro'yxati (sidebar guruhlari — tz00..tz16, ~17 modul)
Top-nav'dagi tartibda (egasi screenshot): Savdo va CRM · Marketing · Dizayn · Sifat Nazorati · Texnologiya ·
AI Rejalashtirish · Ishlab Chiqarish · Ombor · Ta'minot · Moliya · Xodimlar · Ta'lim · Xavfsizlik · Xo'jalik ·
IoT va Kamera · Direktor · Admin Panel. (Aniq tz-guruhlar `components/sidebar/constants.ts` da — har guruhning
sahifalarini o'shandan ol.)

### 7.2 Tartib (egasi ko'p ishlatadiganidan boshla)
Tavsiya tartib: **Xodimlar (HR)** → **Moliya** → **Savdo/CRM** → **Direktor** → **Ombor** → **Ishlab Chiqarish** →
**Sifat** → **Texnologiya** → **Ta'minot** → **Marketing** → **Dizayn** → **Ta'lim** → **IoT** → **Xavfsizlik** →
**Xo'jalik** → **AI** → **Admin**. (Egasi boshqa tartib aytsa — o'shanga.)

### 7.3 Har sahifa uchun retsept (DELETE-NOTHING checklist)
Har faol sahifani ochib, ketma-ket:
1. **Sarlavha:** bespoke (`<h1 text-4xl>`/`page-title`/`ep-h1`/raw `<h2>`) → `EPPageHeader` (title+subtitle+actions).
   Matn o'zgarmaydi.
2. **KPI/stat:** xom `StatCard color="bg-*-500"` → `EPKpiCard` (token). ⭐ HAR BIRI QOLADI (soni o'zgarmaydi).
3. **Ranglar:** xom `bg-*-500`/`text-[#hex]`/inline hex → EP token (`var(--ep-*)`/semantic).
4. **Tugmalar:** ad-hoc → standart `<Button>` size/variant. Bir xil rol = bir xil o'lcham. HAR tugma QOLADI.
5. **Layout/scroll:** nested scroll → bitta kontekst (§2.5); board sahifalarda qisilishni och; padding standart (`p-6`).
6. **Holatlar:** loading/error/empty → EP komponent (agar yo'q bo'lsa qo'sh; bor bo'lsa standartga).
7. **Q-46 tekshiruv:** sahifada AVVAL bo'lgan har element (stat, tugma, jadval ustuni, feature, ma'lumot) HAMON
   bor — faqat ko'rinishi standart. Hech narsa o'chmadi.
8. **Logika TEGILMAYDI:** useQuery/useMutation/handler/hook/event — faqat JSX/className/wrapper o'zgaradi.

### 7.4 Misol (recruiting kanban — to'g'ri yo'l, DELETE-NOTHING)
- ❌ Avvalgi (Q-46 buzgan): 9 stat → 5 EPKpiCard (4 ta o'chirilgan).
- ✅ To'g'ri: 9 stat → **9 EPKpiCard** (ixcham grid, token rang) — bittasi ham o'chmaydi; sarlavha → EPPageHeader;
  board → single-scroll (qisilish ochiladi); kartalar → ism prominent, HAR tugma (folder/exams/aiIntervyu/edit/
  reject) QOLADI; bannerlar → ixcham, lekin ikkalasi QOLADI.

### 7.5 Har modul qabul-mezoni
- Modulning HAR faol sahifasi EP standartda (EPPageHeader + token + standart Button + standart layout).
- FE tsc 0; check-design-tokens PASS; check-sidebar-routes PASS.
- ⭐ DELETE-NOTHING: har sahifada element/feature soni avvalgidek (stat/tugma/ustun/ma'lumot o'chmagan) — buni
  hisobotda aniq yoz (masalan "recruiting: 9 stat saqlandi, 5 karta tugmasi saqlandi").
- Screenshot (auth bo'lsa) yoki sahifa render-tasdiq.
- Commit: `style(<modul>): EP standartga keltirildi (header/token/button/layout; mazmun saqlandi)`.
- Hisobot → advisor tekshiradi (DELETE-NOTHING + izchillik + regress) → keyingi modul.

---

### 7.6 Modul-modul ANIQ sahifa checklist (constants.ts'dan, har sahifaga §7.3 retseptini qo'lla)
Quyida har modul (sidebar guruhi tz01..tz17) + uning FAOL sahifalari (url). Separator (bo'lim sarlavhasi) emas,
faqat route'li sahifalar. Har sahifani §7.3 (sarlavha→EPPageHeader, KPI→EPKpiCard, rang→token, tugma→standart,
layout→single-scroll, DELETE-NOTHING) bo'yicha standartga keltir. Bir modul = bir partiya = bir commit.

#### tz01 — Savdo va CRM (default: sd/dashboard) — 14 sahifa
sd/dashboard · sd/customers · crm-workspace · sales · ai/crm · sd/sales-quotes · sd/sales-orders · papka-orders ·
sd/contracts · order-create · order-workflow · sd/warehouse-rental · sd/sales-payments · sd/advance-control ·
sd/kpi · sd/settings
- Eslatma: SDSalesOrders/SDDashboard bespoke sarlavha (`page-title`/text-2xl) → EPPageHeader. order-workflow GET
  503 (ow_orders) — P1'da vizyonga qoldirilgan; sahifa "Yuklashda xato" ko'rsatsa, bu kutilgan (dizayn tegmaydi).

#### tz02 — Marketing (default: marketing/dashboard) — 17 sahifa
marketing/dashboard · marketing/leads · marketing/campaigns · marketing/content · marketing/social-inbox ·
marketing/calendar · marketing/exhibitions · marketing/pr · marketing/analytics · marketing/seo ·
marketing/ab-testing · marketing/competitors · marketing/nps-churn · marketing/website-cms · marketing/budget ·
marketing/settings
- Eslatma: social-inbox 503 transient edi (social_conversations bor) — dizayn standartga keltir, logikaga tegma.

#### tz03 — Dizayn (default: design/dashboard) — 13 sahifa
design/dashboard · design/orders · design/approval · design/generator · design/ai-review · design/3d-mockup ·
design/comparison · design/library · design/brand-guidelines · design/templates · design/tools · design/costing
- Eslatma: DesignExtended.* i18n kalitlari P2 skriptida to'ldiriladi. Dizayn faqat ko'rinish.

#### tz04 — Sifat Nazorati (default: qc/dashboard) — 18 sahifa
qc/dashboard · qc/lab · qc/tests · qc/parameters · qc/standards · qc/approval · qc/final · qc/vendor-quality ·
qc/defect-management · qc/complaints · qc/certificates · qc/iso · qc/trends · qc/ai-analysis · qc/reports ·
qc/settings
- Eslatma: qc/final (final-orders) P1'da 503 tuzatiladi (ustun-drift). QCModule.*/QCFinalInspection.* i18n → P2.

#### tz05 — Texnologiya (default: tech/approval) — 12 sahifa
tech/approval · tech/cards · erp/pp/bom · tech/material-alternatives · erp/pp/routing · tech/machine-selection ·
tech/time-cost · tech/cost-optimization · tech/client-requirements · tech/change-history · tech/parallel-orders
- Eslatma: TechPPExtended.* i18n → P2. Texnik kartalar — mavjud feature, o'chirma.

#### tz06 — AI Rejalashtirish (default: ai-production-planning) — 18 sahifa
ai-production-planning · pp/ai-reservation · pp/dashboard · planning · pp/shift-management · pp/parallel-processes ·
erp/pp/capacity · pp/rush-orders · pp/bottleneck · pp/demand-forecast · pp/what-if · pp/delivery-calculator ·
pp/energy-optimization · pp/oee-monitor · pp/kpi-deviation · pp/realtime-progress
- Eslatma: pp/ai-reservation — ai_reservation_requests/batches jadvallari BOR (sweep "missing" da'vosi SOXTA edi);
  ishlaydi, faqat dizayn.

#### tz07 — Ishlab Chiqarish (default: mes/dashboard-home) — 20 sahifa
mes/dashboard-home · iot/tablet · iot/daily-view · mes/work-centers · mes/products · production/orders ·
mes/downtimes · mes/workers · mes/oee-monitor · mes/reason-log · iot/dashboard · mes/zone-management ·
mes/maintenance-request · mes/gamification · mes/machine-norms · mes/smena-handover · kaizen
- Eslatma: kaizen create #12'da tuzatilgan (expected_impact). iot/tablet — operator interfeysi, ehtiyot.

#### tz08 — Ombor (default: wms/overview) — 9 sahifa
wms/overview · wms/warehouses · wms/procurement · pos-monitor · wms/inventory · wms/grn · wms/reservation ·
inventory/materials · wms/rental
- Eslatma: ⚠️ Qoida 22 — POS = yagona `pos-monitor` (eski /pos/* klaster QAYTA QO'SHILMAYDI); ombor turlari
  Tabs (alohida sidebar emas). Dizayn standart, bu kanonni buzma.

#### tz09 — Ta'minot (default: mm/dashboard) — 16 sahifa
mm/dashboard · mm/vendors · mm/purchase-orders · integration/expense-management · mm/check-bot · mm/creditor-debts ·
integration/vendor-performance · mm/supplier-portal · logistics/transport · logistics/route-planning ·
logistics/gps · logistics/fuel · logistics/drivers · logistics/vehicle-schedule
- Eslatma: MM goods-ISSUE updated_at watch (carry) — bu cleanup'da emas; dizayn faqat.

#### tz10 — Moliya (default: cfo-dashboard) — 28 sahifa
cfo · cfo-dashboard · ai/finance · finance-dashboard · accounting/gl-documents · accounting/chart-of-accounts ·
accounting/period-closing · finance/cashflow · finance/budgets · finance/profitability · finance/reports ·
accounting/ar · accounting/ap · finance/approval · accounting/cash-register · accounting/income-expense ·
pos-monitor · accounting/payroll-automation · finance/order-costing · accounting/materials ·
accounting/inventory-valuation · accounting/asset-management · fi/cost-centers · fi/transfer-pricing ·
fi/tax-management · fi/tax-calendar · fi/audit-log · fi/risk-ai
- Eslatma: ⚠️ payroll-automation / GL hujjatlar — ledger LOGIKASIGA tegma (#10 hardening). Faqat KO'RINISH
  (EPPageHeader/token/button). record-payment 503 P1'da (finance_payments). finance/reports honest-501 — o'chirma.

#### tz11 — Xodimlar/HR (default: hr-dashboard) — 25 sahifa
hr-dashboard · org-structure/hierarchy · hr-map · hr/recruiting · ai-hr/interviews · employees · ai-hr/dashboard ·
goals · shift-schedule · notifications · assets · hr/vacation-sick · integration/employee-rating · skills-matrix ·
mentorship · hr/succession · hr/onboarding · hr/offboarding · discipline · hr/health-monitoring · hr/career-path ·
hr/safety · hr/daily-reports · hr/reception · hr/referrals · hr/brand · weekly-plan
- Eslatma: ⚠️ org-structure/hierarchy = razryad ICHIDA (Org fix qilingan — buzma; Razryadlar/Kartalar alohida
  sahifa QAYTA QO'SHILMAYDI). hr/recruiting = recruiting kanban (DELETE-NOTHING redizayn — 9 stat HAMMASI qoladi,
  board single-scroll). skills-matrix HR'da (LMS dup olib tashlangan — qaytarma).

#### tz12 — Ta'lim/LMS (default: lms-dashboard) — 20 sahifa
lms-dashboard · courses · lessons · hr-capital/tests · lms/course-author · tests · all-exams · ai-exams ·
certificates · lms/operator-certification · lms/test-management · mentorship · lms/leaderboard · events-calendar ·
lms/knowledge-base · lms/micro-learning · integration/hr-lms · lms/learning-budget · analytics
- Eslatma: ai-exams — ai_exam_attempts jadval BOR (sweep "missing" SOXTA edi); ishlaydi. LMS create-crashlar
  #14'da tuzatilgan. "Ko'nikmalar" LMS-dup olib tashlangan — qaytarma.

#### tz13 — Xavfsizlik (default: camera-safety) — 14 sahifa
camera-safety · camera/monitoring · face-registration · security/attendance · security/zone-access ·
camera-live-monitoring · cameras · camera-alerts · security/ppe · security/hazmat · security/evacuation ·
security/visitors · security/rating

#### tz14 — Xo'jalik/MRO (default: mro/dashboard) — 16 sahifa
mro/dashboard · integration/mro · mro/preventive · mro/spare-parts · mro/utilities · mro/expense-control ·
mro/kitchen · mro/uniforms · mro/office-inventory · mro/cleaning · europrint/waste-tracking · mro/sanitation ·
mro/building-inventory

#### tz15 — IoT va Kamera (default: camera-dashboard) — 18 sahifa
iot/dashboard · iot/sensor-monitoring · camera-machines · camera-dashboard · cameras · camera-heatmap · camera-ai ·
camera-quality · camera-employees · camera-employee-ratings · camera-settings · iot/predictive-maintenance ·
iot/oee-live · iot/digital-twin · iot/alerts · camera-reports
- Eslatma: camera-dashboard 503 (text=integer join) #B1'da tuzatilgan (4 IoT repo) — ishlaydi; faqat dizayn.

#### tz16 — Direktor (default: europrint/director) — 17 sahifa
europrint/director · aisha · europrint/control · europrint/auditor · europrint/accountant · finance/daily-kpi ·
europrint/employee-kpi · europrint/strategic · europrint/reports-hub · director/ai-summary · director/problem-points ·
agents · agents/production · agents/hr-performance · agents/quality · agents/strategic · agents/facilities · ideal-rasm
- Eslatma: ⚠️ `aisha` (#15 Aisha) — futuristik UI ATAYIN boshqacha (Q-41 egasi-istisno); uni EP-standartga
  MAJBURLAMA (yagona istisno). Qolgan director sahifalar — standart. agents/production OEE qisman placeholder
  (#R7 — bu cleanup'da emas).

#### tz17 — Admin Panel (default: super-admin) — ~8+ sahifa
super-admin · saas/tenant-management · saas/onboarding · saas/licensing · saas/module-control · (+ qolganini
constants.ts:578+ dan ol — fayl shu yerda kesilgan)
- Eslatma: tz17 ning to'liq ro'yxatini constants.ts dan o'qib ol (578-qatordan keyin).

### 7.7 Modul partiyasi qabul-mezoni (har tz## uchun takror)
Har modulni tugatib: (1) modulning HAR faol sahifasi EPPageHeader + token + standart Button + standart layout;
(2) FE tsc 0; (3) check-design-tokens PASS; (4) check-sidebar-routes PASS; (5) ⭐ DELETE-NOTHING isboti (har
sahifada stat/tugma/ustun/feature soni avvalgidek — hisobotda yoz); (6) screenshot/render-tasdiq; (7) commit
`style(<modul>): EP standart (mazmun saqlandi)`; (8) STOP → advisor tekshiradi → keyingi modul.

---

## 8. PHASE 5 — Navigatsiya

### 8.1 Top module nav overflow (~17 modul kesiladi)
- JONLI top-nav komponentini top (NOT `dizayn-new/AppSidebar` — u o'lik). grep: `components` da gorizontal modul
  panelini render qiladigan (modul label'lari i18n kalit bo'lishi mumkin — komponentni topologik top: layout/header).
- Tuzatish: gorizontal scroll (`overflow-x-auto`) YOKI wrap YOKI "ko'proq" dropdown — barcha 17 modul yetib boradigan.
  Hech qaysi modul yo'qolmaydi (Q-46). EP token bilan.

### 8.2 Sidebar bo'limlar izchilligi
- `constants.ts` — har tz-guruhda bo'limlar (separator + label: TASHKILOT/REKRUTING/...) IZCHIL bo'lsin (yo
  hammasi bo'limli, yo egasi "tekis" desa tekis). Default: izchil guruhlash saqlanadi.
- check-sidebar-routes PASS (sidebar→yo'q-sahifa yo'q).

### 8.3 Phase 5 qabul
- Top-nav: barcha 17 modul yetib boradi (scroll/wrap/dropdown); sidebar izchil; FE tsc 0; design-tokens PASS.
- Commit: `fix(nav): top-module-bar overflow + sidebar section consistency`.

---

## 9. UMUMIY SELF-VERIFY (har faza/modul) + HISOBOT FORMATI

### 9.1 Har modul/faza tugaganda yugurt:
```
pnpm --filter @europrint/api exec tsc --noEmit         # BE 0 (BE tegsa)
cd artifacts/erp-dashboard && pnpm exec tsc --noEmit    # FE 0
node scripts/check-design-tokens.mjs                    # PASS
node scripts/check-sidebar-routes.mjs                   # PASS
node scripts/golden-thread-chain-proof.cjs              # exit 0 (BE tegsa)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/api/auth/health   # 200
```
### 9.2 Hisobot (har modul/faza):
- Qaysi modul/faza; nima O'ZGARDI (header/token/button/layout); nima SAQLANDI (stat/tugma/feature soni — Q-46
  isboti); commit hash(lar); proof natijasi (tsc/guard/health); regress yo'qligi.
- Stop — advisor o'sha modul/fazani tekshiradi → "OK" → keyingisi.

---

## 10. APPENDIX — tezkor ma'lumotnoma

### 10.1 EP komponentlar (`components/ep/`)
EPPageHeader, EPKpiCard, EPCard, EPStatusPill (EPStatusTone), EPErrorState, EPEmptyState, EPSkeleton, EPLoader.
Har birining aniq props'ini fayldan o'qib ishlat.

### 10.2 Tokenlar (`erp-modern-ui/*.css`)
`--ep-primary`, `--ep-surface`, `--ep-on-surface`, `--ep-on-surface-variant`, `--ep-border`, `--ep-green`,
`--ep-red`, `--ep-amber`, `--ep-info`, `--mod-*` (modul-rang). Aniq ro'yxat o'sha CSS'da.

### 10.3 Guardlar
- `check-design-tokens.mjs` — inline xom rang BLOK, Tailwind `[#hex]` WARN (diff-aware).
- `check-sidebar-routes.mjs` — sidebar→sahifa sinxron.
- `check-form-has-save.mjs` — forma mutation (diff-aware WARN).

### 10.4 Tartib xulosasi
P0 stabilize → P1 503 (qc+finance; ow_orders→vizyon) → P2 i18n skript → P3 orphan o'chirish → P4 dizayn standart
(modul-modul, DELETE-NOTHING) → P5 nav. Har modul: commit + hisobot + advisor tasdiq. Tugagach → vizyon-build fazasi.

### 10.5 Eng muhim eslatmalar (takror)
- Q-46: ISHLAYDIGAN kod o'chmaydi (faqat ko'rinish); BUZUQ kod to'liq o'chadi (chala emas).
- Verify: har modul egasi instruksiyasiga + EP standartiga mos (Q-40), faqat tsc emas.
- BITTA executor (parallel clobber yo'q). DDL ko'rsat. git add aniq fayl. payroll/GL/SAP#76/Aisha tegma.
- Kichik bo'lsa ham har bosqich isbot bilan; bu direktiva to'liq — noaniqlik bo'lsa AVVAL so'ra, taxmin qilma.

---

## 11. EP KOMPONENT API (to'liq ma'lumotnoma — manbadan, `components/ep/`)

Barrel: `import { EPPageHeader, EPKpiCard, EPCard, EPStatusPill, EPErrorState, EPEmptyState, EPLoader,
EPSpinnerBlock, EPComingSoon, EPNumberedSection, useCountUp } from "@/components/ep";` + tiplar `EPModuleColor`,
`EPStatusTone`.

### 11.1 EPPageHeader
Props (`EPPageHeader.tsx`):
- `title: React.ReactNode` — MAJBURIY. 20px/semibold sahifa sarlavhasi (o'zbekcha sentence case).
- `subtitle?: React.ReactNode` — 13px muted, sarlavha ostida.
- `breadcrumb?: React.ReactNode` — yuqorida breadcrumb.
- `actions?: React.ReactNode` — o'ngda tugmalar (asosiy amallar).
- `status?` — sarlavha yonida status pill (masalan live indikatori).
- `icon?` — sarlavha yonida ikonka.
- create dialog slot — actions'dan keyin.
- Mobil (<640px): breadcrumb/title/actions vertikal stack; actions to'liq-en bo'ladi (komponent ichida).
```tsx
<EPPageHeader
  title={t("hr.dashboard.title", "HR Dashboard")}
  subtitle={t("hr.dashboard.subtitle", "Xodimlar va tashkilot")}
  actions={<>
    <Button variant="outline" size="sm">{t("export")}</Button>
    <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("yangi")}</Button>
  </>}
/>
```

### 11.2 EPKpiCard
Props (`EPKpiCard.tsx`):
- `label: string` — MAJBURIY. UPPERCASE eyebrow (11px, letter-spacing 0.6px).
- `value?: number` — raqamli qiymat (0 dan ~1.2s animatsiya `useCountUp`).
- `staticValue?: React.ReactNode` — raqamsiz/oldindan formatlangan ("48 / 50", "63%", "—") — animatsiyasiz.
- `icon: LucideIcon` — MAJBURIY. 42px dumaloq plitka ichida.
- `iconBg?: EPModuleColor | string` — plitka foni (default brand orange). Modul rangi (`"hr"`, `"finance"`...) yoki
  `var(--ep-green)` kabi token.
- `delta?: { value: string; trend: "up"|"down"|"neutral" }` — qiymat ostida kichik caption ("↑ 12%"); trend rangi
  avtomatik (up=yashil, down=qizil).
```tsx
<EPKpiCard icon={Users}        iconBg="hr"            label={t("...","JAMI NOMZOD")} value={128} />
<EPKpiCard icon={CheckCircle}  iconBg="var(--ep-green)" label={t("...","QABUL")}      value={19} delta={{value:"↑ 4", trend:"up"}} />
<EPKpiCard icon={TrendingUp}   iconBg="hr"            label={t("...","SAMARADORLIK")} staticValue="63%" />
```
- ⭐ Raqamli `value` = animatsiya; foiz/matn = `staticValue`. KPI soni QANCHA bo'lsa SHUNCHA EPKpiCard (o'chirma).

### 11.3 EPCard / EPStatusPill / EPNumberedSection
- `EPCard` — token-rangli karta (oq fon, EP border, radius). `EPModuleColor` accent qabul qiladi.
- `EPStatusPill` — status pill; `tone: EPStatusTone` (`success`/`warning`/`danger`/`info`/`neutral`). Status matni
  shu tone bilan (xom rang emas).
- `EPNumberedSection` — raqamli bo'lim sarlavhasi (workflow sahifalar uchun).

### 11.4 EPLoader / EPErrorState / EPEmptyState / EPComingSoon (holatlar)
- `EPLoader` / `EPSpinnerBlock` — yuklash.
- `EPErrorState` — xato + `onRetry`.
- `EPEmptyState` — bo'sh (`icon`, `title`, `description`).
- `EPComingSoon` — hali tayyor bo'lmagan sahifa (501 o'rniga — Qoida 17). Stub sahifa shu, mutation kerakmas.
```tsx
if (isLoading) return <EPLoader />;
if (isError)   return <EPErrorState onRetry={() => refetch()} />;
if (!rows.length) return <EPEmptyState icon={Inbox} title={t("bosh")} description={t("...")} />;
```

---

## 12. OLDIN / KEYIN KOD GALEREYASI (8 pattern — har sahifada shu o'zgartirishlar)

### 12.1 Sarlavha
```tsx
// ❌ OLDIN (bespoke — 4 xil pattern)
<h1 className="text-4xl font-light tracking-tight text-on-surface">Yollash <span className="font-bold text-primary">Kanban</span></h1>
<h1 className="page-title">Sotuvlar paneli</h1>
<h1 className="ep-h1">Imtihonlar</h1>
<h2 className="text-[16px] font-semibold">Kartalar</h2>
// ✅ KEYIN (yagona)
<EPPageHeader title={t("recruiting.title","Yollash Kanban")} subtitle={t("recruiting.subtitle","HR Capital 7-bosqich")} actions={headerActions} />
```

### 12.2 KPI/statistika (DELETE-NOTHING — hammasi qoladi)
```tsx
// ❌ OLDIN (9 ta, xom rang)
<StatCard icon={Users} label="Jami" value={n} />
<StatCard icon={CheckCircle} label="Qabul" value={h} color="bg-green-500" />
<StatCard icon={XCircle} label="Rad" value={r} color="bg-red-500" />
... (yana 6 ta)
// ✅ KEYIN (9 ta ham qoladi, token, ixcham grid)
<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
  <EPKpiCard icon={Users} iconBg="hr" label={t("...","JAMI")} value={n} />
  <EPKpiCard icon={CheckCircle} iconBg="var(--ep-green)" label={t("...","QABUL")} value={h} />
  <EPKpiCard icon={XCircle} iconBg="var(--ep-red)" label={t("...","RAD")} value={r} />
  ... (qolgan 6 tasi ham — BITTASI HAM O'CHMAYDI)
</div>
```

### 12.3 Ranglar
```tsx
// ❌ OLDIN
className="bg-emerald-600 hover:bg-emerald-700 text-emerald-400 border-emerald-500/40"
style={{ color: '#fff', background: 'rgba(163,177,198,0.35)' }}
className="text-[#94a3b8]"
// ✅ KEYIN
className="bg-[var(--ep-surface)] text-[var(--ep-on-surface)] border-[var(--ep-border)]"
// status: var(--ep-green) / var(--ep-red) / var(--ep-amber) / var(--ep-primary)
```

### 12.4 Tugmalar
```tsx
// ❌ OLDIN
<button className="h-8 px-3 bg-emerald-600 text-white rounded">Saqlash</button>
<Button className="h-10 px-5">Yangi</Button>
// ✅ KEYIN (rol bo'yicha standart)
<Button>{t("saqlash")}</Button>                                  // asosiy
<Button variant="outline" size="sm">{t("filtr")}</Button>        // ikkilamchi
<Button variant="ghost" size="icon" aria-label={t("ochish")}><Eye className="h-4 w-4" /></Button>  // ikonka
<Button variant="destructive">{t("ochirish")}</Button>           // o'chirish (ConfirmDialog bilan — Qoida 14)
```

### 12.5 Layout / scroll (board qisilishini ochish)
```tsx
// ❌ OLDIN (nested scroll — qutiga qamalgan)
<div className="flex-1 overflow-auto p-6 flex flex-col h-full">
  ...<div className="flex-1 overflow-x-auto"><div className="flex gap-3 min-w-max">...columns</div></div>
</div>
// ✅ KEYIN (bitta scroll konteksti)
<div className="flex flex-col h-full overflow-hidden p-6 gap-4">   // tashqi: HIDDEN
  <EPPageHeader ... />
  {/* ixcham KPI strip + 1 banner */}
  <div className="flex-1 overflow-x-auto">                          // board: x-scroll
    <div className="flex gap-3 h-full min-w-max">
      {columns.map(c => <Column className="w-64 shrink-0 overflow-y-auto" />)}  // ustun: y-scroll
    </div>
  </div>
</div>
```

### 12.6 Holatlar (loading/error/empty)
```tsx
// ❌ OLDIN
{isLoading && <div>Yuklanmoqda...</div>}
{data?.length === 0 && <div>Bo'sh</div>}
// ✅ KEYIN
if (isLoading) return <EPLoader />;
if (isError) return <EPErrorState onRetry={refetch} />;
const rows = Array.isArray(data?.data) ? data.data : [];   // Qoida 2 (Array.isArray)
if (!rows.length) return <EPEmptyState icon={Inbox} title={t("bosh")} description={t("...")} />;
```

### 12.7 Custom CSS class → standart
```tsx
// ❌ ep-h1 / page-title / page-bc / yetim text-on-surface → ✅ EPPageHeader yoki var(--ep-*)
```

### 12.8 Tipografiya
```tsx
// ❌ text-4xl / text-3xl / text-2xl / text-[16px] sarlavhalar
// ✅ sahifa sarlavhasi = EPPageHeader (o'lcham komponentdan); bo'lim sarlavhasi = bir xil standart class
```

---

## 13. Q-46 DELETE-NOTHING — keng tarqalgan XATOLAR va to'g'ri yo'l

| ❌ XATO (Q-46 buzilishi) | ✅ TO'G'RI |
|---|---|
| "9 stat ko'p, 5 taga qisqartirdim" | 9 tasini ham EPKpiCard qil, ixcham grid — bittasi ham o'chmaydi |
| "Kartada 3 tugma ko'p, 1 ta qoldirdim" | Hamma tugma qoladi; faqat ko'rinish/tartib (ikonka tugma + tooltip) |
| "Banner ortiqcha, o'chirdim" | Ikkala banner qoladi; faqat ixcham/yig'iladigan |
| "Bu jadval ustuni kerakmas, oldim" | Hamma ustun qoladi (ishlayotgan ma'lumot) |
| "Bu sahifa eski, o'chirdim" | Faol (routed/sidebar) bo'lsa — QOLADI; faqat o'lik/orphan o'chadi (P3) |
| "Bu funksiya chiroyli emas, soddalashtirdim → yarmi ketdi" | Logika TEGILMAYDI; faqat JSX/className |

**Buzuq kod (Q-46 ikkinchi tomoni — TO'LIQ o'chir):** crash beradigan, soxta (fake/echo/hardcoded), o'lik/orphan,
dublikat — to'g'irla yoki BUTUNLAY o'chir (chala qoldirma). Avval: jonli tasdiq ishlamasligini (Q-29) + boshqa
import yo'qligini (Q-39) tekshir.

**Oltin qoida:** "Bu element/funksiya ishlaydimi?" → HA → QOLADI (faqat ko'rinish standart). YO'Q → to'liq o'chir
yoki to'g'irla. Hech qachon "ishlayotganini soddalashtirib yarmini olib tashlash".

---

## 14. TEZKOR BUYRUQLAR + GLOSSARIY + YAKUNIY

### 14.1 Har modul/faza buyruqlari
```bash
# Backend (BE tegsa)
pnpm --filter @europrint/api exec tsc --noEmit
node scripts/golden-thread-chain-proof.cjs
node _audit/q.cjs "SELECT ..."   # DB-proof (read-only)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/api/auth/health
# Frontend
cd artifacts/erp-dashboard && pnpm exec tsc --noEmit
node scripts/check-design-tokens.mjs
node scripts/check-sidebar-routes.mjs
# Commit (aniq fayl)
git add <aniq-fayllar>; git commit -m "style(<modul>): EP standart (mazmun saqlandi)"
```

### 14.2 Glossariy
- **DELETE-NOTHING (Q-46):** ishlayotgan kod/element o'chirilmaydi; faqat ko'rinish standartga.
- **EP standart:** EPPageHeader + EP token + standart Button + EP holat komponentlari + single-scroll layout.
- **Faol sahifa:** routed (routes/*.tsx) + sidebar'da (constants.ts). O'lik = ikkalasida ham yo'q.
- **Modul partiyasi:** bitta sidebar guruhi (tz##) = bitta commit = bitta advisor tekshiruvi.

### 14.3 Yakuniy tartib (takror)
P0 stabilize (parallel clobber to'xtasin) → P1 503 (qc col-drift + finance→finance_payments; ow_orders→vizyon) →
P2 i18n auto-fill skript → P3 ~orphan o'chirish → P4 dizayn standart (tz01..tz17 modul-modul, DELETE-NOTHING) →
P5 nav (top-overflow + sidebar). Har modul: commit + hisobot + advisor tasdiq. Hammasi tugagach → VIZYON-BUILD.

### 14.4 Eng muhim 6 qoida (yodda tut)
1. **Q-46:** ishlaydigan kod o'chmaydi (faqat ko'rinish); buzuq kod to'liq o'chadi (chala emas).
2. **Q-40:** ishlaydi ≠ to'g'ri; egasi instruksiyasi + EP standartiga mos bo'lsin (faqat tsc emas).
3. **Q-23:** BITTA executor (parallel clobber yo'q).
4. **Q-35:** DDL → avval SQL ko'rsat.
5. **Q-39:** regress yo'q (drag-drop/mutatsiya/dialog/event ishlaydi).
6. **Tegma:** payroll/GL/`entries`/`gl_journal_entries`(SAP#76)/Aisha (futuristik UI istisno).

---

## 15. PER-PAGE CHECKLIST (har sahifa alohida — bajarganda `[x]` belgila; P4 progress tracker)

Har sahifaga §7.3 retsepti (EPPageHeader + EPKpiCard + token + standart Button + single-scroll layout +
DELETE-NOTHING). Modul tugaganda commit + hisobot. URL→komponent-fayl mapping'ni `routes/*.tsx` dan ol.

### tz01 — Savdo va CRM
- [ ] sd/dashboard
- [ ] sd/customers
- [ ] crm-workspace
- [ ] sales
- [ ] ai/crm
- [ ] sd/sales-quotes
- [ ] sd/sales-orders
- [ ] papka-orders
- [ ] sd/contracts
- [ ] order-create
- [ ] order-workflow  (⚠️ ow_orders 503 → vizyon; dizayn faqat ko'rinish)
- [ ] sd/warehouse-rental
- [ ] sd/sales-payments
- [ ] sd/advance-control
- [ ] sd/kpi
- [ ] sd/settings

### tz02 — Marketing
- [ ] marketing/dashboard
- [ ] marketing/leads
- [ ] marketing/campaigns
- [ ] marketing/content
- [ ] marketing/social-inbox
- [ ] marketing/calendar
- [ ] marketing/exhibitions
- [ ] marketing/pr
- [ ] marketing/analytics
- [ ] marketing/seo
- [ ] marketing/ab-testing
- [ ] marketing/competitors
- [ ] marketing/nps-churn
- [ ] marketing/website-cms
- [ ] marketing/budget
- [ ] marketing/settings

### tz03 — Dizayn
- [ ] design/dashboard
- [ ] design/orders
- [ ] design/approval
- [ ] design/generator
- [ ] design/ai-review
- [ ] design/3d-mockup
- [ ] design/comparison
- [ ] design/library
- [ ] design/brand-guidelines
- [ ] design/templates
- [ ] design/tools
- [ ] design/costing

### tz04 — Sifat Nazorati
- [ ] qc/dashboard
- [ ] qc/lab
- [ ] qc/tests
- [ ] qc/parameters
- [ ] qc/standards
- [ ] qc/approval
- [ ] qc/final  (⚠️ 503 P1'da tuzatiladi — ustun-drift)
- [ ] qc/vendor-quality
- [ ] qc/defect-management
- [ ] qc/complaints
- [ ] qc/certificates
- [ ] qc/iso
- [ ] qc/trends
- [ ] qc/ai-analysis
- [ ] qc/reports
- [ ] qc/settings

### tz05 — Texnologiya
- [ ] tech/approval
- [ ] tech/cards
- [ ] erp/pp/bom
- [ ] tech/material-alternatives
- [ ] erp/pp/routing
- [ ] tech/machine-selection
- [ ] tech/time-cost
- [ ] tech/cost-optimization
- [ ] tech/client-requirements
- [ ] tech/change-history
- [ ] tech/parallel-orders

### tz06 — AI Rejalashtirish
- [ ] ai-production-planning
- [ ] pp/ai-reservation
- [ ] pp/dashboard
- [ ] planning
- [ ] pp/shift-management
- [ ] pp/parallel-processes
- [ ] erp/pp/capacity
- [ ] pp/rush-orders
- [ ] pp/bottleneck
- [ ] pp/demand-forecast
- [ ] pp/what-if
- [ ] pp/delivery-calculator
- [ ] pp/energy-optimization
- [ ] pp/oee-monitor
- [ ] pp/kpi-deviation
- [ ] pp/realtime-progress

### tz07 — Ishlab Chiqarish
- [ ] mes/dashboard-home
- [ ] iot/tablet  (⚠️ operator interfeysi — ehtiyot)
- [ ] iot/daily-view
- [ ] mes/work-centers
- [ ] mes/products
- [ ] production/orders
- [ ] mes/downtimes
- [ ] mes/workers
- [ ] mes/oee-monitor
- [ ] mes/reason-log
- [ ] iot/dashboard
- [ ] mes/zone-management
- [ ] mes/maintenance-request
- [ ] mes/gamification
- [ ] mes/machine-norms
- [ ] mes/smena-handover
- [ ] kaizen

### tz08 — Ombor  (⚠️ Qoida 22 — POS=yagona pos-monitor; turlar=Tabs)
- [ ] wms/overview
- [ ] wms/warehouses
- [ ] wms/procurement
- [ ] pos-monitor
- [ ] wms/inventory
- [ ] wms/grn
- [ ] wms/reservation
- [ ] inventory/materials
- [ ] wms/rental

### tz09 — Ta'minot
- [ ] mm/dashboard
- [ ] mm/vendors
- [ ] mm/purchase-orders
- [ ] integration/expense-management
- [ ] mm/check-bot
- [ ] mm/creditor-debts
- [ ] integration/vendor-performance
- [ ] mm/supplier-portal
- [ ] logistics/transport
- [ ] logistics/route-planning
- [ ] logistics/gps
- [ ] logistics/fuel
- [ ] logistics/drivers
- [ ] logistics/vehicle-schedule

### tz10 — Moliya  (⚠️ payroll/GL ledger LOGIKA tegma — faqat ko'rinish)
- [ ] cfo
- [ ] cfo-dashboard
- [ ] ai/finance
- [ ] finance-dashboard
- [ ] accounting/gl-documents
- [ ] accounting/chart-of-accounts
- [ ] accounting/period-closing
- [ ] finance/cashflow
- [ ] finance/budgets
- [ ] finance/profitability
- [ ] finance/reports  (honest-501 — o'chirma)
- [ ] accounting/ar
- [ ] accounting/ap
- [ ] finance/approval
- [ ] accounting/cash-register
- [ ] accounting/income-expense
- [ ] accounting/payroll-automation
- [ ] finance/order-costing
- [ ] accounting/materials
- [ ] accounting/inventory-valuation
- [ ] accounting/asset-management
- [ ] fi/cost-centers
- [ ] fi/transfer-pricing
- [ ] fi/tax-management
- [ ] fi/tax-calendar
- [ ] fi/audit-log
- [ ] fi/risk-ai

### tz11 — Xodimlar/HR  (⚠️ org-structure/hierarchy razryad ICHIDA — buzma)
- [ ] hr-dashboard
- [ ] org-structure/hierarchy
- [ ] hr-map
- [ ] hr/recruiting  (DELETE-NOTHING redizayn — 9 stat HAMMASI; board single-scroll)
- [ ] ai-hr/interviews
- [ ] employees
- [ ] ai-hr/dashboard
- [ ] goals
- [ ] shift-schedule
- [ ] notifications
- [ ] assets
- [ ] hr/vacation-sick
- [ ] integration/employee-rating
- [ ] skills-matrix
- [ ] mentorship
- [ ] hr/succession
- [ ] hr/onboarding
- [ ] hr/offboarding
- [ ] discipline
- [ ] hr/health-monitoring
- [ ] hr/career-path
- [ ] hr/safety
- [ ] hr/daily-reports
- [ ] hr/reception
- [ ] hr/referrals
- [ ] hr/brand
- [ ] weekly-plan

### tz12 — Ta'lim/LMS
- [ ] lms-dashboard
- [ ] courses
- [ ] lessons
- [ ] hr-capital/tests
- [ ] lms/course-author
- [ ] tests
- [ ] all-exams
- [ ] ai-exams
- [ ] certificates
- [ ] lms/operator-certification
- [ ] lms/test-management
- [ ] lms/leaderboard
- [ ] events-calendar
- [ ] lms/knowledge-base
- [ ] lms/micro-learning
- [ ] integration/hr-lms
- [ ] lms/learning-budget
- [ ] analytics

### tz13 — Xavfsizlik
- [ ] camera-safety
- [ ] camera/monitoring
- [ ] face-registration
- [ ] security/attendance
- [ ] security/zone-access
- [ ] camera-live-monitoring
- [ ] cameras
- [ ] camera-alerts
- [ ] security/ppe
- [ ] security/hazmat
- [ ] security/evacuation
- [ ] security/visitors
- [ ] security/rating

### tz14 — Xo'jalik/MRO
- [ ] mro/dashboard
- [ ] integration/mro
- [ ] mro/preventive
- [ ] mro/spare-parts
- [ ] mro/utilities
- [ ] mro/expense-control
- [ ] mro/kitchen
- [ ] mro/uniforms
- [ ] mro/office-inventory
- [ ] mro/cleaning
- [ ] europrint/waste-tracking
- [ ] mro/sanitation
- [ ] mro/building-inventory

### tz15 — IoT va Kamera  (⚠️ camera-dashboard 503 #B1'da tuzatilgan)
- [ ] iot/dashboard
- [ ] iot/sensor-monitoring
- [ ] camera-machines
- [ ] camera-dashboard
- [ ] cameras
- [ ] camera-heatmap
- [ ] camera-ai
- [ ] camera-quality
- [ ] camera-employees
- [ ] camera-employee-ratings
- [ ] camera-settings
- [ ] iot/predictive-maintenance
- [ ] iot/oee-live
- [ ] iot/digital-twin
- [ ] iot/alerts
- [ ] camera-reports

### tz16 — Direktor  (⚠️ aisha = futuristik UI ISTISNO — EP-standartga majburlama)
- [ ] europrint/director
- [ ] (aisha — ISTISNO, tegma)
- [ ] europrint/control
- [ ] europrint/auditor
- [ ] europrint/accountant
- [ ] finance/daily-kpi
- [ ] europrint/employee-kpi
- [ ] europrint/strategic
- [ ] europrint/reports-hub
- [ ] director/ai-summary
- [ ] director/problem-points
- [ ] agents
- [ ] agents/production
- [ ] agents/hr-performance
- [ ] agents/quality
- [ ] agents/strategic
- [ ] agents/facilities
- [ ] ideal-rasm

### tz17 — Admin Panel
- [ ] super-admin
- [ ] saas/tenant-management
- [ ] saas/onboarding
- [ ] saas/licensing
- [ ] saas/module-control
- [ ] (+ qolgani constants.ts:578+ dan)

### Progress
- Modul tugaganda: HAR sahifa `[x]`; commit; hisobotda "tz## — N sahifa standartlandi, mazmun saqlandi (stat/tugma
  soni o'zgarmadi)"; advisor tasdiq → keyingi modul. Jami ~230 faol sahifa, ~17 modul-partiya.

### Yakuniy eslatma
Bu direktiva ATAYIN to'liq (Q-47). Har bosqich, modul, sahifa, pattern, API, misol va qabul-mezoni yozilgan.
Noaniqlik bo'lsa — taxmin qilma, AVVAL so'ra. DELETE-NOTHING + bitta-executor + advisor-tasdiq = uchta asosiy rels.
