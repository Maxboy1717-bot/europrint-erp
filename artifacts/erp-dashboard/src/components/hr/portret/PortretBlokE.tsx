/**
 * @module PortretBlokE
 * @description React UI component.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PortretData } from "./types";

interface PortretBlokEProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
}

export function PortretBlokE({ portret, onChange }: PortretBlokEProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">Blok E: Tajriba & Bilim</h4>
        <Badge variant="outline" className="text-[9px]">5 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">14. Xavfli nomzod tavsifi (Xavf guruhlari)</Label>
        <Textarea
          placeholder="Kandidatda qaysi belgilar bo'lsa uni ishga olmaslik kerak? (masalan: tez-tez ish joyini o'zgartirgan...)"
          rows={2}
          value={portret.danger_candidate ?? ""}
          onChange={e => onChange("danger_candidate")(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2 py-2 border rounded-lg px-3 bg-muted/40">
        <Checkbox
          id="exp_req"
          checked={portret.experience_required ?? false}
          onCheckedChange={v => onChange("experience_required")(!!v)}
        />
        <label htmlFor="exp_req" className="text-xs font-medium leading-none cursor-pointer">
          15. Tajriba majburiymi? (Tajribasizlarni ko'rmaymiz)
        </label>
      </div>

      {portret.experience_required && (
        <div>
          <Label className="text-xs mb-1 block">15a. Qaysi sohada va necha yil?</Label>
          <Input
            placeholder="Masalan: Logistika sohasida kamida 2 yil..."
            value={portret.experience_field ?? ""}
            onChange={e => onChange("experience_field")(e.target.value)}
          />
        </div>
      )}

      <div>
        <Label className="text-xs mb-1 block">16. Hozir qayerda ishlaydi?</Label>
        <Input
          placeholder="Potensial kandidat hozir qaysi kompaniyalarda yoki lavozimlarda ishlayotgan bo'lishi mumkin?"
          value={portret.current_employment ?? ""}
          onChange={e => onChange("current_employment")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">17. Qaysi sohalardagi tajriba ustunlik beradi?</Label>
        <Input
          placeholder="Masalan: FMCG, Ishlab chiqarish, IT..."
          value={portret.industry_experience ?? ""}
          onChange={e => onChange("industry_experience")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">18. Professional ko'nikmalar (Hard skills)</Label>
        <Textarea
          placeholder="Qaysi dasturlarni bilishi shart? (Excel, 1C, Photoshop, Python...)"
          rows={2}
          value={portret.professional_skills ?? ""}
          onChange={e => onChange("professional_skills")(e.target.value)}
        />
      </div>
    </div>
  );
}
