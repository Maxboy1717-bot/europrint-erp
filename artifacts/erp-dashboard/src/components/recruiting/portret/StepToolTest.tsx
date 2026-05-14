/**
 * @module StepToolTest
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TOOL_TRAITS, ToolTestReqs } from "./types";

interface StepToolTestProps {
  toolReqs: ToolTestReqs;
  onTraitChange: (key: string, val: number) => void;
  onOtherChange: (field: keyof ToolTestReqs, val: number) => void;
}

export function StepToolTest({ toolReqs, onTraitChange, onOtherChange }: StepToolTestProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">Blok D: TOOL TEST talablari</h3>
        <Badge variant="outline" className="text-[9px]">A-J traitlar</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 bg-card p-3 rounded-lg border border-border/40">
        {(Array.isArray(TOOL_TRAITS) ? TOOL_TRAITS : []).map(t => (
          <div key={t.key} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-medium">{t.label}</Label>
              <span className={`text-[11px] font-bold ${
                (toolReqs.traits[t.key] ?? 0) > 0 ? "text-[var(--ep-green)]" : (toolReqs.traits[t.key] ?? 0) < 0 ? "text-[var(--ep-red)]" : "text-muted-foreground"
              }`}>
                {toolReqs.traits[t.key] ?? 0}
              </span>
            </div>
            <Slider
              min={-100} max={100} step={5}
              value={[toolReqs.traits[t.key] ?? 0]}
              onValueChange={([v]) => onTraitChange(t.key, v)}
              className="py-1"
            />
            <p className="text-[9px] text-muted-foreground leading-tight italic">{t.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px]">IQ (min)</Label>
          <Slider
            min={1} max={10} step={1}
            value={[toolReqs.iq_min ?? 4]}
            onValueChange={([v]) => onOtherChange("iq_min", v)}
          />
          <span className="text-center text-xs font-bold">{toolReqs.iq_min ?? 4}/10</span>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px]">Liderlik (min)</Label>
          <Slider
            min={0} max={100} step={5}
            value={[toolReqs.leadership_min ?? 70]}
            onValueChange={([v]) => onOtherChange("leadership_min", v)}
          />
          <span className="text-center text-xs font-bold">{toolReqs.leadership_min ?? 70}%</span>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px]">Takrorlanuvchanlik</Label>
          <Slider
            min={0} max={100} step={5}
            value={[toolReqs.replication_min ?? 70]}
            onValueChange={([v]) => onOtherChange("replication_min", v)}
          />
          <span className="text-center text-xs font-bold">{toolReqs.replication_min ?? 70}%</span>
        </div>
      </div>
    </div>
  );
}
