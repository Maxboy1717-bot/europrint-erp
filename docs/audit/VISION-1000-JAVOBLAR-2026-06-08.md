# 1000 VIZYON SAVOLI — EGASI JAVOBLARI (build uchun) — 2026-06-08

> Manba: `VISION-QUESTIONS-1000-2026-06-08.md`. Egasi 10 tadan javob beradi (tavsiya + variant).
> "tavsiya" = advisor tavsiyasi qabul qilindi. Build paytida shu javoblar ustun.

## ORG / KARTALAR

### Q1-Q10 — hammasi TAVSIYA qabul (egasi: "hamma tavsiyalar to'g'ri")
- **Q1** Karta-yaratish triggerlari = **atomik tranzaksiya** (karta+asosiy bog'lanish; LMS/onboarding async event, fail→retry).
- **Q2** 2-karta biri muzlatilsa = muzlatilgan hissa **to'xtaydi, aktiv o'zgarmaydi** (Payrollga event).
- **Q3** Razryad "min 3 oy" = `razryad_history` oxirgi sanadan; pasaytirish ham hisobga olinadi.
- **Q4** ЦКП kaskad = **real-vaqt event-driven**; race uchun atomik yig'indi/qayta-hisob.
- **Q5** Yo'riqnoma yangi versiya = avval **ogohlantirish → muddatdan keyin ERP blok** (muddatni HR sozlaydi).
- **Q6** To'liqlik% = **12 bo'lim teng vazn**; past-to'liqlik oylikка ta'sir qilmaydi (faqat darslik-gate).
- **Q7** I.o.+asosiy ЦКП = har karta **alohida** hisobot/baho (AI ajratadi).
- **Q8** Org-ko'chirish = **rekursiv** (butun shox) + RBAC avto-yangilanadi.
- **Q9** Razryad-pasayish e'tiroz = e'tiroz muddati, razryad **muzlatilgan qoladi** (ko'ruvchi HR+rahbar).
- **Q10** Karta-eskirish eslatma = **Kanban topshiriq + Telegram**; yopilish audit-logда.

### Q11-Q20 — hammasi TAVSIYA qabul
- **Q11** Vakansiya-aging push = birlashtirilgan **digest**; oluvchilar org-daraxtdan dinamik.
- **Q12** Stavka 1.0 oshsa blok = **insert/update paytida**; owner ruxsati endpoint, muddatli.
- **Q13** 3-kun blok ochish = **3 tasdiq yig'ilgach** to'liq ochiladi.
- **Q14** Karta PDF = **asinxron queue (BullMQ)**; shablon versiyasi kartaga bog'liq; QR imzo.
- **Q15** Savol-bank razryad o'zgarsa = **arxivlanadi**; AI-savollar HR tasdig'idan; bank karta-turi+razryad.
- **Q16** AI moslik baho = **event-trigger** (MES/QC/LMS); oxirgi sana kartada.
- **Q17** RBAC o'zgarsa JWT = **darhol bekor** (websocket invalidate) — xavfsizlik.
- **Q18** ЦКП shaxsiy tuzatish = **HR/rahbar** (sababli audit-log); doimiy yoki joriy-oy sozlanadi.
- **Q19** Vakant ЦКП = **"qo'shimcha ish" yuki + ustama** (i.o. kabi).
- **Q20** org_nodes╳cards migratsiya = **online** (to'xtamaydi); manager_id backfill org-daraxtdan.

### Q21-Q30 — hammasi TAVSIYA qabul
- **Q21** Onboarding koeffitsient (0.7/0.85/1.0) = **master-data** (HR individual tuzata oladi).
- **Q22** Shablon "moslashtirish" = standart yangilanadi, **xususiy maydon saqlanadi + preview**; eski versiya arxivда.
- **Q23** Karta-talab→rekruting = **AI taklif** (≥80% taklif / <50% rad) → HR tasdiq.
- **Q24** Xato-katalog = **oyma-oy to'planadi** (limitsiz); AI takror-xato chegarasi sozlanadi.
- **Q25** Sertifikat 30-kun = **HR+xodim+rahbar** (Telegram+ERP); muzlatish **inson tasdig'i** (E1).
- **Q26** Karta raqamlash = **bo'lim ichida**, barqaror ID (o'zgarmaydi).
- **Q27** 2-otdeleniye xizmat = tasdiq **asosiy karta otdeleniyasidan**.
- **Q28** Razryad attestatsiya = **master-data** belgilash; davr 1-razryaddan; muzlatish **inson tasdig'i**.
- **Q29** Gap 0% = rahbarга **avto-xabar** ("razryad ko'tarishга tayyor"; rahbar tasdiqlaydi).
- **Q30** Ko'p-karta onboarding = **har karta o'z onboarding/darsligi** (parallel).
