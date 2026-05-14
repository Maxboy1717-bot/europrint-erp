/**
 * @module TaskDetailSheet
 * @description Orchestrator component for the task-detail side-panel.
 * Owns data-fetching (useQuery) and local UI state; delegates mutations to
 * useTaskDetailMutations and rendering to:
 *   - TaskDetailSheetHeader  – sticky title/badge header
 *   - TaskDetailSheetActions – bottom action bar + completion dialog
 *   - detail/*TabContent     – individual tab bodies
 *   - TimeTrackingWidget     – inline timer widget
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
} from "./kanban-types";
import { getProp, getPersonName } from "./kanban-utils";
import { MainTabContent }      from "./detail/MainTabContent";
import { ChecklistTabContent } from "./detail/ChecklistTabContent";
import { ResultsTabContent }   from "./detail/ResultsTabContent";
import { FilesTabContent }     from "./detail/FilesTabContent";
import { ChatPanel }           from "./detail/ChatPanel";
import { TimeTrackingWidget }  from "./TimeTrackingWidget";
import { TaskDetailSheetHeader }   from "./TaskDetailSheetHeader";
import { TaskDetailSheetActions }  from "./TaskDetailSheetActions";
import { useTaskDetailMutations }  from "./useTaskDetailMutations";

// ─────────────────────────────────────────────────────────────────────────────
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
  card:         CardWithOwner;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  employees:    Employee[];
  columns:      KanbanColumn[];
  onUpdate:     (data: Partial<KanbanCard>) => void;
  onDelete:     () => void;
  t:            typeof T.uz;
}) {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]                       = useState("main");
  const [newChatMessage, setNewChatMessage]             = useState("");
  const [newChecklistTitle, setNewChecklistTitle]       = useState("");
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState<Record<string, string>>({});
  const [expandedChecklists, setExpandedChecklists]     = useState<Record<string, boolean>>({});
  const [newTagName, setNewTagName]                     = useState("");
  const [resultText, setResultText]                     = useState("");
  const [taskRating, setTaskRating]                     = useState<number>(0);
  const [hoveredRating, setHoveredRating]               = useState<number>(0);
  const [chatFiles, setChatFiles]                       = useState<File[]>([]);
  const [showHiddenFields, setShowHiddenFields]         = useState(false);
  const [showCompleteDialog, setShowCompleteDialog]     = useState(false);
  const [completionReport, setCompletionReport]         = useState("");

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: checklists = [],  refetch: refetchChecklists } = useQuery<ChecklistWithItems[]>({
    queryKey: ["/api/kanban/cards", card.id, "checklists"], enabled: open,
  });
  const { data: chatMessages = [], refetch: refetchChat } = useQuery<ChatMessageWithUser[]>({
    queryKey: ["/api/kanban/cards", card.id, "chat"], enabled: open,
  });
  const { data: files = [],   refetch: refetchFiles }   = useQuery<TaskFile[]>({
    queryKey: ["/api/kanban/cards", card.id, "files"], enabled: open,
  });
  const { data: results = [], refetch: refetchResults } = useQuery<ResultWithFiles[]>({
    queryKey: ["/api/kanban/cards", card.id, "results"], enabled: open,
  });
  const { data: tags = [],    refetch: refetchTags }    = useQuery<TaskTag[]>({
    queryKey: ["/api/kanban/cards", card.id, "tags"], enabled: open,
  });
  const { data: observers = [],   refetch: refetchObservers }   = useQuery<ObserverWithUser[]>({
    queryKey: ["/api/kanban/cards", card.id, "observers"], enabled: open,
  });
  const { data: coExecutors = [], refetch: refetchCoExecutors } = useQuery<CoExecutorWithUser[]>({
    queryKey: ["/api/kanban/cards", card.id, "co-executors"], enabled: open,
  });
  const cardBoardId = card.boardId ?? getProp<string>(card, "board_id");
  const { data: allCards = [] } = useQuery<CardWithOwner[]>({
    queryKey: ["/api/kanban/boards", cardBoardId, "cards"], enabled: open && !!cardBoardId,
  });
  const { data: projects = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/kanban/projects"], enabled: open,
  });
  const { data: deals = [] } = useQuery<{ id: string; name: string; amount: number }[]>({
    queryKey: ["/api/crm/deals"], enabled: open,
  });

  // ── Mutations (via custom hook) ───────────────────────────────────────────
  const m = useTaskDetailMutations(card, columns, checklists.length,
    { refetchChecklists, refetchChat, refetchFiles, refetchResults, refetchTags, refetchObservers, refetchCoExecutors },
    { setNewChecklistTitle, setNewChecklistItemTitle, setNewChatMessage, setChatFiles, setNewTagName, setResultText, setShowCompleteDialog, setCompletionReport },
  );

  // ── File-input handler ────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) Array.from(selected).forEach(f => m.uploadFileMutation.mutate(f));
    e.target.value = "";
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const isCompleted = !!(card.completedAt ?? getProp<string>(card, "completed_at"));
  const isAccepted  = !!(card.acceptedAt  ?? getProp<string>(card, "accepted_at"));
  const activeTrack = card.activeTimeTrack ?? getProp<typeof card.activeTimeTrack>(card, "active_time_track");
  const isTracking  = !!activeTrack;
  const ownerName   = card.owner ? getPersonName(card.owner) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col bg-background">
        {/* a11y: SheetTitle screen-reader uchun majburiy */}
        <SheetHeader className="sr-only">
          <SheetTitle>Vazifa tafsilotlari: {card.title}</SheetTitle>
        </SheetHeader>

        <TaskDetailSheetHeader
          card={card} onOpenChange={onOpenChange} onUpdate={onUpdate}
          isCompleted={isCompleted} isAccepted={isAccepted}
          isTracking={isTracking} ownerName={ownerName}
        />

        {/* Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none px-4 flex-shrink-0 bg-muted/30 border-b h-10">
              {([
                { value: "main",      label: t.tabs.main },
                { value: "checklist", label: t.tabs.checklist },
                { value: "results",   label: t.tabs.results },
                { value: "files",     label: t.tabs.files },
                { value: "chat",      label: "Izohlar" },
              ] as const).map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1" data-testid={`tab-${tab.value}`}>
                  {tab.label}
                  {tab.value === "chat" && chatMessages.length > 0 && (
                    <span className="ml-1 text-[9px] bg-blue-100 text-[var(--ep-blue)] rounded-full px-1.5">{chatMessages.length}</span>
                  )}
                  {tab.value === "checklist" && checklists.length > 0 && (
                    <span className="ml-1 text-[9px] bg-emerald-100 text-[var(--ep-green)] rounded-full px-1.5">{checklists.reduce((s, cl) => s + (cl.items?.length ?? 0), 0)}</span>
                  )}
                  {tab.value === "files" && files.length > 0 && (
                    <span className="ml-1 text-[9px] bg-amber-100 text-[var(--ep-yellow)] rounded-full px-1.5">{files.length}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollArea className="flex-1 bg-background">
              <TabsContent value="main" className="m-0 p-4">
                <div style={{ marginBottom: 16 }}>
                  <TimeTrackingWidget card={card} onStart={() => m.startTimeMutation.mutate()} onStop={() => m.stopTimeMutation.mutate()} t={t} />
                </div>
                <MainTabContent
                  card={card} employees={employees} observers={observers} coExecutors={coExecutors}
                  tags={tags} allCards={allCards} projects={projects} deals={deals}
                  onUpdate={onUpdate}
                  onAddObserver={userId => m.addObserverMutation.mutate(userId)}
                  onRemoveObserver={id => m.removeObserverMutation.mutate(id)}
                  onAddCoExecutor={userId => m.addCoExecutorMutation.mutate(userId)}
                  onRemoveCoExecutor={id => m.removeCoExecutorMutation.mutate(id)}
                  onAddTag={name => m.addTagMutation.mutate(name)}
                  onRemoveTag={id => m.removeTagMutation.mutate(id)}
                  onStartTime={() => m.startTimeMutation.mutate()}
                  onStopTime={() => m.stopTimeMutation.mutate()}
                  newTagName={newTagName} onNewTagNameChange={setNewTagName}
                  showHiddenFields={showHiddenFields} onToggleHiddenFields={() => setShowHiddenFields(v => !v)}
                  taskRating={taskRating} onTaskRatingChange={setTaskRating}
                  hoveredRating={hoveredRating} onHoveredRatingChange={setHoveredRating}
                  t={t}
                />
              </TabsContent>

              <TabsContent value="checklist" className="m-0 p-4">
                <ChecklistTabContent
                  checklists={checklists}
                  newChecklistTitle={newChecklistTitle} onNewChecklistTitleChange={setNewChecklistTitle}
                  onAddChecklist={title => m.addChecklistMutation.mutate(title)}
                  expandedChecklists={expandedChecklists}
                  onToggleExpanded={(id, val) => setExpandedChecklists(p => ({ ...p, [id]: val }))}
                  newChecklistItemTitle={newChecklistItemTitle}
                  onNewItemTitleChange={(clId, val) => setNewChecklistItemTitle(p => ({ ...p, [clId]: val }))}
                  onAddItem={(clId, title) => m.addChecklistItemMutation.mutate({ checklistId: clId, title })}
                  onToggleItem={id => m.toggleChecklistItemMutation.mutate(id)}
                  onDeleteChecklist={id => m.deleteChecklistMutation.mutate(id)}
                  isDeleting={m.deleteChecklistMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="results" className="m-0 p-4">
                <ResultsTabContent
                  results={results} resultText={resultText} onResultTextChange={setResultText}
                  onAddResult={text => m.addResultMutation.mutate(text)}
                  onUploadResultFile={(resultId, file) => m.uploadResultFileMutation.mutate({ resultId, file })}
                  onDeleteResultFile={fileId => m.deleteResultFileMutation.mutate(fileId)}
                  isUploadingResultFile={m.uploadResultFileMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="files" className="m-0 p-4">
                <FilesTabContent
                  files={files} cardId={card.id ?? ""}
                  onFileSelect={handleFileSelect}
                  onDeleteFile={fileId => m.deleteFileMutation.mutate(fileId)}
                  isUploading={m.uploadFileMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="chat" className="m-0" style={{ height: "100%", minHeight: 400 }}>
                <ChatPanel
                  chatMessages={chatMessages}
                  newChatMessage={newChatMessage} onNewChatMessageChange={setNewChatMessage}
                  onSendMessage={data => m.sendChatMutation.mutate(data)}
                  isSending={m.sendChatMutation.isPending}
                  onCreateTaskFromMessage={m.createTaskFromMessage}
                  chatFiles={chatFiles} onChatFilesChange={setChatFiles}
                  t={t}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <TaskDetailSheetActions
          isTracking={isTracking} isCompleted={isCompleted} isAccepted={isAccepted}
          onStartTime={() => m.startTimeMutation.mutate()}
          onStopTime={() => m.stopTimeMutation.mutate()}
          isTimerPending={m.startTimeMutation.isPending || m.stopTimeMutation.isPending}
          onAccept={() => m.acceptTaskMutation.mutate()}
          isAcceptPending={m.acceptTaskMutation.isPending}
          onOpenComplete={() => setShowCompleteDialog(true)}
          isCompletePending={m.completeTaskMutation.isPending}
          onTabChange={setActiveTab}
          onDelete={onDelete}
          showCompleteDialog={showCompleteDialog}
          onCompleteDialogChange={setShowCompleteDialog}
          completionReport={completionReport}
          onCompletionReportChange={setCompletionReport}
          onConfirmComplete={() => m.completeTaskMutation.mutate(completionReport)}
          t={t}
        />
      </SheetContent>
    </Sheet>
  );
}
