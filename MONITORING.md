# EuroPrint ERP — Monitoring & Alerting Guide

This document describes the metrics, logs, and alerts you should set up before
running EuroPrint ERP in production.

---

## 1. Application metrics — Prometheus

The API exposes Prometheus metrics on `GET /metrics` via `prom-client`.

### Available metrics (built-in)
- `http_request_duration_seconds_*` — request latency histogram
- `nodejs_*` — heap, GC, event loop lag, active handles
- `process_cpu_seconds_total`, `process_resident_memory_bytes`
- `nestjs_*` — module-level counters (custom)

### Scrape config

```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: europrint-api
    metrics_path: /metrics
    static_configs:
      - targets:
          - api.europrint.uz:3000
        labels:
          service: api
          env: production

  - job_name: postgres
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: redis
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: node-exporter
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/alerts/*.yml'
```

### Recommended alert rules

```yaml
# /etc/prometheus/alerts/europrint.yml
groups:
  - name: europrint-api
    interval: 30s
    rules:
      - alert: APIDown
        expr: up{job="europrint-api"} == 0
        for: 2m
        labels: { severity: critical }
        annotations:
          summary: 'API is unreachable for >2 minutes'

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels: { severity: high }
        annotations:
          summary: '>5% of requests returning 5xx for 5 minutes'

      - alert: HighRequestLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels: { severity: warning }
        annotations:
          summary: 'p95 latency >1s for 10 minutes'

      - alert: EventLoopLag
        expr: nodejs_eventloop_lag_seconds > 0.2
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: 'Node.js event loop lag >200ms — possible blocking operation'

      - alert: HeapUsageHigh
        expr: nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes > 0.9
        for: 10m
        labels: { severity: warning }
        annotations:
          summary: 'Heap usage >90% for 10 minutes — potential memory leak'

  - name: postgres
    rules:
      - alert: PostgresDown
        expr: up{job="postgres"} == 0
        for: 2m
        labels: { severity: critical }

      - alert: PostgresConnectionPoolNearLimit
        expr: pg_stat_database_numbackends{datname="europrint"} > 18
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: 'DB connection pool >90% (18/20) — possible leak or load spike'

      - alert: PostgresReplicationLag
        expr: pg_replication_lag_seconds > 30
        for: 5m
        labels: { severity: high }

  - name: business
    rules:
      - alert: FailedLoginsSpike
        expr: rate(login_attempts_failed_total[5m]) > 0.5
        for: 5m
        labels: { severity: high }
        annotations:
          summary: '>30 failed logins per minute — possible brute force'

      - alert: BackupFailed
        expr: time() - backup_last_success_timestamp_seconds > 90000
        labels: { severity: critical }
        annotations:
          summary: 'No successful DB backup in >25 hours'
```

---

## 2. Grafana dashboards

Recommended dashboards (import from grafana.com):

| ID | Name | Purpose |
|----|------|---------|
| 11159 | NestJS Application | API requests, latency, error rate |
| 1860 | Node Exporter Full | Host CPU, memory, disk, network |
| 9628 | PostgreSQL Database | Connections, locks, slow queries |
| 11835 | Redis Dashboard | Memory, keys, evictions |
| 14282 | nginx | Request rate, status codes, upstream latency |

### Custom dashboard — Business KPIs

Create a custom dashboard tracking:
- Active user sessions (count distinct user IDs in last 5 min)
- Orders created per hour
- Failed payment attempts per hour
- Inventory adjustments per hour
- Slow queries (>1s) per minute

---

## 3. Logging — Pino structured JSON

API emits Pino structured logs to stdout. In production, ship these to a
central aggregator:

### Option A — Loki (Grafana stack)

```yaml
# /etc/promtail/promtail.yml
clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: europrint-api
    static_configs:
      - targets: [localhost]
        labels:
          job: europrint-api
          __path__: /var/log/europrint/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            time: time
            msg: msg
            module: module
      - timestamp:
          source: time
          format: RFC3339Nano
      - labels:
          level:
          module:
```

### Option B — Elasticsearch + Kibana

Forward logs via Filebeat → Logstash → Elasticsearch. The JSON structure is
already parsed-friendly.

### Option C — Datadog / New Relic / Sentry

Drop in the relevant SDK as a NestJS module. For Sentry:
```bash
pnpm --filter @europrint/api add @sentry/nestjs
```

Initialise in `main.ts`:
```typescript
import * as Sentry from '@sentry/nestjs';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## 4. Uptime monitoring

Set up an external uptime probe (cannot self-monitor!):

### Free options
- **UptimeRobot** — 5-min interval, free for 50 monitors
- **Better Uptime** — 30s interval, free tier
- **StatusCake** — 5-min interval, free tier

### Probe target
```
URL:    https://erp.europrint.uz/api/health
Method: GET
Expected status: 200
Expected body contains: "ok"
Timeout: 10s
```

### Recommended schedule
- **Health endpoint:** every 1-5 minutes
- **Login endpoint** (synthetic test): hourly
- **DB write smoke test:** daily (creates + deletes a test row)

---

## 5. Application-level metrics to add

These are **NOT yet emitted**. Add them with `prom-client` registration:

```typescript
// apps/api/src/common/metrics/business.metrics.ts
import { register, Counter, Histogram } from 'prom-client';

export const ordersCreatedTotal = new Counter({
  name: 'orders_created_total',
  help: 'Total orders created',
  labelNames: ['source', 'status'],
});

export const paymentProcessingDuration = new Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Time to process a payment end-to-end',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

export const loginAttemptsTotal = new Counter({
  name: 'login_attempts_total',
  help: 'Login attempts',
  labelNames: ['result'],   // success | failure
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'DB query latency',
  labelNames: ['module', 'operation'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
});
```

Then increment in the relevant handlers:
```typescript
ordersCreatedTotal.inc({ source: 'web', status: 'pending' });
```

---

## 6. Incident response runbook (skeleton)

For each alert, document:

### "API Down" alert
1. Check Grafana dashboard for last failure timestamp
2. SSH to host: `ssh ops@erp.europrint.uz`
3. Check PM2: `pm2 list` → expect `online`
4. If `errored`: `pm2 logs europrint-api --lines 200`
5. If `online` but health-check failing: check DB connectivity
   `psql $DATABASE_URL -c 'SELECT 1'`
6. If DB ok: check Redis `redis-cli ping`
7. If both ok: check disk `df -h` (logs may have filled disk)
8. If all green: restart `pm2 restart europrint-api`
9. If still failing: rollback (see `DEPLOYMENT.md` §7)

### "DB Connection Pool Near Limit" alert
1. Check active queries: `SELECT * FROM pg_stat_activity WHERE state != 'idle'`
2. Identify long-running query → cancel if safe: `SELECT pg_cancel_backend(pid)`
3. Check for connection leak in app logs
4. Temporary mitigation: bump `DB_POOL_MAX` to 30 and restart

### "Failed Logins Spike" alert
1. Check IPs: query app log for `loginAttemptsTotal{result="failure"}` by IP
2. Identify top offenders → block at Nginx or Cloudflare
3. Notify security@europrint.uz

---

## 7. SLO targets (suggested)

| SLO | Target | Window |
|-----|--------|--------|
| Availability | 99.5% | 30 days |
| API p95 latency | <500ms | 7 days |
| API p99 latency | <2s | 7 days |
| Failed request rate | <1% | 1 day |
| Login success rate | >98% (excl. brute force) | 1 day |
| Backup success | 100% | weekly |

Track these in Grafana with a recording rule:
```yaml
- record: slo:europrint:availability:30d
  expr: avg_over_time(up{job="europrint-api"}[30d])
```

---

## 8. Production checklist before launch

- [ ] Prometheus scraping `/metrics` successfully
- [ ] Grafana dashboards imported and showing data
- [ ] Alertmanager configured with on-call rotation
- [ ] Uptime probe (UptimeRobot or similar) set up
- [ ] Log aggregator (Loki/ELK/Datadog) receiving API logs
- [ ] Backup cron verified — at least one successful daily backup
- [ ] Incident response runbook reviewed with team
- [ ] On-call rotation scheduled
- [ ] Status page (statuspage.io / Atlassian) for customers

---

*Document version: 1.0 | Pair with `DEPLOYMENT.md` and `SECURITY.md`*
