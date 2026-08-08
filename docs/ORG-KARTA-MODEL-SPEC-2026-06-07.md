# ORG KARTA-MODEL — YAXLIT SPEC (vizyon)

> **Sana:** 2026-06-07 · **Manba:** egasi bilan 8 rondli intervyu + jonli tahlil (`docs/audit/org-vision-analysis-2026-06-07.md`)
> **Maqsad:** org-strukturaning to'liq vizyoni — tasdiqlash uchun. Tasdiqlangach → bosqichma-bosqich ijro.
> **Status:** TASDIQ KUTILMOQDA (egasi).

═══════════════════════════════════════════════════════════════
## 1. YADRO FALSAFA
═══════════════════════════════════════════════════════════════
- ⭐ **Karta asosiy, xodim ikkilamchi.** Karta (rol) avval mavjud → kompaniya unga **mos xodim qidiradi** ("xodimga karta emas — kartaga xodim").
- **Karta = to'g'ri ishning ta'rifi.** Kartadagi hammasi to'g'ri bo'lsa → xodim ham to'g'ri ishlaydi.
- ⭐ **Asosiy kapital = xodimlar** → shu sababli org-karta modeli butun ERP ning **MASTER DATA**'si.

═══════════════════════════════════════════════════════════════
## 2. DARAXT (struktura)
═══════════════════════════════════════════════════════════════
- Org = **bitta DARAXT, har NODE = KARTA**. Karta = **ham bo'lim, ham lavozim**.
- **Egasi = ildiz** (yagona rahbarsiz karta). **7 qatlam** (hozirgi tuzilma to'g'ri — **tartib saqlanadi**).
- Har karta: **ota-karta = rahbari** + **bola kartalar** (quyi). ⭐ **Rahbarsiz xodim yo'q** (Egasidan tashqari).
- **Vakant rahbar** → pastdagilar **rahbarsiz ishlayveradi** (eskalatsiya/sakrash YO'Q), rahbar tayinlanguncha.

═══════════════════════════════════════════════════════════════
## 3. KARTA TARKIBI
═══════════════════════════════════════════════════════════════
Lavozim+bo'lim · **razryad** · **portret** (=kerakli xodim ta'rifi) · **talab** (HR belgilaydi) · **oylik** · **darslik** · **ЦКП** · **ko'nikma** · **ish-vaqti/smena** · **ruxsatlar (RBAC)** · **hozirgi-holat** · **biriktirilgan xodim (rasm bilan)** · **raqam** (dublikatда 01/02) · **to'liq tarix**.

═══════════════════════════════════════════════════════════════
## 4. KARTA ↔ XODIM
═══════════════════════════════════════════════════════════════
- **1 karta = 1 o'rindiq = 1 xodim.** Bir xil rol → **dublikat** (01, 02, ...; hammasi alohida).
- Xodim **ko'p karta** egallaydi → **oylik = yig'indi**; daraxtда **har karta joyida** ko'rinadi (rasm bilan); profilga bitta bo'lib tushadi (qaysi karta — belgilanadi).
- ⭐ **Kartasiz → oylik yo'q, ERP'ga kirish yo'q.**
- Xodim ketsa → **profil muzlaydi, karta qoladi**, voris egallaydi, **tarix saqlanadi** (nima qilgan, qayerda to'xtagan). Muzlatilgan profil **tiklanadi** (qaytsa).

═══════════════════════════════════════════════════════════════
## 5. RUXSATLAR (RBAC)
═══════════════════════════════════════════════════════════════
⭐ **Karta = ruxsat.** Karta xodim ERP'da nimani **ko'rishi / qilishi / tasdiqlashi** mumkinligini belgilaydi. (Vizyon "kim ko'radi / kim tasdiqlaydi" — kartadan keladi.)

═══════════════════════════════════════════════════════════════
## 6. RAZRYAD + O'SISH
═══════════════════════════════════════════════════════════════
- **Razryad hamma kartada**; **dinamik** — xodim o'ssa **kartaning razryadi ko'tariladi** (o'sha karta).
- **Imtihon:** xodim belgilaydi (**min 3 oy** oraliq) → o'tsa razryad o'zgaradi → **HR hujjat biriktiradi + ichki sertifikat**.
- O'sish **avtomatik EMAS:** **HR + yuqori rahbariyat** tasdiqlaydi.
- **Razryad-o'sish (o'sha karta) ≠ boshqa kartaga (lavozim) o'tish** (u — boshqa kartaning imtihonlari).
- **Pasayish** bo'ladi (qoladi / ko'tariladi / tushadi).

═══════════════════════════════════════════════════════════════
## 7. OYLIK
═══════════════════════════════════════════════════════════════
- **Per-karta.** Turlari (lavozimga qarab): **soatbay / kunbay / ishbay** + **bonus** (kartada).
- **Bonus = sozlanadigan tizim** (HR / Moliya / rahbar belgilaydi). KPI YO'Q.
- **Avtomatik hisoblanadi** → **HR + Moliya tasdiq → rahbarga**.
- **Darslik tugamasa → o'sha karta oyligi yo'q.**

═══════════════════════════════════════════════════════════════
## 8. ЦКП
═══════════════════════════════════════════════════════════════
- **HR belgilaydi**; format = **matnli tavsif + formula**.
- **Mashinasiz xodim:** AI tavsif/formuladan **savollar tuzadi** → kartaga biriktirilgan xodimdan **kunlik so'raydi** (chat/bot). Bu = kunlik hisobot.
- **Mashinachi:** ЦКП **avtomatik IoT/MES'dan** (ulash kerak).
- **16 soat** ichida hisobot bermasa → o'sha kun **oylik yozilmaydi**; o'tkazib yuborsa → **HR raport → direktor tasdiq → qo'shiladi**.

═══════════════════════════════════════════════════════════════
## 9. DARSLIK (LMS — kartaga, xodimga emas)
═══════════════════════════════════════════════════════════════
O'quv bo'limi **qo'lda** tayyorlaydi → **AI nazorat + hisobot** → **HR qaror** → **rahbar tasdiq**. Tugamasa → o'sha karta oyligi yo'q.

═══════════════════════════════════════════════════════════════
## 10. MARKAZIY AI (bitta)
═══════════════════════════════════════════════════════════════
Bitta markaziy AI; xodimni **login orqali tanib**, karta-ma'lumotidan ishlaydi. Vazifalari:
- Xodim↔karta **mosligini baholaydi** (ЦКП, test, davomat, sifat, rahbar-baho + boshqa xodimlar bilan solishtirish).
- **PDF hisobot** → xodim / rahbar / HR.
- **Chatbot o'qitish** (ЦКП savollari, karta ma'lumoti).
- **Qoida-buzilish** aniqlash (AI-kamera / AI / rahbar / HR).
- **Ko'nikma-matritsa → vorislar ro'yxati** (sabab bilan — ichki o'sish: masalan ko'nikmali farrosh → HR vakansiyaga, farroshni qayta ol).
- **3 kun yo'q → profil bloklanadi** → ochish: **HR raport → direktor tasdiq → super admin ochadi**.

═══════════════════════════════════════════════════════════════
## 11. KO'NIKMA · 12. ISH-VAQTI
═══════════════════════════════════════════════════════════════
- **Ko'nikma:** xodim "menda bor" deydi → **test** → raport → **ko'nikma-matritsaga**.
- **Ish-vaqti/smena:** kartada **yoki** alohida jadval (kartaga ulanadi). Davomat (3-kun blok) shunga bog'liq.

═══════════════════════════════════════════════════════════════
## 13. HAYOT-SIKL
═══════════════════════════════════════════════════════════════
- Karta **HR yaratadi**; ⭐ **O'CHMAYDI** (faqat tahrir + **to'liq tarix saqlanadi**).
- **Vakansiya:** karta bo'shasa → vakant → **HR talabnoma → recruitment** (✅ hozir bor) → ⚠️ **kartaga biriktirish YO'Q → qurish kerak**.

═══════════════════════════════════════════════════════════════
## 14. ⭐ DATA PRINSIPI
═══════════════════════════════════════════════════════════════
Hamma data **BITTA DDL/jadval struktura, sinxron** (ikki-olam YO'Q). AI-kamera + barcha modul shunga ulanadi.

═══════════════════════════════════════════════════════════════
## 15. MIGRATSIYA
═══════════════════════════════════════════════════════════════
**Mavjudni** (142 org-node + 30 xodim) **yaxshilab, vizyonga olib boramiz** (noldan EMAS). 7-qatlam tartibi saqlanadi.

═══════════════════════════════════════════════════════════════
## 16. HOZIRGI HOLAT ↔ VIZYON (qurish kerak — jonli tahlildan)
═══════════════════════════════════════════════════════════════
Skelet QURILGAN (142 node, RBAC), lekin karta-qatlam YO'Q:
- `head_user_id` **18/142** · `manager_id` **0/30** · `workflow_rules` jadval **YO'Q** · `tskp` (ЦКП) **0/97** · **2 dept olami** · daraja drift.
- YO'Q: karta=ruxsat ulanishi · razryad-dinamika · karta-AI/ЦКП-bot · ko'nikma-matritsa/vorislar · recruitment→karta binding · mashina→ЦКП (IoT/MES) · per-karta oylik (soat/kun/ish+bonus).

═══════════════════════════════════════════════════════════════
## PART B — QO'SHIMCHALAR (BARCHA_JAVOBLAR.md + .docx study) → `docs/audit/org-study-2026-06-07.md`
═══════════════════════════════════════════════════════════════
**B1. 7-otdeleniye NOMLANGAN + node-tur enum:** turlari `COMPANY→OTDELENIYE→DEPARTMENT→SECTION→SECTOR`; 7 otdeleniye nomlangan. [md L901-909]
**B2. ⭐ HUJJAT WORKFLOW ENGINE (spec'da yo'q edi):** org-sxemadan AVTOMATIK marshrut (tizim o'zi chizadi) · VERTIKAL keyin GORIZONTAL, **pog'ona sakramaslik** · admin sozlaydi · per-hujjat SLA (ta'til 24h/avans 4h) · **imzo:** rahbar FIZIK imzo → xodim ERP-status → telegram-bot imzolovchiga → tasdiq/rad. [md Q77-Q122]
**B3. Org-birlik + lavozim ANIQ maydonlari:** birlik = kod·tur·ota-birlik·**AI-kamera-zona**·**Telegram-guruh-ID**·ERP-rol-ID; lavozim = KPI/ЦКП-shablon·mentor·adaptatsiya. [docx L23929-31]
**B4. Org-o'zgarish KASKADLARI:** yangi bo'lim → **POS ombor avto-yaratiladi**; transfer → adaptatsiya qayta + **RBAC qayta** + yangi shartnoma. [md Q188]
**B5. Kunlik ЦКП operatsion sikl + 4 nazorat:** AI-kamera hisobot↔haqiqat kross-tekshiruv · peer-review · dashboard-% · har kunlik hisobot = **rasmiy invoice-PDF**. [md Q116-120]
**B6. Rekruting → karta binding + ichki vakansiya + karyera:** 7-bosqich kanban + **Gemini-LIVE video-intervyu** (per-lavozim rezyume+savol-banki, xulq-bahosi, rad-arxiv) → **kartaga biriktirish** · Internal Job Posting · karyera narvoni + per-lavozim voris. [md Q4/Q62/Q134/Q168]
**B7. Arxiv + ACL:** saqlash **rahbar 10y / ishchi 3y**; per-hujjat ACL (maxfiy — kim ko'radi). [md Q73/Q43]
**B8. ⚠️ position_folders MAVJUD (tuzatish):** "lavozim papkasi yo'q" NOTO'G'RI — `position_folders` jadval+CRUD+4 endpoint BOR (hujjat/video/test+LMS). PARTIAL: 0 qator, FE ulanmagan. [position-folder.repository.ts:21-88]

**⭐ #1 BLOKER:** skelet QURILGAN (142-node+CRUD+FE+30/30 xodim-link+portret+resolver — real), lekin **rahbarlik/identity DATA hech qachon kiritilmagan** (head_user_id 18/142 · manager_id 0/30 · tskp 0/97 · portret 0 · workflow_rules yo'q). **Eng katta blok = SIZNING org-data'ngiz (kim qaysi node'ga rahbar) — faqat siz/HR.**

═══════════════════════════════════════════════════════════════
## 17. KEYINGI
═══════════════════════════════════════════════════════════════
Spec **tasdiqlangach** → bosqichma-bosqich ijro (har bo'lak: tahlil → qaror → ijro → DB-proof → tasdiq). Asosiy kapital — shoshilmaymiz, puxta quramiz.

**⭐ BUILD BOSQICHLARI (2026-06-07 — boshlandi):**
1. **PHASE 1 — Daraxt jonli (DDL YO'Q):** manager_id auto-derivatsiya (parent-node head · o'zgaruvchan daraxt · no-skip · self-heal) + head-tayinlash FE to'liq + resolver ishlasin. → **#1 blokerni ochadi** (data kiritish + zanjir).
2. **PHASE 2 — KARTA birlashishi (DDL):** node+lavozim+razryad+talab+portret+**ruxsat (RBAC)** birlashgan karta modeli; razryad dinamikasi.
3. **PHASE 3 — ЦКП sikl (DDL):** ЦКП-shablon (HR) + kunlik hisobot (AI savol / mashina IoT-MES) + 16h-gate + invoice-PDF + 4 nazorat.
4. **PHASE 4 — Hujjat workflow engine (DDL):** `workflow_rules` jadval + vertikal→gorizontal (no-skip) routing + imzo oqimi (telegram).
5. **PHASE 5 — Rekruting→karta binding + LMS-per-karta + AI** (vorislar/ko'nikma-matritsa/Gemini-video).
6. **PHASE 6 — Kaskadlar + arxiv + ACL + per-karta oylik** (soat/kun/ish+bonus).
⚠️ PHASE 2+ = DDL (har biri egasi ruxsati, Q-35). ⚠️ Parallel TRACK: egasi/HR **org-DATA** kiritadi (kim qaysi node'ga rahbar) — kodsiz bu jonlanmaydi.
