/**
 * @module CourseBasicInfoForm
 * @description React UI component.
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BasicInfoData {
  code: string;
  departmentId: string;
  title: string;
  titleRu: string;
}

interface CourseBasicInfoFormProps {
  formData: BasicInfoData;
  setFormData: (data: BasicInfoData) => void;
  orgDepartments: Array<{ id: string; name: string }>;
}

export function CourseBasicInfoForm({formData, setFormData, orgDepartments }: CourseBasicInfoFormProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="code">{t("kursKodi")}</Label>
          <Input
            id="code"
            placeholder={t('print101')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            data-testid="input-course-code"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="department">{t("tashkiliyTuzilma")}</Label>
          <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
            <SelectTrigger data-testid="select-org-structure" className="h-9">
              <SelectValue placeholder={t("tashkiliyTuzilmaniTanlang")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("barchaTashkiliyTuzilma")}</SelectItem>
              {(Array.isArray(orgDepartments) ? orgDepartments : []).map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
          <Label htmlFor="title">Kurs nomi (O'zbek) *</Label>
        <Input
          id="title"
          placeholder={t("bosmaMashinalaridaIshlashAsoslari")}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          data-testid="input-title"
        />
      </div>

      <div className="space-y-1">
          <Label htmlFor="titleRu">Kurs nomi (Rus) *</Label>
        <Input
          id="titleRu"
          placeholder="Основы работы на печатных машинах"
          value={formData.titleRu}
          onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
          required
          data-testid="input-title-ru"
        />
      </div>
    </div>
  );
}
