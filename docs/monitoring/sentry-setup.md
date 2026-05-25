# Sentry Setup — EuroPrint ERP

This document describes how to wire Sentry into the EuroPrint ERP stack
(NestJS + Fastify backend, React + Vite frontend).

The integration uses a **graceful-degradation** contract: every Sentry env var
is optional. If `SENTRY_DSN` is empty, the app still boots and only emits a
single `warn` log. This matches the pattern used by `AishaConfig`.

---

## 1. Create Sentry projects

Sign up at https://sentry.io (free tier: 5k events / month is enough for staging).

Create **two projects** under the `europrint` organisation:

| Project | Platform | Slug (suggested) |
|---------|----------|------------------|
| Backend | Node.js (NestJS) | `europrint-api` |
| Frontend | React | `erp-dashboard` |

Each project gives you a unique DSN under
**Settings > Projects > [project] > Client Keys (DSN)**.

---

## 2. Copy DSNs into your environment files

### Backend — `apps/api/.env` (or `/etc/europrint.env` in production)

```dotenv
SENTRY_DSN=https://xxxxxxxxxxxxxxxx@o000000.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=production          # or staging / development
SENTRY_RELEASE=2.0.0                   # match apps/api/package.json version
```

### Frontend — `.env.production` (Vite reads `VITE_*` at build time)

```dotenv
VITE_SENTRY_DSN=https://yyyyyyyyyyyyyyyy@o000000.ingest.sentry.io/7654321
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=2.0.0
```

### Frontend source-map upload — also at build time

`@sentry/vite-plugin` uploads minified source-maps so the Sentry UI can show
unminified stack traces. Generate a token at
**sentry.io > Settings > Account > API > Auth Tokens** with scope
`project:releases` and put it in CI (never commit it):

```dotenv
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxx
SENTRY_ORG=europrint
SENTRY_PROJECT=erp-dashboard
SENTRY_RELEASE=2.0.0
```

If `SENTRY_AUTH_TOKEN` is empty, the Vite plugin is skipped entirely — local
builds work without Sentry credentials.

---

## 3. Verify the integration locally

### Backend

```bash
pnpm --filter @europrint/api run dev:unsafe
```

Look for the startup log:

```
[SentryInit] Sentry initialised (env=development, tracesSampleRate=1.0)
```

Trigger a test error from a controller (or `curl` an endpoint that throws) and
confirm the issue appears in **Sentry > Issues** within ~30 s.

### Frontend

```bash
pnpm --filter @workspace/erp-dashboard run dev
```

In the browser console, run:

```js
throw new Error('Sentry smoke test');
```

It should appear in the Sentry dashboard under the `erp-dashboard` project.

---

## 4. Alert rules

Configure alerts under **Sentry > Alerts > Create Alert**.

### Error-rate alert (recommended)

| Field | Value |
|-------|-------|
| Type | **Number of errors** |
| Condition | An event is seen |
| Filter | `event.type:error` |
| Threshold | More than **1%** of sessions in **5 minutes** |
| Action | Send to Slack `#europrint-alerts` AND Telegram `TG_DIRECTOR_CHAT_ID` |

### Performance alert (p95 latency)

| Field | Value |
|-------|-------|
| Type | **Performance > Transaction Duration** |
| Aggregate | `p95(transaction.duration)` |
| Threshold | Above **2000 ms** for 5 minutes |
| Action | Slack `#europrint-perf` |

### High-severity issue alert

| Field | Value |
|-------|-------|
| Trigger | New issue created **AND** `level:fatal` |
| Action | PagerDuty / phone call |

---

## 5. Release tracking

Sentry groups errors by release so you can tell whether a spike came from a
deploy. The release identifier comes from `SENTRY_RELEASE` and **must match
between backend, frontend, and source-map upload**.

### CI/CD example (GitHub Actions)

```yaml
- name: Set Sentry release
  run: echo "SENTRY_RELEASE=${GITHUB_SHA::12}" >> $GITHUB_ENV

- name: Build frontend (uploads source-maps)
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: europrint
    SENTRY_PROJECT: erp-dashboard
    SENTRY_RELEASE: ${{ env.SENTRY_RELEASE }}
    VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
    VITE_SENTRY_RELEASE: ${{ env.SENTRY_RELEASE }}
  run: pnpm --filter @workspace/erp-dashboard run build

- name: Build backend
  env:
    SENTRY_RELEASE: ${{ env.SENTRY_RELEASE }}
  run: pnpm --filter @europrint/api run build
```

Mark each deploy in Sentry via the CLI (optional but recommended):

```bash
npx @sentry/cli releases new "$SENTRY_RELEASE"
npx @sentry/cli releases finalize "$SENTRY_RELEASE"
npx @sentry/cli releases deploys "$SENTRY_RELEASE" new --env production
```

---

## 6. Where it's wired in the code

| File | Purpose |
|------|---------|
| `apps/api/src/common/monitoring/sentry.config.ts` | `initSentry()` + `SentryInterceptor` |
| `apps/api/src/main.ts` | Calls `initSentry()` before `NestFactory.create()` and registers the interceptor globally |
| `artifacts/erp-dashboard/src/main.tsx` | `Sentry.init()` + `<Sentry.ErrorBoundary>` |
| `artifacts/erp-dashboard/vite.config.ts` | `@sentry/vite-plugin` (conditional on `SENTRY_AUTH_TOKEN`) |

### Filters

Both backend and frontend drop HTTP **401 / 403 / 404** in `beforeSend` so
auth failures and missing-resource requests do not consume your Sentry quota.

Adjust the list in:
- Backend: `IGNORED_HTTP_STATUSES` in `sentry.config.ts`
- Frontend: `beforeSend` in `main.tsx`

### Sample rates

| SDK | tracesSampleRate | replaysSessionSampleRate | replaysOnErrorSampleRate |
|-----|------------------|--------------------------|--------------------------|
| Backend (`production`) | 0.1 | — | — |
| Backend (`development`) | 1.0 | — | — |
| Frontend (`production`) | 0.1 | 0.1 | 1.0 |
| Frontend (`development`) | 1.0 | 0.1 | 1.0 |

---

## 7. Privacy

- `sendDefaultPii: false` on both SDKs — IP and user agent are NOT sent.
- Session Replay uses `maskAllText: true` + `blockAllMedia: true` — form
  fields and uploaded images never leak to Sentry.
- The interceptor sets `user.id` from the JWT subject only (no email / name).

If you handle EU traffic, configure your Sentry org to use the EU data center
under **Settings > General > Data Storage Location**.

---

## 8. Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `SENTRY_DSN not set` warning at startup | `.env` not loaded, or DSN env empty |
| Source-maps not symbolicating | `SENTRY_AUTH_TOKEN` missing in CI build env, or `SENTRY_RELEASE` mismatch between SDK init and upload |
| Too many 404 events | Add the route to `IGNORED_HTTP_STATUSES` |
| Sentry hits quota | Lower `tracesSampleRate` to 0.05 or 0.01 |

---

_Last updated: 2026-05-15_
