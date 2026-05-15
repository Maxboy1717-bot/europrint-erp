/**
 * @module ProbationJournalPanel.dialogs
 * @description Add-entry and edit-dates dialogs for ProbationJournalPanel.
 *   Split out so the parent component stays under 300 lines.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { CalendarDays, CheckCircle2, BarChart3 } from "lucide-react";

export type EntryForm = {
  week_number: number;
  notes: string;
  mood_score: string;
  nastavnik_feedback: string;
  discipline_issues: string;
  tasks_status: string;
};

export type DateForm = {
  probation_start_date: string;
  probation_end_date: string;
};

export function AddEntryDialog({
  open,
  onClose,
  candidateName,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  candidateName: string;
  form: EntryForm;
  setForm: (updater: (f: EntryForm) => EntryForm) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Haftalik Yozuv — {candidateName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">{t("haftaRaqami")}</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={form.week_number}
                onChange={(e) => setForm((f) => ({ ...f, week_number: Number(e.target.value) }))}
                data-testid="input-probation-week"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Kayfiyat (1-5) *</Label>
              <Select value={form.mood_score} onValueChange={(v) => setForm((f) => ({ ...f, mood_score: v }))}>
                <SelectTrigger data-testid="select-probation-mood" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("k1JudaYomon")}</SelectItem>
                  <SelectItem value="2">{t("k2Yomon")}</SelectItem>
                  <SelectItem value="3">{t("k3Ortacha")}</SelectItem>
                  <SelectItem value="4">{t("k4Yaxshi")}</SelectItem>
                  <SelectItem value="5">{t("k5Alo")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">{t("vazifalarHolati")}</Label>
            <Select value={form.tasks_status} onValueChange={(v) => setForm((f) => ({ ...f, tasks_status: v }))}>
              <SelectTrigger data-testid="select-probation-tasks" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ok">{t("Bajarildi")}</SelectItem>
                <SelectItem value="partial">{t("qismanBajarildi")}</SelectItem>
                <SelectItem value="not_done">{t("bajarilmadi")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">{t("umumiyIzoh")}</Label>
            <Textarea
              placeholder={t("buHaftaXodimQandayIshladi")}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              data-testid="textarea-probation-notes"
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">{t("nastavnikIzohi")}</Label>
            <Textarea
              placeholder="Nastavnik / mentor izohi..."
              value={form.nastavnik_feedback}
              onChange={(e) => setForm((f) => ({ ...f, nastavnik_feedback: e.target.value }))}
              rows={2}
              data-testid="textarea-probation-nastavnik"
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">Intizom hodisalari (ixtiyoriy)</Label>
            <Textarea
              placeholder={t("kechikishSababsizYoqlikVaBoshqalar")}
              value={form.discipline_issues}
              onChange={(e) => setForm((f) => ({ ...f, discipline_issues: e.target.value }))}
              rows={2}
              data-testid="textarea-probation-discipline"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("Bekor")}
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !form.week_number}
            className="gap-1"
            data-testid="button-save-probation-entry"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditDatesDialog({
  open,
  onClose,
  probationMonths,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  probationMonths: number;
  form: DateForm;
  setForm: (updater: (f: DateForm) => DateForm) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            {t("sinovDavriSanalariniBelgilash")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs mb-1 block">{t("startDate")}</Label>
            <Input
              type="date"
              value={form.probation_start_date}
              onChange={(e) => setForm((f) => ({ ...f, probation_start_date: e.target.value }))}
              data-testid="input-probation-start-date"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("endDate")}</Label>
            <Input
              type="date"
              value={form.probation_end_date}
              onChange={(e) => setForm((f) => ({ ...f, probation_end_date: e.target.value }))}
              data-testid="input-probation-end-date"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Odatda sinov muddati {probationMonths} oy bo'ladi. Boshlanish sanasidan {probationMonths * 30} kun o'tgach
            tugash sanasini belgilang.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("Bekor")}
          </Button>
          <Button onClick={onSave} disabled={saving} data-testid="button-save-probation-dates">
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
