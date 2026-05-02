import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";

interface StepDemographicsProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
}

export function StepDemographics({ portret, onChange }: StepDemographicsProps) {
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">Blok B: Demografik talablar</h3>
        <Badge variant="outline" className="text-[9px]">5 ta savol</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs mb-1 block">6. Yosh (min)</Label>
          <Input
            type="number" min={18} max={70}
            value={portret.age_min ?? 22}
            onChange={e => p("age_min")(Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">7. Yosh (max)</Label>
          <Input
            type="number" min={18} max={70}
            value={portret.age_max ?? 45}
            onChange={e => p("age_max")(Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">8. Jins</Label>
          <Select value={portret.gender ?? "any"} onValueChange={v => p("gender")(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Muhim emas</SelectItem>
              <SelectItem value="male">Erkak</SelectItem>
              <SelectItem value="female">Ayol</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">9. Oilaviy holat (izoh, ixtiyoriy)</Label>
        <Input
          placeholder="Masalan: uylanganlar afzal, muhim emas, farzandlilari uchun moslashtirilgan..."
          value={portret.family_status ?? ""}
          onChange={e => p("family_status")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">10. Ta'lim darajasi</Label>
        <Select value={portret.education_req ?? "higher"} onValueChange={v => p("education_req")(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Muhim emas</SelectItem>
            <SelectItem value="secondary">O'rta (maktab)</SelectItem>
            <SelectItem value="vocational">O'rta maxsus (kollej/texnikum)</SelectItem>
            <SelectItem value="higher">Oliy (bakalavr)</SelectItem>
            <SelectItem value="masters">Magistr / PhD</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
