# EuroPrint Jarvis — Direktor uchun AI Dashboard

> **Loyiha nomi (ichki):** EuroPrint Jarvis (yoki istalgan brand nomi — `EP.AI`, `E.D.A.M.` "EuroPrint Director AI Manager" va h.k.)
> **Maqsad:** Iron Man filmidagi J.A.R.V.I.S. uslubidagi, direktor uchun AI yordamchi — matn + ovoz + agentic + futuristik HUD interfeys
> **Sana:** 2026-05-15

---

## 1. Konsepsiya

**Direktor (Tony Stark) Jarvis bilan qanday ishlaydi:**

1. Direktor ofisga keladi → ekrandagi HUD avtomatik faollashadi
2. "Jarvis, bugungi holatni ayt" deydi
3. AI ovoz va vizual bilan javob beradi: "Xayrli tong. Bugungi 3 ta asosiy hodisa: ..."
4. Direktor: "3000 ta box buyurtmasi qaerda?" → AI sklad + ishlab chiqarish ma'lumotini olib javob beradi
5. Direktor: "Bo'lim boshliqlariga Telegram orqali yig'ilish e'lon qil" → AI bajaradi, tasdiq so'raydi, yuboradi

**Klassik dashboard bilan farqi:**
- Klassik: foydalanuvchi sahifani izlab, tugmani bosib, grafikni ochib o'qiydi
- Jarvis: foydalanuvchi savol beradi, AI **kerakli ma'lumotni topib, soddalashtirib, qisqartirib** ko'rsatadi
- Klassik: 891 sahifa, har birida o'z ma'lumoti
- Jarvis: bitta interfeys, **891 sahifa orqasiga** ko'taradi va o'zi navigatsiya qiladi

---

## 2. Foydalanuvchi tajribasi (UX)

### 2.1 Birinchi ochilish

```
[Qora ekran]
    ↓
[Holografik logo paydo bo'ladi — EuroPrint + glow effect]
    ↓
[Markazda animatsiyali doira — "tinglash rejimi"]
    ↓
[Atrof-tevarakda 6 ta kichik panel jonlanadi]:
   - Bugungi sotuv      - Ishlab chiqarish      - Ogohlantirishlar
   - Hodisalar          - Moliya holati         - Xodimlar
    ↓
[Pastdagi status bar]: "Jarvis tinglamoqda... Mikrofon faol"
```

### 2.2 Aloqa stsenariylari

**1) Ovozli savol:**
```
Direktor: "Bugungi ishlab chiqarish qanday ketmoqda?"

Jarvis (ovoz + matn):
"Bugun soat 14:00 ga qadar 3 ta smena ishlamoqda. 
 Ishlab chiqarish: 8 230 ta box (planning'ning 87%)
 Bitta sex'da 22 daqiqalik to'xtash qayd etilgan — 
 Sex-3, ofset mashinasi.
 Joriy OEE: 78.4% — o'rtacha ko'rsatkichdan 4 punkt past."

[Markazda OEE grafigi animatsiya bilan paydo bo'ladi]
[Yon panellardan biriga "Sex-3 downtime" qizil belgisi yonadi]
```

**2) Agentic harakat:**
```
Direktor: "Bo'lim boshliqlariga 16:00 da yig'ilish e'lon qil"

Jarvis: 
"5 ta bo'lim boshlig'iga Telegram orqali xabar yuborilsinmi?
 Adabiyot: 'Bugun soat 16:00 da direktor xonasida yig'ilish.'
 Yuborish vaqti: hozir.
 [TASDIQLASH]  [BEKOR QILISH]  [ADABIYOTNI O'ZGARTIRISH]"

Direktor: "Tasdiqlayman"

Jarvis: 
"Yuborildi. 5/5 yetib bordi.
 2 ta tasdiq keldi: Akmal (Sotuv), Dilshod (Sklad).
 Qolgan 3 tasini 15 daqiqada eslataman."
```

**3) Murakkab tahlil:**
```
Direktor: "Oxirgi oyda eng ko'p shikoyat qaysi mijozdan keldi?"

Jarvis: 
"Aprel oyida 47 ta shikoyat qayd etildi.
 Eng ko'p — UzPaper LLC (12 ta, 26%).
 Asosiy sabab: yetkazib berish kechikishi (8 ta), 
 sifat nuqsoni (3 ta), narx kelishmovchiligi (1 ta).
 
 Bu mijoz bilan oxirgi 6 oydagi shikoyatlar trendi:
 [grafik chiqadi — yanvar 2 ta, fevral 4, mart 7, aprel 12]
 
 O'sish 6 oyda 500%. CRM'da 'kritik' belgisi qo'yilsinmi?"
```

### 2.3 HUD elementlari (vizual)

Markaziy element — **ovoz to'lqini sferasi** (radial animation):
- Tinch — sekin pulsatsiya
- Tinglayotganda — ovoz amplitudasiga moslab to'lqinlanadi
- Javob berayotganda — to'lqinlar tashqariga yo'naltirilgan

Atrofdagi 6–8 ta **info panel** (holografik):
- KPI kartochkalari
- Real-time alerts
- Hozirgi vaziyat (ishlab chiqarish, mijoz, moliya)
- Hodisa lentasi

Pastdagi **status bar**:
- Mikrofon holati (faol / o'chiq)
- Hozirgi til (UZ / RU)
- Ulanish holati (backend, AI provider)
- Buyruqlar tarixi (oxirgi 5 ta)

Yuqoridagi **bosh sarlavha**:
- Vaqt, sana
- Direktor ismi + lavozimi
- Hozirgi rejim (Tinglash / Javob berish / Bajarish)

---

## 3. Texnik arxitektura

### 3.1 Yangi backend modul

```
apps/api/src/modules/director-ai/
├── domain/
│   ├── aggregates/
│   │   └── conversation.aggregate.ts       # AI suhbat sessiyasi
│   ├── value-objects/
│   │   ├── tool-call.vo.ts                  # AI tool call namunalari
│   │   └── confidence-score.vo.ts
│   ├── events/
│   │   ├── conversation-started.event.ts
│   │   ├── tool-executed.event.ts
│   │   └── action-approved.event.ts
│   └── repositories/
│       └── i-conversation.repo.ts
├── application/
│   ├── commands/
│   │   ├── start-conversation.handler.ts
│   │   ├── send-message.handler.ts
│   │   ├── execute-tool.handler.ts
│   │   └── approve-action.handler.ts
│   ├── queries/
│   │   ├── get-conversation-history.handler.ts
│   │   └── search-knowledge.handler.ts
│   ├── tools/                                # AI uchun ERP toollari
│   │   ├── kpi-snapshot.tool.ts
│   │   ├── search-orders.tool.ts
│   │   ├── create-sales-order.tool.ts
│   │   ├── send-telegram.tool.ts
│   │   ├── generate-pdf-report.tool.ts
│   │   ├── query-employee.tool.ts
│   │   ├── financial-summary.tool.ts
│   │   ├── production-status.tool.ts
│   │   ├── inventory-check.tool.ts
│   │   ├── schedule-meeting.tool.ts
│   │   └── ... (50+ tool)
│   └── voice/
│       ├── speech-to-text.service.ts        # OpenAI Whisper
│       └── text-to-speech.service.ts        # ElevenLabs / OpenAI TTS
├── infrastructure/
│   ├── llm/
│   │   ├── claude-provider.ts                # Anthropic Claude
│   │   ├── openai-provider.ts                # GPT-4
│   │   └── gemini-provider.ts                # Google
│   ├── streaming/
│   │   └── sse-gateway.ts                    # Server-Sent Events
│   ├── memory/
│   │   ├── short-term-memory.ts              # Redis (joriy sessiya)
│   │   └── long-term-memory.ts               # Postgres (tarix)
│   └── repositories/
│       └── drizzle-conversation.repo.ts
├── presentation/
│   ├── controllers/
│   │   ├── director-ai.controller.ts         # REST endpoints
│   │   ├── voice.controller.ts                # /upload audio, /tts
│   │   └── director-ai.gateway.ts             # WebSocket
│   └── dto/
│       ├── send-message.dto.ts
│       └── approve-action.dto.ts
└── director-ai.module.ts
```

### 3.2 Yangi frontend dashboard

```
artifacts/erp-dashboard/src/director-ai/
├── DirectorAIApp.tsx                         # Bosh kontener
├── routes.ts                                  # /jarvis route
├── hud/
│   ├── HUDFrame.tsx                          # Tashqi ramka
│   ├── CentralOrb.tsx                        # Markaziy ovoz sferasi
│   ├── InfoPanel.tsx                          # Atrofdagi panel
│   ├── StatusBar.tsx                          # Pastdagi status
│   ├── ConversationStream.tsx                # Chat oyna (yarim shaffof)
│   └── ActionConfirm.tsx                      # Tasdiqlash modali
├── voice/
│   ├── useMicrophone.ts                      # WebRTC hook
│   ├── useVoiceWave.ts                       # Audio amplituda
│   └── useTTS.ts                              # Tovush chiqarish
├── ai/
│   ├── useConversation.ts                    # Backend bilan stream
│   ├── useToolApproval.ts                    # Action tasdiqlash
│   └── useAIMemory.ts                         # Context boshqaruvi
├── effects/
│   ├── ParticleField.tsx                     # Three.js zarralar
│   ├── HologramGlow.tsx                      # Glow shader
│   └── ScanLine.tsx                          # Eski TV effekti
├── theme/
│   ├── jarvis-tokens.ts                      # Rang, font, animation
│   └── jarvis.css                             # Global stillar
└── store/
    └── directorAIStore.ts                    # Zustand state
```

### 3.3 Texnologiya tanlovi

| Qatlam | Texnologiya | Sabab |
|---|---|---|
| LLM | **Anthropic Claude Sonnet 4.6** | Eng yaxshi tool-use, uzun kontekst |
| Backup LLM | OpenAI GPT-4 (fallback) | Claude ishlamasa |
| STT (ovoz → matn) | **OpenAI Whisper API** | Eng yaxshi UZ/RU sifat |
| TTS (matn → ovoz) | **ElevenLabs** yoki OpenAI TTS | Realistik ovoz, UZ qo'llab-quvvatlash |
| Streaming | **Server-Sent Events (SSE)** | WebSocket dan sodda, Fastify mavjud |
| 3D HUD | **Three.js (r128)** | Allaqachon stack'da bor |
| Animatsiya | **Framer Motion 12** | Allaqachon ishlatiladi |
| Ovoz vizualizatsiya | **Web Audio API** + Canvas | Native, bog'liqlik kerak emas |
| Real-time state | **Zustand** + Socket.IO | Allaqachon bor |
| Memory | **Redis** (qisqa) + **PostgreSQL** (uzun) | Allaqachon bor |
| Vector search | **pgvector** + Drizzle | Yangi qo'shiladi (knowledge base uchun) |

### 3.4 Tool Registry (Agentic asosiy qism)

Har bir AI "tool" — bu **JSON schema bilan ta'riflangan funksiya** bo'lib, Claude API uni avtomatik chaqiradi. Misol:

```ts
// apps/api/src/modules/director-ai/application/tools/send-telegram.tool.ts

import { Tool } from '@anthropic-ai/sdk';

export const sendTelegramTool: Tool = {
  name: 'send_telegram_message',
  description: 'Telegram orqali xodim yoki guruhga xabar yuboradi. Yuborishdan oldin tasdiqlash so\'raladi (high-stakes action).',
  input_schema: {
    type: 'object',
    properties: {
      recipients: {
        type: 'array',
        items: { type: 'string' },
        description: 'Xodim ID lari yoki Telegram chat ID lari',
      },
      message: {
        type: 'string',
        description: 'Yuboriladigan matn (UZ yoki RU)',
      },
      priority: {
        enum: ['low', 'normal', 'urgent'],
      },
    },
    required: ['recipients', 'message'],
  },
  
  // Implementation
  execute: async (input, ctx) => {
    // 1. Approval check
    if (ctx.requiresApproval) {
      return { status: 'pending_approval', approvalId: '...' };
    }
    // 2. Real call
    return await ctx.telegramService.sendBulk(input.recipients, input.message);
  },
  
  // Stake level — high stakes need approval
  stakeLevel: 'high',
};
```

**Tool toifalari:**

| Toifa | Stake | Misol toollar |
|---|:---:|---|
| **Read-only** | low (avto bajariladi) | `get_kpi_snapshot`, `search_orders`, `query_employee`, `inventory_check`, `financial_summary` |
| **Soft mutation** | medium (avto, lekin logging) | `create_draft`, `add_to_kanban`, `schedule_reminder` |
| **High-stakes** | high (tasdiqlash kerak) | `send_telegram`, `create_sales_order`, `approve_advance_bypass`, `send_email`, `generate_invoice` |
| **Critical** | critical (PIN/parol kerak) | `delete_record`, `transfer_funds`, `terminate_employee`, `production_halt` |

### 3.5 Memory arxitekturasi

```
┌─────────────────────────────────────────────────────────┐
│ Short-term (Redis, TTL 1 soat)                          │
│ - Joriy suhbat (oxirgi 20 xabar)                        │
│ - Faol tool call'lar                                     │
│ - User intent context                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ Long-term (PostgreSQL)                                  │
│ - Barcha suhbatlar tarixi                                │
│ - Tasdiqlangan harakatlar audit                         │
│ - Foydalanuvchi afzalliklari (til, ovoz, panel tartibi) │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ Knowledge base (pgvector)                               │
│ - Korxona bo'yicha bilim (siyosatlar, prosedura)        │
│ - Mijoz tarixi (semantic search)                         │
│ - Tex docs, SOP                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Voice pipeline

```
┌──────────────────┐
│  Mikrofon (FE)   │  WebRTC, 16kHz mono
└────────┬─────────┘
         │ chunk (3-5 sek)
         ▼
┌──────────────────┐
│  VAD (Voice      │  Web Audio API + Silero VAD
│  Activity Det.)  │  — pauza topilsa kesib oladi
└────────┬─────────┘
         │ audio blob
         ▼
┌──────────────────┐
│  POST /voice/stt │  fastify + multipart
│  → Whisper API   │  language: 'uz' / 'ru' (avtomatik)
└────────┬─────────┘
         │ transkriptsiya
         ▼
┌──────────────────┐
│  send-message    │  Claude API + tool use
│  handler         │  streaming response
└────────┬─────────┘
         │ stream (SSE)
         ▼
┌──────────────────┐
│  TTS (chunk'lab) │  ElevenLabs streaming
│                  │  — har gap tugashida tovushga aylantirib uzatadi
└────────┬─────────┘
         │ audio stream
         ▼
┌──────────────────┐
│  FE audio player │  Web Audio API
│  + voice wave    │  ovoz amplitudasi → HUD orb
└──────────────────┘
```

**Latensiya maqsadi:**
- Mikrofon → STT natijasi: < 800ms
- Birinchi LLM token: < 600ms (Claude streaming)
- Birinchi audio chunk eshitiladi: < 1.2s (total)
- To'liq javob: < 3s o'rtacha

---

## 5. UI dizayn — vizual referans

### 5.1 Rang palettasi (Jarvis-style)

| Maqsad | Rang | HEX |
|---|---|---|
| Fon (asosiy) | Chuqur qora | `#000511` |
| Fon (ikkinchi) | Qora-ko'k | `#0A1628` |
| Asosiy aksent | Yorqin siyah-ko'k | `#00D4FF` |
| Glow / nur | Ochiq ko'k | `#4FC3F7` |
| Ogohlantirish | Olov-zarg'aldoq | `#FF6B35` |
| Kritik | Yorqin qizil | `#FF1744` |
| Yashil OK | Neon yashil | `#00E676` |
| Matn (asosiy) | Och oq | `#E1F5FE` |
| Matn (ikkinchi) | Och ko'k-kulrang | `#90A4AE` |

### 5.2 Font

- Asosiy: **JetBrains Mono** yoki **Orbitron** (futuristik)
- Yordamchi: **Inter** (o'qish uchun)
- Raqamlar: **Roboto Mono**

### 5.3 Animatsiyalar

- Markaziy orb: 60 FPS pulse + audio reaktiv
- Panel'lar yonganda: fade-in + scale-up + glow border
- Hologram chiziqlar: 0.02 opacity gridded background
- Hover effekt: cyan glow + scale-up 1.02
- Ovoz to'lqinlari: Three.js shader bilan radial wave

---

## 6. Foydalanuvchi rollari va kirish

| Rol | Kirish darajasi |
|---|---|
| **Bosh direktor** | To'liq Jarvis — barcha tool'lar, critical action'lar PIN bilan |
| **Direktor o'rinbosari** | Jarvis lite — high-stakes tasdiqlash bilan |
| **Bo'lim boshlig'i** | Faqat o'z bo'limi bo'yicha (HR boshlig'i — HR data only) |
| **Boshqalar** | Kirish yo'q (oddiy ERP dashboard ko'rsatiladi) |

JWT'da `directorAIAccess: 'full' | 'limited' | 'none'` claim qo'shiladi.

---

## 7. Xavfsizlik

| Xavf | Yumshatish |
|---|---|
| AI noto'g'ri qaror qabul qiladi | Critical action'lar **PIN/parol** + 4-ko'z principe |
| Mikrofon doimo tinglab turadi | **Wake word** ("Jarvis") yoki Push-to-Talk |
| Audio ma'lumotlari saqlanmasin | Whisper API'ga yuboriladi, transkriptsiya keyin audio o'chiriladi |
| LLM prompt injection | Tool input'lari Zod bilan validatsiya |
| Confidential data LLM'ga ketadi | PII redaction layer (employee phone, salary → mask) |
| AI hallucination | Har tool natijasi — manba (`source: 'sales_orders table'`) bilan |
| Cost runaway | Per-direktor kunlik token budget ($X dan oshmasin) |

---

## 8. MVP scope (1-versiya, 6 hafta)

| Hafta | Maqsad |
|:---:|---|
| 1 | Backend `director-ai` moduli skeleton, Tool registry, Claude integration |
| 2 | 10 ta asosiy read-only tool (KPI, orders, inventory, employees, finance) |
| 3 | Frontend `/jarvis` route, HUD frame, central orb (matn-only) |
| 4 | Voice pipeline (Whisper + ElevenLabs), real-time transkriptsiya |
| 5 | 5 ta high-stakes tool + approval flow (Telegram, PDF, schedule) |
| 6 | 3D effects, polish, performance, security audit, beta launch |

**MVP'da YO'Q:**
- Long-term memory (faqat joriy sessiya)
- Vector search knowledge base
- Multi-direktor (faqat bitta foydalanuvchi)
- Mobile responsive (faqat 1920×1080 desktop)
- 50+ tool (faqat 15)

**V2 (keyingi 3 oy):**
- Knowledge base + vector search
- Multi-rol access
- Long-term memory + suhbat tarixi
- Custom wake words
- Mobile + planshet ko'rinishi
- Avatar (3D Jarvis ko'rinishi)

---

## 9. Hajm va resurs

| Komponent | Hajm | Vaqt |
|---|---:|---:|
| Backend `director-ai` moduli | ~3 500 LOC | 12 kun |
| 15 ta tool implementation | ~2 000 LOC | 8 kun |
| Voice pipeline (STT + TTS) | ~800 LOC | 4 kun |
| Frontend HUD components | ~4 500 LOC | 14 kun |
| Three.js effekt'lar | ~1 200 LOC | 5 kun |
| Test (unit + E2E) | ~2 000 LOC | 6 kun |
| Polish + design + integratsiya | — | 5 kun |
| **JAMI** | ~14 000 LOC | **~54 kun (1 odam) yoki 6 hafta (2 odam)** |

**Tashqi xarajatlar (oylik):**
- Anthropic Claude API: ~$200–500 (har direktor uchun)
- OpenAI Whisper: ~$50–100
- ElevenLabs TTS: ~$100–200
- Qo'shimcha Redis: $0 (mavjud)
- **Jami: ~$350–800/oy**

---

## 10. Qabul mezonlari (DONE = quyidagi hammasi PASS)

- [ ] `/jarvis` route ochilganda HUD <2s da to'liq yuklanadi
- [ ] Mikrofon ovozini eshitib transkriptsiya qiladi (UZ va RU)
- [ ] 15 ta read-only tool 100% ishlaydi
- [ ] 5 ta high-stakes tool tasdiqlash flow bilan ishlaydi
- [ ] Streaming javob: birinchi token < 800ms
- [ ] Critical action PIN bilan himoyalangan
- [ ] PII redaction barcha tool input/output'da
- [ ] Cost budget alerts ishlaydi
- [ ] Audit log har bir suhbat va action'ni yozadi
- [ ] Playwright E2E: 5 ta foydalanuvchi senariyasi
- [ ] Visual regression: HUD elementlari pixel-perfect

---

## 11. Risk

| Risk | Ehtimol | Ta'sir | Yumshatish |
|---|:---:|:---:|---|
| Claude UZ tarjima sifati past | O'rta | O'rta | UZ system prompt + glossary + RU fallback |
| Whisper UZ accent tushunmaydi | Yuqori | Yuqori | Custom fine-tuning yoki RU primary |
| Voice latensiya yuqori | O'rta | Yuqori | Edge caching + streaming TTS |
| Tool noto'g'ri ma'lumot qaytaradi | O'rta | Yuqori | Source citation + cross-check ikkinchi tool bilan |
| 3D HUD eski kompyuterda sekin | Yuqori | O'rta | "Low-fi mode" tugmasi (2D fallback) |
| Direktor ovoz bilan ishlashga o'rganmagan | O'rta | O'rta | Matn-only fallback + tutorial |

---

## 12. Birinchi qadam (Quick Start)

```bash
# 1. Yangi modul yaratish
cd Uzbek-Language-Module
mkdir -p apps/api/src/modules/director-ai/{domain,application,infrastructure,presentation}

# 2. Anthropic SDK allaqachon bor
# (paket: @anthropic-ai/sdk ^0.32.0 mavjud)

# 3. Yangi paketlar
pnpm --filter @europrint/api add @anthropic-ai/sdk@latest
pnpm --filter @europrint/api add openai elevenlabs

# 4. Frontend yangi paketlar
pnpm --filter erp-dashboard add three @react-three/fiber @react-three/drei

# 5. Boshlash uchun birinchi tool
# apps/api/src/modules/director-ai/application/tools/kpi-snapshot.tool.ts
```

---

## 13. Bitta jumlali xulosa

> **EuroPrint Jarvis — bu sizning ERP loyihangizning navbatdagi katta sakrashi. 6 hafta + 2 odam + ~$500/oy API xarajati bilan, direktoringiz ovoz bilan butun korxonani boshqarish imkoniyatiga ega bo'ladi. Asosiy g'oya — 891 sahifa o'rniga bitta JARVIS.**
