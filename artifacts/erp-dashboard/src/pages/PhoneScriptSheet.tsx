/**
 * @module PhoneScriptSheet
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Material №53: Telefon Skripti — 5 qadam ───────────────────────────────
const PHONE_SCRIPT_STEPS = [
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
];

// ─── Sovuq qo'ng'iroq skripti ─────────────────────────────────────────────
const COLD_CALL_SCRIPT = [
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
];

// ─── Muhim qoidalar ────────────────────────────────────────────────────────
const IMPORTANT_RULES = [
  "Nomzodni diqqat bilan tinglang — u gapirgan vaqtning 70% bo'lsin",
  "Har bir javob uchun \"Nima uchun?\" yoki \"Misol keltira olasizmi?\" deb so'rang",
  "Nomzodning javoblarini qayd qilib boring",
  "Salbiy fikrlardan saqlaning — muloqot davomida kompaniya obro'sini saqlang",
  "Vaqtni kuzating: 15 daqiqadan oshmasin",
  "Suhbat oxirida nomzodga rahmat aytib, keyingi qadamlarni tushuntiring",
  "Nomzod rad etsa — munosib munosabatda bo'ling, u sizning brendingiz uchun muhim",
];

export function PhoneScriptSheet({
  candidateName,
  trigger,
}: {
  candidateName?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "cold">("main");
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-violet-400 hover:text-violet-300 hover:bg-[var(--ep-purple)]/90/10 gap-1 px-1"
            data-testid="button-phone-script"
          >
            <Phone className="w-2.5 h-2.5" />
            Skript №53
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[500px] max-w-full overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b from-primary to-amber-500 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2 text-base">
              <Phone className="w-4 h-4 text-white/80" />
              Telefon Skripti
            </SheetTitle>
            <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px]">
              Material №53
            </Badge>
          </div>
          {candidateName && (
            <p className="text-sm text-slate-300 mt-0.5">{candidateName}</p>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveTab("main")}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                activeTab === "main"
                  ? "bg-[var(--ep-purple)] text-white"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              )}
            >
              5-bosqich skript
            </button>
            <button
              onClick={() => setActiveTab("cold")}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                activeTab === "cold"
                  ? "bg-[var(--ep-purple)] text-white"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              )}
            >
              Sovuq qo'ng'iroq
            </button>
          </div>
        </SheetHeader>

        <div className="px-4 py-4 space-y-3">
          {/* ─── Main 5-step script ─── */}
          {activeTab === "main" && (
            <>
              {(Array.isArray(PHONE_SCRIPT_STEPS) ? PHONE_SCRIPT_STEPS : []).map(step => {
                const isExpanded = expandedStep === step.num;
                return (
                  <div key={step.num} className={cn("rounded-lg border", step.border)}>
                    {/* Step header */}
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : step.num)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-t-lg text-sm font-semibold",
                        step.bg, step.textColor
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn(
                          "w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0",
                          step.color
                        )}>
                          {step.num}
                        </span>
                        {step.title}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="bg-white rounded-b-lg p-3 space-y-3">
                        {/* Script lines */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            Skript matni:
                          </p>
                          {(Array.isArray(step.script) ? step.script : []).map((line, i) => (
                            <div
                              key={`k-${i}`}
                              className="flex gap-2 bg-slate-50 rounded-md p-2.5 border border-slate-100"
                            >
                              <span className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0 mt-0.5",
                                step.color
                              )}>
                                {i + 1}
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed">{line}</p>
                            </div>
                          ))}
                        </div>

                        {/* Tips */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            Maslahatlar:
                          </p>
                          {(Array.isArray(step.tips) ? step.tips : []).map((tip, i) => (
                            <div key={`k-${i}`} className="flex items-start gap-1.5">
                              <span className="text-[var(--ep-yellow)] text-xs mt-0.5">•</span>
                              <p className="text-[11px] text-slate-600">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Important rules collapsible */}
              <div className="rounded-lg border border-red-200">
                <button
                  onClick={() => setRulesOpen(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-t-lg bg-red-50 text-sm font-semibold text-[var(--ep-red)]"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[var(--ep-red)]" />
                    Muhim qoidalar
                  </span>
                  {rulesOpen
                    ? <ChevronUp className="w-3.5 h-3.5" />
                    : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {rulesOpen && (
                  <div className="bg-white rounded-b-lg p-3 space-y-1.5">
                    {(Array.isArray(IMPORTANT_RULES) ? IMPORTANT_RULES : []).map((rule, i) => (
                      <div key={`k-${i}`} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-red-100 text-[var(--ep-red)] flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-700">{rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── Cold call script ─── */}
          {activeTab === "cold" && (
            <div className="space-y-3">
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                <p className="text-xs text-[var(--ep-purple)] font-medium mb-1">Sovuq qo'ng'iroq nima?</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Nomzod o'zi ariza topshirmagan, lekin uning tajribasi pozitsiyaga mos keladi.
                  LinkedIn, tavsiyalar yoki boshqa manbalardan topilgan nomzodlar bilan ishlash uchun.
                </p>
              </div>

              <div className="space-y-3">
                {(Array.isArray(COLD_CALL_SCRIPT) ? COLD_CALL_SCRIPT : []).map((item, i) => (
                  <div key={`k-${i}`} className="bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-[var(--ep-purple)] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-[var(--ep-purple)]">{item.label}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded p-2 border border-slate-100">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-[var(--ep-yellow)] mb-1">Eslatma:</p>
                <ul className="space-y-1">
                  <li className="text-[11px] text-slate-600 flex gap-1.5">
                    <span className="text-[var(--ep-yellow)]">•</span>
                    Nomzod rad etsa, munosib munosabatda bo'ling
                  </li>
                  <li className="text-[11px] text-slate-600 flex gap-1.5">
                    <span className="text-[var(--ep-yellow)]">•</span>
                    Tavsiya so'rash — kuchli instrument
                  </li>
                  <li className="text-[11px] text-slate-600 flex gap-1.5">
                    <span className="text-[var(--ep-yellow)]">•</span>
                    Telefon gaplashuv 5 daqiqadan oshmasin
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PhoneScriptSheet;
