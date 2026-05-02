import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsData {
  level: "beginner" | "intermediate" | "advanced";
  isRequired: boolean;
  startDate: string;
  endDate: string;
}

interface CourseSettingsFormProps {
  formData: SettingsData;
  setFormData: (data: SettingsData) => void;
}

export function CourseSettingsForm({ formData, setFormData }: CourseSettingsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="level">Daraja</Label>
          <Select value={formData.level} onValueChange={(value: string) => setFormData({ ...formData, level: value as "beginner" | "intermediate" | "advanced" })}>
            <SelectTrigger data-testid="select-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Boshlang'ich</SelectItem>
              <SelectItem value="intermediate">O'rta</SelectItem>
              <SelectItem value="advanced">Ilg'or</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between space-x-2 pt-8">
          <Label htmlFor="required" className="cursor-pointer">
            Majburiy kurs
          </Label>
          <Switch
            id="required"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
            data-testid="switch-required"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Boshlanish sanasi (ixtiyoriy)</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            max="2099-12-31"
            data-testid="input-start-date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Tugash sanasi (ixtiyoriy)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            max="2099-12-31"
            data-testid="input-end-date"
          />
        </div>
      </div>
    </div>
  );
}
