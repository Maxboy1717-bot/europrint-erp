/** @module ProgramsTabFormDialog @description ProgramFormDialog — create/edit form dialog for adaptation programs. */

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { TaskEditor, CheckpointEditor } from "./ProgramsTabSections";
import type { ProgramFormState, DepartmentItem, PositionItem } from "./ProgramsTabTypes";
import type { AdaptationProgram } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProgram: AdaptationProgram | null;
  form: ProgramFormState;
  setField: <K extends keyof ProgramFormState>(key: K, value: ProgramFormState[K]) => void;
  departments: DepartmentItem[];
  positions: PositionItem[];
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onOpenNew: () => void;
}

export function ProgramFormDialog({
  open,
  onOpenChange,
  editingProgram,
  form,
  setField,
  departments,
  positions,
  isPending,
  onSubmit,
  onOpenNew,
}: ProgramFormDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-program" onClick={onOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          {t("yangiDastur")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {editingProgram?.id ? "Dasturni tahrirlash" : "Yangi dastur yaratish"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">
                Nomi (UZ) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setField("title", e.target.value)}
                data-testid="input-title"
              />
            </div>
            <div>
              <Label htmlFor="titleRu">
                Nomi (RU) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleRu"
                value={form.titleRu}
                onChange={e => setField("titleRu", e.target.value)}
                data-testid="input-title-ru"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Tavsif (UZ)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                data-testid="input-description"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="descriptionRu">Tavsif (RU)</Label>
              <Textarea
                id="descriptionRu"
                value={form.descriptionRu}
                onChange={e => setField("descriptionRu", e.target.value)}
                data-testid="input-description-ru"
                rows={2}
              />
            </div>
          </div>

          {/* Duration + status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="duration">
                {t("davomiyligi")}<span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                value={form.duration}
                min={1}
                onChange={e => setField("duration", parseInt(e.target.value) || 1)}
                data-testid="input-duration"
              />
            </div>
            <div>
              <Label>
                {t("type")}<span className="text-destructive">*</span>
              </Label>
              <Select value={form.durationType} onValueChange={v => setField("durationType", v)}>
                <SelectTrigger data-testid="select-duration-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t("kun")}</SelectItem>
                  <SelectItem value="week">{t("hafta")}</SelectItem>
                  <SelectItem value="month">Oy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("status28")}</Label>
              <Select value={form.status} onValueChange={v => setField("status", v)}>
                <SelectTrigger data-testid="select-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="archived">{t("archived")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department + position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Bo'lim (ixtiyoriy)</Label>
              <Select value={form.departmentId} onValueChange={v => setField("departmentId", v)}>
                <SelectTrigger data-testid="select-department" className="h-9">
                  <SelectValue placeholder={t("barchaBolimlar")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("barchaBolimlar")}</SelectItem>
                  {(Array.isArray(departments) ? departments : []).map((dept: DepartmentItem) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lavozim (ixtiyoriy)</Label>
              <Select value={form.positionId} onValueChange={v => setField("positionId", v)}>
                <SelectTrigger data-testid="select-position" className="h-9">
                  <SelectValue placeholder={t("barchaLavozimlar")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("barchaLavozimlar")}</SelectItem>
                  {(Array.isArray(positions) ? positions : []).map((pos: PositionItem) => (
                    <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task editor */}
          <div className="border-t pt-3">
            <TaskEditor tasks={form.tasks} onChange={t => setField("tasks", t)} />
          </div>

          {/* Checkpoint editor */}
          <div className="border-t pt-3">
            <CheckpointEditor
              checkpoints={form.checkpoints}
              onChange={c => setField("checkpoints", c)}
            />
          </div>

          {/* Mentor checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mentorRequired"
              checked={form.mentorRequired}
              onChange={e => setField("mentorRequired", e.target.checked)}
              className="rounded"
              data-testid="checkbox-mentor-required"
            />
            <Label htmlFor="mentorRequired">{t("mentorTalabQilinadi")}</Label>
          </div>

          <DialogFooter>
            <Button type="submit" data-testid="button-submit-program" disabled={isPending}>
              {isPending
                ? "Saqlanmoqda..."
                : editingProgram?.id
                  ? "Yangilash"
                  : "Yaratish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
