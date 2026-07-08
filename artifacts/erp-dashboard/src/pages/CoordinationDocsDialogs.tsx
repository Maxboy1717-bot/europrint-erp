/** @module CoordinationDocsDialogs @description Dialog components for the Prikaz (приказ — director order) and Protocol (протокол — council minutes) sections of the CoordinationPage. Each dialog manages only its own submit interaction; form state is passed in as props. Mirrors CoordinationPageDialogs (CreateDoklaDialog / CreateRaspoDialog) structure. */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Gavel, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { EPLoader } from "@/components/ep";
import {
  type Council, type Prikaz, type PrikazFormState, type ProtocolFormState,
} from "./CoordinationPageTypes";

// ─── UserSelectOption (mirror of CoordinationPageDialogs) ──────────────────
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

// ─── PrikazDialog (create + edit draft) ────────────────────────────────────
interface PrikazDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  form: PrikazFormState;
  setForm: React.Dispatch<React.SetStateAction<PrikazFormState>>;
  onSubmit: (form: PrikazFormState) => void;
  isPending: boolean;
  /** Signed prikazes offered as "supersedes" targets (create mode only). */
  signedPrikazes: Prikaz[];
}

export function PrikazDialog({
  open, onOpenChange, mode, form, setForm, onSubmit, isPending, signedPrikazes,
}: PrikazDialogProps) {
  const { language } = useTranslation("coordination");
  const { toast } = useToast();
  const isRu = language === "ru";

  function handleSubmit() {
    if (!form.title.trim()) {
      toast({ title: isRu ? "Заголовок обязателен" : "Sarlavha kiritilishi shart", variant: "destructive" });
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6" data-testid="dialog-prikaz">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-primary)]">
            {mode === "edit" ? <Pencil className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {mode === "edit"
              ? (isRu ? "Редактировать приказ" : "Приказ tahrirlash")
              : (isRu ? "Новый приказ" : "Yangi приказ")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">{isRu ? "Заголовок приказа" : "Приказ sarlavhasi"} *</Label>
            <Input
              className="mt-1"
              placeholder={isRu ? "Краткий заголовок..." : "Qisqa sarlavha..."}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              data-testid="input-prikaz-title"
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Содержание" : "Matni"}</Label>
            <Textarea
              className="mt-1"
              rows={4}
              placeholder={isRu ? "Текст приказа..." : "Приказ matni..."}
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              data-testid="input-prikaz-content"
            />
          </div>
          {mode === "create" && (
            <div>
              <Label className="text-xs">{isRu ? "Заменяет приказ (необязательно)" : "Almashtiradigan приказ (ixtiyoriy)"}</Label>
              <select
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                value={form.supersedesId}
                onChange={e => setForm(p => ({ ...p, supersedesId: e.target.value }))}
                data-testid="select-prikaz-supersedes"
              >
                <option value="">{isRu ? "— Нет —" : "— Yo'q —"}</option>
                {signedPrikazes.map(p => (
                  <option key={p.id} value={String(p.id)}>
                    №{p.prikaz_number ?? p.id} · {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? "Отмена" : "Bekor qilish"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="btn-submit-prikaz">
            {isPending
              ? <EPLoader className="w-3.5 h-3.5 mr-1.5" />
              : <FileText className="w-3.5 h-3.5 mr-1.5" />}
            {isRu ? "Сохранить" : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CancelPrikazDialog (destructive confirm + reason, Qoida 14) ───────────
interface CancelPrikazDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prikazTitle: string;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export function CancelPrikazDialog({
  open, onOpenChange, prikazTitle, onConfirm, isPending,
}: CancelPrikazDialogProps) {
  const { language } = useTranslation("coordination");
  const { toast } = useToast();
  const isRu = language === "ru";
  const [reason, setReason] = useState("");

  function handleConfirm() {
    if (!reason.trim()) {
      toast({ title: isRu ? "Укажите причину" : "Sababni kiriting", variant: "destructive" });
      return;
    }
    onConfirm(reason.trim());
    setReason("");
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={o => { if (!o) setReason(""); onOpenChange(o); }}
    >
      <AlertDialogContent data-testid="dialog-cancel-prikaz">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[var(--ep-red)]">
            {isRu ? "Отменить приказ?" : "Приказни bekor qilasizmi?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {(isRu ? "Приказ: " : "Приказ: ") + prikazTitle}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-1">
          <Label className="text-xs">{isRu ? "Причина отмены" : "Bekor qilish sababi"} *</Label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder={isRu ? "Почему приказ отменяется?" : "Приказ nima uchun bekor qilinmoqda?"}
            value={reason}
            onChange={e => setReason(e.target.value)}
            data-testid="input-cancel-reason"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="btn-cancel-prikaz-abort">
            {isRu ? "Назад" : "Orqaga"}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            data-testid="btn-cancel-prikaz-confirm"
          >
            {isPending && <EPLoader className="w-3.5 h-3.5 mr-1.5" />}
            {isRu ? "Отменить приказ" : "Приказни bekor qilish"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── ProtocolDialog (create / edit draft / amend) ──────────────────────────
interface ProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "amend";
  form: ProtocolFormState;
  setForm: React.Dispatch<React.SetStateAction<ProtocolFormState>>;
  onSubmit: (form: ProtocolFormState) => void;
  isPending: boolean;
  councils: Council[];
}

export function ProtocolDialog({
  open, onOpenChange, mode, form, setForm, onSubmit, isPending, councils,
}: ProtocolDialogProps) {
  const { language } = useTranslation("coordination");
  const { toast } = useToast();
  const isRu = language === "ru";
  const { data: userList, isLoading: usersLoading } = useUsersForSelect();
  const users = Array.isArray(userList) ? userList : [];

  function handleSubmit() {
    if (!form.title.trim()) {
      toast({ title: isRu ? "Заголовок обязателен" : "Sarlavha kiritilishi shart", variant: "destructive" });
      return;
    }
    onSubmit(form);
  }

  const heading =
    mode === "amend" ? (isRu ? "Исправляющий протокол" : "Tuzatish протоколи")
    : mode === "edit" ? (isRu ? "Редактировать протокол" : "Протокол tahrirlash")
    : (isRu ? "Новый протокол" : "Yangi протокол");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6" data-testid="dialog-protocol">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-blue)]">
            {mode === "amend" ? <Pencil className="w-4 h-4" /> : <Gavel className="w-4 h-4" />}
            {heading}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">{isRu ? "Заголовок протокола" : "Протокол sarlavhasi"} *</Label>
            <Input
              className="mt-1"
              placeholder={isRu ? "Тема совещания..." : "Majlis mavzusi..."}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              data-testid="input-protocol-title"
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Совет" : "Kengash"}</Label>
            <select
              className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
              value={form.councilId}
              onChange={e => setForm(p => ({ ...p, councilId: e.target.value }))}
              data-testid="select-protocol-council"
            >
              <option value="">{isRu ? "— Не выбрано —" : "— Tanlanmagan —"}</option>
              {councils.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  value={form.chairpersonId}
                  onChange={e => setForm(p => ({ ...p, chairpersonId: e.target.value }))}
                  data-testid="select-protocol-chairperson"
                >
                  <option value="">{isRu ? "— Выбрать —" : "— Tanlash —"}</option>
                  {users.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label className="text-xs">{isRu ? "Секретарь" : "Kotib"}</Label>
              {usersLoading ? (
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <EPLoader className="w-3 h-3" />
                  {isRu ? "Загрузка..." : "Yuklanmoqda..."}
                </div>
              ) : (
                <select
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.secretaryId}
                  onChange={e => setForm(p => ({ ...p, secretaryId: e.target.value }))}
                  data-testid="select-protocol-secretary"
                >
                  <option value="">{isRu ? "— Выбрать —" : "— Tanlash —"}</option>
                  {users.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Повестка дня" : "Kun tartibi"}</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder={isRu ? "Вопросы к обсуждению..." : "Muhokama qilinadigan masalalar..."}
              value={form.agenda}
              onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))}
              data-testid="input-protocol-agenda"
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Решения" : "Qarorlar"}</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder={isRu ? "Принятые решения..." : "Qabul qilingan qarorlar..."}
              value={form.decisions}
              onChange={e => setForm(p => ({ ...p, decisions: e.target.value }))}
              data-testid="input-protocol-decisions"
            />
          </div>
          <div>
            <Label className="text-xs">{isRu ? "Особое мнение (необязательно)" : "Alohida fikr (ixtiyoriy)"}</Label>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder={isRu ? "Несогласие участника..." : "Ishtirokchining e'tirozi..."}
              value={form.dissentingOpinion}
              onChange={e => setForm(p => ({ ...p, dissentingOpinion: e.target.value }))}
              data-testid="input-protocol-dissent"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? "Отмена" : "Bekor qilish"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="btn-submit-protocol">
            {isPending
              ? <EPLoader className="w-3.5 h-3.5 mr-1.5" />
              : <Gavel className="w-3.5 h-3.5 mr-1.5" />}
            {isRu ? "Сохранить" : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
