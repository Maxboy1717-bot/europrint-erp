/**
 * SendKanbanTaskDialog — item #106: vision-1000-answers/05-director.md #37
 * ("Director karta-agregatdan to'g'ridan Kanban vazifa yuboradi — 'vazifa yubor'
 * tugma"). Reuses the same POST /api/kanban/cards board+first-column pattern
 * already proven by CreateTaskModal.tsx (chat "xabardan task yaratish").
 */
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";

interface KanbanBoardLite { id: string | number; name: string; }
interface KanbanColumnLite { id: string | number; name: string; sort_order?: number; }
interface KanbanBoardDetail { id: string | number; name: string; columns?: KanbanColumnLite[]; }

interface Props {
  open: boolean;
  onClose: () => void;
  defaultTitle: string;
  defaultDescription?: string;
}

export function SendKanbanTaskDialog({ open, onClose, defaultTitle, defaultDescription }: Props) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? "");
  const [boardId, setBoardId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { data: boards = [] } = useQuery<KanbanBoardLite[]>({
    queryKey: ["/api/kanban/boards"],
    queryFn: () => apiRequest("GET", "/api/kanban/boards").then((r: unknown) => (Array.isArray(r) ? r as KanbanBoardLite[] : [])),
    enabled: open,
  });

  const { data: boardDetail } = useQuery<KanbanBoardDetail | null>({
    queryKey: [`/api/kanban/boards/${boardId}`],
    queryFn: () => apiRequest("GET", `/api/kanban/boards/${boardId}`).then((r: unknown) => r as KanbanBoardDetail),
    enabled: open && !!boardId,
  });
  const firstColumnId = Array.isArray(boardDetail?.columns) && boardDetail!.columns!.length > 0
    ? String(boardDetail!.columns![0].id)
    : "";

  useEffect(() => {
    if (open) { setTitle(defaultTitle); setDescription(defaultDescription ?? ""); }
  }, [open, defaultTitle, defaultDescription]);
  useEffect(() => {
    if (open && !boardId && boards.length > 0) setBoardId(String(boards[0].id));
  }, [open, boards, boardId]);

  const handleCreate = async () => {
    if (!title.trim() || !boardId || !firstColumnId) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/kanban/cards", {
        title: title.trim(),
        description: description.trim() || undefined,
        boardId,
        columnId: firstColumnId,
        priority: "high",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban"] });
      toast({ title: t("taskCreated"), description: title.trim() });
      onClose();
    } catch {
      toast({ title: t("xato"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6" data-testid="dialog-send-kanban-task">
        <DialogHeader>
          <DialogTitle>{t("vazifaYuborish")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="kanban-task-title" className="text-xs">{t("sarlavha")}</Label>
            <Input
              id="kanban-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
              data-testid="input-kanban-task-title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kanban-task-desc" className="text-xs">{t("tavsif")}</Label>
            <Textarea
              id="kanban-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kanban-task-board" className="text-xs">{t("doska")}</Label>
            <select
              id="kanban-task-board"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
              data-testid="select-kanban-task-board"
            >
              {(Array.isArray(boards) ? boards : []).map((b) => (
                <option key={String(b.id)} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
            {boardId && !firstColumnId && (
              <p className="text-xs text-destructive">{t("doskadaUstunYoq")}</p>
            )}
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
            data-testid="button-confirm-send-kanban-task"
          >
            {loading ? t("creating") : t("vazifaYuborish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
