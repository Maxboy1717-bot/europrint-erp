# EUROPRINT ERP — CI/CD STANDARTLARI

> **Avtomatik tekshiruvlar, deployment, branch himoya qoidalari.**
> Har commit → CI ishga tushadi. CI PASS bo'lmasa → merge bo'lmaydi.
> Bog'liq: [GIT_QOIDALARI.md](GIT_QOIDALARI.md) · [MUHIT_STANDARTLARI.md](MUHIT_STANDARTLARI.md) · [MONITORING_STANDARTLARI.md](MONITORING_STANDARTLARI.md)

---

## 1. CI PIPELINE (Hozirgi Holat)

```yaml
# .github/workflows/ci.yml (mavjud)
# Qachon ishlaydi: har push (branch farq qilmaydi)

Bosqichlar:
  1. Checkout
  2. pnpm install
  3. tsc --noEmit (BE + FE)
  4. pnpm test
  5. (code-quality.yml: array/Result ratchet)

CI PASS → commit qabul qilinadi
CI FAIL → PR merge bo'lmaydi
```

---

## 2. PRE-COMMIT HOOKLAR (Mahalliy)

```bash
# .husky/ (mavjud — git commit oldidan ishga tushadi)

Hooklar:
  check-design-tokens.mjs      → yangi inline rang yo'q
  check-sidebar-routes.mjs     → sidebar URL mos
  i18n-status.mjs              → i18n kalit mavjud
  check-schema-dups.js         → schema dup ratchet (166)
  tsc                          → 0 xato
  golden-thread-chain-proof.cjs → oltin zanjir ulangan
  check-no-new-stubs.mjs       → yangi parazit yo'q
  check-fe-api-urls.mjs        → ghost endpoint yo'q
  check-no-secret-print.mjs    → secret loglanmaydi

Hook muvaffaqiyatsiz → commit BLOKLANADI
Yechim: xatoni tuzat, yana commit qil (--no-verify HECH QACHON)
```

---

## 3. BRANCH STRATEGIYASI

```
chore/schema-convergence — DE-FACTO MAIN (831+ commit oldinda)
  ↑
  Barcha yangi ishlar shu branchda
  Push: har sprint + muhim o'zgarishdan keyin
  main → chore ff merge (hali early stage, push qilma)

Feature branch (agar kerak):
  feature/[sprint]-[tavsif]
  Misol: feature/sprint1-auth-v2
  PR → chore/schema-convergence → squash merge → branch o'chir
```

---

## 4. CI YO'QOLGAN QOIDALAR (Qo'shish Kerak)

```yaml
# Sprint 1 dan keyin ci.yml ga qo'shish tavsiya:

# Integration test (real DB):
- name: Run integration tests
  env:
    DATABASE_URL_TEST: postgresql://europrint:test@localhost:5432/europrint_test
  run: pnpm --filter @europrint/api run test:integration

# Security audit:
- name: Security audit
  run: pnpm audit --audit-level=high

# Coverage check:
- name: Coverage threshold
  run: pnpm --filter @europrint/api run test:cov
  # jest.config.ts coverageThreshold: { global: { lines: 70 } }
```

---

## 5. DEPLOYMENT (Hozirgi: Manual)

```bash
# Hozirgi deployment tartibi (mahalliy server):

# 1. Kod olish:
git pull origin chore/schema-convergence

# 2. Paketlar o'rnatish:
pnpm install --frozen-lockfile

# 3. Build:
pnpm --filter @europrint/api run build

# 4. Migration (agar yangi bo'lsa):
psql $DATABASE_URL < docs/migration/d[N]-*.sql
# → AVVAL pg_dump backup!

# 5. Restart:
pm2 restart europrint-api
# YOKI:
systemctl restart europrint-api

# 6. Tekshirish:
curl http://127.0.0.1:3030/health
# → {"status":"ok"}
```

---

## 6. DEPLOYMENT XAVFSIZLIGI

```bash
# Har deployment OLDIDAN:

# 1. Backup:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
echo "Backup: $?"

# 2. Migration staging da sinov:
psql $DATABASE_URL_STAGING < docs/migration/d[N]-*.sql
# Staging = production bilan bir xil tuzilma, test ma'lumot

# 3. Tekshirish:
psql $DATABASE_URL_STAGING -c "\d [jadval]"  # yangi ustun bormi?

# 4. Keyin production:
psql $DATABASE_URL < docs/migration/d[N]-*.sql

# Rollback (agar xato):
psql $DATABASE_URL < docs/migration/d[N]-down.sql
# YOKI:
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## 7. MUHIT TEKSHIRUVI (Deployment Oldidan)

```bash
# Majburiy o'zgaruvchilar bormi?
node -e "
const req=['DATABASE_URL','JWT_SECRET','JWT_REFRESH_SECRET','PORT','NODE_ENV'];
const miss=req.filter(k=>!process.env[k]);
if(miss.length){console.error('❌ YO\'Q:',miss.join(', '));process.exit(1);}
console.log('✅ Barcha env var mavjud');
"

# DB ulanish:
pg_isready -d "$DATABASE_URL" && echo "✅ DB ulanish OK" || echo "❌ DB xato"

# Port bo'sh:
netstat -tlnp 2>/dev/null | grep :3030 && echo "⚠️ Port band!" || echo "✅ Port bo'sh"
```

---

## 8. CI MUAMMO YECHIMI

```
CI FAIL sabablar va yechimlar:

tsc xato:
  → npx tsc -p apps/api/tsconfig.json --noEmit
  → Har xatoni alohida tuzat

Test fail:
  → pnpm test -- --verbose
  → Muvaffaqiyatsiz test nomini topib tuzat

pre-commit hook fail:
  → Hook nomini o'qi, skriptni to'g'ridan ishlat:
    node scripts/check-no-new-stubs.mjs
  → Muammoni tuzat, yana commit

Schema dup ratchet oshdi:
  → Yangi pgTable dup qo'shdim?
  → STANDARTLAR.md §4 bo'yicha re-export o'chir

❌ HECH QACHON:
git commit --no-verify   → hook o'tkazib yuborish
ci.yml → || true         → xato yashirish
```

---

*EuroPrint ERP · CI/CD Standartlari · Versiya: 2026-06-18*
