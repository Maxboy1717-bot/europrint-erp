/**
 * @module StepExperience
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PortretData } from "./types";
import { WORKER_TYPE_META } from "@/lib/workerType";
import type { WorkerType } from "@/lib/workerType";

interface StepExperienceProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
}

export function StepExperience({ portret, onChange }: StepExperienceProps) {
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">Blok E: Tajriba va bilim</h3>
        <Badge variant="outline" className="text-[9px]">5 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">14. Qanday turdagi odam zarar yetkazishi mumkin?</Label>
        <Textarea
          placeholder="Masalan: tartibsiz, mas'uliyatsiz, agressiv, o'rganishni xohlamaydigan..."
          rows={2}
          value={portret.danger_candidate ?? ""}
          onChange={e => p("danger_candidate")(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 p-3 bg-muted/40 rounded-lg border border-border/40">
        <div className="flex items-center justify-between">
          <Label className="text-xs">15. Oldingi ish tajribasi majburiymi?</Label>
          <div className="flex gap-1">
            <Button
              variant={portret.experience_required ? "default" : "outline"}
              size="sm" className="h-7 text-xs"
              onClick={() => p("experience_required")(true)}
            >Ha</Button>
            <Button
              variant={!portret.experience_required ? "default" : "outline"}
              size="sm" className="h-7 text-xs"
              onClick={() => p("experience_required")(false)}
            >Yo'q</Button>
          </div>
        </div>

        {portret.experience_required && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-[11px] mb-1 block">Qaysi sohada va necha yil?</Label>
            <Input
              placeholder="Masalan: FMCG savdo sohasida kamida 2 yil"
              value={portret.experience_field ?? ""}
              onChange={e => p("experience_field")(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs mb-1 block">16. Hozir kandidat qayerda ishlayotgan bo'lishi mumkin?</Label>
        <Input
          placeholder="Masalan: raqobatchi kompaniyalarda, bank sohasida, frilansda..."
          value={portret.current_employment ?? ""}
          onChange={e => p("current_employment")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">17. Ma'lum sohada tajriba kerakmi?</Label>
        <Input
          placeholder="Masalan: Qurilish, Tibbiyot, IT..."
          value={portret.industry_experience ?? ""}
          onChange={e => p("industry_experience")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">18. Kasb ko'nikmalari (dasturlar, tillar)</Label>
        <Textarea
          placeholder="Masalan: Excel (VLOOKUP), 1C, Ingliz tili (B2), Photoshop..."
          rows={2}
          value={portret.professional_skills ?? ""}
          onChange={e => p("professional_skills")(e.target.value)}
        />
      </div>

      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <Label className="text-xs mb-2 block text-primary font-semibold">Xodim turi (Maqsadli)</Label>
        <div className="flex gap-2">
          <button
            onClick={() => p("target_worker_type")("FLAGMAN")}
            className={`flex-1 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
              portret.target_worker_type === "FLAGMAN"
                ? "bg-primary text-white border-primary"
                : "bg-white border-border/60 text-muted-foreground hover:border-primary/40"
            }`}
          >
            🚀 FLAGMAN (Natija)
          </button>
          <button
            onClick={() => p("target_worker_type")("PROTSESSNIK")}
            className={`flex-1 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
              portret.target_worker_type === "PROTSESSNIK"
                ? "bg-primary text-white border-primary"
                : "bg-white border-border/60 text-muted-foreground hover:border-primary/40"
            }`}
          >
            ⚙️ PROTSESSNIK (Jarayon)
          </button>
        </div>
      </div>
    </div>
  );
}
