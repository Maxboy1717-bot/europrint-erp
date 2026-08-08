# ADR-007: AIsha — kanonik AI Direktor Yordamchisi

**Sana:** 2026-08-08
**Holat:** ✅ QABUL QILINGAN
**Qaror qabul qildi:** Egasi mandati bilan (MENEJER: "men flag-qaror qabul qilaman") — to'liq
kod-bazasi tahlili asosida (`docs/adr/../nimaaga-to-xtadiz-workflow-qani-lazy-moth.md` reja
hujjatidagi AI Direktor Assistant blueprint, egasi tomonidan tasdiqlangan)

---

## Muammo

Tahlil shuni ko'rsatdiki, ERP'da AI-yordamchi funksiyasi uchun **to'rtta qisman bir-birini
takrorlovchi tizim** allaqachon mavjud:

1. **AIsha** (`apps/api/src/modules/aisha/`) — to'liq chat + 30 ta tool + HITL-tasdiqlash +
   ovoz (Whisper STT + ElevenLabs TTS) + suhbat-xotira (4 jadval) + rol-nazorat.
2. **`agents/director-agent.service.ts`** — `POST /api/agents/director/ask` — bitta-marta
   prompt→javob (tool-calling emas), 6 ta xom SQL bilan KPI-surat oladi.
3. **`ai/services/director-ai.service.ts` + `director-ai-strategy.service.ts`** —
   `AiDataRepository` orqali alohida, `agents/director-agent.service.ts`dan mustaqil.
4. **`CcBotService`** (Telegram CFO-bot) — `DirectorAgentService`ni qayta ishlatadi.

Yangi "direktor bilan tabiiy tilda suhbat + ovoz" talabini QAYSI tizim ustiga qurish —
tasodifiy tanlanmasligi kerak (5-chi parallel tizim yaratish xavfi bor).

## Qaror

**AIsha (`apps/api/src/modules/aisha/`) = yangi Direktor AI-funksiyalarining kanonik asosi.**

Sabab:
1. Yagona tizim, unda ALLAQACHON to'liq tool-calling sikli (`runTurn()`), HITL-tasdiqlash
   (`aisha_pending_approvals`), suhbat-xotira, ovoz-backend (Whisper/ElevenLabs) va rol-nazorat
   (`director/admin/super_admin/manager`) bor — boshqa uchtasida bularning HECH biri yo'q.
2. `agents/director-agent.service.ts`ning bitta-marta-prompt naqshi tabiiy-til
   ko'p-bosqichli suhbat (follow-up savollar) uchun yetarli emas — AIsha'ning iterativ
   tool-tanlash sikli buni allaqachon qiladi.
3. Ko'chirish yo'nalishi bir tomonlama va arzon: mavjud KPI-xizmatlarni (`OwnerSummaryService`,
   `drizzle-reports.repo.ts`, `SdDashboardRepository`, `WmsAnalyticsService`,
   `EmployeeKpiHandler` va h.k.) AIsha `IAishaTool` interfeysi bilan yupqa o'rab, `ToolRegistry`ga
   qo'shish kifoya — hisob-kitob mantig'ini qayta yozish shart emas.

## Boshqa uch tizimning taqdiri (o'zgartirilmaydi)

- **`agents/director-agent.service.ts`** — SAQLANADI, o'zgartirilmaydi. Sabab: `CcBotService`
  (Telegram CFO-bot, `/holat`/`/muammo`/`/bashorat` buyruqlari) uni haqiqatan qayta ishlatadi —
  bu ALOHIDA, kichik-doirali kanal (Telegram, ERP-panel emas), konsolidatsiya qilish foyda
  bermaydi, faqat Telegram-bot'ni buzish xavfini keltiradi.
- **`ai/services/director-ai(.strategy).service.ts`** — hozircha TEGILMAYDI (boshqa
  iste'molchilari bormi — alohida tekshiruv talab qiladi, bu ADR doirasidan tashqarida).
- **`AiRouterCallService`/`AiRouterService`** — TEGILMAYDI, `agents/*` va Telegram-bot uchun
  xizmat qilishda davom etadi.

## Qoida (yangi kod uchun)

```bash
# Yangi "direktor AI" funksiya so'ralganda:
# 1. AVVAL tekshir: mavjud AIsha tool bormi (apps/api/src/modules/aisha/application/tools/)
# 2. Yo'q bo'lsa: mavjud KPI-xizmatni (Finance/SD/WMS/HR/Director) yupqa IAishaTool bilan o'rab,
#    ToolRegistry'ga qo'sh — YANGI hisob-kitob yozma, mavjudini chaqir.
# 3. HECH QACHON: yangi alohida "AI chat" controller/service yaratma (5-chi tizim).
grep -rn "director-agent.service\|director-ai.service" apps/api/src/modules/agents apps/api/src/modules/ai
# Ikkalasi ham FAQAT o'z tor-doirali chaqiruvchilariga (Telegram-bot, mavjud endpoint) xizmat qilishi kerak —
# yangi FE-sahifa/endpoint ularga bog'lanmasin.
```

## Oqibat

- Barcha yangi "direktor bilan suhbat/savol-javob/ovoz" funksiyasi AIsha `ToolRegistry` +
  `runTurn()` orqali quriladi.
- AIsha'ning mavjud rol-siyosati (`director/admin/super_admin/manager`) meros olinadi — yangi
  permission-model ixtiro qilinmaydi.
- Har yangi tool `ai_usage_logs`/AIsha o'z audit-yo'liga (`aisha_tool_calls`) yoziladi —
  ikki marta hisoblanmaydi.
