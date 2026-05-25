/**
 * @module CourseSettingsForm
 * @description React UI component.
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from '@/lib/i18n';
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
  const { t } = useTranslation("common");
  const { t: tLms } = useTranslation("lms");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="level">{t("daraja")}</Label>
          <Select value={formData.level} onValueChange={(value: string) => setFormData({ ...formData, level: value as "beginner" | "intermediate" | "advanced" })}>
            <SelectTrigger data-testid="select-level" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">{t("boshlangich")}</SelectItem>
              <SelectItem value="intermediate">{t("medium")}</SelectItem>
              <SelectItem value="advanced">{t("ilgor")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between space-x-2 pt-8">
          <Label htmlFor="required" className="cursor-pointer">
            {t("majburiyKurs")}
          </Label>
          <Switch
            id="required"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
            data-testid="switch-required"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="startDate">{tLms("startDateOptional")}</Label>
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

        <div className="space-y-1">
          <Label htmlFor="endDate">{tLms("endDateOptional")}</Label>
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
