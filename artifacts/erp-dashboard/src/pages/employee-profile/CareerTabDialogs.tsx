/**
 * @module CareerTabDialogs
 * @description Inline edit form for the career plan card.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CareerFormState } from "./CareerTabTypes";

interface CareerEditFormProps {
  form: CareerFormState;
  onChange: (updated: CareerFormState) => void;
}

export function CareerEditForm({ form, onChange }: CareerEditFormProps) {
  const set = (patch: Partial<CareerFormState>) => onChange({ ...form, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
          <Label>Keyingi tavsiya etilgan lavozim</Label>
        <Input
          value={form.nextRecommendedPosition}
          onChange={(e) => set({ nextRecommendedPosition: e.target.value })}
          placeholder="Masalan: Ustaxona boshlig'i"
          data-testid="input-next-position"
        />
      </div>
      <div className="space-y-1">
          <Label>Succession — kimning o'rniga o'tishi mumkin</Label>
        <Input
          value={form.successionFor}
          onChange={(e) => set({ successionFor: e.target.value })}
          placeholder="Masalan: Direktor"
          data-testid="input-succession-for"
        />
      </div>
      <div className="space-y-1">
          <Label>Cross-training holati</Label>
        <Select
          value={form.crossTrainingStatus}
          onValueChange={(v) => set({ crossTrainingStatus: v })}
        >
          <SelectTrigger data-testid="select-cross-training" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Boshlanmagan</SelectItem>
            <SelectItem value="in_progress">Davom etmoqda</SelectItem>
            <SelectItem value="completed">Bajarildi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
          <Label>Karera yo'nalishi</Label>
        <Input
          value={form.careerPathDirection}
          onChange={(e) => set({ careerPathDirection: e.target.value })}
          placeholder="Masalan: Texnik mutaxassis"
          data-testid="input-career-direction"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Cross-training eslatma</Label>
        <Input
          value={form.crossTrainingNotes}
          onChange={(e) => set({ crossTrainingNotes: e.target.value })}
          placeholder="Qo'shimcha ma'lumot..."
          data-testid="input-cross-training-notes"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Umumiy eslatmalar</Label>
        <Input
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="HR izohlar..."
          data-testid="input-career-notes"
        />
      </div>
    </div>
  );
}
