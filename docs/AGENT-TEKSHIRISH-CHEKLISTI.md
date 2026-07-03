# AGENT NATIJALARINI TEKSHIRISH CHEKLISTI

> Claude Code agentlari ishlab chiqargan kodni ko'rib chiqish protokoli — "tezlik hissi"ga emas, tekshirilgan natijaga tayanish uchun.
>
> Manba: `AGENT-TEKSHIRISH-CHEKLISTI.docx` (Ustoz rejimi hujjati), egasi buyrug'i bilan 2026-07-02 da loyihaga rasmiy protokol sifatida qo'shildi. CLAUDE.md'dagi Q-29 (verify-don't-trust), Q-31 (subagent izolyatsiyasi) va Qoida 23 (parallel sessiya rollari) bilan birga qo'llanadi.

## 1. Nima uchun bu hujjat kerak

Sun'iy intellekt agentlari kod yozishni arzonlashtiradi, lekin buni tekshirish (review) hisobiga qiladi. Agentlar tez va ko'p kod ishlab chiqaradi; inson esa buni sekin va cheklangan e'tibor bilan tekshiradi. Natijada tekshirish bosqichi yashirin tirbandlik nuqtasiga aylanadi — va "hammasi yashil ko'rinadi" degan hissiyot buni yashiradi.

EuroPrint loyihasida bu allaqachon amalda ko'rilgan: Sprint 2'da (commit b0d2555b) ikki marta protokol buzilishi — Q-23 (bitta commit'ga 6 ta vazifa yig'ilgani) va Q-28 (manager_id backfill ruxsatsiz ishga tushirilgani) qayd etilgan. Bu hujjat o'sha xatolarni tizimli tarzda oldini olish uchun tuzildi.

Asos: METR nazoratli tajribasi (2025) — tajribali dasturchilar tanish kod bazasida sun'iy intellekt bilan o'zlarini ~20% tezroq his qilishgan, aslida ~19% sekinroq ishlashgan. Sabab: tekshirish yuki e'tiborga olinmagan.

## 2. Umumiy qoidalar (har doim amal qiladi)

- ☐ **Bitta commit — bitta vazifa.** Ko'p vazifali commit (Q-23 turi) avtomatik rad etiladi.
- ☐ **Destruktiv operatsiya** (backfill, migration, DELETE, bulk UPDATE) — Maxboy yoki Claude'dan aniq yozma ruxsatsiz ishga tushirilmaydi (Q-28 turi).
- ☐ Har bir agent commit'i o'zining **nima uchun, nimani va qanday** o'zgartirgani haqida qisqa izohga ega bo'lishi kerak.
- ☐ Hech qanday commit **"self-merge"** qilinmaydi — kamida bitta inson tasdig'i talab qilinadi.
- ☐ Agent promptlari **tor va aniq scope**'ga ega bo'lishi kerak (bitta modul / bitta jadval) — "hamma narsani tuzat" turidagi keng promptlar taqiqlanadi.

## 3. Har bir agent commit'ini tekshirish cheklisti

### 3.1 Tezkor skanerlash (har bir commit, 2 daqiqa)

- ☐ Commit faqat **bitta vazifani** qamrab oladimi?
- ☐ O'zgargan **fayllar soni** promptda so'ralgan doiraga mos keladimi?
- ☐ **Diff hajmi** shubhali darajada katta emasmi? (Katta diff = ko'proq yashiringan xato ehtimoli)
- ☐ Test/lint/schema-check **avtomatik o'tganmi**?

### 3.2 Chuqur tekshiruv (yangi mantiq, JOIN, hisob-kitob bo'lganda)

- ☐ Kod **ikki marta o'qildi**: birinchi — funksionallik uchun, ikkinchi — faqat xavfsizlik/ma'lumot yaxlitligi uchun.
- ☐ **Chegaraviy holatlar** (bo'sh qiymat, NULL, 0, manfiy son) qo'lda tekshirildi.
- ☐ Agar kod mavjud jadval/ustunga tayansa (masalan `head_user_id`, `user_id`) — **haqiqiy ma'lumotlar bazasida** bir nechta qatorda qo'lda sinaldi, faqat agent hisobotiga ishonilmadi.
- ☐ O'zgarish **boshqa modulga** (masalan HR ↔ POS ↔ Ombor) ta'sir qilishi mumkinmi — tekshirildi.

### 3.3 Hisobotga ishonmaslik qoidasi

Agent "hammasi muvaffaqiyatli" yoki "barcha testlar o'tdi" deb yozishi natijaning to'g'riligini anglatmaydi. Har bir hisobotdan keyin **kamida bitta xulosa tasodifiy tanlangan nuqtada qo'lda tekshirilishi shart** — hisobotning o'zi emas, balki haqiqiy natija (ma'lumotlar bazasi, ekran, fayl) ko'zdan kechiriladi.

## 4. "Tezlik hissi" o'rniga kuzatiladigan ko'rsatkichlar

| ISHONMANG (hissiyot ko'rsatkichlari) | ISHONING (o'lchangan natija) |
|---|---|
| "Bugun necha feature qildik" hisoboti | Shu feature'lardan nechtasi 1 hafta o'tib ham ishlab turibdi |
| Agentning o'zi "tez va muvaffaqiyatli" degan bahosi | Ishlab chiqarishga yetib borgan va u yerda barqaror qolgan commit'lar soni |
| Yozilgan kod satrlari / commit'lar soni | Qaytarilgan (reverted) yoki qayta yozilgan kod ulushi |
| Jamoa "hammasi yashil" degan umumiy taassurot | Tasodifiy tanlangan nuqtalarda qo'lda tekshiruv natijasi |

## 5. EuroPrint uchun yuqori xavfli zonalar (ikki karra tekshiruv shart)

Quyidagi joylarda xato narxi ayniqsa yuqori — bu yerlarda 3.2-bo'limdagi chuqur tekshiruv har doim majburiy:

1. `employees.user_id` ↔ `org_departments.head_user_id` JOIN mantig'i (P0-3 ildiz sababi — hozircha faqat 18/142 to'ldirilgan).
2. Har qanday **backfill yoki bulk-update skripti** (Q-28 saboq: ruxsatsiz ishga tushirilgan skript filled=0 qaytargan, ya'ni sinab ko'rilmagan holda ishga tushgan).
3. **Sloy formulasi** hisob-kitoblari (m² ↔ list ↔ kg, marka+grammaj+sloy+chiqindi+kley) — noto'g'ri koeffitsient butun ombor hisobini buzadi.
4. **Ishlab chiqarish normalari** kiritish tizimi — birlik/varaq (unit/sheet) aralashib ketish xatosi allaqachon 11 ta dastgohda kuzatilgan.
5. **Kanban'dagi qattiq kodlangan ID'lar** — runtime lookup'ga o'tkazilishi kerak (masalan `WHERE name='EUROPRINT'`), aks holda muhitlar orasida ko'chirilganda buziladi.
6. **Boot-auto-run** kabi avtomatik ishga tushadigan jarayonlar — inson tasdig'isiz ishga tushmasligi kerak.

## 6. Roadmap fazalariga bog'lash (Faza 1-6)

Har bir faza yakunida quyidagi savol beriladi, faqat "vazifa bajarildi"mi emas:

- ☐ Shu fazada qo'shilgan funksiya **haqiqiy ma'lumotlar bilan** qo'lda sinaldimi (demo yoki sun'iy ma'lumot emas)?
- ☐ Oldingi fazada tuzatilgan narsa shu fazada ham **buzilmay turibdimi** (regressiya yo'qmi)?
- ☐ Agent hisobotidagi da'volar va haqiqiy natija o'rtasida **farq bor-yo'qligi** tekshirildimi?
- ☐ Faza yakunidagi "tezlik" taassuroti emas, balki **keyingi fazani boshlashga tayyorlik** darajasi baholandimi?

## 7. Maxboyning nazoratchi sifatidagi roli

Maxboy — loyihadagi yagona texnik bo'lmagan qaror qabul qiluvchi, shuning uchun "hammasi yashil ko'rinadi" xavfi unga eng ko'p ta'sir qiladi. Shu sababli:

1. Har bir agent sprint hisobotidan keyin **kamida bitta natija Claude bilan birga tasodifiy nuqtada qo'lda tekshiriladi** — hisobotning o'ziga emas, real natijaga qaraladi.
2. Claude hech qachon agent hisobotini "tasdiqlangan" deb tarjima qilmaydi — faqat **"agent shunday da'vo qildi, tekshirish natijasi quyidagicha"** deb yetkazadi.
3. Muddat bosimi kuchaygan paytlarda ham 2- va 3-bo'limdagi qoidalar **qisqartirilmaydi** — bosim ostida qisqartirish aynan Q-23/Q-28 kabi xatolarga olib kelgan.

---
*EuroPrint ERP — Ustoz rejimi hujjati. Rasmiy qo'shildi: 2026-07-02.*
