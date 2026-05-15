# EuroPrint ERP — Load Test Results

Drop the summary block from each k6 run into the matching section below.
Keep the most recent run first; archive older runs under "History".

---

## Latest run

**Date:**         _not yet executed in this session_
**Branch:**       `chore/clean-faza-3`
**Backend host:** `http://localhost:3000`
**k6 version:**   _not detected in this session (Bash/PowerShell unavailable)_

### Smoke test — `scripts/load-tests/smoke-test.js`

```
=== EuroPrint ERP — Smoke Test Summary ===
  iterations:          <fill in>
  http_reqs:           <fill in>
  http_reqs/sec:       <fill in>
  http_req_duration:
    avg:               <fill in> ms
    p(90):             <fill in> ms
    p(95):             <fill in> ms
    p(99):             <fill in> ms
    max:               <fill in> ms
  http_req_failed:     <fill in> %
```

Pass criteria: p95 < 500 ms AND http_req_failed < 1%.

### Load test (400 VUs) — `scripts/load-tests/load-test.js`

```
=== EuroPrint ERP — Load Test (400 VUs) Summary ===
  iterations:          <fill in>
  http_reqs:           <fill in>
  http_reqs/sec:       <fill in>
  http_req_duration:
    avg:               <fill in> ms
    p(90):             <fill in> ms
    p(95):             <fill in> ms
    p(99):             <fill in> ms
    max:               <fill in> ms
  http_req_failed:     <fill in> %
  login_duration_p95:  <fill in> ms
```

Per-endpoint p95 (extract from `http_req_duration{endpoint=...}`):

| Endpoint                | p95 (ms) | error % |
|-------------------------|----------|---------|
| hr.employees            |          |         |
| crm.leads               |          |         |
| wms.stockBalance        |          |         |
| finance.cashflow        |          |         |
| pp.orders               |          |         |
| auth.me                 |          |         |

Pass criteria: p95 < 2000 ms AND p99 < 5000 ms AND http_req_failed < 5%.

### Stress test (100→600 VUs) — `scripts/load-tests/stress-test.js`

```
=== EuroPrint ERP — Stress Test (100->600 VUs) Summary ===
  http_reqs:           <fill in>
  http_reqs/sec:       <fill in>
  http_req_duration:
    avg:               <fill in> ms
    p(95):             <fill in> ms
    p(99):             <fill in> ms
    max:               <fill in> ms
  http_req_failed:     <fill in> %
```

**Observed breaking point:** _VU count where p95 > 5 s or errors > 25%_
- Stage 100 VUs: p95 = ___ ms, errors = ___ %
- Stage 200 VUs: p95 = ___ ms, errors = ___ %
- Stage 400 VUs: p95 = ___ ms, errors = ___ %
- Stage 600 VUs: p95 = ___ ms, errors = ___ %

---

## Pre-launch checklist

Production deploy is BLOCKED until every box is checked:

- [ ] **Smoke test passes** locally and on staging
- [ ] **100-user load test passes** (p95 < 1000 ms, errors < 1%)
- [ ] **400-user load test passes** (p95 < 2000 ms, errors < 5%)
- [ ] **600-user stress test** identifies a clear breaking point;
      breaking point is at ≥ 500 VUs
- [ ] Memory stays flat during the 2-minute 400-VU hold (no monotonic growth)
- [ ] DB pool usage stays under 80% at peak
- [ ] No 5xx in the API logs other than the deliberate stress overflow
- [ ] Results archived in this file and linked from the release ticket

---

## Run notes — this session (2026-05-15)

The load-test scripts and this template were created in a sandboxed
session where the harness denied both `Bash` and `PowerShell` execution.
As a result:

- `k6 version` was NOT executed — installation status unknown on this host.
- `curl http://localhost:3000/api/auth/health` was NOT executed — backend
  reachability not verified from this session.
- The smoke test was NOT run; rows above stay as `<fill in>`.

To complete the verification, a developer with shell access should run:

```powershell
# Confirm k6 is installed
k6 version

# Confirm the backend is up
Invoke-WebRequest http://localhost:3000/api/auth/health | Select-Object StatusCode

# If both succeed, run the smoke test and paste the summary above
k6 run scripts/load-tests/smoke-test.js
```

---

## History

_(Move completed run sections here once a newer run is recorded.)_
