# MUSLIMBEK — TO'LIQ BUILD REJASI (butun ERP, ketma-ket ijro) — 2026-06-08
> Egasi (Maxboy) tasdiqladi. Advisor (Claude) tuzdi. Bajaruvchi = Muslimbek.
> ⛔ **AGENT FLEET ISHLATILMAYDI** — Muslimbek BITTA bajaruvchi, ketma-ket, qadam-baqadam (Qoida 23).
> Read-only tahlil uchun subagent mumkin, lekin parallel massiv ijro YO'Q.

═══════════════════════════════════════════════════════════════
## 1. HOZIRGI HOLAT (tayyor narsalar)
- ✅ **Vizyon to'liq** (~92%) — 6 hujjat + 20 modul qarorlari (2146 Q&A) + 1000 chuqur savol-javob (hammasi egasi tasdig'i bilan).
- ✅ **Poydevor TOZA** (#01 bajarildi: drift/fake/dublikat, push `5da4f145`).
- ✅ **22 build-promt + 1000 implementatsiya-javob** tayyor (`docs/audit/`).
- ✅ **Qoidalar** (`LOYIHA-QOIDALARI` + `CLAUDE.md`).
- 🎯 **Maqsad:** butun ERP'ni qurish — modul-modul, ketma-ket, vizyonga aniq mos.

## 2. ⛔ IJRO QOIDALARI (eng muhim)
1. **BITTA bajaruvchi, ketma-ket** — bir vaqtda bitta modul, bitta faza. Agent fleet / parallel massiv ijro YO'Q.
2. **Har modul = bitta promt** (`MUSLIMBEK-PROMT-NN-*.md`) + o'sha modulning **50 implementatsiya-javobi** (`vision-1000-answers/` yoki master `VISION-1000-SAVOL-JAVOB`).
3. **Re-audit-first** — har modul FAZA 0 (read-only) bilan boshlanadi → egasiga ko'rsatadi → "davom".
4. **Har faza:** ruxsat (Q-28) → BE+FE parallel → verify (tsc 0 + DB-proof + FE round-trip) → DoD-7 → alohida commit → o'zbekcha hisobot → egasi "davom".
5. **DDL = egasi ruxsati** (Q-35, `APPROVED:` izoh). **Qayta qurish YO'Q** (tuzat+ula). **Regress YO'Q** (Q-39).
6. **Honest 501** (fake emas). **git add aniq-fayl** (add -A yo'q). **JWT mint yo'q**. Server 000 → Q-44 (restart).
7. **Manba ustun:** har implementatsiya qarori — `VISION-1000-SAVOL-JAVOB` (o'sha modul savol-javobi) + `OCHIQ-JAVOBLAR` override. Noaniq → egasidan so'ra.

═══════════════════════════════════════════════════════════════
## 3. BUILD KETMA-KETLIGI (tartib bilan)

### BOSQICH 0 — POYDEVOR ✅ BAJARILDI
`#01` drift/fake/dublikat tozalash. → Poydevor toza.

### BOSQICH 1 — T1 POYDEVOR MODUL + OLTIN IP SPINE
| Tartib | Promt | Faza | Asosiy natija |
|---|---|---|---|
| 1 | **#02 ORG/KARTALAR** | 0+7 | Karta-model (atomik, razryad, GSD, 8-tab, oylik→profil) — hamma modul shunga ulanadi |
| 2 | **#03 OLTIN IP** | 0+7 | Bitta buyurtma SD→PP→MES→QC→WMS→FIN jonli (event-driven, acceptance-test) |

### BOSQICH 2 — T1 YADRO MODULLAR (chuqur build)
| Tartib | Promt | Faza | Asosiy natija |
|---|---|---|---|
| 3 | **#04 SD** | 7 | Sotuv: buyurtma (products), avans 70%, kredit-limit, voronka |
| 4 | **#05 PP** | 6 | AI-planning 7-qadam, MPS, gofra-formula, marshrut |
| 5 | **#06 MES** | 6 | IoT-tablet, sessiya, brak/downtime, OEE, routing |
| 6 | **#07 QC** | 6 | Bosqichli nazorat, AQL, brak→mas'ul, karantin, sertifikat |
| 7 | **#08 WMS** | 7 | Ombor taksonomiyasi (7+QC+IChQ), rulon, hom-ashyo overflow |
| 8 | **#09 MM** | 6 | Ta'minot: vendor-reyting, PO, tender, landed-cost |
| 9 | **#10 FIN** | 5 | GL (entries), ZVS/ZNO, **KASSIR**, byudjet, aging, FP-tsikl |

### BOSQICH 3 — T2 BOSHQARUV / NAZORAT
| Tartib | Promt | Faza | Asosiy natija |
|---|---|---|---|
| 10 | **#11 HR** | 7 | Reyting 7-faktor, AI-rekruter, oylik, jarima, davomat |
| 11 | **#12 DIR** | 7 | Holat formula (5-ko'rsatkich/5-daraja), kunlik, OKR, strategik-AI |
| 12 | **#13 COR** | 6 | Kengash (org-chart), доклад/приказ, floor-koordinatsiya |
| 13 | **#14 LMS** | 7 | Darslik→karta→oylik-gate, imtihon, murabbiy |
| 14 | **#15 AI** | 6 | Markaziy-AI, per-karta AI, kamera kross-check, prognoz |
| 15 | **#16 CC** | 6 | 3-savat, 14 hujjat turi, vertikal+gorizontal, immutable+PIN |

### BOSQICH 4 — T3 QO'LLAB-QUVVATLOVCHI
| Tartib | Promt | Faza | Asosiy natija |
|---|---|---|---|
| 16 | **#17 CRM** | 6 | 360, field-tashrif, AI, segment |
| 17 | **#18 MKT** | 6 | 8-kanal, ROI, egaga 5-raqam, lid-gen |
| 18 | **#19 KAN** | 5 | Org-scoped, topshiruvchi-tasdiq, 4-ustun |
| 19 | **#20 IOT** | 7 | Sensor (passiv→VLM kamera), Andon, energiya→tannarx |
| 20 | **#21 NTF** | 6 | Per-modul Telegram bot, org-marshrut, tinchlik-vaqti |
| 21 | **#22 POS** | 6 | Zavod ombor tablet (qayta-loyiha), pres-kirim, AI-nazorat |

**JAMI: ~130 build-faza, 21 modul (ketma-ket).**

═══════════════════════════════════════════════════════════════
## 4. HAR MODUL UCHUN TAKRORLANUVCHI JARAYON (loop)
Har modul promtiga kelganда Muslimbek shu 6 qadamni bajaradi:
1. **O'qi:** `MUSLIMBEK-PROMT-NN-*.md` (build-spec) + `VISION-1000-SAVOL-JAVOB` (o'sha modul 50 javobi — implementatsiya tafsiloti) + `decisions/NN` + `OCHIQ-JAVOBLAR` (o'sha modul).
2. **FAZA 0 — RE-AUDIT** (read-only): mavjudni xaritalab → `docs/<MODUL>-RE-AUDIT.md` → **egasiga ko'rsat → "davom"**.
3. **FAZA-FAZA build:** har faza → ruxsat → BE+FE → verify → DoD-7 → commit → o'zbekcha hisobot → egasi "davom".
4. **DDL** chiqsa → taklif → egasi `APPROVED:` → bajar.
5. **Modul tugadi** = DoD-7 to'liq + tsc 0 + pre-commit PASS + server 200 + EP-kod loglar.
6. **Advisorга qaytar** → keyingi modul promti.

═══════════════════════════════════════════════════════════════
## 5. QABUL MEZONI (butun loyiha "bitgan")
- ✅ Oltin ip: bitta real buyurtma SD→...→FIN/GL jonli (acceptance-test yashil).
- ✅ Har modul DoD-7 (real BE+FE, doc, test, UZ/RU, edge-case, avtomatlashtirish).
- ✅ 6 kesishuvchi printsip amal qiladi (AI→inson-tasdiq, karta-markaz, AI-reja, IoT-tablet, org-marshrut, bitta-haqiqat).
- ✅ RBAC (kartadan) + shifrlash + 2-server zaxira + audit-log.
- ✅ Dizayn EP Linear Soft (rang+dark tuzatilgan), token+shablon izchil.
- ✅ Har operatsiya EP-kod loglaydi.

═══════════════════════════════════════════════════════════════
## 6. MANBA HUJJATLAR (single source — Q-25)
`docs/audit/`:
- **Build-promtlar:** `MUSLIMBEK-PROMT-01..22-*.md` + `MUSLIMBEK-PROMT-INDEX`
- **Vizyon:** `MASTER-SAVOL-JAVOB` · `OCHIQ-JAVOBLAR` · `OMBOR-KASSIR-INTERVYU` · `CHAT-TARIXI-YANGI` · `IOT-MES-CURRENT-STATE`
- **Implementatsiya:** `VISION-1000-SAVOL-JAVOB` (1000 chuqur javob) + `vision-1000-answers/`
- **Qoidalar:** `LOYIHA-QOIDALARI` + `CLAUDE.md` + `agent-constitution.md`
- **Asos:** `LOYIHA-BITGAN-XOLAT` · `ERP-SIFAT-STANDARTLARI` · `ZIDDIYATLAR-HAL` · `decisions/01-20`

═══════════════════════════════════════════════════════════════
## 7. CADENCE (sur'at)
- Har modul: FAZA 0 (1 ko'rsatish) + N faza (har biri 1 hisobot) → egasi tasdig'i bilan oldinga.
- Tartib qat'iy: **#02 → #03 → #04 → ... → #22** (poydevor→yadro→T2→T3).
- Egasi istalgan paytda to'xtatib/o'zgartirib oladi. Hech qachon: parallel massiv ijro, ruxsatsiz DDL, qayta qurish, fake.

> 🚀 **Boshlash:** `MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` ni Muslimbekka ber → u FAZA 0 (re-audit)dan boshlaydi.
