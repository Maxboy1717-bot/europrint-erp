# 🏛️ EuroPrint ERP — Agent Konstitutsiyasi

> **Versiya:** 1.0 (2026-05-27)  
> **Majburiy:** Har bir agent yoki AI sessiyasidan OLDIN to'liq o'qilsin.  
> **Maqsad:** Har qanday agent — Claude Code, Codex, yoki boshqa AI — ushbu hujjatni
> o'qib, loyiha qoidalari, modul holatlari va ish metodologiyasini bilishi shart.
> `CLAUDE.md`/`AGENTS.md` kodlash qoidalari, bu hujjat esa **ish jarayoni** qoidalari.

---

## 📋 Qisqa Nazorat Ro'yxati (Boshlashdan Oldin)

Har bir agent sessiyasi boshida quyidagi fayllarni o'qing:

```
1. CLAUDE.md                         ← kodlash qoidalari (A,B,1-16,F1-F4)
2. docs/agent-constitution.md        ← bu fayl (ish metodologiyasi)
3. docs/modules/INDEX.md             ← modul holatlari (BLESSED/INVENTORY/NOT_YET)
4. docs/dedup-safety-rules.md        ← 15 ta xavfsizlik qoidasi
5. docs/rules/anti-revert.md         ← test fail = testni yangilash (kodni emas)
6. docs/parallel-sessiya-nazorati.md ← sessiya rollari (Tahlilchi 🔵 / Bajaruvchi 🟢)
```

**ROLINGNI ANIQLA:** Promt boshida 🔵 Tahlilchi (read-only) yoki 🟢 Bajaruvchi (ruxsat bilan)
ekaningni bil. Rol berilmagan bo'lsa — **default 🔵 Tahlilchi**, egasidan ruxsat so'ramaguncha
hech narsa o'zgartirma. Batafsil: pastdagi "Sessiya Rollari" bo'limi.

**AGAR MODUL-SPESIFIK ISH BO'LSA:** `docs/modules/<modul-nomi>.md` ham o'qing.

---

## 🎯 Ish Boshlash Protokoli (Har Sessiyada)

### Qadam 1 — Holat tekshiruv (5 daqiqa)

```bash
# 1. Hozirgi branch
git branch --show-current

# 2. Uncommitted o'zgarishlar bormi?
git status --short

# 3. Oxirgi 5 commit
git log --oneline -5

# 4. Modul indeksi — qaysi modul BLESSED?
cat docs/modules/INDEX.md
```

**AGAR uncommitted o'zgarishlar bo'lsa:** avval oldingi ishni commit qiling yoki
sotuvo/discard qiling. Hech qachon uncommitted state ustiga yangi ish qo'shmang.

### Qadam 2 — Vazifani aniqlashtirish (2 daqiqa)

Har bir sessiyada vazifani bir jumlada yozing va confirm qiling:

```
MAQSAD: [nima amalga oshiriladi]
MODUL: [qaysi modul(lar) tegishli]
HOLAT: [modul BLESSED mi? INVENTORY mi? NOT_YET mi?]
CHIQISH: [qanday commit(lar) kutilmoqda]
VAQT: [taxminiy vaqt]
```

Agar BLESSED modul bo'lsa → avval owner ruxsat olish kerak.

### Qadam 3 — Plan yaratish (katta vazifalar uchun)

**Katta vazifa** = 3 dan ortiq fayl o'zgaradigan yoki 1 soatdan uzun ishlar.

Katta vazifani boshlashdan avval `docs/agent-plans/YYYY-MM-DD-<task-name>.md` yarating:

```markdown
# Plan: [Vazifa nomi]
Yaratildi: YYYY-MM-DD HH:MM
Status: IN_PROGRESS

## Maqsad
[1-2 jumla]

## O'zgaradigan fayllar
- [ ] `fayl/yo'li.ts` — [nima o'zgaradi]
- [ ] `fayl/yo'li.tsx` — [nima o'zgaradi]

## Bosqichlar
- [ ] 1-bosqich: [nima] → commit: `feat(scope): ...`
- [ ] 2-bosqich: [nima] → commit: `feat(scope): ...`
- [ ] 3-bosqich: [nima] → commit: `feat(scope): ...`

## Muvaffaqiyat mezonlari
- [ ] BE typecheck 0 xato
- [ ] FE typecheck 0 xato
- [ ] [domain-specific test] yashil
```

---

## 🔄 Katta Vazifalarni Bajarish Metodologiyasi

> **Muammo:** Agent 1 hafta ishlaydi, hech narsa ko'rinmaydi.  
> **Sabab:** Plan yo'q, commit yo'q, progress ko'rinmaydi.  
> **Yechim:** Har bir bosqich commit, har bir commit kichik va aniq.

### Oltin Qoidalar

1. **Maksimum 60 daqiqada 1 commit** — agar 60 daqiqada hech commit bo'lmasa,
   bu muammo belgisi. Bosqichlarni kichikroq qiling.

2. **Har commit type-safe bo'lishi shart** — commit oldidan:
   ```bash
   pnpm --filter @europrint/api typecheck   # 0 xato
   pnpm --filter erp-dashboard typecheck    # 0 xato
   ```

3. **Plan fayl progressni aks ettirsin** — har bosqich tugaganda `[x]` belgilang:
   ```markdown
   - [x] 1-bosqich: backend endpoint — commit: `abc123`
   - [ ] 2-bosqich: frontend integration
   ```

4. **Agent boshqa agentlar bilan conflict qilmasin** — agar boshqa agent
   parallel ishlayotgan bo'lsa, avval `git pull --rebase` qiling.

### DIZAYN O'ZGARTIRISH Metodologiyasi

"Dizaynni to'liq almashtir" kabi buyruqlar uchun maxsus jarayon:

#### Faza 1 — Audit (commit kerak emas, max 30 daqiqa)

```bash
# 1. Mavjud dizayn tizimini toping
find artifacts/erp-dashboard/src -name "*.css" -o -name "tokens.*" | head -20
cat artifacts/erp-dashboard/src/index.css | head -100

# 2. Mavjud komponentlar
ls artifacts/erp-dashboard/src/components/ui/

# 3. Rang/font konstantalari
grep -r "primary\|secondary\|accent\|brand" artifacts/erp-dashboard/src --include="*.css" | head -20
```

Audit natijasini `docs/agent-plans/design-audit-YYYY-MM-DD.md` ga yozing.

#### Faza 2 — Maqsad aniqlash (commit kerak emas, max 15 daqiqa)

Foydalanuvchidan aniq tasdiq oling:
- Rang paleti (primary, secondary, accent hex kodlar)
- Font (font family va o'lchamlar)
- Komponent uslub (rounded/sharp, shadowed/flat, dark/light)
- Eng muhim 3 sahifa nomi (prioritet)

**Tasdiq olmay dizayn o'zgartirishni BOSHLAMANG.**

#### Faza 3 — Token o'zgarish (1 commit)

```bash
# index.css yoki tailwind.config.ts tokenlarni yangilash
git commit -m "style(tokens): update color palette and typography tokens"
```

#### Faza 4 — Komponent bosqichma-bosqich (har komponent 1 commit)

```bash
git commit -m "style(ui): update Button component with new design tokens"
git commit -m "style(ui): update Card component with new design tokens"
git commit -m "style(ui): update Table component with new design tokens"
```

#### Faza 5 — Sahifalar bosqichma-bosqich (har sahifa 1 commit)

```bash
git commit -m "style(employees): apply new design system to Employees page"
git commit -m "style(dashboard): apply new design system to Dashboard page"
```

**Natija:** Foydalanuvchi har commit keyin browser'da progressni ko'radi. Hech qachon
"hafta ishladim, ko'rsatolmadim" holati bo'lmaydi.

### MODUL REFACTOR Metodologiyasi

"Modul X ni to'liq qayta yoz" kabi buyruqlar uchun:

#### Faza 1 — Inventarizatsiya (commit: `docs(module-x): inventory`)

`docs/modules/module-x.md` yarating — barcha mavjud fayllar ro'yxati.

#### Faza 2 — Kanonik tanlash (commit: `docs(module-x): canonical selection`)

Qaysi fayl kanonik, qaysilari `@deprecated` ekanini belgilang.

#### Faza 3 — @deprecated header (commit: `chore(module-x): mark deprecated files`)

Barcha eski fayllar tepasiga header qo'shing:
```typescript
/**
 * @deprecated 2026-XX-XX — Replaced by `canonical/path.ts`
 * Do not add new features here. Existing consumers still work.
 */
```

#### Faza 4 — Kanonik fayl (har qism 1 commit)

New canonical code kiriting, old consumers hali eski faylni ishlatishi OK.

#### Faza 5 — Consumer migratsiya (har consumer 1 commit)

Eski fayl import qiluvchi joylarni asta-sekin yangi kanonik faylga ko'chiring.

#### Faza 6 — BLESSED (commit: `docs(module-x): BLESSED status`)

`docs/modules/INDEX.md` va `docs/modules/module-x.md` ni yangilang.

---

## 🛡️ Governance Qoidalari (Majburiy)

### Anti-Revert Qoidasi

> Manba: `docs/rules/anti-revert.md`

**Test fail bo'lganda:**
1. Avval yangi kod to'g'ri ekanini tasdiqlang
2. Yangi kod to'g'ri → **testni yangilang** (kodni emas)
3. So'nggi 7 kun ichida shu fayl `feat()`/`refactor()` da o'zgargan bo'lsa,
   `fix(tests)` shu fayllarni qaytarishi `commit-msg` hook tomonidan bloklanadi

**HECH QACHON:** "Testlar fail bo'ldi, eng oson yo'l — yangi kodni o'chirib eski holatga qaytaraman"

**DOIMO:** "Testlar fail bo'ldi, yangi kod nima qaytaradi vs test nima kutadi → testni yangilaman"

### CODEOWNERS Qoidasi

`docs/rules/anti-revert.md` da ko'rsatilgan kritik fayllar (auth, finance, hr commands, 
DB schema, migrations) faqat owner tomonidan o'zgartirilishi mumkin.

Agar kritik fayl o'zgartirishingiz kerak bo'lsa:
1. Pre-commit hook bloklayman
2. `git commit --no-verify` bilan o'tish mumkin
3. Lekin PR yozing va owner review talab qiling

### Commit Qoidalari

**Format (Conventional Commits):**
```
<type>(<scope>): <description>
```

Type'lar: `feat|fix|docs|chore|style|refactor|perf|test|build|ci|revert`

**Misol:**
```
feat(hr): add salary review endpoint
fix(auth): use JWT_REFRESH_SECRET for refresh token
docs(modules): add inventory for Finance AR
style(employees): apply new card design
```

**QOIDA:** Har commit `git add` faqat o'zim o'zgartirgan fayllar:
```bash
git add apps/api/src/modules/hr/employees/employees.service.ts
git add apps/api/src/modules/hr/presentation/hr-employees.controller.ts
# HECH QACHON: git add -A
```

**SABAB:** Parallel agentlar shu repo'da ishlaydi. `git add -A` boshqa agent
ishini o'chiradi.

---

## 🔵🟢 Sessiya Rollari — Parallel Nazorat (Majburiy)

> To'liq copy-paste promt shablonlari: `docs/parallel-sessiya-nazorati.md`

**Muammo:** 2026-06-02 da parallel sessiyalar bir-birini ko'rmay, tahlil hisobotidagi
**tavsiyalarni** o'zboshimcha **bajargan** (legacy o'chirish `adcd527e`, Portret `2f353637`,
employees.user_id) — egasi "FAQAT TAHLIL" deganda. Yechim: har sessiya promt boshida ROL oladi.

| | Tahlilchi 🔵 | Bajaruvchi 🟢 |
|---|---|---|
| O'qiydi | ✅ | ✅ |
| O'zgartiradi | ❌ hech qachon | ✅ lekin RUXSAT bilan |
| Necha sessiya | ko'p parallel mayli | bir vaqtda BITTA |
| Tavsiyani bajaradi | ❌ faqat aytadi | ❌ faqat aytadi, ruxsat kutadi |
| `git add -A` | ❌ | ❌ hech qachon |

**Eng muhim 3 qoida:**
1. **Tavsiya ≠ ruxsat.** Tahlil hisobotidagi "o'chir/tuzat" tavsiyasini HECH KIM
   o'z-o'zicha bajarmaydi. Bajarish faqat egasi aniq **"ha, bajar"** deganda boshlanadi.
2. **Tahlilchi (🔵) hech narsa o'zgartirmaydi** — faqat `docs/` ga hisobot. Oxirida
   `git status` da `docs/` dan boshqa narsa ko'rinsa — XATO, egasiga ayt.
3. **Bir vaqtda faqat bitta Bajaruvchi (🟢)** — ikki bajaruvchi = to'qnashuv ("concurrent
   agent reset my index"). O'zgartirish navbat bilan, har biri o'z faylini `git add <fayl>`.

**Rol berilmagan bo'lsa:** default 🔵 Tahlilchi. Ruxsat so'ramay hech narsa o'zgartirma.

---

## 🏷️ Modul Holat Tizimi

Har bir modul quyidagi statuslardan birida bo'ladi:

| Status | Ma'nosi | Yangi kod qo'shsa bo'ladimi? |
|--------|---------|------|
| 🟢 **BLESSED** | Kanonik, to'liq, testlangan | Faqat owner PR orqali |
| 🔵 **INVENTORY** | Audit o'tkazildi, @deprecated belgilandi | Ha, lekin faqat kanonik fayllarga |
| ⚪ **NOT_YET** | Hali audit o'tkazilmagan | Ha, lekin ehtiyot bo'ling |

**BLESSED modul fayllarini o'zgartirish oldidan:** `docs/modules/INDEX.md` dan
module status'ni tekshiring.

`docs/modules/INDEX.md` — barcha modul ro'yxati.

---

## 🧪 Typecheck Gate (Majburiy)

Har qanday commit oldidan quyidagi tekshiruvlar o'tishi shart:

```bash
# Agar backend fayl o'zgargan bo'lsa:
cd apps/api && pnpm typecheck

# Agar frontend fayl o'zgargan bo'lsa:
cd artifacts/erp-dashboard && pnpm typecheck

# Agar lib/db o'zgargan bo'lsa:
cd lib/db && pnpm build
```

**Agar typecheck FAIL bo'lsa** — commit qilmang. Avval type xatolarini tuzating.

---

## 🔧 Qoidalar Xulosa (CLAUDE.md dan)

> To'liq qoidalar `CLAUDE.md` da. Bu yerda faqat eng tez-tez unutiladigan 5 ta:

### 1. Result Pattern (har doim)
```typescript
// ❌ throw new Error('not found')
// ✅ return err(AppErr('NOT_FOUND', 'topilmadi'))
```

### 2. TxOutcome Pattern (transaction ichida)
```typescript
// ❌ throw new Error('INSERT returned no row')
// ✅ return { kind: 'err', message: 'INSERT returned no row' }
```

### 3. Drizzle ORM (oddiy CRUD uchun)
```typescript
// ❌ db.execute(sql`SELECT * FROM employees WHERE id = ${id}`)
// ✅ db.select().from(employees).where(eq(employees.id, id))
```

### 4. Repository orqali (service ichida)
```typescript
// ❌ constructor(private db: DrizzleService) { this.db.select()... }
// ✅ constructor(private repo: IEmployeeRepository) { this.repo.findAll()... }
```

### 5. Array xavfsizligi
```typescript
// ❌ data.map(x => x.id)
// ✅ (Array.isArray(data) ? data : []).map(x => x.id)
```

---

## 📁 Muhim Fayllar Xaritasi

```
loyiha ildiz/
├── CLAUDE.md                    ← Claude Code uchun kodlash qoidalari
├── AGENTS.md                    ← OpenAI Codex uchun kodlash qoidalari
├── docs/
│   ├── agent-constitution.md    ← bu fayl (ish metodologiyasi)
│   ├── modules/
│   │   ├── INDEX.md             ← modul reestri (BLESSED/INVENTORY/NOT_YET)
│   │   └── hr-employees.md      ← HR Employees modul inventarizatsiyasi
│   ├── rules/
│   │   └── anti-revert.md       ← anti-revert qoidasi
│   ├── dedup-safety-rules.md    ← 15 ta dedup xavfsizlik qoidasi
│   └── agent-plans/             ← sessiya planlari (agent tomonidan yaratiladi)
├── scripts/
│   ├── check-revert-via-tests.mjs   ← anti-revert hook skripti
│   └── check-codeowners.mjs         ← codeowners hook skripti
├── .github/
│   └── CODEOWNERS                   ← kritik fayl egaligi
├── .husky/
│   ├── pre-commit                   ← lint-staged + codeowners guard
│   └── commit-msg                   ← conventional commits + anti-revert
├── apps/api/src/
│   └── modules/
│       ├── hr/                      ← HR domain (INVENTORY holatida)
│       └── compatibility/           ← @deprecated (yangi kod qo'shilmaydi)
├── artifacts/erp-dashboard/src/     ← React frontend
└── lib/db/src/schema/               ← Kanonik Drizzle sxemalar
```

---

## ❓ Tez-Tez So'raladigan Savollar

**Q: Compat fayllarga yangi funksiya qo'shsam bo'ladimi?**  
A: YO'Q. `compatibility/` folderi @deprecated. Yangi funksiya faqat kanonik fayllarga.

**Q: Test fail bo'ldi, nima qilaman?**  
A: Test nima kutayotganini o'qing → yangi kod xatti-harakatini tekshiring → TESTNI yangilang.

**Q: "Bu faylni o'chirsam bo'ladimi?"**  
A: O'chirish TAQIQLANGAN. @deprecated header qo'shib, kanonik faylga redirect qiling.

**Q: Parallel agent shu branch'da ishlayaptimi?**  
A: `git log --oneline -3` bilan tekshiring. Agar boshqa agent commit bo'lsa — `git pull --rebase`.

**Q: `git add -A` ishlatsam bo'ladimi?**  
A: YO'Q. Faqat o'zim o'zgartirgan fayllarni `git add [fayl]` bilan qo'shing.

**Q: Typecheck xatosi bor, commit qilsam bo'ladimi?**  
A: YO'Q. Avval xatolarni tuzating, keyin commit.

**Q: BLESSED modul faylini o'zgartirmoqchiman?**  
A: PR oching, owner review kutilsin. `--no-verify` ishlatishingiz mumkin lekin PR MAJBURIY.

**Q: "Dizaynni o'zgartir" buyrug'i keldi, qaerdan boshlayman?**  
A: Faza 1 — Audit (index.css, tailwind config, ui komponentlar). Keyin foydalanuvchidan
aniq rang va stil tasdiqlang. Tasdiqsiz o'zgartirma. Keyin token → komponent → sahifa tartibida.

---

*Yangilangan: 2026-06-02 | Versiya: 1.1 (Sessiya rollari qo'shildi: Tahlilchi 🔵 / Bajaruvchi 🟢)*
