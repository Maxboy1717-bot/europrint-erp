# 🔴 SERVER SALOMATLIK OGOHLANTIRISHI — 2026-06-08

## Holat: IKKALA server ham TUSHGAN

| Server | Port | HTTP kod | Holat |
|--------|------|----------|-------|
| Backend (NestJS) | 3030 | **000** | 🔴 Tushgan |
| Frontend (Vite) | 20806 | **000** | 🔴 Tushgan |

`netstat` natijasi: **na 3030, na 20806 da hech qanday LISTENING process yo'q** → ikkala process ham butunlay o'lgan (osilib qolgan emas).

## Diagnostika

- **DB:** ✅ SOG'LOM — `node _audit/q.cjs "SELECT 1"` → `{ ok: 1 }`. Postgres ishlayapti, sabab DB emas.
- **Typecheck:** ✅ TOZA — `pnpm --filter @europrint/api run typecheck` → 0 ta `error TS`. Kod buzuq EMAS.
- **Git:** Faqat `_audit/*.cjs` untracked yordamchi fayllar (read-only). Hech qanday o'zgartirilgan/buzuq manba fayl yo'q. Oxirgi commit: `27178a59 fix(marketing): exhibitions.id varchar→INT`.
- **Backend log (`apps/api/backend.log`) oxirgi xato signaturasi:**
  ```
  Error: Command failed: taskkill /pid 6888 /T /F
  «не удалось найти процесс 6888» (process topilmadi)
    at treeKillSync (...@nestjs/cli/lib/utils/tree-kill.js:7:38)
    at start.action.js:69:46
  ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL @europrint/api dev:unsafe: `nest start --watch`
  Exit status 1
  ```

## Eng ehtimoliy SABAB → **Q-44: Windows nest-watch tree-kill crash (MUHIT xatosi, KOD emas)**

Bu eng keng tarqalgan ma'lum muammo (1-sabab). Dalillar to'liq mos:
- Butun backend server o'lgan (:3030 = 000) — port listener yo'q
- Typecheck TOZA + DB ishlaydi → kod-bug emas
- Logda aniq `tree-kill` / `taskkill ... процесс topilmadi` xatosi — nest watch katta rebuilddan keyin eski process'ni o'ldirishga urinib, PID'ni topa olmay butun watcher'ni yiqitgan

Frontend (Vite) ham to'xtagan — odatda alohida hodisa (dev-server uzilishi), lekin uni ham qayta ko'tarish kerak.

⚠️ Bu **OPERATSION/MUHIT masalasi**, haqiqiy kod-bug EMAS. Restart yordam beradi.

## ⭐ EGASI NIMA QILSIN — restart buyruqlari

Loyiha papkasida (`C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`):

**1) Backend:**
```
pnpm --filter @europrint/api run dev:unsafe
```

**2) Frontend (alohida terminalda):**
```
pnpm --filter erp-dashboard run dev
```

Restartdan so'ng tekshirish:
```
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/api/auth/health   # 200 kutiladi
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:20806                   # 200/304 kutiladi
```

> Kod tuzatish KERAK EMAS — typecheck toza. Bu shunchaki Windows nest-watch (Q-44) uzilishi, faqat qayta ishga tushirish kifoya.

---
*Read-only watchdog tomonidan tuzildi. Hech narsa tuzatilmadi/restart qilinmadi/commit qilinmadi.*
