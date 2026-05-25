# EuroPrint i18n — Tarjima Sifat Xatolari (To'liq Audit)

**Generated:** 2026-05-21T18:03:09.371Z  
**Scope:** Frontend (55 ns) + Backend (6 ns) + POS Monitor — UZ Lotin + UZ Kirill + RU

**Jami xatoli keylar:** 107  
---

## Boshqarma xulosasi — xato turi bo'yicha

| Xato turi | Soni | Tavsif |
|---|---:|---|
| `C-ru-english` | 60 | RU qiymat ingliz so'zi (camelCase fallback) |
| `C-ru-identical-uz` | 55 | RU qiymat = UZ qiymat (tarjima qilinmagan) |
| `G-ru-too-short` | 16 | RU uzunligi UZ ning 0.33x dan kam (qisqartirilgan) |
| `A-uz-cyrillic` | 10 | UZ Lotin faylida Kirill harf bor — Rus matn copy-paste qilingan |
| `A-uz-russian` | 10 | UZ qiymat aslida butun rus tilida (xato!) |
| `E-missing-ru` | 8 | UZ kalit bor, RU tarjima yo'q |
| `D-brand` | 2 | Brand nomi (EuroPrint, Telegram, Apple) tarjima/transliterate qilingan — saqlanishi shart |
| `G-ru-too-long` | 2 | RU uzunligi UZ ning 3x dan ortiq (kontaminatsiya) |
| `B-cyr-latin` | 1 | uz-cyr faylda Lotin Uzbek so'z (auto-gen yetishmagan) |

### Soha bo'yicha taqsimlash

| Soha | Xato |
|---|---:|
| fe | 104 |
| pos | 3 |

### Eng dardli 15 namespace

| Namespace | Xato | Eslatma |
|---|---:|---|
| fe/common | 58 | eng katta namespace (8350 key) |
| fe/navigation | 13 | ⚠ ko'pi sidebar+topnav uchun yangi qo'shilgan key, UZ-placeholder RU (Yandex tarjima kutilmoqda) |
| fe/hr | 8 |  |
| fe/finance | 5 |  |
| fe/iot | 3 |  |
| fe/marketing | 3 |  |
| pos/pos-monitor | 3 |  |
| fe/director | 2 |  |
| fe/security | 2 |  |
| fe/settings | 2 |  |
| fe/variance | 2 |  |
| fe/ai | 1 |  |
| fe/crm | 1 |  |
| fe/design | 1 |  |
| fe/mro | 1 |  |

---

## Konkret muammo namunalari (har turdan top 20)

### A-uz-russian — 10 ta

UZ qiymat aslida butun rus tilida (xato!)

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/common` | `portretALabel` | A — Diqqat (Внимание) | А — Диққат (Внимание) | A — Внимание |
| `fe/common` | `portretBLabel` | B — Strategiya (Стратегия) | Б — Стратегия (Стратегия) | B — Стратегия |
| `fe/common` | `portretCLabel` | C — Nazorat (Контроль) | К — Назорат (Контроль) | C — Контроль |
| `fe/common` | `portretDLabel` | D — Ishonch (Уверенность) | Д — Ишонч (Уверенность) | D — Уверенность |
| `fe/common` | `portretELabel` | E — Energiya (Энергия) | Э — Энергия (Энергия) | E — Энергия |
| `fe/common` | `portretFLabel` | F — Qat'iyat (Решительность) | Ф — Қат'ият (Решительность) | F — Решительность |
| `fe/common` | `portretGLabel` | G — Bardosh (Оборона) | Г — Бардош (Оборона) | G — Оборона |
| `fe/common` | `portretHLabel` | H — Taktika (Тактика) | Ҳ — Тактика (Тактика) | H — Тактика |
| `fe/common` | `portretILabel` | I — Empatiya (Эмпатия) | И — Эмпатия (Эмпатия) | I — Эмпатия |
| `fe/common` | `portretJLabel` | J — Muloqot (Общение) | Ж — Мулоқот (Общение) | J — Общение |

### A-uz-cyrillic — 10 ta

UZ Lotin faylida Kirill harf bor — Rus matn copy-paste qilingan

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/common` | `portretALabel` | A — Diqqat (Внимание) | А — Диққат (Внимание) | A — Внимание |
| `fe/common` | `portretBLabel` | B — Strategiya (Стратегия) | Б — Стратегия (Стратегия) | B — Стратегия |
| `fe/common` | `portretCLabel` | C — Nazorat (Контроль) | К — Назорат (Контроль) | C — Контроль |
| `fe/common` | `portretDLabel` | D — Ishonch (Уверенность) | Д — Ишонч (Уверенность) | D — Уверенность |
| `fe/common` | `portretELabel` | E — Energiya (Энергия) | Э — Энергия (Энергия) | E — Энергия |
| `fe/common` | `portretFLabel` | F — Qat'iyat (Решительность) | Ф — Қат'ият (Решительность) | F — Решительность |
| `fe/common` | `portretGLabel` | G — Bardosh (Оборона) | Г — Бардош (Оборона) | G — Оборона |
| `fe/common` | `portretHLabel` | H — Taktika (Тактика) | Ҳ — Тактика (Тактика) | H — Тактика |
| `fe/common` | `portretILabel` | I — Empatiya (Эмпатия) | И — Эмпатия (Эмпатия) | I — Эмпатия |
| `fe/common` | `portretJLabel` | J — Muloqot (Общение) | Ж — Мулоқот (Общение) | J — Общение |

### D-brand — 2 ta

Brand nomi (EuroPrint, Telegram, Apple) tarjima/transliterate qilingan — saqlanishi shart

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/common` | `europrintPrintBosma` | europrint, print, bosma | europrint, принт, босма | европринт, печать, печать |
| `fe/common` | `europrintQuti` | #europrint, #quti | #europrint, #қути | #европринт, #коробка |

### C-ru-english — 60 ta

RU qiymat ingliz so'zi (camelCase fallback)

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/common` | `hrEmail` | HR email | HR эмаил | HR email |
| `fe/common` | `hhUzTelegram` | hh.uz, Telegram... | hh.uz, Telegram... | hh.uz, Telegram… |
| `fe/common` | `europrintPaper` | EuroPrint Paper... | EuroPrint Папер... | EuroPrint Paper... |
| `fe/common` | `instagram` | Instagram tarmog'i | Instagram тармоғи | Instagram |
| `fe/common` | `facebook` | Facebook ijtimoiy tarmog'i | Facebook ижтимоий тармоғи | Facebook |
| `fe/common` | `linkedin` | LinkedIn tarmog'i | ЛинкедИн тармоғи | LinkedIn |
| `fe/common` | `zplZebraZplIi` | ZPL — Zebra ZPL II | ZPL — Zebra ZPL II | ZPL — Zebra ZPL II |
| `fe/common` | `eplEltronEpl2` | EPL — Eltron EPL2 | EPL — Eltron ЭПЛ2 | EPL-Eltron EPL2 |
| `fe/common` | `appleSamsung` | Apple, Samsung... | Apple, Samsung... | Apple, Samsung... |
| `fe/common` | `macbookPro14` | MacBook Pro 14 | MacBook Про 14 | MacBook Pro 14 |
| `fe/common` | `openstreetmap` | OpenStreetMap xizmati | ОпенСтреетМап хизмати | OpenStreetMap |
| `fe/common` | `telegramInstagram` | Telegram, Instagram... | Telegram, Instagram... | Telegram, Instagram… |
| `fe/common` | `previousPassrateUpLatestPassrate` | previous.passRate ? "up" : latest.passRate | превиоус.пассРате ? "уп" : латест.пассРате | previous.passRate ? "up": latest.passRate |
| `fe/common` | `hrCapital9` | HR Capital №9 | HR Капитал №9 | HR Capital №9 |
| `fe/common` | `gpt4oMini` | GPT-4o Mini | GPT-4о Мини | GPT-4o Mini |
| `fe/common` | `alfaTexLlc` | Alfa-Tex LLC | Алфа-Тех LLC | Alfa-Tex LLC |
| `fe/common` | `kr20PercentLabel` | KR-20 % | KR-20 % | KR-20 % |
| `fe/common` | `oeeBreakdown` | OEE breakdown | OEE бреакдовн | OEE breakdown |
| `fe/common` | `batXxxxxxxxXxxx` | BAT-XXXXXXXX-XXXX | BAT-ХХХХХХХХ-XXXX | BAT-XXXXXXX-XXXX |
| `fe/common` | `manTgs18400` | MAN TGS 18.400 | MAN TGS 18.400 | MAN TGS 18.400 |

*+40 more — full list in `_audit_out/i18n-quality-errors.json`*

### C-ru-identical-uz — 55 ta

RU qiymat = UZ qiymat (tarjima qilinmagan)

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/common` | `hrEmail` | HR email | HR эмаил | HR email |
| `fe/common` | `europrintPaper` | EuroPrint Paper... | EuroPrint Папер... | EuroPrint Paper... |
| `fe/common` | `zplZebraZplIi` | ZPL — Zebra ZPL II | ZPL — Zebra ZPL II | ZPL — Zebra ZPL II |
| `fe/common` | `appleSamsung` | Apple, Samsung... | Apple, Samsung... | Apple, Samsung... |
| `fe/common` | `macbookPro14` | MacBook Pro 14 | MacBook Про 14 | MacBook Pro 14 |
| `fe/common` | `hrCapital9` | HR Capital №9 | HR Капитал №9 | HR Capital №9 |
| `fe/common` | `gpt4oMini` | GPT-4o Mini | GPT-4о Мини | GPT-4o Mini |
| `fe/common` | `alfaTexLlc` | Alfa-Tex LLC | Алфа-Тех LLC | Alfa-Tex LLC |
| `fe/common` | `kr20PercentLabel` | KR-20 % | KR-20 % | KR-20 % |
| `fe/common` | `oeeBreakdown` | OEE breakdown | OEE бреакдовн | OEE breakdown |
| `fe/common` | `ai` | 🤖 AI | 🤖 AI | 🤖 AI |
| `fe/common` | `manTgs18400` | MAN TGS 18.400 | MAN TGS 18.400 | MAN TGS 18.400 |
| `fe/common` | `k01A123Aa` | 01 A 123 AA | 01 А 123 AA | 01 A 123 AA |
| `fe/common` | `suppliersEuroprintUz` | suppliers.europrint.uz | супплиерс.europrint.uz | suppliers.europrint.uz |
| `fe/common` | `europrintCheckBot` | @europrint_check_bot | @эуропринт_чекк_бот | @europrint_check_bot |
| `fe/common` | `zavodUz` | zavod.uz | zavod.uz | zavod.uz |
| `fe/common` | `samarkandEuroprintUz` | samarkand.europrint.uz | самарканд.europrint.uz | samarkand.europrint.uz |
| `fe/common` | `aiPp` | AI PP: | AI PP: | AI PP: |
| `fe/common` | `grId` | GR ID * | GR ID * | GR ID * |
| `fe/common` | `poId` | PO ID * | PO ID * | PO ID * |

*+35 more — full list in `_audit_out/i18n-quality-errors.json`*

### E-missing-ru — 8 ta

UZ kalit bor, RU tarjima yo'q

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/hr` | `HRDashboard.hujjatOqimi` | Hujjat Oqimi | Ҳужжат Оқими |  |
| `fe/hr` | `HRDashboard.kunlikHisobot` | Kunlik Hisobot | Кунлик Ҳисобот |  |
| `fe/hr` | `HRDashboard.pipRejalar` | PIP Rejalar | PIP Режалар |  |
| `fe/hr` | `HRDashboard.malakalarMatritsasi` | Malakalar Matritsasi | Малакалар Матрицаси |  |
| `fe/hr` | `departments` | Bo'limlar | Бўлимлар |  |
| `fe/marketing` | `analytics` | Analitika | Аналитика |  |
| `pos/pos-monitor` | `movements.actions.DRAFT` | Tahrirlash,Bekor qilish,Karantinga yuborish | Таҳрирлаш,Бекор қилиш,Карантинга юбориш |  |
| `pos/pos-monitor` | `movements.actions.QC_PENDING` | Qabul,Qayta ishlash,Chiqarish | Қабул,Қайта ишлаш,Чиқариш |  |

### B-cyr-latin — 1 ta

uz-cyr faylda Lotin Uzbek so'z (auto-gen yetishmagan)

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/crm` | `acceptPayment` | TO'LOVNI QABUL QILISH | TO'LOVNI QABUL QILISH | ПРИНЯТЬ ОПЛАТУ |

### G-ru-too-short — 16 ta

RU uzunligi UZ ning 0.33x dan kam (qisqartirilgan)

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/ai` | `xatolar` | Xatoliklar ro'yxati | Хатоликлар рўйхати | Ошибки |
| `fe/common` | `buyurtmalar` | Buyurtmalar ro'yxati | Буюртмалар рўйхати | Заказы |
| `fe/common` | `ishdanBoshatilgan` | Ishdan bo'shatilgan | Ишдан бўшатилган | Уволен |
| `fe/common` | `imtiyozlar` | Imtiyozlar ro'yxati | Имтиёзлар рўйхати | Льготы |
| `fe/common` | `facebook` | Facebook ijtimoiy tarmog'i | Facebook ижтимоий тармоғи | Facebook |
| `fe/common` | `feedbacklar` | Mulohazalar ro'yxati | Мулоҳазалар рўйхати | Отзывы |
| `fe/common` | `partiyalar` | Partiyalar ro'yxati | Партиялар рўйхати | Партии |
| `fe/common` | `rezervatsiya` | Rezervatsiya tasdiqi | Резервация тасдиқи | Резерв |
| `fe/common` | `sessiyalar` | Sessiyalar ro'yxati | Сессиялар рўйхати | Сессии |
| `fe/common` | `kengashlar` | Kengashlar ro'yxati | Кенгашлар рўйхати | Советы |
| `fe/common` | `funnel` | Konvertatsiya voronkasi | Конвертация воронкаси | Воронка |
| `fe/common` | `sessiya` | Sessiya identifikatori | Сессия идентификатори | Сессия |
| `fe/common` | `chiqindilar` | Chiqindilar ro'yxati | Чиқиндилар рўйхати | Отходы |
| `fe/director` | `benchmark` | Taqqoslash standarti | Таққослаш стандарти | Эталон |
| `fe/hr` | `employee.status.terminated` | Ishdan bo'shatilgan | Ишдан бўшатилган | Уволен |
| `fe/mro` | `decommissioned` | Hisobdan chiqarildi | Ҳисобдан чиқарилди | Списан |

### G-ru-too-long — 2 ta

RU uzunligi UZ ning 3x dan ortiq (kontaminatsiya)

| Namespace | Key | UZ | uz-cyr | RU |
|---|---|---|---|---|
| `fe/variance` | `mqv` | MQV qiymati | MQV қиймати | MQV (отклонение количества материала) |
| `fe/variance` | `lev` | Daraja | Даража | LEV (отклонение эффективности труда) |

---

## Tavsiya etiladigan tuzatishlar (prioritet)

### 🔴 Darhol — kritik xatolar (~136 ta)
- **112 A-uz-russian:** UZ faylida rus matn — auto skript ishlatib, rus qiymatlarni RU faylga ko'chirib, UZ uchun yangi Uzbek tarjima yozish kerak
- **6 D-brand:** EuroPrint, Telegram, Apple va boshqa brand nomlari uch tilda BIR XIL bo'lishi shart
- **24 E-missing-ru:** UZ kalit bor, RU yo'q — to'ldirish kerak
- **15 C-ru-uzbek:** RU faylda Uzbek so'z — copy-paste xato, tuzatish kerak

### 🟡 O'rta — Yandex API kelganda avto-fix bo'ladi (~620 ta)
- 370 C-ru-identical-uz + 250 C-ru-english — bularning ko'pi navigation.json yangi keylari (sidebar+topnav UZ-placeholder), Yandex Translate 5 daqiqada hammasini tarjima qiladi

### ⚪ Diqqat — false positive ehtimoli
- 112 A-uz-cyrillic — ba'zilar ataylab Kirill (mas. "language.ru" = "Русский"), boshqalari xato
- 68 A-uz-stub — ba'zilar tech nomlar (mas. "androidApp"), boshqalari haqiqiy stub

---

## Mashina o'qiy oladigan ma'lumotlar

Full list: `_audit_out/i18n-quality-errors.json` (har bir item uchun ns, key, uz, cyr, ru, errors[])

Qayta ishga tushirish:
```bash
node _audit_out/i18n-quality-validator.mjs
node _audit_out/build-quality-errors-md.mjs
```