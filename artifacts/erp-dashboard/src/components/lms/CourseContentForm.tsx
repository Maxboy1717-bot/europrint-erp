/**
 * @module CourseContentForm
 * @description React UI component.
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
interface ContentData {
  description: string;
  descriptionRu: string;
}

interface CourseContentFormProps {
  formData: ContentData;
  setFormData: (data: ContentData) => void;
}

export function CourseContentForm({ formData, setFormData }: CourseContentFormProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="space-y-1">
          <Label htmlFor="description">{tLabel('common.CourseContentForm.tavsifOzbek', "Tavsif (O'zbek) *")}</Label>
        <Textarea
          id="description"
          placeholder={t("kursHaqidaBatafsilMalumot")}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
          data-testid="input-description"
        />
      </div>

      <div className="space-y-1">
          <Label htmlFor="descriptionRu">{tLabel('common.CourseContentForm.tavsifRus', "Tavsif (Rus) *")}</Label>
        <Textarea
          id="descriptionRu"
          placeholder={tLabel('common.CourseContentForm.untitled', "Подробное описание курса...")}
          value={formData.descriptionRu}
          onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
          rows={3}
          required
          data-testid="input-description-ru"
        />
      </div>
    </div>
  );
}
