import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Calendar, Trash2,
  Clock, X, Play,
  CheckCircle2, Flag, Check, CheckCheck
} from "lucide-react";
import { format } from "date-fns";
import type { KanbanColumn, KanbanCard, TaskFile, TaskTag } from "@shared/schema";
import {
  type CardWithOwner,
  type ChatMessageWithUser,
  type ChecklistWithItems,
  type ObserverWithUser,
  type CoExecutorWithUser,
  type ResultWithFiles,
  type Employee,
  T,
  TAG_COLORS,
  PRIORITY_CONFIG,
  UZBEK_MONTHS,
} from "./kanban-types";
import { MainTabContent } from "./detail/MainTabContent";
import { ChecklistTabContent } from "./detail/ChecklistTabContent";
import { ResultsTabContent } from "./detail/ResultsTabContent";
import { FilesTabContent } from "./detail/FilesTabContent";
import { ChatPanel } from "./detail/ChatPanel";

export function TaskDetailSheet({
  card,
  open,
  onOpenChange,
  employees,
  columns,
  onUpdate,
  onDelete,
  t,
}: {
  card: CardWithOwner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  columns: KanbanColumn[];
  onUpdate: (data: Partial<KanbanCard>) => void;
  onDelete: () => void;
  t: typeof T.uz;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("main");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState<Record<string, string>>({});
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});
  const [newTagName, setNewTagName] = useState("");
  const [resultText, setResultText] = useState("");
  const [taskRating, setTaskRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionReport, setCompletionReport] = useState("");

  const { data: checklists = [], refetch: refetchChecklists } = useQuery<ChecklistWithItems[]>({
    queryKey: ["/api/kanban/cards", card.id, "checklists"],
    enabled: open,
  });

  const { data: chatMessages = [], refetch: refetchChat } = useQuery<ChatMessageWithUser[]>({
    queryKey: ["/api/kanban/cards", card.id, "chat"],
    enabled: open,
  });

  const { data: files = [], refetch: refetchFiles } = useQuery<TaskFile[]>({
    queryKey: ["/api/kanban/cards", card.id, "files"],
    enabled: open,
  });

  const { data: results = [], refetch: refetchResults } = useQuery<ResultWithFiles[]>({
    queryKey: ["/api/kanban/cards", card.id, "results"],
    enabled: open,
  });

  const { data: tags = [], refetch: refetchTags } = useQuery<TaskTag[]>({
    queryKey: ["/api/kanban/cards", card.id, "tags"],
    enabled: open,
  });

  const { data: observers = [], refetch: refetchObservers } = useQuery<ObserverWithUser[]>({
    queryKey: ["/api/kanban/cards", card.id, "observers"],
    enabled: open,
  });

  const { data: coExecutors = [], refetch: refetchCoExecutors } = useQuery<CoExecutorWithUser[]>({
    queryKey: ["/api/kanban/cards", card.id, "co-executors"],
    enabled: open,
  });

  const { data: allCards = [] } = useQuery<CardWithOwner[]>({
    queryKey: ["/api/kanban/boards", card.boardId, "cards"],
    enabled: open,
  });

  const { data: projects = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/kanban/projects"],
    enabled: open,
  });

  const { data: deals = [] } = useQuery<{id: string; name: string; amount: number}[]>({
    queryKey: ["/api/crm/deals/list"],
    enabled: open,
  });

  const addChecklistMutation = useMutation({
    mutationFn: async (title: string) => {
      await apiRequest("POST", `/api/kanban/cards/${card.id}/checklists`, { cardId: card.id, title, sortOrder: checklists.length });
    },
    onSuccess: () => { refetchChecklists(); setNewChecklistTitle(""); },
  });

  const addChecklistItemMutation = useMutation({
    mutationFn: async ({ checklistId, title }: { checklistId: string; title: string }) => {
      await apiRequest("POST", `/api/kanban/checklists/${checklistId}/items`, { checklistId, title, sortOrder: 0 });
    },
    onSuccess: (_, variables) => { refetchChecklists(); setNewChecklistItemTitle(prev => ({ ...prev, [variables.checklistId]: "" })); },
  });

  const toggleChecklistItemMutation = useMutation({
    mutationFn: async (itemId: string) => { await apiRequest("PUT", `/api/kanban/checklist-items/${itemId}/toggle`, {}); },
    onSuccess: () => refetchChecklists(),
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (checklistId: string) => { await apiRequest("DELETE", `/api/kanban/checklists/${checklistId}`); },
    onSuccess: () => refetchChecklists(),
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ message, files }: { message: string; files?: File[] }) => {
      const response = await apiRequest("POST", `/api/kanban/cards/${card.id}/chat`, { cardId: card.id, message, messageType: "user" });
      const messageData = response;
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await fetch(`/api/kanban/chat-messages/${messageData.id}/files`, { method: 'POST', body: formData });
        }
      }
      return messageData;
    },
    onSuccess: () => { refetchChat(); setNewChatMessage(""); setChatFiles([]); },
  });

  const addTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const colorIdx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TAG_COLORS.length;
      await apiRequest("POST", `/api/kanban/cards/${card.id}/tags`, { name, color: TAG_COLORS[colorIdx] });
    },
    onSuccess: () => { refetchTags(); setNewTagName(""); },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => { await apiRequest("DELETE", `/api/kanban/cards/${card.id}/tags/${tagId}`); },
    onSuccess: () => refetchTags(),
  });

  const addObserverMutation = useMutation({
    mutationFn: async (userId: string) => { await apiRequest("POST", `/api/kanban/cards/${card.id}/observers`, { userId }); },
    onSuccess: () => refetchObservers(),
  });

  const removeObserverMutation = useMutation({
    mutationFn: async (observerId: string) => { await apiRequest("DELETE", `/api/kanban/cards/${card.id}/observers/${observerId}`); },
    onSuccess: () => refetchObservers(),
  });

  const addCoExecutorMutation = useMutation({
    mutationFn: async (userId: string) => { await apiRequest("POST", `/api/kanban/cards/${card.id}/co-executors`, { userId }); },
    onSuccess: () => refetchCoExecutors(),
  });

  const removeCoExecutorMutation = useMutation({
    mutationFn: async (coExecutorId: string) => { await apiRequest("DELETE", `/api/kanban/cards/${card.id}/co-executors/${coExecutorId}`); },
    onSuccess: () => refetchCoExecutors(),
  });

  const addResultMutation = useMutation({
    mutationFn: async (description: string) => {
      await apiRequest("POST", `/api/kanban/cards/${card.id}/results`, { cardId: card.id, description });
    },
    onSuccess: () => { refetchResults(); setResultText(""); toast({ title: "Natija qo'shildi" }); },
  });

  const uploadResultFileMutation = useMutation({
    mutationFn: async ({ resultId, file }: { resultId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/kanban/results/${resultId}/files`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => { refetchResults(); toast({ title: "Fayl biriktirildi" }); },
    onError: () => { toast({ title: "Fayl biriktirishda xatolik", variant: "destructive" }); },
  });

  const deleteResultFileMutation = useMutation({
    mutationFn: async (fileId: string) => { await apiRequest("DELETE", `/api/kanban/result-files/${fileId}`); },
    onSuccess: () => { refetchResults(); toast({ title: "Fayl o'chirildi" }); },
  });

  const acceptTaskMutation = useMutation({
    mutationFn: async () => { await apiRequest("PUT", `/api/kanban/cards/${card.id}/accept`, {}); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", card.boardId, "cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/task-stats"] });
      toast({ title: "Vazifa qabul qilindi" });
    },
    onError: () => { toast({ title: "Vazifani qabul qilishda xatolik yuz berdi", variant: "destructive" }); },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (report: string) => { await apiRequest("PUT", `/api/kanban/cards/${card.id}/complete`, { completionReport: report }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", card.boardId, "cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/task-stats"] });
      setShowCompleteDialog(false);
      setCompletionReport("");
      toast({ title: "Vazifa yakunlandi" });
    },
    onError: () => { toast({ title: "Vazifani yakunlashda xatolik yuz berdi", variant: "destructive" }); },
  });

  const startTimeMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/kanban/cards/${card.id}/time-entries/start`, {}); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] }); },
  });

  const stopTimeMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/kanban/cards/${card.id}/time-entries/stop`, {}); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] }); },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/kanban/cards/${card.id}/files`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => { refetchFiles(); toast({ title: "Fayl yuklandi" }); },
    onError: () => { toast({ title: "Fayl yuklashda xatolik", variant: "destructive" }); },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => { await apiRequest("DELETE", `/api/kanban/files/${fileId}`); },
    onSuccess: () => { refetchFiles(); toast({ title: "Fayl o'chirildi" }); },
  });

  const createTaskFromMessage = async (message: ChatMessageWithUser) => {
    try {
      await apiRequest("POST", `/api/kanban/cards`, {
        title: message.message.substring(0, 100),
        columnId: columns[0]?.id,
        boardId: card.boardId,
        description: `Xabardan yaratildi:\n\n${message.message}\n\n-- ${message.user?.fullName || 'Foydalanuvchi'}, ${format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}`,
        priority: "normal",
        sortOrder: 0,
        parentCardId: card.id,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      toast({ title: "Vazifa yaratildi" });
    } catch (error) {
      toast({ title: "Xatolik", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach(file => { uploadFileMutation.mutate(file); });
    }
    e.target.value = '';
  };

  const priorityConfig = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col">
        <SheetHeader className="p-4 border-b flex-shrink-0">
          <SheetTitle className="sr-only">Vazifa tafsilotlari</SheetTitle>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-mono" data-testid="text-task-id">#{(card.id ?? "").slice(-6)}</span>
                <Input
                  defaultValue={card.title}
                  className="text-lg font-semibold border-none px-0 focus-visible:ring-0"
                  onBlur={(e) => e.target.value !== card.title && onUpdate({ title: e.target.value })}
                  data-testid="input-task-title"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={priorityConfig.color}>{t.priority[card.priority as keyof typeof t.priority] || t.priority.normal}</Badge>
                {card.dueDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(card.dueDate), "dd.MM.yyyy")}
                  </Badge>
                )}
                {card.createdAt && (
                  <span className="text-xs text-muted-foreground" data-testid="text-created-date">
                    Yaratilgan: {(() => {
                      const d = new Date(card.createdAt);
                      return `${d.getDate()} ${UZBEK_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
                    })()}
                  </span>
                )}
                {card.owner && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={card.owner.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[8px]">{card.owner.fullName.split(" ").map(n => n[0]).join("").substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{card.owner.fullName}</span>
                  </div>
                )}
                {card.source === 'telegram' && (
                  <Badge variant="outline" className="text-xs text-blue-500 border-blue-500">Telegram</Badge>
                )}
                {card.acceptedAt && (
                  <Badge variant="outline" className="text-xs text-green-500 border-green-500">
                    <Check className="h-3 w-3 mr-1" />Qabul qilindi
                  </Badge>
                )}
                {card.completedAt && (
                  <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500">
                    <CheckCheck className="h-3 w-3 mr-1" />Bajarildi
                  </Badge>
                )}
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Yopish" onClick={() => onOpenChange(false)} data-testid="button-close-detail">
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Yopish</TooltipContent>
            </Tooltip>
          </div>
        </SheetHeader>

        {!card.completedAt && (
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            {!card.acceptedAt ? (
              <Button variant="outline" size="sm" onClick={() => acceptTaskMutation.mutate()} disabled={acceptTaskMutation.isPending} data-testid="button-accept-task" className="text-green-600 hover:text-green-700 border-green-500">
                <Check className="h-4 w-4 mr-1" />Qabul qilish
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => setShowCompleteDialog(true)} disabled={completeTaskMutation.isPending} data-testid="button-complete-task" className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCheck className="h-4 w-4 mr-1" />Bajarildi deb belgilash
              </Button>
            )}
          </div>
        )}

        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vazifani yakunlash</DialogTitle>
              <DialogDescription>Vazifa bajarilishi haqida qisqacha hisobot yozing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea value={completionReport} onChange={(e) => setCompletionReport(e.target.value)} placeholder="Bajarilgan ishlar haqida..." className="min-h-[120px]" data-testid="input-completion-report" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Bekor qilish</Button>
              <Button onClick={() => { completeTaskMutation.mutate(completionReport); setShowCompleteDialog(false); setCompletionReport(""); }} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-confirm-complete">
                Yakunlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 border-r overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b px-4">
                <TabsTrigger value="main">{t.tabs.main}</TabsTrigger>
                <TabsTrigger value="checklist">{t.tabs.checklist}</TabsTrigger>
                <TabsTrigger value="results">{t.tabs.results}</TabsTrigger>
                <TabsTrigger value="files">{t.tabs.files}</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 p-4">
                <TabsContent value="main" className="m-0">
                  <MainTabContent
                    card={card}
                    employees={employees}
                    observers={observers}
                    coExecutors={coExecutors}
                    tags={tags}
                    allCards={allCards}
                    projects={projects}
                    deals={deals}
                    onUpdate={onUpdate}
                    onAddObserver={(userId) => addObserverMutation.mutate(userId)}
                    onRemoveObserver={(observerId) => removeObserverMutation.mutate(observerId)}
                    onAddCoExecutor={(userId) => addCoExecutorMutation.mutate(userId)}
                    onRemoveCoExecutor={(coExecutorId) => removeCoExecutorMutation.mutate(coExecutorId)}
                    onAddTag={(name) => addTagMutation.mutate(name)}
                    onRemoveTag={(tagId) => removeTagMutation.mutate(tagId)}
                    onStartTime={() => startTimeMutation.mutate()}
                    onStopTime={() => stopTimeMutation.mutate()}
                    newTagName={newTagName}
                    onNewTagNameChange={setNewTagName}
                    showHiddenFields={showHiddenFields}
                    onToggleHiddenFields={() => setShowHiddenFields(!showHiddenFields)}
                    taskRating={taskRating}
                    onTaskRatingChange={setTaskRating}
                    hoveredRating={hoveredRating}
                    onHoveredRatingChange={setHoveredRating}
                    t={t}
                  />
                </TabsContent>

                <TabsContent value="checklist" className="m-0">
                  <ChecklistTabContent
                    checklists={checklists}
                    newChecklistTitle={newChecklistTitle}
                    onNewChecklistTitleChange={setNewChecklistTitle}
                    onAddChecklist={(title) => addChecklistMutation.mutate(title)}
                    expandedChecklists={expandedChecklists}
                    onToggleExpanded={(id, val) => setExpandedChecklists(p => ({ ...p, [id]: val }))}
                    newChecklistItemTitle={newChecklistItemTitle}
                    onNewItemTitleChange={(checklistId, val) => setNewChecklistItemTitle(prev => ({ ...prev, [checklistId]: val }))}
                    onAddItem={(checklistId, title) => addChecklistItemMutation.mutate({ checklistId, title })}
                    onToggleItem={(itemId) => toggleChecklistItemMutation.mutate(itemId)}
                    onDeleteChecklist={(checklistId) => deleteChecklistMutation.mutate(checklistId)}
                    isDeleting={deleteChecklistMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="results" className="m-0">
                  <ResultsTabContent
                    results={results}
                    resultText={resultText}
                    onResultTextChange={setResultText}
                    onAddResult={(text) => addResultMutation.mutate(text)}
                    onUploadResultFile={(resultId, file) => uploadResultFileMutation.mutate({ resultId, file })}
                    onDeleteResultFile={(fileId) => deleteResultFileMutation.mutate(fileId)}
                    isUploadingResultFile={uploadResultFileMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="files" className="m-0">
                  <FilesTabContent
                    files={files}
                    cardId={card.id ?? ""}
                    onFileSelect={handleFileSelect}
                    onDeleteFile={(fileId) => deleteFileMutation.mutate(fileId)}
                    isUploading={uploadFileMutation.isPending}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          <ChatPanel
            chatMessages={chatMessages}
            newChatMessage={newChatMessage}
            onNewChatMessageChange={setNewChatMessage}
            onSendMessage={(data) => sendChatMutation.mutate(data)}
            isSending={sendChatMutation.isPending}
            onCreateTaskFromMessage={createTaskFromMessage}
            chatFiles={chatFiles}
            onChatFilesChange={setChatFiles}
            t={t}
          />
        </div>

        <div className="p-4 border-t flex-shrink-0 space-y-3">
          <div className="flex gap-2">
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={() => startTimeMutation.mutate()} data-testid="button-start-task">
              <Play className="h-4 w-4 mr-2" />Boshlash
            </Button>
            <Button className="flex-1" onClick={() => { toast({ title: "Vazifa yakunlandi!" }); }} data-testid="button-complete-task-footer">
              <CheckCircle2 className="h-4 w-4 mr-2" />Yakunlash
            </Button>
          </div>
          <div className="flex justify-between gap-2">
            <DeleteConfirmDialog title="Vazifani o'chirish" description="Bu amalni qaytarib bo'lmaydi. Vazifa butunlay o'chiriladi." onConfirm={onDelete} isPending={false}>
              <Button variant="destructive" data-testid="button-delete-task">
                <Trash2 className="h-4 w-4 mr-2" />{t.actions.delete}
              </Button>
            </DeleteConfirmDialog>
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-sheet">
              {t.actions.save}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}