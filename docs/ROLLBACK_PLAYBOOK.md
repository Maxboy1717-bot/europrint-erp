# EUROPRINT ERP — ROLLBACK PLAYBOOK

> **Narsa ishlamay qolsa nima qilish kerak. Har vaziyat uchun aniq qadam.**
> Maqsad: < 5 daqiqada normal holatga qaytish.
> Qoida: AVVAL tiklash → KEYIN tahlil. Foydalanuvchi kutmaydi.
> Bog'liq: [XAVF_REESTRI.md](XAVF_REESTRI.md) · [MUHIT_STANDARTLARI.md](MUHIT_STANDARTLARI.md) · [MONITORING_STANDARTLARI.md](MONITORING_STANDARTLARI.md)

---

## 1. TEZKOR TEKSHIRUV (Biror narsa ishlamaydi)

```bash
# 1-qadam: API ishlayaptimi?
curl http://127.0.0.1:3030/health
# ✅ {"status":"ok"} → API ishlaydi
# ❌ connection refused → API tushib qolgan (§2 ga o't)
# ❌ {"status":"degraded"} → DB muammo (§3 ga o't)

# 2-qadam: DB ishlayaptimi?
pg_isready -d "$DATABASE_URL"
# ✅ accepting connections → DB ishlaydi
# ❌ → DB tushib qolgan (§3 ga o't)

# 3-qadam: Docker ishlayaptimi?
docker ps | grep postgres
# ✅ Up → ishlab turibdi
# ❌ → docker restart uzbek-language-module-postgres-1
```

---

## 2. API TUSHIB QOLDI

```bash
# Sabab tekshir:
pm2 logs europrint-api --lines 50
# YOKI:
journalctl -u europrint-api -n 50

# Ko'p uchraydigan sabablar:

# a) Port band:
netstat -tlnp | grep :3030
kill -9 [pid]
pm2 restart europrint-api

# b) Xotira to'lib ketdi:
free -h
pm2 restart europrint-api  # xotira bo'shatadi

# c) TypeScript xato (yangi deploy):
cd /path/to/europrint
git log --oneline -5  # oxirgi commit
git revert HEAD       # oxirgi commitni bekor qil
pnpm build && pm2 restart europrint-api

# d) ENV yo'q:
pm2 env europrint-api | grep DATABASE_URL
# Bo'sh bo'lsa → .env tekshir, pm2 restart --update-env
```

---

## 3. DB MUAMMO

```bash
# Docker restart:
docker restart uzbek-language-module-postgres-1
sleep 5
pg_isready -d "$DATABASE_URL"

# Agar Docker ham tushib qolsa:
docker-compose up -d postgres
sleep 10
pg_isready -d "$DATABASE_URL"

# DB to'lib ketdi (disk):
df -h  # disk space tekshir
# Eski loglar o'chir:
find /var/log -name "*.log" -mtime +7 -delete
# Yoki eski pg_dump fayllar:
ls -lh backup_*.sql | sort -k5 | head -5
rm backup_202606*.sql  # eski backuplar

# Connection pool tugadi:
# pg_stat_activity tekshir:
psql $DATABASE_URL -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
# "idle" ko'p bo'lsa → api restart (pool bo'shaydi)
```

---

## 4. MIGRATION ROLLBACK

```bash
# Migration xato bo'lsa — 2 variant:

# VARIANT A: Down migration (oldindan yozilgan bo'lsa):
psql $DATABASE_URL < docs/migration/d[N]-down.sql
# Tekshir:
psql $DATABASE_URL -c "\d [jadval]"  # ustun olib tashlangandimi?

# VARIANT B: Backup dan tiklash (down migration yo'q bo'lsa):
# Avval API to'xtat:
pm2 stop europrint-api

# Backup tiklash:
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
# DIQQAT: Backup dan keyin qo'shilgan ma'lumotlar YO'QOLADI!
# Foydalanuvchilarga xabar: "X vaqtdan keyin ma'lumotlar saqlanmadi"

# API qayta ishga tushir:
pm2 start europrint-api
curl http://127.0.0.1:3030/health
```

---

## 5. V2 KOD ROLLBACK (Sprint Almashuvida)

```bash
# V2 moduli production da xato bersa → V1 ga qaytish:

# 1. Tezkor (< 2 daqiqa):
git log --oneline -10  # V1 → V2 merge commit topish
git revert [v2-commit-hash] --no-commit
git commit -m "revert: rollback [modul] v2 (muammo: [sabab])"

# 2. API restart:
pnpm build && pm2 restart europrint-api

# 3. Tekshir:
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:3030/api/[modul]/[endpoint]
# → ishlayaptimi?

# Rollback vaqt maqsadi: < 5 daqiqa
```

---

## 6. SECRET LEAK (Eng Muhim!)

```bash
# Agar secret gitga tushib ketsa:

# 1. DARHOL — Secretni almashtir (rotate):
# JWT_SECRET: yangi 48 byte random
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# .env yangilash

# 2. API restart (eski tokenlar eskirsin):
pm2 restart europrint-api

# 3. GitHub push protection (agar push qilingan bo'lsa):
# GitHub → Settings → Code security → Push protection → Secret detected
# → "Review" → "Allow" (FAQAT private repo va rotate qilingan keydan keyin!)

# 4. Tekshir:
git log --all -p -- .env  # .env commit da bormi?
gitleaks detect --no-git  # skanerlash

# 5. Agar push bo'lgan → git history o'chirish:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docs/[xato-fayl]" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force  # (OWNER RUXSATI kerak)
```

---

## 7. OUTBOX RELAY TO'XTADI

```bash
# Tekshir:
psql $DATABASE_URL -c "
SELECT event_type, status, COUNT(*), MIN(created_at)
FROM domain_events
WHERE status = 'PENDING'
GROUP BY event_type, status;"
# → PENDING qatorlar > 5 daqiqa eski = relay ishlamayapti

# Yechim 1: API restart (relay timer yangilanadi):
pm2 restart europrint-api
sleep 10
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM domain_events GROUP BY status;"
# → PUBLISHED ko'payishi kerak

# Yechim 2: Qo'lda relay (relay to'xtaganda):
psql $DATABASE_URL -c "
UPDATE domain_events SET status='PENDING'
WHERE status='FAILED' AND attempts < 3;"
# Keyin API restart

# Yechim 3: Dead-letter (3+ retry muvaffaqiyatsiz):
psql $DATABASE_URL -c "
SELECT * FROM domain_events WHERE status='FAILED' AND attempts >= 3
ORDER BY created_at;"
# → Har birini ko'rib chiq, kerak bo'lsa qo'lda bajaring
```

---

## 8. FE ISHLAMAYDI

```bash
# FE 502/404:

# 1. FE build xatosi:
pnpm --filter erp-dashboard run build 2>&1 | tail -50
# Xatoni tuzat → qayta build

# 2. FE server port:
netstat -tlnp | grep :5173
# Dev server ishlayaptimi?
pnpm --filter erp-dashboard run dev &

# 3. API CORS xatosi (FE → API):
# Browser console → "CORS error"
# API .env da FRONTEND_URL to'g'ri:
echo $FRONTEND_URL  # http://localhost:5173 bo'lishi kerak

# 4. FE token yo'q (401):
# localStorage.getItem('access_token') null → login sahifasiga yo'naltir
# FE da auth guard bormi? PrivateRoute
```

---

## 9. ROLLBACK QAROR DARAXTI

```
Muammo bor →
  │
  ├─ API javob bermaydi → §2 (API restart)
  │
  ├─ DB ulanmaydi → §3 (Docker restart / disk)
  │
  ├─ Migration xato → §4 (down migration / backup)
  │
  ├─ Yangi sprint kodi xato → §5 (git revert V2)
  │
  ├─ Secret gitda → §6 (DARHOL rotate!)
  │
  ├─ Eventlar yo'qoladi → §7 (relay restart)
  │
  └─ FE ishlamaydi → §8 (build / CORS / auth)

Har holatda:
  1. AVVAL tiklash (< 5 daqiqa)
  2. KEYIN sabab tahlili
  3. KEYIN doimiy yechim
```

---

## 10. MUAMMO KUZATUVI (Incident Log)

```
Har P0 incident uchun yozib qo'y:

Sana: 2026-06-XX
Vaqt: HH:MM — HH:MM
Muammo: [tavsif]
Ta'sir: [foydalanuvchilar soni, qancha vaqt]
Sabab: [ildiz sabab]
Yechim: [nima qilindi]
Rollback: [Ha/Yo'q, qaysi qadam]
Oldini olish: [keyingi safar qanday oldini olish]

Qayd: docs/incidents/YYYYMMDD-[tavsif].md
```

---

*EuroPrint ERP · Rollback Playbook · Versiya: 2026-06-18*
