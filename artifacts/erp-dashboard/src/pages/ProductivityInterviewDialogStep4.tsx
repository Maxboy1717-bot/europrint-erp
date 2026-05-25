/** @module ProductivityInterviewDialogStep4 @description Step 4 (summary) panel — scores table, worker type badge, TOOL TEST checkboxes, and final decision buttons. */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WORKER_TYPE_META } from "@/lib/workerType";
import { TOOL_TRAITS } from "./ProductivityInterviewDialogTypes";
import type { SummaryData } from "./ProductivityInterviewDialogTypes";
import { useTranslation } from '@/lib/i18n';

interface Step4Props {
  summary: SummaryData;
  avgScore: number;
  workerType: string;
  onChange: <K extends keyof SummaryData>(field: K, value: SummaryData[K]) => void;
  onToggleToolTest: (key: string) => void;
}

const SCORE_ROWS = [
  { label: "Produktivlik", scoreKey: "productivity_score" as const, noteKey: "productivity_note" as const },
  { label: "Motivatsiya",  scoreKey: "motivation_score"   as const, noteKey: "motivation_note"   as const },
  { label: "Kompetensiya", scoreKey: "competency_score"   as const, noteKey: "competency_note"   as const },
] as const;

const DECISION_OPTIONS = [
  { value: "qabul",       label: "✅ Qabul",       color: "border-green-500/60 bg-green-500/10 text-green-300" },
  { value: "kutish",      label: "⏳ Kutish",       color: "border-amber-500/60 bg-amber-500/10 text-amber-300" },
  { value: "rad",         label: "✕ Rad",           color: "border-orange-500/60 bg-orange-500/10 text-orange-300" },
  { value: "hech_qachon", label: "⛔ Hech qachon", color: "border-red-500/60 bg-red-500/10 text-red-300" },
] as const;

export function Step4Summary({ summary, avgScore, workerType, onChange, onToggleToolTest }: Step4Props) {
  const { t } = useTranslation("common");
  const meta = WORKER_TYPE_META[workerType as keyof typeof WORKER_TYPE_META];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">{t("yakuniyXulosa")}</h3>
        <Badge variant="outline" className="text-[9px]">{t("umumiyBahoQaror")}</Badge>
      </div>

      {/* Scores table */}
      <div className="border border-border/40 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">{t("bolim1")}</th>
              <th className="text-center px-3 py-2 text-muted-foreground font-medium">{t("ball110")}</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">{t("Izoh")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {SCORE_ROWS.map(row => (
              <tr key={row.label} className="bg-muted/40">
                <td className="px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2">
                  <select
                    value={summary[row.scoreKey]}
                    onChange={e => onChange(row.scoreKey, Number(e.target.value) as SummaryData[typeof row.scoreKey])}
                    className="w-16 rounded border border-border/40 bg-muted/60 text-center text-xs p-1"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder={t("qisqaIzoh")}
                    value={summary[row.noteKey]}
                    onChange={e => onChange(row.noteKey, e.target.value as SummaryData[typeof row.noteKey])}
                  />
                </td>
              </tr>
            ))}
            <tr className="bg-primary/5 font-semibold">
              <td className="px-3 py-2 text-primary">{t("average")}</td>
              <td className="px-3 py-2 text-center text-primary text-sm font-bold">{avgScore}</td>
              <td className="px-3 py-2 text-[10px] text-muted-foreground">
                {avgScore >= 8 ? "A'lo" : avgScore >= 6 ? "Yaxshi" : avgScore >= 4 ? "O'rta" : "Past"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Worker type badge */}
      {meta && (
        <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${meta.bg} ${meta.border}`}>
          <span className="text-2xl">{meta.emoji}</span>
          <div>
            <div className={`text-sm font-bold ${meta.color}`}>{meta.emoji} {meta.label}</div>
            <div className="text-[10px] text-muted-foreground">{meta.desc}</div>
          </div>
          <Badge variant="outline" className={`ml-auto text-[10px] shrink-0 ${meta.color} ${meta.border}`}>
            {t("avtomatik")}
          </Badge>
        </div>
      )}

      {/* TOOL TEST checkboxes */}
      <div className="border border-border/40 rounded-lg p-3 bg-muted/40">
        <Label className="text-xs mb-2 block font-medium">{t("toolTestNatijalariAJ")}</Label>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {(Array.isArray(TOOL_TRAITS) ? TOOL_TRAITS : []).map(key => (
            <div key={key} className="flex items-center gap-1.5">
              <Checkbox
                id={`tool-${key}`}
                checked={summary.tool_test_passed[key] ?? false}
                onCheckedChange={() => onToggleToolTest(key)}
              />
              <label htmlFor={`tool-${key}`} className="text-xs font-mono font-bold cursor-pointer">
                {key}
              </label>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {t("belgilanganlarToolTestDaTalab")}
        </p>
      </div>

      {/* Final decision */}
      <div>
        <Label className="text-xs mb-2 block font-medium">{t("yakuniyQaror1")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DECISION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange("final_decision", opt.value)}
              className={`py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                summary.final_decision === opt.value
                  ? opt.color + " ring-1 ring-current"
                  : "border-border/40 text-muted-foreground hover:border-border/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Final notes */}
      <div>
        <Label className="text-xs mb-1 block">{t("yakuniyIzohIxtiyoriy")}</Label>
        <Textarea
          rows={3}
          className="text-xs"
          placeholder={t("rekruterningYakuniyFikriKuzatishlar")}
          value={summary.final_notes}
          onChange={e => onChange("final_notes", e.target.value)}
        />
      </div>
    </div>
  );
}
