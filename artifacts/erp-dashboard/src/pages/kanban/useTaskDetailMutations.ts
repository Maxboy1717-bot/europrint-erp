/**
 * @module useTaskDetailMutations
 * @description Custom hook that encapsulates every useMutation used by
 * TaskDetailSheet.  Keeps the orchestrator component under the 300-line limit
 * while co-locating related mutation logic.
 */

import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TAG_COLORS } from "./kanban-types";
import type { CardWithOwner, ChatMessageWithUser } from "./kanban-types";
import type { KanbanColumn } from "@shared/schema";

interface RefetchMap {
  refetchChecklists:  () => void;
  refetchChat:        () => void;
  refetchFiles:       () => void;
  refetchResults:     () => void;
  refetchTags:        () => void;
  refetchObservers:   () => void;
  refetchCoExecutors: () => void;
}

interface StateSetters {
  setNewChecklistTitle:     (v: string) => void;
  setNewChecklistItemTitle: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  setNewChatMessage:        (v: string) => void;
  setChatFiles:             (v: File[]) => void;
  setNewTagName:            (v: string) => void;
  setResultText:            (v: string) => void;
  setShowCompleteDialog:    (v: boolean) => void;
  setCompletionReport:      (v: string) => void;
}

/**
 * Returns all mutation objects needed by TaskDetailSheet.
 * Receives refetch callbacks and state setters so the hook stays stateless.
 */
export function useTaskDetailMutations(
  card: CardWithOwner,
  columns: KanbanColumn[],
  checklistsLength: number,
  refetch: RefetchMap,
  setters: StateSetters,
) {
  const { toast } = useToast();
  const cid = card.id;

  // ── Checklist mutations ─────────────────────────────────────────────────
  const addChecklistMutation = useMutation({
    mutationFn: async (title: string) => {
      await apiRequest("POST", `/api/kanban/cards/${cid}/checklists`, { cardId: cid, title, sortOrder: checklistsLength });
    },
    onSuccess: () => { refetch.refetchChecklists(); setters.setNewChecklistTitle(""); },
  });
  const addChecklistItemMutation = useMutation({
    mutationFn: async ({ checklistId, title }: { checklistId: string; title: string }) => {
      await apiRequest("POST", `/api/kanban/checklists/${checklistId}/items`, { checklistId, title, sortOrder: 0 });
    },
    onSuccess: (_, v) => {
      refetch.refetchChecklists();
      setters.setNewChecklistItemTitle(p => ({ ...p, [v.checklistId]: "" }));
    },
  });
  const toggleChecklistItemMutation = useMutation({
    mutationFn: async (itemId: string) => { await apiRequest("PUT", `/api/kanban/checklist-items/${itemId}/toggle`, {}); },
    onSuccess: () => refetch.refetchChecklists(),
  });
  const deleteChecklistMutation = useMutation({
    mutationFn: async (checklistId: string) => { await apiRequest("DELETE", `/api/kanban/checklists/${checklistId}`); },
    onSuccess: () => refetch.refetchChecklists(),
  });

  // ── Chat mutation ───────────────────────────────────────────────────────
  const sendChatMutation = useMutation({
    mutationFn: async ({ message, files }: { message: string; files?: File[] }) => {
      const data = await apiRequest("POST", `/api/kanban/cards/${cid}/chat`, { cardId: cid, message, messageType: "user" }) as { id: string };
      if (files?.length) {
        for (const f of files) {
          const fd = new FormData(); fd.append("file", f);
          await apiRequest('POST', `/api/kanban/chat-messages/${data.id}/files`);
        }
      }
      return data;
    },
    onSuccess: () => { refetch.refetchChat(); setters.setNewChatMessage(""); setters.setChatFiles([]); },
  });

  // ── Tag mutations ───────────────────────────────────────────────────────
  const addTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % TAG_COLORS.length;
      await apiRequest("POST", `/api/kanban/cards/${cid}/tags`, { name, color: TAG_COLORS[idx] });
    },
    onSuccess: () => { refetch.refetchTags(); setters.setNewTagName(""); },
  });
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => { await apiRequest("DELETE", `/api/kanban/cards/${cid}/tags/${tagId}`); },
    onSuccess: () => refetch.refetchTags(),
  });

  // ── Observer / co-executor mutations ────────────────────────────────────
  const addObserverMutation     = useMutation({ mutationFn: async (userId: string) => { await apiRequest("POST",   `/api/kanban/cards/${cid}/observers`,       { userId }); }, onSuccess: () => refetch.refetchObservers() });
  const removeObserverMutation  = useMutation({ mutationFn: async (id: string)     => { await apiRequest("DELETE", `/api/kanban/cards/${cid}/observers/${id}`);    }, onSuccess: () => refetch.refetchObservers() });
  const addCoExecutorMutation   = useMutation({ mutationFn: async (userId: string) => { await apiRequest("POST",   `/api/kanban/cards/${cid}/co-executors`,    { userId }); }, onSuccess: () => refetch.refetchCoExecutors() });
  const removeCoExecutorMutation = useMutation({ mutationFn: async (id: string)    => { await apiRequest("DELETE", `/api/kanban/cards/${cid}/co-executors/${id}`); }, onSuccess: () => refetch.refetchCoExecutors() });

  // ── Result mutations ────────────────────────────────────────────────────
  const addResultMutation = useMutation({
    mutationFn: async (description: string) => {
      await apiRequest("POST", `/api/kanban/cards/${cid}/results`, { cardId: cid, description });
    },
    onSuccess: () => { refetch.refetchResults(); setters.setResultText(""); toast({ title: "Natija qo'shildi" }); },
  });
  const uploadResultFileMutation = useMutation({
    mutationFn: async ({ resultId, file }: { resultId: string; file: File }) => {
      const fd = new FormData(); fd.append("file", file);
      return await apiRequest('POST', `/api/kanban/results/${resultId}/files`);
    },
    onSuccess: () => { refetch.refetchResults(); toast({ title: "Fayl biriktirildi" }); },
    onError:   () => { toast({ title: "Fayl biriktirishda xatolik", variant: "destructive" }); },
  });
  const deleteResultFileMutation = useMutation({
    mutationFn: async (fileId: string) => { await apiRequest("DELETE", `/api/kanban/result-files/${fileId}`); },
    onSuccess:  () => { refetch.refetchResults(); toast({ title: "Fayl o'chirildi" }); },
  });

  // ── Task lifecycle mutations ─────────────────────────────────────────────
  const acceptTaskMutation = useMutation({
    mutationFn: async () => { await apiRequest("PUT", `/api/kanban/cards/${cid}/accept`, {}); },
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] }); queryClient.invalidateQueries({ queryKey: ["/api/kanban/task-stats"] }); toast({ title: "Vazifa qabul qilindi" }); },
    onError:    () => { toast({ title: "Qabul qilishda xatolik", variant: "destructive" }); },
  });
  const completeTaskMutation = useMutation({
    mutationFn: async (report: string) => { await apiRequest("PUT", `/api/kanban/cards/${cid}/complete`, { completionReport: report }); },
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] }); queryClient.invalidateQueries({ queryKey: ["/api/kanban/task-stats"] }); setters.setShowCompleteDialog(false); setters.setCompletionReport(""); toast({ title: "Vazifa yakunlandi" }); },
    onError:    () => { toast({ title: "Yakunlashda xatolik", variant: "destructive" }); },
  });
  const startTimeMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/kanban/cards/${cid}/time-entries/start`, {}); },
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] }); toast({ title: "Vaqt kuzatuvi boshlandi" }); },
    onError:    () => { toast({ title: "Boshlashda xatolik", variant: "destructive" }); },
  });
  const stopTimeMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/kanban/cards/${cid}/time-entries/stop`, {}); },
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] }); toast({ title: "Vaqt kuzatuvi to'xtatildi" }); },
    onError:    () => { toast({ title: "To'xtatishda xatolik", variant: "destructive" }); },
  });

  // ── File mutations ───────────────────────────────────────────────────────
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData(); fd.append("file", file);
      return await apiRequest('POST', `/api/kanban/cards/${cid}/files`);
    },
    onSuccess: () => { refetch.refetchFiles(); toast({ title: "Fayl yuklandi" }); },
    onError:   () => { toast({ title: "Fayl yuklashda xatolik", variant: "destructive" }); },
  });
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => { await apiRequest("DELETE", `/api/kanban/files/${fileId}`); },
    onSuccess:  () => { refetch.refetchFiles(); toast({ title: "Fayl o'chirildi" }); },
  });

  // ── createTaskFromMessage helper ─────────────────────────────────────────
  const createTaskFromMessage = async (message: ChatMessageWithUser) => {
    try {
      await apiRequest("POST", "/api/kanban/cards", {
        title:        message.message.substring(0, 100),
        columnId:     columns[0]?.id,
        boardId:      card.boardId,
        description:  `Xabardan yaratildi:\n\n${message.message}\n\n-- ${message.user?.fullName || "Foydalanuvchi"}, ${format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}`,
        priority:     "normal",
        sortOrder:    0,
        parentCardId: cid,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      toast({ title: "Vazifa yaratildi" });
    } catch { toast({ title: "Xatolik", variant: "destructive" }); }
  };

  return {
    addChecklistMutation, addChecklistItemMutation, toggleChecklistItemMutation, deleteChecklistMutation,
    sendChatMutation,
    addTagMutation, removeTagMutation,
    addObserverMutation, removeObserverMutation,
    addCoExecutorMutation, removeCoExecutorMutation,
    addResultMutation, uploadResultFileMutation, deleteResultFileMutation,
    acceptTaskMutation, completeTaskMutation,
    startTimeMutation, stopTimeMutation,
    uploadFileMutation, deleteFileMutation,
    createTaskFromMessage,
  };
}
