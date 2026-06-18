# EUROPRINT ERP — CODE REVIEW STANDARTLARI

> **PR qanday tayyorlanadi, qanday tekshiriladi, merge qachon bo'ladi.**
> Backend_Reja/18_Code_Review.md = nima quriladi. Bu = JARAYON qoidalari.
> Qoida: Hech qanday kod review bo'lmay merge bo'lmaydi.
> Bog'liq: [GIT_QOIDALARI.md](GIT_QOIDALARI.md) · [XAVFSIZLIK_STANDARTLARI.md](XAVFSIZLIK_STANDARTLARI.md) · [TEST_STANDARTLARI.md](TEST_STANDARTLARI.md)

---

## 1. COMMIT FORMATI (Majburiy)

```
<tur>(<modul>): <ta'rif>

Turlar:
  feat     — yangi funksiya
  fix      — xato tuzatish
  refactor — qayta tuzilish (funksionallik o'zgarmaydi)
  test     — test qo'shish/o'zgartirish
  docs     — hujjat
  chore    — konfiguratsiya, tozalash, boshqa
  perf     — performance yaxsilash
  style    — formatlash (mantiq o'zgarmaydi)
  revert   — oldingi commitni bekor qilish
  build    — build tizimi, dependency

Modul:
  hr, org, sd, pp, mes, qc, wms, fin, crm, mm, auth, iot, ai, pos, common

Misol:
  feat(hr): add razryad_level to employee create endpoint
  fix(sd): prevent N+1 in sales order list query
  chore(org): remove v1 legacy org module (v2 ready)
  docs(foundation): add security standards
  test(hr): add integration test for employee repository
```

---

## 2. COMMIT QOIDALARI

```bash
# ✅ TO'G'RI — aniq fayl:
git add apps/api/src/modules/hr/application/services/hr-employee.service.ts
git add apps/api/src/modules/hr/presentation/controllers/hr-employee.controller.ts

# ❌ TAQIQ — umumiy:
git add -A
git add .
git add apps/api/src/

# ✅ Migration alohida commit:
git add docs/migration/d5-add-razryad.sql
git commit -m "chore(db): add razryad migration d5"
# Keyin kod:
git add apps/api/src/modules/hr/...
git commit -m "feat(hr): add razryad support to employee"

# ✅ Co-author (majburiy):
git commit -m "$(cat <<'EOF'
feat(hr): add employee razryad level

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 3. PR SHABLONI (Pull Request Template)

```markdown
## Maqsad
<!-- Bu PR nima qiladi? 1-2 jumlada -->

## O'zgarishlar
<!-- Nimalar o'zgardi (fayllar, logika) -->
- [ ] Backend: ...
- [ ] Frontend: ...
- [ ] DB migration: ...
- [ ] Testlar: ...

## Tekshiruv qadamlari
<!-- Reviewerga qanday tekshirsin -->
1. `pnpm --filter @europrint/api run dev:unsafe` ishga tushir
2. `curl http://127.0.0.1:3030/api/...` chaqir
3. ...

## Screenshot (FE o'zgarishi bo'lsa)
<!-- Oldin / Keyin -->

## Checklisti
- [ ] tsc 0 xato
- [ ] Test PASS
- [ ] @Roles() har yangi endpointda
- [ ] N+1 yo'q (real JOIN)
- [ ] Parol/token loglanmagan
- [ ] Event emit (agar kerak)
- [ ] SPRINT_DOD.md cheklisti to'liq
```

---

## 4. REVIEW TEKSHIRUV RO'YXATI (Reviewer Uchun)

### SEC (Xavfsizlik):
```
□ Har yangi endpoint uchun @Roles() bormi?
□ @Public() kerakmi? (faqat /health, /auth/login, /auth/refresh)
□ Input validatsiya (whitelist=true, class-validator) bormi?
□ SQL raw string yo'qmi? (faqat Drizzle parametrized)
□ Parol/token/secret loglanmayaptimi?
□ Yangi env var .env.example ga qo'shilganmi?
```

### DB (Ma'lumotlar bazasi):
```
□ N+1 yo'qmi? (har ro'yxat = 1 SQL)
□ Yangi FK uchun index bormi?
□ Soft delete (deleted_at) ishlatilganmi?
□ Migration faylidagi APPROVED: owner comment bormi?
□ Migration idempotentmi? (IF NOT EXISTS)
□ VIEW ga yozilmayaptimi?
```

### DDD (Arxitektura):
```
□ Domain entity Result<T> qaytaradimi?
□ Biznes mantiq faqat domain/application damihi?
□ Controller faqat parse + delegate + returnmi?
□ Modul boshqa moduldan service import qilmayaptimi?
□ Repository faqat DB operatsiyami? (mantiq yo'q)
□ Event emit bo'ldimi? (agar golden thread bog'liq)
```

### TEST:
```
□ Yangi endpoint uchun test bormi?
□ Happy path test bormi?
□ Xato holat test bormi? (404, 403, 400)
□ Repository test real DB ishlatadimi? (mock emas)
□ Test cleanup (afterEach) bormi?
```

### PERF (Performance):
```
□ Katta jadval uchun LIMIT bormi?
□ Pagination mavjudmi?
□ Sekin so'rov uchun EXPLAIN ANALYZE tekshirilganmi?
```

### NAMING (Nomlash):
```
□ Fayl nomi: kebab-case, module prefiksi
□ Class: PascalCase
□ Metod/o'zgaruvchi: camelCase
□ DB ustun: snake_case
□ Event: 'modul.entity.amal' (snake_case, past tense)
□ Error code: MODUL_XATO_NOMI (SCREAMING_SNAKE_CASE)
```

---

## 5. REVIEW JARAYONI

```
1. PR yaratish:
   - Checklisti to'ldir
   - Reviewer belgilash (Muslimbek → Claude advisor)

2. Avtomatik tekshiruvlar (CI):
   - tsc --noEmit → 0 xato
   - pnpm test → 0 fail
   - pre-commit hooklar → PASS

3. Review:
   - Reviewer kodini o'qiydi (TEKSHIRUV RO'YXATI bo'yicha)
   - Bloker muammo → "BLOKER: [sabab]" comment (merge bo'lmaydi)
   - Taklif → "TAKLIF: [sabab]" comment (merge bo'lishi mumkin)

4. Merge:
   ✅ CI PASS
   ✅ Reviewdan "APPROVED" (bloker yo'q)
   ✅ Checklisti to'liq
   → Squash merge (bitta clean commit)
```

---

## 6. BLOKER vs TAKLIF

```
BLOKER (merge bo'lmaydi):
  ❌ tsc xato
  ❌ Test fail
  ❌ Xavfsizlik muammo (guard yo'q, secret log)
  ❌ N+1 query katta jadvalda
  ❌ DB ya'ni approved migration yo'q
  ❌ VIEW ga yozish
  ❌ Parazit kod (return { ok: true } stub)

TAKLIF (merge bo'lishi mumkin, keyingi sprint):
  ⚠️ Test coverage past
  ⚠️ Nomlash yaxshilanishi mumkin
  ⚠️ Refactor imkoniyati bor
  ⚠️ Ko'proq validatsiya qo'shsa yaxshi
```

---

## 7. MERGE QOIDALARI

```bash
# ✅ TO'G'RI merge (squash):
git merge --squash feature/hr-razryad
git commit -m "feat(hr): add employee razryad level (squash)"

# ❌ TAQIQ:
git push --force        # boshqalar tarixi buziladi
git commit --amend      # push bo'lgan commit o'zgaradi
git merge -m "merge"    # squash yo'q (tarixi ifloslaydi)

# Branch siyosati:
# chore/schema-convergence = de-facto main (push qil, promote qilma hali)
# Yangi feature → branch → PR → merge
```

---

## 8. SELF-REVIEW QOIDASI (Commit Oldidan)

```bash
# Har commit oldidan o'z-o'zini tekshir:

# 1. Tsc:
npx tsc -p apps/api/tsconfig.json --noEmit

# 2. Test:
pnpm --filter @europrint/api run test --passWithNoTests

# 3. Pre-commit hooklar:
git diff --staged | node scripts/check-no-secret-print.mjs
node scripts/check-no-new-stubs.mjs

# 4. Diff ko'zdan kechir:
git diff --staged  # har satrni o'qi

# 5. Faqat kerakli fayllar:
git status  # qo'shimcha fayl bormi?
```

---

*EuroPrint ERP · Code Review Standartlari · Versiya: 2026-06-18*
