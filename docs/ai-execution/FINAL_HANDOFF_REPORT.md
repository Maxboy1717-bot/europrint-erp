# FINAL HANDOFF REPORT — EuroPrint ERP 3340-Prompt Ijro (P0 fazasi)

> **Sana:** 2026-06-30 | **Rejim:** avtonom loop (/loop dinamik) | **Manba:** EUROPRINT_ERP_VIZYON_3340_PROMPTLAR.jsonl

## 1. UMUMIY
3340 prompt = ~835 noyob muammo × ~4 variant (P0=608, P1=1532, P2=1200). **P0 fazasi katalog YAKUNLANDI** (636 prompt-yozuv, append-only latest-wins).

## 2. P0 NATIJA TAQSIMOTI
| Holat | ~Soni | Ma'no |
|---|---|---|
| **duplicate** | ~400 | Allaqachon qurilgan+ulangan (kod mavjud, ko'pincha boshqa nom bilan) |
| **blocked** | ~84 | Egasi-data kerak (mexanizm bor, qiymat yo'q) |
| **pending (arxitektura)** | ~10 issue | Katta arxitektura/accounting qarori — avtonom-build emas |
| **done** | bir nechta | Loop'da qurilgan (keyin ko'pi semantik-dedup'da dup chiqdi) |
| **superseded** | 8 | Layer-B Desktop JARVIS = alohida mahsulot |

## 3. ASOSIY XULOSA (halol)
⭐ **Kodbaza P0-promptlarga nisbatan ~to'liq qurilgan.** 3340-prompt to'plami **eski audit-snapshotdan** generatsiya qilingan; kod o'shandan beri ancha oldinga ketgan. "X MISSING" da'volarining aksariyati **STALE** — feature boshqa nom/jadval bilan mavjud:
- payroll ЦКП-gate → `CkpGateService.evaluatePeriod` (payroll.service.ts:452)
- AI kunlik ЦКП → `ai-daily-report.cron/service`
- MES/IoT→ЦКП → `ckp-mes-feed.listener`
- card-model → `users.card_id` + login card-gate (env-OFF) + card-payroll + `employee_cards`+UNIQUE
- RBAC → `rbacTier` (card-tier)
- LMS card-gate/auto-enroll/exam→razryad → mavjud
- status-log → `production_order_status_log`; plan/fact → `production_facts`; reason → `mes_downtime_reasons`; work_orders → `production_orders`
- AISHA-modul, OKR, holat-formula (5-ko'rsatkich), income-split, soft-delete — hammasi BOR

⚠️ **SEMANTIK-DEDUP MAJBURIY:** exact-nom bo'yicha "yo'q" deb xulosa qilish XATO. Men `pp_reason_codes` qurib, `mes_downtime_reasons` kanonik ekanini topgach REVERT qildim (uchinchi parallel jadval taqiqlanadi).

## 4. HAQIQIY QOLGAN ISH (avtonom-buildable EMAS — egasi/arxitektura kerak)
**A. Egasi-data (BLOCKERS_OWNER_DATA.md, B1-B8):** razryad qiymatlari + tskp_target + head_user_id + workflow_rules + karta-shablon + AI-kalit + ideal_rasm-targets + sensorlar + RBAC-tier + root-unifikatsiya. — Mexanizm+config tayyor; egasi qiymat berishi shart.

**B. Katta arxitektura/accounting (owner/arch qarori, yuqori-xavf — avtonom qilinmaydi):**
1. **Yagona org-daraxt** — 17 root → bitta ierarxiya (B8; qaysi root kanonik — egasi).
2. **Two-world MES** — `production_sessions` vs `mes_production_sessions` unifikatsiya.
3. **Outbox universal-wiring** — `domain_events`=0; outbox-infra bor lekin barcha biznes-tranzaksiyalarga ulanmagan (crash-safe golden-thread).
4. **POS-GL subledger→entries rollup** — POS `pos_gl_postings` subledger'ga yozadi; kanonik `entries`'ga rollup accounting-dizayni.
5. **Andon (katta tablo)** — FE-display + MES-agregatsiya.
6. **Multi-tenancy** — TenantMiddleware bor, amaliyot 0.

## 5. LOOP'DA QURILGAN (build)
Avvalgi sessiyada 11 slice (eskalatsiya cron×2, council_members, prikaz, protocol, notification_schedules+CRUD, QC kalibrovka, HR NDA+auto-issue, NPS auto, agent-alerts) — hammasi typecheck 0 + jonli tasdiq. Loop P0 fazasida `pp_reason_codes` qurildi→revert (dublikat — mes_downtime_reasons kanonik).

## 6. LOKAL HOLAT
Backend :3030 (200), frontend :20806, DB europrint@5432, Redis :6379 — ishlayapti. tsc 0.

## 7. TAVSIYA
Avtonom loop **P0 toza-buildable ishni tugatdi**. Keyingi haqiqiy progress uchun **egasi-data (A)** kerak — bu loop'ni ochadi (Bosqich 0). Arxitektura bandlari (B) egasi/jamoa qarori bilan, alohida rejalashtirilgan sprint'da qilinishi kerak (avtonom-tikda emas — moliya/core tizimga yuqori-xavf). P1/P2 (UI/dashboard/optimizatsiya) katalogi davom etishi mumkin, lekin naqsh bo'yicha ko'pi duplicate/FE-polish bo'ladi.
