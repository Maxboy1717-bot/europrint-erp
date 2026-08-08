# EuroPrint ERP — Frontend (`artifacts/erp-dashboard/src`)

> Vite + React 18 + TypeScript SPA that talks to the NestJS backend in
> `apps/api/`. This is the onboarding map for frontend engineers.

## 1. Stack

| Layer          | Tech                                                                  |
|----------------|-----------------------------------------------------------------------|
| Build          | Vite 5, TypeScript 5 (strict)                                         |
| UI             | React 18, shadcn/ui (Radix primitives), Tailwind CSS                  |
| State          | TanStack Query v5 (server state), Zustand (UI state)                  |
| Routing        | **wouter** (intentionally small — not React Router)                   |
| Forms          | react-hook-form + Zod validation                                      |
| Charts         | recharts                                                              |
| i18n           | Custom hooks in `lib/i18n/` — UZ + RU, see §4                          |
| API client     | `lib/api-request.ts` (typed wrapper around `fetch`)                   |
| Tests          | Vitest + Testing Library (in `__tests__/` folders next to source)     |

## 2. Top-level layout

```
src/
├── main.tsx              Vite entry, QueryClientProvider, LanguageProvider
├── App.tsx               Top router shell with role-based routes
├── index.css             Tailwind layers + design tokens
├── shared-schema.ts      Zod types shared with backend (single source)
├── pages/                Route-level pages (lazy-loaded by App.tsx)
├── components/           Re-usable UI building blocks
├── components/ui/        shadcn/ui primitives (button, card, dialog, etc.)
├── components/ep/        EuroPrint design-system wrappers (EPPageHeader, EPKpiCard)
├── routes/               Route registry per role
├── hooks/                Custom hooks (useAuth, use-toast, useMobile)
├── lib/                  Cross-cutting helpers (see §3)
├── store/                Zustand slices
├── locales/uz|ru         JSON i18n bundles loaded by lib/i18n
├── pos-monitor/          POS terminal app — separate i18n, separate layout
├── camera-ai-modern/     Face-attendance + safety-violation camera dashboards
├── erp-modern-ui/        Mockup showcase (design exploration)
└── test/                 Vitest setup, MSW handlers, fixtures
```

## 3. Cross-cutting helpers (`lib/`)

### `lib/api-request.ts` + `lib/queryClient.ts`
**Every** outgoing HTTP call goes through `apiRequest(method, url, body?)`.
- Adds auth header, handles 401 (refresh), normalises errors.
- The reviewer (Rule 21) rejects raw `fetch()` / `axios()`.

### `lib/i18n/`
Custom i18n (we don't use react-i18next). Three things to know:
- `useTranslation('module')` returns `{ t, language, setLanguage }`.
- `t('key')` looks up `locales/{lang}/{module}.json[key]`.
- `loader.ts` imports every JSON namespace at build time — you must register
  new namespaces there AND in `constants.ts` (see TRANSLATION_MODULES).

### `lib/safe-array.ts`
`safeArray(x)` returns `x` if it's an array, else `[]`. Use before `.map/.filter`
when source is unknown (Rule 2 array-safety).

### `lib/permissions.ts` + `lib/roleRoutes.ts`
Maps roles → permission flags → which routes are reachable.

### `lib/format.ts`
Money / date / number formatters using `Intl.NumberFormat('uz-UZ')`. NEVER
inline `.toFixed(2)` for money — use these.

### `lib/sanitize.ts`
DOMPurify wrapper. Use before `dangerouslySetInnerHTML`.

### `lib/erp-offline-db.ts`
IndexedDB layer for POS-on-floor terminals that may go offline. Syncs back
when connection returns (hook: `hooks/useErpOfflineSync.ts`).

### `lib/auth-refresh.ts` + `lib/fetchInterceptor.ts`
Refresh-token rotation. Triggered automatically by `apiRequest` on 401.

### `lib/queryClient.ts`
Singleton TanStack Query client with shared defaults (5-min stale, 1 retry).

## 4. i18n model (UZ + RU)

We support **Uzbek (Latin) and Russian**. Defaults to UZ; choice persists in
`localStorage` under key `europrint_language`.

```ts
import { useTranslation } from '@/lib/i18n';

function MyComp() {
  const { t, language, setLanguage } = useTranslation('finance');
  return <h1>{t('cfo.title')}</h1>; // looks up locales/uz/finance.json
}
```

- Translation files live in `locales/{uz,ru}/{module}.json`. Keys are flat
  (dot-separated paths inside one JSON, not deeply nested objects).
- `pos-monitor/` has its OWN i18n at `pos-monitor/i18n/{uz,ru}.json` (separate
  app, separate provider).
- When adding a new namespace JSON, register it in `lib/i18n/constants.ts`
  AND `lib/i18n/loader.ts` (both UZ + RU imports + `ALL_TRANSLATIONS` entries).

Validation: `node scripts/audit-i18n.mjs` and `node scripts/i18n-full-audit.mjs`
report missing keys and parity drift.

## 5. Routing & roles (`routes/` + `roleRoutes.ts`)

Routes are split per role:
- `director` → CFO dashboard, AI audit, alerts
- `production_manager` → MES, OEE, schedule
- `hr` → employees, payroll, recruitment
- `accountant` → GL, AP/AR, period closing
- `warehouse` → WMS hub, ABC, stock ops
- `operator` → POS terminals (separate `/pos-monitor/*` tree)

`App.tsx` reads the user's permissions and renders the matching `roleRoutes`
entry. Lazy-loaded with `React.lazy` for code-splitting.

## 6. Pages folder (`pages/`)

Pages are big (300+ lines is normal) and often split into helper files:

| Suffix          | What it contains                                        |
|-----------------|---------------------------------------------------------|
| `*Types.ts`     | Interfaces + constants (no JSX)                         |
| `*Helpers.tsx`  | Small leaf components                                   |
| `*Sections.tsx` | Tab content / large sub-sections                        |
| `*Dialogs.tsx`  | Modal dialogs (self-contained state)                    |
| `*Tabs.tsx`     | Tabs container                                          |
| `*.tsx`         | Orchestration + state + queries (the "page" itself)     |

Rule 16 in the reviewer keeps any single file under 300 lines — split when
needed. Imports stay inside the page's folder.

## 7. UI design system (`components/ep/`)

shadcn/ui primitives live in `components/ui/` (button, dialog, table, etc.) —
DO NOT edit them; they regenerate.

Cross-page conventions live in `components/ep/`:
- `EPPageHeader` — breadcrumb + title + subtitle + status pill + actions
- `EPKpiCard` — KPI tile with icon, value, trend
- `EPEmptyState`, `EPErrorState`, `EPStatusPill`, `EPCard`
- Layout: 24px padding, `bg-surface-container-lowest` for nested cards,
  `text-on-surface` / `text-on-surface-variant` for hierarchy.

## 8. Data fetching pattern

Every page follows:

```tsx
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['/api/wms/catalog', filters],
  queryFn: () => apiRequest('GET', `/api/wms/catalog?${qs(filters)}`),
});

if (isLoading) return <Skeleton className="h-64" />;
if (isError)   return <EPErrorState onRetry={refetch} />;

const rows = Array.isArray(data?.data) ? data.data : [];
return <Table data={rows} />;
```

Mutations:

```tsx
const mutation = useMutation({
  mutationFn: (payload) => apiRequest('POST', '/api/wms/items', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/wms/catalog'] });
    toast({ title: t('common.savedSuccessfully') });
  },
  onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
});
```

Rule F1/F2 enforce loading state + onError.

## 9. Forms (Zod + react-hook-form)

```tsx
const schema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
});
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({ resolver: zodResolver(schema) });
```

Schemas live next to the form when small, or in `shared-schema.ts` if
backend-shared. Rule 3 + Rule 20 enforce Zod validation.

## 10. POS monitor sub-app (`pos-monitor/`)

A second SPA that runs inside the same Vite build for shop-floor terminals.
- Self-contained pages + components + own i18n
- Uses `lib/erp-offline-db.ts` (IndexedDB) for offline operation
- Routes mounted at `/pos-monitor/*`
- Read `pos-monitor/README.md` if it exists, else the layout file
  `pos-monitor/layout/PosLayout.tsx` is the entry point

## 11. Running locally

```bash
# From repo root
pnpm --filter erp-dashboard run dev   # Vite dev server on :5173
pnpm --filter erp-dashboard run build # Production build
pnpm --filter erp-dashboard run test  # Vitest
```

API base URL is read from `VITE_API_BASE_URL` (defaults to `http://localhost:3000`).

## 12. Common gotchas

- **TanStack Query v5** uses `gcTime` (was `cacheTime` in v4). New code only.
- **wouter is path-based, no nesting** — use `useLocation()` + manual matching for nested routes.
- **`apiRequest` returns the parsed JSON directly**, not the Response object. To check status you must throw inside the queryFn or rely on the wrapper's error handling.
- **i18n keys are case-sensitive AND dot-flat** — `t('user.email')` looks up the literal `"user.email"` key, not nested.
- **Locale JSON files are loaded statically** — adding a key requires NO redeploy in dev, but DOES in prod (Vite tree-shakes).
- **Public site uses a separate i18n** (`lib/public/i18n.tsx`) — different keys, do not cross-reference.
- **`safeStorage` over `localStorage`** — wraps Safari Private Mode failures.
