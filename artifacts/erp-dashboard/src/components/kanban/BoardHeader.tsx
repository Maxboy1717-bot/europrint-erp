/**
 * @module BoardHeader
 * @description React UI component.
 */

import {
  Plus, ChevronDown, ListTodo, FolderKanban, FileText, Users,
  AlertTriangle, MessageSquare, Bell, Bot, GitBranch, TrendingUp, Search, X, Trash2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { NotificationsPanel } from "../../pages/kanban/NotificationsPanel";
import {
  KanbanBoardType, KanbanColumn, KanbanTranslations,
  KanbanTemplate, RoleFilter, FilterState, ViewMode,
} from "./types";

// ── Neumorphic soya ─────────────────────────────────────────────────────────
const SHADOW = "6px 6px 16px rgba(163,177,198,0.50), -4px -4px 12px rgba(255,255,255,0.80)";
const BTN_SHADOW = "3px 3px 8px rgba(163,177,198,0.40), -2px -2px 6px rgba(255,255,255,0.80)";
const BTN_SHADOW_HOVER = "5px 5px 12px rgba(163,177,198,0.55), -3px -3px 8px rgba(255,255,255,0.90)";
const INPUT_SHADOW = "inset 2px 2px 6px rgba(163,177,198,0.30), inset -2px -2px 6px rgba(255,255,255,0.70)";

// ── Kichik tugma komponenti ──────────────────────────────────────────────────
function NeuBtn({
  children, onClick, active = false, danger = false, title, testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  title?: string;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-testid={testId}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 12,
        border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 500,
        background: active
          ? (danger ? "#F08080" : "#5B9BD5")
          : "#FFFFFF",
        color: active ? "#FFFFFF" : (danger ? "#C05050" : "#718096"),
        boxShadow: active ? `3px 3px 8px ${danger ? "rgba(240,128,128,0.4)" : "rgba(91,155,213,0.4)"}` : BTN_SHADOW,
        transition: "all 0.18s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW_HOVER;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = active
          ? `3px 3px 8px ${danger ? "rgba(240,128,128,0.4)" : "rgba(91,155,213,0.4)"}`
          : BTN_SHADOW;
      }}
    >
      {children}
    </button>
  );
}

// ── Icon tugma (kvadrat) ─────────────────────────────────────────────────────
function IconBtn({
  children, onClick, badge, title, testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  title?: string;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-testid={testId}
      className="relative"
      style={{
        width: 40, height: 40, borderRadius: 12,
        border: "none", cursor: "pointer",
        background: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: BTN_SHADOW,
        transition: "all 0.18s",
        color: "#718096",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW_HOVER; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW; }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className="absolute flex items-center justify-center text-white rounded-full"
          style={{
            top: -4, right: -4,
            width: 16, height: 16,
            background: "#F08080",
            fontSize: 9, fontWeight: 700,
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

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
  setFilters: (update: FilterState | ((f: FilterState) => FilterState)) => void;
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
  onDeleteBoard: (boardId: string) => void;
}

export function BoardHeader({
  t, templates, selectedBoardId, setSelectedBoardId,
  columns, createCardMutation, setQuickTaskType, setShowQuickTask,
  roleFilter, setRoleFilter, filters, setFilters,
  overdueCount, newCommentsCount, unreadCount,
  showNotifications, setShowNotifications,
  setShowRobots, setShowFlows, setShowReports, setShowTemplates,
  boards, setShowCreateBoard, hasActiveFilters, onDeleteBoard,
}: BoardHeaderProps) {
  const clearFilters = () => setFilters(() => ({
    search: "", columnId: null, priority: null, assigneeId: null,
    overdue: false, hasNewComments: false, tagId: null, tagName: null,
  }));

  return (
    <div
      className="flex-shrink-0 mb-4"
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        padding: "18px 20px 14px",
        boxShadow: SHADOW,
      }}
    >
      {/* ── Birinchi qator: sarlavha + boshqaruv tugmalari ──────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sarlavha */}
        <h1
          className="mr-2"
          style={{ fontSize: 22, fontWeight: 700, color: "#2D3748", letterSpacing: "-0.01em" }}
        >
          Kanban doskasi
        </h1>

        {/* Yangi vazifa dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="button-create-dropdown"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 12,
                border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600,
                background: "#5B9BD5", color: "#FFFFFF",
                boxShadow: "4px 4px 12px rgba(91,155,213,0.40)",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 16px rgba(91,155,213,0.55)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 12px rgba(91,155,213,0.40)"; }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              {t.create?.createNew ?? "Yangi yaratish"}
              <ChevronDown style={{ width: 14, height: 14 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
            <DropdownMenuItem onClick={() => { setQuickTaskType("task"); setShowQuickTask(true); }} data-testid="menu-create-task">
              <ListTodo className="h-4 w-4 mr-2" />
              {t.create?.task ?? "Vazifa"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setQuickTaskType("project"); setShowQuickTask(true); }} data-testid="menu-create-project">
              <FolderKanban className="h-4 w-4 mr-2" />
              {t.create?.project ?? "Loyiha"}
            </DropdownMenuItem>
            {templates.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{t.create?.template ?? "Shablonlar"}</p>
                  <div className="space-y-0.5">
                    {templates.slice(0, 5).map(tmpl => (
                      <div
                        key={tmpl.id}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => {
                          if (selectedBoardId && columns.length > 0) {
                            createCardMutation.mutate({
                              title: tmpl.title, columnId: columns[0].id,
                              sortOrder: 0, priority: tmpl.priority || "normal",
                            });
                          }
                        }}
                        data-testid={`template-${tmpl.id}`}
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate text-xs">{tmpl.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setQuickTaskType("template"); setShowQuickTask(true); }} data-testid="menu-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Yangi shablon
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rol filtri */}
        <div style={{ position: "relative" }}>
          <Select value={roleFilter} onValueChange={v => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger
              className="w-full sm:w-[160px] h-9"
              data-testid="select-role-filter"
              style={{
                borderRadius: 12, border: "none",
                background: "#FFFFFF", color: "#718096", fontSize: 13,
                boxShadow: BTN_SHADOW, height: 40,
              }}
            >
              <Users style={{ width: 14, height: 14, marginRight: 6 }} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.roles?.all ?? "Hammasi"}</SelectItem>
              <SelectItem value="executor">{t.roles?.executor ?? "Ijrochi"}</SelectItem>
              <SelectItem value="creator">{t.roles?.creator ?? "Yaratuvchi"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kechikkan filter */}
        <NeuBtn
          active={filters.overdue}
          danger
          onClick={() => setFilters(f => ({ ...f, overdue: !f.overdue }))}
          testId="button-filter-overdue"
        >
          <AlertTriangle style={{ width: 14, height: 14 }} />
          Kechikkan ({overdueCount})
          {filters.overdue && <X style={{ width: 12, height: 12 }} />}
        </NeuBtn>

        {/* Yangi izohlar filter */}
        <NeuBtn
          active={filters.hasNewComments}
          onClick={() => setFilters(f => ({ ...f, hasNewComments: !f.hasNewComments }))}
          testId="button-filter-comments"
        >
          <MessageSquare style={{ width: 14, height: 14 }} />
          Izohlar ({newCommentsCount})
          {filters.hasNewComments && <X style={{ width: 12, height: 12 }} />}
        </NeuBtn>

        {/* Bildirishnomalar */}
        <Popover open={showNotifications} onOpenChange={setShowNotifications}>
          <PopoverTrigger asChild>
            <span>
              <IconBtn badge={unreadCount} title="Bildirishnomalar" testId="button-notifications">
                <Bell style={{ width: 16, height: 16 }} />
              </IconBtn>
            </span>
          </PopoverTrigger>
          <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} t={t} />
        </Popover>

        {/* Robotlar */}
        <IconBtn onClick={() => setShowRobots(true)} title="Robotlar" testId="button-robots">
          <Bot style={{ width: 16, height: 16 }} />
        </IconBtn>

        {/* Oqimlar */}
        <IconBtn onClick={() => setShowFlows(true)} title="Oqimlar" testId="button-flows">
          <GitBranch style={{ width: 16, height: 16 }} />
        </IconBtn>

        {/* Hisobotlar */}
        <IconBtn onClick={() => setShowReports(true)} title="Hisobotlar" testId="button-reports">
          <TrendingUp style={{ width: 16, height: 16 }} />
        </IconBtn>

        {/* Shablonlar */}
        <IconBtn onClick={() => setShowTemplates(true)} title="Shablonlar" testId="button-templates">
          <FileText style={{ width: 16, height: 16 }} />
        </IconBtn>
      </div>

      {/* ── Ikkinchi qator: Doska tanlash + Qidiruv ─────────────── */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {/* Doska tanlash */}
        <Select value={selectedBoardId ? String(selectedBoardId) : ""} onValueChange={setSelectedBoardId}>
          <SelectTrigger
            className="w-full sm:w-[220px] h-9"
            data-testid="select-board"
            style={{
              borderRadius: 12, border: "none",
              background: "#EEF2F7", color: "#2D3748", fontSize: 13,
              boxShadow: INPUT_SHADOW, height: 40,
            }}
          >
            <SelectValue placeholder={t.empty?.selectBoard ?? "Doska tanlang"} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(boards) ? boards : []).map(b => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Yangi doska */}
        <NeuBtn onClick={() => setShowCreateBoard(true)} testId="button-new-board">
          <Plus style={{ width: 14, height: 14 }} />
          {t.board?.newBoard ?? "Yangi doska"}
        </NeuBtn>

        {/* Doskani o'chirish */}
        {selectedBoardId && (
          <button
            title="Doskani o'chirish"
            data-testid="button-delete-board"
            onClick={() => {
              const board = boards.find(b => String(b.id) === String(selectedBoardId));
              const name = board?.name ?? "bu doska";
              if (window.confirm(`"${name}" doskasini o'chirasizmi? Barcha ustunlar va kartalar ham o'chadi.`)) {
                onDeleteBoard(String(selectedBoardId));
              }
            }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.7)",
              boxShadow: BTN_SHADOW,
              color: "#EF4444",
              transition: "box-shadow 0.18s, background 0.18s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW_HOVER; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.7)"; (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW; }}
          >
            <Trash2 style={{ width: 15, height: 15 }} />
          </button>
        )}

        <div className="flex-1 min-w-[20px]" />

        {/* Qidiruv */}
        <div className="relative" style={{ width: 280 }}>
          <Search
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#A0AEC0" }}
          />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Qidirish..."
            data-testid="input-search"
            style={{
              width: "100%", height: 40,
              paddingLeft: 36, paddingRight: filters.search ? 36 : 14,
              borderRadius: 12, border: "none",
              background: "#EEF2F7", color: "#2D3748",
              fontSize: 13, outline: "none",
              boxShadow: INPUT_SHADOW,
              transition: "box-shadow 0.18s",
            }}
            onFocus={e => { (e.target as HTMLElement).style.boxShadow = "inset 3px 3px 8px rgba(163,177,198,0.40), inset -2px -2px 6px rgba(255,255,255,0.70), 0 0 0 2px rgba(91,155,213,0.25)"; }}
            onBlur={e  => { (e.target as HTMLElement).style.boxShadow = INPUT_SHADOW; }}
          />
          {filters.search && (
            <button
              onClick={() => setFilters(f => ({ ...f, search: "" }))}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#A0AEC0",
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>

        {/* Teg filtri badge */}
        {filters.tagId && filters.tagName && (
          <button
            onClick={() => setFilters(f => ({ ...f, tagId: null, tagName: null }))}
            data-testid="badge-tag-filter"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 8,
              border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 500, color: "#5B9BD5",
              background: "rgba(91,155,213,0.12)",
            }}
          >
            Teg: {filters.tagName}
            <X style={{ width: 11, height: 11 }} />
          </button>
        )}

        {/* Filtrlarni tozalash */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            data-testid="button-clear-filters"
            style={{
              fontSize: 12, color: "#F08080", background: "none",
              border: "none", cursor: "pointer", fontWeight: 500,
            }}
          >
            {t.filters?.clear ?? "Filtrlarni tozalash"}
          </button>
        )}
      </div>
    </div>
  );
}
