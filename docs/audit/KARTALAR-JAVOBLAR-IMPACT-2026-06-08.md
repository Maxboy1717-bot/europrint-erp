# KARTALAR (01) — Javoblar + Prompt + Cross-modul ta'sir xaritasi (2026-06-08)

> Egasi: KARTALAR 42 savol = HAMMASI **A** (vizyon). Q9 tuzatish: razryad = QO'LDA SOZLANADIGAN master-data.
> Har javob: **📝 prompt** (qurish ko'rsatmasi) + **⤳ ta'sir** (qaysi modullar/zanjir/algoritm o'zgaradi).
> Maqsad (egasi): bitta javob A→Z qaysi modullarga ta'sir qilsa — yozib borish (oltin ipni kuchaytirish).

## ⚡ Eng kuchli cross-modul ripplelar (bitta javob → ko'p modul)
| Javob | Asosiy ta'sir |
|---|---|
| Q1 Karta=master-data | **HAMMA 20 modul** (har modul `card_id`'ga ulanadi) |
| Q23 RBAC kartadan | **Auth + HAMMA modul** (ruxsat) + CC (tasdiq) + POS |
| Q24 Oylik turi kartada | **Finance/Payroll oylik SIYOSATI** + HR + Director (xarajat) ← *sizning misolingiz* |
| Q30 Markaziy AI moslik | **AI** + ma'lumot manbai: MES/QC/HR/LMS/davomat |
| Q40 Bitta DDL | **HAMMA** (yagona struktura) + IoT (kamera) + data-integrity |
| Q41 Org-kaskad | **POS** (avto-ombor) + Auth/RBAC + HR (adaptatsiya) + CC (shartnoma) |

---

## 42 javob — prompt + ta'sir

**Q1 Karta=master-data = A.** 📝 Har lavozim-o'rindiq `cards` jadvalida; barcha modul `card_id` orqali ulanadi. ⤳ **HAMMA modul** (oylik/ruxsat/hisobot kartadan); algoritm: universal `card_id` FK.

**Q2 1 o'rindiq=1 xodim = A.** 📝 1 karta=1 seat=1 xodim; dublikat lavozim → 01/02. ⤳ HR (binding), Payroll (har karta alohida oylik), Reports.

**Q3 Kartasiz oylik/ERP yo'q = A.** 📝 `card_id` NULL → login YO'Q + oylik YO'Q. ⤳ **Auth** (login-gate), **Payroll** (oylik-gate), HR.

**Q4 1 xodim ko'p karta = A.** 📝 xodim↔karta = many; oylik = kartalar yig'indisi. ⤳ **Payroll** (yig'indi algoritm), HR, Reports (daraxtda har joyda).

**Q5 Karta o'chmaydi = A.** 📝 karta = soft-delete (arxiv/vakant), tarix qoladi. ⤳ HAMMA (FK saqlanadi), Reports (tarix), HR.

**Q6 Ketsa profil muzlaydi = A.** 📝 xodim ketsa profil freeze, karta vakant, qaytsa restore. ⤳ HR, **Auth** (kirish bloki), Payroll (to'xtaydi).

**Q7 6-bo'lim papka = A.** 📝 har karta: vazifa/javobgarlik/GSD/reglament/jarayon/ta'lim + to'liqlik%. ⤳ **LMS** (ta'lim bo'limi), **Director** (reglament/jarayon), HR.

**Q8 Razryad har kartada = A.** 📝 har kartada `razryad` maydoni. ⤳ **Payroll** (razryad→oylik), HR, LMS (imtihon).

**Q9 Razryad shkala = QO'LDA SOZLANADIGAN master-data (tuzatildi).** 📝 `razryad_levels` jadval — egasi darajalar + har birining HAMMA datasini (nom/talab/oylik-band/imtihon/sertifikat) sozlaydi. ⤳ **HR/Settings** (master-data setup), **Payroll** (oylik band), Admin. ↳ *Yangi savollar tug'iladi: razryad maydonlari qaysi? (keyingi turda).*

**Q10 Razryad o'sishi (imtihon→HR+rahbar) = A.** 📝 imtihon o'tadi → HR + yuqori rahbar tasdiq → razryad o'zgaradi. ⤳ **LMS** (imtihon), HR, **Coordination** (tasdiq), Payroll.

**Q11 Imtihon min 3 oy = A.** 📝 2 imtihon orasi ≥3 oy, xodim o'zi murojaat. ⤳ LMS, HR.

**Q12 Razryad pasayishi = A.** 📝 razryad tushishi ham (HR+rahbar tasdiq). ⤳ **Payroll**, HR, QC (sifat tushsa sabab).

**Q13 O'zgarsa HR hujjat+sertifikat = A.** 📝 razryad o'zgarsa hujjat+ichki sertifikat majburiy. ⤳ **CC/Hujjat**, **LMS** (sertifikat), HR.

**Q14 GSD/ЦКП kartaga = A.** 📝 har kartada GSD: maqsad+birlik+chastota. ⤳ **Director** (otdeleniye GSD), **AI** (baholash), HR (haftalik), **Notifications** (bot so'rov), Reports.

**Q15 ЦКП HR yozadi (matn+formula) = A.** 📝 ЦКП ta'rifini HR yozadi, format matn+formula. ⤳ HR, **AI** (ЦКП'dan savol tuzadi), Settings (stat-reglament).

**Q16 Mashinasiz ЦКП = AI-chatbot kunlik = A.** 📝 AI har kuni ЦКП'dan savol so'raydi → kunlik hisobot. ⤳ **AI**, **Notifications** (telegram), **Payroll** (hisobot→oylik), HR.

**Q17 Mashinachi ЦКП = IoT/MES avto = A.** 📝 operator ЦКП avtomatik IoT/MES'dan. ⤳ **IoT**, **MES**, AI, Payroll. ↳ *IoT↔MES↔karta ulanishi qurilishi kerak.*

**Q18 16-soat hisobot bermasa oylik yo'q = A.** 📝 16s ichida ЦКП yo'q → o'sha kun oylik yo'q; tiklash HR→direktor. ⤳ **Payroll** (kun-gate), HR, **Coordination** (direktor), Notifications.

**Q19 7-otdeleniye raqami = A.** 📝 har kartada `otdeleniye_no` (1-7). ⤳ **Director** (otdeleniye GSD), HR, Reports, Coordination.

**Q20 Otdeleniye GSD-metrika = A.** 📝 har otdeleniyaga bosh metrika. ⤳ **Director**, AI, Reports.

**Q21 Daraxt har node=karta = A.** 📝 yagona daraxt, node=karta, 7 qatlam, ota-karta=rahbar. ⤳ **HAMMA** (rahbar zanjiri), **Coordination** (eskalatsiya), Org.

**Q22 Vakant rahbar sakrash yo'q = A.** 📝 rahbar vakant → quyi rahbarsiz ishlaydi, sakrash yo'q. ⤳ **Coordination** (eskalatsiya yo'q), **Finance** (approval-matrix), CC (marshrut).

**Q23 RBAC kartadan = A.** 📝 ko'rish/qilish/tasdiq = kartadan; karta o'zgarsa ruxsat o'zgaradi. ⤳ **Auth/Security + HAMMA modul** + CC (tasdiq) + POS.

**Q24 Oylik turi kartada = A.** 📝 har kartada oylik_turi (soat/kun/ishbay)+bonus; oylik kartadan. ⤳ **Finance/Payroll OYLIK SIYOSATI** + HR + Director (xarajat). ← *sizning misolingiz: org-karta javobi = moliya siyosati o'zgarishi.*

**Q25 Bonus KPI'siz sozlanadi = A.** 📝 bonus = HR/Moliya/rahbar sozlaydigan tizim, KPI yo'q. ⤳ **Finance/Payroll**, HR, Settings.

**Q26 Oylik tasdiq zanjiri = A.** 📝 avto-hisob → HR+Moliya tasdiq → rahbar. ⤳ **Finance**, HR, **Coordination** (oqim), CC.

**Q27 Darslik tugamasa oylik yo'q = A.** 📝 karta darsligi tugamasa → o'sha karta oyligi to'xtaydi. ⤳ **LMS**, **Payroll** (gate), HR.

**Q28 Darslik kartaga = A.** 📝 darslik kartaga biriktiriladi, xodim emas. ⤳ **LMS**, HR (yangi xodim avto-oladi).

**Q29 Darslik o'quv-bo'limi→AI→HR+rahbar = A.** 📝 o'quv bo'limi yozadi → AI tekshiradi → HR+rahbar tasdiq. ⤳ **LMS**, **AI**, Coordination.

**Q30 Markaziy AI moslik = A.** 📝 bitta markaziy AI har karta↔xodim mosligini baholaydi. ⤳ **AI** + manba: **MES/QC/HR/LMS/davomat/ЦКП**; eng ko'p ulanishli.

**Q31 AI hisobot kimga = A.** 📝 moslik PDF → xodim+rahbar+HR (mos darajada). ⤳ AI, CC (tarqatish), Notifications, RBAC.

**Q32 Ko'nikma-matritsa+vorislik = A.** 📝 skill-matrix + AI vorislar ro'yxati. ⤳ **AI**, **HR** (recruitment/vorislik), LMS.

**Q33 Ko'nikma qo'shish (test) = A.** 📝 da'vo→test→raport→matritsa. ⤳ **LMS**, HR, AI.

**Q34 3-kun blok = A.** 📝 3 kun ЦКП yo'q → avto-blok; ochish HR→direktor→superadmin. ⤳ **Auth** (blok), HR, **Coordination** (direktor), Notifications, Payroll.

**Q35 Smena alohida jadval = A.** 📝 smena/ish-vaqti alohida jadval, kartaga ulanadi. ⤳ **MES** (smena), HR (davomat), Payroll (soatbay), IoT (vaqt).

**Q36 Karta ko'rinishi = A.** 📝 rang = otdeleniye/holat, standart kattalik. ⤳ Org-UI, **Design-system** (token).

**Q37 Karta raqamlash 01/02 = A.** 📝 dublikat kartalar 01/02/03. ⤳ Org, HR, Payroll.

**Q38 Vakansiya→recruitment→karta = A.** 📝 vakant → HR talabnoma → recruitment → karta-binding. ⤳ **HR** (recruitment), CC (talabnoma), AI (vorislar), Org.

**Q39 Migratsiya mavjudni yaxshilash = A.** 📝 142 node + 30 xodim saqlanadi, ustiga karta-qatlam. ⤳ **HAMMA** (mavjud data saqlanadi), Org.

**Q40 Bitta DDL ikki-olam yo'q = A.** 📝 yagona org-struktura, 2-dept-olam birlashtiriladi. ⤳ **HAMMA**, IoT (kamera ulanadi), data-integrity.

**Q41 Org-kaskad = A.** 📝 yangi bo'lim/transfer → avto: POS-ombor, RBAC, adaptatsiya, shartnoma. ⤳ **POS + Auth/RBAC + HR + CC** (kuchli kaskad).

**Q42 Maxfiylik (oylik ko'rinishi) = A.** 📝 oylik/AI-baho/razryad-tarix faqat ruxsatli kartalarga. ⤳ **RBAC**, Finance, HR, Security.

---

## Zanjir-xulosa (oltin ip kuchayishi)
- **OYLIK zanjiri:** Q3+Q4+Q8+Q9+Q18+Q24+Q25+Q26+Q27+Q34 → **Finance/Payroll** moduli (oylik siyosati to'liq kartadan). Finance modulini qurganda BU javoblar shart.
- **RUXSAT zanjiri:** Q23+Q42 → Auth + har modul.
- **ЦКП/AI zanjiri:** Q14+Q15+Q16+Q17+Q30+Q31 → AI + IoT/MES/Director/Notifications.
- **TA'LIM zanjiri:** Q7+Q13+Q27+Q28+Q29+Q33 → LMS + Payroll-gate.
- **KASKAD zanjiri:** Q21+Q22+Q38+Q41 → POS/RBAC/HR/CC/Coordination.

➡️ Demak KARTALAR qurish promti yozilganda — bu **ta'sirlar** ham unga kiradi (faqat org emas, oylik-gate/RBAC/AI-hook'lar ham). Va Finance/LMS/AI modullariga o'tganda — bu javoblar **allaqachon hal qilingan** deb olinadi.
