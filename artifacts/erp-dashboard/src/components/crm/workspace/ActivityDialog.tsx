/**
 * @module ActivityDialog
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ActivityDialogProps } from "./types";

import { useTranslation } from '@/lib/i18n';
export function ActivityDialog({open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isPending,
  activityTypes,
}: ActivityDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Yangi faoliyat
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Tur</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
            >
              <SelectTrigger data-testid="select-activity-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(activityTypes) ? activityTypes : []).map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mavzu *</Label>
            <Input
              placeholder="Masalan: Mijozga qo'ng'iroq"
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value }))
              }
              data-testid="input-activity-subject"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bog'liq ob'ekt</Label>
              <Select
                value={form.entityType}
                onValueChange={(v) => setForm((f) => ({ ...f, entityType: v }))}
              >
                <SelectTrigger data-testid="select-activity-entity" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="deal">{t('deal')}</SelectItem>
                  <SelectItem value="contact">Kontakt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ID</Label>
              <Input
                placeholder="ID raqam"
                value={form.entityId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, entityId: e.target.value }))
                }
                data-testid="input-activity-entity-id"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Muddat</Label>
            <Input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, dueDate: e.target.value }))
              }
              data-testid="input-activity-due-date"
            />
          </div>
          <div>
            <Label className="text-xs">Izoh</Label>
            <Textarea
              placeholder="Qo'shimcha ma'lumot..."
              value={form.note}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
              data-testid="input-activity-note"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => onSubmit(form)}
            disabled={!form.subject || isPending}
            data-testid="button-save-activity"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
