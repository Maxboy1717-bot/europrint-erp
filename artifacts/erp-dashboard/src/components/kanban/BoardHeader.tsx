import { Plus, ChevronDown, ListTodo, FolderKanban, FileText, Users, AlertTriangle, MessageSquare, Bell, Bot, GitBranch, TrendingUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { NotificationsPanel } from "../../pages/kanban/NotificationsPanel";
import {
  KanbanBoardType,
  KanbanColumn,
  KanbanTranslations,
  KanbanTemplate,
  RoleFilter,
  FilterState,
  ViewMode,
} from "./types";

interface BoardHeaderProps {
  t: KanbanTranslations;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  templates: KanbanTemplate[];
  selectedBoardId: string | null;
  setSelectedBoardId: (id: string | null) => void;
  columns: KanbanColumn[];
  createCardMutation: { mutate: (vars: Record<string, unknown>) => void; isPending: boolean };
  setQuickTaskType: (type: "task" | "project" | "template") => void;
  setShowQuickTask: (show: boolean) => void;
  roleFilter: RoleFilter;
  setRoleFilter: (role: RoleFilter) => void;
  filters: FilterState;
  setFilters: (update: (f: FilterState) => FilterState) => void;
  overdueCount: number;
  newCommentsCount: number;
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  setShowRobots: (show: boolean) => void;
  setShowFlows: (show: boolean) => void;
  setShowReports: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  boards: KanbanBoardType[];
  setShowCreateBoard: (show: boolean) => void;
  hasActiveFilters: boolean;
}

export function BoardHeader({
  t,
  templates,
  selectedBoardId,
  setSelectedBoardId,
  columns,
  createCardMutation,
  setQuickTaskType,
  setShowQuickTask,
  roleFilter,
  setRoleFilter,
  filters,
  setFilters,
  overdueCount,
  newCommentsCount,
  unreadCount,
  showNotifications,
  setShowNotifications,
  setShowRobots,
  setShowFlows,
  setShowReports,
  setShowTemplates,
  boards,
  setShowCreateBoard,
  hasActiveFilters,
}: BoardHeaderProps) {
  const clearFilters = () => setFilters(() => ({
    search: "",
    columnId: null,
    priority: null,
    assigneeId: null,
    overdue: false,
    hasNewComments: false,
    tagId: null,
    tagName: null,
  }));

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 flex-shrink-0 rounded-2xl mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Tabs are handled in parent for now, but header controls can be here */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 min-h-[52px] min-w-[180px] px-8 text-lg font-semibold" data-testid="button-create-dropdown">
                  <Plus className="h-6 w-6 mr-3" />
                  {t.create.createNew}
                  <ChevronDown className="h-6 w-6 ml-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => { setQuickTaskType("task"); setShowQuickTask(true); }} data-testid="menu-create-task">
                  <ListTodo className="h-4 w-4 mr-2" />
                  {t.create.task}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setQuickTaskType("project"); setShowQuickTask(true); }} data-testid="menu-create-project">
                  <FolderKanban className="h-4 w-4 mr-2" />
                  {t.create.project}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{t.create.template}</p>
                  <div className="space-y-1">
                    {templates.length > 0 ? (
                      templates.slice(0, 5).map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover-elevate cursor-pointer"
                          onClick={() => {
                            if (selectedBoardId && columns.length > 0) {
                              createCardMutation.mutate({
                                title: template.title,
                                columnId: columns[0].id,
                                sortOrder: 0,
                                priority: template.priority || "normal",
                              });
                            }
                          }}
                          data-testid={`template-${template.id}`}
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{template.title}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground px-2 py-1">Shablonlar yo'q</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setQuickTaskType("template"); setShowQuickTask(true); }} data-testid="menu-create-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Yangi shablon yaratish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="w-[200px] min-h-[48px] bg-blue-700/50 border-blue-400/30 text-white text-base" data-testid="select-role-filter">
                <Users className="h-6 w-6 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base py-3">{t.roles.all}</SelectItem>
                <SelectItem value="executor" className="text-base py-3">{t.roles.executor}</SelectItem>
                <SelectItem value="creator" className="text-base py-3">{t.roles.creator}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filters.overdue ? "default" : "ghost"}
              className={`min-h-[48px] px-6 text-base font-semibold ${filters.overdue ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-700/50 text-white hover:bg-blue-700/70 border-0"}`}
              onClick={() => setFilters(f => ({ ...f, overdue: !f.overdue }))}
              data-testid="button-filter-overdue"
            >
              <AlertTriangle className="h-6 w-6 mr-2" />
              {t.filters.overdue} ({overdueCount})
              {filters.overdue && <X className="h-5 w-5 ml-2" />}
            </Button>

            <Button
              variant={filters.hasNewComments ? "default" : "ghost"}
              className={`min-h-[48px] px-6 text-base font-semibold ${filters.hasNewComments ? "bg-blue-400 text-white hover:bg-blue-300" : "bg-blue-700/50 text-white hover:bg-blue-700/70 border-0"}`}
              onClick={() => setFilters(f => ({ ...f, hasNewComments: !f.hasNewComments }))}
              data-testid="button-filter-comments"
            >
              <MessageSquare className="h-6 w-6 mr-2" />
              {t.filters.newComments} ({newCommentsCount})
              {filters.hasNewComments && <X className="h-5 w-5 ml-2" />}
            </Button>

            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 bg-blue-700/50 text-white hover:bg-blue-700/70" data-testid="button-notifications">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-sm text-white flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} t={t} />
            </Popover>

            <Button variant="ghost" className="h-12 w-12 bg-blue-700/50 text-white hover:bg-blue-700/70" onClick={() => setShowRobots(true)} data-testid="button-robots">
              <Bot className="h-6 w-6" />
            </Button>

            <Button variant="ghost" className="h-12 w-12 bg-blue-700/50 text-white hover:bg-blue-700/70" onClick={() => setShowFlows(true)} data-testid="button-flows">
              <GitBranch className="h-6 w-6" />
            </Button>

            <Button variant="ghost" className="h-12 w-12 bg-blue-700/50 text-white hover:bg-blue-700/70" onClick={() => setShowReports(true)} data-testid="button-reports">
              <TrendingUp className="h-6 w-6" />
            </Button>

            <Button variant="ghost" className="h-12 w-12 bg-blue-700/50 text-white hover:bg-blue-700/70" onClick={() => setShowTemplates(true)} data-testid="button-templates">
              <FileText className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 bg-surface-container-lowest/10 rounded-xl px-5 py-4">
        <Select value={selectedBoardId || ""} onValueChange={setSelectedBoardId}>
          <SelectTrigger className="w-[240px] min-h-[48px] bg-surface-container-lowest/20 border-white/30 text-white text-base" data-testid="select-board">
            <SelectValue placeholder={t.empty.selectBoard} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(boards) ? boards : []).map((board) => (
              <SelectItem key={board.id} value={board.id} className="text-base py-3">{board.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" className="min-h-[48px] px-6 bg-surface-container-lowest/20 text-white hover:bg-surface-container-lowest/30 border-0 text-base font-semibold" onClick={() => setShowCreateBoard(true)} data-testid="button-new-board">
          <Plus className="h-6 w-6 mr-2" />
          {t.board.newBoard}
        </Button>

        <div className="flex-1" />

        <div className="relative w-80 bg-surface-container-lowest/20 rounded-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white/60" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Qidirish..."
            className="min-h-[48px] pl-12 bg-surface-container-lowest/20 border-white/30 text-white placeholder:text-white/60 text-base"
            data-testid="input-search"
          />
          {filters.search && (
            <Button
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white hover:bg-surface-container-lowest/20"
              onClick={() => setFilters(f => ({ ...f, search: "" }))}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {filters.tagId && filters.tagName && (
          <Badge
            className="cursor-pointer bg-surface-container-lowest/20 text-white border-0 hover:bg-surface-container-lowest/30"
            onClick={() => setFilters(f => ({ ...f, tagId: null, tagName: null }))}
            data-testid="badge-tag-filter"
          >
            Teg: {filters.tagName}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="text-white hover:bg-surface-container-lowest/20" onClick={clearFilters} data-testid="button-clear-filters">
            {t.filters.clear}
          </Button>
        )}
      </div>
    </div>
  );
}
