# VISION GAP MASTER PLAN — 2026-08-03

> Manba: 18 modul bo'yicha avtonom kashfiyot to'lqini (2026-08-03), oxirgi to'liq
> cross-reference (FULL-VISION-EXTRACTION-2026-07-07, ~4786 qator) va modul-maxsus
> "COMPLETE-FRESH-ANALYSIS" audit fayllariga asoslangan. Har bir band jonli kod
> bilan tasdiqlangan (Q-29 verify-don't-trust) — stale audit da'volari emas.
>
> **Yagona haqiqat manbai endi Task ro'yxati (TaskList).** Bu fayl — statik
> suratga olingan xulosa, real vaqtdagi holat uchun TaskList'ni tekshiring.

## Umumiy holat (bu to'lqin boshlanishida)

Oxirgi to'liq cross-reference (2026-07-07): **Ha (to'liq ishlaydi) ~2% · Qisman
~42% · Yo'q ~59%**. "Hujjatlashtirilgan ~65%" — bu yashirin ishlaydigan funksional
degani EMAS: ~62% umuman yo'q + ~35% mexanizm bor-u ishga tushmaydi + faqat ~2.5%
chindan ulangan.

## Bu to'lqinda topilgan: 215 band, 18 modul

| Modul | Band soni | P0 | Egasi-data |
|---|---|---|---|
| HR-Org | 21 | 2 | 2 |
| MES | 18 | 2 | 1 |
| QC | 12 | 0 | 1 |
| WMS | 8 | 1 | 1 |
| LMS | 11 | 0 | 1 |
| PP | 12 | 1 | 1 |
| IoT | 9 | 0 | 3 |
| POS | 8 | 2 | 0 |
| Director | 18 | 0 | 0 |
| Admin | 7 | 0 | 1 |
| Chat | 19 | 0 | 2 |
| CC | 13 | 2 | 8 |
| Kanban | 13 | 1 | 3 |
| AI/Aisha | 16 | 1 | 2 |
| SD | 10 | 3 | 2 |
| Marketing | 12 | 2 | 2 |
| Finance | 8 | 1 | 1 |
| Notifications | 0 | — | — |
| **Jami** | **215** | **15** | **~28** |

## Bajarilish jarayoni

1. **P0 to'lqin 1** (9 band: HR-RBAC, HR-onboarding-ID, MES×2, WMS, POS×2, PP,
   Kanban) — ✅ **TUGADI**, tekshirilib commit+push qilindi (9 commit,
   `chore/schema-convergence`).
2. **P0 to'lqin 2** (6 band: SD×3, Marketing×2, Finance×1) — ⏳ ishga tushirilmoqda.
3. **P1 to'lqinlar** — ~110+ band, modul bo'yicha guruhlab, verify+fix+typecheck+
   commit+push pattern bilan davom etadi.
4. **Egasi-data (~28 band)** — hech qachon avtonom yopilmaydi; CRUD-with-defaults
   patterniga mos kelmaydiganlari (real tashkiliy ma'lumot, biznes qarorlari, API
   kalitlari) alohida ro'yxatda saqlanadi.

## Egasi qaroriga muhtoj bandlar (avtonom yopib bo'lmaydi)

- **CC**: org/employee/council seed data (0 qator), field-level rol-tahrirlash
  huquqi qoidasi, CC↔boshqa-modul event kontrakti
- **Kanban**: ShVB shaxsiy jadval formati, karta-lavozim modeli, bosqich bog'liqligi
- **IoT**: Camera-AI GATED migratsiya tasdig'i, kanonik machines registry,
  energiya-hisoblagich manbasi
- **HR**: razryad_levels real qiymatlar (maosh oralig'i, imtihon o'tish %)
- **QC**: oziq-ovqat/kimyoviy xavfsizlik materiallar katalogi
- **Finance**: kassir PIN-ustun migratsiyasi + real PIN'lar
- **AI/Aisha**: bonus-mezon jadvali, card_folders maydon strukturasi
- **Marketing**: real ijtimoiy tarmoq/AI provider kalitlari
- **SD**: yetkazish→ombor qayta yoqish qarori, shartnoma ustun migratsiyasi

To'liq ro'yxat va tafsilot — TaskList'da `[EGASI-DATA]` prefiksi bilan belgilangan.

## Qoidalar (bu to'lqin davomida amal qiladi)

- Har band: **verify-first** — audit da'vosi jonli koddan tasdiqlanadi, aks holda
  "allaqachon tuzatilgan" deb belgilanadi (bir necha marta shunday chiqdi).
- Har fix: BE+FE typecheck 0 xato, mavjud testlar o'tishi shart.
- Yangi CREATE TABLE — faqat mavjud, allaqachon tasdiqlangan vizyon-spec asosida,
  Q-35 APPROVED marker bilan; haqiqiy yangi biznes qaror — egasiga qoldiriladi.
- Commit format: `fix(<modul>): <qisqa tavsif>` — har band alohida commit.
- Subagent commit qilmaydi — bosh sessiya tekshirib, commit+push qiladi (Q-31).

## ⚠️ TaskList holati (2026-08-05)

Sessiya davomida jarayon qayta ishga tushgan (crash) va shu bilan birga
**TaskList tool holati yo'qolgan** — `TaskList()` endi bo'sh qaytaradi, garchi
215 band ilgari o'sha tool orqali kuzatilgan bo'lsa ham. "Yagona haqiqat manbai
TaskList" yozuvi (yuqorida) shuning uchun endi TO'G'RI EMAS bu sessiya uchun —
**git log (`chore/schema-convergence`) + shu fayl** haqiqiy holat manbai.
TaskList'ni 215 ta band bilan qayta qurish o'rniga, git commit tarixi orqali
kuzatiladi (har commit item raqamiga ishora qiladi, masalan "fix(admin): #118 ...").

### Bu sessiyada tugallangan (commit+push, `chore/schema-convergence`):
- #119 — Lavozim yo'riqnoma fayl yuklash (2-bosqichli upload + positionName JOIN) — `dac0ccba`
- #118 — Admin Queue Monitor real BullMQ (edi 100% soxta) — `102c1efc`
- #122 — TenantFilterGuard global ro'yxatga olindi — `dc749dad`
- #123 — Backup/cron monitor sidebar'ga ulandi — `8039ab7f`
- #113 — Director Diary IDOR xavfsizlik tuzatildi (boshqa karta kundaligini o'qish/yozish) — `d23e650b`

### Egasi-data deb qayta tasniflangan (bu sessiya, kod kerak emas):
- #114 — Chiqindi (waste) → GL posting: kredit hisob tanlovi (Inventory 1000 vs COGS 9100) egasi qarori kerak
- #145 — CC field-level rol-tahrirlash: maydon×lavozim mapping + identity axis (position_code) egasi qarori kerak; positions=0 qator (blok)
- #108 — 5S sifat oqimi: `docs/audit/decisions/05-director.md` EP-DIR-085 hujjatida bu aynan "🔵 OCHIQ (A-default)" deb belgilangan — "Tozalik/intizom" KPI qo'shish + "har lavozim hujjatiga" bog'langan tozalik-mezoni hali egasi tomonidan tasdiqlanmagan. Mexanizmning o'zi (kamera-AI aniqlaydi→alert→inson tasdiqlaydi) endi #85 orqali umumiy holda ishlaydi (camera_alerts + CameraAlertsRouteController) — faqat "5S" mission-turi + director-panel KPI qo'shish qoladi, bu esa mezon tasdiqlangandan keyin mexanik ish.
- #107 — Operatsiya-turi normalari/smena statistika/worker-norm% paneli: `docs/audit/decisions/05-director.md` EP-DIR-058/059/060 barchasi "🔵 OCHIQ (A-default)". EP-DIR-059 aniq `CREATE` amal talab qiladi — yangi `operation_norm` jadval (Q-35 ruxsat kerak) + 13 ta operatsiya turi (avtokley/GTO/kley/oynakcha/paypoq/rezka/samokley/skleyka/tigel/yoni/laminatsiya/lak/vib.lak) uchun REAL norma-qiymatlar — bular faqat egasining "Iyun ishchilar.xlsx" faylida bor, men to'qib chiqara olmayman. EP-DIR-058 (ishchi norma% formula) ham Excel-formulaga mos bo'lishi kerak — aniq formula egasidan so'raladi.

### Bu sessiyada tugallangan (davomi — Workflow to'xtatilgandan keyin, to'g'ridan-to'g'ri):
- #104 — Director dashboard aiInsights: real karta-AI agregat (ckp_fact_values) — `a3a641a9`
- #191 — SD mijoz tahrirlash: "blacklist"/"blacklisted" mos kelmasligi + majburiy status-resend 400 — `a25d5fc4`
- #206 — Marketing dashboard totalSpent hech qachon hisoblanmagan — `429f37cd`
- #125 — Chat is_edited hech qachon saqlanmagan — `33634a35`
- #116 — Director kunlik daftar surunkali-muammo eskalatsiyasi (1-kunlik edi) — `b546a7f7`
- #126 — Chat @mention FE'da tutiladi, lekin BE'ning har bir bosqichida tashlanadi — `97d8809c`
- #101 — Director owner-summary kunlik digest FE'ga ulandi (BE tayyor edi, iste'molchisi yo'q edi) — `f1caa337`
- #168 — Kanban GanttView.tsx.bak.t2c o'lik orfan fayl o'chirildi — `accb4c5b`
- #105 — Director ZNO/ZVS + rasporyazhenie SLA eskalatsiya (1-bosqichli edi, endi 3-bosqichli) — `35b727f7`
- #85 — IoT camera-AI PPE/xavfsizlik topilmalari camera_alerts UI'ga yetib bormasdi — `0b034f84`
- #106 — Director karta-AI agregatga "vazifa yubor" (Kanban) tugmasi qo'shildi — `91eaaa5b`
- #153 — CC: o'lik GET /api/coordination/baskets so'rovi o'chirildi — `33d140a1`
- #148 — CC: approval eskalatsiya holat belgilaydi, lekin hech kimga xabar bermas edi — `d6da370f`

**Jami bu sessiyada: 23 ta real commit** (xavfsizlik ×1, yangi funksiya ×6, xato tuzatish ×11, o'lik kod tozalash ×3, refaktor ×1, #150/#151/#152/#154 qo'shildi).

⚠️ **2026-08-06: egasi "loop qiling hammasini" dedi** — avvalgi "loop kerak emas" qoidasi shu backlog-grind kontekstida bekor qilindi (memory: `feedback_no_loop.md` yangilandi). `/loop` skill dynamic-pacing rejimida ishga tushirildi — ScheduleWakeup orqali har safar keyingi modul/item ustida davom etadi, egasi "davom" demasdan.

**DIRECTOR moduli yopildi** (#100-#117, 18 band): #100/#101/#104/#105/#106/#113/#116 tuzatildi;
#107/#108/#114 egasi-data; #102/#103/#109-#112/#115/#117 hali tekshirilmagan.

**CC moduli YOPILDI** (#144-156, 13 band): #148/#150/#152/#153/#154 tuzatildi;
#144/#145/#146/#149/#155/#156 egasi-data (ilgari belgilangan); #147 egasi-data deb
qayta tasniflandi (createDraft senderUserId NOT NULL, lekin cc_document_templates'da
"recurring sender/recipient" konsepti umuman yo'q — kim nomidan avto-hujjat
yaratilishi kerakligi aniq emas, egasi qarori kerak).
- #150 — Coordination WorkflowRules tahrirlash UI (PUT endpoint bor edi, FE yo'q edi) — `6e2fea7c`
- #152 — CC webhook idempotency in-memory Map → CacheService (Redis, pod-lararo dedup) — `ffb9e567`
- #151 — CC overdue-reminder 48h/24h hardcode INTERVAL → business_settings CRUD-sozlanadigan — `09582d90`
- #154 — coordination.controller.ts inline SQL (Qoida 6) → repo/service qatlamiga ko'chirildi — `d0f86666`

⚠️ Eslatma (Q-29): 2026-07-11 CC audit hujjatidagi bir nechta "P1 FIX" tavsiyasi (self-route SoD
#21, delegatsiya 3-daraja cap #33, ambiguous_route #3, per-council kvorum override #18,
explicit JwtAuthGuard #33-qism) tekshirilganda ALLAQACHON boshqa to'lqinda qurilgan/eskirgan
bo'lib chiqdi — audit da'vosi ko'r-ko'rona ishonilmadi, jonli kod bilan tasdiqlangach chetlab
o'tildi. Qolgan P2 (EPPageHeader/EPTable/GlobalInboxBadge inline-style) — dizayn-uslub
darajasida, funksional bo'shliq emas, alohida "dizayn-tozalash to'lqini"ga qoldiriladi.

**KANBAN moduli tekshirildi** (#158-169, GanttView #168 ilgari tuzatilgan): 2026-07-11 audit
hujjatidagi P1-FIX tavsiyalarining aksariyati (window.confirm→ConfirmDialog, placeholder-PDF
green-lie, OrderCancelledKanbanHandler dead-listener, `/api/kanban/resource-allocation`
FE→BE drift, WIP-guard fail-open, `drizzle-kanban-ext.repo.ts` 964-qator, `kanban-ext.controller.ts`
barrel-chalkashlik) tekshirilganda ALLAQACHON boshqa to'lqinlarda tuzatilgan bo'lib chiqdi
(Q-29 — jonli kod bilan tasdiqlandi, audit da'vosiga ishonilmadi). Faqat bitta haqiqiy qoldiq
topildi va tuzatildi: o'lik `notImplemented` import (`kanban-reports.controller.ts`, `1ea4fb14`).
Qolgan barcha band SCHEMA/DATA/DECISION — egasi-darvozasida (texnologik-bosqich seed, karta
maydonlari #99-106, karta-markazli topshiruv #108/#132/#137, ShVB shaxsiy-dastur, norma-vaqt,
Telegram CAPEX) — `docs/audit/KANBAN-COMPLETE-FRESH-ANALYSIS-2026-07-11.md` §8 da to'liq ro'yxat.

⚠️ **2026-08-05 davomida egasi aniq buyruq berdi: "workflow qilmasdan bajarish kerak"** — Workflow
tool tarmoq xatolari bilan qayta-qayta qulab tushgani sabab, shu paytdan boshlab barcha keyingi
tekshiruv+tuzatish ISHNI TO'G'RIDAN-TO'G'RI (Read/Grep/Edit/Bash, subagent/Workflow'siz) davom
ettirish kerak.

### Navbatda (buildable-fix, reja mavjud, hali qurilmagan — endi to'g'ridan-to'g'ri amalga oshiriladi):
- #101 (Director owner-summary FE ulanishi), #105 (SLA ko'p-bosqichli eskalatsiya), #113✅(bajarildi), #116 (kundalik surunkali-muammo eskalatsiya), #117 (setup-loss AI trigger)
- #85 (IoT camera-alerts producer + dead-cron tozalash), #118✅/#122✅/#123✅(bajarildi)
- #126 (chat @mention), #164 (kanban karta-markazli tayinlash)
- Fon-rejimda avval ishga tushirilgan (Workflow orqali, endi faqat natija sifatida o'qiladi) batchlar hali ham natija qaytarishi mumkin: Director #101-117 qolgan qismi, IoT #83-91, Chat #125-143 qolgan qismi, Kanban #158-169 qolgan qismi, SD #189-195 qolgan qismi, Marketing #198-207 qolgan qismi, Finance #209-215, AI-Aisha #171-185 — bular kelganda o'qib, to'g'ridan-to'g'ri (Workflow'siz) amalga oshiriladi. **CC #144-156 YOPILDI** (yuqorida).
- **Kanban #158-169 YOPILDI** (yuqorida).

**CHAT moduli: 2026-07-10 audit (CHAT-COMPLETE-FRESH-ANALYSIS-2026-07-10-v1.md) qayta
tekshirildi.** ⭐ Eng katta xavotir — §0 "ENG KRITIK TOPILMA" (WS auth-drift: FE cookie
uzatadi, gateway faqat auth.token o'qiydi → chat real-time UMUMAN ishlamaydi + zaif
ulanishda xabar yo'qoladi) — Q-29 tekshiruvida BARCHASI ALLAQACHON boshqa to'lqinda
tuzatilgan bo'lib chiqdi: gateway endi cookie'dan ham o'qiydi (`chat.gateway.ts:88`),
reconnect cheksiz-exponential-backoff + reconnect-catch-up + optimistik-yuborish +
client_msg_id barchasi tasdiqlandi (`ChatSocketProvider.tsx`). #125 (is_edited) va #126
(@mention) ham ilgari shu sessiyada tuzatilgan edi. Qolgan tavsiyalarni tekshirishda
5 ta HAQIQIY, hali ochiq topilma aniqlandi va tuzatildi:
- **#11 (xavfsizlik, IDOR)** — chat fayl-biriktirmalar xona-a'zolik tekshiruvisiz, istalgan
  autentifikatsiyalangan foydalanuvchi istalgan xonaning faylini ochishi mumkin edi —
  `chat_members` tekshiruvi qo'shildi (`storage.controller.ts`) — `763869e7`
- **#12 (xavfsizlik)** — `updateRoom` (nom/avatar) istalgan a'zoga ochiq edi, endi faqat
  ADMIN roliga cheklangan — `50cec774`
- **#8** — fayl-yuklash orqali yuborilgan xabar WS event-nomi drift sabab real-time
  yetib bormasdi (`message:new` vs FE `new_message`) — `435c9ecb`
- **#17** — `/chat/admin` (ChatAdminPage, admin/director moderatsiya paneli) App.tsx
  route-shadow sabab HECH QACHON ishga tushmasdi — `77f98899`
- **#18** — o'lik `ChatAdvancedController` (`hr-v2/chat`, ro'yxatsiz, to'liq funksional
  dublikat) o'chirildi — `9b3cf05f`

Qolgan P1/P2 (#9 REST-send broadcast, #10 delete-siyosati, #13 presence-TTL, #14-16
push/FCM, #19-23 orphan-tozalash/FTS/kanal-semantika, #24-32 P2-dizayn/modernizatsiya) —
aksariyati SCHEMA/DATA/DECISION yoki past-ustuvorlik P2; keyingi to'lqinga qoldiriladi.

**AI-AISHA moduli (#171-185): dedikatsiyalangan audit hujjat yo'q edi (2026-07-11
to'lqiniga kirmagan) — to'g'ridan-to'g'ri kod-sharh orqali tekshirildi.** Modul umuman
kutilganidan ancha yaxshi holatda: honest-degraded chat javoblari (API kalit yo'q bo'lsa
soxta-muvaffaqiyat emas, aniq "sozlanmagan" xabar), barcha 4 controller guard-langan,
role-gated tool'lar (get_employee_info/get_financial_summary) haqiqatan tekshiradi
(hasAishaRole), yuqori-xatarli tool'lar (send_email/telegram/schedule_meeting/assign_task)
haqiqatan HITL-pauza qiladi (auto-execute qilmaydi). ⭐ **Faqat bitta, lekin katta bo'shliq
topildi**: shu HITL tasdiqlash mexanizmining butun frontend qismi — backend to'liq tayyor
(GET/POST /aisha/approvals/*, real ijro-qaytarish) edi, lekin Zod schema
`pendingApprovals`ni jimgina tashlab yuborardi, hook uni o'qimasdi, panelda tasdiqlash UI
umuman yo'q edi (mavjud-u ishlatilmagan `approval.*` i18n kalitlari buni tasdiqlaydi —
kimdir rejalashtirgan, hech kim ulamagan). To'liq ulandi: `c99fe584` (schema+hook+UI, FE-only,
BE'ga tegilmadi). Lokal backend Q-44 crash sabab qayta ko'tarildi (natija: BE typecheck ham
0-xato); admin-parol yo'qligi sabab jonli-login-UI-tekshiruv qilinmadi — Q-32 static
fallback (typecheck ikkala tomon + BE-kontrakt maydon-ma'ydon moslik + DB-jadval mavjudligi).
Qolgan #171-185 orasidagi boshqa itemlar keyingi to'lqinda davom ettiriladi (bu modulda
alohida audit hujjat yo'qligi sabab qolган band-sonini aniq bilib bo'lmaydi — TaskList
manba yo'qolgan).

**SD/CRM moduli: 2026-07-10 audit (SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3.md) qayta
tekshirildi.** ⭐⭐ **Eng katta topilma bu sessiyada**: §3.2 P0 — `RolesGuard`da `'manager'`
↔ `'sales_manager'` aliasi yo'q (aynan-moslik), lekin jonli `users` jadvalida
`role='sales_manager'` qatori 0 (barcha real menejerlar `'manager'`). Audit vaqtida
(2026-07-10) bu 27/32 foydalanuvchiga 403 bergan (amalda modul 4 kishiga — super_admin+
director — ochiq edi). To'liq kompaniya-reset (2026-07-11)dan keyin `users`=3 qator bo'lsa
ham, **struktura bug hali tirik edi** — egasi CRUD orqali real menejer qo'shishi bilanoq
qayta portlaydi. Tekshiruv: 28 ta SD+CRM controller `sales_manager` talab qiladi, shundan
faqat 3 tasi (`sd-payments`/`sd-contracts`/`sd-orders`, oldingi to'lqinda) `'manager'`
qo'shilgan edi — **qolgan 25 tasi hali buzuq edi**. Barchasi bir xil tasdiqlangan naqsh
bilan tuzatildi (`'manager'` qo'shildi, RolesGuard'ning o'ziga tegilmadi — Q-34 tor-fix):
`9fabdacb`. `sd-invoices.controller.ts`da alohida lokal `Role={...}` soxta-enum topildi
(umumiy `roles.constants.ts`dan emas) — shu faylga ham `MANAGER` qo'shildi.

Boshqa audit topilmalari (§2 fake-save/bloklangan CREATE, §3.6 IDOR ro'yxati, §4 orphan
sweep, §5 uzilgan integratsiya zanjirlari) hali tekshirilmagan — keyingi to'lqinga
qoldiriladi (bu audit juda katta, 583+ qator).

**MARKETING moduli: 2026-07-10 audit (MARKETING-COMPLETE-FRESH-ANALYSIS-2026-07-10-v1.md)
tekshirildi.** ⭐ Xuddi shu §3.2 P0 sinfi, **SD/CRM'dan ham og'irroq**: 74/117 endpoint
`marketing_manager` (0 real foydalanuvchi) talab qilardi, 27 real `'manager'`dan atigi
43/117 ochiq edi. ⭐ Qo'shimcha topilma (§3.3): FE `useAuth.tsx` o'zining `ROLE_ALIASES`
orqali `'manager'`ni FE tomonida `'director'`ga aylantirar edi (izohda "backend bilan bir
xil" deb yozilgan, lekin backendda alias UMUMAN yo'q edi) — shuning uchun sahifa ochilib,
keyin ko'p chaqiruv 403 bilan qulardi (chalkash holat). 6 controllerda 69 qatorga
`'manager'` qo'shildi: `5f26a02b`. `nps-requests.controller.ts` allaqachon to'g'ri edi.

⚠️ Repo-keng tekshirdim: boshqa ~40 rol-satr (`accountant`/`hr_manager`/`warehouse_manager`
va h.k.) hozir barchasi "0 real foydalanuvchi" — lekin bu FULL-COMPANY-RESET (2026-07-11)
natijasi, alias-drift EMAS (egasi hali CRUD orqali bu rollarni real xodimlarga
biriktirmagan). SD/CRM+Marketing holatlari alohida edi, chunki ular dedikatsiyalangan
audit bilan DB-isbotlangan edi. Boshqa modullar uchun shu sinf muammoni "bashorat qilib"
tuzatish shart emas — har modul o'z navbatida audit-tasdiqlanganda ko'riladi.

**FINANCE moduli (#209-215): dedikatsiyalangan "COMPLETE-FRESH-ANALYSIS" audit yo'q**
(pul-modul — SD/CRM/Marketing bilan bir xil "manager alias" fixni DB-isbotsiz bashorat
qilib qo'llash xavfli, Q-34: pul-huquqlarni asossiz kengaytirish = xavfsizlik regressiyasi
bo'lishi mumkin). To'g'ridan-to'g'ri kod-sharh: barcha controller guard-langan, green-lie
yo'q, "as unknown" stub yo'q, payroll INPS/JSHD haqiqiy hisob-kitob (#FX-1 resolved,
faqat tax-calendar/salary-benchmark honest-501, Q-17 mos). Faqat bitta o'lik
`notImplemented` import topildi va o'chirildi (`reports.controller.ts`) — `b4dd38ce`.

**HR-ORG moduli tekshirildi** (`docs/audit/HR-ORG-VIZYON-VA-CHALA-ISHLAR-2026-07-13.md`).
§7 (2026-05-28 sahifa-darajali chuqur audit, 17 sahifa jadval) dan **7 ta eng jiddiy
da'vo** tekshirildi — **barchasi ALLAQACHON tuzatilgan** (Q-29): HR Xarita lat/lng SELECT
(bor), Goals PATCH+delete-role-gate (bor), Smena-almashish approve/reject action-branch
(bor), Skills-matrix fake-endpoint (yo'q, real), Referral contract-drift (2026-07-13
kunidayoq tuzatilgan, izohlar bilan tasdiqlangan), 3 compat-controller `@Roles()`siz
xavfsizlik teshigi (hammasida `@Roles` bor). ⭐ Bu 2026-05-28 jadval umuman eskirgan —
keyingi remediatsiya to'lqinida yopilgan, lekin audit-hujjat o'zi yangilanmagan.
§4.9 "shartnoma-blok butun ERP'ni bloklaydi" da'vosi tasdiqlanmadi/rad etilmadi —
aniq mexanizm topilmadi (faqat alohida `AbsenceBlockCron` — 3-kunlik yo'qlik → butun
akkaunt o'chirish — topildi, bu boshqa, o'z-o'zidan mantiqan to'g'ri mexanizm).
Qolgan asosiy §2/§4 topilmalar (head_user_id/manager_id zanjiri, ЦКП DATA, razryad DATA,
karta oylik-cap DATA) — barchasi DATA/SCHEMA, egasi-darvozasida (memory:
"org+users seed" — ko'p modulning umumiy bloklovchisi, faqat HR-Org'ga xos emas).

**MES moduli tekshirildi** (dedikatsiyalangan fresh-analysis yo'q; `MES-IOT-DEEP-DIVE-2026-07-04.md`
+ kod-sharh). `mes_telemetry` — REAL kod, 0 qator (hardware-gated, hujjat o'zi "do not act"
deydi). Rol-gate tekshirildi: MES `production_manager`/`operator`/`technologist`/
`shift_supervisor` talab qiladi — SD/CRM/Marketing'dagi kabi "manager" bilan bir xil emas
(bu rollarning HECH biri hali real xodimga biriktirilmagan, "27 real user bloklangan"
holati yo'q — bashorat qilib "manager" qo'shish noto'g'ri bo'lardi). Eski `MASSIV-50/P17`
direktivasi (session→WMS material-deduction listener) fayl darajasida bajarilmagan
ko'rindi, lekin funksiya allaqachon BOSHQA, ancha puxtaroq mexanizm bilan qoplangan:
`material_kits` 2-imzoli WMS-chiqim gate (start-session.handler.ts) + idempotent
`mes-completed-fg.listener.ts` (FG-kirim, EP-WMS-034/023, rollback-tx DB-isbotlangan).
Green-lie/stub/guard muammosi topilmadi — **kod o'zgarishi kerak emas edi**.

**QC moduli tekshirildi**: 2 ta o'lik `notImplemented` import o'chirildi (`442d6bd4`).
Memory'dagi "M6 2/4 gap — QC 0.05 hardcoded" (2026-07-07) tekshirildi — **ALLAQACHON
tuzatilgan**: `qc-extended.service.ts:77` endi `getConfigNumber('qc_lot_defect_fail_ratio',
...)` orqali business_settings'dan o'qiydi, faqat fallback-const sifatida 0.05 qoladi
(to'g'ri naqsh). "quarantine hardcode" izlanganda QC modulida emas, POS/MM modullarida
topildi — QC doirasidan tashqarida, keyingi to'lqinga (POS/MM navbati kelganda) qoldirildi.
Guard/green-lie/stub muammosi boshqa topilmadi.

**LMS moduli tekshirildi**: 2 ta o'lik `notImplemented` import o'chirildi (`3405c39e`).
⭐ Bu naqsh (Kanban→Finance→QC→LMS, jami 7 ta fayl) shu qadar izchil chiqdiki, **butun
backend bo'yicha repo-keng qidiruv** o'tkazildi: yana **15 ta** fayl topildi (compatibility,
design, finance, hr, iot×4, kanban, mm, pp, remaining, wms×2) — hammasi tuzatildi
(`2cfeb8c2`). Jami bu sessiyada o'lik `notImplemented` import: **22 ta fayl**.
⭐ Qo'shimcha bonus-topilma: 3 ta fayl (`europrint-control-director.controller.ts`,
`material-balance.controller.ts`, `finance-extended-payroll.controller.ts`) hali "501
qaytaradi, hali ulanmagan" deb yozilgan edi, lekin metod tanasi ALLAQACHON haqiqiy DB-so'rov
bilan almashtirilgan — eskirgan/chalg'ituvchi izohlar to'g'irlandi (Q-40 ruhida: kod nima
qilishini aniq hujjatlash, aks holda keyingi agent/dasturchi "hali stub" deb noto'g'ri
xulosa chiqarishi mumkin edi — aynan shu xato meni ilgari Finance to'lqinida chalg'itgan edi).

**PP moduli tekshirildi**: stub/green-lie/guard sweep toza chiqdi. Bitta yolg'on-signal
topildi va rad etildi (Q-29): `gofra-conversion.controller.ts`da explicit `@UseGuards` yo'q
— lekin bu ATAYLAB (izoh: "JwtAuthGuard+RolesGuard global APP_GUARD orqali"), yozuvchi
endpointlar (`PUT flute-types`, `PATCH config`) `@Roles(SUPER_ADMIN,DIRECTOR,TECHNOLOGIST)`
bilan to'g'ri gate-langan, faqat o'qish/hisoblash endpointlari ochiq — bu CLAUDE.md'ning
o'z `reviewer-jwt-guard.sh` skripti (✅ PASS) bilan mos, xato emas.

⭐ **Original 18-modulli 215-band to'lqinning "asosiy" ro'yxati tugadi**: CC✅ Kanban✅
Chat✅(qisman) AI-Aisha✅(qisman) SD✅(qisman) Marketing✅(qisman) Finance✅ HR-Org✅
MES✅ QC✅ LMS✅ PP✅ — 12/18 modul shu sessiyada to'g'ridan-to'g'ri tekshirildi.
**Tekshirilmagan qoldi**: WMS(8), IoT(9, faqat #85 ilgari), POS(8), Director(18, qisman —
#100/101/104/105/106/113/116 bajarilgan, #102/103/109-112/115/117 hali yo'q), Admin(7),
Notifications(0, bo'sh modul).

**WMS moduli tekshirildi**: standart sweep toza. ⭐ `WMS-POS-FULL-AUDIT-2026-07-05.md`
"Top 5" ro'yxatidan #2 (ombor-nomi uniqueness-guard) ALLAQACHON tuzatilgan edi (3/3 fayl).
#4 (WMS `deleted_at IS NULL`-only vs POS `is_active=true`-only predikat nomuvofiqligi) —
HALI OCHIQ edi va tuzatildi: `993c5175`. ⭐ Bonus: `get-warehouses.handler.ts`da copy-paste
xato topildi (`isActive` filtri `isFreeStorage` ustuniga solishtirilardi) — tuzatildi.
Bugun 19/19 ombor'da nomuvofiqlik ko'rinmaydi (barchasi is_active=true), lekin audit
tavsiya qilgan "22 dublikat DEPT-* omborni is_active=false qilish" amalidan keyin darhol
ko'rinar edi — proaktiv tuzatildi. #1 (org_departments 145→119 dedup) va #3/#5 (warehouse_types
reconciliation, MM quarantine-gate) — DATA/arxitektura, "Awaiting owner decision" (audit
o'zi shunday deydi), 'manager'-alias SD/CRM/Marketing bugidan farqli — DB-isbot yo'q
(faqat bitta 'manager' foydalanuvchi bor, warehouse-maxsus rollar hali bo'sh), bashorat
qilib tuzatilmadi.

**IoT moduli tekshirildi** (`IOT-TABLET-PAGE-DEEP-DIVE-2026-07-04.md`, 2026-07-04, o'ta
puxta live-probe audit). ⭐⭐ Audit'ning "THE blocker" P0'si — ~10 marshrut (`tablet/shift`,
`tablet/sessions`, `production-sessions*`, `downtime-events`, `handover`, `inline-qc`)
`JwtAuthGuard+@Roles(IOT_READ)` talab qilardi, lekin tablet FAQAT `x-tablet-token`
yuboradi → butun ishlab-chiqarish oqimi (start→scan→run→defect→QC→stop→handover) 401
edi — **ALLAQACHON tuzatilgan** (barcha marshrut `@Public()+TabletTokenGuard`ga
o'tkazilgan). Lekin audit "item 3: FE green-lie" hali OCHIQ edi — topildi va tuzatildi
FE+BE ikkalasida ham (`0f303945`): FE `scanMaterial` xatoni yutar edi (`res.ok`
tekshirmasdi, `fetch` HTTP-xatoda reject qilmaydi); BE `persistKitItemScan`
`UPDATE...RETURNING` natijasini faqat `batchId` berilganda tekshirardi — mavjud
bo'lmagan id bilan skanlash har doim `{scanned:true}` qaytarardi (rollback-tx bilan
DB-isbotlangan: 0 qator ta'sirlansa ham). Bu — shu sessiyaning eng chuqur ikki-qatlamli
(FE+BE) green-lie topilmasi.

**Navbatdagi modul: POS (#taxminan 8 band, hali tegilmagan)** — to'g'ridan-to'g'ri davom etiladi.
