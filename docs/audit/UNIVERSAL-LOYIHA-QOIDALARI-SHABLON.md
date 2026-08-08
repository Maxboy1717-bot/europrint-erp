# UNIVERSAL LOYIHA QOIDALARI (har qanday loyiha uchun shablon)

> Bu — istalgan dasturiy loyihaga ko'chirib ishlatsa bo'ladigan umumiy qoidalar/metodologiya.
> Loyiha boshida agent (Claude Code / ijrochi) shu qoidalarga amal qiladi.
> `<...>` ichidagi joylarni o'z loyihangizga moslab to'ldiring.

═══════════════════════════════════════════════════════════════
## 0. ASOSIY FALSAFA
- **0.1.** TO'G'RILIK o'lchovi = **VIZYON** (loyiha hujjatlari), kod "ishlashi" emas. Kod xatosiz ishlasa-da, vizyonga zid bo'lsa = XATO.
- **0.2.** Tizim ~70% tayyor bo'lsa — **TUZAT va ULA**, qayta qurma. Butun qaytadan yozish — falokat (xavfli, sekin).
- **0.3.** Oson + Kuchli + Adolatli: foydalanish oddiy, nazorat kuchli, qarorlar dalil bilan.

## 1. ROLLAR & RUXSAT
- **1.1. Advisor (rejalashtiruvchi) = read-only** — vizyon/tahlil/promt yozadi, kod tegmaydi.
- **1.2. Bajaruvchi (ijrochi) = kod+commit** — bir vaqtda FAQAT BITTA bajaruvchi.
- **1.3. Subagent = faqat read-only tahlil** (kod yozmaydi, commit qilmaydi).
- **1.4. Ruxsat darvozasi:** har o'zgarishdan OLDIN `fayl:satr` + aynan o'zgarish + sabab → egasi "ha" demaguncha YO'Q.
- **1.5. ⛔ Tavsiya ≠ ruxsat:** audit/tahlil hisobotidagi "o'chir/tuzat" tavsiyasini hech kim o'z-o'zicha bajarmaydi.

## 2. ⭐ VERIFY-DON'T-TRUST (eng muhim saboq)
- **2.1.** Har audit/katalog/da'voni **ESKIRGAN** deb hisobla. "Bor/yo'q/buzuq" da'vosiga ishonma.
- **2.2.** Har narsani JONLI tasdiqla: kod o'qish + DB read-only so'rov + endpoint probe. Da'vo ko'pincha noto'g'ri/eskirgan chiqadi.
- **2.3.** "Yashil lekin noto'g'ri" (200 qaytaradi lekin DB'ga yozmaydi yoki noto'g'ri logika) — eng xavfli xato.

## 3. RE-AUDIT-FIRST (qurishdan oldin)
- **3.1.** Har modul/vazifadan oldin mavjud holatni **read-only xaritalab** ol: nima bor / nima yetishmaydi / qancha ish.
- **3.2.** Natijani egaga ko'rsat → tasdiqlatib keyin qurishga o't. **Tuzatishni tahlildan oldin boshlash TAQIQ.**

## 4. KOD SIFATI (har yangi kod)
- **4.1.** Bitta xato-boshqaruv pattern (mas. Result<T>) — `throw`/`return null` aralashtirilmaydi.
- **4.2.** Validatsiya har kirishda (schema bilan); xom/ishonchsiz input tekshiriladi.
- **4.3.** **`sql.raw(o'zgaruvchi)` / SQL-injection TAQIQ** — faqat parametrli so'rov.
- **4.4.** Fayl/funksiya hajmi cheklangan (mas. fayl ≤900, funksiya ≤150 qator) — oshsa bo'linadi.
- **4.5.** Magic-number TAQIQ — biznes raqamlari nomli konstantada.
- **4.6.** Qatlamlar aniq: controller=transport, biznes=service, DB=repository (aralashmaydi).
- **4.7. Fake/stub TAQIQ:** har forma REAL saqlaydi (kirit→saqla→qayta-och→ko'rinadi). Tayyor bo'lmasa — halol "tez orada" (501), yolg'on "saqlandi" emas.

## 5. ⛔ REGRESS TAQIQ
- **5.1.** O'chirilgan qayta yaratilmaydi; ishlayotgan funksiya egasi ruxsatisiz o'zgartirilmaydi.
- **5.2.** Har o'zgarishdan keyin avval ishlagan narsa HAMON ishlashi shart (verify bilan tasdiqlanadi).

## 6. BOSQICHMA-BOSQICH IJRO
- **6.1.** Vazifa paket/fazalarga bo'linadi; har paketdan keyin **hisobot** (done/defer/commit) → egasi ko'rib "davom" → keyingisi.
- **6.2.** Boshlangan ish to'liq tugatiladi; "keyin" qism hujjatga belgilanadi (tegilmaydi/o'chirilmaydi).
- **6.3.** Massiv ijro emas, bittalab: faqat bir xil naqshli ishlar (rename/migration) guruhlanadi.

## 7. "TAYYOR" TA'RIFI (DoD) — har modul
1. Backend real (CRUD + DB + validatsiya) · 2. Frontend real (saqlaydi, loading/error) · 3. Hujjat · 4. Test (unit + integratsiya + E2E) · 5. Tarjima/i18n · 6. Hamma edge-case (xato/bo'sh/ruxsatsiz/chegara) · 7. Avtomatlashtirish (imkon qadar qo'lda emas).
> Backend va frontend **PARALLEL** — biri yarim qolmaydi.

## 8. MA'LUMOT & KANONIKLIK
- **8.1.** Har tushuncha uchun **bitta kanonik jadval/manba** — dublikat ("ikki dunyo") TAQIQ.
- **8.2.** Yangi jadval oldidan: shu tushuncha uchun boshqa nomli jadval bormi? Bo'lsa MAVJUDNI ishlat.
- **8.3.** Yangi jadval/migration = **egasi ruxsati** (faylда `APPROVED:` izoh). Idempotent (`IF NOT EXISTS`), additive.
- **8.4.** Bitta haqiqat manbai = loyiha hujjatlari (`docs/`); muhim qaror darrov yoziladi (qaror jurnali).

## 9. XAVFSIZLIK
- **9.1.** RBAC (rolga asoslangan ruxsat); maxfiy maydon — maydon darajasida himoya. Avval BE himoya, keyin FE filter.
- **9.2.** Data shifrlangan (at-rest + in-transit); maxfiy maydon qo'shimcha himoya.
- **9.3.** Zaxira (backup/replikatsiya); audit-log (kim/qachon/nima/IP).
- **9.4. Secret:** hardcode TAQIQ; subagentга berilmaydi; token mint TAQIQ; **log fayllar hech qachon commit qilinmaydi**.

## 10. DIZAYN (UI izchillik)
- **10.1.** Yagona dizayn-tizim: token (rang/spacing) + tayyor shablon. Yangi sahifa = shablon + props, **yangi dizayn EMAS**.
- **10.2.** Inline xom rang TAQIQ (faqat token). Tugma joylashuvi STANDART; tab ichida tab MAKS 2 daraja.

## 11. GIT & JARAYON
- **11.1.** `git add <aniq-fayl>` (add -A / add . TAQIQ — boshqa sessiya ishini supurmaslik uchun).
- **11.2.** Commit HAR bosqich; `git stash` ishlatilmaydi.
- **11.3.** Sessiya boshida: qoidalarni o'qi + `git status`/`log` + server/health + boshqa sessiya bor-yo'qligini tekshir.
- **11.4.** Ijrochi promtlari = **batafsil + aniq** (fayl/buyruq/misol bilan) + qoidalar bloki; egaga hisobotlar = foydalanuvchi tilida.

## 12. KUZATUV (traceability)
- **12.1.** Har operatsiya = unikal kod (mas. `<MODUL>-<###>`); kod logga tushadi → raqamга qarab operatsiya aniqlanadi.
- **12.2.** Modullar teng emas: poydevor/yadro modullar eng chuqur, qo'llab-quvvatlovchilar sodda (og'irlikка qarab mehnat).

═══════════════════════════════════════════════════════════════
## QURISH TARTIBI (umumiy)
1. **Vizyon** (qog'ozda, kodsiz) — tizim qanday ishlashi kerakligi to'liq aniqlanadi.
2. **Poydevor tozalash** — drift/fake/dublikat tuzatiladi (toza zamin).
3. **Data-model + oltin-ip** — bitta asosiy zanjir boshdan-oxir jonli (acceptance test).
4. **Modullar** — birma-bir, og'irlik tartibida (poydevor → yadro → qo'llab-quvvatlovchi).

> Har bosqich: re-audit → ruxsat → BE+FE parallel → verify (DB-proof) → DoD → commit → hisobot → "davom".
> ⭐ Eng muhim: **vizyon = to'g'rilik o'lchovi · verify-don't-trust · qayta-qurma, ula · ruxsatsiz o'zgartirma.**
