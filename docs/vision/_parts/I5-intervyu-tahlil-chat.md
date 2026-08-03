## Yo'naltirilgan intervyu — INTERVYU-TAHLIL + CHAT (Manba I5)

**Manba:** `docs/INTERVYU-TAHLIL-HISOBOT-2026-06-05.md` + `docs/CHAT-TELEGRAM-GAP-INPUT-2026-06-04.md` + `docs/modul20-chat-FULL-2026-06-03.md`. **Qachon:** 2026-06-03..05.

### Step 2 — Qarorlar jadvali
| # | Savol/Talab | Manba fayl | Nima uchun | Qaysi qismiga ta'sir | Nima o'zgarishi kerak edi | Amalga oshirilganmi | Modul | Izoh |
|---|---|---|---|---|---|---|---|---|
| 1 | "Butun ERP org-strukturaga bog'lanadi" — bitta manba `head_user_id` | INTERVYU-TAHLIL (Topilma C) | Master-data yagona manbadan; eskalatsiya/tasdiq shunga tayanadi | Org, butun ERP | `head_user_id` master, hamma modul shunga ulanadi | Qisman — `org_departments.head_user_id` 18/145 to'ldirilgan (RECON SB0215/SB0068, owner-data gap) | Org | Kod bor, DATA yo'q — egadan kutilmoqda |
| 2 | `manager_id` `head_user_id`'dan avtomatik to'ldirilsin | INTERVYU-TAHLIL (Topilma C) | Eskalatsiya/tasdiq zanjiri; hozir 30/30 NULL | HR, Org, Koordinatsiya | Avto-backfill mexanizmi + DATA | Qisman — kanonik ustun `head_user_id`, ko'pi NULL (RECON SB0068 PARTIALLY-RESOLVED) | HR | 06-05'da 30/30 NULL; keyingi memory DEPT_HEAD fallback ishlatishni tavsiya qildi |
| 3 | Lid: `sd_leads` + `crm_leads` → BITTA | INTERVYU-TAHLIL M1-1 | Ikki lid olami dublikat | Savdo/CRM | `sd_leads` DROP, kod `crm_leads`'ga repoint | Ha — DB-isbot: `to_regclass('sd_leads')`=YO'Q, crm_leads=5 kanonik (STEP 1) | Savdo/CRM | RECON bu specifik merge'ni qamramaydi; manbaning o'z DB-proof'i |
| 4 | Taklif: 2 sahifa → BITTA | INTERVYU-TAHLIL M1-2 | Dublikat taklif sahifasi | Savdo/CRM | SDSalesQuotes kanonik, 8 yetim fayl o'chir | Ha — commit b84a7a70 (STEP 2), tsc PASS | Savdo/CRM | — |
| 5 | Buyurtma: 3 olam (orders/sd_orders/ow_orders) → BITTA | INTERVYU-TAHLIL M1-3 | Uch buyurtma olami | Savdo/PP/MES | Yagona kanonik jadval | Qisman — `sales_orders`=12 kanonik (a1bb3ec5); production-order olami DEFERRED (arxitektura intervyu) | Savdo/CRM | Two-Worlds loop IN-PROGRESS; RECON SB0287/88 `production_orders.sales_order_id` FK ulangan, lekin to'liq unifikatsiya emas |
| 6 | Order-* sahifalar → BITTA (yaratish+ro'yxat+holat) | INTERVYU-TAHLIL M1-4 | Tarqoq order sahifalari | Savdo/CRM | 1 sahifaga birlashtir | Qisman — OrdersRegistry+OrderStatus bor, OrderCreate topilmadi | Savdo/CRM | cross-ref kerak (RECON qamramaydi) |
| 7 | Narx formulasi → taklifga ulansin (hozir o'lik) | INTERVYU-TAHLIL M1-7 | price_formulas hisoblab, taklifga qo'llansin | Savdo/CRM | Taklif-yaratishda avto-narx | Qisman — calculatePrice REAL (sd-quotations.service:87), FE avto-qo'llash tasdiqlanmagan | Savdo/CRM | cross-ref kerak |
| 8 | Email/SMS/WhatsApp → halol "tayyor emas" qil | INTERVYU-TAHLIL M1-8 | Hozir soxta `sent:true` qaytaradi | Savdo/CRM, Marketing | Yashil-yolg'onni olib tashla, halol not-ready | Yo'q — crm-comms.service:16-40 hali `Ok({sent:true})` (faqat log) | Savdo/CRM | Qaror BAJARILMAGAN; cross-ref kerak (keyingi hujjat o'zgartirmadi) |
| 9 | Kvota maqsadlari `sd_kpi_targets` → jadval qur | INTERVYU-TAHLIL M1-9 | Kvota/KPI kuzatuvi | Savdo/CRM | Jadval yaratilsin | Yo'q — `to_regclass('sd_kpi_targets')`=YO'Q | Savdo/CRM | cross-ref kerak |
| 10 | Buyurtma line-item (har mahsulot alohida) | INTERVYU-TAHLIL M1-D | FE "umumiy summa" ishlatadi | Savdo/CRM | line-item to'ldirilsin | Qisman — `sales_order_items` jadval BOR, 0 qator | Savdo/CRM | Jadval bor, hech qachon ishlatilmagan |
| 11 | Menejer buyurtma-paneli (o'z buyurtmalari, bosqich, real-time) | INTERVYU-TAHLIL M1-D | Menejerga panel yo'q | Savdo/CRM | ManagerPanel qurilsin | Yo'q — sahifa topilmadi | Savdo/CRM | Qurilmagan |
| 12 | Faktura ALOHIDA sahifa | INTERVYU-TAHLIL M1-2(B) | Faktura alohida ko'rinish | Savdo/CRM, Moliya | Alohida sahifa | cross-ref kerak — 06-05'da tekshirilmadi | Savdo/CRM | Manba "keyingi tur" dedi |
| 13 | Mijoz: `/sd/customers` (ro'yxat) + Customer360 (profil) — ikkalasi | INTERVYU-TAHLIL M1-F | Ro'yxat + profil ikkalasi kerak | Savdo/CRM | Ikkovi mavjud bo'lsin | Ha — Customer360 + customers ro'yxati SD modulida | Savdo/CRM | ISHLAYDI |
| 14 | SD sahifalar: Shartnoma/Yetkazish/To'lov/Qarzdor | INTERVYU-TAHLIL M1-E | To'liq SD to'plami | Savdo/CRM | 4 sahifa mavjud bo'lsin | Qisman — SdContracts+SdDeliveries bor; SdPayments nomi mos emas, debtors tekshirilmadi | Savdo/CRM | cross-ref kerak |
| 15 | Method: "hammaning hozirgi holatini aniqla — intervyu shunga qarab" | INTERVYU-TAHLIL §4 | Egasi intervyu-usuli qarori | Butun tizim | Har modul joriy holati aniqlansin | Ha — 20-modul holat jadvali (§4) bajarildi | Umumiy | Bu meta-direktiva; keyin FULL-VISION-EXTRACTION-2026-07-07 davom ettirdi |
| 16 | Chat = professional, Telegram darajasidagi ichki messenjer | CHAT-GAP; modul20-chat | Oddiy chat emas, ko'p funksiyali | Chat (M20) | Telegram ~32 funksiya darajasi | Qisman — ~62% to'liq, ~22% qisman, ~16% yo'q; asosiy messenjer REAL + data(34) | Chat | Manbaning o'zi "ERP'dagi eng kuchli modul" dedi |
| 17 | Chat JONLI (real-time) bo'lsin — yangilash shart emas | modul20-chat (asosiy savol) | Egasining №1 savoli | Chat (M20) | Websocket jonli yetkazish | Ha — chat.gateway REAL websocket (message:send:175); online/typing jonli | Chat | Tasdiqlangan yaxshi xabar |
| 18 | @eslatma (mention) + bildirishnoma | CHAT-GAP (Top-5 #1) | Guruhda odamni chaqirish | Chat (M20) | mention backend + notify | Yo'q — mention/notifyMention backend topilmadi | Chat | cross-ref kerak |
| 19 | ERP voqealari → chatga avtomatik (bot xabarlari) | CHAT-GAP; modul20-chat (eng muhim) | "vazifa/tasdiq/kam qoldiq" chatda ko'rinsin | Chat + butun ERP | Modullar chatga broadcast qilsin | Yo'q — hech bir modul `broadcastToRoom`/`getChatServer` chaqirmaydi (grep bo'sh) | Chat | ERP uchun eng qimmatli; cross-ref kerak. Teskari (chat→vazifa) BOR lekin 0 |
| 20 | Rejalashtirilgan xabar (scheduled) | CHAT-GAP | Telegram qulayligi | Chat (M20) | `scheduled_at` + backend | Yo'q — ustun yo'q, backend yo'q | Chat | — |
| 21 | Qoralama (draft) | CHAT-GAP | Telegram qulayligi | Chat (M20) | draft backend | Yo'q — backend yo'q | Chat | — |
| 22 | "O'zimga xabar" (saved messages) | CHAT-GAP | Telegram qulayligi | Chat (M20) | saved-messages backend | Yo'q — backend yo'q | Chat | — |
| 23 | O'qildi belgisi ✓✓ to'liq | CHAT-GAP | Yarim — oxirgi-o'qilgan bor | Chat (M20) | Har xabarga "hamma ko'rdi" | Qisman — last_read_at/unread_count REAL; to'liq ✓✓ cheklangan | Chat | — |
| 24 | Kanal (bir tomonlama) turi | CHAT-GAP | FE bayroq bor, DB turi yo'q | Chat (M20) | DB'da CHANNEL turi | Qisman — `isChannelReadOnly` FE bayroq; DB faqat GROUP/DIRECT | Chat | — |
| 25 | Fayl hajmi/turi cheklovi (xavfsizlik) | CHAT-GAP | Katta/xavfli fayl bloklanmaydi | Chat (M20) | Upload limit/tur tekshiruvi | Qisman — upload bor, aniq limit tasdiqlanmadi | Chat | Xavfsizlik; cross-ref kerak |
| 26 | Bildirishnoma markazi chatdan alohida — 2 tizim | modul20-chat §3 | Ikki xil "xabar" tushunchasi | Chat/Bildirishnoma | Birlashtirish ko'rib chiqilsin | Qisman — NotificationCenter ko'rish REAL, chatdan alohida | Chat | Gap sifatida qayd; egadan qaror kerak |
| 27 | Chat→vazifa (`chat_message_tasks`) ishlatilsin | modul20-chat §3 | Jadval bor, 0 qator | Chat/Vazifalar | Xabardan vazifa oqimi ishlatilsin | Qisman — `chat_message_tasks` jadval + createMessageTask BOR, 0 qator | Chat | Mexanizm bor, ishlatilmagan |

### Step 3 — Ochiq savollar
| Savol/Muammo | Qachon ko'tarilgan | Manba | Nega hali ochiq | Modul |
|---|---|---|---|---|
| Modul 3-20 "birlashtir/tuzat" qarorlari JAVOBSIZ ("kutilmoqda") | 2026-06-05 | INTERVYU-TAHLIL §1 Topilma A, §5 | INTERVYU-QARORLARI faqat M1/M2/Org uchun qaror bergan; qolganlari uchun avval egasi intervyusi kerak | Umumiy (3-20) |
| Buyurtma production-order olami birlashtirilishi | 2026-06-05 | INTERVYU-TAHLIL §1 Topilma B (3 DEFERRED) | "order/QC arxitektura intervyusi" kutmoqda; A.4 production-order olami | Savdo/PP/MES |
| `sd_sales_orders` view (C) qaror | 2026-06-05 | INTERVYU-TAHLIL Topilma B | Arxitektura intervyusiga qoldirilgan | Savdo/CRM |
| QC verdict zanjiri (D) qaror | 2026-06-05 | INTERVYU-TAHLIL Topilma B | Arxitektura intervyusiga qoldirilgan | QC |
| Email/SMS halol "tayyor emas"mi yoki HAQIQIY gateway? | 2026-06-05 | INTERVYU-TAHLIL M1-8 | Qaror aniq emas — soxta `sent:true` hali turibdi | Savdo/CRM, Marketing |
| Bildirishnoma markazi chat bilan birlashtirilsinmi? | 2026-06-03 | modul20-chat §3 | Ikki "xabar" tizimi; egadan yo'nalish kerak | Chat/Bildirishnoma |
| `head_user_id`/`manager_id` DATA egasidan (0% tayyorlik) | 2026-06-05 | INTERVYU-TAHLIL Topilma C | Owner-data — kim kimni boshqaradi (fabrikatsiya qilib bo'lmaydi) | HR/Org |
