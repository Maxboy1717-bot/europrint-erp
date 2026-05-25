// i18next — static script templates; i18next resolves labels at runtime
/**
 * @module PhoneScriptData
 * @description Static data constants for PhoneScriptSheet.
 * Split from PhoneScriptSheet.tsx (Rule 16).
 */

// ─── Material №53: Telefon Skripti — 5 qadam ───────────────────────────────
export const PHONE_SCRIPT_STEPS = [
  {
    num: 1,
    title: "Tanishish",
    color: "bg-blue-500",
    textColor: "text-[var(--ep-blue)]",
    border: "border-blue-200",
    bg: "bg-blue-50",
    script: [
      "Assalomu alaykum, [Ism]! Mening ismim [Rekruter ismi], EuroPrint kompaniyasidan qo'ng'iroq qilyapman.",
      "Siz [Lavozim nomi] pozitsiyasiga ariza topshirgansiz. Hozir gaplashish qulaymi?",
      "Juda yaxshi. Sizga bir necha savol berishim mumkinmi? Ko'pi bilan 10-15 daqiqa vaqtingizni olamiz.",
    ],
    tips: [
      "Ovozingiz xushchaqchaq va samimiy bo'lsin",
      "Nomzod bilan bir xil tezlikda gapiring",
      "Nomzod bosh tortsa — qulay vaqtni so'rang",
    ],
  },
  {
    num: 2,
    title: "Natijalar savoli",
    color: "bg-violet-500",
    textColor: "text-[var(--ep-purple)]",
    border: "border-violet-200",
    bg: "bg-violet-50",
    script: [
      "Sizning joriy ish joyingiz yoki oxirgi ish joyingiz haqida gapirib bering. Qanday lavozimda ishlayapsiz/ishlagansiz?",
      "Shu lavozimda qanday katta natijalarga erishdingiz? Aniq raqamlar bilan ayta olasizmi?",
      "O'sha natijaga erishish uchun nima qildingiz? Qanday yondashuv qo'lladingiz?",
      "Hozirgi ish joyingizdan nima sababdan ketmoqchi bo'layapsiz?",
    ],
    tips: [
      "Natijalarni aniqlashtiring: raqamlar, foizlar, muddatlar",
      "\"Biz\" emas, \"Men\" degan javoblarni rag'batlantiring",
      "Sabab-natija mantiqini tekshiring",
    ],
  },
  {
    num: 3,
    title: "Qidirish mezonlari",
    color: "bg-amber-500",
    textColor: "text-[var(--ep-yellow)]",
    border: "border-amber-200",
    bg: "bg-amber-50",
    script: [
      "Yangi ish joyida siz uchun eng muhim narsa nima?",
      "Qanday ish muhitida samarali ishlaysiz?",
      "Bizning kompaniyamiz haqida nima bilasiz?",
      "Maosh ko'rsatkich sifatida — hozir qancha olayapsiz va nima kutayapsiz?",
    ],
    tips: [
      "Nomzod motivatsiyasini aniqlab oling",
      "Maosh kutilmasini aniq so'rang",
      "Kompaniya haqidagi bilimi tayyorgarlikni ko'rsatadi",
    ],
  },
  {
    num: 4,
    title: "Taklif",
    color: "bg-orange-500",
    textColor: "text-[var(--ep-primary)]",
    border: "border-orange-200",
    bg: "bg-orange-50",
    script: [
      "Bizning [Lavozim] pozitsiyamiz haqida qisqacha aytib o'tsam: [lavozim vazifalarini qisqacha tushuntiring].",
      "Maosh: [minimal] dan [maksimal] gacha, probatsiya muddati [X oy].",
      "Siz uchun bu qiziqarlimi? Davom etishni xohlaysizmi?",
    ],
    tips: [
      "Juda ko'p ma'lumot bermang — faqat asosiylarini",
      "Nomzodning reaktsiyasini kuzating",
      "Savollarga qisqa javob bering, keyinroq to'liq suhbatda gaplashish mumkinligini ayting",
    ],
  },
  {
    num: 5,
    title: "Logistika",
    color: "bg-green-500",
    textColor: "text-[var(--ep-green)]",
    border: "border-green-200",
    bg: "bg-green-50",
    script: [
      "Ajoyib! Keyingi bosqich — to'liq suhbat. Sizga qachon qulay?",
      "Suhbat [onlayn/oflayn], taxminan [muddat] davom etadi.",
      "Men sizga [email/telegram] orqali tasdiqlash xabarini yuboraman. Elektron pochtangiz/telegramingiz bormi?",
      "Biron savol bormi? Juda yaxshi, keyingi suhbatda ko'rishguncha!",
    ],
    tips: [
      "Aniq sana va vaqtni belgilang",
      "Eslatma yuborish va'da berting",
      "Nomzodning savollariga sabr bilan javob bering",
    ],
  },
] as const;

// ─── Sovuq qo'ng'iroq skripti ─────────────────────────────────────────────
export const COLD_CALL_SCRIPT = [
  {
    label: "Ochilish",
    text: "Assalomu alaykum, [Ism]! Ismim [Rekruter ismi], EuroPrint kompaniyasidan. Sizning tajribangiz bizning ochiq lavozimimizga mos kelishi mumkin. Bir daqiqa vaqtingiz bormi?",
  },
  {
    label: "Qiziqtirish",
    text: "Biz [Lavozim] izlayapmiz. Siz [soha/tajriba]da ishlaysiz, shuning uchun siz bilan gaplashishni istayman.",
  },
  {
    label: "Murojaat",
    text: "Hozirgi ish joyingizdan qoniqasizmi? Ba'zi professionals yangi imkoniyatlarga ochiq bo'ladi.",
  },
  {
    label: "Keyingi qadam",
    text: "Agar qiziqsangiz — 15 daqiqalik qo'ng'iroq rejalashtira olamizmi? Agar yo'q bo'lsa ham, biror tanishingizni tavsiya qila olasizmi?",
  },
] as const;

// ─── Muhim qoidalar ────────────────────────────────────────────────────────
export const IMPORTANT_RULES = [
  "Nomzodni diqqat bilan tinglang — u gapirgan vaqtning 70% bo'lsin",
  "Har bir javob uchun \"Nima uchun?\" yoki \"Misol keltira olasizmi?\" deb so'rang",
  "Nomzodning javoblarini qayd qilib boring",
  "Salbiy fikrlardan saqlaning — muloqot davomida kompaniya obro'sini saqlang",
  "Vaqtni kuzating: 15 daqiqadan oshmasin",
  "Suhbat oxirida nomzodga rahmat aytib, keyingi qadamlarni tushuntiring",
  "Nomzod rad etsa — munosib munosabatda bo'ling, u sizning brendingiz uchun muhim",
] as const;
