/** @module ProductivityInterviewDialogStep2 @description Step 2 panel — motivation (motivatsiya). Renders 4 open questions, flow direction selector, and motivation level picker (1–4). */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MOTIVATION_LEVELS } from "./ProductivityInterviewDialogTypes";
import type { MotivationData } from "./ProductivityInterviewDialogTypes";

interface Step2Props {
  motivation: MotivationData;
  onChange: <K extends keyof MotivationData>(field: K, value: MotivationData[K]) => void;
}

export function Step2Motivation({ motivation, onChange }: Step2Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">Bo'lim 2: Motivatsiya</h3>
        <Badge variant="outline" className="text-[9px]">4 savol + oqim + daraja</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S1.</span> Bu ish sizga nima anglatadi?
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder="Bu lavozimda ishlashning nima ma'nosi bor sizga?"
          value={motivation.q1_work_meaning}
          onChange={e => onChange("q1_work_meaning", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S2.</span> Ideal ish muhiti qanday bo'lishi kerak?
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder="Muhit, atmosfera, rahbar uslubi..."
          value={motivation.q2_ideal_env}
          onChange={e => onChange("q2_ideal_env", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S3.</span> Eng yaxshi natijangizni ayting?
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder="O'zingiz maqtanishingiz mumkin bo'lgan natija..."
          value={motivation.q3_achievement}
          onChange={e => onChange("q3_achievement", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S4.</span> 3-5 yildan so'ng kim bo'lishni xohlaysiz?
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder="Karyera maqsadi, professional rivojlanish..."
          value={motivation.q4_future_goal}
          onChange={e => onChange("q4_future_goal", e.target.value)}
        />
      </div>

      {/* Kiruvchi / Chiquvchi oqim */}
      <div className="border border-border/40 rounded-lg p-3 bg-muted/40">
        <Label className="text-xs mb-2 block font-medium">
          Nomzod oqim belgisi (rekruter baholaydi):
        </Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange("flow_direction", "inflow")}
            className={`flex-1 py-2 rounded-md text-xs border transition-all flex items-center justify-center gap-1.5 ${
              motivation.flow_direction === "inflow"
                ? "bg-green-600/20 border-green-500/60 text-green-300"
                : "border-border/40 text-muted-foreground hover:border-green-500/40"
            }`}
          >
            <span className="text-base">→</span>
            <div className="text-left">
              <div className="font-semibold">Kiruvchi oqim</div>
              <div className="text-[9px] opacity-70">Kompaniyaga kelmoqchi</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onChange("flow_direction", "outflow")}
            className={`flex-1 py-2 rounded-md text-xs border transition-all flex items-center justify-center gap-1.5 ${
              motivation.flow_direction === "outflow"
                ? "bg-red-600/20 border-red-500/60 text-red-300"
                : "border-border/40 text-muted-foreground hover:border-red-500/40"
            }`}
          >
            <span className="text-base">←</span>
            <div className="text-left">
              <div className="font-semibold">Chiquvchi oqim</div>
              <div className="text-[9px] opacity-70">Hozirgi joydan ketmoqchi</div>
            </div>
          </button>
        </div>
      </div>

      {/* Motivatsiya darajasi 1-4 */}
      <div>
        <Label className="text-xs mb-2 block font-medium">
          Motivatsiya darajasi (rekruter baholaydi):
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Array.isArray(MOTIVATION_LEVELS) ? MOTIVATION_LEVELS : []).map(lvl => (
            <button
              key={lvl.level}
              type="button"
              onClick={() => onChange("motivation_level", lvl.level)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                motivation.motivation_level === lvl.level
                  ? lvl.color + " ring-1 ring-current"
                  : "border-border/40 text-muted-foreground hover:border-border/70"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{lvl.icon}</span>
                <span className="text-xs font-bold">{lvl.level}. {lvl.label}</span>
              </div>
              <p className="text-[9px] leading-snug opacity-80">{lvl.description}</p>
            </button>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground bg-muted/40 rounded p-2">
          <strong>Ko'rsatma:</strong> 4=Burch (eng yuqori), 3=E'tiqod, 2=Manfaat, 1=Pul (eng past)
        </div>
      </div>
    </div>
  );
}
