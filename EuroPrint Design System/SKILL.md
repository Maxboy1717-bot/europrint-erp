---
name: europrint-design
description: Use this skill to generate well-branded interfaces and assets for EuroPrint (Uzbekistan's №1 industrial printing company), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the ERP dashboard and the public-facing marketing site.
user-invocable: true
---

# EuroPrint Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

## Quick start

1. Load tokens: link `colors_and_type.css` from the skill root — gives you `--ep-primary`, `--ep-text`, `--ep-bg`, the spacing/radius/shadow scale, and semantic typography helpers (`.ep-h1`, `.ep-eyebrow`, `.ep-kpi-value`, …).
2. Pick a surface:
   - **Internal/admin/data-heavy** → use the "EP Linear Soft" system (`ui_kits/erp-dashboard/`). Light sidebar, warm off-white bg, Inter, 13px body, 10px card radius.
   - **Marketing/customer-facing** → use the public-site patterns (`ui_kits/public-site/`). Navy `#1a1a2e` hero, orange CTAs, big stats, rounded cards.
3. Copy logos/icons out of `assets/`. Never invent a new logo. Use Lucide icons (`https://unpkg.com/lucide@latest`) — never emoji.
4. Write copy in **Uzbek-first** (Russian as secondary), sentence case, direct verb-first CTAs (e.g. *"Bepul narx olish"*, *"Yangi xodim qoʻshish"*).

## What this skill covers

- **EuroPrint ERP Dashboard** — internal SaaS used by HR, production (MES), finance, sales (SD/CRM), warehouse (WMS), POS, QC, IoT. ~50+ modules.
- **EuroPrint public marketing site** (europrint.uz) — services, products, careers, blog, contact, quote request.

## What this skill does NOT cover

- Photography, illustration, mascots — none exist in the source system.
- Print-collateral (business cards, brochures) — out of scope.
- The legacy Express.js backend or the API layer (this is a design system, not a backend kit).

## If the user invokes the skill without other guidance

Ask them:
1. Which surface? (Internal ERP module / Marketing page / Email / Slide deck)
2. Which module if ERP? (HR, Production, Warehouse, Sales, Finance, …)
3. Uzbek or Russian copy? (Default Uzbek.)
4. Light or dark mode? (Default light.)
5. How many variations would they like?

Then act as an expert designer, outputting HTML artifacts or production code depending on the need.
