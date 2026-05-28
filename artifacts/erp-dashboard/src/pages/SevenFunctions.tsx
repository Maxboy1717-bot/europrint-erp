/**
 * @module SevenFunctions
 * @description Route-level page for the 7 Adizes management functions (PAEI+ model).
 * Visual/analytical tool — no live API dependency, uses static demo data for team assessment.
 * Route: /seven-functions
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, ResponsiveContainer } from "@/components/ui/page-header";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Crown, Target, ClipboardList, Lightbulb, Users,
  Palette, ShieldCheck, TrendingUp,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunctionDef {
  code: string;
  nameLatin: string;
  nameUzbek: string;
  description: string;
  activities: string[];
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

interface TeamMember {
  name: string;
  position: string;
  P: number;
  A: number;
  E: number;
  I: number;
  C: number;
  S: number;
  M: number;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const FUNCTIONS: FunctionDef[] = [
  {
    code: "P",
    nameLatin: "Producer",
    nameUzbek: "Ishlab chiqaruvchi",
    description: "Qisqa muddatli natijalarga yo'naltirilgan. Vazifalarni bajaradi, ko'rsatkichlarni ta'minlaydi.",
    activities: ["Kunlik rejani bajarish", "Buyurtmalarni o'z vaqtida yetkazish", "Mahsuldorlikni oshirish"],
    icon: <Target className="w-5 h-5" />,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
  },
  {
    code: "A",
    nameLatin: "Administrator",
    nameUzbek: "Ma'murchi",
    description: "Tizimlashtirish va jarayonlar. Qoidalar, tartib va nazoratni ta'minlaydi.",
    activities: ["Hujjatlarni tartibga solish", "Qoidalar va standartlarni joriy etish", "Hisobotlarni tekshirish"],
    icon: <ClipboardList className="w-5 h-5" />,
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
  },
  {
    code: "E",
    nameLatin: "Entrepreneur",
    nameUzbek: "Tadbirkor",
    description: "Innovatsiya va o'zgarish. Yangi imkoniyatlarni ko'radi va rivojlanishni rag'batlantiradi.",
    activities: ["Yangi g'oyalarni ilgari surish", "Bozorni tahlil qilish", "Biznes modelini yangilash"],
    icon: <Lightbulb className="w-5 h-5" />,
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
  },
  {
    code: "I",
    nameLatin: "Integrator",
    nameUzbek: "Birlashtiruvchi",
    description: "Jamoaviy hamjihatlik. Nizolarni hal qiladi, muvofiqlik va ishonch muhitini yaratadi.",
    activities: ["Jamoaviy muhitni rivojlantirish", "Nizolarni vositachilik bilan hal etish", "Hamkorlikni mustahkamlash"],
    icon: <Users className="w-5 h-5" />,
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
  },
  {
    code: "C",
    nameLatin: "Creator",
    nameUzbek: "Ijodkor",
    description: "Ijodiy fikrlash. Noan'anaviy yechimlar topadi va yangi mahsulotlar loyihalaydi.",
    activities: ["Dizayn va kontseptsiya ishlab chiqish", "Muammolarga ijodiy yondashuv", "Prototiplash"],
    icon: <Palette className="w-5 h-5" />,
    colorClass: "text-pink-600",
    bgClass: "bg-pink-50",
    borderClass: "border-pink-200",
  },
  {
    code: "S",
    nameLatin: "Supervisor",
    nameUzbek: "Nazoratchi",
    description: "Sifat nazorati. Standartlarga rioya etilishini kuzatadi va xatolarni aniqlaydi.",
    activities: ["Sifat auditini o'tkazish", "KPIlarni monitoring qilish", "Tuzatuvchi choralarni belgilash"],
    icon: <ShieldCheck className="w-5 h-5" />,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
  },
  {
    code: "M",
    nameLatin: "Motivator",
    nameUzbek: "Motivator",
    description: "Xodimlarni rag'batlantirish. Ishchilarning sadoqati va ishtirokini oshiradi.",
    activities: ["Mukofotlash tizimini boshqarish", "1-1 suhbatlar o'tkazish", "Maqsadlarni birlashtirish"],
    icon: <TrendingUp className="w-5 h-5" />,
    colorClass: "text-yellow-600",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
  },
];

const DEMO_TEAM: TeamMember[] = [
  { name: "Alisher Karimov",   position: "CEO",               P: 7, A: 5, E: 9, I: 8, C: 6, S: 4, M: 8 },
  { name: "Nodira Yusupova",   position: "HR Menejer",        P: 5, A: 8, E: 4, I: 9, C: 5, S: 7, M: 9 },
  { name: "Bobur Toshmatov",   position: "Ishlab chiqarish",  P: 9, A: 8, E: 3, I: 5, C: 4, S: 9, M: 4 },
  { name: "Zulfiya Ergasheva", position: "Moliya direktori",  P: 6, A: 9, E: 3, I: 6, C: 3, S: 9, M: 5 },
  { name: "Jasur Mirzayev",    position: "IT Menejer",        P: 7, A: 7, E: 8, I: 5, C: 9, S: 7, M: 5 },
];

const FUNC_KEYS: Array<keyof Omit<TeamMember, "name" | "position">> = ["P", "A", "E", "I", "C", "S", "M"];

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-600 font-semibold";
  if (score >= 6) return "text-yellow-600";
  return "text-red-500";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SevenFunctions() {
  const { t } = useTranslation("common");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const displayedFunctions = selectedCode
    ? FUNCTIONS.filter((f) => f.code === selectedCode)
    : FUNCTIONS;

  return (
    <ResponsiveContainer>
      {/* Header */}
      <PageHeader
        title="7 Funksiya (Adizes)"
        description="PAEI+ modeli asosida boshqaruv funktsiyalari tahlili"
        icon={<Crown className="w-6 h-6 text-primary" />}
      />

      {/* Description card */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Adizes PAEI modeli</span> —
            Ichak Adizes tomonidan ishlab chiqilgan boshqaruv nazariyasi. Har bir tashkilot
            samarali ishlashi uchun 7 ta asosiy funksiyani bajarish zarur. Hech bir menejer
            barcha funksiyalarni bir xil darajada bajara olmaydi — shuning uchun muvozanatli
            jamoa muhim.
          </p>
        </CardContent>
      </Card>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCode(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selectedCode === null
              ? "bg-primary text-white border-primary"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          Barchasi
        </button>
        {FUNCTIONS.map((f) => (
          <button
            key={f.code}
            onClick={() => setSelectedCode(selectedCode === f.code ? null : f.code)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedCode === f.code
                ? `${f.bgClass} ${f.colorClass} ${f.borderClass}`
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f.code} — {f.nameUzbek}
          </button>
        ))}
      </div>

      {/* Function cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {(Array.isArray(displayedFunctions) ? displayedFunctions : []).map((fn) => (
          <Card key={fn.code} className={`border ${fn.borderClass} hover-lift`}>
            <CardHeader className={`${fn.bgClass} rounded-t-[10px]`}>
              <CardTitle className="flex items-center gap-2">
                <span className={`p-1.5 rounded-md bg-white/60 ${fn.colorClass}`}>
                  {fn.icon}
                </span>
                <span className={fn.colorClass}>
                  {fn.code} — {fn.nameUzbek}
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {fn.nameLatin}
              </p>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {fn.description}
              </p>
              <ul className="space-y-1">
                {fn.activities.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                    <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${fn.bgClass} border ${fn.borderClass}`} />
                    {act}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Jamoa baholash (demo ma'lumotlar)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Xodim</TableHead>
                <TableHead>Lavozim</TableHead>
                {FUNC_KEYS.map((k) => {
                  const fn = FUNCTIONS.find((f) => f.code === k);
                  return (
                    <TableHead key={k} className="text-center">
                      <span className={fn?.colorClass}>{k}</span>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_TEAM.map((member) => (
                <TableRow key={member.name}>
                  <TableCell className="pl-4 font-medium text-sm">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{member.position}</TableCell>
                  {FUNC_KEYS.map((k) => (
                    <TableCell key={k} className={`text-center text-sm ${scoreColor(member[k])}`}>
                      {member[k]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground px-4 py-3 border-t">
            Ballar: 1–5 past, 6–7 o'rta, 8–10 yuqori. Demo ma'lumotlar — haqiqiy baholash HR modulida.
          </p>
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
