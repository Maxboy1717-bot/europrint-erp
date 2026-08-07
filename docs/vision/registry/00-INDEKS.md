# EuroPrint ERP — Yagona Vizyon Registri · INDEKS

> **Nima bu:** loyihaning uchta parallel vizyon-hujjati birlashtirilib, har bir vizyon-bandiga
> **bugungi holat** biriktirilgan yagona reestr. 20 modul, **2146 ta EP-kodli band** + **225 ta
> EP-kodsiz bo'shliq (VR)** = **2371 band**.
>
> **Sana:** 2026-08-07 · **Branch:** `chore/schema-convergence`

---

## ⭐ Registrning asosiy g'oyasi — IKKITA holat-o'qi

Loyihaning eski hujjatlarida "qaror qabul qilindimi" va "qurildimi" doimo aralashtirilgan edi.
Registrda ular **hech qachon aralashmaydi**:

| O'q | Ma'nosi | Manba |
|---|---|---|
| **Qaror holati** | Egasi bu savolga javob berdimi? `✅ JAVOBLANGAN` / `🔵 OCHIQ` | `docs/audit/decisions/*.md` |
| **Qurilish holati** | Kodda haqiqatan bormi? `Ha` / `Qisman` / `Yo'q` / `STALE-DOC` | `FULL-ITEM-LEVEL` + **jonli tekshiruv** |

`STALE-DOC` = hujjat "yo'q" deydi, jonli kod esa "bor" — ya'ni **hujjat xato**, kod emas.

---

## Umumiy holat

### Qaror o'qi
| Holat | Son |
|---|---|
| ✅ JAVOBLANGAN | **1365** |
| 🔵 OCHIQ (egasi javobini kutmoqda) | **888** |

### Qurilish o'qi
| Holat | Son | Ulush |
|---|---|---|
| **Ha** — to'liq qurilgan | **261** | 11.6% |
| **Qisman** — asos bor, yakunlanmagan | **1067** | 47.5% |
| **Yo'q** — qurilmagan | **805** | 35.9% |
| **STALE-DOC** — hujjat xato, kod bor | **111** | 4.9% |

> ⚠️ **"11.6% qurilgan" degani "loyiha 11.6%" degani EMAS.** `Qisman` bandlarning katta qismida
> jadval, repo va endpoint tayyor — faqat ulanish yoki bitta shart yetishmaydi. `Ha + Qisman` =
> **1328 band (59%)** da kod bazasi mavjud.

### Boshqa ko'rsatkichlar
| Ko'rsatkich | Son |
|---|---|
| ⚠️ **ZIDDIYAT** — manbalar bir-biriga zid | **398** |
| **Δ 2026-07-11 → 08-07** — auditdan keyin o'zgargan bandlar | **553** |
| Bugungi (08-07) commitlar | **63** |

---

## Modul bo'yicha

| # | Modul | EP | VR | ✅ | 🔵 | Ha | Qisman | Yo'q | STALE | ZID | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | [Org-Kartalar](01-org-kartalar.md) | 143 | 0 | 89 | 54 | 30 | 73 | 22 | 8 | 30 | 35 |
| 02 | [HR](02-hr.md) | 82 | 0 | 73 | 9 | 17 | 50 | 15 | 0 | 8 | 36 |
| 03 | [Finance](03-finance.md) | 86 | 10 | 65 | 31 | 21 | 47 | 21 | 7 | 17 | 11 |
| 04 | [Coordination](04-coordination.md) | 135 | 33 | 106 | 62 | 3 | 70 | 79 | 15 | 39 | 12 |
| 05 | [Director](05-director.md) | 85 | 12 | 12 | 73 | 12 | 38 | 32 | 3 | 35 | 16 |
| 06 | [SD](06-sd.md) | 138 | 13 | 114 | 24 | 17 | 87 | 40 | 4 | 19 | 68 |
| 07 | [PP](07-pp.md) | 136 | 17 | 63 | 72 | 10 | 79 | 38 | 9 | 18 | 26 |
| 08 | [MES](08-mes.md) | 82 | 15 | 81 | 16 | 7 | 46 | 41 | 3 | 18 | 23 |
| 09 | [QC](09-qc.md) | 134 | 2 | 100 | 34 | 12 | 66 | 24 | 13 | 22 | 50 |
| 10 | [Ombor (WMS)](10-warehouse.md) | 134 | 2 | 76 | 59 | 14 | 46 | 21 | 7 | 30 | 27 |
| 11 | [MM](11-mm.md) | 140 | 10 | 75 | 65 | 3 | 86 | 52 | 9 | 17 | 45 |
| 12 | [LMS](12-lms.md) | 85 | 7 | 82 | 10 | 10 | 50 | 32 | 0 | 11 | 10 |
| 13 | [CRM](13-crm.md) | 85 | 50 | 73 | 12 | 11 | 41 | 77 | 6 | 19 | 25 |
| 14 | [Marketing](14-marketing.md) | 118 | 14 | 109 | 23 | 16 | 54 | 55 | 7 | 16 | 20 |
| 15 | [Kanban](15-kanban.md) | 137 | 6 | 10 | 133 | 10 | 59 | 71 | 3 | 20 | 56 |
| 16 | [IoT](16-iot.md) | 83 | 6 | 37 | 46 | 0 | 33 | 44 | 0 | 9 | 9 |
| 17 | [AI / AIsha](17-ai.md) | 95 | 6 | 42 | 59 | 18 | 50 | 32 | 1 | 12 | 11 |
| 18 | [Notifications](18-notifications.md) | 82 | 5 | 18 | 64 | 2 | 21 | 60 | 4 | 17 | 21 |
| 19 | [POS Monitor](19-pos.md) | 82 | 12 | 69 | 25 | 31 | 35 | 13 | 12 | 30 | 23 |
| 20 | [CC](20-cc.md) | 84 | 5 | 71 | 17 | 17 | 36 | 36 | 0 | 11 | 29 |
| | **JAMI** | **2146** | **225** | **1365** | **888** | **261** | **1067** | **805** | **111** | **398** | **553** |

> Sanoq skripti barcha `### EP-` va `### VR-` bandlarni birga hisoblaydi, shuning uchun holat-o'qi
> ustunlari 2371 dan kelib chiqadi. Ba'zi VR bandlarda qaror-o'qi `— (qarorga bog'lanmagan)` —
> shu sababli ✅+🔵 = 2253 < 2371.

---

## ⭐ Registr ochgan 6 ta kesuvchi naqsh

### 1. «Bir joyda tuzatilib, qo'shnilari unutilgan»
Loyihaning eng ko'p takrorlanuvchi nuqsoni. Bugun topilgan misollar:
- **3-tomonlama moslashtiruv — 4 ta parallel implementatsiya**, har birida o'z toleransi. Uchtasi
  ertalab tuzatildi, **to'rtinchisi** (`modules/pos/.../three-way-match.service.ts`) faqat POS
  registri uni topgach tuzatildi (`0e317ef6`).
- **Karantin-eskalatsiya — 2 ta parallel yo'l** (`9ea7c155`).
- **Bildirishnoma listenerlari** — `orphan-events.listener.ts` to'g'ri naqshni ishlatardi,
  qo'shni **6 tasi** yo'q (`6024b085`).
- WMS 3 endpointdan 1 tasi · IoT 9 mutatsiyadan 2 tasi · Marketing 9 controllerdan 8 tasi ·
  Director leaderboard bir repoda tuzatilib ikkinchisida qolgan.

**Xulosa:** bir nuqsonni topganda **darhol qo'shnilarini ham qidirish** kerak — bu registrda
qoidaga aylantirildi.

### 2. «Qurilgan, lekin ulanmagan»
Kod to'liq yozilgan, lekin hech kim chaqirmaydi:
- `PosDepartmentGuard` / `PosWarehouseAccessGuard` — hech qaysi controllerda `@UseGuards()` yo'q
- `alert_thresholds` (4 qator) va `kanban_column_sla` (10 qator) — default qiymatlar bilan
  to'ldirilgan, **hech qanday kod o'qimaydi**
- `SchedulingCapacityService` TOC hisobi — kodda bor edi, faqat yetib bo'lmaydigan servis chaqirardi
- `pos_telegram_routes` / `pos_variance_config` / `pos_barcode_map` — kod jonli, jadval bo'sh

### 3. «Yashil yolg'on» — muvaffaqiyat deb log yozadigan hech narsa
- `iot-data-cleanup.cron.ts` — ro'yxatdan o'tgan, `cron-status` da "bor", **tanasida bironta DB
  so'rovi yo'q**, `processed=0` qattiq yozilgan, `✅` log chiqaradi
- `detectBottleneck()` mavjud bo'lmagan jadvaldan o'qib, xatoni yutib, doim `null` = "to'siq yo'q"
- `pos-fifo.service.ts` mavjud bo'lmagan jadvallarga so'rov yuboradi → kechalik cron **har kecha
  jimgina no-op**

### 4. Manbalarning o'zi noto'g'ri sanaydi
`decisions/*.md` fayllarining **8 tasida** o'z Xulosasi band-ma-band sanoqqa mos kelmadi
(masalan CC: hujjat 60/24, haqiqat 68/16). Registr **har doim band-ma-band sanoqqa** amal qiladi.

### 5. 111 ta STALE-DOC — audit koddan orqada
Ayniqsa POS (12) va QC/Org (13/8). Sabab odatda noto'g'ri kalit-so'z bilan grep. **`QISM C` ni
POS'da mustaqil dalil sifatida ishlatmaslik kerak.**

### 6. Bloklovchi 3 tur — aralashtirilmasin
| Tur | Belgisi | Misol |
|---|---|---|
| ⌨️ **Kod-kamchiligi** | bugun qurilishi mumkin | IoT'da ~40 band |
| 🔩 **CAPEX-gate** | jismoniy uskuna kerak | IoT'da 24 band (datchik/hisoblagich/kamera) |
| 🔑 **Egasi-DATA / API-kalit** | egasidan qiymat kerak | AI'da 37 band |

---

## ⭐ Eng katta yagona blokerlar

1. **0 ta operator-rol foydalanuvchi.** To'liq qurilgan IoT tablet (26 endpoint + FE), ekipaj CRUD,
   smena topshirish va checklist darvozasi shu sababli **hech qachon ishlatilmagan**.
2. **FULL COMPANY RESET (2026-07-11)** 200 jadvalni bo'shatdi. MM'da 22 ta `mm_*` jadval + `material_cards`
   + `inventory_policy` = **0 qator** → ROP-trigger, reyting, MRP, 3-way — hech biri o'q otmaydi.
   Auditning "0 qator = qurilmagan" xulosalari shu sababli yaroqsiz.
3. **`users.telegram_id` da 0 qator** va UNIQUE cheklov yo'q → Telegram yetkazish qatlami bugun
   **adresatsiz**, garchi kod tayyor bo'lsa ham.
4. **Notifications'da BullMQ yo'q** → 10+ taymer/muddat/eskalatsiya bandi bloklangan.
   (Kanban'da BullMQ bor, lekin 6 cron'dan 3 tasi ko'chgan.)
5. **`recipient_card_id` yo'q** — butun bildirishnoma tizimi `user_id` (xodimga) yo'naltiradi,
   kartaga emas → «mas'uliyat lavozimga bog'lanadi» vizyoni qurilmagan.
6. **Outbox + DLQ yo'q** (CC va Kanban) — modullararo hodisa yetkazish kafolatsiz. Bu yangi
   **CC-approve → GL avto-posting** zanjiriga to'g'ridan-to'g'ri ta'sir qiladi.

---

## ⚠️ Egasi javobini kutayotgan eng muhim ochiq savollar

1. **`business_settings.pos.norma_fakt_farqi_ortiqcha_sarf_94`** (id=50) va
   **`kanban.norm_time_per_task_type_93`** — `value_num` NULL, ~1 oydan beri kutmoqda.
2. **`QISM I2` intervyusi 3 ta "OCHIQ" bandni allaqachon javoblagan**, lekin javob
   `decisions/19-pos.md` ga hech qachon kirmagan: EP-POS-017 (davriylik: rulon **haftalik**,
   qolgani **oylik**), EP-POS-037 (makulatura+brak+QC-rad = **bitta ombor**), EP-POS-063
   (**zona muzlatiladi** — `decisions` esa "talab emas" degan).
3. **Kamera-AI kimniki** — IoT modulinikimi yoki HR'nikimi? `RoomAnalysisCron` bugun HR'da yashaydi.
4. **Migration-reestr fayllarini Qoida-13 dan istisno qilish kerakmi** (4555 va 2292 qator)?
5. **Hujjat tili default'i `'uz'` (lotin)** — egasi kirillni ustuvor degan edi.
6. **`autoRejectOverdue48h` 48 soatda avto-rad qiladi** — vizyon "avto-qaror YO'Q" deydi.

---

## Metodologiya

**Manbalar (3 ta parallel hujjat birlashtirildi):**
| Manba | Nima beradi |
|---|---|
| `docs/audit/decisions/NN-*.md` | Kanonik `EP-XXX-NNN` kalit + egasi qarori (**Qaror holati**) |
| `docs/audit/FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md` | Kod-dalili (**Qurilish holati** asosi) |
| `docs/vision/FULL-VISION-EXTRACTION-2026-07-07.md` (QISM A/C/D/I2) | Xom vizyon + egasi intervyulari |
| `docs/audit/vision-1000-answers/NN-*.md` | EP-kodsiz tavsiyalar (**II QISM** manbasi) |

**Har band 10 majburiy maydon:** Qaror holati · Qurilish holati · Talab · Manba · Dalil (kod) ·
Nima yetishmaydi · Bog'liqlik · action · ⤳ Ta'sir · Xoch-havolalar · Δ.

**Q-29 (verify-don't-trust) qat'iy qo'llanildi:** hujjat da'vosi jonli `git log`,
`information_schema` va `grep` bilan tekshirildi. Tasdiqlanmagan narsa `— (mos item topilmadi)`
deb belgilandi — **to'qilmadi (Q-40)**.

---

## Cheklovlar — halol ro'yxat

1. **Sanoq skripti EP va VR bandlarni birga hisoblaydi.** Yuqoridagi holat-ustunlari 2371 dan
   kelib chiqadi, 2146 dan emas.
2. **Δ ustuni 2026-07-11 dan keyingi o'zgarishlarni qamraydi.** Undan oldingi drift alohida
   tekshirilmagan.
3. **`FULL-ITEM-LEVEL` da qamrov teshiklari bor:** PP (`EP-PP-051..065`, 15 band — faylning o'zi
   tan oladi), QC (`EP-QC-121..134`, 13), WMS (`EP-WMS-121..134`, 14), AI (`EP-AI-001..050` uchun
   item **umuman yo'q**). Bu bandlarga 2026-08-07 sanali **jonli tekshiruv** natijasi berildi,
   07-11 sanasi meros qilib olinmadi.
4. **Raqamlash bug'lari hujjatlashtirildi, tuzatilmadi:** CC `[Module-20]` da `Item 89` o'zini
   `#39` deb iqtibos qiladi (mazmuni `#42`), `Item 91` tartibdan tashqari. MM'da 118 item ╳ 140 EP
   (offset +36). Har modulning **III QISM** ida to'liq xarita bor.
5. **Bir necha modulda `Qurilish holati` jonli-DB emas, kod-o'qish asosida.** Jonli DB bo'sh
   (FULL COMPANY RESET), shuning uchun "0 qator" hech qachon "qurilmagan" dalili sifatida
   ishlatilmadi.
6. **Registr — suratga olish, monitoring emas.** Har commit uni eskirtiradi. `Δ` maydoni shu
   sababli mavjud: keyingi to'lqin faqat o'zgargan bandlarni yangilashi kerak.
