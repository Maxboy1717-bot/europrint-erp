/**
 * @module CVScreeningGuide
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
import { FileSearch, ChevronDown, ChevronUp, CheckCircle2, XCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Material №52: CV Skrining mezonlari ────────────────────────────────────
const GOOD_CV_SIGNS = [
  "Aniq va tartibli tuzilma — ism, aloqa ma'lumotlari, ta'lim, tajriba, ko'nikmalar",
  "Har bir ish joyida aniq muddat ko'rsatilgan (yil va oy)",
  "Vazifalar emas, NATIJALAR yozilgan: raqamlar, foizlar, o'sishlar",
  "Grafik bo'shliqlar qisqa yoki izohlanган (sayohat, ta'lim, tug'ruq va h.k.)",
  "Ko'nikmalar lavozimga mos va aniq: \"Excel\" emas, \"Excel: pivot table, VLOOKUP\"",
  "Imlo va grammatika xatosiz, professional til",
  "Oxirgi ish joyi kundan bugungi vaqtga yaqin yoki hozir ham ishlaydi",
  "Xarakterlash xati yoki portret rasmi (talab qilinsa) bor",
  "Muvaffaqiyatlarni miqdoriy ifodalagan: \"20% savol kamaydi\", \"15 ta yangi mijoz\"",
  "Lavozimga mos maosh ko'rsatilgan yoki oqilona diapazon",
];

const BAD_CV_SIGNS = [
  "6 oydan kam ish joylari ko'p — \"sakrovchi\" nomzod",
  "Katta vaqt bo'shliqlari izohsiz (1 yildan ortiq)",
  "Faqat majburiyatlar yozilgan, natija yo'q",
  "Bir xil ish qisqacha: \"Menejment. Savdo. Marketing\" — noaniq",
  "Imlo xatolari ko'p — diqqatsizlik ko'rsatadi",
  "Juda uzun (5+ bet) — muhimni ajratib bera olmaydi",
  "Juda qisqa (yarim bet) — tajriba yo'q yoki yashiryapti",
  "Kontakt ma'lumotlari yo'q yoki eskirgan",
  "Lavozimga umuman mos bo'lmagan tajriba",
  "Fotosurt emas, tashqi ko'rinish cheksiz muhim bo'lgan lavozimda",
];

// ─── Baholash parametrlari ────────────────────────────────────────────────
const EVALUATION_PARAMS = [
  {
    key: "education",
    label: "Ta'lim",
    icon: "🎓",
    color: "bg-blue-50",
    border: "border-blue-200",
    textColor: "text-[var(--ep-blue)]",
    criteria: [
      { level: "A'lo", desc: "Talab qilingan soha bo'yicha oliy ta'lim, magistratura yoki chet el diplomi" },
      { level: "Yaxshi", desc: "Oliy ta'lim, soha mos emas lekin tajriba bor" },
      { level: "Qoniqarli", desc: "O'rta-maxsus yoki tugallanmagan oliy ta'lim, tajriba kuchli" },
      { level: "Yetarli emas", desc: "Ta'lim talabdan past, tajriba ham yetarli emas" },
    ],
  },
  {
    key: "experience",
    label: "Tajriba",
    icon: "💼",
    color: "bg-amber-50",
    border: "border-amber-200",
    textColor: "text-[var(--ep-yellow)]",
    criteria: [
      { level: "A'lo", desc: "5+ yil mos sohada, yirik kompaniyalarda, lavozim bo'yicha aniq natijalar" },
      { level: "Yaxshi", desc: "3-5 yil tajriba, 1-2 mos ish joyi, o'rtacha natijalar" },
      { level: "Qoniqarli", desc: "1-3 yil tajriba, qisman mos, o'qishga ishtiyoqli" },
      { level: "Yetarli emas", desc: "1 yildan kam yoki butunlay boshqa sohada" },
    ],
  },
  {
    key: "salary",
    label: "Maosh kutilmasi",
    icon: "💰",
    color: "bg-green-50",
    border: "border-green-200",
    textColor: "text-[var(--ep-green)]",
    criteria: [
      { level: "Mos", desc: "Kompaniya budjetiga to'liq mos, diapazon ichida" },
      { level: "Muzokarali", desc: "10-20% yuqori — tajriba asosida muhokama qilish mumkin" },
      { level: "Yuqori", desc: "20-40% yuqori — asosli bo'lsa, top kandidat sifatida ko'rish mumkin" },
      { level: "Mos emas", desc: "Budjetdan 40%+ yuqori — davom ettirmaslik tavsiya etiladi" },
    ],
  },
  {
    key: "skills",
    label: "Ko'nikmalar",
    icon: "⚡",
    color: "bg-purple-50",
    border: "border-purple-200",
    textColor: "text-[var(--ep-purple)]",
    criteria: [
      { level: "A'lo", desc: "Barcha asosiy ko'nikmalar bor, qo'shimcha sifatida foydali ko'nikmalar ham" },
      { level: "Yaxshi", desc: "Asosiy ko'nikmalar bor, 1-2 ta qo'shimcha ko'nikmani o'rgana oladi" },
      { level: "Qoniqarli", desc: "Asosiy ko'nikmalarning yarmi bor, qolganlarini o'rganishga tayyor" },
      { level: "Yetarli emas", desc: "Muhim ko'nikmalar yo'q, to'liq qayta o'qitish kerak" },
    ],
  },
];

// ─── Skrining qaror matritsasi ─────────────────────────────────────────────
const DECISION_MATRIX = [
  { score: "80-100%", action: "Telefon suhbatiga taklif qiling zudlik bilan", color: "bg-green-100 text-green-800 border-green-300" },
  { score: "60-79%", action: "Telefon suhbatiga taklif qiling, qo'shimcha savollar bilan", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { score: "40-59%", action: "Zaxira ro'yxatiga qo'shing, yuqori nomzodlar bo'lmasa chaqiring", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { score: "0-39%", action: "Rad eting, muloyimlik bilan xat yuboring", color: "bg-red-100 text-red-800 border-red-300" },
];

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  headerClass = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerClass?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold",
          headerClass || "bg-slate-50 text-slate-700"
        )}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="bg-white">{children}</div>}
    </div>
  );
}

export function CVScreeningGuide({
  candidateName,
  trigger,
}: {
  candidateName?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-teal-400 hover:text-teal-300 hover:bg-[var(--ep-cyan)]/90/10 gap-1 px-1"
            data-testid="button-cv-screening-guide"
          >
            <FileSearch className="w-2.5 h-2.5" />
            CV Mezonlari №52
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[500px] max-w-full overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b from-primary to-amber-500 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2 text-base">
              <FileSearch className="w-4 h-4 text-white/80" />
              CV Skrining Ko'rsatmasi
            </SheetTitle>
            <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px]">
              Material №52
            </Badge>
          </div>
          {candidateName && (
            <p className="text-sm text-slate-300 mt-0.5">{candidateName}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            CV ni ko'rib chiqish uchun mezonlar va baholash ko'rsatmalari
          </p>
        </SheetHeader>

        <div className="px-4 py-4 space-y-3">
          {/* Good signs */}
          <CollapsibleSection
            title="Yaxshi CV belgilari"
            defaultOpen={true}
            icon={<CheckCircle2 className="w-4 h-4 text-[var(--ep-green)]" />}
            headerClass="bg-green-50 text-green-800"
          >
            <div className="p-3 space-y-1.5">
              {(Array.isArray(GOOD_CV_SIGNS) ? GOOD_CV_SIGNS : []).map((sign, i) => (
                <div key={`k-${i}`} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ep-green)] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700">{sign}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Bad signs */}
          <CollapsibleSection
            title="Xavfli belgilar (qizil bayroqlar)"
            defaultOpen={true}
            icon={<XCircle className="w-4 h-4 text-[var(--ep-red)]" />}
            headerClass="bg-red-50 text-red-800"
          >
            <div className="p-3 space-y-1.5">
              {(Array.isArray(BAD_CV_SIGNS) ? BAD_CV_SIGNS : []).map((sign, i) => (
                <div key={`k-${i}`} className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700">{sign}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Evaluation parameters */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Baholash parametrlari
            </p>
            <div className="space-y-2">
              {(Array.isArray(EVALUATION_PARAMS) ? EVALUATION_PARAMS : []).map(param => (
                <CollapsibleSection
                  key={param.key}
                  title={`${param.icon} ${param.label}`}
                  icon={null}
                  headerClass={cn("border-b", param.color, param.textColor)}
                >
                  <div className="divide-y divide-slate-100">
                    {(Array.isArray(param.criteria) ? param.criteria : []).map((crit, i) => {
                      const levelColor =
                        i === 0 ? "text-[var(--ep-green)] bg-green-50" :
                        i === 1 ? "text-[var(--ep-blue)] bg-blue-50" :
                        i === 2 ? "text-[var(--ep-yellow)] bg-amber-50" :
                        "text-[var(--ep-red)] bg-red-50";
                      return (
                        <div key={`k-${i}`} className="flex items-start gap-3 px-3 py-2">
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                            levelColor
                          )}>
                            {crit.level}
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed">{crit.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              ))}
            </div>
          </div>

          {/* Decision matrix */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-700 px-3 py-2.5 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Qaror matritsasi</span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {(Array.isArray(DECISION_MATRIX) ? DECISION_MATRIX : []).map((row, i) => (
                <div key={`k-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded border shrink-0 min-w-[70px] text-center",
                    row.color
                  )}>
                    {row.score}
                  </span>
                  <p className="text-xs text-slate-700">{row.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring tip */}
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-[var(--ep-purple)] mb-1.5">Hisoblash usuli:</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Har bir parametrni 0–25 ball bilan baholang (ta'lim, tajriba, maosh, ko'nikmalar).
              Jami 100 ball. Yakuniy ball asosida yuqoridagi qaror matritsasidan foydalaning.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
              {(Array.isArray(EVALUATION_PARAMS) ? EVALUATION_PARAMS : []).map(p => (
                <div key={p.key} className="flex items-center gap-1.5">
                  <span className="text-base">{p.icon}</span>
                  <div>
                    <p className="text-[10px] font-medium text-slate-700">{p.label}</p>
                    <p className="text-[9px] text-slate-500">0–25 ball</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CVScreeningGuide;
