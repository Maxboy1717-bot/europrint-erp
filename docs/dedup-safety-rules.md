# Dedup va Refactor Xavfsizlik Qoidalari

> Bu hujjat dedup, schema-shim, agent-driven refactor va katta scope o'zgarishlarda
> takror xato qilmaslik uchun amalda kuzatilgan qoidalar to'plamidir.
> Har sessiya boshida o'qib chiqish tavsiya etiladi.

---

## 🔴 P0 — Texnik (eng muhimi)

### 1. Drizzle schema'larda cyclic shim YO'Q

**Sabab:** `createInsertSchema(undefined)` runtime crash beradi — circular import paytida ikkala fayl ham bir-birini undefined sifatida ko'radi.

```ts
// ❌ NOTO'G'RI — cycle
// hr-questionnaire.ts
import { vacancies as _v } from "./recruitment";
export const vacancies = _v;

// recruitment.ts
import { interviews as _i } from "./hr-questionnaire";  // ← CYCLE
```

```ts
// ✅ TO'G'RI — bir fayl canon, ikkinchisi pure re-export
// recruitment.ts (canon)
export const vacancies = pgTable(...);
export const candidates = pgTable(...);

// hr-questionnaire.ts (canon — interviews)
export const interviews = pgTable(...);
// Pure re-export — cycle yo'q:
export { vacancies, candidates } from "./recruitment";
```

---

### 2. `tsconfig.json` path aliaslarni `dist/cjs/` ga qaratish — `src/` ga TEGMASLIK

**Sabab:** Node.js runtime'da `.ts` faylni to'g'ridan-to'g'ri yuklay olmaydi. SWC compile-time'da tsconfig path'ni inline qiladi, shuning uchun `src/*` `.ts` ga ko'rsatsa, runtime'da `MODULE_NOT_FOUND`.

```json
{
  "paths": {
    "@workspace/db":   ["../../lib/db/dist/cjs/index"],
    "@workspace/db/*": ["../../lib/db/dist/cjs/*"]
  }
}
```

`.d.ts` ham `dist/cjs/` ichida bo'lganligi uchun typecheck ham PASS qiladi.

---

### 3. `.env` ni avtomat yuklash — `apps/api/package.json` ga

```json
{
  "scripts": {
    "dev:unsafe": "dotenv -e .env -- nest start --watch"
  }
}
```

Yoki `nest-cli.json` da `envFilePath` belgilang. Har safar `$env:DATABASE_URL=...` yozmaslik.

---

### 4. Linter (Cursor/Copilot) revert'larini to'sib qo'yish

`.cursorignore` yoki `.gitattributes`:

```
lib/db/src/schema/*.ts        linguist-vendored=true
apps/api/src/shared/db/*.ts   linguist-generated=true
apps/api/tsconfig.json        linguist-generated=true
```

Yoki har o'zgarishdan keyin commit qiling — committed fayllarni linter revert qilmaydi.

---

### 5. Agent foydalanadigan skriptlar BOR-yo'qligini AVVAL tekshirish

**Sabab:** Agent skriptning izohida "`--apply` mode" deb yozsa ham, real implementatsiya yo'q bo'lishi mumkin. Bunday holatda agent o'z apply skriptini yozadi va kodni buzadi (T2-B misol: regex-asoslangan JSX rewrite hookni utility funksiya ichiga inyect qildi).

Agent topshirishdan oldin:

```powershell
# Bash/AST/regex apply mode skriptini tekshirish
Get-Content _audit_out/tsx-hardcoded-extractor.mjs | Select-String "--apply"
# Agar faqat `Usage` qatorlarida bo'lsa — implementatsiya yo'q
```

---

## 🟠 P1 — Jarayon (workflow)

### 6. Har shim'dan keyin uch buyruq majburiy

```powershell
# 1. lib/db build
pnpm --filter @workspace/db run build

# 2. dist tozalash
Remove-Item -Recurse -Force apps\api\dist

# 3. Backend boot tekshirish
pnpm --filter @europrint/api run dev:unsafe
```

Agar ishlamasa — darhol revert, keyingi shim qilmang.

---

### 7. Parallel agentlar fayl OVERLAP qilmasin

```
❌ NOTO'G'RI: 10 agent parallel, har biri o'z faylida (lekin import'lar to'qnashadi)

✅ TO'G'RI: 1-3 agent parallel, fayl yo'llari OVERLAP qilmasin:
  - Agent A: faqat lms-*.ts
  - Agent B: faqat pos-*.ts
  - Agent C: faqat mm-*.ts
```

Yana: agentlar bir vaqtning o'zida bir locale faylga yozsa, JSON corruption bo'lishi mumkin. JSON write operatsiyasi atomik bo'lsin.

---

### 8. Har sessiya boshida git commit (checkpoint)

```bash
git add -A
git commit -m "checkpoint: before dedup wave N"
```

Agar sessiya buzilsa — `git reset --hard <checkpoint>` bilan tez tiklash.

---

### 9. `git stash` ishlatmaslik — atomic commitlar yarating

```
❌ NOTO'G'RI: 819 fayl stash → loyiha rasvo
✅ TO'G'RI: Har bosqichdan keyin commit, muammo bo'lsa o'sha bitta commit revert
```

---

### 10. Nest `--watch` Windows'da tree-kill bug — `start:fast` muqobil

**Sabab:** `nest start --watch` rejimida `treeKillSync` mavjud bo'lmagan PIDni o'chirishga urinib `Error: Command failed: taskkill /pid ... /T /F` bilan crash.

Production-yaqin testlar uchun:

```powershell
# Yoki foreground (Ctrl+C bilan boshqarish):
pnpm --filter @europrint/api run dev:unsafe

# Yoki build+node (barqaror, watch yo'q):
pnpm --filter @europrint/api run start:fast
```

Watch crash bo'lganda darhol restart qiling — qoldiq node process kuting (`Get-NetTCPConnection -LocalPort 3030 -State Listen`).

---

### 11. Browser PWA Service Worker cache — auth uchun NetworkOnly

**Sabab:** Login sahifa eski PWA cache'dan kelishi mumkin, lekin API o'zgargan bo'lsa. SW cache yangi tsc/build natijalarini ko'rmaydi.

`vite.config.ts` da auth endpointlar **NetworkOnly** bo'lishi shart:

```ts
runtimeCaching: [
  { urlPattern: /\/api\/auth\//, handler: "NetworkOnly" },
]
```

Browser'da test qilishdan oldin:
1. DevTools → Application → Service Workers → **Unregister**
2. Storage → **Clear site data**
3. Ctrl+Shift+R

---

## 🟡 P2 — Texnik guardrails

### 12. CI yoki pre-commit hook qo'shish

`.husky/pre-commit`:

```sh
#!/bin/sh
pnpm --filter @workspace/db run build || exit 1
pnpm --filter @europrint/api exec tsc --noEmit || exit 1
# Cyclic dep tekshirish
pnpm dlx madge --circular lib/db/src/schema/ || exit 1
```

Har commit'da:
- `lib/db` build PASS bo'lishi shart
- TypeScript 0 error
- Cyclic dependency YO'Q

---

### 13. Drizzle schema fayllar uchun ESLint rule

`.eslintrc`:

```json
{
  "rules": {
    "import/no-cycle": ["error", { "maxDepth": 5 }]
  },
  "overrides": [
    {
      "files": ["lib/db/src/schema/**/*.ts"],
      "rules": {
        "no-restricted-syntax": [
          "error",
          {
            "selector": "ImportDeclaration[source.value=/^\\./]",
            "message": "Schema fayllarda bir-biriga import qilmang — faqat utility import"
          }
        ]
      }
    }
  ]
}
```

---

### 14. Backend smoke test sessiya yakunida

Har sessiya oxirida:

```powershell
# 1. lib/db build
pnpm --filter @workspace/db run build

# 2. Backend boot (60s kutish)
pnpm --filter @europrint/api run dev:unsafe

# 3. Probe
curl http://localhost:3030/             # 200 yoki 401, 404/000 EMAS
curl -X POST http://localhost:3030/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin123!"}'  # 200 + JWT
```

Agar `000` (timeout) yoki `500` (crash) — sessiya yopilmasin.

---

### 15. Audit script'ini agentdan oldin ishlatish

Har sessiya boshida `_audit_out/master-dup-scan.mjs` (yoki shu kabi) skriptini run qiling. Faqat **REAL DUPLIKAT** kategoriyasiga tegish.

| Tur | Kategoriya | Tegish? |
|---|---|---|
| 🟢 REAL DUPLIKAT | Bir xil schema, bir maqsad | ✅ |
| ⚪ DORMANT (callers=0) | Hech kim ishlatmaydi | ✅ |
| 🟠 HOMONYM | Bir nom, turli ma'lumot | ❌ |
| 🔵 DRIFT | snake_case vs camelCase | ❌ (manual sprint) |
| 🔴 PARALLEL | uuid vs serial | ❌ (architectural) |
| ⚙️ LEGITIMATE | DDD/CQRS/konstant | ❌ |

Faqat 🟢 va ⚪ ga avtomat shim qilish — boshqalari uzoq manual sprint.

---

## 📋 Qisqa yig'ma

| # | Qoida | Sabab |
|---|---|---|
| 1 | Cyclic shim YO'Q | `createInsertSchema(undefined)` crash |
| 2 | tsconfig `dist/cjs/` | runtime `.ts` yuklay olmaydi |
| 3 | `.env` avtomat yuklash | qo'lda env yozmaslik |
| 4 | Linter revert oldini olish | committed → linter tegmaydi |
| 5 | Skript `--apply` mavjudligini tekshirish | agent buzilgan skript yozadi |
| 6 | Har shim'dan keyin: build + tozalash + boot | erta xato topish |
| 7 | Agentlar overlap qilmasin | parallel konflikt + JSON corruption |
| 8 | Har sessiya boshida commit | checkpoint |
| 9 | `git stash` o'rniga commit | tiklash oson |
| 10 | Nest watch tree-kill → `start:fast` | Windows-specific bug |
| 11 | PWA SW `/api/auth/` NetworkOnly | login eski cache'dan kelmasin |
| 12 | Pre-commit hook | CI darajasida himoya |
| 13 | ESLint `no-cycle` rule | schema cycle taqiqlash |
| 14 | Backend smoke test | sessiya yopishdan oldin |
| 15 | Faqat 🟢 REAL DUPLIKAT'ga tegish | LEGITIMATE'ni tegmaslik |

---

## 🎯 3 ta oltin qoida

1. **Har o'zgarishdan keyin backend boot tekshirish** — eng kichik xato 10 fayldan keyin topish o'rniga, hozir topish
2. **`git commit` har bosqichda** — `git stash` ishlatmaslik
3. **Cyclic shim YASHAMAYDI** — faqat bir tomonli re-export

---

*Sana: yangilangan ish jarayonida | Manba: ko'p sessiya tajribasi*
