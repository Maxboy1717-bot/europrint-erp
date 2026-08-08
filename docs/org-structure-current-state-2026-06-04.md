# 🏢 ORG-TUZILMA — HOZIRGI HOLAT vs 7-DIVIZION ORG-CHART (xarita)
> Sana: 2026-06-04 | Rol: 🔵 TAHLILCHI (qat'iy read-only) | Hech narsa o'zgartirilmadi (faqat o'qish + SELECT + shu fayl)
> Har da'vo jonli DB/kod bilan tasdiqlangan (qavs ichida). Verify-don't-trust: "name" ustuni bo'sh edi — nomlar `name_uz`да (bir necha so'rov shu sabab "null" berdi, tuzatildi).

---

## ⭐⭐ BIR JUMLALI XULOSA (egasiga)
**Yaxshi xabar: org-chart deyarli QURILGAN — kutilgandan ancha oldinda.** Zavodning 7 bo'linmasi (divizioni), bo'limlari, lavozimlari (Egasi/Bosh Direktor/direktorlar bilan) BAZADA BOR, va 30 xodimning hammasi o'z bo'lim + lavozimiga biriktirilgan. Asosiy yetishmovchilik: **"kim kimga bo'ysunadi" bog'lami (manager_id) bo'sh** — lekin uni to'ldirish uchun kerakli tuzilma allaqachon mavjud (faqat "har bo'limning boshlig'i kim" aniqlanishi kerak). Metafora: **uy qurilgan, xonalar va mebel joyida, lekin "kim kimning xonasida" ro'yxati hali to'ldirilmagan.**

---

## STEP 1 — Qanday org jadval/ustunlar bor?

### ⭐ IKKITA bo'lim jadvali (ikkalasi ham REAL jadval)
| Jadval | Qator | Nima | Tur |
|---|---|---|---|
| **`departments`** | **18** | ⭐ Hubbard 7-divizion tuzilmasi: `vysotskiy_function`(1-7=divizion), `parent_id`(daraxt), `vep`(qimmatli yakuniy mahsulot), `head_id`, `level` | TABLE |
| **`org_departments`** | **142** | Ikkinchi, kattaroq daraxt: `parent_id`, `head_user_id`, `otdeleniye_code`, `level` | TABLE |
| `positions` | 96 | Lavozimlar (Egasi/direktorlar/boshliqlar) | TABLE |
| `org_functions` | 97 | Org funksiyalar | TABLE |
| `employee_org_departments` | 30 | Xodim↔org_department bog'lami (junction) | TABLE |
| `position_permissions` | **1380** | Lavozim→ruxsat matritsasi (RBAC) | TABLE |

> ⚠️ **2 dept jadval** = "ikki olam" naqshi (oldingi sd_sales_orders/leads kabi): xodimlar IKKALASIga ham bog'langan (`department_id`→departments, `org_department_id`→org_departments). Qaysi biri kanonik — owner qarori (pastda).

### `employees` org-ustunlari (30 xodim) — qaysi to'la, qaysi bo'sh
| Ustun | To'lganmi (30 dan) | Izoh |
|---|---|---|
| `department_id` → departments(18) | ✅ **30/30** | har xodim 18 bo'limдан biriga |
| `org_department_id` → org_departments(142) | ✅ **30/30** | + 142-daraxtga ham |
| `position_id` → positions(96) | ✅ **30/30** | har xodim lavozimга |
| `org_function_id` → org_functions | ✅ **30/30** | |
| **`manager_id`** (kim boshlig'i) | 🔴 **0/30 BO'SH** | "bo'ysunish" bog'lami — bo'sh (asosiy gap) |
| `manager_org_department_id` | 🔴 0/30 | |
| `department` (matn) | 🔴 0/30 | bo'sh matn-ustun (o'lik) |
| `position` (matn) | 🔴 0/30 | bo'sh matn-ustun (o'lik) |
| `role` (app-roli) | 🔴 **0/30 BO'SH** | ⚠️ app-roli `employees`да emas — `users`да (pastda) |

**"Reports-to" bog'lami:** `employees.manager_id` BOR (ustun), lekin **30/30 BO'SH**. Org-iyerarxiya aslida `departments.parent_id` daraxti + `positions` orqali ifodalanadi; eskalatsiya kodi `org_departments.head_user_id` (18/142 to'la) ishlatadi — `manager_id` EMAS (o'lik ustun).

---

## STEP 2 — 30 xodim: kimlar?
**⭐⭐ Hammasi org-chart'ga TO'LIQ biriktirilgan** (`employees JOIN departments JOIN positions`):

| Xodim | Bo'lim | Lavozim |
|---|---|---|
| Bobur Karimov | Ma'muriyat | **Egasi** (Owner) ⭐ |
| Sherzod Aliyev | Bosh Direktor ofisi | **Bosh Direktor** (GD) |
| Dilshod Toshev | Bosh Direktor ofisi | **Ma'muriy Direktor** |
| Madina/Nilufar | Kadrlar bo'limi | HR Boshlig'i |
| Aziza Rahimova | Yollash sektsiyasi | HR Boshlig'i |
| Akmal/Diyora/Rustam | Sotuvlar | Sotuvlar Boshlig'i |
| Jasur/Kamola | Marketing | Marketing Boshlig'i |
| Saida Toxtaeva | Moliya | Bosh Buxgalter |
| ... (qolgan 18) | Sifat/Ombor/Flekso/Ofset/Buxgalteriya/... | mos boshliqlar |

- ✅ **Egasi, Bosh Direktor, Ma'muriy Direktor ANIQ bor** (xodim sifatida, lavozimi bilan).
- ⚠️ **Sample data belgisi:** ko'p xodim bir xil "Boshlig'i" lavozimida (3× Sotuvlar Boshlig'i, 2× HR Boshlig'i) — namuna ma'lumot, real 400 xodim emas. Lekin TUZILMA + biriktirish naqshi to'g'ri.
- 18 bo'limning hammasiда 1-3 xodim bor (har divizion qoplangan).

---

## STEP 3 — DB bo'limlari org-chart'ning 21 bo'limiga mos keladimi?

### ✅ HAMMA 7 DIVIZION bor (`departments.vysotskiy_function` = divizion 1-7)
| Divizion | DB bo'limlari |
|---|---|
| 7 Ma'muriy | Ma'muriyat, Bosh Direktor ofisi |
| 1 Qurilish/HCO | Kadrlar bo'limi (HR), Yollash sektsiyasi |
| 2 Distribution | Marketing, Sotuvlar |
| 3 Moliya | Moliya, Buxgalteriya |
| 4 Texnik/IshlabChiqarish | Ishlab chiqarish, Flekso sexi, Ofset sexi, Preprint, Ombor, Yetkazib berish (6) |
| 5 Qualification | Sifat nazorati, O'qitish bo'limi |
| 6 Development | PR va aloqalar, Hamkorlar |

### Solishtirish (21 maqsad-bo'lim)
- ✅ **BOR (~13):** HR(d1), Marketing(d5), Sotuvlar(d6), Buxgalteriya(d9), Planning umbrella, Preprint(d11-2), Ombor/Supply(d11-1), Flekso(d12-1), Ofset(d12-2), Yetkazish(d12-3), Sifat(d13), O'qitish(d14), PR(d16), Hamkorlar(d18).
- 🔴 **YETISHMAYDI (~8):** d2 Aloqa (Communications), d3 Tekshiruv&Hisobot, d4 Targ'ibot (Promotion), d7 Daromad (Income), d8 Xarajat (Expenses), d10 Rejalashtirish (Planning — alohida), d15 Yaxshilash (Improvement), d17 Kirish-xizmatlari (Intro services).
- ⚠️ **Nom farqlari:** DB "Sotuvlar" = chart "d6 Sales"; DB "Marketing" = chart "d5 Understanding"; DB "Moliya" = umbrella (Income/Expenses ajratilmagan).

➡️ **7 divizion 100% bor; 21 bo'limдан ~13 bor, ~8 yetishmaydi** (asosan moliya ichki bo'linishi + ba'zi xizmat-bo'limlari).

---

## STEP 4 — Modullar org-birlikка bog'langanmi? RBAC bormi?
- **App-roli (jonli RBAC):** `users` jadvalida — **manager:27, director:1, super_admin:3** (31 user). Guard'lar shuni majburlaydi (xavfsizlik tahlili: 5 qorovul real). ⚠️ Bu KOORS rol — lavozim/bo'limга bog'lanmagan.
- **Lavozim-RBAC:** `position_permissions` = **1380 qator** (96 lavozim × ~14 ruxsat) — lavozim→ruxsat matritsasi DATA bilan BOR. (Majburlanadimi — alohida tekshirish kerak; data bor.)
- **Order→bo'lim bog'lami:** `sd_order_departments` (Phase-4 fan-out) buyurtmani bo'limlarга bog'laydi — lekin bu order-fan-out, modul-org emas.
- **Modul↔bo'lim:** modullar asosan org-tuzilmaдан MUSTAQIL (Sotuvlar moduli "Sotuvlar bo'limi"ga rasman bog'lanmagan; faqat role-guard). org-structure moduli (`apps/api/src/modules/org-structure/`) org-daraxtни boshqaradi, lekin boshqa modullar unga ulanmagan.

➡️ **RBAC = 2 qatlam:** (1) koors `users.role` (jonli, guard majburlaydi), (2) `position_permissions` (1380, nozik, data bor). Lavozim/bo'lim-asosли to'liq RBAC hali ulanmagan.

---

## STEP 5 — manager_id (eng dolzarb)
- ✅ Tasdiq: `employees.manager_id` ustuni BOR, **0/30 to'la (hammasi BO'SH)** (`count FILTER WHERE manager_id IS NOT NULL = 0`).
- **Kim ishlatadi (agar to'la bo'lsa) — 25 fayl** `manager_id`/`head_user_id`/`MANAGER_OF_SENDER`ga tegadi:
  - `org-structure.service.ts` + `org-queries.repo.ts` (org-daraxt) — eskalatsiya/rahbar topish.
  - `hr/telegram-bots/manager.repo.ts` + `profile.repo.ts` — Telegram eskalatsiya ("rahbaringga xabar").
  - `pos/procurement-approval-chain.service.ts` — xarid tasdiq zanjiri (rahbar tasdig'i).
  - `sd-dashboard`/`sd-quotations` (sotuv menejeri), CRM (lead manageri).
- ⭐ **Hozir qanday "ishlaydi":** kod `employees.manager_id`ga EMAS, `org_departments` daraxti + `head_user_id`ga (18/142 to'la) tayanadi. Ya'ni manager_id = **o'lik ustun**; iyerarxiya daraxt + bo'lim-boshlig'i orqали (qisman) ishlaydi. `MANAGER_OF_SENDER` yo'li (manager_id'ga tayangani) **uzilgan** (bo'sh) → kod DEPT_HEAD yo'liga tushadi (oldingi sessiya topilmasi).

---

## STEP 6 — UMUMIY (sodda xulosa)

### Holat jadvali: org-chart elementi | kodda bormi | data bilanmi | dalil
| Element | Kodда | Data | Dalil |
|---|---|---|---|
| 7 divizion | ✅ | ✅ | departments.vysotskiy_function 1-7 (18 qator) |
| Egasi + Bosh Direktor + direktorlar | ✅ | ✅ | positions id 1-5; xodim 2/3/4 ga biriktirilgan |
| 21 bo'lim | 🟡 | 🟡 | 18 bo'lim (≈13 mos, 8 yetishmaydi) |
| Xodimlar bo'limга biriktirilgan | ✅ | ✅ | employees.department_id 30/30 |
| Xodimlar lavozimга | ✅ | ✅ | employees.position_id 30/30 |
| **Bo'lim boshliqlari** | 🟡 | 🔴 | departments.head_id 0/18; org_departments.head_user_id 18/142 |
| **"Kim kimga bo'ysunadi" (manager_id)** | ✅ ustun | 🔴 **0/30** | bo'sh — asosiy gap |
| Lavozim-ruxsat (RBAC) | ✅ | ✅ | position_permissions 1380 |
| App-rol | ✅ | ✅ | users.role (manager 27/director 1/super_admin 3) — `employees.role` BO'SH |

### Tizim org-chart'дан qancha uzoq? → **🟢 OZ QOLDI (yarmидан ko'pi bor)**
Tuzilma (7 divizion + bo'limlar + lavozimlar + xodim-biriktirish) ~**80% qurilgan**. Yo'q: (1) manager_id bog'lami, (2) ~8 bo'lim, (3) bo'lim boshliqlari (head), (4) 2 dept-jadval birlashishi.

### ⭐ YO'Q tuzilma (7-divizionni to'liq ifodalash uchun)
1. **Direktor-darajali daraxt tugunlari** — `departments`да GD/Ma'muriy/Texnik/Rivojlanish Direktor ALOHIDA tugun EMAS (hamma bo'lim "Ma'muriyat"ga osilgan, level 2). Direktorlar faqat LAVOZIM sifatida bor, daraxt oralig'ида emas. → divizion→direktor→bo'lim iyerarxiyasi to'liq daraxtда yo'q.
2. **~8 yetishmaydigan bo'lim** (Aloqa, Tekshiruv, Targ'ibot, Daromad, Xarajat, Rejalashtirish, Yaxshilash, Kirish-xizmatlari).
3. **Yagona bo'lim-jadval** (hozir 2: departments 18 ╳ org_departments 142).

### ⭐ manager_id'ни HOZIR to'ldirsa bo'ladimi?
**Qisman HA — tuzilma bor, lekin "kim aslida boshliq" ANIQLANISHI kerak:**
- ✅ BOR: departments daraxti (parent_id) + positions (Egasi→GD→direktorlar→boshliqlar) + xodim→lavozim biriktirish.
- 🔴 YETISHMAYDI: **"har bo'limning HAQIQIY boshlig'i kim"** — `departments.head_id` **0/18 bo'sh**; sample data'да har bo'limда bir necha bir xil "Boshlig'i" (3× Sotuvlar Boshlig'i) → qaysi biri ASL boshliq noaniq.
- **Eng xavfsiz yo'l (owner kerak):** owner har bo'limning haqiqiy boshlig'ini belgilaydi (yoki lavozim-iyerarxiya: "Sotuvlar Boshlig'i" → "Ma'muriy Direktor" → "Bosh Direktor" → "Egasi"). Keyin manager_id = bo'lim boshlig'i (yoki ota-bo'lim boshlig'i) sifatida hosil qilinadi.
- ⚠️ **MAPPING YO'Q (flag):** hozirgi sample-data'да "qaysi xodim qaysi bo'limning ASL boshlig'i" ANIQ emas (dublikat lavozimlar). Real 400 xodimда bu owner-ma'lumoti. **Taxmin qilib bo'lmaydi** — owner tasdig'i kerak.

### TOP topilmalar (owner birinchi shularni hал qilsin)
1. ⭐ **Yaxshi xabar:** org-chart ~80% bazada bor — yangidan qurish EMAS, to'ldirish/ulash.
2. 🔴 **manager_id 0/30** — to'ldirish uchun "har bo'limning boshlig'i kim" kerak (sample-data noaniq → owner belgilaydi).
3. 🟡 **2 dept-jadval** (departments 18 ╳ org_departments 142) — qaysi kanonik? (oldingi "ikki olam" kabi — birlashishi kerak).
4. 🟡 **Bo'lim boshliqlari** — departments.head_id 0/18 (bo'sh); org_departments.head_user_id 18/142 (qisman).
5. 🟡 **~8 yetishmaydigan bo'lim** + direktor-daraxt tugunlari yo'q.
6. ⚠️ **positions dublikatlari** (Bosh Direktor id 2╳659; HR boshlig'i id 6╳661).
7. 🟡 **Modul↔bo'lim ulanmagan** — modullar org-tuzilmaдан mustaqil; faqat koors role-guard. Lavozim-RBAC (position_permissions 1380) bor lekin to'liq ulanmagan.

---

## Metodologiya (har raqam qanday o'lchandi)
- Jadval/ustun: `information_schema.columns`, `pg_class.relkind`.
- Qator/NULL: `SELECT count(...)`, `count(*) FILTER (WHERE ... IS NOT NULL)`.
- ⚠️ Verify-don't-trust: `name` ustuni BO'SH, nomlar `name_uz`да → COALESCE bilan tuzatildi (bir necha "null" sirи shu sabab); `role` keng-so'rovда noto'g'ri "30" berdi, izolyatsiyada 0 chiqdi.
- Kod: `grep` (fayl:satr).

> 🔵 **Hech narsa o'zgartirmadim** — faqat o'qidim + SELECT + shu hisobot fayli. Tuzatish/ko'chirishni Bajaruvchi (Agent 1) sizning qaroringizdan keyin qiladi.
