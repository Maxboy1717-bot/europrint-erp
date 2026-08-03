# EGASI-DATA BLOKERLARI (BLOCKERS_OWNER_DATA)

> Mexanizm qurilgan, lekin egasi qiymat bermaguncha to'liq ishlamaydi. Soxta default QO'YILMAYDI.
> Format: ma'lumot | nima uchun | qayerga kiritiladi | kiritilmasa nima bloklanadi | vaqtinchalik safe behavior

| # | Ma'lumot | Nima uchun | Kiritish joyi | Bloklanadi | Safe behavior |
|---|---|---|---|---|---|
| B1 | **ЦКП hisobot deadline (soat)** — 16 soatmi yoki 3 soatmi? | Payroll kunlik-gate qachon kun-oyligini bloklashini belgilaydi | `org_departments.ckp_report_deadline_hours` (yoki global config) | Payroll kun-gate aniq vaqtni bilmaydi | Default GATE OFF (CKP_PAYROLL_GATE_ENABLED=false) — gate hisoblanadi, lekin oylikni bloklamaydi, faqat flag/log |
| B2 | **Har karta uchun tskp_target** (ЦКП norma + o'lchov SON/FOIZ/VAQT) | Achievement% hisoblash uchun (target yo'q → % yasab bo'lmaydi) | org_departments/org_functions.tskp_target | ЦКП achievement% | target NULL → achievement hisoblanmaydi (gate "no-target" deb o'tkazadi, soxta 100% YO'Q) |
| B3 | **Razryad salary_min/salary_max** (6 daraja) | Karta-asosli oylik hisoblash | razryad_levels (6 qator NULL) | Razryad-asosli oylik | NULL → baza-oylik ishlatiladi, razryad-koeff qo'llanmaydi |
| B4 | **head_user_id** (kim-kimni boshqaradi) | Vertikal zanjir, eskalatsiya, council a'zoligi | org_departments.head_user_id | Vertikal eskalatsiya marshruti | NULL → eskalatsiya faqat super_admin/director'ga |
| B5 | **workflow_rules** (hujjat→tasdiqlovchi) | Coordination avto-yo'naltirish | workflow_rules jadval (0 qator) | Avto-approval marshruti | qoida yo'q → qo'lda yo'naltirish |
| B6 | **karta-shablonlar** (10-15 zavod lavozimi) | Karta yaratishda avto-to'ldirish | card_templates (0 qator) | Shablon-asosli karta | shablon yo'q → bo'sh karta qo'lda |
| B7 | **AI kalitlar** (har karta AI'si) | Karta-AI baholash/hisobot | .env / config | Karta-AI funksiyalari | kalit yo'q → AI funksiya o'chiq |

> ⚠️ Bu blokerlar mexanizmni TO'XTATMAYDI — kod quriladi, config-joyi tayyorlanadi, egasi kiritganda darhol ishlaydi.

| B8 | **Yagona org-daraxt unifikatsiyasi** — 17 root'dan (parent_id NULL) bittasini tuzish | Prinsip #4: bitta ildiz; hozir 17 parallel root | Migration + org_departments.parent_id (qaysi root kim ostida) | Single-root invariant/constraint o'rnatilmaydi | Hozir 17 root saqlanadi (sxema ishlaydi), constraint qo'yilmaydi — egasi 7-otdeleniye→CEO→Owner ierarxiyasini bergач unify |
