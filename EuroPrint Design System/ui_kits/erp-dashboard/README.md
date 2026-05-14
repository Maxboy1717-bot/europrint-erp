# EuroPrint ERP Dashboard — UI Kit

Interactive recreation of the EuroPrint ERP internal admin shell ("EP Linear Soft" design direction).

## Run it

Open `index.html` in a browser. The sidebar nav lets you switch between three implemented pages:

1. **Bosh sahifa (Dashboard)** — KPI cards, OEE gauge, 9-month revenue chart, recent orders table, activity feed.
2. **Xodimlar (HR Employees)** — Stats strip, tabs (Hammasi / Faol / Taʼtilda / Notaʼfaol), employee table with avatars, attendance bars, status pills, pagination.
3. **Buyurtmalar Kanban (Orders Kanban)** — 4-column board (Yangi / Bajarilmoqda / Tasdiq / Tugallandi) with colored module tags and avatar groups.

All other nav items fall back to the dashboard — they're stubs to show the full IA.

## Files

| File | Purpose |
|---|---|
| `index.html` | Entry, mounts `<App/>` and routes between pages. |
| `kit.css` | Shell + card + table + kanban styles. Reads tokens from `../../colors_and_type.css`. |
| `AppShell.jsx` | `Sidebar` + `Topbar` + inline `Icon` component (Lucide-style stroke set). |
| `DashboardPage.jsx` | Dashboard content. |
| `Pages.jsx` | `HRPage` + `KanbanPage`. |

## Visual decisions lifted from the source

- **Sidebar**: white background, 240px wide, `3px` left-border on the active item with `6%` brand-tint fill — direct from `europrint-mockup-theme.css`.
- **Topbar**: 60px high, white, `1px` border-bottom, search box on the left, circular icon buttons on the right.
- **Cards**: `1px solid #EBEAE6`, `10px` radius, `14/18px` header, `18px` body.
- **Tables**: uppercase 10.5px headers on `#F6F5F2`, 13px body rows, hover tint `#FBFAF8`.
- **KPI cards**: 42px round colored icon, 11px muted label, 22px / 700 value, optional ↑/↓ delta and primary-orange link.
- **Status pills**: 11px / 500 with a leading 6px dot in `currentColor`.
- **Kanban**: muted `#F6F5F2` column background, white card with module-color tag, avatar overlap group.

All copy is in Uzbek and uses the same vocabulary patterns documented in the system README (sentence case, verb-first CTAs).
