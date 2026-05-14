# EuroPrint Design System

A comprehensive design system for **EuroPrint** — Uzbekistan's №1 industrial printing company — covering both the internal **ERP Dashboard** and the public-facing **marketing website**.

---

## 1. Company & Product Context

**EuroPrint** is a large industrial printing and packaging manufacturer based in Tashkent, Uzbekistan.

- **15+ years** on the market
- **400+** employees
- **15,000 m²** production facility
- **50+** printing machines
- **2,500+** customers
- ISO 9001:2015 certified
- Operates in **Uzbek (primary)** and **Russian (secondary)** — UI strings are i18n'd with `t()` keys

### Products in scope

This design system covers **two distinct surfaces**:

| Product | Audience | Codebase path | Visual direction |
|---|---|---|---|
| **EuroPrint ERP Dashboard** | Internal staff (HR, production, finance, sales, warehouse, …) | `artifacts/erp-dashboard/` | "EP Linear Soft" — dense, data-heavy SaaS shell with light sidebar, warm off-white background, soft shadows, Inter typeface. Built on shadcn/ui. |
| **EuroPrint Public Site** (europrint.uz) | Customers, B2B buyers, job-seekers | `artifacts/europrint-site/` | Marketing site — navy hero (`#1a1a2e`) with orange brand pops, rounded cards, big stats, lots of whitespace. Built on shadcn/ui + Tailwind. |

The ERP is the **canonical brand surface** going forward (the newer "EP Linear Soft" tokens live there). The public site uses a slightly older Bitrix24-inspired variant.

### Source materials

All references in this system were extracted from the locally-attached `EuroPrint-Clean/` codebase:

- `artifacts/erp-dashboard/src/erp-modern-ui/europrint-mockup-theme.css` — **canonical** design tokens ("EP Linear Soft")
- `artifacts/erp-dashboard/src/erp-modern-ui/design-tokens.css` — base shadcn token layer
- `artifacts/erp-dashboard/src/components/ui/` — full shadcn/ui component library (~65 components)
- `artifacts/erp-dashboard/src/components/EuroprintLogo.tsx` — logo component
- `artifacts/europrint-site/src/pages/Home.tsx` — marketing hero/services/CTA patterns
- `artifacts/europrint-site/src/components/layout/{Navbar,Footer}.tsx`
- `europrint-dashboard.html` — standalone HTML mockup of the full ERP shell
- `Uzbek-Language-Module/CLAUDE.md` & `replit.md` — project documentation

Original files preserved in `_source/` for reference.

---

## 2. Content Fundamentals — Tone & Copywriting

EuroPrint's copy is **direct, confident, and warm**. It speaks in the customer's language (Uzbek-first) and emphasises **scale, reliability, and craft**.

### Voice
- **First person plural** when describing the company: *"Biz yetkazib beramiz"* (We deliver), *"Bizning xizmatlar"* (Our services)
- **Second person formal** when addressing the user: *"sizning biznesingiz uchun"* (for your business)
- Action-oriented headlines that promise a concrete outcome: *"Bepul narx olish"* (Get a free quote), *"Hoziroq boshlang"* (Start now)
- ERP UI strings are **task-oriented and short**, often using imperative verbs: *"O'chirish"* (Delete), *"Saqlash"* (Save), *"Tasdiqlash"* (Confirm)

### Tone by surface

| Surface | Tone | Examples |
|---|---|---|
| Public homepage | Bold, aspirational, stat-heavy | "Professional Bosma Yechimlar sizning biznesingiz uchun" · "15 yillik tajriba, 400+ xodim" |
| ERP shell | Neutral, terse, role-specific | "Bosh sahifa" · "HR Dashboard" · "Davomat" |
| ERP buttons | Verb + noun, no fluff | "Yangi xodim qo'shish" · "Hisobotni eksport qilish" |
| Errors / confirms | Plain, no jargon | "Bu amalni qaytarib bo'lmaydi." · "Xatolik yuz berdi" |
| Empty states | Encouraging, gives next step | "Hali maʼlumot yoʻq. Birinchi yozuvni qoʻshing." |

### Casing rules
- **Sentence case** for UI labels, buttons, page titles in Uzbek (e.g. *"Yangi buyurtma"*, not *"Yangi Buyurtma"*).
- **Title Case** only for proper nouns and brand: *EuroPrint*, *MES Panel*, *CRM*.
- Module abbreviations stay **UPPER**: *SD*, *HR*, *WMS*, *MES*, *PP*, *FI*, *QC*, *POS*.
- **Apostrophes**: Uzbek uses the curly `ʻ` (or straight `'`) — keep consistent within a sentence: *"Boʻlimlar"* or *"Bo'limlar"*.

### Vocabulary patterns
- **Numbers with units inline**: `+998 71 200 00 00`, `15,000 m²`, `400+ xodim`, `4.9 ★`, `24/7`
- **Stat blocks** love `value + label` pairs: `15+ / Yil tajriba`, `2,500+ / Mamnun mijozlar`
- **Status pills** use single short words: *Faol* (Active), *Yangi* (New), *Tugallandi* (Completed), *Kutilmoqda* (Pending)
- **CTAs** typically a verb phrase 2–4 words: *"Bepul narx olish"*, *"Katalogni koʻrish"*, *"Boʻlanish"*

### Emoji & decoration
- **No emoji in product UI.** The ERP and the public site are emoji-free.
- Decorative iconography is delivered exclusively through **Lucide** (public site, ERP React) or **Font Awesome 6** (standalone HTML mockups). See ICONOGRAPHY below.
- Unicode `★` is used for star ratings; `→` `←` appear inside button labels only when the icon component would be overkill.

---

## 3. Visual Foundations

### 3.1 Color philosophy

EuroPrint is built around a **warm, industrial orange** sitting on a **soft warm neutral** background, with a **navy dark surface** reserved for marketing hero/footer and the older sidebar variant.

| Token | Hex | Role |
|---|---|---|
| `--ep-primary` | `#FF902F` | Brand orange (ERP, canonical) |
| `--ep-primary-alt` | `#FF5D2E` | Brighter orange used on the public site |
| `--ep-navy` | `#1a1a2e` | Marketing hero, footer, dark CTAs |
| `--ep-bg` | `#FAFAF9` | Warm off-white page background |
| `--ep-surface` | `#FFFFFF` | Card surface, sidebar (Linear Soft) |
| `--ep-border` | `#EBEAE6` | Warm subtle border (NOT cool grey) |
| `--ep-text` | `#15171A` | Near-black warm body text |
| `--ep-muted` | `#6B6E72` | Secondary text, captions, eyebrow labels |

Status colors (`--ep-green`, `--ep-yellow`, `--ep-red`, `--ep-blue`, `--ep-purple`, `--ep-cyan`, `--ep-pink`) all sit at moderate saturation so they read as **muted/industrial**, not toy-bright.

Each **ERP module** has its own dedicated hue used in left-borders, icon backgrounds and chart series:

- **SD** (Sales) — blue `#3563AC`
- **PP** (Production) — green `#2E8A5A`
- **HR** — purple `#7A4FB1`
- **Warehouse** — amber `#B5891C`
- **Finance** — cyan `#1A8FAF`

### 3.2 Typography

- **Inter** — primary UI typeface, all weights 300/400/500/600/700/800. Used for both products. Loaded via Google Fonts.
- **JetBrains Mono** — code blocks, IDs, barcodes, SKUs.
- **Segoe UI** — legacy fallback on the public site (older theme variant). Still listed in the public-site stack but the ERP has fully moved to Inter.

The dashboard runs at **13px body**, **20px page titles**, **11px uppercase eyebrows for section labels and table headers** (with `letter-spacing: 0.6px`). Marketing copy scales much larger — `48px` hero h1, `30px` section h2, `18px` lead paragraphs.

See `colors_and_type.css` for the full scale + the semantic helpers (`.ep-h1`, `.ep-eyebrow`, `.ep-kpi-value`, …).

### 3.3 Spacing

A simple **4px-based scale**: `4 / 8 / 12 / 14 / 16 / 20 / 24 / 32 / 40 / 56 / 80 / 96`. The dashboard padding-system: cards use `14px` outer padding (`16–18px` for content sections), pages use `20–24px` outer padding. Marketing site sections breathe more: `96px` (`py-24`) vertical between sections.

### 3.4 Radius

Smaller and more conservative than typical SaaS — never fully pill except on chips:

- `6px` — small chips, status pills
- `8px` — buttons, inputs, controls (default `--radius`)
- `10px` — cards, modals, hero KPIs
- `12px+` — marketing CTA blocks, "trust" cards
- `9999px` — status pills, avatar circles only

### 3.5 Shadows & elevation

Linear-style **very soft** shadows on a near-black base (`rgba(15,17,21,…)`). Rarely deeper than `--sh-md` outside of modals. Brand-tinted shadow on primary CTAs (`0 4px 14px rgba(255,144,47,.30)`) sells the orange.

In dark mode shadows shift to `rgba(0,0,0,…)` at higher opacity to remain perceptible.

### 3.6 Borders

**1px solid `#EBEAE6`** is the universal divider. The ERP never uses thick borders. A 3px **left-border accent** (in the module color) is used on:
- Active sidebar nav items (`border-left: 3px solid var(--ep-primary)`)
- Priority task rows (`high → purple`, `medium → yellow`, `low → green`)
- Kanban column headings (a 10px dot, not a border)

### 3.7 Backgrounds & textures

- **No gradients in the ERP shell.** The dashboard is flat and clean.
- **Gradients** appear sparingly on the public site:
  - Hero CTA card: `linear-gradient(135deg, primary → orange → amber)`
  - Hero background: dark navy `#1a1a2e → #16213e → #0f3460` (radial blur orbs added on top)
- **No photo backgrounds** in the system itself; product photos / case studies are content, never decoration.
- **No textures, patterns, or grain.**

### 3.8 Hover / press / focus states

- **Buttons:** hover = `--ep-primary-dark` (`#F07F1B`) for primary, or `bg-muted` for ghost.
- **Sidebar nav:** hover = 4% primary tint, active = 6% primary tint + 3px left-border + orange text.
- **Cards / table rows:** hover = `bg-muted/30`, subtle border-tint toward primary on marketing cards.
- **Press:** no scale-shrink. Slight darken via background-color only.
- **Focus:** `2px solid rgba(255,144,47,.15)` outline + `border-color: var(--ep-primary)`. Never inset.

### 3.9 Animation & motion

EuroPrint reads as **modern and alive** — every interactive element responds. We use a small library of named keyframes (defined globally in `colors_and_type.css`) plus a count-up React hook in both UI kits.

**Keyframes** (`ep-*` namespace):

| Name | Where it lives | Duration |
|---|---|---|
| `ep-float` | Logo mark, hero stat icons | 5–6s · ease-in-out · infinite |
| `ep-pulse` | "Live" status dots, eyebrow ribbon | 1.5s · infinite |
| `ep-breathe` | Soft glows on factory card, CTA orbs | 2.4–6s · infinite |
| `ep-drift-a / drift-b` | Hero blur orbs (slow parallax-feel) | 10–14s · infinite |
| `ep-shimmer` | Primary CTA hover sweep, badge highlight | 1.0–1.2s · once-on-hover |
| `ep-fade-up` | Page-enter stagger for headlines, KPIs, cards | 0.55–0.8s · backwards |
| `ep-scale-in` | Factory card, hero stat tiles entrance | 0.7–0.8s · backwards |
| `ep-bar-grow` | Bar chart growth from baseline | 0.8s staggered · once |
| `ep-gradient-shift` | Hero headline orange word, CTA block gradient | 6–10s · infinite |
| `ep-rotate-slow` | Loading spinner | 1.6s · linear · infinite |

**Easing tokens** (use these instead of plain `ease`):

- `--ease-out-quart`: snappy out-curve — default for hover transforms
- `--ease-out-back`: subtle overshoot — used for icon scale/rotate
- `--ease-in-out`: balanced — used for continuous loops
- `--ease-out-soft`: gentle — used for bar chart growth

**Duration tokens**: `--d-fast: .18s`, `--d: .28s`, `--d-slow: .48s`, `--d-xslow: .9s`.

**Patterns:**
- **Cards lift on hover** — `translateY(-3px to -6px)` + tinted box-shadow + border tint toward primary. Apply consistently across KPI / service / why-feat / kanban cards.
- **Icons react** — every hovered card rotates and scales its icon (`rotate(-6° to -8°) scale(1.05–1.12)`).
- **Numbers count up** — KPI values and stat counters animate from 0 → target over ~1.1–1.4s on mount (cubic-out easing). Implementation: `useCountUp(target)` hook.
- **Stagger on entrance** — when a group of cards appears (KPI row, service grid), apply incremental `animation-delay` of 60–80ms each.
- **Buttons shimmer on hover** — a 50%-width diagonal highlight sweeps across the primary CTA in ~1s.
- **Gradient text** — orange accent word in marketing headlines uses a 200% background that shifts position over 6s for a subtle living-color effect.

**Honor `prefers-reduced-motion`** — the global CSS sets all durations to `.01ms` and iteration count to `1` when the user opts out.

### 3.10 Transparency & blur

Used **only**:
- Marketing hero background — decorative `blur-3xl` orbs at low opacity (`bg-primary/20`, `bg-blue-500/10`).
- ERP modal overlays — `rgba(0, 0, 0, 0.5)` flat scrim, no blur.
- Soft brand tints (`rgba(255,144,47,0.06–0.15)`) for hover backgrounds and pill fills.

No frosted glass / `backdrop-filter` in core surfaces.

### 3.11 Card anatomy

The canonical ERP card:

```
border:        1px solid #EBEAE6
border-radius: 10px
background:    #FFFFFF
shadow:        none by default (uses --sh-sm on focus/hover when relevant)
header:        14px 18px, border-bottom 1px solid border
body:          18px padding
title:         14px / 600
```

KPI cards add a 42px round icon (filled with a module color or brand orange) at the top-left, a 11px muted label, and a 20px / 700 value.

Stat pills use 12px rounded corners with a colored dot (`6px`, `currentColor`) on the left.

### 3.12 Layout rules

- **Fixed top bar**, height 56–60px, `bg-card`, 1px bottom border.
- **Sidebar** 260px expanded / 72px collapsed; sticks left, scrolls independently.
- **Content max-width** on marketing pages = `1280px` (`max-w-7xl`); ERP fills viewport.
- **Mobile breakpoint** = `lg: 1024px`. Below that the sidebar slides off-canvas; the public site collapses the nav into a hamburger drawer.

---

## 4. Iconography

EuroPrint has **no proprietary icon font**. The whole system standardises on **two libraries**:

| Library | Where used | Style |
|---|---|---|
| **Lucide React** (`lucide-react`) | ERP Dashboard React app + Public Site React app | 1.5–2px stroke, rounded line caps, 24px viewbox. Lightweight outline. |
| **Font Awesome 6 Free** (`fa-solid`) | Standalone HTML mockups + the public-site BootStrap mockup | Solid filled glyphs |

In production React code, **Lucide is canonical**. Font Awesome is only a stopgap for static HTML.

### Usage patterns
- **Sidebar nav items** — 15px Lucide icon, muted color by default, brand orange when active.
- **KPI card icons** — 18–24px white glyph on a 42–56px filled square or circle, background tinted with a module/status color.
- **Inline icons** in buttons/labels — 14–16px, currentColor.
- **Status indicators** — a 6px CSS dot (`::before { background: currentColor }`), not a glyph.
- **Brand logo mark** — `EP` monogram (white inside a 38px filled rounded square in the canonical brand orange).

### Unicode characters used as glyphs
- `★` — star rating (e.g. `4.9 ★`)
- `→ ←` — occasional arrow accents inside CTA labels
- `±` `%` `m²` — inline data formatting only

### Emoji
**Not used.** Avoid emoji in any EuroPrint surface.

### Assets in `assets/`
- `europrint-logo-full.png` — **official full lockup** (mark + wordmark, 2112×850, transparent)
- `europrint-mark.png` — mark only (cropped, 800×800, transparent) — use this for inline brand placement
- `icon-192.png` / `icon-512.png` — legacy PWA icons (orange rounded square — predates the real mark)
- `opengraph.jpg` — share-card preview

The mark is **two interlocking rounded-diamond outlines** in primary orange with a stylised **"S" flame** inside the overlap — a stylised representation of folded paper / interlocking print sheets. Use the **mark on its own** at small sizes; pair it with the **all-caps "EURO PRINT" wordmark** at 14px+ display sizes.

### Animated treatments
- **Float**: the mark gently floats vertically (`ep-float`, 5–6s) when placed in the sidebar / nav / hero.
- **Hover**: on hover the mark slightly rotates (-8°) and scales (1.05) over `0.4s ease-out-back`.
- **Never animate the wordmark** — only the mark.

---

## 5. File Index

| File | Purpose |
|---|---|
| `README.md` | This file. |
| `SKILL.md` | Agent-Skill-compatible entry point. |
| `colors_and_type.css` | CSS variables for colors, type, spacing, radius, shadow, motion. |
| `assets/` | Logo, favicon, PWA icons, OG image. |
| `preview/` | Small HTML preview cards (Colors, Type, Spacing, Components, Brand) rendered in the Design System tab. |
| `ui_kits/erp-dashboard/` | Interactive ERP dashboard recreation (sidebar + top bar + dashboard, HR list, Kanban). |
| `ui_kits/public-site/` | Marketing site recreation (hero, services, CTA, footer). |
| `_source/` | Original files copied verbatim from the codebase for reference. |

---

## 6. Open Questions & Known Gaps

- The public site uses **`Segoe UI`** while the ERP uses **`Inter`** — both shipped here, both documented. Confirm whether the public site should migrate to Inter for a unified brand.
- We pulled **Google-Fonts Inter** (matches the source).
- No photography or illustration system is defined in the codebase. If marketing requires hero imagery, that's outside this system's scope.
- The legacy PWA icons (`icon-192.png`, `icon-512.png`) are flat orange squares and should be regenerated from the real interlocking-diamond mark — flagged for the user.
