# EUROPRINT ERP — VIZYON-TASDIQ (Egasi intervyu+rejalari, har nuqta SAVOL + jonli javob)

> Egasi: "mani intervyularim va rejalarni hammasini qayta savol qilib bering — loyihada shundaymi yo'qmi".
> Manba = egasining O'Z javoblari (vision-1000-answers/01..20 + decisions + intervyular). Har javob JONLI tekshirilgan (kod + DB q.cjs, Q-29). Soxta yo'q (Q-40).
> Sana: 2026-06-27. Jami savol: 1967. O'rtacha vizyon-moslik: **51%**.

**Belgilar:** ✅ bor (to'liq jonli) · 🟡 qisman (struktura bor, data/oqim yetishmaydi) · ❌ yo'q (umuman yo'q) · 🔑 egasi-data (kod tayyor, qiymat kutadi)

**Yig'indi:** ✅ 286  ·  🟡 849  ·  ❌ 762  ·  🔑 70

---

## MODUL-JADVAL (umumiy)

| # | Modul | Vizyon% | ✅ | 🟡 | ❌ | 🔑 | Savol |
|---|---|---|---|---|---|---|---|
| 01 | Org / Kartalar | 63% | 39 | 68 | 28 | 8 | 143 |
| 02 | HR / Xodim-karta | 58% | 16 | 48 | 11 | 7 | 82 |
| 03 | Finance / GL / Kassir | 68% | 25 | 41 | 15 | 5 | 86 |
| 04 | Coordination / Council | 30% | 1 | 47 | 69 | 0 | 117 |
| 05 | Director / Hisobot | 58% | 9 | 43 | 31 | 2 | 85 |
| 06 | SD / Sotuv | 48% | 10 | 49 | 42 | 6 | 107 |
| 07 | PP / Rejalashtirish | 46% | 15 | 77 | 46 | 4 | 142 |
| 08 | MES / Ishlab chiqarish | 38% | 6 | 33 | 43 | 0 | 82 |
| 09 | QC / Sifat | 65% | 8 | 59 | 28 | 2 | 97 |
| 10 | WMS / Ombor | 60% | 35 | 61 | 21 | 4 | 121 |
| 11 | MM / Ta'minot | 43% | 2 | 29 | 35 | 2 | 68 |
| 12 | LMS / Darslik | 52% | 9 | 44 | 24 | 8 | 85 |
| 13 | CRM | 58% | 13 | 24 | 38 | 10 | 85 |
| 14 | Marketing | 48% | 10 | 44 | 43 | 2 | 99 |
| 15 | Kanban / Vazifa | 31% | 3 | 34 | 100 | 0 | 137 |
| 16 | IoT / Telemetriya | 38% | 5 | 33 | 46 | 2 | 86 |
| 17 | AI / Aisha | 52% | 19 | 46 | 29 | 1 | 95 |
| 18 | Bildirishnoma / Botlar | 27% | 2 | 21 | 58 | 1 | 82 |
| 19 | POS / Kassa-monitor | 72% | 40 | 19 | 17 | 6 | 82 |
| 20 | CC / Hujjat-shartnoma | 62% | 17 | 29 | 38 | 0 | 84 |

---

## 01 — Org / Kartalar  (vizyon 63%, 143 savol)

**01.1  ✅ bor**  — ❓ Q1 (EP-ORG-043). Razryad jadvalida qaysi ustunlar bo'lsin (nom+tartib+min talab+oylik bandi+imtihon turi+sertifikat+tavsif)?
- Siz: A — to'liq ustun to'plami, bir marta sozlanadi: nom, level, min_requirement, salary band, exam_type, certificate, description.
- Isbot: razryad_levels jadvalida BARCHA shu ustunlar mavjud: name, level, min_requirement, salary_min/max, exam_type, certificate, description (information_schema). 6 qator. Schema to'liq.

**01.2  🟡 qisman**  — ❓ Q2 (EP-ORG-044). Razryad nomlash: raqam+nom birga ('4-razryad — Katta mashinist')?
- Siz: A — raqam + nom birga, taqqoslasa bo'ladi.
- Isbot: razryad_levels da level (int) + name (text) ALOHIDA ustun bor; jonli name='1-razryad'..'6-razryad' (faqat raqam, lavozim-nom qismi yo'q). Struktura qo'llaydi, lekin data hali raqamli-only.

**01.3  🔑 egasi-data**  — ❓ Q3 (EP-ORG-045). Razryad oylik bandi turi: 'dan-gacha' oraliq (min-max)?
- Siz: A — min-max oraliq; oraliqdagi nuqtani bo'lim boshlig'i taklif → HR tasdiq.
- Isbot: salary_min + salary_max ustunlari razryad_levels da BOR (oraliq qo'llanadi). Lekin 6 qatorda ham salary_min/max=NULL — qiymat egasidan. Oraliq-nuqta taklif→tasdiq oqimi alohida kuzatilmadi.

**01.4  🔑 egasi-data**  — ❓ Q4 (EP-ORG-046). Razryad imtihon turi: nazariy test + amaliy sinov birga?
- Siz: A — nazariy + amaliy ikkalasi o'tishi shart.
- Isbot: razryad_levels.exam_type (text) ustuni BOR; jonli 6 qatorda NULL. Schema qo'llaydi, qiymat (test/amaliy) egasidan kiritilmagan.

**01.5  ✅ bor**  — ❓ Q5 (EP-ORG-047). Sertifikat/litsenziya talabi + amal muddati + 30 kun oldin ogohlantirish?
- Siz: A — kartada talab qilinadigan sertifikatlar ro'yxati + muddat; 30 kun oldin ogohlantirish.
- Isbot: card.repository.ts:423-436 listCertificates: certificates jadvalini employee_cards orqali JOIN qilib expiry_date<=now()+30 → expiring_soon flag. /cards/:id/certificates endpoint REAL. certificates jadvali jonli mavjud.

**01.6  🟡 qisman**  — ❓ Q6 (EP-ORG-048). Razryad master-ma'lumotini kim o'zgartiradi (faqat HR + owner)?
- Siz: A — faqat HR boshlig'i + egasi (owner) tasdig'i bilan, qattiq nazorat.
- Isbot: razryad.controller.ts:62 @Roles('admin','manager','hr_manager','director','super_admin') — manager+director ham tahrir qila oladi, vizyon 'faqat HR+owner' dan kengroq. Owner-tasdiq darvozasi yo'q.

**01.7  ✅ bor**  — ❓ Q7 (EP-ORG-049). ЦКП o'lchov turi: SON/FOIZ/VAQT uch tur, kartaga moslab?
- Siz: A — uch tur (SON dona/tonna, FOIZ %, VAQT kun/soat), kartaga moslab tanlanadi.
- Isbot: card.controller.ts:38 tskpMeasurementUnit z.enum(['SON','FOIZ','VAQT']); org_departments.tskp_measurement_unit ustuni mavjud. Karta yaratishda 3 tur tanlanadi.

**01.8  ✅ bor**  — ❓ Q8 (EP-ORG-050). ЦКП hisoblash manbasi: iloji bo'lsa avtomatik (IoT/MES), bo'lmasa qo'lda?
- Siz: A — mashinachi avto IoT/MES, mashinasiz AI-bot/qo'lda; manba belgilanadi.
- Isbot: ckp.controller.ts:25 source z.enum(['MANUAL','AI_CHAT','MES_AUTO','IOT']); ckp-mes-feed.listener.ts REAL MES-sessiyadan karta-link bo'yicha avto-feed (priority 0..1d). Manba ajratilgan.

**01.9  🟡 qisman**  — ❓ Q9 (EP-ORG-051). ЦКП normasi (target) qayerda: kartada standart + xodimga shaxsiy tuzatish?
- Siz: A — kartada standart norma + kerak bo'lsa xodimga shaxsiy tuzatish.
- Isbot: org_departments/org_functions.tskp_target ustuni BOR (kartada norma). Lekin xodimga shaxsiy tuzatish (per-employee override) jadvali/maydoni topilmadi; org_functions.tskp_target jonli 0 to'lgan.

**01.10  🟡 qisman**  — ❓ Q10 (EP-ORG-052). ЦКП oylikka ta'siri: % bajarilish bonus/ushlash; hisobot bermaslik → kun oylik yo'q?
- Siz: A — ЦКП % oylik/bonusga bog'lanadi; 16 soat ichida ЦКП yo'q → o'sha kun oylik yozilmaydi.
- Isbot: ckp-fact.service real ЦКП-fakt yozadi; ckp_card_products schema bor. Lekin ЦКП%→oylik formulasi va kun-gate cron (Payroll listener) bu A-qismda jonli tasdiqlanmadi — Payroll moduliga bog'liq, ckp_card_products=0 qator.

**01.11  ❌ yo'q**  — ❓ Q11 (EP-ORG-053). Imtihon savol-bank tuzilishi (karta turi + razryad bo'yicha, matn/variant/javob/qiyinlik)?
- Siz: A — karta turi + razryad bo'yicha savol-bank, har savol struktura bilan.
- Isbot: org-structure modulida savol-bank jadvali/endpoint topilmadi (razryad_levels.ai_exam_enabled bayrog'idan boshqa). Savol-bank AI/LMS modulida bo'lishi mumkin, bu modulda YO'Q.

**01.12  ❌ yo'q**  — ❓ Q12 (EP-ORG-054). Imtihon savol manbasi: bo'lim boshlig'i/usta yozadi + AI yordam + HR tasdiq?
- Siz: A — usta yozadi + AI yordam beradi + HR tasdiqlaydi.
- Isbot: org-structure modulida savol yozish/tasdiqlash oqimi yo'q. exam-passed-razryad.listener.ts bor (imtihon→razryad), lekin savol-manba+tasdiq workflow jonli tasdiqlanmadi.

**01.13  🔑 egasi-data**  — ❓ Q13 (EP-ORG-055). Imtihon o'tish chegarasi (ball): har razryad alohida (1-3→60%, 4-6→75%)?
- Siz: A — har razryad uchun alohida chegara; amaliy ustun 70/30.
- Isbot: razryad_levels.exam_pass_threshold ustuni BOR + razryad.controller.ts:31 examPassThreshold validatsiya; controller default YOZMAYDI (egasi qiymati kerak). Jonli 6 qatorda NULL.

**01.14  🔑 egasi-data**  — ❓ Q14 (EP-ORG-056). Qayta topshirish qoidasi (14 kundan keyin, yiliga maks 3)?
- Siz: A — 14 kundan keyin, yiliga maksimal 3 marta.
- Isbot: razryad_levels.max_retakes ustuni BOR + razryad.controller.ts:33 maxRetakes validatsiya (default yo'q, egasidan). '14 kun' oralig'i alohida maydon sifatida topilmadi; jonli max_retakes=NULL.

**01.15  ✅ bor**  — ❓ Q15 (EP-ORG-057). Karta shabloni: lavozim turi tanlansa standart maydonlar avto to'ladi?
- Siz: A — lavozim turi → shablon karta avto to'ladi, keyin tahrirlanadi.
- Isbot: card-template.controller.ts:99 POST :id/apply-template → field_defaults+override merge → yangi org karta seed (card-template.service.ts:79-84 REAL merge). card_templates jadvali (field_defaults jsonb) mavjud (hozir 0 qator).

**01.16  🟡 qisman**  — ❓ Q16 (EP-ORG-058). Shablon o'zgarsa eski kartalar: o'zgarmaydi, faqat 'moslashtirish' tugmasi?
- Siz: A — eski kartalar o'zgarmaydi; faqat ixtiyoriy 'shablonga moslashtirish' tugmasi.
- Isbot: apply-template yangi karta seed qiladi (eski kartani avto-yangilamaydi — vizyonga mos). Lekin mavjud kartaga 'shablonga moslashtirish' (faqat bo'sh maydon to'ldirish) tugmasi/endpoint topilmadi.

**01.17  ❌ yo'q**  — ❓ Q17 (EP-ORG-059). Shablonlar boshlang'ich to'plami (10-15 zavod lavozimi tayyor)?
- Siz: A — zavodga xos 10-15 asosiy lavozim shabloni tayyor kiritilsin.
- Isbot: card_templates jadvali jonli 0 qator (BO'SH) — boshlang'ich seed kiritilmagan. Schema+apply tayyor, data yo'q.

**01.18  ✅ bor**  — ❓ Q18 (EP-ORG-060). I.o. tayinlash: kartaga muddatli i.o. (boshlanish-tugash), muddat tugagach avto qaytadi?
- Siz: A — kartaga muddatli i.o., ended_at bilan, muddat tugagach avtomatik qaytadi.
- Isbot: card.service.ts:111-154 assignEmployeeToCard isActing+actingSupplement+endedAt; card.repository.ts on-read revert guard 'expired dated link no longer counts' (satr 391/409). i.o. seat band qilmaydi. employee_cards.is_acting/ended_at jonli ustun.

**01.19  🟡 qisman**  — ❓ Q19 (EP-ORG-061). I.o. davridagi oylik: o'z oyligi + i.o. ustamasi (% yoki summa)?
- Siz: A — o'z oyligi + i.o. ustamasi.
- Isbot: employee_cards.acting_supplement (numeric) jonli ustun + assign'da actingSupplement saqlanadi. Lekin Payroll'ga ustama qo'shilishi (oylik formulasiga ulanish) bu modulda tasdiqlanmadi — qiymat saqlanadi, hisob Payroll-bog'liq.

**01.20  ❌ yo'q**  — ❓ Q20 (EP-ORG-062). I.o. huquqlari: kunlik operatsiya=ha, pul/kadr qarori=yo'q (eskalatsiya)?
- Siz: A — kunlik operatsiyalar ruxsat, pul/kadr qarorlari yuqoriga eskalatsiya.
- Isbot: i.o. uchun cheklangan-RBAC (kunlik ha, pul/kadr yo'q) farqlovchi logika topilmadi. is_acting flag bor, lekin huquq-ko'lami RBAC tier i.o. uchun alohida qisqartirilmaydi.

**01.21  ✅ bor**  — ❓ Q21 (EP-ORG-063). Kartani boshqa bo'limga ko'chirish: tarix saqlanadi, yangi manager avto-bog'lanadi?
- Siz: A — karta ko'chadi, tarix saqlanadi, yangi manager_id (parent) avto; adaptatsiya+ruxsat qayta.
- Isbot: card.service.ts:72 setCardManager + card.repository move() parent_id orqali (cycle-guard WITH RECURSIVE descendants, satr 84-94). cascade/ papka org-o'zgarish kaskadi uchun mavjud. Vertical chain=parent_id.

**01.22  ❌ yo'q**  — ❓ Q22 (EP-ORG-064). Ikki kartani birlashtirish: asosiy tanlanadi, ikkinchi tarix ko'chadi+arxiv?
- Siz: A — asosiy karta + ikkinchisi tarixi ko'chadi, ikkinchisi arxivlanadi.
- Isbot: org-structure modulida mergeCard/birlashtirish endpoint yoki service metodi topilmadi (faqat card-template field merge bor, u boshqa narsa). EP-ORG-064 OCHIQ, qurilmagan.

**01.23  ❌ yo'q**  — ❓ Q23 (EP-ORG-065). Bitta kartani ikkiga bo'lish: yangi 2 karta, eski arxiv+havola?
- Siz: A — yangi ikki karta ochiladi, eski arxivga, havola bilan bog'lanadi.
- Isbot: splitCard endpoint/metod topilmadi. EP-ORG-065 OCHIQ, qurilmagan.

**01.24  🟡 qisman**  — ❓ Q24 (EP-ORG-066). Bir odam ko'p kartada — oylik to'qnashuvi: stavka ulushi yig'iladi, jami ≤1.0?
- Siz: A — har karta stavka ulushi (0.5+0.5=1.0), yig'iladi, 1.0 dan oshmasin; oshsa owner ruxsati.
- Isbot: card.controller.ts:209 GET by-employee/:employeeId → FORMULA-A jami oylik (EP-ORG-142); employee_cards M:N + can-assign atomic guard. Lekin stavka-ulush (rate fraction) ustuni + jami≤1.0 blok/owner-override jonli tasdiqlanmadi (employee_cards da rate maydoni yo'q).

**01.25  🟡 qisman**  — ❓ Q25 (EP-ORG-067). Audit-tarixda nima saqlanadi: maydon, eski/yangi qiymat, kim, qachon, sabab?
- Siz: A — har o'zgarish: maydon, eski qiymat, yangi qiymat, kim, qachon, sabab (to'liq audit).
- Isbot: card.repository listHistory audit_logs(table_name='card') o'qiydi + AuditInterceptor. LEKIN jonli 4 qatorda record_id='unknown', changed_fields=['result:success','action:UPDATE'...] — field-darajali eski/yangi qiymat YO'Q, record_id karta-id ga bog'lanmagan. To'liq audit emas.

**01.26  🟡 qisman**  — ❓ Q26 (EP-ORG-068). O'zgarishga sabab majburiy: pul/razryad o'zgarishida sabab majburiy?
- Siz: A — pul/razryad o'zgarishida sabab majburiy, oddiy maydonlarda ixtiyoriy.
- Isbot: razryad_history.reason + razryad_requests.reason ustunlari BOR (sabab maydoni). Lekin CardUpdateSchema (card.controller.ts:45) salary/razryad o'zgarishida 'reason' MAJBURIY emas — sabab-darvoza qotirilmagan.

**01.27  🟡 qisman**  — ❓ Q27 (EP-ORG-069). Audit-tarixni kim ko'radi: owner+HR+vertikal yuqori boshliq?
- Siz: A — owner+HR+vertikaldagi yuqori boshliq cheklangan; audit-log faqat Super Admin.
- Isbot: Tarix endpoint card.controller.ts:198 @Roles('admin','manager','hr_manager','director','super_admin') — vertikal-yaqinlik (faqat o'z tarmog'i) filtri yo'q; har manager hamma kartani ko'radi. Cheklov to'liq emas.

**01.28  🟡 qisman**  — ❓ Q28 (EP-ORG-070). Audit yozuvi o'chirib bo'lmasligi (faqat qo'shiladi, immutable)?
- Siz: A — faqat qo'shiladi, hech kim o'chira/tahrirlay olmaydi.
- Isbot: audit_logs INSERT-only AuditInterceptor orqali yoziladi (DELETE/UPDATE endpoint yo'q). Lekin DB-darajada immutable kafolat (trigger/REVOKE UPDATE) jonli tasdiqlanmadi — application-darajada append-only.

**01.29  ✅ bor**  — ❓ Q29 (EP-ORG-071). Bo'sh karta 'Vakansiya' holati + ochilgan sana + necha kun bo'sh?
- Siz: A — bo'sh karta 'Vakansiya' holatida + ochilgan sana + necha kun bo'sh.
- Isbot: card.controller.ts:278 PATCH :id/vacant → current_state='vacant'; card.repository listVacancies aging_days=(now-created_at) hisoblaydi. org_departments.current_state 5-holat (active/frozen/vacant/archived/io).

**01.30  ✅ bor**  — ❓ Q30 (EP-ORG-072). Vakansiya aging bosqichlari: 0-14 yashil, 15-45 sariq, 45+ qizil?
- Siz: A — 0-14 yashil, 15-45 sariq, 45+ qizil + ogohlantirish; yagona chegara.
- Isbot: card.repository.ts:317-320 aging_bucket CASE: <=14 '0-14', <=45 '15-45', ELSE '45+'. Vakant tab buni qaytaradi. Chegaralar qotirilgan (yagona).

**01.31  ✅ bor**  — ❓ Q31 (EP-ORG-073). Vakansiya muhimligi (kritik/o'rta/past 3 daraja)?
- Siz: A — 3 daraja prioritet (kritik/o'rta/past).
- Isbot: vacancies.priority ustuni jonli mavjud; card.repository listVacancies priority qaytaradi; hr-vacancies bulk import priority qabul qiladi. Daraja qiymatlari (3 enum) hali to'ldirilmagan (0 qator).

**01.32  🟡 qisman**  — ❓ Q32 (EP-ORG-074). Vakansiya yopilish SLA-muddati (kritik 14/o'rta 30/past 60 kun)?
- Siz: A — muhimlikka qarab maqsadli muddat (SLA).
- Isbot: vacancies.closing_date BOR (qo'lda muddat), LEKIN prioritet→avto-SLA (kritik 14/o'rta 30) hisoblovchi maydon/logika yo'q. sla_days/target_close_date ustuni vacancies da topilmadi.

**01.33  🟡 qisman**  — ❓ Q33 (EP-ORG-075). Kartalarni ommaviy Excel import + xato satrlar ajratiladi?
- Siz: A — Excel shabloni bilan import + xato satrlar ajratib ko'rsatiladi.
- Isbot: org-structure.controller.ts:215 POST nodes/import — Excel bulk import, qator-validatsiya, partial-commit REAL (service.ts:137). Lekin bu org-NODE import; karta-maxsus (razryad/ЦКП/oylik maydonli) Excel shablon import alohida emas.

**01.34  ✅ bor**  — ❓ Q34 (EP-ORG-076). Import xatolari: to'g'ri satrlar yuklanadi, xatolar ro'yxat bilan qaytariladi?
- Siz: A — to'g'ri satrlar yuklanadi, xato satrlar ro'yxat bilan (partial commit + tuzatib qayta yuklash).
- Isbot: org-structure.controller.ts:207-215 izoh 'Per-row validation with a partial commit: every [valid row inserted, invalid returned]'. Partial-commit + xato-ro'yxat REAL implementatsiya.

**01.35  ✅ bor**  — ❓ Q35 (EP-ORG-077). Karta eksport Excel + PDF, tanlangan ustunlar bilan?
- Siz: A — tanlangan ustunlar bilan Excel + PDF.
- Isbot: org-export.service.ts: exportExcel() (ExcelJS, satr 24) + exportPdf() (pdf-lib, satr 139, ko'p sahifa). Ikkala format REAL. (Ustun-tanlash konfiguratsiyasi qisman — to'liq tanlangan-ustun bayroqlari ko'rinmadi.)

**01.36  🟡 qisman**  — ❓ Q36 (EP-ORG-078). Import audit izi (kim, qachon, fayl, satrlar soni alohida yoziladi)?
- Siz: A — import partiyasi alohida yoziladi (kim, qachon, fayl, satrlar soni).
- Isbot: AuditInterceptor import endpointini umumiy log qiladi, lekin import-partiya alohida jadval (fayl nomi + satrlar soni + xato-soni) sifatida saqlanishi tasdiqlanmadi. Umumiy audit bor, partiya-detal yo'q.

**01.37  🟡 qisman**  — ❓ Q37 (EP-ORG-079). Filtr maydonlari: otdeleniye/bo'lim+razryad+holat+lavozim turi+oylik oralig'i?
- Siz: A — to'liq filtr: bo'lim, razryad, holat, lavozim turi, oylik oralig'i.
- Isbot: card.controller.ts:84-95 list faqat departmentId + status filtrlarini qabul qiladi (card.repository WHERE parent_id/current_state). Razryad/lavozim-turi/oylik-oralig'i filtrlari endpoint-darajada YO'Q — qisman.

**01.38  🟡 qisman**  — ❓ Q38 (EP-ORG-080). 'Bo'sh kartalar' tezkor filtri + aging bo'yicha saralash?
- Siz: A — tayyor 'bo'sh kartalar' filtri + aging bo'yicha saralash.
- Isbot: list(status='vacant') bo'sh kartalarni beradi + per-card listVacancies aging_days saralaydi. Lekin global 'bo'sh kartalar' tezkor-filtr tugmasi + aging-sort endpoint alohida tasdiqlanmadi.

**01.39  🟡 qisman**  — ❓ Q39 (EP-ORG-081). Xodim↔karta moslik AI-qidiruv (razryad/malaka/ЦКП tarixi bo'yicha rank)?
- Siz: A — AI moslik balli bilan ranjlangan ro'yxat (razryad/malaka/ЦКП tarixiga qarab).
- Isbot: card.controller.ts:153 GET :id/fit → computeCardFit DETERMINISTIK v1 (card.repository.ts:284): assignment_score (primary/acting) + definition_score (razryad set + portret requirements). REAL signal, lekin AI-rank emas, ЦКП-tarix balliga ulanmagan — soddalashtirilgan v1.

**01.40  ❌ yo'q**  — ❓ Q40 (EP-ORG-082). Saqlangan filtr/ko'rinishlar ('Mening bo'limim bo'sh kartalari')?
- Siz: A — shaxsiy saqlangan ko'rinishlar.
- Isbot: saved_views/saved_filters jadvali yoki endpoint butun src bo'ylab topilmadi (grep saved_filter|saved_view = 0). Qurilmagan.

**01.41  ✅ bor**  — ❓ Q41 (EP-ORG-083). Karta 5 holat: Faol/Vakansiya/I.o./Muzlatilgan/Arxiv?
- Siz: A — 5 holat to'liq qamrov.
- Isbot: card.controller.ts:35 status enum ['active','frozen','vacant','archived','io']; org_departments.current_state ustuni + freeze/thaw/vacant/restore endpointlar (satr 259-290). 5 holat REAL.

**01.42  ✅ bor**  — ❓ Q42 (EP-ORG-084). Kartani muzlatish: 'Muzlatilgan' holati + sabab + muddat?
- Siz: A — 'Muzlatilgan' holati + sabab + muddat.
- Isbot: card.controller.ts:259 PATCH :id/freeze CardFreezeSchema{reason,until}; org_departments.freeze_reason ustuni jonli mavjud. service.freezeCard active/io/vacant→frozen REAL.

**01.43  ✅ bor**  — ❓ Q43 (EP-ORG-085). Karta o'chirish vs arxivlash: hech qachon to'liq o'chmaydi, faqat arxiv?
- Siz: A — hech qachon to'liq o'chirilmaydi, faqat arxivlanadi (tarix saqlanadi).
- Isbot: card.controller.ts:323 DELETE → service.softDelete → card.repository.ts:167 UPDATE is_active=false, current_state='archived' (DELETE FROM yo'q). Soft-delete, tarix saqlanadi.

**01.44  ✅ bor**  — ❓ Q44 (EP-ORG-086). Arxiv kartani tiklash (eski tarix bilan)?
- Siz: A — arxivdan tiklash mumkin, eski tarix bilan.
- Isbot: card.controller.ts:287 PATCH :id/restore → service.restoreCard archived→active (409 agar arxiv emas). Tiklash REAL, FK/tarix saqlanadi (soft-delete tufayli).

**01.45  🟡 qisman**  — ❓ Q45 (EP-ORG-087). Kartadagi 'talablar' strukturali ro'yxat (tur, daraja, majburiy/ixtiyoriy)?
- Siz: A — strukturali ro'yxat, AI o'qiy oladi.
- Isbot: card_required_knowledge jadvali (knowledge_name, category, importance, course_id) + lms card-required-knowledge.controller REAL endpoint. Lekin jonli 0 qator; portret_data.requirements jsonb (erkin) computeCardFit da ishlatiladi — strukturali+erkin aralash, data yo'q.

**01.46  ✅ bor**  — ❓ Q46 (EP-ORG-088). Darslik kartaga bog'lanadi (xodimga emas)?
- Siz: A — darslik kartaga bog'lanadi; xodim kelsa darslikni ko'radi.
- Isbot: card_required_knowledge.course_id (karta→kurs FK) + lms card-employee-assigned.handler.ts (karta biriktirilganda darslik xodimga yuklanadi) + lms-card-gate.service. Darslik karta-markazli REAL (schema+listener).

**01.47  🟡 qisman**  — ❓ Q47 (EP-ORG-089). Kartaga biriktiriladigan hujjatlar (yo'riqnoma+xavfsizlik+ЦКП ta'rifi+fayllar)?
- Siz: A — yo'riqnoma + xavfsizlik + ЦКП ta'rifi + ixtiyoriy fayllar (virtual papka).
- Isbot: card_folders jadvali 6 bo'lim (vazifa/javobgarlik/gsd/reglament/jarayon/talim) + card-folder.controller PUT/GET REAL. Lekin ixtiyoriy fayl-biriktirish (upload/attachment ro'yxati) bo'limi yo'q; matn-bo'limlar bor, fayl-attach qisman. card_folders=0 qator.

**01.48  ❌ yo'q**  — ❓ Q48 (EP-ORG-090). Kerakli jihozlar/uskuna modeli + aktivlar moduliga bog'lanish?
- Siz: A — 'kerakli jihozlar' ro'yxati + aktivlar moduliga bog'lanadi (hozir bu model YO'Q edi).
- Isbot: card_equipment / card_required_assets jadvali yoki aktiv-bog'lanish endpoint org-structure modulida topilmadi. card_folders/card_required_knowledge da jihoz-maydoni yo'q. Vizyon 'hozir YO'Q' deganidek hamon qurilmagan.

**01.49  ✅ bor**  — ❓ Q7 (EP-ORG-049): ЦКП o'lchov turi — SON/FOIZ/VAQT uch tur kartaga moslab tanlanadimi?
- Siz: Uch o'lchov turi bo'lsin (SON dona/tonna, FOIZ %, VAQT kun/soat), har kartaga mosi tanlanadi — AI baholashi uchun.
- Isbot: org_departments.tskp_measurement_unit (varchar) + tskp_formula_type/ckp_formula_type ustunlari BOR; ckp_card_products.formula_type + measurement_unit ham bor. q.cjs: information_schema columns tasdiqladi.

**01.50  ✅ bor**  — ❓ Q8 (EP-ORG-050): ЦКП hisoblash manbasi — iloji bo'lsa tizimdan avtomatik (IoT/MES), bo'lmasa qo'lda?
- Siz: Mashinachi ЦКП avtomatik IoT/MES'dan, mashinasiz AI-bot qo'lda so'raydi; manba belgilanadi.
- Isbot: ckp-mes-feed.listener.ts @OnEvent(MES_COMPLETED) → CkpFactService.recordFact, karta REAL linkdan resolve (operator_card_id→users.card_id→work_center), fabrikatsiya YO'Q. ckp.controller POST /fact = qo'lda manba.

**01.51  ✅ bor**  — ❓ Q9 (EP-ORG-051): ЦКП normasi qayerda — kartada standart + xodimga shaxsiy tuzatish?
- Siz: Kartada standart norma + kerak bo'lsa xodimga shaxsiy tuzatish (moslashuvchan).
- Isbot: org_departments.tskp_target (kartada standart norma) + ckp_personal_targets jadvali (xodimga shaxsiy) — ikkalasi ham mavjud. q.cjs count tasdiqladi (jadval bor, 0 qator).

**01.52  🟡 qisman**  — ❓ Q10 (EP-ORG-052): ЦКП oylikka ta'siri — % bajarilish oylik/bonusga bog'lanadi, hisobot bermaslik → kun oylik yo'q?
- Siz: ЦКП % oylikka bog'lanadi; 16 soat ichida ЦКП yo'q → o'sha kun oylik yozilmaydi (hisobot-gate).
- Isbot: org_departments.ckp_report_deadline_hours BOR + ckp_fact deadline-gate flag listener'da hisoblanadi; lekin ckp_fact_values=0 jonli, payroll-gate'ning ЦКП%→oylik formulasi to'liq jonli ishlamayapti (data yo'q).

**01.53  🟡 qisman**  — ❓ Q11 (EP-ORG-053): Imtihon savol-bank — karta turi + razryad bo'yicha (matn/variant/javob/qiyinlik)?
- Siz: Har karta turi + razryad bo'yicha qayta ishlatiladigan savol-bank (har savol: matn, variantlar, to'g'ri javob, qiyinlik).
- Isbot: hr_question_bank: org_function_id + razryad_level_id + category + question_uz/ru + expected_keywords + difficulty BOR (sxema to'liq); lekin org_functions endi kanonik EMAS (org_departments) — FK eskirgan; lms_exam_questions options+correct_option alohida.

**01.54  🟡 qisman**  — ❓ Q12 (EP-ORG-054): Imtihon savol manbasi — bo'lim boshlig'i/usta yozadi + AI yordam + HR tasdiq?
- Siz: Bo'lim boshlig'i/usta yozadi, AI yordam beradi, HR tasdiqlaydi (sifatli).
- Isbot: hr_question_bank created_by/is_active bor, ai-exam.service AI generatsiya bor; lekin yozish→AI→HR-tasdiq workflow (approval-state) savol-bank jadvalida alohida status ustuni sifatida ko'rinmadi.

**01.55  🔑 egasi-data**  — ❓ Q13 (EP-ORG-055): O'tish chegarasi (ball) — har razryad alohida (1-3→60%, 4-6→75%), amaliy 70/30?
- Siz: Har razryad uchun alohida o'tish chegarasi; amaliy sinov nazariydan ustun (70/30).
- Isbot: razryad_levels.exam_pass_threshold ustuni BOR + razryad kodda ishlatiladi; lekin 6 qator hammasida exam_pass_threshold=NULL (egasi qiymat kiritmagan). q.cjs: barcha threshold NULL.

**01.56  🔑 egasi-data**  — ❓ Q14 (EP-ORG-056): Qayta topshirish qoidasi — 14 kundan keyin, yiliga maks 3 marta?
- Siz: Imtihondan yiqilsa 14 kundan keyin qayta, yiliga maksimal 3 marta (tartibli).
- Isbot: razryad_levels.max_retakes ustuni BOR + razryad.repository/service'da o'qiladi; lekin barcha 6 qatorda max_retakes=NULL (egasi qiymat bermagan). q.cjs tasdiqladi.

**01.57  🟡 qisman**  — ❓ Q15 (EP-ORG-057): Karta shabloni — lavozim turi tanlansa standart maydonlar avto-to'ladi?
- Siz: Lavozim turi tanlansa shablon → karta avtomatik to'ladi, keyin tahrirlanadi (tez, bir xil).
- Isbot: card_templates jadvali (position_type + field_defaults JSONB) + card-template.controller POST :id/apply-template endpoint REAL. Lekin card_templates=0 qator — birorta shablon seed qilinmagan, jonli ishlamaydi.

**01.58  🟡 qisman**  — ❓ Q16 (EP-ORG-058): Shablon o'zgarsa eski kartalar — o'zgarmaydi, faqat 'moslashtirish' tugmasi bilan?
- Siz: Eski kartalar avtomatik o'zgarmaydi; faqat ixtiyoriy 'shablonga moslashtirish' tugmasi (xavfsiz).
- Isbot: apply-template endpoint maydonlarni nusxalaydi (bir martalik, avto-kaskad emas = vizyonga mos); lekin alohida 're-sync to template' tugmasi/diff ko'rsatilmadi. card_templates=0 → jonli sinab bo'lmaydi.

**01.59  ❌ yo'q**  — ❓ Q17 (EP-ORG-059): Shablonlar boshlang'ich to'plami — zavodga xos 10-15 lavozim tayyor?
- Siz: Zavodga xos shablon to'plami oldindan kiritilsin (mashinist/operator/naladchik/OTKchi/logist...).
- Isbot: card_templates=0 qator (q.cjs) — birorta zavod-xos shablon seed qilinmagan; sxema bor, data yo'q.

**01.60  ✅ bor**  — ❓ Q18 (EP-ORG-060): I.o. tayinlash — muddatli (boshlanish-tugash), muddat tugagach avto-qaytadi?
- Siz: Kartaga muddatli i.o. tayinlanadi, muddat tugagach avtomatik qaytadi (aniq).
- Isbot: employee_cards.is_acting + ended_at; ActingRevertCron @Cron('0 1 * * *') → revertExpiredActing(); card.repository on-read guard 'ended_at > now()' expired acting'ni oylik/bandlikdan chiqaradi. Kod REAL.

**01.61  ✅ bor**  — ❓ Q19 (EP-ORG-061): I.o. davridagi oylik — o'z oyligi + i.o. ustamasi (% yoki summa)?
- Siz: I.o. o'z oyligini oladi + i.o. ustamasi (adolatli, rag'batli).
- Isbot: employee_cards.acting_supplement ustuni BOR; card.repository:267-268 oylik yig'indida 'WHEN is_acting THEN acting_supplement ELSE max_salary' formulasi — i.o. faqat ustama oladi, real hisob.

**01.62  🟡 qisman**  — ❓ Q20 (EP-ORG-062): I.o. huquqlari — kunlik operatsiyalar ha, pul/kadr qarorlari yo'q (eskalatsiya)?
- Siz: I.o. kunlik operatsiyalarni qiladi, pul/kadr qarorlari yuqoriga eskalatsiya (muvozanatli).
- Isbot: is_acting=true bo'lganda assignment_score 50 (primary 100) — i.o. cheklangan deb belgilanadi; lekin RBAC'da i.o.-ga pul/kadr qarorini bloklash aniq qoida sifatida org-structure kodida ko'rinmadi.

**01.63  ✅ bor**  — ❓ Q21 (EP-ORG-063): Kartani boshqa bo'limga ko'chirish — tarix saqlanadi, yangi manager_id avto-bog'lanadi?
- Siz: Karta ko'chadi, butun tarix saqlanadi, yangi rahbar (parent) avtomatik bog'lanadi; adaptatsiya+ruxsat qayta.
- Isbot: org_departments.parent_id (karta→karta vertikal) + card.controller PATCH :id/manager (manager qayta bog'lash); cascade/ papkasi OrgCascadeListener transfer kaskadini boshqaradi. Soft-delete tarix saqlanadi.

**01.64  ❌ yo'q**  — ❓ Q22 (EP-ORG-064): Ikki kartani birlashtirish — asosiy tanlanadi, ikkinchi tarix ko'chadi+arxivlanadi?
- Siz: Asosiy karta tanlanadi, ikkinchisining tarixi unga ko'chadi, ikkinchisi arxivlanadi (xavfsiz).
- Isbot: card.controller'da merge endpoint YO'Q (grep 'merge' org-structure'da faqat ES import); arxivlash (archived_at) bor lekin tarix-ko'chirish birlashtirish operatsiyasi qurilmagan.

**01.65  ❌ yo'q**  — ❓ Q23 (EP-ORG-065): Bitta kartani ikkiga bo'lish — yangi 2 karta, eski arxivga, havola bilan?
- Siz: Yangi ikki karta ochiladi, eski arxivga o'tadi, havola bilan bog'lanadi (kuzatiladi).
- Isbot: Karta split endpoint/havola (split_from referens ustuni) org-structure modulida topilmadi; arxivlash bor lekin bo'lish operatsiyasi qurilmagan.

**01.66  🟡 qisman**  — ❓ Q24 (EP-ORG-066): Bir odam ko'p karta — stavka ulushi (0.5+0.5), jami 1.0 dan oshmasin?
- Siz: Har kartaga stavka ulushi, oyliklar yig'iladi, jami 1.0 dan oshmasin; oshsa owner ruxsati.
- Isbot: employee_cards many-to-many (employee_id+card_id) + is_primary + oylik yig'indi formulasi (card.repository:267) REAL; lekin 'stavka ulushi (fraction)' ustuni va jami>1.0 blok/ogoh nazorati ko'rinmadi (faqat is_primary/is_acting).

**01.67  🟡 qisman**  — ❓ Q25 (EP-ORG-067): Audit-tarix — har o'zgarish: maydon/eski/yangi/kim/qachon/sabab?
- Siz: Har o'zgarish to'liq audit: maydon, eski qiymat, yangi qiymat, kim, qachon, sabab.
- Isbot: razryad_history jadvali (razryad o'zgarish tarixi) + audit_trail_log/audit_logs mavjud; lekin org_departments umumiy maydon-darajali (oylik/egasi) before/after audit-tarix to'liq jonli emas, razryad_history=0 qator.

**01.68  🟡 qisman**  — ❓ Q26 (EP-ORG-068): O'zgarishga sabab — pul/razryad o'zgarishida majburiy?
- Siz: Pul/razryad o'zgartirilganda sabab (izoh) majburiy, oddiy maydonlarda ixtiyoriy.
- Isbot: razryad_requests workflow + razryad-history POST :cardId/razryad-requests sabab bilan keladi; lekin oylik (min/max_salary) o'zgartirishda sabab majburiyligi org-structure kodida alohida tasdiqlanmadi.

**01.69  🟡 qisman**  — ❓ Q27 (EP-ORG-069): Tarixni ko'rish huquqi — owner+HR+vertikal yuqori boshliq, audit-log Super Admin?
- Siz: Oylik/razryad tarixi maxfiy: owner + HR + vertikaldagi yuqori boshliq; audit-log faqat Super Admin.
- Isbot: card.controller @UseGuards bilan himoyalangan, rbac_tier ustuni bor; lekin razryad-history endpointlarida 'vertikal yuqori boshliq'gacha cheklash (row-level) aniq RBAC qoidasi sifatida ko'rinmadi.

**01.70  🟡 qisman**  — ❓ Q28 (EP-ORG-070): Audit yozuvi o'chirilmasligi — faqat qo'shiladi (immutable)?
- Siz: Audit-tarix yozuvlari o'chirib/tahrirlab bo'lmaydigan, faqat qo'shiladigan (ishonchli).
- Isbot: razryad_history/audit_trail_log append-pattern (DELETE endpoint yo'q); lekin DB-darajali immutability (trigger/REVOKE UPDATE) tasdiqlanmadi — kod-darajada faqat qo'shiladi.

**01.71  ✅ bor**  — ❓ Q29 (EP-ORG-071): Bo'sh karta holati — 'Vakansiya' + ochilgan sana + necha kun bo'sh?
- Siz: Bo'sh karta 'Vakansiya' holatida, ochilgan sana va necha kun bo'sh ko'rinadi.
- Isbot: org_departments.current_state (5 holat: Vakansiya kiradi) + card.controller PATCH :id/vacant + GET :id/vacancies; vacancies created_at + aging_days hisoblanadi (card.repository:317).

**01.72  ✅ bor**  — ❓ Q30 (EP-ORG-072): Vakansiya aging bosqichlari — 0-14 yashil, 15-45 sariq, 45+ qizil?
- Siz: Bo'sh karta yoshiga qarab rang/bosqich (yashil→sariq→qizil) + ogohlantirish; chegaralar yagona.
- Isbot: card.repository:317-320 — (now()-created_at) AS aging_days, CASE bucket '0-14'/'15-45'/'45+' AS aging_bucket (EP-ORG-072/073 izoh bilan). vacancy-deadline.cron ham bor.

**01.73  🟡 qisman**  — ❓ Q31 (EP-ORG-073): Vakansiya muhimligi — 3 daraja (kritik/o'rta/past)?
- Siz: Har bo'sh kartaga muhimlik darajasi (kritik/o'rta/past) — to'g'ri yopilish tartibi.
- Isbot: card.repository vakant tab 'priority + aging bucket' izohi bor; lekin vacancies jadvalida priority/muhimlik ustuni jonli to'lganligi va 3-daraja enum tasdiqlanmadi (vacancies 0 qator).

**01.74  🟡 qisman**  — ❓ Q32 (EP-ORG-074): Vakansiya SLA — muhimlikka qarab muddat (kritik 14, o'rta 30, past 60)?
- Siz: Vakansiya yopilishi maqsadli muddat (kritik 14, o'rta 30, past 60 kun) — javobgarlik.
- Isbot: vacancy-deadline.cron.ts mavjud (muddat nazorati) + Time-to-Fill; lekin muhimlik→SLA-kun mapping master-data (kritik=14 va h.k.) jonli sozlangani tasdiqlanmadi (vacancies 0 qator).

**01.75  ❌ yo'q**  — ❓ Q33 (EP-ORG-075): Kartalarni ommaviy import — Excel shabloni + xato satrlar ajratib?
- Siz: Mavjud kartalarni Excel orqali ommaviy yuklash + xato satrlar ajratib ko'rsatiladi (tez).
- Isbot: org-structure modulida import endpoint YO'Q — faqat org-export.service (exportExcel/exportPdf). excel_import_batches/rows jadvali umumiy bor lekin karta-import bilan ulanmagan. grep 'import card' = faqat ES import.

**01.76  ❌ yo'q**  — ❓ Q34 (EP-ORG-076): Import xatolarini boshqarish — to'g'ri satrlar yuklanadi, xato ro'yxat bilan qaytadi?
- Siz: To'g'ri satrlar yuklanadi, xato satrlar ro'yxat bilan qaytariladi (tuzatib qayta yuklash).
- Isbot: Karta import endpoint umuman yo'q (Q33), shu sabab xato-satr boshqaruvi ham yo'q. excel_import_rows jadvali bor lekin org-structure'ga ulanmagan.

**01.77  ✅ bor**  — ❓ Q35 (EP-ORG-077): Karta eksport — tanlangan ustunlar bilan Excel + PDF?
- Siz: Kartalar ro'yxati Excel + PDF ga eksport (moslashuvchan, zaxira/hisobot uchun).
- Isbot: org-export.service.ts: exportExcel() (ExcelJS Workbook) + exportPdf() (pdf-lib PDFDocument) REAL implementatsiya; OrgExportRepository'dan ma'lumot oladi.

**01.78  🟡 qisman**  — ❓ Q36 (EP-ORG-078): Import audit izi — partiya (kim/qachon/fayl/satr soni) yoziladi?
- Siz: Import partiyasi alohida yoziladi (kim, qachon, fayl, satrlar soni) — kuzatiladi.
- Isbot: excel_import_batches jadvali (kim/qachon/fayl) sxema sifatida BOR; lekin karta-import o'zi yo'q (Q33), shu sabab audit-iz jonli ishlamaydi — faqat umumiy jadval mavjud.

**01.79  🟡 qisman**  — ❓ Q37 (EP-ORG-079): Filtr maydonlari — otdeleniye/bo'lim+razryad+holat+lavozim turi+oylik oralig'i?
- Siz: To'liq filtr: otdeleniye/bo'lim, razryad, holat (band/bo'sh/i.o.), lavozim turi, oylik oralig'i.
- Isbot: card.controller GET () list filtrlar bilan + org_departments'da filtrlanadigan ustunlar (otdeleniye_no, razryad_level_id, current_state, salary) BOR; lekin GET query barcha 5 filtr o'lchamini qamrashi to'liq tekshirilmadi.

**01.80  🟡 qisman**  — ❓ Q38 (EP-ORG-080): 'Bo'sh kartalar' tezkor filtri — bir tugma + aging saralash?
- Siz: Bir tugma bilan hamma bo'sh/vakansiya kartalar + aging bo'yicha saralash (qulay).
- Isbot: card.controller GET :id/vacancies + current_state='vakansiya' filtr + aging_bucket saralash mantiqi bor; lekin global 'barcha bo'sh kartalar' tezkor-filtr tugmasi (FE) alohida tasdiqlanmadi.

**01.81  🟡 qisman**  — ❓ Q39 (EP-ORG-081): Xodim↔karta moslik qidiruv — AI moslik balli bilan ranjlangan ro'yxat?
- Siz: AI bo'sh kartaga eng mos xodimni moslik balli bilan rang-tartibda ko'rsatadi (razryad/malaka/ЦКП).
- Isbot: card.controller GET :id/fit + :id/can-assign + :id/manager-candidates; card.repository assignment_score (primary 100/acting 50/70) hisoblaydi. Lekin AI razryad+malaka+ЦКП-tarix asosli to'liq moslik-balli jonli emas (data yo'q).

**01.82  ❌ yo'q**  — ❓ Q40 (EP-ORG-082): Saqlangan filtr/ko'rinishlar — shaxsiy saqlangan ('Mening bo'limim bo'sh kartalari')?
- Siz: Tez-tez ishlatiladigan filtrlarni shaxsiy saqlab qo'yish (qulay).
- Isbot: saved_filters jadvali (name/filter_data/created_by) BOR lekin grep: 0 backend kod fayli unga murojaat qiladi — orphan jadval, hech qaerda yozilmaydi/o'qilmaydi.

**01.83  ✅ bor**  — ❓ Q41 (EP-ORG-083): Karta holat qiymatlari — 5 holat (Faol/Vakansiya/I.o./Muzlatilgan/Arxiv)?
- Siz: 5 holat: Faol(band), Vakansiya, I.o., Muzlatilgan, Arxiv — to'liq qamrov.
- Isbot: org_departments.current_state + frozen_at/freeze_reason/freeze_until (muzlatilgan) + archived_at (arxiv) + is_acting (i.o.) + vacancy. card.controller PATCH freeze/thaw/vacant/restore — barcha 5 holat o'tishi REAL.

**01.84  ✅ bor**  — ❓ Q42 (EP-ORG-084): Kartani muzlatish — 'Muzlatilgan' holati + sabab + muddat?
- Siz: Kartani o'chirmasdan vaqtincha muzlatish: holat + sabab + muddat (moslashuvchan).
- Isbot: org_departments.frozen_at + freeze_reason + freeze_until ustunlari BOR; card.controller PATCH :id/freeze + :id/thaw endpointlari REAL.

**01.85  ✅ bor**  — ❓ Q43 (EP-ORG-085): Karta o'chirish vs arxivlash — hech qachon to'liq o'chmaydi, arxivlanadi?
- Siz: Karta hech qachon to'liq o'chirilmaydi, faqat arxivlanadi (tarix saqlanadi).
- Isbot: org_departments.archived_at + deleted_at/deleted_by (soft-delete) ustunlari BOR; card.controller DELETE soft-delete qiladi (FK tarix saqlanadi), PATCH :id/restore tiklaydi.

**01.86  ✅ bor**  — ❓ Q44 (EP-ORG-086): Arxiv kartani tiklash — arxivdan eski tarix bilan qayta faollashtirish?
- Siz: Arxivlangan karta keyin eski tarix bilan qayta faollashtiriladi (mavsumiy ish uchun).
- Isbot: card.controller PATCH :id/restore endpoint REAL (deleted_at NULL'ga qaytaradi, FK orqali tarix saqlanib qoladi). Soft-delete pattern tasdiqlandi.

**01.87  🟡 qisman**  — ❓ Q45 (EP-ORG-087): Kartadagi 'talablar' ro'yxati — strukturali (tur/daraja/majburiy)?
- Siz: Har talab strukturali (tur, daraja, majburiy/ixtiyoriy) — AI o'qiy oladi.
- Isbot: card_required_knowledge (knowledge_name+category+importance+course_id) strukturali talab-bilim jadvali BOR (3 kod fayli); lekin 0 qator + ta'lim/tajriba-yil/dastur kabi malaka talab strukturasi (Q64/EP-ORG-106) alohida ustunlar sifatida emas.

**01.88  ✅ bor**  — ❓ Q46 (EP-ORG-088): Darslik kartaga bog'lanishi — xodim kelsa darslikni ko'radi?
- Siz: Darslik kartaga biriktiriladi (xodimga emas); xodim almashsa ham qoladi.
- Isbot: card_required_knowledge.course_id (kartaga kurs/darslik bog'lanishi) + lms_card_mentors.course_id; darslik card_id orqali kartaga bog'lanadi — sxema vizyonga mos (kartaga, xodimga emas).

**01.89  🟡 qisman**  — ❓ Q47 (EP-ORG-089): Kartaga hujjatlar — yo'riqnoma+xavfsizlik+ЦКП ta'rifi+ixtiyoriy fayllar?
- Siz: Karta = virtual papka: yo'riqnoma + xavfsizlik + ЦКП ta'rifi + ixtiyoriy fayllar (to'liq).
- Isbot: card_folders 6 bo'lim (vazifa/javobgarlik/gsd/reglament/jarayon/talim) + card-folder.controller GET/PUT REAL; lekin biriktiriladigan FAYL (yo'riqnoma PDF/video) modeli card_folders'da ko'rinmadi — matn bo'limlar bor, fayl-papka qisman.

**01.90  ❌ yo'q**  — ❓ Q48 (EP-ORG-090): Kerakli jihozlar/uskuna modeli — ro'yxat + aktivlar moduliga bog'lanadi?
- Siz: Karta 'kerakli jihozlar' ro'yxatiga ega + aktivlar/ombor moduliga bog'lanadi (hozir model YO'Q edi).
- Isbot: org-structure modulida 'kerakli jihozlar/voositalar' jadvali yoki ustuni topilmadi; card-required-knowledge faqat bilim, jihoz-aktiv bog'lanish modeli qurilmagan (memory ham 'YO'Q' degan).

**01.91  🟡 qisman**  — ❓ Q49 (EP-ORG-091): Razryad o'sish yo'li — 'keyingi razryad + shart (imtihon/tajriba/ЦКП)'?
- Siz: Har razryad uchun keyingi razryad + o'tish sharti ko'rsatiladi (aniq karyera yo'li).
- Isbot: razryad_levels.min_months + min_requirement + exam_type ustunlari (o'sish sharti) BOR + razryad_requests workflow; lekin 'keyingi razryad → shart' aniq karyera-pog'ona (next_level_id + condition) strukturasi tasdiqlanmadi.

**01.92  🟡 qisman**  — ❓ Q50 (EP-ORG-092): Razryad attestatsiya — xavfli kartalarda davriy (har 2 yil), o'tmasa muzlatib qayta?
- Siz: Xavfli/texnik kartalarda davriy attestatsiya (har 2 yil), o'tmasa muzlatib qayta imtihon.
- Isbot: org_departments.next_attestation_date ustuni BOR (davriy attestatsiya sanasi); lekin 'o'tmasa → muzlatib qayta imtihon' avto-trigger cron'i va 'xavfli karta' tegi jonli ishlatilgani tasdiqlanmadi.

**01.93  🟡 qisman**  — ❓ Q51 (EP-ORG-093): Karta tayinlanish (past moslik) — ogohlantiradi+sabab so'raydi, lekin bloklamaydi?
- Siz: Past moslikda ogohlantiradi + sabab so'raydi, lekin bloklamaydi (owner qaror qiladi).
- Isbot: card.controller GET :id/can-assign + :id/fit (moslik tekshirish) + POST :id/assign; can-assign mantiqi bor, lekin past-moslikda ogohlantirish+sabab-so'rash (warn-not-block) oqimi jonli tasdiqlanmadi.

**01.94  🟡 qisman**  — ❓ Q52 (EP-ORG-094): Bir kartada nechta odam — 'stavka soni' (3 stavka), har stavkaga 1 xodim, tungi ustama?
- Siz: Kartada stavka soni (masalan 3), har stavkaga bitta xodim — smenani qamraydi; tungi smena ustamasi %.
- Isbot: employee_cards bir card_id ko'p xodimni qabul qiladi (many) + org_departments.work_schedule; lekin aniq 'stavka soni (headcount/seats)' ustuni va tungi-ustama % org_departments'da ko'rinmadi.

**01.95  🟡 qisman**  — ❓ Q53 (EP-ORG-095): Karta = 12 bo'limli zavod yo'riqnoma shabloni (to'la to'ldirilmasa 'tugallanmagan')?
- Siz: Har karta zavodning 12 majburiy bo'limli 'Лавозим йўриқномаси' shabloniga mos, to'liqlik% bilan.
- Isbot: card_folders 6 bo'lim (vazifa/javobgarlik/gsd/reglament/jarayon/talim) qurilgan — vizyon-007 ga mos; lekin zavod 12-bo'limli shablon (xatolar/muvaffaqiyat/huquq/javobgarlik/statistika alohida) to'liq emas + card_folders=0 qator.

**01.96  🟡 qisman**  — ❓ Q54 (EP-ORG-096): Har kartaga '1-4 продукт' slotlari (ЦКП'dan ajralgan), har продукт alohida kuzatiladi?
- Siz: Karta ichida 'ЦКП + 1..N продукт' ro'yxati, har продукт alohida kuzatiladi (kunlik hisobot/AI uchun).
- Isbot: ckp_card_products jadvali (card_id+product_id+target_value+formula_type+measurement_unit) sxema sifatida BOR; lekin faqat 1 kod fayli (ckp-fact.repository) murojaat qiladi, 0 qator — deyarli ulanmagan, kunlik kuzatuv jonli emas.

**01.97  🟡 qisman**  — ❓ EP-ORG-097: Karta xato-katalogi bo'lsinmi — hodisa shu katalogdan tanlanadi, statistika to'planadi?
- Siz: Har kartada 'Кўп учрайдиган хатолар' ro'yxati; hodisa ro'yxatdan belgilansa kim qaysi xatoni takrorlayotgani ko'rinadi, AI ogohlantiradi (kitob-grounded).
- Isbot: error_catalog jadval (card_id,code,category,severity) + ErrorCatalogController(CRUD) + ckp-fact errorCode→error_catalog.code link MAVJUD; lekin error_catalog=0 qator, statistik agregat (takror-xato signali) hali yo'q. card.repository.ts, error-catalog.controller.ts

**01.98  ❌ yo'q**  — ❓ EP-ORG-098: 'Муваффақиятли ҳаракатлар' AI-baho ijobiy mezoni bo'lsinmi (xato+yaxshi to'liq baho)?
- Siz: Kartada ideal-xodim namunasi; AI 'muvaffaqiyatli harakatlarni bajaryaptimi'ni baholaydi, faqat xatoni emas.
- Isbot: org_departments/card_folders'da 'success_actions'/muvaffaqiyatli ustun YO'Q; grep success_action/muvaffaqiyatli → org-structure'da hech narsa. AI-fit report freeform (alohida ijobiy-mezon maydoni yo'q).

**01.99  ✅ bor**  — ❓ EP-ORG-099: Har kartada Департамент№+Бўлим№+Секция 3-darajali manzil majburiymi?
- Siz: Zavod kodi: '5-Департамент, 13-бўлим, Секция планирования'; daraxtda o'rni aniq, hisobot dept/bo'lim/sektsiya kesimida.
- Isbot: org_departments: parent_id+hierarchy_level+node_type+otdeleniye_id+otdeleniye_no+code; 145 qator daraxt qurilgan (org-queries.repo). 3-daraxt vertikal mavjud.

**01.100  🟡 qisman**  — ❓ EP-ORG-100: 7 Departament nomlari qotirilgan master-ro'yxat (ikki-olam tugaydi)?
- Siz: 1-Ходимлар..7-Администрация qotirilgan; hamma karta shulardan biriga tegishli, 2-dept-olam tugaydi.
- Isbot: otdeleniye_no(1-7) ustun + otdeleniye_id mavjud; lekin 7-nom seed BO'SH (statistics_type_set=0 kabi data kiritilmagan). Struktura bor, master-ro'yxat data=egasi.

**01.101  🔑 egasi-data**  — ❓ EP-ORG-101: 4 va 5-Departament ('Ишлаб чиқариш') chegarasi qanday — owner aniqlasin?
- Siz: 4=bevosita IC (dastgoh/operator), 5=qo'llab-quvvatlash (sifat/режа/дизайн/конструктор).
- Isbot: OCHIQ qaror (decisions: EP-ORG-101 🔵). Kod chegaralovchi maydonni qo'llab-quvvatlaydi (node_type/department), lekin chegara=egasi belgilashi kerak.

**01.102  🟡 qisman**  — ❓ EP-ORG-102: Har bo'lim/karta 'НО-1..НО-14' kodini saqlasinmi (eski hujjat ulanishi)?
- Siz: Eski оргполитика 'НО-3 га ҳисобот' kodlari bilan bog'liq; ERP shu kodni saqlasa meros ulanadi.
- Isbot: org_departments.code + otdeleniye_code ustunlari bor (umumiy kod), lekin maxsus 'НО-kod' maydoni/seed yo'q; eski-hujjat ulanish mexanizmi qurilmagan.

**01.103  🟡 qisman**  — ❓ EP-ORG-103: РД-4/РД-5 'qaror beruvchi rol' karta atributi — tasdiq oqimi shunga bog'lanadimi?
- Siz: Mustaqil ishga ruxsatni РД-4 beradi; org-sxemadan avto-routing tasdiq zanjiri.
- Isbot: org_departments.rbac_tier ustun + approval-chain endpoint (org-structure.controller:425 nodes/:id/approval-chain, manager-chain) MAVJUD; lekin aniq 'РД-4/РД-5' atribut-tegi alohida yo'q, manager_id-zanjirga tayanadi.

**01.104  🟡 qisman**  — ❓ EP-ORG-104: Karta = 'Лавозим папкаси' konteyneri (yo'riqnoma+оргполитика+darslik+контрольный лист)?
- Siz: Har lavozim papkasi raqamli konteyner; xodim lavozimga oid hammasini bir joyda ko'radi.
- Isbot: card_folders jadval (vazifa,javobgarlik,gsd,reglament,jarayon,talim=6 bo'lim) + CardFolderController(Get/Put) + position-folder.service MAVJUD; lekin 6-bo'lim (vizyon), zavod 12-bo'limi emas; card_folders=0 qator.

**01.105  ❌ yo'q**  — ❓ EP-ORG-105: Контрольный лист — har bo'lim 'o'qildi-tasdiqladim'+sana+raqamli imzo?
- Siz: Yuridik himoya: xodim har bo'limni o'qib imzolaydi, hammasi tasdiqlanmaguncha 'tayyor emas'.
- Isbot: card_signatures/acknowledgment/контрольный-лист jadval YO'Q (grep kontrolniy/acknowledg/control-list → 0). Bo'lim-darajali o'qildi-tasdiq mexanizmi qurilmagan.

**01.106  🟡 qisman**  — ❓ EP-ORG-106: Малака талаблари strukturali maydonlar (ta'lim/tajriba-yil/dastur/ko'nikma)?
- Siz: AI 'talab 2-3 yil, xodimda 1 yil' deb solishtirsin; strukturasiz solishtirib bo'lmaydi.
- Isbot: card_required_knowledge jadval (knowledge_name,category,importance,course_id) + repo(findByCard/insert/update) MAVJUD; lekin ta'lim/tajriba-yil/dastur alohida strukturali ustun emas — umumiy 'knowledge' ro'yxati. 0 qator.

**01.107  ❌ yo'q**  — ❓ EP-ORG-107: 'Иш жойи ва воситалари' karta jihoz/vosita ro'yxati (inventar bilan bog'liq)?
- Siz: Har lavozim jihoz talab qiladi; yangi xodimga nima berish + inventarizatsiya bog'lash.
- Isbot: org_departments/card_folders'da jihoz/vosita/equipment ustun YO'Q; aktivlar moduliga karta-bog'lanish qurilmagan (EP-ORG-090 bilan bir, lekin jadval yo'q).

**01.108  ✅ bor**  — ❓ EP-ORG-108: 'Бўйсуниш' karta→karta vertikal (manager_id=karta, NULL muammosi hal)?
- Siz: Bo'ysunish kartadan kartaga; rahbar o'zgarsa ham zanjir buzilmaydi (manager_id 0/30 NULL muammosi hal).
- Isbot: org_departments.manager_id (karta→karta) + card.controller PATCH :id/manager + manager-chain/:nodeId + admin/backfill-manager-ids endpoint. Vertikal zanjir karta-darajada wired.

**01.109  🟡 qisman**  — ❓ EP-ORG-109: Standart javobgarlik bandlari (energiya/sir/moddiy-ma'naviy) avtomatik qo'shilsinmi?
- Siz: Bu bandlar har yo'riqnomada bir xil; avtomatik qo'shilsa karta yuridik to'liq.
- Isbot: card_folders.javobgarlik ustuni bor (javobgarlik matni saqlanadi), lekin 'standart bandlar avtomatik in'eksiya' mexanizmi (energiya/sir auto-seed) qurilmagan; matn qo'lda.

**01.110  ❌ yo'q**  — ❓ EP-ORG-110: Karta 'ҳуқуқлари' ERP harakatiga bog'lansinmi (so'rov yuborish tugmasi)?
- Siz: Huquq qog'ozda qolmasin; 'ma'lumot so'rash huquqi' → ERP'da so'rov yuborish tugmasi.
- Isbot: org_departments/card_folders'da rights/huquq→action ustun yoki bog'lanish YO'Q; huquq-ERP-harakat mexanizmi qurilmagan (grep card_right/huquq → org-structure'da yo'q).

**01.111  ✅ bor**  — ❓ EP-ORG-111: ЦКП tur tegi (mahsulot/holat/foiz) + o'lchov usuli biriktirilsinmi?
- Siz: AI 'ЦКП bajarildimi?' javob bersin — mahsulot=bor/yo'q, holat=sifat, foiz=raqam; tur belgilanmasa o'lchab bo'lmaydi.
- Isbot: ckp-fact.service 4 kanonik formula-tur: boolean(holat)/foiz/vaqt/quantity_pct; org_departments.tskp_formula_type + ckp_card_products.formula_type per-slot. calcAchievement to'liq wired (ckp-fact.service.ts:101).

**01.112  ✅ bor**  — ❓ EP-ORG-112: ЦКП ierarxik bog'lanadimi (quyi→yuqori, yuqori karta quyilardan to'planadi)?
- Siz: Operator ЦКП → bo'lim ЦКП → otdeleniye ЦКП oqadi; 'bo'lim ЦКП bajarilmadi chunki 3 operator qoldi' ko'rinadi.
- Isbot: CkpCascadeListener @OnEvent(CKP_REPORTED) → ancestorChain + rollupParentDay (ota→otdeleniye→CEO subtree re-agregat, ROLLUP double-count yo'q). ckp-cascade.listener.ts:55-109.

**01.113  🟡 qisman**  — ❓ EP-ORG-113: 'Статистик кўрсаткичлар' avtomatik KPI maydonlari modullardan to'lsinmi?
- Siz: Zavod har lavozim uchun qaysi raqam o'lchanishini yozgan; avtomatik hisoblansa oylik/bonus/AI-baho asosli.
- Isbot: org_departments.statistics_type ustun + CkpMesFeedListener MES→ЦКП avto-feed wired; lekin statistics_type_set=0 (data yo'q) + ЦКП'dan boshqa statistik-ko'rsatkich (режа%/брак% alohida) avto-feed uzilgan.

**01.114  ✅ bor**  — ❓ EP-ORG-114: Rahbar kartasi KPI'si quyi kartalardan avtomatik to'planadimi?
- Siz: Rahbar shaxsan emas, bo'limi orqali baholanadi; quyi kartalardan to'plansa 'bo'liming yaxshi=sen yaxshi'.
- Isbot: CkpCascadeListener rollupParentDay rahbar-kartaga subtree leaf-faktlardan agregat yozadi (EP-ORG-112 mexanizmi ayni); ckp-cascade.listener handle() ancestors loop.

**01.115  🟡 qisman**  — ❓ EP-ORG-115: Yangi xodim 2-oy o'qish+imtihon→karta bosqichli faollashuvi (oylikка ta'sir)?
- Siz: biriktirildi→o'qish(2oy)→imtihon→rahbar xulosasi→mustaqil-faol; o'qish davri kamaytirilgan stavka.
- Isbot: org_departments.current_state (5-holat) + lms-card-gate.service (darslik tugamasa oylik yo'q) MAVJUD; lekin to'liq onboarding 8-bosqich status zanjiri (o'qish→imtihon→rahbar-xulosa) + bosqichli oylik wired emas (current_state data=0).

**01.116  🟡 qisman**  — ❓ EP-ORG-116: Onboarding davrida kartaga 'мураббий'(mentor-karta) biriktirilsinmi?
- Siz: O'qitish sifati mentorga bog'liq; 'kim o'rgatdi, qancha vaqtda mustaqil bo'ldi' ko'rinadi, mentorga rag'bat.
- Isbot: lms_card_mentors jadval (card_id,mentor_user_id,course_id) + hr_mentorship_pairings(mentor_id,mentee_id) + mentorships MAVJUD; lekin 0 qator, 2-mentor (adaptatsiya+kasbiy) ajratish data-darajada yo'q.

**01.117  ❌ yo'q**  — ❓ EP-ORG-117: Оргполитикalar 'СЕРИЯ' bo'yicha kartalarga biriktirilsinmi (kun-tartibi/telefon/ta'til)?
- Siz: Har karta ma'lum оргполитикaga bo'ysunadi; xodim o'ziga taalluqli qoidalarni bir joyda ko'radi.
- Isbot: org-structure'da seriya/orgpolitika-binding jadval yoki ustun YO'Q (grep seriya/orgpolit → org-structure'da 0). Karta↔политика biriktirish qurilmagan.

**01.118  ❌ yo'q**  — ❓ EP-ORG-118: 'Унвон' lavozimdan alohida maydon (razryad/rutba, rasmiy hujjatga mos)?
- Siz: Bir lavozimda turli unvon (katta/oddiy operator); buyruqda 'лавозим,унвон,фамилия' alohida yoziladi.
- Isbot: org_departments'da 'unvon'/title alohida ustun YO'Q (faqat position_name org_functions'da, razryad_level_id bor). Unvon razryaddan ajratilmagan.

**01.119  🟡 qisman**  — ❓ EP-ORG-119: Karta smena-tegi (3-smena, IC kartalari smena bo'yicha ko'payadi)?
- Siz: Operator kartalari smena bo'yicha ko'payadi; kim qaysi smenada, smena ustamasi — hammasi aniq.
- Isbot: org_departments.work_schedule (jsonb) ustun + ShiftSchedule (hr) mavjud; lekin karta-darajali 'smena-teg' avtomatik ko'paytirish + smena-ustama oylik wired emas. work_schedule data=0.

**01.120  🟡 qisman**  — ❓ EP-ORG-120: Karta 'кун тартиби'(ish-vaqt rejimi)ga bog'lanib davomat solishtirilsinmi?
- Siz: Davomat kartaga bog'liq; har karta qaysi vaqt-rejimga bo'ysunishini bilsa kim kech keldi avtomatik.
- Isbot: org_departments.work_schedule ustun MAVJUD (ish-vaqt rejimi saqlanadi); lekin davomat (AI kamera) ↔ work_schedule solishtirish mexanizmi org-structure'da wired emas, data=0.

**01.121  ✅ bor**  — ❓ EP-ORG-121: Karta 'hisobot majburiyati' tegi (davriylik+qabul qiluvchi), bermaslik avto-aniqlanadimi?
- Siz: Kim kunlik hisobot bermadi avtomatik ko'rinadi; bermaslik jazosi (3-soat→ishlamagan).
- Isbot: org_departments.ckp_frequency + ckp_report_deadline_hours + ckp-fact.service calcDeadline (deadline o'tdi→deadline_passed flag, oylik-gate). recordFact deadline mexanizmi to'liq.

**01.122  🟡 qisman**  — ❓ EP-ORG-122: Karta 'domen-bilim'(qog'oz/gofra turlari) ro'yxati, LMS darsligi bog'lanadimi?
- Siz: Yadro texnik bilim; karta darslik bilan bog'lasa operator kerakli materiallarni o'rganadi, imtihon shu bilimdan.
- Isbot: card_required_knowledge jadval (knowledge_name+course_id LMS-link) + drizzle-card-required-knowledge.repo + card-required-knowledge.controller MAVJUD; lekin 0 qator (qog'oz/gofra domen-bilim seed yo'q).

**01.123  ❌ yo'q**  — ❓ EP-ORG-123: Karta korporativ raqam + ruxsat etilgan abonent doirasini saqlasinmi?
- Siz: Zavod aloqa xavfsizligini kartaga bog'lagan; kim qaysi raqam, kim bilan gaplashishi, НО-3 nazorat.
- Isbot: org_departments'da phone/abonent ustun YO'Q (faqat telegram_group_id bor). Korporativ raqam+abonent-doira modeli qurilmagan.

**01.124  🟡 qisman**  — ❓ EP-ORG-124: Таътил tasdig'i i.o.+vazifa-topshirish ro'yxati to'ldirilgandan keyinmi?
- Siz: Rahbar yo'qligida bo'lim to'xtamasin; taътil tasdiqi uzilishsiz i.o.+vazifa-topshirishga bog'liq.
- Isbot: HR taътил (leave) workflow mavjud, lekin org-structure karta-darajasida i.o.(acting)+vazifa-topshirish majburiy-gate jadval/endpoint YO'Q (acting tayinlash EP-ORG-060 ham OCHIQ, karta-acting jadval yo'q).

**01.125  🟡 qisman**  — ❓ EP-ORG-125: Karta versiyalanadimi (eski saqlanadi, versiya o'zgarsa qayta tasdiq)?
- Siz: Контрольный лист — xodim ma'lum versiyani tasdiqlaydi; yo'riqnoma o'zgarsa qayta tasdiq.
- Isbot: org_departments deleted_at/soft-delete + card history endpoint (audit-tarix) mavjud; lekin karta to'liq versiyalash (v1/v2 snapshot + qayta-tasdiq trigger) alohida emas. org_chart_snapshots umumiy daraxt-snapshot.

**01.126  ❌ yo'q**  — ❓ EP-ORG-126: Karta 2 raqamli imzo bilan kuchga kirsinmi (tasdiqlovchi RD+tanishgan xodim)?
- Siz: Karta tasdiqlovchi imzolaganda kuchga kiradi, xodim tanishganda majburiy; ikki imzosiz rasmiy emas.
- Isbot: card_signatures jadval YO'Q (grep card.*signature → org-structure'da 0). Ikki-taraflama raqamli imzo+kuchga-kirish mexanizmi qurilmagan.

**01.127  🟡 qisman**  — ❓ EP-ORG-127: Karta 2 qatlam — vazifa ta'rifi + amaliy qadamlar (Иш йўриқномаси)?
- Siz: Лавозим=vazifa, Иш йўриқномаси=qanday qadam-baqadam; ikkalasi kartada bo'lsa xodim nima+qanday biladi.
- Isbot: card_folders.jarayon ustuni 'jarayon'ni qisman qoplaydi; lekin alohida 'amaliy qadam-baqadam (Иш йўриқномаси)' strukturali qatlam yo'q. function_description bitta matn.

**01.128  🟡 qisman**  — ❓ EP-ORG-128: Karta mashq/test to'plamiga ega, imtihon shundan tuziladi (AI baholaydi)?
- Siz: Imtihon manbai; har lavozim mashq+vaziyat-savol (A/B/V); kartaga bog'lansa imtihon avtomatik tuziladi.
- Isbot: org_departments.ai_exam_enabled flag + ExamPassedRazryadListener (imtihon→razryad) + LMS test moduli MAVJUD; lekin karta-darajali 'Сборник упражнений' to'plam jadvali yo'q, savol-bank ustun-sxemasi OCHIQ (EP-ORG-053 🔵).

**01.129  ❌ yo'q**  — ❓ EP-ORG-129: Karta atamalar lug'ati (Глоссарий), darslikda tooltip?
- Siz: Yangi xodim 'крафлайнер/флютинг' bilmaydi; bog'langan lug'at o'qishni tezlashtiradi.
- Isbot: glossary/glossariy jadval yoki ustun YO'Q (grep glossar → org-structure'da 0). Karta↔atamalar-lug'at bog'lanish qurilmagan.

**01.130  ✅ bor**  — ❓ EP-ORG-130: 4 ЦКП formula turi (miqdor%/sifat/muddat%/holat) har kartaga biriktirilsinmi?
- Siz: Zavod ЦКП'lari har xil tabiat (смена=max-yuklanish%, логистика=bor/yo'q); bitta formula hammaga to'g'ri kelmaydi.
- Isbot: ckp-fact.service CKP_FORMULA_QUANTITY_PCT/FOIZ/VAQT/BOOLEAN — aynan 4 tur calcAchievement(); org_departments.tskp_formula_type per-karta + 3-bosqich override (global/product/personal). ckp-fact.service.ts:25-119.

**01.131  🟡 qisman**  — ❓ EP-ORG-131: Karta MINIMAL razryad talab + xodim razryadi, AI moslik tekshiradimi?
- Siz: Karta 4-razryad talab, xodim 3-razryad→mos emas; razryad→talab→o'sish→oylik mantiq.
- Isbot: org_departments.razryad_level_id (karta talabi) + card.controller :id/fit + :id/can-assign (AI-moslik) + AiFitService MAVJUD; lekin xodim-razryad↔karta-razryad strukturali gap-tekshiruv data va AI-kalitga bog'liq (egasi-data).

**01.132  🟡 qisman**  — ❓ EP-ORG-132: AI gap-analiz (talab vs xodim haqiqat farqlari ro'yxati) → o'qish rejasi?
- Siz: Kartaning qiymati — AYNAN nima yetishmasligini ko'rsatish; gap-ro'yxatdan darslik avtomatik tuziladi.
- Isbot: AiFitService cardRequirements↔employeeProfile AI-prompt→fit_score+fit_report (ai-fit.service.ts:33-47); lekin report freeform (strukturali field-by-field gap-ro'yxat emas) + gap→darslik avto-reja uzilgan. AI-kalit kerak.

**01.133  ❌ yo'q**  — ❓ EP-ORG-133: Karta 'majburiy tizim-qaydlari'(ish boshlandi/bosqich/tugadi), bajarilmasa signal?
- Siz: ERP ma'lumot sifati shu qaydlarga bog'liq (A-System o'rnini bosadi); qayd qilinmasa AI signal.
- Isbot: org_departments'da 'majburiy tizim-qaydlari' ro'yxati ustun/jadval YO'Q; karta-darajali MES-qayd-majburiyat + signal mexanizmi qurilmagan (OCHIQ EP-ORG-133 🔵).

**01.134  🟡 qisman**  — ❓ EP-ORG-134: Razryad pasayish faqat aniq triggerdan (statistik+takror-xato+qayta-imtihon), RD-4 tasdiq?
- Siz: Pasayish og'riqli — aniq isbotli trigger; xato-katalog+statistik-ko'rsatkichdan kelib chiqsa adolatli.
- Isbot: razryad-history.service + RazryadHistoryController (razryad o'zgarish audit) + error_catalog (xato manbai) MAVJUD; lekin avto-pasayish-trigger (statistik chegara→AI taklif→RD-4) zanjiri wired emas. razryad-history.controller.ts

**01.135  ❌ yo'q**  — ❓ EP-ORG-135: Bo'sh продукт slotlari 'tugallanmagan' + rahbarga to'ldirish topshirig'i?
- Siz: Bo'sh продукт=ЦКП mavhum; tizim bo'sh slotlarni ko'rsatsa kartalar asta to'liq bo'ladi.
- Isbot: ckp_card_products jadval bor (slot saqlanadi), lekin 'bo'sh-slot→tugallanmagan→Kanban-topshiriq' CRON/signal mexanizmi YO'Q; ckp_card_products=0 qator.

**01.136  ❌ yo'q**  — ❓ EP-ORG-136: Vakant karta ЦКП'sini vaqtincha yuqori/qo'shni karta bajaradimi?
- Siz: Bo'sh karta=bajarilmaydigan ЦКП=uzilish; hech bir ЦКП egasiz qolmasin, kim qoplashi avtomatik.
- Isbot: Vakant-ЦКП→yuqori/qo'shni karta avto-o'tkazish mexanizmi YO'Q (i.o. EP-ORG-060 ham OCHIQ, acting jadval yo'q). card.controller :id/vacant faqat holat o'zgartiradi, ЦКП qoplash yo'q.

**01.137  ✅ bor**  — ❓ EP-ORG-137: Karta 'oxirgi ko'rib chiqilgan sana'ni saqlab, 1-yil oshsa eslatma?
- Siz: Eskirgan karta=haqiqatga mos kelmaydigan ish ta'rifi; davriy ko'rib chiqish kartalarni tirik saqlaydi.
- Isbot: org_departments.last_reviewed_at + card.repository staleExpr (last_reviewed_at<now()-1year) + card.controller PATCH :id/review (NOW() bilan reset). card.repository.ts:47,554.

**01.138  🟡 qisman**  — ❓ EP-ORG-138: Kartadan rasmiy 'Должностная инструкция' PDF (12 bo'lim+2 imzo joyi) avtomatik chiqadimi?
- Siz: Zavod qog'oz+imzo bilan ishlaydi; kartadan rasmiy hujjat avto-chiqsa raqamli↔qog'oz mos, qo'lda qayta yozish yo'q.
- Isbot: org-structure.controller GET export/pdf + OrgExportService (pdf-lib) MAVJUD; lekin generic org-chart PDF (ID/nom/parent/rahbar/ЦКП), 12-bo'limli rasmiy yo'riqnoma + 2 imzo-joy SHABLONI emas. org-export.service.ts

**01.139  ❌ yo'q**  — ❓ EP-ORG-139: Karta штат-reja birligiga bog'lanadimi (tasdiqlangan o'rin vs to'lgan, byudjet)?
- Siz: Штат-reja moliyaviy planlash; qancha o'rin tasdiqlangan/to'lgan, bo'sh o'rin+byudjet ko'rinadi.
- Isbot: staffing/shtat jadval yoki ustun YO'Q (grep staffing/shtat → org-structure'da 0). Karta↔штат-reja birligi + byudjet bog'lanish qurilmagan (OCHIQ EP-ORG-139 🔵).

**01.140  🟡 qisman**  — ❓ EP-ORG-140: 'Mutaxassis karta' shabloni alohida (тех karta/loyiha bilan bog'langan ЦКП)?
- Siz: Texnolog/konstruktor ЦКП='тех karta tayyorligi', statistik ko'rsatkichi boshqacha; umumiy shablon to'g'ri kelmaydi.
- Isbot: card_templates jadval (position_type,field_defaults) + CardTemplateService.applyTemplate→karta urug'lash MAVJUD; lekin 'mutaxassis'-tur ajratilgan shablon seed yo'q (card_templates=0), position_type erkin.

**01.141  🟡 qisman**  — ❓ EP-ORG-141: Karta holatlari to'liq (qoralama→tasdiqlangan→o'qish→imtihon→faol→vakant→muzlatilgan→arxiv)?
- Siz: Mavjud 5 holatga onboarding (o'qish/imtihon) bosqichi qo'shilsa oylik bosqichli, 'faol' faqat imtihondan keyin.
- Isbot: org_departments.current_state + frozen_at/freeze_reason/freeze_until + archived_at + vacant/restore endpointlar MAVJUD (5-holat: faol/vakant/i.o./muzlatilgan/arxiv); lekin onboarding bosqichlari (qoralama/o'qish/imtihon) status enum'ga qo'shilmagan, current_state data=0.

**01.142  🔑 egasi-data**  — ❓ EP-ORG-142: Ko'p-karta oylik yig'ish qoidasi (asosiy to'liq + qo'shimcha 30-50%)?
- Siz: 'Oylik=yig'indi' bir kishi 2 to'liq oylik olsa qimmat/adolatsiz; yig'ish qoidasi aniq bo'lmasa suiiste'mol.
- Isbot: employee_cards (ko'p-karta stake) + payroll-wiring mavjud (commit 5af42e29); lekin yig'ish FORMULASI (asosiy+30-50% yoki yig'indi yoki soat-ulush) egasi tasdig'i kutadi (OCHIQ EP-ORG-142 🔵, decisions).

**01.143  🟡 qisman**  — ❓ EP-ORG-143: Lavozim-turi shabloni (operator/rahbar/mutaxassis), umumiy bo'limlar oldindan to'lgan?
- Siz: Zavod yo'riqnomalari bir xil tuzilish; shablon bo'lsa yangi karta tez+izchil yaratiladi.
- Isbot: card_templates(field_defaults) + applyTemplate (whitelist CARD_FIELD_KEYS → CardService.create kanonik karta) wired; lekin operator/rahbar/mutaxassis tayyor shablon SEED yo'q (card_templates=0), umumiy-bo'lim oldindan-to'lgan data egasi-data.

---

## 02 — HR / Xodim-karta  (vizyon 58%, 82 savol)

**02.1  ✅ bor**  — ❓ EP-HR-001: Onboarding 90-kun 3 bosqich (tanishuv→o'rganish→mustaqil) + 1/3/6-oy milestone?
- Siz: 3 bosqich + har bosqich oxirida tekshiruv nuqtasi + milestone baholash
- Isbot: hr_onboarding_plans=3, hr_onboarding_milestones=90; onboarding.service.ts repo-pattern (0 to'g'ridan db); apps/api/src/modules/hr/onboarding/ to'liq (controller+service+job+progress+repo)

**02.2  🟡 qisman**  — ❓ EP-HR-002: Onboarding rejasi lavozim kartasiga bog'lanadimi (bir lavozim=bir xil onboarding)?
- Siz: Reja lavozim kartasiga biriktiriladi, har lavozim virtual papka
- Isbot: hr_onboarding_plans=3 mavjud; lekin hr_employee_onboardings=0, onboarding_tasks=0 — reja↔karta binding data-da ishlamagan, faqat 3 shablon

**02.3  🟡 qisman**  — ❓ EP-HR-003: Onboarding tugashi sinov o'tish + kartaga to'liq binding + Payroll/ERP ruxsat ochadimi?
- Siz: Tugagach lavozimga to'liq biriktirish + oylik + ERP ruxsat
- Isbot: onboarding-job.service.ts mavjud (avto-o'tish mexanizmi); ckp-gate.ts kartaga bog'lansa oylik darvozasi REAL; lekin binding event-zanjiri data-da tasdiqlanmadi (hr_employee_onboardings=0)

**02.4  ✅ bor**  — ❓ EP-HR-004: Haftalik reja = kunlik hisobot ЦКП asosida (vazifa+miqdor+ertangi reja)?
- Siz: Kunlik hisobot ЦКП asosida, haftalik=kunlik agregatsiya
- Isbot: hr_daily_reports=6930 qator (faol ishlatilmoqda); daily-report.service.ts hrOverride+audit+cron; hr_weekly_statistics=0 (haftalik agregatsiya jadvali bo'sh, lekin kunlik real)

**02.5  🟡 qisman**  — ❓ EP-HR-005: Haftalik reja tasdiqi bevosita rahbar (manager_id) org-sxema vertikal bo'yicha?
- Siz: Bevosita rahbar tasdiqlaydi/qaytaradi, org-sxema vertikal
- Isbot: daily-report approve oqimi bor (hrOverride+status); LEKIN org_functions.manager_id=0 HAMMA NULL — vertikal marshrutlash data-da uzuq (manager_id egasi-data)

**02.6  ✅ bor**  — ❓ EP-HR-006: Har vazifaga bajarildi/qisman/bajarilmadi + sabab 30+ belgi; 3 soat→ishlamagan?
- Siz: Sabab 30+ belgi majburiy; 3 soatda yuborilmasa ishlamagan
- Isbot: daily-report.service.ts @Cron('30 15 * * 1-6') + 16:00 deadline + 30-min eskalatsiya (212-satr); status/reason maydonlari real

**02.7  ✅ bor**  — ❓ EP-HR-007: Inspektor buzilish turlari katalogi (Offset/Flexo/Ombor/Ofis + checklist)?
- Siz: Tayyor kategoriyalar + har bo'lim/xona ideal-rasm AI nazorati
- Isbot: inspection.controller.ts: rooms/:roomCode/reference-photo (ideal-rasm), checklist, manual, alerts endpointlari REAL

**02.8  ✅ bor**  — ❓ EP-HR-008: Buzilish→tuzatish sikli (mas'ul+holat+before/after foto)?
- Siz: Har buzilishga mas'ul+holat+foto-dalil before/after
- Isbot: inspection.controller.ts checklist/alerts/history endpointlari; room-analysis.cron.ts anomaly aniqlash (84-satr issueText)

**02.9  ✅ bor**  — ❓ EP-HR-009: Inspeksiya har 2 soatda kamera ideal-rasm bilan taqqoslaydi, AI baho?
- Siz: Har 2 soatda kamera suratga oladi va taqqoslaydi, inspektor tasdiqlaydi
- Isbot: room-analysis.cron.ts:31 @Cron('0 */2 * * *') — aynan 2 soat; snapshot↔reference comparison+anomalyCount REAL

**02.10  ✅ bor**  — ❓ EP-HR-010: Yillik/choraklik anketa savollari (eNPS master-data, anonim)?
- Siz: eNPS so'rovnoma, ShVB savollari asos, anonim, choraklik
- Isbot: enps.controller.ts: GET/POST + respond endpointlari REAL; hr_question_bank/hr_interview_questions jadvallari mavjud

**02.11  🟡 qisman**  — ❓ EP-HR-011: Anketa choraklik qulfli tsikl, natija saqlanadi, yonma-yon tahlil?
- Siz: Choraklik (yillik emas), qulfli tsikl, dashboard yonma-yon
- Isbot: enps.controller.ts respond bor; lekin choraklik-qulf cron/davr-lock kodi alohida tasdiqlanmadi — tsikl-qulf mexanizmi noaniq

**02.12  🔑 egasi-data**  — ❓ EP-HR-012: Reyting A/B/C chegaralari (A=85+,B=70-84,C<70) markaziy sozlanadimi?
- Siz: Aniq ball oralig'i admin panelda sozlanadi (OCHIQ — raqam belgilanmagan)
- Isbot: decisions/02-hr.md EP-HR-012=OCHIQ; egasi toifa raqamini belgilamagan; hr-rating.service.ts mavjud lekin chegara qiymati egasi-data

**02.13  🟡 qisman**  — ❓ EP-HR-013: Reyting balli ЦКП+kunlik hisobot+360 kollega+AI yo'riqnoma-moslik?
- Siz: ЦКП+kunlik hisobot+kollega baho; AI standartga solishtiradi
- Isbot: hr-rating.service.ts + kpi.service.ts mavjud; ЦКП(ckp-gate) + daily(6930) real; LEKIN hr_360_feedback=0 (kollega baho data yo'q), AI-moslik hisobot data-da yo'q

**02.14  🔑 egasi-data**  — ❓ EP-HR-014: Reyting→bonus→oylik (toifa→% avto Payroll)?
- Siz: Toifa avtomatik bonus % belgilaydi Payroll'ga (OCHIQ — formula yo'q)
- Isbot: decisions EP-HR-014=OCHIQ; payroll.service.ts mavjud; toifa→% formulasi egasi tomonidan belgilanmagan

**02.15  ✅ bor**  — ❓ EP-HR-015: Recruitment-AI nomzodni karta talabiga ko'ra ballaydi (80%), odam qaror?
- Siz: AI 80% bajaradi, kartaga ko'ra ballaydi, yakuniy odam
- Isbot: ai-interview-v2.controller.ts: communication/confidence/problem_solving/overall_score strukturali; hr_interview_sessions=5, hr_candidate_funnels=11 data bor

**02.16  ✅ bor**  — ❓ EP-HR-016: Recruitment pipeline 7-bosqich kanban + AI bosqichlari?
- Siz: 7 bosqich kanban + AI (rezyume→AI video→jonli intervyu)
- Isbot: hr-vacancies-pipeline.controller.ts: pipeline + pipeline/:id/stage (GET/POST) REAL; funnel.aggregate.ts + funnel-stage.vo.ts domain

**02.17  ✅ bor**  — ❓ EP-HR-017: Sinov muddati natijasi (eslatma+baholash+avto-o'tish)?
- Siz: Eslatma+baholash+avtomatik o'tish, rahbar bahosi qayd
- Isbot: hr-vacancies-probation.controller.ts mavjud; onboarding-job.service.ts avto-o'tish mexanizmi

**02.18  🟡 qisman**  — ❓ EP-HR-018: Mentorlik biriktirish (har xodimga 2 mentor: adaptatsiya+kasbiy)?
- Siz: 2 mentor: adaptatsiya mentori + kasbiy usta, org-sxema bo'yicha
- Isbot: hr-gsd.controller.ts mentorship-pairings (GET/POST) endpoint bor; LEKIN hr_mentorship_pairings=0, mentors=0, mentorships=0 — data BO'SH

**02.19  🟡 qisman**  — ❓ EP-HR-019: Mentor ERP da amaliy topshiriq tasdiqlaydi + izoh + reyting?
- Siz: Mentor ERP da tasdiqlaydi (qog'oz emas) + har bosqich izoh
- Isbot: mentorship-pairings endpoint bor; lekin data=0 va mentor-tasdiq-oqimi (topshiriq approve) alohida tasdiqlanmadi

**02.20  🟡 qisman**  — ❓ EP-HR-020: Referral-bonus (tavsiya→qabul→ProbationCompleted→bonus)?
- Siz: Tavsiya qilingan nomzod qabul→xodimga bonus (pul/ta'til), to'liq sikl
- Isbot: hr-gsd.controller.ts referrals + referrals/boomerang (GET/POST) endpoint REAL; LEKIN hr_referrals=0 data BO'SH, ProbationCompleted→bonus zanjiri tasdiqlanmadi

**02.21  🔑 egasi-data**  — ❓ EP-HR-021: Referral-bonus shartlari (lavozimga summa, sinovdan o'tgach)?
- Siz: Lavozimga qarab summa/ta'til, markaziy sozlanadi (OCHIQ — summa yo'q)
- Isbot: decisions EP-HR-021=OCHIQ; referrals endpoint bor lekin summa/shart qiymati egasi-data

**02.22  ✅ bor**  — ❓ EP-HR-022: Xodim profili to'liq (davlat-darajasi: shaxsiy+hujjat+ish tarixi+intizom+rivojlanish)?
- Siz: Davlatda inson qanday ma'lumot bo'lsa o'sha, mavjudga qo'shimcha
- Isbot: employees.service.ts + employee-monthly-card.service.ts; employees=31, users=32; hr-employees.controller.ts + hr-employees-ext to'liq profil

**02.23  🟡 qisman**  — ❓ EP-HR-023: Profil↔lavozim kartasi binding (talab/razryad/oylik kartadan)?
- Siz: Profilda biriktirilgan karta(lar), talab/razryad/oylik kartadan
- Isbot: org_functions=97 kanonik karta (memory: card_id+FK); LEKIN razryad 17/97, min_salary=0/97 to'ldirilmagan — binding bor, karta-data chala

**02.24  🟡 qisman**  — ❓ EP-HR-024: Xizmat safari arizasi (sana/joy/maqsad/xarajat)→rahbar tasdiq?
- Siz: Ariza→rahbar tasdiqi org-sxema avto-marshrut→qaydlanadi
- Isbot: business_trips jadval mavjud (employees-compat-financials.service.ts); LEKIN business_trips=0, employee_business_trips=0 BO'SH, compatibility modulda (HR moduli emas)

**02.25  🟡 qisman**  — ❓ EP-HR-025: Safar xarajati moliyaga ulanish (avans/qarz→oylikdan chegirma)?
- Siz: Tasdiqlangan xarajat moliya bilan, qarz kartochkada→oylikdan chegiriladi
- Isbot: employees-compat-financials.service.ts business_trips bilan ishlaydi; lekin data=0 va moliya-integratsiya jonli tasdiqlanmadi

**02.26  🟡 qisman**  — ❓ EP-HR-026: Har bo'lim/lavozim alohida ЦКП (QYM) belgilanadimi?
- Siz: Har bo'lim va lavozim uchun alohida QYM/ЦКП
- Isbot: org_functions.tskp + tskp_target + tskp_measurement_unit ustunlar bor; LEKIN tskp faqat 19/97 to'ldirilgan — struktura to'liq, data chala

**02.27  🟡 qisman**  — ❓ EP-HR-027: Razryad→talab→oylik o'sishi (career-path bosqich, xodim ko'radi)?
- Siz: Career-path bosqich, lavozim o'zgarsa talab+oylik, narvon ko'rinadi
- Isbot: career-path.controller.ts: GET/POST + department/:id/ladder + :id/steps REAL; razryad_levels=6 seed; LEKIN org_functions.razryad 17/97, salary kartada bo'sh

**02.28  🟡 qisman**  — ❓ EP-HR-028: Har lavozim kartasi AI'si xodim↔karta mosligini baholaydi (hisobot)?
- Siz: Har kartada AI, moslik hisoboti, AI'lar o'zaro (vizyon markaziy)
- Isbot: org_functions.ai_exam_enabled ustun bor (ai_exam=0 hech kim yoqmagan); ai_ckp_config/ai_ckp_scores jadvallar mavjud; LEKIN har-karta-AI moslik hisoboti jonli ishlamayapti

**02.29  🟡 qisman**  — ❓ EP-HR-029: Haftalik HR digesti (dushanba Telegram qisqa + ERP to'liq)?
- Siz: Telegram qisqa + ERP to'liq, HR 3 vaqtda routine notification
- Isbot: telegram-bots/ modulda cron.helpers + notification-templates bor; LEKIN aniq 'dushanba digest' (weekly summary) grep'da topilmadi — kunlik notification bor, haftalik digest noaniq

**02.30  🟡 qisman**  — ❓ EP-HR-030: Lavozim papkasi to'liqligi reestri (yo'riqnoma/talab/darslik/ЦКП/razryad %)?
- Siz: Har lavozim virtual papka + to'liqlik % (qaysi karta tayyor emas)
- Isbot: org_functions=97 + hr_job_descriptions=20; LEKIN to'liqlik-% reestri dashboard tasdiqlanmadi, ko'p karta bo'sh (desc 0/97, tskp 19/97)

**02.31  ❌ yo'q**  — ❓ EP-HR-031: Lavozim yo'riqnomasi 13 ta standart bo'lim strukturali maydon?
- Siz: 13 bo'lim = strukturali maydon (yagona standart format), AI har bo'limni o'qiydi
- Isbot: hr_job_descriptions: key_responsibilities/kpi_metrics/requirements HAMMA NULL (20 qator, has_resp=false); 13-bo'lim strukturasi (ko'p-xato/muvaffaqiyat/glossariy/javobgarlik alohida maydon) YO'Q — content=text bo'sh

**02.32  ❌ yo'q**  — ❓ EP-HR-032: Tasdiqlayman-direktor imzo bloki + tanishdim elektron imzo oqimi?
- Siz: Elektron imzo oqimi: rahbar tasdiqlaydi→xodim qabul, sana+IP loglanadi
- Isbot: hr_job_descriptions.approved_by_id=NULL HAMMA (20/20), approved_at=NULL; document-workflow.processor.ts bor lekin yo'riqnoma-imzo oqimi data-da ishlamagan

**02.33  🟡 qisman**  — ❓ EP-HR-033: Orgsxema joylashuv kodi org-daraxt tuguniga FK (Vysotskiy-7)?
- Siz: Joylashuv=org-daraxt FK, manager_id+vertikal hisobot shundan
- Isbot: org_functions.department_id+org_departments=145 FK bor; level+code+rbac_tier ustun; LEKIN manager_id=0 HAMMA NULL — vertikal zanjir uzuq (egasi-data)

**02.34  🟡 qisman**  — ❓ EP-HR-034: Malaka talablari strukturali (min_ta'lim+min_tajriba_yil) AI CV taqqoslash?
- Siz: Talab strukturali, har lavozim rezyume/savol banki→AI avto-taqqoslaydi
- Isbot: hr_job_descriptions.requirements=jsonb ustun bor (lekin NULL); hr_question_bank jadval mavjud; AI-CV-taqqoslash skills-matrix bilan qisman, talab-data bo'sh

**02.35  🟡 qisman**  — ❓ EP-HR-035: Ish joyi vositalari A-System→ruxsat shabloni (avto-grant)?
- Siz: Vositalar→ruxsat shabloni, onboarding checklist + AI kamera ish joyi nazorat
- Isbot: hr_onboarding_checklists jadval bor (=0 data); AI kamera (FaceRecognition) bor; LEKIN vosita→avto-ruxsat-grant mexanizmi tasdiqlanmadi

**02.36  🟡 qisman**  — ❓ EP-HR-036: ЦКП + 4 strukturali produkt (nom+o'lchov+maqsad)?
- Siz: ЦКП matni + 4 produkt slot (KPI avto-bog'lanadi)
- Isbot: ckp_card_products jadval mavjud LEKIN =0 (BO'SH); org_functions.tskp_target+tskp_measurement_unit bor; 4-produkt slot data-da to'ldirilmagan

**02.37  🔑 egasi-data**  — ❓ EP-HR-037: Statistik ko'rsatkichlar→formulali metrik→real raqam dashboard?
- Siz: Har ko'rsatkich formulali metrik manba-jadvaldan (OCHIQ — KPI alohida modul)
- Isbot: decisions EP-HR-037=OCHIQ; org_functions.statistics_type ustun bor; formulali-metrik avto-ulanish egasi tasdiqlamagan

**02.38  ❌ yo'q**  — ❓ EP-HR-038: Ko'p uchraydigan xatolar→inspektor buzilish-katalogiga lavozimga-xos?
- Siz: Tipik xatolar→inspektor/AI buzilish katalogiga (bir manba)
- Isbot: hr_job_descriptions'da 'ko'p-xatolar' maydoni YO'Q (struktura bo'sh); defect_catalog/discipline bor lekin yo'riqnoma-xatolar-bandiga ulanmagan

**02.39  🟡 qisman**  — ❓ EP-HR-039: Muvaffaqiyatli harakatlar→ijobiy bal-mezon (oy yaxshi xodimi)?
- Siz: Muvaffaqiyatli harakatlar=ijobiy bal-mezon, AI/mentor belgilaydi
- Isbot: hr_motivation_plans jadval + gamification bor; LEKIN yo'riqnomadagi 'muvaffaqiyatli-harakatlar' maydoni strukturasiz (13-bo'lim yo'q)

**02.40  ❌ yo'q**  — ❓ EP-HR-040: Javobgarlik ko'p-tanlovli (moddiy/ma'naviy/intizomiy/jinoiy)+kodeks bandi?
- Siz: Javobgarlik ko'p-tanlovli + kodeks bandi maydoni, shartnomada
- Isbot: hr_job_descriptions strukturasiz (javobgarlik maydoni NULL); employment_contracts=0; javobgarlik-tur katalogi data-da YO'Q

**02.41  🟡 qisman**  — ❓ EP-HR-041: Tijorat siri NDA alohida bayonnoma + majburiy imzo onboarding'da?
- Siz: Onboarding'da alohida NDA + majburiy imzo (qabul shartiga)
- Isbot: hr_tz2_signed_policies jadval bor LEKIN =0 (BO'SH); NDA-alohida-imzo data-da ishlamagan, faqat struktura

**02.42  🔑 egasi-data**  — ❓ EP-HR-042: Energiya resurs tejash (suv/gaz/svet) javobgarlik bandi?
- Siz: Javobgarlik bandi sifatida saqlash (OCHIQ — alohida tasdiqlanmagan)
- Isbot: decisions EP-HR-042=OCHIQ; yo'riqnoma struktura bo'sh, energiya-band maydoni YO'Q; egasi bandni tasdiqlamagan

**02.43  ❌ yo'q**  — ❓ EP-HR-043: Nazorat varaqasi=elektron checklist (band→o'qidim+sana+mini-test)?
- Siz: Nazorat varaqasi elektron checklist + mentor tekshirish + mini-test
- Isbot: adaptation_records=0, adaptation_milestones=0; nazorat-varaqasi (control-list) komponenti grep'da topilmadi; adaptation_programs=3 shablon bor lekin varaqa-mexanizmi YO'Q

**02.44  🟡 qisman**  — ❓ EP-HR-044: Nazorat varaqasi BOSHLANISH/TUGATISH sanasi + muddat-o'tdi ogohlantirish?
- Siz: Boshlanish/tugatish sana + muddat o'tib ketsa rahbar/HR ogohlantirish
- Isbot: hr_onboarding_milestones=90 (sana bor); onboarding-job.service.ts cron eslatma; LEKIN nazorat-varaqasi o'zi yo'q (adaptation_records=0)

**02.45  ❌ yo'q**  — ❓ EP-HR-045: Nazorat varaqasi 1-bo'lim ta'rif bandlari imzosi (5+ tasdiq)?
- Siz: 1-bo'lim (ta'rif) + 2-bo'lim (vazifa) ajratilgan checklist o'qidi-tasdiq
- Isbot: nazorat-varaqasi komponenti yo'q; adaptation_records=0; band-band o'qidi-tasdiq mexanizmi qurilmagan

**02.46  🟡 qisman**  — ❓ EP-HR-046: Nazorat varaqasi yakuniy keys-savol (variant+izoh)→AI/mentor baho?
- Siz: Keys-savol→mini-test, mentor/AI baholaydi→adaptatsiya o'tishiga ta'sir
- Isbot: lms_tests/lms_exams jadval bor (lms_exams=0); ai-interview scoring bor; LEKIN adaptatsiya keys-savol band-band data-da YO'Q (adaptation=0)

**02.47  ❌ yo'q**  — ❓ EP-HR-047: Glossariy lavozimga bog'langan atama-lug'at (tooltip)?
- Siz: Glossariy=lavozimga atama-lug'at, o'qishda tooltip (OCHIQ)
- Isbot: information_schema: glossary/term/lugat jadval UMUMAN YO'Q (bo'sh natija); glossariy-strukturasi qurilmagan

**02.48  🟡 qisman**  — ❓ EP-HR-048: Vazifa→darslik bog'lanishi (Qog'oz/gofra turlari→LMS)?
- Siz: Har bilim-vazifa→LMS darslik, darslik kartaga (xodimga emas)
- Isbot: lms_courses=5, lms_lessons=13, lms_card_mentors=0; LMS modul real (lms_modules/exams/enrollments); LEKIN vazifa↔darslik karta-binding (lms_card_mentors=0) data-da uzuq

**02.49  ✅ bor**  — ❓ EP-HR-049: Turniket karta→tabel integratsiyasi (AI kamera o'rnini bosadi)?
- Siz: ERP ishga tushganda barcha davomat AI kamera (turniket o'rnini), kechikish avto
- Isbot: attendance-face.controller.ts: FaceRecognitionService+TerritoryLogService (zona); face/register 3-image; hr_ai_attendance jadval; attendance=10 data

**02.50  🟡 qisman**  — ❓ EP-HR-050: Tabel ish_kuni/soni/norma/kunlik% modeli AI kameradan?
- Siz: Tabel AI kamera ma'lumotidan, unikal ish vaqti, norma/% Payroll'ga
- Isbot: daily_attendance_summary + hr_tz2_daily_attendance + territory_log bor; LEKIN hr_tz2_monthly_employee_cards=0, hr_tz2_territory_logs=0 — norma/% modeli data-da to'lmagan

**02.51  🟡 qisman**  — ❓ EP-HR-051: Norma→bajarish%→oylik (ishbay, operatsiya-norma katalog+invoys PDF)?
- Siz: Operatsiya-norma katalog + faktik→oylik avto-hisob (ishbay), invoys-PDF
- Isbot: payroll.service.ts + ckp-gate (baza×razryad×ЦКП×stake) REAL; LEKIN mes_operations=0 (operatsiya-norma katalog BO'SH), ishbay-fakt manbasi yo'q

**02.52  ❌ yo'q**  — ❓ EP-HR-052: Operatsiya turlari master-katalog (lak/kley/tigel/rezka, nom+norma+birlik)?
- Siz: Operatsiya turlari master-katalog, SkillsMatrix HR↔Production ko'prik
- Isbot: mes_operations=0 (operatsiya katalog BO'SH); skills-matrix.controller.ts catalog endpoint bor lekin operatsiya-norma-birlik master-data to'ldirilmagan

**02.53  🟡 qisman**  — ❓ EP-HR-053: Xodim→operatsiya malaka matritsasi (kim nimani biladi+daraja)?
- Siz: Xodim-operatsiya malaka matritsasi, smena rejalashtirish avtomatlashadi
- Isbot: skills-matrix.controller.ts: catalog/employee/:id/score/gap-analysis/team REAL; LEKIN employee_skills=2 (deyarli bo'sh), matritsa data-da chala

**02.54  🟡 qisman**  — ❓ EP-HR-054: Intizom buzilish turlari katalogi (og'irlik darajasi bilan)?
- Siz: Buzilish turlari katalogi + og'irlik darajasi, jarima revision
- Isbot: discipline_records.severity (major/medium/low/minor) + violation_type REAL, =32 data; LEKIN alohida buzilish-tur-katalog master-data (lavozimga-xos) emas, faqat severity-enum

**02.55  🟡 qisman**  — ❓ EP-HR-055: Intizom chora bosqichli (og'zaki→yozma→jarima→bo'shatish, 6oy muddat)?
- Siz: Bosqichli chora oqimi, tanbeh 6 oy, rahbar+xodim imzo, HR shablon
- Isbot: discipline_records.is_expired (6-oy arxiv) + status + given_by bor; LEKIN bosqichli-oqim (verbal→written→fine→termination ketma-ketlik) kodi topilmadi — severity bor, bosqich-eskalatsiya yo'q

**02.56  ✅ bor**  — ❓ EP-HR-056: Jarima hujjatlangan (sabab+summa/%+tasdiq)→oylik avto-kamayadi (tasdiqsiz yozilmaydi)?
- Siz: Jarima hujjat→oylik avto-kamayadi; jarima tasdiqlanmasa yozilmaydi
- Isbot: discipline_records.fine_amount+reason+status REAL; late-arrival.service.ts:247 avto-jarima (sababnoma rad→fine); payroll bilan ulangan

**02.57  🔑 egasi-data**  — ❓ EP-HR-057: Brak→mas'ul xodim FK→javobgarlik/jarima?
- Siz: Brak→operator/smena FK→sabab→ixtiyoriy javobgarlik (OCHIQ — EP-HR-057 mas'ul ixtiyoriy)
- Isbot: decisions EP-HR-057=OCHIQ (mas'ul ixtiyoriy); defect_reports+camera_quality_defects jadval bor; brak→xodim-FK→jarima ulashni egasi tasdiqlamagan

**02.58  🟡 qisman**  — ❓ EP-HR-058: Mehnat shartnoma turlari (muddatli/muddatsiz/sinov/loyiha)+30kun ogohlantirish?
- Siz: Hammasi: Muddatli+Muddatsiz+Sinov+Loyiha, tugashiga 30 kun ogohlantirish
- Isbot: employment_contracts + employee_contracts jadval bor LEKIN IKKALASI=0 (BO'SH); 30-kun-ogohlantirish cron tasdiqlanmadi, data yo'q

**02.59  🟡 qisman**  — ❓ EP-HR-059: Xodim hujjatlari ro'yxati (pasport/INPS/sanitar/NDA)+amal muddati ogohlantirish?
- Siz: Hujjat ro'yxati onboarding-checklist + muddat ogohlantirish, ERP serverida
- Isbot: hr_documents=2, hr_documents_archive bor; document-workflow.processor.ts; LEKIN sanitar-muddat-ogohlantirish cron + checklist (hr_onboarding_checklists=0) data-da chala

**02.60  ✅ bor**  — ❓ EP-HR-060: Ta'til turlari (mehnat/o'quv/tug'ruq)+balans+ariza→tasdiq→tabel avto?
- Siz: Ta'til turlari+balans+ariza oqimi→tabelga avto, Payroll avto
- Isbot: leave.service.ts + leave-accrual.service.ts + leave-accrual-job.service.ts REAL; hr_leave_requests=29, hr_leave_balances=90 data faol

**02.61  🟡 qisman**  — ❓ EP-HR-061: Ta'til/ruxsat ariza tasdiq zanjiri (manager_id→org-sxema→HR, 24s/avans 4s)?
- Siz: Ariza→bevosita rahbar→org-sxema avto-marshrut→HR, ta'til 24s avans 4s
- Isbot: hr-leave.controller.ts ariza-tasdiq bor; hr_leave_requests=29; LEKIN manager_id=0 HAMMA NULL — vertikal avto-marshrut data-da uzuq

**02.62  🟡 qisman**  — ❓ EP-HR-062: Davomat statuslari katalog (ishladi/ta'til/otgul/kasallik/kechikdi/kelmadi)→oylikka turli?
- Siz: Davomat statuslari katalogi, ish vaqtida chiqish Telegram so'rov+sabab
- Isbot: hr_late_arrivals jadval + attendance_records/logs bor; late-arrival.service.ts; LEKIN hr_late_arrivals=0, davomat-status-katalog to'liq enum tasdiqlanmadi

**02.63  ✅ bor**  — ❓ EP-HR-063: Ishdan bo'shatish oqimi + obxod-list (ERP blok+inventar+oxirgi to'lov)?
- Siz: Offboarding: ERP blok+hisob-kitob+inventar qaytarish+Exit, sabab majburiy
- Isbot: offboarding-workflow.service.ts: STANDARD_OFFBOARDING_CHECKLIST 8-band (laptop/badge/keys/final_payroll) + state-machine + requiredItemsCount gating + final-payroll blok REAL

**02.64  🟡 qisman**  — ❓ EP-HR-064: Bo'shatish sababi statistikasi (Exit interview→turnover dashboard)?
- Siz: Bo'shatish sababi katalog→bo'lim/lavozim turnover dashboard
- Isbot: hr-offboarding.controller.ts + offboarding-workflow Exit bor; hr_alumni jadval; LEKIN turnover-dashboard (sabab→bo'lim agregatsiya) data-da tasdiqlanmadi, hr_alumni data noaniq

**02.65  🟡 qisman**  — ❓ EP-HR-065: Bo'sh karta→avto-vakansiya→recruitment pipeline (boomerang Telegram)?
- Siz: Bo'sh karta→avto-vakansiya→pipeline, eski xodimga boomerang Telegram
- Isbot: hr-gsd.controller.ts referrals/boomerang endpoint + recruitment pipeline bor; LEKIN bo'sh-karta→avto-vakansiya EVENT-zanjiri jonli tasdiqlanmadi

**02.66  🟡 qisman**  — ❓ EP-HR-066: Yo'riqnoma versiyalash (kim/qachon/nima)+immutable+qayta-tanishuv?
- Siz: To'liq versiya tarixi, tasdiqlangan immutable, o'zgarganda qayta-tanishuv
- Isbot: hr_job_descriptions.version+is_current_version+is_active ustun bor (struktura); LEKIN hammasi version=1, qayta-tanishuv oqimi (signed-policies=0) data-da ishlamagan

**02.67  🟡 qisman**  — ❓ EP-HR-067: Bir xodim ko'p lavozim/operatsiya (universal, har biri norma/oylik)?
- Siz: Asosiy+qo'shimcha operatsiya (har biri normasi/oyligi), xodim↔karta many
- Isbot: memory: xodim↔karta many, oylik=kartalar yig'indisi (stake); ckp-gate stake bor; LEKIN ko'p-karta-binding jonli data tasdiqlanmadi (employees=31)

**02.68  🟡 qisman**  — ❓ EP-HR-068: Smena tarkibi (kunduz/tun)+smena boshlig'i (ShiftSchedule)?
- Siz: Smena=guruh (kunduz/tun+boshliq+a'zo)→tabel smenaga, smenaboshchi org-sxemada
- Isbot: shift.controller.ts: POST/swap-request/schedule/swap-requests REAL; erp_shift_calendars jadval; LEKIN erp_shift_calendars=0, integration_shifts=0 — smena data BO'SH

**02.69  ✅ bor**  — ❓ EP-HR-069: Tabel davri yopilishi (qulf)→oylik idempotent uzatish?
- Siz: Tabel davri yopiladi (qulf)→oylik idempotent→keyin faqat tuzatma
- Isbot: hr-payroll-closure.controller.ts: periods/:id/generate (idempotent upsert) + periods/:id/close REAL; payroll-closure.service.ts; ckp-gate bilan

**02.70  🟡 qisman**  — ❓ EP-HR-070: AI xodim↔yo'riqnoma muvofiqlik bahosi + matn hisobot?
- Siz: Lavozim-AI: yo'riqnoma+xodim fakti→muvofiqlik bahosi+matn hisobot (markaziy)
- Isbot: ai_ckp_config/ai_ckp_scores/ai_ckp_chat_logs jadval + org_functions.ai_exam_enabled bor; LEKIN yo'riqnoma strukturasiz (13-bo'lim yo'q)→AI-moslik-hisobot jonli ishlamayapti, ai_exam=0

**02.71  ❌ yo'q**  — ❓ EP-HR-071: Lavozimlararo AI muloqoti (gorizontal workflow_rules AI-AI signal)?
- Siz: Aloqa qiladigan bo'limlar→gorizontal workflow_rules avto-ulanadi (AI-AI)
- Isbot: yo'riqnoma 'aloqa-bo'limlar' maydoni yo'q (13-bo'lim yo'q); workflow_rules gorizontal AI-AI signal HR'da tasdiqlanmadi

**02.72  🟡 qisman**  — ❓ EP-HR-072: Xodim shaxsiy kabineti (yo'riqnoma+KPI+tabel+reyting+ta'til+oylik)?
- Siz: Shaxsiy kabinet 'O'zim haqimda', xodim ko'radi HR ruxsatsiz o'zgartira olmaydi
- Isbot: employees.service.ts + employee-monthly-card.service.ts + hr_daily_reports(6930)+leave_balances(90) komponentlar bor; LEKIN yagona shaxsiy-kabinet birlashtirilgan ko'rinish tasdiqlanmadi

**02.73  🟡 qisman**  — ❓ EP-HR-073: Razryad o'sish oqimi (attestatsiya+keys-test+rahbar tasdiq→oylik avto)?
- Siz: Razryad o'sish oqimi (attestatsiya+test+tasdiq→oylik avto), Internal Job Posting
- Isbot: career-path.controller.ts steps + hr_tz2_internal_job_postings jadval; razryad_levels=6; LEKIN attestatsiya→oylik-avto-o'zgarish oqimi data-da (internal_job_postings=0) ishlamagan

**02.74  🟡 qisman**  — ❓ EP-HR-074: Mas'ul shaxs roli (yo'riqnoma muallifi, faqat u+direktor o'zgartiradi)?
- Siz: Yo'riqnomaga mas'ul-shaxs roli, HR yaratadi+Direktor tasdiqlaydi, rol org-sxemada
- Isbot: hr_job_descriptions.created_by_id+approved_by_id ustun bor (RBAC); LEKIN approved_by_id=NULL hammada, mas'ul-shaxs-bloklash jonli ishlamagan

**02.75  🟡 qisman**  — ❓ EP-HR-075: Nazorat varaqasida rahbar/mentor savol-muammo kanali (loglanadi)?
- Siz: Adaptatsiyada xodim→rahbar/mentor savol/muammo kanali+javob loglanadi
- Isbot: mentorship-pairings + ERP chat bor; hr_employee_one_on_ones jadval; LEKIN nazorat-varaqasi yo'q (adaptation=0), mentor-aloqa-log adaptatsiya kontekstida ishlamagan

**02.76  🟡 qisman**  — ❓ EP-HR-076: Lavozimlar reestri tayyorlik foizi (yo'riqnoma/varaqa/darslik/keys ✓)?
- Siz: Lavozim reestri + tayyorlik % (har komponent ✓), 30+ bo'lim virtual papka
- Isbot: org_functions=97 + org_departments=145 reestr bor; LEKIN tayyorlik-% dashboard yo'q, ko'p karta bo'sh (desc 0/97, tskp 19/97, varaqa yo'q)

**02.77  ❌ yo'q**  — ❓ EP-HR-077: Yo'riqnoma→real natija tafovut hisoboti (band↔harakat mos/buzilgan)?
- Siz: Tafovut hisoboti: yo'riqnoma bandi↔real harakat band-band fidbek
- Isbot: yo'riqnoma strukturasiz (band-band maydon yo'q, 13-bo'lim yo'q)→band↔real-harakat tafovut hisoboti qurib bo'lmaydi; mexanizm yo'q

**02.78  🟡 qisman**  — ❓ EP-HR-078: Rahbar kartasi shaxsiy+bo'ysunuvchilar jamlangan natija (bo'lim %)?
- Siz: Rahbar kartasi=shaxsiy+bo'ysunuvchilar jamlangan (bo'lim %), vertikal Vysotskiy-7
- Isbot: hr-dashboard.controller.ts + direktor dashboard bor; LEKIN manager_id=0 HAMMA NULL — bo'ysunuvchilar-zanjiri (kim kimga) data-da uzuq, jamlash ishlamaydi

**02.79  🟡 qisman**  — ❓ EP-HR-079: TB instruktaj jurnali (kirish/birlamchi/takroriy+sana+imzo+keyingi muddat)?
- Siz: TB instruktaj jurnali davriy (OCHIQ — davriylikni egasi tasdiqlamagan)
- Isbot: decisions EP-HR-079=OCHIQ; hr-safety.controller.ts incidents/hazard-zones bor (incident-asosli); LEKIN davriy-TB-instruktaj-jurnal (kirish/birlamchi/takroriy) YO'Q

**02.80  ❌ yo'q**  — ❓ EP-HR-080: Glossariy atama mini-test (adaptatsiya o'tish shartiga, yopiq imtihon)?
- Siz: Glossariy→atama mini-test adaptatsiya o'tish shartiga (bilim kafolati)
- Isbot: glossary jadval UMUMAN YO'Q (information_schema bo'sh); lms_tests bor lekin glossariy-atama-test (yopiq imtihon) qurilmagan, adaptation=0

**02.81  🟡 qisman**  — ❓ EP-HR-081: 1-sutkalik reja→tegishli lavozimlarga avto-signal (Telegram)?
- Siz: Kunlik reja→tegishli lavozimlarga avto-signal, org-sxema routing
- Isbot: telegram-bots/ modul + notification-bot-event-builders bor; LEKIN kunlik-reja→lavozim avto-signal (production→HR) EVENT-zanjiri jonli tasdiqlanmadi, manager_id=0 routing uzuq

**02.82  🔑 egasi-data**  — ❓ EP-HR-082: Bekor turish (prostoy)→mas'ul lavozim→KPI ta'sir?
- Siz: Prostoy hodisasi (vaqt+sabab+mas'ul lavozim)→KPI (OCHIQ — KPI ulash egasi tasdiqlamagan)
- Isbot: decisions EP-HR-082=OCHIQ; prostoy MES/Production'da, mes_shift_stats jadval bor; prostoy→mas'ul-lavozim→KPI ulashni egasi HR savolida tasdiqlamagan

---

## 03 — Finance / GL / Kassir  (vizyon 68%, 86 savol)

**03.1  ✅ bor**  — ❓ ZVS (haftalik byudjet so'rovi) to'liq ekran — kiritish+ro'yxat+holat qurilganmi?
- Siz: Bo'limlar tizimda haftalik xarajat so'rovini to'ldiradi (A: to'liq ekran, ShVB blankiga mos).
- Isbot: zvs.controller.ts (director): @Post create, @Get list, @Patch approve/reject; zvs.service.ts createZvsWithValidation real; FE HRZvsPage.tsx + Dialogs/Sections. Jadval zvs bor (data=0, build bosqichi).

**03.2  ✅ bor**  — ❓ ZNO (to'lov majburiyati) to'liq ekran qurilganmi?
- Siz: Yetkazib beruvchiga to'lov so'rovi (A: to'liq ZNO ekran, ZVS ga bog'lab).
- Isbot: director/presentation/zno.controller.ts + zno.service.ts + zno.repository.ts; jadval zno bor (department_id/amount/purpose ustunlari). data=0 (build).

**03.3  🟡 qisman**  — ❓ ZVS/ZNO 3-savatli koordinatsiyaga + 24/48 soat muddat bilan ulanganmi?
- Siz: Ariza avtomatik koordinatsiya savatiga tushadi, muddat bilan (A).
- Isbot: ZVS approve/reject oqimi bor; approval_requests/steps jadvallari mavjud. 3-savat Coordination ulanishi va 24/48h muddat-eskalatsiya cron alohida tasdiqlanmadi — qisman.

**03.4  ✅ bor**  — ❓ 4-hisob ajratish (MAIN/TAX/HEAD/WORKING) alohida balans/harakat bilan bormi?
- Siz: Pul 4 alohida hisobga bo'linadi (A: to'rttala alohida, ShVB poydevori).
- Isbot: income-split.service.ts: FundKey MAIN/TAX/HEAD/WORKING (9010/6310/8500/5110); finance-accounting.service.ts EP-FIN-004 4-hisob guruh jonli GL balans bilan (satr 66).

**03.5  ✅ bor**  — ❓ Tushum 4-hisobga avtomatik foiz bilan taqsimlanadimi?
- Siz: Har kirim belgilangan foizda avto-bo'linadi (A: intizom kafolati).
- Isbot: income-split.service.ts splitAndPost(amount,reference): computeSplit→balansli journal `entries`ga post. Foiz income_split_config jadvalidan (egasi-data Q-40).

**03.6  🔑 egasi-data**  — ❓ Taqsim foizlarini faqat egasi (direktor) o'zgartira oladimi?
- Siz: Pul taqsimoti eng xavfli sozlama — faqat egasi (A).
- Isbot: income_split_config jadval bor, kod foizni o'qiydi. Foiz QIYMATLARI egasi-data (memory Q-40); RBAC egasi-only sozlash UI alohida tekshirilmadi.

**03.7  ✅ bor**  — ❓ Tasdiqlash matritsasi 500k/5M/direktor avtomatik tanlanadimi?
- Siz: 3 bosqich avtomatik (bo'lim≤500k / kengash≤5M / direktor>5M) (A).
- Isbot: zvs.service.ts:16-20 computeLevel: ≤500k→1, ≤5M→2, else 3; canApproveLevel rol-gate (LEVEL1/2/3_ROLES).

**03.8  🟡 qisman**  — ❓ Tasdiqlash chegaralari ekrandan sozlanadimi (kodga qotirilmagan)?
- Siz: 500k/5M ekrandan o'zgartiriladi, dasturchisiz (A).
- Isbot: approval_matrix_config jadvali mavjud (data=0); lekin zvs.service.ts:18 chegara KODDA qotirilgan (500_000/5_000_000 const). Sozlanadigan o'qish ulanmagan — qisman.

**03.9  🟡 qisman**  — ❓ Tasdiqlovchi lavozimga emas, kartaga bog'langanmi?
- Siz: Tasdiqlovchi=karta, odam almashsa karta qoladi (A).
- Isbot: canApproveLevel ROL-massivi orqali ishlaydi (lavozim-rol), org-karta resolver bilan to'g'ridan bog'lanish tasdiqlanmadi. Qisman (rol-asosli, karta-resolver emas).

**03.10  🟡 qisman**  — ❓ Tasdiqlash muddati o'tsa avtomatik eskalatsiya+ogohlantirish bormi?
- Siz: Yuqori bosqichga avto-ko'tariladi + ogohlantirish (A: ish to'xtamaydi).
- Isbot: FP-cycle cron eslatma yuboradi; lekin ZVS-specific muddat-eskalatsiya (24/48h o'tsa keyingi darajaga) jonli cron tasdiqlanmadi. Qisman.

**03.11  ✅ bor**  — ❓ Haftalik FP-tsikl (Se/Ch/Pa/Du) cron + Telegram bilan ishlaydimi?
- Siz: 4 kunlik aniq tsikl, har bosqich o'z kuni + Telegram (A).
- Isbot: fp-cycle-cron.service.ts: 4×@Cron (0 9 * * 2 Seshanba ZVS, *3 Chorshanba ФП, va h.k.), notify recipients, timeZone Asia/Tashkent.

**03.12  ❌ yo'q**  — ❓ FP-tsikl kunlarini egasi ekrandan o'zgartira oladimi?
- Siz: Bank/bayram kuniga moslashuvchan (A).
- Isbot: fp-cycle-cron.service.ts @Cron iboralari KODDA qotirilgan (0 9 * * 2). Sozlanadigan kun jadvali/UI topilmadi. OCHIQ (decision: 🔵).

**03.13  ✅ bor**  — ❓ FP-tsikl eslatmalari Telegram+ERP ikkalasiga boradimi?
- Siz: Telegram+ERP birga, ko'rmay qolmaydi (A).
- Isbot: fp-cycle-cron.service.ts notify→roles+recipients; financial-reports-telegram.service.ts + financial-reports cron'lar Telegram digest yuboradi.

**03.14  ✅ bor**  — ❓ To'lanmagan schyotlar aging (0-30/31-60/61-90/90+) ko'rinishi bormi?
- Siz: To'liq aging 4-guruh + jami + eng eski yuqorida (A).
- Isbot: finance-ap.service.ts:52-57 buckets current/31_60/61_90/91_120/over_120 hisoblaydi; ap_aging_buckets jadval; FE ArApAging.tsx + WMS AgingTab.

**03.15  ✅ bor**  — ❓ Aging debitor (AR) va kreditor (AP) alohida ekranmi?
- Siz: Ikki alohida ekran, har birida aging (A: aralashmaydi).
- Isbot: finance-ap.service.ts (AP) + finance-ar.service.ts (AR) alohida; FE AccountsPayable.tsx + AccountsReceivable.tsx; ap_aging_buckets/ar_aging_buckets jadvallar.

**03.16  🟡 qisman**  — ❓ Eski qarz haqida kunlik avto-ogohlantirish (90+=direktorga) bormi?
- Siz: Kunlik alert, 90+ kun direktorga ham (A).
- Isbot: financial-reports-alerts.cron.ts mavjud (kunlik alert); getOverdue() finance-ap'da bor. 90+→direktor eskalatsiya aniq tasdiqlanmadi — qisman.

**03.17  🟡 qisman**  — ❓ Byudjet bo'lim/karta bo'yicha rejalashtiriladimi (ZVS taqqos)?
- Siz: Bo'lim (va karta) byudjeti, ZVS shunga taqqoslanadi (A).
- Isbot: budgets/budget_lines/budget_controls jadvallar + budgets.service.ts + FE BudgetManagement.tsx. Karta-darajali byudjet va ZVS↔byudjet jonli taqqos ulanishi qisman (jadval data=0).

**03.18  🟡 qisman**  — ❓ ZVS so'rovi byudjetga avtomatik taqqoslanadimi (yetadi/yetmaydi)?
- Siz: Avto-taqqos + qolgan summa + oshsa ogohlantirish (A).
- Isbot: budget_controls jadval + budgets.service mavjud; lekin zvs.service.ts createZvs ichida byudjet-qoldiq taqqos/rezerv bloki topilmadi. Mexanizm bor, ulanish qisman.

**03.19  🟡 qisman**  — ❓ Byudjet davri haftalik asosiy + oylik/yillik jamlanmami?
- Siz: Haftalik asosiy + oylik/yillik (A: ShVB ritmi).
- Isbot: budgets jadvali + FP haftalik cron mavjud; accounting_periods jadval bor (data=0). Davr-darajali jamlanma hisobot qisman.

**03.20  ✅ bor**  — ❓ Kassa (naqd) to'liq ERP ichida (har kirim/chiqim+kunlik qoldiq)?
- Siz: Kassa to'liq ERP, 4-hisob/aging bilan bog'lanadi (A).
- Isbot: cashier-hub.service.ts recordMovement (kirim/chiqim, kunlik saldo+limit, satr 240); cash_registers/cash_sessions/cashier_movements jadvallar; FE CashRegister.tsx+CashierHub.tsx.

**03.21  ✅ bor**  — ❓ Kassa POS/ombor harakatidan avtomatik GL'ga yoziladimi?
- Siz: POS/ombor harakati kassa+GL ga o'zi yoziladi (A: avto Dr/Cr).
- Isbot: cashier-podotchet.service.ts: KAS-1 recordMovement→kanonik GL (Dr 4000/Cr 5010); gl-posting.service postJournal ONE-engine orqali boshqa modullar post qiladi.

**03.22  ✅ bor**  — ❓ Yagona kanonik GL daftari (hamma modul shunga yozadi) bormi?
- Siz: Yagona kanonik GL, kassa/ZNO/payroll hammasi shunga (A: bitta haqiqat).
- Isbot: gl-posting.service.ts:96 kanonik `entries` daftari (gl_journal_entries/gl_lines TAQIQ — SAP#76); postJournal yagona dvigatel; entries=6, gl_lines=0 (kanonik tasdig'i).

**03.23  ✅ bor**  — ❓ Har yozuv ikki-tomonlama (debet/kredit), balanslashmasa rad?
- Siz: Doim ikki-tomonlama, balanslashmasa qabul qilinmaydi (A).
- Isbot: gl-posting.service.ts:151-155 totalDebit/totalCredit reduce; Math.abs(diff)>0.01 → Err 'Double-entry validation failed'.

**03.24  ✅ bor**  — ❓ COA milliy BHMS + ShVB 4-hisob ustiga qo'yilganmi?
- Siz: BHMS hisoblar rejasi + 4-hisob (A: rasmiy+boshqaruv).
- Isbot: accounts jadval=42 qator (BHMS seed); FE ChartOfAccounts.tsx; income-split 4-fond BHMS kodlar ustida (9010/6310/8500/5110).

**03.25  🟡 qisman**  — ❓ Tasdiqlangan ZNO avtomatik GL yozuviga aylanadimi?
- Siz: Tasdiq→to'lov→daftar avtomatik (A: uzluksiz zanjir).
- Isbot: gl-posting postJournal ONE-engine + finance-actions verifyPayment mavjud; ZNO-tasdiq→avto-GL aniq event-listener zanjiri jonli tasdiqlanmadi (zno data=0). Mexanizm bor, ulanish qisman.

**03.26  🟡 qisman**  — ❓ To'lov so'roviga hujjat (chek/shartnoma) majburiy biriktiriladimi?
- Siz: Hujjat majburiy (ma'lum summadan yuqori), og'zaki=asos emas (A).
- Isbot: decisions EP-FIN-026 ✅ + storage modul bor; ZVS/ZNO da majburiy-hujjat-gate (bo'lmasa blok) kod-darajada tasdiqlanmadi — qisman.

**03.27  ✅ bor**  — ❓ Kompaniya holati ko'rsatkichiga moliya (kam kassa/qarz=XAVF) ulanganmi?
- Siz: Moliya holat formulasiga kiradi (A: boshqaruv paneli).
- Isbot: company-state.service.ts: cash_flow metrik (weight 0.30, satr 224), normalised cash_flow→profit_pct; company-state-snapshot.cron + controller.

**03.28  🟡 qisman**  — ❓ Telegram ShVB buyruqlari (/zvs_status, /company_state, /weekly_digest) bormi?
- Siz: Asosiy buyruqlar tezkor kirish (A).
- Isbot: bot-gateway/bot.helpers.ts + owner-summary.service da zvs_status/company_state/weekly_digest izlari; financial-reports-telegram digest. To'liq buyruq-handler ulanishi qisman.

**03.29  🟡 qisman**  — ❓ ZVS/ZNO statuslari (6-holat oqim, rad+qaytarish) master-data bormi?
- Siz: To'liq 6-holatli oqim (Yangi→Bo'lim→Kengash→Direktor→To'langan→Rad) (A).
- Isbot: zvs.service approve/reject + level oqimi bor; lekin 6-holatli to'liq status-mashina (qaytarish bilan) master-data sifatida aniq tasdiqlanmadi — qisman.

**03.30  ✅ bor**  — ❓ Moliya rollari SoD (kassir kiritadi/boshliq tekshiradi/direktor tasdiqlaydi) bormi?
- Siz: Har rolga aniq huquq, vazifa bo'linishi (A: SoD).
- Isbot: zvs.service LEVEL1/2/3_ROLES rol-gate + 4 global guard (SodGuard memory); cashier PIN-gated cash-out (podotchet). Rol-asosli SoD jonli.

**03.31  ✅ bor**  — ❓ Hisobotlar to'plami (kunlik kassa/haftalik FP/oylik P&L/aging)+PDF bormi?
- Siz: To'liq to'plam + PDF eksport (A).
- Isbot: financial-reports moduli: daily/weekly/monthly/alerts cron + query/analytics/snapshot/telegram service + reports.controller; FE FinanceDashboard/reports.

**03.32  🟡 qisman**  — ❓ Karta-model integratsiya: byudjet limiti+tasdiq huquqi kartaga biriktirilganmi?
- Siz: Har kartaga byudjet limiti+tasdiq huquqi (A: karta-model poydevori).
- Isbot: approval rol-gate kartaga yaqin; budget_controls jadval bor. Karta-darajali byudjet-limit biriktirish (org_departments↔limit) jonli ulanmagan — qisman (egasi-data head_user_id).

**03.33  ❌ yo'q**  — ❓ Режа қоғози ombor chiqim/kirimidan avtomatik Бухгалтерияга oqadimi?
- Siz: Ombor qaydidan avto Режа қоғози tuziladi, moliyaga oqadi (A).
- Isbot: grep reja.*qog/paper.plan/rejaQogoz apps/api/src — natija YO'Q. Kitob-grounded oqim qurilmagan. OCHIQ (decision EP-FIN-033 ✅-belgilangan lekin kod yo'q).

**03.34  ❌ yo'q**  — ❓ Камомад (berilgan−ishlatilgan−qaytgan) kg×narx=zarar moliyada aks etadimi?
- Siz: Камомад kg×narx avto-zarar, smenaga bog'lanadi (A).
- Isbot: grep kamomad/komomad apps/api/src — YO'Q. Bухгалтерия kamomad-nazorat hisobi qurilmagan. OCHIQ (EP-FIN-034 🔵, sub-savol egasidan).

**03.35  🟡 qisman**  — ❓ Rejada 1200/faktda 1500 — faqat haqiqiy ishlatilgan kg tannarxga kiradimi?
- Siz: Faqat (berilgan−qaytgan) kg tannarxga (A: real sarf).
- Isbot: WMS goods-issue FIFO/FEFO partiya tanlash (batch-selection.service) real chiqim hisoblaydi; lekin Режа қоғози fakt↔reja farqi tannarxga mahsus oqim yo'q — qisman (poydevor bor).

**03.36  🔑 egasi-data**  — ❓ Qog'oz narxi qayerdan (o'rtacha tortilgan ╳ FIFO ╳ oxirgi)?
- Siz: v2: o'rtacha tortilgan (A); ⚠️ 460-javob FIFO. KONFLIKT.
- Isbot: KONFLIKT (decision EP-FIN-036 🔵): WMS FIFO/FEFO aktiv (batch-selection FIFO=oldest), v2 weighted-avg tavsiya. Egasi FIFO╳weighted-avg hal qilishi shart.

**03.37  🟡 qisman**  — ❓ Счёт-фактура (kelgan rulon) avtomatik kreditor qarz (AP) yoziladimi?
- Siz: Счёт-фактура→avto AP, aging boshlanadi (A).
- Isbot: finance-ap.repository createApEntry + purchase_invoices/vendor_invoices jadvallar; due_date aging hisobi bor. Счёт-фактура kiritish→avto-AP UI-oqimi qisman (data=0).

**03.38  ❌ yo'q**  — ❓ Счёт-фактура vazn farqi (kelgan gr ╳ qabul gr)→yetkazib beruvchiga da'vo?
- Siz: Farq avto-da'vo, to'lovdan chegirma (A).
- Isbot: grep da'vo/claim/weight-diff finance — mahsus mexanizm YO'Q. 3-way match difference bor lekin gr-farq da'vo-receivable qurilmagan. OCHIQ (EP-FIN-038 🔵).

**03.39  🟡 qisman**  — ❓ Станоклар норма × ish haqi stavkasi = operatsiya tannarxi (material+mehnat)?
- Siz: Norма×stavka=to'liq tannarx (A: Ген.Директор tasdiqlagan norma).
- Isbot: standard-cost.service (versiyali std-cost: material+labor+overhead) + variance-analysis + order-costing mavjud; stanok-norma↔ish-haqi to'g'ridan ulanish (Станоклар норма.xlsx) jonli tasdiqlanmadi — qisman.

**03.40  ❌ yo'q**  — ❓ 'иш йук' (bo'sh stanok) soatlari yo'qotilgan-quvvat xarajati hisoblanadimi?
- Siz: иш йук soat×stanok-soatlik-xarajat=yo'qotilgan quvvat (oylik hisobot) (A).
- Isbot: grep иш йук/idle-capacity/opportunity-cost finance — YO'Q. decision EP-FIN-040 🔵 (boshqaruv-hisobotda ko'rinadi, GL'da emas). Qurilmagan.

**03.41  ❌ yo'q**  — ❓ Брак=to'liq zarar, Макулатура=qisman qaytariladigan qoldiq ajratiladimi?
- Siz: Брак zarar, Макулатура sotuvga (A). Sub: makulatura daromad qaysi hisob — egasidan.
- Isbot: grep brak.*kg/makulatura finance — moliyaviy hisob YO'Q. QC defect_catalog bor lekin brak/makulatura pul-hisobi qurilmagan. OCHIQ (EP-FIN-041 🔵).

**03.42  ❌ yo'q**  — ❓ Гильза qaytariladigan tara depoziti sifatida alohida hisoblanadimi?
- Siz: Gilza depoziti, yo'qolish ko'rinadi (A).
- Isbot: grep gilza/gilza-deposit finance — YO'Q. decision EP-FIN-042 🔵 (90 kun→zarar). Qurilmagan.

**03.43  ❌ yo'q**  — ❓ Транспорт xarajati material kirim tannarxiga taqsimlanadimi (landed cost)?
- Siz: Transport summasi kg-proporsional landed cost (A).
- Isbot: grep landed/freight/transport-alloc apps/api/src — YO'Q natija. decision EP-FIN-043 🔵 (formula docs'da). Kod yo'q.

**03.44  ❌ yo'q**  — ❓ Клей tarkibiy moddalari (сода/крахмал/бура) alohida sarf-norma bilan, ortiqcha=zarar?
- Siz: Yelim moddalari sarf-norma, ortiqchasi zarar (A: nazorat).
- Isbot: grep kley/clay/yelim-cost finance — YO'Q. decision EP-FIN-044 🔵. Qurilmagan.

**03.45  🟡 qisman**  — ❓ Haftalik berilgan xom-ashyo hisoboti avtomatik moliyaga (byudjet taqqos)?
- Siz: Haftalik sarf hisoboti avto-moliyaga, byudjet taqqos (A: erta ogohlantirish).
- Isbot: FP haftalik cron + variance-analysis (std vs actual byudjet-fakt) mavjud; Флексо haftalik xom-ashyo hisoboti→moliya mahsus oqimi qisman.

**03.46  🟡 qisman**  — ❓ Buyurtmalar tahlili (listlar bo'yicha) daromad o'sish % bilan ko'rinadimi?
- Siz: Daromad dashboard: list-soni+summa, oy/yil taqqos, o'sish % (A).
- Isbot: financial-reports-analytics + order-costing findTopProfitable; FinanceDashboard FE. List-soni×narx o'sish-dinamika (2017/2018 format) mahsus widget qisman.

**03.47  🟡 qisman**  — ❓ Moliya raqamlari yagona ega-bo'lim (tannarx/qarz=Бухгалтерия, narx=SD)?
- Siz: Tannarx/qarz Бухгалтерия, narx SD egaligida, boshqalar o'qiydi (A).
- Isbot: Master-data egalik standarti (MASTER_DATA_STANDARTLARI.md) + rol-gate; jadval-egasi xaritasi MODUL_SHARTNOMASI.md. Kod-darajada yozish-huquqi gate qisman.

**03.48  🟡 qisman**  — ❓ Og'zaki ma'lumot=asos emas: to'lov tasdig'i hujjatsiz bloklanadimi?
- Siz: Har to'lovga hujjat majburiy, bo'lmasa tasdiq bloklanadi (A).
- Isbot: decisions EP-FIN-048 ✅ + storage; majburiy-hujjat-gate (bo'lmasa approve-blok) kod-invariant jonli tasdiqlanmadi — qisman.

**03.49  ✅ bor**  — ❓ Avans (подотчёт): berildi→chek bilan hisob→qoldiq qaytadi to'liq tsiklmi?
- Siz: To'liq tsikl, hisob bermagan avans oylikdan chegiriladi (A).
- Isbot: cashier-podotchet.service.ts: issueAdvance(GL Dr4000/Cr5010, idempotent)+submitAdvanceReport(receipt majburiy, pending→inson-tasdiq); advance_reports jadval bor; FE FinanceTab avans.

**03.50  🟡 qisman**  — ❓ Xarajat kategoriyalari (xarajat moddalari) master-ro'yxati bormi?
- Siz: Standart xarajat moddalari (sozlanadigan), har xarajat bittasiga (A).
- Isbot: accounts (BHMS COA 42) + cost_centers(1) jadvallar; mahsus 'xarajat moddalari' (expense-category) master-data alohida tasdiqlanmadi. decision EP-FIN-050 🔵 — qisman.

**03.51  ❌ yo'q**  — ❓ Energiya (elektr/gaz/suv) stanok ish-soatiga taqsimlanib tannarxga kiradimi?
- Siz: Stanok soatlik-energiya×ish-soati→tannarxga taqsim (A).
- Isbot: grep energy-alloc/elektr-stanok finance — IoT energiya o'qish bor lekin tannarxga taqsim YO'Q. decision EP-FIN-051 🔵. Qurilmagan.

**03.52  🟡 qisman**  — ❓ Stanok amortizatsiyasi asosiy-vositalar reestrida (qiymat/muddat/oylik) bormi?
- Siz: Har stanok asosiy-vosita kartochkasi+oylik amortizatsiya (A).
- Isbot: depreciation.service.ts: 4 usul (SL/DB/SYD/units), oylik amortizatsiya, buildSchedule salvage-cap; asset_items/asset_disposals jadvallar. Stanok↔asset reestr to'liq seed qisman (data oz).

**03.53  🟡 qisman**  — ❓ Import xom-ashyo valyutada (USD/EUR)→kun kursi→so'm avtomatik, kurs-farqi?
- Siz: Ko'p valyuta+kun kursi→so'm avto, kurs-farqi alohida (A).
- Isbot: exchange_rates jadval (from/to_currency/rate/rate_date) + invoice.aggregate Currency VO (UZS default); currency_transactions jadval. Kurs-farqi avto-GL post qisman (exchange_rates data=0).

**03.54  🟡 qisman**  — ❓ Kreditor to'lov-muddati profili→aging shu muddatga nisbatan hisoblanadimi?
- Siz: Har yetkazib beruvchi to'lov-muddati profili→aging muddatga (A).
- Isbot: finance-ap.repository due_date < today aging hisoblaydi (purchase_invoices.due_date); yetkazib-beruvchi-profil standart-muddat (30 kun fallback) decision EP-FIN-054 🔵 — qisman (sana bor, profil yo'q).

**03.55  🔑 egasi-data**  — ❓ QQS (НДС) Счёт-фактурада ajratiladi, kirim/chiqim QQS reestri bormi?
- Siz: Har fakturada QQS ajratiladi, kirim/chiqim reestr (A); ⚠️ rasmiy-fiskal darajasi egasidan.
- Isbot: gl-posting SALES_TAX_PAYABLE (6310) ajratadi; income-split TAX-fond. Lekin QQS-reestr ekrani + rasmiy-fiskal daraja KONFLIKT (decision EP-FIN-055 🔵). Egasi-data.

**03.56  ✅ bor**  — ❓ Payroll INPS/ЖШДС→avtomatik GL (xarajat+kreditor soliq/xodim)?
- Siz: Payroll yopilganda avto-GL: ish-haqi xarajat+kreditor soliq (A).
- Isbot: payroll-tax.service.ts: INPS(incomeTax)+JSHD(socialContribution) hisoblaydi; gl-posting postPayrollEntry (SALARY_EXPENSE Dr/SALARY_PAYABLE Cr); finance-payroll.service + payroll_journal_entries jadval.

**03.57  🟡 qisman**  — ❓ To'lov usuli (naqd/plastik/o'tkazma/o'zaro-hisob) majburiy maydon, har usul o'z hisobiga?
- Siz: To'lov usuli majburiy, har usul kassa/bank hisobiga bog'lanadi (A).
- Isbot: cash_transactions/payments/bank_accounts jadvallar + cashier movements; to'lov-usuli enum majburiy-maydon va o'zaro-hisob alohida tasdiqlanmadi — qisman.

**03.58  🟡 qisman**  — ❓ Bir nechta bank hisobi (so'm/valyuta) real-time qoldiq dashboardda?
- Siz: Har bank hisobi alohida+umumiy qoldiq dashboard (A).
- Isbot: bank_accounts jadval (data=0) + CashFlowManagement FE; ShVB Справка о счетах (4-hisob) income-split'da. Ko'p-bank real-time qoldiq UI qisman (data yo'q).

**03.59  🟡 qisman**  — ❓ To'lov kalendari (kun bo'yicha kirim/chiqim prognozi + qoldiq) bormi?
- Siz: Kun bo'yicha cash-flow kalendar+qoldiq prognoz (A: bo'shliq oldindan).
- Isbot: cashflow-forecast.service.ts forecastWeeks (haftalik prognoz) + cashflow.service + FE CashFlowManagement. Kun-bo'yicha kalendar (ZNO sana majburiy) decision EP-FIN-059 🔵 — qisman (haftalik bor, kunlik kalendar emas).

**03.60  🟡 qisman**  — ❓ Mijoz kredit-limiti→oshsa SD buyurtma bloklanadi/tasdiqqa chiqadimi?
- Siz: Kredit-limit oshsa SD blok/kredit-tasdiq (A). Sub: kim oshira oladi — egasidan.
- Isbot: customer_accounts/sd_payments jadvallar + AR aging; SD buyurtma-yaratishda limit-gate (kredit-tasdiq holati) jonli tasdiqlanmadi. decision EP-FIN-060 🔵 — qisman.

**03.61  🟡 qisman**  — ❓ Qisman to'lov fakturalarga (eng eski avval) taqsimlanadimi?
- Siz: To'lov fakturalarga qo'lda/avto (FIFO) taqsim, aniq aging (A).
- Isbot: invoice_payment_matching + invoice_payments jadvallar mavjud; FIFO-taqsim algoritmi (eng eski avval) kod-darajada tasdiqlanmadi — qisman.

**03.62  ❌ yo'q**  — ❓ Пеня/jarima kechikkan to'lovga (kun×stavka) avto-hisoblanadimi?
- Siz: Shartnomaga ko'ra пеня avto (kun×stavka), tasdiqdan keyin GL (A).
- Isbot: grep penya/penalty(to'lov)/late-fee finance — faqat HR attendance/payroll penalty bor (boshqa). To'lov-пеня YO'Q. decision EP-FIN-062 🔵.

**03.63  🟡 qisman**  — ❓ Inventarizatsiya farqi (ombor sanоq)→avtomatik GL tuzatma (kamomad/ortiqcha)?
- Siz: Sanoq farqi avto-GL (kamomad=zarar/ortiqcha=daromad), moliya tasdiq (A).
- Isbot: asset_inventory jadval + gl-posting ONE-engine + WMS goods harakatlari; inventarizatsiya-farq→avto-GL tuzatma+moliya-tasdiq oqimi jonli tasdiqlanmadi — qisman.

**03.64  ✅ bor**  — ❓ Davr yopish (oy)→qulflangan davrga yozuv bloklanadimi (faqat egasi ochadi)?
- Siz: Davr yopilganda qulf, faqat egasi/moliya-rahbar ochadi (A: immutable).
- Isbot: gl-posting.service.ts:160-171 EP-FIN-064 PERIOD LOCK: yopiq davrga post→Err 'Davr yopilgan' (400); finance-accounting.service closePeriod(id,closedBy); accounting_periods jadval.

**03.65  🟡 qisman**  — ❓ Совершенствование bo'limi moliyaviy og'ish tahliliga avtomatik kiradimi?
- Siz: Moliyaviy og'ish Совершенствование oylik tahliliga avto (A: yagona markaz).
- Isbot: variance-analysis.service (og'ish+needsAudit) + financial-reports monthly cron; Совершенствование(Rivojlanish) bo'limiga avto-marshrut (Coordination) qisman.

**03.66  🟡 qisman**  — ❓ Byudjet-fakt og'ish chegaradan oshsa mas'ul kartaga расмий-талаб (Coordination)?
- Siz: Og'ish oshsa→mas'ul kartaga avto-tushuntirish talabi (A: javobgarlik).
- Isbot: variance-analysis needsAudit flag + alerts cron; mas'ul-kartaga avto расмий-талаб (Coordination event) jonli ulanish tasdiqlanmadi — qisman.

**03.67  ✅ bor**  — ❓ Har buyurtma rentabelligi (daromad−to'liq tannarx) kartochkasi bormi?
- Siz: Har buyurtma yopilganda rentabellik kartochkasi (A). Sub: zararli→egasidan.
- Isbot: order-costing.service.ts: findTopProfitable/findTopLoss/calculate(id); FE OrderCosting.tsx; daromad−tannarx hisobi.

**03.68  🟡 qisman**  — ❓ Tannarxdan past narx (zararga sotuv) SD da bloklanadi/egasi tasdig'iga chiqadimi?
- Siz: Narx tannarxdan past→blok yoki egasi tasdig'i (A).
- Isbot: tiered-pricing.service (calculate/upsert tier) + standard-cost mavjud; tannarxdan-past→blok/tasdiq gate (sort-bo'yicha min-narx) decision EP-FIN-068 🔵 — qisman (narx-mexanizm bor, blok yo'q).

**03.69  🔑 egasi-data**  — ❓ Chegirma vakolat darajasi (sotuvchi≤5%/rahbar≤15%/egasi>15%) bormi?
- Siz: Chegirma vakolat-darajasi, aniq foizlar egasidan (A).
- Isbot: tiered-pricing tier-mexanizm bor; chegirma-vakolat darajasi (foiz qiymatlari) egasi-data (decision EP-FIN-069 🔵). Foizlar belgilanmagan.

**03.70  ❌ yo'q**  — ❓ О'заро hisob (vzaimозачёт/barter) akti, ikki tomon qarzi bir vaqtda yopiladimi?
- Siz: O'zaro-hisob akti, ikki qarz bir vaqtda yopiladi (A: hujjatli).
- Isbot: grep netting/vzaimoz/o'zaro-hisob/mutual-offset finance,sd — YO'Q. decision EP-FIN-070 🔵 (QC-tasdiq+atomik). Qurilmagan.

**03.71  🟡 qisman**  — ❓ Yetkazib beruvchi moliyaviy reyting (narx+brak%+kechikiш) bormi?
- Siz: Reyting=narx+brak%+kechikiш, eng-foydali tanlov (A: arzon≠foydali).
- Isbot: mm_vendor_ratings jadval + MM dashboard/supplier-agent.service; narx+brak%+kechikiш kombinatsiya-reyting (kunlik cron) jonli tasdiqlanmadi — qisman (MM tomonda).

**03.72  🔑 egasi-data**  — ❓ Naqd kassa limiti+oshsa inkассация eslatmasi bormi?
- Siz: Kassa limiti+oshsa bankka topshirish eslatmasi (A). Aniq limit egasidan.
- Isbot: cashier-hub.service.ts:240 limitExceeded (dailyCashLimit→balance>limit ogohlantirish); cfo_config default. LIMIT QIYMATI egasi-data (decision EP-FIN-072 🔵). Mexanizm bor.

**03.73  ✅ bor**  — ❓ Ish-haqi avansi (oy yarmida)→oxirgi hisob avansni chegiradimi?
- Siz: Avans HR payroll tsiklida qayd→oxirgi hisob chegiradi (A).
- Isbot: cashier-podotchet avans (HR-debitor) + payroll oylikdan chegirma (Q182); advance_payments/cash_advances jadvallar; finance-payroll.service.

**03.74  🟡 qisman**  — ❓ Jarima/ushlanma (xodim zarari brak/kamomad)→tasdiqlansa ish-haqidan ushlanma?
- Siz: Zarar tasdiqlansa ish-haqidan ushlanma, qonuniy chegara ichida (A). Maks-foiz egasidan.
- Isbot: finance-extended-payroll.service penalty type bor + payroll chegirma; brak/kamomad→ushlanma tasdiq-zanjiri (MES brak↔payroll) jonli tasdiqlanmadi. Maks-foiz egasi-data — qisman.

**03.75  🟡 qisman**  — ❓ Mijoz avansi (oldindan) alohida kreditor-mijoz→yetkazilgach daromadga o'tadimi?
- Siz: Mijoz avansi alohida hisob→yetkazilgach daromadga (A: avans≠daromad).
- Isbot: advance_payments + sd_payments + invoice.aggregate paid/total Money VO; avans→daromad accrual o'tkazish (yetkazilgach) jonli oqim qisman. decision EP-FIN-075 ✅-belgilangan, kod qisman.

**03.76  ❌ yo'q**  — ❓ Bo'sh quvvat→marjinal-narx tahlili→qaror egaga chiqadimi?
- Siz: Bo'sh quvvat+marjinal-narx tahlil→qaror egaga (A: aqlli to'ldirish).
- Isbot: break-even.service bor lekin bo'sh-quvvat marjinal-narx tahlili (иш йук bilan) YO'Q. decision EP-FIN-076 🔵. Qurilmagan.

**03.77  ✅ bor**  — ❓ Tannarx versiyasi (norma o'zgarganda)→har buyurtma o'z davridagi qiymat bilan?
- Siz: Норма/narx versiyali (amal-sanasi)→buyurtma o'z davri qiymati (A: immutable tarix).
- Isbot: standard-cost.service.ts: versiyali std-cost (eng-yaqin revision o'qiladi, eski revisionlar queryable, satr 15); technology_cards versiyalash (ADR).

**03.78  🟡 qisman**  — ❓ Xarajat-markazi (бўлим/участка bo'yicha xarajат) hisobi bormi?
- Siz: Har xarajat bo'limga (Флексо/Офсет) bog'lanadi→bo'lim hisoboti (A: javobgarlik).
- Isbot: cost_centers jadval (data=1) + gl-posting; xarajat→bo'lim-markaz avto-bog'lash va bo'lim-bo'yicha hisobot qisman (cost_centers oz).

**03.79  🟡 qisman**  — ❓ Daromad yetkazilganda (akт/накладной) tan olinadimi (accrual)?
- Siz: Yetkazilganda akт bilan tan olinadi (A: standart accrual).
- Isbot: gl-posting postSalesInvoice (AR Dr/Revenue Cr) yetkazish-asosida; SD invoice↔накладной akт-tasdiq triggeri jonli tasdiqlanmadi — qisman.

**03.80  ❌ yo'q**  — ❓ To'lov so'rovi (ЗНО) navbati/ustuvorligi (ish-haqi>soliq>xom-ashyo)?
- Siz: Ustuvorlik darajasi (sozlanadigan)→navbat avto-taklif (A). Tartib egasidan.
- Isbot: cashier-hub limit-ogohlantirish bor lekin ZNO ustuvorlik-navbat (priority-queue, pul yetmaganda) YO'Q. decision EP-FIN-080 🔵. Qurilmagan.

**03.81  🟡 qisman**  — ❓ Pul aylanma davri (debitor kun−kreditor kun+ombor kun) dashboard bormi?
- Siz: Pul aylanma davri dashboard, likвidlik nazorati (A).
- Isbot: financial-ratios.service + cashflow-forecast + AP/AR aging mavjud (komponentlar bor); cash-conversion-cycle birlashgan dashboard widget jonli tasdiqlanmadi — qisman. decision EP-FIN-081 🔵.

**03.82  ✅ bor**  — ❓ Egasi uchun 1-ekran moliya dashboard (qoldiq+7-kun prognoz+qarz+foyda)?
- Siz: Egaga moliya dashboardи: qoldiq+7-kun+qarz+foyda (A: tezkор qaror).
- Isbot: FE FinanceDashboard.tsx + Tabs/Payroll + company-state.service (cash_flow) + cashflow-forecast + owner-summary.service; director-holat metriklar.

**03.83  🟡 qisman**  — ❓ Режа қоғози imzo/qabul-topshириш zanjiri (kim berdi/oldi/qachon)?
- Siz: Har bosqichda elektron tasdiq, uzilmas zanjir (A).
- Isbot: podotchet inson-tasdiq zanjiri + approval_request_steps; Режа қоғози-mahsus imzo-qabul zanjiri (ombor→таъминотчı→бухгалтерия) qurilmagan — qisman. decision EP-FIN-083 ✅-belgilangan, kod yo'q.

**03.84  ✅ bor**  — ❓ Faktura-to'lov-yetkaziш 3-way match (zakaz=faktura=kirim) bloklaydimi?
- Siz: 3-way match mos kelmasa to'lов bloklanadi (A: ortiqcha to'lov oldi).
- Isbot: mm/goods-receipt.handler.ts: validateThreeWayMatch(poId)→matched=false→ThreeWayMatchFailedEvent (rollback-keyin-emit); three-way-match-failed.listener.ts.

**03.85  ❌ yo'q**  — ❓ Брак% normadan oshsa tannarx-og'ishi+ogohlantirish moliyaga chiqadimi?
- Siz: Брак%>норма→tannarx og'ishi+ogohlantirish (A: erta nazorat).
- Isbot: variance-analysis (umumiy og'ish) bor lekin brak%↔norма-taqqos→tannarx-og'ish mahsus oqimi YO'Q. decision EP-FIN-085 🔵. Qurilmagan (QC defect_catalog ulanmagan).

**03.86  🟡 qisman**  — ❓ Yangi material/stanok narxi master-data faqat Бухгалтерия kartasi egaligida?
- Siz: Narx master-data faqat moliya kartasi egaligida, boshqalar o'qiydi (A: yagona haqiqat).
- Isbot: MASTER_DATA_STANDARTLARI jadval-egasi + rol-gate; material-narx yozish-huquqi faqat moliya-karta (org-karta resolver) kod-invariant jonli tasdiqlanmadi — qisman (egasi-data head_user_id).

---

## 04 — Coordination / Council  (vizyon 30%, 117 savol)

**04.1  ❌ yo'q**  — ❓ Kengash a'zolari org-strukturadan avtomat (CEO + 7 otdeleniye boshlig'i = doimiy a'zo) keladimi?
- Siz: EP-COR-031: A — org-strukturadan avtomat, karta orqali (Vysotskiy 7)
- Isbot: councils jadval (5 qator) bor lekin council_members jadval YO'Q (information_schema: faqat chat_members/task_project_members); chairperson_id hammasi NULL. A'zolik mexanizmi qurilmagan.

**04.2  ❌ yo'q**  — ❓ Kengash a'zosi turlari (4 rol: Rais/Kotib/A'zo/Mehmon) tizimda bormi?
- Siz: EP-COR-032: A — 4 rol, faqat A'zo+Rais ovoz beradi
- Isbot: councils jadval ustunlari: id/name/council_type/description/chairperson_id/meeting_schedule/is_active/created_at — rol/a'zolik ustuni yoki member jadvali yo'q.

**04.3  ❌ yo'q**  — ❓ Kvorum foizi (2/3 yoki 50%+1) tekshiriladimi, kvorum yetmasa nima bo'ladi?
- Siz: EP-COR-033 (🔵 OCHIQ): A-default 2/3, yetmasa maslahat majlisi
- Isbot: grep 'quorum|kvorum' butun apps/api/src — koordinatsiyaga oid hech narsa (faqat chat polls). Kvorum logikasi umuman yo'q.

**04.4  ❌ yo'q**  — ❓ Ovoz berish usuli va g'olib chegarasi (teng bo'lsa Rais hal qiladi) qurilganmi?
- Siz: EP-COR-034 (🔵 OCHIQ): A-default oddiy ko'pchilik, teng→Rais
- Isbot: grep vote/voting/ovoz — faqat chat_advanced poll, koordinatsiyada ovoz berish yo'q. Majlis qarori ovoz mexanizmi qurilmagan.

**04.5  ❌ yo'q**  — ❓ A'zo o'rniga vakil (delegatsiya, ishonchnoma bilan) ovoz bera oladimi?
- Siz: EP-COR-035 (🔵 OCHIQ): A-default yozma ishonchnoma bilan vakil
- Isbot: A'zolik/ovoz mexanizmi yo'q bo'lgani uchun delegatsiya ham yo'q. Hech qanday delegation/proxy kod yo'q.

**04.6  ❌ yo'q**  — ❓ A'zolik manfaat to'qnashuvi (chetlashtirish) qoidasi bormi?
- Siz: EP-COR-036 (🔵 OCHIQ): A-default aloqador a'zo chetlashtiriladi, ovozi sanalmaydi
- Isbot: conflict_of_interest belgisi/council_session_members jadval YO'Q (javoblar #2 da spec qilingan lekin qurilmagan). Ovoz/a'zolik bo'lmagani uchun mavjud emas.

**04.7  ❌ yo'q**  — ❓ Majlis turlari (Operativ/Oylik/Choraklik/Favqulodda) tizimda farqlanadimi?
- Siz: EP-COR-037 (🔵 OCHIQ): A-default 4 tur
- Isbot: councils.council_type = domen turi (management/quality/...), majlis turi emas. Meeting/session jadvali yo'q; majlis turini saqlash mexanizmi yo'q.

**04.8  🟡 qisman**  — ❓ Doimiy jadval (raspisaniye) avto takrorlanuvchi cron bilan bormi?
- Siz: EP-COR-038 (✅): A — avto jadval, Seshanba ЗВС cron
- Isbot: councils.meeting_schedule ustuni bor lekin hammasi NULL (5/5). Seshanba 08:45 ЗВС eslatma cron'i (EP-COR-017) kodda topilmadi; bot.helpers.ts faqat /zvs_status buyruq. Avto rejalashtirish ishlamaydi.

**04.9  ❌ yo'q**  — ❓ Majlis chaqirig'ini oldindan ogohlantirish muddati (2 ish kuni / 3 soat) bormi?
- Siz: EP-COR-039 (🔵 OCHIQ): A-default oddiy 2 kun, favqulodda 3 soat
- Isbot: Majlis chaqiriq/meeting jadvali yo'q (faqat councils statik). Ogohlantirish-muddat logikasi qurilmagan.

**04.10  ❌ yo'q**  — ❓ Kun tartibi (povestka) muddati va qulflanishi bormi?
- Siz: EP-COR-040 (🔵 OCHIQ): A-default 1 ish kuni oldin qulflanadi
- Isbot: Povestka/agenda jadvali yoki ustuni yo'q. Protokol/majlis moduli umuman qurilmagani uchun kun tartibi yo'q.

**04.11  ❌ yo'q**  — ❓ Davomat (4 holatli yo'qlama) va sababsiz yo'q 3 marta = HR ogohlantirish bormi?
- Siz: EP-COR-041 (🔵 OCHIQ): A-default 4 holatli davomat, turniket bilan
- Isbot: attendance/davomat jadvali koordinatsiyada yo'q. Majlis davomati mexanizmi qurilmagan (javoblar #7/#26 spec qilingan lekin yo'q).

**04.12  ❌ yo'q**  — ❓ Majlis davomiyligi cheklovi (Operativ 30daq/Oylik 90daq) bormi?
- Siz: EP-COR-042 (🔵 OCHIQ): A-default vaqt limiti, oshsa keyingiga ko'chadi
- Isbot: Majlis/meeting entiteti yo'q; davomiylik cheklovi logikasi qurilmagan.

**04.13  🟡 qisman**  — ❓ Доклад turlari (rejali/so'rovga javob/muammo) va kim topshiradi belgilanadimi?
- Siz: EP-COR-043 (🔵 OCHIQ): A-default 3 tur, otdeleniye boshlig'i rejali doklad majbur
- Isbot: dokla jadval bor (from_user_id/council_level/subject/problem/result/proposal/status) jonli 2 qator; lekin doklad TURI (rejali/muammo) ustuni yo'q. Asosiy entitet bor, tur klassifikatsiyasi yo'q.

**04.14  ❌ yo'q**  — ❓ Доклад javob muddati (3 ish kuni / shoshilinch 1 kun) qoidasi bormi?
- Siz: EP-COR-044 (✅): A — hujjat turiga qarab muddat (avans 4soat/ta'til 24soat)
- Isbot: dokla jadvalda deadline/muddat ustuni YO'Q (id/title/status/from_user_id/council_level/subject/problem/result/proposal). Doklad muddati saqlanmaydi.

**04.15  ❌ yo'q**  — ❓ Доклад kechiksa eskalatsiya (eslatma→yuqori rahbar→KPI) ishlaydimi?
- Siz: EP-COR-045 (✅): A — eslatma→eskalatsiya→KPI kechikish
- Isbot: Doklad muddati yo'q + eskalatsiya cron yo'q (grep @Cron director'da hech narsa). Doklad eskalatsiyasi qurilmagan.

**04.16  🟡 qisman**  — ❓ Доклад formati 6 majburiy maydon (Davr/Bajarilgan/Reja-fakt/Muammo/Taklif/Ilova) bormi?
- Siz: EP-COR-046 (🔵 OCHIQ): A-default 6 maydon
- Isbot: dokla 4 ta tarkibiy maydon bor (subject/problem/result/proposal — EP-COR-004 mos), lekin 6-maydonli kengaytirilgan format (davr/reja-fakt/ilova) yo'q. Ilova/fayl ustuni yo'q.

**04.17  ❌ yo'q**  — ❓ Доклад raqamlari ERP modullaridan (Production/Finance/Warehouse) avto tortiladimi?
- Siz: EP-COR-047 (✅): A — asosiy raqam ERP'dan avto, izoh qo'lda (30/70)
- Isbot: dokla maydonlari faqat erkin matn (problem/result/proposal text). ERP modullaridan raqam tortish integratsiyasi yo'q; auto-pull kodi topilmadi.

**04.18  🟡 qisman**  — ❓ Доклад holatlari (Qoralama→Topshirildi→Ko'rib chiqilmoqda→Qabul/Qaytarildi) oqimi bormi?
- Siz: EP-COR-048 (✅): A — 5 holat oqimi (sent/read/resolved/archived)
- Isbot: dokla.status bor, FE+BE da sent/read/resolved 3 holat wired (controller: dokla/:id/read, dokla/:id/resolved). Qoralama/Qaytarildi/Arxiv holatlari yo'q — qisman oqim.

**04.19  🟡 qisman**  — ❓ Распоряжение va Приказ farqlanadimi (Расп=bo'lim boshlig'i, Приказ=CEO rasmiy)?
- Siz: EP-COR-049 (✅): A — alohida ikki tur
- Isbot: rasporyazhenie jadval bor (jonli, 0 qator). Приказ/prikaz jadval yoki controller umuman YO'Q (information_schema'da prikaz yo'q). Faqat yarmi qurilgan — ikkisi farqlanmaydi.

**04.20  🟡 qisman**  — ❓ Распоряжение ustuvorlik 4 daraja (Past/O'rta/Yuqori/Shoshilinch) + standart muddat bormi?
- Siz: EP-COR-050 (✅): A — 4 daraja, har biriga muddat
- Isbot: rasporyazhenie.priority + deadline ustunlari bor (jadval jonli). Lekin darajaga bog'langan AVTO standart muddat (Shoshilinch=shu kun, Past=10) logikasi yo'q; priority erkin string.

**04.21  🟡 qisman**  — ❓ Распоряжение 6 majburiy maydon (Beruvchi/Bajaruvchi/Vazifa/Muddat/Ustuvorlik/Asos) bormi?
- Siz: EP-COR-051 (🔵 OCHIQ): A-default 6 maydon
- Isbot: rasporyazhenie: from_user_id/to_user/task/deadline/priority bor (5 maydon). 'Asos' (qaysi majlis/qaror) ustuni YO'Q — havola/asos bog'lanmaydi.

**04.22  🟡 qisman**  — ❓ Bajaruvchi bitta asosiy mas'ul + ixtiyoriy yordamchilar bo'la oladimi?
- Siz: EP-COR-052 (🔵 OCHIQ): A-default bitta mas'ul + yordamchilar
- Isbot: rasporyazhenie.to_user yagona bajaruvchi (string) bor; yordamchi/soispolnitel maydon yoki jadval yo'q. Faqat bitta mas'ul.

**04.23  ❌ yo'q**  — ❓ Распоряжение eskalatsiya zinapoyasi (3 bosqich, manager_id vertikal) ishlaydimi?
- Siz: EP-COR-053 (✅): A — 3 bosqich, org-sxema manager_id'dan
- Isbot: director modulda @Cron yoki escalation kod YO'Q. overdue faqat list SELECT ichida CASE bilan ko'rsatiladi (repo:111), notify/eskalatsiya yo'q. Eskalatsiya zinapoyasi qurilmagan.

**04.24  ❌ yo'q**  — ❓ Farmoyishni rad etish yoki muddat so'rash (sabab majburiy) kanali bormi?
- Siz: EP-COR-054 (🔵 OCHIQ): A-default Rad/Uzaytirish so'rovi
- Isbot: rasporyazhenie status updateRasp bor lekin rad/uzaytirish-so'rovi entiteti/oqimi yo'q. Bajaruvchi faqat done belgilaydi (markRaspDone). Rad kanali qurilmagan.

**04.25  🟡 qisman**  — ❓ Распоряжение 8 holatli to'liq oqim (Yangi/Qabul/Jarayonda/Bajarildi/Tekshiruvda/Yopildi/Bekor/Kechikkan) bormi?
- Siz: EP-COR-055 (🔵 OCHIQ): A-default 8 holat
- Isbot: rasporyazhenie.status: assigned/in_progress/done + overdue (hisoblangan). Qabul(acceptedAt)/Tekshiruvda/Bekor holatlari yo'q. ~4 holat, 8 emas.

**04.26  ❌ yo'q**  — ❓ Приказ raqamlash formati (PR-YYYY-NNN, avto o'sadi) bormi?
- Siz: EP-COR-056 (✅): A — PR-YYYY-NNN avto, teshiksiz
- Isbot: Приказ jadval/controller umuman YO'Q (information_schema prikaz=0). Raqamlash mexanizmi (SEQUENCE) qurilmagan.

**04.27  ❌ yo'q**  — ❓ Приказ kategoriyalari va prefiks (Kadrlar К/Asosiy ОД/Moliya Ф/Xo'jalik АХ) bormi?
- Siz: EP-COR-057 (🔵 OCHIQ): A-default 4 kategoriya, alohida raqam qatori
- Isbot: Приказ entiteti yo'q bo'lgani uchun kategoriya/prefiks ham yo'q. Order-registry jadval topilmadi.

**04.28  ❌ yo'q**  — ❓ Raqam ketma-ketligi va bekor qilingan приказ teshigi saqlanadimi?
- Siz: EP-COR-058 (🔵 OCHIQ): A-default teshik qoldiriladi, bekor=raqam bilan saqlanadi
- Isbot: Приказ raqamlash umuman yo'q; teshik/ketma-ketlik logikasi qurilmagan.

**04.29  ❌ yo'q**  — ❓ Приказ asos hujjati (majlis qarori/ariza/doklad havolasi) majburiy bog'lanadimi?
- Siz: EP-COR-059 (✅): A — asos majburiy, to'liq zanjir
- Isbot: Приказ entiteti yo'q. Doklad/rasporyazhenie'da ham 'asos'/havola ustuni yo'q. Oltin-ip zanjiri koordinatsiyada qurilmagan.

**04.30  ❌ yo'q**  — ❓ Приказ kuchga kirish sanasi (effective date) + tugash sanasi maydoni bormi?
- Siz: EP-COR-060 (✅): A — kuchga kirish + tugash sanasi
- Isbot: Приказ jadvali yo'q; orderEffectiveDate ustuni mavjud emas. Qurilmagan.

**04.31  ❌ yo'q**  — ❓ Imzolangan приказ qulflanadimi (immutable), o'zgartirish faqat yangi приказ bilanmi?
- Siz: EP-COR-061 (✅): A — immutable, faqat o'zgartirish приказi bilan
- Isbot: Приказ entiteti yo'q. Immutable/qulflash mexanizmi (document_hashes jadval ham yo'q) qurilmagan.

**04.32  ❌ yo'q**  — ❓ Протокол kotib avto-shablonda (kun tartibi+qaror+ovoz+mas'ul+muddat) tuziladimi?
- Siz: EP-COR-062 (✅): A — kotib avto-shablon, AI qoralash
- Isbot: Protokol/protocol jadval yoki controller umuman YO'Q (grep @Controller protocol=0). Protokol moduli qurilmagan.

**04.33  ❌ yo'q**  — ❓ Протокол imzo zanjiri (Kotib→Rais→Tasdiqlangan, 2 imzo) ishlaydimi?
- Siz: EP-COR-063 (✅): A — 2 bosqich imzo
- Isbot: Protokol entiteti yo'q; imzo zanjiri qurilmagan. Kengashda rais/kotib roli ham yo'q (chairperson_id NULL).

**04.34  ❌ yo'q**  — ❓ Imzo turi (tizim ichidagi 'Tasdiqlash' + audit: kim/qachon/IP) bormi?
- Siz: EP-COR-064 (✅): A — tizim tasdiqlash + audit-log
- Isbot: Protokol/imzo entiteti yo'q. Audit-log koordinatsiya imzosi uchun yozilmaydi. Qurilmagan.

**04.35  ❌ yo'q**  — ❓ Imzo muddati (2 ish kuni ichida Rais) + kechiksa eslatma+CEO ro'yxati bormi?
- Siz: EP-COR-065 (✅): A — 2 kun imzo, kechiksa eslatma
- Isbot: Protokol imzo entiteti yo'q + imzo-muddat cron yo'q. Qurilmagan.

**04.36  ❌ yo'q**  — ❓ Imzolangan протоколни o'zgartirish (versiya, tuzatish protokoli, asl saqlanadi) bormi?
- Siz: EP-COR-066 (✅): A — immutable + tuzatish protokoli
- Isbot: Protokol entiteti yo'q; versiyalash mexanizmi qurilmagan (cc_document_versions jadval bor lekin cc_documents=0 va koordinatsiya protokoliga ulanmagan).

**04.37  ❌ yo'q**  — ❓ E'tiroz (osoboye mneniye / alohida fikr) protokolga yozila oladimi?
- Siz: EP-COR-067 (🔵 OCHIQ): A-default a'zo alohida fikr yozadi, ilova
- Isbot: Protokol/e'tiroz entiteti yo'q. Qurilmagan.

**04.38  ❌ yo'q**  — ❓ Majlis qarori avto Распоряжение (mas'ul+muddat) ga aylanadimi (action item)?
- Siz: EP-COR-068 (✅): A — har qaror avto topshiriq ochiladi
- Isbot: Protokol/qaror entiteti yo'q + auto-convert kod yo'q (grep actionItem/auto-rasp director=0). Qaror→topshiriq zanjiri qurilmagan; rasporyazhenie faqat qo'lda yaratiladi.

**04.39  ❌ yo'q**  — ❓ Bajarilish foizi va holat ko'rsatkichi (har majlis boshida o'tgan qaror holati) bormi?
- Siz: EP-COR-069 (🔵 OCHIQ): A-default holat+foiz, avto ko'rsatiladi
- Isbot: Qaror entiteti yo'q; bajarilish foizi hisoblanmaydi. rasporyazhenie stats (assigned/done/overdue count) bor lekin qaror-bog'liq foiz emas.

**04.40  ❌ yo'q**  — ❓ Bajarilmagan qaror keyingi majlis kun tartibiga avto ko'chadimi?
- Siz: EP-COR-070 (🔵 OCHIQ): A-default avto 'bajarilmagan qaror' bo'limi
- Isbot: Majlis/kun tartibi entiteti yo'q; ko'chirish cron yo'q. Qurilmagan.

**04.41  ❌ yo'q**  — ❓ Bajarish dalili (pruf: fayl/foto) Yuqori/Shoshilinch qarorlarga majburiymi?
- Siz: EP-COR-071 (🔵 OCHIQ): A-default dalil majburiy
- Isbot: rasporyazhenie.done_note (text) bor lekin fayl/dalil ilova ustuni yo'q. Dalil-majburiyligi logikasi qurilmagan.

**04.42  🟡 qisman**  — ❓ Bajarilishni 2 bosqichda (bajaruvchi 'Bajardim'→beruvchi 'Qabul qildim') kim yopadi?
- Siz: EP-COR-072 (✅): A — ikki bosqichli yopish
- Isbot: markRaspDone bor (bajaruvchi/beruvchi/admin done belgilaydi — service:96-100 auth). Lekin AYRIM 2-bosqich (bajardi→keyin beruvchi qabul) emas — bitta bosqichda done bo'ladi. Yarim.

**04.43  ❌ yo'q**  — ❓ Qaror bajarilish reytingi (mas'ullar bo'yicha o'z vaqtida %) KPI'ga ulanadimi?
- Siz: EP-COR-073 (🔵 OCHIQ): A-default oylik reyting KPI'ga
- Isbot: Reyting/KPI hisoblash kodi koordinatsiyada yo'q. rasporyazhenie stats faqat 7-kunlik count. Reyting qurilmagan.

**04.44  ❌ yo'q**  — ❓ Arxivga to'liq paket (protokol+kun tartibi+doklad+ovoz+qaror+davomat+ilova) saqlanadimi?
- Siz: EP-COR-074 (✅): A — to'liq paket har majlisga
- Isbot: Majlis/protokol/ovoz/davomat entitetlari yo'q. dokla/rasporyazhenie alohida qoladi; majlisga bog'langan to'liq arxiv paketi qurilmagan.

**04.45  ❌ yo'q**  — ❓ Arxivda ko'p mezonli qidiruv (sana+mavzu+mas'ul+raqam+holat) bormi?
- Siz: EP-COR-075 (🔵 OCHIQ): A-default ko'p mezonli + tsvector
- Isbot: dokla/rasporyazhenie list 100 limit, filtrsiz (repo). Qidiruv/tsvector koordinatsiyada yo'q. Qurilmagan.

**04.46  ❌ yo'q**  — ❓ Arxivga kirish huquqi (Ochiq/Maxfiy belgi, RBAC kartadan) bormi?
- Siz: EP-COR-076 (✅): A — Ochiq/Maxfiy, RBAC kartadan
- Isbot: dokla/rasporyazhenie'da maxfiylik/visibility ustuni yo'q. Service'da PRIVILEGED_ROLES role-check bor (admin/director/ceo) lekin maxfiy-majlis filtri yo'q. Qurilmagan.

**04.47  ❌ yo'q**  — ❓ Arxiv saqlash muddati va o'chirish taqiqi (immutable, kadrlar muddatsiz) bormi?
- Siz: EP-COR-077 (✅): A — o'chirilmaydi, min 5 yil
- Isbot: dokla/rasporyazhenie HARD DELETE qilinadi (repo: db.delete — deleteDokla/deleteRasp). Immutable/soft-delete yo'q; o'chirish taqiqi qurilmagan.

**04.48  ❌ yo'q**  — ❓ Arxiv o'zgarmasligi (har ko'rish/o'zgartirish/yuklab olish audit izi) yoziladimi?
- Siz: EP-COR-078 (✅): A — har amal audit-log
- Isbot: Koordinatsiya amallari uchun audit-log yozuvi kodda yo'q (faqat console emas). document_hashes/audit jadval yo'q. Qurilmagan.

**04.49  ❌ yo'q**  — ❓ Arxivdan davr hisoboti (qaror+bajarilish%+kechikkan) PDF/Excel eksport bormi?
- Siz: EP-COR-079 (🔵 OCHIQ): A-default bir tugma davr hisoboti
- Isbot: Koordinatsiyada PDF/Excel eksport endpoint yo'q (controller'da export yo'q). Qurilmagan.

**04.50  🟡 qisman**  — ❓ Eslatma kanali (ERP ichi + Telegram, manager_id/telegram_group'dan) ishlaydimi?
- Siz: EP-COR-080 (✅): A — ERP ichi + Telegram
- Isbot: TelegramModule director'ga import qilingan (director.module:115) + /zvs_status bot buyrug'i bor (bot.helpers:151). Lekin doklad/rasporyazhenie yaratilganda Telegram NTF yuborish kodi topilmadi — event/notify ulanmagan.

**04.51  ❌ yo'q**  — ❓ Majlisni o'tkazmaslik/qoldirish (avto keyingi sanaga, doklad saqlanadi) qoidasi bormi?
- Siz: EP-COR-081 (🔵 OCHIQ): A-default avto ko'chiriladi
- Isbot: Majlis entiteti yo'q; qoldirish/ko'chirish logikasi qurilmagan.

**04.52  ❌ yo'q**  — ❓ Favqulodda majlis (3 soatda, yengil kvorum 50%, keyin tasdiq) mexanizmi bormi?
- Siz: EP-COR-082 (🔵 OCHIQ): A-default favqulodda 3 soat, 50%
- Isbot: Majlis/kvorum entiteti yo'q; favqulodda majlis qurilmagan.

**04.53  ❌ yo'q**  — ❓ Coordination→boshqa modul (qaror turi bo'yicha Production/Finance/HR/Warehouse signal) avto bog'lanadimi?
- Siz: EP-COR-083 (✅): A — qaror turi bo'yicha avto signal (oltin ip)
- Isbot: director modulda @OnEvent/EventEmitter emit koordinatsiya uchun yo'q (grep=faqat module import). Qaror→modul signal zanjiri qurilmagan.

**04.54  ❌ yo'q**  — ❓ Kengash a'zosi lavozim almashsa a'zolik+topshiriqlar avto yangi egasiga o'tadimi (karta-model)?
- Siz: EP-COR-084 (✅): A — karta-model, avto o'tadi
- Isbot: council_members/card_member_snapshot jadval yo'q; a'zolik karta-modelga ulanmagan (chairperson_id NULL, FK yo'q). Avto-o'tish qurilmagan.

**04.55  🟡 qisman**  — ❓ Majlis tili va ko'p tillilik (uz-lotin/kirill/rus, har hujjatga til tanlash) bormi?
- Siz: EP-COR-085 (✅): A — har hujjatga til tanlash
- Isbot: Loyiha i18n 3 tilli (coordination.json uz/uz-cyr/ru locales mavjud — UI tili). Lekin har HUJJATGA (dokla/rasp) til-tanlash ustuni yo'q; faqat UI til. Qisman.

**04.56  🟡 qisman**  — ❓ Рек.Совет (ЗВС) sessiyasi: ochiladi→ЗВС qo'shiladi→qaror→yopiladi+hisobot to'liq bormi?
- Siz: EP-COR-015 (✅): A — to'liq sessiya + hisobot
- Isbot: zvs jadval + controller bor (hr/zvs: create/list/approve/reject — zvs.controller:35-71), jonli 0 qator. Lekin SESSIYA wrapper (ochish/yopish/hisobot) va rec_council_session jadval YO'Q. Faqat ЗВС yozuvlari, sessiya emas.

**04.57  🟡 qisman**  — ❓ Рек.Совет qarori 3 xil (to'liq/qisman summa bilan/rad) bormi?
- Siz: EP-COR-016 (✅): A — to'liq/qisman/rad
- Isbot: zvs approve/reject endpointlari bor (controller:58,71). Lekin 'qisman' (partialApproval/approvedAmount/rejectedAmount) ustunlari yo'q (zvs faqat amount ustuni). 2 xil qaror, 3 emas.

**04.58  ❌ yo'q**  — ❓ Рек.Совет sessiyasidan oldin eslatma (Seshanba 08:45 cron) ishlaydimi?
- Siz: EP-COR-017 (✅): A — Seshanba 08:45 cron eslatma
- Isbot: @Cron Seshanba eslatma kodi director'da topilmadi (grep @Cron=0 koordinatsiyada). /zvs_status faqat so'rovga javob beradi. Avto-eslatma cron qurilmagan.

**04.59  ❌ yo'q**  — ❓ Рек.Совет sessiya hisoboti (tasdiqlangan/rad/jami summa, protokolga bog'liq) avto-chiqadimi?
- Siz: EP-COR-018 (✅): A — avto-hisobot
- Isbot: Sessiya entiteti yo'q (faqat zvs yozuvlari). generateSessionReport/eksport endpoint yo'q. Hisobot qurilmagan.

**04.60  🟡 qisman**  — ❓ Koordinatsiya boshqaruv paneli (ochiq doklad/kutilayotgan rasp/yaqin majlis/приказ soni) bormi?
- Siz: EP-COR-026 (✅): A — yagona panel umumiy ko'rinish
- Isbot: FE CoordinationPage Overview tab + GET /coordination/stats (dokla+rasporyazhenie 7-kunlik count) jonli ishlaydi. Lekin 'yaqin majlis'/'приказ soni' yo'q (bu entitetlar qurilmagan). Qisman panel.

**04.61  ❌ yo'q**  — ❓ Eskalatsiya: bajarilmagan masala org-tuzilma bo'yicha yuqoriga (2x eslatma→eskalatsiya→HR) ko'tariladimi?
- Siz: EP-COR-027 (✅): A — avto eskalatsiya manager_id bo'yicha
- Isbot: @Cron/eskalatsiya kod yo'q (director); overdue faqat SELECT CASE bilan ko'rsatiladi (repo:111), HR'ga ko'tarish yo'q. Eskalatsiya qurilmagan.

**04.62  ❌ yo'q**  — ❓ Org-tuzilma bilan avto-yo'naltirish (vertikal zanjir, hujjat sakramaydi: vertikal→gorizontal)?
- Siz: EP-COR-028 (✅): A — org-sxema avto, Vysotskiy 7
- Isbot: dokla.council_level qo'lda tanlanadi; org-sxema/manager_id bo'yicha avto-yo'naltirish kodi yo'q (grep manager_id/rout director=0). Vertikal zanjir routing qurilmagan.

**04.63  🟡 qisman**  — ❓ Telegram orqali koordinatsiya buyruqlari (topshiriqlarim/dokladlarim/bajardim) ishlaydimi?
- Siz: EP-COR-029 (✅): A — Telegram komandalar
- Isbot: /zvs_status bot buyrug'i bor (bot.helpers:151-164). Lekin 'topshiriqlarim/dokladlarim/bajardim' koordinatsiya buyruqlari topilmadi. Faqat ЗВС buyrug'i — qisman.

**04.64  ❌ yo'q**  — ❓ Karta-model: kengash hisobotini AI tahlil qiladimi (kim kechiktiradi, qaysi masala takror)?
- Siz: EP-COR-030 (✅): A — karta AI koordinatsiya tahlil
- Isbot: Koordinatsiya doklad/qarorlarini AI tahlil qiluvchi kod yo'q (director'da AI listener yo'q). Karta-AI koordinatsiyaga ulanmagan. Qurilmagan.

**04.65  🟡 qisman**  — ❓ Gorizontal workflow_rules (manba bo'lim→maqsad bo'lim→hujjat turi, avto-routing) ishlaydimi?
- Siz: EP-COR-089/v2-Q59 (✅): A — workflow_rules jadval, sektsiya darajasigacha
- Isbot: workflow_rules jadval STRUKTURASI to'g'ri (request_type/source_department_id/source_function_id/step_order/approver_*) + CRUD+resolve endpoint (workflow-rules.controller) ishlaydi. LEKIN jonli 0 qator + hech qaysi hujjat oqimi bu qoidalarni ISHLATMAYDI (resolve chaqiruvchi yo'q). Mexanizm bor, ulanmagan+bo'sh.

**04.66  🟡 qisman**  — ❓ Uch-karzina (3-tray: Yangi/Jarayonda/Tugagan) hujjat tizimi koordinatsiyada bormi?
- Siz: v2-Q76/EP-COR-051 javob#24: 3-karzina COR hujjatlari uchun (Kanban'dan izolyatsiya)
- Isbot: FE Baskets tab + GET /coordination/baskets (cc_documents.basket_state'dan o'qiydi — repo:178-202). LEKIN cc_documents jonli 0 qator; basket holatlari bo'sh. Mexanizm bor, ma'lumotsiz.

**04.67  ❌ yo'q**  — ❓ Buyurtma №/Papka № har koordinatsiya hujjatiga yagona kalit sifatida bog'lanadimi?
- Siz: EP-COR-097/v2-Q67 (✅): A — papka № yagona kalit (fabrika tili)
- Isbot: dokla/rasporyazhenie'da order_id/papka_no/buyurtma havola ustuni YO'Q. Koordinatsiya hujjatlari buyurtmaga bog'lanmagan. Qurilmagan.

**04.68  ❌ yo'q**  — ❓ Q56 (EP-COR-086): Har kuni 1-sutkalik (24h) ishlab chiqarish rejasi generatsiya qilinib logistika+uchastka+ombor kartasiga avtomat tushadimi (markazdan sinxron tarqalishmi)?
- Siz: A-default: har kuni 24h reja avto-generatsiya → 3 bo'limga push + log; o'zgarsa darrov push.
- Isbot: MPS jadvallari bor (mps_periods, erp_production_plans) lekin cron faqat absent-marker: apps/api/src/cron/daily-report.cron.ts:20 markAbsentEmployees(@Cron 0 16). 24h-reja generatori + 3-bo'lim push topilmadi.

**04.69  🟡 qisman**  — ❓ Q57 (EP-COR-087): 'Bekor turish' (downtime) sabab+vaqt+mas'ul bo'lim bilan koordinatsiya hodisasi sifatida yozilib avto-statistikaga kiradimi?
- Siz: A-default: bekor turish hodisasi (sabab+boshlanish/tugash+mas'ul bo'lim) → avto statistika (logistika KPI).
- Isbot: downtime_events jadval+drizzle-downtime.repo.ts (save/endDowntime/getDowntimeSummary) REAL; reason_code+started_at/ended_at+work_center_id bor. LEKIN 'mas'ul bo'lim' atributsiyasi va koordinatsiya-eventga ulanishi yo'q; jonli data=2 qator.

**04.70  🟡 qisman**  — ❓ Q58 (EP-COR-088): Logistika techkarta↔material nomuvofiqligida 'STOP — mos emas' qo'yib chiqishni bloklay oladimi?
- Siz: A-default: logistika STOP qo'yadi → chiqish bloklanadi + rejalashtirish/dizaynerga xabar; STOP'ni faqat reja/dizayn rahbari yechadi.
- Isbot: REAL: outbound-enforcement.service.ts:73 checkIssueAllowed → tech_card_bom da material yo'q bo'lsa BLOCK (EP-WMS-084, satr:128). Chiqim bloki ishlaydi. LEKIN STOP override-ruxsati (kim yechadi) va dizaynerga xabar uzilgan; koordinatsiya STOP-eventi sifatida emas, WMS-darajada.

**04.71  🟡 qisman**  — ❓ Q59 (EP-COR-089): Koordinatsiya hujjatlari 7-departament→bo'lim→sektsiya (Vysotskiy 7) ierarxiyasiga aniq bog'lanadimi?
- Siz: A (JAVOBLANGAN): yo'naltirish 7-dept+bo'lim+sektsiya ierarxiyasiga, sektsiya darajasigacha.
- Isbot: workflow_rules jadvalida source_department_id+source_function_id+approver_department_id/function_id bor (dept+function darajasi). Sektsiya-darajagacha aniq zanjir va org_departments to'liq daraxti data bilan to'ldirilmagan (workflow_rules=0 qator).

**04.72  🟡 qisman**  — ❓ Q60 (EP-COR-090): Har buyurtma handoff nuqtalari (savdo→dizayn, dizayn→IChQ) vaqt bilan yozilib 'ahborot uzluksizligi' (uzilish) ko'rinadimi?
- Siz: A-default: handoff nuqtalari vaqt bilan yoziladi; uzilish ko'rinadi (dizayn ЦКП).
- Isbot: sd_order_timeline jadval bor (order_id,status,note,changed_by,created_at) — status-tarix yozadi. LEKIN bu yagona umumiy timeline; savdo→dizayn→IChQ aniq handoff-nuqta segmenti va uzilish-o'lchovi modellashtirilmagan; jonli=0 qator.

**04.73  🟡 qisman**  — ❓ Q61 (EP-COR-091): Bitrix24 dizayn status-zanjiri (ТТ keldi→Dizayn tayyorlanyapti→Tasdiqda→IChQ ga topshirildi) ERP da ko'chirilganmi?
- Siz: A-default: 4 status standart; 'Tasdiqda' — buyurtmachi tasdiqlaydi (podpisnoy list).
- Isbot: DesignStatus enum REAL: NEW→AI_GENERATED→DESIGNER_REVIEW→WAITING_CUSTOMER_APPROVAL→APPROVED/REJECTED/REVISION (design-status.enum.ts:6). DesignOrder aggregate to'liq state-machine. LEKIN nomlar Bitrix bilan 1:1 emas, customer-approval gate (podpisnoy) alohida darvoza-sifatida yo'q; design_orders=0 qator.

**04.74  ❌ yo'q**  — ❓ Q62 (EP-COR-092): Podpisnoy list (buyurtmachi tasdig'i) bo'lmasa IChQ ga o'tkazish bloklanadimi (qattiq gate)?
- Siz: A-default: podpisnoy list bo'lmasa IChQ ga o'tkazish bloklanadi.
- Isbot: Design aggregate da approve()→APPROVED status bor (design-order.aggregate.ts:68), lekin alohida 'podpisnoy_lists' jadval YO'Q (to_regclass=null) va 'IChQ-ga-o'tkazish APPROVED talab qiladi' degan qattiq gate (design→production handoff enforcement) topilmadi.

**04.75  🟡 qisman**  — ❓ Q63 (EP-COR-093): Har buyurtmada qolip (СТП/kesuvchi) holati (tayyor/buyurtma berilgan/kerak emas) IChQ rejasiga bog'lanadimi?
- Siz: A-default: qolip holati → IChQ rejasiga bog'lanadi.
- Isbot: design_tooling jadval REAL (tooling_type,status,wear_percentage,max/total_usage_count,next_maintenance) + Design controller /tooling + /tooling/:id/wear-forecast (design.controller.ts:179,189). LEKIN qolip↔buyurtma↔IChQ-reja bog'lanishi (per-order qolip-tayyorligi) yo'q; design_tooling=0 qator.

**04.76  ❌ yo'q**  — ❓ Q64 (EP-COR-094): Rohler/poddon (ichki transport) reestri holat (soz/ta'mirda/band)+band-jadval bilan ko'rinadimi?
- Siz: A-default: ichki transport reestri holat+band jadval bilan.
- Isbot: to_regclass roller/pallet-transport-reestr jadvali yo'q; ow_pallet_recoveries bor (boshqa maqsad — poddon tiklash, 0 qator). Ichki transport holat+band-jadval modeli topilmadi.

**04.77  ❌ yo'q**  — ❓ Q65 (EP-COR-095): Uchastka 'chiqindi to'ldi' signal → logistikaga topshiriq → bajarish tasdig'i (yopiq tsikl) bormi?
- Siz: A-default: chiqindi to'ldi signal → topshiriq → bajarish tasdig'i (yopiq tsikl).
- Isbot: waste_records jadval bor (0 qator) lekin u faqat chiqindi-yozuv; 'to'ldi-signal → logistika-topshiriq → tasdiq' yopiq tsikl koordinatsiyasi (event+handoff) topilmadi.

**04.78  🟡 qisman**  — ❓ Q66 (EP-COR-096): Har buyurtmaga algoritm-turi (2-8 bo'lim) bo'lim-zanjiri biriktirilib keyingi bo'lim avto ko'rinadimi?
- Siz: A-default: bo'lim-zanjiri (algoritm turi) → keyingi bo'lim avto-handoff.
- Isbot: mes_operations + routing (document_routing_rules) jadvallari bor lekin 'algoritm turi 2-8 bo'lim' tasnifi va per-order bo'lim-marshruti avto-chizilishi modellashtirilmagan; document_routing_rules=0 qator.

**04.79  🟡 qisman**  — ❓ Q67 (EP-COR-097): Buyurtma №/Papka № yagona kalit — har koordinatsiya hujjati shunga bog'lanadimi (fabrika tili)?
- Siz: A (JAVOBLANGAN): buyurtma/papka № yagona kalit, har koordinatsiya hujjati shunga bog'lanadi.
- Isbot: papka_orders/mes_papka_orders jadval bor; design_orders.papka_order_id FK, qc_braks.papka_order_id mavjud — papka № ba'zi joyda bog'langan. LEKIN dokla/rasporyajeniye (cc_documents/coordination) papka №ga bog'lanmagan; mes_papka_orders=0 qator.

**04.80  ❌ yo'q**  — ❓ Q68 (EP-COR-098): Smena rejasida priladka (sozlash) oralig'i ko'rsatilib logistika+keyingi buyurtma moslanadimi?
- Siz: A-default: smena rejasida priladka oralig'i → logistika va keyingi buyurtma moslanadi.
- Isbot: Priladka (setup/changeover) vaqtini smena-rejasida ko'rsatuvchi va keyingi buyurtmaga moslovchi koordinatsiya modeli/maydoni topilmadi (grep priladka/changeover-coordination = yo'q).

**04.81  🟡 qisman**  — ❓ Q69 (EP-COR-099): Smena (den/noch) handover yozuvi (tugamagan buyurtma+ochiq STOP/bekor turish+eslatma) keyingi smenaga o'tadimi?
- Siz: A-default: smena handover yozuvi keyingi smenaga o'tadi.
- Isbot: REAL endpoint: POST /mes/shifts/handover → mes-shifts-stats.repo.ts:63 INSERT INTO mes_shift_handovers (RETURNING *). LEKIN minimal (outgoing/incoming/notes/issues) — strukturalangan tugamagan-buyurtma+ochiq-STOP+bekor-turish maydonlari to'ldirilmaydi; mes_shift_handovers=0 qator.

**04.82  ❌ yo'q**  — ❓ Q70 (EP-COR-100): Har bo'lim/karta uchun 'muvaffaqiyatli harakat / odatiy xato' blanki davriy to'ldirilib AI tahlilga kiradimi?
- Siz: A-default: blank davriy to'ldiriladi + AI tahlilga kiradi (bilim-yig'ish).
- Isbot: Success/mistake-blank jadval YO'Q (grep success-mistake/odatiy-xato/common-mistake = faqat validator/onboarding-default matnlar). lessons jadval (13 qator) = LMS dars, bu blank emas.

**04.83  🟡 qisman**  — ❓ Q71 (EP-COR-101): Har bo'limga kunlik/haftalik/oylik hisobot topshirig'i avto-ochilib kechiksa eskalatsiya (ritm) bormi?
- Siz: A (JAVOBLANGAN): avto kunlik/haftalik/oylik hisobot topshirig'i + eskalatsiya; avto kunlik (mashina→PDF).
- Isbot: AiDailyReportService.runDailyQuestionPush (ai-daily-report.service.ts:229) + ckp-daily-aggregate.cron mavjud — kunlik ЦКП-savol push bor. LEKIN haftalik/oylik ritm + topshiriq-eskalatsiya + bo'lim-hisobot-fayl yig'ish to'liq emas; daily-report.cron faqat absent-marker.

**04.84  🟡 qisman**  — ❓ Q72 (EP-COR-102): Har lavozim yo'riqnomadagi KPI lari koordinatsiya hodisalaridan avto-hisoblanadimi (manipulyatsiyasiz, 30/70)?
- Siz: A (JAVOBLANGAN): KPI lar koordinatsiya hodisalaridan avto (30% kiritish/70% tahlil).
- Isbot: ckp_fact_values (achievement_pct, source=AI_CHAT) + ai-daily-report golden-thread + ckp-cascade.listener mexanizm tayyor. LEKIN koordinatsiya-hodisalari (bekor turish/STOP/handoff) KPI ga avto-oziq sifatida ulanmagan; ckp_fact_values=0 qator (real avto-hisob isbotsiz).

**04.85  ❌ yo'q**  — ❓ Q73 (EP-COR-103): Har buyurtmaga tayyorlik % (o'tilgan bo'lim/jami bo'lim) real-vaqtda ko'rinadimi?
- Siz: A-default: buyurtma tayyorlik % real-vaqtda (bo'limlar zanjiri bo'yicha).
- Isbot: Buyurtma 'tayyorlik %' (o'tilgan/jami bo'lim) hisoblovchi koordinatsiya-ko'rsatkichi topilmadi; sd_order_timeline status-tarix beradi lekin foiz-progress hisobi yo'q.

**04.86  🟡 qisman**  — ❓ Q74 (EP-COR-104): Buyurtma menejerga bog'lanib kechikish/STOP/handoff menejerga ham bildiriladimi?
- Siz: A-default: buyurtma menejerga bog'lanadi → kechikish/STOP/handoff menejerga bildiriladi.
- Isbot: design_orders.manager_id + sales_order menejer-bog'lanishi bor (manba sxema). LEKIN STOP/handoff/kechikish-eventidan menejerga avto-bildirishnoma zanjiri topilmadi.

**04.87  ❌ yo'q**  — ❓ Q75 (EP-COR-105): Topshiriq berishda turniket holati (ishda/ishda emas) ko'rinib yo'q odamga berilmaydi/qayta yo'naltiriladimi?
- Siz: A-default: turniket holati ko'rinadi → yo'q odamga bermaslik/qayta yo'naltirish.
- Isbot: attendance_logs/hr_ai_attendance/hr_tz2_daily_attendance jadvallari bor (HR davomat) lekin turniket-holati koordinatsiya/topshiriq-berishga ulanmagan; 'ishda emas → bermaslik' logikasi yo'q; attendance_logs=0 qator.

**04.88  🟡 qisman**  — ❓ Q76 (EP-COR-106): Har xodim paneli 3 ustun (Yangi/Jarayonda/Tugagan) — uch karzina metaforasi bormi?
- Siz: A (JAVOBLANGAN): 3-savat (incoming/pending/outgoing) — Kanban moduli.
- Isbot: GET /coordination/baskets → listBaskets cc_documents.basket_state bo'yicha guruhlaydi (coordination.repository.ts:178) + kanban_boards/kanban_cards moduli. Struktura bor. LEKIN cc_documents=0 qator (bo'sh).

**04.89  ❌ yo'q**  — ❓ Q77 (EP-COR-107): Topshiriq X soat harakatsiz qolsa rahbarga 'harakatsiz' signal (yumshoq nazorat) chiqadimi?
- Siz: A-default: harakatsiz topshiriq → rahbarga signal.
- Isbot: Rasporyajeniye-da overdue-marker (cron markOverdue) bor lekin 'X soat harakatsiz → rahbarga proaktiv signal' (inactivity-based) logikasi topilmadi.

**04.90  ❌ yo'q**  — ❓ Q78 (EP-COR-108): Bo'lim ichidagi xato/qayta-ishlash bo'lim RAHBARI ko'rsatkichiga ham yoziladimi ('rahbar kamchiligi' prinsipi)?
- Siz: A (JAVOBLANGAN): xato/rework bo'lim rahbari KPI siga ham yoziladi (kitob falsafasi: mas'uliyat rahbarda).
- Isbot: qc_braks (papka_order_id,stage,reason,operator_id) + qc_defects (reported_by/resolved_by) bor, LEKIN 'department/responsible_manager' ustuni YO'Q — brak bo'lim-rahbar KPI siga atributsiya qilinmaydi. Kitob prinsipi qurilmagan.

**04.91  ❌ yo'q**  — ❓ Q79 (EP-COR-109): Bo'lim ichida yuklama ko'rinishi (har xodim ochiq ish soni/og'irligi) + bir tugmada qayta biriktirish bormi?
- Siz: A-default: yuklama ko'rinishi + qayta biriktirish.
- Isbot: Kanban-card assignee bor lekin 'bo'lim ichida xodim-yuklama o'lchovi (ochiq ish soni/og'irligi) + bir-tugmada qayta-taqsimlash' koordinatsiya-funksiyasi topilmadi.

**04.92  🟡 qisman**  — ❓ Q80 (EP-COR-110): Buyurtmaga ustuvorlik (1/2/keyingi navbat) belgilanib reja/navbat shunga qarab tartiblanadimi?
- Siz: A-default: ustuvorlik (1/2/keyingi) → reja/navbat tartiblanadi.
- Isbot: design_orders.priority ustuni bor + listBaskets priority-CASE ordering (urgent/high/normal). LEKIN sales_orders da priority/queue ustuni yo'q; '1/2/keyingi navbat butun zanjirga ta'sir' to'liq emas.

**04.93  🟡 qisman**  — ❓ Q81 (EP-COR-111): Uchastka 'material yetishmadi' signal → logistika+ombor+rejalashtirish bir vaqtda xabardor bo'ladimi?
- Siz: A-default: material yetishmadi → 3 bo'lim bir vaqtda xabardor.
- Isbot: downtime-event.aggregate.ts:27 reason MATERIAL 'Xom ashyo yetishmasligi' bor + stock-alert.cron material-shortage. LEKIN bitta signal → logistika+ombor+reja 3-yo'nalishli broadcast koordinatsiya-eventi sifatida ulanmagan.

**04.94  ✅ bor**  — ❓ Q82 (EP-COR-112): Material chiqarishda skaner techkarta gofra-turini solishtirib mos-kelmasa ogohlantiradimi (3/5 qavat aralashtirish)?
- Siz: A-default: skaner gofra-turini techkartaga solishtiradi → mos emas → ogohlantirish.
- Isbot: REAL: outbound-enforcement.service.ts:114 issuedLayer vs tech_card_bom.layer (gofra qavat '3'/'5') solishtiradi → mos emas → BLOCK_GOFRA_LAYER_MISMATCH (EP-WMS-085, satr:115). Kitobning 2-vazifa misoli aniq qurilgan (block, ogohlantirishdan ham qattiqroq).

**04.95  ❌ yo'q**  — ❓ Q83 (EP-COR-113): Dizayn↔konstruktor handoff alohida bosqich (o'lcham/begovka/vysechka tasdig'i) bilan bormi?
- Siz: A-default: dizayn↔konstruktor handoff alohida bosqich.
- Isbot: Design moduli bor lekin alohida konstruktor-roli va dizayn↔konstruktor (begovka/vysechka tasdig'i) handoff bosqichi modellashtirilmagan (grep konstruktor/begovka/vysechka handoff = yo'q).

**04.96  🟡 qisman**  — ❓ Q84 (EP-COR-114): Buyurtma o'zgarishi → ta'sirlangan bo'limlarga (logistika/ombor/IChQ/dizayn) bildirishnoma + tasdiq talab bormi?
- Siz: A (JAVOBLANGAN): buyurtma o'zgarishi → ta'sirlangan bo'limlarga bildirishnoma + tasdiq.
- Isbot: design_order_revisions jadval + sd_order_timeline status-tarix bor; o'zgarish yoziladi. LEKIN ta'sirlangan-bo'limlarga avto-broadcast + 'tasdiq talab' (acknowledge) zanjiri to'liq topilmadi.

**04.97  🟡 qisman**  — ❓ Q85 (EP-COR-115): Yig'ilish ishtiroki yozilib undan chiqqan topshiriqlar bajarilishi shu yig'ilishga ulanadimi (yopiq tsikl)?
- Siz: A-default: ishtirok yoziladi + topshiriqlar shu yig'ilishga ulanadi.
- Isbot: Protokol→action-item→rasporyajeniye zanjiri (EP-COR-068/013) qism A da bor; LEKIN 'ishtirok-davomat ↔ undan-chiqqan-topshiriq-bajarilishi' bog'lanishi (yopiq tsikl o'lchovi) modellashtirilmagan.

**04.98  ❌ yo'q**  — ❓ Q86 (EP-COR-116): Energiya/resurs tejash (suv/gaz/svet) karta javobgarligiga KPI sifatida ulanadimi?
- Siz: A-default: energiya tejash karta KPI siga ulanadi.
- Isbot: Energiya/resurs (suv/gaz/svet) tejash KPI/signal/cheklov koordinatsiya yoki karta-KPI ga ulanishi topilmadi (grep energy/resource-saving KPI = yo'q).

**04.99  🟡 qisman**  — ❓ Q87 (EP-COR-117): Nazorat varaqasi (onboarding) tugamasa kartaning to'liq topshiriqlari ochilmaydimi (yumshoq gate)?
- Siz: A (JAVOBLANGAN): nazorat varaqasi tugamasa karta topshiriqlari ochilmaydi; onboarding karta papkasidan.
- Isbot: HR onboarding moduli (onboarding-defaults.ts, offboarding-workflow) + LMS lessons (13 qator) bor. LEKIN 'nazorat varaqasi tugamaguncha koordinatsiya-topshiriq ochilmaydi' degan karta-gate koordinatsiyaga ulanmagan.

**04.100  🟡 qisman**  — ❓ Q88 (EP-COR-118): Bo'limlararo rasmiy 'ma'lumot so'rovi' hujjati (muddat+javob holati) kuzatiladimi?
- Siz: A-default: bo'limlararo rasmiy ma'lumot so'rovi (muddat+javob holati).
- Isbot: internal_requests jadval (request_no, request_type, requester, urgency, status, approved_by) + workflow_rules gorizontal-routing bor. LEKIN internal_requests faqat material/wms-count uchun yoziladi (wms-counts.repo); 'ma'lumot so'rovi' turi koordinatsiyaga ulanmagan; 0 qator.

**04.101  🟡 qisman**  — ❓ Q89 (EP-COR-119): Bo'limlararo workflow qoidalari jadvali (manba→maqsad→hujjat turi) avto-yo'naltiradimi (admin paneldan)?
- Siz: A (JAVOBLANGAN): workflow_rules jadvali (manba bo'lim→maqsad bo'lim→hujjat turi); admin paneldan konfiguratsiya.
- Isbot: REAL: workflow_rules jadval (request_type,source_department_id,approver_department_id,step_order) + WorkflowRulesService CRUD+resolve (workflow-rules.service.ts:26) + workflow-rules.controller. Struktura+kod to'liq. LEKIN workflow_rules=0 qator (qoidalar yozilmagan, avto-yo'naltirish data-siz isbotsiz).

**04.102  🟡 qisman**  — ❓ Q90 (EP-COR-120): Har bo'lim/karta ЦКП chiqishi (son+vaqt) o'lchanadimi (natijaga yo'naltirilgan)?
- Siz: A (JAVOBLANGAN): har karta ЦКП chiqishi o'lchanadi (son+vaqt).
- Isbot: ckp_card_products (target_value,formula_type) + ckp_fact_values (actual_value,achievement_pct,fact_date) + ckp-daily-aggregate.cron + ckp-cascade.listener REAL infratuzilma. Mexanizm tayyor. LEKIN ckp_fact_values=0/ckp_card_products=0 — karta-ЦКП normalari va faktlari to'ldirilmagan.

**04.103  ❌ yo'q**  — ❓ Q91 (EP-COR-121): Buyurtma plan-fakt og'ishi real-vaqtda hisoblanib chegaradan oshsa signal beradimi (erta ogohlantirish)?
- Siz: A-default: plan-fakt og'ishi real-vaqtda → chegaradan oshsa signal.
- Isbot: MES sessiya plan/fakt miqdor yozadi (updateSessionQuantity) lekin 'buyurtma plan-muddat vs fakt og'ishi → chegara → erta signal' koordinatsiya-mexanizmi topilmadi.

**04.104  🟡 qisman**  — ❓ Q92 (EP-COR-122): Brak hodisasi (bo'lim+sabab+buyurtma №) mas'ul rahbar KPI siga ulanadimi?
- Siz: A-default: brak hodisasi → mas'ul rahbar KPI siga (rahbar kamchiligi).
- Isbot: qc_braks (papka_order_id,stage,reason,operator_id,cost_impact) + qc_defects REAL. Brak sabab+buyurtma № bilan yoziladi. LEKIN 'bo'lim+mas'ul rahbar KPI atributsiyasi' ustuni/zanjiri yo'q (Q78 bilan bir bo'shliq); qc_braks=0 qator.

**04.105  ❌ yo'q**  — ❓ Q93 (EP-COR-123): Real norma-bajarilish % (xodim/uchastka) koordinatsiyada past bo'lsa rahbarga signal beradimi?
- Siz: A-default: real norma-bajarilish % → past bo'lsa rahbarga signal.
- Isbot: HR norma/oylik bor lekin 'real-vaqt norma-bajarilish % uchastka-koordinatsiyada past→rahbar signal' (operativ aralashuv) koordinatsiya-funksiyasi topilmadi; hozir oy-oxiri hisob (Excel-uslub).

**04.106  ❌ yo'q**  — ❓ Q94 (EP-COR-124): Dastgoh/buyurtmaga operator+yordamchi (Помощник) juftligi biriktirilib ikkisi ham signal oladimi?
- Siz: A-default: operator+yordamchi juftligi → ikkisi ham signal oladi.
- Isbot: MES sessiya operator_id biriktiradi (bitta), lekin operator+yordamchi JUFTLIK biriktirish va ikkisiga koordinatsiya-signal yuborish modeli topilmadi.

**04.107  ❌ yo'q**  — ❓ Q95 (EP-COR-125): Razmer/optimizatsiya taklifi koordinatsiya qarori (dizayn→savdo→rahbar tasdiq) sifatida yuritiladimi?
- Siz: A-default: razmer optimizatsiyasi koordinatsiya qarori (dizayn→savdo→rahbar tasdiq).
- Isbot: approval_workflows umumiy tasdiq-zanjiri bor, lekin 'razmer/optimizatsiya taklifi → dizayn→savdo→rahbar tasdiq' maxsus koordinatsiya-qaror-turi topilmadi (Excel-tahlilda qoladi).

**04.108  ❌ yo'q**  — ❓ Q96 (EP-COR-126): Yo'nalish turi (ofs-kar/ofs-gof/flx-gof) → mos bo'lim-marshruti avto-ochiladimi?
- Siz: A-default: yo'nalish turi → bo'lim-marshruti avto.
- Isbot: mes_operations/routing bor lekin 'ofs-kar/ofs-gof/flx-gof yo'nalish-turi → mos bo'lim-zanjiri avto-marshrut' tasnif+avto-routing modellashtirilmagan.

**04.109  ❌ yo'q**  — ❓ Q97 (EP-COR-127): Ochilgan lekin N kun boshlanmagan buyurtmalar avto-signal → reja/logistikaga (kechikkan-start) bormi?
- Siz: A-default: boshlanmagan buyurtmalar avto-signal → reja/logistika.
- Isbot: Buyurtma created-vs-production-started og'ishini kuzatib 'N kun boshlanmadi → avto signal' cron/koordinatsiya-mexanizmi topilmadi.

**04.110  🟡 qisman**  — ❓ Q98 (EP-COR-128): 'Shoshilinch' (Зарур заказлар) bayrog'i → barcha bo'lim panelida ajralib + navbat tepasida ko'rinadimi?
- Siz: A-default: shoshilinch bayroq → ajralib + navbat tepasida.
- Isbot: priority='urgent' baskets-da CASE 0 (tepada) ko'rsatiladi (listBaskets) + design_orders.priority. LEKIN 'shoshilinch bayroq' barcha-bo'lim paneli bo'ylab global ajralish (vizual flag) to'liq emas; cc_documents=0.

**04.111  🟡 qisman**  — ❓ Q99 (EP-COR-129): Ichki xizmat so'rovi (kesish/rulon) — so'rovchi→bajaruvchi bo'lim, muddat+bajarish tasdig'i bilan bormi?
- Siz: A-default: ichki xizmat so'rovi (kesish/rulon) muddat+tasdiq bilan.
- Isbot: internal_requests jadval (request_type,requester,department_id,status,approved_by) struktura mos. LEKIN 'kesish/rulon ichki xizmat' turi va so'rovchi→bajaruvchi-bo'lim koordinatsiyasi ulanmagan; faqat wms-count yozadi; 0 qator.

**04.112  ❌ yo'q**  — ❓ Q100 (EP-COR-130): Smena boshida 'tayyorlik' cheklisti (material/qolip/dastgoh/xodim) — tasdiqlanmaguncha bekor turish hisoblanmaydimi?
- Siz: A-default: smena tayyorlik cheklisti → tasdiqlanmaguncha bekor turish hisoblanmaydi.
- Isbot: Smena-boshi tayyorlik-cheklisti (material/qolip/dastgoh/xodim) va uning bekor-turish-hisobiga ta'siri modeli topilmadi (kanban_checklists bor lekin smena-readiness-gate uchun emas).

**04.113  🟡 qisman**  — ❓ Q101 (EP-COR-131): Koordinatsiya hujjatlari ko'rish-ruxsati bo'lim/daraja/karta bo'yicha cheklanadimi (tijorat siri/dizayn fayllari)?
- Siz: A (JAVOBLANGAN): koordinatsiya hujjatlari RBAC bo'lim/daraja/karta, maydon darajasi.
- Isbot: RolesGuard + @Roles(admin,manager,supervisor,director,ceo) coordination.controller:33; maxfiy-dokla ruxsati EP-COR-076 (Ochiq/Maxfiy). RBAC qatlami bor. LEKIN 'karta/maydon-darajali' nozik ruxsat va shifrlash koordinatsiya-hujjatlariga to'liq qo'llanmagan.

**04.114  🟡 qisman**  — ❓ Q102 (EP-COR-132): Belgilangan qarorlar (yangi lavozim/katta xarajat/prikaz) direktor tasdiq darvozasidan (elektron imzo) o'tadimi?
- Siz: A (JAVOBLANGAN): direktor tasdiq darvozasi (Pozilov A.A.) — elektron imzo qadami.
- Isbot: director moduli REAL: approvals (get-pending-approvals, approve/reject command+handler), zvs/zno-controller, HITL-approval events, approval_workflows jadval. Direktor-darvoza infratuzilmasi bor. LEKIN 'belgilangan-tur qarorlar avto-direktor-gate'ga marshrutlanishi (qaysi tur majburiy) konfiguratsiya-data siz.

**04.115  🟡 qisman**  — ❓ Q103 (EP-COR-133): ТТ (texnik topshiriq) majburiy maydonlari to'ldirilmasa dizaynga o'tkazib bo'lmaydimi (gate)?
- Siz: A-default: ТТ majburiy maydonlar (mahsulot/o'lcham/material/bosma/ranglar/matn/logotip/miqdor/maxsus) to'ldirilmasa — dizayn gate.
- Isbot: design_orders da product_type/requirements/quantity/brand_name maydonlari + request-design.command Zod-validatsiya bor. LEKIN to'liq ТТ majburiy-maydon to'plami (bosma usuli/ranglar/logotip) va 'to'ldirilmasa dizaynga-o'tkazib-bo'lmaydi' qattiq gate isbotlanmadi.

**04.116  🟡 qisman**  — ❓ Q104 (EP-COR-134): Har muammo signaliga rahbar javob SLA si (2 soat) → o'tsa avto-yuqoriga eskalatsiya bormi?
- Siz: A (JAVOBLANGAN): rahbar javob SLA → o'tsa avto-yuqoriga (hujjat turiga qarab muddat).
- Isbot: cc-sla.cron + rasporyajeniye markOverdue cron + eskalatsiya (EP-COR-027/053 2x→eskalatsiya→HR) mexanizmi bor. SLA-cron infratuzilmasi mavjud. LEKIN per-document-type SLA-muddat (avans 4 soat) konfiguratsiya-data siz; cc_documents=0.

**04.117  🟡 qisman**  — ❓ Q105 (EP-COR-135): Koordinatsiya hodisalari (kechikish/STOP/brak/norma %/SLA) karta-AI ga real signal → xodim-karta mosligi dinamik baholanadimi?
- Siz: A (JAVOBLANGAN): koordinatsiya hodisalari karta-AI ga → xodim↔karta mosligi dinamik (vizyon yadrosi).
- Isbot: ai_ckp_scores/ai_ckp_config + AiDailyReportService + ckp-cascade.listener karta-AI infratuzilmasi bor (ЦКП-fakt→cascade). LEKIN koordinatsiya-hodisalari (kechikish/STOP/brak/norma/SLA) karta-AI ga real-signal sifatida ulanmagan — AI faqat ЦКП-fakt oladi; xodim-karta dinamik mosligi koordinatsiyadan ajralgan; ai_ckp_scores=0 qator.

---

## 05 — Director / Hisobot  (vizyon 58%, 85 savol)

**05.1  ✅ bor**  — ❓ EP-DIR-001 — Kompaniya holat formulasi 5 vaznli ko'rsatkichdan (pul/ishlab chiqarish/buyurtma/xodim/sifat) hisoblansinmi?
- Siz: To'liq formula — 5 modul KPI agregati, sozlanadigan vaznlar
- Isbot: director-holat.service.ts computeHolat() pure 5-metrik vaznli + validatsiya; company-state.service.ts getCurrent() live 5 metrik delegatsiya; state_thresholds=25 qator (5 metrik×5 band, vaznlar: cash 0.25/prod 0.25/orders 0.20/hr 0.15/quality 0.15)

**05.2  🟡 qisman**  — ❓ EP-DIR-002 — Holat chegaralari (ostona qiymatlar) sozlanadigan master-data bo'lsinmi?
- Siz: Boshliq o'zi belgilaydi har ko'rsatkichga chegara; seed bilan boshlanadi
- Isbot: state_thresholds 25 qator (min_value/max_value/weight bandlar) seed bilan to'la + Patch /kpi-definitions/:id va /kpi-weights/:code endpoint (dashboard.controller.ts:155,194) — mexanizm bor; lekin bu egasi-tuzatishi kutadigan default

**05.3  🟡 qisman**  — ❓ EP-DIR-003 — Holat kunlik avtomatik cron bilan hisoblansinmi (07:00)?
- Siz: Har kuni ertalab avtomatik 07:00
- Isbot: company-state-snapshot.cron.ts @Cron('0 6 * * *',Asia/Tashkent) — cron MAVJUD va company_state_log ga yozadi; LEKIN vaqt 06:00 (vizyon 07:00 dan farq), company_state_log=0 qator (hali fire bo'lmagan/data yo'q)

**05.4  🟡 qisman**  — ❓ EP-DIR-004 — Holat tarixi saqlanib grafikda ko'rsatilsinmi?
- Siz: Har kuni saqlanadi + 30 kun mini-grafik
- Isbot: company_state_log jadvali bor (state_code/kpis JSONB/score_total/detected_at), cron immutable INSERT; director-extended company-state/history endpoint + getCompanyStateHistory repo; LEKIN company_state_log=0 qator (bo'sh)

**05.5  🟡 qisman**  — ❓ EP-DIR-005 — Holat yomonlashganda alert (Telegram+tizim) yuborilsinmi?
- Siz: Telegram + tizim ichida darhol
- Isbot: director-root owner-summary/send config-gated Telegram push mavjud; LEKIN holat-o'zgarish-trigger alert (sendAlert) avtonom emas — owner-summary digest orqali, real-time delta-alert ko'rinmadi

**05.6  🟡 qisman**  — ❓ EP-DIR-006 — Holat alertini kim oladi (boshliq+sababchi bo'lim rahbari)?
- Siz: Boshliq + sababchi ko'rsatkich egasi kartasi
- Isbot: stat_regulations.owner_card_id va dashboard plan-fact bo'lim kesimi bor (mas'ul aniqlanadi); LEKIN alert-routing (sababchi kartaga avtomatik yuborish) kodi topilmadi — mexanizm yarim

**05.7  ✅ bor**  — ❓ EP-DIR-007 — Bajarish kundaligi (Dnevnik) 5-maydonli (holat/KPI/muammo/yechim/ertangi reja)?
- Siz: Ha, to'liq 5-bo'lim kundalik
- Isbot: diary_entries jadval: daily_state/main_kpi_value/main_issue/solution/tomorrow_plan/carry_over_issues — 5 maydon AYNAN; diary.service openDiary autofill; FE DirectorDiaryPage.tsx; 2 draft qator jonli

**05.8  ✅ bor**  — ❓ EP-DIR-008 — Kundalik bo'lim rahbarlari ham yozadimi (boshliq yig'ib ko'radi)?
- Siz: Boshliq + har bo'lim rahbari o'z kundaligi; karta-markaz
- Isbot: diary.service.ts openDiaryForUser() resolveAuthorCard → author_card_id (org_functions.id), user.id emas; directorList(from,to,cardId) listAll repo; karta-centric muallif ishlaydi (jonli author_card_id=1)

**05.9  🟡 qisman**  — ❓ EP-DIR-009 — Kundalik holat+KPI avtomatik to'ladimi?
- Siz: Holat+KPI avtomatik (formuladan), boshliq faqat muammo/yechim yozadi
- Isbot: diary.service.ts getOrCreateToday autofill (EP-DIR-009 log) + repo daily_state/main_kpi_value to'ldiradi; LEKIN jonli 2 qatorda daily_state=null (holat-log bo'sh bo'lgani uchun autofill manbai yo'q)

**05.10  ✅ bor**  — ❓ EP-DIR-010 — Hal qilinmagan muammolar keyingi kunga o'tadimi (carry-over)?
- Siz: Yechilmagan muammo 'ochiq' deb o'tadi
- Isbot: diary.service.ts carryOverIssues() (EP-DIR-010); diary_entries.carry_over_issues ustun; dashboard getOpenIssues() bugungi draft+main_issue SQL real

**05.11  🟡 qisman**  — ❓ EP-DIR-011 — Ideal kartina (foyda/daromad/filial/xodim maqsadlari) saqlansinmi?
- Siz: To'liq ideal kartina + seed (100M foyda/800M daromad/15 filial/500 xodim)
- Isbot: ideal_rasm_targets jadval + ideal-rasm.service ensureSeeded()+getAll(); FE IdealRasmPage.tsx; LEKIN ideal_rasm_targets=0 qator (seed hali yuklanmagan — service ensureSeeded ishlasa to'ladi)

**05.12  ✅ bor**  — ❓ EP-DIR-012 — Ideal vs haqiqat farqi (gap) + bajarilish % ko'rsatilsinmi?
- Siz: Har maqsad uchun maqsad/haqiqat/farq + foiz
- Isbot: ideal-rasm.service getAll() achievementPct=Math.round(actual/target*100) hisoblaydi; weekly_revenue+activeEmployeesCount live actuals; FE IdealVsActualPanel.tsx

**05.13  🟡 qisman**  — ❓ EP-DIR-013 — Ideal kartina haqiqiy raqamlari avtomatik (foyda moliyadan, xodim HR dan)?
- Siz: Avtomatik — foyda moliyadan, xodimlar HR dan
- Isbot: ideal-rasm.service getWeeklyRevenue()+getActiveEmployeesCount() live; LEKIN weekly_profit=0, branches_count=1 (hardcoded), market_share=0 — actuallarning yarmi qattiq nol

**05.14  🟡 qisman**  — ❓ EP-DIR-014 — Ideal kartina yil bo'yicha versiyalansinmi?
- Siz: Har yil/davr uchun alohida versiya, tarix qoladi
- Isbot: ideal-rasm.service updateTarget horizonYears parametri bor; LEKIN yillik versiya/arxiv ustuni aniq emas (ideal_rasm_targets sxemasida year versioning tasdiqlanmadi), data=0

**05.15  🟡 qisman**  — ❓ EP-DIR-015 — Strategik OKR (Objective→Key Results) strukturasi bo'lsinmi?
- Siz: Maqsad → o'lchanadigan natijalar (klassik OKR)
- Isbot: okr_objectives + okr_key_results jadvallar; okr.service createObjective/createKeyResult/getDashboard; okr.controller 11 route; FE OkrPage.tsx; LEKIN ikkala jadval=0 qator (bo'sh)

**05.16  🟡 qisman**  — ❓ EP-DIR-016 — OKR kompaniya→bo'lim→karta kaskad (oltin ip)?
- Siz: Kompaniya→bo'lim→karta kaskad
- Isbot: okr.service getCascade(year) + okr_objectives.parent_goal_id/department_id/owner_card_id ustunlar (kaskad sxema bor); /okr/cascade endpoint; LEKIN data=0, kaskad jonli sinov yo'q

**05.17  🟡 qisman**  — ❓ EP-DIR-017 — Taktik reja: strategiyadan oylik rejaga o'tish?
- Siz: Strategiya → oylik taktik vazifalar
- Isbot: monthly_plans jadval (strategic_goal_id/objectives JSONB); monthly-plan.service+controller (Get/Post/Patch/complete); FE MonthlyPlansPage.tsx; LEKIN monthly_plans=0 qator

**05.18  🟡 qisman**  — ❓ EP-DIR-018 — Oylikdan haftalikga dekompozitsiya (4 hafta + % bajarilish)?
- Siz: Oylik → haftalik bo'lib beriladi
- Isbot: monthly_plans.weekly_tasks JSONB + completion_pct ustunlar mavjud (sxema mos); LEKIN data=0, haftalik % hisobi jonli isbotlanmadi

**05.19  🟡 qisman**  — ❓ EP-DIR-019 — Taktik vazifa kartaga (lavozimga) biriktirilsinmi?
- Siz: Har vazifa kartaga biriktiriladi (taskOwner=karta)
- Isbot: strategic_tasks (assignee_id) + okr_objectives.owner_card_id; strategic.service createTask assigneeId; LEKIN strategic_tasks=0, karta-biriktirish (org_functions.id) jonli yo'q

**05.20  🟡 qisman**  — ❓ EP-DIR-020 — Statistika reglamenti (ta'rif/formula/birlik/chastota/egasi) bo'lsinmi?
- Siz: To'liq stat-reglament har ko'rsatkichga
- Isbot: stat_regulations sxemasi AYNAN: definition/formula/unit/frequency/source_module/owner_card_id/target_value/version; stat-regulation.service+controller; FE StatRegulationsPage.tsx; LEKIN data=0 qator

**05.21  🟡 qisman**  — ❓ EP-DIR-021 — Stat-reglamentda har ko'rsatkichga alohida chastota (kunlik/haftalik/oylik)?
- Siz: Har ko'rsatkichga moslashuvchan chastota
- Isbot: stat_regulations.frequency ustun mavjud (sxema); LEKIN data=0, chastota qiymatlari yo'q

**05.22  🟡 qisman**  — ❓ EP-DIR-022 — Stat-reglament versiyalansinmi (eski hisobot to'g'ri qoladi)?
- Siz: Har o'zgarish yangi versiya + amal-qilish sanasi
- Isbot: stat_regulations.version+valid_from ustunlar; stat-regulation.service update() EP-DIR-022 log + getHistory(nameUz) repo; LEKIN data=0

**05.23  🟡 qisman**  — ❓ EP-DIR-023 — Stat-reglament ko'rsatkichlari egasi kartaga biriktirilsinmi?
- Siz: Har ko'rsatkich kartaga (odam ketsa egasi qoladi)
- Isbot: stat_regulations.owner_card_id ustun + service create() EP-DIR-023 ownerCard log; LEKIN data=0, kartaga real bog'lash yo'q

**05.24  ❌ yo'q**  — ❓ EP-DIR-024 — Holat formulasi karta-modeldan yig'ilsinmi (qaysi lavozim sabab)?
- Siz: Holat kartalardan yig'iladi — oltin ip
- Isbot: company-state.repository getRawMetrics() jadval-darajasidagi agregat (sales_invoices/employees/sales_orders/production_sessions) — KARTA (org_functions) dan yig'ilmaydi; karta-AI→holat zanjiri qurilmagan

**05.25  ✅ bor**  — ❓ EP-DIR-025 — Director dashboard (holat+ideal farq+muammolar+alert) bir ekranda?
- Siz: To'liq qo'mondonlik markazi (Q123: hammasi to'liq)
- Isbot: dashboard.controller.ts getDashboard() base+planFact+orderProgress+statTrends+openIssues birga; FE DirectorDashboard.tsx + CompanyStateWidget + IdealVsActualPanel; Roles(SUPER_ADMIN,DIRECTOR)

**05.26  🟡 qisman**  — ❓ EP-DIR-026 — Strategik AI tahlilchi har kuni qisqa tahlil+tavsiya bersinmi?
- Siz: AI har kuni tahlil + 1-2 tavsiya
- Isbot: director-ai.service explainKpi/assessRisks/generateExecutiveSummary + strategic-agent scenarioAnalysis (AI'li); LEKIN dashboard.controller aiInsights:[] (P35/P36 ga deferred izoh)

**05.27  🟡 qisman**  — ❓ EP-DIR-027 — Holat/kundalik Telegram bot (/holat /kundalik /ideal_rasm)?
- Siz: /holat /kundalik /ideal_rasm buyruqlari + digest
- Isbot: director.bot.ts mavjud: /kpi /ai /summary (real SQL) — LEKIN /holat /kundalik /ideal_rasm buyruqlari YO'Q; faqat /summary umumiy xulosa

**05.28  🟡 qisman**  — ❓ EP-DIR-028 — Kunlik boshliq digesti (ertalabki avto xulosa)?
- Siz: Har ertalab avtomatik digest (Telegram+tizim)
- Isbot: director-root owner-summary (holat+5 owner raqam: yangi/yo'qotilgan/kichik mijoz+savdo-trend+top-risk, live SD/CRM) + owner-summary/send config-gated push; LEKIN avto-cron ertalabki trigger aniq emas (GET compute-only)

**05.29  ✅ bor**  — ❓ EP-DIR-029 — Holat darajalari ro'yxati 5-darajali (O'SISH/NORMAL/EHTIYOT/XAVF/INQIROZ) + rang?
- Siz: 5 daraja + rang (egasi 5-darajaga moyil)
- Isbot: company_state_levels=5 qator jonli: OSISH(rank5)/NORMAL/EHTIYOT/XAVF/INQIROZ(rank1)+color_hex; HOLAT_LEVELS konstanta; director-holat 5-band klassifikatsiya

**05.30  🟡 qisman**  — ❓ EP-DIR-030 — Strategiya yutuqlari 'bajarildi' belgilanib tarix saqlansinmi?
- Siz: Yetilgan maqsadlar 'bajarildi' + tarix (motivatsiya)
- Isbot: strategic_milestones=4 qator + strategic.service createMilestone/updateMilestone(status); monthly-plan.controller :id/complete; LEKIN milestone.completedAt orqali to'liq tarix-arxiv jonli isbotlanmadi

**05.31  🟡 qisman**  — ❓ EP-DIR-031 — Har kartada 'Лавозим мақсади' (position_purpose) matn maydoni saqlansinmi?
- Siz: Har kartada majburiy position_purpose — yo'riqnomadan
- Isbot: org_functions.function_description ustun bor (≈maqsad), LEKIN alohida position_purpose YO'Q va function_description 0/97 to'la (with_desc=0) — maqsad maydoni bo'sh

**05.32  🟡 qisman**  — ❓ EP-DIR-032 — ЦКП (Лавозимнинг ЦКП си) har kartaning asosiy chiqishi sifatida saqlansinmi?
- Siz: Har kartada ckp maydoni + holat formulasiga bog'lanadi
- Isbot: org_functions.tskp+tskp_ru+tskp_target+tskp_measurement_unit ustunlar AYNAN ЦКП; jonli 19/97 kartada tskp to'la; LEKIN holat formulasiga (EP-DIR-001) bog'lanish yo'q

**05.33  ❌ yo'q**  — ❓ EP-DIR-033 — Yo'riqnomadagi '1-4 продукт' bo'sh maydonlari kartaga to'ldirilsinmi?
- Siz: Har kartada 1-4 produkt + har biriga statistika
- Isbot: org_functions da product/produkt 1-4 ustunlari YO'Q (full sxema tekshirildi: faqat tskp/tskp_target bor, 4-slot produkt yo'q)

**05.34  ❌ yo'q**  — ❓ EP-DIR-034 — Оргсхема joylashuvi '5-Департамент/13-бўлим/Секция' 3 maydonda saqlansinmi?
- Siz: department_no+unit_no+section_name 3 maydon (Vysotskiy-7)
- Isbot: org_functions da department_no/unit_no/section_name YO'Q; faqat department_id (FK) + sub_department_name; 3-darajali raqamli kod sxemasi qurilmagan

**05.35  ❌ yo'q**  — ❓ EP-DIR-035 — 5-Департамент ichida 5 bo'lim drill-down (sifat/reja/dizayn/konstruktor)?
- Siz: 5-departament alohida drill-down, 5 bo'lim har biri holati bilan
- Isbot: dashboard plan-fact umumiy departments JOIN qiladi, LEKIN 5-departament uchun maxsus 5-bo'lim drill-down endpoint/komponent topilmadi; org_departments da 5/13 raqamli struktura yo'q

**05.36  🟡 qisman**  — ❓ EP-DIR-036 — 'режа бажарилиш даражаси %' director bosh KPI (fabrika agregat+bo'lim breakdown)?
- Siz: Reja bajarilish % fabrika agregat + bo'lim breakdown
- Isbot: dashboard getPlanFact() bo'lim kesimida total/completed/remaining real SQL (departments LEFT JOIN production_orders); company-state production_plan metrik (produced/target); LEKIN production_orders/sessions data=0 (jonli reja% nol)

**05.37  ❌ yo'q**  — ❓ EP-DIR-037 — 'Кечикишлар сони' va 'режадан оғиш ҳолатлари сони' alohida hisoblansinmi?
- Siz: 2 alohida counter delay_count+plan_deviation_count + majburiy sabab kategoriyasi
- Isbot: delay_count/plan_deviation_count counter jadval yoki kod topilmadi; root-cause drill (EP-DIR-074) skeleton bor lekin sabab-kategoriya bilan og'ish-counter yo'q

**05.38  🟡 qisman**  — ❓ EP-DIR-038 — 'Бекор туриш' (downtime) director da soat+sabab bo'yicha kuzatilsinmi?
- Siz: Downtime director dashboardda soat+sabab
- Isbot: downtime_logs/downtime_events/mes_downtime_reasons/downtime_reason_codes jadvallar MAVJUD; LEKIN downtime_logs=0 qator va director dashboardga ulanish (downtime widget) topilmadi

**05.39  🔑 egasi-data**  — ❓ EP-DIR-039 — A-System (eski tizim) bilan ERP qanday bog'lanadi (to'liq almashtirish?)?
- Siz: EuroPrint A-System ni to'liq o'rnini bosadi (yagona haqiqat manbai)
- Isbot: Bu ko'chish-strategiya qarori (kod emas); import/migratsiya mexanizmi yo'q — egasi qarori kutiladi (decisions: ⚠️ egasi qarori muhim)

**05.40  ❌ yo'q**  — ❓ EP-DIR-040 — '1 суткалик ишлаб чиқариш режаси' kunlik 24-soatlik reja ob'ekti bo'lsinmi?
- Siz: Sutkalik reja alohida ob'ekt (har kuni) + bajarilish %
- Isbot: daily_plan/sutka jadval YO'Q; dashboard plan-fact kunlik kesim beradi (DATE(created_at)=CURRENT_DATE) lekin rasmiy 'sutkalik reja' ob'ekti qurilmagan

**05.41  ❌ yo'q**  — ❓ EP-DIR-041 — 'Кўп учрайдиган хатолар' ro'yxati AI risk-reyestriga aylansinmi?
- Siz: Har kartada tipik xatolar + AI real-time tekshiradi
- Isbot: org_functions da tipik-xatolar/risk-registry ustun YO'Q; AI real-time xato-tekshirish kodi topilmadi

**05.42  ❌ yo'q**  — ❓ EP-DIR-042 — 'Муваффақиятли ҳаракатлар' ro'yxati ideal-model bo'lib AI baholasinmi?
- Siz: Har kartada muvaffaqiyatli harakatlar=ideal model + AI baholaydi
- Isbot: org_functions da 'muvaffaqiyatli harakatlar'/ideal-model ustun YO'Q; AI xodim-modelga-baholash kodi yo'q

**05.43  ❌ yo'q**  — ❓ EP-DIR-043 — 'Жавобгарликлари' (moddiy/maънавий) javobgarlik darajalari saqlansinmi?
- Siz: Har kartada javobgarlik bandlari + HR voqeasiga bog'lanadi
- Isbot: org_functions da responsibility/javobgarlik ustun YO'Q (full sxema tekshirildi)

**05.44  🟡 qisman**  — ❓ EP-DIR-044 — 'Тижорат сирларини ошкор этиш' (maxfiy ma'lumot kirishi) audit-log+director ko'rsinmi?
- Siz: Maxfiy ma'lumot kirishi audit-log + director (Q144: faqat Super Admin)
- Isbot: AuditInterceptor dashboard.controller da @UseInterceptors; Q144 audit-log=Super Admin RBAC siyosati tasdiqlangan; LEKIN maxfiy-maydon (narx/mijoz/formula) kirishini AYRIM kuzatuvchi audit-log yo'q

**05.45  ❌ yo'q**  — ❓ EP-DIR-045 — 'Энергия ресурслари (сув/газ/свет)' director ko'rsatkichi sifatida kuzatilsinmi?
- Siz: Suv/gaz/elektr oylik sarfi director da + trend
- Isbot: energy/utility/meter jadval (director uchun) YO'Q; mro_utility_readings bor lekin u MRO moduli (director energiya paneli emas)

**05.46  🟡 qisman**  — ❓ EP-DIR-046 — 'Турникет' kirish-chiqish davomat statistikasiga ulansinmi?
- Siz: Turniket→davomat avtomatik + director kech-kelish statistikasi
- Isbot: attendance/attendance_logs/security_attendance/hr_ai_attendance jadvallar bor (davomat infra); dashboard getAttendanceToday SQL; LEKIN turniket-integratsiya (kirish/chiqish avtomatik) va director kech-kelish statistikasi paneli topilmadi

**05.47  ❌ yo'q**  — ❓ EP-DIR-047 — 'Назорат варақаси' har karta uchun o'quv-nazorat ob'ekti bo'lsinmi?
- Siz: Har kartada Nazorat varaqasi=mavzular+tasdiqladim (darslik kartaga)
- Isbot: control_sheet/nazorat_varaq jadval YO'Q; org_functions.ai_exam_enabled bor lekin nazorat-varaqasi mavzular ob'ekti qurilmagan

**05.48  ❌ yo'q**  — ❓ EP-DIR-048 — Nazorat varaqasidagi 'тасдиқлайман' (тема-тема) qadamlari kuzatilsinmi?
- Siz: Har mavzu o'qildi/tushundim checkbox+sana+raqamli imzo
- Isbot: mavzu-tasdiq (control-sheet confirm) jadval/kod topilmadi (EP-DIR-047 ning davomi, ob'ekt yo'q)

**05.49  🟡 qisman**  — ❓ EP-DIR-049 — Nazorat varaqasidagi senariy savollar (A/B/D) AI imtihon bo'lsinmi?
- Siz: Senariy savollar=karta AI imtihoni (to'g'ri javob ball)
- Isbot: org_functions.ai_exam_enabled ustun bor (karta-darajasida AI imtihon bayrog'i) + ai-exam route (CLAUDE.md stub ro'yxatida); LEKIN senariy-savol→AI-imtihon ulanishi real emas (stub /ai-exam)

**05.50  🟡 qisman**  — ❓ EP-DIR-050 — Yo'riqnoma 'ТАСДИҚЛАЙМАН директор' imzosi + versiya nazorati saqlansinmi?
- Siz: Har karta yo'riqnomasi versiyalanadi: tasdiqlovchi+sana+tanishdim imzo
- Isbot: org_functions.last_reviewed_at ustun bor (qisman); LEKIN tasdiqlovchi+versiya+tanishdim-imzo hujjat-oqimi qurilmagan

**05.51  ❌ yo'q**  — ❓ EP-DIR-051 — 'Малака талаблари' (tajriba/ta'lim) kartaga talab maydoni bo'lib AI baholasinmi?
- Siz: Har kartada malaka talablari + AI nomzodni baholaydi
- Isbot: org_functions da requirement/malaka/tajriba/ta'lim ustun YO'Q; min_salary/max_salary bor lekin malaka-talab maydoni emas

**05.52  ❌ yo'q**  — ❓ EP-DIR-052 — 'Лавозим воситалари' (A-System/hisobot/tex-karta) kartaga biriktirilsinmi?
- Siz: Har kartada kerakli vositalar/dasturlar ro'yxati + yetishmasa flag
- Isbot: org_functions da tools/vosita/kerakli-jihozlar ustun YO'Q (vizyonda 'kerakli jihozlar modeli YO'Q' edi — hali ham yo'q)

**05.53  🟡 qisman**  — ❓ EP-DIR-053 — Har bo'lim 'Reja/Fakt/Qoldiq' director real-time (25-04.xlsx ustunlari)?
- Siz: Har operatsiya/bo'lim Reja/Fakt/Qoldiq real-time
- Isbot: dashboard getPlanFact() departments×production_orders total/completed/remaining real SQL — bo'lim kesimida bor; LEKIN operatsiya-kesimi va data=0 (production_orders bo'sh)

**05.54  🟡 qisman**  — ❓ EP-DIR-054 — 'Зарур заказлар' (ustuvor buyurtmalar) navbati director da o'zgartirilsinmi?
- Siz: Buyurtmaga zarur/ustuvor flag + director navbatni o'zgartira oladi
- Isbot: director-state.service markOrderVip(orderId)+executeMarkVip repo + director-extended POST orders/:id/vip endpoint; LEKIN PP-rejaga real-vaqt event uzatish (EP-DIR-054 event) tasdiqlanmadi

**05.55  🟡 qisman**  — ❓ EP-DIR-055 — 'Брак сони' (brak miqdori) director sifat-yo'qotish ko'rsatkichi (operatsiya/bo'lim/material)?
- Siz: Brak soni/% director da operatsiya/bo'lim/material + trend
- Isbot: company-state.repository quality metrik (produced-defect)/produced production_sessions.defect_qty dan hisoblaydi; LEKIN director dashboardda brak operatsiya/material-kesim paneli yo'q, data=0

**05.56  ❌ yo'q**  — ❓ EP-DIR-056 — 'Длительность/Начат/Завершит' operatsiya davomiyligi (reja vs fakt) director da?
- Siz: Rejalashtirilgan vs Fakt davomiylik + og'ish %
- Isbot: operatsiya reja-vs-fakt davomiylik paneli/kod topilmadi; production_sessions vaqt-og'ishi director ga ulanmagan

**05.57  ❌ yo'q**  — ❓ EP-DIR-057 — 'Ден/Ноч' (kunduz/tun smena) bo'yicha statistika ajratilsinmi?
- Siz: Kunduzgi/tungi smena holati + reja% alohida
- Isbot: smena (den/noch) kesimida director statistika kodi/ustuni topilmadi

**05.58  ❌ yo'q**  — ❓ EP-DIR-058 — Ishchi normasi % (Norma/Oylik%/Ishlagan kuniga%) director/HR mehnat-samaradorlik paneli?
- Siz: Har ishchi Norma%/Oylik%/Ishlagan kuniga% (Excel formulalari)
- Isbot: ishchi-norma % director/HR paneli kodi topilmadi (HR razryad/koeff bor lekin Iyun-ishchilar.xlsx norma% formulasi qurilmagan)

**05.59  ❌ yo'q**  — ❓ EP-DIR-059 — Operatsiya turlari bo'yicha norma (avtokley/GTO/kley/rezka...) saqlansinmi?
- Siz: Har operatsiya turi uchun norma+fakt+% (13 tur Excel ro'yxati)
- Isbot: operation_norm/op_norm jadval YO'Q; 13 operatsiya-turi normasi (avtokley/GTO/...) qurilmagan

**05.60  ❌ yo'q**  — ❓ EP-DIR-060 — 'Oddiy lak' va 'Vib lak' alohida norma director taqqoslasinmi?
- Siz: Oddiy lak/vib lak alohida norma+%
- Isbot: lak operatsiya-turi normasi (EP-DIR-059 ning bo'lagi) jadval/kod yo'q

**05.61  ❌ yo'q**  — ❓ EP-DIR-061 — Bandlik.xlsx pragon (operatsiyaga min/soat/kun yuklama) director da (CRP)?
- Siz: Bo'limlar yuklamasi (pragon) min/soat/kun
- Isbot: pragon/yuklama (CRP) hisobi director kodi/jadvali topilmadi

**05.62  🟡 qisman**  — ❓ EP-DIR-062 — 'Buyurtma tayyorligi %' har buyurtma uchun director progress paneli (qaysi bo'limda)?
- Siz: Har buyurtma tayyorligi % + qaysi bo'limda
- Isbot: dashboard getOrderProgress() readiness_pct=completed/total*100 + current_department (in_progress) real SQL; FE order-progress; LEKIN data=0 (sales_orders/production_orders bo'sh)

**05.63  ❌ yo'q**  — ❓ EP-DIR-063 — 'Ишлаб чиқаришга кетган/қолган кун' buyurtma sikl-vaqt (reja vs fakt) trendmi?
- Siz: Buyurtma sikl vaqti (kun) reja vs fakt + kechikkanlar
- Isbot: buyurtma sikl-vaqt (boshlangan→tayyor kun) reja-vs-fakt director paneli/kod topilmadi

**05.64  ❌ yo'q**  — ❓ EP-DIR-064 — 'Приладка/setup вақти (соат)' sozlash-vaqt yo'qotishi director da?
- Siz: Priladka/setup vaqti operatsiya/buyurtma bo'yicha
- Isbot: setup/priladka vaqti director kodi/ustuni topilmadi

**05.65  ❌ yo'q**  — ❓ EP-DIR-065 — Kichik buyurtmalar tahlili (kichiklashish%/dona-kg foyda) strategik panel?
- Siz: Kichik buyurtmalar kichiklashish%/dona/kg foyda strategik panel
- Isbot: small_order/kichik-buyurtma tahlil jadval/kod topilmadi (grep small.order=bo'sh)

**05.66  ❌ yo'q**  — ❓ EP-DIR-066 — 'Размер эски→янги' format optimizatsiyasi AI tavsiyasiga aylansinmi?
- Siz: AI strategik tahlilchi format-opt tavsiyasi (42x58→40x58)
- Isbot: format-opt/razmer/42x58 kod topilmadi (grep bo'sh); strategic-agent format-optimizatsiya metodi yo'q

**05.67  🟡 qisman**  — ❓ EP-DIR-067 — Buyurtma kodi formati (2024-0499, KT/PT/E) director qidiruvida qo'llab-quvvatlansinmi?
- Siz: Buyurtma=yil-raqam, klishe=KT/PT/E+raqam rasmiy format+qidiruv
- Isbot: sales_orders.order_number bor (qidiruvda ishlatiladi getOrderProgress); LEKIN KT/PT/E klishe-kod formati va director maxsus qidiruvi tasdiqlanmadi

**05.68  ❌ yo'q**  — ❓ EP-DIR-068 — Director departament (vertikal) ham operatsiya (gorizontal) 2 o'q bo'yicha drill?
- Siz: 2 o'q: Departament (5/13/секция) ╳ Operatsiya turi
- Isbot: dashboard departament-kesim bor (plan-fact), LEKIN operatsiya-turi o'qi yo'q (operatsiya-norma EP-DIR-059 qurilmagani uchun 2-o'q drill imkonsiz)

**05.69  ✅ bor**  — ❓ EP-DIR-069 — Statistik ko'rsatkich vaqt-trend grafigi (Vysotskiy statistika) yo'nalish bilan?
- Siz: Har ko'rsatkich vaqt-trend + o'sish/tushish yo'nalishi
- Isbot: dashboard getStatTrends() kpi_definitions×kpi_values json_agg trend_points (date/value/target/status) real SQL; kpi_values=60 qator jonli data; FE stat-trends

**05.70  🟡 qisman**  — ❓ EP-DIR-070 — Trend 'yiqilish/o'sish holati' (condition) avtomatik aniqlansinmi?
- Siz: Trend qiyaligi→holat (keskin tushish=Danger) + chora taklif
- Isbot: kpi_values.status ustun (trend nuqtada status bor) + director-holat trend-darajasi; LEKIN trend-qiyalikdan avtomatik holat (rate-of-change → Danger) + chora-taklif kodi topilmadi (decisions tavsiya, qurilmagan)

**05.71  🟡 qisman**  — ❓ EP-DIR-071 — Har ko'rsatkichga 'mas'ul lavozim' (egasi) biriktirilib pasayganda alert?
- Siz: Har ko'rsatkichda mas'ul karta + pasayganda alert
- Isbot: stat_regulations.owner_card_id (mas'ul karta sxema) + kpi_definitions; LEKIN pasayganda kartaga-alert routing kodi yo'q, data=0

**05.72  🟡 qisman**  — ❓ EP-DIR-072 — 'Ҳисоботларни ўз вақтида тайёрлаш' hisobot-reglament (topshirildi/kechikdi) director da?
- Siz: Har bo'lim hisobot topshirildi/kechikdi + eslatma
- Isbot: coordination.controller dokla (доклад/hisobot) Post/Get/Patch read/resolved + rasporyazhenie mexanizmi bor; LEKIN 'hisobot topshirildi/kechikdi' reglament-tracker + deadline-eslatma aniq emas

**05.73  ✅ bor**  — ❓ EP-DIR-073 — Director real-time + kunlik snapshot ikkalasi ko'rsinmi?
- Siz: Real-time + kunlik snapshot (jonli + tugagan kun raqami)
- Isbot: dashboard.controller getDashboard(?mode=snapshot|realtime) — mode parametri bor (P30 EP-DIR-025/053/073); company-state-snapshot.cron kunlik snapshot yozadi

**05.74  🟡 qisman**  — ❓ EP-DIR-074 — Og'ish yuz berganda 'tomir-kesish' (root-cause) drill ko'rsinmi?
- Siz: Og'ishdan→sabab kategoriyasi→aniq buyurtma/operatsiya drill
- Isbot: dashboard order-progress current_department drill bor (qaysi bo'limda); LEKIN og'ish→sabab-kategoriya→buyurtma to'liq root-cause zanjiri (EP-DIR-037 counter yo'qligi sababli) qurilmagan

**05.75  ❌ yo'q**  — ❓ EP-DIR-075 — 'Smena rejasi 2 xil buyurtma aralashib ketishi' konflikt alerti (5/3 gofra)?
- Siz: O'xshash material 2 buyurtma→aralashish riski alert
- Isbot: material-aralashish-riski alert (smena rejasi konflikt) kodi/event topilmadi

**05.76  ❌ yo'q**  — ❓ EP-DIR-076 — Xato 'tushunmaslik/e'tiborsizlik/qoidabuzarlik' AI tasniflasinmi + o'quv tavsiya?
- Siz: AI xatoni tasniflaydi + o'quv tavsiya
- Isbot: AI xato-tasniflash (tushunmaslik/e'tiborsizlik/qoidabuzarlik) kodi topilmadi

**05.77  🟡 qisman**  — ❓ EP-DIR-077 — 'Чиқиндилар ва қолдиқлар' (chiqindi kg) director ekologik ko'rsatkichi + qayta ishlash%?
- Siz: Chiqindi/qoldiq miqdori (kg) + qayta ishlash%
- Isbot: waste_records+waste_targets jadvallar MAVJUD; LEKIN waste_records=0 qator va director dashboardga ulanish (chiqindi widget) topilmadi

**05.78  🟡 qisman**  — ❓ EP-DIR-078 — Director 'ma'lumot so'rash huquqi' bo'limlararo workflow (so'rov→javob izi)?
- Siz: Ma'lumot/reja so'rovi bo'limlararo workflow (gorizontal)
- Isbot: coordination.controller dokla+rasporyazhenie (директива/so'rov mexanizmi) bor; LEKIN aniq 'info-request→javob izi' workflow (EP-DIR-078 so'rov-javob) to'liq emas

**05.79  ❌ yo'q**  — ❓ EP-DIR-079 — Karta-AI hisobotlari director uchun 'qaysi lavozim maqsadga erishmayapti' agregatlansinmi?
- Siz: Har karta-AI hisoboti→director agregat (vizyon: karta-AI o'zaro)
- Isbot: karta-AI (org_functions.id darajasida) hisobot + director agregat kodi yo'q; director-ai.service umumiy KPI-tahlil qiladi, karta-AI agregat emas; dashboard aiInsights:[]

**05.80  🔑 egasi-data**  — ❓ EP-DIR-080 — Ko'rsatkichlarning 'ideal qiymati' (ostona) egasi belgilasinmi (har karta o'z ostonasi)?
- Siz: Owner har ko'rsatkichga ideal/ostona (reja%>95=yashil), sozlanadigan
- Isbot: state_thresholds (min/max/weight) + kpi_definitions (target/warning/critical) sxema+endpoint TAYYOR (Patch /kpi-definitions/:id); qiymatlar seed-default, egasi-tuzatishi kutiladi

**05.81  🟡 qisman**  — ❓ EP-DIR-081 — 'Поддон' (paddon) qayta-ishlatiladigan resurs aylanishi director da (yetishmovchilik→downtime)?
- Siz: Paddon zaxirasi/aylanishi director da, yetishmovchilik bekor-turish bilan
- Isbot: ow_pallet_recoveries jadval MAVJUD; LEKIN ow_pallet_recoveries=0 qator va director dashboardga ulanish + downtime bog'lanishi topilmadi

**05.82  ❌ yo'q**  — ❓ EP-DIR-082 — Director 'haftalik ishlab chiqargan vs qolgan' (ketgan kun.xlsx) ko'rsinmi?
- Siz: Hafta ishlab chiqarildi vs qoldi + haftalik trend
- Isbot: haftalik ishlab-chiqargan-vs-qolgan director paneli/kod topilmadi (monthly_plans.weekly_tasks bor lekin ishlab-chiqarish haftalik fakt emas)

**05.83  ❌ yo'q**  — ❓ EP-DIR-083 — Yo'nalish (ofs kar/ofs gof/flx gof) bo'yicha statistika ajratilsinmi?
- Siz: Ofset-karton/Ofset-gofra/Flekso-gofra yo'nalishlari holat+hajm
- Isbot: yo'nalish (ofs kar/gof/flx) kesimida director statistika kodi/ustuni topilmadi

**05.84  ❌ yo'q**  — ❓ EP-DIR-084 — 'Algoritm turi' (2-8 bo'lim oqimi) buyurtma murakkabligi + vaqt prognozi?
- Siz: Buyurtmaga algoritm turi (2-8 bo'lim) + murakkablikka qarab vaqt prognozi
- Isbot: algoritm-turi (2-8 bo'lim) buyurtma murakkablik ustuni/kod topilmadi

**05.85  🟡 qisman**  — ❓ EP-DIR-085 — Director paneliga 'tozalik/intizom' (5S) ko'rsatkichi qo'shilsinmi?
- Siz: Tozalik/intizom holati director da (tekshiruv/voqea asosida)
- Isbot: kaizen_suggestions jadval + kaizen.controller (taklif/intizom mexanizmi) bor; HR intizom voqealari infra bor; LEKIN director da maxsus 5S/tozalik-intizom paneli yo'q

---

## 06 — SD / Sotuv  (vizyon 48%, 107 savol)

**06.1  🟡 qisman**  — ❓ Q1/EP-SD-031: Buyurtma kartasidagi majburiy maydonlar (mahsulot turi+o'lcham+tiraj+muddat+mijoz+narx)?
- Siz: A — to'liq majburiy maydonlar; yarim buyurtma ishlab chiqarishga ketmasin
- Isbot: sales_orders/sales_order_items boy ustunli (customer_id, order_quantity, net_price, delivery_date, requested_delivery_date); FE SalesOrdersDialogs.tsx forma bor. LEKIN o'lcham (L×W×H) sales_order_items'da YO'Q — faqat narx-dvigatel inputida (PriceCalcInput). Majburiylik DB-darajada to'liq emas.

**06.2  🟡 qisman**  — ❓ Q2/EP-SD-032: Mahsulot turlari qattiq ro'yxati (10-15 tur: quti/gofra/etiketka...)?
- Siz: A — qattiq ro'yxat (kitob ~15 toifa), admin orqali kengaytirish
- Isbot: narx-dvigatelda paperType ('B/C/BC/E-flute') enum bor; order item description matn ('Karton quti A4', 'Gofrokarton quti B3'). Lekin ~15 toifali strukturalangan mahsulot-turi katalogi jadvali topilmadi — erkin matn description.

**06.3  🔑 egasi-data**  — ❓ Q3/EP-SD-033: O'lcham (U×K×B mm) + avto yuza (m²) hisobi?
- Siz: A — U×K×B→tizim yuza+zagotovka avto; priklad % egasidan
- Isbot: sd-quotations.service.ts:84-87 REAL RSC blank: ((2*(L+W)+40)*(H+W))/1e6 m² — geometriya jonli ishlaydi. Priklad/qoldiq % (3/5%) hali yo'q — egasidan kerak (GLUE_FLAP konstanta=40mm).

**06.4  🟡 qisman**  — ❓ Q4/EP-SD-034: Tiraj o'lchov birligi (dona/m²/list)?
- Siz: B/A — mahsulot turiga qarab birlik (quti→шт, gofra→m²/лист)
- Isbot: sales_order_items.unit ustuni bor (data='PC'); narx-dvigatel m² hisoblaydi. Lekin mahsulot-turidan AVTO birlik tanlash (quti→шт, gofra→лист — EP-SD-074) mexanizmi jonli kodda topilmadi.

**06.5  🟡 qisman**  — ❓ Q5/EP-SD-035: Muddat — 'mijoz so'ragan' + 'zavod va'dasi' ikki sana alohida?
- Siz: A — ikki sana alohida (kechikish tahlili uchun)
- Isbot: sales_orders'da delivery_date + requested_delivery_date ikkalasi bor (DB tasdiq). Lekin 'zavod va'dasi' CRP-quvvatdan hisoblanishi (Q91/92) jonli ulanish isbotlanmadi — faqat maydonlar mavjud.

**06.6  ❌ yo'q**  — ❓ Q6/EP-SD-036: Minimal partiya (MOQ) + kichik-partiya ustamasi?
- Siz: A — har tur MOQ, undan kam bo'lsa ustama avto; qiymat egasidan
- Isbot: Grep MOQ/minimum_order/moq → sd modulda mos topilmadi; narx-dvigatelda (calculatePrice) MOQ-tekshiruv yoki kichik-partiya ustama logikasi YO'Q.

**06.7  ✅ bor**  — ❓ Q7/EP-SD-037: Narx formulasi (xomashyo+bo'yoq+ish+qo'shimcha+foyda%) har qator ko'rinadi?
- Siz: A — to'liq kalkulyatsiya, har komponent ko'rinadi
- Isbot: sd-quotations.service.ts:73-125 calculatePrice REAL: paperCost+printCost+dieCost+productionCost+deliveryCost → markup% → VAT%; barcha komponent qaytariladi (FE breakdown). sd_price_formulas seed mavjud (paper_b=4200, print_4color=38000, markup=35%).

**06.8  🟡 qisman**  — ❓ Q8/EP-SD-038: Qog'oz narxi qaerdan (ombor o'rtacha/FIFO/qo'lda)?
- Siz: A — ombor FIFO/o'rtacha tannarx avto
- Isbot: narx-dvigatel paper narxni sd_price_formulas konfig-jadvalidan oladi (paper_b/c/bc/e_price) — qo'lda sozlanadigan. Egasi FIFO partiya narxini (POS Q35) istaydi, lekin warehouse_stock'dan avto-FIFO ulanish jonli kodda topilmadi.

**06.9  🟡 qisman**  — ❓ Q9/EP-SD-039: Bo'yoq (rang soni × qoplama% × yuza) hisobi?
- Siz: A — rang+qoplama%+yuza formula; tarif egasidan
- Isbot: sd-quotations.service.ts:97-100 print: rang soniga qarab (1/2/4-color rate) + plate_cost×colors. LEKIN qoplama% (zalivka) komponenti YO'Q — faqat rang soni. Tarif sd_price_formulas'da bor, qoplama% formulada yo'q.

**06.10  🟡 qisman**  — ❓ Q10/EP-SD-040: Ish haqi (operatsiya marshruti tariflari yig'iladi)?
- Siz: A — operatsiya marshruti bo'yicha, PP/sdelka bilan ulanadi
- Isbot: sd-quotations.service.ts:106-107 productionCost = hourly_labor_rate × (qty/1000) — bitta umumiy soat-tarif, marshrut-operatsiyalarga (склейка/высечка alohida) ajratilmagan. PP marshrut tariflariga jonli ulanish yo'q.

**06.11  🟡 qisman**  — ❓ Q11/EP-SD-041: Qo'shimcha operatsiyalar (laminatsiya/UF-lak/tisnenie...) alohida qator+tarif?
- Siz: A — har qo'shimcha alohida qator + o'z tarifi
- Isbot: sd_price_formulas'da lamination_price, embossing_price, perforation_price ustunlari bor (DB tasdiq). LEKIN calculatePrice ularni narx hisobiga QO'SHMAYDI (paper+print+die+labour+delivery faqat) — tariflar jadvalda, formulaga ulanmagan.

**06.12  🔑 egasi-data**  — ❓ Q12/EP-SD-042: Klishe/shtamp xarajati alohida, mijoz to'laydi, takrorda olinmaydi?
- Siz: A — alohida bir martalik qator; egalik+muddat egasidan
- Isbot: sd-quotations.service.ts:103 dieCost = isNewDie ? die_cost_new : die_cost_existing (REAL ajratish; die_cost_new=1.8M seed). Shtamp egalik (mijoz/zavod) + saqlash muddati (EP-SD-125) hali egasidan.

**06.13  ❌ yo'q**  — ❓ Q13/EP-SD-043: Narx pog'onasi (tiraj oshsa dona narxi pasayadi) jadvali?
- Siz: A — tiraj-narx pog'onasi har mahsulotga, tizim avto tanlaydi
- Isbot: CLAUDE.md Q12 BULK_DISCOUNT konstantasi eslatilgan, lekin joriy sd-quotations.service.ts calculatePrice'da tiraj-pog'ona jadvali yoki bulk-discount logikasi YO'Q (qty faqat xarajatni ko'paytiradi, dona narxi pasaymaydi).

**06.14  ❌ yo'q**  — ❓ Q14/EP-SD-044: Chegirma turlari ro'yxati (tiraj/doimiy/avans/aksiya) alohida foiz limiti?
- Siz: A — sanab o'tilgan turlar alohida, har biri foiz limiti
- Isbot: narx-dvigatelda yoki sd modulda strukturalangan chegirma-turlari mexanizmi topilmadi. sd_customers.discount_rate (bitta umumiy maydon) bor, lekin tur-bo'yicha ajratilgan chegirma logikasi YO'Q.

**06.15  ❌ yo'q**  — ❓ Q15/EP-SD-045: Chegirmalar jamlanish shifti (~15% maksimal)?
- Siz: A — maksimal umumiy chegirma shifti; foiz egasidan
- Isbot: Grep checkDiscountCap/discount_cap → sd-quotations.repository.ts'da topilmadi (faqat noaniq match). Chegirma-shift bloklash logikasi jonli kodda YO'Q.

**06.16  🟡 qisman**  — ❓ Q16/EP-SD-046: Chegirmaga pog'onali ruxsat (sotuvchi 0-5%, boshliq 5-10%, direktor 10%+)?
- Siz: A — pog'onali tasdiq zanjiri (karta-model RBAC)
- Isbot: Kotirovka approveQuotation + @Roles(sales_manager/director) RBAC bor; sd_contracts/quotations sign faqat director+. LEKIN chegirma-foizga bog'liq AVTO eskalatsiya (5%→boshliq, 10%→direktor) pog'onali logikasi jonli kodda topilmadi.

**06.17  ❌ yo'q**  — ❓ Q17/EP-SD-047: Eng past narx (floor) himoyasi — tannarxdan past bloklanadi?
- Siz: A — tannarx+min-marjadan past bloklanadi (direktor ochadi)
- Isbot: calculatePrice margin qaytaradi (totalPrice-costPrice), lekin floor-bloklash yoki min-marja tekshiruvi YO'Q. Manfiy marjada sotishni to'xtatuvchi logika jonli kodda topilmadi.

**06.18  ✅ bor**  — ❓ Q18/EP-SD-048: Mijoz ABC toifasi (yillik xarid 80/15/5) avto?
- Siz: A — ABC avto yillik hajm bo'yicha, to'lov intizomi tuzatma
- Isbot: customer-abc.service.ts computeAbc REAL: revenue DESC sort + kumulyativ Pareto (A≤80%, B≤95%, C); recompute() jonli sales_orders'dan oxirgi-12-oy o'qiydi, sd_customers.abc_class'ga yozadi. CUSTOMER_ABC_CUMULATIVE konstanta. To'lov-intizomi tuzatmasi hali qo'shilmagan.

**06.19  🔑 egasi-data**  — ❓ Q19/EP-SD-049: Toifaga bog'liq imtiyozlar (chegirma+limit+kun) avto-paket?
- Siz: A — toifa = standart paket; qiymatlar egasidan
- Isbot: sd_customers'da abc_class + credit_limit + discount_rate + payment_terms_days ustunlari mavjud (DB tasdiq). Lekin toifadan AVTO paket-qo'llash logikasi va paket-qiymatlari egasidan kutiladi (EP-SD-049 OCHIQ).

**06.20  🟡 qisman**  — ❓ Q20/EP-SD-050: Kotirovka (KP) alohida hujjat, raqamlanadi, PDF, buyurtmaga aylanadi?
- Siz: A — KP alohida hujjat, versiya, PDF, convert
- Isbot: sd_quotations jadvali (quotation_number, valid_until, version) + createQuotation/convertToOrder REAL (sd-quotations.service.ts:161). sd_quotation_revisions versiya tarixi bor. LEKIN PDF generatsiya jonli isbotlanmadi; sd_quotations=0 qator (data bo'sh).

**06.21  🟡 qisman**  — ❓ Q21/EP-SD-051: Kotirovka amal muddati (14 kun), o'tsa 'muddati o'tgan'?
- Siz: A — valid_until + 'muddati o'tgan'; narx avto-yangilanish egasidan
- Isbot: sd_quotations.valid_until ustuni bor (DB). Lekin muddati-o'tgan AVTO status o'tkazish (cron) yoki narx-qayta-hisob jonli kodda topilmadi — faqat maydon mavjud.

**06.22  🟡 qisman**  — ❓ Q22/EP-SD-052: Kotirovka statuslari (qoralama→yuborilgan→ko'rilmoqda→qabul→rad→muddati o'tgan)?
- Siz: A — aniq status zanjiri + har o'tishda sana
- Isbot: sendQuotation→'sent', approveQuotation→'approved' status o'tishlari REAL (sd-quotations.service.ts:179-191) + sent_at/approved_at sanalar. To'liq 6-bosqichli zanjir (ko'rilmoqda/rad/muddati-o'tgan) to'liq emas.

**06.23  ✅ bor**  — ❓ Q23/EP-SD-053: Kotirovka→Buyurtma 'aylantirish' tugmasi (qator/narx/chegirma ko'chadi)?
- Siz: A — bir tugma, hamma ma'lumot ko'chadi
- Isbot: sd-quotations.service.ts:161 convertToOrder + repo.convertQuotationToOrder jonli; sd_quotations.converted_to_order_id/order_id ustunlari bor; FE QuotationsTab.tsx mavjud. Endpoint @Post quotations convert.

**06.24  🟡 qisman**  — ❓ Q24/EP-SD-054+100: Buyurtma statuslari — AYNAN Производство (Ожд.Сырьё/Ожд.Производство/Готов)?
- Siz: A — real zavod statuslari, PP bilan avto ko'chadi; egasi rus-statuslarni afzal ko'radi
- Isbot: orders.constants.ts status-mashina INGLIZCHA (draft/confirmed/pending_advance/ready_for_planning/in_production/in_delivery/delivered/closed); jonli data ham inglizcha. Egasi AYNAN Ожд.Сырьё/Ожд.Производство/Готов istagan (EP-SD-100) — MOS EMAS. Status-mashina+gate ishlaydi, lekin nomlar vizyondan farq qiladi.

**06.25  🟡 qisman**  — ❓ Q25/EP-SD-055: Buyurtmani ishlab chiqarishga o'tkazish sharti (to'lov%+maket+limit OK)?
- Siz: A — shart-ro'yxat hammasi yashil bo'lsa o'tadi
- Isbot: update-order-status.handler.ts:40-52 avans-gate REAL bloklaydi (ready_for_planning'dan oldin checkAdvanceAndBlock → FORBIDDEN + AdvanceCheckFailedEvent). 3-checkpoint (BOM/routing/card) bor. LEKIN maket-tasdiq va kredit-limit gate'lari shu o'tishda BLOKLOVCHI sifatida birlashtirilgani isbotlanmadi — faqat avans bloklaydi.

**06.26  🟡 qisman**  — ❓ Q26/EP-SD-056: Maket/dizayn tasdig'i majburiy bosqich (imzo saqlanadi)?
- Siz: A — maket tasdig'i majburiy, mijoz tasdig'i saqlanadi
- Isbot: sales_orders.design_flag/sample_flag + aggregate _designFlag bor (sales-order.aggregate.ts:27). LEKIN maket-tasdiq AVTO bloklovchi darvoza (avans kabi transitionda FORBIDDEN) sifatida ishlatilishi jonli kodda topilmadi — faqat bayroq maydoni.

**06.27  🟡 qisman**  — ❓ Q27/EP-SD-057: Shartnoma turlari (bir martalik/yillik ramochnyy/spetsifikatsiya)?
- Siz: A — ikki daraja: bosh shartnoma + spetsifikatsiya; siyosat egasidan
- Isbot: sd_contracts jadvali + template_type ustuni bor (tur ajratish imkoni); createContract REAL. Lekin sd_contracts=0 qator; ikki-darajali (bosh+spetsifikatsiya) struktura jadvalda alohida modellanmagan.

**06.28  ❌ yo'q**  — ❓ Q28/EP-SD-058: Shartnomadagi strukturalangan shartlar (to'lov shakli/muddat/valyuta/jarima/penya)?
- Siz: A — har shart alohida maydon, buyurtmaga avto tushadi
- Isbot: sd_contracts ustunlari: id/order_id/contract_number/template_type/status/signed_at/pdf_url/valid_until/notes/papka_no — strukturalangan to'lov-shakli/valyuta/jarima/penya/sifat-e'tiroz maydonlari YO'Q. Kontroller ham start_date/end_date/total_amount/payment_terms'ni null'ga map qiladi (jadvalda yo'q).

**06.29  🟡 qisman**  — ❓ Q29/EP-SD-059: To'lov sharti turlari (100% avans/50-50/N kun otsrochka/konsignatsiya)?
- Siz: A — qattiq ro'yxat, har biriga standart otsrochka kun
- Isbot: sales_orders.payment_terms + advance_percent + advance_due_date + balance_due_date + sd_customers.payment_terms_days ustunlari REAL bor (DB tasdiq). Lekin qattiq RO'YXAT-enum (shablonlar: 50/50+5kun, 100% avans — EP-SD-128) strukturalangan lookup sifatida topilmadi — erkin matn payment_terms.

**06.30  🔑 egasi-data**  — ❓ Q30/EP-SD-060: Debitor (qarz) limiti — mijozga (oshsa bloklanadi)?
- Siz: A — summa limiti (toifaga bog'liq), oshsa yangi buyurtma bloklanadi; qiymat egasidan
- Isbot: drizzle-sd-customers.repo.ts:72 getCreditStatus REAL: credit_limit vs outstanding+amount → within_limit + flag (EP-SD-060/061/062). sd_customers.credit_limit ustuni bor. Limit qiymatlari egasidan kutiladi; auto-blok emas (flag→direktor).

**06.31  🔑 egasi-data**  — ❓ Q31/EP-SD-061: Debitor limiti oshganda harakat (blok→direktor tasdig'i bilan ochiladi)?
- Siz: A — bloklanadi, direktor/moliya tasdig'i bilan ochiladi (sabab yoziladi); oqim egasidan
- Isbot: getCreditStatus flag matnida 'direktor tasdig'i kerak (EP-SD-061)' bor (repo:88) + advance_bypass_by/reason ustunlari bo'lib-o'tish mexanizmini ko'rsatadi. Aniq tasdiq-oqim egasidan (OCHIQ).

**06.32  🟡 qisman**  — ❓ Q32/EP-SD-062: Muddati o'tgan qarz (prosrochka) bo'lsa yangi buyurtma avto-tasdiqqa?
- Siz: A — prosrochka bo'lsa yangi buyurtma tasdiqqa boradi (avto bayroq)
- Isbot: sd_customers'da open_debt/is_blocked/block_reason + dashboard getDebitorStats (aging) bor. LEKIN prosrochka→yangi buyurtma AVTO bayroq/tasdiq mexanizmi jonli kodda topilmadi — aging ko'rsatkich bor, gate yo'q. Egasi tasdig'i (OCHIQ).

**06.33  🟡 qisman**  — ❓ Q33/EP-SD-063: Takroriy buyurtma 'qayta buyurtma' tugmasi (o'lcham/dizayn/shtamp ko'chadi)?
- Siz: A — eski buyurtmadan nusxa, faqat tiraj/narx yangilanadi
- Isbot: sd_customer'da total_orders/last_order_date + 360-view orders tarixi bor; convertToOrder pattern mavjud. LEKIN aniq 'qayta buyurtma/nusxa' tugma-endpoint (eski item'larni ko'chiradigan) jonli kodda topilmadi.

**06.34  🟡 qisman**  — ❓ Q34/EP-SD-064: Takroriy buyurtmada narx avto-qayta hisob, eski narx yonida ko'rsatiladi?
- Siz: A — avto qayta hisob, eski narx yonida (farq ko'rinadi)
- Isbot: calculatePrice avto-qayta hisoblaydi (har chaqiruvda joriy sd_price_formulas'dan). Lekin 'eski narx yonida ko'rsatish' (oldingi vs yangi solishtirish) FE/BE logikasi jonli kodda topilmadi.

**06.35  🟡 qisman**  — ❓ Q35/EP-SD-065: Mijoz kartasida mahsulot/dizayn arxivi (o'lcham/dizayn/shtamp/oxirgi narx)?
- Siz: A — mijoz kartasida mahsulotlar arxivi jadvali
- Isbot: get360View (drizzle-sd-customers.repo.ts:92) REAL: customer + orders(LIMIT100) + contacts + documents + interactions + payments + NPS yig'adi; sd_customer_documents jadvali bor. LEKIN 'mahsulot arxivi' (o'lcham+dizayn-link+shtamp+oxirgi narx) maxsus jadvali topilmadi — buyurtma tarixi bor, dizayn-arxiv strukturasi yo'q.

**06.36  ✅ bor**  — ❓ Q36/EP-SD-066: Bir buyurtmada bir necha mahsulot (ko'p qator)?
- Siz: A — ko'p qatorli buyurtma (har qator o'z narxi/muddati), umumiy hujjat
- Isbot: sales_order_items jadvali sales_order_id FK + item_number + per-line net_price/delivery_date/quantity. JONLI: order 56 = 2 item (Karton quti A4 + Gofrokarton B3) — ko'p-qator REAL ishlaydi.

**06.37  🟡 qisman**  — ❓ Q37/EP-SD-067: Qisman yetkazib berish + qisman to'lov (bir necha partiya)?
- Siz: A — buyurtma→bir necha yetkazma + har biriga faktura/qabul
- Isbot: deliveries jadvali sales_order_id FK + delivered_quantity/open_quantity (sales_order_items) + advance_paid/balance_due (sales_orders) qisman-to'lov ustunlari REAL. deliveries=1 qator. Lekin bir buyurtma→ko'p yetkazma+ko'p faktura jonli zanjiri to'liq isbotlanmadi (deliveries data minimal).

**06.38  ❌ yo'q**  — ❓ Q38/EP-SD-068: Ortiqcha/kam ishlab chiqarish (+/-N% og'ish), faktura real chiqimdan?
- Siz: A — +/-N% og'ish, hisob real chiqqan miqdordan; N% egasidan
- Isbot: sales_order_items'da confirmed_quantity/delivered_quantity bor, lekin +/-N% og'ish-qoidasi yoki faktura-real-chiqimdan logikasi jonli kodda topilmadi. Og'ish-foiz mexanizmi yo'q (EP-SD-068 OCHIQ).

**06.39  🟡 qisman**  — ❓ Q39/EP-SD-069: Buyurtmani bekor qilish (bosqichga qarab jarima: maket=X%/bosildi=Y%/tayyor=100%)?
- Siz: A — bosqichga qarab bekor jarimasi; foizlar egasidan
- Isbot: cancelOrder/cancel REAL (sd-quotations.service.ts:240, orders.service.ts:70, status='cancelled' + sabab). LEKIN bosqichga-bog'liq jarima-foiz hisobi (order_cancellation_rules jadvali — A8-javob) jonli kodda topilmadi — bekor ishlaydi, jarima-foiz mexanizmi yo'q. Foizlar egasidan (OCHIQ).

**06.40  🟡 qisman**  — ❓ Q-KPI/EP-SD-009-013: Sotuv KPI — haftalik hajm/yopilgan bitim/o'rtacha bitim/debitor/aging GSD?
- Siz: ShVB YO'NALISH 26 — weeklySalesVolume/closedDeals/averageDealSize/debtorControl/salesTarget
- Isbot: sd-dashboard.service.ts getOverview (debitor stats) + getQuotaStats (target/achieved/pace) + getKpiTeam/getKpiTargets + sd_manager_quotas/sales_targets jadvallari REAL. Leaderboard/funnel bor. Lekin aniq haftalik (dushanba-yakshanba izolyatsiya) + per-menejer leaderboard to'liq jonli-tasdiqlanmadi.

**06.41  🟡 qisman**  — ❓ Q-Lead/EP-SD-001: Lead (potensial mijoz) — buyurtmadan oldingi voronka (lead→kotirovka→buyurtma)?
- Siz: A — lead bosqichi, konversiya % ko'rinadi
- Isbot: sd-leads.controller.ts to'liq CRUD (@Get/@Post/@Patch/@Delete/:id/convert/:id/activities); crm_leads=13 qator; getFunnelReport conversion_rate hisoblaydi (sd-quotations.service.ts:150). LEKIN sd_lead_activities=0 qator (faollik bo'sh); lead→kotirovka→buyurtma to'liq voronka jonli-zanjiri minimal data bilan.

**06.42  🟡 qisman**  — ❓ Q-Bonus/EP-SD-027+077: Sotuvchi buyurtmaga biriktiriladi + bonus marjadan (chegirma berса kamayadi)?
- Siz: A — mas'ul sotuvchi majburiy + bonus marjadan
- Isbot: sales_orders.assigned_to + sd_customers.manager_id biriktirish REAL; sd_manager_quotas bor. LEKIN bonus=marjadan (chegirma→kamayadi) hisob-logikasi SD modulda topilmadi — payroll_calculations'ga ulanishi (A34) jonli-tasdiqlanmadi.

**06.43  ✅ bor**  — ❓ Q-GoldenThread/EP-SD-020: Tasdiqlangan buyurtma avto PP'ga (oltin-ip, bir xil ID)?
- Siz: A — buyurtma avto ishlab chiqarishga, bir xil oltin-ip ID
- Isbot: update-order-status.handler.ts:72-110 REAL atomik: ready_for_planning o'tishida sales_orders UPDATE + outbox 'sd.order.status_changed' BIR transaksiyada; OrderStatusChangedEvent EventBus publish → PP listener. Golden-thread durabl (outbox re-emit). ERP_EVENTS.ORDER_STATUS_CHANGED.

**06.44  ✅ bor**  — ❓ Q-GL/EP-SD-030: To'lov tasdiqlangach avto GL (entries) kirim, debitor kamayadi?
- Siz: A — to'lov→GL avto Debit/Credit, debitor kamayadi
- Isbot: sd-quotations.service.ts:247-261 markPaymentPaid → gl.postCustomerPayment (DR Kassa 5010/CR Debitorlar 4000) jonli ulangan (GlPostingService); non-fatal log+retry (soxta emas). EP-SD-030 izoh kodda.

**06.45  ✅ bor**  — ❓ Q-Customer/EP-SD-074: Mijoz kartasi rekvizitlari (INN/STIR/bank/manzil/toifa/limit/to'lov)?
- Siz: A — to'liq strukturalangan karta, faktura avto-to'ladi
- Isbot: sd_customers ustunlari REAL: inn/stir/phone/email/address/legal_address/actual_address/customer_code/customer_type/credit_limit/payment_terms_days/abc_class/segment/discount_rate. 15 qator data. To'liq rekvizit struktura mavjud.

**06.46  🟡 qisman**  — ❓ Q-Dup/EP-SD-075: Mijoz unikalligi (INN/telefon dublikat tekshiruv)?
- Siz: A — INN/telefon avto-tekshiruv, dublikat ogohlantiradi
- Isbot: sd_customers.inn/phone ustunlari bor; sd-customers.service.ts mavjud. LEKIN yangi mijoz qo'shishda INN/telefon AVTO-dublikat tekshiruvi (qattiq blok — A39) jonli kodda aniq topilmadi — maydonlar bor, tekshiruv-logikasi isbotlanmadi.

**06.47  ✅ bor**  — ❓ Q-Audit/EP-SD-029+079: Narx/tiraj/muddat o'zgarish jurnali (kim/qachon/eski→yangi)?
- Siz: A — har o'zgarish jurnalga (kim/qachon/eski→yangi)
- Isbot: sd-quotations.service.ts:193-216 updateQuotation har update YANGI versiya yaratadi (changed_by + change_reason) + getRevisions; sd_quotation_revisions jadvali + sales_orders.changed_by/version ustunlari. AuditInterceptor kontrollerlarga ulangan.

**06.48  🟡 qisman**  — ❓ Q-RBAC/EP-SD-019: Karta-model RBAC (menejer=o'z mijozlari, rahbar=bo'lim, direktor=hammasi)?
- Siz: A — ko'rish doirasi kartaga bog'liq; tannarx faqat rahbar+
- Isbot: Kontrollerlar @UseGuards(JwtAuthGuard,RolesGuard) + @Roles(sales_manager/director/super_admin) REAL. sd_customers.manager_id bor. LEKIN menejer FAQAT o'z mijozlarini ko'rishi (row-level scope) + tannarx/margin rolga-qarab yashirish (EP-SD-097 forRole) jonli-tasdiqlanmadi — rol-guard bor, row-scope/margin-mask isbotlanmadi.

**06.49  ❌ yo'q**  — ❓ Q70/EP-SD-100: Buyurtma statuslari aynan zavod jadvalidagi real ro'yxat (V protsesse/Ojd.Syryo/Ojd.Proizvodstvo/Gotov/Zavershen/Otmenen) bo'lsinmi?
- Siz: Egasi: aynan zavod xodimlari ishlatadigan real Rus statuslari; boshqa status qo'ysa xodim tushunmaydi.
- Isbot: orders.constants.ts ingliz machine-kodlar (confirmed/in_production/in_delivery/cancelled); jonli sales_orders.status DISTINCT=cancelled/closed/delivered/confirmed/in_progress. Ojd.Syryo/Ojd.Proizvodstvo hech qayerda yo'q.

**06.50  ❌ yo'q**  — ❓ Q71/EP-SD-101: 'Ojd.Syryo' statusi avtomatik Ta'minotga material so'rovi signal bersinmi?
- Siz: Egasi: material yetishmasa avto Ta'minotga signal — uzilish yopiladi, kechikish kamayadi.
- Isbot: Sd kodida 'Ojd.Syryo'/MaterialRequiredEvent/Ta'minot signal grep=0; status enumning o'zi ham yo'q (Q70). manba decisions OCHIQ deb belgilagan, qurilmagan.

**06.51  ❌ yo'q**  — ❓ Q72/EP-SD-102: Buyurtmada bosma yo'nalishi Ofset/Flekso belgilansinmi (+AI tavsiya)?
- Siz: Egasi: offset=katta tiraj/sifat, flexo=gofra/etiketka; yo'nalish sex+narx+muddatni belgilaydi.
- Isbot: sales_orders va sd_quotation_items'da napravlenie/ofset/flexo ustun YO'Q (information_schema). design-schema.ts'da flexo bor lekin u dizayn-byuro, SD buyurtma emas.

**06.52  ❌ yo'q**  — ❓ Q73/EP-SD-103: Mashina formati (72SM/52SM/KVA105) o'lchamdan tavsiya + narx farqi?
- Siz: Egasi: katta list 72sm arzon, kichik 52sm qimmat; to'g'ri mashina=to'g'ri narx/tezlik.
- Isbot: SD kod/jadvalda mashina-format (72SM/52SM/KVA) yoki narx-farqi modeli grep=0. CRP/mashina-yuklama bog'lanish yo'q. (manba ham OCHIQ).

**06.53  🟡 qisman**  — ❓ Q74/EP-SD-104: Birlik (list/sht/m2) mahsulot turiga qarab avto?
- Siz: Egasi: quti->dona, gofra->m2/list; birlik aralashsa narx/ombor xato.
- Isbot: sales_order_items.unit ustuni bor (erkin), ammo mahsulot-turidan AVTO-birlik tanlash mantig'i yoki unit_conversion_rules jadvali YO'Q (jadval grep=0).

**06.54  ❌ yo'q**  — ❓ Q75/EP-SD-105: Material kimniki — davalcheskoe (mijoz materiali) belgisi?
- Siz: Egasi: mijoz materiali bersa narxdan chiqariladi, ombor 'begona material' yuritadi; belgilanmasa narx/ombor xato.
- Isbot: sales_orders/sd_quotation_items'da davalcheskoe/owner_type='client'/material_owner ustun YO'Q. crm-deal-products'da ownerType bor lekin u D/L/Q (deal/lead/quote), material-egasi emas.

**06.55  🟡 qisman**  — ❓ Q76/EP-SD-106: Mijoz fayllari (maket/trafaret/havola) buyurtmaga biriktirilsinmi?
- Siz: Egasi: dizayn-byuro mijoz faylisiz boshlay olmaydi; fayl buyurtmaga bog'lansa Telegram/pochtada izlash yo'qoladi.
- Isbot: sd_customer_documents (mijoz-darajasi) bor, lekin BUYURTMAGA biriktirilgan maket/trafaret fayl jadvali yo'q; sales_orders'da fayl/trafaret ustun yo'q. ow_order_samples mavjud (0 qator) lekin SD oqimiga ulanmagan.

**06.56  🟡 qisman**  — ❓ Q77/EP-SD-107: Buyurtma tasdiqlangach TZ avto KB/DB ga yuborilsinmi (event)?
- Siz: Egasi: qo'l-bera-qo'l topshiriq yo'qotadi; avto oqim=oltin-ip uzilmaydi.
- Isbot: ow_tech_cards (order_id, ai_generated_from, approved) jadval mavjud (0 qator) — struktura bor; lekin SD tasdig'idan TZ->KB/DB avto-event/listener kodi grep=0. sales_orders.tech_card_approved ustuni bor (gate).

**06.57  ❌ yo'q**  — ❓ Q78/EP-SD-108: Gruzopodyomnost (kg) -> gofra qatlam/marka AI tavsiya?
- Siz: Egasi: yuk talabi konstruksiyani belgilaydi; 10kg->5 qatlam T23 tavsiya brak/shikoyatni kamaytiradi.
- Isbot: sales_orders/sd_quotation_items'da gruzopodyomnost/kg/load_capacity ustun YO'Q; gofra qatlam-marka AI tavsiya kodi yo'q.

**06.58  ❌ yo'q**  — ❓ Q79/EP-SD-109: KP ni ERP avto-PDF qilsinmi (logo+narx jadvali+to'lov+5%+imzo)?
- Siz: Egasi: Word qo'lda vaqt/xato; ERP avto-PDF izchil, brending saqlanadi.
- Isbot: sd-quotations.controller.ts'da PDF/generatePdf endpoint YO'Q (faqat send/convert/approve); application'da generateQuotePdf grep=0. Narx hisob-formulasi bor (calculatePrice) lekin PDF render yo'q.

**06.59  ❌ yo'q**  — ❓ Q80/EP-SD-110: Kotirovka imzosi (Kommercheskiy direktor ism+telefon) karta-modeldan avto?
- Siz: Egasi: rasmiy taklifda kontakt shart; avto bo'lsa eskirgan telefon chiqmaydi.
- Isbot: Avto-imzo/kontakt karta-modeldan tushish kodi yo'q; PDF/KP generatsiyasi umuman yo'q (Q79). sd_quotations'da signed_by/komdir ustun yo'q.

**06.60  🟡 qisman**  — ❓ Q81/EP-SD-111: KP yuborish huquqi faqat komdir/rahbarga (governance)?
- Siz: Egasi: menejer o'zboshimcha narx yuborsa nazorat yo'qoladi; imzolash huquqi rolga bog'lansin.
- Isbot: sd-quotations.controller.ts'da approve endpoint bor (Patch/Put quotations/:id/approve) — tasdiq oqimi mavjud; lekin rol-gate (komdir-only @Roles) kodda ko'rinmaydi, RBAC ulanish noaniq.

**06.61  ❌ yo'q**  — ❓ Q82/EP-SD-112: Debitor 'Daromadlar bo'limi' alohida rolga biriktirilsinmi (sotuvchidan ajratilgan)?
- Siz: Egasi: qarz undirish alohida mas'ul; sotuvchi o'z mijozidan qarz so'rashni istamaydi (munosabat).
- Isbot: Daromadlar bo'limi/debt-collector roli yoki debitorni shu kartaga biriktirish kodda yo'q; sd_customers.open_debt ustuni bor (ko'rsatkich) lekin rol-ajratish yo'q.

**06.62  🟡 qisman**  — ❓ Q83/EP-SD-113: Mijoz bilan aloqa korporativ raqamdan + qo'ng'iroq jurnali buyurtmaga (NO-2)?
- Siz: Egasi: menejer shaxsiy raqamdan gaplashsa mijozni olib ketadi; korporativ raqam+jurnal=mijoz kompaniyaniki.
- Isbot: sd_customer_interactions jadvali bor (aloqa tarixi) va controller'da :id/interactions GET/POST real; lekin KORPORATIV-raqam/NO-2 qo'ng'iroq-tizimi integratsiyasi (telefon-platforma) yo'q.

**06.63  ❌ yo'q**  — ❓ Q84/EP-SD-114: Menejer ketsa mijoz bazasi avto qayta biriktirilsinmi (EmployeeDeactivated event)?
- Siz: Egasi: 24000 mijoz qadrli; menejer ketganda mijoz egasiz qolmasin, rahbar/yangi menejerga o'tsin.
- Isbot: EmployeeDeactivated listener / customer-reassign kodi SD'da grep=0. sd_customers.manager_id ustuni bor (biriktirish) lekin avto-o'tkazish hodisasi yo'q.

**06.64  🟡 qisman**  — ❓ Q85/EP-SD-115: Lead (potensial mijoz) buyurtmadan oldingi bosqich + konversiya %?
- Siz: Egasi: har gaplashuv buyurtma emas; lead bosqichi konversiya % va yutqazilgan leadlarni ko'rsatadi.
- Isbot: sd-leads.controller.ts + sd_lead_activities jadvali mavjud (lead voronkasi struktura bor); reports/funnel endpoint ham bor. Lekin lead->kotirovka->buyurtma to'liq oltin-ip bog'lanishi va konversiya hisobi yuza.

**06.65  ❌ yo'q**  — ❓ Q86/EP-SD-116: Mavsumiy mahsulot (kalendari/podarochnye) mavsum-oldi signal + o'tgan yil mijoz ro'yxati?
- Siz: Egasi: kalendar dekabrda kech; oktyabrda signal+o'tgan yil mijozlari=mavsum yutilmaydi.
- Isbot: Mavsumiy cron/signal/seasonal kodi SD'da yo'q; mahsulot katalogining o'zi (~15 toifa) qurilmagan (Q87). manba OCHIQ.

**06.66  ❌ yo'q**  — ❓ Q87/EP-SD-117: Mahsulot katalogi kitobdagi ~15 toifaga moslansinmi (upakovki/gofrolotki/displei/stakany...)?
- Siz: Egasi: sotuv aynan shu assortimentni sotadi; katalog mos bo'lsa toifali hisobot ishlaydi.
- Isbot: ~15 toifali mahsulot katalogi jadvali yo'q; sd_quotation_items.product_type erkin matn ustun (lookup-jadval emas). Kitobning real toifalari kodda yo'q.

**06.67  ❌ yo'q**  — ❓ Q88/EP-SD-118: Bumajnye stakany/pitssa — maxsus o'lcham shabloni (stakan->ml, pizza->diametr)?
- Siz: Egasi: stakan 250/350ml, pizza 30/35sm standartlari; umumiy a/b/c o'lcham to'g'ri kelmaydi.
- Isbot: sd_quotation_items faqat length/width/height_mm (umumiy UxKxB); ml/diametr maxsus shablon ustun yoki tur-specifik forma YO'Q. manba OCHIQ.

**06.68  ❌ yo'q**  — ❓ Q89/EP-SD-119: Rulonnye samokleyki (etiketka) rulon parametrlari (gilza/rulon-dona/yo'nalish)?
- Siz: Egasi: etiketka rulonda yetkaziladi; gilza/rulon-dona belgilanmasa mijoz mashinasi ishlamaydi.
- Isbot: Etiketka/rulon parametr (gilza_diameter/rolls_per/qty_per_roll) ustun yoki jadval yo'q; material_type='roll' belgisi SD'da yo'q. manba OCHIQ.

**06.69  ✅ bor**  — ❓ Q90/EP-SD-120: Summa/Ostalos — buyurtma Jami/To'langan/Qoldiq avto ko'rinishi?
- Siz: Egasi: bir qarashda kim qancha qarzdor ko'rinsin; qoldiq avto=debitor real-vaqt.
- Isbot: sales_orders ustunlari: total_amount, paid_amount, balance_due_amount, advance_paid_amount — Jami/To'langan/Qoldiq real ustunlar mavjud (information_schema).

**06.70  🟡 qisman**  — ❓ Q91/EP-SD-121: Va'da sanasi (Data gotovnosti) ishlab chiqarish quvvatidan tasdiqlansinmi?
- Siz: Egasi: band sexga 'ertaga tayyor' desa kechikish kafolat; quvvatdan kelgan sana=bajariladigan va'da.
- Isbot: sales_orders.requested_delivery_date + delivery_date ustunlari bor (ikki sana saqlanadi); atp-check endpoint bor lekin CRP/MPS quvvatdan REAL eng erta sana hisoblash mantig'i to'liq emas.

**06.71  🟡 qisman**  — ❓ Q92/EP-SD-122: Va'da<->real solishtirilib kechikish kuni+sababi o'lchanishimi?
- Siz: Egasi: 'muddatda bajarish %' KPI; kechikish o'lchanmasa sabab topilmaydi.
- Isbot: requested_delivery_date va delivery_date ikkalasi saqlanadi (solishtirish uchun ma'lumot bor), lekin delay_risk_days/kechikish-sabab qayd qiluvchi hisob-mantiq SD'da grep=0.

**06.72  ❌ yo'q**  — ❓ Q93/EP-SD-123: Upakovka turi (stepler/pallet/myagkaya/veryovka) -> vaqt+material avto?
- Siz: Egasi: o'rash turi ish-vaqti/material (paddon kadoklagan alohida ish-soat); belgilanmasa narx/vaqt xato.
- Isbot: sales_orders/sd_quotation_items'da packaging_type ustun YO'Q. ow_packaging_records.packaging_type bor (0 qator, MES/work_order-darajasi) lekin SD buyurtma kiritishga ulanmagan.

**06.73  ❌ yo'q**  — ❓ Q94/EP-SD-124: Palletda dona soni va pallet o'lchami buyurtmada?
- Siz: Egasi: pallet parametri logistika (necha pallet/mashina) va mijoz ombori uchun shart.
- Isbot: sales_orders/sd_quotation_items'da pallet_qty/pallet_size/qty_per_pallet ustun YO'Q. ow_pallet_recoveries (qaytarish, 0 qator) bor lekin buyurtma pallet-spetsifikatsiyasi emas.

**06.74  🔑 egasi-data**  — ❓ Q95/EP-SD-125: Klishe/forma egaligi (mijoz/zavod) + arxiv muddati (3 yil)?
- Siz: Egasi: mijoz 'klishe meniki' yoki 'yo'qotibsiz' desa nizo; egalik+muddat yozma bo'lsa nizo oldi olinadi.
- Isbot: ow_molds (order_id, vendor, status, photo_proof) jadvali mavjud (0 qator) — forma-arxiv strukturasi bor; lekin egalik (mijoz/zavod) va saqlash-muddati ustunlari yo'q; manba decisions OCHIQ (egalik+muddat egasidan).

**06.75  🟡 qisman**  — ❓ Q96/EP-SD-126: Buyurtma rentabelligi (Tannarx/Sotuv/Margin%) menejerga real-vaqt + margin<X qizil?
- Siz: Egasi: 5% chegirma berganda margin manfiy bo'lmasligini ko'rsin; 'ishladi lekin zararga sotdi' bo'lmasin.
- Isbot: sd-quotations.service.ts calculatePrice margin/costPrice/markupPercent qaytaradi (hisob bor); sd_quotation_items.cost_price ustuni bor. Lekin margin<floor QIZIL-OGOHLANTIRISH/blok mantig'i kodda yo'q (EP-SD-047 floor ham qurilmagan).

**06.76  🟡 qisman**  — ❓ Q97/EP-SD-127: Tannarx/margin RBAC — faqat rahbar+ ko'radi, menejer sotuv narxini?
- Siz: Egasi: tannarx sizib chiqsa raqobatchi foydalanadi; rolga qarab ko'rinish=sir himoyasi.
- Isbot: calculatePrice cost/margin qaytaradi lekin rolga-qarab SELECT-list'dan margin chiqarish (SdOrderProjection.forRole) kodi grep=0; @Roles guard quotations'da ko'rinmaydi. Sir-himoya RBAC qurilmagan.

**06.77  🟡 qisman**  — ❓ Q98/EP-SD-128: To'lov sharti shabloni (50% avans+5 kun; 100% avans; N kun) tanlanadimi?
- Siz: Egasi: kompaniya real standarti; shablon tanlansa debitor sanog'i avtomatlashadi.
- Isbot: sales_orders.payment_terms + sd_customers.payment_terms_days ustunlari bor (erkin saqlash); lekin tayyor SHABLON ro'yxati (50/50+5kun, 100%) lookup-jadval yoki enum YO'Q. KP-standart shablonlar qurilmagan.

**06.78  🟡 qisman**  — ❓ Q99/EP-SD-129: Otgruzka sanasi + 5 kun -> qoldiq to'lov muddati avto + o'tsa ogohlantirish?
- Siz: Egasi: postoplata otgruzkadan boshlanadi; avto=debitor muddati aniq, o'z vaqtida ogohlantirish.
- Isbot: sales_orders.balance_due_date ustuni bor; deliveries.delivered_at bor. Lekin OrderShippedEvent->balance_due_date=shipped+N hisoblash listeneri kodda yo'q; ogohlantirish cron yo'q.

**06.79  ❌ yo'q**  — ❓ Q100/EP-SD-130: 100% avans -> 5% chegirma avto qoidasi?
- Siz: Egasi: KP yozma siyosat (predoplata 100% skidka 5%); avtomatlashsa har doim bajariladi.
- Isbot: advancePercent=100->5% discount mantig'i grep=0 (application/sd). sales_orders.advance_percent ustuni bor lekin chegirma-bog'lanish kodi yo'q. manba 'JAVOBLANGAN' degan, lekin REAL qurilmagan.

**06.80  🟡 qisman**  — ❓ Q101/EP-SD-131: Narx NDS'siz saqlanib, QQS alohida qatorda chiqsinmi?
- Siz: Egasi: KP 'Tsena bez NDS' + alohida soliq; taklif<->faktura mos kelsin.
- Isbot: calculatePrice priceBeforeVat va vatRate(12) alohida hisoblaydi; sales_orders.tax_amount + net_value/net_price ustunlari bor. Lekin tax_rates jadvali yo'q (vat_rate sd_price_formulas'da config), mijoz QQS-to'lovchimi belgisi yo'q.

**06.81  🟡 qisman**  — ❓ Q102/EP-SD-132: Buyurtma o'zgartirish jurnali (tiraj/muddat/narx kim/qachon/eski->yangi)?
- Siz: Egasi: '5000 aytgandim 3000 qildingiz' nizosini hal qilish uchun jurnal kerak.
- Isbot: sd_order_timeline (order_id, status, note, changed_by) + sd_quotation_revisions jadvallari bor; sales_orders.changed_by/version ustunlari bor. Lekin TIRAJ/MUDDAT field-level eski->yangi diff jurnali (qiymat-darajasida) emas, asosan status-darajasida.

**06.82  🟡 qisman**  — ❓ Q103/EP-SD-133: Maket tasdiqlangandan keyingina bosma — majburiy darvoza (sana+kim)?
- Siz: Egasi: tasdiqlanmagan maketni bosib qo'ysa butun tiraj brak; rasmiy tasdiq=brak himoyasi.
- Isbot: sales_orders ustunlari: design_flag, sample_flag, tech_card_approved, tech_approved_by, tech_approved_at — tasdiq-gate strukturasi bor; status-mashina bosqichlar bor. Lekin MAKET tasdiqsiz bosma-blokini majburlovchi hard-gate (mijoz-imzo saqlash) yuza — design moduliga to'liq ulanmagan.

**06.83  🟡 qisman**  — ❓ Q104/EP-SD-134: Reklamatsiya buyurtma+sex/uchastka+sabab kodi bilan bog'lansinmi?
- Siz: Egasi: shikoyat buyurtma+sexga bog'lansa brak ildiz-sababi (qaysi mashina/usta/material) ko'rinadi.
- Isbot: sd_customer_complaints (order_id, complaint_type, responsible_department, severity) jadvali bor; controller :id/complaints GET/POST/resolve real. Lekin SEX/UCHASTKA + sabab-kod (rang/skleyka/o'lcham) granular bog'lanish va QC-event ulanishi yo'q.

**06.84  ❌ yo'q**  — ❓ Q105/EP-SD-135: Yangi mijoz vs takror mijoz uchun har xil buyurtma oqimi?
- Siz: Egasi: takrordan TZ/dizayn/forma qayta so'rash vaqt yo'qotadi; yangi=to'liq oqim, takror=qisqa.
- Isbot: convert-to-order endpoint bor lekin yangi-vs-takror IKKI alohida oqim (eski TZdan ko'chirish, formani chetlab o'tish) kodda yo'q; takror-buyurtma 'nusxa' tugmasi/SKU-katalog (Q94) qurilmagan.

**06.85  🟡 qisman**  — ❓ Q106/EP-SD-136: Faollik segmenti (Yirik/Doimiy/Bir martalik/Nofaol) avto + ABC bilan ikki o'lcham?
- Siz: Egasi: ABC=pul hajmi, faollik=munosabat; Nofaolga qaytarish kampaniyasi, Doimiyga sodiqlik.
- Isbot: sd_customers.abc_class + abc_computed_at + CustomerAbcService (abc/preview, abc/recompute real); last_order_date + churn_risk_pct + segment ustunlari bor. Lekin oxirgi-buyurtma sanasidan AVTO faollik-segmenti (Yirik/Doimiy/Nofaol) hisoblovchi cron/mantiq yuza.

**06.86  🟡 qisman**  — ❓ Q107/EP-SD-137: Buyurtma ID=oltin-ip; har bosqich (TZ/material/reja/yetkazish/to'lov) shu ID ga yozilsinmi?
- Siz: Egasi: bo'limlar uzilgan; buyurtma ID butun zanjirni bog'lasa 'buyurtmam qayerda' yagona javob.
- Isbot: sales_orders.id INTEGER PK markaziy; deliveries.sales_order_id, sales_order_items.production_order_id, sd_invoices.sales_order_id FK-bog'lanishlar bor (struktura tayyor). Lekin to'liq event-driven oltin-zanjir (SD->PP->MES->QC->WMS->FIN) listenerlar va domain_events oqimi yuza/uzuq (EVENT_KATALOGI ogohlantirgan).

**06.87  ✅ bor**  — ❓ Q108/EP-SD-138: Yetkazish fakti — haydovchi+mashina+yetkazildi vaqti buyurtmaga qayd?
- Siz: Egasi: 'yetib bordimi, kim oldi' javobi; haydovchi+vaqt=isbot + postoplata sanog'i boshlanadi.
- Isbot: deliveries jadvali driver_name/vehicle_number/dispatched_at/delivered_at/actual_arrival ustunlari bor; SdCreateDeliverySchema driverName+vehicleNumber qabul qiladi, repo deliveries'ga real INSERT qiladi (drizzle-sd-deliveries.repo.ts:55). 1 qator jonli.

**06.88  ❌ yo'q**  — ❓ EP-SD-083: Kongrev va tisnenie ALOHIDA operatsiya (alohida belgi+forma+narx)?
- Siz: Egasi: tisnenie(folga) va kongrev(relyef) har xil jihoz/forma/narx; aralashsa narx+marshrut xato.
- Isbot: sd_quotation_items'da tisnenie/kongrev/embossing-type alohida ustunlar YO'Q (sd_price_formulas.embossing_price bitta umumiy tarif bor). Ikki alohida operatsiya ajratilmagan. grep tisnenie/kongrev=0.

**06.89  ❌ yo'q**  — ❓ EP-SD-084: Tisnenie rangi zoloto/serebro tanlovi -> ombor folga zaxirasiga bog'lansinmi?
- Siz: Egasi: oltin/kumush folga har xil material; belgilanmasa ishlab chiqarish to'xtaydi yoki noto'g'ri folga.
- Isbot: folga_color/zoloto/serebro ustun yoki lookup SD kodida grep=0; ombor folga-zaxira bog'lanish yo'q. Decisions 'JAVOBLANGAN/CREATE' degan lekin REAL qurilmagan.

**06.90  ❌ yo'q**  — ❓ EP-SD-085: Laminatsiya turi (glyantsevaya/matovaya/metal-zoloto/metal-serebro) ro'yxatdan?
- Siz: Egasi: yaltiroq/mat/metallik 3 xil rulon/narx; tanlanmasa narx+ombor xato.
- Isbot: sd_quotation_items.lamination ustuni BOR lekin u boolean/erkin (tur ro'yxati yo'q: glyanets/mat/metal-oltin/metal-kumush enum yoki lookup yo'q). sd_price_formulas.lamination_price bitta tarif.

**06.91  ❌ yo'q**  — ❓ EP-SD-086: Lak turi (sploshnoy/trafaretnyy/VD lak/vyborochnyy) + qoplama foizi?
- Siz: Egasi: sploshnoy/trafaretnyy har xil sarf/narx, VD lak boshqa jihoz; aralashsa narx xato.
- Isbot: sd_quotation_items.special_coating bitta umumiy belgi; lak-turi ro'yxati (sploshnoy/trafaretnyy/VD) yoki coverage% ustun YO'Q. grep lak=0.

**06.92  ❌ yo'q**  — ❓ EP-SD-087: Kashirovka (offset+gofra birlashtirish) alohida operatsiya+narx?
- Siz: Egasi: kashirovka=offset bosma+gofra (premium quti), alohida jihoz/vaqt; belgilanmasa marshrut+narx xato.
- Isbot: kashirovka belgisi va offset+gofra marshrut-birlashtirish SD kodida grep=0. sd_quotation_items'da bunday ustun yo'q.

**06.93  ❌ yo'q**  — ❓ EP-SD-088: Vysechka turi (avtotigel/rotatsionnaya/plotter/qo'lda) buyurtmada?
- Siz: Egasi: rotatsion=katta tiraj, plotter=namuna, avtotigel=o'rtacha; usul tiraj+narxni belgilaydi.
- Isbot: vyrubka/vysechka/die_cut_method (avtotigel/rotatsionnaya/plotter) ustun yoki lookup SD'da yo'q. sd_quotation_items.is_new_die faqat 'yangi shtampmi' boolean, usul emas.

**06.94  ❌ yo'q**  — ❓ EP-SD-089: Skleyka turi (avtomat/ruchnaya/FSM/okoshkovkleyka) -> ish vaqti+narx avto?
- Siz: Egasi: qo'lda skleyka qimmat, avtomat arzon, okoshkovkleyka alohida; usul ish-narxini keskin o'zgartiradi.
- Isbot: skleyka turi (avtomat/ruchnaya/FSM/okoshkovkleyka) ustun yoki sdelka-tarif bog'lanish SD'da grep=0. Faqat orders repo'da 'ready_for_flexo' (boshqa kontekst).

**06.95  ❌ yo'q**  — ❓ EP-SD-090: 'Bez oborota/s oborotom' (bir/ikki tomon bosma) -> bo'yoq+mashina ikki barobar?
- Siz: Egasi: ikki tomon=ikki barobar plastina/bo'yoq/mashina vaqti; belgilanmasa narx jiddiy xato.
- Isbot: bez oborota/s oborotom / print_sides / double_sided ustun yoki narx-hisobida 2x mantiq SD'da grep=0. calculatePrice'da print bir-tomonlama hisoblanadi.

**06.96  ❌ yo'q**  — ❓ EP-SD-091: '3-makro/3-mikro' gofra/big turi belgisi (lug'atdan)?
- Siz: Egasi: makro/mikro gofra har xil flute/his/narx; 'mikrogofra' so'rasa makro bersak brak.
- Isbot: makro/mikro gofra turi ustun yoki lug'at SD'da grep=0. sd_quotation_items'da gofra-flute turi yo'q.

**06.97  ❌ yo'q**  — ❓ EP-SD-092: Gofroyashik qatlami (2-sloy/3-sloy/5-sloy) + AI yuk tavsiya?
- Siz: Egasi: qatlam soni mustahkamlik+narx (3=yengil, 5=og'ir yuk); yuk ko'tarishga bog'liq.
- Isbot: gofra qatlam soni (2/3/5 / layer_count / sloy) ustun SD'da grep=0. sd_quotation_items.thickness_mm bor lekin u mm-qalinlik, qatlam-soni emas; AI yuk-tavsiya yo'q.

**06.98  ❌ yo'q**  — ❓ EP-SD-093: Banderol (o'rov lentasi) alohida pozitsiya (o'z o'lcham/bosma/narx)?
- Siz: Egasi: banderol alohida bosma+qirqim+o'rov ishi; asosiy mahsulot bilan aralashsa narx/sarf yo'qoladi.
- Isbot: banderol element/pozitsiya SD kodida grep=0; sd_quotation_items'da bunday tur yo'q.

**06.99  ❌ yo'q**  — ❓ EP-SD-094: Latok standart SKU katalogi (Latok-449=390x259x60, Latok-250) to'liq spetsifikatsiya bilan?
- Siz: Egasi: bir xil lotok takror sotiladi; SKU tanlansa o'lcham/spetsifikatsiya/narx avto keladi=1 klik.
- Isbot: Nomli SKU katalogi (Latok-449/250) jadvali yoki seed SD'da grep=0; sd_quotation_items.product_type erkin matn, SKU-spetsifikatsiya bog'lanishi yo'q. Takror-buyurtma 1-klik amalga oshmagan.

**06.100  ❌ yo'q**  — ❓ EP-SD-095: 'Tex opisanie po bumagam' matnini ERP maydonlardan AVTO tuzsinmi?
- Siz: Egasi: qo'lda har menejer har xil yozadi/xato; maydonlardan avto-matn izchil taklif.
- Isbot: Maydonlardan 'Gofra 3 sloy, Marka T22, profil S' avto-matn shakllantirish funksiyasi SD'da grep=0; manba qatlam/marka/profil ustunlarining o'zi yo'q (Q92,Q96).

**06.101  ❌ yo'q**  — ❓ EP-SD-096: Marka T22/profil S — markaziy material lug'atdan (qattiq ro'yxat)?
- Siz: Egasi: marka(T21/T22/T23)/profil(B/C/E) sanoat standarti; erkin matn 'T22'/'T-22'/'t22' bo'lib tarqaydi.
- Isbot: Gofra marka/profil markaziy lug'at jadvali (T21/T22; B/C/E) SD/material reestrida grep=0; sd_quotation_items'da marka/profil ustun yo'q.

**06.102  ❌ yo'q**  — ❓ EP-SD-097: Plyonka qalinligi (30 mkr/100 mkr) standart ro'yxatdan?
- Siz: Egasi: 30/100 mkr har xil narx/himoya; qalinlik belgilanmasa narx+ombor xato.
- Isbot: plyonka mikron-qalinlik (30/100 mkr / film_thickness_mcr) ustun yoki lookup SD'da grep=0. Laminatsiya umuman bitta tarif (Q85).

**06.103  🟡 qisman**  — ❓ Q68/EP-SD-098: 'Papka No' — buyurtmaga jismoniy papka raqami bog'lansinmi (UNIQUE)?
- Siz: Egasi: 'qaysi papkada' har kuni so'raladi; raqam ERPda bo'lsa jismoniy hujjat tez topiladi.
- Isbot: sd_contracts.papka_no ustuni BOR (shartnoma-darajasida); mes_papka_orders jadvali bor. Lekin sales_orders.folder_number ustuni YO'Q (decisions 1 papka:N buyurtma + UNIQUE index va'da qilgan — sales_orders'da qurilmagan).

**06.104  ❌ yo'q**  — ❓ Q69/EP-SD-099: 'Zakaz 1S' — eski 1S raqamini ixtiyoriy saqlash (migratsiya ko'prigi)?
- Siz: Egasi: kompaniya 1S dan kelyapti; eski raqam saqlansa eski<->yangi hisobot va mijoz tarixi ulanadi.
- Isbot: sales_orders'da order_1c/zakaz_1c/onec_number ustun YO'Q (information_schema). 1S-raqam migratsiya-ko'prigi maydoni qurilmagan; mijoz-darajasi crm_company_id bor lekin buyurtma 1S-raqami emas.

**06.105  🟡 qisman**  — ❓ EP-SD-067: Qisman yetkazib berish + qisman faktura (har yetkazmaga alohida)?
- Siz: Egasi: katta tiraj bo'lib jo'natiladi; har partiyaga alohida faktura/qabul, aniq qoldiq.
- Isbot: deliveries jadvali (planned/actual_goods_movement_date, number_of_packages) + sales_order_items.delivered_quantity/open_quantity ustunlari bor (qisman yetkazma strukturasi); sd_invoices ko'p faktura mumkin. Lekin invoice_type='partial' va har yetkazmaga avto-faktura GL-bog'lanishi to'liq emas.

**06.106  🟡 qisman**  — ❓ EP-SD-073: Hisob-faktura raqami avto ketma-ketlik (DB sequence, race-condition yo'q)?
- Siz: Egasi: qo'lda raqamlash takrorlanadi; soliq/audit uchun avto tartibli raqam (SO-2026-NNNNN).
- Isbot: invoice_number_seq DB SEQUENCE jonli mavjud (information_schema.sequences); sd_invoices.invoice_number ustuni bor. generateInvoiceNumber sequence ishlatishini service-darajasida to'liq tasdiqlash kerak, lekin sequence-poydevor bor.

**06.107  ❌ yo'q**  — ❓ EP-SD-069: Buyurtmani bekor qilish bosqichga qarab jarima (maket=X%/bosildi=Y%/tayyor=100%)?
- Siz: Egasi: yarim ishlangan buyurtma bekor bo'lsa zavod xarajatni qoplashi kerak (bosqichli jarima).
- Isbot: cancelOrder (sd-quotations.service.ts:240) faqat status='cancelled'+soft-delete qiladi; bosqichli JARIMA hisobi yo'q. order_cancellation_rules jadvali grep=0 (information_schema).

---

## 07 — PP / Rejalashtirish  (vizyon 46%, 142 savol)

**07.1  🟡 qisman**  — ❓ Q1: Texnologik karta operatsiya ketma-ketligi 10-lik qadam (10,20,30) bilan raqamlanadimi?
- Siz: A) Har operatsiya 10-lik qadam bilan raqamlanadi — orasiga yangi bosqich qo'shsa raqam buzilmaydi (Bichish/Rilovka/Bosma/Tig'lash/Yopishtirish/Qadoqlash)
- Isbot: pp_routing_operations.operation_number (varchar) + sequence(int) ustunlari bor (q.cjs information_schema), lekin jadval 0 qator — 10-lik konvensiya kodda majburlanmaган, faqat ustun mavjud. Real marshrut data yo'q.

**07.2  🟡 qisman**  — ❓ Q2: Har operatsiyaga stanok + muqobil stanok ro'yxati bog'lanadimi?
- Siz: A) Operatsiya bitta aniq stanokka bog'lanadi + 'muqobil stanok' ro'yxati (asosiy band bo'lsa muqobilga o'tadi)
- Isbot: pp_routing_operations.work_center_id bor (asosiy stanok bog'lanadi), AMMO 'muqobil/alternative stanok' ustuni hech qaerda YO'Q (q.cjs: alternative/machine_group=0). Muqobil-o'tish mexanizmi qurilmagan.

**07.3  ✅ bor**  — ❓ Q3: Har operatsiyaga norma (dona/soat yoki run_time/dona) saqlanadimi?
- Siz: A) Norma har operatsiyaga alohida (dona/soat yoki dona/smena)
- Isbot: pp_routing_operations.run_time_per_unit_min + machine_time ustunlari mavjud; PpCrpService.loadRoutingOps run_time_per_unit_min ni o'qiydi (pp-crp.service.ts:132-137). Struktura to'liq, data 0.

**07.4  ✅ bor**  — ❓ Q4: Tayyorlov/setup vaqti ishlash normasidan alohida saqlanadimi?
- Siz: A) Har operatsiyaga ikki vaqt: setup (bir martalik, partiyaga) + ishlash normasi (dona/soat)
- Isbot: pp_routing_operations.setup_time + setup_time_min ustunlari alohida; CRP requiredMins = setup_time_min + run_time×qty formulasi (pp-crp.service.ts:183-185). Setup-guruhlash (o'xshash ishlarni ketma-ket) qo'shimcha logikasi yo'q.

**07.5  🟡 qisman**  — ❓ Q5: Chiqindi/brak normasi (doimiy otxod + foizli otxod) saqlanadimi?
- Siz: A) Ikki xil: doimiy otxod (har sozlashda N list) + foizli otxod (% tirajdan) qo'shiladi
- Isbot: technology_cards.scrap_pct (numeric) FOIZLI otxod uchun bor (q.cjs), AMMO 'doimiy otxod (N list/sozlash)' alohida ustun YO'Q; routing.aggregate'da scrap maydoni umuman yo'q (grep: scrap=0). Faqat % qismi, doimiy qism yetishmaydi.

**07.6  ✅ bor**  — ❓ Q6: Texkarta versiyali + tasdiqlash (qoralama/tasdiqlangan/arxiv)?
- Siz: A) Versiyali: har o'zgarish yangi versiya, eski arxiv, texnolog tasdiqlaydi (status)
- Isbot: technology_cards.version(int) + status(varchar='draft') + lab_approved + maket_approved + created_by ustunlari mavjud (q.cjs); technology.repository status/version/lab_approved o'qiydi+yozadi (technology.repository.ts:143). Versiya-snapshot eski-saqlash mexanizmi (arxiv) qo'shimcha tekshiruv talab qiladi.

**07.7  🟡 qisman**  — ❓ Q7: Har operatsiyaga minimal razryad + sertifikat (LMS) talabi?
- Siz: A) Har operatsiyaga minimal razryad + sertifikat (LMS kursi) talabi
- Isbot: work_centers.required_skill_name + certification_lms_course_id (uuid) STANOK darajasida bor, AMMO ikkisi ham NULL (q.cjs work center sample). pp_routing_operations'da razryad/operatsiya-darajasi talabi YO'Q. Karta-darajada qisman, operatsiya-darajada yo'q + data bo'sh.

**07.8  🟡 qisman**  — ❓ Q8: Karton spetsifikatsiyasi (format/flute/gramaj/qatlam/ranglar/laminatsiya) maydonlari?
- Siz: A) To'liq spetsifikatsiya: format, flute turi, gramaj, qatlam, ranglar soni, laminatsiya bor/yo'q
- Isbot: technology_cards.format_a/format_b/gofra_profile/print_params(jsonb)/material_type bor (q.cjs), pp_flute_types jadval mavjud. AMMO yagona qatorda hammasi NULL (test card AUDIT-TC-TEST, direction='flx-gof' faqat). Struktura bor, real spetsifikatsiya data yo'q.

**07.9  🟡 qisman**  — ❓ Q9: Har operatsiya o'z tabiiy birligida (list/dona/m²/kg) — tizim o'tkazadimi?
- Siz: A) Har operatsiya o'z tabiiy birligida (bosma=list, tig'lash=dona), tizim o'tkazadi
- Isbot: production_orders.unit(text) + gofra-conversion moduli (pp/conversion/ gofra-conversion.service.ts m²↔dona) mavjud, work_centers.norma_m2_per_shift + norma_kg_per_shift bor. AMMO pp_routing_operations'da per-operatsiya birlik ustuni YO'Q — operatsiya-darajali avtomatik konvertatsiya to'liq emas.

**07.10  🟡 qisman**  — ❓ Q10: Norma manbai — texnolog qo'lda + tizim haqiqiy o'rtacha yonma-yon?
- Siz: A) Texnolog reja normasi kiritadi, tizim haqiqiy o'rtachani ham ko'rsatadi (og'ish ko'rinadi)
- Isbot: technology_cards.average_actual_duration + based_on_orders_count + total_duration_minutes (reja) + calculated_by_ai ustunlari bor (q.cjs) — reja vs haqiqiy yonma-yon strukturasi mavjud. Lekin data NULL va MES production_facts BO'SH (0 qator), demak haqiqiy o'rtacha hisoblanmayapti.

**07.11  🟡 qisman**  — ❓ Q11: Norma asosiy birlik — dona/soat (tezlik), tizim daqiqa/donaga o'tkazadimi?
- Siz: A) Asosiy dona/soat (tezlik), tizim kerak bo'lsa daqiqa/donaga o'tkazadi
- Isbot: pp_routing_operations.run_time_per_unit_min daqiqa/dona (vaqt normasi) shaklida saqlanadi, work_centers.capacity_per_hour (dona/soat) ham bor. CRP daqiqada hisoblaydi (requiredMins/60). Ikkala shakl mavjud lekin yagona kanonik tanlov kodda aniq belgilanmagan; capacity_per_hour NULL.

**07.12  ✅ bor**  — ❓ Q12: Norma tiraj kattaligiga bog'liq (setup alohida → kichik tiraj sekinroq)?
- Siz: A) Setup alohida + barqaror ishlash normasi — kichik tiraj avtomatik sekinroq chiqadi
- Isbot: CRP formulasi setup_time_min (partiyaga bir marta) + run_time×qty (pp-crp.service.ts:183-185) — kichik tirajda setup ulushi avtomatik katta bo'lib dona/soat samarasi pasayadi. Pog'onali jadval (variant B) yo'q lekin egasi A ni tanlagan = bor.

**07.13  ❌ yo'q**  — ❓ Q13: Norma material/rang/laminatsiya kombinatsiyasiga bog'liqmi?
- Siz: A) Norma operatsiya + asosiy parametr (rang soni/flute/laminatsiya) kombinatsiyasiga bog'lanadi
- Isbot: pp_routing_operations normasi faqat work_center_id + product_id ga bog'langan; rang-soni/flute/laminatsiya bo'yicha norma-variatsiya ustuni yoki jadvali YO'Q (q.cjs). Norma parametrga qarab o'zgarmaydi — faqat operatsiyaga.

**07.14  🟡 qisman**  — ❓ Q14: Norma bajarilishi % har smena hisoblanib KPIga kiradimi?
- Siz: A) Har smena norma % hisoblanadi, KPIga kiradi; bonus/jarima alohida
- Isbot: production_facts.bajarilgan_list_soni + brak + operator1/2/3 ustunlari (norma-% xom data) bor, MEMORY HR razryad-koeff payroll bog'langan deydi. AMMO production_facts 0 qator (q.cjs) — norma-% jonli hisoblanmayapti; PP'da reja-fakt o'qiydigan kod topilmadi (grep: production_facts reader=0).

**07.15  🟡 qisman**  — ❓ Q15: Stanok kartasi — kod/nom/tur/bo'lim/quvvat/soatlik-xarajat/holat to'liqmi?
- Siz: A) To'liq karta + ishga tushgan yili, ishlab chiqaruvchi, format chegarasi
- Isbot: work_centers 12 REAL qator: code/name/type/capacity/department_id/cost_per_hour/hours_per_day/is_active bor (q.cjs sample). AMMO 'holat (ishlaydi/ta'mirda/bo'sh)' ustuni, ishga-tushgan-yili, ishlab-chiqaruvchi, format-chegara YO'Q. Asosiy karta bor, kengaytma yo'q.

**07.16  ✅ bor**  — ❓ Q16: Stanok quvvati = mavjud ish soati (smena×soat), tezlik normadan keladimi?
- Siz: A) Quvvat = mavjud ish soati, aniq dona-tezlik har mahsulot normasidan
- Isbot: work_centers.hours_per_day(8.00) × capacity(machines) CRP availHours = machines×hours×days×efficiency (pp-crp.service.ts:173); dona-tezlik operatsiya normasidan (run_time). Egasi A modeli to'liq qurilgan.

**07.17  🟡 qisman**  — ❓ Q17: Stanok ishlash jadvali (smena/soat, hafta kunlari, bayram)?
- Siz: A) Har stanokka ish kalendari: hafta kunlari + smenalar + soat; bayram hisobga olinadi
- Isbot: work_centers.hours_per_day bor, erp_shift_calendars jadvali mavjud (q.cjs), CRP 5-ish-kun/hafta qat'iy (CRP_WORKING_DAYS_PER_WEEK=5, pp-crp.service.ts:81). Lekin har-stanokka individual kalendar + bayram/dam-olish bog'lanmagan — yagona zavod model (variant B ga yaqin).

**07.18  🟡 qisman**  — ❓ Q18: Stanok rejali to'xtash (PM/ta'mir) kalendarga kiritiladimi?
- Siz: A) Rejali to'xtashlar kalendarda; reja ularni bo'sh quvvatdan chiqaradi
- Isbot: equipment_maintenance + downtime_events/downtime_logs jadvallari mavjud (q.cjs), mro-stop.listener.ts PP'da bor. AMMO CRP availableHours hisobida PM-vaqt CHIQARILMAYDI (pp-crp.service.ts faqat efficiency_rate qo'llaydi, rejali-to'xtash kalendari o'qilmaydi). Reja PM ni bo'sh quvvatdan ayirmaydi.

**07.19  ❌ yo'q**  — ❓ Q19: Stanok format/o'lcham cheklovi (max/min list) saqlanadimi?
- Siz: A) Max va min format saqlanadi; reja mos kelmasa boshqa stanok taklif qiladi/ogohlantiradi
- Isbot: work_centers/pp_work_centers'da width/length/format ustuni YO'Q (q.cjs: format-limit=0). Format-mos-emaslik ogohlantirishi qurilmagan — usta o'zi qaraydi (variant B holatida).

**07.20  ✅ bor**  — ❓ Q20: Stanok OEE/samaradorlik koeffitsienti (pasport×koeff=real quvvat)?
- Siz: A) Har stanokka samaradorlik koeffitsienti (haqiqiy natijadan yangilanadi); reja qo'llaydi
- Isbot: work_centers.efficiency_rate ustuni mavjud (q.cjs); CRP availHours = ...×efficiency (default 0.85, GREATEST/LEAST clamp, pp-crp.service.ts:120,173) — eski/yangi stanok farqi qo'llanadi. Eslatma (manba 📌) hal: efficiency_rate rasman kartada. MESdan nightly yangilanish hozircha data-siz.

**07.21  ❌ yo'q**  — ❓ Q21: Parallel mashinalar — stanok guruhi (eng bo'sh mashinaga avto-berish)?
- Siz: A) Stanok guruhi: reja guruh ichida eng bo'sh mashinaga avtomatik beradi
- Isbot: work_centers'da machine_group/work_center_group ustuni YO'Q (q.cjs: 0). capacity=parallel-mashina soni sifatida CRP'da yig'ma hisoblanadi (machine_count), lekin guruh ichida 'eng bo'sh mashinaga avto-taqsimlash' logikasi qurilmagan.

**07.22  ❌ yo'q**  — ❓ Q22: Reja-fakt qaysi kesimda (buyurtma/stanok/smena/ishchi) drill-down?
- Siz: A) To'rt kesim ham: buyurtma/stanok/smena/ishchi — drill-down bilan
- Isbot: production_facts (buyurtma×operator×bo'lim kesim potensiali) 0 qator (q.cjs); PP'da reja-fakt og'ishni 4 kesimda o'qiydigan handler/servis topilmadi (grep: deviation reader=0). Drill-down mavjud emas.

**07.23  🟡 qisman**  — ❓ Q23: Reja-fakt nimani solishtiradi (miqdor/vaqt/muddat/tannarx)?
- Siz: A) To'rttasi ham: miqdor, vaqt, muddat, tannarx og'ishi alohida
- Isbot: production_orders.planned_quantity vs confirmed_quantity (miqdor), planned_cost vs actual_cost (tannarx), planned/actual_start/end (muddat) ustunlari MAVJUD (q.cjs) — solishtirish uchun xom maydon bor. AMMO og'ishni hisoblab ko'rsatadigan og'ish-dvigatel kodi yo'q; vaqt-og'ishi alohida o'lchanmaydi.

**07.24  🟡 qisman**  — ❓ Q24: Og'ish sababi kodli ro'yxatdan (stanok-buzildi/material-yetmadi/brak...)?
- Siz: A) Majburiy kodli sabab ro'yxati + 'boshqa+izoh' — og'ish bo'lsa to'ldiriladi
- Isbot: mes_downtime_reasons (7 REAL qator) + downtime_reason_codes (0 qator) jadvallari mavjud (q.cjs). Sabab-katalog bor va to'ldirilgan, AMMO bu MES-downtime uchun; reja-fakt og'ishiga majburiy bog'lash PP tomonda qurilmagan.

**07.25  ❌ yo'q**  — ❓ Q25: Og'ish chegarasi (>5% miqdor, >1 kun muddat) → avto-signal?
- Siz: A) Har ko'rsatkichga sozlanadigan chegara + chegaradan oshsa avtomatik bildirishnoma
- Isbot: PP og'ish uchun threshold-konfiguratsiya jadvali YO'Q (q.cjs: state_thresholds/abc_thresholds bor lekin company-state/ABC uchun). Sozlanadigan og'ish-chegara + avto-bildirishnoma mexanizmi qurilmagan.

**07.26  🟡 qisman**  — ❓ Q26: Reja-fakt yopish vaqti — smena oxiri majburiy hisobot + MES real vaqt?
- Siz: A) Smena oxirida majburiy usta hisoboti + iloji bo'lsa MES real vaqt — birlashadi
- Isbot: machine_status_logs 9 qator (MES real-vaqt signal mavjud), shift_handovers jadval bor lekin 0 qator (q.cjs). Smena-oxiri majburiy hisobot oqimi data-siz; real-vaqt MES qisman ishlaydi. To'liq birlashma yo'q.

**07.27  ✅ bor**  — ❓ Q27: Ustuvorlik asosiy mezon — eng yaqin muddat, teng bo'lsa mijoz darajasi?
- Siz: A) Asosiy mezon eng yaqin muddat (deadline); teng bo'lsa mijoz darajasi
- Isbot: ProductionPriorityService.compareFlexible: birlamchi deadline (a.deadline-b.deadline), keyin band-rank (production-priority.service.ts:95-107). Egasi A modeli aynan qurilgan — to'liq pure+testable kod.

**07.28  ✅ bor**  — ❓ Q28: Ustuvorlik daraja qiymatlari — 4 daraja (Shoshilinch/Yuqori/Oddiy/Past)?
- Siz: A) To'rt daraja: Shoshilinch/Yuqori/Oddiy/Past — har biriga rang
- Isbot: PoPriority enum: SHOSHILINCH/YUQORI/ODDIY/PAST + PO_PRIORITY_RANK 1-4 (production-priority.service.ts:39-52); production_orders.priority(int) ustuni jonli. 4-band model to'liq. Rang FE-tomonda alohida tekshiriladi.

**07.29  🟡 qisman**  — ❓ Q29: Ustuvorlikni kim o'zgartiradi — faqat ishlab-chiqarish boshlig'i+direktor, jurnal?
- Siz: A) Faqat ishlab chiqarish boshlig'i + direktor; har o'zgarish sabab bilan jurnalga
- Isbot: production_order_status_log jadvali mavjud (audit uchun) lekin 0 qator (q.cjs); priority o'zgartirish ustuvorlik logikasida (ZARUR flag) bor. AMMO 'faqat boshliq+direktor' rol-cheklovi va majburiy-sabab-jurnal enforcement kod-darajada tasdiqlanmadi — RBAC bog'lanishi noaniq → ishonma-tekshir qoidasi bo'yicha qisman.

**07.30  ✅ bor**  — ❓ Q30: Preemption — joriy ish tugatiladi, shoshilinch keyingi bo'sh joyga (faqat direktor uzadi)?
- Siz: A) Joriy ish tugatiladi, shoshilinchi keyingi bo'sh joyga; faqat direktor 'uz' desa uziladi
- Isbot: ProductionPriorityService no-preempt: frozen segment hech qachon interleave qilinmaydi, yangi ZARUR faqat flexible segment boshiga tushadi (production-priority.service.ts:119-131,141-162 findInsertionSlot 'never step over frozen'). 'Har buyurtma 100% yakungacha' kitob qoidasi kodga yozilgan.

**07.31  🟡 qisman**  — ❓ Q31: Umumiy (bottleneck) stanok uchun tizim avto-navbat qo'yib to'qnashuvni ko'rsatadimi?
- Siz: A) Tizim ustuvorlik+muddat bo'yicha avtomatik navbat, to'qnashuvni rahbarga ko'rsatadi
- Isbot: PpCrpService bottleneck-ni aniqlaydi (eng yuqori utilization stanok markBottleneck, pp-crp.service.ts:203-208) + ProductionPriorityService navbat tuzadi. AMMO ikki buyurtma bitta-stanok to'qnashuvini aniq aniqlab rahbarga ko'rsatish (stanok-darajali navbat) to'liq ulanmagan.

**07.32  ❌ yo'q**  — ❓ Q32: Buyurtmani partiyalarga bo'lish (split) — har partiya o'z muddati/statusi?
- Siz: A) Buyurtmani partiyalarga bo'lish mumkin; har partiya o'z muddati va statusiga ega
- Isbot: production-order.aggregate'da split/partiya-bo'lish metodi YO'Q (grep: split hitlar faqat MRP lot-sizing, order-split emas). Buyurtma yaxlit — bo'linmaydi (variant B holati). Answers doc EP-PP-063 split-delivery egasi-ruxsati bilan deydi, lekin kod yo'q.

**07.33  ✅ bor**  — ❓ Q33: Reorder point + minimal zaxira; pasaysa avto ta'minot so'rovi?
- Siz: A) Har materialga reorder point + minimal zaxira; pasaysa avtomatik ta'minot so'rovi yaratiladi
- Isbot: material_cards.reorder_point + min_stock ustunlari (q.cjs); RopTriggerHandler StockUpdatedEvent'da reorder_point'dan pastga tushsa avtomatik mm_purchase_requisitions+items yaratadi (rop-trigger.handler.ts:110-180, 24h dedup). To'liq event-driven real mexanizm.

**07.34  🟡 qisman**  — ❓ Q34: Lead time (kun) saqlanib reorder point = sarf×lead+zaxira?
- Siz: A) Har materialga lead time saqlanadi; reorder point = kunlik sarf × lead time + zaxira
- Isbot: inventory_policy.lead_time_days + product_masters.lead_time_days + mrp_results.lead_time_days ustunlari MAVJUD (q.cjs), AMMO material_cards'da lead_time YO'Q. rop-trigger reorder_point ni to'g'ridan o'qiydi (lead×sarf formula bilan dinamik qayta-hisoblamaydi). Maydon bor, formula-ulanish qisman.

**07.35  🟡 qisman**  — ❓ Q35: Buyurtma qabulida xom-ashyo/quvvat ATP-tekshiruvi → yetmasa qizil ogohlantirish?
- Siz: A) Buyurtma kiritishda avtomatik xom-ashyo va quvvat tekshiruvi (ATP) — yetmasa qizil + taxminiy sana
- Isbot: MpsAtpHandler.calculateAtp kumulyativ ATP hisoblaydi, firstNegativePeriod + canPromise qaytaradi (mps-atp.handler.ts:60-119) — REAL hisob. AMMO bu calc SD buyurtma-qabul UI'siga ulanib 'qizil ogohlantirish + taxminiy sana' beradimi tasdiqlanmadi; quvvat-ATP CRP alohida. Mexanizm bor, oqim-ulanish noaniq.

**07.36  🟡 qisman**  — ❓ Q36: Tasdiqlangan buyurtmaga material rezervlanadimi (erkin qoldiq = umumiy-rezerv)?
- Siz: A) Tasdiqlangan buyurtmaga material rezervlanadi; 'erkin qoldiq' ko'rsatiladi
- Isbot: production_material_allocs jadvali MAVJUD (rezerv strukturasi) lekin 0 qator (q.cjs); production_material_balance ham bor. Allokatsiya jadvali qurilgan, ammo real rezerv-yozish va 'erkin qoldiq=umumiy−rezerv' hisobi data-siz/ulanish tasdiqlanmadi.

**07.37  ❌ yo'q**  — ❓ Q37: Yarim tayyor (zagotovka) alohida zaxira — reja avval shuni ishlatadimi?
- Siz: A) Yarim tayyor mahsulot alohida zaxira; reja avval shuni ishlatadi, keyin xom-ashyoga o'tadi
- Isbot: Yarim-tayyor/zagotovka uchun alohida zaxira jadvali yoki reja-avval-zagotovka logikasi PP'da topilmadi. production_consumption/material_balance xom-ashyo+tayyor uchun; oraliq zagotovka-zaxira modeli qurilmagan (variant B holati).

**07.38  ❌ yo'q**  — ❓ Q38: Xom-ashyo partiyali (lot/rulon№/sana) + FIFO avto-tavsiya?
- Siz: A) Partiyali (lot) hisob + FIFO/muddat bo'yicha avto-tavsiya; muddati o'tganni bloklaydi
- Isbot: PP/MRP'da material lot/FIFO partiya-hisobi + muddat-blok logikasi topilmadi (grep PP: lot/FIFO reader yo'q). Answers doc lot traceability WMS'da deydi (EP-PP-069/070), lekin PP-reja FIFO-tavsiya bermaydi. Partiyasiz umumiy miqdor (variant B).

**07.39  ❌ yo'q**  — ❓ Q39: Reorder point mavsumiy/o'zgaruvchan sarfdan davriy qayta hisoblanadimi?
- Siz: A) Reorder point oxirgi 1-3 oy o'rtacha sarfidan davriy qayta hisoblanadi
- Isbot: reorder_point ustuni STATIK saqlanadi (rop-trigger uni to'g'ridan o'qiydi, rop-trigger.handler.ts:112-118); oxirgi-oylar-sarfidan davriy qayta-hisoblash cron/servisi YO'Q. Qo'lda belgilangan doimiy chegara (variant B).

**07.40  🟡 qisman**  — ❓ Q40: Smena rejasi — smena×stanok×buyurtma×ishchi jadvali har smena tayyor?
- Siz: A) Smena × stanok × buyurtma × ishchi jadvali (kim, qayerda, nimani) — har smena boshida tayyor
- Isbot: shift_schedules 30 REAL qator (employee_id×shift_date×shift_type×start/end, q.cjs) — ishchi×smena bor; AMMO bu HR/shift modulida (hr/shift/shift.repository.ts), stanok×buyurtma bog'lanishi yo'q. To'rt o'lchovli (stanok+buyurtma) smena-reja qurilmagan; faqat ishchi-smena.

**07.41  🟡 qisman**  — ❓ Q41: Smena turlari va vaqti (2/3 smenali + tanaffus) sozlanadimi?
- Siz: A) Sozlanadigan smena shablonlari (2/3-smenali) + tanaffus; har bo'limga moslanadi
- Isbot: shift_schedules.shift_type (morning 08-14 / afternoon 14-20 / night 22-06) REAL data bor (q.cjs) — 3-smena vaqtlari mavjud. AMMO sozlanadigan shablon + tanaffus + har-bo'limga-moslash konfiguratsiyasi tasdiqlanmadi; vaqtlar qatorda qattiq.

**07.42  ❌ yo'q**  — ❓ Q42: Smenaga ishchi qo'yilganda malaka (razryad/sertifikat) tekshiriladimi?
- Siz: A) Ishchi malakasi operatsiya talabiga solishtiriladi; mos kelmasa ogohlantirish
- Isbot: work_centers.required_skill_name/certification_lms_course_id bor (NULL), lekin smena-tayinlashda ishchi-malaka↔operatsiya-talab solishtiruvi va ogohlantirish kodi topilmadi. shift_schedules malaka-tekshiruvga ulanmagan. Tekshiruvsiz (variant B).

**07.43  ❌ yo'q**  — ❓ Q43: Ishchi yo'qligida tizim zaxira/almashtiruvchi taklif qiladimi?
- Siz: A) Yo'qlik belgilansa, tizim shu malakali bo'sh ishchini taklif qiladi (usta tasdiqlaydi)
- Isbot: shift_schedules.status ('scheduled') bor lekin yo'qlik→avto-almashtiruvchi-taklif logikasi topilmadi. Answers doc EP-PP-035 bu oqimni tavsiflaydi, ammo kod yo'q. Qo'lda — usta o'zi topadi (variant B).

**07.44  🟡 qisman**  — ❓ Q44: Smena topshirig'i (peresmenka) — elektron handover keyingi smena ko'radimi?
- Siz: A) Har smena oxirida elektron topshiriq (qoldiq, stanok holati, izoh) — keyingi smena ko'radi
- Isbot: shift_handovers + mes_shift_handovers jadvallari MAVJUD (q.cjs) — elektron-topshiriq strukturasi qurilgan, AMMO shift_handovers 0 qator. Jadval bor, real handover-data va keyingi-smena-ko'rish oqimi data-siz.

**07.45  ❌ yo'q**  — ❓ Q45: Qo'shimcha smena/sverxurochniy rejaga kiritilib koeffitsient bilan oylikka o'tadimi?
- Siz: A) Qo'shimcha smena alohida belgilanadi, koeffitsient bilan oylikka (rahbar tasdig'i bilan)
- Isbot: shift_schedules'da sverxurochniy/qo'shimcha-smena belgisi + payroll-koeffitsient bog'lanishi PP-tomonda topilmadi. MEMORY razryad-koeff payroll HR'da bor, lekin qo'shimcha-smena→oylik oqimi qurilmagan. Faqat asosiy smena (variant B).

**07.46  🟡 qisman**  — ❓ Q46: Smena oxirida avto-dashboard (norma%/brak%/prostoy/dona/eng-yomon-stanok)?
- Siz: A) Avtomatik smena dashboardi (norma%, brak%, prostoy, dona, eng yomon stanok)
- Isbot: PpCrpService 'eng yomon stanok' (bottleneck markBottleneck) beradi, production_facts.brak ustuni + machine_status_logs (prostoy) data manbai bor. AMMO smena-oxiri yagona avto-dashboard (norma%+brak%+prostoy+dona birlashtirilgan) qurilmagan; production_facts 0 qator → norma%/brak% jonli emas. Bo'laklar bor, dashboard yo'q.

**07.47  🟡 qisman**  — ❓ Norma manbai — texnolog qo'lda kiritadimi yoki tizim haqiqiy o'rtachadan hisoblaydimi (yonma-yon og'ish)?
- Siz: A) Texnolog reja-normasi kiritadi + tizim haqiqiy o'rtachani yonma-yon ko'rsatadi (kitob: dastgoh reja-fakt tahlili → norma yaxshilash). EP-PP-041
- Isbot: technology_cards: average_actual_duration + based_on_orders_count + total_duration_minutes ustunlari BOR (schema), lekin jadval 1 qator; material_norms.average_actual_consumption bor lekin 0 qator — yonma-yon mexanizm yozilmagan jonli data bilan.

**07.48  🟡 qisman**  — ❓ Norma turi — dona/soat (tezlik) yoki daqiqa/dona (vaqt)? Tizim o'tkazadimi?
- Siz: A) Asosiy — dona/soat (tezlik), tizim daqiqa/donaga o'tkazadi. EP-PP-042
- Isbot: routing_operations: run_time_per_unit_min + run_time_min + machine_time ustunlari bor (vaqt asosli model), capacity_per_hour work_centers'da bor — ikkala birlik mavjud, lekin operatsiya jadvali 0 qator (konversiya jonli sinalmagan).

**07.49  🟡 qisman**  — ❓ Norma tiraj kattaligiga bog'liqmi (kichik tiraj sekinroq)?
- Siz: A) Setup alohida + barqaror ishlash normasi → kichik tiraj avtomatik sekinroq. EP-PP-043
- Isbot: technology_cards.setup_duration_minutes + routing_operations.setup_time_min alohida BOR (setup-model schema mavjud), shu sabab kichik tiraj sekinroq chiqadi; lekin operatsiya/norma data yo'q (0 qator), formula jonli isbotlanmadi.

**07.50  🟡 qisman**  — ❓ Norma material/dizaynga (rang soni/flute/laminatsiya) bog'liqmi?
- Siz: A) Norma operatsiya + asosiy parametr kombinatsiyasiga bog'lanadi. EP-PP-044
- Isbot: technology_cards print_params + gofra_profile + post_press ustunlari bor; pp_flute_types 5 qator (take_up_factor bilan) — parametr master bor, lekin parametr↔norma bog'lanish data 0 qator.

**07.51  🟡 qisman**  — ❓ Norma bajarilishi — har smena % hisoblanib KPIga/oylikka kiradimi?
- Siz: A) Har smena norma % (fakt/reja×100) → KPI; bonus/jarima alohida. EP-PP-045
- Isbot: production_facts: plan_quantity + variance_percent + brak_percent ustunlari bor (formula schema), mes_shift_stats 6 qator OEE bilan REAL; lekin production_facts 0 qator — operator-darajali norma% data hali to'planmagan.

**07.52  🟡 qisman**  — ❓ Stanok kartasi to'liq maydonlari (kod/nom/tur/quvvat/xarajat/format-chegara/yil)?
- Siz: A) To'liq karta + ishga tushgan yili, ishlab chiqaruvchi, format chegarasi. EP-PP-046
- Isbot: work_centers 12 qator: code/name/type/capacity/cost_per_hour/efficiency_rate/min_max_crew/unit_preference BOR va to'ldirilgan; AMMO ishga-tushgan-yil/ishlab-chiqaruvchi/max-min-format ustunlari work_centers'da YO'Q (format_code faqat technology_cards'da).

**07.53  ✅ bor**  — ❓ Stanok quvvati birligi — ish soati (smena×soat) yoki dona/soat?
- Siz: A) Quvvat = mavjud ish soati; aniq dona-tezlik mahsulot normasidan. EP-PP-047
- Isbot: work_centers.hours_per_day + capacity (soat asosli) + capacity_per_hour (dona) ikkalasi bor; pp-crp.service.ts soat-asosli quvvatni efficiency bilan hisoblaydi (satr 113-169).

**07.54  ❌ yo'q**  — ❓ Stanok ish jadvali (smena/soat, har stanokka kalendar, bayram)?
- Siz: A) Har stanokka ish kalendari (hafta kunlari + smenalar + soat; bayram). EP-PP-048
- Isbot: work_center_capacity (shifts_per_day/hours_per_shift/working_days_per_week) jadvali BOR lekin 0 qator; erp_shift_calendars 0 qator — har-stanok kalendar data yo'q, bayram/dam-olish modeli yozilmagan.

**07.55  🟡 qisman**  — ❓ Stanok rejali to'xtash (PM/ta'mir) kalendarda — reja bo'sh quvvatdan chiqaradimi?
- Siz: A) Rejali to'xtashlar kalendarda; reja bo'sh quvvatdan chiqarib tashlaydi. EP-PP-049
- Isbot: equipment_maintenance + mro_equipment jadvallari bor (PM infratuzilma), lekin work_center_capacity bo'sh; CRP rejali-to'xtashni bo'sh-quvvatdan chiqarish logikasi jonli ulanmagan (PM↔CRP bog'lanmagan).

**07.56  ❌ yo'q**  — ❓ Stanok format/o'lcham cheklovi (max/min) — sig'masa boshqa stanok taklif?
- Siz: A) Max/min format saqlanadi; mos kelmasa boshqa stanok taklif/ogohlantirish. EP-PP-050
- Isbot: work_centers'da max/min format ustuni YO'Q (faqat technology_cards.format_a/format_b/format_code mavjud); format>stanok tekshiruvi va alternativ-taklif logikasi kodda topilmadi.

**07.57  ✅ bor**  — ❓ Stanok OEE/samaradorlik koeffitsienti — reja qo'llaydimi (CRP efficiency_rate muammosi)?
- Siz: A) Har stanokka samaradorlik koeffitsienti, reja qo'llaydi; ⭐ efficiency_rate stanok kartasiga rasman kiritilsin. EP-PP-051
- Isbot: work_centers.efficiency_rate 12 qator REAL to'ldirilgan (0.75/0.82/0.9/0.98); pp-crp.service.ts:120,169 GREATEST(LEAST(COALESCE(efficiency_rate,0.85),1),0.01) bilan rejaga qo'llaydi — EP-PP-051 WIRED.

**07.58  ❌ yo'q**  — ❓ Parallel mashinalar (bir turdan bir nechta) — guruh sifatida eng bo'shga beradimi?
- Siz: A) Stanok guruhi tushunchasi: reja guruh ichida eng bo'sh mashinaga avtomatik. EP-PP-052
- Isbot: work_centers'da stanok-guruh/parent ustuni yo'q; work_center_io_rules bor lekin guruh-balansi emas; eng-bo'sh-mashinaga taqsimlash logikasi CRP servisida topilmadi.

**07.59  🟡 qisman**  — ❓ Reja-fakt qaysi 4 kesimda (buyurtma/stanok/smena/ishchi) drill-down?
- Siz: A) To'rt kesim ham: buyurtma/stanok/smena/ishchi — drill-down (kitob dastgoh+operator KPI). EP-PP-053
- Isbot: production_fact: plan_line_id/product_id/work_center_id/shift/operator_id — 4 kesim ustunlari BOR (1 qator); mes_shift_stats stanok-kesim 6 qator REAL; lekin to'liq drill-down data yo'q (production_fact 1 qator).

**07.60  🟡 qisman**  — ❓ Reja-fakt nimani solishtiradi (miqdor/vaqt/muddat/tannarx)?
- Siz: A) To'rttasi: miqdor, vaqt, muddat, tannarx og'ishi alohida. EP-PP-054
- Isbot: production_fact: fact_quantity/good/scrap/rework + start_time/end_time (miqdor+vaqt og'ishi bor); production_facts.variance/variance_percent bor; AMMO muddat va tannarx og'ishi alohida ustun sifatida yo'q — 4-metrik to'liq emas.

**07.61  🟡 qisman**  — ❓ Reja-fakt og'ish sababi kodli ro'yxatdan (kitob 5-guruh)?
- Siz: A) Majburiy kodli sabab: material yo'qligi/dastgoh buzilishi/kadr yetishmasligi/texnologik xato/reja noto'g'ri (+boshqa). EP-PP-055
- Isbot: downtime_reason_codes + mes_downtime_reasons jadvallari BOR lekin downtime_reason_codes=0 qator — kitobning 5-sabab guruhi master-data SEED QILINMAGAN; production_facts.muammolar erkin matn ustuni bor (kodli emas).

**07.62  ❌ yo'q**  — ❓ Reja-fakt chegara va signal (>5% / >1 kun → bildirishnoma)?
- Siz: A) Har ko'rsatkichga sozlanadigan chegara + oshsa avtomatik bildirishnoma. EP-PP-056
- Isbot: Sozlanadigan og'ish-chegarasi jadvali/ustuni topilmadi; production_facts variance_percent hisoblanadi lekin chegara-asosli avtomatik bildirishnoma (Telegram/notification) logikasi PP'da ulanmagan.

**07.63  🟡 qisman**  — ❓ Reja-fakt yopish vaqti — smena oxiri majburiy hisobot + MES real vaqt?
- Siz: A) Smena oxirida majburiy hisobot (usta) + iloji bo'lsa MES real vaqt. EP-PP-057
- Isbot: production-shift-reports.controller.ts BOR (smena hisobot endpoint); mes_shift_stats 6 qator real; production_facts schema (operator/list/brak) bor lekin 0 qator — majburiy smena-yopish jonli ishlamayapti.

**07.64  🟡 qisman**  — ❓ Ustuvorlik asosiy mezon — eng yaqin muddat, teng bo'lsa mijoz darajasi?
- Siz: A) Eng yaqin muddat (deadline); teng bo'lsa mijoz darajasi (real Очеред+ЗАРУР). EP-PP-058
- Isbot: production_orders.priority + is_urgent ustunlari BOR; papka_orders.priority bor; sales_orders.pp_queued_at bor — ustuvorlik maydonlari mavjud, lekin deadline+mijoz-darajasi avtomatik tartiblash algoritmi (servis) jonli isbotlanmadi.

**07.65  🟡 qisman**  — ❓ Ustuvorlik daraja qiymatlari (Shoshilinch/Yuqori/Oddiy/Past + rang)?
- Siz: A) To'rt daraja: Shoshilinch/Yuqori/Oddiy/Past — har biriga rang. EP-PP-059
- Isbot: production_orders.priority + is_urgent ustunlari bor (daraja saqlash imkoni), lekin 4-darajali enum master-data va rang-mapping aniq belgilanmagan — qiymatlar standartlashtirilmagan.

**07.66  ❌ yo'q**  — ❓ Ustuvorlikni kim o'zgartira oladi (faqat i/ch boshlig'i+direktor, jurnalga)?
- Siz: A) Faqat ishlab chiqarish boshlig'i + direktor; har o'zgarish sabab bilan jurnalga (kitob: faqat rejalashtirish bo'limi+YOZMA). EP-PP-060
- Isbot: Ustuvorlik-o'zgartirish audit jurnali (kim/qachon/sabab) jadvali topilmadi; production_order_status_log=0 qator; RBAC-darajali ustuvorlik-o'zgartirish gate'i kodda ulanmagan.

**07.67  🔑 egasi-data**  — ❓ Preemption — shoshilinch boshlangan ishni uzadimi (kitob: parchalab bajarilmaydi)?
- Siz: A) Joriy ish tugatiladi, faqat direktor uzsa uziladi (kitob: har zakaz 100% tugaguncha keyingiga o'tilmaydi — preemption taqiq). EP-PP-061
- Isbot: Preemption-taqiq qoidasi kitob-policy (RD5 1531/1498) — kod-darajasida ish-uzish bloki yo'q (production_orders.status oddiy ustun); bu biznes-qoida egasi tasdiqlagan, lekin tizimda majburlovchi mexanizm qurilmagan.

**07.68  ❌ yo'q**  — ❓ Bottleneck stanok uchun avtomatik navbat va to'qnashuvni rahbarga ko'rsatish?
- Siz: A) Tizim ustuvorlik+muddat bo'yicha avtomatik navbat, to'qnashuvni rahbarga ko'rsatadi (TOC). EP-PP-062
- Isbot: Bottleneck-aniqlash/TOC logikasi pp-crp.service'da topilmadi; sales_orders.pp_queued_at bor lekin tor-joy atrofida avtomatik navbat va to'qnashuv-signali qurilmagan.

**07.69  🔑 egasi-data**  — ❓ Buyurtmani partiyalarga bo'lish (split) — kitob 'parchalab bajarilmaydi' kolliziyasi?
- Siz: A) Partiyalarga bo'lish (har partiya o'z muddati). ⚠️ AMMO kitob ish-ketma-ketligini parchalashni taqiqlaydi; split-delivery ≠ parchalash. EP-PP-063 KOLLIZIYA
- Isbot: decisions/07-pp.md EP-PP-063 ⚠️KOLLIZIYA deb belgilangan (kitob 1531 ╳ split-delivery); production_orders'da split/partiya ustuni yo'q — egasi split-delivery ╳ ish-parchalash farqini hal qilishi kerak.

**07.70  ✅ bor**  — ❓ Reorder point — har materialga qayta-buyurtma chegarasi + avtomatik so'rov?
- Siz: A) Har materialga reorder point + minimal zaxira; pasaysa avtomatik ta'minot so'rovi (kitob: keyin keladi taqiq). EP-PP-064
- Isbot: inventory_policy 31 qator reorder_point/safety_stock bilan; material_cards.reorder_point + min_stock ustunlari bor; warehouse_stock.reorder_point bor; rop-trigger.handler.ts (WMS event-handler) topildi — reorder mexanizm WIRED.

**07.71  🟡 qisman**  — ❓ Lead time — har materialga yetkazib berish muddati (kun)?
- Siz: A) Har materialga lead time; reorder = kunlik sarf×lead time + zaxira (kitob: uzoq ╳ tez keladigan material). EP-PP-065
- Isbot: inventory_policy.lead_time_days + mrp_results.lead_time_days + product_masters.lead_time_days ustunlari BOR (31 qator inventory_policy); lekin material-darajali kitob uzoq/tez toifasi (2-sinf) ajratilmagan — qiymatlar egasi-data.

**07.72  🟡 qisman**  — ❓ ATP — buyurtma kelganda xom-ashyo+quvvat yetishmasligini ko'rsatadimi?
- Siz: A) Buyurtma kiritishda avtomatik xom-ashyo+quvvat tekshiruvi (ATP), yetmasa qizil+sana. EP-PP-066
- Isbot: pp_mrp_runs/pp_mrp_run_lines (gross_req/on_hand/net_req/planned_order) jadvallari BOR lekin 0 qator; CRP servisi quvvat hisoblaydi (real) — material+quvvat ATP infratuzilma bor, lekin buyurtma-kiritish vaqtidagi sinxron tekshiruv jonli ishlamayapti.

**07.73  🔑 egasi-data**  — ❓ Reja gorizonti — sutkalik/haftalik/oylik (kitob: 1-sutkalik reja master)?
- Siz: Ikki-uch qatlam: sutkalik aniq (kitob 1120) + haftalik + oylik taxminiy (material). EP-PP-067 master gorizont
- Isbot: pp_mrp_runs.planning_horizon_days + horizon_periods ustunlari bor (gorizont-sozlash imkoni), lekin master gorizont (sutkalik ╳ haftalik ╳ oylik) qiymati EP-PP-001 bilan birga egasi tasdig'ini kutadi — decisions: ⚠️ master gorizont.

**07.74  🟡 qisman**  — ❓ Material rezervlash (allokatsiya) — tasdiqlangan buyurtmaga band qilinadimi?
- Siz: A) Tasdiqlangan buyurtmaga material rezervlanadi; erkin qoldiq = umumiy − rezerv. EP-PP-068
- Isbot: production_material_allocs + production_material_balance + ai_reservation_batches jadvallari BOR; lekin allokatsiya data va erkin-qoldiq hisobi jonli isbotlanmadi (rezerv-qoldiq logikasi WMS'da, PP-bog'lanish tasdiqlanmadi).

**07.75  🟡 qisman**  — ❓ Yarim tayyor mahsulot (zagotovka) zaxirasi — reja avval shuni ishlatadimi?
- Siz: A) Yarim tayyor alohida zaxira; reja avval shuni ishlatadi (kitob ichki-logistika WIP markaziy). EP-PP-069
- Isbot: production_material_balance + batch_lots/material_batches jadvallari bor (WIP-zaxira imkoni); lekin 'reja avval WIP ishlatadi' logikasi va alohida yarim-tayyor ombor PP'da qurilmagan — schema-darajasida.

**07.76  🟡 qisman**  — ❓ Partiyalik (lot/FIFO) hisob — muddati o'tganni bloklaydimi?
- Siz: A) Lot hisob + FIFO/muddat avtomatik tavsiya; muddati o'tganni bloklaydi (kitob: lab namlik/granmaj bloki + FIFO). EP-PP-070
- Isbot: batch_lots + material_batches + batch_lot_movements + warehouse_batches jadvallari BOR (lot infratuzilma keng); lekin FIFO-tavsiya va muddat-bloki logikasi jonli isbotlanmadi, technology_cards.lab_approved gate bor lekin partiya-bloki ulanmagan.

**07.77  ❌ yo'q**  — ❓ Mavsumiy/o'zgaruvchan sarf — reorder point o'rtacha sarfdan qayta hisoblanadimi?
- Siz: A) Reorder point oxirgi 1-3 oy o'rtacha sarfidan davriy qayta hisoblanadi. EP-PP-071
- Isbot: inventory_policy.reorder_point statik (31 qator); mrp-run-safety-stock.helper.ts bor lekin davriy o'rtacha-sarfdan reorder qayta-hisoblash CRON/logikasi topilmadi — dinamik reorder qurilmagan.

**07.78  🟡 qisman**  — ❓ Smena rejasi tuzilishi — smena×stanok×buyurtma×ishchi jadvali?
- Siz: A) Smena×stanok×buyurtma×ishchi (kim/qayerda/nimani) har smena boshida tayyor (kitob soatlik reja). EP-PP-072
- Isbot: shift_schedules 30 qator + shift_assignments 30 qator BOR, lekin shift_assignments kalit ustunlari (employee_id/shift_type_id/assignment_date) NULL; stanok×buyurtma to'liq biriktiruvi (4-o'lcham) jonli ulanmagan.

**07.79  🟡 qisman**  — ❓ Smena rejasi — operator + yordamchi (2 rol) biriktirish?
- Siz: A) Har slotga operator + yordamchi (ikki alohida rol); fakt/norma ikkisiga hisoblanadi (real Оператор/Помошник). EP-PP-073
- Isbot: machine_crews jadvali master_id/polmaster_id/shogird_id/rokler_id (ko'p-rol) + role ustuni BOR (2 qator), production_facts operator1-4 ustunlari bor; AMMO machine_crews qatorlarida role/work_center_id NULL, master_id=0 — data bo'sh.

**07.80  ✅ bor**  — ❓ Smena turlari va vaqti — sozlanadigan shablon (2/3-smenali) + tanaffus?
- Siz: A) Sozlanadigan smena shablonlari (2/3-smenali) + tanaffus; har bo'limga moslanadi (real ден/ноч). EP-PP-074
- Isbot: shift_types 3 qator REAL: code/name_uz/start_time/end_time/duration_hours/is_overnight/overtime_multiplier bilan — smena shablon master-data to'ldirilgan (ден/ноч + tungi belgisi).

**07.81  🟡 qisman**  — ❓ Smena rejasi — ishchini bog'lash + malaka (razryad) tekshiruvi?
- Siz: A) Ishchi malakasi operatsiya talabiga solishtiriladi; mos kelmasa ogohlantirish. EP-PP-075
- Isbot: work_centers.required_skill_name + certification_lms_course_id BOR; routing_operations'da operatsiya-razryad talabi imkoni bor; AMMO ishchi-malaka↔operatsiya solishtirish va ogohlantirish logikasi smena-servisida jonli isbotlanmadi.

**07.82  🟡 qisman**  — ❓ Smena rejasi — yo'qlik va o'rin almashish (zaxira ishchi taklifi)?
- Siz: A) Yo'qlik belgilansa, tizim shu malakali bo'sh ishchini taklif qiladi (usta tasdiqlaydi). EP-PP-076
- Isbot: shift_swap_requests jadvali keng (requesting/target employee, status, approved) BOR lekin 0 qator; malakali-bo'sh-ishchi avtomatik taklif logikasi qurilmagan — qo'lda swap-so'rov schema bor, avtomatik almashtirish yo'q.

**07.83  🟡 qisman**  — ❓ Smena topshirig'i (peresmenka) — elektron topshiriq keyingi smenaga?
- Siz: A) Har smena oxirida elektron topshiriq (qoldiq/stanok holati/izoh) — keyingi smena ko'radi (real Остал.сд-ть). EP-PP-077
- Isbot: shift_handovers jadvali boy (machine_status/pending_tasks/quality_issues/material_status/from-to_shift) BOR lekin 0 qator; mes_shift_handovers VIEW bor — schema to'liq, jonli topshiriq data yo'q.

**07.84  🟡 qisman**  — ❓ Ortiqcha ish (qo'shimcha smena/sverxurochniy) — koeffitsient bilan oylikka?
- Siz: A) Qo'shimcha smena alohida belgilanadi, koeffitsient bilan oylikka (rahbar tasdig'i). EP-PP-078
- Isbot: shift_types.overtime_multiplier ustuni BOR (3 qator, koeffitsient saqlash imkoni); lekin qo'shimcha-smena alohida belgilash + rahbar-tasdiq + payroll-ulanish jonli qurilmagan.

**07.85  🟡 qisman**  — ❓ Smena kunlik nazorat ko'rsatkichi (norma%/brak%/prostoy/dona/eng yomon stanok)?
- Siz: A) Avtomatik smena dashboardi (norma%, brak%, prostoy, dona, eng yomon stanok). EP-PP-079
- Isbot: mes_shift_stats 6 qator REAL (produced_qty/defect_qty/downtime_min/oee); mes-shifts-stats.service.ts + controller bor — brak%/prostoy/oee hisoblanadi; AMMO to'liq smena-dashboard (eng yomon stanok + norma%) yagona ekranda jonli isbotlanmadi.

**07.86  ❌ yo'q**  — ❓ Qayta rejalash — avtomatik kunlik (kechasi) + shoshilinch qo'lda tugma?
- Siz: A) Avtomatik kunlik qayta rejalash (kechasi) + shoshilinch qo'lda tugma (kitob sutkalik+YOZMA). EP-PP-080
- Isbot: Kunlik qayta-rejalash CRON (pp.plan.dailyReplan) topilmadi; ai_production_plans/erp_production_plans jadvallari bor lekin avtomatik kechki qayta-rejalash scheduler ulanmagan.

**07.87  ❌ yo'q**  — ❓ Reja qotirish (frozen window) — yaqin N kun avtomatik tegmaydimi?
- Siz: A) Yaqin 1-2 kun qotirilgan — faqat qo'lda+YOZMA o'zgartiriladi (kitob: og'zaki o'zgartirish taqiq). EP-PP-081
- Isbot: Frozen-window (qotirilgan-zona) ustuni yoki logikasi production_orders/plan jadvallarida topilmadi; yaqin-kun himoyasi qurilmagan — faqat policy-darajasida (decisions ✅ deb belgilangan, kod yo'q).

**07.88  🟡 qisman**  — ❓ Buyurtma statuslari hayotiy sikli (Reja→...→Yopildi+Bekor) + har o'tish jurnal?
- Siz: A) To'liq status sikli + har o'tish kim/qachon jurnal (real boshlanmagan/jarayonda/tayyorlik%). EP-PP-082
- Isbot: production_orders.status ustuni BOR + production_order_status_log jadvali BOR (kim/qachon jurnal imkoni) lekin 0 qator; production_status_history bor — schema bor, status-o'tish jurnali data bo'sh; to'liq 8-status enum standartlashtirilmagan.

**07.89  ❌ yo'q**  — ❓ Buyurtmani bekor qilish — sarflangan material yo'qotish, WIP zaxiraga, sabab majburiy?
- Siz: A) Sarflangan material/ish yo'qotish, yarim tayyor ombor zaxirasiga; sabab majburiy. EP-PP-083
- Isbot: production_orders.status bekor qiymatini saqlay oladi, lekin bekor→material-yo'qotish + WIP-ombor + majburiy-sabab + FIN(yo'qotish) zanjiri logikasi PP'da qurilmagan; cancel-handler topilmadi.

**07.90  ❌ yo'q**  — ❓ Buyurtma birlashtirish (gang run) — mos buyurtmalar bitta bosma topshiriqqa?
- Siz: A) Mos buyurtmalarni bitta bosma topshiriqqa birlashtirish (keyin alohida ajraladi). EP-PP-084
- Isbot: Gang-run/birlashtirish jadvali yoki ustuni topilmadi (gang* jadval yo'q); o'xshash-buyurtma guruhlash logikasi PP/AI servisida qurilmagan — faqat kelajak vizyon (EP-PP-130 AI rang-guruh bilan bog'liq).

**07.91  🟡 qisman**  — ❓ Очеред (navbat raqami) — har stanok ichida ko'rinadigan navbat o'rni + drag-drop?
- Siz: A) Har stanok uchun ko'rinadigan navbat raqami (1,2,3), drag-drop bilan qayta tartiblanadi (real Очеред/Очеред2). EP-PP-085
- Isbot: machine_tasks jadvali bor + sales_orders.pp_queued_at + production_orders.priority — navbat saqlash imkoni bor; AMMO har-stanok ko'rinadigan navbat-raqami (sequence) ustuni va drag-drop UI jonli isbotlanmadi.

**07.92  ❌ yo'q**  — ❓ Algoritm turi (2-8 bo'lim) — marshrutdan murakkablik sinfi avtomatik?
- Siz: A) Tizim marshrutdan bo'lim sonini avtomatik chiqaradi va algoritm turi (2-8) sifatida belgilaydi. EP-PP-086
- Isbot: technology_cards.operations + ish_tartibi ustunlari bor (marshrut saqlanadi), lekin bo'lim-sonidan algoritm-turi (2-8 sinf) avtomatik hisoblash ustuni/logikasi topilmadi — tasnif qurilmagan.

**07.93  🟡 qisman**  — ❓ Yo'nalish (ofs-kar/ofs-gof/flx-gof) — buyurtma ochilishida master tanlov?
- Siz: A) Yo'nalish buyurtma ochilishida tanlanadi; marshrut/narx/material shunga to'ladi — bitta master tanlov. EP-PP-087
- Isbot: technology_cards.direction ustuni BOR (yo'nalish saqlaydi); lekin 1 qator va yo'nalish→marshrut/narx/material avtomatik to'ldirish logikasi jonli isbotlanmadi — ustun bor, master-tanlov mexanizmi yo'q.

**07.94  🟡 qisman**  — ❓ Кашировка (2-qatlam yopishtirish) — faqat ofset-gofra yo'nalishida avtomatik bosqich?
- Siz: A) Koshirofka marshrutda alohida bosqich, faqat ofset-gofra yo'nalishida avtomatik qo'shiladi. EP-PP-088
- Isbot: technology_cards.post_press + direction ustunlari bor (koshirofka-bosqich + yo'nalish saqlash imkoni); work_centers'da Koshirofka stanok turi bor; AMMO yo'nalishga-qarab avtomatik bosqich qo'shish logikasi qurilmagan.

**07.95  🟡 qisman**  — ❓ Используемые материалы — texkarta BOM strukturasi (kod+miqdor+qatlam)?
- Siz: A) Texkartada BOM jadvali: material kodi+miqdor(kg/list)+qatlam — MRP/ATP shundan o'qiydi. EP-PP-089
- Isbot: tech_card_bom jadvali REAL strukturali (technology_card_id/material_code/quantity/unit/layer) + pp/bom/bom.service.ts BOR lekin tech_card_bom=0 qator — BOM schema to'liq, data yo'q, MRP shundan o'qish jonli sinalmagan.

**07.96  ✅ bor**  — ❓ Texkarta 6 element — kitob strukturasi (material/bosma-param/kesim/qolip/qo'shimcha/ish-tartibi)?
- Siz: A) Texkarta sarlavhalari kitob bilan bayt-ma-bayt 6 element — egasi tilida. EP-PP-090
- Isbot: technology_cards: material_type + print_params + kesim + qolip_id + post_press + ish_tartibi ustunlari TO'LIQ BOR — kitob RD5 6-elementi bayt-ma-bayt schema'da aks etgan (faqat data 1 qator).

**07.97  🟡 qisman**  — ❓ Texkartani lab tasdiqlasinmi (kompozitsiya/granmaj) — reja gate?
- Siz: A) Texkartada lab tasdig'i majburiy gate — tasdiqsiz reja ishga tushmaydi; partiya namlik/granmaj meyordan tashqari → bloklanadi (kitob Одобрена muhri). EP-PP-091
- Isbot: technology_cards.lab_approved + lab_approved_by + lab_approved_at ustunlari REAL BOR; technology-grammage.service.ts (granmaj) topildi — lab-gate schema+servis bor; AMMO tasdiqsiz-reja-bloklash gate'i jonli majburlanishi (1 qator) isbotlanmadi.

**07.98  🟡 qisman**  — ❓ План/Факт выработка/Остал.сд-ть/Брак — smena 4 raqam kiritish?
- Siz: A) Har smena yopilishida 4 raqam (reja/fakt/qolgan/brak) — yoki MES avtomatik. EP-PP-092
- Isbot: production_facts: plan_quantity/bajarilgan_list_soni/brak + variance ustunlari (3 raqam) BOR lekin 0 qator; mes_shift_stats produced/defect 6 qator REAL; 'qolgan' (Остал) alohida ustun production_facts'da yo'q — 4-raqam to'liq emas, data bo'sh.

**07.99  ❌ yo'q**  — ❓ Brak chiqqanda 'yetishmovchilik = buyurtma − (fakt − brak)' avtomatik hisoblanib, qayta-chiqarish vazifasi rejaga avtomatik qo'shilsinmi (asl buyurtmaga bog'liq)?
- Siz: A) Brak kiritilganda yetishmovchilik hisoblanadi; >0 bo'lsa qayta-chiqarish vazifasi rejaga AVTOMATIK qo'shiladi. Kitob: brak → butun partiya qayta ishlash + reja buzilishi (EP-PP-093).
- Isbot: production_sessions da defect_quantity/defect_qty bor (4-raqamdan brak ushlanadi), lekin grep reproduce|qayta.?chiqar|rework_order apps/api/src/modules/pp+mes = 0 natija; yetishmovchilikdan avtomatik rework-order yaratuvchi logika yo'q.

**07.100  🟡 qisman**  — ❓ Texkartada list formati + '1 listdan N dona' bo'lib, tizim list sonini avtomatik (tiraj÷N + brak zaxira) hisoblasinmi (raskroy)?
- Siz: A) Texkartada raskroy_per_list; list soni avtomatik hisoblanadi — material/vaqt aniq (EP-PP-094).
- Isbot: technology_cards.raskroy_per_list + scrap_pct ustunlari MAVJUD (q.cjs columns) va createCard/updateCard yozadi (technology.repository.ts:206); lekin tiraj÷N+zaxira avtomatik list-soni HISOBLOVCHI servis topilmadi — ustun bor, hisob-mexanizm yo'q.

**07.101  ❌ yo'q**  — ❓ AI razmer optimizatsiyasini (eski→yangi o'lcham, listdan ko'proq dona, foyda kg/dona) tavsiya qilsinmi, texnolog tasdiqlasinmi?
- Siz: A) AI raskroy optimizatsiyasini tavsiya qiladi (o'lcham×list×dona×foyda) — zavodning real foyda usuli (EP-PP-095).
- Isbot: POST /technology/cards/:id/optimize → return notImplemented('POST /technology/cards/:id/optimize') (technology.controller.ts:191-192). Stub, ishlamaydi.

**07.102  ❌ yo'q**  — ❓ Tizim min tiraj/o'lcham chegarasini bilib, undan past buyurtmani 'kichik' deb belgilab, foyda dona/kg ko'rsatib Savdoga ogohlantirsinmi?
- Siz: A) Min tiraj/o'lcham chegarasi; pastdagi 'kichik' + foyda dona/kg ko'rsatiladi (Kichik buyurtmalar.xlsx, M.Nosirov tahlili — EP-PP-096).
- Isbot: grep small.?order|kichik.buyurtma|foyda.dona|profit.per apps/api/src = 0; min-tiraj chegara/ogohlantirish logikasi yo'q. Egasi-data: chegara qiymati.

**07.103  🟡 qisman**  — ❓ 'ЗАРУР ЗАКАЗЛАР' alohida bayroq + dashboard bloki bo'lib, zarur buyurtma har stanok navbati boshiga chiqsinmi, kim/qachon belgilagani jurnalda?
- Siz: A) 'Zarur' bayrog'i + alohida blok; navbat boshiga; jurnal (25-04.xlsx ЗАРУР ЗАКАЗЛАР — EP-PP-097).
- Isbot: production_orders.is_urgent ustuni bor; queue handler is_urgent ni ZARUR sifatida birinchi qatlamda saralaydi (get-production-queue.handler.ts:54,72 + production-priority.service ZARUR→deadline→band); lekin alohida 'zarur dashboard bloki' + kim/qachon jurnali topilmadi.

**07.104  ❌ yo'q**  — ❓ Har buyurtma menejerga bog'lanib, tayyorlik/kechikish o'zgarishida menejerga avtomatik xabar (u mijozga aytadi) ketsinmi?
- Siz: A) Buyurtma↔menejer; kechikishda avtomatik xabar — zanjir to'liq (25-04.xlsx Менеджер — EP-PP-098).
- Isbot: production_orders.responsible_manager_id ustuni bor LEKIN q.cjs: 0/7 NULL (hech biri bog'lanmagan); grep managerNotify|menejer.xabar = 0. Bog'lash ham, xabar zanjiri ham yo'q.

**07.105  🟡 qisman**  — ❓ 'Buyurtma tayyorligi %' = bajarilgan bo'limlar ÷ jami bo'limlar (5 dan 3 = 60%) sifatida hisoblanib ko'rsatilsinmi?
- Siz: A) Tayyorlik % = bajarilgan bo'limlar ÷ jami bo'limlar — sodda, ko'rinarli (Bandlik.xlsx — EP-PP-099).
- Isbot: production_orders.progress ustuni bor (q.cjs), lekin uni bo'lim-bo'yicha (operatsiya done/total) hisoblovchi formula/servis topilmadi (grep readinessPct|bo.lim.soni=0); ustun bor, hisob mexanizmi yo'q.

**07.106  ❌ yo'q**  — ❓ Tizim 3 taymerni avtomatik hisoblasinmi: ketgan kun / qolgan kun / boshlanmagan kun (dashboard)?
- Siz: A) 3 taymer avtomatik (ketgan/qolgan/boshlanmagan kun) — planlovchining kunlik asosiy raqamlari (Bandlik/ketgan kun.xlsx — EP-PP-100).
- Isbot: production_orders da planned_start/end + actual_start/end ustunlari bor (xom material), lekin grep ketgan.kun|qolgan.kun|boshlanmagan = 0; 3-taymer hisoblovchi/dashboard logika yo'q (hozir Excelda).

**07.107  ❌ yo'q**  — ❓ 'Kutish' zonasi: boshlanmagan buyurtmalar + sabab (material/maket/qolip/tasdiq kutilmoqda) ko'rsatilsinmi?
- Siz: A) Kutish zonasi sabab bilan — planlovchi nimani kutayotganini ko'radi (ketgan kun.xlsx — EP-PP-101).
- Isbot: grep waitingZone|kutish.zona|boshlanmagan apps/api/src=0; sabab-kodli kutish zonasi qurilmagan.

**07.108  🟡 qisman**  — ❓ Priladka vaqti rang soniga bog'liq formula (har rang +X daqiqa) bo'lib, 'umumiy pragon' va 'bo'lim pragoni' alohida ko'rsatilsinmi?
- Siz: A) Priladka rang-bog'liq formula; pragon alohida (ketgan kun Priladka + Bandlik pragon — EP-PP-102).
- Isbot: tech_card_routes.setup_minutes ustuni bor (statik setup) + AI-planning rang-guruh QOIDA sifatida yoziladi (pp-ai-planning.service.ts:271); lekin rang-soni×daqiqa FORMULA va pragon ajratish yo'q.

**07.109  🟡 qisman**  — ❓ Tizim avtomatik papka № bersinmi (2024-0499: yil-ketma-ket), eski qidiruvga mos arxivlasinmi?
- Siz: A) Avtomatik yil-ketma-ket papka № (xodimlar shu bilan qidiradi — barcha Excel Papka № — EP-PP-103).
- Isbot: papka_orders.papka_no ustuni MAVJUD (q.cjs), card_folders jadvali ham bor LEKIN card_folders=0 qator; yil-ketma-ket avtomatik generator (2024-NNNN format) logika topilmadi.

**07.110  ❌ yo'q**  — ❓ Takror buyurtma katalogdan eski texkartani chaqirsinmi (yangidan tuzmasdan), faqat tiraj/muddat yangilanib?
- Siz: A) Takror buyurtma katalogdan eski texkartani chaqiradi — tez, bir xil sifat (Multi cake/PANDA takror nomlar — EP-PP-104).
- Isbot: grep repeat.*order|takror.buyurtma|povtor apps/api/src=0; technology_cards versiya saqlaydi (tech_card_versions=1) lekin takror-buyurtmada eski kartani chaqirib qayta ishlatish flow'i yo'q.

**07.111  ❌ yo'q**  — ❓ Bog'liq qismlar (A/B tomon, usti/tagi/paddon) 'to'plam' sifatida bog'lanib, 'to'liq to'plam' gate qadoqdan oldin qo'yilsinmi, biri qolsa ogohlantirsinmi?
- Siz: A) Qismlar to'plam; 'to'liq to'plam' gate; biri qolsa ogohlantirish (A/B tomon, usti/tagi doimiy — EP-PP-105).
- Isbot: grep partSet|to.plam.gate|A.tomon apps/api/src=0; ko'p-qismli mahsulot to'plam-gate modeli yo'q.

**07.112  ❌ yo'q**  — ❓ Takror mahsulotda AI o'tgan fakt vaqtini (o'rtacha+diapazon) yangi rejaga tavsiya qilsinmi (tajriba-asosli ATP)?
- Siz: A) AI o'tgan-yil fakt vaqtini yangi ATP-muddatiga tavsiya qiladi (Excel 2023/2024 tarix — EP-PP-106).
- Isbot: technology_cards.average_actual_duration + based_on_orders_count ustunlari bor (potensial), lekin pp-mps.service da history|o.tgan|previous.fact grep=0; takror mahsulot tarix-asosli ATP tavsiyasi yo'q.

**07.113  🟡 qisman**  — ❓ Navbat kun + smena (ден/ноч) darajasida bo'lib, har stanok kuniga 2 slot (tungi quvvat ko'rinadi) bo'lsinmi?
- Siz: A) Navbat kun+smena (ден/ноч); kuniga 2 slot — aniq yuklama (25-04.xlsx ден/ноч — EP-PP-107).
- Isbot: erp_shift_calendars + shift_assignments jadvallari mavjud (q.cjs); ден/ноч 2-smena master sifatida belgilangan (decision EP-PP-074/107) lekin navbatni kun×ден/ноч 2-slot darajasida ajratuvchi CRP logika queue handlerда yo'q (faqat order-darajasi).

**07.114  🟡 qisman**  — ❓ Sex tableti operatsiya boshlash/tugatish tugmasi (Начат/Завершит timestamp avtomatik) bo'lib, norma faktdan o'lchalsinmi?
- Siz: A) Start/stop tugma timestamp avtomatik; norma faktdan (25-04.xlsx Начат/Завершит — EP-PP-108).
- Isbot: production_order_operations.started_at + completed_at + actual_duration ustunlari MAVJUD (q.cjs columns) — model tayyor; LEKIN production_order_operations=0 qator va sex-tablet start/stop endpoint'i bu jadvalga yozishini tasdiqlovchi tugmа-flow topilmadi; struktura bor, jonli ulanish ko'rinmadi.

**07.115  🔑 egasi-data**  — ❓ Kod lug'ati master-data (KT/PT/E/GL prefiks → ma'no) bo'lib, buyurtmada strukturalangan, qidiriladigan bo'lsinmi?
- Siz: A) Kod lug'ati master-data; qidiriladi/filtrlanadi. Sub: egasi KT/PT/E/GL ma'nosini tushuntiradi (EP-PP-109).
- Isbot: grep code.dictionary|kod.lug apps/api/src=0; lug'at jadvali yo'q. Egasi KT=?/PT=?/E=etiketka?/GL=gofra list? ni aniqlashi shart (manba sub-savol).

**07.116  🟡 qisman**  — ❓ Reja-fakt 3 kesim (kun/hafta/oy) bo'lib, hafta = asosiy boshqaruv kesimi (hafta qolgan/bajargan)?
- Siz: A) 3 kesim; hafta asosiy (ketgan kun Hafta qolgan/ishlab chiqargan — EP-PP-110).
- Isbot: weeklyReport REAL: production.repository.ts:105 DATE_TRUNC('week',started_at) GROUP BY week_start (total_shifts/output/hours/closed). Haftalik AGGREGAT bor, lekin 'hafta qolgan' (reja−fakt qoldiq) ko'rsatkichi va kun/hafta/oy uchta-kesim drill-down to'liq emas.

**07.117  🟡 qisman**  — ❓ Marshrutda 'asosiy bosqich' (bosma) belgilanib, asosiy vs umumiy ketgan/qolgan vaqt alohida ko'rsatilsinmi (qaerda qotgani)?
- Siz: A) Marshrutda is_core (asosiy bosqich); asosiy vs umumiy vaqt alohida (ketgan kun Asosiy i/ch — EP-PP-111).
- Isbot: tech_card_routes.is_core ustuni MAVJUD (q.cjs columns) — marshrut bosqichini asosiy deb belgilash mumkin; LEKIN tech_card_routes=0 qator va asosiy-vs-umumiy vaqtni alohida hisoblovchi/ko'rsatuvchi logika topilmadi. Ustun bor, hisob yo'q.

**07.118  ❌ yo'q**  — ❓ Oynakcha bosqichi = PVX material (o'lcham) + qo'l-mehnat normasi sifatida texkartada belgilansinmi?
- Siz: A) Oynakcha = PVX material + qo'l-mehnat normasi (Bandlik/25-04 Окошка — EP-PP-112).
- Isbot: grep oynakcha|okoshka|pvx.window apps/api/src=0; oynakcha PVX-material+norma alohida bosqich modeli yo'q (post_press jsonb'ga sig'ishi mumkin, lekin strukturalangan emas).

**07.119  ❌ yo'q**  — ❓ Pardoz turi texkartada tanlanib (laminat/oddiy-lak/vib-lak/yo'q), har biriga alohida norma + material bo'lsinmi?
- Siz: A) Pardoz turi tanlanadi, har biriga alohida norma+material (Iyun ishchilar Norma oddiy lak/Vib lak — EP-PP-113).
- Isbot: grep finishType|vib.lak|laminat.norma apps/api/src=0; 3-pardoz-turi (laminat/oddiy/viborochniy) alohida norma+material jadvali/maydoni yo'q.

**07.120  ❌ yo'q**  — ❓ Qadoq turi texkartada 10+ turdan tanlanib, har biriga alohida norma bo'lsinmi (Karobka/Oynakcha/Paddon/Avtokley/Tigel/Etiketka qadoqlash...)?
- Siz: A) Qadoq turi 10+ turdan tanlanadi, har biriga norma (Iyun ishchilar — EP-PP-114).
- Isbot: grep packType|qadoq.tur apps/api/src=0; 10+ qadoq-turi master + alohida norma modeli yo'q.

**07.121  🟡 qisman**  — ❓ Texkartada qolip ID + holati (bor/buyurtma-berilgan/yo'q) bo'lib, qolip yo'q → reja 'qolip kutilmoqda' gate, qolip vaqti muddatga qo'shilsinmi?
- Siz: A) Qolip ID+holat; qolip-yo'q→gate; vaqt muddatga qo'shiladi. Kitob texkarta 'қолип' elementi (EP-PP-115).
- Isbot: technology_cards.qolip_id ustuni MAVJUD (q.cjs) + createCard yozadi (technology.repository.ts:206); ow_molds jadvali ham bor. LEKIN qolip-holati (bor/buyurtma/yo'q) ENUM va 'qolip kutilmoqda' gate logikasi yo'q — faqat ID-FK.

**07.122  🟡 qisman**  — ❓ Texkartada gofra profili master ro'yxatdan (mikro/makro + sloy soni + ГК profil) tanlanib, material+stanok bog'lansinmi (aralashtirish oldini olish)?
- Siz: A) Gofra profili master; material+stanok bog'lanadi. Kitob 5-qavat╳3-qavat aralashtirish muammosi (EP-PP-116).
- Isbot: pp_flute_types jadvali = 5 qator SEED (q.cjs) + technology_cards.gofra_profile ustuni + FE TechCardsMaster gofraProfile input (TechCardsMaster.tsx:217 'E/B/C'). Profil master bor, LEKIN material+stanok-ga bog'lash va aralashtirish-bloki logika yo'q.

**07.123  🟡 qisman**  — ❓ Format kodlari (105/105ф/72) stanok formatiga (SM 72/52) bog'lanib, reja format>stanok bo'lsa o'sha stanokni taklif qilmasinmi (fizik xato oldini olish)?
- Siz: A) Format kod↔stanok format moslik; sig'masa taklif qilmaydi (25-04 105/72 ╳ Bandlik SM72/52 — EP-PP-117).
- Isbot: technology_cards.format_code + format_a/format_b ustunlari MAVJUD + FE input (TechCardsMaster.tsx:208 '105'); pp_work_centers=12 stanok bor. LEKIN format>stanok moslik-tekshiruvi (sig'maslik → boshqa stanok taklif) logikasi topilmadi.

**07.124  ❌ yo'q**  — ❓ Buyurtma = ko'p pozitsiya (line-items) bo'lib, har pozitsiya o'z marshruti/tiraji, 'buyurtma to'liq' = hamma pozitsiya tayyor bo'lsinmi?
- Siz: A) Buyurtma=multi-line; har pozitsiya o'z marshruti; to'liq=hammasi tayyor (Swissagro A+B, Haley A+B+daftar — EP-PP-118).
- Isbot: production_orders 1 mahsulot=1 buyurtma (product_id/product_name skalyar, q.cjs); grep multiLine|line.item apps/api/src/modules/pp=0. PP-da multi-pozitsiya buyurtma tuzilmasi yo'q.

**07.125  ❌ yo'q**  — ❓ Marshrut boshiga 'material tayyorlash', oxiriga 'yetkazib berish' bosqichlari (vaqt normasi bilan) qo'shilsinmi (to'liq muddat)?
- Siz: A) Marshrutga material-tayyorlash + yetkazib-berish bosqichlari (Bandlik bo'limlari — EP-PP-119).
- Isbot: grep material.tayyorl|prepDeliver|delivery.stage apps/api/src/modules/pp=0; marshrut faqat sex operatsiyalari (tech_card_routes), tashqi bosqichlar yo'q.

**07.126  🟡 qisman**  — ❓ 'Bandlik' dashboard: har bo'lim/stanok band % + navbat soni + bo'sh slot (rangli) — vizual yuklama bo'lsinmi?
- Siz: A) Bandlik dashboard (band%/navbat/bo'sh slot rangli). Real Bandlik.xlsx=yuklanganlik (EP-PP-120).
- Isbot: pp-crp.service REAL: utilizationPct + isBottleneck har work-center bo'yicha (pp-crp.service.ts:104,203 markBottleneck) + machine-load.handler bor. Band% hisoblanadi; LEKIN to'liq 'Bandlik' vizual dashboard (navbat soni + bo'sh slot rangli) FE topilmadi.

**07.127  🟡 qisman**  — ❓ Stanok master-data 22+ stanokni aniq nom + tur (flekso/ofset/post-press) + format + quvvat bilan kiritsinmi (egasi ro'yxati)?
- Siz: A) 22+ stanok master (Flexo/Gofra mikro/Bosma SM72-52/Laminatsiya/Koshirofka/GTO/Begovka/Tisnenie/Kongrev/Avto Kley/Qadoq/Oynakcha — EP-PP-121).
- Isbot: pp_work_centers=12 qator (q.cjs) — model+CRUD bor (create-work-center.command) LEKIN egasining real 22+ stanog'i (Begovka/Tisnenie/Kongrev/Koshirofka/Oynakcha...) to'liq kiritilmagan: 12<22+. Master to'liqsiz.

**07.128  🟡 qisman**  — ❓ Texkartada post-press checkbox (begovka/tisnenie/kongrev/oynakcha/laminat/lak/vib-lak) — kerakligi belgilanib, marshrutga qo'shilsinmi (reja shishmaydi)?
- Siz: A) Post-press checkbox; ixtiyoriy bosqichlar marshrutga qo'shiladi (Bandlik post-press — EP-PP-122).
- Isbot: technology_cards.post_press jsonb ustuni MAVJUD (q.cjs) — ixtiyoriy bosqichlarni saqlash mumkin; LEKIN checkbox→marshrutga avtomatik qo'shish logikasi va FE checkbox UI topilmadi (TechCardsMaster post_press input ko'rinmadi).

**07.129  🟡 qisman**  — ❓ Tekshirilmagan maket → reja 'kutish' holatiga tushib, faqat dizayn-rahbar tasdig'i (audit yozuvi) bilan ochilsinmi ('sifat rejadan ustun')?
- Siz: A) Sifat qoidasi: to'liqsiz maket→kutish; faqat rahbar tasdig'i bilan ochiladi. Kitob ЦКП 'сифат режа ва муддатдан устун' (EP-PP-123).
- Isbot: technology_cards.maket_approved boolean + POST cards/:id/maket-approve REAL (technology.repository.ts:264 setMaketApproved) + FE gate-pill. Maket-tasdiq GATE bor; LEKIN 'tekshirilmagan maket → reja avtomatik kutishga' bloklash va rahbar-only override audit yozuvi to'liq emas (faqat flag).

**07.130  🟡 qisman**  — ❓ Reja 'boshlash' gate: maket-tasdiq ╳ texkarta+lab-tasdiq ╳ material-bor — uchchasi yashil bo'lsagina ishga tushsinmi?
- Siz: A) 3 shart birgalikda gate. Kitob: lab «Одобрена»+material to'liq+texkarta tekshirilgan→ishga o'tadi (EP-PP-124).
- Isbot: technology_cards.lab_approved + maket_approved ustunlari + FE TechCardsMaster.tsx:4 '3 traffic-light gates (maket/lab/material)' GatePills MAVJUD; lab-approve/maket-approve endpoint REAL. LEKIN 3-gate birgalikda reja-ishga-tushishni BLOKLOVCHI server-side gate (release-production-order) tekshiruvi tasdiqlanmadi — vizual pill bor, majburiy gate to'liq emas.

**07.131  ❌ yo'q**  — ❓ Reja maket holatini kuzatsinmi (qoralama/tekshiruvda/qaytarildi/tasdiqlandi), qaytarish bo'lsa muddat avtomatik surilsinmi (доработка sikli)?
- Siz: A) Maket holat siklini kuzatadi; qaytarishda muddat avtomatik suriladi. Kitob: to'liqsiz maket dizaynga qaytariladi (EP-PP-125).
- Isbot: maket_approved faqat boolean (q.cjs) — qoralama/tekshiruvda/qaytarildi sikl-statusi YO'Q; grep maket.rework|доработка|qaytarish.sikl=0. Muddat avtomatik surish yo'q.

**07.132  ❌ yo'q**  — ❓ Yangi mahsulot marshrutiga 'konstruktor (chizma+qolip)' bosqichi (vaqt+holat) qo'shilib, reja shundan keyin ishlab chiqarishga o'tsinmi?
- Siz: A) Konstruktor bosqichi marshrutda (vaqt+holat). Kitob 5-Departament konstruktor (EP-PP-126).
- Isbot: grep constructor.stage|konstruktor.bosqich apps/api/src/modules/pp=0; qolip_id FK bor lekin konstruktor (chizma+qolip ishlab chiqish) marshrut-bosqichi vaqt/holat bilan yo'q.

**07.133  🟡 qisman**  — ❓ Tizim har operator norma % ni avtomatik (fakt÷norma, kunlik+oylik) hisoblab, HR oyligiga ulasinmi (43%/62% kuniga)?
- Siz: A) Operator norma % avtomatik; HR oyligiga ulanadi (Iyun ishchilar.xlsx avtomatlashtiriladi — EP-PP-127).
- Isbot: production_sessions da target_quantity+actual_quantity bor (norma% xom-ashyosi mavjud) + tech_card_routes.norm_per_hour; LEKIN operator-darajasida fakt÷norma kunlik/oylik % avtomatik hisoblovchi + HR-oyliqqa ulovchi servis PP-da topilmadi (grep normPct=0).

**07.134  ❌ yo'q**  — ❓ Tizim 'ish yo'q (reja bo'sh)' vs 'ishladi-yu sekin'ni ajratib, bo'sh turish operator KPIga ta'sir qilmasinmi (adolat)?
- Siz: A) Bo'sh turish vs sekin ajratiladi; bo'sh turish KPIga ta'sir qilmaydi — adolatli (Iyun ishchilar past % — EP-PP-128).
- Isbot: grep idleVsSlow|ish.yo.q|bo.sh.turish.kpi apps/api/src=0; operator past-% sababini (reja-bo'sh ╳ sekin) ajratuvchi adolat-logika yo'q.

**07.135  ❌ yo'q**  — ❓ Reja Excelga eksport (Bandlik/ketgan kun ustunlari bilan) berilsinmi (o'tish davri silliq)?
- Siz: A) Reja Excelga eksport — o'tish silliq, ishonch ortadi (hozir hamma narsa Excelda — EP-PP-129).
- Isbot: grep excelExport|xlsx.export apps/api/src/modules/pp=0; reja Excelga (Bandlik formatda) eksport endpoint'i yo'q.

**07.136  🟡 qisman**  — ❓ AI har smenaga optimal to'plam taklif qilsinmi (zarur + rang-guruh priladka tejash + material-bor + bottleneck-to'la), planlovchi 1 klik tasdiqlasinmi?
- Siz: A) AI keyingi smenani optimal to'ldiradi (rang-guruh+zarur+material+bottleneck), 1-klik tasdiq (EP-PP-130).
- Isbot: pp-ai-planning.service.ts Step5 rang-guruh/bottleneck-first faqat QOIDA-yozadi (str:271 'priority→rang-guruh→FIFO'), haqiqiy sequence priority-service (deterministik, rang-guruh branch yo'q); Step7 AI-optimize key-gated stub (str:294 'AI provayder kaliti sozlanmagan'). Hook bor, AI-fill ishlamaydi. Egasi-data: AI kalit.

**07.137  🟡 qisman**  — ❓ AI bottleneck stanokni avtomatik aniqlab (eng band), rejani shunga moslab optimizatsiya qilsinmi (umumiy chiqim maks — TOC)?
- Siz: A) AI bottleneck-TOC — rejani tor-joy atrofida quradi. Egasi '90 metrli flekso gofra liniya'da to'xtagan (EP-PP-131).
- Isbot: BOTTLENECK ANIQLASH real: pp-crp.service.ts:203 markBottleneck (eng yuqori utilizationPct → isBottleneck=true) + AI-planning Step4 bottleneckWorkCenter (str:251-256). LEKIN rejani bottleneck atrofida AI-optimizatsiya (TOC) qilish Step7 key-gated stub — aniqlash bor, TOC-reja yo'q.

**07.138  ❌ yo'q**  — ❓ CRP ikki cheklov bilan ishlasinmi: stanok quvvati ╳ xodim mavjudligi (smena bo'yicha) — real parallel (5 stanok lekin 3 operator = 3 parallel)?
- Siz: A) CRP stanok ╳ xodim ikki-cheklov; real parallel. Post-press 1 operator bir nechta stanok (EP-PP-132).
- Isbot: pp-crp.service faqat STANOK quvvati (utilization/efficiency_rate, str:120) hisoblaydi; xodim-mavjudlik ikkinchi cheklov grep labor.constraint|xodim.mavjud=0. CRP xodim-cheklovsiz (optimistik).

**07.139  🟡 qisman**  — ❓ Buyurtma turi (to'liq mahsulot / yarim-tayyor / xizmat: kesish/list) ajratilib, har biriga mos qisqa marshrut berilsinmi?
- Siz: A) Buyurtma turi 3 xil; xizmatga qisqa marshrut (Bandlik Kesilgan qog'oz/Gofra list GL — EP-PP-133).
- Isbot: production_orders.order_type + production_type ustunlari MAVJUD (q.cjs) — tur ajratish mumkin; LEKIN xizmat/yarim-tayyor uchun qisqa-marshrut avtomatik tanlash logikasi va 3-turli enum semantikasi tasdiqlanmadi (faqat xom ustun).

**07.140  ❌ yo'q**  — ❓ Egasi dashboardi (vaqtida % / kechikyapti soni / bottleneck stanok / bugungi chiqim vs reja / zarur buyurtmalar) — 1 ekran sodda til bo'lsinmi?
- Siz: A) Egasi 1-ekranli sodda dashboard (non-texnik egasi uchun butun-zavod ko'rinishi — EP-PP-134).
- Isbot: grep reja.sog|owner.dashboard|egasi.ekran apps/api+FE=0 (bitta hit finance delivery-listener, mos emas). Egasi-uchun jamlangan PP-sog'lik dashboardi yo'q.

**07.141  ❌ yo'q**  — ❓ Reja davomiylik = norma×tiraj + setup; fakt avtomatik; og'ish > X% bo'lsa tizim normani qayta ko'rishni tavsiya qilsinmi (o'z-o'zini kalibrlash)?
- Siz: A) Og'ish>X% → norma avtomatik kalibrlash tavsiyasi (25-04 Длительность/Плановая продолж. — EP-PP-135).
- Isbot: technology_cards.average_actual_duration + based_on_orders_count ustunlari bor (kalibrlash xom-ashyosi) LEKIN grep calibrat|kalibrl|autoCalibr apps/api/src=0; og'ish-bo'sag'a→norma qayta-ko'rish tavsiyasi logika yo'q.

**07.142  ❌ yo'q**  — ❓ AI kodli sabablarni oylik guruhlab hisobot bersinmi (Pareto: eng ko'p kechikish sababi) — tizimli yaxshilanish yo'nalishi?
- Siz: A) AI oylik sabab-Pareto (eng ko'p takror sabab). Kitob 5-sabab-guruhi oylik umumlashtiriladi (EP-PP-136).
- Isbot: grep pareto|delayPareto|sabab.guruh apps/api/src=0; kitob 5-sabab-kodi (material/dastgoh/kadr/texno-xato/reja-xato) decision'da bor lekin reason_code jadvali+AI oylik Pareto hisoboti qurilmagan.

---

## 08 — MES / Ishlab chiqarish  (vizyon 38%, 82 savol)

**08.1  ✅ bor**  — ❓ Ishlab chiqarish sessiyasi 3 bosqich (tayyorgarlik/sozlash → asosiy → yakunlash) bo'lsinmi? (EP-MES-001)
- Siz: To'liq 3 bosqich (hop3): SETUP/MAIN/TEARDOWN — OEE Availability to'g'ri bo'lishi uchun sozlash/yakunlash vaqti alohida o'lchanadi
- Isbot: production-session.aggregate.ts:85-91 GsdStage enum SETUP/MAIN/TEARDOWN/DONE + STAGE_ORDER; production_sessions DB: setup_seconds/main_seconds/teardown_seconds/current_stage/stage_started_at ustunlari mavjud

**08.2  ✅ bor**  — ❓ Bosqichlar avtomatmi yoki operator tugmasi bilanmi? (EP-MES-002)
- Siz: Operator tugmasi bilan qo'lda (IoT sensor yo'q); sensor bor mashinada keyin avto
- Isbot: IoT-tablet FE (IoTProductionDashboard.tsx) operator qo'lda bosqich/sessiya boshqaradi; sensor avto yo'q (vizyonga mos — IoTsiz boshlash EP-MES-080)

**08.3  🟡 qisman**  — ❓ Smena modeli 3 smena, soatlari sozlanadiganmi? (EP-MES-003)
- Siz: 3 smena 12 soatlik, A/B/C harf-nom, soatlari sozlanadi
- Isbot: shift_types DB: MORNING/EVENING/NIGHT (3 ta) lekin 9.0 soat, A/B/C harf EMAS; mes.dto.ts:19 enum morning/afternoon/night — vizyon 12h+A/B/C talab qiladi

**08.4  🟡 qisman**  — ❓ Brigada (jamoa: a'zolar+brigadir+smena) tushunchasi bormi? (EP-MES-004)
- Siz: To'liq brigada — operator+yordamchilar, brigadir, smenaga biriktirilgan
- Isbot: machine_crews jadvali bor (master_id/polmaster_id/shogird_id/rokler_id) — lekin role-fixed (operator+N nomli yordamchi EMAS); brigadir/smena-biriktirish ustuni yo'q; 2 qator test data (master_id=0)

**08.5  ❌ yo'q**  — ❓ Brigada tarkibini kim belgilaydi (brigadir smena boshida + HR doimiy biriktirish)? (EP-MES-005)
- Siz: Brigadir smena boshida tasdiqlaydi + HR doimiy A/B/C bazadan, kunlik o'zgarish qayd
- Isbot: machine_crews'da brigadir-tasdiq/doimiy-biriktirish mexanizmi yo'q; A/B/C doimiy brigada jadvali topilmadi (shift_assignments bor lekin A/B/C-brigada ulanishi yo'q)

**08.6  🟡 qisman**  — ❓ Material sarfini avto-norma bo'yicha yechish (operator tasdig'i bilan)? (EP-MES-006)
- Siz: Avto-hisob, operator/usta tasdiqlaganda yechiladi → keyin to'liq avto+GL
- Isbot: mes_material_consumption jadvali bor (session_id/material_id/quantity/batch_number) — 1 qator; avto-norma-yechim + GL ulanishi tasdiqlanmadi (norma jadval yo'q)

**08.7  🟡 qisman**  — ❓ Norma manbai texkarta/BOM (yagona manba, MES o'qiydi)? (EP-MES-007)
- Siz: Texkarta yagona manba PP'dan, MES faqat o'qiydi (dublikat taqiq)
- Isbot: technology_cards + pp_routing PP'da bor; material_norms.technology_card_id FK mavjud — lekin MES per-station ishlab-chiqarish normasini o'qiydigan ulanish ko'rinmaydi

**08.8  ❌ yo'q**  — ❓ Norma chetlashuvini (haqiqiy vs norma) kuzatish (farq%+jamlanma+ogohlantirish)? (EP-MES-008)
- Siz: Har sessiyada farq% + smena/brigada jamlanma + ogohlantirish
- Isbot: Per-station ishlab-chiqarish norma jadvali yo'q → norma-fakt farq% hisoblab bo'lmaydi; material_norms = BOM normasi, ishlab-chiqarish unum normasi emas

**08.9  🟡 qisman**  — ❓ SOS (favqulodda chaqiruv) bosqichli eskalatsiya (usta→bo'lim→direktor)? (EP-MES-009)
- Siz: Bosqichli eskalatsiya org-sxema vertikal marshruti bo'yicha, sakramaydi
- Isbot: IoT-tablet SOS tugma (sos_alerts, /api/iot/tablet/sos-alert @Public) bor + mes_sos_events jadvali; bosqichli org-sxema eskalatsiya (15/30 daq avto-ko'tarish) tasdiqlanmadi

**08.10  🟡 qisman**  — ❓ SOS sabab toifalari master-data (5-6 standart+boshqa)? (EP-MES-010)
- Siz: 5-6 standart toifa (material/texnologik/sifat/kadr/reja-xato/boshqa) + izoh majburiy
- Isbot: mes_downtime_reasons 7 generik kod (DT-MECH/ELECT/MAT/SETUP/MAINT/QUAL/SHIFT) — kitobning 6 toifasi (reja-xato/kadr) yo'q

**08.11  🟡 qisman**  — ❓ Downtime sabab kodlarini boyitish (karton/qadoq sexiga xos 15-25 kod)? (EP-MES-011)
- Siz: Kitobning aniq sabablari: changeover/настройка, qog'oz uzilishi, bo'yoq, qolib kechikishi, remont, ish-yo'q, переделка
- Isbot: mes_downtime_reasons 7 kod (generik); downtime_reason_codes jadvali BO'SH; kitobdagi maxsus kodlar (ish-yo'q/переделка/qolib/настройка) yo'q

**08.12  ✅ bor**  — ❓ Rejali vs rejasiz to'xtash ajratish (avto OEE turi)? (EP-MES-012)
- Siz: Har sababkodga rejali/rejasiz/sifat turi avto-biriktiriladi
- Isbot: mes_downtime_reasons.is_planned ustuni (true/false) + category; downtime_events.is_planned mavjud — OEE Availability ajratish uchun asos bor

**08.13  ✅ bor**  — ❓ Downtime'ni kim va qachon kiritadi (operator darhol)? (EP-MES-013)
- Siz: Operator darhol (boshlanish qo'lda, sabab keyin) → jonli
- Isbot: IoT-tablet downtime qayd oqimi (/api/iot/downtime-events, daqiqa+sabab); downtime_events.reported_by/started_at/reason_code mavjud

**08.14  🟡 qisman**  — ❓ OEE'ni qaysi darajada ko'rsatish (mashina+smena+brigada+sex)? (EP-MES-014)
- Siz: Hamma darajada — har birlik o'z GSD'siga ega, brigada bali bonusga
- Isbot: get-oee.handler.ts mashina darajasida real OEE (production_sessions'dan); smena/brigada/sex darajali OEE rollup tasdiqlanmadi

**08.15  ❌ yo'q**  — ❓ OEE maqsad (target) + ogohlantirish chegarasi (mashina/sexga alohida)? (EP-MES-015)
- Siz: Har mashina/sexga alohida maqsad + kritik chegara
- Isbot: Per-mashina OEE target/threshold sozlash jadvali yoki ustuni topilmadi; FE MESExtended.tsx:146 worldClass=85 hardcoded chegara, sozlanadigan emas

**08.16  🟡 qisman**  — ❓ Jonli monitoring ekrani (sex tablosi, rangli holat+jonli OEE)? (EP-MES-016)
- Siz: To'liq jonli tablo — har mashina rangli holat + jonli OEE/miqdor
- Isbot: FE MESExtended.tsx OEE jadval (machines OEE/status) + mes.gateway.ts WS OEE; lekin rangli jonli sex-tablo (kim-qaysi-mashinada) emas — OEE-ro'yxat ko'rinishi

**08.17  🟡 qisman**  — ❓ Jonli yangilanish tezligi (1-5 daq)? (EP-MES-017)
- Siz: Har 1-5 daqiqada yangilanish (IoTsiz yetarli), SOS darhol push
- Isbot: mes.gateway.ts WebSocket OEE push bor; aniq 1-5 daq interval + SOS-darhol ajratish tasdiqlanmadi

**08.18  ❌ yo'q**  — ❓ To'xtagan mashina avto-ogohlantirish (15daq→usta, 30daq→direktor)? (EP-MES-018)
- Siz: Avto-signal bosqichli eskalatsiya org-sxema marshruti bilan
- Isbot: Vaqt-asosli avto-eskalatsiya (15/30 daq cron) MES kodida topilmadi; production-agent cron 30daq lekin faqat kechikkan buyurtma, mashina-to'xtash avto-signal emas

**08.19  🟡 qisman**  — ❓ Operator kartasiga ulash (sessiya natijasi→karta→GSD)? (EP-MES-019)
- Siz: Har sessiya/brigada natijasi operator kartasiga yoziladi → oylik/reyting/o'sish
- Isbot: production_sessions.operator_card_id ustuni bor; MES_TO_HR_360 event chiqadi; lekin natija→karta→oylik to'liq zanjiri (operator_daily_stats=0 qator) ishlamayapti, data yo'q

**08.20  🟡 qisman**  — ❓ Operator GSD (ЦКП) ko'rsatkichi (vaznli ball)? (EP-MES-020)
- Siz: Bir nechta GSD (yaroqli miqdor+OEE+sarf) vaznli ball, asosiy=соф махсулот
- Isbot: production_sessions actual_quantity/defect_quantity bor (sof=hisoblanadi); vaznli GSD ball formula MES'da tasdiqlanmadi; operator_performance_summary jadval bor lekin ulanish noaniq

**08.21  🟡 qisman**  — ❓ Razryad (malaka) va natija bog'lanishi? (EP-MES-021)
- Siz: Razryad normani+bahoni belgilaydi, MES natijasi razryad-o'sishga ta'sir
- Isbot: razryad_levels (org modulida) bor; MES natija→razryad-o'sish bog'lanishi MES kodida tasdiqlanmadi — egasi-data (razryad-norma qiymat) kutadi

**08.22  🟡 qisman**  — ❓ Brak sababini toifalash (tayyor toifalar+mas'ul bosqich)? (EP-MES-022)
- Siz: Tayyor brak-sabab toifalari + mas'ul bosqich, OTK rasmiy qayd
- Isbot: IoT-tablet brak qayd (miqdor+sabab kodi) + inline_qc_checks jadvali; brak-sabab toifa master-data va mas'ul-bosqich ajratish tasdiqlanmadi (QC moduli bilan)

**08.23  🟡 qisman**  — ❓ Smenadan smenaga topshirish (handover, keyingi smena tasdiqlaydi)? (EP-MES-023)
- Siz: Rasmiy handover yozuvi (tugamagan ish+nosozlik+izoh), keyingi smena tasdiqlaydi, raqamli imzo
- Isbot: shift_handovers jadvali (machine_status/pending_tasks/quality_issues) + IoT handover raqamli imzo oqimi; ikki-taraf qabul-tasdiq ustunlari to'liq tasdiqlanmadi; 0 qator data

**08.24  🟡 qisman**  — ❓ Ish topshirig'i (work order) PP'dan avto tushadi (operator tanlaydi)? (EP-MES-024)
- Siz: Rejadan PP avto, operator ro'yxatdan tanlaydi → reja-fakt bog'liq
- Isbot: production_sessions.production_order_id/order_id FK; IoT-tablet buyurtma tanlash bor; PP→MES avto reja-tushish (mes_papka_orders) ulanishi to'liq tasdiqlanmadi, mes_papka_orders 0 qator

**08.25  🟡 qisman**  — ❓ Reja vs fakt (har order/smenada reja/fakt/farq%+sabab)? (EP-MES-025)
- Siz: Har order va smenada reja/fakt/farq% + kam bo'lsa majburiy sabab
- Isbot: production_sessions target_quantity vs actual_quantity (reja/fakt) bor; farq% + majburiy sabab (norma<chegara) mexanizmi tasdiqlanmadi

**08.26  🟡 qisman**  — ❓ Smenani baholash (vaznli ball OEE+reja-fakt+brak+sarf)? (EP-MES-026)
- Siz: Vaznli ball, sozlanadigan vazn (MES_SCORE_MAX kodda)
- Isbot: mes_shift_evaluations + shift_evaluations jadvallari bor (0 qator); vaznli ball formula + sozlanadigan vazn tasdiqlanmadi

**08.27  ❌ yo'q**  — ❓ Bonus/reytingga ulanish (ball→A/B/C→bonus payroll)? (EP-MES-027)
- Siz: Ball→toifa→bonus avto-hisob payroll bilan
- Isbot: MES smena bali→bonus→payroll avto-zanjiri MES kodida topilmadi; smena-baholash 0 qator, bonus ulanishi yo'q

**08.28  🟡 qisman**  — ❓ AI ishlab chiqarish nazoratchisi (jonli+kunlik hisobot+anomaliya)? (EP-MES-028)
- Siz: AI jonli kuzatadi + kunlik hisobot + anomaliya signali
- Isbot: ai-agents/mes/mes-monitor.service.ts:212-213 anomaliya z-score + HITL escalation event (mes.machine.anomaly_alert) REAL; lekin jonli AI kuzatuv cheklangan, LLM kunlik narrativ hisobot emas

**08.29  🟡 qisman**  — ❓ Materiallar partiyasini (lot) kuzatish (traceability)? (EP-MES-029)
- Siz: Har sessiyada ishlatilgan partiya/rulon yoziladi (FIFO/FEFO traceability)
- Isbot: mes_material_consumption.batch_number ustuni bor (1 qator); FIFO/FEFO + rulon/папка to'liq traceability tasdiqlanmadi

**08.30  🟡 qisman**  — ❓ Texkarta amal qilinishi (checklist+chetlashuv qaydi)? (EP-MES-030)
- Siz: Har bosqich checklist belgilanadi + chetlashuv qaydi, texkarta xatosi 15daq xabar
- Isbot: setup_checklists/checklist_items + session passChecklist() gate bor (TB-safety); texkarta-adherence per-bosqich belgilash + chetlashuv qayd tasdiqlanmadi

**08.31  ❌ yo'q**  — ❓ 'А смена План' formasini ekranga aynan ko'chirish (ustun-ma-ustun)? (EP-MES-031)
- Siz: Zavod 5 yil ishlatadigan Excel forma aynan: buyurtma→bajariladigan son→reja vaqt→start/stop→fakt
- Isbot: FE MESExtended.tsx = OEE dashboard (machines OEE jadval), 'А смена План' forma-ko'rinishi yo'q; smena reja-forma sahifasi topilmadi

**08.32  🟡 qisman**  — ❓ Reja vaqt vs fakt vaqt 4 ALOHIDA maydon (reja/fakt boshlash+tugatish)? (EP-MES-032)
- Siz: 4 maydon: reja-boshlash/fakt-boshlash/reja-tugatish/fakt-tugatish → kechikish o'lchanadi
- Isbot: production_sessions started_at/ended_at + start_time/end_time (fakt) bor; reja-boshlash + reja-tugatish ALOHIDA 4 maydon to'liq emas (faqat fakt vaqtlar aniq)

**08.33  🟡 qisman**  — ❓ Operator+Ёрдамчи juftligini har stansiyaga biriktirish (1 op+N yordamchi)? (EP-MES-033)
- Siz: Har mashinaga 1 operator + N nomli yordamchi roli — hissa har kimga to'g'ri yoziladi
- Isbot: machine_crews master/polmaster/shogird/rokler (fixed 4 rol) — kitobning '1 operator + N nomli yordamchi' (ФСМ: Хужамбердиева+Холмирзаева) modeliga to'liq mos emas; yordamchi-hissa% ustuni yo'q

**08.34  ❌ yo'q**  — ❓ Normani SOATLIK + 12-SOATLIK ikki bazada saqlash? (EP-MES-034)
- Siz: Asosiy=soatlik, 12-soatlik avto-hisob (×12−tanaffuslar)
- Isbot: Per-station ishlab-chiqarish norma jadvali yo'q (faqat material_norms BOM); soatlik+12-soatlik baza ustunlari topilmadi

**08.35  ❌ yo'q**  — ❓ Norma o'lchov birligi stansiyaga qarab (м2/лист/штук/удар-лист)? (EP-MES-035)
- Siz: Har stansiya o'z birligi: Гофра=м2, печать=лист, ФСМ=штук, тигель=удар
- Isbot: Stansiya×birlik (м2/лист/удар) master-data jadvali topilmadi; equipment jadvalida birlik ustuni yo'q; norma jadvali yo'q

**08.36  ❌ yo'q**  — ❓ 'иш йук' (ish yo'qligi)ni downtime'dan ALOHIDA hisoblash? (EP-MES-036)
- Siz: 'Ish yo'q' alohida tur, sababi rejalashtirishga yoziladi (operator aybsiz)
- Isbot: mes_downtime_reasons 7 kod ichida 'ish-yo'q'/reja-xato toifa yo'q; downtime_reason_codes BO'SH; alohida ish-yo'q tur topilmadi

**08.37  ❌ yo'q**  — ❓ Ish-yo'q paytida xodimni boshqa ishga o'tkazishni qayd qilish? (EP-MES-037)
- Siz: Ish-yo'q vaqtiga 'qaytarilgan ish' (archish/kadoklash/avtokarton) yoziladi → haqiqiy unum
- Isbot: Ish-yo'q-vaqtiga qayta-biriktirilgan ish qayd mexanizmi topilmadi; ish-yo'q turi o'zi yo'q (EP-MES-036)

**08.38  ❌ yo'q**  — ❓ Ofset va Flekso bo'limini alohida normalash (НО 12-1/НО 12-2)? (EP-MES-038)
- Siz: Ofset/Flekso alohida bo'lim — o'z norma + НО-mas'ul + hisobot
- Isbot: Ofset/Flekso bo'lim ajratish + НО-mas'ul (Махмудов 12-1/Юсупов 12-2) biriktirish jadvali topilmadi; norma jadvali umuman yo'q

**08.39  ❌ yo'q**  — ❓ Aniq mashina ro'yxatini master-data qilish (~30 mashina)? (EP-MES-039)
- Siz: Kitobdagi to'liq ~30 mashina: Резка, Гф линия, SM-52/72, KBA-105, Тигель 1-10, ФСМ, Окошка, Степлер, Эмбоссинг
- Isbot: equipment DB = 7 generik demo mashina (Ofset #1 DEMO, EQ-FLEXO-1...) — kitobning aniq ~30 mashinasi YO'Q; work_centers 12 generik

**08.40  ❌ yo'q**  — ❓ Tigel pressini 1-10 raqamlangan alohida birlik qilish? (EP-MES-040)
- Siz: Har tigel (1-10) alohida birlik + turi (oddiy/тиснение/конгрев)
- Isbot: equipment'da Тигель 1-10 alohida birlik yo'q (7 generik mashina ichida tigel yo'q)

**08.41  🟡 qisman**  — ❓ Stansiyaga 'keyingi ish' (очередь) ko'rsatish (joriy+navbat 2-3)? (EP-MES-041)
- Siz: Har mashinada joriy + navbatdagi 2-3 ish — uzluksizlik
- Isbot: machine_tasks jadvali (priority/due_date/equipment_id) bor (0 qator); joriy+navbat 2-3 ko'rsatish FE'da tasdiqlanmadi

**08.42  ❌ yo'q**  — ❓ Bir mashina ikki bo'limda (Флексо vs Упаковка) ishlashini ajratish? (EP-MES-042)
- Siz: Mashina+bo'lim (Flekso/Upakovka) birikmasi alohida birlik
- Isbot: Mashina×bo'lim birikma birligi jadvali topilmadi; mashina master-data o'zi generik (EP-MES-039)

**08.43  ❌ yo'q**  — ❓ 'Kim hozir qaysi mashinada' jonli bandlik jadvali? (EP-MES-043)
- Siz: Jonli operator→mashina jadvali (band/bo'sh) — usta ko'chirishni biladi
- Isbot: Jonli operator→mashina bandlik jadvali FE/BE'da topilmadi; machine_status_logs (9 qator) mashina holati, operator-bandlik emas

**08.44  ❌ yo'q**  — ❓ Bir operator bir vaqtda bir necha mashina yuritishini qayd (foiz/vaqt ulush)? (EP-MES-044)
- Siz: Operator bir necha mashinaga foiz/vaqt ulushi bilan (Холматов ikki normada)
- Isbot: machine_crews session_id-ga bog'langan (1 sessiya=1 mashina); operator→ko'p-mashina foiz/vaqt ulush modeli topilmadi

**08.45  ❌ yo'q**  — ❓ Yakuniy qadoqlash (упаковка 1 сотрудник)ni alohida bosqich/norma qilish? (EP-MES-045)
- Siz: Qadoqlash alohida bosqich + norma (1 ishchi/12 soat)
- Isbot: Qadoqlash alohida bosqich/norma jadvali topilmadi; per-bosqich norma umuman yo'q (EP-MES-034)

**08.46  ❌ yo'q**  — ❓ 'переделка' (qayta ishlash)ni alohida yo'qotish qilish (sabab+soat)? (EP-MES-046)
- Siz: 'Qayta ishlash' alohida tur + sababi (qolib/sozlash/material) + soat
- Isbot: downtime/sabab kodlarida 'переделка'/qayta-ishlash turi yo'q (7 generik kod); mes_downtime_reasons'da topilmadi

**08.47  ❌ yo'q**  — ❓ Qolib (shtamp/forma) tayyor emasligini downtime sababi qilish (KB signal)? (EP-MES-047)
- Siz: 'Qolib/forma tayyor emas' alohida sabab kodi → KB/konstruktor bo'limiga ulanadi
- Isbot: 'Qolib kechikishi' sabab kodi mes_downtime_reasons'da yo'q; KB-bo'lim signal ulanishi topilmadi

**08.48  ✅ bor**  — ❓ Murakkab sozlash (настройка/приладка)ni alohida vaqt qilish? (EP-MES-048)
- Siz: Sozlash/приладка alohida bosqich + vaqti → OEE Availability to'g'ri
- Isbot: production-session.aggregate.ts SETUP bosqichi (setup_seconds) sozlash vaqtini MAIN'dan ajratadi → OEE Availability'dan ayriladi (EP-MES-001 bilan)

**08.49  ❌ yo'q**  — ❓ Normani SOF ISH VAQTIGA hisoblash (tanaffus/tushlik/namoz chegirib)? (EP-MES-049)
- Siz: Smenadan tanaffus 10:00-10:20/tushlik 12:00-13:30/namoz avto-chegiriladi → sof ish vaqti
- Isbot: Kun-tartibi tanaffus/tushlik/namoz vaqtlarini sof-ish-vaqtdan avto-chegirish mexanizmi topilmadi; norma jadvali yo'q

**08.50  ❌ yo'q**  — ❓ 3-smenali tushlikni navbat bilan boshqarish (1/2/3-to'lqin)? (EP-MES-050)
- Siz: MES tushlik navbatini ko'rsatadi (1/2/3-to'lqin) → mashina to'xtamaydi
- Isbot: 3-to'lqin tushlik navbat boshqaruvi MES'da topilmadi

**08.51  ❌ yo'q**  — ❓ Namoz tanaffusini sof-ish-vaqtdan ajratib hisobga olish (bittadan navbat)? (EP-MES-051)
- Siz: Namoz (peshin/asr/shom) sof-ish-vaqtdan chegiriladi, bittadan navbat
- Isbot: Namoz-vaqti chegirish/navbat mexanizmi topilmadi (EP-MES-049 bilan birga yo'q)

**08.52  🟡 qisman**  — ❓ Mustaqil ishlash ruxsati = MES operatorlik huquqi (2021 ShVB, faqat ruxsatli sessiya ochadi)? (EP-MES-052)
- Siz: Faqat 'mustaqil ruxsat' bayrog'i bor xodim sessiya ochadi (mashina turi bo'yicha); 2 oy amaliy+imtihon+RD-4
- Isbot: start-session.handler.ts:40-60 LMS sertifikat HARD-BLOCK real (checkOperatorCertification, valid bo'lmasa FORBIDDEN); LEKIN course-asosli, mashina-turi matritsa emas (EP-MES-054)

**08.53  🟡 qisman**  — ❓ Ustoz-shogird (мураббий) bog'lanishini MES'da ko'rsatish (shogird sessiya ustoz nazoratida)? (EP-MES-053)
- Siz: Shogird sessiyasi 'ustoz nazoratida' + natija ikkalasiga (o'qish davri)
- Isbot: machine_crews.shogird_id ustuni bor; shogird-sessiya 'ustoz nazoratida' bayroq + brak-ajratish (shogird→ustoz ta'sir qilmaydi) mexanizmi tasdiqlanmadi

**08.54  ❌ yo'q**  — ❓ Operator×mashina malaka matritsasi (qaysi mashinada ishlay oladi)? (EP-MES-054)
- Siz: Operator×mashina matritsasi (ishlay oladi/o'rganmoqda/yo'q) — to'g'ri biriktirish
- Isbot: operator_certifications = kurs-asosli (course_id/course_name), mashina-turi×operator matritsa jadvali topilmadi; 0 qator

**08.55  ❌ yo'q**  — ❓ 'Согласовано РД-4/Утверждено Директор' tasdiq zanjirini normaga (versiya saqlanadi)? (EP-MES-055)
- Siz: Norma o'zgarishi RD-4 kelishuvi + direktor tasdig'idan o'tadi, versiya saqlanadi
- Isbot: Norma jadvali yo'q → ikki-bosqichli RD-4+direktor tasdiq zanjiri ham yo'q (material_norms'da approval ustuni yo'q)

**08.56  ❌ yo'q**  — ❓ Norma versiyasi va sanasini saqlash ('Дата 13.01.2022')? (EP-MES-056)
- Siz: Norma versiyalanadi (amal sanasi bilan); o'tgan smena o'sha paytdagi norma bilan baholanadi
- Isbot: Ishlab-chiqarish norma versiyalash jadvali yo'q; material_norms'da effective-date/version yo'q

**08.57  🟡 qisman**  — ❓ Mahsulot kodlash formatini saqlash (2025-3499/KT4438/папка/o'lcham/marka)? (EP-MES-057)
- Siz: To'liq struktura (yil-raqam/папка/KT-kod/o'lcham/marka) alohida maydonlar — usta KT4438 qidiradi
- Isbot: sales_orders/pp papka kodlari SD/PP'da bor; MES sessiyada to'liq struktura (KT-kod/папка/marka alohida maydon+qidiruv) tasdiqlanmadi

**08.58  ❌ yo'q**  — ❓ 'Укишга'/'Академияга' — o'quv ishlarini real natijadan ajratish? (EP-MES-058)
- Siz: 'O'quv/Akademiya' alohida ish turi (real natija+tannarxga qo'shilmaydi), LMS bilan sinx
- Isbot: Sessiya ish-turida 'o'quv/Akademiya' ajratish bayrog'i topilmadi; production_sessions'da o'quv-tur ustuni yo'q

**08.59  ❌ yo'q**  — ❓ Gofra (2/5 qatlam)ni м2 + qatlam bilan alohida hisoblash? (EP-MES-059)
- Siz: Gofra liniyasi м2 + qatlam soni alohida (5/3 слой) — to'g'ri o'lchov+material
- Isbot: Gofra м2+qatlam alohida hisoblash ustunlari topilmadi; norma birligi (м2) yo'q (EP-MES-035), Гф линия mashina master-data'da yo'q

**08.60  🟡 qisman**  — ❓ 'умумий/Брак/Соф махсулот' uchligini saqlash + avto-tekshirish (sof=umumiy−brak)? (EP-MES-060)
- Siz: Umumiy+brak+sof, avto-tekshiriladi sof=umumiy−brak → Quality OEE
- Isbot: production_sessions actual_quantity (umumiy/ishlab-chiqilgan) + defect_quantity (brak) bor; 'sof' alohida ustun yo'q lekin hisoblanadi; avto-tekshirish (sof=umumiy−brak) constraint tasdiqlanmadi

**08.61  ❌ yo'q**  — ❓ Smenani A/B/C harf-nomi bilan saqlash? (EP-MES-061)
- Siz: Smena=A/B/C harf + vaqt oralig'i (sozlanadigan), morning/afternoon o'rniga
- Isbot: shift_types DB MORNING/EVENING/NIGHT; mes.dto.ts:19 enum morning/afternoon/night — A/B/C harf-nom YO'Q

**08.62  ❌ yo'q**  — ❓ Brigadani doimiy A/B/C smenaga biriktirish (kunlik o'zgarish qayd)? (EP-MES-062)
- Siz: Brigada→doimiy smena (A/B/C) + kunlik o'zgarish (kasallik/ta'til) qayd
- Isbot: A/B/C-smena doimiy brigada-biriktirish jadvali topilmadi (A/B/C umuman yo'q, EP-MES-061)

**08.63  ❌ yo'q**  — ❓ Smena reja-formasini smena BOSHIDA avto-tuzish (PP'dan, Исаков)? (EP-MES-063)
- Siz: MES smena boshida reja-formani PP rejasidan avto-tuzadi + bosib chiqaradi
- Isbot: Smena reja-forma avto-tuzish (PP→MES) mexanizmi topilmadi; mes_papka_orders 0 qator, reja-forma sahifa yo'q

**08.64  ❌ yo'q**  — ❓ 'Режалаштириш ходими'+'Технолог' imzosini smenaga biriktirish? (EP-MES-064)
- Siz: Har smena rejasiga planlovchi+texnolog (mas'ul) — javobgarlik aniq
- Isbot: Smena rejasiga planlovchi+texnolog imzo/mas'ul biriktirish maydoni topilmadi (smena reja-forma yo'q)

**08.65  ❌ yo'q**  — ❓ Qog'oz zayavkasini (Заявка бумаги) MES sarfiga bog'lash (farq ortiqcha/kam)? (EP-MES-065)
- Siz: Zayavka→MES haqiqiy sarf→farq → to'liq material nazorati
- Isbot: Заявка бумаги jadvali topilmadi (faqat pos_material_requests boshqa kontekst); zayavka↔MES-sarf farq hisoblash yo'q

**08.66  ❌ yo'q**  — ❓ Qog'oz formati (лист размер А×В)+grammni sessiyaga yozish? (EP-MES-066)
- Siz: Sessiyada format (А×В)+gramm+kg yoziladi → aniq material sarfi
- Isbot: production_sessions/mes_material_consumption'da format(А×В)/gramm/kg ustunlari topilmadi (faqat quantity)

**08.67  ❌ yo'q**  — ❓ 'Прошло (дней)' — buyurtma necha kun kutganini ko'rsatish? (EP-MES-067)
- Siz: Har buyurtmada 'necha kun kutdi' + muddat-oshgan ranglanadi
- Isbot: MES buyurtma navbatida 'kutgan-kun'/muddat-oshgan ranglash topilmadi (machine_tasks 0 qator, kutish-kun ustuni yo'q)

**08.68  🟡 qisman**  — ❓ 'Зарур заказлар' (shoshilinch)ni navbatda oldinga chiqarish? (EP-MES-068)
- Siz: Shoshilinch bayroq + navbatda yuqoriga + signal → muddat saqlanadi
- Isbot: machine_tasks.priority ustuni bor (prioritet asos); shoshilinch-bayroq+navbat-yuqoriga+signal to'liq oqim tasdiqlanmadi (0 qator)

**08.69  🟡 qisman**  — ❓ Bitta buyurtmaning mashinalararo marshrutini kuzatish? (EP-MES-069)
- Siz: Buyurtma marshruti (qaysi mashina/bosqich/qancha tayyor) jonli: Печать→Ламинация→Высечка→Тигель→ФСМ→Степлер→Упаковка
- Isbot: PP'da pp_routing/routing_operations/production_order_operations bor; MES'da buyurtma-marshrut jonli kuzatuv (mes_papka_orders stage ustuni yo'q, 0 qator) tasdiqlanmadi

**08.70  🟡 qisman**  — ❓ Bosqichlararo yarim tayyor qoldiqni (bottleneck) ko'rsatish? (EP-MES-070)
- Siz: Har bosqich oraliq qoldig'i (kutayotgan yarim tayyor) → bottleneck ko'rinadi
- Isbot: production-agent.service.ts:125 detectBottleneck() production_operations'dan pending-queue topadi (1 mashina); per-bosqich oraliq-qoldiq WIP ko'rsatish tasdiqlanmadi

**08.71  ❌ yo'q**  — ❓ Tanaffus markerini (УЖИН/ОБЕД/ТУШЛИК/ПОЛДНИК) jadvalda avto-ko'rsatish? (EP-MES-071)
- Siz: Tanaffus markerlari jadvalda avto-ko'rinadi + normadan chegiriladi
- Isbot: Ish-jadvalda tanaffus markerlari avto-ko'rsatish topilmadi (EP-MES-049 sof-ish-vaqt yo'q bilan birga)

**08.72  ❌ yo'q**  — ❓ Soatlik normaning aniq pog'onalarini saqlash (400/500/.../3000)? (EP-MES-072)
- Siz: Norma mahsulot/murakkablik bo'yicha pog'onali (mashina×ish turi), murakkablikni texnolog belgilaydi
- Isbot: Pog'onali norma (mashina×ish-turi) jadvali topilmadi; ishlab-chiqarish norma jadvali umuman yo'q

**08.73  ❌ yo'q**  — ❓ Brak%ni stansiya bo'yicha normalash ('брак %')? (EP-MES-073)
- Siz: Har mashinaga maqbul brak% + oshganda signal (kesim 1%, lak 5%)
- Isbot: Per-stansiya brak% chegara master-data topilmadi (norma jadvali yo'q); brak% threshold signal yo'q

**08.74  ❌ yo'q**  — ❓ 'ко-во работ' (smenada nechta turli ish) ko'rsatkichi (+changeover vaqti)? (EP-MES-074)
- Siz: Smenada ish soni + har biriga sozlash vaqti → sozlash yo'qotishini ko'rsatadi
- Isbot: Smenada turli-ish soni (ко-во работ) + changeover-vaqt ko'rsatkichi topilmadi

**08.75  ❌ yo'q**  — ❓ 'переделка' qayta ishlash sabab izohi (izoh madaniyati)? (EP-MES-075)
- Siz: переделка alohida yo'qotish turi + sabab izohi (kitob izoh madaniyati)
- Isbot: переделка sabab-kodi + majburiy izoh topilmadi (EP-MES-046 bilan birga yo'q)

**08.76  ❌ yo'q**  — ❓ Qolib kechikishi sabab kodi (takror → KB signal)? (EP-MES-076)
- Siz: 'Qolib/forma tayyor emas' takrorlanuvchi sabab → KB bo'limiga signal
- Isbot: Qolib-kechikishi sabab kodi + takror-tahlil + KB signal topilmadi (EP-MES-047 bilan birga yo'q)

**08.77  ❌ yo'q**  — ❓ Norma bajarilmasa MAJBURIY sabab so'rash (tayyor ro'yxat+izoh, usta tasdiqlaydi)? (EP-MES-077)
- Siz: Norma<chegara bo'lsa sabab majburiy (ro'yxat+izoh), usta tasdiqlaydi, og'zaki rad
- Isbot: Norma<chegara → majburiy sabab so'rash mexanizmi topilmadi (norma jadvali yo'q → chegara yo'q); downtime sabab bor lekin norma-bajarilmaslik sababi alohida emas

**08.78  🟡 qisman**  — ❓ Mashina remonti ('ремонтда')ni ishonchlilik hisobi bilan (rejali/avariya)? (EP-MES-078)
- Siz: 'Remont' alohida tur (rejali/avariya) + mashina ishonchliligi hisobi → profilaktika; avariya→Kanban texnik vazifa
- Isbot: mes_downtime_reasons DT-MAINT (rejali TO) bor; mes_maintenance_requests/tasks jadvallari bor; avariya/rejali ajratish + mashina-ishonchlilik hisobi (MTBF) tasdiqlanmadi

**08.79  🟡 qisman**  — ❓ AI kunlik smena xulosasi (top yo'qotish+brigada reyting+takror sabab+tavsiya)? (EP-MES-079)
- Siz: AI kunlik narrativ xulosa — egasi Excel o'qiy olmaydi, AI 'ofsetda 6 soat ish-yo'q, sababi rejalashtirish' deydi
- Isbot: production-agent.service.ts:134 generateShiftReport() faqat qty/defects/defectPct aggregate qaytaradi; LLM narrativ top-loss/brigada-reyting/takror-sabab/tavsiya xulosa EMAS

**08.80  ✅ bor**  — ❓ IoT'siz, faqat operator kiritishi bilan ishga tushirish (Excel→MES)? (EP-MES-080)
- Siz: To'liq qo'lda kiritish (sensor shart emas) + keyin IoT qo'shilsa avtomatik — bugundan ishlaydi
- Isbot: IoT-tablet to'liq qo'lda oqim REAL: login→sessiya→checklist→crew→brak→downtime→handover (IOT-MES-CURRENT-STATE: hammasi DB-backed ishlaydi); operator qo'lda kiritadi, sensor shart emas

**08.81  ❌ yo'q**  — ❓ НО 12-1/НО 12-2 mas'ulini (Юсупов/Махмудов) hisobotга biriktirish? (EP-MES-081)
- Siz: Har bo'lim hisobotiga НО-mas'ul (lavozim kartasi) biriktiriladi → javobgarlik+eskalatsiya
- Isbot: НО-mas'ul (bo'lim hisobot egasi) biriktirish jadvali topilmadi; Ofset/Flekso bo'lim ajratish yo'q (EP-MES-038)

**08.82  ❌ yo'q**  — ❓ Tasdiqlangan o'lchov birligini master-data qilish ('ед.изм' RD-4+direktor)? (EP-MES-082)
- Siz: Stansiya×tasdiqlangan birlik master-data (RD-4+direktor) → yagona o'lchov tili
- Isbot: Stansiya×birlik tasdiqlangan master-data topilmadi (EP-MES-035 birlik yo'q + EP-MES-055 RD-4 tasdiq yo'q); unit_of_measures seed bor lekin stansiyaga bog'lanmagan

---

## 09 — QC / Sifat  (vizyon 65%, 97 savol)

**09.1  🟡 qisman**  — ❓ EP-QC-068 (v2 Q38) Brak jiddiylik darajasi (kritik/katta/kichik) har biriga alohida AQL Ac/Re bormi?
- Siz: 3 daraja: kritik/katta/kichik, har biriga AQL chegarasi (kritik 0, katta 1, kichik 3)
- Isbot: defect_catalog.severity = CRITICAL/MAJOR/MINOR + auto_reject mavjud (23 qator); AQL Ac/Re jadvali qc-aql.constants.ts da bor (ISO 2859-1). LEKIN severity↔Ac/Re bog'lanish kodi yo'q; final-inspection >5% qattiq qoida ishlatadi (qc-extended.controller.ts:117), darajaga qarab emas. EP-QC-038 doc 🔵 OCHIQ.

**09.2  🟡 qisman**  — ❓ EP-QC-039 (v2 Q9) Brak topilgan bosqich (kirim/jarayon/tayyor/reklamatsiya) majburiy maydonmi?
- Siz: Bosqich maydoni majburiy + topgan xodim — javobgarlik aniq (HOP-4)
- Isbot: qc_checkpoints jadval stage enum (incoming/in_process/final/dispatch) — qc-new.controller.ts:29; qc_inspections.stage mavjud. Jadval+endpoint bor, lekin 0 qator (bo'sh) — qurilish bosqichi.

**09.3  ✅ bor**  — ❓ EP-QC-040 (v2 Q10) Brak miqdori (dona/m²/kg) + partiya + brak% avtomatik hisoblanadimi?
- Siz: Brak soni + Факт.выраб Excel'dan ERP'ga; brak% avtomatik
- Isbot: qc-extended.controller.ts:113-115 sampleQty/defectQty→defectRate=(defectQty/sampleQty)*100 avtomatik; qc_braks jadval + cost_impact ustun (cost-impact endpoint qc-defects-extended.controller.ts:69).

**09.4  ✅ bor**  — ❓ EP-QC-041 (v2 Q11) Brak qarori (utilizatsiya/qayta-ishlash/2-sort/tuzatish/chegirma) Ombor+Finance'ga ulanadimi?
- Siz: Har brakka qaror; har biri Ombor va Finance'ga bog'lanadi (POS 3-qaror kengaytma)
- Isbot: submit-inspection.handler.ts:58-66 3-qaror→QcPassed/QcRework/QcFailed event; qc-passed.listener→WMS FG receipt; qc-rework.listener→PP production_orders status='rework'. Grade (sort) narx koeffitsienti FG-receipt'da qo'llanadi.

**09.5  🟡 qisman**  — ❓ EP-QC-042 (v2 Q12) Brak→stanok/smena/operator avtomatik bog'lanadimi (ish topshirig'idan)?
- Siz: Stanok+smena+operator avtomatik (Excel Смена/Оператор/Помошник)
- Isbot: qc_braks jadval mavjud (defects-extended), inspector_id qc_inspections'da bor; lekin avtomatik stanok/smena/operator ish-topshirig'idan tortib olish kodi topilmadi — qo'lda kiritish darajasida. 0 qator.

**09.6  🟡 qisman**  — ❓ EP-QC-043 (v2 Q13) Reklamatsiya ochish maydonlari to'liqmi (mijoz+buyurtma+partiya+sana+brak-turi+miqdor+foto+talab)?
- Siz: To'liq forma, klassifikatordan brak turi, foto, mijoz talabi
- Isbot: qc-reclamations.controller.ts POST /reclamations + create-reclamation.handler + reclamation.aggregate.ts mavjud (real CQRS); qc_reclamations jadval bor (0 qator). Maydon to'plami doc'da 🔵 OCHIQ — egasi majburiy maydonlarni tasdiqlasin.

**09.7  🟡 qisman**  — ❓ EP-QC-044 (v2 Q14) Reklamatsiya status zanjiri (Yangi/Tergovda/Tasdiqlandi/Rad/Hal/Yopildi)?
- Siz: Aniq status zanjiri, har o'tishda sana+mas'ul
- Isbot: qc-defects-extended.controller.ts:182 PATCH /reclamations/:id (status update) mavjud; reclamation.aggregate.ts status boshqaradi. Aniq status nomlari doc'da 🔵 OCHIQ; 0 qator.

**09.8  ❌ yo'q**  — ❓ EP-QC-045 (v2 Q15) Reklamatsiya javob SLA (1/3/10 kun) + eskalatsiya?
- Siz: Bosqichli muddat + muddat o'tsa avtomatik eskalatsiya (sifat boshlig'i+director)
- Isbot: QC modulida SLA timer/cron yoki eskalatsiya kodi topilmadi (grep: yo'q). Doc'da 🔵 OCHIQ, action=CRON — qurilmagan.

**09.9  ❌ yo'q**  — ❓ EP-QC-046 (v2 Q16) Reklamatsiya kafolat oynasi (14 kun / namlik 7 kun) muddatdan keyin avtomatik rad?
- Siz: Mahsulot turiga qarab muddat, muddatdan keyin avtomatik rad
- Isbot: Kafolat-oynasi konfiguratsiya jadvali yoki tekshiruv kodi topilmadi. Doc 🔵 OCHIQ — qurilmagan, egasi muddatni tasdiqlasin.

**09.10  🟡 qisman**  — ❓ EP-QC-047 (v2 Q17) Reklamatsiya natijasi (almashtirish/pul/chegirma/kredit) Finance'ga avtomatik?
- Siz: Har natija Finance'ga avtomatik (kredit-nota)
- Isbot: qc_reclamations + reclamation.aggregate bor; Finance kredit-nota oqimi mavjud (EP-QC-070). Lekin reklamatsiya natija→Finance avtomatik ulanish QC tomonda 0 qator, mexanizm to'liq isbotlanmadi. Doc ✅ deydi, jonli bo'sh.

**09.11  🟡 qisman**  — ❓ EP-QC-048 (v2 Q18) Tub sabab (8D/5-nega) kritik reklamatsiyaga majburiymi?
- Siz: Kritik/katta reklamatsiyaga majburiy: tub sabab+chora+mas'ul+sana
- Isbot: qc_root_causes jadval + qc-extended.controller.ts:162-189 root-causes CRUD (real). Lekin 'kritik reklamatsiyaga MAJBURIY' gate kodi yo'q; 0 qator.

**09.12  🟡 qisman**  — ❓ EP-QC-049 (v2 Q19) Tasdiq zanjiri (Dizayn→Texnolog→QC→ishlab-chiqarish) imzo+sana bilanmi?
- Siz: Majburiy zanjir, har biri imzo+sana, biri rad qilsa to'xtaydi
- Isbot: qc_approvals jadval + qc-defects-extended.controller.ts:143-167 approvals GET/POST/PATCH (real endpoint). Lekin Dizayn→Texnolog→QC ketma-ket gate to'liq oqimi 0 qator, MES gate ulanishi isbotlanmadi.

**09.13  ❌ yo'q**  — ❓ EP-QC-050 (v2 Q20) Mijoz maketni tasdiqlashi (подписной лист fayl+sana+rozilik) saqlanadimi?
- Siz: Mijoz tasdiqi majburiy, maket fayli+sana+rozilik saqlanadi (ЦКП)
- Isbot: QC modulida mijoz maket-tasdiq (подписной лист) fayl-saqlash kodi/jadvali topilmadi. Bu Dizayn modulida bo'lishi mumkin; QC tomonda etalon-biriktirish yo'q (EP-QC-104 ham).

**09.14  🟡 qisman**  — ❓ EP-QC-051 (v2 Q21) Rad etish sababi (klassifikatordan+izoh+kimga+muddat)?
- Siz: Rad etishda majburiy sabab+izoh+kimga qaytadi+muddat
- Isbot: qc-defects.controller.ts:248-260 reject/:orderId endpoint mavjud; qc-extended completeFinalInspection notes oladi. Sabab klassifikatori doc 🔵 OCHIQ — strukturali rad-sabab+kimga ulanishi to'liq emas.

**09.15  ❌ yo'q**  — ❓ EP-QC-052 (v2 Q22) Birinchi namuna tasdiqi (first article) tiraj to'xtaydimi?
- Siz: Birinchi namuna o'lcham+rang+mustahkamlik tasdiqlanmaguncha tiraj to'xtaydi
- Isbot: First-article/приладка-gate kodi QC modulida topilmadi (grep first_article/приладка/tiraj: yo'q). Doc ✅ deydi lekin mexanizm qurilmagan.

**09.16  🟡 qisman**  — ❓ EP-QC-053 (v2 Q23) Tasdiqlash huquqi (asosiy+o'rinbosar, lavozim bo'yicha)?
- Siz: Har bosqichga asosiy tasdiqlovchi+o'rinbosar (lavozim bo'yicha)
- Isbot: RolesGuard + @Roles(QC_WRITE_ROLES: QC_MANAGER/production_manager/super_admin/director) qc-extended.controller.ts:30 — rol-asosli ruxsat bor. Lekin asosiy+o'rinbosar (lavozim) modeli QC'da yo'q; org-strukturadan kelishi kerak.

**09.17  ✅ bor**  — ❓ EP-QC-054 (v2 Q24) Namuna olish usuli (AQL jadval, partiya hajmidan avtomatik)?
- Siz: AQL jadval bo'yicha avtomatik (GOST/ISO 2859)
- Isbot: qc-aql.constants.ts ISO 2859-1 AQL_LOT_SIZE_TABLE + AcRe; QcAqlService.plan(); GET /qc/aql/plan + /qc/inspections/:id/aql-plan (qc-new.controller.ts:249,279) — pure compute REAL. Lot size→namuna avtomatik.

**09.18  ❌ yo'q**  — ❓ EP-QC-055 (v2 Q25) Namuna nuqtalari (bosh+o'rta+oxir / har N-rulon)?
- Siz: Bosh+o'rta+oxir yoki har N-rulon qoidasi
- Isbot: Namuna-olish-nuqtasi konfiguratsiyasi kodi topilmadi. Doc 🔵 OCHIQ — egasi N qiymatini tasdiqlasin; qurilmagan.

**09.19  🟡 qisman**  — ❓ EP-QC-056 (v2 Q26) Qabul/rad chegarasi AQL Ac/Re (kritik 0/katta 1/kichik 3)?
- Siz: AQL bo'yicha har jiddiylik darajasiga alohida Ac/Re
- Isbot: qc-aql.constants.ts AcRe {ac, re=ac+1} ISO 2859-1 bo'yicha REAL; AqlService Ac/Re qaytaradi. LEKIN jiddiylik-darajasi (kritik/katta/kichik) bo'yicha alohida AQL daraja ulanishi yo'q; egasi Ac/Re jadvalini tasdiqlasin (🔵 OCHIQ).

**09.20  ❌ yo'q**  — ❓ EP-QC-057 (v2 Q27) Kuchaytirilgan/yengillashtirilgan nazorat (ISO 2859 rejim o'tishi)?
- Siz: 3 rejim: oddiy/kuchaytirilgan/yengil avtomatik o'tadi
- Isbot: Rejim-o'tish (tightened/reduced) cron/holat mantig'i QC'da topilmadi. Doc 🔵 OCHIQ, action=CRON — qurilmagan.

**09.21  ❌ yo'q**  — ❓ EP-QC-058 (v2 Q28) Arxiv namuna (etalon) saqlash muddati+joylashuv?
- Siz: Har partiyaga arxiv namuna majburiy + 6 oy + javon/yacheyka
- Isbot: Arxiv-namuna jadval/kod topilmadi. Doc 🔵 OCHIQ — qurilmagan.

**09.22  🟡 qisman**  — ❓ EP-QC-059 (v2 Q29) Xom-ashyo kirim namunasi (gramaj+namlik+mustahkamlik), o'tmasa qabul to'xtaydimi?
- Siz: Har kirim partiyasidan namuna, o'tmasa qabul to'xtaydi (EXTERNAL_IN→karantin→QC)
- Isbot: qc_material_tests + qc_supplier_quality jadval; supplier-quality POST endpoint (qc-defects-extended.controller.ts:107); SupplierQualityFailEvent emit (submit-inspection:69). Lekin kirim-blok (qabul to'xtatish) WMS-gate to'liq oqimi 0 qator; karantin avtomatik o'tishi isbotlanmadi.

**09.23  🟡 qisman**  — ❓ EP-QC-060 (v2 Q30) Sertifikat maydonlari (№+sana+mijoz+mahsulot+partiya+GOST+o'lchovlar+laborant+QR)?
- Siz: To'liq sertifikat shabloni
- Isbot: certificates jadval cert_number/order_id/product_name/issued_by/notes/status/issued_date/expiry_date qo'shilgan; qc_certificate_templates fields(JSONB)+body_template+validity_days. PDF service generate qiladi. Lekin GOST/partiya/o'lchov-natija/QR maydonlari shablon JSONB'ga bog'liq, 🔵 OCHIQ.

**09.24  ✅ bor**  — ❓ EP-QC-061 (v2 Q31) Sertifikat raqami avtomatik ketma-ket (SF-YYYY-NNNNN)?
- Siz: Avtomatik ketma-ket (yil+tartib) + takrorlanmaslik kafolati
- Isbot: qc-certificate-pdf.service.ts:62 nextval('qc_certificate_seq')→SF-${year}-${seq}; jonli: qc_certificate_seq sekvens DB'da MAVJUD (information_schema.sequences). GET /qc/certificates/next-number endpoint.

**09.25  🟡 qisman**  — ❓ EP-QC-062 (v2 Q32) Sertifikatda real o'lchov natijalari (norma+haqiqiy+o'tdi/o'tmadi)?
- Siz: Har ko'rsatkich: norma+haqiqiy o'lchov+natija
- Isbot: qc_lab_tests (min/max/value) + qc_parameters (min/max/target) jadval bor; lab-tests POST endpoint. Sertifikat PDF'ga real natija chiqarish shablon-bog'liq; isbotlanmadi (0 qator). 🔵 OCHIQ.

**09.26  🟡 qisman**  — ❓ EP-QC-063 (v2 Q33) Sertifikat ko'p-tilli (uz/ru/en) shablon + logotip?
- Siz: Ko'p tilli shablon (uz/ru/en) + zavod blank
- Isbot: qc_certificate_templates.name_uz + name_ru bor — LEKIN EN ustun YO'Q (faqat 2-til). Eksport (en) shabloni qurilmagan; 🔵 OCHIQ.

**09.27  🟡 qisman**  — ❓ EP-QC-064 (v2 Q34) Sertifikat imzo (laborant+sifat boshlig'i) + QR-kod?
- Siz: Laborant+sifat boshlig'i imzosi+QR (tizim yozuviga)
- Isbot: certificates.issued_by ustun bor; cert PDF service issuedBy oladi. Lekin ikki-imzo (laborant+boshliq) + QR-kod generatsiya kodi isbotlanmadi. 🔵 OCHIQ.

**09.28  🟡 qisman**  — ❓ EP-QC-065 (v2 Q35) Sertifikat/QC tasdiqisiz chiqim bloklanadimi (faqat boshliq istisno)?
- Siz: QC tasdiqi yo'q→chiqim blok, faqat sifat boshlig'i sabab bilan istisno
- Isbot: qc-passed.listener.ts faqat QcPassed event'da FG receipt yaratadi (pass_count<=0→skip) — ya'ni passsiz tovar omborga kirmaydi. LEKIN SD/WMS dispatch-bloklash (final 'o'tdi'siz jo'natmaslik) gate to'liq isbotlanmadi; override (EP-QC-082) sabab-jurnal kodi yo'q.

**09.29  ❌ yo'q**  — ❓ EP-QC-066 (v2 Q36) Qaytgan mahsulot qabul maydonlari (mijoz+buyurtma+miqdor+sabab+holat+reklamatsiya)?
- Siz: To'liq qabul forma + reklamatsiya bog'lanishi
- Isbot: QC modulida qaytgan-tovar qabul forma/jadval topilmadi (INTERNAL_RETURN POS/WMS tomonda). Doc 🔵 OCHIQ — QC tomonda qurilmagan.

**09.30  🟡 qisman**  — ❓ EP-QC-067 (v2 Q37) Qaytgan tovarni qayta tekshirish→qaror (qayta-sotish/2-sort/qayta-ishlash/utilizatsiya)?
- Siz: Majburiy qayta tekshiruv→sort qarori
- Isbot: submit-inspection 3-qaror + sort_grade (qc_inspections.sort_grade) + grade-pricing mavjud; qayta-inspeksiya rework loop bor (qc-rework.listener). Lekin 'qaytgan tovar' uchun maxsus qayta-tekshiruv oqimi alohida qurilmagan.

**09.31  🟡 qisman**  — ❓ EP-QC-068 (v2 Q38) Qaytgan/karantin tovar alohida zonaga (QC qaror bermaguncha)?
- Siz: Alohida karantin zona/status, QC qaror bermaguncha sotishga chiqmaydi
- Isbot: WMS'da QUARANTINE/QC/DEFECTIVE ombor turlari bor (POS Q29); qc-passed.listener faqat pass'da FG omborga o'tkazadi. Lekin karantin→QC→yaroqli status-oqimi QC tomonda alohida jadval bilan emas, listener-darajasida; 0 qator.

**09.32  ❌ yo'q**  — ❓ EP-QC-069 (v2 Q39) Qaytarish sabablari klassifikatori + ayb tomoni (zavod/mijoz/logistika)?
- Siz: Sabab klassifikatori + ayb tomoni — adolatli xarajat taqsimi
- Isbot: Qaytarish-sabab klassifikatori + ayb-tomoni jadval/kod topilmadi. Doc 🔵 OCHIQ — qurilmagan.

**09.33  🟡 qisman**  — ❓ EP-QC-070 (v2 Q40) Qaytarish→Finance kredit-nota avtomatik (summa=miqdor×narx)?
- Siz: Qaytarish qabul→kredit-nota avtomatik Finance'da
- Isbot: Finance modulida kredit-nota oqimi mavjud (entries); grade-pricing summa hisoblaydi. Lekin QC qaytarish→Finance kredit-nota avtomatik event-ulanishi QC tomonda isbotlanmadi (0 qator). Doc ✅ deydi, jonli bo'sh.

**09.34  ✅ bor**  — ❓ EP-QC-071 (v2 Q41) Karantin/blok status (tayyor partiya→karantin→QC→yaroqli/brak/2-sort)?
- Siz: Har tayyor partiya boshida karantin→QC tasdiqi→yaroqli/brak/2-sort
- Isbot: submit-inspection.handler 3-qaror (passed/rework/failed) + sort_grade; qc-passed.listener faqat tasdiqdan keyin warehouse_stock UPSERT. Karantin→QC→holat oqimi listener bilan REAL wired (golden-thread QC→WMS).

**09.35  🔑 egasi-data**  — ❓ EP-QC-072 (v2 Q42) Sort darajalari (1/2/3-sort/brak) + narx koeffitsienti?
- Siz: Sort darajalari + har biriga narx koeffitsienti — daromad oshadi
- Isbot: grade-pricing.service.ts QualityGrade enum (FIRST/SECOND/THIRD/SCRAP) + GradeCoefficientMap; qc_grade_price_coefficients jadval 4 qator (jonli!). Struktura+formula TAYYOR, koeffitsient QIYMATI egasi-data (SOXTA fallback yo'q).

**09.36  ❌ yo'q**  — ❓ EP-QC-073 (v2 Q43) O'lchov asboblari kalibrovkasi (sana+keyingi muddat+ogohlantirish)?
- Siz: Har asbobga kalibrovka sanasi+muddat+'muddat o'tdi→ishlatmang'
- Isbot: qc_instrument/calibration jadval YO'Q; QC modulida calibrat/kalibrov grep=0 natija. Doc 🔵 OCHIQ, action=CRON — qurilmagan.

**09.37  🟡 qisman**  — ❓ EP-QC-074 (v2 Q44) Laborant nazorat jurnali (kim+sana+asbob+smena) avtomatikmi?
- Siz: Har o'lchovga avtomatik laborant+sana+asbob+smena
- Isbot: AuditInterceptor barcha QC controller'larda (@UseInterceptors) — kim/qachon yozadi; qc_lab_tests.tested_by ustun. Lekin 'asbob+smena' avtomatik biriktirish yo'q (asbob jadvali yo'q). Qisman.

**09.38  ❌ yo'q**  — ❓ EP-QC-075 (v2 Q45) Retest qoidasi (chegara zonasida 2 qo'shimcha namuna, o'rtacha hal qiladi)?
- Siz: Chegara zonasida 2 qo'shimcha namuna, o'rtachasi hal, izga yoziladi
- Isbot: Retest mantig'i QC modulida topilmadi (grep retest=0). Doc 🔵 OCHIQ — qurilmagan.

**09.39  🟡 qisman**  — ❓ EP-QC-076 (v2 Q46) Normalar texkartaga bir marta yoziladi, har buyurtma shundan tortadimi?
- Siz: Norma mahsulot kartasi/texkartaga bir marta, har buyurtma tortadi
- Isbot: qc_standards + qc_parameters (min/max/target) jadval + standards CRUD endpoint (qc-extended.controller.ts:46-87). Lekin texkarta↔QC-norma avtomatik tortish bog'lanishi (technology_cards FK) isbotlanmadi; 0 qator standards.

**09.40  ✅ bor**  — ❓ EP-QC-077 (v2 Q47) Sifat KPI paneli (brak%/reklamatsiya/stanok-smena brak/FTQ/qaytarish%)?
- Siz: Sifat paneli: oylik brak%, reklamatsiya, stanok/smena brak, FTQ, qaytarish%
- Isbot: qc-new.controller.ts:91 GET /qc/dashboard (getDashboard); qc-defects-extended.controller.ts:129,136 dashboard/stats + dashboard/flow; qc-dpmo.controller.ts DPMO. Real endpoint'lar.

**09.41  🟡 qisman**  — ❓ EP-QC-078 (v2 Q48) Yetkazib beruvchi sifat reytingi (kirim brak%+kechikish+sertifikat)?
- Siz: Har yetkazuvchiga reyting (sifat 40/muddat 30/narx 20/hujjat 10, 6-oy oyna)
- Isbot: qc-new.repository.ts:478 getSupplierRatings — qc_supplier_quality'dan avg score (approved=100/conditional=60/else=0) + totalDefects/Samples. REAL aggregat, LEKIN doc'dagi 40/30/20/10 + 6-oy sliding-window formula EMAS (soddalashgan status-avg). Qisman.

**09.42  🟡 qisman**  — ❓ EP-QC-079 (v2 Q49) Foto/dalil biriktirish (brak/reklamatsiya/qaytarishda kamida 1 majburiy)?
- Siz: Kamida 1 foto majburiy + cheksiz qo'shimcha
- Isbot: POS inspeksiya Checklist+Foto (Q29); Storage modul mavjud. QC brak/reklamatsiyada foto MAJBURIY gate kodi isbotlanmadi (0 qator). Mexanizm bor, majburiylik tasdiqlanmadi.

**09.43  🟡 qisman**  — ❓ EP-QC-080 (v2 Q50) Oziq-ovqat xavfsizlik tekshiruvi + maxsus sertifikat majburiymi?
- Siz: Oziq-ovqat mahsulotga alohida xavfsizlik tekshiruvi + maxsus sertifikat
- Isbot: defect_catalog/material tur mavjud; EP-QC-092 makulatura→oziq-ovqat blok bilan bog'liq. Lekin oziq-ovqat 'alohida xavfsizlik tekshiruvi + maxsus sertifikat' gate kodi QC'da isbotlanmadi.

**09.44  🟡 qisman**  — ❓ EP-QC-081 (v2 Q51) Partiya traceability (xom-ashyo→stanok→smena→tayyor→mijoz)?
- Siz: Har partiyaga to'liq zanjir, reklamatsiyada ildizgacha kuzatish
- Isbot: qc-passed.listener FG receipt batchNumber=`QC-${inspectionId}` (inspeksiyaga bog'liq iz); wms_supplier_traceability jadval bor (0 qator). LEKIN to'liq JOIN-zanjir (xom-ashyo lot→stanok→smena→mijoz) QC-side rekonstruksiya kodi yo'q. Qisman.

**09.45  🟡 qisman**  — ❓ EP-QC-082 (v2 Q52) QC override (faqat boshliq/director + sabab + jurnal + mijoz ogoh)?
- Siz: Faqat sifat boshlig'i/director override + majburiy sabab + jurnal
- Isbot: RolesGuard QC_WRITE_ROLES (QC_MANAGER/director/super_admin) ruxsatni cheklaydi; AuditInterceptor jurnal yozadi. Lekin maxsus 'qc:override' permission + majburiy sabab + mijoz-ogohlantirish kodi yo'q (doc EP-QC-035 qc:override taklif).

**09.46  🟡 qisman**  — ❓ EP-QC-083 (v2 Q53) 'Брак сони' har operatsiya yopilishida majburiy maydonmi?
- Siz: Har operatsiya 'tamom' tugmasi brak sonini+sabab so'raydi (Excel→ERP)
- Isbot: qc_braks jadval + braks POST (qc-defects-extended.controller.ts:77); qc-extended createInProcessInspection defects_found oladi. Lekin MES operatsiya-yopilish 'tamom' tugmasiga brak-soni majburiy gate ulanishi isbotlanmadi (0 qator).

**09.47  🟡 qisman**  — ❓ EP-QC-084 (v2 Q54) Plan vs Fakt brak% chegara (≤2%) avtomatik anomaliya?
- Siz: Brak%=brak÷plan, operatsiyaga norma-chegara, oshsa anomaliya
- Isbot: qc-extended.controller.ts:115 defectRate=(defectQty/sampleQty)*100 hisoblanadi, >5% qattiq fail. Lekin operatsiya-turi bo'yicha norma-chegara (Резка≠Тигель) konfiguratsiyasi yo'q (🔵 OCHIQ); cron-anomaliya qurilmagan.

**09.48  🟡 qisman**  — ❓ EP-QC-085 (v2 Q55) Brakni operatsiya turiga ko'ra ajratish (Резка/Печать/Высечка/Кляй...)?
- Siz: Har operatsiya turiga alohida brak hisobi (Bandlik.xlsx ro'yxati)
- Isbot: qc_braks jadval + defect-detector.service + check_point maydoni (in-process inspection); defect_catalog.direction (universal/...) bor. Lekin operatsiya-turi (Резка/Высечка) kesim klassifikatori 23 qator universal defektlardan iborat, operatsiya-spetsifik kesim 0 qator.

**09.49  🟡 qisman**  — ❓ EP-QC-086 (v2 Q56) Brakni smena(ден/ноч)+оператор/помошник kesimida (reytingga)?
- Siz: Смена+оператор+помошник kesimida brak, reytingga ulanadi
- Isbot: qc_inspections.inspector_id + shift_handovers mavjud; karta-model GSD vizyon. Lekin operator/помошник kesim brak→GSD avtomatik ulanish kodi isbotlanmadi; 0 qator inspections.

**09.50  ❌ yo'q**  — ❓ EP-QC-087 (v2 Q57) Приладка (sozlash) brakini alohida hisoblash (norma-chegara)?
- Siz: Приладка brakini alohida turkum (mashina kesimida, norma bilan)
- Isbot: Приладка/setup-waste alohida turkum kodi QC'da topilmadi (grep приладка=0). spoilage.service mavjud lekin приладка-spetsifik emas. Qurilmagan.

**09.51  ❌ yo'q**  — ❓ EP-QC-088 (v2 Q58) Downtime (бекор туриш)→keyingi приладка brakiga bog'lanadimi?
- Siz: Downtime hodisasi keyingi priladka brakiga bog'lanadi (sabab-zanjir)
- Isbot: Downtime↔brak sabab-zanjir kodi topilmadi. MES downtime alohida; QC bog'lanish 0. Doc ✅ deydi, qurilmagan.

**09.52  ❌ yo'q**  — ❓ EP-QC-089 (v2 Q59) Brak limitidan oshsa avtomatik to'xtatish + QC qarori?
- Siz: Brak limit oshsa avtomatik to'xtatish + QC qarori (davom/to'xtat/sozlash)
- Isbot: Brak-limit→MES to'xtatish (WebSocket signal) kodi topilmadi. Doc ✅ deydi (EP-QC-036 decision-answers), lekin jonli mexanizm qurilmagan.

**09.53  ❌ yo'q**  — ❓ EP-QC-090 (v2 Q60) Operatsiyalararo brak ajratish (kirim braki vs shu-bosqich braki)?
- Siz: Har operatsiya 'kirim braki'(oldingi) va 'shu bosqich braki'ni ajratadi
- Isbot: Kirim-braki vs shu-bosqich braki ajratish maydoni/kodi topilmadi. Doc 🔵 OCHIQ — qurilmagan.

**09.54  ❌ yo'q**  — ❓ EP-QC-091 (v2 Q61) Топлайнер vs Тестлайнер normasi qog'oz turiga bog'lanadimi (raw_materials'dan)?
- Siz: QC normasi qog'oz turiga (Топлайнер/Тестлайнер/Меловка alohida tolerans), raw_materials'dan avtomatik
- Isbot: Qog'oz-turi→QC-norma avtomatik bog'lanish (raw_materials) kodi topilmadi. qc_parameters category bor lekin qog'oz-turi tolerans differensiatsiyasi 0. Qurilmagan.

**09.55  ❌ yo'q**  — ❓ EP-QC-092 (v2 Q62) Oziq-ovqatga makulatura tanlansa QC blok + ogohlantirish?
- Siz: Oziq-ovqat buyurtmaga makulatura qog'oz→QC blok (xavfsizlik kafolati)
- Isbot: Makulatura↔oziq-ovqat blok gate kodi topilmadi (texkarta material-tanlash darvozasi). Doc ✅ (kitob qoidasi aniq) lekin jonli mexanizm qurilmagan.

**09.56  🟡 qisman**  — ❓ EP-QC-093 (v2 Q63) Грамаж (g/m²) normasini kirimda o'lchov bilan tekshirish (170-350 / 70-90)?
- Siz: Texkarta грамаж ±tolerans kirim QC'da o'lchov bilan
- Isbot: qc_parameters min/max/target + qc_material_tests jadval bor (kirim test infrastrukturasi). Lekin грамаж diapazonlari (белый 170-350 g/m²) seed yo'q (qc_parameters 0 qator); kirim-blok ulanishi isbotlanmadi. 🔑 egasi-data raqamlar.

**09.57  ❌ yo'q**  — ❓ EP-QC-094 (v2 Q64) Микро turi (E/B/C, 2/5-слой)→ECT/BCT normaga bog'lanadimi?
- Siz: QC mustahkamlik testi gofra turiga (E/B/C, qatlam→ECT/BCT normasi)
- Isbot: Gofra-turi (E/B/C makro)→ECT/BCT norma bog'lanish kodi/seed topilmadi. qc_parameters bo'sh. Qurilmagan; egasi-data.

**09.58  ❌ yo'q**  — ❓ EP-QC-095 (v2 Q65) Местный/импорт qog'oz almashish xatosini operatsiya boshida QC ushlaydimi (texkarta↔material kod)?
- Siz: Operatsiya boshida QC техкарта-material↔chiqarilgan material kodini solishtiradi, mos kelmasa blok
- Isbot: Texkarta-material↔chiqarilgan-material kod solishtirish gate kodi topilmadi. Kitob real misol (Abdullaev) lekin jonli mexanizm yo'q. Qurilmagan.

**09.59  ❌ yo'q**  — ❓ EP-QC-096 (v2 Q66) QC normasi mahsulot oilasiga (KT/PT/E prefiks) avtomatik bog'lanadimi?
- Siz: QC normasi KT/PT/E oilaga avtomatik bog'lanadi
- Isbot: KT/PT/E prefiks→QC-norma avtomatik tanlanish kodi topilmadi (material_cards). Qurilmagan; doc CREATE.

**09.60  🟡 qisman**  — ❓ EP-QC-097 (v2 Q67) Ламинация/лак alohida nuqson checklisti (yopishish/pufak/tekislik)?
- Siz: Ламинация/лак operatsiyasiga alohida nuqson checklisti
- Isbot: qc_checkpoints (stage) + in-process inspection check_point maydoni mavjud (struktura); defect-detector.service. Lekin Ламинация/лак-spetsifik checklist seed yo'q (0 qator). Struktura bor, data yo'q.

**09.61  🟡 qisman**  — ❓ EP-QC-098 (v2 Q68) Окошка/оынакча yopishish nazorati (joylashuv/yopishish/tozalik)?
- Siz: Оынакча operatsiyasiga alohida nuqson nazorati
- Isbot: qc_checkpoints/check_point struktura operatsiya-spetsifik checklist'ga imkon beradi; lekin Окошка/оынакча seed checklist 0 qator. Struktura bor, data yo'q.

**09.62  🟡 qisman**  — ❓ EP-QC-099 (v2 Q69) Кашировка ko'chish/qiyshiqlik+registratsiya tolerantsiyasi?
- Siz: Кашировка registratsiya/qiyshiqlik tolerantsiyasi + yopishish nazorati
- Isbot: qc_checkpoints + qc_parameters (tolerans struktura) mavjud; Кашировка-spetsifik norma seed yo'q. Struktura bor, data yo'q (0 qator).

**09.63  🟡 qisman**  — ❓ EP-QC-100 (v2 Q70) Тиснение/Конгрев/фольга sifat checklisti (chuqurlik/qoplash/registratsiya)?
- Siz: Premium pardoz operatsiyalariga alohida checklist
- Isbot: qc_checkpoints struktura operatsiya-checklist'ga imkon beradi; premium-pardoz seed yo'q. Struktura bor, data 0.

**09.64  🟡 qisman**  — ❓ EP-QC-101 (v2 Q71) Высечка/Тигель/Беговка o'lcham+begovka pozitsiyasi nazorati (tolerans)?
- Siz: Kesish/biguv operatsiyalariga o'lcham+begovka pozitsiya tolerantsiyasi
- Isbot: qc_parameters geometrik tolerans (min/max) struktura + defect_catalog 'Noto'g'ri o'lcham' (CRITICAL, ±2mm, auto_reject) seed bor. Lekin Высечка/Беговка-spetsifik norma seed yo'q. Qisman.

**09.65  🟡 qisman**  — ❓ EP-QC-102 (v2 Q72) Литсо/оборот (A/B tomon) bosma registratsiya/moslik normasi?
- Siz: Ikki tomonli bosmada registratsiya/moslik QC normasi
- Isbot: delta-e.service + vision-qc (rang/registratsiya AI) mavjud; bosma-sifat blok (EP-QC-036). Lekin A/B-tomon registratsiya-moslik spetsifik norma kodi/seed yo'q. Qisman.

**09.66  ❌ yo'q**  — ❓ EP-QC-103 (v2 Q73) Etiketka/самоклей (E) alohida QC normasi (yopishish/kesish/ko'chish)?
- Siz: Etiketka/самоклейga alohida QC normasi
- Isbot: Etiketka (E)-spetsifik QC norma kodi/seed topilmadi. qc_parameters bo'sh. Qurilmagan; egasi-data.

**09.67  🟡 qisman**  — ❓ EP-QC-104 (v2 Q74) Подписной лист (mijoz tasdig'i) QC etaloniga aylanadimi (final solishtirish)?
- Siz: Tasdiqlangan namuna (подписной лист fayli) QC etaloni — obyektiv solishtirish
- Isbot: vision-qc.service etalon-rasm bilan deltaE qiyoslaydi (AI kamera); cached.alternatives etalon-asosli. Lekin подписной лист fayl-biriktirish→QC etalon jadval/oqimi QC'da yo'q (Dizayn modulda bo'lishi mumkin). Qisman.

**09.68  ❌ yo'q**  — ❓ EP-QC-105 (v2 Q75) Pre-production checklist (material+qolip+fayl+namuna+грамаж) to'ldirilmaguncha ishlab-chiqarish ochilmaydimi?
- Siz: Majburiy pre-production checklist — to'ldirilmaguncha ishlab chiqarish ochilmaydi (eng arzon nazorat)
- Isbot: Pre-production checklist→MES-ochilish gate kodi topilmadi. qc_checkpoints stage='incoming' struktura bor lekin gate-ulanish 0. Doc APPROVE lekin qurilmagan.

**09.69  ❌ yo'q**  — ❓ EP-QC-106 (v2 Q76) Qolip (СТП/кесувчи) reestri + holat/eskirish + 'qaysi qolip qaysi brak'?
- Siz: Qolip reestri + holat nazorati + qolip↔brak bog'lanishi (ildiz sabab)
- Isbot: Qolip-reestri/holat jadval QC'da topilmadi (Dizayn modulda qolip bo'lishi mumkin). qolip↔brak bog'lanish 0. Qurilmagan.

**09.70  🟡 qisman**  — ❓ EP-QC-107 (v2 Q77) Brak sabab-toifasi (дизайн/ишлаб-чиқариш/материал/қолип/оператор/режа) o'z bo'limiga ulanadimi?
- Siz: Brak sabab-toifasi 6 manba, har biri o'z bo'limiga ulanadi
- Isbot: qc_root_causes jadval + root-causes CRUD (category maydoni bilan) — sabab-toifa strukturasi REAL (qc-extended.controller.ts:162-189). Lekin 6 toifa seed + bo'limga avtomatik ulanish 0 qator. Struktura bor, data/ulanish yo'q.

**09.71  🟡 qisman**  — ❓ EP-QC-108 (v2 Q78) Конструктор tasdig'i QC zanjiriga (struktura/yig'ilish)?
- Siz: Yangi struktura/qolipga конструктор tasdig'i QC zanjirida
- Isbot: qc_approvals jadval + approvals endpoint (bosqichli tasdiq) struktura; lekin конструктор-spetsifik tasdiq roli/oqimi 0. Org-struktura 5-Dept bilan ulanishi isbotlanmadi.

**09.72  🟡 qisman**  — ❓ EP-QC-109 (v2 Q79) 5-Departament ichida QC roli mustaqil ajratilganmi (dizayn/rejadan)?
- Siz: QC(ОТК) alohida rol — 5-Dept ichida, dizayn/rejadan mustaqil tasdiq huquqi
- Isbot: RBAC rollar: QC_MANAGER/qc_inspector/qc_manager + QC_SPECIALIST (roles.constants); QC_WRITE_ROLES vs QC_FLOOR_ROLES ajratilgan (qc-extended.controller.ts:30-31). Rol-darajada bor, lekin org-struktura 5-Dept mustaqillik chegarasi (EP-QC-109 print) jonli isbotlanmadi (org data bo'sh).

**09.73  🟡 qisman**  — ❓ EP-QC-110 (v2 Q80) 'Кўп учрайдиган хатолар' QC defekt-master'iga import (kitob asosida)?
- Siz: Har bo'lim 'tez-tez uchraydigan xatolar' QC defekt-master'iga import — real amaliy
- Isbot: defect_catalog 23 qator seed qilingan (DEF-U-001..., name_uz/name_ru, severity, corrective_action_uz) — REAL master-data. Lekin bu universal defektlar; kitobdagi bo'lim-spetsifik 'кўп учрайдиган хатолар' to'liq import emas (faqat universal 23).

**09.74  🟡 qisman**  — ❓ EP-QC-111 (v2 Q81) Har QC qaroriga raqamli imzo (kim tekshirdi+tasdiqladi+sana/vaqt)?
- Siz: Har QC qaroriga raqamli imzo — javobgarlik yozma (imzo madaniyati)
- Isbot: AuditInterceptor barcha QC controller'larda (kim/qachon avtomatik audit); inspector_id qc_inspections'da. Lekin ikki-bosqich imzo (tekshirdi+tasdiqladi alohida) struktura QC'da yo'q — faqat bitta inspector_id + audit. Qisman.

**09.75  🟡 qisman**  — ❓ EP-QC-112 (v2 Q82) Brak/qoldiq qog'oz omborda alohida turkum (qayta-ishlatish/utilizatsiya)?
- Siz: Brak/qoldiq qog'oz alohida turkum — material balansi to'g'ri
- Isbot: qc_braks.cost_impact + WMS DEFECTIVE ombor turi (POS); makulatura kirim event (EP-QC-049 decision). Lekin brak-material→ombor alohida-turkum avtomatik kirim oqimi QC tomonda isbotlanmadi. Qisman.

**09.76  🟡 qisman**  — ❓ EP-QC-113 (v2 Q83) Тошдан (tashqi ish) kelgan mahsulotni kirim QC'da tekshirish?
- Siz: Тош/tashqi ish kirimda majburiy QC (supplier kabi, reyting bilan)
- Isbot: qc_supplier_quality + supplier-quality POST endpoint kirim-QC strukturasini beradi; тош-spetsifik tashqi-ish kirim oqimi alohida emas, umumiy supplier-QC orqali. Qisman (0 qator).

**09.77  ❌ yo'q**  — ❓ EP-QC-114 (v2 Q84) Material lot/rulon↔buyurtma↔brak/reklamatsiya to'liq bog'lanadimi?
- Siz: Material lot↔buyurtma↔brak to'liq — ildizgacha, ommaviy reklamatsiya oldini oladi
- Isbot: qc-passed.listener batchNumber=QC-{inspectionId} iz qoldiradi; wms_supplier_traceability jadval bor (0 qator). Lekin material-lot↔brak↔reklamatsiya to'liq JOIN-bog'lanish kodi yo'q. Qurilmagan.

**09.78  ❌ yo'q**  — ❓ EP-QC-115 (v2 Q85) Razmer revision→QC norma+qolip avtomatik yangi versiyaga bog'lanadimi?
- Siz: Razmer o'zgarishi QC normasi+qolipni avtomatik yangi versiyaga
- Isbot: Razmer-revision→QC-norma versiya bog'lanish kodi topilmadi. qc_standards versiya struktura bor lekin revision-trigger yo'q. Qurilmagan.

**09.79  🔑 egasi-data**  — ❓ EP-QC-116 (v2 Q86) Mahsulot toifasiga tolerans (dori 0%/oziq-ovqat past/sovg'a o'rta)?
- Siz: Mahsulot toifasiga ko'ra tolerans — risk-asosli (dori=0%)
- Isbot: qc_parameters/qc_standards (min/max/tolerans struktura) + defect_catalog auto_reject mavjud. Toifa-asosli tolerans QIYMATLARI (dori 0%) seed yo'q — egasi-data. Struktura bor, raqamlar kutiladi.

**09.80  🟡 qisman**  — ❓ EP-QC-117 (v2 Q87) Buyurtma '100% tayyor' faqat final QC 'o'tdi' bilanmi (yolg'on tayyorlik yo'q)?
- Siz: 100% tayyor statusi faqat final QC o'tdi bilan — yolg'on tayyorlik yo'q
- Isbot: qc-passed.listener final-inspeksiya 'passed' eventida FG receipt; rework loop. Lekin buyurtma-tayyorlik%↔final-QC sinxron gate (EP-QC-117 EVENT) MES-tomonda isbotlanmadi. Qisman.

**09.81  ✅ bor**  — ❓ EP-QC-118 (v2 Q88) QC 'qayta ishlab chiqarish'→avtomatik reja ishi+material so'rovi?
- Siz: QC rework qarori→avtomatik reja ishi+material so'rovi — yo'qolmaydi
- Isbot: qc-rework.listener.ts QcReworkEvent→production_orders status='rework' (UPDATE, idempotent), MES qayta-rejalashtiradi. Golden-thread QC→PP REAL wired (jonli izoh: inspection order_id 48/49/50⇔production_orders).

**09.82  🟡 qisman**  — ❓ EP-QC-119 (v2 Q89) QC skip (ruxsatsiz o'tib ketish) avtomatik aniqlanadimi + kim sababchi?
- Siz: QC skip avtomatik aniqlanadi+belgilanadi+kim sababchi — xavfli teshik ko'rinadi
- Isbot: mes-completed.listener (MesCompletedListener QC modulda) MES operatsiya tugashida QC holatini tekshiradi (qc.module.ts:77). Lekin 'skip avtomatik aniqlanadi + sababchi' to'liq belgilash kodi isbotlanmadi. Qisman.

**09.83  🟡 qisman**  — ❓ EP-QC-120 (v2 Q90) Smena topshirish sifat yozuvi (yarim ish+ochiq brak+mashina holati)?
- Siz: Majburiy smena-topshirish yozuvi — uzilish yo'q
- Isbot: shift_handovers jadval + quality_issues ustun mavjud (jonli tekshirildi); mes_shift_handovers VIEW. Lekin 'ochiq brak'(pending inspeksiya+rework+karantin) agregatsiya QC-tomon kodi isbotlanmadi; 0 qator.

**09.84  🟡 qisman**  — ❓ EP-QC-121 (v2 Q91) Sifat (брак%) operator oyligiga ulanadimi (yuqori brak→bonus kamayadi)?
- Siz: Oylik=miqdor(норма%)+sifat(брак%) birga — sifat rag'batlanadi
- Isbot: karta-model GSD→oylik vizyon (memory); EP-QC-023 sifat→GSD event. HR/Payroll razryad-koeff mavjud. Lekin брак%→operator-oylik avtomatik ulanish QC-tomon event isbotlanmadi (0 qator inspections). Qisman.

**09.85  ❌ yo'q**  — ❓ EP-QC-122 (v2 Q92) Internal vs external brak ajratish (QC samaradorligi nisbati)?
- Siz: Internal(sex)/external(mijoz) brak ajratiladi — nisbat=QC samaradorligi
- Isbot: Internal/external brak ajratish maydoni/kodi topilmadi. qc_braks va qc_reclamations alohida lekin 'QC samaradorligi nisbati' hisoblash yo'q. Qurilmagan.

**09.86  🟡 qisman**  — ❓ EP-QC-123 (v2 Q93) Sifat-sababli chegirma/kompensatsiya COQ'ga qo'shiladimi?
- Siz: Chegirma/kompensatsiya COQ'ga (mijoz+buyurtma kesimida) — to'liq yo'qotish
- Isbot: qc_braks.cost_impact + getBrakCostImpact endpoint (qc-defects-extended.repository.ts:39,94 SUM(cost_impact)) — COQ qisman. Lekin chegirma/kompensatsiya COQ'ga qo'shilishi alohida emas. Qisman.

**09.87  🟡 qisman**  — ❓ EP-QC-124 (v2 Q94) Buyurtma yopilishida avtomatik sifat xulosasi (plan/fakt/брак/operatsiya/final)?
- Siz: Buyurtma yopilishida avtomatik sifat xulosasi — yakuniy tahlil
- Isbot: dashboard/flow + braks/stats endpoint (qc-defects-extended.controller.ts:61,136) agregatsiya beradi. Lekin buyurtma-yopilish event'ida avtomatik yakuniy-xulosa generatsiya (EP-QC-124 EVENT) isbotlanmadi. Qisman.

**09.88  🟡 qisman**  — ❓ EP-QC-125 (v2 Q95) Sifat kunlik/haftalik xulosa egaga avtomatik (Telegram)?
- Siz: Avtomatik kunlik+haftalik sifat xulosasi egaga Telegram
- Isbot: bot-gateway/bots/qc.bot.ts mavjud (QC Telegram bot); qc-failed-notification.listener (QcFailedEvent→notify). Lekin kunlik/haftalik CRON-digest egaga avtomatik yuborish kodi isbotlanmadi. Qisman.

**09.89  🟡 qisman**  — ❓ EP-QC-126 (v2 Q96) AI brak-riskini oldindan bashorat (material+operator+mashina+смена)?
- Siz: AI brak-riskini oldindan baholaydi + buyurtmaga risk-belgi
- Isbot: ai-agents/qc/vision-qc.service (AI kamera deltaE/confidence) + quality-agent.service mavjud (AI infra REAL). Lekin material+operator+mashina+смена naqshidan PROAKTIV brak-risk bashorat (rule/ML) kodi isbotlanmadi. Qisman.

**09.90  🟡 qisman**  — ❓ EP-QC-127 (v2 Q97) Takrorlanuvchi defekt chegaradan oshsa avtomatik CAPA (mas'ul+muddat)?
- Siz: Takrorlanish oshsa avtomatik CAPA ishi+mas'ul+muddat — Совершенствование Kanban
- Isbot: qc_root_causes (8D/ildiz-sabab) + root-causes CRUD REAL. Lekin 'takrorlanish-chegarasi oshsa avtomatik CAPA→Kanban Совершенствование' cron-trigger kodi isbotlanmadi. Qisman.

**09.91  🟡 qisman**  — ❓ EP-QC-128 (v2 Q98) Davriy ichki sifat auditi (QC o'zini tekshirish)?
- Siz: Davriy ichki sifat auditi (jadval+checklist+topilma+tuzatuv)
- Isbot: vision-qc har-2-soat AI-audit (POS Q98) + DPMO/SPC cron infra mavjud. Lekin qc_internal_audits jadval/cron (choraklik/yillik) topilmadi. Qisman (AI-audit bor, formal ichki audit yo'q).

**09.92  ❌ yo'q**  — ❓ EP-QC-129 (v2 Q99) A-System/Excel brak tarixini ERP'ga import (bir martalik)?
- Siz: A-System/Excel brak tarixini ERP'ga import — trend uzilmaydi
- Isbot: A-System/Excel brak-tarix import skript/migration topilmadi. Doc CREATE. Bir-martalik import qurilmagan (egasi data + import ishi).

**09.93  🟡 qisman**  — ❓ EP-QC-130 (v2 Q100) Defekt lug'ati ko'p-tilli (UZ lotin+kirill+RU, fabrika atamasi)?
- Siz: Defekt lug'ati ko'p-tilli — ishchi tushunadi (Высечка/Брак)
- Isbot: defect_catalog.name_uz + name_ru + description_uz + corrective_action_uz mavjud (23 qator, jonli) — 2-til REAL. Lekin kirill (UZ-cyr) alohida ustun yo'q (faqat uz-lotin + ru); doc 3-til talab qiladi. Qisman.

**09.94  ✅ bor**  — ❓ EP-QC-131 (v2 Q101) Rang nomuvofiqligi (цвет) etalon+tolerans har bosma operatsiyada?
- Siz: Rang etaloni+tolerans (vizual+asbob) har bosma operatsiyada — eng ko'p reklamatsiya
- Isbot: delta-e.service.ts (CIELab ΔE) + vision-qc.service verdictFromDeltaE (PASS/REWORK/SCRAP, AI_VISION_PASS/SCRAP_THRESHOLD) + ink-consumption — rang-etalon ΔE qiyoslash REAL kod. AI kamera etalon bilan solishtiradi.

**09.95  ❌ yo'q**  — ❓ EP-QC-132 (v2 Q102) Mijoz qabul/rad tarixi mahsulot+mijoz kesimida saqlanadimi?
- Siz: Har jo'natma qabul/rad/qaytarish tarixi (mijoz+mahsulot kesimida) — risk oldindan
- Isbot: Mijoz+mahsulot kesimida qabul/rad tahliliy-tarix jadval/kod topilmadi (CRM/qc_reclamations alohida). Tahliliy kesim qurilmagan. Doc CREATE.

**09.96  🟡 qisman**  — ❓ EP-QC-133 (v2 Q103) Brak sababiga 'режа/техкарта xatosi' qo'shiladimi (rejaga ulanadi)?
- Siz: Brak sabab-toifasiga режа/техкарта xatosi qo'shiladi — adolatli
- Isbot: qc_root_causes.category sabab-toifa strukturasini beradi (EP-QC-107 bilan birga). Lekin 'режа/техкарта xatosi' toifasi seed + rejalashtiruvchiga avtomatik ulanish 0 qator. Struktura bor, data yo'q.

**09.97  🟡 qisman**  — ❓ EP-QC-134 (v2 Q104) Tashqi/qonuniy sertifikat amal muddati kuzatiladimi (tugashdan oldin ogoh)?
- Siz: Sertifikat/normativ amal muddati kuzatiladi + tugashdan oldin ogohlantirish
- Isbot: certificates.expiry_date/expires_at + qc_certificate_templates.validity_days mavjud (struktura); lms certificate-expired event'lari bor. Lekin QC-tomon sertifikat-muddat→buyurtma blok + ogohlantirish CRON (EP-QC-134) isbotlanmadi. Qisman.

---

## 10 — WMS / Ombor  (vizyon 60%, 121 savol)

**10.1  ✅ bor**  — ❓ Rulon kartochkasida asosiy o'lchov maydonlari (kenglik/diametr/gramaj/og'irlik/uzunlik) bormi?
- Siz: A — Kenglik+Diametr+Gramaj+Og'irlik+Uzunlik to'liq (karton zavod yadrosi)
- Isbot: rulon_cards jadvali: width_mm, diameter_mm, grammage_gsm, initial_weight_kg, current_weight_kg, estimated_length_m (information_schema). Controller POST/GET/PATCH /wms/rulon-cards REAL ulangan (rulon-card.controller.ts:58-116).

**10.2  🟡 qisman**  — ❓ Gramaj g/m² standart tanlovli ro'yxat (80..300) bilanmi?
- Siz: A — g/m² tanlovli ro'yxat, xato kam
- Isbot: rulon_cards.grammage_gsm (integer) bor va REAL saqlanadi, lekin standart tanlovli ro'yxat (80/90/.../300) enum/seed sifatida kod yoki DB da topilmadi — erkin integer.

**10.3  ✅ bor**  — ❓ Rulon qoldig'i og'irlik (kg) asosida + uzunlik avto-hisob (gramaj×kenglik)?
- Siz: A — kg asosiy, uzunlik avto-hisob (tarozida o'lchash)
- Isbot: rulon-card.service.ts:132-167 updateCurrentWeight() yangi kg dan estimatedLengthM ni WmsRollCalcService orqali QAYTA hisoblaydi; current_weight_kg manfiy/initialdan oshmaydi tekshiruvi.

**10.4  ✅ bor**  — ❓ Yarim/ochilgan rulon statusi (To'liq/Ochilgan/Qoldiq) bormi va ochilgani avval taklif?
- Siz: A — status full/opened/remnant, ochilganlar avval (FIFO)
- Isbot: wms-rulon-card.constants.ts:13-27 RULON_STATUS_FULL/OPENED/REMNANT + o'tish grafigi; service og'irlik kamaysa full→opened avto-o'tkazadi (rulon-card.service.ts:159-165).

**10.5  ✅ bor**  — ❓ Har rulonga noyob ID + bosma yorliq (QR/barcode) beriladimi?
- Siz: A — noyob ID + QR/barcode yorliq, ombor xodimi/avto bosadi
- Isbot: rulon_cards.roll_code + qr_label ustunlari; generateRollCode() RULON-<yil>-<6-xona> avto-noyob, qrLabel=rollCode (rulon-card.service.ts:60-99). Roll code UNIQUE-konflikt 409 tekshiruvi.

**10.6  🟡 qisman**  — ❓ Rulon manbasi (yetkazib beruvchi + ishlab chiqaruvchi + sertifikat + kelgan sana) saqlanadimi?
- Siz: A — to'liq izlanuvchanlik (supplier+manufacturer+sertifikat+sana)
- Isbot: rulon_cards: supplier (text), certificate (text), received_date bor va saqlanadi. Lekin alohida 'manufacturer/ishlab chiqaruvchi' ustuni yo'q (supplier ichida).

**10.7  🟡 qisman**  — ❓ Rulon turi (kraft/test-layner/flyuting/beliy/makulatura) + qoplama maydoni bormi?
- Siz: A — tur + qoplama aniq tanlov (топлайнер╳местный ajratimi)
- Isbot: rulon_cards.roll_type (varchar) bor va REAL; CreateRulonCardInput.rollType majburiy. Lekin enum-cheklov (kraft/test-layner/...) va alohida 'qoplama/coating' maydoni kodda topilmadi.

**10.8  ✅ bor**  — ❓ Namlik (%) va saqlash sharti/zonasi maydoni bormi?
- Siz: A — namlik % + tavsiya saqlash zonasi (qog'oz namlikka sezgir)
- Isbot: rulon_cards: humidity_pct (numeric) + storage_zone (varchar) ustunlari; service humidityPct/storageZone ni saqlaydi (rulon-card.service.ts:109-110).

**10.9  🟡 qisman**  — ❓ Material asosiy toifalari (xom-ashyo/yordamchi/tayyor/yarim-tayyor/chiqindi) bormi?
- Siz: A — 5 toifa to'liq
- Isbot: material_cards.category + material_type ustunlari bor (REAL); ombor turlari warehouses (12 qator). Lekin 5-toifa qat'iy enum/seed sifatida kodda tasdiqlanmadi.

**10.10  🟡 qisman**  — ❓ Material kodlash tizimi (ma'noli artikul KR-125-1400) bormi?
- Siz: A — ma'noli kod + avto-tartib raqam (dublikat oldini olish)
- Isbot: material_cards.barcode bor; rulon roll_code ma'noli generatsiya (RULON-yil-rand). Lekin material-darajada KR-125-1400 ma'noli kod sxemasi (tur+gramaj+kenglik) kodda topilmadi — egasi-DATA kutadi (EP-WMS-041 OCHIQ).

**10.11  🟡 qisman**  — ❓ O'lchov birliklari + avto-konvertatsiya (kg↔m↔m²) bormi?
- Siz: A — asosiy kg + avto konvertatsiya gramaj/kenglik orqali
- Isbot: warehouse_stock.unit_of_measure/unit bor; WmsRollCalcService kg→m konvertatsiyani rulon uchun qiladi. Lekin umumiy material kg↔m² avto-konvertatsiya servisi kodda topilmadi (EP-WMS-042 OCHIQ).

**10.12  ✅ bor**  — ❓ Bir material — bir nechta yetkazib beruvchi (bitta karta, partiya darajasida beruvchi)?
- Siz: A — bitta material kartasi, kirim/partiya darajasida beruvchi
- Isbot: material_supplier_ratings jadvali (supplier_name + material_id) — bir material ko'p beruvchi; batch_lots/material_batches partiya darajasida beruvchi saqlash uchun mavjud.

**10.13  ✅ bor**  — ❓ ABC / muhimlik klassifikatsiyasi (avto yillik sarf×narx) bormi?
- Siz: A — ABC avtomatik hisoblanadi
- Isbot: material_cards.abc_segment ustuni + abc-xyz.service.ts (analytics/abc-xyz.service.ts) + wms-catalog ABC. EP-WMS-027/044 JAVOBLANGAN.

**10.14  🟡 qisman**  — ❓ Xavfli/maxsus material belgisi (yonuvchi/kimyoviy bayroq + alohida zona)?
- Siz: A — bayroqlar + alohida zona (yong'in xavfsizligi)
- Isbot: hazard_zones jadvali bor (hazard_type/hazard_level — ZONA darajasi). Lekin material_cards da is_flammable/hazard bayroq ustuni YO'Q — material-darajasi belgisi qurilmagan (EP-WMS-045 OCHIQ).

**10.15  ✅ bor**  — ❓ Kirim blankasi majburiy maydonlari (sana/beruvchi/hujjat/material/miqdor/partiya/qabul/javon)?
- Siz: A — to'liq blanka maydonlari
- Isbot: mm_goods_receipts: receipt_number, receipt_date, supplier_id/name, warehouse_id, purchase_order_id, status, qc_required_items, received_by ustunlari (information_schema).

**10.16  🟡 qisman**  — ❓ Kirim PO bilan 3-tomonlama solishtiriladimi (farq belgilanadi)?
- Siz: A — PO↔qabul↔schyot 3-way match
- Isbot: mm_goods_receipts.purchase_order_id FK bor (bog'lanish mavjud). Lekin avto 3-way-match farq hisoblash + tolerans% kodda to'liq tasdiqlanmadi; tolerans egasi-DATA (EP-WMS-047 OCHIQ).

**10.17  ✅ bor**  — ❓ Kirimda QC karantin darvozasi (avval karantin → QC OK → erkin zona)?
- Siz: A — avval karantin, QC OK → MAIN (eng xavfsiz)
- Isbot: WmsQuarantineGateService REAL majburlaydi: sendToQuarantine→applyQcDecision→releaseToMain; MAIN ga FAQAT QC_PASS dan o'tadi, aks holda BUSINESS_RULE_VIOLATION BLOK (wms-quarantine-gate.service.ts:88-106).

**10.18  🟡 qisman**  — ❓ Qisman qabul (qabul/rad miqdor alohida + rad sababi)?
- Siz: A — qabul/rad alohida + rad sababi
- Isbot: mm_goods_receipts da qc_passed_items/qc_required_items bor (qisman ko'rsatkich). Lekin to'liq qabul/rad-miqdor + rad-sababi modeli alohida tasdiqlanmadi (EP-WMS-049 OCHIQ).

**10.19  🟡 qisman**  — ❓ Kirim tarozi vazni va hujjat-vazn farqi (kg va %) avtomatikmi?
- Siz: A — hujjat vazni + tarozi vazni + farq avto
- Isbot: quarantine-gate.service.ts checkWeightTolerance() kutilgan vs haqiqiy og'irlik chetlanishini % hisoblaydi (±2% RECEIPT_WEIGHT_TOLERANCE). Bu vazn-farq mexanizmi REAL, lekin to'liq tarozi-blanka qaydi alohida emas.

**10.20  ✅ bor**  — ❓ Kim kirim qila oladi — faqat ombor mas'uli roli?
- Siz: A — faqat ombor mas'uli/qabul qiluvchi roli
- Isbot: Controllerlar @UseGuards(JwtAuthGuard,RolesGuard)+@Roles(warehouse_keeper/warehouse_manager/super_admin/director) bilan himoyalangan (rulon-card.controller.ts:41-45, wms-goods-issue.controller.ts:25-29).

**10.21  ✅ bor**  — ❓ Chiqim sababi turlari (ishlab chiqarish/sotuv/brak/sinov/qaytarish/ko'chirish)?
- Siz: A — to'liq sabab ro'yxati (movement turlari)
- Isbot: material_movements + wms_transactions (type OUT/IN), goods-issue handler ppId bog'lash; movements.service.ts + barcode_movements/batch_lot_movements jadvallar. POS Q21-26 movement turlari qamralgan.

**10.22  ✅ bor**  — ❓ Chiqim ishlab chiqarish buyurtmasiga (ish-naryad) majburiy bog'lanadimi?
- Siz: A — chiqim PP buyurtmaga majburiy (tannarx aniq)
- Isbot: GoodsIssueCommand.ppId maydoni + WmsGoodsIssuedEvent ppId bilan PP ga uzatiladi (goods-issue.handler.ts:35,85-90); recordIssue ppId ni saqlaydi.

**10.23  🟡 qisman**  — ❓ Norma (BOM) bilan haqiqiy sarf solishtiriladimi (ortiqcha sarf signal)?
- Siz: A — norma vs fakt farq %, ortiqcha ogohlantirish
- Isbot: texkarta tech_card_bom gate bor (outbound-enforcement), lekin norma-vs-fakt og'ish % hisoblash + signal kodda topilmadi; chegara egasi-DATA (EP-WMS-054/104 OCHIQ).

**10.24  ✅ bor**  — ❓ Chiqimda FIFO/FEFO qoidasi (muddatli→FEFO, muddatsiz→FIFO)?
- Siz: A — FIFO standart, kley/bo'yoqqa FEFO
- Isbot: BatchSelectionService.resolveStrategy(): anyDated→FEFO else FIFO; order() expiry/received ASC tartibli (batch-selection.service.ts:56-91). Goods-issue handler buni qo'llaydi.

**10.25  ✅ bor**  — ❓ Manfiy qoldiqdan himoya (mavjuddan ortiq chiqim bloklanadi)?
- Siz: A — manfiy BLOK (aktiv to'liq, iste'mol ogohlantirish)
- Isbot: issueFromWarehouseStock guarded — kamaytirish manfiyga ketolmaydi; batch buildPlan 'Partiyalarda yetarli qoldiq yo'q' xato qaytaradi (batch-selection.service.ts:150-154, goods-issue.handler.ts:114).

**10.26  🟡 qisman**  — ❓ Katta/qimmat chiqimni tasdiqlash (ikki imzo/rahbar)?
- Siz: A — summadan yuqori chiqim rahbar tasdig'i
- Isbot: Chiqim roli-bilan himoyalangan + AuditInterceptor; lekin summa/A-toifa chegarali ikki-imzo workflow kodda topilmadi; chegara egasi-DATA (EP-WMS-057/101 OCHIQ).

**10.27  🟡 qisman**  — ❓ Inventarizatsiya turi va chastotasi (aylanma + yiliga 1 to'liq)?
- Siz: A — aylanma sanoq + yiliga 1 to'liq, ish to'xtatilmaydi
- Isbot: inventory_counts jadvali count_type/count_date/status/variance bor + wms-counts.controller.ts ulangan. Lekin aylanma-vs-to'liq chastota avtomatikasi (ABC bog'liq) kodda tasdiqlanmadi — asosiy CRUD bor.

**10.28  ❌ yo'q**  — ❓ Sanoq usuli ko'r-sanoq (raqam yashirin) bormi?
- Siz: A — ko'r sanoq, halol natija
- Isbot: wms-counts.service.ts + i-wms-counts.repo.ts da 'blind/ko'r/yashirin' logikasi grep topilmadi; count-create DTO oddiy (warehouse_id/counted_by/notes). Ko'r-sanoq rejimi qurilmagan.

**10.29  🟡 qisman**  — ❓ Og'ish (farq) chegarasi va tasdiqlash (±1% avto, yuqori rahbar)?
- Siz: A — ±1% avto-tuzatish, yuqori rahbar tasdig'i + sabab
- Isbot: inventory_counts.total_variance/variance_items ustunlari bor (farq saqlanadi). Lekin ±1% chegara + avto-tuzatish/rahbar-tasdiq mantig'i kodda yo'q; % egasi-DATA (EP-WMS-060 OCHIQ).

**10.30  ❌ yo'q**  — ❓ Og'ish sababi majburiy ro'yxatdan tanlanadimi?
- Siz: A — sabab majburiy (o'lchov/o'g'irlik/namlik/...)
- Isbot: inventory_count_lines da variance bor, lekin variance-reason enum/majburiy ro'yxat kodda topilmadi (EP-WMS-061 OCHIQ — ro'yxat egasidan).

**10.31  ❌ yo'q**  — ❓ Inventarizatsiya vaqtida zona/material harakatini muzlatish?
- Siz: A — sanalayotgan zona muzlatiladi, tugagach ochiladi
- Isbot: wms-counts.service.ts da 'freeze/muzlat/lock zona' logikasi grep topilmadi. Muzlatish mexanizmi qurilmagan (EP-WMS-062 OCHIQ).

**10.32  🟡 qisman**  — ❓ Tarozi bilan rulon sanog'i (ochilgan tortiladi, to'liq kartochka vazni)?
- Siz: A — ochilgan rulon tortiladi, to'liq kartochka bo'yicha
- Isbot: rulon_cards current_weight_kg + updateWeight() qoldiq tortishni qo'llab-quvvatlaydi. Lekin inventarizatsiyada 'ochilgan→tortish majburiy, to'liq→kartochka' ajratuvchi sanoq logikasi yo'q (EP-WMS-063 OCHIQ).

**10.33  ✅ bor**  — ❓ Har materialga minimal qoldiq + tushganda avto-ogohlantirish?
- Siz: A — min qoldiq + avto-ogohlantirish
- Isbot: material_cards.min_stock + warehouse_stock.reorder_point ustunlari; min_stock_alerts jadvali (current_stock/min_stock/deficit/severity) + low_stock_alerts; get-low-stock.handler.ts REAL.

**10.34  🟡 qisman**  — ❓ Reorder nuqtasi + tavsiya buyurtma miqdori (sarf×lead-time)?
- Siz: A — reorder nuqtasi + tavsiya miqdor (aqlli)
- Isbot: warehouse_stock.reorder_point + rop.service.ts + eoq-calculator.service.ts + safety-stock.service.ts kod-darajada MAVJUD. Lekin sarf×lead-time avto-reorder miqdori uchun lead-time DATA egasidan (EP-WMS-065 OCHIQ).

**10.35  🟡 qisman**  — ❓ Maksimal qoldiq (ortiqcha zaxira) + oshganda ogohlantirish?
- Siz: A — max qoldiq + oshsa ogohlantirish
- Isbot: material_cards.max_stock + warehouse_stock.max_stock ustunlari REAL bor. Lekin oshganda ogohlantirish trigger/cron kodda tasdiqlanmadi (EP-WMS-066 OCHIQ).

**10.36  ❌ yo'q**  — ❓ Mavsumiy/dinamik min-max (oxirgi 3-6 oy sarfiga avto-qayta hisob)?
- Siz: A — dinamik avto-qayta hisob
- Isbot: safety-stock/rop servislari statik formula uchun; oxirgi 3-6 oy sarfidan dinamik avto-qayta hisob cron/AI kodda topilmadi (EP-WMS-067 OCHIQ).

**10.37  🔑 egasi-data**  — ❓ Yetkazib berish muddati (lead time) reorder hisobida ishlatiladimi?
- Siz: A — har beruvchiga lead time + xavfsizlik zaxirasi
- Isbot: safety-stock.service.ts + rop.service.ts lead-time qabul qiladigan formula kodi bor, lekin har beruvchi lead-time qiymati DATA sifatida kiritilmagan (EP-WMS-068 OCHIQ — egasi beradi).

**10.38  ✅ bor**  — ❓ Karantin sabablari ro'yxati (sifat/brak/namlik/reklamatsiya/muddat/hujjat)?
- Siz: A — to'liq sabab ro'yxati
- Isbot: WmsQuarantineGateService 5-bosqich + QC_DECISION_TO_STATUS (QABUL/REWORK/CHIQARISH); karantin holat-mashinasi REAL (wms-quarantine.constants.ts:53-77). Tashqi kirim har doim karantinga.

**10.39  ✅ bor**  — ❓ Karantindan chiqarish — faqat QC roli qaror (OK/Brak/Qaytarish)?
- Siz: A — faqat sifat nazorati roli qaror bilan
- Isbot: applyQcDecision() faqat KARANTIN holatida QABUL→QC_PASS/REWORK/CHIQARISH→REJECT; resolveQcDecision validatsiya (wms-quarantine-gate.service.ts:56-71).

**10.40  🟡 qisman**  — ❓ Karantin natijasi (OK→erkin/Past→arzon/Brak→chiqindi/Qaytarish→beruvchiga)?
- Siz: A — to'liq yo'l (4 natija)
- Isbot: QC_PASS→MAIN, REWORK→MES, REJECT→beruvchiga 3 yo'l REAL. Lekin 'past sifat→arzon ishga' 4-yo'li alohida kodda topilmadi (3 yo'l qamralgan).

**10.41  ❌ yo'q**  — ❓ Karantinda turish muddati + oshsa ogohlantirish?
- Siz: A — belgilangan kundan oshsa rahbarga ogohlantirish
- Isbot: Karantin holat saqlanadi, lekin maksimal-muddat + oshsa-ogohlantirish cron/trigger kodda topilmadi; muddat egasi-DATA (EP-WMS-072 OCHIQ).

**10.42  ✅ bor**  — ❓ Ombor topologiyasi (zona→qator→javon→yacheyka kod A-12-3-2)?
- Siz: A — to'liq struktura (aniq topish)
- Isbot: warehouse_zones (code/zone_type/capacity) + warehouse_bins (bin_code/row/shelf/level/zone_id) ustunlari REAL (information_schema). Struktura qurilgan (POS freeform ham mavjud).

**10.43  ✅ bor**  — ❓ Ichki ko'chirish blankasi (manba+maqsad+miqdor+xodim+sana)?
- Siz: A — ko'chirish harakati to'liq qaydi
- Isbot: WmsCreateInternalRequestSchema: material_id, from_warehouse_id, to_warehouse_id, quantity, notes (wms-counts.dto.ts:17-23); INTERNAL_TRANSFER movement turi + AuditInterceptor.

**10.44  ✅ bor**  — ❓ Bir nechta ombor/filial + ombor-aro ko'chirish kuzatuvi?
- Siz: A — har ombor alohida, ombor-aro ko'chirish harakat
- Isbot: warehouses jadvali 12 qator; warehouse_stock.warehouse_id bo'yicha har omborda alohida qoldiq; internal-request from/to warehouse ko'chirishni qamraydi.

**10.45  🟡 qisman**  — ❓ Yacheyka sig'imi va band/bo'sh holati + avto-joy taklifi?
- Siz: A — sig'im + band/bo'sh + avto-joy taklifi
- Isbot: warehouse_bins: max_weight, max_volume, current_occupancy ustunlari REAL bor (sig'im+band saqlanadi). Lekin avto-joy-taklifi algoritmi kodda tasdiqlanmadi (EP-WMS-076 OCHIQ).

**10.46  ✅ bor**  — ❓ Tayyor mahsulot zonasi alohida (sotuvga shu yerdan)?
- Siz: A — FG ombori alohida, EXTERNAL_OUT faqat shundan
- Isbot: warehouses turlari (FINISHED_GOODS) + receive-fg.handler.ts MES→FG kirim; warehouse_stock warehouse_id bo'yicha FG alohida. POS Q29 FINISHED_GOODS qamralgan.

**10.47  ✅ bor**  — ❓ Partiya (batch) raqami + chiqim partiyaga bog'lanadi (izlanuvchanlik)?
- Siz: A — har kirim=partiya, chiqim partiyaga (oldinga/orqaga izlash)
- Isbot: batch_lots + batches + material_batches + batch_lot_movements jadvallar; goods-issue.handler.ts decrementBatchLot(lotId,qty) har partiyani chiqimga bog'laydi (oldinga izlash).

**10.48  ✅ bor**  — ❓ Yaroqlilik muddati (kley/bo'yoq) + N kun ogohlantirish + o'tganda bloklash?
- Siz: A — yaroqlilik sanasi + ogohlantirish + bloklash
- Isbot: batch_lots.expiry_date; buildPlan() muddati o'tgan partiyani BLOK qiladi 'Muddati o'tgan partiya chiqarib bo'lmaydi (FEFO BLOK)' (batch-selection.service.ts:116-131). N-kun ogohlantirish sub-savol egasidan.

**10.49  🟡 qisman**  — ❓ Partiya bo'yicha sifat ko'rsatkichi (gramaj/namlik/mustahkamlik)?
- Siz: A — partiyaga QC natijalari (partiya pasporti)
- Isbot: batch_lots.quality_status maydoni issuable filtrida ishlatiladi; inventory_passports jadvali bor. Lekin partiyaga gramaj/namlik/mustahkamlik QC-natija biriktirish modeli to'liq tasdiqlanmadi (EP-WMS-080 OCHIQ).

**10.50  🟡 qisman**  — ❓ Partiyalarni aralashtirishga ruxsat (imkon qadar bitta, ogohlantirish bilan)?
- Siz: A — bitta partiyadan, kerak bo'lsa ogohlantirish bilan
- Isbot: buildPlan() bir nechta partiya bo'ylab span qiladi (aralashtirish texnik mumkin), lekin 'imkon qadar bitta partiyadan + aralashsa ogohlantirish' biznes-qoidasi kodda yo'q (EP-WMS-081 OCHIQ).

**10.51  🟡 qisman**  — ❓ Eski/harakatsiz zaxira (dead stock) avto-belgilanadimi?
- Siz: A — N kundan harakatsiz 'o'lik zaxira' + hisobot
- Isbot: warehouse_stock.last_movement_at ustuni bor (harakatsizlik o'lchash uchun) + abc-aging-expiry.service.ts aging. Lekin N-kun dead-stock avto-belgilash cron + N-chegara egasi-DATA (EP-WMS-082 OCHIQ).

**10.52  🟡 qisman**  — ❓ Qoldiq/oraliq kesindi (obrezka) qayta kirimga olinadimi?
- Siz: A — foydali obrezka qoldiq sifatida qayta kirimga
- Isbot: warehouse_roll_usage + rulon remnant status (qoldiq) bor; INTERNAL_RETURN movement. Lekin obrezka→qayta-kirim avto-oqimi alohida tasdiqlanmadi — struktura mavjud.

**10.53  ✅ bor**  — ❓ Texkarta-material mosligi tekshiruvi (mos kelmasa chiqim BLOK)?
- Siz: A — texkarta material kodi ≠ chiqarilayotgan → BLOK (топлайнер╳местный)
- Isbot: OutboundEnforcementService.checkIssueAllowed() — tech_card_bom mos kelmasa goods-issue BLOK (BUSINESS_RULE_VIOLATION, blockCode); goods-issue.handler.ts:63-77 REAL hard-gate.

**10.54  ✅ bor**  — ❓ Gofra qavatini aralashtirishdan himoya (3╳5 qavat)?
- Siz: A — har chiqim buyurtma+texkartaga bog'lanib, qavat mos kelmasa ogohlantirish
- Isbot: GoodsIssueCommand.issuedLayer + enforcement layer-check; goods-issue.handler.ts:40,66 gofra qavat mos kelmasa BLOK (EP-WMS-085 REAL ulangan).

**10.55  🟡 qisman**  — ❓ Poddon (palet) birligini hisobga olish?
- Siz: A — poddon=qadoq/transport birligi, ikki birlikda ko'rsatadi
- Isbot: ow_pallet_recoveries jadvali mavjud (poddon-tegishli). Lekin material chiqimida poddon-birligi + dona/kg ikki-birlik konvertatsiya kodda to'liq tasdiqlanmadi.

**10.56  🟡 qisman**  — ❓ Ichki transport so'rovi (rohler chaqirish) + kechikish izi?
- Siz: A — sex 'material kerak' so'rovi → rohlerchiga vazifa → bajarildi
- Isbot: WmsCreateInternalRequestSchema + internal-request status oqimi (wms-counts.dto.ts) ichki so'rovni qamraydi. Lekin rohlerchiga-vazifa + kechikish-izi/eskalatsiya alohida tasdiqlanmadi (EP-WMS-087).

**10.57  🟡 qisman**  — ❓ 'Bekor turish' sababini ombor-yetishmasligiga bog'lash (KPI)?
- Siz: A — downtime sababida 'material yetishmovchiligi (logistika)' alohida
- Isbot: WmsGoodsIssuedEvent PP/MES ga uzatiladi (bog'lanish bor). Lekin downtime-sabab-kodida 'logistika kechikishi' alohida KPI hisoblash MES tomonida — WMS A-yarmida tasdiqlanmadi (EP-WMS-088, MES bog'liq).

**10.58  🟡 qisman**  — ❓ Chiqindi va qoldiqni ajratib hisoblash (qayta-ishlatiladigan ╳ chiqindi)?
- Siz: A — qayta ishlatiladigan qoldiq (makulatura) ╳ chiqindi (utilizatsiya)
- Isbot: remnant status + INTERNAL_RETURN movement + makulatura material turi bor. Lekin ikki-turga (daromad makulatura ╳ utilizatsiya chiqindi) ajratuvchi alohida hisob kodda tasdiqlanmadi (EP-WMS-089).

**10.59  🟡 qisman**  — ❓ Местный (makulatura) qog'ozni alohida zaxira + ruxsat etilgan mahsulotlar?
- Siz: A — alohida kartochka + ruxsat etilgan mahsulotlar ro'yxati
- Isbot: material_cards alohida material-kartochka (makulatura turi) qo'llab-quvvatlaydi; texkarta-gate noto'g'ri materialни BLOK. Lekin 'ruxsat etilgan mahsulotlar ro'yxati' (substitute allow-list) alohida emas (EP-WMS-090/101 OCHIQ).

**10.60  🟡 qisman**  — ❓ Grammaj bo'yicha kirim tekshiruvi (namuna o'lchanadi, oshsa karantin)?
- Siz: A — namuna grammaji o'lchanadi, ±tolerans, oshsa karantin
- Isbot: checkWeightTolerance() ±2% og'irlik chetlanishini tekshiradi (umumiy vazn). Lekin gramaj-spetsifik (g/m²) namuna o'lchov + ±tolerans→karantin kodda alohida topilmadi — vazn-tolerans yaqin lekin gramaj emas (EP-WMS-091).

**10.61  ❌ yo'q**  — ❓ Import xom-ashyo yo'lda (in-transit: jo'natildi/bojxona/keldi) holati?
- Siz: A — import bosqichli holat + taxminiy kelish sanasi
- Isbot: in-transit/import-tracking jadval yoki mm_goods_receipts da transit/eta/customs ustuni topilmadi (faqat excel_import_batches — boshqa maqsad). Import in-transit qurilmagan (EP-WMS-092 OCHIQ).

**10.62  🔑 egasi-data**  — ❓ Import lead-time va valyuta narxi reorder hisobida?
- Siz: A — import/mahalliy bayroq + lead-time + valyuta
- Isbot: rop/safety-stock servislari lead-time formulani qo'llaydi; lekin import/mahalliy bayroq + valyuta-kurs DATA kiritilmagan (EP-WMS-093 OCHIQ — egasi beradi).

**10.63  🟡 qisman**  — ❓ Yetkazib beruvchi ishonchliligi reytingi (o'z vaqtida%/brak%/narx)?
- Siz: A — har kirim avto reytingga ta'sir (kechikdi/brak)
- Isbot: material_supplier_ratings jadvali (supplier_name/material_id/total_orders/total_quantity/total_amount) — reyting strukturasi REAL. Lekin har-kirim avto o'z-vaqtida%/brak% hisoblash trigger kodda tasdiqlanmadi (EP-WMS-094).

**10.64  ❌ yo'q**  — ❓ Import partiyasiga bojxona/sertifikat hujjat (GTD/invoys) biriktirish?
- Siz: A — har import partiyasiga fayl biriktiriladi
- Isbot: rulon/partiya certificate matni bor, lekin import partiyasiga GTD/invoys fayl-biriktirish (attachment) modeli topilmadi (EP-WMS-095 OCHIQ).

**10.65  ❌ yo'q**  — ❓ Avans to'lov va yetkazib berish bog'lanishi (yopilmagan avanslar)?
- Siz: A — buyurtma→avans→kirim solishtirish, yopilmagan avanslar ro'yxati
- Isbot: WMS A-yarmida avans↔kirim bog'lanish + yopilmagan-avans ro'yxati kodda topilmadi (Finance bog'liq, EP-WMS-096 OCHIQ).

**10.66  🟡 qisman**  — ❓ Tayyor mahsulotni mijozga jo'natish (отгрузка) hujjati avto-tuziladimi?
- Siz: A — jo'natish hujjati buyurtmaga bog'lanib avto (mijoz/mahsulot/miqdor/haydovchi)
- Isbot: EXTERNAL_OUT movement + FG ombor chiqimi bor; goods-issue ledger. Lekin to'liq отгрузка-hujjati (haydovchi/mashina bilan) avto-generatsiya WMS A-yarmida tasdiqlanmadi (EP-WMS-097, SD/Элтиб bog'liq).

**10.67  ❌ yo'q**  — ❓ Haydovchi va mashinani jo'natishga biriktirish?
- Siz: A — haydovchi+mashina raqami+chiqish vaqti+yetkazildi belgisi
- Isbot: Jo'natishga haydovchi/mashina biriktirish jadval/maydon WMS modulida topilmadi (Элтиб бериш/SD modulida bo'lishi mumkin, EP-WMS-098 OCHIQ).

**10.68  ✅ bor**  — ❓ EP-WMS-084: Texkarta material kodi ≠ chiqarilayotgan kod bo'lsa chiqim bloklanadimi (топлайнер kerak, местный chiqarilsa)?
- Siz: Tizim bloklaydi — texkarta-material mos kelmasa brak oldini oladi (kitob misoli)
- Isbot: outbound-enforcement.service.ts:104-131 tech_card_bom bilan taqqoslab BLOCK_TECH_CARD_MISMATCH; goods-issue.handler.ts:63-77 gate chiqimdan oldin chaqiriladi (BOM bo'sh=fail-open honest). tech_card_bom jonli mavjud (n=0, build)

**10.69  ✅ bor**  — ❓ EP-WMS-085: Gofra qavat (3╳5) aralashtirishdan himoya — boshqa qavat chiqarilsa bloklanadimi?
- Siz: Har chiqim texkartaga bog'lanadi; 5-qavat╳3-qavat aralashishi bloklanadi
- Isbot: outbound-enforcement.service.ts:106-116 bom_layer≠issuedLayer→BLOCK_GOFRA_LAYER_MISMATCH, goods-issue.handler issuedLayer uzatadi

**10.70  ❌ yo'q**  — ❓ EP-WMS-086: Poddon (palet) birligini alohida hisoblash (dona/kg + poddon)?
- Siz: Poddon=qadoq/transport birligi, ikki birlikda ko'rsatiladi (kitob ichki logistika)
- Isbot: grep 'poddon|pallet' apps/api/src/modules/**/*.ts = 0 natija; ow_pallet_recoveries jadval bor lekin hech bir kod yozmaydi/o'qimaydi

**10.71  🟡 qisman**  — ❓ EP-WMS-087: Ichki transport so'rovi (rohler chaqirish) + kechikish izi/eskalatsiya?
- Siz: Sex material-so'rovi→rohlerchiga vazifa→bajarildi belgisi; kechikkanда eskalatsiya (15/30/60 daq)
- Isbot: pos-request.service.ts + wms-counts.controller.ts:85-93 internal-requests CRUD bor; wms_internal_requests jadval to'liq (urgency/status/approved_by). LEKIN rohler-eskalatsiya timing (15/30/60 daq→IchLog/smena/Direktor) kodda yo'q

**10.72  🟡 qisman**  — ❓ EP-WMS-088: 'Bekor turish' sababini ombor-yetishmasligiga bog'lash (KPI)?
- Siz: Downtime sabab-kodida 'material yetishmovchiligi (logistika)' alohida, oyiga KPI
- Isbot: warehouse_kpi_cache jadval bor; MES downtime kodlari mavjud lekin 'material-logistika' sabab→ichki-logistika KPI bog'lanishi jonli tasdiqlanmadi (reader yo'q)

**10.73  🟡 qisman**  — ❓ EP-WMS-089: Chiqindi va qoldiqni ajratib hisoblash (qayta ishlatiladigan ╳ utilizatsiya)?
- Siz: Ikki tur: makulatura/qoldiq (omborga, daromad) ╳ chiqindi (utilizatsiya)
- Isbot: INTERNAL_RETURN movement turi (pos_movement_types) + ow_pallet_recoveries jadval bor; lekin chiqindi╳qoldiq ajratib hisoblash + makulatura-daromad oqimi kodda alohida emas

**10.74  🟡 qisman**  — ❓ EP-WMS-090: Местный (makulatura) qog'ozni alohida zaxira + ruxsat-etilgan-mahsulot ro'yxati?
- Siz: Alohida kartochka + ruxsat etilgan mahsulotlar (past sifat noto'g'ri buyurtmaga ketmaydi)
- Isbot: material_cards (n=31) + material_category_dept_rules jadval bor; lekin 'ruxsat etilgan mahsulot ro'yxati' (material→izin-berilgan-buyurtma) bog'lanishi kodda topilmadi

**10.75  🟡 qisman**  — ❓ EP-WMS-091: Grammaj bo'yicha kirim tekshiruvi (namuna o'lchanib ±tolerans, oshsa karantin)?
- Siz: Namuna grammaji o'lchanadi, ±tolerans, oshsa BUTUN PARTIYA karantinga
- Isbot: quarantine-gate.service.ts:119-157 checkWeightTolerance ±2% (RECEIPT_WEIGHT_TOLERANCE) real — oshsa requiresApproval; LEKIN grammaj(g/m²)-maxsus o'lchov + 'butun partiya karantin' avto-oqimi alohida emas (vazn-umumiy)

**10.76  🟡 qisman**  — ❓ EP-WMS-092: Import xom-ashyo yo'lda (in-transit) holati (jo'natildi/bojxona/keldi + ETA)?
- Siz: Import buyurtmasi bosqichli holat + taxminiy kelish sanasi (Таъминот mas'ul)
- Isbot: logistics deliveries jadvalida estimated_arrival/actual_arrival/status bor (chiquvchi); LEKIN KIRUVCHI import in-transit (jo'natildi→bojxona→keldi) bosqichli holati WMS/MM kodida jonli tasdiqlanmadi

**10.77  🔑 egasi-data**  — ❓ EP-WMS-093: Import lead-time va valyuta narxi reorder hisobida (import/mahalliy bayroq)?
- Siz: import/mahalliy bayroq + lead-time + valyuta → reorder import uchun ertaroq
- Isbot: EOQ/ROP servislari bor (wms-eoq.service, safety-stock.service) lekin import/mahalliy bayroq + lead-time qiymatlari material_cards'da to'ldirilmagan — egasi data beradi

**10.78  ❌ yo'q**  — ❓ EP-WMS-094: Yetkazib beruvchi ishonchliligi reytingi (o'z-vaqtida%/brak%/narx, har kirim avto-ta'sir)?
- Siz: Har kirim avtomatik reytingga ta'sir (kechikdi/brak) → eng yaxshi beruvchi tanlanadi
- Isbot: material_supplier_ratings + qc_supplier_quality jadvallari bor (n=0) LEKIN grep ko'rsatdi: apps/api/src/modules ichida hech bir kod material_supplier_ratings'ga yozmaydi/o'qimaydi — reyting hisoblovchi yo'q

**10.79  🟡 qisman**  — ❓ EP-WMS-095: Import partiyasiga bojxona/sertifikat (GTD/invoys) hujjat biriktirish?
- Siz: Har import partiyasiga fayl biriktiriladi va qidiriladi (audit toza)
- Isbot: inventory_passports + storage moduli (fayl biriktirish infra) bor; LEKIN import-partiya↔GTD/sertifikat fayl bog'lanishi alohida jonli tasdiqlanmadi

**10.80  🟡 qisman**  — ❓ EP-WMS-096: Avans to'lov va yetkazib berish bog'lanishi (yopilmagan avanslar)?
- Siz: Buyurtma→avans(Finance)→kirim solishtiriladi, yopilmagan avanslar ro'yxati
- Isbot: Finance moduli + GL infra bor; LEKIN import-buyurtma↔avans↔kirim 'yopilmagan avans' WMS-ko'rinishi kodda jonli tasdiqlanmadi

**10.81  ✅ bor**  — ❓ EP-WMS-097: Tayyor mahsulotni mijozga jo'natish (отгрузка) hujjati (mijoz/mahsulot/haydovchi/mashina)?
- Siz: Jo'natish hujjati buyurtmaga bog'lanib avtomatik (mijoz/mahsulot/miqdor/haydovchi/mashina)
- Isbot: logistics Delivery aggregate + deliveries jadval (delivery_number/sales_order_id/customer/driver_name/vehicle_number/status); dispatch-delivery.handler real (jonli deliveries n=1)

**10.82  ✅ bor**  — ❓ EP-WMS-098: Haydovchi va mashinani jo'natishga biriktirish?
- Siz: Haydovchi+mashina raqami+chiqish vaqti+yetkazildi belgisi (javobgarlik)
- Isbot: delivery.aggregate.ts:102 assign(driverId,vehicleNumber); assign-driver.handler.ts; deliveries.driver_id/vehicle_id/plate_number/dispatched_at ustunlari jonli

**10.83  🟡 qisman**  — ❓ EP-WMS-099: Yetkazib berishni tasdiqlash (mijoz qabul qildi — yetkazildi/qaytdi/qisman)?
- Siz: Haydovchi qaytganда yetkazildi/qaytdi/qisman+sabab → sikl yopiladi
- Isbot: delivery.aggregate.ts:91 deliver()→DELIVERED, :98 fail()→FAILED holatlari bor (DeliveryStatus enum); LEKIN 'qisman qabul'+mijoz-imzo qaytishi alohida tasdiqlanmadi

**10.84  🟡 qisman**  — ❓ EP-WMS-100: Material rezervatsiyasi (buyurtmaga band qilish — mavjud−band=erkin)?
- Siz: Reja material bandlaydi (mavjud−band=erkin), erkin qoldiq ko'rinadi, ortiqcha va'da yo'q
- Isbot: warehouse_stock.reserved_quantity ustuni jonli mavjud; stock_reservations jadval (n=0); PP release-production-order.handler:46 'WMS material reservation' trigger izohi bor LEKIN haqiqiy reserved_qty yangilash mantiqi to'liq emas; stock_reservations bo'sh

**10.85  ❌ yo'q**  — ❓ EP-WMS-101: Material almashtirish (substitute/analog) ruxsati?
- Siz: Har materialga ruxsat-etilgan-analog ro'yxati; faqat shulardan, tasdiq bilan
- Isbot: grep 'substitut|analog|almashtir' WMS kodida: hech narsa (faqat HR recruitment + pos warehouse-config 'analog' boshqa kontekst). material_substitutions jadval ham YO'Q (SQL-XATO: mavjud emas)

**10.86  🟡 qisman**  — ❓ EP-WMS-102: Omborchi razryadi → ruxsat-etilgan amal darajasi (matritsa)?
- Siz: Razryad→vakolat matritsasi (kirim/chiqim/inventarizatsiya/spisaniye alohida)
- Isbot: role_movement_permissions jadval bor (RBAC infra); razryad-model org-strukturada mavjud; LEKIN razryad→ombor-amal matritsasi (past=oddiy chiqim, yuqori=farq-tasdiq) jonli ulanmagan

**10.87  🟡 qisman**  — ❓ EP-WMS-103: Material hisobdan chiqarish (spisaniye) jarayoni (material+sabab+miqdor+tasdiqlovchi→Finance)?
- Siz: Spisaniye akti → Finance zarariga, auditga ochiq
- Isbot: employee_write_off_acts + employee_write_off_act_lines jadvallari jonli (n=0); POS DAMAGE→QC movement turi bor; LEKIN to'liq spisaniye-akt→GL-zarar oqimi WMS kodida jonli tasdiqlanmadi (struktura bor)

**10.88  ❌ yo'q**  — ❓ EP-WMS-104: Sarfni norma bilan og'ish tahlili (pere-raskhod — norma/fakt %, chegaradan oshsa signal)?
- Siz: Har buyurtma yopilganда norma/fakt og'ishi %, chegaradan oshsa signal (yo'qotish manbai)
- Isbot: material_norms jadval bor (n=0) LEKIN material_consumption (n=0) bilan norma-fakt taqqoslovchi reader WMS/MES kodida topilmadi; faqat org-structure ckp-fact 'norm' boshqa kontekst

**10.89  🟡 qisman**  — ❓ EP-WMS-105: Tovar qabulда foto-dalil (shikast→foto majburiy→reklamatsiya)?
- Siz: 'Shikast bor' belgilansa foto majburiy → reklamatsiyaga (isbot tayyor)
- Isbot: storage moduli (fayl/foto upload) + POS AI-kamera infra bor; LEKIN goods-receipt'da 'shikast→foto majburiy' validatsiya oqimi jonli tasdiqlanmadi

**10.90  🟡 qisman**  — ❓ EP-WMS-106: Yetkazib beruvchiga qaytarish (vozvrat — zaxira↓ + Finance kreditor↓)?
- Siz: Qaytarish hujjati → zaxira kamayadi + Finance kreditor kamayadi
- Isbot: POS Q31 CHIQARISH→ta'minotchi + quarantine-gate resolveQcDecision (qaror oqimi) bor; LEKIN vozvrat-hujjat→Finance kreditor↓ atomik bog'lanishi alohida tasdiqlanmadi

**10.91  🟡 qisman**  — ❓ EP-WMS-107: Kunlik qoldiq hisoboti rahbarga avtomatik (CRON)?
- Siz: Avtomatik kunlik hisobot (qoldiq+harakat+signal) → CC orqali rahbarga
- Isbot: daily_warehouse_plans jadval + wms-analytics dashboard endpointlar bor; LEKIN kunlik CRON→CC/rahbar avto-yuborish jonli tasdiqlanmadi (CRON writer ko'rinmadi)

**10.92  🟡 qisman**  — ❓ EP-WMS-108: Kritik material yetishmasligi proaktiv signal ('X material Y kunda tugaydi')?
- Siz: Reja sarfi vs joriy qoldiq → prognoz + signal (бекор туриш oldini)
- Isbot: safety-stock.service + rop.service + low_stock_alerts/min_stock_alerts jadvallar bor; tugash-kuni formula (joriy−rezerv)/kunlik-sarf domain-servisda; LEKIN kunlik CRON-prognoz→signal jonli oqimi tasdiqlanmadi

**10.93  ✅ bor**  — ❓ EP-WMS-109: Ombor harakatining buxgalteriyaga (GL) avtomatik o'tishi (har harakat Dr/Cr)?
- Siz: Har harakat GL-provodka (zaxira debet/kredit), buxgalteriya↔ombor doim teng
- Isbot: finance/wms-goods-issued.listener.ts:48-101 WmsGoodsIssuedEvent→Dr COGS(9100)/Cr Inventory(1000) kanonik `entries`ga; :136 WmsFgReceived→Dr Inventory/Cr AP; narx material_cards'dan, yo'q bo'lsa SKIP (pul to'qilmaydi, Q-40 honest); goods-issue.handler:85 event publish

**10.94  🟡 qisman**  — ❓ EP-WMS-110: Material narxini hisoblash usuli (FIFO/o'rtacha)?
- Siz: KONFLIKT: POS Q35 FIFO (partiya narxi) ustun ╳ v2 o'rtacha-tortilgan
- Isbot: batch-selection.service FIFO/FEFO partiya tanlovi real (goods-issue.handler:120-135); LEKIN GL listener narxni material_cards.unit_price'dan oladi (partiya-FIFO-narx EMAS) — narxlash to'liq FIFO-partiya emas; valyuta-muzlatish egasi-data

**10.95  🟡 qisman**  — ❓ EP-WMS-111: Inventarizatsiya kamomadini mas'ul shaxsga bog'lash (материально-ответственное)?
- Siz: Har zona/material mas'ul shaxsga biriktiriladi; kamomad o'shanga
- Isbot: warehouse_employees + warehouse_zones jadvallari bor; inventory_count_lines.counted_by/variance ustunlari jonli; LEKIN zona→mas'ul-shaxs→kamomad-javobgar avto-bog'lanish jonli tasdiqlanmadi

**10.96  ✅ bor**  — ❓ EP-WMS-112: Ombor ↔ POS Monitor (zavod tableti) rol ajratimi (bir kanonik DB)?
- Siz: POS Monitor=tezkor sex-pol amallari → bir DB; WMS=to'liq boshqaruv; warehouse_stock kanonik
- Isbot: warehouse_stock kanonik jadval (current_stock=view); pos moduli + wms moduli ikkalasi shu jadvalga yozadi; goods-issue.handler issueFromWarehouseStock kanonik dekrement

**10.97  🟡 qisman**  — ❓ EP-WMS-113: Material 'kim uchun kritik' teskari ko'rinish (material→ishlatiladigan buyurtmalar)?
- Siz: Material→ishlatiladigan mahsulotlar/buyurtmalar teskari ko'rinish (ta'sir baholash)
- Isbot: tech_card_bom (material_code↔technology_card) jadval bor — teskari so'rov MUMKIN; LEKIN 'material→buyurtmalar' teskari READ endpoint jonli topilmadi (BOM bo'sh n=0)

**10.98  🔑 egasi-data**  — ❓ EP-WMS-114: Yetkazib beruvchi minimal partiya / qadoqlash birligi (reorder yaxlitlash)?
- Siz: Min partiya+qadoqlash birligi → reorder yaxlitlanadi (real buyurtma)
- Isbot: EOQ/ROP servislar reorder hisoblaydi; supplier_price_tiers jadval bor; LEKIN min-partiya/qadoqlash-birligi qiymatlari to'ldirilmagan — egasi/master-data

**10.99  ✅ bor**  — ❓ EP-WMS-115: Zaxira aylanma tezligi (turnover days) ko'rsatkichi?
- Siz: Aylanma kunlari + signal (juda sekin/tez) — zaxira optimallashadi
- Isbot: inventory-turnover.service.ts + stock-turnover.service (DB query 6) + wms-catalog.controller:76 reports/turnover endpoint; formula (o'rtacha-zaxira/kunlik-sarf)×1

**10.100  🟡 qisman**  — ❓ EP-WMS-116: Ombor zonasi sig'imi to'lganlik foizi (import oldidan)?
- Siz: Zona sig'imi+band hajm → to'lganlik %; kirim oldidan tekshiriladi
- Isbot: warehouse_zones + warehouse_bins jadvallari + wms-overflow.service/controller bor; LEKIN zona-sig'imi+band→to'lganlik% import-oldi gating qiymatlar bilan jonli tasdiqlanmadi (sig'im to'ldirilmagan)

**10.101  ✅ bor**  — ❓ EP-WMS-117: Brak/karantin materialni sexga chiqishini qattiq bloklash?
- Siz: Brak/karantин statusли material chiqimда qat'iy bloklanadi (tizim ruxsat bermaydi)
- Isbot: wms-quarantine-gate.service.ts:84-101 canPostToMain — faqat QC_PASS o'tadi, karantindagi BLOK (real enforcement); quarantine-gate.service state-machine DRAFT→KARANTIN→QC→MAIN

**10.102  ✅ bor**  — ❓ EP-WMS-118: Yetkazib beruvchidan kam/ortiq kelganда ±% tolerantlik?
- Siz: ±% tolerantlik (masalan ±2%) ichида avto-qabul, tashqarisида tasdiqlash
- Isbot: quarantine-gate.service.ts:126-157 checkWeightTolerance: deviation≤RECEIPT_WEIGHT_TOLERANCE→auto-qabul, oshsa requiresApproval=true (real). Aniq % egasi-konfiguratsiya

**10.103  🟡 qisman**  — ❓ EP-WMS-119: Ombor/ichki logistika ЦКП KPI (bekor turish + kechikishlar)?
- Siz: Ombor KPI paneli (logistika kechikishlari+reja%+bekor turish daqiqalari) — kartani baholash
- Isbot: warehouse_kpi_cache + wms-analytics moduli bor; GSD aniqlik% formula (warehouse-kpi repo, CLAUDE.md WARN-list); LEKIN 'bekor turish daqiqa'+kechikish→ichki-logistika-karta AI-baho bog'lanishi to'liq emas

**10.104  ❌ yo'q**  — ❓ EP-WMS-120: Reorderda bir nechta beruvchiga tender (taklif solishtirish)?
- Siz: Reorder → 2-3 beruvchiga so'rov → taklif solishtirish → tanlash (narx optimal)
- Isbot: EOQ/ROP reorder hisoblaydi; supplier_price_tiers bor; LEKIN ko'p-beruvchi tender/taklif-solishtirish oqimi WMS/MM kodida topilmadi

**10.105  🟡 qisman**  — ❓ EP-WMS-121: Ish vaqtidan tashqari ombor amali nazorati (sabab+tasdiq)?
- Siz: Ish vaqtidan tashqari amal alohida belgilanadi (sabab+tasdiq) — shubhali harakat
- Isbot: warehouse_transactions to'liq audit (created_at timestamp) bor; HR smena jadvali mavjud; LEKIN 'ish-vaqtidan-tashqari' avto-bayroq (smena-jadval bilan solishtirish) jonli tasdiqlanmadi

**10.106  🟡 qisman**  — ❓ EP-WMS-122: Yangi material kartochkasi ochish huquqi + dublikat ogohlantirish?
- Siz: Yangi kartochka faqat MM roli+tasdiq+o'xshash-nom ogohlantirishi (dublikat kamayadi)
- Isbot: material_cards + material_card_suggestions jadvallar bor; POS Q18 'topilmasa→yangi kartochka'; LEKIN AI-semantik-dublikat ogohlantirish (kraft topliner=topliner kraft) jonli tasdiqlanmadi

**10.107  ❌ yo'q**  — ❓ EP-WMS-123: Material kim uchun: bizniki ╳ mijoz moli (davalcheskiy)?
- Siz: Har zaxiraga 'egasi'(biz/mijoz X), mijoz materiali faqat o'sha mijoz buyurtmasiga
- Isbot: grep 'davalcheskiy|customer_owned|owner_type|consignment' = 0 natija; warehouse_stock'da owner/customer ustun YO'Q (faqat reserved_quantity); mijoz-mol bayroq qurilmagan

**10.108  🟡 qisman**  — ❓ EP-WMS-124: Smenalararo qoldiq topshirish (peresmenka akti)?
- Siz: Smena oxiriда kalit-material qoldig'i keyingi smenага topshiriladi (elektron akt)
- Isbot: mes-shifts-stats.repo + iot-tablet handover bor; LEKIN peresmenka-akt→warehouse_stock solishtirish→smena-topshirish-farqi oqimi WMS kodida jonli tasdiqlanmadi

**10.109  ❌ yo'q**  — ❓ EP-WMS-125: Material qaytib ishlatish (vtorichka — chala rulon sifat-belgili qaytishi)?
- Siz: Yaroqli qoldiq 'ikkilamchi' sifatида qaytadi (sifati-pas belgisi) — tejam
- Isbot: grep 'ikkilamchi|vtorichka|secondary' WMS kodida = 0; INTERNAL_RETURN movement turi bor lekin 'sifat-pas ikkilamchi material' belgisi kodda yo'q

**10.110  ❌ yo'q**  — ❓ EP-WMS-126: Material yoshi (saqlanish vaqti) eskirish signali (muddatsizlarga ham)?
- Siz: Kirim sanasidan yosh, chegara (masalan 6 oy), eski avval ishlatiladi
- Isbot: grep 'material.age|saqlanish|yosh' WMS kodida = 0; aging endpoint (wms-catalog reports/aging) bor lekin u muddatli-FEFO, 'kirim-yoshi 6-oy signal muddatsizlarga' alohida emas

**10.111  🟡 qisman**  — ❓ EP-WMS-127: Namlik/harorat sharoiti buzilganda signal (IoT)?
- Siz: IoT datchik→chegараdan chiqса signal+log (qog'oz namlikка sezgir)
- Isbot: iot moduli to'liq: record-sensor-reading.handler + update-device-thresholds + SensorReading aggregate jonli; LEKIN namlik-anomaliya→ombor-zaxira 'xavf ostida' belgilash handler (memory: no-op) WMS bilan ulanishi tasdiqlanmadi

**10.112  ❌ yo'q**  — ❓ EP-WMS-128: Bo'yoq/kley/lak maxsus saqlash sharti va zona (xavf turi)?
- Siz: Maxsus materialга 'saqlash sharti'+'xavf turi' maydoni, alohida zona
- Isbot: grep 'yonuvchi|kimyoviy|hazard|flammable' WMS kodida topilmadi; material_cards'da xavf-turi/saqlash-sharti maydon-oqimi jonli emas; alohida-zona warehouse_zones bor lekin xavf-bog'lanish yo'q

**10.113  🟡 qisman**  — ❓ EP-WMS-129: Rulondan kesilgan formatlar (list) zaxirasi (rulon kg↓→list dona↑)?
- Siz: Kesish operatsiyasi rulon(kg)ni kamaytirib list(dona) zaxirasini yaratadi — ikki o'lchov bog'lanadi
- Isbot: rulon-card.service.ts real (warehouse_rolls, DB 6); warehouse_roll_usage jadval bor; decisions §EP-WMS-11 kesish→rulon↓list↑ atomik tavsifi; LEKIN kesish→list-zaxira-yaratish handler jonli tasdiqlanmadi

**10.114  ❌ yo'q**  — ❓ EP-WMS-130: Material namuna/probnik chiqimini alohida hisoblash (kamomad emas)?
- Siz: 'Namuna chiqimi' alohida sabab-kodi, kichik miqdor — kamomad emas, izlanadi
- Isbot: grep 'probnik|namuna.*chiqim|sample' WMS kodida = 0; pos_movement_types sabab-kodlar bor lekin 'namuna/probnik' alohida sabab-kod kodda yo'q

**10.115  🟡 qisman**  — ❓ EP-WMS-131: Inventarizatsiyani ABC bo'yicha chastotaga ajratish (A-haftalik, C-yillik)?
- Siz: ABC ga qarab sanoq chastotasi (A-haftalik, B-oylik, C-yillik) — resurs optimal
- Isbot: abc-xyz.service + abc-aging-expiry.service + wms-catalog reports/abc-analysis endpoint real (DB query); inventory_counts jadval bor; LEKIN ABC→sanoq-chastota avto-rejalashtirish (CRON) jonli tasdiqlanmadi

**10.116  🟡 qisman**  — ❓ EP-WMS-132: Kirim/chiqim blankasini chop etish va ikki imzo (QR)?
- Siz: Tizim blanka chop etadi(QR), ikki imzo, skani biriktiriladi — elektron+qog'oz dalil
- Isbot: wms-barcode.controller + POS label (ZPL/EPL/PDF) infra + inventory_barcode_assignments jadval bor; LEKIN kirim/chiqim-blanka PDF+ikki-imzo+skan-biriktirish to'liq oqimi jonli tasdiqlanmadi

**10.117  🟡 qisman**  — ❓ EP-WMS-133: Ombor ijarasi (mijoz molini saqlash) hisobi va to'lov?
- Siz: Mijoz moli alohида belgi, qiymatsiz + ijara Finance'ga oylik (toza ajratish)
- Isbot: warehouse-rental.controller.ts to'liq CRUD (records/summary/settings/close/mark-paid) + warehouse-rental.service repo-delegate real; warehouse_rental_records/settings jadvallar (n=0); LEKIN mijoz-mol 'qiymatsiz-bizniki-emas' GL-flag + oylik CRON jonli tasdiqlanmadi; tarif egasi-data

**10.118  ✅ bor**  — ❓ EP-WMS-134: Ombor ichida ko'chirish (peremeshcheniye) izi (eski→yangi joy+kim)?
- Siz: Har ko'chirish (eski→yangi joy+kim) qayd etiladi, joriy joy doim aniq — rulon yo'qolmaydi
- Isbot: warehouse_transfers + stock_transfers/stock_transfer_lines jadvallar jonli; POS INTERNAL_TRANSFER movement turi + warehouse_transactions to'liq audit (createdBy/notes); movements.service real

**10.119  🟡 qisman**  — ❓ v1 EP-WMS-008/060: Inventarizatsiya aniqlik foizi (GSD) + og'ish chegarasi tasdiqlash?
- Siz: Avto aniqlik%=(to'g'ri/jami)×100, ±1% avto-tuzatish undan yuqori rahbar-tasdiq+sabab
- Isbot: warehouse-kpi repo GSD formula (CLAUDE.md Result-WARN list) + inventory_count_lines.variance/variance_percent/reason ustunlari jonli; LEKIN ±1% avto-tuzatish→rahbar-tasdiq gating oqimi jonli tasdiqlanmadi

**10.120  ❌ yo'q**  — ❓ v1 EP-WMS-059: Sanoq usuli (ko'r sanoq — raqam yashirin)?
- Siz: Ko'r sanoq — tizim raqami yashirin, faqat sanab kiritadi (halol natija)
- Isbot: grep 'blind|ko.r.sanoq|second.count' WMS/POS kodida = 0; inventory_counts book_quantity/counted_quantity ustunlari bor lekin 'ko'r-rejim'(raqam-yashirish)+ikkinchi-sanoqchi mantiqi kodda yo'q

**10.121  ❌ yo'q**  — ❓ v1 EP-WMS-062: Inventarizatsiya vaqtida harakatni muzlatish (zona freeze)?
- Siz: Sanalayotgan zona muzlatiladi, tugagach ochiladi (aniq natija)
- Isbot: grep 'freeze|muzlat' WMS kodida = 0; zona-muzlatish→kirim/chiqim-blok inventarizatsiya davomida kodda topilmadi

---

## 11 — MM / Ta'minot  (vizyon 43%, 68 savol)

**11.1  🟡 qisman**  — ❓ Yetkazuvchi kartasida majburiy rekvizitlar (nomi/STIR/bank hisob/MFO/yuridik manzil/telefon/mas'ul shaxs) bo'lib, majburiysiz saqlash bloklanadimi?
- Siz: Q1-A: 7 majburiy rekvizit, majburiysiz saqlash BLOK (Finance/soliq/shartnoma buzilmasin)
- Isbot: mm_vendors (q.cjs): faqat name/tin/inn/phone/email/address/payment_terms/currency/contact_person bor. MFO/bank hisob raqami/yuridik-manzil-alohida YO'Q. MmCreateVendorSchema (mm.dto.ts:72) faqat name majburiy; inn/phone/email/address OPTIONAL → majburiy-blok yo'q.

**11.2  ❌ yo'q**  — ❓ Yetkazuvchi turi (xom ashyo/kimyo/ehtiyot qism/xizmat/yoqilg'i/transport) oldindan belgilangan 6 turdan tanlanadimi?
- Siz: Q2-A: 6 oldindan belgilangan tur, kartochkada majburiy (hisobot toza bo'lsin)
- Isbot: mm_vendors da type/category/classification ustuni YO'Q (q.cjs filter type/relat = bo'sh). DTO da ham tur maydoni yo'q.

**11.3  🟡 qisman**  — ❓ Yetkazuvchi 5 holat (Faol/Yangi-tekshiruvda/To'xtatilgan/Qora ro'yxat/Arxiv), qora-ro'yxatga buyurtma butunlay bloklanadimi?
- Siz: Q3-A: 5 status, qora-ro'yxatdagiga buyurtma BUTUNLAY blok
- Isbot: MmUpdateVendorSchema (mm.dto.ts:87) status enum faqat 3: active/inactive/blacklisted (vizyon 5 emas). mm_vendors da alohida status ustuni yo'q, faqat is_active bool. 'Qora ro'yxat→buyurtma blok' guard kodda topilmadi (createPo da vendor-status tekshiruvi yo'q).

**11.4  ✅ bor**  — ❓ Yetkazuvchi reytingi 5 mezondan (sifat40%/muddat30%/narx20%/hujjat10%) tuziladimi?
- Siz: Q4-A: 5 mezon, og'irlik sifat40/muddat30/narx20/hujjat10 (muvozanatli)
- Isbot: mm-vendor-rating.service.ts:81-90 + mm-vendor-rating.constants.ts: MM_VR_DEFAULT_WEIGHTS aynan 0.4/0.3/0.2/0.1; vendor-performance endpoint (mm-vendors-pr.controller.ts:67-78) shu formulani SQL da hisoblaydi. Sof+og'irlik-validatsiyali.

**11.5  🟡 qisman**  — ❓ Reyting avtomatik (har qabul/braktan keyin tizim qayta hisoblaydi)mi yoki qo'lda?
- Siz: Q5-A: avtomatik, menejer faqat izoh (sub'ektivlik kamaysin)
- Isbot: supplier-quality-fail.listener.ts JONLI ulangan (SupplierQualityFailEvent→updateVendorRating) LEKIN satr 32: currentRating=5 PLACEHOLDER hardcode, formula bilan qayta-hisob emas. mm_vendor_ratings=7 qator (qo'lda kiritilgan). Avto-qayta-hisob to'liq emas.

**11.6  ❌ yo'q**  — ❓ Yetkazuvchi shartnomasi (raqam/sana/muddat/skan/to'lov sharti) saqlanib, 30 kun qolganda ogohlantiriladimi?
- Siz: Q6-A: shartnoma kartochkaga biriktiriladi, tugashga 30 kun qolganda ogohlantirish
- Isbot: mm_vendors da shartnoma maydonlari (contract_number/expiry/scan) YO'Q. supplier/vendor-contract jadvali topilmadi (faqat sd_contracts/ow_contracts mavjud — boshqa modul). 30-kun CRON yo'q.

**11.7  🟡 qisman**  — ❓ Shartnomada to'lov sharti (predoplata%/postpaid/kechikish kuni) majburiy yozilib, Finance avto qarz muddatini hisoblaydimi?
- Siz: Q7-A: to'lov turi + kechikish kunlari majburiy, Finance avto qarz muddati
- Isbot: mm_vendors.payment_terms ustuni BOR (varchar) lekin tarkibli emas (predoplata%/kechikish-kun ajratilmagan). Avto-qarz-muddati hisobi MM da topilmadi.

**11.8  ❌ yo'q**  — ❓ Bir yetkazuvchidan bir nechta material — kartochkada 'yetkazadigan materiallar' ro'yxati + har biriga alohida narx-tarix?
- Siz: Q8-A: yetkazadigan materiallar ro'yxati + material-darajada narx-tarix
- Isbot: supplier_price_tiers jadvali bor (supplier_id/material_id/narx) lekin 0 qator; mm_vendors da material-ro'yxat bog'lanishi yo'q; material-darajada narx-tarix UI/endpoint topilmadi.

**11.9  🟡 qisman**  — ❓ Xarid arizasini kim yarata oladi (ombor min-zaxiradan past / ishlab chiqarish reja / ta'minot), manba belgilanadimi?
- Siz: Q9-A: 3 manba (ombor/IchQ/ta'minot) yarata oladi, manba belgilanadi
- Isbot: mm_purchase_requisitions jadvali + CRUD endpoint bor (mm-vendors-pr.controller.ts:147-200) requested_by/mrp_run_id ustunlari mavjud. LEKIN jadval 0 qator; 'manba turi' (ombor/PP/ta'minot) ajratilgan maydon yo'q; pos/procurement-request.service.ts alohida workflow (parallel).

**11.10  🟡 qisman**  — ❓ Xarid arizasi 7 maydon (material/miqdor/o'lchov/kerak-sana/sabab/qaysi-buyurtma/taxminiy-narx), kerak-sana+miqdor majburiy?
- Siz: Q10-A: 7 maydon, kerak-sana va miqdor majburiy
- Isbot: MmCreateRequisitionSchema (mm.dto.ts:91): title majburiy, needed_by/priority/items OPTIONAL. item da material_id+quantity bor lekin 'kerak-sana'/'sabab'/'qaysi-buyurtma'/'taxminiy-narx' item-darajada yo'q; needed_by majburiy emas.

**11.11  🟡 qisman**  — ❓ Ariza tasdiqlash summaga qarab bosqichli (<5mln ta'minot boshlig'i / 5-50mln moliya / >50mln direktor)?
- Siz: Q11-A: 3 summa-chegara avtomatik yo'naltiradi
- Isbot: PO darajasida >50mln direktor-gate BOR (create-purchase-order.handler.ts:54 PO_MAX_AMOUNT_UZS → PoRequiresDirectorApprovalEvent→hitl_approvals). LEKIN bu faqat 1 chegara (50mln); ariza-darajasida 3-pog'onali (<5mln/5-50mln) yo'naltirish yo'q. Chegaralar sozlamada emas, konstanta.

**11.12  🟡 qisman**  — ❓ Ariza rad etilsa sabab majburiy, muallif tahrirlab qayta yuboradimi (status: Qaytarilgan)?
- Siz: Q12-A: rad sababi majburiy, qayta yuborish (Qaytarilgan)
- Isbot: MmUpdateRequisitionSchema status enum: draft/pending/approved/rejected/cancelled — 'returned/qaytarilgan' YO'Q; rad-sabab majburiy maydon yo'q (faqat notes optional).

**11.13  ❌ yo'q**  — ❓ Tasdiqlangan arizadan 'Buyurtma yaratish' tugmasi — maydonlar arizadan ko'chiriladimi?
- Siz: Q12b-A: arizadan PO ga avto-ko'chirish tugmasi
- Isbot: mm_purchase_requisitions.purchase_order_id ustuni bor (bog'lanish uchun) lekin ariza→PO konvertatsiya endpoint/handler topilmadi; createPo (mm-purchase-orders.controller.ts:196) requisition-id qabul qilmaydi.

**11.14  🟡 qisman**  — ❓ PO 7 holat (Qoralama/Yuborildi/Tasdiqlandi/Qisman keldi/To'liq keldi/Yopildi/Bekor), 'Qisman keldi' alohida?
- Siz: Q13-A: 7 holat, Qisman keldi alohida (chala yetkazish kuzatiladi)
- Isbot: purchase-order.aggregate.ts:13 PoStatus enum = 6: DRAFT/APPROVED/RECEIVED/INVOICED/CLOSED/CANCELLED. 'Qisman keldi'(partial) ALOHIDA holat YO'Q — recordGoodsReceipt to'liq yetganda RECEIVED ga o'tadi (satr 117), qisman holatda DRAFT-emas-APPROVED da qoladi (alohida status emas).

**11.15  🟡 qisman**  — ❓ Har kirim PO ga bog'lanib, kelgan miqdor PO miqdori bilan solishtiriladimi (kam/ortiq belgilanadi)?
- Siz: Q14-A: har kirim PO ga bog'lanadi, miqdor solishtiriladi
- Isbot: mm_goods_receipts.purchase_order_id + recordGoodsReceipt(quantity) bor (goods-receipt.handler.ts); listPos pending_amount=PO-qabul hisoblaydi. LEKIN mm_goods_receipts=0 qator; kam/ortiq (over/under-delivery) dopusk-belgisi yo'q (Q90/Q91).

**11.16  🟡 qisman**  — ❓ Buyurtma narxi vs hisob-faktura narxi farqi belgilangan % (3%) dan oshsa to'lov bloklanadimi?
- Siz: Q15-A: farq 3% dan oshsa to'lov blok + tasdiq, kichik farq avto
- Isbot: goods-receipt.handler.ts:40 validateThreeWayMatch + ThreeWayMatchFailedEvent BOR (3-way match wired); mm_purchase_orders.three_way_matched bool ustuni bor. LEKIN tolerans-% (3%) konfiguratsiyasi kodda ko'rinmadi (matched/not-matched binar); narx-farq alohida emas miqdor-match.

**11.17  🟡 qisman**  — ❓ Har material uchun narx-tarix jadvali (sana/narx/yetkazuvchi/miqdor) + grafik saqlanadimi?
- Siz: Q16-A: material kartochkasida narx-tarix jadvali + grafik (narx dinamikasi)
- Isbot: material_price_history jadvali BOR (material_id/unit_price/currency/supplier_name/purchase_date/movement_id) LEKIN 0 qator — hech qaysi qabul/PO unga yozmaydi (yozuvchi kod topilmadi). Struktura bor, jonli data+grafik yo'q.

**11.18  🟡 qisman**  — ❓ Narx asl valyutada + kirim sanasidagi MB kursi bilan so'mga, ikkalasi saqlanadimi?
- Siz: Q17-A: asl valyuta + kirim-sana MB kursi so'mga, ikkalasi saqlanadi
- Isbot: mm_purchase_orders.currency + mm_vendors.currency BOR (valyuta tanlanadi); LEKIN kurs-tarix/so'm-ekvivalent ustuni yo'q; kirim-sana kursi avto-aylantirish MM da topilmadi. KONFLIKT belgilangan (EP-MM-058).

**11.19  ❌ yo'q**  — ❓ Narx oshishi 10% dan oshsa sariq, 25% dan oshsa qizil + boshliqqa xabar chiqadimi?
- Siz: Q18-A: 10% sariq, 25% qizil + boshliqqa xabar
- Isbot: Narx-oshish ogohlantirish EVENT/listener MM da topilmadi; material_price_history bo'sh bo'lgani uchun oxirgi-narx solishtirishga manba yo'q.

**11.20  ❌ yo'q**  — ❓ Yetkazuvchilarni narx bo'yicha taqqoslash (so'rovnoma 3+ yetkazuvchi, bitta jadvalda) bormi (tender)?
- Siz: Q19-A: so'rovnoma 3+ yetkazuvchiga, javoblar bitta jadvalda, biri tanlanadi
- Isbot: RFQ/tender/so'rovnoma jadvali yoki endpoint MM da topilmadi (rfq/tender filter q.cjs = bo'sh; quotations jadvali sotuv-SD uchun). Narx-taqqoslash UI yo'q.

**11.21  ❌ yo'q**  — ❓ Taqqoslash 5 ustun (narx/muddat/to'lov/reyting/masofa) + tizim umumiy ball, yakuniy qaror odamda?
- Siz: Q20-A: 5-ustun taqqoslash + umumiy ball, qaror odam
- Isbot: Tender bo'lmagani uchun (Q19) 5-ustun taqqoslash jadvali ham yo'q; vendor-rating sof-hisoblagich bor lekin tender-taqqoslash konteksti yo'q.

**11.22  ❌ yo'q**  — ❓ Eng arzondan tashqari (qimmatroq) yetkazuvchi tanlansa sabab majburiy yoziladimi?
- Siz: Q21-A: eng arzon emas tanlansa sabab majburiy (suiiste'mol oldini olish)
- Isbot: Tanlov-sabab maydoni/tender yo'q; muzokara-iz jadvali (Q100) ham topilmadi.

**11.23  🟡 qisman**  — ❓ Har tashish uchun yo'l varaqasi (mashina/haydovchi/dan-gacha/masofa/yuk/yoqilg'i) saqlanadimi?
- Siz: Q22-A: yo'l varaqasi to'liq (mashina/haydovchi/masofa/yuk/yoqilg'i)
- Isbot: mm_deliveries jadvali BOR (driver/vehicle/distance/weight/cost/loading_point/shipping_point) — yo'l varaqasi maydonlari mavjud. LEKIN 1 qator (deyarli bo'sh); bu chiqish-yetkazish (sales_order_id/customer_id) ko'proq, kirim-transport emas.

**11.24  🟡 qisman**  — ❓ Transport turi (O'z/Yetkazuvchi/Yollangan) yo'l varaqasida ajratiladimi?
- Siz: Q23-A: 3 transport turi, har biriga mos xarajat
- Isbot: MmCreateFleetVehicleSchema (mm.dto.ts:117) type enum: own/rent/truck (mashina-darajasida). LEKIN yetkazish(delivery)-darajasida 'O'z/Yetkazuvchi/Yollangan' ajratish yo'q; mm_deliveries.delivery_type bor lekin 3-tur semantikasi tasdiqlanmadi.

**11.25  ❌ yo'q**  — ❓ Buyurtmada 'yetkazib berish sharti' (Bizning ombor/Yetkazuvchi yetkazadi/Biz olamiz) belgilanadimi?
- Siz: Q24-A: yetkazib berish sharti (Incoterms ruhi), transport 2 marta hisoblanmasin
- Isbot: mm_purchase_orders da delivery-terms/incoterms ustuni YO'Q (q.cjs ustun ro'yxatida yo'q).

**11.26  🟡 qisman**  — ❓ Har mashinaga yoqilg'i normasi (l/100km), normativ sarf real bilan solishtiriladimi?
- Siz: Q25-A: norma l/100km, normativ vs real solishtirish (o'g'irlik ko'rinadi)
- Isbot: mm_vehicle_fuel_logs jadvali BOR (liters/mileage/cost_per_liter) + mm_vehicles bor; LEKIN fuel-norma (l/100km) ustuni yo'q; normativ-vs-fakt hisob kodda topilmadi; jadvallar 0 qator.

**11.27  ❌ yo'q**  — ❓ Real yoqilg'i normadan +10% oshsa qizil + tushuntirish, oylik haydovchi reytingi bormi?
- Siz: Q26-A: +10% og'ish qizil + tushuntirish, haydovchi reytingi
- Isbot: Norma yo'q (Q25) → og'ish-hisob ham yo'q; haydovchi-reyting jadvali/listener topilmadi.

**11.28  🟡 qisman**  — ❓ Yoqilg'i talon/karta bilan (har quyish mashina+sana+litr), oy oxirida talon balansi solishtiriladimi?
- Siz: Q27-A: talon/karta nazorati, oy oxiri balans solishtirish
- Isbot: mm_vehicle_fuel_logs har quyishni yozadi (vehicle_id/date/liters/station) LEKIN talon/karta-balans ustuni/zachet yo'q; 0 qator.

**11.29  🟡 qisman**  — ❓ Yetkazuvchi kartochkasida joriy qarz + muddat taqsimoti (0-30/31-60/60+) ko'rinadimi?
- Siz: Q28-A: joriy qarz + aging taqsimoti (pul oqimi aniq)
- Isbot: Kreditor-qarz GL (gl_entries kanonik) + EP-MM-015/016 vizyonda; MM da vendor-darajada aging-taqsimot endpoint topilmadi (mm-dashboard ko'radi lekin tasdiqlanmadi). Struktura Finance-da, MM-vendor-kartada ko'rsatish yo'q.

**11.30  ❌ yo'q**  — ❓ Qarz muddati 3 kun qolganda, o'tsa qizil + direktorga avto ogohlantirish chiqadimi?
- Siz: Q29-A: 3 kun qolganda + o'tsa qizil + direktor xabar (CRON)
- Isbot: MM da to'lov-muddati CRON/ogohlantirish (vendor-payment-due) listener topilmadi.

**11.31  ❌ yo'q**  — ❓ To'lov muddati material omborga kelgan (kirim) sanasidan boshlab sanaladimi?
- Siz: Q30-A: kirim sanasidan (adolatli — biz olganimizdan)
- Isbot: To'lov-muddat boshlanish-nuqtasi hisobi (kirim-sana asosida) MM da topilmadi; payment_terms tarkibli emas.

**11.32  ❌ yo'q**  — ❓ Har avans PO ga bog'lanib, material kelganda yopiladimi (ochiq avanslar ro'yxati)?
- Siz: Q31-A: avans PO ga bog'lanadi, mol kelganda yopiladi (pul muzlamaydi)
- Isbot: Avans/prepayment jadvali yoki PO-avans bog'lanishi MM da topilmadi (avans→zachet aylanishi Q105 ham yo'q).

**11.33  🟡 qisman**  — ❓ Min zaxiradan tushsa avto ariza qoralamasi (miqdor=max−joriy) yaratiladimi?
- Siz: Q32-A: min zaxiradan tushsa avto ariza, miqdor=max−joriy
- Isbot: material_cards.min_stock/max_stock/reorder_point ustunlari BOR; mm_mrp_results + mm_purchase_requisitions.mrp_run_id bog'lanish bor. LEKIN min-tushganda avto-ariza generatsiya EVENT/CRON jonli ulanganligi tasdiqlanmadi; requisition jadvali 0 qator.

**11.34  ❌ yo'q**  — ❓ Har yetkazuvchiga lead time saqlanib, 'falon kunda buyurtma ber' deb ogohlantiriladimi?
- Siz: Q33-A: lead time saqlanadi, rejali ogohlantirish (import 30-45 kun)
- Isbot: lead_time/leadTime maydoni mm_vendors/material_cards/material-supplier da topilmadi (grep=0). Rejali-buyurtma ogohlantirish yo'q.

**11.35  🟡 qisman**  — ❓ Brak/kam qabul hujjatida belgilanib, qarz faqat qabul-miqdorga, brak reytingni tushiradi + reklamatsiya?
- Siz: Q34-A: brak/kam belgilanadi, qarz qabul-miqdorga, brak→reyting+reklamatsiya
- Isbot: supplier-quality-fail.listener.ts brak→vendor-rating-pasaytirish JONLI ulangan (SupplierQualityFailEvent). LEKIN rating-pasaytirish placeholder (currentRating=5 hardcode); qarz-korreksiya (faqat-qabul-miqdorga) + reklamatsiya hujjati MM da to'liq emas; mm_goods_receipts.qc_passed/rejected ustunlari bor lekin 0 qator.

**11.36  🟡 qisman**  — ❓ Kritik material (kraft/kimyo) kirimda sifat tekshiruvidan o'tib, 'Sifat tasdiqlagan' bo'lmasa PP ga berilmaydimi (karantin)?
- Siz: Q35-A: kritik material kirim-QC, tasdiqsiz PP ga berilmaydi, karantin zona
- Isbot: qc_supplier_quality + mm_goods_receipts.qc_required_items/qc_passed_items/qc_by ustunlari BOR (struktura); POS karantin vizyonda. LEKIN qabul→QC-gate ishlab-chiqarishni BLOKLASH guard kodda topilmadi (PP-released listener boshqa yo'nalish); jadvallar 0 qator.

**11.37  ❌ yo'q**  — ❓ Har material kartochkasida 1 asosiy + 1-2 zaxira yetkazuvchi, asosiy javob bermasa zaxira taklif qilinadimi?
- Siz: Q36-A: 1 asosiy + zaxira yetkazuvchi, asosiy yo'q bo'lsa zaxira taklif
- Isbot: material_cards.supplier_name (bitta matn) bor lekin asosiy/zaxira rol ajratish yo'q; material-supplier ko'p-bog'lanish + ustuvorlik jadvali topilmadi (preferred_supplier grep=0).

**11.38  ❌ yo'q**  — ❓ Kelishilgan narx-list (material/narx/muddat), buyurtmada avto tortilib, muddat tugaganda ogohlantiradimi?
- Siz: Q37-A: prays-list saqlanadi, PO ga avto, muddat tugashida ogohlantirish
- Isbot: supplier_price_tiers jadvali bor (min_qty/max_qty/unit_price) lekin 0 qator + amal-muddat ustuni yo'q; PO ga avto-tortish + muddat-ogohlantirish yo'q.

**11.39  ❌ yo'q**  — ❓ Import xarajatlar (boj/NDS/broker/transport) yig'ilib material miqdoriga taqsimlanadimi (landed cost)?
- Siz: Q38-A: import xarajatlar yig'ilib taqsimlanadi (to'g'ri tannarx)
- Isbot: Landed-cost / import-xarajat-taqsimot jadvali yoki hisob MM da topilmadi; mm_purchase_orders da qo'shimcha-xarajat ustunlari yo'q.

**11.40  🟡 qisman**  — ❓ Yetkazuvchiga qaytarish hujjati (sabab/miqdor/summa), ombor chiqim, qarz kamayadi/kredit-nota?
- Siz: Q39-A: qaytarish hujjati + ombor chiqim + qarz/kredit-nota
- Isbot: mm_goods_issues/mm_goods_issue_items jadvallari bor (chiqim umumiy); qc-fail→ta'minotchiga-qaytish vizyon. LEKIN vendor-return alohida hujjat + kredit-nota + qarz-korreksiya MM da topilmadi (issues = ishlab-chiqarishga chiqim).

**11.41  ✅ bor**  — ❓ Buyurtma qatorlardan (material/miqdor/narx/summa), jami avtomatik hisoblanadimi?
- Siz: Q40-A: PO qatorlar, har qator material/miqdor/narx/summa, jami avto
- Isbot: mm_purchase_order_items jadvali (raw_material_id/quantity/unit_price/total_price) + PurchaseOrderItem.getTotalPrice() + PurchaseOrder.getTotalAmount() (aggregate satr 75-77 reduce); 8 qator mavjud. Ko'p-qatorli PO ishlaydi.

**11.42  🟡 qisman**  — ❓ Har qator 'buyurtma/kelgan/qolgan' ko'rinib, qolgan 0 bo'lmaguncha PO 'Qisman'da turadimi?
- Siz: Q41-A: qator-darajada buyurtma/kelgan/qolgan, Qisman holat
- Isbot: listPos (mm-purchase-orders.controller.ts:62-64) PO-darajada received/pending hisoblaydi. LEKIN qator-darajada kelgan/qolgan kuzatuv yo'q; 'Qisman' alohida status yo'q (Q13). recordGoodsReceipt header-darajada quantity yig'adi.

**11.43  ❌ yo'q**  — ❓ Kartochkaga hujjatlar (litsenziya/sifat sertifikati/NDS guvohnoma/bank ma'lumotnoma) skani biriktirilib, muddat ogohlantiriladimi?
- Siz: Q42-A: hujjatlar skani + muddatli sertifikat ogohlantirish
- Isbot: mm_vendors da hujjat/skan/attachment ustunlari YO'Q; vendor-document jadvali topilmadi.

**11.44  ❌ yo'q**  — ❓ Kartochkada 'NDS to'lovchi' belgisi, taqqoslashda NDS hisobga olib taqqoslanadimi?
- Siz: Q43-A: NDS-to'lovchi belgisi, NDS-hisobga olgan taqqoslash (haqiqiy xarajat)
- Isbot: mm_vendors da nds/vat/is_vat_payer ustuni YO'Q (q.cjs filter nds/vat=bo'sh). NDS-asosli taqqoslash yo'q.

**11.45  ❌ yo'q**  — ❓ Oylik xarid byudjeti (umumiy/kategoriya), 90% ogohlantirish, 100% dan oshsa direktor tasdig'i?
- Siz: Q44-A: oylik byudjet, 90% ogohlantirish, 100%+ direktor tasdig'i
- Isbot: MM da xarid-byudjet (procurement budget) jadvali/guard topilmadi; faqat PO>50mln direktor-gate bor (byudjet-limit emas, mutlaq summa).

**11.46  🟡 qisman**  — ❓ Yetkazuvchi kartochkasida statistika tab (davr summa/miqdor/o'rtacha narx/brak%/kechikish) bormi?
- Siz: Q45-A: yetkazuvchi statistika tab (kelishuvga asos)
- Isbot: material_supplier_ratings jadvali statistika ustunlari bor (total_orders/total_quantity/on_time/late/qc_approved/qc_rejected/avg_price) LEKIN 0 qator; vendor-darajada statistika-tab endpoint to'liq tasdiqlanmadi.

**11.47  ❌ yo'q**  — ❓ Istalgan davrga sverka akti avtomatik (boshlang'ich+kirim+to'lov=oxirgi qoldiq) PDF chiqadimi?
- Siz: Q46-A: sverka akti avto + PDF
- Isbot: Vendor-sverka/reconciliation akti endpoint MM da topilmadi.

**11.48  ❌ yo'q**  — ❓ Mashina/haydovchi bo'yicha davriy hisobot (km/yoqilg'i norma-fakt/reys/xarajat) chiqadimi?
- Siz: Q47-A: mashina/haydovchi davriy transport hisoboti
- Isbot: mm_vehicles/mm_vehicle_fuel_logs jadvallari bor lekin barchasi 0 qator; davriy-hisobot endpoint + norma-fakt yo'q (Q25 normasiz).

**11.49  ❌ yo'q**  — ❓ Yetkazuvchi bilan muloqot jurnali (sana/kim/mavzu/natija) CRM-ga o'xshash yuritiladimi?
- Siz: Q48-A: muloqot jurnali (institutsional xotira)
- Isbot: vendor-interaction/communication jurnal jadvali MM da topilmadi.

**11.50  🟡 qisman**  — ❓ Har material asosiy birlik + konvertatsiya koeffitsienti (1 rulon=N kg), buyurtma/kirim avto aylantiradimi?
- Siz: Q49-A: asosiy birlik + konvertatsiya koeffitsienti, avto aylantirish
- Isbot: unit_of_measures seed + PO/requisition item da 'unit' bor; LEKIN material-darajada konvertatsiya-koeffitsient (1 rulon=N kg) + avto-aylantirish kodda topilmadi.

**11.51  🟡 qisman**  — ❓ Buyurtmada 'yaratdi/tasdiqladi/yubordi' izlari (kim, qachon) avto saqlanadimi?
- Siz: Q50-A: PO da yaratdi/tasdiqladi/yubordi izi (mas'uliyat aniq)
- Isbot: mm_purchase_orders: created_by/approved_by/approved_at/goods_received_by/goods_received_at ustunlari BOR + SoD (yaratuvchi≠tasdiqlovchi, approve-handler.ts:36). 'Yubordi' alohida iz yo'q; lekin yaratdi+tasdiqladi izi mavjud.

**11.52  🟡 qisman**  — ❓ 'Shoshilinch' belgisi bilan bir bosqichli tezkor tasdiq (direktor), keyin sabab hujjatlashtiriladimi?
- Siz: Q51-A: shoshilinch belgisi → bir bosqichli tezkor tasdiq + keyin hujjatlash
- Isbot: MmCreateRequisitionSchema.priority enum 'urgent' bor (mm.dto.ts:94); LEKIN urgent→qisqartirilgan-tasdiq-yo'l guard kodda topilmadi (faqat priority belgisi, workflow farqi yo'q).

**11.53  ❌ yo'q**  — ❓ Yetkazuvchi bank rekvizitini o'zgartirsa alohida tasdiqdan o'tib, eski tarixda qoladimi (firibgarlik himoyasi)?
- Siz: Q52-A: rekvizit o'zgarishi alohida tasdiq + eski tarix (firibgarlik himoyasi)
- Isbot: mm_vendors da bank-rekvizit ustuni yo'q (Q1) → rekvizit-o'zgarish-tasdiq workflow ham yo'q; updateVendor to'g'ridan tahrirlaydi.

**11.54  ❌ yo'q**  — ❓ Kirim qog'ozni laboratoriya (РД-5: namlik/qalinlik/граммаж/tur) tasdig'isiz ishlab chiqarishga chiqarmaslik (darvoza)?
- Siz: Q55-A: laboratoriya holati (kutilmoqda/o'tdi/o'tmadi), o'tmaguncha PP ga chiqmaydi
- Isbot: qc_lab_tests jadvali bor (0 qator) lekin kirim-partiya↔laborant-gate↔PP-blok zanjiri MM da yo'q; namlik/граммаж maydonlari mm_goods_receipts da yo'q (grep namlik/grammaj/moisture=0 MM da).

**11.55  ❌ yo'q**  — ❓ Rulon namligi (vlazhnost) chegaradan oshsa avtomatik karantin + yetkazuvchiga claim?
- Siz: Q56-A: namlik chegarasi, oshsa avto-karantin + claim
- Isbot: Namlik(moisture) maydoni/chegara/karantin-trigger MM/QC qabulida topilmadi (grep=0).

**11.56  ❌ yo'q**  — ❓ Граммаж (g/m²) mosligini texkartaga avtomatik solishtirib, dopuskdan oshsa ogohlantirish?
- Siz: Q57-A: kelgan граммаж texkarta talabiga ±dopusk tekshiriladi
- Isbot: граммаж o'lchov + texkarta-solishtirish kirim-nazorati MM da yo'q (grep grammaj=0).

**11.57  ❌ yo'q**  — ❓ Топлайнер ╳ местный (макулатура) qog'oz sinfini adashtirmaslik kross-tekshiruv?
- Siz: Q58-A: qog'oz sinfi majburiy atribut, chiqarishda texkarta kross-tekshiruv
- Isbot: Qog'oz-sinf atributi + topliner/mestny kross-tekshiruv MM/material da topilmadi (grep topliner=0).

**11.58  ❌ yo'q**  — ❓ Gofra ECT + qavat (3/5) mosligini material kartasi saqlab texkartaga tekshiradimi?
- Siz: Q59-A: gofra ECT + qavat material kartasi, texkartaga moslik
- Isbot: Gofra ECT/qavat atributlari + moslik-tekshiruv MM da topilmadi; layer-formula.service.ts bor (gofra sloy) lekin ECT-kirim-nazorati emas.

**11.59  ❌ yo'q**  — ❓ Shartli ruxsat (o'tdi/shartli/rad) — 3 holatli kirim-partiya holati bormi?
- Siz: Q60-A: o'tdi/shartli(izoh+cheklov+kim)/rad 3 holat
- Isbot: Kirim-partiya 3-holatli (conditional pass) status MM/QC qabulida topilmadi (mm_goods_receipts.status: draft/pending/approved/rejected — shartli yo'q).

**11.60  🟡 qisman**  — ❓ Partiya (партия) izlanuvchanligi — kirim partiya→ombor→chiqim→ishlab chiqarish buyurtmasi?
- Siz: Q61-A: to'liq izlanuvchanlik zanjiri (brak→qaysi partiya javobi)
- Isbot: wms_supplier_traceability jadvali MAVJUD (izlanuvchanlik uchun) lekin MM-qabulda batch_number ustuni qc_supplier_quality da bor (0 qator); to'liq kirim→chiqim→PP-buyurtma zanjiri jonli ulanmagan.

**11.61  ❌ yo'q**  — ❓ Brak xom-ashyo sabab tahlili jurnali (мукаммаллаштириш дафтари) — sabab+qaror+yetkazuvchi javobi?
- Siz: Q62-A: brak sabab+qaror+yetkazuvchi-javob jurnali, reytingga ulanadi
- Isbot: Brak-sabab-tahlil jurnali jadvali MM da topilmadi; supplier-quality-fail faqat reyting-pasaytiradi (sabab-jurnal emas).

**11.62  🟡 qisman**  — ❓ Yetkazuvchi reytingiga laboratoriya o'tish foizi (brak partiya/jami) alohida ko'rsatkich ulanadimi?
- Siz: Q63-A: reytingda 'laboratoriya o'tish %' alohida (obyektiv)
- Isbot: material_supplier_ratings da qc_approved/qc_rejected ustunlari bor (o'tish-% hisoblash mumkin) LEKIN 0 qator + reyting-formulaga (40/30/20/10) laboratoriya-% alohida ulanmagan; supplier-quality-fail placeholder.

**11.63  ❌ yo'q**  — ❓ Texkarta kompozitsiyasi laborant tasdig'isiz ishlab chiqarishga o'tmasligi (darvoza)?
- Siz: Q64-A: texkartaga laboratoriya kompozitsiya tasdig'i bosqichi, tasdiqsiz o'tmaydi
- Isbot: Texkarta-kompozitsiya laborant-gate PP/MM da topilmadi (bu PP/texkarta domeni, MM da yo'q).

**11.64  ❌ yo'q**  — ❓ Tasdiqlangan etalon namuna (одобренный образец: foto/spetsifikatsiya) material/mijoz uchun saqlanib kirim solishtiriladimi?
- Siz: Q65-A: etalon namuna saqlanadi + kirim solishtiriladi (nizo yechimi)
- Isbot: Etalon-namuna (reference sample) jadvali/foto-saqlash MM/QC da topilmadi.

**11.65  ❌ yo'q**  — ❓ Yangi yetkazuvchi 'sinovda' boshlab, sinov partiyasi laboratoriya o'tsa 'tasdiqlangan' bo'ladimi (onboarding)?
- Siz: Q66-A: yangi yetkazuvchi sinovda→tasdiqlangan (bosqichli ishonch)
- Isbot: Yetkazuvchi-onboarding sinov-holati (trial→approved) yo'q; vendor status enum 3 (active/inactive/blacklisted) — 'sinovda/trial' yo'q (Q3).

**11.66  ❌ yo'q**  — ❓ Manfaatlar to'qnashuvi — yetkazuvchi xodim/yaqin qarindosh bo'lsa belgilanib, xaridda ogohlantiriladimi?
- Siz: Q67-A: 'aloqador shaxs' bayrog'i, bunday yetkazuvchiga yuqori tasdiq talab
- Isbot: mm_vendors da related-party/conflict-of-interest/aloqador ustuni YO'Q (grep conflict/aloqador/related_party=0 MM da); yuqori-tasdiq-darvoza yo'q.

**11.67  🔑 egasi-data**  — ❓ Ariza tasdiq summa-chegaralarini kim belgilaydi (sozlamalar oynasida, dasturchisiz)?
- Siz: EP-MM-025-A: chegaralar sozlamalar oynasida (egasi dasturchisiz o'zgartiradi)
- Isbot: PO_MAX_AMOUNT_UZS konstanta (app.constants.ts) — kodda qattiq; sozlamalar-oynasi UI yo'q. Chegara-qiymatlar (5mln/50mln) va sozlanuvchanlik egasi qaroriga bog'liq.

**11.68  🔑 egasi-data**  — ❓ Reyting og'irliklari (sifat40/muddat30/narx20/hujjat10) yakuniy qiymatini egasi tasdiqlaydimi?
- Siz: EP-MM-040: og'irlikni egasi tasdiqlaydi (karton/qog'ozda sifat ustuvor)
- Isbot: mm-vendor-rating.constants.ts MM_VR_DEFAULT_WEIGHTS=0.4/0.3/0.2/0.1 kodda default + override-mexanizmi bor (computeRating weights param), lekin yakuniy og'irlik egasi tasdig'ini kutadi (vizyon: og'irlikni egasi belgilaydi).

---

## 12 — LMS / Darslik  (vizyon 52%, 85 savol)

**12.1  ✅ bor**  — ❓ EP-LMS-001: Darslik kartaga biriktiriladimi (xodimga emas)?
- Siz: Kartaga biriktiriladi xodim almashsa darslik karta bilan qoladi, voris avto-oladi (A)
- Isbot: courses jadvalga card_id ustun+index qo'shilgan (lms-course-card-link-2026-06-22.sql); by-card/:cardId endpoint (lms-courses.controller.ts:79) + FE CardCoursesDialog.tsx by-card so'rovini ishlatadi. courses.card_id=0/5 (egasi-data)

**12.2  ✅ bor**  — ❓ EP-LMS-002: Darslik tugamaguncha o'sha karta oyligi to'xtaydimi?
- Siz: Ha, bloklaydi karta darsligi 100% tugamasa o'sha karta oyligi to'xtaydi (A)
- Isbot: payroll.service.ts:438 lmsGate.isCardTrainingComplete(cardId,employeeId) chaqiriladi; allComplete=false bo'lsa lmsBlocked=true, gross gated. LmsCardGateService REAL (267 qator), fail-closed.

**12.3  ✅ bor**  — ❓ EP-LMS-003: Ishga olinganda majburiy kurslar avto-tayinlanadimi?
- Siz: Avtomatik kartaga biriktirilishi bilan majburiy kurslar tushadi+muddat boshlanadi (A)
- Isbot: card-employee-assigned.handler.ts @OnEvent('org.card.employee.assigned') -> autoEnroll ON CONFLICT (employee_id,course_id), idempotent, soxta enrollment yaratmaydi.

**12.4  🟡 qisman**  — ❓ EP-LMS-004: Kurs tugamaguncha MES (mashina) bloklanadimi?
- Siz: Ha, qattiq blok majburiy xavfsizlik kursi tugamasa MES ishni boshlatmaydi (blocks_mes) (A)
- Isbot: lms-cert-expired-block.service.ts REAL UPDATE qiladi (deactivateSkill -> mes mashina), MES cert-expired listener 3 ta bor. Ammo kurs-tugatishdan ish-boshlash gate (enrollment incomplete->MES blok) to'g'ridan-to'g'ri ko'rinmadi; cert-muddat asosida blok bor.

**12.5  🟡 qisman**  — ❓ EP-LMS-005: Reglament testlari (har reglamentga test banki) bormi?
- Siz: To'liq har reglament uchun test banki+topshirish+ball+qayd (A)
- Isbot: lms_tests/lms_questions jadval + LmsTestsController CRUD bor (lms-tests.controller.ts:41-137), lekin lms_tests=0/lms_questions=0 (data yo'q); reglament-hujjat<->test avto-bog'lanishi ko'rinmadi.

**12.6  🟡 qisman**  — ❓ EP-LMS-006: Reglament testi uchun 7-kunlik muddat?
- Siz: 7 kun standart, sanagich avtomatik (A)
- Isbot: Enrollment muddat ustunlari (started_at, certificate_expires_at) bor; 7-kunlik reglament-test cron/deadline aniq implementatsiyasi LMS'da topilmadi (CRON action hali ulanmagan).

**12.7  🟡 qisman**  — ❓ EP-LMS-007: 7-kun o'tib topshirilmasa bosqichli oqibat?
- Siz: Bosqichma-bosqich ogohlantirish->rahbar/HR raport->oylik/MES blok (A)
- Isbot: Oylik-gate (EP-LMS-002) va MES-gate mexanizmi mavjud, lekin 7-kun deadline -> eskalatsiya zinapoyasi (kun1/kun3 bosqichli) aniq cron-handler topilmadi.

**12.8  🟡 qisman**  — ❓ EP-LMS-008: Test yiqilganda cheklangan qayta-test (2 marta)?
- Siz: 2 marta qayta, keyin majburiy qayta-o'qish+rahbar/HR aralashuvi (A)
- Isbot: courses.max_attempts ustuni bor; lms_exam_attempts/lms_test_attempts jadval bor (0 qator); 2-urinish->avto-qayta-o'qish AI triggeri aniq kod sifatida topilmadi.

**12.9  🔑 egasi-data**  — ❓ EP-LMS-009: O'tish bali kurs turiga qarab (TX=100%, oddiy 60-80%)?
- Siz: OCHIQ kurs turiga qarab, master-data; TX 100%, oddiy 70 (B-tavsiya)
- Isbot: lms-completion.constants.ts: LMS_GENERAL_PASS_THRESHOLD_PCT=70, LMS_TX_PASS_THRESHOLD_PCT=100 mavjud; courses.passing_score ustuni bor. Aniq qiymat sozlanadi (egasi-data, OCHIQ).

**12.10  🟡 qisman**  — ❓ EP-LMS-010: Micro-modullar (qisqa o'quv bo'laklari)?
- Siz: Ha har kurs micro-modullarga bo'linadi, smena oralig'ida o'tadi (A)
- Isbot: LmsMicroModulesController + recordMicroModuleView (lms-misc.service.ts:18) real; lms_modules=9 qator. Lekin micro-modul resume/timer (last_position) to'liq oqimi yengil.

**12.11  🟡 qisman**  — ❓ EP-LMS-011: Micro-modul ketma-ketligi majburiymi?
- Siz: OCHIQ ketma-ket, keyingisi oldingisi tugamaguncha ochilmaydi (A)
- Isbot: lms_modules.order/order_index/sort_order ustunlari bor (tartib saqlanadi); oldingi tugamasa keyingi ochilmaydi qattiq-gate logikasi ko'rinmadi. courses.prerequisite_course_id kurs-darajasida bor.

**12.12  🟡 qisman**  — ❓ EP-LMS-012: Kursni o'quv bo'limi->AI->HR+rahbar yaratadimi?
- Siz: O'quv bo'limi yaratadi->AI nazorat->HR qaror->rahbar tasdiq (A)
- Isbot: courses.author_id/created_by ustunlari + POST/PATCH/approve endpoint (lms-courses.controller.ts:98,125,198) bor; AI-nazorat->HR->rahbar to'liq approval-workflow zanjiri qisman (approve endpoint bor, ko'p-bosqichli emas).

**12.13  🟡 qisman**  — ❓ EP-LMS-013: AI o'qish nazorati + PDF hisobot?
- Siz: Ha AI o'qish holatini kuzatadi + PDF hisobot (kim o'qidi/qoldi/tushundimi) (A)
- Isbot: agents/lms-agent.service.ts mavjud (AI agent); progress/summary endpointlar bor (lms-misc.controller.ts:290). PDF AI-hisobot (kunlik/haftalik) aniq generator topilmadi.

**12.14  🟡 qisman**  — ❓ EP-LMS-014: AI chatbot orqali o'qitish/savol berish?
- Siz: Ha AI chatbot darslikni tushuntiradi va savol beradi (A)
- Isbot: lms-agent.service.ts bor; telegram/lms.handler.ts (83 qator) faqat course-completed/cert bildirishnoma; chatbot darslikni tushuntirish interaktiv kanali to'liq emas.

**12.15  ✅ bor**  — ❓ EP-LMS-015: Razryad imtihoni LMS ichida, o'tsa HR signal+sertifikat?
- Siz: Ha razryad imtihoni LMS test, o'tsa HR signal+ichki sertifikat (A)
- Isbot: exam-passed.contract.ts: EXAM_PASSED_EVENT='lms.exam.passed'; lms_exam_attempts.passed=true->org ExamPassedRazryadHandler razryad request (ai_suggested) avto-chaqiradi. Imtihon->razryad zanjir ulangan.

**12.16  🟡 qisman**  — ❓ EP-LMS-016: Razryad imtihoni 3 oylik oralig'i?
- Siz: 3 oy standart, oxirgi imtihondan 3 oy o'tmaguncha yangisi ochilmaydi (A)
- Isbot: Imtihon-zanjir kodi bor (exam-passed), lekin 3 oy minimal interval tekshiruvi (CRON) LMS'da aniq topilmadi; razryad-history org tomonda; LMS imtihon ochish-gate'i 3-oy bilan ko'rinmadi.

**12.17  ✅ bor**  — ❓ EP-LMS-017: Razryad o'sishi avtomatikmi yoki tasdiq bilan?
- Siz: Tasdiq bilan test o'tsa ham HR+yuqori rahbar tasdig'idan keyin (A)
- Isbot: exam-passed.contract.ts razryad requestni ai_suggested=true bilan yaratadi (avto-ko'tarmaydi); MEMORY: razryad-EXECUTION 2-imzo (HR+rahbar) qulflangan. Tasdiq-darvoza printsipi mavjud.

**12.18  🟡 qisman**  — ❓ EP-LMS-018: Ichki sertifikat (PDF) avtomatik beriladimi?
- Siz: Ha avto PDF sertifikat (kurs, sana, razryad, raqam) + arxiv (A)
- Isbot: lms_certificates + certificates jadval + LmsCertificatesController issue (lms-certificates.controller.ts:55) + standalone CRUD bor; lekin lms_certificates=0; PDF download faqat hardcoded HTML stub (lms-certificates-standalone.controller.ts:98).

**12.19  🔑 egasi-data**  — ❓ EP-LMS-019: Sertifikat amal muddati (qayta-sertifikatlash)?
- Siz: OCHIQ muddatli (masalan 1 yil), tugashidan oldin qayta-test eslatma (A); muddat HR sozlovi
- Isbot: enrollments.certificate_expires_at ustuni + GET expiring-certificates endpoint (lms-enrollments.controller.ts:199) + standalone expiring bor. Aniq muddat (1 yil) egasi sozlovi (OCHIQ).

**12.20  ✅ bor**  — ❓ EP-LMS-020: Kaizen taklif kiritish + holat?
- Siz: Ha, to'liq taklif+holat(yangi/ko'rilmoqda/qabul/rad)+javob (A)
- Isbot: kaizen_suggestions jadval (1 qator) + director/kaizen.controller+service+repo: createSuggestion/listSuggestions/updateSuggestion(status,reviewComment) REAL.

**12.21  ❌ yo'q**  — ❓ EP-LMS-021: Kaizen rasmiy PDCA tsikli (Reja-Bajar-Tekshir-Harakat)?
- Siz: To'liq PDCA 4 bosqich, mas'ul+muddat+natija qayd (A)
- Isbot: kaizen_suggestions jadvalda faqat status ustun; plan/do/check/act/pdca_stage ustunlari YO'Q (q.cjs tasdiq); kaizen.service.ts'da create/list/update bor, PDCA bosqich logikasi yo'q.

**12.22  ❌ yo'q**  — ❓ EP-LMS-022: Kaizen rag'bati (bonus)?
- Siz: OCHIQ qabul qilingan kaizen bonus tizimiga ulanadi (A); miqdor egasi sozlovi
- Isbot: kaizen_suggestions'da impact/bonus ustuni YO'Q; Payroll<->kaizen bonus ulanishi topilmadi. Bonus-shkala egasi-data, lekin mexanizm ham qurilmagan.

**12.23  ✅ bor**  — ❓ EP-LMS-023: Kurs holati ro'yxati (master-data)?
- Siz: Tayinlandi->Boshlandi->Tugatildi->Muddati o'tdi->Yiqildi (A)
- Isbot: lms_enrollments.status ustun + started_at/completed_at; LMS status-katalog ishlatiladi. Enrollment holat o'tishlari real (15 qator).

**12.24  ✅ bor**  — ❓ EP-LMS-024: Video darslik + ko'rilganlik nazorati?
- Siz: Ha video ko'rilganligi kuzatiladi, oxirigacha ko'rmasa tugatilmaydi (A)
- Isbot: video_progress jadval + saveVideoProgress REAL upsert (current_time/duration/completed, drizzle-lms-misc.repo.ts:44); LmsVideoProgressController; FE video-progress ulangan.

**12.25  🟡 qisman**  — ❓ EP-LMS-025: Lavozim papkasi (position folder) bilan bog'lanish?
- Siz: Ha karta papkasida darslik+video+test bir joyda (6-bo'lim=Ta'lim->LMS) (A)
- Isbot: FE CardFolderDialog.tsx + CardCoursesDialog (karta->darsliklar) bor; courses.card_id orqali bog'lanish. Papka 6-bo'lim sifatida to'liq integratsiya qisman.

**12.26  ✅ bor**  — ❓ EP-LMS-026: O'qish majburiy/ixtiyoriyligi kartada (is_mandatory)?
- Siz: Kartada belgilanadi HR qaysi kurs majburiy/ixtiyoriy sozlaydi (A)
- Isbot: courses.is_mandatory ustun mavjud (q.cjs tasdiq); LmsCardGateService faqat majburiy kurslarni gate qiladi; FE CardCoursesDialog c.is_mandatory ko'rsatadi.

**12.27  🔑 egasi-data**  — ❓ EP-LMS-027: O'qish davomati 3-kun blokiga ta'sir qiladimi?
- Siz: OCHIQ faqat eslatma; davomat-blok ayri, o'qish-kechikish oylik-gate orqali (A)
- Isbot: Oylik-gate (EP-LMS-002) mavjud; davomat<->o'qish granular bog'lanishi egasi tomonidan belgilanmagan (OCHIQ). Mexanizm asoslari bor.

**12.28  🟡 qisman**  — ❓ EP-LMS-028: Yangi reglament kartaga bog'lab tegishli xodimlarni qamraydimi?
- Siz: Kartaga bog'lab reglament qaysi kartalarga tegishli bo'lsa, o'sha xodimlarga test (A)
- Isbot: courses.card_id + auto-enroll event mexanizmi bor; reglament-hujjat->karta->test avto-tushishi (Director/GSD<->LMS) to'liq event-zanjiri qisman.

**12.29  🟡 qisman**  — ❓ EP-LMS-029: O'quv hisoboti va dashboard?
- Siz: Ha bo'lim/karta kesim foizi+orqadagilar+AI tahlil; HR mini-widget (A)
- Isbot: GET stats (lms-enrollments.controller.ts:184) + progress/summary (lms-misc.controller.ts) endpointlar + FE Courses.tsx (8 query/mutation) real; to'liq RBAC-filtrli dashboard+AI-tahlil qisman.

**12.30  🟡 qisman**  — ❓ EP-LMS-030: Onboarding (90 kun) o'qish rejasi bilan bog'lanish?
- Siz: Ha onboarding bosqichlari LMS kurslari bilan bog'lanadi, mentor kuzatadi (A)
- Isbot: hr_onboarding_processes=30/milestones=90 qator REAL; hr_mentorship_pairings jadval bor (0 qator). Onboarding<->LMS-kurs to'g'ridan-to'g'ri bog'lanishi qisman.

**12.31  🟡 qisman**  — ❓ EP-LMS-031: Nazorat varaqasi raqamli artefakt (FIO+sana+mavzular+tasdiq)?
- Siz: Ha har kartaga nazorat varaqasi obyekti, kitob struktura aynan; raqamli tasdiq tugmasi (A1)
- Isbot: Alohida nazorat_varaqa jadval YO'Q (q.cjs: hech narsa). Completion-service C3 topics course_progress'dan derive qilinadi (drizzle-lms.repo.ts:348), kitobdagi mustaqil varaqa-obyekti emas.

**12.32  ❌ yo'q**  — ❓ EP-LMS-032: Ikki varaqa Lavozim (12 mavzu) + Ishga xos (amaliy)?
- Siz: Ha, ikkita har kartada 2 varaqa, alohida tugatiladi (A)
- Isbot: Ikki turdagi varaqa/yo'riqnoma ajratmasi struktura sifatida topilmadi; courses jadvalda lavozim vs ishga-xos turi yo'q. Kitob-talabi qurilmagan.

**12.33  ❌ yo'q**  — ❓ EP-LMS-033: 12 universal mavzu shabloni (avto-qolip)?
- Siz: Ha yangi kurs ochilganda 12 mavzu bo'sh qolip chiqadi (A)
- Isbot: grep 12 mavzu/twelveTopic/standardTopics/topic_template = 0 natija; 12-mavzu shablon jadval/seed/kod yo'q. Kurs ochilganda avto-qolip mexanizmi qurilmagan.

**12.34  🟡 qisman**  — ❓ EP-LMS-034: Mavzu-mavzu tasdiq (o'qib chiqdim, progress 7/12)?
- Siz: Ha har mavzu yonida tasdiq, progress mavzular bo'yicha (A)
- Isbot: Completion-service mavzu-tasdiq tushunchasini (confirmed_at) KUTADI, lekin haqiqiy mavzu-tasdiq jadvali YO'Q totalTopics/confirmedTopics course_progress rows'dan olinadi (drizzle-lms.repo.ts:353), darslik-mavzu darajasidagi tugma emas.

**12.35  🟡 qisman**  — ❓ EP-LMS-035: Vaziyat-savol ikki qismli (A/B/V variant + ochiq izoh)?
- Siz: Ha, ikki qismli variant(avto)+ochiq izoh(AI baho+rahbar tasdiq A1) (A)
- Isbot: lms_exam_questions: options+correct_option bor (variant), lekin ochiq-izoh/explanation maydoni YO'Q (q.cjs: explanation/open_answer/ai_review=0); lms_exam_answers faqat selected_option. Ikki qismli izoh-baholash qurilmagan.

**12.36  ❌ yo'q**  — ❓ EP-LMS-036: Сборник упражнений (amaliy mashqlar) alohida bloki?
- Siz: Ha har kursda ayrim amaliy mashqlar bloki (ochiq javob, murabbiy baholaydi) (A)
- Isbot: Amaliy-mashqlar (exercises) alohida jadval/bloki topilmadi; lms_assignments jadval bor (0 qator) lekin amaliy mashqlar to'plami bilan ajratilgan struktura yo'q.

**12.37  ❌ yo'q**  — ❓ EP-LMS-037: Glossariy (lug'at) har kursga + matn-ichi atama izohi?
- Siz: Ha har kursning lug'ati + atama bosilganda izoh (kitob uslubi) (A)
- Isbot: grep glossar LMS BE'da 0 natija; glossary/lug'at jadval yoki kurs-atama izoh mexanizmi YO'Q. knowledge_base jadval bor lekin kurs-glossariy emas.

**12.38  🟡 qisman**  — ❓ EP-LMS-038: Mustaqil ishga qo'yish tartibi bosqichli buyruq zanjiri?
- Siz: Ha, to'liq workflow suhbat->RD-4->TX->buyruq->o'quv->instruktaj->2oy->imtihon->xulosa->ruxsat (A)
- Isbot: hr_onboarding_processes(30)+milestones(90) zanjir-skeleti REAL; lekin kitobdagi aniq 10-bosqichli (NO-1/RD-4/TX/buyruq/yozma xulosa) ketma-ket gate to'liq emas generic milestone'lar.

**12.39  ❌ yo'q**  — ❓ EP-LMS-039: RD-4 lavozim aniqlash suhbati onboarding boshida?
- Siz: Ha RD-4 suhbati qadami: karta+murabbiy+o'qish+sinov muddati kiritiladi (A)
- Isbot: RD-4 suhbat qadami aniq onboarding-bosqich sifatida topilmadi; onboarding_processes'da mentor_id bor lekin RD-4 qarori maxsus qadami yo'q.

**12.40  🟡 qisman**  — ❓ EP-LMS-040: 2 oylik amaliy o'qish muddati taymeri?
- Siz: Ha o'qish boshlanishidan 2 oy, tugashga yaqin murabbiy+RD-4 ga imtihon eslatma (A)
- Isbot: onboarding_processes.expected_end_date/actual_end_date bor (muddat skeleti); 2 oy amaliy aniq taymer + imtihon-eslatma cron LMS'da topilmadi.

**12.41  🟡 qisman**  — ❓ EP-LMS-041: Mustaqil ishdan oldin 2 imtihon (nazariy+amaliy)?
- Siz: Ha ikkalasi shart: nazariy(tizim testi)+amaliy(murabbiy/RD-4) (A)
- Isbot: lms-completion.service.ts C1(nazariy theoryScorePct)+C2(amaliy practicalPassed) 3-mezonli gate'da MODELLASHTIRILGAN; lekin amaliy-imtihon baholash jadvali (rubrika) data manbai yo'q (practicalPassed onboarding'dan map qilinishi kerak).

**12.42  ❌ yo'q**  — ❓ EP-LMS-042: RD-4 yozma xulosasi qadami?
- Siz: Ha imtihondan keyin RD-4 yozma xulosa+tasdiq, shundan keyin ruxsat (A)
- Isbot: Yozma xulosa (RD-4) onboarding qadami/maydoni topilmadi; approve-workflow generic, kitobdagi yozma-xulosa artefakt yo'q.

**12.43  🟡 qisman**  — ❓ EP-LMS-043: Mustaqil ishga ruxsat = avto buyruq + razryad/oylik faollashishi?
- Siz: Ha bosqichlar tugagach tizim buyruq loyihasini chiqaradi (HR tasdiq)+razryad/oylik (A)
- Isbot: Oylik-gate (EP-LMS-002) faollashish mexanizmi bor; lekin onboarding-yopilgach avto mustaqil ish buyrug'i (DocumentCreated event) zanjiri LMS'da aniq topilmadi.

**12.44  🟡 qisman**  — ❓ EP-LMS-044: TX instruktaj o'qishga kirish sharti (birinchi majburiy modul)?
- Siz: Ha TX birinchi majburiy modul, tasdiqlanmaguncha boshqa o'qish/MES ochilmaydi (A)
- Isbot: lms-cert-expired-block.service.ts TX-sertifikat muddati o'tsa MES bloklaydi (REAL UPDATE); lekin TX tasdiqlanmaguncha boshqa kurslar ochilmaydi birinchi-modul gate aniq emas cert-muddat asosida ishlaydi.

**12.45  ❌ yo'q**  — ❓ EP-LMS-045: Ish joyida birinchi instruktaj qaydi (kim/qachon)?
- Siz: Ha ish joyida instruktaj qadami (mas'ul RD-4/sex menejer, sana, tasdiq) (A)
- Isbot: Ish joyida instruktaj alohida qadam/qayd onboarding'da topilmadi; generic milestone'lar bor lekin bu maxsus instruktaj-qayd yo'q.

**12.46  🟡 qisman**  — ❓ EP-LMS-046: ЦКП har kursda kartadan keladimi (yagona manba)?
- Siz: Ha kursning ЦКП mavzusi kartaning ЦКП maydonidan avto (yagona manba) (A)
- Isbot: MEMORY: ЦКП karta atributi mavjud (org_departments); courses.card_id orqali kartaga bog'lanish bor. Lekin kurs-mavzu sifatida ЦКП'ni kartadan READ qilib ko'rsatish (12-mavzu shablonsiz) qurilmagan.

**12.47  ❌ yo'q**  — ❓ EP-LMS-047: Ko'p uchraydigan xatolar bloki + jonli (QC/MES) yangilanish?
- Siz: Ha+jonli kursda xatolar bloki, sifat/MES real xatolardan boyitiladi (A)
- Isbot: Ko'p uchraydigan xatolar kurs-bloki + QC/MES'dan jonli yangilanish (defect event->LMS) topilmadi; 12-mavzu shablon yo'qligi sababli bu mavzu-blok ham yo'q.

**12.48  ❌ yo'q**  — ❓ EP-LMS-048: Muvaffaqiyatli harakatlar bloki + blanka (rahbar to'ldiradi)?
- Siz: Ha blanka: rahbar real misol qo'shadi, NO-14 tasdiqlaydi, kursga ulanadi (A)
- Isbot: Muvaffaqiyatli harakatlar blanka jadval/endpoint topilmadi; rahbar->NO-14 tasdiq->kurs oqimi qurilmagan.

**12.49  🟡 qisman**  — ❓ EP-LMS-049: Malaka talablari kursda va kartada?
- Siz: Ha karta malaka talablari->kurs mavzulari shu talablardan (A)
- Isbot: card_required_knowledge jadval + CardRequiredKnowledgeController CRUD (card-knowledge/by-card) REAL (0 qator); malaka-talab<->kurs-mavzu avto-generatsiya qisman (12-mavzu shablonsiz).

**12.50  🟡 qisman**  — ❓ EP-LMS-050: Domen-bilim modullari (qog'oz/gofra turlari) katalogga bog'liq?
- Siz: Ha domen-bilim modullari material/mahsulot katalogiga bog'lanadi (A)
- Isbot: card_required_knowledge jadval + CRUD bor (domen-bilim qayd qilish strukturasi); material-katalog<->kurs avto-yangilanish (MaterialAdded event->LMS) ulanishi topilmadi.

**12.51  ❌ yo'q**  — ❓ EP-LMS-051: Statistik ko'rsatkichlar mavzusi = karta KPI?
- Siz: Ha statistik ko'rsatkichlar mavzusi karta KPI/ЦКП o'lchovidan keladi (A)
- Isbot: Kurs-mavzu sifatida statistik ko'rsatkichlarni karta KPI'dan READ qilib ko'rsatish topilmadi (12-mavzu shablon yo'q). KPI org/HR'da bor lekin LMS-mavzuga ulanmagan.

**12.52  ❌ yo'q**  — ❓ EP-LMS-052: Lavozim huquqlari va javobgarligi o'qitilishi?
- Siz: Ha huquqlar/javobgarlik alohida mavzular, kartadan keladi, test bilan (A)
- Isbot: Huquq/javobgarlik kurs-mavzulari (kartadan READ) topilmadi; 12-mavzu shablon yo'qligi sababli bu mavzular ham yo'q.

**12.53  🟡 qisman**  — ❓ EP-LMS-053: Ish joyi vositalari jihozlar katalogiga bog'lanish (kerakli jihozlar)?
- Siz: Ha ish joyi vositalari mavzusi aktivlar/jihozlar katalogiga (kartaning kerakli jihozlari) (A)
- Isbot: card_required_knowledge jadval kartaga kerakli bilim/vosita qayd qiladi (CRUD real); aktivlar/jihozlar moduliga avto-bog'lanish (jihoz o'zgarsa kurs yangilanadi review_required bayrog'i) topilmadi.

**12.54  ❌ yo'q**  — ❓ EP-LMS-054: Orgsxemadagi joylashuvi mavzusi org-chartdan keladimi?
- Siz: Ha mavzu jonli org-chartdan (xodim o'z kartasi/rahbari/hamkorlarni ko'radi) (A)
- Isbot: Kurs-mavzu sifatida jonli org-chart joylashuvini ko'rsatish topilmadi; org-tuzilma Vysotskiy-7 bor lekin LMS-kurs-mavzuga ulanmagan.

**12.55  ❌ yo'q**  — ❓ EP-LMS-055: 7 departament tuzilmasi umumiy kursi?
- Siz: Ha barcha yangi xodimga majburiy Korxona tuzilmasi (7 departament) kursi (A)
- Isbot: 7 departament umumiy majburiy kursi (courses) topilmadi; courses=5 qator, departament-tuzilma kursi seed qilinmagan.

**12.56  🟡 qisman**  — ❓ EP-LMS-056: O'quv bo'limi (NO-14) o'quv dasturi hajmini aniqlash roli?
- Siz: Ha o'quv bo'limi har xodim/karta uchun dastur hajmini belgilaydi (A)
- Isbot: TRAINING_OFFICER roli RBAC'da bor (lms-misc.controller @Roles); o'quv dasturi hajmini belgilash maxsus endpoint/jadval topilmadi kurs-tayinlash bor, dastur-hajm rejasi yo'q.

**12.57  🔑 egasi-data**  — ❓ EP-LMS-057: Murabbiyning o'zi malakali ekanini tekshirish?
- Siz: OCHIQ min razryad+o'sha karta sertifikati+murabbiylik moduli shart (A); chegara HR sozlovi
- Isbot: lms_card_mentors CRUD bor (mentor kartaga biriktiriladi); murabbiy-malaka tekshiruvi (razryad/sertifikat sharti) qoidasi egasi tomonidan belgilanmagan (OCHIQ), kod-validatsiya yo'q.

**12.58  🔑 egasi-data**  — ❓ EP-LMS-058: Murabbiy bo'lmaganda zaxira tartib (kichik bo'lim)?
- Siz: OCHIQ yuqori rahbar/yondosh karta egasi murabbiy; AI nazariyni qoplaydi (A)
- Isbot: lms_card_mentors + AI-agent bor; zaxira-murabbiy avto-tayinlash (org-vertikal zanjir) qoidasi belgilanmagan (OCHIQ), aniq fallback kodi yo'q.

**12.59  🟡 qisman**  — ❓ EP-LMS-059: Murabbiy shogird progressini real vaqtda ko'radimi?
- Siz: Ha murabbiyda mening shogirdlarim paneli (mavzu/test holati) (A)
- Isbot: lms_card_mentors + progress/by-user endpoint (lms-misc.controller.ts:282) bor; alohida mentor shogirdlar paneli real-time view to'liq emas progress so'rovlari mavjud.

**12.60  ❌ yo'q**  — ❓ EP-LMS-060: Yakuniy topshiriqlar bo'lim oxiridagi yig'ma test?
- Siz: Ha har bo'lim oxirida yakuniy topshiriqlar (o'tilmasa keyingi bo'lim ochilmaydi) (A)
- Isbot: Yakuniy topshiriqlar bo'lim-oxiri yig'ma test bloki + bo'lim-gate topilmadi; lms_modules.order bor lekin bo'lim-yakun gate yo'q.

**12.61  🟡 qisman**  — ❓ EP-LMS-061: Sinov muddati natijasi LMS bilan bog'liqligi?
- Siz: Ha sinov muddati yakunida LMS natijasi (imtihon+murabbiy) qaror uchun yig'iladi (A)
- Isbot: onboarding_processes + LMS completion-gate bor; sinov-muddat<->LMS-natija aniq yig'ish (probation decision feed) event topilmadi.

**12.62  ❌ yo'q**  — ❓ EP-LMS-062: Amaliy imtihon baholash varaqasi (mezon+ball+izoh)?
- Siz: Ha amaliy imtihon baholash varaqasi: mezonlar+ball+baholovchi izohi (A)
- Isbot: Amaliy-imtihon rubrika/baholash-varaqa jadvali topilmadi; completion-service practicalPassed faqat boolean kutadi, mezonli-rubrika manbai yo'q.

**12.63  🟡 qisman**  — ❓ EP-LMS-063: Lavozim o'zgarganda yangi nazorat varaqasi avto-tayinlash?
- Siz: Ha yangi kartaga o'tganda varaqa avto-tayinlanadi (eski yopiladi, arxiv) (A)
- Isbot: card-employee-assigned.handler auto-enroll mavjud (yangi kartaga kurslar tushadi); lekin nazorat-varaqa obyekti yo'qligi sababli varaqa avto-tayinlash/eski yopish aniq emas kurs-enroll darajasida.

**12.64  🟡 qisman**  — ❓ EP-LMS-064: Nazorat varaqasini kitob formatida PDF eksport?
- Siz: Ha tugatilgan varaqa kitob formatida PDF (FIO/tashkilot/sanalar/tasdiqlar/imtihon) (A)
- Isbot: Cert download endpoint bor lekin faqat hardcoded HTML stub (raqam+sana, lms-certificates-standalone.controller.ts:98) kitob-formatli to'liq rekvizitli PDF emas; nazorat-varaqa eksporti yo'q.

**12.65  ❌ yo'q**  — ❓ EP-LMS-065: Ishga-xos yo'riqnoma o'zgarsa kartadagi hammaga qayta-o'qish?
- Siz: Ha versiya o'zgarsa, o'sha kartadagi xodimlarga yangilangan qism+qisqa test (A)
- Isbot: Yo'riqnoma-versiya diff->qayta-o'qish avto-tayinlash (changed_topics) event topilmadi; courses.updated_at bor lekin versiya-diff qayta-o'qish mexanizmi yo'q.

**12.66  ❌ yo'q**  — ❓ EP-LMS-066: ERP tizimida ishlash ko'nikmasi alohida majburiy modul?
- Siz: Ha ERP tizimida ishlash majburiy modul, kartaga qarab ekranlar (A)
- Isbot: ERP tizimida ishlash maxsus majburiy kurs/modul (courses) topilmadi; courses=5 qator, bunday kurs seed qilinmagan.

**12.67  🟡 qisman**  — ❓ EP-LMS-067: Onboarding hujjatlar to'plami (ariza/buyruq/TX/varaqa/xulosa)?
- Siz: Ha onboarding hujjatlar checklist + har biri fayl/qayd (A)
- Isbot: hr_onboarding_checklists jadval bor (checklist skeleti); to'liq hujjat-to'plami (ariza+buyruq+TX+varaqa+xulosa) bitta yig'ma fayl/qayd sifatida topilmadi.

**12.68  ❌ yo'q**  — ❓ EP-LMS-068: Departament/sex bo'yicha o'quv qatlamlash (3 qatlam)?
- Siz: Uch qatlam umumiy korxona+departament/sex+lavozim-karta kurslari qatlamlanadi (A)
- Isbot: courses.department_id/org_department_id + card_id ustunlari mavjud (qatlamlash uchun asos), lekin 3-qatlamli (umumiy/departament/karta) avto-qatlamlash logikasi qurilmagan.

**12.69  🟡 qisman**  — ❓ EP-LMS-069: O'qish eslatmasi kanali Telegram bot?
- Siz: Telegram bot + ilova ichi asosiy Telegram bot orqali (A)
- Isbot: telegram/lms.handler.ts (83 qator) bor lekin faqat course-completed/cert bildirishnoma o'qishingiz bor/muddat tugayapti/qayta-test eslatma oqimi yo'q; bot=eslatma, tasdiq LMS ichida.

**12.70  🟡 qisman**  — ❓ EP-LMS-070: To'liq o'zlashtirish 3-mezon (nazariy+amaliy+mavzu-tasdiq 100%)?
- Siz: Uch mezon nazariy test+amaliy imtihon+mavzu-tasdiqlar 100%, uchalasi (A)
- Isbot: lms-completion.service.ts pure 3-condition gate REAL (C1 theory>=threshold, C2 practicalPassed, C3 topics 100%); LEKIN C3 manbai course_progress'dan derive (mavzu-tasdiq jadvali yo'q) va C2 amaliy-rubrika data-manbai yo'q mantiq bor, data-iplari chala.

**12.71  🟡 qisman**  — ❓ EP-LMS-071: O'quv tarixi arxivi (xodim ketsa ham karta varaqasi qoladi)?
- Siz: Ha o'quv tarixi xodim profilida doimiy arxiv + varaqa karta tarkibida (A)
- Isbot: enrollments + soft-delete (deleted_at) pattern bor; darslik kartaga (card_id) bog'lanadi -> karta bilan qoladi; 7-yil retention/voris-oladi to'liq arxiv-oqimi qisman (nazorat-varaqa obyekti yo'q).

**12.72  🔑 egasi-data**  — ❓ EP-LMS-072: Davriy qayta-tasdiq (yo'riqnoma o'zgarmasa ham)?
- Siz: OCHIQ yiliga bir marta lavozim varaqasini qayta tasdiqlash (A); davr egasi sozlovi
- Isbot: certificate_expires_at + expiring-certificates endpoint asoslari bor; davriy qayta-tasdiq cron (yillik) qurilmagan, davr egasi sozlovi (OCHIQ).

**12.73  ❌ yo'q**  — ❓ EP-LMS-073: Tashkiliy siyosat (ОРГПОЛИТИКА) hujjatlari testga bog'lanadimi?
- Siz: Ha siyosat hujjatlari umumiy reglament sifatida o'qish+tasdiq (A)
- Isbot: ОРГПОЛИТИКА/siyosat-hujjat->LMS reglament-test bog'lanishi topilmadi; reglament-test mexanizmi (lms_tests=0) data-siz va hujjat-ulanishsiz.

**12.74  ❌ yo'q**  — ❓ EP-LMS-074: Tijorat siri/maxfiylik moduli majburiy + yozma tasdiq?
- Siz: Ha tijorat siri va maxfiylik majburiy modul + yozma tasdiq (NDA o'rni) (A)
- Isbot: Tijorat-siri/maxfiylik majburiy kurs (courses) + yozma-tasdiq (NDA-iz) topilmadi; bunday modul seed qilinmagan.

**12.75  ❌ yo'q**  — ❓ EP-LMS-075: Tashqi malaka/sertifikatni ichki kurs o'rniga hisoblash?
- Siz: Ha tashqi sertifikat/diplom yuklanadi+HR tasdiq->ichki kurs/malaka qondirilgan (A)
- Isbot: Tashqi sertifikat yuklash+HR tasdiq->ichki kurs/malaka qondirilgan hisoblash mexanizmi LMS'da topilmadi; cross_card_credits ichki-ichki, tashqi-import emas.

**12.76  🟡 qisman**  — ❓ EP-LMS-076: Replication testi rahbar dars yaratadi, xodimlar o'qiydi?
- Siz: Ha LMS ichida modul: rahbar metodologiyasini dars qiladi, jamoa o'qiydi (A)
- Isbot: courses.author_id + POST courses (rahbar dars yaratishi mumkin) asoslari bor; maxsus Replication rahbar-muallif kanali/modul sifatida ajratilgan emas.

**12.77  ❌ yo'q**  — ❓ EP-LMS-077: Leadership/Origin liderlik testi?
- Siz: Ha liderlik salohiyati testi: yillik+zaxira(vorislik)+lavozim o'zgarishida (A)
- Isbot: grep leadership/origin test LMS'da maxsus jadval/kod topilmadi (faqat completion-service izohida eslatilgan); liderlik-test moduli qurilmagan.

**12.78  🔑 egasi-data**  — ❓ EP-LMS-078: Ishdagi vaziyat interaktiv simulyatsiya rejimi?
- Siz: OCHIQ vaziyat-mashqlar interaktiv (qaror->oqibat->izoh) (A); ko'lam egasi prioriteti
- Isbot: Interaktiv simulyatsiya (qaror->oqibat modellashtirish) mexanizmi topilmadi; ko'lam egasi tomonidan belgilanmagan (OCHIQ), kod yo'q.

**12.79  🟡 qisman**  — ❓ EP-LMS-079: Imtihon savollarini kim tuzadi/tasdiqlaydi?
- Siz: O'quv bo'limi tuzadi (AI yordamida)->rahbar/HR tasdiq (A)
- Isbot: LmsQuestionsController CRUD + TRAINING_OFFICER RBAC + courses approve endpoint bor; savol->AI-draft->rahbar/HR tasdiq to'liq workflow zanjiri qisman.

**12.80  🟡 qisman**  — ❓ EP-LMS-080: AI yo'riqnomadan avto test+glossariy+micro-modul generatsiyasi?
- Siz: Ha AI yo'riqnomadan test/glossariy/micro-modul loyihasi, odam tasdiqlaydi (A)
- Isbot: agents/lms-agent.service.ts (AI agent) mavjud; yo'riqnoma-matn->avto test/glossariy/micro-modul drafting oqimi to'liq emas (glossariy umuman yo'q).

**12.81  🟡 qisman**  — ❓ EP-LMS-081: O'qish davomida savol berish (murabbiy/AI'ga)?
- Siz: Ha har mavzuda savol berish tugmasi: AI birlamchi javob, murabbiy/rahbarga eskalatsiya (A)
- Isbot: lms_support_tickets jadval + support/tickets POST (lms-core.controller.ts:166) bor (savol kanali); AI-birlamchi-javob+eskalatsiya zanjiri qisman.

**12.82  🔑 egasi-data**  — ❓ EP-LMS-082: Imtihon natijasi murabbiy reytingiga ta'siri?
- Siz: OCHIQ shogird muvaffaqiyati murabbiy reyting/bonusiga (salbiy jazo yo'q) (A); vazn HR sozlovi
- Isbot: lms_card_mentors bor; murabbiy-reyting<->shogird-natija bog'lanishi (KPI vazni) egasi tomonidan belgilanmagan (OCHIQ), kod yo'q.

**12.83  🟡 qisman**  — ❓ EP-LMS-083: Kursga namuna fayl/rasm ilova (texkarta/maket/podpisnoy)?
- Siz: Ha har mavzuga namuna fayl/rasm (to'g'ri va noto'g'ri misol) (A)
- Isbot: courses.thumbnail/thumbnail_url + Storage moduli bor (fayl ilova asosi); mavzu-darajasida namuna fayl (to'g'ri/noto'g'ri misol) struktura sifatida ajratilgan emas.

**12.84  🟡 qisman**  — ❓ EP-LMS-084: Ko'p kartali xodim o'quvi navbati (birlamchi karta birinchi)?
- Siz: Har karta alohida birlamchi karta o'quvi birinchi (oylik unga bog'liq), qolganlar navbat (A)
- Isbot: courses.card_id + LmsCardGateService har kartani mustaqil gate qiladi (ko'p-karta model); birlamchi-karta birinchi navbat tartibi aniq logika sifatida ko'rinmadi karta-bo'yicha mustaqil gate bor.

**12.85  🟡 qisman**  — ❓ EP-LMS-085: O'qish qaysi qurilmada sex tableti (POS Monitor)/telefon?
- Siz: Ha telefon+sex tableti (POS Monitor)da o'qish, smena oralig'ida qisqa modul (A)
- Isbot: POS Monitor (sex tablet) moduli mavjud + micro-modul+video-progress endpointlar (mobil-mos); POS Monitor ekraniga LMS-o'quv to'g'ridan-to'g'ri integratsiyasi qisman (alohida o'quv-ekran emas).

---

## 13 — CRM  (vizyon 58%, 85 savol)

**13.1  ✅ bor**  — ❓ Lid→bitim→voronka bosqichlari (Yangi→Aloqa→KP→Muzokara→Yutdik/Yutqazdik) + har bosqich konversiya foizi bormi?
- Siz: To'liq voronka + bosqichma-bosqich konversiya ko'rsatkichi (ShVB conversionRate/salesCycleLength)
- Isbot: crm_lead_stages=6 jonli (Yangi lid/Jarayonda/Tahlil/Yakunlash/Konvertatsiya/Yo'qotildi); funnel.service.ts:9 conversion=movedToNext/entered×100, calculateConversion(); FE MarketingLeads.tsx funnelData useQuery

**13.2  🔑 egasi-data**  — ❓ Voronka bosqichlarini kim belgilaydi — zavod jarayoniga moslab (namuna→klişe/STP→narx→shartnoma)?
- Siz: Zavon jarayoniga moslab, keyin egasi tahrir qiladi — aniq nomlar egasidan
- Isbot: crm_stages=0 (pipeline-konfig BO'SH); crm_lead_stages=6 generic nomlar (zavod namuna/klişe/STP bosqichlari YO'Q). Aniq bosqich nomlari egasidan kutiladi

**13.3  ✅ bor**  — ❓ Lidlar qayerdan keladi — ko'p manba (vebsayt+Telegram+qo'ng'iroq+qo'lda), har lidda 'manba' majburiy?
- Siz: Ko'p manba, manba majburiy (modul botlari + europrint.uz)
- Isbot: crm-auto-lead.controller.ts:71 GET auto-lead/sources; repository ingestCallLead/ingestFormLead/ingestTelegramLead har biri source='call'/'web_form'/'telegram' yozadi (real db.insert(crmLeads))

**13.4  ✅ bor**  — ❓ Vebsayt va Telegramdan AVTOMATIK lid yaratish + sotuvchiga darhol bildirishnoma?
- Siz: Avtomatik lid + Telegram bildirishnoma
- Isbot: website-contact-lead.listener.ts @EventsHandler(WebsiteContactSubmittedEvent)→WebsiteLeadService.handleWebsiteContact; website-lead.service.ts:47 notifySalesGroup; ingestTelegramLead real INSERT

**13.5  ✅ bor**  — ❓ Lidni AVTOMATIK sotuvchiga biriktirish (round-robin/hudud); boshliq qayta taqsimlay oladi?
- Siz: Avtomatik navbat (round-robin) yoki hudud qoidasi
- Isbot: website-lead.repository.ts:37 pickNextSalesManager() — oxirgi 30 kunda eng kam lead biriktirilgan faol sales_manager (GROUP BY, ORDER BY COUNT ASC LIMIT 1) jonli SQL

**13.6  ✅ bor**  — ❓ Faollik (activity) jurnali — qo'ng'iroq/xat/uchrashuv/eslatma, sana+kim?
- Siz: To'liq faollik jurnali (audit-log ruhi)
- Isbot: crm_activities jadval jonli (3 qator); crm-comms.repository.ts har aloqa (email/sms/whatsapp/meeting) crm_activities ga type+subject+notes+status bilan INSERT; crm-activities.controller.ts mavjud

**13.7  🟡 qisman**  — ❓ Aloqa kanallari (SMS/Email/Telegram/WhatsApp) — hammasi kartada?
- Siz: To'rttasi kartada (Email+Telegram tasdiqlangan, WhatsApp/SMS provayder egasidan)
- Isbot: crm-comms.controller.ts email/send, sms/send, whatsapp/send, meetings/schedule endpointlari BOR, lekin crm-comms.service.ts faqat repo.logEmail/logSms ga YOZADI va {sent:true} qaytaradi — HAQIQATDA yubormaydi (provayder integratsiyasi yo'q). Telegram alohida bot orqali

**13.8  🟡 qisman**  — ❓ Yozishmalar tarixini saqlash — hamma yozishma avtomatik kartada?
- Siz: Hamma yozishma ERPda saqlanadi (Q77)
- Isbot: crm_activities ga notes sifatida log yoziladi (matn saqlanadi), lekin to'liq ikki-tomonlama yozishma sinxroni (kelgan xabar) yo'q — faqat chiqayotgan log. Korporativ akkaunt arxivlash YO'Q

**13.9  🟡 qisman**  — ❓ Vazifalar (task) va eslatmalar — vazifa + avtomatik eslatma + bajarilmasa boshliqqa signal?
- Siz: Vazifa+eslatma+eskalatsiya (Q122)
- Isbot: crm_tasks jadval jonli (7 qator); crm-extras-tasks.repository.ts listTasks(due_date,status,assigned_to) real. Lekin avtomatik eslatma yuborish + boshliqqa eskalatsiya CRON mexanizmi CRM-da tasdiqlanmadi

**13.10  🟡 qisman**  — ❓ Kechiktirilgan vazifa ustidan nazorat — kechikkan vazifa boshliq paneliga + ogohlantirish?
- Siz: Kechikkan vazifalar avto boshliq paneliga
- Isbot: FE MarketingLeads.tsx:65 '/api/marketing/leads/automation/overdue-leads' useQuery (overdue ko'rsatiladi); supervisor-dashboard endpoint bor. Avto-eskalatsiya/Telegram signal to'liq tasdiqlanmadi

**13.11  ✅ bor**  — ❓ Hot-lead (qaynoq mijoz) belgisi — faollik+summa bo'yicha avtomatik ajratish?
- Siz: AI 70% tahlil bilan qaynoq lid ajratiladi (lead-scoring kod bor)
- Isbot: crm-lead-scoring.service.ts pure formula + TIER_HOT_MIN=70/TIER_WARM_MIN=40 (hot/warm/cold); agents/lead-scoring-agent.service.ts; crm-auto-lead quick-score/:entityType/:id endpoint

**13.12  🔑 egasi-data**  — ❓ Lid baholash (lead scoring) — 5 mezon (qiziqish/summa/javob-tezligi/manba/fit) vaznli ball?
- Siz: Avtomatik ballash, MEZON/QOIDALAR egasidan (ball-formula vazni)
- Isbot: crm-lead-scoring.constants.ts default vaznlar BOR (budget .30/engagement .25/recency .20/source .15/fit .10, sum=1.0) + SOURCE_QUALITY_MAP. Kod tayyor, lekin izoh: 'owner can set per-tenant overrides' — yakuniy vazn egasidan

**13.13  ✅ bor**  — ❓ AI — Keyingi eng yaxshi harakat (NBA): AI taklif, sotuvchi tasdiqlab bajaradi?
- Siz: AI taklif beradi, inson tasdiqlaydi (Q99)
- Isbot: crm-ai.service.ts:94 getNextBestAction(entityType,eid)→recommended_action+alternatives+reasoning ('Based on last activity type'); crm-extended.controller.ts GET ai/nba/:entityType/:entityId

**13.14  ✅ bor**  — ❓ AI — Churn (mijoz ketib qolishi) bashorati + qaytarish vazifasi?
- Siz: AI ketish-xavfli mijozlarni ro'yxatga + qaytarish vazifasi
- Isbot: churn.service.ts logistik-regressiya P(churn)=σ(β₀+...β₅x₅), 5 feature (recency/complaints/days/tickets/late), HIGH>0.7/MEDIUM>0.4; crm-analytics.controller.ts POST churn/predict; crm-auto-lead churn-rescue/:id

**13.15  ✅ bor**  — ❓ Mijoz tarixi (360° ko'rinish) — buyurtma+to'lov+qarz+yozishma+shikoyat bir kartada?
- Siz: To'liq 360° ERP modullari bilan bog'langan
- Isbot: customer-360.builder.ts: orders/payments/openDebt(=revenue−paid)/complaints(filter type='complaint')/contacts/NPS/competitors; FE Customer360View.tsx GET /api/sd/customers/:id/360

**13.16  ✅ bor**  — ❓ CRM mijozi↔zavod buyurtmasi (oltin ip) — bitim yutilsa sotuv buyurtmasi avtomatik?
- Siz: Bitim yutilsa→sales_order avtomatik (vizyon yadrosi)
- Isbot: crm-deals.controller.ts:133 markWon→MarkDealWonCommand→DealWonEvent; sd/deal-won.listener.ts @EventsHandler(DealWonEvent)→CreateOrderCommand→sales_order (idempotent, golden-thread back-link). JONLI REAL zanjir

**13.17  ✅ bor**  — ❓ Mijoz bazasi qayerda — yagona kanonik manba, hamma modul shundan oladi?
- Siz: Yagona kanonik baza (nomzod sd_customers)
- Isbot: sd_customers jonli (15 qator) kanonik; lead-converted-customer.listener.ts won-lead→sd_customers INSERT (segment='new', idempotent); 360 builder sd_customers dan o'qiydi

**13.18  🔑 egasi-data**  — ❓ Mijoz turlari va segmentlari (VIP/asosiy/oddiy) — oborot/sodiqlik bo'yicha?
- Siz: Segment ro'yxati egasi mezonlariga moslab (nomlar egasidan)
- Isbot: sd_customers.segment CHECK ∈ {vip/regular/new/potential} jonli mavjud; ABC avto-toifa kod (drizzle-sd-customers ABC_SCORE_WEIGHT). Aniq segment nomlari/mezonlari egasidan

**13.19  ✅ bor**  — ❓ RFM/CLV tahlili (mijoz qadr-qiymati) panelga chiqadimi?
- Siz: RFM+CLV hisobi panelga
- Isbot: rfm.service.ts segmentCustomers()/scoreOne(); clv.service.ts; kmeans.service.ts; crm-analytics.controller.ts POST rfm/cluster; FE CrmRfmClusters.tsx

**13.20  🔑 egasi-data**  — ❓ Yutqazilgan bitim sababini yozish — majburiy sabab (tayyor ro'yxat)+izoh→hisobot?
- Siz: Majburiy sabab + hisobot (sabab ro'yxati egasidan)
- Isbot: FE MarketingLeads.tsx:79 lossAnalysis useQuery '/api/marketing/leads/loss-analysis' BOR (yutqaz tahlil ko'rinadi). Aniq sabab ro'yxati (narx/muddat/sifat/raqobatchi) egasidan kutiladi

**13.21  🟡 qisman**  — ❓ Kommercheskiy taklif (KP) tayyorlash+yuborish+holat kuzatish (ko'rildi/qabul/rad)?
- Siz: Tizim ichida KP + holat (Пепси КП real hujjat)
- Isbot: sd-quotations.service.ts/controller.ts SD modulida KP/kotirovka BOR; crm_proposals jadval JONLI lekin BO'SH (0 qator). KP→holat tracking (ko'rildi pixel/Telegram) tasdiqlanmadi

**13.22  🟡 qisman**  — ❓ Karta-model bilan integratsiya — sotuvchi faqat o'z mijozini, boshliq hammasini?
- Siz: CRM huquqlari karta bo'yicha (maydon darajasi RBAC)
- Isbot: crm-leads.controller.ts CRM_READ_ROLES=[sales_manager/SALES/crm_manager/director/super_admin] @Roles guard BOR (rol-daraja). Lekin sotuvchi 'faqat o'z mijozi' row-level filtri (WHERE assigned_to=current_user) leads/customers query'larda TOPILMADI

**13.23  🟡 qisman**  — ❓ Sotuvchi ЦКП va KPI bog'lanishi — yopilgan bitim/oborot avto KPI paneliga?
- Siz: Yopilgan bitim avto sotuvchi KPI/ЦКП ga (ShVB YO'NALISH 26)
- Isbot: DealWonEvent→deal-won-notification.listener bor; ShVB YO'NALISH 26 GSD'lar reja. CRM bitim→sotuvchi karta-GSD/ЦКП paneliga avtomatik ulanishi to'liq jonli tasdiqlanmadi (event bor, GSD-yangilash zanjiri noaniq)

**13.24  🔑 egasi-data**  — ❓ Mijoz qarzdorligi bo'yicha ogohlantirish — limitdan oshsa, boshliq ruxsatisiz yangi bitim ochilmaydi?
- Siz: Qarz limitidan oshsa blok+tasdiq (ShVB debtorControl)
- Isbot: 360 builder openDebt hisoblaydi; sd_customers.is_blocked maydoni bor. Lekin qarz-limit blok oqimi + aniq LIMIT qiymati (Finance/Даромадлар bilan) egasidan; avto-blok kodi tasdiqlanmadi

**13.25  🟡 qisman**  — ❓ Mijoz shikoyatlari/reklamatsiyalar bog'lanishi — kartada, hal bo'lguncha qizil belgi?
- Siz: Shikoyatlar 360° kartada (QC bilan)
- Isbot: customer-360.builder.ts:124 complaints=interactionsRows.filter(type='complaint') ko'rsatiladi (NEG_WORDS sentiment ham). Lekin QC reklamatsiya→CRM event (QcReclamationOpenedEvent) + 'hal bo'lmaguncha qizil/blok' zanjiri tasdiqlanmadi

**13.26  🟡 qisman**  — ❓ Avtomatik eslatma kampaniyalari (follow-up) — 30/60/90 kun jimlikdan keyin vazifa?
- Siz: Qoidaga ko'ra avto follow-up (churn/retention)
- Isbot: crm/listeners/website-order-lead bor; churn-rescue endpoint bor; crm_followup_activities jadval jonli. Lekin 30/60/90-kun jimlik CRON kampaniyasi kodi tasdiqlanmadi

**13.27  ✅ bor**  — ❓ CRM boshqaruv paneli (boshliq) — voronka+reyting+AI signal+kechikkan vazifa bir ekran?
- Siz: To'liq direktor/boshliq dashboard (Q123)
- Isbot: crm-auto-lead.controller.ts:53 GET supervisor-dashboard; crm-extended.controller.ts GET supervisor/dashboard + ai/supervisor-dashboard; crm-auto-lead.repository getSupervisorDashboard() real SQL

**13.28  ❌ yo'q**  — ❓ Telefon qo'ng'irog'ini yozib olish va kartaga biriktirish (kim/qachon/davomiylik/yozuv)?
- Siz: Telefoniya ulanadi, qo'ng'iroq avto kartaga (provayder egasidan)
- Isbot: Telefoniya/ATS integratsiyasi YO'Q; call/phone/recording jadvali topilmadi (information_schema da phone/call CRM jadvali yo'q). Faqat auto-lead/call manual ingest bor. Provayder egasidan kutiladi

**13.29  🟡 qisman**  — ❓ Mobil ilovada CRM (sotuvchi tashqarida) — lid/vazifa/yozishma ishlaydi?
- Siz: Responsive web + modul Telegram botlari (POS Q3)
- Isbot: FE responsive (Tailwind) + Telegram bot ingest (ingestTelegramLead) BOR. PWA oflayn rejim (lid qo'shish, conflict resolution) CRM-spetsifik tasdiqlanmadi

**13.30  🟡 qisman**  — ❓ Mijoz ma'lumotlariga kirish chegarasi (maxfiylik) — har sotuvchi faqat o'ziniki, boshliq hammasi?
- Siz: Karta-RBAC; НО-2 ma'lumot himoyasi
- Isbot: @Roles rol-daraja guard bor; lekin row-level 'faqat o'z mijozi' + field-level kontakt yashirish (Q37) leads/customers repo query'larda TOPILMADI. Faqat rol-asosli, mijoz-egalik-asosli emas

**13.31  ❌ yo'q**  — ❓ НО-2: Savdo menejeriga korporativ raqam biriktirish — menejer kartasiga, ketsa raqam yangi menejerga o'tadi?
- Siz: Korporativ raqam menejer kartasiga, ketsa baza+raqam o'tadi (НО-2 real qoida)
- Isbot: Korporativ raqam/SIM biriktirish jadvali yoki kodi YO'Q (grep 'korporativ raqam'/corporate.number → hech narsa). НО-2 'Телефон бериш тартиби' qurilmagan

**13.32  ❌ yo'q**  — ❓ НО-2: Aloqa abonentlari ro'yxati cheklovi — faqat tasdiqlangan doira, tashqari raqam flaglanadi?
- Siz: Faqat tasdiqlangan abonent doirasi + flag (НО-2)
- Isbot: Abonent-doira/whitelist tekshiruvi YO'Q (grep abonent → 0 natija). Real-time webhook 'raqam ro'yxatdami' tekshiruvi qurilmagan

**13.33  ❌ yo'q**  — ❓ НО-2: Qo'ng'iroqlar nazorati (Инспекция бўлими) — jurnal avto Инспекция paneliga?
- Siz: Qo'ng'iroq jurnali avto Инспекция bo'limiga (НО-2 reglament)
- Isbot: Inspeksiya bo'limi qo'ng'iroq-nazorat paneli/jadvali YO'Q; telefoniya yo'q (EP-CRM-028 bilan bir). Qurilmagan

**13.34  🟡 qisman**  — ❓ Sifat bo'limi boshlig'i ham mijoz bilan gaplashadi — aloqa shu kartada (turi sifat/reklamatsiya)?
- Siz: Сифат бошлиғи↔mijoz aloqasi ham kartada (yagona 360°)
- Isbot: 360 builder complaints/interactions ko'rsatadi (umumiy). Lekin 'sifat/reklamatsiya' turi sifatida Сифат-bo'lim aloqasini alohida teglab kartaga yozish mexanizmi tasdiqlanmadi

**13.35  ❌ yo'q**  — ❓ Korporativ raqamda Telegram/biznes-akkaunt — yozishma CRMda, menejer ketsa akkaunt qoladi?
- Siz: Korporativ Telegram/WhatsApp akkaunt→CRM, menejer ketsa qoladi
- Isbot: Korporativ biznes-akkaunt biriktirish/arxivlash kodi YO'Q. Telegram bot lead-ingest bor, lekin per-menejer korporativ akkaunt egalik+o'tkazish (HR bilan) qurilmagan

**13.36  ❌ yo'q**  — ❓ Debitor qarz Даромадлар bo'limida, savdoda emas — qarz undirish avto Даромадлар bo'limiga?
- Siz: Qarz undirish vazifasi avto Даромадлар bo'limiga; savdo faqat xabardor (kitob Дебитор siyosati)
- Isbot: Даромадлар bo'limi / debtor-department routing kodi yoki jadvali YO'Q (grep daromad/debtor.department → 0). Savdo↔undirish ajratish qurilmagan

**13.37  🟡 qisman**  — ❓ Mijoz 'qarz holati' kim yangilaydi — faqat Finance/Даромадлар avto, savdo o'zgartira olmaydi?
- Siz: Faqat Finance modulidan avtomatik (xolis)
- Isbot: 360 builder openDebt'ni payments/orders dan HISOBLAYDI (savdo qo'lda yozmaydi — xolis). Lekin alohida Finance/Даромадлар avto-feed + savdo-yozish-bloki tasdiqlanmadi; hisoblangan, lekin manba-ajratish noaniq

**13.38  ❌ yo'q**  — ❓ Qarz bo'yicha mijozga aloqa bayoni — Даромадлар aloqasi savdoga ko'rinadi (bir tarixda)?
- Siz: Qarz aloqalari mijoz kartasida (savdo+Даромадлар bir tarix)
- Isbot: Даромадлар bo'limi aloqasi maxsus teglab 360°ga qo'shish YO'Q (Даромадлар bo'limi umuman qurilmagan, EP-CRM-036 bilan bir)

**13.39  ❌ yo'q**  — ❓ 'Папка №' — mijozning buyurtma papkasi: har bitim Папка№ bilan, kartada papkalari ro'yxati?
- Siz: Har CRM bitim→Папка№; kartada papkalar (Заявка бумаги real)
- Isbot: Папка/Заявка jadval yoki kod YO'Q (grep papka/Папка → 0; information_schema da папка jadvali yo'q). Zavodning haqiqiy papka-raqamlash tizimi qurilmagan

**13.40  ❌ yo'q**  — ❓ 'Прошло (дней)' — buyurtma necha kun turibdi: avto hisoblagich + limitdan oshsa signal?
- Siz: O'tgan-kun avto hisob + limit signal (Заявка bumagi real ustun)
- Isbot: 'Прошло дней' / days-elapsed buyurtma hisoblagichi CRM-da YO'Q (Папка tizimi yo'q). Faqat overdue-leads bor, lekin buyurtma-papka uchun emas

**13.41  ❌ yo'q**  — ❓ Mijozning qog'oz zayavkasi (Наименование/Формат/Грам) — odatiy profil saqlanadi, yangi bitimga avto-tortiladi?
- Siz: Mijozning odatiy qog'oz profili saqlanadi+pre-fill (Заявка spetsifikatsiya)
- Isbot: Mijoz qog'oz-profili (format/gramm/naimenovanie) saqlash maydoni/jadvali CRM-da YO'Q. Zavod-spetsifik spetsifikatsiya qurilmagan

**13.42  ❌ yo'q**  — ❓ 'Примечание' (izoh) papkadan kartaga — papka izohlari mijoz tarixida ko'rinadi?
- Siz: Papka izohlari mijoz tarixida (to'liq kontekst)
- Isbot: Папка yo'q → papka-izoh kartaga ulanishi ham YO'Q. crm_comments jadval bor (umumiy izoh), lekin Заявка-papka izohi emas

**13.43  ❌ yo'q**  — ❓ ГП kodi bo'yicha takroriy buyurtma — kartada ГП-kod tarixi + 'qayta buyurtma' tugmasi?
- Siz: ГП-kod tarixi + 1-tugma qayta buyurtma (real ГП-2026-0187 kabi)
- Isbot: ГП-kod (tayyor mahsulot kodi) tarixi + qayta-buyurtma tugmasi YO'Q. crm_products jadval bor, lekin mijoz×ГП-kod takror-buyurtma mexanizmi qurilmagan

**13.44  ❌ yo'q**  — ❓ Mahsulot konstruksiya parametrlari kartada — sloy/o'lcham/model/yozuv profili?
- Siz: Har mahsulotga to'liq konstruksiya profili (5 sloy, 68.1x45.6x34.8)
- Isbot: Mahsulot konstruksiya-parametr profili (sloy/o'lcham/model) CRM mijoz kartasida YO'Q. technology_cards ehtimol PP-da, lekin CRM-mijoz bog'lanishi tasdiqlanmadi

**13.45  ❌ yo'q**  — ❓ Brend/yozuv (Indorama) maketni eslab qolish — mijoz maket/logotip kutubxonasi (versiyalar)?
- Siz: Mijoz maket/logotip/yozuv kutubxonasi kartada
- Isbot: Mijoz maket/logotip kutubxonasi (versiyalangan) CRM-da YO'Q. crm_documents jadval bor (umumiy hujjat), lekin maket-versiya kutubxonasi emas

**13.46  ❌ yo'q**  — ❓ ГП topshirish blankasi 3 imzo (омборчи+хайдовчи+савдо менежери) — uchchovsiz yuk chiqmaydi?
- Siz: Elektron blanka 3 imzo (Azizov A real), uchchovsiz yuk yo'q
- Isbot: ГП-topshirish 3-imzo elektron blankasi CRM-da YO'Q (EP-SD-138 da bo'lishi mumkin, lekin CRM modulida tasdiqlanmadi). PIN/F5 elektron imzo gate qurilmagan

**13.47  🟡 qisman**  — ❓ Yetkazilgandan keyin mijoz kartasini yangilash — 'yetkazildi'+keyingi buyurtma eslatmasi avto?
- Siz: Yetkazish tasdig'i→karta yetkazildi+follow-up (proaktiv)
- Isbot: 360 builder orders holatini ko'rsatadi; oltin-ip yetkazish event bor. Lekin yetkazilgandan keyin avto 'keyingi buyurtma eslatmasi' CRM-ga ulanishi tasdiqlanmadi

**13.48  ❌ yo'q**  — ❓ Haydovchi/transport mijoz kartasida — oxirgi marta qaysi haydovchi/transport saqlanadi?
- Siz: Yetkazish tarixida transport/haydovchi saqlanadi
- Isbot: Haydovchi/transport tarixi mijoz kartasida YO'Q. Logistika modulida bo'lishi mumkin, lekin CRM 360°ga ulanishi tasdiqlanmadi

**13.49  ❌ yo'q**  — ❓ 'Razmer planda va aslida' farqi kartada — kelishilgan o'lcham qulflanadi, farq flaglanadi?
- Siz: Kelishilgan o'lcham qulf, ishlab chiqarish farq qilsa flag+mijoz tasdig'i
- Isbot: Kelishilgan↔faktik o'lcham farqi (plan/aslida) kuzatuv/qulf CRM-da YO'Q. Qisqartirish-jadval o'lcham-nazorati qurilmagan

**13.50  ❌ yo'q**  — ❓ Format kichraytirish (qisqartirish) menejer roziligi — format o'zgarishi elektron rozilik (kim/qachon)?
- Siz: Format o'zgarishi→mijoz+menejer elektron roziligi (Менежер фикри/хохиши)
- Isbot: Format-o'zgarish elektron rozilik (kim/qachon) saqlash mexanizmi YO'Q. Qisqartirish-jadval menejer-rozilik ustunlari qurilmagan

**13.51  ❌ yo'q**  — ❓ Dizayner bilan kelishuv bosqichi voronkada — 'Dizayn/o'lcham kelishuvi' alohida bosqich + dizayner mas'ul + kun limiti?
- Siz: Dizayn/o'lcham kelishuvi alohida voronka bosqichi (qotish ko'rinadi)
- Isbot: crm_lead_stages=6 da 'Dizayn/o'lcham kelishuvi' bosqichi YO'Q (generic Yangi/Jarayonda/Tahlil). Dizayner-mas'ul+kun-limit alohida bosqichi qurilmagan

**13.52  ❌ yo'q**  — ❓ 'Shoshilmaslik' — o'lchov tasdig'isiz ishlab chiqarishga tushmaslik (majburiy bayroq)?
- Siz: 'O'lcham tasdiqlandi' majburiy bayroq, usiz PP ga o'tmaydi (brak oldi)
- Isbot: 'O'lcham tasdiqlandi' gate-bayroq (PP ga o'tish to'sig'i) CRM-da YO'Q. Qisqartirish-jadval 'Шошилмаслик' tamoyili qurilmagan

**13.53  🟡 qisman**  — ❓ Mijoz = ishlab chiqaruvchi korxona — mijozning OXIRGI mahsuloti (nima qadoqlaydi) saqlanadi?
- Siz: Mijoz mahsuloti/biznesi profili (Indorama=yarn, Compact cotton)
- Isbot: crm_companies jadval jonli (4 qator) — korxona ma'lumoti bor. Lekin 'nima qadoqlaydi/oxirgi mahsulot' biznes-profili maydoni tasdiqlanmadi (generic kompaniya)

**13.54  🟡 qisman**  — ❓ Mavsumiy/hajmli mijoz (Indorama) — 'asosiy mijoz' bayrog'i + ustuvor ishlab chiqarish + zaxira ogohlantirish?
- Siz: 'Asosiy mijoz' bayrog'i+ustuvorlik+material zaxira (strategik)
- Isbot: sd_customers.segment 'vip' qiymati bor (asosiy belgilash mumkin). Lekin VIP→PP ustuvorlik event + WMS material-zaxira-bron zanjiri tasdiqlanmadi

**13.55  🟡 qisman**  — ❓ Mijoz odatiy buyurtma hajmi (kg) — oylik kg-trend + pasayishda signal?
- Siz: Mijoz oylik kg-trendi + pasayish signali (zavod kg da o'ylaydi)
- Isbot: churn.service.ts recency/RFM pasayishni ko'radi (umumiy). Lekin kg-asosida (Oylik diog) trend + 5t→1t pasayish signali CRM-da YO'Q — summa/oborot asosida, kg emas

**13.56  ❌ yo'q**  — ❓ 'Chiqimli/Chiqimsiz' narx mantiqi — narx taklifida chiqimli/chiqimsiz variant + tejamkor taklif?
- Siz: Narx taklifida чиқимли/чиқимсиз variant (savdo dalili)
- Isbot: Chiqimli/chiqimsiz (qog'oz isrofi) narx-varianti CRM/KP da YO'Q. Qisqartirish-jadval chiqim-mantiqi qurilmagan

**13.57  🔑 egasi-data**  — ❓ Qog'oz narxi o'zgarishida mijoz narxini qayta hisoblash — ta'sirlangan mijozlar + qayta-ko'rish vazifasi?
- Siz: Qog'oz narxi o'zgarsa→ta'sirlangan mijozlar+qayta-narx vazifasi (trigger % egasidan)
- Isbot: Qog'oz-narx feed→mijoz-narx qayta-hisob CRON kodi tasdiqlanmadi; trigger % chegarasi + Ta'minot narx-feed bog'lanishi egasidan. Kod-asos ham zaif

**13.58  ❌ yo'q**  — ❓ Bir mijozga ko'p formatli narx jadvali — mijoz×mahsulot/format kesimida alohida narx?
- Siz: Mijoz×format kesimida narx jadvali (133/105 format)
- Isbot: Mijoz×mahsulot/format kesimida narx-jadvali CRM-da YO'Q. sd_customers da bitta umumiy mijoz-yozuv, per-format narx tasdiqlanmadi

**13.59  🟡 qisman**  — ❓ Bitim→ishlab chiqarish rejasiga tushishi — yutilgan bitim avto PP reja navbatiga (muddat bilan)?
- Siz: Yutilgan bitim→PP reja navbatiga avto (станокларни иш билан таъминлаш)
- Isbot: DealWonEvent→sales_order yaratiladi (golden-thread real). Lekin sales_order→PP reja-navbati (stanok) avto-tushishi CRM darajada ko'rinmaydi — SD/PP zanjirida, CRM bo'lagida tasdiqlanmadi

**13.60  ❌ yo'q**  — ❓ Mijozga real muddat (stanok yukiga qarab) — muddat taklifi stanok yukidan avto hisob?
- Siz: Muddat stanok yukidan avto (real va'da, CRP)
- Isbot: Stanok-yuk asosida real-muddat hisoblash CRM-da YO'Q (PP/CRP work_centers bor, lekin CRM-bitim muddat-taklifiga ulanishi tasdiqlanmadi)

**13.61  ❌ yo'q**  — ❓ Stanok turlari bo'yicha mahsulot mosligi — mahsulot→stanok marshruti, muddat shu navbatdan?
- Siz: Mahsulot→stanok marshruti (Flexo/SM72/SM52/Laminatsiya), muddat navbatdan
- Isbot: Mahsulot→stanok-marshrut bog'lanishi CRM-da YO'Q. PP routing bo'lishi mumkin, lekin CRM mahsulot-stanok mosligi qurilmagan

**13.62  🟡 qisman**  — ❓ Savdo bo'limi rahbari vs menejer ko'rinishi — boshliq hammasini, menejer o'zinikini?
- Siz: Савдо рахбари=hamma, менежер=o'ziniki (kitob alohida lavozim)
- Isbot: @Roles director/sales_manager farqlanadi (rol-daraja). Lekin menejer 'faqat o'z mijozi' row-scope filtri YO'Q (EP-CRM-022/030 bilan bir zaiflik)

**13.63  🔑 egasi-data**  — ❓ Menejer mijozni 'egasizlantirmaslik' qoidasi — N kun faolliksiz mijoz boshliq paneliga qayta-taqsimlash?
- Siz: N kun faolliksiz→boshliq paneliga reassign (adolat, N egasidan)
- Isbot: Egasizlantirish CRON + Finance/QC ochiq-da'vo tekshiruvi kontseptsiyasi javoblarda (vision-1000 #3,#8). Kod tasdiqlanmadi; aniq N (30/60) egasidan

**13.64  🟡 qisman**  — ❓ Menejer kunlik hisoboti (necha kg sotdi) — avto kunlik kg+summa boshliqqa?
- Siz: Menejer kunlik kg+summa avto boshliqqa (Oylik diog, ShVB weeklySalesVolume)
- Isbot: supervisor-dashboard endpoint menejer-statistikani beradi (summa). Lekin kunlik KG-asosida hisobot (zavod kg da o'lchaydi) tasdiqlanmadi — summa asosida

**13.65  ❌ yo'q**  — ❓ Yangi menejer mentor davri (RD-4) — sinov bayrog'i + bitim mentor tasdig'idan (2 oy)?
- Siz: Sinov davri bayrog'i + mentor-tasdiq gate (RD-4, Q91/Q145)
- Isbot: Sinov-davri bayrog'i + mentor-tasdiq bitim-gate CRM-da YO'Q. HR sinov-davri bo'lishi mumkin, lekin CRM bitim mentor-tasdiqdan o'tishi qurilmagan

**13.66  ❌ yo'q**  — ❓ 'Xizmat ma'lumoti tashqariga chiqishi' oldini olish — ommaviy eksport blok, faqat boshliq ruxsati, log?
- Siz: Ommaviy eksport bloklangan+boshliq ruxsati+log (НО-2)
- Isbot: CRM eksport-blok / boshliq-ruxsat-gate / eksport-log mexanizmi TOPILMADI (presentation da export-controller yo'q). Menejer butun bazani olib chiqishni cheklash qurilmagan

**13.67  ❌ yo'q**  — ❓ Mijoz kontaktini ko'rish chegarasi — o'z mijozi to'liq, o'zganiki faqat nomi (kontakt yashirin)?
- Siz: Field-level RBAC: o'zganing kontakti yashirin
- Isbot: Field-level kontakt-yashirish (maskContact/hideContact) kodi TOPILMADI. Faqat rol-guard; maydon-darajali maxfiylik qurilmagan

**13.68  🟡 qisman**  — ❓ CRM harakatlari audit jurnali — ko'rish/o'zgartirish/eksport, Инспекция bo'limiga ko'rinadi?
- Siz: To'liq audit jurnali (audit_log, module='CRM' filtr) Инспекция uchun
- Isbot: Umumiy audit_log jadval tizimda bor (boshqa modullar); crm_entity_history/crm_history jadvallari jonli. Lekin CRM ko'rish/eksport audit + Инспекция-panel filtri tasdiqlanmadi

**13.69  ❌ yo'q**  — ❓ Oldindan to'lov (avans) holati kartada — avans bayrog'i+foizi, avanssiz PP ga o'tmaydi?
- Siz: Avans bayrog'i+foiz, belgilangan avanssiz PP ga o'tmaydi (50%/100% siyosat)
- Isbot: Avans-bayroq + avanssiz-PP-blok gate CRM-da YO'Q. To'lov 360°da ko'rinadi, lekin avans-gate qurilmagan

**13.70  ❌ yo'q**  — ❓ Naqd/o'tkazma/bartar to'lov turi mijozda — odatiy to'lov turi saqlanadi?
- Siz: Mijozning odatiy to'lov turi saqlanadi (naqd/o'tkazma/bartar)
- Isbot: Mijoz odatiy-to'lov-turi maydoni (naqd/o'tkazma/bartar) sd_customers da tasdiqlanmadi. Saqlanmaydi

**13.71  ❌ yo'q**  — ❓ Valyuta (USD-bog'liq narx) — narx USD-bog'liq saqlanadi, kurs o'zgarsa ogohlantirish?
- Siz: Narx USD-bog'liq + kurs 5%+ o'zgarsa 'qayta hisob' signali
- Isbot: USD-bog'liq narx + kurs-o'zgarish ogohlantirish CRM-da YO'Q (qog'oz dollarga bog'liq). Multi-valyuta narx-kuzatuv qurilmagan

**13.72  🟡 qisman**  — ❓ Brak/qaytarish mijoz kartasida — sabab kodiga (o'lcham/bosma/material) bog'lanadi?
- Siz: Brak/qaytarish kartada+sabab kodi (ildiz sabab)
- Isbot: 360 complaints ko'rsatiladi (umumiy shikoyat). Lekin brak/qaytarish + sabab-kodi (o'lcham/bosma/material) strukturali bog'lanish + QC event tasdiqlanmadi

**13.73  ❌ yo'q**  — ❓ Reklamatsiya hal bo'lmaguncha yangi yuk — ochiq reklamatsiya bayrog'i + boshliq ogohlantirish?
- Siz: Ochiq reklamatsiya→yangi bitimda boshliq ogohlantirish (QcReclamationOpenedEvent)
- Isbot: Ochiq-reklamatsiya bayrog'i + yangi-yuk-bloki/ogohlantirish zanjiri CRM-da YO'Q. QC→CRM event tasdiqlanmadi

**13.74  ❌ yo'q**  — ❓ Kompensatsiya/chegirma tarixi — jami summa kartada, suiiste'mol ko'rinadi?
- Siz: Kompensatsiya/chegirma tarixi+jami (90kun/3marta/10% suiiste'mol bayrog'i)
- Isbot: Kompensatsiya/chegirma tarixi + suiiste'mol-bayroq (business.constants mezon) CRM-da YO'Q. Qurilmagan

**13.75  ❌ yo'q**  — ❓ 'Oylik diog' mijoz kesimida — oylik kg mijoz kesimi + o'tgan oyga nisbatan o'zgarish?
- Siz: Oylik kg mijoz kesimida + oldingi-oyga o'zgarish (boshqaruv ko'rinishi)
- Isbot: Oylik diog (kg) mijoz-kesim hisoboti CRM-da YO'Q. cohort.service.ts bor (umumiy kogort), lekin kg-asosida zavod-diog emas

**13.76  🟡 qisman**  — ❓ 'Yil boshidan chiqarilgan mahsulot' mijozga taqsim — yillik top-mijozlar ro'yxati?
- Siz: Yillik hajm mijozlar kesimida (top ro'yxat, 115000 strategik)
- Isbot: RFM/CLV top-mijoz ranglashtiradi (oborot bo'yicha). Lekin yillik-hajm KG-kesimida top-mijoz hisoboti tasdiqlanmadi (summa asosida)

**13.77  🟡 qisman**  — ❓ Buyurtma↔tayyor↔chiqarilgan zanjiri mijozda — 3 holat (olingan/tayyor/chiqarildi) real-vaqt kartada?
- Siz: Buyurtma holati (olingan→tayyor→chiqarildi) real-vaqt kartada (aniq javob)
- Isbot: 360 builder orders status ko'rsatadi (recentOrders). Lekin zavod 3-holat (olingan/tayyor kg/chiqarilgan kg) real-vaqt MES/Ombor→CRM zanjiri tasdiqlanmadi

**13.78  ❌ yo'q**  — ❓ Bir korxona — bir nechta brend/quti turi: mijoz ostida alohida mahsulot liniyalari (narx/hajm/brak)?
- Siz: Mijoz ostida alohida mahsulot liniyalari (har biriga narx/hajm/brak)
- Isbot: Mijoz ostida 'mahsulot liniyalari' (per-liniya narx/hajm/brak) strukturasi CRM-da YO'Q. crm_products umumiy katalog, mijoz-liniya kesim emas

**13.79  🔑 egasi-data**  — ❓ Mijoz almashtirilgan o'lcham/STP tarixi — qaysi STP/format ishlatilgan, versiyalab saqlanadi?
- Siz: Mijoz mahsuloti uchun STP/format versiya tarixi (Qolib янги STP)
- Isbot: STP/format versiyalash CRM-da YO'Q; vision-da OCHIQ (Dizayn modeli bilan). Kod yo'q, model egasidan/Dizayn bilan kutiladi

**13.80  ❌ yo'q**  — ❓ Mijoz 'yaqin qarindosh' aloqasi — korporativ raqamda shaxsiy↔mijoz aloqani teglab ajratish?
- Siz: Aloqa 'mijoz'/'shaxsiy' teglanadi, statistikaga faqat mijoz (НО-2 maxfiylik)
- Isbot: Korporativ-raqam aloqa-teglash (mijoz/shaxsiy) YO'Q (korporativ raqam umuman qurilmagan, EP-CRM-031 bilan bir)

**13.81  🔑 egasi-data**  — ❓ Mijoz toifasi: import-bog'liq vs mahalliy — import to'xtasa ta'sirlanadigan mijozlar ro'yxati?
- Siz: Import-bog'liqlik toifasi + import muammosida ta'sirlangan mijozlar (proaktiv)
- Isbot: Import-bog'liqlik toifa + SupplyImportIssueEvent→CRM signal CRM-da YO'Q; vision-da OCHIQ (Ta'minot feed bilan). Manba egasidan

**13.82  ❌ yo'q**  — ❓ Mijoz ombor kirish cheklovi — yetkazish nuqtasiga kirish talablari (vaqt/hujjat/sanitariya) saqlanadi?
- Siz: Yetkazish nuqtasiga kirish talablari saqlanadi (bir martada yetkazish)
- Isbot: Mijoz ombor-kirish-talablari (vaqt/hujjat/sanitariya/propusk) maydoni CRM/SD-da tasdiqlanmadi. Logistika-bog'lanish qurilmagan

**13.83  ❌ yo'q**  — ❓ Mijoz bilan kelishilgan o'rash/qadoqlash usuli — stepler/yelim/oyna kartada saqlanadi?
- Siz: Mijoz mahsulotiga yig'ish/o'rash usuli (stepler/yelim/qo'lda/oyna)
- Isbot: O'rash/qadoqlash usuli (Степлер/Склейка/Окошка) mijoz mahsulotiga biriktirish CRM-da YO'Q. Qurilmagan

**13.84  ❌ yo'q**  — ❓ 'Akademiyaga'/namuna ishlab chiqarish belgisi — namuna sotuvdan ajratiladi (daromadga kirmaydi)?
- Siz: 'Namuna/sinov' turi sotuvdan ajratiladi (daromadga kirmaydi, material hisobiga kiradi)
- Isbot: 'Namuna/Академияга' buyurtma-turi (daromaddan ajratish) CRM-da YO'Q. PP namuna-ustuvorlik kodi tasdiqlanmadi

**13.85  🔑 egasi-data**  — ❓ Mijoz uchun mas'ul operator/usta tarixi — 'bu mijoz mahsulotini falon usta yaxshi qiladi' saqlanadi?
- Siz: Mijoz mahsuloti↔tajribali operator (rejada ustuvor, sifat barqaror)
- Isbot: Mijoz↔operator/usta bog'lanish CRM-da YO'Q; vision-da OCHIQ (Ishlab chiqarish reja-qoidasi bilan). Reja-qoidasi egasidan/PP bilan

---

## 14 — Marketing  (vizyon 48%, 99 savol)

**14.1  ✅ bor**  — ❓ Q1 — Marketing kanallari ro'yxati (8 kanal: Instagram/Telegram/Facebook/veb-sayt/ko'rgazma/sovuq-qo'ng'iroq/tavsiya/vositachi-diler) alohida hisobga olinadimi?
- Siz: A — tayyor 8 kanal + 'boshqa', har kanal alohida statistika
- Isbot: marketing-roi.constants.ts:MKT_CHANNELS — aynan 8 kanal massiv (instagram/telegram/facebook/veb-sayt/korgabma/sovuq-qongiroq/tavsiya/vositachi-diler) + MKT_CHANNEL_OTHER='boshqa'; marketing_leads.channel/source ustunlari mavjud (14 qator)

**14.2  🟡 qisman**  — ❓ Q2 — Kanal ierarxiyasi (kanal + sub-manba / UTM tegi) ikki bosqichli kuzatiladimi?
- Siz: A — kanal + sub-manba (UTM/kampaniya tegi)
- Isbot: marketing_leads.campaign_id mavjud (kanal+kampaniya bog'lash bor), lekin UTM/sub-manba alohida ustun yoki normalizatsiya YO'Q; marketing_ads.platform faqat kanal darajasi

**14.3  🟡 qisman**  — ❓ Q3 — Kanal byudjeti (oylik/choraklik reja: reja/sarflangan/qoldiq) jadvali bormi?
- Siz: A — kanal×oy byudjet jadvali (reja summa, sarflangan, qoldiq)
- Isbot: marketing_budget_lines(12 qator)+marketing_group2.controller budget CRUD real; category/year/month/plannedAmount/actualAmount bor — lekin 'kanal' o'lchovi byudjet qatorida emas (category bo'yicha, kanal×oy emas)

**14.4  🟡 qisman**  — ❓ Q4 — Byudjet xarajat turlari (6 tur: onlayn reklama/blogger/bosma/ko'rgazma/namuna/transport) ajratiladimi?
- Siz: A — 6 xarajat turi, namuna+ko'rgazma reklamaga yashirilmaydi
- Isbot: marketing_budget_lines.category (z.string min2 max50) erkin matn qabul qiladi — 6 ta qat'iy tur enum/seed YO'Q; modda ro'yxati standartlashtirilmagan

**14.5  🟡 qisman**  — ❓ Q5 — Lid yutilganda SD'da mijoz kartochkasi avtomatik yaratiladimi (lid→savdo ulanish)?
- Siz: A — avtomatik: lid yutilganda SD'da mijoz kartochkasi (oltin-ip)
- Isbot: convert-to-crm (analytics-stubs.controller.ts:280) marketing_leads→crm_leads to'g'ridan INSERT qiladi (crm_lead_id+converted_at to'ldiradi) — LEKIN bu CRM, SD emas; SD mijoz kartasiga avto-yaratish va EventEmitter2 handshake YO'Q

**14.6  🟡 qisman**  — ❓ Q6 — Kampaniya kartochkasi to'liq maydonlar (nomi/byudjet/muddat/maqsad/mas'ul/kutilgan lid) bilan ochiladimi?
- Siz: A — to'liq kartochka (byudjet+muddat+maqsad+lidlar+natija)
- Isbot: marketing_campaigns(16 ustun: name/description/type/status/budget/spent/platform/start/end/target_audience/goals) + CQRS CRUD real (6 qator) — LEKIN mas'ul(owner) faqat created_by, 'kutilgan lid soni' maydoni YO'Q

**14.7  ❌ yo'q**  — ❓ Q7 — Kampaniya maqsad turi (5 tur: yangi lid/brend/mijoz qaytarish/mahsulot e'loni/ko'rgazma) tanlanadimi?
- Siz: A — 5 maqsad turi + har biriga asosiy ko'rsatkich
- Isbot: campaign.dto.ts:12 type enum = ['email','sms','social','telegram','promotion'] — bu KANAL/format turi, maqsad turi EMAS; maqsad-turi maydoni butunlay yo'q

**14.8  🟡 qisman**  — ❓ Q8 — Kampaniya holati 6 qiymat (Reja→Tasdiqlangan→Faol→To'xtatilgan→Tugadi→Bekor)mi?
- Siz: A — 6 holat to'liq hayot tsikli
- Isbot: campaign.dto.ts:28 status enum = ['draft','active','paused','completed','cancelled'] = 5 holat; 'Tasdiqlangan' (approved) bosqichi YO'Q — egasi 6 ta xohladi

**14.9  🟡 qisman**  — ❓ Q9 — Kampaniya maqsadli auditoriya/tarmoq (oziq-ovqat/qandolat/farmatsevtika...) tayyor ro'yxatdan tanlanadimi?
- Siz: A — tayyor tarmoq ro'yxatidan ko'p tanlov (8-10 tarmoq)
- Isbot: marketing_campaigns.target_audience JSONB + DTO targetAudience{region,ageGroup,interests} bor — LEKIN zavod tarmoq (sanoat sektori) ro'yxati/enum YO'Q, erkin interests massivi

**14.10  🟡 qisman**  — ❓ Q10 — Kampaniya geografiyasi (viloyat/shahar + eksport bayrog'i) saqlanadimi?
- Siz: A — hudud tanlovi + eksport bayrog'i, logistika bilan
- Isbot: DTO targetAudience.region (string) bor — lekin eksport bayrog'i va viloyat/shahar strukturasi YO'Q, erkin matn

**14.11  🟡 qisman**  — ❓ Q11 — Kampaniya reja-vs-fakt natija (kutilgan vs haqiqiy lid/sotuv/ROI yonma-yon)?
- Siz: A — reja va fakt yonma-yon avtomatik
- Isbot: getCampaignStats/getCampaignAnalytics real (haqiqiy raqam) + exhibitions'da lead_count/deal_value/roi bor — LEKIN marketing_campaigns'da 'kutilgan/reja' (expected) maydonlari YO'Q, faqat fakt

**14.12  ❌ yo'q**  — ❓ Q12 — Kampaniyaga promo-kod/chegirma biriktiriladi va sotuvda kuzatiladimi?
- Siz: A — promo-kod biriktiriladi, sotuvda shu kod kuzatiladi
- Isbot: marketing_campaigns 16 ustunida promo_code/discount maydoni YO'Q; campaign.dto'da ham yo'q; sotuv↔kod bog'lash kuzatuvi topilmadi

**14.13  🟡 qisman**  — ❓ Q13 — Lid sifati 3 daraja (issiq/iliq/sovuq) ball asosida belgilanadimi?
- Siz: A — 3 daraja + avtomatik ball asosida
- Isbot: marketing_leads.score+status mavjud; getHotLeads() real (svc) + recalculate-scores endpoint ball hisoblaydi (base30+kanal+status) — LEKIN issiq/iliq/sovuq qat'iy 3-daraja enum emas, status erkin ('new'/'hot'/'warm')

**14.14  🟡 qisman**  — ❓ Q14 — Lid sifat ballari 5 mezon (hajm/shoshilinchlik/byudjet/moslik/qayta mijoz) bo'yicha hisoblanadimi?
- Siz: A — 5 mezon → ball → daraja (vazn egasidan)
- Isbot: recalculate-scores (analytics-stubs.controller.ts:258) ball hisoblaydi LEKIN faqat 2 omil (channel + status) — 5 mezon (buyurtma hajmi/byudjet aniqligi/mahsulot moslik/qayta mijoz) YO'Q. Vazn egasi-data

**14.15  🟡 qisman**  — ❓ Q15 — Lid minimal majburiy maydonlari (telefon+manba+mahsulot qiziqishi)?
- Siz: A — majburiy: telefon+manba kanali+mahsulot qiziqishi
- Isbot: marketing_leads phone/source/channel ustunlari bor — LEKIN leads.service.create barcha maydonni optional qiladi (phone||undefined), majburiy validatsiya YO'Q; mahsulot-qiziqish maydoni umuman yo'q

**14.16  ❌ yo'q**  — ❓ Q16 — Takroriy (dublikat) lid telefon bo'yicha aniqlanadi + birlashtirish taklif qilinadimi?
- Siz: A — telefon bo'yicha avto dublikat aniqlash + birlashtirish taklifi
- Isbot: leads.service.create / leads.repository.create — telefon dublikat tekshiruvi YO'Q (grep 'duplicate|dublikat|phone exists' = 0 natija); har INSERT yangi qator yaratadi

**14.17  ❌ yo'q**  — ❓ Q17 — Yangi lid sotuvchiga avtomatik taqsimlanadimi (mahsulot/hudud yoki round-robin)?
- Siz: A — mahsulot turi+hudud bo'yicha avto, bo'lmasa navbat
- Isbot: marketing_leads.assigned_to ustuni BOR, lekin avto-taqsimlash logikasi YO'Q (grep 'round-robin|assignLead|auto.assign' = 0); qo'lda to'ldiriladi

**14.18  🟡 qisman**  — ❓ Q18 — Lid belgilangan vaqt javobsiz qolsa rahbarga signal + qayta taqsimlash (cron)?
- Siz: A — N soat javobsiz → signal + 24 soatdan keyin boshqaga (cron)
- Isbot: getOverdueLeads() real (kech javob lidlarni ko'rsatadi) — LEKIN avto eskalatsiya cron + qayta taqsimlash YO'Q; faqat o'qish (READ), harakat yo'q

**14.19  🟡 qisman**  — ❓ Q19 — Lid bosqichlari 6-7 voronka (namuna qutisi bosqichi bilan) bormi?
- Siz: A — 6-7 bosqichli voronka (karton zavodga moslangan)
- Isbot: getMarketingFunnel() real endpoint + crm_lead_stages jadval mavjud — LEKIN marketing_leads.status erkin matn, namuna-qutisi/подписной-лист bosqichlari standartlashtirilmagan; aniq nomlar egasi-data

**14.20  🟡 qisman**  — ❓ Q20 — Lid yo'qotish sabablari tayyor ro'yxatdan tanlanadi + statistika?
- Siz: A — 7-8 tayyor sabab + izoh, tizimli tahlil
- Isbot: marketing_leads.lost_reason ustuni BOR + getLossAnalysis() real (breakdown/percent) (leads.repository.ts:93) — LEKIN sabablar qat'iy enum/seed ro'yxati YO'Q, erkin matn; ro'yxat egasi-data

**14.21  ✅ bor**  — ❓ Q21 — ROI foyda-asosli formula bilan hisoblanadimi ((sotuv foydasi − xarajat)/xarajat)?
- Siz: A — foyda-asosli ROI (aylanma emas)
- Isbot: marketing-roi.service.ts:137 'ROI% = (revenue−spend)/spend×100' profit-based; profitAbsolute=revenue−spend (172-satr); EP-MKT-051 izohlangan, channelEffectiveness real ishlatadi

**14.22  ✅ bor**  — ❓ Q22 — CPL (bitta lid narxi) kanal/kampaniya kesimida avtomatik hisoblanadimi?
- Siz: A — kanal va kampaniya kesimida avtomatik CPL
- Isbot: marketing-roi.constants.ts CPL=spend/leads izohlangan; getChannelRoi (marketing-ext.service.ts:77) per-kanal spend+leads real rollup qiladi (getChannelRollup repo)

**14.23  ✅ bor**  — ❓ Q23 — CAC (mijoz jalb narxi) kanal kesimida hisoblanadimi?
- Siz: A — CAC = davr xarajat / yangi mijoz, kanal kesimida
- Isbot: ChannelRoiRow.cac (marketing-ext.service.ts:31) = spend/conversions; channelEffectiveness real CAC chiqaradi; EP-MKT-053 izohlangan

**14.24  🟡 qisman**  — ❓ Q24 — LTV (mijoz umrbod qiymati) va LTV/CAC nisbati 12-oylik hisobga olinadimi?
- Siz: A — 12 oylik takroriy sotuvni hisobga olgan ROI (LTV/CAC)
- Isbot: getChannelRoi'da CAC bor lekin LTV/CAC nisbati va 12-oylik takroriy sotuv hisobi marketing modulida YO'Q; CRM RFM/CLV alohida modulda (bu bo'lakda emas)

**14.25  ❌ yo'q**  — ❓ Q25 — ROI atribusiya oynasi (90 kun B2B) belgilangan davr ichidagi sotuvni bog'laydimi?
- Siz: A — 90 kunlik atribusiya oynasi
- Isbot: ROI kod xarajat↔sotuv bog'laydi lekin vaqt-oynasi (90/30 kun) filtri topilmadi; atribusiya-oyna konfiguratsiyasi YO'Q. Kun raqami egasi-data

**14.26  ❌ yo'q**  — ❓ Q26 — Ko'p kanal atribusiyasi (oxirgi+birinchi teginish ikkalasi ko'rinadimi)?
- Siz: A — oxirgi teginish asosiy + birinchi teginish qayd
- Isbot: marketing_leads.source bitta kanal saqlaydi (single-touch); birinchi/oxirgi teginish multi-touch atribusiya modeli YO'Q

**14.27  ✅ bor**  — ❓ Q27 — Ko'rgazma kartochkasi (xarajat/sana/joy/stend/mas'ul/kutilgan lid) ro'yxatga olinadimi?
- Siz: A — to'liq ko'rgazma kartochkasi
- Isbot: exhibitions jadval(1 qator, 23 ustun: budget/spent/start/end/location/country/lead_count/deal_value/roi/qr_code/team_members) + createExhibition/update/delete real CRUD (analytics-stubs.controller.ts:454)

**14.28  ✅ bor**  — ❓ Q28 — Ko'rgazmada tezkor forma (ism/telefon/qiziqish) bilan lid joyida bazaga tushadimi?
- Siz: A — telefondagi tezkor forma → joyida bazaga
- Isbot: POST exhibitions/:id/leads (analytics-stubs.controller.ts:474) real INSERT exhibition_leads (name/phone/email/interest/estimated_volume); QR generatsiya ham bor (exhibitions/:id/qr)

**14.29  🟡 qisman**  — ❓ Q29 — Ko'rgazma lidi sotuvgacha kuzatiladi (ko'rgazma ROI avtomatik)?
- Siz: A — har lid ko'rgazma tegiga, sotuvgacha kuzatiladi
- Isbot: exhibitions jadvalida lead_count/deal_count/deal_value/roi ustunlari BOR (struktura tayyor) — LEKIN exhibition_leads(0 qator)→sotuv avtomatik bog'lash event/listener YO'Q; roi ustuni qo'lda to'ldiriladi

**14.30  ❌ yo'q**  — ❓ Q30 — Ko'rgazmadan keyin avtomatik follow-up vazifalar (48 soat) yaratiladimi?
- Siz: A — ko'rgazma tugagach avto-vazifalar + kuzatish
- Isbot: exhibitions tugaganda Kanban/vazifa avto-yaratish cron/event topilmadi; follow-up jadval/logika YO'Q

**14.31  🟡 qisman**  — ❓ Q31 — Ko'rgazmalar yillik tarixiy taqqoslash (xarajat/lid/sotuv/ROI) jadvali bormi?
- Siz: A — ko'rgazmalar bo'yicha tarixiy taqqoslash
- Isbot: exhibitions ro'yxati (GET exhibitions) barcha ustunlar bilan qaytadi (taqqoslash uchun data bor) — LEKIN maxsus yillik taqqoslash/agregat endpoint YO'Q, FE jadval qiladi

**14.32  🟡 qisman**  — ❓ Q32 — Ijtimoiy inbox (barcha kanal xabari bitta oynada, holat ko'rinadi)?
- Siz: A — barcha kanal xabari bitta inboxda
- Isbot: social_conversations+social_messages jadval BOR + GET inbox/conversations + messages + reply + status real (analytics-stubs.controller.ts:318-386) + FE MarketingSocialInbox.tsx — LEKIN jadvallar BO'SH(0/0), provayder (Instagram/Telegram API) ulanmagan. Egasi-data: provayder

**14.33  🟡 qisman**  — ❓ Q33 — Inbox SLA (javob vaqti standarti, kechikkanlar signal) bormi?
- Siz: A — ish vaqtida 15 daqiqa SLA + kechikkanlar signal
- Isbot: getInboxStats() real (total/unread/pending/resolved/openRate) — LEKIN SLA daqiqa o'lchovi/kechikish signal logikasi YO'Q. SLA daqiqa egasi-data

**14.34  🟡 qisman**  — ❓ Q34 — Inbox suhbatidan 'Lid yarat' tugmasi (manba avto)?
- Siz: A — suhbatdan 'Lid yarat' tugmasi
- Isbot: social_conversations + marketing_leads jadvallar bor, convert-to-crm endpoint bor — LEKIN inbox-suhbat→lid maxsus 'create lead from conversation' endpoint topilmadi; bog'lash uzilgan

**14.35  🟡 qisman**  — ❓ Q35 — Inbox tayyor javob shablonlari (narx/muddat/minimal partiya)?
- Siz: A — shablonlar kutubxonasi, bir tugma bilan
- Isbot: marketing_email_templates jadval + GET/POST email/templates real CRUD (marketing-analytics.controller.ts:138) — LEKIN bu email shablon, inbox tezkor-javob (FAQ narx/muddat) ga bog'lanmagan

**14.36  🟡 qisman**  — ❓ Q36 — Inbox mas'ul/kanal egasi tayinlash + 'javob berilmoqda' belgisi?
- Siz: A — suhbatga mas'ul biriktiriladi + belgi
- Isbot: social_conversations.status yangilanadi (PATCH status) — LEKIN mas'ul (assigned_to) biriktirish va 'javob berilmoqda' qulflash logikasi YO'Q

**14.37  ❌ yo'q**  — ❓ Q37 — Inbox spam filtri (spam belgisi + alohida papka, statistikadan chiqarish)?
- Siz: A — spam belgisi + papka, statistikadan chiqariladi
- Isbot: social_conversations.status PATCH bor lekin maxsus spam-filtr/spam papka va statistikadan istisno logikasi topilmadi

**14.38  ✅ bor**  — ❓ Q38 — Kontent kalendar (taqvim ko'rinishi + post kartochkalari)?
- Siz: A — taqvim ko'rinishi (oy/hafta) + post kartochkalari
- Isbot: marketing_calendar_events jadval + GET/POST/PATCH/DELETE calendar real CRUD (marketing-group2.controller.ts:197) + GET content/calendar (marketing-ext) + FE MarketingCalendar.tsx

**14.39  ✅ bor**  — ❓ Q39 — Kontent posti maydonlari (sana/kanal/sarlavha/matn/media/mas'ul/holat/kampaniya)?
- Siz: A — to'liq post maydonlari
- Isbot: marketing_content jadval(16 ustun: title/content/type/platform/status) + content/posts CRUD real (marketing-content.controller.ts) + FE MarketingContent.tsx; createContentPost real INSERT

**14.40  🟡 qisman**  — ❓ Q40 — Kontent tasdiqlash oqimi (5 bosqich: g'oya→matn→dizayn→tasdiq→joylash)?
- Siz: A — 5 bosqichli oqim + rahbar tasdig'i
- Isbot: marketing_content.status + publishContentPost endpoint bor (draft→published) — LEKIN 5-bosqichli tasdiqlash oqimi (dizayn tasdig'i, rahbar approve) standartlashtirilmagan; status erkin

**14.41  🟡 qisman**  — ❓ Q41 — Kontent rukni (5-6 tur: mahsulot/tavsiya/zakulis/aksiya/maslahat) + haftalik muvozanat?
- Siz: A — 5-6 kontent turi + har haftaga muvozanat
- Isbot: marketing_content.type ustuni BOR (tur saqlaydi) — LEKIN 5-6 qat'iy rukn enum va haftalik muvozanat tekshiruvi YO'Q; nisbat egasi-data

**14.42  🟡 qisman**  — ❓ Q42 — Kontent posti natija ko'rsatkichlari (qamrov/layk/izoh + undan kelgan lid)?
- Siz: A — asosiy ko'rsatkichlar + postdan kelgan lid bog'lanishi
- Isbot: getContentAnalytics() real endpoint + marketing_social_posts jadval (layk/qamrov) bor — LEKIN 'shu postdan kelgan lid' atribusiya bog'lanishi YO'Q

**14.43  ❌ yo'q**  — ❓ Q43 — Kontent joylash eslatmalari (post vaqtidan oldin mas'ulga avto-eslatma)?
- Siz: A — post vaqtidan oldin avtomatik eslatma
- Isbot: marketing_calendar_events bor lekin post-vaqti eslatma cron/notification logikasi topilmadi; avto-eslatma YO'Q

**14.44  ❌ yo'q**  — ❓ Q44 — Marketing→Sotuv lid topshirish nuqtasi (iliq+ bo'lganda avto + qabul belgisi)?
- Siz: A — lid iliq+ bo'lganda avto sotuvga + qabul belgisi
- Isbot: convert-to-crm faqat to'g'ridan INSERT (status='converted') — avto-trigger 'iliq darajada', qabul-belgisi (accepted), SD handshake EventEmitter2 YO'Q (grep emit=0)

**14.45  ❌ yo'q**  — ❓ Q45 — Namuna qutisi so'rovi lid kartasidan ishlab chiqarishga yuboriladi + holat kuzatiladi?
- Siz: A — namuna so'rovi lid→ishlab chiqarish + holat
- Isbot: marketing_leads'da namuna(sample) so'rov maydoni/holati YO'Q; lid→PP namuna-buyurtma event yoki jadval topilmadi

**14.46  ✅ bor**  — ❓ Q46 — Marketing boshqaruv paneli (6-8 ko'rsatkich: lid/sifatli/byudjet/eng yaxshi kanal/ROI)?
- Siz: A — to'liq panel (6-8 ko'rsatkich + ogohlantirishlar)
- Isbot: getDashboardStats()+getMarketingOverview() real (total_leads/campaigns/exhibitions/ab_tests/published) + getAnalyticsOverview + FE MarketingDashboard.tsx+Panels+Sections

**14.47  🟡 qisman**  — ❓ Q47 — Marketing xodimi KPI (sifatli lid/konversiya%/kanal ROI/SLA) bormi?
- Siz: A — 3-4 KPI natijaga yo'naltirilgan
- Isbot: conversionRate/costPerLead/roi metrikalar ShVB reglamentida + getMarketingFunnel/channel-roi real — LEKIN xodim-kesimidagi KPI (kim qancha sifatli lid keltirdi, javob tezligi) marketing modulida agregatlanmagan

**14.48  🟡 qisman**  — ❓ Q48 — Raqobatchi kuzatuvi (nomi/mahsulot/narx/kuchli-zaif) kartochkasi muntazam yangilanadimi?
- Siz: A — raqobatchi kartochkasi muntazam yangilanadi
- Isbot: sd_customer_competitors jadval(competitor_name/product/estimated_share/switch_risk/reason) + GET competitors real (marketing-group2.controller.ts:265, GROUP BY) — LEKIN data 0 qator; mustaqil raqobatchi-narx kartasi emas, mijoz-kesimida

**14.49  ❌ yo'q**  — ❓ Q49 — UTM/havola kuzatuvi (har reklamaga belgi + lidga avto manba)?
- Siz: A — maxsus kuzatuv havolasi + lidga avto manba
- Isbot: UTM generatsiya/parse logikasi yoki utm jadval topilmadi (grep utm=0 jadval); lid.source qo'lda; veb→lid avto-atribusiya YO'Q

**14.50  🟡 qisman**  — ❓ Q50 — Sodiqlik/takroriy mijoz kampaniyasi (3 oy buyurtma bermaganga avto segment + win-back)?
- Siz: A — mijoz tarixiga avto segment + maxsus kampaniya
- Isbot: getChurnRisk() real (90+ kun buyurtma bermagan mijozlarni aniqlaydi, sdCustomers.lastOrderDate) — LEKIN avto win-back kampaniya yaratish/segment trigger YO'Q, faqat ro'yxat (READ)

**14.51  🟡 qisman**  — ❓ Q51 — Marketing material/brending arxivi (logo/katalog/narx/namuna versiya bilan)?
- Siz: A — markaziy material kutubxonasi (versiya bilan)
- Isbot: ecommerce/website-media portfolio + blog_posts bor, storage moduli fayl saqlaydi — LEKIN marketing-maxsus material kutubxonasi (versiyalangan logo/katalog/narx-ro'yxati) jadval YO'Q

**14.52  🟡 qisman**  — ❓ Q52 — Mijoz NPS so'rovnoma (buyurtma yopilgach avto 0-10 ball + izoh)?
- Siz: A — buyurtma yetkazilgach avto NPS (0-10 + izoh)
- Isbot: nps_responses jadval(9 qator) + GET/POST nps + getNpsStats (promoters/passives/detractors/monthlyTrend) real (analytics-stubs.controller.ts:134-174) — LEKIN buyurtma-yopilganda AVTO yuborish event/cron YO'Q, qo'lda POST

**14.53  🟡 qisman**  — ❓ Q53 — Bitrix24 → ERP ko'chirish (ERP yagona manba, Bitrix dan voz kechish)?
- Siz: A — ERP yagona manba, Bitrix24 dan lid/mijoz ko'chiriladi
- Isbot: ERP'da to'liq lid/kampaniya/inbox slice qurilgan (Bitrix o'rnini bosuvchi struktura tayyor) — LEKIN Bitrix24 CSV/API ko'prik (eksport/import) kodi YO'Q. Ko'chirish rejasi egasi-data (CSV yoki API)

**14.54  🟡 qisman**  — ❓ Q54 — Takroriy mijoz yo'qolishini per-mijoz-ritm bo'yicha erta sezish (churn signali)?
- Siz: A — mijozning O'Z ritmiga nisbatan kechikkani → signal
- Isbot: getChurnRisk (drizzle-marketing-ext.repo.ts:653) real LEKIN qat'iy 30/60/90 kun chegarasi ishlatadi (kod:680-683) — egasi xohlagan 'har mijoz O'Z ritmi' (Benazir har hafta, Fortech 3 oy) bo'yicha emas; B-variant qurilgan, A emas

**14.55  ❌ yo'q**  — ❓ Q55 — 'Kichiklashgan buyurtmalar' signali (summa/razmer tushishi avto aniqlanadimi)?
- Siz: A — mijoz buyurtma summa/soni/razmeri tushsa 'kamayish' signali
- Isbot: marketing modulida buyurtma-trend kamayish (M.Nosirov Excel) avto-aniqlash logikasi/jadval topilmadi; foyda/dona, foyda/kg trend hisobi YO'Q

**14.56  ❌ yo'q**  — ❓ Q56 — Mijoz brend pasporti (logo/Pantone/CMYK/shrift/taqiqlar) bir joyda saqlanadimi?
- Siz: A — har mijoz kartasida 'brend pasporti'
- Isbot: brand_passport/brend_pasport jadval yoki maydon topilmadi (grep=0); mijoz brend standartlari (rang kodi/shrift) saqlash strukturasi YO'Q

**14.57  🟡 qisman**  — ❓ Q57 — Mahsulot namunalari portfolio (oldingi ishlar: Panda/Tefal rasmlari katalogi)?
- Siz: A — mahsulot turi bo'yicha portfolio (namuna rasmlar + imkoniyat)
- Isbot: ecommerce/website-media.controller.ts:75 website/portfolio CRUD bor (portfolio_items jadval) — LEKIN bu veb-sayt portfolio, marketing/savdo mahsulot-turi (gofra/pizza/etiketka) bo'yicha tasniflangan B2B savdo-vositasi emas

**14.58  ❌ yo'q**  — ❓ Q58 — Опросный лист (mijoz brifi) lid'dan avto old-to'ldiriladi (zanjir uzilmaydi)?
- Siz: A — lid talabidan опросный лист old-to'ldirilgan o'tadi
- Isbot: опросный лист (opros/brief) jadval yoki lid→опросный лист ko'chirish kodi topilmadi (grep opros=0); SD/dizayn zanjiri bog'lanmagan

**14.59  ❌ yo'q**  — ❓ Q59 — Lid mahsulot turi (ofset/gofra/etiketka/flekso) majburiy maydon (zavod katalogidan)?
- Siz: A — lid'da mahsulot turi majburiy (ishlab chiqarish katalogidan)
- Isbot: marketing_leads 20 ustunida product_type/mahsulot-turi maydoni YO'Q (grep product_type marketing=0); lid zavod mahsulot-turi katalogiga bog'lanmagan, segmentlash mumkin emas

**14.60  ✅ bor**  — ❓ NPS so'rovnoma buyurtma yopilgach avtomatik (0-10 ball+izoh) yig'iladimi va saqlanadimi? (EP-MKT-082, v2-Q52)
- Siz: Buyurtma yetkazilgach avtomatik qisqa so'rovnoma; ball real DB ga saqlanadi
- Isbot: nps_responses=9 qator (jonli); POST /marketing/nps real INSERT (marketing-analytics-stubs.controller.ts:154); getNpsStats/getNps real svc. Avto-trigger (buyurtma yopilganda) hali event emas, qo'lda POST.

**14.61  🔑 egasi-data**  — ❓ Bitrix24 o'rnini ERP bosadimi, lid/mijoz ko'chiriladimi? (EP-MKT-083, v2-Q53)
- Siz: ERP yagona manba, Bitrix24 dan ko'chiriladi keyin voz kechiladi; ko'chirish CSV/API egasi qaror
- Isbot: decisions 14-marketing.md:600 Holat=🔵 OCHIQ; kodda Bitrix24 integratsiya/eksport-ko'prik yo'q (grep bitrix=0 marketing). O'tish rejasi egasidan.

**14.62  🟡 qisman**  — ❓ Takroriy mijoz yo'qolishi har mijoz RITMIga nisbatan aniqlanib savdo menejerga signal beriladimi? (EP-MKT-084, v2-Q54)
- Siz: Benazir har hafta, Fortech har 3 oy — har mijozning O'Z ritmiga nisbatan kechikkani aniqlanadi (qat'iy 60 kun EMAS)
- Isbot: getChurnRisk MAVJUD (drizzle-marketing-ext.repo.ts:653) lekin QAT'IY 30/60/90-kun chegarasi (debt>0&&days>=90=high). Bu vizyon RAD ETGAN B-varianti; per-customer ritm hisobi yo'q. churn_model_params jadval bor lekin bu ritm uchun ishlatilmaydi.

**14.63  ❌ yo'q**  — ❓ Nosirov 'Kichiklashgan buyurtmalar' tahlili (summa/soni/razmer tushishi) ERP avtomatik chiqaradimi? (EP-MKT-085, v2-Q55)
- Siz: Mijoz oylik buyurtma summasi/soni/razmeri tushsa 'kamayish' belgisi + sabab so'raladi
- Isbot: marketing-agent.service.ts faqat ROI/content/segment qiladi; 'shrink/kichik/foyda-kg' kod-hit yo'q marketing/ai'da. Hech qaysi jadval/endpoint buyurtma-trend tushishini hisoblamaydi.

**14.64  ❌ yo'q**  — ❓ Har mijozning BREND pasporti (logo+Pantone/CMYK+shrift+taqiq) bir joyda saqlanadimi? (EP-MKT-086, v2-Q56)
- Siz: Tefal qizil noto'g'ri chiqsa rad — mijoz brend qoidalari kartochkada, dizayn rahbari yuritadi
- Isbot: brand_templates jadval BO'SH (count=0); brand_passport/brandPassport kod-hit=0 butun api'da. Mijoz brend pasporti modeli qurilmagan.

**14.65  ❌ yo'q**  — ❓ Bizning oldingi ishlar (Panda/Tefal A-19/Ganga) mahsulot-turi bo'yicha portfolio katalogi bormi? (EP-MKT-087, v2-Q57)
- Siz: B2B savdoda 'mening qutimni qila olasizmi' — avval qilingan ish namuna rasm+texnik imkoniyat, brendlangan PDF
- Isbot: website_portfolio jadval BO'SH (count=0), portfolio_items=0; portfolio kod faqat ecommerce/website-media (umumiy galereya), marketing/savdo portfolio API yo'q.

**14.66  ❌ yo'q**  — ❓ Lid talabi (Benazir 25x19x12) опросный лист ga old-to'ldirilgan o'tadimi? (EP-MKT-088, v2-Q58)
- Siz: Опросный лист = тех карта asosi; lid ma'lumoti qayta yozilmasin, avtomatik o'tadi
- Isbot: decisions:635 Holat=🔵 OCHIQ; 'oprosn/опросн' kod-hit=0 butun api'da. Опросный лист modeli va lid→bri zanjiri qurilmagan.

**14.67  ❌ yo'q**  — ❓ Lid kelganda mahsulot turi (ofset/gofra/etiketka/flekso/blanka) majburiy belgilanadimi? (EP-MKT-089, v2-Q59)
- Siz: Har tur boshqa dastgoh/narx/menejer; lid'da mahsulot turi majburiy, ishlab chiqarish katalogidan
- Isbot: marketing_leads ustunlarida product_type/mahsulot-turi YO'Q (jonli information_schema: id,name,company,phone,email,source,channel,campaign_id,status,score,...). Tasniflash maydoni qurilmagan.

**14.68  🟡 qisman**  — ❓ Lid kelishi bilan menejerga (mahsulot/hudud avto yoki round-robin) biriktiriladimi, egasiz lid qizil ko'rinadimi? (EP-MKT-090, v2-Q60)
- Siz: 'Egasiz lid = o'lik lid'; lid menejerga biriktiriladi, biriktirilmagan 'egasiz' ro'yxatida qizil
- Isbot: marketing_leads.assigned_to ustuni BOR; lekin avto-biriktirish (round-robin/mahsulot-hudud) kod yo'q (grep assigned_to/roundRobin marketing=0 logika). Lead→CRM convert REAL (stubs:280, real INSERT crm_leads). Egasiz-qizil ro'yxat yo'q.

**14.69  ❌ yo'q**  — ❓ Mijoz/lid kartasida to'lov intizomi belgisi (Moliyadan kechikkan to'lov/qarz) marketingga ko'rinadimi? (EP-MKT-091, v2-Q61)
- Siz: To'lamaydigan mijozga vaqt sarflash zarar; AR'dan belgi ko'rinadi (ogohlantirish, qaror menejerda)
- Isbot: decisions:656 Holat=🔵 OCHIQ; churn-risk'da openDebt sd_customers'dan o'qiladi lekin lid kartasida to'lov-intizom signali/Moliya AR-bog'lanish marketingda qurilmagan.

**14.70  ❌ yo'q**  — ❓ Mavsumiy talab kalendari (o'tgan yil tarixidan, 'shu mijozga shu oyda qo'ng'iroq qil') bormi? (EP-MKT-092, v2-Q62)
- Siz: Yangi yil oldidan Benazir/Panda 3x oshadi; dastgoh band bo'lishidan oldin oldindan band qilamiz
- Isbot: seasonal kod faqat ai/forecast (holt-winters) va pp-intelligence — marketing mavsumiy-talab kalendari + mijoz-eslatma yo'q. marketing_calendar_events kontent uchun, talab uchun emas.

**14.71  ❌ yo'q**  — ❓ Voronkaga 'Namuna tayyorlandi→tasdiqida→Tasdiqlandi (подписной лист)' bosqichlari qo'shilganmi? (EP-MKT-093, v2-Q63)
- Siz: Подписной лист = mijoz tasdiqlagan dizayn = sotuvning haqiqiy 'ha' nuqtasi, voronkada ko'rinsin
- Isbot: подписной лист/макет-tasdiq voronka bosqichi kod-hit=0; crm_lead_stages bor lekin kitobdagi namuna→подписной B2B bosqichlari kiritilmagan. action=UPDATE (decisions:670) = hali qilinmagan.

**14.72  🟡 qisman**  — ❓ Fizik namuna (test quti) XARAJATI (material+vaqt) hisoblanib, konversiya/ROI o'lchanadimi? (EP-MKT-094, v2-Q64)
- Siz: Bepul namuna berib mijoz topmaslik = sof zarar; namuna xarajat+natija → ROI, CPL ga qo'shiladi
- Isbot: ow_order_samples jadval BOR (count=0) lekin ustunlari: id,order_id,iteration,requested_at,produced_at,customer_decision,feedback,rejection_reason — XARAJAT/material/ROI ustuni YO'Q. Konversiya bor (decision), xarajat-ROI qurilmagan.

**14.73  ❌ yo'q**  — ❓ Yirik mijozdan yillik ehtiyoj prognozi olinib ishlab chiqarish/material rejasiga ulanadimi? (EP-MKT-095, v2-Q65)
- Siz: Benazir 'yilda 500 ming quti'; material+dastgoh oldindan reja (orientir, majburiyat emas), B2B sodiqlik
- Isbot: marketing'da yillik mijoz-forecast olish/saqlash endpointi yoki jadvali yo'q; ai/forecast statistik prognoz qiladi lekin mijoz-deklaratsiya kiritish (CREATE action) qurilmagan.

**14.74  ❌ yo'q**  — ❓ Lid noodatiy talab so'rasa texnik imkoniyat (dastgoh format/material) avtomatik tekshiriladimi? (EP-MKT-096, v2-Q66)
- Siz: Yolg'on va'da sharmandalik; 'Формат листа/гофро'ga solishtirish → qila olamiz/qiyin/yo'q + alternativa
- Isbot: Lid talabini dastgoh-format/material imkoniyatiga solishtiruvchi tekshiruv kodi marketingda yo'q (action=READ, decisions:691, qurilmagan). Texnik chegara katalogi bilan bog'lanish yo'q.

**14.75  ❌ yo'q**  — ❓ Mijoz papka raqami (PT/KT/E) bo'yicha 'takror qil' bir tugma (eski тех карта+yangi narx) bormi? (EP-MKT-097, v2-Q67)
- Siz: 'O'tgan yilgi Tefal A-19 ni qaytadan' — papka № bo'yicha eski тех карта topiladi, noldan ishlash kerak emas
- Isbot: 'takror/repeat-order/reorder' hits faqat crm-custom-fields (aloqasiz); mijoz kartasida papka-ro'yxat + 'takror qil' tugmasi qurilmagan. action=CREATE (decisions:698).

**14.76  ❌ yo'q**  — ❓ Mijoz 'wallet share' — u bizdan yana nimani olishi mumkin (upsell AI tavsiyasi) ko'rsatiladimi? (EP-MKT-098, v2-Q68)
- Siz: Benazir 7 xil quti, etiketkani boshqadan olsa biz ham olamiz; 'qila oladigan lekin olmayotgan' + AI tavsiya
- Isbot: wallet.share/walletShare kod-hit=0; marketing-ai.service faqat content/adCopy/sentiment/seo; upsell/wallet AI yo'q. action=AI qurilmagan.

**14.77  ❌ yo'q**  — ❓ Mijoz NPS so'rovi oldidan oxirgi buyurtmalardagi brak/reklamatsiya (qc_reclamations) ko'rinadimi? (EP-MKT-099, v2-Q69)
- Siz: Brak bo'lgan mijozga 'tavsiya qilasizmi' so'rash noto'g'ri vaqt; shikoyat tarixi NPS bilan birga + uzr+chegirma
- Isbot: NPS↔qc_reclamations bog'lash kodi yo'q; nps_responses jadvalida brak-tarix bog'lanishi yoki 'noto'g'ri vaqt' bayrog'i yo'q. action=EVENT (decisions:712) qurilmagan.

**14.78  🟡 qisman**  — ❓ Har yutilgan/yo'qolgan lid'da raqib nomi + sabab (narx/sifat/muddat) majburiy yoziladimi? (EP-MKT-100, v2-Q70)
- Siz: 'X zavod arzonroq qildi' to'planib turса dalil bilan narx/xizmat moslaymiz — raqib+sabab
- Isbot: getLossAnalysis BOR (leads.repository.ts:93) — lost_reason bo'yicha breakdown REAL; lekin marketing_leads'da competitor/raqib ustuni YO'Q (jonli schema). Raqib nomi + win surati yozilmaydi.

**14.79  ❌ yo'q**  — ❓ Yangi savdo menejer uchun mahsulot bo'yicha savdo skripti + FAQ (lavozim kartasi darsligi) bormi? (EP-MKT-101, v2-Q71)
- Siz: Karta-markazli: har lavozimda darslik+nazorat varaqasi; savdo skripti kartaga bog'liq, yangi menejer tez o'rganadi
- Isbot: Marketing modulida savdo-skript/FAQ kutubxonasi yo'q (faqat inbox javob-shablonlari — marketing_email_templates, boshqa maqsad). LMS-karta darslik bog'lanishi marketingda qurilmagan. action=READ.

**14.80  ❌ yo'q**  — ❓ Har mijoz/lid hudud (viloyat/davlat) + eksport/ichki belgisi + hudud savdo xaritasi bormi? (EP-MKT-102, v2-Q72)
- Siz: 'Apricot Tojikiston' — eksport boshqa hujjat+narx; hudud bo'yicha kuchli/zaif ko'rinadi
- Isbot: marketing_leads'da region/export ustuni YO'Q (jonli schema tekshirildi: region/export ILIKE=0 natija). Hudud/eksport segmenti + xarita qurilmagan. action=CREATE.

**14.81  🟡 qisman**  — ❓ Mijozda bir nechta kontakt + 'asosiy kontakt o'zgardi' belgisi → darrov aloqa vazifasi bormi? (EP-MKT-103, v2-Q73)
- Siz: Xaridor almashganda yangi odam eski yetkazuvchisini olib keladi, biz yo'qolamiz; tez munosabat quramiz
- Isbot: marketing_lead_contacts jadval BOR + GET/POST/DELETE leads/:id/contacts (marketing-group2.controller.ts:275-293) — ko'p kontakt REAL; lekin 'asosiy kontakt o'zgardi' belgisi + avto-vazifa yo'q. action=UPDATE qurilmagan.

**14.82  ❌ yo'q**  — ❓ Uzoq sukut saqlagan eski mijoz (dormant) ro'yxati + qayta aloqa vazifasi (win-back) bormi? (EP-MKT-104, v2-Q74)
- Siz: 2023 papka eski mijoz tanish/ishonchli, 'sog'indik' qo'ng'irog'i bir qismini qaytaradi = deyarli bepul savdo
- Isbot: win-back/dormant hits SD/CRM RFM tahlilida (sd_customers.win_back_potential ustuni — qo'lda maydon, marketing kampaniya emas). Marketing'da dormant-ro'yxat avto-segment + win-back kampaniya/vazifa qurilmagan. action=AI.

**14.83  🟡 qisman**  — ❓ Mijoz ABC toifa (yillik summa+takror+foyda) avtomatik + har toifaga xizmat darajasi bormi? (EP-MKT-105, v2-Q75)
- Siz: A mijoz (Benazir/Panda) ketsa katta zarar — ustuvor reja+narx; C ga ko'p vaqt zarar
- Isbot: sd_customers.abc_class + abc_computed_at ustunlari BOR (jonli); ABC SD'da hisoblanadi. Lekin marketingda 'har toifaga xizmat darajasi' (A-ustuvor reja+narx farqi) + real-time qayta-hisob qurilmagan. action=AI.

**14.84  ❌ yo'q**  — ❓ So'rov/lid mahsulot-turi statistikasi → 'qaysi turga talab o'syapti' → 6-departamentga (flekso liniya qarori) hisobot bormi? (EP-MKT-106, v2-Q76)
- Siz: Flekso gofra 90m liniya rejada; mijozlar so'rayaptimi → investitsiya dalilli
- Isbot: marketing_leads'da mahsulot-turi ustuni yo'q (089), shu sabab tur-talab statistikasi ham yo'q; 6-departament avto-hisobot yo'q. action=AI qurilmagan.

**14.85  ❌ yo'q**  — ❓ Mijozga buyurtma holati (dizayn/chop/kesish/tayyor %) ko'rinadigan link/bot bormi? (EP-MKT-107, v2-Q77)
- Siz: B2B mijoz 'qutim tayyormi' deb qo'ng'iroq qiladi; mijoz o'zi ko'rsa qo'ng'iroq kamayadi, ishonch ortadi
- Isbot: Mijozga buyurtma-holat link/bot kodi yo'q (action=READ, decisions:768). Inbox social_conversations/social_messages jadvallari bor (0 qator) lekin mijoz-status kuzatuv boti emas; AI-reply=pending.

**14.86  ❌ yo'q**  — ❓ Sodiqlik imtiyozi (yillik hajmga ko'ra) avtomatik chegirma qoidasi (ega+savdo boshlig'i belgilaydi) bormi? (EP-MKT-108, v2-Q78)
- Siz: Chegirma menejer kayfiyatiga bog'liq = suiiste'mol xavfi; qoida asosida adolatli/shaffof imtiyoz
- Isbot: Sodiqlik-daraja + avto-imtiyoz qoidasi kodi yo'q marketingda (action=CREATE). promo-kod kampaniyaga bog'lanadigan struktura ham marketing_campaigns'da to'liq emas.

**14.87  ❌ yo'q**  — ❓ Marketing dizayn bo'limi bandligini (kanban yuki) ko'rib realdan ko'p va'da bermaydimi? (EP-MKT-109, v2-Q79)
- Siz: Dizayn 2 hafta kechiksa mijoz ketadi; marketing real ulgura oladigan ish oladi
- Isbot: Marketing↔dizayn kanban-yuk ko'rinishi/bog'lanish kodi yo'q (action=READ, decisions:782). Dizayn bo'lim bandligi marketingga signal bermaydi.

**14.88  ❌ yo'q**  — ❓ Ishlab chiqarish bo'sh quvvati marketingga signal → 'bo'sh davr aksiyasi' (ega+savdo tasdiq) bormi? (EP-MKT-110, v2-Q80)
- Siz: Dastgoh bo'sh tursa sof zarar (ijara/oylik); aksiya bilan bo'shliqni to'ldiramiz
- Isbot: Ishlab chiqarish bo'sh-quvvat → marketing aksiya signali event yo'q (action=EVENT, decisions:789). Bandlik↔marketing bog'lanish qurilmagan.

**14.89  ❌ yo'q**  — ❓ Mijoz/mahsulot foyda darajasi (faqat boshliq+ega maxfiy) marketingga ko'rinib fokus yo'naltiradimi? (EP-MKT-111, v2-Q81)
- Siz: Nosirov foyda/dona, foyda/kg; ko'p buyurtma ≠ ko'p foyda — yuqori foydaliga e'tibor, rol-maxfiy
- Isbot: Marketingda mijoz/mahsulot foyda-daraja ko'rinishi + RBAC-maxfiy fokus kodi yo'q (action=READ). foyda/dona-kg hisobi Moliyada bo'lishi mumkin lekin marketingga ulanmagan.

**14.90  ❌ yo'q**  — ❓ Savdo menejer kartasida faollik (aloqa soni CRM'dan) + natija (buyurtma/summa) statistikasi bormi? (EP-MKT-112, v2-Q82)
- Siz: Karta-markazli: har lavozimda статистик кўрсаткичлар; faollik past bo'lsa sabab aniqlanadi, adolatli
- Isbot: Savdo menejer karta faollik↔natija statistik ko'rsatkichi marketingda qurilmagan (action=READ). sd_lead_activities jadval bor lekin menejer-karta statistikasiga yig'ilmaydi.

**14.91  ❌ yo'q**  — ❓ Dizayn yangilash takliflari ro'yxati → menejer mijozga taqdim → опросный лист old-to'ldiriladimi? (EP-MKT-113, v2-Q83)
- Siz: 'Yangi dizayn/lagatip' eski qutini yangilab taklif = yangi buyurtma + sodiqlik
- Isbot: Dizayn-upsell taklif ro'yxati + опросный лист old-to'ldirish kodi yo'q (опросн hit=0, action=CREATE). Qurilmagan.

**14.92  ❌ yo'q**  — ❓ Mijoz kartasida uning mahsulot/aksiya kalendari + 'shu sanadan oldin quti kerak' eslatmasi bormi? (EP-MKT-114, v2-Q84)
- Siz: Benazir Yangi yil shirinligini noyabrda chiqaradi; rejasini bilsak proaktiv taklif
- Isbot: Mijoz aksiya-kalendari + proaktiv eslatma kodi/jadvali yo'q marketingda (action=CREATE, decisions:817). Qurilmagan.

**14.93  🟡 qisman**  — ❓ Marketing byudjeti zavod-real moddalari (ko'rgazma/vakil safari/namuna/katalog/raqamli) bo'yicha bo'linadimi, HR komandировка ulanadimi? (EP-MKT-115, v2-Q85)
- Siz: B2B zavodda 'reklama byudjeti' noto'g'ri; asl xarajat ko'rgazma/vakil/namuna/katalog; vakil safari HR'dan
- Isbot: marketing_budget_items/marketing_budget_lines jadval + budget CRUD BOR (marketing-group2.controller.ts:145-186); lekin zavod-real modda tuzilmasi (vakil safari→HR komандировка ulanish) qurilmagan. action=CREATE.

**14.94  🔑 egasi-data**  — ❓ Egaga (Ayubxon Pozilov) aniq 5 raqam (yangi/yo'qolgan/kichiklashgan mijoz, savdo trendi, eng katta xavf) + 'diqqat talab' bormi? (EP-MKT-116, v2-Q86)
- Siz: Ega vaqti tor, 50 grafik kerak emas; aniq 5 raqam + 1 diqqat — bir qarashda holat
- Isbot: decisions:831 Holat=🔵 OCHIQ (5 raqamni ega tanlaydi). Marketing dashboard (MarketingDashboard.tsx) BOR lekin egaga-maxsus 5-raqam widget'i qurilmagan; qaysi 5 raqam — egasidan.

**14.95  ❌ yo'q**  — ❓ Lid'da 'kim tavsiya qildi' + tavsiya zanjiri + tavsiyachiga rahmat/bonus qoidasi bormi? (EP-MKT-117, v2-Q87)
- Siz: B2B eng kuchli/arzon kanal = mijoz tavsiyasi; kim kimni keltirgani bilinsa rag'batlantiriladi
- Isbot: marketing_leads'da referrer/tavsiya-zanjir ustuni YO'Q (jonli schema, referr ILIKE=0). employee_referrals = HR ishga-olish tavsiyasi (referrer_user_id/candidate), MIJOZ tavsiya-zanjiri emas. action=CREATE qurilmagan.

**14.96  ❌ yo'q**  — ❓ Lid mijoz bo'lib SD ga o'tishdan oldin rekvizit (STIR/shartnoma/manzil) to'liqligi tekshiriladimi (to'liq bo'lmasa o'tmaydi)? (EP-MKT-118, v2-Q88)
- Siz: 'Xom-ashyo to'liq bo'lmagan zakaz kiritilmaydi' ruhi; rekvizitsiz mijoz keyin invoys/to'lov muammosi
- Isbot: convert-to-crm (stubs:280) faqat name/phone/email/source ko'chiradi — rekvizit (STIR/shartnoma/manzil) to'liqlik DARVOZASI yo'q, tekshiruvsiz o'tadi. action=APPROVE qurilmagan.

**14.97  🟡 qisman**  — ❓ Ko'rgazmadan kelgan lidlar sotuvga ulanib kuzatiladimi, follow-up jadvali (48 soat) bormi? (EP-MKT-059/060, v2-Q29/Q30)
- Siz: Ko'rgazma ROI avtomatik; tugagach 48 soat ichida bog'lanish vazifalari avto-yaratiladi
- Isbot: exhibitions CRUD + exhibitions/:id/leads + QR BOR (stubs:420-496); exhibition_leads jadval bor (0 qator). Lekin avto follow-up vazifa (48 soat) yo'q — repo izohi: 'Schema has no next_follow_up_at column' (drizzle-marketing-ext.repo.ts:481).

**14.98  🟡 qisman**  — ❓ Raqobatchi kartochkasi (nomi/mahsulot/narx/kuchli-zaif) muntazam yangilanadimi? (EP-MKT-078, v2-Q48)
- Siz: Mijoz 'falon zavod arzonroq' deydi; raqib narxini bilsak taklif/kampaniyani dalil bilan moslaymiz
- Isbot: GET /marketing/competitors REAL (group2: sd_customer_competitors'dan aggregate: competitorName/share/switchRisk); lekin sd_customer_competitors=0 qator (jonli) + alohida raqobatchi-kartochka CRUD yo'q. Faqat o'qish-aggregat.

**14.99  🟡 qisman**  — ❓ Ijtimoiy inbox barcha kanal xabarini bitta oynaga yig'ib lidga aylantiradimi? (EP-MKT-062/064, v2-Q32/Q34)
- Siz: 4 ilovani aylanmasin, yo'qolgan xabar=yo'qolgan mijoz; suhbatdan 'Lid yarat' tugmasi
- Isbot: inbox endpointlari (conversations/messages/reply/status) REAL kod, social_conversations+social_messages+social_api_configs jadvallari bor; LEKIN ikkala jadval 0 qator + AI-reply=pending (provider ulanmagan, stubs:361) + Instagram/FB webhook ulanishi yo'q. Struktura bor, oqim quruq.

---

## 15 — Kanban / Vazifa  (vizyon 31%, 137 savol)

**15.1  🟡 qisman**  — ❓ Q1 (v2). Savatlar/ustunlar ro'yxati va tartibi (3 savat: Bajariladi→Jarayonda→Bajarildi). Kanban taxtasida qanday savatlar va tartibda?
- Siz: 3 savat: Bajariladi→Jarayonda→Bajarildi, butun fabrika uchun bir xil
- Isbot: kanban_columns jadvali + sort_order BOR (schema-kanban.ts:21-30), lekin jonli data = test-axlat: board 1 ustunlari 'as/salom/sALOM/SADSD/SDSD', board 2 'Birinchi bosqich/Salom/savol/1231322' (q.cjs). Kanonik 3-savat seed YO'Q.

**15.2  🟡 qisman**  — ❓ Q2 (v2). Oldinga o'tish (savatdan savatga) kim huquqli (mas'ul suradi, Bajarildi'ni boshliq tasdiqlaydi)?
- Siz: Faqat ijrochi suradi, Bajarildi'ni boshliq tasdiqlaydi
- Isbot: accept/complete da assigner-guard BOR (drizzle-kanban-cards.repo.ts:238-246: bajaruvchi o'zi yakunlay olmaydi). Lekin umumiy ustun-o'tish (move) huquq-guardi (faqat mas'ul) YO'Q — assignCard/move ochiq.

**15.3  ❌ yo'q**  — ❓ Q3 (v2). Orqaga qaytarish qoidasi (Jarayonda→Bajariladi, sabab majburiy, tarixga yoziladi)?
- Siz: Mumkin, lekin sabab majburiy va tarixga yoziladi
- Isbot: Kanban_cards'da sabab-majburiy orqaga-qaytarish logikasi yo'q; transition-history/sabab ustuni yo'q. Grep moveBack/orqaga — hech narsa topilmadi.

**15.4  ❌ yo'q**  — ❓ Q4 (v2). Bajarildi'dan qayta ochish (faqat boshliq, sabab majburiy, 'qayta ochildi' belgisi)?
- Siz: Faqat boshliq qayta ochadi, sabab majburiy, belgi qoladi
- Isbot: Grep 'reopen' kanban modulida 0 natija; reopened_at/reopen_count ustuni YO'Q (q.cjs information_schema).

**15.5  ❌ yo'q**  — ❓ Q5 (v2). Bir savatdan ikkitasini sakrab o'tish taqiqlanadimi (albatta Jarayonda'dan o'tadi)?
- Siz: Sakrash taqiqlanadi, vazifa albatta Jarayonda'dan o'tadi
- Isbot: Aggregate moveToColumn (kanban-task.aggregate.ts:79) faqat 'DONE bo'lsa ko'chmaydi' tekshiradi; ketma-ket savat tartibi/sakrash-taqiq logikasi yo'q.

**15.6  ❌ yo'q**  — ❓ Q6 (v2). Jarayonda savatiga o'tish sharti (ijrochi va muddat to'ldirilgan bo'lsa)?
- Siz: Ijrochi va muddat to'ldirilgan bo'lsagina Jarayonda'ga o'tadi
- Isbot: Move/transition'da ijrochi+muddat majburiy-guard yo'q; createCardFlat (drizzle-kanban-cards.repo.ts:172) muddatsiz/ijrochisiz karta yaratadi (title default 'Yangi vazifa').

**15.7  ❌ yo'q**  — ❓ Q7 (v2). Bajarildi'ga o'tish sharti (kamida bitta izoh majburiy, ba'zilarda rasm/fayl)?
- Siz: Kamida izoh majburiy; Sifat/ta'mirlash turlarida rasm/fayl majburiy
- Isbot: completeCard (drizzle-kanban-cards.repo.ts:226-255): completionReport IXTIYORIY (?? null), majburiy izoh/rasm tekshiruvi yo'q. Yakunlash dalilsiz mumkin.

**15.8  ❌ yo'q**  — ❓ Q8 (v2). WIP chegarasi (bir paytda ko'pi bilan 3 ta Jarayonda)?
- Siz: Bir paytda ko'pi bilan 3 ta Jarayonda — diqqat jamlanadi
- Isbot: Grep 'wip|WIP' kanban modulida 0 natija; WIP-limit guard hech qaerda yo'q.

**15.9  🟡 qisman**  — ❓ Q9 (v2). O'tish vaqtini avtomatik yozib borish (har savatga o'tish vaqti, o'zgartirib bo'lmaydi)?
- Siz: Har o'tish vaqti avtomatik yoziladi, qo'lda o'zgartirib bo'lmaydi
- Isbot: kanban_time_tracks jadvali BOR (48 qator) + accepted_at/completed_at ustunlari bor, lekin har savat-o'tish vaqtini yozadigan transition-log YO'Q (faqat accept/complete nuqtalari).

**15.10  ❌ yo'q**  — ❓ Q10 (v2). Eskalatsiya sababi (muddat o'tib 24 soat, hali Bajarildi'ga o'tmagan)?
- Siz: Muddati o'tib 24 soat bo'lsa-yu Bajarildi'ga o'tmagan bo'lsa
- Isbot: Kanban uchun eskalatsiya cron YO'Q. escalat-grep: faqat MES (mes-sos-escalation) + CC (cc-sla.cron) — kanban_cards'ni tekshirmaydi.

**15.11  ❌ yo'q**  — ❓ Q11 (v2). 24 soat qanday sanaladi (ish vaqti/smena jadvaliga ko'ra)?
- Siz: Faqat ish vaqti sanaladi (smena jadvaliga ko'ra) — adolatli
- Isbot: Kanban eskalatsiya cron umuman yo'q (yuqoridagi Q10), demak ish-vaqti hisobi ham yo'q.

**15.12  ❌ yo'q**  — ❓ Q12 (v2). Eskalatsiya kimga boradi (bevosita boshliqqa, manager_id zanjiri)?
- Siz: Ijrochining bevosita boshlig'iga (org keyingi yuqori daraja)
- Isbot: Kanban eskalatsiya marshruti yo'q. CC SLA cron manager-zanjirni ishlatadi, lekin kanban_cards uchun emas.

**15.13  ❌ yo'q**  — ❓ Q13 (v2). Ikkinchi bosqich eskalatsiya (yana 24 soat, keyingi darajaga, CEO'da to'xtaydi)?
- Siz: Ha, yana 24 soatdan keyin keyingi yuqori darajaga, CEO'da to'xtaydi
- Isbot: Kanban tier-2 eskalatsiya logikasi yo'q (kanban escalation cron umuman mavjud emas).

**15.14  🟡 qisman**  — ❓ Q14 (v2). Eskalatsiya xabari qaysi kanaldan (ERP + Telegram guruh)?
- Siz: ERP ichida + Telegram guruhga xabar
- Isbot: Telegram infratuzilma BOR (kanban.handler.ts onTaskAssigned/onTaskDueSoon JONLI sendMessage), lekin eskalatsiya hodisasi yo'qligi sababli eskalatsiya-xabari ulanmagan.

**15.15  ❌ yo'q**  — ❓ Q15 (v2). Eskalatsiya hisobi (kim necha marta eskalatsiyaga ketgan, oylik hisobotda)?
- Siz: Ha, oylik hisobotda 'eskalatsiya soni' ko'rsatkichi
- Isbot: escalation_count ustuni YO'Q (q.cjs); eskalatsiya hodisasi yozilmaydi.

**15.16  ❌ yo'q**  — ❓ Q16 (v2). Eskalatsiyani bekor qilish (boshliq sabab yozib yopadi, tarixda qoladi)?
- Siz: Boshliq sabab yozib yopadi, lekin tarixda qoladi
- Isbot: Eskalatsiya mexanizmi yo'qligidan bekor-qilish ham yo'q.

**15.17  ❌ yo'q**  — ❓ Q17 (v2). Muddatsiz vazifa eskalatsiyaga tushadimi (muddat majburiy yaratishda)?
- Siz: Muddatsiz vazifa yaratilishiga yo'l qo'yilmaydi (muddat majburiy)
- Isbot: createCardFlat (drizzle-kanban-cards.repo.ts:184) due_date INSERT'ga kiritmaydi ham — muddat majburiy emas, validatsiya yo'q. KanbanCardCreateSchema.dueDate optional (kanban-cards.controller.ts:43).

**15.18  ❌ yo'q**  — ❓ Q18 (v2). Shaxsiy kunlik dastur nima asosida (Kanban vazifalari + odat ishlar avtomatik soatlarga)?
- Siz: Kanban + takrorlanuvchi odat ishlar avtomatik soatlarga taqsimlanadi
- Isbot: FE PersonalProgram sahifasi UMUMAN YO'Q (Glob: hech qaysi *Personal*Program* fayl topilmadi; faqat employee-profile/PersonalTab). BE'da personal-program endpoint yo'q.

**15.19  ❌ yo'q**  — ❓ Q19 (v2). Dastur qadami (1 soatlik bo'laklar 08:00-09:00)?
- Siz: 1 soatlik bo'laklar — sodda va yetarli
- Isbot: Shaxsiy dastur sahifasi/jadvali yo'q (Q18), demak soatlik grid ham yo'q.

**15.20  ❌ yo'q**  — ❓ Q20 (v2). Reja vs Fakt taqqoslash (kun oxirida reja/fakt/farq)?
- Siz: Ha, kun oxirida har bo'lakda reja/fakt/farq ko'rinadi
- Isbot: Grep planVsFact/reja vs fakt: faqat doc fayllarda, kod yo'q. Personal program yo'q.

**15.21  ❌ yo'q**  — ❓ Q21 (v2). Dasturni kim tasdiqlaydi (ertalab boshliq tasdiqlaydi)?
- Siz: Ertalab boshliq bir qarab tasdiqlaydi yoki o'zgartiradi
- Isbot: Dastur-tasdiqlash oqimi yo'q (personal program moduli mavjud emas).

**15.22  ❌ yo'q**  — ❓ Q22 (v2). Kutilmagan ish kirib qolsa (rejaga qo'shiladi, siljiganlar avtomatik keyinga)?
- Siz: Yangi vazifa qo'shiladi, siljiganlar avtomatik keyinga suriladi
- Isbot: Reflow logikasi yo'q (personal program yo'q).

**15.23  ❌ yo'q**  — ❓ Q23 (v2). Bo'sh soatlar (rejada teshik sariq belgilanadi, sabab so'raydi)?
- Siz: Bo'sh soatlar sariq belgilanadi va sababini so'raydi
- Isbot: Bo'sh-soat tahlili yo'q (personal program yo'q).

**15.24  🟡 qisman**  — ❓ Q24 (v2). Takrorlanuvchi kunlik ishlar (bir marta sozlanadi, har kuni avtomatik paydo)?
- Siz: Bir marta sozlanadi, har kuni avtomatik paydo bo'ladi
- Isbot: KanbanRecurringCron JONLI (kanban-recurring.cron.ts:23 @Cron 07:00, daily/weekly/monthly nusxa yaratadi). Lekin shaxsiy dasturga emas, faqat kanban kartani qayta yaratadi; odat-ish dasturga tushishi (Q18) yo'q.

**15.25  ❌ yo'q**  — ❓ Q25 (v2). Dastur kun oxirida yopiladimi (o'zgartirib bo'lmaydi, faqat ko'rish)?
- Siz: Kun yopilgach o'zgartirib bo'lmaydi — ishonchli tarix
- Isbot: Kun-yopish/lock logikasi yo'q (personal program yo'q).

**15.26  ❌ yo'q**  — ❓ Q26 (v2). Vazifa kategoriyalari ro'yxati (IshlabChiq/Sifat/Ta'mirlash/Ombor/Sotuv/Ma'muriy/Boshqa)?
- Siz: 7 kategoriya: fabrika tiliga mos
- Isbot: kanban_cards'da category ustuni YO'Q (q.cjs information_schema = []); task_category master jadval YO'Q (faqat task_templates bor).

**15.27  🟡 qisman**  — ❓ Q27 (v2). Ustuvorlik darajalari (3 daraja: Shoshilinch/Oddiy/Past)?
- Siz: 3 daraja: Shoshilinch/Oddiy/Past — sodda va yetarli
- Isbot: kanban_cards.priority ustuni BOR (varchar, default 'normal', schema-kanban.ts:38); Telegram emoji HIGH/MEDIUM/LOW (kanban.handler.ts:32). Lekin master-ro'yxat/enum standartlashtirilmagan (erkin matn).

**15.28  ❌ yo'q**  — ❓ Q28 (v2). Ustuvorlikni kim belgilaydi (yaratuvchi taklif, boshliq tasdiqlaydi)?
- Siz: Yaratuvchi taklif qiladi, boshliq tasdiqlaydi/o'zgartiradi
- Isbot: Priority taklif→tasdiq oqimi yo'q; createCardFlat priority'ni to'g'ridan yozadi, tasdiq qadami yo'q.

**15.29  ❌ yo'q**  — ❓ Q29 (v2). Shoshilinch vazifa kunlik chegarasi (bir kunda ko'pi bilan 2 ta)?
- Siz: Bir kunda ko'pi bilan 2 ta Shoshilinch — qadri saqlanadi
- Isbot: Urgent-limit guard yo'q (grep urgentLimit 0 natija).

**15.30  🟡 qisman**  — ❓ Q30 (v2). Ustuvorlik tartibi (shoshilinch yuqorida, keyin muddati yaqinlari avtomatik)?
- Siz: Avtomatik: shoshilinch yuqorida, muddati yaqinlari keyin
- Isbot: sort_order ustuni BOR (qo'lda tartib); getAllCards ORDER BY sort_order (kanban-cards.controller.ts:126), lekin priority+due_date bo'yicha AVTOMATIK saralash yo'q.

**15.31  ❌ yo'q**  — ❓ Q31 (v2). Kategoriyaga qarab mas'ulni avtomatik taklif?
- Siz: Ha, kategoriya bo'yicha odatiy mas'ulni taklif qiladi
- Isbot: Kategoriya yo'q (Q26), demak kategoriya→mas'ul taklif logikasi ham yo'q.

**15.32  ❌ yo'q**  — ❓ Q32 (v2). Ustuvorlik muddatga ta'sir qiladimi (Shoshilinch→shu kun oxiri muddat)?
- Siz: Shoshilinch → odatda shu kun oxiri muddat (o'zgartirsa bo'ladi)
- Isbot: Priority→deadline avtomatik bog'lash logikasi yo'q (createCardFlat priority va due_date alohida, bog'lanmagan).

**15.33  ❌ yo'q**  — ❓ Q33 (v2). Kun oxirida bajarilmagan vazifa (avtomatik ertangi kunga, 'ko'chirilgan' belgisi)?
- Siz: Avtomatik ertangi kunga ko'chiriladi va 'ko'chirilgan' belgisi qoladi
- Isbot: Rollover cron YO'Q (grep rollover apps/api = 0 natija); rolled_over ustunlari YO'Q (q.cjs). Faqat doc/ShVB-da reja sifatida.

**15.34  ❌ yo'q**  — ❓ Q34 (v2). Necha marta ko'chirilganini sanash ('3 marta ko'chirilgan', 3 dan oshsa signal)?
- Siz: Ha, '3 marta ko'chirilgan'; 3 dan oshsa boshliqqa signal
- Isbot: rolled_over_count ustuni YO'Q (q.cjs information_schema = []).

**15.35  ❌ yo'q**  — ❓ Q35 (v2). Ko'chirishda muddat o'zgaradimi (ertangiga suriladi, 'asl muddat o'tgan' belgisi saqlanadi)?
- Siz: Muddat ertangiga suriladi, 'asl muddat o'tgan' belgisi saqlanadi
- Isbot: Rollover mexanizmi yo'q (Q33), muddat-surish logikasi yo'q.

**15.36  ❌ yo'q**  — ❓ Q36 (v2). Qaysi vazifalar ko'chmaydi (aniq sanaga bog'langanlar, faqat eskalatsiyaga)?
- Siz: Aniq sanaga bog'langan vazifalar ko'chmaydi, faqat eskalatsiyaga tushadi
- Isbot: Rollover ham, eskalatsiya ham yo'q (Q33/Q10) — istisno logikasi mavjud emas.

**15.37  ❌ yo'q**  — ❓ Q37 (v2). Ko'chirish vaqti (har bo'limning smena tugashiga moslab)?
- Siz: Har bo'limning smena tugashiga moslab ko'chiriladi
- Isbot: Rollover yo'q, smena-asos vaqt ham yo'q.

**15.38  ❌ yo'q**  — ❓ Q38 (v2). Ko'chgan vazifa ertangi rejada qayerda (yuqorida turadi — qarz birinchi)?
- Siz: Ko'chgan ish ertangi ro'yxatda yuqorida turadi
- Isbot: Rollover + personal program yo'q, joylashuv-tartib logikasi yo'q.

**15.39  ❌ yo'q**  — ❓ Q39 (v2). Ko'p marta ko'chgan vazifa avtomatik yopish (10 kundan oshsa 'yopaylikmi?')?
- Siz: 10 kundan oshsa boshliqqa 'yopaylikmi?' so'rovi
- Isbot: Rollover-count yo'q (Q34), auto-close so'rovi yo'q.

**15.40  🟡 qisman**  — ❓ Q40 (v2). Kuzatuvchi roli nima (ko'radi va izoh yozadi, holatni o'zgartira olmaydi)?
- Siz: Ko'radi va izoh yozadi, lekin holatni o'zgartira olmaydi
- Isbot: kanban_observers jadvali BOR (4 qator); getObservers/addObserver/removeObserver endpoint JONLI (kanban-cards.controller.ts:294-314). Lekin 'faqat-o'qish' huquq-cheklovi kod darajasida tekshirilmaydi (rol-guard yo'q).

**15.41  🟡 qisman**  — ❓ Q41 (v2). Kuzatuvchini kim qo'shadi (yaratuvchi yoki mas'ul boshliq)?
- Siz: Yaratuvchi yoki mas'ul boshliq qo'shadi — nazorat
- Isbot: addObserver endpoint bor (kanban-cards.controller.ts:300), lekin kim qo'sha oladi degan huquq-tekshiruv yo'q — har rol qo'sha oladi (@Roles employee+).

**15.42  🟡 qisman**  — ❓ Q42 (v2). Kuzatuvchiga qaysi o'zgarishlar haqida xabar (faqat muhimlari: yopildi/kechikdi/eskalatsiya)?
- Siz: Faqat muhim hodisalar: yopildi, kechikdi, eskalatsiya
- Isbot: kanban_notifications jadvali BOR; accept/complete'da egasiga notification yoziladi (drizzle-kanban-cards.repo.ts:212,259). Lekin kuzatuvchiga maxsus filtrlangan xabar oqimi yo'q.

**15.43  ❌ yo'q**  — ❓ Q43 (v2). Avtomatik kuzatuvchi (boshliq o'z-o'zidan kuzatuvchi)?
- Siz: Ha, bevosita boshliq avtomatik kuzatuvchi (xabar oqimini boshqaradi)
- Isbot: Grep autoObserver/manager.*observer = 0 natija. Boshliqni avtomatik observer qiladigan logika yo'q.

**15.44  ❌ yo'q**  — ❓ Q44 (v2). Kuzatuvchi sonining chegarasi (ko'pi bilan 5)?
- Siz: Ko'pi bilan 5 kuzatuvchi — yetarli va toza
- Isbot: addObserver'da soni-chegara tekshiruvi yo'q (drizzle-kanban-cards.repo.ts addWatcher/observer — limit yo'q).

**15.45  ❌ yo'q**  — ❓ Q45 (v2). Kuzatuvchi maxfiy vazifani ko'ra oladimi (faqat tasdiqlangan, qolganlarga ko'rinmaydi)?
- Siz: Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi, qolganlarga ko'rinmaydi
- Isbot: kanban_cards'da maxfiylik/confidential ustuni yo'q; maxfiy-vazifa ko'rinish-cheklovi yo'q.

**15.46  ❌ yo'q**  — ❓ Q46 (v2). Kuzatuvchining @eslatma (mention) qilishi (@ bilan chaqirilganga xabar)?
- Siz: Ha, @ bilan chaqirilgan odamga xabar boradi
- Isbot: addComment (drizzle-kanban-cards.repo.ts:131) izohni saqlaydi, lekin @mention parser/xabar yuborish logikasi yo'q.

**15.47  ❌ yo'q**  — ❓ Q47 (v2). Vazifaning majburiy maydonlari (sarlavha+mas'ul+muddat+kategoriya majburiy)?
- Siz: Sarlavha+mas'ul+muddat+kategoriya majburiy; izoh ixtiyoriy
- Isbot: createCardFlat: title default 'Yangi vazifa', owner/due_date/kategoriya majburiy emas (drizzle-kanban-cards.repo.ts:176-188); KanbanCardCreateSchema barchasi .optional() (kanban-cards.controller.ts:36-44). Kategoriya ustuni umuman yo'q.

**15.48  ✅ bor**  — ❓ Q48 (v2). Bitta vazifaga ko'p mas'ulmi/bitta (bitta asosiy, qolganlar yordamchi/kuzatuvchi)?
- Siz: Bitta asosiy mas'ul, qolganlar yordamchi/kuzatuvchi
- Isbot: owner_user_id (asosiy) + kanban_co_executors (yordamchi) + kanban_observers (kuzatuvchi) jadvallar BOR; co-executor endpoint JONLI (kanban-cards.controller.ts:318-338). Model egasi vizyoniga mos.

**15.49  🟡 qisman**  — ❓ Q49 (v2). Vazifani boshqa odamga o'tkazish (sabab yoziladi, 'X dan Y ga o'tdi' tarixda)?
- Siz: O'tkazishda sabab yoziladi, 'X dan Y ga o'tdi' tarixda qoladi
- Isbot: assignCard endpoint owner_user_id'ni o'zgartiradi (kanban-cards.controller.ts:169-180), lekin sabab MAJBURIY emas va 'X→Y' reassign-tarix yozuvi yo'q.

**15.50  🟡 qisman**  — ❓ Q50 (v2). Kichik vazifalar (checklist; hammasi belgilanmaguncha yopilmaydi)?
- Siz: Vazifa ichida checklist; hammasi belgilanmaguncha yopilmaydi
- Isbot: kanban_checklists + kanban_checklist_items jadvallar BOR; checklist controller JONLI (kanban-checklist.controller.ts, toggleChecklistItem). Lekin 'hammasi belgilanmaguncha yopilmaydi' guard completeCard'da yo'q (drizzle-kanban-cards.repo.ts:226).

**15.51  🟡 qisman**  — ❓ Q51 (v2). Vazifani ishlab chiqarish buyurtmasiga bog'lash (ixtiyoriy buyurtma/stanok/mijoz)?
- Siz: Ixtiyoriy ravishda buyurtma/stanok/mijozga bog'lanadi
- Isbot: kanban_cards.related_type + related_id ustunlari BOR (schema-kanban.ts:39-40); OrderCreatedKanbanHandler buyurtmadan karta yaratadi (order-created-kanban.handler.ts). Lekin stanok/mijoz alohida bog'lanish UI/validatsiyasi yo'q.

**15.52  🟡 qisman**  — ❓ Q52 (v2). Bekor qilingan vazifa holati (alohida 'Bekor qilindi', sabab majburiy)?
- Siz: Alohida 'Bekor qilindi' holati, sabab majburiy — toza hisob
- Isbot: OrderCancelled handler kartani 'bekor/cancel' ustuniga ko'chiradi + izoh qo'shadi (kanban-cards.repo.ts:213-268). Lekin alohida status-enum/'cancel' endpoint + sabab-majburiy guard yo'q.

**15.53  🟡 qisman**  — ❓ Q53 (v2). Vazifa izohlari va fayl biriktirish (rasm+fayl+ovozli izoh)?
- Siz: Rasm + fayl + ovozli izoh biriktirsa bo'ladi — to'liq dalil
- Isbot: kanban_files + kanban_result_files + task_chat_message_files jadvallar BOR; fayl-biriktirish endpoint JONLI (kanban-cards.controller.ts:243-262, kanban-card-files.controller.ts). Lekin 'ovozli izoh' (audio) maxsus qo'llab-quvvati ko'rinmaydi.

**15.54  ❌ yo'q**  — ❓ Q54 (v2). Vazifa ko'rinishi (xodim o'zi+bo'lim, boshliq butun bo'lim, yuqori daraja yuqoridan — bosqichli)?
- Siz: Bosqichli ko'rinish: xodim/bo'lim/boshliq/yuqori daraja
- Isbot: getAllCards barcha kartalarni LIMIT 500 qaytaradi (kanban-cards.controller.ts:119-128), foydalanuvchi/bo'lim/daraja bo'yicha ko'rinish-filtri (scope) yo'q. @Roles employee hammasini ko'radi.

**15.55  🟡 qisman**  — ❓ Q55 (v2). Telegramdan vazifa yaratish/yopish (ERP bilan sinxron)?
- Siz: Telegramdan ochish/yopish/izoh, ERP bilan sinxron
- Isbot: kanban.handler.ts FAQAT bildirishnoma yuboradi (onTaskAssigned/onTaskDueSoon); kanban_cards'da telegram_message_id/telegram_chat_id ustunlari bor, lekin Telegramdan karta YARATISH/YOPISH (inbound bot command) handleri yo'q.

**15.56  🟡 qisman**  — ❓ K1 (kitob). НО-3 kun-yakuni hisoboti avtomat takrorlanuvchi kunlik vazifaga aylanadimi (17:30)?
- Siz: Har ish kuni 17:30 da НО-3 kun-yakuni hisoboti vazifasi avtomat tug'iladi
- Isbot: KanbanRecurringCron umumiy takror-mexanizmi bor (kanban-recurring.cron.ts), lekin НО-3 17:30 maxsus hisobot-vazifasi seed/cron'i yo'q. daily-report.service.ts HR'da alohida bor, kanban'ga ulanmagan.

**15.57  ❌ yo'q**  — ❓ K2 (kitob). Aniqlangan kamchilik avtomat 'tuzatish vazifasi'ga aylanadimi (aybdor+boshliq, 24h)?
- Siz: Kamchilik → aybdor+boshliq savatiga 'izoh ber/tuzat' vazifasi, 24h muddat
- Isbot: Kamchilik→kanban-vazifa avtomatik tug'ilish event-handleri yo'q (grep fromDeficiency = 0).

**15.58  ❌ yo'q**  — ❓ K3 (kitob). Kun-tartibi vaqt-bloklarini (tanaffus/tushlik/namoz) shaxsiy dasturda 'band slot' himoyalashmi?
- Siz: Tanaffus/tushlik/namoz 'qotirilgan band slot', ustiga vazifa qo'yilsa ogohlantiradi
- Isbot: Shaxsiy dastur sahifasi umuman yo'q (Q18), fixed-slot himoyasi mavjud emas.

**15.59  ❌ yo'q**  — ❓ K4 (kitob). 3-smenalik tushlik smena bo'yicha avtomat slot + 'keyingi smenaga o'tkaziladigan ish' so'raydimi?
- Siz: Smena bo'yicha tushlik avtomat dasturga, smena oxirida ish-o'tkazish so'raladi
- Isbot: Shaxsiy dastur + smena-slot logikasi yo'q (personal program moduli mavjud emas).

**15.60  ❌ yo'q**  — ❓ K5 (kitob). Ta'tilda vazifa topshirish (handover) majburiy bosqichmi (o'rinbosar tanlanmaguncha ta'til tasdiqlanmaydi)?
- Siz: Ta'til oldidan ochiq vazifalar, har biriga o'rinbosar tanlanmaguncha tasdiqlanmaydi
- Isbot: vacation-handover jadval/logikasi yo'q (q.cjs: %vacation%hand% topilmadi); ta'til-so'rovi HR'da bor lekin kanban-handover guard yo'q.

**15.61  ❌ yo'q**  — ❓ K6 (kitob). O'rinbosarga o'tgan vazifa ta'til tugagach asl egaga qaytadimi (vaqtinchalik o'tkazma)?
- Siz: Vaqtinchalik: ta'til davrida o'rinbosar mas'ul, qaytganda avtomat asl egaga qaytadi
- Isbot: Vaqtinchalik-o'tkazma+qaytarish cron yo'q (handover.return = 0 natija).

**15.62  🟡 qisman**  — ❓ K7 (kitob). НО mas'ul-shaxs roli bo'yicha avtomat biriktiruv (jarayon shabloni → НО-1/РД-4/ТХ avtomat)?
- Siz: Jarayon shabloni tanlansa, har qadam НО rollarga avtomat biriktiriladi
- Isbot: task_templates + kanban_templates jadvallar BOR (kanban-templates.seed.ts mavjud); flow/round-robin assignment bor (kanban-core.controller.ts:55 createFlow assignmentType). Lekin НО-rol→avtomat biriktiruv master-data mapping'i yo'q.

**15.63  🟡 qisman**  — ❓ K8 (kitob). Vazifaga standart norma-vaqt (НО jadvalidagi 30/20 daqiqa) + norma/fakt solishtirish?
- Siz: Har vazifa-turiga norma-vaqt master-data'da, bajarilgach norma/fakt solishtiriladi
- Isbot: kanban_cards.estimated_time + kanban_time_tracks.target_minutes/duration_minutes ustunlari BOR (schema-kanban.ts:140-141). Lekin vazifa-TURI bo'yicha norma master-data + avtomat solishtirish hisoboti yo'q (norm_time jadval yo'q).

**15.64  ❌ yo'q**  — ❓ K9 (kitob). Jarayon-shablon zanjir vazifa (oldingi yopilmaguncha keyingisi qulflangan)?
- Siz: Shablon = bog'langan qadamlar; oldingi yopilmaguncha keyingisi qulflangan, yopilsa ochiladi
- Isbot: kanban_cards.parent_card_id ustuni bor (sub-task), lekin 'oldingi yopilmaguncha qulflangan' zanjir-gate logikasi yo'q (grep template.chain = 0).

**15.65  ❌ yo'q**  — ❓ K10 (kitob). Mentor (Мураббий) kuzatuv-vazifasi (o'qish-muddati bilan, oxirida 'tayyormi/yo'q' baho)?
- Siz: Mentorga 'shogird kuzatuvi' vazifasi o'qish-muddati bilan, oxirida baho so'raladi
- Isbot: Mentor-watch kanban vazifasi tug'ilish logikasi yo'q (grep mentorWatch = 0). HR adaptatsiyada alohida bo'lishi mumkin, kanban'ga ulanmagan.

**15.66  ❌ yo'q**  — ❓ K11 (kitob). Sinov muddati → qaror taymeri (3 kun qolganda 'sinov yakuni qarori' vazifasi)?
- Siz: Sinov tugashiga 3 kun qolganda НО-1/boshliqqa 'sinov yakuni qarori' vazifasi
- Isbot: Sinov-muddati→kanban qaror-vazifa cron'i yo'q (probationDecision = 0 natija).

**15.67  🟡 qisman**  — ❓ K12 (kitob). Ishlab chiqarish buyurtmasi Kanban kartaga aylanadimi (Дата готовности=muddat, holat ustun bo'ylab)?
- Siz: Har buyurtma = ishlab chiqarish taxtasida karta, holat ustun bo'ylab siljiydi
- Isbot: OrderCreatedKanbanHandler buyurtmadan kanban karta yaratadi (order-created-kanban.handler.ts JONLI); related_type/related_id bog'lanadi. Lekin Дата готовности→due_date va to'liq holat-oqim ulanishi to'liq emas, jonli data yo'q (cards=2).

**15.68  ❌ yo'q**  — ❓ K13 (kitob). Texnologik bosqichlar (Флексо/Высечка/Резка...) taxta ustuni sifatida?
- Siz: Taxta ustunlari = real texnologik bosqichlar, karta bosqichma-bosqich o'tadi
- Isbot: kanban_columns'da texnologik-bosqich seed yo'q (jonli ustunlar = test-axlat 'as/salom/SADSD'). Texnologik marshrut MES'da alohida, kanban ustunlariga bog'lanmagan.

**15.69  ❌ yo'q**  — ❓ K14 (kitob). Тираж + bajarilgan/qolgan progress kartada (progress-bar 7000/10000)?
- Siz: Kartada tiraj + progress-bar (7000/10000) — aniq holat
- Isbot: kanban_cards'da tiraj/qty/progress ustuni yo'q (q.cjs column list — title/description/priority/due_date... bor, miqdor yo'q). Progress-bar ma'lumoti saqlanmaydi.

**15.70  ✅ bor**  — ❓ Kuzatuvchi roli: ko'radi va izoh yozadi, lekin holatni o'zgartira olmaydimi?
- Siz: Kuzatuvchi aralashmasdan ko'radi+izoh yozadi, status o'zgartira olmaydi (EP-KAN-070, Q40)
- Isbot: kanban_observers jadval (4 qator) + GET/POST/DELETE cards/:id/observers (kanban-cards.controller.ts:294-314); observer holat o'zgartirish endpointi yo'q (faqat read+izoh)

**15.71  🟡 qisman**  — ❓ Kuzatuvchini kim qo'shadi (yaratuvchi/mas'ul boshliq)?
- Siz: Yaratuvchi yoki mas'ul boshliq qo'shadi (EP-KAN-071, Q41)
- Isbot: POST cards/:id/observers addObserver(svc) JONLI ishlaydi, lekin kim qo'sha olishi (yaratuvchi/boshliq) bo'yicha RBAC tekshiruvi kodda yo'q — har kim qo'sha oladi

**15.72  ❌ yo'q**  — ❓ Kuzatuvchiga qaysi o'zgarishlar haqida xabar boradi (faqat muhimlari)?
- Siz: Faqat muhim hodisalar: yopildi/kechikdi/eskalatsiya (EP-KAN-072, Q42)
- Isbot: kanban_notifications bor (status_changed yozadi completeCard'da), lekin kuzatuvchiga selektiv (faqat muhim hodisa) xabar oqimi sozlamasi/filtri kodda yo'q

**15.73  ❌ yo'q**  — ❓ Avtomatik kuzatuvchi: boshliq o'z-o'zidan kuzatuvchi bo'ladimi?
- Siz: Bevosita boshliq avtomat kuzatuvchi (manager_id zanjiri orqali) (EP-KAN-073, Q43)
- Isbot: addObserver faqat qo'lda (userId beriladi); manager_id zanjiridan avtomat kuzatuvchi qo'shish logikasi kodda umuman yo'q

**15.74  ❌ yo'q**  — ❓ Kuzatuvchi sonining chegarasi (ko'pi bilan 5)?
- Siz: Ko'pi bilan 5 kuzatuvchi (EP-KAN-074, Q44)
- Isbot: addObserver'da son chegarasi (max 5) validatsiyasi yo'q; kanban_observers'ga cheksiz qo'shsa bo'ladi

**15.75  ❌ yo'q**  — ❓ Kuzatuvchi maxfiy vazifani ko'ra oladimi (faqat tasdiqlangan)?
- Siz: Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi, qolganlarga ko'rinmaydi (EP-KAN-075, Q45)
- Isbot: kanban_cards'da confidential/maxfiy/visibility ustuni YO'Q (q.cjs information_schema: faqat parent_card_id topildi); maxfiylik mexanizmi umuman qurilmagan

**15.76  ❌ yo'q**  — ❓ Kuzatuvchining @eslatma (mention) qilishi xabar yuboradimi?
- Siz: @ bilan chaqirilgan odamga xabar boradi (EP-KAN-076, Q46)
- Isbot: kanban_card_comments ustunlari = id/card_id/user_id/content/created_at (q.cjs); mention/mentioned_user ustuni yo'q, izoh faqat oddiy text

**15.77  🟡 qisman**  — ❓ Vazifaning majburiy maydonlari (sarlavha+mas'ul+muddat+kategoriya)?
- Siz: Sarlavha+mas'ul+muddat+kategoriya majburiy, izoh ixtiyoriy (EP-KAN-077, Q47)
- Isbot: KanbanCardCreateSchema (kanban.dto.ts) title talab qiladi, lekin assigned/due_date/kategoriya majburiy emas; kategoriya ustuni kanban_cards'da umuman yo'q (faqat tags)

**15.78  ✅ bor**  — ❓ Bitta vazifaga bitta asosiy mas'ul + yordamchi/kuzatuvchimi?
- Siz: Bitta asosiy mas'ul, qolganlar yordamchi/kuzatuvchi (EP-KAN-078, Q48)
- Isbot: owner_user_id (asosiy) + kanban_co_executors (hamijrochi) + kanban_observers (kuzatuvchi) ajratilgan; addCoExecutor/addObserver endpointlari (kanban-cards.controller.ts:318-338)

**15.79  🟡 qisman**  — ❓ Vazifani boshqa odamga o'tkazish: sabab+tarix saqlanadimi?
- Siz: O'tkazishda sabab yoziladi, 'X dan Y ga o'tdi' tarixda qoladi (EP-KAN-079, Q49)
- Isbot: PATCH :id/assign owner_user_id'ni almashtiradi (kanban-cards.controller.ts:165-180), lekin sabab maydoni va o'tkazish-tarixi (X→Y) yozilmaydi

**15.80  🟡 qisman**  — ❓ Kichik vazifalar (checklist): hammasi belgilanmaguncha yopilmaydimi?
- Siz: Vazifa ichida checklist; hammasi belgilanmaguncha yopilmaydi (EP-KAN-080, Q50)
- Isbot: kanban_card_checklists+kanban_card_checklist_items jadval + to'liq CRUD+toggle (kanban-checklist.controller.ts:37-99); lekin 'hammasi belgilanmaguncha yopilmaydi' gate completeCard'da yo'q

**15.81  🟡 qisman**  — ❓ Vazifa bilan ishlab chiqarish buyurtmasini/stanok/mijozni bog'lash?
- Siz: Ixtiyoriy buyurtma/stanok/mijozga bog'lanadi (EP-KAN-081, Q51)
- Isbot: kanban_cards.related_type+related_id ustunlari bor (generik bog'lanish); order-created handler buyurtmaga karta yaratadi, lekin jonli datada related_type=null (ishlatilmayapti)

**15.82  🟡 qisman**  — ❓ Bekor qilingan vazifa alohida holatmi (yopilgandan farqi)?
- Siz: Alohida 'Bekor qilindi' holati, sabab majburiy (EP-KAN-082, Q52)
- Isbot: moveOrderCardToCancelled buyurtma kartani 'bekor/cancel' ustuniga ko'chiradi (kanban-cards.repo.ts:217), lekin alohida status-enum 'cancelled' + majburiy sabab umumiy kartalar uchun yo'q (ustun nomi orqali)

**15.83  🟡 qisman**  — ❓ Vazifa izohlari va fayl (rasm/ovozli) biriktirish?
- Siz: Rasm+fayl+ovozli izoh biriktirsa bo'ladi (EP-KAN-083, Q53)
- Isbot: kanban_files + chat-message-files endpointlari JONLI (cards/:id/files, chat-messages/:id/files); rasm/fayl bor, lekin ovozli izoh maxsus qo'llab-quvvatlash yo'q (generik fayl sifatida)

**15.84  ❌ yo'q**  — ❓ Vazifa ko'rinishi: bosqichli (xodim o'zi+bo'lim, boshliq butun bo'lim)?
- Siz: Bosqichli ko'rinish: o'zi+bo'lim/boshliq butun bo'lim/yuqori daraja yuqoridan (EP-KAN-084, Q54)
- Isbot: kanban_cards'da visibility/scope/org-daraja RBAC ustuni yo'q; getCards filtri org-strukturaga (manager_id) bog'lanmagan — bosqichli ko'rinish qurilmagan

**15.85  ❌ yo'q**  — ❓ Telegramdan vazifa yaratish/yopish, ERP bilan sinxron?
- Siz: Telegramdan ochish/yopish/izoh, ERP bilan sinxron (EP-KAN-085, Q55)
- Isbot: kanban_cards.telegram_message_id/telegram_chat_id ustunlari bor lekin BO'SH (jonli data null); kanban modulida telegram-ingest handler yo'q (CC'da cc-bot bor, lekin Kanban'ga ulanmagan)

**15.86  ❌ yo'q**  — ❓ НО-3 kun-yakuni hisoboti avtomat takrorlanuvchi kunlik vazifa bo'ladimi?
- Siz: Har ish kuni 17:30 da 'НО-3 kun-yakuni hisoboti' vazifasi avtomat tug'iladi (EP-KAN-086, K1)
- Isbot: kanban modulida cron umuman yo'q (grep @Cron=0); recurrence_pattern ustun bor lekin НО-3 hisobot-shabloni yoki rejalashtirgich qurilmagan

**15.87  ❌ yo'q**  — ❓ Aniqlangan kamchilik → avtomat 'tuzatish vazifasi' (24h muddat)?
- Siz: Kamchilik → aybdor+boshliq savatiga 'tuzat' vazifasi, 24h muddat (EP-KAN-087, K2)
- Isbot: kun-tartibi nazorati / kamchilik→vazifa event yoki listener kanban modulida yo'q

**15.88  ❌ yo'q**  — ❓ Kun-tartibi vaqt-bloklari (tushlik/namoz) shaxsiy dasturda 'band' ko'rinadimi?
- Siz: Tanaffus/tushlik/namoz qotirilgan band-slot, ustiga vazifa qo'yilsa ogohlantiradi (EP-KAN-088, K3)
- Isbot: Shaxsiy dastur (personal program) BE jadvali/servisi topilmadi; qotirilgan-slot logikasi va HR smena-jadval bog'lanishi qurilmagan

**15.89  ❌ yo'q**  — ❓ 3-smenalik tushlik smena bo'yicha avtomat slotga tushadimi?
- Siz: Smena bo'yicha tushlik avtomat dasturga + 'keyingi smenaga o'tkaziladigan ish' so'raladi (EP-KAN-089, K4)
- Isbot: smena-bog'liq tushlik slot + smena-handover so'rov logikasi kodda yo'q; personal program qurilmagan

**15.90  ❌ yo'q**  — ❓ Ta'tilda vazifa topshirish (handover) majburiy bosqichmi?
- Siz: Ta'til oldidan ochiq vazifalarga o'rinbosar tanlanmaguncha ta'til tasdiqlanmaydi (EP-KAN-090, K5)
- Isbot: ta'til-handover (HR ta'til so'rovi + Kanban ochiq vazifalar bog'lanishi) kodda yo'q; HR ta'til API'ga Kanban bog'lanmagan

**15.91  ❌ yo'q**  — ❓ O'rinbosarga o'tgan vazifa ta'til tugagach asl egasiga qaytadimi?
- Siz: Vaqtinchalik o'tkazma: qaytganda avtomat asl egaga qaytadi, tarixda ko'rinadi (EP-KAN-091, K6)
- Isbot: vaqtinchalik-o'tkazma (delegation+avtomat-qaytarish) mexanizmi kanban modulida yo'q; cron yo'q

**15.92  ❌ yo'q**  — ❓ НО mas'ul-shaxs roli bo'yicha avtomat biriktiruv (jarayon shabloni)?
- Siz: Shablon tanlansa har qadam НО-1/РД-4/ТХ ga avtomat biriktiriladi (EP-KAN-092, K7)
- Isbot: rol-asosli avtomat biriktiruv shabloni yo'q; robot-dvigatel 'assign' actioni bor lekin НО-rol master-datasi va qoida-asosli biriktiruv qurilmagan

**15.93  ❌ yo'q**  — ❓ Vazifaga standart norma-vaqt (НО jadvalidagi 30/20 daqiqa)?
- Siz: Har vazifa-turiga norma-vaqt master-data, bajarilgach norma/fakt solishtiriladi (EP-KAN-093, K8)
- Isbot: kanban_cards.estimated_time ustun bor (qo'lda kiritma), lekin vazifa-turi bo'yicha NORMA-vaqt master-data jadvali va norma/fakt solishtirish yo'q

**15.94  ❌ yo'q**  — ❓ Jarayon-shablon (НО-1...РД-4 ketma-ketligi) = qulflangan zanjir vazifa?
- Siz: Shablon=bog'langan qadamlar, oldingi yopilmaguncha keyingisi qulflangan (EP-KAN-094, K9)
- Isbot: kanban_templates/kanban_flows jadvallar bor, lekin 'oldingi yopilmaguncha keyingi qulflangan' zanjir-bog'liqlik (dependency-gate) logikasi yo'q; parent_card_id faqat ierarxiya

**15.95  ❌ yo'q**  — ❓ Mentor (Мураббий) shogird kuzatuv-vazifasi tug'iladimi?
- Siz: Mentorga 'shogird kuzatuvi' vazifasi o'qish-muddati bilan, oxirida baho so'raladi (EP-KAN-095, K10)
- Isbot: mentor→shogird kuzatuv-vazifa + LMS o'qish-muddati bog'lanishi kanban modulida yo'q

**15.96  ❌ yo'q**  — ❓ Sinov muddati tugashidan oldin 'qaror' vazifasi avtomat tug'iladimi?
- Siz: Sinov tugashiga 3 kun qolganda НО-1/boshliqqa 'sinov yakuni qarori' vazifasi (EP-KAN-096, K11)
- Isbot: sinov-muddat taymeri + avtomat qaror-vazifa krони kanban modulida yo'q (cron=0); HR sinov-sanasiga bog'lanmagan

**15.97  🟡 qisman**  — ❓ Ishlab chiqarish buyurtmasi Kanban kartaga aylanadimi?
- Siz: Har buyurtma = ishlab chiqarish taxtasida karta, Дата готовности=muddat (EP-KAN-097, K12)
- Isbot: OrderCreatedKanbanHandler → createKanbanForOrder buyurtmadan karta yaratadi (order-created-kanban.handler.ts:29-35); SD create-order.handler eventни emit qiladi. LEKIN jonli karta-datada related_type=null, taxta-ustunlar bosqich emas (axlat-nom)

**15.98  ❌ yo'q**  — ❓ Texnologik bosqichlar (Направление) taxta ustuni bo'ladimi?
- Siz: Taxta ustunlari=real bosqichlar (Флексо/Высечка/Резка/Ламинация...), karta bosqichma-bosqich (EP-KAN-098, K13)
- Isbot: kanban_columns jonli nomlari = test axlat ('as','salom','SADSD','SDSD'); texnologik-bosqich ustun-shabloni seed/qurilmagan

**15.99  ❌ yo'q**  — ❓ Тираж + bajarilgan/qolgan progress kartada ko'rinadimi?
- Siz: Kartada tiraj + progress-bar (7000/10000) (EP-KAN-099, K14)
- Isbot: kanban_cards'da tiraj/quantity/progress ustunlari yo'q (q.cjs ustun ro'yxati); progress-bar datasi qurilmagan

**15.100  ❌ yo'q**  — ❓ 'Сумма осталось' (qoldiq to'lov) buyurtma kartasida ko'rinadimi?
- Siz: Kartada to'lov holati, qoldiq bo'lsa Упаковка/Yetkazishda ogohlantiradi (EP-KAN-100, K15)
- Isbot: kanban_cards'da to'lov/payment_balance ustuni yo'q; moliya-qoldiq karta yuzida ko'rsatish va yetkazish-blok qurilmagan

**15.101  ❌ yo'q**  — ❓ Operator-stansiya biriktiruvi kartadan avtomat ko'rinadimi?
- Siz: Karta joriy bosqich operatorini stansiya-operator master-datadan avtomat ko'rsatadi (EP-KAN-101, K16)
- Isbot: stansiya-operator master-data va bosqich-bo'yicha avtomat operator ko'rsatish kodda yo'q; owner_user_id faqat qo'lda biriktiriladi

**15.102  🟡 qisman**  — ❓ Yordamchi (Ёрдамчи) roli kartada hissa-ulush bilan ajraladimi?
- Siz: Kartada ijrochi+yordamchi alohida rol, har biriga hissa ulushi (adolatli GSD) (EP-KAN-102, K17)
- Isbot: kanban_co_executors jadval+endpoint hamijrochini ajratadi (cards/:id/co-executors), LEKIN hissa-ulush (% contribution) maydoni va GSD-ga ulanish yo'q

**15.103  ❌ yo'q**  — ❓ Заявка (material so'rovi) → avtomat ta'minot vazifasi?
- Siz: Печать bosqichida qog'oz yo'q bo'lsa avtomat ta'minot savatiga Заявка vazifasi (EP-KAN-103, K18)
- Isbot: material yetishmovchilik→avtomat ta'minot vazifa eventi kanban modulida yo'q; ombor (warehouse_stock) bog'lanmagan

**15.104  🟡 qisman**  — ❓ Buyurtma bekor (Отменен) qilinganda kartaga nima bo'ladi?
- Siz: 'Отменен' alohida holat, sabab majburiy, arxivga ketadi lekin hisobotda ko'rinadi (EP-KAN-104, K19)
- Isbot: OrderCancelledKanbanHandler → moveOrderCardToCancelled kartani 'bekor/cancel' ustuniga ko'chiradi + cancel-note qo'shadi (kanban-cards.repo.ts:217-269); LEKIN majburiy sabab maydoni emas (faqat orderNumber note)

**15.105  ❌ yo'q**  — ❓ Дата готовности kechiksa savdoga+boshliqqa avtomat xabarmi?
- Siz: Дата готовности o'tsa ishlab chiqarish boshlig'i+savdo menejeriga avtomat xabar (EP-KAN-105, K20)
- Isbot: muddat-kechikish eskalatsiya krони yo'q (cron=0); overdue faqat read-hisobot (drizzle-kanban-stats.repo.ts:37 COUNT FILTER), aktiv xabar/eskalatsiya yo'q

**15.106  ❌ yo'q**  — ❓ 'Примечание' (maxsus shart) karta yuzida badge bo'lib turadimi?
- Siz: Maxsus shart karta yuzida badge, bosqichdan o'tishda tasdiqlatadi (EP-KAN-106, K21)
- Isbot: kanban_cards'da примечание/special_note/badge ustuni yo'q (tags umumiy); bosqich-o'tish tasdiqlash logikasi yo'q

**15.107  ❌ yo'q**  — ❓ Korporativ raqam berish (НО-2) jarayon-shabloni bo'ladimi?
- Siz: 'Korporativ raqam berish' shabloni: raqam ber→НО-2 yo'riqnoma→Инспекция (EP-KAN-107, K22)
- Isbot: НО-2/Инспекция jarayon-shabloni kanban_templates seed'ida yo'q; jarayon-zanjir shablon mexanizmi qurilmagan

**15.108  ❌ yo'q**  — ❓ Vazifa 'лавозим папкаси' (lavozim-karta)ga bog'lanadimi?
- Siz: Vazifa avval lavozim-kartaga, keyin xodimga; xodim ketsa vazifa kartada qoladi (EP-KAN-108, K23)
- Isbot: kanban_cards'da card_id/position-link ustuni YO'Q (q.cjs); faqat owner_user_id (xodim); karta-markazli model qurilmagan

**15.109  ❌ yo'q**  — ❓ Vazifa toifasi seriya bo'yicha (Компания/Ташкилот/Производство)?
- Siz: Vazifa toifasi master-data, filtr+hisobot shu bo'yicha (EP-KAN-109, K24)
- Isbot: kanban_cards'da toifa/category/series ustuni yo'q; faqat tags (erkin). Toifa master-data jadvali yo'q

**15.110  ❌ yo'q**  — ❓ Оргполитика 'Харакатлар детализацияси' → vazifa-shablon manbaimi?
- Siz: Har оргполитика→vazifa-shablon, siyosat e'lon qilinganda faollashadi (EP-KAN-110, K25)
- Isbot: оргполитика→vazifa-shablon konvertatsiya/listener kodda yo'q; siyosat→ijro yopiq oqimi qurilmagan

**15.111  ❌ yo'q**  — ❓ Vazifaga 'Тасаввурдаги мукаммал манзара' (kutilgan natija) maydoni?
- Siz: Har vazifaga 'kutilgan natija' maydoni, tasdiqlovchi shunga qarab qabul qiladi (EP-KAN-111, K26)
- Isbot: kanban_cards'da expected_outcome/kutilgan-natija ustuni yo'q; faqat description+completion_report

**15.112  ❌ yo'q**  — ❓ Smena oxirida tugamagan buyurtma keyingi smenaga estafeta qilinadimi?
- Siz: Tugamagan kartalar keyingi smenaga o'tkazma ro'yxati, qabul qiluvchi tasdiqlaydi (EP-KAN-112, K27)
- Isbot: smena-estafeta (shift-relay) krони/eventi yo'q (cron=0); MES smena-handover Kanban'ga ulanmagan

**15.113  ❌ yo'q**  — ❓ Brak/qayta ishlash (Резка/Высечка xatosi) vazifaga aylanadimi?
- Siz: Bosqichda brak: miqdor+sabab+'qayta ishlash' vazifasi, GSD/sifatga ulanadi (EP-KAN-113, K28)
- Isbot: brak→rework vazifa eventi/listener kanban modulida yo'q; QC moduli bilan brak-bog'lanish qurilmagan

**15.114  ❌ yo'q**  — ❓ Stansiya navbati (ochered) kartalar Дата готовности+ustuvorlik bo'yicha saralanadimi?
- Siz: Har stansiya ustunida kartalar Дата готовности+ustuvorlik bo'yicha avtomat saralanadi (EP-KAN-114, K29)
- Isbot: kanban_cards.sort_order qo'lda; stansiya-navbat avtomat saralash (Дата готовности+priority) logikasi yo'q; stansiya-ustun tushunchasi yo'q

**15.115  ❌ yo'q**  — ❓ 'Академияга' (ichki) buyurtmalar alohida oqimmi (tashqi ustuvor)?
- Siz: Ichki/tashqi belgi bilan ajraladi, tashqi to'lovli ustuvor (EP-KAN-115, K30)
- Isbot: ichki/tashqi buyurtma belgisi (internal_flag) ustuni va ustuvorlik logikasi kodda yo'q

**15.116  ❌ yo'q**  — ❓ Kun boshida 'bugungi reja' boshliqqa ko'rsatiladimi/tasdiqlatadimi?
- Siz: Ertalab xodim bugungi rejani tasdiqlaydi, boshliq ko'radi (EP-KAN-116, K31)
- Isbot: shaxsiy dastur (personal program) BE qurilmagan; kun-boshi reja boshliqqa ko'rsatish/tasdiq oqimi yo'q

**15.117  ❌ yo'q**  — ❓ Deadline cho'zish (muddat surish) boshliq tasdig'i bilanmi?
- Siz: Boshliq bergan vazifa muddatini surish boshliq tasdig'i bilan, o'z vazifasini o'zi suradi (EP-KAN-117, K32)
- Isbot: updateCard due_date'ni o'zgartiradi, lekin deadline-cho'zish tasdiq darvozasi (kim bergan vazifa→boshliq tasdig'i) + sabab logikasi yo'q

**15.118  ❌ yo'q**  — ❓ Vazifani 'qaytarish' (men bajarmayman) sabab bilan mumkinmi?
- Siz: Qaytarish mumkin (sabab majburiy), bergan odamga qaytadi (EP-KAN-118, K33)
- Isbot: vazifa-qaytarish (return-to-sender) endpointi/logikasi yo'q; accept bor lekin reject-with-reason→qaytarish yo'q

**15.119  🟡 qisman**  — ❓ Shoshilinch belgisini faqat boshliq qo'ya oladimi?
- Siz: 'Срочно' belgisini faqat boshliq/topshiriq beruvchi qo'yadi (EP-KAN-119, K34)
- Isbot: kanban_cards.priority ustuni (USER-DEFINED enum) bor, lekin priority-set'da 'faqat boshliq' RBAC tekshiruvi va kunlik shoshilinch limit kodda yo'q

**15.120  ❌ yo'q**  — ❓ Maxfiy vazifa (inspeksiya/qoidabuzarlik) faqat kim ko'radi?
- Siz: 'Maxfiy' belgisi: faqat beruvchi+ijrochi+boshliq ko'radi, taxtada ko'rinmaydi (EP-KAN-120, K35)
- Isbot: kanban_cards'da confidential/maxfiy ustuni yo'q (q.cjs); maxfiy-vazifa RBAC ko'rinish-filtri qurilmagan

**15.121  🟡 qisman**  — ❓ Vazifa-shablonga forma/blank (ariza/буйруқ/Заявка) biriktiriladimi?
- Siz: Shablon vazifaga kerakli forma biriktirilgan keladi (EP-KAN-121, K36)
- Isbot: kanban_files fayl biriktirish bor (har kartaga), lekin SHABLON-darajasida avtomat forma-namuna biriktirish (Заявка/ariza/buyruq) yo'q

**15.122  ❌ yo'q**  — ❓ Bosqich bog'liqligi (Ламинация Печать tugamasdan boshlanmaydi) ko'rsatiladimi?
- Siz: Karta 'X tugamaguncha bloklangan', X yopilsa avtomat ochiladi (EP-KAN-122, K37)
- Isbot: blocked_by/dependency ustuni va avtomat-ochilish logikasi kanban modulida yo'q (parent_card_id faqat ierarxiya, gate emas)

**15.123  🟡 qisman**  — ❓ Bajarilgach sifat-baho (1-5) НО tasdig'i bilan qo'yiladimi?
- Siz: Yopilishda ixtiyoriy sifat-baho (1-5)+izoh, GSD ga o'rtacha bo'lib ulanadi (EP-KAN-123, K38)
- Isbot: kanban_cards.rating ustuni + PUT cards/:id/rating endpoint JONLI (kanban-cards.controller.ts:135-146, jonli data rating=4); LEKIN GSD/KPI-ga o'rtacha bo'lib ulanish yo'q

**15.124  ❌ yo'q**  — ❓ Bo'lim taxtasining kunlik 'летучка' ko'rinishi (bir ekran) bormi?
- Siz: Taxtada 'летучка rejimi': bugungi+kechikkan+bloklar bir ekranda (EP-KAN-124, K39)
- Isbot: letuchka/standup maxsus rejim view'i yo'q; reports/overdue alohida hisobot bor lekin yig'ilish-rejimi birlashtirilgan ekran emas

**15.125  ❌ yo'q**  — ❓ @xabar vs @so'rov farqi (faqat o'qish ╳ vazifa tushadi)?
- Siz: Ikki xil: @xabar (o'qish) va @so'rov (savatga vazifa tushadi) (EP-KAN-125, K40)
- Isbot: kanban_card_comments faqat text (mention ustuni yo'q); @xabar/@so'rov farqi va so'rovdan vazifa tug'ilish logikasi qurilmagan

**15.126  ❌ yo'q**  — ❓ Hayfa/ogohlantirish (взыскание) yozma iz sifatida qoladimi?
- Siz: Hayfa=yozma iz (sabab+sana), takrori sanaladi, HR kartasiga ulanadi (EP-KAN-126, K41)
- Isbot: kanban modulida hayfa/disciplinary-record yozish yo'q; (HR'da discipline_records bo'lishi mumkin, lekin Kanban'dan ulanish/trigger yo'q)

**15.127  ❌ yo'q**  — ❓ Mijoz buyurtmasi o'zgargach (Тираж/muddat) karta avtomat yangilanadimi?
- Siz: Savdoda buyurtma o'zgarsa karta avtomat yangilanadi+operator ogohlantiriladi (EP-KAN-127, K42)
- Isbot: OrderChanged/OrderUpdated→karta-sync listeneri kanban modulida yo'q (faqat OrderCreated+OrderCancelled handlerlari bor)

**15.128  ❌ yo'q**  — ❓ Tayyor mahsulot (Упаковка) → avtomat ombor/yetkazish vazifasi?
- Siz: Упаковка yopilsa: ombor qabul+(to'lov to'liq bo'lsa) yetkazish vazifasi avtomat (EP-KAN-128, K43)
- Isbot: bosqich-yopilishi→ombor/yetkazish avtomat vazifa-zanjir eventi yo'q; WMS/delivery bilan bog'lanish qurilmagan

**15.129  ❌ yo'q**  — ❓ Karta rangi mahsulot turi bo'yicha (5х слой/гофра/картон) bo'ladimi?
- Siz: Karta mahsulot-turi bo'yicha rang/teg, taxtada tur bo'yicha filtr (EP-KAN-129, K44)
- Isbot: mahsulot-turi master-data va karta rang/teg bog'lanishi yo'q; tags erkin (mahsulot-turiga bog'lanmagan)

**15.130  ❌ yo'q**  — ❓ Qadam norma-vaqtdan oshsa (НО 30/20 daqiqa) eskalatsiya bo'ladimi?
- Siz: Qadam norma-vaqtdan oshsa avtomat boshliqqa ko'rinadi/eslatma (EP-KAN-130, K45)
- Isbot: norma-vaqt master-datasi yo'q + eskalatsiya krони yo'q (cron=0); qadam-darajasida vaqt-norma nazorati qurilmagan

**15.131  ❌ yo'q**  — ❓ Arxivdan takror muammo (naqsh) AI yordamida aniqlanadimi?
- Siz: Arxivdan takrorlanuvchi sabab/brak naqshlari oylik hisobotda AI bilan (EP-KAN-131, K46)
- Isbot: arxiv-naqsh AI-tahlil (pattern-detect) kanban modulida yo'q; arxiv faqat soft-delete (deleted_at), AI-analitika yo'q

**15.132  ❌ yo'q**  — ❓ Vazifa lavozimga (ism emas) beriladimi?
- Siz: Vazifa lavozim-kartaga, joriy egasi avtomat oladi; bo'sh karta bo'lsa boshliqqa (EP-KAN-132, K47)
- Isbot: vazifa faqat owner_user_id (xodim ID)ga biriktiriladi; lavozim-karta (position card) bog'lanish ustuni yo'q — karta-markazli vizyon qurilmagan

**15.133  ❌ yo'q**  — ❓ Stansiya kunlik norma — smenaviy plan-fakt ko'rsatiladimi?
- Siz: Har stansiyaga kunlik norma, taxtada 'bugun: 6000/8000' plan-fakt (EP-KAN-133, K48)
- Isbot: stansiya kunlik-norma master-data va plan-fakt taxta-ko'rinish yo'q (MES/OEE bog'lanmagan)

**15.134  🟡 qisman**  — ❓ Vazifa-vaqt logi (boshladim/tugatdim) normaga taqqoslanadimi?
- Siz: Ixtiyoriy boshladim/tugatdim tugmasi vaqtni yozadi, normaga taqqoslanadi (EP-KAN-134, K49)
- Isbot: time-entries start/stop endpointlari JONLI (kanban-card-files.controller.ts:214-236) + kanban_time_tracks=48 qator; LEKIN norma-vaqtga taqqoslash yo'q (norma master-data yo'q)

**15.135  ❌ yo'q**  — ❓ ТХ (texnika xavfsizligi) yo'riqnoma davriy takrorlanuvchi vazifa bo'ladimi?
- Siz: Har stansiya operatoriga davriy ТХ yo'riqnoma vazifasi, o'tmaganlar qizil ro'yxatda (EP-KAN-135, K50)
- Isbot: recurrence_pattern ustun bor lekin ТХ-davriy-yo'riqnoma shabloni+rejalashtirgich(cron) yo'q; o'tmaganlar qizil-ro'yxat logikasi qurilmagan

**15.136  ❌ yo'q**  — ❓ Заявка bumagi miqdori (Кг/Лист размер) ombor qoldig'iga taqqoslanadimi?
- Siz: Заявка miqdori ombor qoldig'i bilan solishtiriladi: yetmasa 'sotib olish' vazifasi (EP-KAN-136, K51)
- Isbot: Заявка→ombor-qoldiq solishtirish+avtomat sotib-olish vazifa eventi yo'q; warehouse_stock/MM bog'lanish qurilmagan

**15.137  ❌ yo'q**  — ❓ Operator-stansiya biriktiruvi o'zgarsa ochiq vazifalar yangi operatorga o'tadimi?
- Siz: Stansiya-operator master-data; o'zgarsa o'sha stansiya ochiq kartalari yangi operatorga avtomat (EP-KAN-137, K52)
- Isbot: stansiya-operator master-data va biriktiruv-o'zgarishi→vazifa-qayta-yo'naltirish eventi yo'q; karta egasiz qolmaslik mexanizmi qurilmagan

---

## 16 — IoT / Telemetriya  (vizyon 38%, 86 savol)

**16.1  🟡 qisman**  — ❓ Mashina reestri "Станоклар норма" jadvaliga 1:1 mos (SM-52/KBA-105/Тигель/Гофра/ФСМ) seed qilinsinmi?
- Siz: Reestr xuddi 'Станоклар норма' nomlari bilan seed (zavod allaqachon shu nomlar bilan ishlaydi)
- Isbot: equipment jadval BOR (7 qator) lekin nomlar generik DEMO: 'Ofset mashina #1 (DEMO)', 'Flexoprint Mashinasi 1', 'Qirqish Dastgohi 1' — SM-52/KBA-105/Тигель/Гофра линия/ФСМ YO'Q. q.cjs equipment LIMIT 15.

**16.2  ❌ yo'q**  — ❓ Har mashinaga "норма штук 1 час" va "за 12 часов" qiymati biriktirilsinmi?
- Siz: Har mashina kartasida norma/soat + norma/12 soat saqlanadi, IoT haqiqiy bilan solishtiradi (performance %)
- Isbot: equipment yoki production_sessions'da norma_per_hour/per_12h ustuni YO'Q. Faqat work_centers.norma_kg_per_shift / norma_m2_per_shift bor (mashina-emas, sex-darajasi). q.cjs columns LIKE '%norm%'.

**16.3  ❌ yo'q**  — ❓ Norma kim tasdiqlaydi — РД4→Ген.Директор imzo-zanjirimi (sub-savol)?
- Siz: 'Согласовано РД4 + Утверждено Ген.Директор' imzo-zanjir (kitobdagidek)
- Isbot: Mashina-normasi jadvali yo'q, shu sababli norma-o'zgartirish approval-zanjiri ham yo'q. EP-IOT-054 (action=APPROVE) hech qaerda amalga oshmagan.

**16.4  ❌ yo'q**  — ❓ O'lchov birligi mashinaga qarab farq qilsinmi (м2/лист/штук/удар)?
- Siz: Har mashinada o'z birligi — Гофра=м2, ofset=лист, Тигель=удар/лист, qolgan=штук
- Isbot: production_sessions'da unit/uom ustuni YO'Q — faqat target_quantity/actual_quantity (birliksiz, dona-faraz). Mashina-darajasidagi birlik biriktiruvi yo'q.

**16.5  ❌ yo'q**  — ❓ Tigel uchun "удар/лист" (zarba) hisoblagichi alohida kuzatilsinmi?
- Siz: Тигель'da udar va лист ikkalasi alohida hisoblanadi (resurs + ishlab chiqarish)
- Isbot: Hech qaysi jadvalda udar/stroke ustuni YO'Q (q.cjs columns LIKE '%udar%'/'%stroke%' = 0). Egasi: zarba-sensor hali o'rnatilmagan (fazaviy).

**16.6  ❌ yo'q**  — ❓ Udar sonidan texnik xizmat eslatmasi chiqsinmi (sub-savol, har 1 mln udar)?
- Siz: Ha — har N mln udarda eslatma (qolip resursi)
- Isbot: Udar-hisoblagich yo'q, qolip-resurs (штамп) jadvali yo'q (ow_molds bor lekin udar-counter ustunsiz). Eslatma mantiqasi mavjud emas.

**16.7  ❌ yo'q**  — ❓ SM/KBA bosma ranglar soni (seksiya 4+0/4+4) kuzatilsinmi?
- Siz: Har bosma ishi uchun rang/seksiya soni yoziladi (texnik topshiriqdan)
- Isbot: production_sessions yoki equipment'da color_count/section ustuni YO'Q. Egasi: A-default (texnik kartadan keladi) — hali qurilmagan.

**16.8  🟡 qisman**  — ❓ "иш йук" (idle) alohida holat/sabab sifatida kuzatilsinmi?
- Siz: 'Иш йук' alohida toifa (rejalashtirish kamchiligi), nosozlikdan ajraladi
- Isbot: mes_downtime_reasons jadval BOR (7 kod: DT-MECH/ELECT/MAT/SETUP/MAINT/QUAL/SHIFT) lekin 'иш йук'/idle ALOHIDA kod YO'Q. Struktura kengaytirishga tayyor, lekin kitob-sabab seed qilinmagan.

**16.9  ❌ yo'q**  — ❓ "Колиб тайёр эмас" to'xtash sababi + mas'ul bo'lim biriktirilsinmi?
- Siz: 'Колиб тайёр эмас' alohida sabab + qolip tsexi mas'ul
- Isbot: mes_downtime_reasons'da qolip-tayyor-emas kodi YO'Q (7 kod ichida). DT-SETUP umumiy. Kitob real izoh ('колибни таергарлик -4 соат') seed qilinmagan.

**16.10  🟡 qisman**  — ❓ "Иш икки марта кайта урилган" (переделка) brak sabab kodi sifatida?
- Siz: 'Кайта урилди (переделка)' sabab kodi + izoh
- Isbot: Brak qayd endpoint REAL bor (iot-tablet.controller.ts:477 /defect, sabab-kodi bilan), lekin 'переделка' tayyor brak-sabab ro'yxatida seed qilinmagan (defect_catalog tekshiruvi alohida modul).

**16.11  🟡 qisman**  — ❓ "настройка муракаб" — setup vaqti (наладка) ishlash vaqtidan ajratilsinmi?
- Siz: Setup vaqti alohida holat (сozlanmoqda), OEE'da hisobga olinadi
- Isbot: production_sessions'da setup_seconds + current_stage + stage_started_at ustunlari BOR (schema tayyor), lekin tablet start/stop oqimida setup-stage alohida hisoblanishi kod-darajasida ko'rinmadi (iot-tablet.service'da setup_seconds referensi yo'q). Struktura bor, to'liq sim emas.

**16.12  🟡 qisman**  — ❓ Smena (А/Б/С) bo'yicha holat va norma ajratilsinmi?
- Siz: Har smena (А/Б/С) bo'yicha alohida ko'rsatkich + smena boshlig'iga biriktiriladi
- Isbot: production_sessions.shift_id, shift_assignments.shift, downtime_logs.shift, production_facts.shift ustunlari BOR. shift-bo'yicha alohida KPI agregatsiyasi/А-Б-С kod seed tasdiqlanmadi. Struktura bor, data 0.

**16.13  ❌ yo'q**  — ❓ "Станокдаги ишлар · кейинги иши" navbat Andon/IoT ekranida ko'rinsinmi?
- Siz: Har mashina kartasida 'hozirgi ish + keyingi ish' MES'dan ko'rsatiladi
- Isbot: machine-status-current endpoint bor lekin 'keyingi ish' (next job) ko'rsatuvi yo'q. machine_tasks jadval BOR lekin 0 qator. Egasi: 🔵 OCHIQ (A-default).

**16.14  🟡 qisman**  — ❓ Har mashinaga operator va yordamchi biriktirilsinmi (kim ishlatdi)?
- Siz: Smena yozuvida operator + yordamchi(lar) biriktiriladi (HR kartasidan)
- Isbot: machine_crews jadval BOR (2 qator), tablet /production-sessions/:id/crew POST+GET endpoint REAL (controller:284,296). production_facts.operator1-4 ustunlar bor. Ekipaj-biriktirish ishlaydi, lekin data minimal (2 qator).

**16.15  ❌ yo'q**  — ❓ Гофра линия м2 hisoblagich Ombor (karton) bilan bog'lansinmi (isrof nazorati)?
- Siz: Ishlab chiqarilgan м2 ↔ sarflangan material м2 avto solishtiriladi, farq ogohlantiriladi
- Isbot: Гофра м2-hisoblagich va material-balans taqqoslash mantiqasi yo'q (gofra-sensor o'rnatilmagan). Egasi: 🔵 OCHIQ fazaviy.

**16.16  ❌ yo'q**  — ❓ UV/Трафаретный лак sarfi varaqqa bog'lab kuzatilsinmi?
- Siz: Lak mashinalarida varaq/m2 → lak sarf normasi (haqiqiy ↔ kutilgan)
- Isbot: Lak-sarf kuzatuvi jadval/endpoint yo'q. Egasi-javob #39: formula bilan (varaq×koeff) sensor o'rnatilguncha — hali qurilmagan. 🔵 OCHIQ.

**16.17  ❌ yo'q**  — ❓ Ламинация plyonka (рулон) sarfi va isrofi hisoblansinmi?
- Siz: Plyonka sarfi + isrof % har ишда yoziladi, chegaradan oshsa ogohlantirish
- Isbot: Plyonka-sarf/isrof kuzatuvi yo'q. Egasi: 🔵 OCHIQ fazaviy (sensorsiz).

**16.18  🟡 qisman**  — ❓ Степлер/Склейка — qo'l mehnati mashinalari IoT'ga (tabletdan qo'lda) kirsinmi?
- Siz: Qo'l ish joylari tabletdan qo'lda kiritiladi (норма bilan solishtiriladi), sensor yo'q
- Isbot: Operator IoT-tablet REAL ishlaydi (login→sessiya→qty kiritish), lekin qo'l-ish-joylari (Степлер 1/2/3, Склейка, Окошка) reestrda yo'q (equipment'da generik DEMO). Tablet-mexanizm bor, mashina-data yo'q.

**16.19  ❌ yo'q**  — ❓ Резка material kirim nuqtasi (zanjir boshi) sifatida kuzatilsinmi?
- Siz: Резка chiqishi keyingi bosqich uchun 'kirish miqdori', zanjir bo'ylab yo'qotish ko'rinadi
- Isbot: Operatsiya-zanjir bo'ylab miqdor-uzatish (Резка→keyingi) mantiqasi yo'q. Egasi: 🔵 OCHIQ.

**16.20  🟡 qisman**  — ❓ "отработано часов" vs 12 soatlik smena solishtirilsinmi (vaqt tahlili)?
- Siz: Smena=12 soat baza; ishlangan/bo'sh/sozlash/remont soatlarga bo'linadi
- Isbot: production_sessions'da running_time_seconds + stopped_time_seconds + setup/main/teardown_seconds ustunlari BOR — vaqt-bo'linish strukturasi mavjud. Lekin 12-soat-baza vs ishlangan to'liq breakdown hisoboti tasdiqlanmadi (data 0).

**16.21  ❌ yo'q**  — ❓ Smena uzunligi 8/10/12 soat mashinaga/sexga qarab sozlanadimi (sub-savol)?
- Siz: Ha — mashina/sexga qarab sozlanadi
- Isbot: Smena-uzunligi mashina/sex-darajasida sozlanadigan ustun/konfig topilmadi. 🔵 OCHIQ.

**16.22  ❌ yo'q**  — ❓ "ко-во работ" (smenada ish/buyurtma soni) o'lchansinmi?
- Siz: Smenada bajarilgan ish soni + har biriga sozlash vaqti sanaladi
- Isbot: Smena bo'yicha ish-soni (job count) agregatsiyasi endpoint/hisob yo'q. 🔵 OCHIQ.

**16.23  ❌ yo'q**  — ❓ Брак % chegaradan oshganda avto ogohlantirish (ekran+Telegram)?
- Siz: Брак % chegaradan oshsa → smena boshlig'i + sifatga darhol signal
- Isbot: Brak-qayd REAL bor (tablet /defect), lekin brak%-chegara-monitoring + avto-alert (Telegram) IoT modulida topilmadi. iot_alerts jadval 0 qator. 🔵 OCHIQ.

**16.24  ❌ yo'q**  — ❓ Brak chegarasi mashina turiga qarab farq qilsinmi?
- Siz: Har mashina turiga o'z brak chegarasi (ishlab chiqarish boshlig'i belgilaydi)
- Isbot: Mashina-turi-bo'yicha brak-chegara konfig jadvali yo'q. 🔵 OCHIQ.

**16.25  ❌ yo'q**  — ❓ Авто vs ручная кашировка samaradorligi taqqoslansinmi (CAPEX qaror)?
- Siz: Авто/yarim-avto/qo'l кашировка solishtirma hisoboti (m2/soat, brak, mehnat)
- Isbot: Кашировка 3-tur reestrda yo'q (equipment generik), taqqoslama hisobot yo'q. 🔵 OCHIQ.

**16.26  🟡 qisman**  — ❓ Mashina "иш %" (yuklanish foizi) + bottleneck ko'rsatkichi?
- Siz: Har mashina yuklanish % (kun/hafta) + bo'g'iz belgilanadi
- Isbot: OEE/uptime hisoblanadi (oee-calculator REAL), lekin alohida 'yuklanish %' + bottleneck-bayroq IoT'da topilmadi (egasi-javob #49: bottleneck PP/CRP orqali Director holatiga). Qisman OEE bor.

**16.27  ❌ yo'q**  — ❓ "Согласовано РД4 / Утверждено Ген.Директор" norma tasdiq zanjiri saqlansinmi?
- Siz: Norma o'zgarishi РД→Direktor tasdig'idan o'tadi (audit jurnali bilan)
- Isbot: Mashina-norma jadvali ham yo'qligi sababli norma-approval zanjiri (audit jurnal) mavjud emas. EP-IOT-054 action=APPROVE qurilmagan.

**16.28  ❌ yo'q**  — ❓ ФСМ tezligi va uzilishi (зажор) kuzatilsinmi?
- Siz: ФСМ tezlik + tiqilish soni kuzatiladi, ko'paysa ogohlantirish
- Isbot: ФСМ mashina reestrda yo'q, tiqilish-counter yo'q. 🔵 OCHIQ (sensorsiz).

**16.29  ❌ yo'q**  — ❓ Тигель qolip (штамп) resursini udar soniga bog'lash + almashtirish eslatmasi?
- Siz: Har qolip kartasi + udar hisoblagichi + resurs chegarasi → eslatma
- Isbot: ow_molds jadval BOR lekin udar-counter/resurs-chegara ustuni yo'q; eslatma-mantiqasi yo'q. 🔵 OCHIQ.

**16.30  🟡 qisman**  — ❓ Defekt sababini operator tabletdan tayyor ro'yxatdan tanlasinmi?
- Siz: Tayyor sabab ro'yxati (qolip yarim/podrezka/rang ketdi/karton ho'l) + izoh
- Isbot: Tablet /defect endpoint REAL (sabab-kodi qabul qiladi, controller:477), lekin kitob-real-sabablar (qolip yarim/podrezka) tayyor ro'yxat sifatida seed qilinishi tasdiqlanmadi (defect_catalog alohida).

**16.31  ✅ bor**  — ❓ Smena topshirish (А→Б) paytida mashina holati qayd etilsinmi?
- Siz: Smena topshirish ekrani: tugatilmagan ish + mashina holati + qolip/material + izoh
- Isbot: tablet /tablet/handover endpoint REAL (controller:197, raqamli imzo); mes_shift_handovers + shift_handovers jadvallar bor. FE IoTCompletionReport mavjud. Mexanizm to'liq, data 0.

**16.32  ❌ yo'q**  — ❓ "иш йук" soatlarida muqobil ishga (паддон/арчиш) o'tkazish qayd etilsinmi?
- Siz: 'Иш йук → muqobil ish (арчиш/паддон/тозалаш)' qayd etiladi, vaqt alohida sanaladi
- Isbot: Muqobil-ish (арчиш/паддон) HR-tabel kodi + IoT qaydi topilmadi. Egasi-javob #36/#46: 'muqobil ish' alohida kod — hali qurilmagan.

**16.33  ❌ yo'q**  — ❓ Гофра намлik/клей (yelim) parametri sensor bilan kuzatilsinmi?
- Siz: Gofra yelim harorati + namlik sensor bilan, chegaradan chiqsa ogohlantirish
- Isbot: Namlik/yelim-harorat sensor-parametri yo'q. 🔵 OCHIQ (maxsus sensor fazaviy).

**16.34  ❌ yo'q**  — ❓ Ofset бо'yoq (краска) qutisi darajasi kuzatilsinmi?
- Siz: Bo'yoq darajasi past bo'lsa ogohlantirish + Ombordan avto talab
- Isbot: Bo'yoq-daraja sensor/ogohlantirish yo'q. 🔵 OCHIQ (sensorsiz).

**16.35  ❌ yo'q**  — ❓ Автовысечка картон vs гофра alohida ajratilsinmi?
- Siz: Картон va гофра висечка alohida o'lchanadi (o'z normasi bilan)
- Isbot: Автовысечка reestrda yo'q (equipment generik), картон/гофра rejim-ajratish yo'q. Norma-data yo'q.

**16.36  🟡 qisman**  — ❓ Mashina ON/OFF vaqti avto yozilsinmi (kechikish ko'rinishi)?
- Siz: Mashina ON/OFF avto yoziladi + tabel rejasi bilan solishtiriladi
- Isbot: machine_status_logs jadval BOR (status_started_at/status_ended_at/duration_minutes, 9 qator) — holat-vaqt strukturasi mavjud, lekin avtomatik ON/OFF tok-sensor yozuvi yo'q (qo'lda/AI-detected). 🔵 OCHIQ.

**16.37  ❌ yo'q**  — ❓ Энергия idle (бекор ёниб турган) vaqtni topish (idle tok)?
- Siz: Ishlash tok ↔ bo'sh (idle) tok ajratiladi, bo'sh tok ogohlantiriladi
- Isbot: Energiya endpoint egasi-mandatli HALOL 501 qaytaradi (iot-main.controller.ts:153 'Energiya sensori o'rnatilmagan EP-IOT-018-PENDING'). Idle-tok yo'q. 🔑 egasi-data (sensor o'rnatilgach).

**16.38  ❌ yo'q**  — ❓ Kompressor/havo (пневматика) bosimi kuzatilsinmi?
- Siz: Kompressor bosimi + havo uzilishi sensor bilan, tushsa ogohlantirish
- Isbot: Kompressor/havo-bosim sensor-monitoring yo'q. Egasi-javob #18: bitta umumiy 'kompressor muammosi' hodisasi — hali qurilmagan. 🔵 OCHIQ.

**16.39  🟡 qisman**  — ❓ Andon normaga nisbatan real bajarish (target↔haqiqiy, qizil/yashil)?
- Siz: Andon: target vs haqiqiy + ortda qolish % (qizil/yashil)
- Isbot: production_sessions'da target_quantity + actual_quantity BOR (taqqoslash-asosi mavjud), machine-status-current endpoint bor; FE OEELiveMonitorPage mavjud. Lekin to'liq Andon target-vs-actual ekrani + norma-asosi yo'q (norma mashina-kartasida yo'q). 🔵 OCHIQ.

**16.40  ❌ yo'q**  — ❓ Окошка (deraza yelimlash) alohida bosqich/operatsiya sifatida?
- Siz: Окошка alohida operatsiya + plyonka sarfi + brak
- Isbot: Окошка mashina/operatsiya reestrda yo'q. 🔵 OCHIQ.

**16.41  ❌ yo'q**  — ❓ Тиснение/Конгрев (folga) folga sarfi va udar kuzatilsinmi?
- Siz: Folga sarfi (м/ish) + udar soni kuzatiladi, isrof ko'rsatiladi
- Isbot: Folga-sarf/udar kuzatuvi yo'q (udar-hisoblagich umuman yo'q). 🔵 OCHIQ.

**16.42  ❌ yo'q**  — ❓ Mashina-mashina yarim tayyor (НЗП) buyurtma kuzatilsinmi?
- Siz: Har buyurtma operatsiya zanjiri bo'ylab kuzatiladi (qaysi mashinada, qancha kutdi)
- Isbot: Operatsiya-zanjir bo'ylab НЗП-kuzatuv (qaysi bosqichda) IoT'da yo'q. planning_operations bor (MES), lekin IoT-NZP integratsiyasi tasdiqlanmadi. 🔵 OCHIQ.

**16.43  🟡 qisman**  — ❓ "Папка №" (buyurtma papkasi) IoT yozuviga bog'lansinmi?
- Siz: Har mashina ishi 'Папка №' + buyurtma kodiga bog'lanadi
- Isbot: mes_papka_orders.papka_no, papka_orders.papka_no, production_facts.papka_no ustunlari BOR (kitob-grounded). production_sessions production_order_id orqali bog'lanadi. Papka-strukturasi bor, lekin IoT-sessiya↔papka to'liq bog'lanishi data-bilan tasdiqlanmadi (0 qator).

**16.44  🟡 qisman**  — ❓ Sensor signal yo'qolsa "noma'lum" vaqt ajratilsinmi (uptime/downtime'ga qo'shilmaydi)?
- Siz: Sensor uzilgan vaqt 'ma'lumot yo'q' alohida (OEE maxrajiga kirmaydi) — halol hisob
- Isbot: production_sessions.last_signal_at ustuni BOR (signal-uzilishni aniqlash asosi), lekin 'noma'lum vaqt' OEE-maxrajidan chiqarish qoidasi kod-darajasida tasdiqlanmadi. 🔵 OCHIQ (egasi-javob #12).

**16.45  🟡 qisman**  — ❓ Mashina texnik xizmat tarixi (ремонт) qog'ozdan IoT'ga ko'chirilsinmi?
- Siz: Mashina kartasida ta'mir tarixi (sana/ish/qism/xarajat) — MTBF ko'rinadi
- Isbot: equipment_maintenance, asset_maintenance_records, mes_maintenance_tasks/requests, maintenance_orders jadvallar BOR; equipment'da last/next_maintenance_date, operating_hours ustunlari bor. Struktura mavjud, lekin tarix-data ko'chirilmagan (DEMO machines).

**16.46  ❌ yo'q**  — ❓ Texnik xizmat ehtiyot qismi Ombor bilan bog'lansinmi?
- Siz: Ta'mirda ishlatilgan qism Ombordan chiqim + min. zaxira ogohlantirish
- Isbot: Ta'mir-qism→Ombor-chiqim bog'lanishi IoT modulida topilmadi. mro_inventory bor (alohida). 🔵 OCHIQ.

**16.47  🟡 qisman**  — ❓ "Norma bajarilmadi" sababi avto tahlil (downtime breakdown) qilinsinmi?
- Siz: Norma bajarilmaganda avto sabab tahlili: '3 soat иш йук + 1 soat созлаш'
- Isbot: downtime_events qayd + setup/run/stopped_seconds bo'linishi BOR (xom material), lekin 'norma bajarilmadi' avto-breakdown-tahlili hisoboti tasdiqlanmadi. Norma-asosi yo'qligi to'siq. 🔵 OCHIQ.

**16.48  ❌ yo'q**  — ❓ Brak material qayta ishlatish (макулатура) kuzatilsinmi?
- Siz: Brak miqdori → makulatura/qayta ishlash sifatida yoziladi (material balansi)
- Isbot: waste_records jadval bor (alohida), lekin IoT-brak→makulatura-taqdir kuzatuvi topilmadi. 🔵 OCHIQ.

**16.49  ❌ yo'q**  — ❓ Mashina sensor/o'lchagich kalibrovka muddati eslatmasi?
- Siz: Har sensor/o'lchagich kalibrovka muddati + eslatma (data ishonchi)
- Isbot: ai_calibration_runs jadval bor (AI-model uchun, sensor-emas). Sensor kalibrovka-muddat eslatmasi yo'q. 🔵 OCHIQ (sensorsiz).

**16.50  ❌ yo'q**  — ❓ Kamera-AI operator himoya vositasi (qo'lqop/ko'zoynak) tekshirsinmi?
- Siz: Kamera-AI himoya vositasini tekshiradi, yo'q bo'lsa ogohlantirish/qayd
- Isbot: safety-violations controller + jadval strukturasi bor (machine_status_logs.ai_detected/ai_confidence/image_url), LEKIN real vision-inferens (PPE-detect model) YO'Q — faqat config/dashboard CRUD. Barcha kamera jadvallar 0 qator. AI-kamera infratuzilma o'rnatilmagan. 🔑 egasi-data.

**16.51  ❌ yo'q**  — ❓ Kamera-AI xavfli zonada odam yo'qligini tekshirsinmi (висечка/тигель)?
- Siz: Kamera-AI xavfli zonani kuzatadi, odam kirsa darhol ogohlantirish
- Isbot: Xavfli-zona vision-detect mantiqasi yo'q (vision-model inferensi modulda yo'q, faqat doc-comment). camera_alerts jadval 0 qator. 🔑 egasi-data (kamera o'rnatilgach).

**16.52  ❌ yo'q**  — ❓ Tungi smena (С) avto nazorat kuchaytirilsinmi?
- Siz: Tungi smenada anomaliya/idle chegarasi pasaytiriladi + masofadan Telegram
- Isbot: Tungi-smena-bo'yicha pasaytirilgan-chegara konfig/Telegram-eskalatsiya IoT'da topilmadi. 🔵 OCHIQ.

**16.53  ✅ bor**  — ❓ Mashina boshlashdan oldin majburiy "tayyorlik tekshiruvi" (checklist)?
- Siz: Majburiy checklist (yog'/tozalik/qolip/material), to'ldirilmasa ish ochilmaydi
- Isbot: REAL majburlash: iot-tablet.controller.ts:331-348 startProductionSession — setup_checklists/checklist_items majburiy bandlar bajarilmasa session RUNNING bo'lmaydi (UnprocessableEntityException 'BLOCKED'); chek-list sozlanmagan = fail-safe BLOCK. Mexanizm to'liq ishlaydi.

**16.54  🟡 qisman**  — ❓ Mashina samaradorligi GSD/ЦКП ShVB'ga avto uzatilsinmi?
- Siz: IoT ko'rsatkichlari avto ShVB GSD'ga (ishlab chiqarish statistikasi) uzatiladi
- Isbot: OEE hisoblanadi + stop'da OEE-report qaytadi (oee-calculator REAL), lekin avtomatik GSD/ЦКП→ShVB-karta uzatish event-zanjiri tasdiqlanmadi (oee_records/oee_snapshots 0 qator). Egasi: mashina ЦКП IoT/MES'dan keyin avto — qisman.

**16.55  🟡 qisman**  — ❓ Mashina ko'rsatkichini operator oylik/KPI'siga bog'lash darajasi?
- Siz: Bonusga ta'sir, lekin faqat operatorga bog'liq qism (idle/material/qolip chiqarib tashlanadi)
- Isbot: Sessiya operator_id/operator_card_id + machine_crews bog'lanishi BOR (KPI-asosi), lekin OEE→oylik adolatli-koeffitsient (idle chiqarib tashlash) bog'lanishi HR-modul bilan tasdiqlanmadi. Mexanizm-asos bor.

**16.56  ❌ yo'q**  — ❓ Ofset plastina (колиб/CTP) tayyorlik holati navbatda ko'rinsinmi?
- Siz: Mashina navbatidagi har ish yonida 'plastina/qolip tayyor' indikatori (preprint'dan)
- Isbot: Plastina-tayyor indikatori mashina-navbatda yo'q (navbat-ko'rsatuv ham yo'q, Q11 bilan bir). 🔵 OCHIQ.

**16.57  🔑 egasi-data**  — ❓ (v1) Sensor qaysi mashinalarga qo'yiladi (bosqichli joriy)?
- Siz: Avval 3-5 ta asosiy mashina (Гофра/KBA/ФСМ); IoT hali o'rnatilmagan
- Isbot: sensor_devices jadval BOR (0 qator), iot_sensors bor. Egasi: IoT FIZIKAN o'rnatilmagan, qaysi mashina birinchi — egasi-qarori (CAPEX). Struktura tayyor, qaror kutadi.

**16.58  🟡 qisman**  — ❓ (v1) Mashina holati ranglari (5 holat master-ro'yxati)?
- Siz: 5 holat: Ishlayapti/To'xtagan/Sozlanmoqda/Nosoz/O'chiq
- Isbot: machine_status_logs.status + previous_status ustunlari BOR (holat-o'tish kuzatuvi), machine-status-current/logs endpoint REAL. 5-holat enum aniq seed/cheklov kod-darajasida tasdiqlanmadi. Struktura bor.

**16.59  🟡 qisman**  — ❓ (v1) Mashina uptime ko'rsatkichi (avto, GSD'ga)?
- Siz: Avtomatik uptime (smena/kun/hafta) + GSD'ga ulash
- Isbot: OEE-availability hisoblanadi (oee-calculator REAL: runTime/plannedTime); machine_status_logs.duration_minutes bor. Avto-uptime→GSD ulanishi tasdiqlanmadi. Hisob-asos bor, data 0.

**16.60  ✅ bor**  — ❓ (v1) To'xtash (downtime) sababini yozish (tayyor ro'yxatdan)?
- Siz: Tayyor sabab ro'yxatidan operator tanlaydi (planlangan/planlanmagan ajraladi)
- Isbot: tablet /downtime-events POST REAL (controller:577); downtime_events jadval (2 qator); mes_downtime_reasons master-data (7 kod, is_planned bayrog'i bilan — planlangan/planlanmagan ajraladi). Mexanizm to'liq ishlaydi.

**16.61  🟡 qisman**  — ❓ (v1) To'xtash sabablari ro'yxati (8-10 standart master-data)?
- Siz: 8-10 standart sabab + kitob real sabablari (иш йук/колиб/переделка/настройка)
- Isbot: mes_downtime_reasons 7 standart kod BOR (mexanik/elektr/material/setup/TO/sifat/smena), LEKIN kitob-real-sabablar (иш йук/колиб/переделка) ALOHIDA kod sifatida YO'Q. 7/10, kitob-sabab yetishmaydi.

**16.62  🟡 qisman**  — ❓ (v1) Anomaliya (g'ayrioddiy holat) ogohlantirishi?
- Siz: Avtomatik aniqlash + darhol ogohlantirish (sex ekrani + Telegram)
- Isbot: anomaly-detected.handler.ts + get-anomalies.handler.ts BOR (event-handler strukturasi), iot_alerts jadval (0 qator). Sensor o'rnatilmagan → real anomaliya-data yo'q. 🔵 OCHIQ struktura-tayyor.

**16.63  🟡 qisman**  — ❓ (v1) Anomaliya chegaralarini kim belgilaydi?
- Siz: Har mashina turi uchun chegara admin/ishlab chiqarish boshlig'i sozlaydi
- Isbot: iot_devices.thresholds (JSONB) ustuni BOR + update-device-thresholds.handler.ts REAL (chegara-sozlash mexanizmi). Lekin mashina-turi-bo'yicha + approval-zanjir tasdiqlanmadi. Mexanizm-asos bor.

**16.64  ❌ yo'q**  — ❓ (v1) Anomaliya kelganda workflow (texnik vazifa + xabar)?
- Siz: Avto: texnik xizmat vazifasi + mas'ul mexanikga xabar + jurnal
- Isbot: anomaly→maintenance-task avto-yaratish + mexanik-marshrut workflow tasdiqlanmadi (handler bor lekin uchidan-uchiga zanjir 0-data). 🔵 OCHIQ.

**16.65  ❌ yo'q**  — ❓ (v1) Telemetriya tarixini saqlash muddati (downsampling)?
- Siz: Batafsil 3-6 oy, keyin kunlik o'rtachaga siqish (downsampling)
- Isbot: mes_telemetry jadval BOR (384 qator!) lekin downsampling/retention-cron topilmadi. Egasi-javob #30: 3-6 oy keyin siqish — cron qurilmagan. 🔵 OCHIQ.

**16.66  ❌ yo'q**  — ❓ (v1) Kamera-AI bilan xona inspeksiyasi (ideal-rasm, har 2 soat)?
- Siz: AI rasm baholaydi + ball + anomaliya; ideal-xona bilan har 2 soatda taqqoslash
- Isbot: ideal_rasm_targets jadval BOR (0 qator), iot-main /room-inspections endpoint bor (repo-backed), LEKIN real vision-taqqoslash (ideal vs joriy rasm AI-inferens) YO'Q. Har-2-soat cron yo'q. Infratuzilma o'rnatilmagan. 🔑 egasi-data.

**16.67  ❌ yo'q**  — ❓ (v1) Kamera-AI nimani tekshiradi (5-7 mezon master-ro'yxat)?
- Siz: 5-7 mezon (tozalik/himoya/yo'lak/tartib/xavfsizlik) checklist
- Isbot: Inspeksiya-mezon master-ro'yxati (checklist) IoT'da seed/jadval topilmadi. AI-kamera infratuzilmasi yo'q. 🔵 OCHIQ.

**16.68  ❌ yo'q**  — ❓ (v1) Inspeksiya buzilishini tuzatish jurnali (yopiq sikl)?
- Siz: Har buzilish → mas'ul → muddat → tuzatildi tasdig'i (yopiq sikl)
- Isbot: room-inspections endpoint bor lekin buzilish→correction-plan→yopilish yopiq-sikl jadval/oqimi tasdiqlanmadi (0 data). 🔵 OCHIQ.

**16.69  🟡 qisman**  — ❓ (v1) MES bilan ulanish (ish buyrug'i ↔ mashina, oltin-ip)?
- Siz: Sensor hisoblagich → MES buyrug'iga avto bog'lanadi (chiqarilgan dona avto-yoziladi)
- Isbot: production_sessions.production_order_id + machine_id MES bilan bog'lanish-asosi BOR; mes modul (mes-production-sessions, mes.gateway WS OEE) BOR. Lekin IoT↔MES sessiya-jadval BO'LINISHI (production_sessions ╳ mes_sessions, har biri 8 qator) — to'liq sinxron emas (IOT-MES-CURRENT-STATE gap). Qisman.

**16.70  ✅ bor**  — ❓ (v1) OEE (umumiy samaradorlik) ko'rsatkichi (3 omil)?
- Siz: To'liq OEE (vaqt+tezlik+sifat) avtomatik + trend
- Isbot: oee-calculator.service.ts REAL 3-omil: availability=RT/PT, performance=AQ×IT/RT, quality=(AQ-DQ)/AQ, OEE=A×P×Q (satr 118-121, clamp+Zod). tablet stop OEE-report qaytaradi. mes.gateway WS-OEE bor. Kalkulyator to'liq ishlaydi.

**16.71  🟡 qisman**  — ❓ (v1) RUL — qolgan resurs (predictive maintenance)?
- Siz: Oddiy qoidaga asoslangan prognoz (ish soati/sikl) avval
- Isbot: predictive-maintenance.service.ts REAL evristik (304 qator: RUL, healthScore<70 warning, trend-asosida); /predictive-maintenance endpoint bor. Lekin sensor-telemetriya 0 → real prognoz-data yo'q. Mexanizm bor, data yo'q.

**16.72  🟡 qisman**  — ❓ (v1) Texnik xizmat jadvali (reja-profilaktika)?
- Siz: Avtomatik jadval (ish soatiga bog'liq) + eslatma + bajarildi belgisi
- Isbot: equipment.next_maintenance_date/maintenance_interval/operating_hours ustunlari BOR; maintenance_orders, equipment_maintenance jadvallar bor. Avto-jadval-generatsiya + eslatma-cron tasdiqlanmadi. Struktura bor.

**16.73  ❌ yo'q**  — ❓ (v1) Texnik xizmat ishlari ro'yxati (master-data)?
- Siz: Mashina turi bo'yicha standart ishlar + davriylik (yog'lash/filtr/kamar/kalibrlash)
- Isbot: Texnik-xizmat-ishlar master-data ro'yxati (mashina-turi-bo'yicha) jadval topilmadi. mes_maintenance_tasks bor lekin standart-ishlar-katalogi emas. 🔵 OCHIQ.

**16.74  🔑 egasi-data**  — ❓ (v1) Energiya (tok) iste'molini kuzatish (mashina darajasi)?
- Siz: Mashina darajasida o'lchash (har mashina necha kVt)
- Isbot: /energy-consumption endpoint egasi-mandatli HALOL 501 (iot-main.controller.ts:153, 'sensor o'rnatilmagan EP-IOT-018-PENDING'). Energiya-sensor fizikan yo'q. Sensor o'rnatilgach real query tiklanadi.

**16.75  ❌ yo'q**  — ❓ (v1) Energiya bo'yicha hisobot va ogohlantirish?
- Siz: Norma + oshganda ogohlantirish + haftalik energiya hisoboti
- Isbot: Energiya-sensor yo'qligi sababli (501) hisobot/ogohlantirish yo'q. 🔑 egasi-data (sensorsiz).

**16.76  ❌ yo'q**  — ❓ (v1) Birlik mahsulotga energiya sarfi (ShVB statistikasi)?
- Siz: Avtomatik (energiya / MES dona) + GSD'ga ulash
- Isbot: Energiya-data yo'q (501) → birlik-energiya hisobi yo'q. 🔑 egasi-data.

**16.77  🟡 qisman**  — ❓ (v1) Sex katta ekrani (Andon tablosi)?
- Siz: Katta tablo: barcha mashina holati + to'xtaganlari qizil + jonli
- Isbot: machine-status-current endpoint + iot.gateway (WS jonli) BOR; FE OEELiveMonitorPage mavjud. To'liq Andon-tablo (barcha-mashina-grid + qizil-jonli) FE-darajada tasdiqlanmadi. Asos bor.

**16.78  ✅ bor**  — ❓ (v1) Operator tableti (mashina yonida)?
- Siz: Har mashinada tablet: holat + to'xtash sababi + defekt + smena hisoboti
- Isbot: To'liq REAL: FE IoTTablet.tsx + pages/iot/* (login/checklist/dashboard/completion); BE iot-tablet.controller.ts 20+ endpoint (login/sessions/start/stop/defect/downtime/inline-qc/handover/crew/material-scan/sos). IOT-MES-CURRENT-STATE: 'hammasi REAL ishlaydi'. Eng kuchli qism.

**16.79  🟡 qisman**  — ❓ (v1) Sensor uzilganda / signal kelmasa (Aloqa yo'q holati)?
- Siz: 'Aloqa yo'q' alohida holat + texnikga xabar (signal yo'q ≠ to'xtagan)
- Isbot: production_sessions.last_signal_at ustuni BOR (uzilish-aniqlash asosi). 'Aloqa yo'q' alohida-holat-flag + texnik-xabar oqimi tasdiqlanmadi. 🔵 OCHIQ.

**16.80  🟡 qisman**  — ❓ (v1) Holat va xabarlar kimga boradi (karta-model marshrut)?
- Siz: Xabar turi bo'yicha kartaga marshrutlanadi (anomaliya→mexanik, uzun-to'xtash→sex boshlig'i)
- Isbot: sos-alert endpoint + sos-alert-raised.event BOR (xabar-event asosi); CC/NTF modullari alohida. IoT-xabar→org-karta-marshrut to'liq zanjiri IoT'da tasdiqlanmadi. Asos bor.

**16.81  🟡 qisman**  — ❓ (v1) Mashina samaradorligini kartaga bog'lash (GSD lavozimga)?
- Siz: Mashina OEE/uptime → operator/mexanik kartasi GSD'ga avto kiradi
- Isbot: operator_card_id ustuni + machine_crews bog'lanishi BOR (karta-asos), OEE hisoblanadi. Avto-GSD→karta event-zanjiri tasdiqlanmadi (data 0). Asos bor, sim to'liq emas.

**16.82  🟡 qisman**  — ❓ (v1) Defekt/sifat muammosini mashinaga bog'lash (MES orqali)?
- Siz: Defekt → mashina + smena + vaqt avto bog'lanadi (qaysi mashina ko'p brak)
- Isbot: tablet /defect + /inline-qc endpoint REAL (mashina+sessiya-vaqt bog'lanadi); quality-defects endpoint bor. Smena+Pareto-tahlil agregatsiyasi tasdiqlanmadi. Brak-qayd ishlaydi, tahlil qisman.

**16.83  🟡 qisman**  — ❓ (v1) IoT smena hisoboti (avtomatik, invoys PDF)?
- Siz: Avto smena hisoboti + sex boshlig'iga/Telegram; uskuna-xodim → rasmiy invoys PDF
- Isbot: tablet stop → completion-report REAL (FE IoTCompletionReport.tsx + steps/sections). Avto-smena-hisobot → Telegram + rasmiy invoys-PDF (oylik/avans/qarz) generatsiyasi IoT'da tasdiqlanmadi. Completion-report bor, invoys-PDF qism yo'q.

**16.84  ❌ yo'q**  — ❓ (v1) Telegram orqali IoT xabarlari (ShVB bot)?
- Siz: Faqat muhim hodisalar (uzun-to'xtash/anomaliya/ta'mir) Telegram'ga; sozlanadi
- Isbot: IoT-hodisa→Telegram-bot integratsiyasi IoT modulida topilmadi (telegram alohida modul). iot_alerts 0 qator, Telegram-marshrut tasdiqlanmadi. 🔵 OCHIQ.

**16.85  🟡 qisman**  — ❓ (v1) Mashinalar reestri (master-data, yagona haqiqat)?
- Siz: Yagona mashinalar reestri (nomi/turi/inventar/sex/sana/mas'ul karta) — barcha IoT/ta'mir/sifat shunga bog'lanadi
- Isbot: equipment jadval = yagona reestr-asos BOR (7 qator, inventory_number/work_center_id/category/status/mas'ul-asos ustunlari); barcha IoT/ta'mir shunga FK. LEKIN data generik DEMO (kitob 'Станоклар норма' nomlari emas). Reestr-struktura kanonik, content noto'g'ri/test.

**16.86  ❌ yo'q**  — ❓ (v1) Energiya iste'molini Finance bilan bog'lash (tannarx)?
- Siz: Energiya sarfi → tannarxga avto qo'shiladi (Finance bilan ulanadi)
- Isbot: Energiya-data yo'q (501) → Finance-tannarx ulanishi yo'q. Egasi-javob #17/#27: energiya kVt×soat koeff bilan GL'ga — sensor o'rnatilgach. 🔑 egasi-data.

---

## 17 — AI / Aisha  (vizyon 52%, 95 savol)

**17.1  ✅ bor**  — ❓ Bitta markaziy AI bormi yoki har modulga alohida AI? (EP-AI-001)
- Siz: A — bitta Markaziy AI, hamma modul shunga ulanadi, tarqoq AI yo'q (KARTALAR Q30)
- Isbot: central-ai.service.ts: CentralAiService barcha chaqiruvni AiRouterService orqali o'tkazadi; ai-router.service.ts 3 provayder yagona nuqtadan. ai.module.ts bitta markaz.

**17.2  ✅ bor**  — ❓ AI xodimni qanday taniydi — login/JWT→karta orqalimi? (EP-AI-002)
- Siz: A — JWT'dan card_id (org_functions.id) avtomatik, karta ma'lumotidan ishlaydi
- Isbot: central-ai.service.ts:18-23 cardId='JWT dan olingan org_functions.id'; metadata.cardId orqali uzatiladi. ai-daily-report.repository.resolvePrimaryCard(userId).

**17.3  🟡 qisman**  — ❓ Karta↔xodim moslik bahosiga kirish ma'lumotlari (ЦКП+test+davomat+sifat+rahbar)? (EP-AI-003)
- Siz: A — hammasi: MES/QC/HR/LMS/davomat/ЦКП ko'p-manbali agregat
- Isbot: ai-fit.service.ts evaluate() employeeProfile+cardRequirements JSON'dan prompt tuzadi — lekin manbalar (MES/QC/davomat) FE'dan keladi, BE avto-yig'masi yo'q. Struktura bor, ko'p-manba avto-ulanish yetishmaydi.

**17.4  🟡 qisman**  — ❓ Moslik bahosi natijasi qanday ko'rinadi — % + rang + izoh? (EP-AI-004)
- Siz: A — foiz + yashil/sariq/qizil + qisqa matnli sabab birga
- Isbot: ai_fit_scores: fit_score(numeric)+fit_report(jsonb strengths/gaps/summary) saqlanadi. Foiz+report bor; rang/yorug'lik (yashil/sariq/qizil) FE-token UI sifatida tasdiqlanmadi.

**17.5  ❌ yo'q**  — ❓ AI hisoboti kimga boradi — xodim+rahbar+HR uchchasiga? (EP-AI-005)
- Siz: A — uchchalasiga, har biriga mos qism (KARTALAR Q31)
- Isbot: AI-modulda hisobotni 3-tomonga marshrutlash kodi topilmadi (grep routeToManager=0). ai_report_subscriptions=0 qator, writer yo'q. Vizyon-qaror bor, qurilmagan.

**17.6  ❌ yo'q**  — ❓ Hisobot formati rasmiy PDF bo'ladimi? (EP-AI-006)
- Siz: A — rasmiy PDF (xodim/rahbar/HR uchun), 'invoys' kabi
- Isbot: grep pdf|pdfkit|puppeteer apps/api/src/modules/ai/ = 0 natija. PDF generatsiya AI-modulda yo'q (faqat aisha generate-kpi-report.tool.ts boshqa). ai_report_runs=0.

**17.7  🟡 qisman**  — ❓ AI hisoboti qanchalik tez-tez — haftalik digest? (EP-AI-007)
- Siz: A — haftalik avtomatik (dushanba digest) + so'rab olish
- Isbot: forecast-weekly.job.ts faqat forecast uchun bor; moslik/holat haftalik digest cron'i AI-modulda topilmadi. ЦКП kunlik cron bor (ai-daily-report.cron.ts) lekin haftalik digest emas.

**17.8  ✅ bor**  — ❓ ЦКП chatbot mashinasiz xodimdan kunlik so'raydimi? (EP-AI-008)
- Siz: A — AI ЦКП'dan savol tuzadi, kartaga biriktirilgan xodimdan kunlik so'raydi (KARTALAR Q16)
- Isbot: ai-daily-report.service.ts to'liq real: runDailyQuestionPush→ai_ckp_chat_logs'ga savol, submit() faktni ajratadi, AI yo'q→statik savol (fabrikatsiya yo'q). Cron 08:00 Du-Sha.

**17.9  🟡 qisman**  — ❓ ЦКП savollarini kim/qanday tuzadi — AI tuzadi, HR tasdiqlaydi? (EP-AI-009)
- Siz: A — AI ЦКП matn+formuladan savol tuzadi, HR tasdiqlaydi (KARTALAR Q15)
- Isbot: ai-daily-report.service.ts generateQuestion()/buildQuestionRequest() AI bilan savol tuzadi (real). HR-tasdiq oqimi (savolni queue→HR approve) kodi topilmadi — tavsiya-javob #5 talab qilgan, qurilmagan.

**17.10  ✅ bor**  — ❓ Kunlik hisobot bermaslik = oylik gate? (EP-AI-010)
- Siz: A — vaqtida bermasa o'sha kun oylik 0; HR raport→direktor→qo'shiladi (16-soat)
- Isbot: hr/payroll/ckp-gate.ts applyCkpGate: ckp_fact_values yo'q yoki deadline o'tgan→kun oyligi 0; payroll.service.ts chaqiradi. ckp_report_deadline_hours bilan izchil.

**17.11  🟡 qisman**  — ❓ Mashinachi ЦКП IoT/MES'dan avtomatikmi? (EP-AI-011)
- Siz: A — operator ЦКП avtomatik IoT/MES'dan (KARTALAR Q17)
- Isbot: ai-daily-report.cron izohida 'operator-hourly-invoice.cron MES avto-feed' deyilgan (mashinachiga savol yo'llanmaydi). MES→ckp avto-feed alohida cron'da; IoT↔MES↔karta jonli ulanish bo'sh DB sabab tasdiqlanmadi.

**17.12  ✅ bor**  — ❓ Director-AI kompaniya holati sababini tushuntiradimi? (EP-AI-012)
- Siz: A — holat + asosiy sabablar + tavsiya (explainKpi kengaytirish)
- Isbot: director-ai.service.ts:39 explainKpi() + assessRisks() + generateExecutiveSummary() real metodlar, AI router chaqiradi (safeCall, Result<T>).

**17.13  ✅ bor**  — ❓ Director-AI prognoz (forecast) beradimi? (EP-AI-013)
- Siz: A — keyingi hafta/oy holati prognozi + ishonch darajasi
- Isbot: ai/forecast/ to'liq paket: holt-winters.service.ts, croston.service.ts, ensemble-forecast.service.ts, nelder-mead.service.ts, forecast-weekly.job.ts — real statistik prognoz dvigateli.

**17.14  🟡 qisman**  — ❓ Holat tarixini saqlaydimi (trend grafik)? (EP-AI-014)
- Siz: A — har kunlik holat saqlanadi, 30-kun trend grafigi (company-state-log)
- Isbot: company_state% jadval qidiruvi natija bermadi (AI-modul ai_state.log eventi izohda). Director-modulida company-state bo'lishi mumkin; AI-modulda holat-log writer tasdiqlanmadi.

**17.15  ✅ bor**  — ❓ Finance-AI ЗВС (budjet) tahlili beradimi? (EP-AI-015)
- Siz: A — har ЗВС uchun baho (oqlangan/shubhali/rad) + sabab
- Isbot: finance-ai-analysis.service.ts:30 explainBudgetVariance() + classifyInvoice() + assessFraudRisk() real metodlar, AI router orqali.

**17.16  ✅ bor**  — ❓ Finance-AI cashflow prognozi beradimi? (EP-AI-016)
- Siz: A — haftalik/oylik cashflow prognozi + tanqidiy kunlar
- Isbot: finance-ai.service.ts:97 forecastCashflow() real metod. detectAnomalies() ham bor.

**17.17  🟡 qisman**  — ❓ Finance-AI to'lanmagan schyot (aging) ustuvorlik beradimi? (EP-AI-017)
- Siz: A — qarzlarni xavf/summaga qarab tartiblab tavsiya
- Isbot: finance-ai.service.ts mavjud (anomaly+cashflow) lekin aging-priority alohida metod sifatida tasdiqlanmadi; aging hisoboti Finance-modulida, AI ustuvorlik qatlami tekshirilmadi.

**17.18  🟡 qisman**  — ❓ HR-AI GSD trend tahlili beradimi? (EP-AI-018)
- Siz: A — haftalik GSD trend + tushayotgan xodimlar + sabab
- Isbot: hr-ai.service.ts classifyProductivity() bor; hr_weekly_statistics jadvali mavjud. GSD-trend digest alohida AI-metod sifatida tasdiqlanmadi (productivity tasnifi bor).

**17.19  🟡 qisman**  — ❓ HR-AI bonus tavsiyasi beradimi (HR/Moliya tasdiqlaydi)? (EP-AI-019)
- Siz: A — AI bonus tavsiyasi hisoblaydi, HR+Moliya tasdiqlaydi (KARTALAR Q25)
- Isbot: ai-fit.service.ts parsed.bonusRecommendation (AI qaytaradi, ai_fit_scores.bonus_recommendation saqlanadi). Alohida bonus-service yo'q — moslik bahosiga qo'shilgan; HR-tasdiq oqimi qurilmagan.

**17.20  ❌ yo'q**  — ❓ Bonus mezoni sozlanadigan tizimmi (qattiq KPI yo'q)? (EP-AI-020)
- Siz: A — HR/Moliya/rahbar mezonni o'rnatadi, AI shunga hisoblaydi, KPI yo'q (KARTALAR Q25)
- Isbot: Sozlanadigan bonus-mezon jadvali topilmadi (bonus_config/payroll_config yo'q; system_settings umumiy). AI bonusRecommendation prompt'dan keladi, sozlanuvchi mezon-tizim qurilmagan.

**17.21  🟡 qisman**  — ❓ Bottleneck (tor joy) aniqlaydimi? (EP-AI-021)
- Siz: A — AI har kuni/hafta tor joyni IoT/MES+GSD'dan aniqlaydi
- Isbot: ai.controller.ts:173 /ai/bottleneck/analysis STUB qaytaradi `{bottlenecks:[]}` (Qoida 10 buzilishi). REAL bottleneck PP-modulda: pp-ai-planning.service.ts + crp.service.ts + scheduling-capacity.service.ts. AI-modul fasadi bo'sh.

**17.22  🟡 qisman**  — ❓ Bottleneck qamrovi butun zanjirmi? (EP-AI-022)
- Siz: A — ta'minot→IChQ→ombor→yetkazish→hujjat butun zanjir
- Isbot: PP scheduling/CRP zanjir-bo'g'inini hisoblaydi (capacity); lekin AI-markaziy 'butun zanjir tor joy' agregati STUB (ai.controller.ts:173). To'liq zanjir-qamrov AI-modulda yo'q.

**17.23  🟡 qisman**  — ❓ Markaziy forecast nimalarni bashorat qiladi (sotuv+cashflow+material+GSD)? (EP-AI-023)
- Siz: A — hammasi: yagona prognoz markazi
- Isbot: ai/forecast/ statistik dvigatel bor (holt-winters/croston/ensemble); finance cashflow ham. Lekin yagona-markaz sifatida sotuv+material+GSD birlashtirilgan yagona forecast-API tasdiqlanmadi — tarqoq.

**17.24  🟡 qisman**  — ❓ AI-suhbat (chat) kim foydalanadi — hamma, RBAC karta doirasida? (EP-AI-024)
- Siz: A — hamma xodim, har biri o'z kartasi ruxsati doirasida (KARTALAR Q23)
- Isbot: aisha/presentation/controllers/chat.controller.ts JwtAuthGuard bilan himoyalangan, AishaConversationService real. RBAC karta-doirasi (card-scoped ko'rinish) cheklovi tasdiqlanmadi — JWT bor, kartadan-ruxsat filtri ko'rinmadi.

**17.25  ✅ bor**  — ❓ AI-suhbat nimalarga javob beradi (ЦКП/darslik + ERP ma'lumot)? (EP-AI-025)
- Siz: A — ikkalasi: o'qitish + ERP ma'lumotidan javob
- Isbot: aisha tool.registry.ts ~30 tool (inventar/buyurtma/IChQ/sifat/moliya/kamera); AISHA-JARVIS vizyon: 'Aisha ERP ichida javob beradi + ERP-tool'. ERP-ma'lumot javobi real.

**17.26  🟡 qisman**  — ❓ AI-suhbat tili — 3 til (UZ-lotin/UZ-kirill/RU)? (EP-AI-026)
- Siz: A — uch til, xodim profilidan til olinadi (ShVB Q21/Q47)
- Isbot: i18n 3-til config MEMORY'da tasdiqlangan; ai-router PII-mask UZ. Lekin AI-chat javobi profil-tilidan til-direktivasi sifatida promptga uzatilishi (tavsiya #25) AI-chatda tasdiqlanmadi.

**17.27  🟡 qisman**  — ❓ Qoida-buzilishni AI aniqlaydimi (kamera+tahlil+rahbar+HR)? (EP-AI-027)
- Siz: A — AI-kamera+tahlildan buzilish aniqlaydi va ro'yxatlaydi (ShVB Q108/Q128)
- Isbot: ai_violations jadvali bor lekin yagona writer = hr-v2-seed (seed, real emas). IoT-modulda kamera violation-detect bor (drizzle-camera-ai.repo.ts). AI-markaziy buzilish-yig'gich yo'q; ai_violations=0 qator.

**17.28  ❌ yo'q**  — ❓ AI-kamera hisoboti haqiqat bilan kross-tekshiruv qiladimi? (EP-AI-028)
- Siz: A — hisobot↔kamera kross-tekshiruv, nomoslik→rahbar/HR signal
- Isbot: ai_camera_cross_check jadvali bor (0 qator) lekin WRITER kodi topilmadi (grep cameraCrossCheck=0). Qurilmagan.

**17.29  🟡 qisman**  — ❓ Ko'nikma-matritsa→vorislar ro'yxati chiqaradimi? (EP-AI-029)
- Siz: A — skill-matrix + AI vorislar ro'yxati + ichki o'sish (KARTALAR Q32)
- Isbot: ai-fit.service.ts successionCandidate (fit_score>=85→true) ai_fit_scores'ga yoziladi. succession-compat.service.ts (compatibility) + director analytics succession bor. Skill-matrix→vorislar yagona oqim sifatida to'liq emas.

**17.30  ✅ bor**  — ❓ 3 kun yo'qlik→profil bloklash (AI chiqaradi)? (EP-AI-030)
- Siz: A — AI 3 kunda bloklaydi; ochish HR raport→direktor→super-admin (KARTALAR Q34)
- Isbot: cron/absence-block.cron.ts TO'LIQ: day1 ogoh→day2 eskalatsiya→day3 real blok (deactivateBlocks+insertBlock+blockEmployee+disableUserAccount), HR/direktor/dept-lead Telegram, 4 event emit. Cron 10:00.

**17.31  ❌ yo'q**  — ❓ AI'lar o'zaro ishlaydimi — quyi karta AI→yuqori rahbar AI agregat? (EP-AI-031)
- Siz: A — quyi kartalar AI'lari→yuqori AI'ga yig'iladi, yaxlit bo'lim xulosasi
- Isbot: AI↔AI bottom-up agregat kodi topilmadi (grep bottomUp|aggregateByManager|rollup = 0 natija). Decisions 'JAVOBLANGAN' = vizyon-hal, qurilmagan.

**17.32  🟡 qisman**  — ❓ AI provayder/xarajat nazorati — Gemini, limit sozlanadimi? (EP-AI-032)
- Siz: A — markazda limit+qaysi vazifaga AI yoqilgani; provayder=Gemini (ShVB Q150/Q151)
- Isbot: ai.types.ts TASK_PROVIDER_MAP default gemini; ai-router byudjet-gate (DAILY_BUDGET_USD, ai_usage_logs). ai_provider_configs 3 qator (gemini/claude/openai). LEKIN hammasi is_active=false, kalit yo'q — limit-sozlash UI/governance to'liq emas.

**17.33  ✅ bor**  — ❓ AI tavsiyasi avto-bajariladimi yoki odam tasdig'i kutadimi? (EP-AI-033)
- Siz: A — AI faqat tavsiya, har muhim qaror odam (HR/rahbar/direktor) tasdig'i bilan
- Isbot: ai-fit/daily-report fabrikatsiya-taqiq + tavsiya-only dizayni; aisha pending-approval (AISHA-JARVIS vizyon §13 'pending-approval mavjud'). ai-fit bonusRecommendation=tavsiya, avto-bajarmaydi.

**17.34  ✅ bor**  — ❓ Markaziy AI'ga ulanish — yagona master-data (karta-model, bitta DDL)? (EP-AI-034)
- Siz: A — yagona master-data, bitta DDL, AI+kamera+modul shunga ulanadi (KARTALAR Q40)
- Isbot: central-ai card_id=org_functions.id; org_functions yagona karta-jadval (97 qator, kanonik ADR-001). Ikki-olam yo'q (single master). AI shunga ulanadi.

**17.35  ❌ yo'q**  — ❓ Lavozim 'статистик кўрсаткичлар'ini AI avto-o'lchaydimi? (EP-AI-035)
- Siz: A — har karta o'z stat-ko'rsatkich ro'yxatiga ega, AI real ma'lumotdan hisoblab kartaga yozadi
- Isbot: org_functions: statistics_type 0/97 to'ldirilgan; maxsus 'statistik ko'rsatkichlar ro'yxati'+formula maydoni YO'Q (faqat tskp_target/unit). AI avto-hisoblab kartaga yozish kodi topilmadi.

**17.36  ❌ yo'q**  — ❓ 'Кўп учрайдиган хатолар' bankini AI buzilish belgilashga ishlatadimi? (EP-AI-036)
- Siz: A — har kartaga tipik-xatolar ro'yxati, AI ma'lumotdan topsa belgilaydi+izohlaydi
- Isbot: org_functions/card_folders'da 'tipik xatolar banki' maydoni YO'Q (card_folders: vazifa/javobgarlik/gsd/reglament/jarayon/talim, 0 qator). Xato-bank match kodi yo'q.

**17.37  ❌ yo'q**  — ❓ 'Муваффақиятли ҳаракатлар' bankidan AI ijobiy baho beradimi? (EP-AI-037)
- Siz: A — AI ijobiy+salbiy banklarning ikkalasini muvozanatli baholaydi
- Isbot: 'Muvaffaqiyatli harakatlar banki' DB-maydoni YO'Q (card_folders'da yo'q). AI muvozanatli (ijobiy+salbiy) baho kodi topilmadi. Faqat ai-fit strengths/gaps prompt'dan.

**17.38  ❌ yo'q**  — ❓ 'Муваффақиятли ҳаракатлар ва хатолар бланкалари'ni AI to'ldiradimi? (EP-AI-038)
- Siz: A — AI blankani real hodisalardan avto-to'ldiradi, rahbar tasdiqlaydi
- Isbot: Blanka jadvali/maydoni va AI-autoFill kodi topilmadi. Qurilmagan.

**17.39  🟡 qisman**  — ❓ ЦКП 'баҳоланадиган' bo'lishini AI tekshiradimi? (EP-AI-039)
- Siz: A — AI ЦКП matnini tekshiradi, o'lchovsiz bo'lsa aniqlashtiradi (KARTALAR Q29)
- Isbot: org_functions.tskp+tskp_target+tskp_measurement_unit maydonlari bor (o'lchov-struktura). AI ЦКП-matnni 'o'lchovlimi' deb VALIDATSIYA qiluvchi maxsus kod (validateMeasurable) topilmadi — struktura bor, AI-tekshiruv yo'q.

**17.40  🟡 qisman**  — ❓ 'Бекор туриш' (downtime)ni AI sabab bilan tahlil qiladimi? (EP-AI-040)
- Siz: A — har bekor turishni vaqt+sabab kategoriya+mas'ul karta bilan, haftalik jamlaydi
- Isbot: MES-modulida downtime ma'lumoti bor (IoT/OEE). AI sabab-kategoriya (logistika/material/mashina/hujjat) ajratish va mas'ul-karta biriktirish kodi AI-modulda topilmadi. Manba bor, AI-tahlil yo'q.

**17.41  ❌ yo'q**  — ❓ 'Режадан оғиш' (plan deviation)ni AI darajalaydimi? (EP-AI-041)
- Siz: A — og'ishni kattaligi/ta'siriga qarab daraja (kichik/o'rta/jiddiy)
- Isbot: PP-modulda reja bor; lekin AI rejadan-og'ishni darajalovchi (grade) kod topilmadi. Qurilmagan.

**17.42  ❌ yo'q**  — ❓ A-System/eski tizim (Bitrix24) ma'lumotini AI o'qiy oladimi? (EP-AI-042)
- Siz: A — tarixiy ma'lumot bir marta import→AI bazasiga (ShVB Q33: Bitrix24 olib tashlanadi)
- Isbot: A-System/Bitrix24 tarixiy-import kodi/jadvali topilmadi. Egasi-qaror ham aniqlanmagan (import alohida qaror).

**17.43  🟡 qisman**  — ❓ 'Назорат варақаси' o'qishini AI savol berib tekshiradimi? (EP-AI-043)
- Siz: A — AI har band uchun qisqa savol berib tushunishni tekshiradi (faqat tugma emas)
- Isbot: ai-exam.service.ts real (assignExamToCard, submitAttempt, getAttemptsByCard) + ai_exam_attempts jadval. 'Nazorat varaqasi' band-darajali tushunish-tekshiruvi sifatida AYNAN ulanishi tasdiqlanmadi — imtihon-dvigatel bor, control-sheet bog'lanish yo'q.

**17.44  🟡 qisman**  — ❓ Kunlik/haftalik/oylik hisobot uchchasini AI birga tayyorlaydimi? (EP-AI-044)
- Siz: A — uch xil: kunlik(fakt+og'ish)/haftalik(trend)/oylik(tahlil+tavsiya) (ShVB Q113/Q116)
- Isbot: Kunlik ЦКП cron real (ai-daily-report.cron.ts). Haftalik=faqat forecast-weekly.job. Oylik AI-tahlil+tavsiya hisoboti cron'i topilmadi. 3-davriylik to'liq emas (1/3 real).

**17.45  ❌ yo'q**  — ❓ Hisobotni AI bevosita rahbarga (manager_id) yo'naltiradimi? (EP-AI-045)
- Siz: A — AI hisobotni org-strukturadagi bevosita rahbarga avto-marshrutlaydi (ShVB Q78-80)
- Isbot: org_functions.manager_id bor (struktura), lekin AI-hisobotni manager_id bo'yicha avto-marshrutlash kodi topilmadi (grep routeToManager apps/api/src/modules/ai/=0). Qurilmagan.

**17.46  🟡 qisman**  — ❓ Javobgarlik bandlariga AI bog'lab baho beradimi? (EP-AI-046)
- Siz: A — har baho/hisobot kartaning javobgarlik bandlariga to'g'ridan bog'lanadi (KARTALAR Q7)
- Isbot: card_folders.javobgarlik (text) maydoni bor (6-bo'lim papka) lekin 0 qator. AI bahoni javobgarlik-bandiga bog'lash kodi yo'q. Struktura bor, data+ulanish yo'q.

**17.47  ❌ yo'q**  — ❓ Energiya tejash (сув/газ/свет)ni AI nazorat qiladimi? (EP-AI-047)
- Siz: A — счётчик/IoT bo'lsa AI sarfni kuzatadi, isrofga signal (o'lchov yo'q bo'lsa C realroq)
- Isbot: Energiya/счётчик o'lchov jadvali va AI-monitor kodi topilmadi. Egasi ham 'o'lchov asbobi yo'q→keyin' deb shubha bildirgan (v2 Q47 izoh). Qurilmagan.

**17.48  🟡 qisman**  — ❓ 'Бўлим ходимларини доимий баҳолаб боради' — AI rahbarga baho-draft beradimi? (EP-AI-048)
- Siz: A — AI har qo'l-ostidagi xodim uchun davriy baho-draft, rahbar tasdiqlaydi (ShVB Q114, KARTALAR Q30)
- Isbot: ai-fit.service.ts evaluate() per-xodim baho-draft (fit_report) tuzadi va saqlaydi — mexanizm bor. LEKIN 'davriy/doimiy' avto-draft cron (har bo'lim xodimi uchun) topilmadi; faqat so'rovga ko'ra (POST /ai/fit/evaluate). Yarim: draft bor, doimiylik-avtomatizm yo'q.

**17.49  🟡 qisman**  — ❓ AI takror-xatoni guruhlab ildiz-sababini ko'rsatadimi (Хатоларни тизимли таҳлил)?
- Siz: Yakka xato=tasodif, takror=tizimli muammo; AI guruhlab ildizni ko'rsatadi
- Isbot: director-ai.service.ts:68,97 rootCauses[] LLM-tahlilda bor, lekin xato-guruhlash/takror-ajratish strukturali kod yo'q; ai_violations jadvali bo'sh

**17.50  🟡 qisman**  — ❓ AI ehtiyojni 1-sutkalik rejadan oldindan ogohlantiradimi (эҳтиёжларни олдиндан ҳис)?
- Siz: AI rejani o'qib logistikaga oldindan signal beradi, bekor turish kamayadi
- Isbot: ai-planning.service.ts + forecast-demand.tool.ts mavjud (talab prognozi), lekin '1-sutka reja→uchastka signali' aniq oqimi qurilmagan; ai_planning_decisions=0

**17.51  ✅ bor**  — ❓ AI kirill o'zbek + rus + lotinni birdek o'qiydimi?
- Siz: Real hujjatlar kirill/rus; AI hammasini tushunishi shart
- Isbot: Gemini/Claude ko'p-tilli; pii-redactor + ai-router til-direktiva; i18n 3-til config (MEMORY). LLM-darajada qo'llab-quvvatlanadi

**17.52  🟡 qisman**  — ❓ AI xulosasini odam sabab bilan bekor qila oladimi (override + feedback)?
- Siz: Qaror odamda; override+sabab AI'ga teskari bog'lanib qaytadi
- Isbot: ai_decision_log.human_override ustuni + getRecentDecisions(onlyIncorrect) bor (ai-decision-log.service.ts:167,193); lekin ai_overrides jadvali ORFAN (kod yo'q), feedback-loop kalibrlashga ulanmagan

**17.53  🟡 qisman**  — ❓ AI baho/xulosasi uchun isbot havolasi (audit izi, drill-down) bo'ladimi?
- Siz: Холис baho; har raqam ortida hodisa havolasi, nizoda himoya
- Isbot: ai_decision_log inputData+inputHash+SHA-256 yozadi (ai-decision-log.service.ts:120-160) = audit izi bor; lekin FE drill-down/hodisa-havolasi UI tasdiqlanmadi, jadval bo'sh

**17.54  ✅ bor**  — ❓ AI ma'lumot yetmaganda ochiq aytadimi (taxminni fakt qilmaydi)?
- Siz: Yashil-lekin-noto'g'ri eng xavfli; AI rostgo'y bo'lishi shart
- Isbot: ai-daily-report.service.ts:14-18 aiAvailable=false/needsManualValue=true, soxta son YO'Q; forecast confidence<70%→HITL (ensemble-forecast.service.ts:214); ai-router kalit yo'q→Err

**17.55  ✅ bor**  — ❓ AI ogohlantirish ostonasini (threshold) rahbar/HR sozlaydimi?
- Siz: Sozlanadigan ostona, shovqin/kech-anglashni oldini oladi
- Isbot: state_thresholds jadvali=25 qator (jonli), company-state.service.ts o'qiydi; sozlanuvchi chegara mexanizmi real

**17.56  ❌ yo'q**  — ❓ Bir hodisa ikki kartaga tegishli bo'lsa AI kimga yozadi (asosiy+bog'liq)?
- Siz: AI asosiy sababkorni belgilab bog'liq kartalarni ko'rsatadi, ikki marta jazo yo'q
- Isbot: ai_decision_log entityId bitta UUID (toEntityUuid); ko'p-karta attributsiya/taqsimlash kodi topilmadi; vizyon-javob 17-band shuni talab qiladi lekin qurilmagan

**17.57  🟡 qisman**  — ❓ AI prognozi noto'g'ri chiqsa o'zini tuzatadimi (aniqlik kuzatuvi)?
- Siz: Tekshirilmagan prognoz 'bo'ri keldi'ga aylanadi; aniqlik foizi+model moslash
- Isbot: forecast.service.ts:66 calculateMetrics MAPE/RMSE hisoblaydi (in-sample); lekin prognoz↔keyingi-haqiqat solishtirib saqlanadigan kalibrlash sikli yo'q; ai_calibration_runs jadvali ORFAN (kod yo'q)

**17.58  ❌ yo'q**  — ❓ Yangi xodim bahosi moslashish davri bilan yumshatiladimi?
- Siz: Yangi xodimni absolyut emas, o'sish trendiga qarab baholash
- Isbot: ai-fit.service.ts cardId+employeeId baholaydi lekin probation/adaptatsiya davri istisnosi kodi topilmadi; HR sinov-muddati AI-bahosiga ulanmagan

**17.59  🟡 qisman**  — ❓ AI bahosi xodimga quriluvchi ohangda yetkaziladimi?
- Siz: Kamchilik+yaxshilash qadami birga (jazo emas, o'sish)
- Isbot: director-ai.service.ts quickWins[] (tavsiya) bor; ai-fit fallback izoh yozadi; lekin 'quriluvchi ohang' tizimli format/prompt-qoidasi alohida tasdiqlanmadi

**17.60  🟡 qisman**  — ❓ AI tavsiyasini rad etish ham qaror jurnaliga yoziladimi?
- Siz: Rad etilgan tavsiya+sabab audit uchun yoziladi, shaffoflik
- Isbot: ai_decision_log.autoExecuted+human_override bor (ai-decision-log.service.ts); lekin 'qabul/rad+sabab' uchun alohida ai_governance_log jadvali ORFAN (kod yo'q); to'liq qaror-jurnali emas

**17.61  🟡 qisman**  — ❓ AI tahlili har ko'rsatkich uchun mos davr-oynasi (kunlik/haftalik/oylik) ishlatadimi?
- Siz: Qisqa oyna tebranishga sezgir, uzun sekin; ko'rsatkichga mos oyna
- Isbot: forecast haftalik job (forecast-weekly.job.ts:96 @Cron dushanba), daily-report kunlik (08:00); lekin 'har metrikaga sozlanuvchi oyna' yagona param sifatida qurilmagan

**17.62  ❌ yo'q**  — ❓ AI xodimlarni faqat bir xil karta ichida solishtirib reyting beradimi?
- Siz: Mashinachini dizaynerga solishtirish adolatsiz; faqat bir xil lavozim ichida
- Isbot: ai-fit.service.ts individual baho beradi (cardId bo'yicha) lekin same-karta peer-reyting/percentile kodi topilmadi; ai_fit_scores=1 test qator, solishtirish logikasi yo'q

**17.63  🔑 egasi-data**  — ❓ AI ma'lumotni qancha vaqt saqlaydi (xodim tarixi retention)?
- Siz: Aktiv+arxiv muddati (rahbar 10y/ishchi 3y), keyin anonimlash
- Isbot: Retention partitioning vizyoni ShVB Q73/Q156 da bor; ai_* jadvallar createdAt bor lekin avtomatik retention/anonimlash cron topilmadi; muddat lavozim-turiga = egasi tasdig'i kutadi

**17.64  🟡 qisman**  — ❓ AI maxfiy hisobotni (PIP/eNPS) faqat ruxsat doirasida ko'radimi?
- Siz: AI butun data ko'rsa maxfiy ma'lumot xulosa orqali sizadi (fail-open muammosi)
- Isbot: pii-redactor.ts maxfiy maydonni (salary/INN/passport) tashqi LLM'ga yubormaydi; 4 global guard + RBAC bor (MEMORY); lekin AI-kontekst RBAC-scope filtri (HR/direktor doirasi) AI-fit/director'da aniq tekshirilmadi

**17.65  ✅ bor**  — ❓ AI ishlamay qolsa ERP ishlashda davom etadimi?
- Siz: AI=yordamchi qatlam; qulasa zavod to'xtamasin, gate kechiktiriladi
- Isbot: ai-router.service.ts:65-74 budjet/kalit yo'q→Err graceful; ai-daily-report aiAvailable=false→qo'lda davom; AI Err'i ERP'ni bloklamaydi (anti-fabrikatsiya dizayni)

**17.66  ❌ yo'q**  — ❓ AI холислик uchun tasdiqlangan ta'til/kasallik/planli-to'xtashni istisno qiladimi?
- Siz: Ruxsat etilgan yo'qlikni jazo deb hisoblash adolatsiz
- Isbot: AI-baho ta'til/leave istisnosi kodi topilmadi; LeaveModule bor lekin AI-fit/eval'ga 'approved absence exclude' ulanishi yo'q

**17.67  ❌ yo'q**  — ❓ AI har karta uchun eng yaxshilardan ideal profil (etalon) chiqaradimi?
- Siz: Mutlaq raqamdan ko'ra real eng-yaxshiga nisbatan baho
- Isbot: Ideal-profil/etalon hisoblash kodi topilmadi (top 10-15% tanlash, har oy yangilash); ShVB Q11 ideal-portret vizyonda bor lekin AI'da qurilmagan

**17.68  🟡 qisman**  — ❓ AI ko'rsatkich tushganda mos darslik/o'qishni tavsiya qiladimi?
- Siz: Tushish→sababga mos darslik bilan bog'lash, o'sish amaliy bo'lsin
- Isbot: ai-exam.service.ts:33 per-karta imtihon (org_function_id+razryad, hr_question_bank); LMS bor; lekin 'ko'rsatkich tushdi→aniq darslik tayinlash' avtomatik bog'lanish kodi tasdiqlanmadi

**17.69  🟡 qisman**  — ❓ AI hisobotida aralash geometriya (matn+jadval+grafik) standartmi?
- Siz: Trend grafik, taqqoslash jadval, sabab matn — har biri o'rnida
- Isbot: Dizayn-tizim shablon (Qoida 21/41) + FE forecast-ext grafik bor; lekin AI-hisobot uchun 'aralash standart format' yagona shablon sifatida tasdiqlanmadi

**17.70  🟡 qisman**  — ❓ AI 1-sutka rejani har kun real bajarilish bilan solishtiradimi?
- Siz: Bugungi og'ish ertangi rejaga ko'chadi; ketma-ket ta'sir ko'rinadi
- Isbot: ai-planning.service.ts + ai_planning_plans/decisions jadvallari bor; reja↔fakt kunlik solishtirish+ertangiga ko'chirish kodi to'liq tasdiqlanmadi; jadvallar bo'sh (=0)

**17.71  ❌ yo'q**  — ❓ AI yangi karta yaratilganda ko'rsatkich/xato/ЦКП/darslik taklif qiladimi?
- Siz: O'xshash kartalardan namuna, HR tahrirlab tasdiqlaydi, izchillik
- Isbot: Karta-shablon avto-taklif (suggestTemplate) kodi AI-modulda topilmadi; KARTALAR Q7 papka-shablon vizyonda bor lekin AI to'ldirish qurilmagan

**17.72  ❌ yo'q**  — ❓ AI rahbar va xodim baholarini solishtirib kelishmovchilik signali beradimi?
- Siz: Katta farq=yo rahbar xolis emas yo AI adashgan; HR/direktorga signal
- Isbot: Rahbar-bahosi↔AI-bahosi solishtirish/farq-signali kodi topilmadi; ikki baho-manba bog'lash mexanizmi yo'q

**17.73  ✅ bor**  — ❓ AI bashorati pessimistik/optimistik diapazon beradimi?
- Siz: Bitta raqam soxta aniqlik; diapazon+ishonch real ko'rsatadi
- Isbot: ensemble-forecast.service.ts:194-225 ci80Lower/Upper + ci95Lower/Upper (bootstrap quantile) + confidence; pessimistik/kutilgan/optimistik real qaytariladi

**17.74  ✅ bor**  — ❓ AI tijorat sirini tashqi provayderga chiqarmaslik kafolatlanadimi?
- Siz: Maxfiy ma'lumot (mijoz/narx/dizayn) tashqi AI'ga sizmasin (huquqiy)
- Isbot: pii-redactor.ts:18-26 phone/INN/MFO/passport/salary/IBAN/email tashqi LLM'ga [REDACTED] sifatida ketadi, javobda qayta tiklanadi (ikki-tomonlama maskalash)

**17.75  🟡 qisman**  — ❓ Bir nechta xodim bir kartaga bog'langanda AI qanday baholaydi (individual+karta)?
- Siz: Karta-markazli: har xodim individual + karta jamlangan ko'rsatkich
- Isbot: ai-fit.service.ts employeeId+cardId individual baho beradi; lekin karta bo'yicha jamlangan (smena-agregat) ko'rinish kodi alohida tasdiqlanmadi

**17.76  ❌ yo'q**  — ❓ AI tushuntirishi auditoriyaga (xodim vs rahbar) qarab chuqurlikni moslaydi mi?
- Siz: Xodimga sodda+amaliy, rahbarga tahlil+sabab
- Isbot: AI-tushuntirish chuqurligini auditoriya/rol bo'yicha moslaydigan kod (audience-aware depth) topilmadi; director-ai bir xil format beradi

**17.77  ❌ yo'q**  — ❓ AI o'zgarish (yangi qoida/jarayon) ta'sirini oldin/keyin kuzatadimi?
- Siz: Chora ishladimi — AI o'lchamasa bilib bo'lmaydi
- Isbot: O'zgarish-sanasi oldin/keyin ko'rsatkich solishtirish (before/after impact) kodi topilmadi; tizimli chora-tahlil qurilmagan

**17.78  ❌ yo'q**  — ❓ AI bo'limlararo estafeta (handoff) uzilishini topadimi?
- Siz: Tor joy ko'pincha uzatish nuqtasida; AI eng sekin uzatmani ko'rsatadi
- Isbot: process_chains jadvali=0 va AI-modulda handoff/estafeta kutish-vaqti o'lchash kodi topilmadi; bottleneck-detect vizyoni bor lekin uzatish-nuqtasi tahlili yo'q

**17.79  🟡 qisman**  — ❓ Xodim o'z joriy ko'rsatkichini real vaqtda ko'radimi (o'z-o'zini nazorat)?
- Siz: Kun oxirini kutmay xodim o'zi real vaqtda ko'rib tuzatsin
- Isbot: operator_daily_stats jadvali bor (MES KPI); lekin xodimga real-vaqt o'z-ko'rsatkich FE paneli AI-modulda tasdiqlanmadi; jadval bo'sh

**17.80  🟡 qisman**  — ❓ AI direktorga kunlik eng muhim 3-5 narsani ajratadimi?
- Siz: Hammasini ko'rsatish=hech narsa; diqqatni eng muhimga
- Isbot: get-today-briefing.tool.ts:34 'eng muhim 3 voqea' tool REAL bor (Aisha); lekin direktor-dashboardga priortizatsiya+drill-down to'liq oqimi tasdiqlanmadi

**17.81  🟡 qisman**  — ❓ AI ma'lumotni qanchalik tez yangilaydi (real-time vs batch aralash)?
- Siz: Operatsion=real-vaqtga yaqin, trend/baho=tunda batch
- Isbot: Aralash cron bor: forecast haftalik (dushanba), daily-report 08:00, ai-automation EVERY_HOUR/15min/30min (ai-automation.service.ts:30,56); arxitektura aralash, lekin sozlanuvchi reglament tasdiqlanmadi

**17.82  ❌ yo'q**  — ❓ AI xodimda charchash/tushish boshlanishini erta sezadimi?
- Siz: Yiqilishdan oldin aralashish arzon; sekin pasayish trendini sezish
- Isbot: ai_burnout_assessments jadvali DB'da bor lekin HECH QANDAY KOD yozmaydi/o'qimaydi (orfan; grep 0 natija); charchash-trend detektori qurilmagan

**17.83  🟡 qisman**  — ❓ AI Назорат варақаси o'qilmagan bandlarni kuzatib eslatadimi?
- Siz: Har band tasdiqlanishi shart; o'tkazib yuborilsa xodim tayyor emas
- Isbot: ai-exam.service.ts per-karta imtihon + LMS adaptatsiya bor; lekin band-darajasi 'o'qilmagan bandlarni kuzatish+eslatma' aniq kodi tasdiqlanmadi; ai_exam_attempts=0

**17.84  🟡 qisman**  — ❓ AI sabab-oqibat zanjirini chizib ildiz nuqtani belgilaydimi?
- Siz: Rahbar zanjir ildizini ko'rsa, oxirgi belgini emas asl sababni tuzatadi
- Isbot: director-ai.service.ts rootCauses[] LLM-tahlilda bor; lekin strukturali sabab-oqibat zanjiri (reja→logistika→mashina) chizish/process_chains=0 qurilmagan

**17.85  ❌ yo'q**  — ❓ AI baholash mezonini o'zgartirishni kim tasdiqlaydi (governance)?
- Siz: Mezon o'zgarishi markaziy (HR/direktor) tasdig'i + o'zgarish jurnali
- Isbot: ai_governance_log jadvali DB'da bor lekin HECH QANDAY KOD yozmaydi (orfan, grep 0); mezon-o'zgarish governance oqimi qurilmagan

**17.86  ❌ yo'q**  — ❓ AI o'lik (ma'lumot kelmayotgan) kartani aniqlaydimi?
- Siz: Ma'lumotsiz karta=ko'r nuqta; AI ro'yxatga olib sababini so'raydi
- Isbot: O'lik-karta detektori (uzoq ma'lumotsiz karta flag) kodi topilmadi; vizyon-javob 31-band 7-kun filtr deydi lekin qurilmagan

**17.87  🟡 qisman**  — ❓ AI mavsumiy/davriy naqshni hisobga oladimi (anomaliyadan ajratish)?
- Siz: Davriy tushishni anomaliya demaslik, soxta signal yo'q
- Isbot: holt-winters.service.ts mavsumiylikni forecast'da modellaydi (seasonal); lekin BAHOLASHDA normal davriylikni anomaliyadan ajratish (kalendar-naqsh) kodi yo'q

**17.88  🟡 qisman**  — ❓ AI hisobotini rasmiy formatda (sana+mas'ul+imzo) eksport qiladimi?
- Siz: Imzo+sana formati; nizoda dalil, arxivda izchil (kunlik=rasmiy invoys)
- Isbot: PDF infra bor (common/pdf/hr-pdf-generator.service.ts, export.service.ts, cc-pdf.service.ts); lekin AI-modul hisoboti aynan rasmiy-imzo-PDF sifatida chiqarish ulanishi tasdiqlanmadi

**17.89  🟡 qisman**  — ❓ AI ko'p hodisani jiddiylik bo'yicha tartiblaydimi (ustuvorlik)?
- Siz: Rahbar hammasiga qaray olmaydi; eng muhimi tepada, qolgani agregat
- Isbot: get-today-briefing 'eng muhim 3' + ai_alerts severity ustuni bor; lekin '10+ signalni ta'sir+jiddiylik+xarajat bo'yicha tartiblab 3-5 ko'rsatish' to'liq kodi tasdiqlanmadi; ai_alerts=0

**17.90  ❌ yo'q**  — ❓ AI xodim e'tirozini (shikoyat) qabul qilib qarorga qaytaradimi?
- Siz: E'tirozsiz baho bir tomonlama; e'tiroz kanali rahbarga borib qayta ko'riladi
- Isbot: ai_disputes jadvali DB'da bor lekin HECH QANDAY KOD yozmaydi/o'qimaydi (orfan, grep 0); e'tiroz/shikoyat oqimi qurilmagan

**17.91  ✅ bor**  — ❓ AI har xulosada o'z ishonch darajasini ko'rsatadimi?
- Siz: Past ishonchni yuqori kabi qabul qilish xato; rahbar darajani bilsin
- Isbot: forecast confidence (ensemble:225) + ai_decision_log.confidence ustuni (har qaror) + hitlReason '<70% past' (ensemble:214); ishonch+sabab real ko'rsatiladi

**17.92  🟡 qisman**  — ❓ AI zavod atamalarini (ЦКП, бекор туриш) izchil ishlatadimi?
- Siz: AI har safar boshqa so'z ishlatsa chalkash; rasmiy lug'atga sodiq
- Isbot: i18n + docs/LUGAT.md domain-lug'at bor; AI-promtlar o'zbek-direktiva (ai-router); lekin AI-javobda atamalar-lug'atiga majburiy bog'lash (terminology-enforce) kodi alohida yo'q

**17.93  🟡 qisman**  — ❓ AI bir karta bo'yicha eng yaxshi murabbiyni (mentor) topadimi?
- Siz: Yangi xodim qiynalsa eng yaxshidan o'rgansin; rahbar tasdiqlaydi
- Isbot: mentorships/mentorship_sessions jadvallari + mentorships-compat.controller.ts CRUD bor; lekin AI ko'rsatkich asosida murabbiy-TAVSIYA berish kodi yo'q (faqat qo'lda CRUD); jadval=0

**17.94  ❌ yo'q**  — ❓ AI soxta hisobotni statistik anomaliya orqali sezadimi (kameradan mustaqil)?
- Siz: Doim mukammal hisobot=yolg'on belgisi; raqam-naqshidan ham ushlash
- Isbot: Statistik g'ayritabiiy-bir-tekis hisobot-naqshini shubhali deb belgilash kodi topilmadi; ai_fraud_alerts jadvali bor lekin bu fraud uchun, hisobot-naqsh anomaliyasi qurilmagan

**17.95  ❌ yo'q**  — ❓ AI o'z xatosini tan oladimi (davriy kalibrlash hisoboti)?
- Siz: AI'ga ishonch aniqlik-tarixiga asoslanishi; o'z-aniqlik hisoboti
- Isbot: ai_calibration_runs jadvali DB'da bor lekin HECH QANDAY KOD/SCHEMA TS'da yozmaydi (orfan; grep 0, ai_calibration_runs=0); EP-AI-095 kalibrlash hisoboti qurilmagan

---

## 18 — Bildirishnoma / Botlar  (vizyon 27%, 82 savol)

**18.1  🟡 qisman**  — ❓ EP-NTF-001: ShVB 4 komanda /zvs_status, /my_gsd, /company_state, /weekly_digest qurilganmi?
- Siz: To'rttala ShVB komanda to'liq (YO'NALISH 38) — egasi tasdiqlagan
- Isbot: bot.helpers.ts:151,178,224 — /zvs_status, /company_state, /weekly_digest fin-botda REAL SQL bilan bor; lekin /my_gsd HECH QAYERDA topilmadi (grep)

**18.2  ❌ yo'q**  — ❓ EP-NTF-002: 'Mening holatim' tarkibi (karta+vazifa+haftalik foiz+razryad)?
- Siz: Karta-markazli holat: karta nomi+bugungi vazifa+haftalik natija+razryad
- Isbot: /my_gsd va karta-status komandasi yo'q; director.bot.ts faqat /kpi /ai /summary — shaxsiy karta-holat komandasi qurilmagan

**18.3  🟡 qisman**  — ❓ EP-NTF-003: Haftalik digest egasi-sozlanadigan vaqtda yuborilsinmi?
- Siz: Egasi har modul uchun vaqt belgilaydi (Q140); default Du 10:00
- Isbot: fp-cycle.cron.ts hardcoded @Cron('0 9 * * 2/3'); notification_schedules jadval count=0 — egasi UI'dan sozlash YO'Q, cron qattiq kodda

**18.4  🟡 qisman**  — ❓ EP-NTF-004: Haftalik digest org-marshrut bo'yicha (har kim o'z darajasini)?
- Siz: Vysotskiy: operator o'zini, bo'lim boshlig'i bo'limini, ega hammasini
- Isbot: fp-cycle ZVS faqat manager'larga (telegram_chat_id bor active); daraja-bo'yicha umumlashtirish/marshrutlash qurilmagan

**18.5  🟡 qisman**  — ❓ EP-NTF-005: FP-tsikl (rejalashtir→bajar→bahola→hisobot) eslatmalari?
- Siz: To'liq FP-tsikl har bosqichda alohida eslatma
- Isbot: fp-cycle.cron.ts REAL: Se 09:00 ЗВС + Ch 09:00 GSD Telegram eslatmalari bor, lekin 4-bosqichli to'liq tsikl emas, 2 cron

**18.6  ❌ yo'q**  — ❓ EP-NTF-006: Holat-alert chegaradan o'tganda darrov signal?
- Siz: Natija belgilangan chegaradan past bo'lsa darrov alert
- Isbot: alerts.service.ts bor lekin threshold-trigger + debounce qurilmagan; BullMQ yo'q, alert-debounce (EP-NTF-038) mexanizmi yo'q

**18.7  ❌ yo'q**  — ❓ EP-NTF-007: Alert chegaralarini egasi/rahbar har modul uchun belgilaydi?
- Siz: Egasi har karta/modul chegarasini o'zi qo'yadi (Q140)
- Isbot: Chegara-konfiguratsiya jadvali (kanban_column_sla h.k.) count=0; egasi-sozlash UI/jadval yo'q

**18.8  🟡 qisman**  — ❓ EP-NTF-008: Kanal: shaxsiy natija shaxsiy chatga, bo'lim xulosasi guruhga?
- Siz: Aralash: maxfiy shaxsiy, jamoaviy guruh
- Isbot: users.telegram_chat_id (shaxsiy) + org_nodes.telegram_group_id (guruh) ustunlari bor; lekin avtomatik shaxsiy/guruh ajratish marshruti qurilmagan

**18.9  🟡 qisman**  — ❓ EP-NTF-009: Telegram guruhlarini org-tugunga bog'lash (avtomatik aniqlash)?
- Siz: Har org-tugun o'z guruhi, avtomatik aniqlanadi
- Isbot: org_nodes.telegram_group_id ustuni JONLI mavjud (bog'lash nuqtasi tayyor); lekin guruh-org marshrut to'liq ishlatilmaydi

**18.10  🟡 qisman**  — ❓ EP-NTF-010: Kim-nima-oladi vertikal yo'naltirish (manager_id zanjiri)?
- Siz: Keyingi yuqori daraja avtomatik oladi (Vysotskiy)
- Isbot: cc-org-resolver.service.ts:127-164 manager_id zanjiri + org-tree fallback REAL (CC modulida); lekin NTF jadvali bunga ulanmagan, alohida

**18.11  🟡 qisman**  — ❓ EP-NTF-011: '/company_state' tarkibi (7 otdeleniye ko'rsatkichlari)?
- Siz: 7 otdeleniye: ishlab chiqarish/sotuv/sifat/pul
- Isbot: bot.helpers.ts:178-198 /company_state kassa balansi+30-kun kirim/chiqim+overdue REAL; lekin 7-otdeleniye to'liq panorama emas (moliya-fokus)

**18.12  ❌ yo'q**  — ❓ EP-NTF-012: Leaderboard (top-3/past-3) digestda?
- Siz: Bo'lim+shaxs top-3 va past-3 reyting
- Isbot: Digest leaderboard NTF'da qurilmagan; gamification alohida modulda, NTF digestga ulanmagan

**18.13  ❌ yo'q**  — ❓ EP-NTF-013: Karta-AI bahosi (mos/qisman/mos emas) digestda?
- Siz: Har hafta AI xulosasi digestga qo'shiladi
- Isbot: NTF digestda karta-AI baho yetkazish qurilmagan; AI-fit hisoboti NTF orqali bormaydi

**18.14  ❌ yo'q**  — ❓ EP-NTF-014: Razryad o'zgarishi xabari (xodim+rahbar+HR)?
- Siz: Razryad o'zgarsa 3 adresatga (oylik bilan)
- Isbot: razryad.changed NTF eventi/listeneri topilmadi; razryad→NTF zanjiri ulanmagan

**18.15  🟡 qisman**  — ❓ EP-NTF-015: Bildirishnoma profil tilida (lotin/kirill/rus)?
- Siz: Har xodim profilidagi tilda (i18n 3-til)
- Isbot: notifications jadvalida title_uz/title_ru/message_uz/message_ru + locales/uz,ru,uz-cyr/notifications.json bor; per-user til tanlash marshruti qisman, snapshot-at-enqueue yo'q

**18.16  ❌ yo'q**  — ❓ EP-NTF-016: O'qilganini tasdiqlash (muhim xabarlarda ACK tugma)?
- Siz: Muhim xabarlarda inline ACK tugma — 'ko'rmadim' bahonasini yo'qotadi
- Isbot: notifications jadvalida read_at/read bor (web), lekin Telegram inline-keyboard ACK tugma + callback_query ack qurilmagan; ack_at ustuni yo'q

**18.17  🟡 qisman**  — ❓ EP-NTF-017: Javob bermasa avtomatik eskalatsiya (manager_id)?
- Siz: Vaqt o'tsa keyingi yuqori darajaga chiqsin
- Isbot: CC SLA cron escalateApprovals() REAL (cc-sla.cron.ts) lekin faqat cc_documents uchun; umumiy NTF eskalatsiya-taymeri (BullMQ) yo'q

**18.18  ❌ yo'q**  — ❓ EP-NTF-018: Tinchlik vaqti (tunda faqat shoshilinch)?
- Siz: Ish vaqti normal, tunda faqat KRITIK; egasi sozlaydi
- Isbot: quiet-hours/tinchlik-oyna logikasi va sozlama jadvali yo'q; priority='CRITICAL' istisno mexanizmi qurilmagan

**18.19  ✅ bor**  — ❓ EP-NTF-019: Modullararo per-modul bot ERP'ga ulangan?
- Siz: Har modul o'z boti, hammasi bitta ERP'ga ulangan (Q50/Q101/Q102)
- Isbot: bot-gateway.controller.ts /bot/:bot/webhook 9 modul-bot (crm/mes/hr/logistics/fin/qc/director/ombor/pos), har biri ERP DB'ga jonli SQL — egasi vizyoniga to'liq mos

**18.20  ❌ yo'q**  — ❓ EP-NTF-020: Digestga PDF/grafik biriktirish?
- Siz: Matn + bosib ko'riladigan PDF birga
- Isbot: Digest PDF biriktirish + Reports-503 fallback qurilmagan; telegram.service sendMessage faqat matn (HTML)

**18.21  🟡 qisman**  — ❓ EP-NTF-021: Telegram orqali javob/buyruq (tugma bilan)?
- Siz: Tasdiqla/rad et/topshiriq tugma bilan interaktiv
- Isbot: bot-gateway callback_query qabul qiladi (controller:38-42) lekin inline-keyboard tugmali tasdiq-flow botlarda qurilmagan

**18.22  ✅ bor**  — ❓ EP-NTF-022: Bot komandalariga RBAC (org-daraja)?
- Siz: Har kim faqat o'z huquqidagini so'raydi
- Isbot: director.bot.ts:21 hasBotPermission('director', msg.role) + TelegramAuthGuard — RBAC REAL ishlaydi

**18.23  🟡 qisman**  — ❓ EP-NTF-023: Yangi xodim ulanishi (HR Telegram havola/OTP)?
- Siz: HR qo'shganda Telegram deep-link/kod avtomatik; 24h amal
- Isbot: users.telegram_id UNIQUE linking ustuni bor; manager-bot deep-link grep topdi (hr/telegram-bots) lekin 24h OTP token + HR 'qayta yuborish' tugma to'liq qurilmagan

**18.24  🟡 qisman**  — ❓ EP-NTF-024: Oltin-ip (buyurtma) holati bo'yicha bildirishnoma?
- Siz: Har bosqichda mas'ul+sotuv menejeri+(kechiksa)rahbar
- Isbot: order-created-notification.listener.ts:42-50 REAL saqlaydi; lekin har-bosqich-marshrut (status zanjiri) to'liq emas, faqat 'created'

**18.25  ❌ yo'q**  — ❓ EP-NTF-025: Kechikish/muddat signali (ikki bosqich)?
- Siz: Muddatdan oldin eslatma + o'tsa signal (rahbarga ham)
- Isbot: Ikki-bosqichli muddat-taymer (oldindan+o'tganda) qurilmagan; BullMQ delayed-job yo'q, muddat eslatma mexanizmi yo'q

**18.26  ❌ yo'q**  — ❓ EP-NTF-026: ЦКП bajarilishi haqida haftalik xabar?
- Siz: Har hafta ЦКП foizi xodim va rahbariga
- Isbot: ЦКП-NTF zanjiri qurilmagan; ckp.weekly eventi/cron topilmadi

**18.27  🟡 qisman**  — ❓ EP-NTF-027: Bildirishnoma jurnali (kim/qachon/o'qildimi)?
- Siz: To'liq jurnal ERP ichida ko'rinadi
- Isbot: notifications jadval 3735 qator + read_at/sent_via_telegram tracking + notifications.controller GET/my-unread-count; lekin notification_logs count=0, to'liq audit-jurnal alohida emas

**18.28  ❌ yo'q**  — ❓ EP-NTF-028: Shablonlarni egasi/admin ERP ichidan tahrirlaydi?
- Siz: Egasi kodga tegmasdan shablonni tahrirlaydi (TelegramBotAdmin)
- Isbot: notification-schema.service.ts faqat ensurePreferencesTables() — shablon-tahrir CRUD yo'q; i18n json statik, admin UI'dan tahrirlanmaydi

**18.29  🟡 qisman**  — ❓ EP-NTF-029: Avariya/to'xtash signali (usta+texnik+boshliq)?
- Siz: Ishlab chiqarish to'xtasa darrov 3 adresatga
- Isbot: mro-machine-stopped-notification.listener.ts:41-48 MroMaintenanceStopEvent → direktorga REAL saqlaydi; lekin 3-adresat parallel fan-out emas, faqat direktor

**18.30  ❌ yo'q**  — ❓ EP-NTF-030: Maqtov/tanbeh (top ochiq, past shaxsiy)?
- Siz: Top maqtov guruhda, past shaxsiy eslatma
- Isbot: Feedback/maqtov NTF zanjiri qurilmagan; gamification alohida, NTF'ga ulanmagan

**18.31  ❌ yo'q**  — ❓ EP-NTF-031: 6 turdagi 'yozma majburiy' xabar avtomatik rasmiy yozuvga aylansinmi?
- Siz: Qaror/reja/vazifa/texkarta/sifat/ogohlantirish Telegramdan rasmiy yozuv (raqam+sana+muallif)
- Isbot: Yozma-rasmiylashtirish (ntf.written.formalize) qurilmagan; Telegram xabarni rasmiy ERP-yozuvga aylantiruvchi handler yo'q

**18.32  ❌ yo'q**  — ❓ EP-NTF-032: Og'zaki topshiriq 24 soat ichida yozma qayd — bot kuzatsinmi?
- Siz: Og'zaki kiritilsa 24h yozma talab, bo'lmasa eskalatsiya
- Isbot: kanban_tasks source='verbal' + verbal_confirmed_at kuzatuvi va 24h taymer qurilmagan; BullMQ yo'q

**18.33  ❌ yo'q**  — ❓ EP-NTF-033: Tex-kartada xato — 15 daqiqalik signal cron?
- Siz: Xato → bosh texnologга darrov + 15daq taymer → RD-4 eskalatsiya (egasi tasdiqlagan)
- Isbot: TechCardErrorDetectedEvent listeneri + 15-daqiqa taymer HECH QAYERDA yo'q (grep techcard.*15); BullMQ-asosli taymer yo'q

**18.34  ❌ yo'q**  — ❓ EP-NTF-034: Tex-karta tuzatish — 1 soatlik countdown (45/60 daq)?
- Siz: 1 soat countdown, 45-daq eslatma, 60-daq RD-5 signal
- Isbot: 1-soat tuzatish-taymer (ntf.techcard.fix1hour) qurilmagan; ketma-ket taymer mexanizmi yo'q

**18.35  ❌ yo'q**  — ❓ EP-NTF-035: Tungi smena telefon-eskalatsiyasi (qildi/javob qayd)?
- Siz: Tungi muammo 'telefon qilindi→javob' qayd; bermasa ertalab rahbarga
- Isbot: Tungi telefon-protokol qayd (call.log) qurilmagan; telefon-qo'ng'iroq qayd jadvali yo'q

**18.36  ❌ yo'q**  — ❓ EP-NTF-036: Tungi yakka qaror maxsus belgi + ertalab digest?
- Siz: 'Tungi yakka qaror' belgisi → ertalab bosh texnolog+RD-5 digestda
- Isbot: night.soloDecision belgisi/qaydi qurilmagan; tungi-yakka-qaror digesti yo'q

**18.37  ❌ yo'q**  — ❓ EP-NTF-037: Bevosita rahbarni chetlab o'tish (favqulodda) signali?
- Siz: Chetlab o'tilsa sabab so'raladi + asl rahbarga nusxa
- Isbot: bypass.emergency flow qurilmagan; favqulodda-chetlash + asl-rahbar nusxa yo'q

**18.38  🟡 qisman**  — ❓ EP-NTF-038: Yuboruvchi vs qabul qiluvchi masъuliyatini ajratsinmi?
- Siz: Har xabarda yuboruvchi+qabul qiluvchi+ko'rilgan vaqt (ikki tomonli)
- Isbot: notifications jadvalida user_id (qabul qiluvchi)+read_at bor, lekin sender_id/yuboruvchi-masъuliyat alohida saqlanmaydi; ikki-tomonli ajratish yo'q

**18.39  ❌ yo'q**  — ❓ EP-NTF-039: Mijoz bilan bog'liq muammo savdo menejeriga avtomatik?
- Siz: 'Mijoz masalasi' → buyurtma savdo menejeriga (RD-5)
- Isbot: problem.routeSales avtomatik yo'naltirish qurilmagan; brak-tabiat→savdo marshruti yo'q

**18.40  ❌ yo'q**  — ❓ EP-NTF-040: RD-2/RD-4/RD-5 uchlik yig'ilish chaqirig'i (1 soat)?
- Siz: 3 rahbarga signal + 1soat taymer + qaror qaydi
- Isbot: trio.meeting1hour chaqiriq+taymer qurilmagan; uchlik-yig'ilish mexanizmi yo'q

**18.41  ❌ yo'q**  — ❓ EP-NTF-041: 'Vaqtincha to'xtatish' qarori butun zanjirga e'lon?
- Siz: To'xtash → buyurtma kartasidagi barcha masъulga signal
- Isbot: halt.broadcast zanjir-e'lon qurilmagan; to'xtash-qaror fan-out yo'q

**18.42  ❌ yo'q**  — ❓ EP-NTF-042: Yangi оргополитика e'loni (НО-3+adaptatsiya, 1 kun)?
- Siz: Yangi оргополитика → НО-3+adaptatsiya menejeriga + 1kun o'qitish (egasi Q55)
- Isbot: orgpolicy.announce signal qurilmagan; НО-3/adaptatsiya-menejer NTF zanjiri yo'q

**18.43  ❌ yo'q**  — ❓ EP-NTF-043: Takroriy xato → оргополитика yozish topshirig'i?
- Siz: Bir xil xato 2-marta → bo'lim boshlig'iga 'оргополитika yoz' + НО-3 nusxa
- Isbot: repeatError.policy (defect_type_code takror sanash → Kanban vazifa) qurilmagan

**18.44  ❌ yo'q**  — ❓ EP-NTF-044: Kun yakuni НО-3 hisoboti avtomatik eslatma?
- Siz: Smena oxirida masъulga eslatma; bermasa НО-3'ga signal
- Isbot: no3.dailyReport kunlik eslatma+nazorat qurilmagan; kun-yakuni НО-3 cron yo'q

**18.45  🟡 qisman**  — ❓ EP-NTF-045: Kunlik/haftalik/oylik hisobot uchligi (3 ritm)?
- Siz: 3 alohida eslatma, har biri o'z adresati bilan
- Isbot: fp-cycle haftalik ZVS/GSD bor lekin kunlik+oylik 3-ritm uchligi to'liq qurilmagan; report.triRhythm yo'q

**18.46  ❌ yo'q**  — ❓ EP-NTF-046: Smenalik hisobot (texnolog → bosh rejalashtiruvchi)?
- Siz: Smena oxirida eslatma + bosh rejalashtiruvchiga avtomatik yo'naltirish
- Isbot: shift.report eslatma+yo'naltirish qurilmagan; mes_shift_schedules asosida cron yo'q

**18.47  ❌ yo'q**  — ❓ EP-NTF-047: Xom-ashyo yetishmasligi → bosh rejalashtiruvchiga darhol?
- Siz: Zaxira yetmasa darhol rejalashtiruvchi+ta'minotga signal
- Isbot: material.shortage signal (warehouse_stock min_threshold trigger) qurilmagan; zaxira-yetishmaslik NTF yo'q

**18.48  ❌ yo'q**  — ❓ EP-NTF-048: Roxler (jihoz) nosozligi — eng yuqori ustuvor signal?
- Siz: Jihoz nosozligi → boshliqga eng yuqori ustuvor (boshqalar ustida)
- Isbot: EquipmentFaultEvent listeneri + KRITIK-ustuvorlik yo'naltirish qurilmagan (grep equipment.fault topmadi NTF'da)

**18.49  ❌ yo'q**  — ❓ EP-NTF-049: Kechikish xavfi 'darhol xabardor' tugmasi?
- Siz: Bitta 'kechikish xavfi' tugma → boshliqga darhol+qayd
- Isbot: delayRisk.button (bitta-tugma signal+qayd) qurilmagan; operator delay-risk tugma yo'q

**18.50  ❌ yo'q**  — ❓ EP-NTF-050: 'O'z vaqtida xabar bermaslik' kamchiligini qayd qilsinmi?
- Siz: Muammo-vaqti vs xabar-vaqti farqi qayd → oylik KPI
- Isbot: lateReport.measure (vaqt-farq hisoblash → KPI) qurilmagan

**18.51  ❌ yo'q**  — ❓ EP-NTF-051: Kartochka status o'zgarishi → keyingi masъulga avtomatik?
- Siz: Har status o'zgarishida keyingi bosqich masъuliga signal
- Isbot: OrderStatusChangedEvent/card.statusChange listener faqat log-stub; orphan-events.listener.ts:92 kanban.task.moved 'TODO: notify' — saqlamaydi/yubormaydi

**18.52  ❌ yo'q**  — ❓ EP-NTF-052: Kartochka 'Тасдиқда' tasdiq-kutish signali?
- Siz: Tasdiqlovchiga darhol+qayta eslatma→yuqoriga
- Isbot: card.approvalWait signal+eskalatsiya qurilmagan; Тасдиқда-status NTF yo'q

**18.53  ❌ yo'q**  — ❓ EP-NTF-053: ТТ to'liqsiz kelganda dizaynerga/savdoga signal?
- Siz: Majburiy maydon bo'sh → savdoga 'to'ldiring', dizaynerга ish berilmaydi
- Isbot: tt.incomplete (TtValidationService trigger) qurilmagan; ТТ-to'liqlik tekshiruvi NTF zanjiri yo'q

**18.54  ❌ yo'q**  — ❓ EP-NTF-054: Korrektor xato topganda dizaynerga darhol + blok?
- Siz: Korrektor xato → dizaynerga darhol + keyingi bosqich bloklanadi
- Isbot: corrector.block (KanbanBlockRequestedEvent) qurilmagan; korrektor→blok zanjiri yo'q

**18.55  ❌ yo'q**  — ❓ EP-NTF-055: Dizayner tasdiqsiz fayl yuborgani signali?
- Siz: Fayl tasdiq belgisisiz yuborilsa → rahbarga signal+qayd
- Isbot: file.unapproved (design_files.approved_by NULL tekshiruv) qurilmagan

**18.56  ❌ yo'q**  — ❓ EP-NTF-056: Og'zaki reja 'rasmiy emas' ogohlantirishi?
- Siz: Yozma qayd yo'q rejaga 'rasmiy emas' belgisi+ogohlantirish
- Isbot: plan.notFormal belgisi/ogohlantirish qurilmagan

**18.57  ❌ yo'q**  — ❓ EP-NTF-057: Reja o'zgarishi → barcha bog'liq bo'limga e'lon (gorizontal)?
- Siz: Reja o'zgarishi → bog'liq bo'limlarga avtomatik e'lon+ko'rgani qayd
- Isbot: plan.broadcast (workflow_rules asosida gorizontal e'lon) qurilmagan; NTF gorizontal-marshrut yo'q

**18.58  ❌ yo'q**  — ❓ EP-NTF-058: Аналитik kommunikatsiya: Совершенствование xulosalari kanali?
- Siz: Analitik xabarlar alohida kanal, faqat Совершенствование'dan
- Isbot: analytic.channel alohida kanal/belgi qurilmagan

**18.59  ❌ yo'q**  — ❓ EP-NTF-059: Brak holatida rol-cheklab yo'naltirish (texnik→texnolog, mijoz→savdo)?
- Siz: Brak tabiati bo'yicha to'g'ri rolга, har rol o'z vakolatida (egasi tasdiqlagan)
- Isbot: defect.routeByRole (brak-tabiat→rol marshrut) qurilmagan; QC defect→NTF rol-yo'naltirish yo'q

**18.60  ❌ yo'q**  — ❓ EP-NTF-060: Shikastlangan xom-ashyo xabar tartibi + karantin belgisi?
- Siz: Shikast → ta'minot/rahbarga darhol + material karantin belgisi
- Isbot: material.damaged signal+karantin qurilmagan

**18.61  🟡 qisman**  — ❓ EP-NTF-061: Eslatma turlari belgilari (🔴signal/⏰muddat/✅tasdiq/📋qaror/📊digest)?
- Siz: Har tur o'z belgisi bilan, bir qarashda ajratiladi
- Isbot: botlar emoji ishlatadi (director.bot ✅⚠️❌), notifications jadval priority/type ustunlari bor; lekin 5-tur tizimli belgi-tasnif qurilmagan

**18.62  🟡 qisman**  — ❓ EP-NTF-062: Alert ustuvorlik 3 daraja (KRITIK/MUHIM/ODDIY)?
- Siz: 3 daraja: jihoz/to'xtash→kechikish/muddat→hisobot/digest
- Isbot: notifications.priority ustuni mavjud (varchar) lekin 3-darajali tartiblash+ko'rsatish logikasi qurilmagan

**18.63  ❌ yo'q**  — ❓ EP-NTF-063: 'Darhol' xabarlar tunda o'tadimi (KRITIK istisno)?
- Siz: Faqat KRITIK tunda, qolgani ertalabga (egasi tasdiqlagan)
- Isbot: quiet.criticalException qurilmagan; tinchlik-oyna + KRITIK-istisno logikasi yo'q (priority='CRITICAL' bypass ishlatilmaydi)

**18.64  ❌ yo'q**  — ❓ EP-NTF-064: Muddat eslatmasi ikki bosqich (oldindan+o'tganda)?
- Siz: Oldindan eslatma + o'tsa rahbarga signal
- Isbot: deadline.twoStage (15daq/1soat/1kun yagona qoida) qurilmagan; muddat-taymer mexanizmi yo'q

**18.65  ❌ yo'q**  — ❓ EP-NTF-065: Departament-darajasida umumlashtirilgan hisobot (vertikal)?
- Siz: Yuqoriga chiqqanda umumlashadi (operator→bo'lim→departament)
- Isbot: report.aggregateVertical (daraja-umumlashtirish) qurilmagan; xabarlar umumlashmaydi

**18.66  ❌ yo'q**  — ❓ EP-NTF-066: Masъuliyat lavozimga (kartaga) bog'lab yo'naltirish?
- Siz: Xabar kartaga → joriy egasiga; xodim almashsa avtomatik (egasi karta-model)
- Isbot: notifications.user_id (XODIMGA, kartaga emas) ishlatadi; recipient_card_id ustuni YO'Q — karta-markazli marshrut qurilmagan

**18.67  ❌ yo'q**  — ❓ EP-NTF-067: Masъuliyatni og'zaki o'tkazish taqiqi (faqat yozma)?
- Siz: Masъuliyat faqat rasmiy yozma topshiriq orqali
- Isbot: responsibility.writtenOnly (rasmiy o'tkazma forma) qurilmagan

**18.68  ❌ yo'q**  — ❓ EP-NTF-068: Oylik masъuliyat tahlili digesti (Совершенствование)?
- Siz: Oy yakunida masъuliyat digesti (qaror→masъul→natija)
- Isbot: monthly.responsibilityDigest qurilmagan; oylik masъuliyat-tahlil event-yig'ish yo'q

**18.69  ❌ yo'q**  — ❓ EP-NTF-069: Rasmiy ma'lumot talabi (Совершенствование, muddat bilan)?
- Siz: Ma'lumot talabi → boshliqga signal+muddat taymeri+eslatma
- Isbot: dataRequest.deadline qurilmagan

**18.70  ❌ yo'q**  — ❓ EP-NTF-070: Eski ma'lumot ustida ishlash ogohlantirishi (versiya)?
- Siz: Hujjat yangilansa eski versiyani ochganlarga 'qarang' signali
- Isbot: staleData.warn (ntf_doc_views jadval count=0) qurilmagan; doc_version kuzatuvi yo'q

**18.71  ❌ yo'q**  — ❓ EP-NTF-071: Yig'ilish topshiriqlari uchun eslatma (muddat bilan)?
- Siz: Yig'ilish topshirig'i → muddat eslatma+bajarilmasa rahbarga
- Isbot: meeting.taskReminder qurilmagan

**18.72  ❌ yo'q**  — ❓ EP-NTF-072: Telefon-qo'ng'iroq qaydi (tungi protokol, ikki tomonli)?
- Siz: 'Qo'ng'iroq qildim' tugma+vaqt qayd, qarshi tomon 'javob berdim'
- Isbot: call.log ikki-tomonli qayd qurilmagan

**18.73  ❌ yo'q**  — ❓ EP-NTF-073: Buyurtma tugamasdan reja o'zgartirilsa signal+sabab?
- Siz: Reja o'zgarsa → qayd+sabab so'raladi+oylik tahlilga
- Isbot: plan.midOrderChange (PlanChangedMidOrderEvent) qurilmagan

**18.74  ❌ yo'q**  — ❓ EP-NTF-074: Kanban qotib qolgan kartochkaga signal?
- Siz: Kartochka belgilangan vaqtdan ko'p qotsa → masъul+boshliqga signal
- Isbot: kanban.stuck (kanban_column_sla jadval count=0) qurilmagan; SLA-threshold cron yo'q (CC-da bor lekin cc_documents uchun)

**18.75  ❌ yo'q**  — ❓ EP-NTF-075: Buyurtma bajarilishi hisoboti (RD-5 → rahbariyat)?
- Siz: Buyurtma yopilganda avtomatik reja/fakt/kechikish hisoboti
- Isbot: order.completionReport qurilmagan

**18.76  ❌ yo'q**  — ❓ EP-NTF-076: Bir bo'lim boshqaning vazifasiga aralashganda signal (gorizontal chegara)?
- Siz: Vakolatdan tashqari qaror → tegishli boshliqga signal+qayd
- Isbot: scope.violation (workflow_rules chegara-qoidasi) qurilmagan

**18.77  ❌ yo'q**  — ❓ EP-NTF-077: Adaptatsiya (o'qitish) yakunlanganini bot tasdiqlasinmi?
- Siz: Har xodim оргополitika o'qib tasdiqlaydi; tasdiqlamaganlar НО-3'ga (egasi Q55)
- Isbot: adaptation.confirm (LmsModuleCompletedEvent→ack) qurilmagan; o'qib-tasdiqlash NTF zanjiri yo'q

**18.78  🟡 qisman**  — ❓ EP-NTF-078: Smenalararo topshirish (peshma-pesh) bildirishnomasi?
- Siz: Smena oxirida ochiq ishlar avtomatik keyingi smenaga+texnologga
- Isbot: shift_handovers jadval mavjud (mem: real jadval); lekin NTF avtomatik ochiq-ishlar topshirish (shift.handover, 15daq-oldin scheduled) qurilmagan

**18.79  🔑 egasi-data**  — ❓ EP-NTF-079: 'Kim-nima-oladi' matritsasini egasi ko'rib chiqsinmi (kanal xaritasi)?
- Siz: Egasi ko'radigan yagona hodisa→lavozim→kanal jadvali (egasi-qaror)
- Isbot: Markaziy marshrut-matritsa jadvali/UI qurilmagan (notification_schedules count=0); bu egasi tasdig'idan o'tadigan markaziy jadval — hali yo'q

**18.80  🟡 qisman**  — ❓ EP-NTF-080: 'Ma'lumot yo'qolmaydi' — har xabar o'chirilmaydigan arxivga?
- Siz: Rasmiy xabar/qaror/sifat o'chirilmaydi, qidiriladi (immutable)
- Isbot: notifications jadval 3735 qator saqlanadi lekin DELETE-trigger/immutable=true flag YO'Q (grep immutable=0 NTF'da); o'chirilmaydigan kafolat qurilmagan

**18.81  ❌ yo'q**  — ❓ EP-NTF-081: Brak/xato statistikasi haftalik digestda bo'lim kesimida?
- Siz: Haftalik digestda bo'lim kesimida xato soni+takrorlanganlari
- Isbot: defect.weeklyStats (bo'lim-kesim digest) qurilmagan

**18.82  ❌ yo'q**  — ❓ EP-NTF-082: Ko'rilmagan muhim xabar uchun qayta-yuborish jadvali?
- Siz: Ko'rilmasa 2 marta qayta (oraliqda), keyin eskalatsiya
- Isbot: resend.schedule (2-marta qayta+eskalatsiya, BullMQ retry) qurilmagan; qayta-yuborish mexanizmi yo'q

---

## 19 — POS / Kassa-monitor  (vizyon 72%, 82 savol)

**19.1  ✅ bor**  — ❓ POS Monitor asosiy vazifasi — zavod ombori harakatlari (kirim/chiqim/inventar/ko'chirish), kassa EMAS?
- Siz: POS = ombor planshet ilovasi; pul Finance'da; FG ham shu tizimda
- Isbot: 6 harakat turi pos_movement_types'da (INTERNAL_ISSUE/EXTERNAL_OUT/EXTERNAL_IN/INTERNAL_RETURN/INTERNAL_TRANSFER/DAMAGE+INVENTORY_ADJUST); README + 44 FE sahifa material-harakatga qaratilgan, kassa yo'q

**19.2  ✅ bor**  — ❓ Ombor xodimi planshetga kim sifatida kiradi — ERP login (SSO/JWT), rol avto?
- Siz: ERP login, har harakat shaxsga bog'lanadi (audit)
- Isbot: presentation/pos-auth.controller.ts + pos-auth.service.ts; pos_audit_log'da user_id/ip/ts ustunlari, 41 qator live

**19.3  🔑 egasi-data**  — ❓ Qaysi omborlar planshetda ko'rinadi — bo'lim asosida, xodim ko'p bo'lim omboriga ega bo'lishi mumkin?
- Siz: Faqat o'z bo'lim ombori chiqimi; HR sozlaydi (30+ bo'lim)
- Isbot: department_warehouse_map + pos_warehouse_access jadvallar + pos-department.guard.ts mavjud, LEKIN department_warehouse_map=0 qator — mapping data kutilmoqda

**19.4  ✅ bor**  — ❓ Kirim (priyomka) 5-bosqichli karantin oqimi bilan boshlanadimi?
- Siz: DRAFT→KARANTIN→QC→OMBOR_MENEJER→AI_GL
- Isbot: quarantine-workflow.service.ts STATUS_FLOW: draft→karantin→qc_review→approved→completed; pos_movements.quarantine_required/qc_status ustunlari; QC-HOLD ombori live (warehouses)

**19.5  ✅ bor**  — ❓ Chiqim sababi majburiymi — harakat turi orqali (INTERNAL_ISSUE/EXTERNAL_OUT/TRANSFER/DAMAGE/RETURN)?
- Siz: Sabab majburiy; INTERNAL_RETURN sabab shart
- Isbot: pos_movement_types 6 tur live; pos_movements.return_reason ustuni; movement.dto.ts movement-enums.ts

**19.6  ✅ bor**  — ❓ Barcode/QR skanerlash — material identifikatsiyasi (scanner + AI kamera)?
- Siz: Skaner asosiy, AI kamera (ZXing/OpenCV), qo'lda zaxira
- Isbot: FE pos-monitor/components/PosBarcodeScanner.tsx; pos-barcode.service.ts + pos_barcode_map jadval (LEKIN 0 qator — kartochka mapping data kutadi)

**19.7  ✅ bor**  — ❓ Material barcode'i qayerdan keladi — kirimda avto label chop (EAN-13+Code-128)?
- Siz: EXTERNAL_IN tasdiqlanganda avto label + reprint (ZPL/EPL/PDF)
- Isbot: auto-barcode.service.ts: Code-128 generate + pos_barcode_print_queue ga qo'shadi; generateForMovement() metodi real

**19.8  ✅ bor**  — ❓ Harakat tasdiqlash — bir yoki ikki bosqich (tur bo'yicha)?
- Siz: EXTERNAL_IN=5 bosqich, EXTERNAL_OUT=menejer+moliya+AI, INTERNAL_ISSUE=1 imzo
- Isbot: pos_movement_confirmations jadval (3 qator live); pos-movement-status.service.ts FINANCE 'APPROVED' ConfirmDecision yo'li

**19.9  ✅ bor**  — ❓ Tasdiqni kim beradi — ombor menejeri asosiy, EXTERNAL_OUT'da +moliya?
- Siz: Ombor menejer; bo'lim so'rovida bo'lim menejer; org-karta vertikali
- Isbot: pos-movement-status.service.ts:199 'FINANCE' approve; requisition-workflow approveRequisition(approverId)

**19.10  ✅ bor**  — ❓ Balans-guard — manfiy qoldiq taqiqi (asset blok / consumable ogohlantirish)?
- Siz: Aktiv→to'liq blok; iste'mol→ogohlantirish+ruxsat
- Isbot: pos-balance-guard.service.ts: material_type='asset'→BadRequestException, consumable→warning; movement.service.ts:97 checkMovementLines ulangan; material_cards.material_type ustuni live

**19.11  🟡 qisman**  — ❓ Minimal qoldiq ogohlantirishi — har materialga min, pasayganda avto-signal?
- Siz: AI rejalashtirish + ta'minot ogohlantirishi
- Isbot: pos-low-stock.job.ts har soat tekshiradi → notification+telegram alert; material_cards.min_stock live; LEKIN avto purchase-requisition yaratmaydi (faqat ogohlantirish)

**19.12  ✅ bor**  — ❓ GL-koprik — har harakat moliyaga avto tushadimi (Debit/Credit)?
- Siz: Har harakatda avto GL-yozuv, AI hisoblaydi, real-time
- Isbot: auto-gl-posting.service.ts GL_ACCOUNTS (BHMS kodlar); pos-movement-status.service.ts:203-222 INLINE GL → gl_posting_log; pos_gl_posting_log=2 qator live

**19.13  ✅ bor**  — ❓ GL-yozuv qaysi hisoblarga tushadi — harakat turi bo'yicha AI Debit/Credit, 1C yo'q?
- Siz: Tur/sababga qarab AI hisob; ichki hisobot, 1C integratsiya yo'q
- Isbot: GL_PAIRS code-based mapping (auto-gl-posting.service.ts); BHMS kodlar 1010/2010/2810/6000/9010/9100 — accounts jadvalga moslangan (#10 GL-unify izoh)

**19.14  ✅ bor**  — ❓ Materialni baholash — kirimda narx (FIFO partiya, har valyuta)?
- Siz: FIFO partiya narxi; xarajat valyutasida
- Isbot: pos-fifo.service.ts FIFO/FEFO allocation; pos_movements.currency/exchange_rate/total_amount_base ustunlari live

**19.15  ✅ bor**  — ❓ Inventar (sanab chiqish) jarayoni — planshet skaner, tizim farqni ko'rsatadi?
- Siz: Skaner bilan sanash, avto farq, tunda/dam kuni
- Isbot: pos-inventory-count.service.ts + pos_inventory_counts (6 qator live) + pos_inventory_count_lines + pos_inventory_variances jadvallar; FE PosInventory.tsx

**19.16  ✅ bor**  — ❓ Inventar farqini kim tasdiqlaydi — avto GL + moliya tekshiradi?
- Siz: Avto GL posting, moliya tasdiqlaydi (zarar/ortiqcha)
- Isbot: pos-secondary-events.handler.ts onInventoryCompleted → finance_head telegram 'GL tuzatmalar qo'llandi'; pos_inventory_variances jadval

**19.17  🔑 egasi-data**  — ❓ Inventar qancha tez-tez (davriylik) — sikl-sanash?
- Siz: Sikl-sanash (har kun bir guruh aylanma)
- Isbot: pos_inventory_plans jadval mavjud (rejalashtirish strukturasi), LEKIN davriylik qiymati/jadval kutilmoqda — decisions:EP-POS-017 OCHIQ

**19.18  ✅ bor**  — ❓ Ichki ko'chirish (ombordan omborga) — INTERNAL_TRANSFER?
- Siz: Yagona TRANSFER: bir xil tip tezkor, boshqa tip menejer tasdiq
- Isbot: pos_movement_types INTERNAL_TRANSFER direction='transfer' live; pos_movements from/to_warehouse_id ustunlari

**19.19  🟡 qisman**  — ❓ AI-taklif — nima tavsiya qiladi (rejalashtirish, GL)?
- Siz: To'liq aqlli yordamchi: zakaz tavsiya, Debit/Credit, GL
- Isbot: GL auto-posting real (qoidaviy, AI emas); rejalashtirish/zakaz-tavsiya servisi alohida AI modulda — POS ichida AI-tavsiya engine'i jonli tasdiqlanmadi (low-stock faqat ogohlantirish)

**19.20  ❌ yo'q**  — ❓ AI anomaliya aniqlash — shubhali harakatni boshliqqa signal?
- Siz: AI shubhali harakatni belgilab boshliqqa signal (proaktiv)
- Isbot: POS application/ ichida anomaliya-detektor servisi topilmadi; decisions:EP-POS-020 OCHIQ — A-default tavsiya, qurilmagan

**19.21  ✅ bor**  — ❓ Offline rejim — internet yo'qda ishlaydi, keyin avto-sinxron?
- Siz: To'liq offline (PWA), keyin avto-sinxron
- Isbot: pos-sync.service.ts push()/getStatus(); pos_offline_queue jadval; pos_movements.is_offline_sync/offline_queue_id ustunlari; FE PosOfflineBanner.tsx

**19.22  ✅ bor**  — ❓ Harakatni bekor/tuzatish — DRAFT bekor, tasdiqlangan = storno?
- Siz: DRAFT bekor; tasdiqlangan teskari harakat (o'chirish yo'q)
- Isbot: quarantine STATUS_FLOW'da cancelled tranziyalari; pos_movements_archive jadval; status='cancelled' yo'li

**19.23  ✅ bor**  — ❓ Brak/yaroqsiz material — DAMAGE harakati → QC + GL zarar?
- Siz: Alohida DAMAGE akti → QC avto + GL zarar
- Isbot: pos_movement_types DAMAGE direction='adjustment'; pos-secondary-events.handler.ts @OnEvent('pos.damage.qc_required') → qc_inspector telegram; pos_damage_qc_links jadval

**19.24  🟡 qisman**  — ❓ Tayyor mahsulot (FG) ishlab chiqarishdan ombarga qabuli — MES integratsiya?
- Siz: FG shu POS tizimida; MES real-time integratsiya
- Isbot: FG-MAIN/WIP-MAIN omborlar live; goods-receipt.service.ts mavjud; LEKIN goods_receipts=0 qator, MES→FG-kirim event listener'i jonli ma'lumotsiz tasdiqlanmadi

**19.25  ✅ bor**  — ❓ Partiya/seriya (lot) kuzatuvi — Code-128, FIFO/FEFO?
- Siz: Partiya kuzatiladi; muddatli→FEFO, muddatsiz→FIFO
- Isbot: pos-fifo.service.ts FEFO/FIFO batch tanlash; batch_lot_movements jadval; FE PosLotTraceability.tsx

**19.26  ✅ bor**  — ❓ POS Monitor planshet ekrani — responsive, skaner-markaz, toast/modal?
- Siz: Responsive web (PC+planshet+telefon), skaner-markaz
- Isbot: FE pos-monitor/PosMonitorApp.tsx + layout/PosLayout.tsx; 44 sahifa responsive

**19.27  ✅ bor**  — ❓ Harakat hisoboti va smena yopilishi — smena boshqaruvi kerakmi?
- Siz: Smena boshqaruvi kerak emas — faqat audit log + kunlik jurnal
- Isbot: pos-reports.service.ts; pos_shift_audit jadval; pos_audit_log kim-qachon (41 qator); FE PosReports.tsx

**19.28  ✅ bor**  — ❓ Master-data — harakat turlari ro'yxati (qat'iy + sozlanadigan sabablar)?
- Siz: Turlar kod-darajada qat'iy; sabab/sozlama admin panelda
- Isbot: pos_movement_types jadval 7 qator (6 vizyon turi + INVENTORY_ADJUST); is_issue/is_receipt/direction ustunlari

**19.29  🟡 qisman**  — ❓ POS karta-model bilan integratsiya (omborchi GSD)?
- Siz: To'liq ERP/HR integratsiya; omborchi statistikasi harakatlardan
- Isbot: warehouse-kpi.service.ts + pos_warehouse_stock_view; LEKIN 3-ko'rsatkichli GSD formula (reja%+kechikish+og'ish) aniq emas — decisions:EP-POS-056 OCHIQ

**19.30  ✅ bor**  — ❓ POS va ikki-ombor dunyosi — kanonik jadval (yagona haqiqat)?
- Siz: Real-time PostgreSQL; kanonik=warehouse_stock
- Isbot: warehouse_stock=37 qator live (kanonik); current_stock VIEW; memory reference_live_db_location tasdiqlaydi

**19.31  ✅ bor**  — ❓ Ichki logistika harakati alohida turmi (yarim tayyor sex orasida ko'chirish)?
- Siz: INTERNAL_TRANSFER orqali, balans ko'rinadi
- Isbot: INTERNAL_TRANSFER live; PRODUCTION_OFFSET/FLEXO + WIP-MAIN omborlar warehouses jadvalda

**19.32  ❌ yo'q**  — ❓ Texkarta-material mosligi tekshiruvi (chiqimdan oldin blok)?
- Siz: Skan texkarta materialiga mos kelmasa qizil + blok (eng qimmat xato)
- Isbot: grep -rni 'techcard|texkarta|technology_card|mismatch' application/ → 0 natija; balance-guard faqat miqdor tekshiradi, texkarta-mosligi YO'Q; decisions:EP-POS-032 OCHIQ

**19.33  🔑 egasi-data**  — ❓ Gofra qavati/grammaj chiqimda farqlanadimi (har qavat alohida karta)?
- Siz: Har grammaj/qavat alohida material kartasi (barcode darajasida)
- Isbot: material_cards struktura har material uchun alohida barcode qo'llab-quvvatlaydi (EAN/Code-128); LEKIN gofra-qavat kartalari master-data sifatida kiritilishi kerak (pos_barcode_map=0)

**19.34  ✅ bor**  — ❓ Laboratoriya qabuli — kirim karantin holatida turadimi (lab OK → tayyor)?
- Siz: Kirim KARANTIN → QC tasdiqlasa asosiy omborga
- Isbot: quarantine-workflow.service.ts moveToQuarantine() → QC-HOLD ombori; STATUS_FLOW karantin→qc_review→approved; pos_movements.quarantine_required

**19.35  ✅ bor**  — ❓ Lab 'rad etdi' bo'lsa material taqdiri (bloklangan/qaytarish/brak)?
- Siz: QC CHIQARISH → ta'minotchiga qaytish yoki DEFECTIVE omborga
- Isbot: STATUS_FLOW rejected holati; SCRAP-MAIN (brak) ombori live; pos_movements.return_reason; pos-secondary-events damage→qc

**19.36  ❌ yo'q**  — ❓ Chiqindi va qoldiq (отходы) hisobga olinadimi (makulatura kirimi)?
- Siz: Alohida chiqindi/qoldiq kirimi (makulatura ombori)
- Isbot: grep 'makulatura|waste|recycl' application/ → 0 natija; alohida chiqindi-harakat turi yo'q; decisions:EP-POS-036 OCHIQ

**19.37  ❌ yo'q**  — ❓ Makulatura (ikkilamchi qog'oz) ombori alohida turmi?
- Siz: Makulatura alohida ombor turi + rang barcode
- Isbot: warehouses turlari: MAIN/PRODUCTION/raw_material/finished_goods/wip/scrap/quarantine/tools/household/mro — makulatura YO'Q; decisions:EP-POS-037 OCHIQ

**19.38  ❌ yo'q**  — ❓ Rohler/poddon (ko'chirish vositasi) kuzatiladimi (poddon birligi)?
- Siz: Poddon + o'lchov ikkalasi (1 poddon=N rulon/kg avto)
- Isbot: pos_movements/movement_lines'da poddon birligi/konversiyasi topilmadi; decisions:EP-POS-038 OCHIQ

**19.39  ❌ yo'q**  — ❓ Bo'sh poddon/rohler qaytishi hisobga olinadimi (qaytariladigan tara)?
- Siz: Poddon qaytariladigan aktiv, ketdi/qaytdi balansi
- Isbot: Tara-aylanma jadval/servis topilmadi; decisions:EP-POS-039 OCHIQ

**19.40  🟡 qisman**  — ❓ Kunlik ishlab chiqarish rejasi planshetga tushadimi (% bilan)?
- Siz: Kunlik reja → 'bugun chiqariladigan materiallar' PP'dan
- Isbot: daily_warehouse_plans jadval (plan_date/total_kits/prepared_kits/% strukturasi) mavjud, LEKIN 0 qator; PP→POS reja-push event listener'i jonli tasdiqlanmadi

**19.41  ❌ yo'q**  — ❓ Bekor turish (простой) signali — material yetishmasa?
- Siz: Sex 'material kutyapman' → vaqt sanog'i + signal
- Isbot: Prostoy/bekor-turish signal servisi yoki 'material kutyapman' tugmasi topilmadi; decisions:EP-POS-041 OCHIQ

**19.42  ✅ bor**  — ❓ Sexning material talabi (so'rov) planshetdan keladimi (talab↔chiqim)?
- Siz: Sex 'material talabi' yaratadi → menejer tasdiq → omborchi beradi
- Isbot: pos-requisition-workflow.service.ts submit/approve/reject/fulfill; pos_material_requests + pos_material_request_lines jadvallar; FE PosRequests.tsx + RequisitionDetail.tsx

**19.43  🟡 qisman**  — ❓ Buyurtmaga material sarfini biriktirish (kalkulyatsiya/tannarx)?
- Siz: Har chiqim buyurtmaga biriktiriladi → tannarx avto
- Isbot: pos_movements.purchase_order_id ustuni; movement-line'da buyurtma bog'lash strukturasi mavjud, LEKIN buyurtma↔material biriktirish jonli ma'lumotsiz (2 movement) to'liq tasdiqlanmadi

**19.44  ❌ yo'q**  — ❓ Norma-fakt farqi (ortiqcha sarf) ogohlantirishi?
- Siz: Norma oshsa qizil + sabab so'raydi
- Isbot: Norma-fakt taqqoslash guard'i topilmadi (balance-guard faqat qoldiq, norma emas); decisions:EP-POS-044 OCHIQ

**19.45  ✅ bor**  — ❓ Turniket/kirish-chiqish bilan login bog'lanishmi (RFID)?
- Siz: POS login=ERP SSO; turniket RFID alohida HR/davomat
- Isbot: pos-auth ERP login orqali (B-variant); RFID=login majburiy emas — decisions:EP-POS-045 javoblangan (ikki tizim ajratilgan)

**19.46  🔑 egasi-data**  — ❓ A-System (eski tizim) bilan bog'liqlik — almashtiradimi/parallel?
- Siz: ERP A-System'ni butunlay almashtiradi (yagona haqiqat)
- Isbot: A-System ko'prik/import kodi yo'q; decisions:EP-POS-046 OCHIQ — egasi A-System taqdirini hal qilishi kerak (Q-25 master reja)

**19.47  ✅ bor**  — ❓ Yarim tayyor (WIP) bosqichlari kuzatiladimi?
- Siz: Har bosqichdan keyin yarim tayyor alohida pozitsiya (WIP)
- Isbot: WIP-MAIN + PRODUCTION_OFFSET/FLEXO omborlar live (warehouses); INTERNAL_TRANSFER orqali bosqichlararo ko'chish

**19.48  🟡 qisman**  — ❓ Texnik pasport/partiya hujjati FG kirimda biriktiriladimi?
- Siz: FG-kirimda partiya + texnik pasport (jo'natishda tayyor)
- Isbot: pos_inventory_passport + pos_material_passports jadvallar + pos-inventory-passport.service.ts mavjud, LEKIN pos_material_passports=0; FG↔pasport bog'lanishi jonli ma'lumotsiz

**19.49  ❌ yo'q**  — ❓ Lab namuna olish ombordan harakatmi (chiqim sababi)?
- Siz: 'Lab namunasi' alohida chiqim sababi (kichik, qayd)
- Isbot: Lab-namuna chiqim sababi/turi topilmadi; decisions:EP-POS-049 OCHIQ

**19.50  ❌ yo'q**  — ❓ Smenadan smenaga material topshirish (2 imzo akti)?
- Siz: Smena topshirish akti: 2 imzo (topshiruvchi/qabul qiluvchi)
- Isbot: pos_shift_audit bor (audit log), LEKIN 2-imzo topshirish akti YO'Q; decisions:EP-POS-050 OCHIQ — Q11 'smena boshqaruvi kerak emas' bilan ZIDLIK (egasi hal qiladi)

**19.51  ✅ bor**  — ❓ Yuk topshirish-qabul akti (kirimda yetkazib beruvchi bilan)?
- Siz: Kirim akti: zakaz-fakt farqi + holat → da'vo asosi
- Isbot: pos_movements.act_pdf_path/invoice_pdf_path ustunlari; pos-pdf.service.ts akt PDF; pos_three_way_match jadval; supplier_id ustuni

**19.52  ❌ yo'q**  — ❓ Kam yetkazilgan/buzuq material qisman qabul rejimi?
- Siz: Qisman qabul + ochiq qoldiq + buzuq qismi alohida sabab
- Isbot: grep 'partial|qisman' goods-receipt/quarantine → 0; qisman-qabul oqimi (received_qty<ordered) topilmadi; decisions:EP-POS-052 OCHIQ

**19.53  ✅ bor**  — ❓ Tozalik / 5S holati planshetda kuzatiladimi?
- Siz: Tozalik POS tashqarisida (Coordination moduli) — toza chegara
- Isbot: POS application/ ichida 5S/tozalik kodi yo'q (to'g'ri chegara); decisions:EP-POS-053 javoblangan — POS faqat material harakati

**19.54  🟡 qisman**  — ❓ Ish joyni ruxsatsiz tashlab ketish (planshet harakatsizligi signali)?
- Siz: Planshet harakatsizligi + javobsiz talab → boshliqqa signal
- Isbot: pos_audit_log har klik/kirish-chiqish (IP+ts) qaydlaydi; LEKIN maxsus 'harakatsizlik signali' detektori alohida belgilanmagan — decisions:EP-POS-054 qisman

**19.55  ✅ bor**  — ❓ Energiya/resurs (suv/gaz/svet) tejash POS'dami?
- Siz: Energiya IoT/Coordination moduli, POS'da YO'Q
- Isbot: POS application/ ichida energiya-hisoblagich kodi yo'q (to'g'ri chegara); decisions:EP-POS-055 javoblangan

**19.56  🔑 egasi-data**  — ❓ Omborchi GSD: 3-ko'rsatkich (reja%+kechikish+og'ish) avto?
- Siz: Uch ko'rsatkich POS harakatlaridan avto → logist kartasiga
- Isbot: warehouse-kpi.service.ts bor, LEKIN aynan 3-ko'rsatkich formulasi (reja%/kechikish/og'ish) aniqlanmagan — decisions:EP-POS-056 OCHIQ

**19.57  🟡 qisman**  — ❓ Material birligi konversiyasi (rulon↔kg↔m) avto?
- Siz: Har materialga konversiya jadvali → avto o'tkazish
- Isbot: pos_movements valyuta/exchange_rate konversiyasi bor; material o'lchov-birligi konversiya jadvali (1 rulon=N kg) jonli tasdiqlanmadi — decisions javoblangan deydi, lekin konversiya data kutadi

**19.58  ✅ bor**  — ❓ Buyurtma yopilgach ortib qolgan material omborga qaytadimi?
- Siz: 'Sexdan qaytarish' (ortgan material omborga, tannarxdan chiqadi)
- Isbot: INTERNAL_RETURN harakat turi live (is_receipt=true); pos_movements.return_reason; sabab majburiy

**19.59  🟡 qisman**  — ❓ Yetkazib beruvchiga qaytarish (vozvrat) → Finance da'vo?
- Siz: Alohida 'ta'minotchiga qaytarish' → kredit-nota
- Isbot: pos_movements.supplier_id + return_reason ustunlari; STATUS_FLOW rejected; LEKIN alohida supplier-return harakat turi + Finance kredit-nota event'i jonli tasdiqlanmadi

**19.60  ✅ bor**  — ❓ Material muddati (срок годности) — FEFO + ogohlantirish?
- Siz: Muddatli → FEFO + yaqinlashganda ogohlantirish
- Isbot: pos-fifo.service.ts hasExpiry() → FEFO allocation; pos-quarantine-check.job + low-stock job ogohlantirish

**19.61  ✅ bor**  — ❓ Joylashuv (ombordagi joy/yacheyka) kuzatiladimi?
- Siz: Bin location freeform, kirimda belgilanadi, chiqimda ko'rsatiladi
- Isbot: pos_movement_lines.bin_id ustuni live; pos-movement.service.ts:199 binId: line.binLocation

**19.62  ❌ yo'q**  — ❓ Mijoz materiali (давальческое) ajratiladimi?
- Siz: Alohida tur — miqdor kuzatiladi, qiymat GL'siz
- Isbot: grep 'davalchesk|customer_material|consignment' → 0 natija; davальческое material turi yo'q; decisions:EP-POS-062 OCHIQ

**19.63  ✅ bor**  — ❓ Inventar paytida ombor muzlatiladimi (freeze)?
- Siz: Tunda/dam kuni sanaladi (harakat yo'q) — freeze hal
- Isbot: pos_inventory_plans jadval + inventar tunda/dam kuni qarori (decisions:EP-POS-063); zona-freeze talab emas

**19.64  ❌ yo'q**  — ❓ Inventar farqi chegarasi (avto-tasdiq limiti)?
- Siz: ±N% gacha avto, ortig'i tasdiq talab
- Isbot: Inventar farq avto-tasdiq limit chegarasi (±N%) kodi topilmadi; har farq moliya tasdig'i; decisions:EP-POS-064 OCHIQ

**19.65  🟡 qisman**  — ❓ Tezkor minimal qoldiq — avto purchase-request MM'ga?
- Siz: Minimaldan tushsa avto 'sotib olish talabi' → MM/snabjeniye
- Isbot: pos-low-stock.job.ts faqat notification+telegram alert yaratadi; avto purchase-requisition (erp_purchase_requisitions) INSERT qilmaydi — proaktiv emas, qisman

**19.66  ✅ bor**  — ❓ Buyurtma uchun rezerv (band qilish)?
- Siz: Reja material rezervlaydi → erkin qoldiq alohida (jami╳erkin)
- Isbot: stock-reservation.service.ts: current_stock.reserved_qty ortadi; pos_stock_reservations jadval (0 qator — data kutadi); FE PosReservations.tsx

**19.67  🟡 qisman**  — ❓ Shoshilinch chiqim (rejasiz/ruxsatli)?
- Siz: Rejasiz chiqim ruxsat + majburiy sabab + boshliq xabar
- Isbot: Chiqim sabab majburiy (return_reason); LEKIN 'rejadan tashqari' maxsus oqim + avto boshliq-xabar belgilanmagan; decisions:EP-POS-067 OCHIQ

**19.68  🟡 qisman**  — ❓ Bichish/qirqish chiqimi (rulondan qisman, qoldiq rulonda)?
- Siz: Qisman chiqim — rulon qoldig'i o'lchovda kamayadi
- Isbot: FIFO partiya qisman allocation qo'llab-quvvatlaydi; LEKIN 'ochiq rulon' qisman-chiqim oqimi aniq tasdiqlanmadi; decisions:EP-POS-068 OCHIQ

**19.69  ❌ yo'q**  — ❓ Foto-dalil (kirim/brak/inventar farqi) majburiymi?
- Siz: Buzuq/brak/katta farqda planshet kamerasidan foto majburiy
- Isbot: grep 'photo|foto|attachment' → faqat cash-register.service.ts image_url; movement/brak/inventar foto-dalil biriktirish YO'Q; decisions:EP-POS-069 OCHIQ

**19.70  🟡 qisman**  — ❓ Offline yozilgan harakat to'qnashuvi (konflikt rezolyutsiya)?
- Siz: To'qnashuv → 'tekshirilsin' holatiga, boshliq hal qiladi
- Isbot: pos-sync.service.ts conflict sanaydi (conflicts++) + ConflictException; pos_offline_queue; LEKIN 'tekshirilsin→boshliq' rezolyutsiya holati to'liq emas — decisions:EP-POS-070 OCHIQ

**19.71  🟡 qisman**  — ❓ Telegram/bildirishnoma — qaysi hodisa kimga (rol matritsasi)?
- Siz: Telegram Mini App; hodisa→rol matritsasi admin panelda
- Isbot: pos-telegram.service.ts + pos-secondary-events.handler @OnEvent role-based telegram (qc_inspector/finance_head/pos_manager); pos_telegram_routes jadval (0 qator — matritsa sozlama kutadi)

**19.72  ✅ bor**  — ❓ Tayyor mahsulot jo'natish (отгрузка) POS'dami (SD bilan)?
- Siz: EXTERNAL_OUT FG ombori (POS'da), SD bog'liq, +moliya+AI
- Isbot: EXTERNAL_OUT harakat turi live; pos-movement-status.service.ts:199 FINANCE approve; FG-MAIN ombori; pos_movements.invoice_id/three_way_matched

**19.73  ✅ bor**  — ❓ Marshrut varaqasi (накладная) chop etish?
- Siz: Har harakatda akt PDF + invoice + накладная printerga
- Isbot: pos-pdf.service.ts + pos-pdf-inventory.service.ts; pos_movements.act_pdf_path/invoice_pdf_path; pos_pdf_templates jadval; pos-printer-config service

**19.74  🟡 qisman**  — ❓ Razряd/malaka — kim qaysi harakatni qila oladi?
- Siz: Harakat turi razряd/lavozimga bog'liq (oddiy╳muhim)
- Isbot: pos-department.guard.ts + rol-based tasdiq (menejer/moliya); faqat bo'lim chiqimi; LEKIN razряd-darajali harakat-huquqi (past razряd faqat oddiy) aniq ajratilmagan

**19.75  🟡 qisman**  — ❓ Kunlik hisobotni kim ko'radi (vertikal — manager_id yuqoriga)?
- Siz: Kunlik hisobot vertikal yuqoriga avto (har daraja kesimini ko'radi)
- Isbot: pos-reports.service.ts + warehouse-kpi analytics (AI/Direktor/Moliya/Menejer kesimlar — decisions:EP-POS-075 javoblangan); LEKIN manager_id vertikal avto-oqim jonli tasdiqlanmadi

**19.76  ❌ yo'q**  — ❓ Buyurtma o'zgarishi (chiqarilgan materialga ishlov)?
- Siz: Buyurtma o'zgarsa POS ogohlantiradi + qaytarish taklif
- Isbot: Buyurtma-o'zgarish trigger/listener (chiqarilgan materialga reaktsiya) topilmadi; INTERNAL_RETURN bor lekin avto-trigger yo'q; decisions:EP-POS-076 OCHIQ

**19.77  ❌ yo'q**  — ❓ Tungi smena/kechki harakat anomaliyasi (vaqt+miqdor)?
- Siz: Smena tashqarisi + norma-oshiq chiqim avto shubhali → boshliq
- Isbot: pos_audit_log ts qaydlaydi, LEKIN vaqt+miqdor anomaliya-detektori YO'Q; decisions:EP-POS-077 OCHIQ (EP-POS-020/044 bilan)

**19.78  🟡 qisman**  — ❓ Material kartasini kim yaratadi (omborchimi/MM)?
- Siz: Faqat MM tasdiqlagan karta; yangisi MM'ga so'rov + admin telegram
- Isbot: pos-barcode/pos-mini-app: skanerda topilmasa yangi kartochka + admin telegram (decisions:EP-POS-078 javoblangan); LEKIN MM-tasdiq workflow'i jonli tasdiqlanmadi (pos_barcode_map=0)

**19.79  🔑 egasi-data**  — ❓ Eski tizimdan boshlang'ich qoldiq (начальный остаток)?
- Siz: Ishga tushishda bir martalik to'liq inventar → boshlang'ich qoldiq
- Isbot: Inventar count strukturasi bor (pos_inventory_counts), LEKIN boshlang'ich-qoldiq import strategiyasi aniqlanmagan; A-System (EP-POS-046)ga bog'liq; decisions:EP-POS-079 OCHIQ

**19.80  ✅ bor**  — ❓ Harakat tarixini kim ko'ra oladi (audit, o'zgarmas)?
- Siz: Tarix o'zgarmas (faqat o'qish); xodim o'ziniki, boshliq hammasi
- Isbot: pos_audit_log to'liq (user_id/action/ip/old_value/new_value/ts) — 41 qator live; FE PosMyInventory.tsx 'mening inventarim'; pos-audit.service.ts insertLog

**19.81  ❌ yo'q**  — ❓ Yuk topshirishda nomuvofiqlik (topshir↔qabul farqi)?
- Siz: 2 imzo; farq bo'lsa 'nizo' holati → boshliq hal qiladi
- Isbot: pos_movement_confirmations bor (kim topshirdi/qabul), LEKIN topshir↔qabul farq-nizo rezolyutsiya oqimi YO'Q; decisions:EP-POS-081 OCHIQ (EP-POS-050 bilan)

**19.82  🟡 qisman**  — ❓ POS Monitor til/ko'rinish (omborchi uchun: lotin/kirill/rus)?
- Siz: O'zbek+Rus (foydalanuvchi tanlaydi), ikonka-markaz; kirill nozik
- Isbot: pos_movement_types.name_ru ustuni + warehouses.name_ru i18n strukturasi; O'zbek(lotin)+Rus tasdiqlangan, LEKIN uchinchi til (kirill) qo'shilishi egasi qarori — decisions:EP-POS-082 qisman

---

## 20 — CC / Hujjat-shartnoma  (vizyon 62%, 84 savol)

**20.1  ✅ bor**  — ❓ EP-CC-001: Barcha rasmiy murojaat (ZNO/ZVS/доклад/ariza/buyruq) bitta 'Yangi hujjat yarat' → shablon tanlash orqali yagona kirish nuqtasimi?
- Siz: Yagona kirish nuqtasi: hamma hujjat bitta joydan, shablon tanlab
- Isbot: cc-workflow.service.ts:48 createDraft(templateId) yagona oqim; cc-documents.controller.ts:160 POST documents/draft; 14 shablon cc_document_templates'da; FE NewDocumentModal.tsx shablon tanlash bilan

**20.2  🟡 qisman**  — ❓ EP-CC-002: Shablonni faqat super-admin yaratadi/o'zgartiradimi?
- Siz: Yagona standart — faqat super-admin shablon yaratadi
- Isbot: cc_document_templates jadval seed-orqali to'ldirilgan (14 qator), lekin admin-panel CRUD endpoint CC controller'da YO'Q (faqat GET templates:100). Shablon yaratish/tahrir UI'si topilmadi — seed-only

**20.3  ✅ bor**  — ❓ EP-CC-003: AI to'liq intervyu — savol beradi, javoblardan rasmiy matn tuzadimi?
- Siz: Xodim qanday yozishni bilmaydi — AI savol-javob orqali matn tuzadi
- Isbot: cc-ai-interview.service.ts start/answer/finalize; finalize ai.callClaude({taskType:'cc.generate_document'}) (213-qator); cc_ai_sessions jadval, savollar cc_document_templates.ai_questions'dan

**20.4  ✅ bor**  — ❓ EP-CC-004: AI ishlamasa qo'lda to'ldirish — uzilishsizmi?
- Siz: AI tushsa ham murojaat bloklanmaydi, qo'lda yuboriladi
- Isbot: createDraft AI'dan mustaqil (cc-workflow.service.ts:48 to'g'ridan aiBody qabul qiladi); test_mode'da AI chaqirilmaydi (cc-ai-interview.service.ts:210); AI faqat finalize'da, draft yaratish AI'siz mumkin

**20.5  ✅ bor**  — ❓ EP-CC-005: Marshrut org-sxemadan avto-aniqlanadimi (manager_id zanjiri)?
- Siz: Tizim o'zi org-sxemadan marshrutni chizadi, sakramaydi
- Isbot: cc-org-resolver.service.ts:39 resolveApprover; cc_workflow_steps.approver_position_code → resolveManagerOfSender recursive org-tree walk (130-169); 48 step seed qilingan

**20.6  ✅ bor**  — ❓ EP-CC-006: Manager topilmasa (manager_id NULL) DEPT_HEAD→direktor zaxira marshrutmi?
- Siz: Hech qachon yo'qolmaydi — fallback direktorga
- Isbot: cc-org-resolver.service.ts:142-168 manager_id NULL bo'lsa org-tree'dan bo'lim rahbarini topadi; resolveDirector 3-bosqichli fallback (73-110); BUG FIX izoh: throw emas Result<number> qaytaradi

**20.7  ✅ bor**  — ❓ EP-CC-007: Imzo turi PIN-kodmi (har imzoga)?
- Siz: Fizik imzo + ERP/Telegram PIN tasdiq, qulay+isbotli
- Isbot: cc-pin.service.ts verifyAndSign bcrypt.compare + signature_hash (sha256); har send/approve/reject/cancel'da chaqiriladi (cc-workflow.service.ts:84,162,222); cc_user_pins jadval

**20.8  ✅ bor**  — ❓ EP-CC-008: Imzo oqimi bosqichli (ketma-ket, sakramaydi)mi?
- Siz: 1-bosqich tugagach 2-bosqichga, org-sxema sakramaydi
- Isbot: cc-workflow-approve.helpers.ts:36-95 stillPending tekshiradi → bosqich ichida hamma imzolasa keyingi stepOrder'ga o'tadi; stepOrders.sort ketma-ket

**20.9  ✅ bor**  — ❓ EP-CC-009: Rad etish → sabab bilan qaytadi → resubmit, izoh majburiymi?
- Siz: Rad → sabab majburiy → tuzatib qayta yuboriladi
- Isbot: cc-workflow.service.ts:173 reject + cc_rejection_reasons; resubmit:192 version+1 → snapshotVersion → qayta send; signRejection sabab yozadi

**20.10  🟡 qisman**  — ❓ EP-CC-010: Kechikkanda avto-eskalatsiya (boshliqqa+ogohlantirish)mi?
- Siz: 2x eslatma → eskalatsiya → HR
- Isbot: cc-sla.cron.ts:161 escalateApprovals deadline o'tsa state='escalated'+audit; 48h auto-reject (115); LEKIN '2x eslatma' takror-eslatma sikli yo'q, HR'ga maxsus yo'naltirish kodda topilmadi

**20.11  🟡 qisman**  — ❓ EP-CC-011: Eskalatsiya muddati har shablonga (hujjat turiga qarab)mi?
- Siz: Avans 4 soat, ta'til 24 soat — turiga qarab
- Isbot: cc_document_templates.inbox_sla_hours/reminder_hours/escalation_hours ustunlar bor; seed: ADVANCE=24, CONTRACT_END/DOKLAD=48 (lekin avans 24 — egasi '4 soat' degan, mos kelmaydi); 15daq/1soat production SLA yo'q

**20.12  ✅ bor**  — ❓ EP-CC-012: 3-savat (Kiruvchi/Kutish/Chiquvchi) bilan ulanganmi?
- Siz: Tasdiq kutayotgan → Kiruvchi savat; yagona ish ro'yxati
- Isbot: cc-baskets.service.ts listBasket/summary/move; cc_documents.basket_state (inbox/pending/outbox/archived); FE BasketColumn.tsx; cc_basket_history jadval

**20.13  ✅ bor**  — ❓ EP-CC-013: 24 soat qoidasi (qizil+eslatma, 48h boshliqqa)mi?
- Siz: 24h → qizil+eslatma, 48h → boshliqqa
- Isbot: cc-sla.cron.ts:63 markInboxOverdue (basket_entered_at+inbox_sla_hours<NOW → is_inbox_overdue=true + notification); 48h auto-reject (115); GlobalInboxBadge.tsx FE

**20.14  🟡 qisman**  — ❓ EP-CC-014: Kaskad — bir hujjat bir nechta vazifa tug'diradimi?
- Siz: Tasdiqlangach kimga qanday vazifa avto-yaratiladi (to'liq avtomatlashuv)
- Isbot: cc-event.listener.ts:52 CcSpawnRequestedEvent listener draft yaratadi + Kanban karta (98-137); LEKIN cc.spawn FAQAT webhook'dan emit qilinadi (grep: faqat cc-webhook.controller.ts:99) — domen-trigger asosida avto-kaskad ulanmagan

**20.15  ✅ bor**  — ❓ EP-CC-015: Hujjat raqamlash avto, format har shablonga (ZVS-2026-0042)mi?
- Siz: Avto-raqam, format sozlanadigan
- Isbot: cc-document-number.service.ts atomic pg_advisory_xact_lock + {YYYY}/{SEQ4} token; cc_document_templates.number_format; yil bo'yicha COUNT+1

**20.16  🟡 qisman**  — ❓ EP-CC-016: Arxiv — hech qachon o'chmaydi, lavozimga qarab muddat (rahbar 10yil/ishchi 3yil)mi?
- Siz: Immutable arxivga ko'chadi, lavozim turiga qarab muddat
- Isbot: cc_documents.archived_at + cc_document_templates.archive_after_days ustun BOR, lekin seed=NULL (hech qaysi shablonda muddat o'rnatilmagan); rahbar/ishchi farqi (10/3 yil) kodda yo'q — faqat archived_at bayroq

**20.17  🟡 qisman**  — ❓ EP-CC-017: Arxivdan ko'p mezonli filtr (tur+sana+yuboruvchi+holat+matn)mi?
- Siz: To'liq full-text + multi-filtr qidiruv
- Isbot: cc-documents-read.repo + cc-baskets ro'yxatlash bor; LEKIN to'liq full-text (tsvector/GIN) qidiruv kodda topilmadi — 1000-javob #20 tsvector va'da qiladi, lekin amalga oshmagan; cc_documents=0 (qidiriladigan data yo'q)

**20.18  ✅ bor**  — ❓ EP-CC-018: Tasdiqlangan hujjat PDF (logo+raqam+imzo zanjiri+sana)mi?
- Siz: Har hujjat rasmiy ko'rinishda chop etiladi
- Isbot: cc-pdf.service.ts pdf-lib: EUROPRINT blank + №raqam + IMZOLAR ZANJIRI + verify QR-URL (177); cc-documents.controller.ts:88 GET documents/:id/pdf; cc_print_log + print_requires_reason

**20.19  🟡 qisman**  — ❓ EP-CC-019: Hujjat turlari to'liq ShVB to'plami (ZVS/ZNO/доклад/распоряжение/приказ/protokol)mi?
- Siz: To'liq ShVB strukturasi qoplanadi
- Isbot: 14 shablon seed: ADVANCE/VACATION/SALARY_RAISE/DOKLAD/REPORT/ORDER/ZRS_ZVS... — ariza+buyruq+hisobot bor, LEKIN распоряжение, протокол (Coordination'da deyiladi), приказ to'liq emas; ZNO alohida yo'q (ZRS_ZVS bitta)

**20.20  ✅ bor**  — ❓ EP-CC-020: Hujjat holatlari to'liq oqim (qoralama→yuborilgan→jarayonda→tasdiq/rad→arxiv)mi?
- Siz: To'liq status oqimi
- Isbot: domain/types.ts WorkflowState: draft|sent|in_progress|approved|rejected|cancelled|archived; cc-workflow.service barcha o'tishlar transition() bilan; cc_documents.workflow_state

**20.21  🟡 qisman**  — ❓ EP-CC-021: Marshrut lavozim-kartasiga bog'lanadi (xodim almashsa ishlaydi)mi?
- Siz: Karta asosiy — xodim almashsa marshrut uzilmaydi
- Isbot: resolver position_code→positions.code/employees orqali user topadi (cc-org-resolver:192), shu ma'noda lavozimga bog'liq; LEKIN to'g'ridan card_id FK ishlatilmaydi — employees/positions orqali bilvosita; karta-model integratsiya to'liq emas

**20.22  ❌ yo'q**  — ❓ EP-CC-022: Tasdiqlashdan oldin AI qisqa tahlil (mos/risk/tavsiya) beradimi?
- Siz: Har kartaning o'z AI'si hujjatni baholaydi (faza 2)
- Isbot: approve oqimida (cc-workflow-approve.helpers.ts) AI-tahlil chaqiruvi YO'Q; AI faqat hujjat MATNINI yaratadi (intervyu), tasdiqlash-tahlili amalga oshmagan — decisions OCHIQ deb belgilagan

**20.23  ✅ bor**  — ❓ EP-CC-023: Telegram orqali tasdiqlash (xabar+tasdiq/rad tugmasi+PIN)mi?
- Siz: Imzolovchiga Telegram+ERP orqali boradi, PIN bilan tasdiqlaydi
- Isbot: cc-bot.service.ts bot.action approve:/reject: → awaiting_pin → verifyAndSign; inline tugmalar Kiruvchi/Kutish/Chiquvchi; reject_reason oqimi (176-197)

**20.24  🟡 qisman**  — ❓ EP-CC-024: Kommunikatsiya in-app + Telegram + email kanallarimi?
- Siz: In-app + Telegram asosiy kanal
- Isbot: cc.gateway.ts WebSocket emitToUser (in-app real-time) + cc-bot Telegram + cc_notifications jadval BOR; LEKIN email kanal kodda yo'q (1000-javob #17 'email keyingi faza' deydi)

**20.25  🟡 qisman**  — ❓ EP-CC-025: Hujjatga bir nechta fayl/rasm biriktirish (ZNO asos hujjat)mi?
- Siz: PDF/rasm dalil biriktirish, ERP serverda saqlash
- Isbot: cc_attachments jadval mavjud (max_file_size_mb/allowed_file_types shablon ustunlari bor); LEKIN attachment yuklash endpoint CC controller'da topilmadi — jadval bor, oqim ulanmagan

**20.26  🟡 qisman**  — ❓ EP-CC-026: Kim ko'ra oladi — faqat ishtirokchilar+super-admin (rol-asosli)mi?
- Siz: Faqat marshrutdagi ishtirokchilar maxfiy ko'radi
- Isbot: baskets user_id bo'yicha filtrlash (cc-baskets.repo) — har kim o'z savatini ko'radi; LEKIN hujjat-darajali maydon RBAC/maxfiylik projeksiyasi (kim qaysi maydonni) kodda alohida amalga oshmagan

**20.27  ❌ yo'q**  — ❓ EP-CC-027: ZVS/ZNO CC'da shablon → tasdiq → moliya to'lov navbatiga o'tadimi?
- Siz: CC=kirish nuqtasi, ZVS tasdiq → Finance to'lovga
- Isbot: ZRS_ZVS shablon BOR, lekin approve oxirida Finance'ga event/outbox emit YO'Q (grep: cc'da hech qayerda outbox yozilmaydi); cc_outbox jadval bo'sh/ishlatilmaydi; Finance integratsiya ulanmagan

**20.28  ❌ yo'q**  — ❓ EP-CC-028: Tasdiqlash matritsasi — summa bo'yicha marshrut (≤500k boshliq...)mi?
- Siz: Summa chegarasi shablonga sozlanadi, marshrut avto
- Isbot: cc_workflow_steps statik (summa-shartsiz); summa-asosli shartli marshrut kodda yo'q; resolver faqat position_code'ni ko'radi, hujjat summasini emas — decisions OCHIQ

**20.29  🟡 qisman**  — ❓ EP-CC-029: Majlis protokoli Koordinatsiya modulida (CC engine reuse)mi?
- Siz: Protokol Coordination ostida, lekin bitta hujjat-engine
- Isbot: CC'da protokol shabloni yo'q; decisions B-variant (Coordination'da) tanlangan; CC engine reuse mexanizmi (event listener) bor, lekin Coordination-protokol slice'i bilan ulanish bu QISM A'da tasdiqlanmadi

**20.30  ✅ bor**  — ❓ EP-CC-030: To'liq audit izi (har amal vaqt+foydalanuvchi, o'chmas)mi?
- Siz: To'liq versiya tarixi kim/qachon/nima — o'chmaydi
- Isbot: cc_audit_trail har transition'da yoziladi (cc-documents-write.repo:97,187,255 — action/from/to/performed_by/comment); cc-sla.cron ham audit yozadi; append-only INSERT

**20.31  ✅ bor**  — ❓ EP-CC-031: Qoralama avto-saqlanadi, davom ettiriladimi?
- Siz: Uzun AI-intervyu uzilsa ish yo'qolmaydi
- Isbot: cc-ai-interview.service.ts:67 findExistingSession (is_completed=false+expires_at>NOW) → davom ettiradi; har answer persistAnswer bilan saqlanadi (139); draft createDraft bilan saqlanadi

**20.32  🟡 qisman**  — ❓ EP-CC-032: Hujjat tili (uz-lotin/uz-kirill/ru) — xodim o'z yozuvidami?
- Siz: Har kim o'z tilida, kirill ustuvor
- Isbot: cc_documents.language ustun (uz/ru); cc-ai-interview language qabul qiladi; PDF uz-UZ + transliterate (cc-pdf:205); LEKIN 3-yozuv (lotin/kirill alohida) to'liq emas — language faqat 'uz'/'ru', uz-cyr alohida emas

**20.33  🟡 qisman**  — ❓ EP-CC-033: 'Og'zaki qayd etilmagan = qaror yo'q' — faqat hujjatdagi qaror rasmiymi?
- Siz: Yozma qaydsiz qaror rasmiy emas
- Isbot: CC arxitekturasi yozma-only (hamma amal hujjat+PIN+audit talab qiladi) — ruh mavjud; LEKIN bu siyosatni boshqa modullarga (production'da og'zaki bloklash) majburlovchi gate kodda yo'q — CC ichida implitsit

**20.34  ❌ yo'q**  — ❓ EP-CC-034: Har shablonga 'kommunikatsiya turi' tegi (5 tur) belgilanadimi?
- Siz: Yozma-majburiy/og'zaki/vertikal/gorizontal/analitik tegi → kanal tanlash
- Isbot: node q.cjs: cc_document_templates'da communication_type USTUN YO'Q ('столбец не существует'); 5-tur tasnifi seed/sxemada amalga oshmagan

**20.35  ❌ yo'q**  — ❓ EP-CC-035: 'Yozma majburiy' 6 tur (qaror/reja/vazifa/тех карта/sifat/ogohlantirish) majburiy shablonmi?
- Siz: Bu 6 tur chat/og'zaki bilan rasmiylashtirilmaydi
- Isbot: Bu 6 turning hech biri shablon sifatida seed qilinmagan (faqat HR ariza/buyruq); тех карта/reja o'zgarish/sifat xulosa shablonlari cc_document_templates'da yo'q; chat→hujjat majburlash gate yo'q

**20.36  🟡 qisman**  — ❓ EP-CC-036: Bevosita rahbarni chetlab o'tish bloklanadi (favqulodda istisno)mi?
- Siz: Marshrut har doim bevosita rahbardan, favqulodda+sabab istisno
- Isbot: resolver MANAGER_OF_SENDER'dan boshlanadi (cc-org-resolver:57) — bevosita rahbar majburiy; LEKIN 'favqulodda chetlab o'tish' turi + sabab mexanizmi kodda yo'q (faqat oddiy marshrut)

**20.37  ❌ yo'q**  — ❓ EP-CC-037: Gorizontal kommunikatsiya — bo'limlararo vakolat matritsasi tekshiriladimi?
- Siz: Kim kimga qaysi tur hujjat yo'llay oladi — matritsa
- Isbot: Bo'limlararo ruxsat matritsasi jadvali/kodi topilmadi; resolver faqat tasdiqlash-marshrutni ko'radi, yuboruvchi×qabul-bo'lim×tur cheklashini emas — decisions OCHIQ

**20.38  ❌ yo'q**  — ❓ EP-CC-038: Analitik hujjatlar faqat Совершенствование (5-dep) orqali o'tadimi?
- Siz: Markazlashgan analitik — tahlil 5-departamentdan
- Isbot: 'tahlil/xulosa' shabloni seed qilinmagan; Совершенствование bo'limiga maxsus yo'naltirish kodi yo'q; analitik-tur cheklash amalga oshmagan — decisions OCHIQ

**20.39  🟡 qisman**  — ❓ EP-CC-039: Yuboruvchi+qabul qiluvchi ikki tomonlama javobgarlik (yuborildi/ko'rildi/javob vaqt-belgilari)mi?
- Siz: 'Men yubordim/men ko'rmadim' bahsini yopadi
- Isbot: cc_audit_trail performed_by+timestamp har amalga yoziladi; basket_entered_at; LEKIN aniq 'ko'rildi' (viewed_at) timestampi — ERP ochilganda — alohida ustun/kod sifatida topilmadi (1000-javob #47 va'da qiladi)

**20.40  🟡 qisman**  — ❓ EP-CC-040: Har hujjatda 'javobgar lavozim' maydoni (xodim almashsa avto-o'tadi)mi?
- Siz: Mas'uliyat lavozimga bog'lanadi
- Isbot: Marshrut position_code orqali lavozimga bog'liq (resolver dinamik xodim topadi); LEKIN cc_documents'da alohida 'responsible_position' maydoni yo'q — javobgarlik approval-zanjiri orqali bilvosita

**20.41  ✅ bor**  — ❓ EP-CC-041: Javobgarlikni o'tkazish faqat 'delegate' amali bilan (sabab+qabul qiluvchi) qaydlanadimi?
- Siz: Og'zaki o'tkazish yo'q — iz qoldiradi
- Isbot: cc_delegations jadval (from_user/to_user/starts_at/ends_at/is_active); cc-org-resolver checkDelegation (216) faol delegatsiyani qaytaradi; cc-sla.cron expireDelegations (185)

**20.42  ❌ yo'q**  — ❓ EP-CC-042: Tasdiq/qaror oynasida 'asos: qaysi hujjat/ma'lumot raqami' majburiy maydonmi?
- Siz: Qaror qaysi ma'lumotga tayanganini ko'rsatish shart
- Isbot: approve/createDraft DTO'da 'asos manba/reference' majburiy maydon yo'q (cc-workflow.types); sender_comment ixtiyoriy matn — strukturali asos-maydon amalga oshmagan — decisions OCHIQ

**20.43  🟡 qisman**  — ❓ EP-CC-043: Versiyalangan hujjat — yangi versiya chiqsa eskisi 'eskirgan', amal bloklanadimi?
- Siz: Eski ma'lumot ustida ishlash taqiq + to'liq versiya tarixi
- Isbot: cc-documents-write.repo snapshotVersion + version+1 (resubmit'da); cc_document_versions jadval; LEKIN 'eskirgan' status bayrog'i + eski versiya ustida amal bloklash mexanizmi yo'q — versiya tarixi bor, qulf yo'q

**20.44  ❌ yo'q**  — ❓ EP-CC-044: Hujjat maydonlari bo'lim-vakolatiga ko'ra tahrir-huquqi (СОЗ reja, ОТК sifat)mi?
- Siz: Bir bo'lim boshqasi maydonini buzmaydi — maydon RBAC
- Isbot: Maydon-darajali RBAC (СОЗ→reja, ОТК→sifat) kodda yo'q; cc_documents JSONB ai_answers bitta blob — maydon×rol mapping amalga oshmagan — decisions OCHIQ

**20.45  ❌ yo'q**  — ❓ EP-CC-045: 'Ma'lumot talabi' shabloni (kimga+ma'lumot+muddat→javob qaytadi)mi?
- Siz: Совершенствование rasmiy talab, muddat bilan
- Isbot: 'Ma'lumot talabi' shabloni seed qilinmagan (14 HR shablon ichida yo'q); talab→javob bog'lash oqimi kodda yo'q — decisions OCHIQ (yangi shablon, egasi tasdig'i kerak)

**20.46  ❌ yo'q**  — ❓ EP-CC-046: 'Reja o'zgartirish' shabloni — tashabbuskor+sabab+kutilgan natija (3 majburiy)mi?
- Siz: 'Juda zaril' og'zaki bosimni yo'q qilish
- Isbot: 'Reja o'zgartirish' shabloni cc_document_templates'da seed qilinmagan; tashabbuskor/sabab/natija majburiy maydonlari amalga oshmagan — egasi alohida ta'kidlagan, lekin qurilmagan

**20.47  ❌ yo'q**  — ❓ EP-CC-047: Reja o'zgartirish sabab 5 guruhdan (dropdown) tanlanadimi?
- Siz: Qattiq tasnif → oylik tahlil avtomat
- Isbot: Reja-o'zgartirish shabloni yo'q (EP-CC-046), shu sababli 5-sabab dropdown ham yo'q; ai_questions JSONB bor lekin bu tasnif uchun seed qilinmagan

**20.48  ❌ yo'q**  — ❓ EP-CC-048: Buyurtmani 100%dan oldin yopish uchun tasdiqlangan 'reja o'zgartirish' hujjati shartmi?
- Siz: Yarim qolgan buyurtma + qayta sozlash vaqti yo'qotilmasligi
- Isbot: Reja-o'zgartirish shabloni yo'q; MES buyurtma yopish ↔ CC hujjat bog'liqligi (bloklash) kodda yo'q — decisions OCHIQ, Production qarori kerak

**20.49  ❌ yo'q**  — ❓ EP-CC-049: Har smena 'smena yakuni xulosasi' majburiy hujjat (deadline=shu kun)mi?
- Siz: Kunlik hisobot majburiy, 3 soatda yuborilmasa ishlamagan hisob
- Isbot: 'Smena yakuni xulosasi' shabloni seed qilinmagan; kunlik majburiy hujjat + deadline cron kodda yo'q (spawnRecurringDocuments cc-sla.cron:197 PLACEHOLDER, hech narsa qilmaydi)

**20.50  ❌ yo'q**  — ❓ EP-CC-050: 'Tунги smena qarori' maxsus hujjat (muammo+qaror+javobgar→ertasi tasdiq)mi?
- Siz: Tунги qaror javobgarligi aniq, ertasi rahbar ko'radi
- Isbot: Tунги-smena-qaror shabloni seed qilinmagan; maxsus oqim + telefon/Telegram eskalatsiya kodda yo'q — decisions OCHIQ

**20.51  🟡 qisman**  — ❓ EP-CC-051: Muammo-hujjatlarga qisqa SLA (15daq/1soat) sozlanadimi?
- Siz: Generik 24 soat emas — daqiqalar bilan
- Isbot: cc_document_templates.inbox_sla_hours/escalation_hours ustunlar SOAT birligida (daqiqa emas); seed'da faqat 24/48 soat — 15daq/1soat muammo-SLA yo'q (muammo-shablonlari ham yo'q); mexanizm soat-darajada bor

**20.52  🟡 qisman**  — ❓ EP-CC-052: Muammo-hujjat yopilganda 'orgpolitika yozish' vazifasi avto tug'iladimi (НО-3 kaskad)?
- Siz: Har takrorlanuvchi xato → orgpolitika sikli
- Isbot: cc-event.listener cc.spawn → draft+Kanban karta MEXANIZMI bor; LEKIN muammo-hujjat 'yopilish'idan cc.spawn emit qiluvchi domen-kod yo'q (faqat webhook emit qiladi); orgpolitika shabloni ham yo'q — kaskad ulanmagan

**20.53  🟡 qisman**  — ❓ EP-CC-053: Yangi orgpolitika → adaptatsiya menejeriga o'qitish vazifasi (1 kun deadline) avtomi?
- Siz: Qoida qog'ozda qolmaydi — 1 kunlik o'qitish vazifasi
- Isbot: cc.spawn listener Kanban kartaga vazifa yarata oladi (mexanizm), lekin orgpolitika-tasdiq→adaptatsiya-vazifa avto-oqimi kodda yo'q; orgpolitika shabloni seed qilinmagan; 1-kun deadline mantig'i yo'q

**20.54  ❌ yo'q**  — ❓ EP-CC-054: Xodim orgpolitikani ochib 'tanishdim' (PIN/imzo) → qayd, tanishmasa ish boshlay olmaydimi?
- Siz: 'Bilmasdim' bahonasini yo'q qiladi
- Isbot: cc_policy_acknowledgments jadval/oqim topilmadi (1000-javob #14 va'da qiladi); 'tanishdim' PIN-tasdiq + ish-bloklash gate amalga oshmagan; orgpolitika shabloni ham yo'q

**20.55  ❌ yo'q**  — ❓ EP-CC-055: НАЗОРАТ ВАРАҚАСИ — har mavzu yonida raqamli PIN-imzo, progress kuzatiladimi?
- Siz: РД-5 real adaptatsiya hujjati — har mavzu o'qilgani isbotlanadi
- Isbot: НАЗОРАТ ВАРАҚАСИ checklist-hujjati (mavzu×imzo) jadval/shablon kodda yo'q; LMS/adaptatsiya bilan bog'lanish bu QISM A'da topilmadi — qurilmagan

**20.56  ❌ yo'q**  — ❓ EP-CC-056: тех карта oqimida 'Лаборатория → Одобрена' majburiy imzo bosqichimi?
- Siz: Muhrsiz тех карта ishlab chiqarishga o'tolmaydi
- Isbot: тех карта shabloni CC'da yo'q; 'Одобрена' laboratoriya-tasdiq bosqichi cc_workflow_steps'da seed qilinmagan; Production/QC gate bilan ulanish yo'q — egasi alohida yozgan muammo, qurilmagan

**20.57  ❌ yo'q**  — ❓ EP-CC-057: тех карта tasdiqlash oynasida 4-punktli moslik-checklist (miqdor/qog'oz/jarayon/pichoq)mi?
- Siz: Опросный лист bilan majburiy solishtirish
- Isbot: тех карта shabloni yo'q (EP-CC-056); opросный лист↔тех карта checklist mexanizmi kodda yo'q — decisions OCHIQ

**20.58  ❌ yo'q**  — ❓ EP-CC-058: 'Taъминот заявкаси' shabloni (material+miqdor+buyurtma→taъminot navbatiga)mi?
- Siz: Qog'oz yetmaganda og'zaki emas, rasmiy iz
- Isbot: Taъминот-заявка shabloni seed qilinmagan; MM/PO bilan ulanish kodda yo'q — qurilmagan

**20.59  ❌ yo'q**  — ❓ EP-CC-059: 'Smena хом-ашё заявкаси' 2-soatlik majburiy SLA shablonmi?
- Siz: Operator kutib qolmaydi — 2 soat oldin
- Isbot: Хом-ашё-заявка shabloni yo'q; 2-soatlik SLA mexanizmi (faqat soat-darajali generik SLA bor) bu maxsus tur uchun amalga oshmagan

**20.60  ❌ yo'q**  — ❓ EP-CC-060: 'Режа қоғози' rulon-hujjati (reja-miqdor+fakt-vazn+qaytarilgan→buxgalteriyaga)mi?
- Siz: Режа қоғози = qog'oz harakatini nazorat asosiy hujjati
- Isbot: Rulon режа қоғози shabloni seed qilinmagan; fakt-vazn maydonlari + Finance/Ombor avto-uzatish kodda yo'q — egasi 'asosiy hujjat' degan, qurilmagan

**20.61  🟡 qisman**  — ❓ EP-CC-061: Har hujjat/orgpolitika СЕРИЯ (kategoriya) tegi (Технология/Moliya/HR)mi?
- Siz: Qidiruv va papka tashkili СЕРИЯ bo'yicha
- Isbot: cc_document_templates.category bor (ariza/buyruq/hisobot/xabar) — kategoriya tegi mavjud, LEKIN egasi nazarda tutgan СЕРИЯ «Технология» kabi domen-seriyalar emas, HR-ish-oqim kategoriyalari; orgpolitika-СЕРИЯ yo'q

**20.62  ❌ yo'q**  — ❓ EP-CC-062: Hujjatga bir nechta 'maqsad lavozim' → har biriga avto tushadi + tanishuv talabmi?
- Siz: Bir hujjat ko'p lavozim-papkaga, har biriga yetkaziladi
- Isbot: Ko'p-maqsad-lavozim (target positions) maydoni/oqimi cc_documents'da yo'q; marshrut bitta zanjir bo'yicha — bir nechta papkaga parallel yo'naltirish + tanishuv talabi amalga oshmagan

**20.63  🟡 qisman**  — ❓ EP-CC-063: Orgpolitika/strategik marshrut oxiri = asoschi (Ayubxon Pozilov) imzosimi?
- Siz: Strategik hujjat egasi tasdig'isiz rasmiy emas
- Isbot: resolver DIRECTOR 'HAMMASI OXIRI DIREKTORGA' (cc-org-resolver:64) — oxirgi bosqich direktor; migration cc-director-final-step mavjud; LEKIN 'asoschi' alohida rol/PIN (direktordan farqli) seed qilinmagan; orgpolitika shabloni yo'q

**20.64  ❌ yo'q**  — ❓ EP-CC-064: Orgpolitika marshruti = departament rahbari → bosh rahbar (joriy etish ruxsati) → НО-3mi?
- Siz: Joriy etishdan oldin yuqori ruxsat bosqichi
- Isbot: Orgpolitika shabloni va uning maxsus 3-bosqichli marshruti (dep-rahbar→bosh-rahbar→НО-3) seed qilinmagan; bu maxsus oqim cc_workflow_steps'da yo'q

**20.65  🟡 qisman**  — ❓ EP-CC-065: Hujjat-modul yagona rasmiy kanal (A-System/Bitrix o'rniga)mi?
- Siz: Bitrix24 olib tashlanadi — to'liq ERP
- Isbot: CC ichki yozma-rasmiylashtirish kanali sifatida qurilgan (workflow+PIN+PDF); webhook tashqi tizim qabul qiladi; LEKIN A-System/Bitrix migratsiya/almashtirish faol jarayon emas — CC yangi kanal, lekin eski tizim ko'chirish ulanmagan

**20.66  ❌ yo'q**  — ❓ EP-CC-066: Oy oxirida qaydlardan oylik tahlil-hujjat avto tuziladimi (reja o'zgarish soni/sabab)?
- Siz: Qo'lda yig'ish unutiladi — avto agregatsiya
- Isbot: Oylik tahlil avto-agregatsiya cron'i yo'q (cc-sla.cron faqat SLA/escalation); reja-o'zgarish statistikasi yo'q (chunki reja-o'zgarish shabloni ham yo'q) — qurilmagan

**20.67  ❌ yo'q**  — ❓ EP-CC-067: Tahlil-hujjat sabab-markazli (kim aybdor emas, nima sabab) + izoh maxfiymi?
- Siz: 'Jazo uchun emas' — yolg'on izoh riskini kamaytirish
- Isbot: Tahlil-hujjat shabloni/formati yo'q; sabab-markazli format + izoh-maxfiyligi mexanizmi amalga oshmagan — qurilmagan

**20.68  ❌ yo'q**  — ❓ EP-CC-068: Reja bajarilmagan/ortiqcha bo'lsa operator izohi majburiy (izohsiz=bajarilmagan)mi?
- Siz: Izohsiz yopish = sabab yo'qoladi = takror muammo
- Isbot: Bu MES reja-yopish gate'i; CC'da reja-yopish izoh-majburiyligi yo'q (CC reja-shablonsiz); MES bilan integratsiya bu QISM A'da topilmadi

**20.69  ❌ yo'q**  — ❓ EP-CC-069: Og'zaki topshiriq uchun 'keyin rasmiylashtir' tugmasi + eslatmami?
- Siz: Tezkor og'zaki kelishuv yo'qolmaydi
- Isbot: 'Keyin rasmiylashtir' tugmasi + eslatma oqimi CC'da topilmadi; og'zaki→yozma majburlash mexanizmi amalga oshmagan

**20.70  ❌ yo'q**  — ❓ EP-CC-070: Hujjat har darajada rahbar 'umumlashtirish/xulosa' qo'shib yuqoriga o'tadimi?
- Siz: Darajalararo umumlashtirish — to'g'ridan o'tmaydi
- Isbot: Har bosqichda 'rahbar xulosasi/umumlashtirish' maydoni cc_documents/approval'da yo'q; approve comment ixtiyoriy izoh, strukturali umumlashtirish emas — decisions OCHIQ

**20.71  ❌ yo'q**  — ❓ EP-CC-071: Hujjat maydonlari rolga bog'liq (texnik yechim=texnolog, mijoz talabi=savdo)mi?
- Siz: Savdo texnik qaror yozmaydi — vakolatga mos maydon
- Isbot: Maydon×rol RBAC kodda yo'q (EP-CC-044 bilan bir xil bo'shliq); ai_answers JSONB rolsiz — decisions OCHIQ

**20.72  ❌ yo'q**  — ❓ EP-CC-072: 'Sifat ogohlantirishi' tez-hujjati ОТК→СОЗ qisqa SLA + ishtirokchi-zanjir avtomi?
- Siz: Sifat buzilishi partiyaga tarqalmasligi — daqiqalar muhim
- Isbot: Sifat-ogohlantirish shabloni seed qilinmagan; ОТК→СОЗ tez-oqim + ishtirokchi avto-chaqirish kodda yo'q; QC modul bilan ulanish bu QISM A'da topilmadi

**20.73  ❌ yo'q**  — ❓ EP-CC-073: 'Sifat ишчи журнали' append-only registr (har smena+o'chmas→oylik tahlil)mi?
- Siz: Sifat qaydi o'chirilmasligi kerak
- Isbot: Sifat ишчи журнали shabloni/registri CC'da yo'q (append-only umumiy audit bor, lekin sifat-журнал alohida emas); QC tekshiruv qaydi bilan ulanish yo'q

**20.74  🟡 qisman**  — ❓ EP-CC-074: Tasdiqlangan hujjat immutable — faqat bekor/qarama-qarshi yozuv qo'shiladimi?
- Siz: 'Men o'chirib tashladim' teshigini yopadi
- Isbot: Immutability WORKFLOW darajasida (faqat draft tahrir; approved qayta yuborilmaydi; audit append-only); LEKIN DB-trigger/constraint darajasida UPDATE bloklash YO'Q — texnik jihatdan UPDATE mumkin; immutability ishonchi kodga tayanadi, DBga emas

**20.75  🟡 qisman**  — ❓ EP-CC-075: Hujjat 3 yozuvda (lotin/kirill/ru), default=asl til (kirill ko'p)mi?
- Siz: Mavjud rasmiy hujjatlar kirillda — kirill ustuvor
- Isbot: language ustun 'uz'/'ru' (EP-CC-032 bilan bir xil); PDF transliterate bor; LEKIN uz-cyr (kirill) alohida yozuv sifatida default emas — 2 til, 3-yozuv to'liq emas

**20.76  ❌ yo'q**  — ❓ EP-CC-076: Qog'oz hujjat skani + meta (raqam/СЕРИЯ/sana/lavozim) → arxivda qidiriladigani?
- Siz: O'tish davrida qog'oz+raqamli birga, eski papkalar yo'qolmaydi
- Isbot: Skan-yuklash + meta-arxiv oqimi/endpoint CC'da topilmadi (cc_attachments jadval bor lekin skan-arxiv oqimi ulanmagan); OCR ham yo'q (1000-javob #46 'faza 2' deydi)

**20.77  🟡 qisman**  — ❓ EP-CC-077: Org-karta har lavozimga РД/НО kod, hujjat marshruti kod bilanmi?
- Siz: Egasi va xodimlar РД-2/4/5/НО-3/13 kodlar bilan ishlaydi
- Isbot: resolver POSITION:<CODE> qo'llaydi (cc-org-resolver:192), demak РД-kodlar TEXNIK MUMKIN; LEKIN seed qilingan step-kodlar generik (DIRECTOR/MANAGER_OF_SENDER/POSITION:CFO/HR_HEAD/KASSIR) — РД-2/4/5/НО-3/13 kodlari positions'da/steps'da yo'q

**20.78  ❌ yo'q**  — ❓ EP-CC-078: 'Bo'limlararo qaror protokoli' (РД-2/4/5+qaror+javobgar, har biri PIN-imzo)mi?
- Siz: Bir nechta rahbar qarori aniq yozilsin — 'demagandim' bahsi yo'q
- Isbot: Bo'limlararo protokol shabloni + ko'p-imzo (kvorum) mexanizmi CC'da yo'q; Coordination-protokol bilan ulanish bu QISM A'da topilmadi — decisions OCHIQ

**20.79  ❌ yo'q**  — ❓ EP-CC-079: Deadline o'tib uzilish → tizim 'tashkiliy xato — javobgar bo'lim' avto yozadimi?
- Siz: Xato egasi (qaysi bo'lim) aniq belgilanadi
- Isbot: 'Tashkiliy xato' avto-qayd mexanizmi CC'da yo'q (SLA overdue bayrog'i bor, lekin 'javobgar bo'lim' tashkiliy-xato yozuvi emas); Production bilan ulanish yo'q — decisions OCHIQ

**20.80  ❌ yo'q**  — ❓ EP-CC-080: Reja/topshiriq turlarida 'rasmiy=faqat yozma qayd' qoidasi ekranda ko'rsatiladimi?
- Siz: 'Men aytib qo'ygandim' qabul qilinmaydi
- Isbot: Ekranda 'og'zaki rasmiy emas' qoida-ko'rsatkichi + faqat-yozma 'berildi' belgilash mexanizmi topilmadi; reja-shablon ham yo'q

**20.81  ❌ yo'q**  — ❓ EP-CC-081: 'Orgpolitika' shabloni 4-bo'lim (Hozirgi holat/Maqsad/Harakatlar/Mukammal manzara)mi?
- Siz: Egasining orgpolitika formati — 'Тасаввурдаги мукаммал манзара' bilan tugaydi
- Isbot: Orgpolitika shabloni cc_document_templates'da seed qilinmagan; 4-bo'limli struktura (ai_questions JSONB) bu format uchun yo'q — egasi formatiga mos shablon qurilmagan

**20.82  🟡 qisman**  — ❓ EP-CC-082: Hujjatlar zanjir bo'lib bog'lanadi (ota-bola), har bosqich oldingisiga natija qaytaradimi?
- Siz: Ballonsiz mashina=ulanmagan qismlar — to'liq iz
- Isbot: cc_documents.parent_document_id USTUN BOR + read.repo o'qiydi (cc-documents-read.repo:81); LEKIN parent_document_id HECH QACHON YOZILMAYDI (write.repo'da set qiluvchi kod yo'q) — zanjir-bog'lanish sxemada bor, funksional emas

**20.83  ❌ yo'q**  — ❓ EP-CC-083: 'Smena biriktirish' hujjati (dastgoh+operator+smena→rasmiy qayd, KPI)mi?
- Siz: Kim qaysi dastgohda ishlashi rasmiy → javobgarlik aniq
- Isbot: Smena-biriktirish shabloni CC'da yo'q; dastgoh×operator загрузка + KPI ulanish kodda yo'q — MES/HR domeniga yaqin, decisions OCHIQ

**20.84  🟡 qisman**  — ❓ EP-CC-084: 'Shoshilinch' tanlasa sabab+yuqori tasdiqlovchi majburiy, asossiz=oddiy navbatmi?
- Siz: Og'zaki 'juda zaril' bosimni cheklash — asoslangan ustuvorlik
- Isbot: cc_documents.priority (low/normal/high/urgent) + savat sort priority bo'yicha; LEKIN 'urgent' tanlanganda sabab+yuqori-tasdiqlovchi MAJBURIY gate yo'q — har kim urgent qo'ya oladi; ustuvorlik-tasniflash to'liq emas

---

