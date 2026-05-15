# EuroPrint ERP — PostgreSQL Backup & Restore

This document describes the backup and restore procedure for the EuroPrint ERP
production PostgreSQL 15 database. Scripts live in `scripts/` and are designed
for Linux (production) and bash-on-Windows (dev).

---

## 1. Setup

### Required environment variables

| Var                       | Purpose                                          | Example                                                            |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `DATABASE_URL`            | Postgres connection string (required)            | `postgresql://europrint:STRONG_PASS@127.0.0.1:5432/europrint`     |
| `BACKUP_DIR`              | Directory to store `.sql.gz` files               | `/var/backups/europrint` (default: `./backups`)                    |
| `BACKUP_RETENTION_DAYS`   | How many days to keep local backups              | `30` (default: `7`)                                                |

### Prerequisites

- PostgreSQL client tools (`pg_dump`, `psql`) must be on `PATH`.
  - Debian/Ubuntu: `sudo apt-get install -y postgresql-client-15`
  - Alpine: `apk add --no-cache postgresql15-client`
  - Windows dev: install via [PostgreSQL.org installer](https://www.postgresql.org/download/windows/) — keep "Command Line Tools" checked, then add `C:\Program Files\PostgreSQL\15\bin` to PATH.
- `gzip` and standard GNU utilities (`find`, `du`).

### Make scripts executable

```bash
chmod +x scripts/backup.sh scripts/restore.sh scripts/verify-backup.sh
```

---

## 2. Manual Backup

```bash
export DATABASE_URL="postgresql://europrint:STRONG_PASS@127.0.0.1:5432/europrint"
export BACKUP_DIR="/var/backups/europrint"
export BACKUP_RETENTION_DAYS=30

bash scripts/backup.sh
```

Output:

```
[backup] 2026-05-15T02:00:00+05:00 starting -> /var/backups/europrint/europrint_20260515_020000.sql.gz
[backup] size: 247M
[backup] OK, retention 30 days
```

`pg_dump` flags used:

- `--no-owner` / `--no-acl` — strip ownership; portable across roles.
- `--clean --if-exists` — restore-side script drops objects before re-creating
  them, so a restore overwrites cleanly.
- Piped through `gzip -9` for maximum compression.

---

## 3. Restore

```bash
export DATABASE_URL="postgresql://europrint:STRONG_PASS@127.0.0.1:5432/europrint"
bash scripts/restore.sh /var/backups/europrint/europrint_20260515_020000.sql.gz
```

The script will print the target connection string and prompt:

```
Type 'RESTORE' to confirm:
```

You must type the literal word `RESTORE` (uppercase) — anything else aborts.
This is a deliberate safety net against accidental production overwrites.

---

## 4. Verification

After every backup (especially in CI/CD), validate integrity:

```bash
bash scripts/verify-backup.sh /var/backups/europrint/europrint_20260515_020000.sql.gz
```

Checks performed:

1. **Gzip integrity** — `gunzip -t` to detect corruption.
2. **CREATE TABLE count** — warns if fewer than 50 tables (EuroPrint has ~80+).
3. **COPY count** — counts data sections.
4. **Smoke-test core tables** — `users`, `orders`, `employees`, `customers`,
   `products` must exist.

Exit codes:

- `0` — backup OK
- `1` — file missing or gzip corrupted (CRITICAL)
- non-zero stderr messages — warnings (worth investigating)

---

## 5. Automation

See `scripts/backup-cron.txt` for full cron and systemd timer configurations.

Quick crontab entry (runs daily at 02:00 server local time):

```cron
0 2 * * * DATABASE_URL="postgresql://..." /opt/europrint/scripts/backup.sh >> /var/log/europrint/backup.log 2>&1
```

---

## 6. Recovery Objectives

| Metric                              | Target          | How we achieve it                                |
| ----------------------------------- | --------------- | ------------------------------------------------ |
| **RTO** (Recovery Time Objective)   | **< 30 min**    | Single `psql` restore from local `.sql.gz`       |
| **RPO** (Recovery Point Objective)  | **≤ 24 h** | Nightly full dump at 02:00 + off-site copy       |
| **Backup retention (local)**        | 30 days         | `BACKUP_RETENTION_DAYS=30`                       |
| **Backup retention (off-site)**     | 90 days         | rclone lifecycle policy on B2/S3                 |
| **Verification frequency**          | Daily           | `verify-backup.sh` runs from systemd `ExecStartPost=` |

To improve RPO below 24 h, set up streaming replication or WAL archival
(`archive_mode = on`, `archive_command = 'rclone ...'`). See PostgreSQL docs.

---

## 7. Disaster Recovery Checklist

If production is down and you need to restore from backup, follow these steps
in order. Do not skip steps.

1. **Stop the application.** Halt the NestJS API to prevent partial writes:
   ```bash
   sudo systemctl stop europrint-api
   ```
2. **Notify stakeholders.** Post in `#ops` channel and create an incident ticket.
   State expected downtime (RTO is 30 min).
3. **Identify the latest known-good backup.** Inspect `/var/backups/europrint/`
   and pick the most recent file that passed `verify-backup.sh` (check
   `/var/log/europrint/verify.log`). Skip any with WARN/FAIL.
4. **Pull from off-site if local is gone.** If the server's filesystem is the
   incident, pull from B2/S3:
   ```bash
   rclone copy b2:europrint-backups/europrint_20260515_020000.sql.gz /tmp/
   ```
5. **Verify the chosen backup AGAIN before restoring.**
   ```bash
   bash scripts/verify-backup.sh /tmp/europrint_20260515_020000.sql.gz
   ```
6. **Create a "before-restore" snapshot of the current DB** (if reachable) —
   even a broken DB has forensic value:
   ```bash
   pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > /tmp/pre-restore-$(date +%s).sql.gz
   ```
7. **Restore.** Run the restore script, type `RESTORE` at the prompt:
   ```bash
   bash scripts/restore.sh /tmp/europrint_20260515_020000.sql.gz
   ```
8. **Sanity-check the restored DB.** Connect with `psql` and run:
   ```sql
   SELECT count(*) FROM users;
   SELECT count(*) FROM orders;
   SELECT max(created_at) FROM orders;
   ```
   The max timestamp tells you how much data was lost (the RPO gap).
9. **Restart the application** and watch logs for migration errors:
   ```bash
   sudo systemctl start europrint-api
   journalctl -u europrint-api -f
   ```
10. **Post-mortem.** Within 48 hours, write up: root cause, timeline, data
    loss, action items. File in `docs/post-mortems/YYYY-MM-DD-incident.md`.

---

## 8. Off-Site Backup Strategy

**Why:** local disk failure, ransomware, datacenter fire, accidental
`rm -rf /var/backups` — none of these are handled by local backups alone.

**Approach:** push every nightly backup to two independent providers.

### Recommended providers

| Provider       | Why                                          | Approx. cost / 100 GB / month |
| -------------- | -------------------------------------------- | ----------------------------- |
| Backblaze B2   | Cheapest egress, S3-compatible API           | ~$0.50                        |
| AWS S3         | Industry standard, IAM roles, lifecycle      | ~$2.30 (Standard-IA)          |
| Wasabi         | No egress fees, simple pricing               | ~$0.60                        |

### Setup with rclone (recommended)

```bash
# 1. Install rclone
curl https://rclone.org/install.sh | sudo bash

# 2. Configure remote (interactive, one-time)
rclone config
#   - name: b2
#   - storage: Backblaze B2
#   - account: <application key id>
#   - key: <application key>

# 3. Test
rclone lsd b2:

# 4. Add post-backup hook (see scripts/backup-cron.txt)
rclone copy /var/backups/europrint b2:europrint-backups/ \
    --include "europrint_*.sql.gz" \
    --transfers 2 \
    --log-file=/var/log/europrint/rclone.log
```

### Bucket lifecycle policy

Set the off-site bucket to delete files older than 90 days. In B2:

```json
{
  "lifecycleRules": [
    {
      "daysFromHidingToDeleting": 90,
      "daysFromUploadingToHiding": null,
      "fileNamePrefix": "europrint_"
    }
  ]
}
```

### Encryption at rest

Backups contain customer data and credentials. Encrypt before upload:

```bash
gpg --symmetric --cipher-algo AES256 --passphrase-file /etc/europrint/gpg.key \
    /var/backups/europrint/europrint_20260515_020000.sql.gz
rclone copy /var/backups/europrint/europrint_20260515_020000.sql.gz.gpg b2:europrint-backups/
```

Keep the GPG passphrase in your password manager AND in a sealed envelope in
a physical safe. Without it, the off-site backups are useless.

---

## 9. Testing

**Quarterly disaster recovery drill:**

1. Spin up a fresh PostgreSQL instance (staging or local Docker).
2. Pull the latest off-site backup.
3. Run the restore.
4. Run the application's smoke-test suite against it.
5. Time each step. If the total exceeds 30 min, investigate.

Track results in `docs/post-mortems/dr-drill-YYYY-Q.md`.

---

## 10. Troubleshooting

| Symptom                                     | Cause                                          | Fix                                                       |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `pg_dump: command not found`                | postgres-client not installed                  | `apt-get install -y postgresql-client-15`                 |
| `error: connection to server ... failed`    | Wrong `DATABASE_URL` or pg not running         | Check `systemctl status postgresql`, `pg_isready`         |
| Backup is suspiciously small (<10 MB)       | pg_dump errored silently                       | Run with `--verbose`, check stderr                        |
| `gunzip: invalid compressed data`           | Truncated file (disk full during write)        | Check disk space, re-run backup                           |
| Restore hangs                               | Active connections holding locks               | `SELECT pg_terminate_backend(pid) FROM pg_stat_activity;` |
| `permission denied` in restore              | Role doesn't own objects                       | Run restore as superuser or fix `--no-owner` flag         |
