/**
 * @module CreateTaskModal
 * @description "Xabardan Task Yaratish" — chat xabaridan HAQIQIY Kanban karta
 *   yaratadi (owner 2026-07-13 qarori: "Kanban karta + xabar bog'lami").
 *   Oqim: (1) POST /api/kanban/cards → mavjud Kanban modulida karta (mas'ul
 *   xodim = owner_user_id, foydalanuvchi tanlagan doska+1-ustun); (2) POST
 *   /api/chat/message-tasks → chat_message_tasks'ga xabar↔karta bog'lami
 *   (traceability). Yangi vazifa mas'ul xodimning "Bog'liq-vazifalar" tab'ida
 *   owner_user_id bo'yicha ko'rinadi.
 */

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@/store/chatStore";
import { CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from '@/lib/i18n';
interface Employee {
  id: string;
  fullName: string;
  employeeId?: string;
}

interface KanbanBoardLite { id: string | number; name: string; }
interface KanbanColumnLite { id: string | number; name: string; sort_order?: number; }
interface KanbanBoardDetail { id: string | number; name: string; columns?: KanbanColumnLite[]; }

interface Props {
  message: ChatMessage | null;
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({message, open, onClose }: Props) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [title, setTitle] = useState(message?.content?.slice(0, 100) ?? "");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [boardId, setBoardId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/chat/employees"],
    queryFn: () => apiRequest("GET", "/api/chat/employees").then((r: unknown) => r as Employee[]),
    enabled: open,
  });

  // Mavjud Kanban doskalari (Buyurtmalar/Sifat/Ishlab chiqarish/Dizayn …).
  // Vazifa qaysi doskaga tushishini foydalanuvchi tanlaydi (owner qarori).
  const { data: boards = [] } = useQuery<KanbanBoardLite[]>({
    queryKey: ["/api/kanban/boards"],
    queryFn: () => apiRequest("GET", "/api/kanban/boards").then((r: unknown) => (Array.isArray(r) ? r as KanbanBoardLite[] : [])),
    enabled: open,
  });

  // Tanlangan doska tafsiloti — 1-ustun (sort_order ASC) kartaning column_id'si bo'ladi.
  const { data: boardDetail } = useQuery<KanbanBoardDetail | null>({
    queryKey: [`/api/kanban/boards/${boardId}`],
    queryFn: () => apiRequest("GET", `/api/kanban/boards/${boardId}`).then((r: unknown) => r as KanbanBoardDetail),
    enabled: open && !!boardId,
  });
  const firstColumnId = Array.isArray(boardDetail?.columns) && boardDetail!.columns!.length > 0
    ? String(boardDetail!.columns![0].id)
    : "";

  // Modal ochilganda sarlavhani xabardan to'ldirish + birinchi doskani default tanlash.
  useEffect(() => {
    if (open) setTitle(message?.content?.slice(0, 100) ?? "");
  }, [open, message]);
  useEffect(() => {
    if (open && !boardId && boards.length > 0) setBoardId(String(boards[0].id));
  }, [open, boards, boardId]);

  const filtered = search
    ? (Array.isArray(employees) ? employees : []).filter((e: Employee) => e.fullName.toLowerCase().includes(search.toLowerCase()))
    : employees;

  const reset = () => { setAssignedTo(""); setDueDate(""); setSearch(""); setBoardId(""); };

  const handleCreate = async () => {
    if (!message || !title.trim()) return;
    if (!boardId || !firstColumnId) {
      toast({ title: t("doskaTanlang"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // (1) Mavjud Kanban modulida haqiqiy karta yaratamiz.
      const card = await apiRequest("POST", "/api/kanban/cards", {
        title: title.trim(),
        boardId,
        columnId: firstColumnId,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        priority: "medium",
      }) as { id: string | number };

      // (2) Xabar↔karta bog'lami (traceability). Bog'lam ikkilamchi — karta
      // yaratilgan bo'lsa vazifa muvaffaqiyatli hisoblanadi.
      try {
        await apiRequest("POST", "/api/chat/message-tasks", {
          roomId: message.roomId,
          messageId: message.id,
          title: title.trim(),
          assignedTo: assignedTo || undefined,
          dueDate: dueDate || undefined,
          kanbanCardId: card.id,
        });
      } catch { /* bog'lam ikkilamchi — karta baribir yaratildi */ }

      toast({ title: t("taskCreated"), description: title.trim() });
      reset();
      onClose();
    } catch {
      toast({ title: t("xato"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            {t("xabardanTaskYaratish")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {message && (
            <div className="bg-muted/30 rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border/50">
              <p className="font-medium text-foreground/80 mb-0.5">{t("asosXabar")}</p>
              <p className="line-clamp-2">{message.content}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs">{t("sarlavha")}</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('taskSarlavhasi')}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-board" className="text-xs">{t("doska")}</Label>
            <select
              id="task-board"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {(Array.isArray(boards) ? boards : []).map((b) => (
                <option key={String(b.id)} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
            {boardId && !firstColumnId && (
              <p className="text-xs text-destructive">{t("doskadaUstunYoq")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("masulXodim")}</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("xodimQidirish")}
              className="text-sm mb-1"
            />
            {search && filtered.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                {filtered.slice(0, 6).map((emp: Employee) => (
                  <button
                    key={emp.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors text-sm ${
                      assignedTo === emp.id ? "bg-primary/10 font-medium" : ""
                    }`}
                    onClick={() => {
                      setAssignedTo(emp.id);
                      setSearch(emp.fullName);
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
                      {emp.fullName[0]}
                    </div>
                    {emp.fullName}
                    {emp.employeeId && (
                      <span className="text-xs text-muted-foreground ml-auto">{emp.employeeId}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {assignedTo && (
              <p className="text-xs text-primary">{t("selected")}: {(Array.isArray(employees) ? employees : []).find((e: Employee) => e.id === assignedTo)?.fullName ?? assignedTo}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due" className="text-xs">{t("muddat")}</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !title.trim() || !boardId || !firstColumnId}
            className="text-sm"
          >
            {loading ? t("creating") : t("createTask")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
