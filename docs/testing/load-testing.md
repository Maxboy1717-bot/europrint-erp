# EuroPrint ERP — Load Testing Guide (k6, 400 users)

This document describes how to run the k6 load tests for EuroPrint ERP, how
to interpret the results, what thresholds to expect, and what to do when a
run fails.

Scripts live at `scripts/load-tests/`:

| Script             | Profile                                       | Use when                          |
|--------------------|-----------------------------------------------|-----------------------------------|
| `smoke-test.js`    | 5 VUs, 1 min, `/api/auth/health` only         | Verify the API is alive           |
| `load-test.js`     | 0→100→400→400→0 over ~10 min, 6 real endpoints| Validate 400-user production load |
| `stress-test.js`   | 100→200→400→600→0 over ~10 min                | Find the breaking point           |

---

## 1. Install k6 on Windows

Use one of:

```powershell
# winget (Windows 11 / 10 1709+)
winget install k6 --silent

# Chocolatey
choco install k6 -y

# Manual: download from https://github.com/grafana/k6/releases
#   pick k6-vX.Y.Z-windows-amd64.zip, extract, add to PATH.
```

Verify:

```powershell
k6 version
# expected: k6 v0.x.x (commit ..., go1.x.x, windows/amd64)
```

On macOS / Linux:

```bash
brew install k6                           # macOS
sudo gpg -k && sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6   # Debian/Ubuntu
```

---

## 2. Prepare the backend

The API must be running and reachable at the URL you pass via `BASE_URL`
(defaults to `http://localhost:3000`). Start it with:

```powershell
pnpm --filter @europrint/api run dev:unsafe
```

Confirm it's healthy:

```powershell
# Public health route (no auth)
Invoke-WebRequest http://localhost:3000/api/auth/health | Select-Object StatusCode
# expected: 200
```

Make sure the admin seed has run with a known password:

```powershell
$env:ADMIN_SEED_PASSWORD = 'EuroPrint2024!'
pnpm --filter @europrint/api run seed
```

---

## 3. Run each test

All commands assume the project root (`Uzbek-Language-Module/`) is the
working directory.

### Smoke test (~1 min)

```powershell
k6 run scripts/load-tests/smoke-test.js
```

Override base URL if the API runs elsewhere:

```powershell
k6 run -e BASE_URL=http://localhost:3000 scripts/load-tests/smoke-test.js
```

### Load test — 400 users (~10 min)

```powershell
k6 run `
  -e BASE_URL=http://localhost:3000 `
  -e ADMIN_USER=admin `
  -e ADMIN_PASS='EuroPrint2024!' `
  scripts/load-tests/load-test.js
```

To export a machine-readable summary:

```powershell
k6 run --summary-export=summary.json scripts/load-tests/load-test.js
```

### Stress test — up to 600 users (~10 min)

```powershell
k6 run scripts/load-tests/stress-test.js
```

Watch the live output for the stage where p95 jumps or error rate spikes —
that VU count is the practical ceiling.

---

## 4. How to read the results

Each summary block reports:

| Metric              | What it means                                                                  |
|---------------------|--------------------------------------------------------------------------------|
| `http_reqs`         | Total HTTP requests sent                                                       |
| `http_reqs/sec`     | Average requests per second (RPS) over the run                                 |
| `http_req_duration` | End-to-end latency (TCP + TLS + write + wait + read). Use `p(95)` and `p(99)`. |
| `http_req_failed`   | Share of requests that ended with a non-2xx, timeout, or transport error       |
| `iterations`        | Full VU iterations (one think-cycle each)                                      |
| `login_duration`    | (load-test only) How long the one-time setup login took                        |

Other useful metrics in the raw output:

- `vus` / `vus_max` — current and peak virtual-user count
- `http_req_connecting`, `http_req_tls_handshaking` — network setup time
- `http_req_waiting` — server-side processing time (TTFB)
- `http_req_receiving` — body-download time

### Thresholds (defined in each script)

| Script         | p(95)     | p(99)     | error rate |
|----------------|-----------|-----------|------------|
| smoke-test     | < 500 ms  | —         | < 1%       |
| load-test      | < 2000 ms | < 5000 ms | < 5%       |
| stress-test    | < 5000 ms | —         | < 25%      |

If a threshold is breached, k6 exits with status `99`. Combine with
`--fail-on-threshold` in CI.

---

## 5. Acceptable values for 400 production users

The load test passes when, during the 2-minute steady-state at 400 VUs:

| Indicator                | Pass        | Watch        | Fail            |
|--------------------------|-------------|--------------|-----------------|
| p95 latency              | < 1500 ms   | 1500–2000 ms | > 2000 ms       |
| p99 latency              | < 3500 ms   | 3500–5000 ms | > 5000 ms       |
| Error rate               | < 1%        | 1–5%         | > 5%            |
| Backend CPU              | < 70%       | 70–90%       | > 90% sustained |
| Backend memory growth    | flat        | slow climb   | sawtooth / OOM  |
| DB connection saturation | < 50% pool  | 50–80%       | > 80%           |
| Event loop lag (p95)     | < 50 ms     | 50–200 ms    | > 200 ms        |

These targets assume one API node sized to ~4 vCPU / 8 GB RAM with a
Postgres pool of 50.

---

## 6. What to do when a test fails

### Symptom: high p95, low error rate → slow endpoints

1. Identify the offender: look at `http_req_duration` filtered by
   `endpoint=*` tag in the k6 output or InfluxDB dashboard.
2. Profile the route locally:
   ```powershell
   # Enable Nest's verbose logger or run with --inspect.
   pnpm --filter @europrint/api run start:debug
   ```
3. Add a Redis cache layer for hot read endpoints (the `apps/api` module
   already wires `CacheModule`).
4. Add a DB index — most slow reads here are missing composite indices on
   `(tenant_id, status)` or `(created_at, status)`.

### Symptom: error rate climbs, log shows `connection pool exhausted`

1. Bump the Drizzle/PG pool in `.env`:
   ```bash
   DB_POOL_MAX=100      # was 50
   DB_POOL_IDLE=30000
   ```
2. If errors continue, check `pg_stat_activity` for hung queries.
3. Confirm you don't hold a transaction across an HTTP boundary (search for
   `db.transaction` callbacks that `await` external IO inside).

### Symptom: memory grows monotonically (heap leak)

1. Snapshot the heap mid-run:
   ```powershell
   pnpm --filter @europrint/api run start:debug
   # in Chrome devtools: chrome://inspect → Take heap snapshot
   ```
2. Look for retained closures in WebSocket gateways or BullMQ consumers.
3. Restart the node and rerun — if growth disappears, the leak is in a
   long-lived cache (Map / Set never pruned).

### Symptom: backend stays healthy but k6 reports many timeouts

1. Check the OS file-descriptor limit on the host. With 400 VUs you can
   exhaust ports if `KeepAlive` is off:
   ```powershell
   # Windows:
   netsh int ipv4 show dynamicport tcp
   ```
2. Make sure `noConnectionReuse` is `false` in the script (it already is).

### Symptom: 401 / 403 on every request after setup

1. The cookie wasn't propagated. Make sure `@fastify/cookie` is registered
   in `apps/api/src/main.ts` (look for the "cookie plugin not loaded"
   warning in the API logs).
2. As a fallback, the script tries the Bearer header — verify the response
   body of `/api/auth/login` still contains `accessToken`.

---

## 7. Pre-launch production load-test plan

Run on the staging environment (with production-sized DB) before any
release that touches API code:

1. **Smoke test** — confirms the staging deploy is alive.
2. **Load test — 100 VUs** — run `load-test.js` with the stages mid-array
   commented to cap at 100 VUs. Sanity check.
3. **Load test — 400 VUs** — full script. **Must pass thresholds.**
4. **Stress test — up to 600 VUs** — note the breaking point and
   compare against the previous release.

Record the run summary in `docs/testing/load-test-results.md` and link it
from the release ticket.

Production launch blocked if:

- Steady-state error rate > 1% at 400 VUs.
- p95 > 2 s at 400 VUs.
- Memory grows by more than 10% during the 2-minute hold.

---

## Appendix — Endpoint rotation

The load and stress scripts rotate randomly across these endpoints:

| Endpoint                                          | Controller                                    |
|---------------------------------------------------|-----------------------------------------------|
| `GET /api/hr/employees?limit=20`                  | `hr-employees.controller.ts`                  |
| `GET /api/crm/leads?limit=20`                     | `crm-leads.controller.ts`                     |
| `GET /api/warehouse/reports/stock-balance?...`    | `wms-catalog.controller.ts`                   |
| `GET /api/cashflow/transactions?period=month`     | `cashflow.controller.ts`                      |
| `GET /api/pp/orders?status=active`                | `pp-orders.controller.ts`                     |
| `GET /api/auth/me`                                | `auth.controller.ts`                          |

> Brief originally specified `/api/wms/stock-balance` and
> `/api/finance/cashflow` — those controllers do not exist; the URLs above
> are the real endpoints discovered by grepping the controllers folder.
