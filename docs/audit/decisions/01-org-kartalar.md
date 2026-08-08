# ORG / KARTALAR — Decision Map (EP-ORG) — 2026-06-08

> Manba savollar: v1 (42) + v2 (101) = **143**. Kodlar: v1 → EP-ORG-001..042, v2 → EP-ORG-043..143 (fayl tartibida).
> Status manbalari: `KARTALAR-JAVOBLAR-IMPACT-2026-06-08.md` (42 v1 = HAMMASI **A**), `EUROPRINT_BARCHA_JAVOBLAR.md` (460 real javob), vizyon (master reja).

## Xulosa
- **Jami:** 143
- **✅ JAVOBLANGAN:** 89 (42 v1 = A + 47 v2 — BARCHA_JAVOBLAR yoki vizyondan)
- **🔵 OCHIQ:** 54 (v2 granular tafsilotlar — egasi keyin hal qiladi, A-default tavsiya berildi)

---

## I QISM — v1 (42 savol) — HAMMASI ✅ JAVOBLANGAN = A

### EP-ORG-001 · Karta = master-data
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ha — har lavozim-o'rindiq `cards` jadvalida, butun ERP shundan oziqlanadi; barcha modul `card_id` orqali ulanadi.
- **Manba:** KARTALAR-A (Q1)
- **action:** CREATE
- **⤳ Ta'sir:** HAMMA 20 modul (universal `card_id` FK)

### EP-ORG-002 · 1 o'rindiq = 1 xodim
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** 1 karta = 1 seat = 1 xodim; dublikat lavozim → 01/02 raqami.
- **Manba:** KARTALAR-A (Q2)
- **action:** CREATE
- **⤳ Ta'sir:** HR (binding), Payroll (har karta alohida oylik), Reports

### EP-ORG-003 · Kartasiz — oylik va ERP yo'q
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** `card_id` NULL → login YO'Q + oylik YO'Q (qattiq tartib).
- **Manba:** KARTALAR-A (Q3)
- **action:** APPROVE
- **⤳ Ta'sir:** Auth (login-gate), Payroll (oylik-gate), HR

### EP-ORG-004 · Bitta xodim — bir nechta karta
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Xodim↔karta many; oylik = kartalar yig'indisi; daraxtda har joyda ko'rinadi.
- **Manba:** KARTALAR-A (Q4)
- **action:** CREATE
- **⤳ Ta'sir:** Payroll (yig'indi algoritm), HR, Reports

### EP-ORG-005 · Karta hech qachon o'chmaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Karta soft-delete (arxiv/vakant), to'liq tarix saqlanadi.
- **Manba:** KARTALAR-A (Q5)
- **action:** UPDATE
- **⤳ Ta'sir:** HAMMA (FK saqlanadi), Reports (tarix), HR

### EP-ORG-006 · Xodim ketganda profil muzlaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Xodim ketsa profil freeze, karta vakant; qaytsa restore, tarix to'liq.
- **Manba:** KARTALAR-A (Q6) + BARCHA_JAVOBLAR Q38 (exit + arxiv)
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Auth (kirish bloki), Payroll (to'xtaydi)

### EP-ORG-007 · Karta papkasi — 6 bo'lim
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har kartada 6 majburiy bo'lim (vazifa/javobgarlik/GSD/reglament/jarayon/ta'lim) + to'liqlik%.
- **Manba:** KARTALAR-A (Q7) + BARCHA_JAVOBLAR Q32 (virtual papka)
- **action:** CREATE
- **⤳ Ta'sir:** LMS (ta'lim), Director (reglament/jarayon), HR

### EP-ORG-008 · Razryad har kartada
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har kartada `razryad` maydoni majburiy.
- **Manba:** KARTALAR-A (Q8)
- **action:** CREATE
- **⤳ Ta'sir:** Payroll (razryad→oylik), HR, LMS (imtihon)

### EP-ORG-009 · Razryad pog'onalari (master-ro'yxat)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Razryad = QO'LDA SOZLANADIGAN master-data (`razryad_levels` jadval); egasi darajalar + har birining datasini sozlaydi (Q9 tuzatish).
- **Manba:** KARTALAR-A (Q9, tuzatilgan)
- **action:** CREATE
- **⤳ Ta'sir:** HR/Settings (master-data setup), Payroll (oylik band), Admin

### EP-ORG-010 · Razryad ko'tarilishi qanday tasdiqlanadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Imtihon o'tadi → HR + yuqori rahbar tasdiq → razryad o'zgaradi.
- **Manba:** KARTALAR-A (Q10)
- **action:** APPROVE
- **⤳ Ta'sir:** LMS (imtihon), HR, Coordination (tasdiq), Payroll

### EP-ORG-011 · Imtihon oralig'i (min 3 oy)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** 2 imtihon orasi ≥3 oy, xodim o'zi murojaat qiladi.
- **Manba:** KARTALAR-A (Q11)
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, HR

### EP-ORG-012 · Razryad pasayishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Razryad tushishi ham bo'ladi (HR + rahbar tasdig'i bilan).
- **Manba:** KARTALAR-A (Q12)
- **action:** UPDATE
- **⤳ Ta'sir:** Payroll, HR, QC (sifat tushsa sabab)

### EP-ORG-013 · Razryad o'zgarsa HR hujjati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Razryad o'zgarsa HR hujjati + ichki sertifikat majburiy.
- **Manba:** KARTALAR-A (Q13)
- **action:** CREATE
- **⤳ Ta'sir:** CC/Hujjat, LMS (sertifikat), HR

### EP-ORG-014 · Karta uchun GSD/ЦКП ta'rifi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har kartada GSD: maqsad + birlik + chastota majburiy.
- **Manba:** KARTALAR-A (Q14) + BARCHA_JAVOBLAR Org-Q3 (har lavozim QYM)
- **action:** CREATE
- **⤳ Ta'sir:** Director (otdeleniye GSD), AI (baho), Notifications (bot so'rov), Reports

### EP-ORG-015 · ЦКП kim belgilaydi va qanday yoziladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** HR yozadi, format = matn tavsif + formula.
- **Manba:** KARTALAR-A (Q15)
- **action:** CREATE
- **⤳ Ta'sir:** HR, AI (ЦКП'dan savol tuzadi), Settings

### EP-ORG-016 · Mashinasiz xodimning ЦКП hisoboti
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** AI chatbot har kuni ЦКП'dan savol so'raydi → kunlik hisobot.
- **Manba:** KARTALAR-A (Q16) + BARCHA_JAVOBLAR Q116/Q117 (bot kunlik hisobot)
- **action:** AI
- **⤳ Ta'sir:** AI, Notifications (telegram), Payroll (hisobot→oylik), HR

### EP-ORG-017 · Mashinachi xodimning ЦКП manbai
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Operator ЦКП avtomatik IoT/MES'dan; rasmiy PDF invoys.
- **Manba:** KARTALAR-A (Q17) + BARCHA_JAVOBLAR Q119 (uskuna→invoys PDF)
- **action:** EVENT
- **⤳ Ta'sir:** IoT, MES, AI, Payroll

### EP-ORG-018 · Kunlik hisobot bermaslik jazosi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** 16 soat ichida ЦКП yo'q → o'sha kun oylik yozilmaydi; tiklash HR→direktor. (BARCHA: 3 soat → ishlamagan, HR o'zgartiradi.)
- **Manba:** KARTALAR-A (Q18) + BARCHA_JAVOBLAR Q118
- **action:** CRON
- **⤳ Ta'sir:** Payroll (kun-gate), HR, Coordination, Notifications

### EP-ORG-019 · 7-Otdeleniye raqami
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har kartada `otdeleniye_no` (1-7) majburiy.
- **Manba:** KARTALAR-A (Q19) + BARCHA_JAVOBLAR Org-Q2 (7 otdeleniye)
- **action:** CREATE
- **⤳ Ta'sir:** Director (otdeleniye GSD), HR, Reports, Coordination

### EP-ORG-020 · Otdeleniye GSD-metrikasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har otdeleniyaga bitta bosh metrika (gsd_metric).
- **Manba:** KARTALAR-A (Q20)
- **action:** CREATE
- **⤳ Ta'sir:** Director, AI, Reports

### EP-ORG-021 · Daraxt — har node bir karta
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Yagona daraxt, har node = karta, 7 qatlam, ota-karta = rahbar.
- **Manba:** KARTALAR-A (Q21) + BARCHA_JAVOBLAR Org-Q2/Q9
- **action:** CREATE
- **⤳ Ta'sir:** HAMMA (rahbar zanjiri), Coordination (eskalatsiya), Org

### EP-ORG-022 · Vakant rahbar holati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Rahbar vakant → quyi rahbarsiz ishlaydi, sakrash yo'q.
- **Manba:** KARTALAR-A (Q22)
- **action:** APPROVE
- **⤳ Ta'sir:** Coordination (eskalatsiya yo'q), Finance (approval-matrix), CC

### EP-ORG-023 · Karta = ruxsat (RBAC)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Ko'rish/qilish/tasdiq = kartadan; karta o'zgarsa ruxsat o'zgaradi.
- **Manba:** KARTALAR-A (Q23) + BARCHA_JAVOBLAR Q132/Q157/Org-Q6 (rol orgsxemadan)
- **action:** APPROVE
- **⤳ Ta'sir:** Auth/Security + HAMMA modul + CC (tasdiq) + POS

### EP-ORG-024 · Karta uchun oylik turi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Har kartada oylik_turi (soat/kun/ishbay) + bonus maydoni; oylik kartadan.
- **Manba:** KARTALAR-A (Q24) + BARCHA_JAVOBLAR Q58/Q181 (oylik→Payroll)
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll OYLIK SIYOSATI + HR + Director (xarajat)

### EP-ORG-025 · Bonus tizimi (KPI'siz)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Bonus = HR/Moliya/rahbar sozlaydigan tizim, KPI'ga bog'lanmaydi.
- **Manba:** KARTALAR-A (Q25)
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll, HR, Settings

### EP-ORG-026 · Oylik tasdiqlash zanjiri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Avto-hisob → HR + Moliya tasdiq → rahbar.
- **Manba:** KARTALAR-A (Q26)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance, HR, Coordination (oqim), CC

### EP-ORG-027 · Darslik tugamasa oylik yo'q
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Karta darsligi tugamaguncha o'sha karta oyligi to'xtaydi.
- **Manba:** KARTALAR-A (Q27) + BARCHA_JAVOBLAR Q71/Q197 (LMS majburiy)
- **action:** CRON
- **⤳ Ta'sir:** LMS, Payroll (gate), HR

### EP-ORG-028 · Darslik kartaga biriktiriladi (xodimga emas)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Darslik kartaga biriktiriladi; xodim almashsa ham qoladi.
- **Manba:** KARTALAR-A (Q28) + BARCHA_JAVOBLAR Q32 (lavozim papka)
- **action:** CREATE
- **⤳ Ta'sir:** LMS, HR (yangi xodim avto-oladi)

### EP-ORG-029 · Darslik kim tayyorlaydi va tasdiqlaydi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** O'quv bo'limi yozadi → AI tekshiradi → HR + rahbar tasdiqlaydi.
- **Manba:** KARTALAR-A (Q29)
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, AI, Coordination

### EP-ORG-030 · Markaziy AI — karta↔xodim moslik bahosi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Bitta markaziy AI har karta↔xodim mosligini baholaydi (ЦКП/test/davomat/sifat/rahbar).
- **Manba:** KARTALAR-A (Q30)
- **action:** AI
- **⤳ Ta'sir:** AI + manba: MES/QC/HR/LMS/davomat/ЦКП

### EP-ORG-031 · AI hisobotini kim oladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Moslik PDF → xodim + rahbar + HR (har biriga mos darajada).
- **Manba:** KARTALAR-A (Q31) + BARCHA_JAVOBLAR Q120 (rahbarlik zanjiri ko'radi)
- **action:** EXPORT
- **⤳ Ta'sir:** AI, CC (tarqatish), Notifications, RBAC

### EP-ORG-032 · Ko'nikma-matritsa va vorislik
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Skill-matrix + AI vorislar ro'yxati (sabab bilan).
- **Manba:** KARTALAR-A (Q32) + BARCHA_JAVOBLAR Q65/Q135 (succession + SkillsMatrix)
- **action:** AI
- **⤳ Ta'sir:** AI, HR (recruitment/vorislik), LMS

### EP-ORG-033 · Ko'nikmani qanday qo'shiladi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Xodim da'vo qiladi → test → raport → ko'nikma-matritsaga qo'shiladi.
- **Manba:** KARTALAR-A (Q33)
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, HR, AI

### EP-ORG-034 · 3 kun yo'qlik — profil bloki
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** 3 kun sababsiz/ЦКП yo'q → avto-blok, hamma huquqdan mahrum; ochish HR dalolatnoma→direktor→super admin.
- **Manba:** KARTALAR-A (Q34) + BARCHA_JAVOBLAR Q108/Q111 (3 kun→blok, hammasi)
- **action:** CRON
- **⤳ Ta'sir:** Auth (blok), HR, Coordination (direktor), Notifications, Payroll

### EP-ORG-035 · Ish-vaqti / smena — qayerda saqlanadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Smena/ish-vaqti alohida jadval, kartaga ulanadi.
- **Manba:** KARTALAR-A (Q35) + BARCHA_JAVOBLAR Q133 (ShiftSchedule)
- **action:** CREATE
- **⤳ Ta'sir:** MES (smena), HR (davomat), Payroll (soatbay), IoT (vaqt)

### EP-ORG-036 · Karta ko'rinishi standarti (rang + kattalik)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Rang = otdeleniye/holat bo'yicha, kattalik standart; vakant = kulrang.
- **Manba:** KARTALAR-A (Q36)
- **action:** READ
- **⤳ Ta'sir:** Org-UI, Design-system (token)

### EP-ORG-037 · Karta raqamlash (dublikatda 01/02)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Dublikat kartalar 01/02/03 raqami bilan ajratiladi.
- **Manba:** KARTALAR-A (Q37)
- **action:** CREATE
- **⤳ Ta'sir:** Org, HR, Payroll

### EP-ORG-038 · Vakansiya → recruitment → kartaga biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Vakant → HR talabnoma → recruitment → karta-binding (avtomatik).
- **Manba:** KARTALAR-A (Q38) + BARCHA_JAVOBLAR Q6/Q168 (AI recruitment, internal job posting)
- **action:** EVENT
- **⤳ Ta'sir:** HR (recruitment), CC (talabnoma), AI (vorislar), Org

### EP-ORG-039 · Migratsiya — mavjudni yaxshilash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** 142 node + 30 xodim saqlanadi, ustiga karta-qatlam qo'shiladi (7-qatlam saqlanadi).
- **Manba:** KARTALAR-A (Q39)
- **action:** UPDATE
- **⤳ Ta'sir:** HAMMA (mavjud data saqlanadi), Org

### EP-ORG-040 · Bitta DDL / ikki-olam yo'q
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Yagona org-struktura; 2-dept-olam birlashtiriladi; hamma modul + AI-kamera shunga ulanadi.
- **Manba:** KARTALAR-A (Q40) + BARCHA_JAVOBLAR Org-Q8 (hamma modul orgsxemaga bog'liq)
- **action:** UPDATE
- **⤳ Ta'sir:** HAMMA, IoT (kamera), data-integrity

### EP-ORG-041 · Org-o'zgarish kaskadlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Yangi bo'lim/transfer → avto-kaskad: POS-ombor, RBAC, adaptatsiya, shartnoma.
- **Manba:** KARTALAR-A (Q41) + BARCHA_JAVOBLAR Q188 (transfer→ruxsat+adaptatsiya)
- **action:** EVENT
- **⤳ Ta'sir:** POS + Auth/RBAC + HR + CC (kuchli kaskad)

### EP-ORG-042 · Karta ma'lumotlarining ko'rinish darajasi (maxfiylik)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** Maxfiy maydonlar (oylik/AI-baho/razryad-tarix) faqat ruxsatli kartalarga ko'rinadi.
- **Manba:** KARTALAR-A (Q42) + BARCHA_JAVOBLAR Q43 (rol-asosli maxfiy hujjat)
- **action:** APPROVE
- **⤳ Ta'sir:** RBAC, Finance, HR, Security

---

## II QISM — v2 (101 granular savol) → EP-ORG-043..143

### EP-ORG-043 · Razryad jadvalida qaysi ustunlar bo'lsin
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Nom + tartib raqami + minimal talab + oylik bandi + imtihon turi + sertifikat-shart + tavsif (to'liq, bir marta sozlanadi).
- **Manba:** yangi (KARTALAR-A Q9 ↳ "razryad maydonlari keyingi turda")
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll (oylik bandi), HR (imtihon), Ishlab chiqarish (talab)

### EP-ORG-044 · Razryad nomlash tizimi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Raqam + nom birga ("4-razryad — Katta mashinist").
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** Payroll, HR

### EP-ORG-045 · Razryad oylik bandi turi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Dan-gacha" oraliq (min–max); oraliqdagi nuqtani bo'lim boshlig'i taklif → HR tasdiq.
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll (oylik formulasi)

### EP-ORG-046 · Razryad imtihon turi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Nazariy test + amaliy sinov birga (ikkalasi o'tishi shart).
- **Manba:** yangi
- **action:** APPROVE
- **⤳ Ta'sir:** HR (imtihon), AI (savol-banki)

### EP-ORG-047 · Sertifikat/litsenziya talabi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Kartada "talab qilinadigan sertifikatlar" ro'yxati + amal muddati; 30 kun oldin ogohlantirish.
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** HR (eslatma), Xavfsizlik moduli

### EP-ORG-048 · Razryad master-ma'lumotini kim o'zgartiradi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Faqat HR boshlig'i + egasi (owner) tasdig'i bilan (vizyon: razryad master-data egasi sozlaydi).
- **Manba:** KARTALAR-A (Q9 — egasi sozlaydi) + vizyon
- **action:** APPROVE
- **⤳ Ta'sir:** Audit-tarix, Finance

### EP-ORG-049 · ЦКП o'lchov turi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Uch tur: SON (dona/tonna), FOIZ (%), VAQT (kun/soat); kartaga moslab tanlanadi.
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** AI (kartaga baho), Ishlab chiqarish (KPI)

### EP-ORG-050 · ЦКП hisoblash manbasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Iloji bo'lsa tizimdan avtomatik (IoT/MES), bo'lmasa qo'lda (manba belgilanadi). (Vizyon: mashinachi avto, mashinasiz AI-bot.)
- **Manba:** KARTALAR-A (Q16/Q17) + vizyon
- **action:** EVENT
- **⤳ Ta'sir:** MES/Ishlab chiqarish, Ombor

### EP-ORG-051 · ЦКП maqsadi (norma) qayerda turadi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Kartada standart norma + xodimga shaxsiy tuzatish (kerak bo'lsa).
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** Payroll, AI

### EP-ORG-052 · ЦКП oylikka ta'siri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — ЦКП % bajarilishi oylik/bonusga bog'lanadi; hisobot bermaslik → o'sha kun oylik yo'q.
- **Manba:** KARTALAR-A (Q18 — hisobot→oylik) + BARCHA_JAVOBLAR Q118/Q119
- **action:** CRON
- **⤳ Ta'sir:** Finance/Payroll (formula)

### EP-ORG-053 · Savol-bank tuzilishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta turi + razryad bo'yicha savol-bank (matn, variantlar, to'g'ri javob, qiyinlik).
- **Manba:** yangi (BARCHA Q62 — har lavozim AI savol banki, lekin ustun sxemasi ochiq)
- **action:** CREATE
- **⤳ Ta'sir:** AI (savol generatsiya/tekshirish), HR

### EP-ORG-054 · Imtihon savol manbasi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Bo'lim boshlig'i/usta yozadi + AI yordam beradi + HR tasdiqlaydi.
- **Manba:** BARCHA_JAVOBLAR Q62 (1+2 to'liq) + KARTALAR-A Q29
- **action:** APPROVE
- **⤳ Ta'sir:** AI, HR

### EP-ORG-055 · O'tish chegarasi (ball)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Har razryad uchun alohida chegara (1-3 → 60%, 4-6 → 75%); amaliy ustun 70/30.
- **Manba:** yangi
- **action:** APPROVE
- **⤳ Ta'sir:** Razryad, LMS

### EP-ORG-056 · Qayta topshirish qoidasi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 14 kundan keyin, yiliga maksimal 3 marta.
- **Manba:** yangi (KARTALAR-A Q11 min 3 oy ko'tarilish — qayta-topshirish alohida)
- **action:** APPROVE
- **⤳ Ta'sir:** LMS, HR

### EP-ORG-057 · Karta shabloni mavjudligi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Lavozim turi tanlansa standart maydonlar avtomatik to'ladi, keyin tahrirlanadi.
- **Manba:** BARCHA_JAVOBLAR Q54 (global + bo'limga xos shablon) + Q143
- **action:** CREATE
- **⤳ Ta'sir:** HR (karta yaratish), AI

### EP-ORG-058 · Shablon o'zgarsa eski kartalar
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Eski kartalar o'zgarmaydi; faqat "shablonga moslashtirish" tugmasi bilan ixtiyoriy (xavfsiz).
- **Manba:** yangi
- **action:** UPDATE
- **⤳ Ta'sir:** HR

### EP-ORG-059 · Shablonlar ro'yxati boshlang'ich to'plami
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Zavodga xos to'plam tayyor (10-15 asosiy lavozim: mashinist/operator/naladchik/OTKchi/logist/...).
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** HR

### EP-ORG-060 · I.o. tayinlash mexanizmi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Kartaga muddatli i.o. (boshlanish–tugash sanasi bilan), muddat tugagach avtomatik qaytadi.
- **Manba:** yangi (BARCHA Q82 taътil vazifa-topshirish bilan bog'liq)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (vertikal), Finance (i.o. ustamasi)

### EP-ORG-061 · I.o. davridagi oylik
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — O'z oyligi + i.o. ustamasi (% yoki summa).
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** Finance/Payroll (ikki karta to'qnashuvi)

### EP-ORG-062 · I.o. huquqlari ko'lami
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Kunlik operatsiyalar = ha, pul/kadr qarorlari = yo'q (yuqoriga eskalatsiya).
- **Manba:** yangi
- **action:** APPROVE
- **⤳ Ta'sir:** RBAC, Coordination

### EP-ORG-063 · Kartani boshqa bo'limga ko'chirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta ko'chadi, butun tarix saqlanadi, yangi manager_id avtomatik bog'lanadi; adaptatsiya+ruxsat qayta.
- **Manba:** BARCHA_JAVOBLAR Q188 (transfer→ lavozim+bo'lim+rahbar avto-yangilanadi) + KARTALAR-A Q41
- **action:** UPDATE
- **⤳ Ta'sir:** Coordination (vertikal), Audit-tarix, RBAC

### EP-ORG-064 · Ikki kartani birlashtirish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Asosiy karta tanlanadi, ikkinchisining tarixi unga ko'chadi, ikkinchisi arxivlanadi.
- **Manba:** yangi
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Payroll (oylik tarix)

### EP-ORG-065 · Bitta kartani ikkiga bo'lish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Yangi ikki karta ochiladi, eski arxivga o'tadi, havola bilan bog'lanadi.
- **Manba:** yangi
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Payroll

### EP-ORG-066 · Bir odam ko'p kartada — oylik to'qnashuvi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Har karta uchun stavka ulushi (0.5+0.5=1.0), oyliklar yig'iladi, jami 1.0 dan oshmasin; oshsa → owner ruxsati bilan.
- **Manba:** yangi (KARTALAR-A Q4 oylik=yig'indi — nazorat qoidasi ochiq, EP-ORG-142 bilan bog'liq)
- **action:** APPROVE
- **⤳ Ta'sir:** Finance/Payroll (jami nazorati)

### EP-ORG-067 · Audit-tarixda nima saqlanadi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Har o'zgarish: maydon, eski qiymat, yangi qiymat, kim, qachon, sabab (to'liq audit).
- **Manba:** BARCHA_JAVOBLAR Q107 (to'liq versiya tarixi: kim/qachon/nima)
- **action:** EVENT
- **⤳ Ta'sir:** Xavfsizlik, Finance (oylik o'zgarish dalili)

### EP-ORG-068 · O'zgarishga sabab majburiy-mi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Pul/razryad o'zgarishida sabab majburiy, oddiy maydonlarda ixtiyoriy.
- **Manba:** BARCHA_JAVOBLAR Q77/Q187 (hujjat taqdiri+sabab majburiy)
- **action:** APPROVE
- **⤳ Ta'sir:** Xavfsizlik, HR

### EP-ORG-069 · Tarixni ko'rish huquqi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Owner + HR + o'sha vertikaldagi yuqori boshliq (cheklangan). Audit-log esa faqat Super Admin.
- **Manba:** BARCHA_JAVOBLAR Q144 (audit-log faqat Super Admin) + Q120
- **action:** READ
- **⤳ Ta'sir:** Xavfsizlik (ruxsatlar), HR

### EP-ORG-070 · Audit yozuvini o'chirib bo'lmasligi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Faqat qo'shiladi, hech kim o'chira/tahrirlay olmaydi (immutable).
- **Manba:** BARCHA_JAVOBLAR Q83 (tasdiqlangan hujjat immutable) + Q173 (abadiy)
- **action:** APPROVE
- **⤳ Ta'sir:** Xavfsizlik

### EP-ORG-071 · Bo'sh karta holati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Bo'sh karta "Vakansiya" holatida + ochilgan sana + necha kun bo'sh.
- **Manba:** KARTALAR-A (Q5/Q38 vakant) + BARCHA_JAVOBLAR Q94 (bo'sh lavozim org-chartda)
- **action:** CREATE
- **⤳ Ta'sir:** HR (rekruting), Dashboard

### EP-ORG-072 · Vakansiya aging bosqichlari
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 0-14 kun yashil, 15-45 sariq, 45+ qizil + ogohlantirish; chegaralar yagona.
- **Manba:** yangi
- **action:** CRON
- **⤳ Ta'sir:** HR, Dashboard

### EP-ORG-073 · Vakansiya muhimligi (prioritet)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 3 daraja (kritik/o'rta/past).
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** HR (recruitment tartibi)

### EP-ORG-074 · Vakansiya yopilish muddati maqsadi (SLA)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Muhimlikka qarab maqsadli muddat (kritik 14, o'rta 30, past 60 kun). (BARCHA Q4: oddiy 15 / murakkab 25 / top 40 — o'zgaruvchan.)
- **Manba:** yangi (BARCHA_JAVOBLAR Q4 — muddatlar o'zgarishi mumkin)
- **action:** CRON
- **⤳ Ta'sir:** HR (Time-to-Fill KPI)

### EP-ORG-075 · Kartalarni ommaviy import
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Excel shabloni bilan import + xato satrlar ajratib ko'rsatiladi.
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** HR (dastlabki to'ldirish)

### EP-ORG-076 · Import xatolarini boshqarish
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — To'g'ri satrlar yuklanadi, xato satrlar ro'yxat bilan qaytariladi (tuzatib qayta yuklash).
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** HR

### EP-ORG-077 · Karta eksport (zaxira/hisobot)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Tanlangan ustunlar bilan Excel + PDF.
- **Manba:** BARCHA_JAVOBLAR Org-Q10 (PDF + Excel eksport)
- **action:** EXPORT
- **⤳ Ta'sir:** HR, Director

### EP-ORG-078 · Import audit izi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Import partiyasi alohida yoziladi (kim, qachon, fayl, satrlar soni).
- **Manba:** BARCHA_JAVOBLAR Q107/Q144 (to'liq audit-log)
- **action:** EVENT
- **⤳ Ta'sir:** Audit-tarix

### EP-ORG-079 · Filtr maydonlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Otdeleniye/bo'lim + razryad + holat + lavozim turi + oylik oralig'i (to'liq).
- **Manba:** BARCHA_JAVOBLAR Q141 (to'liq qidiruv+filtr, profil maydonlari ham)
- **action:** READ
- **⤳ Ta'sir:** Org, HR

### EP-ORG-080 · "Bo'sh kartalar" tezkor filtri
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Tayyor filtr + aging bo'yicha saralash.
- **Manba:** yangi
- **action:** READ
- **⤳ Ta'sir:** HR, Dashboard

### EP-ORG-081 · Xodim ↔ karta mosligi bo'yicha qidiruv
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI moslik balli bilan ranjlangan ro'yxat (razryad/malaka/ЦКП tarixiga qarab).
- **Manba:** KARTALAR-A (Q30/Q32) + BARCHA_JAVOBLAR Q135 (vacancy match)
- **action:** AI
- **⤳ Ta'sir:** AI integratsiya, HR

### EP-ORG-082 · Saqlangan filtr/ko'rinishlar
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Shaxsiy saqlangan ko'rinishlar ("Mening bo'limim bo'sh kartalari").
- **Manba:** yangi
- **action:** CREATE
- **⤳ Ta'sir:** Org-UI

### EP-ORG-083 · Karta holat qiymatlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 5 holat: Faol(band), Vakansiya, I.o., Muzlatilgan, Arxiv (EP-ORG-141 onboarding bosqichlari bilan kengaytiriladi).
- **Manba:** KARTALAR-A (Q5/Q6/Q22/Q38 — holatlar vizyondan)
- **action:** CREATE
- **⤳ Ta'sir:** Reports, Filtr

### EP-ORG-084 · Kartani muzlatish (vaqtincha to'xtatish)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Muzlatilgan" holati + sabab + muddat.
- **Manba:** KARTALAR-A (Q6 — profil muzlaydi)
- **action:** UPDATE
- **⤳ Ta'sir:** Payroll (to'xtaydi), HR

### EP-ORG-085 · Karta o'chirish vs arxivlash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Hech qachon to'liq o'chirilmaydi, faqat arxivlanadi (tarix saqlanadi).
- **Manba:** KARTALAR-A (Q5) + BARCHA_JAVOBLAR Q83/Q173 (immutable/abadiy)
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Payroll

### EP-ORG-086 · Arxiv kartani tiklash
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Arxivdan tiklash mumkin, eski tarix bilan.
- **Manba:** KARTALAR-A (Q6 — qaytsa restore)
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Payroll

### EP-ORG-087 · Kartadagi "talablar" ro'yxati
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Strukturali ro'yxat (har talab: tur, daraja, majburiy/ixtiyoriy) — AI o'qiy oladi.
- **Manba:** yangi (EP-ORG-106 kitob-grounded malaka talablari bilan bog'liq)
- **action:** CREATE
- **⤳ Ta'sir:** AI (moslik bahosi)

### EP-ORG-088 · Darslik kartaga bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Darslik kartaga bog'lanadi; xodim kelsa darslikni ko'radi.
- **Manba:** KARTALAR-A (Q28) + BARCHA_JAVOBLAR Q32/Q71
- **action:** CREATE
- **⤳ Ta'sir:** HR/LMS, AI

### EP-ORG-089 · Kartaga biriktiriladigan hujjatlar
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Yo'riqnoma + xavfsizlik + ЦКП ta'rifi + ixtiyoriy fayllar (to'liq virtual papka).
- **Manba:** BARCHA_JAVOBLAR Q32 (virtual papka: hujjat/video/test) + Q104
- **action:** CREATE
- **⤳ Ta'sir:** LMS, HR

### EP-ORG-090 · Kerakli jihozlar/uskuna modeli
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Kerakli jihozlar" ro'yxati + aktivlar moduliga bog'lanadi (hozir bu model YO'Q edi).
- **Manba:** BARCHA_JAVOBLAR Q56/Q183 (ish joyi ta'minlash + inventar xodimga)
- **action:** CREATE
- **⤳ Ta'sir:** Aktivlar/Ombor moduli, HR onboarding

### EP-ORG-091 · Razryad o'sish yo'li (karyera)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Har razryad uchun "keyingi razryad + shart (imtihon/tajriba/ЦКП)" — aniq karyera yo'li.
- **Manba:** BARCHA_JAVOBLAR Q92/Q93 (career path: xodim ko'radi + bo'lim narvoni)
- **action:** CREATE
- **⤳ Ta'sir:** HR (rivojlanish), Payroll (o'sish→oylik)

### EP-ORG-092 · Razryad muddatli qayta tasdiqlash (attestatsiya)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Xavfli/texnik kartalarda davriy attestatsiya (har 2 yil); o'tmasa → muzlatib qayta imtihon.
- **Manba:** yangi
- **action:** CRON
- **⤳ Ta'sir:** Razryad, LMS, Xavfsizlik

### EP-ORG-093 · Karta egasi tayinlanish tasdig'i (past moslik)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Past moslikda ogohlantiradi + sabab so'raydi, lekin bloklamaydi (owner qaror qiladi).
- **Manba:** yangi (KARTALAR-A Q30 moslik bahosi — blok/ogoh chegarasi ochiq)
- **action:** APPROVE
- **⤳ Ta'sir:** AI (moslik), HR, Payroll

### EP-ORG-094 · Bir kartada bir vaqtda nechta odam (smena)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Kartada "stavka soni" (masalan 3 stavka), har stavkaga 1 xodim; tungi smena ustamasi %.
- **Manba:** yangi (BARCHA Q171 bo'lim>lavozim>smena — model ochiq)
- **action:** CREATE
- **⤳ Ta'sir:** HR (smena jadvali), Payroll (stavka × xodim)

### EP-ORG-095 · Karta = 12 bo'limli zavod yo'riqnoma shabloni
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 12 majburiy bo'lim, to'la to'ldirilmasa "tugallanmagan" (zavod hujjatiga 100% mos). 6-bo'lim vizyoni (EP-ORG-007) zavod 12 bo'limiga kengaytiriladi.
- **Manba:** KARTALAR-A (Q7) + BARCHA_JAVOBLAR Q32/Q54 (yagona standart papka shabloni)
- **action:** CREATE
- **⤳ Ta'sir:** HR (yo'riqnoma), LMS, AI-moslik

### EP-ORG-096 · Har kartaga "1-4 продукт" slotlari
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta ichida "ЦКП + 1..N продукт" ro'yxati, har продукт alohida kuzatiladi.
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** Kunlik hisobot, AI-baho, MES

### EP-ORG-097 · "Кўп учрайдиган хатолар" — karta xato-katalog
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta xato-katalogi + hodisa shu kataloqdan tanlanadi (statistika to'planadi).
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** AI (takror xato signali), QC, Razryad pasayish

### EP-ORG-098 · "Муваффақиятли ҳаракатлар" — AI-baho ijobiy mezoni
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Муваффақиятли ҳаракатлар" AI-baho ijobiy mezoni (xato + yaxshi).
- **Manba:** yangi (kitob-grounded)
- **action:** AI
- **⤳ Ta'sir:** AI (moslik bahosi)

### EP-ORG-099 · Оргсхема manzili — "Департамент№-Бўлим№-Секция" 3 daraja
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Har kartada Департамент№ + Бўлим№ + Секция nomi majburiy (zavod kodi). Daraxt Egasi→BD→7 otdeleniye→Otdellar→Sektsiyalar→Sektorlar.
- **Manba:** BARCHA_JAVOBLAR Org-Q2 (ierarxiya) + Q171 (bo'lim>lavozim) + KARTALAR-A Q19/Q21
- **action:** CREATE
- **⤳ Ta'sir:** 7-otdeleniye daraxti, Reports (departament kesimi), RBAC

### EP-ORG-100 · 7 Departament nomlari master-ro'yxat (qotirilsin)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — 7 departament qotirilgan master-ro'yxat (1-Ходимлар .. 7-Администрация), hamma karta shulardan biriga tegishli (ikki-olam tugaydi).
- **Manba:** BARCHA_JAVOBLAR Org-Q2 (7 otdeleniye jadvali) + KARTALAR-A Q40 (bitta DDL)
- **action:** CREATE
- **⤳ Ta'sir:** HAMMA modul (yagona poydevor)

### EP-ORG-101 · 4 va 5-Departament ikkalasi "Ишлаб чиқариш" — chegara
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 4 = bevosita ishlab chiqarish (dastgoh/operator), 5 = qo'llab-quvvatlash (sifat/режа/дизайн/конструктор).
- **Manba:** yangi (BARCHA Org-Q jadvalida 3=Ishlab chiqarish/4=Texnik — owner chegarani aniqlasin)
- **action:** APPROVE
- **⤳ Ta'sir:** 7-otdeleniye daraxti, kartalar taqsimoti

### EP-ORG-102 · "НО-1..НО-14" raqamli birlik kodlari
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Har bo'lim/karta "НО-kodi" maydoniga ega, eski hujjatlar shu kod orqali bog'lanadi (meros saqlanadi).
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** Hujjat workflow (eski oргполитика ulanishi), Reports

### EP-ORG-103 · "РД-4 / РД-5" — qaror beruvchi rol kodlari
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — "Qaror beruvchi rol" (РД-4/РД-5) karta atributi, tasdiq oqimlari shunga bog'lanadi (org-sxemadan avtomatik marshrut).
- **Manba:** BARCHA_JAVOBLAR Q80/Q81 (org-sxemadan avto-routing) + Q132 (rol orgsxemada)
- **action:** APPROVE
- **⤳ Ta'sir:** HR (ishga qabul), Adaptatsiya (mustaqil ish ruxsati), Oylik

### EP-ORG-104 · Karta = "Лавозим папкаси" konteyneri
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta = "Лавозим папкаси" konteyneri (yo'riqnoma + оргполитика + darslik + контрольный лист).
- **Manba:** BARCHA_JAVOBLAR Q32 (har lavozim virtual papka: hujjat/video/test) + KARTALAR-A Q7
- **action:** CREATE
- **⤳ Ta'sir:** LMS, HR, Hujjat

### EP-ORG-105 · "Контрольный лист" — har bo'lim o'qildi-tasdiqi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Har karta bo'limi uchun "tasdiqladim" + sana + raqamli imzo; hammasi tasdiqlanmaguncha "tayyor emas".
- **Manba:** BARCHA_JAVOBLAR Q174 (o'qdi tasdiqlash + mentor tekshirish + mini-test) + Q84
- **action:** APPROVE
- **⤳ Ta'sir:** Yuridik himoya, Adaptatsiya (mustaqil ish ruxsati)

### EP-ORG-106 · Малака талаблари — strukturali maydonlar
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Strukturali (ta'lim/tajriba-yil/dastur/ko'nikma-ro'yxat); recruitment + AI shunga solishtiradi.
- **Manba:** yangi (BARCHA Q135 SkillsMatrix→position requirements — ustun sxemasi ochiq)
- **action:** CREATE
- **⤳ Ta'sir:** Recruitment (vakansiya filtri), AI-moslik, Razryad

### EP-ORG-107 · "Иш жойи ва воситалари" — karta resurs/jihoz ro'yxati
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta "kerakli vositalar" ro'yxatiga ega, inventar/ombor bilan bog'lanadi (EP-ORG-090 bilan bir).
- **Manba:** BARCHA_JAVOBLAR Q56/Q183 (ish joyi ta'minlash + inventar)
- **action:** CREATE
- **⤳ Ta'sir:** Ombor/inventar, HR onboarding, Aktiv hisobi

### EP-ORG-108 · "Бўйсуниш" — karta→karta vertikal bog'lanish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Bo'ysunish karta→karta (vertikal zanjir kartalardan); manager_id muammosini hal qiladi.
- **Manba:** KARTALAR-A (Q21 ota-karta=rahbar) + vizyon (Vysotskiy manager_id=keyingi yuqori daraja)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination chain (eskalatsiya), 7-otdeleniye daraxti, MANAGER_OF_SENDER

### EP-ORG-109 · Karta javobgarligi — standart bandlar avtomatik
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Standart javobgarlik bandlari (energiya/sir/moddiy-ma'naviy) avtomatik + kartaga xos bandlar qo'lda.
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** HR (yuridik to'liqlik)

### EP-ORG-110 · Karta "ҳуқуқлари" — ERP harakatiga bog'lanishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Kartadagi huquqlar ERP harakatlariga bog'lanadi (so'rov yuborish, talab qilish).
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** CC (so'rov), RBAC

### EP-ORG-111 · ЦКП turi — "mahsulot / holat / foiz"
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ЦКП'ga tur tegi (mahsulot/holat/foiz) + o'lchov usuli biriktiriladi; o'lchov usulini karta yaratuvchi RD-4/RD-5 kiritadi.
- **Manba:** yangi (kitob-grounded; EP-ORG-049/EP-ORG-128 bilan bog'liq)
- **action:** CREATE
- **⤳ Ta'sir:** AI (o'lchov), Reports

### EP-ORG-112 · ЦКП → yuqori daraja ЦКП kaskadi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — ЦКП ierarxik bog'lanadi (quyi→yuqori), yuqori karta ЦКП'si quyilardan to'planadi.
- **Manba:** yangi (kitob-grounded; EP-ORG-020 otdeleniye GSD bilan bog'liq)
- **action:** EVENT
- **⤳ Ta'sir:** 7-otdeleniye daraxti, Reports (ЦКП kaskad), AI

### EP-ORG-113 · "Статистик кўрсаткичлар" → avtomatik KPI maydonlari
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Har karta o'z statistik ko'rsatkichlariga ega, qiymatlar modullardan avtomatik to'ladi.
- **Manba:** yangi (kitob-grounded)
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish (режа %), Sifat (брак %), Reports

### EP-ORG-114 · Rahbar kartasi KPI'si quyi kartalardan to'planadi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Rahbar kartasi KPI'si quyi kartalar natijasidan avtomatik to'planadi.
- **Manba:** yangi (kitob-grounded; EP-ORG-112 kaskad bilan)
- **action:** EVENT
- **⤳ Ta'sir:** ЦКП kaskad, 7-otdeleniye daraxti, Oylik (rahbar bonusi)

### EP-ORG-115 · Yangi xodim: 2-oy o'qish + imtihon → karta faollashuvi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta holati: biriktirildi → o'qish (2 oy) → imtihon → rahbar xulosasi → mustaqil-faol; har bosqich oylikka ta'sir qiladi; o'qish davri kamaytirilgan stavka.
- **Manba:** BARCHA_JAVOBLAR Q91 (sinov muddati: eslatma+baholash+avto-o'tish) + Q14/Q16 (adaptatsiya)
- **action:** APPROVE
- **⤳ Ta'sir:** HR onboarding, LMS (imtihon), Adaptatsiya, Oylik (bosqichli)

### EP-ORG-116 · Мураббий/устоз (mentor) kartaga bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Onboarding davrida kartaga "мураббий" (mentor-karta) biriktiriladi; har xodimga 2 mentor (adaptatsiya + kasbiy usta).
- **Manba:** BARCHA_JAVOBLAR Q145 (2 mentor) + Q30/Q72
- **action:** CREATE
- **⤳ Ta'sir:** HR (mentorlik), LMS

### EP-ORG-117 · Karta "СЕРИЯ" (oргполитика toifasi) bog'lanishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Оргполитикalar seriya bo'yicha kartalarga biriktiriladi (kun-tartibi/telefon/ta'til).
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** Hujjat, HR

### EP-ORG-118 · "Унвон" — lavozimdan alohida maydon
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta "lavozim nomi" + "унвон" (razryad/rutba) alohida maydonlar (rasmiy hujjatga mos).
- **Manba:** yangi (kitob-grounded; razryad bilan bog'liq lekin alohida)
- **action:** CREATE
- **⤳ Ta'sir:** Rasmiy hujjat (PDF), Payroll

### EP-ORG-119 · Karta smena-turi (3 smenali)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta "smena" tegiga ega; ishlab chiqarish kartalari smena bo'yicha ko'paytiriladi.
- **Manba:** BARCHA_JAVOBLAR Q133/Q171 (ShiftSchedule + bo'lim>smena) + KARTALAR-A Q35
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (смена режа), Oylik (smena ustamasi), Davomat

### EP-ORG-120 · Karta → "кун тартиби" (ish-vaqt rejimi) bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta "ish-vaqt rejimi" qoidasiga bog'lanadi, davomat shunga solishtiriladi; har xodim unikal ish vaqti bo'lishi mumkin.
- **Manba:** BARCHA_JAVOBLAR Q108 (unikal ish vaqti, AI kamera davomat) + KARTALAR-A Q35
- **action:** CREATE
- **⤳ Ta'sir:** Davomat (AI kamera), Intizom, IoT

### EP-ORG-121 · Karta → kunlik/smenalik hisobot majburiyati tegi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta "hisobot majburiyati" tegiga ega (davriylik + qabul qiluvchi); bermаslik avtomatik aniqlanadi (3 soat → ishlamagan).
- **Manba:** BARCHA_JAVOBLAR Q116/Q118 (har lavozim ЦКП hisobot bot orqali) + KARTALAR-A Q18
- **action:** CRON
- **⤳ Ta'sir:** Coordination (hisobot oqimi), Oylik (jazo), AI

### EP-ORG-122 · Karta → domen-bilim (qog'oz/gofra turlari) bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta "talab qilinadigan domen-bilim" ro'yxatiga ega, LMS darsligi shunga bog'lanadi.
- **Manba:** BARCHA_JAVOBLAR Q71/Q75 (LMS integratsiya, kurs materiali ERP qurish uchun) + KARTALAR-A Q28
- **action:** CREATE
- **⤳ Ta'sir:** LMS, Sifat (material bilimi→brak kamayadi), AI-imtihon

### EP-ORG-123 · Korporativ telefon/abonent doirasi kartaga biriktirish
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta korporativ raqam + ruxsat etilgan abonent toifalarini saqlaydi.
- **Manba:** BARCHA_JAVOBLAR Q74 (korporativ email/telefon ERP ro'yxatga olinadi)
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (aloqa nazorati), CC

### EP-ORG-124 · Taътил tasdig'i — i.o. + vazifa-topshirish majburiy
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Taътил tasdiqi i.o. tayinlash + vazifa-topshirish ro'yxati to'ldirilgandan keyin.
- **Manba:** BARCHA_JAVOBLAR Q186/Q96 (taътil ariza→rahbar tasdiq→Payroll) + Q79 (uzilishsiz)
- **action:** APPROVE
- **⤳ Ta'sir:** HR (taътил), I.o. tizimi (EP-ORG-060), Coordination

### EP-ORG-125 · Karta versiyalash (yo'riqnoma sanasi o'zgarganda)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta versiyalanadi (eski saqlanadi), versiya o'zgarsa qayta tasdiq so'raladi.
- **Manba:** BARCHA_JAVOBLAR Q107 (to'liq versiya tarixi) + Q83 (immutable)
- **action:** UPDATE
- **⤳ Ta'sir:** Audit-tarix, Контрольный лист (qayta tasdiq)

### EP-ORG-126 · Karta tasdiqlovchi 2 imzo (tasdiqlovchi + tanishuvchi)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta 2 raqamli imzo bilan kuchga kiradi (tasdiqlovchi RD + tanishgan xodim, sana).
- **Manba:** BARCHA_JAVOBLAR Q77/Q78 (rahbar imzo belgilash + xodim qabul + telegram tasdiq)
- **action:** APPROVE
- **⤳ Ta'sir:** Yuridik, Hujjat workflow

### EP-ORG-127 · Karta → "Иш йўриқномаси" (amaliy qadamlar) qatlami
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta 2 qatlam: vazifa ta'rifi + amaliy qadamlar (Иш йўриқномаси).
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** LMS, Onboarding, AI

### EP-ORG-128 · Karta → "Сборник упражнений" (mashq/test) bog'lanishi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta mashq/test to'plamiga ega, imtihon shundan tuziladi, AI baholaydi.
- **Manba:** BARCHA_JAVOBLAR Q8/Q62 (online test + AI adaptiv test + har lavozim savol banki)
- **action:** CREATE
- **⤳ Ta'sir:** LMS, AI-imtihon, Razryad

### EP-ORG-129 · "Глоссарий" — kartaga bog'langan atamalar lug'ati
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta atamalar lug'atiga ega (yoki umumiy lug'atdan kerakli atamalar), darslikda tooltip.
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** LMS (o'qish), AI-imtihon

### EP-ORG-130 · ЦКП formula turi (qanday o'lchanadi)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — 4 ЦКП formula turi (miqdor%/sifat/muddat%/holat), har kartaga mosi biriktiriladi.
- **Manba:** yangi (kitob-grounded; EP-ORG-049/EP-ORG-111 bilan bog'liq)
- **action:** CREATE
- **⤳ Ta'sir:** AI (baho), Reports

### EP-ORG-131 · Razryad → karta minimal talabi vs xodim razryadi (gap)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Karta MINIMAL razryad talab qiladi, xodim o'z razryadiga ega, AI mosligini tekshiradi.
- **Manba:** KARTALAR-A (Q8 razryad + Q30 moslik) + BARCHA_JAVOBLAR Q135 (position requirements match)
- **action:** AI
- **⤳ Ta'sir:** AI-moslik (gap-analiz), Oylik (razryad→min-oylik), Recruitment

### EP-ORG-132 · AI gap-analiz: karta talabi vs xodim haqiqati farqi
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — AI gap-analiz (talab vs haqiqat farqlari ro'yxati) → undan o'qish/rivojlanish rejasi.
- **Manba:** KARTALAR-A (Q30 markaziy AI moslik) + BARCHA_JAVOBLAR Q135
- **action:** AI
- **⤳ Ta'sir:** LMS (gap→darslik), Razryad (gap yopilsa→ko'tarilish), Recruitment

### EP-ORG-133 · Karta "majburiy tizim-qaydlari" (A-System o'rnini bosish)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta "majburiy tizim-qaydlari" ro'yxatiga ega (ish boshlandi/bosqich/tugadi), bajarilmasa signal.
- **Manba:** yangi (kitob-grounded)
- **action:** EVENT
- **⤳ Ta'sir:** MES (ish qaydi), Ma'lumot sifati, AI

### EP-ORG-134 · Razryad pasayish triggerlari
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Pasayish faqat aniq triggerdan (statistik ko'rsatkich + takroriy xato + qayta imtihon), AI taklif → RD-4 tasdiqlaydi.
- **Manba:** yangi (KARTALAR-A Q12 pasayish — triggerlar ochiq; EP-ORG-097 xato-katalog bilan)
- **action:** APPROVE
- **⤳ Ta'sir:** Razryad, Oylik (pasayish), AI, HR hujjati

### EP-ORG-135 · Bo'sh продукт slotlari → "tugallanmagan karta" topshirig'i
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Bo'sh продукт slotlari "tugallanmagan" + javobgar rahbarga to'ldirish topshirig'i.
- **Manba:** yangi (kitob-grounded; EP-ORG-096 bilan bog'liq)
- **action:** CRON
- **⤳ Ta'sir:** Org, Kanban (topshiriq)

### EP-ORG-136 · Vakant karta ЦКП'sini kim vaqtincha bajaradi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Vakant karta ЦКП'si vaqtincha yuqori kartaga (rahbar) yoki belgilangan qo'shni kartaga o'tadi.
- **Manba:** yangi (kitob-grounded; i.o. EP-ORG-060 bilan bog'liq)
- **action:** EVENT
- **⤳ Ta'sir:** Coordination, I.o. tizimi, Ishlab chiqarish uzilishi

### EP-ORG-137 · Karta eskirgan belgisi (davriy ko'rib chiqish)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta "oxirgi ko'rib chiqilgan sana"ni saqlaydi, muddat oshsa (1 yil) "ko'rib chiqing" eslatmasi.
- **Manba:** yangi (kitob-grounded)
- **action:** CRON
- **⤳ Ta'sir:** HR, Org (kartalar tirik qoladi)

### EP-ORG-138 · Kartadan rasmiy "Должностная инструкция" PDF eksport
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Kartadan rasmiy yo'riqnoma PDF (zavod shabloni 12 bo'lim + imzo joylari) avtomatik chiqadi.
- **Manba:** BARCHA_JAVOBLAR Q77/Q104 (hamma hujjat ERP, pechat imkoni) + Org-Q10
- **action:** EXPORT
- **⤳ Ta'sir:** Hujjat (raqamli↔qog'oz mosligi), HR

### EP-ORG-139 · Karta штат-reja birligiga bog'lanishi
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Karta штат-reja birligiga bog'lanadi (tasdiqlangan o'rin vs to'lgan), byudjet/vakansiya ko'rinadi.
- **Manba:** yangi (kitob-grounded)
- **action:** CREATE
- **⤳ Ta'sir:** Finance (oylik byudjet), HR (штат-reja), Vakansiya

### EP-ORG-140 · Mutaxassis karta shabloni (бош технолог/конструктор/дизайн)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — "Mutaxassis karta" shabloni alohida (tех karta/loyiha bilan bog'langan ЦКП).
- **Manba:** yangi (BARCHA Q54 bo'limga xos shablon — mutaxassis ajratish ochiq)
- **action:** CREATE
- **⤳ Ta'sir:** Org, LMS

### EP-ORG-141 · Karta holatlari — to'liq ro'yxat (kitob hayot-sikli)
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Onboarding bosqichlari (qoralama→tasdiqlangan→o'qish→imtihon→faol→vakant→muzlatilgan→arxiv) status ro'yxatiga qo'shiladi.
- **Manba:** BARCHA_JAVOBLAR Q91 (sinov muddati bosqichlari) + KARTALAR-A Q5/Q6 + EP-ORG-115
- **action:** CREATE
- **⤳ Ta'sir:** HR onboarding, Oylik (bosqichli)

### EP-ORG-142 · Ko'p-karta oylik yig'ish qoidasi (suiiste'molni oldini olish)
- **Holat:** 🔵 OCHIQ
- **Javob/Tavsiya:** A — Asosiy karta to'liq + qo'shimcha kartalar belgilangan foiz (30-50%) — adolatli, nazoratli. (KARTALAR-A Q4 "oylik=yig'indi" vizyoni bilan owner yakuniy formulani tasdiqlasin.)
- **Manba:** yangi (KARTALAR-A Q4 — yig'ish formulasi/nazorati ochiq; EP-ORG-066 bilan)
- **action:** APPROVE
- **⤳ Ta'sir:** Payroll (yig'ish formulasi), AI (ish yuki tahlili)

### EP-ORG-143 · Karta shabloni — lavozim-turi bo'yicha tayyor zagotovka
- **Holat:** ✅ JAVOBLANGAN
- **Javob/Tavsiya:** A — Lavozim-turi shablonlari (operator/rahbar/mutaxassis), umumiy bo'limlar oldindan to'lgan, faqat xos qism qo'shiladi.
- **Manba:** BARCHA_JAVOBLAR Q54 (global + bo'limga xos shablon) + Q143 (avto-shablon)
- **action:** CREATE
- **⤳ Ta'sir:** HR (karta yaratish), AI

---

> **Eslatma:** "OCHIQ" entrylar A-default tavsiya bilan keladi — egasi keyingi (granular) intervyu turida tasdiqlaydi yoki tuzatadi. Aksariyat OCHIQ savollar razryad-ustunlari (EP-ORG-043..047), karta-CRUD operatsiyalari (ko'chirish/birlashtirish/bo'lish — EP-ORG-064/065), vakansiya-aging (EP-ORG-072..074), va kitob-grounded ЦКП/статистика mexanikasi (EP-ORG-096..098, 111..114, 130, 133..137) bilan bog'liq. Bular kod-darajadagi tafsilot bo'lib, poydevor qarorlariga (42 v1 = A) zid emas.
