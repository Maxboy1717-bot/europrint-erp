# IoT-tablet + MES — JORIY HOLAT xaritasi (2026-06-08)

> Read-only Explore agent natijasi. IoT/MES build-spec uchun asos. Maqsad: floor koordinatsiya
> javoblari (COR-086..133, HR-057/079/082) MAVJUD tablet ustiga quriladi — qaytadan emas.

## 1. Operator IoT-tableti — MAVJUD (DB-backed)
FE: `artifacts/erp-dashboard/src/pages/IoTTablet.tsx` + `src/pages/iot/*` (login/schedule/checklist/dashboard/completion).
Hook: `useIoTTablet.ts` (+core/data/alerts/auth/formatters).

Operator oqimi (hammasi REAL ishlaydi):
1. Login (tabel № + parol → 8h JWT)
2. Jihoz + buyurtma tanlash → sessiya yaratish
3. Material-kit skan chek-list + ekipaj biriktirish (master/polmaster/shogird/rokler)
4. Faol sessiya dashboard (timer, setup vaqti, smena countdown, QC eslatma, energiya-tejash)
5. SOS tugma (sessiyasiz ham, `@Public`)
6. Brak qayd (miqdor + sabab kodi)
7. Downtime qayd (daqiqa + sabab)
8. Inline QC (namuna + nuqson soni)
9. Smena handover (raqamli imzo)
10. Sessiyani to'xtatish → completion report

Asosiy endpointlar: `/api/iot/tablet/login`, `/api/iot/production-sessions` (+`/start` `/stop` `/defect` `/inline-qc` `/crew`), `/api/iot/downtime-events`, `/api/iot/material-kit-items/:id/scan`, `/api/iot/tablet/handover`, `/api/iot/tablet/sos-alert`.

## 2. MES backend — MAVJUD
`apps/api/src/modules/mes/` — controllers: mes-sessions, mes-production-sessions, mes-operations, mes-maintenance, mes-shifts-stats, mes.gateway (WS OEE).
Sessiya lifecycle (domain aggregate): READY → passChecklist() → CHECKLIST_PENDING → start() → RUNNING ↔ pause/resume → complete() → COMPLETED → moveToQc() → SENT_TO_QC.
Eventlar: MES_SESSION_STARTED, DOWNTIME_RECORDED, MES_COMPLETED, MES_TO_HR_360, MES_SENT_TO_QC.
CQRS: start-session (LMS sertifikat hard-block), complete-session (→ QC pickup + HR 360°), record/end-downtime.

## 3. DB jadvallar (hammasi 0 qator — hali ishlatilmagan)
production_sessions(34) ╳ mes_sessions(13) ╳ mes_production_sessions(32) — **3 parallel jadval**;
downtime_events(17), sos_alerts, inline_qc_checks, material_kits/items, shift_handovers, shift_evaluations, machine_crews, mes_papka_orders(50), mes_telemetry...

## 4. pos-monitor ≠ IoT-tablet
pos-monitor = zavod OMBOR tableti (stok kirim/chiqim, barcode, P2P). IoT-tablet = ishlab chiqarish OPERATOR tableti. Umumiy kod/jadval YO'Q (faqat material-movement ikkalasida).

## 5. GAP (build'da hal qilinadi)
| Gap | Og'irlik | Tafsilot |
|---|---|---|
| Ikki sessiya jadvali bo'linishi | YUQORI | IoT→`production_sessions`, MES→`mes_sessions` — sinxron emas; dashboard IoT sessiyasini ko'rmaydi. Kanonik tanlash kerak. |
| TB-xavfsizlik / smena-tayyorlik chek-list YO'Q | O'RTA | `passChecklist()` domain bor, lekin standalone xavfsizlik chek-list endpoint/forma yo'q. **COR-130 + HR-079 = shuni qo'shish.** |
| Operator roli guard'da bloklangan | O'RTA | `IOT_READ` ro'yxatida `operator` yo'q → operator JWT o'z endpointlarini chaqira olmaydi. Tuzatish kerak. |
| MesCompletedEvent → QC/HR handler topilmadi | O'RTA | Event chiqadi, lekin @EventsHandler tasdiqlanmagan (EventBridge tekshirilsin). |
| machine_crews POST yo'q | PAST | FE `POST .../crew` yuboradi, BE'da yo'q (404 jim). |
| OEE GetOeeHandler stub (DI'siz) | PAST | `new GetOeeHandler()` to'g'ridan — hisob shubhali. |

## Xulosa (build uchun)
Floor IoT/MES ~70% qurilgan. Build = (1) kanonik sessiya jadvali, (2) TB/smena-tayyorlik chek-list qo'shish (079/130), (3) operator-rol guard fix, (4) event handlerlarni ulash, (5) OEE realligi, (6) AI-rejalashtirish (COR AI-printsip) ulash. Qaytadan qurish EMAS — kengaytirish.
