# Qoida: Test fail = test'ni yangilash (kodni emas)

> **Status:** ENFORCED (commit-msg hook, 2026-05-27 dan boshlab)
> **Implementatsiya:** `scripts/check-revert-via-tests.mjs`

---

## 🎯 Maqsad

Yaqindagi `feat()` yoki `refactor()` kommit kiritgan yangi pattern'lar
`fix(tests)` ostida yashirin **qaytarib tashlanishi**ni oldini olish.

## 🔍 Sabab — Tarixiy aybdor

**Kommit `2c20cbf4`** (2026-05-27 19:20:45)
Sarlavha: `fix(tests): update 20 failing test suites to match Result pattern and new deps`

Bu kommit avvalgi `feat(hr-add-employee-tx): T2.4 wrap Add Employee in db.transaction`
(kommit `8b763a0b`) **ni qaytardi**:

```diff
- type TxOutcome =
-   | { kind: 'ok'; row: CreatedEmployee }
-   | { kind: 'err'; message: string };
-
- let outcome: TxOutcome;
+ let txRow: CreatedEmployee;
  try {
-   outcome = await db.transaction(async (tx): Promise<TxOutcome> => {
+   txRow = await db.transaction(async (tx): Promise<CreatedEmployee> => {
      ...
      if (!u) {
-       return { kind: 'err' as const, message: 'INSERT returned no row' };
+       throw new Error('INSERT returned no row');
      }
```

Type-safe discriminated union `throw new Error()` ga regressiya qildi —
chunki **test'lar throw'ni kutardi**. Agent test'larni yangilash o'rniga,
yangi pattern'ni o'chirib eski kodga qaytardi.

## 📜 Qoida

1. **Test fail bo'lganda — avval yangi kod to'g'ri ekanini tasdiqlang.**
2. Agar yangi kod to'g'ri bo'lsa — **test'ni yangilang**, kodni emas.
3. So'nggi 7 kun ichida shu fayl `feat()` yoki `refactor()` da o'zgargan
   bo'lsa, `fix(tests)` kommit shu fayllarni **qaytara olmaydi**
   (commit-msg hook avtomatik bloklaydi).
4. Bypass: `git commit --no-verify` — lekin PR review majburiy va
   "nima uchun" sababi PR'da yozilishi shart.

## 🛡️ Hook ishlash sxemasi

```
1. Foydalanuvchi `git commit -m "fix(tests): ..."` ijro etadi
2. commit-msg hook ishga tushadi
3. scripts/check-revert-via-tests.mjs $1 (msg fayli)
4. Agar message `fix(tests)` bilan boshlanmasa → ✅ o'tib ketadi
5. Staged production fayllar (test emas) ro'yxati olinadi
6. Har bir fayl uchun: so'nggi 7 kun git log tekshirish
7. Agar log'da `feat(...)` yoki `refactor(...)` topilsa → ❌ BLOK
8. Bypass: --no-verify
```

## 🧪 Verifikatsiya

```bash
# Sun'iy test
git checkout -b sanity-anti-revert
echo "// regression" >> apps/api/src/modules/hr/application/commands/create-employee.handler.ts
git add apps/api/src/modules/hr/application/commands/create-employee.handler.ts
git commit -m "fix(tests): regress TxOutcome"
# Kutilgan: ❌ ANTI-REVERT GUARD violation
```

## 🔧 Agar test sariq bo'lsa — to'g'ri jarayon

1. Test'ni o'qib, **nima kutayotganini** aniqlang
2. Yangi kod xatti-harakati ni o'rganib chiqing
3. Quyidagi savollarga javob bering:
   - Test eski API'ni testlay yaptimi? → **Test'ni yangilang**
   - Yangi kodda haqiqiy bug bormi? → Kodni tuzating (lekin pattern qaytarmang)
4. Pattern'larni saqlab qoling: Result, TxOutcome, Branded types, va h.k.

## 📚 Bog'liq qoidalar

- `CLAUDE.md` Qoida 1 — Result Pattern majburiy
- `docs/dedup-safety-rules.md` — Dedup sessiyalarida ehtiyot choralari
- `.github/CODEOWNERS` — `🛡️ LOCAL-CRITICAL-GUARD` marker

## 🆘 Bypass tarixini ko'rish

```bash
# Hook bypass qilingan kommitlarni topish
git log --all --grep="--no-verify" --oneline
git log --all --pretty=format:"%h %an %s" | grep -i "no.verify\|bypass"
```
