# UI Kod-Skan #1 — Umumiy Dizayn Tizimi (butun ERP)

> **Rol:** Interfeys kod-tahlilchisi (QAT'IY READ-ONLY) · **Sana:** 2026-06-02
> **Qatlam:** faqat KOD (brauzer YO'Q — vizual qatlamni asosiy sessiya qo'shadi)
> **FE root:** `artifacts/erp-dashboard/src`
> **Vizyon manbasi:** `docs/ombor-pos-master-plan.md` — §1.13 ("UI rasvo bo'lmasin: har sahifa EP dizayn-tizim komponentlari + semantic token; raw hex/rgb TAQIQ"), §16.4 ("har FE matn `tLabel(...)`; har rang EP token"), §1.4 (3 til: o'zbek lotin / o'zbek kirill / rus)
> **Tegishli qoidalar:** `CLAUDE.md` Qoida 21 (dizayn-token + shablon majburiy, regress-himoya) · `scripts/check-design-tokens.mjs` (diff-aware pre-commit guard)

---

## 0. Xulosa (TL;DR)

Umumiy dizayn tizimi **mustahkam va professional darajada qurilgan** — bu loyihaning eng kuchli qatlamlaridan biri. Token tizimi (HSL CSS-o'zgaruvchilar), EP komponent kutubxonasi (411 faylda ishlatiladi), universal holat shabloni (`PageState`), va 3 tilli i18n (55 ns × 3 til, simmetrik) — hammasi mavjud va keng ishlatiladi.

**Asosiy muammolar (hammasi LEGACY, regress emas):**
1. ⚠️ **~250 ta inline xom-rang** `style={{ color/background: '#...' }}` ko'rinishida (42 faylda) + 55 ta Tailwind arbitrary-hex (12 faylda) — vizyon §1.13 ga zid. Konsentratsiya: `pos-monitor/` (16 fayl), `components/` (16), `pages/` (13).
2. ⚠️ **`kit.css` (1237 satr) = o'lik parallel vokabular** — 122 ta komponent-klass (`.kpi/.donut/.bar/.btn/.card`) lekin TSX'da faqat ~5 faylda ishlatiladi. Ikkinchi, raqobatlashuvchi dizayn-til.
3. ✅ **i18n JSON qatlami toza** — uz/ da Kirill yo'q (0 fayl), faqat 1 ta camelCase qiymat oqishi; "inglizcha ru" deganlari aslida brend so'zlar (EuroPrint, Telegram, WhatsApp).

Pre-commit guard (`check-design-tokens.mjs`) o'zi tan oladi: **~950 ta oldindan mavjud buzilish bor**, guard faqat YANGI regressni bloklaydi. Ya'ni quyidagi topilmalar asosan tarixiy qarz — yangi kod toza kelmoqda.

**Baho:** Dizayn tizimi arxitekturasi **A−**; bajarilish izchilligi (legacy qarz tufayli) **B**; i18n to'liqligi **A−**.

---

## 1. Sahifa / fayl inventari

| O'lcham | Soni | Dalil |
|---|---|---|
| `pages/*.tsx` (barcha sahifa fayllari) | **1144** | `find pages -name "*.tsx"` |
| `src/` ichidagi barcha `.tsx` | **1677** | `find . -name "*.tsx"` |
| EP komponentini import qiluvchi fayllar | **411** | `grep -rl "@/components/ep"` |
| `tLabel(` chaqiruvi bor fayllar / jami chaqiruv | **136 / 786** | `grep -rl "tLabel("` |
| `PageState`/`ModulePage` shablon ishlatuvchi | **51** | `grep -rl "page-state\|module-page"` |
| `EPComingSoon` (placeholder) sahifalar | **7** | `grep -rl EPComingSoon pages` |
| Hech qanday `t()/tLabel/useTranslation` yo'q sahifa | **37** / 1144 | `grep -rL` |

✅ Sahifa bazasi katta va EP komponent qamrovi yuqori (411/1677 ≈ 24% fayl to'g'ridan EP import qiladi; ko'p sahifa bilvosita ham foydalanadi).

---

## 2. Dizayn token tizimi (ranglar, shrift, layout)

### 2.1. Token manbasi va qatlamlash ✅
`src/index.css` 7 ta CSS faylni qatlamlab import qiladi (`index.css:1-13`):
- `erp-modern-ui/design-tokens.css` (234 satr) — **1-qatlam baza tokenlar**
- `erp-modern-ui/europrint-mockup-theme.css` (821 satr) — **2-qatlam "EP Linear Soft" override**
- `erp-modern-ui/global-surface.css`, `shell-overrides.css`, `ep-motion-helpers.css` (517 satr), `kit.css` (1237 satr)

✅ **Ranglar HSL-token sifatida izchil belgilangan** (`design-tokens.css:8-132`): `--background`, `--foreground`, `--primary` (14 100% 59% = #ff5d2e to'q-sariq), `--card`, `--sidebar`, va boshqalar. Har bir token `index.css` da `@theme inline` orqali Tailwind klassiga bog'langan (`--color-primary: hsl(var(--primary))`).

✅ **Modul ranglari tizimli** (`design-tokens.css:73-92`): `--module-sd` (ko'k/Sales), `--module-pp` (yashil/Production), `--module-hr` (binafsha), `--module-warehouse` (amber), `--module-fi` (cyan) — har biri `-light`/`-dark` variant bilan. Bu modullar bo'ylab izchil rang-kodlash beradi.

✅ **Dark mode to'liq** (`design-tokens.css:135-234`): har bir token uchun `.dark` qiymati bor (Bitrix24 navy uslubi).

✅ **Shrift izchil** (`design-tokens.css:106-108`): `--font-sans: 'Inter'`, `--font-mono: 'JetBrains Mono'` — yagona manba.

✅ **Layout tokenlari** (`design-tokens.css:111-122`): `--radius: 0.75rem`, soya shkalasi `--shadow-2xs`..`--shadow-2xl` to'liq.

### 2.2. Inline xom-rang buzilishi ⚠️ (vizyon §1.13 buzilishi)
Vizyon va Qoida 21 inline `style={{ color/background: '#hex' }}` ni TAQIQLAYDI. Skan natijasi:

| Pattern | Soni | Fayllar |
|---|---|---|
| `style={{ ...: '#hex' }}` (xom hex) | **~250** | **42 fayl** |
| `style={{ ...: 'rgba()/rgb()' }}` | **~31** | **21 fayl** |
| Tailwind arbitrary hex `text-[#...]`/`bg-[#...]` | **55** | **12 fayl** |

**Direktoriya bo'yicha taqsim (inline hex):**
- `pos-monitor/` — **16 fayl** (eng katta to'plam)
- `components/` — **16 fayl** (kanban, crm/workspace, aisha, hr/org)
- `pages/` (asosiy ERP) — **13 fayl** (crm, kanban, mini-app, EmployeeProfile)

**Eng yomon namuna — butun sahifa inline-style bilan qurilgan (token YO'Q):**
`pos-monitor/pages/PosKpiDashboard.tsx` — 23 ta inline xom-rang:
- `:69` → `style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px 24px" }}`
- `:73` → `color: "#9CA3AF"`, `:74` → `color: "#1F2937"`, `:80` → `background: "#F3F4F6", border: "1px solid #E5E7EB"`, `:107` → `background: "#FFF", border: "1px solid #E5E7EB"`
- ❌ Bu sahifa EP komponent ham, token ham ishlatmaydi — to'liq qo'lda qurilgan. Token-migratsiya uchun asosiy nomzod.

**Boshqa yuqori-konsentratsiyali fayllar:** `pos-monitor/pages/PosGoodsReceipts.tsx` (22), `pos-monitor/pages/PosMaterials.tsx` (14), `pos-monitor/pages/PosReservations.tsx` (14), `pages/crm/EntityCardSections.tsx` (11), `components/aisha/TransparencyPanel.tsx` (11), `components/kanban/ThreeBasketsPanel.tsx` (9).

**Brend istisno (kichik):** `components/EuroprintLogo.tsx:24` → `style={{ color: "#1a56db" }}` + `"#111827"` — logo brend ranglari. Texnik jihatdan buzilish, lekin past ustuvorlik (brendni token sifatida `--ep-brand-*` qilib chiqarish mumkin).

> ⚠️ **MUHIM kontekst:** `check-design-tokens.mjs:11` o'zi yozadi — "~950 pre-existing violations never block a commit — only NEW regressions do". Guard **diff-aware** (faqat staged `+` qatorlarni tekshiradi). Demak yuqoridagi ~250+55 raqam **tarixiy qarz**, regress emas. Token (`var(--ep-*)`) ishlatadigan yangi kod toza o'tadi.

### 2.3. Legitim token-in-style ✅
`hsl(var(--...))` ni inline style ichida ishlatish **buzilish EMAS** (token-asoslangan). Bu pattern EP komponentlar ichida ishlatiladi (masalan `EPEmptyState.tsx:54` → `style={{ background: "hsl(var(--muted))" }}`) va guard allowlistida (`components/ep/**`). Non-EP fayllarda faqat 4 marta uchraydi — ya'ni to'g'ri yo'l kam takrorlangan, ko'pchilik xom hex'ga o'tib ketgan.

---

## 3. Komponent kutubxonasi izchilligi

### 3.1. Ikki to'plam: `ui/` (shadcn) + `ep/` (EuroPrint) ✅
- **`components/ui/`** — 45+ primitiv (shadcn/ui asosida): `button`, `card`, `dialog`, `table`, `tabs`, `select`, `toast`, va boshqalar. Bundan tashqari **maxsus holat komponentlari**: `empty-state.tsx`, `error-state.tsx`, `loading-skeleton.tsx`, `page-state.tsx`, `page-header.tsx`, `module-page.tsx`, `stats-card.tsx`, `pill-tabs.tsx`.
- **`components/ep/`** — 11 ta EuroPrint dizayn-til komponenti (`ep/index.ts`): `EPCard`, `EPKpiCard`, `EPStatusPill`, `EPPageHeader`, `EPErrorState`, `EPEmptyState`, `EPSkeleton*` (4 variant), `EPLoader`, `EPComingSoon`, `EPNumberedSection`, `useCountUp`.

✅ EP barrel o'zini "260+ ERP sahifa uchun kanonik usul" deb belgilaydi (`ep/index.ts:9-11`) va **411 faylda haqiqatan import qilinadi** — keng qabul qilingan.

### 3.2. Bo'sh / loading / xato holat shabloni ✅ (kuchli)
**Universal `PageState` wrapper** (`components/ui/page-state.tsx`) 4 holatni avtomatik boshqaradi: loading → tegishli skeleton (table/card/dashboard/form/list), error → `ErrorState` (retry bilan), empty → `EmptyState` (icon+action), ready → children. Default matnlar o'zbekcha (`page-state.tsx:94-95` "Ma'lumot topilmadi", "Hozircha bu yerda ko'rsatish uchun ma'lumot yo'q").

`EPEmptyState` (`ep/EPEmptyState.tsx`) — professional UX: rag'batlantiruvchi ohang, har doim keyingi qadam (action CTA), 48px muted tile, token-rang. Hujjatlangan anatomiya bilan (`:6-22`).

✅ Bu — yetuk dizayn tizimining belgisi. Loading/error/empty shablonlar **mavjud va sifatli**.

### 3.3. `kit.css` — o'lik parallel vokabular ⚠️
`erp-modern-ui/kit.css` (1237 satr) "SHIPNOW UI-kit reference atoms" deb belgilangan (`index.css:11`) va **122 ta global komponent-klass** beradi: `.kpi`, `.donut`, `.bar`, `.btn`, `.card`, `.seg`, `.tbl`, `.pill`, `.alert-tile`, va boshqalar.

❌ **Lekin TSX'da deyarli ishlatilmaydi** — `.kpi/.donut/.seg/.bar-grp` qidiruvi faqat ~5 faylga mos keldi. Bu:
- Ikkinchi, EP komponentlar bilan **raqobatlashuvchi** dizayn-til (`.card` klass vs `<EPCard>`; `.btn` vs `<Button>`).
- 1237 satr asosan o'lik CSS yuk.
- Izchillik xavfi: agar kimdir `.kpi` ishlatsa, u EP/token tizimidan ajralib qoladi.

⚠️ Tavsiya (faqat tahlil — bajarmadim): `kit.css` ni audit qilib, ishlatilmaydigan klasslarni olib tashlash yoki EP komponentlarga konsolidatsiya. Hozir = chalkashlik manbai.

---

## 4. Dublikat / eski sahifalar va manbalar

### 4.1. Sidebar manbasi — kanonik ✅
- **`components/sidebar/constants.ts`** (736 satr) = jonli sidebar manbasi; `ModuleSidebar.tsx` va `CommandPalette.tsx` import qiladi.
- `lib/constants.ts` (33 satr) = **boshqa narsa** (pagination/cache/UI o'lchamlari konstantalari), sidebar emas — nomdoshlik chalkashligi, lekin dublikat emas.
- ✅ Memory eslatmasiga mos (constants.ts = yagona sidebar manba; eski groups-a/b partiallar oldin tozalangan). Bu skanda **takroriy sidebar ta'rifi topilmadi**.

### 4.2. Stale fayllar ⚠️ (kichik)
- `locales/uz/common.json.bak.t2c` va yana 1 ta `.bak` fayl (jami 2) — eski zaxira, tozalanishi mumkin.
- `locales/_RU_UNTRANSLATED_AUDIT.md` (22KB) — eski audit artefakti locale papkasida.

### 4.3. @deprecated belgisi
Bu umumiy-dizayn skanida sahifa-darajadagi `@deprecated` topilmadi (modul-spetsifik skanlarda ko'rilishi mumkin). Sidebar/route dublikat = yo'q.

---

## 5. Komponent qayta-ishlatish

✅ **Yuqori darajada qayta ishlatiladi:**
- EP komponentlar: **411 fayl** import qiladi.
- `PageState`/`ModulePage` universal wrapper: 51 fayl.
- shadcn `ui/` primitivlari: deyarli hamma sahifada (`Button`, `Card`, `Dialog`, `Table`).

⚠️ **Lekin "har sahifa o'ziniki" anti-pattern qisman saqlanib qolgan:**
- `pos-monitor/` sahifalari ko'pincha EP/`PageState` o'rniga **xom `<div style={{...}}>`** bilan qurilgan (§2.2 dalil). Bu modul dizayn tizimidan eng ko'p chetga chiqqan.
- 37 sahifa hech qanday `t()/tLabel` ishlatmaydi (§1) — ehtimol ba'zilari hardcoded matnli yoki sof-konteyner.

Umumiy baho: **shablonlar mavjud va ko'p ishlatiladi**, lekin pos-monitor klasteri va ba'zi eski sahifalar ularni chetlab o'tadi.

---

## 6. i18n — 3 til to'liqligi (vizyon §1.4 / §16.4)

### 6.1. Tuzilma ✅
- 3 til papkasi: `locales/uz/`, `locales/ru/`, `locales/uz-cyr/` — har biri **55 JSON namespace** (simmetrik soni).
- `lib/i18n/loader.ts` har 55 ns ni statik import qiladi (`loader.ts:9-58` uz qismi) — runtime-da to'liq yuklash, lazy-gap yo'q.
- `uz/common.json` = 8625 satr (eng katta ns).
- `tLabel(` — 136 faylda, 786 chaqiruv.

### 6.2. Sifat tekshiruvi ✅ (kutilganidan yaxshi)
| Tekshiruv | Natija | Dalil |
|---|---|---|
| `uz/` da Kirill harf oqishi (lotin bo'lishi kerak) | **0 fayl** | `grep -lP '[\x{0400}-\x{04FF}]' uz/*.json` |
| `uz/` qiymatlarida camelCase raw-kalit oqishi | **1** (deyarli yo'q) | `grep -P '"...":\s*"camelCase"'` |
| TSX JSX ichida hardcoded Rus Kirill matn | **0 fayl** | `grep -lP '>[^<]*[\x{0400}-\x{04FF}]{3,}' pages` |
| TSX JSX ichida hardcoded UZ matn (heuristik) | **2 fayl** (past) | `grep -lP "qo'sh|o'chir|saqla..."` |

⚠️ **"Ru da inglizcha qoldiq 359 ta" — asosan SOXTA signal:** Tekshirilganda bular brend/atama nomlari: `EuroPrint`, `Telegram`, `WhatsApp`, `Gemini Vision`, `Instagram`, `LinkedIn`, `Inter Bold`, `Social API` (`ru/common.json`). Bular tarjima qilinmasligi to'g'ri. Haqiqiy tarjima-bo'shliq emas.

⚠️ **Haqiqiy i18n bo'shliq = JSON emas, TSX'dagi hardcoded matn.** Lekin heuristik skan faqat 2 pages faylda apostrof-uzbek topdi → ko'pchilik matn allaqachon `tLabel` ga ko'chirilgan (memory: i18n sprintlar 2026-05-21..26 da bajarilgan). Modul-spetsifik skanlar aniqroq ko'rsatadi.

### 6.3. camelCase kalit — tushuntirish (vizyon noto'g'ri tushunilmasin)
Vazifa "camelCase raw-kalit (masalan `hechQaysiOmbordaStokYoq`)" ni qidirishni so'radi. **Bunday OQIB chiqqan kalit topilmadi** — kod `tLabel('common.ns.someKey', 'O'zbekcha default')` shaklini ishlatadi, bunda camelCase kalit JSON ichida UZ qiymatga xaritalanadi. Foydalanuvchi camelCase matnni KO'RMAYDI (loader FLAT lookup qiladi, default arg fallback bo'ladi). Ya'ni bu **to'g'ri pattern**, buzilish emas. (Faqat 1 ta qiymat-darajadagi oqish bor — ahamiyatsiz.)

---

## 7. Vizyonga moslik xulosasi (kod nima ko'rsatadi vs §1.13/§16.4/§1.4 nima istaydi)

| Vizyon talabi | Holat | Izoh |
|---|---|---|
| Professional, izchil dizayn tizimi | ✅ | Token + EP kutubxona + universal `PageState` — yetuk arxitektura |
| "Raw hex/rgb TAQIQ" (§1.13) | ⚠️ | ~250 inline hex + 55 Tailwind hex (LEGACY qarz; guard yangisini bloklaydi) |
| "Har sahifa EP komponent" (§1.13) | ⚠️ | 411 fayl EP ishlatadi ✅, lekin pos-monitor klasteri xom div bilan chetlab o'tadi ❌ |
| "Har matn `tLabel`" (§16.4) | ✅ | 786 chaqiruv; JSON qatlam toza; faqat ~2 pages hardcoded UZ |
| 3 til: uz-lotin / uz-kirill / rus (§1.4) | ✅ | 55 ns × 3 til simmetrik; uz da Kirill oqishi 0 |
| Yagona token/komponent manbasi (Qoida 21) | ✅ / ⚠️ | EP+token = yagona ✅; lekin `kit.css` (122 klass) = o'lik raqobat vokabular ⚠️ |
| Dizayn regress-himoyasi | ✅ | `check-design-tokens.mjs` diff-aware guard mavjud + Qoida 21 |

---

## 8. Topilmalar ro'yxati (✅/⚠️/❌ + dalil)

1. ✅ **Token tizimi to'liq** — HSL CSS-var, modul ranglari, dark mode, Inter shrift. `erp-modern-ui/design-tokens.css:8-234`.
2. ✅ **EP komponent kutubxonasi keng qabul qilingan** — 411 fayl import. `components/ep/index.ts`.
3. ✅ **Universal holat shabloni** (loading/error/empty/ready) — `components/ui/page-state.tsx`, `components/ep/EPEmptyState.tsx`.
4. ✅ **i18n 3 til simmetrik va toza** — 55 ns × 3; uz da Kirill 0; 786 `tLabel`. `lib/i18n/loader.ts`.
5. ✅ **Sidebar kanonik, dublikatsiz** — `components/sidebar/constants.ts` (736 satr).
6. ✅ **Regress-guard mavjud** — `scripts/check-design-tokens.mjs` (diff-aware) + Qoida 21.
7. ⚠️ **~250 inline xom-rang + 55 Tailwind hex** (LEGACY) — `pos-monitor/` (16), `components/` (16), `pages/` (13). Eng yomon: `pos-monitor/pages/PosKpiDashboard.tsx` (23, butun sahifa inline).
8. ⚠️ **`kit.css` o'lik parallel vokabular** — 122 klass, TSX'da ~5 fayl ishlatadi. `erp-modern-ui/kit.css` (1237 satr).
9. ⚠️ **pos-monitor moduli dizayn tizimidan eng ko'p chetda** — EP/`PageState`/token o'rniga xom `<div style>`.
10. ⚠️ **Stale fayllar** — 2 ta `.json.bak`, `locales/_RU_UNTRANSLATED_AUDIT.md`.
11. ⚠️ **Brend rang token emas** — `components/EuroprintLogo.tsx:24` (`#1a56db`, `#111827`); past ustuvorlik.
12. ✅ **camelCase raw-kalit OQISHI yo'q** — `tLabel(key, default)` pattern to'g'ri; foydalanuvchi camelCase ko'rmaydi.

---

## 9. Tavsiyalar (FAQAT tahlil — hech narsa bajarilmadi/o'zgartirilmadi)

> ⚠️ Qoida 23: bu tavsiyalar ≠ ruxsat. Bajarish faqat egasi aniq "ha, bajar" deganda.

1. **pos-monitor token-migratsiyasi** (eng yuqori ta'sir): `PosKpiDashboard.tsx` va 15 boshqa pos fayldagi inline hex → `var(--*)` token + EP komponent. Bu §1.13 ga muvofiqlikni keskin oshiradi.
2. **`kit.css` audit/konsolidatsiya**: ishlatilmaydigan 122 klassni o'lchab, EP komponentlarga birlashtirish yoki o'chirish (1237 satr o'lik yuk).
3. **Tailwind arbitrary-hex** (`text-[#...]`, 55 ta) → semantic Tailwind class yoki token; guard hozir WARN, FAZA 2 da BLOCK qilinishi rejada.
4. **Brendni tokenlashtirish**: logo ranglarini `--ep-brand-blue`/`--ep-brand-ink` qilib chiqarish.
5. **Stale tozalash**: `locales/**/*.bak*` (2) va `_RU_UNTRANSLATED_AUDIT.md` o'chirish.

---

*Hisobot tugadi. READ-ONLY — faqat shu fayl yozildi, boshqa hech narsa o'zgartirilmadi.*
