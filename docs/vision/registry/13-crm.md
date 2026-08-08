# CRM / Mijozlar bilan ishlash — Yagona Vizyon Registri (EP-CRM) — 2026-08-07

> **Manbalar:** `decisions/13-crm.md` (85 qaror) · `FULL-ITEM-LEVEL [Module-13]` (135 item) · `FULL-VISION-EXTRACTION` QISM A (50 qaror jadvali, satr 965-1039) / QISM C (TASDIQ-2146 §13, 85 qator, satr 3812-3954) / QISM D (V/VERIFY cross-ref, 33 qator, satr 5473-5521) · `vision-1000-answers/13-crm.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida CRM kodiga tegan **9 commit** qayta tekshirildi va tegishli bandlarda `Δ` qatorida belgilandi (jonli kodda spot-verify qilindi).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-CRM-001..085)** | **85** |
| **Qaror holati:** ✅ javoblangan | 73 |
| **Qaror holati:** 🔵 ochiq | 12 |
| **Qurilish:** Ha | 11 |
| **Qurilish:** Qisman | 30 |
| **Qurilish:** Yo'q | 42 |
| **Qurilish:** STALE-DOC | 2 |
| **Qurilish:** — (mos item topilmadi) | 0 |
| 2026-07-11 dan beri o'zgargan (Δ) | 19 (+6 II QISMda) |
| ⚠️ Manbalar orasida ziddiyat | 19 (13 I QISM + 6 II QISM) |
| **II QISM — EP-kodsiz bo'shliqlar (VR-CRM-I01..I50)** | **50** (Qisman 11 · Yo'q 35 · STALE-DOC 4) |

> **Eslatma (qurilish ≠ qaror):** ikki o'q **mustaqil**. Masalan EP-CRM-063 (egasizlantirish N kun) qaror bo'yicha hamon 🔵 **OCHIQ** (egasi aniq N=30/60 ni tasdiqlamagan), lekin qurilish bo'yicha **STALE-DOC** — `lead-aging-reassign.cron.ts` to'liq qurilgan va `CRM_LEAD_AGING_REASSIGN_DAYS = 60` konstantasi bilan har kuni ishlaydi. Teskarisi ham bor: EP-CRM-039 (Папка №) qaror bo'yicha ✅ **JAVOBLANGAN**, qurilish bo'yicha **Yo'q** (grep = 0).

> **Eslatma (sanoq tekshiruvi):** `decisions/13-crm.md` ning O'Z Xulosasi "73 javoblangan / 12 ochiq" deydi — band-ma-band sanadim, **to'g'ri**: `grep -c "^### EP-CRM-"` → 85; `JAVOBLANGAN` → 74 satr (1 tasi Xulosa satri) = 73; `🔵 OCHIQ` → 13 satr (1 tasi Xulosa satri) = 12. 73 + 12 = 85 ✓. 🔵 OCHIQ ro'yxati: EP-CRM-002, 007, 012, 018, 020, 024, 028, 057, 063, 079, 081, 085.

> **Eslatma (raqamlash siljishi — III QISMda to'liq):** `FULL-ITEM-LEVEL [Module-13]` da **135** item, EP-kod esa **85**. Xaritalash SD moduldan sodda va **toza**:
> `Item #1..#50` = `vision-1000-answers/13-crm.md` #1..#50 = `EXTRACTION QISM A` #1..#50 — **EP-kodi YO'Q** → II QISM (`VR-CRM-I01..I50`) ·
> `Item #51..#135` = **EP-CRM-001..085** (offset −50, uzluksiz, takror yo'q) — bir vaqtning o'zida `EXTRACTION QISM C §13 #1..#85` bilan ham 1:1 mos.

---

## I QISM — EP-kodli qarorlar (EP-CRM-001..085)

### EP-CRM-001 · Lid → bitim → voronka bosqichlari
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — to'liq voronka (Yangi → Aloqa → Kommercheskiy taklif → Muzokara → Yutdik/Yutqazdik) + har bosqich konversiya foizi. ShVB YO'NALISH 26 `conversionRate`/`salesCycleLength` GSD; vizyon oltin-ip lead'dan boshlanadi.
- **Manba:** SHvB YO'NALISH 26 (conversionRate, closedDeals) + master reja oltin-ip + v1-A
- **Dalil (kod):** `crm/analytics/funnel.service.ts:90,144` — `conversionRate: safeDiv(movedToNext, entered) * 100` real hisob, stub emas. `SELECT count(*) FROM crm_lead_stages` → **6**. **Δ:** `04a4e5db` — FE `QuickCreateModal.tsx` da bitim yaratish butunlay bloklangan edi (voronkaga yangi bitim kirmasdi).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-CRM-002 (bosqich nomlari — bloklovchi), EP-CRM-051
- **action:** CREATE
- **⤳ Ta'sir:** SD (lead→buyurtma), KPI (konversiya), Director dashboard
- **Xoch-havolalar:** `[Module-13] Item 51` · `EXTRACTION QISM C §13 #1`
- **Δ 2026-07-11→08-07:** `04a4e5db` (2026-08-06) — Quick Create bitim yaratish tiklandi; voronkaga qo'lda kirish yo'li ochildi.

### EP-CRM-002 · Voronka bosqichlarini kim belgilaydi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — zavod jarayoniga moslab (namuna/обrazets → klişe/STP tasdiq → narx kelishildi → shartnoma), keyin egasi tahrir qiladi. Aniq bosqich NOMLARI egasidan (kitob qisqartirish-jadval "дизайн қилиш/аниқ ўлчов/шошилмаслик" → EP-CRM-061 dizayn bosqichi bilan birga belgilanadi).
- **Manba:** kitob qisqartirish jadval (dizayn/o'lcham bosqichlari) + v1-A (egasi keyin tahrir)
- **Dalil (kod):** `SELECT count(*) FROM crm_stages` → **0** (bo'sh). `crm_lead_stages` da 6 generic bosqich bor, lekin egasi-tahrirlaydigan konfig jadval bo'sh.
- **Nima yetishmaydi:** egasi-DATA — zavod-spetsifik bosqich nomlari (Namuna→STP→Narx→Shartnoma). Kod tomondan settings-CRUD `crm_loss_reasons` naqshi bo'yicha qurilishi mumkin.
- **Bog'liqlik:** EP-CRM-051 (dizayn bosqichi), EP-CRM-001
- **action:** CREATE
- **⤳ Ta'sir:** SD voronka, Dizayn bo'limi (kelishuv bosqichi)
- **Xoch-havolalar:** `[Module-13] Item 52` · `EXTRACTION QISM C §13 #2`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-003 · Lidlar qayerdan keladi (manbalar)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — ko'p manba (vebsayt + Telegram + qo'ng'iroq + qo'lda); har lidda "manba" majburiy. Egasi Telegram bot (har modulга) + europrint.uz sayt (HR Q12/Q27) ekotizimini tasdiqlagan → lid manbalari shulardan keladi.
- **Manba:** BARCHA_JAVOBLAR Q41/Q101 (modul botlari) + europrint.uz + ShVB Marketing costPerLead (manba-ROI) + v1-A
- **Dalil (kod):** `crm-auto-lead.controller.ts:96,109,122` — `ingestCallLead` / `ingestFormLead` / `ingestTelegramLead` uchta real endpoint; `source='call'/'web_form'/'telegram'` yoziladi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-CRM-004, EP-CRM-007
- **action:** CREATE
- **⤳ Ta'sir:** Marketing (costPerLead/ROI), AI integratsiya (Telegram)
- **Xoch-havolalar:** `[Module-13] Item 53` · `EXTRACTION QISM C §13 #3`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-004 · Vebsayt va Telegramdan avtomatik lid yaratish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — avtomatik lid + darhol sotuvchiga bildirishnoma (Telegram). Savol "kod allaqachon shu yo'nalishda" deydi; egasi modul botlari + bildirishnoma vaqti sozlanadigan (Q140) tizimni tasdiqlagan.
- **Manba:** v1-A + BARCHA_JAVOBLAR Q140 (bildirishnoma) + mavjud crm/leads kod
- **Dalil (kod):** `crm/listeners/website-lead.service.ts:47,81,99` — `notifySalesGroup({...})` real chaqiriladi; `website-contact-lead.listener.ts` + `website-order-lead.listener.ts` companion listenerlar mavjud. **Δ:** `9fabdacb` — `'manager'` roli 25 endpoint-guruhda 403 olardi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-CRM-003, EP-CRM-005
- **action:** EVENT
- **⤳ Ta'sir:** Bildirishnoma (NTF), AI (Telegram bot), SD
- **Xoch-havolalar:** `[Module-13] Item 54` · `EXTRACTION QISM C §13 #4`
- **Δ 2026-07-11→08-07:** `9fabdacb` (2026-08-06) — rol-guard ro'yxatiga `manager` qo'shildi; 403 blokirovkasi yopildi.

### EP-CRM-005 · Lidni avtomatik sotuvchiga biriktirish (taqsimot)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — avtomatik navbat (round-robin) yoki hudud/mahsulot qoidasi; boshliq qayta taqsimlay oladi. Karta-modelga ulanadi (kim qaysi mijozni ko'radi — EP-CRM-022/030).
- **Manba:** karta-model RBAC + v1-A
- **Dalil (kod):** `crm/listeners/website-lead.repository.ts:37` `pickNextSalesManager()` — oxirgi 30 kunda eng kam lidli menejerni tanlaydi; chaqiruv nuqtalari `website-lead.service.ts:41,75` + `lead-aging-reassign.cron.ts:63`. **Δ:** `3d500908` — `crm_leads.region` (TEXT) + `is_export` (BOOL) ustunlari qo'shildi → hudud-qoidasi uchun ma'lumot-tayanchi paydo bo'ldi.
- **Nima yetishmaydi:** hudud/mahsulot qoidasi hamon qo'llanilmaydi (faqat "eng kam yuklangan"); `SELECT FOR UPDATE SKIP LOCKED` yo'q (VR-CRM-I02).
- **Bog'liqlik:** EP-CRM-022, EP-CRM-063, VR-CRM-I02
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (sotuvchi kartasi), HR (yuklama balansi)
- **Xoch-havolalar:** `[Module-13] Item 55` · `EXTRACTION QISM C §13 #5` · `VR-CRM-I02`
- **Δ 2026-07-11→08-07:** `3d500908` (2026-07-11) — `region`/`is_export` ustunlari (EP-MKT-102 doirasida, jonli `crm_leads` jadvaliga); taqsimot mantig'i o'zgarmadi.

### EP-CRM-006 · Faollik (activity) jurnali
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'liq faollik jurnali (qo'ng'iroq/xat/uchrashuv/eslatma; sana + kim). Egasi to'liq audit-log + versiya tarixi ruhini tasdiqlagan (Q107/Q144); НО-2 Инспекция qo'ng'iroq nazorati shuni talab qiladi.
- **Manba:** BARCHA_JAVOBLAR Q107/Q144 (audit) + НО-2 (qo'ng'iroq nazorati) + v1-A
- **Dalil (kod):** `crm-comms.repository.ts` real; `SELECT count(*) FROM crm_activities` → **3** qator (yozuv yo'li ishlaydi).
- **Nima yetishmaydi:** 3 qator = jurnalni hamma faollik-yaratish yo'llari to'ldirmayapti; qo'ng'iroq turi (telefoniya) manbasi umuman yo'q (EP-CRM-028).
- **Bog'liqlik:** EP-CRM-028, EP-CRM-068
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (audit), 360° karta, Inspeksiya bo'limi
- **Xoch-havolalar:** `[Module-13] Item 56` · `EXTRACTION QISM C §13 #6`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-007 · Aloqa kanallari (SMS / Email / Telegram / WhatsApp)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — to'rttasi (Telegram + WhatsApp + SMS + Email), hammasi kartada. Egasi Email+Telegram (Q59) tasdiqlagan; WhatsApp/SMS qaysi avval ulanishi va provayder egasidan. Korporativ raqam (EP-CRM-031/035) WhatsApp/Telegram biznes akkaunt bilan birga (EP-CRM-035).
- **Manba:** BARCHA_JAVOBLAR Q59 (Email+Telegram) + НО-2 korporativ raqam + v1-A (qolgan kanal navbati egasidan)
- **Dalil (kod):** `crm/application/crm-comms.service.ts:49-60` — `sendWhatsapp()` faqat `repo.logWhatsapp()` chaqiradi va `{ channel:'whatsapp', reason: "WhatsApp provayder ulanmagan — faqat CRM tarixiga yozildi" }` qaytaradi. Kodning o'z izohi: hech qayerda provayder port/adapter yo'q.
- **Nima yetishmaydi:** hech bir kanalda real yuborish yo'q — kanal abstraksiyasi + tarix-log bor, tashqi provayder yo'q. Egasi-QAROR: qaysi provayder (SMS/WhatsApp) va navbat.
- **Bog'liqlik:** EP-CRM-008, EP-CRM-031, EP-CRM-035
- **action:** CREATE
- **⤳ Ta'sir:** AI integratsiya (Telegram/WhatsApp), Bildirishnoma
- **Xoch-havolalar:** `[Module-13] Item 57` · `EXTRACTION QISM C §13 #7`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-008 · Yozishmalar tarixini saqlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — hamma yozishma avtomatik saqlanadi va kartada ko'rinadi. Egasi "butun tizimdagi barcha hujjat/yozishma ERPda saqlanadi" (Q77) + korporativ akkaunt menejer ketsa qoladi (EP-CRM-035) prinsipini tasdiqlagan.
- **Manba:** BARCHA_JAVOBLAR Q77 (hammasi ERPda) + НО-2 (raqam zavodniki) + v1-A
- **Dalil (kod):** `crm-comms.service.ts` faqat **chiquvchi** xabarni loglaydi (`logWhatsapp` va h.k.). Kiruvchi xabar sinxroni hech bir faylda topilmadi.
- **Nima yetishmaydi:** ikki-tomonlama sinxron yo'q (kiruvchi webhook mexanizmi yo'q); korporativ-akkaunt arxivi yo'q (EP-CRM-035).
- **Bog'liqlik:** EP-CRM-007 (provayder), EP-CRM-035
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (immutable arxiv), 360° karta
- **Xoch-havolalar:** `[Module-13] Item 58` · `EXTRACTION QISM C §13 #8`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-009 · Vazifalar (task) va eslatmalar
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — vazifa + avtomatik eslatma (Telegram) + bajarilmasa boshliqqa signal. Egasi vazifa-eslatma + eskalatsiya (Q122 "eslatma 2x → eskalatsiya → HR/boshliq") modelini tasdiqlagan.
- **Manba:** BARCHA_JAVOBLAR Q122 (eslatma+eskalatsiya) + v1-A
- **Dalil (kod):** `SELECT count(*) FROM crm_tasks` → **16** (hujjatdagi "7" eskirgan — o'sgan, real foydalanish tasdiqlanadi); `listTasks` real. `grep "escalat"` butun CRM modulda → **0**.
- **Nima yetishmaydi:** eslatma CRON'i va eskalatsiya mantig'i butunlay yo'q — vazifa yaratiladi, lekin hech kim eslatilmaydi.
- **Bog'liqlik:** EP-CRM-010, EP-CRM-051, VR-CRM-I26/I49
- **action:** CREATE
- **⤳ Ta'sir:** Bildirishnoma, Coordination (eskalatsiya)
- **Xoch-havolalar:** `[Module-13] Item 59` · `EXTRACTION QISM C §13 #9`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-010 · Kechiktirilgan vazifa ustidan nazorat
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — kechikkan vazifalar avtomatik boshliq paneliga + sotuvchiga ogohlantirish. Заявка bumagi "Прошло (дней)" (EP-CRM-040) zavod amaliyoti; egasi 3-kun→blok kabi qat'iy muddat nazoratini yoqlaydi.
- **Manba:** kitob Заявка бумаги "Прошло (дней)" + BARCHA_JAVOBLAR Q122 + v1-A
- **Dalil (kod):** `artifacts/erp-dashboard/src/pages/MarketingLeads.tsx:64-65` — `useQuery(["/api/marketing/leads/automation/overdue-leads"])` real, jonli API-ga bog'langan sahifa.
- **Nima yetishmaydi:** avtomatik Telegram signali yo'q (faqat panelda ko'rinadi, hech kimga bormaydi); eskalatsiya yo'q (EP-CRM-009 bilan bir ildiz).
- **Bog'liqlik:** EP-CRM-009, EP-CRM-040
- **action:** CRON
- **⤳ Ta'sir:** Director/boshliq dashboard, Bildirishnoma
- **Xoch-havolalar:** `[Module-13] Item 60` · `EXTRACTION QISM C §13 #10`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-011 · Hot-lead (qaynoq mijoz) belgisi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — avtomatik (faollik + summa) tizim qaynoq lidni ajratadi va tepaga chiqaradi; menejer ko'radi. Mavjud `lead-scoring-agent.service.ts` + crm-ai kod; egasi 30% kiritish/70% AI-tahlil ruhini tasdiqlagan. (C aralash ham maqbul, lekin A vizyon "AI 70%"ga mos.)
- **Manba:** mavjud lead-scoring-agent kod + LOYIHA-BITGAN (70% AI tahlil) + v1-A
- **Dalil (kod):** `crm/domain/services/crm-lead-scoring.constants.ts:166,172` — `TIER_HOT_MIN = 70`, `TIER_WARM_MIN = 40` real konstantalar; `crm-lead-scoring.service.ts` 5-mezonli vaznli yig'indi + tier bandlash (mock emas).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-CRM-012, VR-CRM-I01 (real-time trigger yo'q — kunlik cron)
- **action:** AI
- **⤳ Ta'sir:** AI (scoring), SD (ustuvorlik)
- **Xoch-havolalar:** `[Module-13] Item 61` · `EXTRACTION QISM C §13 #11` · `VR-CRM-I01`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-012 · Lid baholash (lead scoring) — ball berish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — avtomatik ballash; QOIDALAR/MEZONLAR egasi kriteriyalariga moslab yoziladi. Kod bor (`lead-scoring-agent`, CLAUDE.md Q12 churn-day konstantalari), lekin aniq ball-formulasi (qiziqish/summa/javob-tezligi vazni) egasidan.
- **Manba:** mavjud lead-scoring kod + CLAUDE.md Q12 (CHURN_HIGH_DAYS konstanta) + v1-A (mezon egasidan)
- **Dalil (kod):** `crm-lead-scoring.service.ts` — aynan 5 vaznli mezon: `SCORING_W_BUDGET / _ENGAGEMENT / _RECENCY / _SOURCE / _FIT`; servis imzosida `weights` argumenti (per-tenant override imkoni) bor.
- **Nima yetishmaydi:** egasi-DATA — vazn qiymatlari; per-tenant override hech bir settings UI/endpoint orqali ochilmagan.
- **Bog'liqlik:** EP-CRM-011, VR-CRM-I01
- **action:** AI
- **⤳ Ta'sir:** AI, SD (ustuvorlik)
- **Xoch-havolalar:** `[Module-13] Item 62` · `EXTRACTION QISM C §13 #12`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-013 · AI — Keyingi eng yaxshi harakat (NBA)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — AI taklif beradi, sotuvchi tasdiqlab bajaradi. Savol "kod allaqachon shu yo'nalishda" deydi; egasi AI nazorat sotuvchida (tasdiqlash+tahrir, Q99) modelini tasdiqlagan.
- **Manba:** v1-A + BARCHA_JAVOBLAR Q99 (AI taklif, inson tasdiq) + mavjud crm-ai kod
- **Dalil (kod):** `crm/application/crm-ai.service.ts:94-105` `getNextBestAction()` — `{ recommended_action, alternatives, reasoning: 'Based on last activity type: ...' }`, DB'dan olingan real mantiq (stub emas), lekin sodda qoida — chuqur AI-model emas. **Δ:** `1ac2204f` — `ai/extended/*` dublikat aliaslari Fastify'ni **boot'da qulatardi**.
- **Nima yetishmaydi:** "AI" darajasi qoida-asosli (oxirgi faollik turi); inson-tasdiq oqimi UI'da alohida gate sifatida tasdiqlanmadi.
- **Bog'liqlik:** EP-CRM-014, EP-CRM-019
- **action:** AI
- **⤳ Ta'sir:** AI integratsiya, SD
- **Xoch-havolalar:** `[Module-13] Item 63` · `EXTRACTION QISM C §13 #13`
- **Δ 2026-07-11→08-07:** `1ac2204f` (2026-07-13) — takroriy `ai/extended/*` marshrutlari olib tashlandi; ular API'ni boot'da qulatgani uchun 2026-07-11 auditi paytida CRM AI endpointlari umuman javob bermagan bo'lishi mumkin.

### EP-CRM-014 · AI — Churn (mijoz ketib qolishi) bashorati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — AI "ketish xavfi yuqori" mijozlarni ro'yxatga chiqaradi + sotuvchiga qaytarish vazifasi. churn.service kod bor; ShVB Marketing/CRM `customerRetention`/churn GSD; kitob kg-trend pasayishi signal (EP-CRM-064).
- **Manba:** mavjud churn kod + ShVB YO'NALISH 25/26 (retention/churn) + v1-A
- **Dalil (kod):** `crm/analytics/churn.service.ts` + `churn-retrain.service.ts` real fayllar (5 feature, HIGH>0.7); `churn-rescue/:id` endpoint bor. **Δ:** `4d111226` — compat `crm-extended.service.ts churnAnalysis()` **soxta muvaffaqiyat** (`churnRisk:'low', score:0`) qaytarardi; endi halol `501 NOT_IMPLEMENTED`.
- **Nima yetishmaydi:** compat AI yuzasi endi 501 — ya'ni FE'ning shu yo'l orqali churn ko'rsatishi ishlamaydi; `crm_followup_activities` = **0** qator, ya'ni "qaytarish vazifasi" jonli yaratilmayapti (VR-CRM-I28).
- **⚠️ ZIDDIYAT:** `[Module-13] Item 64` "Ha" bahosi faqat **fayl mavjudligiga** (Glob) tayangan, xulq-atvorga emas; `4d111226` shu qatlamdagi bitta yuzaning soxta bo'lganini ko'rsatdi. QISM C #14 ham "Ha" deydi. Registrda **Qisman** deb baholadim.
- **Bog'liqlik:** EP-CRM-026, EP-CRM-055, EP-CRM-064
- **action:** AI
- **⤳ Ta'sir:** AI, Marketing (qaytarish kampaniyasi), SD
- **Xoch-havolalar:** `[Module-13] Item 64` · `EXTRACTION QISM C §13 #14` · `VR-CRM-I18/I28`
- **Δ 2026-07-11→08-07:** `4d111226` (2026-08-07) — soxta `churnAnalysis` compat endpoint 501 ga o'tkazildi (yashil-yolg'on yopildi, real integratsiya hali yo'q).

### EP-CRM-015 · Mijoz tarixi (360° ko'rinish)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — to'liq 360° (buyurtma + to'lov + qarz + yozishma + shikoyat) bir kartada, ERP modullari bilan bog'langan. Vizyon 360° mijoz; oltin-ip har modulni mijozga ulaydi; egasi "davlatda inson kabi to'liq" (Q106) ruhini tasdiqlagan.
- **Manba:** master reja 360° + oltin-ip + BARCHA_JAVOBLAR Q106 (to'liq profil) + v1-A
- **Dalil (kod):** `sd/infrastructure/repositories/drizzle-sd-customers/customer-360.builder.ts:101-105,126,191-193` — `orders.recentOrders`, `complaints`, `totalPaid/payments`, `openDebt = totalRevenue − Σpayments`: hammasi DB'dan olingan real maydonlar.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-CRM-025, EP-CRM-034, EP-CRM-038, EP-CRM-072, EP-CRM-077
- **action:** READ
- **⤳ Ta'sir:** Finance (qarz/to'lov), QC (shikoyat), SD (buyurtma), WMS
- **Xoch-havolalar:** `[Module-13] Item 65` · `EXTRACTION QISM C §13 #15` · `VR-CRM-I16`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-016 · CRM mijozi ↔ zavod buyurtmasi (oltin ip)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — bitim yutilsa → sotuv buyurtmasi avtomatik yaratiladi (bir tugma), to'liq oltin ip. Vizyon yadrosi; EP-SD-001/137 lead→buyurtma; "ikki buyurtma dunyosi" hal qilingan (eski `orders` DROP, kanon `sales_orders`).
- **Manba:** master reja oltin-ip + EP-SD-001/137 + transmission map (kanonik sales_orders) + v1-A
- **Dalil (kod):** `crm/domain/events/deal-won.event.ts` + `sd/infrastructure/event-handlers/deal-won.listener.ts` real. **Δ ⭐ `bbb46b63`:** Kanban bordda bitimni "yutdi" ustuniga sudrash `PATCH /crm/deals/:id/stage` chaqirardi, event esa faqat **hech kim chaqirmaydigan** `POST /:id/won` da chiqarilardi → SD sotuv-buyurtma yaratish va bildirishnoma listenerlari **hech qachon ishga tushmasdi**. Endi `update-deal-stage.handler.ts:76-92` real `not-won → won` o'tishida `DealWonEvent` chiqaradi (3 qavat idempotentlik: `isWonStage(new) && !isWonStage(from) && !alreadyLinked`). Markerlar `crm/domain/deal-stage-markers.ts` da (`WON_MARKERS = ['won','success','win','c0:win']`).
- **Nima yetishmaydi:** `crm_deals.sales_order_id` ustuni bor, lekin **DB-darajasida FK yo'q** (`pg_constraint` → 0, VR-CRM-I47). `stage_id` da `crm_stages` uuid'i tursa marker mos kelmaydi — `crm_stages` bo'sh (EP-CRM-002).
- **Bog'liqlik:** EP-CRM-001, EP-CRM-023, EP-CRM-059, EP-SD-001
- **action:** EVENT
- **⤳ Ta'sir:** SD (buyurtma), PP (reja), butun oltin-ip
- **Xoch-havolalar:** `[Module-13] Item 66` · `EXTRACTION QISM C §13 #16` · `VR-CRM-I47`
- **Δ 2026-07-11→08-07:** ⭐ `bbb46b63` (2026-08-07) — oltin-zanjirning eng katta uzilishi yopildi: Kanban orqali "yutdi" endi SD'ga yetib boradi.

### EP-CRM-017 · Mijoz bazasi qayerda — yagona manba
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** A — yagona kanonik mijoz bazasi; hamma modul shundan oladi. Vizyon master-data; kanonik nomzod `sd_customers` (faol UI; AI `customers` kutadi=bo'linish hal qilinadi). Egasi yagona ishonchli baza ruhini tasdiqlagan.
- **Manba:** master reja master-data + reference_live_db (kanonik nomzod sd_customers) + v1-A
- **Dalil (kod):** `SELECT count(*) FROM sd_customers` → **16**; `lead-converted-customer.listener.ts:50` real `INSERT INTO sd_customers (name, phone, email, segment, status, is_blocked, notes) SELECT ...` — yutilgan lid → mijoz.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-CRM-018, EP-CRM-037
- **action:** CREATE
- **⤳ Ta'sir:** SD, Finance, butun ERP (mijoz master-data)
- **Xoch-havolalar:** `[Module-13] Item 67` · `EXTRACTION QISM C §13 #17`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-018 · Mijoz turlari va segmentlari
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — segment ro'yxati egasi mezonlariga (oborot/sodiqlik) moslab tuziladi. ABC avto-toifa kod bor (EP-SD-007). Aniq segment NOMLARI (VIP/tarmoq/asosiy — EP-CRM-052 asosiy-mijoz bayrog'i bilan) egasidan.
- **Manba:** mavjud ABC repo (EP-SD-007) + kitob (Indorama=asosiy mijoz) + v1-A (segment ro'yxati egasidan)
- **Dalil (kod):** QISM C #18 "sd_customers.segment CHECK bor" deydi — **jonli DB'da rad etildi**: `SELECT conname FROM pg_constraint WHERE conrelid='sd_customers'::regclass AND contype='c'` → `[]` (umuman CHECK yo'q). `segment` ustuni bor (varchar), lekin `SELECT DISTINCT segment` → faqat `'new'`, `'B2B'`, `NULL` — vizyon nomlagan VIP/asosiy/oddiy qiymatlari yo'q.
- **Nima yetishmaydi:** egasi-DATA (segment taksonomiyasi) + hech qanday enum-cheklov yo'q — ustun erkin matn.
- **⚠️ ZIDDIYAT:** QISM C #18 "CHECK bor" **noto'g'ri** — `pg_constraint` bo'sh. STALE-DOC deb belgilandi.
- **Bog'liqlik:** EP-CRM-054 (asosiy mijoz), EP-SD-007 (ABC)
- **action:** CREATE
- **⤳ Ta'sir:** SD (ABC), Finance (kredit limiti), Hisobot
- **Xoch-havolalar:** `[Module-13] Item 68` · `EXTRACTION QISM C §13 #18`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-019 · RFM / CLV tahlili (mijoz qadr-qiymati)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — RFM + CLV hisobi panelga chiqadi. rfm/clv kod bor; vizyon 70% AI-tahlil; ShVB top-mijoz/leaderboard ruhi. Kitob kg-hajm (EP-CRM-064) RFM uchun "Monetary" manbasi.
- **Manba:** mavjud rfm/clv kod + LOYIHA-BITGAN (70% tahlil) + v1-A
- **Dalil (kod):** `crm/analytics/rfm.service.ts` + `clv.service.ts` + `kmeans.service.ts` real; FE `pages/CrmRfmClusters.tsx` `routes/CRMRoutes.tsx` da ro'yxatga olingan. **Δ:** `1ac2204f` boot-qulash tuzatildi.
- **Nima yetishmaydi:** RFM klasteri **on-demand** `POST rfm/cluster` endpointi orqali — har buyurtmadan keyin event-trigger yo'q (VR-CRM-I11); kg-o'lchov yo'q (EP-CRM-076).
- **Bog'liqlik:** EP-CRM-018, EP-CRM-076, VR-CRM-I11
- **action:** AI
- **⤳ Ta'sir:** AI, Hisobot (top mijoz), SD
- **Xoch-havolalar:** `[Module-13] Item 69` · `EXTRACTION QISM C §13 #19` · `VR-CRM-I11`
- **Δ 2026-07-11→08-07:** `1ac2204f` (2026-07-13) — CRM AI/analitika marshrutlarining boot-qulashi yopildi.

### EP-CRM-020 · Yutqazilgan bitim sababini yozish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — majburiy sabab (tayyor ro'yxat) + ixtiyoriy izoh → hisobot. Sabab RO'YXATI (narx/muddat/sifat/raqobatchi) egasidan; kitob qisqartirish-jadval "format/narx/чиқим" real sabablarni beradi.
- **Manba:** kitob qisqartirish jadval (narx/чиқим/format sabablari) + v1-A (ro'yxat egasidan)
- **Dalil (kod):** `crm_deals.lost_reason` (text, CHECK/lookup yo'q); FE `MarketingLeads.tsx:54,79,150,160,174,248` erkin-matn `lostReason` + `lossAnalysis` so'rovi → `LossAnalysisPanel`. **Yangilik (2026-07-08, audit sanasidan oldin):** `crm_loss_reasons` lookup jadval (`code, label_uz, label_ru, is_active, sort_order`) + `crm-settings.controller.ts` CRUD + `drizzle-crm-analytics.repo.ts:210` `getLossReasonRollup()` real SQL.
- **Nima yetishmaydi:** `crm_loss_reasons` = **0 qator** (urug'lanmagan) va `crm_deals` da `lost_reason_id` FK **yo'q** → rollup erkin matn bo'yicha guruhlaydi, strukturali taksonomiya emas. Egasi-DATA: sabab ro'yxati.
- **Bog'liqlik:** EP-CRM-027, VR-CRM-I41
- **action:** UPDATE
- **⤳ Ta'sir:** Hisobot (yutqaz tahlil), SD
- **Xoch-havolalar:** `[Module-13] Item 70` · `EXTRACTION QISM C §13 #20` · `VR-CRM-I41`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-021 · Kommercheskiy taklif / narx-taklif yuborish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — tizim ichida KP tayyorlash + yuborish + holat kuzatish (ko'rildi/qabul/rad). Kitob КП Пепси real rasmiy hujjat (raqam, narx jadvali, Коммерческий директор imzo); EP-SD-003/004 KP konvertatsiya+tasdiq.
- **Manba:** kitob КП Пепси.docx + EP-SD-003/004 + v1-A
- **Dalil (kod):** `lib/db/src/schema/crm-proposals.ts` + jonli `crm_proposals` da `status`, `sent_at`, `approved_at` ustunlari bor, lekin `SELECT count(*)` → **0**. `sd-quotations.*` (controller/service/repo) real va ishlatiladi. **Δ:** `47ccb174` — `crm_proposals.viewed_at` ustuni + email-piksel endpointi qo'shildi (`crm-bitrix-compat.controller.ts:133`, `crm-bitrix-compat-proposals.repository.ts:61-68` — idempotent `WHERE viewed_at IS NULL`).
- **Nima yetishmaydi:** `crm_proposals` bo'sh → "ko'rildi/qabul/rad" oqimi jonli isbotlanmagan; `sd_quotations` da `%view%`/`%accept%` ustunlari yo'q; KP PDF generatsiyasi yo'q (EP-SD-109).
- **Bog'liqlik:** EP-SD-003, EP-SD-004, VR-CRM-I05
- **action:** CREATE
- **⤳ Ta'sir:** SD (kotirovka), Org-karta (komdir tasdiq), Marketing (brending)
- **Xoch-havolalar:** `[Module-13] Item 71` · `EXTRACTION QISM C §13 #21` · `VR-CRM-I05`
- **Δ 2026-07-11→08-07:** `47ccb174` (2026-07-11) — KP "ko'rildi" email-piksel tracking (`viewed_at`) qurildi; vision-1000 #5 ning avto-kanal yarmini yopdi.

### EP-CRM-022 · Karta-model bilan integratsiya (kim CRMda ishlaydi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — CRM huquqlari karta bo'yicha (sotuvchi faqat o'z mijozini, boshliq hammasini) — karta-modelga to'liq bog'lash. Vizyon karta-markazli RBAC (maydon darajasi); kitob "Савдо рахбари / Савдо менежерлари" alohida lavozim (EP-CRM-062).
- **Manba:** master reja karta-RBAC + kitob (savdo rahbari/menejer) + v1-A
- **Dalil (kod):** `crm/common/crm-row-scope.ts` — `crmOwnerScope(user)` / `crmResolveOwnerId(row)` real, **fail-closed** (identifikatsiyasiz foydalanuvchi `-1` ga skoplanadi, "hammasini ko'r" emas). `deals.service.ts:31,49,74` + `leads.service.ts:32,47` + `drizzle-crm-leads.repo.ts:84,140` da qo'llanadi. **Δ:** `2db4f06b` — kanonik egalik ustuni `assigned_to` dan `COALESCE(assigned_by_id, manager_id)` ga tuzatildi; `ccd017c0` — `delete-deal`/`update-deal` handlerlarida IDOR yopildi.
- **Nima yetishmaydi:** `card_id` FK CRM entitilarida hamon **yo'q** (SB0629) → skoping `users.id` ga bog'langan, KARTAga emas; contacts/companies/activities skoplanmagan (faqat leads+deals); maydon-darajali RBAC yo'q (EP-CRM-067).
- **⚠️ ZIDDIYAT:** `[Module-13] Item 72` "row-level filtr yo'q" deydi — **eskirgan**: row-scoping `259b5c56` (2026-07-09) bilan, ya'ni audit sanasidan **2 kun oldin** qurilgan. Item `assigned_to` bo'yicha grep qilgan, kod esa uni ataylab **ishlatmaydi** → grep o'tkazib yuborgan.
- **Bog'liqlik:** EP-CRM-030, EP-CRM-062, EP-CRM-066, EP-CRM-067
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (lavozim), Xavfsizlik (RBAC)
- **Xoch-havolalar:** `[Module-13] Item 72` · `EXTRACTION QISM C §13 #22` · `VR-CRM-I14/I24`
- **Δ 2026-07-11→08-07:** `2db4f06b` (2026-07-13) egalik-ustuni tuzatildi · `ccd017c0` (2026-08-07) deal update/delete IDOR yopildi · `9fabdacb` (2026-08-06) `manager` roli guardlarga qo'shildi.

### EP-CRM-023 · Sotuvchi ЦКП va KPI bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — CRMdagi yopilgan bitim/oborot avtomatik sotuvchi KPI/ЦКП paneliga ulanadi. ShVB YO'NALISH 26 aynan shu GSD'lar (`weeklySalesVolume`/`closedDeals`/`averageDealSize`); karta=GSD vizyoni.
- **Manba:** SHvB YO'NALISH 26 (sotuv GSD) + master reja karta-GSD + v1-A
- **Dalil (kod):** `notifications/infrastructure/event-handlers/deal-won-notification.listener.ts:19-27` — real `@EventsHandler(DealWonEvent)`. **Δ:** `bbb46b63` gacha bu listener **hech qachon ishga tushmagan** (event faqat chaqirilmaydigan `POST /:id/won` da chiqarilardi) — endi Kanban o'tishida ham chiqadi.
- **Nima yetishmaydi:** eventdan keyingi haqiqiy GSD/ЦКП-yozuvni yangilaydigan zanjir topilmadi — faqat bildirishnoma; leaderboard SD tomonda va spetsifikatsiyaga mos emas (VR-CRM-I45).
- **Bog'liqlik:** EP-CRM-016, EP-CRM-064, VR-CRM-I37/I45
- **action:** EVENT
- **⤳ Ta'sir:** Org-karta (GSD/ЦКП), HR (reyting/bonus), Director dashboard
- **Xoch-havolalar:** `[Module-13] Item 73` · `EXTRACTION QISM C §13 #23` · `VR-CRM-I45`
- **Δ 2026-07-11→08-07:** `bbb46b63` (2026-08-07) — DealWonEvent nihoyat real oqimda chiqadi, ya'ni KPI-bildirishnoma zanjiri birinchi marta jonlandi.

### EP-CRM-024 · Mijoz qarzdorligi bo'yicha ogohlantirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — qarz limitidan oshsa avtomatik ogohlantirish; boshliq ruxsatisiz yangi bitim ochilmaydi. ShVB `debtorControl` GSD; kitob Дебитор siyosati. Aniq LIMIT qiymati + bloklash oqimi Finance/Даромадлар bilan (EP-CRM-036) egasidan.
- **Manba:** ShVB YO'NALISH 26 (debtorControl) + kitob Дебитор siyosati + v1-A (limit egasidan)
- **Dalil (kod):** `sd_customers.is_blocked` ustuni real; `crm-leads-ops.repository.ts:161-165` va `lead-converted-customer.listener.ts:50` uni faqat mijoz yaratishda `false` qilib qo'yadi. `openDebt` `customer-360.builder.ts` da hisoblanadi. `grep "creditLimit|credit_limit"` CRM'da → **0**.
- **Nima yetishmaydi:** limit oshganda `is_blocked` ni avtomatik yoqadigan mantiq yo'q; direktor-tasdiq oqimi yo'q; `crm-deals.controller.ts:116 @Post()` bitim ochishda hech qanday qarz-gate yo'q. Egasi-DATA: LIMIT qiymati (business_settings CRUD orqali sozlanishi kerak).
- **Bog'liqlik:** EP-CRM-036, EP-CRM-037, EP-CRM-069, VR-CRM-I07/I12/I23
- **action:** APPROVE
- **⤳ Ta'sir:** Finance (debitorlik), Даромадлар bo'limi, SD
- **Xoch-havolalar:** `[Module-13] Item 74` · `EXTRACTION QISM C §13 #24` · `VR-CRM-I12`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-025 · Mijoz shikoyatlari / reklamatsiyalar bog'lanishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — shikoyatlar mijoz kartasida ko'rinadi va hal bo'lguncha qizil belgi. Vizyon 360° + Sifat moduli bog'lanishi; EP-CRM-073/074 reklamatsiya hal bo'lmaguncha yangi yuk ushlash.
- **Manba:** master reja 360° + kitob Сифат бўлими↔мижоз (EP-CRM-034) + v1-A
- **Dalil (kod):** `customer-360.builder.ts:126-128` — `complaints` umumiy `interactions` qatorlaridan `type === 'complaint'` filtri bilan olinadi. `grep "QcReclamationOpenedEvent|ReclamationOpenedEvent"` butun `apps/api/src` bo'ylab → **0** (QC modulda `qc-reclamations.controller.ts` bor, CRM tomonda listener yo'q).
- **Nima yetishmaydi:** vizyon nomlagan `QcReclamationOpenedEvent` → CRM bir-yo'nalishli zanjiri yo'q; "hal bo'lguncha qizil belgi" holat-mashinasi yo'q.
- **Bog'liqlik:** EP-CRM-072, EP-CRM-073, VR-CRM-I15
- **action:** READ
- **⤳ Ta'sir:** Sifat nazorati (QC), SD
- **Xoch-havolalar:** `[Module-13] Item 75` · `EXTRACTION QISM C §13 #25` · `VR-CRM-I15`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-026 · Avtomatik eslatma kampaniyalari (follow-up)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — qoidaga ko'ra avtomatik eslatma (30/60/90 kun jimlikdan keyin) + sotuvchiga vazifa. Churn/retention vizyoni; EP-CRM-033 N-kun faolliksiz egasizlantirish bilan bir mexanizm.
- **Manba:** ShVB churn/retention + EP-CRM-033 (N kun) + v1-A
- **Dalil (kod):** `SELECT count(*) FROM crm_followup_activities` → **0**; `analytics/churn-retrain.service.ts` + `churn-rescue` kodi 4 faylda real. 30/60/90-kunlik CRON `crm_followup_activities` ga bog'langan holda topilmadi.
- **Nima yetishmaydi:** jimlik-triggerli 30/60/90 CRON yo'q; jadval bo'sh → kampaniya oqimi jonli emas.
- **⚠️ ZIDDIYAT:** `decisions/13-crm.md` "EP-CRM-033 N-kun faolliksiz egasizlantirish bilan bir mexanizm" deydi, ammo EP-CRM-033 = "Qo'ng'iroqlar nazorati (Инспекция)". N-kun egasizlantirish aslida **EP-CRM-063**. Hujjatda raqam adashgan.
- **Bog'liqlik:** EP-CRM-014, EP-CRM-063, VR-CRM-I28/I38
- **action:** CRON
- **⤳ Ta'sir:** Bildirishnoma, Marketing (kampaniya), AI churn
- **Xoch-havolalar:** `[Module-13] Item 76` · `EXTRACTION QISM C §13 #26` · `VR-CRM-I28`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-027 · CRM boshqaruv paneli (boshliq uchun)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** A — to'liq panel (voronka + sotuvchi reytingi + AI signal churn/hot + kechikkan vazifa) bitta ekran. ShVB YO'NALISH 26 (leaderboard + debitor trend); egasi direktor to'liq dashboard (Q123) ruhini tasdiqlagan.
- **Manba:** SHvB YO'NALISH 26 (leaderboard/trend) + BARCHA_JAVOBLAR Q123 (direktor dashboard) + v1-A
- **Dalil (kod):** `crm-auto-lead.controller.ts:58-61` `@Get('supervisor-dashboard')` → `crm-auto-lead.repository.ts:37-51` — real Drizzle SQL: har faol `sales_manager` uchun `leads_30d`, `open_deals`, `pipeline_value` guruhlab/tartiblab beradi (mock emas). **Δ:** `9fabdacb`.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-CRM-010, EP-CRM-062, EP-CRM-064
- **action:** READ
- **⤳ Ta'sir:** Director dashboard, KPI, AI
- **Xoch-havolalar:** `[Module-13] Item 77` · `EXTRACTION QISM C §13 #27`
- **Δ 2026-07-11→08-07:** `9fabdacb` (2026-08-06) — `manager` roli 403 olardi; supervisor-dashboard endi rahbarlarga ochiq.

### EP-CRM-028 · Telefon qo'ng'irog'ini yozib olish va biriktirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — telefoniya ulanadi, qo'ng'iroqlar avtomatik kartaga (kim/qachon/davomiylik/yozuv). НО-2 Инспекция qo'ng'iroq nazoratini talab qiladi (EP-CRM-033/032), demak tamoyil tasdiq; PROVAYDER/ATS texnik tanlovi + yozuv saqlash qonuniyligi egasidan (qo'shimcha sozlash).
- **Manba:** НО-2 (Инспекция qo'ng'iroq nazorati) + v1-A (provayder egasidan)
- **Dalil (kod):** `grep "call_records|call_recording|recording_url|telefoniya|ats_integration"` butun `apps/api/src` bo'ylab → **0**. `crm-auto-lead.service.ts:37 ingestCallLead(phone,...)` faqat telefon→lid ingestion.
- **Nima yetishmaydi:** butunlay yo'q — jadval ham, endpoint ham. Egasi-QAROR: ATS/telefoniya provayderi + yozuv saqlash qonuniyligi.
- **Bog'liqlik:** EP-CRM-032, EP-CRM-033, EP-CRM-080, VR-CRM-I09/I31/I43
- **action:** EVENT
- **⤳ Ta'sir:** Inspeksiya bo'limi, AI (qo'ng'iroq tahlili), 360° karta
- **Xoch-havolalar:** `[Module-13] Item 78` · `EXTRACTION QISM C §13 #28` · `VR-CRM-I09`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-029 · Mobil ilovada CRM (sotuvchi tashqarida)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mobil/telefonda asosiy CRM amallari (lid, vazifa, yozishma) ishlaydi. Egasi responsive web (PC+planshet+smartfon, POS Q3) + modul Telegram botlari (Q101) ruhini tasdiqlagan; sotuvchi ko'pincha tashqarida.
- **Manba:** BARCHA_JAVOBLAR POS Q3 (responsive) + Q101 (modul botlari) + v1-A
- **Dalil (kod):** `crm/listeners/website-lead.service.ts` + `telegram/handlers/crm.handler.ts` — Telegram bot orqali masofaviy lid qabuli real; FE responsive.
- **Nima yetishmaydi:** PWA oflayn-navbat + "server ustun" conflict-resolution yo'q (VR-CRM-I50); menejer "tashrif" faolligini mobil orqali kiritish oqimi yo'q (VR-CRM-I04).
- **Bog'liqlik:** VR-CRM-I04, VR-CRM-I50
- **action:** CREATE
- **⤳ Ta'sir:** AI (Telegram bot), Bildirishnoma, SD
- **Xoch-havolalar:** `[Module-13] Item 79` · `EXTRACTION QISM C §13 #29` · `VR-CRM-I50`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-030 · Mijoz ma'lumotlariga kirish chegarasi (maxfiylik)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — har sotuvchi faqat o'z mijozini, boshliq hammasini (karta-modelga bog'liq). Vizyon karta-RBAC; НО-2 "хизмат маълумоти ташқарига чиқиш хавфи" → maxfiylik majburiy; EP-CRM-075/076 kontakt yashirish + eksport blok.
- **Manba:** master reja karta-RBAC + НО-2 (ma'lumot himoyasi) + v1-A
- **Dalil (kod):** `crm-row-scope.ts` real row-scoping (EP-CRM-022 dalili bilan bir); `crm-deals.controller.ts:113 @Get('export')` row-skoplangan + majburiy audit yozuvi. **Δ:** `2db4f06b` + `ccd017c0`.
- **Nima yetishmaydi:** maydon-darajali yashirish (kontakt/narx/qarz) yo'q — `maskContact`/`hideContact` grep → 0 (EP-CRM-067); `card_id` FK yo'q.
- **⚠️ ZIDDIYAT:** `decisions/13-crm.md` "EP-CRM-075/076 kontakt yashirish + eksport blok" deydi, ammo EP-CRM-075 = "Oylik diog kg", EP-CRM-076 = "Yillik hajm". To'g'ri havolalar: **EP-CRM-067** (kontakt yashirish) + **EP-CRM-066** (eksport blok). Hujjatda raqam adashgan.
- **Bog'liqlik:** EP-CRM-022, EP-CRM-062, EP-CRM-066, EP-CRM-067
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik (RBAC, eksport blok), Org-karta
- **Xoch-havolalar:** `[Module-13] Item 80` · `EXTRACTION QISM C §13 #30` · `VR-CRM-I24`
- **Δ 2026-07-11→08-07:** `2db4f06b` (2026-07-13) egalik-ustuni tuzatildi · `ccd017c0` (2026-08-07) IDOR yopildi.

### EP-CRM-031 · Savdo menejeriga korporativ raqam biriktirish (v2 Q1)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — korporativ raqam menejer kartasiga biriktiriladi; ketsa raqam+baza yangi menejerga o'tadi (mijoz uzilmaydi). НО-2 "корпоратив мобил рақамни тақдим этиш" real qoida; egasi korporativ email/telefon ERPda ro'yxatga olinishini (Q74) tasdiqlagan.
- **Manba:** НО-2 "Телефон бериш тартиби" + BARCHA_JAVOBLAR Q74 (korporativ tel ERPda) + v2-A
- **Dalil (kod):** `grep "corporate.?number|corporate_number|abonent"` butun `apps/api/src` bo'ylab → **0**.
- **Nima yetishmaydi:** butunlay yo'q — `corporate_number` jadvali (menejer↔raqam bog'lanishi + ketishda o'tkazish) va controller kerak; HR-ketish eventiga ilgak kerak.
- **Bog'liqlik:** EP-CRM-032, EP-CRM-035, EP-CRM-080, VR-CRM-I17/I31/I43
- **action:** CREATE
- **⤳ Ta'sir:** HR (ishga qabul), Org-karta, Aloqa kanallari
- **Xoch-havolalar:** `[Module-13] Item 81` · `EXTRACTION QISM C §13 #31`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-032 · Aloqa abonentlari ro'yxati cheklovi (v2 Q2)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — faqat tasdiqlangan abonent doirasi (mijoz bazasi + qarindosh ro'yxati); tashqari raqam CRMda flaglanadi. НО-2 "Алоқа абонентлари" lavozimga aniq belgilangan; egasi ma'lumot-sizish himoyasini yoqlaydi.
- **Manba:** НО-2 (abonent doirasi) + v2-A
- **Dalil (kod):** `grep "abonent"` butun `apps/api/src` bo'ylab → **0**.
- **Nima yetishmaydi:** oq-ro'yxat jadvali + real-time webhook tekshiruvi + kartada bayroq — hech biri yo'q. EP-CRM-031 (asos-model) va EP-CRM-028 (telefoniya) bloklaydi.
- **Bog'liqlik:** EP-CRM-031 (old shart), EP-CRM-028 (old shart), EP-CRM-033
- **action:** CREATE
- **⤳ Ta'sir:** Xavfsizlik, AI (anomaliya), Inspeksiya bo'limi
- **Xoch-havolalar:** `[Module-13] Item 82` · `EXTRACTION QISM C §13 #32` · `VR-CRM-I31/I43`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-033 · Qo'ng'iroqlar nazorati (Инспекция бўлими) (v2 Q3)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — qo'ng'iroq jurnali avtomatik Инспекция бўлими paneliga (kim/qachon/davomiylik/mijoz). НО-2 "Инспекция ва хисоотлар бўлими бошлиғи томонидан қўнғироқлар назорати" — aniq reglament.
- **Manba:** НО-2 (Инспекция qo'ng'iroq nazorati) + v2-A
- **Dalil (kod):** `grep "telefoniya"` butun `apps/api/src` bo'ylab → **0** (EP-CRM-028/031/032 bilan bir sweep).
- **Nima yetishmaydi:** qo'ng'iroq jurnalining o'zi yo'q → panelga chiqaradigan narsa yo'q. EP-CRM-028 qattiq old shart.
- **Bog'liqlik:** EP-CRM-028 (old shart), EP-CRM-032, EP-CRM-068
- **action:** EVENT
- **⤳ Ta'sir:** Org-struktura (Инспекция bo'limi), AI tahlil
- **Xoch-havolalar:** `[Module-13] Item 83` · `EXTRACTION QISM C §13 #33`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-034 · Sifat bo'limi boshlig'i ham mijoz bilan gaplashadi (v2 Q4)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — Сифат бошлиғи ↔ mijoz aloqasi ham shu kartada ko'rinadi (turi: "sifat/reklamatsiya"). НО-2 Сифат бўлими бошлиғи abonentlari orasida "мижозлар" bor; vizyon yagona 360° tarix.
- **Manba:** НО-2 (Сифат бошлиғи мижоз abonenti) + master reja 360° + v2-A
- **Dalil (kod):** `customer-360.builder.ts:111-125` — `communications`/`interactions` bloki umumiy, farqlanmagan lenta.
- **Nima yetishmaydi:** "Сифат boshlig'i" uchun maxsus kontakt-teg mexanizmi yo'q — aloqa turi bo'yicha ajratilmaydi.
- **Bog'liqlik:** EP-CRM-015, EP-CRM-025, EP-CRM-072
- **action:** CREATE
- **⤳ Ta'sir:** Sifat nazorati (QC), 360° karta
- **Xoch-havolalar:** `[Module-13] Item 84` · `EXTRACTION QISM C §13 #34`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-035 · Korporativ raqamda Telegram/biznes-akkaunt (v2 Q5)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — korporativ Telegram/WhatsApp akkaunt → yozishma CRMda; menejer ketsa akkaunt qoladi. EP-CRM-031 amaliy davomi; egasi yozishma ERPda saqlanishi (Q77) prinsipini tasdiqlagan.
- **Manba:** НО-2 (raqam zavodniki) + BARCHA_JAVOBLAR Q77 + v2-A
- **Dalil (kod):** Telegram bot ingest kodi bor (`website-lead.service.ts`, `telegram/handlers/crm.handler.ts`), lekin bu **lid qabuli**, akkaunt-egaligi/o'tkazish emas. Akkaunt-egalik kodi grep → 0.
- **Nima yetishmaydi:** akkaunt-egalik yozuvi (bot/akkaunt id → KARTA, xodimga emas) + HR-ketish triggerli qayta biriktirish yo'q. Mavjud Telegram infra to'g'ridan-to'g'ri qayta ishlatilishi mumkin.
- **Bog'liqlik:** EP-CRM-031, EP-CRM-007, EP-CRM-008, VR-CRM-I17/I44
- **action:** CREATE
- **⤳ Ta'sir:** AI integratsiya (Telegram bot), Aloqa kanallari
- **Xoch-havolalar:** `[Module-13] Item 85` · `EXTRACTION QISM C §13 #35` · `VR-CRM-I17`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-036 · Debitor qarz Даромадлар bo'limida, savdoda emas (v2 Q6)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — qarz undirish vazifasi avtomatik Даромадлар bo'limiga; savdo menejeri faqat xabardor. (Nuance ↳: qarzli mijozga yangi bitim → avtomatik blok + Даромадлар tasdig'i; aniq oqim EP-CRM-024 limiti bilan.) Kitob Дебитор siyosati savdo↔undirishni ataylab ajratgan.
- **Manba:** kitob "Дебитор қарздорлик / Даромадлар бўлими бошлиғи" + EP-SD (Даромадлар=Дебитор) + v2-A
- **Dalil (kod):** `grep "Даромадлар"` + debitor-routing atamalari `apps/api/src` bo'ylab → **0**.
- **Nima yetishmaydi:** avval org-modelda "Даромадлар" bo'limi/KARTAsi bo'lishi kerak (Vysotskiy-7 ichida) — hozircha hech qayerda yo'q; keyin qarz-undirish vazifasini savdodan ajratuvchi routing qoidasi.
- **Bog'liqlik:** Org-modul (Даромадлар KARTAsi — old shart), EP-CRM-024, EP-CRM-037, EP-CRM-038
- **action:** CREATE
- **⤳ Ta'sir:** Finance (debitorlik), Org-struktura (Даромадлар bo'limi)
- **Xoch-havolalar:** `[Module-13] Item 86` · `EXTRACTION QISM C §13 #36` · `VR-CRM-I03`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-037 · Mijoz "qarz holati" kim tomonidan yangilanadi (v2 Q7)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — faqat Finance/Даромадлар modulidan avtomatik; savdo o'zgartira olmaydi (xolis raqam). Vizyon xolis ma'lumot manbasi; EP-CRM-073/067 narx/qarz manbasi avtomatik prinsipi bilan bir.
- **Manba:** kitob Дебитор siyosati + master reja (avtomatik manba) + v2-A
- **Dalil (kod):** `customer-360.builder.ts` — `openDebt` **SD modulining o'z repozitoriysida** `payments`/`orders` dan hisoblanadi, Finance modulining yozuv-yo'lidan emas.
- **Nima yetishmaydi:** "faqat Finance yozadi" qoidasi majburlanmagan — hisob SD 360-builder ichida yashaydi, Finance egalik qiladigan feed ortida emas. Kesh/TTL modeli ham yo'q (VR-CRM-I07).
- **Bog'liqlik:** EP-CRM-024, EP-CRM-036 (old shart), VR-CRM-I07
- **action:** READ
- **⤳ Ta'sir:** Finance
- **Xoch-havolalar:** `[Module-13] Item 87` · `EXTRACTION QISM C §13 #37` · `VR-CRM-I07`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-038 · Qarz bo'yicha mijozga aloqa qilish bayoni (v2 Q8)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — qarz aloqalari mijoz kartasida ko'rinadi (savdo + Даромадлар bir tarixda). Vizyon yagona 360°; ikki bo'lim parallel gaplashishi muvofiqlashtirilishi kerak (EP-CRM-034 mantiq).
- **Manba:** master reja 360° + kitob (Даромадлар↔mijoz) + v2-A
- **Dalil (kod):** EP-CRM-036 dagi "Даромадлар bo'limi yo'q" xulosasi bilan bir; `customer-360.builder.ts` da umumiy `communications`/`complaints` bloklaridan tashqari birlashgan qarz-aloqa tarixi yo'q.
- **Nima yetishmaydi:** EP-CRM-036 bo'limi qurilgach, uning aloqalarini mavjud 360 `communications` lentasiga qo'shish yetarli — hozircha manba yo'q.
- **Bog'liqlik:** EP-CRM-036 (old shart), EP-CRM-015
- **action:** READ
- **⤳ Ta'sir:** Finance, 360° karta
- **Xoch-havolalar:** `[Module-13] Item 88` · `EXTRACTION QISM C §13 #38`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-039 · "Папка №" — mijozning buyurtma papkasi (v2 Q9)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har CRM bitimi → Папка № bilan bog'lanadi; kartada mijoz papkalari ro'yxati. Kitob Заявка бумаги real "Папка №/Название заказа"; EP-SD-100 status ro'yxati shu papkadan; zavod bir tilda gaplashadi.
- **Manba:** kitob Заявка бумаги (Папка №) + EP-SD-100 + v2-A
- **Dalil (kod):** `grep "Папка|papka_number|folder_number"` butun `apps/api/src` bo'ylab → **0**.
- **Nima yetishmaydi:** Папка (buyurtma-papkasi) jadvali + raqamlash sxemasi + `sales_orders`/bitimdan havola — hech biri yo'q. Egasi-DATA: raqamlash konvensiyasi (format, mijoz-kesimmi yoki buyurtma-kesim).
- **Bog'liqlik:** EP-CRM-040 (bog'liq), EP-CRM-041, EP-CRM-042, EP-SD-100
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (papka), SD (buyurtma)
- **Xoch-havolalar:** `[Module-13] Item 89` · `EXTRACTION QISM C §13 #39`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-040 · "Прошло (дней)" — buyurtma necha kun turibdi (v2 Q10)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "o'tgan kun" avtomatik hisoblanadi + limitdan oshsa menejer va Даромадлар/ИшЧ boshlig'iga signal. Kitob Заявка bumagi "Прошло (дней)" real ustun; EP-CRM-010 kechikkan-vazifa bilan bir.
- **Manba:** kitob Заявка бумаги "Прошло (дней)" + v2-A
- **Dalil (kod):** FE `MarketingLeads.tsx:65` `/api/marketing/leads/automation/overdue-leads` — real "o'tgan kun" hisoblagichi, lekin **lid/vazifa** doirasida, buyurtma-papkasi doirasida emas.
- **Nima yetishmaydi:** Папка kontseptsiyasi yo'q (EP-CRM-039) → papka-kesimli hisoblagich ilinadigan joy yo'q; "Yuk chiqdi"da to'xtash qoidasi yo'q (VR-CRM-I36).
- **Bog'liqlik:** EP-CRM-039 (old shart), EP-CRM-010, VR-CRM-I36
- **action:** CRON
- **⤳ Ta'sir:** SD, Даромадлар/IshChiqarish boshlig'i, Bildirishnoma
- **Xoch-havolalar:** `[Module-13] Item 90` · `EXTRACTION QISM C §13 #40` · `VR-CRM-I36`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-041 · Mijozning qog'oz zayavkasi (Заявка бумаги) CRMda (v2 Q11)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijozning odatiy qog'oz profili (Наименование/Формат/Грам) saqlanadi va yangi bitimga avtomatik tortiladi. Kitob Заявка bumagi spetsifikatsiya; doimiy mijoz bir xil qog'oz → qayta buyurtma tez (EP-CRM-049/053).
- **Manba:** kitob Заявка бумаги (qog'oz spetsifikatsiyasi) + v2-A
- **Dalil (kod):** maxsus qog'oz-profil jadvali topilmadi; `crm_companies`/`sd_customers` ustunlarini ko'zdan kechirish "qog'oz profil"/pre-fill snapshot maydonini ko'rsatmadi.
- **Nima yetishmaydi:** intake paytidagi profil-snapshot jadvali + yangi-bitim formasida pre-fill mantig'i. Egasi/Dizayn-DATA: qog'oz blankasining aniq maydon to'plami.
- **Bog'liqlik:** EP-CRM-039, EP-CRM-043, EP-CRM-058, VR-CRM-I27
- **action:** CREATE
- **⤳ Ta'sir:** Ta'minot (qog'oz zayavkasi), Ishlab chiqarish
- **Xoch-havolalar:** `[Module-13] Item 91` · `EXTRACTION QISM C §13 #41` · `VR-CRM-I27`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-042 · "Примечание" (izoh) papkadan kartaga (v2 Q12)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — papka izohlari mijoz tarixida ko'rinadi (to'liq kontekst). Kitob Заявка jadval "Примечание" real ustun; izoh ko'pincha eng muhim kelishuv nuansi.
- **Manba:** kitob Заявка бумаги "Примечание" + v2-A
- **Dalil (kod):** `SELECT count(*) FROM crm_comments` → **3** — jadval real, lekin **umumiy** izoh jadvali, Папка/Заявка entitidan kelmaydi (u entiti mavjud emas — EP-CRM-039).
- **Nima yetishmaydi:** EP-CRM-039 Папка jadvali qurilgach trivial — uning "Примечание" maydonini kartaga ko'chirish. Hozircha to'liq bloklangan.
- **Bog'liqlik:** EP-CRM-039 (old shart)
- **action:** CREATE
- **⤳ Ta'sir:** 360° karta, Ishlab chiqarish (izoh)
- **Xoch-havolalar:** `[Module-13] Item 92` · `EXTRACTION QISM C §13 #42`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-043 · ГП kodi bo'yicha takroriy buyurtma (v2 Q13)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — kartada ГП-kod tarixi + "qayta buyurtma" tugmasi (eski spetsifikatsiya bilan). Kitob real ГП kodlari (ГП-2026-0187 Compact cotton, ГП-2025-4779 Indorama); doimiy mijoz qayta-qayta bir xil mahsulot.
- **Manba:** kitob ГП-kod (Compact cotton/Indorama) + v2-A
- **Dalil (kod):** `SELECT count(*) FROM crm_products` → **2** (kichik umumiy katalog). `grep "reorder|repeat.?order|qayta.?buyurtma"` FE'da → faqat PP/ombor i18n fayllarida aloqasiz mos kelishlar; CRM UI'da yo'q.
- **Nima yetishmaydi:** mahsulot-kesimli buyurtma-tarixi + o'tgan buyurtma qatorini yangi bitimga klonlaydigan "qayta buyurtma" endpoint/tugmasi.
- **Bog'liqlik:** EP-CRM-041, EP-CRM-044, EP-CRM-078, VR-CRM-I22/I35
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (tex-karta), SD (buyurtma)
- **Xoch-havolalar:** `[Module-13] Item 93` · `EXTRACTION QISM C §13 #43` · `VR-CRM-I22`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-044 · Mahsulot konstruksiya parametrlari kartada (v2 Q14)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — har mahsulotga to'liq konstruksiya profili (sloy/o'lcham/model/yozuv). Kitob ГП "5 sloylik", "68.1x45.6x34.8", "new model" real parametrlar; saqlansa tex-karta avto-to'ladi.
- **Manba:** kitob ГП parametrlari (sloy/o'lcham/model) + v2-A
- **Dalil (kod):** `grep "technology_cards"` `apps/api/src/modules/crm` ichida → **0** — jadval PP modulda (ADR-006), CRM'dan umuman havola qilinmaydi.
- **Nima yetishmaydi:** CRM bitim/mahsulot ko'rinishidan PP `technology_cards` ga mahsulot-kodi bo'yicha faqat-o'qish join/API chaqiruvi (MODUL_SHARTNOMASI naqshi).
- **Bog'liqlik:** PP `technology_cards` (mavjud, ulanmagan), EP-CRM-043, EP-CRM-061
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (tex-karta), Dizayn
- **Xoch-havolalar:** `[Module-13] Item 94` · `EXTRACTION QISM C §13 #44`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-045 · Brend/yozuv (Indorama) maketni eslab qolish (v2 Q15)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz maket/logotip/yozuv kutubxonasi kartada (versiyalar bilan). Kitob ГП yozuvlari "Indorama yozuvi yo'q / Indorama" real brend belgilari; saqlansa dizayn vaqti tejaladi, xato bosma yo'q.
- **Manba:** kitob ГП (brend/yozuv) + v2-A
- **Dalil (kod):** `SELECT count(*) FROM crm_documents` → **0**; umumiy hujjat-ombori, versiya-zanjiri ustunlari (`version`/`parent_document_id`) topilmadi.
- **Nima yetishmaydi:** versiyalangan maket/logotip jadvali (ota-bola versiya zanjiri) — umumiy `crm_documents` dan ajratilgan.
- **Bog'liqlik:** EP-CRM-079 (STP versiyalash — bir mavzu)
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn, Ishlab chiqarish (bosma)
- **Xoch-havolalar:** `[Module-13] Item 95` · `EXTRACTION QISM C §13 #45`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-046 · ГП topshirish blankasi savdo menejeri imzosi (v2 Q16)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — elektron blanka: омборчи + хайдовчи + савдо менежери tasdig'i; uchchovsiz yuk "chiqdi" bo'lmaydi. Kitob ГП топшириш blankasi 3 imzo (Azizov A real savdo menejeri imzosi); EP-SD-138 yetkazish fakti qayd.
- **Manba:** kitob ГП топшириш blankasi (3 imzo) + EP-SD-138 + v2-A
- **Dalil (kod):** `grep "3.?imzo|threeSignature|elektron.?blanka|e-imzo"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** 3 tomonlama (omborchi+haydovchi+menejer) PIN/e-imzo gate'i "yuk chiqdi" holat-o'tishini bloklashi kerak. **Egasi-QAROR (modul egaligi):** manba-jadvalning o'z izohi "EP-SD-138 da bo'lishi mumkin" deydi — CRM'ga tegishlimi yoki SD'ga, aniqlanmagan.
- **Bog'liqlik:** EP-SD-138, EP-CRM-048, VR-CRM-I21
- **action:** APPROVE
- **⤳ Ta'sir:** Ombor (chiqim), Logistika (Eltib berish), SD
- **Xoch-havolalar:** `[Module-13] Item 96` · `EXTRACTION QISM C §13 #46` · `VR-CRM-I21`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-047 · Yetkazilgandan keyin mijoz kartasini yangilash (v2 Q17)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yetkazish tasdig'i → karta "yetkazildi" + keyingi buyurtma eslatmasi (proaktiv). Oltin-ip yetkazish bosqichi; EP-SD-138 + EP-CRM-026 follow-up bilan bir; takroriy sotuvga turtki.
- **Manba:** kitob ГП топшириш + master reja oltin-ip + v2-A
- **Dalil (kod):** `customer-360.builder.ts:101-109` — `orders.recentOrders[].deliveryDate` va `status` real buyurtma qatorlaridan to'ladi.
- **Nima yetishmaydi:** "yetkazilganda keyingi follow-up rejalashtiruvchi" avtomatik trigger CRM kodida topilmadi.
- **Bog'liqlik:** EP-CRM-026, EP-CRM-077, EP-SD-138, VR-CRM-I38
- **action:** EVENT
- **⤳ Ta'sir:** Logistika, SD (takroriy sotuv), Bildirishnoma
- **Xoch-havolalar:** `[Module-13] Item 97` · `EXTRACTION QISM C §13 #47` · `VR-CRM-I38`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-048 · Haydovchi/transport mijoz kartasida (v2 Q18)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — yetkazish tarixida transport/haydovchi saqlanadi. Kitob blankada haydovchi yoziladi; EP-SD-138 haydovchi+mashina qayd; ba'zi yirik mijoz muayyan transport biladi (EP-CRM-085 ombor-kirish bilan bog'liq).
- **Manba:** kitob ГП топшириш (haydovchi) + EP-SD-138 + v2-A
- **Dalil (kod):** `grep "haydovchi|driver_id|transport_history"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** CRM 360 ko'rinishidan Logistika haydovchi/transport-biriktirish yozuvlariga buyurtma-kesimli read-join.
- **⚠️ ZIDDIYAT:** `decisions/13-crm.md` "EP-CRM-085 ombor-kirish bilan bog'liq" deydi, ammo ombor-kirish talablari = **EP-CRM-082**; EP-CRM-085 = operator/usta tarixi. Hujjatda raqam adashgan.
- **Bog'liqlik:** Logistika moduli (haydovchi yozuvlari — tekshirilmagan), EP-CRM-046, EP-CRM-082
- **action:** CREATE
- **⤳ Ta'sir:** Logistika (Eltib berish bo'limi)
- **Xoch-havolalar:** `[Module-13] Item 98` · `EXTRACTION QISM C §13 #48`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-049 · "Razmer planda va aslida" farqi kartada (v2 Q19)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — bitimda "kelishilgan o'lcham" qulflanadi; ishlab chiqarish farq qilsa flaglanadi + mijoz tasdig'i so'raladi. Kitob qisqartirish jadval "Razmer планда / aslida" real ustun; nizoda dalil.
- **Manba:** kitob qisqartirish jadval (plan↔fakt o'lcham) + v2-A
- **Dalil (kod):** `grep "size_lock|razmer_plan|o.lcham.*qulf|dimension_lock"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** reja↔fakt o'lcham juftligi (jadval/ustunlar) + nomuvofiqlikda qulf-bayrog'i, Dizayn/PP gate'iga bog'langan.
- **Bog'liqlik:** EP-CRM-052 (gate shu ma'lumotni tekshiradi), EP-CRM-050, EP-CRM-072, VR-CRM-I20
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish, Sifat (QC)
- **Xoch-havolalar:** `[Module-13] Item 99` · `EXTRACTION QISM C §13 #49` · `VR-CRM-I20`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-050 · Format kichraytirish (qisqartirish) menejer roziligi (v2 Q20)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — format o'zgarishi → mijoz + menejer elektron roziligi (kim/qachon) saqlanadi. Kitob qisqartirish jadval "Менежер фикри / Менежер хохиши / маслаҳат" real ustunlar; "men rozi emasdim" nizosi tugaydi.
- **Manba:** kitob qisqartirish jadval (menejer roziligi ustunlari) + v2-A
- **Dalil (kod):** `grep "format_change_consent|rozilik|electronic_consent|consent_signature"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** rozilik-qayd maydoni/jadvali (menejer yozgan elektron rozilik) bitimdagi format-o'zgarish eventiga bog'langan holda.
- **Bog'liqlik:** EP-CRM-049, EP-CRM-056, VR-CRM-I19/I42
- **action:** APPROVE
- **⤳ Ta'sir:** Dizayn, Ishlab chiqarish (chiqim/chiqimsiz)
- **Xoch-havolalar:** `[Module-13] Item 100` · `EXTRACTION QISM C §13 #50` · `VR-CRM-I19`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-051 · Dizayner bilan kelishuv bosqichi voronkada (v2 Q21)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "Dizayn/o'lcham kelishuvi" alohida voronka bosqichi + dizayner mas'ul + kun limiti. Kitob jadval "Дизайн қилиш / Дизайнер билан маслаҳат / Аниқ ўлчов" real bosqichlar; ko'p buyurtma shu yerda osiladi (EP-CRM-002 bosqich ro'yxati bilan).
- **Manba:** kitob qisqartirish jadval (dizayn bosqichlari) + v2-A
- **Dalil (kod):** `SELECT count(*) FROM crm_lead_stages` → **6** (generic); to'plamda dizayn/o'lcham-tasdiq bosqichi yo'q.
- **Nima yetishmaydi:** yangi `crm_lead_stages` qatori (mas'ul + kun-limiti maydoni bilan). **Bloklovchi:** EP-CRM-002 (`crm_stages` = 0, egasi bosqich taksonomiyasini bermagan). Kun-limiti oshganda eskalatsiya ham yo'q (VR-CRM-I26/I49).
- **Bog'liqlik:** EP-CRM-002 (bloklovchi), EP-CRM-009, VR-CRM-I26/I49
- **action:** CREATE
- **⤳ Ta'sir:** Dizayn bo'limi, Voronka (SD)
- **Xoch-havolalar:** `[Module-13] Item 101` · `EXTRACTION QISM C §13 #51` · `VR-CRM-I26`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-052 · "Shoshilmaslik" — o'lchov tasdig'isiz ishga tushmaslik (v2 Q22)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "o'lcham tasdiqlandi" majburiy bayroq; usiz ishlab chiqarishga o'tmaydi. Kitob "Аниқ ўлчовларни олиш + Шошилмаслик" real tamoyil; aniq o'lchovsiz=brak=zarar (zavod bu xatoni ko'rgan).
- **Manba:** kitob qisqartirish jadval ("Шошилмаслик") + v2-A
- **Dalil (kod):** o'lcham-tasdiq gate'i `apps/api/src/modules/crm` ostida topilmadi (EP-CRM-049 bilan bir salbiy sweep).
- **Nima yetishmaydi:** bitimda boolean gate-bayrog'i, PP-topshirish eventini o'lcham tasdiqlanmaguncha bloklaydi. EP-CRM-049 ma'lumoti old shart.
- **Bog'liqlik:** EP-CRM-049 (old shart), EP-CRM-069 (bir gate-oilasi), VR-CRM-I20
- **action:** APPROVE
- **⤳ Ta'sir:** Ishlab chiqarish (gate), Sifat (QC)
- **Xoch-havolalar:** `[Module-13] Item 102` · `EXTRACTION QISM C §13 #52` · `VR-CRM-I20`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-053 · Mijoz = ishlab chiqaruvchi korxona (oxirgi mahsulot) (v2 Q23)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — mijozning mahsuloti/biznesi profili saqlanadi (nima qadoqlaydi). Kitob mijozlar=qadoqlovchi korxonalar (Indorama=yarn/cotton, Compact cotton); aniq taklif + kross-sotuv.
- **Manba:** kitob (Indorama/Compact cotton biznesi) + v2-A
- **Dalil (kod):** `SELECT count(*) FROM crm_companies` → **4** — korxona entiti jadvali real va qatorli.
- **Nima yetishmaydi:** "nima qadoqlaydi" strukturali biznes-profil maydoni umumiy korxona atributlaridan ajratilgan holda topilmadi.
- **Bog'liqlik:** EP-CRM-018, EP-CRM-078, EP-CRM-081
- **action:** CREATE
- **⤳ Ta'sir:** SD (taklif), Marketing
- **Xoch-havolalar:** `[Module-13] Item 103` · `EXTRACTION QISM C §13 #53`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-054 · Mavsumiy/hajmli mijoz (Indorama tipidagi) (v2 Q24)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — "asosiy mijoz" bayrog'i + ustuvor ishlab chiqarish + material zaxirasi ogohlantirishi. Kitob 1-2 yirik mijoz katta hajm beradi (Indorama); ular kechiksa katta zarar (EP-CRM-018 segment bilan).
- **Manba:** kitob (Indorama asosiy hajm) + v2-A
- **Dalil (kod):** `sd_customers.segment` ustuni real, `'vip'` qiymati ishlatiladi (`rfm_clusters_segment_label_not_null` / `ai_finance_insights_segment_not_null` cheklovlarida ko'rinadi). `grep "priority.*vip|vip.*reserve|WMS.*reserve.*vip"` butun `apps/api/src` bo'ylab → **0**.
- **Nima yetishmaydi:** VIP bayrog'idan PP ustuvorligi va WMS material-bronlash zanjiri yo'q — bayroq hech narsani harakatga keltirmaydi.
- **Bog'liqlik:** EP-CRM-018, EP-CRM-059, VR-CRM-I47
- **action:** CREATE
- **⤳ Ta'sir:** Ta'minot (zaxira), Ishlab chiqarish (ustuvorlik)
- **Xoch-havolalar:** `[Module-13] Item 104` · `EXTRACTION QISM C §13 #54` · `VR-CRM-I47`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-055 · Mijoz odatiy buyurtma hajmi (kg) (v2 Q25)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz oylik kg-trendi + pasayishda signal. Kitob zavod hammasini kg da o'lchaydi (Oylik diог "Olingan/Tayyor kg"); 5t→1t pasayish=raqobatchiga ketdi signali (EP-CRM-014 churn + EP-CRM-080 oylik diog bilan).
- **Manba:** kitob Oylik diog (kg) + ShVB churn + v2-A
- **Dalil (kod):** `customer-360.builder.ts:144-149` — `growth` bloki (`lastYearTotal`, `thisYearTotal`, `growthRate`, `riskSignals`) butunlay `totalAmount`/daromad raqamlaridan quriladi, **kg/og'irlikdan emas**.
- **Nima yetishmaydi:** buyurtma-qatori og'irligi (kg) agregatsiyasi `growth` blokiga qo'shilishi kerak. Manba-ma'lumot PP/MES tomonda bor — bu builder-qatlami bo'shlig'i.
- **⚠️ ZIDDIYAT:** `decisions/13-crm.md` "EP-CRM-080 oylik diog bilan" deydi, ammo oylik diog = **EP-CRM-075**; EP-CRM-080 = "yaqin qarindosh aloqasi". Hujjatda raqam adashgan.
- **Bog'liqlik:** EP-CRM-014, EP-CRM-064, EP-CRM-075, EP-CRM-076
- **action:** AI
- **⤳ Ta'sir:** Hisobot (kg-trend), AI churn
- **Xoch-havolalar:** `[Module-13] Item 105` · `EXTRACTION QISM C §13 #55`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-056 · "Chiqimli / Chiqimsiz" narx mantiqi (v2 Q26)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — narx taklifida чиқимли/чиқимсиз variant + tejamkor taklif ko'rsatiladi. Kitob qisqartirish jadval "Чиқимли / Чиқимсиз" real ustun; chiqimsiz format=arzonroq=savdo dalili.
- **Manba:** kitob qisqartirish jadval (чиқимли/чиқимсиз) + v2-A
- **Dalil (kod):** `grep "chiqim.?siz|chiqim.?li|waste.?based.?price|scrapBasedPrice"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** chiqim-hisobli/chiqimsiz narx pereklyuchateli, IChM (norma) ma'lumotiga ulangan holda; norma yo'q bo'lsa "chiqim normasiz" ogohlantirishi (VR-CRM-I34).
- **Bog'liqlik:** EP-CRM-050, EP-CRM-058, VR-CRM-I34
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (format optimizatsiya), Finance (narx)
- **Xoch-havolalar:** `[Module-13] Item 106` · `EXTRACTION QISM C §13 #56` · `VR-CRM-I34`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-057 · Qog'oz narxi o'zgarishida mijoz narxini qayta hisoblash (v2 Q27)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — qog'oz narxi o'zgarsa → ta'sirlangan mijozlar ro'yxati + narxni qayta ko'rish vazifasi. Kitob "Қоғоз нархи / Умумий қоғоз сўммаси" real ustunlar; tamoyil tasdiq, lekin avto-qayta-hisob TRIGGER % chegarasi (qancha oshganda) egasidan + Ta'minot narx-feed bog'lanishi.
- **Manba:** kitob qisqartirish jadval (Қоғоз нархи) + v2-A (trigger % egasidan)
- **Dalil (kod):** `grep "paper.?price|qog.oz.?narx|priceChangeTask|price_alert"` `apps/api/src` bo'ylab → **0**; `grep "repriceTask|price.?recalc|qayta.?narx"` CRM ichida → **0**. VISION-3340 SB0676 ("narx qayta-hisob MM↔CRM yo'q") tasdiqlanadi.
- **Nima yetishmaydi:** narx-feed deltalarini foiz-chegara bilan solishtiruvchi CRON/trigger + ta'sirlangan bitimlarda qayta-narxlash vazifasi. **Egasi-DATA:** trigger % (business_settings CRUD orqali) + Ta'minot narx-feed manbasi.
- **Bog'liqlik:** Ta'minot narx-feedi (mavjudligi tekshirilmagan), EP-CRM-058, EP-CRM-071, VR-CRM-I06/I13
- **action:** CRON
- **⤳ Ta'sir:** Ta'minot (qog'oz narxi), Finance
- **Xoch-havolalar:** `[Module-13] Item 107` · `EXTRACTION QISM C §13 #57` · `VR-CRM-I06/I13`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-058 · Bir mijozga ko'p formatli narx jadvali (v2 Q28)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz × mahsulot/format kesimida narx jadvali. Kitob bir mijoz turli format (133 format, 105 format); bitta "mijoz narxi" yetarli emas — har mahsulotga narx (EP-CRM-084 mahsulot liniyalari bilan).
- **Manba:** kitob (133/105 format) + v2-A
- **Dalil (kod):** `crm_products` = **2** qator, tekis katalog; mijoz×format narx matritsasi jadvali topilmadi.
- **Nima yetishmaydi:** `crm_customer_format_prices` uslubidagi matritsa jadval (mijoz × format → narx).
- **⚠️ ZIDDIYAT:** `decisions/13-crm.md` "EP-CRM-084 mahsulot liniyalari bilan" deydi, ammo mahsulot liniyalari = **EP-CRM-078**; EP-CRM-084 = "namuna/Академияга". Hujjatda raqam adashgan.
- **Bog'liqlik:** EP-CRM-078, EP-CRM-056, EP-CRM-057
- **action:** CREATE
- **⤳ Ta'sir:** Finance (narx), SD
- **Xoch-havolalar:** `[Module-13] Item 108` · `EXTRACTION QISM C §13 #58`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-059 · Bitim → ishlab chiqarish rejasiga tushishi (v2 Q29)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — yutilgan bitim → ishlab chiqarish reja navbatiga avtomatik (muddat bilan). Kitob "станокларни иш билан таъминлаш"; oltin-ip buyurtma→reja; stanok bo'sh qolmaydi.
- **Manba:** kitob ("станокларни иш билан таъминлаш") + master reja oltin-ip + v2-A
- **Dalil (kod):** `sd/infrastructure/event-handlers/deal-won.listener.ts` real (DealWon→`sales_order` yaratish). **Δ ⭐ `bbb46b63`:** shu listener 2026-08-07 gacha **hech qachon ishga tushmagan** — Kanban stage-move eventni chiqarmasdi. Endi chiqaradi.
- **Nima yetishmaydi:** buyurtma yaratishdan tashqari CRM-darajasidagi PP reja-navbatiga ustuvorlik bilan tushirish tasdiqlanmadi; muddat stanok yukidan hisoblanmaydi (EP-CRM-060).
- **Bog'liqlik:** EP-CRM-016, EP-CRM-054, EP-CRM-060
- **action:** EVENT
- **⤳ Ta'sir:** Ishlab chiqarish (PP rejalashtirish), MES
- **Xoch-havolalar:** `[Module-13] Item 109` · `EXTRACTION QISM C §13 #59` · `VR-CRM-I47`
- **Δ 2026-07-11→08-07:** ⭐ `bbb46b63` (2026-08-07) — DealWonEvent real oqimda chiqarila boshladi; bitim→SD→PP zanjirining birinchi bo'g'ini jonlandi.

### EP-CRM-060 · Mijozga real muddat (stanok yukiga qarab) (v2 Q30)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — muddat taklifi stanok yukidan avtomatik hisoblanadi (real va'da). Vizyon CRP/quvvat (mavjud pp crp); "ertaga tayyor" og'zaki va'da aldovini tugatadi.
- **Manba:** mavjud PP/CRP (work_centers yuk) + master reja oltin-ip + v2-A
- **Dalil (kod):** `grep "work_centers|routing.*crm|crm.*routing"` `apps/api/src/modules/crm` ichida → **0** — `work_centers` faqat PP/MES tomonda, CRM'dan havola yo'q.
- **Nima yetishmaydi:** bitim yaratishda PP `work_centers` yuk/navbat ma'lumotini o'qib va'da-sanasini hisoblaydigan CRM-tomon chaqiruv.
- **Bog'liqlik:** PP `work_centers` (mavjud, ulanmagan), EP-CRM-061, EP-CRM-059
- **action:** READ
- **⤳ Ta'sir:** Ishlab chiqarish (CRP/quvvat), MES
- **Xoch-havolalar:** `[Module-13] Item 110` · `EXTRACTION QISM C §13 #60`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-061 · Stanok turlari bo'yicha mahsulot mosligi (v2 Q31)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — mahsulot → stanok marshrutiga bog'lanadi; muddat shu stanok navbatidan. Kitob aniq stanoklar (Flexo tigel/gofra/печать, SM 72, SM 52, Laminatsiya, Kashirovka) real; mahsulot-stanok mosligi=aniq muddat/narx.
- **Manba:** kitob (stanoklar ro'yxati) + mavjud PP routing + v2-A
- **Dalil (kod):** EP-CRM-060 bilan bir sweep — CRM tomonda routing/`work_centers` ga havola **0**. **Δ:** `1909ba47` — `crm_leads.product_type` ustuni + CHECK cheklovi (`ofset/gofra/etiketka/flekso/blanka`) qo'shildi → mahsulot-turi taksonomiyasi birinchi marta sxemada paydo bo'ldi.
- **Nima yetishmaydi:** `product_type` faqat **lid** darajasida va nullable (mavjud insert-yo'llari uni bermaydi: `website-lead.repository.ts` raw SQL va `QuickCreateModalTypes.ts` FE formasida maydon yo'q). Mahsulot→stanok marshrut jadvaliga bog'lanish yo'q.
- **Bog'liqlik:** EP-CRM-060 (bir old shart), EP-CRM-044, EP-CRM-078
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (marshrut), MES
- **Xoch-havolalar:** `[Module-13] Item 111` · `EXTRACTION QISM C §13 #61`
- **Δ 2026-07-11→08-07:** `1909ba47` (2026-07-11) — `crm_leads.product_type` (5 toifa CHECK) qo'shildi; EP-MKT-089 doirasida, marshrut-bog'lanishisiz.

### EP-CRM-062 · Savdo bo'limi rahbari vs menejer ko'rinishi (v2 Q32)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — Савдо рахбари=hamma; менежер=o'ziniki; karta-modelga bog'liq. Kitob "Савдо бўлими рахбари / Савдо бўлими менежерлари" alohida lavozim; EP-CRM-022/030 RBAC bilan bir ierarxiya.
- **Manba:** kitob (savdo rahbari/menejerlari) + master reja karta-RBAC + v2-A
- **Dalil (kod):** `crm-row-scope.ts:23` — `CRM_SEES_ALL_ROLES = ['super_admin','admin','director']`; qolgan hamma `crmOwnerScope()` bilan o'z qatorlariga skoplanadi. Ya'ni row-skoping **real**. **Δ:** `2db4f06b` (kanonik ustun tuzatildi) + `9fabdacb` (`manager` roli guardlarga qo'shildi).
- **Nima yetishmaydi:** ⭐ **"Савдо рахбари=hamma" bajarilmaydi** — `sales_manager`/`manager` (savdo rahbari) `CRM_SEES_ALL_ROLES` ro'yxatida **yo'q**, demak u ham faqat o'z qatorlarini ko'radi. Vizyon esa rahbar hammani ko'rishini talab qiladi. Bu jonli kodda aniqlangan yangi bo'shliq.
- **⚠️ ZIDDIYAT:** `[Module-13] Item 112` "row-scope filtr yo'q" deydi — **eskirgan** (EP-CRM-022 dagi izohga qarang: `259b5c56`, 2026-07-09).
- **Bog'liqlik:** EP-CRM-022, EP-CRM-030, EP-CRM-067
- **action:** CREATE
- **⤳ Ta'sir:** Org-struktura, Xavfsizlik (RBAC)
- **Xoch-havolalar:** `[Module-13] Item 112` · `EXTRACTION QISM C §13 #62`
- **Δ 2026-07-11→08-07:** `2db4f06b` (2026-07-13) egalik-ustuni `COALESCE(assigned_by_id, manager_id)` ga tuzatildi · `9fabdacb` (2026-08-06) `manager` roli 403 dan chiqarildi.

### EP-CRM-063 · Menejer mijozni "egasizlantirmaslik" qoidasi (v2 Q33)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Talab:** A — N kun faolliksiz mijoz boshliq paneliga "qayta taqsimlash" uchun chiqadi. Tamoyil tasdiq (adolat + EP-CRM-026 follow-up bilan bir); aniq N (30/60 kun) egasidan.
- **Manba:** master reja (adolatli taqsimot) + EP-CRM-026 + v2-A (N egasidan)
- **Dalil (kod):** `crm/cron/lead-aging-reassign.cron.ts` — real `@Cron('0 7 * * *', {timeZone:'Asia/Tashkent'})`, `@description VISION-3340 #33`; `findColdLeadsForReassignment` → `pickNextSalesManager` → `assignManagerIfMissing(...,true)` → `logLeadReassignmentNote`; `crm.module.ts:48,231` da provider sifatida ro'yxatga olingan. Chegara **konstanta**: `business.constants.ts:520,529` — `CRM_LEAD_AGING_REASSIGN_DAYS = 60`, `CRM_LEAD_TERMINAL_STATUSES = ['won','lost','converted']`.
- **Nima yetishmaydi:** N qiymati kodda konstanta — **business_settings CRUD orqali sozlanmaydi** (egasi-qiymat sifatida qolgan); Finance/QC da'vo-tekshiruvi yo'q (VR-CRM-I03/I08).
- **⚠️ ZIDDIYAT:** QISM C #63 "egasi-data — kod tasdiqlanmadi" deydi va QISM A #3 "Yo'q — SB0668 STILL-OPEN (impl yo'q)" deydi — **ikkalasi ham eskirgan**: cron to'liq qurilgan, audit-log bilan.
- **Bog'liqlik:** EP-CRM-026, VR-CRM-I03/I08/I32/I33
- **action:** CRON
- **⤳ Ta'sir:** Org-struktura, HR
- **Xoch-havolalar:** `[Module-13] Item 113` · `EXTRACTION QISM C §13 #63` · `VR-CRM-I03/I08`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-064 · Menejer kunlik hisoboti (necha kg sotdi) (v2 Q34)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — menejer kunlik kg + summa hisoboti avtomatik boshliqqa. Kitob zavod kunlik "Olingan buyurtma kg" (Oylik diог); egasi avto kunlik hisobot (mashina→PDF, Q116/Q119) ruhini tasdiqlagan; ShVB `weeklySalesVolume`.
- **Manba:** kitob Oylik diog (kg) + BARCHA_JAVOBLAR Q116/Q119 (avto hisobot) + ShVB YO'NALISH 26 + v2-A
- **Dalil (kod):** `crm-auto-lead.repository.ts:37-51` `getSupervisorDashboard` — `pipeline_value` = `SUM(crmDeals.expected_amount)`, ya'ni **faqat pul**; so'rovda kg/og'irlik ustuni yo'q.
- **Nima yetishmaydi:** kg o'lchovi yo'q; kunlik avto-yuborish (PDF/Telegram) yo'q — faqat panelda ko'riladi.
- **Bog'liqlik:** EP-CRM-055, EP-CRM-075, EP-CRM-027
- **action:** CRON
- **⤳ Ta'sir:** HR (KPI), Hisobot, Director dashboard
- **Xoch-havolalar:** `[Module-13] Item 114` · `EXTRACTION QISM C §13 #64` · `VR-CRM-I45`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-065 · Yangi menejer mentor davri (RD-4 tizimi) (v2 Q35)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "sinov davri" bayrog'i + bitim mentor tasdig'idan o'tadi (2 oy). Kitob RD-4 mentor+sinov; egasi sinov muddati kuzatuvi (Q91) + 2 mentor (Q145) modelini tasdiqlagan; yangi menejer xato narx/va'da xavfi.
- **Manba:** kitob RD-4 (mentor/sinov) + BARCHA_JAVOBLAR Q91/Q145 + v2-A
- **Dalil (kod):** `grep "probation|sinov.*mentor|mentor.*gate|RD-4"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** HR sinov-holati bayrog'ini o'qib mentor davrida bitim amallarini gate qiladigan CRM tomon. HR tomonda sinov-holati event/maydon sifatida ochilganmi — tekshirilmagan.
- **Bog'liqlik:** HR moduli (sinov/mentor holati — tekshirilmagan), VR-CRM-I10/I33
- **action:** APPROVE
- **⤳ Ta'sir:** HR (adaptatsiya), LMS
- **Xoch-havolalar:** `[Module-13] Item 115` · `EXTRACTION QISM C §13 #65` · `VR-CRM-I10`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-066 · "Xizmat ma'lumoti tashqariga chiqishi" oldini olish (v2 Q36)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — ommaviy eksport bloklangan; faqat boshliq ruxsati bilan; har eksport loglanadi. НО-2 asosiy maqsadi "хизмат маълумотларининг ташқарига чиқиш хавфи"; menejer butun bazani (24000 mijoz) Excelga olib ketmasin.
- **Manba:** НО-2 (ma'lumot himoyasi) + v2-A
- **Dalil (kod):** `crm-deals.controller.ts:113 @Get('export')` `@Roles(SALES_MANAGER, MANAGER, DIRECTOR, SUPER_ADMIN)` → `deals.service.ts:47 exportDeals(user)`: row-skoplangan eksport + `recordExportAudit(...)` — `drizzle-crm-deals.repo.ts:62-78` real `INSERT INTO audit_logs (table_name,record_id,action,user_id,user_role,new_values) VALUES ('crm_deals','*','export',...)`. **Audit yozuvi best-effort emas** — yozilmasa butun eksport fail bo'ladi. **Δ:** `2db4f06b` skoping ustunini tuzatdi.
- **Nima yetishmaydi:** "boshliq ruxsati" tasdiq-oqimi **yo'q** (skoplangan menejer o'z qatorlarini ruxsatsiz eksport qiladi); qator-soni chegarasi/bulk-gate yo'q; faqat `crm_deals` qamrab olingan (lidlar/kontaktlar eksport-gate'siz).
- **⚠️ ZIDDIYAT:** `[Module-13] Item 116` "Yo'q — export controller yo'q" va QISM C #66 "export-controller yo'q" — **ikkalasi ham eskirgan**: eksport `3cab5de7` (2026-07-10) bilan, ya'ni audit sanasidan **1 kun oldin** qurilgan.
- **Bog'liqlik:** EP-CRM-030, EP-CRM-067, EP-CRM-068
- **action:** EXPORT
- **⤳ Ta'sir:** Xavfsizlik (eksport blok + log)
- **Xoch-havolalar:** `[Module-13] Item 116` · `EXTRACTION QISM C §13 #66` · `VR-CRM-I14`
- **Δ 2026-07-11→08-07:** `2db4f06b` (2026-07-13) — eksport row-skopingi kanonik egalik ustuniga o'tkazildi.

### EP-CRM-067 · Mijoz kontaktini ko'rish chegarasi (v2 Q37)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — o'z mijozi=to'liq; o'zganiki=faqat nomi (kontakt yashirin). Vizyon karta-RBAC (maydon darajasi); НО-2 maxfiylik (EP-CRM-030/032 davomi); ichki "o'g'irlik" oldini olish.
- **Manba:** master reja karta-RBAC (maydon darajasi) + НО-2 + v2-A
- **Dalil (kod):** `grep "maskContact|hideContact|field-level|fieldLevel"` `apps/api/src/modules/crm` ichida → **0**. Row-skoping bor (EP-CRM-022), maydon-skoping **yo'q**.
- **Nima yetishmaydi:** DTO-serializatsiya bosqichida maydon-niqoblash qatlami (egasi bo'lmagan rolga telefon/email/narx/qarzni yashirish); "ko'rishga urinish" audit yozuvi (VR-CRM-I24).
- **Bog'liqlik:** EP-CRM-022, EP-CRM-030, EP-CRM-062, VR-CRM-I24
- **action:** READ
- **⤳ Ta'sir:** Xavfsizlik (field-level RBAC)
- **Xoch-havolalar:** `[Module-13] Item 117` · `EXTRACTION QISM C §13 #67` · `VR-CRM-I24`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-068 · CRM harakatlari audit jurnali (v2 Q38)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** A — to'liq audit jurnali (ko'rish/o'zgartirish/eksport) + Инспекция бўлими ko'radi. Egasi to'liq audit-log (Q144 super-admin/direktor) + НО-2 nazorat ruhi; har EP-kod loglanadi (LOYIHA-BITGAN B.4).
- **Manba:** BARCHA_JAVOBLAR Q144 (audit) + НО-2 + LOYIHA-BITGAN (EP-kod log) + v2-A
- **Dalil (kod):** `crm-extras-comments.repository.ts:14,70-85` — jonli `crm_history` jadvaliga real Drizzle so'rov (`entity_type, entity_id, action, changes, actor_id, created_at` + `employees` join). Bundan tashqari `drizzle-crm-deals.repo.ts:62-78` tizim-keng `audit_logs` ga `action='export'` yozadi.
- **Nima yetishmaydi:** "ko'rish" (read) harakatlari loglanmaydi — faqat o'zgartirish + eksport; `WHERE module='CRM'` bo'yicha Инспекция-panel filtri yo'q.
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM D #48` "grep `audit_log` crm → 0 fayl; CRM entitilar audit_log'ga yozmaydi" deydi — **eskirgan/noto'g'ri**: `3cab5de7` (2026-07-10) dan beri eksport `audit_logs` ga yozadi.
- **Bog'liqlik:** EP-CRM-006, EP-CRM-033, EP-CRM-066
- **action:** READ
- **⤳ Ta'sir:** Xavfsizlik, Инспекция бўлими
- **Xoch-havolalar:** `[Module-13] Item 118` · `EXTRACTION QISM C §13 #68` · `EXTRACTION QISM D #48` · `VR-CRM-I48`
- **Δ 2026-07-11→08-07:** `2db4f06b` (2026-07-13) — audit yozuvidagi `row_scoped` bayrog'i kanonik egalik ustuniga moslashtirildi.

### EP-CRM-069 · Oldindan to'lov (avans) holati kartada (v2 Q39)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — avans bayrog'i + foizi; belgilangan avanssiz ishlab chiqarishga o'tmaydi. Kitob "50% avans + 5 kun postoplata / 100% avans → 5% chegirma" (EP-SD); avanssiz=material zarari.
- **Manba:** kitob (avans siyosati) + EP-SD (50%/100% avans) + v2-A
- **Dalil (kod):** `grep "advance.*flag|avans.*bayroq|advancePercent.*gate|avans.*gate"` `apps/api/src/modules/crm` ichida → **0**. 360 ko'rinishida to'lov ma'lumoti bor, lekin avans foiziga bog'langan PP-topshirish gate'i yo'q.
- **Nima yetishmaydi:** bitimda avans-foiz bayrog'i + u qo'yilmaguncha PP-yaratish eventini bloklaydigan gate. **Egasi-DATA:** minimal avans foizi (business_settings CRUD).
- **Bog'liqlik:** EP-CRM-024, EP-CRM-052 (bir gate-oilasi), EP-CRM-070
- **action:** APPROVE
- **⤳ Ta'sir:** Finance, Ishlab chiqarish (gate)
- **Xoch-havolalar:** `[Module-13] Item 119` · `EXTRACTION QISM C §13 #69` · `VR-CRM-I23`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-070 · Naqd / o'tkazma to'lov turi mijozda (v2 Q40)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijozning odatiy to'lov turi saqlanadi (naqd/o'tkazma/bartar). Kitob "Цена без НДС / o'tkazma QQS"; to'lov turi narx+hujjatga ta'sir (naqd chegirma vs o'tkazma hisob-faktura).
- **Manba:** kitob (Цена без НДС, to'lov turlari) + v2-A
- **Dalil (kod):** `SELECT column_name FROM information_schema.columns WHERE table_name='sd_customers' AND column_name IN ('payment_type','default_payment_method')` → **0 qator**.
- **Nima yetishmaydi:** trivial — `sd_customers` ga `default_payment_type` enum ustuni + forma maydoni.
- **Bog'liqlik:** EP-CRM-069, EP-CRM-071
- **action:** CREATE
- **⤳ Ta'sir:** Finance (hisob-faktura)
- **Xoch-havolalar:** `[Module-13] Item 120` · `EXTRACTION QISM C §13 #70`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-071 · Valyuta (USD bog'liq narx) (v2 Q41)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — narx USD-bog'liq saqlanadi + kurs o'zgarsa qayta ko'rish signali. Egasi "har qanday valyuta — qaysi valyutada xarajat bo'lsa" (POS Q36); qog'oz importga bog'liq (EP-CRM-085 import-toifa bilan); so'm tushsa zarar.
- **Manba:** BARCHA_JAVOBLAR POS Q36 (valyuta) + kitob (import qog'oz) + v2-A
- **Dalil (kod):** `grep "exchange_rate|currency.*alert|USD.*kurs|multi.?currency"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** valyutaga bog'langan narx maydoni + joriy kursni kotirovka-vaqtidagi kurs bilan solishtirib "qayta hisob kerak" holatiga o'tkazuvchi CRON (VR-CRM-I39).
- **⚠️ ZIDDIYAT:** `decisions/13-crm.md` "EP-CRM-085 import-toifa bilan" deydi, ammo import-bog'liqlik toifasi = **EP-CRM-081**; EP-CRM-085 = operator/usta tarixi. Hujjatda raqam adashgan.
- **Bog'liqlik:** EP-CRM-057, EP-CRM-081, VR-CRM-I39
- **action:** CRON
- **⤳ Ta'sir:** Finance, Ta'minot
- **Xoch-havolalar:** `[Module-13] Item 121` · `EXTRACTION QISM C §13 #71` · `VR-CRM-I39`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-072 · Brak/qaytarish mijoz kartasida (v2 Q42)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — brak/qaytarish kartada + sabab kodi (o'lcham/bosma/material). Vizyon 360°; takror brak=tizimli muammo (EP-CRM-049 o'lcham nizosi bilan bog'lanadi); QC moduli.
- **Manba:** master reja 360° + EP-CRM-049/050 + v2-A
- **Dalil (kod):** `customer-360.builder.ts:126-128` — umumiy `interactions` dan `type==='complaint'` filtri; strukturali `defect_reason_code` maydoni yo'q.
- **Nima yetishmaydi:** sabab-kod taksonomiyasi (o'lcham/bosma/material) + QC-event bog'lanishi (EP-CRM-025 bilan bir ildiz).
- **Bog'liqlik:** EP-CRM-025, EP-CRM-049, EP-CRM-073, VR-CRM-I35
- **action:** CREATE
- **⤳ Ta'sir:** Sifat nazorati (QC)
- **Xoch-havolalar:** `[Module-13] Item 122` · `EXTRACTION QISM C §13 #72` · `VR-CRM-I35`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-073 · Reklamatsiya hal bo'lmaguncha yangi yuk (v2 Q43)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — ochiq reklamatsiya bayrog'i + yangi bitimda boshliq ogohlantirishi. Vizyon 360° + sifat-bog'lanish; EP-CRM-025 qizil belgi bilan bir; avval eski masala yopilsin.
- **Manba:** master reja 360° + EP-CRM-025 + v2-A
- **Dalil (kod):** `grep "QcReclamationOpenedEvent|ReclamationOpenedEvent"` butun `apps/api/src` bo'ylab → **0** (EP-CRM-025 bilan bir tekshiruv).
- **Nima yetishmaydi:** QC chiqaradigan event + CRM tomonda listener, ochiq reklamatsiya vaqtida yangi yuk yaratishni bayroqlaydi/bloklaydi. Sof cross-modul simlash bo'shlig'i.
- **Bog'liqlik:** EP-CRM-025 (bir ildiz), EP-CRM-072, VR-CRM-I15
- **action:** APPROVE
- **⤳ Ta'sir:** Sifat nazorati (QC), SD
- **Xoch-havolalar:** `[Module-13] Item 123` · `EXTRACTION QISM C §13 #73` · `VR-CRM-I15`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-074 · Kompensatsiya/chegirma tarixi (v2 Q44)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — kompensatsiya/chegirma tarixi + jami summa kartada (suiiste'mol ko'rinadi). Vizyon 360° + audit ruhi; ba'zi mijoz har gal "brak" deb chegirma so'raydi.
- **Manba:** master reja 360° + v2-A
- **Dalil (kod):** `grep "discount.*abuse|suiiste.mol|discountHistory"` `apps/api/src/modules/crm` ichida → **0**; `business.constants.ts` da CRM chegirma-suiiste'mol mezoni yo'q (`director` HITL `DISCOUNT_OVERRIDE` alohida narsa).
- **Nima yetishmaydi:** chegirma-tarixi jadvali + chegara-asosli suiiste'mol bayrog'i (VR-CRM-I29 mezonlari: 90 kun ichida 3+ marta yoki o'rtacha buyurtmaning 10%+).
- **Bog'liqlik:** EP-CRM-072, VR-CRM-I29
- **action:** CREATE
- **⤳ Ta'sir:** Finance (chegirma), Sifat
- **Xoch-havolalar:** `[Module-13] Item 124` · `EXTRACTION QISM C §13 #74` · `VR-CRM-I29`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-075 · "Oylik diog" mijoz kesimida (v2 Q45)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — oylik kg mijoz kesimida + o'tgan oyga nisbatan o'zgarish. Kitob "Oylik diог" real jadval (Olingan/Tayyor/Chiqarilgan kg); mijoz kesimi=kim asosiy/pasaygan (EP-CRM-055/080 bilan).
- **Manba:** kitob Oylik diог (kg) + v2-A
- **Dalil (kod):** `crm/analytics/cohort.service.ts:1-44` — ikki xil retention-matritsa ("count" va "revenue"), ikkalasi ham pul/mijoz-soni asosida; modulda kg/og'irlik o'lchovi yo'q.
- **Nima yetishmaydi:** mavjud cohort-servis strukturasidan foydalanib uchinchi "jo'natilgan kg" matritsasi.
- **Bog'liqlik:** EP-CRM-055, EP-CRM-064, EP-CRM-076
- **action:** READ
- **⤳ Ta'sir:** Hisobot, Director dashboard
- **Xoch-havolalar:** `[Module-13] Item 125` · `EXTRACTION QISM C §13 #75`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-076 · "Yil boshidan chiqarilgan mahsulot soni" mijozga taqsim (v2 Q46)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — yillik hajm mijozlar kesimida (top ro'yxat). Kitob "Йил бошидан бери чиқарилган маҳсулот сони 115000" real ko'rsatkich; top mijoz=strategik e'tibor (EP-CRM-019 RFM bilan).
- **Manba:** kitob ("115000 mahsulot") + v2-A
- **Dalil (kod):** `rfm.service.ts` + `clv.service.ts` daromadga asoslangan mijoz reytingini beradi (EP-CRM-019 da tasdiqlangan).
- **Nima yetishmaydi:** kg-hajmga asoslangan top-mijoz ro'yxati yo'q — faqat daromad kesimi.
- **Bog'liqlik:** EP-CRM-019, EP-CRM-055, EP-CRM-075
- **action:** READ
- **⤳ Ta'sir:** Hisobot (yillik top mijoz)
- **Xoch-havolalar:** `[Module-13] Item 126` · `EXTRACTION QISM C §13 #76`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-077 · Buyurtma↔tayyor↔chiqarilgan zanjiri mijozda (v2 Q47)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** A — buyurtma holati (olingan→tayyor→chiqarildi) real-vaqt kartada. Kitob 3 holat (Olingan/Tayyor bo'lgan/Ombordan chiqarilgan kg); EP-SD-100 status ro'yxati; mijoz "buyurtmam qayerda" → aniq javob.
- **Manba:** kitob (3 holat kg) + EP-SD-100 (statuslar) + master reja oltin-ip + v2-A
- **Dalil (kod):** `customer-360.builder.ts:101-109` — `orders.recentOrders[].status` va `deliveryDate` real buyurtma qatorlaridan.
- **Nima yetishmaydi:** aniq 3 holatli (olingan/tayyor/chiqarilgan) real-vaqt MES/Ombor→CRM event zanjiri umumiy `status` ustunidan ajratilgan holda tasdiqlanmadi; kg o'lchovi yo'q.
- **Bog'liqlik:** EP-CRM-015, EP-CRM-047, EP-SD-100
- **action:** READ
- **⤳ Ta'sir:** Ishlab chiqarish, Ombor (WMS), 360° karta
- **Xoch-havolalar:** `[Module-13] Item 127` · `EXTRACTION QISM C §13 #77`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-078 · Bir korxona — bir nechta brend/quti turi (v2 Q48)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — mijoz ostida alohida mahsulot liniyalari (har biriga narx/hajm/brak). Kitob Indorama bir nechta mahsulot (gofra list/konteyner/5-sloylik); aralash=qaysi foydali/muammoli ko'rinmaydi (EP-CRM-058 narx bilan).
- **Manba:** kitob (Indorama ko'p mahsulot) + v2-A
- **Dalil (kod):** `crm_products` = **2** qator, tekis umumiy katalog; mijoz-kesimli mahsulot-liniyasi strukturasi (narx/hajm/brak ichki maydonlari bilan) yo'q. **Δ:** `1909ba47` — `crm_leads.product_type` 5 toifali CHECK bilan qo'shildi.
- **Nima yetishmaydi:** `crm_customer_product_lines` jadvali (mijoz × mahsulot → narx/hajm/brak-darajasi). `product_type` faqat lid darajasida va nullable.
- **Bog'liqlik:** EP-CRM-043, EP-CRM-058, EP-CRM-061
- **action:** CREATE
- **⤳ Ta'sir:** SD (narx/hajm), Hisobot
- **Xoch-havolalar:** `[Module-13] Item 128` · `EXTRACTION QISM C §13 #78`
- **Δ 2026-07-11→08-07:** `1909ba47` (2026-07-11) — mahsulot-turi taksonomiyasi (ofset/gofra/etiketka/flekso/blanka) sxemaga kirdi; mijoz-kesimli liniya strukturasi hamon yo'q.

### EP-CRM-079 · Mijoz almashtirilgan o'lcham/STP tarixi (v2 Q49)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz mahsuloti uchun STP/format versiya tarixi. Kitob "Қолиб янги STP / Тигел қолиб" real qayd; tamoyil tasdiq, lekin VERSIYALASH modeli (har o'zgarishni saqlash chuqurligi, kim tasdiqlaydi) Dizayn/Ishlab chiqarish bilan birga aniqlanadi.
- **Manba:** kitob ("Қолиб янги STP") + EP-CRM-045 (versiya) + v2-A (model egasidan)
- **Dalil (kod):** `grep "STP.*version|stp_version|format_version|dizayn.*versiya"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** STP/format spetsifikatsiyalari uchun versiya-zanjiri jadvali (Dizayn moduli bilan umumiy). **Egasi/Dizayn-QAROR:** nima yangi versiya, nima reviziya hisoblanadi.
- **Bog'liqlik:** EP-CRM-045 (bir mavzu), Dizayn moduli
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish, Dizayn
- **Xoch-havolalar:** `[Module-13] Item 129` · `EXTRACTION QISM C §13 #79`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-080 · Mijoz "yaqin qarindosh" aloqasi (НО-2 nuance) (v2 Q50)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — aloqa "mijoz" yoki "shaxsiy" deb teglanadi; statistikaga faqat mijoz aloqasi kiradi. НО-2 abonentlar orasida "Яқин қариндошлар" bor; Инспекция nazorati (EP-CRM-033) shaxsiy/ish aralashmasligi kerak.
- **Manba:** НО-2 ("Яқин қариндошлар" abonent) + EP-CRM-033 + v2-A
- **Dalil (kod):** EP-CRM-031 bilan bir tekshiruv — korporativ-raqam kontseptsiyasi butun `apps/api/src` da yo'q, demak teglanadigan asos-entiti ham yo'q.
- **Nima yetishmaydi:** EP-CRM-031 modeli qurilgach trivial teg maydoni. Hozircha to'liq bloklangan.
- **Bog'liqlik:** EP-CRM-031 (old shart), EP-CRM-032, EP-CRM-033
- **action:** AI
- **⤳ Ta'sir:** Инспекция бўлими, Maxfiylik
- **Xoch-havolalar:** `[Module-13] Item 130` · `EXTRACTION QISM C §13 #80`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-081 · Mijoz toifasi: import-bog'liq vs mahalliy (v2 Q51)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-08-07 Δ)*
- **Talab:** A — mijoz import-bog'liqlik toifasi + import muammosida ta'sirlangan mijoz ro'yxati. Kitob Indorama=import paxta/yarn; qog'oz import (EP-CRM-071 USD bilan); tamoyil tasdiq, toifa MANBASI (Ta'minot import-feed bog'lanishi) egasidan.
- **Manba:** kitob (import xom-ashyo) + EP-CRM-071 + v2-A (toifa manbasi egasidan)
- **Dalil (kod):** `grep "SupplyImportIssueEvent"` butun `apps/api/src` bo'ylab → **0**. **Δ:** `3d500908` — `crm_leads.is_export` (BOOLEAN) qo'shildi.
- **Nima yetishmaydi:** `is_export` = **eksport/ichki mijoz** belgisi, vizyon so'ragan **import-bog'liqlik** toifasi emas — yaqin, lekin boshqa o'lchov. Ta'minot tomonida `SupplyImportIssueEvent` yo'q; CRM tomonda listener + ta'sirlangan-mijoz ro'yxati yo'q. **Egasi-DATA:** import-bog'liqlik toifasining manbasi.
- **Bog'liqlik:** Ta'minot moduli (`SupplyImportIssueEvent` — mavjud emas), EP-CRM-071, VR-CRM-I25
- **action:** CREATE
- **⤳ Ta'sir:** Ta'minot, Ishlab chiqarish
- **Xoch-havolalar:** `[Module-13] Item 131` · `EXTRACTION QISM C §13 #81` · `VR-CRM-I25`
- **Δ 2026-07-11→08-07:** `3d500908` (2026-07-11) — `crm_leads.region` + `is_export` (EP-MKT-102 doirasida); import-bog'liqlik toifasining o'zi hamon yo'q.

### EP-CRM-082 · Mijoz ombor kirish cheklovi (yetkazish nuance) (v2 Q52)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — yetkazish nuqtasiga kirish talablari (vaqt/hujjat/sanitariya) saqlanadi. Yirik mijoz (oziq-ovqat/farma) propusk+sanitariya talab qiladi; EP-CRM-048 transport tarixi bilan; bir martada yetkazish.
- **Manba:** kitob (mijoz korxona toifasi) + EP-CRM-048 + v2-A
- **Dalil (kod):** `grep "warehouse.?entry.?requirement|kirish.?talab|inbound_requirement"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** mijoz-kesimli kirish-talablari maydoni (strukturali yoki erkin matn), Logistikaga ko'rsatiladigan holda (VR-CRM-I40).
- **Bog'liqlik:** EP-CRM-048, Logistika moduli, VR-CRM-I40
- **action:** CREATE
- **⤳ Ta'sir:** Logistika (Eltib berish)
- **Xoch-havolalar:** `[Module-13] Item 132` · `EXTRACTION QISM C §13 #82` · `VR-CRM-I40`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-083 · Mijoz bilan kelishilgan o'rash/qadoqlash usuli (v2 Q53)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz mahsulotiga yig'ish/o'rash usuli biriktiriladi (stepler/yelim/qo'lda/oyna). Kitob "Упаковка Степлер / Склейка ручная / Окошка" real usullar; saqlanmasa noto'g'ri yig'ilib qaytariladi (EP-CRM-072 brak bilan).
- **Manba:** kitob ("Упаковка Степлер/Склейка/Окошка") + v2-A
- **Dalil (kod):** `grep "packaging_method|o.rash.*usul|packing_preference"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** mijoz/mahsulot-liniyasi yozuvida qadoqlash-afzalligi maydoni.
- **Bog'liqlik:** EP-CRM-072, EP-CRM-078
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (yig'ish), Ombor (WMS)
- **Xoch-havolalar:** `[Module-13] Item 133` · `EXTRACTION QISM C §13 #83`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-084 · "Akademiyaga" / namuna ishlab chiqarish belgisi (v2 Q54)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — "namuna/sinov" turi sotuvdan ajratiladi (daromadga kirmaydi, material hisobiga kiradi). Kitob "Академияга" (ichki o'quv/namuna) real belgi; namuna pul keltirmaydi-yu material sarflaydi → toza statistika (EP-CRM-064 kg bilan).
- **Manba:** kitob ("Академияга") + v2-A
- **Dalil (kod):** `grep "order_type.*sample|namuna|sample_order"` `apps/api/src/modules/crm` ichida → faqat `churn-retrain.service.ts` dagi ML "namuna" (training sample) atamasi — aloqasiz. Buyurtma-turi/namuna-ajratish kodi yo'q.
- **Nima yetishmaydi:** `order_type` maydoni ("namuna") + daromad statistikasidan chiqarish; PP tomonda past-ustuvorlik kategoriyasi (VR-CRM-I30).
- **Bog'liqlik:** EP-CRM-064, VR-CRM-I30
- **action:** CREATE
- **⤳ Ta'sir:** Finance, Ishlab chiqarish (namuna xarajati)
- **Xoch-havolalar:** `[Module-13] Item 134` · `EXTRACTION QISM C §13 #84` · `VR-CRM-I30`
- **Δ 2026-07-11→08-07:** —

### EP-CRM-085 · Mijoz uchun mas'ul operator/usta tarixi (v2 Q55)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** A — mijoz mahsuloti ↔ tajribali operator bog'lanadi (rejada ustuvor). Kitob aniq operatorlar (Yuldasheva Z/Xolmatov M/Shomansurov A); tamoyil tasdiq, lekin reja-qoidasi (usta-mosligi PP rejaga qattiq qoidami yoki tavsiyami) Ishlab chiqarish bilan birga aniqlanadi.
- **Manba:** kitob (operatorlar ro'yxati) + EP-CRM-061 (stanok marshruti) + v2-A (reja-qoida egasidan)
- **Dalil (kod):** `grep "operator.*history|usta.*tarix|assignedOperatorHistory"` `apps/api/src/modules/crm` ichida → **0**.
- **Nima yetishmaydi:** PP operator-biriktirish yozuvlarini mijoz/mahsulot-liniyasiga bog'lab o'qish. **Egasi/PP-QAROR:** qaysi operator qaysi mijozga "tegishli" qoidasi (qattiq mezonmi yoki tavsiyami — VR-CRM-I46 "tavsiya" deb aytadi).
- **Bog'liqlik:** PP operator-biriktirish ma'lumoti (tekshirilmagan), EP-CRM-061, VR-CRM-I46
- **action:** CREATE
- **⤳ Ta'sir:** Ishlab chiqarish (rejalashtirish), Sifat
- **Xoch-havolalar:** `[Module-13] Item 135` · `EXTRACTION QISM C §13 #85` · `VR-CRM-I46`
- **Δ 2026-07-11→08-07:** —

---

## II QISM — EP-kodsiz vizyon-realizatsiya bo'shliqlari (VR-CRM-I01..I50)

> Bu 50 band `vision-1000-answers/13-crm.md` #1..#50 = `EXTRACTION QISM A` #1..#50 = `FULL-ITEM-LEVEL [Module-13] Item #1..#50` dan keladi. Ularning **birortasiga ham `decisions/13-crm.md` EP-kod bermagan** — bular egasi-qarorlari emas, balki qaror qabul qilingandan **keyingi realizatsiya-nuanslari** (mexanizm, konkurrentlik, gate, event-nomlari). Shuning uchun ular I QISM sanog'iga **kirmaydi**.
> Qamrov: 33 tasi `EXTRACTION QISM D` (V/VERIFY) da qayta hal qilingan; qolgan 17 tasi faqat QISM A + FULL-ITEM dalilida.
> **Taqsimot:** Qisman 11 · Yo'q 35 · STALE-DOC 4.

### VR-CRM-I01 · Lid-scoring real-time trigger (cron emas)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `agents/lead-scoring-agent.service.ts:6,98` — `@Cron('0 9 * * *', {timeZone:'Asia/Tashkent'})`; faylda `@OnEvent`/`EventEmitter2` → **0**. `crm-lead-scoring.service.ts` toza formula-servis ("NO DB access, NO I/O"), faollik-yaratish yo'lidan sinxron chaqirilmaydi.
- **Bog'liq bandlar:** EP-CRM-011, EP-CRM-012
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I02 · Round-robin race `SELECT FOR UPDATE SKIP LOCKED`
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "FOR UPDATE|SKIP LOCKED"` `modules/crm` → **0**. `website-lead.repository.ts:37 pickNextSalesManager()` 30-kunlik lid-sanog'ini o'qib minimumni qaytaradi — qator-qulfisiz, ya'ni parallel insertlarda ikki lid bir menejerga tushishi mumkin.
- **Bog'liq bandlar:** EP-CRM-005
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I03 · Ochiq qarzda egasizlantirish bloklanadi (Finance signali)
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Tavsif:** QISM A #3 "Yo'q — SB0668 (impl yo'q)" **eskirgan**: `crm/cron/lead-aging-reassign.cron.ts` real `@Cron('0 7 * * *')`, `crm.module.ts:48,231` da ro'yxatda. LEKIN cronda **Finance qarz-tekshiruvi yo'q** — faqat `last_activity_at` yoshiga qarab qayta taqsimlaydi.
- **⚠️ ZIDDIYAT:** QISM A #3 va QISM C #63 ikkalasi ham "kod yo'q" deydi — jonli faylda to'liq implementatsiya bor.
- **Bog'liq bandlar:** EP-CRM-063, EP-CRM-036, EP-CRM-024
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I04 · Menejer tashrifi mobil orqali (GPS ixtiyoriy)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** "tashrif" faollik turi (manzil+vaqt+izoh) va uni mobil orqali kiritish oqimi topilmadi.
- **Bog'liq bandlar:** EP-CRM-006, EP-CRM-029
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I05 · KP "ko'rildi": email-piksel + Telegram belgisi, aks holda qo'lda
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Tavsif:** QISM D #5 "Yo'q — pixel/opened_at/viewedAt grep 0". **Δ `47ccb174` (2026-07-11) buni yopdi:** `crm_proposals.viewed_at` migratsiyasi + `crm-bitrix-compat.controller.ts:133` piksel endpointi + `crm-bitrix-compat-proposals.repository.ts:61-68` idempotent `WHERE viewed_at IS NULL` markViewed.
- **Nima yetishmaydi:** Telegram "ko'rildi" kanali va menejerning qo'lda "ko'rildi + sabab" fallbacki yo'q; `crm_proposals` = 0 qator.
- **Bog'liq bandlar:** EP-CRM-021
- **Δ 2026-07-11→08-07:** `47ccb174` — email-piksel yarmi qurildi.

### VR-CRM-I06 · Narx oshganda ta'sirlangan mijoz ro'yxati + eski narx blok
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** SB0676 "price recalc MM↔CRM yo'q" tasdiqlandi; Savdo rahbari tasdig'igacha eski narx bilan bitim ochishni bloklaydigan gate yo'q.
- **Bog'liq bandlar:** EP-CRM-057, EP-CRM-058
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I07 · Qarz holati Finance keshi (5 daq TTL) + SD real-time tekshiruv
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** QISM D #7 — `crm-deals.controller.ts:116 @Post()` bitim yaratishda hech qanday debt/credit gate yo'q; `grep "creditLimit|debt"` deals-controllerda → 0. Kesh/TTL modeli ham yo'q.
- **Bog'liq bandlar:** EP-CRM-024, EP-CRM-037
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I08 · Egasizlantirish CRON QC/Finance da'vosini tekshiradi
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Tavsif:** cron real va ishlaydi (VR-CRM-I03), lekin `reassignColdLeads()`/`reassignOne()` da QC yoki Finance da'vo-tekshiruvi so'rovi yo'q → muammoli mijoz oddiy mijoz kabi qayta taqsimlanadi.
- **Bog'liq bandlar:** EP-CRM-063, EP-CRM-073
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I09 · Caller ID ko'p mijozda korporativ liniya flagi + qo'lda tanlash
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `crm-auto-lead.service.ts:37 ingestCallLead(phone,...)` faqat telefon→lid; korporativ-liniya flagi, qo'lda tanlash, tanlov-tarixi yo'q.
- **Bog'liq bandlar:** EP-CRM-028, EP-CRM-031
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I10 · Sinov davri bayrog'i HR "sinov tugadi" eventidan avto
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** HR sinov-holati eventiga CRM listeneri yo'q; sinov davridagi bitimlarni KPIga qo'shish qoidasi qurilmagan.
- **Bog'liq bandlar:** EP-CRM-065
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I11 · VIP/segment har buyurtmadan keyin trigger bilan qayta hisob
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Tavsif:** `crm/analytics/rfm.service.ts` (9-segment RFM, toza hisob) + `crm-analytics.controller.ts:89 @Post('rfm/cluster')` real. LEKIN **on-demand** — `grep "@OnEvent"` `analytics/` → 0; per-buyurtma event-trigger va VIP-pasayish bildirishnomasi yo'q.
- **⚠️ ZIDDIYAT:** `[Module-13] Item 11` "Yo'q" vs `QISM D #11` "Qisman" — QISM D chuqurroq tekshirgan, **Qisman** qabul qilindi.
- **Bog'liq bandlar:** EP-CRM-018, EP-CRM-019, EP-CRM-054
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I12 · Kredit limiti oshganda blok + Даромадлар/direktor tasdig'i
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Tavsif:** `sd_customers.is_blocked` real va mijoz yaratishda `false` qilinadi; limit-chegarasiga qarab uni yoqadigan mantiq va direktor-tasdiq oqimi yo'q. `director` HITL `DISCOUNT_OVERRIDE` bor, lekin CRM bitim-gate emas.
- **Bog'liq bandlar:** EP-CRM-024, EP-CRM-036
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I13 · KP 14 kun o'tsa narx FIFO avto-yangilanadi + menejer tasdig'i
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** KP muddat-triggeri, FIFO narx-yangilash va tasdiq-gate — hech biri yo'q (SB0676).
- **Bog'liq bandlar:** EP-CRM-021, EP-CRM-057
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I14 · Eksportda `WHERE assigned_to=current_user` + field-RBAC + audit
- **Qurilish holati:** STALE-DOC *(2026-08-07 Δ)*
- **Tavsif:** `[Module-13] Item 14` "Yo'q — SB0629 card_id FK yo'q" **eskirgan**. Jonli kod: `crm-deals.controller.ts:113 @Get('export')` → `deals.service.ts:47 exportDeals(user)` — row-skoplangan eksport + **majburiy** `recordExportAudit` (`audit_logs`, `action='export'`, `new_values={row_count,row_scoped}`; yozilmasa eksport fail bo'ladi). `3cab5de7` (2026-07-10) — auditdan 1 kun oldin.
- **Nima yetishmaydi:** maydon-darajali RBAC (kontakt/narx/qarz niqoblash) hamon yo'q; `card_id` FK yo'q; skoping ustuni `assigned_to` emas, `COALESCE(assigned_by_id, manager_id)`.
- **⚠️ ZIDDIYAT:** Item 14 `assigned_to` bo'yicha grep qilgan, kod uni **ataylab ishlatmaydi** → grep bo'shliqni noto'g'ri aniqlagan.
- **Bog'liq bandlar:** EP-CRM-066, EP-CRM-067, EP-CRM-030
- **Δ 2026-07-11→08-07:** `2db4f06b` — eksport skopingi kanonik egalik ustuniga ko'chirildi.

### VR-CRM-I15 · QC reklamatsiya `QcReclamationOpenedEvent` → CRM (bir yo'nalish)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** CRM listenerlari = faqat website-lead + lead-converted; `grep "Reclamation"` crm → 0. `qc_reclamations` jadvali bor (`schema-misc-qc.ts:39`), CRM'ga event-ko'prik yo'q.
- **Bog'liq bandlar:** EP-CRM-025, EP-CRM-072, EP-CRM-073
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I16 · 360° parallel so'rov + har blok skeleton
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Tavsif:** 360 real: BE `customer-360.builder.ts` + `.helpers.ts`, FE `pages/crm/DetailSheetCustomer360.tsx` va `pages/Customer360Page.tsx`. LEKIN `grep "Skeleton|Promise.all|useQueries"` `DetailSheetCustomer360.tsx` → **0** — parallel-blok + skeleton yuklash strategiyasi yo'q.
- **⚠️ ZIDDIYAT:** `[Module-13] Item 16` "Yo'q" vs `QISM D #16` "Qisman" — **Qisman** qabul qilindi (360 ning o'zi real).
- **Bog'liq bandlar:** EP-CRM-015
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I17 · Menejer ketganda korporativ akkaunt HR'da + yozishma arxiv (read-only)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** reassign/HR-sinxron mantig'i yo'q (SB0662/0668); CRM listenerlarida HR-leave/reassign → 0.
- **Bog'liq bandlar:** EP-CRM-031, EP-CRM-035, EP-CRM-008
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I18 · AI churn vazifasi faqat CRM ichida (Kanban'ga tushmaydi)
- **Qurilish holati:** STALE-DOC *(2026-08-07 Δ)*
- **Tavsif:** QISM A #18 "Yo'q — SB0641" eskirgan: `crm/analytics/churn.service.ts` + `churn-retrain.service.ts` real va **CRM moduli ichida** — arxitektura chegarasi bajarilgan. `4d111226` esa compat qatlamdagi `churnAnalysis` soxta bo'lganini oshkor qildi.
- **Bog'liq bandlar:** EP-CRM-014, EP-CRM-026
- **Δ 2026-07-11→08-07:** `4d111226` — soxta compat churn endpointi 501 ga.

### VR-CRM-I19 · Format o'zgarishi dialogi faqat ta'sirlangan mahsulot liniyasida
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** per-liniya deal-edit gate'i CRM FE/BE da topilmadi; mijozga bildirishnoma + elektron rozilik ham yo'q.
- **Bog'liq bandlar:** EP-CRM-050, EP-CRM-078
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I20 · "O'lcham tasdiqlandi" bayrog'ini dizayner belgilaydi (gate)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "size.*confirm|o'lcham"` CRM → 0; Dizayn-modul gate'i CRM'da yo'q; ishlab chiqarish farq qilganda avto-flag ham yo'q.
- **Bog'liq bandlar:** EP-CRM-049, EP-CRM-052, EP-CRM-051
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I21 · ГП blanka 3 imzo (omborchi+haydovchi+menejer) PIN F5
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "signature|blanka|PIN|imzo"` crm → mos yo'q; 3-imzo yuk-chiqarish gate'i CRM'da qurilmagan.
- **Bog'liq bandlar:** EP-CRM-046, EP-SD-138
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I22 · Qayta buyurtmada diff view + har maydon alohida tasdiq
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "reorder|diff"` → faqat custom-fields `reorder(order_index)` va churn "reorder-threshold" izohi; qayta-buyurtma diff-UI/constraint yo'q.
- **Bog'liq bandlar:** EP-CRM-043, EP-CRM-041
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I23 · Imzolangan spetsifikatsiyada ham Finance qarz bloki ustun
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** yuk-chiqarishda Finance-blok CRM'da yo'q (WMS/SD domeni); `grep "signed.*spec|Finance.*block"` crm → 0.
- **Bog'liq bandlar:** EP-CRM-024, EP-CRM-069
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I24 · O'zga mijoz qidiruvida faqat nom+turi (field-RBAC) + audit
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Tavsif:** row-daraja **bor** (`crm-row-scope.ts`, fail-closed). Maydon-daraja **yo'q** — `maskContact/hideContact` grep → 0; "ko'rishga urinish" audit yozuvi ham yo'q (audit faqat eksportda).
- **Bog'liq bandlar:** EP-CRM-067, EP-CRM-030, EP-CRM-062
- **Δ 2026-07-11→08-07:** `2db4f06b` + `ccd017c0` — row-daraja mustahkamlandi, maydon-daraja hamon ochiq.

### VR-CRM-I25 · `SupplyImportIssueEvent` → CRM vazifa + direktor panel
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "SupplyImport|import.issue"` butun `apps/api/src` → **0** — event Ta'minot tomonida ham mavjud emas.
- **Bog'liq bandlar:** EP-CRM-081, EP-CRM-071
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I26 · Dizayn/STP kun-limiti oshsa bo'lim boshlig'i+sotuvchiga (E5)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "escalat|eskalat|day.limit|E5|Vysotskiy"` crm → **0 fayl** — eskalatsiya marshruti CRM'da umuman yo'q.
- **Bog'liq bandlar:** EP-CRM-051, EP-CRM-009, EP-CRM-010
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I27 · Qog'oz zayavka profili pre-fill + alohida snapshot
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "pre-fill|prefill|snapshot"` crm → mos yo'q.
- **Bog'liq bandlar:** EP-CRM-041, EP-CRM-039
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I28 · AI churn + Marketing kampaniya: "faol kampaniya" flagi
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Tavsif:** churn aniqlash real, lekin `crm_followup_activities` = **0 qator** → dublikat-vazifadan qochish tekshiruvi jonli mashq qilinmagan/qurilmagan.
- **Bog'liq bandlar:** EP-CRM-014, EP-CRM-026
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I29 · Chegirma suiiste'mol bayrog'i (90 kun 3+ / 10%+, business.constants)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "discount.*abuse|abuse.*flag|discount_count"` → **0**; `business.constants.ts` da CRM chegirma-suiiste'mol mezoni yo'q.
- **Bog'liq bandlar:** EP-CRM-074
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I30 · Namuna buyurtmasi PP'ga past ustuvorlik + daromaddan tashqari
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "sample|namuna"` crm → faqat ML "training sample" atamasi; "namuna" buyurtma-turi kategoriyasi yo'q.
- **Bog'liq bandlar:** EP-CRM-084
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I31 · Korporativ raqam abonent doirasi real-time webhook + INCIDENT
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "caller|telephon|webhook.*incident"` CRM → mos yo'q; SB0630/636 korporativ-raqam modeli "qurilmagan".
- **Bog'liq bandlar:** EP-CRM-032, EP-CRM-031, EP-CRM-028
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I32 · HR "ishdan ketdi" eventida avto-reassign + "kutish" holati
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Tavsif:** qayta-taqsimlash primitivlari real (`pickNextSalesManager`/`assignManagerIfMissing`), lekin `grep "HR_EmployeeStatusChangedEvent|EmployeeStatusChanged"` crm → **0**; yagona trigger = kunlik yoshlik cron'i, HR-eventi emas; "kutish" oraliq holati yo'q.
- **Bog'liq bandlar:** EP-CRM-063, EP-CRM-031, EP-CRM-035
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I33 · HR holati (ta'til/kasal/sinov) real-time round-robin'ga ta'sir
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `HR_EmployeeStatusChangedEvent` listeneri CRM'da yo'q — band/ta'tildagi sotuvchi hamon navbatda qoladi.
- **Bog'liq bandlar:** EP-CRM-005, EP-CRM-065
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I34 · Chiqimli/chiqimsiz narx IChM dan avto + "norma yo'q" ogohlantirish
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "IChM|chiqim.*norma|cost.*price"` CRM → mos yo'q.
- **Bog'liq bandlar:** EP-CRM-056, EP-CRM-058
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I35 · ГП-kod profiliga QC brak/rad belgisi + qayta buyurtmada ogohlantirish
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "brak|QC.*flag|reorder.*warn"` crm → mos yo'q; QC↔CRM brak-flag ulanishi yo'q.
- **Bog'liq bandlar:** EP-CRM-043, EP-CRM-072
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I36 · "Прошло (дней)" "Yuk chiqdi"da to'xtaydi; qisman to'lov to'xtatmaydi
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "proshlo|days.since.*ship|shipment.*counter"` crm → mos yo'q; yuk-chiqishda to'xtaydigan kun-hisoblagich yo'q.
- **Bog'liq bandlar:** EP-CRM-040, EP-CRM-039
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I37 · Yutildi→bekor qilinganda KPI avto-tuzatish eventi
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `crm-deals.controller.ts:141` faqat `@Patch(':id/won')`; bekor-qilish→KPI-avtotuzatish endpoint/eventi yo'q. `bbb46b63` `won` yo'nalishini yopdi, teskari (`won → not-won`) yo'nalish hamon yo'q.
- **Bog'liq bandlar:** EP-CRM-016, EP-CRM-023
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I38 · Keyingi buyurtma eslatma vaqti AI avto-hisob (standart 30 kun)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "reminder|next.*order"` crm → mos yo'q.
- **Bog'liq bandlar:** EP-CRM-047, EP-CRM-026
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I39 · Valyuta 5%+ sakrasa KP/bitim "qayta hisob kerak" statusi
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "recalc|qayta.hisob|currency.*jump|valyuta"` crm → **0**.
- **Bog'liq bandlar:** EP-CRM-071, EP-CRM-057
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I40 · Ombor kirish talablari Logistika rejasida `sales_orders`dan avto-tortiladi
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** Logistika/WMS domeni; `grep "warehouse.*entry|logistics"` crm → mos yo'q.
- **Bog'liq bandlar:** EP-CRM-082, EP-CRM-048
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I41 · Yutqazilgan bitim root-cause Director dashboard + haftalik hisobot
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Tavsif:** `crm_loss_reasons` lookup jadvali (`crm-loss-reasons-2026-07-08.sql`) + `crm-settings.controller.ts` CRUD + `drizzle-crm-analytics.repo.ts:210 getLossReasonRollup()` real SQL **mavjud** — "rollup analitika qurilmagan" da'vosi eskirgan. LEKIN `crm_loss_reasons` = **0 qator** va `crm_deals` da `lost_reason_id` FK yo'q → rollup erkin matn bo'yicha guruhlaydi. Haftalik avto-hisobot yo'q.
- **Bog'liq bandlar:** EP-CRM-020, EP-CRM-027
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I42 · "Menejer fikri/hohishi" strukturali + AI onboarding tavsiya
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "onboarding|opinion|hohish|structured.note"` crm → faqat rfm/clv izohlaridagi "onboarding" so'zi; strukturali maydon yo'q.
- **Bog'liq bandlar:** EP-CRM-050, EP-CRM-042
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I43 · Korporativ raqam nazorati real-time + INCIDENT (НО-2)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** VR-CRM-I31 bilan bir mexanizm — korporativ-raqam modeli/webhook/incident CRM'da yo'q (SB0630/636).
- **Bog'liq bandlar:** EP-CRM-032, EP-CRM-033
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I44 · Korporativ kanal bypass — texnik emas, siyosat+HR orqali
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** vizyonning o'zi "to'liq texnik oldini olib bo'lmaydi" deydi → talab = НО-2 reglamenti + korporativ akkaunt majburiyligi + Inspeksiya nazorati + HR shartnoma bandi. Bularning **birortasi ham** ERPda qurilmagan (EP-CRM-031/032/035 hammasi Yo'q).
- **Bog'liq bandlar:** EP-CRM-031, EP-CRM-032, EP-CRM-035, EP-CRM-066
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I45 · Leaderboard haftalik (Monday reset), faqat "Yutdik"; forecast alohida
- **Qurilish holati:** STALE-DOC *(2026-07-11)*
- **Tavsif:** QISM A "SB0592/612/626 — leaderboard endpoint yo'q" **noto'g'ri**: `sd/presentation/sd-dashboard.controller.ts:57-62` `@Get('leaderboard')` real, `sd-dashboard.repository.ts:108-135` da `employees → crm_leads.manager_id → sales_orders` join + `RANK() OVER (...)` + `period` filtri.
- **Nima yetishmaydi:** spetsifikatsiyaga mos emas — oylik/choraklik/yillik oyna (haftalik Monday-reset emas); oynadagi hamma `sales_orders.total_value` yig'iladi (faqat "Yutdik" bitimlar emas); alohida "prognoz" bo'limi yo'q.
- **⚠️ ZIDDIYAT:** QISM A Step-3 (2026-07-04) "sd-dashboard.controller.ts'da leaderboard endpoint topilmadi" — jonli faylda bor.
- **Bog'liq bandlar:** EP-CRM-023, EP-CRM-027, EP-CRM-064
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I46 · Mas'ul operator/usta PP rejalashtirishda "tavsiya" (majburiy emas)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** PP-rejalashtirish domeni; CRM'da mos kod yo'q.
- **Bog'liq bandlar:** EP-CRM-085, EP-CRM-061
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I47 · "Asosiy mijoz" bayrog'i PP'ga `sales_orders` event orqali + WMS bron
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Tavsif:** golden-thread event zanjiri real (`deal-won.listener.ts`), `crm_deals.sales_order_id` ustuni bor, lekin `SELECT conname FROM pg_constraint WHERE conrelid='crm_deals'::regclass AND contype='f'` → **`[]`** (DB-darajasida FK yo'q). VIP→PP ustuvorlik / WMS material-bron yarmi umuman yo'q.
- **Bog'liq bandlar:** EP-CRM-016, EP-CRM-054, EP-CRM-059
- **Δ 2026-07-11→08-07:** ⭐ `bbb46b63` — zanjir birinchi marta real oqimda ishga tushdi (FK hamon yo'q).

### VR-CRM-I48 · CRM audit tizim-wide `audit_log` (7 yil) + `WHERE module='CRM'` filtr
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Tavsif:** QISM D #48 "grep `audit_log` crm → 0 fayl" **eskirgan**: `drizzle-crm-deals.repo.ts:62-78` `INSERT INTO audit_logs (...) VALUES ('crm_deals','*','export',...)` — `3cab5de7` (2026-07-10) dan beri. Bundan tashqari `crm_history` per-entiti audit izi real (`crm-extras-comments.repository.ts:70-85`).
- **Nima yetishmaydi:** faqat eksport `audit_logs` ga yozadi (yaratish/o'zgartirish/ko'rish emas); `WHERE module='CRM'` Инспекция-filtr UI yo'q; 7-yillik saqlash siyosati tasdiqlanmadi.
- **⚠️ ZIDDIYAT:** QISM D #48 vs jonli kod.
- **Bog'liq bandlar:** EP-CRM-068, EP-CRM-066, EP-CRM-033
- **Δ 2026-07-11→08-07:** `2db4f06b` — audit yozuvidagi `row_scoped` bayrog'i tuzatildi.

### VR-CRM-I49 · Klishe/STP 3 kun→Dizayn boshlig'i; 7 kun→Vysotskiy-7 bir daraja yuqori (E5)
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "escalat|klishe|clishe|E5"` crm → **0** — VR-CRM-I26 bilan bir ildiz.
- **Bog'liq bandlar:** EP-CRM-051, EP-CRM-079, EP-CRM-009
- **Δ 2026-07-11→08-07:** —

### VR-CRM-I50 · CRM oflayn (PWA): lid+faollik mumkin, KP faqat onlayn; conflict=server ustun
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Tavsif:** `grep "offline|serviceWorker|indexedDB|sync.conflict"` `pages/crm` → **0 fayl**.
- **Bog'liq bandlar:** EP-CRM-029
- **Δ 2026-07-11→08-07:** —

---

## III QISM — Metodologiya, xaritalash va qamrov eslatmalari

### 1. Ikki holat-o'qi
`Qaror holati` = **egasi qaror qildimi** (manba: `decisions/13-crm.md` ning `Holat` qatori — 73 ✅ / 12 🔵).
`Qurilish holati` = **kod/DB da qurilganmi** (manba: `FULL-ITEM-LEVEL [Module-13]` ning `Current status` qatori, 2026-07-11 sanasi; keyin `Δ` bilan yangilandi).
Ular **hech qachon birlashtirilmadi**. Ikkala yo'nalishdagi misollar:
- ✅ javoblangan + **Yo'q** qurilgan (20 dan ortiq band): EP-CRM-031 (korporativ raqam), EP-CRM-039 (Папка №), EP-CRM-046 (3 imzo), EP-CRM-069 (avans gate), EP-CRM-084 (namuna ajratish).
- 🔵 ochiq + **qurilgan**: EP-CRM-063 (egasizlantirish — cron to'liq ishlaydi, N=60 konstanta, egasi tasdig'i kutilmoqda) · EP-CRM-012 (lead-scoring — 5 mezonli formula real, vaznlar egasidan) · EP-CRM-020 (yutqaz-sabab — lookup jadval + rollup real, ro'yxat egasidan) · EP-CRM-018 (segment — ustun bor, taksonomiya egasidan) · EP-CRM-024 (`is_blocked` bor, limit egasidan).

### 2. Raqamlash siljishi — to'liq xarita (Qoida 3)
`FULL-ITEM-LEVEL [Module-13]` = **135 item**, EP-kod = **85**. Farq (50) **toza** va bir blokdan iborat — SD moduldagidek chalkash emas:

| FULL-ITEM diapazon | Manba (Vision citation) | EP-CRM xaritasi | Formula |
|---|---|---|---|
| `Item #1..#50` | `vision-1000-answers/13-crm.md #1..#50` (= `EXTRACTION QISM A` #1..#50) | **EP-kod berilmagan** → II QISM `VR-CRM-I01..I50` | `VR-I = Item` |
| `Item #51..#135` | `TASDIQ-2146 §13 #1..#85` (= `EXTRACTION QISM C`) | **EP-CRM-001..085** | `EP = Item − 50` |

**Nima uchun toza:** `decisions/13-crm.md` ikki blokka bo'lingan (v1 30 + v2 55 = 85, fayl tartibida), `TASDIQ-2146 §13` esa **aynan shu tartibda** yozilgan (#1..#30 = v1, #31..#85 = v2). Shuning uchun offset butun diapazon bo'ylab o'zgarmas `−50`. **Takror item yo'q**, **o'tkazib yuborilgan EP yo'q**: `Item 51 → EP-001` (voronka) va `Item 135 → EP-085` (operator tarixi) chegara-tekshiruvlari mos keldi.

**Uch manba orasidagi 1:1:1 zanjir:** `EP-CRM-NNN` ↔ `[Module-13] Item (NNN+50)` ↔ `EXTRACTION QISM C §13 #NNN`. Har bandda uchalasi ham xoch-havolada ko'rsatilgan.

### 3. `vision-1000-answers` #1..#50 — nega EP-kod olmagan
`decisions/13-crm.md` faqat `vision-questions/13-crm.md` (30) + `vision-questions-v2/13-crm.md` (55) savol-fayllaridan qaror-kod chiqargan. `vision-1000-answers/13-crm.md` esa **javob-fayl** — u shu qarorlarning realizatsiya-nuanslarini (mexanizm, konkurrentlik, event nomi, gate joyi) aniqlashtiradi, yangi egasi-qarori ko'tarmaydi. SD registrida bunday qatorlar mavzu bo'yicha EP-bandlarga `(taxminiy)` tarqatilgan edi; CRMda esa **hammasi aniq bitta EP-bandga taalluqli emas** (masalan #2 `SELECT FOR UPDATE SKIP LOCKED` = sof konkurrentlik-nuansi), shuning uchun Qoida 6 bo'yicha II QISMga `VR-CRM-I01..I50` sifatida ajratildi va har birida `Bog'liq bandlar` orqali EP-larga ulandi.

### 4. "Mos item topilmadi" (Qoida 4 — to'qilmadi)
**0 band.** 85 EP-kodning **hammasiga** `FULL-ITEM-LEVEL` da ham, `TASDIQ-2146 §13` da ham mos qator topildi. Hech narsa taxmin qilinmadi.

### 5. Ziddiyatlar reestri
| # | Band | Ziddiyat qisqacha | Hal |
|---|---|---|---|
| 1 | EP-CRM-014 | `Item 64` + QISM C #14 "Ha" — dalil faqat **fayl mavjudligi** (Glob); `4d111226` compat `churnAnalysis` soxta bo'lganini ko'rsatdi | Qisman |
| 2 | EP-CRM-018 | QISM C #18 "sd_customers.segment CHECK bor" vs jonli `pg_constraint` → `[]` | STALE-DOC |
| 3 | EP-CRM-022 | `Item 72` "row-level filtr yo'q" vs `crm-row-scope.ts` (`259b5c56`, 2026-07-09 — auditdan 2 kun oldin) | STALE dalil; band Qisman (`card_id` FK yo'q) |
| 4 | EP-CRM-026 | `decisions` "EP-CRM-033 N-kun egasizlantirish" — EP-CRM-033 = qo'ng'iroq nazorati; to'g'risi **EP-CRM-063** | hujjat raqami xato |
| 5 | EP-CRM-030 | `decisions` "EP-CRM-075/076 kontakt yashirish + eksport blok" — to'g'risi **EP-CRM-067 + EP-CRM-066** | hujjat raqami xato |
| 6 | EP-CRM-048 | `decisions` "EP-CRM-085 ombor-kirish" — to'g'risi **EP-CRM-082** | hujjat raqami xato |
| 7 | EP-CRM-055 | `decisions` "EP-CRM-080 oylik diog" — to'g'risi **EP-CRM-075** | hujjat raqami xato |
| 8 | EP-CRM-058 | `decisions` "EP-CRM-084 mahsulot liniyalari" — to'g'risi **EP-CRM-078** | hujjat raqami xato |
| 9 | EP-CRM-062 | `Item 112` "row-scope yo'q" (STALE) **va** jonli kodda yangi bo'shliq: `CRM_SEES_ALL_ROLES` da `sales_manager` yo'q → "Савдо рахбари=hamma" bajarilmaydi | Qisman + yangi topilma |
| 10 | EP-CRM-063 | QISM A #3 "impl yo'q" + QISM C #63 "kod tasdiqlanmadi" vs to'liq `lead-aging-reassign.cron.ts` | STALE-DOC |
| 11 | EP-CRM-066 | `Item 116` + QISM C #66 "export-controller yo'q" vs `3cab5de7` (2026-07-10) | Qisman (STALE dalil) |
| 12 | EP-CRM-068 | QISM D #48 "CRM `audit_log`ga yozmaydi" vs `drizzle-crm-deals.repo.ts:62-78` | Qisman (STALE dalil) |
| 13 | EP-CRM-071 | `decisions` "EP-CRM-085 import-toifa" — to'g'risi **EP-CRM-081** | hujjat raqami xato |
| 14 | VR-CRM-I03 | QISM A #3 / QISM C #63 "kod yo'q" vs jonli cron | STALE-DOC |
| 15 | VR-CRM-I11 | `Item 11` "Yo'q" vs QISM D #11 "Qisman" | Qisman |
| 16 | VR-CRM-I14 | `Item 14` `assigned_to` grep'i bo'yicha "Yo'q" — kod uni ataylab ishlatmaydi | STALE-DOC |
| 17 | VR-CRM-I16 | `Item 16` "Yo'q" vs QISM D #16 "Qisman" | Qisman |
| 18 | VR-CRM-I45 | QISM A Step-3 "leaderboard endpoint topilmadi" vs `sd-dashboard.controller.ts:57-62` | STALE-DOC |
| 19 | VR-CRM-I48 | QISM D #48 vs jonli `audit_logs` yozuvi | Qisman |

> **Naqsh:** 19 ziddiyatning **6 tasi** `decisions/13-crm.md` ning ichki EP-raqam havolalari xatosi (#4,5,6,7,8,13) — mazmun to'g'ri, faqat raqam adashgan. Qolgan **13 tasi** audit-dalilining eskirganligi (STALE) yoki grep-naqshining noto'g'ri tanlanganligi.
> ⚠️ **Umumiy xulosa (Qoida 7):** `decisions/13-crm.md` ning O'Z Xulosasi (73/12) **to'g'ri chiqdi** — sanoq muammosi yo'q; muammo EP-raqam **havolalarida**.

### 6. Δ (2026-07-11 → 2026-08-07) metodologiyasi
`git log --since=2026-07-11 -- apps/api/src/modules/crm/ apps/api/src/modules/compatibility/ artifacts/erp-dashboard/src/pages/crm/` → **9 commit** (CRM-ga tegishli). Ular uch to'lqinga bo'linadi:

**(a) 2026-07-11 "sxema-ochilish" to'lqini (3 commit)** — Q-35 schema-approval doirasida, hammasi jonli `crm_leads`/`crm_proposals` jadvallariga additiv ustun qo'shadi:
`47ccb174` → `crm_proposals.viewed_at` (KP email-piksel) · `3d500908` → `crm_leads.region` + `is_export` (EP-MKT-102) · `1909ba47` → `crm_leads.product_type` 5-toifa CHECK (EP-MKT-089).
⚠️ Oxirgi ikkitasi **Marketing (EP-MKT)** qarorlari bo'yicha tasdiqlangan, lekin CRM jadvaliga tegadi — shuning uchun tegishli EP-CRM bandlarida "yaqin, lekin aynan emas" izohi bilan Δ qilib yozildi (EP-CRM-005/061/078/081).

**(b) 2026-07-13 "boot/RBAC" to'lqini (2 commit)** — `1ac2204f` takroriy `ai/extended/*` aliaslari Fastify'ni **boot'da qulatardi** (ya'ni 2026-07-11 audit paytida CRM AI endpointlari umuman javob bermagan bo'lishi mumkin — bu QISM A/C dagi ba'zi "Yo'q" baholarini tushuntiradi) · `2db4f06b` row-scoping kanonik egalik ustunini `assigned_to` → `COALESCE(assigned_by_id, manager_id)` ga tuzatdi.

**(c) 2026-08-06..07 "Q-40 yashil-yolg'on / oltin-zanjir" to'lqini (4 commit)** — `9fabdacb` (403 blokirovka) · `04a4e5db` (Quick Create bloklangan) · `4d111226` (5 soxta AI endpoint → 501) · `ccd017c0` (deal update/delete IDOR) · ⭐ `bbb46b63` (DealWonEvent oltin-zanjiri).

**Jami Δ belgilangan band:** I QISMda **19**, II QISMda **6**.

### 7. Jonli spot-verify natijasi (2026-08-07)
Vazifada berilgan uch commit-da'vosi jonli kodda tasdiqlandi:
- ⭐ `bbb46b63` ✅ — `crm/domain/deal-stage-markers.ts` mavjud (`WON_MARKERS`/`LOST_MARKERS`/`isWonStage`); `update-deal-stage.handler.ts:12-13,76-92` `DealWonEvent` ni `isWonStage(new) && !isWonStage(from) && !alreadyLinked` sharti bilan chiqaradi. Fayl izohi muammoni aynan tasdiqlaydi: "`DealWonEvent` was only ever published by `MarkDealWonHandler`, which no frontend calls".
- `4d111226` ✅ — `crm-extended.service.ts:154-178` beshta metod (`createTask`/`processChat`/`runAutoTasks`/`churnAnalysis`/`processVoice`) `Err(AppErr('NOT_IMPLEMENTED', ...))` qaytaradi, izohda "a green-lie worse than an honest 501".
- `04a4e5db` ✅ — `pages/crm/QuickCreateModal.tsx` + `QuickCreateModalSections.tsx` + `QuickCreateModalTypes.ts` (64 qo'shish).

Qo'shimcha jonli tekshiruvlar (audit-dalilini tuzatgan): `crm-row-scope.ts` ✅ · `deals.service.ts exportDeals` + `recordExportAudit` → `audit_logs` ✅ · `lead-aging-reassign.cron.ts` + `CRM_LEAD_AGING_REASSIGN_DAYS=60` ✅ · `crm_proposals.viewed_at` markViewed ✅ · `sd-dashboard.controller.ts:57-62 @Get('leaderboard')` ✅.

### 8. Egasi-DATA kutayotgan bandlar (qurilish uchun blokerlar)
Quyidagi bandlar **kod jihatdan tayyor yoki qurilishga tayyor**, lekin egasidan **raqam/ro'yxat** kutadi. ⭐ CLAUDE.md `Threshold qiymatlar = doim CRUD` qoidasiga ko'ra bular chatda so'ralmaydi — `business_settings`/master-data CRUD orqali default bilan qo'shilib, sozlanadi:
**EP-CRM-002** (voronka bosqich nomlari — `crm_stages` = 0, eng katta bloker: EP-CRM-001/016/051 ga ta'sir) · **EP-CRM-012** (scoring vaznlari) · **EP-CRM-018** (segment taksonomiyasi) · **EP-CRM-020** (yutqaz-sabab ro'yxati — `crm_loss_reasons` = 0) · **EP-CRM-024** (qarz limiti) · **EP-CRM-057** (qog'oz narx trigger %) · **EP-CRM-063** (egasizlantirish N — hozir kodda `60` konstanta, CRUDga chiqarilishi kerak) · **EP-CRM-069** (minimal avans %) · **EP-CRM-039** (Папка raqamlash konvensiyasi).

**Sof arxitektura/integratsiya qarori kutayotganlar** (bular CRUD emas — egasidan javob kerak):
**EP-CRM-007** (SMS/WhatsApp provayderi va navbati) · **EP-CRM-028** (ATS/telefoniya provayderi + yozuv qonuniyligi — EP-CRM-032/033/080 va VR-I09/I31/I43 ni bloklaydi) · **EP-CRM-079** (STP versiyalash modeli — Dizayn bilan) · **EP-CRM-081** (import-bog'liqlik toifa manbasi — Ta'minot feed bilan) · **EP-CRM-085** (operator↔mijoz reja-qoidasi qattiqmi/tavsiyami — PP bilan) · **EP-CRM-046** (3-imzo blankasi CRM'dami yoki SD'da — modul egaligi) · **EP-CRM-036** ("Даромадлар" Vysotskiy-7 da real KARTAmi — EP-CRM-037/038 ni bloklaydi).

### 9. Qamrov cheklovlari
- Qurilish-baholari **2026-07-11 audit dalili** + shu sessiyadagi jonish spot-verify aralashmasi. To'liq qayta-audit emas: `Yo'q` deb belgilangan bandlarning aksariyati o'sha auditning grep/DB natijasiga tayanadi va faqat Δ-commitlar tegib o'tgan joylarda qayta tekshirildi.
- `_audit/q.cjs` orqali olingan jonli DB sanoqlari (`crm_activities`=3, `crm_tasks`=16, `sd_customers`=16, `crm_stages`=0, `crm_proposals`=0, `crm_documents`=0, `crm_followup_activities`=0, `crm_products`=2, `crm_companies`=4, `crm_comments`=3, `crm_lead_stages`=6) **2026-07-11 holati** — FULL COMPANY RESET (2026-07-11) dan keyingi qurilish bosqichi raqamlari.
- Marketing (modul 14) bilan chegara: `crm_leads` jadvaliga tegadigan `3d500908`/`1909ba47` commitlari EP-MKT qarorlari doirasida qilingan. Bu registr ularni faqat **CRM bandlariga ta'siri** nuqtai nazaridan qayd etadi; ularning to'liq bandi `registry/14-marketing.md` da bo'lishi kerak.
