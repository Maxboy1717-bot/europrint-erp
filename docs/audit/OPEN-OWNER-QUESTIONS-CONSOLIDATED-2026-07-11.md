# OCHIQ EGA-SAVOLLARI — KONSOLIDATSIYA (2026-07-11)

> **Maqsad:** Bugungi sessiyada egasi `SAVOLLAR-VA-MUAMMOLAR-2026-07-11.md` dagi **277 dataGated**
> itemga javob berdi (manba: [[QARORLAR-JURNALI-2026-07-11]] + [[OWNER-JAVOBLAR-2026-07-11]]).
> Bu — loyihaning OCHIQ savollarining faqat BITTA bo'lagi edi. Ushbu fayl loyiha bo'ylab
> qolgan HAMMA boshqa ochiq ega-savol manbalarini bir joyga yig'adi, sessiyalar orasida
> hech narsa yo'qolmasin.
>
> **Rol:** faqat tekshiruv+sintez (read-only). Hech narsa o'zgartirilmadi. Hech qanday savol
> yoki ma'lumot to'qib chiqarilmagan — manba noaniq bo'lsa, shundayligi aniq aytilgan.
> **Bu faylni egasi keyingi sessiyada javoblaydi — Claude bu savollarga javob bermaydi.**

---

## 0. Metodologiya va dedup asosi

- **Dedup asosi (bugun javoblangan 277):** [[QARORLAR-JURNALI-2026-07-11]] + [[OWNER-JAVOBLAR-2026-07-11]].
  Bu ikki fayl birgalikda 277 dataGated itemni yopdi va **5 ta GLOBAL QOIDA** o'rnatdi, ular butun
  kategoriyalarni **individual javobsiz** eritib yuboradi:
  1. **CRUD-qoidasi** — har threshold/norma/%/kun/summa → `business_settings` CRUD ekran, hardcode YO'Q.
  2. **Org-lookup qoidasi** — "qaysi rol/bo'lim X" savollari Org `head_user_id` to'ldirilgach avto hal.
  3. **Taksonomiya seed** — 96 `taxonomy_entries` seed qilindi (mahsulot turlari + 15 boshqa; `de4004d8`/`6d27e557`).
  4. **Q-35 schema-approval BERILDI** — yangi jadval/ustun struktura endi ruxsat etilgan ([[SCHEMA-APPROVAL-2026-07-11]]).
  5. **Kredensiallar kechiktirildi** — Telegram-per-modul, SMS, kamera CAPEX, 1C → alohida sessiyalar.
- **Tekshirilgan manbalar (Step 1 inventarizatsiyasi — pastda §0.1).**
- **Raqamlar to'qilmagan:** master-plan raqamlari ripgrep bilan olingan; boshqa itemlar aniq `fayl:satr` bilan.

### 0.1 — Topilgan ochiq-savol manbalari (to'liq inventar)

| # | Manba | Nima | Holat |
|---|---|---|---|
| S1 | `VISION-3340-RETRIAGE-2026-07-07.md` | **41 owner-data + 82 owner-decision = 123** (SB-id raqamlash) + 65 fixable-now (kod) + 6 schema | 65 kod + 6 schema BAJARILDI (07-08); 123 ega-item ochiq (mavzuli) |
| S2 | `FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md` | 2,563 item; **647 haqiqiy owner-gated** ("~1,164" da'vosi 543 ta "Owner-gated — none" bullet bilan shishirilgan) | **205 javoblangan; 442 ochiq** (ripgrep) |
| S3 | `REMAINING-WORK-2026-07-07.md` | **15 aniq arxitektura/qaror savoli** (G5/G9/G10, F1/F3, F7, B5, ЦКП deadline, EOQ...) | ochiq |
| S4 | `_loop-open-questions-2026-07-11.md` | Dizayn-tizim + build-loop ochiq itemlari (ModulePage, modal, EPTable, MES#68/WMS#32 routing) | ochiq |
| S5 | `GURUH-B-OWNER-QUEUE-2026-07-09.md` | Vision-build-loop Guruh-B (14 modul); ko'pi Batch-5da ✅ BAJARILDI; qolgani ochiq | qisman ochiq |
| S6 | `SCHEMA-APPROVAL-2026-07-11.md` | Q-35 umumiy ruxsat BERILDI (369 schema-item struktura ochildi); DATA hali gated | schema yopiq, DATA ochiq |
| S7 | `SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3.md` | 34 tavsiya; 4 ega-qaror (SD-1..SD-4) + 1 chegara | qisman ochiq (3 net-new) |
| S8 | `MARKETING-COMPLETE-FRESH-ANALYSIS-2026-07-10-v1.md` | **TO'LIQ BAJARILGAN audit** (stub emas): 99-item vizyon-solishtirish + 34 tavsiya; 6 ega-item (MKT-1..MKT-6) | qisman ochiq (2 net-new) |
| S9 | `OMBOR-POS-MONITOR-TOLIQ-TAHLIL-2026-07-10.md` + `DUBLIKAT-SAHIFALAR-TAHLILI-2026-07-10.md` | **9 "qaysi kanonik" arxitektura-qarori** (endpoint oilalari, MRP/equipment backendlar, `/warehouse/hub`) | net-new, ochiq |
| S10 | `CARD-ATTRIBUTES-REQUEST.md` | 93-lavozim × (razryad/rbac_tier/oylik/otdeleniye) BO'SH varaq — eng katta leverage | ochiq (blocked-org artefakti) |
| S11 | `WMS-POS-FULL-AUDIT`, `TWO-WORLDS-FULL-AUDIT`, `MAGIC-NUMBERS-*`, `I18N-FULL-AUDIT`, `DESIGN-QA-FULL-AUDIT`, `FINANCE-FULL-AUDIT`, `ACCOUNTING-STANDARDS-AUDIT` | Tekshirildi — **yangi ega-savol yo'q**: hammasi kod-fix yoki DATA allaqachon 277 GL/org bloklarida | ega-savol yo'q |

---

## 1. HAQIQIY OCHIQ ITEM SONI (real raqam, taxmin emas)

- **442** — master-plan (`S2`) da individual javoblanMAGAN owner-gated item (647 haqiqiy − 205 javoblangan).
  Bu — ripgrep bilan olingan **xom** raqam.
- ⚠️ **MUHIM nuance:** master-plan `S2` bugungi 5 global qoidadan OLDIN yozilgan. 442 ning **katta
  ko'pchiligi** threshold/interval/timeout/norma/%/taksonomiya/rol itemlari — ular bugungi
  **CRUD-qoidasi / Org-lookup qoidasi / taksonomiya-seed** bilan **yangi javobsiz** yopiladi
  (masalan master-plan hamon "owner-gated" deb belgilagan M18-item5 "resend interval", M15-A3
  "48h threshold", M06-item5 "re-approval threshold" — bularning hammasi CRUD-qoidasida yopiq).
  442 ning aynan nechtasi sof-CRUD ekanini har satrni qayta o'qimasdan aniq sanab bo'lmaydi
  (to'qib chiqarmaslik uchun taxminiy sub-son bermadim) — lekin namunaviy satrlar + modul-tabiat
  bo'yicha bu **dominant ulush**.
- ✅ **AKTUAL, individual-javob talab qiladigan DISTINCT ochiq qarorlar — quyida §3da 61 ta aniq
  itemga jamlangan** (har biri `fayl:satr` manbali). Bu 61 — global qoidalar bilan
  avto-yopilMAYDIGAN, egasidan yangi qaror/ma'lumot talab qiladigan haqiqiy ro'yxat.
- 🔴 **Butunlay tegilmagan workstream:** **Modul 17 (AI/Aisha)** — 21 owner-gated, **0** javoblangan
  (`S2`). 277 unga umuman tegmagan. Batafsil §4.

**Xulosa:** xom master-plan qoldig'i = **442**; global qoidalar avtomatik yopadigan (CRUD/org/taksonomiya)
dominant ulushdan keyin, egasidan **yangi** qaror talab qiladigan aniq ro'yxat = **61 distinct item** (§3).

---

## 2. Reyting — bitta javob nechta downstream itemni ochadi (leverage)

(Bugungi 30-mashina ro'yxati / Org-struktura uslubidagi "head_user_id-leverage" metodi.)

| Reyting | Bitta javob | Ochadigan downstream | Guruh |
|---|---|---|---|
| ⭐⭐⭐ #1 | **Org `head_user_id` + `CARD-ATTRIBUTES-REQUEST` 93-lavozim varag'i** | BLOCKED-52 + barcha rol/scoping itemlari + Finance-SoD + ЦКП/LMS oylik-gate + 205+ | §3.J (Blocked) |
| ⭐⭐⭐ #2 | **Org-kanonizatsiya: qaysi BITTA karta jadval (G10) + bitta-ildiz daraxt (G9) + "93 test-karta" aniqligi** | 3 parallel org-olamni yopadi; #1 ning old sharti | §3.G / §3.J |
| ⭐⭐ #3 | **30-mashina ro'yxati (Excel)** — `equipment` ga | ~20 MES/IoT item (norma, OEE-target, kVt, tsex) | §3.F |
| ⭐⭐ #4 | **Rol-satri drifti tuzatish yo'li** (`manager`→`sales_manager` / alias / ROLE_ALIASES) | SD+CRM+Marketing 403 (27/32 foydalanuvchi, 198+74 endpoint) | §3.C |
| ⭐⭐ #5 | **AI-governance ta'rifi + `camera_ai_configs` to'ldirish** (Modul 17) | 21 ta tegilmagan AI item | §4 / §3.G |
| ⭐ #6 | **9 "qaysi kanonik" endpoint/backend qarori** (ombor/MRP/equipment) | dublikat-sahifa tozalash + data-integrity | §3.G |
| ⭐ #7 | **Kanban SD-status → ustun xaritasi** (mapping qatorlari) | Kanban avto-move (mexanizm inert tayyor) | §3.B |

---

## 3. Guruhlangan + reytinglangan ochiq itemlar (bugungi sessiya metodi)

> Kategoriyalar bugungi sessiya bilan bir xil. Har guruh ichida leverage bo'yicha tartib.

### 3.A — CRUD-only threshold/policy qiymatlari → GLOBAL CRUD-QOIDASIDA AVTO-YOPIQ
**Individual ro'yxat qilinmaydi (bugungi qoida).** 442 master-plan qoldig'ining **dominant ulushi**
shu yerda: threshold/interval/timeout/norma/%/summa itemlari (masalan M18 resend-interval,
M15 48h-eskalatsiya, M06 re-approval %, WMS zona-%, QC AQL, escalation daqiqalari). Shuningdek
`S1` owner-decision "Type C — business rule/threshold" ostidagi itemlar.
**Yopilgan usul:** egasi qiymatni `business_settings` CRUD ekranidan kiritadi — yangi savol yo'q.
⚠️ Aniq integer sub-son hisoblanmadi (har 442 satrni qayta o'qish kerak; to'qilmadi) — lekin bu
**eng katta guruh**.

**Chegara (CRUD emas, aniq POLICY tanlovi — quyida ro'yxatda qoldi):**
1. **WMS#120 "ko'r-sanoq" (blind count) siyosati** — opt-in per-sessiya / hamma tsikl-sanoq uchun majburiy /
   faqat A-segment material? Mexanizm jonli tayyor, faqat siyosat tanlovi. *(`_loop-open-questions:57-60`)*
2. **M9 EOQ sxemasi** — flat (150k/0.20) yoki ABC-yarusli (50k, 0.20-0.25-0.30)? Ikkisi ham tunable,
   metodologiya nomi noaniq. *(`REMAINING-WORK:152`)*
3. **ЦКП deadline langari — 16:00 Toshkent yoki 21:00 (hozirgi UTC)?** Jonli oylik-gate qoidasi. *(`REMAINING-WORK:147`, `S1` SB0800)*

### 3.B — Taksonomiya / ro'yxat mazmuni kerak
**Asosan BUGUN SEED QILINDI** (96 entry). Qolgan residual:
4. **Kanban SD-status → Kanban-ustun xaritasi** — egasi mapping qatorlarini beradi
   (`confirmed→Jarayonda`, `cancelled→Bekor` ...). Mexanizm inert tayyor. *(`GURUH-B:26,60`)*
5. **Bo'sh starter-kategoriyalar** (egasi ERP CRUD orqali to'ldiradi, savol emas): packaging (07-pp#120),
   lavozim-vositalari (05-director#102), operation_type/direction_type kengaytmasi. *(`QARORLAR:116`)*

### 3.C — Rol/mas'ul (asosan Org to'ldirilgach hal — alohida so'ralmaydi)
**Bitta NET-NEW item (org-fill emas, tuzatish-yo'li tanlovi):**
6. **Rol-satri drifti** — `users.role='manager'` (27/32 foydalanuvchi) ↔ BE `@Roles('sales_manager')`
   (0 foydalanuvchi) → SD 198/257 + Marketing 74/117 endpointda 403. Tanlov: (a) `users.role`
   migratsiya, (b) `@Roles`ga `'manager'` qo'shish, (c) haqiqiy `ROLE_ALIASES` backend qurish?
   *(`SD-CRM...v3:965`, `MARKETING...v1:765`)* — SD+CRM+Marketing uchun **bitta qaror**.
7. **`employees.role` to'ldirish** (31/31 NULL) — round-robin sales_manager topolmaydi; kim savdo-menejer?
   *(`SD-CRM...v3:966`)* — Org-fill bilan bog'liq.
> Qolgan barcha rol/mas'ul itemlari `head_user_id` bilan avto (§3.J).

### 3.D — Hujjat / shablon MATNLARI kerak
8. **Приказ shabloni** (01-org#37) — O'zbekiston mehnat qonuni standart shablon; Claude tayyorlaydi,
   egasi tasdiqlaydi. *(`QARORLAR:119`)*
9. **NDA yuridik matn** (12-lms#74) — tashqi yurist bilan. *(`QARORLAR:120`)*
> CC hujjat-matnlari asosan "asosiy maydon + CRUD kengaytirish" bilan yopilgan (`QARORLAR:102`).

### 3.E — Kredensial / integratsiya / CAPEX
10. **Marketing AI-provayder kaliti** — content/SEO/social/blog generatsiya hozir `ai_provider:'pending'`
    (3 green-lie); SEO tab 100% hardcoded. Umumiy AI-CAPEXdan alohida aniq kalit. *(`MARKETING...v1:767,712`)*
> Quyidagilar 277da tan olingan (alohida sessiyalar): Telegram-per-modul, SMS (Eskiz/Play + AI-qo'ng'iroq),
> kamera-AI CAPEX, 1C (ERP→1C moliyaviy uzatish), IP-PBX, yig'ilish-kamerasi. *(`QARORLAR:95-100`)*

### 3.F — Jismoniy / tarixiy real-dunyo ma'lumoti
11. **30-mashina ro'yxati** (nom/tur/quvvat/kVt) → `equipment` — Excel keladi, ~20 item ochadi. *(bugun: qisman javob)*
12. **OEE-target raqamlari** (mashina/tsex bo'yicha) — `oee_targets` jadvaliga; hardcoded 85 o'rniga. *(`_loop-open-questions:22`)*
13. **Razryad koeffitsientlari + base_salary** (per-lavozim) — `CARD-ATTRIBUTES-REQUEST` varag'i. *(`S10`)*
14. **MES `shifts` seed** (per-bo'lim smena: ertalab/kunduzi/tun) + shift-id manbasi (FE yoki BE-resolve). *(`GURUH-B:73-75`)*
15. **`camera_ai_configs` to'ldirish** (0 qator) — qaysi kamera/VLM confidence-shartnoma. *(`S2` M17 Item 8)*
16. **Boshlang'ich ombor qoldig'i + ochilish balanslari** — direktor tasdig'i bilan bir-martalik. *(`QARORLAR:92`)*
> Bular CRUD-ekran + Org tayyor bo'lgach data-entry (bir-martalik), texnolog/buxgalter bilan.

### 3.G — Arxitektura / egalik qarorlari (ENG KATTA net-new guruh)
**"Qaysi kanonik" endpoint/backend tanlovlari (`S9`, 07-10 Ombor/Dublikat auditlari):**
17. Kanonik **material-katalog** endpoint oilasi? (5 mavjud) *(`OMBOR...:397`)*
18. Kanonik **stock-read** endpoint oilasi? (6 mavjud) *(`OMBOR...:398`)*
19. Qaysi **inventory-count** endpoint qoladi? (`/warehouse/...` vs `/wms/...`) *(`OMBOR...:399`)*
20. Legacy **`PosMonitorPage`** (892 qator) yangi Kirim/Chiqim oqimiga almashtirilsinmi? *(`OMBOR...:400`)*
21. Kanonik **Material-360** sahifa? (2 mavjud) *(`OMBOR...:401`)*
22. **`/warehouse/hub`** yaratilsinmi? (CLAUDE.md Qoida 22 "kanonik" deydi, kodda YO'Q → 404) *(`OMBOR...:402` / `DUBLIKAT...:119-123`)*
23. **`RulonCards` vs `RollManagementPage`** — bir feature'mi (birlashtirish) yoki alohida? *(`DUBLIKAT...:1310`)*
24. Ikki jonli **MRP backend** (`/pp/mrp/run` vs `/erp/mrp-runs`) — qaysi kanonik? *(`DUBLIKAT...:54`)*
25. **3 equipment / 2 machine-status backend** (bitta jismoniy mashina) — birlashsinmi? *(`DUBLIKAT...:56`)*

**Boshqa modullardan net-new arxitektura:**
26. **`marketing_budget_items`(0) vs `marketing_budget_lines`(12)** — qaysi kanonik byudjet jadval? *(`MARKETING...v1:766`)*
27. **`marketing_campaigns.id`** — varchar slug qoladimi yoki integer? (`marketing_ads.campaign_id` int, join uzilgan) *(`MARKETING...v1:768`)*
28. **~7010 qator o'lik FE** — o'chirilsinmi yoki 4 "qimmatli orphan" (CrmFunnelAnalytics/CrmRfmClusters/SDDebitors/SDDeliveries) ulansinmi? (Q-46 look-before-delete) *(`SD-CRM...v3:992`)*
29. **CRM kanonik egalik ustuni** — `assigned_to`(bo'sh) vs `assigned_by_id`(to'lgan)? + qaysi rollar hammani/o'zinikini ko'radi (satr-scoping)? *(`GURUH-B:76-83`)*
30. **SD entitilar bo'ylab scoping siyosati** — menejer faqat o'zinikini ko'radimi yoki hamma hammani? (277 faqat mijoz-kartasi uchun javob berdi) *(`SD-CRM...v3:990`)*
31. **SD delivery → WMS stock-out otish nuqtasi** (in_transit / delivered / create) + POS `EXTERNAL_OUT` kanonik mahsulot-chiqim'mi? *(`GURUH-B:19,84-90`)*
32. **Director bo'lim-join olami** — `departments` (HR) yoki `org_departments` (org)? *(`GURUH-B:34`)*
33. **#9 root-cause kanonik modeli** — 5-why (why1-5/entity_*) yoki flat (code/name/category)? + seed. *(`GURUH-B:128`)*
34. **Karta-ruxsat tizimini yoqish** — `CARD_PERMISSION_SOURCE_READY=false`; position-id (1-92) ↔ card-id (19-173) raqam-to'qnashuvi; `card_permissions` jadval yo'q. *(`S1` cross-cutting #1)*
35. **Multi-tenancy yoyilishi** — `TenantFilterGuard` qurilgan lekin hech qayerda ro'yxatdan o'tmagan; `users`da `tenant_id` yo'q. *(`S1` cross-cutting #4)*
36. **SD/MES status-lug'ati kelishuvi** — jonli 15-holatli mashina vs schema 23-holatli `master_status` (100% NULL). *(`S1` SB0587/620)*
37. **Dormant-jadval qarorlari (qur-yoki-tashla):** `ai_ckp_scores`, `company_tskp` orphan, `units` orphan,
    multi-master materiallar (`mm_materials`/`raw_materials`/`materials`/`products` vs kanonik `material_cards` — "EGASI QARORI KERAK"). *(`S1` SB0019/0052/0761/0733)*
38. **Payment 3-jadval birlashtirish** — `finance_payments`/`payments`/`sd_payments` → bitta + FK? *(`REMAINING-WORK:140`)*

**Dizayn-tizim qarorlari:**
39. **`ModulePage` konvergensiyasi** — 45 iste'molchini `EPPageHeader`ga ko'chirib retire qilinsinmi yoki 2 shell qolsinmi? *(`_loop-open-questions:71-80`, `GURUH-B:98`)*
40. **Modal Fix #2/#3** — `dialog.tsx`/`alert-dialog.tsx`/`sheet.tsx` `bg-background`→`bg-card` (toza-oq modal) + `kit.css` blush palitrasini retire (hover-da peach)? *(`_loop-open-questions:92-107`, `GURUH-B:103-108`)*
41. **EPTable adoptsiyasi** — bespoke jadvallar `<EPTable>`ga qayta-yozilsinmi (dropdown UX o'zgarishi + testid qabul qilib)? *(`_loop-open-questions:109-134`)*
42. **Design-QA #2/#3** — AppShell padding sweep + EPPageHeader adoptsiyasi (~54 sahifa) — go-ahead? *(`REMAINING-WORK:77-78`)*

### 3.H — Strategik (direktor darajasi)
43. **Year-end close / retained-earnings (F11-2)** va **period-end FX revaluation (F11-3)** — qur yoki kechiktir? (0 impl) *(`REMAINING-WORK:85-86`)*
44. **Wizard autosave** (Critical 7.5) — uzun formalar token-expiry oldidan draft saqlasinmi yoki yo'qotish qabul? *(`REMAINING-WORK:148`)*
45. **Ombor dublikat-nom UNIQUE index** (Critical 1.8) — mavjud dublikat nomlar dedup qilinsinmi (indeks uchun) yoki app-guard qolsinmi? *(`REMAINING-WORK:149`)*
> Bugun javoblangan strategik: A-System to'liq almashtirish, POS GSD→CKP qayta-ishlash (alohida), IoT-sensor CAPEX. *(`QARORLAR:24-26`)*

### 3.I — GL / Moliya (ALOHIDA blok, soddalashtirildi lekin aniq raqam kerak)
> Bugun QARORLAR temp-hisoblarga soddalashtirdi ("Ishlab chiqarish zarari", "Boshqa daromadlar", "Yo'lda tovar").
> Aniq debit/credit hisob-raqamlari hali buxgalter+egasi bilan ochiq:
46. **Temp-hisoblar uchun aniq GL hisob-raqam mapping'lari** — zavod zarari / material isrofi / yo'lda tovar /
    makulatura daromadi / marketing xarajat / referral bonus debit-credit juftliklari. *(`QARORLAR:88-93`, `S1` SB0821/0833)*
47. **F7 SoD** — qaysi `org_departments` karta kanonik Moliya bo'limi (head #26/27 vs a'zo #51/60/42/159) + real `FINANCE_OFFICER`/buxgalter userlar (hozir faqat super_admin/director). *(`REMAINING-WORK:139`)*
48. **`income_split_config`** — 4-hisob daromad-taqsimi %lari (50/20/15/15?) + real cash-inflow event'da avto-trigger. *(`S1` SB0799/0809)*
49. **Marketing GL sub-kodi** ("reklama xarajati") — QARORLAR "alohida yangi hisob" dedi; aniq raqam kerak. *(`GURUH-B:149`)*
50. **Payroll-soliq stavkasi (M1)** + **GL 0.01 tolerantligi (M5)** + **Aisha thresholdlari (M10)** — doimiy istisno tasdig'i. *(`REMAINING-WORK:154`)*
51. **Yoqilg'i/transport costing** — hozir umuman aniqlanmagan. *(`S1` SB0821)*

### 3.J — BLOCKED (Org-struktura / `head_user_id`ga bog'liq — ochilgach avto-qayta-ko'riladi)
> ⭐ Bu — **#1 leverage**. Bitta ma'lumot-to'plami 52 blocked + 205 javoblangan + barcha rol/scoping/SoD/pay-gate ochadi.
52. **`CARD-ATTRIBUTES-REQUEST` 93-lavozim varag'i** — razryad_level_id / rbac_tier / salary_type / salary_min/max / base_salary / otdeleniye_no. **BO'SH varaq tayyor**, egasi to'ldiradi. *(`S10`)*
53. **Org `head_user_id` to'liq to'ldirish** — hozir ~13% (34/35/37...); manager_id ustuni yo'q. *(`QARORLAR:125-133`)*
54. **"93 test-karta" aniqligi** — egasi "93 test-karta o'chirilsin" dedi, lekin jonli tekshiruv ZID
    ko'rsatdi (`org_departments`=143 haqiqiy nom, head_user_id bog'langan). **Aynan qaysi 93 karta / qaysi
    jadval test?** Aniqlanmaguncha hech narsa o'chirilmaydi (Q-46). *(`QARORLAR:125-133`)*
55. **G10 — qaysi BITTA karta jadval kanonik** (`org_departments` vs `employee_cards` vs `org_functions`) — qolgan 2si retire uchun. *(`REMAINING-WORK:134`)*
56. **G9 — bitta-ildiz daraxt modeli + otdeleniye 1-7 mapping** — 14 dublikat ildizni yig'ish uchun. *(`REMAINING-WORK:134`)*
57. **G5 — schema-scale migratsiya tasdig'i** (`positions`/`departments` 8+ o'quvchini `org_departments`ga repoint + mirror-write to'xtatish) yoki mirror abadiy qolsinmi? *(`REMAINING-WORK:135`)*
58. **G7/G8 (DATA)** — `tskp_target` qiymatlari + `courses.card_id` binding (jonli ЦКП/LMS oylik-gate haqiqatan ushlashi uchun). *(`REMAINING-WORK:136`)*
> Bilingual/Cyrillic (alohida blocked sub-klaster):
59. **F1 — Uzbek-Cyrillic locale satri** (`uz-Cyrl-UZ` yoki `uz-UZ`/`ru-RU` fallback?) — format markazlashtirishni bloklaydi. *(`REMAINING-WORK:143`)*
60. **F3 — Cyrillic saqlash** — 3-chi `_cyrl` sibling ustun (`_ru` konvensiyasi) yoki translations jadval? (har kelajak bilingual ustunga ta'sir) *(`REMAINING-WORK:144`)*
> AI/Aisha (Modul 17) — batunlay tegilmagan (§4):
61. **AI-governance ta'rifi** — "tasdiqlangan mezon/vazn versiyasi" nima va kim imzolaydi? (governance undefined) + `camera_ai_configs` (0 qator). *(`S2` M17 Item 8/15)*

---

## 4. "HALI TEKSHIRILMAGAN" (nol-savol EMAS — savol berilmagan)

> Quyidagilar "0 ta savol" degani EMAS — chuqur completion-audit o'tkazilmagani uchun ochiq-savol
> yuzasi hali to'liq ochilmagan.

- 🔴 **Modul 17 — AI/Aisha:** master-plan bo'yicha **21 owner-gated, 0 javoblangan** — 277 unga umuman
  tegmagan; **yagona butunlay tegilmagan owner-gated workstream** (`S2`). Alohida completion-audit ham yo'q.
  Klaster: AI-governance (kim mezon/vazn versiyasini tasdiqlaydi) + camera-AI master-data.
- ⚠️ **Chuqur 2026-07-10-uslubidagi fresh-completion audit FAQAT quyidagilar oldi:** SD-CRM, Marketing,
  Ombor/POS-Monitor, WMS-POS, Finance, IoT/MES-deep-dive, Design-QA, i18n, Two-Worlds.
  **Bu uslubdagi chuqur audit OLMAGAN modullar** (faqat item-level master-plan + 07-09 Guruh-B loop-pass):
  **Kanban (15), Notifications (18), Director (05), Coordination/CC (04/20), HR (02), LMS (12), QC (09),
  PP (07), MM (11), Org (01).**
  - ⚠️ **Diqqat:** aynan shu tekshirilmagan modullar master-plan ochiq-qoldig'ining **eng kattasi**:
    **Kanban 74, CC 40, Notifications 39** ochiq owner-gated item. Ular chuqur "qaysi-kanonik /
    arxitektura-egalik" auditidan o'tmagani uchun (SD-CRM/Marketing/Ombor o'tgani kabi), ularning
    haqiqiy ochiq-savol yuzasi **hozircha to'liq xarakterlanmagan** — §3 dagi itemlar ular uchun to'liq emas.
- ℹ️ **Ega-savol chiqarmagani tasdiqlangan** (sof kod-audit): Two-Worlds, Magic-Numbers (M8/M9/M11
  kod-gigiyena), i18n, Design-QA, Finance/Accounting — real ega-DATA allaqachon 277 GL/org bloklarida (`S11`).

---

## 5. Manba fayllar (to'liq)

`VISION-3340-RETRIAGE-2026-07-07.md` · `FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md` ·
`REMAINING-WORK-2026-07-07.md` · `_loop-open-questions-2026-07-11.md` ·
`GURUH-B-OWNER-QUEUE-2026-07-09.md` · `SCHEMA-APPROVAL-2026-07-11.md` ·
`SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3.md` · `MARKETING-COMPLETE-FRESH-ANALYSIS-2026-07-10-v1.md` ·
`OMBOR-POS-MONITOR-TOLIQ-TAHLIL-2026-07-10.md` · `DUBLIKAT-SAHIFALAR-TAHLILI-2026-07-10.md` ·
`CARD-ATTRIBUTES-REQUEST.md` · `WMS-POS-FULL-AUDIT-2026-07-05.md` · `TWO-WORLDS-FULL-AUDIT-2026-07-06.md` ·
`MAGIC-NUMBERS-INDEPENDENT-VERIFICATION-2026-07-07.md` · `I18N-FULL-AUDIT-2026-07-04.md` ·
`DESIGN-QA-FULL-AUDIT-2026-07-05.md` · `FINANCE-FULL-AUDIT-2026-07-06.md` · `ACCOUNTING-STANDARDS-AUDIT-2026-07-06.md`

**Dedup asosi (bugun javoblangan 277, bu faylda TAKRORLANMAYDI):** `QARORLAR-JURNALI-2026-07-11.md` + `OWNER-JAVOBLAR-2026-07-11.md`.

---
_2026-07-11, read-only sintez. Hech narsa o'zgartirilmadi. 61 distinct ochiq item (§3) + 442 xom master-plan
qoldig'i (§1). Savollarni egasi keyingi sessiyada javoblaydi._
