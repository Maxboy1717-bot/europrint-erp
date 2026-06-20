/** @module CoordinationPageDialogs @description Dialog components for creating Докла (report), Распоряжение (order), and updating Council records in the CoordinationPage. Each dialog manages only its own submit interaction; form state is passed in as props. */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { COUNCIL_LEVELS, type DoklaFormState, type RaspoFormState, type CouncilFormState } from "./CoordinationPageTypes";

import { EPLoader } from "@/components/ep";

// ─── UserSelectOption ─────────────────────────────────────────────────────
interface UserSelectOption {
  id: number;
  full_name: string;
  role: string;
}

function useUsersForSelect() {
  return useQuery<UserSelectOption[]>({
    queryKey: ["/api/coordination/users-for-select"],
    queryFn: () => apiRequest("GET", "/api/coordination/users-for-select") as Promise<UserSelectOption[]>,
    staleTime: 5 * 60 * 1000,
  });
}
// ─── CreateDoklaDialog ────────────────────────────────────────────────────
interface CreateDoklaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: DoklaFormState;
  setForm: React.Dispatch<React.SetStateAction<DoklaFormState>>;
  onSubmit: (form: DoklaFormState) => void;
  isPending: boolean;
}

export function CreateDoklaDialog({
  open, onOpenChange, form, setForm, onSubmit, isPending,
}: CreateDoklaDialogProps) {
  const { t, language } = useTranslation("coordination");
  const { toast } = useToast();
  const isRu = language === "ru";

  function handleSubmit() {
    if (!form.subject.trim()) {
      toast({ title: isRu ? "Тема обязательна" : "Mavzu kiritilishi shart", variant: "destructive" });
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6" data-testid="dialog-create-dokla">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-blue)]">
            <ArrowUp className="w-4 h-4" />{t("createDokla")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">{isRu ? "Кому (уровень совета)" : "Kimga (kengash darajasi)"}</Label>
            <select
              className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
              value={form.councilLevel}
              onChange={e => setForm(p => ({ ...p, councilLevel: e.target.value }))}
            >
              {COUNCIL_LEVELS.map(c => (
                <option key={c.level} value={String(c.level)}>{c.level}. {t(c.key)}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Тема Доклада" : "Доклад mavzusi"} *</Label>
            <Input
              className="mt-1"
              placeholder={isRu ? "Краткая тема..." : "Qisqa mavzu..."}
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Описание проблемы" : "Muammo tavsifi"}</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder={isRu ? "Что произошло?" : "Nima yuz berdi?"}
              value={form.problem}
              onChange={e => setForm(p => ({ ...p, problem: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Достигнутый результат" : "Erishilgan natija"}</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder={isRu ? "Что сделано?" : "Nima qilindi?"}
              value={form.result}
              onChange={e => setForm(p => ({ ...p, result: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Предложение / Запрос" : "Taklif / So'rov"}</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder={isRu ? "Что нужно решить?" : "Nima hal qilinishi kerak?"}
              value={form.proposal}
              onChange={e => setForm(p => ({ ...p, proposal: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? "Отмена" : "Bekor qilish"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="btn-submit-dokla">
            {isPending
              ? <EPLoader className="w-3.5 h-3.5 mr-1.5" />
              : <ArrowUp className="w-3.5 h-3.5 mr-1.5" />}
            {t("createDokla")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CreateRaspoDialog ────────────────────────────────────────────────────
interface CreateRaspoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: RaspoFormState;
  setForm: React.Dispatch<React.SetStateAction<RaspoFormState>>;
  onSubmit: (form: RaspoFormState) => void;
  isPending: boolean;
}

export function CreateRaspoDialog({
  open, onOpenChange, form, setForm, onSubmit, isPending,
}: CreateRaspoDialogProps) {
  const { t, language } = useTranslation("coordination");
  const { toast } = useToast();
  const isRu = language === "ru";
  const { data: userList, isLoading: usersLoading } = useUsersForSelect();
  const users = Array.isArray(userList) ? userList : [];

  function handleSubmit() {
    if (!form.task.trim() || !form.to.trim()) {
      toast({ title: isRu ? "Заполните все поля" : "Barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6" data-testid="dialog-create-raspo">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-primary)]">
            <ArrowDown className="w-4 h-4" />{t("createRasporyazhenie")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">{isRu ? "Кому" : "Kimga"} *</Label>
            {usersLoading ? (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <EPLoader className="w-3 h-3" />
                {isRu ? "Загрузка..." : "Yuklanmoqda..."}
              </div>
            ) : (
              <select
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                value={form.to}
                onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                data-testid="select-assignee"
              >
                <option value="">{isRu ? "— Выберите исполнителя —" : "— Ijrochini tanlang —"}</option>
                {users.map(u => (
                  <option key={u.id} value={String(u.id)}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Задание" : "Vazifa"} *</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder={isRu ? "Чёткое, конкретное задание..." : "Aniq, muayyan topshiriq..."}
              value={form.task}
              onChange={e => setForm(p => ({ ...p, task: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? "Срок выполнения" : "Muddat"}</Label>
              <Input
                type="date"
                className="mt-1"
                value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? "Приоритет" : "Ustuvorlik"}</Label>
              <select
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              >
                <option value="high">{isRu ? "Высокий" : "Yuqori"}</option>
                <option value="medium">{isRu ? "Средний" : "O'rta"}</option>
                <option value="low">{isRu ? "Низкий" : "Past"}</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? "Отмена" : "Bekor qilish"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-orange-500 hover:bg-[var(--ep-primary)]/90"
            data-testid="btn-submit-raspo"
          >
            {isPending
              ? <EPLoader className="w-3.5 h-3.5 mr-1.5" />
              : <ArrowDown className="w-3.5 h-3.5 mr-1.5" />}
            {t("createRasporyazhenie")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── UpdateCouncilDialog ──────────────────────────────────────────────────
interface UpdateCouncilDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  councilName: string;
  form: CouncilFormState;
  setForm: React.Dispatch<React.SetStateAction<CouncilFormState>>;
  onSubmit: (form: CouncilFormState) => void;
  isPending: boolean;
}

export function UpdateCouncilDialog({
  open, onOpenChange, councilName, form, setForm, onSubmit, isPending,
}: UpdateCouncilDialogProps) {
  const { language } = useTranslation("coordination");
  const { toast } = useToast();
  const isRu = language === "ru";
  const { data: userList, isLoading: usersLoading } = useUsersForSelect();
  const users = Array.isArray(userList) ? userList : [];

  function handleSubmit() {
    if (!form.chairperson_id && !form.description.trim() && !form.meeting_schedule.trim()) {
      toast({
        title: isRu ? "Заполните хотя бы одно поле" : "Kamida bitta maydonni to'ldiring",
        variant: "destructive",
      });
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6" data-testid="dialog-update-council">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-blue)]">
            <Pencil className="w-4 h-4" />
            {isRu ? `Редактировать: ${councilName}` : `Tahrirlash: ${councilName}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">{isRu ? "Председатель" : "Rais"}</Label>
            {usersLoading ? (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <EPLoader className="w-3 h-3" />
                {isRu ? "Загрузка..." : "Yuklanmoqda..."}
              </div>
            ) : (
              <select
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                value={form.chairperson_id}
                onChange={e => setForm(p => ({ ...p, chairperson_id: e.target.value }))}
                data-testid="select-council-chairperson"
              >
                <option value="">{isRu ? "— Не изменять / выбрать —" : "— O'zgartirmaslik / tanlash —"}</option>
                {users.map(u => (
                  <option key={u.id} value={String(u.id)}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Описание" : "Tavsif"}</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder={isRu ? "Описание кengasha..." : "Kengash tavsifi..."}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              data-testid="input-council-description"
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "График совещаний" : "Yig'ilish jadvali"}</Label>
            <Input
              className="mt-1"
              placeholder={isRu ? "Пример: Каждый понедельник 09:00" : "Misol: Har dushanba 09:00"}
              value={form.meeting_schedule}
              onChange={e => setForm(p => ({ ...p, meeting_schedule: e.target.value }))}
              data-testid="input-council-meeting-schedule"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? "Отмена" : "Bekor qilish"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="btn-submit-council-update">
            {isPending
              ? <EPLoader className="w-3.5 h-3.5 mr-1.5" />
              : <Pencil className="w-3.5 h-3.5 mr-1.5" />}
            {isRu ? "Сохранить" : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
