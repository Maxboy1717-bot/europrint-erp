# SECTION 4 — DELTA (oxirgi tahlildan beri o'zgarish)

> Sana: 2026-06-06 | Rol: TAHLILCHI (qat'iy read-only — faqat o'qish + SELECT + git show + shu fayl)
> Manba (eski): `docs/status-raqam-katalog-2026-06-05-1619.md`, `docs/yashil-yolgon-reja-2026-06-05.md`, `docs/group4-stub-build-plan-2026-06-05.md`
> Oyna: so'nggi ~25 commit (`git log -25`), HEAD = `d4fceb88`
> Metod: VERIFY-DON'T-TRUST — har commit jonli kodda (`git show` diff) + DB-da (`_audit/q.cjs` SELECT) qayta tasdiqlandi. Backend tsc = EXIT 0 (regress yo'q).

---

## 1. RAQAMLAR: ESKI -> YANGI

| Ko'rsatkich | Eski (06-05 katalog) | Yangi (06-06) | O'zgarish |
|---|---|---|---|
| Jami route (`@Get/Post/Put/Patch/Delete`) | 2951 | **2982** | +31 (FE-drift yangi real endpointlar) |
| 501 — katalog grep (notImplemented+501 mixed satrlar, controllerlar) | 157 | **145** | **-12** |
| 501 — aniq endpoint (`notImplemented()` chaqiruv) | (katalog: ~148) | **39 chaqiruv** | **kuchli pasayish** |
| 501 — aniq endpoint (`HttpException NOT_IMPLEMENTED`) | — | 8 | — |
| 501 — JAMI real 501 endpoint (39+8) | ~ | **~47** | pasaydi |
| `@ApiResponse status:501` deklaratsiya | — | 50 | (deklaratsiya; ko'pi #FX-gated) |
| Haqiqiy yashil yolg'on (reja A1–A9) | 9 | **0** | **-9 (hammasi yopildi)** |
| Yarim yolg'on (xato-yo'l echo, A10–A13) | 3–4 | **0** | **-4 (GROUP 2)** |
| Bare `return {ok/success:true}` (controllerlar) | (katalog ~20-25 shubha) | **5** | hammasi real-amaldan keyin (yolg'on emas) |
| 500 riski (`as unknown` stub) | 0 | 0 | o'zgarmadi |

> ⚠️ **"157" tushuntirildi:** katalog grepi (notImplemented + `501` + `NOT_IMPLEMENTED` aralash satrlar) bo'lgan — hozir o'sha grep **145** beradi (157->145). Aniq endpoint o'lchovi esa **39 `notImplemented()` chaqiruv** — bu GROUP 6/7 va master-data fixlardan keyingi haqiqiy holat. "Jami route 2951->2982 oshdi, 501 esa pasaydi" = FE-drift yangi real endpointlar qo'shildi + eski stublar real qilindi.

---

## 2. NIMA TUZATILDI (commit -> jonli tasdiq)

| Commit / o'zgarish | Nima tuzatildi | Tasdiq (jonli) |
|---|---|---|
| `48c369a5` GROUP 6 HR (8 stub USE-EXISTING) | hr-dashboard 8 ta `notImplemented` stub -> real `db.execute(sql SELECT)`: offboarding-questions, hrc-tests/employee+public+stats, 360/reviewable, employee-corp, enps/results | DIFF: har biri `async ... { const r = await db.execute(sql...)`; DB-proof: `offboarding_checklist_items`, `hrc_iq_questions`, `employee_360_assessments`, `employee_career_profiles`, `hr_interview_sessions` — **5/5 jadval MAVJUD** (to_regclass != null) |
| `828df661` GROUP 7 | org-node history + integration skill-gap: 2 ta `notImplemented` -> real `db.execute(sql)` | DIFF: `getNodeHistory` va `skill-gap` ikkalasi `notImplemented(...)` -> `await db.execute(sql...)` |
| `6a1d664b` forecast fix | Haftalik forecast job `materials` (0 qator — hech qachon ishlamagan) -> `material_cards` (kanonik) | DB-proof: `material_cards`=21 qator (`is_active=true`=21); `materials` jadvali **DROPPED (null)** -> forecast endi real input oladi |
| `0c592e5d` D2 retire materials | `materials`+`mm_materials` test-dublikat olib tashlandi; aisha get-inventory-levels + barcode-warehouse `material_cards` ga yo'naltirildi | DB-proof: `materials`=null, `mm_materials`=null, `material_cards`=21 (kanonik) |
| `d4fceb88` WORLD4 stock | `wms_stock`+`wms_stock_levels` (ortiqcha stock olami) DROP; pos_stock_ledger schema tuzatildi; gateway repo `warehouse_stock` ga | DB-proof: `wms_stock`=null, `wms_stock_levels`=null, `warehouse_stock`=MAVJUD (kanonik), `pos_stock_ledger`=MAVJUD |
| `024e2b11` orders DROP | O'lik `orders` jadvali (zero writer) olib tashlandi; `sales_orders` kanonik | DB-proof: `orders`=null, `sales_orders`=MAVJUD |
| `95765961` marketing NPS POST | `POST /marketing/nps` real `INSERT INTO nps_responses ... RETURNING` (echo emas) | DIFF: `INSERT INTO nps_responses (id, papka_order_id, ...) gen_random_uuid()::text ... RETURNING` |
| `eb39bd78` sd payments PUT | `PUT /sd/payments/:id` real `UPDATE sd_payments ... RETURNING` | DIFF: `UPDATE sd_payments SET ... updated_at=NOW()` + `return {updated:true, data:row}` |
| `595c0977` hr files + documents CRUD | employee files POST (`INSERT INTO employee_files`), hr documents POST/GET/DELETE (`INSERT/DELETE FROM hr_documents`) | DIFF: real INSERT + `DELETE FROM hr_documents WHERE id=...` |
| `77bc0832` wms DELETE+movements | warehouses soft-delete (`UPDATE ... deleted_at=NOW()`), material_movements POST; commit ichida jonli DB-proof skript | DIFF: proof skript `p.query` bilan warehouses/material_movements/employee_files/hr_documents/nps tasdiqlaydi |
| `2ec77e54` mm vendor-perf + movements POST | vendor performance POST, material movements POST real | DIFF: real INSERT endpointlar |
| `b0e5501c` lms progress/module/cert | progress summary, module delete, cert delete, micro-module POST, chat PATCH | FE-drift adaptatsiya (real handler/CRUD) |
| `52144dfd` crm auto-tasks alias | `POST ['auto-tasks','ai/extended/auto-tasks/create']` — mavjud real handler (`svc.runAutoTasks`) ga ikkinchi yo'l | DIFF: faqat route massiv alias, handler allaqachon real |
| `81524ad8` / `ad8701f8` marketing+sd alias | FE-drift POST method alias; sd forecasts prefiks + `POST forecasts/run` | route alias |
| `33fc5b9d` + `154f05ab` events classify | 9 zero-listener event "fire-and-forget" deb belgilandi (owner qarori) | DIFF: faqat kod-izoh (+1 satr har handler) + `docs/massaviy-tuzatish-2026-06-06.md` — **xatti-harakat o'zgarmadi** |
| `cd624d62`, `9344036d`, `2a4611d9`, `6d2aa2d6` | docs-only (audit hisobotlar, two-worlds tahlil, DDL-gate sweep, "no git repo" tuzatish) | `--stat`: faqat `docs/` |

**GROUP 1 (yashil yolg'on A1–A9) — eski oynada yopilgan, hozirgi treeda tasdiqlandi:**
| Item | Hozirgi holat (jonli) |
|---|---|
| A7 cc-notification-prefs | `cc-notification-prefs.controller.ts:44` real `this.repo.upsert(user.id, body)` (PUT bilan bir xil kanonik) |
| A6 finance cfo-config | `:46` real `await this.cfoConfig.update(dto.key, dto.value)` — izoh: "was a {success:true} green-lie that saved nothing" |
| A9 ideal-rasm | POST RETIRE — faqat `PUT` qoldi (`:55 updateAll`, `:62 updateOne` real) |
| A1/A2/A8 | RETIRE (ishlatilmagan soxta endpoint — o'chirildi) |
| A3/A4/A5 | real (email activity-log, upload+serve, lms progress) |

---

## 3. YASHIL YOLG'ON HOLATI (hozirgi 5 ta `return {ok:true}` — yolg'on EMAS)

Reja mezoni: yashil yolg'on = OLDIN real `await` amal YO'Q. Hozir qolgan 5 ta `return {ok:true}` hammasi real-amaldan keyin:
- `chat/chat-uploads.controller.ts:96,107,159` — fayl FS yozuvidan keyin `ok:true`
- `communication-center/.../cc-documents.controller.ts:146` — hujjat amalidan keyin
- `kanban/.../kanban-boards.controller.ts:182` — real amaldan keyin

`sd-customers return {}` (×4) — har biri `await this.svc.softDelete/deleteContact/deleteDocument/deleteCompetitor` dan KEYIN (`:222–224, 279–281, 329–331, 361–363`) -> **haqiqiy o'chirish, bo'sh javob tanasi** (yolg'on emas, reja A-bo'limi bilan mos).

➡️ **Haqiqiy yashil yolg'on soni: 9 -> 0.** Hammasi yopildi (GROUP 1) yoki soxta-pozitiv ekani tasdiqlandi.

---

## 4. DUBLIKAT / IKKI-OLAM HOLATI (delta)

| Dublikat (eski reja) | Hozirgi holat | Tasdiq |
|---|---|---|
| C1 warehouse/movements alias | RETIRE (`e06468d7`) — kanonik `wms/movements` | reja GROUP 3 |
| C2/C3/C4 route-to'qnashuv | SOXTA-POZITIV (skaner izoh/route-collapse ko'p-hisoblagan) | reja GROUP 3 |
| C8 order ikki-olam (`orders` legacy) | `orders` jadvali **DROPPED** (`024e2b11`) — `sales_orders` yagona kanonik | DB-proof: orders=null |
| C9 stock ikki-olam (`stocks`/`wms_stock`) | `wms_stock`+`wms_stock_levels` **DROPPED** (`d4fceb88`) — `warehouse_stock` kanonik | DB-proof: ikkalasi null |
| materials ikki-olam (`materials`/`mm_materials`) | ikkalasi **DROPPED** (`0c592e5d`) — `material_cards` kanonik | DB-proof: ikkalasi null |

➡️ Master-data "ikki-olam" muammosi DELTA oynada **kuchli qisqardi**: 5 ta ortiqcha jadval (orders, wms_stock, wms_stock_levels, materials, mm_materials) DROP qilindi va yozuvchilar kanonikка yo'naltirildi.

---

## 5. REGRESS (yangi muammo kirdimi?)

| Tekshiruv | Natija |
|---|---|
| Backend tsc (`apps/api/tsconfig.json --noEmit`) | **EXIT 0** — GROUP 6/7 + master-data o'zgarishlari toza kompilatsiya |
| `git status` ish daraxti | Faqat untracked `_audit/*.cjs` proof skriptlar — **manba kod regress YO'Q** |
| DROP qilingan jadval yozuvchisi qoldimi? | `materials`/`orders`/`wms_stock` yozuvchilari kanonikка yo'naltirilgan (forecast/aisha/barcode/gateway diff'larida tasdiq) |
| Yangi yashil yolg'on qo'shildimi? | YO'Q — yangi FE-drift endpointlar real INSERT/UPDATE/DELETE (RETURNING) bilan |
| Yangi `as unknown` stub | YO'Q (0 -> 0) |

⚠️ **Diqqat (regress emas, kuzatuv):** events `33fc5b9d` 9 zero-listener eventni "fire-and-forget" deb **kod-izoh** bilan belgiladi — xatti-harakat o'zgarmadi, lekin bu eventlar hali ham hech kim eshitmaydi (owner ataylab qaror qildi). Yangi regress emas, mavjud holatning hujjatlashtiruvi.

➡️ **REGRESS TOPILMADI.** Barcha o'zgarishlar oldinga (stub->real, dublikat->kanonik, echo->honest).

---

## 6. HALOL HOLAT: BIR NECHA KUN OLDIN vs HOZIR

- **06-05 (katalog):** 2951 route, ~157 (mixed) 501, 9 haqiqiy yashil yolg'on, ikki-olam jadvallar (orders/wms_stock/materials) jonli, forecast 0-qatorli `materials` ustida ishlamasdi.
- **06-06 (hozir):** 2982 route (+31 real FE-drift), 145 (mixed) / 39 (aniq) 501, **0 yashil yolg'on**, master-data kanonikka yig'ildi (5 ortiqcha jadval DROP), forecast real input oladi (21 active material_card), tsc 0.

**Yo'nalish:** stub pasaymoqda, real endpoint o'smoqda, dublikat/ikki-olam yopilmoqda, echo->honest. Tizim "yashil yolg'on" jihatdan **toza** (faqat halol 501 stub qoldi — ko'pi #FX-gated yoki DDL-kutilayotgan).
