# AIsha — Rahbar uchun Ovozli AI Yordamchi

> **Mahsulot nomi:** AIsha (AI + sha)
> **Tur:** Standalone modul EuroPrint ERP ichida
> **Foydalanuvchi:** **Faqat bosh rahbar** (1 kishi)
> **Asosiy g'oya:** "Aisha" deganda faollashadi, faqat ovoz orqali ERP'ni boshqaradi
> **Dizayn:** Zamonaviy minimal (Linear / Apple / Vercel uslubi)
> **Sana:** 2026-05-15

---

## 1. Konsepsiya

AIsha — **bosh rahbar uchun ovozli AI yordamchi**. Rahbar ofisida o'tirib yoki yo'lda yurib, ekranga qaramasdan ovoz orqali ERP'dan ma'lumot olishi va buyruq berishi mumkin.

**Foydalanuvchi tajribasi:**

```
[Rahbar ish stolida o'tiribdi, kompyuter yonida]

Rahbar:  "Aisha"
AIsha:   [♪ pulse] "Tinglayman."
Rahbar:  "Bugungi ishlab chiqarish qanday ketmoqda?"
AIsha:   "Bugun 12 000 box reja. Hozir 7 200 tayyor — 60%.
          Sex-3 sekinlashayapti, OEE 65%. Aralashish kerakmi?"

Rahbar:  "Sabab nima?"
AIsha:   "Mashina-4 da 22 daqiqalik to'xtash bor edi.
          Texnik Shavkat hozir tuzatmoqda."

Rahbar:  "Aisha, Akmal bugun ishga keldimi?"
AIsha:   "Ha, soat 8:12 da keldi. Hozir Sex-2 da."

Rahbar:  "Aisha, bo'lim boshliqlariga 16:00 da yig'ilish e'lon qil"
AIsha:   "5 ta bo'lim boshlig'iga Telegram orqali xabar yuborilsinmi?
          Adabiyot: 'Bugun 16:00 da yig'ilish direktor xonasida.'"

Rahbar:  "Ha, yubor"
AIsha:   "Yuborildi."
```

---

## 2. Asosiy o'zgarishlar (1 foydalanuvchi)

| Jihat | Avval (dispatcher) | **Hozir (rahbar)** |
|---|---|---|
| Foydalanuvchi | 15-30 kishi (smena boshliqlari) | **1 kishi (bosh rahbar)** |
| Stake daraja | Operativ (medium) | **Strategik (high)** |
| Auth | Multi-rol RBAC | **Bitta foydalanuvchi, PIN himoyasi** |
| Konkurrentlik | Bir vaqtda 5-10 ovoz | **Bittadan ovoz** |
| Tool sifat | Operativ qarorlar | **Strategik tahlil + buyruq** |
| Dizayn | Sex muhitiga moslashgan HUD | **Premium minimal (Apple stili)** |
| Cost | $700-1 300/oy (30 user) | **$50-150/oy (1 user)** |
| Skalalash | Backend horizontal scale kerak | **Kerakmas — 1 session** |

---

## 3. Foydalanish stsenariylari (rahbar uchun)

### Stsenariy 1 — Erta tongdagi briefing

```
Rahbar (ofisga keladi, soat 09:00):
"Aisha"

AIsha: "Xayrli tong. Bugungi 3 ta asosiy hodisa:
        1. Yangi katta buyurtma — UzPaper, 5 000 box (xayrli ish kuni).
        2. Mashina-2 da kechqurun 18 daqiqalik to'xtash bor edi.
        3. Akmal Karimov bugun bo'lmaydi (otpuskada).
        Boshqa nima eshitmoqchisiz?"
```

### Stsenariy 2 — Tezkor ma'lumot

```
"Aisha, UzPaper bilan oxirgi 6 oydagi sotuvlar?"
→ "UzPaper bilan 6 oyda 47 ta buyurtma, jami 287 000 000 so'm.
   O'rtacha buyurtma 6.1 mln. Eng katta buyurtma — fevralda, 18.5 mln.
   Mijoz CLV — 580 mln (yuqori). Hisobot Telegram'ga yuboraymi?"
```

### Stsenariy 3 — Strategik qaror

```
"Aisha, agar Sex-3 ga yana 2 ta mashina sotib olsak, qancha ishlab chiqaramiz?"
→ "Joriy ishlab chiqarish 12 000 box/kun. 
   2 ta yangi mashina qo'shilsa — taxminan 16 800 box/kun (+40%).
   Mashina narxi — 850 mln so'm dona. Qaytarish vaqti taxminan 14 oy.
   Batafsil tahlil hisoboti tayyorlaynmi?"
```

### Stsenariy 4 — Buyruq berish

```
"Aisha, bo'lim boshliqlariga yarim soatdan keyin yig'ilish chaqir"
→ "5 ta bo'lim boshlig'iga Telegram'ga xabar yuborilsinmi?
   Vaqt: 14:32 + 30 daqiqa = 15:02. 
   Adabiyot: 'Bugun 15:02 da yig'ilish direktor xonasida.'"
"Ha"
→ "Yuborildi. 5/5 yetib bordi."
```

### Stsenariy 5 — Hisobot va eslatma

```
"Aisha, ertaga ertalab moliyaviy hisobot tayyor bo'lsin"
→ "Aprel oyi moliyaviy hisoboti — daromad, xarajat, foyda. 
   Ertaga 08:00 da tayyor bo'ladi va sizning emailingizga yuboriladi.
   Tasdiqlaysizmi?"
"Ha"
→ "Tasdiqlandi. Eslatma qo'yildi."
```

---

## 4. Tool registry — rahbar uchun moslashgan 25 ta tool

| Toifa | Tool soni | Misol |
|---|:---:|---|
| **Read-only ma'lumot** | 12 | KPI, ishlab chiqarish, sotuv, mijoz, xodim, mashina, sklad, moliya |
| **Tahlil va hisobot** | 5 | Trend, comparison, forecast, PDF generation, what-if scenario |
| **Buyruq berish** | 5 | Telegram, email, yig'ilish, eslatma, vazifa biriktirish |
| **Strategik** | 3 | Markaziy alert, kritik action escalation, financial decision |

### 25 ta tool batafsil

#### A. Read-only ma'lumot (avto bajariladi, faqat ovoz bilan ayt)

1. `get_today_briefing` — bugungi 3 ta muhim hodisa
2. `get_production_status` — ishlab chiqarish hozirgi holati
3. `get_machine_status` — mashina holati, OEE, downtime
4. `get_order_status` — buyurtma holati va foiz
5. `get_customer_info` — mijoz tarixi, CLV, oxirgi buyurtmalar
6. `get_employee_info` — xodim ma'lumoti, attendance, KPI
7. `get_inventory_levels` — sklad qoldig'i, kam zaxiralar
8. `get_financial_summary` — kassa, debitor, kreditor, balans
9. `get_sales_metrics` — savdo statistika (kun/hafta/oy)
10. `get_quality_metrics` — brak foizi, reklamatsiyalar
11. `get_active_alerts` — joriy ogohlantirishlar
12. `search_documents` — hujjat qidirish (kontrakt, hisobot)

#### B. Tahlil va hisobot (medium stake, logged)

13. `generate_kpi_report` — KPI hisobot PDF/Excel
14. `compare_periods` — davrlarni solishtirish
15. `analyze_trend` — trend tahlili (grafik bilan)
16. `forecast_demand` — talabni bashorat qilish
17. `what_if_analysis` — "agar...bo'lsa" stsenariy

#### C. Buyruq berish (high stake, ovozli tasdiq)

18. `send_telegram_to_team` — bo'lim boshliqlariga Telegram
19. `send_email` — email yuborish
20. `schedule_meeting` — yig'ilish e'lon qilish
21. `create_reminder` — eslatma qo'yish
22. `assign_task` — vazifa biriktirish

#### D. Strategik (critical, PIN bilan)

23. `approve_high_value_order` — yirik buyurtmani tasdiqlash
24. `emergency_production_halt` — favqulodda to'xtatish
25. `approve_major_expense` — yirik xarajat tasdiqlash

---

## 5. Zamonaviy dizayn — to'liq spec

### 5.1 Dizayn falsafasi

**O'xshashlar:** Linear app, Apple Settings, Notion, Vercel dashboard.

**Asosiy printsiplar:**
- 🤍 **Toza fon** (oq #FAFAFA yoki dim #F5F5F5) — qora HUD emas
- ✏️ **Yumshoq tipografiya** (SF Pro / Inter) — futuristik mono emas
- 🎨 **1-2 aksent rang** (Indigo + Emerald) — neon emas
- 🪶 **Yumshoq pulse animatsiya** — texnik aylanma yo'lakli yo'q
- 🔇 **Minimalistik** — bitta asosiy element, kichik card'lar
- 💎 **Premium** — Apple Watch interfeysi singari

### 5.2 Rang palettasi

```
Fon (asosiy):       #FAFAFA  (toza oq)
Fon (kartochkalar): #FFFFFF  (sof oq)
Border (subtle):    rgba(0, 0, 0, 0.06)
Border (active):    rgba(99, 102, 241, 0.15)

Matn (asosiy):      #1A1A1A  (deyarli qora)
Matn (ikkinchi):    #666666  (kulrang)
Matn (uchinchi):    #888888  (yengil kulrang)
Matn (placeholder): #999999

Asosiy aksent:      #6366F1  (Indigo 500 — Tailwind)
Aksent ikkinchi:    #8B5CF6  (Violet 500)
Muvaffaqiyat:       #10B981  (Emerald 500)
Ogohlantirish:      #F59E0B  (Amber 500)
Xato:               #EF4444  (Red 500)

Gradient core orb:  linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
```

### 5.3 Font

```css
font-family: -apple-system, 'SF Pro Display', 'Inter', system-ui, sans-serif;
```

| Element | Hajm | Vazn |
|---|---|---|
| Sarlavha (rahbar ismi) | 14px | 500 |
| Buyruq matni | 22px | 400 |
| Status | 13px | 400 |
| Metadata | 11px | 400 |
| Tablar | 12px | 500 |

**Hech qachon:** bold, italic, all-caps (text-transform: uppercase'dan tashqari status uchun).

### 5.4 Komponentlar

**Asosiy orb:**
- Hajmi: 160px (markaziy), 64px (kichik versiya tegishli)
- Background: linear-gradient indigo → violet
- Shadow: `0 8px 32px rgba(99, 102, 241, 0.25)`
- Inner letter: "A" — oq, 500 vazn
- Voice waves: 4 ta kichik chiziq, opacity 0.5

**Status matn:**
- "TINGLAYAPMAN" — uppercase, letter-spacing 0.5px, kulrang
- "Bugungi ishlab chiqarish qanday ketmoqda?" — 22px, normal, qora

**Card (recent activity):**
- Background: #FFFFFF
- Border: 1px solid rgba(0,0,0,0.06)
- Border-radius: 12px
- Padding: 20px 24px

**Bottom info bar:**
- Faqat tekst — alohida fon yo'q
- Font-size: 11px
- Color: #999

**Mute keyboard hint:**
- `<kbd>F4</kbd>` — kichik klaviatura tugmasi vizual stiliga moslashgan

### 5.5 Animatsiyalar

1. **Orb tashqi ring** — 30 sekund sekin aylanish
2. **Orb ichki ring (active)** — 4 sek aylanish, indigo top
3. **Pulse layer** — 3 sek scale 1.0 ↔ 1.15
4. **Voice waves** — har biri turli tezlikda (0.85-0.95 sek)
5. **Sahifa o'zgarishlari** — Framer Motion fade + slide
6. **Card hover** — subtle shadow elevation
7. **Microphone faol** — kichik yashil nuqta pulse (1 sek)

### 5.6 Holat o'zgarishlari (orb)

| Holat | Tashqi ko'rinish |
|---|---|
| **Kutmoqda** ("Aisha"ni kutyapti) | Pulse sekin, indigo |
| **Tinglayapti** | Voice waves aktiv, halqada yashil nuqta |
| **O'ylayapti** | Tashqi halqa tez aylanmoqda |
| **Gapirmoqda** | Audio amplituda waves, kuchli pulse |
| **Mute** | Kulrang, halqa harakatsiz |
| **Sleep** | Juda kichik, qiyin ko'rinadigan |

---

## 6. Kerakli AI tokenlar va xizmatlar

Bu — **eng muhim qism**. AIsha ishlashi uchun **5 ta API key** kerak:

### 6.1 Anthropic Claude (LLM — asosiy)

| Detal | Qiymat |
|---|---|
| Maqsad | Asosiy AI mantiq + tool use |
| Model | `claude-sonnet-4-6-20251022` |
| Qayerdan olish | https://console.anthropic.com → API Keys |
| Xarajat | $3/M input tokens, $15/M output tokens |
| 1 rahbar kuniga | ~20 dialog × 1500 token = 30 000 tokens/kun |
| **Oylik narx** | **~$20-40** |
| Env variable | `ANTHROPIC_API_KEY=sk-ant-...` |
| Tier | Tier 1 dan boshlash (free credit + $5 deposit) |

### 6.2 OpenAI Whisper (STT — ovoz → matn)

| Detal | Qiymat |
|---|---|
| Maqsad | Ovozni matnga aylantirish |
| Model | `whisper-1` |
| Qayerdan olish | https://platform.openai.com → API Keys |
| Xarajat | **$0.006/daqiqa** |
| 1 rahbar kuniga | ~15 daqiqa gapirish |
| **Oylik narx** | **~$3** (15 min × 30 kun × $0.006) |
| Env variable | `OPENAI_API_KEY=sk-...` |
| Eslatma | UZ va RU yaxshi tushunadi |

### 6.3 ElevenLabs (TTS — matn → ovoz)

| Detal | Qiymat |
|---|---|
| Maqsad | AIsha javobini ovozga aylantirish |
| Model | `eleven_multilingual_v2` |
| Qayerdan olish | https://elevenlabs.io → Profile → API Key |
| Xarajat | Subscribed plans: **$5-22/oy** (Starter) yoki **$99/oy** (Creator) |
| Tavsiya | **Starter $22/oy** — 100 000 character/oy (rahbar uchun yetarli) |
| **Oylik narx** | **$22** |
| Env variable | `ELEVENLABS_API_KEY=...` + `ELEVENLABS_VOICE_ID=...` |
| Voice tanlash | "Charlotte" yoki "Bella" — Aisha uchun ayol ovoz |
| Alternativa | OpenAI TTS — $15/1M char (lekin sifat past) |

### 6.4 Picovoice Porcupine (Wake word — "Aisha")

| Detal | Qiymat |
|---|---|
| Maqsad | "Aisha" so'zini eshitganda faollashadi |
| Qayerdan olish | https://console.picovoice.ai → Access Keys |
| Xarajat — Hobby | **$0/oy** (3 ta sample, bitta foydalanuvchi) |
| Xarajat — Commercial | $99/oy (cheksiz foydalanuvchi) |
| Tavsiya (1 rahbar uchun) | **Hobby plan — $0/oy** |
| **Oylik narx** | **$0** |
| Env variable | `PICOVOICE_ACCESS_KEY=...` |
| Custom wake word | Console'da "Aisha" yarating, `.ppn` fayl olasiz |

### 6.5 Google Gemini (BACKUP — ixtiyoriy)

| Detal | Qiymat |
|---|---|
| Maqsad | Claude ishlamasa fallback |
| Model | `gemini-2.5-flash` |
| Qayerdan olish | https://aistudio.google.com → API key |
| Xarajat | **$0** (bepul tier — 15 RPM, kuniga 1500 so'rov) |
| **Oylik narx** | **$0** |
| Env variable | `GOOGLE_AI_API_KEY=...` |
| Eslatma | Allaqachon `@google/generative-ai` paketi `apps/api/package.json` da bor |

### 6.6 Jami xarajat — bitta rahbar uchun

| Xizmat | Oylik | Yillik |
|---|---:|---:|
| Claude (LLM) | $20-40 | $240-480 |
| OpenAI Whisper (STT) | $3 | $36 |
| ElevenLabs (TTS Starter) | $22 | $264 |
| Picovoice Porcupine | $0 | $0 |
| Gemini (backup) | $0 | $0 |
| **JAMI** | **$45-65** | **$540-780** |

**Solishtirish:** Sizning oylik hosting xarajatingiz $200-500. AIsha qo'shimcha 10-15% qo'shadi.

### 6.7 .env fayl shabloni

```bash
# apps/api/.env qo'shing:

# AIsha — AI assistant
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=XB0fDUnXU5powFXDhCwa
PICOVOICE_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

# AIsha — sozlamalar
AISHA_DIRECTOR_USER_ID=1
AISHA_WAKE_SENSITIVITY=0.7
AISHA_TIMEOUT_MS=30000
AISHA_DAILY_BUDGET_USD=5
AISHA_ALLOWED_TOOLS=all  # yoki specific: query_*,send_*
```

### 6.8 Tokenlar qanday olish — qadam-baqadam

#### Anthropic Claude (~5 daqiqa)
1. https://console.anthropic.com saytiga kiring
2. Google account bilan ro'yxatdan o'ting
3. Dashboard → "API Keys" → "Create Key"
4. Nom: `EuroPrint-AIsha-Prod`
5. Birinchi $5 credit bepul — keyin Pay-as-you-go
6. Key'ni `.env` ga ko'chiring

#### OpenAI (~5 daqiqa)
1. https://platform.openai.com saytiga kiring
2. Ro'yxatdan o'ting (telefon raqami kerak)
3. Settings → API keys → "Create new secret key"
4. Tag: `aisha-whisper`
5. Permission: "Restricted" — faqat Whisper
6. $5 birinchi bepul credit

#### ElevenLabs (~10 daqiqa, voice tanlash bilan)
1. https://elevenlabs.io saytiga kiring
2. Profile → API Key → kopya qiling
3. Voice Lab → "Browse voices" → ayol ovoz tanlang:
   - **Charlotte** (yumshoq, professional)
   - **Bella** (yorqin, tez)
   - **Rachel** (chuqur, ishonchli)
4. Voice ID ni ko'chiring
5. Plan: Starter ($22/oy) — 100K char + 10 voice clone

#### Picovoice Porcupine (~15 daqiqa, wake word train bilan)
1. https://console.picovoice.ai saytiga kiring
2. Free Tier — Hobby plan (commercial uchun keyin)
3. AccessKey → ko'chiring
4. "Custom wake word" → "Aisha" yozing
5. Til: English (asosiy) — UZ accent ishlaydi
6. Sensitivity: 0.7
7. Train tugmasini bosing — 5 daqiqa kutilsin
8. `.ppn` fayl yuklab olinadi
9. `artifacts/erp-dashboard/src/aisha/assets/aisha.ppn` ga joylashtiring

#### Google Gemini (~2 daqiqa)
1. https://aistudio.google.com saytiga kiring
2. Google account
3. "Get API key" — sariq tugma
4. Yangi project → "Create API key"
5. Bepul tier — kuniga 1500 so'rov

---

## 7. Backend arxitekturasi (yangilangan)

```
apps/api/src/modules/aisha/
├── domain/
│   ├── aggregates/
│   │   └── conversation.aggregate.ts        # 1 rahbar suhbati
│   ├── value-objects/
│   │   ├── voice-command.vo.ts
│   │   └── tool-call.vo.ts
│   └── events/
│       └── tool-executed.event.ts
├── application/
│   ├── commands/
│   │   ├── process-voice-command.handler.ts
│   │   └── execute-tool.handler.ts
│   ├── tools/                                # 25 ta tool
│   │   ├── get-today-briefing.tool.ts
│   │   ├── get-production-status.tool.ts
│   │   ├── send-telegram-to-team.tool.ts
│   │   └── ...
│   └── llm/
│       ├── claude.service.ts                 # Claude SDK
│       ├── whisper.service.ts                # OpenAI Whisper
│       ├── elevenlabs.service.ts             # ElevenLabs TTS
│       └── gemini-fallback.service.ts        # Gemini backup
├── infrastructure/
│   ├── streaming/
│   │   └── aisha-sse.gateway.ts
│   └── audio/
│       ├── audio-uploader.ts
│       └── tts-streamer.ts
├── presentation/
│   ├── aisha.controller.ts
│   └── voice.controller.ts
└── aisha.module.ts
```

---

## 8. Frontend arxitekturasi (yangilangan, zamonaviy)

```
artifacts/erp-dashboard/src/aisha/
├── AishaApp.tsx                # Asosiy sahifa, /aisha route
├── components/
│   ├── AishaOrb.tsx           # Markaziy orb (160px, gradient)
│   ├── StatusText.tsx         # "Tinglayapman" matn
│   ├── CommandDisplay.tsx     # Joriy buyruq matn
│   ├── RecentActivityCard.tsx # Card with oxirgi 3 ta savol
│   ├── BottomStatusBar.tsx    # Minimal status
│   └── MuteButton.tsx         # F4 hint
├── voice/
│   ├── useWakeWord.ts         # Porcupine WASM hook
│   ├── useMicrophone.ts       # getUserMedia
│   ├── useVAD.ts              # Silero VAD
│   ├── useSTT.ts              # Whisper API call
│   └── useTTS.ts              # ElevenLabs streaming
├── store/
│   └── aishaStore.ts          # Zustand
├── theme/
│   ├── tokens.ts              # Color, font, spacing
│   └── aisha.css              # Global CSS
└── routes.ts                  # /aisha route
```

---

## 9. MVP plan (yangilangan — 1 user)

| Hafta | Maqsad | Yetkazib beriladigan |
|:---:|---|---|
| 1 | Tokenlar + Porcupine train | Barcha API key'lar, "Aisha" wake word `.ppn` fayl |
| 2 | Backend `aisha/` modul + Claude | Tool registry, 5 ta read-only tool |
| 3 | Voice pipeline | Whisper + ElevenLabs streaming ishlash |
| 4 | Frontend zamonaviy UI | AishaOrb, StatusText, RecentActivity card |
| 5 | Qolgan tool'lar (15 ta) | Tahlil, hisobot, buyruq tool'lari |
| 6 | High-stake approval + audit log | Critical action'lar + PIN bilan |
| 7 | Test + polish | Playwright E2E, fix'lar |
| 8 | Launch — rahbar pilot | Real foydalanish, feedback |

**Jami: 8 hafta (1 odam) yoki 5 hafta (2 odam)**

---

## 10. Texnik xarajat (yangilangan)

| Komponent | Hajm | Vaqt |
|---|---:|---:|
| Backend `aisha/` modul (DDD) | ~2 200 LOC | 8 kun |
| 25 ta tool implementation | ~3 000 LOC | 12 kun |
| Voice pipeline (STT/TTS streaming) | ~600 LOC | 4 kun |
| Frontend zamonaviy UI | ~900 LOC | 5 kun |
| Wake word integratsiya | ~200 LOC | 2 kun |
| Test (unit + E2E) | ~1 200 LOC | 4 kun |
| Polish + audit log + PIN | ~500 LOC | 3 kun |
| **JAMI** | **~8 600 LOC** | **~38 ish-kun** |

**Tashqi xarajatlar:**
- Hozirgi hosting: $200-500/oy (mavjud)
- **AIsha qo'shimcha: $45-65/oy** (yuqorida 6.6 bo'limda)

---

## 11. Risk va yumshatish

| Risk | Ta'sir | Yumshatish |
|---|:---:|---|
| Claude API down — AIsha gapirmaydi | Yuqori | Gemini fallback (avtomatik 5 sek timeout'dan keyin) |
| Whisper UZ accent noto'g'ri | O'rta | RU primary + UZ system prompt + user fix-up |
| ElevenLabs cost o'sib ketadi | O'rta | Daily char budget + caching keng tarqalgan javoblar |
| Wake word false trigger | Past | Sensitivity 0.5 dan boshlash + 2 sek pauza tasdiq |
| Rahbar Aisha bilan ishlamasa | Yuqori | Tutorial + birinchi haftada onboarding sessiyalar |
| Audio yozuvlar saqlanib qoladi | Yuqori | Whisper'dan keyin darhol o'chirish, audit faqat transkriptsiya |
| Critical action noto'g'ri ishga tushadi | Critical | PIN majburiy, 5 sek confirmation kutadi |

---

## 12. Qabul mezonlari

- [ ] "Aisha" wake word 95%+ aniqlikda ishlaydi
- [ ] False trigger < 1 marta/8 soat
- [ ] Wake'dan birinchi javobgacha < 2 sekund
- [ ] 25 ta tool'ning 20 tasi 100% ishlaydi
- [ ] High-stake action'lar ovozli + PIN bilan
- [ ] UZ va RU tilida ishlaydi
- [ ] ElevenLabs ovoz tabiiy (rahbar tasdiqlaydi)
- [ ] Dizayn Linear/Apple sifatida (rahbar tasdiqlaydi)
- [ ] Audit log har dialog uchun
- [ ] Daily cost budget ishlaydi
- [ ] F4 mute global
- [ ] 30 daqiqa idle = sleep
- [ ] Backup Gemini fallback ishlaydi

---

## 13. Birinchi qadam (Quick Start)

```bash
# 1. API tokenlarni olish
# (yuqorida 6.8 bo'limda batafsil)

# 2. Hozirgi paketlar tekshirish (allaqachon bor)
grep -E "anthropic|openai|generative-ai" apps/api/package.json
# ✅ @anthropic-ai/sdk: ^0.32.0
# ✅ openai: ^4.67.0
# ✅ @google/generative-ai: ^0.21.0

# 3. ElevenLabs paketi qo'shish
pnpm --filter @europrint/api add elevenlabs

# 4. Porcupine frontend paket
pnpm --filter erp-dashboard add @picovoice/porcupine-web @picovoice/web-voice-processor

# 5. Backend yangi modul yaratish
mkdir -p apps/api/src/modules/aisha/{domain/aggregates,application/{commands,tools,llm},infrastructure,presentation}

# 6. Birinchi tool — get_today_briefing
# apps/api/src/modules/aisha/application/tools/get-today-briefing.tool.ts

# 7. .env ga API key'lar
echo "ANTHROPIC_API_KEY=sk-ant-..." >> apps/api/.env
echo "OPENAI_API_KEY=sk-..." >> apps/api/.env
echo "ELEVENLABS_API_KEY=..." >> apps/api/.env
echo "PICOVOICE_ACCESS_KEY=..." >> apps/api/.env

# 8. Wake word fayl
mkdir -p artifacts/erp-dashboard/src/aisha/assets
# aisha.ppn faylni shu papkaga ko'chiring
```

---

## 14. Bitta jumlali xulosa

> **AIsha — bosh rahbar uchun premium ovozli AI yordamchi. "Aisha" deganda faollashadi, 25 ta tool orqali butun ERP'ni boshqaradi, Linear/Apple uslubidagi zamonaviy minimal dizayn bilan. 5 ta API key kerak (Claude + Whisper + ElevenLabs + Porcupine + Gemini fallback), oylik $45-65 xarajat, 8 hafta MVP.**

---

## 15. Tokenlar — birinchi soatda olishingiz kerak

Eng tezroq boshlash uchun **shu tartibda** tokenlarni oling:

| # | Xizmat | Vaqt | Avval kerakmi? |
|:---:|---|:---:|:---:|
| 1 | **Anthropic Claude** | 5 daqiqa | ✅ MAJBURIY |
| 2 | **OpenAI** | 5 daqiqa | ✅ MAJBURIY (Whisper uchun) |
| 3 | **Google Gemini** | 2 daqiqa | ⚠️ Tavsiya (bepul, backup) |
| 4 | **ElevenLabs** | 10 daqiqa | ✅ MAJBURIY (TTS uchun) |
| 5 | **Picovoice Porcupine** | 15 daqiqa | ✅ MAJBURIY (wake word) |
| **JAMI** | — | **~40 daqiqa** | — |

**Birinchi haftada bularning hammasini olishingiz mumkin va MVP uchun yetarli.**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     