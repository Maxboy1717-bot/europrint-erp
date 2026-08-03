# ШВБ (Школа Владельца Бизнеса 2020) ↔ EuroPrint ERP — POYDEVOR solishtiruvi

> 2026-06-07 · 🔵 READ-ONLY analyst (5 parallel Explore, jonli kod+DB tekshiruvi). Hech narsa o'zgartirilmadi.
> Manba: SHvB-40-Yonalish-Prompt.md (40 yo'nalish). Maqsad: nimasi BOR / QISMAN / YO'Q — **o'chirish yo'q, faqat qo'shish/tugatish.**

## XULOSA (40 yo'nalish, 39 funksional + 1 test)
- ✅ **BOR (real, ishlaydi):** ~18 (46%)
- 🟡 **QISMAN (tugatish kerak):** ~17 (44%)
- ❌ **YO'Q (to'liq qo'shiladi):** ~4 (10%)
- ⭐ **Poydevor allaqachon ~46% qurilgan.** O'chiriladigan narsa YO'Q.

---

## 1. FINANCE (yo'nalish 1-6)
| # | ШВБ | Holat | Dalil / nima yetishmaydi |
|---|---|---|---|
| 1 | ЗВС (haftalik budjet arizasi) | 🟡 | Backend BOR (director/zvs.controller+service+repo, 3-darajali approval+SoD); **zvs jadval YO'Q + FE YO'Q** |
| 2 | ЗНО (majburiyat/to'lov arizasi) | 🟡 | Backend BOR (director/zno.*); **zno jadval YO'Q + FE YO'Q** |
| 3 | 4-hisob (MAIN/TAX/HEAD/WORKING) | 🟡 | Umumiy GL bor (fi-gl accounts), lekin 4 maxsus hisob ajratilmagan |
| 4 | Haftalik ФП-tsikl cron | ✅ | `cron/fp-cycle.cron.ts` — 4 cron (Se/Ch/Pa/Du, Telegram) |
| 5 | To'lanmagan schyotlar (aging) | ✅ | finance-ap aging buckets + `debitorlar` + kunlik alert |
| 6 | Tasdiqlash matritsasi | 🟡 | `approval_matrix_config` jadval BOR, lekin ЗВС hardcode ishlatadi (ulanmagan) |

## 2. COORDINATION (yo'nalish 7-10, 22, 31)
| # | ШВБ | Holat | Dalil / nima yetishmaydi |
|---|---|---|---|
| 7 | 5 Kengash (Coordination) | 🟡 | FE+locale 5 kengash bor; **`councils` jadval YO'Q** (hardcode) → *DDL intervyuда HA dedingiz* |
| 8 | Доклад | ✅ | To'liq CRUD + `dokla` jadval + status oqimi |
| 9 | Распоряжение | ✅ | To'liq CRUD + `rasporyazhenie` + deadline/done tracking |
| 10 | Majlis protokol | ❌ | Faqat locale yorliq — jadval/endpoint/PDF YO'Q |
| 22 | Рек.Совет sessiya | 🟡 | Metadata bor, sessiya hayot-tsikli (qaror log) YO'Q |
| 31 | Приказы (rasmiy buyruq) | ✅ | `orders_registry` + 5 kategoriya (85%); effective-date/arxiv/imzo yetmaydi |

## 3. HR / GSD / KARTA (yo'nalish 11-12, 16-18, 21, 24, 29-30, 36)
| # | ШВБ | Holat | Dalil / nima yetishmaydi |
|---|---|---|---|
| 11 | ⭐ GSD/ЦКП (lavozimga statistik) | 🟡 | KPI formula bor; **lavozimga GSD ta'rifi (formula/maqsad/birlik) jadvali YO'Q**, haftalik tarix YO'Q |
| 12 | Haftalik GSD hisobot | 🟡 | KPI bor; bo'lim-xulosa + leaderboard + dushanba digest YO'Q |
| 16 | ⭐ Lavozim papkasi (Должн. Папка) | ✅ | `position-folder.service` + Portret kartochka BOR; 6 nomli bo'lim + to'liqlik% yetmaydi |
| 17 | Onboarding (90 kun) | ✅ | 90-kun + mentor + checkpoint (adaptation_records) |
| 18 | Haftalik reja | ✅ | `weekly_plans` (gsd_target+5 vazifa+omillar+approve); haqiqiy natija tracking yetmaydi |
| 21 | ⭐ 7-Otdelenie tuzilma | 🟡 | Org-tree + `vysotskiyFunction` bor; **otdelenie_number(1-7) + gsd_metric YO'Q** |
| 24 | HR-KPI (haftalik) | 🟡 | KPI bor, tarqoq; yagona haftalik HR endpoint YO'Q |
| 29 | Inspektor-menejer | ✅ | Xona inspeksiya + AI ball + anomaliya; rasmiy buzilish/tuzatish jadvali yetmaydi |
| 30 | Yillik anketa | ✅ | eNPS + questionnaire + bo'lim ball; "yillik" qulf yetmaydi |
| 36 | ⭐ Reyting + bonus | 🟡 | KPI reyting + `bonus_payments` bor; A/B/C toifa + payroll-ulanish to'liq emas |

## 4. DIRECTOR / STRATEGIYA (yo'nalish 13-15, 23, 32-33)
| # | ШВБ | Holat | Dalil / nima yetishmaydi |
|---|---|---|---|
| 13 | ⭐ Holat formulasi | ✅ | `company-state.service` calcStateKey (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ); kunlik cron + tarix yetmaydi |
| 14 | Bajarish kundaligi (Дневник) | 🟡 | weekly-plan bor; kunlik holat+muammo+yechim+ertangi-reja YO'Q |
| 15 | Ideal kartina | ✅ | `ideal-rasm.service` + `ideal_rasm_targets` (achievement%); gap-tahlil/versiya yetmaydi |
| 23 | Statistika reglamenti | ❌ | **TO'LIQ YO'Q** — admin'da stat-regulation jadval/CRUD/versiya yo'q |
| 32 | Strategik reja (OKR) | ✅ | `okr.service` + okr_objectives/key_results (to'liq CRUD) |
| 33 | Taktik reja (oylik) | 🟡 | strategic_tasks/milestones bor; oylik→haftalik dekompozitsiya YO'Q |

## 5. KANBAN / LMS / OPS / AI (yo'nalish 19-20, 25-28, 34-35, 37-39)
| # | ШВБ | Holat | Dalil / nima yetishmaydi |
|---|---|---|---|
| 19 | 3-Savat tizimi | ✅ | `cc-baskets` + `cc-sla.cron` (24h/48h) + cc_documents — TO'LIQ |
| 20 | Persональная программа | 🟡 | Haftalik bor; kunlik soatlik + rollover YO'Q |
| 25 | Marketing KPI | 🟡 | Jadvallar bor; haftalik rollup/snapshot YO'Q |
| 26 | Sales KPI | 🟡 | Jadvallar bor; haftalik rollup YO'Q |
| 27 | LMS lavozim kurslari | ✅ | `position_required_courses` (is_mandatory, blocks_mes); ishga-olishда avto-tayinlash yetmaydi |
| 28 | LMS reglament testlari | ❌ | regulation_id YO'Q; 7-kun deadline/qayta-test YO'Q |
| 34 | Kaizen | ✅ | `kaizen_suggestions` to'liq CRUD; rasmiy PDCA yetmaydi |
| 35 | WMS inventar sog'lig'i | 🟡 | `low_stock_alerts`+reorder bor; aniqlik% + kunlik hisobot YO'Q |
| 37 | ⭐ IoT ishlab-chiqarish | ✅ | `downtime_events`+`iot_sensors`+OEE+anomaliya (→ DDL "downtime" shu yerga ulanadi) |
| 38 | Telegram ШВБ bot | ❌ | Umumiy telegram bor; /zvs_status,/my_gsd,/company_state,/weekly_digest YO'Q |
| 39 | AI tahlil | ✅ | director/finance/hr-ai (explainKpi/forecastCashflow); maxsus nomli metodlar yetmaydi |

---

## QO'SHISH MUMKIN (o'chirish YO'Q)

### A. ❌ To'liq yangi (4 ta):
1. **Majlis protokoli** (yo'n.10) — kengash bayonnomalari + PDF.
2. **Statistika reglamenti** (yo'n.23) — GSD ta'riflari markaziy ro'yxati + versiya.
3. **LMS reglament testlari** (yo'n.28) — reglamentga bog'liq test + 7-kun.
4. **Telegram ШВБ bot komandalar** (yo'n.38) — /zvs_status, /my_gsd, /company_state, /weekly_digest.

### B. 🟡 Tugatish (eng muhimlari — KARTA-MODEL poydevori ⭐):
- **GSD/ЦКП lavozimga** (11) + **7-Otdelenie tagging** (21) + **Lavozim papkasi 6-bo'lim** (16) + **Reyting+bonus A/B/C+payroll** (36) — **bular aynan sizning karta-modelingiz.**
- ЗВС/ЗНО jadval+FE (1,2) · 4-hisob (3) · approval-matrix ulash (6) · councils jadval (7 — DDL'da HA) · Рек.Совет sessiya (22) · haftalik GSD hisobot+digest (12) · execution-diary kunlik (14) · taktik oylik→haftalik (33) · marketing/sales KPI rollup (25,26) · WMS aniqlik% (35) · personal-program kunlik (20).

## DDL intervyu bilan bog'liqlik
- `councils` (7), `downtime` (37 — mavjudga ulanadi), `zno`/`zvs` (1,2 — backend bor, jadval+CC-ariza) — **ШВБ va DDL qarorlari bir xil poydevor.**

## TAVSIYA (ketma-ketlik)
1. Karta-model poydevori (11,21,16,36) — bular sizning asosiy vizyoningiz.
2. Moliya-koordinatsiya tugatish (1,2,6,7,22 + protokol 10).
3. Boshqaruv (12,14,23,33) + LMS (27 auto, 28).
4. Ops/AI (25,26,35,20,38,39).
