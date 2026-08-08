Verified: legacy `orders` table no longer exists (that two-world is resolved), but the 1-card=1-seat atomic invariant IS violated (multiple cards hold 2 employees), and CRM deal→sales_order link is 0/4 (golden thread head is broken). I have enough live evidence. Writing the report.

---

# EUROPRINT ERP — VIZYON-MOSLIK HALOL HISOBOTI

> O'lchov = EGASI VIZYONI (Q-40), "ishlaydi" emas. Har asosiy da'vo JONLI tasdiqlandi (kod fayl:satr + DB `_audit/q.cjs`). Sana: 2026-06-25.

---

## 1. UMUMIY VIZYON-MOSLIK: ~45%

**Egasi "hammasi vizyonga to'g'ri kelmaydi" deydi — bu QISMAN to'g'ri, lekin "hammasi axlat" emas.** Halol holat: **skelet/struktura ko'p joyda VIZYONGA YAQIN qurilgan (jadvallar, endpointlar, FE sahifalar mavjud), lekin VIZYON YURAGI — karta-markazlilik, oltin-ip oqimi va kunlik gate-lar — JONLI ULANMAGAN yoki BO'SH.** Ya'ni "ballonsiz mashina" metaforasi hozir ham to'g'ri: dvigatel (modullar) bor, transmissiya (ulanish + data) yo'q. 2 ta soha haqiqatan vizyonga yaqin (Moliya/GL mexanikasi, Razryad strukturasi), qolgan 18 sohada model to'g'ri lekin oqim/data uzuq.

**Eng og'ir haqiqat:** 4 ta MARKAZIY vizyon-printsipining hammasi buzilgan — (1) karta-markazli login/oylik, (2) oltin-ip uzluksiz oqim, (3) ЦКП kunlik gate, (4) bitta yagona daraxt. Bular vizyonning "miyasi" — ularsiz qolgan hamma narsa eski model ustida ishlaydi.

---

## 2. SOHA BO'YICHA JADVAL (eng pastdan eng yuqoriga)

| # | Soha | O'rtacha % | Eng yomon nuqtai-nazar | Bir jumla |
|---|------|-----------|------------------------|-----------|
| 1 | Golden-thread / event oqim | **27%** | OQIM 5% (MISSING) | `domain_events`=0 (JONLI tasdiq) — eventlar hech qachon yozilmagan, zanjir xotirada, crash→yo'qoladi. |
| 2 | ЦКП / GSD / KPI | **21%** | UI 12% | `ckp_fact_values`=0 qator; kunlik AI-chatbot YO'Q; oylik-gate YO'Q. |
| 3 | IoT / Telemetriya | **34%** | OQIM 22% | Operator login imkonsiz (0 operator role), 13/18 endpoint stub, sensor data 0. |
| 4 | LMS / Darslik | **36%** | TO'LIQLIK 20% | `courses.card_id` yo'q, oylik-gate ULANMAGAN, avto-enroll listener YO'Q. |
| 5 | Auth / RBAC | **36%** | TO'LIQLIK 28% | RBAC eski `position_id`'ga keyed; card-gate env-flag bilan OFF. |
| 6 | HR / Xodim-karta | **30%** | FLOW 22% | `users.card_id` ustuni umuman YO'Q; oylik baseSalary'dan. |
| 7 | Org-karta markazlilik | **37%** | To'g'rilik 31% | 19 root (bitta daraxt emas); 1-karta=1-seat buzilgan; card_id login yo'q. |
| 8 | Hisobot / Director | **40%** | Model 20% | 5-ko'rsatkich holat-formula hisobi YO'Q, ideal_rasm_targets=0. |
| 9 | AI / Aisha | **47%** | To'g'rilik 35% | Layer B (desktop JARVIS) umuman yo'q; aisha_tool_calls=0. |
| 10 | QC / Sifat | **47%** | Model 15% | Sort/grade narx koeffitsienti yo'q; karta-bog'lanish yo'q. |
| 11 | WMS / POS | **47%** | TO'LIQLIK 45% | POS taksonomiyasi 1/5 tur; warehouse_stock↔transactions sync yo'q. |
| 12 | PP / Rejalashtirish | **39%** | OQIM/To'g'rilik 35% | MRP DB'ga persist qilmaydi; 6-status (vizyon 9); PP→MES uzilган. |
| 13 | MES / Ishlab chiqarish | **47%** | UI 32% | 3-bosqich sessiya yo'q; ikki parallel session jadval; xodim↔karta yo'q. |
| 14 | CRM | **50%** | TO'LIQLIK 35% | Deal→sales_order link 0/4 (JONLI); voronka bosqichlari bo'sh. |
| 15 | Master-data | **56%** | TO'LIQLIK/OQIM 45% | unit_of_measures bo'sh; soft-delete audit ustunlari yo'q; material ikki-olam. |
| 16 | SD / Sotuv | **49%** | TO'LIQLIK 38% | Kotirovka versiyalash yo'q; 12/13 buyurtma orphan (PP'ga oqmaydi). |
| 17 | Frontend / Dizayn | **51%** | To'g'rilik 32% | Xom hex inline-style massiviy; EPPageHeader ~95% sahifada yo'q. |
| 18 | Xavfsizlik / Multi-tenancy | **51%** | OQIM 35% | tenant_id filter ~99% repo'da yo'q (P1 single-tenant, P2+ xavf). |
| 19 | Razryad / Malaka | **57%** | UI 32% | Struktura yaxshi (6 level seeded) lekin 0/144 kartaga biriktirilgan + egasi-data NULL. |
| 20 | Moliya / GL / Kassir | **70%** | UI/Model 45-52% | GL mexanikasi eng yetuk (atomik journal, FIFO); lekin cashier_movements=0, kassir konsepti UI'da noto'g'ri. |

---

## 3. ENG KATTA VIZYON-CHETLASHISHLARI (P0)

### P0-1 — Karta-markazli login + oylik UMUMAN YO'Q (vizyonning #1 printsipi)
- **Vizyon:** `card_id` NULL → login YO'Q + oylik YO'Q. Oylik kartaning salary maydonlaridan + razryad-koeffitsientdan keladi.
- **Build:** `users.card_id` ustuni **DB'da umuman yo'q** (JONLI: information_schema → faqat `position_id`, `role`). Oylik `payroll.service.ts:132` da `Number(raw['baseSalary'] ?? raw['base_salary'] ?? 0)` — kartaning salary maydoni ISHLATILMAYDI. `razryad_levels.salary_max`=NULL bo'lgani uchun kartadan hisoblash baribir mumkin emas.
- **Fakt:** `apps/api/src/modules/hr/payroll/payroll.service.ts:132`; DB users-da card_id yo'q; login-gate `login.service.ts:126` env-flag `CARD_LOGIN_GATE_ENABLED='true'` talab qiladi (default OFF).

### P0-2 — Golden-thread eventlari hech qachon yozilmagan (oltin ip uzuq)
- **Vizyon:** SD→PP→MES→QC→WMS→FIN uzluksiz, outbox pattern + at-least-once delivery, 19 domain event.
- **Build:** `domain_events`=**0 qator** (JONLI). Eventlar faqat in-process EventEmitter2 orqali; restart/crash → yo'qoladi. CRM deal→sales_order link = **0/4** (JONLI) — zanjirning BOSHI ham uzilgan.
- **Fakt:** DB `SELECT count(*) FROM domain_events` = 0; `crm_deals` linked=0/total=4.

### P0-3 — ЦКП kunlik gate va data BUTUNLAY BO'SH
- **Vizyon:** har karta kunlik ЦКП o'lchov; mashinasiz xodimlar AI-chatbot orqali hisobot; deadline o'tmasa kun-oyligi yo'q.
- **Build:** `ckp_fact_values`=**0 qator** (JONLI). AI-chatbot kunlik savol YO'Q, IoT/MES→ЦКП feed YO'Q, payroll ЦКП-gate so'ramaydi.
- **Fakt:** DB ckp_fact_values=0; jadval mavjud lekin oziqlanmaydi.

### P0-4 — Bitta yagona daraxt INVARIANTI buzilgan + 1-karta=1-seat buzilgan
- **Vizyon:** 1 Egasi-ildiz → bitta daraxt; 1 karta = 1 o'rindiq = 1 xodim (atomik).
- **Build:** `org_departments`'da **19 root** (parent_id NULL) — bitta daraxt emas (JONLI). `employee_org_departments`'da bir nechta karta 2 xodim ko'taradi (JONLI: dept 34/32/24/19/29 = 2 xodim).
- **Fakt:** DB roots=19/total=144; employee_org_departments GROUP BY → bir nechta karta c=2.

### P0-5 — RBAC eski positions modelida (karta-markazli emas)
- **Vizyon:** RBAC kartadan (ko'rish/qilish/tasdiq), karta o'zgarsa ruxsat o'zgaradi.
- **Build:** PermissionGuard `position_permissions` jadvalini `users.position_id`'dan tekshiradi; org_departments rbac_tier data 0/144. Eski parallel model davom etadi.
- **Fakt:** users-da position_id mavjud (card_id emas); rbac-tier.policy.ts manba lekin karta-data bo'sh.

### P0-6 — Razryad + head_user_id egasi-data BO'SH
- **Vizyon:** razryad har kartada, dinamik o'sish zanjiri; xodim-karta link.
- **Build:** 0/144 kartada `razryad_level_id` (JONLI); `head_user_id` 18/144 (126 NULL). razryad_levels seed bor lekin exam_pass_threshold/max_retakes/salary_min/max = barchasi NULL.
- **Fakt:** DB with_razryad=0/144; with_head=18/144; razryad_levels row inspeksiyasi → threshold NULL.

---

## 4. VIZYONGA MOS QISMLAR (halol)

- **Moliya / GL mexanikasi (~70%, eng yetuk):** atomik journal (`insertJournal` + db.transaction), FIFO/FEFO, kanonik `entries` (6 qator JONLI). Bitta GL modeli (vizyonga mos). *Lekin:* cashier_movements=0, kassir UI konsepti noto'g'ri.
- **Razryad strukturasi (~57%):** 6-level seed, coefficient (1.00/1.25/...), 2-imzo tasdiq workflow blueprint, FE RazryadTab badge. Struktura vizyonga sodiq — faqat egasi-data va karta-biriktirish yetishmaydi.
- **Eski "ikki dunyo" qisman hal bo'lgan:** legacy `orders` jadvali **endi DB'da yo'q** (JONLI: "отношение orders не существует") — `sales_orders` kanonik bo'ldi. Bu eski memory'dagi parallel-order muammosi yopilgan.
- **Aisha Layer A skeleti** mavjud (~30 tool, web miya), futuristik UI — vizyon yo'nalishida (lekin Layer B yo'q, tool-loop test qilinmagan).

---

## 5. NEGA SHUNDAY BO'LGAN (ildiz-sabab)

Asosiy sabab — **vizyon kechroq, build erta**: tizimning katta qismi karta-markazli model TO'LIQ tasdiqlanmasidan oldin (eski "positions/employees-markazli" model bo'yicha) qurilgan, keyin karta-vizyon (2026-06 intervyu) ustiga "qoplama" sifatida qo'shilgan. Natijada DDL/jadvallar yangi vizyonga moslab QO'SHILGAN (org_departments, razryad_levels, ckp_*, cashier_movements, domain_events), lekin (a) ESKI yozish-yo'llari hali ham eski jadvallarga yozadi (payroll→baseSalary, RBAC→position_id), (b) yangi jadvallar OZIQLANTIRILMAGAN (data=0), (c) egasi bermagan MASTER-DATA bo'sh qoldirilgan (head_user_id, razryad qiymatlari, salary band, ЦКП norma — "fabrikatsiya taqiq" qoidasi bo'yicha to'g'ri bo'sh qoldirilgan). Gate-lar (login, oylik, darslik, ЦКП) env-flag bilan OFF yoki ulanmagan — chunki data bo'sh holatda yoqilsa butun tizim bloklanardi. Ya'ni: **struktura ~vizyon, lekin transmissiya ulanmagan va idishlar bo'sh.**

---

## 6. NIMA QILISH KERAK (vizyonga yetkazish yo'li)

**Avval EGASI-QARORI (data — muhandislik kuta olmaydi):**
1. `org_departments`'ni **bitta daraxtga** keltirish: 19 root → 1 Egasi-ildiz + 7 otdeleniye (egasi kim-kimni-boshqaradi sxemasini berishi). `head_user_id` 126 NULL'ni to'ldirish.
2. Razryad qiymatlari: salary band (dan-gacha), exam_pass_threshold, min_months (vizyon ≥3) — har razryad uchun.
3. ЦКП norma + deadline (spec 16 soat ╳ 3 soat ZIDDIYATINI hal qilish), kurs↔karta biriktirish.
4. RBAC tier (har karta), AI-kalit.

**Keyin MUHANDISLIK (ustuvorlik tartibi — markaziy printsiplardan):**
1. **Karta-markazli yadro (P0-1, P0-4, P0-5):** `users.card_id` ustunini qo'shish; payroll'ni karta salary+razryad-koeffga ko'chirish; RBAC'ni position_id'dan card'ga; 1-seat unique guard. Bu vizyonning "miyasi" — birinchi.
2. **Golden-thread oqimi (P0-2):** outbox pattern (domain_events'ga atomik yozish) + relay; CRM deal→SO avto-yaratish; 12 orphan SD→PP ulash. Real DB-proof bilan.
3. **ЦКП + gate-lar (P0-3):** MES/IoT→ЦКП feed listener; AI kunlik chatbot; oylik-gate (ЦКП+darslik) ulash. Data kelgach yoqish.
4. **Login-gate yoqish (P0-1):** karta-data to'lgach `CARD_LOGIN_GATE_ENABLED=true`.
5. Director 5-ko'rsatkich holat-formula hisobi, IoT operator-login, Frontend EP-token tozalash — keyingi to'lqin.

**Eng muhim strategik tavsiya:** har modulni alohida "to'liq qilish" o'rniga, AVVAL bitta vertikal ip'ni (1 karta → login → oylik → ЦКП → 1 buyurtma SD→PP→MES→QC→WMS→FIN→GL) UCHMA-UCH JONLI ishlatib ko'rsatish. Hozir har modul 40-50% lekin hech qaysi UCHMA-UCH zanjir jonli emas — bitta to'liq ip ko'rsatilsa, qolgani shablon bo'ladi.