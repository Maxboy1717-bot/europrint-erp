# MASSIV-50 — VIZYON-QOPLAMA TAHLILI (Vision Coverage)

> **Sana:** 2026-06-19 · **Maslahatchi (Claude) artefakti — read-only tahlil.**
> **Maqsad:** 52 paketli (P01–P52) build to'plamining master vizyonni qanchalik
> qoplayotganini HALOL ko'rsatish — har vizyon elementi → qaysi paket(lar) → holat.
> **Manba:** `docs/XARITA-REJA-YONALISH-2026-06-07.md` (§1.3 vizyon-22, §1.5 5-ildiz,
> §2.x) + `00-MANIFEST.md` + 10+ paket direktivasi jonli o'qildi.
>
> **Holat belgilari:**
> - 🟢 **TO'LIQ** — vizyon elementi bitta yoki bir nechta paketda to'liq qamrab olingan (BE+DB+FE yoki to'liq doira).
> - 🟡 **QISMAN** — qisman qoplangan (masalan, faqat BE/DDL, FE yo'q; yoki bir qirrasi bor, asosiy qirrasi yo'q).
> - 🔴 **QOPLANMAGAN** — hech bir paket egalik qilmaydi.
> - 🔒 **EGASI-GATED** — paket(lar) yozilgan, lekin egasi qarori/DATA/DDL APPROVED kutadi (ishga tushmaydi).

---

## §1 — XULOSA (Headline)

52 paket master vizyonning **operatsion yadrosini** (oltin ip, org karta-daraxt, 21 modul
schema/BE/FE, kassir-hub, GL 4-hisob) yaxshi qoplaydi: vizyon-22 ning **~14 tasi 🟢 TO'LIQ
yoki yaqin, ~5 tasi 🟡 QISMAN**. 5-ildiz muammoning hammasi (oltin ip · moliya orol ·
manager_id · ikki-olam · soxta tugmalar) **egalik qilingan** — jumladan eng og'ir
poydevor ildizlari (manager_id va GL#76) endi **P51** va **P52** paketlariga biriktirilgan,
lekin ikkalasi ham 🔒 **EGASI-GATED** (P51 = head_user_id DATA egasidan; P52 = cost-center
arxitektura qarori + DDL APPROVED). Eng muhim **HALOL kamchiliklar:** (1) ⭐ **gofra/sloy
3-formula (kg→m²→list)** — vizyonning yulduzli AI-konversiya elementi — **hech bir paketda
to'liq egalik qilinmagan** (faqat BOM `layer` metadatasi va m²/gramaj maydonlari tarqoq);
(2) vizyon §2.6 ning "MVPdan keyin" deferred to'plami — **CRM aktiv SMS/AI-qo'ng'iroq
gateway · web-sayt · lead-gen 4-kanal aktiv oqim · AI-kamera GPU inference · oshxona** —
ataylab QOPLANMAGAN, lekin ularning **passiv izlari** (SMS=activity-type, kanal=dropdown,
kamera=zone/checklist, Telegram=aktiv) bor. Hech narsa jim yo'qotilmasin uchun §4 da
sanab o'tilgan.

---

## §2 — VIZYON-22 (master §1.3) → PAKET MATRISI

> Vizyon §1.3 ni guruh bo'yicha 22 elementga yoyib, har biriga paket(lar) biriktiramiz.

### A. YADRO

| # | Vizyon element | Paket(lar) | Holat | Izoh |
|---|----------------|-----------|-------|------|
| 1 | **POS Monitor** (retail-skaner zavod ombor tableti) | P48 (schema/GL/guards), P49 (MES-tablet) | 🟢 TO'LIQ | DDL + enum fix + GL dedup + texkarta guard + storno + 2-imzo akt; tablet UI P49. |
| 2 | **Kassir-markaz** (bitta kassir, hamma naqd) | P26 (kassir+crossmod), P24 (GL core) | 🟡 QISMAN | Smena/podotchet/X-Z hisobot/payroll→GL/AP→GL qoplangan. "Kassir-hub (katta)" §2.6 da DEFER deb belgilangan — to'liq markazlashuv keyingi bosqich. |
| 3 | **9–13 ombor turi** (barcode ota-bola, rulon) | P20 (WMS schema/DDL), P21 (WMS BE), P03 (op-codes) | 🟢 TO'LIQ | Rulon ID+QR+kenglik+gramaj g/m², ota-bola barcode, ombor turlari Ombor Dashboard Tabs (Qoida 22). |

### B. ISHLAB CHIQARISH

| # | Vizyon element | Paket(lar) | Holat | Izoh |
|---|----------------|-----------|-------|------|
| 4 | **22 ofset sex + flekso** | P12 (PP schema), P16 (MES OEE/3-stage), P17 (checklist/deduction) | 🟢 TO'LIQ | Sex/uskuna ierarxiya org-unit (P04) + MES sessiya lifecycle + OEE engine. |
| 5 | **Gofra liniya** | P12 (BOM `layer`), P20/P21 (gramaj), P13 (techcard) | 🟡 QISMAN | Gofra material/gramaj/layer metadatasi bor; gofra liniya **maxsus oqimi** alohida paketda yo'q. |
| 6 | ⭐ **Sloy formula (kg→m²→list, AI uchun)** | — | 🔴 QOPLANMAGAN | Vizyonning yulduzli AI-konversiya elementi. Faqat BOM `layer` (2-sloy/profil/mikro, P13) + m²/gramaj maydonlari (P20/21/23) tarqoq; **3-formula konversiya dvigateli hech kimники emas.** §4-A. |
| 7 | **Kashirovka** | P12/P13 (techcard operatsiya turi sifatida) | 🟡 QISMAN | Operatsiya/marshrut bosqichi sifatida sig'adi; alohida domen-logika paketi yo'q. |
| 8 | **Tigel (QC markaz)** | P18 (QC masterdata/DDL), P19 (QC gates/FE) | 🟢 TO'LIQ | QC darvozalar + inline check + master-data; tigel = QC bosqichi. |

### C. PUL

| # | Vizyon element | Paket(lar) | Holat | Izoh |
|---|----------------|-----------|-------|------|
| 9 | **Oylik** (hisob→direktor→kassir→xodim PIN) | P26 (payroll→GL), P24 (GL), HR P27/P28 | 🟡 QISMAN | PayrollClosed→GL yozuvi + kassir to'lov qoplangan; **xodim PIN-tasdiq oxirgi qadami** aniq paketda emas (imzo PIN = §2.3 "ochiq — egasi"). |
| 10 | **Podotchet / qarz** | P26 (podotchet+employee_debts) | 🟢 TO'LIQ | Avans→submit→approve/reject + GL juft yozuv + employee_debts. |
| 11 | **Oshxona** | — | 🔴 QOPLANMAGAN | Hech bir paketda yo'q. §4-B (kichik domen, ataylab tashqarida). |

### D. YANGI (T2/T3)

| # | Vizyon element | Paket(lar) | Holat | Izoh |
|---|----------------|-----------|-------|------|
| 12 | **CRM aloqa — SMS** | P40 (`sms` activity-type), P46 (`sms` channel DDL) | 🟡 QISMAN | SMS faqat **kanal/aktivlik turi** sifatida (schema + dropdown). **Aktiv SMS-gateway (Eskiz/play.mobile) yo'q.** §4-C. |
| 13 | **CRM aloqa — AI-qo'ng'iroq** | — | 🔴 QOPLANMAGAN | Aktiv AI-call/voice integratsiyasi hech kimники emas (§2.6 DEFER). §4-C. |
| 14 | **Menejer buyurtma-paneli** | P09/P10/P11 (SD), P39/P40 (CRM funnel) | 🟢 TO'LIQ | Menejer buyurtma kiritadi (`sales_orders` kanonik) + CRM voronka + dashboard. |
| 15 | **Web-sayt** | — | 🔴 QOPLANMAGAN | §2.6 DEFER. Faqat "veb-sayt" lead-source label sifatida (P41). §4-C. |
| 16 | **Marketing xarajat** | P41 (MKT full-stack: ROI) | 🟡 QISMAN | Kampaniya ROI/xarajat hisobi bor; chuqur xarajat-segmentatsiya §2.6 DEFER. |
| 17 | **SMM AI nazorat** | P41 (MKT), P36 (AI) qisman | 🟡 QISMAN | Kanal/kampaniya + churn/content cron; maxsus "SMM AI nazorat" oqimi to'liq emas. |
| 18 | **Lead-gen 4 kanal (aktiv)** | P41 (8-kanal CHECK + dropdown) | 🟡 QISMAN | Lead **manbasi** 8+1 kanal sifatida kuzatiladi (passiv); **aktiv lead-generatsiya oqimi** (avto-import/scrape) §2.6 DEFER. §4-C. |

### E. POYDEVOR (yulduzli)

| # | Vizyon element | Paket(lar) | Holat | Izoh |
|---|----------------|-----------|-------|------|
| 19 | ⭐ **Org-struktura** (butun ERP master) | P04 (schema/DDL), P05 (card/portret BE+FE), P51 (manager_id) | 🟡 QISMAN | Karta-daraxt schema + portret + razryad qoplangan; manager_id 🔒 GATED (#22). |
| 20 | ⭐ **Oltin ip** (uchma-uch zanjir) | P01–P03, P06, P07, P08, P50 | 🟢 TO'LIQ | SD→PP→MES→QC→WMS→FIN→Delivery; e2e spec (P08) + integratsiya barrellar + nav (P50). |
| 21 | **Falsafa: ERP oson + tartibga soluvchi** | (kesma — barcha paket Q-21 dizayn token + shablon) | 🟢 TO'LIQ | Dizayn-tizim + EPComingSoon + nav birligi (P50). |
| 22 | **Falsafa: AI ishni qiladi, odam tasdiqlaydi** | P35 (AI infra), P36 (CKP/fit/governance) | 🟢 TO'LIQ | Markaziy AI: mos-baho/CKP/violation/governance/override/dispute. |

**Vizyon-22 yakuni:** 🟢 TO'LIQ ≈ 11 · 🟡 QISMAN ≈ 8 · 🔴 QOPLANMAGAN ≈ 3 (gofra-sloy formula, oshxona, web-sayt) + AI-qo'ng'iroq.

---

## §3 — 5 ILDIZ MUAMMO (master §1.5) → PAKET MATRISI

| # | Ildiz | Master holat (2026-06-07) | Paket(lar) | Holat | Izoh |
|---|-------|---------------------------|-----------|-------|------|
| 1 | **Oltin ip** (buyurtma→i.ch→ombor→moliya) | ✅ to'liq bog'langan (raw-SQL QC workaround bilan) | P06/P07/P08 + P18/P19 | 🟢 TO'LIQ | P08 e2e spec + delivery→GL; P07 QC-rework qoldiq uzilishlarni yopadi. |
| 2 | **Moliya orol** (GL→entries) | ✅ qisman (gl_lines 1 writer qoldi) | P24 (GL core), P26 (payroll/AP→GL), P08 (delivery→GL) | 🟢 TO'LIQ | Kanonik `entries` mustahkamlandi; `gl_journal_entries`/`gl_lines` taqiqlangan ro'yxatda (P52 §88). |
| 3 | **manager_id 30/30 NULL** | 🔴 ochiq — head_user_id 124/142 bo'sh | **P51** (derivatsiya + head_user_id infra) | 🔒 EGASI-GATED | Infra (migratsiya + `deriveManagerId`) tayyorlanadi; **REAL backfill EGASI/HR DATA siz ishlamaydi** (kim-kimga rahbar = inson bilimi). Manifest §7 Q-A bevosita yopildi. |
| 4 | **Ikki-olam** (2 order/7 GL/2 stok) | qisman — warehouse_stock kanonik | P09 (sales_orders kanonik), P08 (warehouse_stock UPSERT), P52 (GL #76) | 🟡 QISMAN | Order/stok kanon bir paketga to'plangan; **12 uuid FK migratsiya** (§2.7 HARD BOUNDARY) hali alohida egasi qaroriga muhtoj. |
| 5 | **Soxta tugmalar** (echo/hardcoded) | qisman | (kesma — Q-40 har paketda + status-katalog 74 aldamchi) | 🟢 TO'LIQ | Har direktiva §0 Q-40 "ishlaydi≠to'g'ri" + REAL INSERT/DB-proof majburiy; 74 aldamchi modul-paketlarga tarqatilgan. |

---

## §4 — QOPLANMAGAN / DEFER (HALOL — hech narsa jim yo'qolmasin)

> Bu bo'lim **ataylab** sanaydi: qaysi vizyon elementlari hali HECH BIR paketga
> egalik qilinmagan. Ulardan ba'zilari to'g'ri (vizyon §2.6 "MVPdan keyin"); ba'zilari
> **kutilmagan teshik** (gofra-sloy formula) — egasi e'tiboriga.

### A. ⭐ GOFRA / SLOY 3-FORMULA (kg→m²→list) — KUTILMAGAN TESHIK 🔴
- Vizyon §1.3 da **yulduz bilan** belgilangan ("sloy formula — AI uchun"), MEMORY indeksida ham ⭐ ("gofra 3-formula").
- 52 paketda **konversiya dvigateli yo'q.** Bor narsa: BOM `layer` metadatasi (P13, "2-sloy/profil/mikro"), m²/gramaj maydonlari (P20/P21/P23), `areaM2` opsional parametri (P08).
- **Ta'sir:** AI-planning va material-norma hisobi vizyon talab qilgan avto-konversiyani bajara olmaydi. Bu T2 ishlab-chiqarish yadrosining bir qismi, §2.6 DEFER ro'yxatida EMAS.
- **Tavsiya (egasi qaroriga):** yangi paket (mas. P53-PP-sloy-formula-engine) yoki P12/P13 kengaytmasi sifatida qo'shilsin. **Aks holda jim yo'qoladi.**

### B. OSHXONA 🔴
- Vizyon §1.3 "Pul" guruhida ("oshxona"). Hech bir paketda yo'q.
- Kichik yordamchi domen; ehtimol ataylab MVP tashqarisida — lekin **rasman defer qilinmagan.** Egasi tasdiqlasin: defer yoki keyingi to'lqin.

### C. §2.6 "MVPdan keyin" DEFER TO'PLAMI (ataylab — to'g'ri)
Master §2.6 aniq deydi: *"CRM SMS/AI-qo'ng'iroq · web-sayt · lead-gen 4 kanal · marketing xarajat · AI kamera (GPU) · kassir-hub (katta)"* = MVPdan keyin.

| Vizyon element | Hozirgi passiv iz | DEFER holati |
|----------------|-------------------|--------------|
| CRM **aktiv SMS** gateway | P40 `sms` activity-type, P46 `sms` channel | 🔴 aktiv yuborish yo'q — to'g'ri DEFER |
| CRM **AI-qo'ng'iroq** (voice) | — | 🔴 hech iz yo'q — to'g'ri DEFER |
| **Web-sayt** | P41 "veb-sayt" lead-source label | 🔴 sayt o'zi yo'q — to'g'ri DEFER |
| **Lead-gen 4-kanal aktiv oqim** | P41 8-kanal kuzatuv (passiv dropdown) | 🟡 manba kuzatiladi; aktiv generatsiya DEFER |
| **AI-kamera GPU inference** | P45 camera zone/checklist/Andon + P36 ai-camera service (cross-check) | 🟡 zona+checklist bor; **GPU real-time inference** DEFER |
| **Kassir-hub (katta)** | P26 kassir smena/podotchet | 🟡 yadro bor; to'liq markazlashuv DEFER |

> ⚠️ **Halol nuance:** AI-kamera "GPU" qismi DEFER, lekin **kamera zonasi + AI cross-check
> (P45/P36)** allaqachon qurilmoqda — ya'ni infratuzilma tayyorlanmoqda, faqat og'ir
> GPU inference kelajakda.

### D. EGASI-GATED (yozilgan, lekin qaror/DATA/APPROVED kutadi) 🔒
| Element | Paket | Nimani kutadi |
|---------|-------|---------------|
| **manager_id backfill** (5-ildiz #3) | P51 | Egasi/HR `head_user_id` DATA (kim-kimga rahbar) + DDL APPROVED |
| **GL #76 cost-center** (§2.3 [Q3], §2.7) | P52 | 3 ta egasi qarori: cost_center_id→org_departments yoki cost_centers? · sex_category ustun darajasi? · DDL APPROVED |
| **workflow_rules** (gorizontal yo'l, §2.3) | P32 (scope ichida, gated) | Egasi: qachon quriladi yoki defer? (Manifest §7 Q-C) |
| **12 uuid FK migratsiya** (§2.7) | (tarqoq — order kanon) | Egasi: type-migration qarori (HARD BOUNDARY) |
| **~30 DDL-darvozali paket** (W1–W2) | P04/P12/P16/P18/P20/... | Har migratsiyaga egasi `-- APPROVED:` stamp |

---

## §5 — MANIFEST BLOKERLARIGA NISBATAN HOLAT

Manifest `00-MANIFEST.md` §7 da **3 ta egasi-qarori** (HARD BOUNDARY) sanalgan edi.
P51 va P52 paketlarining qo'shilishi (50→52) ikkitasini **rasman egalik qildi** (gated):

- **Q-A (manager_id)** → **P51** egalik qildi (🔒 DATA gated). Endi "hech bir paket qoplmaydi" emas.
- **Q-B (GL #76)** → **P52** egalik qildi (🔒 arxitektura+DDL gated).
- **Q-C (workflow_rules)** → hali **P32 ichida gated/deferred** — yangi alohida paket yo'q.

Manifest §6.B mexanik blokerlari (P14 pp-production to'qnashuvi, P08 yelim-wiring,
P50 yo'l-imlosi, P14 auto-APPROVED) — **direktiva-tahriri darajasida**, vizyon-qoplama
teshigi EMAS.

---

## §6 — QOPLAMA STATISTIKASI (taxminiy)

| O'lcham | TO'LIQ 🟢 | QISMAN 🟡 | QOPLANMAGAN 🔴 | GATED 🔒 |
|---------|-----------|-----------|----------------|----------|
| Vizyon-22 (§1.3) | ~11 | ~8 | ~3 | (org/manager qisman gated) |
| 5-ildiz (§1.5) | 3 | 1 | 0 | 1 (manager_id) |
| Modul (21/21) | — | — | — | ~30 DDL gated |

**Eng muhim 3 ta xabar egasiga:**
1. 🔴 **Gofra/sloy 3-formula** — yulduzli vizyon elementi, hech bir paketда yo'q → yangi paket kerak (aks holda jim yo'qoladi).
2. 🔒 **manager_id (P51) + GL#76 (P52)** — endi egalik qilingan, lekin sizning DATA/qaroringizsiz ishga tushmaydi.
3. 🟡 **§2.6 DEFER to'plami** — to'g'ri kechiktirilgan; passiv izlari (SMS-type, kanal-dropdown, kamera-zona) bor, faqat aktiv gateway/GPU/sayt keyin.
