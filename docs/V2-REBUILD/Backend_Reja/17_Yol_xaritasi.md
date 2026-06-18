# 17 — YO'L XARITASI (Sprint reja)

> EuroPrint v2 qurilish tartibi: bosqich → davomiylik → bog'liqlik.
> Manbalar: [Backend_Reja/00_Indeks.md](00_Indeks.md) + [01-ALL-PAGES-INVENTORY.md](../01-ALL-PAGES-INVENTORY.md).

---

## Umumiy tartib (pastdan yuqoriga)

```
BOSQICH 0: Poydevor (auth + org + CI)      → 1-2 hafta
BOSQICH 1: Org + HR (karta-markaz)         → 2-3 hafta
BOSQICH 2: SD (buyurtma + mijoz)           → 2-3 hafta
BOSQICH 3: PP (tech-karta + AI planner)    → 3-4 hafta  ← HOZIR (qisman)
BOSQICH 4: MES (ijro + smena)              → 2-3 hafta
BOSQICH 5: QC (sifat + AI kamera)         → 2 hafta
BOSQICH 6: WMS (ombor + POS)              → 2-3 hafta
BOSQICH 7: FIN (GL + kassa + e-faktura)   → 3-4 hafta
BOSQICH 8: CRM + Marketing               → 2-3 hafta
BOSQICH 9: AI/IoT (OEE + prognoz)        → 3 hafta
BOSQICH 10: Director (BI + Andon)         → 2 hafta
```

---

## Joriy holat (2026-06-18)

| Bosqich | Holat | Keyingi |
|---------|-------|---------|
| 0 Poydevor | 🔧 ~80% | audit log, RLS |
| 1 Org/HR | 🔧 ~60% | AI moslik, razryad auto |
| 2 SD | 🔧 ~65% | AI narx, CRM integ |
| 3 PP | 🔧 ~60% | AI 7-qadam, plan-fakt |
| 4 MES | 🔧 ~50% | IoT integ, AI anomaliya |
| 5 QC | 🔧 ~40% | AI kamera hook |
| 6 WMS | 🔧 ~55% | Lot kuzatuv |
| 7 FIN | 🔧 ~45% | e-faktura, real GL |
| 8 CRM | 🔧 ~35% | AI lead scoring |
| 9 AI/IoT | 🔲 ~20% | Hamma |
| 10 Dir | 🔧 ~30% | Andon WS |

---

## Oltin zanjir (prioritet)

SD → PP → MES → QC → WMS → FIN — bularni birinchi to'liq qilish.
`node scripts/golden-thread-chain-proof.cjs` — har sprint yakunida.

---

## Demo criteria (har bosqich yakuni)

Har bosqich:
1. ✅ Real DB round-trip (kiritish → ko'rish)
2. ✅ tsc 0 + test PASS
3. ✅ EP Design (EPPageHeader + token)
4. ✅ i18n 3 til
5. ✅ Golden thread (bosqich o'z qismida)
6. ✅ Egasi brauzerda ko'radi va tasdiqlaydi

---
*Versiya: 2026-06-18*
