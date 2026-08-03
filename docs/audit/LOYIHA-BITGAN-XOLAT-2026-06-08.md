# LOYIHA "BITGAN" XOLAT + RAQAMLASH TIZIMI + MODUL OG'IRLIGI

> Egasi 2026-06-08: "qurishga shoshilmaymiz — avval loyiha bitgan xolatini yozish, har narsani raqamlab,
> kod logiga shu raqam tushishi, raqamga qarab harakat turini aniqlash; modullar teng emas."
> Bu — **qurishdan OLDIN** kelishiladigan asos. Manba: kitob + ShVB arxiv + 460 javob + karta-model.

---

## A. LOYIHA "BITGAN" XOLAT (Definition of Finished — butun loyiha)

Loyiha **faqat shu hammasi bajarilsa** "bitgan" hisoblanadi:

1. **Karta-model poydevor:** har lavozim = KARTA (master-data); xodim kartaga bog'lanadi; oylik/ruxsat/hisobot kartadan; razryad/GSD/papka/7-otdeleniye/markaziy-AI ishlaydi.
2. **Oltin ip to'liq:** buyurtma → reja → ishlab chiqarish → QC → ombor → moliya/GL → yetkazish — uzilishsiz, DB-proof.
3. **ShVB jarayonlari avtomatlashgan:** ЗВС/ЗНО, 5 kengash + Доклад/Распоряжение/протокол/приказ, GSD/ЦКП, holat-formulasi, 3-savat, ideal-kartina, kaizen — hammasi ERP'da.
4. **460 javob bajarilgan:** AI 80% rekruterlik (Gemini LIVE), AI kamera (davomat+kayfiyat+sog'liq+ideal-xona), avto kunlik hisobot (mashina→PDF), 3-kun→blok, hujjat org-sxema avto-marshrut (vert+goriz), avto jarima, immutable hujjat.
5. **Kuchli nazorat:** RBAC eng kuchli (kartadan, maydon darajasi), hamma data shifrlangan, real-time zaxira (2-server), modullararo sinxron, to'liq audit-log.
6. **Mahsulot sifati:** 30% kiritish / 70% tahlil+AI; kuchli + oson + adolatli.
7. **Har modul DoD:** real BE+FE (parallel), doc, test, tarjima (UZ/RU), hamma edge-case, avtomatlashtirish — `ERP-SIFAT-STANDARTLARI` 7 shart.
8. **Dizayn:** EP Linear Soft (rang+dark tuzatilgan), izchil token+shablon.
9. **Har feature raqamlangan va loglanadi** (B-bo'lim) — to'liq kuzatuv.

> "Bitgan" = bu 9 banddan har biri har modulда tasdiqlangan (verify, DB-proof, jonli).

---

## B. RAQAMLASH TIZIMI (Operation Code Registry — kuzatuv)

**Maqsad (egasi):** har yaratilgan narsa raqamli; kod logiga raqam tushadi; raqamga qarab — qaysi modul, qaysi operatsiya, qaysi harakat turi — darrov ma'lum.

### B.1 Format
```
EP-<MODUL>-<###>        ← har OPERATSIYA / FEATURE uchun unikal kod
```
- `<MODUL>` = 2-3 harfli modul kodi (pastda).
- `<###>` = modul ichidagi ketma-ket raqam (001, 002, ...).
- Misol: `EP-ORG-014` = Org moduli, 14-operatsiya.

### B.2 Modul kodlari
| Modul | Kod | Modul | Kod |
|---|---|---|---|
| Org/KARTALAR | **ORG** | MM/Ta'minot | **MM** |
| HR | **HR** | LMS | **LMS** |
| Finance/GL | **FIN** | CRM | **CRM** |
| Coordination | **COR** | Marketing | **MKT** |
| Director | **DIR** | Kanban | **KAN** |
| SD/Sotuv | **SD** | IoT | **IOT** |
| PP/Reja | **PP** | AI | **AI** |
| MES | **MES** | Bildirishnoma | **NTF** |
| QC | **QC** | POS | **POS** |
| Ombor/WMS | **WMS** | Comm.Center | **CC** |

### B.3 Harakat turi (action) — registry'da
Har kod registry'da quyidagicha yoziladi:
```
EP-ORG-014 | action=CREATE | op=card.create        | "Yangi karta yaratish"
EP-ORG-015 | action=UPDATE | op=card.assignEmployee | "Kartaga xodim biriktirish"
EP-FIN-003 | action=APPROVE| op=zvs.approve         | "ZVS tasdiqlash"
EP-MES-007 | action=EVENT  | op=session.completed   | "Ishlab chiqarish sessiyasi tugadi"
EP-FIN-021 | action=CRON   | op=fp.cycle.reminder   | "FP-tsikl eslatma (cron)"
```
**action** turlari: `CREATE / READ / UPDATE / DELETE / APPROVE / REJECT / EVENT / CRON / AI / LOGIN / EXPORT`.
→ Raqam (kod) → registry → **modul + operatsiya + harakat turi** aniqlanadi.

### B.4 Log formati (kod loglarda)
Har backend operatsiyasi shu kodni loglaydi (structured):
```
level=info code=EP-ORG-014 actor=user:5 entity=card:23 result=ok dur=12ms
```
→ Log faylda `grep EP-ORG-014` = o'sha operatsiyaning hamma izi. Raqamга qarab harakat ma'lum.

### B.5 Yagona manba (registry)
- `docs/op-codes/REGISTRY.md` (insonga) + `apps/api/src/common/op-codes.ts` (kodga, TS const).
- Har feature/operatsiya shu yerga yoziladi; pre-commit kod registratsiyasini tekshiradi (loglagan kod registry'da bo'lishi shart).
- **2094 savol/feature** → har biri build paytida EP-kod oladi → kod → log → kuzatuv.

---

## C. MODUL OG'IRLIGI (teng emas — ish ko'lami shunga qarab)

Egasi: "orgsxema sahifasi 1 o'zi boshqa butun moduldan kuchli." Shuning uchun mehnat/chuqurlik **og'irlikка qarab**:

| Daraja | Modullar | Sabab | Ish ko'lami |
|---|---|---|---|
| **T1 — POYDEVOR (eng kuchli)** | ⭐ **ORG/KARTALAR** | Hamma modul shunga ulanadi; oylik/ruxsat/AI/GSD shundan | Eng katta, eng chuqur, eng avval |
| **T1 — OLTIN IP yadrosi** | SD, PP, MES, QC, WMS, FIN | Buyurtma→pul zanjiri; biznes yuragi | Katta, DB-proof, integratsiya |
| **T2 — BOSHQARUV/NAZORAT** | DIR, COR, HR, LMS, CC, AI | ShVB nazorat qatlami (holat/kengash/GSD/hujjat/markaziy-AI) | O'rta-katta |
| **T3 — QO'LLAB-QUVVATLOVCHI** | CRM, MKT, KAN, IOT, NTF, POS | Yordamchi/operatsion; ko'pi mavjud yoki sodda | O'rta-kichik |

**Qoida:** T1 modullar to'liq, chuqur, eng yuqori sifat bilan; T3'lar sodda/mavjudni tugatish. **ORG birinchi** — chunki qolgani unга bog'lanadi.

> Eslatma: bitta sahifaning og'irligi modulдан muhimroq bo'lishi mumkin (mas. OrgChart sahifasi). Build-spec sahifa darajasida ham og'irlikni belgilaydi.

---

## Keyingi qadam (qurishdan oldin)
1. Bu hujjatni egasi tasdiqlaydi (yoki tuzatadi).
2. Master-bank (2094) modul-modul ko'rib chiqiladi → javoblar (460 + A-default) → har feature **EP-kod** oladi.
3. T1 (ORG)dan boshlab build-spec → BE+FE parallel → DoD + EP-kod loglanadi.
