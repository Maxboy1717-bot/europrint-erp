# 💬 CHAT — TELEGRAM DARAJASIGA TAQQOSLASH + INPUT MAYDONLAR (chuqur qayta tahlil)
> Sana: 2026-06-04 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Har da'vo dalil bilan (fayl:qator yoki baza). Avvalgi "~70% kuchli" topilma NOLDAN, chuqurroq qayta tekshirildi.

> **Egasi vizyoni:** Chat — professional, Telegram darajasidagi ichki messenjer (oddiy chat emas, ko'p funksiyali).

> ⭐⭐ **BIR JUMLALI XULOSA (qayta tekshirildi — avvalgidan ham KUCHLIROQ chiqdi):** Chat Telegram'ga
> ANCHA YAQIN. ~32 Telegram funksiyasidan **~20 tasi to'liq BOR, ~7 tasi qisman, ~5 tasi yo'q**. Asosiy
> messenjer (shaxsiy/guruh, jonli yetkazish, javob/uzatish/tahrir/o'chirish/qadab qo'yish/reaksiya/ovozli/
> fayl/so'rovnoma/qidiruv/ovozsizlantirish/push) — HAQIQATAN ishlaydi va DATA bor (34 xabar). Yetishmayotgani:
> @eslatma (mention), rejalashtirilgan xabar, qoralama, "o'zimga xabar", va eng muhimi — **ERP voqealari
> chatga tushmaydi**.

> **DB:** 14 chat jadval + data (chat_messages=34, chat_rooms=6 [1 GURUH + 5 SHAXSIY], chat_members=12).

---

# KASHFIYOT — sahifalar, hodisalar, funksiya inventari

**Topildi: 2 chat sahifa (ChatPage, ChatAdminPage), ~9 input maydon, 14 jadval, 18 jonli hodisa, 6 backend controller (~53 endpoint).**

**Jonli hodisalar (websocket):** message:send, message:edit, message:delete, reaction:toggle, mark:read, typing/typing:start/typing:stop, direct:start, join_room, get_messages, get_rooms (chat.gateway.ts). **Jonli mexanizm: HAQIQIY websocket (yangilash SHART EMAS).**

---

# 🅰️ PART A — INPUT MAYDONLAR (foydalanuvchi qo'lda kiritadigan / biriktiradigan)

## FORMA 1 — Xabar yozish qutisi (composer — MessageArea/ChatLayoutMessages.tsx)
| Maydon | Turi | Majburiy? | Qayerga saqlanadi | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| Xabar matni | matn | ✅ HA (bo'sh bloklanadi) | chat_messages.content | bo'sh→blok | 🟢 REAL |
| Fayl/rasm biriktirish | fayl | yo'q | chat_messages.file_url (upload) | ⚠️ hajm/tur tekshirilsin | 🟢 REAL |
| Ovozli xabar (yozib olish) | ovoz | yo'q | chat_messages.file_url (ovoz fayli, ChatLayout:266) | yo'q | 🟢 REAL |
| Reaksiya (emoji) | emoji | yo'q | chat_reactions | yo'q | 🟢 REAL |
| Javob berish (reply) | kontekst | yo'q | chat_messages.reply_to_id | yo'q | 🟢 REAL |
| Tahrirlash (edit) | matn | yo'q | chat_messages (is_edited) | yo'q | 🟢 REAL |
| So'rovnoma savol+variant | matn | ✅ HA | chat_polls + chat_poll_votes | yo'q | 🟢 REAL |

## FORMA 2 — Shaxsiy/guruh yaratish (DirectMessageModal.tsx)
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| Xodim qidirish (a'zo tanlash) | matn/tanlov | ✅ HA | chat_members | yo'q | 🟢 REAL |
| Guruh nomi | matn | ✅ HA | chat_rooms.name | yo'q | 🟢 REAL |

## FORMA 3 — Qidiruv
| Maydon | Turi | Majburiy? | Qayerga | Tekshiruv | Real/SOXTA |
|---|---|---|---|---|---|
| Qidiruv so'zi | matn | yo'q | chat_messages bo'ylab qidiradi (searchMessages, chat-ext:89) | yo'q | 🟢 REAL |

### PART A xulosasi (sodda)
- **MUSTAHKAM:** xabar matni, fayl, ovozli, reaksiya, javob, tahrir, so'rovnoma, a'zo tanlash, qidiruv — hammasi ROST saqlanadi. Input tomoni Telegram darajasiga yaqin.
- **🔴 YO'Q (maydon ham yo'q):** @eslatma (mention) qutisi, rejalashtirilgan-vaqt tanlash, qoralama, "o'zimga xabar".
- **⚠️ TEKSHIRUVSIZ:** fayl hajmi/turi cheklovi aniq emas (juda katta fayl yoki xavfli tur o'tishi mumkin — tekshirilsin).

---

# 🅱️ PART B — TELEGRAM FUNKSIYALARI: BOR / QISMAN / YO'Q

## Messenjer asosi
| Funksiya | Holat | Dalil / sodda izoh |
|---|---|---|
| Shaxsiy xabar (1-1) | ✅ BOR | DIRECT turi, 5 xona; direct:start hodisa |
| Guruh chati | ✅ BOR | GROUP turi, 1 xona |
| Kanal (bir tomonlama) | 🟡 QISMAN | FE'da `isChannelReadOnly` bayrog'i bor, lekin DB'da CHANNEL turi yo'q (faqat GROUP/DIRECT) |
| **Jonli yetkazish** | ✅ BOR | Haqiqiy websocket (message:send) — yangilash shart emas |
| Online / oxirgi ko'rilgan | 🟡 QISMAN | Online jonli (userSockets broadcast); oxirgi-ko'rilgan saqlash to'liq tasdiqlanmadi |
| **Yozyapti ko'rsatkichi** | ✅ BOR | typing → `user_typing` broadcast (helper:147) — haqiqiy |
| O'qildi belgisi (✓✓) | 🟡 QISMAN | last_read_at + last_read_message_id + unread_count (chat_members) — o'qilmagan/oxirgi-o'qilgan REAL; lekin har xabarga "hamma ko'rdi" ✓✓ cheklangan |
| O'qilmagan sanagich | ✅ BOR | unread_count ustun + emit |

## Xabar funksiyalari
| Funksiya | Holat | Dalil |
|---|---|---|
| Javob (reply) | ✅ BOR | reply_to_id + onReply |
| Uzatish (forward) | ✅ BOR | forward_from_id ustun + onForward |
| Tahrirlash (edit) | ✅ BOR | message:edit + is_edited |
| O'chirish (delete) | ✅ BOR | message:delete hodisa |
| Qadab qo'yish (pin) | ✅ BOR | is_pinned + chat_starred_messages + onPin/onUnpin |
| Reaksiya (emoji) | ✅ BOR | reaction:toggle + chat_reactions |
| Mavzular (thread) | 🟡 QISMAN | thread_root_id ustun + onThread bor, lekin chuqur thread cheklangan |
| **@eslatma (mention)** | ❌ YO'Q | mention/notifyMention backend topilmadi |

## Media va fayllar
| Funksiya | Holat | Dalil |
|---|---|---|
| Rasm yuborish + ko'rish | ✅ BOR | file_url + uploads controller |
| Fayl/hujjat | ✅ BOR | chat-advanced-uploads |
| **Ovozli xabar** | ✅ BOR | yozib olish→fayl→file_url (ChatLayout:266) + VoiceMessagePlayer |
| Video qo'ng'iroq | 🟡 QISMAN | **Jitsi** (tashqi xizmat) embed — REAL, lekin uchinchi tomon (ChatLayoutMessages:5 "Jitsi video call panel") |
| Fayl hajmi/turi cheklovi | 🟡 QISMAN | upload bor, lekin aniq hajm/tur limiti tasdiqlanmadi |

## Tartib va qidiruv
| Funksiya | Holat | Dalil |
|---|---|---|
| Xabar qidirish | ✅ BOR | searchMessages (chat-ext:89) real |
| Chat ichida qidirish | ✅ BOR | showSearch/onToggleSearch + searchMessages |
| Papka/arxiv | 🟡 QISMAN | Arxiv ✅ real (archiveRoom, chat-admin:44); papka (folder) yo'q |
| Ovozsizlantirish (mute) | ✅ BOR | toggleMemberMute real (chat-room:106) |

## Ilg'or (Telegram darajasi)
| Funksiya | Holat | Dalil |
|---|---|---|
| **Bot / ERP voqealari chatga** | ❌ YO'Q | Hech bir modul chatga avtomatik xabar tashlamaydi (20-modulda tasdiq); teskari (chat→vazifa) bor |
| So'rovnoma | ✅ BOR | chat_polls + chat_poll_votes + onCreatePoll |
| Rejalashtirilgan xabar | ❌ YO'Q | scheduled_at ustun yo'q, backend yo'q |
| Qoralama (draft) | ❌ YO'Q | draft backend yo'q |
| "O'zimga xabar" (saved) | ❌ YO'Q | saved-messages backend yo'q |
| Ko'p qurilma sinxron | ✅ BOR | server-saqlash + websocket (ko'p qurilma) |
| Push bildirishnoma | ✅ BOR | chat_push_subscriptions jadval |

### PART B hisobi
- ✅ **BOR (to'liq real): ~20** — DM, guruh, jonli, yozyapti, o'qilmagan, javob, uzatish, tahrir, o'chirish, pin, reaksiya, rasm, fayl, ovozli, qidiruv (×2), mute, so'rovnoma, ko'p-qurilma, push
- 🟡 **QISMAN: ~7** — kanal, online/oxirgi-ko'rilgan, o'qildi ✓✓, thread, video (Jitsi), fayl-limit, papka/arxiv
- ❌ **YO'Q: ~5** — @eslatma, ERP voqealari→chat, rejalashtirilgan, qoralama, "o'zimga xabar"

---

# UMUMIY XULOSA

## ⭐⭐ TELEGRAM-GAP VERDIKTI (egasi savoli) — qanchalik yaqin?
**Chat Telegram'ga JUDA YAQIN — ~62% funksiya to'liq bor, ~22% qisman, ~16% yo'q.** Asosiy messenjer tajribasi (shaxsiy/guruh, jonli, javob/uzatish/tahrir/o'chirish/pin/reaksiya/ovozli/fayl/so'rovnoma/qidiruv/mute/push) HAQIQATAN Telegram darajasida ishlaydi va DATA bor (34 xabar — odamlar ishlatgan).

**Telegram darajasiga yetish uchun eng katta yetishmovchiliklar:**
1. ❌ **@eslatma (mention)** — "@Ali, buni ko'r" deb chaqirish + bildirishnoma yo'q
2. ❌ **ERP voqealari→chat (bot)** — eng muhim ERP uchun (pastda)
3. ❌ **Rejalashtirilgan xabar / qoralama / "o'zimga xabar"** — Telegram qulayliklari
4. 🟡 **O'qildi ✓✓ va kanal** — yarim (oxirgi-o'qilgan bor, lekin to'liq ✓✓ va bir tomonlama kanal cheklangan)

## ⭐ JONLI VERDIKT
**JONLI — haqiqiy real-time (yangilash SHART EMAS).** message:send darhol xonaga tarqaladi; yozyapti ko'rsatkichi va online ham jonli. Telegram kabi.

## ⭐ ERP-BOG'LANISH VERDIKTI (eng muhim ERP uchun)
**❌ Chat ERP'dan AJRALGAN.** Hech bir modul chatga avtomatik xabar tashlamaydi — "vazifa biriktirildi", "tasdiq kerak", "kam qoldiq" chatda KO'RINMAYDI. Telegram'da bu "bot xabarlari" — ERP'da eng foydali bo'lardi, lekin yo'q. (Teskari: xabardan vazifa yaratish — chat_message_tasks — BOR, lekin ishlatilmagan.)

## DB MUAMMOLARI (sodda)
- ❌ `chat_messages`da `scheduled_at` yo'q (rejalashtirilgan xabar), mention jadvali yo'q
- 🟡 Kanal uchun alohida tur yo'q (faqat GROUP/DIRECT) — FE bayroq bor, DB turi yo'q
- ✅ 14 jadval + data: forward_from_id, reply_to_id, thread_root_id, is_edited, is_pinned, file_url ustunlari BOR; chat_members'da last_read_at/last_read_message_id/unread_count (o'qildi-kuzatuv real)

## ⭐ TOP 5 — Telegram darajasiga yetish uchun birinchi shular
1. ❌ **@eslatma (mention) + bildirishnoma** — guruhda odamni chaqirish (Telegram asosiy)
2. ❌ **ERP voqealari→chat (bot xabarlari)** — "vazifa/tasdiq/kam qoldiq" chatga (ERP uchun eng qimmatli)
3. ❌ **Rejalashtirilgan xabar + qoralama + "o'zimga xabar"** — Telegram qulayliklari
4. 🟡 **O'qildi ✓✓ to'liq + bir tomonlama kanal** — yarimni to'ldirish
5. ⚠️ **Fayl hajmi/turi cheklovi** — xavfsizlik (juda katta/xavfli fayl bloklanmaydi)

---

## XULOSA (egasiga)
Chat — chuqurroq tekshirgandan keyin AVVALGIDAN HAM KUCHLIROQ chiqdi. Bu oddiy chat emas — Telegram darajasidagi asosiy funksiyalar HAQIQATAN ishlaydi: shaxsiy va guruh xabarlari, jonli yetkazish (yangilamasdan), yozyapti ko'rsatkichi, javob/uzatish/tahrir/o'chirish, qadab qo'yish, reaksiya (emoji), ovozli xabar, fayl/rasm, so'rovnoma, qidiruv, ovozsizlantirish, push bildirishnoma, hatto video qo'ng'iroq (Jitsi). Va DATA bor (34 xabar, 6 xona) — odamlar buni ROST ishlatgan.

Telegram'ga yetish uchun ~16% yetishmaydi: @eslatma (mention), rejalashtirilgan xabar, qoralama, "o'zimga xabar", va eng muhimi (ERP uchun) — boshqa modullar chatga avtomatik xabar tashlamaydi. Ya'ni messenjer sifatida deyarli tayyor, lekin "aqlli ERP yordamchisi" sifatida hali ulanmagan.

⭐ **Halol javob:** Chat — butun ERP'dagi eng to'liq, eng professional modullardan biri. Telegram'ning ~⅔ funksiyasi haqiqatan bor va ishlatilgan. Qolgan ⅓ — asosan qulaylik (mention/scheduled/draft) va ERP-integratsiya (bot xabarlari).

Metafora: bu — deyarli to'liq Telegram klonи, o'z serveringizда. Yozasiz, jonli boradi, ovozli yuborasiz, fayl tashlaysiz, qo'ng'iroq qilasiz, reaksiya bosasiz — hammasi ishlaydi va saqlanadi. Faqat bir nechta zamonaviy qulaylik (kimnidir @ bilan chaqirish, keyinga rejalashtirish, o'zingizga eslatma) hali yo'q, va eng achinarlisi — zavodning o'zi bu chatga "yangi vazifa keldi" deb yozmaydi (Telegram botlari kabi), garchi shu eng foydali bo'lar edi.

> Hech narsa o'zgartirmadim (faqat o'qidim + bu hujjatni yozdim). Tuzatishni Agent 1 sizning qaroringiz bo'yicha qiladi.
