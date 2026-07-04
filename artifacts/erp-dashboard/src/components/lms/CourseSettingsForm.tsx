/**
 * @module CourseSettingsForm
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
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

// SB0112/SB0148 (03-lms-darslik): courses.course_type CHECK-constraint bilan mos enum.
const COURSE_TYPES = ['safety_tx', 'regulation', 'general', 'razryad_exam', 'onboarding', 'replication'] as const;

interface SettingsData {
  level: "beginner" | "intermediate" | "advanced";
  isRequired: boolean;
  startDate: string;
  endDate: string;
  cardId?: string | null;
  courseType?: string | null;
}

interface OrgCardOption {
  id: number | string;
  positionName?: string;
  position_name?: string;
  name?: string;
}

interface CourseSettingsFormProps {
  formData: SettingsData;
  setFormData: (data: SettingsData) => void;
}

export function CourseSettingsForm({ formData, setFormData }: CourseSettingsFormProps) {
  const { t } = useTranslation("common");
  const { t: tLms } = useTranslation("lms");

  // SB0120 (EP-LMS-001): karta-markazli darslik biriktiruvi — org-karta ro'yxati (flat).
  const { data: cardsResponse } = useQuery<{ data: OrgCardOption[] } | OrgCardOption[]>({
    queryKey: ["/api/org-structure/nodes/flat"],
  });
  const orgCards = Array.isArray(cardsResponse)
    ? cardsResponse
    : (Array.isArray(cardsResponse?.data) ? cardsResponse.data : []);

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

      <div className="space-y-1">
        <Label htmlFor="courseType">{t("kursTuri", "Kurs turi")}</Label>
        <Select
          value={formData.courseType || "none"}
          onValueChange={(value: string) => setFormData({ ...formData, courseType: value === "none" ? null : value })}
        >
          <SelectTrigger data-testid="select-course-type" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("tasniflanmagan", "Tasniflanmagan")}</SelectItem>
            {COURSE_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>{t(`kursTuri.${ct}`, ct)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="cardId">{t("kartagaBiriktirish", "Kartaga biriktirish")}</Label>
        <Select
          value={formData.cardId || "none"}
          onValueChange={(value: string) => setFormData({ ...formData, cardId: value === "none" ? null : value })}
        >
          <SelectTrigger data-testid="select-card" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("kartasiz", "Kartasiz (universal kurs)")}</SelectItem>
            {orgCards.map((c) => (
              <SelectItem key={String(c.id)} value={String(c.id)}>
                {c.positionName || c.position_name || c.name || `#${c.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
