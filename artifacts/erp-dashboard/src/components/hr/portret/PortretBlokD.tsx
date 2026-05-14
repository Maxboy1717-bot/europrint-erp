/**
 * @module PortretBlokD
 * @description React UI component.
 */

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToolTestReqs } from "./types";

const TOOL_TRAITS = [
  { key: "A", label: "A — Diqqat (Внимание)",         description: "Tafsilotlarga e'tibor, ziyraklik" },
  { key: "B", label: "B — Strategiya (Стратегия)",     description: "Uzoqni ko'rish, rejalashtirish" },
  { key: "C", label: "C — Nazorat (Контроль)",         description: "Emotsiyalarni boshqarish, sakin bo'lish" },
  { key: "D", label: "D — Ishonch (Уверенность)",      description: "O'ziga va qarorlariga ishonch" },
  { key: "E", label: "E — Energiya (Энергия)",         description: "Faollik, harakatchanlik darajasi" },
  { key: "F", label: "F — Qat'iylik (Решительность)", description: "Tez va aniq qaror qabul qilish" },
  { key: "G", label: "G — Bardosh (Оборона)",          description: "Tanqid va bosimga chidamlilik" },
  { key: "H", label: "H — Taktika (Тактика)",          description: "Operativ fikrlash, moslashuvchanlik" },
  { key: "I", label: "I — Empatiya (Эмпатия)",         description: "Odamlarni tushunish, his qilish" },
  { key: "J", label: "J — Muloqot (Общение)",          description: "Kommunikatsiya, aloqa o'rnatish" },
];

interface PortretBlokDProps {
  toolReqs: ToolTestReqs;
  onTraitChange: (key: string, val: number) => void;
  onOtherChange: (field: keyof Omit<ToolTestReqs, 'traits'>, val: number) => void;
}

export function PortretBlokD({ toolReqs, onTraitChange, onOtherChange }: PortretBlokDProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">Blok D: TOOL TEST Talablari</h4>
        <Badge variant="outline" className="text-[9px]">Material №25-42</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {(Array.isArray(TOOL_TRAITS) ? TOOL_TRAITS : []).map(t => (
          <div key={t.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-[11px] font-medium">{t.label}</Label>
              <span className="text-[11px] font-bold text-primary">{toolReqs.traits[t.key] ?? 0}</span>
            </div>
            <Slider
              min={-100} max={100} step={5}
              value={[toolReqs.traits[t.key] ?? 0]}
              onValueChange={([v]) => onTraitChange(t.key, v)}
            />
            <p className="text-[9px] text-muted-foreground italic leading-none">{t.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
        <div>
          <Label className="text-[10px] mb-1 block">IQ (min)</Label>
          <Slider min={1} max={10} step={1}
            value={[toolReqs.iq_min ?? 4]}
            onValueChange={([v]) => onOtherChange("iq_min", v)} />
          <div className="text-center text-[10px] font-bold mt-1">{toolReqs.iq_min ?? 4}</div>
        </div>
        <div>
          <Label className="text-[10px] mb-1 block">Liderlik (min %)</Label>
          <Slider min={0} max={100} step={5}
            value={[toolReqs.leadership_min ?? 70]}
            onValueChange={([v]) => onOtherChange("leadership_min", v)} />
          <div className="text-center text-[10px] font-bold mt-1">{toolReqs.leadership_min ?? 70}%</div>
        </div>
        <div>
          <Label className="text-[10px] mb-1 block">Takrorlash (min %)</Label>
          <Slider min={0} max={100} step={5}
            value={[toolReqs.replication_min ?? 70]}
            onValueChange={([v]) => onOtherChange("replication_min", v)} />
          <div className="text-center text-[10px] font-bold mt-1">{toolReqs.replication_min ?? 70}%</div>
        </div>
      </div>
    </div>
  );
}
