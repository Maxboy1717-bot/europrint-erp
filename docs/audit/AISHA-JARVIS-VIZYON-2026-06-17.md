# AISHA — JARVIS-uslubli AI yordamchi VIZYON (egasi, 2026-06-17)
> Egasi to'liq spec'ni 2 marta yubordi + rasm (Higgsfield/Iron Man uslubidagi immersiv UI). Bu — Aisha'ning YAKUNIY MAQSADI.
> ⏱️ Bajarish: **#15 AI slot** (sweep o'sha modulga yetganda). Hozir vizyon sifatida qayd qilindi. Advisor=Claude, Executor=Muslimbek.

## EGASI QARORLARI (2026-06-17)
- **Aisha ERP ICHIDA javob beradi** + ERP'ga xos javoblar (zavod holati/buyurtma/ombor/moliya). Miya ERP'da.
- ❌ **Hozirgi interfeys/ko'rinish YOQMAYDI** → futuristik immersiv UI kerak (rasmdagi kabi).
- ❌ **Direktor dashboard'ga ulanib qolgan** → **ALOHIDA MODUL** bo'lishi kerak (o'z sahifa/route/sidebar).
- **Maqsad = IKKALASI:** zavod-ERP + shaxsiy yordamchi.
- **Dizayn-istisno tasdiqlandi:** Aisha uchun MAXSUS futuristik dizayn (Qoida 21 EP-token istisno — egasi belgilaydi, Q-41). Faqat shu modul; qolgan ERP EP-token'da qoladi.

## ARXITEKTURA — 2 QATLAM (halol: web ≠ desktop OS-control)
**Layer A — ERP MIYA (web, MAVJUD, ~tayyor):** `modules/aisha` — Claude + ~30 tool (inventar/buyurtma/ishlab-chiqarish/sifat/moliya/kamera-VLM/email/telegram/eslatma) + pending-approval + SSE. **Ish:** direktor-dashboard'dan AJRATISH → alohida modul + futuristik web-UI + tool'larni to'liqlash. ⚠️ ANTHROPIC_API_KEY kerak.

**Layer B — DESKTOP JARVIS client (YANGI, Python):** kompyuterda ishlaydi, Layer A miyasini API orqali ishlatadi. OS-control SHU YERDA (serverda emas mumkin emas). 5 qism:
1. **Quloq (STT):** wake-word ("Uyg'on") → mikrofon (PyAudio/SpeechRecognition) → **Whisper** (o'zbekcha aniq) → matn.
2. **Miya (LLM):** matn → intent → **JSON action** (`{"action":"play_youtube","query":"...","response_text":"..."}`). ERP savol bo'lsa → Layer A `/aisha/chat`; shaxsiy bo'lsa → OS-action.
3. **Til (TTS):** `response_text` → **edge-tts** (o'zbek neyron ovoz, bepul) → pygame/playsound.
4. **Qo'llar (OS-automation):** webbrowser/pywhatkit (YouTube), os/subprocess (Telegram/ilova ochish), **pyautogui** (yozish/Enter/sichqoncha). ⭐ **XAVFSIZLIK:** har OS-amal (Telegram yuborish, fayl) → **inson TASDIG'i** orqali (1-printsip: AI belgilaydi→inson qaror; pending-approval mavjud). Avto-bajarmaydi.
5. **Yuz (GUI):** PyQt5/PyQt6/CustomTkinter — to'q fon + neon, markazda jonli orb/yadro; tinglayotganda bir xil, gapirayotganda boshqa animatsiya (if/else). Rasm = mos namuna.

**Zanjir:** Wake word → mic → Whisper → LLM(JSON) → [ERP-tool YOKI OS-action, kerak bo'lsa tasdiq] → edge-tts ovozli javob.

## BAJARISH REJASI (#15 AI slot)
1. **Layer A (web, avval):** Aisha'ni direktor-dashboard'dan decouple → alohida route/sahifa/sidebar; futuristik UI (immersiv orb, reaktiv animatsiya); zavod+shaxsiy tool'lar; Faza-0 re-audit (SSE tool-loop real-mi tekshir).
2. **Layer B (desktop, keyin):** Python JARVIS client (alohida ilova/repo) — STT/TTS/OS-control/GUI, Layer A miyasiga ulanadi. OS-control = approval-gated.
3. Har ikki qatlam: o'z-o'zini tekshirish + DB/jonli isbot + (desktop uchun) jonli demo.

## OCHIQ SAVOLLAR (#15'da egasidan)
- Wake-word so'zi? ("Aisha"/"Uyg'on"/boshqa). LLM = Claude (ERP bilan bir xil) yoki ChatGPT (spec'da openai)? Desktop client qaysi OS (Windows)? Telegram = desktop-ilova (pyautogui) yoki Bot API (xavfsizroq)?

## MANBA
Egasi xabari 2026-06-17 (2× spec + Higgsfield/Iron Man rasm). Mavjud kod: `apps/api/src/modules/aisha/` (chat/voice/wake-config controller, 30 tool, claude/gemini, whisper/elevenlabs, SSE gateway). Bog'liq: [[project_vision_capture_and_build_pipeline_2026_06_08]] (#15 AI).
