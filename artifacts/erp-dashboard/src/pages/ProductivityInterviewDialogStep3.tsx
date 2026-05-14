/** @module ProductivityInterviewDialogStep3 @description Step 3 panel — competency (kompetensiya). Renders 3 behavioural questions and a practical task result field. */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { CompetencyData } from "./ProductivityInterviewDialogTypes";

interface Step3Props {
  competency: CompetencyData;
  onChange: <K extends keyof CompetencyData>(field: K, value: string) => void;
}

export function Step3Competency({ competency, onChange }: Step3Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">Bo'lim 3: Kompetensiya</h3>
        <Badge variant="outline" className="text-[9px]">3 savol + amaliy topshiriq</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">K1.</span> Murakkab muammo va qanday hal qilgansiz?
        </Label>
        <Textarea
          rows={3}
          className="text-xs"
          placeholder="Konkret misol keltiring: qanday vaziyat, nima qildi, nima natija?"
          value={competency.q1_problem}
          onChange={e => onChange("q1_problem", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">K2.</span> Jamoadagi qiyin vaziyat misoli?
        </Label>
        <Textarea
          rows={3}
          className="text-xs"
          placeholder="Konflikt, kelishmovchilik yoki hamkorlik qiyinligi..."
          value={competency.q2_team}
          onChange={e => onChange("q2_team", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">K3.</span> So'nggi 6 oyda nima o'rgandingiz?
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder="Ko'nikma, bilim yoki tajriba..."
          value={competency.q3_growth}
          onChange={e => onChange("q3_growth", e.target.value)}
        />
      </div>

      <div className="border border-amber-500/30 rounded-lg p-3 bg-amber-500/5">
        <Label className="text-xs mb-1.5 block font-medium text-amber-300">
          📋 Amaliy topshiriq natijasi
        </Label>
        <Textarea
          rows={3}
          className="text-xs"
          placeholder="Nomzodga berilgan amaliy topshiriq va uning bajarish jarayoni / natijasi..."
          value={competency.practical_task}
          onChange={e => onChange("practical_task", e.target.value)}
        />
      </div>
    </div>
  );
}
