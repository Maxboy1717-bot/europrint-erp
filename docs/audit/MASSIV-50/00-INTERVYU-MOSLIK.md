# MASSIV-50 — INTERVYU-MOSLIK TAHLILI (Interview Conformance)

> **Sana:** 2026-06-19 · **Maslahatchi (Claude) artefakti — read-only tahlil (🔵 Tahlilchi rol, Qoida 23).**
> **Maqsad:** 52 paketli (P01–P52) build to'plamining direktivalari egasining intervyu
> javoblariga (MASTER-SAVOL-JAVOB · OCHIQ-JAVOBLAR · CHAT-TARIXI-YANGI · KARTALAR-JAVOBLAR ·
> VISION-1000 · AISHA-JARVIS-VIZYON) **qanchalik sodiq** ekanini HALOL ko'rsatish.
> **Metod:** har modul bo'yicha qarorlar MATCH / PARTIAL / MISSING / CONTRADICTS bo'yicha
> belgilandi; bo'shliqlar va ziddiyatlar yig'ildi.
> **Bu fayl `00-VIZYON-QOPLAMA.md` ning juftligi:** u "qaysi vizyon elementi qaysi paketda"
> ni ko'rsatadi; bu fayl "paket egasi AYNAN aytgan narsani bajardimi" ni ko'rsatadi.

---

> ⚠️ **HOLAT (2026-06-19, POST-FIX) — bu fayl fix-pass'dan OLDIN yozilgan (tarixiy audit).**
> Quyida sanab o'tilgan **10 ta asosiy mismatch HAL QILINDI** moslashtirish-pass'da (re-verify tasdiqladi):
> P51 `employee_functions`→`employee_cards` · QC P18╳P19 AQL · IOT P44╳P45 machines · PP P12/P14 CHECK ·
> AI vaznlar→DB master-data + bloklar inson-tasdiqli + AISHA-JARVIS aks ettirildi · ijara→MENEJER ·
> SD tiraj ±10% · HR oylik-zanjir (AI→HR→moliya→direktor→kassir-PIN) · hardcode→sozlanadigan · P53 gofra/sloy.
> **Qolgani = egasi-qiymatlari** → `00-EGASI-QIYMATLARI.md`. Mismatchlarning o'zi emas.

---

## §1 — UMUMIY XULOSA (Headline)

**Umumiy hukm: ASOSAN MOS, lekin sezilarli og'ishlar bilan.**

52 paket direktivalari egasining **yadro arxitektura qarorlarini** ishonchli ifodalaydi:
oltin ip plumbingi (kanonik `warehouse_stock` · `entries` · `sales_orders`), karta-markazli
org-model, Vysotskiy-7 `manager_id` derivatsiyasi, 4-ustun Kanban (assigner-tasdiq), 6-holatli
ZNO FSM, AQL 2.5 + 3-sort QC, 7-faktor reyting, 5-metrik direktor holat-formulasi, NTF
immutable-log + routing-matritsa — bularning barchasi egasining javoblariga **MATCH**.

Ammo tahlil **uchta tizimli og'ish naqshini** ochib berdi:

1. **🔴 "Sozlanadigan" → kod-konstanta o'girilishi.** Egasi qayta-qayta "qotirilmaydi,
   sozlanadigan, master-data jadvalida" deganda, bir nechta paket o'ylab topilgan default
   raqamlarni **kodga hardcode** qilgan: ORG exam 70% / 3-retake (egasi "default yo'q"),
   GOLDEN `EP_COST_RATIO=0.65` (egasi tasdiqlamagan), AI CKP vaznlari `0.30/0.30/0.25/0.15`
   (egasi Q42=ЦКП40/sifat30/muddat20/boshqa10 + Q65=DB master-data degan), MM namlik 12%
   (egasi "qog'oz turiga qarab har xil" degan). Bu egasining **markaziy falsafasiga** zid.

2. **🔴 "AI/inson-tasdiq" yo'nalishining teskari aylanishi.** Egasining global printsipi
   "AI KUZATADI/BELGILAYDI, salbiy ta'sir FAQAT inson tasdig'i bilan" — lekin AI paketi
   (P36) bloklarni va buzilishlarni `is_active=true` bilan **darhol faollashtiradi**
   (oldindan-tasdiq darvozasisiz). ORG Portret esa egasi "AI ideal-profil generatsiya
   qiladi" deganda, direktiva uni **HR qo'lda to'ldiradigan matn-forma** qilib teskariga
   aylantirgan.

3. **🟡 "Schema bor, lekin enforcement/wiring yo'q".** Ko'p paket ustun/jadval qo'shadi,
   lekin egasi talab qilgan **biznes-darvozani** (LMS oylik-blok PayrollService integratsiyasi,
   LMS→MES canStart, CC immutability trigger, IoT norma-approval workflow, MES TB-checklist
   tablet-oqimi, POS foto majburiyligi) keyingi pakka qoldiradi yoki umuman yozmaydi.

Eng og'ir **kross-paket ziddiyatlari:** (a) QC P18 ╳ P19 bir xil `qc_aql_table` ni
**boshqa-boshqa Ac/Re qiymatlari + 2 xil URL** bilan yaratadi; (b) IOT P44 ╳ P45 bir xil
`machines` jadvalini **kitob-nomlari (SM-52...) ╳ generic kodlar (GF-001...) + o'zbekcha ╳
inglizcha status** bilan yaratadi — birga ishga tushsa to'qnashadi; (c) ORG P51 backfill SQL
mavjud bo'lmagan `employee_functions` jadvaliga murojaat qiladi (kanonik = `employee_cards`)
— runtime'da "relation does not exist" beradi.

Va eng muhim **kross-kesuvchi teshik:** ⭐ **gofra/sloy 3-formula** (kg→m²→list, CHAT-TARIXI
da yulduzli) **hech bir paketga egalik qilinmagan**, va **oshxona** ham qoplanmagan.

---

## §2 — PER-MODUL JADVAL

| Modul (paketlar) | Hukm | Eng muhim eslatma |
|------------------|------|-------------------|
| **ORG** (P04·P05·P51) | 🟡 QISMAN | Yadro to'g'ri (karta-markaz, Vysotskiy-7, 8-tab, unit-fields), lekin P51 backfill mavjud bo'lmagan `employee_functions` ga murojaat (CONTRADICTS, runtime crash); org-kaskad (yangi bo'lim→POS-ombor avto, Q41) **butunlay yo'q**; exam 70%/3-retake default o'ylab topilgan (egasi "default yo'q"); EP-ORG-102 o'zbekcha-kod talabi e'tiborsiz. |
| **GOLDEN** (P01·P06·P07·P08) | 🟡 QISMAN | Plumbing toza (warehouse_stock, 3-qaror QC, 4-hisob GL, MES→QC fix). Lekin ijara haqi MIJOZGA yozilgan (egasi: MENEJERGA — CONTRADICTS); `EP_COST_RATIO=0.65` hardcode (tasdiqlanmagan); 3 ta QC feature (1/2/3-sort narx-koeff, defekt-og'irlik blok, brak-manba) **yo'q**. |
| **SD** (P09·P10·P11) | 🟢 ASOSAN | Penalti-darvoza, maket hard-gate, o'zgarish-jurnali, MM-signal, inson-tasdiq printsipi — hammasi MATCH. Lekin **EP-SD-068 tiraj ±10%** (4 ta yadro qarordan biri) **butunlay yo'q**; priklad-per-tur jadvali deferred; source_channel CHECK yo'q. |
| **PP** (P12·P13·P14) | 🟡 QISMAN | 7+2 status, den/noch, 4-raqam yopish, AI-taklif printsipi MATCH. Lekin P14 seed **6 guruh/11 kod** qo'shadi → P12 ning 5-guruh CHECK constraint'ini **buzadi** (CONTRADICTS); 3-darvoza (maket+lab+material) yozilmagan; muzlatish ~3-kun default yo'q; ZARUR navbat-mantig'i yo'q. |
| **MES** (P15·P16·P17) | 🟡 QISMAN | 4 override (3-bosqich, operator-tasdiq deduction, 4-daraja OEE, crew, uchlik-tekshir) MATCH. Lekin OEE Availability sozlash-vaqtini **ajratmaydi** (asosiy OEE teshigi); OEE-target alert yo'q; smena-handover, bonus A/B/C, TB-checklist tablet-oqimi, ~30 mashina seed yo'q; complete-with-triple **stub** qaytaradi (Q-40 buzilishi). |
| **QC** (P18·P19) | 🟡 QISMAN | 4 yadro qaror (AQL 2.5, 3-og'irlik, 4-sort narx-koeff, brak-manba) MATCH. Lekin sertifikat-PDF, DPMO/Pareto/COQ, СОЗ-Telegram, brak ≤2%, retest yo'q. **CONTRADICTS:** P18 ╳ P19 bir xil `qc_aql_table` ni har xil Ac/Re + 2 URL (`/aql` ╳ `/aql-table`) bilan yaratadi. |
| **WMS** (P20·P21) | 🟡 QISMAN | 7 ombor-tur, tuzilmali manzil (A-12-3-2), rulon-karta, karantin, FIFO MATCH. Lekin DEPARTMENT_* ichki ombor + overflow mantig'i **yo'q**; lahtak-tayinlash yo'q; dinamik-AI min/max → statik ROP×2; **CONTRADICTS:** owner_type faqat tayyor-mahsulotga emas, BARCHA warehouse_stock ga qo'shilgan. |
| **MM** (P22·P23) | 🟢 ASOSAN | Vendor-reyting formula, 5-status+blacklist, sozlanadigan thresholds, dual-currency, PO-format, yoqilg'i-deferral to'g'ri. Lekin **CONTRADICTS:** P23 FE vendor-tur ro'yxati (manufacturer/distributor...) egasi-spec (xom-ashyo/kimyo...) VA P22 BE enum bilan mos emas; namlik 12% hardcode (egasi per-tur degan). AP-aging va 3-way-match (A-default) umuman yo'q. |
| **FIN** (P24·P25·P26·P52) | 🟢 ASOSAN | 15 dan 10 qaror MATCH: 6-holatli ZNO FSM, 3-tier thresholds (500k/5M sozlanadigan), davr-qulf, payroll/ZNO/AP→GL, podotchet BHMS-kodlari, kassir-smena. Lekin KAS-2 **PIN-per-operatsiya tushib qolgan**; EP-FIN-005/006 daromad 4-hisob avto-taqsim yo'q; 90+ aging direktorga aniq emas; P25 ZNO GL-kodlari (5010/5110) o'ylab topilgan. |
| **HR** (P27·P28) | 🟢 ASOSAN | 7-faktor reyting, bonus-taklif oqimi, ikki-mentor, NDA, nazorat-varaqasi, 7-bosqich funnel, offboarding→vakansiya, leave→tabel, referral-config — hammasi MATCH. Lekin **oylik tasdiq-zanjiri (AI→HR→moliya→direktor→kassir-PIN) yo'q**; bonus % (A:30-50/B:10-30/C:0) egasi tasdiqlamagan; reyting ЦКП/LMS dan emas, xom-ball API-input dan. |
| **DIR** (P29·P30) | 🟢 ASOSAN | 5-metrik formula, 5-daraja, 07:00 cron, kundalik daftar (auto-fill+carry-over), stat-reglament versiyalash, OKR-kaskad, dashboard realtime/snapshot MATCH. Lekin **4 qaror yo'q:** EP-DIR-037 majburiy-sabab-kategoriya, EP-DIR-028 Telegram-digest, EP-DIR-033 karta 2-4 mahsulot, EP-DIR-026 kunlik AI-tahlilchi. |
| **COR** (P31·P32) | 🟡 QISMAN | Karta-a'zolik, Kanban-chegara, 4 o'zbekcha prikaz-kategoriya, protokol 2-imzo, Rek-Sovet seshanba-cron, direktor-darvoza MATCH. **CONTRADICTS:** prikaz raqami egasi PR-YYYY-NNN degan, direktiva K/OD/F/AX-YYYY-NNN; majlis-tur 4 ╳ kengash 5 chalkashligi; ⭐ org-sxema-derivatsiya printsipi **e'tiborsiz**; AI-kamera transkripsiya yo'q. |
| **LMS** (P33·P34) | 🟡 QISMAN | 4 override (per-tur threshold, oylik-gate, ikki-tomonlama mentor, ikki-yo'l reyting), karta-markaz, 2-varaqa×12-mavzu, 3-oy razryad, PDCA MATCH. Lekin 3 hard-gate **chala:** 3-shart completion deferred, oylik-blok PayrollService-wiring deferred, MES-canStart deferred; micro-modul ketma-ket, karta-transfer re-enroll, sertifikat-expiry yo'q. |
| **AI** (P35·P36) | 🔴 SEZILARLI FARQ | Infra-skelet + EP-ORG-030 markazlashuv MATCH. Lekin: CKP vaznlar Q42/Q65 ga **CONTRADICTS** (hardcode, egasi DB-master-data degan); blok-faollashtirish global-printsipga **CONTRADICTS** (darhol is_active=true); moslik-PDF 3-tomon yo'q; tarixiy-import yo'q; ⭐ **AISHA-JARVIS-VIZYON (egasining eng so'nggi AI hujjati, 2026-06-17) butunlay e'tiborsiz**. |
| **CC** (P37·P38) | 🟡 QISMAN | 14 hujjat-tur seed, op-kod log, FTS-qidiruv, oylik-analitika cron MATCH. Lekin **4 qaror yo'q/zid:** DB-darajali immutability (trigger/RLS) yo'q; orgpolitika→asoschi-PIN yakuniy-bosqich yo'q; 10yil/3yil arxiv → bitta 3-yil blanket; super_admin-only template-guard yo'q. |
| **CRM** (P39·P40) | 🟡 QISMAN | 4 override (5-bosqich funnel, VISIT GPS-maydonlar, 60-kun abandonment, 5% narx-trigger) + DealWon→sales_orders MATCH. Lekin ~yarmi PARTIAL: 360° da Finance-qarz + QC-shikoyat yo'q; overdue-task NTF-eskalatsiya yo'q; 30/60/90 dan faqat 30; NBA confirm-write yo'q; salesTarget hardcode 0. |
| **MKT** (P41) | 🟡 QISMAN | 4 yangi qaror (8-kanal, ROI-formula, 6-status, dublikat-ogohlantirish) MATCH. **CONTRADICTS:** 5-raqam widget egasi "Director dashboard alohida" degan, direktiva Marketing-dashboard ichiga qo'ygan; kanal-list DB CHECK ga qotirilgan (egasi master-data degan). Lid-SLA cron, 5-mezon scoring, ish-soati inbox-SLA yo'q. |
| **KAN** (P42·P43) | 🟡 QISMAN | 4-ustun board, assigner-tasdiq, WIP=3 per-user, due_date majburiy, card_id FK, 3-savat CC-manba, rollover-eskalatsiya, shift-estafeta MATCH. Lekin **rasporyajenie→Kanban bridge (COR-051/054) butunlay yo'q**; eskalatsiya cron SQL ustun-nomi xato (`deadline` ╳ `due_date`); kategoriya/mas'ul Zod'da optional (vizyon majburiy). |
| **IOT** (P44·P45) | 🔴 SEZILARLI FARQ | P44 toza (kitob-nomlari, o'zbekcha-status, birlik-per-mashina, OEE-fix); P45 TB-checklist-blok, alternativ-ish, GSD-bridge, 2-soat kamera-cron MATCH. **CONTRADICTS×3:** P45 seed generic-kodlar (GF-001) + inglizcha-status — P44 ni buzadi; energiya 501 (egasi sex-hisoblagich degan). Sensor-rollout override yo'q; Andon ortda-qolish-% yo'q. |
| **NTF** (P46·P47) | 🟡 QISMAN | 4 override (MIXED-kanal, quiet-hours, inline-keyboard, ACK-faqat-muhim) + immutable-log + routing-matritsa + 4 ShVB-komanda MATCH. Lekin: tungi-telefon (035/036), foydalanuvchi-til (015), leaderboard (012), inline callback-handler yo'q; digest-cron **hardcode** (egasi Q140 sozlanadigan degan — CONTRADICTS). |
| **POS** (P48·P49) | 🟡 QISMAN | Storno, 2-imzo akt, MES→FG, GL-dedup MATCH. Lekin: EP-POS-032 smena-boshliq override-qobig'i **deferred** (egasi "faqat smena/reja boshlig'i ruxsati" degan — CONTRADICTS); foto-majburiyligi enforcement yo'q (faqat ustun); GSD-formula egasi-tasdiqsiz implement; Telegram "to'liq Mini App" o'rniga faqat /status,/approve. |

> **Hukm taqsimoti:** 🟢 ASOSAN MOS ≈ 6 (SD·MM·FIN·HR·DIR + ... ) · 🟡 QISMAN MOS ≈ 13 ·
> 🔴 SEZILARLI FARQ ≈ 2 (AI · IOT). Hech bir modul "TO'LIQ MOS" emas — har birida kamida
> bitta egasi-qarori tushib qolgan yoki o'zgartirilgan.

---

## §3 — ENG MUHIM FARQLAR (MISSING / CONTRADICTS — ahamiyat tartibida)

> Egasi javobidan **eng ko'p chetlashgan** elementlar. Yuqoridagilar = eng og'ir
> (runtime-crash, kross-paket to'qnashuv, yoki egasining markaziy falsafasiga zid).

### 🔴 1-DARAJA — Runtime / kross-paket to'qnashuv (darhol e'tibor)

1. **ORG P51 backfill `employee_functions` ga murojaat — jadval YO'Q.** Kanonik =
   `employee_cards` (employee_id/card_id/is_primary). Migration SQL va `backfillManagerIds`
   xizmati ishga tushganda "relation employee_functions does not exist" beradi. P04
   Drizzle to'g'ri (`employeeCards`), P51 boshqa nom ishlatadi. **→ P51 tuzatilishi shart.**

2. **QC P18 ╳ P19 bir xil `qc_aql_table` ni ZIDDIYATLI yaratadi.** P18 = 7 band + bir xil
   Ac/Re; P19 = 11 band (MIL-STD-1916) + boshqa minor Ac/Re. Ketma-ket ishga tushsa
   to'qnashadi. Ustiga: P18 = `/api/qc/aql`, P19 = `/api/qc/aql-table` (2 URL, 1 data).
   Egasi faqat "AQL 2.5 standart" degan — qaysi edition (ISO 2859-1 ╳ MIL-STD) hal qilinmagan.

3. **IOT P44 ╳ P45 bir xil `machines` jadvalini ZIDDIYATLI seed qiladi.** P44 = kitob-nomlari
   (SM-52, KBA-105, Тигель 1-10) + o'zbekcha-status (Ishlayapti/To'xtagan...); P45 = generic
   kodlar (GF-001, OF-001) + inglizcha-status (active/idle/broken). EP-IOT-031 aniq "Станоклар
   норма kitob nomlari" deydi. Birga ishga tushsa dublikat/CHECK-buzilish.

4. **PP P14 seed P12 CHECK-constraint'ini buzadi.** P14 = 6 guruh (material/equipment/staffing/
   technology/planning/other) + 11 kod; P12 CHECK = faqat 5 guruh (material/dastgoh/kadr/
   texnologik/reja). P14 seed har `equipment`/`staffing`/`technology`/`planning`/`other`
   qatorda CHECK-violation beradi. Egasi AYNAN 5 kitob-guruh degan → P12 to'g'ri, P14 zid.

### 🔴 2-DARAJA — Egasining markaziy falsafasiga zid

5. **AI bloklar darhol faollashadi — "salbiy ta'sir faqat inson-tasdig'i" buzilishi.**
   OCHIQ-JAVOBLAR §85-86 global printsip: AI KUZATADI, salbiy ta'sir (jarima/blok/razryad
   tushish) FAQAT inson tasdig'i bilan, HECH QACHON avtomatik. P36 `ai-block.service.ts`
   bloklarni `is_active=true` bilan darhol yaratadi; `ai_violations` to'g'ridan faol yoziladi.
   Override/dispute jadvallari bor, lekin ular **post-hoc**, oldindan-darvoza emas.

6. **AI CKP/moslik vaznlari kodga qotirilgan — egasi DB-master-data degan.** VISION-1000
   Q65: "vazn koeffitsientlari DB master-data jadvalida, KOD KONSTANTASI EMAS". P36
   `0.30/0.30/0.25/0.15` + `CKP_PASS_THRESHOLD=60` ni kodga yozadi. Ustiga vaznlarning o'zi
   Q42 (ЦКП40/sifat30/muddat20/boshqa10) bilan mos kelmaydi. **Ikki tomonlama zid.**

7. **ORG Portret yo'nalishi teskari — AI-generatsiya ╳ HR-qo'l-input.** KARTALAR Q30/Q31 +
   EP-AI-067: Portret = AI-generatsiya qilingan moslik-hisobot (PDF→xodim+rahbar+HR). P05 uni
   HR qo'lda to'ldiradigan matn-forma (goals/strengths/style/notes) qilib amalga oshiradi —
   data-oqim yo'nalishini egasi spec'iga teskari aylantiradi.

8. **"Sozlanadigan" default'larning kod-hardcode'ga aylanishi (takroriy naqsh):**
   - ORG exam 70% / 3-retake — egasi OCHIQ-da "default yo'q, har razryadga sozlanadi" degan.
   - GOLDEN `EP_COST_RATIO=0.65` — egasi hech qaysi hujjatda 65% tannarx demagan.
   - MM namlik 12% — egasi "qog'oz turiga qarab har xil (toplajner ≠ local)" degan.
   - NTF digest-cron hardcode `@Cron` — egasi Q140 "har modul uchun o'zi vaqt belgilaydi" degan.
   - FIN P25 ZNO GL-kodlari (5010/5110) — egasi hech qachon bu BHMS-kodlarni demagan.

### 🟡 3-DARAJA — Egasi AYNAN aytgan, lekin umuman yo'q (yadro qarorlar)

9. **SD EP-SD-068 tiraj ±10% tolerans** — SD uchun atigi 4 yadro qarordan biri, P09/P10/P11
   da **butunlay yo'q** (ustun/CHECK/mantiq/UI hech narsa).

10. **ORG EP-ORG-041 org-kaskad** — yangi bo'lim→POS Monitorda ombor AVTO yaratiladi + RBAC
    avto (Q41/CHAT-TARIXI). Kross-modul ta'sir, lekin hech bir paket emitlamaydi/defer qilmaydi.

11. **HR oylik tasdiq-zanjiri** (AI→HR→moliya→direktor→kassir-PIN) — CHAT-TARIXI da aniq, P27/P28
    da yo'q. KAS-2 PIN-per-operatsiya (FIN) ham tushib qolgan — ikki paketda bir xil teshik.

12. **AISHA-JARVIS-VIZYON (2026-06-17)** — egasining eng so'nggi AI-hujjati (direktivadan 2 kun
    oldin): Aisha = alohida modul, futuristik UI, STT/TTS, Layer-B Python desktop. P35/P36 da
    **butunlay e'tiborsiz** (Q-25 "master reja ustun" buzilishi).

13. **COR ⭐ org-sxema-derivatsiya printsipi (EP-COR-037)** — kengash a'zoligi/tuzilishi org_functions
    ierarxiyasidan AVTO kelib chiqishi kerak; direktiva faqat qo'lda CRUD qiladi.

14. **CC DB-darajali immutability + orgpolitika→asoschi-PIN** — ikkalasi ham egasi aniq talab
    qilgan (074/063), ikkala paketda ham yo'q.

15. **MES OEE Availability sozlash-vaqtini ajratmaydi** — egasi "sozlash vaqti alohida → OEE
    to'g'ri bo'ladi" (001/048) degan; P16 buni "Phase 2+" ga qoldiradi (asosiy OEE-teshigi).

---

## §4 — KROSS-KESUVCHI BO'SHLIQLAR (vizyon mavzulari kam aks etgan)

> Bir modulga emas, butun build to'plamiga taalluqli vizyon naqshlari.

### A. ⭐ GOFRA / SLOY 3-FORMULA (kg→m²→list) — egasiz teshik 🔴
CHAT-TARIXI-YANGI §29 da **yulduzli**, MEMORY indeksida ham ⭐:
`m² = yoyilgan×chiqindi` · `kg = m²×grammaj` · `grammaj = liner1+liner2+(flute×take-up)`.
Egasi "sozlanadigan, har material GSM+format, gofra uchun har qatlam GSM+flute(A/B/C/E)+take-up,
kg↔list avtomatik" degan. **52 paketda konversiya dvigateli YO'Q** — faqat BOM `layer`
metadatasi (P13) + m²/gramaj maydonlari (P20/21/23) tarqoq. AI-planning va material-norma
hisobi vizyon talab qilgan avto-konversiyani bajara olmaydi. §2.6 DEFER ro'yxatida EMAS.

### B. OSHXONA — qoplanmagan 🔴
CHAT-TARIXI §92 ("oshpaz MRO omboridan skaner qiladi") + vizyon-22 #11. Hech bir paketda yo'q,
rasman defer ham qilinmagan. Egasi tasdiqlasin: defer yoki keyingi to'lqin.

### C. "SOZLANADIGAN" → KOD-HARDCODE (eng keng tarqalgan naqsh) 🔴
Egasining markaziy falsafasi — "qotirilmaydi, master-data, ekrandan sozlanadi, dasturchisiz".
Lekin kamida **6 paketda** kod-konstanta sifatida qotirilgan: ORG (exam-threshold/retake),
GOLDEN (cost-ratio), AI (CKP-vaznlar), MM (namlik), NTF (digest-cron), MKT (kanal-list DB CHECK).
Bu kuzatilmasa, egasi "dasturchisiz o'zgartira olaman" deb kutgan har bir sozlama deploy talab qiladi.

### D. "AI/inson-tasdiq" YO'NALISHI — bir nechta joyda teskari yoki yo'q 🟡
Global printsip "AI taklif → inson tasdiq, salbiy = faqat inson" 22 modulda takrorlanadi, lekin:
AI (P36 darhol-blok), ORG (Portret AI→HR teskari), HR (C-klass bonus=0 auto), SD/PP (taklif to'g'ri)
— amalga oshirilishida izchil emas. Egasining yulduzli falsafasi (#22) **infra-darajada** bor,
lekin **enforcement-darajada** tarqoq.

### E. KASSIR-HUB / PIN-tasdiq — bo'lingan va chala 🟡
Egasi kassir-markazni (bitta kassir, hamma naqd) + har-operatsiya-PIN + oylik-oxiri-kassir-PIN
degan. PIN-per-operatsiya (FIN KAS-2), oylik-zanjir-kassir-PIN (HR), POS smena-boshliq-PIN-override
— uchchalasi ham yo'q yoki deferred. "Kassir-hub (katta)" §2.6 da DEFER, lekin PIN-tasdiq
mexanizmi DEFER ro'yxatida EMAS edi.

### F. ENFORCEMENT-DARVOZALARNING KEYINGA SURILISHI 🟡
"Schema bor, gate yo'q" naqsh: LMS oylik-blok (PayrollService-wiring), LMS→MES canStart,
LMS 3-shart-completion, CC immutability-trigger, IOT norma-approval-workflow, MES TB-checklist
tablet-oqimi, POS foto-majburiyligi, MKT lid-SLA-cron — barchasi ustun/jadval qo'shgan, lekin
egasi talab qilgan **majburlovchi darvozani** keyingi pakka qoldirgan. Bu Q-33 (boshlangan ish
to'liq) bo'yicha "defer deb belgilangan bo'lsa to'g'ri", lekin ba'zilari **jim** qoldirilgan.

### G. ⭐ ORG-SXEMA = HAMMA NARSANING MANBAI — kam ishlatilgan 🟡
Egasi takror: "org-sxema o'zgarsa ERP rollari AVTO; kengash org-sxemadan; xarajat-markazi =
org_departments; routing org-sxema bo'yicha". ORG-kaskad (yo'q), COR-derivatsiya (yo'q),
FIN cost-center (gated) — bu markaziy "org-sxema = skelet" printsipi schema-darajada bor,
lekin **avto-kaskad mexanizmi** ko'p joyda yetishmaydi.

---

## §5 — TAVSIYA (qaysi direktivada nimani tuzatish)

> To'liq moslikka yetish uchun aniq, paket-darajali tuzatishlar. Egasi qaroriga.

### Darhol (runtime-crash / to'qnashuv — keyingi build oldidan)
- **P51 (ORG):** backfill SQL va `backfillManagerIds` da `employee_functions` → `employee_cards`
  (`employee_id`/`card_id`) ga o'zgartir. Aks holda migration runtime'da yiqiladi.
- **P18 ╳ P19 (QC):** bitta paketni `qc_aql_table` egasi qil, ikkinchisi unga murojaat qilsin.
  Bitta edition tanla (egasidan: ISO 2859-1 ╳ MIL-STD-1916). 1 URL ga birlashtir (`/api/qc/aql`).
- **P44 ╳ P45 (IOT):** `machines` seed va status-enum'ni P44 (kitob-nomlari + o'zbekcha-status)
  ga birlashtir; P45 dan generic-kod/inglizcha-status seed'ni olib tashla.
- **P14 (PP):** reason-code seed'ni P12 ning 5-guruh CHECK'iga moslab qisqart (yoki egasidan
  6-guruh tasdig'ini ol). Hozir P14 seed P12 CHECK'ni buzadi.

### Egasi-falsafasini tiklash (sozlanadigan + inson-tasdiq)
- **P36 (AI):** (a) CKP/moslik vaznlarini DB master-data jadvaliga ko'chir (Q65); kod-konstanta
  olib tashla. (b) Vaznlarni Q42 ga moslab to'g'rila (ЦКП40/sifat30/muddat20/boshqa10).
  (c) Blok/violation'ni `is_active=false` (pending) bilan yarat — inson-tasdiq darvozasi qo'sh (§85-86).
- **P05 (ORG):** Portret yo'nalishini AI-generatsiya qilib qayta-yo'naltir (EP-AI-067) — HR-qo'l-forma
  emas; yoki egasidan ikkala oqim ham kerakmi deb so'ra.
- **P04/P05 (ORG):** exam-threshold/retake DEFAULT'ni NULL qil yoki master-data-config jadvaliga
  ko'chir; 70%/3 ni "taklif" izohi sifatida belgila, egasi-raqami sifatida emas. `min_retake_interval_days`
  ustunini qo'sh (14-kun kontseptsiyasi tushib qolgan).
- **P08 (GOLDEN):** `EP_COST_RATIO=0.65` ni master-data sozlama bilan almashtir; ijara-haqi
  attributsiyasini `orderId` (mijoz) → javobgar-menejer ga o'zgartir (EP-WMS-019/020).
- **P22 (MM):** namlik-thresholdni per-qog'oz-tur master-data jadvaliga ko'chir; P23 FE vendor-tur
  ro'yxatini egasi-spec (xom-ashyo/kimyo/ehtiyot-qism/xizmat/yoqilg'i/transport) + P22 BE enum
  bilan sinxronlashtir.
- **P47 (NTF):** digest-cron'ni `ntf_schedule_config` dan o'qiydigan qil (Q140); hardcode @Cron olib tashla.
- **P41 (MKT):** kanal-list'ni DB CHECK dan master-data jadvaliga ko'chir (EP-MKT-003); 5-raqam
  widget'ni Director-dashboard'ga ko'chir (Q674), Marketing'dan ol.

### Tushib qolgan yadro-qarorlarni qo'shish
- **P09/P10/P11 (SD):** EP-SD-068 tiraj ±10% tolerans (ustun + CHECK + hisob real-chiqqan-miqdordan).
- **Yangi paket yoki P04 kengaytma (ORG):** EP-ORG-041 org-kaskad (yangi bo'lim→POS-ombor avto + RBAC).
- **P27/P28 (HR) + P26 (FIN):** oylik tasdiq-zanjiri (AI→HR→moliya→direktor→kassir-PIN) +
  kassir KAS-2 PIN-per-operatsiya — ikkalasini birga loyihalash.
- **P35/P36 (AI):** AISHA-JARVIS-VIZYON ni reja-ga kirit (alohida modul / UI / STT-TTS / Layer-B) —
  yoki egasidan rasman defer tasdig'ini ol.
- **P31/P32 (COR):** prikaz raqami PR-YYYY-NNN ga o'zgartir (EP-COR-056); org-sxema-derivatsiya
  printsipini (EP-COR-037) kengash-a'zolik avto-populate ga ulang.
- **P37/P38 (CC):** DB-darajali immutability-trigger (074) + orgpolitika→asoschi-PIN yakuniy-bosqich
  (063) + 10yil/3yil arxiv-tier (016) qo'sh.
- **P42/P43 (KAN):** rasporyajenie→Kanban bridge (COR-051/054); eskalatsiya-cron SQL `deadline`→`due_date`
  tuzat; kategoriya/mas'ul Zod-required qil.

### Yangi paket (egasi qaroriga)
- **⭐ P53-PP-sloy-formula-engine (yoki P12/P13 kengaytma):** gofra/sloy 3-formula konversiya
  dvigateli (kg↔m²↔list, sozlanadigan GSM/flute/take-up, 21-material seed egasi to'ldiradi).
  **Aks holda yulduzli vizyon elementi jim yo'qoladi.**
- **OSHXONA:** defer yoki keyingi-to'lqin — egasi rasman tasdiqlasin.

---

> 📌 **Eng muhim 3 xabar egasiga:**
> 1. 🔴 **3 ta kross-paket to'qnashuv** (P51 employee_functions · P18╳P19 AQL · P44╳P45 machines)
>    + P14╳P12 CHECK — keyingi build oldidan tuzatilmasa, migration runtime'da yiqiladi.
> 2. 🔴 **"Sozlanadigan → hardcode" naqshi** (6 paket) va **"AI darhol-blok" / "Portret teskari"**
>    — bular egasining markaziy falsafasiga zid; schema-fix emas, dizayn-fix.
> 3. 🟡 **Tushib qolgan yadro-qarorlar:** SD-tiraj-±10%, org-kaskad, oylik-PIN-zanjiri, AISHA-vizyon,
>    va kross-kesuvchi **gofra-3-formula + oshxona** — jim yo'qolmasligi uchun sanab o'tildi.
