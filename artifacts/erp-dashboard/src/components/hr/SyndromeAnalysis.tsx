/**
 * @module SyndromeAnalysis
 * @description React UI component.
 */

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";

export interface ToolTestResults {
  A?: number;
  B?: number;
  C?: number;
  D?: number;
  E?: number;
  F?: number;
  G?: number;
  H?: number;
  I?: number;
  J?: number;
}

interface Syndrome {
  key: string;
  name: string;
  nameUz: string;
  description: string;
  descriptionUz: string;
  severity: "critical" | "warning" | "info";
  condition: (r: ToolTestResults) => boolean;
}

export const SYNDROME_DEFINITIONS: Syndrome[] = [
  {
    key: "COMPULSIVE_ATTENTION",
    name: "Compulsive Attention",
    nameUz: "Majburiy Diqqat Sindromi",
    description: "Excessive attention to detail causing paralysis by analysis",
    descriptionUz: "A ko'rsatkichi 80+ — haddan tashqari batafsil diqqat, harakat qilishdan qo'rqish",
    severity: "warning",
    condition: (r) => (r.A ?? 0) >= 80,
  },
  {
    key: "HYPERACTIVE_ENERGY",
    name: "Hyperactive Energy",
    nameUz: "Giperaktiv Energiya Sindromi",
    description: "Uncontrolled energy leading to burnout and impulsive decisions",
    descriptionUz: "E ko'rsatkichi 80+ — nazorat qilinmaydigan energiya, charchash va impulsiv qarorlar xavfi",
    severity: "warning",
    condition: (r) => (r.E ?? 0) >= 80,
  },
  {
    key: "PASSIVE_DEFENSE",
    name: "Passive Defense",
    nameUz: "Passiv Himoya Sindromi",
    description: "Extreme avoidance of confrontation, inability to protect interests",
    descriptionUz: "G ko'rsatkichi -50 dan past — nizolardan haddan tashqari qochish, o'z manfaatlarini himoya qila olmaslik",
    severity: "critical",
    condition: (r) => (r.G ?? 0) <= -50,
  },
  {
    key: "AGGRESSIVE_DEFENSE",
    name: "Aggressive Defense",
    nameUz: "Tajovuzkor Himoya Sindromi",
    description: "Excessive defensive behavior causing team conflicts",
    descriptionUz: "G ko'rsatkichi 80+ — haddan tashqari himoyalanish, jamoada nizolar yaratish",
    severity: "critical",
    condition: (r) => (r.G ?? 0) >= 80,
  },
  {
    key: "STRATEGIC_DEFICIT",
    name: "Strategic Deficit",
    nameUz: "Strategik Tanqislik Sindromi",
    description: "Inability to think long-term or set goals",
    descriptionUz: "B ko'rsatkichi -40 dan past — uzoq muddatli fikrlash va maqsad qo'yish qobiliyati tanqis",
    severity: "critical",
    condition: (r) => (r.B ?? 0) <= -40,
  },
  {
    key: "OVERCONFIDENCE",
    name: "Overconfidence",
    nameUz: "Ortiqcha Ishonch Sindromi",
    description: "Excessive self-confidence leading to poor risk assessment",
    descriptionUz: "D ko'rsatkichi 80+ — haddan tashqari o'ziga ishonch, xavflarni noto'g'ri baholash",
    severity: "warning",
    condition: (r) => (r.D ?? 0) >= 80,
  },
  {
    key: "SUBMISSION",
    name: "Submission",
    nameUz: "Bo'ysunuvchanlik Sindromi",
    description: "Extreme compliance, inability to lead or make independent decisions",
    descriptionUz: "D ko'rsatkichi -60 dan past — haddan tashqari bo'ysunuvchanlik, mustaqil qaror qabul qila olmaslik",
    severity: "critical",
    condition: (r) => (r.D ?? 0) <= -60,
  },
  {
    key: "EMPATHY_DEFICIT",
    name: "Empathy Deficit",
    nameUz: "Empatiya Tanqisligi Sindromi",
    description: "Low emotional intelligence, difficulty working in teams",
    descriptionUz: "I ko'rsatkichi -40 dan past — hissiy intellekt past, jamoada ishlash qiyinligi",
    severity: "warning",
    condition: (r) => (r.I ?? 0) <= -40,
  },
  {
    key: "SOCIAL_ISOLATION",
    name: "Social Isolation",
    nameUz: "Ijtimoiy Izolyatsiya Sindromi",
    description: "Extreme difficulty in communication, social avoidance",
    descriptionUz: "J ko'rsatkichi -50 dan past — muloqotda qiynalish, ijtimoiy izolyatsiyaga moyillik",
    severity: "critical",
    condition: (r) => (r.J ?? 0) <= -50,
  },
  {
    key: "CONTROL_OBSESSION",
    name: "Control Obsession",
    nameUz: "Nazorat Obsessiyasi Sindromi",
    description: "Extreme need for control, micromanagement tendency",
    descriptionUz: "C ko'rsatkichi 80+ — nazorat qilishga haddan tashqari ehtiyoj, mikro-menejment",
    severity: "warning",
    condition: (r) => (r.C ?? 0) >= 80,
  },
  {
    key: "INDECISIVENESS",
    name: "Indecisiveness",
    nameUz: "Qarordan Qochish Sindromi",
    description: "Inability to make decisive choices under pressure",
    descriptionUz: "F ko'rsatkichi -50 dan past — bosim ostida qat'iy qaror qabul qila olmaslik",
    severity: "critical",
    condition: (r) => (r.F ?? 0) <= -50,
  },
  {
    key: "TACTICAL_RIGIDITY",
    name: "Tactical Rigidity",
    nameUz: "Taktik Qattiqlik Sindromi",
    description: "Excessive inflexibility in approach, inability to adapt",
    descriptionUz: "H ko'rsatkichi -60 dan past — taktik yondashuv juda qattiq, moslashuvchanlik yo'q",
    severity: "warning",
    condition: (r) => (r.H ?? 0) <= -60,
  },
  {
    key: "BURNOUT_RISK",
    name: "Burnout Risk",
    nameUz: "Charchoq Xavfi Sindromi",
    description: "Combination of high energy and low empathy — burnout prone",
    descriptionUz: "E ≥ 60 va I ≤ -20 kombinatsiyasi — yuqori energiya + past empatiya = charchash xavfi",
    severity: "critical",
    condition: (r) => (r.E ?? 0) >= 60 && (r.I ?? 0) <= -20,
  },
];

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-red-500/15 text-red-400 border-red-500/30 border",
    icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
    dot: "bg-red-500",
  },
  warning: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30 border",
    icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
    dot: "bg-amber-500",
  },
  info: {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30 border",
    icon: <CheckCircle className="w-3 h-3 text-blue-400" />,
    dot: "bg-blue-500",
  },
};

interface SyndromeAnalysisProps {
  toolTestResults: ToolTestResults | null | undefined;
  compact?: boolean;
}

export function SyndromeAnalysis({ toolTestResults, compact = false }: SyndromeAnalysisProps) {
  const detectedSyndromes = useMemo(() => {
    if (!toolTestResults || Object.keys(toolTestResults).length === 0) return [];
    return SYNDROME_DEFINITIONS.filter((s) => s.condition(toolTestResults));
  }, [toolTestResults]);

  if (!toolTestResults || Object.keys(toolTestResults).length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic py-2">
        TOOL TEST natijalari mavjud emas
      </div>
    );
  }

  if (detectedSyndromes.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400">Hech qanday sindrom aniqlanmadi</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {(Array.isArray(detectedSyndromes) ? detectedSyndromes : []).map((s) => {
          const styles = SEVERITY_STYLES[s.severity];
          return (
            <span
              key={s.key}
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${styles.badge}`}
              title={s.descriptionUz}
            >
              <span className={`w-1 h-1 rounded-full ${styles.dot}`} />
              {s.nameUz}
            </span>
          );
        })}
      </div>
    );
  }

  const critical = (Array.isArray(detectedSyndromes) ? detectedSyndromes : []).filter((s) => s.severity === "critical");
  const warning = (Array.isArray(detectedSyndromes) ? detectedSyndromes : []).filter((s) => s.severity === "warning");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Aniqlangan sindromlar
        </span>
        <Badge className="text-[10px]" variant="secondary">
          {detectedSyndromes.length} ta
        </Badge>
        {critical.length > 0 && (
          <Badge className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30">
            {critical.length} kritik
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {(Array.isArray(detectedSyndromes) ? detectedSyndromes : []).map((s) => {
          const styles = SEVERITY_STYLES[s.severity];
          return (
            <div
              key={s.key}
              className={`rounded-lg p-3 flex items-start gap-2 ${
                s.severity === "critical"
                  ? "bg-red-500/5 border border-red-500/20"
                  : s.severity === "warning"
                  ? "bg-amber-500/5 border border-amber-500/20"
                  : "bg-blue-500/5 border border-blue-500/20"
              }`}
            >
              <div className="mt-0.5 shrink-0">{styles.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{s.nameUz}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${styles.badge}`}
                  >
                    {s.severity === "critical" ? "Kritik" : s.severity === "warning" ? "Ogohlantiruv" : "Ma'lumot"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {s.descriptionUz}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
