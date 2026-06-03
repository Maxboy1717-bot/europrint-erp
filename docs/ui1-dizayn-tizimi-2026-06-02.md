# UI-1 — Dizayn-tizimi va UI Mosligi Tahlili (Frontend)

**Sana:** 2026-06-02
**Rol:** 🔵 Tahlilchi (READ-ONLY — hech bir fayl o'zgartirilmadi, faqat shu hisobot yozildi)
**Qamrov:** `artifacts/erp-dashboard/src` — 1144 sahifa fayli (`pages/`), `components/`, `erp-modern-ui/`, `pos-monitor/`, `camera-ai-modern/`
**Metod:** Kod asosida (brauzer yo'q). Asosiy manbalar o'qildi: `components.json`, `index.css`, `erp-modern-ui/*.css`, `App.tsx`, `components/ui/*`, `components/ep/*`.

---

## 1. Komponent kutubxonasi

- **shadcn/ui** ("new-york" uslubi) tasdiqlandi — `components.json:3` (`"style": "new-york"`, `baseColor: "neutral"`, `cssVariables: true`). RSC yo'q (Vite SPA).
- **Radix UI** primitivlari to'liq to'plam — `package.json` da 30+ `@radix-ui/react-*` paket (accordion, dialog, dropdown, select, popover, tabs, toast, tooltip, ...).
- **Yordamchi kutubxonalar:** `class-variance-authority` (cva), `clsx` + `tailwind-merge` (`cn()` helper), `lucide-react` (ikonkalar), `cmdk` (CommandPalette), `recharts` (grafiklar), `framer-motion` (animatsiya), `react-hook-form` + `zod` (formalar), `vaul`/`input-otp`/`embla-carousel`.
- **Bazaviy UI primitivlar** (`components/ui/`, ~45 fayl): accordion, alert, alert-dialog, avatar, badge, button, calendar, card, checkbox, collapsible, command, confirm-dialog, dialog, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toast, toaster, tooltip + qo'shimcha kompozit primitivlar (page-header, page-state, module-page, stats-card, pill-tabs, loading-skeleton, empty-state, error-state).
- **EP brendlangan qatlam** (`components/ep/`, 11 ta): EPCard, EPKpiCard, EPPageHeader, EPStatusPill, EPEmptyState, EPErrorState, EPLoader, EPSkeleton, EPNumberedSection, EPComingSoon + `useCountUp`. Bu shadcn ustidan qurilgan brend-spetsifik shablonlar.

**Baho:** Sanoat standartidagi, izchil tanlangan stek. ✅

---

## 2. Dizayn tokenlari

Tokenlar **markazlashtirilgan** va ko'p qatlamli (CSS o'zgaruvchilari, Tailwind v4 `@theme inline`):

- **Qatlam 1 — bazaviy:** `erp-modern-ui/design-tokens.css` — `--background`, `--foreground`, `--primary`, `--card`, `--sidebar`, `--muted`, `--destructive`, modul ranglari (`--module-sd/pp/hr/warehouse/fi` + light/dark), chart ranglari, semantik holatlar (`--success/--warning/--info/--error`), tipografiya (`--font-sans: Inter`), `--radius: 0.75rem`, soyalar shkalasi (`--shadow-2xs` … `--shadow-2xl`).
- **Qatlam 2 — brend override:** `erp-modern-ui/europrint-mockup-theme.css` (821 satr) — yakuniy brend ranglarini o'rnatadi: `--ep-primary: #FF902F` (issiq apelsin, HSL 28° 100% 59%) va to'liq `--ep-*` nomlar fazosi (`--ep-green/red/blue/purple/cyan/pink`, `--ep-surface`, `--ep-border`, `--ep-muted`).
- **Qatlam 3 — UI-kit:** `kit.css` (1237 satr) — SHIPNOW'dan ilhomlangan "warm blush" palitra (`--bg-blush`, `--line-warm`) + atom klasslar (`.kpi`, `.card`, `.donut`, `.seg`, `.tbl`, `.pill`, `.btn`).
- **Tailwind bog'lanishi:** `index.css` `@theme inline` da har bir token Tailwind utiliti sifatida (`--color-primary: hsl(var(--primary))`) ko'rsatilgan, shu sabab `bg-primary`, `text-muted-foreground`, `border-module-hr` kabi semantik klasslar tokenга bog'lanadi.
- **Regress-himoya:** CLAUDE.md Qoida 21 + `scripts/check-design-tokens.mjs` (pre-commit) — inline xom rang BLOK, arbitrary hex WARN. Bu samarali ishlayapti: inline xom rangli faqat **29 fayl**, `text-[#hex]`/`bg-[#hex]` faqat **62 ta** ishlatma (1144 sahifaga nisbatan past).

**⚠️ Diqqat:** 3 qatlamli override (token → mockup-theme → kit) murakkab. `design-tokens.css` sharhida `Primary: #FF902F` deb yozilgan, lekin uning **o'zida qiymat #ff5d2e** (`14 100% 59%`) — faqat Qatlam 2 uni #FF902F (28°) ga o'zgartiradi. Bu sharh/qiymat nomuvofiqligi va "qaysi qatlam g'olib" degan noaniqlikni tug'diradi.

**Baho:** Kuchli, markazlashgan token tizimi; lekin qatlamlilik soddalashtirishni talab qiladi. ✅/⚠️

---

## 3. Layout / shell mosligi

Asosiy navigatsiya **yagona shell** orqali — `App.tsx` aniq ajratilgan:

- **Asosiy ERP:** `AppShellModern` (`erp-modern-ui/AppShellModern.tsx`) — fixed header (h-14, logo + ModuleTabs + til/tema/avatar) + `ModuleSidebar` (chap, lg:ml-64) + `<main>` scroll-konteyner. `AppRouter` shu yerga joylashadi.
- **Maxsus shell'lar (alohida, atayin):** POS Monitor (`/pos-monitor` → `PosMonitorApp`), Telegram Mini-App (`/mini-app`), Chat (`/chat` — to'liq ekran Telegram uslubi), IoT Tablet (`/iot/tablet`), public sahifalar (AI-suhbat, HR-test), Login. Bular biznes-jihatdan asosli ajralishlar (tablet/kassir/mehmon konteksti), takrorlanuvchi raqobat emas.

**Sahifa-shablon (page-shell) patternlari** — bu yerda ko'p manba bor:
1. `components/ui/module-page.tsx` → `ModulePage` (modul-rangli sarlavha bar, border-l-4) — **178 sahifa** `ModulePage`/`PageHeader` import qiladi.
2. `components/ui/page-header.tsx` → `PageHeader`.
3. `components/ep/EPPageHeader.tsx` → `EPPageHeader` (EP brend variant).
4. `components/ModuleSectionHeader.tsx` + `components/DedicatedPageShell.tsx`.
5. Lokal takror: ayrim sahifalar **o'z `PageHeader`'ini qayta e'lon qilgan** (masalan `pages/ChartOfAccountsSections.tsx:233`, `pages/FaceRegistrationSections.tsx:25`) — bu kanonik shablondan chetlashish.

**Baho:** Bitta global app-shell — yaxshi (✅). Lekin **4-5 ta raqobatlashuvchi sahifa-sarlavha shabloni** (ModulePage / PageHeader / EPPageHeader / ModuleSectionHeader + lokal kopiya) standartlashtirishni kutadi. ⚠️

---

## 4. Tema (theming)

- **Dark mode:** ✅ To'liq. `next-themes` orqali (`ErpThemeProvider.tsx`) — `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `storageKey="theme"`. `index.css:14` `@custom-variant dark`; `design-tokens.css` `.dark {}` da to'liq dark palitra (Bitrix24 navy: `#1a1a2e/#16213e`). `europrint-mockup-theme.css` da ham `.dark` override bor. `ThemeToggleModern` header'da.
- **Brend ranglar:** Asosan izchil — apelsin `#FF902F` (`--primary`/`--ep-primary`/`--sidebar-primary`). Modul rang-kodlari izchil (SD=ko'k, PP=yashil, HR=binafsha, Ombor=amber, FI=cyan) `module-page.tsx` da markazlashgan.
- **RTL:** ❌ Yo'q. `dir="rtl"` deyarli ishlatilmagan (1 fayl). UZ/RU uchun talab emas, ammo a11y/kelajak uchun e'tibor.
- **⚠️ Tema kelishmovchiligi:** Chat sahifasi global ERP tema'ni `[data-chat-page]` selektorlari bilan `!important` orqali **bekor qiladi** (`index.css:145-184`) — global input/textarea/label override'lari Telegram UI'ni buzgani uchun. Bu global qatlamlar juda keng ekanining belgisi (texnik qarz).

**Baho:** Dark mode + brend mustahkam; RTL yo'q; global override'lar bilan ziddiyat. ✅/⚠️

---

## 5. Qayta ishlatish vs takrorlanish

**Kuchli qayta ishlatish (✅):**
- `Card` — yagona kanonik `@/components/ui/card` **200+ faylda**; `Table` — `@/components/ui/table` **217 faylda**. Bitta Button (`ui/button.tsx`, cva 8 variant: default/solid/destructive/outline/secondary/dark/ghost/link).
- Toast yagona: shadcn `useToast` (**317 fayl**). `sonner` paket o'rnatilgan, lekin **0 faylda** ishlatilmaydi (o'lik dependency).
- i18n provayder, ThemeProvider, AppShell — yagona.

**Takrorlanishlar (⚠️):**
- **EmptyState ×4:** `components/EmptyState.tsx`, `components/ui/empty-state.tsx`, `components/ep/EPEmptyState.tsx`, `components/dizayn-new/EmptyState.tsx`.
- **KPI/Stat karta ×3:** `components/ui/stats-card.tsx`, `components/ep/EPKpiCard.tsx`, `components/shared/StatCard.tsx`.
- **Confirm-dialog ×2:** `components/ui/confirm-dialog.tsx` + `components/delete-confirm-dialog.tsx`.
- **DataTable ×2 tizim:** kanonik `ui/table` + alohida `components/dizayn-new/DataTable.tsx` (yangi tashlangan/refaktor qoldiq — `DataTable.atoms/employee/types`).
- **PageHeader lokal kopiyalari** (3-bo'limga qarang).

**Baho:** Asosiy atomlar (Card/Table/Button/Toast) ajoyib darajada bitta; kompozit komponentlar (EmptyState, KPI-karta, PageHeader, DataTable) bir nechta raqobatlashuvchi versiyaga ega. ⚠️

---

## 6. Asosiy a11y (accessibility)

- **aria-* atributlari:** faqat **73 faylda** (151 ta ishlatma) — 1144+ sahifaga nisbatan **juda kam**.
- **role=":** faqat **11 faylda**.
- **Ijobiy:** AppShellModern'da `aria-label` (menyu tugmasi), `data-testid` keng (test uchun). Radix primitivlari (Dialog/Dropdown/Select/Tooltip) ichki klaviatura/fokus/aria'ni avtomatik beradi — bu a11y'ning katta qismini "tekin" ta'minlaydi.
- **Salbiy:** Maxsus interaktiv elementlar (rang-kodli status nuqtalari, custom `<button>` chiplari, jadval saralash) ko'pincha aria'siz. Fokus-ko'rinish (`focus-visible:ring`) Button'da bor, lekin maxsus kliklanadigan `<div>`larda yo'q. Rang-asoslangan status (`.status-dot`) faqat rang bilan — matn alternativasi cheklangan.

**Baho:** Radix tufayli bazaviy a11y bor, lekin maxsus UI qatlamida tizimli a11y kam. ⚠️/❌

---

## 7. UI'da i18n integratsiyasi

- **Lokalizatsiya:** 3 til — `locales/uz`, `locales/uz-cyr` (Kirill), `locales/ru` (60+ namespace har birida: common, hr, finance, ai, ...). `LanguageProvider` + `useTranslation` (`@/lib/i18n`).
- **Qamrov:** **993 fayl** (pages+components) `useTranslation`/`@/lib/i18n` ishlatadi — juda yuqori integratsiya. `LanguageSwitcher` header'da.
- **⚠️ Hardcoded matnlar qoldig'i:** TSX ichida hali UZ matnlar bor (masalan `pages/GLDocuments.tsx:391` "Hujjat yarat", `pages/HRConflict.tsx:173` "Hal qil", `pages/SuperAdminPanelSections.tsx:151` "Modullarni tahrir"; `placeholder="..."` da ~8 ta). Bu i18n FINAL hisobotidagi ~2675 hardcoded qoldig'iga mos (oldingi sessiyalar 3262→2675 ga tushirgan).
- `locales/_RU_UNTRANSLATED_AUDIT.md` — RU tarjima bo'shliqlari kuzatilmoqda.

**Baho:** Keng, yetuk i18n; lekin to'liq emas — hardcoded TSX matnlar va RU bo'shliqlari qoladi. ✅/⚠️

---

## 8. Dizayn-tizimi yetuklik bahosi

**Umumiy: B (yaxshi, ishlab chiqarishga yaroqli, lekin konsolidatsiya kerak)**

| Mezon | Baho |
|---|---|
| Komponent kutubxonasi (shadcn+Radix) | A |
| Token tizimi (markazlashgan) | A− |
| Token qatlamlarining soddaligi | C+ |
| Global app-shell | A |
| Sahifa-shablon standartlashuvi | C+ |
| Dark mode | A |
| RTL | F (yo'q — UZ/RU uchun N/A) |
| Atom qayta ishlatish (Card/Table/Button) | A |
| Kompozit takrorlanishi (EmptyState/KPI/PageHeader) | C |
| Accessibility | C− |
| i18n integratsiyasi | B+ |

---

## 9. ✅ / ⚠️ / ❌ jadval

| Soha | Holat | Izoh |
|---|---|---|
| shadcn/ui + Radix primitivlar | ✅ | `components.json` new-york; 45 ui primitiv; 30+ Radix paket |
| Markazlashgan tokenlar | ✅ | `design-tokens.css` + `@theme inline` + EP namespace |
| Token override qatlamlari (3 ta) | ⚠️ | token→mockup-theme→kit; sharh/qiymat nomuvofiqligi (#FF902F vs #ff5d2e) |
| Token regress-himoya (Qoida 21) | ✅ | inline xom rang faqat 29 fayl, `[#hex]` 62 ta |
| Yagona app-shell (AppShellModern) | ✅ | `App.tsx` aniq routing; POS/Chat/Tablet asosli ajratilgan |
| Sahifa-sarlavha shablonlari | ⚠️ | ModulePage / PageHeader / EPPageHeader / ModuleSectionHeader + lokal kopiyalar (4-5 raqobat) |
| Dark mode | ✅ | next-themes, system default, to'liq `.dark` palitra |
| Brend rang izchilligi | ✅ | apelsin #FF902F + modul rang-kodlari markazlashgan |
| RTL | ❌ | yo'q (UZ/RU uchun talab emas) |
| Global tema override ziddiyati | ⚠️ | Chat `[data-chat-page] !important` reset (texnik qarz) |
| Card / Table / Button / Toast bittaligi | ✅ | Card 200+, Table 217, Toast 317 fayl — kanonik |
| `sonner` o'lik dependency | ⚠️ | o'rnatilgan, 0 faylda ishlatilgan |
| EmptyState ×4 | ⚠️ | 4 raqobat implementatsiya |
| KPI/Stat karta ×3, Confirm ×2, DataTable ×2 | ⚠️ | konsolidatsiya kerak |
| Accessibility (aria/role) | ❌ | aria 73 fayl, role 11 fayl (1144+ sahifaga juda kam) |
| Radix orqali bazaviy a11y | ✅ | dialog/select/tooltip klaviatura+fokus tekin |
| i18n integratsiyasi (3 til, 993 fayl) | ✅ | uz / uz-cyr / ru |
| Hardcoded TSX matnlar | ⚠️ | ~2675 qoldiq + RU bo'shliqlar |

---

## 10. Tavsiyalar (faqat tavsiya — bajarish egasi ruxsatisiz EMAS, Qoida 23)

1. **Sahifa-sarlavha shablonini bittaga keltirish** — `EPPageHeader`'ni yagona kanonik qilib, `ModulePage`/`PageHeader`/`ModuleSectionHeader` va lokal kopiyalarni (ChartOfAccountsSections, FaceRegistrationSections) unga ko'chirish.
2. **EmptyState ×4 → bittaga** (`ep/EPEmptyState` kanonik), KPI-karta ×3 → `EPKpiCard`, confirm-dialog ×2 → `ui/confirm-dialog`. `dizayn-new/` (tashlangan refaktor) tozalash.
3. **Token qatlamlarini soddalashtirish** — `design-tokens.css` ichidagi noto'g'ri sharh va `#ff5d2e` bazaviy qiymatni yakuniy `#FF902F` ga moslab, 3 qatlamli override'ni 1-2 qatlamga kamaytirish; "qaysi qatlam g'olib" hujjatini yozish.
4. **Chat `!important` reset'ni** global input/textarea override'ini kengligini kamaytirish bilan almashtirish (texnik qarzni yo'qotish).
5. **A11y minimumi** — kanonik shablonlarga (Button allaqachon `focus-visible:ring`) aria-label/role qo'shish; status-dot'larga matn alternativasi; kliklanadigan `<div>`larni `<button>`/role bilan almashtirish.
6. `sonner` o'lik dependency'ni olib tashlash (yoki to'liq sonner'ga o'tish — hozir aralash emas, faqat shadcn toast).
7. Qolgan hardcoded TSX matnlarni (GLDocuments, HRConflict, SuperAdminPanelSections, ...) i18n kalitlariga ko'chirish; RU bo'shliqlarini yopish.

---

*Hisobot UI-1 vazifasi uchun tayyorlandi. Faqat shu `.md` fayl yozildi; boshqa hech narsa o'zgartirilmadi (🔵 Tahlilchi roli, Qoida 23).*
