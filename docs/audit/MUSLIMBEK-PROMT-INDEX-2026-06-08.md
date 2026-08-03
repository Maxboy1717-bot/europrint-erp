# MUSLIMBEK BUILD PROMTLARI — INDEX (tartib bilan ijro) — 2026-06-08

> Butun ERP'ni qurish uchun ijrochi (Muslimbek) promtlari, **build tartibida**.
> Har promt: ingliz, batafsil, qoidalar bloki + FAZA 0 re-audit + bosqichli build + DoD + rails.
> ⛔ Har promt FAZA 0 (read-only re-audit) dan boshlanadi → egasiga ko'rsatadi → tasdiq → quradi.

## QANDAY ISHLATILADI
1. Navbatdagi promt faylini Muslimbekka bering (yoki: *"shu faylni o'qib bajar: `docs/audit/MUSLIMBEK-PROMT-NN-...md`"*).
2. U **FAZA 0 (re-audit)** qiladi → `docs/<MODUL>-RE-AUDIT-*.md` → **sizga ko'rsatadi** → siz "davom".
3. Faza-faza quradi (har faza: ruxsat → BE+FE → verify → commit → o'zbekcha hisobot → "davom" kutadi).
4. Modul "tayyor" (7-shart DoD) → keyingi promtga o'tasiz.

═══════════════════════════════════════════════════════════════
## TARTIB (ijro ketma-ketligi)

### 🧹 POYDEVOR
| # | Modul | Holat | Fayl |
|---|---|---|---|
| **01** | Poydevor tozalash (drift/fake/dublikat) | ✅ **BAJARILDI** | `MUSLIMBEK-PROMT-01*-2026-06-08.md` |

### 🏛️ T1 — POYDEVOR MODUL + OLTIN IP
| # | Modul | Faza | Fayl |
|---|---|---|---|
| **02** | ⭐ ORG / KARTALAR (poydevor modul) | 0+7 | `MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md` |
| **03** | ⭐ OLTIN IP (SD→PP→MES→QC→WMS→FIN integratsiya spine) | 0+7 | `MUSLIMBEK-PROMT-03-OLTIN-IP-2026-06-08.md` |

### ⚙️ T1 — YADRO MODULLAR (chuqur build)
| # | Modul | Faza | Fayl |
|---|---|---|---|
| **04** | SD / Sotuv | 7 | `MUSLIMBEK-PROMT-04-SD-2026-06-08.md` |
| **05** | PP / Rejalashtirish (AI 7-qadam) | 6 | `MUSLIMBEK-PROMT-05-PP-2026-06-08.md` |
| **06** | MES / Ishlab chiqarish (+IoT-tablet) | 6 | `MUSLIMBEK-PROMT-06-MES-2026-06-08.md` |
| **07** | QC / Sifat | 6 | `MUSLIMBEK-PROMT-07-QC-2026-06-08.md` |
| **08** | WMS / Ombor (taksonomiya + kassir) | 7 | `MUSLIMBEK-PROMT-08-WMS-2026-06-08.md` |
| **09** | MM / Ta'minot | 6 | `MUSLIMBEK-PROMT-09-MM-2026-06-08.md` |
| **10** | FIN / Moliya + KASSIR sub-modul | 5 | `MUSLIMBEK-PROMT-10-FIN-2026-06-08.md` |

### 🧭 T2 — BOSHQARUV / NAZORAT
| # | Modul | Faza | Fayl |
|---|---|---|---|
| **11** | HR / Xodimlar (reyting 7-faktor, AI-rekruter) | 7 | `MUSLIMBEK-PROMT-11-HR-2026-06-08.md` |
| **12** | Director / Strategiya (holat formula, 5-daraja) | 7 | `MUSLIMBEK-PROMT-12-DIR-2026-06-08.md` |
| **13** | Coordination / Kengash (org-chart) | 6 | `MUSLIMBEK-PROMT-13-COR-2026-06-08.md` |
| **14** | LMS / Ta'lim (darslik→karta→oylik-gate) | 7 | `MUSLIMBEK-PROMT-14-LMS-2026-06-08.md` |
| **15** | AI / Markaziy-AI (per-karta AI, kamera kross-check) | 6 | `MUSLIMBEK-PROMT-15-AI-2026-06-08.md` |
| **16** | CC / Communication Center (3-savat, 14 hujjat) | 6 | `MUSLIMBEK-PROMT-16-CC-2026-06-08.md` |

### 🔧 T3 — QO'LLAB-QUVVATLOVCHI
| # | Modul | Faza | Fayl |
|---|---|---|---|
| **17** | CRM (360, field-tashrif, AI) | 6 | `MUSLIMBEK-PROMT-17-CRM-2026-06-08.md` |
| **18** | Marketing (8-kanal, ROI, egaga 5-raqam) | 6 | `MUSLIMBEK-PROMT-18-MKT-2026-06-08.md` |
| **19** | Kanban / Vazifalar (org-scoped, topshiruvchi-tasdiq) | 5 | `MUSLIMBEK-PROMT-19-KAN-2026-06-08.md` |
| **20** | IoT / Sensor + AI-kamera (passiv→VLM) | 7 | `MUSLIMBEK-PROMT-20-IOT-2026-06-08.md` |
| **21** | Bildirishnoma / Telegram (per-modul bot) | 6 | `MUSLIMBEK-PROMT-21-NTF-2026-06-08.md` |
| **22** | POS Monitor (zavod ombor tablet, qayta-loyiha) | 6 | `MUSLIMBEK-PROMT-22-POS-2026-06-08.md` |

═══════════════════════════════════════════════════════════════
## JAMI
- **22 promt** (1 bajarildi + 21 tayyor) · **~130 build-faza** · barchasi `docs/audit/`да.
- Har promt manba: `decisions/NN-*.md` + `OCHIQ-JAVOBLAR` (override) + `LOYIHA-QOIDALARI` + 6 vizyon-hujjat.
- ⭐ Qoidalar: `LOYIHA-QOIDALARI-2026-06-08.md` + `CLAUDE.md` (har promt boshida).

## TAVSIYA (advisor)
- **Bittalab ber** — bir vaqtda bitta modul (Qoida 23: 1 bajaruvchi). #02 ORG → tugagach #03 → ...
- Har modul **FAZA 0 re-audit** dan boshlanadi (mavjudni xaritalaydi, qayta qurmaydi).
- Modul tugagach **DoD 7-shart** tekshiriladi, keyin keyingisi.
- T1 (poydevor+yadro) eng muhim/chuqur; T3 ko'pi mavjudni ulash.

> Boshlash: **#02 ORG** faylini Muslimbekka bering. 🚀
