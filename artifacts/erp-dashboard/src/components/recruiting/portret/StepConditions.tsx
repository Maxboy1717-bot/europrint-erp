/**
 * @module StepConditions
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";

interface StepConditionsProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
  onToggleSocial: (opt: string) => void;
  socialPackageOptions: string[];
}

export function StepConditions({ portret, onChange, onToggleSocial, socialPackageOptions }: StepConditionsProps) {
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">III bo'lim: Ish sharoitlari</h3>
        <Badge variant="outline" className="text-[9px]">Kandidatga ma'lumot</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1 block">Ish haqi (min)</Label>
          <Input
            type="number"
            value={portret.salary_min ?? ""}
            onChange={e => p("salary_min")(Number(e.target.value))}
            placeholder="UZS"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Ish haqi (max)</Label>
          <Input
            type="number"
            value={portret.salary_max ?? ""}
            onChange={e => p("salary_max")(Number(e.target.value))}
            placeholder="UZS"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1 block">Sinov muddati (oy)</Label>
          <Input
            type="number"
            value={portret.probation_months ?? 3}
            onChange={e => p("probation_months")(Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Ish grafigi</Label>
          <Select value={portret.work_schedule ?? "5/2"} onValueChange={v => p("work_schedule")(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5/2">5/2 (Dush-Juma)</SelectItem>
              <SelectItem value="6/1">6/1 (Dush-Shan)</SelectItem>
              <SelectItem value="2/2">2/2 (Smena)</SelectItem>
              <SelectItem value="free">Erkin grafik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-2 block">Ijtimoiy paket</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2">
          {(Array.isArray(socialPackageOptions) ? socialPackageOptions : []).map(opt => (
            <button
              key={opt}
              onClick={() => onToggleSocial(opt)}
              className={`text-[10px] py-1 px-2 rounded-md border text-left transition-all ${
                (Array.isArray(portret.social_package) ? portret.social_package : []).includes(opt)
                  ? "bg-primary/10 border-primary text-primary font-medium"
                  : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Qo'shimcha shartlar va imtiyozlar</Label>
        <Textarea
          placeholder="Boshqa barcha qo'shimcha ma'lumotlar..."
          rows={2}
          value={portret.additional_conditions ?? ""}
          onChange={e => p("additional_conditions")(e.target.value)}
        />
      </div>
    </div>
  );
}
