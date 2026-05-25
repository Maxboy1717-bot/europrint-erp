# EuroPrint Public Site — UI Kit

Marketing site home-page recreation (europrint.uz). Built from the React source at
`artifacts/europrint-site/src/pages/Home.tsx` and the navbar/footer in
`artifacts/europrint-site/src/components/layout/`.

## Sections (top to bottom)

1. **Utility bar** — navy strip with phone, email, working hours.
2. **Navbar** — sticky white nav, logo + 8 links + orange "Narx soʻrash" CTA.
3. **Hero** — `#1a1a2e` navy background with two decorative blur orbs, eyebrow with pulsing dot, big H1 with orange accent line, lead copy, two CTAs, 2×2 stats grid in glass cards.
4. **Services** — 3×2 grid of cards (6 services). Each card has a colored soft-tint icon tile matching a module hue (orange, blue, green, purple, red, amber).
5. **Why Us** — 2-column: features grid on the left + 28px-rounded factory card on the right.
6. **Trust bar** — navy strip with 4 stat blocks.
7. **CTA block** — full orange gradient card with white CTAs.
8. **Footer** — navy, 4-column with brand block, product links, company links, contact info, social icons.

## Files

| File | Purpose |
|---|---|
| `index.html` | Mounts `<App/>` with sections stacked vertically. |
| `kit.css` | All section + component styles. Reads tokens from `../../colors_and_type.css`. |
| `Sections.jsx` | `UtilityBar`, `Navbar`, `Hero`, `Services`, `WhyUs`, `TrustBar`, `CtaSection`, `Footer` + inline `SiteIcon` (Lucide-style stroke icons). |

## Visual decisions lifted from the source

- All copy is taken from the live Uzbek strings in `Home.tsx`.
- Hero background is exact navy `#1a1a2e` (not the dashboard's warm bg). Orange and blue blur orbs at low opacity.
- "EuroPrint" wordmark uses the navy `#1a1a2e` color (full word), with the printer-icon mark in primary orange.
- Eyebrow pill = `bg-primary/15 + border-primary/25 + animated pulsing dot`.
- Service cards lift 3px on hover and tint their title toward primary — the exact Tailwind classes in the source.
- Factory card uses a `28px` border-radius, much rounder than dashboard cards — deliberate marketing styling.
- CTA block uses the `linear-gradient(135deg, primary → orange-500 → amber)` from `Home.tsx`.
- Footer hover state: social icons turn orange on hover (not white).
