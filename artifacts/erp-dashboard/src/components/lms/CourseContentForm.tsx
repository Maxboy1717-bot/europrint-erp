import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContentData {
  description: string;
  descriptionRu: string;
}

interface CourseContentFormProps {
  formData: ContentData;
  setFormData: (data: ContentData) => void;
}

export function CourseContentForm({ formData, setFormData }: CourseContentFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Tavsif (O'zbek) *</Label>
        <Textarea
          id="description"
          placeholder="Kurs haqida batafsil ma'lumot..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
          data-testid="input-description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionRu">Tavsif (Rus) *</Label>
        <Textarea
          id="descriptionRu"
          placeholder="Подробное описание курса..."
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
