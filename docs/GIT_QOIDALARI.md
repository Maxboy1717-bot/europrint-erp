# EUROPRINT ERP — GIT QOIDALARI

> Git bilan ishlash tartibi. Parallel sessiyalar, commit format, taqiqlangan amallar.
> Q-23 (bitta bajaruvchi) va Q-46 (ishlab turgan kod) ga bog'liq.

---

## 1. BRANCH STRATEGIYA

```
main                    ← production (protected, direct push TAQIQ)
chore/schema-convergence ← asosiy dev branch (hozir 831+ commit ahead)
feat/[modul]-[vazifa]   ← yangi funksiya
fix/[muammo]            ← xato tuzatish
docs/[nom]              ← faqat hujjat
```

**Hozirgi holat:** `chore/schema-convergence` = de-facto main. `main` = stale (May 14 dan).

```bash
# Har vaqt to'g'ri branchda ekanligini tekshir:
git branch --show-current
# → chore/schema-convergence bo'lishi kerak
```

---

## 2. COMMIT FORMAT

```
<tur>(<modul>): <kiqqa ta'rif>

[ixtiyoriy: batafsil]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Turlar:**
| Tur | Qachon |
|-----|--------|
| `feat` | Yangi funksiya |
| `fix` | Xato tuzatish |
| `docs` | Faqat hujjat |
| `refactor` | Funksiya o'zgarmay, tuzilma o'zgarsa |
| `test` | Faqat test |
| `chore` | Build/tool o'zgarishi |
| `style` | Formatlash, ESLint |

**Misollar:**
```
feat(hr): razryad koeffitsient bo'yicha maosh hisoblash
fix(wms): pos movement TYPE_MAP bilan (hardcoded kirim emas)
docs: §15 tarixiy xatolar katalogi STANDARTLAR.md ga qo'shildi
refactor(sd): SalesOrderService Result<T> pattern ga o'tkazildi
```

---

## 3. GIT ADD — ANIQ FAYLLAR FAQAT

```bash
# ✅ TO'G'RI — faqat o'zgartirgan fayllar:
git add apps/api/src/modules/hr/employees/hr-employees.service.ts
git add apps/api/src/modules/hr/employees/hr-employees.repository.ts
git add artifacts/erp-dashboard/src/pages/hr/HrEmployeesPage.tsx

# ❌ MUTLAQ TAQIQ — hamma fayllarni qo'shish:
git add -A
git add .
git add apps/api/src/

# Nima staged ekanini tekshirish:
git status --short
git diff --staged --stat
```

**Sabab (Q-23):** Parallel sessiyalar bir-birining fayllarini ustiga yozib yuborgan. `git add -A` → boshqa sessiya ishini ham commit → lost work.

---

## 4. COMMIT QOIDALARI

```bash
# Har o'zgarishdan keyin darhol commit:
git add <fayl> && git commit -m "feat(modul): nima qilindi"

# HEREDOC bilan (ko'p satrli xabar):
git commit -m "$(cat <<'EOF'
feat(hr): razryad koeffitsient hisoblash

INPS 8% va NDFL 12% razryad koeffitsienti bilan birga
hisoblanadi. PayrollClosedEvent GL ga posting qiladi.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# ❌ TAQIQ — amend (shared branch da):
git commit --amend  # HECH QACHON published commit ga

# ❌ TAQIQ — force push:
git push --force    # HECH QACHON main/chore/schema-convergence ga
```

---

## 5. MIGRATION COMMIT QOIDASI

Migration fayl = ALOHIDA commit (kod bilan aralashtirilmasin):

```bash
# 1. Migration fayl tayyor:
git add docs/migration/d6-qc-parameters.sql
git commit -m "migration: qc_parameters jadvali (APPROVED: owner 2026-06-18)"

# 2. Keyin kod:
git add apps/api/src/modules/qc/
git commit -m "feat(qc): QC parameters CRUD"
```

**Qoida (Q-35):** Migration faylda `-- APPROVED: owner (sana)` belgi bo'lishi shart.

---

## 6. TAQIQLANGAN AMALLAR

```bash
# ❌ MUTLAQ TAQIQ:
git add -A                    # parallel sessiya clobber
git add .                     # bir xil sabab
git push --force              # tarix yo'qoladi
git commit --amend            # published commit o'zgarmaydi
git reset --hard HEAD~N       # committed ish yo'qoladi
git checkout .                # uncommitted o'zgarishlar yo'qoladi
git clean -fd                 # untracked fayllar yo'qoladi
git stash                     # o'rniga commit qiling

# ❌ LOG FAYLLARNI COMMIT QILISH:
git add backend.log           # hech qachon
git add *.log.*               # hech qachon
# → .gitignore da: backend.log* *.log.*

# ❌ .env COMMIT QILISH:
git add apps/api/.env         # hech qachon — secret leak!
git add .env.local            # hech qachon
```

---

## 7. PUSH VA SYNC

```bash
# Regularlik: har ish sessiyasida kamida 1 push (Q: backup gap bo'lmasligi):
git push origin chore/schema-convergence

# Push blocked bo'lsa (secret leak):
# → Avval secret ni rotate qiling (egasi), keyin allow-url
# → Secret hech qachon allow-url qilinmagan holda push TAQIQ

# Upstream yangilash (agar boshqa ishchi push qilgan bo'lsa):
git fetch origin
git merge origin/chore/schema-convergence  # rebase emas (published commits)
```

---

## 8. CONFLICT HAL QILISH

```bash
# Conflict topildi:
git status  # "both modified" ko'rinadi

# ✅ TO'G'RI — ko'rib chiqib hal qilish:
# Har ikki versiyani o'qing, to'g'risini tanlang
git add <hal-qilingan-fayl>
git commit -m "fix: merge conflict hal qilindi [modul]"

# ❌ XATO — ours bilan hamma narsani ezib yuborish:
git checkout --ours .         # TAQIQ — boshqaning ishi yo'qoladi
git checkout --theirs .       # TAQIQ — o'z ishi yo'qoladi
```

---

## 9. GIT HOLATINI TEKSHIRISH (sessiya boshida)

```bash
# Har sessiya boshida:
git status                    # uncommitted o'zgarish bormi?
git log --oneline -5          # oxirgi 5 commit
git branch --show-current     # to'g'ri branchda?
git diff HEAD --stat          # staged bo'lmagan o'zgarishlar

# Agar uncommitted o'zgarish bo'lsa:
git diff                      # nima o'zgargan ko'rish
git add <fayl> && git commit  # yoki
git restore <fayl>            # agar keraksiz bo'lsa
```

---

## 10. COMMIT HISOBOTINI KO'RISH

```bash
# Bugungi commitlar:
git log --oneline --since="today"

# O'z commitlarim (sana bilan):
git log --oneline --author="Claude\|Muslimbek" --since="1 week ago"

# Fayl bo'yicha tarix:
git log --oneline -- apps/api/src/modules/hr/

# Commit tarkibini ko'rish:
git show <commit-hash>
git show <commit-hash> --stat
```

---

*EuroPrint ERP · Git Qoidalari · Versiya: 2026-06-18*
